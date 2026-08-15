'use strict';
// PILOT: Thornmere Fen (MAP3, chunk 2,5) <-> Northern Fen (MAP3_N1, chunk 2,4)
// crossing converted from a FEN_N_EXIT/FEN_N_ENTRANCE point transition to a
// structural EDGE_TRANSITIONS seam: MAP3.north <-> MAP3_N1.south, the single col-8
// PATH, sourceRange [8,8]. Seamless under Continuous View; discrete broad-edge with
// it off. The one-tile corridor is authored geography (unchanged). Both maps stay
// FAR_ENEMY_TEMPLATES; the crossing never resets encounter cooldown.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const CW = 512, CH = 480; // COLS*TILE, ROWS*TILE
const COL8 = 8.5 * 32;    // centred in the one-tile corridor

function ctx() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}
function onMap3(g, cont) {
  g.run(`debugWarpToDestination('outdoor:MAP3');
         dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;
         combat.active=false; combat.cooldown=0; debugMode=true; continuousWorldViewEnabled=${cont};
         for (var k in keys) delete keys[k];`);
}
const mapId = (g) => g.run('mapIdForRef(activeMap)');
const worldY = (g) => g.run(`(function(){var p=regionPlacementForMapId(mapIdForRef(activeMap)); return p.chunkY*${CH}+player.y;})()`);
const worldX = (g) => g.run(`(function(){var p=regionPlacementForMapId(mapIdForRef(activeMap)); return p.chunkX*${CW}+player.x;})()`);
const camY = (g) => { const pl = g.run("JSON.stringify((function(){var c=regionalWorldPosition();return c?buildContinuousWorldPlanFromWorld(c.regionId,c.worldPxX,c.worldPxY,512,480):null;})())"); const o = JSON.parse(pl); return o ? o.camPxY : null; };

module.exports = {
  name: 'MAP3<->MAP3_N1 seam pilot: seamless crossing, legacy fallback, validation, no encounter side-effects',
  run() {
    const g = ctx();
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Exact reciprocal segment definitions + [8,8] ranges ──────────────
    const n = J("JSON.stringify(EDGE_TRANSITIONS['MAP3'].north)");
    const s = J("JSON.stringify(EDGE_TRANSITIONS['MAP3_N1'].south)");
    assert.equal(n.length, 1, 'MAP3.north is a single segment');
    assert.deepEqual({ t: n[0].targetMap, e: n[0].targetEdge, r: n[0].sourceRange }, { t: 'MAP3_N1', e: 'south', r: [8, 8] }, 'MAP3.north -> MAP3_N1.south [8,8]');
    assert.deepEqual({ t: s[0].targetMap, e: s[0].targetEdge, r: s[0].sourceRange }, { t: 'MAP3', e: 'north', r: [8, 8] }, 'MAP3_N1.south -> MAP3.north [8,8]');
    assert.equal(n[0].targetRange, undefined, 'no targetRange on MAP3.north (non-remapping)');
    assert.equal(s[0].targetRange, undefined, 'no targetRange on MAP3_N1.south');
    // no behaviour-bearing keys
    const keysN = Object.keys(n[0]).sort(), keysS = Object.keys(s[0]).sort();
    assert.deepEqual(keysN, ['sourceRange', 'targetEdge', 'targetMap'], 'MAP3.north seg has only structural keys');
    assert.deepEqual(keysS, ['sourceRange', 'targetEdge', 'targetMap'], 'MAP3_N1.south seg has only structural keys');

    // ── 2. Both edge cells are ordinary base-walkable road/PATH tiles ───────
    assert.equal(g.run("mapRefForId('MAP3')[0][8]"), g.run('PATH'), 'MAP3[0][8] is PATH');
    assert.equal(g.run("mapRefForId('MAP3_N1')[14][8]"), g.run('PATH'), 'MAP3_N1[14][8] is PATH');
    assert.equal(g.run('isTileWalkable(PATH)'), true, 'PATH is base-walkable');
    assert.equal(g.run('TILE_PROPERTIES[PATH].isRoad'), true, 'PATH is a road tile');
    assert.equal(g.run('!!TILE_PROPERTIES[PATH].isTransition'), false, 'PATH is not a transition tile');
    // the retired point tiles no longer sit at either edge coordinate
    assert.notEqual(g.run("mapRefForId('MAP3')[0][8]"), g.run('FEN_N_EXIT'), 'no FEN_N_EXIT at MAP3[0][8]');
    assert.notEqual(g.run("mapRefForId('MAP3_N1')[14][8]"), g.run('FEN_N_ENTRANCE'), 'no FEN_N_ENTRANCE at MAP3_N1[14][8]');
    // and not placed anywhere else either
    assert.equal(g.run("(function(){var n=0;for(var id in MAP_CATALOG){var m=MAP_CATALOG[id].map;if(!Array.isArray(m))continue;for(var r=0;r<m.length;r++)for(var c=0;c<m[r].length;c++)if(m[r][c]===FEN_N_EXIT||m[r][c]===FEN_N_ENTRANCE)n++;}return n;})()"), 0, 'FEN_N_EXIT/ENTRANCE no longer placed on any map');

    // ── 3. Pair reclassifies NEEDS_REMAP -> ALIGNS; totals delta ────────────
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V['MAP3|north'], 'ALIGNS', 'MAP3.north is now ALIGNS');
    assert.equal(V['MAP3_N1|south'], 'ALIGNS', 'MAP3_N1.south is now ALIGNS');
    assert.equal(audit.seamReadiness.totals.ALIGNS, 26, 'ALIGNS 26 (every convertible overworld point crossing is now a continuous seam)');
    assert.equal(audit.seamReadiness.totals.BLOCKED, 4, 'BLOCKED 4 unchanged');
    assert.equal(audit.seamReadiness.totals.BORDER, 26, 'BORDER 26 unchanged');
    assert.equal(g.run('continuousSeamEntries().length'), 26, '26 eligible directed seams');
    // the new pair derives as two eligible directed seams
    assert.ok(g.run("!!eligibleContinuousSeam('MAP3','north')"), 'MAP3|north is an eligible seam');
    assert.ok(g.run("!!eligibleContinuousSeam('MAP3_N1','south')"), 'MAP3_N1|south is an eligible seam');
    // retired point-transition symbols/dispatch are gone
    assert.equal(g.run("typeof enterMap3N1"), 'undefined', 'enterMap3N1 wrapper removed');
    assert.equal(g.run("typeof exitMap3N1"), 'undefined', 'exitMap3N1 wrapper removed');

    // ── 4-9. Continuous northbound sustained crossing ───────────────────────
    {
      onMap3(g, true);
      g.run(`player.x=${COL8}; player.y=1.5*TILE; player.facing='up'; player.moving=false; combat.cooldown=200;; __reconcileCanonicalForTest();`);
      const startStep = g.run('player.step');
      g.hold('ArrowUp');
      let handoffs = 0, maxWorldD = 0, maxCamD = 0, zero = 0, framesRun = 0;
      let pw = worldY(g), pc = camY(g), pm = mapId(g);
      for (let i = 0; i < 60; i++) {
        g.frames(1); framesRun++;
        const w = worldY(g), c = camY(g), m = mapId(g);
        const dW = Math.abs(w - pw), dC = Math.abs(c - pc);
        maxWorldD = Math.max(maxWorldD, dW); maxCamD = Math.max(maxCamD, dC);
        if (dW < 1e-9 && m === pm) zero++;
        if (m !== pm) handoffs++;
        pw = w; pc = c; pm = m;
        if (m === 'MAP3_N1' && w < 5 * CH - 6) break; // crossed + advanced a few px into MAP3_N1
      }
      g.release('ArrowUp');
      assert.equal(mapId(g), 'MAP3_N1', 'northbound crossing lands in MAP3_N1');   // (4)
      assert.equal(handoffs, 1, 'exactly ONE activeMap handoff for the crossing'); // (6)
      assert.ok(maxWorldD <= 2 + 1e-9, 'player advances at most SPEED per frame (no double movement)'); // (6)
      assert.equal(zero, 0, 'no stuck frames while entering/clearing the seam');   // (5)
      assert.ok(maxCamD <= maxWorldD + 1e-9, 'camera delta never exceeds movement delta'); // (9)
      // (8) facing / step / cooldown preserved across the seamless handoff
      assert.equal(g.run("player.facing"), 'up', 'facing preserved across handoff');
      assert.ok(g.run('player.step') > startStep, 'animation step kept advancing (not reset)');
      assert.equal(g.run('combat.cooldown'), 200 - framesRun, 'encounter cooldown decremented normally, NOT reset by the handoff');
      // (8) fractional local position preserved (continuous, not snapped to an inset)
      const py = g.run('player.y');
      assert.ok(Math.abs(py - Math.round(py / 32) * 32 - 16) > 0.01 || py % 2 === 0, 'local position is continuous, not the legacy 13.5*TILE inset');
      assert.notEqual(g.run('player.y'), g.run('13.5*TILE'), 'did not snap to the legacy inset landing');
    }

    // ── 7. Standing-point handoff timing (center crosses the chunk boundary) ─
    {
      onMap3(g, true);
      g.run(`player.x=${COL8}; player.y=0.5*TILE; player.facing='up';; __reconcileCanonicalForTest();`); // one tile from the boundary
      // boundary between MAP3(2,5) and MAP3_N1(2,4) is worldY = 5*CH = 2400.
      g.hold('ArrowUp');
      let beforeMap = mapId(g), crossedAtWorldY = null, prevWorldY = worldY(g);
      for (let i = 0; i < 20; i++) {
        g.frames(1);
        if (mapId(g) !== beforeMap) { crossedAtWorldY = prevWorldY; break; }
        prevWorldY = worldY(g);
      }
      g.release('ArrowUp');
      assert.equal(mapId(g), 'MAP3_N1', 'crossed on the standing-point handoff');
      // handoff happens as the standing point passes worldY 2400 (within one SPEED step)
      assert.ok(worldY(g) <= 5 * CH && worldY(g) > 5 * CH - 4, 'handoff occurs as the centre crosses the chunk boundary (worldY ~2400), not before');
    }

    // ── 4(cont). Continuous southbound sustained crossing back ──────────────
    {
      onMap3(g, true);
      // start just inside MAP3_N1 near its south edge, walk south into MAP3
      g.run(`activeMap = mapRefForId('MAP3_N1'); player.x=${COL8}; player.y=13.5*TILE; player.facing='down';; __reconcileCanonicalForTest();`);
      g.hold('ArrowDown');
      let handoffs = 0, pm = mapId(g), maxD = 0, pw = worldY(g);
      for (let i = 0; i < 30; i++) { g.frames(1); const w = worldY(g), m = mapId(g); maxD = Math.max(maxD, Math.abs(w - pw)); if (m !== pm) handoffs++; pm = m; pw = w; if (m === 'MAP3') break; }
      g.release('ArrowDown');
      assert.equal(mapId(g), 'MAP3', 'southbound crossing lands back in MAP3');
      assert.equal(handoffs, 1, 'exactly one handoff southbound');
      assert.ok(maxD <= 2 + 1e-9, 'southbound advances at most SPEED per frame');
    }

    // ── 10. Immediate reversal before clearing the seam ─────────────────────
    {
      onMap3(g, true);
      g.run(`player.x=${COL8}; player.y=0.2*TILE; player.facing='up';; __reconcileCanonicalForTest();`); // right at the boundary
      g.hold('ArrowUp'); g.frames(1); g.release('ArrowUp'); // nudge into the seam / across
      g.hold('ArrowDown');
      for (let i = 0; i < 12; i++) g.frames(1);
      g.release('ArrowDown');
      // reversing pulls the player back onto solid ground with no soft-lock and a valid footprint
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'reversal leaves the player on a walkable footprint (no soft-lock)');
      assert.ok(['MAP3', 'MAP3_N1'].includes(mapId(g)), 'still on one of the two seam maps after reversal');
    }

    // ── 11. Movement parallel to the seam while straddling it ───────────────
    {
      onMap3(g, true);
      g.run(`player.x=${COL8}; player.y=0.4*TILE; player.facing='up';; __reconcileCanonicalForTest();`); // footprint straddles the seam row
      const beforeMap = mapId(g);
      g.hold('ArrowLeft'); for (let i = 0; i < 3; i++) g.frames(1); g.release('ArrowLeft');
      // col 7 is TREE at the edge, so parallel motion is blocked by terrain, not a crash/handoff
      assert.equal(mapId(g), beforeMap, 'parallel motion while straddling does not trigger a handoff');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'footprint stays valid straddling the seam');
    }

    // ── 12. One-tile corridor endpoints + blocked neighbouring columns ──────
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP3'); __reconcileCanonicalForTest(); return canWalk(8.5*TILE, 0.5*TILE);})()"), true, 'col 8 row 0 (corridor) is walkable on MAP3');
    assert.equal(g.run("canWalk(7.5*TILE, 0.5*TILE)"), false, 'col 7 row 0 is blocked (TREE)');
    assert.equal(g.run("canWalk(9.5*TILE, 0.5*TILE)"), false, 'col 9 row 0 is blocked (TREE)');
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP3_N1'); __reconcileCanonicalForTest(); return canWalk(8.5*TILE, 13.5*TILE);})()"), true, 'col 8 corridor is walkable on MAP3_N1');
    // the seam-edge (row 14) neighbouring columns are TREE on both maps
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP3_N1')[14][7])"), false, 'MAP3_N1[14][7] (col 7 edge) is blocked');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP3_N1')[14][9])"), false, 'MAP3_N1[14][9] (col 9 edge) is blocked');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP3')[0][7])"), false, 'MAP3[0][7] (col 7 edge) is blocked');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP3')[0][9])"), false, 'MAP3[0][9] (col 9 edge) is blocked');
    assert.equal(g.run("continuousSeamCrossingAt('MAP3', 2*512+7.5*TILE, 5*480-1)"), null, 'no eligible crossing at col 7 (outside the [8,8] seam)');
    assert.ok(g.run("!!continuousSeamCrossingAt('MAP3', 2*512+8.5*TILE, 5*480-1)"), 'eligible crossing exists at col 8');

    // ── 13. Continuous View OFF: functional reciprocal legacy travel + inset + cooldown ─
    {
      onMap3(g, false); // continuous OFF
      g.run(`player.x=${COL8}; player.y=1.5*TILE; player.facing='up'; combat.cooldown=0;; __reconcileCanonicalForTest();`);
      g.hold('ArrowUp'); let up = false; for (let i = 0; i < 40 && !up; i++) { g.frames(1); up = mapId(g) === 'MAP3_N1'; } g.release('ArrowUp');
      assert.ok(up, 'View off: northbound reaches MAP3_N1 via the legacy broad-edge path');
      assert.equal(g.run('player.y'), g.run('13.5*TILE'), 'legacy inset landing = one tile inside the south edge (row 13)');
      assert.ok(g.run('combat.cooldown') > 0, 'legacy edge transition applies the encounter cooldown');
      // reciprocal southbound
      g.run(`combat.cooldown=0; player.x=${COL8}; player.y=13.5*TILE; player.facing='down';; __reconcileCanonicalForTest();`);
      g.hold('ArrowDown'); let down = false; for (let i = 0; i < 40 && !down; i++) { g.frames(1); down = mapId(g) === 'MAP3'; } g.release('ArrowDown');
      assert.ok(down, 'View off: southbound reaches MAP3 via the legacy broad-edge path');
      assert.equal(g.run('player.y'), g.run('1.5*TILE'), 'legacy inset landing = one tile inside the north edge (row 1)');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'not stuck on the arrival edge');
      assert.ok(g.run('combat.cooldown') > 0, 'reciprocal legacy edge transition also applies cooldown');
    }

    // ── 14. Encounter pool is the canonical FAR pool on both sides ──────────
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP3'); player.x=6*TILE; player.y=6*TILE; __reconcileCanonicalForTest(); return currentEncounterPool()===FAR_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP3').encounterPool;})()"), true, 'MAP3 pool is FAR');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP3_N1'); player.x=6*TILE; player.y=6*TILE; __reconcileCanonicalForTest(); return currentEncounterPool()===FAR_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP3_N1').encounterPool;})()"), true, 'MAP3_N1 pool is FAR');

    // ── 15. No extra Math.random / combat start caused by the handoff ───────
    {
      onMap3(g, true);
      g.run(`player.x=${COL8}; player.y=0.5*TILE; player.facing='up';; __reconcileCanonicalForTest();`);
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
      assert.equal(r.rc, 0, 'no Math.random consumed on the crossing frames (debugMode + geographic gate)');
      assert.equal(r.sc, 0, 'no combat started by the handoff');
    }

    // ── 16. Save/load after crossing restores physical map + local position ─
    {
      const g2 = ctx();
      onMap3(g2, true);
      g2.run(`player.x=${COL8}; player.y=0.5*TILE; player.facing='up';; __reconcileCanonicalForTest();`);
      g2.hold('ArrowUp'); for (let i = 0; i < 20 && mapId(g2) !== 'MAP3_N1'; i++) g2.frames(1); g2.release('ArrowUp');
      assert.equal(mapId(g2), 'MAP3_N1', 'crossed before saving');
      const px = g2.run('player.x'), py = g2.run('player.y');
      g2.run('saveGame();');
      assert.equal(JSON.parse(g2.run("localStorage.getItem('verdantVale_save')")).version, 4, 'SAVE_VERSION stays 4');
      g2.run("activeMap = mapRefForId('MAP'); player.x=1; player.y=1;; __reconcileCanonicalForTest();"); // scramble
      g2.run('loadGame();');
      assert.equal(g2.run('mapIdForRef(activeMap)'), 'MAP3_N1', 'load restores the correct physical map');
      assert.ok(Math.abs(g2.run('player.x') - px) < 1 && Math.abs(g2.run('player.y') - py) < 1, 'load restores the local position');
    }

    // ── 17. Other seam classifications unchanged ────────────────────────────
    const otherPairs = [
      ['NORTH_BASIN_S_MAP', 'north'], ['NORTH_BASIN_S_MAP', 'west'], ['NORTH_BASIN_SW_MAP', 'north'],
      ['NORTH_BASIN_W_MAP', 'north'], ['MAP3_N1', 'north'], ['MAP3_N1', 'west'], ['RODDON_WAY_MAP', 'south'],
    ];
    for (const [m, d] of otherPairs) assert.ok(g.run(`!!eligibleContinuousSeam('${m}','${d}')`), `${m}|${d} still eligible`);
    assert.equal(V['MAP_N1|east'], 'BLOCKED', 'MAP_N1|east still BLOCKED');
    assert.equal(V['NORTH_BASIN_C_MAP|west'], 'BLOCKED', 'NB_C|west still BLOCKED');
    assert.ok(!audit.seamReadiness.totals.NEEDS_REMAP, 'no NEEDS_REMAP remains — every convertible point crossing has been converted');

    // ── 18. Synthetic blocked-edge validation fails (general terrain guard) ──
    // build a ROWS x COLS grid of GRASS(0), block one border cell, and confirm the
    // pure walkability guard reports it as an error condition.
    const badFrom = g.run(`(function(){
      var GR=GRASS, TR=TREE, R=[]; for(var r=0;r<ROWS;r++){var row=[];for(var c=0;c<COLS;c++)row.push(GR);R.push(row);}
      R[0][8]=TR; // block the north-edge source cell at col 8
      var res=continuousSeamEdgeWalkability(R, 'north', mapRefForId('MAP3_N1'), 'south', [8,8]);
      return JSON.stringify(res);
    })()`);
    assert.deepEqual(JSON.parse(badFrom), { ok: false, along: 8, side: 'source' }, 'a blocked SOURCE edge cell fails the guard');
    const badTo = g.run(`(function(){
      var GR=GRASS, TR=TREE, R=[]; for(var r=0;r<ROWS;r++){var row=[];for(var c=0;c<COLS;c++)row.push(GR);R.push(row);}
      R[ROWS-1][8]=TR; // block the reciprocal landing (south-edge) cell
      var res=continuousSeamEdgeWalkability(mapRefForId('MAP3'), 'north', R, 'south', [8,8]);
      return JSON.stringify(res);
    })()`);
    assert.deepEqual(JSON.parse(badTo), { ok: false, along: 8, side: 'landing' }, 'a blocked LANDING edge cell fails the guard');
    // the real pilot seam passes
    assert.deepEqual(JSON.parse(g.run("JSON.stringify(continuousSeamEdgeWalkability(mapRefForId('MAP3'),'north',mapRefForId('MAP3_N1'),'south',[8,8]))")), { ok: true }, 'the real pilot seam is base-walkable both edges');

    // ── 19. No runtime-state mutation from validation/audit helpers ─────────
    {
      g.run("resetLocationState(); activeMap=mapRefForId('MAP3'); player.x=100; player.y=120; __reconcileCanonicalForTest();; __reconcileCanonicalForTest();");
      const before = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y");
      g.run("continuousSeamEdgeWalkability(mapRefForId('MAP3'),'north',mapRefForId('MAP3_N1'),'south',[8,8]); validateContinuousSeams();");
      assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y"), before, 'validation helpers mutate no runtime state');
    }
  },
};
