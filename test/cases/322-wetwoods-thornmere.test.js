'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {sha}=require('../regional-atlas');
const {graph,J}=require('./317-mainland-navigation.test');
const before=require('../fixtures/wetwoods-invariants.json');
const {historicalChunks,historicalTiles}=require('../fixtures/mornay-marker-history');
module.exports={name:'Wetwoods and Thornmere: scenery-only expansion, unchanged ordinary gameplay/cameras, closed starting routes and coherent freshwater basin',run(){
 const g=createContext(),d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})'),byId=new Map(d.chunks.map(c=>[c.mapId,c])),net=graph({...d,chunks:historicalChunks(d.chunks)});
 assert.equal(sha(historicalTiles(d.tiles)),before.tileRegistrySha256,'preserve every pre-marker tile definition');
 const historicalById=new Map(historicalChunks(d.chunks).map(c=>[c.mapId,c]));
 // Keep the historical fixture strict while accounting for the later, single
 // approved Reedbank entrance. Normalize a detached copy only, never live grids.
 const reedbank=JSON.parse(JSON.stringify(byId.get('MAINLAND_C22R3_MAP').map));
 assert.equal(reedbank[8][3],54,'the approved village marker is present');reedbank[8][3]=0;
 for(const [id,fp]of Object.entries(before.protectedGrids))assert.equal(sha(id==='MAINLAND_C22R3_MAP'?reedbank:historicalById.get(id).map),fp,id+' preserves every other ordinary gameplay tile');
 assert.deepEqual([Math.min(...d.chunks.map(c=>c.chunkX)),Math.max(...d.chunks.map(c=>c.chunkX)),Math.min(...d.chunks.map(c=>c.chunkY)),Math.max(...d.chunks.map(c=>c.chunkY))],before.bounds,'global camera extent is unchanged and within west/south limits');
 const cut=net.key('EASTERN_FENS_TRAVELLERS_RISE_MAP',10,7);
 for(const [label,id,x,y,block]of [['early','MAP3',8,11,-1],['ferrySide','EASTERN_BANK_MAP',5,8,cut],['onward','EASTERN_FENS_WIDE_WATER_MAP',1,8,cut]]){
  const seen=net.flood(id,x,y,block),cells=[];
  for(const c of d.chunks)for(let yy=0;yy<15;yy++)for(let xx=0;xx<16;xx++)if(seen[net.key(c.mapId,xx,yy)])cells.push(`${c.mapId}:${xx},${yy}`);
  assert.deepEqual({count:cells.length,sha256:sha(cells.sort())},before.reachability[label],label+' has exactly the old reachable tiles, not just the same destination maps');
 }
 g.run("storyCheckpointLab.apply('mq5_assignment_ready'); dialogue.open=false");
 const original=new Set(before.originalChunkIds),added=d.chunks.filter(c=>!original.has(c.mapId));assert.ok(added.length>50,'substantial wooded scenery');
 const state=g.run('JSON.stringify({world:regionalWorldPosition(),map:mapIdForRef(activeMap),x:player.x,y:player.y})');
 for(const c of added){
  assert.equal(c.playerAccessible,false);assert.equal(c.allowRandomEncounters,false);assert.equal(c.allowSave,false);
  assert.ok(!d.edges[c.mapId]||!Object.keys(d.edges[c.mapId]).length,'no entrance into '+c.mapId);
  assert.ok(c.chunkX>=-8&&c.chunkX<0&&c.chunkY<=13);
  const p=c.map.flat().findIndex(t=>d.tiles[t].walkable);
  if(p>=0)assert.equal(g.run(`transitionToLocation({mapId:'${c.mapId}',x:${(p%16)*32+16},y:${Math.floor(p/16)*32+16},facing:'down'})`),false,'scenic clearings cannot be debug/normal placements');
 }
 assert.equal(g.run('JSON.stringify({world:regionalWorldPosition(),map:mapIdForRef(activeMap),x:player.x,y:player.y})'),state,'rejected scenery placements are atomic');
 const coords=new Map(d.chunks.map(c=>[c.chunkX+','+c.chunkY,c]));
 const tile=(x,y)=>coords.get(Math.floor(x/16)+','+Math.floor(y/15))?.map[y-Math.floor(y/15)*15][x-Math.floor(x/16)*16];
 const q=[[35,135]],seen=new Set(['35,135']);
 for(let i=0;i<q.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=q[i][0]+dx,y=q[i][1]+dy,k=x+','+y;if(x<-16||x>80||y<75||y>180||seen.has(k)||!d.tiles[tile(x,y)]?.isWater)continue;seen.add(k);q.push([x,y]);}
 assert.ok(q.length>1500,'Thornmere is one substantial connected body of water');
 assert.ok(q.some(([x,y])=>y<90),'basin connects to the existing northern shallows');
 const banks=[];for(let y=117;y<=148;y++){const row=q.filter(p=>p[1]===y).map(p=>p[0]);if(row.length)banks.push(Math.min(...row));}
 assert.ok(new Set(banks).size>=8,'western shoreline has coves and points rather than a straight chunk edge');
 for(const [x,y]of q)assert.equal(d.tiles[tile(x,y)].walkable,false,'open lake and submerged snags cannot become crossings');
 assert.equal(g.run('SAVE_VERSION'),5);
 assert.equal(g.run('validateGameData().errors'),0);
}};
