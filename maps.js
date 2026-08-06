'use strict';

// ─── Northern World Map — Northern Road  (16 × 15) ───────────────────────────
// Connected to MAP via NORTH_EXIT at MAP row 0 col 7 / NORTH_ENTRANCE at row 14 col 7.
// Connected to MAP_N2 via NORTH2_EXIT at row 0 col 7 / NORTH2_ENTRANCE at row 14 col 7.
// Road runs north-south at col 7. River crossing at rows 6-7.
// Forest clusters at rows 2-3 (cols 1-3, 12-14) and rows 10-11 (cols 10-13).
const MAP_N1 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3, 45,  3,  3,  3,  3,  3,  3,  3,  3],  //  0  ← col 7 = NORTH2_EXIT
  [  3,  0,  0,  3,  3,  0,  0,  2,  0,  0,  3,  3,  3,  0,  0,  3],  //  1  road + forest flanks
  [  3,  0,  3,  3,  0,  0,  0,  2,  0,  0,  0,  3,  3,  3,  0,  3],  //  2  dense forest NW + NE
  [  3,  3,  3,  0,  0,  0,  0,  2,  0,  0,  0,  0,  3,  3,  3,  3],  //  3  forest breaks
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  4  open country
  [  3,  0,  0, 23,  0,  0,  0,  2,  0,  0,  0, 23,  0,  0,  0,  3],  //  5  reeds each side
  [  3,  0, 23,  1,  1, 23,  0,  2,  0, 23,  1,  1, 23,  0,  0,  3],  //  6  river (WATER) crossing
  [  3,  0, 23,  1,  1,  0,  0,  2,  0,  0,  1,  1, 23,  0,  0,  3],  //  7  river continued
  [  3,  0,  0, 23,  0,  0,  0,  2,  0,  0,  0, 23,  0,  0,  0,  3],  //  8  reeds, clearing
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  9  open
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  3,  3,  3,  0,  0,  3],  // 10  SE forest begins
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  3,  3,  3,  3,  0,  3],  // 11  SE forest dense
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  3,  0,  0,  0,  3],  // 12  thinning
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  // 13  approach to MAP
  [  3,  3,  3,  3,  3,  3,  3, 44,  3,  3,  3,  3,  3,  3,  3,  3],  // 14  ← col 7 = NORTH_ENTRANCE
];

const MAP_N1_ITEMS = [];

// ─── Northern World Map 2 — Drenwick Approach  (16 × 15) ─────────────────────
// Connected to MAP_N1 via NORTH2_EXIT at MAP_N1 row 0 col 7 / NORTH2_ENTRANCE at row 14 col 7.
// Drenwick: large city, ~3× Calwick's footprint — TOWN_BUILDING block rows 1-8, cols 2-13.
// Not enterable yet. Road runs south at col 7 rows 9-13, NORTH2_ENTRANCE at row 14 col 7.
const MAP_N2 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3],  //  0  north wall
  [  3,  3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,  3,  3],  //  1  Drenwick N wall
  [  3,  3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,  3,  3],  //  2
  [  3,  3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,  3,  3],  //  3
  [  3,  3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,  3,  3],  //  4
  [  3,  3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,  3,  3],  //  5
  [  3,  3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,  3,  3],  //  6
  [  3,  3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,  3,  3],  //  7
  [  3,  3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,  3,  3],  //  8  Drenwick S wall
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  9  road approaches city
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  // 10
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  // 11
  [  3,  0, 23, 23,  0,  0,  0,  2,  0,  0,  0, 23, 23,  0,  0,  3],  // 12  reeds flanking road
  [  3,  0,  0, 23,  0,  0,  0,  2,  0,  0,  0, 23,  0,  0,  0,  3],  // 13  straggling reeds
  [  3,  3,  3,  3,  3,  3,  3, 46,  3,  3,  3,  3,  3,  3,  3,  3],  // 14  ← col 7 = NORTH2_ENTRANCE
];

const MAP_N2_ITEMS = [];

// ─── Apartment Building Corridor  (16 × 15) ──────────────────────────────────
// Placeholder lobby corridor for the east Calwick apartment building.
// Narrow horizontal corridor: cols 2–13, rows 6–8. Exit: col 7, row 9.
const APARTMENT_CORRIDOR_MAP = [
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  3
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  4
  [ 19, 19, 19, 37, 19, 19, 37, 19, 19, 37, 19, 19, 37, 19, 19, 19],  //  5  apt doors at c3,c6,c9,c12
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  6  corridor
  [ 19, 19,116, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  7  corridor; col 2 = APT_NOTICE ("calwick_apt_notice", audit fix)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  8  corridor
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  //  9  exit col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 10
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 12
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Small Apartment Interior  (16 × 15) ─────────────────────────────────────
// Reusable layout shared by all apartments. Floor: cols 5–9, rows 5–8. Exit: col 7, row 9.
const SMALL_APARTMENT_MAP = [
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  3
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  4
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19],  //  5  floor top
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19],  //  6
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19],  //  7
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19],  //  8  floor bottom
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  //  9  exit col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 10
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 12
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

const HOUSE_INTERIOR_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  2
  [ 19, 19, 74, 74, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  3  cols 2-3 = secret pocket (looks like wall)
  [ 19, 19, 74, 74, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  4  cols 2-3 = secret pocket (looks like wall)
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  5
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  6
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  7
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  8
  [ 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  9
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 10  exit col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 12
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── The Dream  (16 × 15) ─────────────────────────────────────────────────────
// Where the player stands during the weekly strange dreams (day % 7 === 3
// after resting in their own bed) — a featureless, pure-white space. The
// border ring is DREAM_EDGE (102, blocks) and the interior DREAM_FLOOR
// (101, walkable); both render identical white, so the boundary is
// invisible. Entered/left only via enterDream()/exitDream()
// (world-transitions.js), which stash and restore the waking world. For now
// the dream text plays over it and movement is locked by the open dialogue;
// the map is real and registered so the player can later walk around in it.
const DREAM_MAP = [
  //  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
  [ 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102],  //  0
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  //  1
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  //  2
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  //  3
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  //  4
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  //  5
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  //  6
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  //  7  player wakes-in at c7/c8
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  //  8
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  //  9
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  // 10
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  // 11
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  // 12
  [ 102, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102],  // 13
  [ 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102],  // 14
];

// ─── Expose to global scope ───────────────────────────────────────────────────
window.MAP                  = MAP;
window.MAP2                 = MAP2;
window.MAP2_ITEMS           = MAP2_ITEMS;
window.LORRA_HOUSE_MAP      = LORRA_HOUSE_MAP;
window.MAREN_POST_MAP       = MAREN_POST_MAP;
window.MAP3                 = MAP3;
window.MAP3_ITEMS           = MAP3_ITEMS;
window.MAP4                 = MAP4;
window.MAP4_ITEMS           = MAP4_ITEMS;
window.MAP5                 = MAP5;
window.MAP5_ITEMS           = MAP5_ITEMS;
window.MAP3_N1              = MAP3_N1;
window.MAP3_N1_ITEMS        = MAP3_N1_ITEMS;
window.RODDON_WAY_MAP       = RODDON_WAY_MAP;
window.RODDON_WAY_ITEMS     = RODDON_WAY_ITEMS;
window.MIRE_VAULT_MAP       = MIRE_VAULT_MAP;
window.TAKOMO_MAP           = TAKOMO_MAP;
window.HAMLET_INTERIOR_MAP  = HAMLET_INTERIOR_MAP;
window.FEN_BREWERY_MAP      = FEN_BREWERY_MAP;
window.MAP3_N2              = MAP3_N2;
window.MAP3_N2_ITEMS        = MAP3_N2_ITEMS;
window.NORTH_BASIN_S_MAP    = NORTH_BASIN_S_MAP;
window.NORTH_BASIN_S_ITEMS  = NORTH_BASIN_S_ITEMS;
window.NORTH_BASIN_C_MAP    = NORTH_BASIN_C_MAP;
window.NORTH_BASIN_C_ITEMS  = NORTH_BASIN_C_ITEMS;
window.NORTH_BASIN_SW_MAP   = NORTH_BASIN_SW_MAP;
window.NORTH_BASIN_SW_ITEMS = NORTH_BASIN_SW_ITEMS;
window.NORTH_BASIN_W_MAP    = NORTH_BASIN_W_MAP;
window.NORTH_BASIN_W_ITEMS  = NORTH_BASIN_W_ITEMS;
window.NORTH_BASIN_NW_MAP   = NORTH_BASIN_NW_MAP;
window.NORTH_BASIN_NW_ITEMS = NORTH_BASIN_NW_ITEMS;
window.BASIN_CHAMBER_MAP    = BASIN_CHAMBER_MAP;
window.BASIN_CHAMBER_ITEMS  = BASIN_CHAMBER_ITEMS;
window.SUNKEN_GALLERY_MAP   = SUNKEN_GALLERY_MAP;
window.SUNKEN_GALLERY_ITEMS = SUNKEN_GALLERY_ITEMS;
window.SUNKEN_GALLERY_GRID_CELLS = SUNKEN_GALLERY_GRID_CELLS;
window.BRIDGE_CROSSING_MAP  = BRIDGE_CROSSING_MAP;
window.DRENWICK_CIVIC_MAP              = DRENWICK_CIVIC_MAP;
window.DRENWICK_WEST_RESIDENTIAL_MAP   = DRENWICK_WEST_RESIDENTIAL_MAP;
window.DRENWICK_CANAL_DOCKS_MAP        = DRENWICK_CANAL_DOCKS_MAP;
window.DRENWICK_EAST_OUTSKIRTS_MAP     = DRENWICK_EAST_OUTSKIRTS_MAP;
window.DRENWICK_MARKET_MAP             = DRENWICK_MARKET_MAP;
window.DRENWICK_WATERFRONT_MAP         = DRENWICK_WATERFRONT_MAP;
window.DRENWICK_INN_MAP                = DRENWICK_INN_MAP;
window.DRENWICK_OFFICE_MAP             = DRENWICK_OFFICE_MAP;
window.DRENWICK_HARBORMASTER_MAP       = DRENWICK_HARBORMASTER_MAP;
window.DRENWICK_WASH_HOUSE_MAP         = DRENWICK_WASH_HOUSE_MAP;
window.DRENWICK_INFIRMARY_MAP          = DRENWICK_INFIRMARY_MAP;
window.DRENWICK_PROVISION_STORE_MAP    = DRENWICK_PROVISION_STORE_MAP;
window.DRENWICK_GUILD_HALL_MAP         = DRENWICK_GUILD_HALL_MAP;
window.DRENWICK_TAVERN_MAP             = DRENWICK_TAVERN_MAP;
window.DRENWICK_SCHOOL_GROUND_MAP      = DRENWICK_SCHOOL_GROUND_MAP;
window.DRENWICK_SCHOOL_UPPER_MAP       = DRENWICK_SCHOOL_UPPER_MAP;
window.MAP_N1               = MAP_N1;
window.MAP_N1_ITEMS         = MAP_N1_ITEMS;
window.MAP_N2               = MAP_N2;
window.MAP_N2_ITEMS         = MAP_N2_ITEMS;
window.DUNGEON_ENTRANCE_MAP   = DUNGEON_ENTRANCE_MAP;
window.DUNGEON_ENTRANCE_ITEMS = DUNGEON_ENTRANCE_ITEMS;
window.DUNGEON_MAP          = DUNGEON_MAP;
window.DUNGEON2_MAP         = DUNGEON2_MAP;
window.DUNGEON3_MAP         = DUNGEON3_MAP;
window.DUNGEON3_TL_MAP      = DUNGEON3_TL_MAP;
window.DUNGEON3_TR_MAP      = DUNGEON3_TR_MAP;
window.DUNGEON3_ML_MAP      = DUNGEON3_ML_MAP;
window.DUNGEON3_MC_MAP      = DUNGEON3_MC_MAP;
window.DUNGEON3_MR_MAP      = DUNGEON3_MR_MAP;
window.DUNGEON3_BL_MAP      = DUNGEON3_BL_MAP;
window.DUNGEON3_BC_MAP      = DUNGEON3_BC_MAP;
window.DUNGEON3_BR_MAP      = DUNGEON3_BR_MAP;
window.DUNGEON4_MAP         = DUNGEON4_MAP;
window.DUNGEON5_MAP         = DUNGEON5_MAP;
window.DUNGEON6_MAP         = DUNGEON6_MAP;
window.DUNGEON7_MAP         = DUNGEON7_MAP;
window.DUNGEON8_MAP         = DUNGEON8_MAP;
window.DUNGEON8_WEST_MAP    = DUNGEON8_WEST_MAP;
window.DUNGEON8_EAST_MAP    = DUNGEON8_EAST_MAP;
window.TOWN_MAP             = TOWN_MAP;
window.INN_MAP              = INN_MAP;
window.OFFICE_MAP           = OFFICE_MAP;
window.SCHOOL_MAP           = SCHOOL_MAP;
window.APARTMENT_CORRIDOR_MAP = APARTMENT_CORRIDOR_MAP;
window.SMALL_APARTMENT_MAP  = SMALL_APARTMENT_MAP;
window.EAST_TOWN_MAP        = EAST_TOWN_MAP;
window.WEST_TOWN_MAP        = WEST_TOWN_MAP;
window.MEADOW_MAP           = MEADOW_MAP;
window.HOUSE_INTERIOR_MAP   = HOUSE_INTERIOR_MAP;
window.SLUICE_MAP           = SLUICE_MAP;
window.SLUICE_LEVEL2_MAP    = SLUICE_LEVEL2_MAP;
window.SLUICE_LEVEL3_MAP    = SLUICE_LEVEL3_MAP;
window.SLUICE_SECRET_MAP    = SLUICE_SECRET_MAP;
window.DREAM_MAP            = DREAM_MAP;

// ─── Map registry ─────────────────────────────────────────────────────────────
// Additive/reference-only: gameplay code has not yet been migrated to use this.
// Each entry: { id, label, map }
// Labels match locationName() in main.js where applicable.
const MAP_REGISTRY = {
  MAP:                   { id: 'MAP',                   label: 'Verdant Vale',              map: MAP                   },
  MAP2:                  { id: 'MAP2',                  label: 'Eastern Reaches',            map: MAP2                  },
  LORRA_HOUSE_MAP:       { id: 'LORRA_HOUSE_MAP',       label: "Lorra's Farmhouse",          map: LORRA_HOUSE_MAP       },
  MAREN_POST_MAP:        { id: 'MAREN_POST_MAP',        label: 'Guard Post',                  map: MAREN_POST_MAP        },
  MAP3:                  { id: 'MAP3',                  label: 'Thornmere Fen',              map: MAP3                  },
  MAP4:                  { id: 'MAP4',                  label: 'Thornmere',                  map: MAP4                  },
  MAP5:                  { id: 'MAP5',                  label: 'Thornmere Shallows',         map: MAP5                  },
  MAP3_N1:               { id: 'MAP3_N1',               label: 'Northern Fen',               map: MAP3_N1               },
  RODDON_WAY_MAP:        { id: 'RODDON_WAY_MAP',        label: 'Roddon Way',                 map: RODDON_WAY_MAP        },
  MAP3_N2:               { id: 'MAP3_N2',               label: 'Drenwick',                   map: MAP3_N2               },
  NORTH_BASIN_S_MAP:     { id: 'NORTH_BASIN_S_MAP',     label: 'North Basin',                map: NORTH_BASIN_S_MAP     },
  NORTH_BASIN_C_MAP:     { id: 'NORTH_BASIN_C_MAP',     label: 'North Basin \u2014 Reservoir', map: NORTH_BASIN_C_MAP     },
  NORTH_BASIN_SW_MAP:    { id: 'NORTH_BASIN_SW_MAP',    label: 'North Basin \u2014 Silt Flats', map: NORTH_BASIN_SW_MAP    },
  NORTH_BASIN_W_MAP:     { id: 'NORTH_BASIN_W_MAP',     label: 'North Basin \u2014 West Shore', map: NORTH_BASIN_W_MAP    },
  NORTH_BASIN_NW_MAP:    { id: 'NORTH_BASIN_NW_MAP',    label: 'North Basin \u2014 Upper Reach', map: NORTH_BASIN_NW_MAP  },
  BASIN_CHAMBER_MAP:     { id: 'BASIN_CHAMBER_MAP',     label: 'No Recorded Location',      map: BASIN_CHAMBER_MAP    },
  SUNKEN_GALLERY_MAP:    { id: 'SUNKEN_GALLERY_MAP',    label: 'Sunken Gallery',            map: SUNKEN_GALLERY_MAP   },
  DRENWICK_POST_MAP:     { id: 'DRENWICK_POST_MAP',     label: 'Guard Post',                 map: DRENWICK_POST_MAP     },
  BRIDGE_CROSSING_MAP:   { id: 'BRIDGE_CROSSING_MAP',   label: 'Imperial Bridge \u2014 Toll Gate', map: BRIDGE_CROSSING_MAP   },
  SMUGGLER_FORT_MAP:     { id: 'SMUGGLER_FORT_MAP',     label: 'Guard Post',                 map: SMUGGLER_FORT_MAP     },
  DRENWICK_CIVIC_MAP:             { id: 'drenwick_civic',             label: 'Drenwick',          map: DRENWICK_CIVIC_MAP             },
  DRENWICK_WEST_RESIDENTIAL_MAP:  { id: 'drenwick_west_residential',  label: 'Drenwick West Side',   map: DRENWICK_WEST_RESIDENTIAL_MAP  },
  DRENWICK_CANAL_DOCKS_MAP:       { id: 'drenwick_canal_docks',       label: 'Drenwick Canal Docks',  map: DRENWICK_CANAL_DOCKS_MAP       },
  DRENWICK_EAST_OUTSKIRTS_MAP:    { id: 'drenwick_east_outskirts',    label: 'Drenwick East Side',    map: DRENWICK_EAST_OUTSKIRTS_MAP    },
  DRENWICK_MARKET_MAP:            { id: 'drenwick_market',            label: 'Drenwick Market',       map: DRENWICK_MARKET_MAP            },
  DRENWICK_POST_OFFICE_MAP:       { id: 'drenwick_post_office',       label: 'Drenwick — Fenmark Post Co.', map: DRENWICK_POST_OFFICE_MAP  },
  DRENWICK_WATERFRONT_MAP:        { id: 'drenwick_waterfront',        label: 'Drenwick Waterfront',   map: DRENWICK_WATERFRONT_MAP        },
  DRENWICK_INN_MAP:               { id: 'drenwick_inn',               label: 'Drenwick \u2014 Inn',                map: DRENWICK_INN_MAP               },
  DRENWICK_OFFICE_MAP:            { id: 'drenwick_office',            label: 'Drenwick \u2014 Office',             map: DRENWICK_OFFICE_MAP            },
  DRENWICK_HARBORMASTER_MAP:      { id: 'drenwick_harbormaster',      label: 'Drenwick \u2014 Harbormaster',       map: DRENWICK_HARBORMASTER_MAP      },
  DRENWICK_WASH_HOUSE_MAP:        { id: 'drenwick_wash_house',        label: 'Drenwick \u2014 Wash House',         map: DRENWICK_WASH_HOUSE_MAP        },
  DRENWICK_INFIRMARY_MAP:         { id: 'drenwick_infirmary',         label: 'Drenwick \u2014 Infirmary',          map: DRENWICK_INFIRMARY_MAP         },
  DRENWICK_PROVISION_STORE_MAP:   { id: 'drenwick_provision_store',   label: 'Drenwick \u2014 Provision Store',    map: DRENWICK_PROVISION_STORE_MAP   },
  DRENWICK_GUILD_HALL_MAP:        { id: 'drenwick_guild_hall',        label: 'Drenwick \u2014 Guild Hall',               map: DRENWICK_GUILD_HALL_MAP        },
  DRENWICK_TAVERN_MAP:            { id: 'drenwick_tavern',            label: 'Drenwick \u2014 Dockworkers\u2019 Tavern',  map: DRENWICK_TAVERN_MAP            },
  DRENWICK_SCHOOL_GROUND_MAP:     { id: 'drenwick_school_ground',     label: 'Drenwick \u2014 School',                   map: DRENWICK_SCHOOL_GROUND_MAP     },
  DRENWICK_SCHOOL_UPPER_MAP:      { id: 'drenwick_school_upper',      label: 'Drenwick \u2014 School (Upper Floor)',      map: DRENWICK_SCHOOL_UPPER_MAP      },
  DRENWICK_SCHOOL_BASEMENT_MAP:   { id: 'drenwick_school_basement',   label: 'Drenwick \u2014 School (Archive)',          map: DRENWICK_SCHOOL_BASEMENT_MAP   },
  MAP_N1:                { id: 'MAP_N1',                label: 'Northern Road',              map: MAP_N1                },
  MAP_N2:                { id: 'MAP_N2',                label: 'Blocked Path',               map: MAP_N2                },
  DUNGEON_ENTRANCE_MAP:  { id: 'DUNGEON_ENTRANCE_MAP',  label: 'South Ruins \u2014 Entrance',       map: DUNGEON_ENTRANCE_MAP  },
  DUNGEON_MAP:           { id: 'DUNGEON_MAP',           label: 'South Ruins',                      map: DUNGEON_MAP           },
  DUNGEON2_MAP:          { id: 'DUNGEON2_MAP',          label: 'South Ruins \u2014 Lower',          map: DUNGEON2_MAP          },
  DUNGEON3_MAP:          { id: 'DUNGEON3_MAP',          label: 'South Ruins \u2014 Deep',                    map: DUNGEON3_MAP          },
  DUNGEON3_TL_MAP:       { id: 'DUNGEON3_TL_MAP',       label: 'South Ruins \u2014 Deep, West Wing',          map: DUNGEON3_TL_MAP       },
  DUNGEON3_TR_MAP:       { id: 'DUNGEON3_TR_MAP',       label: 'South Ruins \u2014 Deep, East Wing',          map: DUNGEON3_TR_MAP       },
  DUNGEON3_ML_MAP:       { id: 'DUNGEON3_ML_MAP',       label: 'South Ruins \u2014 Deep, Left Gallery',       map: DUNGEON3_ML_MAP       },
  DUNGEON3_MC_MAP:       { id: 'DUNGEON3_MC_MAP',       label: 'South Ruins \u2014 Deep, Crossing',           map: DUNGEON3_MC_MAP       },
  DUNGEON3_MR_MAP:       { id: 'DUNGEON3_MR_MAP',       label: 'South Ruins \u2014 Deep, Right Gallery',      map: DUNGEON3_MR_MAP       },
  DUNGEON3_BL_MAP:       { id: 'DUNGEON3_BL_MAP',       label: 'South Ruins \u2014 Deep, Lower West',         map: DUNGEON3_BL_MAP       },
  DUNGEON3_BC_MAP:       { id: 'DUNGEON3_BC_MAP',       label: 'South Ruins \u2014 Deep, Lower Hall',         map: DUNGEON3_BC_MAP       },
  DUNGEON3_BR_MAP:       { id: 'DUNGEON3_BR_MAP',       label: 'South Ruins \u2014 Deep, Descent Chamber',    map: DUNGEON3_BR_MAP       },
  DUNGEON4_MAP:          { id: 'DUNGEON4_MAP',          label: 'South Ruins \u2014 Deeper',         map: DUNGEON4_MAP          },
  DUNGEON5_MAP:          { id: 'DUNGEON5_MAP',          label: 'South Ruins \u2014 Lowest',         map: DUNGEON5_MAP          },
  DUNGEON6_MAP:          { id: 'DUNGEON6_MAP',          label: 'South Ruins \u2014 The Deep',        map: DUNGEON6_MAP          },
  DUNGEON7_MAP:          { id: 'DUNGEON7_MAP',          label: 'South Ruins \u2014 Catacombs',       map: DUNGEON7_MAP          },
  DUNGEON8_MAP:          { id: 'DUNGEON8_MAP',          label: 'South Ruins \u2014 The Drowned Chamber', map: DUNGEON8_MAP      },
  DUNGEON8_WEST_MAP:     { id: 'DUNGEON8_WEST_MAP',     label: 'South Ruins \u2014 West Passage',    map: DUNGEON8_WEST_MAP     },
  DUNGEON8_EAST_MAP:     { id: 'DUNGEON8_EAST_MAP',     label: 'South Ruins \u2014 East Passage',    map: DUNGEON8_EAST_MAP     },
  TOWN_MAP:              { id: 'TOWN_MAP',              label: 'Calwick',                    map: TOWN_MAP              },
  INN_MAP:               { id: 'INN_MAP',              label: 'Inn',                        map: INN_MAP               },
  OFFICE_MAP:            { id: 'OFFICE_MAP',            label: 'Office',                     map: OFFICE_MAP            },
  SCHOOL_MAP:            { id: 'SCHOOL_MAP',            label: 'West Calwick School',        map: SCHOOL_MAP            },
  APARTMENT_CORRIDOR_MAP:{ id: 'APARTMENT_CORRIDOR_MAP',label: 'East Calwick Apartments',   map: APARTMENT_CORRIDOR_MAP},
  SMALL_APARTMENT_MAP:   { id: 'SMALL_APARTMENT_MAP',   label: 'Apartment',                  map: SMALL_APARTMENT_MAP   },
  EAST_TOWN_MAP:         { id: 'EAST_TOWN_MAP',         label: 'Calwick East Side',          map: EAST_TOWN_MAP         },
  WEST_TOWN_MAP:         { id: 'WEST_TOWN_MAP',         label: 'Calwick West Side',          map: WEST_TOWN_MAP         },
  MEADOW_MAP:            { id: 'MEADOW_MAP',            label: 'Hidden Meadow',              map: MEADOW_MAP            },
  HOUSE_INTERIOR_MAP:    { id: 'HOUSE_INTERIOR_MAP',    label: 'House',                      map: HOUSE_INTERIOR_MAP    },
  SLUICE_MAP:            { id: 'SLUICE_MAP',            label: 'East Sluice',                map: SLUICE_MAP            },
  SLUICE_LEVEL2_MAP:     { id: 'SLUICE_LEVEL2_MAP',     label: 'East Sluice \u2014 Lower Works', map: SLUICE_LEVEL2_MAP },
  SLUICE_LEVEL3_MAP:     { id: 'SLUICE_LEVEL3_MAP',     label: 'East Sluice \u2014 Deep Works',  map: SLUICE_LEVEL3_MAP },
  SLUICE_SECRET_MAP:     { id: 'SLUICE_SECRET_MAP',     label: 'East Sluice \u2014 Sealed Room', map: SLUICE_SECRET_MAP },
  DREAM_MAP:             { id: 'DREAM_MAP',             label: '???',                       map: DREAM_MAP         },
  MIRE_VAULT_MAP:        { id: 'MIRE_VAULT_MAP',        label: "Mirethyst\u2019s Vault",         map: MIRE_VAULT_MAP    },
  TAKOMO_MAP:            { id: 'TAKOMO_MAP',            label: "Takomo\u2019s Chamber",          map: TAKOMO_MAP        },
  HAMLET_INTERIOR_MAP:   { id: 'HAMLET_INTERIOR_MAP',   label: 'The Falls',                      map: HAMLET_INTERIOR_MAP },
  FEN_BREWERY_MAP:       { id: 'FEN_BREWERY_MAP',       label: 'Wend Brewery',                   map: FEN_BREWERY_MAP   },
};

// The 24 additional Sunken Gallery grid rooms (galleryRoom() above). Registered
// in a loop rather than as 24 near-identical literals; each shares the plain
// 'Sunken Gallery' label (locationName() keys off inSunkenGallery, not the map).
for (const cell of SUNKEN_GALLERY_GRID_CELLS) {
  const id = 'SUNKEN_GALLERY_' + cell;
  MAP_REGISTRY[id] = { id: id, label: 'Sunken Gallery', map: window[id] };
}

window.MAP_REGISTRY = MAP_REGISTRY;

// Resolves a map grid reference back to its MAP_REGISTRY key — the reverse
// of MAP_REGISTRY[id].map. save.js's saveGame()/loadGame() each keep a
// private copy of this same lookup (mapToId/mapFromId) for serialisation;
// this global version exists so other systems (currently: world-transitions.js's
// edge-transition system) can resolve "which map is this, as a stable string
// id" without re-implementing the same loop or reaching into save.js's
// function-local scope, which isn't accessible from outside it.
function mapRegistryId(mapRef) {
  if (!mapRef) return null;
  for (const [id, entry] of Object.entries(MAP_REGISTRY)) {
    if (entry.map === mapRef) return id;
  }
  return null;
}
window.mapRegistryId = mapRegistryId;

// ─── Map validation ───────────────────────────────────────────────────────────
// The standalone dimension/WALKABLE check that used to live here (a plain
// `function validateMaps() {...}` with no other callers anywhere in the
// codebase) has been superseded by validation.js's validateMaps(), part of
// the broader validateGameData() content linter -- same checks, plus
// MAP_METADATA cross-validation, tile/transition/NPC/item/enemy/dialogue/
// save-flag/interaction checks, and error-vs-warning severity. See
// validation.js's header comment. Removed here (not left as dead, shadowed
// code) since validation.js's function of the same name is defined later in
// load order and would otherwise silently replace this one on `window`
// anyway -- keeping both would just be confusing, unreachable duplication.
