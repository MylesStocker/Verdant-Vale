'use strict';
// Two Dayoff behaviors:
// 1. During the post-fen-post rest week (mq4_available_day set, reservoir
//    assignment not yet given), the office staff at the Calwick inn react to
//    the Polwick outcome: Supervisor/Petra/Corvin key on the filed report
//    (fort_report_filed), Esla keys on smugglers_dead itself (registry).
//    Found-nothing playthroughs and post-assignment dayoffs get the ordinary
//    lines.
// 2. Drenwick's shop (the Provision Store) and school are closed on Dayoff;
//    walking into the store door on a Dayoff shows a closed notice instead
//    of entering.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function talkThrough(g, expectedName) {
  g.press('Enter');
  assert.equal(g.run('dialogue.open'), true, 'dialogue should open');
  assert.equal(g.run('dialogue.name'), expectedName);
  const text = JSON.stringify(g.run('dialogue.pages')).toLowerCase();
  const pageCount = g.run('dialogue.pages.length');
  for (let i = 0; i < pageCount; i++) g.press('Enter');
  return text;
}

module.exports = {
  name: 'rest-week inn reactions (outcome-aware) + Drenwick Dayoff closures',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue
    // Deterministically fail the Fourteenth File's 1/3 Dayoff availability roll
    // so it never supersedes the supervisor's ordinary/rest-week Dayoff lines
    // this test asserts (the quest itself is covered by its own test).
    g.run('Math.random = () => 0.9;');

    // ── Rest-week Dayoff at the Calwick inn, killed-and-reported outcome ────
    g.run(`
      inTown = true;
      currentTownId = 'calwick';
      townBuilding = 'inn';
      netto_letter_received = true;
      fort_quest_started = true;
      fort_quest_stage = 6;
      MainQuest = 3;
      smugglers_dead = true;
      fort_report_filed = true;
      mq4_available_day = 11;
      day = 10; // the rest week's Dayoff
      syncQuestFlagsToWindow();
      player.x = SUPERVISOR_DAYOFF.x;
      player.y = SUPERVISOR_DAYOFF.y;
    `);
    assert.ok(/drink i’m not drinking/.test(talkThrough(g, 'Supervisor')), 'supervisor: killed variant');
    g.run('player.x = ESLA_DAYOFF.x; player.y = ESLA_DAYOFF.y;');
    assert.ok(/closed his registry file/.test(talkThrough(g, 'Esla')), 'Esla: killed variant');
    const petraKilled = JSON.stringify(g.run("SIMPLE_NPCS.find(n => n.id === 'petra').dialogue")).toLowerCase();
    assert.ok(/column/.test(petraKilled), 'Petra: killed variant');
    const corvinKilled = JSON.stringify(g.run("SIMPLE_NPCS.find(n => n.id === 'corvin').dialogue")).toLowerCase();
    assert.ok(/three entries/.test(corvinKilled), 'Corvin: killed variant');

    // ── Reported (spared) outcome ───────────────────────────────────────────
    g.run('smugglers_dead = false; smugglers_execution_day = 12; syncQuestFlagsToWindow();');
    g.run('player.x = SUPERVISOR_DAYOFF.x; player.y = SUPERVISOR_DAYOFF.y;');
    assert.ok(/ledger is unconvinced/.test(talkThrough(g, 'Supervisor')), 'supervisor: reported variant');
    g.run('player.x = ESLA_DAYOFF.x; player.y = ESLA_DAYOFF.y;');
    assert.ok(/didn’t feel true/.test(talkThrough(g, 'Esla')), 'Esla: reported variant');
    assert.ok(/glad the rest doesn/.test(
      JSON.stringify(g.run("SIMPLE_NPCS.find(n => n.id === 'petra').dialogue")).toLowerCase()), 'Petra: reported variant');
    assert.ok(/countersign/.test(
      JSON.stringify(g.run("SIMPLE_NPCS.find(n => n.id === 'corvin').dialogue")).toLowerCase()), 'Corvin: reported variant');

    // ── Found-nothing playthrough: nobody breaks character ──────────────────
    g.run('fort_report_filed = false; smugglers_execution_day = 0; syncQuestFlagsToWindow();');
    g.run('player.x = SUPERVISOR_DAYOFF.x; player.y = SUPERVISOR_DAYOFF.y;');
    assert.ok(/fourteen years/.test(talkThrough(g, 'Supervisor')), 'supervisor: base line when nothing was reported');
    assert.ok(/thought about the ledger/.test(
      JSON.stringify(g.run("SIMPLE_NPCS.find(n => n.id === 'petra').dialogue")).toLowerCase()), 'Petra: base Dayoff line');

    // ── Window closes once the reservoir assignment is given ────────────────
    g.run('smugglers_dead = true; fort_report_filed = true; reservoir_quest_started = true; syncQuestFlagsToWindow();');
    assert.ok(/fourteen years/.test(talkThrough(g, 'Supervisor')), 'supervisor: back to base after the assignment');

    // ── Drenwick Dayoff closures ────────────────────────────────────────────
    assert.equal(g.run("isClosedToday('provision_store')"), true, 'store closed on Dayoff');
    assert.equal(g.run("isClosedToday('school')"), true, 'school closed on Dayoff');
    g.run('day = 11;');
    assert.equal(g.run("isClosedToday('provision_store')"), false, 'store open on a workday');
    g.run('day = 10;');

    // Walk into the Provision Store door (Canal/Docks col 11 row 6) on Dayoff:
    // a closed notice, and the player stays outside.
    g.run(`
      currentTownId = 'drenwick';
      townBuilding = null;
      activeMap = DRENWICK_CANAL_DOCKS_MAP;
      player.x = 11.5 * TILE;
      player.y = 7.5 * TILE;
    `);
    g.hold('ArrowUp');
    let doorResult = null;
    for (let i = 0; i < 40; i++) {
      g.frames(1);
      if (g.run('dialogue.open')) { doorResult = 'dialogue'; break; }
      if (g.run('townBuilding') !== null) { doorResult = 'entered'; break; }
    }
    g.release('ArrowUp');
    assert.equal(doorResult, 'dialogue', 'Dayoff: the store door should show a notice, not open');
    assert.equal(g.run('dialogue.name'), 'Store Door');
    assert.ok(/closed for dayoff/.test(JSON.stringify(g.run('dialogue.pages')).toLowerCase()));
    assert.equal(g.run('townBuilding'), null, 'player must not have entered the store');
    g.press('Enter'); // close the door notice

    // ── Drenwick office/school staff relocate on Dayoff (day is still 10) ───
    const staffWhereabouts = JSON.parse(g.run(`JSON.stringify(
      ['district_officer', 'drenwick_clerk', 'thread_officer',
       'drenwick_teacher_ground', 'drenwick_teacher_upper']
        .map(id => [id, SIMPLE_NPCS.find(n => n.id === id).map]))`));
    assert.deepEqual(Object.fromEntries(staffWhereabouts), {
      district_officer:        'drenwick_inn',
      drenwick_clerk:          'drenwick_inn',
      thread_officer:          'drenwick_wash_house',
      drenwick_teacher_ground: 'drenwick_wash_house',
      drenwick_teacher_upper:  'drenwick_inn',
    }, 'all five Drenwick staff should be at the inn or wash house on Dayoff');

    const staffLine = id => JSON.stringify(
      g.run(`SIMPLE_NPCS.find(n => n.id === '${id}').dialogue`)).toLowerCase();
    assert.ok(/incapable of emergencies/.test(staffLine('district_officer')), 'Veth: off-duty lines');
    assert.ok(/somebody else’s tragedy/.test(staffLine('drenwick_clerk')), 'Holt: off-duty lines');
    assert.ok(/steam is good for the joints/.test(staffLine('thread_officer')), 'Sable: wash house lines');
    assert.ok(/nobody asks me a single question/.test(staffLine('drenwick_teacher_ground')), 'Oben: wash house lines');
    assert.ok(/keep the receipts/.test(staffLine('drenwick_teacher_upper')), 'Farne: inn (off-duty) lines');

    // No two NPCs share a tile in the Dayoff inn/wash house crowd.
    const spots = JSON.parse(g.run(`JSON.stringify(
      SIMPLE_NPCS.filter(n => n.map === 'drenwick_inn' || n.map === 'drenwick_wash_house')
        .map(n => n.map + ':' + n.x + ',' + n.y))`));
    assert.equal(new Set(spots).size, spots.length, 'no overlapping Dayoff NPC positions: ' + spots.join(' | '));

    // Workday: everyone back at their desks with their original dialogue.
    g.run('day = 11;');
    assert.equal(g.run("SIMPLE_NPCS.find(n => n.id === 'district_officer').map"), 'drenwick_office');
    assert.equal(g.run("SIMPLE_NPCS.find(n => n.id === 'thread_officer').map"), 'drenwick_office');
    assert.equal(g.run("SIMPLE_NPCS.find(n => n.id === 'drenwick_teacher_upper').map"), 'drenwick_school_upper');
    assert.ok(/calwick posting/.test(staffLine('district_officer')), 'Veth: office lines return on workdays');
    assert.ok(/district tier/.test(staffLine('drenwick_teacher_upper')), 'Farne: school lines return on workdays');
  },
};
