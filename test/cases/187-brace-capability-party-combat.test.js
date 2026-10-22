'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run}),J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const BRACERS={enemy_stone_crawler:.2,enemy_bone_guard:.25,enemy_hollow:.2,enemy_tomb_sentry:.3,
  enemy_mudwrack_snapper:.35,
  enemy_shallows_skitter:.25,enemy_silt_crab:.2,enemy_silt_crab_upper:.2,enemy_marrow_hulk:.25};
const view=g=>J(g,'canonicalPartyCombat.getView()'),party=g=>J(g,'persistentParty.getView()');
function seed(g,changes){g.run('saveGame();var saved=JSON.parse(localStorage.getItem("verdantVale_save"));'+changes+
  ';localStorage.setItem("verdantVale_save",JSON.stringify(saved));');assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');}
function fresh(n=2){
  const read=fs.readFileSync;let g;
  try{fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);
    if(String(file).endsWith('/persistent-party.js')&&n===3)s=s.replace('  lely:Object.freeze',
      "  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture third',rareBorn:false,affinity:null,progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),\n  lely:Object.freeze");
    if(String(file).endsWith('/combat.js'))s=s.replace("stage='playback';const playback=combatPlayerState.createRoundPlayback(result)",
      "stage='playback';window.__braceResult=result;const playback=combatPlayerState.createRoundPlayback(result)");
    return s;};g=createContext();
  }finally{fs.readFileSync=read;}
  g.run(`dialogue.open=false;${n>1?'persistentParty.joinEsla();':''}Math=Object.create(Math);var calls=0;Math.random=()=>{calls++;throw Error('unexpected RNG')};`);
  if(n===3)seed(g,'saved.party.order.push("fixture_third");saved.party.characters.push({...saved.party.characters[0],characterId:"fixture_third"})');
  return g;
}
const state=g=>g.run('JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.getView(),runtime:combatPlayerState.getView(),round:combatPlayerState.getRoundView(),session:combatPlayerState.session.getView(),canonical:canonicalPartyCombat.getView(),combat:{data:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>Object.hasOwn(d,"value")).map(([k,d])=>[k,d.value])),mode:combat.mode,active:combat.active,enemies:combat.enemies},seq:combatEnemyInstanceSequence,location:snapshotLocationState(),regional:regionalWorldPosition(),player,day,tick,dialogue,choice,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem("verdantVale_save")})');
function reject(g,source,pattern){const before=state(g),calls=g.run('calls');assert.throws(()=>g.run(source),pattern);assert.equal(state(g),before);assert.equal(g.run('calls'),calls);}
const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}};
function enter(g,ids=['enemy_stone_crawler'],escape='fastest_living'){return J(g,'canonicalPartyCombat.enter('+JSON.stringify({enemies:ids,escape})+')');}
const input=(g,key)=>g.run('partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),QUICKBLOOM_ANIMATION_FRAMES*MS_PER_FRAME/1000);canonicalPartyCombat.handleInput('+JSON.stringify(key)+')');
function command(g,name){let i=0;while(view(g).selectedCommand!==name){assert.ok(i++<6,name);input(g,'right');}input(g,'confirm');}
function target(g,slot=0){const v=view(g),id=(v.targetSide==='ally'?v.party:v.enemies)[slot].instanceId;let i=0;
  while(view(g).selectedTargetInstanceId!==id){assert.ok(i++<4);input(g,'right');}input(g,'confirm');}
function draft(g,type='attack',slot=0){command(g,type);if(view(g).phase==='targeting')target(g,slot);}
function item(g,id,slot=0){command(g,'item');let i=0;while(view(g).selectedItemId!==id){assert.ok(i++<60);input(g,'down');}input(g,'confirm');if(view(g).phase==='targeting')target(g,slot);}
const hit=()=>[.5,.99,.99],guardHit=()=>[.5,.99];
// Explicit tape: per-enemy decision then (only for attacks) target, followed by
// N-1 initiative draws and the exact execution suffix supplied by each test.
function round(g,body,{braceSlots=[0,1,2],order='allies',targetRoll=0}={}){
  const v=view(g),allies=v.party.filter(m=>m.hp>0),enemies=v.enemies.filter(m=>m.hp>0),prefix=[];
  for(const e of enemies){const eligible=e.defendChance>0&&v.allyActions.some(a=>a.type==='attack'&&a.targetId===e.instanceId);
    const selected=eligible&&braceSlots.includes(e.slot);if(eligible)prefix.push(selected?0:.99);
    if(!selected&&allies.length>1)prefix.push(targetRoll);}
  const initiative=Array(allies.length+enemies.length-1).fill(order==='allies'?0:.999999);
  const tape=[...prefix,...initiative,...body];
  g.run('var tape='+JSON.stringify(tape)+',used=[];Math.random=()=>{calls++;if(used.length===tape.length)throw Error("RNG tape exhausted");const v=tape[used.length];used.push(v);return v;};');
  input(g,'confirm');assert.deepEqual(J(g,'used'),tape);g.run('Math.random=()=>{calls++;throw Error("unexpected RNG")};');
  const r=J(g,'__braceResult');frozen(g.run('__braceResult'));assert.equal(r.initiative.length,initiative.length);
  assert.deepEqual(r.initiative.map(d=>d.roll),initiative);return r;
}
function ack(g){const frames=[];let n=0;while(view(g).phase==='playback'){assert.ok(n++<180);frames.push(g.run('canonicalPartyCombat.getView().playbackFrame'));input(g,'confirm');}
  assert.equal(view(g).phase,'playback_complete');frames.push(g.run('canonicalPartyCombat.getView().playbackFrame'));input(g,'confirm');return frames;}
function finish(g){g.run('Math.random=()=>{calls++;return .5};');return J(g,'canonicalPartyCombat.finish()');}

test('the eight ordinary and one scripted authored templates plus a future registered bracer use capability approval',()=>{
  const g=fresh();assert.deepEqual(J(g,'Object.values(ENEMY_TEMPLATE_REGISTRY).filter(t=>Object.hasOwn(t,"defendChance")).map(t=>t.id)'),
    [...Object.keys(BRACERS),'enemy_bridled_hollow']);
  assert.deepEqual(J(g,'canonicalEnemyMechanicProfile(BRIDLED_HOLLOW_TEMPLATE).brace'),{chance:.2});
  for(const [id,chance]of Object.entries(BRACERS)){
    const c=J(g,'canonicalEnemyCompatibility(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'])');assert.equal(c.compatible,true,id);assert.deepEqual(c.unsupported,[]);assert.ok(c.capabilities.includes('brace'));
    for(const count of [1,2,3]){const p=J(g,'canonicalPartyCombat.prepareEnemySide('+JSON.stringify(Array(count).fill(id))+')');assert.ok(p.templates.every(t=>t.defendChance===chance),id);}
  }
  g.run(`ENEMY_TEMPLATE_REGISTRY.enemy_future_bracer={...ENEMY_TEMPLATE_REGISTRY.enemy_stone_crawler,id:'enemy_future_bracer'};`);
  assert.equal(g.run('canonicalPartyCombat.prepareEnemySide(["enemy_future_bracer"]).templates[0].defendChance'),.2);
  for(const file of ['combat.js','enemy-capabilities.js','encounter-formations.js']){
    const source=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');assert.doesNotMatch(source,/BRACE_TEMPLATE_IDS|PARTY_ATTACK_TEMPLATE_IDS|partyCompatible\s*:/);
  }
  assert.equal(g.run('calls'),0);
});
test('malformed, accessor, contradictory, unsupported and unsafe formation members reject before any mutation or identities',()=>{
  for(const field of ['-1','1.1','NaN','Infinity','".2"','{}','null']){
    const g=fresh();g.run('ENEMY_TEMPLATE_REGISTRY.enemy_stone_crawler.defendChance='+field);reject(g,'canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp","enemy_stone_crawler"],escape:"blocked"})',/malformed capability field defendChance/);
  }
  for(const setup of ['Object.defineProperty(ENEMY_TEMPLATE_REGISTRY.enemy_stone_crawler,"defendChance",{get(){calls++;throw Error("getter")}})',
    'ENEMY_TEMPLATE_REGISTRY.enemy_stone_crawler.braced=true','ENEMY_TEMPLATE_REGISTRY.enemy_stone_crawler.regenPerTurn=1',
    'Object.setPrototypeOf(ENEMY_TEMPLATE_REGISTRY.enemy_stone_crawler,{})','stats.atk=Number.MAX_SAFE_INTEGER']){
    const g=fresh();g.run(setup);reject(g,'canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp","enemy_stone_crawler"],escape:"blocked"})');assert.equal(g.run('combatEnemyInstanceSequence'),0);
  }
});
for(const a of [1,2,3])for(const e of [1,2,3])test(a+'x'+e+' Brace matrix: independent exact slots, identities and weighted initiative',()=>{
  const g=fresh(a),before=state(g),ids=Array(e).fill('enemy_stone_crawler');g.run('canonicalPartyCombat.prepare({enemies:'+JSON.stringify(ids)+',escape:"blocked"})');assert.equal(state(g),before);
  const v=enter(g,ids);for(let i=0;i<a;i++)draft(g,'attack',i%e);
  const guarded=new Set(Array.from({length:a},(_,i)=>i%e));const body=[...Array.from({length:a},guardHit).flat(),...Array.from({length:e-guarded.size},hit).flat()];
  const r=round(g,body);assert.equal(r.order.length,a+e);assert.equal(r.events.filter(x=>x.type==='brace_check').length,guarded.size);
  assert.equal(r.events.filter(x=>x.type==='attack'&&x.side==='enemy').length,e-guarded.size);
  assert.equal(new Set([...v.party,...v.enemies].map(m=>m.instanceId)).size,a+e);assert.deepEqual(r.after.enemies.map(m=>m.slot),Array.from({length:e},(_,i)=>i));
  assert.ok(r.after.enemies.every(m=>m.braced===false));assert.equal(r.events.filter(x=>x.type==='round_end').length,1);
  assert.deepEqual(J(g,'partyBattleLayout(canonicalPartyCombat.getView()).enemies.map(e=>e.label)'),e===1?['Stone Crawler']:['Stone Crawler A','Stone Crawler B','Stone Crawler C'].slice(0,e));
  if(a===3&&e===3){assert.equal(r.initiative.length,5);assert.equal(g.run('used.length'),14);}
  ack(g);
});
test('duplicate enemies make independent Brace/Attack decisions and exact targeting stays frozen',()=>{
  const g=fresh();enter(g,['enemy_stone_crawler','enemy_stone_crawler']);draft(g,'attack',0);draft(g,'attack',1);
  const r=round(g,[...guardHit(),...hit(),...hit()],{braceSlots:[0],targetRoll:.99});assert.equal(g.run('used.length'),14);
  assert.deepEqual(r.command.enemyActions.map(a=>a.brace.selected),[true,false]);assert.equal(r.command.enemyActions[0].targetId,null);assert.equal(r.command.enemyActions[1].targetId,r.before.party[1].instanceId);
  assert.deepEqual(r.events.filter(e=>e.type==='attack'&&e.side==='ally').map(e=>!!e.brace),[true,false]);assert.equal(r.events.filter(e=>e.type==='brace_end').length,1);
  ack(g);draft(g,'observe',0);draft(g,'run');const observed=round(g,[.99,...hit(),...hit()]);assert.equal(g.run('used.length'),12);
  assert.deepEqual(observed.after.enemies.map(e=>e.observeCount),[1,0]);assert.ok(!observed.events.some(e=>e.type.startsWith('brace')));
});
test('every migrated template executes and renders all historical frames without RNG or live writes',()=>{
  for(const id of Object.keys(BRACERS)){
    const g=fresh();enter(g,[id]);draft(g);draft(g);const r=round(g,[...guardHit(),...guardHit()]);assert.equal(g.run('used.length'),7,id);
    while(view(g).phase==='playback'){
      const before=state(g),calls=g.run('calls');g.run('drawPartyBattle(canonicalPartyCombat.getView())');assert.equal(state(g),before,id);assert.equal(g.run('calls'),calls,id);input(g,'confirm');
    }
    assert.equal(r.events.filter(e=>e.type==='brace').length,1,id);assert.equal(r.after.enemies[0].braced,false,id);
  }
  const g=fresh(3);enter(g,['enemy_bone_guard','enemy_hollow','enemy_tomb_sentry']);for(let i=0;i<3;i++)draft(g,'attack',i);
  const r=round(g,[...guardHit(),...guardHit(),...guardHit()]);assert.equal(r.events.filter(e=>e.type==='brace').length,3);assert.equal(g.run('used.length'),14);
});
test('legacy probability boundary is strict and an Item-only exchange cannot choose Brace',()=>{
  for(const [id,chance]of Object.entries(BRACERS)){
    const g=fresh(1);enter(g,[id]);draft(g);const tape=[chance,0,...hit(),...hit()];
    g.run('var tape='+JSON.stringify(tape)+',used=[];Math.random=()=>{calls++;if(used.length===tape.length)throw Error("extra RNG");const x=tape[used.length];used.push(x);return x;}');input(g,'confirm');
    assert.deepEqual(J(g,'used'),tape,id);assert.equal(J(g,'__braceResult').command.enemyActions[0].brace.selected,false,id);
  }
  const g=fresh(1);g.run('stats.hp=10;stats.items=[{...ITEM_REGISTRY.Potion}]');enter(g);item(g,'Potion');const r=round(g,hit());assert.equal(g.run('used.length'),4);assert.ok(!r.events.some(e=>e.type.startsWith('brace')));
});
test('mixed ordinary/bracing formation keeps ordinary target selection and skips only the defeated exact actor',()=>{
  const g=fresh();g.run('stats.atk=100');enter(g,['enemy_stone_crawler','enemy_marsh_wisp']);draft(g);draft(g,'attack',1);
  const r=round(g,[...guardHit(),...hit(),...hit()]);assert.equal(g.run('used.length'),13);
  const bracer=r.before.enemies[0].instanceId;assert.ok(r.events.some(e=>e.type==='skip'&&e.actorId===bracer&&e.reason==='actor_dead'));
  assert.ok(!r.events.some(e=>e.type==='brace'&&e.actorId===bracer));assert.equal(r.events.filter(e=>e.type==='brace_check'&&e.after).length,1);
  assert.deepEqual(r.after.enemies.map(e=>e.slot),[0,1]);assert.equal(r.after.enemies[0].hp,0);assert.equal(r.after.enemies[0].braced,false);
});
test('protection is exchange-wide before and after the scheduled slot, including critical damage but no Curse or evasion',()=>{
  const results=[];
  for(const order of ['allies','enemies']){const g=fresh(1);g.run('stats.atk=20;statusEffects=["cursed"]');enter(g,['enemy_bone_guard']);draft(g);
    const r=round(g,[.5,0],{order}),e=r.events.find(e=>e.type==='attack');assert.equal(g.run('used.length'),4);
    assert.equal(e.brace.unmodifiedDamage,20);assert.equal(e.brace.rolledCritical,true);assert.equal(e.attemptedDamage,10);assert.equal(e.critical,false);assert.equal(e.evaded,false);
    assert.ok(!r.events.some(e=>e.type==='curse_check'));results.push(r.after.enemies[0].hp);
  }assert.deepEqual(results,[36,36]);
});
test('failed Brace uses normal Attack RNG; an untargeted bracer never rolls a decision',()=>{
  const g=fresh(1);enter(g);draft(g);const r=round(g,[...hit(),...hit()],{braceSlots:[]});assert.equal(g.run('used.length'),8);assert.equal(r.command.enemyActions[0].brace.selected,false);
  const h=fresh(1);enter(h);draft(h,'observe');const observed=round(h,hit());assert.equal(h.run('used.length'),4);assert.ok(!observed.events.some(e=>e.type.startsWith('brace')));assert.equal(observed.after.enemies[0].observeCount,1);
  const z=fresh(1);z.run('ENEMY_TEMPLATE_REGISTRY.enemy_stone_crawler.defendChance=0');enter(z);draft(z);round(z,[...hit(),...hit()]);assert.equal(z.run('used.length'),7);
});
test('single-target and all-enemy offensive items bypass an active Brace',()=>{
  for(const id of ['Throwing Knife','Sapper Charge','Void Shard']){
    const g=fresh();g.run('stats.items=[{...ITEM_REGISTRY['+JSON.stringify(id)+']}]');enter(g,['enemy_marrow_hulk','enemy_marrow_hulk']);draft(g);item(g,id,0);
    const r=round(g,[...guardHit(),...hit()]);const event=r.events.find(e=>e.type==='item');assert.equal(event.before.enemies[0].braced,true);
    const damage=g.run('offensiveItemDamage(ITEM_REGISTRY['+JSON.stringify(id)+'],ENEMY_TEMPLATE_REGISTRY.enemy_marrow_hulk)');
    assert.equal(event.before.enemies[0].hp-event.after.enemies[0].hp,damage,id);
    if(id==='Void Shard')assert.equal(event.before.enemies[1].hp-event.after.enemies[1].hp,damage);
    assert.deepEqual(r.after.inventory,[]);
  }
});
test('delayed Bomb bypasses Brace, has its original fuse and ticks only at completed rounds',()=>{
  const g=fresh();g.run('stats.items=[{...ITEM_REGISTRY.Bomb}]');enter(g,['enemy_marrow_hulk']);draft(g);item(g,'Bomb');let r=round(g,guardHit());ack(g);
  assert.equal(r.after.effects[1].bomb.fuse,3);
  for(let i=2;i<=4;i++){draft(g);draft(g);r=round(g,[...guardHit(),...guardHit()]);ack(g);
    const tick=r.events.find(e=>e.type==='delayed_effect_tick');assert.equal(tick.attemptedDamage,i===4?80:0);assert.equal(tick.before.fuse,5-i);
    assert.ok(r.events.findIndex(e=>e.type==='brace_end')>r.events.indexOf(tick));}
  assert.equal(r.after.effects[1].bomb,null);
});
test('Fallen slots, Quickbloom, Strain and owned Slither retain their existing timing',()=>{
  const g=fresh(3);g.run('stats.hp=15');seed(g,'saved.party.characters[1].hp=0');enter(g,['enemy_stone_crawler']);draft(g);command(g,'resonance');input(g,'confirm');target(g,0);
  const r=round(g,guardHit());assert.equal(r.command.allyActions.length,2);assert.deepEqual(r.after.party.map(m=>m.slot),[0,1,2]);assert.equal(r.after.party[2].hp,0);assert.equal(r.after.resonance[1].strain,1);ack(g);
  draft(g);draft(g);const recovery=round(g,[...guardHit(),...guardHit()]);assert.equal(recovery.after.resonance[1].strain,0);assert.equal(recovery.events.filter(e=>e.type==='strain'&&e.reason==='recovery').length,1);
  const h=fresh(1);h.run('statusEffects=["slither"];slitherSpd=5');enter(h);draft(h);
  // Decision, Slither sample, initiative, protected attack. Explicit low-level
  // tape asserts the status draw occurs after decisions and before initiative.
  h.run('var used=[];var tape=[0,.5,0,.5,.99];Math.random=()=>{calls++;if(used.length===tape.length)throw Error("extra RNG");const x=tape[used.length];used.push(x);return x}');input(h,'confirm');
  assert.deepEqual(J(h,'used'),[0,.5,0,.5,.99]);assert.equal(J(h,'__braceResult').after.effects[0].slither.speed,11);
});
test('detached immutable frames preserve Brace transitions and rendering consumes no RNG or gameplay writes',()=>{
  const g=fresh();enter(g);draft(g);draft(g);const r=round(g,[...guardHit(),...guardHit()]);const before=state(g),calls=g.run('calls');
  g.run('var reel=combatPlayerState.createRoundPlayback(__braceResult)');frozen(g.run('reel'));
  assert.equal(g.run('reel.frames[0].enemies[0].braced'),false);assert.equal(g.run('reel.frames[1].enemies[0].braced'),true);assert.equal(g.run('reel.frames.at(-1).enemies[0].braced'),false);
  const history=g.run('JSON.stringify(reel)');g.run('drawPartyBattle(canonicalPartyCombat.getView())');assert.equal(state(g),before);assert.equal(g.run('calls'),calls);
  const frames=ack(g);for(const f of frames)frozen(f);assert.ok(frames.some(f=>f.enemies[0].braced));assert.equal(frames.at(-1).enemies[0].hp,r.after.enemies[0].hp);
  draft(g,'run');draft(g,'run');round(g,[0]);ack(g);finish(g);enter(g);assert.equal(g.run('JSON.stringify(reel)'),history);
  const current=state(g),count=g.run('calls');g.run('for(let i=0;i<reel.frameCount;i++)combatPlayerState.projectRoundPlaybackFrame(reel,i)');assert.equal(state(g),current);assert.equal(g.run('calls'),count);
});
test('tampered identities, eligibility, decisions, state, damage, expiry and event order fail closed',()=>{
  const g=fresh();enter(g);draft(g);draft(g);round(g,[...guardHit(),...guardHit()]);
  for(const edit of [
    'bad.events[0].actorId="combat_enemy_999"','bad.events[0].roll=.99','bad.events[0].after=false',
    'bad.command.enemyActions[0].brace.chance=.8','bad.command.enemyActions[0].targetId=bad.before.party[0].instanceId',
    'bad.command.allyActions.forEach(a=>a.type="observe")','bad.before.enemies[0].braced=true',
    'bad.after.enemies[0].braced=true','bad.events.find(e=>e.type==="brace").active=false',
    'bad.events.find(e=>e.type==="attack").brace.unmodifiedDamage=100',
    'bad.events.find(e=>e.type==="attack").attemptedDamage++','bad.events.find(e=>e.type==="attack").evaded=true',
    'delete bad.events.find(e=>e.type==="attack").brace','bad.events.find(e=>e.type==="brace_end").reason="cleanup"',
    'bad.events.splice(0,1)','bad.events.splice(1,0,bad.events.splice(bad.events.findIndex(e=>e.type==="brace_end"),1)[0])',
  ]){g.run('var bad='+JSON.stringify(J(g,'__braceResult'))+';'+edit);reject(g,'combatPlayerState.createRoundPlayback(copyFormationData(bad))',/Invalid party command playback history/);}
});
test('victory truncates, rewards/writeback happen once, saves omit Brace and later identities are fresh',()=>{
  const g=fresh(3);g.run('stats.atk=100');seed(g,'saved.party.characters[1].hp=0');const first=enter(g);draft(g);draft(g);
  const r=round(g,guardHit());assert.equal(r.outcome,'victory');assert.equal(r.events.filter(e=>e.type==='attack').length,1);assert.equal(r.events.filter(e=>e.type==='brace').length,0);
  assert.equal(r.events.find(e=>e.type==='brace_end').reason,'cleanup');assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);ack(g);const receipt=finish(g);
  assert.equal(receipt.outcome,'victory');assert.deepEqual(party(g).members.map(m=>m.xp),[20,20,0]);assert.equal(party(g).gold,6);assert.equal(g.run('persistentParty.serialize().rewards.length'),1);
  const after=state(g);assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(state(g),after);assert.equal(g.run('saveGame()'),true);assert.doesNotMatch(g.run('localStorage.getItem("verdantVale_save")'),/braced|defendChance|combat_enemy_/);assert.equal(g.run('loadGame()'),true);
  g.run('dialogue.open=false');const next=enter(g);assert.ok(next.enemies[0].instanceId!==first.enemies[0].instanceId);assert.equal(next.enemies[0].braced,false);
  reject(g,'combatPlayerState.session.submitAttack('+JSON.stringify({actorId:next.party[0].instanceId,targetId:first.enemies[0].instanceId})+')');
});
test('escape preserves consumed inventory/HP/equipment/statuses and grants no rewards; failure and boss lock persist',()=>{
  const g=fresh();g.run('stats.items=[{...ITEM_REGISTRY["Iron Shield"]}];statusEffects=["cursed"]');enter(g);draft(g);item(g,'Iron Shield');round(g,guardHit());ack(g);
  draft(g,'run');draft(g,'run');round(g,[.99,.99,...hit()]);ack(g);assert.equal(view(g).phase,'awaiting_action');
  draft(g,'run');draft(g,'run');round(g,[0]);ack(g);const hp=view(g).party.map(m=>m.hp);finish(g);assert.deepEqual(party(g).members.map(m=>m.hp),hp);assert.deepEqual(party(g).inventory,[]);assert.equal(party(g).members[1].equipment.shield,'Iron Shield');assert.deepEqual(party(g).members[0].statuses,['cursed']);assert.equal(party(g).gold,0);assert.deepEqual(party(g).members.map(m=>m.xp),[0,0]);
  const b=fresh();enter(b,['enemy_stone_crawler','enemy_mulholland']);draft(b);draft(b,'run');const r=round(b,[...guardHit(),...hit()]);assert.equal(r.events.find(e=>e.type==='run').allowed,false);assert.equal(r.events.find(e=>e.type==='run').roll,null);
  const escaped=fresh();enter(escaped);draft(escaped);draft(escaped,'run');const escape=round(escaped,[...guardHit(),0]);
  assert.equal(escape.outcome,'escape');assert.equal(escape.events.find(e=>e.type==='brace_end').reason,'cleanup');assert.equal(escape.after.enemies[0].braced,false);assert.equal(escape.events.filter(e=>e.type==='brace').length,0);
});
test('all-Fallen defeat recovers each member once and clears transient mechanics',()=>{
  const g=fresh();g.run('stats.hp=1;stats.gold=20');seed(g,'saved.party.characters[0].hp=1');enter(g,['enemy_stone_crawler'],'blocked');const day=g.run('day');
  for(let i=0;i<2;i++){while(view(g).phase==='awaiting_action')draft(g,view(g).commands.includes('observe')?'observe':'run');round(g,hit(),{order:'enemies',targetRoll:i===0?0:.99});ack(g);}
  assert.equal(view(g).phase,'defeat');finish(g);assert.ok(party(g).members.every(m=>m.hp===m.maxHp));assert.equal(party(g).members.length,2);assert.equal(party(g).gold,0);assert.equal(g.run('day'),day+1);assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(g.run('day'),day+1);assert.equal(g.run('combat.enemies.length'),0);
});
test('unexpected post-decision failure retains evidence, consumed RNG and the no-retry lock',()=>{
  const g=fresh();enter(g);draft(g);draft(g);g.run('Math.random=()=>{calls++;if(calls===4)throw Error("injected execution failure");return 0;}');
  assert.throws(()=>input(g,'confirm'),/injected execution failure/);assert.equal(view(g).phase,'fault');assert.equal(g.run('calls'),4);
  assert.equal(g.run('combatPlayerState.session.getView().failure.braceDraws'),1);assert.equal(g.run('combatPlayerState.getCommandView().enemies[0].braced'),true);
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);assert.equal(input(g,'confirm'),false);assert.equal(g.run('calls'),4);
});
test('existing geographic Stone Crawler selection routes recruited parties, preserves solo routing, and other specials reject',()=>{
  for(const count of [1,2]){const g=fresh(count);g.run('currentEncounterPool=()=>[ENEMY_TEMPLATE_REGISTRY.enemy_stone_crawler];var used=[];Math.random=()=>{used.push(.5);return .5};startCombat()');assert.equal(g.run('used.length'),2);assert.equal(g.run('canonicalPartyCombat.isActive()'),count===2);assert.equal(g.run('combat.active'),count===1);}
  const g=fresh();for(const [id,reason]of [['enemy_23','generated_stats'],['enemy_gallery_receiver','receiver_coordination'],['enemy_polwick','fort_lifecycle']])reject(g,'canonicalPartyCombat.enter({enemies:['+JSON.stringify(id)+'],escape:"blocked"})',new RegExp(reason));
  assert.equal(g.run('SAVE_VERSION'),5);
  // Every pool except the two Eastern Fens Mornay weighted-formation pools is
  // flat raw templates (unchanged legacy shape).
  assert.equal(g.run('ENEMY_TEMPLATE_POOLS.filter(p=>!["pool_eastern_fens_mornay_easy","pool_eastern_fens_mornay_hard"].includes(p.id)).every(p=>p.templates.every(t=>!Object.hasOwn(t,"enemies")))'),true);
});
module.exports={name:'Brace capability: legacy exchange guard, exact instances, atomic entry and historical playback',run(){
  for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
  console.log('  '+checks.length+' Brace capability checks passed');
}};
