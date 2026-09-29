'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {createContext, scriptOrderFromIndexHtml} = require('../harness');
const checks = [];
const test = (name, run) => checks.push({name, run});
const J = (g, source) => JSON.parse(g.run('JSON.stringify(' + source + ')'));
const HIT = [0.5, 0.99, 0.99];
const descriptors = '[{enemyId:"enemy_marsh_wisp",slot:0},{enemyId:"enemy_marsh_wisp",slot:1}]';

function fresh() {
  const g = createContext();
  g.run(`Math=Object.create(Math); Math.random=()=>{throw Error('unexpected RNG');};
    dialogue.open=false; statusEffects=[]; stats.hp=100; stats.maxHp=100;
    stats.atk=100; stats.def=2; stats.spd=7; stats.level=MAX_LEVEL;
    stats.weapon=null; stats.armor=null; stats.shield=null; stats.accessory=null;
    resetLocationState(); placeAtLocation('MAP',7.5*TILE,9.5*TILE); player.facing='left';`);
  return g;
}
function tape(g, values, work) {
  g.run(`var hardeningTape=${JSON.stringify(values)}, hardeningUsed=0;
    Math.random=()=>{if(hardeningUsed===hardeningTape.length)throw Error('tape exhausted');return hardeningTape[hardeningUsed++];};`);
  try {work(); assert.equal(g.run('hardeningUsed'), values.length, 'exact RNG consumption');}
  finally {g.run("Math.random=()=>{throw Error('unexpected RNG');};");}
}
function state(g) {
  return g.run(`JSON.stringify({stats,player,statusEffects,day,tick,
    location:regionalWorldPosition(),map:mapIdForRef(activeMap),locationState:snapshotLocationState(),
    flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),npcs:SIMPLE_NPCS,
    mode:combat.mode,active:combat.active,
    combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>'value' in d).map(([k,d])=>[k,d.value])),
    observation:combat.enemies.map(e=>[e.observeCount,e.escapeUnlocked]),
    dialogue,sequence:combatEnemyInstanceSequence,receipt:completedSingleVictoryReceipt,
    save:localStorage.getItem('verdantVale_save')},(key,value)=>typeof value==='function'?value.toString():value)`);
}
function world(g) {
  return g.run(`JSON.stringify({stats,player,statusEffects,day,tick,
    location:regionalWorldPosition(),map:mapIdForRef(activeMap),locationState:snapshotLocationState(),
    flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),npcs:SIMPLE_NPCS,dialogue,
    save:localStorage.getItem('verdantVale_save')})`);
}
function rejectPreparation(g) {
  const before=state(g), members=g.run('combat.enemies'), queue=g.run('combat.messageQueue');
  assert.throws(()=>g.run('prepareFormationEntry()'), /Unsupported formation entry/);
  assert.equal(state(g),before); assert.equal(g.run('combat.enemies'),members);
  assert.equal(g.run('combat.messageQueue'),queue);
}
function winToAcknowledgement(g) {
  // Actual ordinary pool selection and complete message processing. No fake
  // terminal fields: the two starter rolls and eight Attack/reward rolls are
  // the early Briar Hound path selected by this fixed production tape.
  tape(g,Array(2).fill(0.5),()=>g.run('startCombat();combat.flashTimer=0;'));
  g.run('var wonTemplate={...combat.enemy};');
  tape(g,Array(8).fill(0.5),()=>g.press('Enter'));
  for(let i=0;g.run("combat.phase==='message'");i++) {
    assert.ok(i<30);g.press('Enter');
  }
  assert.equal(g.run('combat.phase'),'victory');
}
function ordinaryVictory(g) {winToAcknowledgement(g);g.press('Enter');}
function openLab(g) {
  g.press('`'); for(let i=0;i<11;i++)g.press('ArrowDown');g.press('Enter');
  assert.equal(g.run('formationCombatLab.isMenuOpen()'),true);
}
function completePlayback(g) {
  while(g.run("formationSessionController.getView().phase==='playback'"))g.press('Enter');
  assert.equal(g.run('formationSessionController.getView().phase'),'playback_complete');
  g.press('Enter');
}

test('real acknowledged singleton victory prepares only benign residue and enters the lab',()=>{
  const g=fresh();
  g.run('var rewards=0,realRewards=applyKillRewards;applyKillRewards=(e,q)=>{rewards++;return realRewards(e,q);};');
  const xp=g.run('stats.xp'),gold=g.run('stats.gold'); ordinaryVictory(g);
  assert.deepEqual(J(g,'[combat.active,combat.mode,combat.enemies.length,combat.phase,combat.message,combat.pendingVictory,combat.messageQueue.length]'),
    [false,null,0,'victory','Gained 4 gold.',true,0]);
  assert.equal(g.run('rewards'),1);assert.equal(g.run('stats.xp'),xp+g.run('wonTemplate.xp'));
  assert.equal(g.run('stats.gold'),gold+4);
  const before=world(g),cooldown=g.run('combat.cooldown'),sequence=g.run('combatEnemyInstanceSequence');
  const queue=g.run('combat.messageQueue');
  g.run('prepareFormationEntry();');
  assert.deepEqual(J(g,'[combat.phase,combat.message,combat.pendingVictory]'),['choose','',false]);
  assert.equal(world(g),before);assert.equal(g.run('combat.cooldown'),cooldown);
  assert.equal(g.run('combat.messageQueue'),queue);assert.equal(g.run('combatEnemyInstanceSequence'),sequence);
  const prepared=state(g);g.run('prepareFormationEntry();prepareFormationEntry();');assert.equal(state(g),prepared);
  openLab(g);g.press('Enter');assert.equal(g.run('formationCombatLab.isActive()'),true);
  assert.equal(g.run('rewards'),1);assert.equal(g.run('stats.gold'),gold+4);
});

test('lab itself deliberately prepares receipted victory before its strict initializer',()=>{
  const g=fresh();ordinaryVictory(g);openLab(g);
  g.run(`var prepareCalls=0,realPrepare=prepareFormationEntry,initCalls=0,realInit=initializeFormationState;
    prepareFormationEntry=()=>{prepareCalls++;return realPrepare();};
    initializeFormationState=d=>{initCalls++;if(combat.phase!=='choose'||combat.pendingVictory)throw Error('not prepared');return realInit(d);};`);
  g.press('Enter');assert.equal(g.run('prepareCalls'),1);assert.equal(g.run('initCalls'),1);
  assert.equal(g.run('formationSessionController.getView().phase'),'awaiting_action');
});

test('initializer/session do not silently normalize completed singleton residue',()=>{
  const g=fresh();ordinaryVictory(g);g.run('initializeFormationState('+descriptors+');');
  assert.equal(g.run('combat.phase'),'victory');
  assert.throws(()=>g.run('formationSessionController.begin()'),/Unsupported formation/);
});

test('fresh neutral preparation is idempotent and allocation/RNG free',()=>{
  const g=fresh(),before=state(g);g.run('prepareFormationEntry();prepareFormationEntry();');assert.equal(state(g),before);
});

for(const mutation of [
  'startWardenCombat();',
  'startWardenCombat();combat.active=false;',
  'combat.phase="victory";combat.pendingVictory=true;combat.message="Gained 6 gold.";',
  'combat.phase="defeat";combat.pendingDefeat=true;',
  'combat.pendingEscape=true;', 'combat.pendingLighthouseObjective="ring";',
  'combat.messageQueue=[{text:"drop",apply(){stats.gold++;}}];',
  'combat.messageQueue.pending=()=>{};', 'combat.phase="unknown";',
  'combat.pendingVictory=1;', 'combat.cursor=-1;', 'combat.cooldown=NaN;',
  'combat.newPendingWork=()=>{};', 'combat.bombFuse=1;', 'combat.mireToadRemaining=1;',
  'combat.enemies=Object.freeze([]);Object.defineProperty(combat,"message",{get(){throw Error("getter invoked");}});',
  'Object.defineProperty(combat,"pendingVictory",{writable:false});',
  'stats.hp=0;', 'dialogue.callbacks=[()=>{}];', 'dialogue.triggerEncounterId="fort_polwick";',
  'dialogue.open=true;', 'seraLioraCutscene.active=true;', 'choice.open=true;',
]) test('preparation atomically refuses unresolved/malformed state: '+mutation,()=>{
  const g=fresh();g.run(mutation);rejectPreparation(g);
});

for(const mutation of ['combat.message="different";', 'combat.messageQueue=[];',
  'combat.messageQueue.push("unacknowledged drop");', 'combat.pendingDefeat=true;',
  'dialogue.callbacks=[()=>{}];', 'dialogue.triggerEncounterId="fort_essa";']) {
  test('a valid completion receipt does not excuse subsequent pending work: '+mutation,()=>{
    const g=fresh();ordinaryVictory(g);g.run(mutation);rejectPreparation(g);
  });
}

test('unacknowledged victory and debug-aborted reward messages cannot issue a completion receipt',()=>{
  const g=fresh();winToAcknowledgement(g);rejectPreparation(g);
  g.run('endCombat();');rejectPreparation(g);
  assert.equal(g.run('completedSingleVictoryReceipt'),null);
});

test('real reward messages interrupted before acknowledgement remain unresolved, even after debug cleanup',()=>{
  const g=fresh();tape(g,[0.5,0.5],()=>g.run('startCombat();combat.flashTimer=0;'));
  tape(g,Array(8).fill(0.5),()=>g.press('Enter'));
  assert.equal(g.run('combat.pendingVictory'),true);
  assert.ok(g.run('combat.messageQueue.length')>0);
  rejectPreparation(g);g.run('endCombat();');rejectPreparation(g);
});

test('a throwing real quest finalizer cannot issue a completion receipt',()=>{
  const g=fresh();g.run('stats.atk=10000;Math.random=()=>0.5;startWardenCombat();combat.flashTimer=0;');
  g.press('Enter');while(g.run("combat.phase==='message'"))g.press('Enter');
  g.run("Math.random=()=>{throw Error('unexpected RNG');};refreshJobBoard=()=>{throw Error('incomplete quest callback');};");
  assert.throws(()=>g.press('Enter'),/incomplete quest callback/);
  assert.equal(g.run('completedSingleVictoryReceipt'),null);rejectPreparation(g);
});

test('a new singleton initialization invalidates any previous victory receipt',()=>{
  const g=fresh();ordinaryVictory(g);g.run('startWardenCombat();endCombat();');rejectPreparation(g);
});

for(const starter of ['startFortGuardCombat()', 'startRainfishCombat(2)', 'startMireToadSpawnCombat(2)', 'startSeepSplitCombat(1)']) {
  test('scripted/sequential victory cannot be converted at a pending handoff: '+starter,()=>{
    const g=fresh();g.run('stats.atk=10000;Math.random=()=>0.5;'+starter+';combat.flashTimer=0;');
    g.press('Enter');for(let i=0;g.run("combat.phase==='message'");i++){assert.ok(i<40);g.press('Enter');}
    g.press('Enter');g.run("Math.random=()=>{throw Error('unexpected RNG');};");
    assert.equal(g.run('combat.active'),false);assert.equal(g.run('dialogue.open'),true);
    rejectPreparation(g);g.run('dialogue.open=false;');rejectPreparation(g);
  });
}

test('Warden finalization is completed once before the ordinary completion receipt',()=>{
  const g=fresh();g.run('stats.atk=10000;Math.random=()=>0.5;startWardenCombat();combat.flashTimer=0;');
  g.press('Enter');while(g.run("combat.phase==='message'"))g.press('Enter');g.press('Enter');
  assert.equal(g.run('warden_quest_defeated'),true);
  const before=world(g);g.run("Math.random=()=>{throw Error('unexpected RNG');};prepareFormationEntry();");
  assert.equal(world(g),before);
});

test('post-resolution playback failure aborts only the lab, without retry/RNG, and restores exact HP/tick/world',()=>{
  const g=fresh();g.run('stats.hp=1;stats.atk=8;tick=47;saveGame();');openLab(g);
  const before=world(g);g.press('Enter');g.renderFrame();g.press('Enter');
  // Isolated instrumentation: no production fault switch. Invoke the authentic
  // resolver, then throw where playback would be constructed from its result.
  g.run(`var resolves=0,playbacks=0,hpAtFailure=null,realResolve=resolveFormationRound,realPlayback=createFormationRoundPlayback;
    resolveFormationRound=a=>{resolves++;return realResolve(a);};
    createFormationRoundPlayback=r=>{playbacks++;hpAtFailure=stats.hp;throw Error('injected post-resolution playback failure');};
    var diagnostics=[];console=Object.create(console);console.error=(...args)=>diagnostics.push(args.map(String));
    applyKillRewards=endCombat=finalizeLenswebSpiderEvent=()=>{throw Error('canonical finalizer called');};`);
  tape(g,[0.99,0.99,...HIT],()=>g.hold('Enter'));
  assert.equal(g.run('resolves'),1);assert.equal(g.run('playbacks'),1);assert.equal(g.run('hpAtFailure'),0);
  assert.equal(world(g),before);assert.equal(g.run('combat.mode'),null);assert.equal(g.run('combat.enemies.length'),0);
  assert.equal(g.run('formationSessionController.getView()'),null);
  assert.deepEqual(J(g,'[combat.pendingVictory,combat.pendingDefeat,combat.pendingEscape,combat.message,combat.messageQueue.length]'),[false,false,false,'',0]);
  assert.equal(g.run('formationCombatLab.isMenuOpen()'),true);assert.equal(g.run('debugMenu.cursor'),11);
  assert.match(g.run('formationCombatLab.getView().error'),/Lab aborted safely.*injected/);
  assert.equal(g.run('diagnostics.length'),1);
  g.hold('Enter');assert.equal(g.run('formationCombatLab.isActive()'),false,'held confirm cannot re-enter');g.release('Enter');
  g.run('createFormationRoundPlayback=realPlayback;');
  g.press('Escape');assert.equal(g.run('formationCombatLab.isOpen()'),false,'diagnostic submenu is dismissible');
  g.press('Enter');g.press('Enter');assert.equal(g.run('formationSessionController.getView().phase'),'awaiting_action');
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.instanceId)'),['combat_enemy_3','combat_enemy_4']);
  g.press('Enter');tape(g,[0.99,0.99,...HIT],()=>g.press('Enter'));completePlayback(g);
  assert.equal(g.run('formationSessionController.getView().phase'),'defeat');g.press('Escape');
  assert.equal(world(g),before);assert.equal(g.run('resolves'),2);
});

test('outside-lab controller errors still propagate without recovery or hidden retries',()=>{
  const g=fresh();g.run('initializeFormationState('+descriptors+');formationSessionController.begin();');
  g.press('Enter');g.run("createFormationRoundPlayback=()=>{throw Error('outside lab failure');};");
  tape(g,[0,0,...HIT,...HIT],()=>assert.throws(()=>g.press('Enter'),/outside lab failure/));
  assert.equal(g.run('formationCombatLab.isOpen()'),false);assert.equal(g.run('combat.mode'),'formation');
  assert.equal(g.run('formationSessionController.getView().phase'),'targeting');
  assert.throws(()=>g.run('formationCombatLab.runOperation(()=>{})'),/requires an active lab/);
});

function evadedRound() {
  const g=fresh();g.run('stats.atk=8;initializeFormationState('+descriptors+');');
  tape(g,Array(11).fill(0),()=>g.run('var result=resolveFormationBasicAttackRound({type:"attack",targetInstanceId:combat.enemies[0].instanceId});'));
  return g;
}
function rejectPlayback(g) {
  const before=state(g),members=g.run('combat.enemies');
  assert.throws(()=>g.run('createFormationRoundPlayback(result)'),/Invalid formation playback/);
  assert.equal(state(g),before);assert.equal(g.run('combat.enemies'),members);
}
for(const index of [0,1,2])for(const [type,reason] of [
  ['skip','actor_dead'],['skip','actor_removed'],['cancel','target_dead'],['cancel','target_removed'],['skip','unknown'],
])test('historically false '+type+'/'+reason+' at actor '+index+' rejects unchanged',()=>{
  const g=evadedRound();g.run(`result.events[${index}]={type:${JSON.stringify(type)},...result.order[${index}],reason:${JSON.stringify(reason)}};`);
  rejectPlayback(g);
});

test('authentic dead-actor skip stays valid and cannot borrow a living duplicate identity',()=>{
  const g=fresh();g.run('initializeFormationState('+descriptors+');');
  tape(g,[0,0,...HIT,...HIT],()=>g.run('var result=resolveFormationBasicAttackRound({type:"attack",targetInstanceId:combat.enemies[0].instanceId});'));
  assert.equal(g.run('result.events[1].reason'),'actor_dead');
  const before=state(g);g.run('createFormationRoundPlayback(result);');assert.equal(state(g),before);
  g.run('result.events[1].actorId=combat.enemies[1].instanceId;');rejectPlayback(g);
});

test('only the lab invokes preparation and its emergency wrapper; no content/save/reward caller exists',()=>{
  for(const file of scriptOrderFromIndexHtml()) {
    const source=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
    assert.equal((source.match(/\bprepareFormationEntry\(/g)||[]).length,['combat.js','formation-lab.js','gallery-receiver.js'].includes(file)?1:0,file);
    assert.equal((source.match(/formationCombatLab\.runOperation\(/g)||[]).length,file==='input.js'?1:0,file);
    assert.equal((source.match(/\binitializeFormationState\(/g)||[]).length,['combat.js','formation-lab.js','gallery-receiver.js'].includes(file)?1:0,file);
    if(/save\.js|content\/|quests|npcs|maps/.test(file))assert.doesNotMatch(source,/completedSingleVictoryReceipt|prepareFormationEntry|runOperation/);
  }
});

module.exports={name:'formation hardening: receipted singleton handoff, lab emergency abort, truthful playback reasons',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' formation hardening checks passed');}};
