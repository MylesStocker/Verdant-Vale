'use strict';
// Regional chunk authoring — Part 1 (corrected): distributed authored definition
// fragments in the geographic content/maps/*.js files are the AUTHORITY; data.js
// merges them and RESOLVES encounterProfileId/itemSetId into the runtime
// REGIONAL_CHUNK_CATALOG, from which MAP_CATALOG's regional slice, REGIONAL_LAYOUT,
// and OUTDOOR_CONTENT_KEYS derive. MAP5/Thornmere Shallows is the grid-in-record
// pilot; the remaining records follow the distributed inline-grid authority.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const EXPECTED = ['MAP', 'MAP2', 'MAP3', 'MAP4', 'MAP5', 'MAP_N1', 'MAP_N2', 'RODDON_WAY_MAP',
  'MAP3_N1', 'MAP3_N2', 'DRENWICK_EAST_CANAL_MAP', 'DRENWICK_WEST_OUTFALL_MAP', 'NORTH_BASIN_S_MAP', 'NORTH_BASIN_SE_MAP', 'NORTH_BASIN_C_MAP',
  'NORTH_BASIN_SW_MAP', 'NORTH_BASIN_W_MAP', 'NORTH_BASIN_NW_MAP', 'NORTH_BASIN_N_MAP',
  'NORTH_BASIN_NE_MAP', 'NORTH_BASIN_NE2_MAP', 'NORTH_BASIN_E2_MAP', 'NORTH_BASIN_E_MAP'];

// The 15 ORIGINAL placed maps carry a derived compat alias (const/window) in data.js
// (legacy consumers). The two scenery-only chunks — DRENWICK_WEST_OUTFALL_MAP (1,3) and
// NORTH_BASIN_N_MAP (2,0) — were added AFTER that pattern and deliberately have NO
// alias/standalone var/window export (new code uses mapRefForId()/the catalog helpers).
// Alias-specific checks use ALIASED.
const ALIASLESS = ['DRENWICK_EAST_CANAL_MAP', 'DRENWICK_WEST_OUTFALL_MAP', 'NORTH_BASIN_N_MAP', 'NORTH_BASIN_NE_MAP', 'NORTH_BASIN_NE2_MAP', 'NORTH_BASIN_E2_MAP', 'NORTH_BASIN_E_MAP', 'NORTH_BASIN_SE_MAP'];
const ALIASED = EXPECTED.filter((id) => !ALIASLESS.includes(id));

// Which fragment (and therefore which geographic file) authors each chunk.
const FRAGMENTS = {
  CALWICK_REGIONAL_CHUNK_DEFINITIONS: ['MAP'],
  THORNMERE_REGIONAL_CHUNK_DEFINITIONS: ['MAP2', 'MAP3', 'MAP4', 'MAP5', 'RODDON_WAY_MAP', 'MAP3_N1'],
  DRENWICK_REGIONAL_CHUNK_DEFINITIONS: ['MAP3_N2', 'DRENWICK_EAST_CANAL_MAP', 'DRENWICK_WEST_OUTFALL_MAP'],
  NORTHERN_ROAD_REGIONAL_CHUNK_DEFINITIONS: ['MAP_N1', 'MAP_N2'],
  NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS: ['NORTH_BASIN_S_MAP', 'NORTH_BASIN_SE_MAP', 'NORTH_BASIN_C_MAP',
    'NORTH_BASIN_SW_MAP', 'NORTH_BASIN_W_MAP', 'NORTH_BASIN_NW_MAP', 'NORTH_BASIN_N_MAP', 'NORTH_BASIN_NE_MAP', 'NORTH_BASIN_NE2_MAP', 'NORTH_BASIN_E2_MAP', 'NORTH_BASIN_E_MAP'],
};

module.exports = {
  name: 'Regional chunk authoring: distributed fragments → resolved catalog, all 23 grids inline',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Authored fragments collectively contain all 23 maps exactly once ───
    const seenAcross = new Map(); // mapId -> fragment
    for (const [frag, ids] of Object.entries(FRAGMENTS)) {
      assert.equal(g.run(`Array.isArray(${frag})`), true, `${frag} is an authored array`);
      const fragIds = J(`JSON.stringify(${frag}.map(function(d){return d.mapId;}))`);
      assert.deepEqual(fragIds, ids, `${frag} authors exactly ${ids.join(', ')}`);
      for (const id of fragIds) {
        // ── 2. No map id appears in more than one fragment ──────────────────
        assert.ok(!seenAcross.has(id), `${id} is authored in only one fragment (also in ${seenAcross.get(id)})`);
        seenAcross.set(id, frag);
      }
    }
    assert.deepEqual([...seenAcross.keys()].sort(), [...EXPECTED].sort(), 'the fragments collectively author exactly the 23 placed maps');
    // merged definition list = the union, deduped, and coordinates unique
    assert.equal(g.run('_REGIONAL_CHUNK_DEFINITIONS.length'), 23, 'the merged _REGIONAL_CHUNK_DEFINITIONS has 23 definitions');
    const defCoords = J("JSON.stringify(_REGIONAL_CHUNK_DEFINITIONS.map(function(d){return d.regionId+':'+d.chunkX+','+d.chunkY;}))");
    assert.equal(new Set(defCoords).size, 23, 'no chunk coordinate is authored in more than one fragment');

    // ── 3. The resolved runtime catalog has exactly the same 23 entries ───────
    const ids = J('JSON.stringify(Object.keys(REGIONAL_CHUNK_CATALOG))');
    assert.equal(ids.length, 23, 'exactly 23 resolved chunk records');
    assert.deepEqual([...ids].sort(), [...EXPECTED].sort(), 'the resolved catalog is exactly the placed regional maps');
    assert.equal(g.run('Object.keys(REGIONAL_CHUNK_CATALOG).every(function(k){return REGIONAL_CHUNK_CATALOG[k].mapId===k;})'), true, 'each record.mapId equals its key');
    assert.equal(g.run('Object.values(REGIONAL_CHUNK_CATALOG).every(function(r){return r.map.length===15 && r.map.every(function(row){return row.length===16;});})'), true, 'every chunk grid is 15×16');
    assert.equal(g.run('Object.values(REGIONAL_CHUNK_CATALOG).every(function(r){return r.map.every(function(row){return row.every(function(t){return WALKABLE[t]!==undefined;});});})'), true, 'every grid tile id is known');
    assert.equal(g.run('(function(){var s=new Set(); for(var k in REGIONAL_CHUNK_CATALOG){var m=REGIONAL_CHUNK_CATALOG[k].map; if(s.has(m))return false; s.add(m);} return true;})()'), true, 'physical grid refs are unique (no shared grids)');

    // ── 4. Every resolved value agrees with its authored definition + views ───
    for (const id of EXPECTED) {
      const rec = J(`JSON.stringify({dn:REGIONAL_CHUNK_CATALOG['${id}'].displayName, ck:REGIONAL_CHUNK_CATALOG['${id}'].contentKey, pres:REGIONAL_CHUNK_CATALOG['${id}'].presentation, cx:REGIONAL_CHUNK_CATALOG['${id}'].chunkX, cy:REGIONAL_CHUNK_CATALOG['${id}'].chunkY, rid:REGIONAL_CHUNK_CATALOG['${id}'].regionId})`);
      // resolved record matches its authored definition
      assert.equal(g.run(`(function(){var d=_REGIONAL_CHUNK_DEFINITIONS.find(function(x){return x.mapId==='${id}';}); var r=REGIONAL_CHUNK_CATALOG['${id}']; return d.contentKey===r.contentKey && d.presentation===r.presentation && d.chunkX===r.chunkX && d.chunkY===r.chunkY && d.regionId===r.regionId && d.displayName===r.displayName;})()`), true, `${id}: resolved record matches its authored definition`);
      // generated views derive from the resolved authority
      assert.equal(g.run(`mapEntryForId('${id}').map===REGIONAL_CHUNK_CATALOG['${id}'].map`), true, `${id}: MAP_CATALOG.map derives`);
      assert.equal(g.run(`mapEntryForId('${id}').encounterPool===REGIONAL_CHUNK_CATALOG['${id}'].encounterPool`), true, `${id}: MAP_CATALOG.encounterPool derives`);
      assert.equal(g.run(`mapEntryForId('${id}').items===REGIONAL_CHUNK_CATALOG['${id}'].items`), true, `${id}: MAP_CATALOG.items derives`);
      assert.equal(g.run(`mapEntryForId('${id}').displayName`), rec.dn, `${id}: display name`);
      assert.equal(g.run(`OUTDOOR_CONTENT_KEYS['${id}']`), rec.ck, `${id}: OUTDOOR_CONTENT_KEYS derives contentKey`);
      assert.equal(g.run(`regionalPresentationForMapId('${id}')`), rec.pres, `${id}: presentation derives`);
      const p = J(`JSON.stringify(regionPlacementForMapId('${id}'))`);
      assert.deepEqual([p.chunkX, p.chunkY, p.regionId], [rec.cx, rec.cy, rec.rid], `${id}: REGIONAL_LAYOUT placement derives`);
    }
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'), 23, 'REGIONAL_LAYOUT has 23 placements');
    assert.equal(g.run('Object.keys(OUTDOOR_CONTENT_KEYS).length'), 23, 'OUTDOOR_CONTENT_KEYS has 23 entries');

    // ── 5. Reverse map-ref → id and chunk-coordinate lookups remain correct ───
    for (const id of EXPECTED) {
      assert.equal(g.run(`mapIdForRef(REGIONAL_CHUNK_CATALOG['${id}'].map)`), id, `${id}: mapIdForRef(grid) round-trips`);
      const p = J(`JSON.stringify(regionPlacementForMapId('${id}'))`);
      assert.equal(g.run(`mapIdForChunk('${p.regionId}', ${p.chunkX}, ${p.chunkY})`), id, `${id}: mapIdForChunk resolves back`);
    }

    // ── 6 (7+8 of spec). Encounter-profile + item resolution preserve the exact
    //     existing pool-/item-array references ──────────────────────────────
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.MAP5.encounterPool===THORNMERE_ENEMY_TEMPLATES"), true, "MAP5's 'thornmere' profile resolves to the THORNMERE_ENEMY_TEMPLATES reference");
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.MAP2.encounterPool===ENEMY_TEMPLATES"), true, "MAP2's 'reaches' profile resolves to ENEMY_TEMPLATES");
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.NORTH_BASIN_NW_MAP.encounterPool===UPPER_REACH_ENEMY_TEMPLATES"), true, "NB_NW's 'upper_reach' profile resolves to UPPER_REACH_ENEMY_TEMPLATES");
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.MAP5.items===MAP5_ITEMS"), true, "MAP5's 'map5' itemSet resolves to the MAP5_ITEMS reference");
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.MAP.items===WORLD_ITEMS"), true, "MAP's 'world' itemSet resolves to WORLD_ITEMS");
    // every resolved pool/items IS the registry array named by the definition
    assert.equal(g.run('_REGIONAL_CHUNK_DEFINITIONS.every(function(d){return REGIONAL_CHUNK_CATALOG[d.mapId].encounterPool===_ENCOUNTER_PROFILES[d.encounterProfileId];})'), true, 'every resolved encounterPool is the array named by its encounterProfileId');
    assert.equal(g.run('_REGIONAL_CHUNK_DEFINITIONS.every(function(d){return d.itemSetId===undefined || REGIONAL_CHUNK_CATALOG[d.mapId].items===_REGIONAL_ITEM_SETS[d.itemSetId];})'), true, 'every resolved items array is the array named by its itemSetId');

    // ── 9-of-spec (1-4,7). Completed migration: ALL 23 grids authored inline in
    //     their fragment records; no standalone grid var, no `map: MAP_ID` ref, no
    //     legacy window export; data.js holds derived aliases (for the 15 original
    //     original maps only) + no terrain rows. New regional chunks have NO alias.
    const SRC = {
      MAP: 'content/maps/calwick-maps.js',
      MAP2: 'content/maps/thornmere-wilds-maps.js', MAP3: 'content/maps/thornmere-wilds-maps.js',
      MAP4: 'content/maps/thornmere-wilds-maps.js', MAP5: 'content/maps/thornmere-wilds-maps.js',
      RODDON_WAY_MAP: 'content/maps/thornmere-wilds-maps.js', MAP3_N1: 'content/maps/thornmere-wilds-maps.js',
      MAP3_N2: 'content/maps/drenwick-maps.js', DRENWICK_EAST_CANAL_MAP: 'content/maps/drenwick-maps.js',
      DRENWICK_WEST_OUTFALL_MAP: 'content/maps/drenwick-maps.js',
      NORTH_BASIN_N_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_NE_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_NE2_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_E2_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_E_MAP: 'content/maps/north-basin-maps.js',
      MAP_N1: 'maps.js', MAP_N2: 'maps.js',
      NORTH_BASIN_S_MAP: 'content/maps/north-basin-maps.js', NORTH_BASIN_SE_MAP: 'content/maps/north-basin-maps.js', NORTH_BASIN_C_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_SW_MAP: 'content/maps/north-basin-maps.js', NORTH_BASIN_W_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_NW_MAP: 'content/maps/north-basin-maps.js',
    };
    const readSrc = (rel) => fs.readFileSync(path.join(__dirname, '../../', rel), 'utf8');
    const curData = readSrc('data.js');
    const fileCache = {};
    for (const id of EXPECTED) {
      const file = SRC[id];
      const src = fileCache[file] || (fileCache[file] = readSrc(file));
      assert.ok(new RegExp("mapId:\\s*'" + id + "'[\\s\\S]{0,800}?map:\\s*\\[").test(src), id + ': grid authored inline in its chunk definition record (' + file + ')');
      assert.ok(!new RegExp('map:\\s*' + id + '\\s*,').test(src), id + ': no map:' + id + ' legacy grid-variable reference remains');
      assert.ok(!new RegExp('(^|\\n)const ' + id + '\\s*=\\s*\\[').test(src), id + ': no standalone const ' + id + ' = [ grid literal remains');
      assert.ok(!new RegExp('window\\.' + id + '\\s*=\\s*' + id + '\\b').test(src), id + ': the former independent window.' + id + ' export is gone from ' + file);
      if (ALIASED.includes(id)) {
        assert.ok(new RegExp('const ' + id + '\\s*=\\s*REGIONAL_CHUNK_CATALOG\\.' + id + '\\.map').test(curData), id + ': data.js declares the derived compat alias');
        assert.ok(new RegExp('window\\.' + id + '\\s*=\\s*' + id + '\\b').test(curData), id + ': data.js provides the derived window export');
      } else {
        // New regional chunks: no compat alias / standalone var / window export.
        assert.ok(!new RegExp('const ' + id + '\\s*=').test(curData), id + ': data.js declares NO compat alias (new chunk needs none)');
        assert.ok(!new RegExp('window\\.' + id + '\\s*=').test(curData), id + ': data.js declares NO window export');
      }
    }
    assert.ok(!/\n\s*\[\s*\d+,\s*\d+,/.test(curData), 'data.js contains no terrain grid rows');
    // each catalog grid, its const alias, mapRefForId(), and MAP_CATALOG.map are ONE array object
    for (const id of ALIASED) {
      assert.equal(g.run("REGIONAL_CHUNK_CATALOG['" + id + "'].map===" + id + " && " + id + "===mapRefForId('" + id + "') && " + id + "===mapEntryForId('" + id + "').map"), true, id + ': catalog grid, const alias, mapRefForId(), and MAP_CATALOG.map are the same array object');
    }
    // the alias-less West Outfall still resolves through the catalog helpers
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG['DRENWICK_WEST_OUTFALL_MAP'].map===mapRefForId('DRENWICK_WEST_OUTFALL_MAP') && mapRefForId('DRENWICK_WEST_OUTFALL_MAP')===mapEntryForId('DRENWICK_WEST_OUTFALL_MAP').map"), true, 'West Outfall: catalog grid, mapRefForId(), and MAP_CATALOG.map are the same array object (no bare const needed)');

    // ── 11. Every grid matches its stable, repository-owned fingerprint (no
    //        tile-number changes) — evidence is a SHA-256 fixture, NOT Git history.
    assert.equal(GRID_FP.serialization, 'sha256hex(JSON.stringify(map))', 'fixture documents its canonical serialization');
    const fpVals = Object.values(GRID_FP.fingerprints);
    assert.equal(new Set(fpVals).size, fpVals.length, 'all stored grid fingerprints are unique (no two grids are byte-identical)');
    assert.deepEqual(Object.keys(GRID_FP.fingerprints).sort(), [...EXPECTED].sort(), 'fixture fingerprints exactly the 23 placed regional grids');
    for (const id of EXPECTED) {
      const got = sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`));
      assert.equal(got, GRID_FP.fingerprints[id], `${id}: grid matches its stable pre-migration fingerprint (no tile-number changes)`);
    }

    // ── 13. MAP5 collision / debug warp / MAP4↔MAP5 travel unchanged ──────────
    g.run("debugWarpToDestination('outdoor:MAP5');");
    assert.equal(g.run('mapIdForRef(activeMap)'), 'MAP5', 'debug warp to MAP5 lands on MAP5');
    assert.equal(g.run('canWalk(0.5*TILE, 6.5*TILE)'), true, 'MAP5 seam shore (col 0 row 6) is walkable (collision intact)');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP5')[0][0])"), false, 'MAP5 open water (row 0) stays non-walkable');
    g.run("debugWarpToDestination('outdoor:MAP4'); forceLegacyRegionalView = false; placeAtLocation('MAP4', 14.5*TILE, 6.5*TILE); for(var k in keys)delete keys[k];");
    g.hold('ArrowRight'); for (let i = 0; i < 40 && g.run("mapIdForRef(activeMap)") !== 'MAP5'; i++) g.frames(1); g.release('ArrowRight');
    assert.equal(g.run('mapIdForRef(activeMap)'), 'MAP5', 'MAP4→MAP5 continuous seam travel still works');

    // MAP5 keeps the Thornmere pool despite the shared 'overworld' logical key
    assert.equal(g.run('REGIONAL_CHUNK_CATALOG.MAP5.contentKey'), 'overworld', 'MAP5 shares the ambiguous overworld content key');
    assert.equal(g.run("(function(){ placeAtLocation('MAP5', 4*TILE, 6*TILE); return currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES; })()"), true, 'MAP5 encounter pool is THORNMERE despite the shared overworld key');

    // Canonical position + v4 save/load resolve MAP5
    g.run("placeAtLocation('MAP5', 3.25*TILE, 6.5*TILE); player.facing='left';");
    assert.equal(J('JSON.stringify(regionalDerivedLocation())').mapId, 'MAP5', 'canonical position resolves MAP5');
    const saved = J("(saveGame(), localStorage.getItem('verdantVale_save'))");
    assert.equal(saved.location.kind, 'regional', 'MAP5 save is a regional v4 location');
    g.run("placeAtLocation('MAP', 1*TILE, 1*TILE); loadGame();");
    assert.equal(g.run('mapIdForRef(activeMap)'), 'MAP5', 'v4 regional load restores MAP5');

    // ── 9,11,13 of spec. Behaviour parity across the migrated maps ────────────
    assert.equal(g.run('continuousSeamEntries().length'), 34, '34 eligible directed segment entries');
    for (const id of EXPECTED) {
      // The scenery-only West Outfall is a DISABLED debug destination (no player
      // access), so it can't be warped to — its geographic pool still resolves below.
      if (ALIASED.includes(id)) {
        g.run(`debugWarpToDestination('outdoor:${id}');`);
        assert.equal(g.run('mapIdForRef(activeMap)'), id, `${id}: debug warp resolves the migrated map`);
      }
      // geographic (physical-chunk) encounter pool equals the resolved catalog pool
      const p = J(`JSON.stringify(regionPlacementForMapId('${id}'))`);
      const ctxPool = g.run(`(function(){ var c=geographicEncounterContext('${p.regionId}', (${p.chunkX}*COLS+8)*TILE, (${p.chunkY}*ROWS+7)*TILE); return c && c.encounterPool===REGIONAL_CHUNK_CATALOG['${id}'].encounterPool; })()`);
      assert.equal(ctxPool, true, `${id}: geographic encounter context resolves the same pool as the catalog`);
    }

    // ── 12 of spec. Canonical + v4 save/load round-trips on a representative map
    //    from EVERY geographic fragment (calwick/thornmere/drenwick/northern-road/basin).
    for (const id of ['MAP', 'MAP3', 'MAP3_N2', 'MAP_N1', 'NORTH_BASIN_SW_MAP']) {
      g.run(`debugWarpToDestination('outdoor:${id}'); placeAtLocation('${id}', 8*TILE, 7*TILE); player.facing='down';`);
      assert.equal(J('JSON.stringify(regionalDerivedLocation())').mapId, id, `${id}: canonical position resolves`);
      g.run('saveGame();');
      g.run("placeAtLocation('MAP5', 3*TILE, 6*TILE); loadGame();");
      assert.equal(g.run('mapIdForRef(activeMap)'), id, `${id}: v4 regional save/load round-trips`);
    }

    // ── 5 of spec. Unknown authored fields, and malformed resolved records,
    //    fail closed (catalog layer). ─────────────────────────────────────────
    const withBadRecord = (mutate, regex, label) => {
      const errs = J(`(function(){
        var base = { mapId:'__BAD__', regionId:'overworld', chunkX:9, chunkY:9,
          map: Array.from({length:15},function(){return Array(16).fill(0);}),
          displayName:'Bad', region:'Test', contentKey:'bad', presentation:'continuous',
          encounterPool: THORNMERE_ENEMY_TEMPLATES, items: [], allowRandomEncounters:true, allowSave:true };
        (${mutate})(base);
        REGIONAL_CHUNK_CATALOG['__BAD__'] = base;
        var v = validateGameData();
        delete REGIONAL_CHUNK_CATALOG['__BAD__'];
        return JSON.stringify((v.errorList||[]).filter(function(e){return e.group==='Regional chunks';}).map(function(e){return e.message;}));
      })()`);
      assert.ok(errs.some((m) => regex.test(m)), label + ' -> a Regional chunks error matching ' + regex);
    };
    withBadRecord("function(b){ b.mapId='MAP5'; }", /duplicate mapId/, 'duplicate resolved id');
    withBadRecord("function(b){ b.chunkX=4; b.chunkY=5; }", /duplicate chunk coordinate/, 'duplicate resolved coordinate');
    withBadRecord("function(b){ b.map=Array.from({length:14},function(){return Array(16).fill(0);}); }", /rows \(expected 15\)/, 'bad dimensions');
    withBadRecord("function(b){ b.map[0][0]=999999; }", /unknown tile id 999999/, 'invalid tile');
    withBadRecord("function(b){ b.presentation='bogus'; }", /not a recognized mode/, 'unknown presentation');
    withBadRecord("function(b){ b.contentKey=''; }", /contentKey is missing/, 'invalid content ownership');
    withBadRecord("function(b){ b.encounterPool={}; }", /encounterPool must resolve/, 'invalid encounter ownership');
    withBadRecord("function(b){ b.somethingNew=1; }", /unrecognized field/, 'unknown resolved field (fail-closed)');

    // ── 6 of spec. Unknown encounter-profile and item-set ids fail validation
    //    with useful messages (definitions layer). ─────────────────────────────
    const withBadDefinition = (mutate, regex, label) => {
      const errs = J(`(function(){
        var base = { mapId:'__BADDEF__', regionId:'overworld', chunkX:9, chunkY:9,
          map: Array.from({length:15},function(){return Array(16).fill(0);}),
          displayName:'Bad', region:'Test', contentKey:'baddef', presentation:'continuous',
          encounterProfileId:'far', itemSetId:'map2', allowRandomEncounters:true, allowSave:true };
        (${mutate})(base);
        _REGIONAL_CHUNK_DEFINITIONS.push(base);
        var v = validateGameData();
        _REGIONAL_CHUNK_DEFINITIONS.pop();
        return JSON.stringify((v.errorList||[]).filter(function(e){return e.group==='Regional chunks';}).map(function(e){return e.message;}));
      })()`);
      assert.ok(errs.some((m) => regex.test(m)), label + ' -> a Regional chunks error matching ' + regex);
    };
    withBadDefinition("function(b){ b.encounterProfileId='nope'; }", /unknown encounterProfileId "nope" \(known:/, 'unknown encounter-profile id (useful message)');
    withBadDefinition("function(b){ b.itemSetId='nope'; }", /unknown itemSetId "nope" \(known:/, 'unknown item-set id (useful message)');
    withBadDefinition("function(b){ b.mapId='MAP5'; }", /mapId "MAP5" is defined in more than one fragment/, 'duplicate mapId across fragments');
    withBadDefinition("function(b){ b.chunkX=4; b.chunkY=5; }", /coordinate overworld:4,5 is defined in more than one fragment/, 'duplicate coordinate across fragments');
    withBadDefinition("function(b){ b.mystery=1; }", /unrecognized authored field "mystery"/, 'unknown authored field (fail-closed)');

    // ── 16 of spec. One clean fragment definition suffices — the profile/item
    //    registries resolve it with no second registry edit. (Mirrors the data.js
    //    builder's resolution step to prove a single authored input is enough.) ─
    const single = J(`(function(){
      var def = { mapId:'__SYN__', regionId:'overworld', chunkX:7, chunkY:7,
        map: Array.from({length:15},function(){return Array(16).fill(0);}),
        displayName:'Synthetic', region:'Test', contentKey:'syn', presentation:'continuous',
        encounterProfileId:'north_basin', itemSetId:'map3', allowRandomEncounters:true, allowSave:true };
      var pool = _ENCOUNTER_PROFILES[def.encounterProfileId];
      var items = (def.itemSetId===undefined) ? [] : _REGIONAL_ITEM_SETS[def.itemSetId];
      return JSON.stringify({ poolOk: pool===NORTH_BASIN_ENEMY_TEMPLATES, itemsOk: items===MAP3_ITEMS });
    })()`);
    assert.ok(single.poolOk && single.itemsOk, 'a single fragment definition resolves its pool + items through the registries (no second registry edit)');

    // ── 13 of spec. Construction / reading mutates no gameplay state ──────────
    const noMut = J(`(function(){
      var before = mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+inTown+'|'+inDungeon;
      Object.keys(REGIONAL_CHUNK_CATALOG).forEach(function(k){ var r=REGIONAL_CHUNK_CATALOG[k]; void r.map; void r.encounterPool; });
      outdoorContentKeyForMapId('MAP5'); regionPlacementForMapId('MAP5'); mapEntryForId('MAP5');
      var after = mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+inTown+'|'+inDungeon;
      return JSON.stringify({ same: before===after });
    })()`);
    assert.ok(noMut.same, 'reading the chunk catalog / derived views mutates no runtime state');

    // ── 15 of spec. Discrete maps stay OUTSIDE the regional chunk authoring ───
    for (const d of ['HOUSE_INTERIOR_MAP', 'TOWN_MAP', 'DUNGEON_MAP', 'BRIDGE_CROSSING_MAP']) {
      assert.equal(g.run(`typeof REGIONAL_CHUNK_CATALOG['${d}']`), 'undefined', `${d} is not a regional chunk record`);
      assert.equal(g.run(`_REGIONAL_CHUNK_DEFINITIONS.some(function(x){return x.mapId==='${d}';})`), false, `${d} has no chunk definition`);
      assert.equal(g.run(`!!mapEntryForId('${d}')`), true, `${d} still has a discrete MAP_CATALOG entry`);
      assert.equal(g.run(`regionPlacementForMapId('${d}')`), null, `${d} has no regional placement`);
    }
    g.run("debugWarpToDestination('dungeon:f8_east');");
    assert.equal(g.run('regionalWorldPosition()'), null, 'a discrete dungeon has no canonical regional position (unchanged)');
  },
};
