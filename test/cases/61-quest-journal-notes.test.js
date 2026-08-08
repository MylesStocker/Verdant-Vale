'use strict';
// Phase 1 refactor guard: quest-journal content now lives in a read-only
// getActiveQuestNotes() (quests.js), moved out of the notebook renderer
// (drawMenu(), render-ui.js). These tests pin the extracted behavior: the
// entry format/order, the Warden objective text, special-item handling with
// deduplication, and that the function is side-effect free.
//
// Structural results are round-tripped through JSON so comparisons are against
// host-realm objects (the harness runs game code in a separate vm realm, whose
// Array/Object prototypes would otherwise trip assert/strict's deepEqual).

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Reset every quest flag the notebook reads to a "nothing active" baseline.
const RESET = `
  dispatch_quest_started = dispatch_delivered = dispatch_pay_ticket_ready = dispatch_rewarded = false;
  sluice_job_started = sluice_fixed = sluice_pay_ticket_ready = sluice_reward_given = false;
  warden_quest_started = warden_quest_defeated = warden_quest_rewarded = false;
  fort_quest_started = false; fort_quest_stage = 0; fort_pay_ticket_ready = false;
  mq4_available_day = 0; reservoir_quest_started = false;
  schilling_quest_started = schilling_returned = false;
  sentry_quest_started = sentry_quest_done = sentry_quest_rewarded = false;
  sickle_quest_stage = 0;
  den_wraith_quest_started = den_wraith_defeated = den_wraith_rewarded = false;
  wine_quest_started = wine_quest_delivered = wine_quest_rewarded = false;
  day = 20;
  stats.items = [];
`;

const notesOf = (g) => JSON.parse(g.run('JSON.stringify(getActiveQuestNotes())'));

module.exports = {
  name: 'quest journal: getActiveQuestNotes() extraction (content, order, dedup, purity)',
  run() {
    // ── No active quests ─────────────────────────────────────────────────────
    {
      const g = createContext();
      g.run(RESET);
      assert.deepEqual(notesOf(g), [], 'no flags set and no quest items => empty notebook');
    }

    // ── Multiple simultaneous notes keep their existing order ─────────────────
    {
      const g = createContext();
      g.run(RESET);
      g.run(`
        dispatch_quest_started = true;
        sluice_job_started = true;
        warden_quest_started = true;
        den_wraith_quest_started = true;
      `);
      const titles = notesOf(g).map(n => n.title);
      assert.deepEqual(titles, [
        "Supervisor's Errand",
        'Sluice Repair',
        'Warden Contract',
        'Den Wraith',
      ], 'notes appear in the fixed source order, not flag-set order');
    }

    // ── Warden objective uses the hidden NW spring meadow text ────────────────
    {
      const g = createContext();
      g.run(RESET);
      g.run('warden_quest_started = true;');
      const warden = notesOf(g).find(n => n.title === 'Warden Contract');
      assert.ok(warden, 'active Warden note present');
      assert.ok(/hidden spring meadow/.test(warden.body), 'Warden body names the hidden spring meadow');
      assert.ok(/far northwest corner/.test(warden.body), 'Warden body names the far northwest corner');
      assert.ok(!/dungeon|passage|floor 1/i.test(warden.body), 'Warden body no longer places it in the dungeon');
    }

    // ── Special-item header, descriptions, and deduplication ──────────────────
    {
      const g = createContext();
      g.run(RESET);
      g.run(`
        stats.items = [
          { name: 'Schilling',     questItem: true },
          { name: 'Schilling',     questItem: true },
          { name: 'Cat-Shaped Key', questItem: true },
          { name: 'Rope',          questItem: false },
          { name: 'Mystery Relic', questItem: true },
        ];
      `);
      assert.deepEqual(notesOf(g), [
        { header: 'SPECIAL ITEMS' },
        { title: 'Schilling',      body: "Pip's teddy bear. He's waiting for it back." },
        { title: 'Cat-Shaped Key', body: "Doesn't fit anything you own. Yet." },
        { title: 'Mystery Relic',  body: 'A quest item.' },
      ], 'header first, duplicate Schilling collapsed, non-quest item excluded, unknown item uses the fallback body');
    }

    // ── Calling the function mutates neither quest state nor inventory ────────
    {
      const g = createContext();
      g.run(RESET);
      g.run(`
        warden_quest_started = true;
        stats.items = [{ name: 'Schilling', questItem: true }];
      `);
      const before = g.run('JSON.stringify({ w: warden_quest_started, items: stats.items })');
      // Freshness + content stability are checked inside the vm realm so we
      // compare object identity in the realm that produced them.
      assert.equal(g.run('getActiveQuestNotes() !== getActiveQuestNotes()'), true,
        'each call returns a fresh array instance');
      assert.equal(g.run('JSON.stringify(getActiveQuestNotes()) === JSON.stringify(getActiveQuestNotes())'), true,
        'repeated calls with unchanged state return equal content');
      const after = g.run('JSON.stringify({ w: warden_quest_started, items: stats.items })');
      assert.equal(before, after, 'quest flags and inventory unchanged by the call');
    }
  },
};
