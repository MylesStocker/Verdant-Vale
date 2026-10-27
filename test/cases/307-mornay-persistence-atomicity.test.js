'use strict';
const assert=require('assert/strict');
const {J,fresh,place,dismiss}=require('./301-mornay-manifest.test');
function state(g){return g.run('JSON.stringify({party:persistentParty.getView(),stats,statusEffects,slitherSpd,day,tick,location:snapshotLocationState(),player,mapId:mapIdForRef(activeMap),regional:regionalWorldPosition(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),routes:NPC_ROUTES,save:localStorage.getItem("verdantVale_save")})');}
module.exports={
 name:'Mornay persistence: every room round-trips existing v5 schema; forged room/map/town contexts fail atomically',
 run(){
  const g=fresh();g.run('console=Object.create(console);var mornayWarnings=[];console.warn=(...args)=>mornayWarnings.push(args.join(" "));');assert.equal(g.run('saveGame()'),true);const originalKeys=Object.keys(JSON.parse(g.run('localStorage.getItem("verdantVale_save")'))).sort();
  g.run('persistentParty.joinEsla();stats.gold=432;stats.hp=17;statusEffects=["burn"];MainQuest=5;');
  const rooms=J(g,'MORNAY_BUILDINGS');
  for(const b of rooms){
   place(g,b.mapId);const party=J(g,'persistentParty.getView()');assert.equal(g.run('saveGame()'),true);const raw=g.run('localStorage.getItem("verdantVale_save")'),saved=JSON.parse(raw);
   assert.deepEqual(Object.keys(saved).sort(),originalKeys,'rooms introduce no persistent fields');assert.equal(saved.version,5);
   assert.deepEqual(saved.location,{kind:'discrete',mapId:b.mapId,localPxX:240,localPxY:b.returnRow<b.doorRow?48:432});assert.equal(saved.townBuilding,b.id);assert.equal(saved.currentTownId,'mornay');assert.equal(saved.inTown,true);
   assert.doesNotMatch(raw,/NPC_ROUTES|MOVEMENT_HOMES|mornayPopulation|mornayNetwork|factionReputation|forceLegacyRegionalView|camera/);
   place(g,'MORNAY_EAST_GATE_MAP');assert.equal(g.run('loadGame()'),true);dismiss(g);assert.equal(g.run('mapIdForRef(activeMap)'),b.mapId);assert.equal(g.run('townBuilding'),b.id);assert.deepEqual(J(g,'persistentParty.getView()'),party);
   for(const edit of ['d.townBuilding=null','d.currentTownId="drenwick"','d.inTown=false','d.currentHouseId="forged"','d.location.mapId="MORNAY_WEST_GATE_MAP"','d.location.mapId="MORNAY_MISSING_MAP"','d.location.localPxX=0','d.houseSourceMapId="TOWN_MAP"']){
    g.run('var mornayValid='+JSON.stringify(raw)+';var d=JSON.parse(mornayValid);'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(d));');
    const before=state(g);assert.equal(g.run('loadGame()'),false,b.id+' rejects '+edit);assert.equal(state(g),before,'no partial load on '+edit);
   }
   g.run('localStorage.setItem("verdantVale_save",mornayValid);');assert.equal(g.run('loadGame()'),true);dismiss(g);
  }
  for(const options of ["{mapId:'MORNAY_OFFICE_MAP',x:240,y:432,state:{inTown:true,currentTownId:'mornay',townBuilding:null}}","{mapId:'MORNAY_WEST_GATE_MAP',x:240,y:432,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_office'}}","{mapId:'MORNAY_OFFICE_MAP',x:240,y:432,state:{inTown:true,currentTownId:'calwick',townBuilding:'mornay_office'}}"]){
   const before=state(g);assert.equal(g.run('transitionToLocation('+options+')'),false);assert.equal(state(g),before,'forged transition cannot partially commit');
  }
  assert.ok(g.run('mornayWarnings.length')>=rooms.length*8,'rejected saves report diagnostics');
  const before=state(g);assert.equal(g.run('enterMornayBuilding("mornay_office")'),false,'entry requires correct source exterior');assert.equal(state(g),before);
 }
};
