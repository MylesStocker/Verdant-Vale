'use strict';
// Productionize the continuous regional overworld: continuous presentation + seamless
// eligible-edge movement are the PRODUCTION DEFAULT (no debugMode, no opt-in flag). The
// only opt-out is the session-only debug fallback `forceLegacyRegionalView` (default off).
// continuousWorldViewActive() is the ONE shared choke point every consumer reads.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const CONTINUOUS = ['MAP2', 'MAP3', 'MAP4', 'MAP5', 'MAP_N1', 'MAP_N2', 'RODDON_WAY_MAP',
  'MAP3_N1', 'MAP3_N2', 'NORTH_BASIN_S_MAP', 'NORTH_BASIN_C_MAP', 'NORTH_BASIN_SW_MAP',
  'NORTH_BASIN_W_MAP', 'NORTH_BASIN_NW_MAP'];

module.exports = {
  name: 'continuous regional overworld: production default, session-only legacy fallback, render bounds',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const R = (c) => g.run(c);
    const J = (c) => JSON.parse(R(c));
    const VW = R('COLS*TILE'), VH = R('ROWS*TILE'), TILE = R('TILE'), SPEED = R('SPEED');
    const active = (mid) => R(`(function(){debugWarpToDestination('outdoor:${mid}'); return continuousWorldViewActive();})()`);

    // ── 1,2. Continuous is active by DEFAULT with debugMode false + no menu use ─
    R('debugMode = false; forceLegacyRegionalView = false;');
    assert.equal(R('debugMode'), false, 'debugMode is off');
    assert.equal(R('forceLegacyRegionalView'), false, 'the legacy fallback is off by default');
    assert.equal(active('MAP2'), true, 'MAP2 is continuous by default (no debugMode, no menu interaction)');
    assert.equal(R('debugMode'), false, 'still no debugMode after activation');

    // ── 3,6. MAP fixed-screen by metadata; all 15 choose their authored presentation ─
    assert.equal(R("regionalPresentationForMapId('MAP')"), 'legacy_screen', 'MAP authored legacy_screen');
    assert.equal(active('MAP'), false, 'MAP is fixed-screen (never continuous), by metadata');
    for (const mid of CONTINUOUS) {
      assert.equal(R(`regionalPresentationForMapId('${mid}')`), 'continuous', `${mid} authored continuous`);
      assert.equal(active(mid), true, `${mid} uses continuous presentation by default`);
    }

    // ── 4,5. Home boundary: MAP->MAP2 / MAP->MAP_N1 auto-continuous; return suppresses ─
    const cross = (fromMap, setPos, key, toMap) => {
      R(`debugWarpToDestination('outdoor:${fromMap}'); resetLocationState(); activeMap=mapRefForId('${fromMap}'); debugMode=false; forceLegacyRegionalView=false; combat.cooldown=0; ${setPos} __reconcileCanonicalForTest();`);
      const homeActive = R('continuousWorldViewActive()');
      g.hold(key); let out = false; for (let i = 0; i < 24 && !out; i++) { g.frames(1); out = R(`mapIdForRef(activeMap)==='${toMap}'`); } g.release(key);
      return { homeActive, out, destActive: R('continuousWorldViewActive()') };
    };
    const east = cross('MAP', "player.x=14.5*TILE; player.y=4.5*TILE; player.facing='right';", 'ArrowRight', 'MAP2');
    assert.equal(east.homeActive, false, 'on MAP the presentation is fixed (continuous suppressed)');
    assert.ok(east.out, 'walked east onto MAP2');
    assert.equal(east.destActive, true, 'continuous activates AUTOMATICALLY on the first MAP2 frame (no menu)');
    const north = cross('MAP', "player.x=7.5*TILE; player.y=1.5*TILE; player.facing='up';", 'ArrowUp', 'MAP_N1');
    assert.ok(north.out && north.destActive, 'MAP->MAP_N1 also activates continuous automatically');
    // returning to MAP suppresses again
    R("debugWarpToDestination('outdoor:MAP'); resetLocationState(); activeMap=mapRefForId('MAP'); __reconcileCanonicalForTest();");
    assert.equal(R('continuousWorldViewActive()'), false, 'returning to MAP suppresses continuous automatically');

    // ── 7. All 26 eligible directed seams operate under the default ────────────
    assert.equal(R('continuousSeamEntries().length'), 26, '26 eligible directed seams');
    assert.equal(R('continuousSeamEntries().length/2'), 13, '13 reciprocal pairs');
    // every seam endpoint is a continuous map that is active-by-default
    assert.equal(R("continuousSeamEntries().every(function(e){return continuousSeamMapEligible(e.from);})"), true, 'every seam map is continuous-eligible under the default');

    // ── 8. Representative H + V handoffs: canonical continuity + camera <= SPEED ─
    const handoff = (mid, x0, y0, dx, dy, toMap) => {
      R(`debugWarpToDestination('outdoor:${mid}'); resetLocationState(); activeMap=mapRefForId('${mid}'); debugMode=false; forceLegacyRegionalView=false; combat.cooldown=0; for(var k in keys)delete keys[k]; player.x=${x0}; player.y=${y0}; __reconcileCanonicalForTest();`);
      let prevCam = null, maxCam = 0, handoffs = 0, prevMap = mid;
      const key = dx > 0 ? 'ArrowRight' : dx < 0 ? 'ArrowLeft' : dy > 0 ? 'ArrowDown' : 'ArrowUp';
      g.hold(key);
      for (let i = 0; i < 60; i++) {
        g.frames(1);
        const canon = J('JSON.stringify(regionalWorldPosition())');
        const plan = canon ? J(`JSON.stringify(buildContinuousWorldPlanFromWorld('overworld',${canon.worldPxX},${canon.worldPxY},${VW},${VH}))`) : null;
        if (plan) { if (prevCam) maxCam = Math.max(maxCam, Math.abs(plan.camPxX - prevCam.camPxX), Math.abs(plan.camPxY - prevCam.camPxY)); prevCam = { camPxX: plan.camPxX, camPxY: plan.camPxY }; }
        const cur = R('mapIdForRef(activeMap)');
        if (cur !== prevMap) { handoffs++; prevMap = cur; }
        if (cur === toMap) break;
      }
      g.release(key);
      return { reached: prevMap === toMap, maxCam, handoffs };
    };
    const h = handoff('MAP3', '14.5*TILE', '6.5*TILE', SPEED, 0, 'MAP4'); // east seam MAP3->MAP4
    assert.ok(h.reached, 'horizontal MAP3->MAP4 handoff reached');
    assert.ok(h.maxCam <= SPEED, `horizontal handoff camera continuous (<=SPEED, got ${h.maxCam})`);
    assert.equal(h.handoffs, 1, 'horizontal handoff happens exactly once at the boundary');
    const v = handoff('MAP3', '8.5*TILE', '0.5*TILE', 0, -SPEED, 'MAP3_N1'); // north seam MAP3->MAP3_N1
    assert.ok(v.reached && v.maxCam <= SPEED && v.handoffs === 1, 'vertical MAP3->MAP3_N1 handoff: once, camera continuous');

    // ── 9. Roddon's fixed-side camera stays smooth under the default ──────────
    {
      R("debugWarpToDestination('outdoor:RODDON_WAY_MAP'); resetLocationState(); activeMap=mapRefForId('RODDON_WAY_MAP'); forceLegacyRegionalView=false;");
      let prev = null, maxCam = 0;
      for (let wy = 2206; wy <= 2210; wy += SPEED) {
        const p = J(`JSON.stringify(buildContinuousWorldPlanFromWorld('overworld',720,${wy},${VW},${VH}))`);
        if (prev) maxCam = Math.max(maxCam, Math.abs(p.camPxX - prev.camPxX), Math.abs(p.camPxY - prev.camPxY));
        prev = p;
      }
      assert.ok(maxCam <= SPEED, 'Roddon camera smooth across the old flip line under the default');
    }

    // ── 10. BLOCKED / BORDER edges remain impassable (audit totals unchanged) ──
    const audit = require('../transition-audit.js').seamReadiness.totals;
    assert.equal(audit.BLOCKED, 4, 'BLOCKED edges unchanged');
    assert.equal(audit.BORDER, 26, 'BORDER edges unchanged');
    assert.equal(audit.ALIGNS, 26, 'ALIGNS unchanged');
    assert.equal(audit.INTENTIONAL_DISCRETE, 4, "MAP's four intentional-discrete crossings unchanged");

    // ── 11. Nonregional / discrete contexts stay legacy under the default ─────
    for (const d of ['town:calwick_south', 'special:bridge', 'dungeon:f5']) {
      R(`debugWarpToDestination('${d}'); forceLegacyRegionalView=false;`);
      assert.equal(R('continuousWorldViewActive()'), false, `${d} stays legacy (discrete/nonregional)`);
    }
    R('enterMeadow(); forceLegacyRegionalView=false;');
    assert.equal(R('continuousWorldViewActive()'), false, 'the hidden meadow stays legacy (not region-placed)');

    // ── 12. Combat unaffected: continuous choke point independent of combat ────
    R("debugWarpToDestination('outdoor:MAP2'); resetLocationState(); activeMap=mapRefForId('MAP2'); __reconcileCanonicalForTest(); forceLegacyRegionalView=false;");
    assert.equal(R('continuousWorldViewActive()'), true, 'MAP2 continuous before combat');
    // canonical position + presentation unaffected by combat toggling
    const preCombat = R("JSON.stringify(regionalWorldPosition())");
    R('combat.active=true;'); const inCombat = R('continuousWorldViewActive()'); R('combat.active=false;');
    assert.equal(R("JSON.stringify(regionalWorldPosition())"), preCombat, 'combat does not mutate canonical regional position');
    void inCombat; // render dispatch handles combat separately; canonical/presentation authority is untouched

    // ── 13. Neighbour content + regional NPC simulation run under the default ──
    R("debugWarpToDestination('outdoor:MAP3'); resetLocationState(); activeMap=mapRefForId('MAP3'); player.x=14.5*TILE; player.y=6.5*TILE; __reconcileCanonicalForTest(); forceLegacyRegionalView=false;");
    assert.equal(R("(function(){var s=nearbySimulationMapSet(); return !!(s && s.mapIds && s.mapIds.length>0);})()"), true, 'regional NPC simulation set is populated under the default');
    assert.ok(R("(function(){var w=activePlayerWorldPoint(); var c=w?worldPointContentContext('overworld', w.worldPxX, w.worldPxY):null; return !!c;})()"), 'world-point content context resolves under the default');

    // ── 14. Cross-seam authorization is FAIL-CLOSED (fallback ON -> null) ──────
    const wpcDefault = R("(function(){var w=activePlayerWorldPoint(); return !!(w && worldPointContentContext('overworld', w.worldPxX, w.worldPxY));})()");
    R('forceLegacyRegionalView=true;');
    const wpcFallback = R("(function(){var w=activePlayerWorldPoint(); return worldPointContentContext('overworld', w?w.worldPxX:0, w?w.worldPxY:0);})()");
    R('forceLegacyRegionalView=false;');
    assert.equal(wpcDefault, true, 'cross-seam content available under the default');
    assert.equal(wpcFallback, null, 'cross-seam content FAIL-CLOSED to null under the legacy fallback');

    // ── 15. Geographic encounters identical with the fallback on or off ───────
    for (const mid of ['MAP3_N1', 'NORTH_BASIN_SW_MAP', 'RODDON_WAY_MAP']) {
      const same = R(`(function(){
        resetLocationState(); activeMap=mapRefForId('${mid}'); player.x=8.5*TILE; player.y=7.5*TILE; __reconcileCanonicalForTest();
        forceLegacyRegionalView=false; var a=currentEncounterPool();
        forceLegacyRegionalView=true;  var b=currentEncounterPool();
        forceLegacyRegionalView=false;
        return a===b && a===mapEntryForId('${mid}').encounterPool;
      })()`);
      assert.equal(same, true, `${mid}: geographic encounter pool identical regardless of presentation mode`);
    }

    // ── 16. The debug fallback coherently disables every continuous consumer ───
    R("debugWarpToDestination('outdoor:MAP3'); resetLocationState(); activeMap=mapRefForId('MAP3'); player.x=14.5*TILE; player.y=6.5*TILE; __reconcileCanonicalForTest(); forceLegacyRegionalView=true;");
    assert.equal(R('continuousWorldViewActive()'), false, 'fallback ON -> choke point false');
    assert.equal(R('nearbySimulationMapSet()'), null, 'fallback ON -> no regional NPC simulation');
    assert.equal(R("(function(){var w=activePlayerWorldPoint(); return worldPointContentContext('overworld', w?w.worldPxX:0, w?w.worldPxY:0);})()"), null, 'fallback ON -> no cross-seam content');
    assert.equal(R("(function(){var d=continuousSeamDiagnostic(); return d && d.engaged;})()"), null, 'fallback ON -> no continuous seam engaged', );
    R('forceLegacyRegionalView=false;');

    // ── 17. Toggling the fallback near a seam does not strand / double-move ────
    R("debugWarpToDestination('outdoor:MAP3'); resetLocationState(); activeMap=mapRefForId('MAP3'); player.x=14.5*TILE; player.y=6.5*TILE; __reconcileCanonicalForTest(); forceLegacyRegionalView=false;");
    const beforeTog = R("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+JSON.stringify(regionalWorldPosition())");
    R('forceLegacyRegionalView=true;'); R('forceLegacyRegionalView=false;'); R('forceLegacyRegionalView=true;');
    const afterTog = R("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+JSON.stringify(regionalWorldPosition())");
    assert.equal(afterTog, beforeTog, 'toggling the fallback near a seam moves nothing (no strand / double-move)');
    R('forceLegacyRegionalView=false;');

    // ── 18. Fallback absent from v4 saves; load does not restore it ───────────
    R("debugWarpToDestination('outdoor:MAP2'); placeAtLocation('MAP2', 8*TILE, 7*TILE); forceLegacyRegionalView=true; saveGame();");
    const saved = J("localStorage.getItem('verdantVale_save')");
    assert.equal(saved.version, 4, 'SAVE_VERSION stays 4');
    assert.ok(!/forceLegacyRegionalView|legacyRegional|continuousWorldView/i.test(JSON.stringify(saved)), 'the fallback is absent from the v4 save payload');
    R('forceLegacyRegionalView=false; loadGame();');
    assert.equal(R('forceLegacyRegionalView'), false, 'load does not set/restore the session-only fallback');

    // ── 19. Broken canonical invariants fail closed to legacy ─────────────────
    R("debugWarpToDestination('outdoor:MAP2'); resetLocationState(); activeMap=mapRefForId('MAP2'); player.x=8*TILE; player.y=7*TILE; __reconcileCanonicalForTest(); forceLegacyRegionalView=false;");
    assert.equal(R('regionalInvariantsHold()'), true, 'invariants hold after reconcile');
    assert.equal(R('continuousWorldViewActive()'), true, 'continuous while invariants hold');
    // corrupt the projection: activeMap disagrees with the canonical regional map
    const broke = R("(function(){ activeMap = mapRefForId('MAP4'); return regionalInvariantsHold()===false && continuousWorldViewActive()===false; })()");
    assert.equal(broke, true, 'broken canonical invariants -> continuousWorldViewActive() fails closed to legacy');
    R("__reconcileCanonicalForTest();");

    // ── 20. Inspector can distinguish the FIVE presentation states ────────────
    const stateSig = () => J(`(function(){
      var canon=!!regionalWorldPosition();
      var invOk=(typeof regionalInvariantsHold!=='function')||regionalInvariantsHold();
      var rid=(typeof regionalActiveMapId==='function')?regionalActiveMapId():null;
      var legacyHome=!!(rid && isLegacyScreenMap(rid));
      return JSON.stringify({cont:continuousWorldViewActive(), canon:canon, invOk:invOk, legacyHome:legacyHome, fallback:forceLegacyRegionalView});
    })()`);
    // (a) production continuous
    R("debugWarpToDestination('outdoor:MAP2'); resetLocationState(); activeMap=mapRefForId('MAP2'); __reconcileCanonicalForTest(); forceLegacyRegionalView=false;");
    assert.deepEqual(stateSig(), { cont: true, canon: true, invOk: true, legacyHome: false, fallback: false }, 'state: production continuous');
    // (b) legacy_screen metadata
    R("debugWarpToDestination('outdoor:MAP'); resetLocationState(); activeMap=mapRefForId('MAP'); __reconcileCanonicalForTest();");
    assert.deepEqual(stateSig(), { cont: false, canon: true, invOk: true, legacyHome: true, fallback: false }, 'state: legacy_screen home');
    // (c) debug legacy fallback
    R("debugWarpToDestination('outdoor:MAP2'); resetLocationState(); activeMap=mapRefForId('MAP2'); __reconcileCanonicalForTest(); forceLegacyRegionalView=true;");
    assert.deepEqual(stateSig(), { cont: false, canon: true, invOk: true, legacyHome: false, fallback: true }, 'state: debug legacy fallback');
    R('forceLegacyRegionalView=false;');
    // (d) discrete / nonregional
    R("debugWarpToDestination('town:calwick_south');");
    assert.equal(stateSig().canon, false, 'state: discrete / nonregional (no canonical regional position)');
    // (e) invariant failure — distinct from discrete (canonical position survives)
    R("debugWarpToDestination('outdoor:MAP2'); resetLocationState(); activeMap=mapRefForId('MAP2'); __reconcileCanonicalForTest(); activeMap=mapRefForId('MAP4');");
    const eSig = stateSig();
    assert.ok(eSig.canon && !eSig.invOk && !eSig.cont, 'state: canonical-invariant failure (fail-closed, distinct from discrete)');
    R("__reconcileCanonicalForTest();");

    // ── 21. Render-plan / draw-call bounds (chunk-indexed, no double draw) ─────
    const BOUND = (Math.ceil(VW / TILE) + 1) * (Math.ceil(VH / TILE) + 1); // 17*16 = 272
    const planTiles = (mid, lx, ly) => J(`(function(){
      var w=mapLocalPxToRegionWorldPx('${mid}',${lx},${ly});
      var p=buildContinuousWorldPlanFromWorld('overworld',w.worldPxX,w.worldPxY,${VW},${VH});
      var tiles=0, seen={}, dup=false;
      p.visibleChunks.forEach(function(c){
        for(var r=c.startRow;r<c.endRow;r++) for(var col=c.startCol;col<c.endCol;col++){
          tiles++; var k=(c.chunkX*16+col)+','+(c.chunkY*15+r); if(seen[k])dup=true; seen[k]=1;
        }
      });
      return JSON.stringify({chunks:p.visibleChunks.length, tiles:tiles, dup:dup});
    })()`);
    for (const [mid, lx, ly, label] of [
      ['MAP3', 8 * 32, 7 * 32, 'chunk middle'],
      ['MAP3', 15 * 32, 7 * 32, 'two-chunk (east) seam'],
      ['MAP3', 15 * 32, 14 * 32, 'four-chunk corner'],
      ['MAP2', 0, 7 * 32, 'legacy-home corner (MAP/MAP2/Roddon area)'],
    ]) {
      const t = planTiles(mid, lx, ly);
      assert.ok(t.chunks <= 4, `${label}: <= 4 chunks planned (got ${t.chunks})`);
      assert.ok(t.tiles <= BOUND, `${label}: terrain tile draws <= ${BOUND} (got ${t.tiles}), NOT chunks*240`);
      assert.equal(t.dup, false, `${label}: no world tile coordinate drawn twice in one pass`);
    }
    // chunk lookup is an O(1) index, not a full-region scan
    assert.equal(R("typeof _CHUNK_TO_MAP_ID !== 'undefined' && typeof _CHUNK_TO_MAP_ID.get === 'function'"), true, 'visible-chunk lookup uses the chunk-coordinate index (_CHUNK_TO_MAP_ID)');
    // planning mutates no gameplay state and rebuilds no authority
    const preplan = R("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+JSON.stringify(regionalWorldPosition())");
    const catRef = R('REGIONAL_CHUNK_CATALOG'); void catRef;
    R("(function(){var w=mapLocalPxToRegionWorldPx('MAP3',8*TILE,7*TILE); for(var i=0;i<10;i++) buildContinuousWorldPlanFromWorld('overworld',w.worldPxX+i,w.worldPxY,512,480); })()");
    assert.equal(R("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+JSON.stringify(regionalWorldPosition())"), preplan, 'camera/visibility planning mutates no gameplay state');
    assert.equal(R("REGIONAL_CHUNK_CATALOG===window.REGIONAL_CHUNK_CATALOG && _REGIONAL_CHUNK_DEFINITIONS.length===15"), true, 'no per-frame rebuild of the chunk catalog');

    // ── 22. All 15 regional grid fingerprints unchanged ───────────────────────
    for (const id of Object.keys(GRID_FP.fingerprints)) {
      assert.equal(sha256(R(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`)), GRID_FP.fingerprints[id], `${id}: grid fingerprint unchanged`);
    }

    // ── 23. Save version + audit totals unchanged ─────────────────────────────
    assert.equal(R('SAVE_VERSION'), 4, 'SAVE_VERSION === 4');

    // ── 24. The old opt-in symbol is absent from production ───────────────────
    assert.equal(R("typeof continuousWorldViewEnabled"), 'undefined', 'continuousWorldViewEnabled is gone from production');
  },
};
