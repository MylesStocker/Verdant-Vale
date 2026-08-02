'use strict';

// save.js — save-file schema and the saveGame()/loadGame() implementations.

// Bumped when the on-disk save format changes. loadGame() MIGRATES older saves
// forward (SAVE_MIGRATIONS / migrateSave, below) rather than discarding them; a
// save it genuinely cannot understand is left untouched on disk, never deleted.
const SAVE_VERSION = 2;

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
  lex('fort_pay_ticket_ready', false, () => fort_pay_ticket_ready, (v) => { fort_pay_ticket_ready = v; }),
  lex('fort_pay_ticket_reduced', false, () => fort_pay_ticket_reduced, (v) => { fort_pay_ticket_reduced = v; }),
  lex('smugglers_dead', false, () => smugglers_dead, (v) => { smugglers_dead = v; }),
  lex('smugglers_execution_day', 0, () => smugglers_execution_day, (v) => { smugglers_execution_day = v; }),
  lex('fort_report_filed', false, () => fort_report_filed, (v) => { fort_report_filed = v; }),
  lex('mq4_available_day', 0, () => mq4_available_day, (v) => { mq4_available_day = v; }),
  lex('reservoir_quest_started', false, () => reservoir_quest_started, (v) => { reservoir_quest_started = v; }),
  lex('den_wraith_quest_started', false, () => den_wraith_quest_started, (v) => { den_wraith_quest_started = v; }),
  lex('den_wraith_defeated', false, () => den_wraith_defeated, (v) => { den_wraith_defeated = v; }),
  lex('den_wraith_rewarded', false, () => den_wraith_rewarded, (v) => { den_wraith_rewarded = v; }),
  lex('netto_letter_received', false, () => netto_letter_received, (v) => { netto_letter_received = v; }),
  lex('dessa_met', false, () => dessa_met, (v) => { dessa_met = v; }),
  lex('rareborn_rhyme_heard', false, () => rareborn_rhyme_heard, (v) => { rareborn_rhyme_heard = v; }),
  win('vale_tutorial_seen', false),   // Ms. Vale's one-time field-kit tutorial (window-native)
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

// ─── Versioned save migrations ────────────────────────────────────────────────
// SAVE_MIGRATIONS[v] transforms a version-v payload into a version-(v+1) one.
// migrateSave() applies them sequentially until the payload reaches
// SAVE_VERSION. This is intentionally a per-step registry, NOT one growing
// conditional: the next format bump adds SAVE_MIGRATIONS[N] and nothing else.
const SAVE_MIGRATIONS = {
  // v1 → v2: same flat on-disk layout. Normalises an old payload to the current
  // declared flag schema — clones the parsed object (never mutates it
  // destructively), preserves every existing field and flag value, and seeds
  // any flag the old save lacked (e.g. `vale_tutorial_seen`) with that binding's
  // declared default. No gameplay or balance change.
  1: function migrateV1toV2(old) {
    const next = JSON.parse(JSON.stringify(old));
    for (const b of QUEST_FLAG_BINDINGS) {
      if (!(b.key in next)) next[b.key] = cloneDefaultValue(b.default);
    }
    next.version = 2;
    return next;
  },
};
window.SAVE_MIGRATIONS = SAVE_MIGRATIONS;
window.SAVE_VERSION    = SAVE_VERSION;

// Migration coordinator. Validates the parsed payload and applies each required
// migration in order, WITHOUT touching localStorage (the caller persists only
// after a full, successful load). Returns:
//   { ok: true,  data, migratedFrom }  — migratedFrom = the original version if
//     a migration actually ran (original < SAVE_VERSION), else null.
//   { ok: false, reason }              — malformed / unsupported / future /
//     missing-step / migration-error; the caller must leave the save untouched.
function migrateSave(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'save payload is not an object' };
  }
  const originalVersion = parsed.version;
  if (typeof originalVersion !== 'number' || !Number.isFinite(originalVersion) || originalVersion < 1) {
    return { ok: false, reason: 'save has no supported version (' + JSON.stringify(originalVersion) + ')' };
  }
  if (originalVersion > SAVE_VERSION) {
    return { ok: false, reason: 'save is from a future version (' + originalVersion + '); this game understands up to version ' + SAVE_VERSION };
  }
  let data = parsed;
  let v = originalVersion;
  while (v < SAVE_VERSION) {
    const step = SAVE_MIGRATIONS[v];
    if (typeof step !== 'function') {
      return { ok: false, reason: 'no migration registered for version ' + v + ' → ' + (v + 1) };
    }
    let migrated;
    try { migrated = step(data); }
    catch (e) { return { ok: false, reason: 'migration ' + v + ' → ' + (v + 1) + ' threw: ' + (e && e.message || e) }; }
    if (!migrated || typeof migrated !== 'object' || migrated.version !== v + 1) {
      return { ok: false, reason: 'migration ' + v + ' → ' + (v + 1) + ' produced an invalid payload' };
    }
    data = migrated;
    v = data.version;
  }
  return { ok: true, data: data, migratedFrom: originalVersion < SAVE_VERSION ? originalVersion : null };
}
window.migrateSave = migrateSave;

// Warns (console.warn only — no throws, no gameplay impact) if:
//   • a schema flag is absent from save data (old save missing a newer flag)
//   • a schema flag is not actually written by syncQuestFlagsToWindow (saveGame
//     would write undefined for that key)
// Call from loadGame() to catch schema drift at load time.
function validateSaveSchema(data) {
  // 1. Check each schema flag is present in the loaded save data.
  for (const key of QUEST_FLAG_SCHEMA) {
    if (data[key] === undefined) {
      console.warn('[validateSaveSchema] "' + key + '" missing from save data — old save or schema mismatch; will use runtime default');
    }
  }

  // 2. Check each schema flag is actually written by syncQuestFlagsToWindow.
  //    saveGame() reads quest flags via window[key] after calling syncQuestFlagsToWindow();
  //    if a schema key is not set by that sync, the saved value would be undefined.
  syncQuestFlagsToWindow();
  for (const key of QUEST_FLAG_SCHEMA) {
    if (window[key] === undefined) {
      console.warn('[validateSaveSchema] "' + key + '" is in QUEST_FLAG_SCHEMA but not set by syncQuestFlagsToWindow — saveGame() would write undefined for this flag');
    }
  }
}
window.validateSaveSchema = validateSaveSchema;

// ─── Re-creates a saved inventory/equipment item from its current
// ─── ITEM_REGISTRY definition (items.js). Registry properties override stale
// ─── saved metadata (missing keyItem flags, outdated prices/bonuses), while
// ─── legitimate per-instance fields the registry doesn't know about are
// ─── preserved. An item name no longer in the registry is kept as saved,
// ─── with a warning, rather than failing the whole load.
function rehydrateItem(saved) {
  if (!saved || !saved.name) return saved;
  const def = ITEM_REGISTRY[saved.name];
  if (!def) {
    console.warn('[loadGame] saved item "' + saved.name + '" is not in ITEM_REGISTRY — keeping it as saved');
    return { ...saved };
  }
  return { ...saved, ...def };
}

// ─── The single authoritative answer to "can the player save right now?" ───
// Based on MAP_METADATA[mapRegistryId(activeMap)].allowSave -- defaults to
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
  const meta = MAP_METADATA[mapRegistryId(activeMap)];
  return !meta || meta.allowSave !== false;
}
window.canSaveHere = canSaveHere;

// ─── All mutable game state that must survive a save/load cycle should be
// ─── included here. Add new persistent variables to both saveGame() and loadGame().
function saveGame() {
  // Authoritative guard: refuse to write anything at all on a blocked map,
  // regardless of caller. Returns before touching localStorage or any menu
  // state -- the caller (normally input.js's save-confirm handler, which
  // already checked canSaveHere() itself before deciding to call this at
  // all) is responsible for showing the "won't hold" banner.
  if (!canSaveHere()) return false;

  // Resolve a map grid reference to its MAP_REGISTRY key for serialisation
  function mapToId(mapRef) {
    if (!mapRef) return null;
    for (const [id, entry] of Object.entries(MAP_REGISTRY)) {
      if (entry.map === mapRef) return id;
    }
    return null;
  }

  // Quest flags: built generically from the binding registry (one getter each),
  // NOT from a separate key list. syncQuestFlagsToWindow() still runs first so
  // window-native flags are normalized (undefined → default) before their
  // getters read window[key], and so runtime window mirrors stay current for
  // any consumer — but serialization no longer depends on that mirror step.
  syncQuestFlagsToWindow();
  const questFlagData = {};
  for (const b of QUEST_FLAG_BINDINGS) questFlagData[b.key] = b.get();

  const data = {
    version: SAVE_VERSION,
    // ── Player ────────────────────────────────────────────────────────────
    player:     { x: player.x, y: player.y, facing: player.facing },
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
    // ── Location state ────────────────────────────────────────────────────
    activeMapId:        mapToId(activeMap),
    inDungeon,
    dungeonFloor,
    inTown,
    currentTownId,
    townBuilding,
    inSluice,
    sluiceFloor,
    inMireVault,
    inTakomo,
    inFenBrewery,
    inHamletInterior,
    inDungeonEntrance,
    inBasinChamber,
    inSunkenGallery,
    inLorraHouse,
    inMarenPost,
    inDrenwrickPost,
    inBridgePost,
    bridge_entry_direction,
    bridge_toll_paid,
    inSmugglerFort,
    dilemma_voss,
    currentHouseId,
    houseSourceMapId:   mapToId(houseSourceMap),
    houseSourceBuilding,
    houseReturnPos:     { x: houseReturnPos.x, y: houseReturnPos.y },
    // ── Floor pickups ─────────────────────────────────────────────────────
    worldItems:        WORLD_ITEMS.map(w => w.picked),
    map3n1Items:       MAP3_N1_ITEMS.map(w => w.picked),
    dungeonItems:      DUNGEON_ITEMS.map(w => w.picked),
    dungeon2Items:     DUNGEON2_ITEMS.map(w => w.picked),
    dungeon3Items:     DUNGEON3_TC_ITEMS.map(w => w.picked),
    dungeon3TlItems:   DUNGEON3_TL_ITEMS.map(w => w.picked),
    dungeon3TrItems:   DUNGEON3_TR_ITEMS.map(w => w.picked),
    dungeon3MlItems:   DUNGEON3_ML_ITEMS.map(w => w.picked),
    dungeon3McItems:   DUNGEON3_MC_ITEMS.map(w => w.picked),
    dungeon3MrItems:   DUNGEON3_MR_ITEMS.map(w => w.picked),
    dungeon3BlItems:   DUNGEON3_BL_ITEMS.map(w => w.picked),
    dungeon3BcItems:   DUNGEON3_BC_ITEMS.map(w => w.picked),
    dungeon3BrItems:   DUNGEON3_BR_ITEMS.map(w => w.picked),
    dungeon4Items:     DUNGEON4_ITEMS.map(w => w.picked),
    dungeon5Items:     DUNGEON5_ITEMS.map(w => w.picked),
    dungeon6Items:     DUNGEON6_ITEMS.map(w => w.picked),
    dungeon7Items:     DUNGEON7_ITEMS.map(w => w.picked),
    dungeon8Items:     DUNGEON8_ITEMS.map(w => w.picked),
    dungeon8WestItems: DUNGEON8_WEST_ITEMS.map(w => w.picked),
    dungeon8EastItems: DUNGEON8_EAST_ITEMS.map(w => w.picked),
    sluiceItems:       SLUICE_ITEMS.map(w => w.picked),
    sluiceLevel2Items: SLUICE_LEVEL2_ITEMS.map(w => w.picked),
    sluiceLevel3Items: SLUICE_LEVEL3_ITEMS.map(w => w.picked),
    mireVaultItems:    MIRE_VAULT_ITEMS.map(w => w.picked),
    sunkenGalleryItems: SUNKEN_GALLERY_ITEMS.map(w => w.picked),
    // ── Chests ────────────────────────────────────────────────────────────
    homeChestGold:           HOUSE_DATA.player_house.chest.gold,
    chestOpened:             DUNGEON_CHEST.opened,
    sluiceChestOpened:       SLUICE_CHEST.opened,
    sluiceLevel2ChestOpened: SLUICE_LEVEL2_CHEST.opened,
    sluiceSecretChestOpened: SLUICE_SECRET_CHEST.opened,
    sluiceLevel3ChestOpened: SLUICE_LEVEL3_CHEST.opened,
    alcoveChestOpened:       DUNGEON_ALCOVE_CHEST.opened,
    sluiceDeepChestOpened:   SLUICE_DEEP_CHEST.opened,
    catArmorChestOpened:     CAT_ARMOR_CHEST.opened,
    meadowChestOpened:       MEADOW_CHEST.opened,
    // Abandoned Drenwick apartment (c1_u4) — searchable dresser + Tweezers sparkle
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
  localStorage.setItem('verdantVale_save', JSON.stringify(data));
  menu.saveMessage = 120;   // show banner for ~2 s
  menu.screen      = 'main';
  return true;
}

function loadGame() {
  const raw = localStorage.getItem('verdantVale_save');
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

  // Warn-only schema validation — no gameplay impact.
  validateSaveSchema(data);

  // Clear the Upper Reach / Sunken Gallery "visited today" markers
  // (movement.js) unconditionally, before anything else restores. They are
  // deliberately session-only (not part of the save schema — see
  // movement.js's comment), so without this a same-day load from an older
  // save could otherwise leak this session's leftover "visited today" state
  // into a timeline where the visit never happened, letting Rhen/Kest's
  // physical-evidence lines (npcs.js) incorrectly reappear. The very next
  // frame re-sets either flag correctly if the loaded state actually has
  // the player standing on the relevant map.
  window.upper_reach_visit_day    = undefined;
  window.sunken_gallery_visit_day = undefined;

  // Resolve a MAP_REGISTRY key back to a map grid reference; returns null if not found
  function mapFromId(id) {
    return (id && MAP_REGISTRY[id] && MAP_REGISTRY[id].map) || null;
  }

  // ── Player ──────────────────────────────────────────────────────────────
  if (data.player) {
    if (data.player.x      !== undefined) player.x      = data.player.x;
    if (data.player.y      !== undefined) player.y      = data.player.y;
    if (data.player.facing !== undefined) player.facing = data.player.facing;
  }

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

  // ── Key-item equipment normalization ────────────────────────────────────
  // Older saves predate the keyItem flag, so a one-off quest item (type
  // 'accessory') may sit in an equipment slot. Rehydration above restored
  // its keyItem flag from the registry; move it back into stats.items
  // (deduped) and clear the slot so it only surfaces in the Special Items
  // notebook. Everything else in the equipment is left untouched.
  for (const slot of ['weapon', 'armor', 'shield', 'accessory']) {
    const eq = stats[slot];
    if (eq && eq.keyItem) {
      if (!stats.items.some(i => i.name === eq.name)) stats.items.push(eq);
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

  // ── Location state ──────────────────────────────────────────────────────
  if (data.activeMapId !== undefined) {
    // New save format: activeMapId present — restore map reference and all flags directly.
    const resolved = mapFromId(data.activeMapId);
    if (resolved) activeMap = resolved;
    if (data.inDungeon    !== undefined) inDungeon    = data.inDungeon;
    if (data.dungeonFloor !== undefined) dungeonFloor = data.dungeonFloor;
    if (data.inTown       !== undefined) inTown       = data.inTown;
    if (data.currentTownId !== undefined) currentTownId = data.currentTownId;
    if (data.townBuilding !== undefined) townBuilding = data.townBuilding;
    if (data.inSluice     !== undefined) inSluice     = data.inSluice;
    if (data.sluiceFloor  !== undefined) sluiceFloor  = data.sluiceFloor;
    if (data.inMireVault  !== undefined) inMireVault  = data.inMireVault;
    if (data.inTakomo     !== undefined) inTakomo     = data.inTakomo;
    if (data.inFenBrewery    !== undefined) inFenBrewery    = data.inFenBrewery;
    if (data.inHamletInterior !== undefined) inHamletInterior = data.inHamletInterior;
    if (data.inDungeonEntrance !== undefined) inDungeonEntrance = data.inDungeonEntrance;
    if (data.inBasinChamber  !== undefined) inBasinChamber  = data.inBasinChamber;
    if (data.inSunkenGallery !== undefined) inSunkenGallery = data.inSunkenGallery;
    if (data.inLorraHouse    !== undefined) inLorraHouse    = data.inLorraHouse;
    if (data.inMarenPost     !== undefined) inMarenPost     = data.inMarenPost;
    if (data.inDrenwrickPost !== undefined) inDrenwrickPost = data.inDrenwrickPost;
    if (data.inBridgePost          !== undefined) inBridgePost          = data.inBridgePost;
    if (data.bridge_entry_direction !== undefined) bridge_entry_direction = data.bridge_entry_direction;
    if (data.bridge_toll_paid       !== undefined) bridge_toll_paid       = data.bridge_toll_paid;
    if (data.inSmugglerFort  !== undefined) inSmugglerFort  = data.inSmugglerFort;
    if (data.dilemma_voss    !== undefined) dilemma_voss    = data.dilemma_voss;
    if (data.currentHouseId      !== undefined) currentHouseId      = data.currentHouseId;
    if (data.houseSourceBuilding !== undefined) houseSourceBuilding = data.houseSourceBuilding;
    if (data.houseSourceMapId !== undefined) {
      houseSourceMap = mapFromId(data.houseSourceMapId);  // null is valid (not in a house)
    }
    if (data.houseReturnPos) {
      if (data.houseReturnPos.x !== undefined) houseReturnPos.x = data.houseReturnPos.x;
      if (data.houseReturnPos.y !== undefined) houseReturnPos.y = data.houseReturnPos.y;
    }
  } else {
    // Old save format: no activeMapId — derive activeMap from stored flags so that
    // the map reference and location booleans stay consistent. Without this, flags
    // like inDungeon=true would combine with the default activeMap=MAP and cause
    // dungeon/town NPCs and items to render on the overworld at wrong positions.
    if (data.inDungeon) {
      const floor  = data.dungeonFloor || 1;
      inDungeon    = true;
      dungeonFloor = floor;
      activeMap    = floor === 2 ? DUNGEON2_MAP
                  : floor === 3 ? DUNGEON3_MAP
                  : floor === 4 ? DUNGEON4_MAP
                  : floor === 5 ? DUNGEON5_MAP
                  : DUNGEON_MAP;
    } else if (data.inSluice) {
      const floor = data.sluiceFloor || 1;
      inSluice    = true;
      sluiceFloor = floor;
      activeMap   = floor === 3 ? SLUICE_LEVEL3_MAP
                  : floor === 2 ? SLUICE_LEVEL2_MAP
                  :               SLUICE_MAP;
    } else if (data.inMireVault) {
      inMireVault = true;
      activeMap   = MIRE_VAULT_MAP;
    } else if (data.inTakomo) {
      inTakomo  = true;
      activeMap = TAKOMO_MAP;
    } else if (data.inFenBrewery) {
      inFenBrewery = true;
      activeMap    = FEN_BREWERY_MAP;
    } else if (data.inHamletInterior) {
      inHamletInterior = true;
      activeMap        = HAMLET_INTERIOR_MAP;
    } else if (data.inTown) {
      inTown       = true;
      townBuilding = data.townBuilding || null;
      const b = data.townBuilding;
      if (b === 'house') {
        // houseSourceMap/houseReturnPos not in old saves; back out to town map safely.
        townBuilding = null;
        activeMap    = TOWN_MAP;
        player.x = 7.5 * TILE; player.y = 7.5 * TILE; player.facing = 'down';
      } else {
        activeMap = b === 'inn'    ? INN_MAP
                  : b === 'school' ? SCHOOL_MAP
                  : b === 'apt'    ? APARTMENT_CORRIDOR_MAP
                  : b === 'office' ? OFFICE_MAP
                  : b === 'east'   ? EAST_TOWN_MAP
                  : b === 'west'   ? WEST_TOWN_MAP
                  :                  TOWN_MAP;
      }
    }
    // else: overworld — activeMap stays MAP (default), all flags stay false ✓
  }

  // ── Floor pickups ───────────────────────────────────────────────────────
  if (Array.isArray(data.worldItems)) {
    data.worldItems.forEach((picked, i) => { if (WORLD_ITEMS[i]) WORLD_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.map3n1Items)) {
    data.map3n1Items.forEach((picked, i) => { if (MAP3_N1_ITEMS[i]) MAP3_N1_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeonItems)) {
    data.dungeonItems.forEach((picked, i) => { if (DUNGEON_ITEMS[i]) DUNGEON_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon2Items)) {
    data.dungeon2Items.forEach((picked, i) => { if (DUNGEON2_ITEMS[i]) DUNGEON2_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon3Items)) {
    data.dungeon3Items.forEach((picked, i) => { if (DUNGEON3_TC_ITEMS[i]) DUNGEON3_TC_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon3TlItems)) {
    data.dungeon3TlItems.forEach((picked, i) => { if (DUNGEON3_TL_ITEMS[i]) DUNGEON3_TL_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon3TrItems)) {
    data.dungeon3TrItems.forEach((picked, i) => { if (DUNGEON3_TR_ITEMS[i]) DUNGEON3_TR_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon3MlItems)) {
    data.dungeon3MlItems.forEach((picked, i) => { if (DUNGEON3_ML_ITEMS[i]) DUNGEON3_ML_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon3McItems)) {
    data.dungeon3McItems.forEach((picked, i) => { if (DUNGEON3_MC_ITEMS[i]) DUNGEON3_MC_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon3MrItems)) {
    data.dungeon3MrItems.forEach((picked, i) => { if (DUNGEON3_MR_ITEMS[i]) DUNGEON3_MR_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon3BlItems)) {
    data.dungeon3BlItems.forEach((picked, i) => { if (DUNGEON3_BL_ITEMS[i]) DUNGEON3_BL_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon3BcItems)) {
    data.dungeon3BcItems.forEach((picked, i) => { if (DUNGEON3_BC_ITEMS[i]) DUNGEON3_BC_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon3BrItems)) {
    data.dungeon3BrItems.forEach((picked, i) => { if (DUNGEON3_BR_ITEMS[i]) DUNGEON3_BR_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon4Items)) {
    data.dungeon4Items.forEach((picked, i) => { if (DUNGEON4_ITEMS[i]) DUNGEON4_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon5Items)) {
    data.dungeon5Items.forEach((picked, i) => { if (DUNGEON5_ITEMS[i]) DUNGEON5_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon6Items)) {
    data.dungeon6Items.forEach((picked, i) => { if (DUNGEON6_ITEMS[i]) DUNGEON6_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon7Items)) {
    data.dungeon7Items.forEach((picked, i) => { if (DUNGEON7_ITEMS[i]) DUNGEON7_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon8Items)) {
    data.dungeon8Items.forEach((picked, i) => { if (DUNGEON8_ITEMS[i]) DUNGEON8_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon8WestItems)) {
    data.dungeon8WestItems.forEach((picked, i) => { if (DUNGEON8_WEST_ITEMS[i]) DUNGEON8_WEST_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.dungeon8EastItems)) {
    data.dungeon8EastItems.forEach((picked, i) => { if (DUNGEON8_EAST_ITEMS[i]) DUNGEON8_EAST_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.sluiceItems)) {
    data.sluiceItems.forEach((picked, i) => { if (SLUICE_ITEMS[i]) SLUICE_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.sluiceLevel2Items)) {
    data.sluiceLevel2Items.forEach((picked, i) => { if (SLUICE_LEVEL2_ITEMS[i]) SLUICE_LEVEL2_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.sluiceLevel3Items)) {
    data.sluiceLevel3Items.forEach((picked, i) => { if (SLUICE_LEVEL3_ITEMS[i]) SLUICE_LEVEL3_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.mireVaultItems)) {
    data.mireVaultItems.forEach((picked, i) => { if (MIRE_VAULT_ITEMS[i]) MIRE_VAULT_ITEMS[i].picked = picked; });
  }
  if (Array.isArray(data.sunkenGalleryItems)) {
    data.sunkenGalleryItems.forEach((picked, i) => { if (SUNKEN_GALLERY_ITEMS[i]) SUNKEN_GALLERY_ITEMS[i].picked = picked; });
  }

  // ── Chests ──────────────────────────────────────────────────────────────
  if (data.homeChestGold           !== undefined) HOUSE_DATA.player_house.chest.gold = data.homeChestGold;
  if (data.chestOpened             !== undefined) DUNGEON_CHEST.opened       = data.chestOpened;
  if (data.sluiceChestOpened       !== undefined) SLUICE_CHEST.opened        = data.sluiceChestOpened;
  if (data.sluiceLevel2ChestOpened !== undefined) SLUICE_LEVEL2_CHEST.opened = data.sluiceLevel2ChestOpened;
  if (data.sluiceSecretChestOpened !== undefined) SLUICE_SECRET_CHEST.opened    = data.sluiceSecretChestOpened;
  if (data.sluiceLevel3ChestOpened !== undefined) SLUICE_LEVEL3_CHEST.opened    = data.sluiceLevel3ChestOpened;
  if (data.alcoveChestOpened       !== undefined) DUNGEON_ALCOVE_CHEST.opened   = data.alcoveChestOpened;
  if (data.sluiceDeepChestOpened   !== undefined) SLUICE_DEEP_CHEST.opened      = data.sluiceDeepChestOpened;
  if (data.catArmorChestOpened     !== undefined) CAT_ARMOR_CHEST.opened        = data.catArmorChestOpened;
  if (data.meadowChestOpened       !== undefined) MEADOW_CHEST.opened           = data.meadowChestOpened;
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
  // Repair: saves written while the defeat-respawn bug left inBridgePost
  // stranded (died at the bridge, carried home, flag never cleared) carry
  // inBridgePost=true with a non-bridge activeMap. Loading that unrepaired
  // would make currentMapId() report 'bridge_post' everywhere — the guards
  // would render on every screen. Clear the inconsistent state instead.
  if (inBridgePost && activeMap !== BRIDGE_CROSSING_MAP) {
    inBridgePost = false; bridge_entry_direction = null; bridge_toll_paid = false;
  }
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

  // ── Migration persistence + versioned backup ───────────────────────────────
  // Only after a FULL, successful load: if this save needed migrating, preserve
  // the ORIGINAL raw payload under a versioned backup key (written once — never
  // overwritten on a later load) and rewrite the migrated payload to the normal
  // key. Done with direct localStorage writes, NOT saveGame(), so save-location
  // restrictions (canSaveHere()) and menu side effects can't interfere with
  // migration persistence. A normal same-version load does neither (no
  // migratedFrom), so it creates no backup and rewrites nothing.
  if (migration.migratedFrom !== null) {
    const backupKey = 'verdantVale_save_backup_v' + migration.migratedFrom;
    if (localStorage.getItem(backupKey) === null) localStorage.setItem(backupKey, raw);
    localStorage.setItem('verdantVale_save', JSON.stringify(data));
  }

  return true;
}

