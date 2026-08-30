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
//   3. The player can reach the stairs-down tiles without a solid NPC blocking
//      them. Rovan stands one tile east at col 9 row 2; Perrin remains clear of
//      the north corridor.
//   4. Two of the four lore NPCs (Rovan, Perrin) are reachable and greet the
//      player by name; Rovan recognizes the player's three-year local tenure.
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
    ; __reconcileCanonicalForTest();`);
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
      ; __reconcileCanonicalForTest();`);
      assert.equal(g.run('combat.active'), false, 'precondition: not already in combat');
      g.hold('ArrowLeft');
      g.frames(200); // far more than the 16-frame encounter-check interval, repeatedly
      g.release('ArrowLeft');
      assert.equal(g.run('combat.active'), false, 'walking around the entrance hall must never trigger a random encounter, even with Math.random forced to 0');
    } finally {
      Math.random = realRandom;
    }

    // ── 3. The corridor and stairs remain reachable around the NPCs ─────
    // Regression guard: Perrin originally stood at (9.5*TILE, 6.5*TILE) --
    // col 9, inside the north corridor's own cols 6-9 span -- which blocked
    // the path along that column. Confirm that exact spot is clear now...
    assert.equal(g.run('canWalk(9.5*TILE, 6.5*TILE)'), true, "Perrin's old spot (col 9, row 6, inside the stairs corridor) must be walkable now");
    // Rovan now occupies col 9 row 2, one tile right of his old stairs-side
    // position. Confirm the new tile is ordinary walkable ruin floor and the
    // two actual stair tiles themselves are clear.
    assert.equal(g.run("SIMPLE_NPCS.find(n => n.id === 'rovan_ruins').x"), 9.5 * 32);
    assert.equal(g.run("SIMPLE_NPCS.find(n => n.id === 'rovan_ruins').y"), 2.5 * 32);
    assert.equal(g.run('DUNGEON_ENTRANCE_MAP[2][9]'), 77, "Rovan's new tile is ruin floor, not stairs");
    assert.equal(g.run('canWalk(8.5*TILE, 2.5*TILE)'), true, "Rovan's old stairs-side tile is clear");
    assert.equal(g.run('canWalk(9.5*TILE, 2.5*TILE)'), false, "Rovan's new tile remains solid");
    assert.equal(g.run("SIMPLE_NPCS.some(n => n.map === 'dungeon_entrance' && n.x === 7.5*TILE && n.y === 1.5*TILE)"), false);
    assert.equal(g.run("SIMPLE_NPCS.some(n => n.map === 'dungeon_entrance' && n.x === 8.5*TILE && n.y === 1.5*TILE)"), false);

    // Walk up the former Perrin column until Rovan's new position stops the
    // straight line, then step left and continue onto the right stair tile.
    g.run(`
      inDungeonEntrance = true; inDungeon = false; activeMap = DUNGEON_ENTRANCE_MAP;
      combat.cooldown = ENCOUNTER_COOLDOWN;
      player.x = 9.5*TILE; player.y = 10.5*TILE; player.facing = 'up';
    ; __reconcileCanonicalForTest();`);
    g.hold('ArrowUp');
    g.frames(160);
    g.release('ArrowUp');
    assert.ok(g.run('player.y/TILE') < 4, 'player reaches the north corridor below Rovan');
    g.hold('ArrowLeft'); g.frames(20); g.release('ArrowLeft');
    g.hold('ArrowUp'); g.frames(40); g.release('ArrowUp');
    assert.equal(g.run('activeMap === DUNGEON_MAP && inDungeon && dungeonFloor === 1'), true,
      'player can route around Rovan onto the stairs and descend to floor 1');

    // ── 4. Rovan and Perrin greet the player by name ────────────────────────
    const playerName = g.run('stats.name');

    g.run(`
      inDungeonEntrance = true; inDungeon = false; activeMap = DUNGEON_ENTRANCE_MAP;
      player.x = 9.5*TILE; player.y = 2.5*TILE; player.facing = 'down'; // Rovan's new position, east of the stairs
    ; __reconcileCanonicalForTest();`);
    assert.equal(g.run('dialogue.open'), false, 'precondition: no dialogue open yet');
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'interacting near Rovan should open dialogue');
    assert.equal(g.run('dialogue.name'), 'Rovan');
    assert.ok(g.run('dialogue.pages[0].join(" ")').includes(playerName), `Rovan's opening exchange should greet the player by name (${playerName})`);
    assert.match(g.run('dialogue.pages[0].join(" ")'), /Three years in the fens/, 'Rovan recognizes the player has lived locally for three years');
    assert.doesNotMatch(g.run('dialogue.pages.flat().join(" ")'), /new one|hasn.t been hit yet/i, 'Rovan no longer treats the player as a newcomer');
    // His stairs-side dialogue is a plain "not yet, turn back" warning.
    assert.match(g.run('JSON.stringify(dialogue.pages)'), /not yet|kill you|come back/, 'Rovan warns the player off descending unprepared');
    g.run('dialogue.open = false;');

    g.run(`
      player.x = 12.5*TILE; player.y = 7.5*TILE; player.facing = 'down'; // Perrin's (moved) position
    ; __reconcileCanonicalForTest();`);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'interacting near Perrin should open dialogue');
    assert.equal(g.run('dialogue.name'), 'Perrin');
    assert.ok(g.run('dialogue.pages[0][0]').includes(playerName), `Perrin's opening line should greet the player by name (${playerName})`);

    // ── 5. Save/load round-trip ─────────────────────────────────────────────
    g.run(`
      dialogue.open = false;
      inDungeonEntrance = true; inDungeon = false; activeMap = DUNGEON_ENTRANCE_MAP;
      player.x = 7.5*TILE; player.y = 12.5*TILE; player.facing = 'up';
      __reconcileCanonicalForTest(); saveGame();
    `);
    g.run(`
      inDungeonEntrance = false; activeMap = MAP;
      player.x = 1*TILE; player.y = 1*TILE;
      loadGame();
    ; __reconcileCanonicalForTest();`);
    assert.equal(g.run('inDungeonEntrance'), true, 'inDungeonEntrance should round-trip through save/load');
    assert.equal(g.run('activeMap === DUNGEON_ENTRANCE_MAP'), true, 'activeMap should restore to the entrance hall');
    assert.equal(g.run('player.x'), 7.5 * 32);
    assert.equal(g.run('player.y'), 12.5 * 32);

    g.renderFrame();
  },
};
