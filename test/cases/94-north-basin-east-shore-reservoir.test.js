'use strict';
// North Basin East Shore Reservoir (NORTH_BASIN_E2_MAP): inaccessible scenery at (4,1),
// matched to NORTH_BASIN_NE2_MAP above and NORTH_BASIN_E_MAP to the west.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const ID = 'NORTH_BASIN_E2_MAP';
const FP = '74353043788878bfd753cc5e3382a6e758e7e652ce3452e222a196d3279c96ff';

module.exports = {
  name: 'North Basin East Shore Reservoir: scenery chunk (4,1), matched edges, fail-closed',
  run() {
    const g = createContext(); g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));
    assert.equal(g.run(`NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1, 'authored once');
    assert.deepEqual(J(`JSON.stringify(regionPlacementForMapId('${ID}'))`), { mapId: ID, regionId: 'overworld', chunkX: 4, chunkY: 1 }, 'placed at (4,1)');
    assert.equal(g.run("mapIdForChunk('overworld',4,0)"), 'NORTH_BASIN_NE2_MAP', 'north neighbour');
    assert.equal(g.run("mapIdForChunk('overworld',3,1)"), 'NORTH_BASIN_E_MAP', 'west neighbour');
    assert.equal(g.run(`typeof ${ID}`), 'undefined', 'no standalone grid export');

    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`), n = J('JSON.stringify(REGIONAL_CHUNK_CATALOG.NORTH_BASIN_NE2_MAP.map)'), w = J('JSON.stringify(REGIONAL_CHUNK_CATALOG.NORTH_BASIN_E_MAP.map)');
    const WATER = g.run('WATER'), MUD = g.run('BASIN_MUD'), TREE = g.run('TREE');
    assert.equal(m.length, 15); assert.ok(m.every((r) => r.length === 16), '16×15');
    let water = 0; for (const row of m) for (const tile of row) { assert.ok([WATER, MUD, TREE].includes(tile), 'existing North Basin terrain only'); if (tile === WATER) water++; }
    assert.ok(water / 240 >= 0.85, 'predominantly open water');
    for (let col = 0; col < 16; col++) assert.equal(m[0][col], n[14][col], `north edge col${col} mirrors NE2 south`);
    for (let row = 0; row < 15; row++) assert.equal(m[row][0], w[row][15], `west edge row${row} mirrors Eastern Woods east`);
    for (let row = 0; row < 15; row++) assert.equal(g.run(`isTileWalkable(${m[row][15]})`), false, `east border row${row} nonwalkable`);
    for (let col = 0; col < 16; col++) assert.equal(g.run(`isTileWalkable(${m[14][col]})`), false, `south border col${col} nonwalkable`);

    assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`)), FP, 'new grid fingerprint');
    assert.equal(GRID_FP.fingerprints[ID], FP, 'fixture records it'); assert.equal(Object.keys(GRID_FP.fingerprints).length, 28, 'all regional grids fingerprinted');
    const audit = require('../transition-audit.js'), v = Object.fromEntries(audit.seamReadiness.edges.map((e) => [e.mapId + '|' + e.dir, e.verdict]));
    assert.equal(v[`${ID}|north`], 'BLOCKED'); assert.equal(v[`${ID}|west`], 'BLOCKED'); assert.equal(v[`${ID}|east`], 'BORDER'); assert.equal(v[`${ID}|south`], 'BLOCKED');
    assert.equal(v['NORTH_BASIN_NE2_MAP|south'], 'BLOCKED'); assert.equal(v['NORTH_BASIN_E_MAP|east'], 'BLOCKED'); assert.equal(v['EAST_CAUSEWAY_MAP|north'], 'BLOCKED');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}']`), 'undefined'); assert.equal(g.run(`continuousSeamEntries().filter(function(e){return e.from==='${ID}'||e.to==='${ID}';}).length`), 0, 'no seam');

    const islet = m.flatMap((row, y) => row.map((tile, x) => tile === MUD ? [x, y] : null)).find(Boolean); assert.ok(islet, 'walkable islet exists');
    const [x, y] = islet, wx = 4 * 512 + x * 32 + 16, wy = 480 + y * 32 + 16;
    g.run("placeAtLocation('NORTH_BASIN_C_MAP',8*TILE,12*TILE);player.facing='up';saveGame();"); const before = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing");
    assert.equal(g.run(`mapPlayerAccessible('${ID}')`), false); assert.equal(g.run(`placeAtLocation('${ID}',${x}*TILE+16,${y}*TILE+16)`), false); assert.equal(g.run(`commitRegionalWorldPosition('overworld',${wx},${wy})`), false); assert.equal(g.run(`transitionToLocation({mapId:'${ID}',x:${x}*TILE+16,y:${y}*TILE+16,facing:'down'})`), false); assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), false);
    g.run(`(function(){var s=JSON.parse(localStorage.getItem('verdantVale_save'));s.location={kind:'regional',regionId:'overworld',worldPxX:${wx},worldPxY:${wy}};localStorage.setItem('verdantVale_save',JSON.stringify(s));})()`); const disk = g.run("localStorage.getItem('verdantVale_save')");
    assert.equal(g.run('loadGame()'), false, 'save restoration rejects it'); assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing"), before, 'all rejections atomic'); assert.equal(g.run("localStorage.getItem('verdantVale_save')"), disk, 'rejected save untouched');
    assert.equal(g.run(`mapEntryForId('${ID}').items.length`), 0); assert.equal(g.run(`mapEntryForId('${ID}').allowRandomEncounters`), false); assert.equal(g.run(`mapEntryForId('${ID}').allowSave`), false); assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='${ID}'||n.physicalMapId==='${ID}';}).length`), 0); assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`), 'undefined'); assert.equal(g.run('SAVE_VERSION'), 4);
  },
};
