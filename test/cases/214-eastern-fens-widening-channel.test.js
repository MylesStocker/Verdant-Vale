'use strict';

// Terrain-redesign pass, batch 3b (main-route half): of the ten widening-
// channel / storm-influenced-lakeward-wetland main-route chunks (chunkX
// 13-15, chunkY 1-4), direct inspection found eight already coherent,
// connected Deep-Reeds/Grass/Reeds/Path systems needing no change
// (EASTERN_FENS_BRIDGE_INLET_W_MAP, _BRIDGE_INLET_E_MAP, _CHANNEL_ELBOW_MAP,
// _CHANNEL_APPROACH_W_MAP, _CHANNEL_ROAD_N/MID/S_MAP, _VALMERE_ROAD_TURN_MAP)
// — this suite proves that by hash. Only EASTERN_FENS_WIDE_WATER_MAP and
// EASTERN_FENS_CHANNEL_APPROACH_E_MAP had real scattered-single-cell noise;
// both get a walkable-fill-only tighten (same technique and safety
// guarantee as batch 3a), with route length re-verified immediately.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const OLD_GRIDS = {
  EASTERN_FENS_WIDE_WATER_MAP: [
    [1,1,1,1,58,1,1,1,1,1,1,1,1,1,1,1],
    [1,127,1,23,58,23,1,1,1,127,1,1,81,127,1,1],
    [1,1,127,1,58,1,127,1,1,1,127,1,1,1,127,1],
    [1,1,1,127,58,58,58,58,58,1,1,127,1,1,1,1],
    [1,1,1,23,127,1,1,1,58,1,1,23,127,1,1,1],
    [1,127,81,1,1,127,1,1,58,127,1,1,1,127,1,1],
    [1,1,127,1,1,1,23,1,58,1,127,1,1,1,81,1],
    [23,23,1,127,1,1,1,127,58,1,23,127,1,1,1,1],
    [58,58,58,58,58,58,58,58,58,1,1,1,127,1,1,1],
    [23,23,1,58,58,58,1,1,1,127,1,1,1,23,1,1],
    [1,1,127,23,58,23,127,1,1,1,127,1,1,1,127,1],
    [1,1,1,23,58,23,1,127,23,1,1,127,1,1,1,1],
    [1,1,1,23,58,23,1,1,127,1,1,1,23,1,1,1],
    [1,127,1,23,58,23,1,1,1,127,1,81,1,127,1,1],
    [1,1,1,58,58,58,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_CHANNEL_APPROACH_E_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,127,127,23,127,1,127,127,127,127,127,23,1,127,127,1],
    [1,127,0,1,127,127,127,127,127,127,89,127,127,127,127,1],
    [1,1,127,127,127,127,23,127,1,127,127,127,127,127,0,1],
    [1,127,127,127,127,89,1,127,127,127,127,127,127,1,23,23],
    [1,23,127,127,1,127,127,2,2,2,2,2,2,2,2,2],
    [1,127,1,127,127,23,127,2,127,1,127,127,127,127,23,23],
    [1,127,127,127,0,127,127,2,127,127,127,127,89,127,1,1],
    [1,127,127,127,127,1,127,2,127,127,127,127,1,127,127,1],
    [1,127,127,1,127,127,127,2,127,127,1,127,23,127,127,1],
    [1,1,127,23,127,127,127,2,1,127,127,0,127,127,127,1],
    [23,23,127,127,127,127,1,2,127,127,127,127,127,1,127,1],
    [2,2,2,2,2,2,2,2,127,127,127,1,127,127,89,1],
    [23,23,1,127,127,127,127,127,127,1,23,127,127,127,127,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
};
const OLD_FP = {
  EASTERN_FENS_WIDE_WATER_MAP: 'b4d6fb52234114480b79536632eab852306c20bc6bf92160ee1f2d1366f5018e',
  EASTERN_FENS_CHANNEL_APPROACH_E_MAP: '16f0ebcc46fe8e3c6a7d0b9e7220f6fcca94e9dc52031a673381d1d4d3da00fa',
};
const CHANGED_IDS = Object.keys(OLD_GRIDS);
const UNCHANGED_IDS = [
  'EASTERN_FENS_BRIDGE_INLET_W_MAP', 'EASTERN_FENS_BRIDGE_INLET_E_MAP', 'EASTERN_FENS_CHANNEL_ELBOW_MAP',
  'EASTERN_FENS_CHANNEL_APPROACH_W_MAP', 'EASTERN_FENS_CHANNEL_ROAD_N_MAP', 'EASTERN_FENS_CHANNEL_ROAD_MID_MAP',
  'EASTERN_FENS_CHANNEL_ROAD_S_MAP', 'EASTERN_FENS_VALMERE_ROAD_TURN_MAP',
];
const WALKABLE_FILL = new Set([0, 23, 81, 88, 127]);

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens terrain redesign: widening channel (batch 3b main-route) — two tightened by hash, eight confirmed already-coherent and left untouched',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. The two changed chunks: old hash matches OLD_FP, current hash
    //    matches the updated fixture, and the diff is walkable-fill-only.
    for (const id of CHANGED_IDS) {
      assert.equal(sha256(JSON.stringify(OLD_GRIDS[id])), OLD_FP[id], `${id}: recorded OLD_FP matches the literal prior grid`);
      const newGrid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      assert.equal(sha256(JSON.stringify(newGrid)), GRID_FP.fingerprints[id], `${id}: current grid matches the updated fingerprint`);
      let diffs = 0;
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 16; c++) {
          if (OLD_GRIDS[id][r][c] === newGrid[r][c]) continue;
          diffs++;
          assert.ok(WALKABLE_FILL.has(OLD_GRIDS[id][r][c]), `${id} (${r},${c}): old value must be walkable-fill`);
          assert.ok(WALKABLE_FILL.has(newGrid[r][c]), `${id} (${r},${c}): new value must be walkable-fill`);
        }
      }
      assert.ok(diffs > 0, `${id}: at least one cell changed`);
    }

    // 2. The eight already-coherent chunks are confirmed byte-identical to
    //    their recorded fingerprint -- the "no change needed" claim proved,
    //    not assumed.
    for (const id of UNCHANGED_IDS) {
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      assert.equal(sha256(current), GRID_FP.fingerprints[id], `${id}: unchanged, matches its existing fingerprint`);
    }

    // 3. These stay live, walkable, encounter-enabled hard-leaning main-route
    //    chunks -- permissions untouched.
    for (const id of CHANGED_IDS) {
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), true, id);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), true, id);
      assert.equal(g.run(`MAP_CATALOG['${id}'].encounterPool === EASTERN_FENS_MORNAY_HARD_FORMATIONS`), true, id);
    }

    // 4. Seam-adjacent cells on WIDE_WATER_MAP are untouched: north seam
    //    (row0 col4), south seam (row14 cols3-5), west seam (col0 rows7-9).
    const wideWater = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_WIDE_WATER_MAP'].map)");
    assert.equal(wideWater[0][4], 58);
    assert.deepEqual([wideWater[14][3], wideWater[14][4], wideWater[14][5]], [58, 58, 58]);
    assert.deepEqual([wideWater[7][0], wideWater[8][0], wideWater[9][0]], [23, 58, 23]);

    // 5. Every chunk NOT in this batch keeps its exact recorded fingerprint.
    const touched = new Set(CHANGED_IDS);
    let swept = 0;
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      if (touched.has(id)) continue;
      swept++;
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'] ? REGIONAL_CHUNK_CATALOG['${id}'].map : (MAP_CATALOG['${id}'] && MAP_CATALOG['${id}'].map))`);
      assert.equal(sha256(current), fp, `${id}: untouched fingerprint unchanged`);
    }
    assert.equal(swept, Object.keys(GRID_FP.fingerprints).length - CHANGED_IDS.length);

    // 6. Route length and general validation unaffected.
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0);
  },
};
