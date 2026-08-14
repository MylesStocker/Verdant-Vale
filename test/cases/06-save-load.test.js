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
      resetLocationState();   // clean location slate (boot starts in a house)
      activeMap  = MAP2;
      inTown     = false;
      townBuilding = null;
      player.x = 4.5 * TILE;
      player.y = 6.5 * TILE;
      player.facing = 'left';
      __reconcileCanonicalForTest();   // fixture bypassed the gateway; sync canonical (regional MAP2)
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

    // ── vale_tutorial_seen restores through loadGame() (window-native flag) ──
    // Regression: the flag is saved by saveGame() and normalized by
    // syncQuestFlagsToWindow(), but loadGame() never restored it. An older save
    // lacking the field must default to false rather than inherit the current
    // runtime session's value.
    // 1. A saved `true` loads as true even after the runtime value is reset.
    g.run('window.vale_tutorial_seen = true; saveGame();');
    g.run('window.vale_tutorial_seen = false;');
    g.run('loadGame();');
    assert.equal(g.run('window.vale_tutorial_seen === true'), true, 'saved vale_tutorial_seen: true must load as true');
    // 2. An explicit `false` is preserved across a round-trip.
    g.run('window.vale_tutorial_seen = false; saveGame();');
    g.run('window.vale_tutorial_seen = true;');
    g.run('loadGame();');
    assert.equal(g.run('window.vale_tutorial_seen === false'), true, 'saved vale_tutorial_seen: false must load as false');
    // 3. A save that lacks the field defaults it to false — even when the
    //    in-memory value was true before loading (older-save compatibility).
    g.run(`(function(){
      var raw = JSON.parse(localStorage.getItem('verdantVale_save'));
      delete raw.vale_tutorial_seen;
      localStorage.setItem('verdantVale_save', JSON.stringify(raw));
    })();`);
    g.run('window.vale_tutorial_seen = true;'); // stale runtime value that must NOT survive the load
    g.run('loadGame();');
    assert.equal(g.run('window.vale_tutorial_seen === false'), true, 'a save missing vale_tutorial_seen must default it to false, not inherit the runtime value');

    // ── loadGame() with no save present should fail cleanly, not throw ──────
    g.run("localStorage.removeItem('verdantVale_save')");
    const okEmpty = g.run('loadGame()');
    assert.equal(okEmpty, false, 'loadGame() should return false when there is no save');

    g.renderFrame();
  },
};
