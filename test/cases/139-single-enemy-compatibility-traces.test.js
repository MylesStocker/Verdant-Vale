'use strict';

// Compatibility sentinels execute production handlers. Expected checkpoints
// describe CURRENT behavior, including labeled suspected defects; they do not
// authorize those quirks as desired mechanics or implement combat formulas.
const assert = require('assert/strict');
const { createCombatTrace } = require('../combat-trace');

const sentinels = [];
const test = (name, run) => sentinels.push({ name, run });
const PLAYER_FIRST = [0.2, 0.5, 0.9, 0.5, 0.9, 0.9, 0.9];
const ENEMY_FIRST = [0.9, 0.5, 0.9, 0.5, 0.9, 0.9, 0.9];
const LETHAL = [0.2, 0.5, 0.9, 0.5, 0.9, 0.9, 0.3, 0.99];

function fresh(setup = '', watches = {}) {
  const t = createCombatTrace(watches);
  t.step('fixture', [], `
    dialogue.open=false; dialogue.callbacks=null; menu.open=false; debugMode=false;
    stats.hp=100; stats.maxHp=100; stats.atk=20; stats.def=3; stats.spd=10;
    stats.level=MAX_LEVEL; stats.xp=0; stats.gold=0; stats.items=[];
    stats.weapon=null; stats.armor=null; stats.shield=null; stats.accessory=null;
    statusEffects=[];
    combat.active=true; combat.phase='choose'; combat.cursor=0; combat.flashTimer=0;
    combat.enemy={id:'enemy_marsh_wisp_early',name:'Dummy',hp:100,maxHp:100,
      atk:10,def:2,spd:5,xp:25,goldMin:5,goldMax:5};
    ${setup}
  `);
  return t;
}

test('player-first: damage now, enemy response on acknowledgment; replay identical', () => {
  function replay() {
    const t = fresh();
    const attack = t.press('Attack', PLAYER_FIRST);
    assert.deepEqual([attack.player.hp, attack.enemy.hp, attack.rngCount], [100, 82, 7]);
    assert.equal(attack.message, 'Lély attacks for 18 damage!');
    assert.deepEqual(attack.queue, [{text:'Dummy strikes for 7!',deferred:true}]);
    const response = t.press('enemy response');
    assert.deepEqual([response.player.hp,response.enemy.hp,response.phase,response.rngCount], [93,82,'choose',7]);
    assert.equal(response.message, 'Dummy strikes for 7!');
    return t.checkpoints;
  }
  assert.deepEqual(replay(), replay(), 'fresh contexts replay every checkpoint and RNG value identically');
});

test('enemy-first: deferred player attack subtracts enemy HP on the next acknowledgment', () => {
  const t = fresh();
  const attack = t.press('Attack', ENEMY_FIRST);
  assert.deepEqual([attack.player.hp,attack.enemy.hp], [93,100]);
  assert.equal(attack.message, 'Dummy strikes first for 7!');
  assert.deepEqual(attack.queue, [{text:'Lély attacks for 18 damage!',deferred:true}]);
  const reply = t.press('player reply');
  assert.deepEqual([reply.player.hp,reply.enemy.hp,reply.phase], [93,82,'choose']);
});

test('lethal player-first: pre-roll unused enemy damage, suppress response, reward once', () => {
  const t = fresh('combat.enemy.hp=1;');
  const kill = t.press('Attack', LETHAL);
  assert.deepEqual([kill.enemy.hp,kill.player.hp,kill.player.xp,kill.player.gold,kill.rngCount], [0,100,25,5,8]);
  assert.equal(kill.pending.victory, true);
  assert.equal(kill.queue.some(e => e.deferred), false);
  t.drainMessages();
  assert.equal(t.g.run('combat.phase'), 'victory');
  const done = t.press('finalize victory');
  assert.equal(done.active, false);
  assert.equal(done.enemy, null);
  assert.deepEqual([done.player.xp,done.player.gold,done.local.cooldown], [25,5,t.g.run('ENCOUNTER_COOLDOWN')]);
  t.press('later exploration key', [], 'ArrowLeft');
  assert.deepEqual([t.g.run('stats.xp'),t.g.run('stats.gold')], [25,5]);
});

test('enemy-first lethal: unused player evade roll; defeat and home recovery', () => {
  const t = fresh('stats.hp=1; stats.gold=42; statusEffects=["poison"]; defeatWakeAtHome=true;');
  const day = t.g.run('day');
  const hit = t.press('Attack', ENEMY_FIRST);
  assert.deepEqual([hit.player.hp,hit.enemy.hp,hit.rngCount], [0,100,7]);
  assert.equal(hit.pending.defeat, true);
  // Compatibility sentinel: first.apply() pushes a death message into the old
  // queue, which is then replaced. The defeat phase remains reachable.
  assert.deepEqual(hit.queue, []);
  assert.equal(t.press('acknowledge hit').phase, 'defeat');
  const wake = t.press('recover');
  assert.deepEqual([wake.active,wake.enemy,wake.player.hp,wake.player.gold,wake.day], [false,null,100,0,day+1]);
  assert.deepEqual(wake.statuses, []);
  assert.equal(wake.mapId, 'HOUSE_INTERIOR_MAP');
  assert.match(wake.dialogue.pages.flat().join(' '), /own bed/);
});

for (const [name, tape, enemyHp, playerHp] of [
  ['player critical', [0.2,0.5,0.01,0.5,0.9,0.9,0.9], 73,93],
  ['enemy critical', [0.2,0.5,0.9,0.5,0.01,0.9,0.9], 82,89],
]) test(name, () => {
  const t = fresh();
  t.press('Attack', tape);
  t.drainMessages();
  assert.deepEqual([t.g.run('combat.enemy.hp'),t.g.run('stats.hp')], [enemyHp,playerHp]);
  assert.ok(t.checkpoints.some(c => /Critical/.test(c.message)));
});

test('minimum damage and ordinary incoming defense cap', () => {
  const t = fresh('stats.def=100; combat.enemy.def=100;');
  const low = t.press('minimum rolls', [0.2,0,0.9,0,0.9,0.9,0.9]);
  assert.equal(low.enemy.hp, 99);
  assert.equal(t.press('incoming minimum').player.hp, 99);
  t.press('mid rolls', PLAYER_FIRST);
  assert.equal(t.press('capped response').player.hp, 97, 'ATK 10 still deals 2 against DEF 100 at midpoint');
});

test('Thornback: authored meleeArmor and extra counterattack, separate messages', () => {
  const t = fresh('combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_thornback};');
  const attack = t.press('Attack', [...PLAYER_FIRST,0.2,0.5,0.9,0.9]);
  assert.equal(attack.enemy.meleeArmor, 90);
  assert.equal(attack.enemy.hp, 17);
  assert.equal(attack.rngCount, 11);
  assert.equal(t.press('ordinary hit').player.hp, 91);
  const counter = t.press('counterattack');
  assert.equal(counter.player.hp, 82);
  assert.match(counter.message, /counters/);
  assert.equal(counter.phase, 'choose');
});

test('Rotwood Troll: regeneration after damage; compatibility asymmetry when enemy-first', () => {
  const setup = 'combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_rotwood_troll};';
  const t = fresh(setup);
  assert.equal(t.press('Attack', PLAYER_FIRST).enemy.hp, 44);
  assert.equal(t.press('enemy response').player.hp, 87);
  const heal = t.press('regenerate');
  assert.equal(heal.enemy.hp, 50);
  assert.match(heal.message, /\+6 HP/);
  const earlier = fresh(setup);
  earlier.press('enemy-first', ENEMY_FIRST);
  // Suspected defect: regen is planned while the full-HP enemy's damage is
  // still deferred, so this branch omits the same-turn heal. Preserve for now.
  assert.equal(earlier.press('player reply').enemy.hp, 44);
  assert.equal(earlier.g.run('combat.phase'), 'choose');
});

test('brace: halves damage, spends enemy turn, no evade rolls', () => {
  const t = fresh('combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_bone_guard};');
  const s = t.press('Attack', [0.2,0,0.5,0.9,0.5,0.9]);
  assert.equal(s.enemy.hp, 40);
  assert.equal(s.player.hp, 100);
  assert.match(s.message, /braces/);
  t.drainMessages();
  assert.equal(t.rng.length, 6);
});

test('healing item: immediate heal/consumption followed by deferred hit', () => {
  const t = fresh('stats.hp=50; stats.items=[createItem("Potion")]; combat.cursor=1;');
  assert.equal(t.press('open items').phase, 'item');
  const use = t.press('Potion', [0.5,0.9,0.9]);
  assert.equal(use.player.hp, 70);
  assert.deepEqual(use.player.items, []);
  assert.equal(use.enemy.hp, 100);
  assert.equal(t.press('enemy response').player.hp, 63);
});

test('item cancellation: Back row and b/B/Escape spend no turn or buff duration', () => {
  for (const key of ['b','B','Escape','Back row']) {
    const t = fresh('stats.items=[createItem("Potion")]; combat.cursor=1; combat.evadeTurns=2;');
    const before = t.checkpoints[0];
    t.press('open items');
    if (key === 'Back row') t.press('select Back', [], 'ArrowDown');
    const cancel = t.press('cancel', [], key === 'Back row' ? 'Enter' : key);
    assert.equal(cancel.phase, 'choose');
    assert.deepEqual(cancel.player, before.player);
    assert.deepEqual(cancel.enemy, before.enemy);
    assert.equal(cancel.local.evadeTurns, 2);
    assert.equal(cancel.rngCount, 0);
  }
});

test('offensive item: ignores Thornback melee armor and suppresses responses on kill', () => {
  const t = fresh('combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_thornback}; stats.items=[createItem("Sapper Charge")]; combat.phase="item";');
  const use = t.press('Sapper Charge', [0.3,0.99]);
  assert.equal(use.enemy.hp, 0);
  assert.equal(use.pending.victory, true);
  assert.equal(use.player.hp, 100);
  assert.deepEqual(use.player.items, []);
  assert.equal(use.queue.some(e => e.deferred), false);
});

test('Bullet Time: activation, per-spent-action duration, expiration, on-hit poison', () => {
  const t = fresh('combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male}; stats.items=[createItem("Bullet Time")]; combat.phase="item";');
  assert.equal(t.press('activate buff', [0.5,0.9,0.5]).local.evadeTurns, 3);
  assert.equal(t.press('evaded response').player.hp, 100);
  for (const turns of [2,1,0]) {
    t.step('choose Observe', [], 'combat.cursor=2;');
    t.press('Observe with buff '+turns, [0.9,0.5,0.9,0.5]);
    // Observe produces lore strings before its deferred hit.
    while (t.g.run('combat.messageQueue.length && typeof combat.messageQueue[0] === "string"')) t.press('lore');
    const hit = t.press('Observe response', turns ? [] : [0]);
    assert.equal(hit.local.evadeTurns, turns);
    assert.equal(hit.player.hp, turns ? 100 : 81);
    assert.deepEqual(hit.statuses, turns ? [] : ['poison']);
    t.drainMessages();
  }
});

test('Polwick: deferred first-hit scorch, later Burn tick, cleanup', () => {
  const t = fresh('startFortPolwickCombat(); combat.flashTimer=0;');
  t.press('Attack', PLAYER_FIRST);
  const scorch = t.press('first enemy hit', [0.5]);
  assert.deepEqual(scorch.statuses, ['burn']);
  assert.equal(scorch.player.hp, 78); // 16 physical + 6 scorch
  assert.equal(scorch.local.polwickHasCast, true);
  assert.equal(scorch.local.fireCastTimer, t.g.run('FIRE_CAST_FRAMES'));
  t.drainMessages();
  t.press('second Attack', [...PLAYER_FIRST,0.5]);
  assert.equal(t.press('second physical hit').player.hp, 62);
  assert.equal(t.press('Burn tick').player.hp, 52);
  const done = t.step('end', [], 'endCombat();');
  assert.deepEqual(done.statuses, []);
  assert.equal(done.local.fireCastTimer, 0);
  assert.equal(done.local.polwickHasCast, false);
});

test('Cat Armor bypass and unchanged Takomo definition/calculation', () => {
  const expected = {id:'enemy_takomo',name:'Takomo',hp:280,maxHp:280,atk:52,def:12,spd:4,xp:420,goldMin:140,goldMax:260};
  for (const [armor, damage] of [['createItem("Cat Armor")',1], ['{type:"armor",bonus:99}',11]]) {
    const t = fresh(`stats.def=2; stats.armor=${armor}; startTakomoCombat(); combat.flashTimer=0;`);
    assert.deepEqual(t.checkpoints[0].enemy, expected);
    assert.equal(t.press('Attack', PLAYER_FIRST).enemy.hp, 272);
    assert.equal(t.press('Takomo response').player.hp, 100-damage);
  }
});

test('Observe: lore first, optional enemy response; no initiative roll', () => {
  for (const [roll, hp] of [[0.1,100],[0.9,93]]) {
    const t = fresh('combat.cursor=2;');
    const s = t.press('Observe', roll < 0.5 ? [roll] : [roll,0.5,0.9,0.9]);
    assert.equal(s.local.observeCount, 1);
    assert.equal(s.player.hp, 100);
    t.drainMessages();
    assert.equal(t.g.run('stats.hp'), hp);
    assert.equal(t.g.run('combat.enemy.hp'), 100);
  }
});

test('Run: success defers exit; failure hits immediately and omits on-hit effects', () => {
  const success = fresh('combat.cursor=3;');
  assert.equal(success.press('Run', [0]).pending.escape, true);
  assert.equal(success.press('leave').active, false);
  const failure = fresh('combat.cursor=3; combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_fen_witch};');
  const hit = failure.press('failed Run', [0.99,0.5,0.9,0.9]);
  assert.ok(hit.player.hp < 100);
  assert.deepEqual(hit.statuses, [], 'compatibility: failed Run does not roll poison-on-hit');
  failure.drainMessages();
  assert.equal(failure.g.run('combat.phase'), 'choose');
});

test('ordinary versus guaranteed drops: distinct RNG cadence, one grant', () => {
  for (const guaranteed of [false,true]) {
    const t = fresh(`combat.enemy.hp=1; ${guaranteed ? 'combat.enemy.guaranteedDrop="Potion";' : ''}`);
    const s = t.press('kill', guaranteed ? LETHAL.slice(0,-1) : [...LETHAL.slice(0,-1),0.01]);
    assert.deepEqual(s.player.items.map(i => i.name), ['Potion']);
    assert.equal(s.rngCount, guaranteed ? 7 : 8);
    t.drainMessages();
    const end = t.press('finalize');
    assert.deepEqual(end.player.items.map(i => i.name), ['Potion']);
    assert.equal(end.player.xp, 25);
  }
});

test('compatibility sentinel: enemy-first predicted kill rewards precede deferred HP; level-up HP overwritten', () => {
  const t = fresh('stats.level=1; stats.xp=90; stats.hp=50; combat.enemy.hp=1;');
  // Three level-up draws precede gold/drop, before the first enemy message.
  const s = t.press('enemy-first lethal reply', [...ENEMY_FIRST,0.1,0.6,0.2,0.3,0.99]);
  assert.deepEqual([s.enemy.hp,s.player.xp,s.player.gold,s.player.level,s.player.maxHp,s.player.hp], [1,115,5,2,110,43]);
  assert.equal(s.pending.victory, true);
  assert.equal(s.rngCount, 12);
  assert.equal(t.press('deferred lethal reply').enemy.hp, 0);
  t.drainMessages();
  assert.equal(t.g.run('stats.hp'), 43, 'suspected defect: precomputed HP discards the +10 level-up heal');
});

test('Bomb: arming excludes use turn; three spent turns; damage at detonation acknowledgment', () => {
  const t = fresh('stats.items=[createItem("Bomb")]; combat.phase="item";');
  const armed = t.press('arm Bomb', [0.5,0.9,0.9]);
  assert.equal(armed.local.bombFuse, 3);
  assert.equal(armed.enemy.hp, 100);
  t.drainMessages();
  for (const remaining of [2,1,0]) {
    t.step('select Observe', [], 'combat.cursor=2;');
    t.press('spend turn', [0.1]); // enemy skips; only the Bomb changes HP
    t.drainMessages();
    assert.equal(t.g.run('combat.bombFuse'), remaining);
    assert.equal(t.g.run('combat.enemy.hp'), remaining ? 100 : 20);
  }
});

test('cleanup resets battle mechanics and retains persistent poison/curse', () => {
  const t = fresh(`statusEffects=['burn','dazzled','poison','cursed'];
    combat.corrosion=4; combat.bombFuse=2; combat.bombDamage=80; combat.bombIgnoresDef=true;
    combat.bombJustArmed=true; combat.evadeTurns=3; combat.gullStole='armed'; combat.gullStolenAmount=20;
    combat.escapeUnlocked=true; combat.pendingLighthouseObjective='test-only';`);
  const s = t.step('endCombat', [], 'endCombat();');
  assert.equal(s.active, false);
  assert.equal(s.enemy, null);
  assert.deepEqual(s.statuses, ['poison','cursed']);
  for (const field of ['corrosion','bombFuse','bombDamage','evadeTurns','gullStolenAmount']) assert.equal(s.local[field], 0, field);
  for (const field of ['bombIgnoresDef','bombJustArmed','gullStole','escapeUnlocked']) assert.equal(s.local[field], false, field);
  assert.equal(s.local.pendingLighthouseObjective, null);
});

test('trace helper isolates RNG and rejects missing/extra calls even after failure', () => {
  const hostRandom = Math.random;
  const a = fresh(), b = fresh();
  assert.throws(() => a.step('too short', [], 'Math.random();'), /tape exhausted/);
  assert.throws(() => a.step('too long', [0.5], 'void 0;'), /unused RNG values/);
  assert.throws(() => a.g.run('Math.random()'), /outside a taped step/);
  assert.equal(Math.random, hostRandom);
  assert.equal(b.press('independent attack', PLAYER_FIRST).enemy.hp, 82);
  assert.equal(a.press('recovered helper', PLAYER_FIRST).enemy.hp, 82);
  assert.equal(Math.random, hostRandom);
});

module.exports = {
  name: 'single-enemy production traces: exact RNG, actions, capabilities, outcomes and compatibility quirks',
  sentinels,
  run() {
    for (const sentinel of sentinels) {
      try { sentinel.run(); }
      catch (error) { error.message = sentinel.name + ': ' + error.message; throw error; }
    }
    console.log('  ' + sentinels.length + ' production compatibility sentinels passed');
  },
};
