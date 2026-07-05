'use strict';
// Covers: opening and closing both the pause menu and the debug menu via
// real keypresses (input.js routing into state.js's menu/debugMenu state).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'menu: pause menu and debug menu open and close via keypresses',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue
    assert.equal(g.run('dialogue.open'), false);

    // ── Pause menu (M) ───────────────────────────────────────────────────────
    assert.equal(g.run('menu.open'), false, 'precondition: menu starts closed');
    g.press('m');
    assert.equal(g.run('menu.open'), true, 'M should open the pause menu');
    assert.equal(g.run('menu.screen'), 'main');

    g.press('m');
    assert.equal(g.run('menu.open'), false, 'M should close the pause menu again');

    // Escape also toggles it.
    g.press('Escape');
    assert.equal(g.run('menu.open'), true, 'Escape should open the pause menu too');
    g.press('Escape');
    assert.equal(g.run('menu.open'), false);

    // ── Debug menu (`) ───────────────────────────────────────────────────────
    assert.equal(g.run('debugMenu.open'), false, 'precondition: debug menu starts closed');
    g.press('`');
    assert.equal(g.run('debugMenu.open'), true, 'backtick should open the debug menu');

    g.press('`');
    assert.equal(g.run('debugMenu.open'), false, 'backtick should close the debug menu again');

    // Escape also closes the debug menu (same as backtick).
    g.press('`');
    assert.equal(g.run('debugMenu.open'), true);
    g.press('Escape');
    assert.equal(g.run('debugMenu.open'), false, 'Escape should close the debug menu too');

    // Note: input.js only reads '`'/'m' from the plain overworld branch (the
    // final `else` once menu/choice/shop/debugMenu/accordPanel/continentMap
    // are all closed) — so from the keyboard, the menu and debug menu can't
    // be swapped directly into one another; the open one has to be closed
    // first. Not covered here since it isn't reachable via real input.

    g.renderFrame();
  },
};
