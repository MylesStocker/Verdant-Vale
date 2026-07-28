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
  { name: 'Marsh Wisp',    hp: 14, maxHp: 14, atk: 5, def: 1, spd:  9, xp: 12, goldMin: 1, goldMax:  3 },
  // Rocky tank — extremely tough shell, slow attack
  { name: 'Stone Crawler', hp: 36, maxHp: 36, atk: 5, def: 6, spd:  3, xp: 20, goldMin: 3, goldMax:  8, defendChance: 0.20 },
  // Predatory hound — aggressive, hits hard, lightly armored
  { name: 'Briar Hound',   hp: 25, maxHp: 25, atk: 10, def: 2, spd:  8, xp: 16, goldMin: 3, goldMax:  8 },
];

// ─── Early-area enemies (starting overworld MAP only) ──────────────────────────
// Gentler variants used exclusively on the starting map (MAP). ENEMY_TEMPLATES
// applies from MAP2 onward. Keeps Stone Crawler out of the very first encounters.
const EARLY_ENEMY_TEMPLATES = [
  { name: 'Marsh Wisp',  hp: 10, maxHp: 10, atk: 3, def: 0, spd: 6, xp:  8, goldMin: 0, goldMax: 2 },
  { name: 'Briar Hound', hp: 16, maxHp: 16, atk: 6, def: 1, spd: 5, xp: 10, goldMin: 2, goldMax: 5 },
];
window.EARLY_ENEMY_TEMPLATES = EARLY_ENEMY_TEMPLATES;

const DUNGEON_ENEMY_TEMPLATES = [
  // Bone Guard — heavily armored skeleton warrior
  { name: 'Bone Guard',   hp: 36, maxHp: 36, atk: 8,  def: 6, spd:  4, xp: 28, goldMin: 8, goldMax: 15, defendChance: 0.25 },
  // Shade Wraith — fast spectral assassin, fragile but hits hard
  { name: 'Shade Wraith', hp: 26, maxHp: 26, atk: 12, def: 2, spd: 12, xp: 32, goldMin: 8, goldMax: 15 },
];

const DUNGEON2_ENEMY_TEMPLATES = [
  // Crypt Fiend — massive rotting brute; high HP, hits hard, heavily armored
  { name: 'Crypt Fiend',  hp: 52, maxHp: 52, atk: 15, def: 8,  spd:  3, xp: 55, goldMin: 12, goldMax: 22 },
  // Void Walker — void-touched entity; fragile shell but devastating attack
  { name: 'Void Walker',  hp: 38, maxHp: 38, atk: 22, def: 3,  spd:  7, xp: 65, goldMin: 16, goldMax: 28, curseChance: 0.20 },
];

// Floors 6-7 — deeper ruin depths; harder than floors 2-5
const DUNGEON6_ENEMY_TEMPLATES = [
  // Hollow — gutted animated shell; armored but slow, grinds you down
  { name: 'Hollow',    hp: 65, maxHp: 65, atk: 20, def: 10, spd:  5, xp:  80, goldMin: 18, goldMax: 32, defendChance: 0.20 },
  // Fen Shade — spectral remnant seeped from the wetlands above; fast, hits hard
  { name: 'Fen Shade', hp: 45, maxHp: 45, atk: 28, def:  4, spd:  8, xp:  90, goldMin: 20, goldMax: 35 },
];

// Floor 8 — the deepest structured chamber before the horror branches
const DUNGEON8_ENEMY_TEMPLATES = [
  // Tomb Sentry — petrified guardian reanimated; extremely durable, slow
  { name: 'Tomb Sentry',    hp: 90, maxHp: 90, atk: 25, def: 12, spd:  3, xp: 120, goldMin: 25, goldMax: 45, defendChance: 0.30 },
  // Crypt Revenant — something that was buried twice; fast, savage, barely coherent
  { name: 'Crypt Revenant', hp: 70, maxHp: 70, atk: 32, def:  5, spd: 10, xp: 130, goldMin: 28, goldMax: 50 },
];

// Horror branches (floors 9 & 10) — the glutinous side-chambers; biological and wrong
const DUNGEON_HORROR_ENEMY_TEMPLATES = [
  // Wall Tendril — something that grows from the walls; fast, hard to hit, devastating
  { name: 'Wall Tendril', hp:  55, maxHp:  55, atk: 38, def:  2, spd: 14, xp: 150, goldMin: 30, goldMax: 55 },
  // Dripping Maw — a mouth that forms in the ceiling; massive, drips acid, slow
  { name: 'Dripping Maw', hp: 120, maxHp: 120, atk: 35, def:  8, spd:  5, xp: 160, goldMin: 32, goldMax: 58 },
  // The Seep — formless biological mass; no defense, but hits with everything it has
  { name: 'The Seep',     hp:  40, maxHp:  40, atk: 45, def:  0, spd: 18, xp: 170, goldMin: 35, goldMax: 62 },
];

// Rainfish — scripted encounter only (Still Water quest, MAP3_N1 bog-edge danger zone).
// Very fast (almost always strike first), low HP, no reward to speak of. Three in a row.
// Cannot flee — the school is all around the player in the shallows.
const RAINFISH_TEMPLATE = { name: 'Rainfish', hp: 22, maxHp: 22, atk: 10, def: 0, spd: 24, xp: 5, goldMin: 0, goldMax: 1 };
window.RAINFISH_TEMPLATE = RAINFISH_TEMPLATE;

// Enemies for far world squares (MAP3, MAP_N1, MAP_N2) — significantly harder than ENEMY_TEMPLATES
const FAR_ENEMY_TEMPLATES = [
  // Fen Lurker — ambush predator; high speed and attack, decent HP
  { name: 'Fen Lurker',    hp: 38, maxHp: 38, atk: 14, def: 3,  spd: 11, xp: 38, goldMin: 8,  goldMax: 18 },
  // Rotwood Troll — regenerating swamp brute; very high HP, slow but hits hard
  { name: 'Rotwood Troll', hp: 58, maxHp: 58, atk: 16, def: 6,  spd:  3, xp: 45, goldMin: 10, goldMax: 20 },
  // Thornback — armored bog beast; heavily armored, moderate attack
  { name: 'Thornback',     hp: 44, maxHp: 44, atk: 12, def: 9,  spd:  4, xp: 42, goldMin: 9,  goldMax: 18 },
  // Fen Witch — cursed hag; devastating magic-like attack, fragile
  { name: 'Fen Witch',     hp: 32, maxHp: 32, atk: 20, def: 2,  spd:  8, xp: 50, goldMin: 12, goldMax: 22 },
  // Bog Serpent — massive wetland snake; high HP and moderate attack, swift
  { name: 'Bog Serpent',   hp: 48, maxHp: 48, atk: 15, def: 4,  spd:  9, xp: 48, goldMin: 10, goldMax: 20 },
  // Mire Toad — the jack and the hen. Two common fen toads, IDENTICAL in name,
  // sprite and EVERY stat: the `sex` field is the only difference, and it is
  // invisible in battle (never shown in the name, message, HP or stats). Only
  // Observe reveals which is which (getObservationText), and only a sex-matched
  // reagent (Henbane Sprig / Jackbane Vial, items.js) drops it in one move.
  // Deliberately durable (high HP + def) and unpleasant (poison-skinned): a slow
  // slog to grind down by attacks, and it drips toxin on a hit, so paying 8 gold
  // and an Observe to end it instantly is the better play. Both entries in the
  // pool so each sex is ~1-in-7 of a fen fight.
  { name: 'Mire Toad',     hp: 72, maxHp: 72, atk: 15, def: 10, spd:  5, xp: 52, goldMin: 10, goldMax: 20, poisonChance: 0.30, sex: 'male'   },
  { name: 'Mire Toad',     hp: 72, maxHp: 72, atk: 15, def: 10, spd:  5, xp: 52, goldMin: 10, goldMax: 20, poisonChance: 0.30, sex: 'female' },
];

// Enemies specific to Thornmere (MAP4) and Thornmere Shallows (MAP5) — deeper fen, harder than the open marsh
const THORNMERE_ENEMY_TEMPLATES = [
  // Corpse Slug — enormous pale slug; bloated, slow, carries the rot of the deep fen
  { name: 'Corpse Slug', hp: 62, maxHp: 62, atk: 13, def: 6, spd: 2, xp: 55, goldMin: 14, goldMax: 28 },
];
window.THORNMERE_ENEMY_TEMPLATES = THORNMERE_ENEMY_TEMPLATES;

// Enemies specific to the East Sluice — aquatic/canal-dwelling, mid-tier difficulty
const SLUICE_ENEMY_TEMPLATES = [
  // Reed Grappler — armoured freshwater crustacean; tanky shell, slow but strong claws
  { name: 'Reed Grappler', hp: 34, maxHp: 34, atk:  9, def: 5, spd:  5, xp: 26, goldMin:  5, goldMax: 12 },
  // Silt Lurker — eel-like ambush predator; erupts from canal mud, fast and vicious
  { name: 'Silt Lurker',   hp: 22, maxHp: 22, atk: 13, def: 1, spd: 11, xp: 30, goldMin:  5, goldMax: 11 },
];

// The North Basin's Silt Flats (NORTH_BASIN_SW_MAP) — the region's first real
// encounter map. Deliberately gentler than FAR_ENEMY_TEMPLATES (this is meant
// to be an easy on-ramp into the basin, not another Rotwood Troll-style
// spike — see BALANCE_REPORT.md for why that comparison matters here).
const NORTH_BASIN_ENEMY_TEMPLATES = [
  // Silt Crab — small crustacean stranded by the retreating waterline; slow,
  // shelled, occasionally braces. A tank, not a threat.
  { name: 'Silt Crab',       hp: 28, maxHp: 28, atk: 12, def: 5, spd:  4, xp: 18, goldMin: 4, goldMax:  9, defendChance: 0.20 },
  // Mudflat Strider — long-legged wader that used to work the shallows;
  // exposed ground suits it fine. Fast, fragile, low reward.
  { name: 'Mudflat Strider', hp: 20, maxHp: 20, atk: 11, def: 2, spd: 10, xp: 16, goldMin: 3, goldMax:  7 },
  // Basin Gull — scavenger gull come inland off the Thornmere, working the
  // stranded-fish die-offs on the exposed bed. Bold enough to go for the
  // eyes; quick, hits harder than it looks, folds fast when hit back.
  { name: 'Basin Gull',      hp: 24, maxHp: 24, atk: 14, def: 3, spd: 12, xp: 20, goldMin: 5, goldMax: 10 },
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
  { name: 'Pale Drowned', hp: 30, maxHp: 30, atk: 11, def: 2, spd: 10, xp: 35, goldMin:  6, goldMax: 14 },
  // Silt Hag — the silt here is deep, and it was never empty
  { name: 'Silt Hag',     hp: 45, maxHp: 45, atk: 18, def: 5, spd:  3, xp: 50, goldMin: 10, goldMax: 20 },
];
window.SUNKEN_GALLERY_ENEMY_TEMPLATES = SUNKEN_GALLERY_ENEMY_TEMPLATES;

// ─── The Upper Reach surface (NORTH_BASIN_NW_MAP) ────────────────────────────
// The drained NW arm was silent for a long while; now the exposed bed has its
// own dangers. Two are the same creatures worked elsewhere in the basin, come
// up onto the oldest-exposed ground (not a new tier); two are new and much
// tougher — the long-stranded, dried, wrong things the retreating water left
// behind first. The surface counterpart to the Sunken Gallery's drowned dead
// directly below it. Only BASIN_MUD rolls here (see isEncounterEligibleTile,
// movement.js); the stonework apron and the pools stay quiet.
const UPPER_REACH_ENEMY_TEMPLATES = [
  // Same creatures as the Silt Flats / West Shore pool, stranded up here too.
  { name: 'Silt Crab',    hp: 28, maxHp: 28, atk: 12, def: 5, spd:  4, xp: 18, goldMin:  4, goldMax:  9, defendChance: 0.20 },
  { name: 'Basin Gull',   hp: 24, maxHp: 24, atk: 14, def: 3, spd: 12, xp: 20, goldMin:  5, goldMax: 10 },
  // New and tough: the arm the water left first, and what it left there.
  // Dust-Drowned — a reservoir drowning the drought gave up first, dried to
  // grave-leather and still walking the bed; its touch carries the cold.
  { name: 'Dust-Drowned', hp: 50, maxHp: 50, atk: 16, def: 5, spd:  8, xp: 46, goldMin:  9, goldMax: 19, curseChance: 0.20 },
  // Marrow Hulk — the largest thing the retreating water stranded, mineral-
  // and-bone-crusted from the long exposure; terribly slow, but it braces, and
  // it crushes.
  { name: 'Marrow Hulk',  hp: 66, maxHp: 66, atk: 19, def: 8, spd:  3, xp: 56, goldMin: 14, goldMax: 26, defendChance: 0.25 },
];
window.UPPER_REACH_ENEMY_TEMPLATES = UPPER_REACH_ENEMY_TEMPLATES;

// ─── Swamp Donkey — the North Basin's rare spike ─────────────────────────────
// An uncommon, very hard-hitting bog beast that can turn up on ANY of the five
// outdoor North Basin squares (see startCombat, combat.js) at roughly one fight
// in sixteen — not part of any square's normal pool. Moderate HP (it dies in a
// few solid hits), but a punishing attack: the encounter hurts almost entirely
// because of what it kicks for. No status gimmick — just the boot.
const SWAMP_DONKEY_TEMPLATE = { name: 'Swamp Donkey', hp: 46, maxHp: 46, atk: 28, def: 5, spd: 9, xp: 60, goldMin: 16, goldMax: 32 };
window.SWAMP_DONKEY_TEMPLATE = SWAMP_DONKEY_TEMPLATE;

const ENCOUNTER_CHANCE   = 1 / 6;
const ENCOUNTER_COOLDOWN = 120;

// ─── East Sluice Deep Works — sealed room (behind the L3 false walls) ─────────
// The room's encounter roll replaces ENCOUNTER_CHANCE, not the roll cadence:
// same every-16th-step check as everywhere else, but at 1/64 -- rare enough
// that most visits are silent, which is the point. The pool has exactly one
// entry and it is not scaled to the sluice: the Tallyman outclasses every
// boss in the game. Running away is the correct response.
const SLUICE_SECRET_ENCOUNTER_CHANCE = 1 / 64;
const SLUICE_SECRET_ENEMY_TEMPLATES = [
  // The thing that keeps the count. Do not fight it on purpose.
  { name: 'Tallyman', hp: 330, maxHp: 330, atk: 55, def: 11, spd: 22, xp: 550, goldMin: 0, goldMax: 0 },
];

// ── World pick-up items ───────────────────────────────────────────────────────
// Iron Sword and Leather Armor moved to starting inventory (issued by Empire office).
const WORLD_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 6.5 * TILE, y: 11.5 * TILE, picked: false },
];

const DUNGEON_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y: 6.5 * TILE, picked: false },
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 6.5 * TILE, picked: false },
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  6.5 * TILE, y: 1.5 * TILE, picked: false },
];

const DUNGEON2_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  4.5 * TILE, y: 6.5 * TILE, picked: false },
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 11.5 * TILE, y: 7.5 * TILE, picked: false },
];

// ── Floor 3 sub-room items ──────────────────────────────────────────────────
// TC — entry hub (two potions in the wide mid-chamber)
const DUNGEON3_TC_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y: 6.5 * TILE, picked: false },
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 7.5 * TILE, picked: false },
];
const DUNGEON3_ITEMS = DUNGEON3_TC_ITEMS; // backward-compat alias for save/load

// TL — scripture room: one potion + ancient writing inscription
const DUNGEON3_TL_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 3.5 * TILE, y: 8.5 * TILE, picked: false },
  { name: 'Ancient Writing', type: 'inscription', x: 8.5 * TILE, y: 5.5 * TILE, picked: false,
    lore: [['The walls here predate the Empire by centuries.', 'The builders are unknown.', 'Their script was never decoded.', 'At the base, a crude sketch: a sun with too many rays.']] },
];

// TR — old supply cache: two potions
const DUNGEON3_TR_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 12.5 * TILE, y: 4.5 * TILE, picked: false },
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 12.5 * TILE, y: 8.5 * TILE, picked: false },
];

// ML — left gallery: one potion + garrison log inscription
const DUNGEON3_ML_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 6.5 * TILE, y: 6.5 * TILE, picked: false },
  { name: 'Garrison Log', type: 'inscription', x: 7.5 * TILE, y: 7.5 * TILE, picked: false,
    lore: [['YEAR 847 \u2014 CALWICK GARRISON LOG', 'Third company dispatched to clear South Ruins.', 'Lost contact at the third level.', 'Commander Vesthall ordered the passage sealed.', 'No further expeditions authorised.', 'By order of the Regional Prefect.']] },
];

// MC — central crossing: one elixir at the hub centre
const DUNGEON3_MC_ITEMS = [
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 7.5 * TILE, y: 7.5 * TILE, picked: false },
];

// MR — rubble room: one potion + one elixir among the debris
const DUNGEON3_MR_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 12.5 * TILE, y: 6.5 * TILE, picked: false },
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 12.5 * TILE, y: 9.5 * TILE, picked: false },
];

// BL — ritual chamber: one potion + foreboding warning inscription
const DUNGEON3_BL_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 3.5 * TILE, y: 11.5 * TILE, picked: false },
  { name: 'Scratched Warning', type: 'inscription', x: 7.5 * TILE, y: 7.5 * TILE, picked: false,
    lore: [['Do not go deeper.', 'It does not move, but it waits.', 'We sealed the lower hall.', 'We were not enough.']] },
];

// BC — lower approach hall: one potion
const DUNGEON3_BC_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 7.5 * TILE, y: 7.5 * TILE, picked: false },
];

// BR — descent chamber: one elixir (reward before going deeper)
const DUNGEON3_BR_ITEMS = [
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 10.5 * TILE, y: 5.5 * TILE, picked: false },
];

const DUNGEON4_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y: 7.5 * TILE, picked: false },
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 6.5 * TILE, picked: false },
];

const DUNGEON5_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y: 7.5 * TILE, picked: false },
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 6.5 * TILE, picked: false },
];

const DUNGEON6_ITEMS = [
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x:  2.5 * TILE, y: 6.5 * TILE, picked: false },
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 13.5 * TILE, y: 7.5 * TILE, picked: false },
];

const DUNGEON7_ITEMS = [
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x:  2.5 * TILE, y: 7.5 * TILE, picked: false },
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 13.5 * TILE, y: 6.5 * TILE, picked: false },
  // ── hidden antechamber (secret passage via false wall at row 4, col 2) ──
  { name: 'Burial Record', type: 'inscription', x: 1.5 * TILE, y: 2.5 * TILE, picked: false,
    lore: [['Interment Record \u2014 Civic Division.',
            'Ward, K. Clerk (Third Grade).',
            'Year 831. Cause: unspecified.',
            'Effects claimed. No next of kin recorded.',
            'File closed.']] },
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 2.5 * TILE, y: 3.5 * TILE, picked: false },
];

const DUNGEON8_ITEMS = [
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x:  2.5 * TILE, y: 6.5 * TILE, picked: false },
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 13.5 * TILE, y: 7.5 * TILE, picked: false },
];

const DUNGEON8_WEST_ITEMS = [
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 7.5 * TILE, y: 6.5 * TILE, picked: false },
];

const DUNGEON8_EAST_ITEMS = [
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 7.5 * TILE, y: 6.5 * TILE, picked: false },
];

// ─── Sluice items ─────────────────────────────────────────────────────────────
// Floor items inside the East Sluice. Same structure as DUNGEON_ITEMS.
const SLUICE_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 2.5 * TILE, y: 9.5 * TILE, picked: false },
];

// ─── Sluice chest ─────────────────────────────────────────────────────────────
// Placed in the lower-right east nook (col 14, row 9). Opened by pressing
// Space when adjacent — not auto-picked like floor items.
const SLUICE_CHEST = {
  x:      14.5 * TILE,
  y:       9.5 * TILE,
  opened: false,
  item:   { name: 'Elixir', type: 'potion', heals: 50, price: 80 },
};

// ─── Sluice level 2 items ─────────────────────────────────────────────────────
const SLUICE_LEVEL2_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  2.5 * TILE, y:  1.5 * TILE, picked: false },  // NW dead-end
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 11.5 * TILE, y: 13.5 * TILE, picked: false },  // feature chamber
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  4.5 * TILE, y:  3.5 * TILE, picked: false },  // cross-corridor (r3 c4)
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  4.5 * TILE, y: 12.5 * TILE, picked: false },  // south pocket (r12 c4)
];

// ─── Sluice level 2 chest ─────────────────────────────────────────────────────
// East dead-end spur (col 14, row 8). Opened by pressing Space when adjacent.
const SLUICE_LEVEL2_CHEST = {
  x:      14.5 * TILE,
  y:       8.5 * TILE,
  opened: false,
  item:   { name: 'Elixir', type: 'potion', heals: 50, price: 80 },
};

// ─── Sluice secret chest ──────────────────────────────────────────────────────
// Hidden behind the FALSE_WALL at r9 c11. Located at r10 c13 in the secret area.
const SLUICE_SECRET_CHEST = {
  x:      13.5 * TILE,
  y:      10.5 * TILE,
  opened: false,
  item:   { name: 'Warden Blade', type: 'weapon', bonus: 10, price: 220 },
};

// ─── Sluice level 3 items ─────────────────────────────────────────────────────
const SLUICE_LEVEL3_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x:  4.5 * TILE, y:  7.5 * TILE, picked: false },  // west pocket (r7 c4)
  { name: 'Elixir', type: 'potion', heals: 50, price: 80, x: 10.5 * TILE, y:  7.5 * TILE, picked: false },  // east pocket (r7 c10)
];

// The Sealed Room (SLUICE_SECRET_MAP) holds no pickups — nothing in it is
// meant to leave. Empty array kept so MAP_METADATA's items field stays real.
const SLUICE_SECRET_ITEMS = [];

// ─── Sluice level 3 chest ─────────────────────────────────────────────────────
// South chamber centre (r10 c7). Opened by pressing Space when adjacent.
const SLUICE_LEVEL3_CHEST = {
  x:       7.5 * TILE,
  y:      10.5 * TILE,
  opened: false,
  item:   { name: 'Void Shard', type: 'accessory', bonus: 5, price: 180 },
};

// ─── Dungeon chest ────────────────────────────────────────────────────────────
// Placed in the far corner of the upper room (col 10, row 1). Opened by pressing
// Space when adjacent — not auto-picked like floor items.
const DUNGEON_CHEST = {
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
  x:       0.5 * TILE,
  y:       7.5 * TILE,
  opened: false,
  item:   { name: 'Iron Targe', type: 'shield', bonus: 8, price: 180 },
};

// ─── Sluice level-3 deep chest ────────────────────────────────────────────────
// Hidden behind the FALSE_WALL at row 11, col 10. Located in the secret annex
// (cols 10-11, rows 9-11). Opened by pressing Space when adjacent.
const SLUICE_DEEP_CHEST = {
  x:      11.5 * TILE,
  y:      10.5 * TILE,
  opened: false,
  item:   { name: 'Fen Mask', type: 'accessory', bonus: 5, price: 200 },
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
  name: 'Mulholland', hp: 140, maxHp: 140, atk: 28, def: 8, spd: 4,
  xp: 180, goldMin: 30, goldMax: 60,
};

const DEN_WRAITH_TEMPLATE = { name: 'Den Wraith', hp: 42, maxHp: 42, atk: 19, def: 2, spd: 13, xp: 70, goldMin: 0, goldMax: 0, curseChance: 0.30 };
window.DEN_WRAITH_TEMPLATE = DEN_WRAITH_TEMPLATE;

// ─── Sailor Brawler (Kolm — Drenwick Inn, Dayoff only) ───────────────────────
// Heavy-hitting brawler; high ATK, moderate HP; no gold drop (prize is the stake).
const SAILOR_BRAWLER_TEMPLATE = { name: 'Kolm', hp: 55, maxHp: 55, atk: 26, def: 4, spd: 7, xp: 45, goldMin: 0, goldMax: 0 };
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
  { name: 'Pale Drowned', hp: 30, maxHp: 30, atk: 11, def: 2, spd: 10, xp: 35, goldMin:  6, goldMax: 14 },
  // Silt Hag — bog-curse made flesh; ponderous and devastating, hard to kill
  { name: 'Silt Hag',     hp: 45, maxHp: 45, atk: 18, def: 5, spd:  3, xp: 50, goldMin: 10, goldMax: 20 },
];

// ─── Mirethyst's Vault — floor items ─────────────────────────────────────────
// Scattered among the submerged chambers.
const MIRE_VAULT_ITEMS = [
  // Potion in the left alcove of the mid-hall (col 1, row 6)
  { name: 'Potion',     type: 'potion', heals: 20,                price: 30, x:  1.5 * TILE, y:  6.5 * TILE, picked: false },
  // Ember Root in the right alcove of the lower mid-hall (col 13, row 8)
  // Heals but leaves legs heavy — an old rareborn stimulant with a bog side-effect
  { name: 'Ember Root', type: 'potion', heals: 15, causesMuddied: true, price: 20, x: 13.5 * TILE, y:  8.5 * TILE, picked: false },
];

// ─── Mirethyst's Vault — (no chest) ───────────────────────────────────────────
// The Mirestone Blade chest was removed. The mid-hall centre (col 7, row 6) is
// held for a future secret crypt entrance. Mirethyst gives the Fen Cowl through
// her own dialogue now (npcs.js), as thanks for the player keeping her company.

// ─── MAP_METADATA ───────────────────────────────────────────────────────────
// The single source of truth for per-map bookkeeping. Adding a new map should
// mean: define its map array (+ _ITEMS array, even if empty) in maps.js, then
// add ONE entry here -- not touching locationName(), currentItemList(), the
// combat.js pool ladder, and MAP_REGISTRY separately, the way every map
// before this table required.
//
// Keyed EXACTLY like MAP_REGISTRY (maps.js) -- same property names, same
// set of keys -- so the two can be cross-validated (see
// validateGameData()'s new "MAP_METADATA" section) and so
// mapRegistryId(activeMap) (maps.js), which returns a MAP_REGISTRY property
// key, can be used directly as MAP_METADATA[mapRegistryId(activeMap)].
//
// Field `id` is normalised to match the property key exactly (e.g.
// DRENWICK_CIVIC_MAP.id === 'DRENWICK_CIVIC_MAP'), which is NOT always true
// of MAP_REGISTRY's own `.id` field (a handful of older Drenwick entries use
// a separate lowercase id there, e.g. 'drenwick_civic') -- that field is
// only ever read by validation.js for presence/duplicate checks, never for
// lookup, so normalising it here is a safe cleanup, not a behaviour change.
//
// `displayName` is the CANONICAL name -- what locationName() actually shows
// the player -- which for a handful of entries differs from MAP_REGISTRY's
// older `.label` (e.g. NORTH_BASIN_S_MAP's label is the stale "North Basin";
// DRENWICK_OFFICE_MAP's label is "Drenwick — Office" but the player has
// always seen "Drenwick — IJC District Office"). MAP_REGISTRY.label is left
// untouched (nothing reads it for display -- see the report), so this isn't
// a behaviour change either, just a second source finally agreeing with the
// first.
//
// `encounterPool`/`allowRandomEncounters` are populated for EVERY map, for
// documentation and validation, even though combat.js's actual pool
// selection still branches on inDungeon/dungeonFloor/inSluice/inMireVault
// state for dungeon floors, sluice floors, and the vault -- see combat.js's
// comment at the top of startCombat() for why that state-flag branching
// stays in place rather than being replaced by a metadata read. Only the
// plain-activeMap tail of that ladder (farMap/thornmereMap/northBasinMap/
// the MAP-vs-default split) was migrated to read MAP_METADATA directly.
const MAP_METADATA = {
  // ── Overworld (Verdant Vale / Eastern Reaches / Thornmere fen) ────────────
  MAP: {
    id: 'MAP', map: MAP, displayName: 'Verdant Vale', region: 'Verdant Vale',
    type: 'outdoor', items: WORLD_ITEMS, encounterPool: EARLY_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
  },
  MEADOW_MAP: {
    id: 'MEADOW_MAP', map: MEADOW_MAP, displayName: 'Hidden Meadow', region: 'Verdant Vale',
    type: 'outdoor', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
    notes: 'Secret clearing behind the vale’s NW tree nook. Deliberately encounter-free (hard gate in isEncounterEligibleTile, movement.js) — the relocated Briar Warden is its only danger.',
  },
  MAP2: {
    id: 'MAP2', map: MAP2, displayName: 'Eastern Reaches', region: 'Eastern Reaches',
    type: 'outdoor', items: MAP2_ITEMS, encounterPool: ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
  },
  LORRA_HOUSE_MAP: {
    id: 'LORRA_HOUSE_MAP', map: LORRA_HOUSE_MAP, displayName: "Lorra's Farmhouse", region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  MAREN_POST_MAP: {
    id: 'MAREN_POST_MAP', map: MAREN_POST_MAP, displayName: 'Guard Post', region: 'Thornmere',
    type: 'interior', items: [], encounterPool: null,
    allowRandomEncounters: false, allowSave: true,
  },
  MAP3: {
    id: 'MAP3', map: MAP3, displayName: 'Thornmere Fen', region: 'Thornmere',
    type: 'outdoor', items: MAP3_ITEMS, encounterPool: FAR_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
  },
  MAP4: {
    id: 'MAP4', map: MAP4, displayName: 'Thornmere', region: 'Thornmere',
    type: 'outdoor', items: MAP4_ITEMS, encounterPool: THORNMERE_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
  },
  MAP5: {
    id: 'MAP5', map: MAP5, displayName: 'Thornmere Shallows', region: 'Thornmere',
    type: 'outdoor', items: MAP5_ITEMS, encounterPool: THORNMERE_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
  },
  MAP3_N1: {
    id: 'MAP3_N1', map: MAP3_N1, displayName: 'Northern Fen', region: 'Thornmere',
    type: 'outdoor', items: MAP3_N1_ITEMS, encounterPool: FAR_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
  },
  RODDON_WAY_MAP: {
    id: 'RODDON_WAY_MAP', map: RODDON_WAY_MAP, displayName: 'Roddon Way', region: 'Thornmere',
    type: 'outdoor', items: RODDON_WAY_ITEMS, encounterPool: FAR_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'A single dead-end fen map off MAP3_N1’s west edge (an old creek-bed ridge, RODDON_SILT) -- no other neighbours. Reuses MAP3_N1’s own encounter pool; no new enemies. Ordinary regional geography, not connected to the North Basin drought story.',
  },
  MAP3_N2: {
    id: 'MAP3_N2', map: MAP3_N2, displayName: 'Drenwick', region: 'Drenwick',
    type: 'outdoor', items: MAP3_N2_ITEMS, encounterPool: FAR_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'Outdoor approach to Drenwick, distinct from DRENWICK_CIVIC_MAP (the town square) -- both are called "Drenwick" to the player, matching pre-existing locationName() behaviour, not introduced here.',
  },

  // ── The North Basin ────────────────────────────────────────────────────────
  NORTH_BASIN_S_MAP: {
    id: 'NORTH_BASIN_S_MAP', map: NORTH_BASIN_S_MAP, displayName: 'North Basin \u2014 South Approach', region: 'North Basin',
    type: 'outdoor', items: NORTH_BASIN_S_ITEMS, encounterPool: NORTH_BASIN_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'The basin entry. It has no GRASS, but its REEDS are encounter-eligible all the same (see tiles.js TILE_PROPERTIES), so it does roll random encounters \u2014 now from the basin pool (NORTH_BASIN_ENEMY_TEMPLATES, the same gentle creatures as the Silt Flats) instead of the generic ENEMY_TEMPLATES fallback it used when this was left encounterPool: null. The maintained road (PATH, col 12) and the water stay safe; you meet things by cutting through the reeds.',
  },
  NORTH_BASIN_C_MAP: {
    id: 'NORTH_BASIN_C_MAP', map: NORTH_BASIN_C_MAP, displayName: 'North Basin \u2014 Reservoir', region: 'North Basin',
    type: 'outdoor', items: NORTH_BASIN_C_ITEMS, encounterPool: NORTH_BASIN_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'The receding reservoir. Like the South Approach it has no GRASS but its REEDS are encounter-eligible, so it rolls random encounters \u2014 now from the basin pool (NORTH_BASIN_ENEMY_TEMPLATES) instead of the generic ENEMY_TEMPLATES fallback. Open water and the exposed BASIN_MUD bed stay safe; encounters lurk in the reed fringe of the receding shoreline.',
  },
  NORTH_BASIN_SW_MAP: {
    id: 'NORTH_BASIN_SW_MAP', map: NORTH_BASIN_SW_MAP, displayName: 'North Basin \u2014 Silt Flats', region: 'North Basin',
    type: 'outdoor', items: NORTH_BASIN_SW_ITEMS, encounterPool: NORTH_BASIN_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
  },
  NORTH_BASIN_W_MAP: {
    id: 'NORTH_BASIN_W_MAP', map: NORTH_BASIN_W_MAP, displayName: 'North Basin \u2014 West Shore', region: 'North Basin',
    type: 'outdoor', items: NORTH_BASIN_W_ITEMS, encounterPool: NORTH_BASIN_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'West bank of the reservoir, north of the Silt Flats. Shares the Silt Flats\u2019 enemy pool by design (user request), not a separate harsher tier. South edge is an open EDGE_TRANSITIONS crossing (cols 1-10) to the Silt Flats; north edge is now an open crossing (cols 1-10) to the Upper Reach; west is impassable border until that neighbour is built.',
  },
  NORTH_BASIN_NW_MAP: {
    id: 'NORTH_BASIN_NW_MAP', map: NORTH_BASIN_NW_MAP, displayName: 'North Basin \u2014 Upper Reach', region: 'North Basin',
    type: 'outdoor', items: NORTH_BASIN_NW_ITEMS, encounterPool: UPPER_REACH_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'The drained NW arm \u2014 exposed bed border to border. Once deliberately silent; now the oldest-exposed ground has its own encounters (UPPER_REACH_ENEMY_TEMPLATES): two stranded basin creatures shared with the Silt Flats, and two new tough ones (Dust-Drowned, Marrow Hulk) reflecting how long this arm has been dry and wrong. Only BASIN_MUD rolls (isEncounterEligibleTile special-cases this map so other maps\u2019 mud stays safe). No NPCs. "No safe haven" means no town, bed, healing, or shelter -- allowSave is still true like any ordinary outdoor map (see canSaveHere(), save.js); only the two interiors it leads to block saving. Holds the standing doorframe (CHAMBER_DOOR \u2192 BASIN_CHAMBER_MAP) and the drought-exposed stairhead (SUNKEN_STAIR \u2192 SUNKEN_GALLERY_MAP).',
  },
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

  // ── Northern road (Pale Sentry contract territory) ────────────────────────
  MAP_N1: {
    id: 'MAP_N1', map: MAP_N1, displayName: 'Northern Road', region: 'Thornmere',
    type: 'outdoor', items: MAP_N1_ITEMS, encounterPool: FAR_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
  },
  MAP_N2: {
    id: 'MAP_N2', map: MAP_N2, displayName: 'Blocked Path', region: 'Thornmere',
    type: 'outdoor', items: MAP_N2_ITEMS, encounterPool: FAR_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'The Pale Sentry contract fight (a specific scripted encounter, checked before any pool selection in startCombat()) also lives on this map while active -- not represented in encounterPool, which only covers the random-roll fallback.',
  },

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
    type: 'interior', items: [], encounterPool: null,
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
    type: 'dungeon', items: SLUICE_ITEMS, encounterPool: SLUICE_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: true,
    notes: 'sluiceFloor 1. Pool selection at runtime still branches on inSluice (combat.js), not this metadata entry.',
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
// in a loop rather than as 24 near-identical literals. window[id] is the same
// array MAP_REGISTRY holds, so the two tables agree by reference (validation
// requires MAP_METADATA[id].map === MAP_REGISTRY[id].map).
for (const cell of window.SUNKEN_GALLERY_GRID_CELLS) {
  const id = 'SUNKEN_GALLERY_' + cell;
  MAP_METADATA[id] = {
    id: id, map: window[id], displayName: 'Sunken Gallery', region: 'North Basin',
    type: 'dungeon', items: [], encounterPool: SUNKEN_GALLERY_ENEMY_TEMPLATES,
    allowRandomEncounters: true, allowSave: false,
    notes: 'One of the 24 blank rooms of the Sunken Gallery 5×5 grid (maps.js). GALLERY_FLOOR/GALLERY_WALL only, no other elements yet. Joined to its neighbours by EDGE_TRANSITIONS; shares the entrance hall’s encounter pool and allowSave: false.',
  };
}
window.MAP_METADATA = MAP_METADATA;
