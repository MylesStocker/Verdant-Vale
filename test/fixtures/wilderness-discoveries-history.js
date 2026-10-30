'use strict';
const assert=require('assert/strict');
const cells=require('../../Art/qa/wilderness-discoveries/grid-deltas.json');
const sets=require('../../Art/qa/wilderness-discoveries/item-sets.json');
// Reverse only reviewed discovery additions on a detached snapshot. This keeps
// historical terrain/metadata assertions strict without mutating runtime data.
function beforeDiscoveriesChunks(chunks){
 const copy=JSON.parse(JSON.stringify(chunks)),byId=new Map(copy.map(c=>[c.mapId,c]));
 for(const [id,itemSetId]of Object.entries(sets)){const c=byId.get(id);assert.equal(c.itemSetId,itemSetId);delete c.itemSetId;assert.equal(c.notes,'Optional wilderness discovery; completion uses stable pickup IDs.');c.notes='Terrain-only regional mainland; no content or persistent state.';}
 for(const d of cells){const c=byId.get(d.mapId);assert.equal(c.map[d.row][d.col],d.toTile);c.map[d.row][d.col]=d.fromTile;}
 return copy;
}
module.exports={beforeDiscoveriesChunks};
