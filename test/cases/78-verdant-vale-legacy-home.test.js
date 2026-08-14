'use strict';
// VERDANT VALE LEGACY-HOME PRESENTATION BOUNDARY.
// MAP (Verdant Vale) is authored `regionalPresentation: 'legacy_screen'`: it keeps
// the fixed single-map presentation even when the Continuous View toggle is on.
// Leaving east (MAP2) / north (MAP_N1) via the existing discrete point crossings
// reveals the scrolling world; returning restores the fixed home. From the
// continuous side the camera treats MAP's chunk as a presentation border (never
// revealing MAP or a void hole), including the diagonal RODDON_WAY_MAP case. The
// four MAP boundary edges classify INTENTIONAL_DISCRETE (not NEEDS_REMAP).

const assert = require('assert/strict');
const { createContext } = require('../harness');

const CW = 512, CH = 480, SPEED = 2;
// MAP chunk (0,5) pixel rect (half-open).
const MAP_RECT = { l: 0, r: CW, t: 5 * CH, b: 6 * CH };

function ctx() { const g = createContext(); g.press('Enter'); g.press('Enter'); return g; }
function spyRender(g) {
  return JSON.parse(g.run(`(function(){
    var ev=[], translates=0, voidFilled=false, mapTiles=0;
    var _s=ctx.save,_r=ctx.restore,_t=ctx.translate,_fr=ctx.fillRect,_mt=(typeof drawMapTiles!=='undefined'?drawMapTiles:null);
    var am=mapIdForRef(activeMap), px=player.x, py=player.y;
    ctx.translate=function(x,y){ translates++; return _t&&_t.apply(ctx,arguments); };
    ctx.fillRect=function(x,y,w,h){ if(ctx.fillStyle===CONTINUOUS_VOID_COLOR) voidFilled=true; return _fr&&_fr.apply(ctx,arguments); };
    if(_mt) drawMapTiles=function(){ mapTiles++; return _mt.apply(null,arguments); };
    try { render(); } finally { ctx.translate=_t; ctx.fillRect=_fr; if(_mt) drawMapTiles=_mt; }
    return JSON.stringify({ translates:translates, voidFilled:voidFilled, mapTiles:mapTiles,
      mutated:(mapIdForRef(activeMap)!==am||player.x!==px||player.y!==py) });
  })()`));
}
const plan = (g, mid, px, py) => JSON.parse(g.run(`JSON.stringify(buildContinuousWorldPlan('overworld','${mid}',${px},${py},512,480))`));
const rectHitsMAP = (camX, camY) => camX < MAP_RECT.r && camX + CW > MAP_RECT.l && camY < MAP_RECT.b && camY + CH > MAP_RECT.t;

module.exports = {
  name: 'Verdant Vale legacy-home: fixed-screen presentation, discrete boundaries, continuous-side camera exclusion',
  run() {
    const g = ctx();

    // ── 1. Catalog metadata + effective-default resolver ────────────────────
    assert.equal(g.run("regionalPresentationForMapId('MAP')"), 'legacy_screen', 'MAP is legacy_screen');
    assert.equal(g.run("isLegacyScreenMap('MAP')"), true, 'isLegacyScreenMap(MAP)');
    assert.equal(g.run("regionalPresentationForMapId('MAP2')"), 'continuous', 'MAP2 defaults to continuous');
    assert.equal(g.run("regionalPresentationForMapId('MAP3_N1')"), 'continuous', 'MAP3_N1 continuous');
    assert.equal(g.run("regionalPresentationForMapId('DRENWICK_INN_MAP')"), null, 'a non-placed map has no presentation mode');
    // every OTHER placed regional outdoor map is continuous
    assert.equal(g.run("REGIONAL_LAYOUT.overworld.placements.filter(function(p){return p.mapId!=='MAP' && regionalPresentationForMapId(p.mapId)!=='continuous';}).length"), 0, 'every placed map except MAP is continuous');

    // ── 2. Invalid presentation metadata fails validation ───────────────────
    const errsWith = (mut) => JSON.parse(g.run(`(function(){
      ${mut}
      var v=validateGameData();
      MAP_CATALOG['MAP2'].regionalPresentation=undefined; delete MAP_CATALOG['MAP2'].regionalPresentation;
      return (v.errorList||[]).filter(function(e){return /regionalPresentation|presentation/i.test(e.message);}).length;
    })()`));
    assert.ok(errsWith("MAP_CATALOG['MAP2'].regionalPresentation='bogus';") > 0, 'an unrecognized presentation value fails validation');
    // clean baseline still validates with 0 errors
    assert.equal(g.run("validateGameData().errorList.length"), 0, 'baseline validateGameData has 0 errors');

    // ── 3. Toggle on + MAP active -> effective continuous suppressed ────────
    g.run("resetLocationState(); activeMap=mapRefForId('MAP'); continuousWorldViewEnabled=true;");
    assert.equal(g.run('continuousWorldViewEnabled'), true, 'session toggle stays ON');
    assert.equal(g.run('continuousWorldViewActive()'), false, 'effective continuous is SUPPRESSED on the legacy_screen home');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP2'); return continuousWorldViewActive();})()"), true, 'effective continuous is ON for MAP2');

    // ── 4. Fixed camera + legacy rendering on MAP (toggle on) ───────────────
    {
      const gg = ctx();
      gg.run("debugWarpToDestination('outdoor:MAP'); resetLocationState(); activeMap=mapRefForId('MAP'); continuousWorldViewEnabled=true; player.x=8*TILE; player.y=7*TILE;");
      const f = spyRender(gg);
      assert.equal(f.voidFilled, false, 'MAP renders via the legacy path (no continuous void fill)');
      assert.equal(f.translates, 0, 'MAP legacy render applies no camera translate (fixed screen, origin 0,0)');
      assert.equal(f.mutated, false, 'rendering MAP mutates no player/activeMap/location');
    }

    // ── 5. No neighbouring simulation while MAP active ──────────────────────
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP'); continuousWorldViewEnabled=true; return nearbySimulationMapSet();})()"), null, 'no nearby 3x3 simulation set while the legacy home is active');
    // a synthetic MAP-owned mover uses the legacy active-key gate, not the 3x3 set
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP'); continuousWorldViewEnabled=true; return npcShouldSimulate({map:'overworld', physicalMapId:'MAP', movement:{type:'patrol'}, x:0, y:0});})()"), true, 'a MAP-owned mover simulates only via the legacy active gate (MAP is active) — not because of Continuous View');

    // ── 6. Leaving EAST to MAP2: discrete landing/cooldown + auto-continuous ─
    {
      const gg = ctx();
      gg.run("debugWarpToDestination('outdoor:MAP'); resetLocationState(); activeMap=mapRefForId('MAP'); continuousWorldViewEnabled=true; combat.cooldown=0; player.x=14.5*TILE; player.y=4.5*TILE; player.facing='right';");
      gg.hold('ArrowRight'); let out=false; for (let i=0;i<20&&!out;i++){ gg.frames(1); out=gg.run("mapIdForRef(activeMap)==='MAP2'"); } gg.release('ArrowRight');
      assert.ok(out, 'walked east onto MAP2 via the existing point crossing');
      assert.equal(gg.run('player.x'), gg.run('1.5*TILE'), 'discrete inset landing preserved (MAP2 x=1.5*TILE)');
      assert.equal(gg.run('combat.cooldown'), 0, 'MAP<->MAP2 crossing keeps its no-cooldown behavior');
      assert.equal(gg.run('continuousWorldViewEnabled'), true, 'session toggle unchanged');
      assert.equal(gg.run('continuousWorldViewActive()'), true, 'continuous presentation activates automatically on the first MAP2 frame');
    }

    // ── 7. Leaving NORTH to MAP_N1: discrete landing/cooldown + auto-continuous ─
    {
      const gg = ctx();
      gg.run("debugWarpToDestination('outdoor:MAP'); resetLocationState(); activeMap=mapRefForId('MAP'); continuousWorldViewEnabled=true; combat.cooldown=0; player.x=7.5*TILE; player.y=1.5*TILE; player.facing='up';");
      gg.hold('ArrowUp'); let out=false; for (let i=0;i<20&&!out;i++){ gg.frames(1); out=gg.run("mapIdForRef(activeMap)==='MAP_N1'"); } gg.release('ArrowUp');
      assert.ok(out, 'walked north onto MAP_N1 via the existing point crossing');
      assert.equal(gg.run('player.y'), gg.run('13.5*TILE'), 'discrete inset landing preserved (MAP_N1 y=13.5*TILE)');
      assert.ok(gg.run('combat.cooldown') > 0, 'MAP<->MAP_N1 crossing keeps its cooldown behavior');
      assert.equal(gg.run('continuousWorldViewActive()'), true, 'continuous activates automatically on MAP_N1');
    }

    // ── 8. Returning restores fixed presentation without changing the toggle ─
    {
      const gg = ctx();
      // from MAP2 west back into MAP
      gg.run("debugWarpToDestination('outdoor:MAP2'); resetLocationState(); activeMap=mapRefForId('MAP2'); continuousWorldViewEnabled=true; player.x=1.5*TILE; player.y=4.5*TILE; player.facing='left';");
      gg.hold('ArrowLeft'); let home=false; for (let i=0;i<20&&!home;i++){ gg.frames(1); home=gg.run("mapIdForRef(activeMap)==='MAP'"); } gg.release('ArrowLeft');
      assert.ok(home, 'returned west into MAP');
      assert.equal(gg.run('continuousWorldViewEnabled'), true, 'toggle still ON after returning home');
      assert.equal(gg.run('continuousWorldViewActive()'), false, 'first home frame is the fixed legacy presentation');
      // from MAP_N1 south back into MAP
      gg.run("debugWarpToDestination('outdoor:MAP_N1'); resetLocationState(); activeMap=mapRefForId('MAP_N1'); continuousWorldViewEnabled=true; player.x=7.5*TILE; player.y=13.5*TILE; player.facing='down';");
      gg.hold('ArrowDown'); let home2=false; for (let i=0;i<20&&!home2;i++){ gg.frames(1); home2=gg.run("mapIdForRef(activeMap)==='MAP'"); } gg.release('ArrowDown');
      assert.ok(home2, 'returned south into MAP');
      assert.equal(gg.run('continuousWorldViewActive()'), false, 'home is fixed again');
      assert.equal(gg.run('continuousWorldViewEnabled'), true, 'toggle unchanged');
    }

    // ── 9. Toggle OFF preserves all four legacy crossings ───────────────────
    {
      const legacyCross = (fromWarp, fromMap, setPos, key, toMap) => {
        const gg = ctx();
        gg.run(`debugWarpToDestination('outdoor:${fromWarp}'); resetLocationState(); activeMap=mapRefForId('${fromMap}'); continuousWorldViewEnabled=false; ${setPos}`);
        gg.hold(key); let done=false; for (let i=0;i<24&&!done;i++){ gg.frames(1); done=gg.run(`mapIdForRef(activeMap)==='${toMap}'`); } gg.release(key);
        return done;
      };
      assert.ok(legacyCross('MAP','MAP',"player.x=14.5*TILE; player.y=4.5*TILE; player.facing='right';",'ArrowRight','MAP2'), 'toggle off: MAP->MAP2');
      assert.ok(legacyCross('MAP2','MAP2',"player.x=1.5*TILE; player.y=4.5*TILE; player.facing='left';",'ArrowLeft','MAP'), 'toggle off: MAP2->MAP');
      assert.ok(legacyCross('MAP','MAP',"player.x=7.5*TILE; player.y=1.5*TILE; player.facing='up';",'ArrowUp','MAP_N1'), 'toggle off: MAP->MAP_N1');
      assert.ok(legacyCross('MAP_N1','MAP_N1',"player.x=7.5*TILE; player.y=13.5*TILE; player.facing='down';",'ArrowDown','MAP'), 'toggle off: MAP_N1->MAP');
    }

    // ── 10 + 11. Render plans from MAP2 / MAP_N1 / RODDON never contain MAP ──
    const cases = [
      ['MAP2', 0.5 * 32, 7.5 * 32], ['MAP2', 0.5 * 32, 12.5 * 32],       // MAP2 west edge (top + bottom)
      ['MAP_N1', 7.5 * 32, 14.5 * 32], ['MAP_N1', 1.5 * 32, 14.5 * 32],  // MAP_N1 south edge
      ['RODDON_WAY_MAP', 2.5 * 32, 13.5 * 32], ['RODDON_WAY_MAP', 1.5 * 32, 14.5 * 32], // diagonal SW
    ];
    for (const [mid, px, py] of cases) {
      const p = plan(g, mid, px, py);
      assert.ok(!p.visibleChunks.some((c) => c.mapId === 'MAP'), `${mid} @(${px},${py}): render plan never contains MAP`);
      assert.equal(rectHitsMAP(p.camPxX, p.camPxY), false, `${mid} @(${px},${py}): camera viewport does not intersect the MAP chunk rect (no MAP, no void hole)`);
      // every visible chunk is a real placed map (no invented/void entry)
      assert.ok(p.visibleChunks.every((c) => g.run(`!!mapIdForChunk('overworld',${c.chunkX},${c.chunkY})`)), `${mid}: all visible chunks are placed`);
    }

    // ── 12. Camera deltas bounded/deterministic near direct + diagonal ──────
    const camDeltas = (mid, x0, y0, dx, dy, n) => {
      let prev = null, maxD = 0;
      for (let i = 0; i <= n; i++) {
        const p = plan(g, mid, x0 + dx * i, y0 + dy * i);
        if (prev) maxD = Math.max(maxD, Math.abs(p.camPxX - prev.camPxX), Math.abs(p.camPxY - prev.camPxY));
        prev = p;
      }
      return maxD;
    };
    // approach MAP2 west edge (moving west, SPEED/frame): camX clamps smoothly at 512
    assert.ok(camDeltas('MAP2', 6 * 32, 7.5 * 32, -SPEED, 0, 40) <= SPEED, 'direct west approach: camera delta <= SPEED per frame');
    // approach MAP_N1 south edge (moving south)
    assert.ok(camDeltas('MAP_N1', 7.5 * 32, 6 * 32, 0, SPEED, 60) <= SPEED, 'direct south approach: camera delta <= SPEED per frame');
    // diagonal approach in RODDON toward the SW corner
    assert.ok(camDeltas('RODDON_WAY_MAP', 8 * 32, 8 * 32, -SPEED, SPEED, 40) <= SPEED, 'diagonal SW approach: camera delta <= SPEED per frame');

    // ── 13. MAP content cannot be reached from the continuous side ──────────
    // MAP is not an eligible continuous seam of any map, and no cross-seam query
    // resolves into MAP's chunk from a continuous neighbour.
    assert.equal(g.run("!!eligibleContinuousSeam('MAP','east')"), false, 'MAP has no eligible continuous seam east');
    assert.equal(g.run("!!eligibleContinuousSeam('MAP2','west')"), false, 'MAP2 has no eligible continuous seam west (into MAP)');
    assert.equal(g.run("continuousSeamCrossingAt('MAP2', 0*512+8*32, 5*480+7*32)"), null, 'a cross-seam query from MAP2 into MAP resolves to no eligible seam');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP2'); player.x=1*TILE; player.y=7*TILE; return crossSeamNeighbourFor('MAP2', 0*512+8*32, 5*480+7*32);})()"), null, 'no cross-seam neighbour resolves into the legacy home');

    // ── 14. Other continuous chunks still behave normally ───────────────────
    assert.ok(g.run("!!eligibleContinuousSeam('MAP2','north')"), 'MAP2<->RODDON seam still eligible');
    assert.ok(g.run("!!eligibleContinuousSeam('RODDON_WAY_MAP','south')"), 'RODDON<->MAP2 reciprocal still eligible');
    // a continuous neighbour still appears in a plan (RODDON above MAP2)
    assert.ok(plan(g, 'MAP2', 8 * 32, 0.5 * 32).visibleChunks.some((c) => c.mapId === 'RODDON_WAY_MAP'), 'MAP2 near its north edge still shows RODDON as a continuous neighbour');

    // ── 15. Thornmere Fen <-> Northern Fen pilot unchanged ──────────────────
    assert.ok(g.run("!!eligibleContinuousSeam('MAP3','north')"), 'MAP3<->MAP3_N1 pilot seam still eligible');
    assert.ok(g.run("!!eligibleContinuousSeam('MAP3_N1','south')"), 'MAP3_N1<->MAP3 reciprocal still eligible');
    assert.equal(g.run("regionalPresentationForMapId('MAP3')"), 'continuous', 'MAP3 stays continuous');

    // ── 16 + 17. INTENTIONAL_DISCRETE classification + totals ───────────────
    const audit = require('../transition-audit.js');
    const V = {}; for (const e of audit.seamReadiness.edges) V[e.mapId + '|' + e.dir] = e.verdict;
    for (const k of ['MAP|east', 'MAP|north', 'MAP2|west', 'MAP_N1|south']) assert.equal(V[k], 'INTENTIONAL_DISCRETE', `${k} is INTENTIONAL_DISCRETE`);
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 26, ALIGNS: 20, NEEDS_REMAP: 6, BLOCKED: 4 }, 'totals: ALIGNS 20 / NEEDS_REMAP 6 / INTENTIONAL_DISCRETE 4 / BLOCKED 4 / BORDER 26');
    assert.equal(audit.seamReadiness.edges.filter((e) => e.verdict === 'CONFLICT' || e.verdict === 'OUTSIDE_REGION').length, 0, 'no CONFLICT / OUTSIDE_REGION');
    // remaining unique NEEDS_REMAP pairs
    const nr = new Set(audit.seamReadiness.edges.filter((e) => e.verdict === 'NEEDS_REMAP').map((e) => [e.mapId, e.neighbor].sort().join('<->')));
    assert.deepEqual([...nr].sort(), ['MAP4<->MAP5', 'MAP3_N2<->NORTH_BASIN_S_MAP', 'MAP_N1<->MAP_N2'].sort(), 'the 3 remaining NEEDS_REMAP pairs are exactly as expected');
    assert.equal(g.run('continuousSeamEntries().length'), 20, '20 eligible directed seams (10 pairs)');

    // ── 18. Geographic encounter pools correct on MAP / MAP2 / MAP_N1 ───────
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP'); player.x=6*TILE; player.y=6*TILE; return currentEncounterPool()===EARLY_ENEMY_TEMPLATES;})()"), true, 'MAP pool is EARLY_ENEMY_TEMPLATES (geography unaffected by presentation)');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP2'); player.x=6*TILE; player.y=6*TILE; return currentEncounterPool()===mapEntryForId('MAP2').encounterPool;})()"), true, 'MAP2 pool correct');
    assert.equal(g.run("geographicEncounterContext('overworld', 0*512+256, 5*480+240).mapId"), 'MAP', 'MAP still resolves for geographic encounters');

    // ── 19. Save/load on MAP; SAVE_VERSION 3; no presentation/debug state saved ─
    {
      const gg = ctx();
      gg.run("resetLocationState(); activeMap=mapRefForId('MAP'); player.x=6.5*TILE; player.y=6.5*TILE; continuousWorldViewEnabled=true; saveGame();");
      const saved = JSON.parse(gg.run("localStorage.getItem('verdantVale_save')"));
      assert.equal(saved.version, 3, 'SAVE_VERSION stays 3');
      assert.ok(!/regionalPresentation|continuousWorldView|legacy_screen|presentation/i.test(Object.keys(saved).join(',') + JSON.stringify(saved.locationState || {})), 'no presentation/debug-toggle state enters the save');
      gg.run("activeMap=mapRefForId('MAP2'); player.x=1; player.y=1; loadGame();");
      assert.equal(gg.run("mapIdForRef(activeMap)"), 'MAP', 'load restores MAP');
      assert.ok(Math.abs(gg.run('player.x') - 6.5 * 32) < 1, 'load restores position on MAP');
    }

    // ── 20. Pure helpers: no randomness, no runtime mutation ────────────────
    {
      g.run("resetLocationState(); activeMap=mapRefForId('MAP2'); player.x=100; player.y=120;");
      const before = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+continuousWorldViewEnabled");
      const rc = g.run(`(function(){
        var n=0,_r=Math.random; Math.random=function(){n++; return _r();};
        regionalPresentationForMapId('MAP'); isLegacyScreenMap('MAP');
        legacyScreenChunkRects('overworld');
        continuousCameraOrigin('overworld', 300, 2500, 512, 480, legacyScreenChunkRects('overworld'));
        buildContinuousWorldPlan('overworld','MAP2',100,120,512,480);
        Math.random=_r; return n;
      })()`);
      assert.equal(rc, 0, 'presentation/camera helpers consume no randomness');
      assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+continuousWorldViewEnabled"), before, 'presentation/camera helpers mutate no active map / player / toggle state');
    }

    // ── 21. HARDENING 1: legacy_screen chunks excluded from continuous-side NPC sim ─
    // A MAP-owned mover must NOT initialise/update a route, move, face, or enter
    // scope while a NEARBY continuous map (MAP2 / MAP_N1 / RODDON) is active — MAP is
    // hidden behind its presentation border. Filtered once, in nearbySimulationMapSet().
    const MAP_NPC = "{id:'h1_map', name:'MapMover', map:'overworld', physicalMapId:'MAP', spriteType:'clerk', x:6.5*TILE, y:6.5*TILE, facing:'down', movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:6.5,y:6.5},{x:7.5,y:6.5}]}}";
    const CTRL_NPC = "{id:'h1_ctrl', name:'Ctrl', map:'map3_n1', spriteType:'clerk', x:5.5*TILE, y:5.5*TILE, facing:'right', movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:5.5,y:5.5},{x:6.5,y:5.5}]}}";
    for (const [activeMapId, warpId] of [['MAP2', 'MAP2'], ['MAP_N1', 'MAP_N1'], ['RODDON_WAY_MAP', 'RODDON_WAY_MAP']]) {
      const gg = ctx();
      gg.run(`debugWarpToDestination('outdoor:${warpId}'); resetLocationState(); activeMap=mapRefForId('${activeMapId}'); continuousWorldViewEnabled=true; debugMode=true; for (var k in keys) delete keys[k]; player.x=8*TILE; player.y=7*TILE; player.moving=false;`);
      gg.run(`SIMPLE_NPCS.push(${MAP_NPC}); MOVEMENT_HOMES['h1_map']={x:6.5*TILE,y:6.5*TILE,facing:'down'};`);
      // (1) MAP absent from the nearby simulation set
      assert.equal(gg.run("nearbySimulationMapSet().has('MAP')"), false, `${activeMapId} active: MAP excluded from nearbySimulationMapSet()`);
      // (5) no scope, and excluded from the legacy active-map NPC filters
      assert.equal(gg.run("regionalNpcInSimulationScope(SIMPLE_NPCS.find(function(n){return n.id==='h1_map';}))"), false, `${activeMapId}: MAP NPC not in simulation scope (no collision/render/interact path)`);
      assert.equal(gg.run("npcExplicitOwnershipMismatchesActive(SIMPLE_NPCS.find(function(n){return n.id==='h1_map';}))"), true, `${activeMapId}: MAP NPC excluded from active-map render/interact/collision filters`);
      // drive frames; NPC must be completely unchanged and get no route
      gg.frames(6);
      assert.equal(gg.run("!!NPC_ROUTES['h1_map']"), false, `${activeMapId}: no route is created for the MAP-owned NPC (4)`);
      assert.equal(gg.run("SIMPLE_NPCS.find(function(n){return n.id==='h1_map';}).x"), gg.run('6.5*TILE'), `${activeMapId}: MAP NPC x unchanged`);
      assert.equal(gg.run("SIMPLE_NPCS.find(function(n){return n.id==='h1_map';}).y"), gg.run('6.5*TILE'), `${activeMapId}: MAP NPC y unchanged`);
      assert.equal(gg.run("SIMPLE_NPCS.find(function(n){return n.id==='h1_map';}).facing"), 'down', `${activeMapId}: MAP NPC facing unchanged`);
    }
    // (6) a second NPC on a nearby continuous chunk still simulates normally
    {
      const gg = ctx();
      gg.run("debugWarpToDestination('outdoor:MAP2'); resetLocationState(); activeMap=mapRefForId('MAP2'); continuousWorldViewEnabled=true; debugMode=true; for (var k in keys) delete keys[k]; player.x=8*TILE; player.y=7*TILE;");
      gg.run(`SIMPLE_NPCS.push(${CTRL_NPC}); MOVEMENT_HOMES['h1_ctrl']={x:5.5*TILE,y:5.5*TILE,facing:'right'};`);
      assert.equal(gg.run("nearbySimulationMapSet().has('MAP3_N1')"), true, 'a nearby CONTINUOUS chunk (MAP3_N1) stays in the simulation set');
      gg.frames(2);
      assert.equal(gg.run("!!NPC_ROUTES['h1_ctrl']"), true, 'a nearby continuous-chunk NPC still starts/simulates its route normally');
    }
    // (7) the simulation helper is pure — no runtime/authored/toggle mutation
    {
      const gg = ctx();
      gg.run("resetLocationState(); activeMap=mapRefForId('MAP2'); continuousWorldViewEnabled=true; player.x=50; player.y=60;");
      const before = gg.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+continuousWorldViewEnabled+'|'+regionalPresentationForMapId('MAP')");
      gg.run("nearbySimulationMapSet(); npcShouldSimulate({map:'overworld', physicalMapId:'MAP', x:0, y:0}); regionalNpcInSimulationScope({map:'overworld', physicalMapId:'MAP', x:0, y:0});");
      assert.equal(gg.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+continuousWorldViewEnabled+'|'+regionalPresentationForMapId('MAP')"), before, 'simulation-scope helpers mutate no activeMap/player/location/presentation/toggle state');
    }

    // ── 22. HARDENING 2: reciprocal legacy-boundary point crossing is an invariant ─
    // Shared REGIONAL_POINT_CROSSINGS authority (world-transitions.js), consumed by
    // both the audit and validateGameData()/legacyBoundaryCrossingErrors().
    assert.ok(g.run("typeof REGIONAL_POINT_CROSSINGS !== 'undefined' && REGIONAL_POINT_CROSSINGS.length === 10"), 'REGIONAL_POINT_CROSSINGS is the shared production authority (10 directed regional crossings)');
    // (1) current MAP<->MAP2 and MAP<->MAP_N1 pass; whole-game validation is clean
    assert.deepEqual(g.run("JSON.stringify(legacyBoundaryCrossingErrors('overworld'))"), '[]', 'the two Verdant Vale boundaries validate clean');
    assert.equal(g.run("validateGameData().errorList.length"), 0, 'validateGameData reports 0 errors with the boundary invariant');
    // helper: mutate REGIONAL_POINT_CROSSINGS, collect matching boundary errors, then
    // FULLY restore the array in place from a snapshot (proves no persistent mutation).
    const boundaryErrs = (mut, re) => JSON.parse(g.run(`(function(){
      var snapshot = JSON.stringify(REGIONAL_POINT_CROSSINGS);
      ${mut}
      var e = legacyBoundaryCrossingErrors('overworld');
      var snap = JSON.parse(snapshot); REGIONAL_POINT_CROSSINGS.length = 0; snap.forEach(function(c){ REGIONAL_POINT_CROSSINGS.push(c); });
      return JSON.stringify({ matched: e.filter(function(m){return ${re}.test(m);}), restored: (JSON.stringify(REGIONAL_POINT_CROSSINGS) === snapshot) });
    })()`));
    // (2) missing one reciprocal direction
    let r = boundaryErrs("var i=REGIONAL_POINT_CROSSINGS.findIndex(function(c){return c.from==='MAP2'&&c.dir==='west';}); REGIONAL_POINT_CROSSINGS.splice(i,1);", "/missing\\/wrong reciprocal point crossing MAP2\\.west/");
    assert.ok(r.matched.length > 0, 'removing one reciprocal direction errors, naming the maps + edge');
    assert.ok(r.restored, 'fixture restored (missing-reciprocal)');
    // (3) missing BOTH directions of MAP<->MAP2 (adjacency still placed -> error)
    r = boundaryErrs("var kept=REGIONAL_POINT_CROSSINGS.filter(function(c){return !((c.from==='MAP'&&c.to==='MAP2')||(c.from==='MAP2'&&c.to==='MAP'));}); REGIONAL_POINT_CROSSINGS.length=0; kept.forEach(function(c){REGIONAL_POINT_CROSSINGS.push(c);});", "/MAP\\.east <-> MAP2|MAP2\\.west <-> MAP/");
    assert.ok(r.matched.length > 0, 'removing both directions still errors (the placed legacy/continuous adjacency remains)');
    assert.ok(r.restored, 'fixture restored (both-missing)');
    // (4) wrong target
    r = boundaryErrs("REGIONAL_POINT_CROSSINGS.find(function(x){return x.from==='MAP'&&x.dir==='east';}).to='MAP3';", "/missing\\/wrong point crossing MAP\\.east .*expected MAP2/");
    assert.ok(r.matched.length > 0, 'a wrong target map errors, naming the expected neighbour');
    assert.ok(r.restored, 'fixture restored (wrong-target)');
    // (5) non-inverse reciprocal edge
    r = boundaryErrs("REGIONAL_POINT_CROSSINGS.find(function(x){return x.from==='MAP2'&&x.dir==='west';}).dir='north';", "/reciprocal point crossing MAP2\\.west/");
    assert.ok(r.matched.length > 0, 'a non-inverse reciprocal edge errors (reciprocal not found on the inverse edge)');
    assert.ok(r.restored, 'fixture restored (noninverse)');
    // (6) an eligible broad seam across the same boundary
    {
      const b = JSON.parse(g.run(`(function(){
        EDGE_TRANSITIONS.MAP={east:[{targetMap:'MAP2',targetEdge:'west',sourceRange:[4,4]}]};
        var e=legacyBoundaryCrossingErrors('overworld');
        delete EDGE_TRANSITIONS.MAP;
        return JSON.stringify({ matched: e.filter(function(m){return /broad EDGE_TRANSITIONS segment crosses/.test(m);}), restored: (EDGE_TRANSITIONS.MAP===undefined) });
      })()`));
      assert.ok(b.matched.length > 0, 'a broad seam across the legacy boundary errors');
      assert.ok(b.restored, 'fixture restored (broad-seam)');
    }
    // (7) a legacy-screen edge with NO placed neighbour stays a legal BORDER (no error)
    assert.ok(g.run("legacyBoundaryCrossingErrors('overworld').every(function(m){return !/MAP\\.south|MAP\\.west/.test(m);})"), 'MAP.south / MAP.west (no placed neighbour) are ordinary BORDER edges — no crossing required');
    // (8) continuous/continuous BLOCKED pairs remain legal + still BLOCKED in the audit
    const audit2 = require('../transition-audit.js');
    const V2 = {}; for (const e of audit2.seamReadiness.edges) V2[e.mapId + '|' + e.dir] = e.verdict;
    assert.equal(V2['MAP_N1|east'], 'BLOCKED', 'MAP_N1|east continuous/continuous BLOCKED pair unaffected');
    assert.equal(V2['NORTH_BASIN_C_MAP|west'], 'BLOCKED', 'NB_C|west BLOCKED pair unaffected');
    assert.equal(g.run("validateGameData().errorList.length"), 0, 'BLOCKED pairs cause no legacy-boundary error');
    // (9) validation + restoration mutated no persistent authored/runtime state
    assert.equal(g.run("REGIONAL_POINT_CROSSINGS.length"), 10, 'REGIONAL_POINT_CROSSINGS intact after all negative fixtures');
    assert.equal(g.run("EDGE_TRANSITIONS.MAP === undefined"), true, 'no stray EDGE_TRANSITIONS.MAP left behind');
    assert.deepEqual(g.run("JSON.stringify(legacyBoundaryCrossingErrors('overworld'))"), '[]', 'boundary invariant clean again after all fixtures restored');
  },
};
