'use strict';
// Regression test for TRANSITION_AUDIT.md Issue #1: DRENWICK_SCHOOL_BASEMENT_MAP
// was a real, correctly-walkable map that was simply missing from
// MAP_REGISTRY. Since saveGame()/loadGame() resolve activeMap to/from a
// string purely via MAP_REGISTRY (mapToId()/mapFromId() in save.js), saving
// while in the basement wrote a null map id, and loading back in silently
// left the player on whatever map was already active instead of restoring
// the basement. Fixed by registering the map; this test locks that in.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'save/load: saving in the Drenwick school basement restores the basement on load',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── Place the player in the basement, then save ─────────────────────────
    g.run(`
      resetLocationState();   // clean location slate (boot starts in a house)
      inTown = true;
      currentTownId = 'drenwick';
      townBuilding = 'school';
      activeMap = DRENWICK_SCHOOL_BASEMENT_MAP;
      player.x = 2.5 * TILE;
      player.y = 3.5 * TILE;
      player.facing = 'down';
    `);
    g.run('saveGame()');

    const raw = g.run("localStorage.getItem('verdantVale_save')");
    assert.ok(raw, 'saveGame() should have written something to localStorage');
    const saved = JSON.parse(raw);
    assert.equal(
      saved.activeMapId, 'DRENWICK_SCHOOL_BASEMENT_MAP',
      'saved activeMapId should resolve to the registry key, not null'
    );

    // ── Mutate away to a completely different map ───────────────────────────
    g.run(`
      inTown = false;
      currentTownId = null;
      townBuilding = null;
      activeMap = MAP;
      player.x = 0;
      player.y = 0;
      player.facing = 'up';
    `);
    assert.equal(g.run('activeMap === MAP'), true, 'sanity: mutation applied before load');

    // ── Load should restore the basement, not leave the mutated map ─────────
    const ok = g.run('loadGame()');
    assert.equal(ok, true, 'loadGame() should report success when a valid save exists');

    assert.equal(
      g.run('activeMap === DRENWICK_SCHOOL_BASEMENT_MAP'), true,
      'activeMap should be restored to the basement via MAP_REGISTRY, not left on the mutated map'
    );
    assert.equal(g.run('inTown'), true);
    assert.equal(g.run('currentTownId'), 'drenwick');
    assert.equal(g.run('townBuilding'), 'school');
    assert.equal(g.run('player.x'), 2.5 * 32);
    assert.equal(g.run('player.y'), 3.5 * 32);
    assert.equal(g.run('player.facing'), 'down');

    // ── The restored spot should actually be walkable (the audit's original
    //    concern wasn't just "does it round-trip" but "does it round-trip to
    //    somewhere the player can stand and move") ───────────────────────────
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'restored position should be walkable');

    g.renderFrame();
  },
};
