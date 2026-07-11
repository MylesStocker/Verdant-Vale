'use strict';
// Fenna's "A Bottle for Her Father" quest is gated on MainQuest >= 2 (the
// Drenwick dispatch done). Before that, talking to her yields only her
// drought worry about the fen mushroom beds — no choice menu, no quest flag.
// From MainQuest 2 the original offer flow is unchanged.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function talkThrough(g) {
  g.press('Enter');
  assert.equal(g.run('dialogue.open'), true, 'Fenna should respond');
  assert.equal(g.run('dialogue.name'), 'Fenna');
  const text = JSON.stringify(g.run('dialogue.pages')).toLowerCase();
  const pageCount = g.run('dialogue.pages.length');
  for (let i = 0; i < pageCount; i++) g.press('Enter');
  return text;
}

module.exports = {
  name: "Fenna's wine quest: gated on MainQuest >= 2, drought complaint before that",
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // Enter her apartment for real state, then stand next to her.
    g.run(`
      enterHouse('apt_2');
      const fenna = SIMPLE_NPCS.find(n => n.id === 'fenna');
      player.x = fenna.x;
      player.y = fenna.y + TILE * 0.6;
    `);

    // ── MainQuest 0: complaint only, no quest ───────────────────────────────
    const complaint = talkThrough(g);
    assert.ok(/mushroom/.test(complaint), 'she should worry about the mushroom beds');
    assert.ok(/rain/.test(complaint), 'the complaint should be about the missing rain');
    assert.ok(!/birthday/.test(complaint), 'no quest pitch yet');
    assert.equal(g.run('choice.open'), false, 'no offer choice before MainQuest 2');
    assert.equal(g.run('wine_quest_started'), false);

    // Still gated at MainQuest 1.
    g.run('MainQuest = 1; syncQuestFlagsToWindow();');
    assert.ok(/mushroom/.test(talkThrough(g)), 'still the complaint at MainQuest 1');
    assert.equal(g.run('wine_quest_started'), false);

    // ── MainQuest 2: the original offer flow, unchanged ────────────────────
    g.run('MainQuest = 2; syncQuestFlagsToWindow();');
    const offer = talkThrough(g);
    assert.ok(/birthday/.test(offer), 'quest pitch appears at MainQuest 2');
    assert.equal(g.run('choice.open'), true, 'the accept/decline choice opens');
    assert.equal(
      JSON.stringify(g.run('choice.options')),
      JSON.stringify(['Agree to carry the wine', 'Not right now'])
    );
    g.run('choice.cursor = 0;');
    g.press('Enter'); // agree
    assert.equal(g.run('wine_quest_started'), true, 'accepting starts the quest as before');
    // Close her thank-you dialogue.
    const thanksPages = g.run('dialogue.pages.length');
    for (let i = 0; i < thanksPages; i++) g.press('Enter');
    assert.equal(g.run('dialogue.open'), false);
  },
};
