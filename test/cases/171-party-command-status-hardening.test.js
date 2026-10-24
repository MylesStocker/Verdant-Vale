'use strict';
const assert=require('assert/strict');
const H=require('./170-party-command-rounds.test');
const {fresh,command,resolve,J,ids,canonical,state,rejects,frozen,contract,HIT}=H;
const checks=[],test=(name,run)=>checks.push({name,run});
// Test-only fixtures; no authored characters, items or encounters are installed.
const slitherParty=n=>({allies:n,party:Array.from({length:n},()=>({statuses:['slither']})),
  slither:Array.from({length:n},(_,slot)=>({slot,speed:5}))});
function sampled(g,c,samples,order,execution) {
  const [allies,enemies]=ids(g),view=J(g,'combatPlayerState.getCommandView()');let at=0;
  const pool=[...c.allyActions.map(a=>{const m=view.party.find(m=>m.instanceId===a.actorId);
    return {id:a.actorId,weight:m.statuses.includes('slither')&&['attack','observe'].includes(a.type)?Math.floor(samples[at++]*20)+1:m.effective.spd};}),
    ...c.enemyActions.map(a=>({id:a.actorId,weight:Math.max(1,view.enemies.find(m=>m.instanceId===a.actorId).spd)}))];
  assert.equal(at,samples.length);
  const ordered=order?order.map(id=>(id[0]==='a'?allies:enemies)[Number(id.slice(1))]):pool.map(a=>a.id),initiative=[];
  for(const id of ordered.slice(0,-1)){const i=pool.findIndex(a=>a.id===id);assert.ok(i>=0);
    initiative.push((pool.slice(0,i).reduce((s,a)=>s+a.weight,0)+pool[i].weight/2)/pool.reduce((s,a)=>s+a.weight,0));pool.splice(i,1);}
  const tape=[...samples,...initiative,...execution];
  g.run(`var command=${JSON.stringify(c)},tape=${JSON.stringify(tape)},used=[];
    Math.random=()=>{if(used.length===tape.length)throw Error('exhausted status tape');return tape[used.push(tape[used.length])-1];};
    var result=combatPlayerState.resolveRound(command);`);
  assert.deepEqual(J(g,'used'),tape);const r=J(g,'result');frozen(g.run('result'));contract(r);return r;
}
const attacks=r=>r.events.filter(e=>e.type==='attack');
const curses=r=>r.events.filter(e=>e.type==='curse_check');
const samples=r=>r.events.filter(e=>e.type==='slither_sample');

test('ordinary Attack result has no status metadata and matches the compatibility authority',()=>{
  const g=fresh(),r=resolve(g,command(g));assert.equal(curses(r).length,0);assert.equal(samples(r).length,0);
  assert.ok(r.after.effects.every(e=>!Object.hasOwn(e,'slither')));
  // This comparison retains all existing damage, identity, initiative and HP fields.
  const old=fresh({legacy:true}),c=command(old),tape=J(g,'tape');
  old.run(`var tape=${JSON.stringify(tape)};Math.random=()=>tape.shift();var result=combatPlayerState.resolveAttackRound(${JSON.stringify({...c,type:'attack-round',allyActions:c.allyActions.map(({type,...a})=>a)})});`);
  const prior=J(old,'result');assert.deepEqual(r.initiative,prior.initiative);
  assert.deepEqual(attacks(r).map(({commandType,...a})=>a),attacks(prior));assert.equal(old.run('tape.length'),0);
});
for(const [roll,fumbled]of [[0,true],[0.249999,true],[0.25,false],[0.99,false]])test('Curse-first boundary '+roll,()=>{
  const g=fresh({allies:1,enemies:1,party:[{statuses:['cursed']}]}),before=canonical(g);
  const r=resolve(g,command(g),null,[roll,...(fumbled?[]:HIT),...HIT]);
  assert.deepEqual(curses(r),[{type:'curse_check',actorId:ids(g)[0][0],targetId:ids(g)[1][0],side:'ally',slot:0,status:'cursed',round:1,chance:0.25,roll,fumbled}]);
  assert.equal(r.events[0].type,'curse_check');assert.equal(r.events[1].type,'attack');
  assert.equal(attacks(r)[0].attemptedDamage,fumbled?1:7);assert.equal(attacks(r)[0].critical,false);assert.equal(attacks(r)[0].evaded,false);
  assert.equal(g.run('used.length'),1+(fumbled?1:4)+3);assert.equal(canonical(g),before);
});
test('Curse proceed retains variance then critical then evasion, distinct from a fumble',()=>{
  const g=fresh({allies:1,enemies:1,party:[{statuses:['cursed']}]}),r=resolve(g,command(g),null,[0.8,0.5,0,0,...HIT]);
  assert.equal(curses(r)[0].fumbled,false);assert.equal(attacks(r)[0].critical,true);assert.equal(attacks(r)[0].evaded,true);assert.equal(attacks(r)[0].appliedDamage,0);
});
test('dead Cursed actor skips without Curse or Attack draws',()=>{
  const g=fresh({party:[{hp:1,statuses:['cursed']},{}]}),r=resolve(g,command(g),['e0','a0','a1','e1'],[...HIT,...HIT,...HIT]);
  assert.equal(curses(r).length,0);assert.equal(r.events[1].reason,'actor_dead');assert.equal(r.party[0].hp,0);
});
test('dead committed target cancels Cursed Attack without Curse or Attack draws',()=>{
  const g=fresh({inventory:['Sapper Charge'],party:[{},{statuses:['cursed']}],enemy:[{hp:20},{}]});
  const r=resolve(g,command(g,[['item',0,0,'Sapper Charge'],['attack',1,0]]),null,HIT);
  assert.equal(curses(r).length,0);assert.equal(r.events.find(e=>e.type==='cancel').reason,'target_dead');
});
test('earlier ally cure removes Curse before the later Attack check',()=>{
  const g=fresh({inventory:['Amethyst Dust'],party:[{},{statuses:['cursed']}]}),r=resolve(g,command(g,[['item',0,'a1','Amethyst Dust'],['attack',1,0]]));
  assert.equal(curses(r).length,0);assert.deepEqual(r.party[1].statuses,[]);assert.equal(attacks(r).length,3);
});
test('multiple Cursed actors check independently and do not consume unrelated items',()=>{
  const g=fresh({inventory:['Potion'],party:[{statuses:['cursed']},{statuses:['cursed']}]}),r=resolve(g,command(g),null,[0.1,0.8,...HIT,...HIT,...HIT]);
  assert.deepEqual(curses(r).map(e=>[e.slot,e.fumbled]),[[0,true],[1,false]]);assert.deepEqual(r.after.inventory,['Potion']);
});
test('one-damage fumble can end the round, with no unused enemy draws',()=>{
  const g=fresh({allies:1,enemies:1,party:[{statuses:['cursed']}],enemy:[{hp:1}]}),r=resolve(g,command(g),null,[0.1]);
  assert.equal(r.outcome,'victory');assert.equal(attacks(r)[0].appliedDamage,1);assert.equal(r.round,1);assert.equal(g.run('used.length'),2);
});

for(let n=1;n<=3;n++)test(n+' Slither allies each sample exactly once before initiative; 3v3 uses five initiative draws',()=>{
  const g=fresh({...slitherParty(n),enemies:n}),c=command(g),draws=[0,0.5,0.999].slice(0,n),before=canonical(g);
  const r=sampled(g,c,draws,null,Array.from({length:n*2},()=>HIT).flat());
  assert.deepEqual(samples(r).map(e=>[e.slot,e.roll,e.speedAfter]),draws.map((d,slot)=>[slot,d,Math.floor(d*20)+1]));
  assert.deepEqual(r.events.slice(0,n),samples(r));assert.equal(r.initiative.length,2*n-1);assert.equal(g.run('used.length'),n+(2*n-1)+6*n);
  assert.deepEqual(r.order.filter(a=>a.side==='ally').map(a=>a.spd),draws.map(d=>Math.floor(d*20)+1));
  for(const [slot,e]of r.after.effects.entries())assert.deepEqual(e.slither,{speed:Math.floor(draws[slot]*20)+1,round:1,roll:draws[slot],source:'attack'});
  assert.equal(canonical(g),before);
});
test('reversed command records still sample in stable ally slot order',()=>{
  const g=fresh({...slitherParty(3),enemies:3}),c=command(g);c.allyActions.reverse();c.enemyActions.reverse();
  // Zeroes force slot-order initiative, after samples 1,11,20; fixed tape is not computed from submission order.
  g.run(`var command=${JSON.stringify(c)},tape=[0,0.5,0.999,0,0,0,0,0,${Array.from({length:6},()=>HIT).flat()}],used=[];Math.random=()=>tape[used.push(tape[used.length])-1];var result=combatPlayerState.resolveRound(command);`);
  const r=J(g,'result');contract(r);assert.deepEqual(samples(r).map(e=>[e.slot,e.speedAfter]),[[0,1],[1,11],[2,20]]);assert.equal(g.run('used.length'),26);
});
test('one sampled Speed governs initiative, incoming evasion and outgoing evasion',()=>{
  const g=fresh({...slitherParty(1),enemies:1}),r=sampled(g,command(g),[0.999],['e0','a0'],[0.5,0.99,0.2,0.5,0.99,0.2]);
  assert.equal(r.order[1].spd,20);assert.equal(r.party[0].effective.spd,20);
  assert.deepEqual(attacks(r).map(e=>e.evaded),[true,false]);assert.equal(samples(r).length,1);
});
test('Observe resamples once; Run and Item retain its owned sample without further status RNG',()=>{
  const g=fresh({...slitherParty(1),enemies:1,inventory:['Potion']}),first=sampled(g,command(g,[['observe',0,0]]),[0.75],null,HIT);
  assert.equal(samples(first)[0].commandType,'observe');assert.equal(first.party[0].effective.spd,16);
  const item=resolve(g,command(g,[['item',0,'a0','Potion']]),null,HIT);assert.equal(samples(item).length,0);assert.equal(item.order[0].spd,16);
  const run=resolve(g,command(g,[['run',0]]),null,[0]);const event=run.events.find(e=>e.type==='run');
  assert.equal(samples(run).length,0);assert.equal(run.order[0].spd,16);assert.equal(event.chance,g.run('speedWinChance(16,10)'));assert.equal(run.outcome,'escape');
});
test('Run actors retain Slither samples and dead Slither members consume no samples',()=>{
  const g=fresh({...slitherParty(3),party:[{statuses:['slither']},{statuses:['slither']},{hp:0,statuses:['slither']}]}),r=resolve(g,command(g,[['run',0],['run',1]]),null,[0]);
  assert.equal(samples(r).length,0);assert.deepEqual(r.after.effects.map(e=>e.slither.speed),[5,5,5]);assert.equal(r.party[2].slot,2);
});
test('alive-at-start Slither actor still owns its planned sample when killed before acting',()=>{
  const g=fresh({...slitherParty(2),party:[{hp:1,statuses:['slither']},{statuses:['slither']}]}),r=sampled(g,command(g),[0,0.5],['e0','a0','a1','e1'],[...HIT,...HIT,...HIT]);
  assert.equal(samples(r).length,2);assert.equal(r.events.find(e=>e.type==='skip').reason,'actor_dead');assert.equal(r.after.effects[0].slither.speed,1);
});
test('Slither has no timed expiry or application exemption; seeded status resamples on first Attack',()=>{
  const g=fresh({...slitherParty(1),enemies:1});
  const first=sampled(g,command(g),[0.5],null,[...HIT,...HIT]);assert.equal(samples(first)[0].speedBefore,5);
  for(let round=2;round<=4;round++){const r=sampled(g,command(g,[['observe',0,0]]),[0.25],null,HIT);
    assert.deepEqual(r.party[0].statuses,['slither']);assert.equal(r.after.effects[0].slither.round,round);}
  const before=state(g);for(let i=0;i<4;i++){g.run('combatPlayerState.getView();combatPlayerState.getCommandView();combatPlayerState.getRoundView()');}assert.equal(state(g),before);
});
test('structural cure removes owned Slither sample without retroactively changing initiative',()=>{
  const g=fresh({inventory:['Reed Remedy'],party:[{},{statuses:['slither']}],slither:[{slot:1,speed:5}]});
  // There is NO authored Slither cure. Redirect an existing cure property in this VM only to exercise shared cleanup.
  g.run("STATUS_CURE_PROPERTIES.curesPoison.status='slither'");
  const r=sampled(g,command(g,[['item',0,'a1','Reed Remedy'],['attack',1,0]]),[0.999],null,[...HIT,...HIT,...HIT]);
  assert.equal(r.order.find(a=>a.side==='ally'&&a.slot===1).spd,20);assert.equal(r.party[1].effective.spd,10);
  assert.deepEqual(r.party[1].statuses,[]);assert.ok(!Object.hasOwn(r.after.effects[1],'slither'));
  resolve(g,command(g));
});
test('unsupported mid-round Slither application fails closed; no invented item or enemy capability',()=>{
  const g=fresh({inventory:['Potion']});g.run('ITEM_REGISTRY.Potion.causesSlither=true;var command='+JSON.stringify(command(g,[['item',0,'a0','Potion'],['observe',1,0]])));
  rejects(g,'combatPlayerState.resolveRound(command)');
});
test('Curse and Slither combine as sample, initiative, Curse, then ordinary action rolls',()=>{
  const g=fresh({...slitherParty(1),enemies:1,party:[{statuses:['slither','cursed']}]}),r=sampled(g,command(g),[0.5],null,[0.1,...HIT]);
  assert.deepEqual(r.events.map(e=>e.type),['slither_sample','curse_check','attack','attack','outcome','round_end']);assert.equal(g.run('used.length'),6);
});
test('malformed command with both statuses consumes zero conditional RNG and mutation',()=>{
  const g=fresh({...slitherParty(2),party:[{statuses:['slither','cursed']},{statuses:['slither','cursed']}]});g.run('var command='+JSON.stringify(command(g))+';command.enemyActions.pop()');rejects(g,'combatPlayerState.resolveRound(command)');
});
test('prospective Slither maximum rejects unsafe cumulative weights before sampling',()=>{
  const g=fresh({allies:1,enemies:1,party:[{statuses:['slither']}],slither:[{slot:0,speed:1}],enemy:[{spd:Number.MAX_SAFE_INTEGER-15}]});
  g.run('var command='+JSON.stringify(command(g)));rejects(g,'combatPlayerState.resolveRound(command)');
});
for(const [label,edit]of Object.entries({missing:'delete seed.slither',duplicate:'seed.slither.push(seed.slither[0])',slot:'seed.slither[0].slot=1',
  zero:'seed.slither[0].speed=0',high:'seed.slither[0].speed=21',unsafe:'seed.slither[0].speed=Infinity',fraction:'seed.slither[0].speed=1.5',
  stale:"seed.slither[0].actorId='combat_party_1'",round:'seed.slither[0].round=1',getter:"Object.defineProperty(seed.slither[0],'speed',{get(){getterCalls++;return 5;}})",
  prototype:'Object.setPrototypeOf(seed.slither[0],{speed:5})',unowned:'seed.members[0].statuses=[]'}))test('invalid Slither seed is atomic: '+label,()=>{
  const g=fresh({...slitherParty(1),enemies:1});g.run('combatPlayerState.clear();var valid=JSON.stringify(seed),getterCalls=0;'+edit);
  const world=canonical(g),enemy=J(g,'combat.enemies');assert.throws(()=>g.run('combatPlayerState.initializeCommandParty(seed)'));
  assert.equal(g.run('rngCalls'),0);assert.equal(g.run('getterCalls'),0);assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('combatPlayerState.getCommandView()'),null);
  assert.equal(canonical(g),world);assert.deepEqual(J(g,'combat.enemies'),enemy);
  g.run('combatPlayerState.initializeCommandParty('+g.run('valid')+')');assert.equal(J(g,'combatPlayerState.getView().members')[0].instanceId,'combat_party_2');
});
test('returned Slither state is frozen, detached and cannot inject stale samples',()=>{
  const g=fresh({...slitherParty(1),enemies:1}),v=g.run('combatPlayerState.getCommandView()');frozen(v);
  assert.throws(()=>{v.effects[0].slither.speed=20;});g.run('seed.slither[0].speed=20');assert.equal(J(g,'combatPlayerState.getCommandView()').effects[0].slither.speed,5);
  const r=sampled(g,command(g),[0.5],null,[...HIT,...HIT]),text=JSON.stringify(r);g.run('combatPlayerState.clear()');assert.equal(JSON.stringify(r),text);
});
test('status RNG failure retains sample evidence and locks the uncertain round without retry',()=>{
  const g=fresh({...slitherParty(1),enemies:1});g.run('var command='+JSON.stringify(command(g))+';var used=0;Math.random=()=>{if(used++)throw Error("status fault");return 0.5}');
  assert.throws(()=>g.run('combatPlayerState.resolveRound(command)'),/status fault/);const v=J(g,'combatPlayerState.getRoundView()');assert.equal(v.phase,'fault');assert.equal(v.completedRounds,0);
  assert.equal(J(g,'combatPlayerState.getCommandView()').effects[0].slither.speed,11);assert.equal(v.failure.completedEvents,1);
  const used=g.run('used');assert.throws(()=>g.run('combatPlayerState.resolveRound(command)'));assert.equal(g.run('used'),used);
});
test('both initializers share membership, identities, HP and cleanup; canonical Lely stays unchanged',()=>{
  const g=fresh({inventory:['Potion']}),world=canonical(g),first=J(g,'combatPlayerState.getView().members');
  rejects(g,'combatPlayerState.initialize(seed.members)');rejects(g,'combatPlayerState.initializeCommandParty(seed)');
  resolve(g,command(g));assert.deepEqual(J(g,'combatPlayerState.getView().members.map(m=>m.hp)'),J(g,'combatPlayerState.getCommandView().party.map(m=>m.hp)'));
  g.run('combatPlayerState.clear();combatPlayerState.initialize(seed.members)');assert.equal(g.run('combatPlayerState.getCommandView()'),null);
  assert.notEqual(J(g,'combatPlayerState.getView().members')[0].instanceId,first[0].instanceId);
  g.run('rngCalls=0;Math.random=()=>{rngCalls++;throw Error()}');rejects(g,'combatPlayerState.initializeCommandParty(seed)');
  g.run('combatPlayerState.clear();combatPlayerState.initializeCommandParty(seed);combatPlayerState.clear()');
  assert.equal(g.run('combatPlayerState.getView().shape'),'single');assert.equal(g.run('combatPlayerState.getCommandView()'),null);assert.equal(g.run('combatPlayerState.getRoundView()'),null);assert.equal(canonical(g),world);
});

// Exhaustive stable-ID matrix, intentionally independent of runtime classification.
const ITEM_MATRIX={
  equip:['Fine Sabre','Balanced Staff','Reinforced Travel Coat','Woven Guard Coat','Bronze Knife','Iron Sword','Leather Armor','Steel Sword','Iron Shield','Swift Bangle','Battle Axe','Dragon Blade','Shadow Cloak','Mithril Shield','Wraithband','Warden Blade','Resonant Targe','Fen Mask','EvadeAll','Cat Armor','Old Boot','Fen Cowl','Bottle of Mushroom Wine','Case of Mushroom Wine','Amethyst Bangle'],
  heal:['Potion','Elixir','Mushroom Wine','River Smelt','Canal Eel','Ember Root'],
  cure:['Reed Remedy','Amethyst Dust'],evade:['Bullet Time'],damage:['Sapper Charge','Throwing Knife'],damage_all:['Void Shard'],bomb:['Bomb'],
  nothing:['Bait'],reagent:['Henbane Sprig','Jackbane Vial'],stun:['Trollbane'],
  unavailable_key:['Old Fishing Rod',"Fen Angler's Rod",'Waxwood Rod','Sealed Letter','Warp Stone','Thank-You Note','Schilling','Cat-Shaped Key','Letter from Netto','Dispatch Letter',"Doctor's Letter","The Drowned's Gift",'Old Engagement Ring','Stashed Gem']};
test('complete item-ID matrix covers every definition and exactly the selectable inventory',()=>{
  const g=fresh(),all=Object.values(ITEM_MATRIX).flat();assert.equal(new Set(all).size,all.length);
  assert.deepEqual(all.sort(),J(g,'Object.keys(ITEM_REGISTRY)').sort());
  g.run('stats.items=Object.keys(ITEM_REGISTRY).map(createItem)');
  assert.deepEqual(J(g,'groupItems().map(g=>g.item.name)').sort(),Object.entries(ITEM_MATRIX).filter(([k])=>k!=='unavailable_key').flatMap(([,v])=>v).sort());
});
for(const [effect,items]of Object.entries(ITEM_MATRIX))for(const id of items)test('item parity: '+id+' — '+effect,()=>{
  if(effect==='unavailable_key'){
    const g=fresh();g.run('combatPlayerState.clear();seed.inventory='+JSON.stringify([id]));assert.throws(()=>g.run('combatPlayerState.initializeCommandParty(seed)'));assert.equal(g.run('rngCalls'),0);assert.equal(g.run('combatPlayerState.hasParty()'),false);return;
  }
  const g=fresh({inventory:[id],party:[{hp:20,statuses:['poison','cursed']},{hp:20}],enemy:[{hp:1000,maxHp:1000},{hp:1000,maxHp:1000}]}),world=canonical(g);
  const friendly=['heal','cure','evade','equip','nothing'].includes(effect),c=command(g,[['item',0,effect==='damage_all'?null:friendly?'a0':0,id],['observe',1,1]]);
  const r=resolve(g,c,null,[...HIT,...HIT]),event=r.events.find(e=>['item','equipment'].includes(e.type));
  assert.equal(event.itemId,id);assert.equal(event.effect,effect);assert.equal(event.consumed,!['equip','nothing'].includes(effect));assert.equal(canonical(g),world);
  assert.deepEqual(r.after.inventory,effect==='nothing'?[id]:[]);
  const def=J(g,'ITEM_REGISTRY['+JSON.stringify(id)+']');
  if(effect==='heal')assert.equal(event.after.party[0].hp,Math.min(100,20+def.heals));
  if(effect==='cure')assert.deepEqual(event.after.party[0].statuses,def.curesPoison?['cursed']:['poison']);
  if(effect==='equip'){const slot=g.run('slotForType('+JSON.stringify(def.type)+')');assert.equal(event.after.equipment[0][slot],id);assert.equal(event.after.equipment[1][slot],null);}
  if(effect==='evade')assert.equal(event.after.effects[0].evadeTurns,def.evadeTurns);
  if(effect==='bomb'){assert.equal(event.after.effects[0].bomb.targetId,ids(g)[1][0]);assert.equal(event.after.effects[0].bomb.fuse,def.fuse);}
  if(['nothing','reagent','stun'].includes(effect))assert.deepEqual(event.after.enemies,event.before.enemies);
  if(['damage','damage_all'].includes(effect))assert.deepEqual(event.after.enemies.map(e=>e.hp),effect==='damage_all'?[943,943]:[1000-g.run('offensiveItemDamage(ITEM_REGISTRY['+JSON.stringify(id)+'],combat.enemies[0])'),1000]);
});
module.exports={name:'Party command hardening: Curse-first, owned Slither Speed, exhaustive item parity',checks,ITEM_MATRIX,
  run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' party status/item hardening checks passed');}};
