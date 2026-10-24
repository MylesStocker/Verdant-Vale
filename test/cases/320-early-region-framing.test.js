'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {graph,J}=require('./317-mainland-navigation.test');
const priorMap3=[[1,1,1,1,1,1,1,1,2,3,3,3,3,3,3,3],[1,23,23,1,1,1,1,23,2,0,0,0,0,0,0,3],[1,23,1,1,1,1,1,1,2,0,0,0,0,3,3,3],[23,0,1,1,1,23,23,0,2,0,0,0,0,3,0,3],[0,0,23,23,23,0,0,0,2,0,0,0,0,0,0,3],[23,0,0,23,1,1,23,0,2,0,0,0,0,0,0,3],[0,0,0,23,1,1,1,23,2,2,2,2,2,2,2,2],[3,0,0,0,23,1,23,0,2,0,0,0,0,0,0,3],[0,0,0,0,0,23,0,0,2,0,0,0,0,0,0,3],[23,0,23,0,0,0,23,23,2,0,0,0,0,0,0,3],[3,0,23,1,0,0,0,23,2,0,0,0,0,0,0,3],[2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,3],[3,0,0,23,23,1,1,1,0,0,0,0,0,0,0,3],[3,0,0,0,23,1,1,0,23,0,0,0,0,0,0,3],[3,3,3,3,1,1,1,3,1,3,0,0,0,3,3,3]];
module.exports={name:'Early-region framing: four closed camera edges, exact water closure, held-control barriers and sealed southern bank',run(){
 const g=createContext();g.run("storyCheckpointLab.apply('mq5_assignment_ready');debugMode=true");
 const policies={MAP_N1:['west'],MAP_N2:['west'],MAP2:['south'],MAP3:['south']};
 assert.deepEqual(J(g,'Object.fromEntries(_REGIONAL_CHUNK_DEFINITIONS.filter(c=>c.cameraClampEdges).map(c=>[c.mapId,c.cameraClampEdges]))'),policies);
 const map=J(g,'mapRefForId("MAP3")');
 for(let y=0;y<15;y++)for(let x=0;x<16;x++){
  const changed=y===13&&x>=9&&x<=12||y===14&&x>=10&&x<=12;
  assert.equal(map[y][x],changed?g.run('WATER'):priorMap3[y][x],'exact MAP3 delta '+x+','+y);
 }
 for(const [id,x,y,edge,bound]of [['MAP_N1',48,144,'west',0],['MAP_N2',48,336,'west',0],['MAP2',176,432,'south',2400],['MAP3',432,432,'south',2400]]){
  const before=g.run('JSON.stringify({position:regionalWorldPosition(),map:mapIdForRef(activeMap),x:player.x,y:player.y,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])})');
  const plan=J(g,`(()=>{const p=mapLocalPxToRegionWorldPx('${id}',${x},${y});return buildContinuousWorldPlanFromWorld(p.regionId,p.worldPxX,p.worldPxY,512,480);})()`);
  assert.equal(edge==='west'?plan.camPxX:plan.camPxY,bound,id+' original boundary framing');
  assert.ok(plan.playerWorldPxX>=plan.camPxX&&plan.playerWorldPxX<plan.camPxX+512);
  assert.ok(plan.playerWorldPxY>=plan.camPxY&&plan.playerWorldPxY<plan.camPxY+480);
  assert.equal(g.run('JSON.stringify({position:regionalWorldPosition(),map:mapIdForRef(activeMap),x:player.x,y:player.y,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])})'),before,'camera remains read-only');
 }
 const western=J(g,"(()=>{const id=mapIdForChunk('overworld',-1,-8),p=mapLocalPxToRegionWorldPx(id,48,240);return buildContinuousWorldPlanFromWorld(p.regionId,p.worldPxX,p.worldPxY,512,480);})()");
 assert.ok(western.camPxX<0,'expanded western world retains its wider camera');
 assert.equal(g.run('EDGE_TRANSITIONS.MAP3.south'),undefined);
 assert.equal(g.run('EDGE_TRANSITIONS.MAINLAND_C2R6_MAP.north'),undefined);
 for(const legacy of [false,true]){
  g.run(`forceLegacyRegionalView=${legacy};transitionToLocation({mapId:'MAP3',x:336,y:400,facing:'down'});dialogue.open=false`);
  g.hold('ArrowDown');try{g.frames(100);}finally{g.release('ArrowDown');}
  assert.equal(g.run('mapIdForRef(activeMap)'),'MAP3');assert.ok(g.run('player.y')<=407,'water blocks the southern approach');
  g.run("transitionToLocation({mapId:'MAINLAND_C2R6_MAP',x:336,y:48,facing:'up'});dialogue.open=false");
  g.hold('ArrowUp');try{g.frames(100);}finally{g.release('ArrowUp');}
  assert.equal(g.run('mapIdForRef(activeMap)'),'MAINLAND_C2R6_MAP','sealed bank has no hidden reverse seam');
 }
 const net=graph(J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})'));
 const early=net.flood('MAP3',8,11),sealed=net.flood('MAINLAND_C2R6_MAP',10,0);
 assert.equal(early[net.key('MAINLAND_C2R6_MAP',10,0)],0);
 assert.equal(sealed[net.key('MAP3',8,11)],0);
 for(const malformed of [['sideways'],['south','south'],[],{south:true}]){
  g.run('REGIONAL_CHUNK_CATALOG.MAP2.cameraClampEdges='+JSON.stringify(malformed));
  assert.ok(J(g,'validateGameData().errorList').some(e=>e.message.includes('cameraClampEdges')),'malformed camera metadata rejected');
 }
 g.run("REGIONAL_CHUNK_CATALOG.MAP2.cameraClampEdges=THORNMERE_REGIONAL_CHUNK_DEFINITIONS.find(d=>d.mapId==='MAP2').cameraClampEdges");
 assert.equal(g.run('validateGameData().errors'),0);assert.equal(g.run('SAVE_VERSION'),5);
}};
