'use strict';

// Terrain-redesign pass, batch 4 + correction: light-touch shingle/driftwood
// retexture on the four Valmere shoreline chunks (unchanged by the
// correction), plus the Mornay PENINSULA correction. An earlier pass had
// converted the six chunks at (16-18, -2) and (16-18, -3) into non-walkable
// scenery -- that went too far in the opposite direction from a six-chunk
// town. This correction reworks them into one coherent, irregular peninsula
// extending north into Valmere, with a reserved compact 3x2 Mornay
// settlement footprint at the northern crown (WORKING_WATERFRONT_MAP, rows
// 1-2, cols 7-9). The footprint represents the whole town at overworld
// scale -- no literal streets are drawn across the six chunks, and no
// transition targets a nonexistent Mornay town map; the footprint is
// presently a solid marker with the road ending at its southern face.
//
// NAMING AUDIT: all six display names were confirmed/updated to describe
// peninsula geography, not town districts (Neck Road / Western Cove /
// Eastern Shore / Harbour Shore / Town Approach / Eastern Point). Four
// internal map IDs (ADMIN_CENTRE, RESIDENTIAL, HARBOUR, WORKING_WATERFRONT)
// still carry town-district terminology and were NOT renamed this pass --
// data.js (dirty, owned by a concurrent process) has literal MAP_CATALOG
// registry entries keyed by those exact ID strings, so renaming here would
// require touching an unowned file. See the INTEGRATION NOTE comment in
// content/maps/eastern-fens-maps.js immediately above the six-chunk block
// for the required clean rename pass before real Mornay town maps exist.

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
  EASTERN_FENS_MORNAY_WESTERN_APPROACH_MAP: [
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
  EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP: [
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
  EASTERN_FENS_MORNAY_RESIDENTIAL_MAP: [
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
  EASTERN_FENS_MORNAY_HARBOUR_MAP: [
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
  EASTERN_FENS_MORNAY_WORKING_WATERFRONT_MAP: [
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
  EASTERN_FENS_MORNAY_EASTERN_EDGE_MAP: [
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
  EASTERN_FENS_MORNAY_WESTERN_APPROACH_MAP: '4eac5c857975fa0374cbd7cca18f2290bccd67c684ead419f47956905c31bdc5',
  EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP: 'a83fa14e81db0375633f0c81cf9c8886657a5feb26b8b1918647bba4ac1cbe05',
  EASTERN_FENS_MORNAY_RESIDENTIAL_MAP: '5cf8fdb63841f32b440e343ddd9eac8215ef2aeaf4f8e21a1c0074bed2357444',
  EASTERN_FENS_MORNAY_HARBOUR_MAP: '11d735989a10b5ac17e38be22840fc108551ab686caf1939e46103668ba48fc2',
  EASTERN_FENS_MORNAY_WORKING_WATERFRONT_MAP: 'e5c1659ded1be097545dd16afda2af4c1beee7c7181f2cac51f8f0271aa56805',
  EASTERN_FENS_MORNAY_EASTERN_EDGE_MAP: '703bf7fd979868abbfe7bb6d0e1c1a3c48f2db94624e0403fb2e5c1337d1e2b3',
  EASTERN_FENS_MORNAY_APPROACH_M_MAP: '6608c5121e0383b7d8edbd981a8052ee8483966424ce9adeecbfe2e2bbf53241',
};
const PENINSULA_IDS = Object.keys(PENINSULA_OLD_GRIDS);

// Declared seam plan (single source of truth, mirrors world-transitions.js).
const PENINSULA_SEAMS = [
  { from: 'EASTERN_FENS_MORNAY_APPROACH_M_MAP', dir: 'north', to: 'EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP', toDir: 'south', range: [7, 9] },
  { from: 'EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP', dir: 'north', to: 'EASTERN_FENS_MORNAY_WORKING_WATERFRONT_MAP', toDir: 'south', range: [7, 9] },
  { from: 'EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP', dir: 'west', to: 'EASTERN_FENS_MORNAY_WESTERN_APPROACH_MAP', toDir: 'east', range: [6, 8] },
  { from: 'EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP', dir: 'east', to: 'EASTERN_FENS_MORNAY_RESIDENTIAL_MAP', toDir: 'west', range: [6, 8] },
  { from: 'EASTERN_FENS_MORNAY_WESTERN_APPROACH_MAP', dir: 'north', to: 'EASTERN_FENS_MORNAY_HARBOUR_MAP', toDir: 'south', range: [10, 12] },
  { from: 'EASTERN_FENS_MORNAY_RESIDENTIAL_MAP', dir: 'north', to: 'EASTERN_FENS_MORNAY_EASTERN_EDGE_MAP', toDir: 'south', range: [3, 5] },
  { from: 'EASTERN_FENS_MORNAY_HARBOUR_MAP', dir: 'east', to: 'EASTERN_FENS_MORNAY_WORKING_WATERFRONT_MAP', toDir: 'west', range: [6, 8] },
  { from: 'EASTERN_FENS_MORNAY_WORKING_WATERFRONT_MAP', dir: 'east', to: 'EASTERN_FENS_MORNAY_EASTERN_EDGE_MAP', toDir: 'west', range: [10, 12] },
];

// The reserved 3x2 Mornay footprint, and the future entry/return cells.
const FOOTPRINT_MAP_ID = 'EASTERN_FENS_MORNAY_WORKING_WATERFRONT_MAP';
const FOOTPRINT_CELLS = [[1, 7], [1, 8], [1, 9], [2, 7], [2, 8], [2, 9]]; // [row, col]
const FUTURE_ENTRY = { mapId: FOOTPRINT_MAP_ID, row: 2, col: 8 }; // southern-face center tile of the footprint
const FUTURE_RETURN = { mapId: FOOTPRINT_MAP_ID, row: 3, col: 8 }; // road tile immediately south of the footprint

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens terrain redesign: Valmere shoreline light touch + Mornay peninsula correction (six-chunk landform + reserved 3x2 footprint)',
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
      let diffs = 0;
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 16; c++) {
          if (SHORELINE_OLD_GRIDS[id][r][c] === newGrid[r][c]) continue;
          diffs++;
          const isWalkableSwap = WALKABLE_FILL.has(SHORELINE_OLD_GRIDS[id][r][c]) && newGrid[r][c] === 128;
          const isBlockerSwap = BLOCKER_FILL.has(SHORELINE_OLD_GRIDS[id][r][c]) && newGrid[r][c] === 129;
          assert.ok(isWalkableSwap || isBlockerSwap, `${id} (${r},${c}): must be a recognized shingle/driftwood swap`);
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

    // 4. The six chunks are NOT treated as six town interiors: TOWN_BUILDING
    //    (13) appears ONLY as the 6-tile reserved footprint on
    //    WORKING_WATERFRONT_MAP; TOWN_FLOOR (12) and TOWN_MARKET (21) appear
    //    nowhere across the whole peninsula (no literal streets).
    let totalBuildingTiles = 0;
    for (const id of SIX_CHUNKS) {
      const grid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      const flat = grid.flat();
      assert.ok(!flat.includes(12), `${id}: no TOWN_FLOOR (no literal Mornay streets)`);
      assert.ok(!flat.includes(21), `${id}: no TOWN_MARKET (no literal Mornay streets)`);
      const buildingCount = flat.filter((t) => t === 13).length;
      if (id === FOOTPRINT_MAP_ID) assert.equal(buildingCount, 6, `${id}: exactly 6 TOWN_BUILDING tiles (the reserved footprint)`);
      else assert.equal(buildingCount, 0, `${id}: no TOWN_BUILDING tiles outside the footprint chunk`);
      totalBuildingTiles += buildingCount;
    }
    assert.equal(totalBuildingTiles, 6, 'exactly 6 TOWN_BUILDING tiles across the whole peninsula');

    // 5. The reserved Mornay footprint is exactly 3x2 tiles, at the
    //    documented coordinates, on the northern crown.
    const crownGrid = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${FOOTPRINT_MAP_ID}'].map)`);
    for (const [r, c] of FOOTPRINT_CELLS) assert.equal(crownGrid[r][c], 13, `footprint cell (${c},${r}) is TOWN_BUILDING`);
    const rows = new Set(FOOTPRINT_CELLS.map(([r]) => r)), cols = new Set(FOOTPRINT_CELLS.map(([, c]) => c));
    assert.deepEqual([...rows].sort(), [1, 2], 'footprint spans exactly 2 rows');
    assert.deepEqual([...cols].sort(), [7, 8, 9], 'footprint spans exactly 3 cols');

    // 6. The future entry tile and return-landing tile are stable and
    //    documented, so Codex can wire the real transition later without
    //    redesigning the peninsula. No transition exists yet (no nonexistent-
    //    map transition): the entry tile is presently solid (TOWN_BUILDING),
    //    and the return tile is presently the walkable road (PATH).
    assert.equal(crownGrid[FUTURE_ENTRY.row][FUTURE_ENTRY.col], 13, 'future TOWN_ENTRANCE tile is presently solid (TOWN_BUILDING)');
    assert.equal(crownGrid[FUTURE_RETURN.row][FUTURE_RETURN.col], 2, 'future return-landing tile is presently the walkable road (PATH)');
    // The road terminates naturally at the footprint's southern face: row 3
    // (immediately south of the footprint) is PATH under the whole footprint
    // width, and row 0 (immediately north of the footprint) is water -- the
    // footprint is the literal end of the explorable peninsula.
    assert.deepEqual([crownGrid[3][7], crownGrid[3][8], crownGrid[3][9]], [2, 2, 2], 'road terminates at the footprint southern face');
    assert.deepEqual([crownGrid[0][7], crownGrid[0][8], crownGrid[0][9]], [1, 1, 1], 'open Valmere water immediately north of the footprint');

    // 7. No transition anywhere targets a nonexistent Mornay town map: no
    //    EDGE_TRANSITIONS/debug-warp entry references a 'mornay' town id, and
    //    movement.js has no enterTownAt('mornay', ...) call (the established
    //    TOWN_ENTRANCE-tile convention used by Calwick/Drenwick).
    assert.equal(/enterTownAt\(\s*['"]mornay['"]/i.test(movementSrc), false, 'no enterTownAt(\'mornay\', ...) wired yet');
    assert.equal(/targetMap:\s*['"][^'"]*MORNAY_TOWN/i.test(worldTransitionsSrc), false, 'no EDGE_TRANSITIONS entry targets a Mornay town map');

    // 8. The approach reaches the peninsula: EASTERN_FENS_MORNAY_APPROACH_M_MAP
    //    has a reciprocal north seam into the peninsula's southern neck
    //    (ADMIN_CENTRE_MAP), matching the "southern neck" requirement.
    const approachMNorth = J("JSON.stringify(EDGE_TRANSITIONS['EASTERN_FENS_MORNAY_APPROACH_M_MAP'].north)");
    assert.deepEqual(approachMNorth, [{ targetMap: 'EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP', targetEdge: 'south', sourceRange: [7, 9] }]);
    const approachMGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_APPROACH_M_MAP'].map)");
    assert.deepEqual([approachMGrid[0][7], approachMGrid[0][8], approachMGrid[0][9]], [2, 2, 2], 'approach north seam is walkable PATH');

    // 9. The road reaches the reserved footprint: col 8 is walkable (PATH) on
    //    every row from the southern seam (row 14) of ADMIN_CENTRE_MAP, up
    //    through its north seam, through WORKING_WATERFRONT_MAP, to row 3
    //    (the footprint's southern face) -- one continuous corridor.
    const adminGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP'].map)");
    for (let r = 0; r <= 14; r++) assert.equal(adminGrid[r][8], 2, `ADMIN_CENTRE_MAP row ${r} col 8 is PATH (road spine)`);
    for (let r = 3; r <= 14; r++) assert.equal(crownGrid[r][8], 2, `WORKING_WATERFRONT_MAP row ${r} col 8 is PATH (road to footprint)`);

    // 10. Western and eastern shoreline branches terminate safely (water,
    //     rock, mud, or dense vegetation), not void: the authored local dead
    //     ends in the Sheltered Cove, Exposed Eastern Shore, Western Harbour
    //     Shore, and Exposed Point chunks.
    const westernGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_WESTERN_APPROACH_MAP'].map)");
    assert.equal(westernGrid[11][7], 88, 'Sheltered Cove: southern mooring spur ends at Exposed Stone');
    assert.equal(westernGrid[11][8], 88, 'Sheltered Cove: southern mooring spur ends at Exposed Stone');
    const residentialGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_RESIDENTIAL_MAP'].map)");
    assert.equal(residentialGrid[11][2], 129, 'Exposed Eastern Shore: southern spur ends at Driftwood');
    const harbourGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_HARBOUR_MAP'].map)");
    assert.equal(harbourGrid[1][2], 23, 'Western Harbour Shore: northern mooring spur ends at Reeds');
    assert.equal(harbourGrid[1][3], 23, 'Western Harbour Shore: northern mooring spur ends at Reeds');
    const edgeGrid = J("JSON.stringify(REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_EASTERN_EDGE_MAP'].map)");
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
      EASTERN_FENS_MORNAY_WESTERN_APPROACH_MAP: [16, -2],
      EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP: [17, -2],
      EASTERN_FENS_MORNAY_RESIDENTIAL_MAP: [18, -2],
      EASTERN_FENS_MORNAY_HARBOUR_MAP: [16, -3],
      EASTERN_FENS_MORNAY_WORKING_WATERFRONT_MAP: [17, -3],
      EASTERN_FENS_MORNAY_EASTERN_EDGE_MAP: [18, -3],
    };
    for (const [id, [cx, cy]] of Object.entries(COORDS)) {
      const p = J(`JSON.stringify(regionPlacementForMapId('${id}'))`);
      assert.equal(p.chunkX, cx, `${id} chunkX unchanged`);
      assert.equal(p.chunkY, cy, `${id} chunkY unchanged`);
    }

    // 13. Every chunk NOT touched by this pass keeps its exact recorded
    //     fingerprint.
    const touched = new Set([...SHORELINE_IDS, ...PENINSULA_IDS]);
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
      EASTERN_FENS_MORNAY_WESTERN_APPROACH_MAP: 'Mornay Peninsula — Western Cove',
      EASTERN_FENS_MORNAY_ADMIN_CENTRE_MAP: 'Mornay Peninsula — Neck Road',
      EASTERN_FENS_MORNAY_RESIDENTIAL_MAP: 'Mornay Peninsula — Eastern Shore',
      EASTERN_FENS_MORNAY_HARBOUR_MAP: 'Mornay Peninsula — Harbour Shore',
      EASTERN_FENS_MORNAY_WORKING_WATERFRONT_MAP: 'Mornay Peninsula — Town Approach',
      EASTERN_FENS_MORNAY_EASTERN_EDGE_MAP: 'Mornay Peninsula — Eastern Point',
    };
    for (const [id, name] of Object.entries(EXPECTED_DISPLAY_NAMES)) {
      assert.equal(g.run(`MAP_CATALOG['${id}'].displayName`), name, `${id}: display name describes peninsula geography`);
    }
    // None of the (deliberately deferred) town-district-sounding internal ID
    // fragments leak into any display name.
    const DISTRICT_WORDS = ['Administrative', 'Residential', 'Waterfront', 'District'];
    for (const [id, name] of Object.entries(EXPECTED_DISPLAY_NAMES)) {
      for (const word of DISTRICT_WORDS) {
        assert.ok(!name.includes(word), `${id}: display name "${name}" must not contain town-district word "${word}"`);
      }
    }
  },
};
