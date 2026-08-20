'use strict';
// NORTH_BASIN_SE_MAP — playable South Reservoir Road at overworld chunk (3,2).
// Proves the reviewed neighbour-grid delta, reciprocal two-tile entrance,
// encounter geography, east-border closure, canonical placement/save, and the
// later broad south-bank continuation without altering the road topology.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'NORTH_BASIN_SE_MAP';
const S_ID = 'NORTH_BASIN_S_MAP';
const FP = '96ac86bdc402728eab845a9cd6250609787d4ed0994affe294fce8f3d578a2b3';
const OLD_FP = '04f4d719559a39ed231a147fd6e3604a48611c7628e3c5aa20e196e82077bcd7';
const S_FP = '41d3b38d9932ad5ed3fea54ed787aece91375e88e7cc7c4e0a69cb9bed36b240';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Reviewed fingerprints retained by this road regression. NORTH_BASIN_S_MAP is
// handled separately by reconstructing its authorized pre-change cells; later
// intentional terrain revisions update only their own entry and prove isolation
// in their next-numbered focused test.
const PRIOR_FPS = {
  MAP: 'fc772998da4db584a1d59d7125c4d52237b99bbda734ba2cb99ea723f8aaea7f',
  MAP2: '879a6f9ea7fe373b2dc1a026c7374c1b2743288a533edac74bbcce263a571d5b',
  MAP3: '14cb9111d171454cba60c986e8bd06974ab3023652ce036017bb0c4f13abca17',
  MAP4: '4e64a4a814b1fb4c4729a651fd6b34e6dc96e03950fd322339054407a2b4dca9',
  MAP5: '93073d85311e659147f2af889d5aab2d6d3dbe76c632e4b2ab1e77f042349e1f',
  MAP_N1: '871d5dacd91e1421557554d830e8d64108a5d1d920165ff1bc2094cca090e770',
  MAP_N2: '39f4bcce6707c439384674c021ef18acf552221ef9e1c57f7435413aeaaeb963',
  RODDON_WAY_MAP: '835e3050e45a3bcd74454fc411f006ea0556b08c9fea6d7e31795a4908eba2bc',
  MAP3_N1: '7a7f6def4fbae9ef32f036fb9932e1288171d90c0da68f9e5eaed186b8d5a923',
  MAP3_N2: '06664d7a4ef0485e2a605a71932fd15364029fa59def6cb75acf206288568039',
  DRENWICK_WEST_OUTFALL_MAP: 'ba1ab2ab813db74a65a342d6b89232f17a43ec092b12096d06124d9172ab6334',
  NORTH_BASIN_C_MAP: '562b1d6e9b79fcc2a2b1b3092538094ec31ff280733acc326ec8c2f90b257668',
  NORTH_BASIN_SW_MAP: '38e09a579a5e76b8539b02698235e01b2c5d664fa6fc9cfa11dd08804575d4c1',
  NORTH_BASIN_W_MAP: 'df88364722dc6e4cd77a3c95182165c3ecff777d9c37e290b4810c6d2da3a1f3',
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

    // 2-5. Exact borders, the broken fen seam (open wherever permeable), road topology.
    assert.deepEqual(m[0], north[14], 'north edge exactly mirrors NORTH_BASIN_E_MAP.south');
    assert.ok(m[0].every((t) => t === TREE), 'north is TREE×16 and nonwalkable');
    // SE west edge (col 0) and S east edge (col 15) are a broken fen seam: reed
    // marsh / reservoir water with lone framing trees — no GRASS, and no PATH
    // except the single row-8 road; not a straight tree wall.
    for (const col of [m.map((r) => r[0]), s.map((r) => r[15])]) {
      assert.equal(col.filter((t) => t === GRASS).length, 0, 'no GRASS on the seam column');
      assert.equal(col.filter((t) => t === PATH).length, 1, 'exactly one PATH (the row-8 road) on the seam column');
      assert.equal(col[8], PATH, 'the one road tile is at row 8');
      assert.ok(col.filter((t) => t === TREE).length <= 6, 'not a straight wall of trees');
      assert.ok(col.filter((t) => t === REEDS).length >= 4, 'has walkable reed openings');
    }
    // The seam is crossable EXACTLY where both shores are permeable (walkable),
    // and closed everywhere else — the user-visible guarantee.
    for (let row = 0; row < 15; row++) {
      const permeable = g.run(`isTileWalkable(mapRefForId('${S_ID}')[${row}][15]) && isTileWalkable(mapRefForId('${ID}')[${row}][0])`);
      const crossable = !!g.run(`eligibleContinuousSeam('${S_ID}','east',${row})`);
      assert.equal(crossable, permeable, `seam row ${row}: crossable iff permeable`);
    }
    for (let row = 0; row < 15; row++) assert.equal(m[row][15], row === 8 ? PATH : [6,7,9,10].includes(row) ? REEDS : TREE, `east edge row ${row}`);
    assert.deepEqual(m[14], [TREE, REEDS, REEDS, GRASS, REEDS, GRASS, GRASS, REEDS, REEDS, GRASS, REEDS, GRASS, GRASS, REEDS, GRASS, TREE], 'later broad south-bank seam preserves blocked corners');
    for (let col = 0; col <= 14; col++) assert.equal(m[8][col], PATH, `main road r8c${col}`);
    for (let row = 0; row < 15; row++) for (let col = 0; col < 16; col++) if (row !== 8) assert.notEqual(m[row][col], PATH, `no southbound/secondary PATH at r${row}c${col}`);
    assert.equal(m[8][15], PATH, 'east road now reaches East Causeway');
    assert.ok(m[14].every((t) => t !== PATH), 'south opening adds no road/path stub');
    assert.equal(s[7][15], REEDS, 'South Approach reed shoulder reaches the seam');
    assert.equal(s[8][15], PATH, 'South Approach road reaches the seam');
    assert.equal(sha256(JSON.stringify(s)), S_FP, 'current South Approach fingerprint');

    // 6. Original reciprocal west seam remains structural; the later broad
    // south seam and East Causeway seam are structural too.
    const se = J(g, "JSON.stringify(EDGE_TRANSITIONS.NORTH_BASIN_S_MAP.east)");
    const ws = J(g, `JSON.stringify(EDGE_TRANSITIONS['${ID}'].west)`);
    assert.deepEqual(se.map((x) => x.sourceRange), [[7, 10], [12, 13]], 'S.east crosses every permeable run of the shore');
    assert.deepEqual(ws.map((x) => x.sourceRange), [[7, 10], [12, 13]], 'SE.west mirrors it');
    for (const seg of se) { assert.equal(seg.targetMap, ID); assert.equal(seg.targetEdge, 'west'); }
    for (const seg of ws) { assert.equal(seg.targetMap, S_ID); assert.equal(seg.targetEdge, 'east'); }
    assert.deepEqual(Object.keys(se[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap']);
    assert.deepEqual(Object.keys(ws[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap']);
    assert.deepEqual(J(g, `JSON.stringify(EDGE_TRANSITIONS['${ID}'].east)`), [{ targetMap: 'EAST_CAUSEWAY_MAP', targetEdge: 'west', sourceRange: [6, 10] }]);
    assert.deepEqual(J(g, `JSON.stringify(EDGE_TRANSITIONS['${ID}'].south)`), [{ targetMap: 'DRENWICK_EAST_CANAL_MAP', targetEdge: 'north', sourceRange: [1, 14] }]);
    assert.deepEqual(J(g, `JSON.stringify(classifyContinuousSegment(EDGE_TRANSITIONS['${ID}'].west[0]))`), { ok: true, reason: null });
    assert.deepEqual(J(g, `JSON.stringify(continuousSeamEdgeWalkability(mapRefForId('${ID}'),'west',mapRefForId('${S_ID}'),'east',[7,10]))`), { ok: true });
    assert.deepEqual(J(g, `JSON.stringify(continuousSeamEdgeWalkability(mapRefForId('${ID}'),'west',mapRefForId('${S_ID}'),'east',[12,13]))`), { ok: true });
    assert.equal(g.run(`eligibleContinuousSeam('${S_ID}','east').to`), ID);
    assert.equal(g.run(`eligibleContinuousSeam('${ID}','west').to`), S_ID);
    const audit = require('../transition-audit.js');
    const verdict = Object.fromEntries(audit.seamReadiness.edges.map((e) => [e.mapId + '|' + e.dir, e.verdict]));
    assert.equal(verdict[`${S_ID}|east`], 'ALIGNS'); assert.equal(verdict[`${ID}|west`], 'ALIGNS');
    assert.equal(verdict[`${ID}|north`], 'BLOCKED'); assert.equal(verdict[`${ID}|east`], 'ALIGNS'); assert.equal(verdict[`${ID}|south`], 'ALIGNS');
    assert.equal(g.run("mapIdForChunk('overworld',4,2)"), 'EAST_CAUSEWAY_MAP'); assert.equal(g.run("mapIdForChunk('overworld',3,3)"), 'DRENWICK_EAST_CANAL_MAP');

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
    assert.equal(counts[PATH], 16); assert.equal(counts[GRASS], 62); assert.equal(counts[REEDS], 74);
    assert.equal(counts[MUD] + counts[STONE], 4, 'four cosmetic safe tiles maximum');
    const cosmetics = [];
    for (let y = 0; y < 15; y++) for (let x = 0; x < 16; x++) if (m[y][x] === MUD || m[y][x] === STONE) cosmetics.push([x, y]);
    for (let i = 0; i < cosmetics.length; i++) for (let j = i + 1; j < cosmetics.length; j++) {
      assert.ok(Math.max(Math.abs(cosmetics[i][0] - cosmetics[j][0]), Math.abs(cosmetics[i][1] - cosmetics[j][1])) > 1, 'safe cosmetic cells do not touch, even diagonally');
    }
    assert.equal(g.run(`placeAtLocation('${ID}',12.5*TILE,3.5*TILE)`), true, 'normal placement on eligible GRASS succeeds');
    assert.equal(g.run('isEncounterEligibleTile(activeMap[3][12])'), true); assert.equal(poolName(g), 'UPPER_REACH');

    // The reviewed successor now owns the eastward obstruction.
    g.run(`forceLegacyRegionalView=false;debugMode=true;placeAtLocation('${ID}',14.5*TILE,8.5*TILE);for(var k in keys)delete keys[k];`);
    g.hold('ArrowRight'); for (let i = 0; i < 40 && mapId(g) !== 'EAST_CAUSEWAY_MAP'; i++) g.frames(1); g.release('ArrowRight'); assert.equal(mapId(g), 'EAST_CAUSEWAY_MAP');

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
    const old = m.map((row) => row.slice()); for (const row of [6,7,8,9,10]) old[row][15] = TREE;
    assert.equal(sha256(JSON.stringify(old)), OLD_FP, 'restoring only the five authorized east-edge cells recreates the reviewed predecessor');
    assert.equal(GRID_FP.fingerprints[S_ID], S_FP); assert.equal(Object.keys(GRID_FP.fingerprints).length, 28);
    for (const [id, fp] of Object.entries(PRIOR_FPS)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), fp, `${id}: prior fingerprint unchanged`);
    }
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 24, ALIGNS: 44, BLOCKED: 40 });
    assert.equal(audit.seamReadiness.edges.length, 112);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'), 28);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.filter(function(p){return mapPlayerAccessible(p.mapId);}).length'), 21);
  },
};
