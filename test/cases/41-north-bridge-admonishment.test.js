'use strict';
// Covers: the pre-MQ4 north-bridge admonishment. The Imperial toll bridge
// north of Drenwick (MAP3_N2) is the only crossing of the canal, and the
// North Basin beyond it is deliberately reachable before the reservoir
// assignment exists (reservoir_quest_started). If the player crosses NORTH
// before that assignment, exitBridgeNorth() (world-transitions.js) records it
// (north_bridge_crossed_early), and the next time the player reports to the
// Calwick office supervisor, interactSupervisor() (interactions.js) prepends a
// one-time light admonishment — he asks why they went up there and tells them
// off, mildly — gated by north_bridge_scolded so it never repeats.
//
//   1. Crossing the bridge NORTH pre-MQ4 (real movement, toll paid) sets
//      north_bridge_crossed_early; north_bridge_scolded stays false.
//   2. Crossing north AFTER the assignment does NOT set the early flag (going
//      north is the job by then).
//   3. The supervisor delivers the admonishment once — it asks why and
//      admonishes — and sets north_bridge_scolded.
//   4. It does not repeat on later visits (even across a day change).
//   5. It never fires if reservoir_quest_started is already set.
//   6. It never fires if the player never crossed north.
//   7. Both flags survive a save/load round trip, so the admonishment can't
//      be dodged by reloading, and can't re-fire after it's been delivered.
//   8. Crossing SOUTH (exitBridgeSouth) never arms the admonishment.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Reports in to the office supervisor and pages fully through, returning the
// speaker and the lowercased page text.
function talkToSupervisor(g) {
  g.run(`
    inDungeon = false; inSluice = false; inBridgePost = false;
    inTown = true; currentTownId = 'calwick'; townBuilding = 'office';
    player.x = SUPERVISOR.x; player.y = SUPERVISOR.y; player.facing = 'up';
    dialogue.open = false;
  `);
  g.press('Enter');
  const name = g.run('dialogue.name');
  const text = JSON.stringify(g.run('dialogue.pages')).toLowerCase();
  const pages = g.run('dialogue.pages.length');
  for (let i = 0; i < pages; i++) g.press('Enter');
  return { name, text };
}

const SCOLD_QUESTION = /what took you up there/;
const SCOLD_ADMONISH = /won.t write it up/;

module.exports = {
  name: 'north-bridge admonishment: supervisor questions a pre-MQ4 crossing once, persists, never after assignment',
  run() {
    // ── 1. Real northward crossing pre-MQ4 arms the flag ────────────────────
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue
    g.run(`
      reservoir_quest_started = false; syncQuestFlagsToWindow();
      inDungeon = false; inTown = false; inSluice = false; inBridgePost = false;
      activeMap = MAP3_N2; player.x = 12.5*TILE; player.y = 6.5*TILE; player.facing = 'up';
      combat.cooldown = 0; debugMode = true; stats.gold = 5;
    `);
    // Step onto the bridge gate (enter the checkpoint from the south bank).
    g.hold('ArrowUp');
    let entered = false;
    for (let i = 0; i < 20 && !entered; i++) { g.frames(1); entered = g.run('inBridgePost'); }
    g.release('ArrowUp');
    assert.ok(entered, 'stepping onto the bridge gate should enter the checkpoint');
    assert.equal(g.run('bridge_entry_direction'), 'south', 'entered from the south bank, heading north');

    // Pay the toll and walk off the north end -> exitBridgeNorth().
    g.run('bridge_toll_paid = true; player.x = 7.5*TILE; player.y = 1.5*TILE; player.facing = "up";');
    g.hold('ArrowUp');
    let crossed = false;
    for (let i = 0; i < 20 && !crossed; i++) { g.frames(1); crossed = g.run('activeMap === MAP3_N2 && !inBridgePost'); }
    g.release('ArrowUp');
    assert.ok(crossed, 'walking off the north end should return to MAP3_N2 north bank');
    assert.equal(g.run('north_bridge_crossed_early'), true, 'crossing north pre-MQ4 must arm the early-crossing flag');
    assert.equal(g.run('north_bridge_scolded'), false, 'the admonishment has not been delivered yet');

    // ── 3. The supervisor asks why and admonishes, once ─────────────────────
    const first = talkToSupervisor(g);
    assert.equal(first.name, 'Supervisor');
    assert.ok(SCOLD_QUESTION.test(first.text), 'the supervisor should ask why the player went north');
    assert.ok(SCOLD_ADMONISH.test(first.text), 'the supervisor should lightly admonish (won\'t write it up)');
    assert.ok(/basin road|north of drenwick/.test(first.text), 'the admonishment names where they went');
    assert.equal(g.run('north_bridge_scolded'), true, 'delivering the line sets the scolded flag');

    // ── 4. It does not repeat, even on a later day ──────────────────────────
    g.run('day = 2;');
    const second = talkToSupervisor(g);
    assert.ok(!SCOLD_QUESTION.test(second.text), 'the admonishment must not repeat on a later visit');

    // ── 7. Persistence: both flags survive save/load ────────────────────────
    // Save with both flags set, scramble, reload -> flags restored, so the
    // admonishment stays delivered (can't re-fire) and the crossing stays on
    // record (can't be dodged by reloading before reporting in).
    g.run(`
      activeMap = MAP; player.x = 5.5*TILE; player.y = 5.5*TILE; inTown = false;
      saveGame();
      north_bridge_crossed_early = false; north_bridge_scolded = false; syncQuestFlagsToWindow();
      loadGame();
    `);
    assert.equal(g.run('north_bridge_crossed_early'), true, 'early-crossing flag must survive save/load');
    assert.equal(g.run('north_bridge_scolded'), true, 'scolded flag must survive save/load');
    g.run('day = 3;');
    assert.ok(!SCOLD_QUESTION.test(talkToSupervisor(g).text),
      'after a load, the already-delivered admonishment must not re-fire');

    // ── 2. Crossing north AFTER the assignment does not arm the flag ────────
    {
      const g2 = createContext();
      g2.press('Enter');
      g2.press('Enter');
      g2.run(`
        reservoir_quest_started = true; syncQuestFlagsToWindow();
        inBridgePost = true; bridge_entry_direction = 'south'; bridge_toll_paid = true;
        activeMap = BRIDGE_CROSSING_MAP; player.x = 7.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
        debugMode = true;
      `);
      g2.hold('ArrowUp');
      for (let i = 0; i < 20 && g2.run('inBridgePost'); i++) g2.frames(1);
      g2.release('ArrowUp');
      assert.equal(g2.run('activeMap === MAP3_N2'), true, 'should have crossed north');
      assert.equal(g2.run('north_bridge_crossed_early'), false,
        'crossing north AFTER the assignment must not arm the early-crossing flag');
    }

    // ── 5. Never fires if reservoir_quest_started is already set ────────────
    {
      const g3 = createContext();
      g3.press('Enter');
      g3.press('Enter');
      g3.run('north_bridge_crossed_early = true; north_bridge_scolded = false; reservoir_quest_started = true; syncQuestFlagsToWindow();');
      const r = talkToSupervisor(g3);
      assert.ok(!SCOLD_QUESTION.test(r.text), 'no admonishment once the basin IS the assignment');
      assert.equal(g3.run('north_bridge_scolded'), false, 'the scolded flag is left untouched when it never fires');
    }

    // ── 6. Never fires if the player never crossed north ────────────────────
    {
      const g4 = createContext();
      g4.press('Enter');
      g4.press('Enter');
      const r = talkToSupervisor(g4);
      assert.ok(!SCOLD_QUESTION.test(r.text), 'no admonishment when the bridge was never crossed north');
    }

    // ── 8. Crossing SOUTH never arms the admonishment ───────────────────────
    {
      const g5 = createContext();
      g5.press('Enter');
      g5.press('Enter');
      g5.run(`
        reservoir_quest_started = false; syncQuestFlagsToWindow();
        inBridgePost = true; bridge_entry_direction = 'north'; bridge_toll_paid = true;
        activeMap = BRIDGE_CROSSING_MAP; player.x = 7.5*TILE; player.y = 13.5*TILE; player.facing = 'down';
        debugMode = true;
      `);
      g5.hold('ArrowDown');
      for (let i = 0; i < 20 && g5.run('inBridgePost'); i++) g5.frames(1);
      g5.release('ArrowDown');
      assert.equal(g5.run('activeMap === MAP3_N2'), true, 'should have crossed south');
      assert.equal(g5.run('north_bridge_crossed_early'), false, 'crossing SOUTH must never arm the northbound admonishment');
    }
  },
};
