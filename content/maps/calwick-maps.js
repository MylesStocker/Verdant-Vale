'use strict';

// Calwick maps: exterior, Calwick buildings, hidden meadow, Marens post.
// Region content moved verbatim from maps.js by the regional-content-split.
// Loaded BEFORE maps.js, which keeps MAP_REGISTRY, window.* exports, and mapRegistryId().
// ─── Map  (16 columns × 15 rows) ─────────────────────────────────────────────
// 0=grass 1=water 2=path 3=tree 6=dungeon entrance 14=town entrance
// MAP’s 15×16 tile grid is now authored inline in its regional chunk definition record below.

// ─── Maren's Guard Post Interior  (16 × 15) ──────────────────────────────────
// Tiny imperial checkpoint on MAP row 5 col 13 (GUARD_POST tile).
// Exit: col 7 row 11. Maren: col 7 row 4. Equipment shelf: TABLE at col 5 row 7.
// Narrow interior: cols 5-10, rows 3-10.
const MAREN_POST_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2  thick top wall
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  3  interior cols 5-10
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  4  Maren c7 ✓
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  5
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  6
  [ 19, 19, 19, 19, 19, 18, 33, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  7  TABLE c6 (equipment shelf)
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  8
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  9
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  // 10  last floor row; col 7 → exit
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 11  INTERIOR_EXIT c7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 12
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14  bottom wall
];

// ─── Hollis Farmstead Interior  (16 × 15) ────────────────────────────────────
// The occupied farmhouse on the overworld at row 9 col 3. Hollis (an SIMPLE_NPCS
// entry, map key 'hollis_farmhouse') stands mid-room; a hearth, table, and bed
// are procedural furniture overlays (render-interiors). Exit: c7 r12; the player
// enters at c7 r11, one step north of the door.
const HOLLIS_FARMHOUSE_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  2  interior cols 3-11
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  3
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  4
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  5  Hollis c7
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  6
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  7
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  8
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  9
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  // 10
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  // 11  last floor row; col 7 → exit
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT c7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Wrenna's Cottage Interior  (16 × 15) ────────────────────────────────────
// The occupied cottage on the overworld at row 12 col 2. Wrenna (SIMPLE_NPCS
// entry, map key 'wrenna_cottage') keeps a herb-drying corner; hearth, table,
// and hanging bundles are procedural overlays. Exit: c7 r12; enter at c7 r11.
const WRENNA_COTTAGE_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  3  interior cols 4-10
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  4
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  5
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  6  Wrenna c7
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  7
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  8
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  9
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  // 10
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  // 11  last floor row; col 7 → exit
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT c7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Town Map  (16 × 15) ─────────────────────────────────────────────────────
// 12=floor 13=building 14=entrance 15=exit 16=inn door 17=office door
// 21=market 22=notice board
const TOWN_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  //  0
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  //  1
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  //  2
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  //  3
  [ 13, 13, 13, 16, 13, 13, 13, 13, 13, 13, 13, 13, 17, 13, 13, 13],  //  4  inn(3) office(12)
  [ 31,112, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 24],  //  5  main street (col 0 = west entrance, col 15 = east entrance); col 1 = CHARTER_STONE ("calwick_charter_stone", audit fix)
  [ 13, 13, 12, 12, 12, 21, 21, 21, 21, 21, 12, 12, 12, 12, 13, 13],  //  6  market sq
  [ 13, 13, 12, 12, 12, 21, 21, 22, 21, 21, 12, 12, 12, 12, 13, 13],  //  7  notice board col 7
  [ 13, 13, 12, 12, 12, 21, 21, 21, 21, 21, 12, 12, 12, 12, 13, 13],  //  8  market sq
  [ 31, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 24],  //  9  south street (col 0 = west entrance, col 15 = east entrance)
  [ 13, 13, 12, 12, 13, 13, 12, 12, 12, 13, 13, 12, 12, 13, 13, 13],  // 10  residential
  [ 13, 13, 12, 12, 13, 13, 12, 12, 12, 13, 13, 12, 12, 13, 13, 13],  // 11  residential
  [ 13, 13, 12, 12, 12, 12, 12, 12, 12, 12, 12,113, 12, 13, 13, 13],  // 12  south lane; col 11 = CISTERN ("calwick_town_cistern", audit fix)
  [ 13, 13, 13, 13, 13, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13],  // 13  funnel
  [ 13, 13, 13, 13, 13, 13, 13, 15, 13, 13, 13, 13, 13, 13, 13, 13],  // 14  exit col 7
];

// ─── Inn Interior Map  (16 × 15) ─────────────────────────────────────────────
// 18=floor 19=wall 20=exit door
// Tables are overlay objects defined in INN_TABLES, not tile replacements.
const INN_MAP = [
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  1
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  2
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  3
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  4
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  5
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  6
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  7
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  8
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  9
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 10
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 11
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 12
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 13  exit col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Office Interior Map  (16 × 15) ──────────────────────────────────────────
const OFFICE_MAP = [
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  2
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  3
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  4
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  5
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  6
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  7
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  8
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  9
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 10
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  exit col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── School Interior Map  (16 × 15) ──────────────────────────────────────────
// Same floor plan as OFFICE_MAP. Floor: cols 2–13, rows 2–11. Exit: col 7, row 12.
const SCHOOL_MAP = [
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  2
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  3
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  4
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  5
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  6
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  7
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  8
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  9
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 10
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  exit col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── East Calwick Map  (16 × 15) ─────────────────────────────────────────────
// Residential area (cols 0–6) connects to main TOWN_MAP via EAST_EXIT (25) at
// col 0, rows 5 and 9. Right edge (col 15) exits to overworld via TOWN_EXIT (15).
// Right side (cols 7–15): wetlands — grass, trees, water, reeds.
// 12=town floor  13=building  15=town exit  23=reeds  25=east exit
const EAST_TOWN_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 13, 13, 13, 13, 13, 13, 13,  3,  3,  3,  3,  3,  3,  3,  3,  3],  //  0  north wall | treeline
  [ 13, 13, 13, 13, 13, 13, 13,  3,  3,  3,  3,  3,  3,  3,  3,  3],  //  1  north wall | treeline
  [ 12, 13, 13, 12, 13, 13, 12,  0,  0,  0,  3,  3,  3,  3,  3,  3],  //  2  house row A (cols 1-2, 4-5)
  [ 12, 13, 13, 12, 13, 13, 12,  0,  0,  0,  3,  3,  3,  3,  3,  3],  //  3  house row A
  [ 12, 13, 13, 12, 13, 13, 12,  0,  0,  0,  3,  3, 26, 23,  3,  3],  //  4  house row A; sluice hatch at c12
  [ 25, 12, 12, 12, 12, 12, 12, 12,  0,  0,  0,  0, 23,114, 23, 15],  //  5  main E-W street; col 13 = WATER_GAUGE ("calwick_wetland_gauge", audit fix)
  [ 12, 13, 13, 12, 13, 13, 12,  0,  0,  0,  3,  3,  1,  1, 23,  3],  //  6  house row B; water begins
  [ 12, 13, 13, 12, 13, 13, 12,  0,  0,  3,  3,  1,  1,  1, 23,  3],  //  7  house row B; wetland core
  [ 12, 13, 13, 12, 13, 36, 12,  0,  0,  3,  3,  1,  1,  3, 23,  3],  //  8  house row B; apt door at c5 (east building, bottom-right)
  [ 25, 12, 12, 12, 12, 12, 12, 12,  0,  0,  0,  0, 23, 23, 23, 15],  //  9  south E-W street
  [ 12, 13, 13, 12, 13, 13, 12,115,  0,  3,  3, 23, 23,  3,  3,  3],  // 10  house row C; reeds south; col 7 = REED_RACK ("calwick_reed_racks", audit fix)
  [ 12, 13, 13, 12, 13, 13, 12,  0,  0,  3,  3,  3,  3,  3,  3,  3],  // 11  house row C
  [ 13, 13, 13, 13, 13, 13, 13,  0,  0,  3,  3,  3,  3,  3,  3,  3],  // 12  south wall | grass
  [ 13, 13, 13, 13, 13, 13, 13,  3,  3,  3,  3,  3,  3,  3,  3,  3],  // 13  south border | treeline
  [ 13, 13, 13, 13, 13, 13, 13,  3,  3,  3,  3,  3,  3,  3,  3,  3],  // 14  south border
];

// ─── West Calwick Map  (16 × 15) ─────────────────────────────────────────────
// Quiet residential western side. Left edge (col 0) = boundary wall.
// Right edge (col 15) = WEST_EXIT at rows 5 and 9, wall elsewhere.
// Schoolhouse: cols 5–8, rows 2–3 (4×2 — larger than 2×2 homes).
// School courtyard: cols 5–8, row 4 (GRASS — open civic green).
// E-W streets at rows 5 and 9. N-S paths at cols 1, 4, 9, 12.
// 12=town floor  13=building  0=grass  32=west exit
const WEST_TOWN_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  //  0  north wall
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  //  1  north wall
  [ 13, 12, 13, 13, 12, 13, 13, 13, 13, 12, 13, 13, 12, 13, 13, 13],  //  2  paths c1,c4,c9,c12; home A c2-3; school c5-8; home B c10-11; home C c13-14
  [ 13, 12, 34, 13, 12, 13, 35, 13, 13, 12, 34, 13, 12, 13, 13, 13],  //  3  home A (door at c2); school (door at c6); home B (door at c10); home C
  [ 13, 12, 12, 12, 12,  0,  0,  0,  0, 12, 12, 12, 12, 12, 12, 13],  //  4  path c1-4; school yard GRASS c5-8; path c9-14
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 32],  //  5  main E-W street; WEST_EXIT c15
  [ 13, 12, 13, 13, 12, 12, 13, 13, 12, 12, 13, 13, 12, 13, 13, 13],  //  6  home D c2-3; home H c6-7; home E c10-11; home F c13-14
  [ 13, 12, 34, 13, 12, 12, 34, 13, 12, 12, 34, 13, 12, 13, 13, 13],  //  7  home D (door at c2); home H (door at c6); home E (door at c10); home F
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  8  mid lane (all path c1-c14)
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 32],  //  9  south E-W street; WEST_EXIT c15
  [ 13, 12, 13, 13, 12, 12, 12, 12, 12, 12, 13, 13, 12, 12, 12, 13],  // 10  home G c2-3; home I c10-11; open south
  [ 13, 12, 34, 13, 12, 12, 12, 12, 12, 12, 34, 13, 12, 12, 12, 13],  // 11  home G (door at c2, player_house); home I (door at c10)
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  // 12  south lane (dead end into wall)
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  // 13  south wall
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  // 14  south wall
];

// ─── Shared House Interior  (16 × 15) ────────────────────────────────────────
// One reusable single-room interior for all residential houses.
// Which NPCs and props appear is controlled by currentHouseId + SIMPLE_NPCS.
// Floor: cols 4–11, rows 2–9.  Exit door: col 7, row 10.
// ─── Hidden Meadow  (16 × 15) ────────────────────────────────────────────────
// A secluded clearing reached through the MEADOW_HIDDEN_ENTRANCE tile in the
// Verdant Vale's top-left tree nook (MAP row 1 col 1 — drawn as plain grass,
// found only by walking on it). Tree-ringed grass with a small spring pool
// (rows 3-4, cols 6-7), scattered reeds, the relocated Briar Warden's den
// (BRIAR_WARDEN_SPAWN, beside the pool — render-entities.js), and MEADOW_CHEST
// (col 12 row 2, data.js — Amethyst Dust, cures the cursed status). The one
// exit is the gap in the south tree border (MEADOW_EXIT, row 14 col 7), which
// returns to MAP just below the nook. Deliberately encounter-free (see
// isEncounterEligibleTile in movement.js) — the Warden is the only danger.
const MEADOW_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3],  //  0
  [  3,  0,  0, 23,  0,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  3],  //  1
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  3],  //  2  ← chest at col 12 (overlay)
  [  3,  0, 23,  0,  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  0,  3],  //  3  spring pool begins; Warden den at col 8 (overlay)
  [  3,  0,  0,  0,  0,  0,  1,  1,  0,  0,  0,  0, 23,  0,  0,  3],  //  4  spring pool ends
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3],  //  5
  [  3, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  3],  //  6
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3],  //  7
  [  3,  0,  0,  0, 23,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  3],  //  8
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3],  //  9
  [  3,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  3],  // 10
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3],  // 11
  [  3,  0,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0,  3],  // 12
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3],  // 13
  [  3,  3,  3,  3,  3,  3,  3, 94,  3,  3,  3,  3,  3,  3,  3,  3],  // 14  ← col 7 = MEADOW_EXIT (gap in the trees, back to MAP)
];

// ── Regional chunk definitions (Calwick / Verdant Vale) ──────────────────────
// Authored authority for this file's placed regional chunks. data.js merges the
// per-file *_REGIONAL_CHUNK_DEFINITIONS fragments and resolves encounterProfileId /
// itemSetId into the runtime REGIONAL_CHUNK_CATALOG (see data.js for the contract).
const CALWICK_REGIONAL_CHUNK_DEFINITIONS = [
  { mapId: 'MAP', regionId: 'overworld', chunkX: 0, chunkY: 5, map: [
      [3,3,3,3,3,3,3,43,3,3,3,3,3,3,3,3],  //  0  ← col 7 = NORTH_EXIT
      [3,93,0,0,0,14,0,2,0,0,3,0,0,0,0,3], //  1  ← col 1 = MEADOW_HIDDEN_ENTRANCE (draws as grass — secret), col 5 = town entrance, col 7 = path (north road)
      [3,0,0,3,3,2,0,2,0,0,3,3,0,0,0,3],   //  2  ← col 5 = path, col 7 = path (north road)
      [3,0,0,3,3,2,0,2,0,0,3,0,0,0,0,3],   //  3  ← col 5 = path, col 7 = path (north road)
      [3,0,0,0,0,2,2,2,2,2,2,2,2,2,2,39],  //  4  ← col 15 = east world exit, col 7 = crossroads
      [3,0,0,0,0,2,0,0,0,0,0,0,3,53,0,3],  //  5  ← col 13 = GUARD_POST (Maren's post)
      [3,0,1,1,0,2,0,0,0,0,0,0,0,0,0,3],  //  6
      [3,0,1,1,1,2,2,0,0,0,0,0,0,0,0,3],  //  7
      [3,0,0,1,0,0,2,2,2,2,0,0,0,0,0,3],  //  8
      [3,0,0,54,0,0,0,0,2,0,0,0,0,0,0,3],  //  9  ← col 3 = FARM_HOUSE (Hollis Farmstead)
      [3,0,0,2,2,2,2,2,2,0,0,3,3,0,0,3],  // 10  ← cols 3-8 = farm lane joining the north road at col 8 (Hollis doorstep col 3)
      [3,0,3,0,0,0,0,0,2,0,0,3,0,0,0,3],  // 11
      [3,0,54,2,2,2,2,2,2,2,2,6,0,0,0,3],  // 12  ← col 2 = FARM_HOUSE (Wrenna's Cottage); cols 3-10 = lane joining the road; col 11 = dungeon entrance
      [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],  // 13
      [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],  // 14
    ],
    displayName: 'Verdant Vale', region: 'Verdant Vale', contentKey: 'overworld',
    presentation: 'legacy_screen', encounterProfileId: 'early', itemSetId: 'world',
    allowRandomEncounters: true, allowSave: true },
];
window.CALWICK_REGIONAL_CHUNK_DEFINITIONS = CALWICK_REGIONAL_CHUNK_DEFINITIONS;
