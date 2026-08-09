'use strict';
// test/cases/58-regional-content-split.test.js
//
// Structural contract for the regional content split: maps, NPCs, and
// interactions were moved out of maps.js / npcs.js / interactions.js into 16
// regional files under content/, while MAP_REGISTRY, SIMPLE_NPCS / NPC_REGISTRY,
// MAP_FEATURES, and the INTERACT_HANDLERS / OVERWORLD_INTERACT_HANDLERS tables
// stay the authoritative aggregates. This test locks that layout in.
//
// It proves: all 16 files are in index.html in the correct order; the harness
// loads them; every prescribed fragment exists; duplicate MAP_FEATURES ownership
// throws; representative maps/NPCs/features/handlers resolve through the
// aggregates; per-map NPC and feature order is preserved; removing a regional
// script fails a structural check; a map from each region renders; and save/load
// restores a location from each region.

const assert = require('assert');
const { createContext, scriptOrderFromIndexHtml } = require('../harness');

const REGIONAL_FILES = [
  'content/maps/calwick-maps.js', 'content/maps/thornmere-wilds-maps.js', 'content/maps/drenwick-maps.js',
  'content/maps/south-ruins-maps.js', 'content/maps/north-basin-maps.js',
  'content/npcs/calwick-npcs.js', 'content/npcs/thornmere-wilds-npcs.js', 'content/npcs/drenwick-town-npcs.js',
  'content/npcs/drenwick-interior-npcs.js', 'content/npcs/south-ruins-npcs.js',
  'content/interactions/calwick-interactions.js', 'content/interactions/thornmere-wilds-interactions.js',
  'content/interactions/drenwick-town-interactions.js', 'content/interactions/drenwick-interior-interactions.js',
  'content/interactions/south-ruins-interactions.js', 'content/interactions/north-basin-interactions.js',
];

function idx(list, f) { return list.indexOf(f); }
function assertAll16Present(list) {
  for (const f of REGIONAL_FILES) if (!list.includes(f)) throw new Error('missing regional script: ' + f);
}

module.exports = {
  name: 'Regional content split: 16 regional files + authoritative aggregates, behaviour-neutral',
  run() {
    const scripts = scriptOrderFromIndexHtml();

    // 1. All 16 prescribed regional files appear in index.html.
    assertAll16Present(scripts);
    assert.equal(REGIONAL_FILES.length, 16);

    // 2. Order relative to the three facades is correct.
    const mapsI = idx(scripts, 'maps.js'), npcsI = idx(scripts, 'npcs.js'), interI = idx(scripts, 'interactions.js');
    for (const f of REGIONAL_FILES.slice(0, 5)) assert.ok(idx(scripts, f) < mapsI, f + ' must load before maps.js');
    for (const f of REGIONAL_FILES.slice(5, 10)) { assert.ok(idx(scripts, f) > mapsI, f + ' after maps.js'); assert.ok(idx(scripts, f) < npcsI, f + ' before npcs.js'); }
    for (const f of REGIONAL_FILES.slice(10, 16)) { assert.ok(idx(scripts, f) > npcsI, f + ' after npcs.js'); assert.ok(idx(scripts, f) < interI, f + ' before interactions.js'); }
    assert.equal(interI, scripts.length - 1, 'interactions.js must load last');
    // exact regional order within each group
    const mapOrder = REGIONAL_FILES.slice(0, 5).map(f => idx(scripts, f));
    assert.deepEqual(mapOrder.slice().sort((a, b) => a - b), mapOrder, 'regional map files in the prescribed order');

    // 11 (structural-failure guard): removing one regional script fails the check.
    assertAll16Present(scripts); // passes with all present
    const minusOne = scripts.filter(f => f !== 'content/npcs/south-ruins-npcs.js');
    assert.throws(() => assertAll16Present(minusOne), /missing regional script/, 'removing a regional script must fail the presence check');

    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // 3. The headless harness loads the same 16 files (it parses this same index.html).
    assert.deepEqual(scriptOrderFromIndexHtml().filter(f => REGIONAL_FILES.includes(f)).sort(), REGIONAL_FILES.slice().sort());

    // 4. Every prescribed regional fragment exists.
    for (const arr of ['CALWICK_NPCS','THORNMERE_WILDS_NPCS','DRENWICK_TOWN_NPCS','DRENWICK_INTERIOR_NPCS','SOUTH_RUINS_NPCS','SHARED_NPCS'])
      assert.equal(g.run('Array.isArray(' + arr + ')'), true, arr + ' must be a declared array');
    for (const frag of ['CALWICK_MAP_FEATURES','THORNMERE_WILDS_MAP_FEATURES','DRENWICK_TOWN_MAP_FEATURES','DRENWICK_INTERIOR_MAP_FEATURES','SOUTH_RUINS_MAP_FEATURES','NORTH_BASIN_MAP_FEATURES','SHARED_MAP_FEATURES'])
      assert.equal(g.run('typeof ' + frag + " === 'object' && " + frag + ' !== null'), true, frag + ' must be a declared object');
    assert.equal(g.run("typeof mergeMapFeatureFragments === 'function'"), true, 'mergeMapFeatureFragments must exist');

    // 5. Duplicate MAP_FEATURES map ownership is rejected.
    assert.equal(g.run('(function(){ try { mergeMapFeatureFragments([{Z:[]},{Z:[]}]); return "no-throw"; } catch (e) { return e.message.indexOf("duplicate") >= 0 ? "threw" : "wrong"; } })()'), 'threw');
    // and SIMPLE_NPCS is exactly the six arrays concatenated (no sort / no source tags).
    assert.equal(g.run('SIMPLE_NPCS.length === CALWICK_NPCS.length + THORNMERE_WILDS_NPCS.length + DRENWICK_TOWN_NPCS.length + DRENWICK_INTERIOR_NPCS.length + SOUTH_RUINS_NPCS.length + SHARED_NPCS.length'), true);
    assert.equal(g.run('SIMPLE_NPCS[0] === CALWICK_NPCS[0]'), true, 'SIMPLE_NPCS begins with the Calwick array');

    // 6. Representative map from all five map regions resolves through MAP_REGISTRY.
    const mapReg = { MAP: 'calwick', SLUICE_MAP: 'thornmere', DRENWICK_MARKET_MAP: 'drenwick', DUNGEON_MAP: 'south-ruins', SUNKEN_GALLERY_R2C2: 'north-basin' };
    for (const m of Object.keys(mapReg)) assert.equal(g.run('MAP_REGISTRY[mapRegistryId(' + m + ')].map === ' + m), true, m + ' resolves through MAP_REGISTRY');
    assert.equal(g.run('Object.keys(MAP_REGISTRY).length'), 102);

    // 7. Representative NPC from all five NPC files resolves through SIMPLE_NPCS + NPC_REGISTRY.
    const npcReg = { aldric: 'CALWICK_NPCS', gorrit_wend: 'THORNMERE_WILDS_NPCS', tarvec: 'DRENWICK_TOWN_NPCS', harbormaster_interior: 'DRENWICK_INTERIOR_NPCS', wen: 'SOUTH_RUINS_NPCS' };
    for (const [id, arr] of Object.entries(npcReg)) {
      assert.equal(g.run("SIMPLE_NPCS.some(n => n.id === '" + id + "')"), true, id + ' in SIMPLE_NPCS');
      assert.equal(g.run("!!NPC_REGISTRY['" + id + "']"), true, id + ' in NPC_REGISTRY');
      assert.equal(g.run(arr + ".some(n => n.id === '" + id + "') && NPC_REGISTRY['" + id + "'] === SIMPLE_NPCS.find(n => n.id === '" + id + "')"), true, id + ' owned by ' + arr);
    }

    // 8. Representative feature + handler from all six interaction files resolve through the aggregates.
    for (const [k] of Object.entries({ TOWN_MAP: 1, MAP3: 1, DRENWICK_WATERFRONT_MAP: 1, DUNGEON_MAP: 1, SUNKEN_GALLERY_MAP: 1, APARTMENT_CORRIDOR_MAP: 1 }))
      assert.equal(g.run("Array.isArray(MAP_FEATURES['" + k + "'])"), true, 'MAP_FEATURES has ' + k);
    for (const fn of ['interactCalwickVale','interactThornmereWilds','interactDrenwickApproach','interactNorthBasinWilds','interactSunkenGallery','interactCalwickOffice','interactMireVault','interactDungeonFloor1','interactDrenwickInn'])
      assert.equal(g.run("typeof " + fn + " === 'function'"), true, fn + ' defined');
    for (const nm of ['calwick-vale','thornmere-wilds','drenwick-approach','north-basin-wilds','office','sunken-gallery'])
      assert.equal(g.run("OVERWORLD_INTERACT_HANDLERS.some(h => h.name === '" + nm + "')"), true, 'handler ' + nm + ' present');
    assert.equal(g.run('INTERACT_HANDLERS.length'), 4, 'INTERACT_HANDLERS order/size unchanged');

    // 9. Per-map NPC order preserved (representative: Calwick school on a work day).
    g.run('day = 1;');
    assert.deepEqual(
      JSON.parse(g.run("JSON.stringify(SIMPLE_NPCS.filter(n => n.map === 'school').map(n => n.id))")),
      ['ms_vale','student_a1','student_a2','student_a3','student_a4','student_b1','student_b2','student_b3','student_b4','calwick_school_bookshelf','calwick_school_map','tev'],
      'Calwick school NPC order preserved (incl. student_b4 kept with the school group)');

    // 10. Per-map feature order preserved (representative: TOWN_MAP).
    const townFeatIds = JSON.parse(g.run("JSON.stringify(MAP_FEATURES['TOWN_MAP'].map(f => f.id))"));
    assert.ok(townFeatIds.length > 0 && townFeatIds.every((v, i) => townFeatIds.indexOf(v) === i), 'TOWN_MAP features present and unique');
    assert.deepEqual(townFeatIds, JSON.parse(g.run("JSON.stringify(CALWICK_MAP_FEATURES['TOWN_MAP'].map(f => f.id))")), 'TOWN_MAP feature order matches its owning fragment');

    // 12. A representative map from each region renders without throwing.
    const renders = [
      "activeMap = MAP; inTown=false; inDungeon=false; inSluice=false; inSunkenGallery=false;",
      "activeMap = MAP2;",
      "inTown=true; currentTownId='drenwick'; townBuilding=null; activeMap = DRENWICK_MARKET_MAP;",
      "inTown=false; inDungeon=true; dungeonFloor=1; activeMap = DUNGEON_MAP;",
      "inDungeon=false; inSunkenGallery=true; activeMap = SUNKEN_GALLERY_R2C2;",
    ];
    for (const setup of renders) {
      g.run(setup + " player.x = 7.5*TILE; player.y = 7.5*TILE;");
      assert.doesNotThrow(() => g.renderFrame(), 'render must not throw for setup: ' + setup);
    }

    // 13. Save/load restores a representative location from each region.
    const locs = [
      { setup: "inTown=true; currentTownId='calwick'; townBuilding=null; activeMap=TOWN_MAP;", check: 'activeMap === TOWN_MAP' },
      { setup: "inTown=true; currentTownId='drenwick'; townBuilding=null; activeMap=DRENWICK_MARKET_MAP;", check: 'activeMap === DRENWICK_MARKET_MAP' },
      { setup: "inTown=false; inDungeon=true; dungeonFloor=1; activeMap=DUNGEON_MAP;", check: 'activeMap === DUNGEON_MAP' },
      { setup: "inDungeon=false; inSluice=true; sluiceFloor=1; activeMap=SLUICE_MAP;", check: 'activeMap === SLUICE_MAP' },
      { setup: "inSluice=false; inSunkenGallery=false; inTown=false; inDungeon=false; activeMap=NORTH_BASIN_S_MAP;", check: 'activeMap === NORTH_BASIN_S_MAP' },
    ];
    for (const { setup, check } of locs) {
      // resetLocationState() clears boot's in-house context so each setup is a
      // consistent, saveable location; snap the player to a walkable tile so
      // the strengthened load preflight accepts the placement on every map.
      g.run('resetLocationState(); ' + setup +
            " var _w = debugFindNearestWalkableTile(activeMap, 7, 7); player.x = (_w.col + 0.5) * TILE; player.y = (_w.row + 0.5) * TILE;");
      g.run('saveGame();');
      g.run("activeMap = MAP; inTown=false; inDungeon=false; inSluice=false; inSunkenGallery=false;");
      g.run('loadGame();');
      assert.equal(g.run(check), true, 'save/load restores location: ' + check);
    }
  },
};
