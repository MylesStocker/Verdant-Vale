'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {J,graph}=require('./317-mainland-navigation.test');
const {dismiss}=require('./301-mornay-manifest.test');
const state=g=>J(g,'({stats,party:persistentParty.serialize(),statusEffects,day,flags:Object.fromEntries(QUEST_FLAG_BINDINGS.filter(b=>!b.key.startsWith("wilderness_dream_")).map(b=>[b.key,b.get()]))})');
const site=(g,d,x=d.col*32-1)=>{assert.equal(g.run(`transitionToLocation({mapId:'${d.mapId}',x:${x},y:${d.row*32+16},state:{},facing:'right'})`),true);g.run('dialogue.open=false');};
const step=g=>{g.hold('ArrowRight');g.frames(1);g.release('ArrowRight');};
module.exports={name:'Wilderness dreams: five reachable one-time walking events, exact white-map return, Esla styling and v5 persistence',run(){
 const catalog=createContext(),defs=J(catalog,'WILDERNESS_DREAMS');assert.equal(defs.length,5);
 assert.equal(new Set(defs.map(d=>d.flag)).size,5);
 const world=J(catalog,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})'),net=graph(world),seen=net.flood('EASTERN_FENS_WIDE_WATER_MAP',1,8);
 for(const d of defs)assert.equal(seen[net.key(d.mapId,d.col,d.row)],1,d.id+' reachable from later mainland without opening sealed southern area');
 for(const legacy of [false,true])for(const withEsla of [false,true])for(const d of defs){
  const g=createContext();g.run(`dialogue.open=false;debugMode=false;forceLegacyRegionalView=${legacy};${withEsla?'persistentParty.joinEsla();':''}`);
  site(g,d);const before=state(g);assert.equal(g.run('saveGame()'),true);const saved=g.run('localStorage.getItem("verdantVale_save")');
  g.run('Math=Object.create(Math);Math.random=()=>{throw Error("Dream must precede encounter RNG")};player.step=15;combat.cooldown=0;');
  g.frames(2);assert.equal(g.run('wildernessDreams.isActive()'),false,'standing still does not trigger');step(g);
  assert.equal(g.run('activeMap===DREAM_MAP&&dialogue.open&&wildernessDreams.isActive()'),true,d.id);
  assert.equal(g.run(`window['${d.flag}']`),true);
  const back=J(g,'({id:mapIdForRef(_dreamReturn.map),x:_dreamReturn.x,y:_dreamReturn.y,facing:_dreamReturn.facing,state:_dreamReturn.state})');
  assert.equal(back.id,d.mapId);assert.ok(back.x>=d.col*32&&back.x<d.col*32+4,'actual entry cell');
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);assert.equal(g.run('localStorage.getItem("verdantVale_save")'),saved);
  assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('currentLocationAllowsRandomEncounters()'),false);
  const white=J(g,'({x:player.x,y:player.y})');g.hold('ArrowUp');g.frames(24);g.release('ArrowUp');assert.deepEqual(J(g,'({x:player.x,y:player.y})'),white);
  assert.deepEqual(J(g,'dialogue.pages'),d.pages);assert.equal(g.run('dialoguePagePresentation().styleId'),null);
  for(let i=0;i<d.pages.length;i++)g.press('Enter');
  assert.equal(g.run('wildernessDreams.isActive()'),false);assert.equal(g.run('mapIdForRef(activeMap)'),d.mapId);
  assert.deepEqual(J(g,'snapshotLocationState()'),back.state);assert.equal(g.run('player.x'),back.x);assert.equal(g.run('player.y'),back.y);assert.equal(g.run('player.facing'),back.facing);
  assert.deepEqual(J(g,'regionalInvariantErrors()'),[]);assert.deepEqual(state(g),before,'vision has no rewards, healing, day or quest effects');
  assert.equal(g.run('dialogue.open'),withEsla);
  if(withEsla){assert.deepEqual(J(g,'dialogue.pageSpeakers'),[null,'esla']);assert.equal(g.run('dialoguePagePresentation().styleId'),null);g.press('Enter');assert.equal(g.run('dialoguePagePresentation().styleId'),'esla_light_green');assert.match(g.run('dialogue.pages[dialogue.page].join(" ")'),/all right/);dismiss(g);}
  g.run('Math.random=()=>.99');assert.equal(g.run('saveGame()&&loadGame()'),true);dismiss(g);site(g,d);step(g);assert.equal(g.run('wildernessDreams.isActive()'),false,'no repeat after save/load');
  assert.equal(g.run(`window['${d.flag}']`),true);
 }
 // One completed site never suppresses another; all five remain independent.
 const all=createContext();all.run('dialogue.open=false;debugMode=true');
 for(const d of defs){site(all,d);step(all);assert.equal(all.run('wildernessDreams.isActive()'),true);dismiss(all);}
 assert.equal(all.run('WILDERNESS_DREAMS.every(d=>window[d.flag]===true)'),true);
 // Older v5 saves default only the new fields. Malformed fields fail atomically.
 all.run('saveGame();var old=JSON.parse(localStorage.getItem("verdantVale_save"));for(const d of WILDERNESS_DREAMS)delete old[d.flag];localStorage.setItem("verdantVale_save",JSON.stringify(old));');assert.equal(all.run('loadGame()'),true);dismiss(all);
 assert.equal(all.run('WILDERNESS_DREAMS.every(d=>window[d.flag]===false)'),true);
 const unchanged=state(all);all.run('old[WILDERNESS_DREAMS[0].flag]="yes";localStorage.setItem("verdantVale_save",JSON.stringify(old))');assert.equal(all.run('loadGame()'),false);assert.deepEqual(state(all),unchanged);
 // Spawning/loading directly on an unseen site is inert until leaving/re-entering.
 const direct=createContext();direct.run('dialogue.open=false;debugMode=true');site(direct,defs[0],defs[0].col*32+16);direct.frames(10);step(direct);assert.equal(direct.run('wildernessDreams.isActive()'),false);
 direct.hold('ArrowLeft');direct.frames(20);direct.release('ArrowLeft');assert.equal(direct.run('wildernessDreams.isActive()'),false);direct.hold('ArrowRight');for(let i=0;i<30&&!direct.run('wildernessDreams.isActive()');i++)direct.frames(1);direct.release('ArrowRight');assert.equal(direct.run('wildernessDreams.isActive()'),true,'ordinary leave and re-entry triggers an unseen spawn site');
 assert.equal(catalog.run('validateGameData().errors'),0);assert.equal(catalog.run('SAVE_VERSION'),5);
}};
