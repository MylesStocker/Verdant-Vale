'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const HIT=[0.5,0.99,0.99];
function fresh({allies=2,enemies=2,inventory=[],party=[],enemy=[],boss=false,escape='fastest_living',legacy=false,slither}={}) {
  const g=createContext();
  const descriptors=Array.from({length:allies},(_,slot)=>({characterId:'fixture_'+slot,slot,name:'Fixture '+slot,
    hp:100,maxHp:100,atk:10,def:3,spd:10,statuses:[],...party[slot]}));
  g.run(`dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMenu.open=false;
    ${boss?'ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.isBoss=true;':''}
    ${enemies===1?'combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};':
      'initializeFormationState('+JSON.stringify(Array.from({length:enemies},(_,slot)=>({enemyId:boss&&slot>0?'enemy_briar_hound':'enemy_marsh_wisp',slot})))+',{escape:'+JSON.stringify(escape)+'});'}
    combat.enemies.forEach((e,i)=>Object.assign(e,{hp:100,maxHp:100,atk:10,def:3,spd:10},${JSON.stringify(enemy)}[i]||{}));
    var seed=${JSON.stringify({members:descriptors,inventory,escape,...(slither===undefined?{}:{slither})})};
    ${legacy?'combatPlayerState.initialize(seed.members);':'combatPlayerState.initializeCommandParty(seed);'}
    Math=Object.create(Math);var rngCalls=0;Math.random=()=>{rngCalls++;throw Error('unexpected RNG');};
  `);
  return g;
}
function ids(g){return J(g,'[combatPlayerState.getView().members.map(m=>m.instanceId),combat.enemies.map(e=>e.instanceId)]');}
function command(g,actions) {
  const [a,e]=ids(g),living=J(g,'combatPlayerState.getView().members.filter(m=>m.hp>0).map(m=>m.slot)');
  const supplied=actions||living.map(slot=>['attack',slot,0]);
  const allyActions=supplied.map(([type,slot,target=0,itemId])=>type==='run'?{type,actorId:a[slot]}:
    type==='item'?{type,actorId:a[slot],itemId,...(target===null?{}:{targetId:typeof target==='string'?a[Number(target.slice(1))]:e[target]})}:
      {type,actorId:a[slot],targetId:e[target]});
  const livingAllies=J(g,'combatPlayerState.getView().members.filter(m=>m.hp>0).map(m=>m.instanceId)');
  return {type:'party-round',allyActions,enemyActions:J(g,'combat.enemies.filter(m=>m.hp>0).map(m=>m.instanceId)').map((actorId,i)=>({actorId,targetId:livingAllies[i%livingAllies.length]}))};
}
function orderTape(g,c,order) {
  const [a,e]=ids(g),v=J(g,'combatPlayerState.getCommandView()');
  const pool=[...c.allyActions.map(x=>({id:x.actorId,weight:v.party.find(m=>m.instanceId===x.actorId).effective.spd})),
    ...c.enemyActions.map(x=>({id:x.actorId,weight:Math.max(1,v.enemies.find(m=>m.instanceId===x.actorId).spd)}))];
  const requested=order?order.map(x=>(x[0]==='a'?a:e)[Number(x.slice(1))]):pool.map(x=>x.id),tape=[];
  assert.equal(requested.length,pool.length);
  for(const id of requested.slice(0,-1)) {
    const index=pool.findIndex(m=>m.id===id);assert.ok(index>=0);
    tape.push((pool.slice(0,index).reduce((s,m)=>s+m.weight,0)+pool[index].weight/2)/pool.reduce((s,m)=>s+m.weight,0));pool.splice(index,1);
  }
  return tape;
}
function resolve(g,c,order,execution) {
  const tape=[...orderTape(g,c,order),...(execution||Array.from({length:c.allyActions.filter(a=>a.type==='attack').length+c.enemyActions.length},()=>HIT).flat())];
  g.run(`var command=${JSON.stringify(c)},tape=${JSON.stringify(tape)},used=[];
    Math.random=()=>{if(used.length>=tape.length)throw Error('exhausted tape');const n=tape[used.length];used.push(n);return n;};
    var result=combatPlayerState.resolveRound(command);`);
  assert.deepEqual(J(g,'used'),tape,'exact initiative plus execution RNG');
  const r=J(g,'result');frozen(g.run('result'));contract(r);return r;
}
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const d of Object.values(Object.getOwnPropertyDescriptors(v))){assert.ok('value'in d);frozen(d.value);}}else assert.notEqual(typeof v,'function');}
const sorted=v=>Object.keys(v).sort();
function contract(r) {
  assert.deepEqual(sorted(r),['round','command','initiative','order','events','outcome','before','after','party','enemies'].sort());
  assert.deepEqual(sorted(r.command),['type','allyActions','enemyActions'].sort());
  const planned=['actorId','targetId','side','slot','spd','commandType'];
  const keys={attack:[...planned,'attemptedDamage','appliedDamage','critical','evaded','hpBefore','hpAfter'],
    item:[...planned,'itemId','effect','consumed','before','after'],equipment:[...planned,'itemId','effect','consumed','before','after'],
    observe:[...planned,'countBefore','countAfter','escapeBefore','escapeAfter','lines'],
    run:[...planned,'allowed','opponentId','chance','roll','success'],skip:[...planned,'reason'],cancel:[...planned,'reason'],
    status:['targetId','statusesBefore','statusesAfter','sourceId','itemId'],effect:['sourceId','targetId','itemId','effectsBefore','effectsAfter'],
    curse_check:['actorId','targetId','side','slot','status','round','chance','roll','fumbled'],
    slither_sample:['actorId','side','slot','status','round','commandType','roll','speedBefore','speedAfter'],
    delayed_effect_tick:['effect','ownerId','targetId','before','after','attemptedDamage','appliedDamage','hpBefore','hpAfter'],
    outcome:['outcome'],round_end:['roundBefore','roundAfter','outcome','effectsBefore','effectsAfter']};
  for(const e of r.events){assert.ok(keys[e.type],e.type);assert.deepEqual(sorted(e),['type',...keys[e.type]].sort());}
  for(const snap of [r.before,r.after]) {
    assert.deepEqual(sorted(snap),['party','enemies','inventory','equipment','effects','escapePolicy','bossLocked'].sort());
    for(const [slot,m]of snap.party.entries()) {
      assert.deepEqual(sorted(m),['characterId','slot','name','maxHp','atk','def','spd','instanceId','hp','statuses','side','effective'].sort());
      assert.equal(m.side,'ally');assert.equal(m.slot,slot);assert.match(m.instanceId,/^combat_party_[1-9]\d*$/);
      assert.deepEqual(sorted(m.effective),['atk','def','spd','defenseCapBypass','evadeAll'].sort());
      assert.ok(Number.isSafeInteger(m.hp)&&m.hp>=0&&m.hp<=m.maxHp);
    }
    for(const [slot,m]of snap.enemies.entries()) {
      assert.deepEqual(sorted(m),['id','name','hp','maxHp','atk','def','spd','xp','goldMin','goldMax','instanceId','slot','observeCount','escapeUnlocked','isBoss','side'].sort());
      assert.equal(m.side,'enemy');assert.equal(m.slot,slot);assert.match(m.instanceId,/^combat_enemy_[1-9]\d*$/);
      assert.equal(typeof m.isBoss,'boolean');assert.ok(Number.isSafeInteger(m.hp)&&m.hp>=0&&m.hp<=m.maxHp);
    }
    for(const gear of snap.equipment)assert.deepEqual(sorted(gear),['actorId','weapon','armor','shield','accessory'].sort());
    for(const effect of snap.effects) {
      assert.deepEqual(sorted(effect),['actorId','evadeTurns','evadeAppliedRound','bomb',...(Object.hasOwn(effect,'slither')?['slither']:[])].sort());
      if(effect.slither)assert.deepEqual(sorted(effect.slither),['speed','round','roll','source'].sort());
      if(effect.bomb)assert.deepEqual(sorted(effect.bomb),['targetId','fuse','damage','ignoresDef','appliedRound'].sort());
    }
  }
  assert.equal(r.events.at(-1).type,'round_end');assert.equal(r.events.at(-1).roundAfter,r.round);
  assert.equal(r.events.at(-2).type,'outcome');assert.equal(r.events.at(-2).outcome,r.outcome);
  assert.deepEqual(r.after.party,r.party);assert.deepEqual(r.after.enemies,r.enemies);
}
function canonical(g){return g.run(`JSON.stringify({stats,player,statusEffects,slitherSpd,day,tick,
  flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save'),version:SAVE_VERSION})`);}
function state(g){return g.run(`JSON.stringify({party:combatPlayerState.getView(),local:combatPlayerState.getCommandView(),
  round:combatPlayerState.getRoundView(),enemyRound:formationRounds.getView(),enemies:combat.enemies,seq:combatEnemyInstanceSequence})`);}
function rejects(g,source) {const before=state(g),world=canonical(g);assert.throws(()=>g.run(source));assert.equal(state(g),before);assert.equal(canonical(g),world);assert.equal(g.run('rngCalls'),0);}

test('explicit preparation is detached, strict and independent from canonical Lely',()=>{
  const g=fresh({inventory:['Potion','Iron Sword']});const before=canonical(g);
  g.run("seed.inventory.push('Bomb');seed.members[0].hp=1;seed.members[0].statuses.push('burn');");
  assert.deepEqual(J(g,'combatPlayerState.getCommandView().inventory'),['Potion','Iron Sword']);
  assert.equal(J(g,'combatPlayerState.getView().members[0]').hp,100);
  frozen(g.run('combatPlayerState.getCommandView()'));assert.equal(canonical(g),before);
  rejects(g,'combatPlayerState.session.begin()');rejects(g,'combatPlayerState.resolveAttackRound({})');
});
for(let a=1;a<=3;a++)for(let e=1;e<=3;e++)test(`${a}v${e} basic attacks use ${a+e-1} initiative rolls`,()=>{
  const g=fresh({allies:a,enemies:e}),before=canonical(g),r=resolve(g,command(g));
  assert.equal(r.initiative.length,a+e-1);assert.equal(r.order.length,a+e);assert.equal(r.outcome,'ongoing');
  assert.equal(g.run('used.length'),a+e-1+3*(a+e));assert.equal(canonical(g),before);
  assert.equal(J(g,'combatPlayerState.getRoundView()').completedRounds,1);
});
test('legacy Attack result and arithmetic agree with new ordinary attacks',()=>{
  const g=fresh(),old=fresh({legacy:true}),c=command(g),r=resolve(g,c),tape=J(g,'tape');
  old.run(`Math.random=()=>tape.shift();var tape=${JSON.stringify(tape)};var r=combatPlayerState.resolveAttackRound(${JSON.stringify({...c,type:'attack-round',allyActions:c.allyActions.map(({type,...a})=>a)})});`);
  const original=J(old,'r');assert.deepEqual(r.initiative,original.initiative);
  assert.deepEqual(r.events.filter(e=>e.type==='attack').map(({commandType,...e})=>e),original.events.filter(e=>e.type==='attack'));
  assert.deepEqual(r.party.map(m=>m.hp),original.party.map(m=>m.hp));assert.equal(old.run('tape.length'),0);
});
test('mixed Observe uses authored lines and exact independent duplicate instances',()=>{
  const g=fresh(),r=resolve(g,command(g,[['attack',0,0],['observe',1,1]]));
  assert.deepEqual(r.enemies.map(e=>e.observeCount),[0,1]);assert.equal(r.events.filter(e=>e.type==='attack').length,3);
  assert.deepEqual(r.events.find(e=>e.type==='observe').lines,J(g,'getObservationText(combat.enemies[1],0)'));
  assert.ok(r.enemies.every(e=>e.escapeUnlocked===false));
  const two=resolve(g,command(g,[['observe',0,1],['observe',1,1]]));assert.deepEqual(two.events.filter(e=>e.type==='observe').map(e=>[e.countBefore,e.countAfter]),[[1,2],[2,3]]);
});
test('healing another ally, distinct items, and no canonical inventory mutation',()=>{
  const g=fresh({inventory:['Potion','Elixir'],party:[{hp:20},{hp:10}]}),before=canonical(g);
  const r=resolve(g,command(g,[['item',0,'a1','Potion'],['item',1,'a0','Elixir']]));
  assert.deepEqual(r.events.filter(e=>e.type==='item').map(e=>e.after.party.map(m=>m.hp)),[[20,30],[70,30]]);
  assert.deepEqual(r.after.inventory,[]);assert.equal(canonical(g),before);
});
test('offensive item damages only its exact enemy; another ally attacks normally',()=>{
  const g=fresh({inventory:['Throwing Knife']}),r=resolve(g,command(g,[['item',0,1,'Throwing Knife'],['attack',1,0]]));
  assert.equal(r.enemies[1].hp,73);assert.equal(r.enemies[0].hp,93);assert.deepEqual(r.after.inventory,[]);
});
test('cures target other allies and no-effect cures keep established consumption',()=>{
  const g=fresh({inventory:['Reed Remedy','Amethyst Dust','Reed Remedy'],party:[{statuses:['cursed']},{statuses:['poison']}]}),
    r=resolve(g,command(g,[['item',0,'a1','Reed Remedy'],['item',1,'a0','Amethyst Dust']]));
  assert.ok(r.party.every(m=>m.statuses.length===0));assert.equal(r.events.filter(e=>e.type==='status').length,2);
  const next=resolve(g,command(g,[['item',0,'a1','Reed Remedy'],['observe',1,0]]));assert.deepEqual(next.after.inventory,[]);
});
test('equipment belongs to the actor; exchanges return prior gear to shared inventory',()=>{
  const g=fresh({inventory:['Iron Sword','Swift Bangle','Steel Sword']});
  const first=resolve(g,command(g,[['item',0,'a0','Iron Sword'],['item',1,'a1','Swift Bangle']]));
  assert.equal(first.party[0].effective.atk,14);assert.equal(first.party[1].effective.spd,12);
  const second=resolve(g,command(g,[['item',0,'a0','Steel Sword'],['attack',1,0]]));
  assert.deepEqual(second.after.inventory,['Iron Sword']);assert.equal(second.party[0].effective.atk,17);
  assert.equal(second.after.equipment[1].weapon,null);
});
test('Bullet Time targets another ally and exempts application round before three round ticks',()=>{
  const g=fresh({inventory:['Bullet Time'],party:[{hp:1000,maxHp:1000},{hp:1000,maxHp:1000}]}),
    r=resolve(g,command(g,[['item',0,'a1','Bullet Time'],['observe',1,0]]));
  assert.deepEqual(r.after.effects.map(e=>e.evadeTurns),[0,3]);
  for(const turns of [2,1,0]) {
    const next=resolve(g,command(g,[['observe',0,0],['observe',1,0]]));assert.equal(next.after.effects[1].evadeTurns,turns);
  }
});
test('separate owner Bombs retain exact targets and tick once per completed round',()=>{
  const g=fresh({inventory:['Bomb','Bomb']}),first=resolve(g,command(g,[['item',0,0,'Bomb'],['item',1,1,'Bomb']]));
  assert.deepEqual(first.after.effects.map(e=>e.bomb.fuse),[3,3]);
  for(const fuse of [2,1,0]) {
    const r=resolve(g,command(g,[['observe',0,0],['observe',1,1]]));
    assert.deepEqual(r.after.effects.map(e=>e.bomb?.fuse||0),[fuse,fuse]);assert.equal(r.events.filter(e=>e.type==='delayed_effect_tick').length,2);
    if(!fuse)assert.deepEqual(r.enemies.map(e=>e.hp),[20,20]);
  }
});
test('Void Shard is one no-target simultaneous item; Bait and mismatched banes preserve no-op policy',()=>{
  const g=fresh({inventory:['Void Shard','Bait','Henbane Sprig','Trollbane']}),
    r=resolve(g,command(g,[['item',0,null,'Void Shard'],['item',1,'a1','Bait']]));
  assert.deepEqual(r.enemies.map(e=>e.hp),[43,43]);assert.ok(r.after.inventory.includes('Bait'));
  const next=resolve(g,command(g,[['item',0,0,'Henbane Sprig'],['item',1,1,'Trollbane']]));
  assert.deepEqual(next.enemies.map(e=>e.hp),[43,43]);assert.deepEqual(next.after.inventory,['Bait']);
});
for(const type of ['attack','item','observe'])test(`dead committed target cancels ${type} without consumption or retargeting`,()=>{
  const g=fresh({inventory:['Sapper Charge','Throwing Knife'],enemy:[{hp:20},{}]}),actions=[['item',0,0,'Sapper Charge'],
    type==='item'?['item',1,0,'Throwing Knife']:[type,1,0]],r=resolve(g,command(g,actions),null,HIT);
  assert.equal(r.outcome,'ongoing');assert.equal(r.enemies[0].hp,0);assert.equal(r.enemies[0].slot,0);
  assert.equal(r.events.find(e=>e.type==='cancel').reason,'target_dead');assert.deepEqual(r.after.inventory,['Throwing Knife']);
  assert.equal(r.events.find(e=>e.type==='skip').reason,'actor_dead');
});
test('dead item user consumes nothing and defeated allies remain in slots',()=>{
  const g=fresh({inventory:['Potion'],party:[{hp:1},{}]}),r=resolve(g,command(g,[['item',0,'a1','Potion'],['observe',1,1]]),['e0','a0','a1','e1'],[...HIT,...HIT]);
  assert.equal(r.party[0].hp,0);assert.equal(r.party[1].slot,1);assert.equal(r.outcome,'ongoing');
  assert.equal(r.events[1].reason,'actor_dead');assert.deepEqual(r.after.inventory,['Potion']);
  const c=command(g);assert.equal(c.allyActions.length,1);resolve(g,c);
});
test('successful Run is one ally action and truncates later planned actions',()=>{
  const g=fresh(),r=resolve(g,command(g,[['attack',0,0],['run',1]]),['a1','a0','e0','e1'],[0]);
  assert.equal(r.outcome,'escape');assert.equal(r.order.length,4);assert.equal(r.initiative.length,3);
  assert.equal(r.events.filter(e=>e.type==='attack').length,0);assert.equal(r.events.find(e=>e.type==='run').success,true);
  assert.equal(J(g,'combatPlayerState.getRoundView()').completedRounds,1);g.run('rngCalls=0;Math.random=()=>{rngCalls++;throw Error();};');
  rejects(g,'combatPlayerState.resolveRound(command)');
});
test('failed Run consumes one ally action while the other ally and enemies still act',()=>{
  const g=fresh(),r=resolve(g,command(g,[['run',0],['attack',1,0]]),null,[0.99,...HIT,...HIT,...HIT]);assert.equal(r.outcome,'ongoing');
  assert.equal(r.events.find(e=>e.type==='run').success,false);assert.equal(r.events.filter(e=>e.type==='attack').length,3);
});
test('blocked Run uses no escape roll while the other ally and enemies still act',()=>{
  const g=fresh({escape:'blocked'}),r=resolve(g,command(g,[['run',0],['attack',1,0]]),null,[...HIT,...HIT,...HIT]);
  assert.equal(r.events.find(e=>e.type==='run').roll,null);assert.equal(r.events.find(e=>e.type==='run').allowed,false);
});
test('dead runner is skipped with no success roll while other ally remains targetable',()=>{
  const g=fresh({party:[{hp:1},{}]}),r=resolve(g,command(g,[['run',0],['attack',1,0]]),['e0','a0','a1','e1'],[...HIT,...HIT,...HIT]);
  assert.equal(r.outcome,'ongoing');assert.ok(!r.events.some(e=>e.type==='run'));assert.equal(r.events[1].reason,'actor_dead');
});
test('two allies may independently attempt Run in one round',()=>{
  const g=fresh(),r=resolve(g,command(g,[['run',0],['run',1]]),['a0','a1','e0','e1'],[0.99,0]);
  assert.deepEqual(r.events.filter(e=>e.type==='run').map(e=>e.success),[false,true]);assert.equal(r.outcome,'escape');
  assert.equal(r.events.filter(e=>e.type==='attack').length,0);
});
test('boss lock is captured at enemy creation and persists after that boss dies',()=>{
  const g=fresh({boss:true,inventory:['Sapper Charge'],enemy:[{hp:20},{}]}),r=resolve(g,command(g,[['item',0,0,'Sapper Charge'],['observe',1,1]]),null,HIT);
  assert.equal(r.enemies[0].hp,0);assert.equal(r.after.bossLocked,true);
  assert.deepEqual(r.enemies.map(e=>e.isBoss),[true,false],'only the defeated enemy was a boss');
  const next=resolve(g,command(g,[['run',0],['observe',1,1]]),null,HIT);assert.equal(next.events.find(e=>e.type==='run').roll,null);
});
test('victory and defeat truncate and count exactly one round',()=>{
  const win=fresh({inventory:['Void Shard'],enemy:[{hp:20},{hp:20}]}),r=resolve(win,command(win,[['item',0,null,'Void Shard'],['observe',1,1]]),null,[]);
  assert.equal(r.outcome,'victory');assert.equal(r.events.length,3);
  const lose=fresh({party:[{hp:1},{hp:1}]}),d=resolve(lose,command(lose),['e0','e1','a0','a1'],[...HIT,...HIT]);
  assert.equal(d.outcome,'defeat');assert.deepEqual(d.party.map(m=>m.hp),[0,0]);assert.equal(d.round,1);
});
test('burn advances once per surviving owner at the round boundary',()=>{
  const g=fresh({party:[{statuses:['burn']},{}]}),r=resolve(g,command(g,[['observe',0,0],['observe',1,1]]),null,[...HIT,...HIT,0.5]);
  const ticks=r.events.filter(e=>e.type==='delayed_effect_tick');assert.equal(ticks.length,1);assert.equal(ticks[0].attemptedDamage,10);
});
test('results remain frozen and historical after another round and cleanup',()=>{
  const g=fresh(),r=resolve(g,command(g)),before=JSON.stringify(r),live=g.run('result');frozen(live);
  assert.throws(()=>{live.after.inventory.push('Potion');});resolve(g,command(g));
  g.run('combatPlayerState.clear();combat.enemy=null;');assert.equal(JSON.stringify(live),before);
  assert.equal(g.run('combatPlayerState.getCommandView()'),null);
});
test('a defeated healing target cancels without consuming the potion',()=>{
  const g=fresh({inventory:['Potion'],party:[{hp:1},{}]}),c=command(g,[['observe',0,0],['item',1,'a0','Potion']]);
  const r=resolve(g,c,['e0','a0','a1','e1'],[...HIT,...HIT]);
  assert.equal(r.events.find(e=>e.type==='cancel').reason,'target_dead');assert.deepEqual(r.after.inventory,['Potion']);
});
test('Bullet Time evasion belongs only to its target and needs no extra attack RNG',()=>{
  const g=fresh({inventory:['Bullet Time']}),r=resolve(g,command(g,[['item',0,'a1','Bullet Time'],['observe',1,0]]),null,
    [0.5,0.99,0.5,0.5,0.99,0.5]);
  assert.deepEqual(r.events.filter(e=>e.type==='attack').map(e=>e.evaded),[false,true]);
});
test('mud acquisition and cure-independent effective stats use the established gate',()=>{
  const g=fresh({inventory:['Ember Root']});g.run('MUDSLITHER_INFLICTABLE=true');
  const r=resolve(g,command(g,[['item',0,'a1','Ember Root'],['observe',1,0]]));
  assert.deepEqual(r.party[1].statuses,['muddied']);assert.equal(r.party[1].effective.def,2);assert.equal(r.party[1].effective.spd,8);
  assert.equal(r.order.find(a=>a.slot===1&&a.side==='ally').spd,10,'initiative uses start-of-round Speed');
});
test('pending playback/session and replacement enemies reject before command execution',()=>{
  const g=fresh(),c=command(g);g.run('var command='+JSON.stringify(c)+';combat.enemies=Object.freeze(combat.enemies.slice());');
  rejects(g,'combatPlayerState.resolveRound(command)');
  const h=fresh({legacy:true});h.run('combatPlayerState.session.begin();var command='+JSON.stringify(command(h)));
  rejects(h,'combatPlayerState.resolveRound(command)');
});
test('dead actors and initially dead targets cannot be commanded on a later round',()=>{
  const g=fresh({inventory:['Sapper Charge'],enemy:[{hp:20},{}]});resolve(g,command(g,[['item',0,0,'Sapper Charge'],['observe',1,1]]),null,HIT);
  g.run('Math.random=()=>{rngCalls++;throw Error();};var command='+JSON.stringify(command(g,[['attack',0,0],['observe',1,1]])));
  rejects(g,'combatPlayerState.resolveRound(command)');
  const h=fresh({party:[{hp:0},{}]});h.run('var command='+JSON.stringify(command(h,[['observe',0,0],['observe',1,1]])));rejects(h,'combatPlayerState.resolveRound(command)');
});
test('numeric preflight covers maximum prospective stats even on non-Attack commands',()=>{
  const g=fresh({inventory:['Iron Sword'],party:[{atk:Number.MAX_SAFE_INTEGER-2},{}]});
  g.run('var command='+JSON.stringify(command(g,[['item',0,'a0','Iron Sword'],['observe',1,1]])));rejects(g,'combatPlayerState.resolveRound(command)');
});
test('closed command validation never invokes accessors',()=>{
  const g=fresh();g.run('var getterCalls=0,command='+JSON.stringify(command(g))+";Object.defineProperty(command,'allyActions',{get(){getterCalls++;return []}})");
  rejects(g,'combatPlayerState.resolveRound(command)');assert.equal(g.run('getterCalls'),0);
});

const invalidCommands={
  'missing ally':'command.allyActions.pop()',
  'missing enemy':'command.enemyActions.pop()',
  'duplicate ally':'command.allyActions[1]=command.allyActions[0]',
  'duplicate enemy':'command.enemyActions[1]=command.enemyActions[0]',
  'stale actor':"command.allyActions[0].actorId='combat_party_999'",
  'wrong side actor':'command.allyActions[0].actorId=command.enemyActions[0].actorId',
  'wrong target side':'command.allyActions[0].targetId=command.allyActions[1].actorId',
  'unknown field':'command.allyActions[0].extra=true',
  'accessor':"Object.defineProperty(command.allyActions[0],'targetId',{get(){throw Error('getter executed');}})",
  'callback':'command.allyActions[0].targetId=()=>1',
  'prototype':'Object.setPrototypeOf(command.allyActions[0],{extra:1})',
  'sparse actions':'delete command.allyActions[0]',
  'inventory overcommit':"command.allyActions=command.allyActions.map(a=>({type:'item',actorId:a.actorId,targetId:a.actorId,itemId:'Potion'}))",
  'equipping other ally':"command.allyActions[0]={type:'item',actorId:command.allyActions[0].actorId,targetId:command.allyActions[1].actorId,itemId:'Iron Sword'}",
  'key item':"command.allyActions[0]={type:'item',actorId:command.allyActions[0].actorId,targetId:command.allyActions[0].actorId,itemId:'Warp Stone'}",
};
for(const [label,change]of Object.entries(invalidCommands))test('atomic rejection: '+label,()=>{
  const g=fresh({inventory:['Potion','Iron Sword']});g.run('var command='+JSON.stringify(command(g))+';'+change);rejects(g,'combatPlayerState.resolveRound(command)');
});
for(const [label,opts]of Object.entries({
  'unsafe attack':{party:[{atk:Number.MAX_SAFE_INTEGER},{}]},
  'unsafe weights':{party:[{spd:Number.MAX_SAFE_INTEGER},{}]},
}))test('unsafe or unsupported arithmetic/state rejects before RNG: '+label,()=>{
  const g=fresh(opts);g.run('var command='+JSON.stringify(command(g)));rejects(g,'combatPlayerState.resolveRound(command)');
});
test('prospective equipment and observation overflow reject before mutation',()=>{
  const g=fresh({inventory:['Iron Shield'],party:[{def:Number.MAX_SAFE_INTEGER},{}]});g.run('var command='+JSON.stringify(command(g,[['item',0,'a0','Iron Shield'],['observe',1,1]])));rejects(g,'combatPlayerState.resolveRound(command)');
  const h=fresh({enemy:[{observeCount:Number.MAX_SAFE_INTEGER-1},{}]});h.run('var command='+JSON.stringify(command(h,[['observe',0,0],['observe',1,0]])));rejects(h,'combatPlayerState.resolveRound(command)');
});
test('invalid initialization consumes no identity, RNG, or partial preparation',()=>{
  for(const edit of ["s.inventory=['Warp Stone']",'s.members[0].slot=1',"s.members[0].statuses=['slither']",'s.members[1].characterId=s.members[0].characterId',
      "s.extra=true",'s.members[0].atk=Infinity',"Object.defineProperty(s.members[0],'hp',{get(){throw Error('getter');}})"]) {
    const g=fresh();g.run('combatPlayerState.clear();var s='+JSON.stringify(J(g,'seed'))+';'+edit);const before=canonical(g),sequence=g.run('combatEnemyInstanceSequence');
    assert.throws(()=>g.run('combatPlayerState.initializeCommandParty(s)'));assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('rngCalls'),0);
    assert.equal(g.run('combatEnemyInstanceSequence'),sequence);assert.equal(canonical(g),before);
    g.run('combatPlayerState.initializeCommandParty(seed)');assert.equal(g.run('combatPlayerState.getView().members[0].instanceId'),'combat_party_3');
  }
});
test('faults retain consumed damage and diagnostic lockout; cleanup never retries',()=>{
  const g=fresh(),c=command(g),tape=[...orderTape(g,c),...HIT];
  g.run(`var command=${JSON.stringify(c)},tape=${JSON.stringify(tape)},used=0;Math.random=()=>{if(used===tape.length)throw Error('injected failure');return tape[used++];};`);
  assert.throws(()=>g.run('combatPlayerState.resolveRound(command)'),/injected failure/);assert.equal(J(g,'combatPlayerState.getRoundView()').phase,'fault');
  assert.equal(g.run('combat.enemies[0].hp'),93);assert.equal(J(g,'combatPlayerState.getRoundView()').completedRounds,0);
  const used=g.run('used');assert.throws(()=>g.run('combatPlayerState.resolveRound(command)'));assert.equal(g.run('used'),used);
  g.run('combatPlayerState.clear()');assert.equal(g.run('used'),used);assert.equal(g.run('combat.enemies[0].hp'),93);
});
test('headless command authority has no Lab, input, rendering, save or content caller',()=>{
  for(const file of scriptOrderFromIndexHtml())if(file!=='combat.js'){
    const source=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
    assert.doesNotMatch(source,/combatPlayerState\.(?:resolveRound|getCommandView)\(/,file);
    assert.equal((source.match(/combatPlayerState\.initializeCommandParty\(/g)||[]).length,file==='party-combat-lab.js'?1:0,file);
  }
  const g=fresh(),before=canonical(g);assert.equal(g.run('SAVE_VERSION'),4);
  assert.equal(g.run('combat.active'),false);assert.equal(g.run('combatPlayerState.session.getView()'),null);
  assert.throws(()=>g.run('combat.active=true'));assert.throws(()=>g.run('handleCombatAction()'));assert.throws(()=>g.run('drawCombat()'));
  g.run('saveGame();loadGame();');assert.equal(canonical(g),before);
});
module.exports={name:'Headless generalized party command rounds: local items, observation, Run and isolation',checks,
  fresh,command,orderTape,resolve,J,ids,canonical,state,rejects,frozen,contract,HIT,
  run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' generalized party command checks passed');}};
