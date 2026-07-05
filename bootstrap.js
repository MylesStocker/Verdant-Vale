'use strict';

// bootstrap.js — new-game startup state. Must load after every other split-
// out file (player, dialogue, maps, validateGameData, etc. must already
// exist) and before interactions.js, matching main.js's original tail.

// ─── New-game startup state ───────────────────────────────────────────────────
// Do not auto-load saves on startup; loading is explicit (Load Game in the menu).
// Always begin from the initial game state — the player's house.
if (debugMode) validateGameData();  // non-blocking; only runs when debug is on
inTown              = true;
currentTownId       = 'calwick';
townBuilding        = 'house';
currentHouseId      = 'player_house';
houseSourceMap      = WEST_TOWN_MAP;       // house door is in west town
houseSourceBuilding = 'west';
houseReturnPos      = { x: 2.5 * TILE, y: 12.5 * TILE }; // col 2, row 11 door exit
activeMap           = HOUSE_INTERIOR_MAP;
player.x            = 7.5 * TILE;
player.y            = 9.5 * TILE;
player.facing       = 'up';
// Opening — atmospheric start; does not imply a new posting (player has lived
// in Calwick for several years). Gives brief gameplay reminder only.
dialogue.name  = '';
dialogue.pages = [
  ['Morning light comes through the east window the same as always.',
   'Three years in Calwick.',
   'The canal, the square, the office. Familiar enough.'],
  ['There\u2019s a posting waiting at the office.',
   'Might as well see what it is.',
   'Open the menu with Escape if you need it \u2014 Items, Notebook, Save.'],
];
dialogue.open  = true;
dialogue.page  = 0;
