'use strict';
// NORTH_BASIN_MIREWOOD_MAP — final regional chunk at overworld (0,2).
// Pins its flooded-bottom topology, sole east entrance, canonical movement,
// encounters, empty-content contract, and the minimal Silt Flats edge delta.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'NORTH_BASIN_MIREWOOD_MAP';
const EAST_ID = 'NORTH_BASIN_SW_MAP';
const NORTH_ID = 'NORTH_BASIN_W2_MAP';
const SOUTH_ID = 'MAP_N2';
const FP = '2e0a1187e2c33961a0b696db21f6c6e4938916c99e16d1d4d961ab08c2b55253';
const EAST_FP = 'e7e1f2217d674e6219c82764ce283be3fca272a7996a48a63a10aaa2b428d251';
const OLD_EAST_FP = '38e09a579a5e76b8539b02698235e01b2c5d664fa6fc9cfa11dd08804575d4c1';
const NORTH_FP = '301000cbf265d3f1bc1efdaf1a0996733be0d0a4d04318518bccf34cb038ed6b';
const SOUTH_FP = '39f4bcce6707c439384674c021ef18acf552221ef9e1c57f7435413aeaaeb963';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

module.exports = {
  name: 'North Basin Mirewood: final void, flooded bottom third, split east seams',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (expr) => JSON.parse(g.run(expr));
    const TILE = g.run('TILE'), ROWS = g.run('ROWS'), COLS = g.run('COLS'), SPEED = g.run('SPEED');
    const WATER = g.run('WATER'), TREE = g.run('TREE'), DROWNED = g.run('TREE_IN_WATER');
    const REEDS = g.run('REEDS'), MUD = g.run('BASIN_MUD'), STONE = g.run('EXPOSED_STONE');
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const east = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${EAST_ID}'].map)`);
    const north = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${NORTH_ID}'].map)`);
    const south = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${SOUTH_ID}'].map)`);
    const mapId = () => g.run('mapIdForRef(activeMap)');
    const worldPos = () => J('JSON.stringify(regionalWorldPosition())');
    const camera = () => J("JSON.stringify((function(){var p=regionalWorldPosition();var c=buildContinuousWorldPlanFromWorld(p.regionId,p.worldPxX,p.worldPxY,512,480);return {x:c.camPxX,y:c.camPxY};})())");
    const clearKeys = () => g.run('for(var k in keys)delete keys[k];');
    const placeEdge = (from, dir, row) => {
      const x = dir === 'east' ? (COLS - 0.3) * TILE : 0.3 * TILE;
      assert.equal(g.run(`placeAtLocation('${from}',${x},${row + 0.5}*TILE)`), true);
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

    // 1. Stable metadata and exact existing North Basin pool authority.
    assert.deepEqual(J(`JSON.stringify(regionPlacementForMapId('${ID}'))`),
      { mapId: ID, regionId: 'overworld', chunkX: 0, chunkY: 2 });
    const meta = J(`JSON.stringify((function(){var d=NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.find(function(x){return x.mapId==='${ID}';});var r=REGIONAL_CHUNK_CATALOG['${ID}'];return {name:r.displayName,region:r.region,key:r.contentKey,presentation:r.presentation,profile:d.encounterProfileId,itemSet:Object.prototype.hasOwnProperty.call(d,'itemSetId'),authoredAccessible:d.playerAccessible,accessible:r.playerAccessible,encounters:r.allowRandomEncounters,save:r.allowSave,pool:r.encounterPool===NORTH_BASIN_ENEMY_TEMPLATES};})())`);
    assert.deepEqual(meta, { name: 'North Basin — Mirewood', region: 'North Basin', key: 'north_basin_mirewood', presentation: 'continuous', profile: 'north_basin', itemSet: false, authoredAccessible: true, accessible: true, encounters: true, save: true, pool: true });
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].encounterPool===REGIONAL_CHUNK_CATALOG['${EAST_ID}'].encounterPool`), true, 'Mirewood and Silt Flats share the canonical North Basin pool');

    // 2. Exact 15x16 palette/counts; no path/hills or new terrain type.
    assert.equal(m.length, 15); assert.ok(m.every((row) => row.length === 16));
    const allowed = new Set([WATER,TREE,DROWNED,REEDS,MUD,STONE]);
    assert.ok(m.flat().every((tile) => allowed.has(tile)));
    assert.equal(m.flat().includes(g.run('HILLS')), false); assert.equal(m.flat().includes(g.run('PATH')), false);
    const counts = { water:0, tree:0, drowned:0, reeds:0, mud:0, stone:0 };
    const names = new Map([[WATER,'water'],[TREE,'tree'],[DROWNED,'drowned'],[REEDS,'reeds'],[MUD,'mud'],[STONE,'stone']]);
    for (const tile of m.flat()) counts[names.get(tile)]++;
    assert.deepEqual(counts, { water:98, tree:37, drowned:20, reeds:48, mud:36, stone:1 });
    assert.equal(counts.reeds + counts.mud + counts.stone, 85, '85 walkable terrain cells');
    assert.equal(counts.water + counts.tree + counts.drowned, 155, '155 nonwalkable flooded/tree cells');

    // 3. North/west/bottom-third contracts and exact edge sequences.
    const blocked = new Set([WATER,TREE,DROWNED]);
    assert.ok(m[0].every((tile) => blocked.has(tile)));
    assert.ok(m.map((row) => row[0]).every((tile) => blocked.has(tile)));
    assert.ok(m.slice(10).flat().every((tile) => blocked.has(tile)), 'rows 10-14 contain only water/tree/drowned-tree terrain');
    assert.ok(m.slice(10).flat().every((tile) => !g.run(`isTileWalkable(${tile})`)), 'bottom third has zero walkable cells');
    assert.deepEqual(m[0], [TREE,WATER,WATER,DROWNED,WATER,TREE,WATER,WATER,TREE,WATER,DROWNED,WATER,TREE,WATER,WATER,TREE]);
    assert.deepEqual(m.map((row) => row[0]), [TREE,WATER,DROWNED,TREE,WATER,TREE,WATER,DROWNED,TREE,WATER,TREE,WATER,DROWNED,WATER,TREE]);
    assert.deepEqual(m[14], [TREE,WATER,WATER,DROWNED,WATER,TREE,TREE,WATER,WATER,DROWNED,WATER,TREE,TREE,WATER,WATER,TREE]);
    assert.deepEqual(m.map((row) => row[15]), [TREE,REEDS,REEDS,MUD,STONE,TREE,REEDS,MUD,REEDS,MUD,DROWNED,WATER,DROWNED,WATER,TREE]);
    assert.equal(sha256(JSON.stringify(north)), NORTH_FP, 'West Mire remains byte-identical');
    assert.equal(sha256(JSON.stringify(south)), SOUTH_FP, 'Blocked Path remains byte-identical');

    // 4. One 85-cell four-directional component reaches every authorized east row.
    const walkable = (tile) => g.run(`isTileWalkable(${tile})`);
    const all = new Set();
    for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++) if (walkable(m[y][x])) all.add(`${x},${y}`);
    const queue=[[15,1]], seen=new Set();
    while (queue.length) {
      const [x,y]=queue.shift(), key=`${x},${y}`;
      if (seen.has(key) || !all.has(key)) continue;
      seen.add(key);
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) queue.push([x+dx,y+dy]);
    }
    assert.equal(all.size,85); assert.equal(seen.size,85);
    for (const row of [1,2,3,4,6,7,8,9]) assert.ok(seen.has(`15,${row}`), `east seam row ${row} reaches the sole component`);

    // 5. Exact reciprocal structural-only split seam; row 5 and bottom stay closed.
    const expectedEast = [
      { targetMap:EAST_ID,targetEdge:'west',sourceRange:[1,4] },
      { targetMap:EAST_ID,targetEdge:'west',sourceRange:[6,9] },
    ];
    const expectedWest = [
      { targetMap:ID,targetEdge:'east',sourceRange:[1,4] },
      { targetMap:ID,targetEdge:'east',sourceRange:[6,9] },
    ];
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${ID}'])`), {east:expectedEast});
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${EAST_ID}'].west)`), expectedWest);
    assert.equal(g.run(`Object.values(EDGE_TRANSITIONS['${ID}']).flat().concat(EDGE_TRANSITIONS['${EAST_ID}'].west).every(function(s){return Object.keys(s).sort().join(',')==='sourceRange,targetEdge,targetMap';})`), true);
    for (const row of [1,4,6,9]) {
      assert.equal(g.run(`eligibleContinuousSeam('${ID}','east',${row}).to`), EAST_ID);
      assert.equal(g.run(`eligibleContinuousSeam('${EAST_ID}','west',${row}).to`), ID);
    }
    for (const row of [0,5,10,14]) assert.equal(g.run(`eligibleContinuousSeam('${ID}','east',${row})`), null, `east row ${row} is not authorized`);
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].north`), 'undefined');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].south`), 'undefined');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].west`), 'undefined');

    // 6. Production Continuous View crosses every range endpoint both ways with
    // one exact standing-point handoff and no inset/double/camera jump.
    for (const row of [1,4,6,9]) {
      placeEdge(ID,'east',row); let rec=drive('ArrowRight',24,EAST_ID);
      assert.equal(mapId(),EAST_ID); assert.equal(rec.handoffs,1);
      assert.ok(rec.first && Math.floor(rec.first.world.worldPxX/(COLS*TILE))===1);
      assert.notEqual(rec.first.x,1.5*TILE); assert.ok(rec.maxWorldDelta<=SPEED+1e-9); assert.ok(rec.maxCameraDelta<=SPEED+1e-9); assert.equal(rec.zero,0);
      placeEdge(EAST_ID,'west',row); rec=drive('ArrowLeft',24,ID);
      assert.equal(mapId(),ID); assert.equal(rec.handoffs,1);
      assert.ok(rec.first && Math.floor(rec.first.world.worldPxX/(COLS*TILE))===0);
      assert.notEqual(rec.first.x,(COLS-1.5)*TILE); assert.ok(rec.maxWorldDelta<=SPEED+1e-9); assert.ok(rec.maxCameraDelta<=SPEED+1e-9);
    }

    // Fractional along-edge position, facing, step phase, reversal, parallel
    // movement and endpoint diagonals retain the generic seam behavior.
    placeEdge(ID,'east',2); g.run("player.facing='right';player.step=0.375;player.y+=0.25;__reconcileCanonicalForTest();");
    const fraction=g.run('player.y%1'); let rec=drive('ArrowRight',24,EAST_ID);
    assert.equal(rec.handoffs,1); assert.equal(g.run('player.facing'),'right'); assert.equal(g.run('player.step%1'),0.375); assert.equal(g.run('player.y%1'),fraction);
    placeEdge(ID,'east',3); drive('ArrowRight',2); drive('ArrowLeft',12);
    assert.equal(g.run('canWalk(player.x,player.y)&&regionalInvariantsHold()'),true,'reversal leaves a valid footprint');
    for (const [row,parallel] of [[1,'ArrowDown'],[4,'ArrowUp'],[6,'ArrowDown'],[9,'ArrowUp']]) {
      placeEdge(ID,'east',row); const beforeY=worldPos().worldPxY; drive(parallel,2); assert.notEqual(worldPos().worldPxY,beforeY);
      placeEdge(ID,'east',row); clearKeys(); g.hold('ArrowRight'); g.hold(parallel);
      let previous=mapId(),handoffs=0,maxDelta=0,p=worldPos();
      for(let i=0;i<18;i++){g.frames(1);const q=worldPos(),mid=mapId();maxDelta=Math.max(maxDelta,Math.hypot(q.worldPxX-p.worldPxX,q.worldPxY-p.worldPxY));if(mid!==previous)handoffs++;previous=mid;p=q;}
      g.release('ArrowRight');g.release(parallel);clearKeys();
      assert.equal(mapId(),EAST_ID);assert.equal(handoffs,1);assert.ok(maxDelta<=SPEED*Math.SQRT2+1e-9);assert.equal(g.run('regionalInvariantsHold()'),true);
    }

    // 7. Legacy Regional Fallback crosses all eight authorized rows with the
    // established horizontal inset and encounter cooldown in both directions.
    for (const row of [1,2,3,4,6,7,8,9]) {
      g.run(`forceLegacyRegionalView=true;combat.cooldown=0;placeAtLocation('${ID}',(COLS-0.5)*TILE,${row+0.5}*TILE);`);
      assert.equal(g.run("tryEdgeTransition('east')"),true);assert.equal(mapId(),EAST_ID);assert.equal(g.run('player.x'),1.5*TILE);assert.equal(g.run('combat.cooldown'),g.run('ENCOUNTER_COOLDOWN'));
      g.run(`combat.cooldown=0;placeAtLocation('${EAST_ID}',0.5*TILE,${row+0.5}*TILE);`);
      assert.equal(g.run("tryEdgeTransition('west')"),true);assert.equal(mapId(),ID);assert.equal(g.run('player.x'),(COLS-1.5)*TILE);assert.equal(g.run('combat.cooldown'),g.run('ENCOUNTER_COOLDOWN'));
    }

    // 8. North/west/south and the row-5 east gap remain hard collision; invalid
    // blocked points cannot become placement/save/transition landings.
    for (const [x,y,key] of [[8.5,1.5,'ArrowUp'],[1.5,8.5,'ArrowLeft'],[8.5,9.5,'ArrowDown'],[14.5,5.5,'ArrowRight']]) {
      assert.equal(g.run(`placeAtLocation('${ID}',${x}*TILE,${y}*TILE)`),true);
      const before=mapId(); drive(key,120); assert.equal(mapId(),before); assert.equal(g.run('regionalInvariantsHold()'),true);
    }
    for (const [x,y] of [[0.5,0.5],[0.5,8.5],[8.5,10.5],[15.5,5.5]]) {
      const before=J('JSON.stringify(regionalWorldPosition())');
      assert.equal(g.run(`validatePlacement({mapId:'${ID}',x:${x}*TILE,y:${y}*TILE,facing:'down'}).ok`),false,'blocked terrain rejects ordinary placement preflight');
      assert.equal(g.run(`transitionToLocation({mapId:'${ID}',x:${x}*TILE,y:${y}*TILE,facing:'down'})`),false,'blocked terrain rejects transition landing');
      assert.deepEqual(J('JSON.stringify(regionalWorldPosition())'),before,'rejected transition is atomic');
    }

    // 9. Seam frames roll nothing; ordinary mud/reed/stone movement uses one
    // roll and the physical Mirewood North Basin pool.
    const handoff=J(`(function(){placeAtLocation('${ID}',15.7*TILE,3.5*TILE);forceLegacyRegionalView=false;debugMode=false;combat.active=false;var calls=0,starts=0,_r=Math.random,_s=startCombat;Math.random=function(){calls++;return 0;};startCombat=function(){starts++;};var before=mapIdForRef(activeMap),after=null;for(var i=0;i<20;i++){continuousSeamMove(2,0);after=mapIdForRef(activeMap);if(after!==before){continuousSeamMove(2,0);break;}}Math.random=_r;startCombat=_s;return JSON.stringify({before:before,after:after,calls:calls,starts:starts,combat:combat.active,pool:currentEncounterPool()===NORTH_BASIN_ENEMY_TEMPLATES});})()`);
    assert.deepEqual(handoff,{before:ID,after:EAST_ID,calls:0,starts:0,combat:false,pool:true});
    const terrainRoll=(col,row,tileName,key) => J(`(function(){resetLocationState();forceLegacyRegionalView=true;debugMode=false;combat.active=false;combat.cooldown=0;placeAtLocation('${ID}',${col+0.5}*TILE,${row+0.5}*TILE);player.step=15;for(var k in keys)delete keys[k];keys.${key}=true;var starts=0,calls=0,own=false,_s=startCombat,_r=Math.random;startCombat=function(){starts++;own=currentEncounterPool()===NORTH_BASIN_ENEMY_TEMPLATES;combat.active=true;};Math.random=function(){calls++;return 0;};var tile=activeMap[Math.floor(player.y/TILE)][Math.floor(player.x/TILE)];update();Math.random=_r;startCombat=_s;for(var k in keys)delete keys[k];return JSON.stringify({tile:tile===${tileName},starts:starts,calls:calls,own:own,map:mapIdForRef(activeMap)});})()`);
    for (const args of [[8,3,'REEDS','ArrowRight'],[10,3,'BASIN_MUD','ArrowRight'],[15,4,'EXPOSED_STONE','ArrowLeft']]) {
      assert.deepEqual(terrainRoll(...args),{tile:true,starts:1,calls:1,own:true,map:ID});
    }
    assert.equal(g.run(`(function(){placeAtLocation('${ID}',8.5*TILE,3.5*TILE);var p=regionalWorldPosition(),c=geographicEncounterContext(p.regionId,p.worldPxX,p.worldPxY);return c.mapId==='${ID}'&&c.encounterPool===NORTH_BASIN_ENEMY_TEMPLATES;})()`),true,'physical encounter geography owns Mirewood before handoff');

    // 10. Ordinary placement, derived debug warp, v4 save/load and empty content.
    assert.equal(g.run(`placeAtLocation('${ID}',8.5*TILE,3.5*TILE)`),true);
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`),true);
    assert.equal(g.run(`mapIdForRef(activeMap)==='${ID}'&&player.y<10*TILE&&canWalk(player.x,player.y)`),true,'debug warp chooses the accessible upper component');
    g.run("player.facing='left';saveGame();");const saved=J('JSON.stringify(regionalWorldPosition())');assert.equal(J("localStorage.getItem('verdantVale_save')").version,4);
    g.run("placeAtLocation('MAP2',2.5*TILE,2.5*TILE);player.facing='down';");assert.equal(g.run('loadGame()'),true);assert.equal(mapId(),ID);assert.deepEqual(J('JSON.stringify(regionalWorldPosition())'),saved);assert.equal(g.run('player.facing'),'left');
    const validSave=g.run("localStorage.getItem('verdantVale_save')");
    const invalidLoad=J(`(function(){var s=JSON.parse(localStorage.getItem('verdantVale_save'));s.location.worldPxX=8.5*TILE;s.location.worldPxY=2*ROWS*TILE+10.5*TILE;localStorage.setItem('verdantVale_save',JSON.stringify(s));var before=regionalWorldPosition(),ok=loadGame(),after=regionalWorldPosition();localStorage.setItem('verdantVale_save',${JSON.stringify(validSave)});return JSON.stringify({ok:ok,same:before.regionId===after.regionId&&before.worldPxX===after.worldPxX&&before.worldPxY===after.worldPxY});})()`);
    assert.deepEqual(invalidLoad,{ok:false,same:true},'a hand-edited save on the blocked bottom third is rejected atomically');
    assert.equal(g.run(`MAP_CATALOG['${ID}'].items.length`),0);
    assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.map==='north_basin_mirewood'||n.physicalMapId==='${ID}';})`),false);
    assert.equal(g.run("typeof MAP_FEATURES['north_basin_mirewood']"),'undefined');
    assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`),'undefined');
    assert.equal(g.run(`typeof ${ID}`),'undefined');assert.equal(g.run(`typeof window['${ID}']`),'undefined');
    assert.equal(g.run(`REGIONAL_POINT_CROSSINGS.some(function(c){return c.from==='${ID}'||c.to==='${ID}';})`),false);
    assert.equal(g.run(`typeof enterNorthBasinMirewood==='undefined'&&typeof exitNorthBasinMirewood==='undefined'`),true);
    const runtime=['movement.js','continuous-seams.js','regional-position.js','save.js','debug-warp.js','encounter-geography.js'].map((file)=>fs.readFileSync(path.join(__dirname,'..','..',file),'utf8')).join('\n');
    assert.doesNotMatch(runtime,/NORTH_BASIN_MIREWOOD_MAP/,'no map-id runtime special case');

    // 11. Only Mirewood and the eight authorized Silt Flats west-edge cells
    // change fingerprints; all other established grids remain exact.
    assert.equal(sha256(JSON.stringify(m)),FP);assert.equal(GRID_FP.fingerprints[ID],FP);
    assert.equal(sha256(JSON.stringify(east)),EAST_FP);assert.equal(GRID_FP.fingerprints[EAST_ID],EAST_FP);
    const oldEast=east.map((row)=>row.slice());for(const row of [1,2,3,4,6,7,8,9])oldEast[row][0]=TREE;
    assert.equal(sha256(JSON.stringify(oldEast)),OLD_EAST_FP,'Silt Flats delta is exactly eight west-edge TREE cells');
    assert.equal(Object.keys(GRID_FP.fingerprints).length,30);
    for(const [id,fp] of Object.entries(GRID_FP.fingerprints))assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)),fp,`${id}: fingerprint stable`);

    // 12. Final-region and audit totals; save schema remains v4.
    const audit=require('../transition-audit.js');
    const verdict=Object.fromEntries(audit.seamReadiness.edges.map((e)=>[`${e.mapId}|${e.dir}`,e.verdict]));
    assert.equal(verdict[`${ID}|north`],'BLOCKED');assert.equal(verdict[`${NORTH_ID}|south`],'BLOCKED');
    assert.equal(verdict[`${ID}|east`],'ALIGNS');assert.equal(verdict[`${EAST_ID}|west`],'ALIGNS');
    assert.equal(verdict[`${ID}|south`],'BLOCKED');assert.equal(verdict[`${SOUTH_ID}|north`],'BLOCKED');assert.equal(verdict[`${ID}|west`],'BORDER');
    assert.deepEqual(audit.seamReadiness.totals,{INTENTIONAL_DISCRETE:4,BORDER:22,ALIGNS:48,BLOCKED:46});
    assert.equal(audit.seamReadiness.edges.length,120);assert.equal(g.run('continuousSeamEntries().length'),68);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'),30);assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.filter(function(p){return mapPlayerAccessible(p.mapId);}).length'),23);
    assert.equal(g.run('Object.keys(MAP_CATALOG).length'),125);assert.equal(g.run('SAVE_VERSION'),4);assert.equal(g.run('validateGameData().errors'),0);
  },
};
