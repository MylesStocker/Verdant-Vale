'use strict';
// Roddon Way legacy-home camera jump: the continuous camera used a stateless
// least-correction rule to keep Verdant Vale (MAP, legacy_screen) off-screen. At
// MAP's NE diagonal corner two axes are valid (keep east / keep north) and the rule
// switched axes across the diagonal line worldX+worldY = MAP.rightPx + (MAP.topPx-VH),
// jumping the camera. The fix authors a declarative legacyCameraExclusion side policy
// per chunk (MAP2/RODDON east, MAP_N1 north), resolved from REGIONAL_CHUNK_CATALOG,
// and the pure camera applies that single-axis clamp — never comparing magnitudes.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

module.exports = {
  name: 'Roddon Way legacy-home camera: declarative stable-side exclusion (no axis-flip jump)',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const R = (c) => g.run(c);
    const J = (c) => JSON.parse(R(c));
    const SPEED = R('SPEED'), VW = R('COLS*TILE'), VH = R('ROWS*TILE');
    // MAP (Verdant Vale) legacy rect from its placement (chunk 0,5).
    const MAPR = J("(function(){var p=regionPlacementForMapId('MAP');return JSON.stringify({leftPx:p.chunkX*(COLS*TILE),topPx:p.chunkY*(ROWS*TILE),rightPx:(p.chunkX+1)*(COLS*TILE),bottomPx:(p.chunkY+1)*(ROWS*TILE)});})()");

    // Camera origin from a chunk-LOCAL pixel position, via the canonical world plan.
    const cam = (mid, lx, ly) => J(`(function(){var w=mapLocalPxToRegionWorldPx('${mid}',${lx},${ly});var p=buildContinuousWorldPlanFromWorld('overworld',w.worldPxX,w.worldPxY,${VW},${VH});return JSON.stringify({cx:p.camPxX,cy:p.camPxY,chunks:p.visibleChunks.map(function(c){return c.mapId;})});})()`);
    const baseCam = (wx, wy) => J(`JSON.stringify(cameraOriginForTarget('overworld',${wx},${wy},${VW},${VH}))`);
    // Faithful reimplementation of the OLD least-correction rule (pre-fix), for before/after.
    const oldCam = (wx, wy) => {
      const b = baseCam(wx, wy); let camX = b.camPxX, camY = b.camPxY; const E = MAPR;
      const oX = camX < E.rightPx && camX + VW > E.leftPx, oY = camY < E.bottomPx && camY + VH > E.topPx;
      if (oX && oY) {
        const opts = [];
        if (wx >= E.rightPx) opts.push({ ax: 'x', v: E.rightPx, cost: E.rightPx - camX });
        if (wx <= E.leftPx) opts.push({ ax: 'x', v: E.leftPx - VW, cost: camX - (E.leftPx - VW) });
        if (wy >= E.bottomPx) opts.push({ ax: 'y', v: E.bottomPx, cost: E.bottomPx - camY });
        if (wy <= E.topPx) opts.push({ ax: 'y', v: E.topPx - VH, cost: camY - (E.topPx - VH) });
        if (opts.length) { opts.sort((a, b2) => a.cost - b2.cost); const pk = opts[0]; if (pk.ax === 'x') camX = pk.v; else camY = pk.v; }
      }
      return { cx: Math.round(camX), cy: Math.round(camY) };
    };
    const world = (mid, lx, ly) => J(`JSON.stringify(mapLocalPxToRegionWorldPx('${mid}',${lx},${ly}))`);
    const camW = (wx, wy) => J(`(function(){var p=buildContinuousWorldPlanFromWorld('overworld',${wx},${wy},${VW},${VH});return JSON.stringify({cx:p.camPxX,cy:p.camPxY,mid:p.activeMapId});})()`);

    // ── 1. Deterministic BEFORE/AFTER of the two reported Roddon jump lines ────
    // The flip line is worldX+worldY = MAP.rightPx + (MAP.topPx - VH). Each pair is one
    // 2px (SPEED) player step straddling it, inside RODDON's chunk. OLD least-correction
    // jumps (both axes) in a single step; the fix keeps each delta <= SPEED.
    const flip = MAPR.rightPx + (MAPR.topPx - VH); // = 512 + (2400-480) = 2432 (in region-world px sum terms below)
    const boundaries = [
      { label: 'vertical col6 rows8->9', a: [720, 2206], b: [720, 2208] },     // worldX=720 -> flip at worldY=2208
      { label: 'horizontal row10 cols5->6', a: [686, 2240], b: [688, 2240] },  // worldY=2240 -> flip at worldX=688
    ];
    for (const bd of boundaries) {
      assert.equal(camW(bd.a[0], bd.a[1]).mid, 'RODDON_WAY_MAP', `${bd.label}: sample sits in RODDON`);
      const oa = oldCam(bd.a[0], bd.a[1]), ob = oldCam(bd.b[0], bd.b[1]);
      const oldJump = Math.max(Math.abs(ob.cx - oa.cx), Math.abs(ob.cy - oa.cy));
      assert.ok(oldJump > SPEED, `${bd.label}: OLD least-correction jumps ${oldJump}px in one 2px step (reproduces the bug); old cam ${JSON.stringify(oa)}->${JSON.stringify(ob)}`);
      const na = camW(bd.a[0], bd.a[1]), nb = camW(bd.b[0], bd.b[1]);
      assert.ok(Math.abs(nb.cx - na.cx) <= SPEED && Math.abs(nb.cy - na.cy) <= SPEED, `${bd.label}: FIXED camera step <= SPEED (dX=${Math.abs(nb.cx - na.cx)}, dY=${Math.abs(nb.cy - na.cy)})`);
    }
    void flip;

    // ── 2-5. Fine sweeps: player step <= SPEED implies camX and camY deltas <= SPEED,
    //         and the viewport never intersects MAP. ─────────────────────────────
    const sweep = (label, x0, y0, dx, dy, steps) => {
      let prev = null;
      for (let i = 0; i <= steps; i++) {
        const c = cam('RODDON_WAY_MAP', x0 + dx * i, y0 + dy * i);
        // (7) viewport clears MAP's rect
        const hitsMAP = c.cx < MAPR.rightPx && c.cx + VW > MAPR.leftPx && c.cy < MAPR.bottomPx && c.cy + VH > MAPR.topPx;
        assert.equal(hitsMAP, false, `${label} step ${i}: viewport does not intersect MAP's rect`);
        // (8) no sparse void: every visible chunk is a placed map, and MAP is never shown
        assert.ok(!c.chunks.includes('MAP'), `${label} step ${i}: MAP never appears`);
        assert.ok(c.chunks.every((m) => R(`!!mapIdForRef(mapRefForId('${m}'))`)), `${label} step ${i}: all visible chunks are placed (no void)`);
        if (prev) assert.ok(Math.abs(c.cx - prev.cx) <= SPEED && Math.abs(c.cy - prev.cy) <= SPEED, `${label} step ${i}: |dcam| <= SPEED for a <=SPEED player step`);
        prev = c;
      }
    };
    sweep('H cols5<->6 row10 (2px)', 5 * 32, 10 * 32 + 16, SPEED, 0, 16);        // 2
    sweep('V rows8<->9 col6 (2px)', 6 * 32 + 16, 8 * 32, 0, SPEED, 16);          // 3
    sweep('diag SW (crosses old flip line)', 8 * 32, 6 * 32, -SPEED, SPEED, 40); // 4
    sweep('H lower band', 2 * 32, 12 * 32, SPEED, 0, 40);                        // 4
    sweep('V west col', 3 * 32, 4 * 32, 0, SPEED, 60);                           // 4

    // ── 6. Roddon ALWAYS uses the east constraint; never switches to north. ────
    // The east clamp only touches X, so plan camY must always equal the unconstrained
    // region-clamped player-centred camY (a north exclusion would instead pin camY).
    assert.deepEqual(J("JSON.stringify(legacyCameraExclusionForMapId('RODDON_WAY_MAP'))"), { mapId: 'MAP', side: 'east' }, 'RODDON policy is exclude MAP, side east');
    for (let ry = 0; ry <= 14; ry += 2) for (let rx = 1; rx <= 10; rx += 3) {
      const w = world('RODDON_WAY_MAP', rx * 32 + 16, ry * 32 + 16);
      const c = cam('RODDON_WAY_MAP', rx * 32 + 16, ry * 32 + 16);
      const base = baseCam(w.worldPxX, w.worldPxY);
      assert.equal(c.cy, base.camPxY, `RODDON (${rx},${ry}): camY is the unconstrained value (Y never adjusted -> no north exclusion)`);
      assert.ok(c.cx >= MAPR.rightPx || c.cx === base.camPxX, `RODDON (${rx},${ry}): camX only ever clamped east to MAP.right`);
    }

    // ── 9 + 10. MAP2 shares the east policy; MAP2<->RODDON handoff stays continuous ─
    assert.deepEqual(J("JSON.stringify(legacyCameraExclusionForMapId('MAP2'))"), { mapId: 'MAP', side: 'east' }, 'MAP2 policy is exclude MAP, side east');
    // Sweep worldY across the RODDON(row14)->MAP2(row0) seam at a fixed worldX (col ~6),
    // through the shared region-world column, in 2px steps.
    {
      const wx = R("mapLocalPxToRegionWorldPx('RODDON_WAY_MAP',6*32+16,7*32).worldPxX");
      const yTop = R("mapLocalPxToRegionWorldPx('RODDON_WAY_MAP',6*32+16,12*32).worldPxY");
      let prev = null, flipped = false;
      for (let wy = yTop; wy <= yTop + 6 * 32; wy += SPEED) {
        const p = J(`(function(){var pl=buildContinuousWorldPlanFromWorld('overworld',${wx},${wy},${VW},${VH});return JSON.stringify({cx:pl.camPxX,cy:pl.camPxY,mid:pl.activeMapId});})()`);
        if (prev) { if (Math.abs(p.cx - prev.cx) > SPEED || Math.abs(p.cy - prev.cy) > SPEED) flipped = true; }
        // both sides of the handoff use east: camX never dips west of MAP.right when it would reveal MAP
        assert.ok(p.cx >= MAPR.rightPx || !(p.cy < MAPR.bottomPx && p.cy + VH > MAPR.topPx), 'handoff: viewport stays east of MAP whenever its Y-band overlaps');
        prev = p;
      }
      assert.equal(flipped, false, 'MAP2<->RODDON handoff: no camera jump / policy flip (all steps <= SPEED)');
    }

    // ── 11. MAP_N1 retains its NORTH-side behaviour (Y clamp, X free). ─────────
    assert.deepEqual(J("JSON.stringify(legacyCameraExclusionForMapId('MAP_N1'))"), { mapId: 'MAP', side: 'north' }, 'MAP_N1 policy is exclude MAP, side north');
    for (let ry = 6; ry <= 14; ry += 2) {
      const w = world('MAP_N1', 7 * 32 + 16, ry * 32 + 16);
      const c = J(`(function(){var pl=buildContinuousWorldPlanFromWorld('overworld',${w.worldPxX},${w.worldPxY},${VW},${VH});return JSON.stringify({cx:pl.camPxX,cy:pl.camPxY});})()`);
      const base = baseCam(w.worldPxX, w.worldPxY);
      assert.equal(c.cx, base.camPxX, `MAP_N1 (7,${ry}): camX unconstrained (north policy touches only Y)`);
      assert.ok(c.cy <= MAPR.topPx - VH || c.cy === base.camPxY, `MAP_N1 (7,${ry}): camY only ever clamped north of MAP.top`);
      assert.ok(!(c.cy < MAPR.bottomPx && c.cy + VH > MAPR.topPx && c.cx < MAPR.rightPx && c.cx + VW > MAPR.leftPx), `MAP_N1 (7,${ry}): viewport clears MAP`);
    }

    // ── 12. MAP stays fixed-screen (never uses the continuous render path). ────
    assert.equal(R("isLegacyScreenMap('MAP')"), true, 'MAP is legacy_screen');
    R("debugWarpToDestination('outdoor:MAP'); continuousWorldViewEnabled=true;");
    assert.equal(R("mapIdForRef(activeMap)"), 'MAP', 'warped onto MAP');
    assert.equal(R("continuousWorldViewActive()"), false, 'MAP suppresses continuous view even with the toggle on (fixed-screen home)');

    // ── 13. Other continuous maps (no policy) keep their base camera origins. ──
    for (const mid of ['MAP3', 'MAP4', 'MAP3_N1', 'NORTH_BASIN_SW_MAP']) {
      assert.equal(R(`legacyCameraExclusionForMapId('${mid}')`), null, `${mid} has no camera policy`);
      for (const [lx, ly] of [[8 * 32, 7 * 32], [1 * 32, 1 * 32], [14 * 32, 13 * 32]]) {
        const w = world(mid, lx, ly);
        const c = J(`(function(){var pl=buildContinuousWorldPlanFromWorld('overworld',${w.worldPxX},${w.worldPxY},${VW},${VH});return pl?JSON.stringify({cx:pl.camPxX,cy:pl.camPxY}):'null';})()`);
        const base = baseCam(w.worldPxX, w.worldPxY);
        assert.deepEqual(c, { cx: base.camPxX, cy: base.camPxY }, `${mid} @(${lx / 32},${ly / 32}): camera equals the unconstrained base (prior origin retained)`);
      }
    }

    // ── 14. Continuous View OFF leaves RODDON on the legacy render path. ───────
    R("debugWarpToDestination('outdoor:RODDON_WAY_MAP');");
    assert.equal(R("(function(){continuousWorldViewEnabled=true; return continuousWorldViewActive();})()"), true, 'RODDON: continuous active with toggle ON');
    assert.equal(R("(function(){continuousWorldViewEnabled=false; var r=continuousWorldViewActive(); continuousWorldViewEnabled=true; return r;})()"), false, 'RODDON: toggle OFF -> legacy renderer (unchanged)');

    // ── 15. Towns / interiors / dungeons / bridge / meadow are discrete (no
    //        regional placement -> legacy/discrete path), outside the chunk system.
    for (const d of ['TOWN_MAP', 'HOUSE_INTERIOR_MAP', 'DUNGEON_MAP', 'BRIDGE_CROSSING_MAP', 'MEADOW_MAP']) {
      assert.equal(R(`regionPlacementForMapId('${d}')`), null, `${d} has no regional placement (legacy/discrete render path)`);
      assert.equal(R(`typeof REGIONAL_CHUNK_CATALOG['${d}']`), 'undefined', `${d} is not a regional chunk`);
    }

    // ── 16. Camera planning + validation mutate nothing. ──────────────────────
    R("debugWarpToDestination('outdoor:RODDON_WAY_MAP'); continuousWorldViewEnabled=true; debugMode=true; placeAtLocation('RODDON_WAY_MAP', 6*32+16, 9*32); player.facing='left';");
    const before = R("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing+'|'+inTown+'|'+inDungeon+'|'+continuousWorldViewEnabled+'|'+debugMode+'|'+JSON.stringify(regionalWorldPosition())");
    R(`(function(){for(var i=0;i<20;i++){var w=mapLocalPxToRegionWorldPx('RODDON_WAY_MAP',5*32+i,9*32);buildContinuousWorldPlanFromWorld('overworld',w.worldPxX,w.worldPxY,${VW},${VH});} resolveLegacyCameraExclusion('overworld','RODDON_WAY_MAP'); validateGameData(); })()`);
    const after = R("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+player.facing+'|'+inTown+'|'+inDungeon+'|'+continuousWorldViewEnabled+'|'+debugMode+'|'+JSON.stringify(regionalWorldPosition())");
    assert.equal(after, before, 'camera planning + validation mutate no canonical position / projection / flags / debug state');

    // ── 17. All 15 grid fingerprints unchanged. ───────────────────────────────
    for (const id of Object.keys(GRID_FP.fingerprints)) {
      assert.equal(sha256(R(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), GRID_FP.fingerprints[id], `${id}: grid fingerprint unchanged`);
    }

    // ── 18. Save stays v4; no camera state persisted. ─────────────────────────
    R("placeAtLocation('RODDON_WAY_MAP', 6*32, 9*32); continuousWorldViewEnabled=true; saveGame();");
    const saved = J("localStorage.getItem('verdantVale_save')");
    assert.equal(saved.version, 4, 'SAVE_VERSION stays 4');
    assert.ok(!/cam|camera|viewport|exclusion|continuousWorldView/i.test(JSON.stringify(saved)), 'no camera/exclusion/toggle state enters the save');

    // ── 19. Malformed / missing / unknown / contradictory policies fail. ──────
    const errsFor = (mutate) => J(`(function(){
      var target='RODDON_WAY_MAP'; var saved=REGIONAL_CHUNK_CATALOG[target].legacyCameraExclusion;
      (${mutate})(REGIONAL_CHUNK_CATALOG, target);
      var v=validateGameData();
      REGIONAL_CHUNK_CATALOG[target].legacyCameraExclusion=saved;
      return JSON.stringify((v.errorList||[]).filter(function(e){return e.group==='Regional chunks';}).map(function(e){return e.message;}));
    })()`);
    const failsWith = (mutate, re, label) => assert.ok(errsFor(mutate).some((m) => re.test(m)), `${label} -> a Regional chunks error matching ${re}`);
    failsWith("function(C,t){ C[t].legacyCameraExclusion={mapId:'MAP',side:'diagonal'}; }", /must be one of north\|south\|east\|west/, 'unknown side');
    failsWith("function(C,t){ C[t].legacyCameraExclusion={mapId:'MAP',side:'east',bogus:1}; }", /unrecognized key "bogus"/, 'unknown key');
    failsWith("function(C,t){ C[t].legacyCameraExclusion={mapId:'MAP2',side:'east'}; }", /not legacy_screen/, 'excluded map not legacy_screen');
    failsWith("function(C,t){ C[t].legacyCameraExclusion={mapId:'NOPE',side:'east'}; }", /not a regional chunk/, 'excluded map missing');
    // RODDON is NE of MAP, so 'west'/'south' are geometrically contradictory (it is not
    // west or south of MAP). ('north' would actually be valid — RODDON is also N of MAP.)
    failsWith("function(C,t){ C[t].legacyCameraExclusion={mapId:'MAP',side:'west'}; }", /not on the "west" side/, 'geometrically contradictory side (west)');
    failsWith("function(C,t){ delete C[t].legacyCameraExclusion; }", /RODDON_WAY_MAP: continuous chunk can reveal legacy map MAP/, 'missing policy on a chunk that can reveal MAP');
    // Removing ANY of the three required policies must fail validation (completeness).
    for (const req of ['MAP2', 'RODDON_WAY_MAP', 'MAP_N1']) {
      const errs = J(`(function(){
        var saved=REGIONAL_CHUNK_CATALOG['${req}'].legacyCameraExclusion;
        delete REGIONAL_CHUNK_CATALOG['${req}'].legacyCameraExclusion;
        var v=validateGameData();
        REGIONAL_CHUNK_CATALOG['${req}'].legacyCameraExclusion=saved;
        return JSON.stringify((v.errorList||[]).filter(function(e){return e.group==='Regional chunks';}).map(function(e){return e.message;}));
      })()`);
      assert.ok(errs.some((m) => new RegExp('^' + req + ': continuous chunk can reveal legacy map MAP').test(m)), `${req}: removing its required exclusion policy fails validation (completeness)`);
    }
  },
};
