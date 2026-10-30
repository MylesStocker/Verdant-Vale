'use strict';

// save.js — save-file schema and the saveGame()/loadGame() implementations.

// v5 adds the ordered persistent party, non-Lely state and reward receipts.
// No v4 migration: Lely remains in the established stats/statusEffects fields.
// Only the current version is accepted. Mismatched saves stay untouched on disk;
// no version migration or location fallback is attempted.
const SAVE_VERSION = 5;

// ─── Authoritative quest/world-flag binding registry ─────────────────────────
// ONE source of truth for every persistent quest/world flag. Each binding owns:
//   key     — the stable, flat, top-level save-object key
//   default — the exact runtime default (used to seed a missing field on load,
//             and by the v1→v2 migration; a FRESH copy is taken each time)
//   get()   — returns the authoritative runtime value
//   set(v)  — writes the authoritative runtime value
//   kind    — 'lexical' (a quests.js/state.js `let`; get/set close over it) or
//             'window' (a window[key] property; get/set are generic)
// `QUEST_FLAG_SCHEMA` is DERIVED from these keys, so saveGame()/loadGame() and
// validation stay in agreement automatically. Adding a persistent flag is a
// single binding entry here (plus, for a lexical flag, its owning `let`
// declaration and its syncQuestFlagsToWindow() mirror in quests.js) — there is
// NO separate manual load assignment to maintain any more.
// Value shapes derive from the binding, not a second list of quest names or
// today's maximum stage/count. Closed quest invariants remain with their owners.
function validBoundSaveValue(value, def) {
  if (typeof def === 'boolean') return typeof value === 'boolean';
  if (typeof def === 'number') return Number.isSafeInteger(value) && value >= 0;
  if (def === null) return value === null || typeof value === 'string';
  if (typeof def === 'string') return typeof value === 'string';
  return false; // New structured bindings require an explicit validation contract.
}
function lex(key, def, get, set) { return { key: key, default: def, get: get, set: set, kind: 'lexical' }; }
function win(key, def) {
  return { key: key, default: def, kind: 'window',
           get: function () { return window[key]; },
           set: function (v) { window[key] = v; } };
}
// A fresh copy of a declared default — defensive against shared mutable
// object/array defaults. Every current default is a primitive or null, so this
// is a pass-through for them; it deep-copies only if an object/array default is
// ever introduced.
function cloneDefaultValue(v) {
  if (Array.isArray(v)) return v.slice();
  if (v && typeof v === 'object') return JSON.parse(JSON.stringify(v));
  return v;
}

const QUEST_FLAG_BINDINGS = [
  // ── Lexical (quests.js / state.js `let` bindings) ──────────────────────────
  lex('cabinetCaseFlag', false, () => cabinetCaseFlag, (v) => { cabinetCaseFlag = v; }),
  lex('sluice_job_started', false, () => sluice_job_started, (v) => { sluice_job_started = v; }),
  lex('sluice_fixed', false, () => sluice_fixed, (v) => { sluice_fixed = v; }),
  lex('sluice_pay_ticket_ready', false, () => sluice_pay_ticket_ready, (v) => { sluice_pay_ticket_ready = v; }),
  lex('sluice_reward_given', false, () => sluice_reward_given, (v) => { sluice_reward_given = v; }),
  lex('MainQuest', 0, () => MainQuest, (v) => { MainQuest = v; }),
  lex('sera_liora_opening_complete', false, () => sera_liora_opening_complete, (v) => { sera_liora_opening_complete = v; }),
  lex('travellers_rise_ambush_complete', false, () => travellers_rise_ambush_complete, (v) => { travellers_rise_ambush_complete = v; }),
  lex('travellers_rise_ambush_paid', false, () => travellers_rise_ambush_paid, (v) => { travellers_rise_ambush_paid = v; }),
  lex('travellers_rise_ambush_payment', 0, () => travellers_rise_ambush_payment, (v) => { travellers_rise_ambush_payment = v; }),
  lex('travellers_rise_camp_stage', 0, () => travellers_rise_camp_stage, (v) => { travellers_rise_camp_stage = v; }),
  lex('equipment_ticket_ready', false, () => equipment_ticket_ready, (v) => { equipment_ticket_ready = v; }),
  lex('letter_quest_stage', 0, () => letter_quest_stage, (v) => { letter_quest_stage = v; }),
  lex('cat_quest_stage', 0, () => cat_quest_stage, (v) => { cat_quest_stage = v; }),
  lex('warden_quest_started', false, () => warden_quest_started, (v) => { warden_quest_started = v; }),
  lex('warden_quest_defeated', false, () => warden_quest_defeated, (v) => { warden_quest_defeated = v; }),
  lex('warden_quest_rewarded', false, () => warden_quest_rewarded, (v) => { warden_quest_rewarded = v; }),
  lex('schilling_quest_started', false, () => schilling_quest_started, (v) => { schilling_quest_started = v; }),
  lex('schilling_returned', false, () => schilling_returned, (v) => { schilling_returned = v; }),
  lex('drama_stage', 0, () => drama_stage, (v) => { drama_stage = v; }),
  lex('weight_quest_stage', 0, () => weight_quest_stage, (v) => { weight_quest_stage = v; }),
  lex('weight_note_signed', false, () => weight_note_signed, (v) => { weight_note_signed = v; }),
  lex('sentry_seen_on_board', false, () => sentry_seen_on_board, (v) => { sentry_seen_on_board = v; }),
  lex('sentry_quest_started', false, () => sentry_quest_started, (v) => { sentry_quest_started = v; }),
  lex('sentry_quest_done', false, () => sentry_quest_done, (v) => { sentry_quest_done = v; }),
  lex('sentry_quest_rewarded', false, () => sentry_quest_rewarded, (v) => { sentry_quest_rewarded = v; }),
  lex('pale_sentry_hp', 500, () => pale_sentry_hp, (v) => { pale_sentry_hp = v; }),
  lex('sickle_quest_stage', 0, () => sickle_quest_stage, (v) => { sickle_quest_stage = v; }),
  lex('gridd_rainfish_warned', false, () => gridd_rainfish_warned, (v) => { gridd_rainfish_warned = v; }),
  lex('rainfish_woken', false, () => rainfish_woken, (v) => { rainfish_woken = v; }),
  lex('dispatch_quest_started', false, () => dispatch_quest_started, (v) => { dispatch_quest_started = v; }),
  lex('dispatch_delivered', false, () => dispatch_delivered, (v) => { dispatch_delivered = v; }),
  lex('dispatch_pay_ticket_ready', false, () => dispatch_pay_ticket_ready, (v) => { dispatch_pay_ticket_ready = v; }),
  lex('dispatch_rewarded', false, () => dispatch_rewarded, (v) => { dispatch_rewarded = v; }),
  lex('fort_quest_started', false, () => fort_quest_started, (v) => { fort_quest_started = v; }),
  lex('fort_quest_stage', 0, () => fort_quest_stage, (v) => { fort_quest_stage = v; }),
  lex('mornay_peat_hunt',0,()=>mornay_peat_hunt,v=>{mornay_peat_hunt=v;}),
  lex('mornay_ridge_hunt',0,()=>mornay_ridge_hunt,v=>{mornay_ridge_hunt=v;}),
  lex('mornay_hoist_errand',0,()=>mornay_hoist_errand,v=>{mornay_hoist_errand=v;}),
  lex('two_jorans_stage',0,()=>two_jorans_stage,v=>{two_jorans_stage=v;}),
  lex('two_jorans_evidence',0,()=>two_jorans_evidence,v=>{two_jorans_evidence=v;}),
  lex('fine_needlework_stage', 0, () => fine_needlework_stage, (v) => { fine_needlework_stage = v; }),
  lex('polwick_esla_visit_stage', 0, () => polwick_esla_visit_stage, (v) => { polwick_esla_visit_stage = v; }),
  lex('fort_pay_ticket_ready', false, () => fort_pay_ticket_ready, (v) => { fort_pay_ticket_ready = v; }),
  lex('fort_pay_ticket_reduced', false, () => fort_pay_ticket_reduced, (v) => { fort_pay_ticket_reduced = v; }),
  lex('smugglers_dead', false, () => smugglers_dead, (v) => { smugglers_dead = v; }),
  lex('smugglers_execution_day', 0, () => smugglers_execution_day, (v) => { smugglers_execution_day = v; }),
  lex('fort_report_filed', false, () => fort_report_filed, (v) => { fort_report_filed = v; }),
  lex('mq4_available_day', 0, () => mq4_available_day, (v) => { mq4_available_day = v; }),
  lex('reservoir_quest_started', false, () => reservoir_quest_started, (v) => { reservoir_quest_started = v; }),
  lex('lighthouse_quest_stage', 0, () => lighthouse_quest_stage, (v) => { lighthouse_quest_stage = v; }),
  lex('lighthouse_cabinet_looted', false, () => lighthouse_cabinet_looted, (v) => { lighthouse_cabinet_looted = v; }),
  lex('lighthouse_drawer_looted', false, () => lighthouse_drawer_looted, (v) => { lighthouse_drawer_looted = v; }),
  lex('lighthouse_spider_resolved', false, () => lighthouse_spider_resolved, (v) => { lighthouse_spider_resolved = v; }),
  lex('den_wraith_quest_started', false, () => den_wraith_quest_started, (v) => { den_wraith_quest_started = v; }),
  lex('den_wraith_defeated', false, () => den_wraith_defeated, (v) => { den_wraith_defeated = v; }),
  lex('den_wraith_rewarded', false, () => den_wraith_rewarded, (v) => { den_wraith_rewarded = v; }),
  lex('netto_letter_received', false, () => netto_letter_received, (v) => { netto_letter_received = v; }),
  lex('dessa_met', false, () => dessa_met, (v) => { dessa_met = v; }),
  lex('rareborn_rhyme_heard', false, () => rareborn_rhyme_heard, (v) => { rareborn_rhyme_heard = v; }),
  win('vale_tutorial_seen', false),   // Ms. Vale's one-time field-kit tutorial (window-native)
  win('tev_elixir_given', false),     // Tev's one-time Elixir gift (window-native)
  lex('esla_said_sluice', false, () => esla_said_sluice, (v) => { esla_said_sluice = v; }),
  lex('esla_said_dispatch', false, () => esla_said_dispatch, (v) => { esla_said_dispatch = v; }),
  lex('esla_said_cabinet', false, () => esla_said_cabinet, (v) => { esla_said_cabinet = v; }),
  lex('esla_said_polwick_pending', false, () => esla_said_polwick_pending, (v) => { esla_said_polwick_pending = v; }),
  lex('esla_said_polwick_dead', false, () => esla_said_polwick_dead, (v) => { esla_said_polwick_dead = v; }),
  lex('esla_said_basin', false, () => esla_said_basin, (v) => { esla_said_basin = v; }),
  lex('supervisor_greet_day', 0, () => supervisor_greet_day, (v) => { supervisor_greet_day = v; }),
  lex('esla_greet_day', 0, () => esla_greet_day, (v) => { esla_greet_day = v; }),
  lex('north_bridge_crossed_early', false, () => north_bridge_crossed_early, (v) => { north_bridge_crossed_early = v; }),
  lex('north_bridge_scolded', false, () => north_bridge_scolded, (v) => { north_bridge_scolded = v; }),
  lex('supervisor_said_flood', false, () => supervisor_said_flood, (v) => { supervisor_said_flood = v; }),
  lex('wine_quest_started', false, () => wine_quest_started, (v) => { wine_quest_started = v; }),
  lex('wine_quest_gift', null, () => wine_quest_gift, (v) => { wine_quest_gift = v; }),  // nullable
  lex('wine_quest_delivered', false, () => wine_quest_delivered, (v) => { wine_quest_delivered = v; }),
  lex('wine_quest_rewarded', false, () => wine_quest_rewarded, (v) => { wine_quest_rewarded = v; }),
  lex('struck_entry_stage',0,()=>struck_entry_stage,v=>{struck_entry_stage=v;}),
  lex('struck_entry_wins',0,()=>struck_entry_wins,v=>{struck_entry_wins=v;}),
  lex('struck_entry_cache',false,()=>struck_entry_cache,v=>{struck_entry_cache=v;}),
  lex('struck_entry_supplies',false,()=>struck_entry_supplies,v=>{struck_entry_supplies=v;}),
  lex('corvin_favor_started', false, () => corvin_favor_started, (v) => { corvin_favor_started = v; }),
  lex('corvin_favor_done', false, () => corvin_favor_done, (v) => { corvin_favor_done = v; }),
  lex('corvin_favor_offer_day', 0, () => corvin_favor_offer_day, (v) => { corvin_favor_offer_day = v; }),
  lex('corvin_favor_offered', false, () => corvin_favor_offered, (v) => { corvin_favor_offered = v; }),
  // ── Window-native (interactions.js / MAP_FEATURES set window[key] directly) ─
  // syncQuestFlagsToWindow() only NORMALIZES these (undefined → default); it
  // never assigns from a let-binding, so a flag the player just earned is safe.
  win('upper_reach_seen', false),
  win('basin_chamber_seen', false),
  win('sunken_gallery_seen', false),
  win('basin_chamber_exits', 0),          // window-native COUNTER (not a boolean)
  win('basin_chamber_dream_done', false),
  win('sunken_gallery_recess_opened', false),
  win('sunken_gallery_drowned_freed', false),
  win('sunken_gallery_drowned_slain', false),
  win('sunken_gallery_gift_taken', false),
  win('gallery_clue_silt', false),
  win('gallery_clue_satchel', false),
  win('gallery_clue_survey', false),
  win('gallery_clue_gauge', false),
  win('gallery_clue_reliefs', false),
  win('gallery_clue_visitor', false),
  win('gallery_clue_notebook', false),
  win('gallery_clue_stair', false),
  win('gallery_body_found', false),
  // ── Back to lexical (the Sunken Gallery report + Fourteenth File progression) ─
  lex('reservoir_report_filed', false, () => reservoir_report_filed, (v) => { reservoir_report_filed = v; }),
  lex('gallery_deeper_stair_seen', false, () => gallery_deeper_stair_seen, (v) => { gallery_deeper_stair_seen = v; }),
  lex('gallery_receiver_defeated', false, () => gallery_receiver_defeated, (v) => { gallery_receiver_defeated = v; }),
  lex('fourteenth_file_stage', 0, () => fourteenth_file_stage, (v) => { fourteenth_file_stage = v; }),
  lex('fourteenth_file_offer_day', 0, () => fourteenth_file_offer_day, (v) => { fourteenth_file_offer_day = v; }),
  lex('fourteenth_file_offered', false, () => fourteenth_file_offered, (v) => { fourteenth_file_offered = v; }),
  lex('fourteenth_file_outcome', 0, () => fourteenth_file_outcome, (v) => { fourteenth_file_outcome = v; }),
  win('ff_clue_skiff', false),
  win('ff_clue_ledger', false),
  win('ff_clue_dedication', false),
];

// QUEST_FLAG_SCHEMA is DERIVED from the binding keys — no longer a second
// hand-maintained list. Still exposed on window for existing consumers
// (validation.js, tests, MAP_FEATURES onceFlag persistence checks).
const QUEST_FLAG_SCHEMA   = QUEST_FLAG_BINDINGS.map((b) => b.key);
window.QUEST_FLAG_SCHEMA   = QUEST_FLAG_SCHEMA;
window.QUEST_FLAG_BINDINGS = QUEST_FLAG_BINDINGS;  // read-only registry access for validation/tests

// ─── Frozen v2→v3 migration snapshots (#4) ───────────────────────────────────
// MIGRATION HISTORY, not the runtime source of truth: these map the exact
// version-2 on-disk fields to stable ids. Each pickup field lists ids in the
// SAME order as that array's v2 indices — index i of a saved boolean array is
// the pickup with id [i]. FROZEN: never change or reorder these after shipping,
// even if the live runtime arrays are later reordered (that independence is the
// entire point). Only fields that could appear in a genuine version-2 file live
// here; a pickup/chest added after v3 (e.g. the Roddon Way potion, never in a v2
// save) does NOT belong here.
const LEGACY_V2_PICKUP_FIELDS = Object.freeze({
  worldItems:         ['pickup_world_potion'],
  map3n1Items:        ['pickup_map3n1_fen_sickle'],
  dungeonItems:       ['pickup_dungeon1_a', 'pickup_dungeon1_b', 'pickup_dungeon1_c'],
  dungeon2Items:      ['pickup_dungeon2_a', 'pickup_dungeon2_b'],
  dungeon3Items:      ['pickup_dungeon3_tc_a', 'pickup_dungeon3_tc_b'],
  dungeon3TlItems:    ['pickup_dungeon3_tl_potion', 'pickup_dungeon3_tl_ancient_writing'],
  dungeon3TrItems:    ['pickup_dungeon3_tr_a', 'pickup_dungeon3_tr_b'],
  dungeon3MlItems:    ['pickup_dungeon3_ml_potion', 'pickup_dungeon3_ml_garrison_log'],
  dungeon3McItems:    ['pickup_dungeon3_mc_elixir'],
  dungeon3MrItems:    ['pickup_dungeon3_mr_potion', 'pickup_dungeon3_mr_elixir'],
  dungeon3BlItems:    ['pickup_dungeon3_bl_potion', 'pickup_dungeon3_bl_scratched_warning'],
  dungeon3BcItems:    ['pickup_dungeon3_bc_potion'],
  dungeon3BrItems:    ['pickup_dungeon3_br_elixir'],
  dungeon4Items:      ['pickup_dungeon4_a', 'pickup_dungeon4_b'],
  dungeon5Items:      ['pickup_dungeon5_a', 'pickup_dungeon5_b'],
  dungeon6Items:      ['pickup_dungeon6_a', 'pickup_dungeon6_b'],
  dungeon7Items:      ['pickup_dungeon7_a', 'pickup_dungeon7_b', 'pickup_dungeon7_burial_record', 'pickup_dungeon7_c'],
  dungeon8Items:      ['pickup_dungeon8_a', 'pickup_dungeon8_b'],
  dungeon8WestItems:  ['pickup_dungeon8_west_elixir'],
  dungeon8EastItems:  ['pickup_dungeon8_east_elixir'],
  sluiceItems:        ['pickup_sluice1_potion'],
  sluiceLevel2Items:  ['pickup_sluice2_a', 'pickup_sluice2_b', 'pickup_sluice2_c', 'pickup_sluice2_d'],
  sluiceLevel3Items:  ['pickup_sluice3_potion', 'pickup_sluice3_elixir'],
  mireVaultItems:     ['pickup_mire_vault_potion', 'pickup_mire_vault_ember_root'],
  sunkenGalleryItems: ['pickup_sunken_gallery_potion'],
});
const LEGACY_V2_CHEST_FIELDS = Object.freeze({
  chestOpened:             'chest_dungeon_main',
  sluiceChestOpened:       'chest_sluice1',
  sluiceLevel2ChestOpened: 'chest_sluice2',
  sluiceSecretChestOpened: 'chest_sluice_secret',
  sluiceLevel3ChestOpened: 'chest_sluice3',
  alcoveChestOpened:       'chest_dungeon_alcove',
  sluiceDeepChestOpened:   'chest_sluice_deep',
  catArmorChestOpened:     'chest_cat_armor',
  meadowChestOpened:       'chest_meadow',
});
window.LEGACY_V2_PICKUP_FIELDS = LEGACY_V2_PICKUP_FIELDS;
window.LEGACY_V2_CHEST_FIELDS  = LEGACY_V2_CHEST_FIELDS;

// ─── v3 stable-id pickup/chest persistence (#4) ──────────────────────────────
// Unknown ids read from a save (content temporarily missing or retired) are
// preserved here so a subsequent save doesn't silently erase that data. They
// never affect gameplay — there is no registry object for them to mark.
let _unresolvedPickupIds = [];
let _unresolvedChestIds  = [];

// Deterministic, duplicate-free id arrays for saveGame(): every registered
// pickup currently picked / chest currently opened, plus preserved unknown ids.
function collectedPickupIdsForSave() {
  const out = new Set(_unresolvedPickupIds);
  for (const id of PICKUP_REGISTRY_IDS) if (PICKUP_REGISTRY[id].picked === true) out.add(id);
  return Array.from(out).sort();
}
function openedChestIdsForSave() {
  const out = new Set(_unresolvedChestIds);
  for (const id of CHEST_REGISTRY_IDS) if (CHEST_REGISTRY[id].opened === true) out.add(id);
  return Array.from(out).sort();
}

// loadGame() side: reset every registered pickup/chest to its default state,
// then apply the saved id arrays. Registered ids set the object; unknown ids are
// preserved (warned once) without touching gameplay. A registered object whose
// id is absent from the saved array keeps its reset (uncollected/closed) state —
// it never inherits the current runtime session's value.
function applyCollectedPickupIds(ids) {
  for (const id of PICKUP_REGISTRY_IDS) PICKUP_REGISTRY[id].picked = false;
  const unresolved = [];
  const seen = new Set();
  for (const id of Array.isArray(ids) ? ids : []) {
    if (typeof id !== 'string' || seen.has(id)) continue; // normalize duplicates
    seen.add(id);
    if (PICKUP_REGISTRY[id]) PICKUP_REGISTRY[id].picked = true;
    else { unresolved.push(id); console.warn('[loadGame] unknown pickup id "' + id + '" — preserving it, not applying to gameplay'); }
  }
  _unresolvedPickupIds = unresolved;
}
function applyOpenedChestIds(ids) {
  for (const id of CHEST_REGISTRY_IDS) CHEST_REGISTRY[id].opened = false;
  const unresolved = [];
  const seen = new Set();
  for (const id of Array.isArray(ids) ? ids : []) {
    if (typeof id !== 'string' || seen.has(id)) continue;
    seen.add(id);
    if (CHEST_REGISTRY[id]) CHEST_REGISTRY[id].opened = true;
    else { unresolved.push(id); console.warn('[loadGame] unknown chest id "' + id + '" — preserving it, not applying to gameplay'); }
  }
  _unresolvedChestIds = unresolved;
}

// Current-version gate. Historical identity snapshots above are validation
// evidence only; old saves are never migrated by the shipped runtime.
function migrateSave(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'save payload is not an object' };
  }
  // Accept only the current version; reject older and future versions cleanly.
  // Old migration execution is removed; frozen identity snapshots remain.
  if (parsed.version !== SAVE_VERSION) {
    return { ok: false, reason: 'unsupported save version (' + JSON.stringify(parsed.version) + '); this build reads only version ' + SAVE_VERSION + ' and does not migrate older or future saves' };
  }
  return { ok: true, data: parsed, migratedFrom: null };
}
window.migrateSave = migrateSave;

// Warns (console.warn only — no throws, no gameplay impact) if:
//   • a schema flag is absent from save data (old save missing a newer flag)
//   • a schema flag is not actually written by syncQuestFlagsToWindow (saveGame
//     would write undefined for that key)
// Call from loadGame() to catch schema drift at load time.
// Pure candidate validation. Missing fields retain the established default
// policy; present malformed fields never reach any live setter.
function validateSaveSchema(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, errors: ['invalid save object'] };
  for (const binding of QUEST_FLAG_BINDINGS) {
    if (Object.hasOwn(data, binding.key) && !validBoundSaveValue(data[binding.key], binding.default)) errors.push(binding.key);
  }
  const nonnegative = value => Number.isSafeInteger(value) && value >= 0;
  const boolean = value => typeof value === 'boolean';
  // Non-quest world fields written by saveGame/loadGame. No inventory limits,
  // map dimensions, registry counts, or authored quest-stage maxima live here.
  const rules = {
    day: value => nonnegative(value) && value > 0 && Number.isSafeInteger(value + 1),
    travellerPresent: boolean,
    homeChestGold: nonnegative,
    dilemma_voss: value => value === null || typeof value === 'string',
    abandonedAptDresserLooted: boolean,
    abandonedAptSparkleTaken: boolean,
    bossDefeated: boolean, bossKnockedDown: boolean,
    mulhollandDefeated: boolean, takomoDefeated: boolean, denWraithDefeated: boolean,
    sailorBrawlFightDay: value => value === -1 || nonnegative(value), // authored never-fought sentinel
    mirethystRewarded: boolean,
    collectedPickupIds: value => Array.isArray(value) && value.every(id => typeof id === 'string'),
    openedChestIds: value => Array.isArray(value) && value.every(id => typeof id === 'string'),
  };
  for (const [key, valid] of Object.entries(rules)) {
    if (Object.hasOwn(data, key) && !valid(data[key])) errors.push(key);
  }
  return { ok: errors.length === 0, errors };
}
window.validateSaveSchema = validateSaveSchema;

// Registered metadata is authoritative. Unknown items/instance fields reject
// before loading rather than installing inventory that canonical combat refuses.
// Supported stale registered fields still refresh from the current definition.
function rehydrateItem(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid saved item');
  const fields = Object.getOwnPropertyDescriptors(saved);
  const name = fields.name && fields.name.value;
  if (typeof name !== 'string' || !Object.hasOwn(ITEM_REGISTRY, name)) throw new Error('Unknown saved item: ' + name);
  const definition = ITEM_REGISTRY[name];
  for (const key of Reflect.ownKeys(fields)) {
    if (!Object.hasOwn(fields[key], 'value') ||
        (!Object.hasOwn(definition, key) && !(name === 'Void Shard' && key === 'bonus'))) {
      throw new Error('Unsupported saved item field: ' + name + '.' + String(key));
    }
  }
  // The former Void Shard bonus is the existing authored restoration exception.
  return { ...definition };
}

// Expected browser storage failures are results, not uncaught UI/loop errors.
// Reading is side-effect-free, including when used by the Load menu renderer.
const saveStorage = Object.freeze({
  read(key = 'verdantVale_save') {
    try { return { ok: true, value: localStorage.getItem(key) }; }
    catch (error) { return { ok: false, error }; }
  },
  write(value, key = 'verdantVale_save') {
    try { localStorage.setItem(key, value); return { ok: true }; }
    catch (error) { return { ok: false, error }; }
  },
});

// Existing equipped-save restoration policy, shared by candidate validation
// and the commit below. This does not migrate save versions.
function savedEquipmentDisposition(item) {
  if (item && item.keyItem) return 'key';
  if (item && item.name === 'Void Shard') return 'consumable';
  return 'equipped';
}

// ─── The single authoritative answer to "can the player save right now?" ───
// Based on MAP_METADATA[mapIdForRef(activeMap)].allowSave -- defaults to
// true if the active map has no metadata entry at all (so an unregistered
// map, which shouldn't happen, doesn't silently block saving). Two
// independent call sites consult this exact function, not two copies of
// the same lookup: input.js's save-confirm menu (to decide whether to show
// the "won't hold" banner) and saveGame() itself, right below (so a save
// can never be written from a blocked map by any path, not just the menu).
// "No safe haven" (the design intent behind allowSave: false) means no
// town/bed/healing/shelter, not "the whole outdoor region refuses to
// save" -- see NORTH_BASIN_NW_MAP's MAP_METADATA entry (data.js), which is
// allowSave: true; only the unmarked chamber and the Sunken Gallery it
// leads to are actually blocked.
function canSaveHere() {
  if (fishing.active) return false; // a paid cast is transient until its result is dismissed
  if (debugPromisePreview.isOpen()) return false;
  if (riverWrestling.isActive()) return false;
  if (storyBattle.hasContext() || seraLioraBreakfastBattle.isActive()) return false; // transient resources never enter saves
  if (gameRuntimeFailure.isActive()) return false;
  if (!persistentParty.hasLivingMember()) return false;
  if (typeof waterTravelController !== 'undefined' && waterTravelController.blocksSaveLoad()) return false;
  if (typeof travellersRiseAmbush!=='undefined' && travellersRiseAmbush.blocksSaveLoad()) return false;
  if (typeof travellersRiseCamp!=='undefined' && travellersRiseCamp.blocksSave()) return false;
  if (canonicalPartyCombat.isActive() || canonicalPartyCombat.hasPendingHandoff()) return false;
  if (persistentParty.getCombatDiagnostic()) return false;
  if (combatPlayerState.hasParty()) return false;
  if (galleryReceiverEncounter.isLocked()) return false;
  if (formationCombatLab.isOpen()) return false; // never persist laboratory HP
  const meta = MAP_METADATA[mapIdForRef(activeMap)];
  return !meta || meta.allowSave !== false;
}
window.canSaveHere = canSaveHere;

// ─── All mutable game state that must survive a save/load cycle should be
// ─── included here. Add new persistent variables to both saveGame() and loadGame().
function saveGame() {
  if (riverWrestling.isActive()) return false;
  if (typeof waterTravelController !== 'undefined' && waterTravelController.blocksSaveLoad()) return false;
  if (typeof fineNeedlework!=='undefined' && fineNeedlework.isActive()) return false;
  if (typeof mq5AssignmentCutscene!=='undefined' && mq5AssignmentCutscene.isActive()) return false;
  if (typeof travellersRiseAmbush!=='undefined' && travellersRiseAmbush.blocksSaveLoad()) return false;
  if (typeof travellersRiseCamp!=='undefined' && travellersRiseCamp.isActive()) return false;
  // Authoritative guard: refuse to write anything at all on a blocked map,
  // regardless of caller. Returns before touching localStorage or any menu
  // state -- the caller (normally input.js's save-confirm handler, which
  // already checked canSaveHere() itself before deciding to call this at
  // all) is responsible for showing the "won't hold" banner.
  if (!canSaveHere()) return false;

  // Canonical-position guard: never persist a save whose canonical regional
  // position disagrees with its compatibility projections (or is missing on a
  // regional map). Returns BEFORE touching localStorage, so a broken invariant
  // never overwrites an existing valid save.
  if (typeof regionalInvariantErrors === 'function') {
    const invErrs = regionalInvariantErrors();
    if (invErrs.length) { console.warn('[saveGame] refusing to write — canonical position invariant broken: ' + invErrs.join('; ') + ' — the existing save is left untouched.'); return false; }
  }

  // Quest-route guard: never persist a contradictory lighthouse/Polwick state.
  // The same pure invariant is used by offer/objective/reward eligibility,
  // load preflight, and validateGameData().
  if(mornayJobs.invariantErrors().length||twoJorans.invariantErrors().length||struckEntry.invariantErrors().length)return false;
  if(fineNeedlework.invariantErrors().length)return false;
  const lighthouseErrors = lighthouseQuestInvariantErrors();
  if (lighthouseErrors.length) {
    console.warn('[saveGame] refusing to write — lighthouse quest invariant broken: ' + lighthouseErrors.join('; ') + ' — the existing save is left untouched.');
    return false;
  }
  const ambushErrors = travellersRiseAmbushInvariantErrors();
  if (ambushErrors.length) {
    console.warn('[saveGame] refusing to write — Travellers\' Rise ambush invariant broken: ' + ambushErrors.join('; ') + ' — the existing save is left untouched.');
    return false;
  }

  // Quest flags: built generically from the binding registry (one getter each),
  // NOT from a separate key list. syncQuestFlagsToWindow() still runs first so
  // window-native flags are normalized (undefined → default) before their
  // getters read window[key], and so runtime window mirrors stay current for
  // any consumer — but serialization no longer depends on that mirror step.
  syncQuestFlagsToWindow();
  const questFlagData = {};
  for (const b of QUEST_FLAG_BINDINGS) questFlagData[b.key] = b.get();

  // ── Location (v4 discriminated) ───────────────────────────────────────────
  // Regional: the CANONICAL region + world-pixel position (no activeMapId/local as
  // a second authority). Discrete: the physical map id + local pixels. player.x/y
  // are only compatibility projections on a regional map, so they are NOT stored;
  // for a discrete map the local pixels ARE the authority and live in `location`.
  const _canon = (typeof regionalWorldPosition === 'function') ? regionalWorldPosition() : null;
  const location = _canon
    ? { kind: 'regional', regionId: _canon.regionId, worldPxX: _canon.worldPxX, worldPxY: _canon.worldPxY }
    : { kind: 'discrete', mapId: mapIdForRef(activeMap), localPxX: player.x, localPxY: player.y };

  const data = {
    version: SAVE_VERSION,
    party: persistentParty.serialize(),
    slitherSpd,
    // ── Player (facing only; position lives in `location`) ────────────────
    player:     { facing: player.facing },
    // ── Stats / inventory ─────────────────────────────────────────────────
    stats:      {
      hp: stats.hp, maxHp: stats.maxHp,
      atk: stats.atk, def: stats.def, spd: stats.spd,
      xp: stats.xp, level: stats.level, gold: stats.gold,
      weapon:    stats.weapon    ? { ...stats.weapon    } : null,
      armor:     stats.armor     ? { ...stats.armor     } : null,
      shield:    stats.shield    ? { ...stats.shield    } : null,
      accessory: stats.accessory ? { ...stats.accessory } : null,
      items:     stats.items.map(i => ({ ...i })),
    },
    // ── World / time ──────────────────────────────────────────────────────
    day,
    travellerPresent,
    // ── Quest flags (schema-driven; see QUEST_FLAG_SCHEMA) ────────────────
    ...questFlagData,
    // ── Location ──────────────────────────────────────────────────────────
    // The v4 discriminated position (see above). The physical map is no longer
    // stored as a separate `activeMapId`: a regional save derives it from the
    // canonical world point on load; a discrete save carries its own mapId in
    // `location`. Location-context MODE flags (inTown, dungeonFloor,
    // houseSourceMapId, …) still flatten through the ONE binding registry.
    location,
    ...serializeLocationState(),
    // dilemma_voss is a main.js story var, NOT location context — kept separate.
    dilemma_voss,
    // ── Floor pickups + openable chests (v3: stable ids, never array positions) ─
    // collectedPickupIds / openedChestIds are the ONLY pickup/chest persistence
    // now. Built from the id registries (data.js), plus any unresolved ids
    // preserved from a prior load so temporarily-missing content isn't erased.
    collectedPickupIds: collectedPickupIdsForSave(),
    openedChestIds:     openedChestIdsForSave(),
    // ── Home chest stored gold — a value container, NOT an openable chest ────
    homeChestGold:           HOUSE_DATA.player_house.chest.gold,
    // Abandoned Drenwick apartment (c1_u4) — searchable dresser + Old Fishing Rod sparkle
    abandonedAptDresserLooted: HOUSE_DATA.drenwick_apt_c1_u4.dresser.looted,
    abandonedAptSparkleTaken:  HOUSE_DATA.drenwick_apt_c1_u4.sparkle.taken,
    // ── Status effects ────────────────────────────────────────────────────
    statusEffects: statusEffects.slice(),
    // ── Combat ────────────────────────────────────────────────────────────
    bossDefeated:        BOSS.defeated,
    bossKnockedDown:     BOSS.knockedDown,
    mulhollandDefeated:  MULHOLLAND.defeated,
    takomoDefeated:      TAKOMO.defeated,
    denWraithDefeated:   DEN_WRAITH.defeated,
    // Kolm's once-per-Dayoff inn brawl (combat.js) — non-quest combat state,
    // so it is persisted directly here rather than via QUEST_FLAG_SCHEMA.
    sailorBrawlFightDay: sailor_brawl_fight_day,
    // ── Vault NPC ─────────────────────────────────────────────────────────
    mirethystRewarded:   !!window.mirethyst_rewarded,
  };
  const schema = validateSaveSchema(data);
  if (!schema.ok) {
    console.warn('[saveGame] invalid world/quest values: ' + schema.errors.join(', '));
    return false;
  }
  const written = saveStorage.write(JSON.stringify(data));
  if (!written.ok) {
    console.warn('[saveGame] storage write failed; existing save retained.', written.error);
    menu.saveStatus = 'failed'; menu.saveMessage = 120; menu.screen = 'main';
    return false;
  }
  menu.saveStatus = 'saved';
  menu.saveMessage = 120;   // show banner for ~2 s
  menu.screen      = 'main';
  return true;
}

// Preflight the complete v4 location restore from a payload WITHOUT mutating any
// globals. Reads the discriminated `location`: a regional entry derives its
// physical map + local pixels from the canonical world point; a discrete entry
// carries its own map id + local pixels. Produces a resolved map ref, the player
// placement, the (optional) canonical regional point, and a complete,
// invariant-checked candidate location state. On any failure — unknown/absent
// kind, void/blocked/out-of-bounds point, invalid map, malformed coordinates or
// inconsistent location state — it returns ok:false with errors so loadGame() can
// bail before touching the running game or the stored save.
function resolveLoadLocation(data) {
  const errors = [];
  const des = deserializeLocationState(data);   // world-transitions.js
  const candidate = des.state;
  for (const e of des.errors) errors.push(e);

  const facing = (data.player && data.player.facing !== undefined) ? data.player.facing : player.facing;
  const loc = data.location;
  let mapId, plr, regional = null;
  if (!loc || typeof loc !== 'object') {
    errors.push('save has no v4 location discriminator');
  } else if (loc.kind === 'regional') {
    // Canonical world point -> physical map + local projection. Rejects
    // non-finite / negative / void points atomically (null).
    const derived = (typeof regionWorldPxToLocal === 'function') ? regionWorldPxToLocal(loc.regionId, loc.worldPxX, loc.worldPxY) : null;
    if (!derived) {
      errors.push('regional save location does not resolve to a placed chunk (region "' + (loc && loc.regionId) + '", world ' + (loc && loc.worldPxX) + ',' + (loc && loc.worldPxY) + ')');
    } else {
      mapId = derived.mapId;
      plr = { x: derived.localPxX, y: derived.localPxY, facing };
      regional = { regionId: loc.regionId, worldPxX: loc.worldPxX, worldPxY: loc.worldPxY };
    }
  } else if (loc.kind === 'discrete') {
    if (typeof loc.mapId !== 'string') errors.push('discrete save location has no map id');
    else { mapId = loc.mapId; plr = { x: loc.localPxX, y: loc.localPxY, facing }; }
  } else {
    errors.push('unknown save location kind "' + (loc && loc.kind) + '"');
  }

  // Compatibility repair on the CANDIDATE (never live globals): a save stranded
  // with inBridgePost=true on a non-bridge map would make the bridge guards render
  // everywhere. Clear the bridge context so the candidate satisfies the invariants.
  if (mapId !== undefined) {
    const bridgeMapId = mapIdForRef(BRIDGE_CROSSING_MAP);
    if (candidate.inBridgePost && mapId !== bridgeMapId) {
      candidate.inBridgePost = false; candidate.bridge_entry_direction = null; candidate.bridge_toll_paid = false;
    }
  }

  let map = null;
  if (mapId !== undefined) {
    // Full placement validation (bounds / base-walkable / facing) — a resolved but
    // BLOCKED regional or discrete point fails here.
    const place = validatePlacement({ mapId, x: plr.x, y: plr.y, facing: plr.facing });
    for (const e of place.errors) errors.push(e);
    map = place.map;
  }
  const inv = validateLocationState(candidate, mapId);
  for (const e of inv.errors) errors.push(e);

  return { ok: errors.length === 0, errors, mapId, map, player: plr, locationState: candidate, regional };
}

function loadGame() {
  if (fishing.active) return false;
  if (debugPromisePreview.isOpen()) return false;
  if (riverWrestling.isActive()) return false;
  if (storyBattle.hasContext() || seraLioraBreakfastBattle.isActive()) return false; // explicit discard/checkpoint first
  if (gameRuntimeFailure.isActive()) return false;
  if (typeof waterTravelController !== 'undefined' && waterTravelController.blocksSaveLoad()) return false;
  if (typeof fineNeedlework!=='undefined' && fineNeedlework.isActive()) return false;
  if (typeof mq5AssignmentCutscene!=='undefined' && mq5AssignmentCutscene.isActive()) return false;
  if (typeof travellersRiseAmbush!=='undefined' && travellersRiseAmbush.blocksSaveLoad()) return false;
  if (typeof travellersRiseCamp!=='undefined' && travellersRiseCamp.isActive()) return false;
  if (canonicalPartyCombat.isActive() || canonicalPartyCombat.hasPendingHandoff()) return false;
  if (galleryReceiverEncounter.isLocked()) return false;
  if (formationCombatLab.isOpen()) return false; // exit first; no live lab restore
  if (partyCombatLab.isActive()) return false; // headless party Lab owns transient HP/playback
  if (persistentParty.isCombatPending()) return false;
  const stored = saveStorage.read();
  if (!stored.ok) {
    console.warn('[loadGame] storage read failed; running state retained.', stored.error);
    menu.loadStatus = 'unavailable'; menu.loadMessage = 120;
    return false;
  }
  const raw = stored.value;
  if (!raw) return false;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    // Malformed JSON: leave the stored text exactly as-is — never delete it,
    // never start a new game over it.
    console.warn('[loadGame] save is not valid JSON — leaving it untouched, not loading.');
    return false;
  }

  // Migrate the parsed payload forward to SAVE_VERSION. migrateSave() never
  // touches localStorage; on ANY failure (malformed shape, unsupported old
  // version, future version, missing migration step, migration error) we warn
  // and return false with the original save left intact on disk. A save is
  // never silently deleted merely because its version differs.
  const migration = migrateSave(parsed);
  if (!migration.ok) {
    console.warn('[loadGame] cannot load save: ' + migration.reason + ' — the existing save is left untouched on disk.');
    return false;
  }
  const data = migration.data;
  const schema = validateSaveSchema(data);
  if (!schema.ok) {
    console.warn('[loadGame] invalid world/quest values: ' + schema.errors.join(', ') + ' — running state and save retained.');
    return false;
  }

  let partyLoad;
  try { partyLoad = persistentParty.prepareLoad(data.party, data.stats, data.statusEffects, data.slitherSpd); }
  catch (error) { console.warn('[loadGame] invalid version-5 party payload — leaving running state and save untouched.'); return false; }

  // Candidate-only quest preflight. Missing lighthouse_quest_stage is the
  // pre-feature default (0), preserving older current-version saves. Invalid
  // route/outcome mixtures reject atomically before any runtime mutation.
  if(mornayJobs.invariantErrors(data).length||twoJorans.invariantErrors(data).length||struckEntry.invariantErrors(data).length)return false;
  if(fineNeedlework.invariantErrors(data).length)return false;
  const lighthouseErrors = lighthouseQuestInvariantErrors(data);
  if (lighthouseErrors.length) {
    console.warn('[loadGame] refusing to load — invalid lighthouse quest state: ' + lighthouseErrors.join('; ') + ' — the running game and the stored save are left untouched.');
    return false;
  }
  const ambushErrors = travellersRiseAmbushInvariantErrors(data);
  if (ambushErrors.length) {
    console.warn('[loadGame] refusing to load — invalid Travellers\' Rise ambush state: ' + ambushErrors.join('; ') + ' — the running game and the stored save are left untouched.');
    return false;
  }


  // ── PREFLIGHT (no mutation) ───────────────────────────────────────────────
  // Resolve and validate the active map, player placement, and the complete
  // location candidate BEFORE mutating any runtime state (stats, quests, session
  // markers, or location globals). On any failure, warn and return false with
  // BOTH the running game and the stored save left completely untouched.
  const loc = resolveLoadLocation(data);
  if (!loc.ok) {
    console.warn('[loadGame] refusing to load — invalid saved location/placement: ' + loc.errors.join('; ') + ' — the running game and the stored save are left untouched.');
    return false;
  }

  // ── COMMIT (everything below mutates runtime state) ───────────────────────
  persistentParty.commitLoad(partyLoad);
  if (combatPlayerState.hasParty()) combatPlayerState.clear(); // never resume preparation
  // Clear the Upper Reach / Sunken Gallery "visited today" markers
  // (movement.js) unconditionally on a committed load. They are deliberately
  // session-only (not part of the save schema — see movement.js's comment), so
  // without this a same-day load from an older save could otherwise leak this
  // session's leftover "visited today" state into a timeline where the visit
  // never happened, letting Rhen/Kest's physical-evidence lines (npcs.js)
  // incorrectly reappear. The very next frame re-sets either flag correctly if
  // the loaded state actually has the player standing on the relevant map.
  window.upper_reach_visit_day    = undefined;
  window.sunken_gallery_visit_day = undefined;

  // ── Player facing ─────────────────────────────────────────────────────────
  // Position itself is committed at the location block below (via placeAtLocation,
  // the canonical authority); only facing — which is not part of the position — is
  // restored here.
  player.facing = loc.player.facing;

  // ── Stats / inventory ───────────────────────────────────────────────────
  if (data.stats) {
    const s = data.stats;
    if (s.hp    !== undefined) stats.hp    = s.hp;
    if (s.maxHp !== undefined) stats.maxHp = s.maxHp;
    if (s.atk   !== undefined) stats.atk   = s.atk;
    if (s.def   !== undefined) stats.def   = s.def;
    if (s.spd   !== undefined) stats.spd   = s.spd;
    if (s.xp    !== undefined) stats.xp    = s.xp;
    if (s.level !== undefined) stats.level = s.level;
    if (s.gold  !== undefined) stats.gold  = s.gold;
    stats.weapon    = s.weapon    ? rehydrateItem(s.weapon)    : null;
    stats.armor     = s.armor     ? rehydrateItem(s.armor)     : null;
    stats.shield    = s.shield    ? rehydrateItem(s.shield)    : null;
    stats.accessory = s.accessory ? rehydrateItem(s.accessory) : null;
    stats.items     = Array.isArray(s.items) ? s.items.map(rehydrateItem) : [];
  }

  // ── Key-item / former Void Shard equipment normalization ────────────────
  // Older saves predate the keyItem flag, so a one-off quest item (type
  // 'accessory') may sit in an equipment slot. Rehydration above restored
  // its keyItem flag from the registry; move it back into stats.items
  // (deduped) and clear the slot so it only surfaces in the Special Items
  // notebook. The former Void Shard equipment becomes an inventory consumable;
  // every other equipped item is left untouched.
  for (const slot of ['weapon', 'armor', 'shield', 'accessory']) {
    const eq = stats[slot];
    if (savedEquipmentDisposition(eq) === 'key') {
      if (!stats.items.some(i => i.name === eq.name)) stats.items.push(eq);
      stats[slot] = null;
    } else if (savedEquipmentDisposition(eq) === 'consumable') {
      // Preserve every owned unit when loading its former equipped form.
      stats.items.push(eq);
      stats[slot] = null;
    }
  }

  // ── World / time ────────────────────────────────────────────────────────
  if (data.day              !== undefined) day              = data.day;
  if (data.travellerPresent !== undefined) travellerPresent = data.travellerPresent;

  // ── Quest flags (registry-driven) ───────────────────────────────────────
  // Every persistent quest/world flag is restored from the ONE binding
  // registry: a key present in the (migrated) payload passes through its
  // setter (lexical → the `let`; window → window[key]); a key absent falls
  // back to a FRESH copy of the binding's declared default — never the current
  // in-memory value. After migration every binding key is present, so the
  // default branch is belt-and-suspenders. No `!!` coercion, so numeric stages,
  // counters, HP, and nullable values keep their real types.
  for (const b of QUEST_FLAG_BINDINGS) {
    b.set((b.key in data) ? data[b.key] : cloneDefaultValue(b.default));
  }
  // Mirror restored LEXICAL flags to their public window.* copies (read by NPC
  // conditions, validation, and other window consumers) and normalize the
  // window-native flags. Must run AFTER the restore above so the mirrors
  // reflect the loaded values rather than pre-load state.
  syncQuestFlagsToWindow();
  // dilemma_voss: a main.js var, not a registry flag — restored in the location block below.
  refreshJobBoard();

  // ── Location state + canonical position (committed atomically) ────────────
  // The whole location portion was resolved + validated in the preflight above.
  // Commit the mode flags via applyLocationState() (the ONE binding registry),
  // then the POSITION via placeAtLocation() (the canonical authority): a regional
  // save reconstructs the canonical world point and derives activeMap/player.x/y;
  // a discrete save sets the physical map + local and clears canonical. This is
  // the "construct canonical from the validated return placement" restore path —
  // not a runtime repair. dilemma_voss is restored separately below.
  applyLocationState(loc.locationState);
  placeAtLocation(loc.mapId, loc.player.x, loc.player.y);
  if (data.dilemma_voss !== undefined) dilemma_voss = data.dilemma_voss;

  // ── Floor pickups + openable chests (v3: applied by stable id) ────────────
  // Reset every registered pickup/chest to its default (uncollected / closed),
  // then apply the saved id arrays. A registered object absent from the arrays
  // keeps its reset state (it never inherits the current session's value); an
  // unknown id is preserved for the next save but does not touch gameplay.
  applyCollectedPickupIds(data.collectedPickupIds);
  applyOpenedChestIds(data.openedChestIds);

  // ── Home chest stored gold + nonstandard direct persistence (unchanged) ───
  if (data.homeChestGold             !== undefined) HOUSE_DATA.player_house.chest.gold           = data.homeChestGold;
  if (data.abandonedAptDresserLooted !== undefined) HOUSE_DATA.drenwick_apt_c1_u4.dresser.looted = data.abandonedAptDresserLooted;
  if (data.abandonedAptSparkleTaken  !== undefined) HOUSE_DATA.drenwick_apt_c1_u4.sparkle.taken  = data.abandonedAptSparkleTaken;

  // ── Status effects ──────────────────────────────────────────────────────
  statusEffects = Array.isArray(data.statusEffects) ? data.statusEffects.slice() : [];

  // ── Combat ──────────────────────────────────────────────────────────────
  if (data.bossDefeated       !== undefined) BOSS.defeated       = data.bossDefeated;
  if (data.bossKnockedDown    !== undefined) BOSS.knockedDown    = data.bossKnockedDown;
  if (data.mulhollandDefeated !== undefined) MULHOLLAND.defeated = data.mulhollandDefeated;
  if (data.takomoDefeated     !== undefined) TAKOMO.defeated     = data.takomoDefeated;
  if (data.denWraithDefeated !== undefined) DEN_WRAITH.defeated = data.denWraithDefeated;
  // Kolm's once-per-Dayoff brawl: restore unconditionally with a -1 default so
  // a pre-fight save (or an older save without the field) does not inherit a
  // later in-session victory.
  sailor_brawl_fight_day = data.sailorBrawlFightDay !== undefined ? data.sailorBrawlFightDay : -1;
  // Restore the saved boolean even when it is false — loading must be able to
  // undo an in-session reward. Older saves without the field keep the current
  // runtime value.
  if (data.mirethystRewarded !== undefined) window.mirethyst_rewarded = !!data.mirethystRewarded;

  // ── Bridge-guard placement (Phase 1 NPC-movement pilot) ────────────────
  // The stranded-inBridgePost repair (old defeat-respawn bug: died at the
  // bridge, carried home, flag never cleared) now runs on the candidate in
  // resolveLoadLocation() BEFORE commit, so the committed flags are already
  // consistent here. Guard placement is DERIVED from those flags.
  // Nothing incidental is saved (no coordinates, no animation frames): guard
  // placement is DERIVED from the flags just restored. Loading inside the
  // bridge with the toll already paid puts both guards fully aside at their
  // completed destinations (a mid-sidestep save loads as finished); any other
  // load restores the blocking posts. Touches only the two pilot guards —
  // no other NPC is disturbed.
  if (typeof resetBridgeGuards === 'function') {
    if (inBridgePost && bridge_toll_paid) placeBridgeGuardsAside();
    else resetBridgeGuards();
  }

  // Auto-patrol NPCs (Tobb Wend) carry no saved position — patrol state is
  // transient. Reset every patrol NPC to its authored home; if the save was
  // made inside its map (e.g. the brewery), ensureAutoPatrols() re-starts it
  // from the start position on the next frame. Loading elsewhere leaves it
  // parked at home, off the active map, so it never initialises or renders.
  if (typeof resetAllPatrols === 'function') resetAllPatrols();
  if (typeof travellersRiseAmbush !== 'undefined') travellersRiseAmbush.resetTransient();
  if (typeof travellersRiseCamp !== 'undefined') travellersRiseCamp.resetTransient();


  return true;
}
