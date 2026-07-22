'use strict';
// Covers: the flag-dependent dialogue pass -- seven previously-static NPCs
// (Maren, Rhen, Edda, Cres, Orren, Kest, Foss) converted to the established
// `get dialogue()` pattern (base pages verbatim, flag-gated pages appended).
//
// Conventions under test, not just page counts:
//   - Maren keys on fort_report_filed (what was FILED), never smugglers_dead
//     alone -- same rule as the rest-week inn reactions.
//   - Rhen/Kest/Cres react to Upper Reach evidence via PLAUSIBLE physical
//     cues (mud on boots, river-bottom smell, the player's own unasked
//     question), all window-native (see save.js/quests.js). Cres keys on
//     the PERMANENT basin_chamber_seen discovery flag (a memory/decision,
//     not perishable evidence). Rhen/Kest key on the TEMPORARY same-day
//     upper_reach_visit_day/sunken_gallery_visit_day markers (movement.js)
//     instead -- physical evidence that expires the moment a day passes or
//     the game is loaded; see test 38 for that expiry behavior in detail.
//     This file only proves the reaction fires while the marker is set.
//   - Edda/Orren/Foss key on reservoir_quest_started (the MQ4 assignment).
//   - Base dialogue is unchanged when no flags are set.
//   - One real keypress interaction (Maren) shows the flag page in-game.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function npc(g, id) {
  return `SIMPLE_NPCS.find(n => n.id === '${id}')`;
}

module.exports = {
  name: 'flag-dependent dialogue: 7 NPCs react to filed reports, the basin assignment, and Upper Reach evidence',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // [id, baseline page count, flag-setting statement, text the new pages must contain]
    const CASES = [
      ['maren',                 2, 'fort_report_filed = true;',            'fen business'],
      ['maren',                 2, 'reservoir_quest_started = true;',      'basin road'],
      ['rhen',                  2, 'window.upper_reach_visit_day = day;',      'pale mud on your boots'],
      ['edda',                  2, 'reservoir_quest_started = true;',      'even reached the board'],
      ['cres',                 10, 'window.basin_chamber_seen = true;',    'no record at all'],
      ['drenwick_inn_1',        2, 'reservoir_quest_started = true;',      'reports stopped coming'],
      ['harbormaster_assistant', 4, 'window.sunken_gallery_visit_day = day;', 'bottom of a channel'],
      ['guild_registrar',       3, 'reservoir_quest_started = true;',      'documentation class three'],
    ];

    for (const [id, basePages, setFlag, needle] of CASES) {
      // Reset every flag this test touches, then verify the baseline.
      g.run(`
        fort_report_filed = false; reservoir_quest_started = false;
        window.upper_reach_seen = false; window.basin_chamber_seen = false; window.sunken_gallery_seen = false;
        window.upper_reach_visit_day = undefined; window.sunken_gallery_visit_day = undefined;
      `);
      assert.equal(g.run(`${npc(g, id)}.dialogue.length`), basePages,
        `${id}: base page count must be unchanged with no flags set`);
      const baseJson = g.run(`JSON.stringify(${npc(g, id)}.dialogue)`);

      g.run(setFlag);
      const withFlag = g.run(`${npc(g, id)}.dialogue.length`);
      assert.ok(withFlag > basePages,
        `${id}: setting the flag should append pages (${basePages} -> ${withFlag})`);
      assert.ok(g.run(`${npc(g, id)}.dialogue.flat().join(' ')`).includes(needle),
        `${id}: the appended pages should contain "${needle}"`);
      // The flag appends -- it must never rewrite the base pages in front.
      assert.equal(
        g.run(`JSON.stringify(${npc(g, id)}.dialogue.slice(0, ${basePages}))`),
        baseJson,
        `${id}: the base pages must be byte-identical with and without the flag`);
    }

    // ── One real interaction: Maren shows the basin-road page in-game ───────
    g.run(`
      reservoir_quest_started = true;
      inDungeon=false; inTown=false; inSluice=false; inMarenPost=true;
      activeMap = MAREN_POST_MAP;
      player.x = 7.5*TILE; player.y = 4.5*TILE; player.facing = 'down';
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'Maren should open dialogue');
    assert.equal(g.run('dialogue.name'), 'Maren');
    assert.ok(g.run('dialogue.pages.flat().join(" ")').includes('basin road'),
      'the in-game conversation should include the flag-gated page');
    g.run('dialogue.open = false; inMarenPost = false; reservoir_quest_started = false;');
  },
};
