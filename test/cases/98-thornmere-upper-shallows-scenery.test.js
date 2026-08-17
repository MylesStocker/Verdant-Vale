'use strict';
// THORNMERE_UPPER_SHALLOWS_MAP — inaccessible open-water scenery at (4,4),
// east of Northern Thornmere Fen and north of Thornmere Shallows.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ID = 'THORNMERE_UPPER_SHALLOWS_MAP';
const WEST_ID = 'THORNMERE_NORTH_FEN_MAP';
const SOUTH_ID = 'MAP5';
const FP = 'fe6eaa3e73a470e8a1cf4a959d285dd26a34214f814373d0518cd4bc156fb7d5';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function context() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}

module.exports = {
  name: 'Thornmere Upper Shallows: 90% water scenery, neighbour rendering, atomic access rejection',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. One inline 16×15 definition and exact derived catalog metadata.
    assert.equal(g.run(`THORNMERE_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1);
    assert.equal(g.run(`_REGIONAL_CHUNK_DEFINITIONS.filter(function(d){return d.mapId==='${ID}';}).length`), 1);
    assert.deepEqual(J(`JSON.stringify(regionPlacementForMapId('${ID}'))`),
      { mapId: ID, regionId: 'overworld', chunkX: 4, chunkY: 4 });
    assert.equal(g.run("mapIdForChunk('overworld',3,4)"), WEST_ID);
    assert.equal(g.run("mapIdForChunk('overworld',4,5)"), SOUTH_ID);
    assert.equal(g.run("mapIdForChunk('overworld',4,3)"), 'THORNMERE_CANAL_HEAD_MAP', 'Canal Head is now the placed north neighbour');
    assert.equal(g.run("mapIdForChunk('overworld',5,4)"), null, 'east lies beyond the placed envelope');
    const meta = J(`JSON.stringify((function(){var d=REGIONAL_CHUNK_CATALOG['${ID}'];var m=mapEntryForId('${ID}');
      var def=THORNMERE_REGIONAL_CHUNK_DEFINITIONS.find(function(x){return x.mapId==='${ID}';});return {
      mapId:d.mapId,regionId:d.regionId,chunkX:d.chunkX,chunkY:d.chunkY,displayName:d.displayName,region:d.region,
      contentKey:d.contentKey,presentation:d.presentation,encounterProfileId:def.encounterProfileId,
      playerAccessible:d.playerAccessible,allowRandomEncounters:d.allowRandomEncounters,allowSave:d.allowSave,
      itemSetAuthored:Object.prototype.hasOwnProperty.call(d,'itemSetId'),items:m.items.length,
      pool:m.encounterPool===THORNMERE_ENEMY_TEMPLATES
    };})())`);
    assert.deepEqual(meta, {
      mapId: ID, regionId: 'overworld', chunkX: 4, chunkY: 4,
      displayName: 'Thornmere — Upper Shallows', region: 'Thornmere', contentKey: 'thornmere_upper_shallows',
      presentation: 'continuous', encounterProfileId: 'thornmere', playerAccessible: false,
      allowRandomEncounters: false, allowSave: false, itemSetAuthored: false, items: 0, pool: true,
    });
    const m = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const west = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${WEST_ID}'].map)`);
    const south = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${SOUTH_ID}'].map)`);
    const WATER = g.run('WATER'), TREE = g.run('TREE'), REEDS = g.run('REEDS');
    assert.equal(m.length, 15); assert.ok(m.every((row) => row.length === 16));
    assert.ok(m.every((row) => row.every((tile) => [WATER, TREE, REEDS].includes(tile))), 'approved existing outdoor tiles only');

    // 2. Exactly 90% WATER; the few non-water cells form three irregular remnants.
    const counts = { water: 0, tree: 0, reeds: 0 };
    for (const tile of m.flat()) {
      if (tile === WATER) counts.water++;
      else if (tile === TREE) counts.tree++;
      else if (tile === REEDS) counts.reeds++;
    }
    assert.deepEqual(counts, { water: 216, tree: 6, reeds: 18 });
    assert.equal(counts.water / 240, 0.9, 'WATER is exactly 90% of the grid');

    // 3–5. Border authority, including the explicitly approved REEDS southwest corner.
    const expectedWest = [TREE,WATER,WATER,WATER,TREE,WATER,WATER,WATER,WATER,WATER,WATER,TREE,WATER,WATER,REEDS];
    assert.deepEqual(m.map((row) => row[0]), expectedWest);
    for (let row = 0; row < 14; row++) assert.equal(m[row][0], west[row][15], `west row ${row} matches Northern Thornmere Fen`);
    assert.equal(west[14][15], TREE); assert.equal(m[14][0], REEDS, 'agreed southwest REEDS exception to the west edge');
    for (let col = 1; col < 16; col++) assert.equal(m[14][col], south[0][col], `south col ${col} matches MAP5`);
    assert.equal(south[0][0], WATER); assert.equal(m[14][0], REEDS, 'agreed southwest REEDS exception to the south edge');
    assert.deepEqual(m[0], [TREE].concat(Array(15).fill(WATER)), 'north reads as open water beyond the required west corner');
    assert.deepEqual(m.map((row) => row[15]), Array(15).fill(WATER), 'east is open WATER throughout');

    // 6–7. Terrain-only scenery: no transitions, content, aliases, decoration, saves, or encounters.
    assert.equal(g.run(`typeof ${ID}`), 'undefined', 'no bare compatibility grid alias');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined', 'no window export');
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}']`), 'undefined', 'no transition source');
    assert.equal(g.run(`Object.keys(EDGE_TRANSITIONS).some(function(src){var e=EDGE_TRANSITIONS[src];return ['north','south','east','west'].some(function(dir){return (e[dir]||[]).some(function(s){return s.targetMap==='${ID}';});});})`), false, 'no transition targets it');
    assert.equal(g.run(`continuousSeamEntries().filter(function(e){return e.from==='${ID}'||e.to==='${ID}';}).length`), 0);
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='thornmere_upper_shallows'||n.physicalMapId==='${ID}';}).length`), 0);
    assert.equal(g.run(`typeof MAP_FEATURES['thornmere_upper_shallows']`), 'undefined');
    assert.equal(g.run(`typeof OUTDOOR_MAP_DECOR['${ID}']`), 'undefined');
    assert.equal(g.run(`mapPlayerAccessible('${ID}')`), false);
    assert.equal(g.run(`mapEntryForId('${ID}').allowRandomEncounters`), false);
    assert.equal(g.run(`mapEntryForId('${ID}').allowSave`), false);

    // 8–9. Every shared placement/restore/warp path rejects atomically.
    g.run("placeAtLocation('THORNMERE_NORTH_FEN_MAP',8.5*TILE,7.5*TILE);player.facing='left';saveGame();");
    const liveSnapshot = () => g.run(`JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,facing:player.facing,canon:regionalWorldPosition(),
      state:[inTown,inDungeon,inSluice,inMireVault,inBridgePost,inBasinChamber,inSunkenGallery]})`);
    const before = liveSnapshot();
    const targetX = 4 * 512 + 2.5 * 32, targetY = 4 * 480 + 3.5 * 32;
    assert.equal(g.run(`placeAtLocation('${ID}',2.5*TILE,3.5*TILE)`), false, 'ordinary placement rejected');
    assert.equal(liveSnapshot(), before, 'ordinary placement atomic');
    assert.equal(g.run(`commitRegionalWorldPosition('overworld',${targetX},${targetY})`), false, 'canonical placement rejected');
    assert.equal(liveSnapshot(), before, 'canonical placement atomic');
    assert.equal(g.run(`transitionToLocation({mapId:'${ID}',x:2.5*TILE,y:3.5*TILE,facing:'up'})`), false, 'transition rejected');
    assert.equal(liveSnapshot(), before, 'transition atomic');
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), false, 'debug warp rejected');
    assert.equal(liveSnapshot(), before, 'debug warp atomic');
    const warp = J(`JSON.stringify(debugDestinationById('outdoor:${ID}'))`);
    assert.equal(warp.disabled, true); assert.equal(warp.disabledReason, 'Scenery-only; no player access');

    g.run(`(function(){var s=JSON.parse(localStorage.getItem('verdantVale_save'));s.location={kind:'regional',regionId:'overworld',worldPxX:${targetX},worldPxY:${targetY}};localStorage.setItem('verdantVale_save',JSON.stringify(s));})()`);
    const editedDisk = g.run("localStorage.getItem('verdantVale_save')");
    assert.equal(g.run('loadGame()'), false, 'hand-edited v4 save rejected');
    assert.equal(liveSnapshot(), before, 'rejected load leaves all live location state unchanged');
    assert.equal(g.run("localStorage.getItem('verdantVale_save')"), editedDisk, 'rejected load leaves stored save unchanged');

    const gInvalid = context();
    gInvalid.run("placeAtLocation('THORNMERE_NORTH_FEN_MAP',8.5*TILE,7.5*TILE);saveGame();");
    const validDisk = gInvalid.run("localStorage.getItem('verdantVale_save')");
    gInvalid.run(`resetLocationState();activeMap=mapRefForId('${ID}');player.x=2.5*TILE;player.y=3.5*TILE;player.facing='right';__reconcileCanonicalForTest();`);
    assert.ok(JSON.parse(gInvalid.run('JSON.stringify(regionalInvariantErrors())')).length > 0,
      'manipulated inaccessible placement violates the canonical invariant');
    assert.equal(gInvalid.run('saveGame()'), false, 'save refuses manipulated inaccessible state');
    assert.equal(gInvalid.run("localStorage.getItem('verdantVale_save')"), validDisk, 'failed save preserves prior disk state');

    // 10. No seam authorization means NPC/pickup/interaction/prompt paths cannot enter it.
    g.run("placeAtLocation('THORNMERE_NORTH_FEN_MAP',14.5*TILE,1.5*TILE);forceLegacyRegionalView=false;");
    const targetWorldX = 4 * 512 + 0.5 * 32, targetWorldY = 4 * 480 + 1.5 * 32;
    assert.equal(g.run(`continuousSeamCrossingAt('${WEST_ID}',${targetWorldX},${targetWorldY})`), null);
    assert.equal(g.run(`crossSeamNeighbourFor('${WEST_ID}',${targetWorldX},${targetWorldY})`), null);
    assert.equal(g.run('crossSeamInteractPromptTarget()'), null);
    assert.equal(g.run(`nearbySimulationMapSet().has('${ID}')`), false, 'scenery excluded from nearby NPC simulation');

    // 11. Both neighbours render it once without mutating gameplay state.
    const renderedFrom = (source, x, y) => {
      g.run(`placeAtLocation('${source}',${x},${y});forceLegacyRegionalView=false;`);
      const snap = liveSnapshot();
      const c = J('JSON.stringify(regionalWorldPosition())');
      const plan = J(`JSON.stringify(buildContinuousWorldPlanFromWorld('overworld',${c.worldPxX},${c.worldPxY},512,480))`);
      g.renderFrame();
      assert.equal(liveSnapshot(), snap, `${source}: render is read-only`);
      return plan.visibleChunks.filter((chunk) => chunk.mapId === ID);
    };
    for (const [source, x, y] of [[WEST_ID,'14.5*TILE','1.5*TILE'],[SOUTH_ID,'6.5*TILE','6.5*TILE']]) {
      const hits = renderedFrom(source, x, y);
      assert.equal(hits.length, 1, `${source}: Upper Shallows replaces black void exactly once`);
      assert.equal(hits[0].worldPxX, 4 * 512); assert.equal(hits[0].worldPxY, 4 * 480);
    }

    // Encounter resolution fails before either the chance or enemy-selection roll.
    const encounter = J(`(function(){resetLocationState();activeMap=mapRefForId('${ID}');player.x=2.5*TILE;player.y=3.5*TILE;__reconcileCanonicalForTest();
      combat.active=false;var calls=0,old=Math.random;Math.random=function(){calls++;return 0;};var geo=encounterGeographyOk();var pool=currentEncounterPool();startCombat();Math.random=old;
      return JSON.stringify({geo:geo,pool:pool.length,calls:calls,combat:combat.active});})()`);
    assert.deepEqual(encounter, { geo: false, pool: 0, calls: 0, combat: false });

    // 12–15. Fingerprints, audit, totals, and save schema remain stable.
    assert.equal(sha256(JSON.stringify(m)), FP); assert.equal(GRID_FP.fingerprints[ID], FP);
    assert.equal(Object.keys(GRID_FP.fingerprints).length, 27);
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), fp, `${id}: fingerprint stable`);
    }
    const audit = require('../transition-audit.js');
    const verdict = Object.fromEntries(audit.seamReadiness.edges.map((e) => [e.mapId + '|' + e.dir, e.verdict]));
    assert.equal(verdict[`${ID}|west`], 'BLOCKED'); assert.equal(verdict[`${WEST_ID}|east`], 'BLOCKED');
    assert.equal(verdict[`${ID}|south`], 'BLOCKED'); assert.equal(verdict[`${SOUTH_ID}|north`], 'BLOCKED');
    assert.equal(verdict[`${ID}|north`], 'BLOCKED'); assert.equal(verdict[`${ID}|east`], 'BORDER');
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 22, ALIGNS: 42, BLOCKED: 40 });
    assert.equal(audit.seamReadiness.edges.length, 108);
    assert.equal(g.run('continuousSeamEntries().length'), 48);
    let placed = 0; for (let y = 0; y <= 5; y++) for (let x = 0; x <= 4; x++) if (g.run(`mapIdForChunk('overworld',${x},${y})`)) placed++;
    assert.equal(placed, 27); assert.equal(30 - placed, 3);
    assert.equal(g.run('Object.keys(MAP_CATALOG).length'), 114);
    assert.equal(g.run('SAVE_VERSION'), 4);
  },
};
