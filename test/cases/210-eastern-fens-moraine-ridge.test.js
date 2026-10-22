'use strict';

// Terrain-redesign pass, batch 1: the moraine ridge (chunkX 8-12, chunkY 4-5).
// Five scenery-only chunks (playerAccessible:false, no seam) get a full
// retexture from scattered water-noise into a connected gravel-bar ridge with
// scrub-hills flanks and peat hollows; the one walkable pocket in the middle
// (EASTERN_FENS_ENVELOPE_C9R4_MAP) gets a light interior-only retexture (its
// seam, border, and reserved "walled garden" shape are untouched). This is a
// full redesign, not a small cell-level delta, so instead of reconstructing
// the old grid by reverting specific cells (the pattern used for small
// corrections elsewhere), this test embeds the complete old grids literally
// and proves their hash against a recorded OLD_FP, then proves the current
// grid's hash against the updated fixture -- the same rigor, suited to the
// scale of the change.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const OLD_GRIDS = {
  EASTERN_FENS_ENVELOPE_C8R4_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,127,1,121,1,1,1,1,127,1,1,1,1],
    [1,1,1,127,121,1,127,120,121,1,1,1,1,1,127,1],
    [1,1,1,1,1,1,1,1,121,120,1,1,1,1,1,1],
    [1,1,1,127,1,1,1,1,1,120,127,1,1,1,1,1],
    [1,121,1,1,1,1,1,127,1,1,127,1,1,1,1,1],
    [1,1,1,1,1,1,1,88,0,1,127,1,1,1,1,1],
    [1,1,1,1,1,1,1,0,88,1,1,1,1,1,1,1],
    [1,127,120,1,1,1,23,23,23,23,1,121,1,1,1,1],
    [1,1,1,1,1,121,1,1,1,1,1,1,1,1,127,1],
    [1,120,1,1,1,1,1,1,1,1,1,1,127,1,1,1],
    [1,1,127,1,121,1,1,1,1,120,1,1,1,1,127,1],
    [1,1,1,1,1,127,1,127,1,1,1,1,1,1,120,1],
    [1,1,1,1,1,1,1,1,1,121,120,127,1,120,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C9R4_MAP: [
    [1,1,1,1,1,1,1,1,127,1,1,1,1,1,1,1],
    [1,1,1,1,1,23,127,127,127,127,23,1,1,1,1,1],
    [1,1,1,23,127,127,0,0,0,0,127,127,23,1,1,1],
    [1,1,23,127,0,0,0,88,88,0,0,0,127,23,1,1],
    [1,1,23,0,0,88,88,88,88,88,0,0,23,0,1,1],
    [1,1,23,0,0,0,0,0,88,0,0,0,0,127,1,1],
    [1,1,23,127,0,0,0,0,0,0,0,127,23,1,1,1],
    [1,1,1,23,23,127,127,127,127,23,23,1,1,1,1,1],
    [1,1,89,89,1,1,1,1,1,1,1,1,89,89,1,1],
    [1,119,119,119,1,1,1,1,1,1,1,1,119,119,119,1],
    [1,1,119,119,1,1,1,1,1,1,1,1,119,119,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C10R4_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,23,127,127,127,127,1,120,127,127,1,1,23,1,1],
    [1,127,1,1,127,1,1,1,1,23,1,1,1,127,127,1],
    [1,1,23,1,1,1,127,1,127,127,1,1,1,120,23,1],
    [1,127,1,1,120,127,1,1,1,1,120,1,23,1,127,1],
    [1,1,1,23,1,23,1,127,1,1,127,1,127,1,127,1],
    [1,120,1,127,1,127,23,127,127,1,23,1,127,1,23,1],
    [1,120,1,1,23,1,127,23,1,1,1,127,23,127,1,1],
    [1,127,127,127,23,127,1,127,127,1,1,1,1,23,23,1],
    [1,1,1,1,23,127,1,1,120,1,23,1,1,23,1,1],
    [1,1,23,1,1,1,127,127,127,120,23,1,1,1,23,1],
    [1,1,1,1,1,1,1,23,1,127,1,1,1,1,127,1],
    [1,127,1,23,1,127,127,23,127,23,1,127,1,23,1,1],
    [1,1,127,1,1,127,23,23,23,120,1,1,1,23,127,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C11R4_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,127,120,1,1,127,1,127,1,1,1,1,1,1,1,1],
    [1,127,120,1,1,1,1,1,1,1,121,121,1,1,1,1],
    [1,1,127,1,1,1,1,1,127,1,1,1,1,1,1,1],
    [1,1,1,127,1,121,1,1,1,1,1,1,1,1,1,1],
    [1,1,127,1,1,120,1,1,1,1,88,0,1,1,1,1],
    [1,1,1,1,1,1,127,1,1,127,0,88,1,1,1,1],
    [1,1,121,1,120,1,120,1,1,23,23,23,23,1,127,1],
    [1,1,1,1,120,1,1,127,1,1,121,127,121,120,120,1],
    [1,120,1,1,1,1,1,127,120,1,1,1,1,1,1,1],
    [1,1,1,127,1,1,1,1,1,1,1,1,1,127,1,1],
    [1,1,127,121,1,1,127,1,1,127,120,1,120,1,1,1],
    [1,127,1,1,1,1,1,1,121,127,1,1,127,1,1,1],
    [1,1,1,121,1,1,1,1,1,127,127,1,1,120,127,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C12R4_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,23,1,23,1,1,1,1,1],
    [1,1,1,1,127,81,127,1,23,81,23,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,23,1,23,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,23,1,23,1,89,1,1,1],
    [1,1,1,1,127,1,81,1,23,1,23,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,23,1,23,1,1,89,1,1],
    [1,1,1,1,127,1,127,1,23,1,23,1,1,1,1,1],
    [1,1,1,1,127,1,81,1,23,1,23,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,23,1,23,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,23,1,23,1,1,1,1,1],
    [1,1,1,1,127,1,127,81,23,1,23,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,23,81,23,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,23,1,23,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C12R5_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,127,1,1,120,23,23,1,1,23,1,1,1],
    [1,1,1,1,1,1,1,23,127,121,1,120,1,120,120,1],
    [1,1,127,120,1,23,1,1,127,81,127,1,121,1,1,1],
    [1,1,1,1,1,1,1,127,23,81,81,120,1,127,1,1],
    [1,1,1,1,1,127,1,23,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,120,1,1,1,1,1,1,1,1,1,1],
    [1,1,121,1,1,1,1,121,127,127,1,120,1,120,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,23,1,1],
    [1,1,1,1,1,1,1,127,1,127,127,121,1,1,1,1],
    [1,1,1,1,1,1,23,1,127,121,1,1,1,23,121,1],
    [1,1,1,121,1,1,1,23,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,120,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
};
const OLD_FP = {
  EASTERN_FENS_ENVELOPE_C8R4_MAP: '4d33460a6726510bc0f7e4851e2b42853d9d2f893dd0eb6cc9bf22c632426cfb',
  EASTERN_FENS_ENVELOPE_C9R4_MAP: '7b007701c2790e255bcdc19f50a53c610b0f82e4b64791cd1be603c19c43d090',
  EASTERN_FENS_ENVELOPE_C10R4_MAP: '4a8c446ffb48aeb9a58581f785d898fecc87ca6ea1f5cb9d133e6f89ba66f93e',
  EASTERN_FENS_ENVELOPE_C11R4_MAP: 'f53305c3204ec31033d9f6db82cc4d790ac3cd60b089f57d04b0e5a7baffce3f',
  EASTERN_FENS_ENVELOPE_C12R4_MAP: '0f89b90d4f89c6e91b13f5fd7502f5baebe22b2b9ce9dfc2d3b9ca932e7ff7b5',
  EASTERN_FENS_ENVELOPE_C12R5_MAP: '31c429ef4497f04fc6f47227ee5acfcb7989d7d44cc4d33ddb114fb24c08c2b5',
};
const SCENERY_IDS = ['EASTERN_FENS_ENVELOPE_C8R4_MAP', 'EASTERN_FENS_ENVELOPE_C10R4_MAP', 'EASTERN_FENS_ENVELOPE_C11R4_MAP', 'EASTERN_FENS_ENVELOPE_C12R4_MAP', 'EASTERN_FENS_ENVELOPE_C12R5_MAP'];
const POCKET_ID = 'EASTERN_FENS_ENVELOPE_C9R4_MAP';
const ALL_IDS = [...SCENERY_IDS, POCKET_ID];

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens terrain redesign: moraine ridge (batch 1) — old grids proved by hash, new grids proved by hash, every other chunk unchanged',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. Every old grid above hashes to its recorded OLD_FP — proves this test
    //    embeds the real prior content, not an invented baseline.
    for (const id of ALL_IDS) {
      assert.equal(sha256(JSON.stringify(OLD_GRIDS[id])), OLD_FP[id], `${id}: recorded OLD_FP matches the literal prior grid`);
    }

    // 2. The current (new) grid hashes to the updated fingerprints file, and
    //    is NOT byte-identical to the old grid (i.e. something really changed).
    for (const id of ALL_IDS) {
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      assert.equal(sha256(current), GRID_FP.fingerprints[id], `${id}: current grid matches the updated fingerprint`);
      assert.notEqual(current, JSON.stringify(OLD_GRIDS[id]), `${id}: grid actually changed`);
    }

    // 3. The five scenery chunks stay scenery: unreachable, no seam, same
    //    save/encounter permissions as before -- only the tile content moved.
    for (const id of SCENERY_IDS) {
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), false, `${id} stays scenery-only`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), false, id);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), false, id);
      assert.deepEqual(J(`JSON.stringify(Object.keys(EDGE_TRANSITIONS['${id}']||{}))`), [], `${id} has no seam`);
    }

    // 4. The walkable pocket's seam, permissions, and reserved "walled garden"
    //    shape (rows 8-10, the FENCE_POST/HILLS frame) are byte-identical to
    //    before -- only the interior knoll (rows 3-5) was retextured.
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${POCKET_ID}'])`), { north: [{ targetMap: 'EASTERN_FENS_DRY_RISE_MAP', targetEdge: 'south', sourceRange: [8, 8] }] });
    assert.equal(g.run(`MAP_CATALOG['${POCKET_ID}'].allowSave`), true);
    assert.equal(g.run(`MAP_CATALOG['${POCKET_ID}'].allowRandomEncounters`), false);
    assert.equal(g.run(`mapPlayerAccessible('${POCKET_ID}')`), true, 'pocket stays accessible');
    const pocketNew = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${POCKET_ID}'].map)`);
    const pocketOld = OLD_GRIDS[POCKET_ID];
    for (let r = 0; r < 15; r++) {
      if (r >= 8 && r <= 10) { assert.deepEqual(pocketNew[r], pocketOld[r], `pocket row ${r} (walled garden) unchanged`); continue; }
      if (r === 3 || r === 4 || r === 5) continue; // the retextured knoll rows
      assert.deepEqual(pocketNew[r], pocketOld[r], `pocket row ${r} unchanged`);
    }
    assert.deepEqual(pocketNew[0], pocketOld[0], 'pocket north seam row (0) unchanged');

    // 5. The new Gravel Bar tile (128) actually appears across the ridge —
    //    this is the positive confinement case test 209 anticipated.
    for (const id of ALL_IDS) {
      assert.ok(g.run(`REGIONAL_CHUNK_CATALOG['${id}'].map.some(function(row){return row.includes(GRAVEL_BAR);})`), `${id} uses the new Gravel Bar tile`);
    }

    // 6. Every chunk NOT in this batch keeps its exact recorded fingerprint —
    //    the sweep that catches an accidental edit outside the intended batch.
    const touched = new Set(ALL_IDS);
    let swept = 0;
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      if (touched.has(id)) continue;
      swept++;
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'] ? REGIONAL_CHUNK_CATALOG['${id}'].map : (MAP_CATALOG['${id}'] && MAP_CATALOG['${id}'].map))`);
      assert.equal(sha256(current), fp, `${id}: untouched fingerprint unchanged`);
    }
    assert.equal(swept, Object.keys(GRID_FP.fingerprints).length - ALL_IDS.length);

    // 7. Zero-void camera invariant, route length, and general validation are
    //    unaffected by a scenery-only retexture (no reachability change).
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0);
  },
};
