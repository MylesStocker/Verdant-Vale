'use strict';
// Regression test for QUEST_TRACE.md Issue #2: choosing "Found nothing" when
// reporting back on the fort quest used to withhold any reward at all and
// permanently cap MainQuest below 3. The fix keeps the report honest choice
// as the full 200g reward, but gives "Found nothing" a reduced 15g pay
// ticket (through the same ticket+Petra pattern used everywhere else) and
// still lets MainQuest advance to 3.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'fort quest: "Found nothing" grants a reduced 15g ticket and still advances MainQuest to 3',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // interactSupervisor() is one long else-if chain over every prior quest
    // stage (sluice -> dispatch -> fort); every earlier stage's "done" flag
    // has to be set or the chain matches an earlier branch instead of the
    // fort-reporting one.
    g.run(`
      inTown = true;
      currentTownId = 'calwick';
      townBuilding = 'office';
      supervisor_greet_day = 1; // suppress the once-per-day greeting page; this test counts presses
      sluice_job_started = true;
      sluice_fixed = true;
      sluice_reward_given = true;
      dispatch_quest_started = true;
      dispatch_delivered = true;
      dispatch_rewarded = true;
      fort_quest_started = true;
      fort_quest_stage = 5; // spared, ready to report
      MainQuest = 2;
      player.x = 12 * TILE; // SUPERVISOR position
      player.y = 2.5 * TILE;
    `);

    // Talk to the Supervisor -> "What did you find?" -> choice. This
    // dialogue is 2 pages ('Investigator...'/'The fen post...'), so it takes
    // 2 presses to close and run the callback that opens the choice.
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Supervisor');
    g.press('Enter');
    g.press('Enter');
    assert.equal(g.run('choice.open'), true, 'should reach the report/found-nothing choice');
    // Compare via JSON, not assert.deepEqual: arrays pulled out of the vm
    // context have a different Array prototype than host-literal arrays.
    assert.equal(
      JSON.stringify(g.run('choice.options')),
      JSON.stringify(['Report what I found', 'Found nothing'])
    );

    // Choose "Found nothing" (index 1).
    g.run('choice.cursor = 1;');
    g.press('Enter');

    assert.equal(g.run('fort_quest_stage'), 6, 'quest should still resolve to stage 6');
    assert.equal(g.run('fort_pay_ticket_ready'), true, 'a pay ticket should still be issued, just a reduced one');
    assert.equal(g.run('fort_pay_ticket_reduced'), true, 'the reduced-ticket flag should be set');
    assert.equal(g.run('dialogue.open'), true, 'the supervisor\'s reaction dialogue should be showing');
    assert.equal(g.run('dialogue.name'), 'Supervisor');

    const pageCount = g.run('dialogue.pages.length');
    assert.ok(pageCount >= 2, 'should have more than a one-line reaction');
    const allText = JSON.stringify(g.run('dialogue.pages')).toLowerCase();
    assert.ok(
      /convinced|disappoint|doesn.t sound|doubt/.test(allText),
      `expected some sign of the supervisor's disappointment in the dialogue text, got: ${allText}`
    );

    for (let i = 0; i < pageCount; i++) g.press('Enter');
    assert.equal(g.run('dialogue.open'), false);

    // Redeem the ticket with Petra (office, day 1 -> not Dayoff).
    const goldBefore = g.run('stats.gold');
    g.run(`
      player.x = 6.5 * TILE;
      player.y = 3.5 * TILE;
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Petra');
    const petraPages = g.run('dialogue.pages.length');
    for (let i = 0; i < petraPages; i++) g.press('Enter');

    assert.equal(g.run('stats.gold'), goldBefore + 15, 'reduced ticket should pay exactly 15 gold, not 200');
    assert.equal(g.run('fort_pay_ticket_ready'), false, 'ticket should be consumed');
    assert.equal(g.run('fort_pay_ticket_reduced'), false, 'reduced-ticket flag should be cleared after redemption');
    assert.equal(g.run('MainQuest'), 3, 'MainQuest should still advance to 3, same as the honest-report path');
  },
};
