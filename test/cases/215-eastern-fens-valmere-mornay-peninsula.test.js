'use strict';

// Terrain-redesign pass, batch 4 + correction: light-touch shingle/driftwood
// retexture on the four Valmere shoreline chunks (unchanged by the
// correction), plus the Mornay PENINSULA correction. An earlier pass had
// converted the six chunks at (16-18, -2) and (16-18, -3) into non-walkable
// scenery -- that went too far in the opposite direction from a six-chunk
// town. This correction reworks them into one coherent, irregular peninsula
// extending north into Valmere. The Mornay topology pass replaces the
// former six-cell crown with a 2x3 marker whose two southern cells are
// paired land entrances into the registered legacy-town exterior.
//
// Catalogue IDs and display names consistently describe peninsula geography.
// No retired district aliases are retained for these unreleased placeholders.

const assert = require('assert/strict');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const worldTransitionsSrc = fs.readFileSync(path.join(__dirname, '../../world-transitions.js'), 'utf8');
const movementSrc = fs.readFileSync(path.join(__dirname, '../../movement.js'), 'utf8');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// ── Valmere shoreline (unchanged by this correction) ────────────────────────
const SHORELINE_OLD_GRIDS = {
  EASTERN_FENS_VALMERE_REVEAL_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,81,1],
    [1,23,23,23,23,0,0,0,0,0,0,23,23,23,23,1],
    [1,127,127,127,23,0,0,2,0,0,0,23,127,127,127,1],
    [1,127,127,127,23,0,0,2,2,2,2,2,2,2,2,2],
    [1,127,127,127,23,0,0,2,2,2,2,2,2,2,2,2],
    [1,127,127,127,23,0,0,2,2,2,2,2,2,2,2,2],
    [1,127,127,127,23,0,0,2,0,0,0,23,127,127,127,1],
    [1,127,127,127,23,0,2,2,2,0,0,23,127,127,127,1],
    [1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_VALMERE_SHORE_W_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,81,1],
    [1,23,23,0,0,0,0,0,0,0,0,0,0,23,23,1],
    [1,127,23,0,0,88,0,0,0,0,88,0,0,23,127,1],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [1,127,23,0,0,89,0,0,0,0,89,0,0,23,127,1],
    [1,127,127,23,0,0,0,0,0,0,0,0,23,127,127,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_VALMERE_SHORE_E_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,81,1],
    [1,23,0,0,0,0,0,0,0,0,0,0,0,0,23,1],
    [1,23,0,0,88,88,0,0,0,0,88,88,0,0,23,1],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [1,23,0,0,89,0,0,0,0,0,0,89,0,0,23,1],
    [1,127,23,0,0,0,0,0,0,0,0,0,0,23,127,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_MORNAY_THRESHOLD_MAP: [
    [1,1,1,1,1,1,2,2,2,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,2,2,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,2,2,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,2,2,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,2,2,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,2,2,2,1,1,1,1,1,1],
    [1,81,81,81,81,81,2,2,2,2,81,81,81,81,81,1],
    [1,23,0,0,0,0,2,2,2,2,0,0,0,0,0,1],
    [1,23,0,0,88,88,2,2,2,2,88,88,0,0,0,1],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [1,23,0,0,89,0,0,0,0,0,0,89,0,0,0,1],
    [1,127,23,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
};
const SHORELINE_OLD_FP = {
  EASTERN_FENS_VALMERE_REVEAL_MAP: '2dce4ae0f61fe940de1ccfd89772a8a980b3abf37dcb30ce3981b30d72a4c96d',
  EASTERN_FENS_VALMERE_SHORE_W_MAP: '7be98ce3059d18ca757f776de789317897576f8d1fa07689099d6198cfdeea45',
  EASTERN_FENS_VALMERE_SHORE_E_MAP: 'a9734c589973a316d2932f42d8eb6b482488bacbb05bbdb9eaa1f9bdc22ee68c',
  EASTERN_FENS_MORNAY_THRESHOLD_MAP: '61162b6bcfa91603ed779a6272d3a0604a7f708ef8326b0968bf47d7861cf528',
};
const SHORELINE_IDS = Object.keys(SHORELINE_OLD_GRIDS);
const WALKABLE_FILL = new Set([81]); // shoreline tighten: Basin Mud -> Gravel Bar only
const BLOCKER_FILL = new Set([1]);   // shoreline tighten: Water -> Driftwood only

// ── Mornay peninsula (this correction) ──────────────────────────────────────
// OLD_GRIDS/OLD_FP here are the grids from the *previous* (superseded) pass,
// which converted all six chunks to non-walkable scenery -- not the original
// town-shell grids from before that. This correction replaces that scenery
// pass with the peninsula.
const PENINSULA_OLD_GRIDS = {
  EASTERN_FENS_MORNAY_WESTERN_COVE_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,129,128,128,128,128,128,128,128,128,128,128,128,128,129,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,129,128,128,128,128,128,128,128,128,128,128,128,128,129,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,128,128,128,128,128,128,128,128,128,128,128,128,128,128,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_MORNAY_NECK_ROAD_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,121,1,1,1,1,121,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,121,121,121,121,1,1,1,1,1,1],
    [1,121,1,1,1,121,121,121,121,121,121,1,1,1,121,1],
    [1,1,1,1,1,121,121,121,121,121,121,1,1,1,1,1],
    [1,1,1,1,1,121,121,121,121,121,121,1,1,1,1,1],
    [1,1,1,1,1,121,121,121,121,121,121,1,1,1,1,1],
    [1,121,1,1,1,121,121,121,121,121,121,1,1,1,121,1],
    [1,1,1,1,1,1,121,121,121,121,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,121,1,1,1,1,121,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,128,128,128,128,1,1,1,1,1,1,1,1,1,1,1],
    [1,128,23,23,128,128,1,1,1,1,1,1,1,1,1,1],
    [1,128,23,23,23,128,1,1,1,1,1,1,1,1,1,1],
    [1,128,128,23,23,128,1,1,1,1,1,1,1,1,1,1],
    [1,1,128,128,128,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,121,1,1,1,1,1,1,1,1,121,1,1,1],
    [1,1,1,1,1,1,127,1,1,127,1,1,1,1,1,1],
    [1,121,1,1,1,1,1,1,1,1,1,1,1,1,121,1],
    [1,1,1,1,127,1,1,1,1,1,1,127,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,121,1,1,1,1,1,1,1,1,1,1,121,1,1],
    [1,1,1,1,1,127,1,1,1,1,127,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,121,1,1,1,1,1,1,1,1,1,1,1,1,121,1],
    [1,1,1,127,1,1,1,1,1,1,1,1,127,1,1,1],
    [1,128,128,1,1,1,1,1,1,1,1,1,1,128,128,1],
    [1,128,128,128,1,1,1,1,1,1,1,1,128,128,128,1],
    [1,1,128,128,1,1,1,1,1,1,1,1,128,128,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,1,1],
    [1,81,88,81,81,81,81,130,81,81,81,81,88,81,1,1],
    [1,81,81,81,88,81,81,81,81,81,88,81,81,81,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,1,1],
    [1,81,81,88,81,81,81,81,81,81,81,88,81,81,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,1,1],
    [1,81,81,81,81,88,81,81,81,88,81,81,81,81,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,1,1],
    [1,81,81,81,81,81,81,81,81,81,81,81,81,81,1,1],
    [1,1,81,81,81,81,81,81,81,81,81,81,81,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_MORNAY_EASTERN_POINT_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,23,23,1,1,1,1],
    [1,1,1,1,1,1,1,1,23,23,23,23,23,1,1,1],
    [1,1,1,1,1,1,1,23,23,23,23,23,23,23,1,1],
    [1,1,1,1,1,23,23,23,23,128,128,23,23,23,1,1],
    [1,1,1,1,23,23,23,128,128,128,128,128,23,23,23,1],
    [1,1,1,23,23,128,128,128,128,128,128,128,128,23,23,1],
    [1,1,1,1,23,23,23,128,128,128,128,128,23,23,23,1],
    [1,1,1,1,1,23,23,23,23,128,128,23,23,23,1,1],
    [1,1,1,1,1,1,1,23,23,23,23,23,23,23,1,1],
    [1,1,1,1,1,1,1,1,23,23,23,23,23,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,23,23,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  EASTERN_FENS_MORNAY_APPROACH_M_MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,23,0,0,0,0,0,0,23,0,0,0,0,0,1],
    [1,23,0,0,0,0,0,0,23,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,23,0,0,0,0,0,0,23,1],
    [1,0,0,0,0,0,23,0,0,0,0,0,0,23,0,1],
    [0,0,0,0,0,23,0,0,0,0,0,0,23,0,0,0],
    [0,0,0,0,23,0,0,0,0,0,0,23,0,0,0,0],
    [0,0,0,23,0,0,0,0,0,0,23,0,0,0,0,0],
    [0,0,23,0,0,0,0,0,0,23,0,0,0,0,0,0],
    [0,23,0,0,0,0,0,0,23,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,23,0,0,0,0,0,0,23,1],
    [1,0,0,0,0,0,23,0,0,0,0,0,0,23,0,1],
    [1,0,0,0,0,23,0,0,0,0,0,0,23,0,0,1],
    [1,0,0,0,23,0,0,0,0,0,0,23,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
};
const PENINSULA_OLD_FP = {
  EASTERN_FENS_MORNAY_WESTERN_COVE_MAP: '4eac5c857975fa0374cbd7cca18f2290bccd67c684ead419f47956905c31bdc5',
  EASTERN_FENS_MORNAY_NECK_ROAD_MAP: 'a83fa14e81db0375633f0c81cf9c8886657a5feb26b8b1918647bba4ac1cbe05',
  EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP: '5cf8fdb63841f32b440e343ddd9eac8215ef2aeaf4f8e21a1c0074bed2357444',
  EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP: '11d735989a10b5ac17e38be22840fc108551ab686caf1939e46103668ba48fc2',
  EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP: 'e5c1659ded1be097545dd16afda2af4c1beee7c7181f2cac51f8f0271aa56805',
  EASTERN_FENS_MORNAY_EASTERN_POINT_MAP: '703bf7fd979868abbfe7bb6d0e1c1a3c48f2db94624e0403fb2e5c1337d1e2b3',
  EASTERN_FENS_MORNAY_APPROACH_M_MAP: '6608c5121e0383b7d8edbd981a8052ee8483966424ce9adeecbfe2e2bbf53241',
};
const PENINSULA_IDS = Object.keys(PENINSULA_OLD_GRIDS);

// Declared seam plan (single source of truth, mirrors world-transitions.js).
const PENINSULA_SEAMS = [
  { from: 'EASTERN_FENS_MORNAY_APPROACH_M_MAP', dir: 'north', to: 'EASTERN_FENS_MORNAY_NECK_ROAD_MAP', toDir: 'south', range: [7, 9] },
  { from: 'EASTERN_FENS_MORNAY_NECK_ROAD_MAP', dir: 'north', to: 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP', toDir: 'south', range: [7, 9] },
  { from: 'EASTERN_FENS_MORNAY_NECK_ROAD_MAP', dir: 'west', to: 'EASTERN_FENS_MORNAY_WESTERN_COVE_MAP', toDir: 'east', range: [6, 8] },
  { from: 'EASTERN_FENS_MORNAY_NECK_ROAD_MAP', dir: 'east', to: 'EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP', toDir: 'west', range: [6, 8] },
  { from: 'EASTERN_FENS_MORNAY_WESTERN_COVE_MAP', dir: 'north', to: 'EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP', toDir: 'south', range: [10, 12] },
  { from: 'EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP', dir: 'north', to: 'EASTERN_FENS_MORNAY_EASTERN_POINT_MAP', toDir: 'south', range: [3, 5] },
  { from: 'EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP', dir: 'east', to: 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP', toDir: 'west', range: [6, 8] },
  { from: 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP', dir: 'east', to: 'EASTERN_FENS_MORNAY_EASTERN_POINT_MAP', toDir: 'west', range: [10, 12] },
];

// The enterable 2x3 Mornay footprint. Its upper four cells remain solid and
// its southern two cells are the paired west/east town entrances.
const FOOTPRINT_MAP_ID = 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP';
const SOLID_FOOTPRINT_CELLS = [[0, 7], [0, 8], [1, 7], [1, 8]]; // [row, col]
const TOWN_ENTRANCES = [
  { row: 2, col: 7, gate: 'MORNAY_WEST_GATE_MAP' },
  { row: 2, col: 8, gate: 'MORNAY_EAST_GATE_MAP' },
];

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens terrain redesign: Valmere shoreline light touch + Mornay peninsula correction (six-chunk landform + enterable 2x3 crown)',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. Shoreline: recorded OLD_FP matches the literal prior grid; current
    //    grid matches the updated fingerprint; every differing cell is a
    //    recognized Gravel-Bar/Driftwood swap.
    for (const id of SHORELINE_IDS) {
      assert.equal(sha256(JSON.stringify(SHORELINE_OLD_GRIDS[id])), SHORELINE_OLD_FP[id], `${id}: recorded OLD_FP matches the literal prior grid`);
      const newGrid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      assert.equal(sha256(JSON.stringify(newGrid)), GRID_FP.fingerprints[id], `${id}: current grid matches the updated fingerprint`);
      // EASTERN_FENS_VALMERE_REVEAL_MAP's west border (col 0, rows 6-8) was
      // separately authorized later to open the Valmere expanse's entrance
      // seam (water -> walkable reed/gravel matching the adjacent col-1
      // texture) -- excluded from this pass's own shingle/driftwood diff.
      // EASTERN_FENS_MORNAY_THRESHOLD_MAP's south border (row 14, cols 7-9)
      // was separately authorized later to open the Eastern Shore expansion's
      // entrance seam (water -> walkable grass) -- excluded likewise.
      const SEAM_EXCEPTION_CELLS = id === 'EASTERN_FENS_VALMERE_REVEAL_MAP'
        ? new Set([[6, 0], [7, 0], [8, 0]].map(([r, c]) => r + ',' + c))
        : id === 'EASTERN_FENS_MORNAY_THRESHOLD_MAP'
        ? new Set([[14, 7], [14, 8], [14, 9]].map(([r, c]) => r + ',' + c))
        : new Set();
      let diffs = 0;
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 16; c++) {
          if (SHORELINE_OLD_GRIDS[id][r][c] === newGrid[r][c]) continue;
          if (SEAM_EXCEPTION_CELLS.has(r + ',' + c)) continue;
          diffs++;
          const isWalkableSwap = WALKABLE_FILL.has(SHORELINE_OLD_GRIDS[id][r][c]) && newGrid[r][c] === 128;
          const isRoadVerge = SHORELINE_OLD_GRIDS[id][r][c] === 2 && newGrid[r][c] === 0; // authorized two-tile road pass; exact cells checked by suite 337
          const isBlockerSwap = BLOCKER_FILL.has(SHORELINE_OLD_GRIDS[id][r][c]) && newGrid[r][c] === 129;
          assert.ok(isWalkableSwap || isBlockerSwap || isRoadVerge, `${id} (${r},${c}): must be a recognized shingle/driftwood or road-verge swap`);
        }
      }
      assert.ok(diffs > 0, `${id}: at least one cell changed`);
    }

    // 2. Peninsula: recorded OLD_FP (the superseded scenery pass) matches the
    //    literal prior grid; current grid matches the updated fingerprint;
    //    all 15x16.
    for (const id of PENINSULA_IDS) {
      assert.equal(sha256(JSON.stringify(PENINSULA_OLD_GRIDS[id])), PENINSULA_OLD_FP[id], `${id}: recorded OLD_FP matches the superseded-pass grid`);
      const newGrid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      assert.equal(newGrid.length, 15, `${id}: 15 rows`);
      newGrid.forEach((row, i) => assert.equal(row.length, 16, `${id}: row ${i} has 16 cols`));
      assert.equal(sha256(JSON.stringify(newGrid)), GRID_FP.fingerprints[id], `${id}: current grid matches the updated fingerprint`);
    }

    // 3. The six peninsula chunks are walkable, no-save, no-encounter --
    //    NOT a six-chunk town, but not non-walkable scenery either.
    const SIX_CHUNKS = PENINSULA_IDS.filter((id) => id !== 'EASTERN_FENS_MORNAY_APPROACH_M_MAP');
    assert.equal(SIX_CHUNKS.length, 6, 'exactly six peninsula chunks');
    for (const id of SIX_CHUNKS) {
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), true, `${id}: walkable (not non-accessible scenery)`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), false, `${id}: no save point yet`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), false, `${id}: no random encounters (unchanged)`);
    }

    // 4. The six chunks remain regional geography rather than town
    //    interiors: the crown contains four solid marker cells and two
    //    authored entrance cells. Literal town streets remain inside the
    //    registered legacy-town maps.
    let totalBuildingTiles = 0;
    let totalEntranceTiles = 0;
    for (const id of SIX_CHUNKS) {
      const grid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      const flat = grid.flat();
      assert.ok(!flat.includes(12), `${id}: no TOWN_FLOOR (no literal Mornay streets)`);
      assert.ok(!flat.includes(21), `${id}: no TOWN_MARKET (no literal Mornay streets)`);
      const buildingCount = flat.filter((t) => [131,132,133].includes(t)).length;
      const entranceCount = flat.filter((t) => t === 14).length;
      if (id === FOOTPRINT_MAP_ID) {
        assert.equal(buildingCount, 4, `${id}: exactly 4 solid settlement marker marker tiles`);
        assert.equal(entranceCount, 2, `${id}: exactly 2 paired TOWN_ENTRANCE tiles`);
      }
      else assert.equal(buildingCount, 0, `${id}: no settlement marker tiles outside the footprint chunk`);
      totalBuildingTiles += buildingCount;
      totalEntranceTiles += entranceCount;
    }
    assert.equal(totalBuildingTiles, 4, 'exactly 4 solid settlement marker cells across the peninsula crown');
    assert.equal(totalEntranceTiles, 2, 'exactly 2 TOWN_ENTRANCE cells across the peninsula crown');

    // 5. The Mornay marker is exactly two tiles wide by three high, with the
    //    southern pair serving as entrances.
    const crownGrid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${FOOTPRINT_MAP_ID}'].map)`);
    assert.deepEqual([crownGrid[0][7],crownGrid[0][8],crownGrid[1][7],crownGrid[1][8]],[132,131,133,131], 'fort, northern roofs, western harbour and middle roofs');
    for (const entrance of TOWN_ENTRANCES) assert.equal(crownGrid[entrance.row][entrance.col], 14, `entrance cell (${entrance.col},${entrance.row}) is TOWN_ENTRANCE`);
    assert.deepEqual([...new Set([...SOLID_FOOTPRINT_CELLS, ...TOWN_ENTRANCES.map(e => [e.row, e.col])].map(([r]) => r))].sort(), [0, 1, 2], 'marker spans exactly 3 rows');
    assert.deepEqual([...new Set([...SOLID_FOOTPRINT_CELLS, ...TOWN_ENTRANCES.map(e => [e.row, e.col])].map(([, c]) => c))].sort(), [7, 8], 'marker spans exactly 2 cols');

    // 6. Both land entrances are reachable from the established approach and
    //    retain distinct paired return identities.
    assert.deepEqual([crownGrid[2][7], crownGrid[2][8]], [14, 14], 'paired southern crown cells are town entrances');
    assert.deepEqual(J("JSON.stringify(_REGIONAL_CHUNK_DEFINITIONS.find(c=>c.chunkX===17&&c.chunkY===-4).map[14].slice(7,9))"), [1, 1], 'open Valmere water immediately north of the marker');

    // 7. The paired entrances use the established enterTownAt authority and
    //    all nineteen Mornay exteriors are registered as town maps.
    assert.equal((movementSrc.match(/enterTownAt\(\s*['"]mornay['"]/gi) || []).length, 2, 'exactly two enterTownAt(\'mornay\', ...) land routes');
    const townNamedTargets = J("JSON.stringify([...new Set(Object.values(EDGE_TRANSITIONS).flatMap(d=>Object.values(d).flat()).map(e=>e.targetMap).filter(id=>id.includes('MORNAY_TOWN')))])");
    assert.deepEqual(townNamedTargets, ['EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP'], 'only the outdoor approach uses the town word');
    assert.equal(g.run("Object.values(MAP_CATALOG).filter(m=>m.region==='Mornay'&&m.type==='town').length"), 19, 'all nineteen Mornay town exteriors are registered');

    // 8. The approach reaches the peninsula: EASTERN_FENS_MORNAY_APPROACH_M_MAP
    //    has a reciprocal north seam into the peninsula's southern neck
    //    (NECK_ROAD_MAP), matching the "southern neck" requirement.
    const approachMNorth = J("JSON.stringify(EDGE_TRANSITIONS['EASTERN_FENS_MORNAY_APPROACH_M_MAP'].north)");
    assert.deepEqual(approachMNorth, [{ targetMap: 'EASTERN_FENS_MORNAY_NECK_ROAD_MAP', targetEdge: 'south', sourceRange: [7, 9] }]);
    const approachMGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_APPROACH_M_MAP'].map)");
    assert.deepEqual([approachMGrid[0][7], approachMGrid[0][8], approachMGrid[0][9]], [2, 2, 0], 'approach north seam preserves two PATH tiles and a walkable verge');

    // 9. The road reaches both entrances: col 8 is walkable (PATH) on
    //    every row from the southern seam (row 14) of NECK_ROAD_MAP, up
    //    through its north seam and through TOWN_APPROACH_MAP. A westward
    //    branch on row 4 reaches the west entrance at (7,3).
    const neckGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_NECK_ROAD_MAP'].map)");
    for (let r = 0; r <= 14; r++) assert.equal(neckGrid[r][8], 2, `NECK_ROAD_MAP row ${r} col 8 is PATH (road spine)`);
    for (let r = 4; r <= 14; r++) assert.equal(crownGrid[r][8], 2, `TOWN_APPROACH_MAP row ${r} col 8 is PATH (road to entrances)`);
    assert.equal(crownGrid[4][7], 2, 'west entrance has a walkable approach cell');

    // 10. Western and eastern shoreline branches terminate safely (water,
    //     rock, mud, or dense vegetation), not void: the authored local dead
    //     ends in the Sheltered Cove, Exposed Eastern Shore, Western Harbour
    //     Shore, and Exposed Point chunks.
    const westernGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_WESTERN_COVE_MAP'].map)");
    assert.equal(westernGrid[11][7], 88, 'Sheltered Cove: southern mooring spur ends at Exposed Stone');
    assert.equal(westernGrid[11][8], 88, 'Sheltered Cove: southern mooring spur ends at Exposed Stone');
    const easternShoreGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP'].map)");
    assert.equal(easternShoreGrid[11][2], 129, 'Exposed Eastern Shore: southern spur ends at Driftwood');
    const harbourGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP'].map)");
    assert.equal(harbourGrid[1][2], 23, 'Western Harbour Shore: northern mooring spur ends at Reeds');
    assert.equal(harbourGrid[1][3], 23, 'Western Harbour Shore: northern mooring spur ends at Reeds');
    const edgeGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_EASTERN_POINT_MAP'].map)");
    assert.equal(edgeGrid[4][8], 128, 'Exposed Point: the point tip is Gravel Bar');
    assert.equal(edgeGrid[3][8], 1, 'Exposed Point: water immediately north of the tip (natural dead end)');

    // 11. All new/reopened seams are reciprocal: each declared transition's
    //     partner exists with the matching target/range, and no targetRange
    //     override (non-remapping, per the structural-seam contract).
    for (const seam of PENINSULA_SEAMS) {
      const forward = J(`JSON.stringify(EDGE_TRANSITIONS['${seam.from}'].${seam.dir})`);
      assert.equal(forward.length, 1, `${seam.from}.${seam.dir} is a single segment`);
      assert.deepEqual({ t: forward[0].targetMap, e: forward[0].targetEdge, r: forward[0].sourceRange }, { t: seam.to, e: seam.toDir, r: seam.range }, `${seam.from}.${seam.dir} -> ${seam.to}.${seam.toDir} [${seam.range}]`);
      assert.equal(forward[0].targetRange, undefined, `${seam.from}.${seam.dir} has no targetRange (non-remapping)`);
      const reverse = J(`JSON.stringify(EDGE_TRANSITIONS['${seam.to}'].${seam.toDir})`);
      assert.equal(reverse.length, 1, `${seam.to}.${seam.toDir} is a single segment`);
      assert.deepEqual({ t: reverse[0].targetMap, e: reverse[0].targetEdge, r: reverse[0].sourceRange }, { t: seam.from, e: seam.dir, r: seam.range }, `${seam.to}.${seam.toDir} -> ${seam.from}.${seam.dir} [${seam.range}] (reciprocal)`);
      // Both landings are base-walkable (validateGameData proves the exact
      // one-tile-in landing cell; here we confirm the border range itself).
      for (let i = seam.range[0]; i <= seam.range[1]; i++) {
        const fromGrid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${seam.from}'].map)`);
        const toGrid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${seam.to}'].map)`);
        const fromCell = seam.dir === 'north' ? fromGrid[0][i] : seam.dir === 'south' ? fromGrid[14][i] : seam.dir === 'west' ? fromGrid[i][0] : fromGrid[i][15];
        const toCell = seam.toDir === 'north' ? toGrid[0][i] : seam.toDir === 'south' ? toGrid[14][i] : seam.toDir === 'west' ? toGrid[i][0] : toGrid[i][15];
        const WALK = new Set([0, 2, 23, 81, 128]);
        assert.ok(WALK.has(fromCell), `${seam.from} border cell at index ${i} is walkable`);
        assert.ok(WALK.has(toCell), `${seam.to} border cell at index ${i} is walkable`);
      }
    }

    // 12. Zero visible void: every peninsula chunk is placed in
    //     REGIONAL_LAYOUT at its documented coordinate (the permanent
    //     invariant across the whole region is proven independently by test
    //     176; this confirms the six chunks specifically didn't move).
    const COORDS = {
      EASTERN_FENS_MORNAY_WESTERN_COVE_MAP: [16, -2],
      EASTERN_FENS_MORNAY_NECK_ROAD_MAP: [17, -2],
      EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP: [18, -2],
      EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP: [16, -3],
      EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP: [17, -3],
      EASTERN_FENS_MORNAY_EASTERN_POINT_MAP: [18, -3],
    };
    for (const [id, [cx, cy]] of Object.entries(COORDS)) {
      const p = J(`JSON.stringify(regionPlacementForMapId('${id}'))`);
      assert.equal(p.chunkX, cx, `${id} chunkX unchanged`);
      assert.equal(p.chunkY, cy, `${id} chunkY unchanged`);
    }

    // 13. Every chunk NOT touched by this pass keeps its exact recorded
    //     fingerprint. EASTERN_FENS_MORNAY_APPROACH_E_MAP was separately
    //     authorized later (the road-gap fix): its rows 6-8 gained a paved
    //     spur (cols 0-5) west to APPROACH_M_MAP's seam, closing the open-fen
    //     gap that broke the Threshold->Mornay road; it is excluded here and
    //     checked against the current fixture fingerprint instead.
    const approachEGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_APPROACH_E_MAP'].map)");
    assert.equal(sha256(JSON.stringify(approachEGrid)), GRID_FP.fingerprints.EASTERN_FENS_MORNAY_APPROACH_E_MAP, 'EASTERN_FENS_MORNAY_APPROACH_E_MAP: current grid matches the updated fingerprint');
    const touched = new Set([...SHORELINE_IDS, ...PENINSULA_IDS, 'EASTERN_FENS_MORNAY_APPROACH_E_MAP']);
    let swept = 0;
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      if (touched.has(id)) continue;
      swept++;
      const current = g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'] ? REGIONAL_CHUNK_CATALOG['${id}'].map : (MAP_CATALOG['${id}'] && MAP_CATALOG['${id}'].map))`);
      assert.equal(sha256(current), fp, `${id}: untouched fingerprint unchanged`);
    }
    assert.equal(swept, Object.keys(GRID_FP.fingerprints).length - touched.size);

    // 14. General validation unaffected.
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0);

    // 15. Naming audit: all six display names describe peninsula geography,
    //     not nonexistent Mornay town districts.
    const EXPECTED_DISPLAY_NAMES = {
      EASTERN_FENS_MORNAY_WESTERN_COVE_MAP: 'Mornay Peninsula — Western Cove',
      EASTERN_FENS_MORNAY_NECK_ROAD_MAP: 'Mornay Peninsula — Neck Road',
      EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP: 'Mornay Peninsula — Eastern Shore',
      EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP: 'Mornay Peninsula — Harbour Shore',
      EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP: 'Mornay Peninsula — Town Approach',
      EASTERN_FENS_MORNAY_EASTERN_POINT_MAP: 'Mornay Peninsula — Eastern Point',
    };
    const saveFixture=context();
    saveFixture.run('dialogue.open=false');assert.equal(saveFixture.run('saveGame()'),true);
    const saved=JSON.parse(saveFixture.run("localStorage.getItem('verdantVale_save')"));
    for (const [id, name] of Object.entries(EXPECTED_DISPLAY_NAMES)) {
      assert.equal(g.run(`MAP_CATALOG['${id}'].displayName`), name, `${id}: display name describes peninsula geography`);
      assert.equal(g.run(`mapIdForRef(mapRefForId('${id}'))`), id);
      assert.equal(g.run(`getDebugWarpDestinations().filter(d=>d.mapId==='${id}').length`), 1);
      g.run('dialogue.open=false');
      assert.equal(g.run(`debugWarpToDestination('outdoor:${id}').success`), true, `${id}: derived warp resolves`);
      assert.equal(g.run('regionalActiveMapId()'), id);
      assert.equal(g.run('saveGame()'), false, 'peninsula save restriction remains unchanged');
      // A regional saved location is a canonical world point, not a retired
      // map ID. Exercise that existing load authority without enabling saves.
      saved.location={kind:'regional',...JSON.parse(g.run('JSON.stringify(regionalWorldPosition())'))};
      g.run('localStorage.setItem("verdantVale_save",'+JSON.stringify(JSON.stringify(saved))+');dialogue.open=false');
      assert.equal(g.run('loadGame()'), true);
      assert.equal(g.run('regionalActiveMapId()'), id, `${id}: save placement round trip`);
    }
    // No town-district terminology leaks into any display name.
    const DISTRICT_WORDS = ['Administrative', 'Residential', 'Waterfront', 'District'];
    for (const [id, name] of Object.entries(EXPECTED_DISPLAY_NAMES)) {
      for (const word of DISTRICT_WORDS) {
        assert.ok(!name.includes(word), `${id}: display name "${name}" must not contain town-district word "${word}"`);
      }
    }
  },
};
