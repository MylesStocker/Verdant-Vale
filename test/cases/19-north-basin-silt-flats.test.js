'use strict';
// Covers: the North Basin's Silt Flats (NORTH_BASIN_SW_MAP) -- the region's
// first real encounter map, southwest of NORTH_BASIN_S_MAP (reached by going
// off the maintained road, not by continuing along it, unlike the
// north/centre crossings). Unlike the two earlier North Basin maps, this one
// is deliberately NOT a safe skeleton map: it has GRASS and its own enemy
// pool (NORTH_BASIN_ENEMY_TEMPLATES), so this test also has to verify the
// combat wiring, not just the crossing.
//
//   1. Walking west off NORTH_BASIN_S_MAP's row 9-11 west edge really
//      enters NORTH_BASIN_SW_MAP, via real held-key movement across the
//      tile boundary. This crossing is now handled by the generic
//      EDGE_TRANSITIONS system rather than NORTH_BASIN_SW_EXIT/ENTRANCE
//      point-tiles (see test/cases/21-edge-transitions.test.js for the
//      dedicated, thorough coverage of that system, including coordinate
//      clamping); this test just confirms the crossing still works end to
//      end after the conversion. Note the landing column on the Silt Flats
//      side is now col 14 (the standard "one tile inside the border"
//      convention used by every other transition in the codebase, e.g.
//      exitMap2's col 14.5) rather than the old point-tile code's col 13 --
//      a small, incidental fix that fell out of switching to the shared
//      generic formula.
//   2. Walking east off NORTH_BASIN_SW_MAP's row 9-11 east edge really
//      returns to NORTH_BASIN_S_MAP (widened from an earlier 9-10 to match
//      NORTH_BASIN_S_MAP's own west edge exactly -- see
//      21-edge-transitions.test.js's header note on why the two sides'
//      ranges now always match rather than being deliberately narrower on
//      one side).
//   3. Save/load round-trips correctly while standing on the new map.
//   4. The real exits are east (to NORTH_BASIN_S_MAP, via EDGE_TRANSITIONS)
//      and north (row 0 col 4, to the Badlands, still a point-tile -- see
//      20-north-basin-badlands.test.js for that crossing); south/west
//      remain plain impassable border -- SW is a corner of the planned 3×3
//      grid, so those two edges are the true edge of the region (not
//      "future neighbour" placeholders the way the other maps' unbuilt
//      edges are).
//   5. This map *does* have GRASS (the whole point of it), and a real
//      encounter rolled on it draws only from NORTH_BASIN_ENEMY_TEMPLATES
//      (Silt Crab / Mudflat Strider) -- never the generic ENEMY_TEMPLATES
//      pool or the FAR_ENEMY_TEMPLATES pool used by the adjacent fen maps.
//   6. Both new enemies have a working battle sprite dispatch entry (this
//      codebase has a documented history of enemies added without one,
//      which leaves them invisible in combat -- see render-battle.js's
//      drawBattleEnemy()).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'North Basin: NORTH_BASIN_S_MAP <-> NORTH_BASIN_SW_MAP crossing, save/load, encounters',
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

    // ── 1. Real movement west across NORTH_BASIN_S_MAP's row 10 col 0 ──────
    // Start on the reed tile directly adjacent to the exit (row 10 col 1) --
    // row 10 itself has a water gap further east (cols 2-5), so this isn't
    // reachable in a straight line from the main road; the real, winding
    // route there is already covered by NORTH_BASIN_S_MAP's own full-map
    // connectivity check, not this test's job to re-walk.
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_S_MAP;
      player.x = 1.5*TILE; player.y = 10.5*TILE; player.facing = 'left';
      combat.cooldown = 0;
    `);
    assert.equal(g.run('activeMap === NORTH_BASIN_S_MAP'), true, 'precondition');
    g.hold('ArrowLeft');
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_SW_MAP');
    }
    g.release('ArrowLeft');
    assert.ok(crossed, 'walking west off NORTH_BASIN_S_MAP row 10 col 0 should enter NORTH_BASIN_SW_MAP within 120 frames');
    assert.equal(g.run('inDungeon'), false);
    assert.equal(g.run('inTown'), false);
    // Landed just inside the Silt Flats' east edge (col 14 -- the standard
    // one-tile-inside-the-border convention), y preserved (row 10).
    assert.equal(g.run('player.x'), 14.5 * 32);
    assert.ok(Math.abs(g.run('player.y') - 10.5 * 32) < 32, 'player.y should be preserved (still near row 10)');

    // ── 2. Real movement east back across NORTH_BASIN_SW_MAP's row 10 col 15 ─
    g.run(`
      player.x = 14.5*TILE; player.y = 10.5*TILE; player.facing = 'right';
      combat.cooldown = 0;
    `);
    g.hold('ArrowRight');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_S_MAP');
    }
    g.release('ArrowRight');
    assert.ok(crossed, 'walking east off NORTH_BASIN_SW_MAP row 10 col 15 should return to NORTH_BASIN_S_MAP within 40 frames');
    assert.equal(g.run('player.x'), 1.5 * 32);
    assert.ok(Math.abs(g.run('player.y') - 10.5 * 32) < 32, 'player.y should be preserved (still near row 10)');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'the landing spot must be walkable');

    // ── 3. Save/load round-trip while on the new map ────────────────────────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_SW_MAP;
      player.x = 7.5*TILE; player.y = 5.5*TILE; player.facing = 'down';
      saveGame();
    `);
    g.run(`
      activeMap = MAP; player.x = 1*TILE; player.y = 1*TILE;
      loadGame();
    `);
    assert.equal(g.run('activeMap === NORTH_BASIN_SW_MAP'), true, 'activeMap should restore to NORTH_BASIN_SW_MAP');
    assert.equal(g.run('player.x'), 7.5 * 32);
    assert.equal(g.run('player.y'), 5.5 * 32);

    // ── 4. Edges: east and north are real open edges; south/west are the true region edge ─
    const map = g.run('NORTH_BASIN_SW_MAP');
    const TREE = g.run('TREE');
    const WATER = g.run('WATER');
    const WALKABLE = g.run('WALKABLE');
    // North edge: now an open EDGE_TRANSITIONS crossing to the West Shore
    // within its configured range (cols 1-10), plain impassable border
    // elsewhere (cols 11-14 back onto the reservoir finger). Converted from
    // the old NORTH_BASIN_W_EXIT point-tile in this pass, same way the east
    // and the C/SW links were.
    const [northMin, northMax] = g.run("EDGE_TRANSITIONS['NORTH_BASIN_SW_MAP']").north[0].sourceRange;
    for (let c = 0; c < map[0].length; c++) {
      if (c >= northMin && c <= northMax) {
        assert.ok(WALKABLE[map[0][c]], `north edge col ${c} is inside the EDGE_TRANSITIONS range and should be walkable`);
      } else {
        assert.ok(map[0][c] === TREE || map[0][c] === WATER, `north edge col ${c} (outside the range) should be impassable border (TREE, or WATER at cols 11-13 where the reservoir finger continues off-map)`);
      }
    }
    assert.ok(map[14].every(t => t === TREE), 'south edge should be plain impassable border (true edge of the region)');
    for (let r = 0; r < map.length; r++) {
      assert.equal(map[r][0], TREE, `west edge row ${r} should be plain impassable border (true edge of the region -- the west crossing's exit tile lives on NORTH_BASIN_S_MAP, not here)`);
    }
    // East edge: walkable within the configured EDGE_TRANSITIONS range,
    // plain impassable border everywhere else along it.
    const [eastMin, eastMax] = g.run("EDGE_TRANSITIONS['NORTH_BASIN_SW_MAP']").east[0].sourceRange;
    for (let r = 0; r < map.length; r++) {
      if (r >= eastMin && r <= eastMax) {
        assert.ok(WALKABLE[map[r][15]], `east edge row ${r} is inside the EDGE_TRANSITIONS range and should be walkable`);
      } else {
        assert.equal(map[r][15], TREE, `east edge row ${r} (outside the EDGE_TRANSITIONS range) should be plain impassable border`);
      }
    }

    // ── 5. Encounters draw only from NORTH_BASIN_ENEMY_TEMPLATES ────────────
    // (startCombat() also has an unrelated, pre-existing 1-in-256 chance to
    // override *any* encounter with a special "23" enemy regardless of map --
    // that's real, intentional behaviour, not a pool-selection bug, so it's
    // allowed through here too rather than tripping this assertion.)
    const GRASS = g.run('GRASS');
    assert.ok(map.some(row => row.includes(GRASS)), 'NORTH_BASIN_SW_MAP should have GRASS -- this is the region’s first real encounter map');
    const validNames = new Set(g.run('NORTH_BASIN_ENEMY_TEMPLATES').map(t => t.name));
    validNames.add('23');
    validNames.add('Swamp Donkey'); // ~1/16 hard-hitting override on every North Basin outdoor square
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_SW_MAP;
      combat.cooldown = 0;
    `);
    for (let i = 0; i < 30; i++) {
      g.run('startCombat();');
      const name = g.run('combat.enemy ? combat.enemy.name : null');
      assert.ok(validNames.has(name), `encounter ${i} produced "${name}", not one of NORTH_BASIN_ENEMY_TEMPLATES`);
      g.run('combat.active = false; combat.enemy = null;');
    }

    // ── 6. Both new enemies have a battle sprite dispatch entry ─────────────
    const renderBattleSrc = require('fs').readFileSync(
      require('path').join(__dirname, '..', '..', 'render-battle.js'), 'utf8');
    assert.ok(/n === 'Silt Crab'/.test(renderBattleSrc), 'Silt Crab needs a drawBattleEnemy() dispatch entry or it renders invisible in combat');
    assert.ok(/n === 'Mudflat Strider'/.test(renderBattleSrc), 'Mudflat Strider needs a drawBattleEnemy() dispatch entry or it renders invisible in combat');

    g.renderFrame();
  },
};
