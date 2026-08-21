'use strict';
// Covers: the side quest "The Fourteenth File" — assigned by the Supervisor at
// the Calwick inn on a Dayoff at a 1/3 chance, three drought-exposed clues on
// far-flung accessible maps (MAP5 skiff, MAP3 dedication, RODDON_WAY_MAP
// ledger), and the report + moral choice (file the truth vs seal the dead
// Warden's part). Flags in quests.js/save.js/validation.js; dialogue + clues +
// reportFourteenthFile()/finishFourteenthFile() in interactions.js. The clue
// flags (ff_clue_*) follow the window-native MAP_FEATURES `flag` pattern of the
// Sunken Gallery observer clues.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const T = 32;
// clue coordinates (verified walkable / non-transition / NPC-clear on the live maps)
const CLUES = {
  skiff:      { map: 'MAP5',           x: 8.5,  y: 7.5,  flag: 'ff_clue_skiff' },
  dedication: { map: 'MAP3',           x: 8.5,  y: 12.5, flag: 'ff_clue_dedication' },
  ledger:     { map: 'RODDON_WAY_MAP', x: 13.5, y: 13.5, flag: 'ff_clue_ledger' },
};

function dismiss(g) { for (let i = 0; i < 16 && g.run('dialogue.open'); i++) g.press(' '); }
function pagesText(g) { return g.run("dialogue.pages ? dialogue.pages.flat().join(' ') : ''"); }

// Fresh game with the intro closed and the FF roll pinned (0.9 => the 1/3 offer
// roll fails unless a test re-pins it lower).
function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run('debugMode = true;');
  g.run('Math.random = () => 0.9;');
  return g;
}

// Put the player at the Supervisor's Dayoff inn table (Calwick), on a Dayoff.
function atDayoffSupervisor(g, day) {
  g.run(`inTown = true; inDungeon = false; inSluice = false; inFenBrewery = false; inSmugglerFort = false; inBridgePost = false;
         currentTownId = 'calwick'; townBuilding = 'inn'; day = ${day};
         player.x = SUPERVISOR_DAYOFF.x; player.y = SUPERVISOR_DAYOFF.y;
         dialogue.open = false; choice.open = false;`);
}

// Inspect a clue feature on its map (drives the real MAP_FEATURES path).
function inspectClue(g, key) {
  const c = CLUES[key];
  g.run(`dialogue.open = false; choice.open = false;
         inTown = false; inDungeon = false; inSluice = false; inMireVault = false; inTakomo = false;
         inFenBrewery = false; inHamletInterior = false; inDungeonEntrance = false; inBridgePost = false;
         inSmugglerFort = false; inBasinChamber = false; inSunkenGallery = false; inLorraHouse = false; inAbandonedFarmhouse = false;
         inMarenPost = false; inDrenwrickPost = false; townBuilding = null;
         activeMap = ${c.map}; player.x = ${c.x} * TILE; player.y = ${c.y} * TILE; player.facing = 'down';`);
  g.run('handleInteract();');
  const txt = pagesText(g);
  dismiss(g);
  return txt;
}

module.exports = {
  name: 'The Fourteenth File: 1/3 Dayoff assignment, three far-flung clues, report + moral choice',
  run() {
    // ── 1. Availability roll: offered / not offered / stable within a Dayoff ─
    let g = fresh();
    g.run('MainQuest = 3; reservoir_quest_started = true; mq4_available_day = 0; syncQuestFlagsToWindow();');
    // Roll fails (0.9): ordinary supervisor Dayoff line, no offer.
    atDayoffSupervisor(g, 10);
    g.run('handleInteract();');
    assert.ok(!/off the clock|Halden Marsh/.test(pagesText(g)), 'roll-fail Dayoff: no Fourteenth File offer');
    assert.equal(g.run('fourteenth_file_offered'), false, 'roll recorded as not offered');
    assert.equal(g.run('fourteenth_file_offer_day'), 10, 'roll day recorded');
    dismiss(g);

    // Roll succeeds (0.1) on a NEW Dayoff: the offer appears.
    g.run('Math.random = () => 0.1;');
    atDayoffSupervisor(g, 15);
    g.run('handleInteract();');
    assert.match(pagesText(g), /Halden Marsh|off the clock|presumed lost/, 'roll-pass Dayoff: the offer is made');
    assert.equal(g.run('fourteenth_file_offered'), true);
    // Stable within the same Dayoff even if the roll would now fail: no reroll.
    g.run('Math.random = () => 0.9;');
    dismiss(g); g.run('choice.open = false;');
    atDayoffSupervisor(g, 15);
    g.run('handleInteract();');
    assert.match(pagesText(g), /Halden Marsh|off the clock|presumed lost/, 'same Dayoff: still offered (no reroll)');
    dismiss(g); g.run('choice.open = false;');

    // ── 2. Gating: not during the fen-post rest week, not below MainQuest 1 ──
    let r = fresh();
    r.run('Math.random = () => 0.1;'); // would offer if eligible
    r.run('MainQuest = 3; mq4_available_day = 11; reservoir_quest_started = false; fort_report_filed = false; syncQuestFlagsToWindow();'); // rest week
    atDayoffSupervisor(r, 10);
    r.run('handleInteract();');
    assert.ok(!/Halden Marsh|off the clock/.test(pagesText(r)), 'no offer during the fen-post rest week');
    dismiss(r);
    r.run('mq4_available_day = 0; MainQuest = 0; syncQuestFlagsToWindow();'); // pre-investigator
    atDayoffSupervisor(r, 20);
    r.run('handleInteract();');
    assert.ok(!/Halden Marsh|off the clock/.test(pagesText(r)), 'no offer below MainQuest 1');
    dismiss(r);

    // ── 3. Accept assigns the case (stage 1) ────────────────────────────────
    g = fresh();
    g.run('Math.random = () => 0.1; MainQuest = 3; reservoir_quest_started = true; syncQuestFlagsToWindow();');
    atDayoffSupervisor(g, 10);
    g.run('handleInteract();'); dismiss(g); // offer pages -> choice
    assert.equal(g.run('choice.open'), true);
    assert.match(g.run("choice.options.join('|')"), /Take the case/);
    g.run('choice.cursor = 0;'); g.press(' '); // Take the case
    assert.equal(g.run('fourteenth_file_stage'), 1, 'accepting assigns the case');
    dismiss(g);

    // ── 4. Clues appear only while investigating; inspecting records them ────
    // At stage 1 the skiff clue is present and sets its flag.
    assert.match(inspectClue(g, 'skiff'), /HALDEN MARSH|foundered skiff|tally-book/, 'skiff clue shows while investigating');
    assert.equal(g.run('!!window.ff_clue_skiff'), true, 'skiff flag recorded');
    assert.match(inspectClue(g, 'dedication'), /REEVE CALLIS|dedication|daughter/, 'dedication clue shows');
    assert.equal(g.run('!!window.ff_clue_dedication'), true);
    assert.match(inspectClue(g, 'ledger'), /CALLIS|works coffer|drainage-fund/, 'ledger clue shows');
    assert.equal(g.run('!!window.ff_clue_ledger'), true);

    // Condition gating: with the case NOT active, the same spot yields no clue.
    let ng = fresh();
    ng.run('fourteenth_file_stage = 0; syncQuestFlagsToWindow();');
    const none = inspectClue(ng, 'skiff');
    assert.ok(!/HALDEN MARSH|foundered skiff/.test(none), 'no clue when the case is not active');
    assert.equal(ng.run('!!window.ff_clue_skiff'), false, 'no flag set when the case is not active');

    // ── 5. Report with all three clues → the moral choice; both outcomes ────
    function assignedWithClues(clueList) {
      const c = fresh();
      c.run('MainQuest = 3; reservoir_quest_started = true; fourteenth_file_stage = 1;');
      for (const k of clueList) c.run(`window.${CLUES[k].flag} = true;`);
      c.run('syncQuestFlagsToWindow();');
      return c;
    }
    for (const outcome of [{ opt: 0, val: 1, re: /record true|reclassified/ },
                           { opt: 1, val: 2, re: /keeps his stone|seal/i }]) {
      const c = assignedWithClues(['skiff', 'ledger', 'dedication']);
      atDayoffSupervisor(c, 10);
      c.run('handleInteract();'); dismiss(c); // report-offer -> choice
      assert.match(c.run("choice.options.join('|')"), /Report what I found/, 'report offered with clues in hand');
      c.run('choice.cursor = 0;'); c.press(' '); // Report what I found -> reconstruction
      dismiss(c); // reconstruction pages -> moral choice
      assert.equal(c.run('choice.open'), true, 'moral choice presented when the cover-up is proven');
      assert.match(c.run("choice.options.join('|')"), /File it accurately/);
      const goldBefore = c.run('stats.gold');
      c.run(`choice.cursor = ${outcome.opt};`); c.press(' ');
      dismiss(c);
      assert.equal(c.run('fourteenth_file_stage'), 2, 'quest completes');
      assert.equal(c.run('fourteenth_file_outcome'), outcome.val, 'outcome recorded');
      assert.equal(c.run('stats.gold') - goldBefore, 150, 'full field-rate pay (3 clues)');
      assert.equal(c.run("stats.items.some(i => i.name === 'Elixir')"), true, 'commendation item granted');
      assert.match(pagesText(c), outcome.re, 'outcome-specific closing text');
    }

    // ── 6. Partial report (skiff only): no dilemma, lesser pay ──────────────
    let p = assignedWithClues(['skiff']);
    atDayoffSupervisor(p, 10);
    p.run('handleInteract();'); dismiss(p);
    p.run('choice.cursor = 0;'); p.press(' '); // Report what I found
    // No second (moral) choice — a partial report resolves directly.
    assert.equal(p.run('choice.open'), false, 'no moral choice without the implicating clues');
    const gPartial = p.run('stats.gold');
    dismiss(p);
    assert.equal(p.run('fourteenth_file_stage'), 2, 'partial report still completes');
    assert.equal(p.run('fourteenth_file_outcome'), 0, 'no verdict outcome on a partial report');
    assert.equal(p.run("stats.items.some(i => i.name === 'Elixir')"), false, 'no commendation item on a partial report');

    // ── 7. Nudge when assigned but the skiff hasn't been found yet ───────────
    let n = fresh();
    n.run('MainQuest = 3; reservoir_quest_started = true; fourteenth_file_stage = 1; syncQuestFlagsToWindow();');
    atDayoffSupervisor(n, 10);
    n.run('handleInteract();');
    assert.match(pagesText(n), /shallows|skiff|boat/, 'nudges toward the wreck before it is found');
    assert.equal(n.run('choice.open'), false, 'no report offered before the skiff is found');
    dismiss(n);

    // ── 8. Save/load persists all quest + clue state ────────────────────────
    let s = assignedWithClues(['skiff', 'ledger']);
    s.run('fourteenth_file_offer_day = 15; fourteenth_file_offered = true; syncQuestFlagsToWindow();');
    s.run('saveGame();');
    s.run('fourteenth_file_stage = 0; window.ff_clue_skiff = false; window.ff_clue_ledger = false; fourteenth_file_offer_day = 0;');
    s.run('loadGame();');
    assert.equal(s.run('fourteenth_file_stage'), 1, 'stage restored');
    assert.equal(s.run('fourteenth_file_offer_day'), 15, 'offer day restored');
    assert.equal(s.run('!!window.ff_clue_skiff'), true, 'skiff clue flag restored');
    assert.equal(s.run('!!window.ff_clue_ledger'), true, 'ledger clue flag restored');
    assert.equal(s.run('!!window.ff_clue_dedication'), false, 'unfound clue stays unfound');

    // ── 9. Exactly the intended new flags exist in the save schema ──────────
    for (const k of ['fourteenth_file_stage', 'fourteenth_file_offer_day', 'fourteenth_file_offered',
                     'fourteenth_file_outcome', 'ff_clue_skiff', 'ff_clue_ledger', 'ff_clue_dedication'])
      assert.equal(g.run(`QUEST_FLAG_SCHEMA.includes('${k}')`), true, k + ' is in QUEST_FLAG_SCHEMA');
  },
};
