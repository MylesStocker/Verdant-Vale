'use strict';
// DEBUG continuous-view READ-ONLY neighbouring outdoor content (continuous-
// content.js + render.js). When Continuous View is on, every VISIBLE placed
// outdoor chunk renders its authored world content (items / NPCs / procedural
// landmarks) at its stable world origin — not just terrain — WITHOUT updating,
// interacting, collecting, triggering, or mutating anything. activeMap stays the
// behaviour authority; only the active chunk gets the player + active-only hints.
//
// Verified by spying on the render pipeline (no real canvas). Synthetic NPC/item
// fixtures are injected in-test only (no gameplay content added).

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Spy one render() frame; capture the neighbour-content contexts, item/NPC/decor
// calls, translates, player/active counts, 'SPACE' hint text, and mutation.
function spyFrame(g) {
  return JSON.parse(g.run(`(function(){
    var neighbourCtx = [], itemLists = [], npcKeys = [], translates = [];
    var stoneBody = 0, gateBody = 0, activeContent = 0, playerDrawn = 0, spaceHints = 0;
    var _t = ctx.translate, _ft = ctx.fillText;
    var _nc = drawNeighbourOutdoorContent, _mi = drawMapWorldItems, _np = drawContentNPCs;
    var _sb = drawThornmereStoneBody, _gb = drawDrenwichNorthGateBody;
    var _ac = drawActiveMapContent, _pl = drawPlayer;
    ctx.translate = function(x,y){ translates.push([x,y]); return _t && _t.apply(ctx, arguments); };
    ctx.fillText = function(s){ if (s === 'SPACE') spaceHints++; return _ft && _ft.apply(ctx, arguments); };
    drawNeighbourOutdoorContent = function(c){ neighbourCtx.push(c); return _nc(c); };
    drawMapWorldItems = function(l){ itemLists.push((l||[]).length); return _mi(l); };
    drawContentNPCs = function(k){ npcKeys.push(k); return _np(k); };
    drawThornmereStoneBody = function(){ stoneBody++; return _sb(); };
    drawDrenwichNorthGateBody = function(){ gateBody++; return _gb(); };
    drawActiveMapContent = function(){ activeContent++; return _ac(); };
    drawPlayer = function(){ playerDrawn++; return _pl(); };
    var before = { map: mapIdForRef(activeMap), x: player.x, y: player.y, key: currentContentLocationKey(), inTown: inTown, inDungeon: inDungeon };
    try { render(); } finally {
      ctx.translate=_t; ctx.fillText=_ft; drawNeighbourOutdoorContent=_nc; drawMapWorldItems=_mi; drawContentNPCs=_np;
      drawThornmereStoneBody=_sb; drawDrenwichNorthGateBody=_gb; drawActiveMapContent=_ac; drawPlayer=_pl;
    }
    var after = { map: mapIdForRef(activeMap), x: player.x, y: player.y, key: currentContentLocationKey(), inTown: inTown, inDungeon: inDungeon };
    return JSON.stringify({
      neighbourCtx: neighbourCtx, itemLists: itemLists, npcKeys: npcKeys, translates: translates,
      stoneBody: stoneBody, gateBody: gateBody, activeContent: activeContent, player: playerDrawn, spaceHints: spaceHints,
      mutated: JSON.stringify(before) !== JSON.stringify(after),
    });
  })()`));
}

module.exports = {
  name: 'continuous neighbour content: read-only outdoor items/NPCs/landmarks on visible chunks',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));
    const TILE = g.run('TILE'), COLS = g.run('COLS'), ROWS = g.run('ROWS');
    const CW = COLS * TILE, CH = ROWS * TILE;
    const warp = (id) => g.run(`debugWarpToDestination('outdoor:${id}'); dialogue.open=false;`);

    // ── 8 + 9. DECLARATIVE physical-map -> content-key authority (pure) ──────
    const ents = J('JSON.stringify(outdoorContentKeyEntries())');
    assert.equal(ents.length, 19, 'all 19 placed outdoor maps are bound');
    const byId = {}; ents.forEach(e => { byId[e.mapId] = e; });
    // full binding table matches the established currentContentLocationKey() mapping
    const expected = { MAP:'overworld', MAP2:'map2', MAP3:'map3', MAP4:'map4', MAP5:'overworld',
      MAP_N1:'map_n1', MAP_N2:'map_n2', RODDON_WAY_MAP:'overworld', MAP3_N1:'map3_n1', MAP3_N2:'map3_n2',
      NORTH_BASIN_S_MAP:'north_basin_s', NORTH_BASIN_C_MAP:'north_basin_c', NORTH_BASIN_SW_MAP:'north_basin_sw',
      NORTH_BASIN_W_MAP:'north_basin_w', NORTH_BASIN_NW_MAP:'north_basin_nw',
      DRENWICK_WEST_OUTFALL_MAP:'drenwick_west_outfall', NORTH_BASIN_N_MAP:'north_basin_n', NORTH_BASIN_NE_MAP:'north_basin_ne', NORTH_BASIN_E_MAP:'north_basin_e' };
    for (const id of Object.keys(expected)) {
      assert.equal(g.run(`outdoorContentKeyForMapId(${JSON.stringify(id)})`), expected[id], `${id} -> ${expected[id]}`);
      assert.equal(byId[id].key, expected[id], `entries: ${id} key`);
    }
    // ambiguity: MAP/MAP5/RODDON share 'overworld' (ambiguous); the other 12 unique
    const ambiguous = ents.filter(e => !e.unambiguous).map(e => e.mapId).sort();
    assert.deepEqual(ambiguous, ['MAP', 'MAP5', 'RODDON_WAY_MAP'], 'exactly MAP/MAP5/RODDON_WAY_MAP are ambiguous');
    assert.equal(ents.filter(e => e.unambiguous).length, 16, 'the other 16 bindings are unique');
    // namespace distinction: id !== key; non-outdoor ids resolve to null
    assert.notEqual('MAP2', byId['MAP2'].key);
    assert.equal(g.run("outdoorContentKeyForMapId('DRENWICK_INN_MAP')"), null, 'a non-outdoor map id is not bound');
    assert.equal(g.run("outdoorContentKeyForMapId('NOPE')"), null, 'an unknown id is not bound');

    // ── 8b. The authority resolves WITHOUT changing global state, and never
    //        calls resetLocationState()/applyLocationState() or assigns activeMap.
    const noWrite = J(`(function(){
      var reset=0, apply=0; var _r=resetLocationState, _a=applyLocationState;
      resetLocationState=function(){reset++;return _r.apply(null,arguments);};
      applyLocationState=function(){apply++;return _a.apply(null,arguments);};
      var before={ map: mapIdForRef(activeMap), key: currentContentLocationKey(), x: player.x, y: player.y };
      var keys=[]; ['MAP','MAP2','MAP5','NORTH_BASIN_C_MAP'].forEach(function(id){ keys.push(outdoorContentKeyForMapId(id)); });
      outdoorContentKeyEntries();
      var after={ map: mapIdForRef(activeMap), key: currentContentLocationKey(), x: player.x, y: player.y };
      resetLocationState=_r; applyLocationState=_a;
      return JSON.stringify({ reset:reset, apply:apply, unchanged: JSON.stringify(before)===JSON.stringify(after), keys:keys });
    })()`);
    assert.equal(noWrite.reset, 0, 'resolving keys never calls resetLocationState()');
    assert.equal(noWrite.apply, 0, 'resolving keys never calls applyLocationState()');
    assert.ok(noWrite.unchanged, 'resolving keys changes no global state (activeMap/key/player)');

    // ── 2. Authority matches currentContentLocationKey() when each map is reached
    //       through LEGITIMATE established state (a real warp), not by spoofing. ─
    for (const id of ['MAP', 'MAP2', 'MAP5', 'RODDON_WAY_MAP', 'MAP4', 'MAP_N2', 'NORTH_BASIN_C_MAP', 'MAP3_N1']) {
      warp(id);
      assert.equal(g.run('currentContentLocationKey()'), expected[id], `${id}: currentContentLocationKey() matches the authority via legitimate state`);
    }
    // ── 9. currentContentLocationKey() unchanged across town/interior/dungeon/special
    g.run("debugWarpToDestination('town:drenwick_market');"); assert.equal(g.run('currentContentLocationKey()'), 'drenwick_market');
    g.run("debugWarpToDestination('interior:drenwick_inn');"); assert.equal(g.run('currentContentLocationKey()'), 'drenwick_inn');
    g.run("debugWarpToDestination('dungeon:f2');"); assert.equal(g.run('currentContentLocationKey()'), 'dungeon2');
    g.run("debugWarpToDestination('special:bridge');"); assert.equal(g.run('currentContentLocationKey()'), 'bridge_post');
    g.run("debugWarpToDestination('special:sluice_l1');"); assert.equal(g.run('currentContentLocationKey()'), 'sluice');

    // ── 8c. The FIRST continuous frame (which renders neighbour content) performs
    //        NO state writes — no resetLocationState/applyLocationState, no
    //        activeMap/content-key change (not merely net-zero). ────────────────
    warp('MAP3'); g.run('forceLegacyRegionalView = false; player.x = 14.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();');
    const frameNoWrite = J(`(function(){
      var reset=0, apply=0; var _r=resetLocationState, _a=applyLocationState;
      resetLocationState=function(){reset++;return _r.apply(null,arguments);};
      applyLocationState=function(){apply++;return _a.apply(null,arguments);};
      var beforeMap = mapIdForRef(activeMap), beforeKey = currentContentLocationKey();
      render();  // first frame that renders neighbour outdoor content
      var res = { reset:reset, apply:apply, mapSame: mapIdForRef(activeMap)===beforeMap, keySame: currentContentLocationKey()===beforeKey };
      resetLocationState=_r; applyLocationState=_a;
      return JSON.stringify(res);
    })()`);
    assert.equal(frameNoWrite.reset, 0, 'first continuous frame calls resetLocationState() 0 times');
    assert.equal(frameNoWrite.apply, 0, 'first continuous frame calls applyLocationState() 0 times');
    assert.ok(frameNoWrite.mapSame && frameNoWrite.keySame, 'first continuous frame writes no activeMap/content-key state');

    // ── 1 + 3 + 5 + 7 + 4 + 6. Visible chunks get contexts, at world origins,
    //     row-major, once each; active content + player once ─────────────────
    warp('MAP3'); g.run('forceLegacyRegionalView = false; player.x = 14.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();'); // NE corner -> MAP4 + MAP3_N1 neighbours
    const plan = J("JSON.stringify((function(){var c=regionalWorldPosition();return c?buildContinuousWorldPlanFromWorld(c.regionId,c.worldPxX,c.worldPxY,512,480):null;})())");
    const activeId = plan.activeMapId;
    const neighbours = plan.visibleChunks.filter(c => c.mapId !== activeId);
    assert.ok(neighbours.length >= 1, 'the frame has at least one visible neighbour');
    const f = spyFrame(g);
    assert.deepEqual(f.neighbourCtx.map(c => c.mapId), neighbours.map(c => c.mapId), 'a content context per visible neighbour, in row-major order');
    assert.equal(new Set(f.neighbourCtx.map(c => c.mapId)).size, f.neighbourCtx.length, 'each neighbour rendered exactly once');
    assert.ok(f.neighbourCtx.every(c => c.isActiveChunk === false), 'neighbour contexts are marked non-active');
    assert.equal(f.activeContent, 1, 'active chunk content rendered exactly once');
    assert.equal(f.mutated, false, 'no activeMap/location-state mutation during render');
    // world origin: each neighbour's translate is its stable world origin
    for (const n of neighbours) {
      assert.ok(f.translates.some(([x, y]) => x === n.worldPxX && y === n.worldPxY),
        `neighbour ${n.mapId} content translated to its stable world origin`);
    }

    // ── 17 + 18. Procedural landmark bodies render for the correct neighbour;
    //     active-only hints stay active-only ──────────────────────────────────
    assert.ok(neighbours.some(n => n.mapId === 'MAP4'), 'MAP4 (Thornmere Stone) is a visible neighbour here');
    assert.equal(f.stoneBody, 1, 'the Thornmere Stone body renders on the MAP4 neighbour chunk');
    assert.equal(f.spaceHints, 0, 'no SPACE hint is emitted for a neighbour landmark (active-only)');
    // MAP_N2 gate as a neighbour of MAP_N1
    warp('MAP_N1'); g.run('forceLegacyRegionalView = false; player.x = 7.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();'); // north edge -> MAP_N2 neighbour
    const fg = spyFrame(g);
    assert.equal(fg.gateBody, 1, 'the sealed-gate body renders on the MAP_N2 neighbour chunk');
    assert.equal(fg.spaceHints, 0, 'no SPACE hint for the neighbour gate');

    // ── 10 + 11 + 12. Neighbour NPCs: existing positions, read-only, no hint ─
    // Synthetic NPC fixture on an UNAMBIGUOUS neighbour key ('north_basin_c').
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();'); // NB_C visible north
    // Neighbour NPCs now render by PHYSICAL-map ownership (drawContentNPCsForPhysicalMap),
    // resolved from the unambiguous key ('north_basin_c' -> NORTH_BASIN_C_MAP).
    const npcRes = J(`(function(){
      var fake = { id:'__cc_npc', map:'north_basin_c', x:5.5*TILE, y:5.5*TILE, spriteType:'clerk' };
      SIMPLE_NPCS.push(fake);
      var beforeX = fake.x, beforeY = fake.y;
      var _np = drawContentNPCsForPhysicalMap, ids=[]; drawContentNPCsForPhysicalMap=function(m){ ids.push(m); return _np(m); };
      render();
      drawContentNPCsForPhysicalMap = _np;
      var res = { ids: ids, npcMoved: (fake.x!==beforeX || fake.y!==beforeY) };
      SIMPLE_NPCS.splice(SIMPLE_NPCS.indexOf(fake),1);
      return JSON.stringify(res);
    })()`);
    assert.ok(npcRes.ids.includes('NORTH_BASIN_C_MAP'), 'the neighbour NB_C NPC is rendered by its physical map (derived from the unambiguous key)');
    assert.equal(npcRes.npcMoved, false, 'rendering a neighbour NPC does not advance/mutate its position');

    // ── 14 + 15 + 16. Neighbour items: uncollected render, collected absent,
    //     no pickup/mutation ───────────────────────────────────────────────────
    // MAP3_N1 has an authored world item; view it as a neighbour of MAP3_N2.
    warp('MAP3_N2'); g.run('forceLegacyRegionalView = false; player.x = 7.5*TILE; player.y = 14.5*TILE;'); // south edge -> MAP3_N1 neighbour
    const itemRes = J(`(function(){
      var items = mapEntryForId('MAP3_N1').items || [];
      var drawn = [];
      var _mi = drawMapWorldItems; drawMapWorldItems = function(l){ drawn.push((l||[]).map(function(w){return w.picked?'.':'x';}).join('')); return _mi(l); };
      var invBefore = stats.items.length;
      // uncollected
      var savedPicked = items.length ? items[0].picked : undefined;
      if (items.length) items[0].picked = false;
      render();
      var uncollected = drawn.slice();
      // collected -> must be skipped by drawMapWorldItems (loop 'if(wi.picked)continue')
      drawn = [];
      if (items.length) items[0].picked = true;
      render();
      var collected = drawn.slice();
      if (items.length) items[0].picked = savedPicked;
      drawMapWorldItems = _mi;
      return JSON.stringify({ hadItems: items.length>0, uncollected: uncollected, collected: collected, invUnchanged: stats.items.length===invBefore });
    })()`);
    assert.ok(itemRes.hadItems, 'MAP3_N1 has an authored item to render as a neighbour');
    assert.ok(itemRes.invUnchanged, 'rendering neighbour items never collects/mutates inventory');
    // (the neighbour item list is passed to drawMapWorldItems, which skips .picked entries)

    // ── 20. Camera motion changes only screen placement, not world content ──
    // The MAP4 stone body draws at the SAME world coords under two camera positions.
    warp('MAP3'); g.run('forceLegacyRegionalView = false;');
    const stoneWorldAt = (px) => J(`(function(){
      player.x = ${px}; player.y = 0.5*TILE;
      var coords=null; var _sb=drawThornmereStoneBody, _fr=ctx.fillRect, cur=null;
      drawThornmereStoneBody=function(){ // capture the first fillRect coord it emits, in the current (translated) space is hard;
        return _sb(); };
      // Instead compare the neighbour translate for MAP4 (its stable world origin) — camera-independent.
      var plan = (function(){var c=regionalWorldPosition();return c?buildContinuousWorldPlanFromWorld(c.regionId,c.worldPxX,c.worldPxY,512,480):null;})();
      var m4 = (plan.visibleChunks.filter(function(c){return c.mapId==='MAP4';})[0])||null;
      drawThornmereStoneBody=_sb;
      return JSON.stringify(m4 ? [m4.worldPxX, m4.worldPxY] : null);
    })()`);
    const a = stoneWorldAt('13.5*TILE'), b = stoneWorldAt('14.5*TILE');
    assert.ok(a && b, 'MAP4 visible as a neighbour at both camera positions');
    assert.deepEqual(a, b, 'the neighbour chunk world origin is identical under two camera positions (content locked to world coords)');

    // ── 21. Active content does not jump/duplicate when a chunk becomes active ─
    // The content world origin of a map is the same whether it is the active chunk
    // or a neighbour (same placement), so no jump on handoff.
    const originAsNeighbour = J("JSON.stringify([regionPlacementForMapId('NORTH_BASIN_C_MAP').chunkX*" + CW + ", regionPlacementForMapId('NORTH_BASIN_C_MAP').chunkY*" + CH + "])");
    warp('NORTH_BASIN_C_MAP');
    const originAsActive = J("JSON.stringify([regionPlacementForMapId(mapIdForRef(activeMap)).chunkX*" + CW + ", regionPlacementForMapId(mapIdForRef(activeMap)).chunkY*" + CH + "])");
    assert.deepEqual(originAsActive, originAsNeighbour, 'a map renders at the same world origin as active or neighbour (no jump on handoff)');

    // ── 2. Sparse/unplaced chunks receive no content ────────────────────────
    // A viewport over an unplaced gap chunk yields no neighbour contexts.
    warp('NORTH_BASIN_NW_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 8.5*TILE;');
    const sparse = spyFrame(g);
    for (const c of sparse.neighbourCtx) {
      assert.ok(g.run(`mapIdForChunk('overworld', regionPlacementForMapId(${JSON.stringify(c.mapId)}).chunkX, regionPlacementForMapId(${JSON.stringify(c.mapId)}).chunkY)`),
        'every neighbour context is a real placed chunk (no content for gaps)');
    }

    // ── 22 + 23. Continuous View OFF, and non-region maps, use the legacy path ─
    warp('MAP3'); g.run('forceLegacyRegionalView = true; player.x = 14.5*TILE; player.y = 0.5*TILE;');
    const legacy = spyFrame(g);
    assert.equal(legacy.neighbourCtx.length, 0, 'flag off: no neighbour content (legacy path)');
    assert.equal(legacy.activeContent, 1, 'flag off: active content once (legacy)');
    g.run("debugWarpToDestination('town:calwick_south'); forceLegacyRegionalView = false;");
    const town = spyFrame(g);
    assert.equal(town.neighbourCtx.length, 0, 'a town uses the legacy path (no neighbour content)');
    g.run('enterMeadow(); forceLegacyRegionalView = false;');
    const meadow = spyFrame(g);
    assert.equal(meadow.neighbourCtx.length, 0, 'the hidden meadow uses the legacy path');

    // ── 19. No spoofing/mutation across all the above frames (spot re-check) ─
    warp('MAP3'); g.run('forceLegacyRegionalView = false; player.x = 14.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();');
    const before = J('JSON.stringify({ map: mapIdForRef(activeMap), x: player.x, y: player.y, key: currentContentLocationKey() })');
    spyFrame(g);
    const after = J('JSON.stringify({ map: mapIdForRef(activeMap), x: player.x, y: player.y, key: currentContentLocationKey() })');
    assert.deepEqual(before, after, 'rendering neighbour content spoofs/mutates nothing (activeMap/player/key unchanged)');

    // ── 25. SAVE_VERSION 4; no render/debug state in saves ──────────────────
    // (worldPxX/worldPxY ARE legitimate v4 save data — the canonical regional
    // position — so they are not excluded here; camera/render transients are.)
    g.run('__reconcileCanonicalForTest(); saveGame();'); const raw = g.run("localStorage.getItem('verdantVale_save')");
    assert.equal(JSON.parse(raw).version, 4, 'SAVE_VERSION stays 4');
    assert.ok(!/continuousWorldView|camPx|visibleChunks/i.test(raw), 'no continuous-view/render/debug transient state enters the save');
  },
};
