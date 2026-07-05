'use strict';
// Covers: the new TILE_PROPERTIES terrain-metadata registry (tiles.js) --
// a central description of what each tile ID means (name, walkability,
// category, tags, encounter eligibility, and flags like isWater/isRoad/
// isWall/isTransition/isSecret/isDecorative/deprecated) layered on top of
// the existing numeric tile constants and WALKABLE[] table, plus the
// helper functions built on it (getTileProperties/getTileName/
// isTileWalkable/isTileEncounterEligible/tileHasTag/isWaterTile/
// isRoadTile/isTransitionTile), movement.js's conservative migration to
// those helpers, the debug inspector's new tile-metadata line, and
// validation.js's new "Tile Properties" group.
//
// This is an additive metadata layer, not a rewrite: WALKABLE[] is
// unchanged and is still what isTileWalkable() ultimately reads (see its
// comment in tiles.js for why TILE_PROPERTIES.walkable isn't the source of
// truth for real collision), map layouts are unchanged, drawTile() is
// unchanged, and encounter rates/pools/which-maps-have-encounters are
// unchanged.
//
//   1.  WALKABLE behavior is preserved for representative tiles across
//       every major context (outdoor, interior, dungeon, North Basin).
//   2.  Movement collision still blocks a non-walkable tile (WATER).
//   3.  Movement still allows a walkable tile (GRASS).
//   4.  Encounter eligibility is unchanged for representative contexts:
//       outdoor GRASS eligible, outdoor PATH not, a real dungeon floor
//       tile eligible in its own dungeon-floor context, and a North Basin
//       tile (BASIN_MUD) not eligible even though walkable.
//   5.  The debug inspector can display tile name/category without
//       crashing, with the overlay open on a real map.
//   6.  Validation fails for a map using an unknown tile ID (same rule as
//       before, now also cross-checked against TILE_PROPERTIES).
//   7.  Validation fails for a tile used in a map that has no
//       TILE_PROPERTIES entry, even though it does have a WALKABLE entry.
//   8.  Validation fails if WALKABLE and TILE_PROPERTIES.walkable disagree
//       for the same tile id.
//   9.  The existing MAP <-> MAP2 point-tile transition still works.
//   10. The existing EDGE_TRANSITIONS crossing (North Basin) still works.
//   11. The debug menu's "Validate Data" option still works end-to-end and
//       its structured result includes at least one "Tile Properties"
//       group entry (proving the new checks are wired into the existing
//       report, not a separate, disconnected validation path).

const assert = require('assert/strict');
const { createContext } = require('../harness');

function runValidation(g) {
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
  return result;
}

module.exports = {
  name: 'Tile Properties: terrain metadata registry, helper functions, movement/encounter preservation, debug inspector, validation',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 1. WALKABLE behavior preserved for representative tiles ────────────
    assert.equal(g.run('isTileWalkable(GRASS)'), true);
    assert.equal(g.run('isTileWalkable(WATER)'), false);
    assert.equal(g.run('isTileWalkable(PATH)'), true);
    assert.equal(g.run('isTileWalkable(TREE)'), false);
    assert.equal(g.run('isTileWalkable(INTERIOR_FLOOR)'), true);
    assert.equal(g.run('isTileWalkable(INTERIOR_WALL)'), false);
    assert.equal(g.run('isTileWalkable(DUNGEON_FLOOR)'), true);
    assert.equal(g.run('isTileWalkable(DUNGEON_WALL)'), false);
    assert.equal(g.run('isTileWalkable(BASIN_MUD)'), true, 'North Basin ground tile should remain walkable');
    // Every one of these must also match the raw WALKABLE[] array exactly --
    // isTileWalkable() must not be a second, driftable source of truth.
    for (const t of ['GRASS', 'WATER', 'PATH', 'TREE', 'INTERIOR_FLOOR', 'INTERIOR_WALL', 'DUNGEON_FLOOR', 'DUNGEON_WALL', 'BASIN_MUD']) {
      assert.equal(g.run(`isTileWalkable(${t})`), g.run(`WALKABLE[${t}]`), `isTileWalkable(${t}) must match WALKABLE[${t}]`);
    }
    // Unknown tile id: must not throw, must report not-walkable (matching
    // the old `!WALKABLE[unknown]` => blocks-movement behavior exactly).
    assert.doesNotThrow(() => g.run('isTileWalkable(999999)'));
    assert.equal(g.run('isTileWalkable(999999)'), false);

    // ── 2 & 3. Movement collision still blocks/allows correctly ────────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap = MAP;
      player.x = 5*TILE; player.y = 5*TILE; player.facing = 'down';
    `);
    // Wall off north with WATER, leave east as GRASS -- confirms canWalk()
    // (now reading isTileWalkable() instead of WALKABLE[] directly) still
    // blocks on water and still allows grass, i.e. the swap didn't change
    // which tiles are actually crossable.
    g.run(`
      window.__savedRow4 = MAP[4].slice();
      for (let c = 0; c < COLS; c++) MAP[4][c] = WATER;
    `);
    const yBefore = g.run('player.y');
    g.hold('ArrowUp');
    g.frames(20);
    g.release('ArrowUp');
    assert.equal(g.run('player.y'), yBefore, 'player must not cross a WATER row after the isTileWalkable() migration');
    g.run(`for (let c = 0; c < COLS; c++) MAP[4][c] = window.__savedRow4[c]; delete window.__savedRow4;`);

    g.run(`player.x = 5*TILE; player.y = 5*TILE; player.facing = 'right';`);
    const xBefore = g.run('player.x');
    g.hold('ArrowRight');
    g.frames(20);
    g.release('ArrowRight');
    assert.ok(g.run('player.x') > xBefore, 'player must still be able to walk across ordinary walkable ground (GRASS/PATH)');

    // ── 4. Encounter eligibility for representative contexts ───────────────
    // REEDS is the one tile here whose eligibility has legitimately changed
    // since this test was first written (TILE_PROPERTIES[REEDS].encounterEligible
    // flipped true -> outdoor REEDS now produces encounters same as GRASS,
    // via this same isEncounterEligibleTile()/isTileEncounterEligible()
    // path, not a new hardcoded tile === REEDS check anywhere) -- everything
    // else here is still unchanged.
    g.run('inDungeon=false; inTown=false; inSluice=false; inMireVault=false; inTakomo=false; inFenBrewery=false; inHamletInterior=false; inDungeonEntrance=false;');
    assert.equal(g.run('isEncounterEligibleTile(GRASS)'), true, 'outdoor GRASS should remain encounter-eligible');
    assert.equal(g.run('isEncounterEligibleTile(PATH)'), false, 'outdoor PATH should remain non-encounter');
    assert.equal(g.run('isEncounterEligibleTile(BASIN_MUD)'), false, 'North Basin ground should not accidentally gain encounters');
    assert.equal(g.run('isEncounterEligibleTile(REEDS)'), true, 'outdoor REEDS should now be encounter-eligible, same as GRASS');
    assert.equal(g.run('tileHasTag(REEDS, "wetland")'), true, 'REEDS should still be tagged wetland regardless of its encounter eligibility');

    // REEDS must still be excluded everywhere isEncounterEligibleTile()'s
    // other, context-specific branches apply -- the outdoor branch is the
    // ONLY one that reads TILE_PROPERTIES.encounterEligible, so flipping
    // that flag must not leak eligibility into dungeon/sluice/town contexts
    // (none of which ever place a REEDS tile in practice, but the function
    // itself should still gate correctly if one ever did).
    g.run('inDungeon=true; dungeonFloor=1;');
    assert.equal(g.run('isEncounterEligibleTile(REEDS)'), false, 'REEDS must not be encounter-eligible in a dungeon-floor context');
    g.run('inDungeon=false; inSluice=true;');
    assert.equal(g.run('isEncounterEligibleTile(REEDS)'), false, 'REEDS must not be encounter-eligible in a sluice context');
    g.run('inSluice=false; inTown=true;');
    assert.equal(g.run('isEncounterEligibleTile(REEDS)'), false, 'REEDS must not be encounter-eligible in a town context');
    g.run('inTown=false;');

    g.run('inDungeon=true; dungeonFloor=1;');
    assert.equal(g.run('isEncounterEligibleTile(DUNGEON_FLOOR)'), true, 'dungeon floor 1 stone should remain encounter-eligible in its own floor context');
    assert.equal(g.run('isEncounterEligibleTile(DUNGEON2_FLOOR)'), false, 'floor-2-style stone should not be eligible while on floor 1');
    g.run('inDungeon=false;');

    // ── 5. Debug inspector displays tile metadata without crashing ─────────
    g.run(`
      activeMap = MAP; player.x = 2.5*TILE; player.y = 2.5*TILE;
      debugInspector.open = true;
    `);
    assert.doesNotThrow(() => g.renderFrame(), 'a full render() with the inspector open (now showing tile category/tags) must not throw');
    g.run('debugInspector.open = false;');

    // ── 6. Unknown tile ID in a map fails validation ────────────────────────
    g.run(`
      window.__savedTile = MAP2[0][0];
      MAP2[0][0] = 888888;
    `);
    const unknownTile = runValidation(g);
    assert.ok(
      unknownTile.errorList.some(e => e.message.includes('888888') && e.message.includes('no WALKABLE entry')),
      'an unknown tile id should fail validation: ' + JSON.stringify(unknownTile.errorList.filter(e => e.group === 'Tiles'))
    );
    g.run(`MAP2[0][0] = window.__savedTile; delete window.__savedTile;`);

    // ── 7. Tile missing a TILE_PROPERTIES entry fails validation ────────────
    // Uses a real, walkable, already-known (WALKABLE-covered) tile id so
    // this specifically exercises the *TILE_PROPERTIES-specific* gap, not
    // the plain "unknown tile" case covered by #6.
    g.run(`
      window.__savedGrassProps = TILE_PROPERTIES[GRASS];
      delete TILE_PROPERTIES[GRASS];
    `);
    const missingProps = runValidation(g);
    assert.ok(
      missingProps.errorList.some(e => e.group === 'Tile Properties' && e.message.includes('has no TILE_PROPERTIES entry')),
      'a tile used in a map with no TILE_PROPERTIES entry should fail validation: ' + JSON.stringify(missingProps.errorList.filter(e => e.group === 'Tile Properties'))
    );
    g.run(`TILE_PROPERTIES[GRASS] = window.__savedGrassProps; delete window.__savedGrassProps;`);

    // ── 8. WALKABLE / TILE_PROPERTIES.walkable disagreement fails validation ─
    g.run(`
      window.__savedTreeWalkable = TILE_PROPERTIES[TREE].walkable;
      TILE_PROPERTIES[TREE].walkable = true; // WALKABLE[TREE] is false -- deliberate mismatch
    `);
    const mismatch = runValidation(g);
    assert.ok(
      mismatch.errorList.some(e => e.group === 'Tile Properties' && e.message.includes('disagrees with TILE_PROPERTIES.walkable')),
      'a WALKABLE/TILE_PROPERTIES.walkable mismatch should fail validation: ' + JSON.stringify(mismatch.errorList.filter(e => e.group === 'Tile Properties'))
    );
    g.run(`TILE_PROPERTIES[TREE].walkable = window.__savedTreeWalkable; delete window.__savedTreeWalkable;`);

    // ── 9. Existing point transition (MAP <-> MAP2) still works ────────────
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
    assert.ok(crossed, 'the existing MAP2_EXIT point-tile transition should still work');

    // ── 10. Existing EDGE_TRANSITIONS crossing still works ──────────────────
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
    assert.ok(crossed, 'the EDGE_TRANSITIONS crossing (South Approach -> Reservoir) should still work');

    // ── 11. Debug menu's "Validate Data" still works, includes tile-property
    //        checks in the structured result ─────────────────────────────
    g.run('debugMenu.open = true; debugMenu.cursor = 7; worldToast = ""; worldToastTimer = 0;');
    g.run(`
      window.__origLog2 = console.log; window.__origWarn2 = console.warn; window.__origError2 = console.error;
      console.log = console.warn = console.error = function() {};
    `);
    g.press('Enter');
    g.run(`
      console.log = window.__origLog2; console.warn = window.__origWarn2; console.error = window.__origError2;
    `);
    assert.ok(g.run('worldToast').length > 0, 'the Validate Data debug menu row should show a toast summary');
    assert.ok(g.run('debugMenu.open'), 'the debug menu should stay open after running validation, matching Heal Full/Day +1');

    // Confirm the underlying structured result actually carries "Tile
    // Properties" as a real, populated group -- not just present in
    // console text, but in the object the debug menu itself reads.
    const finalResult = runValidation(g);
    assert.equal(finalResult.errors, 0, 'validation should be fully clean again after every temporary breakage above was restored: ' + JSON.stringify(finalResult.errorList));
    const allIssues = finalResult.errorList.concat(finalResult.warningList);
    assert.ok(
      allIssues.some(i => i.group === 'Tile Properties'),
      'the structured validateGameData() result should include at least one "Tile Properties" group entry (the documented NOTICE_BOARD exception, if nothing else)'
    );

    g.renderFrame();
  },
};
