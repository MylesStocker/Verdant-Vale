'use strict';
// THORNMERE_NORTH_FEN_MAP — accessible Northern Thornmere Fen at overworld
// (3,4). Proves the Upper Shallows shoreline, one-component topology, broad
// north/west seams, split Thornmere shore seams, encounter geography, and
// persistence without inventing content or bypassing existing interactions.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'THORNMERE_NORTH_FEN_MAP';
const NORTH_ID = 'DRENWICK_EAST_CANAL_MAP';
const WEST_ID = 'MAP3_N1';
const SOUTH_ID = 'MAP4';
const FP = '959c67546ae56ca6a05dc3973f930495d5574c359d0cb64d714c5235f63bcae8';
const NORTH_FP = '2e74d8cd14fa6e022cba316f1d18d4409a2d5b886ed6c5e2df9392933f5ecad6';
const WEST_FP = '7a7f6def4fbae9ef32f036fb9932e1288171d90c0da68f9e5eaed186b8d5a923';
const SOUTH_FP = '4e64a4a814b1fb4c4729a651fd6b34e6dc96e03950fd322339054407a2b4dca9';
const OLD_NORTH_FP = 'eab38f6b548bbd1201900dd65914f742f3b100c5db6a56e9f13d82466e3ebc14';
const OLD_WEST_FP = '490ecb2044576d7b1410448456121762e0b9ca01954daf1216f3dc6e3922e9a1';
const OLD_SOUTH_FP = '3759195c2982151ae6636f4daf29f5cbb175d4a48ada0a276c1ab7b1520e7644';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function ctx() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}

module.exports = {
  name: 'Northern Thornmere Fen: irregular Upper Shallows shore, loop seams, Thornmere encounters',
  run() {
    const g = ctx();
    const J = (expr) => JSON.parse(g.run(expr));
    const TILE = g.run('TILE'), ROWS = g.run('ROWS'), COLS = g.run('COLS'), SPEED = g.run('SPEED');
    const GRASS = g.run('GRASS'), WATER = g.run('WATER'), TREE = g.run('TREE'), REEDS = g.run('REEDS');
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const north = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${NORTH_ID}'].map)`);
    const west = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${WEST_ID}'].map)`);
    const south = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${SOUTH_ID}'].map)`);
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

    // 1. Exact catalog metadata, dimensions, allowed terrain, and no authored
    // content/compatibility surface.
    assert.equal(g.run(`THORNMERE_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1);
    assert.deepEqual(J(`JSON.stringify(regionPlacementForMapId('${ID}'))`), { mapId: ID, regionId: 'overworld', chunkX: 3, chunkY: 4 });
    assert.equal(m.length, 15); assert.ok(m.every((row) => row.length === 16), '16×15 grid');
    const allowed = new Set([GRASS, REEDS, TREE, WATER]);
    for (const row of m) for (const tile of row) assert.ok(allowed.has(tile), `tile ${tile} belongs to approved outdoor palette`);
    const meta = J(`JSON.stringify((function(){var d=THORNMERE_REGIONAL_CHUNK_DEFINITIONS.find(function(x){return x.mapId==='${ID}';});var r=REGIONAL_CHUNK_CATALOG['${ID}'];return {mapId:r.mapId,regionId:r.regionId,chunkX:r.chunkX,chunkY:r.chunkY,displayName:r.displayName,region:r.region,contentKey:r.contentKey,presentation:r.presentation,profile:d.encounterProfileId,itemSetAuthored:Object.prototype.hasOwnProperty.call(d,'itemSetId'),playerAccessibleAuthored:Object.prototype.hasOwnProperty.call(d,'playerAccessible'),playerAccessible:r.playerAccessible,enc:r.allowRandomEncounters,save:r.allowSave};})())`);
    assert.deepEqual(meta, { mapId: ID, regionId: 'overworld', chunkX: 3, chunkY: 4, displayName: 'Northern Thornmere Fen', region: 'Thornmere', contentKey: 'thornmere_north_fen', presentation: 'continuous', profile: 'thornmere', itemSetAuthored: false, playerAccessibleAuthored: false, playerAccessible: true, enc: true, save: true });
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].encounterPool===THORNMERE_ENEMY_TEMPLATES`), true);
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].encounterPool===REGIONAL_CHUNK_CATALOG.MAP4.encounterPool&&REGIONAL_CHUNK_CATALOG['${ID}'].encounterPool===REGIONAL_CHUNK_CATALOG.MAP5.encounterPool`), true, 'exact same Thornmere pool reference');
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].items.length`), 0);
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='thornmere_north_fen'||n.physicalMapId==='${ID}';}).length`), 0);
    assert.equal(g.run(`Object.prototype.hasOwnProperty.call(MAP_FEATURES,'${ID}')`), false);
    assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`), 'undefined');
    assert.equal(g.run(`typeof ${ID}`), 'undefined');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined');
    assert.equal(g.run(`REGIONAL_POINT_CROSSINGS.some(function(c){return c.from==='${ID}'||c.to==='${ID}';})`), false);
    assert.equal(m.flat().some((tile) => tile === g.run('PATH') || tile === g.run('BRIDGE_GATE')), false);

    // 2. Reviewed terrain composition and natural, entirely blocked Upper
    // Shallows edge. Water forms a broad uneven inlet rather than a creek.
    const counts = { GRASS: 0, REEDS: 0, TREE: 0, WATER: 0 };
    for (const tile of m.flat()) {
      if (tile === GRASS) counts.GRASS++;
      else if (tile === REEDS) counts.REEDS++;
      else if (tile === TREE) counts.TREE++;
      else if (tile === WATER) counts.WATER++;
    }
    assert.deepEqual(counts, { GRASS: 90, REEDS: 68, TREE: 21, WATER: 61 });
    const edges = { north: m[0], south: m[14], west: m.map((r) => r[0]), east: m.map((r) => r[15]) };
    for (const [name, edge] of Object.entries(edges)) assert.ok(new Set(edge).size > 1, `${name} edge is irregular, not a uniform stripe`);
    assert.equal(edges.east.filter((t) => t === WATER).length, 11, 'east edge predominantly WATER');
    assert.equal(edges.east.filter((t) => t === TREE).length, 4, 'irregular TREE interruptions');
    assert.ok(edges.east.every((t) => t === WATER || t === TREE), 'east edge wholly nonwalkable');
    assert.equal(Math.min(...m.flatMap((row, y) => row.map((tile, x) => tile === WATER ? x : 99))), 4, 'shallow water reaches well west of boundary');
    assert.ok(m.some((row) => row.slice(10).filter((t) => t === WATER).length >= 5), 'broad inlet occupies multiple eastern columns');
    assert.deepEqual(edges.north, [TREE, REEDS, REEDS, GRASS, GRASS, REEDS, GRASS, REEDS, REEDS, GRASS, GRASS, REEDS, REEDS, GRASS, GRASS, TREE]);
    assert.deepEqual(edges.west, [TREE, GRASS, REEDS, GRASS, GRASS, REEDS, GRASS, REEDS, GRASS, GRASS, REEDS, GRASS, REEDS, GRASS, TREE]);
    assert.deepEqual(edges.south, [TREE, GRASS, GRASS, TREE, WATER, WATER, TREE, WATER, WATER, WATER, TREE, WATER, TREE, GRASS, GRASS, TREE]);

    // 3. Exactly one four-directional walkable component. Every walkable cell
    // is GRASS/REEDS, including the default debug-warp landing.
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
    assert.deepEqual(components.map((c) => c.length), [158], 'one connected 158-cell landmass');
    const component = new Set(components[0].map((p) => p.join(',')));
    for (let x = 1; x <= 14; x++) assert.ok(component.has(`${x},0`), `north seam col ${x} joins component`);
    for (let y = 1; y <= 13; y++) assert.ok(component.has(`0,${y}`), `west seam row ${y} joins component`);
    for (const x of [1, 2, 13, 14]) assert.ok(component.has(`${x},14`), `south shore col ${x} joins component`);
    assert.equal(m[7][8], GRASS, 'default warp cell is ordinary walkable ground');
    g.run(`placeAtLocation('${ID}',8.5*TILE,7.5*TILE);resetLocationState();`);
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].map.flat().filter(function(t){return isTileWalkable(t)&&!isEncounterEligibleTile(t);}).length`), 0, 'all walkable terrain encounter eligible');

    // 4. Exact authorized neighbour deltas, matching edges, and immutable
    // interaction/quest cells.
    assert.deepEqual(north[14], edges.north, 'north edge exactly matches edited Canal Banks south edge');
    assert.deepEqual(west.map((r) => r[15]), edges.west, 'west edge exactly matches edited Northern Fen east edge');
    assert.equal(west[4][13], g.run('FARM_HOUSE')); assert.equal(west[9][13], g.run('GUARD_POST'));
    assert.ok(west.slice(1, 14).every((row) => row[14] === GRASS), 'ordinary GRASS buffer at col 14 preserved');
    assert.equal(west[3][5], REEDS, 'Fen Sickle terrain unchanged');
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG.MAP3_N1.items.some(function(i){return i.id==='pickup_map3n1_fen_sickle'&&i.x===5.5*TILE&&i.y===3.5*TILE;})"), true);
    assert.deepEqual(south[0], [TREE, GRASS, GRASS, TREE, TREE, TREE, TREE, TREE, TREE, TREE, TREE, TREE, TREE, GRASS, GRASS, TREE]);
    assert.equal(south[6][7], GRASS); assert.equal(south[6][8], GRASS, 'Standing Stone island unchanged');
    assert.ok([[6, 7], [6, 8], [7, 7], [7, 8]].every(([y, x]) => south[y][x] === GRASS));

    // 5. Exact structural transition sets. East is absent; southern gap/corners
    // are not partially authorized.
    const expected = {
      northSouth: [{ targetMap: ID, targetEdge: 'north', sourceRange: [1, 14] }],
      southNorth: [{ targetMap: NORTH_ID, targetEdge: 'south', sourceRange: [1, 14] }],
      westEast: [{ targetMap: ID, targetEdge: 'west', sourceRange: [1, 13] }],
      eastWest: [{ targetMap: WEST_ID, targetEdge: 'east', sourceRange: [1, 13] }],
      fenSouth: [
        { targetMap: SOUTH_ID, targetEdge: 'north', sourceRange: [1, 2] },
        { targetMap: SOUTH_ID, targetEdge: 'north', sourceRange: [13, 14] },
      ],
      thornNorth: [
        { targetMap: ID, targetEdge: 'south', sourceRange: [1, 2] },
        { targetMap: ID, targetEdge: 'south', sourceRange: [13, 14] },
      ],
    };
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${NORTH_ID}'].south)`), expected.northSouth);
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${ID}'].north)`), expected.southNorth);
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${WEST_ID}'].east)`), expected.westEast);
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${ID}'].west)`), expected.eastWest);
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${ID}'].south)`), expected.fenSouth);
    assert.deepEqual(J(`JSON.stringify(EDGE_TRANSITIONS['${SOUTH_ID}'].north)`), expected.thornNorth);
    for (const set of Object.values(expected)) for (const seg of set) {
      assert.deepEqual(Object.keys(seg).sort(), ['sourceRange', 'targetEdge', 'targetMap']);
      assert.equal(J(`JSON.stringify(classifyContinuousSegment(${JSON.stringify(seg)}))`).ok, true);
    }
    assert.deepEqual(J(`JSON.stringify(eligibleContinuousSeam('${ID}','south').segments.map(function(s){return s.range;}))`), [[1, 2], [13, 14]]);
    for (let x = 3; x <= 12; x++) assert.equal(g.run(`eligibleContinuousSeam('${ID}','south',${x})`), null, `south gap col ${x} blocked`);
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}'].east`), 'undefined');

    // 6. Sustained production crossings in both directions for north, west, and
    // both south segments. Each preserves continuous motion/camera/fractional
    // coordinates/facing/step and supports immediate reversal.
    const directed = [
      [NORTH_ID, 'south', ID, 8, 'ArrowDown', 'ArrowUp'],
      [WEST_ID, 'east', ID, 7, 'ArrowRight', 'ArrowLeft'],
      [ID, 'south', SOUTH_ID, 1, 'ArrowDown', 'ArrowUp'],
      [ID, 'south', SOUTH_ID, 14, 'ArrowDown', 'ArrowUp'],
    ];
    for (const [from, dir, to, along, key, reverseKey] of directed) {
      const expectedFacing = dir === 'south' ? 'down' : dir === 'east' ? 'right' : dir;
      placeEdge(from, dir, along); g.run(`player.facing='${expectedFacing}';player.step=7;`);
      let rec = drive(key, 24, to);
      assert.equal(mapId(), to, `${from} ${dir} ${along} crosses`);
      assert.equal(rec.handoffs, 1); assert.ok(rec.maxWorldDelta <= SPEED + 1e-9, 'no double movement');
      assert.ok(rec.maxCameraDelta <= SPEED + 1e-9, 'continuous camera'); assert.equal(rec.zero, 0, 'no soft-lock frame');
      const local = dir === 'east' ? rec.firstLocalX : rec.firstLocalY;
      assert.ok(local % 1 !== 0, 'fractional position preserved'); assert.notEqual(local, 1.5 * TILE, 'no legacy inset');
      assert.equal(g.run('player.facing'), expectedFacing); assert.notEqual(g.run('player.step'), 0, 'step animation not reset by handoff');
      rec = drive(reverseKey, 24, from);
      assert.equal(mapId(), from, 'immediate reversal works'); assert.equal(rec.handoffs, 1);
      assert.equal(g.run('regionalInvariantsHold()'), true);
    }

    // Endpoint-parallel and diagonal movement for all south segment endpoints.
    for (const col of [1, 2, 13, 14]) {
      placeEdge(ID, 'south', col);
      const beforeX = worldPos().worldPxX;
      const parallel = col === 1 || col === 13 ? 'ArrowRight' : 'ArrowLeft';
      drive(parallel, 2); assert.notEqual(worldPos().worldPxX, beforeX, `parallel movement at south endpoint ${col}`);
      placeEdge(ID, 'south', col); clearKeys(); g.hold('ArrowDown'); g.hold(parallel);
      let prev = worldPos(), prevMap = mapId(), handoffs = 0, maxDelta = 0;
      for (let i = 0; i < 16; i++) {
        g.frames(1); const cur = worldPos(), mid = mapId();
        maxDelta = Math.max(maxDelta, Math.hypot(cur.worldPxX - prev.worldPxX, cur.worldPxY - prev.worldPxY));
        if (mid !== prevMap) handoffs++; prev = cur; prevMap = mid;
      }
      g.release('ArrowDown'); g.release(parallel); clearKeys();
      assert.equal(mapId(), SOUTH_ID, `diagonal crosses south endpoint ${col}`);
      assert.equal(handoffs, 1); assert.ok(maxDelta <= SPEED * Math.SQRT2 + 1e-9, 'X-then-Y applies movement once');
    }

    // South gap, east edge, and all east corners remain ordinary collision.
    for (const col of [0, 3, 8, 12, 15]) {
      placeEdge(ID, 'south', col); const before = worldPos(); const rec = drive('ArrowDown', 30);
      assert.equal(mapId(), ID); assert.deepEqual(worldPos(), before, `blocked south col ${col}`); assert.equal(rec.handoffs, 0);
    }
    for (const row of [0, 1, 4, 7, 11, 13, 14]) {
      placeEdge(ID, 'east', row); const before = worldPos(); drive('ArrowRight', 30);
      assert.equal(mapId(), ID); assert.deepEqual(worldPos(), before, `Upper Shallows edge row ${row} blocks scenery entry`);
    }
    for (const [row, vertical] of [[0, 'ArrowDown'], [14, 'ArrowUp']]) {
      placeEdge(ID, 'east', row); clearKeys(); g.hold('ArrowRight'); g.hold(vertical); g.frames(20); g.release('ArrowRight'); g.release(vertical); clearKeys();
      assert.equal(mapId(), ID, `east corner diagonal row ${row} cannot enter inaccessible scenery`);
    }
    assert.equal(g.run("mapIdForChunk('overworld',4,4)"), 'THORNMERE_UPPER_SHALLOWS_MAP');

    // 7. Geographic ownership changes from FAR on north/west neighbours to the
    // exact Thornmere pool here, then stays Thornmere across either MAP4 shore.
    for (const from of [NORTH_ID, WEST_ID]) {
      g.run(`placeAtLocation('${from}',8.5*TILE,7.5*TILE);resetLocationState();`);
      assert.equal(g.run('currentEncounterPool()===FAR_ENEMY_TEMPLATES'), true, `${from} owns FAR`);
    }
    g.run(`placeAtLocation('${ID}',8.5*TILE,7.5*TILE);resetLocationState();`);
    assert.equal(g.run('currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES'), true);
    assert.equal(g.run(`geographicEncounterContext('overworld',3*COLS*TILE+8.5*TILE,4*ROWS*TILE+7.5*TILE).encounterPool===THORNMERE_ENEMY_TEMPLATES`), true);
    g.run(`placeAtLocation('${SOUTH_ID}',1.5*TILE,1.5*TILE);resetLocationState();`);
    assert.equal(g.run('currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES'), true, 'MAP4 retains same ownership');
    const noRoll = J(`(function(){debugMode=false;combat.active=false;placeAtLocation('${NORTH_ID}',8.5*TILE,14.7*TILE);forceLegacyRegionalView=false;var calls=0,_r=Math.random;Math.random=function(){calls++;return 0;};var before=mapIdForRef(activeMap);for(var i=0;i<12&&mapIdForRef(activeMap)===before;i++)continuousSeamMove(0,2);Math.random=_r;return JSON.stringify({calls:calls,map:mapIdForRef(activeMap),combat:combat.active,pool:currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES});})()`);
    assert.deepEqual(noRoll, { calls: 0, map: ID, combat: false, pool: true }, 'crossing consumes no encounter roll');

    // 8. Normal/canonical placement, exact default warp, v4 save/load, and
    // Legacy Regional Fallback for all four physical seam choices.
    let warp = J(`JSON.stringify(debugWarpToDestination('outdoor:${ID}'))`);
    assert.deepEqual([warp.success, warp.col, warp.row], [true, 8, 7]); assert.equal(mapId(), ID);
    assert.equal(g.run(`placeAtLocation('${ID}',8.25*TILE,7.5*TILE)`), true);
    assert.equal(g.run(`commitRegionalWorldPosition('overworld',3*COLS*TILE+8.25*TILE,4*ROWS*TILE+7.5*TILE)`), true);
    g.run("player.facing='left';saveGame();"); const saved = J("localStorage.getItem('verdantVale_save')");
    assert.equal(saved.version, 4); assert.equal(saved.location.kind, 'regional'); const savedPos = worldPos();
    g.run("placeAtLocation('MAP2',2.5*TILE,2.5*TILE);player.facing='down';");
    assert.equal(g.run('loadGame()'), true); assert.equal(mapId(), ID); assert.deepEqual(worldPos(), savedPos); assert.equal(g.run('player.facing'), 'left'); assert.equal(g.run('canSaveHere()'), true);
    const legacy = [
      [NORTH_ID, 'south', ID, 8, 'north'],
      [WEST_ID, 'east', ID, 7, 'west'],
      [ID, 'south', SOUTH_ID, 1, 'north'],
      [ID, 'south', SOUTH_ID, 14, 'north'],
    ];
    for (const [from, dir, to, along, targetEdge] of legacy) {
      placeEdge(from, dir, along); g.run('forceLegacyRegionalView=true;combat.cooldown=0;');
      assert.equal(g.run(`tryEdgeTransition('${dir}')`), true); assert.equal(mapId(), to);
      if (targetEdge === 'north') assert.equal(g.run('player.y'), 1.5 * TILE); else assert.equal(g.run('player.x'), 1.5 * TILE);
      assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
      const reverse = dir === 'south' ? 'north' : 'west';
      if (reverse === 'north') g.run(`combat.cooldown=0;placeAtLocation('${to}',${along + 0.5}*TILE,0.5*TILE);`);
      else g.run(`combat.cooldown=0;placeAtLocation('${to}',0.5*TILE,${along + 0.5}*TILE);`);
      assert.equal(g.run(`tryEdgeTransition('${reverse}')`), true); assert.equal(mapId(), from);
    }
    assert.equal(g.run('SAVE_VERSION'), 4);

    // 9. Exactly three existing fingerprints change plus the new grid. Reverting
    // only the authorized cells recreates every reviewed predecessor exactly.
    assert.equal(sha256(JSON.stringify(m)), FP); assert.equal(GRID_FP.fingerprints[ID], FP);
    assert.equal(sha256(JSON.stringify(north)), NORTH_FP); assert.equal(GRID_FP.fingerprints[NORTH_ID], NORTH_FP);
    assert.equal(sha256(JSON.stringify(west)), WEST_FP); assert.equal(GRID_FP.fingerprints[WEST_ID], WEST_FP);
    assert.equal(sha256(JSON.stringify(south)), SOUTH_FP); assert.equal(GRID_FP.fingerprints[SOUTH_ID], SOUTH_FP);
    const oldNorth = north.map((row) => row.slice());
    for (let r = 0; r < 15; r++) oldNorth[r][15] = r === 5 ? WATER : TREE;
    for (let c = 1; c <= 14; c++) oldNorth[14][c] = TREE;
    assert.equal(sha256(JSON.stringify(oldNorth)), OLD_NORTH_FP);
    const oldWest = west.map((row) => row.slice()); for (let r = 1; r <= 13; r++) oldWest[r][15] = TREE;
    assert.equal(sha256(JSON.stringify(oldWest)), OLD_WEST_FP);
    const oldSouth = south.map((row) => row.slice()); for (const c of [1, 2, 13, 14]) oldSouth[0][c] = TREE;
    assert.equal(sha256(JSON.stringify(oldSouth)), OLD_SOUTH_FP);
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 27);
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), fp, `${id}: fingerprint matches`);
    }

    // Existing canal/quest/interaction topology remains authoritative.
    const canal = north[5]; assert.ok(canal.every((tile) => tile === WATER), 'canal still unbroken');
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${NORTH_ID}'].map.slice(0,5).flat().some(isTileWalkable)&&REGIONAL_CHUNK_CATALOG['${NORTH_ID}'].map.slice(6).flat().some(isTileWalkable)`), true);
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${NORTH_ID}'].map[5].every(function(t){return !isTileWalkable(t);})`), true, 'canal banks still disconnected');
    assert.equal(g.run(`EDGE_TRANSITIONS['${NORTH_ID}'].south[0].sourceRange[0]`), 1, 'new north seam belongs to south bank edge only');
    assert.equal(g.run('THORNMERE_STONE.x'), 7.5 * TILE); assert.equal(g.run('THORNMERE_STONE.y'), 6.5 * TILE);
    assert.equal(g.run('typeof enterSmugglerFort'), 'function'); assert.equal(g.run('typeof enterFenBrewery'), 'function');

    const audit = require('../transition-audit.js');
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 22, ALIGNS: 42, BLOCKED: 40 });
    assert.equal(audit.seamReadiness.edges.length, 108);
    assert.equal(g.run('continuousSeamEntries().length'), 56); assert.equal(g.run('continuousSeamEntries().length/2'), 28);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'), 27);
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.filter(function(p){return mapPlayerAccessible(p.mapId);}).length'), 20);
  },
};
