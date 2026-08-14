'use strict';

// ─── Northern World Map — Northern Road  (16 × 15) ───────────────────────────
// Connected to MAP via NORTH_EXIT at MAP row 0 col 7 / NORTH_ENTRANCE at row 14 col 7.
// Connected to MAP_N2 via a continuous seam at col 7 (MAP_N1.north ↔ MAP_N2.south).
// Road runs north-south at col 7. River crossing at rows 6-7.
// Forest clusters at rows 2-3 (cols 1-3, 12-14) and rows 10-11 (cols 10-13).
const MAP_N1 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3,  2,  3,  3,  3,  3,  3,  3,  3,  3],  //  0  ← col 7 = north seam → MAP_N2.south (continuous)
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
// Connected to MAP_N1 via a continuous seam at col 7 (MAP_N1.north ↔ MAP_N2.south).
// Drenwick: large city, ~3× Calwick's footprint — TOWN_BUILDING block rows 1-8, cols 2-13.
// Not enterable yet. Road runs south at col 7 rows 9-13, continuous seam at row 14 col 7.
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
  [  3,  3,  3,  3,  3,  3,  3,  2,  3,  3,  3,  3,  3,  3,  3,  3],  // 14  ← col 7 = south seam → MAP_N1.north (continuous)
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
// Where the player stands during the weekly strange dreams (day % 5 === 3 on
// the five-day week, after resting in their own bed) — a featureless, pure-white
// space. The
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

// ─── Map registry / catalog ─────────────────────────────────────────────────
// The authoritative per-map catalog (MAP_CATALOG), the derived MAP_REGISTRY /
// MAP_METADATA compatibility views, the reverse map-ref→id index, and the
// canonical helpers (mapIdForRef / mapEntryForId / mapRefForId, plus the
// deprecated mapRegistryId alias) all live in data.js now — the catalog needs the
// *_ENEMY_TEMPLATES pools and *_ITEMS arrays data.js defines, so it is built
// there, after this file's map arrays (and the Sunken Gallery grid arrays above)
// already exist as globals. maps.js no longer authors a separate MAP_REGISTRY
// literal; nothing here consults it at load time.

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
