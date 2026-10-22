'use strict';

// Terrain-redesign pass, batch 2: the north-central peat bog (chunkY=1,
// chunkX 9-14). Five scenery-only chunks get a full retexture from scattered
// water-noise into a raised peat-bog floor with willow clumps and hummocks;
// the one walkable pocket in the middle (EASTERN_FENS_ENVELOPE_C10R1_MAP)
// gets a light interior-only retexture (its south seam at row 14 is
// byte-identical to before). Same rigor as batch 1 (test 210): old grids
// embedded literally and proved by hash against a recorded OLD_FP, new
// grids proved by hash against the updated fingerprints file.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const OLD_GRIDS = {
  EASTERN_FENS_ENVELOPE_C9R1_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,1,23,1,23,1,1,1,1],
    [1,1,1,1,127,81,127,1,1,23,81,23,1,1,1,1],
    [1,1,1,1,127,1,127,1,1,81,1,23,1,1,1,1],
    [1,1,1,1,127,1,127,1,1,23,1,23,1,1,1,1],
    [1,1,1,1,127,1,127,1,1,23,1,23,1,1,1,1],
    [1,1,1,1,127,81,127,1,1,81,81,23,1,1,1,1],
    [1,1,1,1,127,1,81,89,1,23,1,23,1,1,1,1],
    [1,1,1,1,127,1,127,1,81,23,1,23,1,1,1,1],
    [1,1,1,1,127,1,127,81,81,23,1,23,1,1,1,1],
    [1,1,1,1,127,1,81,1,1,23,1,23,1,1,1,1],
    [1,1,1,1,89,1,127,1,1,81,1,23,1,1,1,1],
    [1,1,1,1,127,1,127,1,1,23,1,23,1,1,1,1],
    [1,1,1,1,127,1,127,1,1,23,1,23,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C10R1_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,120,120,1,1,120,120,1,1,120,120,1,1,120,1,1],
    [1,1,120,1,1,1,1,1,1,1,1,1,1,120,1,1],
    [1,120,120,1,1,120,120,1,1,120,120,1,1,120,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,120,120,1,1,1,1,120,120,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,23,127,127,127,127,127,23,127,127,127,127,23,1,1,1],
    [1,23,127,127,81,81,127,127,127,81,81,127,127,23,1,1],
    [1,23,127,127,81,81,127,127,127,81,81,127,127,23,1,1],
    [1,23,127,127,127,127,127,23,127,127,127,127,127,23,1,1],
    [1,1,23,127,127,127,127,127,127,127,127,127,127,23,1,1],
    [1,1,1,23,127,127,127,127,127,127,127,127,23,1,1,1],
    [1,1,1,1,23,127,127,127,127,127,127,23,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,127,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C11R1_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,127,1,127,1,1,1,1,23,1,23,1,1],
    [1,1,1,1,127,1,127,1,81,1,1,23,1,23,1,1],
    [1,1,1,1,127,1,127,1,1,1,1,23,1,23,1,1],
    [1,1,1,1,127,89,127,1,1,81,1,23,1,23,1,1],
    [1,1,1,1,127,1,127,81,1,1,1,23,1,23,1,1],
    [1,1,1,1,127,1,127,1,1,1,1,23,1,23,1,1],
    [1,1,1,1,127,1,127,1,1,1,1,23,1,23,1,1],
    [1,1,1,1,127,1,81,1,89,1,1,23,1,23,1,1],
    [1,1,1,1,127,81,127,1,1,1,1,23,1,23,1,1],
    [1,1,1,1,127,1,127,1,1,1,1,23,1,23,1,1],
    [1,1,1,1,127,1,127,1,1,1,1,23,1,23,1,1],
    [1,1,1,1,127,1,127,1,1,81,1,23,1,23,1,1],
    [1,1,1,1,127,1,127,1,1,1,1,23,1,23,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C12R1_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,127,127,23,23,120,23,127,1,1,23,23,127,1,1],
    [1,23,127,23,23,127,127,1,1,127,1,1,1,23,23,1],
    [1,23,1,127,120,23,127,120,120,127,1,1,127,127,127,1],
    [1,127,1,23,1,1,1,1,1,1,1,1,1,127,127,1],
    [1,127,1,127,1,1,1,1,1,1,1,23,127,1,1,1],
    [1,1,1,127,23,1,1,1,1,127,1,127,1,127,127,1],
    [1,23,120,23,23,1,1,127,1,127,1,127,1,1,127,1],
    [1,127,23,127,127,1,1,120,127,1,1,1,1,1,120,1],
    [1,127,1,23,23,1,127,127,127,1,1,1,120,127,1,1],
    [1,127,1,1,1,1,23,1,1,1,127,1,1,1,23,1],
    [1,23,23,120,1,1,1,23,23,127,1,1,1,23,1,1],
    [1,1,1,127,127,1,1,23,1,1,127,127,1,1,23,1],
    [1,1,23,1,127,1,23,127,127,1,127,23,127,23,127,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C13R1_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,127,127,1,127,1,1],
    [1,1,1,127,1,1,1,1,1,1,1,127,121,1,127,1],
    [1,1,121,1,1,1,127,1,1,1,1,127,1,127,1,1],
    [1,1,1,1,127,1,1,1,121,1,1,121,127,1,1,1],
    [1,1,127,127,1,1,1,1,1,1,127,1,127,127,1,1],
    [1,1,121,1,1,1,1,1,1,1,121,1,1,1,1,1],
    [1,81,81,81,81,81,81,81,81,81,121,81,81,81,81,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,121,81,1],
    [1,1,1,23,121,121,1,1,1,1,1,1,23,1,1,1],
    [1,1,1,23,1,1,23,1,1,1,1,1,1,23,1,1],
    [1,1,1,1,1,1,1,23,1,121,1,1,1,1,1,1],
    [1,1,1,1,23,1,1,23,1,1,1,23,1,1,1,1],
    [1,1,1,1,1,1,1,23,1,121,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_ENVELOPE_C14R1_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,127,1,1,1,1,1,1,1,1,1,1,127,1],
    [1,1,1,1,1,1,127,127,1,1,1,1,1,1,1,1],
    [1,121,1,1,1,1,1,1,1,1,1,1,1,127,1,1],
    [1,1,1,1,1,1,127,127,1,1,127,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,81,1],
    [1,121,81,81,81,81,81,81,81,81,81,121,81,81,81,1],
    [1,23,1,1,1,1,1,23,23,1,1,1,1,1,23,1],
    [1,1,1,1,121,1,23,1,1,1,1,1,23,1,121,1],
    [1,1,23,1,1,1,1,1,23,1,1,1,1,23,121,1],
    [1,1,1,1,1,23,1,121,1,1,1,23,1,1,1,1],
    [1,121,1,23,23,1,1,23,1,1,1,1,1,1,23,1],
    [1,1,1,1,1,1,1,1,1,1,23,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
};
const OLD_FP = {
  EASTERN_FENS_ENVELOPE_C9R1_MAP: 'e5e4db94fc80831d1575493f0543b5f6ba6db3680facf6047c9a17492574cdbe',
  EASTERN_FENS_ENVELOPE_C10R1_MAP: '6e15560a519df278d16a5bc571431392c8c06793322b49e1a39e6db4a42d22d8',
  EASTERN_FENS_ENVELOPE_C11R1_MAP: '78534591d0926cb7539623f107ba4f0a5b28e07fd83eaf2ee0b1c153789039f3',
  EASTERN_FENS_ENVELOPE_C12R1_MAP: '1d733e148148199df42f2d44689010920cee2a283f259acdc426075812db5f32',
  EASTERN_FENS_ENVELOPE_C13R1_MAP: 'ee330ee490172c3e1b3342a597c9f07f474429aef200e940076e7e3a7a8d1a2a',
  EASTERN_FENS_ENVELOPE_C14R1_MAP: '05018559ac156ca7474674ae3e760e4b697615b5fb297d1f1a5e2eb45e3334cc',
};
const SCENERY_IDS = ['EASTERN_FENS_ENVELOPE_C9R1_MAP', 'EASTERN_FENS_ENVELOPE_C11R1_MAP', 'EASTERN_FENS_ENVELOPE_C12R1_MAP', 'EASTERN_FENS_ENVELOPE_C13R1_MAP', 'EASTERN_FENS_ENVELOPE_C14R1_MAP'];
const POCKET_ID = 'EASTERN_FENS_ENVELOPE_C10R1_MAP';
const ALL_IDS = [...SCENERY_IDS, POCKET_ID];

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens terrain redesign: peat bog (batch 2) — old grids proved by hash, new grids proved by hash, every other chunk unchanged',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. Every old grid above hashes to its recorded OLD_FP.
    for (const id of ALL_IDS) {
      assert.equal(sha256(JSON.stringify(OLD_GRIDS[id])), OLD_FP[id], `${id}: recorded OLD_FP matches the literal prior grid`);
    }

    // 2. The current (new) grid hashes to the updated fingerprints file, and
    //    is NOT byte-identical to the old grid.
    for (const id of ALL_IDS) {
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      assert.equal(sha256(current), GRID_FP.fingerprints[id], `${id}: current grid matches the updated fingerprint`);
      assert.notEqual(current, JSON.stringify(OLD_GRIDS[id]), `${id}: grid actually changed`);
    }

    // 3. The five scenery chunks stay scenery: unreachable, no seam, same
    //    save/encounter permissions as before.
    for (const id of SCENERY_IDS) {
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), false, `${id} stays scenery-only`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), false, id);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), false, id);
      assert.deepEqual(J(`JSON.stringify(Object.keys(EDGE_TRANSITIONS['${id}']||{}))`), [], `${id} has no seam`);
    }

    // 4. The walkable pocket's seam and permissions are byte-identical to
    //    before; its south border row (the seam row) is untouched.
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${POCKET_ID}'])`), { south: [{ targetMap: 'EASTERN_FENS_DRAINAGE_NW_MAP', targetEdge: 'north', sourceRange: [11, 11] }] });
    assert.equal(g.run(`MAP_CATALOG['${POCKET_ID}'].allowSave`), true);
    assert.equal(g.run(`MAP_CATALOG['${POCKET_ID}'].allowRandomEncounters`), false);
    assert.equal(g.run(`mapPlayerAccessible('${POCKET_ID}')`), true, 'pocket stays accessible');
    const pocketNew = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${POCKET_ID}'].map)`);
    assert.deepEqual(pocketNew[14], OLD_GRIDS[POCKET_ID][14], 'pocket south seam row (14) unchanged');

    // 5. The bog's signature tiles (Basin Mud peat floor, willow Tree clumps)
    //    actually appear across the batch.
    for (const id of ALL_IDS) {
      assert.ok(g.run(`REGIONAL_CHUNK_CATALOG['${id}'].map.some(function(row){return row.includes(BASIN_MUD);})`), `${id} uses the peat-bog floor`);
      assert.ok(g.run(`REGIONAL_CHUNK_CATALOG['${id}'].map.some(function(row){return row.includes(TREE);})`), `${id} has at least one willow/birch clump`);
    }

    // 6. Every chunk NOT in this batch keeps its exact recorded fingerprint.
    const touched = new Set(ALL_IDS);
    let swept = 0;
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      if (touched.has(id)) continue;
      swept++;
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'] ? REGIONAL_CHUNK_CATALOG['${id}'].map : (MAP_CATALOG['${id}'] && MAP_CATALOG['${id}'].map))`);
      assert.equal(sha256(current), fp, `${id}: untouched fingerprint unchanged`);
    }
    assert.equal(swept, Object.keys(GRID_FP.fingerprints).length - ALL_IDS.length);

    // 7. General validation unaffected.
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0);
  },
};
