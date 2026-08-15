'use strict';
// Thornmere Fen (MAP3, chunk 2,5) <-> Thornmere (MAP4, chunk 3,5) crossing converted
// from a MAP4_EXIT/MAP4_ENTRANCE point transition to a structural EDGE_TRANSITIONS
// seam: MAP3.east <-> MAP4.west, the single row-6 crossing, sourceRange [6,6].
//
// Seam-specific facts this focused test covers (the generic seamless/handoff/legacy
// machinery is already exercised by tests 77 & 79):
//   • ASYMMETRIC replacement terrain — PATH on the MAP3 side, GRASS on the MAP4 shore.
//   • COOLDOWN PARITY — the retired enterMap4/exitMap4 BOTH applied cooldown:true, and
//     the generic legacy broad-edge path also applies it, so behaviour is identical in
//     both modes (Continuous View on never resets it; off applies it, as before).
//   • Encounter ownership flips FAR_ENEMY_TEMPLATES <-> THORNMERE_ENEMY_TEMPLATES
//     exactly at the standing-point handoff.
//   • The Thornmere Standing Stone (MAP4 lake island, col 7) stays world-locked, draws
//     exactly once as a neighbour, and its prompt/interaction remain active-map-only.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const CW = 512, CH = 480;
const ROW6 = 6.5 * 32; // centred in the one-tile corridor (row 6)

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
const worldX = (g) => g.run(`(function(){var p=regionPlacementForMapId(mapIdForRef(activeMap)); return p.chunkX*${CW}+player.x;})()`);
const camX = (g) => { const pl = g.run("JSON.stringify((function(){var c=regionalWorldPosition();return c?buildContinuousWorldPlanFromWorld(c.regionId,c.worldPxX,c.worldPxY,512,480):null;})())"); const o = JSON.parse(pl); return o ? o.camPxX : null; };
const pool = (g) => g.run('(currentEncounterPool()===FAR_ENEMY_TEMPLATES?"FAR":currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES?"THORN":"OTHER")');

module.exports = {
  name: 'MAP3<->MAP4 Thornmere seam: asymmetric terrain, cooldown parity, pool handoff, world-locked Standing Stone',
  run() {
    const g = ctx();
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Exact reciprocal segment definitions + [6,6] ranges ──────────────
    const e3 = J("JSON.stringify(EDGE_TRANSITIONS['MAP3'].east)");
    const w4 = J("JSON.stringify(EDGE_TRANSITIONS['MAP4'].west)");
    assert.equal(e3.length, 1, 'MAP3.east is a single segment');
    assert.deepEqual({ t: e3[0].targetMap, e: e3[0].targetEdge, r: e3[0].sourceRange }, { t: 'MAP4', e: 'west', r: [6, 6] }, 'MAP3.east -> MAP4.west [6,6]');
    assert.deepEqual({ t: w4[0].targetMap, e: w4[0].targetEdge, r: w4[0].sourceRange }, { t: 'MAP3', e: 'east', r: [6, 6] }, 'MAP4.west -> MAP3.east [6,6]');
    assert.equal(e3[0].targetRange, undefined, 'no targetRange on MAP3.east (non-remapping)');
    assert.equal(w4[0].targetRange, undefined, 'no targetRange on MAP4.west');
    assert.deepEqual(Object.keys(e3[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'MAP3.east seg has only structural keys');
    assert.deepEqual(Object.keys(w4[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'MAP4.west seg has only structural keys');

    // ── 2. ASYMMETRIC edge cells: PATH on MAP3, GRASS on MAP4 ───────────────
    assert.equal(g.run("mapRefForId('MAP3')[6][15]"), g.run('PATH'), 'MAP3[6][15] is PATH (road continues)');
    assert.equal(g.run("mapRefForId('MAP4')[6][0]"), g.run('GRASS'), 'MAP4[6][0] is GRASS (shore begins)');
    assert.notEqual(g.run('PATH'), g.run('GRASS'), 'the two sides use DIFFERENT ordinary terrain');
    assert.equal(g.run('isTileWalkable(PATH) && isTileWalkable(GRASS)'), true, 'both replacement tiles are base-walkable');
    assert.equal(g.run('!!TILE_PROPERTIES[PATH].isTransition || !!TILE_PROPERTIES[GRASS].isTransition'), false, 'neither replacement is a transition tile');
    // retired point tiles no longer placed anywhere (constants retained, unplaced)
    assert.notEqual(g.run("mapRefForId('MAP3')[6][15]"), g.run('MAP4_EXIT'), 'no MAP4_EXIT at MAP3[6][15]');
    assert.notEqual(g.run("mapRefForId('MAP4')[6][0]"), g.run('MAP4_ENTRANCE'), 'no MAP4_ENTRANCE at MAP4[6][0]');
    assert.equal(g.run("(function(){var n=0;for(var id in MAP_CATALOG){var m=MAP_CATALOG[id].map;if(!Array.isArray(m))continue;for(var r=0;r<m.length;r++)for(var c=0;c<m[r].length;c++)if(m[r][c]===MAP4_EXIT||m[r][c]===MAP4_ENTRANCE)n++;}return n;})()"), 0, 'MAP4_EXIT/ENTRANCE no longer placed on any map');

    // ── 3. Pair reclassifies to ALIGNS; retired dispatch gone ──────────────
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V['MAP3|east'], 'ALIGNS', 'MAP3.east is now ALIGNS');
    assert.equal(V['MAP4|west'], 'ALIGNS', 'MAP4.west is now ALIGNS');
    assert.ok(g.run("!!eligibleContinuousSeam('MAP3','east') && !!eligibleContinuousSeam('MAP4','west')"), 'both directed seams are eligible');
    assert.equal(g.run('typeof enterMap4'), 'undefined', 'enterMap4 wrapper removed');
    assert.equal(g.run('typeof exitMap4'), 'undefined', 'exitMap4 wrapper removed');
    assert.equal(g.run("REGIONAL_POINT_CROSSINGS.filter(function(c){return (c.from==='MAP3'&&c.to==='MAP4')||(c.from==='MAP4'&&c.to==='MAP3');}).length"), 0, 'MAP3<->MAP4 removed from REGIONAL_POINT_CROSSINGS');

    // ── 4-9. Continuous eastbound sustained crossing (+ pool + cooldown) ────
    {
      onMap3(g, true);
      g.run(`player.x=14.5*TILE; player.y=${ROW6}; player.facing='left'; player.moving=false; combat.cooldown=200;; __reconcileCanonicalForTest();`);
      assert.equal(mapId(g), 'MAP3', 'start on MAP3 (Thornmere Fen)');
      assert.equal(pool(g), 'FAR', 'MAP3 side owns FAR_ENEMY_TEMPLATES before the crossing');
      const startStep = g.run('player.step');
      g.hold('ArrowRight');
      let handoffs = 0, poolFlips = 0, maxWorldD = 0, maxCamD = 0, zero = 0, framesRun = 0;
      let pw = worldX(g), pc = camX(g), pm = mapId(g), pp = pool(g);
      for (let i = 0; i < 60; i++) {
        g.frames(1); framesRun++;
        const w = worldX(g), c = camX(g), m = mapId(g), pl = pool(g);
        const dW = Math.abs(w - pw), dC = Math.abs(c - pc);
        maxWorldD = Math.max(maxWorldD, dW); maxCamD = Math.max(maxCamD, dC);
        if (dW < 1e-9 && m === pm) zero++;
        if (m !== pm) handoffs++;
        if (pl !== pp) poolFlips++;
        pw = w; pc = c; pm = m; pp = pl;
        if (m === 'MAP4' && w > 3 * CW + 6) break; // crossed + advanced into MAP4
      }
      g.release('ArrowRight');
      assert.equal(mapId(g), 'MAP4', 'eastbound crossing lands in MAP4 (Thornmere)');    // (4)
      assert.equal(handoffs, 1, 'exactly ONE activeMap handoff for the crossing');        // (6)
      assert.equal(poolFlips, 1, 'encounter pool ownership flips exactly once, at the handoff');
      assert.equal(pool(g), 'THORN', 'MAP4 side owns THORNMERE_ENEMY_TEMPLATES after the crossing');
      assert.ok(maxWorldD <= 2 + 1e-9, 'player advances at most SPEED per frame (no double movement)'); // (6)
      assert.equal(zero, 0, 'no stuck frames while entering/clearing the seam');           // (5)
      assert.ok(maxCamD <= maxWorldD + 1e-9, 'camera delta never exceeds movement delta'); // (9)
      assert.equal(g.run('player.facing'), 'right', 'facing preserved across handoff');    // (8)
      assert.ok(g.run('player.step') > startStep, 'animation step kept advancing (not reset)');
      assert.equal(g.run('combat.cooldown'), 200 - framesRun, 'cooldown decremented normally, NOT reset by the seamless handoff');
      const px = g.run('player.x');
      assert.ok(px < g.run('1.5*TILE'), 'landed near the MAP4 west edge (continuous), not the legacy col-1 inset');
      assert.notEqual(px, g.run('1.5*TILE'), 'did not snap to the legacy inset landing');
    }

    // ── 7. Standing-point handoff timing (centre crosses the chunk boundary) ─
    {
      onMap3(g, true);
      g.run(`player.x=15.5*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`); // half a tile from the boundary
      g.hold('ArrowRight');
      let beforeMap = mapId(g);
      for (let i = 0; i < 20; i++) { g.frames(1); if (mapId(g) !== beforeMap) break; }
      g.release('ArrowRight');
      assert.equal(mapId(g), 'MAP4', 'crossed on the standing-point handoff');
      // boundary between MAP3(2,5) and MAP4(3,5) is worldX = 3*CW = 1536.
      assert.ok(worldX(g) >= 3 * CW && worldX(g) < 3 * CW + 4, 'handoff occurs as the centre crosses the chunk boundary (worldX ~1536)');
    }

    // ── 6/8. Continuous westbound crossing back (+ pool flip back) ──────────
    {
      onMap3(g, true);
      g.run(`activeMap = mapRefForId('MAP4'); player.x=1.5*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      assert.equal(pool(g), 'THORN', 'MAP4 side owns THORN before westbound crossing');
      g.hold('ArrowLeft');
      let handoffs = 0, pm = mapId(g), maxD = 0, pw = worldX(g);
      for (let i = 0; i < 30; i++) { g.frames(1); const w = worldX(g), m = mapId(g); maxD = Math.max(maxD, Math.abs(w - pw)); if (m !== pm) handoffs++; pm = m; pw = w; if (m === 'MAP3') break; }
      g.release('ArrowLeft');
      assert.equal(mapId(g), 'MAP3', 'westbound crossing lands back in MAP3');
      assert.equal(handoffs, 1, 'exactly one handoff westbound');
      assert.equal(pool(g), 'FAR', 'MAP3 side owns FAR again after westbound crossing');
      assert.ok(maxD <= 2 + 1e-9, 'westbound advances at most SPEED per frame');
    }

    // ── 10-11. Reversal, parallel, and diagonal movement at the seam ────────
    {
      onMap3(g, true);
      g.run(`player.x=15.8*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      g.hold('ArrowRight'); g.frames(1); g.release('ArrowRight'); // nudge across
      g.hold('ArrowLeft'); for (let i = 0; i < 12; i++) g.frames(1); g.release('ArrowLeft');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'reversal leaves the player on a walkable footprint (no soft-lock)');
      assert.ok(['MAP3', 'MAP4'].includes(mapId(g)), 'still on one of the two seam maps after reversal');
      // parallel (vertical) motion while straddling: rows 5 & 7 at the edge are blocked
      onMap3(g, true);
      g.run(`player.x=15.6*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      const bm = mapId(g);
      g.hold('ArrowUp'); for (let i = 0; i < 3; i++) g.frames(1); g.release('ArrowUp');
      assert.equal(mapId(g), bm, 'parallel motion while straddling does not trigger a handoff');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'footprint stays valid straddling the seam');
      // diagonal crossing (up+right): vertical blocked by edge TREE, horizontal still crosses cleanly
      onMap3(g, true);
      g.run(`player.x=14.5*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      let dh = 0, dpm = mapId(g);
      g.hold('ArrowRight'); g.hold('ArrowUp');
      for (let i = 0; i < 40; i++) { g.frames(1); if (mapId(g) !== dpm) dh++; dpm = mapId(g); if (mapId(g) === 'MAP4') break; }
      g.release('ArrowUp'); // drop the vertical component, then clear the seam eastward along row 6
      g.hold('ArrowRight'); for (let i = 0; i < 15 && worldX(g) < 3 * CW + 20; i++) g.frames(1); g.release('ArrowRight');
      assert.equal(mapId(g), 'MAP4', 'diagonal up+right still crosses east into MAP4');
      assert.equal(dh, 1, 'diagonal crossing is still a single handoff');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'no soft-lock after the diagonal crossing (player clears the seam eastward)');
    }

    // ── 12. One-tile corridor endpoints + blocked neighbouring rows ─────────
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP3'); __reconcileCanonicalForTest(); return canWalk(15.5*TILE, 6.5*TILE);})()"), true, 'MAP3 col 15 row 6 (corridor) is walkable');
    assert.equal(g.run("canWalk(15.5*TILE, 5.5*TILE)"), false, 'MAP3 col 15 row 5 is blocked');
    assert.equal(g.run("canWalk(15.5*TILE, 7.5*TILE)"), false, 'MAP3 col 15 row 7 is blocked');
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP4'); __reconcileCanonicalForTest(); return canWalk(0.5*TILE, 6.5*TILE);})()"), true, 'MAP4 col 0 row 6 (corridor) is walkable');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP4')[5][0])"), false, 'MAP4[5][0] (col 0 row 5) is blocked (TREE)');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP4')[7][0])"), false, 'MAP4[7][0] (col 0 row 7) is blocked (WATER)');
    assert.equal(g.run(`continuousSeamCrossingAt('MAP3', 3*512+1, 5*480+5.5*TILE)`), null, 'no eligible crossing at row 5 (outside the [6,6] seam)');
    assert.ok(g.run(`!!continuousSeamCrossingAt('MAP3', 3*512+1, 5*480+6.5*TILE)`), 'eligible crossing exists at row 6');

    // ── 13. Continuous View OFF: reciprocal legacy travel + inset + COOLDOWN PARITY ─
    // The retired enterMap4/exitMap4 BOTH applied cooldown:true; the generic legacy edge
    // path also applies cooldown:true — so behaviour is identical to the old wrappers.
    {
      onMap3(g, false);
      g.run(`player.x=14.5*TILE; player.y=${ROW6}; player.facing='right'; combat.cooldown=0;; __reconcileCanonicalForTest();`);
      g.hold('ArrowRight'); let east = false; for (let i = 0; i < 40 && !east; i++) { g.frames(1); east = mapId(g) === 'MAP4'; } g.release('ArrowRight');
      assert.ok(east, 'View off: eastbound reaches MAP4 via the legacy broad-edge path');
      assert.equal(g.run('player.x'), g.run('1.5*TILE'), 'legacy inset landing = col 1 (same coords as the old enterMap4)');
      assert.ok(g.run('combat.cooldown') > 0, 'legacy edge transition applies the encounter cooldown (parity with the retired enterMap4)');
      g.run(`combat.cooldown=0; player.x=1.5*TILE; player.y=${ROW6}; player.facing='left';; __reconcileCanonicalForTest();`);
      g.hold('ArrowLeft'); let west = false; for (let i = 0; i < 40 && !west; i++) { g.frames(1); west = mapId(g) === 'MAP3'; } g.release('ArrowLeft');
      assert.ok(west, 'View off: westbound reaches MAP3 via the legacy broad-edge path');
      assert.equal(g.run('player.x'), g.run('14.5*TILE'), 'legacy inset landing = col 14 (same coords as the old exitMap4)');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'not stuck on the arrival edge');
      assert.ok(g.run('combat.cooldown') > 0, 'reciprocal legacy edge transition also applies cooldown (parity with the retired exitMap4)');
    }

    // ── 14. Encounter pools are the canonical (distinct) pools on each side ──
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP3'); player.x=6*TILE; player.y=6*TILE; __reconcileCanonicalForTest(); return currentEncounterPool()===FAR_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP3').encounterPool;})()"), true, 'MAP3 pool is FAR_ENEMY_TEMPLATES');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP4'); player.x=6*TILE; player.y=2*TILE; __reconcileCanonicalForTest(); return currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP4').encounterPool;})()"), true, 'MAP4 pool is THORNMERE_ENEMY_TEMPLATES');

    // ── 15. No extra Math.random / combat start caused by the handoff ───────
    {
      onMap3(g, true);
      g.run(`player.x=15.5*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      const res = g.run(`(function(){
        var rc=0,_r=Math.random; Math.random=function(){rc++; return _r();};
        var sc=0,_sc=startCombat; startCombat=function(){sc++;};
        var before=mapIdForRef(activeMap);
        for (var k in keys) delete keys[k]; keys['ArrowRight']=true;
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

    // ── 16. Thornmere Standing Stone: world-locked, single instance, active-only prompt ─
    // The stone body is the sole authority OUTDOOR_MAP_DECOR.MAP4 (drawn once per chunk,
    // at LOCAL coords — no activeMap read); the SPACE hint + interaction gate on MAP4.
    assert.equal(g.run("typeof OUTDOOR_MAP_DECOR.MAP4"), 'function', 'MAP4 has a world-locked static-decor body (the Standing Stone)');
    assert.ok(g.run("THORNMERE_STONE.x/TILE >= 7 && THORNMERE_STONE.y/TILE >= 6"), 'the stone sits well inside MAP4 (col ~7, row ~6), far from the col-0 seam');
    {
      // standing on MAP3 with MAP4 visible as a neighbour: the stone body renders EXACTLY
      // once (world-locked, no duplicate), and NO active-only SPACE hint shows.
      onMap3(g, true);
      g.run(`player.x=15*TILE; player.y=${ROW6};; __reconcileCanonicalForTest();`);
      const s = JSON.parse(g.run(`(function(){
        var n=0,_d=OUTDOOR_MAP_DECOR.MAP4; OUTDOOR_MAP_DECOR.MAP4=function(){ n++; return _d.apply(null,arguments); };
        var hint=false,_ft=ctx.fillText; ctx.fillText=function(t){ if(t==='SPACE') hint=true; return _ft&&_ft.apply(ctx,arguments); };
        try { render(); } finally { OUTDOOR_MAP_DECOR.MAP4=_d; ctx.fillText=_ft; }
        return JSON.stringify({decorCalls:n, hint:hint, active:mapIdForRef(activeMap)});
      })()`));
      assert.equal(s.active, 'MAP3', 'still active on MAP3 for the neighbour-render check');
      assert.equal(s.decorCalls, 1, 'stone body renders exactly ONCE as a world-locked neighbour (no duplicate at the seam)');
      assert.equal(s.hint, false, 'no active-only SPACE hint while MAP4 is merely a neighbour');
    }
    // the neighbour-content path never draws the ACTIVE chunk's decor (belt-and-suspenders no-dupe)
    assert.equal(g.run(`(function(){ var n=0,_d=OUTDOOR_MAP_DECOR.MAP4; OUTDOOR_MAP_DECOR.MAP4=function(){n++;}; try { drawNeighbourOutdoorContent(outdoorChunkContentContext('MAP4', true)); } finally { OUTDOOR_MAP_DECOR.MAP4=_d; } return n; })()`), 0, 'neighbour content skips the active chunk (no duplicate stone)');
    // active-only wrapper draws nothing when MAP4 is not active
    assert.equal(g.run(`(function(){ activeMap=mapRefForId('MAP3'); var n=0,_b=drawThornmereStoneBody; drawThornmereStoneBody=function(){n++;}; try { drawThornmereStone(); } finally { drawThornmereStoneBody=_b; } return n; })()`), 0, 'drawThornmereStone() (active-only path) draws nothing when MAP4 is not active');
    // interaction/prompt is active-map-only
    assert.equal(g.run(`(function(){ activeMap=mapRefForId('MAP3'); choice.open=false; player.x=THORNMERE_STONE.x; player.y=THORNMERE_STONE.y; interactThornmereStone(); return choice.open; })()`), false, 'stone interaction does NOT open from the MAP3 side, even at the stone coords');
    assert.equal(g.run(`(function(){ activeMap=mapRefForId('MAP4'); choice.open=false; player.x=THORNMERE_STONE.x; player.y=THORNMERE_STONE.y; interactThornmereStone(); return choice.open; })()`), true, 'stone interaction opens on the active MAP4 side at the stone coords');

    // ── 17. Save/load after crossing restores physical map + local position ─
    {
      const g2 = ctx();
      onMap3(g2, true);
      g2.run(`player.x=15.5*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      g2.hold('ArrowRight'); for (let i = 0; i < 20 && mapId(g2) !== 'MAP4'; i++) g2.frames(1); g2.release('ArrowRight');
      assert.equal(mapId(g2), 'MAP4', 'crossed before saving');
      const px = g2.run('player.x'), py = g2.run('player.y');
      g2.run('saveGame();');
      assert.equal(JSON.parse(g2.run("localStorage.getItem('verdantVale_save')")).version, 4, 'SAVE_VERSION stays 4');
      g2.run("activeMap = mapRefForId('MAP'); player.x=1; player.y=1;; __reconcileCanonicalForTest();");
      g2.run('loadGame();');
      assert.equal(g2.run('mapIdForRef(activeMap)'), 'MAP4', 'load restores the correct physical map');
      assert.ok(Math.abs(g2.run('player.x') - px) < 1 && Math.abs(g2.run('player.y') - py) < 1, 'load restores the local position');
    }

    // ── 18. Seam edge base-walkability guard passes for the ASYMMETRIC seam ──
    assert.deepEqual(JSON.parse(g.run("JSON.stringify(continuousSeamEdgeWalkability(mapRefForId('MAP3'),'east',mapRefForId('MAP4'),'west',[6,6]))")), { ok: true }, 'the real MAP3(PATH)<->MAP4(GRASS) seam is base-walkable both edges');
  },
};
