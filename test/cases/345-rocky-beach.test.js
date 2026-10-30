'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {sha}=require('../regional-atlas');
const {beforeRockyChunks,beforeRockyTiles}=require('../fixtures/rocky-beach-history');
const before=require('../fixtures/rocky-beach-invariants.json');
const cells=require('../../Art/qa/rocky-beach/grid-deltas.json');
const {J,held}=require('./317-mainland-navigation.test');
const T=require('./341-great-fen-tactics.test');
module.exports={name:'Rocky Beach: exclusive standing-tile encounters, unchanged geography, controls, saves and both combat engines',run(){
 const g=createContext(),d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})');
 assert.equal(sha(beforeRockyChunks(d.chunks)),before.chunksSha256,'all grids/metadata outside reviewed beach cells unchanged');
 assert.equal(sha(beforeRockyTiles(d.tiles)),before.tilesSha256,'all old terrain properties unchanged');
 assert.equal(sha(d.edges),before.edgesSha256,'every seam and progression boundary unchanged');
 assert.equal(g.run('ROCKY_BEACH'),134);assert.equal(g.run('window.ROCKY_BEACH'),134);
 const byId=new Map(d.chunks.map(c=>[c.mapId,c]));
 assert.equal(new Set(cells.map(v=>[v.mapId,v.row,v.col].join(':'))).size,cells.length);
 assert.equal(d.chunks.reduce((n,c)=>n+c.map.flat().filter(t=>t===134).length,0),cells.length);
 for(const a of cells){
  assert.ok(d.tiles[a.fromTile].walkable&&d.tiles[a.fromTile].encounterEligible,'no opened barriers or newly dangerous safe ground');
  if(a.row===0||a.row===14||a.col===0||a.col===15)assert.ok([88,128].includes(a.fromTile),'only existing gravel/stone shore continues across seams');
  assert.ok(!a.mapId.includes('MORNAY'));assert.ok(!d.tiles[a.fromTile].isTransition);
  const c=byId.get(a.mapId),expected=c.allowRandomEncounters&&c.playerAccessible!==false;
  const source=`geographicEncounterContext('overworld',${(c.chunkX*16+a.col+.5)*32},${(c.chunkY*15+a.row+.5)*32})`;
  assert.equal(g.run(source+'.encounterPool===ROCKY_BEACH_ENEMY_TEMPLATES'),expected,c.mapId);
  if(expected){assert.equal(g.run(`MAP_METADATA['${a.mapId}'].items.some(i=>Math.floor(i.x/32)===${a.col}&&Math.floor(i.y/32)===${a.row})`),false,'no pickup under beach');}
 }
 const ids=J(g,'ROCKY_BEACH_ENEMY_TEMPLATES.map(t=>t.id)');assert.deepEqual(ids,['enemy_shingleback_crab','enemy_storm_gull']);
 assert.deepEqual(J(g,'ENEMY_TEMPLATE_POOLS.filter(p=>p.templates.some(e=>(e.enemies||[e.id]).some(id=>ROCKY_BEACH_ENEMY_TEMPLATES.some(t=>t.id===id)))).map(p=>p.id)'),['pool_rocky_beach'],'no beach enemy leaks into other pools');
 // Cross the terrain boundary through player controls in both movement modes.
 for(const legacy of [false,true]){
  g.run(`dialogue.open=false;debugMode=true;forceLegacyRegionalView=${legacy};`);
  const c=byId.get('VALMERE_EXPANSE_C14RN3_MAP'),y=5,x=c.map[y].indexOf(134);
  assert.ok(x>0&&c.map[y][x-1]!==134&&d.tiles[c.map[y][x-1]].walkable);
  assert.equal(g.run(`transitionToLocation({mapId:'${c.mapId}',x:${(x-.5)*32},y:${(y+.5)*32},state:{}})`),true);
  assert.equal(g.run(`currentEncounterPool()===MAP_METADATA['${c.mapId}'].encounterPool`),true);
  held(g,'ArrowRight',()=>g.run('tileAt(player.x,player.y)===ROCKY_BEACH'));
  assert.equal(g.run('currentEncounterPool()===ROCKY_BEACH_ENEMY_TEMPLATES'),true);
  const pos=J(g,'regionalWorldPosition()');assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');assert.deepEqual(J(g,'regionalWorldPosition()'),pos);
  assert.equal(g.run('currentEncounterPool()===ROCKY_BEACH_ENEMY_TEMPLATES'),true);
  held(g,'ArrowLeft',()=>g.run('tileAt(player.x,player.y)!==ROCKY_BEACH'));
  assert.equal(g.run(`currentEncounterPool()===MAP_METADATA['${c.mapId}'].encounterPool`),true);
  // Corrupt profile must fail closed without selecting the ordinary map pool.
  held(g,'ArrowRight',()=>g.run('tileAt(player.x,player.y)===ROCKY_BEACH'));
  g.run("var savedProfile=TILE_PROPERTIES[ROCKY_BEACH].encounterProfileId;TILE_PROPERTIES[ROCKY_BEACH].encounterProfileId='missing_profile'");
  assert.equal(g.run('encounterGeographyOk()'),false);assert.equal(g.run('currentEncounterPool()===EMPTY_ENCOUNTER_POOL'),true);
  g.run('TILE_PROPERTIES[ROCKY_BEACH].encounterProfileId=savedProfile');
  assert.equal(g.run("transitionToLocation({mapId:'VALMERE_EXPANSE_C14RN3_MAP',x:304,y:16,state:{}})"),true);
  held(g,'ArrowUp',()=>g.run('regionalActiveMapId()')==='VALMERE_EXPANSE_C14RN4_MAP');
  assert.equal(g.run('tileAt(player.x,player.y)===ROCKY_BEACH&&currentEncounterPool()===ROCKY_BEACH_ENEMY_TEMPLATES'),true);
  held(g,'ArrowDown',()=>g.run('regionalActiveMapId()')==='VALMERE_EXPANSE_C14RN3_MAP');
  assert.deepEqual(J(g,'regionalInvariantErrors()'),[]);

 }
 // Natural random entry, plus genuine Attack/Observe rounds on the shared engine.
 for(const id of ids)for(const party of [false,true]){
  const b=T.fresh(null,party);b.run("transitionToLocation({mapId:'VALMERE_EXPANSE_C14RN3_MAP',x:304,y:176,state:{}});debugMode=false;combat.cooldown=0;player.step=15;var draws=0;Math.random=()=>draws++===0?0:draws===2?"+(id===ids[0]?'.25':'.75')+":.5;");b.hold('ArrowDown');b.frames(2);b.release('ArrowDown');
  if(party){assert.equal(T.view(b).enemies[0].id,id);T.round(b,'attack');T.ack(b);b.run('drawPartyBattle(canonicalPartyCombat.getView())');}
  else{assert.equal(b.run('combat.enemy.id'),id);b.frames(10);b.press('Enter');assert.equal(b.run('combat.phase'),'message');b.renderFrame();}
 }
 for(const id of ids){const b=T.fresh([id.slice(6)],true);T.round(b,'observe');T.ack(b);T.round(b,'attack');b.run('drawPartyBattle(canonicalPartyCombat.getView())');}
 assert.equal(g.run('SAVE_VERSION'),5);assert.equal(g.run('validateGameData().errors'),0);
}};
