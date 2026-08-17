'use strict';
// Drenwick West Outfall (DRENWICK_WEST_OUTFALL_MAP) — the inaccessible, scenery-only
// regional chunk that fills the sparse void at (1,3). It renders as neighbour terrain
// + a static culvert decoration but is FAIL-CLOSED against every player-placement
// path (movement has no seam, and validatePlacement/commitRegionalWorldPosition reject
// it via the shared `playerAccessible` capability). Covers the full task contract.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const ID = 'DRENWICK_WEST_OUTFALL_MAP';
const OUTFALL_FP = '0c133a70a426ca8015a3a5204815063a5ef65bf073d3ad40d2b093de0ba813df';
// The 15 ORIGINAL placed grids (their fingerprints must not change).
const ORIGINAL_15 = ['MAP', 'MAP2', 'MAP3', 'MAP4', 'MAP5', 'MAP_N1', 'MAP_N2', 'RODDON_WAY_MAP',
  'MAP3_N1', 'MAP3_N2', 'NORTH_BASIN_S_MAP', 'NORTH_BASIN_C_MAP', 'NORTH_BASIN_SW_MAP',
  'NORTH_BASIN_W_MAP', 'NORTH_BASIN_NW_MAP'];

module.exports = {
  name: 'Drenwick West Outfall: inaccessible scenery chunk (1,3), fail-closed placement, neighbour render',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Authored exactly once in DRENWICK_REGIONAL_CHUNK_DEFINITIONS ────────
    assert.equal(g.run(`DRENWICK_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1,
      'authored once in DRENWICK_REGIONAL_CHUNK_DEFINITIONS');
    assert.equal(g.run(`_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1,
      'appears once in the merged definition list');

    // ── 2. No standalone grid variable, compat alias, or window export ────────
    assert.equal(g.run(`typeof ${ID}`), 'undefined', 'no bare const/var grid named after the map');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined', 'no window.<mapId> export');

    // ── 3. Resolves at region (1,3) ───────────────────────────────────────────
    const place = J(`JSON.stringify(regionPlacementForMapId('${ID}'))`);
    assert.deepEqual([place.regionId, place.chunkX, place.chunkY], ['overworld', 1, 3], 'placed at overworld (1,3)');
    assert.equal(g.run("mapIdForChunk('overworld', 1, 3)"), ID, 'mapIdForChunk(1,3) resolves the outfall');
    assert.equal(g.run(`mapEntryForId('${ID}').type`), 'outdoor', 'addressable as an outdoor MAP_CATALOG entry');
    assert.equal(g.run(`worldToLocal('overworld', 1*16+8, 3*15+7).mapId`), ID, 'worldToLocal resolves into the outfall');

    // ── 4. Exactly 16×15, all valid existing tile ids ─────────────────────────
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].map.length`), 15, '15 rows');
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].map.every(function(r){return r.length===16;})`), true, '16 cols per row');
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].map.every(function(r){return r.every(function(t){return WALKABLE[t]!==undefined;});})`), true, 'every tile id is a known existing tile');
    // No NEW tile id was added for this chunk (only pre-existing outdoor tiles used).
    const used = new Set(J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map.reduce(function(a,r){return a.concat(r);},[]))`));
    for (const t of used) assert.ok(t <= 116, 'uses only pre-existing tile ids (no new tile id for this chunk): ' + t);

    // ── 5 + 6. Fingerprint in fixture; all 15 originals still present/unchanged ─
    assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`)), OUTFALL_FP, 'grid matches its computed SHA-256');
    assert.equal(GRID_FP.fingerprints[ID], OUTFALL_FP, 'the fixture records the outfall fingerprint');
    for (const id of ORIGINAL_15) {
      assert.ok(GRID_FP.fingerprints[id], id + ': original fingerprint still present in the fixture');
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), GRID_FP.fingerprints[id], id + ': original grid unchanged');
    }
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 21, 'fixture now has 21 fingerprints');

    // ── 7 + 8. Border contract: agrees with all four neighbours, all non-walkable ─
    const outfall = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const mapOf = (id) => J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
    const nb = mapOf('MAP3_N2'), sw = mapOf('NORTH_BASIN_SW_MAP'), rd = mapOf('RODDON_WAY_MAP'), n2 = mapOf('MAP_N2');
    const WATER = g.run('WATER');
    for (let r = 0; r < 15; r++) {
      // East col 15 matches MAP3_N2 west col 0 (WATER at row 5, TREE elsewhere)
      assert.equal(outfall[r][15], nb[r][0], `east col15 row${r} matches MAP3_N2 west edge`);
      // West col 0 matches MAP_N2 east col 15
      assert.equal(outfall[r][0], n2[r][15], `west col0 row${r} matches MAP_N2 east edge`);
      // no walkable cell on either vertical border
      assert.equal(g.run(`isTileWalkable(${outfall[r][0]})`), false, `west col0 row${r} non-walkable`);
      assert.equal(g.run(`isTileWalkable(${outfall[r][15]})`), false, `east col15 row${r} non-walkable`);
    }
    for (let c = 0; c < 16; c++) {
      assert.equal(outfall[0][c], sw[14][c], `north row0 col${c} matches NORTH_BASIN_SW south edge`);
      assert.equal(outfall[14][c], rd[0][c], `south row14 col${c} matches RODDON_WAY north edge`);
      assert.equal(g.run(`isTileWalkable(${outfall[0][c]})`), false, `north row0 col${c} non-walkable`);
      assert.equal(g.run(`isTileWalkable(${outfall[14][c]})`), false, `south row14 col${c} non-walkable`);
    }
    assert.equal(outfall[5][15], WATER, 'east row5 is the canal (WATER), aligning with MAP3_N2 row5 col0');
    assert.equal(nb[5][0], WATER, 'MAP3_N2 west edge row5 is WATER (the canal)');

    // ── 9. No seam or point transition enters/leaves it ───────────────────────
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}']`), 'undefined', 'no EDGE_TRANSITIONS source entry');
    assert.equal(g.run(`Object.keys(EDGE_TRANSITIONS).some(function(src){var d=EDGE_TRANSITIONS[src];return ['north','south','east','west'].some(function(dir){return Array.isArray(d[dir])&&d[dir].some(function(s){var t=(typeof s.targetMap==='string')?s.targetMap:mapIdForRef(s.targetMap);return t==='${ID}';});});})`), false, 'no EDGE_TRANSITIONS anywhere targets it');
    assert.equal(g.run(`continuousSeamEntries().filter(function(e){return e.from==='${ID}'||e.to==='${ID}';}).length`), 0, 'no eligible continuous seam touches it');

    // ── 10. All eight directed neighbour boundaries classify BLOCKED ──────────
    const audit = require('../transition-audit.js');
    const edgeV = {};
    for (const e of audit.seamReadiness.edges) edgeV[e.mapId + '|' + e.dir] = e.verdict;
    for (const k of [`${ID}|north`, `${ID}|south`, `${ID}|east`, `${ID}|west`,
                     'NORTH_BASIN_SW_MAP|south', 'RODDON_WAY_MAP|north', 'MAP3_N2|west', 'MAP_N2|east']) {
      assert.equal(edgeV[k], 'BLOCKED', k + ' is a structural BLOCKED boundary');
    }

    // ── 11. Audit totals match the verified new layout ────────────────────────
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 26, ALIGNS: 26, BLOCKED: 28 },
      'audit totals: 84 edges -> ALIGNS 26 / BORDER 26 / BLOCKED 28 / INTENTIONAL_DISCRETE 4');
    assert.equal(audit.seamReadiness.edges.length, 84, '84 directed placed-map edges (21 x 4)');
    assert.ok(!audit.seamReadiness.totals.CONFLICT && !audit.seamReadiness.totals.OUTSIDE_REGION && !audit.seamReadiness.totals.NEEDS_REMAP,
      'no CONFLICT / OUTSIDE_REGION / NEEDS_REMAP');

    // ── 12. Void count is 14; region pixel bounds unchanged ───────────────────
    let placed = 0, voids = 0;
    for (let cy = 0; cy <= 5; cy++) for (let cx = 0; cx <= 4; cx++) {
      if (g.run(`mapIdForChunk('overworld', ${cx}, ${cy})`)) placed++; else voids++;
    }
    assert.equal(placed, 21, '21 placed chunks in the 5x6 envelope');
    assert.equal(voids, 9, '9 remaining sparse void cells');
    const b = J("JSON.stringify(regionPixelBounds('overworld'))");
    assert.deepEqual([b.minChunkX, b.maxChunkX, b.minChunkY, b.maxChunkY], [0, 4, 0, 5], 'region chunk extent unchanged (0..4 x 0..5)');
    assert.equal(b.widthPx, 5 * 16 * 32, 'region pixel width unchanged (5 chunks)');
    assert.equal(b.heightPx, 6 * 15 * 32, 'region pixel height unchanged (6 chunks)');

    // ── 13. Continuous cameras from all four neighbours plan the outfall terrain ─
    g.run('forceLegacyRegionalView = false;');
    const planShows = (neighbour, lx, ly) => {
      g.run(`placeAtLocation('${neighbour}', ${lx}, ${ly});`);
      const canon = J('JSON.stringify(regionalWorldPosition())');
      const plan = J(`JSON.stringify(buildContinuousWorldPlanFromWorld('overworld', ${canon.worldPxX}, ${canon.worldPxY}, 512, 480))`);
      return plan.visibleChunks.filter((c) => c.mapId === ID);
    };
    for (const [nbId, lx, ly] of [
      ['MAP3_N2', '0.5*TILE', '5.5*TILE'],
      ['RODDON_WAY_MAP', '8*TILE', '0.5*TILE'],
      ['MAP_N2', '15.5*TILE', '5.5*TILE'],
      ['NORTH_BASIN_SW_MAP', '8*TILE', '13.5*TILE'],
    ]) {
      const hits = planShows(nbId, lx, ly);
      assert.equal(hits.length, 1, `${nbId} camera plans the outfall terrain exactly once (not void)`);
      assert.equal(hits[0].worldPxX, 1 * 16 * 32, `${nbId}: outfall drawn at its stable world origin X`);
      assert.equal(hits[0].worldPxY, 3 * 15 * 32, `${nbId}: outfall drawn at its stable world origin Y`);
    }

    // ── 14. Terrain + culvert decoration draw exactly once, at stable coords ───
    assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`), 'function', 'a static decoration is registered');
    g.run("placeAtLocation('MAP3_N2', 0.5*TILE, 5.5*TILE); forceLegacyRegionalView = false;");
    g.run('var __culvertCalls = 0; var __origCulvert = drawWestOutfallCulvertBody; drawWestOutfallCulvertBody = function(){ __culvertCalls++; return __origCulvert.apply(this, arguments); };');
    g.renderFrame();
    assert.equal(g.run('__culvertCalls'), 1, 'culvert decoration drawn exactly once per frame (as a neighbour)');
    g.run('drawWestOutfallCulvertBody = __origCulvert;');

    // ── 15 + 16. No content, NPC, item, or encounter ownership ────────────────
    assert.equal(g.run(`mapEntryForId('${ID}').items.length`), 0, 'no item set');
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='${ID}' || n.physicalMapId==='${ID}';}).length`), 0, 'no NPC owns the outfall');
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return (typeof physicalMapIdForNpc==='function') && physicalMapIdForNpc(n)==='${ID}';}).length`), 0, 'no NPC physically resolves to the outfall');
    assert.equal(g.run(`mapEntryForId('${ID}').allowRandomEncounters`), false, 'random encounters disabled');
    assert.equal(g.run(`OUTDOOR_CONTENT_KEYS['${ID}']`), 'drenwick_west_outfall', 'unique logical contentKey (owns no content yet)');
    // Its content key is owned by exactly one map (unambiguous) and by no NPC.
    assert.equal(g.run(`Object.keys(OUTDOOR_CONTENT_KEYS).filter(function(k){return OUTDOOR_CONTENT_KEYS[k]==='drenwick_west_outfall';}).length`), 1, 'contentKey is unique to the outfall');

    // ── 17. Debug-warp catalog lists it DISABLED with the correct reason ──────
    const dest = J(`JSON.stringify(debugDestinationById('outdoor:${ID}'))`);
    assert.ok(dest, 'the outfall is a listed debug-warp destination (visible)');
    assert.equal(dest.disabled, true, 'the destination is disabled');
    assert.equal(dest.disabledReason, 'Scenery-only; no player access', 'the disabled reason is exact');

    // ── 18. Every direct placement path rejects atomically ───────────────────
    // Set up a known-good live + stored state on an accessible map first.
    g.run("placeAtLocation('MAP3_N2', 8*TILE, 7*TILE); player.facing='down'; saveGame();");
    const beforeLive = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing");
    const outWX = 1 * 16 * 32 + 8 * 32 + 16, outWY = 3 * 15 * 32 + 8 * 32 + 16; // interior walkable mud tile (8,8)
    assert.equal(g.run(`isTileWalkable(REGIONAL_CHUNK_CATALOG['${ID}'].map[8][8])`), true, 'the targeted interior tile IS walkable (so only the capability rejects, not blocked terrain)');
    // (a) placeAtLocation / canonical commit
    assert.equal(g.run(`placeAtLocation('${ID}', 8*TILE, 8*TILE)`), false, 'placeAtLocation into the outfall fails');
    assert.equal(g.run(`commitRegionalWorldPosition('overworld', ${outWX}, ${outWY})`), false, 'commitRegionalWorldPosition into the outfall fails');
    // (b) transitionToLocation
    assert.equal(g.run(`transitionToLocation({ mapId:'${ID}', x:8*TILE, y:8*TILE, facing:'down' })`), false, 'transitionToLocation into the outfall fails');
    // (c) debug warp API
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), false, 'debugWarpToDestination into the outfall fails');
    // (d) validatePlacement is the shared authority that reports it
    assert.equal(g.run(`validatePlacement({ mapId:'${ID}', x:8*TILE, y:8*TILE }).ok`), false, 'validatePlacement rejects the outfall');
    assert.ok(/scenery-only/.test(g.run(`validatePlacement({ mapId:'${ID}', x:8*TILE, y:8*TILE }).errors.join(';')`)), 'rejection reason is scenery-only');
    // (e) hand-edited v4 save targeting the outfall world point
    const goodSave = g.run("localStorage.getItem('verdantVale_save')");
    g.run(`(function(){ var s=JSON.parse(localStorage.getItem('verdantVale_save')); s.location={kind:'regional',regionId:'overworld',worldPxX:${outWX},worldPxY:${outWY}}; localStorage.setItem('verdantVale_save', JSON.stringify(s)); })()`);
    const badSave = g.run("localStorage.getItem('verdantVale_save')");
    assert.equal(g.run('loadGame()'), false, 'loading a save that targets the outfall is rejected');
    // no mutation of live location / player, and the stored save is untouched
    assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing"), beforeLive, 'rejected load left live location/player/facing untouched');
    assert.equal(g.run("localStorage.getItem('verdantVale_save')"), badSave, 'rejected load did not overwrite/delete the stored save');
    assert.notEqual(badSave, goodSave, '(sanity) the stored save really was the hand-edited one');

    // ── 19. Existing accessible chunks still accept placement / warp / save ────
    assert.equal(g.run("placeAtLocation('MAP3_N2', 8*TILE, 7*TILE)"), true, 'accessible MAP3_N2 still accepts placement');
    assert.equal(g.run("validatePlacement({ mapId:'MAP3_N2', x:8*TILE, y:7*TILE }).ok"), true, 'accessible MAP3_N2 still validates');
    assert.equal(g.run("debugWarpToDestination('outdoor:MAP3_N2').success"), true, 'accessible MAP3_N2 still warps');
    assert.equal(g.run("(placeAtLocation('MAP3_N2', 8*TILE, 7*TILE), saveGame())"), true, 'accessible MAP3_N2 still saves');

    // ── 20. A true remaining sparse coordinate still returns void ─────────────
    assert.equal(g.run("mapIdForChunk('overworld', 4, 2)"), null, '(4,2) is still a genuine void');
    assert.equal(g.run("tileAtWorld('overworld', 4*16+8, 2*15+7)"), g.run('REGION_VOID_TILE'), '(4,2) reads as REGION_VOID_TILE');
    assert.equal(g.run("worldToLocal('overworld', 4*16+8, 2*15+7)"), null, '(4,2) worldToLocal is null (void)');

    // ── 21. Catalog read / render / validation mutate no gameplay state ────────
    g.run("placeAtLocation('MAP3_N2', 8*TILE, 7*TILE); player.facing='down';");
    const snap = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing+'|'+inTown+'|'+inDungeon");
    g.run(`void REGIONAL_CHUNK_CATALOG['${ID}'].map; mapPlayerAccessible('${ID}'); mapEntryForId('${ID}'); validateGameData();`);
    g.renderFrame();
    assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing+'|'+inTown+'|'+inDungeon"), snap, 'catalog read + validation + render mutate no gameplay state');

    // ── 22. SAVE_VERSION unchanged; payload schema unchanged ──────────────────
    assert.equal(g.run('SAVE_VERSION'), 4, 'SAVE_VERSION === 4');
    g.run("placeAtLocation('MAP3_N2', 8*TILE, 7*TILE); saveGame();");
    const payload = J("localStorage.getItem('verdantVale_save')");
    assert.equal(payload.version, 4, 'save payload version is 4');
    assert.equal(payload.location.kind, 'regional', 'a regional save is still a discriminated regional location');
    assert.ok('worldPxX' in payload.location && 'worldPxY' in payload.location && 'regionId' in payload.location, 'regional location schema unchanged');
  },
};
