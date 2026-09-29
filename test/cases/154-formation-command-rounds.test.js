'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,expression)=>JSON.parse(g.run('JSON.stringify('+expression+')'));
const HIT=[0.5,0.99,0.99];
const DODGE=[0.5,0.99,0.5]; // evaded with Bullet Time, not ordinary speeds
function fresh(count=2,escape='blocked') {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=()=>{throw Error('RNG outside tape');};
    dialogue.open=false;menu.open=false;statusEffects=[];
    stats.hp=100;stats.maxHp=100;stats.atk=8;stats.def=2;stats.spd=7;
    stats.weapon=stats.armor=stats.shield=stats.accessory=null;stats.items=[];`);
  if(count)g.run('initializeFormationState('+JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:'enemy_marsh_wisp',slot})))+',{escape:'+JSON.stringify(escape)+'});');
  return g;
}
function tape(g,values,expression,hook={}) {
  const old=g.run('Math.random');
  g.run(`var commandTape=${JSON.stringify(values)},commandUsed=0,commandHooks=${JSON.stringify(hook)};
    Math.random=()=>{const i=commandUsed++;if(i>=commandTape.length)throw Error('tape exhausted');
      if(commandHooks[i])eval(commandHooks[i]);return commandTape[i];};`);
  try {const result=g.run(expression);assert.equal(g.run('commandUsed'),values.length,'exact tape: no extra or unused RNG');return result;}
  finally {g.run('Math').random=old;}
}
const target=(g,slot=0)=>g.run('combat.enemies['+slot+'].instanceId');
const attack=(g,slot=0)=>({type:'attack',targetInstanceId:target(g,slot)});
const observe=(g,slot=0)=>({type:'observe',targetInstanceId:target(g,slot)});
function item(g,id,slot=null) {
  g.run('stats.items.push(createItem('+JSON.stringify(id)+'));');
  return {type:'item',itemId:id,...slot===null?{}:{targetInstanceId:target(g,slot)}};
}
function state(g) {
  return g.run(`JSON.stringify({stats,statusEffects,slitherSpd,day,player,
    location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),
    combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat))
      .filter(([,d])=>'value' in d).map(([k,d])=>[k,d.value])),
    observations:combat.enemies.map(e=>[e.instanceId,e.slot,e.observeCount,e.escapeUnlocked]),
    rounds:formationRounds.getView(),sequence:combatEnemyInstanceSequence,
    dialogue,choice,save:localStorage.getItem('verdantVale_save')})`);
}
function reject(g,expression) {
  const before=state(g),members=g.run('combat.enemies');
  assert.throws(()=>tape(g,[],expression),/Invalid|Unsupported|Unsafe|requires completed/);
  assert.equal(state(g),before);assert.equal(g.run('combat.enemies'),members);
  assert.equal(g.run('commandUsed'),0);
}
function resolve(g,command,values,{ack=true,hook={}}={}) {
  tape(g,values,'var commandResult=resolveFormationRound('+JSON.stringify(command)+');',hook);
  const before=state(g);
  g.run('var commandReel=createFormationRoundPlayback(commandResult);');
  const result=J(g,'commandResult'),reel=J(g,'commandReel');
  for(let i=reel.frameCount-1;i>=0;i--)g.run('projectFormationPlaybackFrame(commandReel,'+i+');');
  assert.equal(state(g),before,'all playback reads are effect-free and RNG-free');
  assert.equal(reel.frames.at(-1).player.hp,g.run('stats.hp'));
  assert.deepEqual(reel.frames.at(-1).enemies.map(e=>e.hp),J(g,'combat.enemies.map(e=>e.hp)'));
  if(ack)g.run('acknowledgeFormationRound(commandReel,commandReel.frameCount-1);');
  return {result,reel};
}
const actions=result=>result.events.filter(e=>e.type==='attack');

test('generalized and compatibility Attack share exact output, RNG, HP and playback',()=>{
  const a=fresh(3),b=fresh(3),values=[0.99,0,0.99,...HIT,...HIT,...HIT,...HIT];
  tape(a,values,'var commandResult=resolveFormationBasicAttackRound('+JSON.stringify(attack(a,1))+');');
  a.run('var commandReel=createFormationRoundPlayback(commandResult);');
  const actual=resolve(b,attack(b,1),values,{ack:false});
  assert.deepEqual(actual.result,J(a,'commandResult'));
  assert.deepEqual(actual.reel,J(a,'commandReel'));
  assert.deepEqual(J(a,'formationRounds.getView()'),J(b,'formationRounds.getView()'));
});

for(const living of [1,2,3])test(living+' living members share one committed round and full Bullet Time application duration',()=>{
  const g=fresh(3);g.run('combat.enemies.forEach((e,i)=>{if(i>='+living+')e.hp=0;});');
  resolve(g,item(g,'Bullet Time'),[...Array(living).fill(0),...Array(living).fill(DODGE).flat()]);
  assert.equal(g.run('combat.evadeTurns'),3);assert.equal(g.run('stats.hp'),100);
  for(const remaining of [2,1,0]) {
    const r=resolve(g,observe(g),[...Array(living).fill(0),...Array(living).fill(DODGE).flat()]);
    assert.equal(actions(r.result).length,living);assert.ok(actions(r.result).every(e=>e.evaded));
    assert.equal(g.run('combat.evadeTurns'),remaining);
  }
  assert.equal(g.run('formationRounds.getView().completedRounds'),4);
  resolve(g,observe(g),[...Array(living).fill(0),...Array(living).fill(DODGE).flat()]);
  assert.equal(g.run('stats.hp'),100-3*living,'buff expires after its three subsequent rounds');
  assert.equal(g.run('combat.enemies.length'),3,'retained membership is not collapsed');
});

test('healing occupies Lely slot, after faster damage and before slower damage',()=>{
  const g=fresh();g.run('stats.hp=70;');
  const {result,reel}=resolve(g,item(g,'Potion'),[0.99,0,...HIT,...HIT]);
  assert.deepEqual(result.events.map(e=>e.type),['attack','item','attack','round_end','outcome']);
  assert.deepEqual(reel.frames.map(f=>f.player.hp),[70,67,87,84,84,84]);
  assert.deepEqual(J(g,'stats.items'),[]);
  assert.equal(result.events[1].consumed,true);
});
test('overheal clamps using the production healing authority',()=>{
  const g=fresh();g.run('stats.hp=95;');
  const {result}=resolve(g,item(g,'Elixir'),[0,0,...HIT,...HIT]);
  assert.equal(result.events[0].after.player.hp,100);
});
test('duplicate inventory entries consume exactly one unit, and possession has no passive effect',()=>{
  const g=fresh();g.run("stats.items=[createItem('Potion'),createItem('Potion'),createItem('Bullet Time')];stats.hp=70;");
  const before=state(g);g.run('formationRounds.getView();');assert.equal(state(g),before);
  resolve(g,{type:'item',itemId:'Potion'},[0,0,...HIT,...HIT]);
  assert.deepEqual(J(g,'stats.items.map(i=>i.name)'),['Potion','Bullet Time']);assert.equal(g.run('combat.evadeTurns'),0);
});
for(const commandType of ['item','observe','run'])test('defeat before '+commandType+' consumes no player-action effect or RNG',()=>{
  const g=fresh(2,'fastest_living');g.run('stats.hp=1;');
  const cmd=commandType==='item'?item(g,'Potion'):commandType==='observe'?observe(g):{type:'run'};
  const {result}=resolve(g,cmd,[0.99,0.99,...HIT]);
  assert.equal(result.outcome,'defeat');assert.equal(g.run('stats.hp'),0);
  assert.equal(result.events.filter(e=>e.type===commandType).length,0);
  assert.equal(g.run('combat.enemies[0].observeCount'),0);
  assert.equal(g.run('stats.items.length'),commandType==='item'?1:0);
  assert.equal(g.run('formationRounds.getView().completedRounds'),1);
});
for(const [id,cured] of [['Reed Remedy','poison'],['Amethyst Dust','cursed']])test(id+' cures only its authored status without HP restoration',()=>{
  const g=fresh();g.run("statusEffects=['poison','cursed','dazzled'];");
  const {result}=resolve(g,item(g,id),[0,0,...HIT,...HIT]);
  assert.deepEqual(J(g,'statusEffects'),['poison','cursed','dazzled'].filter(s=>s!==cured));
  assert.equal(result.events[0].before.player.hp,result.events[0].after.player.hp);
});
test('Bullet Time starts at its scheduled action, not at command commitment',()=>{
  const g=fresh();const {result}=resolve(g,item(g,'Bullet Time'),[0.99,0,...DODGE,...DODGE]);
  assert.deepEqual(actions(result).map(e=>e.evaded),[false,true]);
  assert.equal(g.run('stats.hp'),97);assert.equal(g.run('combat.evadeTurns'),3);
});
test('reapplying Bullet Time gives three fresh subsequent rounds',()=>{
  const g=fresh();resolve(g,item(g,'Bullet Time'),[0,0,...DODGE,...DODGE]);
  resolve(g,observe(g),[0,0,...DODGE,...DODGE]);assert.equal(g.run('combat.evadeTurns'),2);
  resolve(g,item(g,'Bullet Time'),[0,0,...DODGE,...DODGE]);assert.equal(g.run('combat.evadeTurns'),3);
});

for(const id of ['Sapper Charge','Throwing Knife'])test(id+' affects only the selected duplicate and skips its dead action',()=>{
  const g=fresh();const {result,reel}=resolve(g,item(g,id,1),[0,0,...HIT]);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.hp)'),[14,0]);
  assert.equal(result.outcome,'ongoing');assert.equal(result.events[0].targetId,target(g,1));
  assert.equal(result.events[2].type,'skip');assert.equal(reel.frames[0].enemies[1].hp,14);
});
test('final enemy killed by an item ends the round once and consumes no later attack rolls',()=>{
  const g=fresh();g.run('combat.enemies[0].hp=0;');
  const {result}=resolve(g,item(g,'Sapper Charge',1),[0]);
  assert.equal(result.outcome,'victory');assert.equal(g.run('formationRounds.getView().completedRounds'),1);
  assert.equal(g.run('combat.pendingVictory'),false);
});
test('Bomb holds exact identity across three full subsequent rounds, without application-round fuse loss',()=>{
  const g=fresh();resolve(g,item(g,'Bomb',1),[0,0,...HIT,...HIT]);
  assert.equal(g.run('combat.bombFuse'),3);assert.equal(g.run('combat.bombTargetInstanceId'),target(g,1));
  for(const fuse of [2,1,0]) {
    const {result}=resolve(g,observe(g),[0,0,...HIT,...HIT]);
    assert.equal(g.run('combat.bombFuse'),fuse);
    assert.equal(result.events.find(e=>e.type==='bomb_tick').targetId,target(g,1));
    assert.equal(g.run('combat.enemies[1].hp'),fuse?14:0);
    assert.equal(g.run('combat.enemies[0].hp'),14);
  }
  assert.equal(g.run('combat.bombTargetInstanceId'),null);
  assert.equal(g.run('combat.bombDamage'),0);
});
test('one-bomb replacement binds the newly selected target without two ticking fuses',()=>{
  const g=fresh();resolve(g,item(g,'Bomb',0),[0,0,...HIT,...HIT]);
  resolve(g,item(g,'Bomb',1),[0,0,...HIT,...HIT]);
  assert.equal(g.run('combat.bombFuse'),3);assert.equal(g.run('combat.bombTargetInstanceId'),target(g,1));
});
test('a dead armed-bomb target is cleared without redirecting to its duplicate',()=>{
  const g=fresh();resolve(g,item(g,'Bomb',0),[0,0,...HIT,...HIT]);
  g.run('combat.enemies[0].hp=1;');
  const {result}=resolve(g,attack(g),[0,0,...HIT,...HIT]);
  assert.equal(result.events.find(e=>e.type==='bomb_tick').appliedDamage,0);
  assert.equal(g.run('combat.enemies[1].hp'),14);assert.equal(g.run('combat.bombFuse'),0);
});

test('Observe uses authored text at the scheduled slot and advances only one duplicate',()=>{
  const g=fresh();const expected=J(g,'getObservationText(combat.enemies[1],0)');
  const {result,reel}=resolve(g,observe(g,1),[0.99,0,...HIT,...HIT]);
  const event=result.events[1];assert.equal(event.type,'observe');assert.deepEqual(event.lines,expected);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.observeCount)'),[0,1]);
  assert.deepEqual(reel.frames.map(f=>f.enemies[1].observeCount),[0,0,1,1,1,1]);
  for(let i=0;i<5;i++)g.run('projectFormationPlaybackFrame(commandReel,2);');
  assert.equal(g.run('combat.enemies[1].observeCount'),1);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.escapeUnlocked)'),[false,false]);
});
test('repeat Observe preserves authored progress and does not invent group escape unlocks',()=>{
  const g=fresh();for(let i=0;i<4;i++) {
    const expected=J(g,'getObservationText(combat.enemies[0],'+i+')');
    const {result}=resolve(g,observe(g),[0,0,...HIT,...HIT]);
    assert.deepEqual(result.events[0].lines,expected);
  }
  assert.deepEqual(J(g,'combat.enemies.map(e=>[e.observeCount,e.escapeUnlocked])'),[[4,false],[0,false]]);
  resolve(g,{type:'run'},[0,0,...HIT,...HIT]);
});
test('all approved templates produce valid copied authored observations',()=>{
  for(const id of J(fresh(0),'FORMATION_STATE_TEMPLATE_IDS')) {
    const g=fresh(0);g.run('initializeFormationState('+JSON.stringify([{enemyId:id,slot:0},{enemyId:id,slot:1}])+');');
    const expected=J(g,'getObservationText(combat.enemies[0],0)');
    const {result}=resolve(g,observe(g),[0,0,...HIT,...HIT]);
    assert.deepEqual(result.events[0].lines,expected);
  }
});

for(const type of ['item','observe'])for(const removed of [false,true])test(type+' committed target '+(removed?'removed':'dead')+' never redirects or consumes item/progress',()=>{
  const g=fresh(),cmd=type==='item'?item(g,'Throwing Knife',0):observe(g);
  const hook=removed?'combat.enemies=Object.freeze([createCombatEnemyInstance(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,0),combat.enemies[1]]);':'combat.enemies[0].hp=0;';
  // Isolated hostile RNG hook, impossible during normal synchronous play. Like
  // the original Attack identity probes, a changed membership is not playable history.
  tape(g,[0,0.99,...HIT],'var commandResult=resolveFormationRound('+JSON.stringify(cmd)+');',{4:hook});
  assert.equal(g.run('commandResult.events[1].type'),'cancel');
  assert.equal(g.run('commandResult.events[1].reason'),removed?'target_removed':'target_dead');
  assert.equal(g.run('stats.items.length'),type==='item'?1:0);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.observeCount)'),[0,0]);
  assert.equal(g.run('combat.enemies[1].hp'),14);
});

test('Run uses exactly one roll against fastest living enemy, ignoring a faster dead member',()=>{
  const g=fresh(3,'fastest_living');g.run('combat.enemies[0].spd=3;combat.enemies[1].spd=12;combat.enemies[2].spd=30;combat.enemies[2].hp=0;');
  const {result}=resolve(g,{type:'run'},[0,0,0.2]);
  const e=result.events[0];assert.equal(e.opponentId,target(g,1));
  assert.equal(e.chance,g.run('speedWinChance(effectiveSpd(),12)'));
  assert.equal(result.outcome,'escape');assert.equal(actions(result).length,0);
  assert.equal(g.run('combat.pendingEscape'),false);assert.equal(g.run('formationRounds.getView().completedRounds'),1);
  reject(g,'resolveFormationRound('+JSON.stringify(attack(g))+')');
});
test('failed Run consumes one escape roll then permits every later enemy action',()=>{
  const g=fresh(2,'fastest_living');const {result}=resolve(g,{type:'run'},[0,0,0.99,...HIT,...HIT]);
  assert.equal(result.outcome,'ongoing');assert.equal(actions(result).length,2);
  assert.equal(result.events[0].success,false);
});
test('faster enemies act before successful Run, then later enemies are cancelled',()=>{
  const g=fresh(2,'fastest_living');const {result}=resolve(g,{type:'run'},[0.99,0,...HIT,0]);
  assert.equal(result.outcome,'escape');assert.equal(g.run('stats.hp'),97);
  assert.deepEqual(result.events.map(e=>e.type),['attack','run','round_end','outcome']);
});
test('locked Run spends a round with no escape roll and all enemy responses',()=>{
  const g=fresh();const {result}=resolve(g,{type:'run'},[0,0,...HIT,...HIT]);
  assert.deepEqual(result.events[0],{type:'run',actorType:'player',actorId:'player',targetId:'player',allowed:false,
    opponentId:target(g),chance:0,roll:null,success:false});
  assert.equal(result.outcome,'ongoing');assert.equal(g.run('stats.hp'),94);
});

test('the actual Receiver owner remains escape-blocked after repeated Observe',()=>{
  const g=fresh(0);g.run(`reservoir_quest_started=true;gallery_deeper_stair_seen=true;
    stats.hp=500;stats.maxHp=500;stats.def=8;
    descendSunkenGallery();placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,2.5*TILE);ascendSunkenGallery();`);
  for(let i=0;i<7;i++)g.press('Enter');
  assert.equal(g.run('galleryReceiverEncounter.ownsCombat()'),true);
  // Test the headless policy directly without invoking the canonical finalizer.
  g.run('combat.enemies.forEach(e=>e.observeCount=4);');
  const {result}=resolve(g,{type:'run'},[0,0,0,...HIT,...HIT,...HIT],{ack:false});
  assert.equal(result.events[0].allowed,false);assert.equal(result.outcome,'ongoing');
  assert.equal(g.run('gallery_receiver_defeated'),false);
});
test('Lab explicitly permits headless Run and established exit restores HP/location without rewards',()=>{
  const g=fresh(0);g.run("resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);player.facing='left';");
  const original=J(g,'[stats.hp,tick,player,snapshotLocationState(),stats.gold,stats.xp,QUEST_FLAG_BINDINGS.map(b=>b.get())]');
  g.press('`');for(let i=0;i<11;i++)g.press('ArrowDown');g.press('Enter');g.press('Enter');
  assert.equal(g.run('formationCombatLab.isActive()'),true);
  const {result}=resolve(g,{type:'run'},[0.99,0,...HIT,0],{ack:false});
  assert.equal(result.outcome,'escape');assert.equal(g.run('formationCombatLab.exit()'),true);
  assert.deepEqual(J(g,'[stats.hp,tick,player,snapshotLocationState(),stats.gold,stats.xp,QUEST_FLAG_BINDINGS.map(b=>b.get())]'),original);
  assert.equal(g.run('formationRounds.getView()'),null);assert.equal(g.run('formationSessionController.getView()'),null);
  assert.equal(g.run('combat.enemies.length'),0);
});

test('rounds cannot resolve again until completed playback is explicitly acknowledged',()=>{
  const g=fresh();resolve(g,observe(g),[0,0,...HIT,...HIT],{ack:false});
  reject(g,'resolveFormationRound('+JSON.stringify(observe(g))+');');
  reject(g,'acknowledgeFormationRound(commandReel,0);');
  g.run('projectFormationPlaybackFrame(commandReel,commandReel.frameCount-1);');
  reject(g,'resolveFormationRound('+JSON.stringify(observe(g))+');');
  g.run('acknowledgeFormationRound(commandReel,commandReel.frameCount-1);');
  resolve(g,observe(g),[0,0,...HIT,...HIT]);
  assert.equal(g.run('formationRounds.getView().completedRounds'),2);
});
test('a session cannot begin over an unresolved headless round',()=>{
  const g=fresh();resolve(g,attack(g),[0,0,...HIT,...HIT,...HIT],{ack:false});
  reject(g,'formationSessionController.begin();');
  assert.equal(g.run('formationSessionController.getView()'),null);
});
test('session navigation/cancel changes no round/duration; playback acknowledgement releases exactly once',()=>{
  const g=fresh();g.run('formationSessionController.begin();formationSessionController.beginAttack();formationSessionController.moveTarget("next");formationSessionController.cancelTargeting();');
  assert.equal(g.run('formationRounds.getView().completedRounds'),0);
  g.run('formationSessionController.beginAttack();');
  tape(g,[0,0,...HIT,...HIT,...HIT],'formationSessionController.confirmTarget();');
  reject(g,'resolveFormationRound('+JSON.stringify(observe(g))+');');
  while(g.run('formationSessionController.getView().phase')==='playback')g.run('formationSessionController.advancePlayback();');
  assert.equal(g.run('formationRounds.getView().completedRounds'),1);
  g.run('formationSessionController.acknowledgePlayback();');
  assert.equal(g.run('formationRounds.getView().awaitingPlayback'),false);
});

const malformed=['null','undefined','[]','{}','{type:"item"}','{type:"run",targetInstanceId:"combat_enemy_1"}',
  '{type:"run",escape:true}','{type:"observe"}','{type:"attack"}',
  '{type:"item",itemId:"Potion",targetInstanceId:"combat_enemy_1"}',
  '{type:"item",itemId:"Bomb"}','{type:"item",itemId:"Warp Stone"}',
  '{type:"item",itemId:"missing"}','{type:"observe",targetInstanceId:"enemy_marsh_wisp"}',
  '{type:"attack",targetInstanceId:"combat_enemy_999"}',
  '{get type(){throw Error("getter ran");}}','{type:"run",callback:()=>{}}'];
for(const expression of malformed)test('invalid closed command is atomic: '+expression,()=>{
  const g=fresh();reject(g,'resolveFormationRound('+expression+');');
});
test('missing inventory rejects before initiative, round, HP, observations or identities',()=>{
  const g=fresh();reject(g,'resolveFormationRound({type:"item",itemId:"Potion"})');
});
for(const type of ['attack','observe','item'])test('initial dead target is invalid before initiative: '+type,()=>{
  const g=fresh();g.run('combat.enemies[0].hp=0;');
  const command=type==='item'?item(g,'Bomb',0):{type,targetInstanceId:target(g)};
  reject(g,'resolveFormationRound('+JSON.stringify(command)+')');
});
for(const mutation of [
  'combat.enemies[0].atk=Number.MAX_SAFE_INTEGER;',
  'combat.enemies[0].specialActions=[];',
  'combat.corrosion=1;',
  'combat.evadeTurns=Infinity;',
  'stats.items=Object.freeze(stats.items);',
  'Object.defineProperty(stats.items,"0",{get(){throw Error("getter ran");}});',
  'stats.items[0].heals=Number.MAX_SAFE_INTEGER+1;',
  'stats.armor={name:"unknown",type:"armor",bonus:1};',
  'statusEffects=["unknown"];',
  'slitherSpd=NaN;',
])test('unsupported mutable state rejects before RNG: '+mutation,()=>{
  const g=fresh();const cmd=item(g,'Potion');g.run(mutation);
  // Accessor fixture cannot itself be serialized. Descriptor rejection must
  // occur before invoking its throwing getter or starting initiative.
  if(mutation.includes('get(){')) {
    assert.throws(()=>tape(g,[],'resolveFormationRound('+JSON.stringify(cmd)+')'),/Invalid formation inventory/);
    assert.equal(g.run('commandUsed'),0);assert.equal(g.run('formationRounds.getView().completedRounds'),0);
  } else reject(g,'resolveFormationRound('+JSON.stringify(cmd)+')');
});

// Every currently menu-usable definition is audited, including equipment and
// non-regenerator/sex-mismatch items. Tests use production effect authorities.
const inventory=JSON.parse(createContext().run('JSON.stringify(ITEM_REGISTRY)'));
for(const [id,definition] of Object.entries(inventory).filter(([,v])=>!v.keyItem))test('registered combat item and authentic playback: '+id,()=>{
  const g=fresh();g.run('stats.hp=70;');
  const targeted=['throwable','reagent','stun'].includes(definition.type);
  const command=item(g,id,targeted?0:null);
  const kills=definition.type==='throwable'&&!definition.fuse;
  const {result}=resolve(g,command,[0,0,...HIT,...kills?[]:HIT]);
  const e=result.events[0];assert.equal(e.type,'item');assert.equal(e.itemId,id);
  assert.equal(g.run('stats.items.length'),id==='Bait'?1:0);
  assert.equal(g.run('formationRounds.getView().completedRounds'),1);
  if(['weapon','armor','shield','accessory'].includes(definition.type))assert.equal(g.run('stats.'+definition.type+'.name'),id);
});
test('equipment exchange preserves the old item and Cat Armor cap bypass',()=>{
  const g=fresh();g.run("stats.armor=createItem('Leather Armor');stats.def=50;combat.enemies.forEach(e=>e.atk=20);");
  const {result}=resolve(g,item(g,'Cat Armor'),[0.99,0,...HIT,...HIT]);
  assert.deepEqual(actions(result).map(e=>e.appliedDamage),[4,1]);
  assert.deepEqual(J(g,'stats.items.map(i=>i.name)'),['Leather Armor']);
});
test('EvadeAll equipment begins at its action slot and consumes normal evade RNG',()=>{
  const g=fresh();const {result}=resolve(g,item(g,'EvadeAll'),[0.99,0,...HIT,...HIT]);
  assert.deepEqual(actions(result).map(e=>e.evaded),[false,true]);
});
test('Cursed and Dazzled Attack reuse existing formulas/extra curse roll without status application',()=>{
  const g=fresh();g.run("statusEffects=['cursed','dazzled'];");
  const {result}=resolve(g,attack(g),[0,0,0.5,0,0,0.99,...HIT,...HIT]);
  assert.equal(result.events[0].attemptedDamage,1);assert.equal(result.events[0].critical,false);
  assert.deepEqual(J(g,'statusEffects'),['cursed','dazzled']);
});
test('Slither speed and Burn tick occur once per round and playback never rerolls',()=>{
  const g=fresh(3);g.run("statusEffects=['slither','burn'];");
  const {result,reel}=resolve(g,observe(g),[0.5,0,0,0,...HIT,...HIT,...HIT,0.5]);
  assert.equal(result.events[0].type,'speed');assert.equal(result.events[0].after,11);
  assert.equal(result.events.filter(e=>e.type==='burn').length,1);
  assert.equal(result.events.find(e=>e.type==='burn').attemptedDamage,10);
  assert.equal(reel.frames[0].player.slitherSpd,1);assert.equal(reel.frames[1].player.slitherSpd,11);
});
for(const type of ['item','run'])test(type+' preserves singleton Slither rule: no fresh speed roll',()=>{
  const g=fresh();g.run("statusEffects=['slither'];slitherSpd=9;");
  const command=type==='item'?item(g,'Potion'):{type:'run'};
  const {result}=resolve(g,command,[0,0,...HIT,...HIT]);
  assert.equal(g.run('slitherSpd'),9);assert.equal(result.events.some(e=>e.type==='speed'),false);
});
test('Muddied mitigation/speed and Dazzled accuracy use unchanged production helpers',()=>{
  const g=fresh();g.run("statusEffects=['muddied','dazzled'];");
  assert.equal(g.run('effectiveDef()'),1);assert.equal(g.run('effectiveSpd()'),5);
  const {result}=resolve(g,attack(g),[0,0,0.5,0.99,0.15,...HIT,...HIT]);
  assert.equal(result.events[0].evaded,true);
  assert.deepEqual(actions(result).slice(1).map(e=>e.appliedDamage),[4,4]);
});
test('unsafe offensive item and prospective equipment numbers reject before consumption or RNG',()=>{
  for(const setup of [
    `ITEM_REGISTRY['Sapper Charge'].damage=Number.MAX_SAFE_INTEGER+1;stats.items=[createItem('Sapper Charge')];`,
    `ITEM_REGISTRY['Iron Sword'].bonus=Number.MAX_SAFE_INTEGER;stats.items=[createItem('Iron Sword')];`,
  ]) {
    const g=fresh();g.run(setup);
    const command=setup.includes('Sapper')?{type:'item',itemId:'Sapper Charge',targetInstanceId:target(g)}:{type:'item',itemId:'Iron Sword'};
    reject(g,'resolveFormationRound('+JSON.stringify(command)+')');
  }
});
test('safe boundary offensive damage remains an integer and creates authentic playback',()=>{
  const g=fresh();g.run(`ITEM_REGISTRY['Sapper Charge'].damage=Number.MAX_SAFE_INTEGER;
    stats.items=[createItem('Sapper Charge')];`);
  const {result}=resolve(g,{type:'item',itemId:'Sapper Charge',targetInstanceId:target(g)},[0,0,...HIT]);
  assert.equal(result.events[0].after.enemies[0].hp,0);
  assert.equal(g.run('combat.enemies[1].hp'),14);
});
test('Burn defeat at end of round cancels bomb tick and still counts one completed round',()=>{
  const g=fresh();g.run('stats.hp=7;');resolve(g,item(g,'Bomb',0),[0,0,...HIT,...HIT]);
  g.run("stats.hp=7;statusEffects=['burn'];");
  const {result}=resolve(g,observe(g),[0,0,...HIT,...HIT,0.99]);
  assert.equal(result.outcome,'defeat');assert.equal(g.run('combat.bombFuse'),3);
  assert.equal(g.run('formationRounds.getView().completedRounds'),2);
});

for(const cmd of ['item','observe','run'])test(cmd+' history is immutable, effects are not replayed, and tampering fails atomically',()=>{
  const g=fresh(2,'fastest_living');g.run('stats.hp=70;');
  const command=cmd==='item'?item(g,'Potion'):cmd==='observe'?observe(g):{type:'run'};
  const values=cmd==='run'?[0,0,0.99,...HIT,...HIT]:[0,0,...HIT,...HIT];
  resolve(g,command,values,{ack:false});const original=state(g),historical=g.run('JSON.stringify(commandReel)');
  assert.equal(g.run('Object.isFrozen(commandResult.events[0])'),true);
  for(const mutation of [
    'tampered.events[0].actorId="enemy_marsh_wisp";',
    'tampered.events.pop();',
    'tampered.after.player.hp++;',
    'tampered.roundAfter++;',
    'tampered.events[0].unknown=true;',
    'tampered.before.player.inventory.push("Potion");',
  ]) {
    g.run('var tampered=JSON.parse(JSON.stringify(commandResult));'+mutation);
    assert.throws(()=>g.run('createFormationRoundPlayback(tampered)'),/Invalid formation playback/);
    assert.equal(state(g),original);
  }
  g.run('stats.hp=1;combat.enemies[0].hp=0;setSingleCombatEnemy(null);');
  assert.equal(g.run('JSON.stringify(commandReel)'),historical);
});
test('no rewards, queues, flags, saves, finalizers or forbidden gameplay helpers execute',()=>{
  const g=fresh();const before=J(g,'[stats.gold,stats.xp,day,QUEST_FLAG_BINDINGS.map(b=>b.get()),dialogue,combat.messageQueue,combat.pendingVictory,combat.pendingDefeat,combat.pendingEscape]');
  g.run(`applyKillRewards=advanceCombatMessage=handleCombatAction=endCombat=saveGame=()=>{throw Error('forbidden singleton effect');};`);
  resolve(g,item(g,'Potion'),[0,0,...HIT,...HIT]);
  resolve(g,observe(g),[0,0,...HIT,...HIT]);
  resolve(g,{type:'run'},[0,0,...HIT,...HIT]);
  assert.deepEqual(J(g,'[stats.gold,stats.xp,day,QUEST_FLAG_BINDINGS.map(b=>b.get()),dialogue,combat.messageQueue,combat.pendingVictory,combat.pendingDefeat,combat.pendingEscape]'),before);
});
test('rounds/effects/commands are transient; cleanup resets and save/load does not revive them',()=>{
  const g=fresh(0);g.run('saveGame();');const saved=g.run("localStorage.getItem('verdantVale_save')");
  g.run("initializeFormationState([{enemyId:'enemy_marsh_wisp',slot:0},{enemyId:'enemy_marsh_wisp',slot:1}]);");
  resolve(g,item(g,'Bullet Time'),[0,0,...DODGE,...DODGE]);
  g.run('setSingleCombatEnemy(null);');
  assert.equal(g.run('formationRounds.getView()'),null);assert.equal(g.run('combat.evadeTurns'),0);
  assert.equal(g.run('loadGame()'),true);
  assert.equal(g.run('formationRounds.getView()'),null);assert.equal(g.run('formationSessionController.getView()'),null);
  assert.equal(g.run('combat.enemies.length'),0);
  assert.equal(g.run("localStorage.getItem('verdantVale_save')"),saved);
  assert.doesNotMatch(saved,/formationRounds|commandResult|instanceId|observeCount|escapePolicy|completedRounds/);
});
test('menus share the generalized authority without duplicate item data or direct gameplay resolution',()=>{
  for(const file of scriptOrderFromIndexHtml()) {
    const source=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
    if(file!=='combat.js')assert.doesNotMatch(source,/\bresolveFormationRound\s*\(/,file);
    if(['input.js','render-battle.js','save.js'].includes(file))assert.doesNotMatch(source,/formationRounds|acknowledgeFormationRound/,file);
  }
  const g=fresh();g.run('formationSessionController.begin();');
  assert.deepEqual(J(g,'formationSessionController.getView().availableActions'),['attack','item','observe','run']);
  assert.doesNotMatch(g.run('resolveFormationRound.toString()'),/combat\.enemy\b|applyKillRewards|handleCombatAction|advanceCombatMessage|endCombat\(|saveGame\(/);
});

module.exports={name:'generalized headless formation rounds: commands, durations, exact RNG and immutable effect history',checks,
  run(){for(const check of checks){try{check.run();}catch(e){e.message=check.name+': '+e.message;throw e;}}
    console.log('  '+checks.length+' generalized formation command checks passed');}};
