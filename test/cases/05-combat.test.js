'use strict';
// Covers: entering combat and playing it to completion through real
// keypresses (input.js -> combat.js's handleCombatAction()/
// advanceCombatMessage()/endCombat()).
//
// Simplification: in the real game, combat is *entered* via a random
// encounter roll while walking (movement.js's encounter-cooldown/probability
// check). Reproducing that trigger deterministically would mean re-mocking
// the RNG that decides *whether* a fight starts, which isn't really game
// logic so much as flavor timing. Instead this test calls startCombat()
// directly -- the same function the random-encounter path calls -- then
// takes over from there with real keypresses for the entire fight. It also
// overwrites combat.enemy with fixed stats (1 HP, 0 defense) right after
// starting, so the *outcome* of the fight is deterministic without mocking
// Math.random (which would otherwise have to be shared/reset carefully
// across test files, since Math is one object shared by the whole process).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'combat: enter an encounter and win it via real attack keypresses',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    assert.equal(g.run('combat.active'), false, 'precondition: not already in combat');

    g.run('startCombat()');
    assert.equal(g.run('combat.active'), true, 'startCombat() should enter combat');
    assert.equal(g.run('combat.phase'), 'choose');

    // Pin the enemy to guaranteed-kill-in-one-hit stats so the fight's
    // *outcome* doesn't depend on which enemy the (real, unmocked) RNG in
    // startCombat() happened to pick, or on damage-roll variance.
    g.run(`
      combat.enemy = {
        name: 'Test Dummy', hp: 1, maxHp: 1,
        atk: 1, def: 0, spd: 0,
        xp: 25, goldMin: 5, goldMax: 5,
      };
      combat.cursor = 0; // combatOptions()[0] === 'attack'
    `);

    // startCombat() sets flashTimer = 8; input.js ignores combat input until
    // it reaches 0 (movement.js's update() ticks it down each frame).
    g.frames(10);
    assert.equal(g.run('combat.flashTimer'), 0, 'flash timer should have run out');

    const goldBefore = g.run('stats.gold');
    const xpBefore   = g.run('stats.xp');

    // Attack. Player SPD (7) > enemy SPD (0) so the player always goes
    // first, and 1 HP means the first hit is always lethal.
    g.press('Enter');
    assert.equal(g.run('combat.phase'), 'message', 'attacking should move into the message phase');

    // Click through every result message (defeat message, XP gain, gold
    // gain, and possibly a level-up message) until the fight resolves.
    let reachedVictory = false;
    for (let i = 0; i < 20; i++) {
      if (g.run('combat.phase') === 'victory') { reachedVictory = true; break; }
      g.press('Enter');
    }
    assert.equal(reachedVictory, true, 'combat should reach the victory phase within 20 message advances');
    assert.equal(g.run('combat.active'), true, 'still "in combat" while the victory screen is showing');

    // One more Enter on the victory screen ends combat for a plain enemy
    // (no boss/quest follow-up dialogue attached to our fake Test Dummy).
    g.press('Enter');
    assert.equal(g.run('combat.active'), false, 'combat should end after acknowledging victory');
    assert.equal(g.run('combat.enemy'), null);

    // Rewards were applied exactly once, for exactly our fixed enemy's values.
    assert.equal(g.run('stats.xp'),   xpBefore + 25, 'should have gained exactly the enemy\'s XP');
    assert.equal(g.run('stats.gold'), goldBefore + 5, 'should have gained exactly the enemy\'s gold');

    g.renderFrame();
  },
};
