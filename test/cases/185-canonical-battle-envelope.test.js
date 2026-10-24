'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'canonicalPartyCombat.getView()');
const party=g=>J(g,'persistentParty.getView()');
const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}};
// Authored third member exists only inside this isolated VM. No production
// membership, save schema, sprite, progression or registry extension is added.
function fresh(n=2){
 const read=fs.readFileSync;let g;
 try{
  fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);
   if(String(file).endsWith('/persistent-party.js')&&n===3)s=s.replace('  lely:Object.freeze',
    "  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture third',rareBorn:false,affinity:null,progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),\n  lely:Object.freeze");
   // Observe the authentic controller result without replacing its execution,
   // validation or playback. This test-only reference never writes game state.
   if(String(file).endsWith('/combat.js'))s=s.replace("stage='playback';const playback=combatPlayerState.createRoundPlayback(result)",
    "stage='playback';window.__envelopeResult=result;const playback=combatPlayerState.createRoundPlayback(result)");
   return s;
  };
  g=createContext();
 }finally{fs.readFileSync=read;}
 g.run(`dialogue.open=false;${n>1?'persistentParty.joinEsla();':''}
  Math=Object.create(Math);var rolls=0;Math.random=()=>{rolls++;throw Error('unexpected RNG')};`);
 if(n===3)seed(g,'saved.party.order.push("fixture_third");saved.party.characters.push({...saved.party.characters[0],characterId:"fixture_third"})');
 g.run('stats.def=100;');return g;
}
function seed(g,changes){g.run('saveGame();var saved=JSON.parse(localStorage.getItem("verdantVale_save"));'+changes+
 ';localStorage.setItem("verdantVale_save",JSON.stringify(saved));');assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');}
const state=g=>g.run('JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.getView(),runtime:combatPlayerState.getView(),round:combatPlayerState.getRoundView(),session:combatPlayerState.session.getView(),canonical:canonicalPartyCombat.getView(),combat:{data:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([k,d])=>Object.hasOwn(d,"value")).map(([k,d])=>[k,d.value])),mode:combat.mode,active:combat.active,enemies:combat.enemies},seq:combatEnemyInstanceSequence,location:snapshotLocationState(),regional:regionalWorldPosition(),player,day,tick,dialogue,choice,flags:Object.fromEntries(QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])),save:localStorage.getItem("verdantVale_save")})');
function reject(g,source){const before=state(g),rolls=g.run('rolls');assert.throws(()=>g.run(source));assert.equal(state(g),before);assert.equal(g.run('rolls'),rolls);}
const enemies=n=>Array(n).fill('enemy_marsh_wisp');
function enter(g,n=1,escape='fastest_living'){return J(g,'canonicalPartyCombat.enter('+JSON.stringify({enemies:enemies(n),escape})+')');}
const input=(g,key)=>g.run('partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),QUICKBLOOM_ANIMATION_FRAMES*MS_PER_FRAME/1000);canonicalPartyCombat.handleInput('+JSON.stringify(key)+')');
function command(g,name){let limit=0;while(view(g).selectedCommand!==name){assert.ok(limit++<6,name+' must be enabled');input(g,'right');}input(g,'confirm');}
function target(g,slot=0){const v=view(g),id=(v.targetSide==='ally'?v.party:v.enemies)[slot].instanceId;let limit=0;
 while(view(g).selectedTargetInstanceId!==id){assert.ok(limit++<4);input(g,'right');}input(g,'confirm');}
function draft(g,name='observe',slot){command(g,name);if(view(g).phase==='targeting')target(g,slot??view(g).enemies.find(m=>m.hp>0).slot);}
function fill(g,name){let limit=0;while(view(g).phase==='awaiting_action'){assert.ok(limit++<4);draft(g,name||(view(g).commands.includes('observe')?'observe':'run'));}}
function item(g,id,slot=0){command(g,'item');let limit=0;while(view(g).selectedItemId!==id){assert.ok(limit++<60);input(g,'down');}input(g,'confirm');if(view(g).phase==='targeting')target(g,slot);}
function resolve(g,{targetRoll=0,order='allies',runRoll=.5}={}){
 const v=view(g),allies=v.party.filter(m=>m.hp>0),enemy=v.enemies.filter(m=>m.hp>0),draws=allies.length+enemy.length-1;
 const targets=allies.length>1?enemy.length:0;
 g.run(`var used=[];Math.random=()=>{const i=used.length,r=i<${targets}?${targetRoll}:i<${targets+draws}?${order==='enemies'?'.999999':'0'}:${runRoll};used.push(r);rolls++;return r;};`);
 input(g,'confirm');g.run('Math.random=()=>{rolls++;throw Error("unexpected RNG")};');
 const r=J(g,'__envelopeResult');frozen(g.run('__envelopeResult'));assert.equal(r.initiative.length,draws);
 assert.deepEqual(r.initiative.map(d=>d.roll),Array(draws).fill(order==='enemies'?.999999:0));
 return r;
}
function acknowledge(g){const frames=[];let limit=0;while(view(g).phase==='playback'){
 assert.ok(limit++<180);frames.push(g.run('combatPlayerState.session.getView().playbackFrame'));input(g,'confirm');}
 assert.equal(view(g).phase,'playback_complete');frames.push(g.run('combatPlayerState.session.getView().playbackFrame'));input(g,'confirm');return frames;
}
function finish(g){g.run('Math.random=()=>{rolls++;return .5};');return g.run('canonicalPartyCombat.finish()');}
const formation=(id,ids,weight=1)=>'Object.freeze({id:'+JSON.stringify(id)+',enemies:Object.freeze('+JSON.stringify(ids)+'),weight:'+weight+'})';

for(const a of [1,2,3])for(const e of [1,2,3])test(a+' allies x '+e+' enemies: independent immutable preparation, exact slots, controller and scheduler',()=>{
 const g=fresh(a),before=state(g);g.run('var plan=canonicalPartyCombat.prepare('+JSON.stringify({enemies:enemies(e),escape:'fastest_living'})+')');
 frozen(g.run('plan'));assert.equal(state(g),before);assert.equal(g.run('rolls'),0);
 assert.equal(g.run('plan.playerSide.members.length'),a);assert.deepEqual(J(g,'plan.enemySide.ids'),enemies(e));
 const v=enter(g,e);assert.equal(g.run('rolls'),0);assert.equal(v.party.length,a);assert.equal(v.enemies.length,e);
 assert.deepEqual(v.party.map(m=>m.slot),Array.from({length:a},(_,i)=>i));assert.deepEqual(v.enemies.map(m=>m.slot),Array.from({length:e},(_,i)=>i));
 assert.equal(new Set([...v.party,...v.enemies].map(m=>m.instanceId)).size,a+e);
 assert.deepEqual(J(g,'partyBattleLayout(canonicalPartyCombat.getView()).allies').map(p=>p.x),[108,256,404].slice(0,a));
 assert.deepEqual(J(g,'partyBattleLayout(canonicalPartyCombat.getView()).enemies').map(p=>p.label),e===1?['Marsh Wisp']:['Marsh Wisp A','Marsh Wisp B','Marsh Wisp C'].slice(0,e));
 const canonical=party(g);fill(g);assert.deepEqual(view(g).allyActions.map(x=>x.actorId),v.party.map(m=>m.instanceId));
 const r=resolve(g,{runRoll:.99999});assert.equal(r.round,1);assert.equal(r.order.length,a+e);
 assert.equal(r.command.enemyActions.length,e);assert.ok(r.command.enemyActions.every(x=>x.targetId===v.party[0].instanceId));
 assert.equal(g.run('used.length'),(a>1?e:0)+(a+e-1)+3*e+(a>1?1:0));
 const frames=acknowledge(g);frames.forEach(frozen);assert.equal(view(g).completedRounds,1);assert.equal(r.events.filter(x=>x.type==='round_end').length,1);
 assert.deepEqual(party(g),canonical);assert.deepEqual(view(g).enemies.map(m=>m.observeCount),[a-(a>1?1:0),...Array(e-1).fill(0)]);
 const history=JSON.stringify(frames);fill(g,'run');const escaped=resolve(g,{runRoll:0});acknowledge(g);assert.equal(view(g).phase,'escape');
 assert.equal(escaped.events.filter(e=>e.type==='run').length,1);const hp=view(g).party.map(m=>m.hp);finish(g);assert.deepEqual(party(g).members.map(m=>m.hp),hp);
 assert.equal(JSON.stringify(frames),history);assert.deepEqual(party(g).members.map(m=>m.xp),Array(a).fill(0));
 assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
});

test('independent side preparations do not require the other side or allocate identities',()=>{
 const g=fresh(3),before=state(g);frozen(g.run('canonicalPartyCombat.preparePlayerSide({escape:"fastest_living"})'));
 frozen(g.run('canonicalPartyCombat.prepareEnemySide(["enemy_mire_toad_male"])'));
 seed(g,'saved.party.characters.forEach(m=>m.hp=0)');g.run('stats.hp=0');
 frozen(g.run('canonicalPartyCombat.prepareEnemySide(["enemy_marsh_wisp"])'));
 reject(g,'canonicalPartyCombat.preparePlayerSide({escape:"fastest_living"})');assert.equal(g.run('rolls'),0);
 assert.equal(g.run('combatEnemyInstanceSequence'),0);assert.notEqual(state(g),before);
});
test('Fallen slots persist and only living members draft; one living ally consumes no target RNG',()=>{
 const g=fresh(3);seed(g,'saved.party.characters[0].hp=0');const v=enter(g,3);fill(g);
 assert.deepEqual(view(g).allyActions.map(x=>x.actorId),[v.party[0].instanceId,v.party[2].instanceId]);
 const r=resolve(g,{targetRoll:.99});assert.ok(r.command.enemyActions.every(x=>x.targetId===v.party[2].instanceId));acknowledge(g);
 assert.deepEqual(view(g).party.map(m=>m.slot),[0,1,2]);assert.equal(view(g).party[1].hp,0);assert.equal(r.initiative.length,4);
 const h=fresh(3);seed(h,'saved.party.characters.forEach(m=>m.hp=0)');enter(h,3);fill(h);const one=resolve(h);assert.equal(h.run('used.length'),3+9);assert.equal(one.command.allyActions.length,1);
});
test('enemy targeting samples every living ally independently with stable half-open intervals',()=>{
 for(const a of [2,3])for(let slot=0;slot<a;slot++){
  const g=fresh(a),v=enter(g,3);fill(g);const r=resolve(g,{targetRoll:(slot+.5)/a,runRoll:.99999});
  assert.ok(r.command.enemyActions.every(x=>x.targetId===v.party[slot].instanceId));assert.equal(r.initiative.length,a+2);
 }
});
test('three shared-inventory reservations backtrack one draft at a time and restore exact targets',()=>{
 const g=fresh(3);g.run('stats.hp=10;stats.items=["Potion","Potion","Potion"].map(id=>({...ITEM_REGISTRY[id]}))');enter(g,3);
 for(let i=0;i<3;i++)item(g,'Potion',i);
 assert.equal(view(g).reservedInventory[0].quantity,3);const targetId=view(g).allyActions[2].targetId;
 input(g,'cancel');assert.equal(view(g).phase,'targeting');assert.equal(view(g).selectedTargetInstanceId,targetId);assert.equal(view(g).reservedInventory[0].quantity,2);
 input(g,'confirm');input(g,'cancel');input(g,'cancel');input(g,'cancel');
 assert.equal(view(g).phase,'awaiting_action');assert.equal(view(g).allyActions.length,2);
 input(g,'cancel');assert.equal(view(g).allyActions.length,1);assert.equal(view(g).reservedInventory[0].quantity,1);
 input(g,'confirm');item(g,'Potion',2);assert.equal(view(g).phase,'ready');const r=resolve(g);acknowledge(g);
 assert.equal(r.events.filter(x=>x.type==='item'&&x.consumed).length,3);assert.deepEqual(view(g).inventory,[]);
 assert.equal(party(g).inventory.length,3);fill(g,'run');resolve(g,{runRoll:0});acknowledge(g);finish(g);assert.deepEqual(party(g).inventory,[]);
});
test('three independent equipment/status owners and insufficient shared inventory remain exact',()=>{
 const g=fresh(3);g.run('stats.items=["Iron Shield","Iron Shield"].map(id=>({...ITEM_REGISTRY[id]}));statusEffects=["cursed"]');
 seed(g,'saved.party.characters[0].statuses=["poison"];saved.party.characters[1].statuses=["muddied"]');enter(g,3);
 item(g,'Iron Shield');item(g,'Iron Shield');assert.equal(view(g).reservedInventory[0].quantity,2);
 command(g,'item');reject(g,'combatPlayerState.session.confirmItem()');input(g,'cancel');draft(g);resolve(g);acknowledge(g);
 assert.deepEqual(view(g).equipment.map(m=>m.shield),['Iron Shield','Iron Shield',null]);
 assert.deepEqual(view(g).party.map(m=>m.statuses),[['cursed'],['poison'],['muddied']]);
});
test('six actors: Quickbloom has five initiative draws, no healing RNG, one Strain tick per round',()=>{
 const g=fresh(3);g.run('stats.hp=10');enter(g,3);draft(g);command(g,'resonance');input(g,'confirm');target(g,0);draft(g);
 const r=resolve(g);assert.equal(r.initiative.length,5);assert.equal(g.run('used.length'),3+5+9);
 const heal=r.events.find(x=>x.type==='resonance');assert.equal(heal.appliedHealing,Math.floor(r.before.party[0].maxHp/5));
 assert.equal(r.after.resonance[1].strain,1);assert.equal(r.events.filter(x=>x.type==='strain').length,1);
 const initial=g.run('combatPlayerState.session.getView().playbackFrame'),saved=JSON.stringify(initial);acknowledge(g);
 assert.equal(view(g).resonance[1].strain,1);fill(g);const recovery=resolve(g,{runRoll:.99999});acknowledge(g);
 assert.equal(recovery.after.resonance[1].strain,0);assert.equal(recovery.events.filter(x=>x.type==='strain'&&x.reason==='recovery').length,1);
 assert.equal(view(g).completedRounds,2);assert.equal(JSON.stringify(initial),saved);frozen(initial);
});
test('exact dead targets cancel, dead actors skip, duplicate enemy slots never compact',()=>{
 const g=fresh(3);g.run('stats.atk=1000');enter(g,3);fill(g,'attack');const r=resolve(g);acknowledge(g);
 assert.equal(r.events.filter(x=>x.type==='cancel'&&x.side==='ally').length,2);
 assert.ok(r.events.some(x=>x.type==='skip'&&x.side==='enemy'&&x.slot===0));
 assert.deepEqual(view(g).enemies.map(m=>m.slot),[0,1,2]);assert.equal(view(g).enemies[0].hp,0);assert.equal(view(g).phase,'awaiting_action');
 draft(g,'observe',2);assert.equal(view(g).allyActions[0].targetId,view(g).enemies[2].instanceId);
});
test('six-actor timed effects exempt their application round and tick only at completed round boundaries',()=>{
 const g=fresh(3);g.run('stats.items=[{...ITEM_REGISTRY["Bullet Time"]}]');enter(g,3);item(g,'Bullet Time',0);fill(g);
 const first=resolve(g,{runRoll:.99999});assert.equal(first.after.effects[0].evadeTurns,3);acknowledge(g);
 fill(g);const second=resolve(g,{runRoll:.99999});assert.equal(second.after.effects[0].evadeTurns,2);
 const frames=acknowledge(g);assert.equal(frames.at(-2).effects[0].evadeTurns,3);assert.equal(frames.at(-1).effects[0].evadeTurns,2);
 assert.equal(view(g).completedRounds,2);assert.equal(second.events.filter(e=>e.type==='round_end').length,1);
});
test('three-member victory grants full XP only to living members and shared rewards once; later identities are fresh',()=>{
 const g=fresh(3);g.run('stats.atk=1000');seed(g,'saved.party.characters[1].hp=0');const first=enter(g,3);
 while(view(g).phase==='awaiting_action'){fill(g,'attack');resolve(g);acknowledge(g);}
 assert.equal(view(g).phase,'victory');assert.equal(g.run('saveGame()'),false);finish(g);
 assert.deepEqual(party(g).members.map(m=>m.xp),[36,36,0]);assert.equal(party(g).gold,6);assert.equal(g.run('persistentParty.serialize().rewards.length'),1);
 const after=state(g);assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(state(g),after);
 assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);const second=enter(g,3);
 assert.ok(second.party.every(m=>!first.party.some(old=>old.instanceId===m.instanceId)));
 assert.ok(second.enemies.every(m=>!first.enemies.some(old=>old.instanceId===m.instanceId)));
 reject(g,'combatPlayerState.session.submitAttack('+JSON.stringify({actorId:first.party[0].instanceId,targetId:first.enemies[0].instanceId})+')');
 reject(g,'combatPlayerState.session.submitAttack('+JSON.stringify({actorId:second.party[0].instanceId,targetId:first.enemies[0].instanceId})+')');
});
test('three-member defeat recovers every slot and applies consequences once',()=>{
 const g=fresh(3);g.run('stats.hp=1;stats.def=0;stats.gold=20');seed(g,'saved.party.characters.forEach(m=>m.hp=1)');enter(g,3,'blocked');const day=g.run('day');
 let limit=0;while(view(g).phase==='awaiting_action'){assert.ok(limit++<5);fill(g);resolve(g,{targetRoll:.99,order:'enemies',runRoll:.99999});acknowledge(g);}
 assert.equal(view(g).phase,'defeat');assert.ok(view(g).party.every(m=>m.hp===0));finish(g);
 assert.ok(party(g).members.every(m=>m.hp===m.maxHp));assert.equal(party(g).members.length,3);assert.equal(party(g).gold,0);assert.equal(g.run('day'),day+1);
 assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(g.run('day'),day+1);
});
test('Run failures and boss escape locks remain whole-party policies',()=>{
 for(const boss of [false,true]){const g=fresh(3);g.run('canonicalPartyCombat.enter({enemies:["'+(boss?'enemy_mulholland':'enemy_marsh_wisp')+'"],escape:"fastest_living"})');
  fill(g,'run');const r=resolve(g,{runRoll:.99999});acknowledge(g);assert.equal(view(g).phase,'awaiting_action');
  assert.ok(r.events.filter(e=>e.type==='run').every(e=>e.success===false));if(boss)assert.ok(r.events.filter(e=>e.type==='run').every(e=>e.allowed===false));
 }
});

test('invalid enemy sides, complete arithmetic, ownership and finalizer descriptors reject before all mutation',()=>{
 const invalid=[
  'canonicalPartyCombat.enter({enemies:[],escape:"blocked"})',
  'canonicalPartyCombat.enter({enemies:Array(4).fill("enemy_marsh_wisp"),escape:"blocked"})',
  'canonicalPartyCombat.enter({enemies:["enemy_gallery_keeper"],escape:"blocked"})',
  'canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp"],escape:"blocked",onVictory(){}})',
  'canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp"],get escape(){throw Error("getter")}})',
  'canonicalPartyCombat.enter({enemies:[{...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,instanceId:"combat_enemy_1"}],escape:"blocked"})',
  'canonicalPartyCombat.enter({enemies:[{id:{toString(){rolls++;return "enemy_marsh_wisp"}}}],escape:"blocked"})',
 ];
 for(const source of invalid){const g=fresh(3);reject(g,source);const v=enter(g,3);assert.deepEqual(v.party.map(m=>m.instanceId),['combat_party_1','combat_party_2','combat_party_3']);assert.equal(v.enemies[0].instanceId,'combat_enemy_1');}
 for(const setup of ['ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.hp=0','stats.hp=0;saved.party.characters.forEach(m=>m.hp=0)',
  'stats.spd=Number.MAX_SAFE_INTEGER-10','stats.atk=Number.MAX_SAFE_INTEGER','stats.items=[{...ITEM_REGISTRY.Potion,heal:999}]',
  'dialogue.open=true','combatEnemyInstanceSequence=Number.MAX_SAFE_INTEGER-2']){
  const g=fresh(3);if(setup.includes('saved.party')){seed(g,'saved.party.characters.forEach(m=>m.hp=0)');g.run('stats.hp=0');}else g.run(setup);
  reject(g,'canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp","enemy_marsh_wisp","enemy_marsh_wisp"],escape:"blocked"})');
 }
 const g=fresh(3);enter(g,3);reject(g,'canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp"],escape:"blocked"})');
});
test('zero/four player slots, duplicates, incorrect authored slots and stale members reject at preparation',()=>{
 for(const edit of ['request.members=[];request.equipment=[];request.resonance=[]',
  'request.members.push({...request.members[2],slot:3});request.equipment.push(request.equipment[2]);request.resonance.push({characterId:"fixture_third",slot:3})',
  'request.members[2].characterId="esla"','request.members[2].slot=1',
  'request.members[2].instanceId="combat_party_999"','request.members.forEach(m=>m.hp=0)',
  'request.members[2].statuses=["unknown"]','request.equipment[2].shield="Potion"']){
  const g=fresh(3),request=J(g,'canonicalPartyCombat.preparePlayerSide({escape:"blocked"})');
  g.run('var request='+JSON.stringify(request)+';var original=copyFormationData(request);combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};'+edit);
  reject(g,'combatPlayerState.initializeCommandParty(request)');g.run('combatPlayerState.initializeCommandParty(original)');
  assert.deepEqual(J(g,'combatPlayerState.getCommandView().party').map(m=>m.instanceId),['combat_party_1','combat_party_2','combat_party_3']);
 }
});
test('actual six-actor cumulative initiative overflow rejects before IDs even when every individual weight is safe',()=>{
 const g=fresh(3);g.run('ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.spd=Math.floor(Number.MAX_SAFE_INTEGER/3)');
 const before=state(g);assert.throws(()=>enter(g,3),/initiative weight sum/);assert.equal(state(g),before);assert.equal(g.run('rolls'),0);assert.equal(g.run('combatEnemyInstanceSequence'),0);
 g.run('ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.spd=5');const v=enter(g,3);assert.equal(v.party[0].instanceId,'combat_party_1');assert.equal(v.enemies[0].instanceId,'combat_enemy_1');
 const h=fresh(3);h.run('stats.spd=Number.MAX_SAFE_INTEGER-10');reject(h,'canonicalPartyCombat.preparePlayerSide({escape:"blocked"})');
});
test('a prepared plan cannot authorize stale canonical state or replacement identities',()=>{
 const g=fresh(3);g.run('var plan=canonicalPartyCombat.prepare({enemies:["enemy_marsh_wisp"],escape:"blocked"})');
 seed(g,'saved.party.characters.forEach(m=>m.hp=0)');g.run('stats.hp=0');reject(g,'canonicalPartyCombat.enter(plan)');
 reject(g,'canonicalPartyCombat.enter({enemies:plan.ids,escape:plan.escape})');
});

test('flat pool shorthand preserves every legacy index, repeated weight and one selection draw',()=>{
 const g=fresh(1);
 for(const roll of [0,.125,.5,.999999]){
  g.run('Math.random=()=>{rolls++;return '+roll+'}');const before=g.run('rolls');
  // Eastern Fens Mornay's two pools are authored weighted formations, not
  // flat template shorthand -- every pool (flat or weighted) still costs
  // exactly one selection draw, but the uniform-index identity only holds
  // for flat pools, checked separately.
  assert.equal(g.run('ENEMY_TEMPLATE_POOLS.every(p=>{const picked=encounterFormations.select(p.templates);'+
   'return Object.hasOwn(p.templates[0],"enemies")||picked.enemies[0]===p.templates[Math.floor('+roll+'*p.templates.length)].id;})'),true);
  assert.equal(g.run('rolls')-before,g.run('ENEMY_TEMPLATE_POOLS.length'));
 }
 const table=g.run('encounterFormations.normalizePool([ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp])');frozen(table);
 assert.equal(table.mode,'legacy_flat');assert.equal(table.totalWeight,2);assert.equal(table.formations.length,2);
 g.run('rolls=0;encounterFormations.select([ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp])');assert.equal(g.run('rolls'),1);
});
test('explicit formations have ordered exact slots, stable IDs, safe weights and one cumulative selection draw',()=>{
 const g=fresh();g.run('var table=['+formation('formation_one',enemies(1),1)+','+formation('formation_three',enemies(3),3)+']');
 frozen(g.run('encounterFormations.normalizePool(table)'));
 for(const [roll,id]of [[0,'formation_one'],[.24999,'formation_one'],[.25,'formation_three'],[.99999,'formation_three']]){
  g.run('rolls=0;Math.random=()=>{rolls++;return '+roll+'}');assert.equal(g.run('encounterFormations.select(table).id'),id);assert.equal(g.run('rolls'),1);
 }
 g.run('var mixed=Object.freeze({id:"formation_ordered",enemies:Object.freeze(["enemy_briar_hound","enemy_marsh_wisp","enemy_briar_hound"]),weight:2})');
 assert.deepEqual(J(g,'canonicalPartyCombat.prepareEnemySide(mixed.enemies).slots'),[{enemyId:'enemy_briar_hound',slot:0},{enemyId:'enemy_marsh_wisp',slot:1},{enemyId:'enemy_briar_hound',slot:2}]);
 // Full data validation accepts a structurally valid authored table in a VM.
 g.run('ENEMY_TEMPLATE_POOLS[0].templates.push(mixed)');assert.equal(g.run('validateGameData().errors'),0);
});
test('malformed authored tables are rejected in full before the selection draw, including accessors',()=>{
 const bad=[
  '[]','[Object.freeze({id:"formation_bad",enemies:Object.freeze([]),weight:1})]',
  '[Object.freeze({id:"formation_bad",enemies:Object.freeze(Array(4).fill("enemy_marsh_wisp")),weight:1})]',
  '[{id:"formation_mutable",enemies:Object.freeze(["enemy_marsh_wisp"]),weight:1}]',
  '[Object.freeze({id:"formation_mutable",enemies:["enemy_marsh_wisp"],weight:1})]',
  '[Object.freeze({id:"formation_bad",enemies:Object.freeze(["enemy_absent"]),weight:1})]',
  ...[0,-1,1.5,Infinity,Number.MAX_SAFE_INTEGER+1].map(w=>'['+formation('formation_bad',enemies(1),w)+']'),
  '['+formation('formation_big',enemies(1),Number.MAX_SAFE_INTEGER)+','+formation('formation_overflow',enemies(1))+']',
  '['+formation('formation_duplicate',enemies(1))+','+formation('formation_duplicate',enemies(2))+']',
  '[Object.freeze({id:"formation_bad",enemies:Object.freeze(["enemy_marsh_wisp"]),weight:1,callback(){}})]',
  '[Object.freeze({id:"formation_bad",enemies:Object.freeze(["enemy_marsh_wisp"]),get weight(){throw Error("getter invoked")}})]',
  '[Object.freeze({id:"formation_bad",enemies:Object.freeze([,"enemy_marsh_wisp"]),weight:1})]',
  '[{...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp}]',
 ];
 for(const source of bad){const g=fresh();reject(g,'encounterFormations.select('+source+')');assert.equal(g.run('rolls'),0);}
 const g=fresh();g.run('ENEMY_TEMPLATE_POOLS[0].templates.push(Object.freeze({id:"formation_invalid",enemies:Object.freeze(["enemy_absent"]),weight:1}))');
 assert.ok(g.run('validateGameData().errors')>0);assert.ok(g.run('VALIDATION_ERRORS.some(e=>e.message.includes("unregistered template"))'));
});
test('Eastern Fens fixtures: mire toads, Waspthra and Botfly all prepare now they are authored; a genuinely absent template still rejects atomically; no production routing yet',()=>{
 const g=fresh(3),fixtures=[['formation_fixture_mire_toads',Array(3).fill('enemy_mire_toad_male')],
  ['formation_fixture_waspthra',['enemy_waspthra']],['formation_fixture_botflies_waspthra',['enemy_botfly','enemy_botfly','enemy_waspthra']]];
 for(const [id,ids]of fixtures){g.run('var intended='+formation(id,ids));frozen(g.run('encounterFormations.validateDefinition(intended)'));
  frozen(g.run('encounterFormations.normalizePool([intended])'));
  frozen(g.run('canonicalPartyCombat.prepare({enemies:intended.enemies,escape:"fastest_living"})'));
 }
 assert.equal(g.run('rolls'),0);assert.equal(g.run('combatEnemyInstanceSequence'),0);
 assert.equal(g.run('Object.hasOwn(ENEMY_TEMPLATE_REGISTRY,"enemy_waspthra")'),true);assert.equal(g.run('Object.hasOwn(ENEMY_TEMPLATE_REGISTRY,"enemy_botfly")'),true);
 // A still-genuinely-absent template continues to reject atomically.
 g.run('var absent='+formation('formation_fixture_absent',['enemy_still_unregistered']));
 reject(g,'encounterFormations.normalizePool([absent])');
 reject(g,'canonicalPartyCombat.enter({enemies:absent.enemies,escape:"fastest_living"})');
 // The authored Eastern Fens pool is content-complete but still has no live
 // geographic route: no MAP_METADATA entry points its encounterPool at it.
 assert.equal(g.run("Object.values(MAP_METADATA).some(m=>m.encounterPool===ENEMY_TEMPLATE_POOLS.find(p=>p.id==='pool_eastern_fens_mornay').templates)"),false);
});
test('element metadata is immutable and distinct from caster affinity; Firelit is metadata only',()=>{
 const g=fresh();assert.deepEqual(J(g,'RESONANCE_ELEMENTS'),['bloommarked','firelit','void','prism']);frozen(g.run('RESONANCE_TECHNIQUES'));
 assert.deepEqual(J(g,'RESONANCE_TECHNIQUES.quickbloom.elements'),['bloommarked']);assert.equal(g.run('RESONANCE_TECHNIQUES.quickbloom.participants[0].affinity'),'bloommarked');
 assert.deepEqual(J(g,'Object.keys(RESONANCE_TECHNIQUES)'),['quickbloom','null','rainbow','eclipse']);
 g.run('var example=validateResonanceTechnique({...RESONANCE_TECHNIQUES.quickbloom,participants:RESONANCE_TECHNIQUES.quickbloom.participants.map(p=>({...p})),elements:Object.freeze(["bloommarked","firelit"])})');frozen(g.run('example'));
 assert.equal(g.run('example.participants[0].affinity'),'bloommarked');
 for(const value of ['[]','Object.freeze([])','["bloommarked"]','Object.freeze(["unknown"])','Object.freeze(["bloommarked","bloommarked"])',
  'Object.freeze([""])','Object.freeze([null])','Object.freeze([,"bloommarked"])','"bloommarked"',
  'Object.freeze(Object.assign(["bloommarked"],{extra:1}))',
  'Object.freeze(Object.defineProperty([],"0",{get(){throw Error("getter invoked")}}))']){
  reject(g,'validateResonanceTechnique({...RESONANCE_TECHNIQUES.quickbloom,elements:'+value+'})');
 }
 assert.throws(()=>g.run('RESONANCE_TECHNIQUES.quickbloom.elements.push("firelit")'));
});
test('normal routing, singleton/Lab/Receiver authorities and save contract are unchanged',()=>{
 const g=fresh(1);g.run('Math.random=()=>{rolls++;return .5};startCombat()');assert.equal(g.run('combat.active'),true);assert.equal(g.run('canonicalPartyCombat.isActive()'),false);assert.equal(g.run('rolls'),2);
 const h=fresh(2);h.run('Math.random=()=>{rolls++;return .99};startCombat()');assert.equal(view(h).party.length,2);assert.equal(h.run('rolls'),2);
 assert.equal(h.run('partyCombatLab.isActive()'),false);assert.equal(h.run('galleryReceiverEncounter.isLocked()'),false);assert.equal(h.run('SAVE_VERSION'),5);
 assert.deepEqual(J(g,'Object.keys(PERSISTENT_CHARACTER_DEFINITIONS)'),['lely','esla']);
 const root=path.join(__dirname,'../..'),source=fs.readFileSync(path.join(root,'canonical-party-combat.js'),'utf8');assert.doesNotMatch(source,/partyCombatLab|PARTY_COMBAT_LAB|drawPartyCombatLab/);
 const order=scriptOrderFromIndexHtml();assert.ok(order.indexOf('combat.js')<order.indexOf('encounter-formations.js'));assert.ok(order.indexOf('encounter-formations.js')<order.indexOf('persistent-party.js'));
});

module.exports={name:'canonical battle envelope: independent 1–3 sides, formations and element metadata',checks,
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' canonical envelope checks passed');}};
