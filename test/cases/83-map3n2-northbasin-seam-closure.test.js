'use strict';
// FINAL seam conversion + regional closure audit.
// Drenwick's north fen (MAP3_N2, chunk 2,3) <-> The North Basin South Approach
// (NORTH_BASIN_S_MAP, chunk 2,2), converted from a NORTH_BASIN_EXIT/NORTH_BASIN_ENTRANCE
// point transition to a structural EDGE_TRANSITIONS seam: MAP3_N2.north <->
// NORTH_BASIN_S_MAP.south, the single col-12 PATH causeway, sourceRange [12,12].
//
// This is the last convertible overworld point crossing, so the second half of this
// test proves regional CLOSURE from existing authorities: zero NEEDS_REMAP, every
// directed edge classified, REGIONAL_POINT_CROSSINGS reduced to exactly the four
// Verdant Vale legacy-home crossings, and the 15-map graph traversably connected
// (the Northern Road branch reconnecting through the legacy home, not a blocked wall).

const assert = require('assert/strict');
const { createContext } = require('../harness');

const CW = 512, CH = 480;
const COL12 = 12.5 * 32; // centred in the one-tile causeway (column 12)

function ctx() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}
function onN2(g, cont) {
  g.run(`debugWarpToDestination('outdoor:MAP3_N2');
         dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;
         combat.active=false; combat.cooldown=0; debugMode=true; forceLegacyRegionalView=${!cont};
         for (var k in keys) delete keys[k];`);
}
const mapId = (g) => g.run('mapIdForRef(activeMap)');
const worldY = (g) => g.run(`(function(){var p=regionPlacementForMapId(mapIdForRef(activeMap)); return p.chunkY*${CH}+player.y;})()`);
const camY = (g) => { const pl = g.run("JSON.stringify((function(){var c=regionalWorldPosition();return c?buildContinuousWorldPlanFromWorld(c.regionId,c.worldPxX,c.worldPxY,512,480):null;})())"); const o = JSON.parse(pl); return o ? o.camPxY : null; };
const pool = (g) => g.run('(currentEncounterPool()===FAR_ENEMY_TEMPLATES?"FAR":currentEncounterPool()===NORTH_BASIN_ENEMY_TEMPLATES?"NBASIN":"OTHER")');

module.exports = {
  name: 'MAP3_N2<->NORTH_BASIN_S_MAP seam + regional closure: zero NEEDS_REMAP, connected 15-map graph',
  run() {
    const g = ctx();
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Exact reciprocal segment definitions + [12,12] ranges ────────────
    const n2 = J("JSON.stringify(EDGE_TRANSITIONS['MAP3_N2'].north)");
    const s = J("JSON.stringify(EDGE_TRANSITIONS['NORTH_BASIN_S_MAP'].south)");
    assert.equal(n2.length, 1, 'MAP3_N2.north is a single segment');
    assert.deepEqual({ t: n2[0].targetMap, e: n2[0].targetEdge, r: n2[0].sourceRange }, { t: 'NORTH_BASIN_S_MAP', e: 'south', r: [12, 12] }, 'MAP3_N2.north -> NORTH_BASIN_S_MAP.south [12,12]');
    assert.deepEqual({ t: s[0].targetMap, e: s[0].targetEdge, r: s[0].sourceRange }, { t: 'MAP3_N2', e: 'north', r: [12, 12] }, 'NORTH_BASIN_S_MAP.south -> MAP3_N2.north [12,12]');
    assert.equal(n2[0].targetRange, undefined, 'no targetRange on MAP3_N2.north');
    assert.equal(s[0].targetRange, undefined, 'no targetRange on NORTH_BASIN_S_MAP.south');
    assert.deepEqual(Object.keys(n2[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'MAP3_N2.north seg has only structural keys');
    assert.deepEqual(Object.keys(s[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'NORTH_BASIN_S_MAP.south seg has only structural keys');

    // ── 2. Both edge cells are PATH; the rest of each edge stays blocked ────
    assert.equal(g.run("mapRefForId('MAP3_N2')[0][12]"), g.run('PATH'), 'MAP3_N2[0][12] is PATH');
    assert.equal(g.run("mapRefForId('NORTH_BASIN_S_MAP')[14][12]"), g.run('PATH'), 'NORTH_BASIN_S_MAP[14][12] is PATH');
    assert.equal(g.run('TILE_PROPERTIES[PATH].encounterEligible'), false, 'the maintained PATH causeway is encounter-safe');
    assert.equal(g.run('!!TILE_PROPERTIES[23].encounterEligible'), true, 'North Basin reeds (23) retain their existing encounter behavior');
    assert.notEqual(g.run("mapRefForId('MAP3_N2')[0][12]"), g.run('NORTH_BASIN_EXIT'), 'no NORTH_BASIN_EXIT at MAP3_N2[0][12]');
    assert.notEqual(g.run("mapRefForId('NORTH_BASIN_S_MAP')[14][12]"), g.run('NORTH_BASIN_ENTRANCE'), 'no NORTH_BASIN_ENTRANCE at NORTH_BASIN_S_MAP[14][12]');
    assert.equal(g.run("(function(){var n=0;for(var id in MAP_CATALOG){var m=MAP_CATALOG[id].map;if(!Array.isArray(m))continue;for(var r=0;r<m.length;r++)for(var c=0;c<m[r].length;c++)if(m[r][c]===NORTH_BASIN_EXIT||m[r][c]===NORTH_BASIN_ENTRANCE)n++;}return n;})()"), 0, 'NORTH_BASIN_EXIT/ENTRANCE no longer placed on any map');
    assert.deepEqual(J("JSON.stringify((function(){var o=[];for(var c=0;c<16;c++)if(isTileWalkable(mapRefForId('MAP3_N2')[0][c]))o.push(c);return o;})())"), [12], 'MAP3_N2 north edge is walkable ONLY at column 12');
    assert.deepEqual(J("JSON.stringify((function(){var o=[];for(var c=0;c<16;c++)if(isTileWalkable(mapRefForId('NORTH_BASIN_S_MAP')[14][c]))o.push(c);return o;})())"), [12], 'NORTH_BASIN_S_MAP south edge is walkable ONLY at column 12');
    // the BRIDGE_GATE at MAP3_N2 row 5 col 12 is a separate crossing — untouched
    assert.equal(g.run("mapRefForId('MAP3_N2')[5][12]"), g.run('BRIDGE_GATE'), 'MAP3_N2[5][12] is still BRIDGE_GATE (separate crossing untouched)');

    // ── 3. Pair reclassifies to ALIGNS; dispatch gone ──────────────────────
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V['MAP3_N2|north'], 'ALIGNS', 'MAP3_N2.north is now ALIGNS');
    assert.equal(V['NORTH_BASIN_S_MAP|south'], 'ALIGNS', 'NORTH_BASIN_S_MAP.south is now ALIGNS');
    assert.equal(g.run('typeof enterNorthBasinS'), 'undefined', 'enterNorthBasinS wrapper removed');
    assert.equal(g.run('typeof exitNorthBasinS'), 'undefined', 'exitNorthBasinS wrapper removed');
    assert.equal(g.run("REGIONAL_POINT_CROSSINGS.filter(function(c){return (c.from==='MAP3_N2'&&c.to==='NORTH_BASIN_S_MAP')||(c.from==='NORTH_BASIN_S_MAP'&&c.to==='MAP3_N2');}).length"), 0, 'MAP3_N2<->NORTH_BASIN_S_MAP removed from REGIONAL_POINT_CROSSINGS');

    // ── 4-9. Continuous northbound sustained crossing (pool flips FAR->NBASIN) ─
    {
      onN2(g, true);
      g.run(`player.x=${COL12}; player.y=1.5*TILE; player.facing='down'; player.moving=false; combat.cooldown=200;; __reconcileCanonicalForTest();`);
      assert.equal(mapId(g), 'MAP3_N2', 'start on MAP3_N2 (Drenwick north fen)');
      assert.equal(pool(g), 'FAR', 'MAP3_N2 side owns FAR before the crossing');
      const startStep = g.run('player.step');
      g.hold('ArrowUp');
      let handoffs = 0, poolFlips = 0, maxWorldD = 0, maxCamD = 0, zero = 0, framesRun = 0;
      let pw = worldY(g), pc = camY(g), pm = mapId(g), pp = pool(g);
      for (let i = 0; i < 60; i++) {
        g.frames(1); framesRun++;
        const w = worldY(g), c = camY(g), m = mapId(g), pl = pool(g);
        const dW = Math.abs(w - pw), dC = Math.abs(c - pc);
        maxWorldD = Math.max(maxWorldD, dW); maxCamD = Math.max(maxCamD, dC);
        if (dW < 1e-9 && m === pm) zero++;
        if (m !== pm) handoffs++;
        if (pl !== pp) poolFlips++;
        pw = w; pc = c; pm = m; pp = pl;
        if (m === 'NORTH_BASIN_S_MAP' && w < 3 * CH - 6) break;
      }
      g.release('ArrowUp');
      assert.equal(mapId(g), 'NORTH_BASIN_S_MAP', 'northbound crossing lands in the South Approach'); // (4)
      assert.equal(handoffs, 1, 'exactly ONE activeMap handoff for the crossing');                    // (6)
      assert.equal(poolFlips, 1, 'encounter pool ownership flips exactly once, at the handoff');
      assert.equal(pool(g), 'NBASIN', 'North Basin side owns NORTH_BASIN_ENEMY_TEMPLATES after the crossing');
      assert.ok(maxWorldD <= 2 + 1e-9, 'player advances at most SPEED per frame (no double movement)'); // (6)
      assert.equal(zero, 0, 'no stuck frames while entering/clearing the seam');                       // (5)
      assert.ok(maxCamD <= maxWorldD + 1e-9, 'camera delta never exceeds movement delta');             // (9)
      assert.equal(g.run('player.facing'), 'up', 'facing preserved across handoff');                   // (8)
      assert.ok(g.run('player.step') > startStep, 'animation step kept advancing (not reset)');
      assert.equal(g.run('combat.cooldown'), 200 - framesRun, 'cooldown decremented normally, NOT reset by the seamless handoff');
      const py = g.run('player.y');
      assert.ok(py > g.run('13.5*TILE'), 'landed near the South Approach south edge (continuous), not the legacy row-13 inset');
      assert.notEqual(py, g.run('13.5*TILE'), 'did not snap to the legacy inset landing');
    }

    // ── 7. Standing-point handoff timing (centre crosses the chunk boundary) ─
    {
      onN2(g, true);
      g.run(`player.x=${COL12}; player.y=0.5*TILE; player.facing='up';; __reconcileCanonicalForTest();`);
      g.hold('ArrowUp');
      let beforeMap = mapId(g);
      for (let i = 0; i < 20; i++) { g.frames(1); if (mapId(g) !== beforeMap) break; }
      g.release('ArrowUp');
      assert.equal(mapId(g), 'NORTH_BASIN_S_MAP', 'crossed on the standing-point handoff');
      // boundary between MAP3_N2(2,3) and NORTH_BASIN_S_MAP(2,2) is worldY = 3*CH = 1440.
      assert.ok(worldY(g) <= 3 * CH && worldY(g) > 3 * CH - 4, 'handoff occurs as the centre crosses the chunk boundary (worldY ~1440)');
    }

    // ── 6/8. Continuous southbound crossing back (pool flips NBASIN->FAR) ───
    {
      onN2(g, true);
      g.run(`activeMap = mapRefForId('NORTH_BASIN_S_MAP'); player.x=${COL12}; player.y=13.5*TILE; player.facing='down';; __reconcileCanonicalForTest();`);
      assert.equal(pool(g), 'NBASIN', 'North Basin side owns NBASIN before southbound crossing');
      g.hold('ArrowDown');
      let handoffs = 0, pm = mapId(g), maxD = 0, pw = worldY(g);
      for (let i = 0; i < 30; i++) { g.frames(1); const w = worldY(g), m = mapId(g); maxD = Math.max(maxD, Math.abs(w - pw)); if (m !== pm) handoffs++; pm = m; pw = w; if (m === 'MAP3_N2') break; }
      g.release('ArrowDown');
      assert.equal(mapId(g), 'MAP3_N2', 'southbound crossing lands back in MAP3_N2');
      assert.equal(handoffs, 1, 'exactly one handoff southbound');
      assert.equal(pool(g), 'FAR', 'MAP3_N2 side owns FAR again after southbound crossing');
      assert.ok(maxD <= 2 + 1e-9, 'southbound advances at most SPEED per frame');
    }

    // ── 10-11. Reversal, parallel, and diagonal movement at the seam ────────
    {
      onN2(g, true);
      g.run(`player.x=${COL12}; player.y=0.2*TILE; player.facing='up';; __reconcileCanonicalForTest();`);
      g.hold('ArrowUp'); g.frames(1); g.release('ArrowUp');
      g.hold('ArrowDown'); for (let i = 0; i < 12; i++) g.frames(1); g.release('ArrowDown');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'reversal leaves the player on a walkable footprint (no soft-lock)');
      assert.ok(['MAP3_N2', 'NORTH_BASIN_S_MAP'].includes(mapId(g)), 'still on one of the two seam maps after reversal');
      // parallel (horizontal) motion while straddling: cols 11 & 13 at the edge are water/blocked
      onN2(g, true);
      g.run(`player.x=${COL12}; player.y=0.4*TILE; player.facing='up';; __reconcileCanonicalForTest();`);
      const bm = mapId(g);
      g.hold('ArrowLeft'); for (let i = 0; i < 3; i++) g.frames(1); g.release('ArrowLeft');
      assert.equal(mapId(g), bm, 'parallel motion while straddling does not trigger a handoff');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'footprint stays valid straddling the seam');
      // diagonal (up+left) decenters off the one-tile causeway — slides, does not squeeze through
      onN2(g, true);
      g.run(`player.x=${COL12}; player.y=1.5*TILE; player.facing='up';; __reconcileCanonicalForTest();`);
      g.hold('ArrowUp'); g.hold('ArrowLeft'); for (let i = 0; i < 10; i++) g.frames(1); g.release('ArrowUp'); g.release('ArrowLeft');
      assert.equal(mapId(g), 'MAP3_N2', 'diagonal off the corridor centre does not squeeze through the one-tile causeway');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'diagonal movement leaves a valid footprint (no soft-lock)');
      assert.notEqual(g.run('player.x'), COL12, 'the horizontal component moved the player off the corridor centre');
      // recentred on col 12, pure north crosses cleanly with one handoff
      g.run(`player.x=${COL12}; player.y=1.5*TILE;; __reconcileCanonicalForTest();`);
      let dh = 0, dpm = mapId(g);
      g.hold('ArrowUp'); for (let i = 0; i < 30; i++) { g.frames(1); if (mapId(g) !== dpm) dh++; dpm = mapId(g); if (mapId(g) === 'NORTH_BASIN_S_MAP') break; } g.release('ArrowUp');
      assert.equal(mapId(g), 'NORTH_BASIN_S_MAP', 'recentred on col 12, pure north crosses cleanly');
      assert.equal(dh, 1, 'the recentred crossing is a single handoff');
    }

    // ── 12. One-tile causeway: only column 12 has an eligible crossing ─────
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP3_N2'); __reconcileCanonicalForTest(); return canWalk(12.5*TILE, 0.5*TILE);})()"), true, 'MAP3_N2 col 12 row 0 (causeway) is walkable');
    assert.equal(g.run("canWalk(11.5*TILE, 0.5*TILE)"), false, 'MAP3_N2 col 11 row 0 is blocked (water)');
    assert.equal(g.run("canWalk(13.5*TILE, 0.5*TILE)"), false, 'MAP3_N2 col 13 row 0 is blocked (water)');
    assert.equal(g.run("(function(){activeMap=mapRefForId('NORTH_BASIN_S_MAP'); __reconcileCanonicalForTest(); return canWalk(12.5*TILE, 13.5*TILE);})()"), true, 'NORTH_BASIN_S_MAP col 12 row 14 (causeway) is walkable');
    assert.equal(g.run(`continuousSeamCrossingAt('MAP3_N2', 2*512+11.5*TILE, 3*480-1)`), null, 'no eligible crossing at col 11 (outside the [12,12] seam)');
    assert.ok(g.run(`!!continuousSeamCrossingAt('MAP3_N2', 2*512+12.5*TILE, 3*480-1)`), 'eligible crossing exists at col 12');

    // ── 13. Continuous View OFF: reciprocal legacy travel + inset + COOLDOWN PARITY ─
    {
      onN2(g, false);
      g.run(`player.x=${COL12}; player.y=1.5*TILE; player.facing='up'; combat.cooldown=0;; __reconcileCanonicalForTest();`);
      g.hold('ArrowUp'); let north = false; for (let i = 0; i < 40 && !north; i++) { g.frames(1); north = mapId(g) === 'NORTH_BASIN_S_MAP'; } g.release('ArrowUp');
      assert.ok(north, 'View off: northbound reaches the South Approach via the legacy broad-edge path');
      assert.equal(g.run('player.y'), g.run('13.5*TILE'), 'legacy inset landing = row 13 (same coords as the old enterNorthBasinS)');
      assert.ok(g.run('combat.cooldown') > 0, 'legacy edge transition applies the encounter cooldown (parity with the retired enterNorthBasinS)');
      g.run(`combat.cooldown=0; player.x=${COL12}; player.y=13.5*TILE; player.facing='down';; __reconcileCanonicalForTest();`);
      g.hold('ArrowDown'); let south = false; for (let i = 0; i < 40 && !south; i++) { g.frames(1); south = mapId(g) === 'MAP3_N2'; } g.release('ArrowDown');
      assert.ok(south, 'View off: southbound reaches MAP3_N2 via the legacy broad-edge path');
      assert.equal(g.run('player.y'), g.run('1.5*TILE'), 'legacy inset landing = row 1 (same coords as the old exitNorthBasinS)');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'not stuck on the arrival edge');
      assert.ok(g.run('combat.cooldown') > 0, 'reciprocal legacy edge transition also applies cooldown (parity with the retired exitNorthBasinS)');
    }

    // ── 14. Distinct canonical pools on each side ──────────────────────────
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP3_N2'); player.x=8*TILE; player.y=8*TILE; __reconcileCanonicalForTest(); return currentEncounterPool()===FAR_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP3_N2').encounterPool;})()"), true, 'MAP3_N2 pool is FAR_ENEMY_TEMPLATES');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('NORTH_BASIN_S_MAP'); player.x=8*TILE; player.y=6*TILE; __reconcileCanonicalForTest(); return currentEncounterPool()===NORTH_BASIN_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('NORTH_BASIN_S_MAP').encounterPool;})()"), true, 'NORTH_BASIN_S_MAP pool is NORTH_BASIN_ENEMY_TEMPLATES');

    // ── 15. No extra Math.random / combat start caused by the handoff ───────
    {
      onN2(g, true);
      g.run(`player.x=${COL12}; player.y=0.5*TILE; player.facing='up';; __reconcileCanonicalForTest();`);
      const res = g.run(`(function(){
        var rc=0,_r=Math.random; Math.random=function(){rc++; return _r();};
        var sc=0,_sc=startCombat; startCombat=function(){sc++;};
        var before=mapIdForRef(activeMap);
        for (var k in keys) delete keys[k]; keys['ArrowUp']=true;
        for (var i=0;i<12;i++) update();
        for (var k in keys) delete keys[k];
        Math.random=_r; startCombat=_sc;
        return JSON.stringify({rc:rc, sc:sc, crossed: mapIdForRef(activeMap)!==before});
      })()`);
      const r = JSON.parse(res);
      assert.ok(r.crossed, 'the driven frames crossed the seam');
      assert.equal(r.rc, 0, 'no Math.random consumed on the crossing frames');
      assert.equal(r.sc, 0, 'no combat started by the handoff');
    }

    // ── 16. North Basin road sign is active-map-only (currentMapFeatures gate) ─
    assert.equal(g.run(`(function(){ resetLocationState(); activeMap=mapRefForId('MAP3_N2'); dialogue.open=false; player.x=13.5*TILE; player.y=12.5*TILE; __reconcileCanonicalForTest(); var r=tryMapFeatures(); return r || dialogue.open; })()`), false, 'road sign cannot be inspected from MAP3_N2 before the handoff (belongs to NORTH_BASIN_S_MAP)');
    assert.equal(g.run(`(function(){ resetLocationState(); activeMap=mapRefForId('NORTH_BASIN_S_MAP'); dialogue.open=false; player.x=13.5*TILE; player.y=12.5*TILE; __reconcileCanonicalForTest(); tryMapFeatures(); return dialogue.open; })()`), true, 'road sign inspects normally once active on NORTH_BASIN_S_MAP (after the handoff)');

    // ── 17. Save/load after crossing restores physical map + local position ─
    {
      const g2 = ctx();
      onN2(g2, true);
      g2.run(`player.x=${COL12}; player.y=0.5*TILE; player.facing='up';; __reconcileCanonicalForTest();`);
      g2.hold('ArrowUp'); for (let i = 0; i < 20 && mapId(g2) !== 'NORTH_BASIN_S_MAP'; i++) g2.frames(1); g2.release('ArrowUp');
      assert.equal(mapId(g2), 'NORTH_BASIN_S_MAP', 'crossed before saving');
      const px = g2.run('player.x'), py = g2.run('player.y');
      g2.run('saveGame();');
      assert.equal(JSON.parse(g2.run("localStorage.getItem('verdantVale_save')")).version, 4, 'SAVE_VERSION stays 4');
      g2.run("activeMap = mapRefForId('MAP'); player.x=1; player.y=1;; __reconcileCanonicalForTest();");
      g2.run('loadGame();');
      assert.equal(g2.run('mapIdForRef(activeMap)'), 'NORTH_BASIN_S_MAP', 'load restores the correct physical map');
      assert.ok(Math.abs(g2.run('player.x') - px) < 1 && Math.abs(g2.run('player.y') - py) < 1, 'load restores the local position');
    }

    // ═══ CLOSURE PROOF (existing authorities only) ═════════════════════════
    // ── C1. Zero NEEDS_REMAP; every directed edge classified; no CONFLICT/OUTSIDE ─
    const edges = audit.seamReadiness.edges;
    assert.equal(edges.filter((e) => e.verdict === 'NEEDS_REMAP').length, 0, 'NEEDS_REMAP === 0 (no unconverted point crossings remain)');
    assert.equal(edges.length, 84, '84 directed regional edges total (21 placed maps x 4 sides)');
    const CLASSES = new Set(['ALIGNS', 'INTENTIONAL_DISCRETE', 'BLOCKED', 'BORDER']);
    assert.ok(edges.every((e) => CLASSES.has(e.verdict)), 'every directed edge is ALIGNS / INTENTIONAL_DISCRETE / BLOCKED / BORDER');
    assert.equal(edges.filter((e) => e.verdict === 'CONFLICT' || e.verdict === 'OUTSIDE_REGION').length, 0, 'no CONFLICT / OUTSIDE_REGION');
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 26, ALIGNS: 26, BLOCKED: 28 }, 'closure totals: ALIGNS 26 / INTENTIONAL_DISCRETE 4 / BLOCKED 28 / BORDER 26 (West Outfall + 5 North Basin scenery chunks)');

    // ── C2. Every ALIGNS edge is represented by the fail-closed eligible-seam authority ─
    const alignsEdges = edges.filter((e) => e.verdict === 'ALIGNS').map((e) => e.mapId + '|' + e.dir);
    const seamSet = new Set(J("JSON.stringify(continuousSeamEntries().map(function(e){return e.from+'|'+e.dir;}))"));
    for (const a of alignsEdges) assert.ok(seamSet.has(a), `${a} (ALIGNS) is represented in the eligible continuous-seam authority`);
    assert.equal(alignsEdges.length, seamSet.size, 'the ALIGNS set equals the eligible continuous-seam set exactly (26)');

    // ── C3. REGIONAL_POINT_CROSSINGS is now exactly the four Verdant Vale legacy crossings ─
    const rpc = J("JSON.stringify(REGIONAL_POINT_CROSSINGS.map(function(c){return c.from+'>'+c.dir+'>'+c.to;}))").sort();
    assert.deepEqual(rpc, ['MAP2>west>MAP', 'MAP>east>MAP2', 'MAP>north>MAP_N1', 'MAP_N1>south>MAP'].sort(), 'REGIONAL_POINT_CROSSINGS is exactly the 4 Verdant Vale legacy-home directed crossings — no ordinary continuous-world crossing remains');

    // ── C4. Graph connectivity: continuous-only graph is split around the legacy home; ─
    //        adding the intentional-discrete home crossings reconnects all 15 ACCESSIBLE
    //        maps. The 16th placement (scenery-only DRENWICK_WEST_OUTFALL_MAP) is
    //        deliberately unreachable — placed but isolated (no seam of any kind), so
    //        the traversable-graph assertions run over the accessible nodes only.
    const allNodes = J("JSON.stringify(REGIONAL_LAYOUT.overworld.placements.map(function(p){return p.mapId;}))");
    assert.equal(allNodes.length, 21, '21 placed regional maps (15 accessible + 6 scenery-only)');
    const nodes = allNodes.filter((n) => g.run('mapPlayerAccessible(' + JSON.stringify(n) + ')'));
    assert.equal(nodes.length, 15, '15 accessible regional maps form the traversable world');
    assert.ok(allNodes.includes('DRENWICK_WEST_OUTFALL_MAP') && !nodes.includes('DRENWICK_WEST_OUTFALL_MAP'),
      'the West Outfall is placed but not player-accessible');
    assert.equal(g.run("continuousSeamEntries().filter(function(e){return e.from==='DRENWICK_WEST_OUTFALL_MAP'||e.to==='DRENWICK_WEST_OUTFALL_MAP';}).length"), 0,
      'the West Outfall participates in NO continuous seam (isolated scenery)');
    const contPairs = J("JSON.stringify(continuousSeamEntries().map(function(e){return [e.from,e.to];}))");
    const homePairs = J("JSON.stringify(REGIONAL_POINT_CROSSINGS.map(function(c){return [c.from,c.to];}))");
    function components(nodeList, pairs) {
      const parent = {}; nodeList.forEach((n) => (parent[n] = n));
      const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
      const union = (a, b) => { parent[find(a)] = find(b); };
      for (const [a, b] of pairs) if (a in parent && b in parent) union(a, b);
      return new Set(nodeList.map(find)).size;
    }
    const compClass = (nodeList, pairs, target) => { // component id of `target`
      const parent = {}; nodeList.forEach((n) => (parent[n] = n));
      const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
      for (const [a, b] of pairs) if (a in parent && b in parent) parent[find(a)] = find(b);
      return find(target);
    };
    // continuous-only: 3 components — the legacy home (isolated) + the Northern branch +
    // the southern/basin cluster.
    assert.equal(components(nodes, contPairs), 3, 'continuous-only graph has 3 components (Verdant Vale isolated; Northern branch separate from the southern/basin cluster)');
    assert.notEqual(compClass(nodes, contPairs, 'MAP_N1'), compClass(nodes, contPairs, 'MAP3'), 'the Northern Road branch (MAP_N1) is a SEPARATE continuous component from the southern cluster (MAP3)');
    assert.equal([...new Set(nodes.map((n) => compClass(nodes, contPairs, n)))].filter((c) => nodes.filter((n) => compClass(nodes, contPairs, n) === c).length === 1 && compClass(nodes, contPairs, 'MAP') === c).length, 1, 'Verdant Vale (MAP) is an isolated continuous component');
    // full graph = continuous seams + the intentional-discrete home crossings → 1 component
    assert.equal(components(nodes, contPairs.concat(homePairs)), 1, 'adding the intentional-discrete legacy-home crossings connects all 15 maps into one traversable graph');
    assert.equal(compClass(nodes, contPairs.concat(homePairs), 'MAP_N1'), compClass(nodes, contPairs.concat(homePairs), 'MAP3'), 'with the home crossings, the Northern branch and the southern cluster are in the same component');
    // the reconnection is via the legacy home presentation (INTENTIONAL_DISCRETE), NOT a blocked wall
    assert.equal(V['MAP_N1|south'], 'INTENTIONAL_DISCRETE', 'the Northern branch reconnects through the Verdant Vale legacy boundary (MAP_N1.south is INTENTIONAL_DISCRETE, not BLOCKED)');
    assert.equal(components(nodes, contPairs.concat(homePairs.filter(([a, b]) => !(a === 'MAP_N1' || b === 'MAP_N1')))), 2, 'removing only the MAP<->MAP_N1 home crossing re-isolates the Northern branch — its sole reconnection is through the legacy home');
  },
};
