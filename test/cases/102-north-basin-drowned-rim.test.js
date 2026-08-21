'use strict';
// NORTH_BASIN_NW2_MAP — accessible flooded woodland at overworld (0,0).
// Pins terrain composition, the TREE_IN_WATER contract, the reciprocal south
// openings, blocked outer/east edges, encounter geography, empty content,
// persistence, and the intentionally small West Mire / Upper Reach deltas.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'NORTH_BASIN_NW2_MAP';
const EAST_ID = 'NORTH_BASIN_NW_MAP';
const SOUTH_ID = 'NORTH_BASIN_W2_MAP';
const FP = '6bbc842c7e7efdd14cf9f6c23f27312bace33049745672eba636ff1d61b4578a';
const EAST_FP = 'cb2c59ab15d4b87c2ce758025b2f6bfd85fe8abae5c34cc1438131c8605edfe8';
const OLD_EAST_FP = '0105619e109e8dcc3c941724437dd7fd0b6b2208e3507d498046841f6b53d28d';
const SOUTH_FP = '301000cbf265d3f1bc1efdaf1a0996733be0d0a4d04318518bccf34cb038ed6b';
const OLD_SOUTH_FP = 'c2812528c12a2fcf7f45819f4320ee85f9b78446e4b3f9826fbb968448a72c31';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

module.exports = {
  name: 'North Basin Flooded Rim: flooded woodland, drowned trees, reciprocal south seams',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (expr) => JSON.parse(g.run(expr));
    const TILE = g.run('TILE'), ROWS = g.run('ROWS'), COLS = g.run('COLS'), SPEED = g.run('SPEED');
    const WATER = g.run('WATER'), TREE = g.run('TREE'), TREE_WATER = g.run('TREE_IN_WATER');
    const REEDS = g.run('REEDS'), MUD = g.run('BASIN_MUD'), STONE = g.run('EXPOSED_STONE');
    const HILLS = g.run('HILLS'), PATH_TILE = g.run('PATH');
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const east = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${EAST_ID}'].map)`);
    const south = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${SOUTH_ID}'].map)`);
    const mapId = () => g.run('mapIdForRef(activeMap)');
    const worldPos = () => J('JSON.stringify(regionalWorldPosition())');
    const camera = () => J("JSON.stringify((function(){var p=regionalWorldPosition();var c=buildContinuousWorldPlanFromWorld(p.regionId,p.worldPxX,p.worldPxY,512,480);return {x:c.camPxX,y:c.camPxY};})())");
    const clearKeys = () => g.run('for(var k in keys)delete keys[k];');
    const placeEdge = (from, dir, col) => {
      const y = dir === 'south' ? (ROWS - 0.3) * TILE : 0.3 * TILE;
      assert.equal(g.run(`placeAtLocation('${from}',${col + 0.5}*TILE,${y})`), true);
      g.run('debugMode=true;forceLegacyRegionalView=false;combat.active=false;combat.cooldown=0;__reconcileCanonicalForTest();');
    };
    const drive = (key, frames, stopMap) => {
      clearKeys(); g.hold(key);
      let prev = worldPos(), prevCam = camera(), prevMap = mapId();
      const out = { handoffs: 0, maxWorldDelta: 0, maxCameraDelta: 0, zero: 0, first: null };
      for (let i = 0; i < frames; i++) {
        g.frames(1);
        const cur = worldPos(), cam = camera(), mid = mapId();
        const worldDelta = Math.hypot(cur.worldPxX - prev.worldPxX, cur.worldPxY - prev.worldPxY);
        out.maxWorldDelta = Math.max(out.maxWorldDelta, worldDelta);
        out.maxCameraDelta = Math.max(out.maxCameraDelta, Math.hypot(cam.x - prevCam.x, cam.y - prevCam.y));
        if (worldDelta < 1e-9) out.zero++;
        if (mid !== prevMap) { out.handoffs++; out.first = { mapId: mid, world: cur, x: g.run('player.x'), y: g.run('player.y') }; }
        prev = cur; prevCam = cam; prevMap = mid;
        if (stopMap && mid === stopMap) break;
      }
      g.release(key); clearKeys();
      return out;
    };

    // 1. Stable catalog identity: an ordinary accessible, saveable wilderness
    // chunk using the established gentle basin pool and no item-set authority.
    assert.deepEqual(J(`JSON.stringify(regionPlacementForMapId('${ID}'))`),
      { mapId: ID, regionId: 'overworld', chunkX: 0, chunkY: 0 });
    const meta = J(`JSON.stringify((function(){var d=NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.find(function(x){return x.mapId==='${ID}';});var r=REGIONAL_CHUNK_CATALOG['${ID}'];return {name:r.displayName,region:r.region,key:r.contentKey,presentation:r.presentation,profile:d.encounterProfileId,itemSet:Object.prototype.hasOwnProperty.call(d,'itemSetId'),authoredAccessible:d.playerAccessible,accessible:r.playerAccessible,encounters:r.allowRandomEncounters,save:r.allowSave,pool:r.encounterPool===NORTH_BASIN_ENEMY_TEMPLATES};})())`);
    assert.deepEqual(meta, { name: 'North Basin — Flooded Rim', region: 'North Basin', key: 'north_basin_nw2', presentation: 'continuous', profile: 'north_basin', itemSet: false, authoredAccessible: true, accessible: true, encounters: true, save: true, pool: true });
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].encounterPool===REGIONAL_CHUNK_CATALOG['${SOUTH_ID}'].encounterPool`), true, 'same pool as West Mire');
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].encounterPool.every(function(e){return NORTH_BASIN_ENEMY_TEMPLATES.includes(e);})`), true, 'no new enemies or weighting');

    // 2. Exact restrained terrain palette and requested proportions.
    assert.equal(m.length, 15); assert.ok(m.every((row) => row.length === 16));
    const allowed = new Set([WATER, TREE, TREE_WATER, REEDS, MUD, STONE]);
    assert.ok(m.flat().every((tile) => allowed.has(tile)), 'only water, drowned/ordinary trees, mud, reeds, and exposed stone');
    assert.equal(m.flat().includes(HILLS), false, 'no hills');
    assert.equal(m.flat().includes(PATH_TILE), false, 'no path or road');
    const counts = { water: 0, treeInWater: 0, tree: 0, reeds: 0, mud: 0, stone: 0 };
    const keys = new Map([[WATER,'water'],[TREE_WATER,'treeInWater'],[TREE,'tree'],[REEDS,'reeds'],[MUD,'mud'],[STONE,'stone']]);
    for (const tile of m.flat()) counts[keys.get(tile)]++;
    assert.deepEqual(counts, { water: 119, treeInWater: 6, tree: 18, reeds: 42, mud: 52, stone: 3 });
    assert.ok(counts.water / 240 >= 0.45 && counts.water / 240 <= 0.55, 'WATER alone covers 49.6% of the map');
    assert.equal(counts.reeds + counts.mud, 94, 'most remaining walkable terrain is mud or reeds');

    // 3. The new tile is a real rendered, impassable water/tree terrain type.
    assert.equal(TREE_WATER, 120, 'new stable tile id follows HILLS without renumbering');
    assert.equal(g.run('WALKABLE[TREE_IN_WATER]'), false);
    assert.equal(g.run('isTileWalkable(TREE_IN_WATER)'), false);
    assert.equal(g.run('isTileEncounterEligible(TREE_IN_WATER)'), false);
    assert.equal(g.run('isTransitionTile(TREE_IN_WATER)'), false);
    assert.equal(g.run('isWaterTile(TREE_IN_WATER)'), true);
    assert.equal(g.run("tileHasTag(TREE_IN_WATER,'tree')&&tileHasTag(TREE_IN_WATER,'blocker')"), true);
    assert.equal(g.run('RENDERABLE_TILE_IDS.has(TREE_IN_WATER)'), true);
    assert.equal(g.run('typeof drawTreeInWater'), 'function');
    assert.equal(g.run('debugTileName(TREE_IN_WATER)'), 'TREE_IN_WATER');
    assert.equal(g.run(`(function(){var calls=0,_r=Math.random;Math.random=function(){calls++;return 0;};drawTile(TREE_IN_WATER,0,0);Math.random=_r;return calls;})()`), 0, 'normal tile dispatch renders deterministically without runtime randomness');

    // 4. True north/west regional borders contain only blocked water/tree forms.
    const borderAllowed = new Set([WATER, TREE, TREE_WATER]);
    assert.ok(m[0].every((tile) => borderAllowed.has(tile)), 'north rim uses only water/tree/tree-in-water');
    assert.ok(m.every((row) => borderAllowed.has(row[0])), 'west rim uses only water/tree/tree-in-water');
    assert.ok(m[0].every((tile) => !g.run(`isTileWalkable(${tile})`)));
    assert.ok(m.every((row) => !g.run(`isTileWalkable(${row[0]})`)));

    // 5. East remains blocked against unchanged Upper Reach. South uses two
    // reciprocal structural-only marsh openings with identical ranges.
    assert.deepEqual(m.map((row) => row[15]), [WATER,WATER,WATER,WATER,TREE,WATER,TREE_WATER,WATER,TREE,WATER,TREE_WATER,WATER,WATER,WATER,WATER]);
    assert.ok(m.every((row) => !g.run(`isTileWalkable(${row[15]})`)), 'no walkable tile touches the east border');
    assert.deepEqual(east.map((row) => row[0]), [WATER,WATER,WATER,TREE_WATER,TREE,TREE,MUD,WATER,TREE_WATER,TREE,TREE,MUD,TREE,TREE,TREE], 'Upper Reach west edge replaces exactly half of its former trees with clustered flooded/mud remnants');
    assert.deepEqual(m[14].slice(3, 7), [REEDS,MUD,MUD,REEDS]);
    assert.deepEqual(m[14].slice(9, 13), [REEDS,MUD,MUD,REEDS]);
    assert.deepEqual(south[0].slice(3, 7), [REEDS,MUD,MUD,REEDS]);
    assert.deepEqual(south[0].slice(9, 13), [REEDS,MUD,MUD,REEDS]);
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${ID}'])`), {
      south: [
        { targetMap: SOUTH_ID, targetEdge: 'north', sourceRange: [3, 6] },
        { targetMap: SOUTH_ID, targetEdge: 'north', sourceRange: [9, 12] },
      ],
    });
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].east`), 'undefined');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${EAST_ID}'].west`), 'undefined');
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${SOUTH_ID}'].north)`), [
      { targetMap: ID, targetEdge: 'south', sourceRange: [3, 6] },
      { targetMap: ID, targetEdge: 'south', sourceRange: [9, 12] },
    ]);
    for (const col of [3,6,9,12]) {
      assert.equal(g.run(`eligibleContinuousSeam('${ID}','south',${col}).to`), SOUTH_ID);
      assert.equal(g.run(`eligibleContinuousSeam('${SOUTH_ID}','north',${col}).to`), ID);
    }

    // 6. Every walkable cell belongs to one component, so neither entrance
    // strands the player and both entrances are mutually reachable.
    const walkable = (tile) => g.run(`isTileWalkable(${tile})`);
    const all = new Set();
    for (let y = 0; y < 15; y++) for (let x = 0; x < 16; x++) if (walkable(m[y][x])) all.add(`${x},${y}`);
    const queue = [[3,14]], seen = new Set();
    while (queue.length) {
      const [x,y] = queue.shift(), key = `${x},${y}`;
      if (seen.has(key) || !all.has(key)) continue;
      seen.add(key);
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) queue.push([x+dx,y+dy]);
    }
    assert.equal(all.size, 97); assert.equal(seen.size, 97, 'all walkable cells are one component');
    assert.ok(seen.has('3,14') && seen.has('12,14'), 'both south ranges join the same component');
    assert.ok(south.every((row) => row[0] === TREE || row[0] === WATER), 'West Mire west boundary uses blocked TREE/WATER only');
    assert.ok(south.every((row) => !walkable(row[0])), 'West Mire west boundary remains fully nonwalkable');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${SOUTH_ID}'].west`), 'undefined', 'no westward exit into negative coordinates');

    // 7. Production seamless movement crosses both ranges in both directions
    // with exact canonical ownership and no inset/camera jump or double move.
    for (const col of [3,6,9,12]) {
      placeEdge(ID, 'south', col);
      let rec = drive('ArrowDown', 24, SOUTH_ID);
      assert.equal(mapId(), SOUTH_ID); assert.equal(rec.handoffs, 1);
      assert.ok(rec.first && Math.floor(rec.first.world.worldPxY / (ROWS * TILE)) === 1, 'standing point owns West Mire at handoff');
      assert.notEqual(rec.first.y, 1.5 * TILE, 'continuous handoff has no legacy inset');
      assert.ok(rec.maxWorldDelta <= SPEED + 1e-9 && rec.maxCameraDelta <= SPEED + 1e-9);
      assert.equal(rec.zero, 0, 'no zero/double movement frame');

      placeEdge(SOUTH_ID, 'north', col);
      rec = drive('ArrowUp', 24, ID);
      assert.equal(mapId(), ID); assert.equal(rec.handoffs, 1);
      assert.ok(rec.first && Math.floor(rec.first.world.worldPxY / (ROWS * TILE)) === 0, 'standing point owns Flooded Rim at reverse handoff');
      assert.notEqual(rec.first.y, (ROWS - 1.5) * TILE, 'reverse continuous handoff has no legacy inset');
      assert.ok(rec.maxWorldDelta <= SPEED + 1e-9 && rec.maxCameraDelta <= SPEED + 1e-9);
    }

    // Fractional along-edge position, facing and animation phase survive the
    // handoff. Endpoint-parallel movement and diagonal wall sliding stay normal.
    placeEdge(ID, 'south', 4);
    g.run("player.facing='down';player.step=0.375;player.x+=0.25;__reconcileCanonicalForTest();");
    const fraction = g.run('player.x%1'); const sustained = drive('ArrowDown', 24, SOUTH_ID);
    assert.equal(sustained.handoffs, 1); assert.equal(g.run('player.facing'), 'down');
    assert.equal(g.run('player.step%1'), 0.375); assert.equal(g.run('player.x%1'), fraction);
    for (const [col, parallel] of [[3,'ArrowRight'],[6,'ArrowLeft'],[9,'ArrowRight'],[12,'ArrowLeft']]) {
      placeEdge(ID, 'south', col); const beforeX = worldPos().worldPxX; drive(parallel, 2); assert.notEqual(worldPos().worldPxX, beforeX);
      placeEdge(ID, 'south', col); clearKeys(); g.hold('ArrowDown'); g.hold(parallel);
      let prev = worldPos(), prevMap = mapId(), handoffs = 0, maxDelta = 0;
      for (let i = 0; i < 18; i++) {
        g.frames(1); const cur = worldPos(), mid = mapId();
        maxDelta = Math.max(maxDelta, Math.hypot(cur.worldPxX-prev.worldPxX,cur.worldPxY-prev.worldPxY));
        if (mid !== prevMap) handoffs++; prev = cur; prevMap = mid;
      }
      g.release('ArrowDown'); g.release(parallel); clearKeys();
      assert.equal(mapId(), SOUTH_ID); assert.equal(handoffs, 1);
      assert.ok(maxDelta <= SPEED * Math.SQRT2 + 1e-9); assert.equal(g.run('regionalInvariantsHold()'), true);
    }

    // North, west and east are hard collision borders. No attempt can hand off
    // or move the canonical standing point into negative world coordinates.
    for (const [x,y,key] of [[14.5,1.5,'ArrowUp'],[2.5,11.5,'ArrowLeft'],[14.5,10.5,'ArrowRight']]) {
      assert.equal(g.run(`placeAtLocation('${ID}',${x}*TILE,${y}*TILE)`), true);
      const beforeMap = mapId(); drive(key, 100);
      assert.equal(mapId(), beforeMap); const p = worldPos();
      assert.ok(p.worldPxX >= 0 && p.worldPxY >= 0, 'blocked movement cannot enter negative world coordinates');
    }
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].north`), 'undefined');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].west`), 'undefined');

    // Legacy Regional Fallback crosses every authorized coordinate using the
    // established one-tile-inside inset and transition cooldown in both directions.
    for (const col of [3,4,5,6,9,10,11,12]) {
      g.run(`forceLegacyRegionalView=true;combat.cooldown=0;placeAtLocation('${ID}',${col+0.5}*TILE,(ROWS-0.5)*TILE);`);
      assert.equal(g.run("tryEdgeTransition('south')"), true); assert.equal(mapId(), SOUTH_ID);
      assert.equal(g.run('player.y'), 1.5*TILE); assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
      g.run(`combat.cooldown=0;placeAtLocation('${SOUTH_ID}',${col+0.5}*TILE,0.5*TILE);`);
      assert.equal(g.run("tryEdgeTransition('north')"), true); assert.equal(mapId(), ID);
      assert.equal(g.run('player.y'), (ROWS-1.5)*TILE); assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
    }

    // A seam handoff itself owns no encounter roll. Physical map ownership
    // changes even though both maps intentionally share the same pool reference.
    const handoff = J(`(function(){placeAtLocation('${ID}',10.5*TILE,14.7*TILE);forceLegacyRegionalView=false;debugMode=false;combat.active=false;var calls=0,starts=0,_r=Math.random,_s=startCombat;Math.random=function(){calls++;return 0;};startCombat=function(){starts++;};var before=mapIdForRef(activeMap),after=null;for(var i=0;i<20;i++){continuousSeamMove(0,2);after=mapIdForRef(activeMap);if(after!==before){continuousSeamMove(0,2);break;}}Math.random=_r;startCombat=_s;return JSON.stringify({before:before,after:after,calls:calls,starts:starts,combat:combat.active,pool:currentEncounterPool()===NORTH_BASIN_ENEMY_TEMPLATES});})()`);
    assert.deepEqual(handoff, { before: ID, after: SOUTH_ID, calls: 0, starts: 0, combat: false, pool: true });

    // 8. Geographic encounters belong to this physical chunk and use its
    // canonical pool; water/tree terrain stays safe.
    assert.equal(g.run(`placeAtLocation('${ID}',8.5*TILE,4.5*TILE)`), true);
    assert.equal(g.run('currentEncounterPool()===NORTH_BASIN_ENEMY_TEMPLATES'), true);
    assert.equal(g.run(`(function(){var p=regionalWorldPosition();var c=geographicEncounterContext(p.regionId,p.worldPxX,p.worldPxY);return c&&c.mapId==='${ID}'&&c.encounterPool===NORTH_BASIN_ENEMY_TEMPLATES;})()`), true);
    assert.equal(g.run('isEncounterEligibleTile(BASIN_MUD)&&isEncounterEligibleTile(REEDS)&&isEncounterEligibleTile(EXPOSED_STONE)'), true);
    assert.equal(g.run('isEncounterEligibleTile(WATER)||isEncounterEligibleTile(TREE_IN_WATER)'), false);
    const terrainRoll = (col, row, tileName) => J(`(function(){resetLocationState();forceLegacyRegionalView=true;debugMode=false;combat.active=false;combat.cooldown=0;placeAtLocation('${ID}',${col+0.5}*TILE,${row+0.5}*TILE);player.step=15;for(var k in keys)delete keys[k];keys.ArrowRight=true;var starts=0,calls=0,own=false,_s=startCombat,_r=Math.random;startCombat=function(){starts++;own=currentEncounterPool()===NORTH_BASIN_ENEMY_TEMPLATES;combat.active=true;};Math.random=function(){calls++;return 0;};var tile=activeMap[Math.floor(player.y/TILE)][Math.floor(player.x/TILE)];update();Math.random=_r;startCombat=_s;for(var k in keys)delete keys[k];return JSON.stringify({tile:tile===${tileName},starts:starts,calls:calls,own:own});})()`);
    for (const [col,row,tileName] of [[9,10,'BASIN_MUD'],[11,12,'REEDS'],[11,10,'EXPOSED_STONE']]) {
      assert.deepEqual(terrainRoll(col,row,tileName), { tile: true, starts: 1, calls: 1, own: true }, `${tileName} reaches the ordinary one-roll cadence and canonical North Basin pool`);
    }

    // 9. No authored content or bespoke runtime exception; ordinary v4 regional
    // placement, debug warp, save/load, and camera planning handle the chunk.
    assert.equal(g.run(`MAP_CATALOG['${ID}'].items.length`), 0);
    assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.map==='north_basin_nw2'||n.physicalMapId==='${ID}';})`), false);
    assert.equal(g.run("typeof MAP_FEATURES['north_basin_nw2']"), 'undefined');
    assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`), 'undefined');
    assert.equal(g.run(`typeof ${ID}`), 'undefined', 'new chunk has no bare compatibility alias');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined');
    assert.equal(g.run(`REGIONAL_POINT_CROSSINGS.some(function(c){return c.from==='${ID}'||c.to==='${ID}';})`), false, 'no point-transition machinery');
    assert.equal(g.run(`Object.values(EDGE_TRANSITIONS['${ID}']).flat().every(function(s){return Object.keys(s).sort().join(',')==='sourceRange,targetEdge,targetMap';})`), true, 'seams are structural-only');
    assert.equal(g.run(`typeof enterNorthBasinNW2==='undefined'&&typeof exitNorthBasinNW2==='undefined'`), true, 'no transition wrappers');
    const runtimeFiles = ['movement.js','continuous-seams.js','regional-position.js','save.js','debug-warp.js'];
    const runtime = runtimeFiles.map((file) => fs.readFileSync(path.join(__dirname,'..','..',file),'utf8')).join('\n');
    assert.doesNotMatch(runtime, /NORTH_BASIN_NW2_MAP/, 'no map-ID movement/save/warp branch');
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), true);
    assert.equal(g.run(`placeAtLocation('${ID}',8.5*TILE,4.5*TILE)`), true);
    g.run("player.facing='left';saveGame();"); const before = J('JSON.stringify(regionalWorldPosition())');
    assert.equal(J("localStorage.getItem('verdantVale_save')").version, 4);
    g.run("placeAtLocation('MAP2',2.5*TILE,2.5*TILE);player.facing='down';");
    assert.equal(g.run('loadGame()'), true); assert.equal(g.run('mapIdForRef(activeMap)'), ID);
    assert.deepEqual(J('JSON.stringify(regionalWorldPosition())'), before); assert.equal(g.run('player.facing'), 'left');
    assert.equal(g.run(`(function(){var w=mapLocalPxToRegionWorldPx('${ID}',8*TILE,7*TILE);var p=buildContinuousWorldPlanFromWorld('overworld',w.worldPxX,w.worldPxY,512,480);return p.visibleChunks.some(function(c){return c.mapId==='${ID}';});})()`), true);
    g.run(`placeAtLocation('${ID}',8.5*TILE,4.5*TILE);defeatWakeAtHome=true;combat.active=true;combat.phase='defeat';combat.enemy={name:'Test Dummy',hp:1,maxHp:1,atk:1,def:0,spd:1};stats.hp=0;handleCombatAction();`);
    assert.equal(g.run('currentMapId()'), 'house:player_house', 'ordinary defeat relocation leaves the regional component safely');
    g.run('dialogue.open=false;'); assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), true, 'ordinary debug return reaches the accessible component');

    // 10. Fingerprints pin the new grid and the authorized West Mire and Upper
    // Reach edge edits.
    assert.equal(sha256(JSON.stringify(m)), FP); assert.equal(GRID_FP.fingerprints[ID], FP);
    assert.equal(sha256(JSON.stringify(east)), EAST_FP); assert.equal(GRID_FP.fingerprints[EAST_ID], EAST_FP);
    const oldEast = east.map((row) => row.slice());
    for (const row of [1,2,3,6,7,8,11]) oldEast[row][0] = TREE;
    assert.equal(sha256(JSON.stringify(oldEast)), OLD_EAST_FP, 'Upper Reach delta is exactly seven former west-edge TREE cells');
    assert.equal(sha256(JSON.stringify(south)), SOUTH_FP); assert.equal(GRID_FP.fingerprints[SOUTH_ID], SOUTH_FP);
    const oldSouth = south.map((row) => row.slice());
    for (const col of [3,6,9,12]) oldSouth[0][col] = WATER;
    for (const col of [4,5,10,11]) oldSouth[0][col] = TREE;
    for (const row of [2,5,8,11,13]) oldSouth[row][0] = TREE;
    assert.equal(sha256(JSON.stringify(oldSouth)), OLD_SOUTH_FP, 'West Mire delta is exactly eight north-edge seam cells plus five blocked west-edge cells');
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 30);
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), fp, `${id}: fingerprint stable`);
    }

    // 11. Expected regional topology/count changes only; save schema unchanged.
    const audit = require('../transition-audit.js');
    const verdict = Object.fromEntries(audit.seamReadiness.edges.map((e) => [`${e.mapId}|${e.dir}`, e.verdict]));
    assert.equal(verdict[`${ID}|north`], 'BORDER'); assert.equal(verdict[`${ID}|west`], 'BORDER');
    assert.equal(verdict[`${ID}|east`], 'BLOCKED'); assert.equal(verdict[`${ID}|south`], 'ALIGNS');
    assert.equal(verdict[`${EAST_ID}|west`], 'BLOCKED'); assert.equal(verdict[`${SOUTH_ID}|north`], 'ALIGNS');
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 22, ALIGNS: 48, BLOCKED: 46 });
    assert.equal(audit.seamReadiness.edges.length, 120);
    assert.equal(g.run('continuousSeamEntries().length'), 68);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'), 30);
    assert.equal(g.run('Object.keys(MAP_CATALOG).length'), 118);
    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.equal(g.run('validateGameData().errors'), 0);
  },
};
