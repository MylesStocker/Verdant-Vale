'use strict';
// Covers: the North Basin south approach (NORTH_BASIN_S_MAP), the first
// entry map of a future 3×3 grid north of Drenwick/MAP3_N2. This is a
// skeleton pass -- one map, no NPCs/quests/shops, five inspectable signs
// only -- so this test focuses on the structural basics:
//
//   1. Walking north off MAP3_N2's row 0 col 12 (NORTH_BASIN_EXIT, reached
//      via the causeway extended through the bridge's north landing) really
//      does enter NORTH_BASIN_S_MAP, via real held-key movement across the
//      tile boundary (not just calling the transition function directly --
//      this also proves the movement.js tile-trigger wiring itself fires).
//   2. Walking south off NORTH_BASIN_S_MAP's row 14 col 12
//      (NORTH_BASIN_ENTRANCE) really does return to MAP3_N2, landing back on
//      the causeway.
//   3. Save/load round-trips correctly while standing on the new map (this
//      needs no dedicated flag or save.js changes -- NORTH_BASIN_S_MAP is a
//      plain activeMap value like MAP2/MAP3/etc, persisted generically via
//      MAP_REGISTRY's mapToId()/mapFromId(), which is itself worth pinning
//      down with a test in case that ever regresses).
//   4. The north edge and the west edge are now both real connections, via
//      the generic EDGE_TRANSITIONS system (not point-tiles) -- see
//      test/cases/21-edge-transitions.test.js for the dedicated crossing
//      coverage (walking the transition, coordinate preservation/clamping,
//      blocked-edge behaviour). This test just confirms the map DATA still
//      matches what EDGE_TRANSITIONS expects: open (walkable) terrain within
//      each configured sourceRange, plain impassable TREE border everywhere
//      else along those edges, and the remaining edge (east -- the future
//      SE neighbour) with no working exit anywhere.
//
// Structural soundness (bounds/walkability/escapability) of the point-tile
// crossing to MAP3_N2 is already covered generically by
// test/transition-audit.js's preserved-coordinate sweep; this test checks
// the specific, real behavior a player actually experiences.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'North Basin: MAP3_N2 <-> NORTH_BASIN_S_MAP crossing, save/load, no stray exits',
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
    g.run('debugMode = true; forceLegacyRegionalView = true; /* legacy inset-crossing tests */');

    // ── 1. Real movement north across MAP3_N2's row 0 col 12 ───────────────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = MAP3_N2;
      player.x = 12.5*TILE; player.y = 2.5*TILE; player.facing = 'up';
      combat.cooldown = 0;
    `);
    assert.equal(g.run('activeMap === MAP3_N2'), true, 'precondition');
    g.hold('ArrowUp');
    // Step one frame at a time and stop the instant the map changes -- the
    // key is still "held" as far as the game is concerned, so holding it for
    // a fixed large frame count would overshoot straight past the landing
    // spot and keep walking north on the *new* map for the leftover frames.
    let crossed = false;
    for (let i = 0; i < 80 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_S_MAP');
    }
    g.release('ArrowUp');
    assert.ok(crossed, 'walking north off MAP3_N2 row 0 col 12 should enter NORTH_BASIN_S_MAP within 80 frames');
    assert.equal(g.run('inDungeon'), false);
    assert.equal(g.run('inTown'), false);
    // Landed just inside the new map's south edge, x preserved (col 12).
    assert.equal(g.run('player.y'), 13.5 * 32);
    assert.ok(Math.abs(g.run('player.x') - 12.5 * 32) < 32, 'player.x should be preserved (still near col 12)');

    // ── 2. Real movement south back across NORTH_BASIN_S_MAP's row 14 col 12 ─
    g.run(`
      player.x = 12.5*TILE; player.y = 12.5*TILE; player.facing = 'down';
      combat.cooldown = 0;
    `);
    g.hold('ArrowDown');
    crossed = false;
    for (let i = 0; i < 80 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === MAP3_N2');
    }
    g.release('ArrowDown');
    assert.ok(crossed, 'walking south off NORTH_BASIN_S_MAP row 14 col 12 should return to MAP3_N2 within 80 frames');
    assert.equal(g.run('player.y'), 1.5 * 32);
    assert.ok(Math.abs(g.run('player.x') - 12.5 * 32) < 32, 'player.x should be preserved (still near col 12, on the causeway)');
    // The landing spot is the causeway tile itself -- must be walkable.
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'the causeway landing spot must be walkable');

    // ── 3. Save/load round-trip while on the new map ────────────────────────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_S_MAP;
      player.x = 12.5*TILE; player.y = 8.5*TILE; player.facing = 'down';
      __reconcileCanonicalForTest(); saveGame();
    `);
    g.run(`
      activeMap = MAP; player.x = 1*TILE; player.y = 1*TILE;
      loadGame();
    `);
    assert.equal(g.run('activeMap === NORTH_BASIN_S_MAP'), true, 'activeMap should restore to NORTH_BASIN_S_MAP');
    assert.equal(g.run('player.x'), 12.5 * 32);
    assert.equal(g.run('player.y'), 8.5 * 32);

    // ── 4. No nonexistent future-map exit is currently traversable ──────────
    const map = g.run('NORTH_BASIN_S_MAP');
    const TREE = g.run('TREE');
    const WALKABLE = g.run('WALKABLE');
    const edges = g.run("EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']");

    // North edge: walkable within the configured EDGE_TRANSITIONS range,
    // plain impassable border everywhere else along it.
    const [northMin, northMax] = edges.north[0].sourceRange;
    const northRow = map[0];
    for (let c = 0; c < northRow.length; c++) {
      if (c >= northMin && c <= northMax) {
        assert.ok(WALKABLE[northRow[c]], `north edge col ${c} is inside the EDGE_TRANSITIONS range and should be walkable`);
      } else {
        assert.equal(northRow[c], TREE, `north edge col ${c} (outside the EDGE_TRANSITIONS range) should be plain impassable border`);
      }
    }
    // West edge: same idea, row-based. The EAST edge is now an open fen boundary
    // with the South Reservoir Road (SE): a broken shore of reed marsh / trees,
    // crossable across several segments rather than one contiguous entrance. Every
    // row inside a crossing segment is walkable, and the road is still the single
    // row-8 PATH; rows outside every segment are non-walkable border (TREE/water).
    const [westMin, westMax] = edges.west[0].sourceRange;
    const inEastSeam = (r) => edges.east.some((seg) => r >= seg.sourceRange[0] && r <= seg.sourceRange[1]);
    for (let r = 0; r < map.length; r++) {
      if (r >= westMin && r <= westMax) {
        assert.ok(WALKABLE[map[r][0]], `west edge row ${r} is inside the EDGE_TRANSITIONS range and should be walkable`);
      } else {
        assert.equal(map[r][0], TREE, `west edge row ${r} (outside the EDGE_TRANSITIONS range) should be plain impassable border`);
      }
      if (inEastSeam(r)) assert.ok(WALKABLE[map[r][15]], `east edge row ${r} (in a crossing segment) is walkable`);
      // Rows outside a crossing segment may be reed marsh (walkable, but the SE
      // shore across from them is reservoir water, so no crossing) or framing
      // trees -- either way never GRASS, and never PATH except the row-8 road.
      assert.notEqual(map[r][15], g.run('GRASS'), `east edge row ${r} carries no grass`);
      if (r !== 8) assert.notEqual(map[r][15], g.run('PATH'), `east edge row ${r} carries no road (only row 8 does)`);
    }
    assert.equal(map[8][15], g.run('PATH'), 'the maintained road still crosses the east seam at row 8');
    // South edge: now a real EDGE_TRANSITIONS connection to MAP3_N2 (the former
    // NORTH_BASIN_ENTRANCE point tile is now the col-12 PATH causeway seam), so it
    // follows the same walkable-within-sourceRange / TREE-elsewhere pattern.
    const [southMin, southMax] = edges.south[0].sourceRange;
    const southRow = map[14];
    for (let c = 0; c < southRow.length; c++) {
      if (c >= southMin && c <= southMax) {
        assert.ok(WALKABLE[southRow[c]], `south edge col ${c} is inside the EDGE_TRANSITIONS range and should be walkable`);
      } else {
        assert.equal(southRow[c], TREE, `south edge col ${c} (outside the EDGE_TRANSITIONS range) should be plain impassable border`);
      }
    }

    // The basin entry has no GRASS, but its REEDS are encounter-eligible all
    // the same, so it DOES roll random encounters -- and they should come from
    // the basin pool, not the generic ENEMY_TEMPLATES fallback it used when it
    // was left encounterPool: null.
    assert.equal(
      g.run("MAP_METADATA['NORTH_BASIN_S_MAP'].encounterPool === NORTH_BASIN_ENEMY_TEMPLATES"), true,
      'South Approach should use the basin enemy pool (not the generic starting-area fallback)'
    );
    assert.equal(g.run("MAP_METADATA['NORTH_BASIN_S_MAP'].allowRandomEncounters"), true,
      'South Approach now has random encounters');

    g.renderFrame();
  },
};
