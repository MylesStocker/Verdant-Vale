'use strict';
const assert = require('assert/strict');
const {createContext} = require('../harness');
const EAST = 'EASTERN_BANK_MAP', WEST = 'EAST_CAUSEWAY_MAP';
const J = (g,expression) => JSON.parse(g.run('JSON.stringify('+expression+')'));
function fresh(legacy=false) {
  const g=createContext();g.press('Enter');g.press('Enter');
  g.run(`dialogue.open=false;choice.open=false;MainQuest=5;syncQuestFlagsToWindow();
    persistentParty.joinEsla();forceLegacyRegionalView=${legacy};stats.gold=27;
    transitionToLocation({mapId:'${EAST}',x:5.5*TILE,y:8.5*TILE,facing:'up'});`);
  return g;
}
function talk(g) {
  // Approach the actual bank operator using movement, then ordinary interaction.
  g.hold('ArrowUp');g.frames(6);g.release('ArrowUp');g.press('Enter');
  assert.equal(g.run('dialogue.open'),true);
  assert.equal(g.run('dialogue.name'),'Imperial Guard');
}
function choose(g,index=0) {
  for(let i=0;g.run('dialogue.open')&&i<30;i++){g.renderFrame();g.press('Enter');}
  assert.equal(g.run('choice.open'),true);
  if(index)g.press('ArrowDown');g.press('Enter');
}
function complete(g) {g.frames(g.run('WATER_TRAVEL_ROUTES.causeway_ferry.durationFrames'));}
function location(g) {return g.run('JSON.stringify({world:regionalWorldPosition(),location:snapshotLocationState(),x:player.x,y:player.y})');}
module.exports={
 name:'Return ferry: guarded 10g fare, ordinary input, reverse travel, atomic failure and persistence',
 run(){
  for(const legacy of [false,true]){
    const g=fresh(legacy);talk(g);
    assert.deepEqual(J(g,'dialogue.pageSpeakers'),['causeway_ferry_operator','esla','causeway_ferry_operator']);
    assert.match(g.run('dialogue.pages.flat().join(" ")'),/blatant exploitation/);
    g.run('dialogue.page=1');
    assert.equal(g.run('dialoguePagePresentation().styleId'),'esla_light_green');
    g.run('dialogue.page=0');choose(g,1);
    assert.equal(g.run('stats.gold'),27);assert.equal(g.run('waterTravelController.isActive()'),false);
    g.press('Enter');choose(g);
    assert.equal(g.run('waterTravelController.isActive()'),true);
    assert.equal(g.run('waterTravelController.getView().direction'),'west');
    const departure=g.run('waterTravelController.getView().x');
    g.frames(25);assert.ok(g.run('waterTravelController.getView().x')<departure);
    g.run('var repeatPay=choice.callbacks[0];repeatPay();');
    complete(g);
    assert.equal(g.run('regionalActiveMapId()'),WEST);
    assert.equal(g.run('stats.gold'),17);
    g.run('repeatPay()');g.frames(5);assert.equal(g.run('stats.gold'),17);
    assert.equal(g.run('player.facing'),'left');
    assert.equal(g.run('saveGame()'),true);
    g.run('stats.gold=999;placeAtLocation("EASTERN_BANK_MAP",5.5*TILE,8.5*TILE)');
    assert.equal(g.run('loadGame()'),true);
    assert.equal(g.run('stats.gold'),17);assert.equal(g.run('regionalActiveMapId()'),WEST);
    // Outbound official passage stays free even when no gold is available.
    g.run('stats.gold=0;dialogue.open=false;choice.open=false');
    assert.equal(g.run('crossCausewayFerry()'),true);complete(g);
    assert.equal(g.run('regionalActiveMapId()'),EAST);assert.equal(g.run('stats.gold'),0);
    assert.equal(g.run('crossCausewayFerry()'),false,'direct controller cannot bypass fare');
  }
  for(const gold of [0,9]){
    const g=fresh();g.run('stats.gold='+gold);talk(g);const before=location(g);choose(g);
    assert.equal(g.run('waterTravelController.isActive()'),false);
    assert.equal(g.run('stats.gold'),gold);assert.equal(location(g),before);
    assert.match(g.run('dialogue.pages.flat().join(" ")'),/Not enough/);
    assert.equal(g.run('crossCausewayFerry()'),false);
  }
  {
    const g=fresh();g.run('stats.gold=10');talk(g);choose(g);complete(g);
    assert.equal(g.run('regionalActiveMapId()'),WEST);assert.equal(g.run('stats.gold'),0);
  }
  for(const failure of ['blocked landing','arrival fault','abort','reset']){
    const g=fresh();const before=location(g);
    if(failure==='blocked landing'){
      g.run('var landing=mapRefForId("EAST_CAUSEWAY_MAP");landing[8][10]=WATER');
      assert.equal(g.run('crossCausewayFerry()'),false);
    }else{
      assert.equal(g.run('crossCausewayFerry()'),true);
      if(failure==='arrival fault'){
        g.run('transitionToLocation=function(){throw Error("paid arrival fault")}');complete(g);
        assert.match(g.run('waterTravelController.getLastDiagnostic().message'),/paid arrival fault/);
      }else if(failure==='abort')g.run('waterTravelController.emergencyAbort("test abort")');
      else g.run('waterTravelController.reset()');
    }
    assert.equal(g.run('stats.gold'),27,failure+' cannot consume fare');
    assert.equal(location(g),before,failure+' cannot move party');
    assert.equal(g.run('waterTravelController.isActive()'),false);
  }
  {
    const g=fresh();talk(g);choose(g,1);g.press('Enter');
    while(g.run('dialogue.open'))g.press('Enter');
    g.run('var stalePay=choice.callbacks[0];choice.open=false;placeAtLocation("MAP2",8.5*TILE,8.5*TILE);stalePay()');
    assert.equal(g.run('waterTravelController.isActive()'),false);assert.equal(g.run('stats.gold'),27);
  }
  {
    const g=createContext();g.press('Enter');g.press('Enter');
    g.run('MainQuest=5;syncQuestFlagsToWindow();placeAtLocation("EASTERN_BANK_MAP",5.5*TILE,7.9*TILE);interactCausewayFerry()');
    assert.equal(g.run('dialogue.pageSpeakers.includes("esla")'),false,'absent Esla cannot speak');
    assert.equal(g.run('SAVE_VERSION'),5);
  }
 }
};
