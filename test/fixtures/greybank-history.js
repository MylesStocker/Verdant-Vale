'use strict';
const assert=require('assert/strict');
const cells=require('../../Art/qa/greybank/grid-deltas.json');
const metadata=require('../../Art/qa/greybank/metadata-deltas.json');
// Reverse the later Lantern House marker, then the reviewed mill marker and
// river names, on detached snapshots. Every removed cell is asserted first.
function beforeGreybankChunks(chunks){
 const copy=JSON.parse(JSON.stringify(chunks)),byId=new Map(copy.map(c=>[c.mapId,c]));
 const lantern=byId.get('MAINLAND_C20R0_MAP');assert.equal(lantern.map[3][7],20);lantern.map[3][7]=0;
 for(const d of cells){const c=byId.get(d.mapId);assert.equal(c.map[d.row][d.col],d.toTile);c.map[d.row][d.col]=d.fromTile;}
 for(const d of metadata){const c=byId.get(d.mapId);assert.equal(c[d.key],d.after);c[d.key]=d.before;}
 return copy;
}
module.exports={beforeGreybankChunks};
