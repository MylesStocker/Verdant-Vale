'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createContext } = require('../harness');

const checks = [];
const test = (name, run) => checks.push({name, run});
const ROOT = path.join(__dirname, '../..');
const PAIR = [{enemyId:'enemy_marsh_wisp',slot:0},{enemyId:'enemy_briar_hound',slot:1}];
const J = (g, expression) => JSON.parse(g.run('JSON.stringify('+expression+')'));
function fresh() {
  const g = createContext();
  g.run(`Math=Object.create(Math);Math.random=function(){throw new Error('Unexpected formation RNG');};
    dialogue.open=false;menu.open=false;`);
  return g;
}
function initialize(g, descriptors=PAIR) {
  g.run('initializeFormationState('+JSON.stringify(descriptors)+');');
}
function snapshot(g) {
  // All stored combat fields, plus computed mode/activation and instance-owned
  // non-enumerable observation state. No singleton getter is read in formations.
  return g.run(`JSON.stringify({mode:combat.mode,active:combat.active,
    stored:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat))
      .filter(([,d])=>Object.hasOwn(d,'value')).map(([key,d])=>[key,d.value])),
    observation:combat.enemies.map(e=>[e.observeCount,e.escapeUnlocked]),
    sequence:combatEnemyInstanceSequence,stats:stats,status:statusEffects})`);
}
function rejectsAtomically(g, expression, pattern=/Formation|formation|Unknown|Unsupported|Template|Invalid/) {
  const before=snapshot(g), members=g.run('combat.enemies');
  assert.throws(()=>g.run(expression), pattern);
  assert.equal(snapshot(g), before, 'failure changes no state, IDs, rewards, messages or HP');
  assert.equal(g.run('combat.enemies'), members, 'prior collection identity survives');
}

test('boot, singleton mode and cleanup; mode cannot be reassigned',()=>{
  const g=fresh();
  assert.equal(g.run('combat.mode'),null);
  g.run('startWardenCombat();');
  assert.equal(g.run('combat.mode'),'single');
  assert.equal(g.run('combat.enemy===combat.enemies[0]'),true);
  assert.throws(()=>g.run('"use strict";combat.mode="formation";'),/getter|read only|Cannot set/);
  g.run('endCombat();');
  assert.equal(g.run('combat.mode'),null);
  assert.equal(g.run('combat.active'),false);
});

// Reuse actual, already-taped production starter scenarios, never a fake model.
// Suite 142's assertSingle now verifies mode alongside every original assertion.
test('all 21 existing starter scenarios retain singleton mode and original behavior',()=>{
  require('./142-single-enemy-state-normalization.test').run();
});

for (const count of [2,3]) test(count+' members: frozen ordered membership and mutable independent instances',()=>{
  const g=fresh(), templates=J(g,'ENEMY_TEMPLATE_REGISTRY');
  const descriptors=Array.from({length:count},(_,slot)=>({enemyId:'enemy_marsh_wisp',slot}));
  initialize(g,descriptors);
  const members=g.run('combat.enemies');
  assert.equal(g.run('combat.mode'),'formation');
  assert.equal(g.run('combat.active'),false);
  assert.equal(members.length,count);
  assert.ok(Object.isFrozen(members));
  assert.throws(()=>members.push(members[0]),/not extensible/);
  members.forEach((enemy,slot)=>{
    assert.equal(enemy.id,'enemy_marsh_wisp');
    assert.equal(enemy.instanceId,'combat_enemy_'+(slot+1));
    assert.equal(enemy.slot,slot);
    assert.equal(enemy.observeCount,0);assert.equal(enemy.escapeUnlocked,false);
    for(const key of ['instanceId','slot']) {
      assert.equal(Object.getOwnPropertyDescriptor(enemy,key).writable,false);
      assert.throws(()=>{enemy[key]=99;},TypeError);
    }
  });
  members[0].hp=0;members[0].observeCount=7;members[0].escapeUnlocked=true;
  assert.equal(members[1].hp,14);assert.equal(members[1].observeCount,0);
  assert.equal(members[1].escapeUnlocked,false);
  assert.equal(g.run('combat.mode'),'formation','one living member never collapses mode');
  assert.equal(g.run('combat.enemies'),members,'death does not remove or reorder members');
  assert.deepEqual(J(g,'ENEMY_TEMPLATE_REGISTRY'),templates);
});

test('two different registered templates retain their exact authored fields and HP',()=>{
  const g=fresh();initialize(g);
  for(const member of g.run('combat.enemies')) {
    const copy={...member};delete copy.instanceId;delete copy.slot;
    assert.deepEqual(copy,J(g,'ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(member.id)+']'));
  }
});

test('every approved identity constructs state only; template inventory has no unclassified fields',()=>{
  const g=fresh();
  for(const id of J(g,'FORMATION_STATE_TEMPLATE_IDS')) {
    initialize(g,[{enemyId:id,slot:0},{enemyId:id,slot:1}]);
    assert.equal(g.run('combat.active'),false);
    g.run('combat.enemy=null;');
  }
  const fields=J(g,'[...FORMATION_STATE_DATA_FIELDS,...FORMATION_STATE_UNSUPPORTED_FIELDS]');
  for(const template of Object.values(J(g,'ENEMY_TEMPLATE_REGISTRY'))) {
    for(const field of Object.keys(template)) assert.ok(fields.includes(field),field);
  }
});

test('duplicate identities resolve exactly; dead retained members resolve but cannot act',()=>{
  const g=fresh();initialize(g,[{enemyId:'enemy_marsh_wisp',slot:0},{enemyId:'enemy_marsh_wisp',slot:1}]);
  const [first,second]=g.run('combat.enemies');
  g.run('combat.enemies[0].hp=0;');
  assert.equal(g.run('findCombatEnemy("'+first.instanceId+'")'),first);
  assert.equal(g.run('findCombatEnemy("'+second.instanceId+'")'),second);
  for(const id of ['enemy_marsh_wisp','Marsh Wisp',0,1,'missing',null]) {
    assert.equal(g.run('findCombatEnemy('+JSON.stringify(id)+')'),null);
  }
  assert.equal(g.run('isActiveCombatEnemy(combat.enemies[0])'),false);
  g.run('var removedId=combat.enemies[0].instanceId;combat.enemy=null;');
  assert.equal(g.run('findCombatEnemy(removedId)'),null);
});

test('singleton and observation accessors never project a formation member',()=>{
  const g=fresh();initialize(g);
  for(const key of ['enemy','observeCount','escapeUnlocked']) {
    rejectsAtomically(g,'combat.'+key,/Formation state has no singleton/);
  }
  for(const key of ['observeCount','escapeUnlocked']) {
    rejectsAtomically(g,'combat.'+key+'=1',/Formation state has no singleton/);
  }
  rejectsAtomically(g,'combat.enemy=ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp',/Clear formation/);
  g.run('combat.enemy=null;');
  assert.throws(()=>g.run('combat.enemy=[]'),/Singleton combat enemy/);
});

for(const phase of ['choose','item','message','victory','defeat']) test('formation cannot process singleton phase '+phase,()=>{
  const g=fresh();initialize(g);
  g.run('combat.phase='+JSON.stringify(phase)+';');
  rejectsAtomically(g,'combat.active=true',/cannot activate/);
  rejectsAtomically(g,'handleCombatAction()',/cannot process singleton actions/);
  rejectsAtomically(g,'advanceCombatMessage()',/cannot process singleton messages/);
});

test('construction, bound effects and reward/on-hit calls cannot queue messages or grant effects',()=>{
  const g=fresh();
  const initial=J(g,'[stats.hp,stats.xp,stats.gold,stats.items,combat.message,combat.messageQueue,combat.pendingVictory]');
  initialize(g);
  g.run(`var forbiddenCalls=0;
    bindCombatEnemyEffect(combat.enemies[0].instanceId,function(){forbiddenCalls++;stats.hp=0;})();
    applyEnemyHitEffects(combat.enemies[0]);applyKillRewards(combat.enemies[0],combat.messageQueue);`);
  assert.equal(g.run('forbiddenCalls'),0);
  assert.deepEqual(J(g,'[stats.hp,stats.xp,stats.gold,stats.items,combat.message,combat.messageQueue,combat.pendingVictory]'),initial);
});

test('formation lookup does not permit bomb or response construction to execute combat',()=>{
  const g=fresh();initialize(g);
  g.run('combat.bombFuse=3;combat.bombJustArmed=true;combat.bombTargetInstanceId=combat.enemies[0].instanceId;');
  const before=snapshot(g);
  assert.equal(g.run('bombFuseEntry()'),null);
  assert.equal(g.run('enemyTurnResponse(combat.enemies[0],function(){throw new Error("text ran");})'),null);
  assert.equal(g.run('enemyRegenEntry(combat.enemies[0])'),null);
  assert.equal(snapshot(g),before);
});

test('renderer and combat input routing cannot activate/display the inactive state',()=>{
  const g=fresh();initialize(g);
  g.run(`var combatDraws=0,combatInputs=0;
    drawCombat=function(){combatDraws++;};handleCombatAction=function(){combatInputs++;};render();`);
  // Harmless arrow input probes the actual router, not a copied conditional.
  g.press('ArrowLeft');
  assert.equal(g.run('combatDraws'),0);assert.equal(g.run('combatInputs'),0);
  assert.equal(g.run('combat.active'),false);
});

test('only the explicit developer lab initializes formations; no encounter conversion or extra state',()=>{
  const files=execFileSync('git',['ls-files','--','*.js'],{cwd:ROOT,encoding:'utf8'}).trim().split('\n')
    .filter(file=>file && !file.startsWith('test/'));
  for(const file of [...new Set([...files,'formation-lab.js'])]) {
    const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.equal((source.match(/\binitializeFormationState\b/g)||[]).length,['combat.js','formation-lab.js'].includes(file)?1:0,file);
  }
  const g=fresh();initialize(g);
  for(const key of ['selectedTargetId','currentActorId','currentTargetId','intent','actionQueue',
    'formationRewards','rewardLedger','formationCallbacks','positions']) {
    assert.equal(g.run('Object.hasOwn(combat,'+JSON.stringify(key)+')'),false,key);
  }
});

test('registered pools preserve ordering, duplicate weights, and object identity',()=>{
  const g=fresh(), before=J(g,'ENEMY_TEMPLATE_POOLS');
  const arrays=g.run('ENEMY_TEMPLATE_POOLS.map(p=>p.templates)');
  // Current pools contain no repeated ids. Preserve exact sequences anyway;
  // the next check exercises legacy repetition weighting in an isolated fixture.
  initialize(g);g.run('combat.enemy=null;');
  assert.deepEqual(J(g,'ENEMY_TEMPLATE_POOLS'),before);
  g.run('ENEMY_TEMPLATE_POOLS').forEach((pool,i)=>assert.equal(pool.templates,arrays[i]));
});

test('legacy repeated pool entries are weighted choices, never formation descriptors',()=>{
  const g=fresh();
  g.run(`currentEncounterPool=function(){return [ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,
    ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,ENEMY_TEMPLATE_REGISTRY.enemy_briar_hound];};
    Math.random=function(){return 0.5;};startCombat();`);
  assert.equal(g.run('combat.mode'),'single');
  assert.equal(g.run('combat.enemies.length'),1);
  assert.equal(g.run('combat.enemy.id'),'enemy_marsh_wisp');
});

test('all unapproved registry identities are rejected, including every bespoke contract',()=>{
  const g=fresh(), approved=J(g,'FORMATION_STATE_TEMPLATE_IDS');
  for(const id of Object.keys(J(g,'ENEMY_TEMPLATE_REGISTRY')).filter(id=>!approved.includes(id))) {
    rejectsAtomically(g,'initializeFormationState('+JSON.stringify([{enemyId:'enemy_marsh_wisp',slot:0},{enemyId:id,slot:1}])+')');
  }
});

test('every unsupported capability is rejected even on an otherwise approved template',()=>{
  const g=fresh();
  for(const key of J(g,'FORMATION_STATE_UNSUPPORTED_FIELDS')) {
    g.run('ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp['+JSON.stringify(key)+']=false;');
    try { rejectsAtomically(g,'initializeFormationState('+JSON.stringify(PAIR)+')',/Unsupported formation capability/); }
    finally {g.run('delete ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp['+JSON.stringify(key)+'];');}
  }
});

for(const field of ['futureSpecial','instanceId','slot','observeCount','escapeUnlocked','nestedState']) test('unknown/runtime template field fails closed: '+field,()=>{
  const g=fresh();
  // Isolated VM-only invalid authored data, never repository data or a real pool edit.
  g.run('ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp['+JSON.stringify(field)+']={};');
  rejectsAtomically(g,'initializeFormationState('+JSON.stringify(PAIR)+')',/Unknown formation template field/);
});

const badRequests=[null,{},[],[PAIR[0]],[...PAIR,{enemyId:'enemy_marsh_wisp',slot:2},{enemyId:'enemy_marsh_wisp',slot:3}],
  [PAIR[0],{enemyId:'unknown',slot:1}], [PAIR[0],{enemyId:'toString',slot:1}],
  [PAIR[0],{enemyId:'enemy_marsh_wisp'}], [PAIR[0],{...PAIR[1],slot:0}],
  [PAIR[0],{...PAIR[1],slot:2}], [PAIR[1],PAIR[0]],
  ...[-1,0.5,'1',null].map(slot=>[PAIR[0],{...PAIR[1],slot}]),
  ...['hp','instanceId','observeCount','escapeUnlocked','rewards','unknown'].map(key=>[PAIR[0],{...PAIR[1],[key]:1}])];
badRequests.forEach((request,i)=>test('invalid descriptor request '+i+' is atomic and zero-RNG',()=>{
  const g=fresh();rejectsAtomically(g,'initializeFormationState('+JSON.stringify(request)+')');
  initialize(g);assert.equal(g.run('combat.enemies[0].instanceId'),'combat_enemy_1');
}));

test('raw runtime, sparse arrays, getters, inherited and non-data template inputs fail atomically',()=>{
  const g=fresh();
  g.run('startWardenCombat();var prior=combat.enemy;endCombat();');
  for(const expression of [
    'initializeFormationState([prior,prior])',
    'initializeFormationState(new Array(2))',
    'initializeFormationState([{get enemyId(){throw new Error("getter ran");},slot:0},{enemyId:"enemy_marsh_wisp",slot:1}])',
    'initializeFormationState([Object.create({enemyId:"enemy_marsh_wisp",slot:0}),{enemyId:"enemy_marsh_wisp",slot:1}])',
  ]) rejectsAtomically(g,expression);
  g.run('Object.defineProperty(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,"hp",{get(){throw new Error("getter ran");}});');
  rejectsAtomically(g,'initializeFormationState('+JSON.stringify(PAIR)+')',/Unknown formation template field/);
});

test('invalid numeric/nested template data is rejected without cloning shared state',()=>{
  const g=fresh();
  for(const value of ['{}','NaN','Infinity','"14"']) {
    g.run('ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.hp='+value+';');
    rejectsAtomically(g,'initializeFormationState('+JSON.stringify(PAIR)+')',/Invalid formation template data/);
  }
});

test('busy singleton and existing formation cannot be replaced; full prior state survives',()=>{
  const g=fresh();g.run('startWardenCombat();');
  rejectsAtomically(g,'initializeFormationState('+JSON.stringify(PAIR)+')',/requires empty inactive/);
  g.run('endCombat();');initialize(g);
  rejectsAtomically(g,'initializeFormationState('+JSON.stringify(PAIR)+')',/requires empty inactive/);
});

test('cleanup removes every member; later singleton and callbacks get fresh identities',()=>{
  const g=fresh();
  g.run(`startWardenCombat();var oldId=combat.enemy.instanceId;
    var calls=0;var stale=bindCombatEnemyEffect(oldId,function(){calls++;stats.hp=0;});endCombat();`);
  initialize(g);const members=g.run('combat.enemies');
  const before=snapshot(g);g.run('stale();');assert.equal(snapshot(g),before);
  g.run('endCombat();');
  assert.equal(g.run('combat.mode'),null);assert.equal(g.run('combat.enemies.length'),0);
  assert.equal(g.run('combat.enemy'),null);
  for(const enemy of members) assert.equal(g.run('findCombatEnemy("'+enemy.instanceId+'")'),null);
  g.run('startWardenCombat();stale();');
  assert.equal(g.run('combat.mode'),'single');assert.equal(g.run('calls'),0);
  assert.equal(g.run('combat.enemy.instanceId'),'combat_enemy_4');
  assert.equal(g.run('combat.enemy===combat.enemies[0]'),true);
  assert.equal(g.run('findCombatEnemy(combat.enemy.instanceId)===combat.enemy'),true);
});

test('state-only mode, members and identity counter stay out of saves and fresh loads',()=>{
  const g=fresh();
  g.run("resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);");
  initialize(g);
  // Direct diagnostic API in isolated in-memory storage; no new input path.
  assert.equal(g.run('saveGame()'),true);
  const raw=g.run("localStorage.getItem('verdantVale_save')");
  assert.doesNotMatch(raw,/combat_enemy_|instanceId|observeCount|escapeUnlocked|combatMode|combatEnemyInstanceSequence/);
  const payload=JSON.parse(raw);
  for(const key of ['combat','enemies','mode']) assert.equal(Object.hasOwn(payload,key),false);
  assert.equal(payload.version,g.run('SAVE_VERSION'));
  const loaded=fresh();
  loaded.run('localStorage.setItem("verdantVale_save",'+JSON.stringify(raw)+');');
  assert.equal(loaded.run('loadGame()'),true);
  assert.equal(loaded.run('combat.mode'),null);
  assert.equal(loaded.run('combat.enemies.length'),0);
  assert.equal(loaded.run('combat.active'),false);
  assert.equal(loaded.run('combatEnemyInstanceSequence'),0);
});

module.exports={
  name:'gated formation state: atomic descriptors, independent identities, no activation or gameplay callers',
  checks,
  run(){
    for(const check of checks) {
      try {check.run();} catch(error) {error.message=check.name+': '+error.message;throw error;}
    }
    console.log('  '+checks.length+' formation-state checks passed');
  },
};
