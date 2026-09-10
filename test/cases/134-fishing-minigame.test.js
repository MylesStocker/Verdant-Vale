'use strict';

// Fishing minigame (fishing.js): a real-time timed-prompt (QTE) game gated by a
// per-cast Bait, with difficulty that scales down as rod power rises. This covers
// the scaling, the win/lose paths (correct sequence vs wrong key vs timeout), and
// the rod-progression purchases at the Drenwick dock.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'fishing minigame: rod-scaled QTE, win/miss/timeout, bait cost + provision-store sales',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // ── 1. Difficulty scales with rod power (shorter seq, wider window). ───────
    g.run('startFishing(1)');
    assert.equal(g.run('fishing.seq.length'), 7, 'power 1: 7 prompts');
    assert.equal(g.run('fishing.windowFrames'), 34, 'power 1: tight window');
    g.run('endFishing()');
    g.run('startFishing(2)');
    assert.equal(g.run('fishing.seq.length'), 6, 'power 2: 6 prompts');
    assert.equal(g.run('fishing.windowFrames'), 44, 'power 2: wider window');
    g.run('endFishing()');
    g.run('startFishing(3)');
    assert.equal(g.run('fishing.seq.length'), 5, 'power 3: 5 prompts');
    assert.equal(g.run('fishing.windowFrames'), 54, 'power 3: widest window');
    g.run('endFishing()');

    // ── 2. Completing the whole sequence lands a catch. ───────────────────────
    g.run(`
      stats.items = [];
      var _r = Math.random; Math.random = function(){ return 0.99; };  // seq all SPACE; catch -> Smelt
      try { startFishing(1); for (var i=0;i<fishing.seq.length;i++) handleFishingKey(' '); } finally { Math.random = _r; }
    `);
    assert.equal(g.run('fishing.phase'), 'result', 'success moves to the result phase');
    assert.equal(g.run('fishing.result.win'), true, 'a full sequence is a catch');
    assert.equal(g.run("stats.items.some(i => i.name === 'River Smelt')"), true, 'the catch is granted');
    g.run('endFishing()');

    // ── 3. A wrong key ends the cast — no catch. ──────────────────────────────
    g.run(`
      stats.items = [];
      var _r = Math.random; Math.random = function(){ return 0; };     // seq all LEFT
      try { startFishing(1); handleFishingKey('ArrowRight'); } finally { Math.random = _r; }
    `);
    assert.equal(g.run('fishing.result.win'), false, 'wrong key = it gets away');
    assert.equal(g.run('stats.items.length'), 0, 'a miss grants nothing');
    g.run('endFishing()');

    // ── 4. Running out of time on a prompt is a miss. ─────────────────────────
    g.run(`
      var _r = Math.random; Math.random = function(){ return 0; };
      try { startFishing(1); } finally { Math.random = _r; }
      for (var i=0; i<fishing.windowFrames + 2; i++) updateFishing();
    `);
    assert.equal(g.run('fishing.phase'), 'result', 'timeout resolves the cast');
    assert.equal(g.run('fishing.result.win'), false, 'timeout = it gets away');
    g.run('endFishing()');

    // ── 5. Bait is sold at the Drenwick Provision Store (Oda), not the dock. ──
    g.run(`
      stats.items = [createItem('Old Fishing Rod')]; stats.gold = 100;
      dialogue.open = false; choice.open = false;
      NPC_ACTIONS.odaProvisionShop({ name: 'Oda' });   // open her shop
      dialogue.callbacks[0]();                          // advance to the buy choice
      choice.callbacks[0]();                            // "Buy bait ×5  (30g)"
    `);
    assert.equal(g.run("stats.items.filter(i => i.name === 'Bait').length"), 5, 'the store sells bait in fives');
    assert.equal(g.run('stats.gold'), 70, 'bait ×5 costs 30 gold');

    // ── 6. The dock only lets you cast or leave — no buying, and it still needs
    //      a rod. ──────────────────────────────────────────────────────────────
    g.run(`
      inTown = true; currentTownId = 'drenwick'; activeMap = DRENWICK_WATERFRONT_MAP;
      player.x = DRENWICK_FISHING_SPOT.x; player.y = DRENWICK_FISHING_SPOT.y;
      dialogue.open = false; choice.open = false;
      interactTownOutdoor();
    `);
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(choice.options)')),
      ['Cast line  (1 bait)', 'Leave'], 'the dock only casts or leaves — no purchases');
    // No rod at all: the dock refuses to open a choice.
    g.run(`
      stats.items = stats.items.filter(i => i.type !== 'rod');
      dialogue.open = false; choice.open = false;
      interactTownOutdoor();
    `);
    assert.equal(g.run('choice.open'), false, 'no rod, no fishing');

    assert.equal(g.run('validateGameData().errors'), 0, 'no validation errors');
  },
};
