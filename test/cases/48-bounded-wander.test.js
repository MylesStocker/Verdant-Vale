'use strict';
// Covers: Phase 1 bounded random-wander — Tomas ('tomas', patron sprite) in
// house:esla_house, the only new boundedWander pilot. Reuses the shared NPC
// route engine (movement.js: startNpcRoute/updateNpcRoutes boundedWander branch,
// chooseWanderTarget, wanderPauseFrames, ensureAutoMovers, MOVEMENT_HOMES/
// resetMovementNpc, the generalized patrolNpcTalk interaction and the house-
// furniture extension of npcRouteCanOccupy) and the patron walking renderer
// (render-entities.js drawWalkingPatron). Deliberately focused: it does NOT
// re-verify the whole engine (tests 45/46/47 own scriptedRoute/patrol); it
// checks the wander-specific behaviour and that the shared invariants still
// hold for the new type.
//
// Requirement map: 1 only wanderer, 2 stays in bounds / off exit / valid tile /
// no overlap, 3 orthogonal + pauses, 4 global freezes, 5 live interaction
// (stop/face/dialogue/resume), 6 map-local, 7 lifecycle (exit/re-enter/death/
// save-load) restores home without persisting wander state, 8 patron walk vs
// stationary render.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const T = 32;
const HOME = { x: 8.5 * T, y: 5.5 * T }; // Tomas's authored start (272, 176)
const BOUNDS = { minCol: 4, maxCol: 11, minRow: 2, maxRow: 9 };

function tomas(g) {
  return g.run(`(function(){ var n = SIMPLE_NPCS.find(x => x.id === 'tomas'); return { x: n.x, y: n.y, facing: n.facing }; })()`);
}
function route(g) {
  return g.run(`(function(){ var r = NPC_ROUTES['tomas']; return r ? { type: r.type, hasTarget: r.target != null, frozen: !!r.frozen, pauseLeft: r.pauseLeft } : null; })()`);
}
// Installs a deterministic PRNG so wander decisions are reproducible.
function seedRandom(g, seed) {
  g.run(`(function(){ var s = ${seed} >>> 0; Math.random = function(){ s = (1103515245 * s + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })()`);
}
function dismiss(g) {
  for (let i = 0; i < 12 && g.run('dialogue.open'); i++) g.press(' ');
}

module.exports = {
  name: 'bounded wander: Tomas potters inside Esla\'s house, stays in bounds, stops to talk and resumes, patron walk render',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');
    g.run('debugMode = true;');

    // ── 1. Tomas is the only boundedWander NPC ──────────────────────────────
    assert.equal(
      g.run("JSON.stringify(SIMPLE_NPCS.filter(n => n.movement && n.movement.type === 'boundedWander').map(n => n.id))"),
      JSON.stringify(['tomas']), 'exactly one boundedWander NPC, and it is Tomas');

    g.run("enterHouse('esla_house');");
    assert.equal(g.run('currentMapId()'), 'house:esla_house', 'inside Esla\'s house');
    let p = tomas(g);
    assert.deepEqual({ x: p.x, y: p.y }, HOME, 'starts at his authored position (unchanged)');

    // ── 2+3. Long deterministic run: never leaves bounds / enters the exit /
    //         steps onto furniture / overlaps the player or another solid NPC;
    //         moves only orthogonally, with pauses between short walks ────────
    // Park the player on an in-bounds floor tile, and inject a temporary solid
    // NPC on another, so both collision branches are exercised.
    g.run('player.x = 5.5 * TILE; player.y = 6.5 * TILE;'); // floor tile, in bounds
    g.run(`SIMPLE_NPCS.push({ id: 'zz_probe_solid', name: 'Probe', map: 'house:esla_house', x: 10.5 * TILE, y: 5.5 * TILE, solid: true, facing: 'down', spriteType: 'patron', dialogue: [], flag_required: null, flag_sets: null, action: null });`);
    seedRandom(g, 424242);
    const run = JSON.parse(g.run(`(function(){
      var n = SIMPLE_NPCS.find(x => x.id === 'tomas');
      var probe = SIMPLE_NPCS.find(x => x.id === 'zz_probe_solid');
      var b = ${JSON.stringify(BOUNDS)};
      var oob = 0, onExit = 0, diagonal = 0, moves = 0, pauses = 0;
      var overlapPlayer = false, overlapNpc = false;
      var px = n.x, py = n.y;
      var furnitureHit = false;
      var furn = [[11,2],[5,3],[7,7]]; // hearth, bed, table (HOUSE_DATA esla_house)
      for (var i = 0; i < 8000; i++) {
        update();
        var col = Math.floor(n.x / TILE), row = Math.floor(n.y / TILE);
        if (col < b.minCol || col > b.maxCol || row < b.minRow || row > b.maxRow) oob++;
        if (col === 7 && row === 10) onExit++;
        // settled-on-tile furniture check (centre proximity)
        for (var f = 0; f < furn.length; f++) {
          if (Math.abs(n.x - (furn[f][0] + 0.5) * TILE) < 2 && Math.abs(n.y - (furn[f][1] + 0.5) * TILE) < 2) furnitureHit = true;
        }
        if (Math.abs(n.x - player.x) < 18 && Math.abs(n.y - player.y) < 18) overlapPlayer = true;
        if (Math.abs(n.x - probe.x) < 18 && Math.abs(n.y - probe.y) < 18) overlapNpc = true;
        var moved = (n.x !== px || n.y !== py);
        if (moved) { moves++; if (n.x !== px && n.y !== py) diagonal++; } else pauses++;
        px = n.x; py = n.y;
      }
      return JSON.stringify({ oob: oob, onExit: onExit, diagonal: diagonal, moves: moves, pauses: pauses, overlapPlayer: overlapPlayer, overlapNpc: overlapNpc, furnitureHit: furnitureHit });
    })()`));
    g.run("(function(){ var i = SIMPLE_NPCS.findIndex(n => n.id === 'zz_probe_solid'); if (i >= 0) SIMPLE_NPCS.splice(i, 1); })();");
    assert.equal(run.oob, 0, 'never left the authored bounds');
    assert.equal(run.onExit, 0, 'never stood on the exit/doorway tile (7,10)');
    assert.equal(run.furnitureHit, false, 'never stepped onto hearth/bed/table (live furniture collision)');
    assert.equal(run.overlapPlayer, false, 'never overlapped the player');
    assert.equal(run.overlapNpc, false, 'never overlapped another solid NPC');
    assert.equal(run.diagonal, 0, 'moved only orthogonally (never both axes in one frame)');
    assert.ok(run.moves > 0, 'he did take some short walks');
    assert.ok(run.pauses > run.moves, 'he pauses more than he walks — intermittent, not continuous pacing');

    // ── 4. Global freeze states stop him ────────────────────────────────────
    // Put him mid-step toward a known neighbour, then assert each freeze holds.
    g.run("var n = SIMPLE_NPCS.find(x => x.id === 'tomas'); n.x = 8.5*TILE; n.y = 5.5*TILE; NPC_ROUTES['tomas'].target = { x: 7.5*TILE, y: 5.5*TILE }; NPC_ROUTES['tomas'].pauseLeft = 0; NPC_ROUTES['tomas'].frozen = false;");
    for (const freeze of ['dialogue.open', 'combat.active', 'menu.open', 'choice.open', 'shop.open']) {
      const before = tomas(g);
      g.run(`${freeze} = true;`);
      g.frames(10);
      const after = tomas(g);
      g.run(`${freeze} = false;`);
      assert.deepEqual({ x: after.x, y: after.y }, { x: before.x, y: before.y }, `wander frozen while ${freeze}`);
    }

    // ── 5. Interaction: live position, stop, face player, existing dialogue,
    //       then resume (no restart/teleport) ────────────────────────────────
    g.run('day = 1;'); // deterministic dialogue cycle
    g.run("dialogue.open = false; var n = SIMPLE_NPCS.find(x => x.id === 'tomas'); n.x = 8.5*TILE; n.y = 5.5*TILE; n.facing = 'down'; NPC_ROUTES['tomas'].target = { x: 7.5*TILE, y: 5.5*TILE }; NPC_ROUTES['tomas'].pauseLeft = 0; NPC_ROUTES['tomas'].frozen = false;");
    g.run('player.x = 8.5*TILE + 20; player.y = 5.5*TILE;'); // 20px to his right, within TALK_RADIUS (28)
    g.press(' ');
    assert.equal(g.run('dialogue.open'), true, 'talking to Tomas at his live position opens dialogue');
    assert.equal(g.run('dialogue.name'), 'Tomas', 'his name is unchanged');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /wind out of the southwest/, 'his existing day-1 dialogue, unchanged');
    assert.equal(tomas(g).facing, 'right', 'he turns to face the player (to his right)');
    assert.equal(route(g).frozen, true, 'the wander is frozen for the conversation');
    dismiss(g);
    assert.equal(g.run('dialogue.open'), false, 'dialogue dismissed');
    // Resume: thaws, then wanders again after a short pause (still a live route).
    g.frames(220); // past the resume delay + a fresh pause + a step or two
    let rt = route(g);
    assert.ok(rt && !rt.frozen, 'unfrozen and wandering again after the conversation');

    // ── 8. Patron walk render: frames differ, stationary is pixel-identical ──
    g.run(`window.__origFillRect = ctx.fillRect; window.__rects = [];
           ctx.fillRect = function() { window.__rects.push(Array.prototype.slice.call(arguments).join(',') + '#' + ctx.fillStyle); };`);
    const record = (expr) => g.run(`(function(){ window.__rects = []; ${expr}; return window.__rects.join(';'); })()`);
    g.run("var n = SIMPLE_NPCS.find(x => x.id === 'tomas'); n.x = 8.5*TILE; n.y = 5.5*TILE; n.facing = 'down';");
    g.run('player.x = 4.5*TILE; player.y = 8.5*TILE;'); // far — no SPACE hint contaminating rects
    const stationary   = record("drawGenericNPC(SIMPLE_NPCS.find(n => n.id === 'tomas'))");
    const standingDown = record("drawWalkingPatron(SIMPLE_NPCS.find(n => n.id === 'tomas'), 'down', 0, false)");
    assert.equal(standingDown, stationary, 'standing patron renders exactly like drawGenericPatron');
    const wRight0 = record("drawWalkingPatron(SIMPLE_NPCS.find(n => n.id === 'tomas'), 'right', 0, true)");
    const wRight8 = record("drawWalkingPatron(SIMPLE_NPCS.find(n => n.id === 'tomas'), 'right', 8, true)");
    const wLeft0  = record("drawWalkingPatron(SIMPLE_NPCS.find(n => n.id === 'tomas'), 'left', 0, true)");
    const wUp0    = record("drawWalkingPatron(SIMPLE_NPCS.find(n => n.id === 'tomas'), 'up', 0, true)");
    const wDown0  = record("drawWalkingPatron(SIMPLE_NPCS.find(n => n.id === 'tomas'), 'down', 0, true)");
    assert.notEqual(wRight0, wRight8, 'walk frames differ by step');
    assert.notEqual(wRight0, wLeft0,  'walk frames differ left vs right');
    assert.notEqual(wUp0, wDown0,     'walk frames differ up vs down');
    assert.notEqual(wRight0, stationary, 'a walking frame differs from the stationary render');
    assert.ok(wRight0.includes('#5a3828'), 'keeps the patron vest colour while moving');
    assert.ok(!wRight0.includes('#4a5638') && !wRight0.includes('#3a404e'), 'never the worker or clerk palette');
    // A paused wander (no target) renders identically to having no route.
    g.run("NPC_ROUTES['tomas'].target = null; NPC_ROUTES['tomas'].pauseLeft = 90; NPC_ROUTES['tomas'].frozen = false;");
    const pausedDispatch = record('drawSimpleNPCs()');
    g.run("delete NPC_ROUTES['tomas']; var n = SIMPLE_NPCS.find(x => x.id === 'tomas'); n.x = 8.5*TILE; n.y = 5.5*TILE; n.facing = 'down';");
    const noRouteDispatch = record('drawSimpleNPCs()');
    assert.equal(pausedDispatch, noRouteDispatch, 'a paused wanderer renders identically to no route');
    g.run('ctx.fillRect = window.__origFillRect;');

    // ── 6. He moves only while house:esla_house is active ───────────────────
    g.run('exitBuilding();');
    assert.notEqual(g.run('currentMapId()'), 'house:esla_house', 'left the house');
    assert.equal(g.run("NPC_ROUTES['tomas'] === undefined"), true, 'route cleared on leaving');
    let home = tomas(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 'returned to his authored home on exit');
    g.frames(30); // frames off-map must not move or resurrect him
    assert.equal(g.run("NPC_ROUTES['tomas'] === undefined"), true, 'still no route while off his map');
    home = tomas(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 'still home after off-map frames');
    // Cannot interact with him from another map.
    g.run("dialogue.open = false; dialogue.name = '';");
    g.run('player.x = 8.5*TILE; player.y = 5.5*TILE;'); // stand where he "would" be
    g.press(' ');
    assert.notEqual(g.run('dialogue.name'), 'Tomas', 'cannot talk to Tomas from another map');

    // ── 7a. Re-entry initializes him cleanly at home, then wanders ──────────
    g.run("enterHouse('esla_house');");
    home = tomas(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 're-entry starts him at the authored home');
    g.frames(1);
    assert.ok(route(g), 'wander re-initializes on re-entry');

    // ── 7b. Save/load INSIDE the house: no persisted wander state, home reset ─
    g.frames(300); // wander mid-house
    g.run('saveGame();');
    const saveHasWander = g.run(`(function(){ var raw = localStorage.getItem('verdantVale_save'); return /tomas|boundedWander|NPC_ROUTES|wander|target/i.test(raw); })()`);
    assert.equal(saveHasWander, false, 'no wander/Tomas state written to the save');
    g.run('loadGame();');
    home = tomas(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 'load inside the house re-seats him at home');
    g.frames(1);
    assert.ok(route(g), 'wander runs again after load');

    // ── 7c. Save/load ELSEWHERE never initializes or exposes him ────────────
    g.run('exitBuilding(); saveGame(); loadGame();');
    assert.notEqual(g.run('currentMapId()'), 'house:esla_house', 'loaded outside the house');
    assert.equal(g.run("NPC_ROUTES['tomas'] === undefined"), true, 'no route from loading elsewhere');
    g.frames(10);
    assert.equal(g.run("NPC_ROUTES['tomas'] === undefined"), true, 'and none on later frames off-map');

    // ── 7d. Death/respawn restores a valid home state, no stranded route ────
    g.run("enterHouse('esla_house');");
    g.frames(120);
    assert.ok(route(g), 'wandering before the death');
    g.run(`
      defeatWakeAtHome = true;
      combat.active = true; combat.phase = 'defeat';
      combat.enemy = { name: 'Test Dummy', hp: 10, maxHp: 10, atk: 1, def: 0, spd: 1 };
      stats.hp = 0;
      handleCombatAction();
    `);
    assert.equal(g.run("currentMapId() === 'house:esla_house'"), false, 'no longer in Esla\'s house after respawn');
    assert.equal(g.run("NPC_ROUTES['tomas'] === undefined"), true, 'defeat cleared the wander route');
    home = tomas(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 'Tomas restored to his authored home, not stranded');
    // Re-entry after death still works (clear the "carried home" respawn dialogue,
    // which would otherwise freeze update() and stop the auto-starter).
    g.run('dialogue.open = false;');
    g.run("enterHouse('esla_house');");
    g.frames(1);
    assert.ok(route(g), 'wander works normally after a death/respawn cycle');
    home = tomas(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 'and he starts from home again');
  },
};
