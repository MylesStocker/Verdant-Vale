'use strict';

// ─── Levelling ────────────────────────────────────────────────────────────────
// Cumulative XP required to reach each level; index = current level when
// checking for level-up. e.g. at level 1, need xp >= XP_THRESHOLDS[1] (100) to
// advance to level 2. Levels 1→10 keep the original doubling curve (…12800,
// 25600). From 10 onward the curve tapers to a steadily-growing (not doubling)
// gap so levels 11-20 are a real endgame grind rather than unreachable: the
// step between thresholds rises by ~5,000 each level, reaching 400,000 total
// XP at level 20.
const XP_THRESHOLDS = [
  0, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600,
  40000, 60000, 85000, 115000, 150000, 190000, 235000, 285000, 340000, 400000,
];
const MAX_LEVEL = 20; // indices 1-19 cover level-ups 1→2 through 19→20

// ─── Combat ───────────────────────────────────────────────────────────────────
const ENEMY_TEMPLATES = [
  // Ethereal wisp — fragile but eerie; low HP and defense, moderate attack
  { id: 'enemy_marsh_wisp',    name: 'Marsh Wisp',    hp: 14, maxHp: 14, atk: 5, def: 1, spd:  9, xp: 12, goldMin: 1, goldMax:  3 },
  // Rocky tank — extremely tough shell, slow attack
  { id: 'enemy_stone_crawler', name: 'Stone Crawler', hp: 36, maxHp: 36, atk: 13, def: 6, spd:  3, xp: 20, goldMin: 3, goldMax:  8, defendChance: 0.20 },
  // Predatory hound — aggressive, hits hard, lightly armored
  { id: 'enemy_briar_hound',   name: 'Briar Hound',   hp: 25, maxHp: 25, atk: 10, def: 2, spd:  8, xp: 16, goldMin: 3, goldMax:  8 },
];

// ─── Early-area enemies (starting overworld MAP only) ──────────────────────────
// Gentler variants used exclusively on the starting map (MAP). ENEMY_TEMPLATES
// applies from MAP2 onward. Keeps Stone Crawler out of the very first encounters.
const EARLY_ENEMY_TEMPLATES = [
  { id: 'enemy_marsh_wisp_early',  name: 'Marsh Wisp',  hp: 10, maxHp: 10, atk: 3, def: 0, spd: 6, xp:  8, goldMin: 0, goldMax: 2 },
  { id: 'enemy_briar_hound_early', name: 'Briar Hound', hp: 16, maxHp: 16, atk: 6, def: 1, spd: 5, xp: 10, goldMin: 2, goldMax: 5 },
];
window.EARLY_ENEMY_TEMPLATES = EARLY_ENEMY_TEMPLATES;

const DUNGEON_ENEMY_TEMPLATES = [
  // Bone Guard — heavily armored skeleton warrior
  { id: 'enemy_bone_guard',   name: 'Bone Guard',   hp: 36, maxHp: 36, atk: 8,  def: 6, spd:  4, xp: 28, goldMin: 8, goldMax: 15, defendChance: 0.25 },
  // Shade Wraith — fast spectral assassin, fragile but hits hard
  { id: 'enemy_shade_wraith', name: 'Shade Wraith', hp: 26, maxHp: 26, atk: 12, def: 2, spd: 12, xp: 32, goldMin: 8, goldMax: 15 },
];

const DUNGEON2_ENEMY_TEMPLATES = [
  // Crypt Fiend — massive rotting brute; high HP, hits hard, heavily armored
  { id: 'enemy_crypt_fiend',  name: 'Crypt Fiend',  hp: 52, maxHp: 52, atk: 15, def: 8,  spd:  3, xp: 55, goldMin: 12, goldMax: 22 },
  // Void Walker — void-touched entity; fragile shell but devastating attack
  { id: 'enemy_void_walker',  name: 'Void Walker',  hp: 38, maxHp: 38, atk: 22, def: 3,  spd:  7, xp: 65, goldMin: 16, goldMax: 28, curseChance: 0.20 },
];

// Floors 6-7 — deeper ruin depths; harder than floors 2-5
const DUNGEON6_ENEMY_TEMPLATES = [
  // Hollow — gutted animated shell; armored but slow, grinds you down
  { id: 'enemy_hollow',    name: 'Hollow',    hp: 65, maxHp: 65, atk: 20, def: 10, spd:  5, xp:  80, goldMin: 18, goldMax: 32, defendChance: 0.20 },
  // Fen Shade — spectral remnant seeped from the wetlands above; fast, hits hard
  { id: 'enemy_fen_shade', name: 'Fen Shade', hp: 45, maxHp: 45, atk: 28, def:  4, spd:  8, xp:  90, goldMin: 20, goldMax: 35 },
];

// Floor 8 — the deepest structured chamber before the horror branches
const DUNGEON8_ENEMY_TEMPLATES = [
  // Tomb Sentry — petrified guardian reanimated; extremely durable, slow
  { id: 'enemy_tomb_sentry',    name: 'Tomb Sentry',    hp: 90, maxHp: 90, atk: 25, def: 12, spd:  3, xp: 120, goldMin: 25, goldMax: 45, defendChance: 0.30 },
  // Crypt Revenant — something that was buried twice; fast, savage, barely coherent
  { id: 'enemy_crypt_revenant', name: 'Crypt Revenant', hp: 70, maxHp: 70, atk: 32, def:  5, spd: 10, xp: 130, goldMin: 28, goldMax: 50 },
];

// Horror branches (floors 9 & 10) — the glutinous side-chambers; biological and wrong
const DUNGEON_HORROR_ENEMY_TEMPLATES = [
  // Wall Tendril — something that grows from the walls; fast, hard to hit, devastating
  { id: 'enemy_wall_tendril', name: 'Wall Tendril', hp:  55, maxHp:  55, atk: 38, def:  2, spd: 14, xp: 150, goldMin: 30, goldMax: 55 },
  // Dripping Maw — a mouth that forms in the ceiling; massive, drips acid, slow
  { id: 'enemy_dripping_maw', name: 'Dripping Maw', hp: 120, maxHp: 120, atk: 35, def:  8, spd:  5, xp: 160, goldMin: 32, goldMax: 58 },
  // The Seep — formless biological mass; no defense, but hits with everything it has
  { id: 'enemy_the_seep',     name: 'The Seep',     hp:  40, maxHp:  40, atk: 45, def:  0, spd: 18, xp: 170, goldMin: 35, goldMax: 62 },
];

// Rainfish — scripted encounter only (Still Water quest, MAP3_N1 bog-edge danger zone).
// Very fast (almost always strike first), low HP, no reward to speak of. Three in a row.
// Cannot flee — the school is all around the player in the shallows.
const RAINFISH_TEMPLATE = { id: 'enemy_rainfish', name: 'Rainfish', hp: 22, maxHp: 22, atk: 10, def: 0, spd: 24, xp: 5, goldMin: 0, goldMax: 1 };
window.RAINFISH_TEMPLATE = RAINFISH_TEMPLATE;

// Enemies for far world squares (MAP3, MAP_N1, MAP_N2) — significantly harder than ENEMY_TEMPLATES
const FAR_ENEMY_TEMPLATES = [
  // Fen Lurker — ambush predator; high speed and attack, decent HP
  { id: 'enemy_fen_lurker',    name: 'Fen Lurker',    hp: 38, maxHp: 38, atk: 14, def: 3,  spd: 11, xp: 38, goldMin: 8,  goldMax: 18 },
  // Rotwood Troll — regenerating swamp brute; very high HP, slow but hits hard
  { id: 'enemy_rotwood_troll', name: 'Rotwood Troll', hp: 58, maxHp: 58, atk: 16, def: 6,  spd:  3, xp: 45, goldMin: 10, goldMax: 20 },
  // Thornback — armored bog beast; heavily armored, moderate attack
  { id: 'enemy_thornback',     name: 'Thornback',     hp: 44, maxHp: 44, atk: 12, def: 9,  spd:  4, xp: 42, goldMin: 9,  goldMax: 18 },
  // Fen Witch — cursed hag; devastating magic-like attack, fragile
  { id: 'enemy_fen_witch',     name: 'Fen Witch',     hp: 32, maxHp: 32, atk: 20, def: 2,  spd:  8, xp: 50, goldMin: 12, goldMax: 22 },
  // Bog Serpent — massive wetland snake; high HP and moderate attack, swift
  { id: 'enemy_bog_serpent',   name: 'Bog Serpent',   hp: 48, maxHp: 48, atk: 15, def: 4,  spd:  9, xp: 48, goldMin: 10, goldMax: 20 },
  // Mire Toad — the jack and the hen. Two common fen toads, IDENTICAL in name,
  // sprite and EVERY stat: the `sex` field is the only difference, and it is
  // invisible in battle (never shown in the name, message, HP or stats). Only
  // Observe reveals which is which (getObservationText), and only a sex-matched
  // reagent (Henbane Sprig / Jackbane Vial, items.js) drops it in one move.
  // Deliberately durable (high HP + def) and unpleasant (poison-skinned): a slow
  // slog to grind down by attacks, and it drips toxin on a hit, so paying 8 gold
  // and an Observe to end it instantly is the better play. Both entries in the
  // pool so each sex is ~1-in-7 of a fen fight.
  { id: 'enemy_mire_toad_male',   name: 'Mire Toad',     hp: 72, maxHp: 72, atk: 15, def: 10, spd:  5, xp: 52, goldMin: 10, goldMax: 20, poisonChance: 0.30, sex: 'male'   },
  { id: 'enemy_mire_toad_female', name: 'Mire Toad',     hp: 72, maxHp: 72, atk: 15, def: 10, spd:  5, xp: 52, goldMin: 10, goldMax: 20, poisonChance: 0.30, sex: 'female' },
];

// Enemies specific to Thornmere (MAP4) and Thornmere Shallows (MAP5) — deeper fen, harder than the open marsh
const THORNMERE_ENEMY_TEMPLATES = [
  // Corpse Slug — enormous pale slug; bloated, slow, carries the rot of the deep fen
  { id: 'enemy_corpse_slug', name: 'Corpse Slug', hp: 62, maxHp: 62, atk: 13, def: 6, spd: 2, xp: 55, goldMin: 14, goldMax: 28 },
];
window.THORNMERE_ENEMY_TEMPLATES = THORNMERE_ENEMY_TEMPLATES;

// Enemies specific to the East Sluice — aquatic/canal-dwelling, mid-tier difficulty
const SLUICE_ENEMY_TEMPLATES = [
  // Reed Grappler — armoured freshwater crustacean; tanky shell, slow but strong claws
  { id: 'enemy_reed_grappler', name: 'Reed Grappler', hp: 34, maxHp: 34, atk:  9, def: 5, spd:  5, xp: 26, goldMin:  5, goldMax: 12 },
  // Silt Lurker — eel-like ambush predator; erupts from canal mud, fast and vicious
  { id: 'enemy_silt_lurker',   name: 'Silt Lurker',   hp: 22, maxHp: 22, atk: 13, def: 1, spd: 11, xp: 30, goldMin:  5, goldMax: 11 },
];

// East Sluice TOP floor (sluiceFloor 1) — deliberately as gentle as the Verdant
// Vale overworld, since this is likely where the player takes their first
// fights (see currentEncounterPool() in combat.js). Sluice-appropriate
// creatures rather than the Vale's Briar Hound: the Marsh Wisp drifts here over
// the standing water, and the Sluice Slime — a slow, gooey nuisance — is on par
// with the wisp for difficulty. Descending (floors 2–3) spikes to the tougher
// SLUICE_ENEMY_TEMPLATES above. (Distinct enemy ids: this Marsh Wisp is its own
// template record, separate from the overworld/early ones.)
const SLUICE_TOP_ENEMY_TEMPLATES = [
  { id: 'enemy_marsh_wisp_sluice_top', name: 'Marsh Wisp',   hp: 10, maxHp: 10, atk: 8, def: 0, spd: 6, xp: 8, goldMin: 0, goldMax: 2 },
  // Sluice Slime — a blob of sluice muck given sluggish life; a touch tankier
  // than the wisp but slower, so it lands about the same as a first fight.
  // atk 8: against the issued Leather Armor (def 2 base + 3) this deals ~1-5 a
  // hit instead of a flat 1, so the first dungeon actually threatens.
  { id: 'enemy_sluice_slime',          name: 'Sluice Slime', hp: 12, maxHp: 12, atk: 8, def: 1, spd: 3, xp: 8, goldMin: 0, goldMax: 3 },
];
window.SLUICE_TOP_ENEMY_TEMPLATES = SLUICE_TOP_ENEMY_TEMPLATES;

// The North Basin's Silt Flats (NORTH_BASIN_SW_MAP) — the region's first real
// encounter map. Deliberately gentler than FAR_ENEMY_TEMPLATES (this is meant
// to be an easy on-ramp into the basin, not another Rotwood Troll-style
// spike — see BALANCE_REPORT.md for why that comparison matters here).
const NORTH_BASIN_ENEMY_TEMPLATES = [
  // Silt Crab — small crustacean stranded by the retreating waterline; slow,
  // shelled, occasionally braces. A tank, not a threat.
  { id: 'enemy_silt_crab',       name: 'Silt Crab',       hp: 28, maxHp: 28, atk: 12, def: 5, spd:  4, xp: 18, goldMin: 4, goldMax:  9, defendChance: 0.20 },
  // Mudflat Strider — long-legged wader that used to work the shallows;
  // exposed ground suits it fine. Fast, fragile, low reward.
  { id: 'enemy_mudflat_strider', name: 'Mudflat Strider', hp: 20, maxHp: 20, atk: 11, def: 2, spd: 10, xp: 16, goldMin: 3, goldMax:  7 },
  // Basin Gull — scavenger gull come inland off the Thornmere, working the
  // stranded-fish die-offs on the exposed bed. Bold enough to go for the
  // eyes; quick, hits harder than it looks, folds fast when hit back.
  { id: 'enemy_basin_gull',      name: 'Basin Gull',      hp: 24, maxHp: 24, atk: 14, def: 3, spd: 12, xp: 20, goldMin: 5, goldMax: 10 },
];
window.NORTH_BASIN_ENEMY_TEMPLATES = NORTH_BASIN_ENEMY_TEMPLATES;

// ─── The Sunken Gallery (under the Upper Reach) ──────────────────────────────
// The drought-exposed structure below NORTH_BASIN_NW_MAP. Pale Drowned and
// Silt Hag with stats IDENTICAL to their MIRE_VAULT_ENEMY_TEMPLATES entries
// -- same creatures, newly exposed hunting ground, not a new tier. Selected
// via MAP_METADATA.encounterPool (currentEncounterPool()'s fall-through),
// zero combat.js changes -- the gallery deliberately does NOT use
// inDungeon/dungeonFloor (see state.js's inSunkenGallery comment).
const SUNKEN_GALLERY_ENEMY_TEMPLATES = [
  // Pale Drowned — spectral drowning victim; the reservoir had its own
  { id: 'enemy_pale_drowned_gallery', name: 'Pale Drowned', hp: 30, maxHp: 30, atk: 11, def: 2, spd: 10, xp: 35, goldMin:  6, goldMax: 14 },
  // Silt Hag — the silt here is deep, and it was never empty
  { id: 'enemy_silt_hag_gallery',     name: 'Silt Hag',     hp: 45, maxHp: 45, atk: 18, def: 5, spd:  3, xp: 50, goldMin: 10, goldMax: 20 },
];
window.SUNKEN_GALLERY_ENEMY_TEMPLATES = SUNKEN_GALLERY_ENEMY_TEMPLATES;

// ─── The Upper Reach surface (NORTH_BASIN_NW_MAP) ────────────────────────────
// The drained NW arm was silent for a long while; now the exposed bed has its
// own dangers. Two are the same creatures worked elsewhere in the basin, come
// up onto the oldest-exposed ground (not a new tier); two are new and much
// tougher — the long-stranded, dried, wrong things the retreating water left
// behind first. The surface counterpart to the Sunken Gallery's drowned dead
// directly below it. Ordinary exposed terrain (BASIN_MUD and EXPOSED_STONE)
// is encounter-eligible here; the physical map supplies this pool, while WATER
// and deliberately safe travel terrain remain quiet.
const UPPER_REACH_ENEMY_TEMPLATES = [
  // Same creatures as the Silt Flats / West Shore pool, stranded up here too.
  { id: 'enemy_silt_crab_upper',  name: 'Silt Crab',    hp: 28, maxHp: 28, atk: 12, def: 5, spd:  4, xp: 18, goldMin:  4, goldMax:  9, defendChance: 0.20 },
  { id: 'enemy_basin_gull_upper', name: 'Basin Gull',   hp: 24, maxHp: 24, atk: 14, def: 3, spd: 12, xp: 20, goldMin:  5, goldMax: 10 },
  // New and tough: the arm the water left first, and what it left there.
  // Dust-Drowned — a reservoir drowning the drought gave up first, dried to
  // grave-leather and still walking the bed; its touch carries the cold.
  { id: 'enemy_dust_drowned', name: 'Dust-Drowned', hp: 50, maxHp: 50, atk: 16, def: 5, spd:  8, xp: 46, goldMin:  9, goldMax: 19, curseChance: 0.20 },
  // Marrow Hulk — the largest thing the retreating water stranded, mineral-
  // and-bone-crusted from the long exposure; terribly slow, but it braces, and
  // it crushes.
  { id: 'enemy_marrow_hulk',  name: 'Marrow Hulk',  hp: 66, maxHp: 66, atk: 19, def: 8, spd:  3, xp: 56, goldMin: 14, goldMax: 26, defendChance: 0.25 },
];
window.UPPER_REACH_ENEMY_TEMPLATES = UPPER_REACH_ENEMY_TEMPLATES;

// ─── Swamp Donkey — the North Basin's rare spike ─────────────────────────────
// An uncommon, very hard-hitting bog beast that can turn up on ANY of the five
// outdoor North Basin squares (see startCombat, combat.js) at roughly one fight
// in sixteen — not part of any square's normal pool. Moderate HP (it dies in a
// few solid hits), but a punishing attack: the encounter hurts almost entirely
// because of what it kicks for. No status gimmick — just the boot.
const SWAMP_DONKEY_TEMPLATE = { id: 'enemy_swamp_donkey', name: 'Swamp Donkey', hp: 46, maxHp: 46, atk: 28, def: 5, spd: 9, xp: 60, goldMin: 16, goldMax: 32 };
window.SWAMP_DONKEY_TEMPLATE = SWAMP_DONKEY_TEMPLATE;

const ENCOUNTER_CHANCE   = 1 / 6;
const ENCOUNTER_COOLDOWN = 120;
// The East Sluice is the player's first dungeon; we want encounters to be a
// near-certainty there. Same every-16th-step cadence as ENCOUNTER_CHANCE, but
// at a higher rate on every sluice floor (the sealed room stays at its own rare
// SLUICE_SECRET_ENCOUNTER_CHANCE below).
const SLUICE_ENCOUNTER_CHANCE = 1 / 3;
window.SLUICE_ENCOUNTER_CHANCE = SLUICE_ENCOUNTER_CHANCE;

// ─── East Sluice Deep Works — sealed room (behind the L3 false walls) ─────────
// The room's encounter roll replaces ENCOUNTER_CHANCE, not the roll cadence:
// same every-16th-step check as everywhere else, but at 1/64 -- rare enough
// that most visits are silent, which is the point. The pool has exactly one
// entry and it is not scaled to the sluice: the Tallyman outclasses every
// boss in the game. Running away is the correct response.
const SLUICE_SECRET_ENCOUNTER_CHANCE = 1 / 64;
const SLUICE_SECRET_ENEMY_TEMPLATES = [
  // The thing that keeps the count. Do not fight it on purpose.
  { id: 'enemy_tallyman', name: 'Tallyman', hp: 330, maxHp: 330, atk: 55, def: 11, spd: 22, xp: 550, goldMin: 0, goldMax: 0 },
];

// ── World pick-up items ───────────────────────────────────────────────────────
// Iron Sword and Leather Armor moved to starting inventory (issued by Empire office).
const WORLD_ITEMS = [
  { id: 'pickup_world_potion', name: 'Potion', type: 'potion', heals: 20, price: 30,
    x: 6.5 * TILE, y: 11.5 * TILE, picked: false, examine: true,
    examinePages: [
      ['Someone must have dropped a potion in the grass!'],
      ['Got Potion.'],
    ] },
];

const DUNGEON_ITEMS = [
  { id: 'pickup_dungeon1_a', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y: 6.5 * TILE, picked: false },
  { id: 'pickup_dungeon1_b', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 6.5 * TILE, picked: false },
  { id: 'pickup_dungeon1_c', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  6.5 * TILE, y: 1.5 * TILE, picked: false },
];

const DUNGEON2_ITEMS = [
  { id: 'pickup_dungeon2_a', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  4.5 * TILE, y: 6.5 * TILE, picked: false },
  { id: 'pickup_dungeon2_b', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 11.5 * TILE, y: 7.5 * TILE, picked: false },
];

// ── Floor 3 sub-room items ──────────────────────────────────────────────────
// TC — entry hub (two potions in the wide mid-chamber)
const DUNGEON3_TC_ITEMS = [
  { id: 'pickup_dungeon3_tc_a', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y: 6.5 * TILE, picked: false },
  { id: 'pickup_dungeon3_tc_b', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 7.5 * TILE, picked: false },
];
const DUNGEON3_ITEMS = DUNGEON3_TC_ITEMS; // backward-compat alias for save/load

// TL — scripture room: one potion + ancient writing inscription
const DUNGEON3_TL_ITEMS = [
  { id: 'pickup_dungeon3_tl_potion', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 3.5 * TILE, y: 8.5 * TILE, picked: false },
  { id: 'pickup_dungeon3_tl_ancient_writing', name: 'Ancient Writing', type: 'inscription', x: 8.5 * TILE, y: 5.5 * TILE, picked: false,
    lore: [['The walls here predate the Empire by centuries.', 'The builders are unknown.', 'Their script was never decoded.', 'At the base, a crude sketch: a sun with too many rays.']] },
];

// TR — old supply cache: two potions
const DUNGEON3_TR_ITEMS = [
  { id: 'pickup_dungeon3_tr_a', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 12.5 * TILE, y: 4.5 * TILE, picked: false },
  { id: 'pickup_dungeon3_tr_b', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 12.5 * TILE, y: 8.5 * TILE, picked: false },
];

// ML — left gallery: one potion + garrison log inscription
const DUNGEON3_ML_ITEMS = [
  { id: 'pickup_dungeon3_ml_potion', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 6.5 * TILE, y: 6.5 * TILE, picked: false },
  { id: 'pickup_dungeon3_ml_garrison_log', name: 'Garrison Log', type: 'inscription', x: 7.5 * TILE, y: 7.5 * TILE, picked: false,
    lore: [['YEAR 847 \u2014 CALWICK GARRISON LOG', 'Third company dispatched to clear South Ruins.', 'Lost contact at the third level.', 'Commander Vesthall ordered the passage sealed.', 'No further expeditions authorised.', 'By order of the Regional Prefect.']] },
];

// MC — central crossing: one elixir at the hub centre
const DUNGEON3_MC_ITEMS = [
  { id: 'pickup_dungeon3_mc_elixir', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 7.5 * TILE, y: 7.5 * TILE, picked: false },
];

// MR — rubble room: one potion + one elixir among the debris
const DUNGEON3_MR_ITEMS = [
  { id: 'pickup_dungeon3_mr_potion', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 12.5 * TILE, y: 6.5 * TILE, picked: false },
  { id: 'pickup_dungeon3_mr_elixir', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 12.5 * TILE, y: 9.5 * TILE, picked: false },
];

// BL — ritual chamber: one potion + foreboding warning inscription
const DUNGEON3_BL_ITEMS = [
  { id: 'pickup_dungeon3_bl_potion', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 3.5 * TILE, y: 11.5 * TILE, picked: false },
  { id: 'pickup_dungeon3_bl_scratched_warning', name: 'Scratched Warning', type: 'inscription', x: 7.5 * TILE, y: 7.5 * TILE, picked: false,
    lore: [['Do not go deeper.', 'It does not move, but it waits.', 'We sealed the lower hall.', 'We were not enough.']] },
];

// BC — lower approach hall: one potion
const DUNGEON3_BC_ITEMS = [
  { id: 'pickup_dungeon3_bc_potion', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 7.5 * TILE, y: 7.5 * TILE, picked: false },
];

// BR — descent chamber: one elixir (reward before going deeper)
const DUNGEON3_BR_ITEMS = [
  { id: 'pickup_dungeon3_br_elixir', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 10.5 * TILE, y: 5.5 * TILE, picked: false },
];

const DUNGEON4_ITEMS = [
  { id: 'pickup_dungeon4_a', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y: 7.5 * TILE, picked: false },
  { id: 'pickup_dungeon4_b', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 6.5 * TILE, picked: false },
];

const DUNGEON5_ITEMS = [
  { id: 'pickup_dungeon5_a', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y: 7.5 * TILE, picked: false },
  { id: 'pickup_dungeon5_b', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 6.5 * TILE, picked: false },
];

const DUNGEON6_ITEMS = [
  { id: 'pickup_dungeon6_a', name: 'Elixir', type: 'potion', heals: 50, price: 80, x:  2.5 * TILE, y: 6.5 * TILE, picked: false },
  { id: 'pickup_dungeon6_b', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 13.5 * TILE, y: 7.5 * TILE, picked: false },
];

const DUNGEON7_ITEMS = [
  { id: 'pickup_dungeon7_a', name: 'Elixir', type: 'potion', heals: 50, price: 80, x:  2.5 * TILE, y: 7.5 * TILE, picked: false },
  { id: 'pickup_dungeon7_b', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 13.5 * TILE, y: 6.5 * TILE, picked: false },
  // ── hidden antechamber (secret passage via false wall at row 4, col 2) ──
  { id: 'pickup_dungeon7_burial_record', name: 'Burial Record', type: 'inscription', x: 1.5 * TILE, y: 2.5 * TILE, picked: false,
    lore: [['Interment Record \u2014 Civic Division.',
            'Ward, K. Clerk (Third Grade).',
            'Year 831. Cause: unspecified.',
            'Effects claimed. No next of kin recorded.',
            'File closed.']] },
  { id: 'pickup_dungeon7_c', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 2.5 * TILE, y: 3.5 * TILE, picked: false },
];

const DUNGEON8_ITEMS = [
  { id: 'pickup_dungeon8_a', name: 'Elixir', type: 'potion', heals: 50, price: 80, x:  2.5 * TILE, y: 6.5 * TILE, picked: false },
  { id: 'pickup_dungeon8_b', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 13.5 * TILE, y: 7.5 * TILE, picked: false },
];

const DUNGEON8_WEST_ITEMS = [
  { id: 'pickup_dungeon8_west_elixir', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 7.5 * TILE, y: 6.5 * TILE, picked: false },
];

const DUNGEON8_EAST_ITEMS = [
  { id: 'pickup_dungeon8_east_elixir', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 7.5 * TILE, y: 6.5 * TILE, picked: false },
];

// ─── Sluice items ─────────────────────────────────────────────────────────────
// Floor items inside the East Sluice. Same structure as DUNGEON_ITEMS.
const SLUICE_ITEMS = [
  { id: 'pickup_sluice1_potion', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 2.5 * TILE, y: 9.5 * TILE, picked: false },
];

// The Calwick schoolroom has no floor pickup. The early-game Elixir is now a
// one-time gift from Tev (see calwick-npcs.js), gated by the window-native
// `tev_elixir_given` flag and lampshaded in his dialogue. (The generic floor
// sparkle still exists as a mechanism — see HOUSE_DATA.*.sparkle — it just
// isn't used here anymore.)
const SCHOOL_ITEMS = [];

// ─── Sluice chest ─────────────────────────────────────────────────────────────
// Placed in the lower-right east nook (col 14, row 9). Opened by pressing
// Space when adjacent — not auto-picked like floor items.
const SLUICE_CHEST = {
  id:     'chest_sluice1',
  x:      14.5 * TILE,
  y:       9.5 * TILE,
  opened: false,
  item:   { name: 'Elixir', type: 'potion', heals: 50, price: 80 },
};

// ─── Sluice level 2 items ─────────────────────────────────────────────────────
const SLUICE_LEVEL2_ITEMS = [
  { id: 'pickup_sluice2_a', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y:  1.5 * TILE, picked: false },  // NW dead-end
  { id: 'pickup_sluice2_b', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 11.5 * TILE, y: 13.5 * TILE, picked: false },  // feature chamber
  { id: 'pickup_sluice2_c', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  4.5 * TILE, y:  3.5 * TILE, picked: false },  // cross-corridor (r3 c4)
  { id: 'pickup_sluice2_d', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  4.5 * TILE, y: 12.5 * TILE, picked: false },  // south pocket (r12 c4)
];

// ─── Sluice level 2 chest ─────────────────────────────────────────────────────
// East dead-end spur (col 14, row 8). Opened by pressing Space when adjacent.
const SLUICE_LEVEL2_CHEST = {
  id:     'chest_sluice2',
  x:      14.5 * TILE,
  y:       8.5 * TILE,
  opened: false,
  item:   { name: 'Elixir', type: 'potion', heals: 50, price: 80 },
};

// ─── Sluice secret chest ──────────────────────────────────────────────────────
// Hidden behind the FALSE_WALL at r9 c11. Located at r10 c13 in the secret area.
const SLUICE_SECRET_CHEST = {
  id:     'chest_sluice_secret',
  x:      13.5 * TILE,
  y:      10.5 * TILE,
  opened: false,
  item:   { name: 'Warden Blade', type: 'weapon', bonus: 10, price: 220 },
};

// ─── Sluice level 3 items ─────────────────────────────────────────────────────
const SLUICE_LEVEL3_ITEMS = [
  { id: 'pickup_sluice3_potion', name: 'Potion', type: 'potion', heals: 20, price: 30, x:  4.5 * TILE, y:  7.5 * TILE, picked: false },  // west pocket (r7 c4)
  { id: 'pickup_sluice3_elixir', name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 10.5 * TILE, y:  7.5 * TILE, picked: false },  // east pocket (r7 c10)
];

// The Sealed Room (SLUICE_SECRET_MAP) holds no pickups — nothing in it is
// meant to leave. Empty array kept so MAP_METADATA's items field stays real.
const SLUICE_SECRET_ITEMS = [];

// ─── Sluice level 3 chest ─────────────────────────────────────────────────────
// South chamber centre (r10 c7). Opened by pressing Space when adjacent.
const SLUICE_LEVEL3_CHEST = {
  id:     'chest_sluice3',
  x:       7.5 * TILE,
  y:      10.5 * TILE,
  opened: false,
  item:   { name: 'Void Shard', type: 'accessory', bonus: 5, price: 180 },
};

// ─── Dungeon chest ────────────────────────────────────────────────────────────
// Placed in the far corner of the upper room (col 10, row 1). Opened by pressing
// Space when adjacent — not auto-picked like floor items.
const DUNGEON_CHEST = {
  id:     'chest_dungeon_main',
  x:      10.5 * TILE,
  y:       1.5 * TILE,
  opened: false,
  item:   { name: 'Steel Sword', type: 'weapon', bonus: 7, price: 150 },
};

// ─── Cat Armor chest (player_house secret pocket — Day 2 only) ───────────────
// Hidden behind the INTERIOR_FALSE_WALL at row 3, col 3 (southwest of the hearth).
// The pocket (cols 2-3, rows 3-4) looks identical to the surrounding wall.
// Only active from Day 2 onward; opened once by pressing Space when adjacent.
const CAT_ARMOR_CHEST = {
  id:     'chest_cat_armor',
  x:      2.5 * TILE,
  y:      4.5 * TILE,
  opened: false,
  sprite: 'invisible',
  item:   { name: 'Cat Armor', type: 'armor', bonus: 99, price: 0 },
};

// ─── Hidden meadow chest (MEADOW_MAP col 12 row 2) ────────────────────────────
// Holds the game's one curse-cure consumable. Deliberately NOT subject to the
// cursed-fumble chest gag the dungeon chests have — a cursed player is exactly
// who needs this chest. Opened flag persists via save.js (meadowChestOpened).
const MEADOW_CHEST = {
  id:     'chest_meadow',
  x:      12.5 * TILE,
  y:       2.5 * TILE,
  opened: false,
  item:   { name: 'Amethyst Dust', type: 'potion', heals: 0, curesCursed: true, price: 60 },
};

// ─── Dungeon floor-1 hidden alcove chest ──────────────────────────────────────
// Actually inside the alcove now (col 0, row 7), reached through the false
// wall at row 7 col 1 (DUNGEON_FALSE_WALL, see DUNGEON_MAP) -- previously
// this was sitting out on the open floor at col 2 row 6, on top of a
// DUNGEON_ITEMS potion at that exact spot, which meant the secret passage
// had nothing behind it and the chest+potion overlapped. Opened by pressing
// Space when adjacent, same as any other chest.
const DUNGEON_ALCOVE_CHEST = {
  id:     'chest_dungeon_alcove',
  x:       0.5 * TILE,
  y:       7.5 * TILE,
  opened: false,
  item:   { name: 'Iron Targe', type: 'shield', bonus: 8, price: 180 },
};

// ─── Sluice level-3 deep chest ────────────────────────────────────────────────
// Hidden behind the FALSE_WALL at row 11, col 10. Located in the secret annex
// (cols 10-11, rows 9-11). Opened by pressing Space when adjacent.
const SLUICE_DEEP_CHEST = {
  id:     'chest_sluice_deep',
  x:      11.5 * TILE,
  y:      10.5 * TILE,
  opened: false,
  item:   { name: 'Fen Mask', type: 'accessory', bonus: 5, price: 200 },
};

// ─── Sunken Gallery chest (grid room R2C4 — the sealed east pocket) ───────────
// Holds Bullet Time, the game's one combat-only evade consumable. Like
// MEADOW_CHEST (its own one-of-a-kind reward) it deliberately does NOT trigger
// the cursed-fumble drop gag the dungeon/sluice chests have — Bullet Time has no
// other source, so a curse must never lose it for good. Opened flag persists via
// the v3 chest registry (openedChestIds), like every OPENABLE_CHESTS chest.
const SUNKEN_GALLERY_CHEST = {
  id:     'chest_sunken_gallery',
  x:      12.5 * TILE,
  y:       7.5 * TILE,
  opened: false,
  item:   { name: 'Bullet Time', type: 'buff', evadeRate: 0.90, evadeTurns: 3, battleOnly: true, price: 150 },
};

// ─── Takomo (secret chamber boss — Drenwick Waterfront hidden path) ──────────
// Accessed through TAKOMO_GATE on the waterfront quay. Fire-elemental fighter,
// heavy atk, slow spd. Drops significant gold; no loot drop (glory only).
const TAKOMO = {
  x:       8.5 * TILE,   // col 8, row 7 — centre-right of chamber
  y:       7.5 * TILE,
  defeated: false,
};

const TAKOMO_TEMPLATE = {
  id: 'enemy_takomo',
  name: 'Takomo',
  hp: 280, maxHp: 280,
  atk: 52, def: 12, spd: 4,
  xp: 420, goldMin: 140, goldMax: 260,
};

// ─── Mulholland (dungeon floor 4 boss — guards stair to floor 5) ──────────────
const MULHOLLAND = {
  x:        7.5 * TILE,   // col 7, row 11 — south corridor, blocking stairs down
  y:       11.5 * TILE,
  defeated: false,
};

const MULHOLLAND_TEMPLATE = {
  id: 'enemy_mulholland',
  name: 'Mulholland', hp: 140, maxHp: 140, atk: 28, def: 8, spd: 4,
  xp: 180, goldMin: 30, goldMax: 60,
};

const DEN_WRAITH_TEMPLATE = { id: 'enemy_den_wraith', name: 'Den Wraith', hp: 42, maxHp: 42, atk: 19, def: 2, spd: 13, xp: 70, goldMin: 0, goldMax: 0, curseChance: 0.30 };
window.DEN_WRAITH_TEMPLATE = DEN_WRAITH_TEMPLATE;

// ─── Sailor Brawler (Kolm — Drenwick Inn, Dayoff only) ───────────────────────
// Heavy-hitting brawler; high ATK, moderate HP; no gold drop (prize is the stake).
const SAILOR_BRAWLER_TEMPLATE = { id: 'enemy_kolm', name: 'Kolm', hp: 55, maxHp: 55, atk: 26, def: 4, spd: 7, xp: 45, goldMin: 0, goldMax: 0 };
window.SAILOR_BRAWLER_TEMPLATE = SAILOR_BRAWLER_TEMPLATE;

// ─── Den Wraith (west_i house — manifests on Dayoff when quest active) ──────────
const DEN_WRAITH = { x: 7.5 * TILE, y: 6.5 * TILE, defeated: false };
window.DEN_WRAITH = DEN_WRAITH;

const MULHOLLAND_DIALOGUE = [
  ['Something is wrong with this creature\u2019s proportions.',
   'Everything about it is slightly off \u2014 angles, weight, the number of joints.',
   'It does not move like something that is meant to exist.'],
  ['It turns toward you.',
   'What passes for its face registers something.',
   'Not hunger. Not recognition.',
   'Just the fact of you, standing where you are standing.'],
];

// ─── Boss (Wrongteeth — dungeon floor 5) ─────────────────────────────────────
const BOSS = {
  x:          7.5 * TILE,   // col 7, row 11 — south end of dungeon 5
  y:          11.5 * TILE,
  defeated:   false,
  knockedDown: false,        // true once combat ends; cleared when player kills or hugs
};

const BOSS_TEMPLATE = {
  id: 'enemy_wrongteeth',
  name: 'Wrongteeth', hp: 300, maxHp: 300, atk: 30, def: 6, spd: 6,
  xp: 250, goldMin: 50, goldMax: 80,
};

const BOSS_DIALOGUE = [
  ['\u201cYou should not be here.', 'Neither should I.\u201d'],
  ['\u201cBut the others are coming,', 'and they are hungrier than I am.\u201d'],
];

// ─── Mirethyst's Vault — enemies ──────────────────────────────────────────────
// Ancient pre-Empire rareborn chamber sunk into the northern fen. Harder than
// the sluice; softer than the dungeon's second floor. Spectral and bog-cursed.
const MIRE_VAULT_ENEMY_TEMPLATES = [
  // Pale Drowned — spectral fen victim; fast and relentless, fragile in form
  { id: 'enemy_pale_drowned_vault', name: 'Pale Drowned', hp: 30, maxHp: 30, atk: 11, def: 2, spd: 10, xp: 35, goldMin:  6, goldMax: 14 },
  // Silt Hag — bog-curse made flesh; ponderous and devastating, hard to kill
  { id: 'enemy_silt_hag_vault',     name: 'Silt Hag',     hp: 45, maxHp: 45, atk: 18, def: 5, spd:  3, xp: 50, goldMin: 10, goldMax: 20 },
];

// ─── Mirethyst's Vault — floor items ─────────────────────────────────────────
// Scattered among the submerged chambers.
const MIRE_VAULT_ITEMS = [
  // Potion in the left alcove of the mid-hall (col 1, row 6)
  { id: 'pickup_mire_vault_potion', name: 'Potion',     type: 'potion', heals: 20,                price: 30, x:  1.5 * TILE, y:  6.5 * TILE, picked: false },
  // Ember Root in the right alcove of the lower mid-hall (col 13, row 8)
  // Heals but leaves legs heavy — an old rareborn stimulant with a bog side-effect
  { id: 'pickup_mire_vault_ember_root', name: 'Ember Root', type: 'potion', heals: 15, causesMuddied: true, price: 20, x: 13.5 * TILE, y:  8.5 * TILE, picked: false },
];

// ─── Mirethyst's Vault — (no chest) ───────────────────────────────────────────
// The Mirestone Blade chest was removed. The mid-hall centre (col 7, row 6) is
// held for a future secret crypt entrance. Mirethyst gives the Fen Cowl through
// her own dialogue now (npcs.js), as thanks for the player keeping her company.

// ─── MAP_CATALOG ──────────────────────────────────────────────────────────────
// The ONE authoritative catalog of every physical map: its canonical stable ID,
// map-array reference, canonical display name, and per-map metadata. Adding a new
// map means: define its map array (+ _ITEMS array, even if empty) in maps.js,
// then add ONE entry here -- not touching locationName(), currentItemList(), the
// combat.js pool ladder, and a separate registry the way maps before this
// required.
//
// KEYS ARE THE CANONICAL PHYSICAL MAP IDS -- exactly the strings save/transition
// code uses (e.g. 'MAP', 'HOUSE_INTERIOR_MAP', 'DRENWICK_CIVIC_MAP'). Each
// entry's `id` MUST equal its property key (enforced by validateGameData()).
// These are NOT the logical content-location keys currentContentLocationKey()
// (movement.js) returns -- those ('west', 'house:<id>', 'drenwick_civic', …) are
// a deliberately separate namespace for which shared physical grids stand in for
// different houses/apartments. Do not conflate the two.
//
// The old MAP_REGISTRY / MAP_METADATA split -- two independently-authored tables
// that had to be cross-validated, with MAP_REGISTRY carrying stale `.label`s and
// a competing lowercase `.id` for some Drenwick entries -- is gone. Both are now
// DERIVED from this catalog right after it is built (see below): MAP_METADATA is
// an alias of the catalog, and MAP_REGISTRY is generated as
// { id, label: displayName, map }. Canonical lookups use mapIdForRef() /
// mapEntryForId() / mapRefForId(); mapRegistryId() remains a deprecated alias.
//
// `displayName` is the CANONICAL name locationName() shows the player.
// `encounterPool`/`allowRandomEncounters` are populated for EVERY map, for
// documentation and validation, even though combat.js's actual pool selection
// still branches on inDungeon/dungeonFloor/inSluice/inMireVault state for
// dungeon floors, sluice floors, and the vault -- see combat.js's comment at the
// top of startCombat(). Only the plain-activeMap tail of that ladder
// (farMap/thornmereMap/northBasinMap/the MAP-vs-default split) reads metadata directly.
// ─── Regional chunk authoring: distributed definitions → resolved catalog ─────
// Placed regional outdoor chunks are AUTHORED as declarative definition fragments
// in their geographic content/maps/*.js files (CALWICK_/THORNMERE_/DRENWICK_/
// NORTHERN_ROAD_/NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS) — the sole human-edited
// authority. Each definition OWNS: the stable physical mapId, regionId, integer
// chunkX/chunkY, the 15×16 tile grid, display/catalog metadata, the logical
// contentKey, the presentation mode, a stable encounterProfileId, and a stable
// itemSetId. data.js (here) merges those fragments and RESOLVES the profile/item
// ids into the runtime REGIONAL_CHUNK_CATALOG, from which the regional slice of
// MAP_CATALOG, REGIONAL_LAYOUT, and OUTDOOR_CONTENT_KEYS are all derived. The
// catalog is the resolved/generated runtime view, NOT a second authority — no
// placement / content key / presentation / encounter / identity value is authored
// twice. This keeps terrain grids out of data.js: they live in the geographic map
// files, so data.js does not grow with every future chunk.
//
// Why the indirection: the encounter pools are defined below in data.js (after the
// map files load), so an early-loaded fragment cannot name a pool array directly —
// it names a stable encounterProfileId that resolves here. itemSetId likewise keeps
// item content authored once (in the map files / WORLD_ITEMS) without duplicating
// it into the definition. Both resolve to the SAME array references consumers used
// before, so encounter/item reference identity is preserved.

// Encounter-profile registry: stable id → the actual pool array. The sole place a
// profile id resolves to a pool.
const _ENCOUNTER_PROFILES = {
  early:       EARLY_ENEMY_TEMPLATES,
  reaches:     ENEMY_TEMPLATES,
  far:         FAR_ENEMY_TEMPLATES,
  thornmere:   THORNMERE_ENEMY_TEMPLATES,
  north_basin: NORTH_BASIN_ENEMY_TEMPLATES,
  upper_reach: UPPER_REACH_ENEMY_TEMPLATES,
};
window._ENCOUNTER_PROFILES = _ENCOUNTER_PROFILES;

// Item-set registry: stable id → the actual items array. The sole place an item-set
// id resolves to an array. Item content itself stays authored in the map files.
const _REGIONAL_ITEM_SETS = {
  world:          WORLD_ITEMS,
  map2:           MAP2_ITEMS,
  map3:           MAP3_ITEMS,
  map4:           MAP4_ITEMS,
  map5:           MAP5_ITEMS,
  map_n1:         MAP_N1_ITEMS,
  map_n2:         MAP_N2_ITEMS,
  roddon_way:     RODDON_WAY_ITEMS,
  map3_n1:        MAP3_N1_ITEMS,
  map3_n2:        MAP3_N2_ITEMS,
  north_basin_s:  NORTH_BASIN_S_ITEMS,
  north_basin_c:  NORTH_BASIN_C_ITEMS,
  north_basin_sw: NORTH_BASIN_SW_ITEMS,
  north_basin_w:  NORTH_BASIN_W_ITEMS,
  north_basin_w2: NORTH_BASIN_W2_ITEMS,
  north_basin_nw: NORTH_BASIN_NW_ITEMS,
};
window._REGIONAL_ITEM_SETS = _REGIONAL_ITEM_SETS;

// Merge the distributed authored fragments deterministically (fixed fragment order).
// The merge order is incidental — no consumer depends on placement/content-key list
// order (they key by mapId or iterate) — but it is stable across loads.
const _REGIONAL_CHUNK_DEFINITIONS = [].concat(
  CALWICK_REGIONAL_CHUNK_DEFINITIONS,
  THORNMERE_REGIONAL_CHUNK_DEFINITIONS,
  DRENWICK_REGIONAL_CHUNK_DEFINITIONS,
  NORTHERN_ROAD_REGIONAL_CHUNK_DEFINITIONS,
  NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS,
);
window._REGIONAL_CHUNK_DEFINITIONS = _REGIONAL_CHUNK_DEFINITIONS;

// Resolve definitions → runtime catalog. Pure construction (no gameplay-state
// mutation): each record exposes the actual encounterPool/items arrays consumers
// expect, keyed by mapId. Unknown profile/item ids resolve to undefined and are
// caught by validateRegionalChunkCatalog() (fail-closed), never silently defaulted;
// a definition with no itemSetId is a legitimately item-less chunk (fresh []).
const REGIONAL_CHUNK_CATALOG = (function () {
  const out = {};
  for (const def of _REGIONAL_CHUNK_DEFINITIONS) {
    const rec = {
      mapId: def.mapId, regionId: def.regionId, chunkX: def.chunkX, chunkY: def.chunkY,
      map: def.map, displayName: def.displayName, region: def.region,
      contentKey: def.contentKey, presentation: def.presentation,
      encounterPool: _ENCOUNTER_PROFILES[def.encounterProfileId],
      items: (def.itemSetId === undefined) ? [] : _REGIONAL_ITEM_SETS[def.itemSetId],
      allowRandomEncounters: def.allowRandomEncounters, allowSave: def.allowSave,
      // Declarative player-placement capability. Default true; a scenery-only chunk
      // authors `playerAccessible: false`. Resolved onto EVERY record so consumers
      // read one field, never a hardcoded id (see mapPlayerAccessible()).
      playerAccessible: def.playerAccessible === false ? false : true,
    };
    if (def.notes !== undefined) rec.notes = def.notes;
    if (def.legacyCameraExclusion !== undefined) rec.legacyCameraExclusion = def.legacyCameraExclusion;
    out[def.mapId] = rec;
  }
  return out;
})();
window.REGIONAL_CHUNK_CATALOG = REGIONAL_CHUNK_CATALOG;

// THE single declarative player-placement authority. Returns false ONLY for a placed
// regional chunk that opted out with `playerAccessible: false` (scenery-only); every
// other regional chunk and every discrete map returns true. Every placement path
// consults this one predicate — validatePlacement() (so transitionToLocation,
// resolveLoadLocation and debug-warp preflight all fail closed), the canonical writer
// commitRegionalWorldPosition() (so seam movement / direct canonical placement fail
// closed), debug-warp destination derivation (shown disabled), and the regional NPC
// simulation scope — so no consumer hardcodes a scenery-only map id.
function mapPlayerAccessible(mapId) {
  const r = (typeof mapId === 'string') ? REGIONAL_CHUNK_CATALOG[mapId] : null;
  return !(r && r.playerAccessible === false);
}
window.mapPlayerAccessible = mapPlayerAccessible;

// The regional MAP_CATALOG entry DERIVED from a chunk record (id/map/display/
// region/items/encounter/save + regionalPresentation only for legacy_screen, and
// notes when authored) — the single generator the catalog uses for placed chunks.
function _regionalChunkCatalogEntry(mapId) {
  const r = REGIONAL_CHUNK_CATALOG[mapId];
  const e = {
    id: r.mapId, map: r.map, displayName: r.displayName, region: r.region,
    type: 'outdoor', items: r.items, encounterPool: r.encounterPool,
    allowRandomEncounters: r.allowRandomEncounters, allowSave: r.allowSave,
  };
  if (r.presentation === 'legacy_screen') e.regionalPresentation = 'legacy_screen';
  if (r.notes !== undefined) e.notes = r.notes;
  return e;
}

// Compatibility aliases: each is a DERIVED reference to the catalog grid (never a
// second grid). The 15 regional grids are now authored inline in their chunk
// definition records; existing bare-`MAP…` consumers (state.js's initial activeMap,
// movement.js's `activeMap === MAP…` checks, render/audit/tests, and the harness's
// window.* reads) keep working through these. New code should use mapRefForId(id) /
// the catalog helpers instead — a new regional chunk never needs an alias here.
const MAP              = REGIONAL_CHUNK_CATALOG.MAP.map;                window.MAP              = MAP;
const MAP2             = REGIONAL_CHUNK_CATALOG.MAP2.map;               window.MAP2             = MAP2;
const MAP3             = REGIONAL_CHUNK_CATALOG.MAP3.map;               window.MAP3             = MAP3;
const MAP4             = REGIONAL_CHUNK_CATALOG.MAP4.map;               window.MAP4             = MAP4;
const MAP5             = REGIONAL_CHUNK_CATALOG.MAP5.map;               window.MAP5             = MAP5;
const MAP_N1           = REGIONAL_CHUNK_CATALOG.MAP_N1.map;             window.MAP_N1           = MAP_N1;
const MAP_N2           = REGIONAL_CHUNK_CATALOG.MAP_N2.map;             window.MAP_N2           = MAP_N2;
const RODDON_WAY_MAP   = REGIONAL_CHUNK_CATALOG.RODDON_WAY_MAP.map;     window.RODDON_WAY_MAP   = RODDON_WAY_MAP;
const MAP3_N1          = REGIONAL_CHUNK_CATALOG.MAP3_N1.map;            window.MAP3_N1          = MAP3_N1;
const MAP3_N2          = REGIONAL_CHUNK_CATALOG.MAP3_N2.map;            window.MAP3_N2          = MAP3_N2;
const NORTH_BASIN_S_MAP  = REGIONAL_CHUNK_CATALOG.NORTH_BASIN_S_MAP.map;  window.NORTH_BASIN_S_MAP  = NORTH_BASIN_S_MAP;
const NORTH_BASIN_C_MAP  = REGIONAL_CHUNK_CATALOG.NORTH_BASIN_C_MAP.map;  window.NORTH_BASIN_C_MAP  = NORTH_BASIN_C_MAP;
const NORTH_BASIN_SW_MAP = REGIONAL_CHUNK_CATALOG.NORTH_BASIN_SW_MAP.map; window.NORTH_BASIN_SW_MAP = NORTH_BASIN_SW_MAP;
const NORTH_BASIN_W_MAP  = REGIONAL_CHUNK_CATALOG.NORTH_BASIN_W_MAP.map;  window.NORTH_BASIN_W_MAP  = NORTH_BASIN_W_MAP;
const NORTH_BASIN_NW_MAP = REGIONAL_CHUNK_CATALOG.NORTH_BASIN_NW_MAP.map; window.NORTH_BASIN_NW_MAP = NORTH_BASIN_NW_MAP;

const MAP_CATALOG = {
  // ── Overworld (Verdant Vale / Eastern Reaches / Thornmere fen) ────────────
  // Regional chunks (MAP, MAP2…MAP5, MAP_N1/2, RODDON, MAP3_N*, North Basin) are
  // DERIVED from REGIONAL_CHUNK_CATALOG via _regionalChunkCatalogEntry() — their
  // metadata is authored there, not here. Discrete maps below stay authored inline.
  MAP: _regionalChunkCatalogEntry('MAP'),
  MEADOW_MAP: {
    id: 'MEADOW_MAP', map: MEADOW_MAP, displayName: 'Hidden Meadow', region: 'Verdant Vale',
    type: 'outdoor', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
    notes: 'Secret clearing behind the vale’s NW tree nook. Deliberately encounter-free (hard gate in isEncounterEligibleTile, movement.js) — the relocated Briar Warden is its only danger.',
  },
  MAP2: _regionalChunkCatalogEntry('MAP2'),
  LORRA_HOUSE_MAP: {
    id: 'LORRA_HOUSE_MAP', map: LORRA_HOUSE_MAP, displayName: "Lorra's Farmhouse", region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  ABANDONED_FARMHOUSE_MAP: {
    id: 'ABANDONED_FARMHOUSE_MAP', map: ABANDONED_FARMHOUSE_MAP, displayName: 'Abandoned Farmhouse', region: 'Eastern Reaches',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
    notes: 'The vacated eastern farmhouse on MAP2. Grounded household inspectables only; no NPCs, pickups, or scripted encounters.',
  },
  MAREN_POST_MAP: {
    id: 'MAREN_POST_MAP', map: MAREN_POST_MAP, displayName: 'Guard Post', region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  HOLLIS_FARMHOUSE_MAP: {
    id: 'HOLLIS_FARMHOUSE_MAP', map: HOLLIS_FARMHOUSE_MAP, displayName: 'Hollis Farmstead', region: 'Verdant Vale',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
    notes: 'Occupied farmhouse on the overworld (row 9 col 3). Home of Hollis, a friendly farmer NPC.',
  },
  WRENNA_COTTAGE_MAP: {
    id: 'WRENNA_COTTAGE_MAP', map: WRENNA_COTTAGE_MAP, displayName: "Wrenna's Cottage", region: 'Verdant Vale',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
    notes: 'Occupied cottage on the overworld (row 12 col 2). Home of Wrenna, a friendly herb-keeper NPC.',
  },
  MAP3: _regionalChunkCatalogEntry('MAP3'),
  MAP4: _regionalChunkCatalogEntry('MAP4'),
  MAP5: _regionalChunkCatalogEntry('MAP5'),
  LIGHTHOUSE_GROUND_MAP: {
    id: 'LIGHTHOUSE_GROUND_MAP', map: LIGHTHOUSE_GROUND_MAP,
    displayName: 'Abandoned Lighthouse — Ground Floor', region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  LIGHTHOUSE_LANDING_1_MAP: {
    id: 'LIGHTHOUSE_LANDING_1_MAP', map: LIGHTHOUSE_LANDING_1_MAP,
    displayName: 'Abandoned Lighthouse — First Landing', region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  LIGHTHOUSE_LANDING_2_MAP: {
    id: 'LIGHTHOUSE_LANDING_2_MAP', map: LIGHTHOUSE_LANDING_2_MAP,
    displayName: 'Abandoned Lighthouse — Second Landing', region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  LIGHTHOUSE_LANDING_3_MAP: {
    id: 'LIGHTHOUSE_LANDING_3_MAP', map: LIGHTHOUSE_LANDING_3_MAP,
    displayName: 'Abandoned Lighthouse — Third Landing', region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  LIGHTHOUSE_LANTERN_MAP: {
    id: 'LIGHTHOUSE_LANTERN_MAP', map: LIGHTHOUSE_LANTERN_MAP,
    displayName: 'Abandoned Lighthouse — Lantern Room', region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  MAP3_N1: _regionalChunkCatalogEntry('MAP3_N1'),
  RODDON_WAY_MAP: _regionalChunkCatalogEntry('RODDON_WAY_MAP'),
  MAP3_N2: _regionalChunkCatalogEntry('MAP3_N2'),
  DRENWICK_EAST_CANAL_MAP: _regionalChunkCatalogEntry('DRENWICK_EAST_CANAL_MAP'),
  THORNMERE_NORTH_FEN_MAP: _regionalChunkCatalogEntry('THORNMERE_NORTH_FEN_MAP'),
  THORNMERE_CANAL_HEAD_MAP: _regionalChunkCatalogEntry('THORNMERE_CANAL_HEAD_MAP'),
  THORNMERE_UPPER_SHALLOWS_MAP: _regionalChunkCatalogEntry('THORNMERE_UPPER_SHALLOWS_MAP'),
  // Scenery-only chunk (1,3): derived like any placed regional chunk. It is a real
  // outdoor MAP_CATALOG entry (so it resolves for rendering, layout, content keys and
  // geography) but its `playerAccessible: false` capability keeps the player out.
  DRENWICK_WEST_OUTFALL_MAP: _regionalChunkCatalogEntry('DRENWICK_WEST_OUTFALL_MAP'),

  // ── The North Basin (regional chunks — derived from REGIONAL_CHUNK_CATALOG) ──
  NORTH_BASIN_S_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_S_MAP'),
  NORTH_BASIN_SE_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_SE_MAP'),
  EAST_CAUSEWAY_MAP: _regionalChunkCatalogEntry('EAST_CAUSEWAY_MAP'),
  NORTH_BASIN_C_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_C_MAP'),
  NORTH_BASIN_MIREWOOD_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_MIREWOOD_MAP'),
  NORTH_BASIN_SW_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_SW_MAP'),
  NORTH_BASIN_W_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_W_MAP'),
  NORTH_BASIN_NW2_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_NW2_MAP'),
  NORTH_BASIN_W2_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_W2_MAP'),
  NORTH_BASIN_NW_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_NW_MAP'),
  // Scenery-only open water north of the reservoir (chunk 2,0) and its eastward
  // continuations (chunks 3,0 and 4,0). Derived like any placed regional chunk; `playerAccessible:
  // false` keeps the player out (see West Outfall).
  NORTH_BASIN_N_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_N_MAP'),
  NORTH_BASIN_NE_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_NE_MAP'),
  NORTH_BASIN_NE2_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_NE2_MAP'),
  NORTH_BASIN_E2_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_E2_MAP'),
  // Scenery-only water-over-forest chunk (3,1), south of the Open Reservoir East.
  NORTH_BASIN_E_MAP: _regionalChunkCatalogEntry('NORTH_BASIN_E_MAP'),
  BASIN_CHAMBER_MAP: {
    id: 'BASIN_CHAMBER_MAP', map: BASIN_CHAMBER_MAP, displayName: 'No Recorded Location', region: 'North Basin',
    type: 'special', items: BASIN_CHAMBER_ITEMS, encounterPool: null,
    allowRandomEncounters: false, allowSave: false,
    notes: 'The unmarked chamber through the Upper Reach doorframe. Perfectly square, no seams, no dust, no explanation (lore boundary: like the Deep Works sealed room, deliberately unexplained -- do not extend LORE.md for it). locationName() returns the displayName via an explicit inBasinChamber line (type "special", so the outdoor fast path doesn\u2019t apply). allowSave: false is runtime-enforced by canSaveHere() (save.js) -- consulted by both the save-confirm menu (input.js, for the banner) and saveGame() itself (so a save can never be written here by any path).',
  },
  SUNKEN_GALLERY_MAP: {
    id: 'SUNKEN_GALLERY_MAP', map: SUNKEN_GALLERY_MAP, displayName: 'Sunken Gallery', region: 'North Basin',
    type: 'dungeon', items: SUNKEN_GALLERY_ITEMS, encounterPool: SUNKEN_GALLERY_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: false,
    notes: 'Drought-exposed hall below the Upper Reach, flooded along its whole south side (the water pulled back, it didn\u2019t leave -- future expansion continues under it). Encounters via encounterPool fall-through, not a dungeonFloor branch. allowSave: false is runtime-enforced by canSaveHere() (save.js), same as BASIN_CHAMBER_MAP.',
  },

  // ── Drenwick (guard post, bridge, fort, civic districts, interiors) ──────
  DRENWICK_POST_MAP: {
    id: 'DRENWICK_POST_MAP', map: DRENWICK_POST_MAP, displayName: 'Guard Post', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  BRIDGE_CROSSING_MAP: {
    id: 'BRIDGE_CROSSING_MAP', map: BRIDGE_CROSSING_MAP, displayName: 'Imperial Bridge \u2014 Toll Gate', region: 'Drenwick',
    type: 'bridge', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  SMUGGLER_FORT_MAP: {
    id: 'SMUGGLER_FORT_MAP', map: SMUGGLER_FORT_MAP, displayName: 'Guard Post', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_CIVIC_MAP: {
    id: 'DRENWICK_CIVIC_MAP', map: DRENWICK_CIVIC_MAP, displayName: 'Drenwick', region: 'Drenwick',
    type: 'town', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_WEST_RESIDENTIAL_MAP: {
    id: 'DRENWICK_WEST_RESIDENTIAL_MAP', map: DRENWICK_WEST_RESIDENTIAL_MAP, displayName: 'Drenwick \u2014 West Side', region: 'Drenwick',
    type: 'town', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_CANAL_DOCKS_MAP: {
    id: 'DRENWICK_CANAL_DOCKS_MAP', map: DRENWICK_CANAL_DOCKS_MAP, displayName: 'Drenwick \u2014 Canal Docks', region: 'Drenwick',
    type: 'town', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_EAST_OUTSKIRTS_MAP: {
    id: 'DRENWICK_EAST_OUTSKIRTS_MAP', map: DRENWICK_EAST_OUTSKIRTS_MAP, displayName: 'Drenwick \u2014 East Side', region: 'Drenwick',
    type: 'town', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_MARKET_MAP: {
    id: 'DRENWICK_MARKET_MAP', map: DRENWICK_MARKET_MAP, displayName: 'Drenwick \u2014 Market Quarter', region: 'Drenwick',
    type: 'town', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_WATERFRONT_MAP: {
    id: 'DRENWICK_WATERFRONT_MAP', map: DRENWICK_WATERFRONT_MAP, displayName: 'Drenwick \u2014 Waterfront', region: 'Drenwick',
    type: 'town', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_INN_MAP: {
    id: 'DRENWICK_INN_MAP', map: DRENWICK_INN_MAP, displayName: 'Drenwick \u2014 Inn', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_OFFICE_MAP: {
    id: 'DRENWICK_OFFICE_MAP', map: DRENWICK_OFFICE_MAP, displayName: 'Drenwick \u2014 IJC District Office', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_POST_OFFICE_MAP: {
    id: 'DRENWICK_POST_OFFICE_MAP', map: DRENWICK_POST_OFFICE_MAP, displayName: 'Drenwick \u2014 Fenmark Post Co.', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
    notes: 'Small private mail-carrier office off the market east lane. Entered via DRENWICK_MARKET_MAP OFFICE_DOOR (row 10 col 14); INTERIOR_EXIT (col 7) returns to the market lane. Staffed by the Fenmark proprietor and the relay clerk (SIMPLE_NPCS, map drenwick_post_office).',
  },
  DRENWICK_HARBORMASTER_MAP: {
    id: 'DRENWICK_HARBORMASTER_MAP', map: DRENWICK_HARBORMASTER_MAP, displayName: 'Drenwick \u2014 Harbormaster\u2019s Office', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_WASH_HOUSE_MAP: {
    id: 'DRENWICK_WASH_HOUSE_MAP', map: DRENWICK_WASH_HOUSE_MAP, displayName: 'Drenwick \u2014 Wash House', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_INFIRMARY_MAP: {
    id: 'DRENWICK_INFIRMARY_MAP', map: DRENWICK_INFIRMARY_MAP, displayName: 'Drenwick \u2014 Infirmary', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
    notes: 'Small civic infirmary on the waterfront. Only reached via the chamber dream sequence (wakeAtDrenwickInfirmary); the vestibule INTERIOR_EXIT (col 7) returns to the waterfront in front of the door, which then gives the pay-per-HP healing dialogue instead of re-entry.',
  },
  DRENWICK_PROVISION_STORE_MAP: {
    id: 'DRENWICK_PROVISION_STORE_MAP', map: DRENWICK_PROVISION_STORE_MAP, displayName: 'Drenwick \u2014 Provision Store', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_GUILD_HALL_MAP: {
    id: 'DRENWICK_GUILD_HALL_MAP', map: DRENWICK_GUILD_HALL_MAP, displayName: 'Drenwick \u2014 Guild Hall', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_TAVERN_MAP: {
    id: 'DRENWICK_TAVERN_MAP', map: DRENWICK_TAVERN_MAP, displayName: 'Drenwick \u2014 Dockworkers\u2019 Tavern', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_SCHOOL_GROUND_MAP: {
    id: 'DRENWICK_SCHOOL_GROUND_MAP', map: DRENWICK_SCHOOL_GROUND_MAP, displayName: 'Drenwick \u2014 School', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_SCHOOL_UPPER_MAP: {
    id: 'DRENWICK_SCHOOL_UPPER_MAP', map: DRENWICK_SCHOOL_UPPER_MAP, displayName: 'Drenwick \u2014 School (Upper Floor)', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  DRENWICK_SCHOOL_BASEMENT_MAP: {
    id: 'DRENWICK_SCHOOL_BASEMENT_MAP', map: DRENWICK_SCHOOL_BASEMENT_MAP, displayName: 'Drenwick \u2014 School (Archive)', region: 'Drenwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },

  // ── Northern road (Pale Sentry contract territory) — regional chunks derived ─
  MAP_N1: _regionalChunkCatalogEntry('MAP_N1'),
  MAP_N2: _regionalChunkCatalogEntry('MAP_N2'),

  // ── South Ruins ────────────────────────────────────────────────────────────
  DUNGEON_ENTRANCE_MAP: {
    id: 'DUNGEON_ENTRANCE_MAP', map: DUNGEON_ENTRANCE_MAP, displayName: 'South Ruins \u2014 Entrance', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON_ENTRANCE_ITEMS, encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
    notes: 'Deliberately safe entrance hall (inDungeonEntrance is excluded from the encounter check) between the overworld and the monster-infested floors.',
  },
  DUNGEON_MAP: {
    id: 'DUNGEON_MAP', map: DUNGEON_MAP, displayName: 'South Ruins', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON_ITEMS, encounterPool: DUNGEON_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'dungeonFloor 1. Pool selection at runtime still branches on inDungeon+dungeonFloor (combat.js), not this metadata entry -- see the note at the top of this table.',
  },
  DUNGEON2_MAP: {
    id: 'DUNGEON2_MAP', map: DUNGEON2_MAP, displayName: 'South Ruins \u2014 Lower', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON2_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'dungeonFloor 2.',
  },
  DUNGEON3_MAP: {
    id: 'DUNGEON3_MAP', map: DUNGEON3_MAP, displayName: 'South Ruins \u2014 Deep', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON3_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'dungeonFloor 3 (hub); floor 3 shares DUNGEON2_ENEMY_TEMPLATES with floors 2, 4, and 5 (combat.js).',
  },
  DUNGEON3_TL_MAP: {
    id: 'DUNGEON3_TL_MAP', map: DUNGEON3_TL_MAP, displayName: 'South Ruins \u2014 Deep, West Wing', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON3_TL_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 3 sub-room.',
  },
  DUNGEON3_TR_MAP: {
    id: 'DUNGEON3_TR_MAP', map: DUNGEON3_TR_MAP, displayName: 'South Ruins \u2014 Deep, East Wing', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON3_TR_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 3 sub-room.',
  },
  DUNGEON3_ML_MAP: {
    id: 'DUNGEON3_ML_MAP', map: DUNGEON3_ML_MAP, displayName: 'South Ruins \u2014 Deep, Left Gallery', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON3_ML_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 3 sub-room.',
  },
  DUNGEON3_MC_MAP: {
    id: 'DUNGEON3_MC_MAP', map: DUNGEON3_MC_MAP, displayName: 'South Ruins \u2014 Deep, Crossing', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON3_MC_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 3 sub-room.',
  },
  DUNGEON3_MR_MAP: {
    id: 'DUNGEON3_MR_MAP', map: DUNGEON3_MR_MAP, displayName: 'South Ruins \u2014 Deep, Right Gallery', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON3_MR_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 3 sub-room.',
  },
  DUNGEON3_BL_MAP: {
    id: 'DUNGEON3_BL_MAP', map: DUNGEON3_BL_MAP, displayName: 'South Ruins \u2014 Deep, Lower West', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON3_BL_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 3 sub-room.',
  },
  DUNGEON3_BC_MAP: {
    id: 'DUNGEON3_BC_MAP', map: DUNGEON3_BC_MAP, displayName: 'South Ruins \u2014 Deep, Lower Hall', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON3_BC_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 3 sub-room.',
  },
  DUNGEON3_BR_MAP: {
    id: 'DUNGEON3_BR_MAP', map: DUNGEON3_BR_MAP, displayName: 'South Ruins \u2014 Deep, Descent Chamber', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON3_BR_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 3 sub-room.',
  },
  DUNGEON4_MAP: {
    id: 'DUNGEON4_MAP', map: DUNGEON4_MAP, displayName: 'South Ruins \u2014 Deeper', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON4_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 4.',
  },
  DUNGEON5_MAP: {
    id: 'DUNGEON5_MAP', map: DUNGEON5_MAP, displayName: 'South Ruins \u2014 Lowest', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON5_ITEMS, encounterPool: DUNGEON2_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 5.',
  },
  DUNGEON6_MAP: {
    id: 'DUNGEON6_MAP', map: DUNGEON6_MAP, displayName: 'South Ruins \u2014 The Deep', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON6_ITEMS, encounterPool: DUNGEON6_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 6.',
  },
  DUNGEON7_MAP: {
    id: 'DUNGEON7_MAP', map: DUNGEON7_MAP, displayName: 'South Ruins \u2014 Catacombs', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON7_ITEMS, encounterPool: DUNGEON6_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 7.',
  },
  DUNGEON8_MAP: {
    id: 'DUNGEON8_MAP', map: DUNGEON8_MAP, displayName: 'South Ruins \u2014 The Drowned Chamber', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON8_ITEMS, encounterPool: DUNGEON8_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 8.',
  },
  DUNGEON8_WEST_MAP: {
    id: 'DUNGEON8_WEST_MAP', map: DUNGEON8_WEST_MAP, displayName: 'South Ruins \u2014 West Passage', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON8_WEST_ITEMS, encounterPool: DUNGEON_HORROR_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 9.',
  },
  DUNGEON8_EAST_MAP: {
    id: 'DUNGEON8_EAST_MAP', map: DUNGEON8_EAST_MAP, displayName: 'South Ruins \u2014 East Passage', region: 'South Ruins',
    type: 'dungeon', items: DUNGEON8_EAST_ITEMS, encounterPool: DUNGEON_HORROR_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'dungeonFloor 10.',
  },

  // ── Calwick ────────────────────────────────────────────────────────────────
  TOWN_MAP: {
    id: 'TOWN_MAP', map: TOWN_MAP, displayName: 'Calwick', region: 'Calwick',
    type: 'town', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  INN_MAP: {
    id: 'INN_MAP', map: INN_MAP, displayName: 'Inn', region: 'Calwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  OFFICE_MAP: {
    id: 'OFFICE_MAP', map: OFFICE_MAP, displayName: 'Office', region: 'Calwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  SCHOOL_MAP: {
    id: 'SCHOOL_MAP', map: SCHOOL_MAP, displayName: 'West Calwick School', region: 'Calwick',
    type: 'interior', items: SCHOOL_ITEMS, encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  APARTMENT_CORRIDOR_MAP: {
    id: 'APARTMENT_CORRIDOR_MAP', map: APARTMENT_CORRIDOR_MAP, displayName: 'East Calwick Apartments', region: 'Calwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  SMALL_APARTMENT_MAP: {
    id: 'SMALL_APARTMENT_MAP', map: SMALL_APARTMENT_MAP, displayName: 'Apartment', region: 'Calwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  EAST_TOWN_MAP: {
    id: 'EAST_TOWN_MAP', map: EAST_TOWN_MAP, displayName: 'Calwick East Side', region: 'Calwick',
    type: 'town', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  WEST_TOWN_MAP: {
    id: 'WEST_TOWN_MAP', map: WEST_TOWN_MAP, displayName: 'Calwick West Side', region: 'Calwick',
    type: 'town', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  HOUSE_INTERIOR_MAP: {
    id: 'HOUSE_INTERIOR_MAP', map: HOUSE_INTERIOR_MAP, displayName: 'House', region: 'Calwick',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },

  // ── East Sluice ────────────────────────────────────────────────────────────
  SLUICE_MAP: {
    id: 'SLUICE_MAP', map: SLUICE_MAP, displayName: 'East Sluice', region: 'East Sluice',
    type: 'dungeon', items: SLUICE_ITEMS, encounterPool: SLUICE_TOP_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'sluiceFloor 1. Pool selection at runtime still branches on inSluice/sluiceFloor (combat.js), not this metadata entry; this encounterPool mirrors it for reference. The top floor deliberately draws a gentle overworld-tier pool (SLUICE_TOP_ENEMY_TEMPLATES — Marsh Wisp + Sluice Slime, as easy as the Verdant Vale) since it is likely the player’s first fights; floors 2-3 spike to SLUICE_ENEMY_TEMPLATES.',
  },
  SLUICE_LEVEL2_MAP: {
    id: 'SLUICE_LEVEL2_MAP', map: SLUICE_LEVEL2_MAP, displayName: 'East Sluice \u2014 Lower Works', region: 'East Sluice',
    type: 'dungeon', items: SLUICE_LEVEL2_ITEMS, encounterPool: SLUICE_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'sluiceFloor 2.',
  },
  SLUICE_LEVEL3_MAP: {
    id: 'SLUICE_LEVEL3_MAP', map: SLUICE_LEVEL3_MAP, displayName: 'East Sluice \u2014 Deep Works', region: 'East Sluice',
    type: 'dungeon', items: SLUICE_LEVEL3_ITEMS, encounterPool: SLUICE_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true, notes: 'sluiceFloor 3.',
  },
  SLUICE_SECRET_MAP: {
    id: 'SLUICE_SECRET_MAP', map: SLUICE_SECRET_MAP, displayName: 'East Sluice \u2014 Sealed Room', region: 'East Sluice',
    type: 'dungeon', items: SLUICE_SECRET_ITEMS, encounterPool: SLUICE_SECRET_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'sluiceFloor 4 -- the sealed room behind the Deep Works false walls (L3 r7 c12-c13 -> SLUICE_SECRET_ENTRANCE). Encounter rate is overridden at runtime to SLUICE_SECRET_ENCOUNTER_CHANCE (1/64) via inSluiceSealedRoom() (movement.js); the pool here IS what the runtime inSluice branch selects on this map (combat.js).',
  },

  DREAM_MAP: {
    id: 'DREAM_MAP', map: DREAM_MAP, displayName: '???', region: 'Dream',
    type: 'special', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: false,
    notes: 'The weekly strange-dream space (all white). Entered/left only via enterDream()/exitDream() while resting; unreachable by walking, no NPCs, no items. allowSave false is documentation -- the menu cannot open during the dream dialogue anyway.',
  },

  // ── Special vaults/chambers ────────────────────────────────────────────────
  MIRE_VAULT_MAP: {
    id: 'MIRE_VAULT_MAP', map: MIRE_VAULT_MAP, displayName: 'Mirethyst\u2019s Vault', region: 'Thornmere',
    type: 'dungeon', items: MIRE_VAULT_ITEMS, encounterPool: MIRE_VAULT_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'Pool selection at runtime still branches on inMireVault (combat.js), not this metadata entry.',
  },
  TAKOMO_MAP: {
    id: 'TAKOMO_MAP', map: TAKOMO_MAP, displayName: 'Takomo\u2019s Chamber', region: 'Thornmere',
    type: 'special', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
    notes: 'Boss chamber -- Takomo is a scripted fight, not a random-pool encounter (inTakomo is excluded from the random-encounter check in movement.js).',
  },
  HAMLET_INTERIOR_MAP: {
    id: 'HAMLET_INTERIOR_MAP', map: HAMLET_INTERIOR_MAP, displayName: 'The Falls', region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  FEN_BREWERY_MAP: {
    id: 'FEN_BREWERY_MAP', map: FEN_BREWERY_MAP, displayName: 'Wend Brewery', region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
};

// The 24 additional Sunken Gallery rooms (maps.js's 5×5 grid) all share the
// entrance hall's profile: a dungeon-type map in the North Basin region, the
// same Pale Drowned / Silt Hag encounter pool, no items, and no saving. Added
// as ordinary catalog entries in a loop (rather than 24 near-identical literals)
// BEFORE the compatibility views are derived, so they appear in MAP_REGISTRY /
// MAP_METADATA and the reverse index exactly like any authored map.
for (const cell of window.SUNKEN_GALLERY_GRID_CELLS) {
  const id = 'SUNKEN_GALLERY_' + cell;
  MAP_CATALOG[id] = {
    id: id, map: window[id], displayName: 'Sunken Gallery', region: 'North Basin',
    type: 'dungeon', items: [], encounterPool: SUNKEN_GALLERY_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: false,
    notes: 'One of the 24 blank rooms of the Sunken Gallery 5×5 grid (maps.js). GALLERY_FLOOR/GALLERY_WALL only, no other elements yet. Joined to its neighbours by EDGE_TRANSITIONS; shares the entrance hall’s encounter pool and allowSave: false.',
  };
}
window.MAP_CATALOG = MAP_CATALOG;

// ─── Derived compatibility views + canonical helpers ─────────────────────────
// MAP_CATALOG (above) is the sole authored source. The two legacy tables are now
// GENERATED from it (never authored independently), so they cannot drift:
//   • MAP_METADATA is an ALIAS of the catalog (same objects) — existing metadata
//     consumers keep working unchanged during the incremental migration.
//   • MAP_REGISTRY is generated as { id, label: displayName, map } — its label is
//     now always the canonical displayName, and its id is always the canonical
//     key (no more competing lowercase Drenwick ids).
const MAP_METADATA = MAP_CATALOG;
window.MAP_METADATA = MAP_METADATA;

const MAP_REGISTRY = {};
for (const _id of Object.keys(MAP_CATALOG)) {
  const _e = MAP_CATALOG[_id];
  MAP_REGISTRY[_id] = { id: _id, label: _e.displayName, map: _e.map };
}
window.MAP_REGISTRY = MAP_REGISTRY;

// Reverse index (map array reference → canonical id), built once so lookups are
// O(1) rather than scanning the catalog on every call.
const _MAP_REF_TO_ID = new Map();
for (const _id of Object.keys(MAP_CATALOG)) _MAP_REF_TO_ID.set(MAP_CATALOG[_id].map, _id);

// Canonical helpers. Unknown ids/refs return null (never a silent fallback).
function mapIdForRef(mapRef)  { return (mapRef && _MAP_REF_TO_ID.has(mapRef)) ? _MAP_REF_TO_ID.get(mapRef) : null; }
function mapEntryForId(mapId) { return (typeof mapId === 'string' && Object.prototype.hasOwnProperty.call(MAP_CATALOG, mapId)) ? MAP_CATALOG[mapId] : null; }
function mapRefForId(mapId)   { const e = mapEntryForId(mapId); return e ? e.map : null; }
window.mapIdForRef  = mapIdForRef;
window.mapEntryForId = mapEntryForId;
window.mapRefForId  = mapRefForId;

// Deprecated compatibility alias for the old resolver name (returns the canonical
// id for a map-array reference). Retained for console tooling / not-yet-migrated
// callers; new code should use mapIdForRef().
function mapRegistryId(mapRef) { return mapIdForRef(mapRef); }
window.mapRegistryId = mapRegistryId;

// ─── REGIONAL_LAYOUT: continuous-overworld chunk placement (prework) ──────────
// Behaviour-neutral prework for a FUTURE *continuous* overworld. It changes no
// runtime behaviour today: nothing here is consulted by rendering, movement,
// saves, encounters, or transitions -- it only DESCRIBES where the principal
// wilderness maps sit relative to one another, so later work (and the seam-
// readiness audit) has one authoritative place to read that layout from.
//
// This is a SEPARATE authority from MAP_CATALOG, and does not overlap it:
//   • MAP_CATALOG owns map IDENTITY  -- which physical maps exist, their arrays,
//     display names, types, encounter pools. It stays the sole such authority.
//   • REGIONAL_LAYOUT owns map GEOMETRY -- where each principal wilderness map
//     sits on a single continuous integer chunk grid. It references MAP_CATALOG
//     ids; it never redefines a map.
// It is ALSO distinct from the logical content-location-key namespace
// (currentContentLocationKey(), movement.js): those keys ('west', 'house:<id>',
// 'drenwick_civic', …) label shared physical grids for gameplay, and are not
// physical map ids or chunk coordinates. The three namespaces stay separate.
//
// One region, 'overworld', holds the principal connected wilderness. Its chunk
// coordinates were DERIVED from the game's own current transitions -- the broad
// EDGE_TRANSITIONS crossings (world-transitions.js) plus the single-tile world
// crossings in movement.js -- not invented. East is +chunkX, south is +chunkY
// (matching the game's tile axes), and every one of the 16 outdoor↔outdoor
// adjacencies the game currently defines places CONSISTENTLY on this grid with
// no contradiction (a strong signal the topology is right; the seam audit
// re-derives and reports it). Each chunk is exactly COLS×ROWS tiles (16×15) --
// verified against every placed map's array in validateRegionalLayout()
// (validation.js), not assumed here.
//
// Region-world coordinates are per-region tile coordinates:
//   worldX = chunkX*COLS + localX,  worldY = chunkY*ROWS + localY.
//
// Deliberately EXCLUDED, kept OFF the continuous grid (per the prework brief):
// the hidden Briar Warden meadow (MEADOW_MAP) and every other pocket/special
// map, plus all town, interior, bridge, and dungeon maps. Those remain separate
// maps reached by point/gate transitions; the seam audit reports any wilderness
// edge that leads to one as "outside the region / pocket".
// Region-level metadata (id + display name). Chunk placements are DERIVED from
// REGIONAL_CHUNK_CATALOG (the single authority), in its authored order — there is
// no second authored placement list. A placement occupies one COLS×ROWS chunk;
// gaps (unplaced chunks inside a region's bounding box) are a real, tested case —
// tileAtWorld() reads them as REGION_VOID_TILE.
const _REGION_META = {
  overworld: { id: 'overworld', displayName: 'Verdant Vale Overworld' },
};
const REGIONAL_LAYOUT = (function () {
  const out = {};
  for (const rid of Object.keys(_REGION_META)) out[rid] = { id: _REGION_META[rid].id, displayName: _REGION_META[rid].displayName, placements: [] };
  for (const r of Object.values(REGIONAL_CHUNK_CATALOG)) {
    if (!out[r.regionId]) out[r.regionId] = { id: r.regionId, displayName: r.regionId, placements: [] };
    out[r.regionId].placements.push({ mapId: r.mapId, chunkX: r.chunkX, chunkY: r.chunkY });
  }
  return out;
})();
window.REGIONAL_LAYOUT = REGIONAL_LAYOUT;

// Documented void result for tileAtWorld(): any region-world coordinate that is
// out of range, negative, or inside the region's bounding box but on an UNPLACED
// chunk reads as this sentinel. It is never a real tile id (every real tile id is
// a non-negative integer), so callers can test `=== REGION_VOID_TILE` safely.
const REGION_VOID_TILE = -1;
window.REGION_VOID_TILE = REGION_VOID_TILE;

// Derived reverse indexes -- built ONCE from REGIONAL_LAYOUT, never authored
// independently (mirroring how MAP_REGISTRY / _MAP_REF_TO_ID derive from
// MAP_CATALOG, so they cannot drift): one maps a physical map id to its
// placement; the other maps a region+chunk coordinate to the map id there.
const _MAP_ID_TO_PLACEMENT = new Map(); // mapId -> { regionId, mapId, chunkX, chunkY }
const _CHUNK_TO_MAP_ID     = new Map(); // 'regionId:cx,cy' -> mapId
function _chunkKey(regionId, cx, cy) { return regionId + ':' + cx + ',' + cy; }
for (const _regionId of Object.keys(REGIONAL_LAYOUT)) {
  for (const _p of REGIONAL_LAYOUT[_regionId].placements) {
    const _placement = { regionId: _regionId, mapId: _p.mapId, chunkX: _p.chunkX, chunkY: _p.chunkY };
    _MAP_ID_TO_PLACEMENT.set(_p.mapId, _placement);
    _CHUNK_TO_MAP_ID.set(_chunkKey(_regionId, _p.chunkX, _p.chunkY), _p.mapId);
  }
}

// ── Side-effect-free layout helpers ──────────────────────────────────────────
// Pure lookups / coordinate math over the derived indexes; none read or write
// player/activeMap/runtime state. Unknown ids/coords return null (never a silent
// fallback) -- the same contract as mapEntryForId()/mapIdForRef(). COLS/ROWS are
// read at call time (defined in state.js, which loads after this file).

// map id -> its placement { regionId, mapId, chunkX, chunkY }, or null.
function regionPlacementForMapId(mapId) {
  return _MAP_ID_TO_PLACEMENT.has(mapId) ? _MAP_ID_TO_PLACEMENT.get(mapId) : null;
}
// regionId + chunk coordinate -> the physical map id there, or null if unplaced.
function mapIdForChunk(regionId, chunkX, chunkY) {
  const k = _chunkKey(regionId, chunkX, chunkY);
  return _CHUNK_TO_MAP_ID.has(k) ? _CHUNK_TO_MAP_ID.get(k) : null;
}
// map-local (tile) coordinate -> region-world (tile) coordinate.
// { regionId, worldX, worldY }, or null if the map isn't placed in any region.
function localToWorld(mapId, localX, localY) {
  const p = regionPlacementForMapId(mapId);
  if (!p) return null;
  return { regionId: p.regionId, worldX: p.chunkX * COLS + localX, worldY: p.chunkY * ROWS + localY };
}
// region-world (tile) coordinate -> the map id + local coordinate there.
// { mapId, chunkX, chunkY, localX, localY }, or null if no chunk is placed there
// (unknown regionId, negative, out of range, or a gap in the bounding box).
function worldToLocal(regionId, worldX, worldY) {
  if (!REGIONAL_LAYOUT[regionId]) return null;
  if (worldX < 0 || worldY < 0) return null; // negatives fall onto no chunk
  const chunkX = Math.floor(worldX / COLS), chunkY = Math.floor(worldY / ROWS);
  const mapId = mapIdForChunk(regionId, chunkX, chunkY);
  if (!mapId) return null;
  return { mapId, chunkX, chunkY, localX: worldX - chunkX * COLS, localY: worldY - chunkY * ROWS };
}
// Reads the tile id at a region-world coordinate. Missing chunk / out of range /
// negative -> REGION_VOID_TILE (documented void), never a throw or a wrong tile.
function tileAtWorld(regionId, worldX, worldY) {
  const loc = worldToLocal(regionId, worldX, worldY);
  if (!loc) return REGION_VOID_TILE;
  const map = mapRefForId(loc.mapId);
  if (!map || !map[loc.localY] || map[loc.localY][loc.localX] === undefined) return REGION_VOID_TILE;
  return map[loc.localY][loc.localX];
}
window.regionPlacementForMapId = regionPlacementForMapId;
window.mapIdForChunk        = mapIdForChunk;
window.localToWorld         = localToWorld;
window.worldToLocal         = worldToLocal;
window.tileAtWorld          = tileAtWorld;

// ─── Outdoor content-location-key authority (physical map id -> logical key) ──
// The SINGLE declarative source of the logical content-location key for each of
// the 15 region-placed OUTDOOR maps. currentContentLocationKey() (movement.js)
// CONSUMES this for neutral outdoor locations, so there is no second,
// independently-maintained mapping. Physical map ids and content-location keys
// are DISTINCT namespaces — do not assume equality. MAP / MAP5 / RODDON_WAY_MAP
// intentionally SHARE the 'overworld' key (they have no distinct per-map key
// today); a shared key is "ambiguous" for neighbouring-NPC attribution (grouped
// in continuous-content.js). This is pure data + a pure lookup: nothing here (or
// its consumers) ever assigns activeMap/player/location state to resolve a key.
// DERIVED from REGIONAL_CHUNK_CATALOG (each record's contentKey), in authored
// order — no second authored content-key table. (MAP / MAP5 / RODDON_WAY_MAP
// intentionally share 'overworld'; distinct namespaces from the physical mapId.)
const OUTDOOR_CONTENT_KEYS = Object.fromEntries(
  Object.values(REGIONAL_CHUNK_CATALOG).map((r) => [r.mapId, r.contentKey])
);
// Physical outdoor map id -> its logical content-location key, or null if the id
// is not a bound outdoor map. Pure O(1) lookup — never probes runtime state.
function outdoorContentKeyForMapId(mapId) {
  return (typeof mapId === 'string' && Object.prototype.hasOwnProperty.call(OUTDOOR_CONTENT_KEYS, mapId))
    ? OUTDOOR_CONTENT_KEYS[mapId] : null;
}
window.OUTDOOR_CONTENT_KEYS      = OUTDOOR_CONTENT_KEYS;
window.outdoorContentKeyForMapId = outdoorContentKeyForMapId;

// ─── Regional presentation mode (declarative, catalog-driven) ────────────────
// A placed regional outdoor map presents either in the scrolling CONTINUOUS world
// or as a fixed 'legacy_screen' (single-map, non-scrolling) even while the session
// Continuous View toggle is on. The MAP_CATALOG entry's optional
// `regionalPresentation` is the SOLE authority; the default for a placed regional
// outdoor map is 'continuous'. There is no second authored list of legacy maps and
// no scattered `mapId === 'MAP'` presentation checks — every consumer reads this
// resolver. Unrecognized authored values are caught by validateGameData().
const REGIONAL_PRESENTATION_MODES = Object.freeze({ continuous: true, legacy_screen: true });
function regionalPresentationForMapId(mapId) {
  const p = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(mapId) : null;
  if (!p) return null;                                  // not a placed regional map -> no presentation mode
  const e = (typeof mapEntryForId === 'function') ? mapEntryForId(mapId) : null;
  const mode = e ? e.regionalPresentation : undefined;
  if (mode === undefined || mode === null) return 'continuous';   // default
  return mode;                                          // authored value (validation ensures it is recognized)
}
// Strict runtime predicate: true ONLY for a placed regional map authored exactly
// 'legacy_screen'. Any other/unknown value is NOT treated as legacy at runtime.
function isLegacyScreenMap(mapId) { return regionalPresentationForMapId(mapId) === 'legacy_screen'; }
// Declarative continuous-camera policy for a placed regional map: the legacy_screen
// chunk it must keep off-screen and the SIDE the viewport stays on. Authored on the
// chunk definition (legacyCameraExclusion), resolved here from REGIONAL_CHUNK_CATALOG.
// Returns { mapId, side } or null. The one place the camera reads its exclusion policy.
function legacyCameraExclusionForMapId(mapId) {
  const r = (typeof REGIONAL_CHUNK_CATALOG !== 'undefined') ? REGIONAL_CHUNK_CATALOG[mapId] : undefined;
  return (r && r.legacyCameraExclusion) ? r.legacyCameraExclusion : null;
}
window.legacyCameraExclusionForMapId = legacyCameraExclusionForMapId;
window.REGIONAL_PRESENTATION_MODES = REGIONAL_PRESENTATION_MODES;
window.regionalPresentationForMapId = regionalPresentationForMapId;
window.isLegacyScreenMap           = isLegacyScreenMap;

// ─── Stable-ID registries (#4): world pickups + openable chests ──────────────
// Immutable-ID policy: every persistent placed pickup and every openable chest
// carries an authored, immutable `id` (`pickup_<snake>` / `chest_<snake>`, lower
// snake case). IDs are developer-facing, never derived at runtime from array
// index / coordinates / display name / registry order, and travel ON the object
// so reordering or moving it never changes its id. Version-3 saves record
// COLLECTED pickup ids and OPENED chest ids — never array positions or per-chest
// fields — so adding or reordering a pickup/chest never changes an existing
// save's meaning. Once an id has shipped in a save it must never be renamed or
// reused for a different entity without an explicit save migration.

// Pickup registry — discovered from MAP_METADATA.items (the authoritative
// per-map content list), keyed by each pickup's immutable id. Deduped by object
// identity, so an array reachable under two names (DUNGEON3_ITEMS ===
// DUNGEON3_TC_ITEMS) or via two metadata keys registers once. Shops, inventory
// definitions (ITEM_REGISTRY), chest rewards and combat items are never here.
const PICKUP_REGISTRY = {};
const PICKUP_REGISTRY_DUP_IDS = [];
(function buildPickupRegistry() {
  const seen = new Set();
  for (const key of Object.keys(MAP_METADATA)) {
    const items = MAP_METADATA[key].items;
    if (!Array.isArray(items)) continue;
    for (const p of items) {
      if (!p || typeof p !== 'object' || seen.has(p)) continue;
      seen.add(p);                                    // same object via >1 path: once
      if (typeof p.id !== 'string' || !p.id) continue; // missing id: validateGameData flags it
      if (PICKUP_REGISTRY[p.id] && PICKUP_REGISTRY[p.id] !== p) PICKUP_REGISTRY_DUP_IDS.push(p.id);
      else PICKUP_REGISTRY[p.id] = p;
    }
  }
})();
// Canonical sorted, duplicate-free id order for deterministic save/validation.
const PICKUP_REGISTRY_IDS = Object.keys(PICKUP_REGISTRY).sort();

// Openable-chest registry — every ordinary chest whose persistent state is a
// boolean `.opened`. Add a new openable chest by giving it an `id` and listing
// it here (one obvious registration path). Nonstandard persistence — the
// player-house stored-gold container (a value, not opened/closed), dresser
// `.looted`, sparkle `.taken` — is deliberately NOT here and keeps its own field.
const OPENABLE_CHESTS = [
  DUNGEON_CHEST, DUNGEON_ALCOVE_CHEST, SLUICE_CHEST, SLUICE_LEVEL2_CHEST,
  SLUICE_SECRET_CHEST, SLUICE_LEVEL3_CHEST, SLUICE_DEEP_CHEST, CAT_ARMOR_CHEST, MEADOW_CHEST,
  SUNKEN_GALLERY_CHEST,
];
const CHEST_REGISTRY = {};
const CHEST_REGISTRY_DUP_IDS = [];
for (const c of OPENABLE_CHESTS) {
  if (!c || typeof c.id !== 'string' || !c.id) continue;
  if (CHEST_REGISTRY[c.id] && CHEST_REGISTRY[c.id] !== c) CHEST_REGISTRY_DUP_IDS.push(c.id);
  else CHEST_REGISTRY[c.id] = c;
}
const CHEST_REGISTRY_IDS = Object.keys(CHEST_REGISTRY).sort();

window.PICKUP_REGISTRY         = PICKUP_REGISTRY;
window.PICKUP_REGISTRY_IDS     = PICKUP_REGISTRY_IDS;
window.PICKUP_REGISTRY_DUP_IDS = PICKUP_REGISTRY_DUP_IDS;
window.OPENABLE_CHESTS         = OPENABLE_CHESTS;
window.CHEST_REGISTRY          = CHEST_REGISTRY;
window.CHEST_REGISTRY_IDS      = CHEST_REGISTRY_IDS;
window.CHEST_REGISTRY_DUP_IDS  = CHEST_REGISTRY_DUP_IDS;
