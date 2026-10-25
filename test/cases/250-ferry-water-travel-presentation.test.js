'use strict';

const assert = require('assert/strict');
const { createContext } = require('../harness');

const WEST = 'EAST_CAUSEWAY_MAP';
const EAST = 'EASTERN_BANK_MAP';

function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run('dialogue.open=false;choice.open=false;MainQuest=5;syncQuestFlagsToWindow();persistentParty.joinEsla();Math=Object.create(Math);var waterRolls=0;Math.random=function(){waterRolls++;return .5};');
  return g;
}

function J(g, expression) {
  return JSON.parse(g.run('JSON.stringify(' + expression + ')'));
}

function stable(g) {
  return g.run(`JSON.stringify({
    map:mapIdForRef(activeMap),x:player.x,y:player.y,facing:player.facing,
    regional:regionalWorldPosition(),location:snapshotLocationState(),day,tick,
    cooldown:combat.cooldown,enemySequence:combatEnemyInstanceSequence,
    stats:{hp:stats.hp,gold:stats.gold,items:stats.items},party:persistentParty.getView(),
    dialogue:dialogue.open,choice:choice.open,menu:menu.open,debug:debugMenu.open,warp:warpMenu.open
  })`);
}

module.exports = {
  name: 'Reusable water travel: deterministic cable-scow presentation, exclusive input and atomic ferry arrival',
  run() {
    const g = fresh();
    const duration = g.run('WATER_TRAVEL_ROUTES.causeway_ferry.durationFrames');
    assert.equal(duration, 105, 'authored crossing is 105 frames / 1.75 seconds at 60 Hz');
    assert.deepEqual(J(g, 'Object.keys(WATER_TRAVEL_ROUTES)'), ['causeway_ferry'], 'one reusable route, no Mornay activation');
    assert.equal(g.run("Object.values(WATER_TRAVEL_ROUTES).some(r=>r.endpoints.some(e=>/^MORNAY_/.test(e.mapId)))"), false);

    // Availability and parked-side presentation are derived, never persisted.
    g.run(`MainQuest=4;placeAtLocation('${WEST}',10.5*TILE,8.5*TILE);var parked=[];var oldFill=ctx.fillRect;ctx.fillRect=function(){parked.push(Array.from(arguments))};drawCausewayFerryBody('${WEST}');ctx.fillRect=oldFill;`);
    assert.equal(g.run('parked.length'), 0, 'scow absent before MQ5');
    g.run('MainQuest=5;syncQuestFlagsToWindow();parked=[];ctx.fillRect=function(){parked.push(Array.from(arguments))};drawCausewayFerryBody("EAST_CAUSEWAY_MAP");ctx.fillRect=oldFill;');
    assert.ok(g.run('parked.length') > 0, 'scow parked on available departure shore');
    g.run('parked=[];ctx.fillRect=function(){parked.push(Array.from(arguments))};drawCausewayFerryBody("EASTERN_BANK_MAP");ctx.fillRect=oldFill;');
    assert.ok(g.run('parked.length') > 0, 'neighbor draws its cable');
    assert.equal(g.run('parked.some(r=>r[2]===76&&r[3]===20)'), false, 'no duplicate scow on opposite shore');

    // Unknown route, wrong origin and malformed destination reject before RNG/state.
    let before = stable(g), rolls = g.run('waterRolls');
    assert.equal(g.run("waterTravelController.start('unknown')"), false);
    assert.equal(stable(g), before); assert.equal(g.run('waterRolls'), rolls);
    g.run("placeAtLocation('MAP2',8.5*TILE,8.5*TILE)"); before = stable(g);
    assert.equal(g.run("crossCausewayFerry()"), false); assert.equal(stable(g), before);
    g.run(`placeAtLocation('${WEST}',10.5*TILE,8.5*TILE);var eastBankMap=mapRefForId('${EAST}');var oldLanding=eastBankMap[8][5];eastBankMap[8][5]=WATER;`);
    before = stable(g); rolls = g.run('waterRolls');
    assert.equal(g.run('crossCausewayFerry()'), false);
    assert.equal(stable(g), before); assert.equal(g.run('waterRolls'), rolls);
    g.run('eastBankMap[8][5]=oldLanding');

    // West-to-east crossing: exclusive owner, no early placement, monotonic exact path.
    before = stable(g); rolls = g.run('waterRolls');
    assert.equal(g.run('crossCausewayFerry()'), true);
    assert.equal(g.run('waterTravelController.isActive()'), true);
    assert.deepEqual(J(g, 'persistentParty.getView().members.map(m=>m.characterId)'), ['lely','esla']);
    assert.equal(g.run('canSaveHere()||saveGame()||loadGame()'), false);
    assert.equal(J(g, "debugWarpToDestination('outdoor:map2',8,8)").success, false);
    assert.equal(J(g, "debugWarpToMap('MAP2',8,8)").success, false);
    assert.equal(g.run('mapIdForRef(activeMap)'), WEST);
    assert.equal(g.run('combat.cooldown'), JSON.parse(before).cooldown, 'cooldown unchanged before arrival');
    const xs = [];
    for (let i = 0; i < duration - 1; i++) {
      const view = J(g, 'waterTravelController.getView()');
      xs.push(view.x);
      assert.equal(view.owner, 'water_travel');
      assert.equal(Number.isInteger(view.x) && Number.isInteger(view.y), true);
      assert.ok(view.x >= 38 && view.x <= 474 && view.y >= 12 && view.y <= 468, 'native geometry bounded');
      g.frames(1);
      assert.equal(g.run('mapIdForRef(activeMap)'), WEST, 'no transition before terminal frame');
    }
    assert.ok(xs.every((x, i) => i === 0 || x >= xs[i - 1]), 'eastbound progress is monotonic');
    assert.equal(g.run('waterRolls'), rolls, 'travel consumes no RNG');
    assert.equal(g.run('day'), JSON.parse(before).day, 'travel advances no day');
    assert.equal(g.run('combatEnemyInstanceSequence'), JSON.parse(before).enemySequence, 'no combat identities');

    // Rendering is read-only, uses private progress, and draws only the tableau/boat.
    const renderBefore = stable(g), viewBefore = g.run('JSON.stringify(waterTravelController.getView())');
    g.run('var travelRects=[],partyPaint=0,oldPlayer=drawPlayer;drawPlayer=function(){partyPaint++;oldPlayer()};oldFill=ctx.fillRect;ctx.fillRect=function(){travelRects.push(Array.from(arguments))};render();ctx.fillRect=oldFill;drawPlayer=oldPlayer;');
    assert.equal(stable(g), renderBefore);
    assert.equal(g.run('JSON.stringify(waterTravelController.getView())'), viewBefore);
    assert.ok(g.run('travelRects.some(r=>r[2]===76&&r[3]===20)'), 'travelling scow is visible');
    assert.equal(g.run('partyPaint'), 0, 'party field sprites are absent while aboard');
    assert.ok(g.run('travelRects.every(r=>r.every(Number.isInteger))'), 'all tableau geometry is integer aligned');
    assert.ok(g.run('travelRects.every(r=>r[0]>=0&&r[1]>=0&&r[0]+r[2]<=512&&r[1]+r[3]<=480)'), 'native geometry bounded; exact 2x scales within 1024x960');
    assert.equal(g.run('tick'), JSON.parse(renderBefore).tick, 'render does not advance general tick');

    // Active input cannot cancel, move, open menus, or launch a duplicate trip.
    const activeView = g.run('JSON.stringify(waterTravelController.getView())');
    for (const key of ['ArrowLeft','ArrowRight','Escape','m','`','Enter']) g.keydown(key, { repeat: key === 'Enter' });
    assert.equal(g.run('JSON.stringify(waterTravelController.getView())'), activeView);
    assert.equal(g.run('menu.open||debugMenu.open||warpMenu.open'), false);
    assert.equal(g.run('crossCausewayFerry()'), false, 'second confirmation cannot start another crossing');

    g.frames(1);
    assert.equal(g.run('waterTravelController.isActive()'), false);
    assert.equal(g.run('mapIdForRef(activeMap)'), EAST);
    assert.equal(g.run('player.x'), 5.5 * g.run('TILE'));
    assert.equal(g.run('player.y'), 8.5 * g.run('TILE'));
    assert.equal(g.run('player.facing'), 'right');
    assert.equal(g.run('waterRolls'), rolls);
    const arrival = g.run('JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,facing:player.facing})');
    g.frames(3);
    assert.equal(g.run('JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,facing:player.facing})'), arrival,
      'arrival callback cannot repeat');

    // Destination shore becomes the parked authority and survives ordinary save/load.
    g.run('var eastBoat=[];ctx.fillRect=function(){eastBoat.push(Array.from(arguments))};drawCausewayFerryBody("EASTERN_BANK_MAP");ctx.fillRect=oldFill;');
    assert.ok(g.run('eastBoat.some(r=>r[2]===76&&r[3]===20)'));
    assert.equal(g.run('saveGame()'), true);
    g.run("placeAtLocation('MAP2',8.5*TILE,8.5*TILE)");
    assert.equal(g.run('loadGame()'), true);
    assert.equal(g.run('mapIdForRef(activeMap)'), EAST);
    assert.equal(g.run('causewayFerryMooredMapId()'), EAST);
    g.run("placeAtLocation('EASTERN_FENS_EMBANKMENT_W_MAP',8.5*TILE,8.5*TILE)");
    assert.equal(g.run('causewayFerryMooredMapId()'), EAST, 'continuing east keeps the scow on the eastern shore');
    g.run("placeAtLocation('EASTERN_BANK_MAP',5.5*TILE,8.5*TILE)");

    // Return trip uses the same route/controller and reverses monotonically.
    g.run('dialogue.open=false;choice.open=false;stats.gold=10');
    assert.equal(g.run('crossCausewayFerry()'), true);
    const reverse = [];
    for (let i = 0; i < duration - 1; i++) { reverse.push(J(g, 'waterTravelController.getView()').x); g.frames(1); }
    assert.ok(reverse.every((x, i) => i === 0 || x <= reverse[i - 1]), 'westbound progress reverses');
    g.frames(1);
    assert.equal(g.run('mapIdForRef(activeMap)'), WEST);
    assert.equal(g.run('stats.gold'), 0, 'exact return fare settles once');
    assert.equal(g.run('player.x'), 10.5 * g.run('TILE'));

    // An unexpected arrival failure leaves the departure untouched and releases ownership.
    g.run(`dialogue.open=false;choice.open=false;var failureDeparture=JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,facing:player.facing});
      var realTransition=transitionToLocation;transitionToLocation=function(){throw Error('injected water failure')};`);
    assert.equal(g.run('crossCausewayFerry()'), true);
    g.frames(duration);
    assert.equal(g.run('waterTravelController.isActive()'), false);
    assert.equal(g.run('JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,facing:player.facing})'), g.run('failureDeparture'));
    assert.match(g.run('waterTravelController.getLastDiagnostic().message'), /injected water failure/);
    assert.equal(g.run('keys.ArrowLeft'), false, 'movement input released after failure');
    g.run('transitionToLocation=realTransition');

    // Checkpoint replacement clears a live controller; ordinary movement still works.
    assert.equal(g.run('crossCausewayFerry()'), true);
    assert.equal(g.run("storyCheckpointLab.apply('mq5_assignment_ready')"), true);
    assert.equal(g.run('waterTravelController.isActive()'), false);
    assert.equal(g.run('waterTravelController.getLastDiagnostic()'), null);
    const x = g.run('player.x');
    g.run('keys.ArrowLeft=true'); g.frames(2); g.run('keys.ArrowLeft=false');
    assert.notEqual(g.run('player.x'), x, 'ordinary movement resumes after reset');

    assert.equal(g.run('SAVE_VERSION'), 5);
    assert.equal(g.run("Object.keys(JSON.parse(localStorage.getItem('verdantVale_save')||'{}')).includes('waterTravel')"), false,
      'no travel progress or parked-side save field');
  },
};
