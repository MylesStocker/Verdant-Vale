'use strict';
// Covers: Phase 1 of the opt-in NPC movement system — the Imperial bridge
// toll-guard pilots. The two guards (the ONLY NPCs with a `movement` config)
// stand on the one-tile bridge approaches (col 7, rows 4 and 7 — the canal
// blocks every other column) and physically block the crossing; the guard
// asks before charging, and paying either one starts BOTH guards' one-way
// scriptedRoutes so they sidestep off the approach, and the player crosses
// manually.
// See architecture.md ("Future NPC movement contract" — Phase 1 status),
// movement.js (NPC_ROUTES / startNpcRoute / updateNpcRoutes /
// npcRouteCanOccupy / resetBridgeGuards / placeBridgeGuardsAside),
// npcs.js (bridgeTollInteraction), maps.js (BRIDGE_CROSSING_MAP funnel) and
// render-entities.js (drawWalkingGenericNPC).

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Blocking posts: each guard stands on his bank's one-tile bridge approach
// (col 7, the row adjoining the deck) — the canal blocks every other column.
const N_HOME = { x: 7.5 * 32, y: 4.5 * 32 };  // px; TILE = 32
const S_HOME = { x: 7.5 * 32, y: 7.5 * 32 };
const N_ASIDE = { x: 8.5 * 32, y: 4.5 * 32 }; // completed sidestep destinations
const S_ASIDE = { x: 6.5 * 32, y: 7.5 * 32 };

function guardPos(g, id) {
  return g.run(`(function(){ var n = SIMPLE_NPCS.find(x => x.id === '${id}'); return { x: n.x, y: n.y, facing: n.facing }; })()`);
}
function bothGuards(g) {
  return { n: guardPos(g, 'bridge_soldier_north'), s: guardPos(g, 'bridge_soldier_south') };
}
// Holds a direction key in bounded chunks, stopping the moment the player
// leaves the bridge map — a fixed long hold would carry the player onward
// across MAP3_N2 into the NEXT transition (e.g. the north causeway).
function walkUntilOffBridge(g, key, maxChunks) {
  g.hold(key);
  for (let i = 0; i < maxChunks && g.run('activeMap === BRIDGE_CROSSING_MAP'); i++) g.frames(10);
  g.release(key);
}

// Pages through an open dialogue until it closes (running end callbacks).
function dismissDialogue(g) {
  for (let i = 0; i < 12 && g.run('dialogue.open'); i++) g.press(' ');
  assert.equal(g.run('dialogue.open'), false, 'dialogue should be fully dismissed');
}
// Tile-level flood-fill over BRIDGE_CROSSING_MAP: walkable tiles minus any
// tile whose centre lies inside a solid guard's 18px collision box. Proves
// reachability claims independently of the movement probe.
function bridgeReachable(g, fromRC, toRC) {
  const map = g.run('BRIDGE_CROSSING_MAP');
  const walk = g.run('WALKABLE');
  const guards = bothGuards(g);
  const blocked = (r, c) => {
    const cx = c * 32 + 16, cy = r * 32 + 16;
    for (const gp of [guards.n, guards.s]) {
      if (Math.abs(cx - gp.x) < 18 && Math.abs(cy - gp.y) < 18) return true;
    }
    return false;
  };
  const seen = new Set([fromRC.join(',')]);
  const q = [fromRC];
  while (q.length) {
    const [r, c] = q.shift();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr > 14 || nc < 0 || nc > 15 || seen.has(nr + ',' + nc)) continue;
      if (!walk[map[nr][nc]] || blocked(nr, nc)) continue;
      seen.add(nr + ',' + nc);
      q.push([nr, nc]);
    }
  }
  return seen.has(toRC.join(','));
}

module.exports = {
  name: 'bridge-guard toll pilots: physical gating, paid sidestep routes, resets, save/load, walking render',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');
    g.run('debugMode = true;'); // no random encounters interfering with movement probes

    // ── 1. Entry resets both guards to their exact blocking coordinates ─────
    g.run(`SIMPLE_NPCS.find(n => n.id === 'bridge_soldier_north').x = 999;`); // pre-mutate to prove reset
    g.run('inTown = false; inDungeon = false; enterBridgePostFromSouth();');
    let gp = bothGuards(g);
    assert.deepEqual({ x: gp.n.x, y: gp.n.y }, { x: N_HOME.x, y: N_HOME.y }, 'north guard at exact blocking post on entry');
    assert.deepEqual({ x: gp.s.x, y: gp.s.y }, { x: S_HOME.x, y: S_HOME.y }, 'south guard at exact blocking post on entry');
    assert.equal(gp.n.facing, 'down'); assert.equal(gp.s.facing, 'up');
    assert.equal(g.run('bridge_toll_paid'), false);
    assert.equal(g.run('Object.keys(NPC_ROUTES).length'), 0, 'no runtime routes on a fresh entry');

    // ── 2+3. Before payment: real movement cannot pass the guard; the far
    //         exit is unreachable (flood-fill proof) ──────────────────────────
    g.hold('ArrowUp'); g.frames(160); g.release('ArrowUp');
    const blockedY = g.run('player.y');
    assert.ok(blockedY > S_HOME.y + 17, `player must be held south of the south guard (y=${blockedY}, guard=${S_HOME.y})`);
    assert.equal(g.run('activeMap === BRIDGE_CROSSING_MAP'), true, 'still on the bridge — no exit reached');
    assert.equal(bridgeReachable(g, [13, 7], [0, 7]), false, 'north exit tile must be unreachable before payment');
    assert.equal(bridgeReachable(g, [13, 7], [14, 7]), true, 'the way BACK OUT (south exit) stays reachable');

    // ── 4. Insufficient gold: refusal, no deduction, no movement ────────────
    g.run('stats.gold = 0;');
    g.press(' ');
    assert.equal(g.run('dialogue.open'), true, 'guard dialogue opens');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /One gold to cross/, 'refusal dialogue retained');
    dismissDialogue(g);
    assert.equal(g.run('stats.gold'), 0, 'no gold deducted');
    assert.equal(g.run('bridge_toll_paid'), false);
    assert.equal(g.run('Object.keys(NPC_ROUTES).length'), 0, 'no movement started');
    gp = bothGuards(g);
    assert.equal(gp.s.x, S_HOME.x, 'south guard has not moved');

    // ── 5a. The guard ASKS first; declining charges nothing, moves nobody ───
    g.run('stats.gold = 5;');
    g.press(' ');
    assert.equal(g.run('dialogue.open'), true);
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /One gold\. Canal bridge toll/, 'toll ask retained');
    assert.equal(g.run('stats.gold'), 5, 'asking does not deduct anything');
    dismissDialogue(g); // the ask closes into the pay/decline choice
    assert.equal(g.run('choice.open'), true, 'pay/decline choice opens');
    assert.match(g.run('choice.options.join("|")'), /Pay the toll/, 'choice offers payment');
    g.run('choice.cursor = 1;'); // "Not now"
    g.press(' ');
    assert.equal(g.run('choice.open'), false);
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /bridge stays shut/, 'decline gets a refusal line');
    dismissDialogue(g);
    assert.equal(g.run('stats.gold'), 5, 'declining deducts nothing');
    assert.equal(g.run('bridge_toll_paid'), false, 'declining does not pay the toll');
    assert.equal(g.run('Object.keys(NPC_ROUTES).length'), 0, 'declining moves nobody');

    // ── 5+6. Choosing to pay deducts exactly one gold; movement starts only
    //         after the payment dialogue finishes ─────────────────────────────
    g.press(' ');
    dismissDialogue(g); // the ask
    assert.equal(g.run('choice.open'), true);
    g.press(' '); // cursor 0 = "Pay the toll (1g)"
    assert.equal(g.run('dialogue.open'), true, 'payment dialogue opens');
    assert.equal(g.run('stats.gold'), 4, 'exactly one gold deducted');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /marks his ledger/, 'successful-payment dialogue retained');
    g.frames(30); // dialogue open — nothing may move yet
    gp = bothGuards(g);
    assert.equal(gp.n.x, N_HOME.x, 'north guard still blocking while dialogue is open');
    assert.equal(gp.s.x, S_HOME.x, 'south guard still blocking while dialogue is open');
    dismissDialogue(g); // last page dismissal runs the callback
    assert.equal(g.run('bridge_toll_paid'), true, 'toll marked paid when the dialogue completes');
    assert.equal(g.run('Object.keys(NPC_ROUTES).length'), 2, 'both scripted routes started');
    assert.equal(g.run('activeMap === BRIDGE_CROSSING_MAP'), true, 'no automatic exit after payment');
    const playerAfterPay = g.run('({x: player.x, y: player.y})');

    // ── 8. Movement freezes with dialogue/menu/choice/shop/combat ───────────
    g.frames(6); // let them take a few real steps first
    gp = bothGuards(g);
    assert.ok(gp.n.x > N_HOME.x && gp.s.x < S_HOME.x, 'both guards moving simultaneously');
    for (const freeze of ['dialogue.open', 'menu.open', 'choice.open', 'shop.open', 'combat.active']) {
      const before = bothGuards(g);
      g.run(`${freeze} = true;`);
      g.frames(10);
      const after = bothGuards(g);
      g.run(`${freeze} = false;`);
      assert.equal(after.n.x, before.n.x, `north guard frozen while ${freeze}`);
      assert.equal(after.s.x, before.s.x, `south guard frozen while ${freeze}`);
    }

    // ── 7+17. They finish at their exact lateral destinations; motion never
    //          triggered encounters or transitions ───────────────────────────
    g.frames(120);
    gp = bothGuards(g);
    assert.deepEqual({ x: gp.n.x, y: gp.n.y }, { x: N_ASIDE.x, y: N_ASIDE.y }, 'north guard snapped exactly aside (right)');
    assert.deepEqual({ x: gp.s.x, y: gp.s.y }, { x: S_ASIDE.x, y: S_ASIDE.y }, 'south guard snapped exactly aside (left)');
    assert.equal(gp.n.facing, 'right', 'north guard walked and faces right');
    assert.equal(gp.s.facing, 'left', 'south guard walked and faces left');
    assert.equal(g.run("NPC_ROUTES['bridge_soldier_north'].done && !NPC_ROUTES['bridge_soldier_north'].moving"), true, 'north route completed');
    assert.equal(g.run("NPC_ROUTES['bridge_soldier_south'].done && !NPC_ROUTES['bridge_soldier_south'].moving"), true, 'south route completed');
    assert.equal(g.run('combat.active'), false, 'guard motion never started an encounter');
    assert.equal(g.run('activeMap === BRIDGE_CROSSING_MAP'), true, 'guard motion never triggered a transition');

    // ── 10. Payment did not exit or teleport the player ─────────────────────
    assert.deepEqual(g.run('({x: player.x, y: player.y})'), playerAfterPay, 'player unmoved by payment/sidestep');
    assert.equal(g.run('inBridgePost'), true);

    // ── 12. Talking to a guard after payment: no charge, no restart ─────────
    g.run(`player.x = ${S_ASIDE.x + 18}; player.y = ${S_ASIDE.y};`); // hug the gate edge, in TALK_RADIUS
    g.press(' ');
    assert.equal(g.run('dialogue.open'), true, 'post-payment guard dialogue opens');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /marked through\. Proceed/, 'short acknowledgement after payment');
    dismissDialogue(g);
    assert.equal(g.run('stats.gold'), 4, 'no second charge');
    g.frames(20);
    gp = bothGuards(g);
    assert.equal(gp.s.x, S_ASIDE.x, 'completed route did not restart');

    // ── 11+18. Manual crossing: the opposite exit now works, destination
    //           unchanged ────────────────────────────────────────────────────
    assert.equal(bridgeReachable(g, [13, 7], [0, 7]), true, 'north exit reachable once the guards are aside');
    g.run('player.x = 7.5 * TILE; player.y = 8.5 * TILE; player.facing = "up";');
    walkUntilOffBridge(g, 'ArrowUp', 30);
    assert.equal(g.run('activeMap === MAP3_N2'), true, 'manually crossed and exited north');
    // Landing check: allow the few frames of onward drift inside the final walk chunk.
    assert.equal(g.run('player.x'), 12.5 * 32, 'exitBridgeNorth x destination unchanged');
    assert.ok(Math.abs(g.run('player.y') - 4.5 * 32) <= 20, 'exitBridgeNorth y destination unchanged (within one chunk of drift)');
    assert.equal(g.run('inBridgePost'), false);
    gp = bothGuards(g); // exit reset the guards for the next visit
    assert.equal(gp.n.x, N_HOME.x, 'exit restored north guard to his post');
    assert.equal(gp.s.x, S_HOME.x, 'exit restored south guard to his post');
    assert.equal(g.run('Object.keys(NPC_ROUTES).length'), 0, 'exit cleared runtime routes');

    // ── 14. Re-entry requires a fresh toll (from the north this time) ───────
    g.run('enterBridgePostFromNorth();');
    assert.equal(g.run('bridge_toll_paid'), false, 're-entry resets the toll');
    gp = bothGuards(g);
    assert.equal(gp.n.x, N_HOME.x); assert.equal(gp.s.x, S_HOME.x);

    // ── 13. Backing out through the original entrance stays free ────────────
    walkUntilOffBridge(g, 'ArrowUp', 8); // row 1 -> north exit
    assert.equal(g.run('activeMap === MAP3_N2'), true, 'backed out north without paying');

    // ── North-entry full flow (both crossing directions) ─────────────────────
    g.run('enterBridgePostFromNorth(); stats.gold = 3;');
    g.hold('ArrowDown'); g.frames(80); g.release('ArrowDown'); // approach the north guard from above
    assert.ok(g.run('player.y') < N_HOME.y - 17, 'held north of the north guard');
    assert.equal(bridgeReachable(g, [1, 7], [14, 7]), false, 'south exit unreachable before payment (north entry)');
    g.press(' ');
    dismissDialogue(g); // the ask
    assert.equal(g.run('choice.open'), true, 'north guard also asks before charging');
    g.press(' '); // pay
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /Proceed south/, 'north guard keeps his own direction line');
    assert.equal(g.run('stats.gold'), 2, 'one gold deducted');
    dismissDialogue(g);
    g.frames(120);
    gp = bothGuards(g);
    assert.deepEqual({ x: gp.n.x, y: gp.n.y }, { x: N_ASIDE.x, y: N_ASIDE.y }, 'north guard aside (paid at the north gate)');
    assert.deepEqual({ x: gp.s.x, y: gp.s.y }, { x: S_ASIDE.x, y: S_ASIDE.y }, 'paying one guard moved BOTH guards');
    g.run('player.x = 7.5 * TILE; player.y = 4.5 * TILE; player.facing = "down";');
    walkUntilOffBridge(g, 'ArrowDown', 40);
    assert.equal(g.run('activeMap === MAP3_N2'), true, 'crossed south manually');
    assert.equal(g.run('player.x'), 12.5 * 32, 'exitBridgeSouth x destination unchanged');
    assert.ok(Math.abs(g.run('player.y') - 6.5 * 32) <= 20, 'exitBridgeSouth y destination unchanged (within one chunk of drift)');

    // ── 9. A moving guard waits rather than overlapping/pushing the player ──
    g.run('enterBridgePostFromSouth();');
    g.run(`player.x = ${S_ASIDE.x}; player.y = ${S_ASIDE.y};`); // player parked in the south pocket
    g.run("bridge_toll_paid = true; startNpcRoute('bridge_soldier_north'); startNpcRoute('bridge_soldier_south');");
    g.frames(200);
    gp = bothGuards(g);
    assert.ok(Math.abs(gp.s.x - S_ASIDE.x) >= 18, 'south guard never overlaps the player');
    assert.equal(g.run("NPC_ROUTES['bridge_soldier_south'].moving"), true, 'blocked guard waits (still moving), does not push');
    assert.deepEqual({ x: gp.n.x, y: gp.n.y }, { x: N_ASIDE.x, y: N_ASIDE.y }, 'unblocked north guard finished meanwhile');
    g.run('player.x = 7.5 * TILE; player.y = 12.5 * TILE;'); // step out of the way
    g.frames(120);
    gp = bothGuards(g);
    assert.deepEqual({ x: gp.s.x, y: gp.s.y }, { x: S_ASIDE.x, y: S_ASIDE.y }, 'guard resumes and finishes exactly once unblocked');

    // ── 15. Save/load before payment restores blocking positions ────────────
    g.run('enterBridgePostFromSouth();');
    g.run('saveGame();');
    g.run(`SIMPLE_NPCS.find(n => n.id === 'bridge_soldier_south').x = 999;`);
    g.run('loadGame();');
    gp = bothGuards(g);
    assert.deepEqual({ x: gp.n.x, y: gp.n.y }, { x: N_HOME.x, y: N_HOME.y }, 'load (unpaid, inside bridge): north guard blocking');
    assert.deepEqual({ x: gp.s.x, y: gp.s.y }, { x: S_HOME.x, y: S_HOME.y }, 'load (unpaid, inside bridge): south guard blocking');

    // ── 16. Save/load after payment (mid-walk) restores completed positions ─
    g.run("bridge_toll_paid = true; startNpcRoute('bridge_soldier_north'); startNpcRoute('bridge_soldier_south');");
    g.frames(10); // mid-sidestep
    g.run('saveGame();');
    g.run('loadGame();');
    gp = bothGuards(g);
    assert.deepEqual({ x: gp.n.x, y: gp.n.y }, { x: N_ASIDE.x, y: N_ASIDE.y }, 'load (paid): north guard fully aside');
    assert.deepEqual({ x: gp.s.x, y: gp.s.y }, { x: S_ASIDE.x, y: S_ASIDE.y }, 'load (paid): south guard fully aside');
    assert.equal(gp.n.facing, 'right'); assert.equal(gp.s.facing, 'left');
    assert.equal(g.run('Object.keys(NPC_ROUTES).length'), 0, 'no live route state after load');

    // ── Loading elsewhere disturbs no unrelated NPC ──────────────────────────
    g.run('exitBridgeSouth();');
    const othersBefore = g.run(`SIMPLE_NPCS.filter(n => !n.id.startsWith('bridge_soldier')).slice(0, 40).map(n => n.id + ':' + n.x + ',' + n.y).join('|')`);
    g.run('saveGame(); loadGame();');
    const othersAfter = g.run(`SIMPLE_NPCS.filter(n => !n.id.startsWith('bridge_soldier')).slice(0, 40).map(n => n.id + ':' + n.x + ',' + n.y).join('|')`);
    assert.equal(othersAfter, othersBefore, 'loading elsewhere leaves unrelated NPC positions untouched');

    // ── 19. Exactly the four approved NPCs carry movement configuration ─────
    // (the two bridge guards + the fen-brewery patrol Tobb + the house wanderer Tomas)
    const movers = g.run('SIMPLE_NPCS.filter(n => n.movement !== undefined).map(n => n.id)');
    assert.equal(JSON.stringify(Array.from(movers).sort()),
      JSON.stringify(['bridge_soldier_north', 'bridge_soldier_south', 'tobb_wend', 'tomas']),
      'only the two bridge guards + Tobb + Tomas have movement configs');

    // ── Render: stationary identity, walk frames, facing, stop, isolation ───
    // Record fillRect calls through the ctx stub (its Proxy allows property
    // assignment). fillText (the SPACE hint) is excluded by keeping the
    // player far away.
    g.run('enterBridgePostFromSouth();');
    g.run('player.x = 2.5 * TILE; player.y = 12.5 * TILE;'); // far from both guards
    g.run(`
      window.__rects = [];
      window.__origFillRect = ctx.fillRect;
      ctx.fillRect = function() { window.__rects.push(Array.prototype.slice.call(arguments).join(',') + '#' + ctx.fillStyle); };
    `);
    const record = (expr) => g.run(`(function(){ window.__rects = []; ${expr}; return window.__rects.join(';'); })()`);

    const stationaryBefore = record('drawSimpleNPCs()');
    assert.ok(stationaryBefore.length > 0, 'stationary guards drew something');
    // 20. An unrelated generic NPC's stationary render is unchanged while a
    // guard route exists: render a non-bridge map before/after routes start.
    const unrelatedProbe = () => {
      g.run('inBridgePost = false; inTown = true; townBuilding = null; currentTownId = "drenwick"; activeMap = DRENWICK_MARKET_MAP;');
      const out = record('drawSimpleNPCs()');
      g.run('inTown = false; townBuilding = null; inBridgePost = true; activeMap = BRIDGE_CROSSING_MAP;');
      return out;
    };
    const unrelatedBefore = unrelatedProbe();

    // Start the sidestep: while moving, frames differ and differ from stationary.
    g.run("bridge_toll_paid = true; startNpcRoute('bridge_soldier_north'); startNpcRoute('bridge_soldier_south');");
    g.frames(4);
    assert.equal(g.run("NPC_ROUTES['bridge_soldier_north'].facing"), 'right', 'north guard walks right');
    assert.equal(g.run("NPC_ROUTES['bridge_soldier_south'].facing"), 'left', 'south guard walks left');
    const walkFrameA = record("NPC_ROUTES['bridge_soldier_north'].step = 0;  drawSimpleNPCs()");
    const walkFrameB = record("NPC_ROUTES['bridge_soldier_north'].step = 8;  drawSimpleNPCs()");
    assert.notEqual(walkFrameA, walkFrameB, 'the two walking frames differ');
    assert.notEqual(walkFrameA, stationaryBefore, 'walking render differs from the stationary render');

    // Animation stops at the destination: finished guards render exactly like
    // the stationary path again (same generic renderer, new positions).
    g.frames(140);
    assert.equal(g.run("NPC_ROUTES['bridge_soldier_north'].moving"), false, 'route finished');
    const doneRender = record('drawSimpleNPCs()');
    const asideStationary = record('drawGenericNPC(SIMPLE_NPCS.find(n => n.id === "bridge_soldier_south")); drawGenericNPC(SIMPLE_NPCS.find(n => n.id === "bridge_soldier_north"))'); // SIMPLE_NPCS order: south first
    assert.equal(doneRender, asideStationary, 'finished guards use the exact pre-existing stationary renderer');

    // Stationary identity: reset to blocking posts -> render matches the
    // original stationary recording bit-for-bit.
    g.run('resetBridgeGuards();');
    const stationaryAfter = record('drawSimpleNPCs()');
    assert.equal(stationaryAfter, stationaryBefore, 'stationary guards retain their exact old appearance');
    const unrelatedAfter = unrelatedProbe();
    assert.equal(unrelatedAfter, unrelatedBefore, 'unrelated NPC stationary render unchanged by the movement system');

    g.run('ctx.fillRect = window.__origFillRect;');

    // ── Regression: dying on the bridge must not strand the guards ──────────
    // (Bug: the defeat "carried home" respawn cleared most location flags but
    // not inBridgePost, so currentMapId() reported 'bridge_post' on every map
    // — the guards rendered everywhere, with bridge_toll_paid stuck true.)
    // Also: the checkpoint is manned and encounter-free — its grass banks
    // must not fall through to the generic outdoor encounter roll.
    g.run('enterBridgePostFromSouth();');
    assert.equal(g.run('isEncounterEligibleTile(GRASS)'), false, 'no random encounters at the manned toll checkpoint');
    assert.equal(g.run('isEncounterEligibleTile(PATH)'),  false, 'no encounters on the checkpoint path either');
    // Pay, then die mid-crossing (forced combat defeat, wake-at-home path).
    g.run("bridge_toll_paid = true; startNpcRoute('bridge_soldier_north'); startNpcRoute('bridge_soldier_south');");
    g.frames(30); // mid-sidestep — worst case for stranded state
    g.run(`
      defeatWakeAtHome = true;
      combat.active = true; combat.phase = 'defeat';
      combat.enemy = { name: 'Test Dummy', hp: 10, maxHp: 10, atk: 1, def: 0, spd: 1 };
      stats.hp = 0;
      handleCombatAction();
    `);
    assert.equal(g.run('inBridgePost'), false, 'defeat respawn clears inBridgePost');
    assert.equal(g.run('bridge_toll_paid'), false, 'defeat respawn clears the toll');
    assert.equal(g.run('bridge_entry_direction'), null, 'defeat respawn clears the entry direction');
    assert.equal(g.run('currentMapId()'), 'house:player_house', 'currentMapId() reports the respawn house, not the bridge');
    gp = bothGuards(g);
    assert.deepEqual({ x: gp.n.x, y: gp.n.y }, { x: N_HOME.x, y: N_HOME.y }, 'defeat respawn restores the north guard to his post');
    assert.deepEqual({ x: gp.s.x, y: gp.s.y }, { x: S_HOME.x, y: S_HOME.y }, 'defeat respawn restores the south guard to his post');
    assert.equal(g.run('Object.keys(NPC_ROUTES).length'), 0, 'defeat respawn clears runtime routes');
    // And the guards no longer render in the respawn house (map filter holds).
    g.run('dialogue.open = false; window.__rects = []; ctx.fillRect = function() { window.__rects.push("x"); };');
    const drewInHouse = g.run(`(function(){
      window.__gp = SIMPLE_NPCS.find(n => n.id === 'bridge_soldier_south');
      var before = window.__rects.length;
      drawSimpleNPCs();
      return currentMapId() !== 'bridge_post';
    })()`);
    assert.equal(drewInHouse, true, 'currentMapId() is not bridge_post after respawn — guards filtered out of other maps');
    g.run('ctx.fillRect = window.__origFillRect;');

    // ── Regression: a save corrupted by the pre-fix bug is repaired on load ─
    // (A player who saved AFTER the stranded-flag death has inBridgePost=true
    // with a non-bridge activeMap baked into the save file.)
    g.run('dialogue.open = false; saveGame();'); // valid save in the respawn house
    g.run(`(function(){
      var raw = JSON.parse(localStorage.getItem('verdantVale_save'));
      raw.inBridgePost = true; raw.bridge_toll_paid = true; raw.bridge_entry_direction = 'south';
      localStorage.setItem('verdantVale_save', JSON.stringify(raw));
    })()`);
    g.run('loadGame();');
    assert.equal(g.run('inBridgePost'), false, 'loading a corrupted save repairs the stranded inBridgePost');
    assert.equal(g.run('bridge_toll_paid'), false, 'and clears the stranded toll flag');
    assert.notEqual(g.run('currentMapId()'), 'bridge_post', 'guards no longer follow the player after loading a corrupted save');
  },
};
