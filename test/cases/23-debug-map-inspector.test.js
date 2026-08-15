'use strict';
// Covers: the developer-only Debug Map Inspector / Warp Tool (state.js's
// debugInspector/warpMenu/DEBUG_MENU_ROW_COUNT, world-transitions.js's
// debugWarpToMap()/debugFindNearestWalkableTile()/
// debugEdgeTransitionSummary()/debugNearbyTransitionInfo(), tiles.js's
// debugTileName(), render-ui.js's drawDebugInspector()/drawWarpMenu(), and
// the extended debug menu / input.js wiring). Entirely additive and
// debug-gated -- nothing here should be reachable from the normal player
// menu, and none of it should affect gameplay when closed.
//
//   1. The debug inspector's underlying data (map id, coordinates, tile
//      info, encounter pool, day, nearby-transition summary) can all be
//      read without throwing, and a full render() with the inspector open
//      doesn't throw either.
//   2. Warping to a valid map and coordinate works: activeMap, player
//      position, facing, and combat.cooldown all update correctly, and no
//      special location flag (inDungeon/inTown/etc) is left set from
//      whatever was active before the warp.
//   3. Warping to an invalid/unknown map id is rejected safely (returns
//      success: false, doesn't touch activeMap/player, doesn't throw).
//   4. Warping to an out-of-bounds coordinate is clamped into range rather
//      than crashing or leaving the player outside the map; warping to an
//      in-bounds but blocked (unwalkable) coordinate lands on the nearest
//      walkable tile instead.
//   5. Normal gameplay (movement, the pause menu) is completely unaffected
//      when the inspector/warp menu are closed -- both are opt-in overlays,
//      not something that intercepts input by default.
//   6. An existing special point-tile transition (MAP <-> MAP2) still works
//      after all of this.
//   7. The EDGE_TRANSITIONS system (North Basin) still works, and its data
//      is correctly summarised by debugEdgeTransitionSummary().

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Debug Map Inspector / Warp Tool: read-only data, warp validation, no interference with normal play',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // debugMode suppresses random encounters. Several steps below hold a
    // direction key across many frames on encounter-eligible ground with
    // combat.cooldown = 0 (the movement check, and the point-tile/edge
    // crossings); without this an unlucky roll could start real combat
    // mid-walk and fail the "menu opens" / "crossed" assertions
    // nondeterministically -- same guard, same reason, as tests 20 and 21.
    g.run('debugMode = true;');

    // ── 1. Inspector data reads cleanly, and a real render() doesn't throw ──
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap = NORTH_BASIN_SW_MAP;
      player.x = 7.5*TILE; player.y = 5.5*TILE; player.facing = 'down';
    ; __reconcileCanonicalForTest();`);
    assert.equal(g.run('mapRegistryId(activeMap)'), 'NORTH_BASIN_SW_MAP');
    assert.equal(g.run('Math.floor(player.x/TILE)'), 7);
    assert.equal(g.run('Math.floor(player.y/TILE)'), 5);
    assert.doesNotThrow(() => g.run('isEncounterEligibleTile(activeMap[5][7])'));
    assert.doesNotThrow(() => g.run('currentEncounterPool()'));
    assert.doesNotThrow(() => g.run('debugTileName(activeMap[5][7])'));
    assert.doesNotThrow(() => g.run('debugNearbyTransitionInfo()'));
    assert.doesNotThrow(() => g.run("debugEdgeTransitionSummary('NORTH_BASIN_SW_MAP')"));
    g.run('debugInspector.open = true;');
    assert.doesNotThrow(() => g.renderFrame(), 'a full render() with the inspector open must not throw');
    g.run('debugInspector.open = false;');

    // ── 2. Warp to a valid map + coordinate ─────────────────────────────────
    g.run(`
      inDungeon = true; dungeonFloor = 3; inTown = false;
      activeMap = MAP; player.x = 1*TILE; player.y = 1*TILE;
    ; __reconcileCanonicalForTest();`);
    const before = g.run('stats.hp'); // sanity: warp must not touch unrelated state
    // col 7, row 12 is confirmed walkable BASIN_MUD on this map (row 7
    // there is open reservoir water) -- picked deliberately so this case
    // demonstrates a clean, un-nudged warp; the nudge-to-nearest-walkable
    // path is covered separately in section 4 below.
    const result = g.run("debugWarpToMap('NORTH_BASIN_C_MAP', 7, 12)");
    assert.equal(result.success, true);
    assert.equal(g.run('mapRegistryId(activeMap)'), 'NORTH_BASIN_C_MAP');
    assert.equal(g.run('player.x'), 7.5 * 32);
    assert.equal(g.run('player.y'), 12.5 * 32);
    assert.equal(g.run('player.facing'), 'down');
    assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
    assert.equal(g.run('stats.hp'), before);
    // The warp must leave a clean state -- no flag left over from being
    // "in the dungeon" before the warp.
    assert.equal(g.run('inDungeon'), false, 'warping away from a dungeon floor must clear inDungeon');
    assert.equal(g.run('inTown'), false);
    assert.equal(g.run('inSluice'), false);
    assert.equal(g.run('inMireVault'), false);
    assert.equal(g.run('canWalk(player.x, player.y)'), true);

    // ── 2b. Warp clears inBasinChamber / inSunkenGallery too ────────────────
    // Regression: debugWarpToMap()'s clean-baseline reset omitted these two
    // special-location flags, so warping out of the unmarked chamber or the
    // Sunken Gallery left currentMapId()/locationName() reporting the wrong
    // place. Set both new flags AND representative older special-location flags
    // true, warp to ordinary MAP, and require every flag cleared. (Fails
    // against the pre-fix implementation, which left the two new flags set.)
    g.run(`
      inBasinChamber = true; inSunkenGallery = true;
      inSluice = true; inMireVault = true; inDungeon = true; inFenBrewery = true;
      activeMap = MAP2; player.x = 3*TILE; player.y = 3*TILE; player.facing = 'up';
    ; __reconcileCanonicalForTest();`);
    const warp2b = g.run("debugWarpToMap('MAP', 5, 7)");
    assert.equal(warp2b.success, true, 'warp to ordinary MAP succeeds');
    assert.equal(g.run('activeMap === MAP'), true, 'activeMap is the ordinary destination');
    assert.equal(g.run('inBasinChamber'), false, 'warp must clear inBasinChamber');
    assert.equal(g.run('inSunkenGallery'), false, 'warp must clear inSunkenGallery');
    assert.equal(g.run('inSluice'), false, 'previously-covered special-location flags stay cleared');
    assert.equal(g.run('inMireVault'), false);
    assert.equal(g.run('inDungeon'), false);
    assert.equal(g.run('inFenBrewery'), false);
    assert.equal(g.run('currentMapId()'), 'overworld', 'currentMapId() agrees with the ordinary Verdant Vale destination');
    assert.equal(g.run('locationName()'), 'Verdant Vale', 'locationName() agrees with the ordinary Verdant Vale destination');
    assert.doesNotThrow(() => g.renderFrame(), 'a render() once after the warp must not throw');

    // ── 3. Warp to an invalid map is rejected safely ────────────────────────
    g.run(`activeMap = MAP2; player.x = 3*TILE; player.y = 3*TILE;; __reconcileCanonicalForTest();`);
    const mapBefore = g.run('mapRegistryId(activeMap)');
    const xBefore = g.run('player.x'), yBefore = g.run('player.y');
    let invalidResult;
    assert.doesNotThrow(() => { invalidResult = g.run("debugWarpToMap('THIS_MAP_DOES_NOT_EXIST', 5, 5)"); });
    assert.equal(invalidResult.success, false);
    assert.equal(g.run('mapRegistryId(activeMap)'), mapBefore, 'an invalid warp must not change activeMap');
    assert.equal(g.run('player.x'), xBefore, 'an invalid warp must not move the player');
    assert.equal(g.run('player.y'), yBefore);

    // ── 4. Out-of-bounds / blocked coordinates are clamped, not crashed ─────
    let oobResult;
    assert.doesNotThrow(() => { oobResult = g.run("debugWarpToMap('MAP2', 9999, -500)"); });
    assert.equal(oobResult.success, true, 'an out-of-bounds coordinate should be clamped and still warp, not fail outright');
    assert.ok(oobResult.col >= 0 && oobResult.col < g.run('COLS'), 'landing column must be in bounds');
    assert.ok(oobResult.row >= 0 && oobResult.row < g.run('ROWS'), 'landing row must be in bounds');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'must never land on an unwalkable tile');
    assert.ok(g.run('player.x') >= 0 && g.run('player.x') < g.run('COLS') * 32);
    assert.ok(g.run('player.y') >= 0 && g.run('player.y') < g.run('ROWS') * 32);

    // Blocked-but-in-bounds coordinate (col 0, row 0 is always TREE border
    // on every overworld map) should nudge to the nearest walkable tile
    // rather than fail.
    let blockedResult;
    assert.doesNotThrow(() => { blockedResult = g.run("debugWarpToMap('MAP2', 0, 0)"); });
    assert.equal(blockedResult.success, true);
    assert.equal(g.run('canWalk(player.x, player.y)'), true);

    // ── 5. Normal gameplay is unaffected when debug overlays are closed ────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap = MAP2;
      player.x = 7.5*TILE; player.y = 7.5*TILE; player.facing = 'down';
      debugInspector.open = false; warpMenu.open = false; debugMenu.open = false;
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    const yBeforeMove = g.run('player.y');
    g.hold('ArrowDown');
    g.frames(20);
    g.release('ArrowDown');
    assert.ok(g.run('player.y') > yBeforeMove, 'normal movement must still work with every debug overlay closed');

    g.press('m'); // pause menu
    assert.equal(g.run('menu.open'), true, 'the normal pause menu must still open normally');
    g.press('m');
    assert.equal(g.run('menu.open'), false);

    // Debug-only keys must have zero effect on normal menu state.
    g.press('i');
    assert.equal(g.run('menu.open'), false, "'i' must not open the normal pause menu");
    g.press('i'); // close inspector again so it doesn't leak into later assertions

    // ── 6. Existing special point-tile transition still works ──────────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap = MAP;
      player.x = 14.5*TILE; player.y = 4.5*TILE; player.facing = 'right';
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    g.hold('ArrowRight');
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === MAP2');
    }
    g.release('ArrowRight');
    assert.ok(crossed, 'the existing MAP2_EXIT point-tile transition should still work');

    // ── 7. EDGE_TRANSITIONS still works, and is summarised correctly ───────
    const summary = g.run("debugEdgeTransitionSummary('NORTH_BASIN_S_MAP')");
    assert.ok(summary.north && summary.north.length === 1, 'North Basin South Approach should have one north segment');
    assert.equal(summary.north[0].targetMapId, 'NORTH_BASIN_C_MAP');
    assert.equal(summary.north[0].unlocked, true);
    // south is now the continuous causeway seam to MAP3_N2 (former point crossing)
    assert.ok(summary.south && summary.south.length === 1, 'North Basin South Approach now has one south segment (the causeway seam)');
    assert.equal(summary.south[0].targetMapId, 'MAP3_N2');
    assert.equal(summary.east, null, 'east has no configured segment on this map (future SE neighbour)');

    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap = NORTH_BASIN_S_MAP;
      player.x = 7.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
      combat.cooldown = 0;
    ; __reconcileCanonicalForTest();`);
    g.hold('ArrowUp');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_C_MAP');
    }
    g.release('ArrowUp');
    assert.ok(crossed, 'the EDGE_TRANSITIONS crossing (South Approach -> Reservoir) should still work');

    g.renderFrame();
  },
};
