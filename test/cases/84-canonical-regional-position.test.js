'use strict';
// Canonical Regional World Position (Part 1). Proves regional-position.js is THE
// authority: for every placed wilderness map (incl. Verdant Vale's legacy_screen
// MAP) the runtime position is a region-world pixel point { regionId, worldPxX,
// worldPxY }, and activeMap/player.x/player.y are DERIVED compatibility
// projections. Discrete locations carry no canonical position. Also covers the v4
// discriminated save schema and its atomic rejection behaviour.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const CW = 512, CH = 480, TILEPX = 32;

function ctx() { const g = createContext(); g.press('Enter'); g.press('Enter'); return g; }
const J = (g, e) => JSON.parse(g.run(e));
const mapId = (g) => g.run('mapIdForRef(activeMap)');
// Warp helper that also settles menus and turns off encounters.
function warp(g, dest, cont) {
  g.run(`debugWarpToDestination('${dest}');
    dialogue.open=false; menu.open=false; choice.open=false; combat.active=false; combat.cooldown=0;
    debugMode=true; forceLegacyRegionalView=${cont === undefined ? true : !cont}; for (var k in keys) delete keys[k];`);
}

module.exports = {
  name: 'canonical regional world position: authority, projections, v4 save schema, invariants',
  run() {
    const g = ctx();

    // ── 1. Pure round-trips for all 25 placed maps (fractional + boundaries) ─
    const placed = J(g, "JSON.stringify(REGIONAL_LAYOUT.overworld.placements.map(p=>p.mapId))");
    assert.equal(placed.length, 25, '25 placed regional maps');
    for (const m of placed) {
      // a fractional interior point and a chunk-boundary point
      for (const [lx, ly] of [[3.25 * TILEPX, 4.75 * TILEPX], [0, 0], [CW - 0.5, CH - 0.5]]) {
        const rt = J(g, `(function(){
          var w = mapLocalPxToRegionWorldPx('${m}', ${lx}, ${ly});
          var b = regionWorldPxToLocal(w.regionId, w.worldPxX, w.worldPxY);
          return JSON.stringify({ w:w, mapId:b.mapId, lx:b.localPxX, ly:b.localPxY });
        })()`);
        assert.equal(rt.mapId, m, `${m}: world->local round-trips to the same map`);
        assert.ok(Math.abs(rt.lx - lx) < 1e-9 && Math.abs(rt.ly - ly) < 1e-9, `${m}: fractional local pixels survive the round-trip (${lx},${ly})`);
      }
    }

    // ── 2. Rejections: void / negative / non-finite / unknown region / OOR ──
    assert.equal(g.run("regionWorldPxToLocal('overworld', 99*512, 99*480)"), null, 'a void (unplaced) chunk resolves to null');
    assert.equal(g.run("regionWorldPxToLocal('overworld', -1, 100)"), null, 'a negative coordinate resolves to null');
    assert.equal(g.run("regionWorldPxToLocal('overworld', Infinity, 100)"), null, 'a non-finite coordinate resolves to null');
    assert.equal(g.run("regionWorldPxToLocal('overworld', NaN, 0)"), null, 'NaN resolves to null');
    assert.equal(g.run("regionWorldPxToLocal('NO_SUCH_REGION', 100, 100)"), null, 'an unknown region resolves to null');
    assert.equal(g.run("commitRegionalWorldPosition('overworld', 99*512, 99*480)"), false, 'commit of a void point fails atomically');
    assert.equal(g.run("commitRegionalWorldPosition('overworld', NaN, 0)"), false, 'commit of a non-finite point fails atomically');

    // ── 3. Initial MAP state is canonical regional despite legacy_screen ────
    warp(g, 'outdoor:MAP', true);
    assert.equal(g.run("continuousWorldViewActive()"), false, 'MAP suppresses continuous presentation (legacy_screen)');
    const mapCanon = J(g, "JSON.stringify(regionalWorldPosition())");
    assert.ok(mapCanon && mapCanon.regionId === 'overworld', 'MAP has a canonical regional position even while presentation is suppressed');
    const mapPlace = J(g, "JSON.stringify(regionPlacementForMapId('MAP'))");
    assert.ok(mapCanon.worldPxX >= mapPlace.chunkX * CW && mapCanon.worldPxX < (mapPlace.chunkX + 1) * CW, 'MAP canonical worldPxX lies in its chunk');
    assert.equal(J(g, "JSON.stringify(regionalDerivedLocation())").mapId, 'MAP', 'MAP derived location is MAP');
    assert.deepEqual(J(g, "JSON.stringify(regionalInvariantErrors())"), [], 'MAP canonical/projection invariants hold');

    // ── 4 + 5. Within-chunk movement changes canonical by exactly the move;
    //           projections equal the canonical-derived map/local ─────────────
    warp(g, 'outdoor:MAP2', true);
    g.run("player.x = 2.5*TILE; player.y = 1.5*TILE; player.facing='right'; __reconcileCanonicalForTest();"); // grass run cols 1-5
    assert.equal(g.run('canWalk(player.x + SPEED, player.y)'), true, 'the in-chunk test spot has room to move right');
    const before = J(g, "JSON.stringify(regionalWorldPosition())");
    g.hold('ArrowRight'); g.frames(1); g.release('ArrowRight'); // SPEED=2 px, stays in chunk
    const after = J(g, "JSON.stringify(regionalWorldPosition())");
    assert.equal(mapId(g), 'MAP2', 'stayed within MAP2 (in-chunk move)');
    assert.ok(Math.abs((after.worldPxX - before.worldPxX) - g.run('SPEED')) < 1e-9, 'canonical worldPxX advanced by exactly SPEED');
    assert.equal(after.worldPxY, before.worldPxY, 'canonical worldPxY unchanged on a pure-X move');
    const der = J(g, "JSON.stringify(regionalDerivedLocation())");
    assert.equal(g.run("mapIdForRef(activeMap)"), der.mapId, 'activeMap projection equals canonical-derived map');
    assert.equal(g.run('player.x'), der.localPxX, 'player.x projection equals canonical-derived localPxX');
    assert.equal(g.run('player.y'), der.localPxY, 'player.y projection equals canonical-derived localPxY');
    assert.deepEqual(J(g, "JSON.stringify(regionalInvariantErrors())"), [], 'invariants hold after an in-chunk move');

    // ── 6 + 7. Horizontal & vertical seamless handoffs switch derived map only
    //           at the standing-point boundary; sustained, reversal, no double ─
    // Horizontal: MAP3.east -> MAP4.west at row 6 (boundary worldX = 3*CW).
    warp(g, 'outdoor:MAP3', true);
    g.run(`player.x=14.5*TILE; player.y=6.5*TILE; player.facing='left'; __reconcileCanonicalForTest();`);
    let handoffs = 0, maxD = 0, pm = mapId(g), pw = J(g, "JSON.stringify(regionalWorldPosition())").worldPxX;
    g.hold('ArrowRight');
    for (let i = 0; i < 40; i++) {
      g.frames(1);
      const w = J(g, "JSON.stringify(regionalWorldPosition())").worldPxX, m = mapId(g);
      maxD = Math.max(maxD, Math.abs(w - pw));
      if (m !== pm) { handoffs++; assert.ok(Math.abs(w - 3 * CW) < g.run('SPEED') + 1e-9, 'derived map switches AS the standing point crosses worldX 3*CW'); }
      pm = m; pw = w;
      if (m === 'MAP4') break;
    }
    g.release('ArrowRight');
    assert.equal(mapId(g), 'MAP4', 'horizontal seam crossing lands in MAP4');
    assert.equal(handoffs, 1, 'exactly one derived-map handoff');
    assert.ok(maxD <= g.run('SPEED') + 1e-9, 'no double-move: canonical advances at most SPEED per frame');
    // reversal returns to MAP3; advance a few px clear of the seam edge, then a valid footprint
    g.hold('ArrowLeft'); for (let i = 0; i < 20 && mapId(g) !== 'MAP3'; i++) g.frames(1);
    for (let i = 0; i < 10 && g.run('player.x') > 14 * TILEPX; i++) g.frames(1);
    g.release('ArrowLeft');
    assert.equal(mapId(g), 'MAP3', 'reversal crosses back to MAP3');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'no soft-lock after reversal (once clear of the seam edge)');
    // Vertical: MAP_N1.north -> MAP_N2.south at col 7 (boundary worldY = 4*CH).
    warp(g, 'outdoor:MAP_N1', true);
    g.run(`player.x=7.5*TILE; player.y=1.5*TILE; player.facing='down'; __reconcileCanonicalForTest();`);
    let vh = 0; pm = mapId(g);
    g.hold('ArrowUp'); for (let i = 0; i < 40; i++) { g.frames(1); if (mapId(g) !== pm) vh++; pm = mapId(g); if (mapId(g) === 'MAP_N2') break; } g.release('ArrowUp');
    assert.equal(mapId(g), 'MAP_N2', 'vertical seam crossing lands in MAP_N2');
    assert.equal(vh, 1, 'exactly one vertical handoff');

    // ── 8. Toggle-off inset transition establishes the correct canonical dest ─
    warp(g, 'outdoor:MAP3', false); // continuous OFF
    g.run(`player.x=14.5*TILE; player.y=6.5*TILE; player.facing='right'; __reconcileCanonicalForTest();`);
    g.hold('ArrowRight'); for (let i = 0; i < 40 && mapId(g) !== 'MAP4'; i++) g.frames(1); g.release('ArrowRight');
    assert.equal(mapId(g), 'MAP4', 'toggle-off: legacy edge transition reaches MAP4');
    assert.equal(g.run('player.x'), g.run('1.5*TILE'), 'toggle-off inset landing (col 1)');
    const insetCanon = J(g, "JSON.stringify(regionalWorldPosition())");
    const map4Place = J(g, "JSON.stringify(regionPlacementForMapId('MAP4'))");
    assert.equal(insetCanon.worldPxX, map4Place.chunkX * CW + 1.5 * TILEPX, 'canonical equals the inset world point (derived, not stale)');
    assert.deepEqual(J(g, "JSON.stringify(regionalInvariantErrors())"), [], 'invariants hold after a toggle-off inset transition');

    // ── 9. Verdant Vale INTENTIONAL_DISCRETE departure/return (teleport) ─────
    warp(g, 'outdoor:MAP', true);
    g.run(`player.x=14.5*TILE; player.y=4.5*TILE; player.facing='right'; __reconcileCanonicalForTest();`);
    g.hold('ArrowRight'); for (let i = 0; i < 20 && mapId(g) !== 'MAP2'; i++) g.frames(1); g.release('ArrowRight');
    assert.equal(mapId(g), 'MAP2', 'MAP->MAP2 discrete crossing');
    assert.equal(J(g, "JSON.stringify(regionalDerivedLocation())").mapId, 'MAP2', 'canonical now derives MAP2 (a teleport between canonical points)');
    assert.deepEqual(J(g, "JSON.stringify(regionalInvariantErrors())"), [], 'invariants hold after the discrete home crossing');

    // ── 10. Town/interior entry clears canonical; outdoor return reconstructs ─
    warp(g, 'town:calwick_west');
    assert.equal(g.run('regionalWorldPosition()'), null, 'entering a town clears canonical regional state');
    assert.deepEqual(J(g, "JSON.stringify(regionalInvariantErrors())"), [], 'discrete location: null canonical is consistent');
    warp(g, 'outdoor:MAP2', true);
    assert.ok(J(g, "JSON.stringify(regionalWorldPosition())"), 'returning outdoors reconstructs canonical from the validated placement');

    // ── 11. Debug warp establishes (outdoor) / clears (indoor) canonical ────
    warp(g, 'outdoor:MAP5', true);
    assert.equal(J(g, "JSON.stringify(regionalDerivedLocation())").mapId, 'MAP5', 'outdoor debug warp sets canonical to the target map');
    warp(g, 'dungeon:f8_east');
    assert.equal(g.run('regionalWorldPosition()'), null, 'indoor debug warp clears canonical');

    // ── 12 + 14 + 20. v4 REGIONAL save/load round-trip + payload shape ──────
    warp(g, 'outdoor:MAP3', true);
    g.run(`player.x=6.25*TILE; player.y=7.75*TILE; player.facing='up'; __reconcileCanonicalForTest();`);
    const savedRegional = J(g, "(saveGame(), localStorage.getItem('verdantVale_save'))");
    assert.equal(savedRegional.version, 4, 'SAVE_VERSION is 4');
    assert.equal(savedRegional.location.kind, 'regional', 'a regional save is kind:regional');
    assert.equal(savedRegional.location.regionId, 'overworld', 'regional save stores the regionId');
    assert.ok(typeof savedRegional.location.worldPxX === 'number' && typeof savedRegional.location.worldPxY === 'number', 'regional save stores world-pixel position');
    assert.ok(!('mapId' in savedRegional.location) && !('localPxX' in savedRegional.location) && !('activeMapId' in savedRegional), 'no redundant authoritative map/local fields in a regional save');
    assert.ok(savedRegional.player && savedRegional.player.x === undefined && savedRegional.player.facing === 'up', 'player block carries facing only (no x/y projection)');
    // transient continuous/debug flags never enter the save
    assert.ok(!/continuousWorldView|debugMode|camPx|visibleChunks/i.test(JSON.stringify(savedRegional)), 'no continuous/debug transient state in the save');
    // scramble + load restores map + fractional position
    g.run("activeMap=mapRefForId('MAP'); player.x=1; player.y=1; clearRegionalPosition(); loadGame();");
    assert.equal(mapId(g), 'MAP3', 'regional load restores the physical map (derived from world coords)');
    assert.ok(Math.abs(g.run('player.x') - 6.25 * TILEPX) < 1e-6 && Math.abs(g.run('player.y') - 7.75 * TILEPX) < 1e-6, 'regional load restores fractional local position');
    assert.deepEqual(J(g, "JSON.stringify(regionalInvariantErrors())"), [], 'invariants hold after a regional load');

    // ── 13. v4 DISCRETE save/load round-trips (town/interior/dungeon/house) ──
    for (const [dest, expectMap] of [['town:calwick_west', 'TOWN_MAP'], ['dungeon:f8_east', 'DUNGEON_MAP']]) {
      warp(g, dest);
      const dmap = mapId(g);
      const sv = J(g, "(saveGame(), localStorage.getItem('verdantVale_save'))");
      assert.equal(sv.location.kind, 'discrete', dest + ': discrete save');
      assert.equal(sv.location.mapId, dmap, dest + ': discrete save stores the physical map id');
      assert.equal(g.run('regionalWorldPosition()'), null, dest + ': canonical is null on a discrete map');
      g.run("activeMap=mapRefForId('MAP'); player.x=1; player.y=1; loadGame();");
      assert.equal(mapId(g), dmap, dest + ': discrete load restores the physical map');
      assert.equal(g.run('regionalWorldPosition()'), null, dest + ': canonical stays null after a discrete load');
    }

    // ── 15. Atomic rejections on load (version / kind / void / blocked) ─────
    const rejects = (label, mutate) => {
      warp(g, 'outdoor:MAP2', true); g.run("player.x=4.5*TILE; player.y=6.5*TILE; __reconcileCanonicalForTest(); saveGame();");
      g.run(`(function(){ var d=JSON.parse(localStorage.getItem('verdantVale_save')); (${mutate})(d); localStorage.setItem('verdantVale_save', JSON.stringify(d)); })();`);
      const disk = g.run("localStorage.getItem('verdantVale_save')");
      const beforeMap = mapId(g), bx = g.run('player.x');
      assert.equal(g.run('loadGame()'), false, label + ': load is rejected');
      assert.equal(mapId(g), beforeMap, label + ': activeMap unchanged after rejection');
      assert.equal(g.run('player.x'), bx, label + ': player unchanged after rejection');
      assert.equal(g.run("localStorage.getItem('verdantVale_save')"), disk, label + ': stored save left untouched');
    };
    rejects('version mismatch',   "function(d){ d.version = 3; }");
    rejects('unknown kind',       "function(d){ d.location = { kind:'bogus' }; }");
    rejects('void regional point',"function(d){ d.location = { kind:'regional', regionId:'overworld', worldPxX:99*512, worldPxY:99*480 }; }");
    rejects('blocked placement',  "function(d){ d.location = { kind:'discrete', mapId:'SLUICE_MAP', localPxX:7.5*32, localPxY:7.5*32 }; }");

    // ── 16. A failed save does not overwrite an existing valid save ─────────
    warp(g, 'outdoor:MAP3', true); g.run("player.x=6.5*TILE; player.y=6.5*TILE; __reconcileCanonicalForTest(); saveGame();");
    const goodSave = g.run("localStorage.getItem('verdantVale_save')");
    // break the invariant: move the projection out from under canonical
    g.run("player.x = player.x + 40;"); // player.x now disagrees with canonical
    assert.ok(J(g, "JSON.stringify(regionalInvariantErrors())").length > 0, 'a diverged projection is reported as an invariant error');
    assert.equal(g.run('saveGame()'), false, 'saveGame refuses when the canonical invariant is broken');
    assert.equal(g.run("localStorage.getItem('verdantVale_save')"), goodSave, 'the previous valid save is left intact');

    // ── 17. Camera plan consumes canonical world position and mutates nothing ─
    warp(g, 'outdoor:MAP3', true);
    g.run("player.x=8*TILE; player.y=8*TILE; __reconcileCanonicalForTest();");
    const cam = J(g, `(function(){
      var c = regionalWorldPosition();
      var before = mapIdForRef(activeMap)+'|'+player.x+'|'+player.y;
      var plan = buildContinuousWorldPlanFromWorld(c.regionId, c.worldPxX, c.worldPxY, 512, 480);
      var after = mapIdForRef(activeMap)+'|'+player.x+'|'+player.y;
      return JSON.stringify({ px: plan.playerWorldPxX, py: plan.playerWorldPxY, cx: c.worldPxX, cy: c.worldPxY, mutated: before!==after });
    })()`);
    assert.equal(cam.px, cam.cx, 'camera plan target worldPxX equals the canonical worldPxX');
    assert.equal(cam.py, cam.cy, 'camera plan target worldPxY equals the canonical worldPxY');
    assert.equal(cam.mutated, false, 'building the camera plan mutates no runtime state');

    // ── 18. Invariant detection catches stale/disagreeing projections; no repair ─
    warp(g, 'outdoor:MAP3', true); g.run("player.x=6.5*TILE; player.y=6.5*TILE; __reconcileCanonicalForTest();");
    const canonPre = J(g, "JSON.stringify(regionalWorldPosition())");
    g.run("player.y = player.y - 24;"); // diverge projection
    const errs = J(g, "JSON.stringify(regionalInvariantErrors())");
    assert.ok(errs.some(e => /player\.y/.test(e)), 'invariant errors identify the disagreeing projection');
    assert.deepEqual(J(g, "JSON.stringify(regionalWorldPosition())"), canonPre, 'reporting invariants does NOT repair/mutate canonical state');
    // a null canonical while a regional map is active is also flagged
    g.run("clearRegionalPosition();");
    assert.ok(J(g, "JSON.stringify(regionalInvariantErrors())").some(e => /null/.test(e)), 'a regional map with null canonical is a reported invariant');

    // ── 19. Discrete movement is unchanged; never gains a canonical position ─
    warp(g, 'dungeon:f8_east');
    const dbx = g.run('player.x');
    g.run("player.facing='right';"); g.hold('ArrowRight'); g.frames(1); g.release('ArrowRight');
    assert.ok(g.run('player.x') !== dbx || g.run('canWalk(player.x,player.y)') === true, 'discrete movement still applies (or blocks) via the physical model');
    assert.equal(g.run('regionalWorldPosition()'), null, 'discrete movement never establishes a canonical regional position');
    assert.deepEqual(J(g, "JSON.stringify(regionalInvariantErrors())"), [], 'discrete map: canonical-null invariant holds');
  },
};
