'use strict';
// Covers: the Schilling-the-bear sequence break, historically listed in
// PROJECT_STATUS.md as "known, still-unfixed" -- defeating (or hugging)
// Wrongteeth, the floor-5 boss, before ever meeting Pip at the Calwick
// school was said to permanently lock the quest. Reading the current code
// (interactions.js's killWrongteeth()/hugWrongteeth(), npcs.js's Pip) shows
// this was already fixed at some earlier point without the doc being
// updated: both boss-resolution branches award Schilling gated only on
// `!schilling_returned` (never on `schilling_quest_started`), and Pip's
// action() checks `stats.items.some(i => i.name === 'Schilling')` BEFORE
// checking `schilling_quest_started`, so having the bear is what matters,
// not having started the quest first. This test proves that end to end
// through the real boss-interaction and NPC-interaction code paths, for
// both boss-resolution choices, and updates PROJECT_STATUS.md accordingly
// (see that file's "Known risks" / recommended-tasks sections).
//
//   1. Killing Wrongteeth BEFORE schilling_quest_started was ever set still
//      grants Schilling (real interact keypress -> real choice selection).
//   2. Turning Schilling in to Pip afterward still works and completes the
//      quest (Cat-Shaped Key granted, schilling_returned set), even though
//      schilling_quest_started was never true at any point.
//   3. Same proof for the hug-it branch, in an independent fresh context.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Schilling sequence break: defeating Wrongteeth before meeting Pip still awards and completes the quest',
  run() {
    // ── 1 & 2. Kill branch ──────────────────────────────────────────────────
    {
      const g = createContext();
      g.press('Enter');
      g.press('Enter'); // close intro dialogue

      assert.equal(g.run('schilling_quest_started'), false, 'precondition: quest never started (Pip never met)');
      assert.equal(g.run('schilling_returned'), false);

      g.run(`
        inDungeon = true; dungeonFloor = 5; inTown = false; inSluice = false;
        activeMap = DUNGEON5_MAP;
        BOSS.knockedDown = true; BOSS.defeated = false;
        player.x = BOSS.x; player.y = BOSS.y; player.facing = 'down';
        dialogue.open = false; choice.open = false; combat.active = false;
      `);
      g.press('Enter'); // opens the kill/hug choice
      assert.equal(g.run('choice.open'), true, 'the Wrongteeth choice should open (BOSS.knockedDown && !BOSS.defeated, in range)');
      g.run('choice.cursor = 0;'); // "Kill it"
      g.press('Enter');
      assert.equal(g.run('BOSS.defeated'), true);

      // Click through the kill-branch dialogue to its final page, which
      // fires dialogue.callbacks[0] -> grantItem('Schilling').
      while (g.run('dialogue.open') && g.run('dialogue.page < dialogue.pages.length - 1')) {
        g.press('Enter');
      }
      g.press('Enter'); // closes on the last page, running the callback
      assert.equal(g.run(`stats.items.some(i => i.name === 'Schilling')`), true,
        'Schilling must be granted even though schilling_quest_started was never set');
      assert.equal(g.run('schilling_quest_started'), false, 'still never started -- the bear came from combat, not from Pip');

      // Now turn it in.
      g.run('day = 2; dialogue.open = false;');
      g.run(`SIMPLE_NPCS.find(n => n.id === 'pip').action();`);
      assert.equal(g.run('dialogue.name'), 'Pip');
      assert.ok(g.run('dialogue.pages.flat().join(" ")').includes('Is that Schilling'),
        'Pip should recognize the bear immediately, not ask about a quest he never assigned');
      // Run the turn-in callback (final page).
      g.run('dialogue.callbacks[0]();');
      assert.equal(g.run('schilling_returned'), true, 'the quest should complete');
      assert.equal(g.run(`stats.items.some(i => i.name === 'Schilling')`), false, 'the bear should be handed over');
      assert.equal(g.run(`stats.items.some(i => i.name === 'Cat-Shaped Key')`), true, 'the reward should be granted');
    }

    // ── 3. Hug branch, independent fresh context ─────────────────────────────
    {
      const g = createContext();
      g.press('Enter');
      g.press('Enter');

      assert.equal(g.run('schilling_quest_started'), false);
      g.run(`
        inDungeon = true; dungeonFloor = 5; inTown = false; inSluice = false;
        activeMap = DUNGEON5_MAP;
        BOSS.knockedDown = true; BOSS.defeated = false;
        player.x = BOSS.x; player.y = BOSS.y; player.facing = 'down';
        dialogue.open = false; choice.open = false; combat.active = false;
      `);
      g.press('Enter');
      assert.equal(g.run('choice.open'), true);
      g.run('choice.cursor = 1;'); // "Let it hold you"
      g.press('Enter');
      assert.equal(g.run('BOSS.defeated'), true);

      while (g.run('dialogue.open') && g.run('dialogue.page < dialogue.pages.length - 1')) {
        g.press('Enter');
      }
      g.press('Enter');
      assert.equal(g.run(`stats.items.some(i => i.name === 'Schilling')`), true,
        'the hug branch must also grant Schilling regardless of schilling_quest_started');
      assert.equal(g.run('schilling_quest_started'), false);
    }
  },
};
