'use strict';
// Covers: the North Basin centre reservoir (NORTH_BASIN_C_MAP), the second
// map of the future 3×3 North Basin grid, directly north of
// NORTH_BASIN_S_MAP. Same skeleton constraints as the south approach: no
// NPCs/quests/shops, two inspectable signs only, and no GRASS — though its
// REEDS are encounter-eligible, so it does roll encounters (from the basin
// pool). Mirrors 17-north-basin-entry.test.js's structure:
//
//   1. Walking north off NORTH_BASIN_S_MAP's row 0 (within the
//      EDGE_TRANSITIONS open range) really enters NORTH_BASIN_C_MAP, via
//      real held-key movement across the tile boundary. This crossing is
//      now handled by the generic EDGE_TRANSITIONS system rather than a
//      NORTH_BASIN_C_EXIT point-tile (see
//      test/cases/21-edge-transitions.test.js for the dedicated, thorough
//      coverage of that system); this test just confirms the crossing still
//      works end to end after the conversion.
//   2. Walking south off NORTH_BASIN_C_MAP's row 14 (within its own open
//      range) really returns to NORTH_BASIN_S_MAP.
//   3. Save/load round-trips correctly while standing on the new map (same
//      generic MAP_REGISTRY mechanism as every other map -- no new flag).
//   4. None of NORTH_BASIN_C_MAP's other three edges (north, east, west --
//      the future N/E/W neighbours) have a working exit yet, and the south
//      edge's open range matches exactly what EDGE_TRANSITIONS expects.
//   5. No GRASS, but it uses the basin enemy pool (REEDS roll encounters),
//      same as the south approach.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'North Basin: NORTH_BASIN_S_MAP <-> NORTH_BASIN_C_MAP crossing, save/load, no stray exits',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // debugMode suppresses random encounters -- this is a movement/
    // transition test, not an encounter test, and North Basin's crossing
    // paths are heavily REEDS-covered (encounter-eligible in plain
    // outdoor context, same as GRASS -- see tiles.js's TILE_PROPERTIES),
    // so without this an unlucky roll during a held-key multi-frame walk
    // could start real combat mid-crossing and fail nondeterministically.
    g.run('debugMode = true;');

    // ── 1. Real movement north across NORTH_BASIN_S_MAP's row 0 col 12 ─────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_S_MAP;
      player.x = 12.5*TILE; player.y = 2.5*TILE; player.facing = 'up';
      combat.cooldown = 0;
    `);
    assert.equal(g.run('activeMap === NORTH_BASIN_S_MAP'), true, 'precondition');
    g.hold('ArrowUp');
    let crossed = false;
    for (let i = 0; i < 80 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_C_MAP');
    }
    g.release('ArrowUp');
    assert.ok(crossed, 'walking north off NORTH_BASIN_S_MAP row 0 col 12 should enter NORTH_BASIN_C_MAP within 80 frames');
    assert.equal(g.run('inDungeon'), false);
    assert.equal(g.run('inTown'), false);
    // Landed just inside the reservoir map's south edge, x preserved (col 12).
    assert.equal(g.run('player.y'), 13.5 * 32);
    assert.ok(Math.abs(g.run('player.x') - 12.5 * 32) < 32, 'player.x should be preserved (still near col 12)');

    // ── 2. Real movement south back across NORTH_BASIN_C_MAP's row 14 col 12 ─
    g.run(`
      player.x = 12.5*TILE; player.y = 12.5*TILE; player.facing = 'down';
      combat.cooldown = 0;
    `);
    g.hold('ArrowDown');
    crossed = false;
    for (let i = 0; i < 80 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_S_MAP');
    }
    g.release('ArrowDown');
    assert.ok(crossed, 'walking south off NORTH_BASIN_C_MAP row 14 col 12 should return to NORTH_BASIN_S_MAP within 80 frames');
    assert.equal(g.run('player.y'), 1.5 * 32);
    assert.ok(Math.abs(g.run('player.x') - 12.5 * 32) < 32, 'player.x should be preserved (still near col 12)');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'the landing spot must be walkable');

    // ── 3. Save/load round-trip while on the new map ────────────────────────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_C_MAP;
      player.x = 7.5*TILE; player.y = 12.5*TILE; player.facing = 'down';
      saveGame();
    `);
    g.run(`
      activeMap = MAP; player.x = 1*TILE; player.y = 1*TILE;
      loadGame();
    `);
    assert.equal(g.run('activeMap === NORTH_BASIN_C_MAP'), true, 'activeMap should restore to NORTH_BASIN_C_MAP');
    assert.equal(g.run('player.x'), 7.5 * 32);
    assert.equal(g.run('player.y'), 12.5 * 32);

    // ── 4. No nonexistent future-map exit is currently traversable ──────────
    const map = g.run('NORTH_BASIN_C_MAP');
    const TREE = g.run('TREE');
    const WATER = g.run('WATER');
    // An impassable border tile may be TREE (unbuilt-neighbour edge) or WATER
    // (the open reservoir continuing off-map). Both block the player equally;
    // the invariant here is "no walkable gap", not "specifically TREE".
    const isBorder = (t) => t === TREE || t === WATER;
    assert.ok(map[0].every(isBorder), 'north edge (open reservoir off-map) should be impassable border, no working exit yet');
    for (const row of map) {
      assert.ok(isBorder(row[0]), 'west edge should be impassable border (TREE or reservoir WATER)');
      assert.ok(isBorder(row[15]), 'east edge should be impassable border (TREE or reservoir WATER)');
    }
    const southRow = map[14];
    const WALKABLE = g.run('WALKABLE');
    const [southMin, southMax] = g.run("EDGE_TRANSITIONS['NORTH_BASIN_C_MAP']").south[0].sourceRange;
    for (let c = 0; c < southRow.length; c++) {
      if (c >= southMin && c <= southMax) {
        assert.ok(WALKABLE[southRow[c]], `south edge col ${c} is inside the EDGE_TRANSITIONS range and should be walkable`);
      } else {
        assert.equal(southRow[c], TREE, `south edge col ${c} (outside the EDGE_TRANSITIONS range) should be plain impassable border`);
      }
    }

    // ── 5. Encounters: no GRASS, but REEDS are encounter-eligible, so it rolls
    //       encounters from the basin pool (not the generic fallback). ─────────
    assert.equal(
      g.run("MAP_METADATA['NORTH_BASIN_C_MAP'].encounterPool === NORTH_BASIN_ENEMY_TEMPLATES"), true,
      'Centre Reservoir should use the basin enemy pool (not the generic starting-area fallback)'
    );
    assert.equal(g.run("MAP_METADATA['NORTH_BASIN_C_MAP'].allowRandomEncounters"), true,
      'Centre Reservoir now has random encounters');

    g.renderFrame();
  },
};
