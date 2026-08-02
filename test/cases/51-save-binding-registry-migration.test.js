'use strict';
// Covers: the schema-driven quest-flag binding registry and the versioned
// save-migration layer (save.js).
//
//   • QUEST_FLAG_BINDINGS is the single source of truth: unique keys, a stable
//     ordered key set, and QUEST_FLAG_SCHEMA is DERIVED from it (not a second
//     hand-maintained list).
//   • saveGame()/loadGame() read/write every binding generically, so a complete
//     round-trip restores all 85 flags — lexical, window-native, numeric,
//     nullable — plus their window mirrors.
//   • A save missing a field falls back to that binding's declared default and
//     never inherits the current (possibly dirtied) runtime value.
//   • migrateSave() upgrades an old (v1) save forward, backs the original up,
//     and rewrites the normal key to v2 — and NEVER silently deletes a save it
//     cannot understand (malformed / future / unversioned / missing step all
//     return false and leave the file untouched).
//
// The "load-bearing verification" section (F) deliberately breaks each guarantee
// in-process and asserts the corresponding check then FAILS, so a future
// regression can't pass this test unnoticed. Every break is undone in a
// `finally` so a thrown assertion can't leave the context corrupted.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// The complete, ordered set of persistent flag keys as of this test's authoring
// (63 lexical + 22 window-native = 85). A binding added or removed without
// updating this snapshot fails section A — the point is that growing the save
// schema is a deliberate, reviewed act.
const EXPECTED_KEYS = [
  'cabinetCaseFlag', 'sluice_job_started', 'sluice_fixed', 'sluice_pay_ticket_ready',
  'sluice_reward_given', 'MainQuest', 'equipment_ticket_ready', 'letter_quest_stage',
  'cat_quest_stage', 'warden_quest_started', 'warden_quest_defeated', 'warden_quest_rewarded',
  'schilling_quest_started', 'schilling_returned', 'drama_stage', 'weight_quest_stage',
  'weight_note_signed', 'sentry_quest_started', 'sentry_quest_done', 'sentry_quest_rewarded',
  'pale_sentry_hp', 'sickle_quest_stage', 'gridd_rainfish_warned', 'rainfish_woken',
  'dispatch_quest_started', 'dispatch_delivered', 'dispatch_pay_ticket_ready', 'dispatch_rewarded',
  'fort_quest_started', 'fort_quest_stage', 'fort_pay_ticket_ready', 'fort_pay_ticket_reduced',
  'smugglers_dead', 'smugglers_execution_day', 'fort_report_filed', 'mq4_available_day',
  'reservoir_quest_started', 'den_wraith_quest_started', 'den_wraith_defeated', 'den_wraith_rewarded',
  'netto_letter_received', 'dessa_met', 'rareborn_rhyme_heard', 'vale_tutorial_seen',
  'esla_said_sluice', 'esla_said_dispatch', 'esla_said_cabinet', 'esla_said_polwick_pending',
  'esla_said_polwick_dead', 'esla_said_basin', 'supervisor_greet_day', 'esla_greet_day',
  'north_bridge_crossed_early', 'north_bridge_scolded', 'supervisor_said_flood', 'wine_quest_started',
  'wine_quest_gift', 'wine_quest_delivered', 'wine_quest_rewarded', 'upper_reach_seen',
  'basin_chamber_seen', 'sunken_gallery_seen', 'basin_chamber_exits', 'basin_chamber_dream_done',
  'sunken_gallery_recess_opened', 'sunken_gallery_drowned_freed', 'sunken_gallery_drowned_slain', 'sunken_gallery_gift_taken',
  'gallery_clue_silt', 'gallery_clue_satchel', 'gallery_clue_survey', 'gallery_clue_gauge',
  'gallery_clue_reliefs', 'gallery_clue_visitor', 'gallery_clue_notebook', 'gallery_clue_stair',
  'gallery_body_found', 'reservoir_report_filed', 'fourteenth_file_stage', 'fourteenth_file_offer_day',
  'fourteenth_file_offered', 'fourteenth_file_outcome', 'ff_clue_skiff', 'ff_clue_ledger',
  'ff_clue_dedication',
];

module.exports = {
  name: 'save binding registry + versioned migration: derive, round-trip, migrate, never delete',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    const G = (code) => g.run(code);
    // Assert that running `fn` throws an AssertionError — used by section F to
    // prove a check is load-bearing (it must fail once its guarantee is broken).
    const expectAssertFails = (fn, why) => {
      let threw = false;
      try { fn(); } catch (e) { threw = e && e.name === 'AssertionError'; }
      assert.equal(threw, true, 'load-bearing check should have failed but did not: ' + why);
    };

    // ── A. Binding-registry contract ────────────────────────────────────────
    assert.equal(G('typeof SAVE_VERSION'), 'number');
    assert.equal(G('SAVE_VERSION'), 2, 'SAVE_VERSION is 2');
    assert.equal(G('Array.isArray(window.QUEST_FLAG_BINDINGS)'), true, 'registry is exposed as an array');

    const keys = JSON.parse(G('JSON.stringify(window.QUEST_FLAG_BINDINGS.map(function(b){return b.key;}))'));
    assert.equal(keys.length, EXPECTED_KEYS.length, 'binding count matches the snapshot (' + EXPECTED_KEYS.length + ')');
    assert.deepEqual(keys, EXPECTED_KEYS, 'binding keys match the ordered snapshot exactly');
    assert.equal(new Set(keys).size, keys.length, 'binding keys are unique (no duplicates)');

    // QUEST_FLAG_SCHEMA is DERIVED from the binding keys, not a parallel list.
    assert.equal(
      G('JSON.stringify(QUEST_FLAG_SCHEMA) === JSON.stringify(window.QUEST_FLAG_BINDINGS.map(function(b){return b.key;}))'),
      true, 'QUEST_FLAG_SCHEMA is derived from the binding keys');
    assert.equal(G('window.QUEST_FLAG_SCHEMA === QUEST_FLAG_SCHEMA'), true, 'window.QUEST_FLAG_SCHEMA is the same derived array');

    // Every binding is structurally complete: has a `default`, callable get/set,
    // and a kind of 'lexical' or 'window'.
    const structuralProblems = JSON.parse(G(`JSON.stringify(
      window.QUEST_FLAG_BINDINGS.filter(function(b){
        return !('default' in b) || typeof b.get !== 'function' || typeof b.set !== 'function'
            || (b.kind !== 'lexical' && b.kind !== 'window');
      }).map(function(b){ return b.key; })
    )`));
    assert.deepEqual(structuralProblems, [], 'every binding has a default, callable get/set, and a valid kind');

    // Representative defaults across the three value shapes the schema uses.
    const defOf = (k) => JSON.parse(G(`JSON.stringify(window.QUEST_FLAG_BINDINGS.find(function(b){return b.key==='${k}';}).default)`));
    assert.equal(defOf('cabinetCaseFlag'), false, 'boolean default');
    assert.equal(defOf('pale_sentry_hp'), 500, 'numeric (non-zero) default');
    assert.equal(defOf('MainQuest'), 0, 'numeric stage default');
    assert.equal(defOf('basin_chamber_exits'), 0, 'window-native counter default');
    assert.equal(defOf('wine_quest_gift'), null, 'nullable default');
    // Both binding kinds are present.
    assert.equal(G("window.QUEST_FLAG_BINDINGS.some(function(b){return b.kind==='lexical';})"), true, 'has lexical bindings');
    assert.equal(G("window.QUEST_FLAG_BINDINGS.some(function(b){return b.kind==='window';})"), true, 'has window bindings');
    assert.equal(G("window.QUEST_FLAG_BINDINGS.filter(function(b){return b.kind==='lexical';}).length"), 63, '63 lexical bindings');
    assert.equal(G("window.QUEST_FLAG_BINDINGS.filter(function(b){return b.kind==='window';}).length"), 22, '22 window bindings');

    // ── B. Complete flag round-trip (all 85 bindings, generically) ──────────
    // Assign each binding a value distinct from its default, save, reset every
    // binding to its default, load, and confirm each restored to the saved
    // value. `__rt` stashes the expected value on the binding for comparison.
    G(`window.QUEST_FLAG_BINDINGS.forEach(function(b){
        var v;
        if (typeof b.default === 'boolean') v = !b.default;          // false -> true
        else if (typeof b.default === 'number') v = b.default + 137; // distinctive number
        else if (b.default === null) v = '<<rt-sentinel>>';          // nullable -> string
        else v = b.default;
        b.__rt = v; b.set(v);
      });`);
    G('saveGame();');
    // Reset everything to defaults so a stale value can't masquerade as restored.
    G('window.QUEST_FLAG_BINDINGS.forEach(function(b){ b.set(b.default); });');
    assert.equal(G('MainQuest'), 0, 'sanity: reset applied before load');
    assert.equal(G('loadGame()'), true, 'loadGame() succeeds on the round-trip save');

    const rtMismatches = JSON.parse(G(`JSON.stringify(
      window.QUEST_FLAG_BINDINGS.filter(function(b){
        return JSON.stringify(b.get()) !== JSON.stringify(b.__rt);
      }).map(function(b){ return b.key; })
    )`));
    assert.deepEqual(rtMismatches, [], 'every binding round-trips back to its saved value');

    // Window mirrors reflect restored lexical values (MainQuest is mirrored by
    // syncQuestFlagsToWindow), and window-native flags carry their own value.
    assert.equal(G('window.MainQuest'), G('MainQuest'), 'lexical MainQuest mirror updated after load');
    assert.equal(G('window.MainQuest'), 137, 'lexical mirror reflects the restored value');
    assert.equal(G('window.gallery_clue_silt'), true, 'window-native flag restored to saved value');
    assert.equal(G('window.basin_chamber_exits'), 137, 'window-native counter restored (not coerced to boolean)');
    assert.equal(G('wine_quest_gift'), '<<rt-sentinel>>', 'nullable flag restored to a non-null value');

    // ── C. Missing-field defaults never inherit the current session ─────────
    // A save that lacks a field must fall back to the binding default, even when
    // the in-memory value was dirtied to something else before loading.
    G('localStorage.clear(); saveGame();');
    G(`(function(){
        var d = JSON.parse(localStorage.getItem('verdantVale_save'));
        delete d.cabinetCaseFlag;   // boolean
        delete d.pale_sentry_hp;    // numeric (non-zero default)
        delete d.wine_quest_gift;   // nullable
        delete d.vale_tutorial_seen;// window-native boolean
        localStorage.setItem('verdantVale_save', JSON.stringify(d));
      })();`);
    G('cabinetCaseFlag = true; pale_sentry_hp = 777; wine_quest_gift = "DIRTY"; window.vale_tutorial_seen = true;');
    G('loadGame();');
    assert.equal(G('cabinetCaseFlag'), false, 'missing boolean flag defaults to false, not the dirtied true');
    assert.equal(G('pale_sentry_hp'), 500, 'missing numeric flag defaults to 500, not the dirtied 777');
    assert.equal(G('wine_quest_gift'), null, 'missing nullable flag defaults to null, not the dirtied string');
    assert.equal(G('window.vale_tutorial_seen'), false, 'missing window-native flag defaults to false, not the dirtied true');

    // ── D. v1 → v2 migration, backup, and no double-migration ───────────────
    // Build a realistic v1 payload: a full current save, downgraded to version 1
    // and stripped of two newer flags, with distinguishing non-flag fields.
    G('localStorage.clear();');
    G(`stats.gold = 4242; day = 9; MainQuest = 4; player.facing = 'up';`);
    G('window.vale_tutorial_seen = false;'); // will be absent in the v1 payload
    G('saveGame();'); // full v2 shape
    G(`(function(){
        var d = JSON.parse(localStorage.getItem('verdantVale_save'));
        d.version = 1;
        delete d.vale_tutorial_seen;  // an older save simply lacked this flag
        delete d.ff_clue_dedication;  // ...and this one
        localStorage.setItem('verdantVale_save', JSON.stringify(d));
      })();`);
    const rawV1 = G("localStorage.getItem('verdantVale_save')");
    // Dirty the runtime so we can tell restored-from-disk from left-over state.
    G('MainQuest = 99; stats.gold = 1; window.vale_tutorial_seen = true; window.ff_clue_dedication = true;');

    assert.equal(G('loadGame()'), true, 'a v1 save loads (via migration)');
    // Existing values survive the migration...
    assert.equal(G('MainQuest'), 4, 'existing flag value survives v1 migration');
    assert.equal(G('stats.gold'), 4242, 'non-flag field (gold) survives v1 migration');
    assert.equal(G('day'), 9, 'non-flag field (day) survives v1 migration');
    assert.equal(G('player.facing'), 'up', 'player field survives v1 migration');
    // ...and flags absent from the old save take their declared defaults.
    assert.equal(G('window.vale_tutorial_seen'), false, 'flag absent from v1 save defaults on migration');
    assert.equal(G('window.ff_clue_dedication'), false, 'second absent flag defaults on migration');
    // The normal key is now v2, and the original v1 text is backed up verbatim.
    assert.equal(G("JSON.parse(localStorage.getItem('verdantVale_save')).version"), 2, 'normal key upgraded to v2 after load');
    assert.equal(G("localStorage.getItem('verdantVale_save_backup_v1')"), rawV1, 'original v1 text preserved under the backup key, verbatim');

    // A pre-existing backup must never be overwritten by a later migration.
    G("localStorage.setItem('verdantVale_save_backup_v1', 'PRE-EXISTING');");
    G(`(function(){
        var d = JSON.parse(localStorage.getItem('verdantVale_save'));
        d.version = 1; localStorage.setItem('verdantVale_save', JSON.stringify(d));
      })();`);
    assert.equal(G('loadGame()'), true, 'a second v1 save still loads');
    assert.equal(G("localStorage.getItem('verdantVale_save_backup_v1')"), 'PRE-EXISTING', 'existing backup is never overwritten');

    // A normal v2 load neither re-migrates nor rewrites/backs-up.
    G("localStorage.clear(); saveGame();");
    const rawV2 = G("localStorage.getItem('verdantVale_save')");
    assert.equal(G('loadGame()'), true, 'a v2 save loads');
    assert.equal(G("localStorage.getItem('verdantVale_save')"), rawV2, 'a v2 load does not rewrite the save');
    assert.equal(G("localStorage.getItem('verdantVale_save_backup_v1')"), null, 'a v2 load creates no backup');

    // ── E. Never silently delete a save it cannot understand ────────────────
    const preserves = (label, corrupt) => {
      G('localStorage.clear(); saveGame();');
      G(corrupt);
      const before = G("localStorage.getItem('verdantVale_save')");
      const ok = G('loadGame()');
      const after = G("localStorage.getItem('verdantVale_save')");
      assert.equal(ok, false, label + ': loadGame() returns false');
      assert.equal(after, before, label + ': the save on disk is left untouched');
    };
    preserves('malformed JSON', "localStorage.setItem('verdantVale_save', '{ this is not json');");
    preserves('future version',
      `(function(){var d=JSON.parse(localStorage.getItem('verdantVale_save')); d.version=SAVE_VERSION+1; localStorage.setItem('verdantVale_save', JSON.stringify(d));})();`);
    preserves('no/invalid version',
      `(function(){var d=JSON.parse(localStorage.getItem('verdantVale_save')); delete d.version; localStorage.setItem('verdantVale_save', JSON.stringify(d));})();`);
    // Missing migration step: a v1 save with SAVE_MIGRATIONS[1] removed cannot
    // reach v2, so it must be refused (not partially loaded / deleted).
    G('localStorage.clear(); saveGame();');
    G(`(function(){var d=JSON.parse(localStorage.getItem('verdantVale_save')); d.version=1; localStorage.setItem('verdantVale_save', JSON.stringify(d));})();`);
    const savedStep = G('(function(){ window.__step1 = window.SAVE_MIGRATIONS[1]; delete window.SAVE_MIGRATIONS[1]; return true; })()');
    try {
      const beforeGap = G("localStorage.getItem('verdantVale_save')");
      assert.equal(G('loadGame()'), false, 'missing migration step: loadGame() returns false');
      assert.equal(G("localStorage.getItem('verdantVale_save')"), beforeGap, 'missing migration step: save left untouched');
    } finally {
      G('window.SAVE_MIGRATIONS[1] = window.__step1; delete window.__step1;');
    }
    assert.equal(G('loadGame()'), true, 'the v1 save loads again once the migration step is restored');

    // ── F. Load-bearing verification (break → confirm failure → restore) ────
    // F1. Break a binding's setter: the round-trip restore must then fail.
    G('localStorage.clear(); MainQuest = 5; saveGame(); MainQuest = 0;');
    const mqIdx = Number(G("window.QUEST_FLAG_BINDINGS.findIndex(function(b){return b.key==='MainQuest';})"));
    G(`window.__origSet = window.QUEST_FLAG_BINDINGS[${mqIdx}].set;
       window.QUEST_FLAG_BINDINGS[${mqIdx}].set = function(){};`); // swallow the write
    try {
      expectAssertFails(() => {
        G('loadGame()');
        assert.equal(G('MainQuest'), 5, 'MainQuest should restore to 5');
      }, 'a no-op setter must break the flag round-trip');
    } finally {
      G(`window.QUEST_FLAG_BINDINGS[${mqIdx}].set = window.__origSet; delete window.__origSet;`);
    }
    G('loadGame()');
    assert.equal(G('MainQuest'), 5, 'round-trip restore works again once the setter is restored');

    // F2. Break the v1→v2 registration: a v1 save must then fail to load.
    G(`(function(){var d=JSON.parse(localStorage.getItem('verdantVale_save')); d.version=1; localStorage.setItem('verdantVale_save', JSON.stringify(d));})();`);
    G('window.__m1 = window.SAVE_MIGRATIONS[1]; delete window.SAVE_MIGRATIONS[1];');
    try {
      expectAssertFails(() => {
        assert.equal(G('loadGame()'), true, 'v1 save should load');
      }, 'removing SAVE_MIGRATIONS[1] must make a v1 save unloadable');
    } finally {
      G('window.SAVE_MIGRATIONS[1] = window.__m1; delete window.__m1;');
    }
    assert.equal(G('loadGame()'), true, 'v1 save loads again once the migration is re-registered');

    // F3. Break the future-version guard: with migrateSave stubbed to accept any
    // version, a future save would (wrongly) load — proving the "returns false"
    // guard in section E is what protects future saves.
    G('localStorage.clear(); saveGame();');
    G(`(function(){var d=JSON.parse(localStorage.getItem('verdantVale_save')); d.version=SAVE_VERSION+1; localStorage.setItem('verdantVale_save', JSON.stringify(d));})();`);
    G('window.__origMigrate = migrateSave;');
    G('migrateSave = function(parsed){ return { ok: true, data: parsed, migratedFrom: null }; };'); // no guards
    try {
      expectAssertFails(() => {
        assert.equal(G('loadGame()'), false, 'a future-version save should be refused');
      }, 'without the future-version guard, a future save is no longer refused');
    } finally {
      G('migrateSave = window.__origMigrate; delete window.__origMigrate;');
    }
    assert.equal(G('loadGame()'), false, 'a future-version save is refused again once the guard is restored');

    g.renderFrame();
  },
};
