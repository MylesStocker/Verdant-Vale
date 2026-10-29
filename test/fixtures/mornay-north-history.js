'use strict';
const assert = require('assert/strict');
const delta = require('./mornay-north-shift.json');
// Preserve the earlier road-pass evidence without mutating current geography.
function beforeNorthShift(chunks) {
  const copy = JSON.parse(JSON.stringify(chunks));
  const c = copy.find(c => c.mapId === delta.mapId);
  for (const d of delta.cells) {
    assert.equal(c.map[d.row][d.col], d.to, 'approved north-shift cell');
    c.map[d.row][d.col] = d.from;
  }
  assert.equal(c.notes, delta.notes.after);
  c.notes = delta.notes.before;
  return copy;
}
module.exports = {beforeNorthShift};
