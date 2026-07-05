'use strict';
// Covers: a full save/load round-trip through localStorage (save.js).
//
// Simplification: saveGame()/loadGame() are normally invoked from the pause
// menu's save/load confirm screens (input.js); menu navigation itself is
// covered by 03-menu-debug-menu.test.js. This test calls saveGame()/
// loadGame() directly so it's exercising the serialization round-trip
// itself, independent of which menu cursor position happens to map to
// "Save Game" today.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'save/load: state written to localStorage round-trips back exactly',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── Set distinguishing state, then save ─────────────────────────────────
    g.run(`
      stats.gold = 777;
      stats.xp   = 555;
      day        = 5;
      MainQuest  = 3;
      activeMap  = MAP2;
      inTown     = false;
      townBuilding = null;
      player.x = 4.5 * TILE;
      player.y = 6.5 * TILE;
      player.facing = 'left';
    `);
    g.run('saveGame()');

    const raw = g.run("localStorage.getItem('verdantVale_save')");
    assert.ok(raw, 'saveGame() should have written something to localStorage');
    const saved = JSON.parse(raw);
    assert.equal(saved.stats.gold, 777);
    assert.equal(saved.stats.xp, 555);
    assert.equal(saved.day, 5);
    assert.equal(saved.MainQuest, 3);

    // ── Mutate everything away from the saved values ────────────────────────
    g.run(`
      stats.gold = 1;
      stats.xp   = 1;
      day        = 1;
      MainQuest  = 0;
      activeMap  = MAP;
      player.x = 0;
      player.y = 0;
      player.facing = 'down';
    `);
    assert.equal(g.run('stats.gold'), 1, 'sanity: mutation applied before load');

    // ── Load should restore the saved values, not the mutated ones ──────────
    const ok = g.run('loadGame()');
    assert.equal(ok, true, 'loadGame() should report success when a valid save exists');

    assert.equal(g.run('stats.gold'), 777);
    assert.equal(g.run('stats.xp'), 555);
    assert.equal(g.run('day'), 5);
    assert.equal(g.run('MainQuest'), 3);
    assert.equal(g.run('activeMap === MAP2'), true, 'activeMap should be restored via MAP_REGISTRY id lookup');
    assert.equal(g.run('player.x'), 4.5 * 32);
    assert.equal(g.run('player.y'), 6.5 * 32);
    assert.equal(g.run('player.facing'), 'left');

    // ── loadGame() with no save present should fail cleanly, not throw ──────
    g.run("localStorage.removeItem('verdantVale_save')");
    const okEmpty = g.run('loadGame()');
    assert.equal(okEmpty, false, 'loadGame() should return false when there is no save');

    g.renderFrame();
  },
};
