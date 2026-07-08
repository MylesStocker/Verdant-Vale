'use strict';

// save.js — save-file schema and the saveGame()/loadGame() implementations.

// Increment when the save format changes in a breaking way; loadGame() will
// discard any save that doesn't match and start a new game instead.
const SAVE_VERSION = 1;

// ─── Canonical list of scalar quest/world flags that go through the simple
// ─── save-key === variable-name pattern. These are the flags exposed by
// ─── syncQuestFlagsToWindow() in quests.js. Adding a new quest flag means
// ─── updating this list, syncQuestFlagsToWindow(), and a manual load line
// ─── in loadGame() (let-bindings cannot be written via window[key]).
// ─── Exposed on window so validateGameData() in validation.js can reference it.
const QUEST_FLAG_SCHEMA = [
  'cabinetCaseFlag',
  'sluice_job_started', 'sluice_fixed', 'sluice_pay_ticket_ready', 'sluice_reward_given',
  'MainQuest', 'equipment_ticket_ready',
  'letter_quest_stage', 'cat_quest_stage',
  'warden_quest_started', 'warden_quest_defeated', 'warden_quest_rewarded',
  'schilling_quest_started', 'schilling_returned',
  'drama_stage', 'weight_quest_stage', 'weight_note_signed',
  'sentry_quest_started', 'sentry_quest_done', 'sentry_quest_rewarded', 'pale_sentry_hp',
  'sickle_quest_stage', 'gridd_rainfish_warned', 'rainfish_woken',
  'dispatch_quest_started', 'dispatch_delivered', 'dispatch_pay_ticket_ready', 'dispatch_rewarded',
  'fort_quest_started', 'fort_quest_stage', 'fort_pay_ticket_ready', 'fort_pay_ticket_reduced',
  'smugglers_dead', 'smugglers_execution_day',
  'den_wraith_quest_started', 'den_wraith_defeated', 'den_wraith_rewarded',
  'netto_letter_received',  // was absent from saveGame() before; now included
  'dessa_met',              // rapport gate: must meet Dessa once before quest offer
  'rareborn_rhyme_heard',   // player has heard the rareborn spotting-rhyme (Calwick school)
  'wine_quest_started', 'wine_quest_gift', 'wine_quest_delivered', 'wine_quest_rewarded',
];
window.QUEST_FLAG_SCHEMA = QUEST_FLAG_SCHEMA;

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

// ─── All mutable game state that must survive a save/load cycle should be
// ─── included here. Add new persistent variables to both saveGame() and loadGame().
function saveGame() {
  // Resolve a map grid reference to its MAP_REGISTRY key for serialisation
  function mapToId(mapRef) {
    if (!mapRef) return null;
    for (const [id, entry] of Object.entries(MAP_REGISTRY)) {
      if (entry.map === mapRef) return id;
    }
    return null;
  }

  // Sync quest flags to window.* so we can read them by name from QUEST_FLAG_SCHEMA.
  // This is a read-only sync (no game state changes); result used only for this save.
  syncQuestFlagsToWindow();
  const questFlagData = {};
  for (const key of QUEST_FLAG_SCHEMA) questFlagData[key] = window[key];

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
    // ── Chests ────────────────────────────────────────────────────────────
    homeChestGold:           HOUSE_DATA.player_house.chest.gold,
    mireVaultChestOpened:    MIRE_VAULT_CHEST.opened,
    chestOpened:             DUNGEON_CHEST.opened,
    sluiceChestOpened:       SLUICE_CHEST.opened,
    sluiceLevel2ChestOpened: SLUICE_LEVEL2_CHEST.opened,
    sluiceSecretChestOpened: SLUICE_SECRET_CHEST.opened,
    sluiceLevel3ChestOpened: SLUICE_LEVEL3_CHEST.opened,
    alcoveChestOpened:       DUNGEON_ALCOVE_CHEST.opened,
    sluiceDeepChestOpened:   SLUICE_DEEP_CHEST.opened,
    catArmorChestOpened:     CAT_ARMOR_CHEST.opened,
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
    // ── Vault NPC ─────────────────────────────────────────────────────────
    mirethystRewarded:   !!window.mirethyst_rewarded,
  };
  localStorage.setItem('verdantVale_save', JSON.stringify(data));
  menu.saveMessage = 120;   // show banner for ~2 s
  menu.screen      = 'main';
}

function loadGame() {
  const raw = localStorage.getItem('verdantVale_save');
  if (!raw) return false;
  let data;
  try { data = JSON.parse(raw); } catch (e) { return false; }

  // Discard saves from before the unified save/load system.
  // Removes the stale entry so it doesn't block future saves.
  if (data.version !== SAVE_VERSION) {
    localStorage.removeItem('verdantVale_save');
    return false;
  }

  // Warn-only schema validation — no gameplay impact.
  validateSaveSchema(data);

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
    stats.weapon    = s.weapon    !== undefined ? s.weapon    : null;
    stats.armor     = s.armor     !== undefined ? s.armor     : null;
    stats.shield    = s.shield    !== undefined ? s.shield    : null;
    stats.accessory = s.accessory !== undefined ? s.accessory : null;
    stats.items     = Array.isArray(s.items) ? s.items.map(i => ({ ...i })) : [];
  }

  // ── World / time ────────────────────────────────────────────────────────
  if (data.day              !== undefined) day              = data.day;
  if (data.travellerPresent !== undefined) travellerPresent = data.travellerPresent;

  // ── Quest flags ─────────────────────────────────────────────────────────
  // ── Quest flags (manual — let-bindings cannot be written via window[key]) ──
  if (data.cabinetCaseFlag          !== undefined) cabinetCaseFlag          = data.cabinetCaseFlag;
  if (data.sluice_job_started       !== undefined) sluice_job_started       = data.sluice_job_started;
  if (data.sluice_fixed             !== undefined) sluice_fixed             = data.sluice_fixed;
  if (data.sluice_pay_ticket_ready  !== undefined) sluice_pay_ticket_ready  = data.sluice_pay_ticket_ready;
  if (data.sluice_reward_given      !== undefined) sluice_reward_given      = data.sluice_reward_given;
  if (data.MainQuest                !== undefined) MainQuest                = data.MainQuest;
  if (data.equipment_ticket_ready   !== undefined) equipment_ticket_ready   = data.equipment_ticket_ready;
  if (data.letter_quest_stage       !== undefined) letter_quest_stage       = data.letter_quest_stage;
  if (data.cat_quest_stage          !== undefined) cat_quest_stage          = data.cat_quest_stage;
  if (data.warden_quest_started     !== undefined) warden_quest_started     = data.warden_quest_started;
  if (data.warden_quest_defeated    !== undefined) warden_quest_defeated    = data.warden_quest_defeated;
  if (data.warden_quest_rewarded    !== undefined) warden_quest_rewarded    = data.warden_quest_rewarded;
  if (data.schilling_quest_started  !== undefined) schilling_quest_started  = data.schilling_quest_started;
  if (data.schilling_returned       !== undefined) schilling_returned       = data.schilling_returned;
  if (data.drama_stage              !== undefined) drama_stage              = data.drama_stage;
  if (data.weight_quest_stage       !== undefined) weight_quest_stage       = data.weight_quest_stage;
  if (data.weight_note_signed       !== undefined) weight_note_signed       = data.weight_note_signed;
  if (data.sentry_quest_started     !== undefined) sentry_quest_started     = data.sentry_quest_started;
  if (data.sentry_quest_done        !== undefined) sentry_quest_done        = data.sentry_quest_done;
  if (data.sentry_quest_rewarded    !== undefined) sentry_quest_rewarded    = data.sentry_quest_rewarded;
  if (data.pale_sentry_hp           !== undefined) pale_sentry_hp           = data.pale_sentry_hp;
  if (data.sickle_quest_stage       !== undefined) sickle_quest_stage       = data.sickle_quest_stage;
  if (data.gridd_rainfish_warned    !== undefined) gridd_rainfish_warned    = data.gridd_rainfish_warned;
  if (data.rainfish_woken           !== undefined) rainfish_woken           = data.rainfish_woken;
  if (data.dispatch_quest_started   !== undefined) dispatch_quest_started   = data.dispatch_quest_started;
  if (data.dispatch_delivered       !== undefined) dispatch_delivered       = data.dispatch_delivered;
  if (data.dispatch_pay_ticket_ready !== undefined) dispatch_pay_ticket_ready = data.dispatch_pay_ticket_ready;
  if (data.dispatch_rewarded        !== undefined) dispatch_rewarded        = data.dispatch_rewarded;
  if (data.fort_quest_started       !== undefined) fort_quest_started       = data.fort_quest_started;
  if (data.fort_quest_stage         !== undefined) fort_quest_stage         = data.fort_quest_stage;
  if (data.fort_pay_ticket_ready    !== undefined) fort_pay_ticket_ready    = data.fort_pay_ticket_ready;
  if (data.fort_pay_ticket_reduced  !== undefined) fort_pay_ticket_reduced  = data.fort_pay_ticket_reduced;
  if (data.smugglers_dead           !== undefined) smugglers_dead           = data.smugglers_dead;
  if (data.smugglers_execution_day  !== undefined) smugglers_execution_day  = data.smugglers_execution_day;
  if (data.den_wraith_quest_started !== undefined) den_wraith_quest_started = data.den_wraith_quest_started;
  if (data.den_wraith_defeated      !== undefined) den_wraith_defeated      = data.den_wraith_defeated;
  if (data.den_wraith_rewarded      !== undefined) den_wraith_rewarded      = data.den_wraith_rewarded;
  if (data.netto_letter_received    !== undefined) netto_letter_received    = data.netto_letter_received;
  if (data.dessa_met                !== undefined) dessa_met                = data.dessa_met;
  if (data.rareborn_rhyme_heard     !== undefined) rareborn_rhyme_heard     = data.rareborn_rhyme_heard;
  if (data.wine_quest_started       !== undefined) wine_quest_started       = data.wine_quest_started;
  if (data.wine_quest_gift          !== undefined) wine_quest_gift          = data.wine_quest_gift;
  if (data.wine_quest_delivered     !== undefined) wine_quest_delivered     = data.wine_quest_delivered;
  if (data.wine_quest_rewarded      !== undefined) wine_quest_rewarded      = data.wine_quest_rewarded;
  // dilemma_voss: main.js var, not in syncQuestFlagsToWindow — remains in location block below
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

  // ── Chests ──────────────────────────────────────────────────────────────
  if (data.homeChestGold           !== undefined) HOUSE_DATA.player_house.chest.gold = data.homeChestGold;
  if (data.mireVaultChestOpened    !== undefined) MIRE_VAULT_CHEST.opened    = data.mireVaultChestOpened;
  if (data.chestOpened             !== undefined) DUNGEON_CHEST.opened       = data.chestOpened;
  if (data.sluiceChestOpened       !== undefined) SLUICE_CHEST.opened        = data.sluiceChestOpened;
  if (data.sluiceLevel2ChestOpened !== undefined) SLUICE_LEVEL2_CHEST.opened = data.sluiceLevel2ChestOpened;
  if (data.sluiceSecretChestOpened !== undefined) SLUICE_SECRET_CHEST.opened    = data.sluiceSecretChestOpened;
  if (data.sluiceLevel3ChestOpened !== undefined) SLUICE_LEVEL3_CHEST.opened    = data.sluiceLevel3ChestOpened;
  if (data.alcoveChestOpened       !== undefined) DUNGEON_ALCOVE_CHEST.opened   = data.alcoveChestOpened;
  if (data.sluiceDeepChestOpened   !== undefined) SLUICE_DEEP_CHEST.opened      = data.sluiceDeepChestOpened;
  if (data.catArmorChestOpened     !== undefined) CAT_ARMOR_CHEST.opened        = data.catArmorChestOpened;
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
  if (data.mirethystRewarded) window.mirethyst_rewarded = true;

  return true;
}

