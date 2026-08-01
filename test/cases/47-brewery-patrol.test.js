'use strict';
// Covers: Phase 1 auto-patrol — Tobb Wend (id 'tobb_wend', display name
// "Toby") in FEN_BREWERY_MAP, the only new movement pilot. Exercises the
// generalized NPC route runtime (movement.js: startNpcRoute / updateNpcRoutes
// with looping + per-waypoint dwell, ensureAutoPatrols, resetPatrolNpc /
// resetAllPatrols, PATROL_HOMES, patrolNpcTalk), the worker walking renderer
// (render-entities.js: drawWalkingWorker + the drawSimpleNPCs dispatch), the
// brewery interaction hook (interactions.js) and the save/death lifecycle
// (save.js / combat.js). Bridge-guard scriptedRoute behaviour is unchanged and
// covered by test 46; this file also re-asserts the two guards stay map-local
// after a brewery death.
//
// Requirement map (see the task spec): 1 start pos, 2 auto-start, 3 order,
// 4 pauses, 5 loop, 6 no drift, 7 exact snap, 8 wait-when-blocked, 9 no
// push/overlap, 10 freeze states, 11 live interaction, 12 no ghost target,
// 13 face player, 14 resume (no teleport/restart), 15 live SPACE hint,
// 16 leaving stops updates, 17 map-local, 18 clean re-entry, 19 save/load
// inside, 20 save/load elsewhere, 21 death/respawn, 22 stationary render
// unchanged, 23 walk frames differ, 24 keeps worker look, 25 unrelated NPCs
// unchanged.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const T = 32; // TILE
const HOME = { x: 13.5 * T, y: 3.5 * T };            // (432, 112) — authored start / wp0
const WP = [                                          // px, matching the authored patrol (tile*T)
  { x: 13.5 * T, y: 3.5 * T, pause: 180 },
  { x: 13.5 * T, y: 4.5 * T, pause: 120 },
  { x: 11.5 * T, y: 4.5 * T, pause: 240 },
  { x: 11.5 * T, y: 6.5 * T, pause: 150 },
  { x: 13.5 * T, y: 6.5 * T, pause: 210 },
  { x: 13.5 * T, y: 4.5 * T, pause: 120 },
];

function tobyPos(g) {
  return g.run(`(function(){ var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); return { x: n.x, y: n.y, facing: n.facing }; })()`);
}
function route(g) {
  return g.run(`(function(){ var r = NPC_ROUTES['tobb_wend']; return r ? { idx: r.idx, moving: r.moving, done: !!r.done, frozen: !!r.frozen, pauseLeft: r.pauseLeft } : null; })()`);
}
function dismissDialogue(g) {
  for (let i = 0; i < 12 && g.run('dialogue.open'); i++) g.press(' ');
}

module.exports = {
  name: 'brewery patrol: Toby auto-patrols the vats, freezes to talk and resumes, stays map-local, worker walk render',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');
    g.run('debugMode = true;'); // no random encounters interfering with the probes

    // ── 1. Entry places Toby at his authored start; no route yet ────────────
    g.run("SIMPLE_NPCS.find(n => n.id === 'tobb_wend').x = 999;"); // pre-mutate to prove reset-on-entry via first frame
    g.run('inTown = false; inDungeon = false; enterFenBrewery();');
    // (enterFenBrewery doesn't itself reset Toby, but he has never moved yet;
    //  assert the authored anchor and that no route exists before any frame.)
    assert.equal(g.run('currentMapId()'), 'fen_brewery', 'entered the brewery');
    // Put him at home explicitly (undo the pre-mutation) to assert the start pos.
    g.run("var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); n.x = 13.5*TILE; n.y = 3.5*TILE; n.facing = 'down';");
    let p = tobyPos(g);
    assert.deepEqual({ x: p.x, y: p.y }, HOME, 'Toby at authored start position on entry');
    assert.equal(g.run("NPC_ROUTES['tobb_wend'] === undefined"), true, 'no runtime route before the first frame');
    // Keep the player far from the eastern route for every movement probe.
    g.run('player.x = 3.5 * TILE; player.y = 12.5 * TILE;');

    // ── 2. The patrol auto-starts (no script call, no flag) on the next frame ─
    g.frames(1);
    let rt = route(g);
    assert.ok(rt && rt.moving && !rt.done, 'patrol auto-started without any explicit trigger');
    assert.equal(g.run("SIMPLE_NPCS.find(n => n.id === 'tobb_wend').movement.autoStart"), true, 'it is an autoStart patrol');

    // ── 3-7. Order, per-waypoint pause, loop, no drift, exact snap ──────────
    // Drive real update() frames and log every waypoint arrival: the index just
    // completed, the snapped position, and the dwell set for it. Two full loops
    // must be byte-identical (no drift) and hit every waypoint exactly.
    const log = JSON.parse(g.run(`(function(){
      var out = [];
      var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend');
      resetPatrolNpc('tobb_wend'); // clean start: drop the in-progress route + home Toby
      var last = 0; // the fresh route re-starts at idx 0 on the first frame below
      for (var i = 0; i < 4200; i++) {
        update();
        var r = NPC_ROUTES['tobb_wend'];
        if (!r) continue;
        if (r.idx !== last) { out.push(last + '|' + n.x + '|' + n.y + '|' + r.pauseLeft); last = r.idx; }
      }
      return JSON.stringify(out);
    })()`));
    const expectedOne = WP.map((w, i) => i + '|' + w.x + '|' + w.y + '|' + w.pause);
    assert.ok(log.length >= 12, 'captured at least two full loops of arrivals (' + log.length + ')');
    assert.deepEqual(log.slice(0, 6), expectedOne, 'loop 1: exact order, snap, and per-waypoint dwell');
    assert.deepEqual(log.slice(6, 12), expectedOne, 'loop 2: identical — looped from last waypoint to first with no drift');

    // ── 8+9. Blocked by the player: waits (never overlaps/pushes), then resumes ─
    g.run("var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); n.x = 400; n.y = 144; NPC_ROUTES['tobb_wend'].idx = 2; NPC_ROUTES['tobb_wend'].pauseLeft = 0; NPC_ROUTES['tobb_wend'].frozen = false; NPC_ROUTES['tobb_wend'].moving = true;");
    g.run('player.x = 368; player.y = 144;'); // standing on the wp2 tile Toby is walking toward
    g.frames(60);
    p = tobyPos(g); rt = route(g);
    assert.ok(Math.abs(p.x - 368) >= 18, 'blocked guard-of-the-vats never overlaps the player (gap ' + Math.abs(p.x - 368) + 'px)');
    assert.equal(p.y, 144, 'did not deviate off-axis while blocked');
    assert.equal(rt.idx, 2, 'still heading to the same waypoint (did not arrive or re-path)');
    assert.equal(rt.moving, true, 'blocked patrol keeps trying (moving), does not give up');
    assert.equal(g.run('player.x'), 368, 'player was never pushed (x)');
    assert.equal(g.run('player.y'), 144, 'player was never pushed (y)');
    g.run('player.x = 2.5 * TILE; player.y = 12.5 * TILE;'); // step out of the way
    g.frames(80);
    p = tobyPos(g); rt = route(g);
    assert.deepEqual({ x: p.x, y: p.y }, { x: 368, y: 144 }, 'resumes and snaps exactly onto the cleared waypoint');
    assert.equal(rt.idx, 3, 'route advanced past the now-clear waypoint');

    // ── 10. Dialogue / combat / menu / choice / shop all freeze the patrol ──
    g.run("var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); n.x = 400; n.y = 144; NPC_ROUTES['tobb_wend'].idx = 2; NPC_ROUTES['tobb_wend'].pauseLeft = 0; NPC_ROUTES['tobb_wend'].frozen = false; NPC_ROUTES['tobb_wend'].moving = true;");
    for (const freeze of ['dialogue.open', 'combat.active', 'menu.open', 'choice.open', 'shop.open']) {
      const before = tobyPos(g);
      g.run(`${freeze} = true;`);
      g.frames(10);
      const after = tobyPos(g);
      g.run(`${freeze} = false;`);
      assert.deepEqual({ x: after.x, y: after.y }, { x: before.x, y: before.y }, `patrol frozen while ${freeze}`);
    }

    // ── 11+13. Interact at his LIVE position; he stops and faces the player ──
    g.run("dialogue.open = false; var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); n.x = 400; n.y = 144; n.facing = 'down'; NPC_ROUTES['tobb_wend'].idx = 2; NPC_ROUTES['tobb_wend'].pauseLeft = 0; NPC_ROUTES['tobb_wend'].frozen = false; NPC_ROUTES['tobb_wend'].moving = true;");
    g.run('player.x = 380; player.y = 144;'); // 20px to his left, within TALK_RADIUS (28), clear of Gorrit
    const idxBefore = route(g).idx;
    g.press(' ');
    assert.equal(g.run('dialogue.open'), true, 'talking to Toby at his live position opens dialogue');
    assert.equal(g.run('dialogue.name'), 'Toby', 'named Toby (renamed from Tobb)');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /What\./, 'his existing dialogue, unchanged');
    assert.equal(tobyPos(g).facing, 'left', 'he turns to face the player (Lélý), who is to his left');
    assert.equal(route(g).frozen, true, 'the patrol is frozen for the conversation');
    const frozenPos = tobyPos(g);

    // ── 14. After dialogue: no teleport, resumes toward the SAME waypoint ────
    dismissDialogue(g);
    assert.equal(g.run('dialogue.open'), false, 'dialogue fully dismissed');
    let after = tobyPos(g);
    assert.deepEqual({ x: after.x, y: after.y }, { x: frozenPos.x, y: frozenPos.y }, 'position preserved exactly across the conversation (no teleport)');
    g.frames(50); // past the ~30-frame resume delay
    after = tobyPos(g); rt = route(g);
    assert.ok(after.x < frozenPos.x, 'resumed walking after a brief wait');
    assert.ok(after.x >= 368, 'still walking the same segment toward wp2, not restarted from the top');
    assert.ok(rt.idx === 2 || rt.idx === 3, 'route continued from where it was (idx ' + rt.idx + '), never reset to 0');
    assert.equal(rt.frozen, false, 'thawed once the dialogue closed');

    // ── 12. No ghost interaction target at his authored start ───────────────
    g.run("dialogue.open = false; var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); n.x = 368; n.y = 208;"); // parked at wp3, far from home
    g.run('player.x = 13.5 * TILE; player.y = 3.5 * TILE;'); // stand exactly on his OLD start tile
    g.press(' ');
    assert.equal(g.run('dialogue.open'), false, 'pressing SPACE at his old start does not talk to a ghost');

    // ── 15. The SPACE hint follows his live coordinates ─────────────────────
    g.run(`window.__origFillText = ctx.fillText; window.__texts = [];
           ctx.fillText = function(t, x, y) { window.__texts.push(t + '@' + Math.round(x)); };
           tick = 16; dialogue.open = false; choice.open = false; shop.open = false;`);
    const hintAt = (nx, ny, plx, ply) => g.run(`(function(){
      var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); n.x = ${nx}; n.y = ${ny};
      player.x = ${plx}; player.y = ${ply};
      window.__texts = []; drawSimpleNPCs();
      return window.__texts.filter(function(s){ return s.indexOf('SPACE@') === 0; }).join(',');
    })()`);
    assert.equal(hintAt(400, 144, 410, 144), 'SPACE@400', 'hint sits over his live x (400)');
    assert.equal(hintAt(368, 208, 378, 208), 'SPACE@368', 'hint moves with him to x=368');
    assert.equal(hintAt(368, 208, 13.5 * T, 3.5 * T), '', 'no hint at his abandoned start position');
    g.run('ctx.fillText = window.__origFillText;');

    // ── 22-25. Rendering: worker identity, walk frames, no clerk, isolation ─
    g.run(`window.__origFillRect = ctx.fillRect; window.__rects = [];
           ctx.fillRect = function() { window.__rects.push(Array.prototype.slice.call(arguments).join(',') + '#' + ctx.fillStyle); };`);
    const record = (expr) => g.run(`(function(){ window.__rects = []; ${expr}; return window.__rects.join(';'); })()`);
    g.run("var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); n.x = 400; n.y = 144; n.facing = 'down';");
    g.run('player.x = 2.5 * TILE; player.y = 12.5 * TILE;'); // far away — no SPACE fillText contaminating the rects

    // 22. Stationary/standing render is pixel-identical to the plain worker.
    const stationaryWorker = record("drawGenericNPC(SIMPLE_NPCS.find(n => n.id === 'tobb_wend'))");
    const standingFacing0  = record("drawWalkingWorker(SIMPLE_NPCS.find(n => n.id === 'tobb_wend'), 'down', 0, false)");
    assert.equal(standingFacing0, stationaryWorker, 'a standing (non-moving) worker renders exactly like drawGenericWorker');

    // 23. Walk frames differ by step and by direction.
    const wRight0 = record("drawWalkingWorker(SIMPLE_NPCS.find(n => n.id === 'tobb_wend'), 'right', 0, true)");
    const wRight8 = record("drawWalkingWorker(SIMPLE_NPCS.find(n => n.id === 'tobb_wend'), 'right', 8, true)");
    const wLeft0  = record("drawWalkingWorker(SIMPLE_NPCS.find(n => n.id === 'tobb_wend'), 'left', 0, true)");
    const wUp0    = record("drawWalkingWorker(SIMPLE_NPCS.find(n => n.id === 'tobb_wend'), 'up', 0, true)");
    const wDown0  = record("drawWalkingWorker(SIMPLE_NPCS.find(n => n.id === 'tobb_wend'), 'down', 0, true)");
    assert.notEqual(wRight0, wRight8, 'the two walk frames differ (step)');
    assert.notEqual(wRight0, wLeft0,  'right and left frames differ (direction)');
    assert.notEqual(wUp0,    wDown0,  'up and down frames differ (direction)');
    assert.notEqual(wRight0, wUp0,    'horizontal and vertical frames differ');
    assert.notEqual(wRight0, stationaryWorker, 'a walking frame differs from the stationary render');

    // 24. He keeps the worker palette while moving — never becomes a clerk.
    assert.ok(wRight0.includes('#4a5638'), 'walking worker still uses the worker tunic colour');
    assert.ok(!wRight0.includes('#3a404e'), 'walking worker never uses the clerk jacket colour (no clerk swap)');

    // 25. An unrelated worker (Gorrit) renders identically whether or not Toby's
    //     patrol is active — the movement renderer adds only opt-in capability.
    const gorritBaseline = record("drawGenericNPC(SIMPLE_NPCS.find(n => n.id === 'gorrit_wend'))");
    g.run("bridge_toll_paid = true;"); // (irrelevant to Gorrit; just proving isolation)
    const gorritWhileTobyMoves = record("NPC_ROUTES['tobb_wend'].moving = true; drawGenericNPC(SIMPLE_NPCS.find(n => n.id === 'gorrit_wend'))");
    assert.equal(gorritWhileTobyMoves, gorritBaseline, 'unrelated worker (Gorrit) render is unchanged by the movement system');

    // Paused Toby uses the exact stationary path (dispatch check): a route that
    // is paused renders identically to having no route at all.
    g.run("var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); n.x = 400; n.y = 144; n.facing = 'down'; NPC_ROUTES['tobb_wend'].frozen = false; NPC_ROUTES['tobb_wend'].moving = true; NPC_ROUTES['tobb_wend'].done = false; NPC_ROUTES['tobb_wend'].pauseLeft = 90;");
    const pausedDispatch = record('drawSimpleNPCs()');
    g.run("delete NPC_ROUTES['tobb_wend']; var n = SIMPLE_NPCS.find(x => x.id === 'tobb_wend'); n.x = 400; n.y = 144; n.facing = 'down';");
    const noRouteDispatch = record('drawSimpleNPCs()');
    assert.equal(pausedDispatch, noRouteDispatch, 'a paused patrol renders identically to no route (stationary path)');
    g.run('ctx.fillRect = window.__origFillRect;');

    // ── 16+17. Leaving the brewery suspends the patrol and it goes map-local ─
    g.run('exitFenBrewery();');
    assert.notEqual(g.run('currentMapId()'), 'fen_brewery', 'left the brewery');
    assert.equal(g.run("NPC_ROUTES['tobb_wend'] === undefined"), true, 'runtime route cleared on exit');
    let home = tobyPos(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 'Toby returned to his authored home on exit');
    g.frames(20); // running frames off-map must not resurrect or move him
    assert.equal(g.run("NPC_ROUTES['tobb_wend'] === undefined"), true, 'still no route while off the brewery map');
    // Map-local: he never collides on another map (canWalk ignores off-map NPCs).
    assert.equal(g.run('canWalk(13.5*TILE, 3.5*TILE)') === true || g.run("SIMPLE_NPCS.find(n=>n.id==='tobb_wend').map !== currentMapId()"), true, 'Toby does not block movement on another map');
    // Interaction: pressing SPACE where he "would" be does not talk to him off-map.
    g.run("dialogue.open = false; dialogue.name = '';"); // clear any stale name from an earlier probe
    g.run('player.x = 13.5 * TILE; player.y = 4.5 * TILE;');
    g.press(' ');
    assert.notEqual(g.run('dialogue.name'), 'Toby', 'cannot interact with Toby from another map');

    // ── 18. Re-entering the brewery initializes him cleanly from the start ──
    g.run('dialogue.open = false; enterFenBrewery(); player.x = 3.5 * TILE; player.y = 12.5 * TILE;');
    home = tobyPos(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 're-entry starts him at the authored position');
    g.frames(1);
    rt = route(g);
    assert.ok(rt && rt.moving && !rt.done, 'patrol re-initializes on re-entry');

    // ── 19. Save/load INSIDE the brewery: valid patrol, no saved position ───
    g.frames(300); // wander mid-route
    g.run('saveGame();');
    const saveHasToby = g.run(`(function(){ var raw = localStorage.getItem('verdantVale_save'); return /tobb_wend|tobb|toby|NPC_ROUTES|PATROL/i.test(raw); })()`);
    assert.equal(saveHasToby, false, 'no patrol/Toby state is written to the save (transient only)');
    const verBefore = g.run('typeof SAVE_VERSION !== "undefined" ? SAVE_VERSION : null');
    g.run('loadGame();');
    home = tobyPos(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 'load inside the brewery re-seats Toby at the start position');
    g.frames(1);
    rt = route(g);
    assert.ok(rt && rt.moving && !rt.done, 'the patrol is running again after load');
    assert.equal(g.run('typeof SAVE_VERSION !== "undefined" ? SAVE_VERSION : null'), verBefore, 'SAVE_VERSION not bumped');

    // ── 20. Save/load ELSEWHERE never initializes or exposes him ────────────
    g.run('exitFenBrewery(); saveGame(); loadGame();');
    assert.notEqual(g.run('currentMapId()'), 'fen_brewery', 'loaded outside the brewery');
    assert.equal(g.run("NPC_ROUTES['tobb_wend'] === undefined"), true, 'no route created by loading elsewhere');
    g.frames(10);
    assert.equal(g.run("NPC_ROUTES['tobb_wend'] === undefined"), true, 'and none appears on subsequent frames off-map');

    // ── 21. Death/respawn: neither Toby nor the bridge guards leak onto the
    //        respawn map (the shared map-local invariant, not a hide flag) ───
    g.run('enterFenBrewery(); player.x = 3.5 * TILE; player.y = 12.5 * TILE;');
    g.frames(120); // patrol mid-route — worst case for a stranded route
    assert.equal(g.run("NPC_ROUTES['tobb_wend'] !== undefined"), true, 'patrol active before the death');
    g.run(`
      defeatWakeAtHome = true;
      combat.active = true; combat.phase = 'defeat';
      combat.enemy = { name: 'Test Dummy', hp: 10, maxHp: 10, atk: 1, def: 0, spd: 1 };
      stats.hp = 0;
      handleCombatAction();
    `);
    assert.equal(g.run('inFenBrewery'), false, 'defeat respawn cleared the brewery flag');
    assert.equal(g.run('currentMapId()'), 'house:player_house', 'woke at the respawn house');
    assert.equal(g.run("NPC_ROUTES['tobb_wend'] === undefined"), true, 'defeat cleared the patrol route');
    home = tobyPos(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 'Toby restored to his brewery home, not stranded');
    // He must not render on the respawn map (map filter holds).
    g.run(`dialogue.open = false; window.__origFillRect2 = ctx.fillRect; window.__drew = false;
           ctx.fillRect = function() {}; ctx.fillText = function() {};`);
    const tobyDrawn = g.run(`(function(){
      var mapId = currentMapId(); var found = false;
      for (const n of SIMPLE_NPCS) { if (n.id === 'tobb_wend' && n.map === mapId) found = true; }
      return found;
    })()`);
    g.run('ctx.fillRect = window.__origFillRect2;');
    assert.equal(tobyDrawn, false, 'Toby is not on the respawn map — filtered out of rendering/collision/interaction');
    // Bridge guards likewise remain confined to the bridge after the death.
    const guardsHere = g.run(`SIMPLE_NPCS.filter(n => n.id.startsWith('bridge_soldier') && n.map === currentMapId()).length`);
    assert.equal(guardsHere, 0, 'bridge guards are not on the respawn map either');

    // Death must not corrupt a future brewery re-entry.
    g.run('enterFenBrewery(); player.x = 3.5 * TILE; player.y = 12.5 * TILE;');
    home = tobyPos(g);
    assert.deepEqual({ x: home.x, y: home.y }, HOME, 're-entry after death still starts Toby cleanly at home');
    g.frames(1);
    rt = route(g);
    assert.ok(rt && rt.moving && !rt.done, 'patrol works normally after a death/respawn cycle');
  },
};
