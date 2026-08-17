'use strict';
// DRENWICK_EAST_CANAL_MAP — accessible Eastern Canal Banks at overworld (3,3).
// Proves the two-bank topology, split multi-segment west seam, broad north seam,
// far encounter geography, canonical/debug/save behavior, and reviewed grid deltas.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'DRENWICK_EAST_CANAL_MAP';
const WEST_ID = 'MAP3_N2';
const NORTH_ID = 'NORTH_BASIN_SE_MAP';
const FP = 'eab38f6b548bbd1201900dd65914f742f3b100c5db6a56e9f13d82466e3ebc14';
const WEST_FP = '9f3d4030bacb74e8e68845d9831ce93debb50a802302394246153aeec79a4f0c';
const NORTH_FP = '89e3d5c7eea04d8421e229f7dcf934389bab9fde97a3778bb112066a74e48c00';
const OLD_WEST_FP = 'e295dd572e02dc442f410fe4fe0d3aff1ac790bd4a40302527fb6c208130b315';
const OLD_NORTH_FP = 'c9a5c71ad15b9e2c6a9caf33a32660a7423cb044e7cb5cbac867b26248b1169b';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function ctx() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Canal Banks: two disconnected far-encounter banks and split seamless west edge',
  run() {
    const g = ctx();
    const J = (expr) => JSON.parse(g.run(expr));
    const TILE = g.run('TILE'), ROWS = g.run('ROWS'), COLS = g.run('COLS'), SPEED = g.run('SPEED');
    const CW = COLS * TILE, CH = ROWS * TILE;
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const west = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${WEST_ID}'].map)`);
    const north = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${NORTH_ID}'].map)`);
    const GRASS = g.run('GRASS'), WATER = g.run('WATER'), TREE = g.run('TREE'), REEDS = g.run('REEDS');
    const mapId = () => g.run('mapIdForRef(activeMap)');
    const worldPos = () => J('JSON.stringify(regionalWorldPosition())');
    const camera = () => J("JSON.stringify((function(){var p=regionalWorldPosition();var c=buildContinuousWorldPlanFromWorld(p.regionId,p.worldPxX,p.worldPxY,512,480);return {x:c.camPxX,y:c.camPxY};})())");
    const clearKeys = () => g.run('for(var k in keys)delete keys[k];');
    const drive = (key, frames, stopMap) => {
      clearKeys(); g.hold(key);
      let prev = worldPos(), prevCam = camera(), prevMap = mapId();
      const out = { handoffs: 0, maxWorldDelta: 0, maxCameraDelta: 0, zero: 0, firstLocalX: null, firstLocalY: null };
      for (let i = 0; i < frames; i++) {
        g.frames(1);
        const cur = worldPos(), cam = camera(), mid = mapId();
        const wd = Math.hypot(cur.worldPxX - prev.worldPxX, cur.worldPxY - prev.worldPxY);
        const cd = Math.hypot(cam.x - prevCam.x, cam.y - prevCam.y);
        out.maxWorldDelta = Math.max(out.maxWorldDelta, wd);
        out.maxCameraDelta = Math.max(out.maxCameraDelta, cd);
        if (wd < 1e-9) out.zero++;
        if (mid !== prevMap) {
          out.handoffs++;
          out.firstLocalX = g.run('player.x'); out.firstLocalY = g.run('player.y');
        }
        prev = cur; prevCam = cam; prevMap = mid;
        if (stopMap && mid === stopMap) break;
      }
      g.release(key); clearKeys();
      return out;
    };
    const placeEdge = (from, dir, along) => {
      let x = 8.5 * TILE, y = 7.5 * TILE;
      if (dir === 'north') { x = (along + 0.5) * TILE; y = 0.3 * TILE; }
      if (dir === 'south') { x = (along + 0.5) * TILE; y = (ROWS - 0.3) * TILE; }
      if (dir === 'west')  { x = 0.3 * TILE; y = (along + 0.5) * TILE; }
      if (dir === 'east')  { x = (COLS - 0.3) * TILE; y = (along + 0.5) * TILE; }
      g.run(`debugMode=true;forceLegacyRegionalView=false;combat.active=false;placeAtLocation('${from}',${x},${y});__reconcileCanonicalForTest();`);
    };

    // 1. Exact authored definition, metadata, dimensions, terrain allowlist, and
    // deliberately empty content ownership.
    assert.equal(g.run(`DRENWICK_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1);
    assert.deepEqual(J(`JSON.stringify(regionPlacementForMapId('${ID}'))`), { mapId: ID, regionId: 'overworld', chunkX: 3, chunkY: 3 });
    assert.equal(m.length, 15); assert.ok(m.every((row) => row.length === 16), '16×15 grid');
    const allowed = new Set([GRASS, REEDS, TREE, WATER]);
    for (const row of m) for (const tile of row) assert.ok(allowed.has(tile), `terrain ${tile} is in the four-tile contract`);
    const meta = J(`JSON.stringify((function(){var d=DRENWICK_REGIONAL_CHUNK_DEFINITIONS.find(function(x){return x.mapId==='${ID}';});var r=REGIONAL_CHUNK_CATALOG['${ID}'];return {mapId:r.mapId,regionId:r.regionId,chunkX:r.chunkX,chunkY:r.chunkY,displayName:r.displayName,region:r.region,contentKey:r.contentKey,presentation:r.presentation,profile:d.encounterProfileId,itemSetAuthored:Object.prototype.hasOwnProperty.call(d,'itemSetId'),playerAccessibleAuthored:Object.prototype.hasOwnProperty.call(d,'playerAccessible'),playerAccessible:r.playerAccessible,enc:r.allowRandomEncounters,save:r.allowSave};})())`);
    assert.deepEqual(meta, { mapId: ID, regionId: 'overworld', chunkX: 3, chunkY: 3, displayName: 'Eastern Canal Banks', region: 'Drenwick', contentKey: 'drenwick_east_canal', presentation: 'continuous', profile: 'far', itemSetAuthored: false, playerAccessibleAuthored: false, playerAccessible: true, enc: true, save: true });
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].encounterPool===FAR_ENEMY_TEMPLATES`), true);
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].encounterPool===REGIONAL_CHUNK_CATALOG.MAP3_N2.encounterPool`), true, 'same exact far pool reference as MAP3_N2');
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].items.length`), 0);
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='drenwick_east_canal'||n.physicalMapId==='${ID}';}).length`), 0);
    assert.equal(g.run(`Object.prototype.hasOwnProperty.call(MAP_FEATURES,'${ID}')`), false);
    assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`), 'undefined');
    assert.equal(g.run(`typeof ${ID}`), 'undefined');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined');
    assert.equal(g.run(`REGIONAL_POINT_CROSSINGS.some(function(c){return c.from==='${ID}'||c.to==='${ID}';})`), false);

    // 2. Exact canal and two-component topology. Every walkable tile belongs to
    // GRASS/REEDS and therefore remains encounter-eligible.
    assert.ok(m[5].every((tile) => tile === WATER), 'row 5 is uninterrupted WATER×16');
    assert.equal(m.flat().some((tile) => tile === g.run('BRIDGE_GATE')), false, 'no bridge gate');
    assert.equal(m.flat().some((tile) => tile === g.run('PATH')), false, 'no PATH');
    const walkable = (tile) => tile === GRASS || tile === REEDS;
    const seen = new Set(), components = [];
    for (let y = 0; y < 15; y++) for (let x = 0; x < 16; x++) {
      const key = `${x},${y}`;
      if (!walkable(m[y][x]) || seen.has(key)) continue;
      const queue = [[x, y]], cells = []; seen.add(key);
      while (queue.length) {
        const [cx, cy] = queue.shift(); cells.push([cx, cy]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy, nk = `${nx},${ny}`;
          if (ny >= 0 && ny < 15 && nx >= 0 && nx < 16 && walkable(m[ny][nx]) && !seen.has(nk)) { seen.add(nk); queue.push([nx, ny]); }
        }
      }
      components.push(cells);
    }
    assert.equal(components.length, 2, 'exactly two four-directional walkable components');
    components.sort((a, b) => Math.min(...a.map((p) => p[1])) - Math.min(...b.map((p) => p[1])));
    assert.ok(components[0].every((p) => p[1] <= 4), 'north component stays north of canal');
    assert.ok(components[1].every((p) => p[1] >= 6), 'south component stays south of canal');
    assert.deepEqual(components.map((c) => c.length), [68, 109], 'reviewed schematic component sizes');
    const northCells = new Set(components[0].map((p) => p.join(',')));
    const southCells = new Set(components[1].map((p) => p.join(',')));
    for (let x = 1; x <= 14; x++) assert.ok(northCells.has(`${x},0`), `north seam col ${x} reaches only north bank`);
    for (let y = 1; y <= 4; y++) assert.ok(northCells.has(`0,${y}`), `west north segment row ${y} reaches north bank`);
    for (let y = 6; y <= 13; y++) assert.ok(southCells.has(`0,${y}`), `west south segment row ${y} reaches south bank`);
    assert.ok(m[14].every((tile) => tile === TREE), 'south edge blocked');
    for (let row = 0; row < 15; row++) assert.equal(m[row][15], row === 5 ? WATER : TREE, `east edge row ${row} blocked/visual canal only`);
    assert.ok(m[13].slice(1, 15).every(walkable), 'south inward row supports a future broad landing');

    // 3. Exact neighbour edits and matching physical edge sequences.
    assert.deepEqual(north[14], [TREE, REEDS, REEDS, GRASS, REEDS, GRASS, GRASS, REEDS, REEDS, GRASS, REEDS, GRASS, GRASS, REEDS, GRASS, TREE]);
    assert.deepEqual(north[14].slice(1, 15), north[13].slice(1, 15), 'north neighbour edge mirrors its inward row');
    assert.deepEqual(m[0].slice(1, 15), north[14].slice(1, 15), 'broad north seam terrain matches');
    const westEdge = m.map((row) => row[0]);
    assert.deepEqual(westEdge, west.map((row) => row[15]), 'new west edge exactly matches edited MAP3_N2 east edge');
    assert.deepEqual(westEdge, [WATER, REEDS, REEDS, GRASS, GRASS, WATER, GRASS, REEDS, GRASS, REEDS, REEDS, GRASS, REEDS, GRASS, TREE]);
    assert.equal(west[5][15], WATER, 'existing canal WATER at MAP3_N2[5][15] preserved');

    // 4. Exact structural transition sets and per-range continuous indexing.
    const northSouth = J(`JSON.stringify(EDGE_TRANSITIONS['${NORTH_ID}'].south)`);
    const southNorth = J(`JSON.stringify(EDGE_TRANSITIONS['${ID}'].north)`);
    const westEast = J(`JSON.stringify(EDGE_TRANSITIONS['${WEST_ID}'].east)`);
    const eastWest = J(`JSON.stringify(EDGE_TRANSITIONS['${ID}'].west)`);
    assert.deepEqual(northSouth, [{ targetMap: ID, targetEdge: 'north', sourceRange: [1, 14] }]);
    assert.deepEqual(southNorth, [{ targetMap: NORTH_ID, targetEdge: 'south', sourceRange: [1, 14] }]);
    assert.deepEqual(westEast, [
      { targetMap: ID, targetEdge: 'west', sourceRange: [1, 4] },
      { targetMap: ID, targetEdge: 'west', sourceRange: [6, 13] },
    ]);
    assert.deepEqual(eastWest, [
      { targetMap: WEST_ID, targetEdge: 'east', sourceRange: [1, 4] },
      { targetMap: WEST_ID, targetEdge: 'east', sourceRange: [6, 13] },
    ]);
    for (const set of [northSouth, southNorth, westEast, eastWest]) for (const seg of set) {
      assert.deepEqual(Object.keys(seg).sort(), ['sourceRange', 'targetEdge', 'targetMap']);
      assert.equal(J(`JSON.stringify(classifyContinuousSegment(${JSON.stringify(seg)}))`).ok, true);
    }
    assert.deepEqual(J(`JSON.stringify(eligibleContinuousSeam('${WEST_ID}','east').segments.map(function(s){return s.range;}))`), [[1, 4], [6, 13]]);
    assert.deepEqual(J(`JSON.stringify(eligibleContinuousSeam('${ID}','west').segments.map(function(s){return s.range;}))`), [[1, 4], [6, 13]]);
    assert.equal(g.run(`eligibleContinuousSeam('${WEST_ID}','east',5)`), null, 'canal gap not authorized');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].east`), 'undefined');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].south`), 'undefined');

    // 5. Production continuous crossing through the broad north seam and both
    // west ranges: one standing-point handoff, bounded camera/world movement,
    // preserved fractional position/facing, immediate reversal, and no soft-lock.
    const directed = [
      [NORTH_ID, 'south', ID, 8, 'ArrowDown', 'ArrowUp'],
      [WEST_ID, 'east', ID, 2, 'ArrowRight', 'ArrowLeft'],
      [WEST_ID, 'east', ID, 9, 'ArrowRight', 'ArrowLeft'],
    ];
    for (const [from, dir, to, along, key, reverseKey] of directed) {
      placeEdge(from, dir, along); g.run(`player.facing='${dir}';`);
      let rec = drive(key, 24, to);
      assert.equal(mapId(), to, `${from} ${dir} range ${along} crosses continuously`);
      assert.equal(rec.handoffs, 1); assert.ok(rec.maxWorldDelta <= SPEED + 1e-9);
      assert.ok(rec.maxCameraDelta <= SPEED + 1e-9, 'no camera/inset jump');
      assert.equal(rec.zero, 0, 'no stuck/double-dispatch frame');
      const local = dir === 'south' ? rec.firstLocalY : rec.firstLocalX;
      assert.ok(local % 1 !== 0, 'fractional position survives handoff');
      assert.notEqual(local, 1.5 * TILE, 'continuous handoff does not use legacy inset');
      rec = drive(reverseKey, 24, from);
      assert.equal(mapId(), from, 'immediate reversal returns through same segment');
      assert.equal(rec.handoffs, 1);
      assert.equal(g.run('regionalInvariantsHold()'), true);
    }

    // Parallel and diagonal endpoint behavior for all four split-range endpoints.
    for (const row of [1, 4, 6, 13]) {
      const inwardKey = row === 1 || row === 6 ? 'ArrowDown' : 'ArrowUp';
      placeEdge(WEST_ID, 'east', row);
      const beforeY = worldPos().worldPxY;
      let rec = drive(inwardKey, 2);
      assert.notEqual(worldPos().worldPxY, beforeY, `parallel movement works at west endpoint row ${row}`);
      placeEdge(WEST_ID, 'east', row);
      clearKeys(); g.hold('ArrowRight'); g.hold(inwardKey);
      let prevMap = mapId(), handoffs = 0, maxDelta = 0, prev = worldPos();
      for (let i = 0; i < 14; i++) {
        g.frames(1); const cur = worldPos(), mid = mapId();
        maxDelta = Math.max(maxDelta, Math.hypot(cur.worldPxX - prev.worldPxX, cur.worldPxY - prev.worldPxY));
        if (mid !== prevMap) handoffs++; prevMap = mid; prev = cur;
      }
      g.release('ArrowRight'); g.release(inwardKey); clearKeys();
      assert.equal(mapId(), ID, `diagonal inward movement crosses endpoint row ${row}`);
      assert.equal(handoffs, 1); assert.ok(maxDelta <= SPEED * Math.SQRT2 + 1e-9, 'X then Y, no double movement');
    }

    // Canal gap and excluded corners remain blocked, and absent east/south chunks
    // cannot be entered.
    placeEdge(WEST_ID, 'east', 5);
    const gapX = worldPos().worldPxX; const gap = drive('ArrowRight', 30);
    assert.equal(mapId(), WEST_ID); assert.equal(worldPos().worldPxX, gapX); assert.equal(gap.handoffs, 0);
    for (const row of [0, 14]) {
      placeEdge(WEST_ID, 'east', row); drive('ArrowRight', 20); assert.equal(mapId(), WEST_ID, `excluded west corner row ${row} blocked`);
    }
    g.run(`placeAtLocation('${ID}',14.5*TILE,7.5*TILE);forceLegacyRegionalView=false;`); drive('ArrowRight', 60); assert.equal(mapId(), ID, 'east void blocked');
    g.run(`placeAtLocation('${ID}',8.5*TILE,13.5*TILE);forceLegacyRegionalView=false;`); drive('ArrowDown', 60); assert.equal(mapId(), ID, 'south void blocked');
    assert.equal(g.run("mapIdForChunk('overworld',4,3)"), null); assert.equal(g.run("mapIdForChunk('overworld',3,4)"), null);

    // 6. Legacy fallback retains normal inset/cooldown behavior for all three
    // reciprocal pairs, including both segments on the west edge.
    const legacy = [
      [NORTH_ID, 'south', ID, 8, 'north', 'north'],
      [WEST_ID, 'east', ID, 2, 'west', 'west'],
      [WEST_ID, 'east', ID, 9, 'west', 'west'],
    ];
    for (const [from, dir, to, along, targetEdge, reverseDir] of legacy) {
      placeEdge(from, dir, along); g.run('forceLegacyRegionalView=true;combat.cooldown=0;');
      assert.equal(g.run(`tryEdgeTransition('${dir}')`), true);
      assert.equal(mapId(), to);
      if (targetEdge === 'north') assert.equal(g.run('player.y'), 1.5 * TILE);
      else assert.equal(g.run('player.x'), 1.5 * TILE);
      assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
      if (reverseDir === 'north') g.run(`combat.cooldown=0;placeAtLocation('${ID}',${along + 0.5}*TILE,0.5*TILE);`);
      else g.run(`combat.cooldown=0;placeAtLocation('${ID}',0.5*TILE,${along + 0.5}*TILE);`);
      assert.equal(g.run(`tryEdgeTransition('${reverseDir}')`), true, `legacy reciprocates through ${targetEdge} range ${along}`);
      assert.equal(mapId(), from);
      assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
    }

    // 7. Geographic encounters on both banks use FAR. Every walkable terrain
    // type is eligible; continuous movement itself consumes no encounter roll.
    for (const [x, y] of [[8, 2], [8, 7]]) {
      g.run(`placeAtLocation('${ID}',${x + 0.5}*TILE,${y + 0.5}*TILE);resetLocationState();`);
      assert.equal(g.run('currentEncounterPool()===FAR_ENEMY_TEMPLATES'), true, `far pool on bank row ${y}`);
      assert.equal(g.run(`geographicEncounterContext('overworld',3*COLS*TILE+${x + 0.5}*TILE,3*ROWS*TILE+${y + 0.5}*TILE).encounterPool===FAR_ENEMY_TEMPLATES`), true);
    }
    g.run(`placeAtLocation('${ID}',8.5*TILE,2.5*TILE);`);
    assert.equal(g.run('isEncounterEligibleTile(GRASS)'), true);
    assert.equal(g.run('isEncounterEligibleTile(REEDS)'), true);
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].map.flat().filter(function(t){return isTileWalkable(t)&&!isEncounterEligibleTile(t);}).length`), 0, 'all walkable grid terrain is encounter eligible');
    const noRoll = J(`(function(){debugMode=false;combat.active=false;placeAtLocation('${WEST_ID}',15.7*TILE,2.5*TILE);forceLegacyRegionalView=false;
      var calls=0,_r=Math.random;Math.random=function(){calls++;return 0;};
      var before=mapIdForRef(activeMap);for(var i=0;i<12&&mapIdForRef(activeMap)===before;i++)continuousSeamMove(2,0);
      Math.random=_r;return JSON.stringify({calls:calls,map:mapIdForRef(activeMap),combat:combat.active});})()`);
    assert.deepEqual(noRoll, { calls: 0, map: ID, combat: false }, 'crossing primitive consumes no encounter roll and starts no combat');

    // 8. Default/coordinate debug warp, canonical placement, and v4 save/load on
    // both disconnected components.
    let warp = J(`JSON.stringify(debugWarpToDestination('outdoor:${ID}'))`);
    assert.equal(warp.success, true); assert.deepEqual([warp.col, warp.row], [8, 7]);
    assert.equal(mapId(), ID); assert.equal(m[warp.row][warp.col], GRASS, 'default warp lands safely on south bank');
    warp = J(`JSON.stringify(debugWarpToDestination('outdoor:${ID}',8,2))`);
    assert.equal(warp.success, true); assert.deepEqual([warp.col, warp.row], [8, 2]);
    assert.equal(m[warp.row][warp.col], REEDS, 'coordinate warp reaches north bank');
    for (const [x, y, label] of [[8.25, 2.5, 'north'], [8.25, 7.5, 'south']]) {
      assert.equal(g.run(`placeAtLocation('${ID}',${x}*TILE,${y}*TILE)`), true, `${label} normal placement`);
      assert.equal(g.run(`commitRegionalWorldPosition('overworld',3*COLS*TILE+${x}*TILE,3*ROWS*TILE+${y}*TILE)`), true, `${label} canonical placement`);
      g.run("player.facing='left';saveGame();");
      const saved = J("localStorage.getItem('verdantVale_save')");
      assert.equal(saved.version, 4); assert.equal(saved.location.kind, 'regional');
      const before = worldPos();
      g.run("placeAtLocation('MAP2',2.5*TILE,2.5*TILE);player.facing='down';");
      assert.equal(g.run('loadGame()'), true); assert.equal(mapId(), ID);
      assert.deepEqual(worldPos(), before); assert.equal(g.run('player.facing'), 'left');
      assert.equal(g.run('canSaveHere()'), true);
    }
    assert.equal(g.run('SAVE_VERSION'), 4);

    // 9. Exactly the two reviewed existing grids changed, plus this new grid.
    assert.equal(sha256(JSON.stringify(m)), FP); assert.equal(GRID_FP.fingerprints[ID], FP);
    assert.equal(sha256(JSON.stringify(west)), WEST_FP); assert.equal(GRID_FP.fingerprints[WEST_ID], WEST_FP);
    assert.equal(sha256(JSON.stringify(north)), NORTH_FP); assert.equal(GRID_FP.fingerprints[NORTH_ID], NORTH_FP);
    const oldWest = west.map((row) => row.slice());
    const oldEastValues = { 1: WATER, 2: WATER, 3: TREE, 4: TREE, 6: TREE, 7: TREE, 8: TREE, 9: TREE, 10: WATER, 11: TREE, 12: TREE, 13: TREE };
    for (const [row, tile] of Object.entries(oldEastValues)) oldWest[Number(row)][15] = tile;
    assert.equal(sha256(JSON.stringify(oldWest)), OLD_WEST_FP, 'restoring exactly twelve east-edge cells recreates prior MAP3_N2');
    const oldNorth = north.map((row) => row.slice()); for (let c = 1; c <= 14; c++) oldNorth[14][c] = TREE;
    assert.equal(sha256(JSON.stringify(oldNorth)), OLD_NORTH_FP, 'restoring exactly fourteen south-edge cells recreates prior South Reservoir Road');
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 23);
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      if ([ID, WEST_ID, NORTH_ID].includes(id)) continue;
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), fp, `${id}: established fingerprint unchanged`);
    }

    const audit = require('../transition-audit.js');
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 26, ALIGNS: 32, BLOCKED: 30 });
    assert.equal(audit.seamReadiness.edges.length, 92);
    assert.equal(g.run('continuousSeamEntries().length'), 34, '34 directed segment entries');
    assert.equal(g.run('continuousSeamEntries().length/2'), 17, '17 reciprocal segment pairs');
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'), 23);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.filter(function(p){return mapPlayerAccessible(p.mapId);}).length'), 17);
  },
};
