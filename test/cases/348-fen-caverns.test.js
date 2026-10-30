'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {graph,J,held}=require('./317-mainland-navigation.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const {sha}=require('../regional-atlas');
const {beforeFenCavernsChunks}=require('../fixtures/fen-caverns-history');
const baseline=require('../../Art/qa/fen-caverns/baseline.json');
const state=g=>J(g,'({stats,party:persistentParty.serialize(),day,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])})');
const route=[['FEN_CAVE_ROOTS_MAP',7,3,'ArrowUp'],['FEN_CAVE_POOL_MAP',4,11,'ArrowDown'],['FEN_CAVE_DESCENT_MAP',4,11,'ArrowDown'],['FEN_RUIN_RISE_MAP',7,11,'ArrowDown'],['FEN_CAVE_DESCENT_MAP',8,5,'ArrowUp'],['FEN_CAVE_POOL_MAP',11,3,'ArrowUp'],['FEN_CAVE_ROOTS_MAP',11,3,'ArrowUp'],['MAINLAND_CN3RN14_MAP',10,3,'ArrowUp']];
module.exports={name:'Fen caverns: northern approach → three chambers → ruined rise and return by controls, every floor reachable, saves and unchanged progression',route,run(){
 const g=createContext(),d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})');
 assert.equal(sha(beforeFenCavernsChunks(d.chunks)),baseline.chunksSha256,'exactly four existing terrain cells change; all existing metadata/cameras persist');
 assert.equal(sha(d.edges),baseline.edgesSha256,'no changed seams or starting-area exits');assert.equal(sha(d.tiles),baseline.tilesSha256,'no new or redefined tile types');
 const net=graph(d),east=net.flood('EASTERN_FENS_WIDE_WATER_MAP',1,8),early=net.flood('MAP3',8,11);
 assert.equal(east[net.key('MAINLAND_CN3RN14_MAP',7,3)],1,'ordinary northern fen approach is reachable');assert.equal(early[net.key('MAINLAND_CN3RN14_MAP',7,3)],0,'cave cannot bypass early progression');
 assert.equal(g.run("mapIdForChunk('overworld',3,-1)"),'FEN_RUIN_RISE_MAP');assert.equal(g.run("typeof window.FEN_RUIN_RISE_MAP"),'undefined','no regional map alias');
 assert.equal(g.run("mapIdForChunk('overworld',-3,-14)"),'MAINLAND_CN3RN14_MAP');
 assert.equal(g.run("mapRefForId('MAINLAND_C3RN9_MAP')[8][4]"),0,'old entrance restored to grass');
 for(const row of [7,8,9])assert.equal(g.run(`mapRefForId('MAINLAND_C3RN9_MAP')[${row}][3]`),3,'old rock face restored to trees');
 assert.equal(g.run("FEN_CAVE_DOORS.some(d=>d.source==='MAINLAND_C3RN9_MAP'||d.target==='MAINLAND_C3RN9_MAP')"),false,'old location has no cave trigger or return');
 const doors=J(g,'FEN_CAVE_DOORS'),maps=J(g,"[...FEN_CAVE_MAPS.map(m=>({id:m.id,map:m.map})),{id:'FEN_RUIN_RISE_MAP',map:mapRefForId('FEN_RUIN_RISE_MAP')}]");
 assert.equal(doors.length,8);assert.equal(new Set(doors.map(v=>v.source+':'+v.col+','+v.row)).size,8);
 for(const door of doors){assert.equal(g.run(`isTransitionTile(mapRefForId('${door.source}')[${door.row}][${door.col}])`),true,'visible stair at each source');assert.equal(g.run(`isTransitionTile(mapRefForId('${door.target}')[${Math.floor(door.y/32)}][${Math.floor(door.x/32)}])`),false,'arrival off the reciprocal stair');assert.ok(doors.some(back=>back.source===door.target&&back.target===door.source),'reciprocal passage');}
 for(const m of maps){
  const landing=doors.find(t=>t.target===m.id),q=[[Math.floor(landing.x/32),Math.floor(landing.y/32)]],seen=new Set([q[0].join(',')]);
  for(let i=0;i<q.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const [x,y]=q[i],xx=x+dx,yy=y+dy,k=xx+','+yy;if(d.tiles[m.map[yy]?.[xx]]?.walkable&&!seen.has(k)){seen.add(k);q.push([xx,yy]);}}
  for(let y=0;y<15;y++)for(let x=0;x<16;x++)if(d.tiles[m.map[y][x]].walkable)assert.ok(seen.has(x+','+y),m.id+' no trapped floor '+x+','+y);
  assert.ok(m.map[0].every(t=>!d.tiles[t].walkable)&&m.map[14].every(t=>!d.tiles[t].walkable)&&m.map.every(r=>!d.tiles[r[0]].walkable&&!d.tiles[r[15]].walkable),'closed physical perimeter');
 }
 for(const legacy of [false,true]){
  const v=createContext();v.run(`dialogue.open=false;debugMode=true;forceLegacyRegionalView=${legacy};persistentParty.joinEsla();transitionToLocation({mapId:'MAINLAND_CN3RN14_MAP',x:240,y:112,facing:'up'});`);const before=state(v);
  for(const [target,col,row,key]of route){
   walk(v,col*32+16,row*32+16,'approach '+target);held(v,key,()=>v.run('mapIdForRef(activeMap)')===target);
   assert.equal(v.run('canWalk(player.x,player.y)'),true);assert.deepEqual(J(v,'regionalInvariantErrors()'),[]);
   v.hold(key);v.frames(2);v.release(key);assert.equal(v.run('mapIdForRef(activeMap)'),target,'continued incoming movement does not bounce');
   assert.equal(v.run('saveGame()'),true);const location=J(v,'({p:regionalWorldPosition(),id:mapIdForRef(activeMap),x:player.x,y:player.y,f:player.facing})');
   v.run("transitionToLocation({mapId:'MAINLAND_CN3RN14_MAP',x:240,y:112})");assert.equal(v.run('loadGame()'),true);v.run('dialogue.open=false');assert.deepEqual(J(v,'({p:regionalWorldPosition(),id:mapIdForRef(activeMap),x:player.x,y:player.y,f:player.facing})'),location);
   v.frames(4);assert.equal(v.run('mapIdForRef(activeMap)'),target,'no automatic bounce');
   if(target!=='MAINLAND_CN3RN14_MAP')assert.equal(v.run('currentLocationAllowsRandomEncounters()'),false);
  }
  assert.deepEqual(state(v),before,'exploration adds no flags, rewards, healing or inventory changes');
 }
 // Every standalone cave debug destination can use the same ordinary exits.
 for(const m of maps.filter(m=>m.id!=='FEN_RUIN_RISE_MAP')){
  assert.equal(g.run(`debugWarpToDestination('fen-cave:${m.id}')`).success,true);
  assert.equal(g.run('locationName()'),g.run(`MAP_METADATA['${m.id}'].displayName`));
  g.run('dialogue.open=false;debugMode=true');const exit=doors.find(d=>d.source===m.id&&d.row===12);held(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')===exit.target);assert.equal(g.run('canWalk(player.x,player.y)'),true,'ordinary exit after debug warp');
 }
 assert.equal(g.run('validateGameData().errors'),0);assert.equal(g.run('SAVE_VERSION'),5);
}};
