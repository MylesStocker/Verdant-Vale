'use strict';
// THORNMERE_CANAL_HEAD_MAP — accessible lake outlet at overworld (4,3).
// Proves split shoreline crossings, disconnected banks, Thornmere encounter
// ownership, save/warp behavior, and the isolated Eastern Canal Banks edge edit.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'THORNMERE_CANAL_HEAD_MAP';
const WEST_ID = 'DRENWICK_EAST_CANAL_MAP';
const SOUTH_ID = 'THORNMERE_UPPER_SHALLOWS_MAP';
const FP = '924d982ac990944db3808a749533fd1ce2fd713ca3899ed1d77252ec14151cf0';
const WEST_FP = '2e74d8cd14fa6e022cba316f1d18d4409a2d5b886ed6c5e2df9392933f5ecad6';
const OLD_WEST_FP = '51ac08da0d044f8c5e6a9199f36c1a323604c2905f5ee546f18c4cc10f1ab40b';
const SOUTH_FP = 'fe6eaa3e73a470e8a1cf4a959d285dd26a34214f814373d0518cd4bc156fb7d5';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function context() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}

module.exports = {
  name: 'Thornmere Canal Head: split reed shelves, straight canal mouth, Thornmere encounters',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));
    const TILE = g.run('TILE'), ROWS = g.run('ROWS'), COLS = g.run('COLS'), SPEED = g.run('SPEED');
    const WATER = g.run('WATER'), REEDS = g.run('REEDS'), TREE = g.run('TREE');
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const west = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${WEST_ID}'].map)`);
    const south = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${SOUTH_ID}'].map)`);
    const mapId = () => g.run('mapIdForRef(activeMap)');
    const worldPos = () => J('JSON.stringify(regionalWorldPosition())');
    const camera = () => J("JSON.stringify((function(){var p=regionalWorldPosition();var c=buildContinuousWorldPlanFromWorld(p.regionId,p.worldPxX,p.worldPxY,512,480);return {x:c.camPxX,y:c.camPxY};})())");
    const clearKeys = () => g.run('for(var k in keys)delete keys[k];');
    const placeEdge = (from, dir, along) => {
      let x = 8.5 * TILE, y = 7.5 * TILE;
      if (dir === 'west') x = 0.3 * TILE;
      if (dir === 'east') x = (COLS - 0.3) * TILE;
      if (dir === 'north') y = 0.3 * TILE;
      if (dir === 'south') y = (ROWS - 0.3) * TILE;
      if (dir === 'west' || dir === 'east') y = (along + 0.5) * TILE;
      else x = (along + 0.5) * TILE;
      const ok = g.run(`placeAtLocation('${from}',${x},${y})`);
      assert.equal(ok, true, `${from} ${dir} row/col ${along} is a valid edge standing point`);
      g.run('debugMode=true;forceLegacyRegionalView=false;combat.active=false;combat.cooldown=0;__reconcileCanonicalForTest();');
    };
    const drive = (key, frames, stopMap) => {
      clearKeys(); g.hold(key);
      let prev = worldPos(), prevCam = camera(), prevMap = mapId();
      const out = { handoffs: 0, maxWorldDelta: 0, maxCameraDelta: 0, zero: 0, firstX: null, firstY: null };
      for (let i = 0; i < frames; i++) {
        g.frames(1);
        const cur = worldPos(), cam = camera(), mid = mapId();
        const wd = Math.hypot(cur.worldPxX - prev.worldPxX, cur.worldPxY - prev.worldPxY);
        out.maxWorldDelta = Math.max(out.maxWorldDelta, wd);
        out.maxCameraDelta = Math.max(out.maxCameraDelta, Math.hypot(cam.x - prevCam.x, cam.y - prevCam.y));
        if (wd < 1e-9) out.zero++;
        if (mid !== prevMap) { out.handoffs++; out.firstX = g.run('player.x'); out.firstY = g.run('player.y'); }
        prev = cur; prevCam = cam; prevMap = mid;
        if (stopMap && mid === stopMap) break;
      }
      g.release(key); clearKeys();
      return out;
    };

    // 1–3. Exact derived metadata, terrain contract, straight canal, and shared edge.
    assert.equal(g.run(`THORNMERE_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1);
    assert.deepEqual(J(`JSON.stringify(regionPlacementForMapId('${ID}'))`), { mapId: ID, regionId: 'overworld', chunkX: 4, chunkY: 3 });
    assert.equal(g.run("mapIdForChunk('overworld',3,3)"), WEST_ID);
    assert.equal(g.run("mapIdForChunk('overworld',4,4)"), SOUTH_ID);
    assert.equal(g.run("mapIdForChunk('overworld',4,2)"), 'EAST_CAUSEWAY_MAP');
    assert.equal(g.run("mapIdForChunk('overworld',5,3)"), null);
    const meta = J(`JSON.stringify((function(){var d=THORNMERE_REGIONAL_CHUNK_DEFINITIONS.find(function(x){return x.mapId==='${ID}';});var r=REGIONAL_CHUNK_CATALOG['${ID}'];return {mapId:r.mapId,regionId:r.regionId,chunkX:r.chunkX,chunkY:r.chunkY,displayName:r.displayName,region:r.region,contentKey:r.contentKey,presentation:r.presentation,profile:d.encounterProfileId,itemSet:Object.prototype.hasOwnProperty.call(d,'itemSetId'),access:Object.prototype.hasOwnProperty.call(d,'playerAccessible'),accessible:r.playerAccessible,enc:r.allowRandomEncounters,save:r.allowSave,pool:r.encounterPool===THORNMERE_ENEMY_TEMPLATES};})())`);
    assert.deepEqual(meta, { mapId: ID, regionId: 'overworld', chunkX: 4, chunkY: 3, displayName: 'Thornmere — Canal Head', region: 'Thornmere', contentKey: 'thornmere_canal_head', presentation: 'continuous', profile: 'thornmere', itemSet: false, access: false, accessible: true, enc: true, save: true, pool: true });
    assert.equal(m.length, 15); assert.ok(m.every((row) => row.length === 16));
    assert.ok(m.flat().every((tile) => [WATER, REEDS, TREE].includes(tile)));
    const counts = { water: 0, reeds: 0, tree: 0 };
    for (const tile of m.flat()) {
      if (tile === WATER) counts.water++;
      else if (tile === REEDS) counts.reeds++;
      else counts.tree++;
    }
    assert.deepEqual(counts, { water: 212, reeds: 20, tree: 8 });
    assert.ok(counts.water > 0.85 * 240, 'lake is the substantial majority');
    assert.ok(m[5].every((tile) => tile === WATER), 'row 5 is uninterrupted WATER×16');
    const shoreline = [TREE,WATER,REEDS,REEDS,REEDS,WATER,REEDS,REEDS,REEDS,WATER,TREE,WATER,TREE,WATER,TREE];
    assert.deepEqual(west.map((row) => row[15]), shoreline);
    assert.deepEqual(m.map((row) => row[0]), shoreline, 'both shared shoreline edges match exactly');
    assert.deepEqual(m[14], south[0], 'south edge exactly matches committed Upper Shallows north');
    assert.deepEqual(m[14], [TREE].concat(Array(15).fill(WATER)));
    assert.ok(m[0].slice(1).every((tile) => tile === WATER), 'north is overwhelmingly open WATER');
    assert.ok(m.every((row) => row[15] === WATER), 'east regional border is open WATER');

    // 4–5. Exactly two disconnected REEDS components, confined to columns 0–3.
    const seen = new Set(), components = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const key = `${x},${y}`;
      if (m[y][x] !== REEDS || seen.has(key)) continue;
      const queue = [[x, y]], cells = []; seen.add(key);
      while (queue.length) {
        const [cx, cy] = queue.shift(); cells.push([cx, cy]);
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = cx + dx, ny = cy + dy, nk = `${nx},${ny}`;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && m[ny][nx] === REEDS && !seen.has(nk)) { seen.add(nk); queue.push([nx, ny]); }
        }
      }
      components.push(cells);
    }
    components.sort((a,b) => Math.min(...a.map((p) => p[1])) - Math.min(...b.map((p) => p[1])));
    assert.equal(components.length, 2); assert.deepEqual(components.map((c) => c.length), [10, 10]);
    assert.ok(components[0].every(([x,y]) => x <= 3 && y <= 4));
    assert.ok(components[1].every(([x,y]) => x <= 3 && y >= 6));
    assert.equal(Math.max(...m.flatMap((row,y) => row.map((tile,x) => tile === REEDS ? x : -1))), 3);
    assert.ok(m[5].every((tile) => !g.run(`isTileWalkable(${tile})`)), 'canal is a complete nonwalkable separator');
    g.run(`placeAtLocation('${ID}',1.5*TILE,3.5*TILE);resetLocationState();`);
    assert.equal(g.run('isEncounterEligibleTile(REEDS)'), true, 'REEDS are encounter eligible in Canal Head geography');

    // 6–8. Exact structural segments and production continuous movement.
    const westEast = J(`JSON.stringify(EDGE_TRANSITIONS['${WEST_ID}'].east)`);
    const eastWest = J(`JSON.stringify(EDGE_TRANSITIONS['${ID}'].west)`);
    const expectedWestEast = [
      { targetMap: ID, targetEdge: 'west', sourceRange: [2, 4] },
      { targetMap: ID, targetEdge: 'west', sourceRange: [6, 8] },
    ];
    const expectedEastWest = [
      { targetMap: WEST_ID, targetEdge: 'east', sourceRange: [2, 4] },
      { targetMap: WEST_ID, targetEdge: 'east', sourceRange: [6, 8] },
    ];
    assert.deepEqual(westEast, expectedWestEast); assert.deepEqual(eastWest, expectedEastWest);
    for (const seg of westEast.concat(eastWest)) {
      assert.deepEqual(Object.keys(seg).sort(), ['sourceRange','targetEdge','targetMap']);
      assert.equal(J(`JSON.stringify(classifyContinuousSegment(${JSON.stringify(seg)}))`).ok, true);
    }
    assert.deepEqual(J(`JSON.stringify(eligibleContinuousSeam('${WEST_ID}','east').segments.map(function(s){return s.range;}))`), [[2,4],[6,8]]);
    assert.deepEqual(J(`JSON.stringify(eligibleContinuousSeam('${ID}','west').segments.map(function(s){return s.range;}))`), [[2,4],[6,8]]);
    for (const row of [3, 7]) {
      placeEdge(WEST_ID, 'east', row); g.run("player.facing='right';player.step=0.375;");
      const beforeFraction = g.run('player.y%1');
      let rec = drive('ArrowRight', 24, ID);
      assert.equal(mapId(), ID); assert.equal(rec.handoffs, 1); assert.equal(rec.zero, 0);
      assert.ok(rec.maxWorldDelta <= SPEED + 1e-9); assert.ok(rec.maxCameraDelta <= SPEED + 1e-9);
      assert.equal(g.run('player.facing'), 'right'); assert.equal(g.run('player.step%1'), 0.375, 'step phase advances without resetting at handoff');
      assert.equal(g.run('player.y%1'), beforeFraction, 'fractional orthogonal coordinate preserved');
      assert.notEqual(rec.firstX, 1.5 * TILE, 'continuous handoff does not use legacy inset');
      rec = drive('ArrowLeft', 24, WEST_ID);
      assert.equal(mapId(), WEST_ID); assert.equal(rec.handoffs, 1); assert.equal(g.run('regionalInvariantsHold()'), true);
    }
    for (const row of [2,4,6,8]) {
      const parallel = row === 2 || row === 6 ? 'ArrowDown' : 'ArrowUp';
      placeEdge(WEST_ID, 'east', row);
      const beforeY = worldPos().worldPxY; drive(parallel, 2); assert.notEqual(worldPos().worldPxY, beforeY);
      placeEdge(WEST_ID, 'east', row); clearKeys(); g.hold('ArrowRight'); g.hold(parallel);
      let prev = worldPos(), prevMap = mapId(), handoffs = 0, maxDelta = 0;
      for (let i = 0; i < 16; i++) {
        g.frames(1); const cur = worldPos(), mid = mapId();
        maxDelta = Math.max(maxDelta, Math.hypot(cur.worldPxX-prev.worldPxX, cur.worldPxY-prev.worldPxY));
        if (mid !== prevMap) handoffs++; prev = cur; prevMap = mid;
      }
      g.release('ArrowRight'); g.release(parallel); clearKeys();
      assert.equal(mapId(), ID, `endpoint ${row} crosses diagonally`); assert.equal(handoffs, 1);
      assert.ok(maxDelta <= SPEED * Math.SQRT2 + 1e-9, 'X-then-Y movement is never doubled');
    }
    for (const row of [0,1,5,9,10,11,12,13,14]) {
      assert.equal(g.run(`eligibleContinuousSeam('${WEST_ID}','east',${row})`), null, `west gap row ${row} blocked`);
      assert.equal(g.run(`eligibleContinuousSeam('${ID}','west',${row})`), null, `reciprocal gap row ${row} blocked`);
      assert.equal(g.run(`isTileWalkable(REGIONAL_CHUNK_CATALOG['${ID}'].map[${row}][0])`), false);
    }
    for (const [x,y,key] of [[2.5,2.5,'ArrowUp'],[2.5,8.5,'ArrowDown'],[3.5,3.5,'ArrowRight']]) {
      assert.equal(g.run(`placeAtLocation('${ID}',${x}*TILE,${y}*TILE)`), true);
      drive(key, 100); assert.equal(mapId(), ID, `${key} boundary blocks void/scenery/lake`);
      const after = worldPos();
      assert.equal(after.regionId, 'overworld');
      assert.ok(after.worldPxX >= 4*COLS*TILE && after.worldPxX < 5*COLS*TILE);
      assert.ok(after.worldPxY >= 3*ROWS*TILE && after.worldPxY < 4*ROWS*TILE);
    }
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].north`), 'undefined');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].south`), 'undefined');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].east`), 'undefined');

    // 9–10. Both maps retain two bank components; crossing changes FAR to
    // THORNMERE at the standing-point handoff and does not roll an encounter.
    assert.ok(west[5].every((tile) => tile === WATER)); assert.ok(m[5].every((tile) => tile === WATER));
    const handoff = J(`(function(){placeAtLocation('${WEST_ID}',15.7*TILE,3.5*TILE);forceLegacyRegionalView=false;debugMode=false;combat.active=false;var calls=0,_r=Math.random;Math.random=function(){calls++;return 0;};var before=currentEncounterPool()===FAR_ENEMY_TEMPLATES;var first=null;for(var i=0;i<20;i++){var old=mapIdForRef(activeMap);continuousSeamMove(2,0);if(old!==mapIdForRef(activeMap)){first={map:mapIdForRef(activeMap),thornmere:currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES};break;}}Math.random=_r;return JSON.stringify({before:before,first:first,calls:calls,combat:combat.active});})()`);
    assert.deepEqual(handoff, { before: true, first: { map: ID, thornmere: true }, calls: 0, combat: false });
    for (const [x,y] of [[1,3],[1,7]]) {
      g.run(`placeAtLocation('${ID}',${x+0.5}*TILE,${y+0.5}*TILE);resetLocationState();`);
      assert.equal(g.run('currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES'), true);
      assert.equal(g.run('isEncounterEligibleTile(activeMap[Math.floor(player.y/TILE)][Math.floor(player.x/TILE)])'), true);
    }

    // 11–13. Placement, canonical position, v4 persistence, warp, and legacy fallback.
    const beforeBlocked = worldPos();
    for (const [x,y,label] of [[5.5,5.5,'WATER'],[3.5,4.5,'TREE']]) {
      assert.equal(g.run(`validatePlacement({mapId:'${ID}',x:${x}*TILE,y:${y}*TILE,facing:'down'}).ok`), false, `${label} ordinary placement preflight rejected`);
      assert.equal(g.run(`transitionToLocation({mapId:'${ID}',x:${x}*TILE,y:${y}*TILE,facing:'down'})`), false, `${label} canonical gateway rejected`);
      assert.deepEqual(worldPos(), beforeBlocked, `${label} rejection leaves canonical position unchanged`);
    }
    for (const [x,y,label] of [[1.25,3.5,'north'],[1.25,7.5,'south']]) {
      assert.equal(g.run(`placeAtLocation('${ID}',${x}*TILE,${y}*TILE)`), true, `${label} REEDS placement accepted`);
      assert.equal(g.run(`commitRegionalWorldPosition('overworld',4*COLS*TILE+${x}*TILE,3*ROWS*TILE+${y}*TILE)`), true, `${label} canonical placement accepted`);
      g.run("player.facing='left';saveGame();"); const saved = J("localStorage.getItem('verdantVale_save')"); const pos = worldPos();
      assert.equal(saved.version, 4); assert.equal(saved.location.kind, 'regional');
      g.run("placeAtLocation('MAP2',2.5*TILE,2.5*TILE);player.facing='down';");
      assert.equal(g.run('loadGame()'), true); assert.equal(mapId(), ID); assert.deepEqual(worldPos(), pos); assert.equal(g.run('player.facing'), 'left');
    }
    let warp = J(`JSON.stringify(debugWarpToDestination('outdoor:${ID}'))`);
    assert.deepEqual([warp.success,warp.col,warp.row], [true,3,7], 'default center search deterministically chooses south shelf');
    warp = J(`JSON.stringify(debugWarpToDestination('outdoor:${ID}',1,3))`);
    assert.deepEqual([warp.success,warp.col,warp.row], [true,1,3], 'coordinate mode reaches north shelf');
    for (const row of [3,7]) {
      placeEdge(WEST_ID,'east',row); g.run('forceLegacyRegionalView=true;combat.cooldown=0;');
      assert.equal(g.run("tryEdgeTransition('east')"), true); assert.equal(mapId(), ID); assert.equal(g.run('player.x'), 1.5*TILE); assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
      g.run(`combat.cooldown=0;placeAtLocation('${ID}',0.5*TILE,${row+0.5}*TILE);`);
      assert.equal(g.run("tryEdgeTransition('west')"), true); assert.equal(mapId(), WEST_ID); assert.equal(g.run('player.x'), (COLS-1.5)*TILE);
    }
    assert.equal(g.run('SAVE_VERSION'), 4);

    // 14–16. No authored content/aliases; only the reviewed grid changes.
    assert.equal(g.run(`typeof ${ID}`), 'undefined'); assert.equal(g.run(`typeof window['${ID}']`), 'undefined');
    assert.equal(g.run(`REGIONAL_POINT_CROSSINGS.some(function(c){return c.from==='${ID}'||c.to==='${ID}';})`), false);
    assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.map==='thornmere_canal_head'||n.physicalMapId==='${ID}';})`), false);
    assert.equal(g.run(`typeof MAP_FEATURES['thornmere_canal_head']`), 'undefined');
    assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`), 'undefined');
    assert.equal(g.run(`MAP_CATALOG['${ID}'].items.length`), 0);
    assert.equal(sha256(JSON.stringify(m)), FP); assert.equal(GRID_FP.fingerprints[ID], FP);
    assert.equal(sha256(JSON.stringify(west)), WEST_FP); assert.equal(GRID_FP.fingerprints[WEST_ID], WEST_FP);
    assert.equal(sha256(JSON.stringify(south)), SOUTH_FP); assert.equal(GRID_FP.fingerprints[SOUTH_ID], SOUTH_FP, 'Upper Shallows byte-identical');
    const oldWest = west.map((row) => row.slice()); for (let row = 0; row < 15; row++) oldWest[row][15] = row === 5 ? WATER : TREE;
    assert.equal(sha256(JSON.stringify(oldWest)), OLD_WEST_FP, 'restoring exactly the authorized edge recreates reviewed Eastern Canal Banks');
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 30);
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), fp, `${id}: fingerprint stable`);

    const production = ['movement.js','continuous-seams.js','regional-position.js','save.js','debug-warp.js'].map((file) => fs.readFileSync(path.join(__dirname,'..','..',file),'utf8')).join('\n');
    assert.doesNotMatch(production, /THORNMERE_CANAL_HEAD_MAP/, 'no map-ID movement/save/warp special case');
    const audit = require('../transition-audit.js');
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 22, ALIGNS: 48, BLOCKED: 46 });
    assert.equal(audit.seamReadiness.edges.length, 120);
    assert.equal(g.run('continuousSeamEntries().length'), 68); assert.equal(g.run('continuousSeamEntries().length/2'), 34);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'), 30);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.filter(function(p){return mapPlayerAccessible(p.mapId);}).length'), 23);
    assert.equal(g.run('Object.keys(MAP_CATALOG).length'), 120);
  },
};
