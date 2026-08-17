'use strict';
// DEBUG continuous-view GENERALIZED seamless movement (continuous-seams.js +
// movement.js update()). Every currently-safe reciprocal ALIGNS outdoor seam
// (derived at runtime from REGIONAL_LAYOUT + EDGE_TRANSITIONS + placement) is
// walkable-across while Continuous View is on; everything else keeps exact legacy
// behavior. Engagement is exact-footprint (no fixed one-tile corridor).
//
// Deterministic: debugMode ON during movement scenarios (no encounter RNG).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'continuous seams: generalized seamless movement across every safe reciprocal ALIGNS seam',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));
    const TILE = g.run('TILE'), ROWS = g.run('ROWS'), COLS = g.run('COLS'), SPEED = g.run('SPEED');
    const CH = ROWS * TILE, CW = COLS * TILE;
    // warp + clear any overlay a prior crossing may have opened (a North Basin
    // feature/evidence trigger can open dialogue, which freezes update()).
    const warp = (id) => g.run(`debugWarpToDestination('outdoor:${id}'); dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;`);
    const setKeys = (o) => g.run('(function(o){for(var k in keys)delete keys[k];for(var k in o)keys[k]=o[k];})(' + JSON.stringify(o) + ')');
    const clearKeys = () => g.run('for(var k in keys)delete keys[k];');
    const mapId = () => g.run('mapIdForRef(activeMap)');
    const place = () => J('JSON.stringify(regionPlacementForMapId(mapIdForRef(activeMap)))');
    const worldX = () => place().chunkX * CW + g.run('player.x');
    const worldY = () => place().chunkY * CH + g.run('player.y');
    const camY = () => { const pl = J("JSON.stringify((function(){var c=regionalWorldPosition();return c?buildContinuousWorldPlanFromWorld(c.regionId,c.worldPxX,c.worldPxY,512,480):null;})())"); return pl ? pl.camPxY : 0; };
    const camX = () => { const pl = J("JSON.stringify((function(){var c=regionalWorldPosition();return c?buildContinuousWorldPlanFromWorld(c.regionId,c.worldPxX,c.worldPxY,512,480):null;})())"); return pl ? pl.camPxX : 0; };
    g.run('debugMode = true;');

    const drive = (keyObj, n) => {
      setKeys(keyObj);
      const rec = { zero: 0, maxWorldD: 0, maxCamD: 0, handoffs: 0 };
      let pw = { x: worldX(), y: worldY() }, pc = { x: camX(), y: camY() }, pm = mapId();
      for (let i = 0; i < n; i++) {
        g.frames(1);
        const w = { x: worldX(), y: worldY() }, c = { x: camX(), y: camY() }, m = mapId();
        const dW = Math.hypot(w.x - pw.x, w.y - pw.y);
        rec.maxWorldD = Math.max(rec.maxWorldD, dW);
        rec.maxCamD = Math.max(rec.maxCamD, Math.hypot(c.x - pc.x, c.y - pc.y));
        if (dW < 1e-9) rec.zero++;
        if (m !== pm) rec.handoffs++;
        pw = w; pc = c; pm = m;
      }
      clearKeys();
      return rec;
    };

    // ── 1. Runtime eligibility == safe reciprocal ALIGNS (from the audit) ────
    const entries = J("JSON.stringify(continuousSeamEntries().map(e=>({from:e.from,dir:e.dir,to:e.to,range:e.range})))");
    assert.equal(entries.length, 34, '34 eligible directed segment entries (17 reciprocal segment pairs)');
    const audit = require('../transition-audit.js');
    const alignsSet = new Set(audit.seamReadiness.edges.filter(e => e.verdict === 'ALIGNS').map(e => e.mapId + '|' + e.dir + '|' + e.neighbor));
    for (const e of entries) assert.ok(alignsSet.has(e.from + '|' + e.dir + '|' + e.to), `${e.from} ${e.dir} -> ${e.to} is an audit ALIGNS edge`);
    const eligibleEdgeSet = new Set(entries.map((e) => e.from + '|' + e.dir + '|' + e.to));
    assert.equal(eligibleEdgeSet.size, alignsSet.size, 'eligible physical-edge set equals the ALIGNS set exactly');
    // reciprocal + identical range for every entry
    const byKey = {}; entries.forEach(e => { byKey[e.from + '|' + e.dir + '|' + e.range.join('-')] = e; });
    const INV = { north: 'south', south: 'north', east: 'west', west: 'east' };
    for (const e of entries) {
      const r = byKey[e.to + '|' + INV[e.dir] + '|' + e.range.join('-')];
      assert.ok(r && r.to === e.from, `reciprocal exists for ${e.from} ${e.dir}`);
      assert.deepEqual(r.range, e.range, 'reciprocal range identical (no remap)');
    }

    // ── 1b. FAIL-CLOSED structural classifier (pure; synthetic segments) ────
    const classify = (seg) => J(`JSON.stringify(classifyContinuousSegment(${JSON.stringify(seg)}))`);
    const baseSeg = { targetMap: 'X', targetEdge: 'south', sourceRange: [1, 14] };
    assert.equal(classify(baseSeg).ok, true, 'a recognized structural segment is eligible');
    assert.equal(classify({ ...baseSeg, targetRange: [1, 14] }).ok, true, 'an identical targetRange is eligible (non-remapping, treated as omitted)');
    assert.equal(classify({ ...baseSeg, targetRange: [2, 13] }).ok, false, 'a differing targetRange is ineligible (remap)');
    for (const bad of ['condition', 'blockedText', 'callback', 'onTransition', 'onEnter', 'effect', 'stateChange', 'cost', 'futureBehavior']) {
      const seg = { ...baseSeg }; seg[bad] = 1;
      const c = classify(seg);
      assert.equal(c.ok, false, `a segment with "${bad}" fails closed`);
      assert.match(c.reason, new RegExp(bad), `the reason names the offending property "${bad}"`);
    }
    assert.equal(classify({ targetMap: 'X', targetEdge: 'south' }).ok, false, 'a segment missing sourceRange is ineligible');
    // the fail-closed reason is surfaced through the read-only diagnostic
    const diags = J('JSON.stringify(continuousSegmentDiagnostics())');
    assert.ok(diags.length > 0 && diags.every(d => typeof d.structural === 'boolean'), 'segment diagnostics surface structural eligibility + reason');
    // every DERIVED-eligible seam classifies structurally ok (index agrees with the pure classifier)
    for (const e of entries) {
      const seg = J(`JSON.stringify(EDGE_TRANSITIONS[${JSON.stringify(e.from)}][${JSON.stringify(e.dir)}].find(function(s){return s.sourceRange[0]===${e.range[0]}&&s.sourceRange[1]===${e.range[1]};}))`);
      assert.equal(classify(seg).ok, true, `${e.from}|${e.dir} underlying segment is structurally eligible`);
    }

    // ── 2 + 3. Every eligible directed seam crosses at a range midpoint ─────
    const crossDirected = (from, dir, to, range, frames) => {
      warp(from); g.run('forceLegacyRegionalView = false;');
      const mid = Math.floor((range[0] + range[1]) / 2);
      if (dir === 'north')      g.run(`player.x = ${(mid + 0.5)} * TILE; player.y = 0.5 * TILE;`);
      else if (dir === 'south') g.run(`player.x = ${(mid + 0.5)} * TILE; player.y = ${(ROWS - 0.5)} * TILE;`);
      else if (dir === 'west')  g.run(`player.x = 0.5 * TILE; player.y = ${(mid + 0.5)} * TILE;`);
      else                       g.run(`player.x = ${(COLS - 0.5)} * TILE; player.y = ${(mid + 0.5)} * TILE;`);
      g.run('__reconcileCanonicalForTest();'); // sync canonical to the hand-set edge start
      const kmap = { north: 'ArrowUp', south: 'ArrowDown', west: 'ArrowLeft', east: 'ArrowRight' };
      const rec = drive({ [kmap[dir]]: true }, frames || 14);
      return { map: mapId(), zero: rec.zero };
    };
    for (const e of entries) {
      const r = crossDirected(e.from, e.dir, e.to, e.range, 16);
      assert.equal(r.map, e.to, `crossed ${e.from} ${e.dir} -> ${e.to} at range midpoint`);
    }

    // ── 4. Sustained vertical + horizontal, no stuck frames, footprint clears ─
    const v = crossDirected('NORTH_BASIN_S_MAP', 'north', 'NORTH_BASIN_C_MAP', [1, 14], 40);
    assert.equal(v.map, 'NORTH_BASIN_C_MAP');
    assert.equal(v.zero, 0, 'sustained vertical: no stuck frames');
    assert.ok(g.run('player.y') + 9 < CH, 'vertical: footprint fully inside destination');
    const h = crossDirected('MAP3_N1', 'west', 'RODDON_WAY_MAP', [4, 9], 40);
    assert.equal(h.map, 'RODDON_WAY_MAP');
    assert.equal(h.zero, 0, 'sustained horizontal: no stuck frames');
    assert.ok(g.run('player.x') + 9 < CW, 'horizontal: footprint fully inside destination');

    // ── 5. Reversal + parallel movement, both orientations ──────────────────
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.3*TILE; __reconcileCanonicalForTest();');
    drive({ ArrowUp: true }, 6); assert.equal(mapId(), 'NORTH_BASIN_C_MAP', 'v reversal: crossed up');
    const rv = drive({ ArrowDown: true }, 6); assert.equal(mapId(), 'NORTH_BASIN_S_MAP', 'v reversal: back down'); assert.equal(rv.zero, 0);
    // parallel (sideways) while straddling the vertical seam
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.2*TILE; __reconcileCanonicalForTest();');
    const bx = g.run('player.x'); const par = drive({ ArrowLeft: true }, 5);
    assert.ok(g.run('player.x') < bx && par.zero === 0, 'parallel movement along a vertical seam works');
    // horizontal reversal + parallel
    warp('MAP3_N1'); g.run('forceLegacyRegionalView = false; player.x = 0.3*TILE; player.y = 6.5*TILE; __reconcileCanonicalForTest();');
    drive({ ArrowLeft: true }, 6); assert.equal(mapId(), 'RODDON_WAY_MAP', 'h reversal: crossed left');
    const rh = drive({ ArrowRight: true }, 6); assert.equal(mapId(), 'MAP3_N1', 'h reversal: back right'); assert.equal(rh.zero, 0);

    // ── 6. Diagonal X-then-Y + wall sliding ─────────────────────────────────
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();');
    const bcx = place().chunkX;
    drive({ ArrowUp: true, ArrowLeft: true }, 12);
    assert.ok(mapId() === 'NORTH_BASIN_C_MAP' || mapId() === 'NORTH_BASIN_S_MAP', 'diagonal stays in the vertical pair');
    assert.equal(place().chunkX, bcx, 'diagonal never drifts chunkX (X blocked out-of-range while Y crosses)');

    // ── 7. Each axis moves at most once (world delta per frame <= SPEED*sqrt2)
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();');
    const dd = drive({ ArrowUp: true }, 20);
    assert.ok(dd.maxWorldD <= SPEED + 1e-9, 'pure-axis: no frame moves more than SPEED (one application per axis)');

    // ── 8. activeMap switches only when the standing point crosses ──────────
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();');
    setKeys({ ArrowUp: true });
    let switchedEarly = false, switched = false;
    for (let i = 0; i < 20; i++) { const b = mapId(); g.frames(1); if (b === 'NORTH_BASIN_S_MAP' && mapId() === 'NORTH_BASIN_C_MAP') { switched = true; if (worldY() >= 2 * CH) switchedEarly = true; } }
    clearKeys();
    assert.ok(switched && !switchedEarly, 'activeMap changes exactly when the standing point crosses the seam line');

    // ── 9 + 10 + 11. World delta == movement; camera bounded; fractional+facing
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.6*TILE; player.facing="up"; __reconcileCanonicalForTest();');
    const cont = drive({ ArrowUp: true }, 20);
    assert.ok(Math.abs(cont.maxWorldD - SPEED) < 1e-9, 'every open frame world-delta equals applied movement (SPEED)');
    assert.ok(cont.maxCamD <= SPEED + 1e-9, 'camera delta bounded by movement (region-edge clamp only reduces it)');
    assert.equal(g.run('player.facing'), 'up', 'facing preserved across handoff');
    assert.ok(g.run('player.y') % TILE !== 0, 'fractional/sub-tile position preserved');

    // ── 12 + 13. Exact-footprint engagement; TILE corridor gone ─────────────
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.9*TILE; __reconcileCanonicalForTest();'); // within a tile of seam, footprint fully inside
    assert.equal(g.run('continuousSeamEngaged(0,-2)'), false, 'inside the old one-tile corridor but footprint fully inside a map -> NOT engaged (corridor gone)');
    g.run('player.y = 0.3*TILE;; __reconcileCanonicalForTest();'); // candidate footprint would cross
    assert.equal(g.run('continuousSeamEngaged(0,-2)'), true, 'candidate footprint touching the seam -> engaged');
    g.run('player.y = 0.2*TILE;; __reconcileCanonicalForTest();'); // already straddling
    assert.equal(g.run('continuousSeamEngaged(0,0)'), true, 'current footprint straddling -> engaged even with no input delta');

    // ── 14. Range endpoints cross where walkable; just outside does not ─────
    // MAP3_N1 north range is cols 3-13. Col 3 (endpoint) crosses; col 2 (outside) does not.
    warp('MAP3_N1'); g.run('forceLegacyRegionalView = false; player.x = 3.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();');
    drive({ ArrowUp: true }, 10);
    assert.equal(mapId(), 'MAP3_N2', 'range endpoint (col 3) crosses');
    warp('MAP3_N1'); g.run('forceLegacyRegionalView = false; player.x = 2.5*TILE; player.y = 0.5*TILE; __reconcileCanonicalForTest();'); // col 2 is a border wall (outside range)
    const outRes = drive({ ArrowUp: true }, 10);
    assert.equal(mapId(), 'MAP3_N1', 'just outside the range does not cross');

    // ── 15. Blocked / missing / void reject atomically ─────────────────────
    assert.equal(g.run("continuousFootprintWalkable('overworld', {chunkX:2,chunkY:2,mapId:'NORTH_BASIN_S_MAP'}, 8, 8)"), false, 'void world coord -> non-walkable');
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 7.5*TILE; player.y = 0.4*TILE; __reconcileCanonicalForTest();');
    const blk = J(`(function(){ var m=mapRefForId('NORTH_BASIN_C_MAP'); var s=m[14][7]; m[14][7]=WATER;
      for(var k in keys)delete keys[k]; keys.ArrowUp=true; for(var i=0;i<10;i++)update(); for(var k in keys)delete keys[k];
      var r=mapIdForRef(activeMap); m[14][7]=s; return JSON.stringify({map:r}); })()`);
    assert.equal(blk.map, 'NORTH_BASIN_S_MAP', 'a blocked destination tile stops the crossing atomically');

    // ── 16. No diagonal-only chunk entry ────────────────────────────────────
    // NB_S NW area: up crosses to NB_C (col in range), left blocked (row 0 not in west range 9-11);
    // the diagonal chunk NB_W(1,1) must never be entered.
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 1.5*TILE; player.y = 0.4*TILE; __reconcileCanonicalForTest();');
    drive({ ArrowUp: true, ArrowLeft: true }, 12);
    assert.ok(['NORTH_BASIN_S_MAP', 'NORTH_BASIN_C_MAP'].includes(mapId()), 'diagonal near a chunk corner never enters the diagonally-adjacent chunk');

    // ── 17 + 18. Corner determinism + blocked-second-axis wall slide ────────
    // At NB_S row 0 col 8 pushing up+left: X (left) moves within NB_S; Y (up) crosses to NB_C. Deterministic.
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.4*TILE; __reconcileCanonicalForTest();');
    const bxc = worldX();
    drive({ ArrowUp: true, ArrowLeft: true }, 16); // diagonal is 0.707x speed
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP', 'corner: Y axis crossed deterministically');
    assert.ok(worldX() < bxc, 'corner: X axis (wall slide) also moved where valid');

    // ── 19. NEEDS_REMAP seam remains discrete/remapped (MAP -> MAP2 point tile)
    warp('MAP'); g.run('forceLegacyRegionalView = false;');
    assert.equal(g.run('continuousSeamMapEligible("MAP")'), false, 'MAP is not a continuous-seam map');
    g.run('combat.cooldown = 0; player.x = 14.5*TILE; player.y = 7.5*TILE; player.facing="right";; __reconcileCanonicalForTest();');
    g.run('for(var k in keys)delete keys[k]; keys.ArrowRight=true; for(var i=0;i<3;i++)update(); for(var k in keys)delete keys[k];');
    // MAP2_EXIT point transition still fires (legacy enterMap2, discrete)
    // (position may or may not have hit the tile; just assert no seamless engagement)
    assert.equal(g.run('continuousSeamEngaged(2,0)'), false, 'NEEDS_REMAP point-tile edge never engages continuous seams');

    // ── 20. BLOCKED / conditioned transition retains behavior (bridge toll) ─
    g.run("debugWarpToDestination('special:bridge'); forceLegacyRegionalView = false;");
    assert.equal(g.run('continuousSeamMapEligible(mapIdForRef(activeMap))'), false, 'the bridge is not a continuous-seam map (conditioned transition untouched)');

    // ── 21. Noneligible PLACED adjacency does not become seamless ───────────
    // NB_C <-> NB_W are placed & adjacent but BLOCKED (no EDGE_TRANSITIONS) -> ineligible.
    assert.equal(g.run('eligibleContinuousSeam("NORTH_BASIN_C_MAP","west")'), null, 'a BLOCKED placed adjacency is not eligible');
    warp('NORTH_BASIN_C_MAP'); g.run('forceLegacyRegionalView = false; player.x = 0.4*TILE; player.y = 7.5*TILE; __reconcileCanonicalForTest();');
    const blkAdj = drive({ ArrowLeft: true }, 8);
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP', 'physical adjacency alone never authorizes seamless travel');

    // ── 22. Flag OFF -> legacy inset transition ─────────────────────────────
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = true; combat.cooldown = 0; player.x = 8.5*TILE; player.y = 0.4*TILE; __reconcileCanonicalForTest();');
    assert.equal(g.run('continuousSeamEngaged(0,-2)'), false, 'flag off -> never engaged');
    setKeys({ ArrowUp: true }); g.frames(1); clearKeys();
    assert.equal(g.run('player.y'), (ROWS - 2 + 0.5) * TILE, 'flag off -> legacy inset landing');
    assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'), 'flag off -> legacy cooldown');

    // ── 23. Toggle off near a seam cannot strand the player ─────────────────
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 8.5*TILE; player.y = 0.4*TILE; __reconcileCanonicalForTest();');
    drive({ ArrowUp: true }, 8); assert.equal(mapId(), 'NORTH_BASIN_C_MAP');
    g.run('forceLegacyRegionalView = true;');
    const esc = drive({ ArrowDown: true }, 30);
    assert.ok(esc.zero < 30, 'toggling off near a seam does not strand the player (can still move)');

    // ── 24 + 25. No side effects; steps/status/encounter run exactly once ───
    warp('NORTH_BASIN_S_MAP'); g.run('debugMode=false; forceLegacyRegionalView = false; combat.cooldown = 0; player.x = 7.5*TILE; player.y = 0.4*TILE; __reconcileCanonicalForTest();');
    const once = J(`(function(){ var _r=Math.random; Math.random=function(){return 0.999;};
      var s0=player.step;
      for(var k in keys)delete keys[k]; keys.ArrowUp=true; update(); for(var k in keys)delete keys[k];
      var res={combat:combat.active, stepDelta:player.step-s0, poolOK:(currentEncounterPool()||[]).length>0};
      Math.random=_r; return JSON.stringify(res); })()`);
    assert.equal(once.stepDelta, 1, 'exactly one step increment per frame');
    assert.equal(once.combat, false, 'crossing does not force an encounter');
    // Cross the seam over several frames; cooldown must NEVER be reset to
    // ENCOUNTER_COOLDOWN by the seamless crossing (it only ticks down 1/frame).
    g.run('debugMode=true; combat.cooldown = 0;');
    const cd = drive({ ArrowUp: true }, 12);
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP', 'crossed during the cooldown check');
    assert.equal(g.run('combat.cooldown'), 0, 'a seamless crossing never resets the encounter cooldown');
    const s0 = J('JSON.stringify({ day:day, gold:stats.gold, hp:stats.hp, items:stats.items.length, inTown:inTown, inDungeon:inDungeon, dungeonFloor:dungeonFloor })');
    warp('NORTH_BASIN_S_MAP'); g.run('forceLegacyRegionalView = false; player.x = 7.5*TILE; player.y = 0.4*TILE; __reconcileCanonicalForTest();');
    drive({ ArrowUp: true }, 10);
    const s1 = J('JSON.stringify({ day:day, gold:stats.gold, hp:stats.hp, items:stats.items.length, inTown:inTown, inDungeon:inDungeon, dungeonFloor:dungeonFloor })');
    assert.deepEqual(s0, s1, 'no location-flag/quest/day/HP/inventory change');

    // ── 26. Destination content key + encounter pool authoritative ──────────
    assert.equal(g.run('currentContentLocationKey()'), 'north_basin_c', 'destination content-location key authoritative');
    assert.equal(g.run('locationName()'), 'North Basin — Reservoir');
    assert.ok(g.run('(currentEncounterPool()||[]).length > 0'), 'destination encounter pool active');

    // ── 27 + 28. Save/load after vertical + horizontal crossings; version 3 ─
    // (currently on NB_C after a vertical crossing)
    g.run('saveGame();'); const raw = g.run("localStorage.getItem('verdantVale_save')");
    assert.equal(JSON.parse(raw).version, 4, 'SAVE_VERSION stays 4');
    assert.ok(!/continuousWorldView/i.test(raw), 'Continuous View flag is session-only (absent from save)');
    const vx = g.run('player.x'), vy = g.run('player.y');
    g.run('activeMap = MAP; player.x=0; player.y=0; loadGame();; __reconcileCanonicalForTest();');
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP'); assert.equal(g.run('player.x'), vx); assert.equal(g.run('player.y'), vy);
    // horizontal side
    crossDirected('MAP3_N1', 'west', 'RODDON_WAY_MAP', [4, 9], 20);
    assert.equal(mapId(), 'RODDON_WAY_MAP');
    g.run('saveGame(); var hx=player.x, hy=player.y; activeMap=MAP; loadGame();; __reconcileCanonicalForTest();');
    assert.equal(mapId(), 'RODDON_WAY_MAP', 'load restores after a horizontal crossing');

    // ── 29. Nonregional maps + combat unaffected ────────────────────────────
    g.run("debugWarpToDestination('town:calwick_south'); forceLegacyRegionalView = false;");
    assert.equal(g.run('continuousSeamEngaged(0,-2)'), false, 'a town never engages continuous seams');
    g.run('enterMeadow(); forceLegacyRegionalView = false;');
    assert.equal(g.run('continuousSeamEngaged(0,-2)'), false, 'the hidden meadow never engages');
    g.run('startCombat(); combat.enemy = { id:"d", name:"Dummy", hp:10, maxHp:10, atk:1, def:0, spd:1, xp:0, goldMin:0, goldMax:0 };');
    assert.equal(g.run('continuousSeamEngaged(0,-2)'), false, 'combat bypasses continuous seams');
    g.run('combat.active=false; combat.enemy=null;');

    // ── 30. Legacy canWalk away from eligible seams equivalent to parent ────
    warp('MAP'); g.run('forceLegacyRegionalView = true; player.x = 8.5*TILE; player.y = 8.5*TILE; __reconcileCanonicalForTest();');
    assert.equal(g.run('canWalk(8.5*TILE, 8.5*TILE)'), true, 'canWalk on open MAP tile unchanged');
    assert.equal(g.run('canWalk(0.5*TILE, 0.5*TILE)'), false, 'canWalk on MAP border wall unchanged');

    // ── 31. Multiple disjoint structural ranges on one physical edge ───────
    // Temporarily split the existing NB_S.north <-> NB_C.south seam around a
    // nonwalkable WATER gap. This exercises production movement without adding
    // fixture-only maps or a second seam implementation.
    g.run(`window.__multiOldA=EDGE_TRANSITIONS.NORTH_BASIN_S_MAP.north;
      window.__multiOldB=EDGE_TRANSITIONS.NORTH_BASIN_C_MAP.south;
      window.__multiOldATile=NORTH_BASIN_S_MAP[0][5];
      window.__multiOldBTile=NORTH_BASIN_C_MAP[ROWS-1][5];
      NORTH_BASIN_S_MAP[0][5]=WATER; NORTH_BASIN_C_MAP[ROWS-1][5]=WATER;
      EDGE_TRANSITIONS.NORTH_BASIN_S_MAP.north=[
        {targetMap:'NORTH_BASIN_C_MAP',targetEdge:'south',sourceRange:[6,13]},
        {targetMap:'NORTH_BASIN_C_MAP',targetEdge:'south',sourceRange:[1,4]}];
      EDGE_TRANSITIONS.NORTH_BASIN_C_MAP.south=[
        {targetMap:'NORTH_BASIN_S_MAP',targetEdge:'north',sourceRange:[1,4]},
        {targetMap:'NORTH_BASIN_S_MAP',targetEdge:'north',sourceRange:[6,13]}];
      _CS_INDEX=null;_CS_MAPS=null;`);
    let split = J("JSON.stringify(eligibleContinuousSeam('NORTH_BASIN_S_MAP','north').segments.map(function(s){return s.range;}))");
    assert.deepEqual(split, [[1, 4], [6, 13]], 'multi-segment index sorts disjoint ranges deterministically');
    assert.deepEqual(J("JSON.stringify(eligibleContinuousSeam('NORTH_BASIN_C_MAP','south').segments.map(function(s){return s.range;}))"), [[1, 4], [6, 13]], 'reciprocal range set indexed');
    assert.equal(g.run("eligibleContinuousSeam('NORTH_BASIN_S_MAP','north',5)"), null, 'gap has no selected segment');
    assert.deepEqual(J("JSON.stringify(eligibleContinuousSeam('NORTH_BASIN_S_MAP','north',2).range)"), [1, 4]);
    assert.deepEqual(J("JSON.stringify(eligibleContinuousSeam('NORTH_BASIN_S_MAP','north',9).range)"), [6, 13]);

    // Both ranges cross in both directions with one handoff and immediate reversal.
    for (const col of [2, 9]) {
      warp('NORTH_BASIN_S_MAP');
      g.run(`forceLegacyRegionalView=false;player.x=${col + 0.5}*TILE;player.y=0.3*TILE;player.facing='up';__reconcileCanonicalForTest();`);
      let rec = drive({ ArrowUp: true }, 8);
      assert.equal(mapId(), 'NORTH_BASIN_C_MAP', `range at col ${col} crosses north`);
      assert.equal(rec.handoffs, 1, `range at col ${col} hands off once northbound`);
      assert.ok(rec.maxWorldD <= SPEED + 1e-9, 'no movement is applied twice');
      rec = drive({ ArrowDown: true }, 8);
      assert.equal(mapId(), 'NORTH_BASIN_S_MAP', `range at col ${col} reverses immediately`);
      assert.equal(rec.handoffs, 1, `range at col ${col} hands off once southbound`);
      assert.equal(g.run('player.facing'), 'down', 'facing follows reversal normally');

      warp('NORTH_BASIN_C_MAP');
      g.run(`forceLegacyRegionalView=false;player.x=${col + 0.5}*TILE;player.y=(ROWS-0.3)*TILE;__reconcileCanonicalForTest();`);
      rec = drive({ ArrowDown: true }, 8);
      assert.equal(mapId(), 'NORTH_BASIN_S_MAP', `reciprocal range at col ${col} crosses south`);
      assert.equal(rec.handoffs, 1);
    }

    // Gap collision remains ordinary and is never suppressed or authorized.
    warp('NORTH_BASIN_S_MAP');
    g.run('forceLegacyRegionalView=false;player.x=5.5*TILE;player.y=0.4*TILE;__reconcileCanonicalForTest();');
    assert.equal(g.run("continuousSeamSuppressLegacyEdge('north')"), false, 'gap does not suppress normal edge collision');
    assert.equal(g.run('continuousSeamEngaged(0,-2)'), false, 'gap does not engage seamless movement');
    const gapStart = worldY(); const gapMove = drive({ ArrowUp: true }, 12);
    assert.equal(mapId(), 'NORTH_BASIN_S_MAP');
    assert.equal(worldY(), gapStart, 'nonwalkable gap remains blocked');
    assert.equal(gapMove.handoffs, 0);

    // Parallel and diagonal movement is deterministic at all four endpoints.
    for (const endpoint of [1, 4, 6, 13]) {
      const inward = endpoint === 1 || endpoint === 6 ? 'ArrowRight' : 'ArrowLeft';
      warp('NORTH_BASIN_S_MAP');
      g.run(`forceLegacyRegionalView=false;player.x=${endpoint + 0.5}*TILE;player.y=0.3*TILE;__reconcileCanonicalForTest();`);
      const px = worldX(); const parRec = drive({ [inward]: true }, 2);
      assert.notEqual(worldX(), px, `parallel movement works at endpoint ${endpoint}`);
      assert.equal(parRec.handoffs, 0);
      warp('NORTH_BASIN_S_MAP');
      g.run(`forceLegacyRegionalView=false;player.x=${endpoint + 0.5}*TILE;player.y=0.3*TILE;__reconcileCanonicalForTest();`);
      const diagRec = drive({ ArrowUp: true, [inward]: true }, 10);
      assert.equal(mapId(), 'NORTH_BASIN_C_MAP', `diagonal inward crossing works at endpoint ${endpoint}`);
      assert.equal(diagRec.handoffs, 1);
      assert.ok(diagRec.maxWorldD <= SPEED * Math.SQRT2 + 1e-9, 'X-then-Y applies each axis at most once');
    }

    // Legacy fallback still selects either range and uses its established inset
    // landing + cooldown; the gap finds no segment.
    for (const col of [2, 9]) {
      warp('NORTH_BASIN_S_MAP');
      g.run(`forceLegacyRegionalView=true;combat.cooldown=0;player.x=${col + 0.5}*TILE;player.y=0.5*TILE;__reconcileCanonicalForTest();`);
      assert.equal(g.run("tryEdgeTransition('north')"), true, `legacy crosses range at col ${col}`);
      assert.equal(mapId(), 'NORTH_BASIN_C_MAP');
      assert.equal(g.run('player.y'), (ROWS - 2 + 0.5) * TILE);
      assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'));
      g.run(`combat.cooldown=0;player.x=${col + 0.5}*TILE;player.y=(ROWS-0.5)*TILE;__reconcileCanonicalForTest();`);
      assert.equal(g.run("tryEdgeTransition('south')"), true, `legacy reciprocates at col ${col}`);
      assert.equal(mapId(), 'NORTH_BASIN_S_MAP');
    }
    warp('NORTH_BASIN_S_MAP');
    g.run('forceLegacyRegionalView=true;player.x=5.5*TILE;player.y=0.5*TILE;__reconcileCanonicalForTest();');
    assert.equal(g.run("tryEdgeTransition('north')"), false, 'legacy gap remains blocked');

    // Every malformed edge-set fails as one unit: never authorize only its valid
    // first segment. The reciprocal is deliberately kept clean except in the
    // explicit nonreciprocal case.
    const cleanA = [
      { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'south', sourceRange: [1, 4] },
      { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'south', sourceRange: [6, 13] },
    ];
    const cleanB = [
      { targetMap: 'NORTH_BASIN_S_MAP', targetEdge: 'north', sourceRange: [1, 4] },
      { targetMap: 'NORTH_BASIN_S_MAP', targetEdge: 'north', sourceRange: [6, 13] },
    ];
    const edgeResult = (a, b) => J(`(function(){
      EDGE_TRANSITIONS.NORTH_BASIN_S_MAP.north=${JSON.stringify(a)};
      EDGE_TRANSITIONS.NORTH_BASIN_C_MAP.south=${JSON.stringify(b)};
      _CS_INDEX=null;_CS_MAPS=null;
      var group=eligibleContinuousSeam('NORTH_BASIN_S_MAP','north');
      var d=continuousSegmentDiagnostics().find(function(x){return x.from==='NORTH_BASIN_S_MAP'&&x.dir==='north';});
      return JSON.stringify({authorized:!!group,count:continuousSeamEntries().filter(function(e){return e.from==='NORTH_BASIN_S_MAP'&&e.dir==='north';}).length,diag:d});})()`);
    const malformed = [
      ['overlap', [cleanA[0], { ...cleanA[1], sourceRange: [4, 13] }], cleanB],
      ['duplicate', [cleanA[0], { ...cleanA[0] }], cleanB],
      ['fractional', [cleanA[0], { ...cleanA[1], sourceRange: [6.5, 13] }], cleanB],
      ['reversed', [cleanA[0], { ...cleanA[1], sourceRange: [13, 6] }], cleanB],
      ['remapped', [cleanA[0], { ...cleanA[1], targetRange: [7, 13] }], cleanB],
      ['behavior', [cleanA[0], { ...cleanA[1], callback: true }], cleanB],
      ['nonreciprocal', cleanA, [cleanB[0]]],
    ];
    for (const [label, a, b] of malformed) {
      const result = edgeResult(a, b);
      assert.equal(result.authorized, false, `${label}: whole edge fails closed`);
      assert.equal(result.count, 0, `${label}: no valid subset is partially authorized`);
    }

    // Restore the production seam and terrain exactly, then rebuild the index so
    // subsequent consumers see the unchanged single-segment authorities.
    g.run(`EDGE_TRANSITIONS.NORTH_BASIN_S_MAP.north=window.__multiOldA;
      EDGE_TRANSITIONS.NORTH_BASIN_C_MAP.south=window.__multiOldB;
      NORTH_BASIN_S_MAP[0][5]=window.__multiOldATile;
      NORTH_BASIN_C_MAP[ROWS-1][5]=window.__multiOldBTile;
      delete window.__multiOldA;delete window.__multiOldB;
      delete window.__multiOldATile;delete window.__multiOldBTile;
      _CS_INDEX=null;_CS_MAPS=null;`);
    assert.equal(g.run('continuousSeamEntries().length'), 34, 'all production seam segments restore unchanged');
  },
};
