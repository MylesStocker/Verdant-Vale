'use strict';
// Increment 1 guard: MAP_CATALOG (data.js) is the single authoritative catalog
// of physical maps; MAP_METADATA aliases it and MAP_REGISTRY is derived from it;
// mapIdForRef/mapEntryForId/mapRefForId are the canonical helpers (mapRegistryId
// is a deprecated alias). currentContentLocationKey() (movement.js) is the
// SEPARATE logical content-location namespace (npc.map / doors / schedules) and
// keeps every value the old currentMapId() returned.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'map catalog: authoritative catalog + derived views + canonical helpers + content-location keys',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const TILE = g.run('TILE');

    // ── 1. Every catalog key === entry.id; valid map + required metadata ─────
    const bad = JSON.parse(g.run(`JSON.stringify((function(){
      var out=[]; var VT={outdoor:1,town:1,interior:1,dungeon:1,bridge:1,special:1};
      for (var k of Object.keys(MAP_CATALOG)) {
        var e=MAP_CATALOG[k];
        if (e.id!==k) out.push(k+':id!==key');
        if (!Array.isArray(e.map)||!Array.isArray(e.map[0])) out.push(k+':bad-map');
        if (typeof e.displayName!=='string'||!e.displayName) out.push(k+':no-displayName');
        if (!VT[e.type]) out.push(k+':bad-type');
        if (!Array.isArray(e.items)) out.push(k+':bad-items');
        if (e.encounterPool!==null && !Array.isArray(e.encounterPool)) out.push(k+':bad-pool');
        if (typeof e.allowRandomEncounters!=='boolean') out.push(k+':bad-allowRandom');
        if (typeof e.allowSave!=='boolean') out.push(k+':bad-allowSave');
      }
      return out;
    })())`));
    assert.deepEqual(bad, [], 'every catalog entry has id===key + valid map/metadata');

    // ── 2. No map array registered under two canonical ids ──────────────────
    const dups = JSON.parse(g.run(`JSON.stringify((function(){
      var seen=new Map(),d=[];
      for (var k of Object.keys(MAP_CATALOG)){var m=MAP_CATALOG[k].map; if(seen.has(m))d.push(seen.get(m)+'=='+k); else seen.set(m,k);}
      return d;
    })())`));
    assert.deepEqual(dups, [], 'no map array has two canonical ids');

    // ── 3. Every reference round-trips through the helpers ───────────────────
    assert.equal(g.run(`Object.keys(MAP_CATALOG).every(function(k){
      var m = MAP_CATALOG[k].map;
      return mapRefForId(k) === m && mapIdForRef(m) === k;
    })`), true, 'mapIdForRef/mapRefForId round-trip for every catalogued map');

    // ── 4. Unknown ids/refs fail safely (null, no throw) ────────────────────
    assert.equal(g.run('mapIdForRef([[0]])'), null);
    assert.equal(g.run('mapIdForRef(null)'), null);
    assert.equal(g.run("mapEntryForId('NOT_A_MAP')"), null);
    assert.equal(g.run("mapRefForId('NOT_A_MAP')"), null);

    // ── 5. Compatibility views: exact catalog key set + references ───────────
    assert.equal(g.run('JSON.stringify(Object.keys(MAP_REGISTRY))'),
                 g.run('JSON.stringify(Object.keys(MAP_CATALOG))'), 'MAP_REGISTRY keys === catalog keys (same order)');
    assert.equal(g.run('MAP_METADATA === MAP_CATALOG'), true, 'MAP_METADATA aliases the catalog');
    assert.equal(g.run(`Object.keys(MAP_REGISTRY).every(function(k){
      return MAP_REGISTRY[k].id === k && MAP_REGISTRY[k].map === MAP_CATALOG[k].map;
    })`), true, 'registry ids + refs derive from the catalog');

    // ── 6. Registry labels are the canonical displayName ────────────────────
    assert.equal(g.run(`Object.keys(MAP_REGISTRY).every(function(k){
      return MAP_REGISTRY[k].label === MAP_CATALOG[k].displayName;
    })`), true, 'registry label === canonical displayName');
    // The formerly-competing lowercase Drenwick id is gone.
    assert.equal(g.run("MAP_REGISTRY['DRENWICK_OFFICE_MAP'].id"), 'DRENWICK_OFFICE_MAP', 'Drenwick id is the canonical key, not the old lowercase');

    // ── 7. All generated Sunken Gallery rooms are catalogued ────────────────
    assert.equal(g.run('window.SUNKEN_GALLERY_GRID_CELLS.length'), 24, '24 gallery grid cells');
    assert.equal(g.run("window.SUNKEN_GALLERY_GRID_CELLS.every(function(c){ return ('SUNKEN_GALLERY_'+c) in MAP_CATALOG; })"), true, 'every gallery grid room is a catalog entry');

    // ── 8. Representative ids serialize + restore unchanged (uppercase + Drenwick) ─
    const SAVE_VERSION = g.run('SAVE_VERSION');
    function roundTrip(setup, expectId, checkExpr) {
      g.run(setup + ' var _w=debugFindNearestWalkableTile(activeMap,7,7); player.x=(_w.col+0.5)*TILE; player.y=(_w.row+0.5)*TILE; player.facing="down";');
      assert.equal(g.run('saveGame()'), true, 'save succeeds for ' + expectId);
      const saved = JSON.parse(g.run("localStorage.getItem('verdantVale_save')"));
      assert.equal(saved.location.kind, 'discrete', expectId + ' is a discrete location');
      assert.equal(saved.location.mapId, expectId, 'serializes the canonical id ' + expectId);
      assert.equal(saved.version, SAVE_VERSION, 'save version is the current version');
      g.run('resetLocationState(); activeMap = MAP; player.x = 7.5*TILE; player.y = 9.5*TILE;');
      assert.equal(g.run('loadGame()'), true, 'load succeeds for ' + expectId);
      assert.equal(g.run(checkExpr), true, 'restores ' + expectId + ' unchanged');
    }
    // uppercase legacy id
    roundTrip('resetLocationState(); inDungeon=true; dungeonFloor=1; activeMap=DUNGEON_MAP;',
      'DUNGEON_MAP', "mapIdForRef(activeMap)==='DUNGEON_MAP' && inDungeon===true");
    // Drenwick id (serializes as the CANONICAL uppercase key, not 'drenwick_office')
    roundTrip("resetLocationState(); inTown=true; currentTownId='drenwick'; townBuilding='office'; activeMap=DRENWICK_OFFICE_MAP;",
      'DRENWICK_OFFICE_MAP', "mapIdForRef(activeMap)==='DRENWICK_OFFICE_MAP'");

    // ── 9. A current-version save loads with no migration / version change ───
    g.run('resetLocationState(); activeMap=MAP; inTown=false; player.x=7.5*TILE; player.y=9.5*TILE; day=6; stats.gold=88; __reconcileCanonicalForTest(); saveGame();');
    const raw = JSON.parse(g.run("localStorage.getItem('verdantVale_save')"));
    assert.equal(raw.version, SAVE_VERSION, 'save is the current version');
    assert.equal(raw.location.kind, 'regional', 'a save on MAP (Verdant Vale) is a regional location');
    // migrateSave reports migratedFrom null for a current save (no migration ran).
    assert.equal(g.run("migrateSave(JSON.parse(localStorage.getItem('verdantVale_save'))).migratedFrom"), null, 'current save needs no migration');
    assert.equal(g.run('loadGame()'), true, 'current save loads');

    // ── 10. currentContentLocationKey() keeps every logical key + alias ──────
    const cases = [
      ['resetLocationState(); activeMap=MAP;', 'overworld'],
      ["resetLocationState(); inTown=true; currentTownId='calwick'; activeMap=TOWN_MAP;", 'town'],
      ["resetLocationState(); inTown=true; townBuilding='house'; currentHouseId='player_house'; activeMap=HOUSE_INTERIOR_MAP;", 'house:player_house'],
      ["resetLocationState(); inTown=true; townBuilding='drenwick_apt_a1_u4'; currentTownId='drenwick'; activeMap=SMALL_APARTMENT_MAP;", 'drenwick_apt_a1_u4'],
      ['resetLocationState(); inDungeon=true; dungeonFloor=3; activeMap=DUNGEON3_MAP;', 'dungeon3'],
      ['resetLocationState(); inSluice=true; sluiceFloor=1; activeMap=SLUICE_MAP;', 'sluice'],
      ['resetLocationState(); inBridgePost=true; activeMap=BRIDGE_CROSSING_MAP;', 'bridge_post'],
      ['resetLocationState(); inSmugglerFort=true; activeMap=SMUGGLER_FORT_MAP;', 'smuggler_fort'],
      ["resetLocationState(); inTown=true; townBuilding='west'; currentTownId='calwick'; activeMap=WEST_TOWN_MAP;", 'west'],
    ];
    for (const [setup, expected] of cases) {
      g.run(setup);
      assert.equal(g.run('currentContentLocationKey()'), expected, 'content-location key for: ' + setup);
      assert.equal(g.run('currentMapId()'), expected, 'deprecated currentMapId() alias matches for: ' + setup);
    }

    // ── 11. Content-location key still drives house-door lookup ─────────────
    // (behavioral spot-check; fuller NPC-filtering/collision/scheduling coverage
    // lives in the NPC-movement, bridge, brewery, bounded-wander, and prop tests,
    // which all still pass on the renamed key.) HOUSE_DOORS are keyed by the
    // content-location string, and the Calwick west side has doors.
    g.run("resetLocationState(); inTown=true; townBuilding='west'; currentTownId='calwick'; activeMap=WEST_TOWN_MAP;");
    assert.equal(g.run('currentContentLocationKey()'), 'west');
    assert.equal(g.run('HOUSE_DOORS.some(function(d){ return d.map === currentContentLocationKey(); })'),
      true, 'HOUSE_DOORS are looked up by the content-location key (namespace intact)');
  },
};
