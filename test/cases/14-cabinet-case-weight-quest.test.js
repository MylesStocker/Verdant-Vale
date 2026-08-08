'use strict';
// Covers: cabinetCaseFlag's new wiring into the Weight Discrepancy quest.
// cabinetCaseFlag used to be declared/schema'd/synced/read but never once
// set anywhere in the codebase (QUEST_TRACE.md section 16, "orphaned,
// effectively dead"). It's now the real completion gate for the quest's
// final step: once Corvin countersigns the correction (weight_note_signed),
// Aldric asks the player to file it themselves rather than doing it in
// person, and the actual choice -- and where cabinetCaseFlag flips -- happens
// at the Filing Cabinet in the Calwick office, not at any NPC. The quest
// cannot reach weight_quest_stage 3 (and Renn's payoff) until the flag is set.
//
// This test drives the full sequence via real dialogue/choice-box state
// (not by calling internal functions directly), since the whole point is
// that the branching is reachable through ordinary play: sign with Corvin,
// get redirected by Aldric, and make a real choice at the cabinet -- including
// proving the "decline" branch is a stall, not a dead end, and that the
// cabinet is retriable afterward.
//
// Compare arrays via .length/regex, not assert.deepEqual: values pulled out
// of the vm context have a different Array prototype than host literals
// (same caveat documented in 11-starting-kit-requisition.test.js).

const assert = require('assert/strict');
const { createContext } = require('../harness');

function closeDialogue(g, maxPresses) {
  maxPresses = maxPresses || 10;
  let n = 0;
  while (g.run('dialogue.open') && n < maxPresses) { g.press('Enter'); n++; }
  if (g.run('dialogue.open')) throw new Error('dialogue did not close within ' + maxPresses + ' presses');
}

module.exports = {
  name: 'cabinetCaseFlag: Weight Discrepancy quest requires filing the note at the cabinet',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    g.run(`
      currentTownId = 'calwick';
      inTown = true;
      townBuilding = 'office';
      activeMap = OFFICE_MAP;
      weight_quest_stage = 2;
      weight_note_signed = false;
      cabinetCaseFlag = false;
      corvin_favor_done = true; // Corvin only countersigns once his own favour is done (see test 60)
    `);

    // 1. Aldric, pre-signing: the original waiting line, no branching choice.
    g.run(`player.x = 3.5*TILE; player.y = 3.5*TILE; player.facing = 'down';`);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'Aldric dialogue should open');
    assert.match(g.run('dialogue.pages[0][0]'), /signature/, "pre-sign line should mention Corvin's signature");
    assert.equal(g.run('choice.open'), false, 'no branching choice before signing');
    closeDialogue(g);

    // 2. Corvin: sign the note. Stage must NOT advance yet -- filing is still required.
    g.run(`player.x = 1*TILE; player.y = 1*TILE;`); // step away so re-approach re-triggers
    g.run(`player.x = 9.5*TILE; player.y = 3.5*TILE; player.facing = 'down';`);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'Corvin dialogue should open');
    closeDialogue(g);
    assert.equal(g.run('weight_note_signed'), true, 'signing should set weight_note_signed');
    assert.equal(g.run('weight_quest_stage'), 2, 'stage should not advance until the note is actually filed');
    assert.equal(g.run('cabinetCaseFlag'), false, 'cabinetCaseFlag should still be false after signing alone');

    // 3. Aldric again: now redirects to the cabinet instead of the old waiting line.
    g.run(`player.x = 1*TILE; player.y = 1*TILE;`);
    g.run(`player.x = 3.5*TILE; player.y = 3.5*TILE; player.facing = 'down';`);
    g.press('Enter');
    assert.match(g.run('dialogue.pages[0][0]'), /Signed already/, 'post-sign Aldric line should differ from the pre-sign one');
    closeDialogue(g, 3); // 2 pages; the last press fires the callback that opens the choice box
    assert.equal(g.run('choice.open'), true, 'Aldric should offer a branching choice once the note is signed');
    const aldricOpts = g.run('choice.options');
    assert.equal(aldricOpts.length, 3, "not immediately obvious which one matters -- Aldric's choice has 3 options");
    // Push back once out of curiosity -- should NOT set anything, just flavor.
    g.run('choice.open = false; choice.callbacks[1]();'); // "Shouldn't this go through you?"
    assert.equal(g.run('dialogue.open'), true, 'push-back option should open its own reply');
    closeDialogue(g);
    assert.equal(g.run('cabinetCaseFlag'), false, 'pushing back should not silently set the flag');

    // 3b. The other cabinets redirect: the note files at Corvin's section, the
    // cabinet by the window (CORVIN_CABINET) — the two decoys just point there.
    g.run(`player.x = 1*TILE; player.y = 1*TILE;`);
    g.run(`player.x = FILING_CABINET.x; player.y = FILING_CABINET.y; player.facing = 'down';`);
    g.press('Enter');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /by the window/, 'the far filing cabinet should redirect to the cabinet by the window');
    assert.equal(g.run('choice.open'), false, 'the wrong cabinet must not open the filing choice');
    closeDialogue(g);

    // 4. Corvin's cabinet (by the window), before deciding: the special filing scene, not generic flavor.
    g.run(`player.x = 1*TILE; player.y = 1*TILE;`);
    g.run(`player.x = 4.5*TILE; player.y = 2.5*TILE; player.facing = 'down';`);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true);
    assert.match(g.run('dialogue.pages[0][0]'), /countersigned note/, 'cabinet should show the filing scene once the note is signed');
    closeDialogue(g, 3);
    assert.equal(g.run('choice.open'), true, 'cabinet should offer a branching choice');
    const cabinetOpts = g.run('choice.options');
    assert.equal(cabinetOpts.length, 3, "not immediately obvious which cabinet option actually files it");

    // 5. Decline path: mandatory completion means declining just stalls, not a dead end.
    g.run('choice.open = false; choice.callbacks[2]();'); // "This isn't your job -- find Aldric instead"
    closeDialogue(g);
    assert.equal(g.run('cabinetCaseFlag'), false, 'declining should not set the flag');
    assert.equal(g.run('weight_quest_stage'), 2, 'declining should not advance the quest');

    // 6. Re-approach: the cabinet must still be retriable (not a one-shot that broke itself).
    g.run(`player.x = 1*TILE; player.y = 1*TILE;`);
    g.run(`player.x = 4.5*TILE; player.y = 2.5*TILE; player.facing = 'down';`);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'cabinet should be re-triable after declining once');
    closeDialogue(g, 3);
    assert.equal(g.run('choice.open'), true);
    g.run('choice.open = false; choice.callbacks[0]();'); // "File it with Corvin's other notes"
    assert.equal(g.run('cabinetCaseFlag'), true, 'filing it properly must set cabinetCaseFlag -- this is the mandatory step');
    assert.equal(g.run('weight_quest_stage'), 3, 'filing it should advance the quest to stage 3, unlocking Renn\'s payoff');
    closeDialogue(g);

    // 7. Filing Cabinet, revisited: the original "disturbed" flavor line now fires.
    g.run(`player.x = 1*TILE; player.y = 1*TILE;`);
    g.run(`player.x = 4.5*TILE; player.y = 2.5*TILE; player.facing = 'down';`);
    g.press('Enter');
    assert.match(g.run('dialogue.pages[0][0]'), /disturbed/, 'cabinet should show the original "disturbed" line once cabinetCaseFlag is set');
    closeDialogue(g);

    // 8. Esla reacts once the flag is set (reactive flavor, doesn't gate anything).
    g.run(`player.x = 1*TILE; player.y = 1*TILE;`);
    g.run(`player.x = 4.5*TILE; player.y = 9.5*TILE; player.facing = 'down';`);
    g.press('Enter');
    const eslaJson = g.run('JSON.stringify(dialogue.pages)');
    assert.ok(eslaJson.includes('cabinet'), 'Esla should have a reactive line about the cabinet once cabinetCaseFlag is set');
    closeDialogue(g, 20);

    // 9. Save/load round-trip.
    g.run(`saveGame();`);
    g.run(`weight_note_signed = false; cabinetCaseFlag = false; weight_quest_stage = 0; loadGame();`);
    assert.equal(g.run('weight_note_signed'), true, 'weight_note_signed should round-trip through save/load');
    assert.equal(g.run('cabinetCaseFlag'), true, 'cabinetCaseFlag should round-trip through save/load');
    assert.equal(g.run('weight_quest_stage'), 3);

    g.renderFrame();
  },
};
