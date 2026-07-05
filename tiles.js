'use strict';

// ─── Tile pixel size (used for coordinate math below) ─────────────────────────
const TILE = 32;   // px per tile

// ─── Tile IDs ─────────────────────────────────────────────────────────────────
const GRASS            = 0;
const WATER            = 1;
const PATH             = 2;
const TREE             = 3;
const DUNGEON_FLOOR    = 4;
const DUNGEON_WALL     = 5;
const DUNGEON_ENTRANCE = 6;  // overworld tile → enter dungeon
const DUNGEON_EXIT     = 7;  // dungeon tile → exit to overworld
const DUNGEON2_FLOOR      = 8;   // second-floor walkable stone
const DUNGEON2_WALL       = 9;   // second-floor wall
const DUNGEON_STAIRS_DOWN = 10;  // dungeon 1 → dungeon 2
const DUNGEON2_STAIRS_UP  = 11;  // dungeon 2 → dungeon 1
const TOWN_FLOOR     = 12;  // town cobblestone street
const TOWN_BUILDING  = 13;  // building exterior (impassable)
const TOWN_ENTRANCE  = 14;  // overworld → town
const TOWN_EXIT      = 15;  // town → overworld
const INN_DOOR       = 16;  // town → inn interior
const OFFICE_DOOR    = 17;  // town → office interior
const INTERIOR_FLOOR = 18;  // building interior floor
const INTERIOR_WALL  = 19;  // building interior wall (impassable)
const INTERIOR_EXIT  = 20;  // interior → town
const TOWN_MARKET    = 21;  // market square cobblestone
const NOTICE_BOARD   = 22;  // notice board (walkable)
const REEDS          = 23;  // walkable wetland reeds / marsh grass
const EAST_ENTRANCE  = 24;  // main TOWN_MAP right edge → east Calwick
const EAST_EXIT      = 25;  // east Calwick left edge → main TOWN_MAP
const SLUICE_ENTRANCE = 26; // east Calwick hatch → East Sluice level 1
const SLUICE_FLOOR    = 27; // East Sluice walkable stone
const SLUICE_WALL     = 28; // East Sluice impassable brick
const SLUICE_EXIT     = 29; // East Sluice ladder → east Calwick
const SLUICE_CHANNEL  = 30; // East Sluice drainage channel (impassable)
const WEST_ENTRANCE  = 31;  // main TOWN_MAP left edge → west Calwick
const WEST_EXIT      = 32;  // west Calwick right edge → main TOWN_MAP
const TABLE          = 33;  // pub/inn table (non-walkable)
const HOUSE_DOOR     = 34;  // exterior house tile → enters shared house interior
const SCHOOL_DOOR    = 35;  // exterior school tile → enters school interior
const APT_DOOR          = 36;  // exterior apartment building tile → enters corridor
const APT_INTERIOR_DOOR = 37;  // interior corridor tile → enters individual apartment
const FALSE_WALL        = 38;  // looks like SLUICE_WALL but is walkable (secret passage)
const MAP2_EXIT         = 39;  // right edge of MAP  → enter MAP2 (eastern world square)
const MAP2_ENTRANCE     = 40;  // left  edge of MAP2 → return to MAP
const MAP3_EXIT         = 41;  // right edge of MAP2  → enter MAP3 (far eastern square)
const MAP3_ENTRANCE     = 42;  // left  edge of MAP3  → return to MAP2
const NORTH_EXIT        = 43;  // top   edge of MAP   → enter MAP_N1 (first northern square)
const NORTH_ENTRANCE    = 44;  // bot   edge of MAP_N1 → return to MAP
const NORTH2_EXIT       = 45;  // top   edge of MAP_N1 → enter MAP_N2 (Drenwick approach)
const NORTH2_ENTRANCE   = 46;  // bot   edge of MAP_N2 → return to MAP_N1
const FEN_N_EXIT        = 47;  // top   edge of MAP3   → enter MAP3_N1 (northern fen)
const FEN_N_ENTRANCE    = 48;  // bot   edge of MAP3_N1 → return to MAP3
const FEN_N2_EXIT       = 49;  // top   edge of MAP3_N1 → enter MAP3_N2 (Drenwick)
const FEN_N2_ENTRANCE   = 50;  // bot   edge of MAP3_N2 → return to MAP3_N1
const MAP4_EXIT         = 51;  // right edge of MAP3   → enter MAP4 (Thornmere Lake)
const MAP4_ENTRANCE     = 52;  // left  edge of MAP4   → return to MAP3
const GUARD_POST        = 53;  // overworld guard-post hut → enter interior
const FARM_HOUSE        = 54;  // overworld farmhouse hut  → enter interior
const MIRE_ENTRANCE     = 55;  // fen bog-hole → enter Mirethyst's Vault (MAP3_N1)
const MIRE_EXIT         = 56;  // vault stone arch → return to fen
const BRIDGE_GATE       = 57;  // imperial toll bridge over canal → enter bridge checkpoint
const BRIDGE_DECK       = 58;  // walkable planking on top of the canal bridge (inside BRIDGE_CROSSING_MAP)
const BRIDGE_EXIT       = 59;  // north/south border of BRIDGE_CROSSING_MAP → return to MAP3_N2
const MAP5_EXIT         = 60;  // right edge of MAP4   → enter MAP5 (Thornmere Shallows)
const MAP5_ENTRANCE     = 61;  // left  edge of MAP5   → return to MAP4
const DUNGEON3_FLOOR    = 62;  // horror-branch walkable floor (glutinous, wet)
const DUNGEON3_WALL     = 63;  // horror-branch wall (dripping, organic — impassable)
const DUNGEON8_WEST_DOOR = 64; // floor-8 main chamber → west horror branch
const DUNGEON8_WEST_RET  = 65; // west horror branch → floor-8 main chamber
const DUNGEON8_EAST_DOOR = 66; // floor-8 main chamber → east horror branch
const DUNGEON8_EAST_RET  = 67; // east horror branch → floor-8 main chamber
const D3_EAST_PASSAGE  = 68;  // floor-3 sub-room east wall opening → adjacent room right
const D3_WEST_PASSAGE  = 69;  // floor-3 sub-room west wall opening → adjacent room left
const D3_SOUTH_PASSAGE = 70;  // floor-3 sub-room south wall opening → adjacent room below
const D3_NORTH_PASSAGE = 71;  // floor-3 sub-room north wall opening → adjacent room above

const DUNGEON_FALSE_WALL   = 72; // looks like DUNGEON_WALL (5) but walkable — dungeon secret passage
const WORLD_HOLLOW         = 73; // looks like TREE (3) but walkable — overworld hidden path
const INTERIOR_FALSE_WALL  = 74; // looks like INTERIOR_WALL (19) but walkable — house secret passage
const TAKOMO_GATE          = 75; // looks like TOWN_BUILDING (13) but walkable — Drenwick secret entrance
const TAKOMO_EXIT          = 76; // Takomo's chamber arch → return to Drenwick Waterfront

// ─── South Ruins — Entrance Hall (top floor, no encounters) ──────────────────
const RUIN_FLOOR       = 77; // cracked, mossy castle-stone floor — walkable
const RUIN_WALL        = 78; // crumbling castle wall / broken pillar stump — impassable
const RUIN_STAIRS_DOWN = 79; // entrance hall → South Ruins floor 1 (DUNGEON_MAP)
const RUIN_EXIT        = 80; // entrance hall → overworld (MAP)

// ─── The North Basin — south approach (skeleton: 1 of a future 3×3 grid) ─────
const BASIN_MUD           = 81; // drought-cracked wetland mud — walkable, NOT grass (deliberately outside the encounter check)
const NORTH_BASIN_EXIT     = 82; // top edge of MAP3_N2 → North Basin south approach (NORTH_BASIN_S_MAP)
const NORTH_BASIN_ENTRANCE = 83; // bottom edge of NORTH_BASIN_S_MAP → return to MAP3_N2

// Tile IDs 84-87 (NORTH_BASIN_C_EXIT/ENTRANCE, NORTH_BASIN_SW_EXIT/ENTRANCE)
// used to be point-tile transitions for South Approach <-> Reservoir and
// South Approach <-> Silt Flats. Both links were converted to the generic,
// broad-edge EDGE_TRANSITIONS system (world-transitions.js), so those
// constants are retired — see the WALKABLE[] comments at those indices.
// The numbers are intentionally left unused (not reassigned) rather than
// renumbering every tile ID after them.

// ─── The North Basin — Silt Flats (3 of the future 3×3 grid; first real encounter map) ──
const EXPOSED_STONE           = 88; // dried-out rocky lakebed patches — walkable, not grass (no encounters on it)
const FENCE_POST              = 89; // old farm/pasture fence post, half-swallowed by silt — impassable, decorative

// ─── The North Basin — Badlands (4 of the future 3×3 grid; "W", north of the Silt Flats) ──
const NORTH_BASIN_W_EXIT     = 90; // north edge of NORTH_BASIN_SW_MAP → the Badlands (NORTH_BASIN_W_MAP)
const NORTH_BASIN_W_ENTRANCE = 91; // south edge of NORTH_BASIN_W_MAP → return to NORTH_BASIN_SW_MAP
const TRAPPER_HUT            = 92; // abandoned trapper's hut — impassable, decorative (no interior)

// true = player can walk on it
const WALKABLE = [
  /* 0  GRASS              */ true,
  /* 1  WATER              */ false,
  /* 2  PATH               */ true,
  /* 3  TREE               */ false,
  /* 4  DUNGEON_FLOOR      */ true,
  /* 5  DUNGEON_WALL       */ false,
  /* 6  DUNGEON_ENTRANCE   */ true,
  /* 7  DUNGEON_EXIT       */ true,
  /* 8  DUNGEON2_FLOOR     */ true,
  /* 9  DUNGEON2_WALL      */ false,
  /* 10 DUNGEON_STAIRS_DOWN*/ true,
  /* 11 DUNGEON2_STAIRS_UP */ true,
  /* 12 TOWN_FLOOR         */ true,
  /* 13 TOWN_BUILDING      */ false,
  /* 14 TOWN_ENTRANCE      */ true,
  /* 15 TOWN_EXIT          */ true,
  /* 16 INN_DOOR           */ true,
  /* 17 OFFICE_DOOR        */ true,
  /* 18 INTERIOR_FLOOR     */ true,
  /* 19 INTERIOR_WALL      */ false,
  /* 20 INTERIOR_EXIT      */ true,
  /* 21 TOWN_MARKET        */ true,
  /* 22 NOTICE_BOARD       */ true,
  /* 23 REEDS              */ true,
  /* 24 EAST_ENTRANCE      */ true,
  /* 25 EAST_EXIT          */ true,
  /* 26 SLUICE_ENTRANCE    */ true,
  /* 27 SLUICE_FLOOR       */ true,
  /* 28 SLUICE_WALL        */ false,
  /* 29 SLUICE_EXIT        */ true,
  /* 30 SLUICE_CHANNEL     */ false,
  /* 31 WEST_ENTRANCE      */ true,
  /* 32 WEST_EXIT          */ true,
  /* 33 TABLE              */ false,
  /* 34 HOUSE_DOOR         */ true,
  /* 35 SCHOOL_DOOR        */ true,
  /* 36 APT_DOOR           */ true,
  /* 37 APT_INTERIOR_DOOR  */ true,
  /* 38 FALSE_WALL        */ true,
  /* 39 MAP2_EXIT         */ true,
  /* 40 MAP2_ENTRANCE     */ true,
  /* 41 MAP3_EXIT         */ true,
  /* 42 MAP3_ENTRANCE     */ true,
  /* 43 NORTH_EXIT        */ true,
  /* 44 NORTH_ENTRANCE    */ true,
  /* 45 NORTH2_EXIT       */ true,
  /* 46 NORTH2_ENTRANCE   */ true,
  /* 47 FEN_N_EXIT        */ true,
  /* 48 FEN_N_ENTRANCE    */ true,
  /* 49 FEN_N2_EXIT       */ true,
  /* 50 FEN_N2_ENTRANCE   */ true,
  /* 51 MAP4_EXIT         */ true,
  /* 52 MAP4_ENTRANCE     */ true,
  /* 53 GUARD_POST        */ true,
  /* 54 FARM_HOUSE        */ true,
  /* 55 MIRE_ENTRANCE     */ true,
  /* 56 MIRE_EXIT         */ true,
  /* 57 BRIDGE_GATE       */ true,
  /* 58 BRIDGE_DECK       */ true,
  /* 59 BRIDGE_EXIT       */ true,
  /* 60 MAP5_EXIT         */ true,
  /* 61 MAP5_ENTRANCE     */ true,
  /* 62 DUNGEON3_FLOOR    */ true,
  /* 63 DUNGEON3_WALL     */ false,
  /* 64 DUNGEON8_WEST_DOOR */ true,
  /* 65 DUNGEON8_WEST_RET  */ true,
  /* 66 DUNGEON8_EAST_DOOR */ true,
  /* 67 DUNGEON8_EAST_RET  */ true,
  /* 68 D3_EAST_PASSAGE    */ true,
  /* 69 D3_WEST_PASSAGE    */ true,
  /* 70 D3_SOUTH_PASSAGE   */ true,
  /* 71 D3_NORTH_PASSAGE   */ true,
  /* 72 DUNGEON_FALSE_WALL  */ true,
  /* 73 WORLD_HOLLOW        */ true,
  /* 74 INTERIOR_FALSE_WALL */ true,
  /* 75 TAKOMO_GATE         */ true,
  /* 76 TAKOMO_EXIT         */ true,
  /* 77 RUIN_FLOOR          */ true,
  /* 78 RUIN_WALL           */ false,
  /* 79 RUIN_STAIRS_DOWN    */ true,
  /* 80 RUIN_EXIT           */ true,
  /* 81 BASIN_MUD           */ true,
  /* 82 NORTH_BASIN_EXIT     */ true,
  /* 83 NORTH_BASIN_ENTRANCE */ true,
  /* 84 (retired — was NORTH_BASIN_C_EXIT,     now EDGE_TRANSITIONS) */ true,
  /* 85 (retired — was NORTH_BASIN_C_ENTRANCE, now EDGE_TRANSITIONS) */ true,
  /* 86 (retired — was NORTH_BASIN_SW_EXIT,     now EDGE_TRANSITIONS) */ true,
  /* 87 (retired — was NORTH_BASIN_SW_ENTRANCE, now EDGE_TRANSITIONS) */ true,
  /* 88 EXPOSED_STONE           */ true,
  /* 89 FENCE_POST              */ false,
  /* 90 NORTH_BASIN_W_EXIT     */ true,
  /* 91 NORTH_BASIN_W_ENTRANCE */ true,
  /* 92 TRAPPER_HUT            */ false,
];

// ─── Expose to global scope ───────────────────────────────────────────────────
window.TILE             = TILE;
window.GRASS            = GRASS;
window.WATER            = WATER;
window.PATH             = PATH;
window.TREE             = TREE;
window.DUNGEON_FLOOR    = DUNGEON_FLOOR;
window.DUNGEON_WALL     = DUNGEON_WALL;
window.DUNGEON_ENTRANCE = DUNGEON_ENTRANCE;
window.DUNGEON_EXIT     = DUNGEON_EXIT;
window.DUNGEON2_FLOOR      = DUNGEON2_FLOOR;
window.DUNGEON2_WALL       = DUNGEON2_WALL;
window.DUNGEON_STAIRS_DOWN = DUNGEON_STAIRS_DOWN;
window.DUNGEON2_STAIRS_UP  = DUNGEON2_STAIRS_UP;
window.TOWN_FLOOR     = TOWN_FLOOR;
window.TOWN_BUILDING  = TOWN_BUILDING;
window.TOWN_ENTRANCE  = TOWN_ENTRANCE;
window.TOWN_EXIT      = TOWN_EXIT;
window.INN_DOOR       = INN_DOOR;
window.OFFICE_DOOR    = OFFICE_DOOR;
window.INTERIOR_FLOOR = INTERIOR_FLOOR;
window.INTERIOR_WALL  = INTERIOR_WALL;
window.INTERIOR_EXIT  = INTERIOR_EXIT;
window.TOWN_MARKET    = TOWN_MARKET;
window.NOTICE_BOARD   = NOTICE_BOARD;
window.REEDS          = REEDS;
window.EAST_ENTRANCE  = EAST_ENTRANCE;
window.EAST_EXIT      = EAST_EXIT;
window.SLUICE_ENTRANCE = SLUICE_ENTRANCE;
window.SLUICE_FLOOR    = SLUICE_FLOOR;
window.SLUICE_WALL     = SLUICE_WALL;
window.SLUICE_EXIT     = SLUICE_EXIT;
window.SLUICE_CHANNEL  = SLUICE_CHANNEL;
window.WEST_ENTRANCE  = WEST_ENTRANCE;
window.WEST_EXIT      = WEST_EXIT;
window.TABLE          = TABLE;
window.HOUSE_DOOR     = HOUSE_DOOR;
window.SCHOOL_DOOR    = SCHOOL_DOOR;
window.APT_DOOR          = APT_DOOR;
window.APT_INTERIOR_DOOR = APT_INTERIOR_DOOR;
window.FALSE_WALL        = FALSE_WALL;
window.MAP2_EXIT         = MAP2_EXIT;
window.MAP2_ENTRANCE     = MAP2_ENTRANCE;
window.MAP3_EXIT         = MAP3_EXIT;
window.MAP3_ENTRANCE     = MAP3_ENTRANCE;
window.NORTH_EXIT        = NORTH_EXIT;
window.NORTH_ENTRANCE    = NORTH_ENTRANCE;
window.NORTH2_EXIT       = NORTH2_EXIT;
window.NORTH2_ENTRANCE   = NORTH2_ENTRANCE;
window.FEN_N_EXIT        = FEN_N_EXIT;
window.FEN_N_ENTRANCE    = FEN_N_ENTRANCE;
window.FEN_N2_EXIT       = FEN_N2_EXIT;
window.FEN_N2_ENTRANCE   = FEN_N2_ENTRANCE;
window.MAP4_EXIT         = MAP4_EXIT;
window.MAP4_ENTRANCE     = MAP4_ENTRANCE;
window.GUARD_POST        = GUARD_POST;
window.FARM_HOUSE        = FARM_HOUSE;
window.MIRE_ENTRANCE     = MIRE_ENTRANCE;
window.MIRE_EXIT         = MIRE_EXIT;
window.BRIDGE_GATE       = BRIDGE_GATE;
window.BRIDGE_DECK       = BRIDGE_DECK;
window.BRIDGE_EXIT       = BRIDGE_EXIT;
window.MAP5_EXIT         = MAP5_EXIT;
window.MAP5_ENTRANCE     = MAP5_ENTRANCE;
window.DUNGEON3_FLOOR    = DUNGEON3_FLOOR;
window.DUNGEON3_WALL     = DUNGEON3_WALL;
window.DUNGEON8_WEST_DOOR = DUNGEON8_WEST_DOOR;
window.DUNGEON8_WEST_RET  = DUNGEON8_WEST_RET;
window.DUNGEON8_EAST_DOOR = DUNGEON8_EAST_DOOR;
window.DUNGEON8_EAST_RET  = DUNGEON8_EAST_RET;
window.D3_EAST_PASSAGE  = D3_EAST_PASSAGE;
window.D3_WEST_PASSAGE  = D3_WEST_PASSAGE;
window.D3_SOUTH_PASSAGE = D3_SOUTH_PASSAGE;
window.D3_NORTH_PASSAGE = D3_NORTH_PASSAGE;
window.DUNGEON_FALSE_WALL  = DUNGEON_FALSE_WALL;
window.WORLD_HOLLOW        = WORLD_HOLLOW;
window.INTERIOR_FALSE_WALL = INTERIOR_FALSE_WALL;
window.TAKOMO_GATE         = TAKOMO_GATE;
window.TAKOMO_EXIT         = TAKOMO_EXIT;
window.RUIN_FLOOR          = RUIN_FLOOR;
window.RUIN_WALL           = RUIN_WALL;
window.RUIN_STAIRS_DOWN    = RUIN_STAIRS_DOWN;
window.RUIN_EXIT           = RUIN_EXIT;
window.BASIN_MUD           = BASIN_MUD;
window.NORTH_BASIN_EXIT     = NORTH_BASIN_EXIT;
window.NORTH_BASIN_ENTRANCE = NORTH_BASIN_ENTRANCE;
window.EXPOSED_STONE           = EXPOSED_STONE;
window.FENCE_POST              = FENCE_POST;
window.NORTH_BASIN_W_EXIT     = NORTH_BASIN_W_EXIT;
window.NORTH_BASIN_W_ENTRANCE = NORTH_BASIN_W_ENTRANCE;
window.TRAPPER_HUT            = TRAPPER_HUT;
window.WALKABLE          = WALKABLE;

// ─── Debug-only: tile ID → constant name lookup ───────────────────────────────
// Used only by the debug map inspector (render-ui.js's drawDebugInspector())
// for a human-readable "tile name" label -- gameplay code always uses the
// numeric tile ID directly and never calls this. An explicit name list
// (rather than scanning `window` for "any ALL_CAPS numeric global") is
// deliberate: `TILE` (=32, pixels per tile) and `WALKABLE` are also
// ALL-CAPS numeric-ish globals defined in this same file, and a handful of
// other files export small ALL-CAPS integer constants too (`COLS`, `ROWS`,
// etc. in state.js) that would otherwise collide with real tile IDs in the
// same numeric range and silently mislabel a tile. This list is exactly
// tiles.js's own `window.X = X` export names (minus TILE/WALKABLE, which
// aren't tile IDs), so it can only ever name real tiles.
const DEBUG_TILE_NAMES = [
  'APT_DOOR',  'APT_INTERIOR_DOOR',  'BASIN_MUD',  'BRIDGE_DECK',  'BRIDGE_EXIT',  'BRIDGE_GATE',
  'D3_EAST_PASSAGE',  'D3_NORTH_PASSAGE',  'D3_SOUTH_PASSAGE',  'D3_WEST_PASSAGE',  'DUNGEON_ENTRANCE',  'DUNGEON_EXIT',
  'DUNGEON_FALSE_WALL',  'DUNGEON_FLOOR',  'DUNGEON_STAIRS_DOWN',  'DUNGEON_WALL',  'DUNGEON2_FLOOR',  'DUNGEON2_STAIRS_UP',
  'DUNGEON2_WALL',  'DUNGEON3_FLOOR',  'DUNGEON3_WALL',  'DUNGEON8_EAST_DOOR',  'DUNGEON8_EAST_RET',  'DUNGEON8_WEST_DOOR',
  'DUNGEON8_WEST_RET',  'EAST_ENTRANCE',  'EAST_EXIT',  'EXPOSED_STONE',  'FALSE_WALL',  'FARM_HOUSE',
  'FEN_N_ENTRANCE',  'FEN_N_EXIT',  'FEN_N2_ENTRANCE',  'FEN_N2_EXIT',  'FENCE_POST',  'GRASS',
  'GUARD_POST',  'HOUSE_DOOR',  'INN_DOOR',  'INTERIOR_EXIT',  'INTERIOR_FALSE_WALL',  'INTERIOR_FLOOR',
  'INTERIOR_WALL',  'MAP2_ENTRANCE',  'MAP2_EXIT',  'MAP3_ENTRANCE',  'MAP3_EXIT',  'MAP4_ENTRANCE',
  'MAP4_EXIT',  'MAP5_ENTRANCE',  'MAP5_EXIT',  'MIRE_ENTRANCE',  'MIRE_EXIT',  'NORTH_BASIN_ENTRANCE',
  'NORTH_BASIN_EXIT',  'NORTH_BASIN_W_ENTRANCE',  'NORTH_BASIN_W_EXIT',  'NORTH_ENTRANCE',  'NORTH_EXIT',  'NORTH2_ENTRANCE',
  'NORTH2_EXIT',  'NOTICE_BOARD',  'OFFICE_DOOR',  'PATH',  'REEDS',  'RUIN_EXIT',
  'RUIN_FLOOR',  'RUIN_STAIRS_DOWN',  'RUIN_WALL',  'SCHOOL_DOOR',  'SLUICE_CHANNEL',  'SLUICE_ENTRANCE',
  'SLUICE_EXIT',  'SLUICE_FLOOR',  'SLUICE_WALL',  'TABLE',  'TAKOMO_EXIT',  'TAKOMO_GATE',
  'TOWN_BUILDING',  'TOWN_ENTRANCE',  'TOWN_EXIT',  'TOWN_FLOOR',  'TOWN_MARKET',  'TRAPPER_HUT',
  'TREE',  'WATER',  'WEST_ENTRANCE',  'WEST_EXIT',  'WORLD_HOLLOW',
];

let _debugTileNameById = null; // lazily built on first call, after every script has loaded
function debugTileName(tileId) {
  if (!_debugTileNameById) {
    _debugTileNameById = new Map();
    for (const name of DEBUG_TILE_NAMES) {
      const val = window[name];
      if (typeof val === 'number' && !_debugTileNameById.has(val)) _debugTileNameById.set(val, name);
    }
  }
  return _debugTileNameById.get(tileId) || null;
}
window.debugTileName = debugTileName;

// ─── Tile properties (terrain metadata registry) ──────────────────────────────
// Central description of what each tile ID *means*, on top of the numeric
// constants above and the WALKABLE[] table. Existing tile IDs, WALKABLE[],
// and drawTile() (render-tiles.js) are unchanged by this -- this is a
// separate, additive metadata layer that describes them, not a replacement
// for any of them.
//
// `walkable` below is always written as `WALKABLE[CONST]` (a live reference
// into the existing array), never a re-typed literal -- this makes it
// impossible for TILE_PROPERTIES to silently drift from WALKABLE, which is
// still the array movement.js's canWalk() ultimately reads (through
// isTileWalkable(), added below, which just wraps WALKABLE[] -- see that
// function's comment for why TILE_PROPERTIES.walkable isn't the source of
// truth for actual collision). validateGameData()'s "Tile Properties"
// group still separately re-checks the two agree, to catch a future edit
// that breaks this invariant (e.g. someone typing `walkable: true` by
// hand instead of `WALKABLE[X]`).
//
// `encounterEligible` describes whether a tile is EVER the "on it, random
// encounters can fire" tile in any of its real contexts -- it is NOT a
// statement that encounters fire on this tile in every map/state it
// appears in. The actual decision is still made by movement.js's
// isEncounterEligibleTile(), which is context-sensitive (current dungeon
// floor, whether you're in a sluice, etc) in ways a single per-tile boolean
// can't capture -- see that function's comment for exactly which branches
// were migrated to read this flag and which remain hand-written dungeon-
// floor-number checks, and why.
const TILE_PROPERTIES = {
  // ── Outdoor / natural ──────────────────────────────────────────────────
  [GRASS]: {
    id: GRASS, name: 'Grass', debugName: 'GRASS', walkable: WALKABLE[GRASS],
    category: 'natural', tags: ['outdoor', 'vegetation'], encounterEligible: true,
  },
  [WATER]: {
    id: WATER, name: 'Water', debugName: 'WATER', walkable: WALKABLE[WATER],
    category: 'water', tags: ['outdoor', 'water'], encounterEligible: false, isWater: true,
  },
  [PATH]: {
    id: PATH, name: 'Path', debugName: 'PATH', walkable: WALKABLE[PATH],
    category: 'road', tags: ['outdoor', 'road'], encounterEligible: false, isRoad: true,
  },
  [TREE]: {
    id: TREE, name: 'Tree', debugName: 'TREE', walkable: WALKABLE[TREE],
    category: 'natural_blocker', tags: ['outdoor', 'tree', 'blocker'], encounterEligible: false,
  },
  [REEDS]: {
    id: REEDS, name: 'Reeds', debugName: 'REEDS', walkable: WALKABLE[REEDS],
    category: 'natural', tags: ['outdoor', 'wetland', 'vegetation'], encounterEligible: true,
    notes: 'Walkable wetland marsh grass -- encounter-eligible same as GRASS in plain outdoor '
         + 'context (isEncounterEligibleTile()\'s only branch that reads this flag); still '
         + 'excluded everywhere else (town/dungeon/sluice/etc) by that function\'s own '
         + 'state-flag gating, same as GRASS is.',
  },

  // ── Dungeon (floor 1/3/5/7 stone, floor 2/4/6/8 stone, horror-branch 9/10) ─
  [DUNGEON_FLOOR]: {
    id: DUNGEON_FLOOR, name: 'Dungeon Floor', debugName: 'DUNGEON_FLOOR', walkable: WALKABLE[DUNGEON_FLOOR],
    category: 'dungeon_floor', tags: ['dungeon', 'floor'], encounterEligible: true, isDungeon: true,
  },
  [DUNGEON_WALL]: {
    id: DUNGEON_WALL, name: 'Dungeon Wall', debugName: 'DUNGEON_WALL', walkable: WALKABLE[DUNGEON_WALL],
    category: 'dungeon_wall', tags: ['dungeon', 'wall'], encounterEligible: false, isDungeon: true, isWall: true,
  },
  [DUNGEON_ENTRANCE]: {
    id: DUNGEON_ENTRANCE, name: 'Dungeon Entrance', debugName: 'DUNGEON_ENTRANCE', walkable: WALKABLE[DUNGEON_ENTRANCE],
    category: 'transition', tags: ['dungeon', 'transition'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [DUNGEON_EXIT]: {
    id: DUNGEON_EXIT, name: 'Dungeon Exit', debugName: 'DUNGEON_EXIT', walkable: WALKABLE[DUNGEON_EXIT],
    category: 'transition', tags: ['dungeon', 'transition'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [DUNGEON2_FLOOR]: {
    id: DUNGEON2_FLOOR, name: 'Dungeon Floor (2nd style)', debugName: 'DUNGEON2_FLOOR', walkable: WALKABLE[DUNGEON2_FLOOR],
    category: 'dungeon_floor', tags: ['dungeon', 'floor'], encounterEligible: true, isDungeon: true,
  },
  [DUNGEON2_WALL]: {
    id: DUNGEON2_WALL, name: 'Dungeon Wall (2nd style)', debugName: 'DUNGEON2_WALL', walkable: WALKABLE[DUNGEON2_WALL],
    category: 'dungeon_wall', tags: ['dungeon', 'wall'], encounterEligible: false, isDungeon: true, isWall: true,
  },
  [DUNGEON_STAIRS_DOWN]: {
    id: DUNGEON_STAIRS_DOWN, name: 'Stairs Down', debugName: 'DUNGEON_STAIRS_DOWN', walkable: WALKABLE[DUNGEON_STAIRS_DOWN],
    category: 'transition', tags: ['dungeon', 'transition', 'stairs'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [DUNGEON2_STAIRS_UP]: {
    id: DUNGEON2_STAIRS_UP, name: 'Stairs Up', debugName: 'DUNGEON2_STAIRS_UP', walkable: WALKABLE[DUNGEON2_STAIRS_UP],
    category: 'transition', tags: ['dungeon', 'transition', 'stairs'], encounterEligible: false, isDungeon: true, isTransition: true,
  },

  // ── Town (Calwick / Drenwick exteriors) ─────────────────────────────────
  [TOWN_FLOOR]: {
    id: TOWN_FLOOR, name: 'Town Street', debugName: 'TOWN_FLOOR', walkable: WALKABLE[TOWN_FLOOR],
    category: 'road', tags: ['town', 'road'], encounterEligible: false, isRoad: true,
  },
  [TOWN_BUILDING]: {
    id: TOWN_BUILDING, name: 'Town Building', debugName: 'TOWN_BUILDING', walkable: WALKABLE[TOWN_BUILDING],
    category: 'town_blocker', tags: ['town', 'building', 'blocker'], encounterEligible: false,
  },
  [TOWN_ENTRANCE]: {
    id: TOWN_ENTRANCE, name: 'Town Entrance', debugName: 'TOWN_ENTRANCE', walkable: WALKABLE[TOWN_ENTRANCE],
    category: 'transition', tags: ['town', 'transition'], encounterEligible: false, isTransition: true,
  },
  [TOWN_EXIT]: {
    id: TOWN_EXIT, name: 'Town Exit', debugName: 'TOWN_EXIT', walkable: WALKABLE[TOWN_EXIT],
    category: 'transition', tags: ['town', 'transition'], encounterEligible: false, isTransition: true,
  },
  [INN_DOOR]: {
    id: INN_DOOR, name: 'Inn Door', debugName: 'INN_DOOR', walkable: WALKABLE[INN_DOOR],
    category: 'transition', tags: ['town', 'door', 'transition'], encounterEligible: false, isTransition: true,
  },
  [OFFICE_DOOR]: {
    id: OFFICE_DOOR, name: 'Office Door', debugName: 'OFFICE_DOOR', walkable: WALKABLE[OFFICE_DOOR],
    category: 'transition', tags: ['town', 'door', 'transition'], encounterEligible: false, isTransition: true,
  },
  [TOWN_MARKET]: {
    id: TOWN_MARKET, name: 'Market Square', debugName: 'TOWN_MARKET', walkable: WALKABLE[TOWN_MARKET],
    category: 'road', tags: ['town', 'road'], encounterEligible: false, isRoad: true,
  },
  [NOTICE_BOARD]: {
    id: NOTICE_BOARD, name: 'Notice Board', debugName: 'NOTICE_BOARD', walkable: WALKABLE[NOTICE_BOARD],
    category: 'decorative', tags: ['town', 'decorative'], encounterEligible: false, isDecorative: true,
    notes: 'Intentionally walkable despite being decorative -- it\u2019s a stand-in-front-of-it interactable, not a blocker.',
  },
  [EAST_ENTRANCE]: {
    id: EAST_ENTRANCE, name: 'East Calwick Entrance', debugName: 'EAST_ENTRANCE', walkable: WALKABLE[EAST_ENTRANCE],
    category: 'transition', tags: ['town', 'transition'], encounterEligible: false, isTransition: true,
  },
  [EAST_EXIT]: {
    id: EAST_EXIT, name: 'East Calwick Exit', debugName: 'EAST_EXIT', walkable: WALKABLE[EAST_EXIT],
    category: 'transition', tags: ['town', 'transition'], encounterEligible: false, isTransition: true,
  },
  [WEST_ENTRANCE]: {
    id: WEST_ENTRANCE, name: 'West Calwick Entrance', debugName: 'WEST_ENTRANCE', walkable: WALKABLE[WEST_ENTRANCE],
    category: 'transition', tags: ['town', 'transition'], encounterEligible: false, isTransition: true,
  },
  [WEST_EXIT]: {
    id: WEST_EXIT, name: 'West Calwick Exit', debugName: 'WEST_EXIT', walkable: WALKABLE[WEST_EXIT],
    category: 'transition', tags: ['town', 'transition'], encounterEligible: false, isTransition: true,
  },

  // ── East Sluice ──────────────────────────────────────────────────────────
  [SLUICE_ENTRANCE]: {
    id: SLUICE_ENTRANCE, name: 'Sluice Entrance', debugName: 'SLUICE_ENTRANCE', walkable: WALKABLE[SLUICE_ENTRANCE],
    category: 'transition', tags: ['sluice', 'transition'], encounterEligible: false, isTransition: true,
  },
  [SLUICE_FLOOR]: {
    id: SLUICE_FLOOR, name: 'Sluice Floor', debugName: 'SLUICE_FLOOR', walkable: WALKABLE[SLUICE_FLOOR],
    category: 'dungeon_floor', tags: ['sluice', 'floor'], encounterEligible: true,
  },
  [SLUICE_WALL]: {
    id: SLUICE_WALL, name: 'Sluice Wall', debugName: 'SLUICE_WALL', walkable: WALKABLE[SLUICE_WALL],
    category: 'dungeon_wall', tags: ['sluice', 'wall'], encounterEligible: false, isWall: true,
  },
  [SLUICE_EXIT]: {
    id: SLUICE_EXIT, name: 'Sluice Exit', debugName: 'SLUICE_EXIT', walkable: WALKABLE[SLUICE_EXIT],
    category: 'transition', tags: ['sluice', 'transition'], encounterEligible: false, isTransition: true,
  },
  [SLUICE_CHANNEL]: {
    id: SLUICE_CHANNEL, name: 'Sluice Channel', debugName: 'SLUICE_CHANNEL', walkable: WALKABLE[SLUICE_CHANNEL],
    category: 'water', tags: ['sluice', 'water', 'blocker'], encounterEligible: false, isWater: true,
    notes: 'Drainage channel -- impassable, functions like an interior water hazard rather than a wall.',
  },

  // ── Furniture / interiors ────────────────────────────────────────────────
  [TABLE]: {
    id: TABLE, name: 'Table', debugName: 'TABLE', walkable: WALKABLE[TABLE],
    category: 'furniture', tags: ['interior', 'furniture', 'blocker'], encounterEligible: false, isDecorative: true,
  },
  [HOUSE_DOOR]: {
    id: HOUSE_DOOR, name: 'House Door', debugName: 'HOUSE_DOOR', walkable: WALKABLE[HOUSE_DOOR],
    category: 'transition', tags: ['town', 'door', 'transition'], encounterEligible: false, isTransition: true,
  },
  [SCHOOL_DOOR]: {
    id: SCHOOL_DOOR, name: 'School Door', debugName: 'SCHOOL_DOOR', walkable: WALKABLE[SCHOOL_DOOR],
    category: 'transition', tags: ['town', 'door', 'transition'], encounterEligible: false, isTransition: true,
  },
  [INTERIOR_FLOOR]: {
    id: INTERIOR_FLOOR, name: 'Interior Floor', debugName: 'INTERIOR_FLOOR', walkable: WALKABLE[INTERIOR_FLOOR],
    category: 'interior_floor', tags: ['interior', 'floor'], encounterEligible: false, isInterior: true,
  },
  [INTERIOR_WALL]: {
    id: INTERIOR_WALL, name: 'Interior Wall', debugName: 'INTERIOR_WALL', walkable: WALKABLE[INTERIOR_WALL],
    category: 'interior_wall', tags: ['interior', 'wall'], encounterEligible: false, isInterior: true, isWall: true,
  },
  [INTERIOR_EXIT]: {
    id: INTERIOR_EXIT, name: 'Interior Exit', debugName: 'INTERIOR_EXIT', walkable: WALKABLE[INTERIOR_EXIT],
    category: 'transition', tags: ['interior', 'transition'], encounterEligible: false, isInterior: true, isTransition: true,
  },
  [APT_DOOR]: {
    id: APT_DOOR, name: 'Apartment Door', debugName: 'APT_DOOR', walkable: WALKABLE[APT_DOOR],
    category: 'transition', tags: ['town', 'door', 'transition'], encounterEligible: false, isTransition: true,
  },
  [APT_INTERIOR_DOOR]: {
    id: APT_INTERIOR_DOOR, name: 'Apartment Interior Door', debugName: 'APT_INTERIOR_DOOR', walkable: WALKABLE[APT_INTERIOR_DOOR],
    category: 'transition', tags: ['interior', 'door', 'transition'], encounterEligible: false, isInterior: true, isTransition: true,
  },

  // ── Secret passages (look like a wall/tree/building, walkable) ──────────
  [FALSE_WALL]: {
    id: FALSE_WALL, name: 'False Wall', debugName: 'FALSE_WALL', walkable: WALKABLE[FALSE_WALL],
    category: 'secret_passage', tags: ['sluice', 'secret'], encounterEligible: false, isSecret: true,
    notes: 'Renders like SLUICE_WALL but is walkable -- secret passage.',
  },
  [DUNGEON_FALSE_WALL]: {
    id: DUNGEON_FALSE_WALL, name: 'Dungeon False Wall', debugName: 'DUNGEON_FALSE_WALL', walkable: WALKABLE[DUNGEON_FALSE_WALL],
    category: 'secret_passage', tags: ['dungeon', 'secret'], encounterEligible: false, isDungeon: true, isSecret: true,
    notes: 'Renders like DUNGEON_WALL but is walkable -- secret passage.',
  },
  [WORLD_HOLLOW]: {
    id: WORLD_HOLLOW, name: 'World Hollow', debugName: 'WORLD_HOLLOW', walkable: WALKABLE[WORLD_HOLLOW],
    category: 'secret_passage', tags: ['outdoor', 'secret'], encounterEligible: false, isSecret: true,
    notes: 'Renders like TREE but is walkable -- overworld hidden path.',
  },
  [INTERIOR_FALSE_WALL]: {
    id: INTERIOR_FALSE_WALL, name: 'Interior False Wall', debugName: 'INTERIOR_FALSE_WALL', walkable: WALKABLE[INTERIOR_FALSE_WALL],
    category: 'secret_passage', tags: ['interior', 'secret'], encounterEligible: false, isInterior: true, isSecret: true,
    notes: 'Renders like INTERIOR_WALL but is walkable -- house secret passage.',
  },
  [TAKOMO_GATE]: {
    id: TAKOMO_GATE, name: 'Takomo Gate', debugName: 'TAKOMO_GATE', walkable: WALKABLE[TAKOMO_GATE],
    category: 'secret_passage', tags: ['town', 'secret', 'transition'], encounterEligible: false, isSecret: true, isTransition: true,
    notes: 'Renders like TOWN_BUILDING but is walkable -- Drenwick secret entrance.',
  },
  [TAKOMO_EXIT]: {
    id: TAKOMO_EXIT, name: 'Takomo Exit', debugName: 'TAKOMO_EXIT', walkable: WALKABLE[TAKOMO_EXIT],
    category: 'transition', tags: ['town', 'transition'], encounterEligible: false, isTransition: true,
  },

  // ── World-map point transitions (overworld square-to-square) ───────────
  [MAP2_EXIT]:     { id: MAP2_EXIT,     name: 'Map2 Exit',     debugName: 'MAP2_EXIT',     walkable: WALKABLE[MAP2_EXIT],     category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [MAP2_ENTRANCE]: { id: MAP2_ENTRANCE, name: 'Map2 Entrance', debugName: 'MAP2_ENTRANCE', walkable: WALKABLE[MAP2_ENTRANCE], category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [MAP3_EXIT]:     { id: MAP3_EXIT,     name: 'Map3 Exit',     debugName: 'MAP3_EXIT',     walkable: WALKABLE[MAP3_EXIT],     category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [MAP3_ENTRANCE]: { id: MAP3_ENTRANCE, name: 'Map3 Entrance', debugName: 'MAP3_ENTRANCE', walkable: WALKABLE[MAP3_ENTRANCE], category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [NORTH_EXIT]:     { id: NORTH_EXIT,     name: 'North Exit',     debugName: 'NORTH_EXIT',     walkable: WALKABLE[NORTH_EXIT],     category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [NORTH_ENTRANCE]: { id: NORTH_ENTRANCE, name: 'North Entrance', debugName: 'NORTH_ENTRANCE', walkable: WALKABLE[NORTH_ENTRANCE], category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [NORTH2_EXIT]:     { id: NORTH2_EXIT,     name: 'North2 Exit',     debugName: 'NORTH2_EXIT',     walkable: WALKABLE[NORTH2_EXIT],     category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [NORTH2_ENTRANCE]: { id: NORTH2_ENTRANCE, name: 'North2 Entrance', debugName: 'NORTH2_ENTRANCE', walkable: WALKABLE[NORTH2_ENTRANCE], category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [FEN_N_EXIT]:     { id: FEN_N_EXIT,     name: 'Fen North Exit',     debugName: 'FEN_N_EXIT',     walkable: WALKABLE[FEN_N_EXIT],     category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [FEN_N_ENTRANCE]: { id: FEN_N_ENTRANCE, name: 'Fen North Entrance', debugName: 'FEN_N_ENTRANCE', walkable: WALKABLE[FEN_N_ENTRANCE], category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [FEN_N2_EXIT]:     { id: FEN_N2_EXIT,     name: 'Fen North2 Exit',     debugName: 'FEN_N2_EXIT',     walkable: WALKABLE[FEN_N2_EXIT],     category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [FEN_N2_ENTRANCE]: { id: FEN_N2_ENTRANCE, name: 'Fen North2 Entrance', debugName: 'FEN_N2_ENTRANCE', walkable: WALKABLE[FEN_N2_ENTRANCE], category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [MAP4_EXIT]:     { id: MAP4_EXIT,     name: 'Map4 Exit',     debugName: 'MAP4_EXIT',     walkable: WALKABLE[MAP4_EXIT],     category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [MAP4_ENTRANCE]: { id: MAP4_ENTRANCE, name: 'Map4 Entrance', debugName: 'MAP4_ENTRANCE', walkable: WALKABLE[MAP4_ENTRANCE], category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [MAP5_EXIT]:     { id: MAP5_EXIT,     name: 'Map5 Exit',     debugName: 'MAP5_EXIT',     walkable: WALKABLE[MAP5_EXIT],     category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },
  [MAP5_ENTRANCE]: { id: MAP5_ENTRANCE, name: 'Map5 Entrance', debugName: 'MAP5_ENTRANCE', walkable: WALKABLE[MAP5_ENTRANCE], category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true },

  // ── Outdoor building-entry huts ─────────────────────────────────────────
  [GUARD_POST]: {
    id: GUARD_POST, name: 'Guard Post', debugName: 'GUARD_POST', walkable: WALKABLE[GUARD_POST],
    category: 'transition', tags: ['outdoor', 'building', 'transition'], encounterEligible: false, isTransition: true,
  },
  [FARM_HOUSE]: {
    id: FARM_HOUSE, name: 'Farm House', debugName: 'FARM_HOUSE', walkable: WALKABLE[FARM_HOUSE],
    category: 'transition', tags: ['outdoor', 'building', 'transition'], encounterEligible: false, isTransition: true,
  },
  [MIRE_ENTRANCE]: {
    id: MIRE_ENTRANCE, name: 'Mire Entrance', debugName: 'MIRE_ENTRANCE', walkable: WALKABLE[MIRE_ENTRANCE],
    category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true,
  },
  [MIRE_EXIT]: {
    id: MIRE_EXIT, name: 'Mire Exit', debugName: 'MIRE_EXIT', walkable: WALKABLE[MIRE_EXIT],
    category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true,
  },

  // ── Imperial toll bridge ─────────────────────────────────────────────────
  [BRIDGE_GATE]: {
    id: BRIDGE_GATE, name: 'Bridge Gate', debugName: 'BRIDGE_GATE', walkable: WALKABLE[BRIDGE_GATE],
    category: 'transition', tags: ['bridge', 'transition'], encounterEligible: false, isTransition: true,
  },
  [BRIDGE_DECK]: {
    id: BRIDGE_DECK, name: 'Bridge Deck', debugName: 'BRIDGE_DECK', walkable: WALKABLE[BRIDGE_DECK],
    category: 'road', tags: ['bridge', 'road'], encounterEligible: false, isRoad: true,
  },
  [BRIDGE_EXIT]: {
    id: BRIDGE_EXIT, name: 'Bridge Exit', debugName: 'BRIDGE_EXIT', walkable: WALKABLE[BRIDGE_EXIT],
    category: 'transition', tags: ['bridge', 'transition'], encounterEligible: false, isTransition: true,
  },

  // ── Horror-branch dungeon (floors 9-10) + floor-3/8 sub-rooms ────────────
  [DUNGEON3_FLOOR]: {
    id: DUNGEON3_FLOOR, name: 'Dungeon Floor (horror)', debugName: 'DUNGEON3_FLOOR', walkable: WALKABLE[DUNGEON3_FLOOR],
    category: 'dungeon_floor', tags: ['dungeon', 'floor', 'horror'], encounterEligible: true, isDungeon: true,
  },
  [DUNGEON3_WALL]: {
    id: DUNGEON3_WALL, name: 'Dungeon Wall (horror)', debugName: 'DUNGEON3_WALL', walkable: WALKABLE[DUNGEON3_WALL],
    category: 'dungeon_wall', tags: ['dungeon', 'wall', 'horror'], encounterEligible: false, isDungeon: true, isWall: true,
  },
  [DUNGEON8_WEST_DOOR]: {
    id: DUNGEON8_WEST_DOOR, name: 'West Branch Door', debugName: 'DUNGEON8_WEST_DOOR', walkable: WALKABLE[DUNGEON8_WEST_DOOR],
    category: 'transition', tags: ['dungeon', 'transition'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [DUNGEON8_WEST_RET]: {
    id: DUNGEON8_WEST_RET, name: 'West Branch Return', debugName: 'DUNGEON8_WEST_RET', walkable: WALKABLE[DUNGEON8_WEST_RET],
    category: 'transition', tags: ['dungeon', 'transition'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [DUNGEON8_EAST_DOOR]: {
    id: DUNGEON8_EAST_DOOR, name: 'East Branch Door', debugName: 'DUNGEON8_EAST_DOOR', walkable: WALKABLE[DUNGEON8_EAST_DOOR],
    category: 'transition', tags: ['dungeon', 'transition'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [DUNGEON8_EAST_RET]: {
    id: DUNGEON8_EAST_RET, name: 'East Branch Return', debugName: 'DUNGEON8_EAST_RET', walkable: WALKABLE[DUNGEON8_EAST_RET],
    category: 'transition', tags: ['dungeon', 'transition'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [D3_EAST_PASSAGE]: {
    id: D3_EAST_PASSAGE, name: 'Sub-room East Passage', debugName: 'D3_EAST_PASSAGE', walkable: WALKABLE[D3_EAST_PASSAGE],
    category: 'transition', tags: ['dungeon', 'transition', 'passage'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [D3_WEST_PASSAGE]: {
    id: D3_WEST_PASSAGE, name: 'Sub-room West Passage', debugName: 'D3_WEST_PASSAGE', walkable: WALKABLE[D3_WEST_PASSAGE],
    category: 'transition', tags: ['dungeon', 'transition', 'passage'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [D3_SOUTH_PASSAGE]: {
    id: D3_SOUTH_PASSAGE, name: 'Sub-room South Passage', debugName: 'D3_SOUTH_PASSAGE', walkable: WALKABLE[D3_SOUTH_PASSAGE],
    category: 'transition', tags: ['dungeon', 'transition', 'passage'], encounterEligible: false, isDungeon: true, isTransition: true,
  },
  [D3_NORTH_PASSAGE]: {
    id: D3_NORTH_PASSAGE, name: 'Sub-room North Passage', debugName: 'D3_NORTH_PASSAGE', walkable: WALKABLE[D3_NORTH_PASSAGE],
    category: 'transition', tags: ['dungeon', 'transition', 'passage'], encounterEligible: false, isDungeon: true, isTransition: true,
  },

  // ── South Ruins -- Entrance Hall (encounter-free by inDungeonEntrance) ───
  [RUIN_FLOOR]: {
    id: RUIN_FLOOR, name: 'Ruin Floor', debugName: 'RUIN_FLOOR', walkable: WALKABLE[RUIN_FLOOR],
    category: 'ruin_floor', tags: ['ruin', 'floor'], encounterEligible: false,
    notes: 'The South Ruins Entrance Hall is deliberately encounter-free (see inDungeonEntrance in isEncounterEligibleTile()).',
  },
  [RUIN_WALL]: {
    id: RUIN_WALL, name: 'Ruin Wall', debugName: 'RUIN_WALL', walkable: WALKABLE[RUIN_WALL],
    category: 'ruin_wall', tags: ['ruin', 'wall'], encounterEligible: false, isWall: true,
  },
  [RUIN_STAIRS_DOWN]: {
    id: RUIN_STAIRS_DOWN, name: 'Ruin Stairs Down', debugName: 'RUIN_STAIRS_DOWN', walkable: WALKABLE[RUIN_STAIRS_DOWN],
    category: 'transition', tags: ['ruin', 'transition', 'stairs'], encounterEligible: false, isTransition: true,
  },
  [RUIN_EXIT]: {
    id: RUIN_EXIT, name: 'Ruin Exit', debugName: 'RUIN_EXIT', walkable: WALKABLE[RUIN_EXIT],
    category: 'transition', tags: ['ruin', 'transition'], encounterEligible: false, isTransition: true,
  },

  // ── North Basin (South Approach / Reservoir / Silt Flats / Badlands) ────
  [BASIN_MUD]: {
    id: BASIN_MUD, name: 'Basin Mud', debugName: 'BASIN_MUD', walkable: WALKABLE[BASIN_MUD],
    category: 'natural', tags: ['outdoor', 'wetland', 'mud'], encounterEligible: false,
    notes: 'Drought-cracked wetland mud -- walkable, deliberately outside the encounter check (not GRASS).',
  },
  [NORTH_BASIN_EXIT]: {
    id: NORTH_BASIN_EXIT, name: 'North Basin Exit', debugName: 'NORTH_BASIN_EXIT', walkable: WALKABLE[NORTH_BASIN_EXIT],
    category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true,
  },
  [NORTH_BASIN_ENTRANCE]: {
    id: NORTH_BASIN_ENTRANCE, name: 'North Basin Entrance', debugName: 'NORTH_BASIN_ENTRANCE', walkable: WALKABLE[NORTH_BASIN_ENTRANCE],
    category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true,
  },
  [EXPOSED_STONE]: {
    id: EXPOSED_STONE, name: 'Exposed Stone', debugName: 'EXPOSED_STONE', walkable: WALKABLE[EXPOSED_STONE],
    category: 'natural', tags: ['outdoor', 'rock'], encounterEligible: false,
    notes: 'Dried-out rocky lakebed patches -- walkable, not GRASS, no encounters.',
  },
  [FENCE_POST]: {
    id: FENCE_POST, name: 'Fence Post', debugName: 'FENCE_POST', walkable: WALKABLE[FENCE_POST],
    category: 'decorative_blocker', tags: ['outdoor', 'decorative', 'blocker'], encounterEligible: false, isDecorative: true,
  },
  [NORTH_BASIN_W_EXIT]: {
    id: NORTH_BASIN_W_EXIT, name: 'North Basin West Exit', debugName: 'NORTH_BASIN_W_EXIT', walkable: WALKABLE[NORTH_BASIN_W_EXIT],
    category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true,
  },
  [NORTH_BASIN_W_ENTRANCE]: {
    id: NORTH_BASIN_W_ENTRANCE, name: 'North Basin West Entrance', debugName: 'NORTH_BASIN_W_ENTRANCE', walkable: WALKABLE[NORTH_BASIN_W_ENTRANCE],
    category: 'transition', tags: ['outdoor', 'transition'], encounterEligible: false, isTransition: true,
  },
  [TRAPPER_HUT]: {
    id: TRAPPER_HUT, name: 'Trapper\u2019s Hut', debugName: 'TRAPPER_HUT', walkable: WALKABLE[TRAPPER_HUT],
    category: 'decorative_blocker', tags: ['outdoor', 'decorative', 'blocker', 'building'], encounterEligible: false, isDecorative: true,
  },

  // ── Retired tile IDs (84-87) -- no constant, unused in every map, kept in
  // WALKABLE[] only so the array doesn't need re-indexing. Given explicit
  // entries here (rather than just being "unknown") so validateTiles() can
  // report a specific "deprecated tile used" error, distinct from a plain
  // "unknown tile", if one of these numbers is ever accidentally reused. ──
  84: { id: 84, name: 'Retired (former NORTH_BASIN_C_EXIT)',     debugName: null, walkable: WALKABLE[84], category: 'retired', tags: ['retired'], encounterEligible: false, deprecated: true },
  85: { id: 85, name: 'Retired (former NORTH_BASIN_C_ENTRANCE)', debugName: null, walkable: WALKABLE[85], category: 'retired', tags: ['retired'], encounterEligible: false, deprecated: true },
  86: { id: 86, name: 'Retired (former NORTH_BASIN_SW_EXIT)',    debugName: null, walkable: WALKABLE[86], category: 'retired', tags: ['retired'], encounterEligible: false, deprecated: true },
  87: { id: 87, name: 'Retired (former NORTH_BASIN_SW_ENTRANCE)',debugName: null, walkable: WALKABLE[87], category: 'retired', tags: ['retired'], encounterEligible: false, deprecated: true },
};
window.TILE_PROPERTIES = TILE_PROPERTIES;

// ─── Tile helper functions ─────────────────────────────────────────────────────
// All of these handle an unknown tile ID (no TILE_PROPERTIES entry) safely,
// returning a sensible default rather than throwing -- validateGameData()
// (not these helpers) is where an unknown tile ID becomes a visible error.

function getTileProperties(tileId) {
  return TILE_PROPERTIES[tileId] || null;
}

function getTileName(tileId) {
  const props = TILE_PROPERTIES[tileId];
  if (props && props.name) return props.name;
  return debugTileName(tileId); // null if truly unknown
}

// The actual source of truth for collision is still WALKABLE[] (unchanged,
// still hand-maintained in lockstep with the tile ID list above) -- this
// wraps it rather than reading TILE_PROPERTIES.walkable, so a mistake made
// while hand-authoring a TILE_PROPERTIES entry can never change real
// collision behavior; validateGameData() separately errors if the two ever
// disagree. `=== true` (not a truthiness check) so an unknown tile ID
// (WALKABLE[id] is undefined) safely returns false, exactly matching the
// old `!WALKABLE[tile]` "blocks movement" behavior for an unrecognised tile.
function isTileWalkable(tileId) {
  return WALKABLE[tileId] === true;
}

function isTileEncounterEligible(tileId, context) {
  // `context` is currently unused -- reserved for a future, more granular
  // per-context lookup (e.g. "eligible when outdoor" vs "eligible on
  // dungeon floor N") if that's ever worth centralizing; today the real
  // per-context logic lives in movement.js's isEncounterEligibleTile(),
  // which calls this helper only for the one context-independent case
  // (see that function's comment).
  const props = TILE_PROPERTIES[tileId];
  return !!(props && props.encounterEligible);
}

function tileHasTag(tileId, tag) {
  const props = TILE_PROPERTIES[tileId];
  return !!(props && Array.isArray(props.tags) && props.tags.includes(tag));
}

function isWaterTile(tileId) {
  const props = TILE_PROPERTIES[tileId];
  return !!(props && props.isWater);
}

function isRoadTile(tileId) {
  const props = TILE_PROPERTIES[tileId];
  return !!(props && props.isRoad);
}

function isTransitionTile(tileId) {
  const props = TILE_PROPERTIES[tileId];
  return !!(props && props.isTransition);
}

window.getTileProperties       = getTileProperties;
window.getTileName             = getTileName;
window.isTileWalkable           = isTileWalkable;
window.isTileEncounterEligible  = isTileEncounterEligible;
window.tileHasTag                = tileHasTag;
window.isWaterTile               = isWaterTile;
window.isRoadTile                = isRoadTile;
window.isTransitionTile          = isTransitionTile;
