'use strict';
const assert=require('assert/strict');
const {fresh,J,place,until,dismiss,openService}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const neck='MORNAY_FLECK_NECK_MAP',point='MORNAY_FLECK_POINT_MAP';
test('peninsula has two mostly-water screens, safe input round trip and no fort shortcut',()=>{
 for(const legacy of [false,true]){
  const g=fresh(legacy);
  for(const id of [neck,point]){
   assert.ok(g.run(`MAP_REGISTRY['${id}'].map.flat().filter(t=>t===WATER).length`)>120);
   assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`),false);
  }
  assert.equal(g.run("mornayTownNeighbor('MORNAY_OLD_FORT_MAP','east')"),null);
  assert.equal(g.run(`mornayTownNeighbor('${neck}','west')`),null);
  place(g,'MORNAY_NORTH_UPPER_EAST_MAP',240,240);
  walk(g,240,48,'northeast approach');until(g,'ArrowUp',()=>g.run('mapIdForRef(activeMap)')===neck);
  walk(g,464,240,'neck to eastern headland');until(g,'ArrowRight',()=>g.run('mapIdForRef(activeMap)')===point);
  walk(g,368,336,'landing below the inconvenient angler');assert.equal(g.run('saveGame()'),true);
  place(g,'MORNAY_WEST_GATE_MAP');assert.equal(g.run('loadGame()'),true);dismiss(g);
  assert.equal(g.run('mapIdForRef(activeMap)'),point);
  walk(g,48,240,'return from water steps');until(g,'ArrowLeft',()=>g.run('mapIdForRef(activeMap)')===neck);
  walk(g,240,432,'return toward town');until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')==='MORNAY_NORTH_UPPER_EAST_MAP');
  assert.equal(g.run('canWalk(player.x,player.y)'),true);
 }
});
function spot(g){place(g,point,240,240);walk(g,368,368,'fishing approach');g.press(' ');}
const raw={left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',space:' '};
test('fishing uses rod and bait through input, harder prompts, rewards once, save and return',()=>{
 const g=fresh();spot(g);assert.equal(g.run('dialogue.open'),true);assert.equal(g.run('choice.open'),false);dismiss(g);
 g.run("grantItem('Old Fishing Rod')");g.press(' ');g.press('Enter');assert.equal(g.run('fishing.active'),false);dismiss(g);
 for(const [roll,fish]of [[0,'Lake Pike'],[0.99,'Valmere Perch']]){
  g.run(`grantItem('Bait');Math.random=()=>${roll};`);g.press(' ');g.press('Enter');
  assert.equal(g.run('fishing.active'),true);assert.equal(g.run('fishing.waters'),'fleck');
  assert.equal(g.run('fishing.seq.length'),10);assert.equal(g.run('fishing.windowFrames'),72);
  assert.equal(g.run("stats.items.filter(i=>i.name==='Bait').length"),0);
  assert.equal(g.run('canSaveHere()'),false);
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
  const before=g.run('stats.items.length');const seq=J(g,'fishing.seq');for(const key of seq)g.press(raw[key]);
  assert.equal(g.run('fishing.result.win'),true);assert.equal(g.run('stats.items.length'),before+1);
  assert.equal(g.run('stats.items.at(-1).name'),fish);
  g.run('fishingSuccess()');assert.equal(g.run('stats.items.length'),before+1,'repeat resolution cannot grant twice');
  g.press('Enter');assert.equal(g.run('fishing.active'),false);assert.equal(g.run('fishing.waters'),'drenwick');
 }
 assert.equal(g.run('saveGame()'),true);g.run('stats.items=[]');assert.equal(g.run('loadGame()'),true);dismiss(g);
 assert.ok(g.run("stats.items.some(i=>i.name==='Lake Pike')&&stats.items.some(i=>i.name==='Valmere Perch')"));
 for(const end of ['wrong','timeout','cancel']){
  g.run("grantItem('Bait');Math.random=()=>0");g.press(' ');g.press('Enter');const before=g.run('stats.items.length');
  if(end==='timeout')g.frames(73);else g.press(end==='cancel'?'Escape':'ArrowRight');
  assert.equal(g.run('fishing.result.win'),false);assert.equal(g.run('stats.items.length'),before);g.press('Enter');
 }
 for(let power=1;power<=3;power++){
  g.run(`startFishing(${power});`);const normal=J(g,'[fishing.seq.length,fishing.windowFrames]');g.run('endFishing()');
  g.run(`startFishing(${power},'fleck')`);const hard=J(g,'[fishing.seq.length,fishing.windowFrames]');
  assert.ok(hard[0]>normal[0]&&hard[1]<normal[1]);g.run('endFishing()');
 }
});
test('sales hatch and tavern use real buying and selling, without changing party or quests',()=>{
 for(const service of ['fleck_smoker','fleck_tavern']){
  const g=fresh();g.run('stats.gold=100');const before=J(g,'({members:persistentParty.getView().members,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');
  openService(g,service);assert.equal(g.run('shop.open'),true);g.press('Enter');g.press('Enter');
  assert.equal(g.run('stats.gold'),82);assert.equal(g.run('stats.items[0].name'),'Smoked Lake Fish');
  g.press('Escape');g.press('Escape');assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);dismiss(g);
  openService(g,service);g.press('ArrowDown');g.press('Enter');g.press('Enter');
  assert.equal(g.run('stats.gold'),91);assert.equal(g.run('stats.items.length'),0);
  g.press('Escape');g.press('Escape');g.run('stats.gold=0');openService(g,service);g.press('Enter');g.press('Enter');
  assert.equal(g.run('stats.items.length'),0);
  assert.deepEqual(J(g,'({members:persistentParty.getView().members,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})'),before);
 }
});
module.exports={name:'The Fleck: peninsula controls, rough-water fishing economy and smokehouse services',run(){for(const c of checks){const random=Math.random;try{c.run()}catch(e){e.message=c.name+': '+e.message;throw e}finally{Math.random=random;}}console.log('  '+checks.length+' Fleck lifecycle scenarios passed');}};
