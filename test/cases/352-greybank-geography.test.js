'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {graph,J}=require('./317-mainland-navigation.test');
const {sha}=require('../regional-atlas');
const {beforeGreybankChunks}=require('../fixtures/greybank-history');
const baseline=require('../../Art/qa/greybank/baseline.json');
module.exports={name:'Greybank geography: one marker, unchanged seams/progression, connected rooms and canonical river metadata',run(){
 const g=createContext(),d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})');
 assert.equal(sha(beforeGreybankChunks(d.chunks)),baseline.chunksSha256,'only reviewed cell and river metadata change');assert.equal(sha(d.edges),baseline.edgesSha256,'no structural seam edits');
 const net=graph(d),east=net.flood('EASTERN_FENS_WIDE_WATER_MAP',1,8),early=net.flood('MAP3',8,11);
 assert.equal(east[net.key('MAINLAND_C21R7_MAP',10,7)],1,'mill accessible from post-ferry mainland');assert.equal(early[net.key('MAINLAND_C21R7_MAP',10,7)],0,'no ferry bypass');
 const doors=J(g,'GREYBANK_DOORS');assert.equal(new Set(doors.map(d=>d.source+':'+d.col+','+d.row)).size,doors.length);
 for(const m of J(g,'GREYBANK_MAPS')){
  assert.equal(m.map.length,15);assert.ok(m.map.every(r=>r.length===16));
  const entrance=doors.find(d=>d.target===m.id),q=[[Math.floor(entrance.x/32),Math.floor(entrance.y/32)]],seen=new Set([q[0].join(',')]);
  for(let i=0;i<q.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const [x,y]=q[i],xx=x+dx,yy=y+dy,k=xx+','+yy;if(d.tiles[m.map[yy]?.[xx]]?.walkable&&!seen.has(k)){seen.add(k);q.push([xx,yy]);}}
  for(let y=0;y<15;y++)for(let x=0;x<16;x++)if(d.tiles[m.map[y][x]].walkable)assert.ok(seen.has(x+','+y),m.id+' trapped floor '+x+','+y);
  assert.equal(g.run(`MAP_METADATA['${m.id}'].allowRandomEncounters`),false);
  for(const exit of doors.filter(d=>d.source===m.id)){assert.ok(seen.has(exit.col+','+exit.row));assert.ok(doors.some(d=>d.source===exit.target&&d.target===m.id));}
 }
 const state=()=>g.run('JSON.stringify({stats,player,regional:regionalWorldPosition(),MainQuest,greybank_stage,greybank_wins})');
 const before=state();g.run("OUTDOOR_MAP_DECOR.MAINLAND_C21R7_MAP();OUTDOOR_MAP_DECOR.MAINLAND_C21R7_MAP()");assert.equal(state(),before,'neighbour marker rendering never spoofs position or changes quest state');
 assert.equal(g.run('validateGameData().errors'),0);assert.equal(g.run('SAVE_VERSION'),5);
}};
