'use strict';
const assert=require('assert/strict');
const {J,fresh,place,until}=require('./301-mornay-manifest.test');
function canonical(g){return g.run('JSON.stringify({party:persistentParty.getView(),stats,statusEffects,day,tick,location:snapshotLocationState(),player,regional:regionalWorldPosition(),mapId:mapIdForRef(activeMap),routes:NPC_ROUTES,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');}
module.exports={
 name:'Mornay compatibility: safe saves/no encounters across all 94 maps, solid visible fixtures and read-only rendering/validation',
 run(){
  for(const legacy of [false,true]){
   const g=fresh(legacy);g.run('Math=Object.create(Math);var mornayRandomCalls=0;Math.random=()=>{mornayRandomCalls++;throw Error("unexpected town randomness")};');
   const maps=J(g,'[...MORNAY_TOWN_MAP_IDS,...MORNAY_BUILDINGS.map(b=>b.mapId)]');assert.equal(maps.length,94);
   for(const map of maps){
    place(g,map);assert.equal(g.run('currentLocationAllowsRandomEncounters()'),false,map);
    assert.equal(g.run(`mapEntryForId(${JSON.stringify(map)}).allowSave`),true);assert.equal(g.run(`mapEntryForId(${JSON.stringify(map)}).encounterPool`),null);
    assert.equal(g.run(`mapEntryForId(${JSON.stringify(map)}).items.length`),0,'no added pickups');
    const before=canonical(g);g.run('drawMornayContent();drawMornayContent();');assert.equal(canonical(g),before,map+' content renderer is read-only');
    const rendered=JSON.parse(before);g.renderFrame();g.renderFrame();rendered.tick+=2;assert.deepEqual(JSON.parse(canonical(g)),rendered,map+' full rendering changes only existing presentation tick');
    g.hold('ArrowLeft');g.frames(16);g.release('ArrowLeft');g.hold('ArrowRight');g.frames(16);g.release('ArrowRight');
    assert.equal(g.run('combat.active'),false);assert.equal(g.run('combat.mode'),null);assert.equal(g.run('mornayRandomCalls'),0);assert.equal(g.run('mapIdForRef(activeMap)'),map);
    assert.equal(g.run('saveGame()'),true);
    const room=g.run(`mornayRoomForMap(${JSON.stringify(map)})?.id||null`);
    if(room)for(const fixture of J(g,`MORNAY_ROOM_FIXTURES[${JSON.stringify(room)}]`))assert.equal(g.run(`canWalk(${(fixture.col+.5)*32},${(fixture.row+.5)*32})`),false,room+' visible fixture collision');
   }
   assert.equal(g.run('MORNAY_ROOM_FIXTURES.mornay_infirmary.filter(f=>f.kind==="bed").length'),8);
   assert.equal(g.run('MORNAY_RESIDENTS.filter(r=>r.mapId==="MORNAY_INFIRMARY_MAP").length'),15);
   assert.equal(g.run('MORNAY_RESIDENTS.filter(r=>r.mapId==="MORNAY_INFIRMARY_MAP"&&r.role.includes("Bloommarked healer")).length'),1);
   const before=canonical(g);const validation=g.run('validateGameData()');assert.equal(canonical(g),before,'data validation cannot alter live state');assert.equal(validation.errors,0);
  }
  // Existing towns retain their ordinary field-controller exits and catalogue ownership.
  const g=fresh();for(const town of ['calwick','drenwick']){
   g.run(`enterTownAt('${town}','south');dialogue.open=false;`);assert.equal(g.run('currentTownId'),town);until(g,'ArrowDown',()=>!g.run('inTown'));
   assert.notEqual(g.run('mapIdForRef(activeMap)'),'MORNAY_WEST_GATE_MAP');assert.equal(g.run('canWalk(player.x,player.y)'),true);
  }
 }
};
