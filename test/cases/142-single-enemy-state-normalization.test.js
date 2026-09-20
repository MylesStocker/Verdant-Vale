'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createCombatTrace } = require('../combat-trace');

const checks = [];
const test = (name, run) => checks.push({ name, run });
const J = (g, expression) => JSON.parse(g.run('JSON.stringify(' + expression + ')'));
const PLACE = "resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);";
const RING_ROUTE = `fort_quest_stage=6;smugglers_dead=true;fort_report_filed=false;smugglers_execution_day=0;
  reservoir_quest_started=true;MainQuest=4;lighthouse_quest_stage=1;lighthouse_spider_resolved=false;`;
const SEEP_PLACE = 'enterDungeon8West();';

function fresh() {
  const t = createCombatTrace();
  t.step('setup', [], `dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMode=false;
    stats.hp=1000;stats.maxHp=1000;stats.atk=20;stats.def=3;stats.spd=10;
    stats.level=MAX_LEVEL;stats.xp=0;stats.gold=0;stats.items=[];
    stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
    ${PLACE}`);
  return t;
}

function assertSingle(g, expected) {
  assert.equal(g.run('combat.mode'), 'single');
  const enemies = g.run('combat.enemies');
  const enemy = g.run('combat.enemy');
  assert.equal(Array.isArray(enemies), true);
  assert.equal(enemies.length, 1);
  assert.equal(enemy, enemies[0], 'getter returns the stored instance, never a clone');
  assert.equal(Object.isFrozen(enemies), true, 'membership cannot grow or rotate');
  assert.equal(enemy.slot, 0);
  assert.match(enemy.instanceId, /^combat_enemy_[1-9]\d*$/);
  const fields = J(g, 'combat.enemy');
  delete fields.instanceId;
  delete fields.slot;
  if (expected) assert.deepEqual(fields, expected, 'all original and overridden enemy fields survive');
  return enemy;
}

function assertEmpty(g) {
  assert.equal(g.run('combat.mode'), null);
  assert.equal(g.run('Array.isArray(combat.enemies) && combat.enemies.length===0'), true);
  assert.equal(g.run('combat.enemy'), null);
}

test('empty boot state and an enumerable accessor, with no stored singleton value', () => {
  const t = fresh(), g = t.g;
  assert.equal(g.run('combat.active'), false);
  assertEmpty(g);
  const descriptor = g.run('Object.getOwnPropertyDescriptor(combat,"enemy")');
  assert.equal(typeof descriptor.get, 'function');
  assert.equal(typeof descriptor.set, 'function');
  assert.equal(descriptor.enumerable, true);
  assert.equal(Object.hasOwn(descriptor, 'value'), false);
  assert.equal(Object.hasOwn(descriptor, 'writable'), false);
  for (const field of ['selectedTargetId','currentActorId','currentTargetId','intent','actionQueue'])
    assert.equal(g.run(`Object.hasOwn(combat,${JSON.stringify(field)})`), false);
});

test('zero-RNG normalization, independent fixture copies, replacement and read identity', () => {
  const t = fresh(), g = t.g;
  t.step('first assignment', [], `var sourceEnemy=Object.freeze({...ENEMY_TEMPLATE_REGISTRY.enemy_thornback,hp:7});
    combat.active=true;combat.enemy=sourceEnemy;var firstEnemy=combat.enemy;`);
  const expected = J(g, 'sourceEnemy');
  assert.equal(assertSingle(g, expected).instanceId, 'combat_enemy_1');
  assert.equal(g.run('combat.enemy === sourceEnemy'), false);
  t.step('collection and accessor share HP authority', [], 'combat.enemies[0].hp=3;');
  assert.equal(g.run('combat.enemy.hp'), 3);
  assert.equal(g.run('sourceEnemy.hp'), 7);
  assert.equal(g.run('Object.assign({},combat).enemy === combat.enemies[0]'), true);
  assert.equal(J(g, 'combat').enemy.hp, 3, 'enumeration reads the accessor normally');

  t.step('replace with a new fixture instance', [], 'combat.enemy=sourceEnemy;');
  assert.equal(assertSingle(g, expected).instanceId, 'combat_enemy_2');
  assert.equal(g.run('combat.enemy === firstEnemy'), false);
  t.step('mutate detached old instance', [], 'firstEnemy.hp=1;');
  assert.equal(g.run('combat.enemy.hp'), 7);
  assert.deepEqual(J(g, 'sourceEnemy'), expected);
  assert.equal(t.rng.length, 0);
});

test('instance metadata is stable, read-only and deterministic in a fresh session', () => {
  const identities = [];
  for (let session=0; session<2; session++) {
    const t = fresh(), g = t.g;
    t.step('start fixture', [], `combat.active=true;combat.enemy={id:'fixture',name:'Dummy',hp:100,maxHp:100,
      atk:10,def:2,spd:5,xp:0,goldMin:0,goldMax:0};`);
    const enemy = assertSingle(g), id = enemy.instanceId;
    assert.equal(g.run("Reflect.set(combat.enemy,'instanceId','changed')"), false);
    assert.equal(g.run("Reflect.set(combat.enemy,'slot',1)"), false);
    assert.equal(Object.getOwnPropertyDescriptor(enemy, 'instanceId').configurable, false);
    t.press('Attack', [0.2,0.5,0.9,0.5,0.9,0.9,0.9]);
    assert.equal(g.run('combat.enemy'), enemy);
    t.press('deferred enemy response');
    assert.equal(g.run('combat.enemy'), enemy);
    assert.equal(g.run('combat.enemy.instanceId'), id);
    t.step('end first battle and begin second', [], 'endCombat();startWardenCombat();');
    identities.push([id, assertSingle(g).instanceId]);
  }
  assert.deepEqual(identities, [['combat_enemy_1','combat_enemy_2'],['combat_enemy_1','combat_enemy_2']]);
});

test('null assignment only clears membership; endCombat retains its cleanup authority', () => {
  const t = fresh(), g = t.g;
  t.step('start', [], 'startWardenCombat();combat.corrosion=2;combat.bombFuse=3;');
  const before = J(g, 'Object.fromEntries(Object.entries(combat).filter(([key])=>key!=="enemy" && key!=="enemies" && key!=="mode"))');
  t.step('null assignment', [], 'combat.enemy=null;');
  assertEmpty(g);
  assert.deepEqual(J(g, 'Object.fromEntries(Object.entries(combat).filter(([key])=>key!=="enemy" && key!=="enemies" && key!=="mode"))'), before);
  t.step('real cleanup', [], 'startWardenCombat();endCombat();');
  assertEmpty(g);
  assert.equal(g.run('combat.active'), false);
  assert.equal(g.run('combat.corrosion + combat.bombFuse'), 0);
  t.step('counter survives cleanup', [], 'startWardenCombat();');
  assert.equal(assertSingle(g).instanceId, 'combat_enemy_3');
});

test('arrays, invalid input and reserved metadata reject atomically without consuming identities', () => {
  const t = fresh(), g = t.g;
  t.step('valid start', [], 'startWardenCombat();');
  const original = assertSingle(g);
  for (const input of ['[]','[{}]','[{},{}]','undefined','42','false','"enemy"','function(){}',
    '{id:"bad",instanceId:"authored"}','{id:"bad",slot:0}']) {
    t.step('reject '+input, [], () => {
      assert.throws(() => g.run('combat.enemy='+input+';'), /Singleton combat enemy|reserved instanceId or slot/);
    });
    assert.equal(g.run('combat.enemy'), original);
  }
  t.step('next valid start', [], 'endCombat();startWardenCombat();');
  assert.equal(assertSingle(g).instanceId, 'combat_enemy_2');
});

test('membership cannot grow; deliberately corrupted multi-member access fails closed', () => {
  const t = fresh(), g = t.g;
  t.step('start', [], 'startWardenCombat();');
  t.step('reject array mutation', [], () => {
    assert.throws(() => g.run('combat.enemies.push({...combat.enemy});'), /extensible|read only/);
  });
  for (const invalid of ['[{},{}]','[{}, {}, {}]','null','{}']) {
    t.step('corrupt and restore collection', [], () => {
      try {
        g.run('combat.enemies='+invalid+';'); // negative fixture only, never a production initializer
        assert.throws(() => g.run('combat.enemy'), /Singleton combat requires zero or one enemy/);
      } finally { g.run('combat.enemy=null;combat.active=false;'); }
    });
    assertEmpty(g);
  }
});

test('every registered template is unchanged and safe for independent value-record copying', () => {
  const t = fresh(), g = t.g;
  const before = J(g, 'ENEMY_TEMPLATE_REGISTRY');
  const identities = new Set();
  for (const [id, template] of Object.entries(before)) {
    assert.equal(Object.hasOwn(template, 'instanceId') || Object.hasOwn(template, 'slot'), false, id);
    // This increment copies the actual flat enemy schema, not a hypothetical
    // status/container schema. A future nested mutable field requires copy review.
    for (const [key,value] of Object.entries(template))
      assert.ok(value === null || (typeof value !== 'object' && typeof value !== 'function'), id+'.'+key+' requires instance-copy review');
    t.step('instantiate '+id, [], `combat.active=true;combat.enemy=ENEMY_TEMPLATE_REGISTRY[${JSON.stringify(id)}];`);
    const enemy = assertSingle(g, template);
    identities.add(enemy.instanceId);
    assert.equal(g.run(`combat.enemy === ENEMY_TEMPLATE_REGISTRY[${JSON.stringify(id)}]`), false);
    t.step('mutate runtime only', [], 'combat.enemy.hp=0;combat.enemy.name="Fixture rename";endCombat();');
    assertEmpty(g);
  }
  assert.equal(identities.size, Object.keys(before).length);
  assert.deepEqual(J(g, 'ENEMY_TEMPLATE_REGISTRY'), before);
});

const starters = [
  {name:'ordinary pool', fn:'startCombat', args:'', expected:'currentEncounterPool()[0]', tape:[0,0.99]},
  {name:'Pale Sentry', fn:'startCombat', args:'', setup:"resetLocationState();placeAtLocation('MAP_N2',1.5*TILE,9.5*TILE);sentry_quest_started=true;sentry_quest_done=false;pale_sentry_hp=177;", expected:'({...PALE_SENTRY_TEMPLATE,hp:177})'},
  {name:'North Basin Donkey override', fn:'startCombat', args:'', setup:"resetLocationState();placeAtLocation('NORTH_BASIN_S_MAP',8.5*TILE,7.5*TILE);", expected:'SWAMP_DONKEY_TEMPLATE', tape:[0,0,0.99]},
  {name:'generated 23 override', fn:'startCombat', args:'', expected:"({id:'enemy_23',name:'23',hp:69,maxHp:69,atk:161,def:230,spd:276,xp:322,goldMin:115,goldMax:483})", tape:[0,0.001,0.1,0.9,0.2,0.3,0.4,0.5,0.6]},
  {name:'parent Seep pool', fn:'startCombat', args:'', setup:SEEP_PLACE, expected:'ENEMY_TEMPLATE_REGISTRY.enemy_the_seep', tape:[0.99,0.99]},
  {name:'smaller Seep', fn:'startSeepSplitCombat', args:'0', expected:'({...ENEMY_TEMPLATE_REGISTRY.enemy_the_seep,hp:20,maxHp:20,xp:20,goldMin:0,goldMax:3})'},
  {name:'Rainfish', fn:'startRainfishCombat', args:'2', expected:'RAINFISH_TEMPLATE'},
  {name:'male spawning-site toad', fn:'startMireToadSpawnCombat', args:'2', expected:'ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male', tape:[0]},
  {name:'female spawning-site toad', fn:'startMireToadSpawnCombat', args:'2', expected:'ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_female', tape:[0.99]},
  ...[
    ['Wrongteeth','startBossCombat','BOSS_TEMPLATE'],
    ['Briar Warden','startWardenCombat','BRIAR_WARDEN_TEMPLATE'],
    ['Smuggler Guard','startFortGuardCombat','SMUGGLER_GUARD_TEMPLATE'],
    ['Polwick','startFortPolwickCombat','POLWICK_TEMPLATE'],
    ['Essa','startFortEssaCombat','ESSA_TEMPLATE'],
    ['Mulholland','startMulhollandCombat','MULHOLLAND_TEMPLATE'],
    ['Den Wraith','startDenWraithCombat','DEN_WRAITH_TEMPLATE'],
    ['Kolm','startSailorBrawlCombat','SAILOR_BRAWLER_TEMPLATE'],
    ['Takomo','startTakomoCombat','TAKOMO_TEMPLATE'],
    ['Mimic Potion','startMimicPotionCombat','MIMIC_POTION_TEMPLATE'],
    ['trapped Pale Drowned','startTrappedDrownedCombat','SUNKEN_GALLERY_ENEMY_TEMPLATES[0]'],
  ].map(([name,fn,expected])=>({name,fn,args:'',expected})),
  {name:'Lensweb Spider', fn:'startLenswebSpiderCombat', args:'', setup:RING_ROUTE, expected:'LENSWEB_SPIDER_TEMPLATE'},
];

for (const starter of starters) test('production initializer: '+starter.name, () => {
  const t = fresh(), g = t.g;
  const templatesBefore = J(g, 'ENEMY_TEMPLATE_REGISTRY');
  t.step('prerequisites', [], starter.setup || '');
  const expected = J(g, starter.expected);
  t.step('actual starter', starter.tape || [], `${starter.fn}(${starter.args});`);
  const enemy = assertSingle(g, expected), instanceId = enemy.instanceId;
  assert.equal(g.run('combat.active'), true);
  assert.equal(g.run('combat.phase'), 'choose');
  assert.equal(g.run('combat.flashTimer'), 8);
  assert.equal(g.run('combat.message.includes(combat.enemy.instanceId)'), false);
  assert.deepEqual(J(g, 'ENEMY_TEMPLATE_REGISTRY'), templatesBefore);
  t.step('entrance frames', [], game => game.frames(8));
  assert.equal(g.run('combat.enemy'), enemy);
  assert.equal(g.run('combat.enemy.instanceId'), instanceId);
  t.step('cleanup', [], 'endCombat();');
  assertEmpty(g);
});

test('starter coverage follows all production start*Combat declarations', () => {
  const source = fs.readFileSync(path.join(__dirname,'../../combat.js'),'utf8');
  const declared = [...source.matchAll(/^function (start\w*Combat)\(/gm)].map(m=>m[1]).sort();
  assert.deepEqual([...new Set(starters.map(s=>s.fn))].sort(), declared);
});

for (const sequence of [
  {name:'Guard → Polwick → Essa', setup:'fort_quest_started=true;fort_quest_stage=1;startFortGuardCombat();', startTape:[], count:3, nextTape:[], ids:['enemy_smuggler_guard','enemy_polwick','enemy_essa']},
  {name:'Rainfish', setup:'startRainfishCombat(2);', startTape:[], count:3, nextTape:[], ids:Array(3).fill('enemy_rainfish')},
  {name:'Mire Toad spawning site', setup:'startMireToadSpawnCombat(2);', startTape:[0], count:3, nextTape:[0.99], ids:['enemy_mire_toad_male','enemy_mire_toad_female','enemy_mire_toad_female']},
  {name:'Seep split', setup:SEEP_PLACE+'startCombat();', startTape:[0.99,0.99], count:2, nextTape:[], ids:Array(2).fill('enemy_the_seep')},
]) test('actual sequential handoff: '+sequence.name, () => {
  const t = fresh(), g = t.g, identities = new Set();
  t.step('start sequence', sequence.startTape, sequence.setup);
  for (let i=0; i<sequence.count; i++) {
    const enemy = assertSingle(g);
    assert.equal(enemy.id, sequence.ids[i]);
    identities.add(enemy.instanceId);
    // Shorten the battle through a test-only HP setup, then use the real item,
    // reward, victory and keyboard/dialogue handlers for every handoff.
    t.step('lethal item fixture', [], 'combat.enemy.hp=1;combat.flashTimer=0;combat.phase="item";combat.itemCursor=0;stats.items=[createItem("Sapper Charge")];');
    t.press('defeat current opponent', [0.5,0.99]);
    assert.equal(g.run('combat.enemy'), enemy, 'death does not replace the instance');
    t.drainMessages();
    t.press('finalize singleton');
    assert.equal(g.run('combat.active'), false);
    assertEmpty(g);
    if (i+1 < sequence.count) {
      t.press('dialogue starts next singleton', sequence.nextTape);
      const next = assertSingle(g);
      assert.notEqual(next.instanceId, enemy.instanceId);
      assert.notEqual(next, enemy);
      assert.equal(g.run('combat.active'), true);
    }
  }
  assert.equal(identities.size, sequence.count);
});

test('failed starts and defeat/retry do not revive stale instances or reuse identities', () => {
  const t = fresh(), g = t.g;
  t.step('first fight', [], 'startWardenCombat();combat.enemy.hp=2;combat.corrosion=4;combat.bombFuse=2;');
  const old = assertSingle(g);
  t.step('actual defeat cleanup', [], 'combat.phase="defeat";handleCombatAction();dialogue.open=false;');
  assertEmpty(g);
  t.step('invalid spider route', [], 'startLenswebSpiderCombat();');
  assertEmpty(g);
  assert.equal(g.run('combat.active'), false);
  t.step('retry', [], 'startWardenCombat();');
  const retry = assertSingle(g, J(g,'BRIAR_WARDEN_TEMPLATE'));
  assert.equal(retry.instanceId, 'combat_enemy_2', 'failed startup consumes no identity');
  assert.notEqual(retry, old);
  assert.equal(g.run('combat.corrosion + combat.bombFuse'), 0);
  t.step('cleanup', [], 'endCombat();');
  t.step('missing Seep registry entry', [], () => {
    g.run('var savedSeep=ENEMY_TEMPLATE_REGISTRY.enemy_the_seep;delete ENEMY_TEMPLATE_REGISTRY.enemy_the_seep;');
    try { g.run('startSeepSplitCombat(0);'); }
    finally { g.run('ENEMY_TEMPLATE_REGISTRY.enemy_the_seep=savedSeep;'); }
  });
  assertEmpty(g);
  t.step('missing selected toad registry entry', [0], () => {
    g.run('var savedToad=ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male;delete ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male;');
    try { g.run('startMireToadSpawnCombat(2);'); }
    finally { g.run('ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male=savedToad;'); }
  });
  assertEmpty(g);
  t.step('empty pool fails closed', [], () => {
    g.run('var savedPoolSelector=currentEncounterPool;currentEncounterPool=function(){return EMPTY_ENCOUNTER_POOL;};');
    try { g.run('startCombat();'); }
    finally { g.run('currentEncounterPool=savedPoolSelector;'); }
  });
  assertEmpty(g);
  t.step('successful restart after failed starts', [], 'startWardenCombat();');
  assert.equal(assertSingle(g).instanceId, 'combat_enemy_3');
});

module.exports = {
  name: 'single-enemy normalization: one authority, deterministic identity, all starters and sequential handoffs',
  run() {
    for (const check of checks) {
      try { check.run(); }
      catch (error) { error.message = check.name+': '+error.message; throw error; }
    }
    console.log('  '+checks.length+' normalization checks passed ('+starters.length+' starter scenarios)');
  },
};
