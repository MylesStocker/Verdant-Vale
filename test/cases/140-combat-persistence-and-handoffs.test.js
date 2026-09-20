'use strict';

const assert = require('assert/strict');
const { createCombatTrace } = require('../combat-trace');
const sentinels = [];
const test = (name, run) => sentinels.push({ name, run });
const PLAYER_FIRST = [0.2,0.5,0.9,0.5,0.9,0.9,0.9];
const ENEMY_FIRST = [0.9,0.5,0.9,0.5,0.9,0.9,0.9];
const LETHAL = [0.2,0.5,0.9,0.5,0.9,0.9,0.3,0.99];

function fresh(watches = {}) {
  const t = createCombatTrace(watches);
  t.step('fixture', [], `
    dialogue.open=false; dialogue.callbacks=null; debugMode=false;
    stats.hp=1000;stats.maxHp=1000;stats.atk=20;stats.def=3;stats.spd=10;
    stats.level=MAX_LEVEL;stats.xp=0;stats.gold=0;stats.items=[];
    stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
  `);
  return t;
}

test('Pale Sentry: chip HP, escape, save/load, defeat, reappearance and eventual victory', () => {
  const t = fresh({hp:'pale_sentry_hp',done:'sentry_quest_done'});
  const placement = `resetLocationState();placeAtLocation('MAP_N2',1.5*TILE,9.5*TILE);`;
  t.step('accepted contract', [], `${placement}sentry_quest_started=true;sentry_quest_done=false;pale_sentry_hp=200;startCombat();combat.flashTimer=0;`);
  assert.equal(t.press('chip HP', PLAYER_FIRST).enemy.hp, 190);
  t.drainMessages();
  t.step('select Run', [], 'combat.cursor=3;');
  t.press('escape', [0]);
  assert.equal(t.press('persist escape').watched.hp, 190);
  t.step('save between fights', [], g => assert.equal(g.run('saveGame()'), true));
  t.step('restore stored HP', [], 'pale_sentry_hp=499;loadGame();menu.open=false;startCombat();combat.flashTimer=0;stats.hp=1;');
  assert.equal(t.g.run('combat.enemy.hp'), 190);
  assert.equal(t.press('lose rematch', ENEMY_FIRST).pending.defeat, true);
  t.drainMessages();
  const recovery = t.press('recover');
  assert.equal(recovery.watched.hp, 190);
  assert.equal(recovery.watched.done, false);
  t.step('return to Sentry', [], `dialogue.open=false;${placement}startCombat();combat.flashTimer=0;stats.atk=1000;`);
  assert.equal(t.g.run('combat.enemy.hp'), 190);
  t.press('eventual kill', LETHAL);
  t.drainMessages();
  const victory = t.press('contract victory');
  assert.deepEqual(victory.watched, {hp:0,done:true});
  assert.equal(victory.player.xp, 350);
  assert.equal(victory.player.gold, 52);
  t.step('persist final victory', [], g => {
    assert.equal(g.run('saveGame()'), true);
    assert.equal(g.run('pale_sentry_hp=500;sentry_quest_done=false;loadGame();'), true);
  });
  const after = t.step('completed contract does not reappear', [0.5,0.99], 'dialogue.open=false;startCombat();');
  assert.equal(after.local.isPaleSentry, false);
  assert.equal(after.watched.done, true);
});

test('Polwick gang: three singleton fights, exact stage handoffs, HP carryover and blocked Run', () => {
  const t = fresh({stage:'fort_quest_stage',dead:'smugglers_dead'});
  t.step('guard starts', [], 'fort_quest_started=true;fort_quest_stage=1;startFortGuardCombat();combat.flashTimer=0;');
  const blocked = t.step('blocked Run', [0.5,0.9,0.9], g => {
    g.run('combat.cursor=3;');g.press('Enter');
  });
  assert.equal(blocked.player.hp, 986);
  assert.equal(blocked.pending.escape, false);
  t.drainMessages();
  let previousXp = 0;
  for (const [id,stage,next] of [
    ['enemy_smuggler_guard',2,'enemy_polwick'],
    ['enemy_polwick',3,'enemy_essa'],
    ['enemy_essa',4,null],
  ]) {
    assert.equal(t.g.run('combat.enemy.id'), id);
    // Fixture setup shortens fights, without altering authored data or outcome handlers.
    t.step('lethal setup', [], 'combat.enemy.hp=1;combat.cursor=0;combat.flashTimer=0;');
    t.press('defeat '+id, LETHAL);
    t.drainMessages();
    const handoff = t.press('finalize '+id);
    assert.equal(handoff.active, false, 'interstitial has no active opponent');
    assert.equal(handoff.enemy, null);
    assert.equal(handoff.watched.stage, stage);
    assert.equal(handoff.player.hp, 986, 'no free heal between opponents at max level');
    assert.ok(handoff.player.xp > previousXp);
    previousXp = handoff.player.xp;
    if (next) {
      const begun = t.press('close interstitial');
      assert.equal(begun.active, true);
      assert.equal(begun.enemy.id, next);
      assert.equal(begun.dialogue.triggerEncounterId, null);
      t.step('entrance frames', [], g => g.frames(8));
    }
  }
  assert.equal(t.g.run('smugglers_dead'), true);
});

test('Ring route: poisoned startup, Observe, zero-RNG escape, one idempotent objective', () => {
  const t = fresh({resolved:'lighthouse_spider_resolved'});
  t.step('route and spider', [], `
    fort_quest_stage=6;smugglers_dead=true;fort_report_filed=false;smugglers_execution_day=0;
    reservoir_quest_started=true;MainQuest=4;lighthouse_quest_stage=1;lighthouse_spider_resolved=false;
    startLenswebSpiderCombat();combat.flashTimer=0;
  `);
  assert.deepEqual(t.checkpoints.at(-1).statuses, ['poison']);
  assert.equal(t.g.run('combat.pendingLighthouseObjective'), 'Old Engagement Ring');
  assert.equal(t.g.run('stats.items.length'), 0);
  t.step('choose Observe', [], 'combat.cursor=2;');
  assert.equal(t.press('Observe', [0.1]).local.escapeUnlocked, true);
  t.drainMessages();
  t.step('choose Run', [], 'combat.cursor=3;');
  t.press('guaranteed Run');
  const done = t.press('finalize escape');
  assert.equal(done.active, false);
  assert.equal(done.watched.resolved, true);
  assert.deepEqual(done.player.items.map(i => i.name), ['Old Engagement Ring']);
  assert.equal(done.player.xp, 0);
  assert.equal(done.rngCount, 1);
  t.step('repeat callback is inert', [], g => assert.equal(g.run('finalizeLenswebSpiderEvent()'), null));
  assert.equal(t.g.run('stats.items.length'), 1);
});

test('supported keys cannot save or load during any battle phase or entrance flash', () => {
  for (const phase of ['choose','item','message','victory','defeat']) {
    for (const flash of [0,8]) {
      const t = fresh();
      t.step('battle fixture', [], `startWardenCombat();combat.phase=${JSON.stringify(phase)};combat.flashTimer=${flash};`);
      for (const key of ['m','M','Escape','s','l','`','i']) t.press('blocked key '+key, [], key);
      assert.equal(t.g.run('menu.open'), false);
      assert.equal(t.g.run('debugMenu.open'), false);
      assert.equal(t.g.run("localStorage.getItem('verdantVale_save')"), null);
      assert.equal(t.g.run('combat.active'), true);
    }
  }
  // Even a stale menu cannot route around the outer combat guard.
  for (const screen of ['saveConfirm','loadConfirm']) {
    const t = fresh();
    t.step('stale menu', [], `saveGame();stats.gold=77;startWardenCombat();combat.phase='message';combat.messageQueue=['waiting','still waiting'];combat.flashTimer=0;menu.open=true;menu.screen='${screen}';`);
    const stored = t.g.run("localStorage.getItem('verdantVale_save')");
    t.press('combat consumes Enter');
    assert.equal(t.g.run('stats.gold'), 77);
    assert.equal(t.g.run("localStorage.getItem('verdantVale_save')"), stored);
  }
});

test('save payload has no live battle; fresh load cannot resume it; direct APIs lack combat guards', () => {
  const t = fresh();
  t.step('ordinary exploration save', [], g => assert.equal(g.run('saveGame()'), true));
  const exploration = t.g.run("localStorage.getItem('verdantVale_save')");
  t.step('active battle', [], 'startWardenCombat();combat.flashTimer=0;');
  t.press('Attack', PLAYER_FIRST);
  // Diagnostic, not supported player input. The API can write while active;
  // this sentinel does NOT declare that omission a desirable feature.
  t.step('direct API save during battle', [], g => assert.equal(g.run('saveGame()'), true));
  const raw = t.g.run("localStorage.getItem('verdantVale_save')");
  const saved = JSON.parse(raw);
  for (const key of ['combat','enemy','enemies','messageQueue','pendingVictory','bombFuse','evadeTurns']) assert.equal(Object.hasOwn(saved,key), false, key);
  assert.ok(Object.hasOwn(saved,'statusEffects'));
  assert.ok(Object.hasOwn(saved,'pale_sentry_hp'));
  assert.ok(Object.hasOwn(saved,'fort_quest_stage'));
  assert.ok(Object.hasOwn(saved,'bossKnockedDown'));
  const loaded = fresh();
  loaded.step('load into fresh session', [], g => {
    g.run('localStorage.setItem("verdantVale_save",'+JSON.stringify(raw)+');');
    assert.equal(g.run('loadGame()'), true);
  });
  assert.equal(loaded.g.run('combat.active'), false);
  assert.equal(loaded.g.run('combat.enemy'), null);
  // A direct load into an already-active session leaves its unrelated battle
  // object intact; it does not reconstruct or resume a saved battle.
  const enemyHp = t.g.run('combat.enemy.hp');
  t.step('direct API load during battle', [], g => {
    g.run('localStorage.setItem("verdantVale_save",'+JSON.stringify(exploration)+');');
    assert.equal(g.run('loadGame()'), true);
  });
  assert.equal(t.g.run('combat.active'), true);
  assert.equal(t.g.run('combat.enemy.hp'), enemyHp);
});

module.exports = {
  name: 'combat persistence traces: Sentry, Polwick sequence, Ring callback, save/input boundaries',
  sentinels,
  run() {
    for (const sentinel of sentinels) {
      try { sentinel.run(); }
      catch (error) { error.message = sentinel.name + ': ' + error.message; throw error; }
    }
    console.log('  ' + sentinels.length + ' persistence/input sentinels passed');
  },
};
