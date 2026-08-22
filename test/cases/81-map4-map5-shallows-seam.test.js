'use strict';
// Thornmere (MAP4, chunk 3,5) <-> Thornmere Shallows (MAP5, chunk 4,5) crossing
// converted from a MAP5_EXIT/MAP5_ENTRANCE point transition to a structural
// EDGE_TRANSITIONS seam: MAP4.east <-> MAP5.west, the single row-6 GRASS spit,
// sourceRange [6,6].
//
// Seam-specific facts this focused test covers (the generic seamless/handoff/legacy
// machinery is already exercised by tests 77, 79 & 80):
//   • SYMMETRIC GRASS replacement on both shores; the surrounding water/tree edge stays
//     blocked, so ONLY row 6 crosses.
//   • COOLDOWN PARITY — the retired enterMap5/exitMap5 BOTH applied cooldown:true, and
//     the generic legacy edge path also applies it (identical in both modes).
//   • DIFFERENT pools per side — MAP4 owns THORNMERE_ENEMY_TEMPLATES, MAP5 (Thornmere
//     Shallows) owns THORNMERE_SHORE_ENEMY_TEMPLATES (Thornmere pool + the lighthouse
//     vermin). The structural seam still crosses cleanly; the pool simply flips ONCE at
//     the standing-point handoff (no extra roll / combat is triggered by the flip itself).
//   • MAP5's shared ambiguous 'overworld' content key leaks/duplicates nothing (no
//     items, no owned NPCs, no static decor) when it is a neighbour chunk.
//   • The MAP4 Standing Stone stays world-locked (single instance) when MAP4 is visible
//     from MAP5, with its prompt still gated on activeMap === MAP4.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const CW = 512, CH = 480;
const ROW6 = 6.5 * 32;

function ctx() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}
function onMap4(g, cont) {
  g.run(`debugWarpToDestination('outdoor:MAP4');
         dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;
         combat.active=false; combat.cooldown=0; debugMode=true; forceLegacyRegionalView=${!cont};
         for (var k in keys) delete keys[k];`);
}
const mapId = (g) => g.run('mapIdForRef(activeMap)');
const worldX = (g) => g.run(`(function(){var p=regionPlacementForMapId(mapIdForRef(activeMap)); return p.chunkX*${CW}+player.x;})()`);
const camX = (g) => { const pl = g.run("JSON.stringify((function(){var c=regionalWorldPosition();return c?buildContinuousWorldPlanFromWorld(c.regionId,c.worldPxX,c.worldPxY,512,480):null;})())"); const o = JSON.parse(pl); return o ? o.camPxX : null; };
const pool = (g) => g.run('(currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES?"THORN":currentEncounterPool()===THORNMERE_SHORE_ENEMY_TEMPLATES?"SHORE":"OTHER")');

module.exports = {
  name: 'MAP4<->MAP5 Shallows seam: symmetric GRASS, cooldown parity, per-side pool ownership, no content leakage',
  run() {
    const g = ctx();
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Exact reciprocal segment definitions + [6,6] ranges ──────────────
    const e4 = J("JSON.stringify(EDGE_TRANSITIONS['MAP4'].east)");
    const w5 = J("JSON.stringify(EDGE_TRANSITIONS['MAP5'].west)");
    assert.equal(e4.length, 1, 'MAP4.east is a single segment');
    assert.deepEqual({ t: e4[0].targetMap, e: e4[0].targetEdge, r: e4[0].sourceRange }, { t: 'MAP5', e: 'west', r: [6, 6] }, 'MAP4.east -> MAP5.west [6,6]');
    assert.deepEqual({ t: w5[0].targetMap, e: w5[0].targetEdge, r: w5[0].sourceRange }, { t: 'MAP4', e: 'east', r: [6, 6] }, 'MAP5.west -> MAP4.east [6,6]');
    assert.equal(e4[0].targetRange, undefined, 'no targetRange on MAP4.east');
    assert.equal(w5[0].targetRange, undefined, 'no targetRange on MAP5.west');
    assert.deepEqual(Object.keys(e4[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'MAP4.east seg has only structural keys');
    assert.deepEqual(Object.keys(w5[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'MAP5.west seg has only structural keys');

    // ── 2. Symmetric GRASS edge cells; surrounding edge blocked ─────────────
    assert.equal(g.run("mapRefForId('MAP4')[6][15]"), g.run('GRASS'), 'MAP4[6][15] is GRASS');
    assert.equal(g.run("mapRefForId('MAP5')[6][0]"), g.run('GRASS'), 'MAP5[6][0] is GRASS');
    assert.equal(g.run('isTileWalkable(GRASS)'), true, 'GRASS is base-walkable');
    assert.equal(g.run('!!TILE_PROPERTIES[GRASS].isTransition'), false, 'GRASS is not a transition tile');
    assert.notEqual(g.run("mapRefForId('MAP4')[6][15]"), g.run('MAP5_EXIT'), 'no MAP5_EXIT at MAP4[6][15]');
    assert.notEqual(g.run("mapRefForId('MAP5')[6][0]"), g.run('MAP5_ENTRANCE'), 'no MAP5_ENTRANCE at MAP5[6][0]');
    assert.equal(g.run("(function(){var n=0;for(var id in MAP_CATALOG){var m=MAP_CATALOG[id].map;if(!Array.isArray(m))continue;for(var r=0;r<m.length;r++)for(var c=0;c<m[r].length;c++)if(m[r][c]===MAP5_EXIT||m[r][c]===MAP5_ENTRANCE)n++;}return n;})()"), 0, 'MAP5_EXIT/ENTRANCE no longer placed on any map');
    // water/tree edge stays blocked: only row 6 is open on each shared edge
    assert.deepEqual(J("JSON.stringify((function(){var o=[];for(var r=0;r<15;r++)if(isTileWalkable(mapRefForId('MAP4')[r][15]))o.push(r);return o;})())"), [6], 'MAP4 east edge is walkable ONLY at row 6');
    assert.deepEqual(J("JSON.stringify((function(){var o=[];for(var r=0;r<15;r++)if(isTileWalkable(mapRefForId('MAP5')[r][0]))o.push(r);return o;})())"), [6], 'MAP5 west edge is walkable ONLY at row 6');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP5')[5][0]) || isTileWalkable(mapRefForId('MAP5')[7][0])"), false, 'MAP5 col 0 rows 5 & 7 stay blocked (water / tree)');

    // ── 3. Pair reclassifies to ALIGNS; retired dispatch gone ──────────────
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V['MAP4|east'], 'ALIGNS', 'MAP4.east is now ALIGNS');
    assert.equal(V['MAP5|west'], 'ALIGNS', 'MAP5.west is now ALIGNS');
    assert.ok(g.run("!!eligibleContinuousSeam('MAP4','east') && !!eligibleContinuousSeam('MAP5','west')"), 'both directed seams are eligible');
    assert.equal(g.run('typeof enterMap5'), 'undefined', 'enterMap5 wrapper removed');
    assert.equal(g.run('typeof exitMap5'), 'undefined', 'exitMap5 wrapper removed');
    assert.equal(g.run("REGIONAL_POINT_CROSSINGS.filter(function(c){return (c.from==='MAP4'&&c.to==='MAP5')||(c.from==='MAP5'&&c.to==='MAP4');}).length"), 0, 'MAP4<->MAP5 removed from REGIONAL_POINT_CROSSINGS');

    // ── 4-9. Continuous eastbound sustained crossing (pool flips THORNMERE -> shore, cooldown ticks) ─
    {
      onMap4(g, true);
      g.run(`player.x=14.5*TILE; player.y=${ROW6}; player.facing='left'; player.moving=false; combat.cooldown=200;; __reconcileCanonicalForTest();`);
      assert.equal(mapId(g), 'MAP4', 'start on MAP4 (Thornmere)');
      assert.equal(pool(g), 'THORN', 'MAP4 side owns THORNMERE before the crossing');
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
        if (m === 'MAP5' && w > 4 * CW + 6) break;
      }
      g.release('ArrowRight');
      assert.equal(mapId(g), 'MAP5', 'eastbound crossing lands in MAP5 (Thornmere Shallows)'); // (4)
      assert.equal(handoffs, 1, 'exactly ONE activeMap handoff for the crossing');              // (6)
      assert.equal(poolFlips, 1, 'pool flips exactly once at the handoff (THORNMERE -> Thornmere shore)');
      assert.equal(pool(g), 'SHORE', 'MAP5 side owns the Thornmere shore pool after the crossing');
      assert.ok(maxWorldD <= 2 + 1e-9, 'player advances at most SPEED per frame (no double movement)'); // (6)
      assert.equal(zero, 0, 'no stuck frames while entering/clearing the seam');                 // (5)
      assert.ok(maxCamD <= maxWorldD + 1e-9, 'camera delta never exceeds movement delta');       // (9)
      assert.equal(g.run('player.facing'), 'right', 'facing preserved across handoff');          // (8)
      assert.ok(g.run('player.step') > startStep, 'animation step kept advancing (not reset)');
      assert.equal(g.run('combat.cooldown'), 200 - framesRun, 'cooldown decremented normally, NOT reset by the seamless handoff');
      const px = g.run('player.x');
      assert.ok(px < g.run('1.5*TILE'), 'landed near the MAP5 west edge (continuous), not the legacy col-1 inset');
      assert.notEqual(px, g.run('1.5*TILE'), 'did not snap to the legacy inset landing');
    }

    // ── 7. Standing-point handoff timing (centre crosses the chunk boundary) ─
    {
      onMap4(g, true);
      g.run(`player.x=15.5*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      let beforeMap = mapId(g);
      g.hold('ArrowRight');
      for (let i = 0; i < 20; i++) { g.frames(1); if (mapId(g) !== beforeMap) break; }
      g.release('ArrowRight');
      assert.equal(mapId(g), 'MAP5', 'crossed on the standing-point handoff');
      assert.ok(worldX(g) >= 4 * CW && worldX(g) < 4 * CW + 4, 'handoff occurs as the centre crosses the chunk boundary (worldX ~2048)');
    }

    // ── 6/8. Continuous westbound crossing back (pool flips shore -> THORNMERE) ───────────
    {
      onMap4(g, true);
      g.run(`activeMap = mapRefForId('MAP5'); player.x=1.5*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      assert.equal(pool(g), 'SHORE', 'MAP5 side owns the Thornmere shore pool before westbound crossing');
      g.hold('ArrowLeft');
      let handoffs = 0, pm = mapId(g), maxD = 0, pw = worldX(g);
      for (let i = 0; i < 30; i++) { g.frames(1); const w = worldX(g), m = mapId(g); maxD = Math.max(maxD, Math.abs(w - pw)); if (m !== pm) handoffs++; pm = m; pw = w; if (m === 'MAP4') break; }
      g.release('ArrowLeft');
      assert.equal(mapId(g), 'MAP4', 'westbound crossing lands back in MAP4');
      assert.equal(handoffs, 1, 'exactly one handoff westbound');
      assert.equal(pool(g), 'THORN', 'MAP4 side owns THORNMERE after westbound crossing');
      assert.ok(maxD <= 2 + 1e-9, 'westbound advances at most SPEED per frame');
    }

    // ── 10-11. Reversal, parallel, and diagonal movement at the seam ────────
    {
      onMap4(g, true);
      g.run(`player.x=15.8*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      g.hold('ArrowRight'); g.frames(1); g.release('ArrowRight');
      g.hold('ArrowLeft'); for (let i = 0; i < 12; i++) g.frames(1); g.release('ArrowLeft');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'reversal leaves the player on a walkable footprint (no soft-lock)');
      assert.ok(['MAP4', 'MAP5'].includes(mapId(g)), 'still on one of the two seam maps after reversal');
      // parallel (vertical) motion while straddling: rows 5 & 7 at the edge are blocked
      onMap4(g, true);
      g.run(`player.x=15.6*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      const bm = mapId(g);
      g.hold('ArrowUp'); for (let i = 0; i < 3; i++) g.frames(1); g.release('ArrowUp');
      assert.equal(mapId(g), bm, 'parallel motion while straddling does not trigger a handoff');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'footprint stays valid straddling the seam');
      // diagonal crossing (down+right): vertical blocked by edge water/tree, horizontal still crosses
      onMap4(g, true);
      g.run(`player.x=14.5*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      let dh = 0, dpm = mapId(g);
      g.hold('ArrowRight'); g.hold('ArrowDown');
      for (let i = 0; i < 40; i++) { g.frames(1); if (mapId(g) !== dpm) dh++; dpm = mapId(g); if (mapId(g) === 'MAP5') break; }
      g.release('ArrowDown');
      g.hold('ArrowRight'); for (let i = 0; i < 15 && worldX(g) < 4 * CW + 20; i++) g.frames(1); g.release('ArrowRight');
      assert.equal(mapId(g), 'MAP5', 'diagonal down+right still crosses east into MAP5');
      assert.equal(dh, 1, 'diagonal crossing is still a single handoff');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'no soft-lock after the diagonal crossing');
    }

    // ── 12. One-tile corridor: only row 6 has an eligible crossing ─────────
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP4'); __reconcileCanonicalForTest(); return canWalk(15.5*TILE, 6.5*TILE);})()"), true, 'MAP4 col 15 row 6 (corridor) is walkable');
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP5'); __reconcileCanonicalForTest(); return canWalk(0.5*TILE, 6.5*TILE);})()"), true, 'MAP5 col 0 row 6 (corridor) is walkable');
    assert.equal(g.run(`continuousSeamCrossingAt('MAP4', 4*512+1, 5*480+5.5*TILE)`), null, 'no eligible crossing at row 5 (outside the [6,6] seam)');
    assert.ok(g.run(`!!continuousSeamCrossingAt('MAP4', 4*512+1, 5*480+6.5*TILE)`), 'eligible crossing exists at row 6');

    // ── 13. Continuous View OFF: reciprocal legacy travel + inset + COOLDOWN PARITY ─
    {
      onMap4(g, false);
      g.run(`player.x=14.5*TILE; player.y=${ROW6}; player.facing='right'; combat.cooldown=0;; __reconcileCanonicalForTest();`);
      g.hold('ArrowRight'); let east = false; for (let i = 0; i < 40 && !east; i++) { g.frames(1); east = mapId(g) === 'MAP5'; } g.release('ArrowRight');
      assert.ok(east, 'View off: eastbound reaches MAP5 via the legacy broad-edge path');
      assert.equal(g.run('player.x'), g.run('1.5*TILE'), 'legacy inset landing = col 1 (same coords as the old enterMap5)');
      assert.ok(g.run('combat.cooldown') > 0, 'legacy edge transition applies the encounter cooldown (parity with the retired enterMap5)');
      g.run(`combat.cooldown=0; player.x=1.5*TILE; player.y=${ROW6}; player.facing='left';; __reconcileCanonicalForTest();`);
      g.hold('ArrowLeft'); let west = false; for (let i = 0; i < 40 && !west; i++) { g.frames(1); west = mapId(g) === 'MAP4'; } g.release('ArrowLeft');
      assert.ok(west, 'View off: westbound reaches MAP4 via the legacy broad-edge path');
      assert.equal(g.run('player.x'), g.run('14.5*TILE'), 'legacy inset landing = col 14 (same coords as the old exitMap5)');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'not stuck on the arrival edge');
      assert.ok(g.run('combat.cooldown') > 0, 'reciprocal legacy edge transition also applies cooldown (parity with the retired exitMap5)');
    }

    // ── 14. Same canonical pool on both sides ───────────────────────────────
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP4'); player.x=6*TILE; player.y=2*TILE; __reconcileCanonicalForTest(); return currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP4').encounterPool;})()"), true, 'MAP4 pool is THORNMERE_ENEMY_TEMPLATES');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP5'); player.x=4*TILE; player.y=6*TILE; __reconcileCanonicalForTest(); return currentEncounterPool()===THORNMERE_SHORE_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP5').encounterPool;})()"), true, 'MAP5 pool is THORNMERE_SHORE_ENEMY_TEMPLATES');

    // ── 15. No extra Math.random / combat start caused by the handoff ───────
    {
      onMap4(g, true);
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

    // ── 16. MAP5 shared 'overworld' content key: no leakage / duplication ───
    // MAP5 carries the ambiguous 'overworld' key; neighbour content is resolved by
    // PHYSICAL-map ownership, not the shared key. MAP5 owns no items, NPCs, or decor,
    // so rendering it as a neighbour contributes nothing.
    assert.equal(g.run("outdoorContentKeyInfo('MAP5').unambiguous"), false, 'MAP5 uses the shared ambiguous overworld content key');
    assert.equal(g.run("(mapEntryForId('MAP5').items||[]).length"), 0, 'MAP5 owns no world items');
    assert.equal(g.run("typeof OUTDOOR_MAP_DECOR.MAP5"), 'undefined', 'MAP5 has no static decoration body');
    assert.equal(g.run(`(function(){
      var n=0,_i=(typeof drawMapWorldItems!=='undefined'?drawMapWorldItems:null); if(_i) drawMapWorldItems=function(){ n++; return _i.apply(null,arguments); };
      try { drawNeighbourOutdoorContent(outdoorChunkContentContext('MAP5', false)); } finally { if(_i) drawMapWorldItems=_i; }
      return n;
    })()`), 0, 'rendering MAP5 as a neighbour draws no world items (no leakage from the shared key)');

    // ── 17. Standing Stone world-locked when MAP4 is visible from MAP5 ──────
    {
      onMap4(g, true);
      g.run(`activeMap=mapRefForId('MAP5'); player.x=1*TILE; player.y=${ROW6}; __reconcileCanonicalForTest();`);
      const s = JSON.parse(g.run(`(function(){
        var n=0,_d=OUTDOOR_MAP_DECOR.MAP4; OUTDOOR_MAP_DECOR.MAP4=function(){ n++; return _d.apply(null,arguments); };
        var hint=false,_ft=ctx.fillText; ctx.fillText=function(t){ if(t==='SPACE') hint=true; return _ft&&_ft.apply(ctx,arguments); };
        try { render(); } finally { OUTDOOR_MAP_DECOR.MAP4=_d; ctx.fillText=_ft; }
        return JSON.stringify({decorCalls:n, hint:hint, active:mapIdForRef(activeMap)});
      })()`));
      assert.equal(s.active, 'MAP5', 'active on MAP5 for the neighbour-render check');
      assert.equal(s.decorCalls, 1, 'MAP4 stone body renders exactly once as a world-locked neighbour from MAP5');
      assert.equal(s.hint, false, 'no active-only SPACE hint while MAP4 is merely a neighbour');
    }
    assert.equal(g.run(`(function(){ activeMap=mapRefForId('MAP5'); choice.open=false; player.x=THORNMERE_STONE.x; player.y=THORNMERE_STONE.y; interactThornmereStone(); return choice.open; })()`), false, 'stone interaction does NOT open from the MAP5 side');

    // ── 18. Save/load after crossing restores physical map + local position ─
    {
      const g2 = ctx();
      onMap4(g2, true);
      g2.run(`player.x=15.5*TILE; player.y=${ROW6}; player.facing='right';; __reconcileCanonicalForTest();`);
      g2.hold('ArrowRight'); for (let i = 0; i < 20 && mapId(g2) !== 'MAP5'; i++) g2.frames(1); g2.release('ArrowRight');
      assert.equal(mapId(g2), 'MAP5', 'crossed before saving');
      const px = g2.run('player.x'), py = g2.run('player.y');
      g2.run('saveGame();');
      assert.equal(JSON.parse(g2.run("localStorage.getItem('verdantVale_save')")).version, 4, 'SAVE_VERSION stays 4');
      g2.run("activeMap = mapRefForId('MAP'); player.x=1; player.y=1;; __reconcileCanonicalForTest();");
      g2.run('loadGame();');
      assert.equal(g2.run('mapIdForRef(activeMap)'), 'MAP5', 'load restores the correct physical map');
      assert.ok(Math.abs(g2.run('player.x') - px) < 1 && Math.abs(g2.run('player.y') - py) < 1, 'load restores the local position');
    }

    // ── 19. Seam edge base-walkability guard passes ─────────────────────────
    assert.deepEqual(JSON.parse(g.run("JSON.stringify(continuousSeamEdgeWalkability(mapRefForId('MAP4'),'east',mapRefForId('MAP5'),'west',[6,6]))")), { ok: true }, 'the real MAP4<->MAP5 GRASS seam is base-walkable both edges');
  },
};
