'use strict';
// Covers: the South Ruins Entrance Hall — a new no-encounter area between the
// overworld and the monster-infested South Ruins floor 1, added so the player
// doesn't drop straight into combat territory the moment they step on the
// overworld DUNGEON_ENTRANCE tile.
//
// Checks, in order:
//   1. The full transition chain: overworld -> entrance hall -> floor 1 ->
//      back to the entrance hall -> back to overworld, via the real
//      enterDungeon()/descendToDungeon1()/ascendToDungeonEntrance()/
//      exitDungeon() functions (structural soundness of each -- landing tile
//      walkable, escapable, correct destination map -- is already covered
//      generically by test/transition-audit.js; this test checks the
//      *specific* state each one is supposed to produce).
//   2. No random encounters ever fire while walking around the hall, even
//      with Math.random() forced to always return 0 (the value that would
//      guarantee an encounter on every single roll if the hall were mistakenly
//      wired into any encounter pool). Math is a shared global across every
//      test file in one `node test/run.js` process, so the override is
//      restored in a try/finally exactly like balance-report.js's self-check.
//   3. The player can walk in a straight line from deep in the hall all the
//      way up to the stairs-down tile without any solid NPC blocking the
//      corridor (regression guard: Perrin used to stand at col 9, inside the
//      corridor's own column span, and had to be moved out of the way).
//   4. Two of the four lore NPCs (Rovan, Perrin) are reachable and greet the
//      player by name (stats.name), not just generically.
//   5. inDungeonEntrance round-trips through save/load.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'South Ruins Entrance Hall: transitions, no encounters, clear path, named greetings, save/load',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 1. Full transition chain ────────────────────────────────────────────
    g.run(`
      inDungeon = false; inDungeonEntrance = false; activeMap = MAP;
      player.x = 11.5*TILE; player.y = 12.5*TILE; player.facing = 'up';
      enterDungeon();
    `);
    assert.equal(g.run('inDungeonEntrance'), true, 'enterDungeon() should set inDungeonEntrance');
    assert.equal(g.run('inDungeon'), false, 'enterDungeon() should NOT set inDungeon -- kept separate on purpose so no combat pool is ever selected here');
    assert.equal(g.run('activeMap === DUNGEON_ENTRANCE_MAP'), true, 'enterDungeon() should land in the entrance hall, not straight into floor 1');

    g.run('descendToDungeon1();');
    assert.equal(g.run('inDungeonEntrance'), false, 'descendToDungeon1() should clear inDungeonEntrance');
    assert.equal(g.run('inDungeon && dungeonFloor === 1'), true, 'descendToDungeon1() should land on real floor 1');
    assert.equal(g.run('activeMap === DUNGEON_MAP'), true);

    g.run('ascendToDungeonEntrance();');
    assert.equal(g.run('inDungeon'), false, 'ascendToDungeonEntrance() should clear inDungeon');
    assert.equal(g.run('inDungeonEntrance'), true, 'ascendToDungeonEntrance() should return to the entrance hall');
    assert.equal(g.run('activeMap === DUNGEON_ENTRANCE_MAP'), true);

    g.run('exitDungeon();');
    assert.equal(g.run('inDungeonEntrance'), false, 'exitDungeon() should clear inDungeonEntrance');
    assert.equal(g.run('inDungeon'), false);
    assert.equal(g.run('activeMap === MAP'), true, 'exitDungeon() should return to the overworld');

    // ── 2. No encounters, even with Math.random forced to the worst case ───
    const realRandom = Math.random;
    try {
      Math.random = () => 0; // guarantees Math.random() < ENCOUNTER_CHANCE every single roll
      g.run(`
        inDungeonEntrance = true; inDungeon = false; activeMap = DUNGEON_ENTRANCE_MAP;
        combat.cooldown = 0;
        player.x = 7.5*TILE; player.y = 10.5*TILE; player.facing = 'left';
      `);
      assert.equal(g.run('combat.active'), false, 'precondition: not already in combat');
      g.hold('ArrowLeft');
      g.frames(200); // far more than the 16-frame encounter-check interval, repeatedly
      g.release('ArrowLeft');
      assert.equal(g.run('combat.active'), false, 'walking around the entrance hall must never trigger a random encounter, even with Math.random forced to 0');
    } finally {
      Math.random = realRandom;
    }

    // ── 3. The corridor to the stairs is actually walkable end to end ──────
    // Regression guard: Perrin originally stood at (9.5*TILE, 6.5*TILE) --
    // col 9, inside the north corridor's own cols 6-9 span -- which blocked
    // the path along that column. Confirm that exact spot is clear now...
    assert.equal(g.run('canWalk(9.5*TILE, 6.5*TILE)'), true, "Perrin's old spot (col 9, row 6, inside the stairs corridor) must be walkable now");
    // ...and, more robustly, that a real walk straight up column 9 (Perrin's
    // old column, and one of the corridor's own cols 6-9) actually clears
    // the whole corridor, not just that one coordinate. (Column 7.5, the
    // dead center, deliberately hits the drained basin at rows 7-8 -- that's
    // an intentional obstacle, not the regression being guarded here, so
    // this check uses column 9 specifically.)
    g.run(`
      inDungeonEntrance = true; inDungeon = false; activeMap = DUNGEON_ENTRANCE_MAP;
      combat.cooldown = ENCOUNTER_COOLDOWN;
      player.x = 9.5*TILE; player.y = 10.5*TILE; player.facing = 'up';
    `);
    g.hold('ArrowUp');
    g.frames(200); // 10.5 -> ~2 (col 9 narrows to wall at row 1) is 272px at 2px/frame = 136 frames; generous margin
    g.release('ArrowUp');
    const finalRow = g.run('player.y') / 32;
    assert.ok(finalRow < 3, `player should have walked unobstructed up column 9 into the corridor, ended at row ${finalRow.toFixed(2)}`);

    // ── 4. Rovan and Perrin greet the player by name ────────────────────────
    const playerName = g.run('stats.name');

    g.run(`
      inDungeonEntrance = true; inDungeon = false; activeMap = DUNGEON_ENTRANCE_MAP;
      player.x = 5.5*TILE; player.y = 10.5*TILE; player.facing = 'down'; // Rovan's position
    `);
    assert.equal(g.run('dialogue.open'), false, 'precondition: no dialogue open yet');
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'interacting near Rovan should open dialogue');
    assert.equal(g.run('dialogue.name'), 'Rovan');
    assert.ok(g.run('dialogue.pages[0][0]').includes(playerName), `Rovan's opening line should greet the player by name (${playerName})`);
    g.run('dialogue.open = false;');

    g.run(`
      player.x = 12.5*TILE; player.y = 7.5*TILE; player.facing = 'down'; // Perrin's (moved) position
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'interacting near Perrin should open dialogue');
    assert.equal(g.run('dialogue.name'), 'Perrin');
    assert.ok(g.run('dialogue.pages[0][0]').includes(playerName), `Perrin's opening line should greet the player by name (${playerName})`);

    // ── 5. Save/load round-trip ─────────────────────────────────────────────
    g.run(`
      dialogue.open = false;
      inDungeonEntrance = true; inDungeon = false; activeMap = DUNGEON_ENTRANCE_MAP;
      player.x = 7.5*TILE; player.y = 12.5*TILE; player.facing = 'up';
      saveGame();
    `);
    g.run(`
      inDungeonEntrance = false; activeMap = MAP;
      player.x = 1*TILE; player.y = 1*TILE;
      loadGame();
    `);
    assert.equal(g.run('inDungeonEntrance'), true, 'inDungeonEntrance should round-trip through save/load');
    assert.equal(g.run('activeMap === DUNGEON_ENTRANCE_MAP'), true, 'activeMap should restore to the entrance hall');
    assert.equal(g.run('player.x'), 7.5 * 32);
    assert.equal(g.run('player.y'), 12.5 * 32);

    g.renderFrame();
  },
};
