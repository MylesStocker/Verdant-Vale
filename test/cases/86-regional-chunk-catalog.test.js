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

const EASTERN_FENS = [
  'EASTERN_FENS_EMBANKMENT_W_MAP', 'EASTERN_FENS_EMBANKMENT_E_MAP',
  'EASTERN_FENS_REEDBELT_N_MAP', 'EASTERN_FENS_REEDBELT_E_MAP', 'EASTERN_FENS_REEDBELT_S_MAP',
  'EASTERN_FENS_DRY_RISE_APPROACH_MAP', 'EASTERN_FENS_DRY_RISE_MAP',
  'EASTERN_FENS_DRAINAGE_SW_MAP', 'EASTERN_FENS_DRAINAGE_NW_MAP',
  'EASTERN_FENS_WORKED_REEDS_MAP', 'EASTERN_FENS_MANAGED_REEDS_MAP',
  'EASTERN_FENS_TRAVELLERS_RISE_MAP', 'EASTERN_FENS_WIDE_WATER_MAP',
  'EASTERN_FENS_CHANNEL_APPROACH_W_MAP', 'EASTERN_FENS_CHANNEL_APPROACH_E_MAP', 'EASTERN_FENS_VALMERE_ROAD_TURN_MAP',
  'EASTERN_FENS_CHANNEL_ROAD_S_MAP', 'EASTERN_FENS_CHANNEL_ROAD_MID_MAP', 'EASTERN_FENS_CHANNEL_ROAD_N_MAP',
  'EASTERN_FENS_VALMERE_REVEAL_MAP', 'EASTERN_FENS_VALMERE_SHORE_W_MAP', 'EASTERN_FENS_VALMERE_SHORE_E_MAP',
  'EASTERN_FENS_MORNAY_THRESHOLD_MAP',
];
// Phase 2 regional envelope: 4 walkable infill + 33 scenery perimeter, in the
// exact order authored in EASTERN_FENS_ENVELOPE_CHUNK_DEFINITIONS.
const EASTERN_FENS_ENVELOPE = [
  'EASTERN_FENS_BRIDGE_INLET_W_MAP', 'EASTERN_FENS_BRIDGE_INLET_E_MAP', 'EASTERN_FENS_CHANNEL_ELBOW_MAP', 'EASTERN_FENS_REED_HOLLOW_MAP',
  'EASTERN_FENS_ENVELOPE_C6R0_MAP', 'EASTERN_FENS_ENVELOPE_C7R0_MAP', 'EASTERN_FENS_ENVELOPE_C8R0_MAP', 'EASTERN_FENS_ENVELOPE_C9R0_MAP', 'EASTERN_FENS_ENVELOPE_C14R0_MAP',
  'EASTERN_FENS_ENVELOPE_C5R1_MAP', 'EASTERN_FENS_ENVELOPE_C6R1_MAP', 'EASTERN_FENS_ENVELOPE_C9R1_MAP', 'EASTERN_FENS_ENVELOPE_C10R1_MAP', 'EASTERN_FENS_ENVELOPE_C11R1_MAP', 'EASTERN_FENS_ENVELOPE_C12R1_MAP', 'EASTERN_FENS_ENVELOPE_C13R1_MAP', 'EASTERN_FENS_ENVELOPE_C14R1_MAP', 'EASTERN_FENS_ENVELOPE_C16R1_MAP', 'EASTERN_FENS_ENVELOPE_C17R1_MAP', 'EASTERN_FENS_ENVELOPE_C18R1_MAP',
  'EASTERN_FENS_ENVELOPE_C16R2_MAP', 'EASTERN_FENS_ENVELOPE_C16R3_MAP', 'EASTERN_FENS_ENVELOPE_C16R4_MAP',
  'EASTERN_FENS_ENVELOPE_C5R3_MAP', 'EASTERN_FENS_ENVELOPE_C6R3_MAP', 'EASTERN_FENS_ENVELOPE_C7R3_MAP', 'EASTERN_FENS_ENVELOPE_C8R3_MAP',
  'EASTERN_FENS_ENVELOPE_C8R4_MAP', 'EASTERN_FENS_ENVELOPE_C9R4_MAP', 'EASTERN_FENS_ENVELOPE_C10R4_MAP', 'EASTERN_FENS_ENVELOPE_C11R4_MAP', 'EASTERN_FENS_ENVELOPE_C12R4_MAP',
  'EASTERN_FENS_ENVELOPE_C12R5_MAP', 'EASTERN_FENS_ENVELOPE_C13R5_MAP', 'EASTERN_FENS_ENVELOPE_C14R5_MAP', 'EASTERN_FENS_ENVELOPE_C15R5_MAP', 'EASTERN_FENS_ENVELOPE_C16R5_MAP',
  'EASTERN_FENS_ENVELOPE_C6RN1_MAP', 'EASTERN_FENS_ENVELOPE_C7RN1_MAP', 'EASTERN_FENS_ENVELOPE_C8RN1_MAP', 'EASTERN_FENS_ENVELOPE_C9RN1_MAP', 'EASTERN_FENS_ENVELOPE_C14RN1_MAP', 'EASTERN_FENS_ENVELOPE_C15RN1_MAP',
  'EASTERN_FENS_MORNAY_APPROACH_W_MAP', 'EASTERN_FENS_MORNAY_APPROACH_M_MAP', 'EASTERN_FENS_MORNAY_APPROACH_E_MAP', 'EASTERN_FENS_ENVELOPE_C15RN2_MAP',
  'EASTERN_FENS_MORNAY_WESTERN_COVE_MAP', 'EASTERN_FENS_MORNAY_NECK_ROAD_MAP', 'EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP',
  'EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP', 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP', 'EASTERN_FENS_MORNAY_EASTERN_POINT_MAP',
  'EASTERN_FENS_ENVELOPE_C15RN3_MAP', 'EASTERN_FENS_ENVELOPE_C15RN4_MAP', 'EASTERN_FENS_ENVELOPE_C16RN4_MAP', 'EASTERN_FENS_ENVELOPE_C17RN4_MAP', 'EASTERN_FENS_ENVELOPE_C18RN4_MAP',
];
// Great Fen: 24 fresh chunks authored in their own geographic file. (The 4
// converted entry chunks -- C6RN1/C7RN1/C8RN1/C9RN1 -- keep their original
// EASTERN_FENS_ENVELOPE_* ids/fragment, since their mapId is stable.)
const GREAT_FEN = [
  'GREAT_FEN_C1RN5_MAP', 'GREAT_FEN_C2RN5_MAP', 'GREAT_FEN_C3RN5_MAP', 'GREAT_FEN_C4RN5_MAP', 'GREAT_FEN_C5RN5_MAP',
  'GREAT_FEN_C2RN4_MAP', 'GREAT_FEN_C3RN4_MAP', 'GREAT_FEN_C4RN4_MAP', 'GREAT_FEN_C5RN4_MAP', 'GREAT_FEN_C6RN4_MAP', 'GREAT_FEN_C7RN4_MAP',
  'GREAT_FEN_C3RN3_MAP', 'GREAT_FEN_C4RN3_MAP', 'GREAT_FEN_C5RN3_MAP', 'GREAT_FEN_C6RN3_MAP', 'GREAT_FEN_C7RN3_MAP', 'GREAT_FEN_C8RN3_MAP', 'GREAT_FEN_C9RN3_MAP',
  'GREAT_FEN_C5RN2_MAP', 'GREAT_FEN_C6RN2_MAP', 'GREAT_FEN_C7RN2_MAP', 'GREAT_FEN_C8RN2_MAP', 'GREAT_FEN_C9RN2_MAP', 'GREAT_FEN_C10RN2_MAP',
];
// Great Fen envelope: 23 scenery-only framing chunks closing the Great Fen's
// zero-visible-void camera envelope (its walkable footprint is irregular, not
// a solid rectangle). Authored in the same file as a second array.
const GREAT_FEN_ENVELOPE = [
  'GREAT_FEN_ENVELOPE_C0RN5_MAP', 'GREAT_FEN_ENVELOPE_C6RN5_MAP', 'GREAT_FEN_ENVELOPE_C7RN5_MAP', 'GREAT_FEN_ENVELOPE_C8RN5_MAP',
  'GREAT_FEN_ENVELOPE_C0RN4_MAP', 'GREAT_FEN_ENVELOPE_C1RN4_MAP', 'GREAT_FEN_ENVELOPE_C8RN4_MAP', 'GREAT_FEN_ENVELOPE_C9RN4_MAP', 'GREAT_FEN_ENVELOPE_C10RN4_MAP',
  'GREAT_FEN_ENVELOPE_C1RN3_MAP', 'GREAT_FEN_ENVELOPE_C2RN3_MAP', 'GREAT_FEN_ENVELOPE_C10RN3_MAP', 'GREAT_FEN_ENVELOPE_C11RN3_MAP',
  'GREAT_FEN_ENVELOPE_C2RN2_MAP', 'GREAT_FEN_ENVELOPE_C3RN2_MAP', 'GREAT_FEN_ENVELOPE_C4RN2_MAP', 'GREAT_FEN_ENVELOPE_C11RN2_MAP',
  'GREAT_FEN_ENVELOPE_C4RN1_MAP', 'GREAT_FEN_ENVELOPE_C5RN1_MAP', 'GREAT_FEN_ENVELOPE_C10RN1_MAP', 'GREAT_FEN_ENVELOPE_C11RN1_MAP',
  'GREAT_FEN_ENVELOPE_C5R0_MAP', 'GREAT_FEN_ENVELOPE_C10R0_MAP',
  // Exposed once the Valmere expansion extended the region's overall camera
  // bounds further north -- the Great Fen's own north edge needed 7 more
  // framing chunks to stay zero-void under the new, larger bounding box.
  'GREAT_FEN_ENVELOPE_C0RN6_MAP', 'GREAT_FEN_ENVELOPE_C1RN6_MAP', 'GREAT_FEN_ENVELOPE_C2RN6_MAP', 'GREAT_FEN_ENVELOPE_C3RN6_MAP',
  'GREAT_FEN_ENVELOPE_C4RN6_MAP', 'GREAT_FEN_ENVELOPE_C5RN6_MAP', 'GREAT_FEN_ENVELOPE_C6RN6_MAP',
];
// Valmere expanse: 11 fresh walkable near-shore chunks (plus the 2 converted
// entry chunks EASTERN_FENS_ENVELOPE_C14R0_MAP/C14RN1_MAP, which keep their
// original ids/fragment) authored in content/maps/valmere-expanse-maps.js.
const VALMERE_EXPANSE = [
  'VALMERE_EXPANSE_C13RN6_MAP', 'VALMERE_EXPANSE_C14RN6_MAP', 'VALMERE_EXPANSE_C14RN5_MAP', 'VALMERE_EXPANSE_C15RN5_MAP',
  'VALMERE_EXPANSE_C13RN4_MAP', 'VALMERE_EXPANSE_C14RN4_MAP', 'VALMERE_EXPANSE_C13RN3_MAP', 'VALMERE_EXPANSE_C14RN3_MAP',
  'VALMERE_EXPANSE_C13RN2_MAP', 'VALMERE_EXPANSE_C14RN2_MAP', 'VALMERE_EXPANSE_C13RN1_MAP',
];
// Valmere expanse envelope: 29 scenery-only open-water chunks closing the
// lake's zero-visible-void camera envelope around the near-shore spine.
const VALMERE_EXPANSE_ENVELOPE = [
  'VALMERE_EXPANSE_ENVELOPE_C12RN7_MAP', 'VALMERE_EXPANSE_ENVELOPE_C13RN7_MAP', 'VALMERE_EXPANSE_ENVELOPE_C14RN7_MAP', 'VALMERE_EXPANSE_ENVELOPE_C15RN7_MAP',
  'VALMERE_EXPANSE_ENVELOPE_C16RN7_MAP', 'VALMERE_EXPANSE_ENVELOPE_C17RN7_MAP', 'VALMERE_EXPANSE_ENVELOPE_C18RN7_MAP', 'VALMERE_EXPANSE_ENVELOPE_C19RN7_MAP', 'VALMERE_EXPANSE_ENVELOPE_C20RN7_MAP',
  'VALMERE_EXPANSE_ENVELOPE_C12RN6_MAP', 'VALMERE_EXPANSE_ENVELOPE_C15RN6_MAP', 'VALMERE_EXPANSE_ENVELOPE_C16RN6_MAP', 'VALMERE_EXPANSE_ENVELOPE_C17RN6_MAP', 'VALMERE_EXPANSE_ENVELOPE_C18RN6_MAP', 'VALMERE_EXPANSE_ENVELOPE_C19RN6_MAP', 'VALMERE_EXPANSE_ENVELOPE_C20RN6_MAP',
  'VALMERE_EXPANSE_ENVELOPE_C12RN5_MAP', 'VALMERE_EXPANSE_ENVELOPE_C13RN5_MAP', 'VALMERE_EXPANSE_ENVELOPE_C16RN5_MAP', 'VALMERE_EXPANSE_ENVELOPE_C17RN5_MAP', 'VALMERE_EXPANSE_ENVELOPE_C18RN5_MAP', 'VALMERE_EXPANSE_ENVELOPE_C19RN5_MAP', 'VALMERE_EXPANSE_ENVELOPE_C20RN5_MAP',
  'VALMERE_EXPANSE_ENVELOPE_C12RN4_MAP', 'VALMERE_EXPANSE_ENVELOPE_C12RN3_MAP', 'VALMERE_EXPANSE_ENVELOPE_C12RN2_MAP', 'VALMERE_EXPANSE_ENVELOPE_C12RN1_MAP',
  'VALMERE_EXPANSE_ENVELOPE_C13R0_MAP', 'VALMERE_EXPANSE_ENVELOPE_C12R0_MAP',
  // Exposed once the Valmere expansion itself extended the region's overall
  // camera bounds further east -- the Eastern Fens Mornay peninsula/approach
  // chunks' own east edge needed 6 more framing chunks to stay zero-void.
  'VALMERE_EXPANSE_ENVELOPE_C19R1_MAP', 'VALMERE_EXPANSE_ENVELOPE_C19R0_MAP', 'VALMERE_EXPANSE_ENVELOPE_C19RN1_MAP',
  'VALMERE_EXPANSE_ENVELOPE_C19RN2_MAP', 'VALMERE_EXPANSE_ENVELOPE_C19RN3_MAP', 'VALMERE_EXPANSE_ENVELOPE_C19RN4_MAP',
];
// Eastern Shore: 6 fresh walkable chunks authored in their own geographic
// file. (The 1 converted entry chunk -- EASTERN_FENS_ENVELOPE_C18R1_MAP --
// keeps its original id/fragment, since its mapId is stable.)
const EASTERN_SHORE = [
  'EASTERN_SHORE_C18R2_MAP', 'EASTERN_SHORE_C19R2_MAP', 'EASTERN_SHORE_C20R2_MAP',
  'EASTERN_SHORE_C18R3_MAP', 'EASTERN_SHORE_C19R3_MAP', 'EASTERN_SHORE_C19R4_MAP',
];
// Eastern Shore envelope: 10 scenery-only framing chunks closing the
// zero-visible-void camera envelope around the irregular walkable spine.
const EASTERN_SHORE_ENVELOPE = [
  'EASTERN_SHORE_ENVELOPE_C17R2_MAP', 'EASTERN_SHORE_ENVELOPE_C20R1_MAP', 'EASTERN_SHORE_ENVELOPE_C20R3_MAP',
  'EASTERN_SHORE_ENVELOPE_C17R3_MAP', 'EASTERN_SHORE_ENVELOPE_C20R4_MAP', 'EASTERN_SHORE_ENVELOPE_C18R4_MAP',
  'EASTERN_SHORE_ENVELOPE_C17R4_MAP', 'EASTERN_SHORE_ENVELOPE_C19R5_MAP', 'EASTERN_SHORE_ENVELOPE_C20R5_MAP',
  'EASTERN_SHORE_ENVELOPE_C18R5_MAP',
];
// Southern Moraine: 6 fresh walkable chunks authored in their own
// geographic file. (The 1 converted entry chunk --
// EASTERN_FENS_ENVELOPE_C15R5_MAP -- keeps its original id/fragment.)
const SOUTHERN_MORAINE = [
  'SOUTHERN_MORAINE_C14R6_MAP', 'SOUTHERN_MORAINE_C15R6_MAP', 'SOUTHERN_MORAINE_C16R6_MAP',
  'SOUTHERN_MORAINE_C17R6_MAP', 'SOUTHERN_MORAINE_C16R7_MAP', 'SOUTHERN_MORAINE_C17R7_MAP',
];
// Southern Moraine envelope: 7 scenery-only framing chunks closing the
// zero-visible-void camera envelope around the irregular walkable spine.
const SOUTHERN_MORAINE_ENVELOPE = [
  'SOUTHERN_MORAINE_ENVELOPE_C13R6_MAP', 'SOUTHERN_MORAINE_ENVELOPE_C13R7_MAP', 'SOUTHERN_MORAINE_ENVELOPE_C14R7_MAP',
  'SOUTHERN_MORAINE_ENVELOPE_C15R7_MAP', 'SOUTHERN_MORAINE_ENVELOPE_C18R6_MAP', 'SOUTHERN_MORAINE_ENVELOPE_C18R7_MAP',
  'SOUTHERN_MORAINE_ENVELOPE_C17R5_MAP',
];
const MAINLAND = Object.keys(GRID_FP.fingerprints).filter(id=>id.startsWith('MAINLAND_'));
const EXPECTED = ['MAP', 'MAP2', 'MAP3', 'MAP4', 'MAP5', 'MAP_N1', 'MAP_N2', 'RODDON_WAY_MAP',
  'MAP3_N1', 'MAP3_N2', 'DRENWICK_EAST_CANAL_MAP', 'THORNMERE_NORTH_FEN_MAP', 'THORNMERE_CANAL_HEAD_MAP', 'THORNMERE_UPPER_SHALLOWS_MAP', 'DRENWICK_WEST_OUTFALL_MAP', 'NORTH_BASIN_S_MAP', 'NORTH_BASIN_SE_MAP', 'EAST_CAUSEWAY_MAP', 'EASTERN_BANK_MAP', 'NORTH_BASIN_C_MAP',
  'NORTH_BASIN_SW_MAP', 'NORTH_BASIN_MIREWOOD_MAP', 'NORTH_BASIN_W_MAP', 'NORTH_BASIN_NW2_MAP', 'NORTH_BASIN_W2_MAP', 'NORTH_BASIN_NW_MAP', 'NORTH_BASIN_N_MAP',
  'NORTH_BASIN_NE_MAP', 'NORTH_BASIN_NE2_MAP', 'NORTH_BASIN_E2_MAP', 'NORTH_BASIN_E_MAP', 'NORTH_BASIN_ENVELOPE_C0RN1_MAP', 'NORTH_BASIN_ENVELOPE_C1RN1_MAP', 'NORTH_BASIN_ENVELOPE_C2RN1_MAP', ...EASTERN_FENS, ...EASTERN_FENS_ENVELOPE, ...GREAT_FEN, ...GREAT_FEN_ENVELOPE, ...VALMERE_EXPANSE, ...VALMERE_EXPANSE_ENVELOPE, ...EASTERN_SHORE, ...EASTERN_SHORE_ENVELOPE, ...SOUTHERN_MORAINE, ...SOUTHERN_MORAINE_ENVELOPE, ...MAINLAND];

// The 15 ORIGINAL placed maps carry a derived compat alias (const/window) in data.js
// for legacy consumers. Newer chunks, including every scenery-only addition, were
// added after that pattern and deliberately have NO alias/standalone var/window export
// (new code uses mapRefForId()/the catalog helpers).
// Alias-specific checks use ALIASED.
const ALIASLESS = ['DRENWICK_EAST_CANAL_MAP', 'THORNMERE_NORTH_FEN_MAP', 'THORNMERE_CANAL_HEAD_MAP', 'THORNMERE_UPPER_SHALLOWS_MAP', 'DRENWICK_WEST_OUTFALL_MAP', 'NORTH_BASIN_N_MAP', 'NORTH_BASIN_NE_MAP', 'NORTH_BASIN_NE2_MAP', 'NORTH_BASIN_E2_MAP', 'NORTH_BASIN_E_MAP', 'NORTH_BASIN_SE_MAP', 'EAST_CAUSEWAY_MAP', 'EASTERN_BANK_MAP', 'NORTH_BASIN_NW2_MAP', 'NORTH_BASIN_W2_MAP', 'NORTH_BASIN_MIREWOOD_MAP', 'NORTH_BASIN_ENVELOPE_C0RN1_MAP', 'NORTH_BASIN_ENVELOPE_C1RN1_MAP', 'NORTH_BASIN_ENVELOPE_C2RN1_MAP', ...EASTERN_FENS, ...EASTERN_FENS_ENVELOPE, ...GREAT_FEN, ...GREAT_FEN_ENVELOPE, ...VALMERE_EXPANSE, ...VALMERE_EXPANSE_ENVELOPE, ...EASTERN_SHORE, ...EASTERN_SHORE_ENVELOPE, ...SOUTHERN_MORAINE, ...SOUTHERN_MORAINE_ENVELOPE, ...MAINLAND];
const ALIASED = EXPECTED.filter((id) => !ALIASLESS.includes(id));

// Which fragment (and therefore which geographic file) authors each chunk.
const FRAGMENTS = {
  CALWICK_REGIONAL_CHUNK_DEFINITIONS: ['MAP'],
  THORNMERE_REGIONAL_CHUNK_DEFINITIONS: ['MAP2', 'MAP3', 'MAP4', 'THORNMERE_NORTH_FEN_MAP', 'THORNMERE_CANAL_HEAD_MAP', 'THORNMERE_UPPER_SHALLOWS_MAP', 'MAP5', 'RODDON_WAY_MAP', 'MAP3_N1'],
  DRENWICK_REGIONAL_CHUNK_DEFINITIONS: ['MAP3_N2', 'DRENWICK_EAST_CANAL_MAP', 'DRENWICK_WEST_OUTFALL_MAP'],
  NORTHERN_ROAD_REGIONAL_CHUNK_DEFINITIONS: ['MAP_N1', 'MAP_N2'],
  NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS: ['NORTH_BASIN_S_MAP', 'NORTH_BASIN_SE_MAP', 'EAST_CAUSEWAY_MAP', 'EASTERN_BANK_MAP', 'NORTH_BASIN_C_MAP',
    'NORTH_BASIN_MIREWOOD_MAP', 'NORTH_BASIN_SW_MAP', 'NORTH_BASIN_W_MAP', 'NORTH_BASIN_NW2_MAP', 'NORTH_BASIN_W2_MAP', 'NORTH_BASIN_NW_MAP', 'NORTH_BASIN_N_MAP', 'NORTH_BASIN_NE_MAP', 'NORTH_BASIN_NE2_MAP', 'NORTH_BASIN_E2_MAP', 'NORTH_BASIN_E_MAP', 'NORTH_BASIN_ENVELOPE_C0RN1_MAP', 'NORTH_BASIN_ENVELOPE_C1RN1_MAP', 'NORTH_BASIN_ENVELOPE_C2RN1_MAP'],
  EASTERN_FENS_REGIONAL_CHUNK_DEFINITIONS: EASTERN_FENS,
  EASTERN_FENS_ENVELOPE_CHUNK_DEFINITIONS: EASTERN_FENS_ENVELOPE,
  GREAT_FEN_REGIONAL_CHUNK_DEFINITIONS: GREAT_FEN,
  GREAT_FEN_ENVELOPE_CHUNK_DEFINITIONS: GREAT_FEN_ENVELOPE,
  VALMERE_EXPANSE_REGIONAL_CHUNK_DEFINITIONS: VALMERE_EXPANSE,
  VALMERE_EXPANSE_ENVELOPE_CHUNK_DEFINITIONS: VALMERE_EXPANSE_ENVELOPE,
  EASTERN_SHORE_REGIONAL_CHUNK_DEFINITIONS: EASTERN_SHORE,
  EASTERN_SHORE_ENVELOPE_CHUNK_DEFINITIONS: EASTERN_SHORE_ENVELOPE,
  SOUTHERN_MORAINE_REGIONAL_CHUNK_DEFINITIONS: SOUTHERN_MORAINE,
  SOUTHERN_MORAINE_ENVELOPE_CHUNK_DEFINITIONS: SOUTHERN_MORAINE_ENVELOPE,
  MAINLAND_REGIONAL_CHUNK_DEFINITIONS: MAINLAND,
};

module.exports = {
  name: 'Regional chunk authoring: distributed fragments → resolved catalog, every grid inline',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Authored fragments collectively contain every placed map exactly once ───
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
    assert.deepEqual([...seenAcross.keys()].sort(), [...EXPECTED].sort(), 'the fragments collectively author exactly the placed maps');
    // merged definition list = the union, deduped, and coordinates unique
    assert.equal(g.run('_REGIONAL_CHUNK_DEFINITIONS.length'), EXPECTED.length, 'the merged _REGIONAL_CHUNK_DEFINITIONS has one definition per placed map');
    const defCoords = J("JSON.stringify(_REGIONAL_CHUNK_DEFINITIONS.map(function(d){return d.regionId+':'+d.chunkX+','+d.chunkY;}))");
    assert.equal(new Set(defCoords).size, EXPECTED.length, 'no chunk coordinate is authored in more than one fragment');

    // ── 3. The resolved runtime catalog has exactly the same entries ───────
    const ids = J('JSON.stringify(Object.keys(REGIONAL_CHUNK_CATALOG))');
    assert.equal(ids.length, EXPECTED.length, 'one resolved chunk record per placed map');
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
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'), EXPECTED.length, 'REGIONAL_LAYOUT places every catalogued chunk');
    assert.equal(g.run('Object.keys(OUTDOOR_CONTENT_KEYS).length'), EXPECTED.length, 'OUTDOOR_CONTENT_KEYS has one entry per placed map');

    // ── 5. Reverse map-ref → id and chunk-coordinate lookups remain correct ───
    for (const id of EXPECTED) {
      assert.equal(g.run(`mapIdForRef(REGIONAL_CHUNK_CATALOG['${id}'].map)`), id, `${id}: mapIdForRef(grid) round-trips`);
      const p = J(`JSON.stringify(regionPlacementForMapId('${id}'))`);
      assert.equal(g.run(`mapIdForChunk('${p.regionId}', ${p.chunkX}, ${p.chunkY})`), id, `${id}: mapIdForChunk resolves back`);
    }

    // ── 6 (7+8 of spec). Encounter-profile + item resolution preserve the exact
    //     existing pool-/item-array references ──────────────────────────────
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.MAP5.encounterPool===THORNMERE_SHORE_ENEMY_TEMPLATES"), true, "MAP5's 'thornmere_shore' profile resolves to the THORNMERE_SHORE_ENEMY_TEMPLATES reference");
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.MAP2.encounterPool===ENEMY_TEMPLATES"), true, "MAP2's 'reaches' profile resolves to ENEMY_TEMPLATES");
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.NORTH_BASIN_NW_MAP.encounterPool===UPPER_REACH_ENEMY_TEMPLATES"), true, "NB_NW's 'upper_reach' profile resolves to UPPER_REACH_ENEMY_TEMPLATES");
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.MAP5.items===MAP5_ITEMS"), true, "MAP5's 'map5' itemSet resolves to the MAP5_ITEMS reference");
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.MAP.items===WORLD_ITEMS"), true, "MAP's 'world' itemSet resolves to WORLD_ITEMS");
    // every resolved pool/items IS the registry array named by the definition
    assert.equal(g.run('_REGIONAL_CHUNK_DEFINITIONS.every(function(d){return REGIONAL_CHUNK_CATALOG[d.mapId].encounterPool===_ENCOUNTER_PROFILES[d.encounterProfileId];})'), true, 'every resolved encounterPool is the array named by its encounterProfileId');
    assert.equal(g.run('_REGIONAL_CHUNK_DEFINITIONS.every(function(d){return d.itemSetId===undefined || REGIONAL_CHUNK_CATALOG[d.mapId].items===_REGIONAL_ITEM_SETS[d.itemSetId];})'), true, 'every resolved items array is the array named by its itemSetId');

    // ── 9-of-spec (1-4,7). Completed migration: ALL 26 grids authored inline in
    //     their fragment records; no standalone grid var, no `map: MAP_ID` ref, no
    //     legacy window export; data.js holds derived aliases (for the 15 original
    //     original maps only) + no terrain rows. New regional chunks have NO alias.
    const SRC = {
      MAP: 'content/maps/calwick-maps.js',
      MAP2: 'content/maps/thornmere-wilds-maps.js', MAP3: 'content/maps/thornmere-wilds-maps.js',
      MAP4: 'content/maps/thornmere-wilds-maps.js', MAP5: 'content/maps/thornmere-wilds-maps.js',
      THORNMERE_NORTH_FEN_MAP: 'content/maps/thornmere-wilds-maps.js',
      THORNMERE_CANAL_HEAD_MAP: 'content/maps/thornmere-wilds-maps.js',
      THORNMERE_UPPER_SHALLOWS_MAP: 'content/maps/thornmere-wilds-maps.js',
      RODDON_WAY_MAP: 'content/maps/thornmere-wilds-maps.js', MAP3_N1: 'content/maps/thornmere-wilds-maps.js',
      MAP3_N2: 'content/maps/drenwick-maps.js', DRENWICK_EAST_CANAL_MAP: 'content/maps/drenwick-maps.js',
      DRENWICK_WEST_OUTFALL_MAP: 'content/maps/drenwick-maps.js',
      NORTH_BASIN_N_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_NE_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_NE2_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_E2_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_E_MAP: 'content/maps/north-basin-maps.js',
      MAP_N1: 'maps.js', MAP_N2: 'maps.js',
      NORTH_BASIN_S_MAP: 'content/maps/north-basin-maps.js', NORTH_BASIN_SE_MAP: 'content/maps/north-basin-maps.js', EAST_CAUSEWAY_MAP: 'content/maps/north-basin-maps.js', EASTERN_BANK_MAP: 'content/maps/north-basin-maps.js', NORTH_BASIN_C_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_SW_MAP: 'content/maps/north-basin-maps.js', NORTH_BASIN_MIREWOOD_MAP: 'content/maps/north-basin-maps.js', NORTH_BASIN_W_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_NW2_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_W2_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_NW_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_ENVELOPE_C0RN1_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_ENVELOPE_C1RN1_MAP: 'content/maps/north-basin-maps.js',
      NORTH_BASIN_ENVELOPE_C2RN1_MAP: 'content/maps/north-basin-maps.js',
      ...Object.fromEntries(EASTERN_FENS.map((id) => [id, 'content/maps/eastern-fens-maps.js'])),
      ...Object.fromEntries(EASTERN_FENS_ENVELOPE.map((id) => [id, 'content/maps/eastern-fens-maps.js'])),
      ...Object.fromEntries(GREAT_FEN.map((id) => [id, 'content/maps/great-fen-maps.js'])),
      ...Object.fromEntries(GREAT_FEN_ENVELOPE.map((id) => [id, 'content/maps/great-fen-maps.js'])),
      ...Object.fromEntries(VALMERE_EXPANSE.map((id) => [id, 'content/maps/valmere-expanse-maps.js'])),
      ...Object.fromEntries(VALMERE_EXPANSE_ENVELOPE.map((id) => [id, 'content/maps/valmere-expanse-maps.js'])),
      ...Object.fromEntries(EASTERN_SHORE.map((id) => [id, 'content/maps/eastern-shore-maps.js'])),
      ...Object.fromEntries(EASTERN_SHORE_ENVELOPE.map((id) => [id, 'content/maps/eastern-shore-maps.js'])),
      ...Object.fromEntries(SOUTHERN_MORAINE.map((id) => [id, 'content/maps/southern-moraine-maps.js'])),
      ...Object.fromEntries(SOUTHERN_MORAINE_ENVELOPE.map((id) => [id, 'content/maps/southern-moraine-maps.js'])),
      ...Object.fromEntries(MAINLAND.map(id=>[id,'content/maps/mainland-maps.js'])),
    };
    const readSrc = (rel) => fs.readFileSync(path.join(__dirname, '../../', rel), 'utf8');
    const curData = readSrc('data.js');
    const fileCache = {};
    for (const id of EXPECTED) {
      const file = SRC[id];
      const src = fileCache[file] || (fileCache[file] = readSrc(file));
      const inline = new RegExp(String.raw`["']?mapId["']?\s*:\s*["']${id}["'][\s\S]{0,1600}?["']?map["']?\s*:\s*\[`);
      assert.ok(inline.test(src), id + ': grid authored inline in its chunk definition record (' + file + ')');
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
    // Open Valmere deliberately shares pure-WATER scenery grids. Accessible
    // grids remain unique; no decorated/land grid may hide behind this exception.
    for(const fp of new Set(fpVals)){
      const ids=Object.keys(GRID_FP.fingerprints).filter(id=>GRID_FP.fingerprints[id]===fp);
      if(ids.length<2)continue;
      for(const id of ids){
        assert.equal(g.run(`mapPlayerAccessible('${id}')`),false,id+' duplicate is scenery');
        assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`),false);
        assert.equal(g.run(`mapRefForId('${id}').every(row=>row.every(tile=>tile===WATER))`),true,id+' duplicate is only open water');
        assert.equal(g.run(`EDGE_TRANSITIONS['${id}']===undefined`),true,id+' no walkable lake crossing');
      }
    }
    assert.deepEqual(Object.keys(GRID_FP.fingerprints).sort(), [...EXPECTED].sort(), 'fixture fingerprints exactly the placed regional grids');
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

    // MAP5 keeps its Thornmere shore pool despite the shared 'overworld' logical key
    assert.equal(g.run('REGIONAL_CHUNK_CATALOG.MAP5.contentKey'), 'overworld', 'MAP5 shares the ambiguous overworld content key');
    assert.equal(g.run("(function(){ placeAtLocation('MAP5', 4*TILE, 6*TILE); return currentEncounterPool()===THORNMERE_SHORE_ENEMY_TEMPLATES; })()"), true, 'MAP5 encounter pool is the Thornmere shore pool despite the shared overworld key');

    // Canonical position + v4 save/load resolve MAP5
    g.run("placeAtLocation('MAP5', 3.25*TILE, 6.5*TILE); player.facing='left';");
    assert.equal(J('JSON.stringify(regionalDerivedLocation())').mapId, 'MAP5', 'canonical position resolves MAP5');
    const saved = J("(saveGame(), localStorage.getItem('verdantVale_save'))");
    assert.equal(saved.location.kind, 'regional', 'MAP5 save is a regional v4 location');
    g.run("placeAtLocation('MAP', 1*TILE, 1*TILE); loadGame();");
    assert.equal(g.run('mapIdForRef(activeMap)'), 'MAP5', 'v4 regional load restores MAP5');

    // ── 9,11,13 of spec. Behaviour parity across the migrated maps ────────────
    assert.equal(g.run('continuousSeamEntries().length'), 1976, '1976 eligible directed segment entries');
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
