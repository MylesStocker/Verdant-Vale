'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run}),J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const TARGETS={
  enemy_shade_wraith:{capability:'slither_on_hit',chance:.25,status:'slither'},
  enemy_corpse_slug:{capability:'slither_on_hit',chance:.30,status:'slither'},
  enemy_void_walker:{capability:'curse_on_hit',chance:.20,status:'cursed',also:'void_shard_burst'},
  enemy_dripping_maw:{capability:'acid_corrosion',chance:.35},
  enemy_fen_witch:{capability:'poison_spell',chance:.25,status:'poison'},
  enemy_lantern_moth:{capability:'dazzle_on_hit',chance:.40,status:'dazzled'},
  enemy_dust_drowned:{capability:'curse_on_hit',chance:.20,status:'cursed'},
};
const PASS4C={enemy_the_seep:'split_followup',enemy_rotwood_troll:'regeneration',enemy_thornback:'melee_armor',
  enemy_mire_toad_male:'mire_toad_reagent_observation',enemy_mire_toad_female:'mire_toad_reagent_observation',
  enemy_basin_gull:'steal_and_flee',enemy_basin_gull_upper:'steal_and_flee',enemy_23:'generated_stats'};
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
    if(String(file).endsWith('/combat.js'))s=s.replace("stage='playback';const playback=combatPlayerState.createRoundPlayback(result)",
      "stage='playback';window.__specialResult=result;const playback=combatPlayerState.createRoundPlayback(result)");
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
  const v=view(g),living=v.party.filter(m=>m.hp>0).length+v.enemies.filter(m=>m.hp>0).length;
  const orderRoll=initiative==='enemies'?.999999:0,tape=[...targets,...Array(living-1).fill(orderRoll),...body];
  g.run('var tape='+JSON.stringify(tape)+',used=[];Math.random=()=>{calls++;if(used.length===tape.length)throw Error("RNG tape exhausted");const x=tape[used.length];used.push(x);return x};');
  input(g,'confirm');assert.deepEqual(J(g,'used'),tape);g.run('Math.random=()=>{calls++;throw Error("unexpected RNG")};');
  const result=J(g,'__specialResult');frozen(g.run('__specialResult'));return result;
}
function ack(g){let n=0;while(view(g).phase==='playback'){assert.ok(n++<240);input(g,'confirm');}assert.equal(view(g).phase,'playback_complete');input(g,'confirm');}
function finish(g){g.run('Math.random=()=>{calls++;return .5}');return J(g,'canonicalPartyCombat.finish()');}

test('seven templates expose closed immutable capability profiles and scripted mechanics reflect Pass 5 support',()=>{
  const g=fresh();assert.equal(g.run('validateEnemyCapabilityRegistry()'),70);
  for(const [id,spec]of Object.entries(TARGETS)){
    const compatibility=J(g,'canonicalEnemyCompatibility(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'])');
    assert.equal(compatibility.compatible,true,id);assert.ok(compatibility.capabilities.includes(spec.capability),id);
    if(spec.also)assert.ok(compatibility.capabilities.includes(spec.also),id);
    const profile=g.run('canonicalEnemyMechanicProfile(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'])');frozen(profile);
    assert.equal(profile[spec.capability].chance,spec.chance,id);
  }
  assert.equal(g.run('Object.values(ENEMY_TEMPLATE_REGISTRY).filter(canonicalEnemyIsCompatible).length'),64);
  for(const [id,reason]of Object.entries(PASS4C)){const c=J(g,'canonicalEnemyCompatibility(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'])');assert.deepEqual(c.unsupported,[],id);assert.ok(c.capabilities.includes(reason),id);}
  for(const id of SCRIPTED){const supported=!['enemy_smuggler_guard','enemy_polwick','enemy_essa','enemy_gallery_receiver','enemy_gallery_caller','enemy_gallery_keeper'].includes(id);
    assert.equal(g.run('canonicalEnemyIsCompatible(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'])'),supported,id);}
  assert.equal(g.run('calls'),0);
});

test('all 1-3 by 1-3 sizes prepare every migrated mechanic without RNG or installation',()=>{
  for(const a of [1,2,3])for(const e of [1,2,3]){
    const g=fresh(a),before=state(g),ids=Array.from({length:e},(_,i)=>Object.keys(TARGETS)[i%7]);
    const plan=J(g,'canonicalPartyCombat.prepare({enemies:'+JSON.stringify(ids)+',escape:"blocked"})');
    assert.equal(plan.playerSide.members.length,a);assert.equal(plan.enemySide.ids.length,e);assert.equal(state(g),before);assert.equal(g.run('calls'),0);
  }
});

test('malformed, unknown and incomplete mechanics reject atomically before RNG and identities',()=>{
  for(const setup of [
    'ENEMY_TEMPLATE_REGISTRY.enemy_dust_drowned.curseChance=2',
    'Object.defineProperty(ENEMY_TEMPLATE_REGISTRY.enemy_dust_drowned,"curseChance",{get(){calls++;return .2}})',
    'ENEMY_TEMPLATE_REGISTRY.enemy_dust_drowned.teleportChance=.2',
    'delete ENEMY_TEMPLATE_REGISTRY.enemy_dust_drowned.curseChance',
    'Object.setPrototypeOf(ENEMY_TEMPLATE_REGISTRY.enemy_dust_drowned,{})',
  ]){const g=fresh();g.run(setup);try{reject(g,'canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp","enemy_dust_drowned"],escape:"blocked"})');}catch(error){error.message=setup+': '+error.message;throw error;}assert.equal(g.run('combatEnemyInstanceSequence'),0);}
});

test('Slither is exact-member, independently sampled, non-stacking and committed initiative stays frozen',()=>{
  for(const [id,chance]of [['enemy_shade_wraith',.25],['enemy_corpse_slug',.30]]){
    const g=fresh(1);g.run('stats.hp=stats.maxHp=200');enter(g,[id]);draft(g);
    const r=resolve(g,[...HIT,0,.55,...HIT]);
    assert.equal(g.run('used.length'),9,id);assert.equal(r.events.find(e=>e.type==='enemy_effect_check').chance,chance,id);
    const status=r.events.find(e=>e.type==='enemy_status');assert.equal(status.status,'slither');assert.equal(status.slither.speedAfter,12);
    assert.deepEqual(r.after.party[0].statuses,['slither']);assert.equal(r.after.effects[0].slither.source,'inflicted');
    assert.equal(r.initiative.length,1);ack(g);draft(g);const next=resolve(g,[.20,...HIT,...HIT],{initiative:'allies'});
    assert.equal(next.events.filter(e=>e.type==='slither_sample').length,1,id);assert.equal(next.events.find(e=>e.type==='slither_sample').roll,0,id);assert.equal(next.after.effects[0].slither.speed,1,id);
    assert.ok(!next.events.some(e=>e.type==='enemy_effect_check'&&e.capability==='slither_on_hit'),id);
  }
  const g=fresh();g.run('stats.hp=stats.maxHp=200');
  enter(g,['enemy_shade_wraith','enemy_shade_wraith']);draft(g);draft(g);
  const r=resolve(g,[...HIT,0,.10,...HIT,0,.90,...HIT,...HIT],{targets:[0,.99]});
  assert.deepEqual(r.command.enemyActions.map(a=>a.targetId),[r.before.party[0].instanceId,r.before.party[1].instanceId]);
  assert.deepEqual(r.after.party.map(m=>m.statuses),[['slither'],['slither']]);assert.deepEqual(r.after.effects.map(e=>e.slither.speed).sort((a,b)=>a-b),[3,19]);
});

test('Curse and Void shard burst preserve independent chance, ward and damage branches',()=>{
  const g=fresh(1);g.run('stats.hp=stats.maxHp=200');enter(g,['enemy_void_walker']);draft(g);
  const r=resolve(g,[...HIT,0,0,0,...HIT]);
  assert.equal(g.run('used.length'),10);assert.deepEqual(r.events.filter(e=>e.type==='enemy_effect_check').map(e=>[e.capability,e.chance]),[['curse_on_hit',.2],['void_shard_burst',.35]]);
  assert.deepEqual(r.after.party[0].statuses,['cursed']);const burst=r.events.find(e=>e.type==='enemy_shard_burst');assert.equal(burst.attemptedDamage,8);assert.equal(burst.warded,false);
  ack(g);draft(g);const cursed=resolve(g,[0,...HIT,.99],{initiative:'allies'});assert.equal(cursed.events.find(e=>e.type==='curse_check').fumbled,true);

  const warded=fresh(1);warded.run('stats.hp=stats.maxHp=200;stats.items=[{...ITEM_REGISTRY["Void Shard"]}]');enter(warded,['enemy_void_walker']);draft(warded);
  const wr=resolve(warded,[...HIT,.99,0,...HIT]);const we=wr.events.find(e=>e.type==='enemy_shard_burst');assert.equal(we.warded,true);assert.equal(we.damageRoll,null);assert.equal(we.appliedDamage,0);assert.equal(warded.run('used.length'),9);

  for(const [id,accessory,blocked]of [['enemy_dust_drowned',null,false],['enemy_dust_drowned','Amethyst Bangle',true]]){
    const h=fresh(1);h.run('stats.hp=stats.maxHp=200'+(accessory?';stats.accessory={...ITEM_REGISTRY["'+accessory+'"]}':'') );enter(h,[id]);draft(h);
    const x=resolve(h,[...HIT,0,...HIT]),event=x.events.find(e=>e.type==='enemy_status');assert.equal(event.blocked,blocked);assert.equal(x.after.party[0].statuses.includes('cursed'),!blocked);
  }
});

test('Poison, Dazzle and Acid retain exact wards, per-member state and effect timing',()=>{
  for(const [accessory,blocked]of [[null,false],['Fen Mask',true]]){
    const g=fresh(1);g.run('stats.hp=stats.maxHp=200'+(accessory?';stats.accessory={...ITEM_REGISTRY["Fen Mask"]}':''));enter(g,['enemy_fen_witch']);draft(g);
    const r=resolve(g,[...HIT,0,...HIT]),event=r.events.find(e=>e.type==='enemy_status');assert.equal(event.blocked,blocked);assert.equal(r.after.party[0].statuses.includes('poison'),!blocked);
  }
  const d=fresh(1);d.run('stats.hp=stats.maxHp=200');enter(d,['enemy_lantern_moth']);draft(d);let r=resolve(d,[...HIT,0,...HIT]);
  assert.deepEqual(r.after.party[0].statuses,['dazzled']);assert.equal(r.events.filter(e=>e.type==='round_end').length,1);ack(d);
  draft(d);r=resolve(d,[.5,.99,.99,...HIT],{initiative:'allies'});const attack=r.events.find(e=>e.type==='attack'&&e.side==='ally');assert.equal(attack.evaded,false);assert.ok(!r.events.some(e=>e.type==='enemy_effect_check'&&e.capability==='dazzle_on_hit'));

  const a=fresh(1);a.run('stats.hp=stats.maxHp=200');enter(a,['enemy_dripping_maw']);draft(a);r=resolve(a,[...HIT,0,...HIT]);
  assert.equal(r.after.effects[0].corrosion,1);assert.equal(r.events.find(e=>e.type==='enemy_corrosion').after,1);assert.equal(r.after.party[0].effective.def,r.before.party[0].effective.def-1);
  ack(a);draft(a);r=resolve(a,[...HIT,0,...HIT]);assert.equal(r.after.effects[0].corrosion,2);assert.equal(r.after.party[0].effective.def,r.before.party[0].effective.def-1);
});

test('a new status never changes the already committed order or same-round action',()=>{
  const g=fresh();g.run('stats.hp=stats.maxHp=200');
  enter(g,['enemy_dust_drowned']);draft(g);draft(g);
  const first=resolve(g,[...HIT,0,...HIT,...HIT],{targets:[.99]});
  const esla=first.before.party[1].instanceId;assert.ok(first.events.some(e=>e.type==='enemy_status'&&e.targetId===esla));
  assert.ok(!first.events.some(e=>e.type==='curse_check'&&e.actorId===esla));assert.equal(first.initiative.length,2);
  ack(g);draft(g);draft(g);const second=resolve(g,[...HIT,0,...HIT,.5],{targets:[0],initiative:'allies'});
  assert.ok(second.events.some(e=>e.type==='curse_check'&&e.actorId===esla));
});

test('committed dead targets cancel without retarget, effect RNG or refund and dead actors skip',()=>{
  const g=fresh();g.run('stats.hp=stats.maxHp=200');seed(g,'saved.party.characters[0].hp=1');
  enter(g,['enemy_dust_drowned','enemy_dust_drowned']);draft(g);draft(g);
  const r=resolve(g,[...HIT,...HIT],{targets:[.99,.99]});
  const targetId=r.before.party[1].instanceId,enemyActions=r.command.enemyActions;assert.ok(enemyActions.every(a=>a.targetId===targetId));
  assert.ok(r.events.some(e=>e.type==='cancel'&&e.reason==='target_dead'&&e.targetId===targetId));
  assert.equal(r.events.filter(e=>e.type==='enemy_effect_check').length,0);

  const h=fresh(1);h.run('stats.atk=999');enter(h,['enemy_shade_wraith','enemy_marsh_wisp']);draft(h);
  const dead=resolve(h,[...HIT,...HIT],{initiative:'allies'});assert.ok(dead.events.some(e=>e.type==='skip'&&e.reason==='actor_dead'));
  assert.ok(!dead.events.some(e=>e.type==='enemy_effect_check'));
});

test('three-by-three mixed ordinary Brace and special combat uses five initiative draws and exact instances',()=>{
  const g=fresh(3);g.run('stats.hp=stats.maxHp=200');
  enter(g,['enemy_marsh_wisp','enemy_stone_crawler','enemy_lantern_moth'],'blocked');draft(g,'observe',0);draft(g,'run');draft(g,'observe',2);
  const r=resolve(g,[...HIT,...HIT,...HIT,.99],{targets:[0,.5,.99]});
  assert.equal(r.initiative.length,5);assert.equal(new Set([...r.before.party,...r.before.enemies].map(m=>m.instanceId)).size,6);
  assert.deepEqual(r.after.enemies.map(m=>m.slot),[0,1,2]);assert.equal(r.events.filter(e=>e.type==='enemy_effect_check').length,1);
  assert.equal(r.events.find(e=>e.type==='enemy_effect_check').capability,'dazzle_on_hit');
});

test('duplicate special enemies keep independent decisions, status ownership, identities and A/B/C labels',()=>{
  const g=fresh(3);g.run('stats.hp=stats.maxHp=200');
  enter(g,['enemy_lantern_moth','enemy_lantern_moth','enemy_lantern_moth'],'blocked');draft(g,'observe',0);draft(g,'run');draft(g,'observe',2);
  const r=resolve(g,[...HIT,0,...HIT,.99,...HIT,0],{targets:[0,.5,.99]});
  assert.equal(new Set(r.before.enemies.map(e=>e.instanceId)).size,3);assert.deepEqual(r.after.party.map(m=>m.statuses),[['dazzled'],[],['dazzled']]);
  assert.deepEqual(J(g,'partyBattleLayout(canonicalPartyCombat.getView()).enemies.map(e=>e.label)'),['Lantern Moth A','Lantern Moth B','Lantern Moth C']);
});

test('status cure reservations consume once, remove exact-member state, and allow a later reapplication',()=>{
  const g=fresh();g.run('stats.hp=stats.maxHp=200;statusEffects=["cursed"];stats.items=[{...ITEM_REGISTRY["Amethyst Dust"]}]');
  enter(g,['enemy_dust_drowned'],'blocked');item(g,'Amethyst Dust',0);draft(g,'run');
  const r=resolve(g,[...HIT,0],{targets:[0],initiative:'allies'});
  assert.equal(r.events.find(e=>e.type==='item').effect,'cure');assert.ok(r.events.some(e=>e.type==='enemy_status'&&e.status==='cursed'));
  assert.deepEqual(r.after.party[0].statuses,['cursed']);assert.deepEqual(r.after.inventory,[]);
  assert.equal(r.command.allyActions.filter(a=>a.type==='item'&&a.itemId==='Amethyst Dust').length,1);assert.equal(r.events.filter(e=>e.type==='item').length,1);
});

test('Observe, Run, Quickbloom and boss locking remain on their established controller paths',()=>{
  const observe=fresh(3);enter(observe,['enemy_fen_witch'],'blocked');draft(observe,'observe');draft(observe,'run');draft(observe,'observe');let r=resolve(observe,[...HIT,.99],{targets:[0]});
  assert.equal(r.after.enemies[0].observeCount,2);assert.equal(r.events.filter(e=>e.type==='enemy_effect_check').length,1);

  const run=fresh();enter(run,['enemy_dust_drowned']);draft(run,'run');draft(run,'run');r=resolve(run,[0],{targets:[0],initiative:'allies'});assert.equal(r.outcome,'escape');assert.ok(!r.events.some(e=>e.type==='enemy_effect_check'));
  ack(run);const receipt=finish(run);assert.equal(receipt.outcome,'escape');assert.equal(J(run,'persistentParty.getView().members').length,2);

  const boss=fresh();enter(boss,['enemy_dust_drowned','enemy_mulholland']);draft(boss,'run');draft(boss,'run');r=resolve(boss,[...HIT,.99,.5,.99],{targets:[0,0]});
  assert.equal(r.events.find(e=>e.type==='run').allowed,false);assert.equal(r.events.find(e=>e.type==='run').roll,null);

  const bloom=fresh();bloom.run('stats.hp=10');enter(bloom,['enemy_fen_witch']);draft(bloom,'observe');command(bloom,'resonance');input(bloom,'confirm');target(bloom,0);
  r=resolve(bloom,[...HIT],{targets:[0],initiative:'allies'});assert.ok(r.events.some(e=>e.type==='resonance'));assert.equal(r.after.resonance[1].strain,1);
});

test('immutable playback reconstructs special state, rendering is read-only, and tampering fails closed',()=>{
  const g=fresh(1);g.run('stats.hp=stats.maxHp=200');enter(g,['enemy_void_walker']);draft(g);const r=resolve(g,[...HIT,0,0,.5,...HIT]);
  g.run('var specialReel=combatPlayerState.createRoundPlayback(__specialResult)');frozen(g.run('specialReel'));
  assert.deepEqual(J(g,'specialReel.frames[0].party[0].statuses'),[]);assert.ok(J(g,'specialReel.frames').some(f=>f.party[0].statuses.includes('cursed')));
  assert.equal(J(g,'specialReel.frames').at(-1).party[0].hp,r.after.party[0].hp);
  const before=state(g),calls=g.run('calls');g.run('drawPartyBattle(canonicalPartyCombat.getView())');assert.equal(state(g),before);assert.equal(g.run('calls'),calls);
  for(const edit of ['bad.events.find(e=>e.type==="enemy_effect_check").targetId="combat_party_999"',
    'bad.events.find(e=>e.type==="enemy_effect_check").roll=.99','bad.events.find(e=>e.type==="enemy_shard_burst").attemptedDamage++',
    'bad.events.find(e=>e.type==="enemy_status").statusesAfter=[]','bad.after.party[0].statuses=[]']){
    g.run('var bad='+JSON.stringify(r)+';'+edit);reject(g,'combatPlayerState.createRoundPlayback(copyFormationData(bad))',/Invalid party command playback history/);
  }
});

test('victory writes statuses and rewards once, saves at version 5, and later encounters get fresh identities',()=>{
  const g=fresh();g.run('stats.hp=stats.maxHp=200;stats.atk=999');
  const first=enter(g,['enemy_dust_drowned']);draft(g);draft(g);const r=resolve(g,[...HIT],{targets:[0],initiative:'allies'});assert.equal(r.outcome,'victory');
  assert.equal(g.run('saveGame()'),false);ack(g);const receipt=finish(g);assert.equal(receipt.outcome,'victory');
  const after=state(g);assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(state(g),after);assert.equal(g.run('persistentParty.serialize().rewards.length'),1);
  assert.equal(g.run('saveGame()'),true);assert.equal(g.run('SAVE_VERSION'),5);assert.doesNotMatch(g.run('localStorage.getItem("verdantVale_save")'),/corrosion|combat_enemy_|enemy_effect_check|playback/);
  assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');const second=enter(g,['enemy_dust_drowned']);assert.notEqual(second.enemies[0].instanceId,first.enemies[0].instanceId);
});

test('escape writes completed HP/status state, defeat recovers members, and transient corrosion is cleaned',()=>{
  const escaped=fresh();escaped.run('stats.hp=stats.maxHp=200');enter(escaped,['enemy_dripping_maw']);draft(escaped);draft(escaped);
  let r=resolve(escaped,[...HIT,0,...HIT,...HIT],{targets:[0]});assert.equal(r.after.effects[0].corrosion,1);ack(escaped);
  draft(escaped,'run');draft(escaped,'run');r=resolve(escaped,[0],{targets:[0],initiative:'allies'});assert.equal(r.outcome,'escape');ack(escaped);finish(escaped);
  assert.equal(J(escaped,'persistentParty.getView().members[0].statuses').includes('cursed'),false);assert.doesNotMatch(escaped.run('JSON.stringify(persistentParty.serialize())'),/corrosion/);

  const defeated=fresh();defeated.run('stats.hp=1;stats.gold=20');seed(defeated,'saved.party.characters[0].hp=1');enter(defeated,['enemy_void_walker'],'blocked');const day=defeated.run('day');
  for(let i=0;i<2;i++){while(view(defeated).phase==='awaiting_action')draft(defeated,view(defeated).commands.includes('observe')?'observe':'run');r=resolve(defeated,[...HIT],{targets:i===0?[0]:[]});ack(defeated);}
  assert.equal(view(defeated).phase,'defeat');finish(defeated);const p=J(defeated,'persistentParty.getView()');assert.ok(p.members.every(m=>m.hp===m.maxHp));assert.equal(defeated.run('day'),day+1);assert.equal(defeated.run('combat.enemies.length'),0);
});

test('geographic routing accepts the seven mechanics only after recruitment and preserves selection RNG',()=>{
  for(const id of Object.keys(TARGETS))for(const count of [1,2]){
    const g=fresh(count);g.run('currentEncounterPool=()=>[ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+']];var selected=[];Math.random=()=>{selected.push(.5);return .5};startCombat()');
    assert.equal(g.run('selected.length'),2,id);assert.equal(g.run('canonicalPartyCombat.isActive()'),count===2,id);assert.equal(g.run('combat.active'),count===1,id);
  }
  const g=fresh();assert.equal(g.run('ENEMY_TEMPLATE_POOLS.every(p=>p.templates.every(t=>!Object.hasOwn(t,"enemies")))'),true);
});

test('Pass 4C prepares atomically while scripted lifecycles remain explicitly rejected',()=>{
  const g=fresh(),before=state(g);for(const id of Object.keys(PASS4C)){if(id==='enemy_23')reject(g,'canonicalPartyCombat.enter({enemies:["enemy_23"],escape:"blocked"})',/authenticated/);else frozen(g.run('canonicalPartyCombat.prepare({enemies:['+JSON.stringify(id)+'],escape:"blocked"})'));}assert.equal(state(g),before);assert.equal(g.run('calls'),0);
  for(const id of SCRIPTED)reject(g,'canonicalPartyCombat.enter({enemies:['+JSON.stringify(id)+'],escape:"blocked"})',/Unsupported canonical enemy capabilities|scripted lifecycle owner/);
});

test('source dispatch is capability-driven and singleton source remains isolated',()=>{
  const root=path.join(__dirname,'../..'),capabilities=fs.readFileSync(path.join(root,'enemy-capabilities.js'),'utf8'),combat=fs.readFileSync(path.join(root,'combat.js'),'utf8');
  assert.doesNotMatch(combat,/STATUS_SPECIAL_TEMPLATE_IDS|PARTY_ATTACK_TEMPLATE_IDS|BRACE_TEMPLATE_IDS/);
  assert.doesNotMatch(capabilities,/partyCompatible\s*:/);assert.match(combat,/canonicalEnemyMechanicProfile/);
  for(const id of ['enemy_dripping_maw','enemy_lantern_moth','enemy_dust_drowned'])assert.doesNotMatch(combat,new RegExp("['\"]"+id+"['\"]"),id);
  const solo=fresh(1);solo.run('currentEncounterPool=()=>[ENEMY_TEMPLATE_REGISTRY.enemy_lantern_moth];Math.random=()=>.5;startCombat()');
  assert.equal(solo.run('combat.active'),true);assert.equal(solo.run('combat.mode'),'single');assert.equal(solo.run('canonicalPartyCombat.isActive()'),false);
});

module.exports={name:'status and offensive special capabilities: exact ownership, timing and immutable playback',run(){
  for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
  console.log('  '+checks.length+' status-special capability checks passed');
}};
