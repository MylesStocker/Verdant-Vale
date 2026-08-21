'use strict';
// EAST_CAUSEWAY_MAP — accessible terrain-only obstruction at overworld (4,2).
// Proves the broad fen entrance, one-tile road, ordinary terrain blockage,
// upper-reach encounters, persistence, and fingerprint isolation.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'EAST_CAUSEWAY_MAP';
const WEST_ID = 'NORTH_BASIN_SE_MAP';
const NORTH_ID = 'NORTH_BASIN_E2_MAP';
const SOUTH_ID = 'THORNMERE_CANAL_HEAD_MAP';
const FP = '4ce6d248fbf6fa13b02fccd81785d0a44923ac6c9a0f9c37b4e9d0df851e1f16';
const WEST_FP = '96ac86bdc402728eab845a9cd6250609787d4ed0994affe294fce8f3d578a2b3';
const OLD_WEST_FP = '04f4d719559a39ed231a147fd6e3604a48611c7628e3c5aa20e196e82077bcd7';
const NORTH_FP = '74353043788878bfd753cc5e3382a6e758e7e652ce3452e222a196d3279c96ff';
const SOUTH_FP = '924d982ac990944db3808a749533fd1ce2fd713ca3899ed1d77252ec14151cf0';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function context() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}

module.exports = {
  name: 'East Causeway: broad fen entrance, terrain-only subsidence, upper-reach encounters',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));
    const TILE = g.run('TILE'), ROWS = g.run('ROWS'), COLS = g.run('COLS'), SPEED = g.run('SPEED');
    const WATER = g.run('WATER'), REEDS = g.run('REEDS'), GRASS = g.run('GRASS');
    const PATH = g.run('PATH'), MUD = g.run('BASIN_MUD'), STONE = g.run('EXPOSED_STONE'), TREE = g.run('TREE');
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const west = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${WEST_ID}'].map)`);
    const north = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${NORTH_ID}'].map)`);
    const south = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${SOUTH_ID}'].map)`);
    const mapId = () => g.run('mapIdForRef(activeMap)');
    const worldPos = () => J('JSON.stringify(regionalWorldPosition())');
    const camera = () => J("JSON.stringify((function(){var p=regionalWorldPosition();var c=buildContinuousWorldPlanFromWorld(p.regionId,p.worldPxX,p.worldPxY,512,480);return {x:c.camPxX,y:c.camPxY};})())");
    const clearKeys = () => g.run('for(var k in keys)delete keys[k];');
    const placeEdge = (from, dir, along) => {
      let x = 8.5 * TILE, y = 7.5 * TILE;
      if (dir === 'east') x = (COLS - 0.3) * TILE;
      if (dir === 'west') x = 0.3 * TILE;
      y = (along + 0.5) * TILE;
      assert.equal(g.run(`placeAtLocation('${from}',${x},${y})`), true);
      g.run('debugMode=true;forceLegacyRegionalView=false;combat.active=false;combat.cooldown=0;__reconcileCanonicalForTest();');
    };
    const drive = (key, frames, stopMap) => {
      clearKeys(); g.hold(key);
      let prev = worldPos(), prevCam = camera(), prevMap = mapId();
      const out = { handoffs: 0, maxWorldDelta: 0, maxCameraDelta: 0, zero: 0, firstX: null };
      for (let i = 0; i < frames; i++) {
        g.frames(1);
        const cur = worldPos(), cam = camera(), mid = mapId();
        const wd = Math.hypot(cur.worldPxX - prev.worldPxX, cur.worldPxY - prev.worldPxY);
        out.maxWorldDelta = Math.max(out.maxWorldDelta, wd);
        out.maxCameraDelta = Math.max(out.maxCameraDelta, Math.hypot(cam.x - prevCam.x, cam.y - prevCam.y));
        if (wd < 1e-9) out.zero++;
        if (mid !== prevMap) { out.handoffs++; out.firstX = g.run('player.x'); }
        prev = cur; prevCam = cam; prevMap = mid;
        if (stopMap && mid === stopMap) break;
      }
      g.release(key); clearKeys();
      return out;
    };

    // 1–5. Derived catalog identity, exact grid, neighbour edges, and isolated
    // five-cell predecessor delta.
    assert.equal(g.run(`NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1);
    assert.deepEqual(J(`JSON.stringify(regionPlacementForMapId('${ID}'))`), { mapId: ID, regionId: 'overworld', chunkX: 4, chunkY: 2 });
    const meta = J(`JSON.stringify((function(){var d=NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.find(function(x){return x.mapId==='${ID}';});var r=REGIONAL_CHUNK_CATALOG['${ID}'];return {mapId:r.mapId,regionId:r.regionId,chunkX:r.chunkX,chunkY:r.chunkY,displayName:r.displayName,region:r.region,contentKey:r.contentKey,presentation:r.presentation,profile:d.encounterProfileId,itemSet:Object.prototype.hasOwnProperty.call(d,'itemSetId'),access:Object.prototype.hasOwnProperty.call(d,'playerAccessible'),accessible:r.playerAccessible,enc:r.allowRandomEncounters,save:r.allowSave,pool:r.encounterPool===UPPER_REACH_ENEMY_TEMPLATES};})())`);
    assert.deepEqual(meta, { mapId: ID, regionId: 'overworld', chunkX: 4, chunkY: 2, displayName: 'East Causeway', region: 'Eastern Reaches', contentKey: 'east_causeway', presentation: 'continuous', profile: 'upper_reach', itemSet: false, access: false, accessible: true, enc: true, save: true, pool: true });
    assert.equal(m.length, 15); assert.ok(m.every((row) => row.length === 16));
    const allowed = new Set([WATER, REEDS, GRASS, PATH, MUD, STONE, TREE]);
    assert.ok(m.flat().every((tile) => allowed.has(tile)), 'only approved existing outdoor terrain');
    const counts = { water: 0, reeds: 0, grass: 0, path: 0, mud: 0, stone: 0, tree: 0 };
    const countKeys = new Map([[WATER,'water'],[REEDS,'reeds'],[GRASS,'grass'],[PATH,'path'],[MUD,'mud'],[STONE,'stone'],[TREE,'tree']]);
    for (const tile of m.flat()) counts[countKeys.get(tile)]++;
    assert.deepEqual(counts, { water: 165, reeds: 35, grass: 23, path: 9, mud: 3, stone: 3, tree: 2 });
    assert.deepEqual(m[0], north[14], 'north exactly matches committed East Shore Reservoir south');
    assert.deepEqual(m[0], [TREE].concat(Array(15).fill(WATER)));
    assert.ok(m[1].every((tile) => tile === WATER), 'row 1 needed no reconciliation change');
    assert.deepEqual(m[14], south[0], 'south exactly matches committed Canal Head north');
    assert.deepEqual(m.map((row) => row[0]), [TREE,WATER,WATER,WATER,WATER,WATER,REEDS,REEDS,PATH,REEDS,REEDS,WATER,WATER,WATER,TREE]);
    assert.ok(m.every((row) => row[15] === WATER), 'east is entirely blocked WATER');
    assert.deepEqual(west.slice(6, 11).map((row) => row[15]), [REEDS,REEDS,PATH,REEDS,REEDS]);
    const oldWest = west.map((row) => row.slice()); for (const row of [6,7,8,9,10]) oldWest[row][15] = TREE;
    assert.equal(sha256(JSON.stringify(oldWest)), OLD_WEST_FP, 'only the approved five east-edge cells changed');
    assert.equal(sha256(JSON.stringify(west)), WEST_FP); assert.equal(sha256(JSON.stringify(north)), NORTH_FP); assert.equal(sha256(JSON.stringify(south)), SOUTH_FP);
    assert.equal(GRID_FP.fingerprints[NORTH_ID], NORTH_FP); assert.equal(GRID_FP.fingerprints[SOUTH_ID], SOUTH_FP);

    // 6–8. Reciprocal structural seam, production continuous handoff behavior,
    // endpoint diagonals, and Legacy Regional Fallback.
    const forward = J(`JSON.stringify(EDGE_TRANSITIONS['${WEST_ID}'].east)`);
    const reverse = J(`JSON.stringify(EDGE_TRANSITIONS['${ID}'].west)`);
    assert.deepEqual(forward, [{ targetMap: ID, targetEdge: 'west', sourceRange: [6, 10] }]);
    assert.deepEqual(reverse, [{ targetMap: WEST_ID, targetEdge: 'east', sourceRange: [6, 10] }]);
    for (const seg of forward.concat(reverse)) {
      assert.deepEqual(Object.keys(seg).sort(), ['sourceRange','targetEdge','targetMap']);
      assert.deepEqual(J(`JSON.stringify(classifyContinuousSegment(${JSON.stringify(seg)}))`), { ok: true, reason: null });
    }
    for (const row of [6,7,8,9,10]) {
      assert.equal(g.run(`eligibleContinuousSeam('${WEST_ID}','east',${row}).to`), ID);
      assert.equal(g.run(`eligibleContinuousSeam('${ID}','west',${row}).to`), WEST_ID);
      placeEdge(WEST_ID, 'east', row); let rec = drive('ArrowRight', 24, ID);
      assert.equal(mapId(), ID); assert.equal(rec.handoffs, 1); assert.ok(rec.maxWorldDelta <= SPEED + 1e-9); assert.ok(rec.maxCameraDelta <= SPEED + 1e-9);
      rec = drive('ArrowLeft', 24, WEST_ID); assert.equal(mapId(), WEST_ID); assert.equal(rec.handoffs, 1);
    }
    placeEdge(WEST_ID, 'east', 8); g.run("player.facing='right';player.step=0.375;player.y+=0.25;__reconcileCanonicalForTest();");
    const fraction = g.run('player.y%1'); const sustained = drive('ArrowRight', 24, ID);
    assert.equal(sustained.handoffs, 1); assert.equal(sustained.zero, 0); assert.notEqual(sustained.firstX, 1.5*TILE);
    assert.equal(g.run('player.facing'), 'right'); assert.equal(g.run('player.step%1'), 0.375); assert.equal(g.run('player.y%1'), fraction);
    for (const [row,parallel] of [[6,'ArrowDown'],[10,'ArrowUp']]) {
      placeEdge(WEST_ID, 'east', row); const beforeY = worldPos().worldPxY; drive(parallel, 2); assert.notEqual(worldPos().worldPxY, beforeY);
      placeEdge(WEST_ID, 'east', row); clearKeys(); g.hold('ArrowRight'); g.hold(parallel);
      let prev = worldPos(), prevMap = mapId(), handoffs = 0, maxDelta = 0;
      for (let i = 0; i < 18; i++) { g.frames(1); const cur = worldPos(), mid = mapId(); maxDelta = Math.max(maxDelta, Math.hypot(cur.worldPxX-prev.worldPxX,cur.worldPxY-prev.worldPxY)); if (mid !== prevMap) handoffs++; prev=cur; prevMap=mid; }
      g.release('ArrowRight'); g.release(parallel); clearKeys();
      assert.equal(mapId(), ID); assert.equal(handoffs, 1); assert.ok(maxDelta <= SPEED*Math.SQRT2+1e-9); assert.equal(g.run('regionalInvariantsHold()'), true);
    }
    for (const row of [6,8,10]) {
      placeEdge(WEST_ID,'east',row); g.run('forceLegacyRegionalView=true;combat.cooldown=0;');
      assert.equal(g.run("tryEdgeTransition('east')"), true); assert.equal(mapId(), ID); assert.equal(g.run('player.x'), 1.5*TILE); assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
      g.run(`combat.cooldown=0;placeAtLocation('${ID}',0.5*TILE,${row+0.5}*TILE);`);
      assert.equal(g.run("tryEdgeTransition('west')"), true); assert.equal(mapId(), WEST_ID); assert.equal(g.run('player.x'), (COLS-1.5)*TILE);
    }

    // 9–14. Encounter terrain, geographic ownership, no crossing roll, blocked
    // boundaries, one connected western component, and no bypass through water.
    g.run(`forceLegacyRegionalView=false;placeAtLocation('${ID}',3.5*TILE,7.5*TILE);resetLocationState();`);
    assert.equal(g.run('isTileWalkable(BASIN_MUD)&&isTileWalkable(EXPOSED_STONE)'), true);
    assert.equal(g.run('isEncounterEligibleTile(PATH)'), false); assert.equal(g.run('isEncounterEligibleTile(BASIN_MUD)'), true); assert.equal(g.run('isEncounterEligibleTile(EXPOSED_STONE)'), true);
    assert.equal(g.run('isEncounterEligibleTile(GRASS)'), true); assert.equal(g.run('isEncounterEligibleTile(REEDS)'), true);
    assert.equal(g.run('currentEncounterPool()===UPPER_REACH_ENEMY_TEMPLATES'), true);
    const handoff = J(`(function(){placeAtLocation('${WEST_ID}',15.7*TILE,8.5*TILE);forceLegacyRegionalView=false;debugMode=false;combat.active=false;var calls=0,_r=Math.random;Math.random=function(){calls++;return 0;};var before={map:mapIdForRef(activeMap),upper:currentEncounterPool()===UPPER_REACH_ENEMY_TEMPLATES};var first=null;for(var i=0;i<20;i++){var old=mapIdForRef(activeMap);continuousSeamMove(2,0);if(old!==mapIdForRef(activeMap)){first={map:mapIdForRef(activeMap),upper:currentEncounterPool()===UPPER_REACH_ENEMY_TEMPLATES};break;}}Math.random=_r;return JSON.stringify({before:before,first:first,calls:calls,combat:combat.active});})()`);
    assert.deepEqual(handoff, { before: { map: WEST_ID, upper: true }, first: { map: ID, upper: true }, calls: 0, combat: false });
    const seen = new Set(), components = [];
    for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++) {
      const key=`${x},${y}`; if (!g.run(`isTileWalkable(${m[y][x]})`) || seen.has(key)) continue;
      const queue=[[x,y]], cells=[]; seen.add(key);
      while(queue.length){const [cx,cy]=queue.shift();cells.push([cx,cy]);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy,nk=`${nx},${ny}`;if(nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&g.run(`isTileWalkable(${m[ny][nx]})`)&&!seen.has(nk)){seen.add(nk);queue.push([nx,ny]);}}}
      components.push(cells);
    }
    assert.equal(components.length, 1); assert.equal(components[0].length, 73); assert.equal(Math.max(...components[0].map(([x])=>x)), 10);
    assert.ok(m.every((row) => row.slice(11).every((tile) => tile === WATER)), 'columns 11–15 are a complete water interruption');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].north`), 'undefined'); assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].south`), 'undefined'); assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].east`), 'undefined');
    for (const [x,y,key] of [[3.5,3.5,'ArrowUp'],[3.5,11.5,'ArrowDown'],[10.5,8.5,'ArrowRight']]) {
      assert.equal(g.run(`placeAtLocation('${ID}',${x}*TILE,${y}*TILE)`), true); g.run('debugMode=true;forceLegacyRegionalView=false;'); drive(key,100); assert.equal(mapId(),ID);
    }
    g.run(`placeAtLocation('${ID}',8.5*TILE,8.5*TILE);debugMode=true;forceLegacyRegionalView=false;`); drive('ArrowRight',100); assert.equal(mapId(),ID); assert.ok(g.run('player.x') < 11*TILE, 'road stops before open water');

    // 15–17. Placement, warp, v4 persistence, empty content, fingerprints, and
    // terrain/seam-only reversibility with no bespoke runtime branch.
    assert.equal(g.run(`placeAtLocation('${ID}',6.5*TILE,8.5*TILE)`), true);
    assert.equal(g.run(`commitRegionalWorldPosition('overworld',4*COLS*TILE+6.5*TILE,2*ROWS*TILE+8.5*TILE)`), true);
    assert.equal(g.run(`transitionToLocation({mapId:'${ID}',x:6.5*TILE,y:8.5*TILE,facing:'right'})`), true);
    const warp = J(`JSON.stringify(debugWarpToDestination('outdoor:${ID}'))`); assert.deepEqual([warp.success,warp.col,warp.row],[true,8,7]);
    g.run(`placeAtLocation('${ID}',6.5*TILE,8.5*TILE);player.facing='right';saveGame();`); const saved=J("localStorage.getItem('verdantVale_save')"), before=worldPos();
    assert.equal(saved.version,4); assert.equal(saved.location.kind,'regional'); g.run("placeAtLocation('MAP2',2.5*TILE,2.5*TILE);player.facing='down';"); assert.equal(g.run('loadGame()'),true); assert.equal(mapId(),ID); assert.deepEqual(worldPos(),before); assert.equal(g.run('player.facing'),'right');
    assert.equal(g.run(`MAP_CATALOG['${ID}'].items.length`),0); assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.map==='east_causeway'||n.physicalMapId==='${ID}';})`),false);
    assert.equal(g.run(`typeof MAP_FEATURES['east_causeway']`),'undefined'); assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`),'undefined');
    assert.equal(g.run(`typeof ${ID}`),'undefined'); assert.equal(g.run(`typeof window['${ID}']`),'undefined'); assert.equal(g.run(`REGIONAL_POINT_CROSSINGS.some(function(c){return c.from==='${ID}'||c.to==='${ID}';})`),false);
    const runtimeFiles=['movement.js','continuous-seams.js','regional-position.js','save.js','debug-warp.js'];
    const runtime=runtimeFiles.map((file)=>fs.readFileSync(path.join(__dirname,'..','..',file),'utf8')).join('\n'); assert.doesNotMatch(runtime,/EAST_CAUSEWAY_MAP/,'no map-ID movement/save/warp exception');
    assert.equal(sha256(JSON.stringify(m)),FP); assert.equal(GRID_FP.fingerprints[ID],FP); assert.equal(GRID_FP.fingerprints[WEST_ID],WEST_FP); assert.equal(Object.keys(GRID_FP.fingerprints).length,30);
    for(const [id,fp] of Object.entries(GRID_FP.fingerprints)) assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)),fp,`${id}: fingerprint stable`);
    const audit=require('../transition-audit.js'); const verdict=Object.fromEntries(audit.seamReadiness.edges.map((e)=>[e.mapId+'|'+e.dir,e.verdict]));
    assert.equal(verdict[`${WEST_ID}|east`],'ALIGNS'); assert.equal(verdict[`${ID}|west`],'ALIGNS'); assert.equal(verdict[`${ID}|north`],'BLOCKED'); assert.equal(verdict[`${ID}|south`],'BLOCKED'); assert.equal(verdict[`${ID}|east`],'BORDER');
    assert.deepEqual(audit.seamReadiness.totals,{INTENTIONAL_DISCRETE:4,BORDER:22,ALIGNS:48,BLOCKED:46}); assert.equal(audit.seamReadiness.edges.length,120);
    assert.equal(g.run('continuousSeamEntries().length'),68); assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'),30); assert.equal(g.run('Object.keys(MAP_CATALOG).length'),117); assert.equal(g.run('SAVE_VERSION'),4);
  },
};
