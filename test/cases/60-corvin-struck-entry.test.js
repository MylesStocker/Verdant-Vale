'use strict';
// test/cases/60-corvin-struck-entry.test.js
//
// Covers: "The Struck Entry" — Corvin's favour, handed out randomly at the
// Calwick inn on a Dayoff, and its cross-wiring into the Weight Discrepancy
// quest. The resolution (recovering the tally, corvin_favor_done becoming true)
// is NOT built yet — this proves the parts that exist:
//
//   - Corvin offers the favour only at the inn, only on a Dayoff, at a 1/3
//     roll that is rolled once per Dayoff and remembered (stable across
//     re-talks / save-load), and only once (started/done gate it off);
//   - accepting sets corvin_favor_started; declining leaves it unstarted;
//   - once given, his ordinary dialogue picks up an in-progress line;
//   - CRUCIALLY: Corvin will not countersign Aldric's correction until the
//     favour is done — with corvin_favor_done false he deflects and
//     weight_note_signed stays false; with it true he signs. Since nothing
//     sets corvin_favor_done yet, this is exactly the intended "Aldric's quest
//     can't reach its clean finish yet" state;
//   - all four flags round-trip through save/load.
//
// Values pulled from the vm have a different Array prototype than host
// literals, so strings are compared via regex, not deepEqual.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function closeDialogue(g, maxPresses) {
  maxPresses = maxPresses || 12;
  let n = 0;
  while (g.run('dialogue.open') && n < maxPresses) { g.press('Enter'); n++; }
  if (g.run('dialogue.open')) throw new Error('dialogue did not close within ' + maxPresses + ' presses');
}
// Move onto Corvin and press interact. Steps away first so a re-approach
// re-triggers the proximity check.
function talkToCorvin(g) {
  const cx = g.run("SIMPLE_NPCS.find(n => n.id === 'corvin').x");
  const cy = g.run("SIMPLE_NPCS.find(n => n.id === 'corvin').y");
  g.run(`player.x = 0; player.y = 0;`);
  g.run(`player.x = ${cx}; player.y = ${cy}; player.facing = 'down';`);
  g.press('Enter');
}
// Force / suppress the 1/3 availability roll deterministically.
function withRandom(g, value, fn) {
  g.run(`window.__savedRandom = Math.random; Math.random = function(){ return ${value}; };`);
  try { fn(); } finally { g.run(`Math.random = window.__savedRandom; delete window.__savedRandom;`); }
}

module.exports = {
  name: 'The Struck Entry: Corvin’s inn favour gates his signature in Aldric’s quest',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro

    // Established player, at the Calwick inn, on a Dayoff, outside the rest week.
    function resetInnDayoff(dayVal) {
      g.run(`
        currentTownId = 'calwick'; inTown = true; townBuilding = 'inn';
        day = ${dayVal}; MainQuest = 2;
        mq4_available_day = 0; reservoir_quest_started = false;
        corvin_favor_started = false; corvin_favor_done = false;
        corvin_favor_offer_day = 0; corvin_favor_offered = false;
        weight_quest_stage = 0; weight_note_signed = false;
        syncQuestFlagsToWindow();
      `);
    }

    // ── 1. Corvin is at the inn on a Dayoff (day % 5 === 0) ──────────────────
    resetInnDayoff(5);
    assert.equal(g.run("SIMPLE_NPCS.find(n => n.id === 'corvin').map"), 'inn', 'Corvin is at the inn on a Dayoff');

    // ── 2. Roll hits (1/3): the favour is offered; the roll is recorded. ─────
    withRandom(g, 0.1, () => { talkToCorvin(g); });
    assert.equal(g.run('dialogue.open'), true, 'a successful roll opens the favour offer');
    assert.equal(g.run('dialogue.name'), 'Corvin', 'the offer is spoken by Corvin');
    assert.match(g.run('dialogue.pages[1][1]'), /third lock on the old Drenwick canal/, 'the offer names the canal-lock favour');
    assert.equal(g.run('corvin_favor_offer_day'), 5, 'the availability roll is stamped with the day');
    assert.equal(g.run('corvin_favor_offered'), true, 'the availability roll result is recorded');

    // advance to the accept/decline choice
    closeDialogue(g);
    assert.equal(g.run('choice.open'), true, 'the offer ends in an accept/decline choice');
    assert.equal(g.run('choice.options.length'), 2, 'two choices: take it or not');

    // ── 3. Declining leaves the favour unstarted (and offer still true). ─────
    g.run('choice.cursor = 1;'); // "Not now"
    g.press('Enter');
    closeDialogue(g);
    assert.equal(g.run('corvin_favor_started'), false, 'declining does not start the favour');
    assert.equal(g.run('corvin_favor_offered'), true, 'the day’s roll stays offered so re-talking can still accept');

    // ── 4. Accepting sets corvin_favor_started. ──────────────────────────────
    talkToCorvin(g); // same day, offered still true -> offer again (no re-roll)
    assert.equal(g.run('dialogue.open'), true, 're-talking the same successful Dayoff re-offers');
    closeDialogue(g);
    assert.equal(g.run('choice.open'), true, 'the offer choice is shown again');
    g.run('choice.cursor = 0;'); // "Find the tally"
    g.press('Enter');
    closeDialogue(g);
    assert.equal(g.run('corvin_favor_started'), true, 'accepting starts the favour');

    // ── 5. Once started, he no longer offers — ordinary dialogue resumes with
    //       an in-progress line appended. ─────────────────────────────────────
    talkToCorvin(g);
    const started = JSON.stringify(g.run('dialogue.pages'));
    assert.doesNotMatch(started, /I have a thing I can.t do myself/, 'the offer does not fire again once started');
    assert.match(started, /My father.s tally/, 'his dialogue now carries the in-progress favour line');
    closeDialogue(g);

    // ── 6. A missed roll (2/3) offers nothing, and does not re-roll on re-talk
    //       within the same Dayoff. ───────────────────────────────────────────
    resetInnDayoff(10);
    withRandom(g, 0.9, () => { talkToCorvin(g); });
    // proprietor's ordinary inn dialogue may open, but it must NOT be the offer
    assert.equal(g.run('corvin_favor_offer_day'), 10, 'a missed roll still records the day');
    assert.equal(g.run('corvin_favor_offered'), false, 'a missed roll records no offer');
    assert.equal(g.run('corvin_favor_started'), false, 'a missed roll cannot start the favour');
    closeDialogue(g);
    // re-talk same day: must not flip offered (no re-roll)
    withRandom(g, 0.1, () => { talkToCorvin(g); }); // even a "hit" value must be ignored — day already rolled
    assert.equal(g.run('corvin_favor_offered'), false, 'the once-per-Dayoff roll is stable across re-talks');
    closeDialogue(g);

    // ── 7. THE GATE: at Aldric's office, Corvin will not countersign until the
    //       favour is done. weight_note_signed stays false; he deflects. ──────
    function approachCorvinInOffice() {
      g.run(`
        resetLocationState();   // clean location slate (boot starts in a house)
        currentTownId = 'calwick'; inTown = true; townBuilding = 'office'; activeMap = OFFICE_MAP;
        day = 1; weight_quest_stage = 2; weight_note_signed = false; cabinetCaseFlag = false;
        syncQuestFlagsToWindow();
      `);
      const cx = g.run("SIMPLE_NPCS.find(n => n.id === 'corvin').x");
      const cy = g.run("SIMPLE_NPCS.find(n => n.id === 'corvin').y");
      g.run(`player.x = 0; player.y = 0;`);
      g.run(`player.x = ${cx}; player.y = ${cy}; player.facing = 'down';`);
      g.press('Enter');
    }

    // not started -> deflect toward the inn, no signature
    g.run('corvin_favor_started = false; corvin_favor_done = false; syncQuestFlagsToWindow();');
    approachCorvinInOffice();
    assert.equal(g.run('dialogue.open'), true, 'Corvin still talks about the discrepancy');
    assert.match(g.run('dialogue.pages[1][2]'), /inn on the Dayoff/, 'he points the player to ask him at the inn');
    closeDialogue(g);
    assert.equal(g.run('weight_note_signed'), false, 'he does NOT sign before the favour');

    // started but not done -> still won't sign
    g.run('corvin_favor_started = true; corvin_favor_done = false; syncQuestFlagsToWindow();');
    approachCorvinInOffice();
    assert.match(g.run('dialogue.pages[0][0]'), /father.s roll/, 'with the favour under way he references it');
    closeDialogue(g);
    assert.equal(g.run('weight_note_signed'), false, 'he still will not sign until the favour is done');

    // favour done -> he signs
    g.run('corvin_favor_done = true; syncQuestFlagsToWindow();');
    approachCorvinInOffice();
    assert.match(g.run('dialogue.pages[0][0]'), /keeper.s roll/, 'once repaid he signs and says why');
    closeDialogue(g);
    assert.equal(g.run('weight_note_signed'), true, 'with the favour done, the countersignature goes through');

    // ── 8. All four flags round-trip through save/load. ──────────────────────
    g.run('corvin_favor_started = true; corvin_favor_done = true; corvin_favor_offer_day = 7; corvin_favor_offered = true; syncQuestFlagsToWindow(); saveGame();');
    g.run('corvin_favor_started = false; corvin_favor_done = false; corvin_favor_offer_day = 0; corvin_favor_offered = false; loadGame();');
    assert.equal(g.run('corvin_favor_started'), true, 'corvin_favor_started round-trips');
    assert.equal(g.run('corvin_favor_done'), true, 'corvin_favor_done round-trips');
    assert.equal(g.run('corvin_favor_offer_day'), 7, 'corvin_favor_offer_day round-trips');
    assert.equal(g.run('corvin_favor_offered'), true, 'corvin_favor_offered round-trips');
  },
};
