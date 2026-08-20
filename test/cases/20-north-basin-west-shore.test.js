'use strict';
// Covers: the North Basin's West Shore (NORTH_BASIN_W_MAP) -- the west bank of
// the reservoir, directly north of the Silt Flats (NORTH_BASIN_SW_MAP). This
// map was fleshed out from an earlier "Badlands" skeleton in this pass:
//   - its south link to the Silt Flats was converted from the old
//     NORTH_BASIN_W_EXIT/ENTRANCE point-tile to an OPEN EDGE_TRANSITIONS
//     crossing (cols 1-10, x preserved), the same conversion the C/SW links
//     already had;
//   - its eastern reservoir shore is drawn UNEVEN (the water's edge ripples
//     between cols ~11-14) rather than as a straight vertical wall;
//   - a fisher's hut (the shared TRAPPER_HUT tile) sits near the eastern shore.
// It still shares the Silt Flats' enemy pool (user request), not a harsher
// tier of its own.
//
//   1. Walking north off NORTH_BASIN_SW_MAP's open north edge really enters
//      NORTH_BASIN_W_MAP via the EDGE_TRANSITIONS system, with x preserved.
//   2. Walking south off NORTH_BASIN_W_MAP's open south edge really returns
//      to NORTH_BASIN_SW_MAP, with x preserved.
//   3. Save/load round-trips correctly while standing on the map.
//   4. Only the south edge is a real crossing; north/east are plain
//      impassable border, and west (col 0) is plain impassable border too
//      (the future N/W neighbours aren't built -- kept as a plain TREE line
//      so they're trivially convertible later).
//   5. This map has GRASS (same encounter mechanism as the Silt Flats), and a
//      real encounter draws from the *same* NORTH_BASIN_ENEMY_TEMPLATES pool.
//   6. The fisher's hut (TRAPPER_HUT tile) is present exactly once, impassable,
//      and doesn't seal off any part of the map.
//   7. The eastern reservoir shore is uneven -- the water's western edge is
//      not a single straight column.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'North Basin: NORTH_BASIN_SW_MAP <-> NORTH_BASIN_W_MAP open-edge crossing, save/load, shared enemies',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // debugMode suppresses random encounters -- this is a movement/transition
    // test, and the crossing paths are REEDS/GRASS (encounter-eligible), so
    // without this an unlucky roll during a held-key walk could start combat
    // mid-crossing and fail nondeterministically.
    g.run('debugMode = true; forceLegacyRegionalView = true; /* legacy inset-crossing tests */');

    const [southMin, southMax] = g.run("EDGE_TRANSITIONS['NORTH_BASIN_W_MAP']").south[0].sourceRange;
    const crossCol = southMin; // any column in the open range works; use the first

    // ── 1. Real movement north across the Silt Flats' open north edge ───────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_SW_MAP;
      player.x = ${crossCol}.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    assert.equal(g.run('activeMap === NORTH_BASIN_SW_MAP'), true, 'precondition');
    g.hold('ArrowUp');
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_W_MAP');
    }
    g.release('ArrowUp');
    assert.ok(crossed, 'walking north off the Silt Flats open edge should enter NORTH_BASIN_W_MAP within 40 frames');
    assert.equal(g.run('inDungeon'), false);
    assert.equal(g.run('inTown'), false);
    // Landed just inside the West Shore's south edge, x preserved.
    assert.equal(g.run('player.y'), 13.5 * 32, 'should land one tile inside the West Shore\'s south border');
    assert.equal(g.run('player.x'), (crossCol + 0.5) * 32, 'x should be preserved exactly across the N/S edge');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'the landing spot must be walkable');

    // ── 2. Real movement south back to the Silt Flats ───────────────────────
    g.run(`
      player.x = ${crossCol}.5*TILE; player.y = 13.5*TILE; player.facing = 'down';
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    g.hold('ArrowDown');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_SW_MAP');
    }
    g.release('ArrowDown');
    assert.ok(crossed, 'walking south off the West Shore open edge should return to NORTH_BASIN_SW_MAP within 40 frames');
    assert.equal(g.run('player.y'), 1.5 * 32, 'should land one tile inside the Silt Flats\' north border');
    assert.equal(g.run('player.x'), (crossCol + 0.5) * 32, 'x should be preserved exactly');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'the landing spot must be walkable');

    // Every column across the full open range preserves x and lands walkable.
    for (let col = southMin; col <= southMax; col++) {
      g.run(`
        inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_SW_MAP;
        player.x = ${col}.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
        combat.cooldown = 0;
      ; __reconcileCanonicalForTest();`);
      g.hold('ArrowUp');
      crossed = false;
      for (let i = 0; i < 40 && !crossed; i++) {
        g.frames(1);
        crossed = g.run('activeMap === NORTH_BASIN_W_MAP');
      }
      g.release('ArrowUp');
      assert.ok(crossed, `crossing north at col ${col} should transition`);
      assert.equal(g.run('player.x'), (col + 0.5) * 32, `col ${col} should be preserved exactly, not clamped`);
      assert.equal(g.run('canWalk(player.x, player.y)'), true, `col ${col} must land somewhere walkable`);
    }

    // ── 3. Save/load round-trip while on the new map ────────────────────────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_W_MAP;
      player.x = 5.5*TILE; player.y = 9.5*TILE; player.facing = 'down';
      __reconcileCanonicalForTest(); saveGame();
    `);
    g.run(`
      activeMap = MAP; player.x = 1*TILE; player.y = 1*TILE;
      loadGame();
    ; __reconcileCanonicalForTest();`);
    assert.equal(g.run('activeMap === NORTH_BASIN_W_MAP'), true, 'activeMap should restore to NORTH_BASIN_W_MAP');
    assert.equal(g.run('player.x'), 5.5 * 32);
    assert.equal(g.run('player.y'), 9.5 * 32);

    // ── 4. Edges: south and north are real crossings ────────────────────────
    const map = g.run('NORTH_BASIN_W_MAP');
    const TREE = g.run('TREE');
    const WATER = g.run('WATER');
    const WALKABLE = g.run('WALKABLE');
    // North edge: was plain border until the Upper Reach was built; now an
    // open EDGE_TRANSITIONS crossing on cols 1-10 (mirrors the south edge),
    // border elsewhere. The full crossing behaviour is exercised by the
    // Upper Reach's own test (35) -- here we just pin the border shape.
    for (let c = 0; c < map[0].length; c++) {
      if (c >= 1 && c <= 10) {
        assert.ok(WALKABLE[map[0][c]], `north edge col ${c} is inside the EDGE_TRANSITIONS range and should be walkable`);
      } else {
        assert.ok(map[0][c] === TREE || map[0][c] === WATER, `north edge col ${c} (outside the range) should be impassable border (TREE, or WATER at the NE reservoir corner)`);
      }
    }
    const westSegs = g.run("EDGE_TRANSITIONS['NORTH_BASIN_W_MAP']").west;
    const inWestSeam = (r) => westSegs.some((seg) => r >= seg.sourceRange[0] && r <= seg.sourceRange[1]);
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      // East edge IS the reservoir — now drawn as impassable WATER rather than a
      // TREE line (rows 1-13); the N/S corners of the column stay TREE.
      assert.ok(row[15] === TREE || row[15] === WATER, 'east edge (the reservoir itself) should be impassable border (WATER, or TREE at the corners)');
      // West edge now opens onto the West Mire across two marsh crossings (rows
      // 3-6 and 9-11): walkable there, plain TREE border everywhere else.
      if (inWestSeam(r)) assert.ok(WALKABLE[row[0]], `west edge row ${r} (in a West Mire crossing) is walkable`);
      else assert.equal(row[0], TREE, `west edge row ${r} (outside the crossings) is plain TREE border`);
    }
    // South edge: walkable within the EDGE_TRANSITIONS range, border elsewhere.
    for (let c = 0; c < map[14].length; c++) {
      if (c >= southMin && c <= southMax) {
        assert.ok(WALKABLE[map[14][c]], `south edge col ${c} is inside the EDGE_TRANSITIONS range and should be walkable`);
      } else {
        assert.ok(map[14][c] === TREE || map[14][c] === WATER, `south edge col ${c} (outside the range) should be impassable border (TREE, or WATER at the SE reservoir corner)`);
      }
    }

    // ── 5. Encounters draw from the SAME pool as the Silt Flats ─────────────
    const GRASS = g.run('GRASS');
    assert.ok(map.some(row => row.includes(GRASS)), 'NORTH_BASIN_W_MAP should have some GRASS -- it shares the Silt Flats’ encounter mechanism');
    const validNames = new Set(g.run('NORTH_BASIN_ENEMY_TEMPLATES').map(t => t.name));
    validNames.add('23'); // pre-existing, unrelated 1-in-256 universal secret encounter -- see test 19
    validNames.add('Swamp Donkey'); // ~1/16 hard-hitting override on every North Basin outdoor square
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_W_MAP;
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    for (let i = 0; i < 30; i++) {
      g.run('startCombat();');
      const name = g.run('combat.enemy ? combat.enemy.name : null');
      assert.ok(validNames.has(name), `encounter ${i} produced "${name}", not one of NORTH_BASIN_ENEMY_TEMPLATES (or the universal secret encounter)`);
      g.run('combat.active = false; combat.enemy = null;');
    }

    // ── 6. The fisher's hut is present exactly once and doesn't break connectivity ─
    const TRAPPER_HUT = g.run('TRAPPER_HUT');
    const hutTiles = map.flat().filter(t => t === TRAPPER_HUT).length;
    assert.equal(hutTiles, 1, 'expected exactly one hut tile (TRAPPER_HUT) on NORTH_BASIN_W_MAP');
    assert.equal(WALKABLE[TRAPPER_HUT], false, 'the hut should be impassable (exterior-only, no interior in this pass)');

    const rows = map.length, cols = map[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    // Flood from the open south edge (the one guaranteed entry to the region).
    const stack = [];
    for (let c = southMin; c <= southMax; c++) {
      if (WALKABLE[map[14][c]]) { visited[14][c] = true; stack.push([14, c]); }
    }
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (visited[nr][nc]) continue;
        if (!WALKABLE[map[nr][nc]]) continue;
        visited[nr][nc] = true;
        stack.push([nr, nc]);
      }
    }
    let unreachable = 0, totalWalkable = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (WALKABLE[map[r][c]]) { totalWalkable++; if (!visited[r][c]) unreachable++; }
    }
    assert.equal(unreachable, 0, `NORTH_BASIN_W_MAP has ${unreachable} unreachable walkable tile(s) out of ${totalWalkable} -- the hut or shoreline may be sealing off a pocket`);

    // ── 7. The eastern reservoir shore is uneven (not a straight water wall) ─
    // (WATER const already declared above for the border check.)
    const waterStartCols = [];
    for (let r = 0; r < rows; r++) {
      const i = map[r].indexOf(WATER);
      if (i !== -1) waterStartCols.push(i);
    }
    assert.ok(waterStartCols.length > 0, 'the reservoir (WATER) should be present on the east side');
    const distinctStarts = new Set(waterStartCols);
    assert.ok(distinctStarts.size > 1, `the water's western edge should be uneven (varying start column), got columns: ${[...distinctStarts].join(',')}`);

    g.renderFrame();
  },
};
