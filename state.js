'use strict';

// state.js — core mutable game state: canvas/context setup, world-location
// flags, status effects, player stats, menu/debug-menu state, dialogue and
// overlay-panel state, and the frame tick counter. Split out of main.js.


// ─── Setup ────────────────────────────────────────────────────────────────────
const canvas  = document.getElementById('game');
const ctx     = canvas.getContext('2d');
const titleEl = document.getElementById('title');
ctx.imageSmoothingEnabled = false;
canvas.focus();

// ─── Constants ────────────────────────────────────────────────────────────────
const COLS        = 16;   // tiles wide
const ROWS        = 15;   // tiles tall
const MS_PER_FRAME = 1000 / 60;

// ─── World state ──────────────────────────────────────────────────────────────
let activeMap    = MAP;
let inDungeon    = false;
let dungeonFloor = 1;   // 1 = first floor, 2 = second floor (only when inDungeon)
let inTown       = false;
let currentTownId    = null;  // set while inTown is true
let townBuilding     = null;  // null | 'inn' | 'office' | 'east' | 'west' | 'house'
let currentHouseId      = null;  // set while townBuilding === 'house'
let houseSourceMap      = null;  // activeMap before entering house
let houseSourceBuilding = null;  // townBuilding before entering house
let houseReturnPos      = { x: 0, y: 0 }; // world position to restore on exit
let day              = 1;    // incremented whenever the player rests
const ACCORD_DAY     = 133;  // the annual celebration of the Accord
function isDayOff() { return day % 5 === 0; }
function isClosedToday(building) {
  if (building === 'office') return isDayOff();
  if (building === 'school') return isDayOff();          // both towns' schools (Calwick west + Drenwick)
  if (building === 'provision_store') return isDayOff(); // Drenwick's shop; the inn/tavern stay open
  return false;
}
let travellerPresent = false; // re-rolled each time the player enters town
let inSluice             = false; // true when inside East Sluice
let inLorraHouse         = false; // true when inside Lorra's farmhouse on MAP2
let inAbandonedFarmhouse = false; // true inside the vacant eastern farmhouse on MAP2
let inMarenPost          = false; // true when inside Maren's guard post on MAP
let inDrenwrickPost      = false; // true when inside the Drenwick approach guard post (MAP3_N2)
let inBridgePost         = false; // true when inside the imperial toll bridge checkpoint (MAP3_N2)
let bridge_entry_direction = null; // 'south' (entered from south, heading north) | 'north' (entered from north, heading south)
let bridge_toll_paid       = false; // set true once the soldier is paid; cleared on exit
let inSmugglerFort       = false; // true when inside the smugglers' fort (MAP3_N1)
let inMireVault          = false; // true when inside Mirethyst's Vault (MAP3_N1)
let inTakomo             = false; // true when inside Takomo's Chamber (Drenwick secret)
let inFenBrewery         = false; // true when inside Wend's fen brewery (MAP3_N1)
let inHamletInterior     = false; // true when inside the Falls hamlet interior (MAP3_N1)
let inDungeonEntrance    = false; // true when inside the South Ruins Entrance Hall (top floor, between the overworld and dungeon floor 1 — no encounters, kept separate from inDungeon/dungeonFloor on purpose so it never picks up a combat-encounter pool)
let inBasinChamber       = false; // true when inside the unmarked chamber off the Upper Reach (North Basin NW) — no encounters, no save; own flag per the entrance-area rule (never reuse inDungeon etc.)
let inSunkenGallery      = false; // true when inside the Sunken Gallery (drought-exposed structure under the Upper Reach) — has its own encounter pool via MAP_METADATA, kept off inDungeon/dungeonFloor so it never inherits a dungeon-floor pool
let sluiceFloor          = 1;    // 1 = Level 1, 2 = Level 2
let debugMode            = false; // when true, random encounters are suppressed
// When true (default), a combat defeat relocates the player to their own bed
// in the Calwick player house ("someone carried you home") instead of waking
// them on the spot where they fell. Toggleable from the debug menu.
let defeatWakeAtHome     = true;
// DEBUG-ONLY visual prototype toggle (never saved): when true, a placed
// 'overworld' map (REGIONAL_LAYOUT) renders through the continuous scrolling-
// camera terrain path (render.js) instead of the legacy single-map draw. Has no
// effect off a placed overworld map, and never touches movement/collision/
// transitions/saves/content. Session-only, like debugMode/defeatWakeAtHome.
//
// Continuous regional presentation is the PRODUCTION DEFAULT (no debug/toggle needed).
// This is the one session-only EMERGENCY/DEBUG fallback: ON forces coherent legacy
// single-screen regional behaviour (for comparison/recovery); OFF (default) is the
// production continuous overworld. Never saved/restored; see continuousWorldViewActive().
let forceLegacyRegionalView = false;
let dilemma_voss         = null; // null | 'report' | 'protect' | 'abstain'

// ─── Status effects ───────────────────────────────────────────────────────────
let statusEffects = [];  // array of string ids, e.g. ['poison']

function hasStatusEffect(id)    { return statusEffects.includes(id); }
function addStatusEffect(id)    { if (!hasStatusEffect(id)) statusEffects.push(id); }
function removeStatusEffect(id) { statusEffects = statusEffects.filter(s => s !== id); }
function triggerPoison()        { addStatusEffect('poison'); }
function triggerMuddied()       { addStatusEffect('muddied'); }
// Slither — randomizes player SPD each combat turn; stored between calls so the HUD is stable.
let slitherSpd = 1;
function rollSlitherSpd()  { return Math.floor(Math.random() * 20) + 1; }
function triggerSlither()  { addStatusEffect('slither'); slitherSpd = rollSlitherSpd(); }
function triggerCursed()   { addStatusEffect('cursed'); }
// Burn — combat-only damage-over-time. Deals a random 0..20 HP each turn the
// player takes while burning, and is cleared when combat ends (see endCombat).
// Because it can only exist during a fight (which blocks saving), it never
// needs to persist across a save/load.
function triggerBurn()     { addStatusEffect('burn'); }
window.triggerPoison   = triggerPoison;
window.triggerMuddied  = triggerMuddied;
window.triggerCursed   = triggerCursed;
window.triggerBurn     = triggerBurn;

// ─── World notification toast ─────────────────────────────────────────────────
// Short auto-fading overlay for passive effects (trip, curse flare-ups, etc.)
// Timer is decremented in update(); rendering happens at the end of render().
let worldToast = '';
let worldToastTimer = 0;
function showWorldToast(text) { worldToast = text; worldToastTimer = 150; }

// ─── Player stats ─────────────────────────────────────────────────────────────
const stats = {
  name:   'L\u00e9ly',
  hp:     24,
  maxHp:  30,
  atk:    8,
  def:    2,
  spd:    7,
  xp:     0,
  level:  1,
  gold:   0,
  weapon:    null,  // { name, type:'weapon',    bonus } or null
  armor:     null,  // { name, type:'armor',     bonus } or null
  shield:    null,  // { name, type:'shield',    bonus } or null
  accessory: null,  // { name, type:'accessory', bonus } or null
  items:     [],    // starting kit is now issued by Aldric (Calwick office)
                     // in exchange for the requisition slip the Supervisor
                     // hands out with the first assignment — see quests.js's
                     // equipment_ticket_ready and interactions.js.
};

function xpForNextLevel() {
  if (stats.level >= MAX_LEVEL) return null;
  return XP_THRESHOLDS[stats.level]; // e.g. level 1 → index 1 → 100
}

// Call after awarding XP; pushes level-up messages into the provided array.
// Max HP is a flat +10 per level. ATK and DEF each roll an independent 1-3.
// SPD rises only some of the time (about half of level-ups), so it climbs more
// slowly and unevenly than the other stats. The message reports whatever
// actually rolled, and only mentions SPD on the levels it went up.
function checkLevelUp(msgs) {
  while (stats.level < MAX_LEVEL && stats.xp >= XP_THRESHOLDS[stats.level]) {
    stats.level++;
    const atkGain = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
    const defGain = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
    const spdGain = Math.random() < 0.5 ? 1 : 0;        // speed only goes up sometimes
    stats.maxHp += 10;
    stats.hp     = Math.min(stats.hp + 10, stats.maxHp);
    stats.atk   += atkGain;
    stats.def   += defGain;
    stats.spd   += spdGain;
    msgs.push(`*** LEVEL UP!  Now Lv. ${stats.level}! ***`);
    let gains = `Max HP +10  \u2022  ATK +${atkGain}  \u2022  DEF +${defGain}`;
    if (spdGain) gains += `  \u2022  SPD +${spdGain}`;
    msgs.push(gains);
  }
}

// ─── Menu state ───────────────────────────────────────────────────────────────
const menu = {
  open:         false,
  itemCursor:   0,
  scrollOffset: 0,
  screen:       'main',  // 'main' | 'saveConfirm' | 'loadConfirm' | 'notebook'
  saveCursor:   0,        // 0 = Yes, 1 = No
  saveMessage:  0,        // frame countdown for "Game Saved" banner
  saveBlockedMessage: 0,  // frame countdown for the "won't hold" banner (maps with MAP_METADATA allowSave: false — see input.js's save-confirm guard)
  loadCursor:   0,        // 0 = Yes, 1 = No
  loadMessage:  0,        // frame countdown for load result banner
  loadStatus:     null,     // 'loaded' | 'nosave' — set alongside loadMessage
  notebookOffset: 0,        // scroll offset for notebook screen
};

// ─── Debug menu state ─────────────────────────────────────────────────────────
// Rows: 0 No Enemies, 1 Poison, 2 Muddied, 3 Slither, 4 Heal Full (action),
// 5 Advance Day +1 (action), 6 Warp to... (opens warpMenu), 7 Validate Data
// (action, runs validateGameData()), 8 Home on Defeat (toggle), 9 Continuous
// View (toggle). See render-ui.js's drawDebugMenu() for the row list and
// input.js for handling.
const debugMenu = {
  open:   false,
  cursor: 0,
};
const DEBUG_MENU_ROW_COUNT = 10;

// ─── Debug map inspector state ─────────────────────────────────────────────────
// A lightweight, always-updating HUD overlay (not a modal menu — doesn't
// block movement/input) showing current map/tile/encounter info for
// testing. Toggled with the 'I' key; see render-ui.js's
// drawDebugInspector() and toggleDebugInspector() below.
const debugInspector = {
  open: false,
};

// ─── Debug warp menu state ─────────────────────────────────────────────────────
// A modal screen (reached via the debug menu's "Warp to..." row) for jumping
// straight to any LOGICAL destination (not a bare map id: a shared grid backs
// many houses/apartments, and non-outdoor maps need a runtime mode). Two modes:
// 'list' (pick a destination, scrollable, outdoor-first) then 'coord' (nudge the
// target tile with arrow keys before confirming). See render-ui.js's
// drawWarpMenu(), input.js's warpMenu handling, and debug-warp.js's logical
// destination catalog + debugWarpToDestination().
const warpMenu = {
  open:         false,
  mode:         'list', // 'list' | 'coord'
  cursor:       0,
  scrollOffset: 0,
  destinations: [],     // populated from getDebugWarpDestinations() when opened
  targetDestId: null,   // set once a destination is chosen, for 'coord' mode
  targetCol:    8,
  targetRow:    7,
};

// Returns a grouped view of stats.items — does not modify the underlying array.
// Each entry: { name, item (one representative instance), count }
// Normal inventory: everything the player can equip, use, or sell. Key items
// (special quest items such as the Dispatch Letter) live in stats.items so they
// save/load and appear in the Special Items notebook, but must never surface as
// ordinary inventory — not equippable, not usable in combat, not sellable.
function inventoryItems() {
  return stats.items.filter(it => !it.keyItem);
}

function groupItems() {
  const groups = [];
  const index  = new Map();
  for (const item of inventoryItems()) {
    if (index.has(item.name)) {
      groups[index.get(item.name)].count++;
    } else {
      index.set(item.name, groups.length);
      groups.push({ name: item.name, item, count: 1 });
    }
  }
  return groups;
}

function toggleMenu() {
  if (dialogue.open || shop.open || continentMap.open || accordPanel.open) return;
  menu.open = !menu.open;
  if (menu.open) {
    debugMenu.open    = false;
    menu.itemCursor   = 0;
    menu.scrollOffset = 0;
    menu.screen       = 'main';
    menu.saveCursor   = 0;
  }
}

function toggleDebugMenu() {
  if (dialogue.open || shop.open || choice.open || combat.active) return;
  debugMenu.open = !debugMenu.open;
  if (debugMenu.open) {
    menu.open      = false;
    debugMenu.cursor = 0;
  }
}

// Toggles the debug map inspector overlay (see debugInspector above). Unlike
// the debug menu, this never blocks or is blocked by anything — it's a
// read-only HUD overlay, not a modal screen, so it's safe to flip on/off
// regardless of what else is open.
function toggleDebugInspector() {
  debugInspector.open = !debugInspector.open;
}

// ─── Dialogue state ───────────────────────────────────────────────────────────
const dialogue = { open: false, page: 0, pages: [], name: '', triggerEncounterId: null, callbacks: null };

// ─── Continent map overlay state ──────────────────────────────────────────────
// Full-screen inspection panel for the wall map in the Calwick Empire office.
const continentMap = { open: false };

// ─── Accord panel overlay state ───────────────────────────────────────────────
// Near-full-screen reading panel for the Accord of Threads.
// pages: array of string[] (same shape as dialogue.pages) — set before opening.
// page: current page index.
// Near-full-screen parchment reading panel. Originally the Accord of Threads
// reader; now a general imperial-document reader — set `title` before opening
// (falls back to the Accord title if left blank, preserving old behaviour).
const accordPanel = { open: false, page: 0, pages: [], title: '' };


// ─── Frame counter ────────────────────────────────────────────────────────────
let tick = 0; // global frame counter used for water animation
