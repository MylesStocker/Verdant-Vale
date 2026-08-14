'use strict';
// Eastern Reaches (MAP2, chunk 1,5) <-> Thornmere Fen (MAP3, chunk 2,5) crossing
// converted from a MAP3_EXIT/MAP3_ENTRANCE point transition to a structural
// EDGE_TRANSITIONS seam: MAP2.east <-> MAP3.west, the single row-11 PATH,
// sourceRange [11,11]. Seamless under Continuous View; discrete broad-edge with it
// off. The one-tile corridor is authored geography (unchanged).
//
// Two things distinguish this seam from the MAP3<->MAP3_N1 pilot (test 77):
//   • The two maps own DIFFERENT encounter pools — MAP2 = ENEMY_TEMPLATES,
//     MAP3 = FAR_ENEMY_TEMPLATES — so pool ownership must flip exactly at the
//     standing-point handoff and nowhere else.
//   • The retired point transition (enterMap3/exitMap3) did NOT reset the encounter
//     cooldown. Under Continuous View the seamless handoff still never touches
//     cooldown (preserved). With Continuous View OFF the generic legacy broad-edge
//     path applies its normal cooldown — a documented fallback-mode difference from
//     the old point transition (we deliberately do NOT special-case it away).

const assert = require('assert/strict');
const { createContext } = require('../harness');

const CW = 512, CH = 480; // COLS*TILE, ROWS*TILE
const ROW11 = 11.5 * 32;  // centred in the one-tile corridor (row 11)

function ctx() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}
function onMap2(g, cont) {
  g.run(`debugWarpToDestination('outdoor:MAP2');
         dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;
         combat.active=false; combat.cooldown=0; debugMode=true; continuousWorldViewEnabled=${cont};
         for (var k in keys) delete keys[k];`);
}
const mapId = (g) => g.run('mapIdForRef(activeMap)');
const worldX = (g) => g.run(`(function(){var p=regionPlacementForMapId(mapIdForRef(activeMap)); return p.chunkX*${CW}+player.x;})()`);
const camX = (g) => { const pl = g.run("JSON.stringify(buildContinuousWorldPlan('overworld', mapIdForRef(activeMap), player.x, player.y, 512, 480))"); const o = JSON.parse(pl); return o ? o.camPxX : null; };
const pool = (g) => g.run('(currentEncounterPool()===ENEMY_TEMPLATES?"ENEMY":currentEncounterPool()===FAR_ENEMY_TEMPLATES?"FAR":"OTHER")');

module.exports = {
  name: 'MAP2<->MAP3 fen seam: seamless crossing, pool ownership handoff, legacy fallback cooldown, no side-effects',
  run() {
    const g = ctx();
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Exact reciprocal segment definitions + [11,11] ranges ────────────
    const e2 = J("JSON.stringify(EDGE_TRANSITIONS['MAP2'].east)");
    const w3 = J("JSON.stringify(EDGE_TRANSITIONS['MAP3'].west)");
    assert.equal(e2.length, 1, 'MAP2.east is a single segment');
    assert.deepEqual({ t: e2[0].targetMap, e: e2[0].targetEdge, r: e2[0].sourceRange }, { t: 'MAP3', e: 'west', r: [11, 11] }, 'MAP2.east -> MAP3.west [11,11]');
    assert.deepEqual({ t: w3[0].targetMap, e: w3[0].targetEdge, r: w3[0].sourceRange }, { t: 'MAP2', e: 'east', r: [11, 11] }, 'MAP3.west -> MAP2.east [11,11]');
    assert.equal(e2[0].targetRange, undefined, 'no targetRange on MAP2.east (non-remapping)');
    assert.equal(w3[0].targetRange, undefined, 'no targetRange on MAP3.west');
    // no behaviour-bearing keys (no condition/message/callback/effect/cost/cooldown)
    assert.deepEqual(Object.keys(e2[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'MAP2.east seg has only structural keys');
    assert.deepEqual(Object.keys(w3[0]).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'MAP3.west seg has only structural keys');

    // ── 2. Both edge cells are ordinary base-walkable road/PATH tiles ───────
    assert.equal(g.run("mapRefForId('MAP2')[11][15]"), g.run('PATH'), 'MAP2[11][15] is PATH');
    assert.equal(g.run("mapRefForId('MAP3')[11][0]"), g.run('PATH'), 'MAP3[11][0] is PATH');
    assert.equal(g.run('isTileWalkable(PATH)'), true, 'PATH is base-walkable');
    assert.equal(g.run('!!TILE_PROPERTIES[PATH].isTransition'), false, 'PATH is not a transition tile');
    // the retired point tiles no longer sit at either edge coordinate
    assert.notEqual(g.run("mapRefForId('MAP2')[11][15]"), g.run('MAP3_EXIT'), 'no MAP3_EXIT at MAP2[11][15]');
    assert.notEqual(g.run("mapRefForId('MAP3')[11][0]"), g.run('MAP3_ENTRANCE'), 'no MAP3_ENTRANCE at MAP3[11][0]');
    // and not placed anywhere else either (constants retained but unplaced)
    assert.equal(g.run("(function(){var n=0;for(var id in MAP_CATALOG){var m=MAP_CATALOG[id].map;if(!Array.isArray(m))continue;for(var r=0;r<m.length;r++)for(var c=0;c<m[r].length;c++)if(m[r][c]===MAP3_EXIT||m[r][c]===MAP3_ENTRANCE)n++;}return n;})()"), 0, 'MAP3_EXIT/ENTRANCE no longer placed on any map');

    // ── 3. Pair reclassifies NEEDS_REMAP -> ALIGNS; retired dispatch gone ───
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V['MAP2|east'], 'ALIGNS', 'MAP2.east is now ALIGNS');
    assert.equal(V['MAP3|west'], 'ALIGNS', 'MAP3.west is now ALIGNS');
    assert.ok(g.run("!!eligibleContinuousSeam('MAP2','east')"), 'MAP2|east is an eligible seam');
    assert.ok(g.run("!!eligibleContinuousSeam('MAP3','west')"), 'MAP3|west is an eligible seam');
    assert.equal(g.run('typeof enterMap3'), 'undefined', 'enterMap3 wrapper removed');
    assert.equal(g.run('typeof exitMap3'), 'undefined', 'exitMap3 wrapper removed');
    // no residual point-crossing entry for this pair in the shared authority
    assert.equal(g.run("REGIONAL_POINT_CROSSINGS.filter(function(c){return (c.from==='MAP2'&&c.to==='MAP3')||(c.from==='MAP3'&&c.to==='MAP2');}).length"), 0, 'MAP2<->MAP3 removed from REGIONAL_POINT_CROSSINGS');

    // ── 4-9. Continuous eastbound sustained crossing (+ pool ownership) ─────
    {
      onMap2(g, true);
      g.run(`player.x=14.5*TILE; player.y=${ROW11}; player.facing='left'; player.moving=false; combat.cooldown=200;`);
      assert.equal(mapId(g), 'MAP2', 'start on MAP2 (Eastern Reaches)');
      assert.equal(pool(g), 'ENEMY', 'MAP2 side owns ENEMY_TEMPLATES before the crossing');
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
        if (m === 'MAP3' && w > 2 * CW + 6) break; // crossed + advanced a few px into MAP3
      }
      g.release('ArrowRight');
      assert.equal(mapId(g), 'MAP3', 'eastbound crossing lands in MAP3 (Thornmere Fen)'); // (4)
      assert.equal(handoffs, 1, 'exactly ONE activeMap handoff for the crossing');         // (6)
      assert.equal(poolFlips, 1, 'encounter pool ownership flips exactly once, at the handoff');
      assert.equal(pool(g), 'FAR', 'MAP3 side owns FAR_ENEMY_TEMPLATES after the crossing');
      assert.ok(maxWorldD <= 2 + 1e-9, 'player advances at most SPEED per frame (no double movement)'); // (6)
      assert.equal(zero, 0, 'no stuck frames while entering/clearing the seam');            // (5)
      assert.ok(maxCamD <= maxWorldD + 1e-9, 'camera delta never exceeds movement delta');  // (9)
      // (8) facing / step / cooldown preserved across the seamless handoff
      assert.equal(g.run('player.facing'), 'right', 'facing preserved across handoff');
      assert.ok(g.run('player.step') > startStep, 'animation step kept advancing (not reset)');
      assert.equal(g.run('combat.cooldown'), 200 - framesRun, 'encounter cooldown decremented normally, NOT reset by the handoff');
      // (8) fractional local position preserved (continuous, not snapped to the legacy inset)
      const px = g.run('player.x');
      assert.ok(px < g.run('1.5*TILE'), 'landed near the MAP3 west edge (continuous), not the legacy col-1 inset');
      assert.notEqual(px, g.run('1.5*TILE'), 'did not snap to the legacy inset landing');
    }

    // ── 7. Standing-point handoff timing (centre crosses the chunk boundary) ─
    {
      onMap2(g, true);
      g.run(`player.x=15.5*TILE; player.y=${ROW11}; player.facing='right';`); // half a tile from the boundary
      // boundary between MAP2(1,5) and MAP3(2,5) is worldX = 2*CW = 1024.
      g.hold('ArrowRight');
      let beforeMap = mapId(g), prevWorldX = worldX(g);
      for (let i = 0; i < 20; i++) { g.frames(1); if (mapId(g) !== beforeMap) break; prevWorldX = worldX(g); }
      g.release('ArrowRight');
      assert.equal(mapId(g), 'MAP3', 'crossed on the standing-point handoff');
      assert.ok(worldX(g) >= 2 * CW && worldX(g) < 2 * CW + 4, 'handoff occurs as the centre crosses the chunk boundary (worldX ~1024), not before');
    }

    // ── 4(cont). Continuous westbound sustained crossing back ───────────────
    {
      onMap2(g, true);
      g.run(`activeMap = mapRefForId('MAP3'); player.x=1.5*TILE; player.y=${ROW11}; player.facing='right';`);
      assert.equal(pool(g), 'FAR', 'MAP3 side owns FAR before westbound crossing');
      g.hold('ArrowLeft');
      let handoffs = 0, pm = mapId(g), maxD = 0, pw = worldX(g);
      for (let i = 0; i < 30; i++) { g.frames(1); const w = worldX(g), m = mapId(g); maxD = Math.max(maxD, Math.abs(w - pw)); if (m !== pm) handoffs++; pm = m; pw = w; if (m === 'MAP2') break; }
      g.release('ArrowLeft');
      assert.equal(mapId(g), 'MAP2', 'westbound crossing lands back in MAP2');
      assert.equal(handoffs, 1, 'exactly one handoff westbound');
      assert.equal(pool(g), 'ENEMY', 'MAP2 side owns ENEMY again after westbound crossing');
      assert.ok(maxD <= 2 + 1e-9, 'westbound advances at most SPEED per frame');
    }

    // ── 10. Immediate reversal before clearing the seam ─────────────────────
    {
      onMap2(g, true);
      g.run(`player.x=15.8*TILE; player.y=${ROW11}; player.facing='right';`); // right at the boundary
      g.hold('ArrowRight'); g.frames(1); g.release('ArrowRight'); // nudge across
      g.hold('ArrowLeft'); for (let i = 0; i < 12; i++) g.frames(1); g.release('ArrowLeft');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'reversal leaves the player on a walkable footprint (no soft-lock)');
      assert.ok(['MAP2', 'MAP3'].includes(mapId(g)), 'still on one of the two seam maps after reversal');
    }

    // ── 11. Movement parallel to the seam while straddling it ───────────────
    {
      onMap2(g, true);
      g.run(`player.x=15.6*TILE; player.y=${ROW11}; player.facing='right';`); // footprint straddles the seam column
      const beforeMap = mapId(g);
      g.hold('ArrowUp'); for (let i = 0; i < 3; i++) g.frames(1); g.release('ArrowUp');
      // rows 10 & 12 at the edge are TREE, so parallel motion is blocked by terrain, not a crash/handoff
      assert.equal(mapId(g), beforeMap, 'parallel motion while straddling does not trigger a handoff');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'footprint stays valid straddling the seam');
    }

    // ── 12. One-tile corridor endpoints + blocked neighbouring rows ─────────
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP2'); return canWalk(15.5*TILE, 11.5*TILE);})()"), true, 'MAP2 col 15 row 11 (corridor) is walkable');
    assert.equal(g.run("canWalk(15.5*TILE, 10.5*TILE)"), false, 'MAP2 col 15 row 10 is blocked (TREE)');
    assert.equal(g.run("canWalk(15.5*TILE, 12.5*TILE)"), false, 'MAP2 col 15 row 12 is blocked (TREE)');
    assert.equal(g.run("(function(){activeMap=mapRefForId('MAP3'); return canWalk(0.5*TILE, 11.5*TILE);})()"), true, 'MAP3 col 0 row 11 (corridor) is walkable');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP3')[10][0])"), false, 'MAP3[10][0] (col 0 row 10) is blocked');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP3')[12][0])"), false, 'MAP3[12][0] (col 0 row 12) is blocked');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP2')[10][15])"), false, 'MAP2[10][15] (col 15 row 10) is blocked');
    assert.equal(g.run("isTileWalkable(mapRefForId('MAP2')[12][15])"), false, 'MAP2[12][15] (col 15 row 12) is blocked');
    // only the row-11 corridor has an eligible crossing (probe just across the east boundary)
    assert.equal(g.run(`continuousSeamCrossingAt('MAP2', 2*512+1, 5*480+10.5*TILE)`), null, 'no eligible crossing at row 10 (outside the [11,11] seam)');
    assert.ok(g.run(`!!continuousSeamCrossingAt('MAP2', 2*512+1, 5*480+11.5*TILE)`), 'eligible crossing exists at row 11');

    // ── 13. Continuous View OFF: functional reciprocal legacy travel + inset + COOLDOWN ─
    // NOTE the cooldown behaviour: the retired enterMap3/exitMap3 point transitions did
    // NOT reset the encounter cooldown. The generic legacy broad-edge path DOES apply
    // one (transitionToLocation({..., cooldown:true})). We keep that established generic
    // behaviour rather than special-casing this seam back to no-cooldown — so with
    // Continuous View OFF the crossing now applies a cooldown where the old point
    // transition did not. This difference exists ONLY in the toggle-off fallback mode.
    {
      onMap2(g, false); // continuous OFF
      g.run(`player.x=14.5*TILE; player.y=${ROW11}; player.facing='right'; combat.cooldown=0;`);
      g.hold('ArrowRight'); let east = false; for (let i = 0; i < 40 && !east; i++) { g.frames(1); east = mapId(g) === 'MAP3'; } g.release('ArrowRight');
      assert.ok(east, 'View off: eastbound reaches MAP3 via the legacy broad-edge path');
      assert.equal(g.run('player.x'), g.run('1.5*TILE'), 'legacy inset landing = one tile inside the west edge (col 1) — same coords as the old enterMap3');
      assert.ok(g.run('combat.cooldown') > 0, 'legacy edge transition applies the encounter cooldown (generic behaviour; the old point transition did NOT)');
      // reciprocal westbound
      g.run(`combat.cooldown=0; player.x=1.5*TILE; player.y=${ROW11}; player.facing='left';`);
      g.hold('ArrowLeft'); let west = false; for (let i = 0; i < 40 && !west; i++) { g.frames(1); west = mapId(g) === 'MAP2'; } g.release('ArrowLeft');
      assert.ok(west, 'View off: westbound reaches MAP2 via the legacy broad-edge path');
      assert.equal(g.run('player.x'), g.run('14.5*TILE'), 'legacy inset landing = one tile inside the east edge (col 14) — same coords as the old exitMap3');
      assert.equal(g.run('canWalk(player.x, player.y)'), true, 'not stuck on the arrival edge');
      assert.ok(g.run('combat.cooldown') > 0, 'reciprocal legacy edge transition also applies cooldown (generic behaviour)');
    }

    // ── 14. Encounter pools are the canonical (distinct) pools on each side ──
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP2'); player.x=6*TILE; player.y=6*TILE; return currentEncounterPool()===ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP2').encounterPool;})()"), true, 'MAP2 pool is ENEMY_TEMPLATES');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP3'); player.x=6*TILE; player.y=6*TILE; return currentEncounterPool()===FAR_ENEMY_TEMPLATES && currentEncounterPool()===mapEntryForId('MAP3').encounterPool;})()"), true, 'MAP3 pool is FAR_ENEMY_TEMPLATES');

    // ── 15. No extra Math.random / combat start caused by the handoff ───────
    {
      onMap2(g, true);
      g.run(`player.x=15.5*TILE; player.y=${ROW11}; player.facing='right';`);
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
      assert.equal(r.rc, 0, 'no Math.random consumed on the crossing frames (debugMode + geographic gate)');
      assert.equal(r.sc, 0, 'no combat started by the handoff');
    }

    // ── 16. Save/load after crossing restores physical map + local position ─
    {
      const g2 = ctx();
      onMap2(g2, true);
      g2.run(`player.x=15.5*TILE; player.y=${ROW11}; player.facing='right';`);
      g2.hold('ArrowRight'); for (let i = 0; i < 20 && mapId(g2) !== 'MAP3'; i++) g2.frames(1); g2.release('ArrowRight');
      assert.equal(mapId(g2), 'MAP3', 'crossed before saving');
      const px = g2.run('player.x'), py = g2.run('player.y');
      g2.run('saveGame();');
      assert.equal(JSON.parse(g2.run("localStorage.getItem('verdantVale_save')")).version, 4, 'SAVE_VERSION stays 4');
      g2.run("activeMap = mapRefForId('MAP'); player.x=1; player.y=1;"); // scramble
      g2.run('loadGame();');
      assert.equal(g2.run('mapIdForRef(activeMap)'), 'MAP3', 'load restores the correct physical map');
      assert.ok(Math.abs(g2.run('player.x') - px) < 1 && Math.abs(g2.run('player.y') - py) < 1, 'load restores the local position');
    }

    // ── 17. Synthetic blocked-edge validation fails (general terrain guard) ──
    const badFrom = g.run(`(function(){
      var GR=GRASS, TR=TREE, R=[]; for(var r=0;r<ROWS;r++){var row=[];for(var c=0;c<COLS;c++)row.push(GR);R.push(row);}
      R[11][COLS-1]=TR; // block the east-edge source cell at row 11
      return JSON.stringify(continuousSeamEdgeWalkability(R, 'east', mapRefForId('MAP3'), 'west', [11,11]));
    })()`);
    assert.deepEqual(JSON.parse(badFrom), { ok: false, along: 11, side: 'source' }, 'a blocked SOURCE edge cell fails the guard');
    const badTo = g.run(`(function(){
      var GR=GRASS, TR=TREE, R=[]; for(var r=0;r<ROWS;r++){var row=[];for(var c=0;c<COLS;c++)row.push(GR);R.push(row);}
      R[11][0]=TR; // block the reciprocal landing (west-edge) cell
      return JSON.stringify(continuousSeamEdgeWalkability(mapRefForId('MAP2'), 'east', R, 'west', [11,11]));
    })()`);
    assert.deepEqual(JSON.parse(badTo), { ok: false, along: 11, side: 'landing' }, 'a blocked LANDING edge cell fails the guard');
    // the real seam passes both edges
    assert.deepEqual(JSON.parse(g.run("JSON.stringify(continuousSeamEdgeWalkability(mapRefForId('MAP2'),'east',mapRefForId('MAP3'),'west',[11,11]))")), { ok: true }, 'the real MAP2<->MAP3 seam is base-walkable both edges');

    // ── 18. No runtime-state mutation from validation/audit helpers ─────────
    {
      g.run("resetLocationState(); activeMap=mapRefForId('MAP2'); player.x=100; player.y=120;");
      const before = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y");
      g.run("continuousSeamEdgeWalkability(mapRefForId('MAP2'),'east',mapRefForId('MAP3'),'west',[11,11]); validateContinuousSeams();");
      assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y"), before, 'validation helpers mutate no runtime state');
    }
  },
};
