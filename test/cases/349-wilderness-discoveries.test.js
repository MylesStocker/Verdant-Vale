'use strict';
const assert=require('assert/strict');
const {fresh,dismiss,J}=require('./301-mornay-manifest.test');
const {local,fight}=require('./333-struck-entry-expedition.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const {graph}=require('./317-mainland-navigation.test');
const {sha}=require('../regional-atlas');
const {beforeDiscoveriesChunks}=require('../fixtures/wilderness-discoveries-history');
const baseline=require('../../Art/qa/wilderness-discoveries/baseline.json');
function setup(party=false){const g=fresh();g.run('debugMode=true;stats.hp=stats.maxHp=600;stats.atk=1000;stats.def=50;stats.spd=100;');if(party)g.run('persistentParty.joinEsla()');return g;}
function visit(g,d){local(g,d.mapId,d.col*32+16,d.row*32+16);}
const count=(g,name)=>g.run(`stats.items.filter(i=>i.name===${JSON.stringify(name)}).length`);
const flags=g=>J(g,'({MainQuest,day,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])})');
function choose(g,d,index){visit(g,d);g.press(' ');dismiss(g);assert.equal(g.run('choice.open'),true);for(let n=0;n<index;n++)g.press('ArrowDown');g.press('Enter');}
module.exports={name:'Wilderness discoveries: real examine/choice input, solo/party outcomes, stable saves, concealed-tree walk and unchanged progression',run(){
 const g=setup(),sites=J(g,'WILDERNESS_DISCOVERIES'),data=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})');
 assert.equal(sites.length,10);assert.equal(new Set(sites.map(s=>s.id)).size,10);
 assert.equal(sha(beforeDiscoveriesChunks(data.chunks)),baseline.chunksSha256,'only ten item-set bindings/notes and six secret cells change');
 assert.equal(sha(data.edges),baseline.edgesSha256);assert.equal(sha(data.tiles),baseline.tilesSha256);
 const net=graph(data),east=net.flood('EASTERN_FENS_WIDE_WATER_MAP',1,8),early=net.flood('MAP3',8,11);
 for(const d of sites){assert.equal(east[net.key(d.mapId,d.col,d.row)],1,d.id+' reachable after the Rise');assert.equal(early[net.key(d.mapId,d.col,d.row)],0,'no starting-region access');assert.ok(g.run(`PICKUP_REGISTRY['${d.id}']===MAP_METADATA['${d.mapId}'].items[0]`));}
 const old=graph({...data,chunks:beforeDiscoveriesChunks(data.chunks)}),was=old.flood('EASTERN_FENS_WIDE_WATER_MAP',1,8);
 for(const c of data.chunks)for(let y=0;y<15;y++)for(let x=0;x<16;x++){
  if(c.mapId==='MAINLAND_C24R2_MAP'&&[4,5,6,7].includes(y)&&[4,5].includes(x))continue;
  assert.equal(east[net.key(c.mapId,x,y)],was[old.key(c.mapId,x,y)],'no new route beyond secret pocket');
 }
 for(const legacy of [false,true]){
  g.run(`forceLegacyRegionalView=${legacy}`);
  for(const d of sites.filter(d=>!d.enemies)){
   g.run(`PICKUP_REGISTRY['${d.id}'].picked=false`);visit(g,d);g.frames(4);assert.equal(g.run(`PICKUP_REGISTRY['${d.id}'].picked`),false,'walking over does not collect');
   const before=count(g,d.name),story=flags(g);g.press(' ');assert.equal(count(g,d.name),before+1);dismiss(g);g.press(' ');dismiss(g);assert.equal(count(g,d.name),before+1,'no duplicate');assert.deepEqual(flags(g),story);
   assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');assert.equal(g.run(`PICKUP_REGISTRY['${d.id}'].picked`),true);
  }
 }
 for(const party of [false,true])for(const d of sites.filter(d=>d.enemies)){
  const v=setup(party),i=sites.indexOf(d),story=flags(v);
  assert.equal(v.run(`scriptedPartyEncounters.start('wilderness_discovery',${i})`),false,'remote battle rejected');
  choose(v,d,d.safe?2:1);assert.equal(v.run('canonicalPartyCombat.isActive()'),false);assert.equal(v.run(`PICKUP_REGISTRY['${d.id}'].picked`),false,'declining preserves site');
  const before=count(v,d.name);choose(v,d,0);assert.equal(v.run('canonicalPartyCombat.isActive()'),true);
  assert.deepEqual(J(v,'canonicalPartyCombat.getView().enemies.map(e=>e.id)'),d.enemies);
  assert.throws(()=>v.run("scriptedPartyEncounters.finalize({}, {outcome:'victory',enemies:[]})"),'no forged reward');
  fight(v);assert.equal(count(v,d.name),before+1);assert.equal(v.run(`PICKUP_REGISTRY['${d.id}'].picked`),true);assert.deepEqual(flags(v),story);
  assert.equal(v.run('saveGame()&&loadGame()'),true);v.run('dialogue.open=false');visit(v,d);v.press(' ');assert.equal(v.run('choice.open'),false,'resolved site stays gone');assert.equal(count(v,d.name),before+1);
 }
 for(const d of sites.filter(d=>d.safe)){
  const v=setup(),before=count(v,d.safeItem),risky=count(v,d.name);choose(v,d,1);dismiss(v);
  assert.equal(count(v,d.safeItem),before+1);assert.equal(count(v,d.name),risky);assert.equal(v.run(`PICKUP_REGISTRY['${d.id}'].picked`),true);assert.equal(v.run('canonicalPartyCombat.isActive()'),false);
  assert.equal(v.run('saveGame()&&loadGame()'),true);v.run('dialogue.open=false');visit(v,d);v.press(' ');assert.equal(v.run('choice.open'),false);
 }
 for(const outcome of ['escape','defeat']){
  const v=setup(),d=sites[6];if(outcome==='defeat')v.run('stats.hp=1;stats.def=0');choose(v,d,0);fight(v,outcome);assert.equal(v.run(`PICKUP_REGISTRY['${d.id}'].picked`),false,'failed attempt stays available');
 }
 // A callback captured in one location cannot collect or start combat elsewhere.
 const v=setup(),d=sites[6];visit(v,d);v.press(' ');dismiss(v);const stale=v.run('choice.callbacks[1]');local(v,'MAINLAND_C26R1_MAP',400,208);stale();assert.equal(v.run(`PICKUP_REGISTRY['${d.id}'].picked`),false);
 // The secret is genuinely behind two tree-looking tiles; walk in and back in both modes.
 for(const legacy of [false,true]){
  const v=setup();v.run(`forceLegacyRegionalView=${legacy}`);local(v,'MAINLAND_C24R2_MAP',176,272);v.press(' ');assert.match(J(v,'dialogue.pages').flat().join(' '),/hanging branches/);dismiss(v);
  for(const row of [7,6])assert.equal(v.run(`mapRefForId('MAINLAND_C24R2_MAP')[${row}][5]`),73);
  walk(v,176,176,'through apparently solid trees');assert.equal(v.run('saveGame()&&loadGame()'),true);v.run('dialogue.open=false');walk(v,144,144,'hidden cache');v.press(' ');dismiss(v);assert.equal(count(v,'Void Shard'),1);walk(v,176,272,'return through branches');assert.deepEqual(J(v,'regionalInvariantErrors()'),[]);
 }
 // Saves predating the discoveries contain no IDs for them and load with all available.
 const oldSave=setup();assert.equal(oldSave.run('saveGame()'),true);oldSave.run("for(const d of WILDERNESS_DISCOVERIES)PICKUP_REGISTRY[d.id].picked=true");assert.equal(oldSave.run('loadGame()'),true);assert.equal(oldSave.run('WILDERNESS_DISCOVERIES.every(d=>!PICKUP_REGISTRY[d.id].picked)'),true);
 assert.equal(g.run('SAVE_VERSION'),5);assert.equal(g.run('validateGameData().errors'),0);
}};
