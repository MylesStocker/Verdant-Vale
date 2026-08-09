'use strict';
// Covers: the new MAP_METADATA registry (data.js), the single source of
// truth for per-map bookkeeping (display name, region, type, item list,
// encounter pool, encounter/save permissions) that used to require touching
// MAP_REGISTRY, locationName(), currentItemList(), and combat.js's pool
// ladder separately for every new map. MAP_REGISTRY itself is kept as a
// separate, hand-maintained table (see the comment at the top of
// MAP_METADATA in data.js for why deriving one from the other isn't
// possible given script load order) and cross-validated against
// MAP_METADATA by validateGameData() instead.
//
//   1. locationName() returns the correct name for an outdoor map purely
//      through the MAP_METADATA lookup (no hardcoded per-map line anymore).
//   2. currentItemList() returns the correct, non-empty item list for an
//      existing map that has real pickups (MAP3_N1's Fen Sickle).
//   3. currentItemList() returns an empty array (not undefined, no throw)
//      for a map whose metadata declares an empty item list, AND for a map
//      with no metadata entry at all (simulating "a new map that hasn't
//      been wired up yet" -- the exact failure mode this table is meant to
//      make impossible without validation catching it first).
//   4. A map registered in MAP_REGISTRY but missing from MAP_METADATA is
//      caught by validateGameData(), not silently ignored.
//   5. A MAP_METADATA entry pointing at a missing/undefined map constant is
//      caught by validateGameData(), not silently ignored (and doesn't
//      throw while validating the rest of the table).
//   6. Existing special-tile transitions (MAP <-> MAP2) and the
//      EDGE_TRANSITIONS system (North Basin) still work after this pass --
//      both use MAP_REGISTRY/MAP_METADATA lookups that were touched by this
//      change (mapRegistryId(), MAP_METADATA[...].map), so this isn't a
//      redundant re-test of 02/21, it's confirming those lookups still
//      resolve correctly post-refactor.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'MAP_METADATA: central map registry, locationName()/currentItemList() migration, validation',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 0. Structural sanity: every MAP_REGISTRY key has metadata and vice versa ─
    const registryKeys = g.run('Object.keys(MAP_REGISTRY)');
    const metadataKeys = g.run('Object.keys(MAP_METADATA)');
    const registrySet = new Set(registryKeys), metadataSet = new Set(metadataKeys);
    for (const k of registryKeys) assert.ok(metadataSet.has(k), `MAP_REGISTRY[${k}] has no MAP_METADATA entry`);
    for (const k of metadataKeys) assert.ok(registrySet.has(k), `MAP_METADATA[${k}] has no MAP_REGISTRY entry`);
    assert.equal(registryKeys.length, metadataKeys.length);

    // ── 1. locationName() through metadata ──────────────────────────────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; inMireVault=false; inTakomo=false;
      inFenBrewery=false; inHamletInterior=false; inDungeonEntrance=false;
      inLorraHouse=false; inMarenPost=false; inDrenwrickPost=false; inBridgePost=false; inSmugglerFort=false;
      activeMap = NORTH_BASIN_SW_MAP;
    `);
    assert.equal(g.run('locationName()'), 'North Basin — Silt Flats');
    assert.equal(g.run('locationName()'), g.run("MAP_METADATA['NORTH_BASIN_SW_MAP'].displayName"));

    g.run('activeMap = MAP2;');
    assert.equal(g.run('locationName()'), 'Eastern Reaches');

    // ── 2. currentItemList() for a map with real items ──────────────────────
    g.run('activeMap = MAP3_N1;');
    const map3n1Items = g.run('currentItemList()');
    assert.equal(map3n1Items, g.run('MAP3_N1_ITEMS'), 'should be the exact MAP3_N1_ITEMS array, not a copy or a different fallback');
    assert.ok(map3n1Items.length > 0, 'MAP3_N1 has a real pickup (the Fen Sickle) -- this must not come back empty');
    assert.equal(map3n1Items[0].name, 'Fen Sickle');

    // ── 3a. currentItemList() for a map with an explicit empty item list ───
    g.run('activeMap = NORTH_BASIN_C_MAP;');
    const emptyItems = g.run('currentItemList()');
    assert.ok(Array.isArray(emptyItems), 'should return an array, never undefined');
    assert.equal(emptyItems.length, 0);

    // ── 3b. currentItemList() for a map with NO metadata entry at all ───────
    // Simulates "a brand new map array that hasn't been wired into
    // MAP_METADATA yet" -- the exact gap this table exists to make easy to
    // catch (see 4/5 below) rather than something that silently crashes the
    // renderer. Uses a throwaway array, not a real registered map, restored
    // immediately after.
    g.run(`
      var _unregisteredMap = [];
      for (var i = 0; i < 15; i++) { var row = []; for (var j = 0; j < 16; j++) row.push(0); _unregisteredMap.push(row); }
      activeMap = _unregisteredMap;
    `);
    let unregisteredResult;
    assert.doesNotThrow(() => { unregisteredResult = g.run('currentItemList()'); }, 'must not throw for a map with no MAP_METADATA entry');
    assert.ok(Array.isArray(unregisteredResult), 'should still return an array (falls back to WORLD_ITEMS), never undefined');

    // ── 4. A catalog id that doesn't equal its key is caught ────────────────
    // Replaces the old two-table cross-check (removed with the MAP_CATALOG
    // consolidation): the catalog is now validated directly, and id===key is a
    // hard invariant (no competing lowercase id namespace).
    g.run(`
      debugMode = true;
      window.__savedMap2Id = MAP_CATALOG['MAP2'].id;
      MAP_CATALOG['MAP2'].id = 'wrong_id';
    `);
    let warnings = collectValidationWarnings(g);
    assert.ok(
      warnings.some(w => w.includes('MAP_CATALOG[MAP2]') && w.includes('does not equal its property key')),
      'a catalog entry whose id !== its property key should be an error, not pass silently'
    );
    g.run(`MAP_CATALOG['MAP2'].id = window.__savedMap2Id; delete window.__savedMap2Id;`); // restore

    // ── 5. A catalog entry pointing to a missing map is caught ──────────────
    g.run(`
      MAP_CATALOG['_TEST_GHOST_MAP'] = {
        id: '_TEST_GHOST_MAP', map: undefined, displayName: 'Ghost',
        region: 'Nowhere', type: 'outdoor', items: [], encounterPool: null,
        allowRandomEncounters: false, allowSave: true,
      };
    `);
    let warnings2;
    assert.doesNotThrow(() => { warnings2 = collectValidationWarnings(g); }, 'validateGameData() must not throw when a catalog entry points to an undefined map');
    assert.ok(
      warnings2.some(w => w.includes('MAP_CATALOG[_TEST_GHOST_MAP]') && w.includes('map is not an array')),
      'a catalog entry with an undefined/missing map constant should produce a specific error'
    );
    g.run(`delete MAP_CATALOG['_TEST_GHOST_MAP'];`); // clean up

    // Confirm validation is clean again after both temporary breakages are undone.
    const warningsAfterCleanup = collectValidationWarnings(g);
    const metadataRelated = warningsAfterCleanup.filter(w => w.includes('MAP_CATALOG') || w.includes('MAP_METADATA') || w.includes('MAP_REGISTRY'));
    assert.equal(metadataRelated.length, 0, 'no catalog/metadata/registry warnings should remain after restoring both temporary breakages: ' + JSON.stringify(metadataRelated));

    // ── 6a. Existing special-tile transition still works (MAP <-> MAP2) ────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap = MAP;
      player.x = 14.5*TILE; player.y = 4.5*TILE; player.facing = 'right';
      combat.cooldown = 0;
    `);
    g.hold('ArrowRight');
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === MAP2');
    }
    g.release('ArrowRight');
    assert.ok(crossed, 'the existing MAP2_EXIT point-tile transition should still work after the MAP_METADATA migration');

    // ── 6b. EDGE_TRANSITIONS (North Basin) still works ──────────────────────
    g.run(`
      activeMap = NORTH_BASIN_S_MAP;
      player.x = 7.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
      combat.cooldown = 0;
    `);
    g.hold('ArrowUp');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_C_MAP');
    }
    g.release('ArrowUp');
    assert.ok(crossed, 'the EDGE_TRANSITIONS system (South Approach -> Reservoir) should still work after the MAP_METADATA migration');
    assert.equal(g.run('player.x'), 7.5 * 32);

    g.renderFrame();
  },
};

// Runs validateGameData() with console.log/warn/error stubbed out (so the
// test run doesn't get flooded with the full report), returning every
// individual error + warning message it produced as plain strings. Reads
// the function's structured return value (result.errorList/warningList)
// rather than scraping console output -- this content linter separates
// errors from warnings and reports them through console.error/console.warn
// respectively (see validation.js's printGrouped()), but this test only
// cares whether a specific issue was detected at all, not which severity
// bucket it landed in, so combining both lists is the right, more robust
// comparison surface.
function collectValidationWarnings(g) {
  g.run(`
    window.__origLog   = console.log;
    window.__origWarn  = console.warn;
    window.__origError = console.error;
    console.log = console.warn = console.error = function() {};
  `);
  const result = g.run('validateGameData()');
  g.run(`
    console.log   = window.__origLog;
    console.warn  = window.__origWarn;
    console.error = window.__origError;
  `);
  return result.errorList.concat(result.warningList).map(issue => issue.message);
}
