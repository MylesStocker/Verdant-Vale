'use strict';
const assert=require('assert/strict'),crypto=require('crypto');
const {createContext}=require('../harness');
const deltas=require('../../Art/qa/mornay/overworld-marker-v1/grid-deltas.json');
const before=require('../../Art/qa/mornay/overworld-marker-v1/before-fingerprints.json');
const {beforeNorthShift}=require('../fixtures/mornay-north-history');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const sha=m=>crypto.createHash('sha256').update(JSON.stringify(m)).digest('hex');
const crown='EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP';
function route(tiles,start,end){
 const key=p=>p.join(','),q=[start],seen=new Map([[key(start),null]]);
 for(let i=0;i<q.length;i++){
  const p=q[i];if(key(p)===key(end)){const path=[];for(let v=p;v;v=seen.get(key(v)))path.unshift(v);return path;}
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const v=[p[0]+dx,p[1]+dy],k=key(v);if(tiles.has(k)&&!seen.has(k)){seen.set(k,p);q.push(v);}}
 }
 assert.fail('Disconnected road: '+key(end));
}
module.exports={name:'Mornay overworld: modest continuous road, solid town/fort/harbour marker and paired input gates',run(){
 // The later northward shift is checked independently by suite 338. Retain
 // this road pass's original cell/width evidence on a detached projection.
 const g=createContext(),chunks=beforeNorthShift(J(g,'_REGIONAL_CHUNK_DEFINITIONS')),tiles=new Map();
 assert.equal(new Set(deltas.map(d=>d.mapId+':'+d.col+','+d.row)).size,deltas.length,'each changed cell appears once');
 for(const [id,fp]of Object.entries(before)){
  const c=chunks.find(c=>c.mapId===id),old=c.map.map(r=>r.slice());
  for(const d of deltas.filter(d=>d.mapId===id)){
   assert.equal(c.map[d.row][d.col],d.toTile);
   assert.ok(d.fromTile===2&&d.toTile===0||d.fromTile===13&&[131,132,133].includes(d.toTile));
   assert.equal(g.run(`isTileWalkable(${d.fromTile})`),g.run(`isTileWalkable(${d.toTile})`),'no crossing or blocked old save created');
   old[d.row][d.col]=d.fromTile;
  }
  assert.equal(sha(old),fp,id+' exact cell-level scope');
  c.map.forEach((r,y)=>r.forEach((t,x)=>{if(t===2)tiles.set([c.chunkX*16+x,c.chunkY*15+y].join(','),[c.mapId,x,y]);}));
 }
 // Check width across chunk boundaries as well as within each chunk. A fully
 // paved 3x3 patch reveals a road wider than two tiles, including broad turns.
 for(const key of tiles.keys()){
  const [x,y]=key.split(',').map(Number);
  assert.equal([0,1,2].every(dy=>[0,1,2].every(dx=>tiles.has([x+dx,y+dy].join(',')))),false,'no grand paved block at '+key);
  route(tiles,[279,-41],[x,y]); // every road tile connects to the gates
 }
 const m=chunks.find(c=>c.mapId===crown).map;
 assert.deepEqual(m.slice(1,4).map(r=>r.slice(7,9)),[[132,131],[133,131],[14,14]]);
 assert.deepEqual(m.slice(0,4).flatMap((r,y)=>r.flatMap((t,x)=>t===2?[[x,y]]:[])),[],'road never runs beside or behind the town');
 for(let y=4;y<15;y++)assert.deepEqual(m[y].flatMap((t,x)=>t===2?[x]:[]),[7,8]);
 for(const id of [131,132,133]){
  assert.equal(g.run(`isTileWalkable(${id})||isTileEncounterEligible(${id})||isTransitionTile(${id})`),false);
  assert.equal(g.run(`RENDERABLE_TILE_IDS.has(${id})`),true);
  assert.ok(g.run(`debugTileName(${id})`));
  const uses=chunks.filter(c=>c.map.flat().includes(id)).map(c=>c.mapId);assert.deepEqual(uses,[crown]);
  const state=J(g,'({location:regionalPlayerWorldPoint(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),stats})');
  g.run(`var markerRects=[];var markerOldFill=ctx.fillRect;ctx.fillRect=(...a)=>markerRects.push([ctx.fillStyle,...a]);drawTile(${id},0,0);ctx.fillRect=markerOldFill;`);
  const local=J(g,'markerRects');assert.ok(local.length>10,'recognizable multi-part artwork');
  g.run(`markerRects=[];ctx.fillRect=(...a)=>markerRects.push([ctx.fillStyle,a[0]-512,a[1]+480,...a.slice(2)]);drawTile(${id},512,-480);ctx.fillRect=markerOldFill;`);
  assert.deepEqual(J(g,'markerRects'),local,'camera-independent pixel geometry');
  assert.deepEqual(J(g,'({location:regionalPlayerWorldPoint(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),stats})'),state,'read-only drawing');
 }
 for(const legacy of [false,true])for(const col of [7,8]){
  const v=createContext();v.press('Enter');v.press('Enter');v.run(`forceLegacyRegionalView=${legacy};transitionToLocation({mapId:'EASTERN_FENS_MORNAY_APPROACH_E_MAP',x:240,y:432});dialogue.open=false;`);
  const path=route(tiles,[295,-2],[272+col,-41]);
  // Legacy seams arrive beyond the outermost tile; walk to interior waypoints
  // on each side instead of trying to stand on its auto-transition strip.
  for(const [x,y]of path.slice(1).filter(p=>{const [,c,r]=tiles.get(p.join(','));return c>0&&c<15&&r>0&&r<14;})){
   const targetX=x*32+16,targetY=y*32+16;
   for(let n=0;n<100;n++){
    const p=J(v,'regionalPlayerWorldPoint()');const dx=targetX-p.worldPxX,dy=targetY-p.worldPxY;if(Math.abs(dx)<2&&Math.abs(dy)<2)break;
    const key=Math.abs(dx)>1?(dx>0?'ArrowRight':'ArrowLeft'):(dy>0?'ArrowDown':'ArrowUp');v.hold(key);v.frames();v.release(key);
    if(n===99)assert.fail('Input route stalled at '+[x,y]);
   }
  }
  v.hold('ArrowUp');for(let i=0;i<30&&!v.run('inTown');i++)v.frames();v.release('ArrowUp');
  assert.equal(v.run('mapIdForRef(activeMap)'),col===7?'MORNAY_WEST_GATE_MAP':'MORNAY_EAST_GATE_MAP');
  assert.equal(v.run('saveGame()&&loadGame()'),true);v.run('dialogue.open=false');
  v.hold('ArrowDown');for(let i=0;i<60&&v.run('inTown');i++)v.frames();v.release('ArrowDown');
  assert.deepEqual(J(v,'[mapIdForRef(activeMap),player.x,player.y]'),[crown,col*32+16,144]);
  v.frames(10);assert.equal(v.run('inTown'),false);assert.equal(v.run('SAVE_VERSION'),5);
 }
 console.log('  Road width/connectivity, exact deltas, marker purity and four input gate journeys passed');
}};
