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
   'The square, the office. Familiar enough.'],
  ['Yesterday was your day off.',
   'Today, you\u2019re due back at the office \u2014 same as every other working day.'],
];
dialogue.open  = true;
dialogue.page  = 0;
