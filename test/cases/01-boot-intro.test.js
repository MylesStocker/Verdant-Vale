'use strict';
// Covers: game boot (every script loads without error, in index.html's real
// order) and the intro dialogue sequence, closed via real keypresses.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'boot: loads all scripts and opens/closes the intro dialogue',
  run() {
    const g = createContext();

    // ── Startup state (bootstrap.js) ────────────────────────────────────────
    assert.equal(g.run('dialogue.open'), true, 'intro dialogue should be open on boot');
    assert.equal(g.run('dialogue.pages.length'), 2, 'intro dialogue should have 2 pages');
    assert.equal(g.run('inTown'), true);
    assert.equal(g.run('townBuilding'), 'house');
    assert.equal(g.run('currentHouseId'), 'player_house');
    assert.equal(g.run('activeMap === HOUSE_INTERIOR_MAP'), true);
    assert.equal(g.run('player.x'), 7.5 * 32);
    assert.equal(g.run('player.y'), 9.5 * 32);

    // A few frames of the real loop body should run cleanly with no throw.
    g.frames(5);
    g.renderFrame();

    // ── Close the dialogue via real keypresses (fire-once-per-press, so each
    //    press needs its own keydown+keyup — see input.js) ──────────────────
    assert.equal(g.run('dialogue.page'), 0);
    g.press('Enter');
    assert.equal(g.run('dialogue.page'), 1, 'first Enter should advance to page 1');
    assert.equal(g.run('dialogue.open'), true, 'dialogue should still be open after page 1/2');

    g.press('Enter');
    assert.equal(g.run('dialogue.open'), false, 'second Enter should close the 2-page dialogue');
    assert.equal(g.run('dialogue.page'), 0, 'dialogue.page resets to 0 on close');

    // update()/render() should keep running fine after the dialogue closes.
    g.frames(3);
    g.renderFrame();
  },
};
