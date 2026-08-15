'use strict';
// DEBUG continuous terrain + camera renderer (render.js drawContinuousWorld,
// world-view.js buildContinuousWorldPlanFromWorld). Visual prototype only — legacy
// movement/collision/transitions/saves/content are untouched, and default
// gameplay is pixel-identical when the flag is off.
//
// Verified by spying on the ctx transform ops + drawTile/drawMapTiles from the
// live render() (no real canvas): camera-as-transform (never subtracted from
// tile coords), stable world origins, exact visible ranges, balanced
// save/restore, screen-space UI after the camera is restored, and zero mutation
// of player/activeMap/location/regional data.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Runs render() once with ctx + draw spies; returns an ordered event log and
// captured terrain/transform data. Restores every wrapper in a finally.
function spyRender(g) {
  return JSON.parse(g.run(`(function(){
    var ev = [];               // ordered event log
    var translates = [];
    var tileCoords = [];       // every drawTile (x,y)
    var mapTileCalls = [];     // every drawMapTiles(mapId, originX, originY, range)
    var voidFilled = false, vignetteAfterRestore = null, playerDrawn = false;
    var saves = 0, restores = 0;
    var _s = ctx.save, _r = ctx.restore, _t = ctx.translate, _fr = ctx.fillRect;
    var _dt = drawTile, _dmt = drawMapTiles, _dp = drawPlayer;
    ctx.save = function(){ saves++; ev.push('save'); return _s && _s.apply(ctx, arguments); };
    ctx.restore = function(){ restores++; ev.push('restore'); return _r && _r.apply(ctx, arguments); };
    ctx.translate = function(x,y){ translates.push([x,y]); ev.push('translate'); return _t && _t.apply(ctx, arguments); };
    ctx.fillRect = function(x,y,w,h){
      if (x===0 && y===0 && w===512 && h===480) {
        // Distinguish the continuous void fill (solid CONTINUOUS_VOID_COLOR) from
        // the screen-space vignette (a gradient object) — both are 512x480 at 0,0.
        if (ctx.fillStyle === CONTINUOUS_VOID_COLOR) { ev.push('void'); voidFilled = true; }
        else { ev.push('vignette'); }
      }
      return _fr && _fr.apply(ctx, arguments);
    };
    drawTile = function(id,x,y){ tileCoords.push([x,y]); return _dt(id,x,y); };
    drawMapTiles = function(map,ox,oy,range){
      mapTileCalls.push({ mapId: mapIdForRef(map), ox: ox||0, oy: oy||0, range: range||null });
      ev.push('mapTiles');
      return _dmt(map,ox,oy,range);
    };
    drawPlayer = function(){ playerDrawn = true; ev.push('player'); return _dp(); };
    var before = { x: player.x, y: player.y, map: mapIdForRef(activeMap), cd: combat.cooldown,
                   inTown: inTown, inDungeon: inDungeon };
    try { render(); } finally {
      ctx.save=_s; ctx.restore=_r; ctx.translate=_t; ctx.fillRect=_fr;
      drawTile=_dt; drawMapTiles=_dmt; drawPlayer=_dp;
    }
    var after = { x: player.x, y: player.y, map: mapIdForRef(activeMap), cd: combat.cooldown,
                  inTown: inTown, inDungeon: inDungeon };
    return JSON.stringify({
      saves: saves, restores: restores, translates: translates, tileCoords: tileCoords,
      mapTileCalls: mapTileCalls, voidFilled: voidFilled, playerDrawn: playerDrawn, events: ev,
      mutated: JSON.stringify(before) !== JSON.stringify(after), before: before, after: after,
    });
  })()`));
}

module.exports = {
  name: 'continuous regional view: production default; legacy behaviour only via the debug fallback',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));
    const warp = (id) => g.run(`debugWarpToDestination(${JSON.stringify(id)})`);
    const COLS = g.run('COLS'), ROWS = g.run('ROWS'), TILE = g.run('TILE');
    const CW = COLS * TILE, CH = ROWS * TILE;

    // ── 1. Debug fallback defaults OFF (continuous is default); never serialized ─
    assert.equal(g.run('forceLegacyRegionalView'), false, 'legacy fallback defaults OFF -> continuous is the production default');
    assert.equal(g.run("typeof continuousWorldViewEnabled"), 'undefined', 'the old opt-in flag is gone');
    assert.equal(g.run('DEBUG_MENU_ROW_COUNT'), 10, 'debug menu still has its rows');
    g.run('forceLegacyRegionalView = true; saveGame();');
    const rawSave = g.run("localStorage.getItem('verdantVale_save')");
    assert.ok(!/continuousWorldView|forceLegacyRegionalView|legacyRegional/i.test(rawSave), 'the fallback is not written into the save payload');
    // loadGame must not set/restore it either (it is session-only).
    g.run('loadGame();');
    assert.equal(g.run('forceLegacyRegionalView'), true, 'load does not touch the session-only fallback (still whatever the session set)');
    g.run('forceLegacyRegionalView = false;');

    // ── 2. Legacy single-screen render path when the DEBUG fallback is ON ─────
    warp('outdoor:MAP'); g.run('forceLegacyRegionalView = true;');
    const legacy = spyRender(g);
    assert.equal(legacy.translates.length, 0, 'legacy: no camera transform');
    assert.equal(legacy.voidFilled, false, 'legacy: no void fill');
    assert.equal(legacy.mapTileCalls.length, 1, 'legacy: exactly one drawMapTiles(activeMap)');
    assert.deepEqual({ id: legacy.mapTileCalls[0].mapId, ox: legacy.mapTileCalls[0].ox, oy: legacy.mapTileCalls[0].oy, range: legacy.mapTileCalls[0].range },
      { id: 'MAP', ox: 0, oy: 0, range: null }, 'legacy: full active map at origin (0,0), no range');
    assert.equal(legacy.tileCoords.length, ROWS * COLS, 'legacy: full ROWS*COLS terrain, local coords');
    assert.ok(legacy.tileCoords.every(([x, y]) => x < CW && y < CH), 'legacy: tiles in single-map local pixel space');
    assert.equal(legacy.playerDrawn, true, 'legacy: player drawn');
    assert.equal(legacy.mutated, false, 'legacy: no mutation');

    // ── 3. Non-region maps always legacy (even with the flag ON) ─────────────
    warp('town:calwick_south'); g.run('forceLegacyRegionalView = false;');
    assert.equal(g.run('continuousWorldViewActive()'), false, 'town is not region-placed -> legacy');
    const town = spyRender(g);
    assert.equal(town.translates.length, 0, 'town: no camera transform');
    assert.equal(town.voidFilled, false, 'town: no void fill');

    // ── 4. Hidden meadow remains legacy (outdoor but not region-placed) ──────
    g.run('enterMeadow();');
    assert.equal(g.run('mapIdForRef(activeMap)'), 'MEADOW_MAP');
    assert.equal(g.run('continuousWorldViewActive()'), false, 'meadow is not placed -> legacy');

    // ── 5. Pure plan: correct player WORLD PIXELS from several placements ────
    // MAP (0,5), MAP2 (1,5), NORTH_BASIN_NW_MAP (1,0). Player local (100,60).
    const cases = [['MAP', 0, 5], ['MAP2', 1, 5], ['NORTH_BASIN_NW_MAP', 1, 0]];
    for (const [id, cx, cy] of cases) {
      const plan = J(`(function(){ activeMap = mapRefForId(${JSON.stringify(id)}); player.x = 100; player.y = 60;
        return JSON.stringify((function(){var _w=mapLocalPxToRegionWorldPx(${JSON.stringify(id)},player.x,player.y);return _w?buildContinuousWorldPlanFromWorld('overworld',_w.worldPxX,_w.worldPxY,512,480):null;})()); })()`);
      assert.equal(plan.playerWorldPxX, cx * CW + 100, `${id}: player world px X`);
      assert.equal(plan.playerWorldPxY, cy * CH + 60, `${id}: player world px Y`);
      assert.ok(Number.isInteger(plan.camPxX) && Number.isInteger(plan.camPxY), `${id}: integer camera`);
    }

    // ── 6. Camera follows the player away from region edges ──────────────────
    // MAP3 (2,5) is interior on the X axis; a mid-map player is far from left/right/bottom.
    const follow = J(`JSON.stringify((function(){var _w=mapLocalPxToRegionWorldPx('MAP3',8*${TILE},7*${TILE});return _w?buildContinuousWorldPlanFromWorld('overworld',_w.worldPxX,_w.worldPxY,512,480):null;})())`);
    assert.equal(follow.camPxX, follow.playerWorldPxX - 256, 'camera X centres on the player mid-region');
    // (Y is at the region's bottom row so it clamps; X centring proves following.)

    // ── 7. Camera clamps at all four region bounds ──────────────────────────
    const bounds = J("JSON.stringify(regionPixelBounds('overworld'))");
    // MAP (0,5) local (0, bottom): true left + bottom corner -> clamps both.
    const bl = J(`JSON.stringify((function(){var _w=mapLocalPxToRegionWorldPx('MAP',0,${(ROWS - 1) * TILE});return _w?buildContinuousWorldPlanFromWorld('overworld',_w.worldPxX,_w.worldPxY,512,480):null;})())`);
    assert.equal(bl.camPxX, bounds.leftPx, 'clamp left edge');
    assert.equal(bl.camPxY, bounds.bottomPx - 480, 'clamp bottom edge');
    // MAP5 (4,5) far-right column -> right clamp; NB_NW (1,0) top row -> top clamp.
    const tr = J(`JSON.stringify((function(){var _w=mapLocalPxToRegionWorldPx('MAP5',${(COLS - 1) * TILE},0);return _w?buildContinuousWorldPlanFromWorld('overworld',_w.worldPxX,_w.worldPxY,512,480):null;})())`);
    assert.equal(tr.camPxX, bounds.rightPx - 512, 'clamp right edge');
    const top = J(`JSON.stringify((function(){var _w=mapLocalPxToRegionWorldPx('NORTH_BASIN_NW_MAP',0,0);return _w?buildContinuousWorldPlanFromWorld('overworld',_w.worldPxX,_w.worldPxY,512,480):null;})())`);
    assert.equal(top.camPxY, bounds.topPx, 'clamp top edge');

    // ── 8. Viewport resolves one, two, and four visible chunks ──────────────
    const one = J(`JSON.stringify(visibleChunks('overworld', 0, ${5 * CH}, 512, 480).map(c=>c.mapId))`);
    assert.deepEqual(one, ['MAP'], 'one-chunk viewport');
    const two = J(`JSON.stringify(visibleChunks('overworld', ${CW / 2}, ${5 * CH}, 512, 480).map(c=>c.mapId))`);
    assert.equal(two.length, 2, 'two-chunk viewport (horizontal)');
    const four = J(`JSON.stringify(visibleChunks('overworld', ${CW / 2}, ${5 * CH - 224}, 512, 480).map(c=>c.mapId))`);
    assert.equal(four.length, 4, 'four-chunk viewport (corner)');

    // ── 9. Sparse missing chunks stay void (omitted) ────────────────────────
    // chunk (0,0) is an unplaced gap; a viewport there yields no chunks.
    assert.deepEqual(J("JSON.stringify(visibleChunks('overworld', 0, 0, 512, 480))"), [], 'gap chunk -> no terrain');

    // ── 10-14. Continuous frame on a placed overworld map ───────────────────
    warp('outdoor:MAP2'); g.run('forceLegacyRegionalView = false; player.x = 8*TILE; player.y = 7*TILE; __reconcileCanonicalForTest();');
    const plan = J("JSON.stringify((function(){var _w=mapLocalPxToRegionWorldPx('MAP2',player.x,player.y);return _w?buildContinuousWorldPlanFromWorld('overworld',_w.worldPxX,_w.worldPxY,512,480):null;})())");
    const cont = spyRender(g);
    assert.equal(cont.mutated, false, 'continuous: no mutation of player/activeMap/location');
    assert.equal(cont.voidFilled, true, 'continuous: void filled');
    // 10. terrain uses canonical map refs, stable world origins, exact ranges
    assert.equal(cont.mapTileCalls.length, plan.visibleChunks.length, 'one drawMapTiles per visible chunk');
    const planById = {};
    for (const c of plan.visibleChunks) planById[c.mapId] = c;
    for (const call of cont.mapTileCalls) {
      const pc = planById[call.mapId];
      assert.ok(pc, `terrain chunk ${call.mapId} is a planned visible chunk`);
      assert.equal(call.ox, pc.worldPxX, `${call.mapId}: stable world-pixel origin X`);
      assert.equal(call.oy, pc.worldPxY, `${call.mapId}: stable world-pixel origin Y`);
      assert.deepEqual(call.range, { startCol: pc.startCol, endCol: pc.endCol, startRow: pc.startRow, endRow: pc.endRow },
        `${call.mapId}: exact half-open visible tile range`);
    }
    // 11. current terrain not drawn twice: each visible chunk id appears once
    const ids = cont.mapTileCalls.map(c => c.mapId);
    assert.equal(new Set(ids).size, ids.length, 'no chunk terrain drawn twice');
    // 13. camera applied via transform, not subtracted from tile coords
    assert.deepEqual(cont.translates[0], [-plan.camPxX, -plan.camPxY], 'first transform is the camera translate');
    assert.ok(cont.tileCoords.some(([x]) => x >= CW), 'tile coords are WORLD pixels (a neighbour chunk >= one chunk width), not camera-relative');
    // 14. active-map content/player gets the active chunk transform. The active
    //     content pass is drawn LAST (after any neighbour-content passes), so the
    //     active chunk world origin is the final translate.
    assert.deepEqual(cont.translates[cont.translates.length - 1], [plan.activePlacement.chunkX * CW, plan.activePlacement.chunkY * CH],
      'the last transform is the active chunk world origin (active content + player drawn last)');
    assert.equal(cont.playerDrawn, true, 'player drawn in continuous mode');

    // ── 12. Procedural tile coords identical for the same world tile under two
    //        different camera positions ─────────────────────────────────────
    const coordsAt = (px) => {
      g.run(`player.x = ${px}; player.y = 7*TILE; __reconcileCanonicalForTest();`);
      return spyRender(g).tileCoords.map(c => c.join(','));
    };
    const camA = coordsAt(6 * TILE), camB = coordsAt(9 * TILE);
    // A world tile visible in both (MAP2 chunk (1,5): local (8,7) -> world (CW+8*TILE, 5*CH+7*TILE)).
    const worldTile = [CW + 8 * TILE, 5 * CH + 7 * TILE].join(',');
    assert.ok(camA.includes(worldTile) && camB.includes(worldTile),
      'the same world tile is drawn at identical world coords under two camera positions (no phase crawl)');

    // ── 15 + 16. Screen-space UI after the camera is restored; balanced ──────
    // (MAP is now a legacy_screen home — use MAP2 for the continuous-render frame.)
    warp('outdoor:MAP2'); g.run('forceLegacyRegionalView = false; player.x = 8*TILE; player.y = 7*TILE; __reconcileCanonicalForTest();');
    const frame = spyRender(g);
    assert.equal(frame.saves, frame.restores, 'save/restore balanced');
    assert.ok(frame.saves >= 2, 'at least the camera + active-chunk save/restore pair (plus one per neighbour content pass)');
    const lastRestore = frame.events.lastIndexOf('restore');
    const vignetteFill = frame.events.indexOf('vignette');
    assert.ok(lastRestore >= 0 && vignetteFill > lastRestore,
      'the vignette (screen-space) is drawn AFTER the camera transform is restored');

    // ── 17. No mutation of regional data by rendering ───────────────────────
    const layoutBefore = g.run("JSON.stringify(REGIONAL_LAYOUT.overworld.placements)");
    spyRender(g);
    assert.equal(g.run("JSON.stringify(REGIONAL_LAYOUT.overworld.placements)"), layoutBefore, 'REGIONAL_LAYOUT unchanged');

    // ── 18. Combat bypasses the continuous world path entirely ──────────────
    g.run(`
      forceLegacyRegionalView = false;
      startCombat();
      combat.enemy = { id:'d', name:'Dummy', hp:10, maxHp:10, atk:1, def:0, spd:1, xp:0, goldMin:0, goldMax:0 };
    `);
    const cbt = spyRender(g);
    assert.equal(cbt.translates.length, 0, 'combat: no camera transform');
    assert.equal(cbt.voidFilled, false, 'combat: no continuous void fill');
    assert.equal(cbt.mapTileCalls.length, 0, 'combat: no world terrain drawn');
    g.run('combat.active = false; combat.enemy = null;');

    // ── 19. Debug-menu fallback toggle behaviour + cursor bounds ────────────
    g.run('forceLegacyRegionalView = false; debugMenu.open = true; debugMenu.cursor = 0; dialogue.open=false; menu.open=false; choice.open=false; shop.open=false;');
    for (let i = 0; i < 20; i++) g.press('ArrowDown'); // over-scroll
    assert.equal(g.run('debugMenu.cursor'), 9, 'cursor clamps at the last row ([ Legacy Regional Fallback ])');
    g.press('Enter');
    assert.equal(g.run('forceLegacyRegionalView'), true, 'Enter on row 9 turns the legacy fallback ON');
    g.press('Enter');
    assert.equal(g.run('forceLegacyRegionalView'), false, 'Enter again turns it OFF (back to continuous default)');
    g.run('debugMenu.open = false; forceLegacyRegionalView = false;');
  },
};
