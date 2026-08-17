'use strict';
// North Basin Open Reservoir East (NORTH_BASIN_NE_MAP) — the inaccessible, scenery-only
// water chunk at (3,0), continuing NORTH_BASIN_N_MAP (2,0) eastward. Same contract as its
// neighbour: ~90%+ open WATER with two small mud/tree islets, only existing terrain types,
// no items/NPCs/encounters, fail-closed against every player-placement path. Its WEST edge
// EXACTLY mirrors NORTH_BASIN_N_MAP's east edge; north/south/east stay open-water borders.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const ID = 'NORTH_BASIN_NE_MAP';
const FP = '97af356c23d758f6d396afb57e1fd152c4b0701dd6f66839248cf7350b6d0954';

module.exports = {
  name: 'North Basin Open Reservoir (East): scenery water chunk (3,0), west edge mirrors N_MAP, fail-closed',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Authored once, resolves at (3,0), east of NORTH_BASIN_N_MAP (2,0) ───
    assert.equal(g.run(`NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1, 'authored once in the North Basin fragment');
    const place = J(`JSON.stringify(regionPlacementForMapId('${ID}'))`);
    assert.deepEqual([place.regionId, place.chunkX, place.chunkY], ['overworld', 3, 0], 'placed at overworld (3,0)');
    assert.equal(g.run("mapIdForChunk('overworld', 3, 0)"), ID, 'mapIdForChunk(3,0) resolves it');
    assert.equal(g.run("mapIdForChunk('overworld', 2, 0)"), 'NORTH_BASIN_N_MAP', 'NORTH_BASIN_N_MAP is directly west (2,0)');
    assert.equal(g.run(`mapEntryForId('${ID}').type`), 'outdoor', 'addressable as an outdoor MAP_CATALOG entry');
    assert.equal(g.run(`typeof ${ID}`), 'undefined', 'no bare const/var grid');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined', 'no window.<mapId> export');

    // ── 2. Exactly 16×15, only existing tiles, ~90%+ water, small islets ───────
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    assert.equal(m.length, 15, '15 rows');
    assert.ok(m.every((r) => r.length === 16), '16 cols per row');
    const WATER = g.run('WATER'), MUD = g.run('BASIN_MUD'), TREE = g.run('TREE');
    const allowed = new Set([WATER, MUD, TREE]);
    let water = 0, total = 0;
    for (const r of m) for (const t of r) { total++; if (t === WATER) water++; assert.ok(allowed.has(t), 'only WATER/BASIN_MUD/TREE used (no new terrain type): ' + t); }
    assert.ok(water / total >= 0.9, 'at least 90% open water (got ' + (100 * water / total).toFixed(1) + '%)');
    assert.ok(total - water <= 24, 'only a couple of small islets break up the water');

    // ── 3. WEST edge EXACTLY mirrors NORTH_BASIN_N_MAP's east edge ────────────
    const n = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['NORTH_BASIN_N_MAP'].map)");
    for (let row = 0; row < 15; row++) assert.equal(m[row][0], n[row][15], `west col0 row${row} exactly mirrors NORTH_BASIN_N_MAP east col15`);

    // ── 4. The other three sides are open-water borders (all non-walkable) ────
    for (let col = 1; col < 16; col++) assert.equal(m[0][col], WATER, `north row0 col${col} is open water`);
    for (let col = 1; col < 16; col++) assert.equal(m[14][col], WATER, `south row14 col${col} is open water`);
    for (let row = 0; row < 14; row++) assert.equal(m[row][15], WATER, `east col15 row${row} is open water`);
    for (let col = 0; col < 16; col++) { assert.equal(g.run(`isTileWalkable(${m[0][col]})`), false, `north row0 col${col} non-walkable`); assert.equal(g.run(`isTileWalkable(${m[14][col]})`), false, `south row14 col${col} non-walkable`); }
    for (let row = 0; row < 15; row++) { assert.equal(g.run(`isTileWalkable(${m[row][0]})`), false, `west col0 row${row} non-walkable`); assert.equal(g.run(`isTileWalkable(${m[row][15]})`), false, `east col15 row${row} non-walkable`); }

    // ── 5. Fingerprint recorded; every prior grid unchanged ───────────────────
    assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`)), FP, 'grid matches its computed SHA-256');
    assert.equal(GRID_FP.fingerprints[ID], FP, 'the fixture records the fingerprint');
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 26, 'fixture now has 26 fingerprints');

    // ── 6. No seam/transition; audit: west BLOCKED, other three BORDER; the ────
    //      N_MAP east edge converts BORDER -> BLOCKED.
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}']`), 'undefined', 'no EDGE_TRANSITIONS source entry');
    assert.equal(g.run(`continuousSeamEntries().filter(function(e){return e.from==='${ID}'||e.to==='${ID}';}).length`), 0, 'no eligible continuous seam touches it');
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V[`${ID}|west`], 'BLOCKED', 'west (to NORTH_BASIN_N_MAP) is a structural BLOCKED boundary');
    assert.equal(V[`${ID}|north`], 'BORDER', 'north is an open region border (for later expansion)');
    assert.equal(V[`${ID}|south`], 'BLOCKED', 'south is now BLOCKED (NORTH_BASIN_E_MAP placed at 3,1)');
    assert.equal(V[`${ID}|east`], 'BLOCKED', 'east is now BLOCKED (NORTH_BASIN_NE2_MAP placed at 4,0)');
    assert.equal(V['NORTH_BASIN_N_MAP|east'], 'BLOCKED', "NORTH_BASIN_N_MAP's east edge is now BLOCKED (neighbour placed)");
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 24, ALIGNS: 40, BLOCKED: 36 }, 'audit totals: 104 edges -> ALIGNS 40 / BORDER 24 / BLOCKED 36 / INTENTIONAL_DISCRETE 4');

    // ── 7. Inaccessible scenery: fail-closed against every placement path ──────
    assert.equal(g.run(`mapPlayerAccessible('${ID}')`), false, 'not player-accessible (scenery only)');
    g.run("placeAtLocation('NORTH_BASIN_C_MAP', 8*TILE, 12*TILE); player.facing='up';");
    const before = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing");
    let islet = null;
    for (let r = 0; r < 15 && !islet; r++) for (let col = 0; col < 16; col++) if (m[r][col] === MUD) { islet = [col, r]; break; }
    assert.ok(islet, 'the chunk has a walkable mud islet tile');
    assert.equal(g.run(`placeAtLocation('${ID}', ${islet[0]}*TILE+16, ${islet[1]}*TILE+16)`), false, 'placeAtLocation onto the islet fails');
    assert.equal(g.run(`commitRegionalWorldPosition('overworld', 3*512 + ${islet[0]}*32 + 16, 0*480 + ${islet[1]}*32 + 16)`), false, 'canonical commit into the chunk fails');
    assert.equal(g.run(`transitionToLocation({ mapId:'${ID}', x:${islet[0]}*TILE+16, y:${islet[1]}*TILE+16, facing:'down' })`), false, 'transitionToLocation into the chunk fails');
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), false, 'debug warp into the chunk fails');
    const dest = J(`JSON.stringify(debugDestinationById('outdoor:${ID}'))`);
    assert.ok(dest && dest.disabled && dest.disabledReason === 'Scenery-only; no player access', 'debug-warp lists it DISABLED with the scenery reason');
    assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing"), before, 'every rejected placement left live location/player untouched');

    // ── 8. No content / NPCs / encounters / simulation ────────────────────────
    assert.equal(g.run(`mapEntryForId('${ID}').items.length`), 0, 'no items');
    assert.equal(g.run(`mapEntryForId('${ID}').allowRandomEncounters`), false, 'random encounters disabled');
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='${ID}' || n.physicalMapId==='${ID}';}).length`), 0, 'no NPC owns the chunk');
    assert.ok(m.every((r) => r.every((t) => !g.run(`!!(TILE_PROPERTIES[${t}] && TILE_PROPERTIES[${t}].encounterEligible)`))), 'no encounter-eligible tile exists in the chunk');

    // ── 9. Continuous plan beside the (2,0)/(3,0) seam draws its terrain once ──
    // buildContinuousWorldPlanFromWorld is a pure camera function keyed on any placed
    // point; a world point near NORTH_BASIN_N_MAP's east edge makes (3,0) a visible
    // neighbour, so its terrain is planned (not rendered as void).
    const plan = J("JSON.stringify(buildContinuousWorldPlanFromWorld('overworld', 2*512 + 15*32, 0*480 + 7*32, 512, 480))");
    const hits = plan ? plan.visibleChunks.filter((v) => v.mapId === ID) : [];
    assert.equal(hits.length, 1, 'the continuous plan beside the (2,0)/(3,0) seam draws the East reservoir terrain once (not void)');
    assert.equal(hits[0].worldPxX, 3 * 16 * 32, 'drawn at its stable world origin X');
    assert.equal(hits[0].worldPxY, 0, 'drawn at its stable world origin Y');

    // ── 10. Void count now 8; region bounds unchanged; SAVE_VERSION 4 ─────────
    let placed = 0;
    for (let cy = 0; cy <= 5; cy++) for (let cx = 0; cx <= 4; cx++) if (g.run(`mapIdForChunk('overworld', ${cx}, ${cy})`)) placed++;
    assert.equal(placed, 26, '26 placed chunks in the 5x6 envelope (4 sparse voids remain)');
    const b = J("JSON.stringify(regionPixelBounds('overworld'))");
    assert.deepEqual([b.minChunkX, b.maxChunkX, b.minChunkY, b.maxChunkY], [0, 4, 0, 5], 'region chunk extent unchanged');
    assert.equal(g.run('SAVE_VERSION'), 4, 'SAVE_VERSION === 4');
  },
};
