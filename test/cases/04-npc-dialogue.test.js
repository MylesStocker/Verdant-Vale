'use strict';
// Covers: a full NPC/object interaction dialogue, start to finish -- walking
// up to an interactable, opening its dialogue via handleInteract()
// (interactions.js), and clicking through every page to close it.
//
// Uses the "West Calwick survey marker" interactable, a `type: 'inspect'`
// MAP_FEATURES entry (interactions.js, migrated from the earlier
// INTERACTION_REGISTRY pilot -- see MAP_FEATURES's header comment) rather
// than a quest-gated NPC, since it needs no quest-flag setup: just standing
// in the right spot on the right map. It's a generic repeatable
// inspectable, not a full SIMPLE_NPCS entry, but it exercises the same
// dialogue-open/advance/close pipeline, now via tryMapFeatures().

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'dialogue: full NPC/interactable conversation opens, advances, and closes',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // Teleport directly to the interactable instead of walking the whole map
    // -- movement itself is covered by 02-movement-boundary.test.js.
    g.run(`
      currentTownId = 'calwick';
      inTown = true;
      townBuilding = 'west';
      activeMap = WEST_TOWN_MAP;
      player.x = 1.5 * TILE;
      player.y = 10.5 * TILE;
      player.facing = 'down';
    `);

    assert.equal(g.run('dialogue.open'), false, 'precondition: no dialogue open yet');

    g.press('Enter'); // handleInteract() -> tryMapFeatures() should find it
    assert.equal(g.run('dialogue.open'), true, 'interacting near the marker should open its dialogue');
    const pageCount = g.run('dialogue.pages.length');
    assert.equal(pageCount, 4, 'survey marker dialogue should have 4 pages');
    assert.equal(g.run('dialogue.page'), 0);

    // Click through every remaining page.
    for (let i = 1; i < pageCount; i++) {
      g.press('Enter');
      assert.equal(g.run('dialogue.open'), true, `dialogue should still be open after page ${i}`);
      assert.equal(g.run('dialogue.page'), i);
    }

    // One more press closes it (page reaches pages.length).
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), false, 'final Enter should close the dialogue');
    assert.equal(g.run('dialogue.page'), 0, 'dialogue.page resets to 0 on close');

    // Interacting again in the same spot re-opens it (not a one-shot flag) --
    // confirms the interaction didn't leave dialogue state stuck.
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'should be able to re-open the same interaction');

    g.renderFrame();
  },
};
