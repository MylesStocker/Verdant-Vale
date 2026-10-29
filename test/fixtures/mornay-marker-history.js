'use strict';
const assert = require('assert/strict');
const cells = require('../../Art/qa/mornay/overworld-marker-v1/grid-deltas.json');
const notes = require('../../Art/qa/mornay/overworld-marker-v1/note-deltas.json');
const {beforeNorthShift} = require('./mornay-north-history');

// Detached historical projections retain the earlier geography assertions.
// Prove each later approved change before reversing it; never mutate runtime data.
function historicalChunks(chunks) {
  const copy = beforeNorthShift(chunks);
  for (const {mapId, row, col, fromTile, toTile} of cells) {
    const chunk = copy.find(c => c.mapId === mapId);
    assert.equal(chunk.map[row][col], toTile, mapId + ' approved road/marker cell');
    chunk.map[row][col] = fromTile;
  }
  for (const [id, delta] of Object.entries(notes)) {
    const chunk = copy.find(c => c.mapId === id);
    assert.equal(chunk.notes, delta.after, id + ' approved presentation note');
    chunk.notes = delta.before;
  }
  return copy;
}
function historicalTiles(tiles) {
  const copy = JSON.parse(JSON.stringify(tiles));
  for (const [id, name] of [[131, 'TOWN_ROOFS'], [132, 'TOWN_FORT'], [133, 'TOWN_HARBOUR']]) {
    assert.ok(copy[id], name + ' is registered');
    assert.equal(copy[id].walkable, false, name + ' remains solid');
    delete copy[id];
  }
  return copy;
}
module.exports = {historicalChunks, historicalTiles};
