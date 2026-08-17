'use strict';
// Canonical Regional World Position — Part 2 (final migration). Every production
// system that needs the player's regional geography now reads the CANONICAL context
// (regional-position.js), never reconstructing it from activeMap + player.x/y. The
// reverse-sync helper (regionalCommitFromActiveLocal) and the map-id+local camera-plan
// overload are gone. Fail-closed on a broken canonical/projection invariant.

const assert = require('assert/strict');
const { createContext } = require('../harness');
const TILEPX = 32, CW = 512, CH = 480;

function ctx() { const g = createContext(); g.press('Enter'); g.press('Enter'); return g; }
const J = (g, e) => JSON.parse(g.run(e));
const mid = (g) => g.run('mapIdForRef(activeMap)');
function warp(g, dest, cont) {
  g.run(`debugWarpToDestination('${dest}'); dialogue.open=false; menu.open=false; choice.open=false; shop.open=false;
    combat.active=false; combat.cooldown=0; debugMode=true; forceLegacyRegionalView=${cont === undefined ? false : !cont}; for (var k in keys) delete keys[k];`);
}

module.exports = {
  name: 'canonical consumers (Part 2): movement/encounters/NPCs/items/interactions/render read canonical, fail-closed',
  run() {
    const g = ctx();

    // ── 1 + 16. Ordinary regional movement writes canonical directly; the
    //           reverse-sync helper is GONE (no definition). ──────────────────
    assert.equal(g.run("typeof regionalCommitFromActiveLocal"), 'undefined', 'regionalCommitFromActiveLocal has no remaining definition');
    assert.equal(g.run("typeof buildContinuousWorldPlan"), 'undefined', 'the map-id+local camera-plan overload has no remaining definition');
    assert.equal(g.run("typeof mapLocalPxToWorldPx"), 'undefined', 'the obsolete player-local->world adapter is removed');
    warp(g, 'outdoor:MAP2', true);
    g.run("placeAtLocation('MAP2', 2.5*TILE, 1.5*TILE);"); // grass run, via the gateway
    const w0 = J(g, "JSON.stringify(regionalWorldPosition())");
    g.hold('ArrowRight'); g.frames(1); g.release('ArrowRight');
    const w1 = J(g, "JSON.stringify(regionalWorldPosition())");
    assert.ok(Math.abs((w1.worldPxX - w0.worldPxX) - g.run('SPEED')) < 1e-9, 'an ordinary regional step advances canonical worldPxX by exactly SPEED (calculated from canonical, not player.x)');
    assert.deepEqual(J(g, "JSON.stringify(regionalInvariantErrors())"), [], 'movement keeps canonical/projection consistent');

    // ── 2. Horizontal + vertical seam movement: exact, single canonical commit ─
    warp(g, 'outdoor:MAP3', true);
    g.run("placeAtLocation('MAP3', 14.5*TILE, 6.5*TILE);");
    let hoff = 0, pm = mid(g), maxD = 0, pw = J(g, "JSON.stringify(regionalWorldPosition())").worldPxX;
    g.hold('ArrowRight');
    for (let i = 0; i < 40; i++) { g.frames(1); const w = J(g, "JSON.stringify(regionalWorldPosition())").worldPxX; maxD = Math.max(maxD, Math.abs(w - pw)); if (mid(g) !== pm) hoff++; pm = mid(g); pw = w; if (mid(g) === 'MAP4') break; }
    g.release('ArrowRight');
    assert.equal(mid(g), 'MAP4', 'horizontal seam crossing lands in MAP4');
    assert.equal(hoff, 1, 'exactly one canonical handoff (horizontal)');
    assert.ok(maxD <= g.run('SPEED') + 1e-9, 'no double-move: canonical advances at most SPEED/frame');
    warp(g, 'outdoor:MAP_N1', true);
    g.run("placeAtLocation('MAP_N1', 7.5*TILE, 1.5*TILE);");
    let voff = 0; pm = mid(g);
    g.hold('ArrowUp'); for (let i = 0; i < 40; i++) { g.frames(1); if (mid(g) !== pm) voff++; pm = mid(g); if (mid(g) === 'MAP_N2') break; } g.release('ArrowUp');
    assert.equal(mid(g), 'MAP_N2', 'vertical seam crossing lands in MAP_N2');
    assert.equal(voff, 1, 'exactly one canonical handoff (vertical)');

    // ── 3 + 12. Encounter pool + Pale Sentry use canonical map identity; the
    //           same ownership under Continuous View on and off. ──────────────
    const poolName = (g2) => g2.run('(currentEncounterPool()===FAR_ENEMY_TEMPLATES?"FAR":currentEncounterPool()===THORNMERE_ENEMY_TEMPLATES?"THORN":"OTHER")');
    for (const cont of [true, false]) {
      g.run(`placeAtLocation('MAP3', 8*TILE, 8*TILE); forceLegacyRegionalView=${!cont};`);
      assert.equal(poolName(g), 'FAR', `MAP3 pool is FAR (Continuous View ${cont})`);
      g.run("placeAtLocation('MAP4', 8*TILE, 2*TILE);");
      assert.equal(poolName(g), 'THORN', `MAP4 pool is THORNMERE (Continuous View ${cont})`);
    }
    // Pale Sentry: MAP_N2-only, from the canonical current chunk + quest flags.
    const sentry = J(g, `(function(){
      var s0=sentry_quest_started,d0=sentry_quest_done,h0=pale_sentry_hp;
      sentry_quest_started=true; sentry_quest_done=false; pale_sentry_hp=500;
      placeAtLocation('MAP_N1', 7.5*TILE, 5.5*TILE); combat.active=false; combat.isPaleSentry=false; startCombat(); var onN1=combat.isPaleSentry;
      combat.active=false; combat.isPaleSentry=false; placeAtLocation('MAP_N2', 7.5*TILE, 10.5*TILE); startCombat(); var onN2=combat.isPaleSentry;
      combat.active=false; combat.isPaleSentry=false; sentry_quest_started=s0; sentry_quest_done=d0; pale_sentry_hp=h0;
      return JSON.stringify({onN1:onN1,onN2:onN2});
    })()`);
    assert.equal(sentry.onN1, false, 'Pale Sentry not eligible on MAP_N1 (canonical current chunk)');
    assert.equal(sentry.onN2, true, 'Pale Sentry eligible on MAP_N2 (canonical current chunk) with quest flags');

    // ── 4 + 15. A broken invariant (corrupted projection) fails closed BEFORE
    //           any encounter randomness, and is NEVER auto-repaired. ──────────
    const failClosed = J(g, `(function(){
      placeAtLocation('MAP3', 8*TILE, 8*TILE);
      var canonBefore = regionalWorldPosition();
      player.x = 999999; // corrupt the projection -> broken invariant
      var rc=0,_r=Math.random; Math.random=function(){rc++; return _r();};
      var sc=0,_sc=startCombat; startCombat=function(){sc++;};
      var poolEmpty = (function(){var p=currentEncounterPool(); return (p===EMPTY_ENCOUNTER_POOL)||(Array.isArray(p)&&p.length===0);})();
      var gate = encounterGeographyOk();
      Math.random=_r; startCombat=_sc;
      var canonAfter = regionalWorldPosition();
      return JSON.stringify({ inv: regionalInvariantErrors().length>0, poolEmpty:poolEmpty, gate:gate, rc:rc,
        notRepaired: JSON.stringify(canonBefore)===JSON.stringify(canonAfter) && player.x===999999 });
    })()`);
    assert.ok(failClosed.inv, 'a corrupted projection is a broken canonical invariant');
    assert.ok(failClosed.poolEmpty, 'broken invariant -> empty encounter pool (fail-closed)');
    assert.equal(failClosed.gate, false, 'broken invariant -> the encounter gate is false');
    assert.equal(failClosed.rc, 0, 'a broken invariant consumes ZERO encounter randomness (fails before Math.random)');
    assert.ok(failClosed.notRepaired, 'reading fail-closed state NEVER repairs canonical or the projection');

    // ── 5. Regional NPC simulation scope + player collision use canonical world. ─
    warp(g, 'outdoor:MAP3', true);
    g.run("placeAtLocation('MAP3', 8*TILE, 8*TILE);");
    assert.ok(J(g, "JSON.stringify(nearbySimulationMapSet())") !== null, 'nearbySimulationMapSet resolves from the canonical current chunk');
    assert.equal(g.run("nearbySimulationMapSet().has('MAP3')"), true, 'the active canonical chunk is in the nearby simulation set');
    // NPC collision measures the player via the canonical world point (fail-closed
    // when the invariant is broken -> a corrupted player projection is not consulted).
    const npcColl = J(g, `(function(){
      placeAtLocation('MAP3', 8*TILE, 8*TILE); player.x=999999; // broken invariant
      return JSON.stringify({ wp: regionalPlayerWorldPoint(), inv: regionalInvariantErrors().length>0 });
    })()`);
    assert.equal(npcColl.wp, null, 'a broken invariant yields no player world point for NPC collision (fail-closed)');
    assert.ok(npcColl.inv, 'the corruption is reported, not silently used');

    // ── 6. Active pickups resolve from the canonical position (cross-seam driver). ─
    warp(g, 'outdoor:MAP3', true); g.run("placeAtLocation('MAP3', 8*TILE, 8*TILE);");
    const app = J(g, "JSON.stringify(typeof activePlayerWorldPoint==='function' ? activePlayerWorldPoint() : null)");
    assert.ok(app && app.regionId === 'overworld', 'the cross-seam pickup driver reads the canonical active world point');
    assert.equal(app.worldPxX, J(g, "JSON.stringify(regionalWorldPosition())").worldPxX, 'the pickup world point equals the canonical worldPxX');

    // ── 7 + 8 + 10. Interaction / map-feature selection uses the canonical current
    //           chunk; landmarks & signs stay active-chunk-only; readers report the
    //           canonical chunk. ───────────────────────────────────────────────
    // The North Basin road sign belongs to NORTH_BASIN_S_MAP; not inspectable from
    // MAP3_N2 even standing at the sign coordinates.
    assert.equal(g.run(`(function(){ placeAtLocation('MAP3_N2', 13.5*TILE, 12.5*TILE); dialogue.open=false; var r=tryMapFeatures(); return r || dialogue.open; })()`), false, 'road sign NOT inspectable from the MAP3_N2 canonical chunk');
    assert.equal(g.run(`(function(){ placeAtLocation('NORTH_BASIN_S_MAP', 13.5*TILE, 12.5*TILE); dialogue.open=false; tryMapFeatures(); return dialogue.open; })()`), true, 'road sign inspects on the NORTH_BASIN_S_MAP canonical chunk');
    // currentContentLocationKey / locationName / currentItemList report the canonical chunk.
    g.run("placeAtLocation('MAP4', 8*TILE, 2*TILE);");
    assert.equal(g.run("currentContentLocationKey()"), 'map4', 'content key = canonical chunk (map4)');
    assert.equal(g.run("locationName()"), g.run("MAP_METADATA['MAP4'].displayName"), 'location name = canonical chunk name');
    assert.equal(g.run("currentItemList()===MAP_METADATA['MAP4'].items"), true, 'item list = canonical chunk items');
    // Standing Stone / gate interaction gate on the canonical current chunk.
    assert.equal(g.run(`(function(){ placeAtLocation('MAP3', 8*TILE, 8*TILE); choice.open=false; player.x=THORNMERE_STONE.x; player.y=THORNMERE_STONE.y; interactThornmereStone(); return choice.open; })()`), false, 'Standing Stone not interactable from a non-MAP4 canonical chunk');

    // ── 9. Neighbour + player rendering read canonical local and mutate nothing. ─
    const rmut = J(g, `(function(){
      placeAtLocation('MAP3', 14*TILE, 6.5*TILE); forceLegacyRegionalView = false;
      var before = mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+JSON.stringify(regionalWorldPosition());
      render();
      var after = mapIdForRef(activeMap)+'|'+player.x+'|'+player.y+'|'+JSON.stringify(regionalWorldPosition());
      return JSON.stringify({ mutated: before!==after });
    })()`);
    assert.equal(rmut.mutated, false, 'a continuous render mutates no activeMap/player/canonical state');

    // ── 11. Verdant Vale stays fixed-screen yet is geographically canonical. ──
    g.run("placeAtLocation('MAP', 8*TILE, 7*TILE); forceLegacyRegionalView = false;");
    assert.equal(g.run("continuousWorldViewActive()"), false, 'MAP suppresses continuous presentation (legacy_screen)');
    assert.equal(J(g, "JSON.stringify(regionalDerivedLocation())").mapId, 'MAP', 'MAP is still canonical regional geography while presentation is suppressed');

    // ── 13. Discrete movement / encounters / interactions unchanged. ─────────
    warp(g, 'dungeon:f8_east');
    assert.equal(g.run('regionalWorldPosition()'), null, 'canonical is null on a discrete dungeon');
    const dbx = g.run('player.x');
    g.run("player.facing='right';"); g.hold('ArrowRight'); g.frames(1); g.release('ArrowRight');
    assert.ok(g.run('player.x') !== dbx || g.run('canWalk(player.x,player.y)'), 'discrete movement still applies via the physical local model');
    assert.equal(g.run('regionalWorldPosition()'), null, 'discrete movement never establishes a canonical position');
    assert.deepEqual(J(g, "JSON.stringify(regionalInvariantErrors())"), [], 'discrete map: canonical-null invariant holds');

    // ── 14. v4 regional + discrete save/load still round-trip. ───────────────
    g.run("placeAtLocation('MAP3', 6.25*TILE, 7.75*TILE); player.facing='up';");
    const rSave = J(g, "(saveGame(), localStorage.getItem('verdantVale_save'))");
    assert.equal(rSave.version, 4, 'SAVE_VERSION is 4');
    assert.equal(rSave.location.kind, 'regional', 'regional save unchanged (kind:regional, world position)');
    g.run("placeAtLocation('MAP', 1*TILE, 1*TILE); loadGame();");
    assert.equal(mid(g), 'MAP3', 'v4 regional load restores the canonical chunk');
    warp(g, 'town:calwick_west');
    const dSave = J(g, "(saveGame(), localStorage.getItem('verdantVale_save'))");
    assert.equal(dSave.location.kind, 'discrete', 'discrete save unchanged (kind:discrete, map+local)');

    // ── 19. Seam audit unchanged. ────────────────────────────────────────────
    const audit = require('../transition-audit.js');
    assert.deepEqual(audit.seamReadiness.totals, { INTENTIONAL_DISCRETE: 4, BORDER: 26, ALIGNS: 26, BLOCKED: 24 }, 'seam audit: 26 ALIGNS / 0 NEEDS_REMAP / 4 INTENTIONAL_DISCRETE / 24 BLOCKED / 26 BORDER (West Outfall + 4 North Basin scenery chunks)');
  },
};
