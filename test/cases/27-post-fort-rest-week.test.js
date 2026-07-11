'use strict';
// Post-MainQuest-3 pacing: after the fen post pay ticket is processed
// (MainQuest = 3), the supervisor must NOT hand out the next main assignment
// immediately. Instead he closes out the Polwick/Essa matter (wording varies
// by outcome), orders the rest of the week off, and only offers the reservoir
// bed assignment (reservoir_quest_started) from the first workday after the
// next Dayoff (mq4_available_day = day + (5 - day % 5) + 1).

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Shared setup: a context sitting in the Calwick office, in front of the
// Supervisor, with the whole main story through the fort quest resolved and
// the fort pay ticket already redeemed (MainQuest = 3).
function contextAtMainQuest3(outcomeFlags) {
  const g = createContext();
  g.press('Enter');
  g.press('Enter'); // close intro dialogue
  g.run(`
    inTown = true;
    currentTownId = 'calwick';
    townBuilding = 'office';
    sluice_job_started = true;
    sluice_fixed = true;
    sluice_reward_given = true;
    dispatch_quest_started = true;
    dispatch_delivered = true;
    dispatch_rewarded = true;
    fort_quest_started = true;
    fort_quest_stage = 6;
    MainQuest = 3;
    netto_letter_received = true; // or the day > 6 letter branch intercepts
    day = 7; // a mid-week workday (day % 5 === 2)
    ${outcomeFlags}
    syncQuestFlagsToWindow();
    player.x = 12 * TILE; // SUPERVISOR position
    player.y = 2.5 * TILE;
  `);
  return g;
}

// Opens the supervisor dialogue, asserts the speaker, pages all the way
// through (running any end-of-dialogue callback), and returns the pages as a
// lowercase JSON string for content assertions.
function talkThrough(g) {
  g.press('Enter');
  assert.equal(g.run('dialogue.open'), true, 'supervisor dialogue should open');
  assert.equal(g.run('dialogue.name'), 'Supervisor');
  const text = JSON.stringify(g.run('dialogue.pages')).toLowerCase();
  const pageCount = g.run('dialogue.pages.length');
  for (let i = 0; i < pageCount; i++) g.press('Enter');
  assert.equal(g.run('dialogue.open'), false, 'dialogue should be fully paged through');
  return text;
}

module.exports = {
  name: 'post-fort rest week: outcome-aware close-out, Dayoff gate, then the reservoir bed assignment',
  run() {
    // ── Full walkthrough on the "killed and reported" outcome ──────────────
    const g = contextAtMainQuest3('smugglers_dead = true; fort_report_filed = true;');

    // 1. First visit after payment: close-out + rest order, NOT an assignment.
    const closeOut = talkThrough(g);
    assert.ok(/struck through/.test(closeOut), 'killed outcome should get the killed-aware close-out wording');
    assert.ok(/take the rest of it off/.test(closeOut), 'should order the rest of the week off');
    assert.ok(!/reservoir/.test(closeOut), 'must not hand out the reservoir assignment immediately');
    assert.equal(g.run('reservoir_quest_started'), false);
    // day 7 -> next Dayoff is 10 -> assignment unlocks day 11.
    assert.equal(g.run('mq4_available_day'), 11, 'gate should be first workday after next Dayoff');

    // 2. Still resting (same day, and again on the last workday before Dayoff).
    assert.ok(/off the roster/.test(talkThrough(g)), 'repeat visit while resting should be the stand-down line');
    g.run('day = 9;');
    assert.ok(/off the roster/.test(talkThrough(g)));
    assert.equal(g.run('reservoir_quest_started'), false, 'no assignment before the Dayoff');

    // 3. First workday after Dayoff: the reservoir bed assignment.
    g.run('day = 11;');
    const assignment = talkThrough(g);
    assert.ok(/reservoir bed north of drenwick/.test(assignment), 'assignment should point at the reservoir bed');
    assert.ok(/rather final/.test(assignment), 'killed outcome should get the "rather final" Drenwick line');
    assert.equal(g.run('reservoir_quest_started'), true, 'assignment should now be started');
    assert.equal(g.run('MainQuest'), 3, 'MainQuest stays 3 until the reservoir quest is completed');

    // 4. Repeat visit: reminder only, nothing re-triggers.
    assert.ok(/reservoir bed/.test(talkThrough(g)), 'follow-up visit should remind about the assignment');
    assert.equal(g.run('mq4_available_day'), 11, 'gate day must not be recomputed');

    // ── Wording variants for the other two outcomes ────────────────────────
    // Reported (spared, honest report): Polwick is in the district's paperwork.
    const gr = contextAtMainQuest3(
      'smugglers_dead = false; fort_report_filed = true; smugglers_execution_day = 12;');
    assert.ok(/drenwick’s arithmetic/.test(talkThrough(gr)), 'reported outcome close-out wording');
    gr.run('day = 11;');
    assert.ok(/knife in a ledger/.test(talkThrough(gr)), 'reported outcome Drenwick line');
    assert.equal(gr.run('reservoir_quest_started'), true);

    // Ignored / claimed "found nothing" (even if the smugglers actually died):
    // the supervisor doesn't magically know, so wording stays neutral.
    const gn = contextAtMainQuest3('smugglers_dead = true; fort_report_filed = false;');
    const neutralClose = talkThrough(gn);
    assert.ok(/clerical error/.test(neutralClose), 'found-nothing outcome close-out wording');
    assert.ok(!/struck through/.test(neutralClose), 'supervisor must not reveal knowledge of the deaths');
    gn.run('day = 11;');
    const neutralAssign = talkThrough(gn);
    assert.ok(/something i trusted/.test(neutralAssign), 'found-nothing outcome Drenwick line');
    assert.ok(!/rather final/.test(neutralAssign) && !/knife in a ledger/.test(neutralAssign),
      'neutral wording must not leak the other outcomes');
  },
};
