'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run}),J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const SCRIPTED=['enemy_briar_warden','enemy_smuggler_guard','enemy_polwick','enemy_essa','enemy_pale_sentry','enemy_rainfish',
  'enemy_takomo','enemy_den_wraith','enemy_kolm','enemy_wrongteeth','enemy_lensweb_spider','enemy_mimic_potion',
  'enemy_gallery_receiver','enemy_gallery_caller','enemy_gallery_keeper'];
const view=g=>J(g,'canonicalPartyCombat.getView()');
function seed(g,changes){g.run('saveGame();var saved=JSON.parse(localStorage.getItem("verdantVale_save"));'+changes+
  ';localStorage.setItem("verdantVale_save",JSON.stringify(saved));');assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');}
function fresh(n=2){
  const read=fs.readFileSync;let g;
  try{fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);
    if(String(file).endsWith('/persistent-party.js')&&n===3)s=s.replace('  lely:Object.freeze',
      "  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture third',rareBorn:false,affinity:null,progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),\n  lely:Object.freeze");
    if(String(file).endsWith('/persistent-party.js'))s=s.replaceAll('hpBase:30','hpBase:2000');
    if(String(file).endsWith('/combat.js'))s=s.replace("stage='playback';const playback=combatPlayerState.createRoundPlayback(result)",
      "stage='playback';window.__unusualResult=result;const playback=combatPlayerState.createRoundPlayback(result)");
    return s;};g=createContext();
  }finally{fs.readFileSync=read;}
  g.run(`dialogue.open=false;${n>1?'persistentParty.joinEsla();':''}Math=Object.create(Math);var calls=0;Math.random=()=>{calls++;throw Error('unexpected RNG')};`);
  if(n===3)seed(g,'saved.party.order.push("fixture_third");saved.party.characters.push({...saved.party.characters[0],characterId:"fixture_third"})');
  return g;
}
const state=g=>g.run('JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.getView(),runtime:combatPlayerState.getView(),round:combatPlayerState.getRoundView(),session:combatPlayerState.session.getView(),canonical:canonicalPartyCombat.getView(),combat:{active:combat.active,mode:combat.mode,enemies:combat.enemies},seq:combatEnemyInstanceSequence,location:snapshotLocationState(),regional:regionalWorldPosition(),player,day,tick,dialogue,choice,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem("verdantVale_save")})');
const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}};
function reject(g,source,pattern){const before=state(g),calls=g.run('calls');assert.throws(()=>g.run(source),pattern);assert.equal(state(g),before);assert.equal(g.run('calls'),calls);}
function enter(g,ids,escape='fastest_living'){return J(g,'canonicalPartyCombat.enter('+JSON.stringify({enemies:ids,escape})+')');}
const input=(g,key)=>g.run('canonicalPartyCombat.handleInput('+JSON.stringify(key)+')');
function command(g,name){let i=0;while(view(g).selectedCommand!==name){assert.ok(i++<6,name);input(g,'right');}input(g,'confirm');}
function target(g,slot=0){const v=view(g),id=(v.targetSide==='ally'?v.party:v.enemies)[slot].instanceId;let i=0;
  while(view(g).selectedTargetInstanceId!==id){assert.ok(i++<4);input(g,'right');}input(g,'confirm');}
function draft(g,type='attack',slot=0){command(g,type);if(view(g).phase==='targeting')target(g,slot);}
function item(g,id,slot=0){command(g,'item');let i=0;while(view(g).selectedItemId!==id){assert.ok(i++<60);input(g,'down');}input(g,'confirm');if(view(g).phase==='targeting')target(g,slot);}
const HIT=[.5,.99,.99];
function resolve(g,body,{targets=[],initiative='enemies'}={}){
  const v=view(g),living=v.party.filter(m=>m.hp>0).length+v.enemies.filter(m=>m.hp>0&&!m.unusual?.departed).length;
  const orderRoll=initiative==='enemies'?.999999:0,tape=[...targets,...Array(living-1).fill(orderRoll),...body];
  g.run('var tape='+JSON.stringify(tape)+',used=[];Math.random=()=>{calls++;if(used.length===tape.length)throw Error("RNG tape exhausted");const x=tape[used.length];used.push(x);return x};');
  input(g,'confirm');assert.deepEqual(J(g,'used'),tape);g.run('Math.random=()=>{calls++;throw Error("unexpected RNG")};');
  const result=J(g,'__unusualResult');frozen(g.run('__unusualResult'));return result;
}
function ack(g){let n=0;while(view(g).phase==='playback'){assert.ok(n++<240);input(g,'confirm');}assert.equal(view(g).phase,'playback_complete');input(g,'confirm');}
function finish(g){g.run('Math.random=()=>{calls++;return .5}');return J(g,'canonicalPartyCombat.finish()');}

const IDS=['enemy_the_seep','enemy_rotwood_troll','enemy_thornback','enemy_mire_toad_male','enemy_mire_toad_female','enemy_basin_gull','enemy_basin_gull_upper','enemy_23'];
function sturdy(g){g.run('stats.hp=stats.maxHp=2000');if(view(g).active)throw Error('seed before entry');
}
function generated(g,value=.5){g.run('Math.random=()=>{calls++;return '+value+'};var generated=canonicalEnemyRecords.generated();Math.random=()=>{calls++;throw Error("unexpected RNG")};');return g.run('generated');}
function historical(g,r){g.run('var savedResult=__unusualResult;var replay=combatPlayerState.createRoundPlayback(savedResult)');
  assert.equal(g.run('replay.frameCount'),r.events.length+1);frozen(g.run('replay'));
  const before=state(g),count=g.run('calls');g.run('for(let i=0;i<replay.frameCount;i++){combatPlayerState.projectRoundPlaybackFrame(replay,i);if(canonicalPartyCombat.getView().party.every(m=>m.characterId!=="fixture_third"))drawPartyBattle(canonicalPartyCombat.getView());}');
  assert.equal(state(g),before);assert.equal(g.run('calls'),count);
}
function tamper(g,code){g.run('var altered='+JSON.stringify(J(g,'savedResult'))+';'+code+';altered=copyFormationData(altered)');
  assert.throws(()=>g.run('combatPlayerState.createRoundPlayback(altered)'),/playback|authenticated/);}

test('eight capabilities are supported; all scripted lifecycles still require their authenticated owner',()=>{
 const g=fresh();for(const id of IDS){assert.equal(g.run('canonicalEnemyIsCompatible(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'])'),true,id);frozen(g.run('canonicalEnemyMechanicProfile(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'])'));}
 assert.equal(g.run('Object.values(ENEMY_TEMPLATE_REGISTRY).filter(canonicalEnemyIsCompatible).length'),64);
 for(const id of SCRIPTED)reject(g,'canonicalPartyCombat.enter({enemies:['+JSON.stringify(id)+'],escape:"blocked"})',/Unsupported canonical enemy capabilities|scripted lifecycle owner/);
});

test('every unusual mechanic prepares at all nine sizes; duplicates retain exact fixed identities',()=>{
 for(const id of IDS)for(const n of [1,2,3])for(const e of [1,2,3]){
  const g=fresh(n);sturdy(g);if(id==='enemy_23')generated(g);
  const expr=id==='enemy_23'?'generated':JSON.stringify(id),request='{enemies:['+Array(e).fill(expr).join(',')+'],escape:"blocked"}';
  const before=state(g),calls=g.run('calls');const plan=J(g,'canonicalPartyCombat.prepare('+request+')');
  assert.equal(plan.playerSide.members.length,n,id);assert.equal(plan.enemySide.ids.length,e,id);assert.equal(state(g),before,id);assert.equal(g.run('calls'),calls,id);
  g.run('canonicalPartyCombat.enter('+request+')');const v=view(g);assert.equal(new Set(v.enemies.map(m=>m.instanceId)).size,e,id);assert.deepEqual(v.enemies.map(m=>m.slot),Array.from({length:e},(_,i)=>i));
  assert.equal(g.run('partyBattleLayout(canonicalPartyCombat.getView()).enemies.length'),e);
  if(e===3)assert.deepEqual(J(g,'partyBattleLayout(canonicalPartyCombat.getView()).enemies.map(e=>e.label.slice(-1))'),['A','B','C']);
 }
});

test('malformed mechanics, forged generated records and unsafe combinations reject atomically',()=>{
 for(const setup of ['ENEMY_TEMPLATE_REGISTRY.enemy_rotwood_troll.regenPerTurn=NaN','ENEMY_TEMPLATE_REGISTRY.enemy_thornback.meleeArmor=Number.MAX_SAFE_INTEGER',
  'delete ENEMY_TEMPLATE_REGISTRY.enemy_thornback.counterChance','ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male.sex="unknown"',
  'Object.defineProperty(ENEMY_TEMPLATE_REGISTRY.enemy_basin_gull,"stealAndFlee",{get(){calls++;return true}})']){
  const g=fresh();g.run(setup);const id=setup.match(/enemy_[a-z_]+/)[0];reject(g,'canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp",'+JSON.stringify(id)+'],escape:"blocked"})');
 }
 const g=fresh();reject(g,'persistentParty.beginCombat(["enemy_marsh_wisp"],{escape:"blocked"},{})');generated(g);reject(g,'canonicalPartyCombat.enter({enemies:[{...generated}],escape:"blocked"})');reject(g,'canonicalPartyCombat.enter({enemies:["enemy_23"],escape:"blocked"})');
 generated(g,0);reject(g,'canonicalPartyCombat.enter({enemies:[generated],escape:"blocked"})');
});

test('Troll regenerates from round-end HP; Trollbane skips its immediate action and three later heals',()=>{
 const g=fresh(1);sturdy(g);g.run('stats.atk=14;stats.items=[{...ITEM_REGISTRY.Trollbane}]');enter(g,['enemy_rotwood_troll']);draft(g);
 let r=resolve(g,[...HIT,...HIT],{initiative:'allies'});assert.equal(g.run('used.length'),7);let regen=r.events.find(e=>e.type==='regeneration');assert.equal(regen.hpAfter-regen.hpBefore,6);historical(g,r);
 tamper(g,'altered.events.find(e=>e.type==="regeneration").hpAfter++');ack(g);item(g,'Trollbane');r=resolve(g,[],{initiative:'allies'});
 assert.equal(r.events.find(e=>e.type==='skip').reason,'trollbane');assert.equal(r.after.enemies[0].unusual.suppressedTurns,3);assert.equal(r.after.inventory.length,0);ack(g);
 for(let left=2;left>=0;left--){draft(g);r=resolve(g,[...HIT,...HIT]);assert.equal(r.after.enemies[0].unusual.suppressedTurns,left);regen=r.events.find(e=>e.type==='regeneration');assert.equal(regen.hpAfter,regen.hpBefore);ack(g);}
 draft(g);r=resolve(g,[...HIT,...HIT]);assert.equal(r.events.find(e=>e.type==='regeneration').hpAfter-r.events.find(e=>e.type==='regeneration').hpBefore,6);
});

test('Trolls are independent; terminal kills never regenerate; mismatched Trollbane consumes',()=>{
 const g=fresh(1);sturdy(g);g.run('stats.items=[{...ITEM_REGISTRY.Trollbane}]');enter(g,['enemy_rotwood_troll','enemy_rotwood_troll']);item(g,'Trollbane',1);
 const r=resolve(g,[...HIT],{initiative:'allies'});assert.deepEqual(r.after.enemies.map(m=>m.unusual.suppressedTurns),[0,3]);assert.equal(r.events.filter(e=>e.type==='skip').length,1);historical(g,r);
 const k=fresh(1);sturdy(k);k.run('stats.atk=500');enter(k,['enemy_rotwood_troll']);draft(k);const kill=resolve(k,HIT,{initiative:'allies'});assert.equal(kill.outcome,'victory');assert.ok(!kill.events.some(e=>e.type==='regeneration'));
 const m=fresh(1);sturdy(m);m.run('stats.items=[{...ITEM_REGISTRY.Trollbane}]');enter(m,['enemy_marsh_wisp']);item(m,'Trollbane');const mismatch=resolve(m,HIT,{initiative:'allies'});assert.equal(mismatch.after.inventory.length,0);assert.ok(!mismatch.events.some(e=>e.type==='skip'));
});

test('Thornback armor and immediate exact-attacker counters preserve hit, miss, Curse and death branches',()=>{
 for(const miss of [false,true]){
  const g=fresh(1);sturdy(g);enter(g,['enemy_thornback']);draft(g);const r=resolve(g,[.5,.99,miss?0:.99,0,...HIT,...HIT],{initiative:'allies'});
  assert.equal(g.run('used.length'),11);assert.equal(r.events[0].type,'attack');assert.equal(r.events[0].armor.bonus,90);assert.equal(r.events[0].evaded,miss);
  const check=r.events.find(e=>e.type==='counter_check'),counter=r.events.find(e=>e.type==='counterattack');assert.equal(check.chance,.9);assert.equal(counter.targetId,r.before.party[0].instanceId);
  assert.equal(r.events.findIndex(e=>e.type==='counterattack'),2);historical(g,r);tamper(g,'altered.events.find(e=>e.type==="counterattack").targetId="combat_party_999"');tamper(g,'altered.events[0].armor.bonus--');
 }
 const g=fresh(1);sturdy(g);g.run('statusEffects=["cursed"]');enter(g,['enemy_thornback']);draft(g);const r=resolve(g,[0,.99,...HIT],{initiative:'allies'});assert.equal(r.events.find(e=>e.type==='attack').armor.fumbled,true);assert.equal(r.events.find(e=>e.type==='counter_check').triggered,false);historical(g,r);
 const k=fresh(1);sturdy(k);k.run('stats.atk=1000');enter(k,['enemy_thornback']);draft(k);const kill=resolve(k,HIT,{initiative:'allies'});assert.equal(kill.outcome,'victory');assert.ok(!kill.events.some(e=>e.type==='counter_check'));
});

test('multiple melee attackers trigger independent counters; offensive items bypass armor',()=>{
 const g=fresh(3);sturdy(g);enter(g,['enemy_thornback']);draft(g);draft(g);draft(g);
 const r=resolve(g,[...HIT,0,...HIT,...HIT,0,...HIT,...HIT,0,...HIT,...HIT],{targets:[.5],initiative:'allies'});
 assert.equal(r.events.filter(e=>e.type==='counterattack').length,3);assert.deepEqual(r.events.filter(e=>e.type==='counterattack').map(e=>e.targetId),r.before.party.map(m=>m.instanceId));historical(g,r);
 for(const id of ['Throwing Knife','Sapper Charge','Void Shard']){const h=fresh(1);sturdy(h);h.run('stats.items=[{...ITEM_REGISTRY['+JSON.stringify(id)+']}]');enter(h,['enemy_thornback']);item(h,id);const x=resolve(h,[],{initiative:'allies'});assert.ok(!x.events.some(e=>e.type==='counter_check'));assert.ok(x.after.enemies[0].hp<x.before.enemies[0].hp);historical(h,x);}
});

test('both Toads retain exact Observe progression, poison composition and matching reagent behavior',()=>{
 for(const [id,right,wrong]of [['enemy_mire_toad_male','Jackbane Vial','Henbane Sprig'],['enemy_mire_toad_female','Henbane Sprig','Jackbane Vial']]){
  const g=fresh(1);sturdy(g);g.run('stats.items=[{...ITEM_REGISTRY['+JSON.stringify(wrong)+']},{...ITEM_REGISTRY['+JSON.stringify(right)+']}]');enter(g,[id]);draft(g,'observe');
  let r=resolve(g,[...HIT,0]);assert.deepEqual(r.after.party[0].statuses,['poison']);assert.equal(r.after.enemies[0].observeCount,1);assert.ok(r.events.find(e=>e.type==='observe').lines.join(' ').includes(id.endsWith('female')?'female':'male'));historical(g,r);ack(g);
  item(g,wrong);r=resolve(g,HIT,{initiative:'allies'});assert.equal(r.after.enemies[0].hp,r.before.enemies[0].hp);assert.deepEqual(r.after.inventory,[right]);ack(g);
  item(g,right);r=resolve(g,[],{initiative:'allies'});assert.equal(r.outcome,'victory');assert.equal(r.after.enemies[0].hp,0);assert.equal(r.after.inventory.length,0);historical(g,r);ack(g);finish(g);assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
  const h=fresh(1);sturdy(h);h.run('stats.items=[{...ITEM_REGISTRY['+JSON.stringify(right)+']}]');enter(h,[id]);item(h,right);const blind=resolve(h,[],{initiative:'allies'});assert.equal(blind.outcome,'victory');assert.equal(blind.after.enemies[0].observeCount,0);
 }
});

test('six actors use five initiative draws; duplicate toads have separate knowledge, status targets and reagent reservations',()=>{
 const g=fresh(3);sturdy(g);g.run('stats.items=[{...ITEM_REGISTRY["Jackbane Vial"]},{...ITEM_REGISTRY["Jackbane Vial"]}]');enter(g,Array(3).fill('enemy_mire_toad_male'));
 draft(g,'observe',2);item(g,'Jackbane Vial',0);item(g,'Jackbane Vial',1);
 assert.deepEqual(view(g).reservedInventory,[{itemId:'Jackbane Vial',quantity:2}]);
 const r=resolve(g,[...HIT,0,...HIT,0,...HIT,0],{targets:[0,.5,.99],initiative:'enemies'});
 assert.equal(r.initiative.length,5);assert.equal(g.run('used.length'),20);assert.deepEqual(r.after.enemies.map(m=>m.observeCount),[0,0,1]);assert.deepEqual(r.after.enemies.map(m=>m.hp===0),[true,true,false]);assert.deepEqual(r.after.party.map(m=>m.statuses),[['poison'],['poison'],['poison']]);historical(g,r);
});

test('Gull theft is gold only, exact-instance and one subsequent complete round before departure',()=>{
 const g=fresh(2);sturdy(g);g.run('stats.gold=100');enter(g,['enemy_basin_gull','enemy_basin_gull_upper']);draft(g,'observe',0);draft(g,'attack',1);
 let r=resolve(g,[...HIT,0,...HIT,.99,...HIT],{targets:[0,.99],initiative:'enemies'});
 assert.equal(r.events.filter(e=>e.type==='theft').length,2);assert.deepEqual(r.events.filter(e=>e.type==='theft').map(e=>e.amount),[20,50]);assert.equal(r.after.gold,30);assert.ok(!r.after.enemies.some(m=>m.unusual.departed));historical(g,r);tamper(g,'altered.events.find(e=>e.type==="theft").amount++');ack(g);
 draft(g,'observe',1);draft(g,'attack',0);r=resolve(g,[...HIT,...HIT,...HIT],{targets:[0,.99],initiative:'enemies'});
 assert.equal(r.events.filter(e=>e.type==='departure').length,2);assert.equal(r.outcome,'escape');assert.ok(r.after.enemies.every(m=>m.hp>0&&m.unusual.departed));historical(g,r);ack(g);
 const receipt=finish(g);assert.equal(receipt.rewards,null);assert.equal(g.run('stats.gold'),30);assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
});

test('Gull killed during grace returns only its stolen gold; flight retains slots in mixed encounters',()=>{
 const g=fresh(1);sturdy(g);g.run('stats.gold=100;stats.items=[{...ITEM_REGISTRY["Sapper Charge"]}]');enter(g,['enemy_basin_gull']);draft(g,'observe');let r=resolve(g,[...HIT,0]);ack(g);item(g,'Sapper Charge');r=resolve(g,[],{initiative:'allies'});
 assert.equal(r.outcome,'victory');assert.equal(r.events.find(e=>e.type==='gold_recovered').amount,20);assert.equal(r.after.gold,100);assert.ok(!r.events.some(e=>e.type==='departure'));historical(g,r);ack(g);finish(g);assert.ok(g.run('stats.gold')>=100);
 const h=fresh(1);sturdy(h);h.run('stats.gold=0;stats.items=[{...ITEM_REGISTRY["Sapper Charge"]}]');enter(h,['enemy_basin_gull','enemy_marsh_wisp']);draft(h,'observe');r=resolve(h,[...HIT,...HIT,0]);ack(h);draft(h,'observe');r=resolve(h,[...HIT,...HIT]);assert.equal(r.outcome,'ongoing');assert.equal(r.after.enemies[0].unusual.departed,true);ack(h);
 item(h,'Sapper Charge',1);r=resolve(h,[],{initiative:'allies'});assert.equal(r.outcome,'escape');assert.equal(r.initiative.length,1);historical(h,r);ack(h);const receipt=finish(h);
 assert.equal(receipt.rewards.xp,h.run('ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.xp'));const before=state(h);assert.equal(h.run('canonicalPartyCombat.finish()'),false);assert.equal(state(h),before);
});

test('Seep has an authenticated separate successor, stale callback cannot duplicate it, saves wait for the handoff',()=>{
 const g=fresh(1);sturdy(g);g.run('stats.atk=500');enter(g,['enemy_the_seep']);const first=view(g).enemies[0].instanceId;draft(g);let r=resolve(g,HIT,{initiative:'allies'});assert.equal(r.outcome,'victory');ack(g);const receipt=finish(g);assert.equal(receipt.rewards.xp,170);
 assert.equal(g.run('canonicalPartyCombat.hasPendingHandoff()'),true);assert.equal(g.run('saveGame()'),false);g.run('var oldCallback=dialogue.callbacks[0];while(dialogue.open)handleInteract()');const second=view(g).enemies[0];assert.notEqual(second.instanceId,first);assert.equal(second.hp,20);assert.equal(second.xp,20);assert.equal(g.run('oldCallback()'),false);
 draft(g);r=resolve(g,HIT,{initiative:'allies'});historical(g,r);ack(g);const next=finish(g);assert.equal(next.rewards.xp,20);assert.equal(g.run('canonicalPartyCombat.hasPendingHandoff()'),false);assert.equal(g.run('saveGame()'),true);
});

test('generated 23 has seven authenticated generation draws, fixed snapshots and no playback rerolls',()=>{
 const g=fresh(1);sturdy(g);generated(g);assert.equal(g.run('calls'),7);assert.equal(g.run('generated.hp'),276);g.run('canonicalPartyCombat.enter({enemies:[generated],escape:"fastest_living"})');draft(g,'observe');const r=resolve(g,HIT);
 assert.equal(r.before.enemies[0].origin.rolls.length,7);historical(g,r);tamper(g,'altered.before.enemies[0].origin.rolls[0]=.9');ack(g);
 const h=fresh(2);sturdy(h);h.run('currentEncounterPool=()=>[ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp];var selectTape=[.5,0,...Array(7).fill(.5)];Math.random=()=>{calls++;if(!selectTape.length)throw Error("extra draw");return selectTape.shift()};startCombat()');assert.equal(h.run('calls'),9);assert.equal(view(h).enemies[0].id,'enemy_23');
});

test('Bomb bypasses Thornback armor and never triggers its counter; historical final projection is exact',()=>{
 const g=fresh(1);sturdy(g);g.run('stats.items=[{...ITEM_REGISTRY.Bomb}]');enter(g,['enemy_thornback']);item(g,'Bomb');let r=resolve(g,HIT,{initiative:'allies'});ack(g);
 for(let n=0;n<3;n++){draft(g,'observe');r=resolve(g,HIT);assert.ok(!r.events.some(e=>e.type==='counter_check'));historical(g,r);if(n<2)ack(g);}
 assert.equal(r.outcome,'victory');assert.equal(r.events.find(e=>e.type==='delayed_effect_tick').attemptedDamage,80);
});

test('same-target reagents cancel without consumption; fixed slots and stale target checks remain exact',()=>{
 const g=fresh(2);sturdy(g);g.run('stats.items=[{...ITEM_REGISTRY["Jackbane Vial"]},{...ITEM_REGISTRY["Jackbane Vial"]}]');enter(g,['enemy_mire_toad_male','enemy_marsh_wisp']);item(g,'Jackbane Vial',0);item(g,'Jackbane Vial',0);
 const r=resolve(g,HIT,{targets:[0,0],initiative:'allies'});assert.equal(r.events.find(e=>e.type==='cancel').reason,'target_dead');assert.ok(r.events.some(e=>e.type==='skip'&&e.reason==='actor_dead'));assert.deepEqual(r.after.inventory,['Jackbane Vial']);assert.equal(r.after.enemies[0].hp,0);assert.equal(r.after.enemies[1].slot,1);historical(g,r);
});

test('voluntary Run after theft writes lost gold but gives no rewards; defeat uses existing recovery',()=>{
 const g=fresh(1);sturdy(g);g.run('stats.gold=100');enter(g,['enemy_basin_gull']);draft(g,'observe');let r=resolve(g,[...HIT,0]);ack(g);draft(g,'run');r=resolve(g,[0],{initiative:'allies'});assert.equal(r.outcome,'escape');historical(g,r);ack(g);const receipt=finish(g);assert.equal(receipt.rewards,null);assert.equal(g.run('stats.gold'),80);
 const h=fresh(1);h.run('stats.hp=1;stats.gold=100');enter(h,['enemy_basin_gull']);draft(h,'observe');r=resolve(h,HIT);assert.equal(r.outcome,'defeat');assert.ok(!r.events.some(e=>e.type==='theft'));historical(h,r);ack(h);finish(h);assert.equal(h.run('stats.hp===stats.maxHp'),true);assert.equal(h.run('stats.gold'),0);assert.equal(h.run('saveGame()'),true);assert.equal(h.run('loadGame()'),true);
});

test('handoff rejection is read-only, its private token cannot be forged, and old targets stay stale',()=>{
 const g=fresh(1);sturdy(g);g.run('stats.atk=500');enter(g,['enemy_the_seep']);const old=view(g);draft(g);resolve(g,HIT,{initiative:'allies'});ack(g);finish(g);
 g.run('choice.open=true');const before=state(g),calls=g.run('calls');assert.throws(()=>g.run('canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp"],escape:"blocked"})'),/pending authenticated follow-up/);assert.equal(state(g),before);assert.equal(g.run('calls'),calls);g.run('choice.open=false');
 reject(g,'persistentParty.beginCombat(["enemy_marsh_wisp"],{escape:"blocked"},{})');g.run('handleInteract()');
 reject(g,'combatPlayerState.session.submitAttack('+JSON.stringify({actorId:old.party[0].instanceId,targetId:old.enemies[0].instanceId})+')');
});

test('three Seep parents retain separate successor battles and one reward receipt per battle',()=>{
 const g=fresh(1);sturdy(g);g.run('stats.atk=500');enter(g,Array(3).fill('enemy_the_seep'));let r;
 for(let slot=0;slot<3;slot++){draft(g,'attack',slot);r=resolve(g,[...HIT,...Array(2-slot).fill(HIT).flat()],{initiative:'allies'});ack(g);}
 assert.equal(r.outcome,'victory');const parent=finish(g);assert.equal(parent.rewards.xp,510);
 const seen=new Set();for(let n=0;n<3;n++){g.run('while(dialogue.open)handleInteract()');const id=view(g).enemies[0].instanceId;assert.ok(!seen.has(id));seen.add(id);
  draft(g);r=resolve(g,HIT,{initiative:'allies'});ack(g);assert.equal(finish(g).rewards.xp,20);}
 assert.equal(g.run('canonicalPartyCombat.hasPendingHandoff()'),false);assert.equal(g.run('persistentParty.serialize().rewards.length'),4);
});

test('new histories remain detached from live arithmetic, state and later encounters; tampered timing and damage reject',()=>{
 const g=fresh(1);sturdy(g);enter(g,['enemy_thornback']);draft(g);const r=resolve(g,[...HIT,0,...HIT,...HIT],{initiative:'allies'});historical(g,r);
 for(const edit of ['altered.events.find(e=>e.type==="counterattack").attemptedDamage++',
  'altered.events.find(e=>e.type==="counter_check").chance=.1','altered.events.find(e=>e.type==="counterattack").rolls[0]=0',
  'altered.after.enemies[0].hp++'])tamper(g,edit);
 g.run('var damageFn=attackDamageNumbers,mitigationFn=playerIncomingMitigation,evasionFn=evadeChance;attackDamageNumbers=playerIncomingMitigation=evadeChance=()=>{throw Error("live formula used")};combatPlayerState.createRoundPlayback(savedResult);attackDamageNumbers=damageFn;playerIncomingMitigation=mitigationFn;evadeChance=evasionFn;');
 const h=fresh(1);sturdy(h);h.run('stats.gold=100');enter(h,['enemy_basin_gull']);draft(h,'observe');resolve(h,[...HIT,0]);ack(h);draft(h,'observe');const flight=resolve(h,HIT);historical(h,flight);
 tamper(h,'altered.events.find(e=>e.type==="departure").round++');tamper(h,'altered.after.enemies[0].unusual.departed=false');ack(h);finish(h);
 const old=J(h,'replay.frames');enter(h,['enemy_marsh_wisp']);assert.deepEqual(J(h,'replay.frames'),old);h.run('combatPlayerState.createRoundPlayback(savedResult)');
});

test('Fallen companions retain slots without commands in unusual formations',()=>{
 const g=fresh(3);sturdy(g);seed(g,'saved.party.characters[0].hp=0');enter(g,Array(3).fill('enemy_rotwood_troll'));
 draft(g,'observe');draft(g,'attack');const r=resolve(g,[...HIT,...HIT,...HIT,...HIT],{targets:[0,.99,0]});
 assert.equal(r.initiative.length,4);assert.equal(r.order.length,5);assert.ok(!r.order.some(a=>a.actorId===r.before.party[1].instanceId));assert.equal(r.after.party[1].hp,0);assert.equal(r.after.party[2].slot,2);historical(g,r);
});

test('ordinary, Brace, status and unusual mechanics compose through the existing six-actor scheduler',()=>{
 const g=fresh(3);sturdy(g);enter(g,['enemy_rotwood_troll','enemy_stone_crawler','enemy_fen_witch']);draft(g,'attack',0);draft(g,'attack',1);draft(g,'attack',2);
 const r=resolve(g,[...HIT,0,...HIT,...HIT,.5,.99,...HIT],{targets:[0,0,.99]});
 assert.equal(r.initiative.length,5);assert.equal(g.run('used.length'),23);assert.ok(r.events.some(e=>e.type==='brace'));assert.ok(r.events.some(e=>e.type==='enemy_status'&&e.status==='poison'));assert.ok(r.events.some(e=>e.type==='regeneration'));historical(g,r);
});

test('a lethal immediate counter truncates the remaining scheduled attack without extra RNG',()=>{
 const g=fresh(1);g.run('stats.hp=1');enter(g,['enemy_thornback']);draft(g);const r=resolve(g,[...HIT,0,...HIT],{initiative:'allies'});
 assert.equal(g.run('used.length'),8);assert.equal(r.outcome,'defeat');assert.equal(r.events.filter(e=>e.type==='attack').length,1);assert.equal(r.events.filter(e=>e.type==='counterattack').length,1);historical(g,r);
});

module.exports={name:'unusual canonical enemy capabilities: authenticated instances, reactions, departure and handoffs',run(){
 for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
 console.log('  '+checks.length+' unusual-enemy capability checks passed');
}};
