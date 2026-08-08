'use strict';
// Regression test for QUEST_TRACE.md Issue #1: the smugglers'-fort quest
// (guard -> Polwick -> Essa fight chain) permanently soft-locks if any of
// the three fights is fled or lost, because those NPCs are only present on
// the map at fort_quest_stage 0 or >=5 -- never during the in-progress
// stages 1-3 -- and fort_quest_stage is never reset to 0 by anything.
//
// This drives the guard fight through real interactions (confront Polwick,
// choose "Make an arrest"), then simulates the fight being abandoned by
// calling endCombat() directly -- the exact function both a successful flee
// and a loss funnel through, without touching fort_quest_stage -- and
// asserts the player still has a way to retry.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'fort quest: guard fight remains retriable after a flee/loss',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    g.run(`
      inTown = false;
      fort_quest_started = true;
      enterSmugglerFort();
      player.x = 7.5 * TILE;
      player.y = 4.5 * TILE;
      player.facing = 'down';
    `);
    assert.equal(g.run('fort_quest_stage'), 0, 'precondition: fort not yet confronted');

    // Confront Polwick -> 3-page dialogue -> choice.
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Polwick', 'should open Polwick\'s confrontation dialogue');
    g.press('Enter');
    g.press('Enter');
    g.press('Enter');
    assert.equal(g.run('choice.open'), true, 'should reach the arrest/leave choice');
    // Compare via JSON, not assert.deepEqual: arrays pulled out of the vm
    // context have a different Array prototype than host-literal arrays,
    // so deepEqual's reference-identity check fails even when the contents
    // match exactly.
    assert.equal(
      JSON.stringify(g.run('choice.options')),
      JSON.stringify(['Make an arrest', 'Leave them be'])
    );

    // Choose "Make an arrest" (cursor defaults to 0).
    g.press('Enter');
    assert.equal(g.run('fort_quest_stage'), 1, 'accepting the arrest should set stage 1');
    assert.equal(g.run('dialogue.triggerEncounterId'), 'fort_guard');

    // Close the "Guard." dialogue -- this is what starts the fight.
    g.press('Enter');
    g.press('Enter');
    assert.equal(g.run('combat.active'), true, 'guard fight should have started');
    assert.equal(g.run('combat.isFortGuard'), true);

    // Simulate the fight being abandoned (flee succeeding, or a loss) --
    // both real paths call endCombat() without touching fort_quest_stage.
    g.run('endCombat()');
    assert.equal(g.run('combat.active'), false);
    assert.equal(g.run('fort_quest_stage'), 1, 'stage should still be 1 after abandoning the fight');

    // The regression check: re-approach the guard's position and interact.
    // Before the fix, the guard is invisible/unreachable at stage 1 and
    // nothing happens here. After the fix, this should retrigger the fight.
    g.run(`
      player.x = 6.5 * TILE;
      player.y = 9.5 * TILE;
      player.facing = 'up';
    `);
    g.press('Enter');

    const retriggered = g.run("dialogue.triggerEncounterId === 'fort_guard' || combat.active === true");
    assert.equal(
      retriggered, true,
      'the guard fight should be retriggerable after being abandoned once -- it currently is not (QUEST_TRACE Issue #1)'
    );

    // If we got a fresh trigger, actually resolve the fight this time and
    // confirm the whole quest chain remains completable end-to-end from here.
    if (g.run("dialogue.triggerEncounterId === 'fort_guard'")) {
      g.press('Enter'); // close whatever line accompanies the retrigger, starts combat
    }
    assert.equal(g.run('combat.active'), true, 'guard fight should be running again');
    g.frames(10); // clear flashTimer
    g.run(`
      combat.enemy = { name: 'Guard', hp: 1, maxHp: 1, atk: 1, def: 0, spd: 0, xp: 1, goldMin: 0, goldMax: 0 };
      combat.cursor = 0; // attack
    `);
    g.press('Enter'); // attack -> lethal, phase -> 'message'
    let reachedVictory = false;
    for (let i = 0; i < 20; i++) {
      if (g.run('combat.phase') === 'victory') { reachedVictory = true; break; }
      g.press('Enter');
    }
    assert.equal(reachedVictory, true, 'the retried guard fight should reach victory');
    g.press('Enter'); // acknowledge victory -> isFortGuard handler runs
    assert.equal(g.run('fort_quest_stage'), 2, 'winning the retried guard fight should still advance the quest normally');
  },
};
