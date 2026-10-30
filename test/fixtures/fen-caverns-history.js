'use strict';
const assert=require('assert/strict');
const {beforeDiscoveriesChunks}=require('./wilderness-discoveries-history');
const cells=require('../../Art/qa/fen-caverns/grid-deltas.json');
// Reverse only this reviewed cave entrance and remove the one new regional
// chunk on detached snapshots, keeping earlier geography baselines strict.
function beforeFenCavernsChunks(chunks){
 const copy=beforeDiscoveriesChunks(chunks);
 const rise=copy.filter(c=>c.mapId==='FEN_RUIN_RISE_MAP');
 assert.equal(rise.length,1);assert.deepEqual([rise[0].chunkX,rise[0].chunkY],[3,-1]);
 for(const d of cells){const c=copy.find(c=>c.mapId===d.mapId);assert.equal(c.map[d.row][d.col],d.toTile,'reviewed cave entrance cell');c.map[d.row][d.col]=d.fromTile;}
 return copy.filter(c=>c.mapId!=='FEN_RUIN_RISE_MAP');
}
module.exports={beforeFenCavernsChunks};
