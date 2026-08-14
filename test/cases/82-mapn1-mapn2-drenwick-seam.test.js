'use strict';
// Northern Road (MAP_N1, chunk 0,4) <-> Drenwick Approach (MAP_N2, chunk 0,3) crossing
// converted from a NORTH2_EXIT/NORTH2_ENTRANCE point transition to a structural
// EDGE_TRANSITIONS seam: MAP_N1.north <-> MAP_N2.south, the single col-7 PATH,
// sourceRange [7,7]. A NORTH/SOUTH (vertical) seam, mirror of the MAP3<->MAP3_N1 pilot.
//
// Seam-specific facts this focused test covers (the generic seamless/handoff/legacy
// machinery is already exercised by tests 77, 79, 80 & 81):
//   • Column-7 PATH corridor; the rest of both shared edges is forest wall, so ONLY
//     column 7 crosses.
//   • COOLDOWN PARITY — the retired enterMapN2/exitMapN2 BOTH applied cooldown:true and
//     the generic legacy edge path also applies it (identical in both modes).
//   • SAME pool (FAR_ENEMY_TEMPLATES) on both sides — no pool change on the crossing.
//   • Pale Sentry stays MAP_N2-only + quest-flag gated: eligible only AFTER the
//     standing-point handoff onto MAP_N2, never on the MAP_N1 side.
//   • The sealed Drenwick gate body stays world-locked (renders once when MAP_N2 is
//     visible from MAP_N1); its SPACE hint stays active-MAP_N2-only.
//   • MAP <-> MAP_N1 (the Verdant Vale legacy boundary) stays INTENTIONAL_DISCRETE.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const CW = 512, CH = 480;
const COL7 = 7.5 * 32; // centred in the one-tile corridor (column 7)

function ctx() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}
function onMapN1(g, cont) {
  g.run(`debugWarpToDestination('outdoor:MAP_N1');
         dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;
         combat.active=false; combat.cooldown=0; debugMode=true; continuousWorldViewEnabled=${cont};
         for (var k in keys) delete keys[k];`);
}
const mapId = (g) => g.run('mapIdForRef(activeMap)');
const worldY = (g) => g.run(`(function(){var p=regionPlacementForMapId(mapIdForRef(activeMap)); return p.chunkY*${CH}+player.y;})()`);
const camY = (g) => { const pl = g.run("JSON.stringify(buildContinuousWorldPlan('overworld', mapIdForRef(activeMap), player.x, player.y, 512, 480))"); const o = JSON.parse(pl); return o ? o.camPxY : null; };
const pool = (g) => g.run('(currentEncounterPool()===FAR_ENEMY_TEMPLATES?"FAR":"OTHER")');

module.exports = {
  name: 'MAP_N1<->MAP_N2 Drenwick seam: col-7 vertical seam, cooldown parity, same pool, Pale Sentry + sealed gate gating',
  run() {
    const g = ctx();
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Exact reciprocal segment definitions + [7,7] ranges ──────────────
    const n1 = J("JSON.stringify(EDGE_TRANSITIONS['MAP_N1'].north)");
    const s2 = J("JSON.stringify(EDGE_TRANSITIONS['MAP_N2'].south)");
    assert.equal(n1.length, 1, 'MAP_N1.north is a single segment');
    assert.deepEqual({ t: n1[0].targetMap, e: n1[0].targetEdge, r: n1[0].sourceRange }, { t: 'MAP_N2', e: 'south', r: [7, 7] }, 'MAP_N1.north -> MAP_N2.south [7,7]');
    assert.deepEqual({ t: s2[0].targetMap, e: s2[0].targetEdge, r: s2[0].sourceRange }, { t: 'MAP_N1', e: 'north', r: [7, 7] }, 'MAP_N2.south -> MAP_N1.north [7,7]');
    assert.equal(n1[0].targetRange, undefined, 'no targetRange on MAP_N1.north');
    assert.equal(s2[0].targetRange, undefined, 'no targetRange on MAP_N2.south');
    assert.deepEqual(Object.keys(n1[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'MAP_N1.north seg has only structural keys');
    assert.deepEqual(Object.keys(s2[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'MAP_N2.south seg has only structural keys');

    // ── 2. Both edge cells are PATH; the rest of each edge stays blocked ────
    assert.equal(g.run("mapRefForId('MAP_N1')[0][7]"), g.run('PATH'), 'MAP_N1[0][7] is PATH');
    assert.equal(g.run("mapRefForId('MAP_N2')[14][7]"), g.run('PATH'), 'MAP_N2[14][7] is PATH');
    assert.equal(g.run('!!TILE_PROPERTIES[PATH].isTransition'), false, 'PATH is not a transition tile');
    assert.notEqual(g.run("mapRefForId('MAP_N1')[0][7]"), g.run('NORTH2_EXIT'), 'no NORTH2_EXIT at MAP_N1[0][7]');
    assert.notEqual(g.run("mapRefForId('MAP_N2')[14][7]"), g.run('NORTH2_ENTRANCE'), 'no NORTH2_ENTRANCE at MAP_N2[14][7]');
    assert.equal(g.run("(function(){var n=0;for(var id in MAP_CATALOG){var m=MAP_CATALOG[id].map;if(!Array.isArray(m))continue;for(var r=0;r<m.length;r++)for(var c=0;c<m[r].length;c++)if(m[r][c]===NORTH2_EXIT||m[r][c]===NORTH2_ENTRANCE)n++;}return n;})()"), 0, 'NORTH2_EXIT/ENTRANCE no longer placed on any map');
    assert.deepEqual(J("JSON.stringify((function(){var o=[];for(var c=0;c<16;c++)if(isTileWalkable(mapRefForId('MAP_N1')[0][c]))o.push(c);return o;})())"), [7], 'MAP_N1 north edge is walkable ONLY at column 7');
    assert.deepEqual(J("JSON.stringify((function(){var o=[];for(var c=0;c<16;c++)if(isTileWalkable(mapRefForId('MAP_N2')[14][c]))o.push(c);return o;})())"), [7], 'MAP_N2 south edge is walkable ONLY at column 7');
    // the col-7 SOUTH edge of MAP_N1 (NORTH_ENTRANCE, the MAP legacy boundary) is untouched
    assert.equal(g.run("mapRefForId('MAP_N1')[14][7]"), g.run('NORTH_ENTRANCE'), 'MAP_N1[14][7] is still NORTH_ENTRANCE (Verdant Vale boundary untouched)');

    // ── 3. Pair reclassifies to ALIGNS; legacy boundary preserved; dispatch gone ─
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V['MAP_N1|north'], 'ALIGNS', 'MAP_N1.north is now ALIGNS');
    assert.equal(V['MAP_N2|south'], 'ALIGNS', 'MAP_N2.south is now ALIGNS');
    assert.equal(V['MAP|north'], 'INTENTIONAL_DISCRETE', 'MAP.north stays INTENTIONAL_DISCRETE');
    assert.equal(V['MAP_N1|south'], 'INTENTIONAL_DISCRETE', 'MAP_N1.south (the MAP<->MAP_N1 boundary) stays INTENTIONAL_DISCRETE');
    assert.equal(g.run('typeof enterMapN2'), 'undefined', 'enterMapN2 wrapper removed');
    assert.equal(g.run('typeof exitMapN2'), 'undefined', 'exitMapN2 wrapper removed');
    assert.equal(g.run("REGIONAL_POINT_CROSSINGS.filter(function(c){return (c.from==='MAP_N1'&&c.to==='MAP_N2')||(c.from==='MAP_N2'&&c.to==='MAP_N1');}).length"), 0, 'MAP_N1<->MAP_N2 removed from REGIONAL_POINT_CROSSINGS');

    // ── 4-9. Continuous northbound sustained crossing (SAME pool, cooldown ticks) ─
    {
      onMapN1(g, true);
      g.run(`player.x=${COL7}; player.y=1.5*TILE; player.facing='down'; player.moving=false; combat.cooldown=200;`);
      assert.equal(mapId(g), 'MAP_N1', 'start on MAP_N1 (Northern Road)');
      assert.equal(pool(g), 'FAR', 'MAP_N1 side owns FAR before the crossing');
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
        if (m === 'MAP_N2' && w < 4 * CH - 6) break; // crossed + advanced into MAP_N2
      }
      g.release('ArrowUp');
      assert.equal(mapId(g), 'MAP_N2', 'northbound crossing lands in MAP_N2 (Drenwick Approach)'); // (4)
      assert.equal(handoffs, 1, 'exactly ONE activeMap handoff for the crossing');                 // (6)
      assert.equal(poolFlips, 0, 'pool never changes — FAR on both sides');
      assert.equal(pool(g), 'FAR', 'MAP_N2 side still owns FAR after the crossing');
      assert.ok(maxWorldD <= 2 + 1e-9, 'player advances at most SPEED per frame (no double movement)'); // (6)
      assert.equal(zero, 0, 'no stuck frames while entering/clearing the seam');                    // (5)
      assert.ok(maxCamD <= maxWorldD + 1e-9, 'camera delta never exceeds movement delta');          // (9)
      assert.equal(g.run('player.facing'), 'up', 'facing preserved across handoff');                // (8)
      assert.ok(g.run('player.step') > startStep, 'animation step kept advancing (not reset)');
      assert.equal(g.run('combat.cooldown'), 200 - framesRun, 'cooldown decremented normally, NOT reset by the seamless handoff');
      const py = g.run('player.y');
      assert.ok(py > g.run('13.5*TILE'), 'landed near the MAP_N2 south edge (continuous), not the legacy row-13 inset');
      assert.notEqual(py, g.run('13.5*TILE'), 'did not snap to the legacy inset landing');
    }

    // ── 7. Standing-point handoff timing (centre crosses the chunk boundary) ─
    {
      onMapN1(g, true);
      g.run(`player.x=${COL7}; player.y=0.5*TILE; player.facing='up';`); // half a tile from the boundary
      g.hold('ArrowUp');
      let beforeMap = mapId(g);
      for (let i = 0; i < 20; i++) { g.frames(1); if (mapId(g) !== beforeMap) break; }
      g.release('ArrowUp');
      assert.equal(mapId(g), 'MAP_N2', 'crossed on the standing-point handoff');
      // boundary between MAP_N1(0,4) and MAP_N2(0,3) is worldY = 4*CH = 1920.
      assert.ok(worldY(g) <= 4 * CH && worldY(g) > 4 * CH - 4, 'handoff occurs as the centre crosses the chunk boundary (worldY ~1920)');
    }

    // ── 6/8. Continuous southbound crossing back (still SAME pool) ──────────
    {
      onMapN1(g, true);
      g.run(`activeMap = mapRefForId('MAP_N2'); player.x=${COL7}; player.y=13.5*TILE; player.facing='down';`);
      assert.equal(pool(g), 'FAR', 'MAP_N2 side owns FAR before southbound crossing');
      g.hold('ArrowDown');
      let handoffs = 0, pm = mapId(g), maxD = 0, pw = worldY(g);
      for (let i = 0; i < 30; i++) { g.frames(1); const w = worldY(g), m = mapId(g); maxD = Math.max(maxD, Math.abs(w - pw)); if (m !== pm) handoffs++; pm = m; pw = w; if (m === 'MAP_N1') break; }
      g.release('ArrowDown');
      assert.equal(mapId(g), 'MAP_N1', 'southbound crossing lands back in MAP_N1');
      assert.equal(handoffs, 1, 'exactly one handoff southbound');
      assert.equal(pool(g), 'FAR', 'MAP_N1 side still owns FAR after southbound crossing');
      assert.ok(maxD <= 2 + 1e-9, 'southbound advances at most SPEED per frame');
    }

    // ── 10-11. Reversal, parallel, and diagonal movement at the seam ────────
    {
      onMapN1(g, true);
      g.run(`player.x=${COL7}; player.y=0.2*TILE; player.facing='up';`);
      g.hold('ArrowUp'); g.frames(1); g.release('ArrowUp'); // nudge across
      g.hold('ArrowDown'); for (let i = 0; i < 12; i++) g.frames(1); g.release('ArrowDown');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'reversal leaves the player on a walkable footprint (no soft-lock)');
      assert.ok(['MAP_N1', 'MAP_N2'].includes(mapId(g)), 'still on one of the two seam maps after reversal');
      // parallel (horizontal) motion while straddling: cols 6 & 8 at the edge are blocked
      onMapN1(g, true);
      g.run(`player.x=${COL7}; player.y=0.4*TILE; player.facing='up';`);
      const bm = mapId(g);
      g.hold('ArrowLeft'); for (let i = 0; i < 3; i++) g.frames(1); g.release('ArrowLeft');
      assert.equal(mapId(g), bm, 'parallel motion while straddling does not trigger a handoff');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'footprint stays valid straddling the seam');
      // diagonal (up+left) near the col-7 gate: the horizontal component decenters off
      // the one-tile corridor, so the player slides west along row 1 and canNOT squeeze
      // through the gap diagonally — correct collision, no soft-lock.
      onMapN1(g, true);
      g.run(`player.x=${COL7}; player.y=1.5*TILE; player.facing='up';`);
      g.hold('ArrowUp'); g.hold('ArrowLeft'); for (let i = 0; i < 10; i++) g.frames(1); g.release('ArrowUp'); g.release('ArrowLeft');
      assert.equal(mapId(g), 'MAP_N1', 'diagonal off the corridor centre does not squeeze through the one-tile gate');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'diagonal movement leaves a valid footprint (no soft-lock)');
      assert.ok(g.run('player.x') < COL7, 'the horizontal component slid the player off the corridor centre (moved, not stuck)');
      // recentred on col 7, pure north crosses cleanly with one handoff
      g.run(`player.x=${COL7}; player.y=1.5*TILE;`);
      let dh = 0, dpm = mapId(g);
      g.hold('ArrowUp'); for (let i = 0; i < 30; i++) { g.frames(1); if (mapId(g) !== dpm) dh++; dpm = mapId(g); if (mapId(g) === 'MAP_N2') break; } g.release('ArrowUp');
      assert.equal(mapId(g), 'MAP_N2', 'recentred on col 7, pure north crosses cleanly');
      assert.equal(dh, 1, 'the recentred crossing is a single handoff');
    }

    // ── 12. One-tile corridor: only column 7 has an eligible crossing ──────
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP_N1'); return canWalk(7.5*TILE, 0.5*TILE);})()"), true, 'MAP_N1 col 7 row 0 (corridor) is walkable');
    assert.equal(g.run("canWalk(6.5*TILE, 0.5*TILE)"), false, 'MAP_N1 col 6 row 0 is blocked (TREE)');
    assert.equal(g.run("canWalk(8.5*TILE, 0.5*TILE)"), false, 'MAP_N1 col 8 row 0 is blocked (TREE)');
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP_N2'); return canWalk(7.5*TILE, 13.5*TILE);})()"), true, 'MAP_N2 col 7 row 14 (corridor) is walkable');
    assert.equal(g.run(`continuousSeamCrossingAt('MAP_N1', 6.5*TILE, 4*480-1)`), null, 'no eligible crossing at col 6 (outside the [7,7] seam)');
    assert.ok(g.run(`!!continuousSeamCrossingAt('MAP_N1', 7.5*TILE, 4*480-1)`), 'eligible crossing exists at col 7');

    // ── 13. Continuous View OFF: reciprocal legacy travel + inset + COOLDOWN PARITY ─
    {
      onMapN1(g, false);
      g.run(`player.x=${COL7}; player.y=1.5*TILE; player.facing='up'; combat.cooldown=0;`);
      g.hold('ArrowUp'); let north = false; for (let i = 0; i < 40 && !north; i++) { g.frames(1); north = mapId(g) === 'MAP_N2'; } g.release('ArrowUp');
      assert.ok(north, 'View off: northbound reaches MAP_N2 via the legacy broad-edge path');
      assert.equal(g.run('player.y'), g.run('13.5*TILE'), 'legacy inset landing = row 13 (same coords as the old enterMapN2)');
      assert.ok(g.run('combat.cooldown') > 0, 'legacy edge transition applies the encounter cooldown (parity with the retired enterMapN2)');
      g.run(`combat.cooldown=0; player.x=${COL7}; player.y=13.5*TILE; player.facing='down';`);
      g.hold('ArrowDown'); let south = false; for (let i = 0; i < 40 && !south; i++) { g.frames(1); south = mapId(g) === 'MAP_N1'; } g.release('ArrowDown');
      assert.ok(south, 'View off: southbound reaches MAP_N1 via the legacy broad-edge path');
      assert.equal(g.run('player.y'), g.run('1.5*TILE'), 'legacy inset landing = row 1 (same coords as the old exitMapN2)');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'not stuck on the arrival edge');
      assert.ok(g.run('combat.cooldown') > 0, 'reciprocal legacy edge transition also applies cooldown (parity with the retired exitMapN2)');
    }

    // ── 14. Same canonical FAR pool on both sides ──────────────────────────
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP_N1'); player.x=6*TILE; player.y=4*TILE; return currentEncounterPool()===FAR_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP_N1').encounterPool;})()"), true, 'MAP_N1 pool is FAR_ENEMY_TEMPLATES');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP_N2'); player.x=6*TILE; player.y=10*TILE; return currentEncounterPool()===FAR_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP_N2').encounterPool;})()"), true, 'MAP_N2 pool is FAR_ENEMY_TEMPLATES');

    // ── 15. No extra Math.random / combat start caused by the handoff ───────
    {
      onMapN1(g, true);
      g.run(`player.x=${COL7}; player.y=0.5*TILE; player.facing='up';`);
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

    // ── 16. Pale Sentry: MAP_N2-only, applicable only after the handoff ────
    const sentry = JSON.parse(g.run(`(function(){
      var s0=sentry_quest_started, d0=sentry_quest_done, h0=pale_sentry_hp;
      sentry_quest_started=true; sentry_quest_done=false; pale_sentry_hp=500;
      // pre-handoff side (MAP_N1): the scripted Sentry is NOT eligible
      combat.active=false; combat.isPaleSentry=false; activeMap=mapRefForId('MAP_N1'); startCombat();
      var onN1 = combat.isPaleSentry;
      // post-handoff side (MAP_N2) with flags active: the Sentry IS the encounter
      combat.active=false; combat.isPaleSentry=false; activeMap=mapRefForId('MAP_N2'); startCombat();
      var onN2 = combat.isPaleSentry;
      // MAP_N2 but flags cleared: NOT eligible
      combat.active=false; combat.isPaleSentry=false; sentry_quest_started=false; activeMap=mapRefForId('MAP_N2'); startCombat();
      var onN2NoQuest = combat.isPaleSentry;
      combat.active=false; combat.isPaleSentry=false;
      sentry_quest_started=s0; sentry_quest_done=d0; pale_sentry_hp=h0;
      return JSON.stringify({onN1:onN1, onN2:onN2, onN2NoQuest:onN2NoQuest});
    })()`));
    assert.equal(sentry.onN1, false, 'Pale Sentry NOT eligible on the MAP_N1 (pre-handoff) side');
    assert.equal(sentry.onN2, true, 'Pale Sentry becomes eligible only on MAP_N2 (after the standing-point handoff) with quest flags active');
    assert.equal(sentry.onN2NoQuest, false, 'Pale Sentry needs its quest flags — not eligible on MAP_N2 without them');

    // ── 17. Sealed Drenwick gate: world-locked, renders once from MAP_N1, hint active-only ─
    assert.equal(g.run("typeof OUTDOOR_MAP_DECOR.MAP_N2"), 'function', 'MAP_N2 has a world-locked static-decor body (the sealed gate)');
    {
      onMapN1(g, true);
      g.run(`player.x=${COL7}; player.y=0.5*TILE;`); // MAP_N2 visible as the north neighbour
      const s = JSON.parse(g.run(`(function(){
        var n=0,_d=OUTDOOR_MAP_DECOR.MAP_N2; OUTDOOR_MAP_DECOR.MAP_N2=function(){ n++; return _d.apply(null,arguments); };
        var hint=false,_ft=ctx.fillText; ctx.fillText=function(t){ if(t==='SPACE') hint=true; return _ft&&_ft.apply(ctx,arguments); };
        try { render(); } finally { OUTDOOR_MAP_DECOR.MAP_N2=_d; ctx.fillText=_ft; }
        return JSON.stringify({decorCalls:n, hint:hint, active:mapIdForRef(activeMap)});
      })()`));
      assert.equal(s.active, 'MAP_N1', 'active on MAP_N1 for the neighbour-render check');
      assert.equal(s.decorCalls, 1, 'gate body renders exactly once as a world-locked neighbour (no duplicate)');
      assert.equal(s.hint, false, 'no active-only SPACE hint while MAP_N2 is merely a neighbour');
    }
    // neighbour content skips the active chunk (no duplicate gate)
    assert.equal(g.run(`(function(){ var n=0,_d=OUTDOOR_MAP_DECOR.MAP_N2; OUTDOOR_MAP_DECOR.MAP_N2=function(){n++;}; try { drawNeighbourOutdoorContent(outdoorChunkContentContext('MAP_N2', true)); } finally { OUTDOOR_MAP_DECOR.MAP_N2=_d; } return n; })()`), 0, 'neighbour content skips the active chunk (no duplicate gate)');
    // the active-only hint draws nothing when MAP_N2 is not active
    assert.equal(g.run(`(function(){ activeMap=mapRefForId('MAP_N1'); var n=0,_b=drawDrenwichNorthGateBody; drawDrenwichNorthGateBody=function(){n++;}; try { drawDrenwichNorthGateHint(); } finally { drawDrenwichNorthGateBody=_b; } return n; })()`), 0, 'drawDrenwichNorthGateHint() (active-only path) draws nothing when MAP_N2 is not active');

    // ── 18. Save/load after crossing restores physical map + local position ─
    {
      const g2 = ctx();
      onMapN1(g2, true);
      g2.run(`player.x=${COL7}; player.y=0.5*TILE; player.facing='up';`);
      g2.hold('ArrowUp'); for (let i = 0; i < 20 && mapId(g2) !== 'MAP_N2'; i++) g2.frames(1); g2.release('ArrowUp');
      assert.equal(mapId(g2), 'MAP_N2', 'crossed before saving');
      const px = g2.run('player.x'), py = g2.run('player.y');
      g2.run('saveGame();');
      assert.equal(JSON.parse(g2.run("localStorage.getItem('verdantVale_save')")).version, 3, 'SAVE_VERSION stays 3');
      g2.run("activeMap = mapRefForId('MAP'); player.x=1; player.y=1;");
      g2.run('loadGame();');
      assert.equal(g2.run('mapIdForRef(activeMap)'), 'MAP_N2', 'load restores the correct physical map');
      assert.ok(Math.abs(g2.run('player.x') - px) < 1 && Math.abs(g2.run('player.y') - py) < 1, 'load restores the local position');
    }

    // ── 19. Seam edge base-walkability guard passes ─────────────────────────
    assert.deepEqual(JSON.parse(g.run("JSON.stringify(continuousSeamEdgeWalkability(mapRefForId('MAP_N1'),'north',mapRefForId('MAP_N2'),'south',[7,7]))")), { ok: true }, 'the real MAP_N1<->MAP_N2 col-7 seam is base-walkable both edges');
  },
};
