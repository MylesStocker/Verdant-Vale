'use strict';
const assert = require('assert/strict');
const {createContext} = require('../harness');
const APPROACH = 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP';
function fresh(legacy) {
  const g = createContext(); g.press('Enter'); g.press('Enter');
  g.run(`forceLegacyRegionalView=${legacy};`); return g;
}
function walkUntil(g,key,predicate,max=100) {
  g.hold(key);
  try { for(let i=0;i<max;i++){g.frames(1);if(predicate())return;} }
  finally {g.release(key);}
  assert.fail('Input route did not reach its destination: '+key);
}
function exitByControls(g,x) {
  walkUntil(g,'ArrowDown',()=>!g.run('inTown'));
  assert.equal(g.run('mapIdForRef(activeMap)'),APPROACH);
  assert.equal(g.run('player.x'),x); assert.equal(g.run('player.y'),144);
  assert.equal(g.run('player.facing'),'down');
  assert.equal(g.run('tileAt(player.x,player.y)'),2,'landing is existing PATH, not a town trigger');
  assert.equal(g.run('canWalk(player.x,player.y,9)'),true);
  assert.equal(g.run('regionalActiveMapId()'),APPROACH);
  g.frames(5); g.hold('ArrowDown'); g.frames(12); g.release('ArrowDown');
  assert.equal(g.run('inTown'),false,'continued movement must remain outside');
  assert.ok(g.run('player.y')>144,'player can leave marker without a debug escape');
}
module.exports = {
  name:'Mornay gates: input-driven paired round trips, continued departure, saves and debug arrival in both presentations',
  run() {
    for(const legacy of [false,true]) for(const [gate,x] of [['WEST',240],['EAST',272]]) {
      const id='MORNAY_'+gate+'_GATE_MAP',g=fresh(legacy);
      assert.equal(g.run(`transitionToLocation({mapId:'${APPROACH}',x:${x},y:144,facing:'up'})`),true);
      assert.equal(g.run('canWalk(player.x,player.y,9)'),true);
      walkUntil(g,'ArrowUp',()=>g.run('inTown'));
      assert.equal(g.run('mapIdForRef(activeMap)'),id);
      assert.equal(g.run('player.x'),240); assert.equal(g.run('player.y'),432);
      assert.equal(g.run('regionalPlayerWorldPoint()'),null);
      exitByControls(g,x);
      walkUntil(g,'ArrowUp',()=>g.run('inTown'));
      assert.equal(g.run('mapIdForRef(activeMap)'),id,'deliberate re-entry preserves gate identity');
      assert.equal(g.run('saveGame()'),true);
      g.run(`transitionToLocation({mapId:'${APPROACH}',x:${x},y:144,facing:'down'});dialogue.open=false;`);
      assert.equal(g.run('loadGame()'),true);
      g.run('dialogue.open=false;');
      assert.equal(g.run('mapIdForRef(activeMap)'),id);
      exitByControls(g,x);
      assert.equal(g.run('SAVE_VERSION'),5);
    }
    for(const legacy of [false,true]) {
      const g=fresh(legacy);
      assert.equal(g.run("debugWarpToDestination('town:mornay_west_gate').success"),true);
      g.run('dialogue.open=false;'); exitByControls(g,240);
      // Calwick and Drenwick keep their established ordinary south exit routes.
      for(const [town,point] of [['calwick','south'],['drenwick','south']]) {
        g.run(`enterTownAt('${town}','${point}');dialogue.open=false;`);
        walkUntil(g,'ArrowDown',()=>!g.run('inTown'));
        g.hold('ArrowDown');g.frames(12);g.release('ArrowDown');
        assert.equal(g.run('inTown'),false,town+' remains escapable');
      }
    }
  },
};
