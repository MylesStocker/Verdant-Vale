'use strict';
// Covers: the Calwick schoolhouse bookshelf (calwick_school_bookshelf, npcs.js)
// gains a sixth reading entry — a plainer, sceptical scholarly note on Fort
// Ariel and the Warm Circle, shelved alongside the five Imperial School
// Primers. Verifies the five primers still read, the Ariel note is present and
// distinct in register (no "IMPERIAL SCHOOL PRIMER" heading), and its pages
// carry the defensible facts.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'History book: Fort Ariel scholarly note added to the Calwick schoolhouse shelf',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // Stand at the schoolhouse bookshelf and open it.
    g.run("inTown = true; currentTownId = 'calwick'; townBuilding = 'school'; activeMap = HOUSE_INTERIOR_MAP;");
    g.run("var b = SIMPLE_NPCS.find(n => n.id === 'calwick_school_bookshelf'); player.x = b.x; player.y = b.y + 16;");
    g.run('dialogue.open = false; choice.open = false; accordPanel.open = false;');
    g.run('handleInteract();');
    assert.match(g.run("choice.options.join('|')"), /Read a history book/, 'the shelf offers a history book');
    g.run('choice.cursor = 0;'); g.press(' '); // Read a history book -> topics

    // The five primers still read, and the Ariel note is a sixth entry.
    const topics = g.run("choice.options.join('|')");
    for (const t of ['The Century War', 'The Accord of Threads', 'The Eight Threads', 'The Council of 33', 'The Quiet'])
      assert.ok(topics.includes(t), 'primer still present: ' + t);
    assert.ok(topics.includes('Fort Ariel'), 'the Fort Ariel note was added');

    // Open the Ariel note.
    const idx = g.run("choice.options.indexOf('Fort Ariel')");
    g.run(`choice.cursor = ${idx};`); g.press(' ');
    assert.equal(g.run('accordPanel.open'), true, 'the note opens in the parchment reader');
    const title = g.run('accordPanel.title');
    assert.match(title, /FORT ARIEL/, 'titled for Fort Ariel');
    assert.ok(!/IMPERIAL SCHOOL PRIMER/.test(title), 'the note is a scholarly gloss, not an Imperial primer');

    // The defensible facts are all present across its pages.
    assert.ok(g.run('accordPanel.pages.length') >= 2, 'multi-page note');
    const text = g.run("accordPanel.pages.flat().join(' ')");
    for (const fact of [
      'Prismborn',
      'not routinely capable of reshaping regional climates',
      'Fort Arrhall',
      'six kilometres',
      'strawberries',
      'cereal',
      'Century War',
      'eleven centuries',
      'No measurable weakening',
      'operating mechanism',
      'failed',
      'should not exist',
    ]) assert.ok(text.includes(fact), 'Ariel note states: ' + fact);

    // Distinct register: one of the actual primers still carries the Imperial heading.
    g.run('accordPanel.open = false; choice.open = false;');
    g.run('handleInteract();'); g.run('choice.cursor = 0;'); g.press(' '); // reopen topics
    const century = g.run("choice.options.indexOf('The Century War')");
    g.run(`choice.cursor = ${century};`); g.press(' ');
    assert.match(g.run('accordPanel.title'), /IMPERIAL SCHOOL PRIMER/, 'the primers keep their Imperial heading');
  },
};
