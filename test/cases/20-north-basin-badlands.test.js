'use strict';
// Covers: the North Basin's Badlands (NORTH_BASIN_W_MAP) -- north of the
// Silt Flats (reached by going off the road, same as the Silt Flats
// themselves were reached off NORTH_BASIN_S_MAP's road). The user asked
// this map to share the Silt Flats' enemies rather than get a harsher tier
// of its own, so this test checks that sharing is real (both maps route to
// the same pool, not two separately-defined pools that happen to match).
//
//   1. Walking north off NORTH_BASIN_SW_MAP's row 0 col 4
//      (NORTH_BASIN_W_EXIT) really enters NORTH_BASIN_W_MAP, via real
//      held-key movement across the tile boundary.
//   2. Walking south off NORTH_BASIN_W_MAP's row 14 col 4
//      (NORTH_BASIN_W_ENTRANCE) really returns to NORTH_BASIN_SW_MAP.
//   3. Save/load round-trips correctly while standing on the new map.
//   4. The one real exit is south; north/east/west are plain impassable
//      border (NW, the reservoir, and W's own west neighbour aren't built).
//   5. This map has GRASS (same encounter mechanism as the Silt Flats), and
//      a real encounter rolled on it draws from the *same*
//      NORTH_BASIN_ENEMY_TEMPLATES pool as NORTH_BASIN_SW_MAP -- not a
//      second, separately-named pool that happens to contain the same
//      enemies, and not the generic/FAR pools either.
//   6. The trapper's hut (TRAPPER_HUT) is present, impassable, and doesn't
//      seal off any part of the map (the full-map connectivity check below
//      would catch that regardless, but this pins the tile's presence
//      specifically, since "make a trapper's hut somewhere in the badlands"
//      was a specific, named requirement).
//   7. The shoreline ridge (a solid line of EXPOSED_STONE the full height of
//      the map, in column 1) is present, matching the requested "line of
//      higher ground along the western edge."

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'North Basin: NORTH_BASIN_SW_MAP <-> NORTH_BASIN_W_MAP crossing, save/load, shared enemies',
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

    // ── 1. Real movement north across NORTH_BASIN_SW_MAP's row 0 col 4 ──────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_SW_MAP;
      player.x = 4.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
      combat.cooldown = 0;
    `);
    assert.equal(g.run('activeMap === NORTH_BASIN_SW_MAP'), true, 'precondition');
    g.hold('ArrowUp');
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_W_MAP');
    }
    g.release('ArrowUp');
    assert.ok(crossed, 'walking north off NORTH_BASIN_SW_MAP row 0 col 4 should enter NORTH_BASIN_W_MAP within 40 frames');
    assert.equal(g.run('inDungeon'), false);
    assert.equal(g.run('inTown'), false);
    // Landed just inside the Badlands' south edge, x preserved (col 4).
    assert.equal(g.run('player.y'), 13.5 * 32);
    assert.ok(Math.abs(g.run('player.x') - 4.5 * 32) < 32, 'player.x should be preserved (still near col 4)');

    // ── 2. Real movement south back across NORTH_BASIN_W_MAP's row 14 col 4 ─
    g.run(`
      player.x = 4.5*TILE; player.y = 13.5*TILE; player.facing = 'down';
      combat.cooldown = 0;
    `);
    g.hold('ArrowDown');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_SW_MAP');
    }
    g.release('ArrowDown');
    assert.ok(crossed, 'walking south off NORTH_BASIN_W_MAP row 14 col 4 should return to NORTH_BASIN_SW_MAP within 40 frames');
    assert.equal(g.run('player.y'), 1.5 * 32);
    assert.ok(Math.abs(g.run('player.x') - 4.5 * 32) < 32, 'player.x should be preserved (still near col 4)');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'the landing spot must be walkable');

    // ── 3. Save/load round-trip while on the new map ────────────────────────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_W_MAP;
      player.x = 9.5*TILE; player.y = 9.5*TILE; player.facing = 'down';
      saveGame();
    `);
    g.run(`
      activeMap = MAP; player.x = 1*TILE; player.y = 1*TILE;
      loadGame();
    `);
    assert.equal(g.run('activeMap === NORTH_BASIN_W_MAP'), true, 'activeMap should restore to NORTH_BASIN_W_MAP');
    assert.equal(g.run('player.x'), 9.5 * 32);
    assert.equal(g.run('player.y'), 9.5 * 32);

    // ── 4. Edges: only south is real ─────────────────────────────────────────
    const map = g.run('NORTH_BASIN_W_MAP');
    const TREE = g.run('TREE');
    assert.ok(map[0].every(t => t === TREE), 'north edge (future NW neighbour) should be plain impassable border');
    for (const row of map) {
      assert.equal(row[15], TREE, 'east edge (the reservoir itself) should be plain impassable border');
    }
    const NORTH_BASIN_W_ENTRANCE = g.run('NORTH_BASIN_W_ENTRANCE');
    for (let c = 0; c < map[14].length; c++) {
      if (c === 4) {
        assert.equal(map[14][c], NORTH_BASIN_W_ENTRANCE, 'the one real exit (south, col 4) should be the entrance tile');
      } else {
        assert.equal(map[14][c], TREE, `south edge col ${c} (not the real entrance) should be plain impassable border`);
      }
    }

    // ── 5. Encounters draw from the SAME pool as the Silt Flats ─────────────
    const GRASS = g.run('GRASS');
    assert.ok(map.some(row => row.includes(GRASS)), 'NORTH_BASIN_W_MAP should have some GRASS -- it shares the Silt Flats’ encounter mechanism');
    const validNames = new Set(g.run('NORTH_BASIN_ENEMY_TEMPLATES').map(t => t.name));
    validNames.add('23'); // pre-existing, unrelated 1-in-256 universal secret encounter -- see test 19
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_W_MAP;
      combat.cooldown = 0;
    `);
    for (let i = 0; i < 30; i++) {
      g.run('startCombat();');
      const name = g.run('combat.enemy ? combat.enemy.name : null');
      assert.ok(validNames.has(name), `encounter ${i} produced "${name}", not one of NORTH_BASIN_ENEMY_TEMPLATES (or the universal secret encounter)`);
      g.run('combat.active = false; combat.enemy = null;');
    }

    // ── 6. The trapper's hut is present and doesn't break connectivity ──────
    const TRAPPER_HUT = g.run('TRAPPER_HUT');
    const hutTiles = map.flat().filter(t => t === TRAPPER_HUT).length;
    assert.equal(hutTiles, 1, 'expected exactly one TRAPPER_HUT tile on NORTH_BASIN_W_MAP');
    const WALKABLE = g.run('WALKABLE');
    assert.equal(WALKABLE[TRAPPER_HUT], false, 'the hut should be impassable (no interior in this pass)');

    const rows = map.length, cols = map[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const stack = [[14, 4]];
    visited[14][4] = true;
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
    assert.equal(unreachable, 0, `NORTH_BASIN_W_MAP has ${unreachable} unreachable walkable tile(s) out of ${totalWalkable} -- the hut or shoreline ridge may be sealing off a pocket`);

    // ── 7. The shoreline ridge: a solid EXPOSED_STONE line down column 1 ────
    const EXPOSED_STONE = g.run('EXPOSED_STONE');
    for (let r = 1; r <= 13; r++) {
      assert.equal(map[r][1], EXPOSED_STONE, `expected the shoreline ridge (EXPOSED_STONE) at row ${r} col 1`);
    }

    g.renderFrame();
  },
};
