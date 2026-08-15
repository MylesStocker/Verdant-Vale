'use strict';
// Covers: the new generic EDGE_TRANSITIONS system (world-transitions.js),
// proven via the three real North Basin adjacencies converted to use it in
// this pass: NORTH_BASIN_S_MAP (South Approach) <-> NORTH_BASIN_C_MAP
// (Reservoir), north/south; and NORTH_BASIN_S_MAP <-> NORTH_BASIN_SW_MAP
// (Silt Flats), east/west. This is a SEPARATE, additive system from the
// existing point-tile transitions (town/dungeon entrances, bridge gate,
// stairs, secret passages, etc.), which are untouched and still work via
// their own tile IDs -- see item 8 below.
//
//   1. South Approach's north edge transitions to the Reservoir.
//   2. The Reservoir's south edge transitions back to South Approach.
//   3. Player x-position is preserved across the N/S transition, including
//      at both extreme columns of the open range (1 and 14) -- not just
//      preserved "when convenient." South Approach's north edge and the
//      Reservoir's south edge are the SAME width (cols 1-14 on both sides)
//      specifically so ordinary crossings never clamp; clamping itself is
//      still proven separately (see the note below) via a temporarily
//      mismatched test-only range, not by shipping a real mismatch that a
//      player could stumble into.
//   4. South Approach's west edge transitions to the Silt Flats.
//   5. The Silt Flats' east edge transitions back to South Approach.
//   6. Player y-position is preserved across the E/W transition, including
//      at both extreme rows of the open range (9 and 11) -- same reasoning
//      as x-preservation above; both edges are rows 9-11 on both sides.
//   7. A blocked/nonexistent edge does not crash and does not transition --
//      the "no EDGE_TRANSITIONS entry at all" case (South Approach's own
//      east edge), the "entry exists but its condition fails" case, and a
//      genuine clamping case (source position outside the target's
//      narrower range) -- the last two via temporarily-injected test
//      segments, added and removed within this test so they never touch
//      the shipped North Basin config.
//   8. Existing special-tile transitions still work: a representative
//      point-tile transition unrelated to this conversion (MAP <-> MAP2)
//      still functions normally.
//
// This test file replaces an earlier version that asserted clamping
// against the *shipped* North Basin ranges (Reservoir's south edge was
// deliberately 2 columns narrower than South Approach's north edge, and
// the Silt Flats' east edge was a row narrower than South Approach's west
// edge). That mismatch was a real, reachable bug, not a demo: a player
// crossing at the wide side's extreme columns/rows got clamped onto the
// narrow side, and worse, one of the "preserved" landing tiles (South
// Approach row 1, col 13) turned out to be WATER -- a soft-lock a player
// actually hit. Every landing row/column is now walkable across its FULL
// range (verified in this test, not just spot-checked), and every
// North-Basin range pair is symmetric so ordinary play never clamps.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'EDGE_TRANSITIONS: generic edge-based system (North Basin S<->C, S<->SW proof of concept)',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // debugMode suppresses random encounters for this whole test -- this is
    // purely a movement/coordinate-preservation test, not an encounter
    // test, and North Basin's crossing paths are heavily REEDS-covered
    // (REEDS became encounter-eligible in plain outdoor context, same as
    // GRASS -- see tiles.js's TILE_PROPERTIES entry), so without this an
    // unlucky Math.random() roll during any of the held-key multi-frame
    // walks below could start real combat mid-crossing and fail the
    // "should still transition within 40 frames" assertions nondeterministically.
    g.run('debugMode = true;');

    // ── 1 & 3a. North edge: South Approach -> Reservoir, position preserved ─
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_S_MAP;
      player.x = 7.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    assert.equal(g.run('activeMap === NORTH_BASIN_S_MAP'), true, 'precondition');
    g.hold('ArrowUp');
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_C_MAP');
    }
    g.release('ArrowUp');
    assert.ok(crossed, 'walking north off South Approach (col 7, within range) should enter the Reservoir within 40 frames');
    assert.equal(g.run('player.facing'), 'up', 'facing should continue in the direction of travel');
    assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'), 'encounter cooldown should reset like any other map transition');
    // col 7 is within both the source range (1-14) and the target range
    // (2-13), so it should be preserved exactly, not clamped.
    assert.equal(g.run('player.x'), 7.5 * 32, 'x should be preserved exactly (col 7 is within both ranges)');
    assert.equal(g.run('player.y'), 13.5 * 32, 'should land one tile inside the Reservoir\'s south border');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'the landing spot must be walkable');

    // ── 2. South edge: Reservoir -> South Approach ──────────────────────────
    g.run(`
      player.x = 7.5*TILE; player.y = 13.5*TILE; player.facing = 'down';
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    g.hold('ArrowDown');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_S_MAP');
    }
    g.release('ArrowDown');
    assert.ok(crossed, 'walking south off the Reservoir (col 7) should return to South Approach within 40 frames');
    assert.equal(g.run('player.facing'), 'down');
    assert.equal(g.run('player.x'), 7.5 * 32, 'x preserved');
    assert.equal(g.run('player.y'), 1.5 * 32, 'should land one tile inside South Approach\'s north border');
    assert.equal(g.run('canWalk(player.x, player.y)'), true);

    // ── 3b. N/S full-range preservation: both extreme source columns ───────
    // South Approach's north range and the Reservoir's south range are both
    // exactly [1, 14] -- so crossing at either extreme (col 1 or col 14)
    // must preserve x exactly, not clamp, and must land somewhere walkable
    // (this is the specific scenario that used to soft-lock: col 13 landed
    // on water when the ranges didn't match).
    for (const col of [1, 14]) {
      g.run(`
        inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_S_MAP;
        player.x = ${col}.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
        combat.cooldown = 0;
      ; __reconcileCanonicalForTest();`);
      g.hold('ArrowUp');
      crossed = false;
      for (let i = 0; i < 40 && !crossed; i++) {
        g.frames(1);
        crossed = g.run('activeMap === NORTH_BASIN_C_MAP');
      }
      g.release('ArrowUp');
      assert.ok(crossed, `crossing at the extreme source col ${col} should still transition`);
      assert.equal(g.run('player.x'), (col + 0.5) * 32, `col ${col} should be preserved exactly, not clamped`);
      assert.equal(g.run('canWalk(player.x, player.y)'), true, `the landing spot at col ${col} must be walkable`);
    }
    // And every column along the full range, not just the two extremes --
    // this is the check that would have caught the col-13-is-water bug.
    for (let col = 1; col <= 14; col++) {
      g.run(`
        activeMap = NORTH_BASIN_S_MAP;
        player.x = ${col}.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
        combat.cooldown = 0;
      ; __reconcileCanonicalForTest();`);
      g.hold('ArrowUp');
      crossed = false;
      for (let i = 0; i < 40 && !crossed; i++) {
        g.frames(1);
        crossed = g.run('activeMap === NORTH_BASIN_C_MAP');
      }
      g.release('ArrowUp');
      assert.ok(crossed, `crossing at col ${col} should transition`);
      assert.equal(g.run('player.x'), (col + 0.5) * 32, `col ${col} should be preserved exactly`);
      assert.equal(g.run('canWalk(player.x, player.y)'), true, `col ${col} must land somewhere walkable, not a soft-lock tile`);
    }

    // ── 4. West edge: South Approach -> Silt Flats ──────────────────────────
    // Start directly on the open col-0 edge tile itself (row 9 col 1 is
    // WATER on this map -- the open strip at col 0 connects to the rest of
    // the map via row 10/11, not straight across row 9 -- so this test
    // starts already standing on the crossing point rather than trying to
    // walk in from the interior along row 9).
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_S_MAP;
      player.x = 0.5*TILE; player.y = 9.5*TILE; player.facing = 'left';
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    g.hold('ArrowLeft');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_SW_MAP');
    }
    g.release('ArrowLeft');
    assert.ok(crossed, 'walking west off South Approach (row 9, within range) should enter the Silt Flats within 40 frames');
    assert.equal(g.run('player.facing'), 'left');
    assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
    // row 9 is within both the source range (9-11) and the narrower target
    // range (9-10), so it should be preserved exactly.
    assert.equal(g.run('player.y'), 9.5 * 32, 'y should be preserved exactly (row 9 is within both ranges)');
    assert.equal(g.run('player.x'), 14.5 * 32, 'should land one tile inside the Silt Flats\' east border');
    assert.equal(g.run('canWalk(player.x, player.y)'), true);

    // ── 5. East edge: Silt Flats -> South Approach ──────────────────────────
    g.run(`
      player.x = 14.5*TILE; player.y = 9.5*TILE; player.facing = 'right';
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    g.hold('ArrowRight');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_S_MAP');
    }
    g.release('ArrowRight');
    assert.ok(crossed, 'walking east off the Silt Flats (row 9) should return to South Approach within 40 frames');
    assert.equal(g.run('player.facing'), 'right');
    assert.equal(g.run('player.y'), 9.5 * 32, 'y preserved');
    assert.equal(g.run('player.x'), 1.5 * 32, 'should land one tile inside South Approach\'s west border');
    assert.equal(g.run('canWalk(player.x, player.y)'), true);

    // ── 6. E/W full-range preservation: every source row, not just spot checks ─
    // South Approach's west range and the Silt Flats' east range are both
    // exactly [9, 11] -- crossing at any row in that range must preserve y
    // exactly and land somewhere walkable.
    for (let row = 9; row <= 11; row++) {
      g.run(`
        activeMap = NORTH_BASIN_S_MAP;
        player.x = 0.5*TILE; player.y = ${row}.5*TILE; player.facing = 'left';
        combat.cooldown = 0;
      ; __reconcileCanonicalForTest();`);
      g.hold('ArrowLeft');
      crossed = false;
      for (let i = 0; i < 40 && !crossed; i++) {
        g.frames(1);
        crossed = g.run('activeMap === NORTH_BASIN_SW_MAP');
      }
      g.release('ArrowLeft');
      assert.ok(crossed, `crossing at row ${row} should transition`);
      assert.equal(g.run('player.y'), (row + 0.5) * 32, `row ${row} should be preserved exactly, not clamped`);
      assert.equal(g.run('canWalk(player.x, player.y)'), true, `row ${row} must land somewhere walkable, not a soft-lock tile`);
    }

    // ── 7a. Nonexistent edge: no EDGE_TRANSITIONS entry at all ──────────────
    // South Approach's own east edge has no configured link in either
    // direction. Calling tryEdgeTransition() directly for it must return
    // false, not throw, and must not touch activeMap/player position --
    // this is the code path movement.js's interception falls back to
    // whenever a map has no entry for a direction (true of almost every map
    // in the game, since EDGE_TRANSITIONS only has three entries so far).
    g.run(`
      activeMap = NORTH_BASIN_S_MAP;
      player.x = 7.5*TILE; player.y = 5.5*TILE;
    ; __reconcileCanonicalForTest();`);
    const xBefore = g.run('player.x'), yBefore = g.run('player.y');
    const eastHandled = g.run("tryEdgeTransition('east')");
    assert.equal(eastHandled, false, 'a direction with no EDGE_TRANSITIONS entry should report "not transitioned"');
    assert.equal(g.run('activeMap === NORTH_BASIN_S_MAP'), true, 'no transition should have happened -- still on the same map');
    assert.equal(g.run('player.x'), xBefore, 'player position must be untouched');
    assert.equal(g.run('player.y'), yBefore, 'player position must be untouched');

    // Same idea end-to-end with real held-key movement: since the border
    // (col 15) is plain TREE on this edge, the player physically can't ever
    // reach it to begin with -- confirming that the normal canWalk()-gated
    // wall-blocking is still exactly what stops them, with or without this
    // new system, and that walking at the border for a while doesn't crash
    // or push the player out of bounds.
    g.run(`player.x = 14.5*TILE; player.y = 5.5*TILE; player.facing = 'right'; combat.cooldown = 0;; __reconcileCanonicalForTest();`);
    g.hold('ArrowRight');
    for (let i = 0; i < 60; i++) g.frames(1);
    g.release('ArrowRight');
    assert.equal(g.run('activeMap === NORTH_BASIN_S_MAP'), true, 'no transition should have happened -- still on the same map');
    assert.ok(g.run('player.x') < 15 * 32, 'player should not have been pushed out of bounds');
    assert.ok(g.run('player.x') >= 0, 'player x should never go negative');

    // ── 7b. Blocked edge: entry exists but its condition fails ──────────────
    // Temporarily REPLACE South Approach's real 'north' segments (the exact
    // shipped value is reconstructed and restored at the end of 7c below)
    // with a test-only one, so the condition/blockedText code path is
    // exercised through the real 'north' direction key -- not a fake key
    // name, which would make tryEdgeTransition() read the wrong axis (it
    // decides x vs y by checking whether direction is literally
    // 'north'/'south').
    g.run(`
      EDGE_TRANSITIONS['NORTH_BASIN_S_MAP'].north = [
        { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'south', sourceRange: [1, 14],
          condition: () => false, blockedText: 'TEST_BLOCKED_MESSAGE' },
      ];
    `);
    g.run(`
      activeMap = NORTH_BASIN_S_MAP;
      player.x = 7.5*TILE; player.y = 1.5*TILE;
      worldToast = ''; worldToastTimer = 0;
    ; __reconcileCanonicalForTest();`);
    const handled = g.run("tryEdgeTransition('north')");
    assert.equal(handled, false, 'a segment whose condition fails should report "not transitioned"');
    assert.equal(g.run('activeMap === NORTH_BASIN_S_MAP'), true, 'blocked transition must not change the map');
    assert.equal(g.run('worldToast'), 'TEST_BLOCKED_MESSAGE', 'blockedText should be shown via showWorldToast()');

    // ── 7c. Clamping mechanism: a temporarily mismatched test-only range ────
    // The shipped North Basin ranges are all symmetric now (see the note at
    // the top of this file), so nothing in normal play should ever clamp.
    // The clamping *mechanism* itself still needs proving, so this replaces
    // the real 'north' segments with a test-only one whose target range is
    // narrower than its source range -- exactly the shape of bug that used
    // to ship -- confirms clamping produces a walkable, in-range landing
    // tile at both extremes, then restores the real shipped segment.
    g.run(`
      EDGE_TRANSITIONS['NORTH_BASIN_S_MAP'].north = [
        { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'south', sourceRange: [1, 14], targetRange: [5, 8] },
      ];
    `);
    g.run(`
      activeMap = NORTH_BASIN_S_MAP;
      player.x = 1.5*TILE; player.y = 1.5*TILE;
    ; __reconcileCanonicalForTest();`);
    const clampHandled = g.run("tryEdgeTransition('north')");
    assert.equal(clampHandled, true, 'a segment with a narrower target range should still transition (clamped, not blocked)');
    assert.equal(g.run('activeMap === NORTH_BASIN_C_MAP'), true);
    assert.equal(g.run('player.x'), 5.5 * 32, 'col 1 (below the target range) should clamp up to the target range\'s minimum, col 5');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'the clamped landing spot must be walkable');

    g.run(`
      activeMap = NORTH_BASIN_S_MAP;
      player.x = 14.5*TILE; player.y = 1.5*TILE;
    ; __reconcileCanonicalForTest();`);
    const clampHandled2 = g.run("tryEdgeTransition('north')");
    assert.equal(clampHandled2, true);
    assert.equal(g.run('player.x'), 8.5 * 32, 'col 14 (above the target range) should clamp down to the target range\'s maximum, col 8');
    assert.equal(g.run('canWalk(player.x, player.y)'), true);

    // Restore the real, shipped 'north' segment (matching world-transitions.js
    // exactly) so nothing else in this suite is affected by the test-only
    // overrides above.
    g.run(`
      EDGE_TRANSITIONS['NORTH_BASIN_S_MAP'].north = [
        { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'south', sourceRange: [1, 14] },
      ];
    `);

    // ── 8. Existing special-tile transitions still work (unaffected) ───────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = MAP;
      player.x = 14.5*TILE; player.y = 4.5*TILE; player.facing = 'right';
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    g.hold('ArrowRight');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === MAP2');
    }
    g.release('ArrowRight');
    assert.ok(crossed, 'the existing MAP2_EXIT point-tile transition (MAP -> MAP2) should still work unmodified');

    g.renderFrame();
  },
};
