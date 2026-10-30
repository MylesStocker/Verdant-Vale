'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {J,graph,held}=require('./317-mainland-navigation.test');
const {dismiss}=require('./301-mornay-manifest.test');
const cells=require('../../Art/qa/valmere-access/grid-deltas.json');
const edgeDeltas=require('../../Art/qa/valmere-access/edge-deltas.json');
const {opened}=require('../fixtures/valmere-access-history');
module.exports={name:'Valmere access: shore return paths, real seamless/legacy crossings, encounters, saves and early Zolom warning',run(){
 const g=createContext();g.press('Enter');g.press('Enter');g.run('dialogue.open=false;debugMode=true;');
 const d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})'),net=graph(d),seen=net.flood('EASTERN_FENS_ENVELOPE_C7R0_MAP',7,14);
 assert.equal(opened.size,11);assert.equal(cells.length,88);
 for(const cell of cells){const c=d.chunks.find(c=>c.mapId===cell.mapId);assert.ok([9,10].includes(c.chunkX)&&c.chunkY<0);assert.equal(cell.fromTile,3);assert.ok([0,23].includes(cell.toTile));assert.equal(c.map[cell.row][cell.col],cell.toTile);}
 for(const c of d.chunks.filter(c=>[9,10].includes(c.chunkX)&&c.chunkY<0&&c.playerAccessible!==false))for(let y=0;y<15;y++)for(let x=0;x<16;x++)if(d.tiles[c.map[y][x]].walkable)assert.equal(seen[net.key(c.mapId,x,y)],1,c.mapId+' shore return '+x+','+y);
 for(const legacy of [false,true]){
  g.run('forceLegacyRegionalView='+legacy);
  // Exercise every changed segment at its midpoint using the ordinary controls.
  for(const delta of edgeDeltas)for(const s of delta.after||[]){
   const i=Math.floor((s.sourceRange[0]+s.sourceRange[1])/2),edge=delta.edge;
   const [col,row,key]=edge==='east'?[15,i,'ArrowRight']:edge==='west'?[0,i,'ArrowLeft']:edge==='north'?[i,0,'ArrowUp']:[i,14,'ArrowDown'];
   assert.equal(g.run('transitionToLocation('+JSON.stringify({mapId:delta.mapId,x:col*32+16,y:row*32+16,state:{}})+')'),true);
   g.run('dialogue.open=false');held(g,key,()=>g.run('regionalActiveMapId()')===s.targetMap);
   assert.deepEqual(J(g,'regionalInvariantErrors()'),[]);
  }
  for(const id of opened){const c=d.chunks.find(c=>c.mapId===id);const index=c.map.flat().findIndex(t=>d.tiles[t].walkable),x=(index%16+.5)*32,y=(Math.floor(index/16)+.5)*32;
   assert.equal(g.run('transitionToLocation('+JSON.stringify({mapId:id,x,y,state:{}})+')'),true);g.run('dialogue.open=false');
   const p=J(g,'regionalWorldPosition()');assert.equal(g.run('saveGame()&&loadGame()'),true);dismiss(g);assert.deepEqual(J(g,'regionalWorldPosition()'),p);
   assert.equal(g.run('currentEncounterPool()===EASTERN_FENS_MORNAY_HARD_FORMATIONS'),true);assert.equal(g.run('currentLocationAllowsRandomEncounters()'),true);
  }
 }
 // Ordinary walk into (7,0); warning must precede any possible encounter RNG.
 for(const legacy of [false,true]){
  const w=createContext();w.press('Enter');w.press('Enter');w.run('dialogue.open=false;forceLegacyRegionalView='+legacy+';Math=Object.create(Math);Math.random=()=>{throw Error("warning must precede RNG")};transitionToLocation({mapId:"EASTERN_FENS_REEDBELT_N_MAP",x:240,y:16,state:{}});');
  held(w,'ArrowUp',()=>w.run('regionalActiveMapId()')==='EASTERN_FENS_ENVELOPE_C7R0_MAP');w.frames();assert.equal(w.run('dialogue.open'),true);
  assert.match(J(w,'dialogue.pages').flat().join(' '),/Fen Zolom.*running.*Serpentsmoke/);
  const position=J(w,'regionalWorldPosition()');w.hold('ArrowUp');w.frames(20);w.release('ArrowUp');assert.deepEqual(J(w,'regionalWorldPosition()'),position);assert.equal(w.run('combat.active'),false);
  dismiss(w);w.frames();assert.equal(w.run('dialogue.open'),false,'no repeated warning while inside');held(w,'ArrowDown',()=>w.run('regionalActiveMapId()')==='EASTERN_FENS_REEDBELT_N_MAP');
  held(w,'ArrowUp',()=>w.run('regionalActiveMapId()')==='EASTERN_FENS_ENVELOPE_C7R0_MAP');w.frames();assert.equal(w.run('dialogue.open'),true,'warn on a fresh visit');
 }
 const debug=createContext();debug.press('Enter');debug.press('Enter');debug.run('dialogue.open=false;transitionToLocation({mapId:"EASTERN_FENS_ENVELOPE_C7R0_MAP",x:240,y:336,state:{}});');debug.frames();assert.equal(debug.run('dialogue.open'),true,'direct/debug arrival warns before walking');dismiss(debug);assert.equal(debug.run('saveGame()&&loadGame()'),true);dismiss(debug);debug.frames();assert.equal(debug.run('combat.active'),false);
 assert.equal(g.run('validateGameData().errors'),0);assert.equal(g.run('SAVE_VERSION'),5);
}};
