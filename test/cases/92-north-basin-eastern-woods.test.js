'use strict';
// North Basin Eastern Woods (NORTH_BASIN_E_MAP) — the inaccessible, scenery-only chunk at
// (3,1): south of the Open Reservoir East (3,0) and east of the reservoir (2,1). The TOP
// half is almost all WATER, the BOTTOM half almost all forest (TREE). Kept inaccessible by
// MATCHING its edges to its two non-walkable placed neighbours (north = NORTH_BASIN_NE.south,
// west = NORTH_BASIN_C.east); its south edge is now blocked by the playable
// NORTH_BASIN_SE_MAP while east remains blocked by NORTH_BASIN_E2_MAP.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const ID = 'NORTH_BASIN_E_MAP';
const FP = '8241adef3dc0fd37a2b85cc02d50ec8fa0446bded9ca5fc9bdfd4314f6390f9c';

module.exports = {
  name: 'North Basin Eastern Woods: scenery chunk (3,1), water-top/forest-bottom, edges matched, fail-closed',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Authored once, resolves at (3,1); neighbours are as expected ───────
    assert.equal(g.run(`NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1, 'authored once in the North Basin fragment');
    const place = J(`JSON.stringify(regionPlacementForMapId('${ID}'))`);
    assert.deepEqual([place.regionId, place.chunkX, place.chunkY], ['overworld', 3, 1], 'placed at overworld (3,1)');
    assert.equal(g.run("mapIdForChunk('overworld', 3, 0)"), 'NORTH_BASIN_NE_MAP', 'NORTH_BASIN_NE_MAP is directly north (3,0)');
    assert.equal(g.run("mapIdForChunk('overworld', 2, 1)"), 'NORTH_BASIN_C_MAP', 'the reservoir is directly west (2,1)');
    assert.equal(g.run(`mapEntryForId('${ID}').type`), 'outdoor', 'addressable as an outdoor MAP_CATALOG entry');
    assert.equal(g.run(`typeof ${ID}`), 'undefined', 'no bare const/var grid');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined', 'no window.<mapId> export');

    // ── 2. Exactly 16×15; only existing tiles; top half water, bottom half forest ─
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    assert.equal(m.length, 15, '15 rows');
    assert.ok(m.every((r) => r.length === 16), '16 cols per row');
    const WATER = g.run('WATER'), MUD = g.run('BASIN_MUD'), TREE = g.run('TREE');
    const allowed = new Set([WATER, MUD, TREE]);
    for (const r of m) for (const t of r) assert.ok(allowed.has(t), 'only WATER/BASIN_MUD/TREE used (no new terrain type): ' + t);
    // top half (rows 0-6) almost all water
    let tw = 0, tt = 0; for (let r = 0; r < 7; r++) for (let col = 0; col < 16; col++) { tt++; if (m[r][col] === WATER) tw++; }
    assert.ok(tw / tt >= 0.9, 'top half is almost all water (got ' + (100 * tw / tt).toFixed(1) + '%)');
    // bottom half (rows 7-14) almost all forest
    let bf = 0, bt = 0; for (let r = 7; r < 15; r++) for (let col = 0; col < 16; col++) { bt++; if (m[r][col] === TREE) bf++; }
    assert.ok(bf / bt >= 0.9, 'bottom half is almost all forest (got ' + (100 * bf / bt).toFixed(1) + '%)');

    // ── 3. Edges matched to the two placed neighbours (keeps it inaccessible) ──
    const c = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['NORTH_BASIN_C_MAP'].map)");
    const ne = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['NORTH_BASIN_NE_MAP'].map)");
    for (let row = 0; row < 15; row++) assert.equal(m[row][0], c[row][15], `west col0 row${row} exactly mirrors NORTH_BASIN_C east col15`);
    for (let col = 0; col < 16; col++) assert.equal(m[0][col], ne[14][col], `north row0 col${col} exactly mirrors NORTH_BASIN_NE south row14`);
    // every border cell is non-walkable (no walkable seam anywhere on the perimeter)
    for (let col = 0; col < 16; col++) { assert.equal(g.run(`isTileWalkable(${m[0][col]})`), false, `north row0 col${col} non-walkable`); assert.equal(g.run(`isTileWalkable(${m[14][col]})`), false, `south row14 col${col} non-walkable`); }
    for (let row = 0; row < 15; row++) { assert.equal(g.run(`isTileWalkable(${m[row][0]})`), false, `west col0 row${row} non-walkable`); assert.equal(g.run(`isTileWalkable(${m[row][15]})`), false, `east col15 row${row} non-walkable`); }
    // south is blocked against NORTH_BASIN_SE; east remains nonwalkable scenery
    assert.equal(m[14][8], TREE, 'south border is forest, mirrored by NORTH_BASIN_SE north');
    assert.equal(m[3][15], WATER, 'east border top is open water');
    assert.equal(m[12][15], TREE, 'east border bottom is forest');

    // ── 4. Fingerprint recorded; every prior grid unchanged ───────────────────
    assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`)), FP, 'grid matches its computed SHA-256');
    assert.equal(GRID_FP.fingerprints[ID], FP, 'the fixture records the fingerprint');
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 28, 'fixture now has 28 fingerprints');

    // ── 5. No seam/transition; all four placed-neighbour edges are BLOCKED; ───
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}']`), 'undefined', 'no EDGE_TRANSITIONS source entry');
    assert.equal(g.run(`continuousSeamEntries().filter(function(e){return e.from==='${ID}'||e.to==='${ID}';}).length`), 0, 'no eligible continuous seam touches it');
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V[`${ID}|north`], 'BLOCKED', 'north (to NORTH_BASIN_NE_MAP) is a structural BLOCKED boundary');
    assert.equal(V[`${ID}|west`], 'BLOCKED', 'west (to the reservoir NORTH_BASIN_C_MAP) is a structural BLOCKED boundary');
    assert.equal(V[`${ID}|south`], 'BLOCKED', 'south is blocked by NORTH_BASIN_SE_MAP with matching TREE edges');
    assert.equal(V[`${ID}|east`], 'BLOCKED', 'east is now BLOCKED (NORTH_BASIN_E2_MAP placed at 4,1)');
    assert.equal(V['NORTH_BASIN_NE_MAP|south'], 'BLOCKED', "NORTH_BASIN_NE_MAP's south edge is now BLOCKED (neighbour placed)");
    assert.equal(V['NORTH_BASIN_C_MAP|east'], 'BLOCKED', "the reservoir's east edge is now BLOCKED (neighbour placed)");
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 24, ALIGNS: 44, BLOCKED: 40 }, 'audit totals: 112 edges -> ALIGNS 44 / BORDER 24 / BLOCKED 40 / INTENTIONAL_DISCRETE 4');

    // ── 6. Inaccessible scenery: fail-closed against every placement path ──────
    assert.equal(g.run(`mapPlayerAccessible('${ID}')`), false, 'not player-accessible (scenery only)');
    g.run("placeAtLocation('NORTH_BASIN_C_MAP', 8*TILE, 12*TILE); player.facing='up';");
    const before = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing");
    let islet = null;
    for (let r = 0; r < 15 && !islet; r++) for (let col = 0; col < 16; col++) if (m[r][col] === MUD) { islet = [col, r]; break; }
    assert.ok(islet, 'the chunk has a walkable mud tile');
    assert.equal(g.run(`placeAtLocation('${ID}', ${islet[0]}*TILE+16, ${islet[1]}*TILE+16)`), false, 'placeAtLocation into the chunk fails');
    assert.equal(g.run(`commitRegionalWorldPosition('overworld', 3*512 + ${islet[0]}*32 + 16, 1*480 + ${islet[1]}*32 + 16)`), false, 'canonical commit into the chunk fails');
    assert.equal(g.run(`transitionToLocation({ mapId:'${ID}', x:${islet[0]}*TILE+16, y:${islet[1]}*TILE+16, facing:'down' })`), false, 'transitionToLocation into the chunk fails');
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), false, 'debug warp into the chunk fails');
    const dest = J(`JSON.stringify(debugDestinationById('outdoor:${ID}'))`);
    assert.ok(dest && dest.disabled && dest.disabledReason === 'Scenery-only; no player access', 'debug-warp lists it DISABLED with the scenery reason');
    assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing"), before, 'every rejected placement left live location/player untouched');

    // ── 7. No content / NPCs / encounters ─────────────────────────────────────
    assert.equal(g.run(`mapEntryForId('${ID}').items.length`), 0, 'no items');
    assert.equal(g.run(`mapEntryForId('${ID}').allowRandomEncounters`), false, 'random encounters disabled');
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='${ID}' || n.physicalMapId==='${ID}';}).length`), 0, 'no NPC owns the chunk');
    assert.ok(m.every((r) => r.every((t) => !g.run(`!!(TILE_PROPERTIES[${t}] && TILE_PROPERTIES[${t}].encounterEligible)`))), 'no encounter-eligible tile exists in the chunk');

    // ── 8. Continuous plan beside the (2,1)/(3,1) seam draws its terrain once ──
    const plan = J("JSON.stringify(buildContinuousWorldPlanFromWorld('overworld', 2*512 + 15*32, 1*480 + 7*32, 512, 480))");
    const hits = plan ? plan.visibleChunks.filter((v) => v.mapId === ID) : [];
    assert.equal(hits.length, 1, 'the continuous plan beside the reservoir east edge draws the Eastern Woods terrain once (not void)');
    assert.equal(hits[0].worldPxX, 3 * 16 * 32, 'drawn at its stable world origin X');
    assert.equal(hits[0].worldPxY, 1 * 15 * 32, 'drawn at its stable world origin Y');

    // ── 9. Void count now 8; region bounds unchanged; SAVE_VERSION 4 ──────────
    let placed = 0;
    for (let cy = 0; cy <= 5; cy++) for (let cx = 0; cx <= 4; cx++) if (g.run(`mapIdForChunk('overworld', ${cx}, ${cy})`)) placed++;
    assert.equal(placed, 28, '28 placed chunks in the 5x6 envelope (2 sparse voids remain)');
    const b = J("JSON.stringify(regionPixelBounds('overworld'))");
    assert.deepEqual([b.minChunkX, b.maxChunkX, b.minChunkY, b.maxChunkY], [0, 4, 0, 5], 'region chunk extent unchanged');
    assert.equal(g.run('SAVE_VERSION'), 4, 'SAVE_VERSION === 4');
  },
};
