'use strict';

// Terrain-redesign pass, batch 3b (scenery half): the widening-channel /
// storm-influenced lakeward wetland band's scenery siblings (chunkX 13-16,
// chunkY 3-5). These were already mostly open water (correct for this band)
// but the rock/snag scatter read as noise. This batch clusters a few cells
// into believable Gravel Bar (128) shoal/sandbar features and gives each
// chunk a specific name instead of a repeated generic one. All six are
// scenery-only (playerAccessible:false, no seam) -- zero reachability risk.
// EASTERN_FENS_ENVELOPE_C16R4_MAP is name/notes-only (its existing Basin Mud
// bank already read fine); its fingerprint is UNCHANGED and the sweep below
// proves that explicitly.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const OLD_GRIDS = {
  EASTERN_FENS_ENVELOPE_C16R3_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,120,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,127,1,1,1,127,1,1,1,1],
    [1,1,1,1,1,1,121,1,120,23,1,127,1,127,1,1],
    [1,1,1,127,1,23,1,1,1,120,120,1,23,1,1,1],
    [1,1,1,1,1,121,1,1,1,120,127,127,1,120,120,1],
    [1,1,1,1,1,1,81,127,23,1,1,1,121,1,1,1],
    [1,121,1,1,1,127,81,81,1,1,121,1,1,1,1,1],
    [1,1,23,1,1,1,1,23,1,1,1,127,1,120,1,1],
    [1,1,1,127,1,1,1,1,1,1,120,121,1,1,1,1],
    [1,1,1,23,1,1,120,1,1,1,1,23,1,1,1,1],
    [1,1,1,127,120,1,1,120,127,23,1,1,1,1,1,1],
    [1,1,23,23,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,121,1,1,1,1,1,121,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C16R4_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,127,1,1,127,1,1],
    [1,1,1,1,1,1,1,1,127,127,1,1,127,1,1,1],
    [1,127,1,1,1,1,1,127,1,121,1,1,1,1,1,1],
    [1,127,1,1,1,121,127,1,1,1,127,127,121,1,1,1],
    [1,1,1,1,1,1,1,1,127,1,1,1,1,1,1,1],
    [1,1,127,1,127,1,1,127,1,1,1,1,1,1,127,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,81,1],
    [1,81,121,81,81,81,81,121,81,81,81,81,81,81,81,1],
    [1,1,1,23,23,1,1,1,1,23,1,1,1,1,23,1],
    [1,1,1,121,1,1,1,23,1,1,1,121,1,1,1,1],
    [1,23,1,23,1,1,1,23,23,121,1,1,23,1,121,1],
    [1,1,1,121,1,1,1,1,1,23,1,1,23,1,1,1],
    [1,1,1,1,1,23,1,23,1,1,23,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C13R5_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,127,1,1,1,1,1,1,1,1,1,127,1,127,1,1],
    [1,1,127,1,1,1,1,127,1,1,127,1,1,1,127,1],
    [1,127,1,1,1,1,121,1,1,127,1,1,1,1,1,1],
    [1,1,1,1,1,127,1,1,1,1,1,1,127,1,1,1],
    [1,1,1,1,1,121,1,1,1,1,1,1,1,127,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,121,81,81,1],
    [1,121,81,81,81,81,81,81,81,81,121,81,81,81,81,1],
    [1,1,1,1,1,1,1,1,1,23,1,1,23,23,1,1],
    [1,1,1,23,1,1,1,1,1,1,23,121,1,1,1,1],
    [1,1,1,1,1,23,23,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,23,1,1,23,23,1,1,1,1,23,23,1],
    [1,1,23,1,1,1,1,1,1,1,1,1,23,1,1,1],
    [1,1,1,1,1,1,1,1,121,1,1,1,1,1,121,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C14R5_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,127,1,1,1],
    [1,1,1,127,127,1,1,1,1,120,1,1,1,120,1,1],
    [1,1,1,1,1,1,127,1,1,1,120,1,121,121,1,1],
    [1,1,127,1,1,127,1,120,1,1,1,1,120,120,1,1],
    [1,1,1,127,1,127,1,121,1,120,121,1,1,1,1,1],
    [1,120,127,1,1,1,120,1,1,1,1,1,1,1,1,1],
    [1,127,1,1,1,1,1,88,0,1,1,1,1,1,1,1],
    [1,1,1,1,121,1,127,0,88,120,1,1,1,1,1,1],
    [1,1,1,1,1,1,23,23,23,23,127,120,1,1,127,1],
    [1,1,121,127,1,1,1,121,127,1,1,1,127,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,120,1,1],
    [1,1,1,127,1,1,1,120,1,1,1,127,1,1,1,1],
    [1,1,1,1,120,1,1,1,127,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C15R5_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,120,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,120,1,127,1,1,127,1,1,1,23,1,1],
    [1,1,127,120,121,23,1,1,23,1,127,1,1,1,1,1],
    [1,1,127,1,1,1,1,127,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,81,127,23,1,121,127,1,1,1,1,1],
    [1,1,23,1,1,81,81,121,121,1,23,1,127,1,1,1],
    [1,1,1,1,1,1,1,1,23,127,121,120,23,1,1,1],
    [1,120,23,23,1,1,121,1,1,1,1,121,1,1,121,1],
    [1,1,1,1,1,1,1,1,23,120,1,127,23,1,1,1],
    [1,1,1,1,1,1,1,120,1,1,23,1,1,23,1,1],
    [1,1,1,1,1,1,1,1,127,127,1,1,1,1,1,1],
    [1,1,1,1,127,120,1,1,1,23,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,120,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C16R5_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,121,1,1,1,1,1,1,1],
    [1,1,120,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,23,1,1,1,23,1,1,121,1,1,120,121,1],
    [1,1,1,1,1,1,1,23,1,120,121,1,1,1,1,1],
    [1,1,1,1,1,1,1,121,1,1,1,127,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,120,1,1,1,1,1,1],
    [1,1,1,1,1,121,81,127,1,1,120,1,1,1,1,1],
    [1,1,1,1,1,1,81,81,1,1,1,127,1,1,1,1],
    [1,1,1,23,1,1,1,1,1,1,1,1,1,120,1,1],
    [1,1,1,23,1,1,1,23,1,1,1,23,1,1,1,1],
    [1,120,1,1,120,1,1,1,1,1,1,120,1,1,1,1],
    [1,1,127,1,1,1,1,120,1,1,1,121,1,1,1,1],
    [1,1,1,1,1,1,1,120,1,1,1,1,121,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
};
const OLD_FP = {
  EASTERN_FENS_ENVELOPE_C16R3_MAP: 'e4fa11ac63491833dc7939a95ab5707c138f624198e3ae2321d77b70fa373c94',
  EASTERN_FENS_ENVELOPE_C16R4_MAP: '2d71409732a6299a0c5f3e1d8c470c44541e6c7856375469ce290091c5a9e245',
  EASTERN_FENS_ENVELOPE_C13R5_MAP: 'd3f5ea1abd654780e98810c5a0d3494beee13c1e7fb6eaf9a6e68ef319128c42',
  EASTERN_FENS_ENVELOPE_C14R5_MAP: '9cd66b2da22e9ede0651878d49e3659e480b2e9558bd9d810e92eedbbb2c9e99',
  EASTERN_FENS_ENVELOPE_C15R5_MAP: 'c26215511a342b75439a248de4c2d22359aa9e5e3c474fff8fbbc48bfc71c1c9',
  EASTERN_FENS_ENVELOPE_C16R5_MAP: '5e17200151085a2ba705ec7ad783ba8737c7d2564e5424cac68f1561111bf76c',
};
const CHANGED_IDS = ['EASTERN_FENS_ENVELOPE_C16R3_MAP', 'EASTERN_FENS_ENVELOPE_C13R5_MAP', 'EASTERN_FENS_ENVELOPE_C14R5_MAP', 'EASTERN_FENS_ENVELOPE_C15R5_MAP', 'EASTERN_FENS_ENVELOPE_C16R5_MAP'];
const UNCHANGED_ID = 'EASTERN_FENS_ENVELOPE_C16R4_MAP';
const ALL_IDS = [...CHANGED_IDS, UNCHANGED_ID];

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens terrain redesign: storm shoals (batch 3b scenery) — old grids proved by hash, changed grids proved by hash, the untouched one proved byte-identical',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. Every old grid hashes to its recorded OLD_FP.
    for (const id of ALL_IDS) {
      assert.equal(sha256(JSON.stringify(OLD_GRIDS[id])), OLD_FP[id], `${id}: recorded OLD_FP matches the literal prior grid`);
    }

    // 2. The five changed chunks: current hash matches the updated fixture,
    //    and the grid actually differs from before.
    for (const id of CHANGED_IDS) {
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      assert.equal(sha256(current), GRID_FP.fingerprints[id], `${id}: current grid matches the updated fingerprint`);
      assert.notEqual(current, JSON.stringify(OLD_GRIDS[id]), `${id}: grid actually changed`);
      assert.ok(g.run(`REGIONAL_CHUNK_CATALOG['${id}'].map.some(function(row){return row.includes(GRAVEL_BAR);})`), `${id} uses the new Gravel Bar shoal tile`);
    }

    // 3. The one name-only chunk: grid is byte-identical, fingerprint
    //    unchanged -- proves the "no tile edit" claim rather than asserting it blind.
    const unchangedCurrent = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${UNCHANGED_ID}'].map)`);
    assert.equal(unchangedCurrent, JSON.stringify(OLD_GRIDS[UNCHANGED_ID]), `${UNCHANGED_ID}: grid is byte-identical to before`);
    assert.equal(sha256(unchangedCurrent), OLD_FP[UNCHANGED_ID], `${UNCHANGED_ID}: fingerprint unchanged`);
    assert.equal(GRID_FP.fingerprints[UNCHANGED_ID], OLD_FP[UNCHANGED_ID], `${UNCHANGED_ID}: fixtures file still records the original fingerprint`);

    // 4. All six stay scenery-only at the time of this batch: unreachable, no
    //    seam. EASTERN_FENS_ENVELOPE_C15R5_MAP was later converted into the
    //    Southern Moraine's entry chunk (a separate, later increment) and is
    //    excluded from this specific check; its storm-shoal grid/fingerprint
    //    claims above are unaffected since only its EDGE_TRANSITIONS/
    //    playerAccessible metadata changed, not its terrain content.
    for (const id of ALL_IDS) {
      if (id === 'EASTERN_FENS_ENVELOPE_C15R5_MAP') continue;
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), false, `${id} stays scenery-only`);
      assert.deepEqual(J(`JSON.stringify(Object.keys(EDGE_TRANSITIONS['${id}']||{}))`), [], `${id} has no seam`);
    }

    // 5. Every chunk NOT in this batch keeps its exact recorded fingerprint.
    const touched = new Set(CHANGED_IDS); // the unchanged one was never actually re-fingerprinted
    let swept = 0;
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      if (touched.has(id)) continue;
      swept++;
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'] ? REGIONAL_CHUNK_CATALOG['${id}'].map : (MAP_CATALOG['${id}'] && MAP_CATALOG['${id}'].map))`);
      assert.equal(sha256(current), fp, `${id}: untouched fingerprint unchanged`);
    }
    assert.equal(swept, Object.keys(GRID_FP.fingerprints).length - CHANGED_IDS.length);

    // 6. General validation unaffected.
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0);
  },
};
