'use strict';
// Netto's letter is no longer read the moment it's handed over. The Supervisor
// gives it as an ITEM with a short note; the letter itself is read later by
// inspecting it in the Notebook. This is the general "inspect a quest item"
// mechanic: each special item, when inspected, shows its description — or, for
// letters, reads the full thing (getSpecialItemInspectPages, quests.js).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Notebook item inspect: Netto letter is obtained then read; quest items are inspectable',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // ── 1. Delivery hands over the item with a short note (NOT the whole letter). ─
    g.run("day=7; netto_letter_received=false; stats.items=[]; dialogue.open=false;");
    g.run('supervisorDialogueBody();');
    assert.equal(g.run('dialogue.pages.length'), 2, 'delivery is short: intro + note, not the full letter');
    assert.match(g.run('JSON.stringify(dialogue.pages)'), /Notebook|inspect/i, 'it points the player to the Notebook');
    assert.doesNotMatch(g.run('JSON.stringify(dialogue.pages)'), /— Netto/, 'the letter body is not dumped on delivery');
    for (let i = 0; i < 3; i++) g.press('Enter');   // drain -> callback grants the item
    assert.equal(g.run("stats.items.some(function(i){return i.name==='Letter from Netto';})"), true, 'the letter item is granted');
    assert.equal(g.run('netto_letter_received'), true, 'the one-time flag is set');

    // ── 2. Inspect content: the letter reads in full; other items show a note. ─
    const letterPages = JSON.parse(g.run("JSON.stringify(getSpecialItemInspectPages('Letter from Netto'))"));
    assert.ok(letterPages.length >= 5, 'the letter reads as many pages');
    assert.match(JSON.stringify(letterPages), /— Netto/, 'the letter is signed off');
    assert.match(JSON.stringify(letterPages[1]), new RegExp(g.run('stats.name')), 'the salutation greets the player by name');
    assert.deepEqual(g.run("JSON.stringify(getSpecialItemInspectPages('Schilling'))"),
      JSON.stringify([["Pip's teddy bear. He's waiting for it back."]]), 'a non-letter item shows its one-line description');
    assert.deepEqual(g.run("JSON.stringify(getSpecialItemInspectPages('No Such Item'))"),
      JSON.stringify([['A quest item.']]), 'unknown items fall back to a generic description');

    // ── 3. The notebook cursor lands on special-item rows and ENTER reads them. ─
    g.run("stats.items=[]; grantItem('Letter from Netto'); stats.items[0].questItem=true; grantItem('Schilling'); stats.items[1].questItem=true;");
    const notes = JSON.parse(g.run('JSON.stringify(getActiveQuestNotes())'));
    const specialStart = notes.findIndex(n => n.header === 'SPECIAL ITEMS');
    assert.ok(specialStart >= 0, 'the SPECIAL ITEMS section exists');
    const letterRow = notes.findIndex(n => n.title === 'Letter from Netto');
    assert.ok(letterRow > specialStart, 'the letter is an inspectable special-item row');

    g.run(`menu.open=true; menu.screen='notebook'; menu.notebookOffset=0; menu.notebookCursor=${letterRow}; dialogue.open=false;`);
    assert.doesNotThrow(() => g.renderFrame(), 'the notebook renders with the cursor on the letter');
    g.press('Enter');   // inspect the selected item
    assert.equal(g.run('menu.open'), false, 'the menu closes to read the item');
    assert.equal(g.run('dialogue.open'), true, 'the reader (dialogue) opens');
    assert.equal(g.run('dialogue.name'), 'Letter from Netto', 'it reads the selected item');
    assert.match(g.run('JSON.stringify(dialogue.pages)'), /— Netto/, 'the full letter is shown on inspect');

    // ── 4. Pressing ENTER on a non-inspectable row (a header/quest note) does nothing. ─
    g.run("dialogue.open=false; menu.open=true; menu.screen='notebook'; menu.notebookCursor=" + specialStart + ";"); // the SPECIAL ITEMS header row
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), false, 'a header row is not inspectable');
    assert.equal(g.run('menu.open'), true, 'and the menu stays open');
  },
};
