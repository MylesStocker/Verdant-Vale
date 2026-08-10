'use strict';
// DEBUG continuous-view SEAMLESS-MOVEMENT pilot (continuous-pilot.js +
// movement.js update()). Exactly ONE reciprocal ALIGNS outdoor seam
// (NORTH_BASIN_S_MAP <-> NORTH_BASIN_C_MAP) becomes walkable-across while
// Continuous View is on; everything else (the flag off, other seams, other
// maps, point/gate transitions) keeps its exact legacy behavior.
//
// Regression focus (post-fix): the world-aware path stays engaged as long as the
// radius-9 footprint OVERLAPS the seam — so SUSTAINED input keeps moving on the
// ARRIVAL side too (the old border-only gate soft-locked there). Tests simulate
// held input across many frames, not just the handoff frame.
//
// Deterministic: debugMode ON during movement scenarios (no encounter RNG).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'continuous seam pilot: seam-overlap world movement (sustained, reversible, legacy-safe)',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (e) => JSON.parse(g.run(e));
    const TILE = g.run('TILE'), ROWS = g.run('ROWS'), COLS = g.run('COLS'), SPEED = g.run('SPEED');
    const CH = ROWS * TILE, CW = COLS * TILE;
    const warp = (id) => g.run(`debugWarpToDestination('outdoor:${id}')`);
    const setKeys = (obj) => g.run('(function(o){for(var k in keys)delete keys[k];for(var k in o)keys[k]=o[k];})(' + JSON.stringify(obj) + ')');
    const clearKeys = () => g.run('for(var k in keys)delete keys[k];');
    const mapId = () => g.run('mapIdForRef(activeMap)');
    const place = () => J('JSON.stringify(regionPlacementForMapId(mapIdForRef(activeMap)))');
    const worldY = () => place().chunkY * CH + g.run('player.y');
    const worldX = () => place().chunkX * CW + g.run('player.x');
    const planY = () => { const pl = J("JSON.stringify(buildContinuousWorldPlan('overworld', mapIdForRef(activeMap), player.x, player.y, 512, 480))"); return pl ? { w: pl.playerWorldPxY, cam: pl.camPxY } : null; };
    g.run('debugMode = true;');

    // Hold a direction for n frames, recording per-frame world deltas + handoff frames.
    const drive = (keyObj, n) => {
      setKeys(keyObj);
      const rec = { deltas: [], camDeltas: [], handoffs: 0, zero: 0 };
      let pw = worldY(), px = worldX(), pcam = planY() ? planY().cam : 0, pmap = mapId();
      for (let i = 0; i < n; i++) {
        g.frames(1);
        const w = worldY(), x = worldX(), cam = planY() ? planY().cam : pcam, m = mapId();
        const dTot = Math.hypot(w - pw, x - px);
        rec.deltas.push(dTot);
        rec.camDeltas.push(Math.abs(cam - pcam));
        if (dTot < 1e-9) rec.zero++;
        if (m !== pmap) rec.handoffs++;
        pw = w; px = x; pcam = cam; pmap = m;
      }
      clearKeys();
      return rec;
    };

    // ── 1. Registry: exactly one reciprocal pair ────────────────────────────
    const seams = J('JSON.stringify(CONTINUOUS_PILOT_SEAMS)');
    assert.equal(seams.length, 1, 'exactly one pilot seam pair');
    assert.deepEqual([seams[0].a.mapId, seams[0].b.mapId], ['NORTH_BASIN_S_MAP', 'NORTH_BASIN_C_MAP']);
    assert.deepEqual(seams[0].sourceRange, [1, 14]);

    // ── 2. Seam + range match the transition audit (reciprocal ALIGNS) ──────
    const audit = require('../transition-audit.js');
    const edges = audit.seamReadiness.edges;
    const ns = edges.find(e => e.mapId === 'NORTH_BASIN_S_MAP' && e.dir === 'north');
    const sn = edges.find(e => e.mapId === 'NORTH_BASIN_C_MAP' && e.dir === 'south');
    assert.equal(ns.verdict, 'ALIGNS'); assert.equal(ns.neighbor, 'NORTH_BASIN_C_MAP');
    assert.equal(sn.verdict, 'ALIGNS'); assert.equal(sn.neighbor, 'NORTH_BASIN_S_MAP');
    const seg = J("JSON.stringify(EDGE_TRANSITIONS.NORTH_BASIN_S_MAP.north[0])");
    assert.deepEqual(seg.sourceRange, [1, 14]); assert.equal(seg.targetRange, undefined); assert.equal(seg.condition, undefined);

    // ── 3. Continuous OFF: original legacy inset transition + cooldown ──────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = false; combat.cooldown = 0; player.x = 8.5*TILE; player.y = 0.4*TILE;');
    assert.equal(g.run('pilotSeamEngaged()'), null, 'flag off -> pilot disengaged');
    setKeys({ ArrowUp: true }); g.frames(1); clearKeys();
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP', 'legacy: crosses to NB_C');
    assert.equal(g.run('player.y'), (ROWS - 2 + 0.5) * TILE, 'legacy: inset landing at row 13.5');
    assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'), 'legacy: cooldown reset');

    // ── 4. SUSTAINED NORTH: keep holding until the WHOLE footprint is inside
    //       NB_C. No stuck frame; every unobstructed frame moves exactly SPEED;
    //       exactly one handoff; world + camera continuity. ──────────────────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; combat.cooldown = 0; player.x = 8.5*TILE; player.y = 0.5*TILE; player.facing = "up";');
    const stepBefore = g.run('player.step');
    const north = drive({ ArrowUp: true }, 30);
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP', 'sustained north: on NB_C');
    assert.ok(g.run('player.y') + 9 < ROWS * TILE, 'radius-9 footprint fully INSIDE NB_C (bottom corner not out of bounds)');
    assert.ok(g.run('player.y') < (ROWS - 1) * TILE, 'walked past the seam row 14 (footprint cleared the seam)');
    assert.equal(north.zero, 0, 'NO stuck frame during a sustained crossing (the soft-lock is gone)');
    assert.equal(north.handoffs, 1, 'exactly one handoff during the crossing');
    for (const d of north.deltas) assert.ok(Math.abs(d - SPEED) < 1e-9, 'every unobstructed frame moves exactly SPEED (no stall, no double-apply)');
    for (const cd of north.camDeltas) assert.ok(cd <= SPEED + 1e-9, 'camera moves at most SPEED per frame (continuous, no jump)');
    assert.equal(g.run('player.facing'), 'up', 'facing preserved');
    assert.ok(g.run('player.step') > stepBefore, 'player.step housekeeping ran (not skipped)');
    assert.equal(g.run('combat.cooldown'), 0, 'no cooldown reset on the seamless crossing');
    // fractional/sub-tile progress preserved somewhere during the crossing
    assert.ok(g.run('player.y') % TILE !== 0, 'sub-tile fractional progress preserved (not clamped to a tile centre)');
    // destination authoritative immediately
    assert.equal(g.run('currentContentLocationKey()'), 'north_basin_c');
    assert.equal(g.run('locationName()'), 'North Basin — Reservoir');

    // ── 5. SUSTAINED SOUTH (reciprocal), same guarantees ────────────────────
    warp('NORTH_BASIN_C_MAP');
    g.run('continuousWorldViewEnabled = true; combat.cooldown = 0; player.x = 8.5*TILE; player.y = 14.5*TILE; player.facing = "down";');
    const south = drive({ ArrowDown: true }, 30);
    assert.equal(mapId(), 'NORTH_BASIN_S_MAP', 'sustained south: on NB_S');
    assert.ok(g.run('player.y') - 9 >= 0, 'footprint fully inside NB_S (top corner not out of bounds)');
    assert.ok(g.run('player.y') > TILE, 'walked well past the seam row');
    assert.equal(south.zero, 0, 'no stuck frame on the reciprocal crossing');
    assert.equal(south.handoffs, 1, 'exactly one handoff');
    for (const d of south.deltas) assert.ok(Math.abs(d - SPEED) < 1e-9, 'south: every frame moves exactly SPEED');

    // ── 6. activeMap switches ONLY when the standing point crosses ──────────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; player.x = 8.5*TILE; player.y = 0.5*TILE;');
    setKeys({ ArrowUp: true });
    let switchedWhileSouthOfBoundary = false, everSwitched = false;
    for (let i = 0; i < 20; i++) {
      const before = mapId();
      g.frames(1);
      const after = mapId(), w = worldY();
      if (before === 'NORTH_BASIN_S_MAP' && after === 'NORTH_BASIN_C_MAP') {
        everSwitched = true;
        // standing point must have crossed the boundary (worldY < 960) on the switch frame
        if (w >= 2 * CH) switchedWhileSouthOfBoundary = true;
      }
    }
    clearKeys();
    assert.ok(everSwitched, 'crossing occurred');
    assert.equal(switchedWhileSouthOfBoundary, false, 'activeMap switches only once the standing point crosses the seam line');

    // ── 7. Immediate REVERSAL before the footprint clears ───────────────────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; player.x = 8.5*TILE; player.y = 0.3*TILE;');
    drive({ ArrowUp: true }, 6);
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP', 'reversal: crossed to NB_C');
    const rev = drive({ ArrowDown: true }, 6);
    assert.equal(mapId(), 'NORTH_BASIN_S_MAP', 'reversal: immediately walked back to NB_S (no stall)');
    assert.equal(rev.zero, 0, 'reversal has no stuck frame');

    // ── 8. SIDEWAYS while the footprint straddles the seam ──────────────────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; player.x = 8.5*TILE; player.y = 0.2*TILE;'); // straddling
    assert.ok(g.run('pilotSeamEngaged()') !== null, 'engaged while straddling the seam');
    const sideBeforeX = g.run('player.x');
    const side = drive({ ArrowLeft: true }, 5);
    assert.ok(g.run('player.x') < sideBeforeX, 'sideways movement works while straddling (not stuck)');
    assert.equal(side.zero, 0, 'no stuck frame moving sideways at the seam');

    // ── 9. DIAGONAL during and immediately after handoff (no drift/void) ────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; player.x = 8.5*TILE; player.y = 0.5*TILE;');
    const beforeChunkX = place().chunkX;
    drive({ ArrowUp: true, ArrowLeft: true }, 12);
    assert.ok(mapId() === 'NORTH_BASIN_C_MAP' || mapId() === 'NORTH_BASIN_S_MAP', 'diagonal stays within the approved pair');
    assert.equal(place().chunkX, beforeChunkX, 'diagonal never drifts chunkX into an unapproved neighbour/void');

    // ── 10. No frame applies movement twice (deltas never exceed SPEED) ─────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; player.x = 8.5*TILE; player.y = 0.5*TILE;');
    const dd = drive({ ArrowUp: true }, 20);
    assert.ok(Math.max(...dd.deltas) <= SPEED + 1e-9, 'no single frame moves more than SPEED (movement applied once per axis)');

    // ── 11. Endpoint columns / void / other chunk are impassable ────────────
    assert.equal(g.run("pilotWorldWalkable('overworld', 8, 8)"), false, 'void/unplaced chunk -> non-walkable');
    assert.equal(g.run("pilotWorldWalkable('overworld', -5, 2*15*32+240)"), false, 'out-of-region -> non-walkable');
    assert.equal(g.run(`pilotWorldWalkable('overworld', ${2 * CW + 0.5 * TILE}, ${2 * CH + 0.5 * TILE})`), false, 'col 0 border wall -> non-walkable');
    assert.equal(g.run(`pilotWorldWalkable('overworld', ${2 * CW + 15.5 * TILE}, ${2 * CH + 0.5 * TILE})`), false, 'col 15 border wall -> non-walkable');
    // A blocked corresponding destination tile stops the crossing atomically.
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; player.x = 7.5*TILE; player.y = 0.4*TILE;');
    const blocked = J(`(function(){
      var m = mapRefForId('NORTH_BASIN_C_MAP'); var saved = m[14][7]; m[14][7] = WATER;
      for(var k in keys)delete keys[k]; keys.ArrowUp=true; for (var i=0;i<10;i++) update(); for(var k in keys)delete keys[k];
      var res = mapIdForRef(activeMap); m[14][7] = saved; return JSON.stringify({ map: res });
    })()`);
    assert.equal(blocked.map, 'NORTH_BASIN_S_MAP', 'a blocked destination seam tile keeps the player on the source map (atomic)');

    // ── 12. Destination NPC collision is not bypassed; safety band verified ──
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; player.x = 7.5*TILE; player.y = 0.4*TILE;');
    const npcBlock = J(`(function(){
      var fake = { id:'__pilot_npc', map:'north_basin_c', x:7.5*TILE, y:14.5*TILE, solid:true };
      SIMPLE_NPCS.push(fake);
      for(var k in keys)delete keys[k]; keys.ArrowUp=true; for (var i=0;i<10;i++) update(); for(var k in keys)delete keys[k];
      var res = mapIdForRef(activeMap); SIMPLE_NPCS.splice(SIMPLE_NPCS.indexOf(fake),1); return JSON.stringify({ map: res });
    })()`);
    assert.equal(npcBlock.map, 'NORTH_BASIN_S_MAP', 'a solid destination NPC at the crossing blocks the step (not walked through)');
    assert.equal(g.run("SIMPLE_NPCS.filter(n=>(n.map==='north_basin_s'||n.map==='north_basin_c')&&n.solid).length"), 0, 'pilot maps have no solid NPCs (clear boundary safety band)');

    // ── 13. Other ALIGNS seams + non-pilot maps stay legacy ─────────────────
    warp('NORTH_BASIN_SW_MAP'); // NB_SW east <-> NB_S is ALIGNS but NOT the pilot
    g.run('continuousWorldViewEnabled = true; combat.cooldown = 0; player.x = 15.5*TILE; player.y = 10.5*TILE;');
    assert.equal(g.run('pilotSeamEngaged()'), null, 'a different ALIGNS seam is never pilot-engaged');
    setKeys({ ArrowRight: true }); g.frames(1); clearKeys();
    assert.equal(mapId(), 'NORTH_BASIN_S_MAP', 'other ALIGNS seam crossed via legacy');
    assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'), 'other ALIGNS seam used the legacy inset transition (cooldown set)');
    warp('MAP'); g.run('continuousWorldViewEnabled = true; player.x = 8.5*TILE; player.y = 8.5*TILE;');
    assert.equal(g.run('pilotSeamEngaged()'), null, 'a non-pilot overworld map is never pilot-engaged');

    // ── 14. Encounters / steps / status housekeeping happen exactly once ────
    warp('NORTH_BASIN_S_MAP');
    g.run('debugMode = false; continuousWorldViewEnabled = true; player.x = 7.5*TILE; player.y = 0.4*TILE;');
    const enc = J(`(function(){
      var rolls = 0; var _r = Math.random; Math.random = function(){ rolls++; return 0.999; };
      var s0 = player.step;
      for(var k in keys)delete keys[k]; keys.ArrowUp=true; update(); for(var k in keys)delete keys[k];
      var res = { map: mapIdForRef(activeMap), combat: combat.active, stepDelta: player.step - s0, poolOK: (currentEncounterPool()||[]).length>0 };
      Math.random = _r; return JSON.stringify(res);
    })()`);
    assert.equal(enc.combat, false, 'crossing does not force/duplicate an encounter');
    assert.equal(enc.stepDelta, 1, 'exactly one step increment per frame (housekeeping ran once, not twice)');
    assert.equal(enc.poolOK, true, 'destination encounter pool is active');
    g.run('debugMode = true;');

    // ── 15. Unrelated state unchanged ───────────────────────────────────────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; player.x = 7.5*TILE; player.y = 0.4*TILE;');
    const snap0 = J('JSON.stringify({ day: day, gold: stats.gold, hp: stats.hp, items: stats.items.length, inTown: inTown, inDungeon: inDungeon, inSluice: inSluice, dungeonFloor: dungeonFloor, currentTownId: currentTownId })');
    drive({ ArrowUp: true }, 12);
    const snap1 = J('JSON.stringify({ day: day, gold: stats.gold, hp: stats.hp, items: stats.items.length, inTown: inTown, inDungeon: inDungeon, inSluice: inSluice, dungeonFloor: dungeonFloor, currentTownId: currentTownId })');
    assert.deepEqual(snap0, snap1, 'no location-flag/quest/day/inventory/HP change from a seamless crossing');

    // ── 16. Save/load on both sides; SAVE_VERSION 3; flag not saved ─────────
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP');
    g.run('saveGame();');
    const raw = g.run("localStorage.getItem('verdantVale_save')");
    assert.equal(JSON.parse(raw).version, 3, 'SAVE_VERSION stays 3');
    assert.ok(!/continuousWorldView/i.test(raw), 'debug flag absent from the save payload');
    const sx = g.run('player.x'), sy = g.run('player.y');
    g.run('activeMap = MAP; player.x = 0; player.y = 0; loadGame();');
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP', 'load restores the active map after crossing');
    assert.equal(g.run('player.x'), sx); assert.equal(g.run('player.y'), sy);
    warp('NORTH_BASIN_S_MAP'); g.run('player.x = 5.5*TILE; player.y = 8.5*TILE; saveGame(); activeMap=MAP; loadGame();');
    assert.equal(mapId(), 'NORTH_BASIN_S_MAP', 'load restores NB_S');

    // ── 17. Towns / interiors / meadow bypass the pilot ─────────────────────
    g.run("debugWarpToDestination('town:calwick_south'); continuousWorldViewEnabled = true;");
    assert.equal(g.run('pilotSeamEngaged()'), null, 'town is never pilot-engaged');
    g.run('enterMeadow(); continuousWorldViewEnabled = true;');
    assert.equal(g.run('pilotSeamEngaged()'), null, 'the hidden meadow is not region-placed -> never engaged');
    assert.equal(g.run('pilotSeamMapActive()'), false, 'meadow is not a pilot map');

    // ── 18. Toggle-off near the seam cannot strand the player ───────────────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = true; player.x = 8.5*TILE; player.y = 0.4*TILE;');
    drive({ ArrowUp: true }, 8); // cross to NB_C, footprint still near the seam (deep row 14)
    assert.equal(mapId(), 'NORTH_BASIN_C_MAP');
    g.run('continuousWorldViewEnabled = false;'); // toggle OFF while near the seam
    assert.equal(g.run('pilotSeamEngaged()'), null, 'flag off -> pilot immediately disengaged');
    const escape = drive({ ArrowDown: true }, 30); // must be able to move again (legacy)
    assert.ok(escape.zero < 30, 'toggling Continuous View off near the seam does not strand the player (can still move)');
    assert.ok(mapId() === 'NORTH_BASIN_S_MAP' || mapId() === 'NORTH_BASIN_C_MAP', 'still on a real North Basin map after escaping');

    // ── 19. Flag off on the seam immediately restores legacy inset ──────────
    warp('NORTH_BASIN_S_MAP');
    g.run('continuousWorldViewEnabled = false; combat.cooldown = 0; player.x = 8.5*TILE; player.y = 0.4*TILE;');
    setKeys({ ArrowUp: true }); g.frames(1); clearKeys();
    assert.equal(g.run('player.y'), (ROWS - 2 + 0.5) * TILE, 'flag off -> immediate legacy inset landing again');
    assert.equal(g.run('combat.cooldown'), g.run('ENCOUNTER_COOLDOWN'), 'flag off -> legacy cooldown again');
  },
};
