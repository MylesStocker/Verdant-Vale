'use strict';
// North Basin Open Reservoir (NORTH_BASIN_NE2_MAP): inaccessible scenery at (4,0),
// extending NORTH_BASIN_NE_MAP eastward while keeping every playable-entry path closed.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const ID = 'NORTH_BASIN_NE2_MAP';
const FP = '3e6f5754052438f40b9f560db8d6321e9e0ab72aeaf94f2b7874cff149021417';

module.exports = {
  name: 'North Basin Open Reservoir: scenery chunk (4,0), water continuation, fail-closed',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));

    assert.equal(g.run(`NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1, 'authored once in the North Basin fragment');
    assert.deepEqual(J(`JSON.stringify(regionPlacementForMapId('${ID}'))`), { mapId: ID, regionId: 'overworld', chunkX: 4, chunkY: 0 }, 'placed at overworld (4,0)');
    assert.equal(g.run("mapIdForChunk('overworld', 3, 0)"), 'NORTH_BASIN_NE_MAP', 'Open Reservoir East is directly west');
    assert.equal(g.run("mapIdForChunk('overworld', 4, 0)"), ID, 'chunk lookup resolves the new reservoir');
    assert.equal(g.run(`typeof ${ID}`), 'undefined', 'no standalone grid export');

    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const west = J("JSON.stringify(REGIONAL_CHUNK_CATALOG.NORTH_BASIN_NE_MAP.map)");
    const WATER = g.run('WATER'), MUD = g.run('BASIN_MUD'), TREE = g.run('TREE');
    assert.equal(m.length, 15, '15 rows'); assert.ok(m.every((r) => r.length === 16), '16 columns');
    let water = 0; for (const row of m) for (const tile of row) { assert.ok([WATER, MUD, TREE].includes(tile), 'only North Basin terrain'); if (tile === WATER) water++; }
    assert.ok(water / 240 >= 0.9, 'overwhelmingly open water');
    for (let row = 0; row < 15; row++) assert.equal(m[row][0], west[row][15], `west col0 row${row} mirrors NORTH_BASIN_NE_MAP east`);
    for (let col = 0; col < 16; col++) { assert.equal(m[0][col], WATER, `north border ${col} is water`); assert.equal(m[14][col], WATER, `south border ${col} is water`); }
    for (let row = 0; row < 15; row++) assert.equal(m[row][15], WATER, `east border ${row} is water`);

    assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`)), FP, 'new grid fingerprint');
    assert.equal(GRID_FP.fingerprints[ID], FP, 'fingerprint fixture records it');
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 20, 'all 20 grids are fingerprinted');

    const audit = require('../transition-audit.js');
    const verdicts = Object.fromEntries(audit.seamReadiness.edges.map((e) => [e.mapId + '|' + e.dir, e.verdict]));
    assert.equal(verdicts[`${ID}|west`], 'BLOCKED', 'west water boundary is structurally blocked');
    for (const dir of ['north', 'east', 'south']) assert.equal(verdicts[`${ID}|${dir}`], 'BORDER', `${dir} remains a void-facing border`);
    assert.equal(verdicts['NORTH_BASIN_NE_MAP|east'], 'BLOCKED', 'the existing east reservoir edge is now structurally blocked');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}']`), 'undefined', 'no transitions');
    assert.equal(g.run(`continuousSeamEntries().filter(function(e){return e.from==='${ID}'||e.to==='${ID}';}).length`), 0, 'no continuous seam');

    const islet = m.flatMap((row, y) => row.map((tile, x) => tile === MUD ? [x, y] : null)).find(Boolean);
    assert.ok(islet, 'a walkable mud islet exists for capability-only entry checks');
    const [x, y] = islet, wx = 4 * 512 + x * 32 + 16, wy = y * 32 + 16;
    g.run("placeAtLocation('NORTH_BASIN_C_MAP', 8*TILE, 12*TILE); player.facing='up'; saveGame();");
    const before = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing");
    assert.equal(g.run(`mapPlayerAccessible('${ID}')`), false, 'scenery-only capability');
    assert.equal(g.run(`placeAtLocation('${ID}', ${x}*TILE+16, ${y}*TILE+16)`), false, 'normal placement rejects atomically');
    assert.equal(g.run(`commitRegionalWorldPosition('overworld', ${wx}, ${wy})`), false, 'canonical placement rejects atomically');
    assert.equal(g.run(`transitionToLocation({mapId:'${ID}',x:${x}*TILE+16,y:${y}*TILE+16,facing:'down'})`), false, 'transition rejects atomically');
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), false, 'debug warp rejects atomically');
    g.run(`(function(){var s=JSON.parse(localStorage.getItem('verdantVale_save'));s.location={kind:'regional',regionId:'overworld',worldPxX:${wx},worldPxY:${wy}};localStorage.setItem('verdantVale_save',JSON.stringify(s));})()`);
    const disk = g.run("localStorage.getItem('verdantVale_save')");
    assert.equal(g.run('loadGame()'), false, 'save restoration rejects scenery-only chunk atomically');
    assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing"), before, 'all rejections preserve live state');
    assert.equal(g.run("localStorage.getItem('verdantVale_save')"), disk, 'rejected save remains untouched');

    assert.equal(g.run(`mapEntryForId('${ID}').items.length`), 0, 'no items');
    assert.equal(g.run(`mapEntryForId('${ID}').allowRandomEncounters`), false, 'encounters disabled');
    assert.equal(g.run(`mapEntryForId('${ID}').allowSave`), false, 'saving disabled');
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='${ID}'||n.physicalMapId==='${ID}';}).length`), 0, 'no NPCs');
    assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`), 'undefined', 'no decoration');
    assert.equal(g.run('SAVE_VERSION'), 4, 'SAVE_VERSION remains 4');
  },
};
