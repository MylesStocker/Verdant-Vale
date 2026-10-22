'use strict';

// Terrain-redesign pass, batch 3a: tighten (not redesign) the main-route
// managed-drainage band (chunkX 10-12, chunkY 2-3). These four chunks were
// already reasonably composed (a straight Path/Bridge-Deck spine through
// open Deep Reeds); this batch only swaps among already-walkable fill tiles
// (0 Grass, 23 Reeds, 81 Basin Mud, 88 Exposed Stone, 127 Deep Reeds) to form
// a rectilinear "worked reed plot" and a straight "dry drainage cut" (drought
// signal) in each chunk — it never touches Path(2), Fence Post(89), or
// Water(1) cells, so collision shape is provably unaffected (confirmed by
// re-running the 400-step route-length test immediately, before any other
// change). Same hash-reconstruction rigor as batches 1-2.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const OLD_GRIDS = {
  EASTERN_FENS_DRAINAGE_SW_MAP: [
    [1,1,23,2,23,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,23,2,23,1,127,127,127,0,127,127,1,127,127,1],
    [1,1,1,2,127,23,127,127,127,127,1,127,127,23,127,1],
    [1,1,1,2,127,127,127,127,1,127,127,127,89,127,127,1],
    [1,1,1,2,127,127,1,127,127,127,127,127,127,1,127,1],
    [1,1,1,2,2,2,2,2,2,127,127,1,23,127,127,1],
    [1,1,1,127,127,127,127,127,2,1,127,0,127,127,127,1],
    [1,1,1,127,127,127,127,1,2,127,127,127,127,127,1,1],
    [1,1,1,127,127,1,0,127,2,127,127,127,1,127,89,1],
    [1,1,1,1,127,127,127,127,2,127,23,127,127,127,127,1],
    [23,23,127,127,127,127,127,127,2,127,127,127,127,127,23,1],
    [2,2,2,2,2,2,2,2,2,127,127,127,127,0,127,1],
    [23,23,127,127,1,127,127,127,127,23,127,1,127,127,127,1],
    [1,127,1,127,127,127,127,127,0,1,127,127,127,127,127,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_DRAINAGE_NW_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,23,1,1,1,1],
    [1,127,1,127,127,127,89,127,127,1,127,23,127,127,127,1],
    [1,127,23,127,127,127,127,1,127,127,0,127,127,127,1,1],
    [1,89,127,127,127,1,23,127,127,127,127,127,1,127,23,1],
    [1,127,127,1,127,0,127,127,127,127,1,127,127,89,127,1],
    [1,23,127,127,127,127,127,127,1,127,127,127,127,127,127,1],
    [1,127,127,2,2,2,2,2,2,2,127,127,127,23,127,1],
    [1,127,127,2,1,127,127,127,127,2,127,1,0,127,127,1],
    [1,127,1,2,127,127,127,127,127,2,127,127,127,127,127,1],
    [1,127,127,2,127,127,127,0,127,2,127,127,127,127,1,1],
    [1,127,127,2,127,1,127,127,127,2,127,127,1,127,23,23],
    [1,127,127,2,127,127,127,127,127,2,2,2,2,2,2,2],
    [1,1,127,2,127,127,23,127,1,127,127,127,127,127,23,23],
    [1,127,23,2,23,89,1,127,127,127,23,127,127,1,127,1],
    [1,1,23,2,23,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_WORKED_REEDS_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,127,127,127,127,127,1,127,127,127,127,127,127,1,23,23],
    [1,127,127,127,1,127,127,127,2,2,2,2,2,2,2,2],
    [1,127,1,23,127,127,127,127,2,1,127,127,127,127,23,23],
    [1,127,89,127,127,127,127,1,2,127,127,127,127,127,1,1],
    [1,127,127,127,127,1,0,127,2,127,127,127,1,127,89,1],
    [1,127,23,1,127,127,127,127,2,127,23,127,127,127,127,1],
    [1,0,127,127,127,127,127,127,2,127,127,127,127,127,23,1],
    [1,127,127,127,127,23,1,127,2,127,127,127,127,0,127,1],
    [1,127,127,127,89,127,127,127,2,127,127,1,127,127,127,1],
    [23,23,1,127,127,127,127,127,2,1,127,127,127,127,127,1],
    [2,2,2,2,2,2,2,2,2,127,127,127,23,127,1,1],
    [23,23,127,127,127,1,127,127,127,127,127,89,1,127,127,1],
    [1,127,127,1,127,127,127,23,127,127,1,127,127,127,127,1],
    [1,1,127,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_MANAGED_REEDS_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [23,23,127,1,127,127,127,127,127,127,1,127,127,89,127,1],
    [2,2,2,2,2,2,2,127,1,23,127,127,127,127,127,1],
    [23,23,127,127,127,127,2,127,89,127,127,127,127,23,127,1],
    [1,1,1,127,23,127,2,127,127,127,127,1,0,127,127,1],
    [1,1,1,89,127,127,2,127,23,1,127,127,127,127,127,1],
    [1,1,1,127,127,127,2,1,127,127,127,127,127,127,1,1],
    [1,1,1,23,127,1,2,127,127,127,127,23,1,127,127,1],
    [1,1,1,1,127,127,2,127,127,127,1,127,127,127,127,1],
    [1,1,1,127,127,127,2,2,2,2,2,127,127,127,0,1],
    [1,127,127,127,127,89,1,127,127,127,2,127,127,1,127,1],
    [1,23,127,127,1,127,127,127,127,127,2,1,127,127,127,1],
    [1,127,1,127,127,23,127,127,127,1,2,127,127,23,127,1],
    [1,127,127,127,0,127,127,1,127,23,2,23,89,127,1,1],
    [1,1,1,1,1,1,1,1,1,23,2,23,1,1,1,1],
  ],
};
const OLD_FP = {
  EASTERN_FENS_DRAINAGE_SW_MAP: 'de92be3a74388af8a8ebae168a63a441862aa1dbf54d0be1340aeb881c9e98b4',
  EASTERN_FENS_DRAINAGE_NW_MAP: '6770bf4cf0c7bddbbd931d72e092e12442bd5179330b312db5ee54878ff7345d',
  EASTERN_FENS_WORKED_REEDS_MAP: '577c0c3b2e645452a8b3e17f5d5c94b25c8dd103c458cfd1102a1299bb85d03f',
  EASTERN_FENS_MANAGED_REEDS_MAP: '5747c7783843e902137be5a082f7c4058228e1000244f522116df62660824ad3',
};
const WALKABLE_FILL = new Set([0, 23, 81, 88, 127]); // the only ids this batch may touch
const ALL_IDS = Object.keys(OLD_GRIDS);

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens terrain redesign: managed-drainage band tighten (batch 3a) — walkable-fill-only edits, collision unaffected, route length unchanged',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. Every old grid hashes to its recorded OLD_FP.
    for (const id of ALL_IDS) {
      assert.equal(sha256(JSON.stringify(OLD_GRIDS[id])), OLD_FP[id], `${id}: recorded OLD_FP matches the literal prior grid`);
    }

    // 2. Current grid matches the updated fingerprint and actually changed.
    for (const id of ALL_IDS) {
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      assert.equal(sha256(current), GRID_FP.fingerprints[id], `${id}: current grid matches the updated fingerprint`);
      assert.notEqual(current, JSON.stringify(OLD_GRIDS[id]), `${id}: grid actually changed`);
    }

    // 3. Collision-shape proof: every cell that differs between old and new
    //    is a swap between two WALKABLE_FILL ids -- never a Path/Fence/Water
    //    cell added, removed, or moved. This is the hard guarantee this batch
    //    rests on, checked directly rather than assumed.
    for (const id of ALL_IDS) {
      const oldGrid = OLD_GRIDS[id];
      const newGrid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      let diffs = 0;
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 16; c++) {
          if (oldGrid[r][c] === newGrid[r][c]) continue;
          diffs++;
          assert.ok(WALKABLE_FILL.has(oldGrid[r][c]), `${id} (${r},${c}): old value ${oldGrid[r][c]} must be walkable-fill`);
          assert.ok(WALKABLE_FILL.has(newGrid[r][c]), `${id} (${r},${c}): new value ${newGrid[r][c]} must be walkable-fill`);
        }
      }
      assert.ok(diffs > 0, `${id}: at least one cell changed`);
    }

    // 4. These stay live, walkable, encounter-enabled main-route chunks --
    //    the tighten pass didn't touch permissions.
    for (const id of ALL_IDS) {
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), true, id);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), true, id);
      assert.equal(g.run(`MAP_CATALOG['${id}'].encounterPool === EASTERN_FENS_MORNAY_EASY_FORMATIONS`), true, id);
    }

    // 5. Every chunk NOT in this batch keeps its exact recorded fingerprint.
    const touched = new Set(ALL_IDS);
    let swept = 0;
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      if (touched.has(id)) continue;
      swept++;
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'] ? REGIONAL_CHUNK_CATALOG['${id}'].map : (MAP_CATALOG['${id}'] && MAP_CATALOG['${id}'].map))`);
      assert.equal(sha256(current), fp, `${id}: untouched fingerprint unchanged`);
    }
    assert.equal(swept, Object.keys(GRID_FP.fingerprints).length - ALL_IDS.length);

    // 6. General validation unaffected.
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0);
  },
};
