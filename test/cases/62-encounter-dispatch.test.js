'use strict';
// Phase 2 refactor guard: dialogue completion is consolidated in
// finishDialogue() and every fight is queued through the single generic
// path (queueDialogueEncounter(id) -> dialogue.triggerEncounterId ->
// ENCOUNTER_HANDLERS[id]) instead of the old per-fight trigger* booleans.
//
// These tests pin: encounters wait for the last page, each id dispatches its
// intended start* function, each queued encounter fires exactly once,
// callbacks run before the encounter, reopen-dialogue callbacks still work,
// unknown ids warn+clear without starting combat, and no obsolete specialized
// trigger fields survive on the dialogue object.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Replace each real combat starter with a spy that records its name, so we can
// observe dispatch without driving real combat. ENCOUNTER_HANDLERS wraps these
// in closures that look the globals up at call time, so reassigning them here
// is exactly what the dispatcher will invoke.
const STUBS = `
  __enc = [];
  startBossCombat        = function(){ __enc.push('startBossCombat'); };
  startWardenCombat      = function(){ __enc.push('startWardenCombat'); };
  startFortGuardCombat   = function(){ __enc.push('startFortGuardCombat'); };
  startFortPolwickCombat = function(){ __enc.push('startFortPolwickCombat'); };
  startFortEssaCombat    = function(){ __enc.push('startFortEssaCombat'); };
  startMulhollandCombat  = function(){ __enc.push('startMulhollandCombat'); };
  startDenWraithCombat   = function(){ __enc.push('startDenWraithCombat'); };
  startTakomoCombat      = function(){ __enc.push('startTakomoCombat'); };
  startSailorBrawlCombat = function(){ __enc.push('startSailorBrawlCombat'); };
`;

// id -> the starter its ENCOUNTER_HANDLERS entry must call.
const ID_TO_STARTER = {
  boss:         'startBossCombat',
  warden:       'startWardenCombat',
  fort_guard:   'startFortGuardCombat',
  fort_polwick: 'startFortPolwickCombat',
  fort_essa:    'startFortEssaCombat',
  mulholland:   'startMulhollandCombat',
  den_wraith:   'startDenWraithCombat',
  takomo:       'startTakomoCombat',
  kolm_brawler: 'startSailorBrawlCombat',
};

const OBSOLETE_FIELDS = [
  'triggerBossCombat', 'triggerWardenCombat', 'triggerFortGuardCombat',
  'triggerFortPolwickCombat', 'triggerFortEssaCombat', 'triggerMulhollandCombat',
  'triggerDenWraithCombat', 'triggerTakomoCombat', 'triggerEncounter',
];

module.exports = {
  name: 'encounter dispatch: finishDialogue() + generic queue (order, once, unknown, no legacy fields)',
  run() {
    // ── Encounters do not start before the last dialogue page ────────────────
    {
      const g = createContext();
      g.run(STUBS);
      g.run(`
        dialogue.open = true;
        dialogue.pages = [['line one'], ['line two']];
        dialogue.page = 0;
        dialogue.callbacks = null;
        queueDialogueEncounter('warden');
      `);
      g.press('Enter'); // advance to page 2 of 2 — not yet closed
      assert.equal(g.run('dialogue.open'), true, 'still open on the non-final page');
      assert.equal(g.run('__enc.length'), 0, 'no encounter dispatched before the last page');

      g.press('Enter'); // final page closes -> finishDialogue()
      assert.equal(g.run('dialogue.open'), false, 'dialogue closed on the last page');
      assert.equal(g.run('dialogue.page'), 0, 'page reset');
      assert.deepEqual(JSON.parse(g.run('JSON.stringify(__enc)')), ['startWardenCombat'],
        'the queued encounter starts only after the final page');
      assert.equal(g.run('dialogue.triggerEncounterId'), null, 'id cleared after dispatch');
    }

    // ── Every migrated id dispatches its intended starter, exactly once ──────
    {
      const g = createContext();
      g.run(STUBS);
      for (const [id, starter] of Object.entries(ID_TO_STARTER)) {
        g.run(`
          __enc = [];
          dialogue.open = true; dialogue.pages = [['x']]; dialogue.page = 0;
          dialogue.callbacks = null;
          queueDialogueEncounter(${JSON.stringify(id)});
          finishDialogue();
        `);
        assert.deepEqual(JSON.parse(g.run('JSON.stringify(__enc)')), [starter],
          `id "${id}" must dispatch ${starter} exactly once`);

        // A repeated finalize (e.g. an extra interact press) must not re-fire.
        g.run('finishDialogue();');
        assert.equal(g.run('__enc.length'), 1, `id "${id}" must not dispatch twice`);
        assert.equal(g.run('dialogue.triggerEncounterId'), null, `id "${id}" cleared`);
      }
    }

    // ── Callback runs before the encounter dispatch ──────────────────────────
    {
      const g = createContext();
      g.run(STUBS);
      g.run(`
        __enc = [];
        dialogue.open = true; dialogue.pages = [['x']]; dialogue.page = 0;
        dialogue.callbacks = [function(){ __enc.push('callback'); }];
        queueDialogueEncounter('boss');
        finishDialogue();
      `);
      assert.deepEqual(JSON.parse(g.run('JSON.stringify(__enc)')), ['callback', 'startBossCombat'],
        'callback executes before the encounter starter');
    }

    // ── Callback that reopens dialogue retains its behavior ──────────────────
    {
      const g = createContext();
      g.run(STUBS);
      g.run(`
        __enc = [];
        dialogue.open = true; dialogue.pages = [['first']]; dialogue.page = 0;
        dialogue.callbacks = [function(){
          dialogue.open = true;
          dialogue.pages = [['second, reopened']];
          dialogue.page = 0;
        }];
        finishDialogue();
      `);
      assert.equal(g.run('dialogue.open'), true, 'callback reopened the dialogue');
      assert.equal(g.run("dialogue.pages[0][0]"), 'second, reopened', 'reopened with the new page');
      assert.equal(g.run('__enc.length'), 0, 'no encounter queued -> none dispatched');
    }

    // ── Unknown id warns, clears, and does not start combat ──────────────────
    {
      const g = createContext();
      g.run(STUBS);
      g.run(`
        __warn = [];
        console = { warn: function(m){ __warn.push(String(m)); }, log: function(){}, error: function(){}, info: function(){} };
        __enc = [];
        dialogue.open = true; dialogue.pages = [['x']]; dialogue.page = 0;
        dialogue.callbacks = null;
        queueDialogueEncounter('no_such_fight');
        finishDialogue();
      `);
      assert.equal(g.run('__enc.length'), 0, 'unknown id starts no combat');
      assert.equal(g.run('dialogue.triggerEncounterId'), null, 'unknown id is cleared');
      assert.equal(g.run('combat.active'), false, 'no fight became active');
      assert.equal(g.run('__warn.length >= 1'), true, 'a warning was emitted');
      assert.equal(g.run("__warn.some(m => m.indexOf('no_such_fight') !== -1)"), true,
        'the warning names the offending id');
    }

    // ── No obsolete specialized trigger fields remain on `dialogue` ──────────
    {
      const g = createContext();
      for (const field of OBSOLETE_FIELDS) {
        assert.equal(g.run(`'${field}' in dialogue`), false,
          `obsolete field "${field}" must not exist on the initial dialogue state`);
      }
      assert.equal(g.run("'triggerEncounterId' in dialogue"), true,
        'the generic triggerEncounterId field is present');
    }
  },
};
