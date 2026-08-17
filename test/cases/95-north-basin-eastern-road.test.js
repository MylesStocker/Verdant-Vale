'use strict';
// NORTH_BASIN_SE_MAP — playable South Reservoir Road at overworld chunk (3,2).
// Proves the reviewed neighbour-grid delta, reciprocal two-tile entrance,
// encounter geography, blocked deferred borders, canonical placement/save, and
// unchanged fingerprints for every previously placed grid other than that delta.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'NORTH_BASIN_SE_MAP';
const S_ID = 'NORTH_BASIN_S_MAP';
const FP = 'c9a5c71ad15b9e2c6a9caf33a32660a7423cb044e7cb5cbac867b26248b1169b';
const S_FP = '4cfdbe21cea85198a47cf98368fd9304fa49cf05c2f95edcde614a12889d416a';
const OLD_S_FP = 'd8497eab4cee320947641a41241f6107857980a5e4b2520bdb737845c7022975';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Reviewed fingerprints at eefca3f. NORTH_BASIN_S_MAP is handled separately by
// reconstructing its one authorized pre-change cell; the new map did not yet exist.
const PRIOR_FPS = {
  MAP: 'fc772998da4db584a1d59d7125c4d52237b99bbda734ba2cb99ea723f8aaea7f',
  MAP2: '269bef01f6bd885e1c8770b26c5b53152b4b16e18a387f8c2d7a8949bef726dc',
  MAP3: '8ae214585fd47100a4005494086e190503bf3958db0457434eb20bc23d9e2b59',
  MAP4: '3759195c2982151ae6636f4daf29f5cbb175d4a48ada0a276c1ab7b1520e7644',
  MAP5: '93073d85311e659147f2af889d5aab2d6d3dbe76c632e4b2ab1e77f042349e1f',
  MAP_N1: '871d5dacd91e1421557554d830e8d64108a5d1d920165ff1bc2094cca090e770',
  MAP_N2: '39f4bcce6707c439384674c021ef18acf552221ef9e1c57f7435413aeaaeb963',
  RODDON_WAY_MAP: 'c61585db96af5cb44b2d8d7c5a2dc7283affdb078c6ba246fc137cb3a8235a63',
  MAP3_N1: '490ecb2044576d7b1410448456121762e0b9ca01954daf1216f3dc6e3922e9a1',
  MAP3_N2: 'e295dd572e02dc442f410fe4fe0d3aff1ac790bd4a40302527fb6c208130b315',
  DRENWICK_WEST_OUTFALL_MAP: '0c133a70a426ca8015a3a5204815063a5ef65bf073d3ad40d2b093de0ba813df',
  NORTH_BASIN_C_MAP: '562b1d6e9b79fcc2a2b1b3092538094ec31ff280733acc326ec8c2f90b257668',
  NORTH_BASIN_SW_MAP: '38e09a579a5e76b8539b02698235e01b2c5d664fa6fc9cfa11dd08804575d4c1',
  NORTH_BASIN_W_MAP: '5973d3f2a56180686d9c4f75d0cc038730057abb7ba5cea88c042664aa13a21f',
  NORTH_BASIN_NW_MAP: '0105619e109e8dcc3c941724437dd7fd0b6b2208e3507d498046841f6b53d28d',
  NORTH_BASIN_N_MAP: 'e59e5fa33fbc7e6388e707d1ef4a96282c446c6aead0f2cc24e935426e960bc7',
  NORTH_BASIN_NE_MAP: '97af356c23d758f6d396afb57e1fd152c4b0701dd6f66839248cf7350b6d0954',
  NORTH_BASIN_NE2_MAP: '3e6f5754052438f40b9f560db8d6321e9e0ab72aeaf94f2b7874cff149021417',
  NORTH_BASIN_E2_MAP: '74353043788878bfd753cc5e3382a6e758e7e652ce3452e222a196d3279c96ff',
  NORTH_BASIN_E_MAP: '8241adef3dc0fd37a2b85cc02d50ec8fa0446bded9ca5fc9bdfd4314f6390f9c',
};

function ctx() { const g = createContext(); g.press('Enter'); g.press('Enter'); return g; }
const J = (g, expr) => JSON.parse(g.run(expr));
const mapId = (g) => g.run('mapIdForRef(activeMap)');
const worldX = (g) => g.run('regionalWorldPosition().worldPxX');
const cameraX = (g) => J(g, "JSON.stringify((function(){var c=regionalWorldPosition();return buildContinuousWorldPlanFromWorld(c.regionId,c.worldPxX,c.worldPxY,512,480).camPxX;})())");
const poolName = (g) => g.run("currentEncounterPool()===NORTH_BASIN_ENEMY_TEMPLATES?'NORTH_BASIN':currentEncounterPool()===UPPER_REACH_ENEMY_TEMPLATES?'UPPER_REACH':'OTHER'");

module.exports = {
  name: 'North Basin South Reservoir Road: playable (3,2), widened entrance, harder encounters, save/load',
  run() {
    const g = ctx();
    const m = J(g, `JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const s = J(g, `JSON.stringify(REGIONAL_CHUNK_CATALOG['${S_ID}'].map)`);
    const north = J(g, 'JSON.stringify(REGIONAL_CHUNK_CATALOG.NORTH_BASIN_E_MAP.map)');
    const GRASS = g.run('GRASS'), WATER = g.run('WATER'), PATH = g.run('PATH'), TREE = g.run('TREE');
    const REEDS = g.run('REEDS'), MUD = g.run('BASIN_MUD'), STONE = g.run('EXPOSED_STONE');

    // 1. Definition, placement, metadata, dimensions, allowed terrain, and no content.
    assert.equal(g.run(`NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1, 'authored exactly once');
    assert.deepEqual(J(g, `JSON.stringify(regionPlacementForMapId('${ID}'))`), { mapId: ID, regionId: 'overworld', chunkX: 3, chunkY: 2 }, 'placed at overworld (3,2)');
    assert.equal(m.length, 15); assert.ok(m.every((row) => row.length === 16), '16×15 grid');
    const allowed = new Set([GRASS, WATER, PATH, TREE, REEDS, MUD, STONE]);
    for (const row of m) for (const tile of row) assert.ok(allowed.has(tile), `approved existing outdoor tile ${tile}`);
    const meta = J(g, `JSON.stringify((function(){var d=NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.find(function(x){return x.mapId==='${ID}';});var r=REGIONAL_CHUNK_CATALOG['${ID}'];return {mapId:r.mapId,regionId:r.regionId,chunkX:r.chunkX,chunkY:r.chunkY,displayName:r.displayName,region:r.region,contentKey:r.contentKey,presentation:r.presentation,profile:d.encounterProfileId,itemSetAuthored:Object.prototype.hasOwnProperty.call(d,'itemSetId'),playerAccessibleAuthored:Object.prototype.hasOwnProperty.call(d,'playerAccessible'),playerAccessible:r.playerAccessible,enc:r.allowRandomEncounters,save:r.allowSave};})())`);
    assert.deepEqual(meta, { mapId: ID, regionId: 'overworld', chunkX: 3, chunkY: 2, displayName: 'North Basin — South Reservoir Road', region: 'North Basin', contentKey: 'north_basin_se', presentation: 'continuous', profile: 'upper_reach', itemSetAuthored: false, playerAccessibleAuthored: false, playerAccessible: true, enc: true, save: true });
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].encounterPool===UPPER_REACH_ENEMY_TEMPLATES`), true, 'upper_reach resolves to the harder pool reference');
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].items.length`), 0, 'omitted itemSetId resolves to empty items');
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='north_basin_se'||n.physicalMapId==='${ID}';}).length`), 0, 'no NPC ownership');
    assert.equal(g.run(`Object.prototype.hasOwnProperty.call(MAP_FEATURES,'${ID}')`), false, 'no interactions/features');
    assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`), 'undefined', 'no decoration');
    assert.equal(g.run(`typeof ${ID}`), 'undefined', 'no compatibility grid alias');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined', 'no window alias');

    // 2-5. Exact borders, the reviewed two-cell prior-grid delta, and road topology.
    assert.deepEqual(m[0], north[14], 'north edge exactly mirrors NORTH_BASIN_E_MAP.south');
    assert.ok(m[0].every((t) => t === TREE), 'north is TREE×16 and nonwalkable');
    for (let row = 0; row < 15; row++) assert.equal(m[row][0], row === 7 ? REEDS : row === 8 ? PATH : TREE, `west edge row ${row}`);
    for (let row = 0; row < 15; row++) assert.equal(m[row][15], TREE, `east edge row ${row} blocked`);
    assert.ok(m[14].every((t) => t === TREE), 'south is TREE×16');
    for (let col = 0; col <= 14; col++) assert.equal(m[8][col], PATH, `main road r8c${col}`);
    for (let row = 0; row < 15; row++) for (let col = 0; col < 16; col++) if (row !== 8) assert.notEqual(m[row][col], PATH, `no southbound/secondary PATH at r${row}c${col}`);
    assert.equal(m[8][15], TREE, 'east road stops one tile short');
    assert.ok(m[14].every((t) => t === TREE), 'no south opening or path stub');
    assert.equal(s[7][14], REEDS); assert.equal(s[7][15], REEDS, 'South Approach reed shoulder reaches the seam');
    assert.equal(s[8][14], PATH); assert.equal(s[8][15], PATH, 'South Approach road reaches the seam');
    const reconstructed = s.map((row) => row.slice()); reconstructed[7][15] = TREE; reconstructed[8][15] = TREE;
    assert.equal(sha256(JSON.stringify(reconstructed)), OLD_S_FP, 'restoring only r7c15/r8c15 recreates the reviewed pre-change fingerprint');
    assert.equal(sha256(JSON.stringify(s)), S_FP, 'current South Approach fingerprint is the reviewed two-cell entrance revision');

    // 6. Reciprocal structural seam; future borders have no transitions and fail closed.
    const se = J(g, "JSON.stringify(EDGE_TRANSITIONS.NORTH_BASIN_S_MAP.east)");
    const ws = J(g, `JSON.stringify(EDGE_TRANSITIONS['${ID}'].west)`);
    assert.deepEqual(se, [{ targetMap: ID, targetEdge: 'west', sourceRange: [7, 8] }]);
    assert.deepEqual(ws, [{ targetMap: S_ID, targetEdge: 'east', sourceRange: [7, 8] }]);
    assert.deepEqual(Object.keys(se[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap']);
    assert.deepEqual(Object.keys(ws[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap']);
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].east`), 'undefined');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].south`), 'undefined');
    assert.deepEqual(J(g, `JSON.stringify(classifyContinuousSegment(EDGE_TRANSITIONS['${ID}'].west[0]))`), { ok: true, reason: null });
    assert.deepEqual(J(g, `JSON.stringify(continuousSeamEdgeWalkability(mapRefForId('${ID}'),'west',mapRefForId('${S_ID}'),'east',[7,8]))`), { ok: true });
    assert.equal(g.run(`eligibleContinuousSeam('${S_ID}','east').to`), ID);
    assert.equal(g.run(`eligibleContinuousSeam('${ID}','west').to`), S_ID);
    const audit = require('../transition-audit.js');
    const verdict = Object.fromEntries(audit.seamReadiness.edges.map((e) => [e.mapId + '|' + e.dir, e.verdict]));
    assert.equal(verdict[`${S_ID}|east`], 'ALIGNS'); assert.equal(verdict[`${ID}|west`], 'ALIGNS');
    assert.equal(verdict[`${ID}|north`], 'BLOCKED'); assert.equal(verdict[`${ID}|east`], 'BORDER'); assert.equal(verdict[`${ID}|south`], 'BORDER');
    assert.equal(g.run("mapIdForChunk('overworld',4,2)"), null); assert.equal(g.run("mapIdForChunk('overworld',3,3)"), null);
    assert.equal(g.run(`continuousFootprintWalkable('overworld',{chunkX:3,chunkY:2,mapId:'${ID}'},4*COLS*TILE+1,2*ROWS*TILE+8.5*TILE)`), false, 'east void is fail-closed');

    // 7 + 9 + 13. Continuous eastbound crossing: smooth atomic handoff and pool flip.
    g.run(`forceLegacyRegionalView=false;debugMode=false;combat.active=false;combat.cooldown=0;placeAtLocation('${S_ID}',14.25*TILE+0.5,8.5*TILE);for(var k in keys)delete keys[k];`);
    assert.equal(poolName(g), 'NORTH_BASIN');
    let prevW = worldX(g), prevC = cameraX(g), prevMap = mapId(g), prevPool = poolName(g);
    let handoffs = 0, poolFlips = 0, maxWorldDelta = 0, maxCameraDelta = 0, zeroFrames = 0, firstLocalX = null;
    let handoffWorldX = null, poolFlipWorldX = null;
    g.run(`window.__nbSeRandomCalls=0;window.__nbSeOriginalRandom=Math.random;Math.random=function(){window.__nbSeRandomCalls++;return 0;};`);
    g.hold('ArrowRight');
    for (let i = 0; i < 80; i++) {
      g.frames(1);
      const w = worldX(g), c = cameraX(g), mid = mapId(g), pool = poolName(g);
      maxWorldDelta = Math.max(maxWorldDelta, Math.abs(w - prevW));
      maxCameraDelta = Math.max(maxCameraDelta, Math.abs(c - prevC));
      if (w === prevW && mid === prevMap) zeroFrames++;
      if (mid !== prevMap) { handoffs++; handoffWorldX = w; if (firstLocalX === null) firstLocalX = g.run('player.x'); }
      if (pool !== prevPool) { poolFlips++; poolFlipWorldX = w; }
      prevW = w; prevC = c; prevMap = mid; prevPool = pool;
      if (mid === ID && g.run('player.x') > 4) break;
    }
    g.release('ArrowRight');
    const crossingRandomCalls = g.run('window.__nbSeRandomCalls');
    g.run('Math.random=window.__nbSeOriginalRandom;delete window.__nbSeOriginalRandom;delete window.__nbSeRandomCalls;');
    assert.equal(mapId(g), ID); assert.equal(handoffs, 1); assert.equal(poolFlips, 1); assert.equal(poolName(g), 'UPPER_REACH');
    assert.equal(poolFlipWorldX, handoffWorldX, 'geographic pool ownership flips on the canonical standing-point handoff');
    assert.equal(crossingRandomCalls, 0, 'PATH seam crossing consumes no random encounter roll');
    assert.ok(maxWorldDelta <= g.run('SPEED')); assert.ok(maxCameraDelta <= maxWorldDelta + 1e-9, 'no camera jump');
    assert.equal(zeroFrames, 0, 'no stuck/double-dispatch frames');
    assert.equal(firstLocalX % 1, 0.5, 'fractional sub-pixel progress survives handoff');
    assert.notEqual(firstLocalX, g.run('1.5*TILE'), 'continuous crossing does not snap to legacy inset');
    assert.equal(g.run('player.facing'), 'right'); assert.equal(g.run('combat.active'), false, 'PATH crossing starts no combat');
    assert.equal(g.run('regionalInvariantsHold()'), true);

    // Immediate reversal crosses once back; parallel/diagonal input cannot escape the pair or soft-lock.
    g.hold('ArrowLeft'); let reverseHandoffs = 0; prevMap = mapId(g);
    for (let i = 0; i < 40; i++) { g.frames(1); const mid = mapId(g); if (mid !== prevMap) reverseHandoffs++; prevMap = mid; if (mid === S_ID) break; }
    g.release('ArrowLeft'); assert.equal(mapId(g), S_ID); assert.equal(reverseHandoffs, 1); assert.equal(poolName(g), 'NORTH_BASIN');
    g.run(`placeAtLocation('${S_ID}',15.75*TILE,8.5*TILE);forceLegacyRegionalView=false;for(var k in keys)delete keys[k];`);
    const beforeParallelY = g.run('regionalWorldPosition().worldPxY');
    g.hold('ArrowUp'); g.frames(2); g.release('ArrowUp');
    assert.ok(g.run('regionalWorldPosition().worldPxY') <= beforeParallelY, 'parallel motion is safe at the seam');
    g.hold('ArrowRight'); g.hold('ArrowUp'); g.frames(8); g.release('ArrowRight'); g.release('ArrowUp');
    assert.ok([S_ID, ID].includes(mapId(g)), 'diagonal input stays on the reciprocal pair');
    assert.equal(g.run('regionalInvariantsHold()'), true, 'diagonal/footprint movement preserves canonical invariants');

    // 8. Legacy fallback uses reciprocal inset landings and established cooldown.
    g.run(`forceLegacyRegionalView=true;combat.cooldown=0;placeAtLocation('${S_ID}',15.5*TILE,8.5*TILE);`);
    assert.equal(g.run("tryEdgeTransition('east')"), true); assert.equal(mapId(g), ID);
    assert.equal(g.run('player.x'), g.run('1.5*TILE')); assert.equal(g.run('player.y'), g.run('8.5*TILE'));
    assert.equal(g.run('player.facing'), 'right'); assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
    g.run(`combat.cooldown=0;placeAtLocation('${ID}',0.5*TILE,8.5*TILE);`);
    assert.equal(g.run("tryEdgeTransition('west')"), true); assert.equal(mapId(g), S_ID);
    assert.equal(g.run('player.x'), g.run('14.5*TILE')); assert.equal(g.run('player.y'), g.run('8.5*TILE'));
    assert.equal(g.run('player.facing'), 'left'); assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));

    // 10-12. PATH is safe; all substantial off-road terrain is eligible; four
    // cosmetic safe cells are isolated and cannot form a secondary safe corridor.
    g.run(`forceLegacyRegionalView=false;placeAtLocation('${ID}',8.5*TILE,9.5*TILE);resetLocationState();`);
    assert.equal(g.run('isEncounterEligibleTile(PATH)'), false);
    assert.equal(g.run('isEncounterEligibleTile(GRASS)'), true); assert.equal(g.run('isEncounterEligibleTile(REEDS)'), true);
    const counts = {}; for (const row of m) for (const tile of row) counts[tile] = (counts[tile] || 0) + 1;
    assert.equal(counts[PATH], 15); assert.equal(counts[GRASS], 55); assert.equal(counts[REEDS], 59);
    assert.equal(counts[MUD] + counts[STONE], 4, 'four cosmetic safe tiles maximum');
    const cosmetics = [];
    for (let y = 0; y < 15; y++) for (let x = 0; x < 16; x++) if (m[y][x] === MUD || m[y][x] === STONE) cosmetics.push([x, y]);
    for (let i = 0; i < cosmetics.length; i++) for (let j = i + 1; j < cosmetics.length; j++) {
      assert.ok(Math.max(Math.abs(cosmetics[i][0] - cosmetics[j][0]), Math.abs(cosmetics[i][1] - cosmetics[j][1])) > 1, 'safe cosmetic cells do not touch, even diagonally');
    }
    assert.equal(g.run(`placeAtLocation('${ID}',12.5*TILE,3.5*TILE)`), true, 'normal placement on eligible GRASS succeeds');
    assert.equal(g.run('isEncounterEligibleTile(activeMap[3][12])'), true); assert.equal(poolName(g), 'UPPER_REACH');

    // Deferred road/path endpoints are physically blocked with no movement into void.
    g.run(`forceLegacyRegionalView=false;debugMode=true;placeAtLocation('${ID}',14.5*TILE,8.5*TILE);for(var k in keys)delete keys[k];`);
    g.hold('ArrowRight'); g.frames(80); g.release('ArrowRight'); assert.equal(mapId(g), ID); assert.ok(g.run('player.x') < g.run('15*TILE'));
    g.run(`placeAtLocation('${ID}',6.5*TILE,13.5*TILE);for(var k in keys)delete keys[k];`);
    g.hold('ArrowDown'); g.frames(80); g.release('ArrowDown'); assert.equal(mapId(g), ID); assert.ok(g.run('player.y') < g.run('14*TILE'));

    // 14-15. Every accessible placement path plus v4 save/load succeeds atomically.
    assert.equal(g.run(`placeAtLocation('${ID}',8.5*TILE,9.5*TILE)`), true, 'normal placement');
    assert.equal(g.run(`commitRegionalWorldPosition('overworld',3*COLS*TILE+8.5*TILE,2*ROWS*TILE+9.5*TILE)`), true, 'canonical placement');
    assert.equal(g.run(`transitionToLocation({mapId:'${ID}',x:8.5*TILE,y:9.5*TILE,facing:'down'})`), true, 'normal transition placement');
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), true, 'debug warp');
    g.run(`placeAtLocation('${ID}',8.5*TILE,9.5*TILE);player.facing='down';saveGame();`);
    const saved = J(g, "localStorage.getItem('verdantVale_save')");
    assert.equal(saved.version, 4); assert.equal(saved.location.kind, 'regional');
    const beforeSavePoint = J(g, 'JSON.stringify(regionalWorldPosition())');
    g.run("placeAtLocation('MAP2',2.5*TILE,2.5*TILE);player.facing='left';");
    assert.equal(g.run('loadGame()'), true); assert.equal(mapId(g), ID); assert.deepEqual(J(g, 'JSON.stringify(regionalWorldPosition())'), beforeSavePoint);
    assert.equal(g.run('player.facing'), 'down'); assert.equal(g.run('canSaveHere()'), true); assert.equal(g.run('SAVE_VERSION'), 4);

    // 16. New/authorized fingerprints plus every other reviewed prior grid.
    assert.equal(sha256(JSON.stringify(m)), FP); assert.equal(GRID_FP.fingerprints[ID], FP);
    assert.equal(GRID_FP.fingerprints[S_ID], S_FP); assert.equal(Object.keys(GRID_FP.fingerprints).length, 22);
    for (const [id, fp] of Object.entries(PRIOR_FPS)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), fp, `${id}: prior fingerprint unchanged`);
    }
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 26, ALIGNS: 28, BLOCKED: 30 });
    assert.equal(audit.seamReadiness.edges.length, 88);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'), 22);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.filter(function(p){return mapPlayerAccessible(p.mapId);}).length'), 16);
  },
};
