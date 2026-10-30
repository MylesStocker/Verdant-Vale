'use strict';
const assert=require('assert/strict');
const cells=require('../../Art/qa/valmere-access/grid-deltas.json');
const metadata=require('../../Art/qa/valmere-access/metadata-deltas.json');
const edges=require('../../Art/qa/valmere-access/edge-deltas.json');
const opened=new Set(metadata.filter(m=>m.before.playerAccessible===false&&m.after.playerAccessible===true).map(m=>m.mapId));
// Exact later-approved changes, verified before reversing detached snapshots.
function beforeAccessChunks(chunks){const copy=JSON.parse(JSON.stringify(chunks));
 for(const d of cells){const c=copy.find(c=>c.mapId===d.mapId);assert.equal(c.map[d.row][d.col],d.toTile,d.mapId+' reviewed tree opening');c.map[d.row][d.col]=d.fromTile;}
 for(const d of metadata){const c=copy.find(c=>c.mapId===d.mapId);for(const[k,v]of Object.entries(d.after)){assert.deepEqual(c[k]??null,v,d.mapId+' reviewed '+k);if(d.before[k]===null)delete c[k];else c[k]=d.before[k];}}
 return copy;
}
function beforeAccessEdges(value){const copy=JSON.parse(JSON.stringify(value));for(const d of edges){assert.deepEqual(copy[d.mapId]?.[d.edge]??null,d.after,d.mapId+' reviewed '+d.edge);if(d.before===null){delete copy[d.mapId][d.edge];if(!Object.keys(copy[d.mapId]).length)delete copy[d.mapId];}else (copy[d.mapId]??={})[d.edge]=d.before;}return copy;}
module.exports={beforeAccessChunks,beforeAccessEdges,opened};
