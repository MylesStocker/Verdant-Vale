'use strict';

// Drenwick maps: approach, bridge, districts, dedicated Drenwick buildings.
// Region content moved verbatim from maps.js by the regional-content-split.
// Loaded BEFORE maps.js, which keeps MAP_REGISTRY, window.* exports, and mapRegistryId().
// ─── Drenwick — MAP3_N2  (16 × 15) ───────────────────────────────────────────
// Connected south to MAP3_N1 via an open EDGE_TRANSITIONS crossing: row 14,
// cols 3-13 (open fen, road at col 8 through the middle) — see
// EDGE_TRANSITIONS['MAP3_N2'].south. Replaced the old single FEN_N2_ENTRANCE tile.
// Drenwick south gate: single TOWN_ENTRANCE tile at row 6 col 8.
// Canal runs east-west at row 5 (north of the gate).
// Imperial toll bridge (BRIDGE_GATE) at row 5 col 12; northeast of Drenwick gate.
// Approach spur: PATH at row 7 cols 9-12 (branches east off main road), row 6 col 12 (north to bridge).
// Moving north onto BRIDGE_GATE enters the toll checkpoint; crossing south is free.
// Rows 1-4 north of canal: open marsh/fen. Rows 7-13 south: fen approach with road at col 8.
// Col 12, rows 1-4: causeway path continuing north from the bridge's north
// landing (exitBridgeNorth() lands at row 4 col 12) up to a new NORTH_BASIN_EXIT
// at row 0 col 12 — the bridge is the hinge between the town/canal road and
// the North Basin road. This replaced what used to be the corner of the bog
// pond at row 1 col 12 (a one-tile causeway across it) plus reeds/grass at
// rows 2-3 col 12 (now paved as part of the same through-road).
const MAP3_N2 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  1,  3,  3,  3,  3,  3,  1,  2,  1,  1,  1],  //  0  border ← col 12 = north seam → NORTH_BASIN_S_MAP.south (continuous causeway); marsh gaps (cols 5, 11) + bog pond E off-map (cols 13-15)
  [  3,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0, 23,  2,  1, 23,  1],  //  1  N marsh: bog pond E; col 12 = causeway path; water E edge
  [  3,  0, 23,  1, 23,  0,  0,  0,  0,  0,  0,  0,  2,  1, 23,  1],  //  2  bog pond W + bog pond E; col 12 = path; water E edge
  [  3,  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  2, 23,  0,  3],  //  3  reeds, clearing; col 12 = path
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  2,  0,  0,  3],  //  4  open, N canal bank; col 12 = path (bridge north landing)
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 57,  1,  1,  1],  //  5  canal WATER, flowing off-map both W and E; BRIDGE_GATE col 12
  [  3,  0,  0,  0,  0,  0,  0,  0, 14,  0,  0,  0,  2,  0,  0,  3],  //  6  Drenwick south gate col 8; approach path col 12
  [  3,  0,  0,  0,  0,  0,  0,  0,  2,  2,  2,  2,  2,  0,  0,  3],  //  7  road col 8; E-W spur cols 9-12 to bridge approach
  [  3,  0, 23,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  8  reeds W
  [  3,  0,  1, 23,  0,  0,  0,  0,  2,  0,  0,  0,  0, 23,  0,  3],  //  9  bog W + reeds E
  [  3,  0, 23,  0,  0,  0,  0,  0,  2,  0,  0, 23,  1,  1, 23,  1],  // 10  bog E, draining off-map east
  [  3,  0,  0,  0, 23,  0,  0,  0,  2,  0,  0, 23,  1, 23,  0,  3],  // 11  reeds + bog E
  [  3,  0,  0,  0,  0,  0,  0,  0,  2,  0,  0, 53, 23,  0,  0,  3],  // 12  GUARD_POST c11; reeds c12
  [  3,  0,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  3],  // 13  open approach
  [  3,  3,  3, 23, 23, 23, 23, 23,  2, 23, 23, 23, 23, 23,  3,  3],  // 14  open-fen crossing cols 3-13 (road at col 8) → EDGE_TRANSITIONS south to MAP3_N1 (Northern Fen)
];

// ─── Drenwick Guard Post Interior  (16 × 15) ─────────────────────────────────
// Imperial checkpoint on MAP3_N1 row 9 col 13 (GUARD_POST tile).
// Same floor plan as MAREN_POST_MAP. Exit: col 7 row 11.
// Constable Tarvec: col 7 row 4. Equipment ledger on TABLE at col 6 row 7.
const DRENWICK_POST_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2  thick top wall
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  3  interior cols 5-10
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  4  Tarvec c7 ✓
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  5
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  6
  [ 19, 19, 19, 19, 19, 18, 33, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  7  TABLE c6 (equipment ledger)
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  8
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  9
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  // 10  last floor row
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 11  INTERIOR_EXIT c7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 12
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14  bottom wall
];

// ─── Imperial Bridge Checkpoint  (16 × 15) ───────────────────────────────────
// Outdoor canal crossing northeast of Drenwick (MAP3_N2 row 5 col 12).
// Bridge planks (BRIDGE_DECK=58) span the water at rows 5-6, col 7.
// BRIDGE_EXIT (59) at row 0 (north) and row 14 (south) — stepping on either
//   triggers return to MAP3_N2 (row 4 col 12 from north, row 6 col 12 from south).
// TOLL GUARDS (Phase 1 NPC-movement pilot): each soldier stands directly on
// his bank's one-tile bridge approach (col 7, the row adjoining the deck) —
// the canal is impassable everywhere else, so the guard's solid body is the
// physical reason the player cannot cross before paying. No fences needed.
// bridge_soldier_north at col 7 row 4: facing down, steps RIGHT to col 8.
// bridge_soldier_south at col 7 row 7: facing up,   steps LEFT  to col 6.
// Player entering from south spawns at row 13; from north at row 1.
const BRIDGE_CROSSING_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3, 59,  3,  3,  3,  3,  3,  3,  3,  3],  //  0  BRIDGE_EXIT north col 7
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  1  N bank; player entry from north
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  2  N bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  3  N bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  4  N bridge approach; bridge_soldier_north at c7 (aside: c8)
  [  1,  1,  1,  1,  1,  1,  1, 58,  1,  1,  1,  1,  1,  1,  1,  1],  //  5  canal; BRIDGE_DECK c7
  [  1,  1,  1,  1,  1,  1,  1, 58,  1,  1,  1,  1,  1,  1,  1,  1],  //  6  canal; BRIDGE_DECK c7
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  7  S bridge approach; bridge_soldier_south at c7 (aside: c6)
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  8  S bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  9  S bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  // 10  S bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  // 11  S bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  // 12  S bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  // 13  S bank; player entry from south
  [  3,  3,  3,  3,  3,  3,  3, 59,  3,  3,  3,  3,  3,  3,  3,  3],  // 14  BRIDGE_EXIT south col 7
];

const MAP3_N2_ITEMS = [];

// ─── Drenwick Civic / Downtown  (16 × 15) ────────────────────────────────────
// Player enters from south via MAP3_N2 TOWN_ENTRANCE. TOWN_EXIT at row 13 col 7.
// North wall (row 0): future exit to Canal/Docks district — impassable for now.
// East wall (col 15): future exit to Market & Guild Quarter — impassable for now.
// Inn: cols 1-5, rows 0-3. Door: INN_DOOR at col 3 row 3.
// IJC District Office: cols 9-14, rows 0-3. Door: OFFICE_DOOR at col 11 row 3.
// Thread Registry: cols 10-13, rows 9-11 — door stubbed as TOWN_BUILDING for now.
// Civic square: rows 5-7, cols 5-9 (TOWN_MARKET tiles; no notice board — Market district only).
// Customs arch (decorative): col 7 rows 11-12, funnels player to exit.
const DRENWICK_CIVIC_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 13, 13, 13, 13, 13, 13, 13, 43, 13, 13, 13, 13, 13, 13, 13, 13],  //  0  NORTH_EXIT c7 → West Residential
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  //  1  inn block W | alley c6-8 | office block E
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  //  2  building faces | alley c6-8
  [ 13, 13, 13, 16, 13, 13, 12, 12, 12, 13, 13, 17, 13, 13, 13, 13],  //  3  INN_DOOR c3 | alley c6-8 | OFFICE_DOOR c11
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 39],  //  4  main E-W street | MAP2_EXIT c15 → East Outskirts
  [ 13, 12, 13, 13, 12, 21, 21, 21, 21, 21, 12, 13, 13, 13, 12, 13],  //  5  market square top
  [ 13, 12, 13, 13, 12, 21, 21, 21, 21, 21, 12, 13, 13, 13, 12, 13],  //  6  civic square (notice board removed — Market only)
  [ 13, 12, 13, 13, 12, 21, 21, 21, 21, 21, 12, 13, 13, 13, 12, 13],  //  7  market square bottom
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  8  south E-W street
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  //  9  path c6-8 | registry block c10-13
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  // 10  registry block — door stubbed
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  // 11  path continues south
  [ 13, 13, 13, 13, 13, 13, 13, 12, 13, 13, 13, 13, 13, 13, 13, 13],  // 12  funnel to exit
  [ 13, 13, 13, 13, 13, 13, 13, 15, 13, 13, 13, 13, 13, 13, 13, 13],  // 13  TOWN_EXIT c7 → MAP3_N2
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  // 14  south border
];

// ─── Drenwick West Residential  (16 × 15) ────────────────────────────────────
// The better side of town. Three E-W streets at rows 4, 8, 12 create two
// residential blocks (rows 5-7 and 9-11). School occupies the NW corner of
// the top zone (rows 1-2, cols 1-5); civic green (GRASS) fills cols 6-9 rows 1-3,
// giving the school a courtyard and an open approach from the north exit.
// Wider lots: each residential block has two houses (4-wide W, 5-wide E) separated
// by a 3-wide N-S lane. Col 7 is the full N-S spine; row 8 carries the east exit.
// West wall (col 0): permanent — no west exits in Drenwick.
const DRENWICK_WEST_RESIDENTIAL_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 13, 13, 13, 13, 13, 13, 13, 43, 13, 13, 13, 13, 13, 13, 13, 13],  //  0  NORTH_EXIT c7 → Canal/Docks; rest is top border
  [ 13, 13, 13, 13, 13, 13,  0,  0,  0,  0, 13, 13, 13, 13, 13, 13],  //  1  school block c1-5 | civic green GRASS c6-9 | residential N c10-14
  [ 13, 13, 13, 13, 13, 13,  0,  0,  0,  0, 13, 13, 13, 13, 13, 13],  //  2  school building upper face | civic green | residential upper
  [ 13, 13, 13, 35, 13, 13,  0,  0,  0,  0, 13, 34, 13, 34, 13, 13],  //  3  SCHOOL_DOOR c3 (south face) | civic green | HOUSE_DOOR c11, c13
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  4  north E-W street — full width cols 1-14
  [ 13, 12, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 12, 13],  //  5  W house c2-5 | 3-wide N-S lane c6-8 | E house c9-13 | perimeter lanes c1,c14
  [ 13, 12, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 12, 13],  //  6  north residential block (middle row)
  [ 13, 12, 13, 34, 13, 13, 12, 12, 12, 13, 13, 34, 13, 13, 12, 13],  //  7  HOUSE_DOOR c3 (W house south face) | HOUSE_DOOR c11 (E house south face)
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 39],  //  8  mid E-W street — MAP2_EXIT c15 → Market & Guild; east entry on main street
  [ 13, 12, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 12, 13],  //  9  south residential block — same wider lot layout as north
  [ 13, 12, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 12, 13],  // 10  south residential block (middle row)
  [ 13, 12, 13, 34, 13, 13, 12, 12, 12, 13, 13, 34, 13, 34, 12, 13],  // 11  HOUSE_DOOR c3 | HOUSE_DOOR c11 | HOUSE_DOOR c13 (south faces)
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  // 12  south E-W street — third street completing two-block structure
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  // 13  funnel south c6-8 toward NORTH_ENTRANCE
  [ 13, 13, 13, 13, 13, 13, 13, 44, 13, 13, 13, 13, 13, 13, 13, 13],  // 14  NORTH_ENTRANCE c7 ← arrival from Civic
];

// ─── Drenwick Canal / Docks  (16 × 15) ───────────────────────────────────────
// Working waterfront — northwest corner of Drenwick. Canal occupies the full
// north three rows (rows 0-2, all WATER). Row 3 is the full-width quay.
// Warehouse A (cols 1-3) and Warehouse B (cols 5-8) fill rows 4-6, each with an
// OFFICE_DOOR on the south face (row 6). Service alleys at cols 4 and 9 connect
// quay to the main dock road at row 7. East side: harbormaster post (cols 10-11)
// and weighing station (cols 13-14), both smaller than the warehouses; alley at
// col 12 separates them. Rows 8-9 open into a broad service yard; rows 10-12
// funnel progressively toward NORTH_ENTRANCE at row 13. Col 7 is the main N-S
// spine throughout the service area.
// West wall (col 0): permanent — no west exits in Drenwick.
const DRENWICK_CANAL_DOCKS_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  0  canal water — full 16 cols
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  1  canal water — full 16 cols
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  2  canal water — full 16 cols
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  3  full-width quay — main waterfront street cols 1-14
  [ 13, 13, 13, 13, 12, 13, 13, 13, 13, 12, 13, 13, 12, 13, 13, 13],  //  4  Harbormaster c1-3 | alley c4 | Wash House c5-8 | alley c9 | Provision Store c10-11 | alley c12 | Weighing Station c13-14
  [ 13, 13, 13, 13, 12, 13, 13, 13, 13, 12, 13, 13, 12, 13, 13, 13],  //  5  building interiors — solid above door row
  [ 13, 13, 17, 13, 12, 13, 13, 17, 13, 12, 13, 17, 12, 13, 13, 13],  //  6  OFFICE_DOOR c2 (Harbormaster south face) | OFFICE_DOOR c7 (Wash House south face) | OFFICE_DOOR c11 (Provision Store south face)
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 39],  //  7  main dock E-W road — MAP2_EXIT c15 → Waterfront; arrival from Waterfront at c14
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  8  broad open service road south of warehouses
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  9  open service yard — wide turning and staging area
  [ 13, 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 13],  // 10  service area begins to narrow — building margins close in W and E
  [ 13, 13, 13, 13, 12, 12, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13],  // 11  further narrowing — open service road cols 4-11
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  // 12  tight funnel c6-8; arrival from West Residential at c7 (row 12)
  [ 13, 13, 13, 13, 13, 13, 13, 44, 13, 13, 13, 13, 13, 13, 13, 13],  // 13  NORTH_ENTRANCE c7 ← player walks here to exit south to West Residential
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  // 14  south border
];

// ─── Drenwick East Outskirts  (16 × 15) ──────────────────────────────────────
// Drenwick dissolving into wetland. West side (cols 0-4): three duplex blocks
// (rows 1-3, 5-7, 9-11) — each 3-wide with two HOUSE_DOORs on the south face,
// separated by a solid centre wall; denser than West Residential. Col 1 is the
// full-height N-S lane. Main E-W street (row 4) paved cols 1-9, degrading to
// GRASS at col 10 — the road just stops. Secondary streets at rows 8 and 12 are
// progressively shorter east, reflecting the housing thinning. Col 7 is the N-S
// spine linking the north and south exits through open scrub. Row 13: building
// walls give way to GRASS and REEDS — the town has dissolved; only a narrow path
// through the reed-framed south exit remains.
// Note: brief cites tile 53 (DRENWICK_BUILDING); that tile does not exist in
// tiles.js (WALKABLE ends at 52). All building exteriors use TOWN_BUILDING (13).
const DRENWICK_EAST_OUTSKIRTS_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 13, 13, 13, 13, 13, 13, 13, 43, 13, 13, 13, 13, 13, 13, 13, 13],  //  0  NORTH_EXIT c7 → Market & Guild; north border wall
  [ 13, 12, 13, 13, 13,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 13],  //  1  N-S lane c1; Block A north face c2-4; open scrub c5-14
  [ 13, 12, 13, 13, 13,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0, 13],  //  2  Block A mid; REED c10 — scrub beginning east
  [ 13, 12, 36, 13, 36,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0, 13],  //  3  Block A south face: APT_DOOR c2 & c4 (duplex entrances); REED c11
  [ 40, 12, 12, 12, 12, 12, 12, 12, 12, 12,  0,  0,  0, 23,  0, 13],  //  4  MAP2_ENTRANCE c0; paved E-W street c1-9; GRASS c10-12,14; REED c13
  [ 13, 12, 13, 13, 13,  0,  0,  0,  0,  0,  0,  0, 23,  0,  0, 13],  //  5  Block B north face c2-4; REED c12 — scrub encroaching mid-map
  [ 13, 12, 13, 13, 13,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0, 13],  //  6  Block B mid; REED c13
  [ 13, 12, 36, 13, 36,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 15],  //  7  Block B south face: APT_DOOR c2 & c4 (duplex entrances); TOWN_EXIT c15
  [ 13, 12, 12, 12, 12, 12,  0,  0,  0,  0, 23,  0,  0,  0,  0, 13],  //  8  secondary E-W street c1-5 (shorter — housing thins); REED c10
  [ 13, 12, 13, 13, 13,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0, 13],  //  9  Block C north face c2-4; REED c11
  [ 13, 12, 13, 13, 13,  0,  0,  0,  0,  0,  0,  0, 23,  0,  0, 13],  // 10  Block C mid; REED c12
  [ 13, 12, 36, 13, 36,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0, 13],  // 11  Block C south face: APT_DOOR c2 & c4 (duplex entrances); REED c13
  [ 13, 12, 12, 12, 12, 12, 12, 12,  0,  0,  0, 23,  0,  0,  0, 13],  // 12  south E-W street c1-7 (reaches col-7 spine); REED c11
  [ 13,  0,  0,  0, 23, 23,  0,  0,  0, 23, 23,  0,  0,  0,  0, 13],  // 13  town dissolved — GRASS c1-3; REEDS c4-5,c9-10; path c6-8; wetland c11-14
  [ 13, 13, 13, 13, 13, 13, 13, 15, 13, 13, 13, 13, 13, 13, 13, 13],  // 14  TOWN_EXIT c7 → world south; south border wall
];

// ─── Drenwick Market & Guild Quarter  (16 × 15) ──────────────────────────────
// Commercial heart of Drenwick. Guild Hall (rows 1-2) spans cols 1-6 and
// cols 8-14 — a split structure framing a single processional passage at col 7;
// the widest building in any Drenwick district. OFFICE_DOOR at row 3 col 5 faces
// south onto the guild forecourt (row 3) and north E-W street (row 4). Market
// square (rows 5-7, cols 3-11): 3×9 = 27 tiles, flanked by side lanes at c2
// and c12 for pedestrian access from all sides. Main commercial spine (row 8)
// runs full-width from MAP2_ENTRANCE to TOWN_EXIT — the world entry point.
// Merchants' collective (rows 9-10, cols 9-13): OFFICE_DOOR on east face at
// col 14 (col 13 directly west = building ✓), accessed via the col-14 east
// lane from the main street; south funnel (rows 11-12) narrows to col 7 spine.
// Note: brief cites tile 53 (DRENWICK_BUILDING); that tile does not exist in
// tiles.js (WALKABLE ends at 52). All building exteriors use TOWN_BUILDING (13).
const DRENWICK_MARKET_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 13, 13, 13, 13, 13, 13, 13, 43, 13, 13, 13, 13, 13, 13, 13, 13],  //  0  NORTH_EXIT c7 → Waterfront; north border wall
  [ 13, 13, 13, 13, 13, 13, 13, 12, 13, 13, 13, 13, 13, 13, 13, 13],  //  1  Guild Hall west wing c1-6; processional passage c7; east wing c8-14
  [ 13, 13, 13, 13, 13, 17, 13, 12, 13, 13, 13, 13, 13, 13, 13, 13],  //  2  Guild Hall south face: OFFICE_DOOR c5; processional passage c7
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  3  guild forecourt — full-width street between guild and market
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  4  north E-W street — full-width between guild and market
  [ 13, 13, 12, 21, 21, 21, 21, 21, 21, 21, 21, 21, 12, 13, 13, 13],  //  5  market square top: 9 wide (c3-11); side lanes c2,c12; solid wall c13-14
  [ 13, 13, 12, 21, 21, 21, 21, 22, 21, 21, 21, 21, 12, 13, 13, 13],  //  6  NOTICE_BOARD c7 (centre of market square)
  [ 13, 13, 12, 21, 21, 21, 21, 21, 21, 21, 21, 21, 12, 13, 13, 13],  //  7  market square bottom — 3×9 = 27 tiles (larger than Civic's 3×5)
  [ 40, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 15],  //  8  MAP2_ENTRANCE c0; main commercial spine c1-14; TOWN_EXIT c15
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 12, 13],  //  9  south approach c1-8; merchants' collective north face c9-13; east lane c14
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 17, 13],  // 10  south path c1-8; MC depth c9-13; OFFICE_DOOR c14 (west=c13=13 ✓)
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  // 11  funnel begins: N-S path c6-8; building walls close in east and west
  [ 13, 13, 13, 13, 13, 13, 13, 12, 13, 13, 13, 13, 13, 13, 13, 13],  // 12  funnel tightens: col-7 spine only
  [ 13, 13, 13, 13, 13, 13, 13, 44, 13, 13, 13, 13, 13, 13, 13, 13],  // 13  NORTH_ENTRANCE c7 ← arrival from East Outskirts going north
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  // 14  south border wall
];

// ─── Drenwick Waterfront District  (16 × 15) ─────────────────────────────────
// Rough working waterfront at the canal mouth. Rows 0-1: full canal WATER.
// Row 2: shore REEDS at col 0 and col 15 flanking open water. Row 3: full-width
// quay — the primary E-W promenade. Rows 4-6: two warehouses (west cols 1-4,
// east cols 10-13) flanking a 5-wide central road (cols 5-9); east side lane
// at col 14 provides quayside alley access. Row 7: main waterfront road —
// MAP2_ENTRANCE at col 0 (exit/entry with Canal/Docks; arrival from Canal/Docks
// at col 1). Rows 8-9: dockworkers' tavern on the west (cols 2-5) and east
// annex (cols 9-13); INN_DOOR at row 9 col 3 on south face (north = row 8
// col 3 = TOWN_BUILDING ✓); central passage col 6-8 stays open throughout.
// Row 10: full south road. Rows 11-12: funnel (arrival from Market at row 12
// col 7). Row 13: NORTH_ENTRANCE col 7 — exit south to Market.
// Note: brief cites tile 53 (DRENWICK_BUILDING); that tile does not exist in
// tiles.js (WALKABLE ends at 52). All building exteriors use TOWN_BUILDING (13).
const DRENWICK_WATERFRONT_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  0  canal water — full 16 cols
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  1  canal water — full 16 cols
  [ 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23],  //  2  REEDS c0,c15 at canal shore; open water c1-14
  [ 75, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  3  TAKOMO_GATE c0 (looks like wall — secret west entrance); quay c1-14
  [ 13, 13, 13, 13, 13, 12, 12, 12, 12, 12, 13, 13, 13, 13, 12, 13],  //  4  W warehouse c1-4; central road c5-9; E building c10-13; side lane c14
  [ 13, 13, 13, 13, 13, 12, 12, 12, 12, 12, 13, 13, 13, 13, 12, 13],  //  5  warehouse depth
  [ 13, 13, 13, 13, 13, 12, 12, 12, 12, 12, 13, 13, 13, 13, 12, 13],  //  6  warehouse south face (no door — dock storage, not public)
  [ 40, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  //  7  MAP2_ENTRANCE c0; main waterfront road c1-14; arrival from Canal/Docks at c1
  [ 13, 12, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 12, 13],  //  8  tavern north face c2-5; central passage c6-8; E annex c9-13; side lane c14
  [ 13, 12, 13, 16, 13, 13, 12, 12, 12, 13, 17, 13, 13, 13, 12, 13],  //  9  tavern south face: INN_DOOR c3; Infirmary OFFICE_DOOR c10 (E annex south face)
  [ 13, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13],  // 10  full south road — approach to tavern door and south funnel
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  // 11  funnel: N-S path c6-8; building walls close in
  [ 13, 13, 13, 13, 13, 13, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13],  // 12  funnel: arrival from Market at c7 (row 12)
  [ 13, 13, 13, 13, 13, 13, 13, 44, 13, 13, 13, 13, 13, 13, 13, 13],  // 13  NORTH_ENTRANCE c7 — exit south to Market & Guild
  [ 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],  // 14  south border wall
];

// ─── Drenwick Inn Interior  (16 × 15) ────────────────────────────────────────
// Larger than Calwick inn — wider common room, more tables.
// Exit: col 7 row 13. Innkeeper position: col 7 row 2.
// Row 1 = solid bar-back wall; innkeeper stands at bar (row 2) against it.
// INN_TABLES sprite overlays occupy: c3.5r7.5, c8.5r7.5, c11.5r3.5,
//   c13.5r6.5, c10.5r10.5, c2.5r11.5, c5.5r11.5 (drawn regardless of map tiles).
const DRENWICK_INN_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  bar-back wall — innkeeper c7 row 2 stands at bar
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  2  bar lane — DRENWICK_INNKEEPER c7 ✓
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  3  table(cres) overlay c11.5
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  4
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  5
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  6  Orren c3.5 ✓
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  7  tables: gault(c3.5), reserved(c8.5)
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  8
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  9  Mallow c11.5 (most days) ✓
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 10  table(rhen) overlay c10.5
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 11  tables: tern(c2.5), edda(c5.5)
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 12
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 13  INTERIOR_EXIT c7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14  bottom wall
];

// ─── Drenwick IJC District Office Interior  (16 × 15) ────────────────────────
// District-level posting office. Exit: col 7 row 12.
// Officer Veth: col 12 row 3 (back-right alcove). Holt (clerk): col 4 row 5.
// Row 2 cols 2-10 = extended top wall, leaving cols 11-13 open as officer alcove
// entrance — Veth reachable from row 3-4 within TALK_RADIUS without entering alcove.
const DRENWICK_OFFICE_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 18, 18, 18, 19, 19],  //  2  thick wall c2-10; officer alcove entrance c11-13
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  3  main floor; Officer Veth c12 ✓ (alcove, reachable from r4)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  4
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  5  Holt (clerk) c4 ✓
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  6
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  7
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  8
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  9
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 10
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT c7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Drenwick Harbormaster's Office Interior  (16 × 15) ──────────────────────
// Small working office — charts, ledgers, a desk, a counter for the weighmaster
// function. Functional and slightly damp. Exit: col 7 row 12.
const DRENWICK_HARBORMASTER_MAP = [
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 33, 33, 33, 33, 18, 19, 19],  //  3  cols 9-12 = shelves + counter start
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  4  col 2 = archive shelf, col 12 = east counter
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  5  col 2 = archive shelf, col 12 = counter (weighmaster scale here)
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  6  col 2 = archive shelf, col 12 = counter
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  7  col 12 = counter (mooring log section)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  8  col 12 = counter end
  [ 19, 19, 18, 18, 33, 33, 33, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  9  cols 4-6 = crate/barrel stack
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 10
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Drenwick Wash House Interior  (16 × 15) ─────────────────────────────────
// Small public bathhouse — a civic amenity, slightly steamy, stone benches,
// communal wash basins along the north wall, and two private bath stalls
// walled off in the east corner (col 12, rows 6 & 8) for a little privacy.
// Exit: col 7 row 12.
const DRENWICK_WASH_HOUSE_MAP = [
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2
  [ 19, 19, 18, 33, 33, 33, 33, 33, 33, 33, 18, 18, 18, 18, 19, 19],  //  3  cols 3-9 = communal wash basins (north wall), col 10 = notice area
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  4  col 2 = supply/linen shelf
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  5  col 2 = supply shelf; cols 12-13 = bath-stall wall (top)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19],  //  6  bath stall A: tub col 12 (WASH_BASIN), east partition col 13
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  7  cols 12-13 = bath-stall divider
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19],  //  8  bath stall B: tub col 12 (WASH_BASIN_2), east partition col 13
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  9  cols 12-13 = bath-stall wall (bottom)
  [ 19, 19, 18, 33, 33, 33, 18, 18, 18, 33, 33, 33, 18, 18, 19, 19],  // 10  cols 3-5 and 9-11 = stone benches
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Drenwick Infirmary Interior  (16 × 15) ──────────────────────────────────
// A small, orderly civic medical facility on the waterfront — serves Drenwick,
// the nearby hamlets, fen workers, fishermen and travellers. Cuts, broken
// bones, fever, exposure, near-drowning, work accidents, difficult births;
// practical empirical medicine (boiled linen, splints, herbs, ventilation),
// no magical healing. Only ever visited via the chamber dream sequence
// (wakeAtDrenwickInfirmary, world-transitions.js): the player wakes here, and
// once they leave through the vestibule door (INTERIOR_EXIT col 7) they can't
// re-enter — the waterfront door gives the pay-per-HP healing dialogue instead.
// Zones (drawn by drawInfirmaryFurniture): treatment room (upper-left),
// private room behind a door (upper-right), main ward (centre-left, beds all
// angled toward the stove), intake desk + waiting benches (lower-left),
// service/dispensary with stove, cupboards and counter (right), and the
// bottom-centre mud vestibule (mat, boot scraper, cloak pegs, wash basin).
// Base tiles are only floor(18)/wall(19)/TABLE(33)/exit(20); the institutional
// fen palette and all detail come from the furniture pass.
const DRENWICK_INFIRMARY_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  top wall (window over treatment; rear service door drawn c11-12)
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2  top wall
  [ 19, 19, 33, 33, 33, 18, 18, 18, 18, 18, 19, 18, 33, 33, 19, 19],  //  3  treatment counter c2-4 (instrument cabinet, splints); private room: partition c10, bed c12-13
  [ 19, 19, 18, 33, 18, 33, 33, 18, 18, 18, 19, 18, 18, 18, 19, 19],  //  4  treatment: exam table c3; ward bed A c5-6; private-room floor c11-13
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 18, 19, 19, 19],  //  5  private room south wall c10-11,c13; proper door c12
  [ 19, 19, 18, 18, 18, 33, 33, 18, 18, 18, 18, 18, 18, 33, 19, 19],  //  6  ward bed B c5-6; service floor; linen/med cupboard c13
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 33, 33, 18, 33, 19, 19],  //  7  utility stove c10-11 (beds face it); med cupboard c13
  [ 19, 19, 33, 33, 18, 33, 33, 18, 18, 18, 33, 33, 18, 18, 19, 19],  //  8  intake desk c2-3; ward bed C c5-6; stove c10-11
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 19, 19],  //  9  clean-linen store c13
  [ 19, 19, 33, 33, 18, 18, 18, 18, 18, 18, 18, 33, 33, 18, 19, 19],  // 10  waiting bench c2-3; dispensary counter c11-12 (Doctor's Letter)
  [ 19, 19, 33, 33, 18, 18, 18, 18, 33, 18, 18, 18, 18, 18, 19, 19],  // 11  waiting bench c2-3; vestibule hand-wash basin c8
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT c7 (vestibule → waterfront, in front of the door)
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13  bottom wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14  bottom wall
];

// ─── Drenwick Provision Store Interior  (16 × 15) ────────────────────────────
// Imperial civic storage — dry goods, preserved fish, salted meat, reed products.
// Managed by a minor functionary. Shelving along the walls implied by furniture.
// Exit: col 7 row 12.
const DRENWICK_PROVISION_STORE_MAP = [
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2
  [ 19, 19, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 18, 18, 19, 19],  //  3  cols 2-11 = deep shelving (north wall)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  4  col 12 = east shelving
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  5  col 12 = east shelving (order ledger nearby)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  6  col 12 = east shelving
  [ 19, 19, 18, 33, 33, 33, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  7  cols 3-5 = stock crates, col 12 = east shelf
  [ 19, 19, 18, 33, 33, 33, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  8  cols 3-5 = stock crates, col 12 = east shelf
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  9  col 2 = ledger shelf, col 12 = east shelf
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  // 10  col 2 = ledger shelf, col 12 = east shelf
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Drenwick Market — Guild Hall interior (16 × 15) ─────────────────────────
// Canal Engineers' Guild. Wide trading floor: cols 1-14 walkable rows 1-11.
// Entrance door from DRENWICK_MARKET_MAP row 3 col 5. Exit: col 7 row 12.
// Furniture (TABLE 33, drawn by drawGuildHallFurniture(), render-interiors.js):
//   r1 c1-c5:  archive shelf along the north wall (ledgers, rolled drawings)
//   r2 c13:    the posting board itself — the player reads it standing one
//              tile south, at GUILD_HALL_BOARD (13.5, 3.5) (npcs.js)
//   r4 c1-c2:  registrar's desk (Foss stands at c3 r4, beside it)
//   r8 c5-c8:  long members' table (Cae stands at c8 r7, dayoff)
const DRENWICK_GUILD_HALL_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  top wall
  [ 19, 33, 33, 33, 33, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  1  archive shelf (c1-c5)
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19],  //  2  posting board (c13)
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  3  board-reading spot at c13
  [ 19, 33, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  4  registrar's desk (c1-c2); Foss at c3
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  5
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  6
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  7  Cae at c8 (dayoff)
  [ 19, 18, 18, 18, 18, 33, 33, 33, 33, 18, 18, 18, 18, 18, 18, 19],  //  8  members' table (c5-c8)
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  9
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 10
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Fenmark Post Company Office Interior  (16 × 15) ─────────────────────────
// A small PRIVATE mail-carrier office off the market's east lane — a licensed
// courier house, not the Empire's dispatch (that runs through the district
// office). A wall of sorting pigeonholes along the back (TABLE=33), two service
// desks (dispatch on the west, parcels on the east), and waiting benches by the
// side walls. The proprietor and the relay clerk both work behind the desks but
// stand on open floor so the counter never blocks a customer from reaching them
// (TALK_RADIUS is < 1 tile). The market door (DRENWICK_MARKET_MAP OFFICE_DOOR
// row 10 col 14) is approached from the north, so the interior INTERIOR_EXIT is
// on the TOP wall (col 7 row 1): you enter walking south and land just inside.
const DRENWICK_POST_OFFICE_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  INTERIOR_EXIT c7 -- entrance in the TOP wall (you enter walking south from the market lane)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  2  entry / customer floor (landing at c7)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  3  customer floor
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  4  waiting benches c2, c12
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  5  waiting benches c2, c12
  [ 19, 19, 18, 33, 33, 18, 18, 18, 18, 18, 33, 33, 18, 18, 19, 19],  //  6  dispatch desk (c3-4); parcels desk (c10-11)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  7  staff floor: Proprietor c4, Relay Clerk c10 stand here
  [ 19, 19, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 19, 19],  //  8  mail-sorting pigeonholes -- the back wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  9  bottom wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 10
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 12
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Drenwick Dockworkers' Tavern Interior  (16 × 15) ────────────────────────
// Rougher than the main inn — lower ceilings implied by the tighter floor space,
// cheaper tables, a bar along the north wall. Ossel and Bette appear via SIMPLE_NPCS
// (map: 'drenwick_waterfront' — exterior map). Interior NPCs added in a later prompt.
// Entrance: INN_DOOR at DRENWICK_WATERFRONT_MAP row 9 col 3.
// Exit: col 7 row 13.
const DRENWICK_TAVERN_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  1  bar counter row (furniture overlay later)
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  2  DRENWICK_TAVERN_KEEPER col 7 (behind bar)
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
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 13  INTERIOR_EXIT col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Drenwick School Ground Floor  (16 × 15) ─────────────────────────────────
// Younger cohort (ages 6-9). Slightly wider floor area than Calwick school.
// Teacher lectern at north end (col 7 row 3). Two rows of four student desks.
// Staircase to upper floor: DUNGEON_STAIRS_DOWN (10) at col 13 row 2.
// Staircase to basement: DUNGEON_STAIRS_DOWN (10) at col 2 row 2 — handler checks player.x to distinguish.
// Exit: INTERIOR_EXIT (20) at col 7 row 12.
const DRENWICK_SCHOOL_GROUND_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  north wall (blackboard drawn as overlay)
  [ 19, 19, 10, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 11, 19, 19],  //  2  STAIRS_DOWN c2 (basement); STAIRS_UP c13 (upper) — visually distinct
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  3  teacher lectern col 7 (drawn overlay)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  4
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  5
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  6  student row 1 (desks drawn, students y=6.5T)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  7
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  8
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  9  student row 2 (desks drawn, students y=9.5T)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 10
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Drenwick School Upper Floor  (16 × 15) ──────────────────────────────────
// Older cohort (ages 9-12). Same floor dimensions as ground floor.
// Features: Imperial hierarchy wall chart (north wall overlay, cols 2-9),
//           locked document cabinet wall at col 2 row 3 (INTERIOR_WALL — impassable),
//           apprenticeship posting board on east wall (col 13 rows 4-7, drawn overlay).
// Staircase back to ground floor: DUNGEON2_STAIRS_UP (11) at col 13 row 2.
// No street exit — players must use stairs. INTERIOR_EXIT tile deliberately absent.
const DRENWICK_SCHOOL_UPPER_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  north wall (hierarchy chart drawn as overlay)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 10, 19, 19],  //  2  classroom floor; DUNGEON_STAIRS_DOWN c13 (descends to ground floor)
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  3  col 2 = INTERIOR_WALL (document cabinet position)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  4
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  5
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  6  student row 1 (desks drawn, students y=6.5T)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  7
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  8
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  9  student row 2 (desks drawn, students y=9.5T)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 10
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  south wall — no exit tile
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ─── Drenwick School Basement  (16 × 15) ─────────────────────────────────────
// Archive and records storage below the ground floor.
// Bookshelf (drawn overlay, cols 6–10, row 2) holds general archive material.
// The Accord itself was moved to the framed wall display (col 4, row 1-2) —
// see DRENWICK_SCHOOL_ACCORD_DISPLAY in render-interiors.js.
// Staircase up to ground floor: DUNGEON2_STAIRS_UP (11) at col 2 row 2.
// No exterior exit.
const DRENWICK_SCHOOL_BASEMENT_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  north wall
  [ 19, 19, 11, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  2  DUNGEON2_STAIRS_UP c2; bookshelf cols 6-10 (drawn overlay)
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  3
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  4
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  5
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  6
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  7
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  8
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  9
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 10
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  south wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
];

// ── Regional chunk definitions (Drenwick) ────────────────────────────────────
// Authored authority for this file's placed regional chunks. data.js merges the
// per-file *_REGIONAL_CHUNK_DEFINITIONS fragments and resolves encounterProfileId /
// itemSetId into the runtime REGIONAL_CHUNK_CATALOG (see data.js for the contract).
const DRENWICK_REGIONAL_CHUNK_DEFINITIONS = [
  { mapId: 'MAP3_N2', regionId: 'overworld', chunkX: 2, chunkY: 3, map: MAP3_N2,
    displayName: 'Drenwick', region: 'Drenwick', contentKey: 'map3_n2',
    presentation: 'continuous', encounterProfileId: 'far', itemSetId: 'map3_n2',
    allowRandomEncounters: true, allowSave: true,
    notes: 'Outdoor approach to Drenwick, distinct from DRENWICK_CIVIC_MAP (the town square) -- both are called "Drenwick" to the player, matching pre-existing locationName() behaviour, not introduced here.' },
];
window.DRENWICK_REGIONAL_CHUNK_DEFINITIONS = DRENWICK_REGIONAL_CHUNK_DEFINITIONS;
