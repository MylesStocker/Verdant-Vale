'use strict';
const assert=require('assert/strict');
const {beforeFenCavernsChunks}=require('./fen-caverns-history');
const cells=require('../../Art/qa/rocky-beach/grid-deltas.json');
// Exact approved terrain-only changes, reversed on detached snapshots so earlier
// geography assertions still protect every other cell, property and placement.
function beforeRockyChunks(chunks){
 const copy=beforeFenCavernsChunks(chunks),byId=new Map(copy.map(c=>[c.mapId,c]));
 for(const d of cells){const c=byId.get(d.mapId);assert.equal(c.map[d.row][d.col],d.toTile,d.mapId+' reviewed beach cell');c.map[d.row][d.col]=d.fromTile;}
 return copy;
}
function beforeRockyTiles(tiles){const copy=JSON.parse(JSON.stringify(tiles));assert.equal(copy[134].debugName,'ROCKY_BEACH');assert.equal(copy[134].walkable,true);delete copy[134];return copy;}
module.exports={beforeRockyChunks,beforeRockyTiles};
