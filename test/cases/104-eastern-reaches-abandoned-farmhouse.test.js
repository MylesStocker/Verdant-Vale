'use strict';
// The second Eastern Reaches farmhouse: dedicated safe interior, grounded
// inspectables, deterministic reclaimed-floor rendering, and minimal MAP2 reeds.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'ABANDONED_FARMHOUSE_MAP';
const MAP2_FP = 'f7c253c495451b51adab13a9a884064f0aab96298376749010d6e506043de46d';
const OLD_MAP2_FP = '879a6f9ea7fe373b2dc1a026c7374c1b2743288a533edac74bbcce263a571d5b';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

module.exports = {
  name: 'Eastern Reaches abandoned farmhouse: entry, household clues, reeds, save and safe-location contract',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (expr) => JSON.parse(g.run(expr));
    const TILE = g.run('TILE');
    const map = J(`JSON.stringify(${ID})`);
    const map2 = J('JSON.stringify(MAP2)');

    // 1. Dedicated registered safe interior, normal content identity, no loot/NPCs.
    assert.equal(map.length, 15); assert.ok(map.every((row) => row.length === 16));
    assert.equal(g.run(`MAP_CATALOG['${ID}'].map===${ID}`), true);
    assert.deepEqual(J(`JSON.stringify((function(){var m=MAP_CATALOG['${ID}'];return {name:m.displayName,region:m.region,type:m.type,items:m.items.length,pool:m.encounterPool,encounters:m.allowRandomEncounters,save:m.allowSave};})())`),
      { name:'Abandoned Farmhouse', region:'Eastern Reaches', type:'interior', items:0, pool:null, encounters:false, save:true });
    assert.equal(g.run("SIMPLE_NPCS.some(function(n){return n.map==='abandoned_farmhouse'||n.physicalMapId==='ABANDONED_FARMHOUSE_MAP';})"), false);

    // 2. Exact interior structure: ordinary walls/floor/tables and one exit.
    const counts = {};
    for (const tile of map.flat()) counts[tile] = (counts[tile] || 0) + 1;
    assert.deepEqual(counts, { 18:86, 19:149, 20:1, 33:4 });
    assert.equal(map[12][7], g.run('INTERIOR_EXIT'));
    assert.equal(g.run(`isTileWalkable(${map[11][7]})`), true);

    // 3. Only seven immediate-yard cells changed on MAP2; seams/borders and both
    // FARM_HOUSE positions remain exact.
    const expectedReeds = [[10,12],[11,12],[13,12],[14,12],[10,13],[11,13],[13,13]];
    for (const [x,y] of expectedReeds) assert.equal(map2[y][x], g.run('REEDS'));
    assert.equal(map2[12][2], g.run('FARM_HOUSE')); assert.equal(map2[13][12], g.run('FARM_HOUSE'));
    assert.equal(map2[12][12], g.run('PATH')); assert.ok(map2[14].every((tile) => tile === g.run('TREE')));
    assert.equal(sha256(JSON.stringify(map2)), MAP2_FP); assert.equal(GRID_FP.fingerprints.MAP2, MAP2_FP);
    const oldMap2 = map2.map((row) => row.slice());
    for (const [x,y] of expectedReeds) oldMap2[y][x] = g.run('GRASS');
    assert.equal(sha256(JSON.stringify(oldMap2)), OLD_MAP2_FP, 'MAP2 delta is exactly the seven reviewed reed cells');

    // 4. The actual movement branch enters the second house; the dedicated
    // wrapper/exit use canonical placement and the safe north doorstep.
    assert.equal(g.run("resetLocationState();placeAtLocation('MAP2',12.5*TILE,12.55*TILE);player.facing='down';true"), true);
    g.hold('ArrowDown');
    for (let i=0;i<24 && !g.run('inAbandonedFarmhouse');i++) g.frames(1);
    g.release('ArrowDown');
    assert.equal(g.run('inAbandonedFarmhouse&&activeMap===ABANDONED_FARMHOUSE_MAP'), true);
    assert.equal(g.run('currentContentLocationKey()'), 'abandoned_farmhouse');
    assert.equal(g.run('locationName()'), 'Abandoned Farmhouse');
    assert.equal(g.run('player.x'), 7.5*TILE); assert.equal(g.run('player.y'), 11.5*TILE);
    assert.equal(g.run('exitAbandonedFarmhouse(); activeMap===MAP2'), true);
    assert.equal(g.run('inAbandonedFarmhouse'), false);
    assert.equal(g.run('player.x'), 12.5*TILE); assert.equal(g.run('player.y'), 12.5*TILE);
    assert.equal(g.run('player.facing'), 'down'); assert.equal(g.run('canWalk(player.x,player.y)'), true);
    assert.equal(g.run('combat.cooldown===ENCOUNTER_COOLDOWN'), true);

    // 5. Four repeatable physical observations, including the required child's
    // clothing and floorboard reed patch. Their authored text stays grounded.
    const features = J(`JSON.stringify(MAP_FEATURES['${ID}'])`);
    assert.deepEqual(features.map((f) => f.id), [
      'abandoned_farmhouse_child_clothes','abandoned_farmhouse_cold_hearth',
      'abandoned_farmhouse_tally','abandoned_farmhouse_floor_reeds',
    ]);
    assert.ok(features.every((f) => f.type === 'inspect' && !f.onceFlag && !f.flag && !f.condition));
    const allText = features.flatMap((f) => f.pages.flat(2)).join(' ');
    assert.match(allText, /children’s clothes/i); assert.match(allText, /floorboards/i); assert.match(allText, /reeds/i);
    assert.match(allText, /seed|lamp oil|boot leather|cooper/i);
    assert.doesNotMatch(allText, /rareborn|magic|spell|sorcery|enchant/i);
    const probes = [[4.5,5.5,'Children’s clothes'],[11.5,4.5,'Cold hearth'],[5.5,7.5,'Farm tally'],[10.5,9.5,'Reeds through the floor']];
    for (const [x,y,name] of probes) {
      g.run(`enterAbandonedFarmhouse();player.x=${x}*TILE;player.y=${y}*TILE;dialogue.open=false;choice.open=false;shop.open=false;`);
      g.run('handleInteract()'); assert.equal(g.run('dialogue.open'), true, name + ' opens'); assert.equal(g.run('dialogue.name'), name);
    }

    // 6. Procedural overlays dispatch in the ordinary active-content renderer,
    // are deterministic, and the reed patch retains walkable floor collision.
    assert.equal(map[9][10], g.run('INTERIOR_FLOOR'));
    assert.equal(g.run('enterAbandonedFarmhouse();canWalk(10.5*TILE,9.5*TILE)'), true);
    assert.doesNotThrow(() => g.renderFrame());
    const renderSource = fs.readFileSync(path.join(__dirname,'..','..','render.js'),'utf8');
    const interiorSource = fs.readFileSync(path.join(__dirname,'..','..','render-interiors.js'),'utf8');
    assert.match(renderSource,/inAbandonedFarmhouse\)\s+drawAbandonedFarmhouseFurniture\(\)/);
    assert.match(interiorSource,/function drawAbandonedFarmhouseFurniture\(\)/);
    assert.doesNotMatch(interiorSource,/Math\.random/);

    // 7. The physical metadata gate suppresses encounters before randomness;
    // debug warp and v4 save/load preserve the dedicated location mode exactly.
    assert.equal(g.run('currentLocationAllowsRandomEncounters()'), false);
    const safe = J(`(function(){dialogue.open=false;choice.open=false;shop.open=false;menu.open=false;debugMode=false;combat.active=false;combat.cooldown=0;player.step=15;player.x=8.5*TILE;player.y=8.5*TILE;for(var k in keys)delete keys[k];keys.ArrowRight=true;var calls=0,_r=Math.random;Math.random=function(){calls++;return 0;};update();Math.random=_r;for(var k in keys)delete keys[k];return JSON.stringify({calls:calls,combat:combat.active,map:mapIdForRef(activeMap)});})()`);
    assert.deepEqual(safe,{calls:0,combat:false,map:ID});
    assert.equal(g.run("debugWarpToDestination('interior:abandoned_farmhouse').success"), true);
    assert.equal(g.run(`activeMap===${ID}&&inAbandonedFarmhouse&&canWalk(player.x,player.y)`), true);
    g.run("player.x=9.5*TILE;player.y=8.5*TILE;player.facing='left';saveGame();resetLocationState();activeMap=MAP;player.x=8.5*TILE;player.y=8.5*TILE;");
    assert.equal(g.run('loadGame()'), true);
    assert.equal(g.run(`activeMap===${ID}&&inAbandonedFarmhouse&&!inLorraHouse`), true);
    assert.equal(g.run('player.x'), 9.5*TILE); assert.equal(g.run('player.y'), 8.5*TILE); assert.equal(g.run('player.facing'), 'left');
    assert.equal(g.run('SAVE_VERSION'), 4); assert.equal(g.run('Object.keys(MAP_CATALOG).length'), 118);
    const validation = J('JSON.stringify(validateGameData())'); assert.equal(validation.errors,0); assert.equal(validation.warnings,4);
    const audit = require('../transition-audit.js');
    for (const name of ['enterAbandonedFarmhouse','exitAbandonedFarmhouse']) {
      const record = audit.results.find((r) => r.name === name);
      assert.ok(record, name + ' is included in the transition audit'); assert.equal(record.verdict,'OK');
    }
  },
};
