'use strict';
// Five-floor abandoned lighthouse: discrete topology, safe transitions,
// persistent lightkeeper supplies, and route-authorized broken-lens objectives.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const MAP_IDS = [
  'LIGHTHOUSE_GROUND_MAP',
  'LIGHTHOUSE_LANDING_1_MAP',
  'LIGHTHOUSE_LANDING_2_MAP',
  'LIGHTHOUSE_LANDING_3_MAP',
  'LIGHTHOUSE_LANTERN_MAP',
];

function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run('debugMode=true;dialogue.open=false;choice.open=false;shop.open=false;menu.open=false;');
  return g;
}

function inventoryCount(g, name) {
  return g.run(`stats.items.filter(function(item){return item&&item.name===${JSON.stringify(name)};}).length`);
}

function closeUi(g) {
  g.run('dialogue.open=false;dialogue.callbacks=null;choice.open=false;shop.open=false;menu.open=false;');
}

function establishRoute(g, route, stage) {
  const outcome = route === 'supervisor'
    ? 'fort_quest_stage=6;smugglers_dead=true;fort_report_filed=false;smugglers_execution_day=0;'
    : 'fort_quest_stage=6;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;';
  g.run(`${outcome}reservoir_quest_started=true;MainQuest=4;lighthouse_quest_stage=${stage};syncQuestFlagsToWindow();`);
}

function walkToTransition(g, mapId, x, y, key, expectedMapId) {
  closeUi(g);
  g.run(`activeMap=${mapId};inLighthouse=true;player.x=${x}*TILE;player.y=${y}*TILE;combat.cooldown=999;`);
  g.hold(key);
  for (let i = 0; i < 30 && !g.run(`activeMap===${expectedMapId}`); i++) g.frames(1);
  g.release(key);
  assert.equal(g.run(`activeMap===${expectedMapId}`), true, `${mapId} ${key} reaches ${expectedMapId}`);
  assert.equal(g.run('canWalk(player.x,player.y)'), true, `${expectedMapId} landing is walkable`);
  assert.equal(g.run('isTransitionTile(tileAt(player.x,player.y))'), false, `${expectedMapId} landing is neutral`);
  const landed = g.run('mapIdForRef(activeMap)');
  g.frames(2);
  assert.equal(g.run('mapIdForRef(activeMap)'), landed, `${expectedMapId} does not bounce after landing`);
}

function moveUntil(g, key, predicate, message, maxFrames = 48) {
  g.hold(key);
  for (let i = 0; i < maxFrames && !g.run(predicate); i++) g.frames(1);
  g.release(key);
  assert.equal(g.run(predicate), true, message);
}

function climbLanding(g, sourceMapId, targetMapId, targetX, targetY) {
  assert.equal(g.run(`activeMap===${sourceMapId}&&player.x===7.5*TILE&&player.y===8.5*TILE`), true, `${sourceMapId} starts at lower neutral landing`);
  moveUntil(g, 'ArrowRight', 'player.x===8.5*TILE', `${sourceMapId} reaches the east side`);
  moveUntil(g, 'ArrowUp', 'player.y===6.5*TILE', `${sourceMapId} climbs the east side`);
  moveUntil(g, 'ArrowLeft', `activeMap===${targetMapId}`, `${sourceMapId} reaches ${targetMapId}`);
  assert.equal(g.run(`player.x===${targetX}*TILE&&player.y===${targetY}*TILE&&canWalk(player.x,player.y)&&!isTransitionTile(tileAt(player.x,player.y))`), true, `${targetMapId} receives a safe fractional landing`);
  const landed = g.run('mapIdForRef(activeMap)');
  g.frames(2);
  assert.equal(g.run('mapIdForRef(activeMap)'), landed, `${targetMapId} does not bounce`);
}

function descendLanding(g, sourceMapId, targetMapId, targetX, targetY) {
  assert.equal(g.run(`activeMap===${sourceMapId}&&player.x===7.5*TILE&&player.y===6.5*TILE`), true, `${sourceMapId} starts at upper neutral landing`);
  moveUntil(g, 'ArrowRight', 'player.x===8.5*TILE', `${sourceMapId} reaches the east side`);
  moveUntil(g, 'ArrowDown', 'player.y===8.5*TILE', `${sourceMapId} descends the east side`);
  moveUntil(g, 'ArrowLeft', `activeMap===${targetMapId}`, `${sourceMapId} reaches ${targetMapId}`);
  assert.equal(g.run(`player.x===${targetX}*TILE&&player.y===${targetY}*TILE&&canWalk(player.x,player.y)&&!isTransitionTile(tileAt(player.x,player.y))`), true, `${targetMapId} receives a safe fractional landing`);
  const landed = g.run('mapIdForRef(activeMap)');
  g.frames(2);
  assert.equal(g.run('mapIdForRef(activeMap)'), landed, `${targetMapId} does not bounce`);
}

function shortestCardinalPath(walkable, start, target) {
  const queue = [[start]];
  const seen = new Set([start.join(',')]);
  while (queue.length) {
    const path = queue.shift();
    const [col, row] = path[path.length - 1];
    if (col === target[0] && row === target[1]) return path;
    for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const next = [col + dc, row + dr];
      const key = next.join(',');
      const localCol = next[0] - 6, localRow = next[1] - 6;
      if (localRow < 0 || localRow >= walkable.length || localCol < 0 || localCol >= walkable[0].length) continue;
      if (!walkable[localRow][localCol] || seen.has(key)) continue;
      seen.add(key);
      queue.push(path.concat([next]));
    }
  }
  return null;
}

module.exports = {
  name: 'Thornmere lighthouse interior: five-floor topology, persistent cabinet and exclusive lens objectives',
  run() {
    const g = fresh();
    const J = (expr) => JSON.parse(g.run(expr));

    // ── 1. Five distinct discrete, saveable, encounter-BEARING maps ────────
    // The four lower floors share the base lighthouse pool (2 enemies); the
    // lantern room (top floor) uses the extended pool (3 — it adds the moth).
    const expectedNames = [
      'Abandoned Lighthouse — Ground Floor',
      'Abandoned Lighthouse — First Landing',
      'Abandoned Lighthouse — Second Landing',
      'Abandoned Lighthouse — Third Landing',
      'Abandoned Lighthouse — Lantern Room',
    ];
    MAP_IDS.forEach((id, i) => {
      const meta = J(`JSON.stringify((function(){var m=MAP_CATALOG['${id}'];return {id:m.id,name:m.displayName,type:m.type,items:m.items.length,pool:(m.encounterPool?m.encounterPool.length:null),encounters:m.allowRandomEncounters,save:m.allowSave,rows:m.map.length,cols:m.map[0].length};})())`);
      assert.deepEqual(meta, { id, name:expectedNames[i], type:'interior', items:0, pool:(i === 4 ? 3 : 2), encounters:true, save:true, rows:15, cols:16 });
      assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${id}']===undefined`), true, `${id} is not regional`);
    });
    // Lantern-room pool is the lower-floor pool plus the top-floor-only Lantern Moth.
    assert.equal(g.run("MAP_CATALOG['LIGHTHOUSE_GROUND_MAP'].encounterPool===LIGHTHOUSE_ENEMY_TEMPLATES"), true, 'lower floors use the base pool');
    assert.equal(g.run("MAP_CATALOG['LIGHTHOUSE_LANTERN_MAP'].encounterPool===LIGHTHOUSE_TOP_ENEMY_TEMPLATES"), true, 'lantern room uses the top pool');
    assert.equal(g.run("LIGHTHOUSE_TOP_ENEMY_TEMPLATES.some(function(e){return e.id==='enemy_lantern_moth';})"), true, 'Lantern Moth is in the top pool');
    assert.equal(g.run("LIGHTHOUSE_ENEMY_TEMPLATES.some(function(e){return e.id==='enemy_lantern_moth';})"), false, 'Lantern Moth is NOT on the lower floors');
    assert.equal(g.run('LIGHTHOUSE_GROUND_MAP.flat().filter(function(t){return t===INTERIOR_FLOOR||t===DUNGEON2_STAIRS_UP;}).length'), 25, 'ground walkable footprint is 5×5');
    const intendedSpiral = [[6,8],[7,8],[8,8],[8,7],[8,6],[7,6],[6,6]];
    for (const id of MAP_IDS.slice(1, 4)) {
      assert.deepEqual(
        J(`JSON.stringify(${id}.slice(6,9).map(function(row){return row.slice(6,9);}))`),
        [[11,18,18],[19,19,18],[10,18,18]],
        `${id} uses the shared clockwise landing topology`,
      );
      assert.equal(g.run(`${id}[6][6]===DUNGEON2_STAIRS_UP`), true, `${id} stairs up are c6/r6`);
      assert.equal(g.run(`${id}[8][6]===DUNGEON_STAIRS_DOWN`), true, `${id} stairs down remain c6/r8`);
      assert.equal(g.run(`${id}[6][8]===INTERIOR_FLOOR`), true, `${id} old c8/r6 stair is ordinary floor`);
      assert.equal(g.run(`${id}[7][6]===INTERIOR_WALL&&!isTileWalkable(${id}[7][6])`), true, `${id} west-middle core is masonry`);
      assert.equal(g.run(`${id}[7][7]===INTERIOR_WALL&&!isTileWalkable(${id}[7][7])`), true, `${id} centre core is masonry`);
      const walkable = J(`JSON.stringify(${id}.slice(6,9).map(function(row){return row.slice(6,9).map(isTileWalkable);}))`);
      assert.equal(walkable.flat().filter(Boolean).length, 7, `${id} keeps seven walkable cells inside its 3×3 footprint`);
      assert.deepEqual(shortestCardinalPath(walkable, [6,8], [6,6]), intendedSpiral, `${id} shortest route uses all five intermediate floor cells`);
    }
    assert.equal(g.run('LIGHTHOUSE_LANTERN_MAP.flat().filter(function(t){return isTileWalkable(t);}).length'), 16, 'lantern walkable footprint is 4×4');
    assert.equal(g.run('MAP5[7][9]===LIGHTHOUSE'), true, 'exterior lighthouse remains at c9 r7');

    // The real square hitbox cannot squeeze diagonally through either west
    // corner of the two-cell masonry core. Disable stair dispatch for these
    // collision-only probes so stepping on c6/r6 or c6/r8 cannot change maps.
    for (const id of MAP_IDS.slice(1, 4)) {
      g.run(`resetLocationState();__clearRegionalPositionForTest();activeMap=${id};player.x=7.5*TILE;player.y=8.5*TILE;combat.cooldown=999;`);
      g.hold('ArrowUp'); g.hold('ArrowLeft'); g.frames(32); g.release('ArrowUp'); g.release('ArrowLeft');
      assert.equal(g.run('Math.floor(player.y/TILE)'), 8, `${id} cannot squeeze diagonally north through the lower core corner`);
      assert.equal(g.run('canWalk(player.x,player.y)'), true);
      g.run('player.x=7.5*TILE;player.y=6.5*TILE;');
      g.hold('ArrowDown'); g.hold('ArrowLeft'); g.frames(32); g.release('ArrowDown'); g.release('ArrowLeft');
      assert.equal(g.run('Math.floor(player.y/TILE)'), 6, `${id} cannot squeeze diagonally south through the upper core corner`);
      assert.equal(g.run('canWalk(player.x,player.y)'), true);
    }

    const arrivals = [
      ['ascendLighthouseGround',    'LIGHTHOUSE_LANDING_1_MAP', 7.5, 8.5, 'up',   6, 8],
      ['ascendLighthouseLanding1',  'LIGHTHOUSE_LANDING_2_MAP', 7.5, 8.5, 'up',   6, 8],
      ['ascendLighthouseLanding2',  'LIGHTHOUSE_LANDING_3_MAP', 7.5, 8.5, 'up',   6, 8],
      ['descendLighthouseLanding2', 'LIGHTHOUSE_LANDING_1_MAP', 7.5, 6.5, 'down', 6, 6],
      ['descendLighthouseLanding3', 'LIGHTHOUSE_LANDING_2_MAP', 7.5, 6.5, 'down', 6, 6],
      ['descendLighthouseLantern',  'LIGHTHOUSE_LANDING_3_MAP', 7.5, 6.5, 'down', 6, 6],
    ];
    for (const [fn, id, x, y, facing, stairCol, stairRow] of arrivals) {
      g.run(`resetLocationState();combat.cooldown=0;${fn}();`);
      assert.equal(g.run(`activeMap===${id}&&inLighthouse&&player.x===${x}*TILE&&player.y===${y}*TILE&&player.facing==='${facing}'`), true, `${fn} uses the intended fractional landing and facing`);
      assert.equal(g.run('canWalk(player.x,player.y)&&!isTransitionTile(tileAt(player.x,player.y))'), true, `${fn} lands on neutral walkable floor`);
      assert.equal(g.run(`Math.abs(Math.floor(player.x/TILE)-${stairCol})+Math.abs(Math.floor(player.y/TILE)-${stairRow})`), 1, `${fn} lands adjacent to its return stair`);
      // Inter-floor moves deliberately impose NO arrival cooldown, so the per-step
      // encounter roll can begin immediately on the tiny arriving floor (the
      // landings are too small for a full ENCOUNTER_COOLDOWN grace to ever expire).
      assert.equal(g.run('combat.cooldown'), 0, `${fn} imposes no arrival cooldown`);
    }

    // ── 2. Actual entry, reciprocal stairs, and uninterrupted round trip ─
    g.run("resetLocationState();placeAtLocation('MAP5',8.5*TILE,7.5*TILE);player.facing='right';");
    g.run('handleInteract();');
    assert.equal(g.run('inLighthouse&&activeMap===LIGHTHOUSE_GROUND_MAP'), true, 'entry works before quest acceptance');
    assert.equal(g.run('player.x===7.5*TILE&&player.y===9.5*TILE&&player.facing===\'up\''), true, 'entry lands beside the exit');
    assert.equal(g.run('lighthouse_quest_stage'), 0, 'visiting does not select a route');

    walkToTransition(g, 'LIGHTHOUSE_GROUND_MAP', 9.5, 6.5, 'ArrowUp', 'LIGHTHOUSE_LANDING_1_MAP');
    walkToTransition(g, 'LIGHTHOUSE_LANDING_1_MAP', 7.5, 8.5, 'ArrowLeft', 'LIGHTHOUSE_GROUND_MAP');
    walkToTransition(g, 'LIGHTHOUSE_GROUND_MAP', 9.5, 6.5, 'ArrowUp', 'LIGHTHOUSE_LANDING_1_MAP');
    climbLanding(g, 'LIGHTHOUSE_LANDING_1_MAP', 'LIGHTHOUSE_LANDING_2_MAP', 7.5, 8.5);
    climbLanding(g, 'LIGHTHOUSE_LANDING_2_MAP', 'LIGHTHOUSE_LANDING_3_MAP', 7.5, 8.5);
    climbLanding(g, 'LIGHTHOUSE_LANDING_3_MAP', 'LIGHTHOUSE_LANTERN_MAP', 6.5, 7.5);
    walkToTransition(g, 'LIGHTHOUSE_LANTERN_MAP', 6.5, 7.5, 'ArrowDown', 'LIGHTHOUSE_LANDING_3_MAP');
    descendLanding(g, 'LIGHTHOUSE_LANDING_3_MAP', 'LIGHTHOUSE_LANDING_2_MAP', 7.5, 6.5);
    descendLanding(g, 'LIGHTHOUSE_LANDING_2_MAP', 'LIGHTHOUSE_LANDING_1_MAP', 7.5, 6.5);
    descendLanding(g, 'LIGHTHOUSE_LANDING_1_MAP', 'LIGHTHOUSE_GROUND_MAP', 9.5, 6.5);
    walkToTransition(g, 'LIGHTHOUSE_GROUND_MAP', 7.5, 9.5, 'ArrowDown', 'MAP5');
    assert.equal(g.run('inLighthouse'), false, 'exterior exit clears the discrete lighthouse mode');
    assert.equal(g.run('player.x===8.5*TILE&&player.y===7.5*TILE&&player.facing===\'left\''), true, 'exit returns safely west of c9 r7');

    // ── 3. Every floor debug-warps safely and save/load restores a floor ────
    const warpIds = ['ground','landing_1','landing_2','landing_3','lantern'];
    warpIds.forEach((suffix, i) => {
      const result = J(`JSON.stringify(debugWarpToDestination('special:lighthouse_${suffix}'))`);
      assert.equal(result.success, true, `debug warp ${suffix}`);
      assert.equal(g.run(`activeMap===${MAP_IDS[i]}&&inLighthouse&&canWalk(player.x,player.y)`), true);
      assert.equal(g.run('locationName()'), 'Abandoned Lighthouse');
      assert.equal(g.run('currentContentLocationKey()'), 'lighthouse');
      // Encounters are now live on every floor; each debug-warp landing sits on
      // an ordinary INTERIOR_FLOOR cell, which is the eligible tile inside the tower.
      assert.equal(g.run('currentLocationAllowsRandomEncounters()'), true);
      assert.equal(g.run('tileAt(player.x,player.y)===INTERIOR_FLOOR'), true, `${suffix} debug-warp lands on interior floor`);
      assert.equal(g.run('isEncounterEligibleTile(tileAt(player.x,player.y))'), true);
      if (i >= 1 && i <= 3) {
        assert.equal(g.run(`(function(){var d=debugDestinationById('special:lighthouse_${suffix}');return d.defaultCol===7&&d.defaultRow===7;})()`), true, `${suffix} debug destination remains unchanged`);
        assert.deepEqual([result.col, result.row], [7, 6], `${suffix} safely uses the established nearest-walkable fallback`);
      }
    });
    g.run("transitionToLocation({mapId:'LIGHTHOUSE_LANDING_2_MAP',x:7.5*TILE,y:8.5*TILE,facing:'right',state:{inLighthouse:true}});saveGame();resetLocationState();activeMap=MAP;player.x=8.5*TILE;player.y=8.5*TILE;");
    assert.equal(g.run('loadGame()'), true);
    assert.equal(g.run("activeMap===LIGHTHOUSE_LANDING_2_MAP&&inLighthouse&&player.x===7.5*TILE&&player.y===8.5*TILE&&player.facing==='right'"), true, 'landing save/load round trip');
    g.run("debugWarpToDestination('special:lighthouse_lantern');");
    g.run("player.x=7.5*TILE;player.y=6.5*TILE;player.facing='left';saveGame();resetLocationState();activeMap=MAP;player.x=8.5*TILE;player.y=8.5*TILE;");
    assert.equal(g.run('loadGame()'), true);
    assert.equal(g.run("activeMap===LIGHTHOUSE_LANTERN_MAP&&inLighthouse&&player.x===7.5*TILE&&player.y===6.5*TILE&&player.facing==='left'"), true, 'lantern save/load round trip');

    // ── 4. Cabinet is one-time, persistent two-item loot ───────────────────
    g.run("transitionToLocation({mapId:'LIGHTHOUSE_GROUND_MAP',x:6.5*TILE,y:7.5*TILE,facing:'left',state:{inLighthouse:true}});stats.items=[];lighthouse_cabinet_looted=false;syncQuestFlagsToWindow();");
    g.run('handleInteract();');
    assert.equal(inventoryCount(g, 'Elixir'), 1); assert.equal(inventoryCount(g, 'Reed Remedy'), 1);
    assert.equal(g.run('lighthouse_cabinet_looted'), true);
    closeUi(g); g.run('handleInteract();');
    assert.equal(inventoryCount(g, 'Elixir'), 1); assert.equal(inventoryCount(g, 'Reed Remedy'), 1, 'repeat cabinet examination grants nothing');
    closeUi(g); g.run('saveGame();stats.items=[];lighthouse_cabinet_looted=false;syncQuestFlagsToWindow();loadGame();');
    assert.equal(g.run('lighthouse_cabinet_looted'), true, 'cabinet binding survives load');
    assert.equal(inventoryCount(g, 'Elixir'), 1); assert.equal(inventoryCount(g, 'Reed Remedy'), 1);
    closeUi(g); g.run('handleInteract();');
    assert.equal(inventoryCount(g, 'Elixir'), 1); assert.equal(inventoryCount(g, 'Reed Remedy'), 1, 'load cannot duplicate supplies');

    // Table and bed are description only and render without throwing.
    closeUi(g); g.run('player.x=6.5*TILE;player.y=5.5*TILE;');
    const beforeTable = g.run('JSON.stringify([stats.items,stats.hp,day,lighthouse_quest_stage,lighthouse_cabinet_looted])');
    g.run('handleInteract();');
    assert.equal(g.run('JSON.stringify([stats.items,stats.hp,day,lighthouse_quest_stage,lighthouse_cabinet_looted])'), beforeTable);
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /logbook/i);
    closeUi(g); g.run("transitionToLocation({mapId:'LIGHTHOUSE_LANTERN_MAP',x:8.5*TILE,y:7.5*TILE,facing:'right',state:{inLighthouse:true}});");
    const beforeBed = g.run('JSON.stringify([stats.items,stats.hp,day,lighthouse_quest_stage,lighthouse_cabinet_looted])');
    g.run('handleInteract();');
    assert.equal(g.run('JSON.stringify([stats.items,stats.hp,day,lighthouse_quest_stage,lighthouse_cabinet_looted])'), beforeBed);
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /salt and age/i);
    assert.doesNotThrow(() => g.renderFrame());

    // ── 5. Lens: atmosphere without a route; no route selection ───────────
    closeUi(g); g.run('stats.items=[];lighthouse_quest_stage=0;player.x=7.5*TILE;player.y=5.5*TILE;syncQuestFlagsToWindow();');
    const noRouteBefore = g.run('JSON.stringify([stats.items,lighthouse_quest_stage,stats.gold])');
    g.run('handleInteract();');
    assert.equal(g.run('JSON.stringify([stats.items,lighthouse_quest_stage,stats.gold])'), noRouteBefore);
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /cracked.*clouded|clouded.*cracked/i);
    assert.equal(g.run('getActiveLighthouseObjective()'), null);

    // ── 6. Supervisor lens (spider unresolved): describes the ring behind the web
    //      and offers the reach-through choice; grants nothing directly. Decline is
    //      a no-op. Then the resolved-replacement path restores one ring, no battle.
    //      (The full battle lifecycle lives in the focused Lensweb Spider test.)
    establishRoute(g, 'supervisor', 1); closeUi(g);
    g.run('stats.items=[];lighthouse_spider_resolved=false;player.x=7.5*TILE;player.y=5.5*TILE;syncQuestFlagsToWindow();');
    g.run('handleInteract();');
    assert.equal(inventoryCount(g, 'Old Engagement Ring'), 0, 'lens grants nothing directly while the spider guards the lens');
    assert.equal(g.run('lighthouse_quest_stage'), 1, 'lens does not complete the route');
    const supDesc = g.run("dialogue.pages.flat().join(' ')");
    assert.match(supDesc, /lower mounting plate/i); assert.match(supDesc, /ring/i); assert.match(supDesc, /spider/i);
    assert.doesNotMatch(supDesc, /gem|loose stone|recess/i, 'excluded route objective is not mentioned');
    g.run('handleInteract();'); g.run('handleInteract();'); // advance the descriptive dialogue to the choice
    assert.equal(g.run('choice.open'), true, 'reach-through choice is offered');
    assert.match(g.run('choice.title'), /reach through the web/i);
    assert.equal(g.run('combat.active'), false, 'no battle until the player chooses to reach through');
    g.run('choice.open=false; choice.callbacks[1]();'); // Decline
    assert.equal(inventoryCount(g, 'Old Engagement Ring'), 0, 'declining grants nothing');
    assert.equal(g.run('combat.active'), false); assert.equal(g.run('lighthouse_spider_resolved'), false);
    assert.equal(g.run('lighthouse_quest_stage'), 1, 'declining changes no state');
    // Resolved replacement: spider dealt with, item absent → restore exactly one, no battle.
    closeUi(g); g.run('stats.items=[];lighthouse_spider_resolved=true;player.x=7.5*TILE;player.y=5.5*TILE;syncQuestFlagsToWindow();');
    g.run('handleInteract();');
    assert.equal(inventoryCount(g, 'Old Engagement Ring'), 1, 'resolved lens restores one ring, no battle');
    assert.equal(g.run('combat.active'), false);
    closeUi(g); g.run('handleInteract();'); assert.equal(inventoryCount(g, 'Old Engagement Ring'), 1, 'held item: no duplicate');
    closeUi(g); g.run("player.x=7.5*TILE;player.y=6.5*TILE;player.facing='down';saveGame();stats.items=[];lighthouse_spider_resolved=false;lighthouse_quest_stage=0;loadGame();");
    assert.equal(g.run("activeMap===LIGHTHOUSE_LANTERN_MAP&&inLighthouse"), true);
    assert.equal(inventoryCount(g, 'Old Engagement Ring'), 1, 'ring survives save/load');
    assert.equal(g.run('lighthouse_spider_resolved'), true, 'resolved flag survives save/load');
    g.run('stats.items=[];lighthouse_quest_stage=2;syncQuestFlagsToWindow();'); closeUi(g); g.run('handleInteract();');
    assert.equal(inventoryCount(g, 'Old Engagement Ring'), 0, 'completed Supervisor route grants nothing');

    // ── 7. Polwick lens mirrors the same front and replacement contract ────
    const p = fresh(); establishRoute(p, 'polwick', 3);
    p.run("transitionToLocation({mapId:'LIGHTHOUSE_LANTERN_MAP',x:7.5*TILE,y:5.5*TILE,facing:'right',state:{inLighthouse:true}});stats.items=[];lighthouse_spider_resolved=false;syncQuestFlagsToWindow();");
    p.run('handleInteract();');
    assert.equal(inventoryCount(p, 'Stashed Gem'), 0, 'lens grants nothing directly');
    assert.equal(p.run('lighthouse_quest_stage'), 3);
    const polDesc = p.run("dialogue.pages.flat().join(' ')");
    assert.match(polDesc, /loose stone.*recess|recess.*loose stone/i); assert.match(polDesc, /gem/i); assert.match(polDesc, /spider/i);
    assert.doesNotMatch(polDesc, /ring|mounting plate/i, 'excluded route objective is not mentioned');
    p.run('handleInteract();'); p.run('handleInteract();');
    assert.equal(p.run('choice.open'), true, 'reach-through choice is offered');
    p.run('choice.open=false; choice.callbacks[1]();'); // Decline
    assert.equal(inventoryCount(p, 'Stashed Gem'), 0); assert.equal(p.run('lighthouse_spider_resolved'), false);
    p.run('stats.items=[];lighthouse_spider_resolved=true;player.x=7.5*TILE;player.y=5.5*TILE;syncQuestFlagsToWindow();'); closeUi(p);
    p.run('handleInteract();');
    assert.equal(inventoryCount(p, 'Stashed Gem'), 1, 'resolved lens restores one gem, no battle');
    closeUi(p); p.run('saveGame();stats.items=[];lighthouse_spider_resolved=false;loadGame();'); assert.equal(inventoryCount(p, 'Stashed Gem'), 1);
    assert.equal(p.run('lighthouse_spider_resolved'), true);
    p.run('stats.items=[];lighthouse_quest_stage=4;syncQuestFlagsToWindow();'); closeUi(p); p.run('handleInteract();');
    assert.equal(inventoryCount(p, 'Stashed Gem'), 0, 'completed Polwick route grants nothing');

    // ── 8. Malformed state fails closed; wrong-route item reveals no route ─
    establishRoute(p, 'polwick', 1); // Supervisor stage + allied outcome is contradictory.
    p.run('stats.items=[];lighthouse_spider_resolved=false;'); closeUi(p); p.run('handleInteract();');
    assert.equal(p.run('getActiveLighthouseObjective()'), null);
    assert.equal(inventoryCount(p, 'Old Engagement Ring') + inventoryCount(p, 'Stashed Gem'), 0, 'malformed route grants nothing');
    assert.doesNotMatch(p.run("dialogue.pages.flat().join(' ')"), /ring|gem|recess|mounting plate/i);
    assert.equal(p.run('choice.open'), false, 'malformed state offers no reach-through choice');

    establishRoute(p, 'supervisor', 1);
    p.run("stats.items=[];grantItem('Stashed Gem');lighthouse_spider_resolved=false;player.x=7.5*TILE;player.y=5.5*TILE;syncQuestFlagsToWindow();"); closeUi(p); p.run('handleInteract();');
    assert.equal(inventoryCount(p, 'Stashed Gem'), 1, 'wrong-route item is untouched');
    assert.equal(inventoryCount(p, 'Old Engagement Ring'), 0, 'lens does not grant the selected item directly');
    const wrongDesc = p.run("dialogue.pages.flat().join(' ')");
    assert.match(wrongDesc, /ring|mounting plate/i, 'only the selected route objective is described');
    assert.doesNotMatch(wrongDesc, /stashed gem|loose stone|recess/i, 'excluded objective is not mentioned');

    // ── 9. Interactions/transitions are deterministic and cannot fight ─────
    const deterministic = J(`(function(){
      var calls=0,old=Math.random;Math.random=function(){calls++;return 0;};
      combat.active=false;dialogue.open=false;stats.items=[];lighthouse_quest_stage=0;
      enterLighthouse();ascendLighthouseGround();ascendLighthouseLanding1();ascendLighthouseLanding2();ascendLighthouseLanding3();
      player.x=7.5*TILE;player.y=5.5*TILE;interactLighthouseInterior();
      Math.random=old;return JSON.stringify({calls:calls,combat:combat.active});
    })()`);
    assert.deepEqual(deterministic, { calls:0, combat:false });

    // Givers point to the exact hiding places; no regional fingerprint moved.
    const root = path.join(__dirname, '..', '..');
    const supervisorSource = fs.readFileSync(path.join(root, 'content/interactions/calwick-interactions.js'), 'utf8');
    const polwickSource = fs.readFileSync(path.join(root, 'content/interactions/thornmere-wilds-interactions.js'), 'utf8');
    assert.match(supervisorSource, /lower mounting plate of the old lens/i);
    assert.match(polwickSource, /loose stone behind the old lens frame/i);
    const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG[${JSON.stringify(id)}].map)`)), fp, `${id} regional grid unchanged`);
    }
    assert.equal(g.run('SAVE_VERSION'), 4);
    const validation = J('JSON.stringify(validateGameData())');
    assert.equal(validation.errors, 0); assert.equal(validation.warnings, 4);
  },
};
