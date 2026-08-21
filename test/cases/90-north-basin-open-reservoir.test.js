'use strict';
// North Basin Open Reservoir (NORTH_BASIN_N_MAP) — the inaccessible, scenery-only
// water chunk that fills the void at (2,0), directly NORTH of the reservoir
// (NORTH_BASIN_C_MAP, 2,1). ~90%+ open WATER with two small mud/tree islets, only
// existing terrain types, no items/NPCs/encounters, fail-closed against every
// player-placement path (all-water borders, no seam, playerAccessible:false).

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const ID = 'NORTH_BASIN_N_MAP';
const FP = 'e59e5fa33fbc7e6388e707d1ef4a96282c446c6aead0f2cc24e935426e960bc7';

module.exports = {
  name: 'North Basin Open Reservoir: inaccessible scenery water chunk (2,0), fail-closed, neighbour render',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Authored once, resolves at region (2,0) as an outdoor map ───────────
    assert.equal(g.run(`NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1, 'authored once in the North Basin fragment');
    const place = J(`JSON.stringify(regionPlacementForMapId('${ID}'))`);
    assert.deepEqual([place.regionId, place.chunkX, place.chunkY], ['overworld', 2, 0], 'placed at overworld (2,0), north of the reservoir (2,1)');
    assert.equal(g.run("mapIdForChunk('overworld', 2, 0)"), ID, 'mapIdForChunk(2,0) resolves the reservoir');
    assert.equal(g.run("mapIdForChunk('overworld', 2, 1)"), 'NORTH_BASIN_C_MAP', 'the reservoir (NORTH_BASIN_C_MAP) is directly south');
    assert.equal(g.run(`mapEntryForId('${ID}').type`), 'outdoor', 'addressable as an outdoor MAP_CATALOG entry');

    // ── 2. No standalone var / compat alias / window export ───────────────────
    assert.equal(g.run(`typeof ${ID}`), 'undefined', 'no bare const/var grid');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined', 'no window.<mapId> export');

    // ── 3. Exactly 16×15, only existing tiles, ~90%+ water, no new terrain ─────
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    assert.equal(m.length, 15, '15 rows');
    assert.ok(m.every((r) => r.length === 16), '16 cols per row');
    const WATER = g.run('WATER'), MUD = g.run('BASIN_MUD'), TREE = g.run('TREE');
    const allowed = new Set([WATER, MUD, TREE]);
    let water = 0, total = 0;
    for (const r of m) for (const t of r) { total++; if (t === WATER) water++; assert.ok(allowed.has(t), 'only WATER/BASIN_MUD/TREE used (no new terrain type): ' + t); }
    assert.ok(water / total >= 0.9, 'at least 90% of the chunk is open water (got ' + (100 * water / total).toFixed(1) + '%)');
    assert.ok(total - water <= 24, 'only a couple of small islets break up the water');

    // ── 4. Fingerprint recorded; every original grid still unchanged ──────────
    assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`)), FP, 'grid matches its computed SHA-256');
    assert.equal(GRID_FP.fingerprints[ID], FP, 'the fixture records the reservoir fingerprint');
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 30, 'fixture now has 30 fingerprints');

    // ── 5. Border continuity: south mirrors the reservoir's north edge; the ────
    //      west/north/east edges are open water. All border cells non-walkable.
    const c = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['NORTH_BASIN_C_MAP'].map)");
    for (let col = 0; col < 16; col++) assert.equal(m[14][col], c[0][col], `south row14 col${col} mirrors NORTH_BASIN_C north edge`);
    for (let col = 0; col < 16; col++) { assert.equal(g.run(`isTileWalkable(${m[0][col]})`), false, `north row0 col${col} non-walkable`); assert.equal(g.run(`isTileWalkable(${m[14][col]})`), false, `south row14 col${col} non-walkable`); }
    for (let row = 0; row < 15; row++) { assert.equal(g.run(`isTileWalkable(${m[row][0]})`), false, `west col0 row${row} non-walkable`); assert.equal(g.run(`isTileWalkable(${m[row][15]})`), false, `east col15 row${row} non-walkable`); }

    // ── 6. No seam / transition; audit classifies its boundaries structurally ─
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}']`), 'undefined', 'no EDGE_TRANSITIONS source entry');
    assert.equal(g.run(`continuousSeamEntries().filter(function(e){return e.from==='${ID}'||e.to==='${ID}';}).length`), 0, 'no eligible continuous seam touches it');
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V[`${ID}|south`], 'BLOCKED', 'south (to the reservoir) is a structural BLOCKED boundary');
    assert.equal(V[`${ID}|west`], 'BLOCKED', 'west (to the Upper Reach) is a structural BLOCKED boundary');
    assert.equal(V[`${ID}|east`], 'BLOCKED', 'east is now BLOCKED (NORTH_BASIN_NE_MAP placed at 3,0)');
    assert.equal(V[`${ID}|north`], 'BORDER', 'north is the region edge');
    assert.equal(V['NORTH_BASIN_C_MAP|north'], 'BLOCKED', "the reservoir's north edge is now BLOCKED (was BORDER)");
    assert.equal(V['NORTH_BASIN_NW_MAP|east'], 'BLOCKED', "the Upper Reach's east edge is now BLOCKED (was BORDER)");
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 22, ALIGNS: 48, BLOCKED: 46 }, 'audit totals: 120 edges -> ALIGNS 48 / BORDER 22 / BLOCKED 46 / INTENTIONAL_DISCRETE 4');

    // ── 7. Inaccessible scenery: fail-closed against every placement path ──────
    assert.equal(g.run(`mapPlayerAccessible('${ID}')`), false, 'not player-accessible (scenery only)');
    g.run("placeAtLocation('NORTH_BASIN_C_MAP', 8*TILE, 12*TILE); player.facing='up';");
    const before = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing");
    // pick a walkable islet tile so ONLY the capability (not blocked terrain) rejects
    let islet = null;
    for (let r = 0; r < 15 && !islet; r++) for (let col = 0; col < 16; col++) if (m[r][col] === MUD) { islet = [col, r]; break; }
    assert.ok(islet, 'the chunk has a walkable mud islet tile');
    assert.equal(g.run(`isTileWalkable(${MUD})`), true, 'BASIN_MUD is walkable (so only the scenery capability blocks entry)');
    assert.equal(g.run(`placeAtLocation('${ID}', ${islet[0]}*TILE+16, ${islet[1]}*TILE+16)`), false, 'placeAtLocation onto the reservoir islet fails');
    assert.equal(g.run(`commitRegionalWorldPosition('overworld', 2*512 + ${islet[0]}*32 + 16, 0*480 + ${islet[1]}*32 + 16)`), false, 'canonical commit into the reservoir fails');
    assert.equal(g.run(`transitionToLocation({ mapId:'${ID}', x:${islet[0]}*TILE+16, y:${islet[1]}*TILE+16, facing:'down' })`), false, 'transitionToLocation into the reservoir fails');
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), false, 'debug warp into the reservoir fails');
    const dest = J(`JSON.stringify(debugDestinationById('outdoor:${ID}'))`);
    assert.ok(dest && dest.disabled && dest.disabledReason === 'Scenery-only; no player access', 'debug-warp lists it DISABLED with the scenery reason');
    assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing"), before, 'every rejected placement left live location/player untouched');

    // ── 8. No content, NPCs, encounters, or NPC simulation ────────────────────
    assert.equal(g.run(`mapEntryForId('${ID}').items.length`), 0, 'no items');
    assert.equal(g.run(`mapEntryForId('${ID}').allowRandomEncounters`), false, 'random encounters disabled');
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='${ID}' || n.physicalMapId==='${ID}';}).length`), 0, 'no NPC owns the reservoir');
    assert.equal(g.run('isTileEncounterEligible(BASIN_MUD)'), true, 'mud islets retain ordinary terrain eligibility');
    assert.equal(g.run(`mapPlayerAccessible('${ID}')`), false, 'scenery capability, not mud safety, prevents encounter use');
    // From the reservoir (2,1) the nearby simulation set excludes the scenery chunk.
    g.run("placeAtLocation('NORTH_BASIN_C_MAP', 8*TILE, 8*TILE); forceLegacyRegionalView=false;");
    assert.equal(g.run(`nearbySimulationMapSet().has('${ID}')`), false, 'the scenery reservoir is excluded from NPC simulation');

    // ── 9. Continuous cameras from the two placed neighbours plan its terrain ──
    const planShows = (nb, lx, ly) => {
      g.run(`placeAtLocation('${nb}', ${lx}, ${ly}); forceLegacyRegionalView=false;`);
      const canon = J('JSON.stringify(regionalWorldPosition())');
      const plan = J(`JSON.stringify(buildContinuousWorldPlanFromWorld('overworld', ${canon.worldPxX}, ${canon.worldPxY}, 512, 480))`);
      return plan.visibleChunks.filter((v) => v.mapId === ID);
    };
    for (const [nb, lx, ly] of [['NORTH_BASIN_C_MAP', '8*TILE', '0.5*TILE'], ['NORTH_BASIN_NW_MAP', '14.5*TILE', '2*TILE']]) {
      const hits = planShows(nb, lx, ly);
      assert.equal(hits.length, 1, `${nb} camera plans the reservoir terrain once (not void)`);
      assert.equal(hits[0].worldPxX, 2 * 16 * 32, `${nb}: reservoir drawn at its stable world origin X`);
      assert.equal(hits[0].worldPxY, 0, `${nb}: reservoir drawn at its stable world origin Y`);
    }

    // ── 10. Void count is now 7; region bounds unchanged; SAVE_VERSION 4 ──────
    let placed = 0;
    for (let cy = 0; cy <= 5; cy++) for (let cx = 0; cx <= 4; cx++) if (g.run(`mapIdForChunk('overworld', ${cx}, ${cy})`)) placed++;
    assert.equal(placed, 30, '30 placed chunks fill the 5x6 envelope');
    const b = J("JSON.stringify(regionPixelBounds('overworld'))");
    assert.deepEqual([b.minChunkX, b.maxChunkX, b.minChunkY, b.maxChunkY], [0, 4, 0, 5], 'region chunk extent unchanged');
    assert.equal(g.run('SAVE_VERSION'), 4, 'SAVE_VERSION === 4');
  },
};
