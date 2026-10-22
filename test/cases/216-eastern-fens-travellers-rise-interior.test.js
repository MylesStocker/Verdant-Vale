'use strict';

// Main's terrain preservation contract, extended only for the reviewed
// three-cell natural choke. The detailed graph/input/actor proof is in 217.
// All original walls, western pocket, campsite and structural seams remain.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const ID = 'EASTERN_FENS_TRAVELLERS_RISE_MAP';

const OLD_GRID = [
  [1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1],
  [1,127,127,127,127,127,127,23,0,0,2,0,0,23,127,1],
  [1,127,127,127,127,127,23,0,0,88,2,0,0,0,23,1],
  [1,127,127,127,127,23,0,0,88,88,2,0,0,0,0,1],
  [1,127,127,127,23,0,0,0,0,0,2,0,0,0,0,1],
  [1,127,127,23,0,0,0,0,0,89,2,89,0,0,0,1],
  [1,127,23,0,0,0,0,88,88,0,2,0,0,0,0,1],
  [1,127,23,0,0,0,0,0,0,0,2,2,2,2,2,2],
  [1,127,23,0,0,0,0,0,0,0,0,0,0,0,2,2],
  [1,127,23,0,0,0,0,0,0,0,0,0,0,0,2,2],
  [1,127,23,0,0,0,0,88,88,0,0,0,0,0,23,1],
  [1,127,127,23,0,0,0,0,0,0,0,0,0,23,127,1],
  [1,127,127,127,23,0,0,0,0,0,0,0,23,127,127,1],
  [1,127,127,127,127,23,23,23,23,23,23,23,127,127,127,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];
const OLD_FP = '09bb3d2acf2d0a70a3ab32e54cbe401b6cc8bd1e105594b937ce66719cc9c08a';

// [row, col] -- unchanged trigger, endpoints and retained historical route cells.
const PROTECTED_CELLS = [
  [7, 10],               // TRIGGER
  [4, 12], [4, 13], [4, 14], // homes
  [7, 8], [5, 10], [7, 12],  // destinations
  [6, 8], [6, 9], [6, 10], [6, 12], // route0 horizontal (row 6, cols 8-12)
  [5, 12],                // route0 vertical (col 12, row 5, between home and the row-6 turn)
  [4, 10],       // route1 horizontal (row 4, cols 10-13 incl. homes above)
  [5, 14], [6, 14], [7, 14], [8, 14], // route2 vertical (col 14, rows 4-8)
  [8, 12], [8, 13],       // route2 horizontal (row 8, cols 12-14)
];

const WALLED_CELLS = [
  // Integrated natural choke: former NPC crossing, now moved west.
  [4, 11], [5, 11], [6, 11],
  // Wall A: west-fen bypass seal (col 9, rows 8-13)
  [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9],
  // Wall B: entrance-adjacent shortcut seal (cols 12-14, rows 1-3)
  [1, 12], [1, 13], [1, 14], [2, 12], [2, 13], [2, 14], [3, 12], [3, 13], [3, 14],
  // Corridor flanks
  [5, 13], [6, 13], [7, 7], [8, 11], [9, 12], [9, 13],
];
const HOLLOW_CELLS = [[8, 4], [11, 3]];

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: "Eastern Fens terrain redesign: Travellers' Rise interior -- original terrain plus three-cell natural choke, fixed trigger and endpoints",
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. Recorded OLD_FP matches the literal prior grid; current grid
    //    matches the updated fingerprint.
    assert.equal(sha256(JSON.stringify(OLD_GRID)), OLD_FP, 'OLD_FP matches the literal prior grid');
    const newGrid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    assert.equal(newGrid.length, 15, '15 rows');
    newGrid.forEach((row, i) => assert.equal(row.length, 16, `row ${i} has 16 cols`));
    assert.equal(sha256(JSON.stringify(newGrid)), GRID_FP.fingerprints[ID], 'current grid matches the updated fingerprint');

    // 2. Every protected trigger/endpoint and retained route cell
    //    is byte-identical to the prior grid.
    for (const [r, c] of PROTECTED_CELLS) {
      assert.equal(newGrid[r][c], OLD_GRID[r][c], `protected cell (${c},${r}) must be untouched`);
    }

    // 3. Every walled/hollow cell changed from a plain walkable-fill value
    //    to HILLS(119)/TREE(3)/BASIN_MUD(81), and no walled cell is a
    //    protected cell.
    const protectedSet = new Set(PROTECTED_CELLS.map(([r, c]) => r + ',' + c));
    for (const [r, c] of WALLED_CELLS) {
      assert.ok(!protectedSet.has(r + ',' + c), `walled cell (${c},${r}) must not be a protected cell`);
      assert.ok(newGrid[r][c] === 119 || newGrid[r][c] === 3, `walled cell (${c},${r}) must be HILLS or TREE, got ${newGrid[r][c]}`);
      assert.notEqual(newGrid[r][c], OLD_GRID[r][c], `walled cell (${c},${r}) actually changed`);
    }
    for (const [r, c] of HOLLOW_CELLS) {
      assert.equal(newGrid[r][c], 81, `hollow cell (${c},${r}) must be BASIN_MUD`);
    }

    // 4. Every other cell in the grid is unchanged (no incidental edits
    //    beyond the declared walled/hollow set).
    const touched = new Set([...WALLED_CELLS, ...HOLLOW_CELLS].map(([r, c]) => r + ',' + c));
    let untouchedChecked = 0;
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 16; c++) {
        if (touched.has(r + ',' + c)) continue;
        untouchedChecked++;
        assert.equal(newGrid[r][c], OLD_GRID[r][c], `(${c},${r}): unlisted cell must be unchanged`);
      }
    }
    assert.equal(untouchedChecked, 15 * 16 - touched.size);

    // 5. Permissions and EDGE_TRANSITIONS for this chunk are untouched.
    assert.equal(g.run(`MAP_CATALOG['${ID}'].allowRandomEncounters`), false, 'still no random encounters');
    assert.equal(g.run(`MAP_CATALOG['${ID}'].allowSave`), true, 'still allows save');
    assert.deepEqual(J(`JSON.stringify(Object.keys(EDGE_TRANSITIONS['${ID}'] || {}).sort())`), ['east', 'north'].sort(),
      'EDGE_TRANSITIONS for this chunk unchanged (north entrance, east exit)');

    // 6. Every chunk NOT in this batch keeps its exact recorded fingerprint.
    let swept = 0;
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      if (id === ID) continue;
      swept++;
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'] ? REGIONAL_CHUNK_CATALOG['${id}'].map : (MAP_CATALOG['${id}'] && MAP_CATALOG['${id}'].map))`);
      assert.equal(sha256(current), fp, `${id}: untouched fingerprint unchanged`);
    }
    assert.equal(swept, Object.keys(GRID_FP.fingerprints).length - 1);

    // 7. The mandatory re-checks: ambush safety and route length are
    //    delegated to their own dedicated suites (199, 161) and run
    //    separately in the full suite; here we confirm general validation.
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0);
  },
};
