'use strict';

// ─── Map  (16 columns × 15 rows) ─────────────────────────────────────────────
// 0=grass 1=water 2=path 3=tree 6=dungeon entrance 14=town entrance
const MAP = [
  [3,3,3,3,3,3,3,43,3,3,3,3,3,3,3,3],  //  0  ← col 7 = NORTH_EXIT
  [3,93,0,0,0,14,0,2,0,0,3,0,0,0,0,3], //  1  ← col 1 = MEADOW_HIDDEN_ENTRANCE (draws as grass — secret), col 5 = town entrance, col 7 = path (north road)
  [3,0,0,3,3,2,0,2,0,0,3,3,0,0,0,3],   //  2  ← col 5 = path, col 7 = path (north road)
  [3,0,0,3,3,2,0,2,0,0,3,0,0,0,0,3],   //  3  ← col 5 = path, col 7 = path (north road)
  [3,0,0,0,0,2,2,2,2,2,2,2,2,2,2,39],  //  4  ← col 15 = east world exit, col 7 = crossroads
  [3,0,0,0,0,2,0,0,0,0,0,0,3,53,0,3],  //  5  ← col 13 = GUARD_POST (Maren's post)
  [3,0,1,1,0,2,0,0,0,0,0,0,0,0,0,3],  //  6
  [3,0,1,1,1,2,2,0,0,0,0,0,0,0,0,3],  //  7
  [3,0,0,1,0,0,2,2,2,2,0,0,0,0,0,3],  //  8
  [3,0,0,0,0,0,0,0,2,0,0,0,0,0,0,3],  //  9
  [3,0,0,0,0,0,0,0,2,0,0,3,3,0,0,3],  // 10
  [3,0,3,0,0,0,0,0,2,0,0,3,0,0,0,3],  // 11
  [3,0,0,0,0,0,0,0,2,2,2,6,0,0,0,3],  // 12  ← col 11 = dungeon entrance
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],  // 13
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],  // 14
];

// ─── Eastern World Map  (16 × 15) ────────────────────────────────────────────
// Connected to MAP via MAP2_EXIT at MAP row 4 col 15 / MAP2_ENTRANCE at col 0.
// Connected to MAP3 via MAP3_EXIT at row 11 col 15 / MAP3_ENTRANCE at col 0.
// Road enters from the west (col 0 row 4), winds south and east, exits east (row 11 col 15).
// Small lake at rows 8-10, cols 5-7.  Reeds at rows 7,10.  Forest clusters rows 2-3 and 7-8.
const MAP2 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3],  //  0
  [  3,  0,  0,  0,  0,  0,  3,  3,  0,  0,  0,  0,  0,  0,  0,  3],  //  1
  [  3,  0,  0,  3,  0,  0,  0,  0,  0,  0,  3,  3,  0,  0,  0,  3],  //  2
  [  3,  0,  0,  3,  3,  0,  0,  0,  0,  0,  3,  0,  0,  0,  0,  3],  //  3
  [ 40,  2,  2,  2,  2,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  3],  //  4  ← col 0 = entrance from MAP
  [  3,  0,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  5
  [  3,  0,  0,  0,  0,  0,  0,  0,  2,  2,  2,  2,  0,  0,  0,  3],  //  6
  [  3,  0,  3,  3,  0, 23, 23,  0,  0,  0,  0,  2,  0,  0,  0,  3],  //  7  reeds north of lake
  [  3,  0,  3,  0,  0,  1,  1,  0,  0,  0,  0,  2,  0,  0,  0,  3],  //  8  lake + road
  [  3,  0,  0,  0,  0,  1,  1,  1,  0,  0,  0,  2,  0,  0,  0,  3],  //  9  lake + road
  [  3,  0,  0,  0, 23,  0,  1,  0,  0,  0,  0,  2,  0,  0,  0,  3],  // 10  reeds west of lake + road
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  2,  2,  2,  2, 41],  // 11  east exit c15
  [  3,  0, 54,  3,  0,  0,  0,  0,  0,  0,  0,  0,  2,  0,  0,  3],  // 12  FARM_HOUSE c2; tree c3 (original)
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3],  // 13  approach
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3],  // 14
];

const MAP2_ITEMS = [];

// ─── Lorra's Farmhouse Interior  (16 × 15) ───────────────────────────────────
// Small marsh cottage. FARM_HOUSE tile on MAP2 at row 12 col 2.
// Exit: col 7 row 12. Lorra: col 7 row 4. Rustic table at cols 5-6 row 7.
const LORRA_HOUSE_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  top wall
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  2  interior cols 3-11
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  3
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  4  Lorra c7 ✓
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  5
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  6
  [ 19, 19, 19, 18, 18, 33, 33, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  7  TABLE c5-6 (rustic table)
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  8
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  //  9
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  // 10
  [ 19, 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19],  // 11  last floor row; col 7 walkable → exit
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT c7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14  bottom wall
];

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

// ─── Far-Eastern World Map — Thornmere Fen  (16 × 15) ────────────────────────
// Connected to MAP2 via MAP3_EXIT at MAP2 row 11 col 15 / MAP3_ENTRANCE at col 0.
// Heavy wetland character: large northern lake (rows 1-3), mid-pond (rows 5-7),
// southern marsh (rows 12-13), reeds throughout.
// Road enters from the west (col 0 row 11), heads east to col 8, bends north to
// row 0 (FEN_N_EXIT). Also branches east at row 6: road runs col 8→15 (MAP4_EXIT).
const MAP3 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  1,  1,  1,  1,  1,  1,  1,  1, 47,  3,  3,  3,  3,  3,  3,  3],  //  0  ← col 8 = FEN_N_EXIT; N lake continues off-map W of the road
  [  1, 23, 23,  1,  1,  1,  1, 23,  2,  0,  0,  0,  0,  0,  0,  3],  //  1  N lake + reeds; road at col 8; water W edge
  [  1, 23,  1,  1,  1,  1,  1,  1,  2,  0,  0,  0,  0,  3,  3,  3],  //  2  N lake + reeds; road at col 8; water W edge
  [  3,  0,  1,  1,  1, 23, 23,  0,  2,  0,  0,  0,  0,  3,  0,  3],  //  3  N lake edge; road at col 8
  [  3,  0, 23, 23, 23,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  4  reeds band; road at col 8
  [  3,  0,  0, 23,  1,  1, 23,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  5  mid-pond; road at col 8
  [  3,  0,  0, 23,  1,  1,  1, 23,  2,  2,  2,  2,  2,  2,  2, 51],  //  6  mid-pond + road east to MAP4_EXIT
  [  3,  0,  0,  0, 23,  1, 23,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  7  reeds + road N/S
  [  3,  0,  0,  0,  0, 23,  0,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  8  reeds + road
  [  3,  0, 23,  0,  0,  0, 23, 23,  2,  0,  0,  0,  0,  0,  0,  3],  //  9  reeds + road
  [  3,  0, 23,  1,  0,  0,  0, 23,  2,  0,  0,  0,  0,  0,  0,  3],  // 10  water + reeds + road
  [ 42,  2,  2,  2,  2,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  3],  // 11  ← col 0 = entrance from MAP2
  [  3,  0,  0, 23, 23,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  3],  // 12  S marsh
  [  3,  0,  0,  0, 23,  1,  1,  0, 23,  0,  0,  0,  0,  0,  0,  3],  // 13  S marsh + reeds
  [  3,  3,  3,  3,  1,  1,  1,  3,  1,  3,  3,  3,  3,  3,  3,  3],  // 14  S marsh drains off-map (cols 4-6, 8)
];

const MAP3_ITEMS = [];

// ─── Thornmere Lake — MAP4  (16 × 15) ────────────────────────────────────────
// Connected west to MAP3 via MAP4_EXIT at MAP3 row 6 col 15 / MAP4_ENTRANCE at col 0.
// The eponymous Thornmere: ~80% open water. Center and south entirely lake.
// A narrow path (1 tile) enters from the west at row 6, climbs the west shore to row 1,
// crosses the north bank, then descends the east shore to row 8 — a П-shaped walkway
// around the top of the lake. No path on the south half; just water and scattered reeds.
const MAP4 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3],  //  0  border
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3],  //  1  north shore (top of П) — was PATH (safe road); now GRASS so it's a normal encounter zone like any other wilderness path
  [  3,  0, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  0,  3],  //  2  W+E shore, reeds at water's edge
  [  3,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  3],  //  3  lake deepens
  [  3,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  3],  //  4
  [  3,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  0,  3],  //  5  reeds on E shore mid
  [ 52,  0,  1,  1,  1,  1,  1,  0,  0,  1,  1,  1,  1,  1,  0, 60],  //  6  ← island NW/NE (cols 7-8); col 0 = entrance; col 15 = MAP5_EXIT
  [  1, 23,  1,  1,  1,  1,  1,  0,  0,  1,  1,  1,  1,  1,  0,  3],  //  7  ← island SW/SE (cols 7-8); reeds at W shore; water W edge
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  0,  3],  //  8  E shore ends here (bottom of П); water W edge
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  3],  //  9  E grass (path gone), open lake; water W edge
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 10  full lake, open to W and E edges
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 11  full lake, open to W and E edges
  [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 12  reeds on SW shore; water W and E edges
  [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 13  reeds trailing SW; water W and E edges
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 14  the Thornmere continues off-map south
];

const MAP4_ITEMS = [];

// ─── Thornmere Shallows — MAP5  (16 × 15) ────────────────────────────────────
// Connected west to MAP4 via MAP5_EXIT at MAP4 row 6 col 15 / MAP5_ENTRANCE at col 0.
// A sand spit protrudes east into open water from the entrance. The spit tapers
// from ~4 tiles wide at the base (rows 5-8 near col 1) to a single-tile tip at
// col 9 (row 7), then reeds mark the dissolution into water. No eastern exit.
const MAP5 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  0  open water — the shallows continue off-map north
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  1  open water, open to W and E edges
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  2  open water, open to W and E edges
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  3  open water, open to W and E edges
  [  1,  1, 23,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  4  spit north shoulder; water W and E edges
  [  1, 23,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1],  //  5  spit north edge, cols 2-7; water W and E edges
  [ 61,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1],  //  6  ← col 0 = entrance; spit body; water E edge
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1],  //  7  spit widest / tip extends to col 9; lone shore tree by the landing (col 0)
  [  1, 23,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1],  //  8  spit south edge, mirrors row 5; water W and E edges
  [  1,  1, 23,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  9  spit south shoulder, mirrors row 4
  [  1,  1,  1, 23,  0, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 10  spit inner tip
  [  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 11  last reed marking spit end
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 12  open water
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 13  open water
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 14  open water — the shallows continue off-map south
];

const MAP5_ITEMS = [];

// ─── Northern Fen — MAP3_N1  (16 × 15) ───────────────────────────────────────
// Connected south to MAP3 via FEN_N_EXIT at MAP3 row 0 col 8 / FEN_N_ENTRANCE at row 14 col 8.
// Connected north to MAP3_N2 (Drenwick) via FEN_N2_EXIT at row 0 col 8 / FEN_N2_ENTRANCE at row 14.
// Connected west to RODDON_WAY_MAP via an open EDGE_TRANSITIONS crossing,
// rows 4-9 of col 0 — see EDGE_TRANSITIONS['MAP3_N1']. That range sits
// between the Mire Entrance (col 1, row 3) and the hamlet's farmhouses
// (col 1, rows 10-12) with a clear row of buffer on each side, so the new
// crossing can't be confused for either. Col 0 in that range is
// RODDON_SILT rather than plain REEDS: the roddon ridge is a single
// continuous feature crossing the map boundary, not two coincidentally
// similar landforms.
// Continuation of fen theme: boggy grassland, scattered water, reeds, sparse trees.
const MAP3_N1 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3,  3, 49,  3,  3,  3,  3,  3,  3,  3],  //  0  ← col 8 = FEN_N2_EXIT
  [  3,  0,  0, 23,  0,  0,  0,  0,  2,  0,  0,  0, 23,  0,  0,  3],  //  1
  [  3,  0,  3,  3,  0,  0,  0,  0,  2,  0,  0,  0,  0, 23,  0,  3],  //  2  NW trees
  [  3, 55,  3,  0,  0, 23,  0,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  3  col 1 = MIRE_ENTRANCE
  [111,  0,  0,  0, 23,  1,  1, 23,  2,  2,  2,  2,  2, 54,  0,  3],  //  4  ← col 0 = roddon crossing (top); W bog pond; cols 9-12=path to brewery; col 13=FARM_HOUSE (fen brewery)
  [111,  0,  0, 23,  1,  1,  1, 23,  2, 23,  0,  0,  0,  0,  0,  3],  //  5  ← col 0 = roddon crossing; bog pond + E reeds
  [111,  0,  0,  0, 23,  1, 23,  0,  2,  0, 23,  1, 23,  0,  0,  3],  //  6  ← col 0 = roddon crossing; bog + E pond
  [111,  0,  0,  0,  0, 23,  0,  0,  2,  0, 23,  1,  1, 23,  0,  3],  //  7  ← col 0 = roddon crossing; reeds + E pond
  [111,  0,  0,  0,  0,  0,  0,  0,  2,  0,  0, 23,  0,  0,  0,  3],  //  8  ← col 0 = roddon crossing; clearing
  [111,  0, 23,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0, 53,  0,  3],  //  9  ← col 0 = roddon crossing (bottom); GUARD_POST c13 (smugglers' fort)
  [  3, 54, 23,  1, 23,  0,  0,  0,  2,  0,  0,  0,  0,  3,  0,  3],  // 10  FARM_HOUSE c1 (hamlet north); SW marsh; tree c13 screens fort
  [  3,  0, 54, 23,  0,  0,  0,  0,  2,  0,  0,  0,  3,  3,  0,  3],  // 11  FARM_HOUSE c2 (hamlet middle)
  [  3, 54,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  3,  0,  3],  // 12  FARM_HOUSE c1 (hamlet south)
  [  3,  0,  0,  0,  0, 23, 23,  0,  2,  0,  0,  0,  0,  0,  0,  3],  // 13  reeds near south
  [  3,  3,  3,  3,  3,  3,  3,  3, 48,  3,  3,  3,  3,  3,  3,  3],  // 14  ← col 8 = FEN_N_ENTRANCE
];

const MAP3_N1_ITEMS = [
  // Mabel's fen sickle — lost at the north bank overhang (quest: Still Water).
  // Col 5, row 3: REEDS tile, directly above the bog pond water at row 4 col 5.
  { name: 'Fen Sickle', type: 'quest_item', x: 5.5 * TILE, y: 3.5 * TILE, picked: false },
];

// ─── Roddon Way  (16 × 15) ────────────────────────────────────────────────────
// A roddon: the raised course of an old silt-filled creek. As the peat
// around it has drained and subsided — over a much longer span than the
// current three-month dry spell — the mineral-rich former creek bed held
// firm and now stands as a winding ridge above the surrounding wet fen.
// Ordinary regional geography, not connected to the North Basin drought
// story or any other plot thread.
//
// Connected east to MAP3_N1 via an open EDGE_TRANSITIONS crossing, rows
// 4-9 (RODDON_SILT on both sides of the boundary — see MAP3_N1's header
// comment). No other edge of this map connects anywhere: north, south,
// and west stay plain impassable TREE border throughout, and the small
// unused stretches of the east edge (rows 0-3, 10-14, also TREE) make
// clear those aren't overlooked exits either.
//
// The ridge (RODDON_SILT, 111) enters at the full width of the crossing
// (rows 4-9, cols 13-14), tapers over cols 12-9 down to its normal 2-3
// tile width, then winds northwest in two broad bends — first climbing
// from the row 6-7 band up to row 3-4 around col 8-9, then bending again
// toward a small rounded terminus/viewpoint at rows 1-3, cols 1-4. A
// single-tile bulge at row 2 col 6 is a pull-out overlooking the reedy
// hollow just north of it (rows 1-2, cols 8-10) — the roddon's own
// "explain the landform" viewpoint (see MAP_FEATURES).
//
// Surrounding terrain is the same wet-fen palette as the rest of the
// Thornmere region: GRASS (peat/turf), REEDS (reed and sedge growth,
// concentrated in the lower ground away from the ridge — the SE and SW
// corners and the hollow below the viewpoint), two small WATER pools
// (shallow, one south-central near the eel-stake feature, one
// north-central), and a few single-tile TREE scrub/carr clumps. None of
// the water or scrub fully encloses any patch of ground — every walkable
// tile on this map can reach the entrance (verified by the flood-fill
// check in test/cases/37-roddon-way.test.js).
//
// Encounters: FAR_ENEMY_TEMPLATES, the same pool MAP3_N1 already uses —
// no new enemies. GRASS/REEDS roll as usual; RODDON_SILT (like PATH) does
// not, so the ridge is the safe route through, matching the brief.
const RODDON_WAY_MAP = [
  //  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
  [   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3],  //  0  border
  [   3,   0, 111, 111,   0,   0,   0,   0,   0,  23,  23,   1,   1,   0,   0,   3],  //  1  terminus knob; N pool c11-12
  [   3, 111, 111, 111, 111,   0, 111,   0,  23,  23,  23,   0,   0,   0,   0,   3],  //  2  terminus curve; viewpoint bulge c6; reed hollow c8-10
  [   3,   0, 111, 111, 111, 111, 111, 111, 111,   0,   0,   0,   0,   0,   0,   3],  //  3  bend 2 into the middle leg
  [   3,   0,   0,   0,   0, 111, 111, 111, 111,   0,   0,   0,   0, 111, 111, 111],  //  4  middle leg; bend 1 begins c8; entry flare c13-15 → mouth (col 15) opens to MAP3_N1
  [   3,   0,   3,   0,   0,   0,   0,   0, 111, 111,   0,   0,   0, 111, 111, 111],  //  5  scrub c2; bend 1 continues; entry flare c13-15
  [   3,   0,   0,   0,   0,   0,   0,   0,   0, 111, 111, 111, 111, 111, 111, 111],  //  6  entry band, full width from c9 → mouth
  [   3,   0,   0,   0,   0,   0,   0,   0,   0, 111, 111, 111, 111, 111, 111, 111],  //  7  entry band → mouth
  [   3,   0,  23,   0,   0,   3,   0,   0,   0,   0,   0,   0, 111, 111, 111, 111],  //  8  old channel edge c2; scrub c5; entry taper → mouth
  [   3,   0,  23,  23,   0,   0,   0,   0,   0,   0,  23,  23,   0, 111, 111, 111],  //  9  entry taper → mouth (col 15, bottom of the crossing)
  [   3,   0,   0,   0,   0,   0,   0,   0,   0,   0,  23,  23,  23,   0,   0,   3],  // 10  SE reed patch
  [   3,   0,   0,  23,  23,   0,   0,   1,   1,   0,   0,  23,   0,   0,   0,   3],  // 11  SW reed patch; S pool c7-8 (eel stakes at c6)
  [   3,   0,   0,  23,  23,  23,   0,   1,   0,   0,   3,   0,   0,   0,   0,   3],  // 12  SW reed patch continues; S pool; SE scrub c10
  [   3,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   3],  // 13  open lower fen
  [   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3],  // 14  border
];

const RODDON_WAY_ITEMS = [
  // A small find at the end of the ridge — reaching the terminus/viewpoint
  // is its own reward; this is just a nod to it. Ordinary consumable via
  // the item registry (items.js); grantItem() overwrites type/heals/price
  // from ITEM_REGISTRY at pickup time regardless of what's listed here.
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 2.5 * TILE, y: 1.5 * TILE, picked: false },
];

// ─── Mirethyst's Vault  (16 × 15) ────────────────────────────────────────────
// Ancient pre-Empire rareborn council chamber, now sunk into the northern fen.
// Entered via MIRE_ENTRANCE at MAP3_N1 row 3 col 1.
// Exit: MIRE_EXIT at row 13 col 7 → returns player to MAP3_N1 near entrance.
// Floor: DUNGEON2_FLOOR (8). Walls: DUNGEON2_WALL (9). Flooded sections: WATER (1).
// Mirethyst's sanctum: rows 1-4. Mid-hall: rows 6-8. Entry hall: row 12.
const MIRE_VAULT_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9],  //  0  — solid cap
  [  9,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  9],  //  1  — sanctum upper tier
  [  9,  8,  1,  1,  8,  8,  8,  8,  8,  8,  8,  8,  1,  1,  8,  9],  //  2  — flooded corner pools; Mirethyst col 7
  [  9,  8,  1,  9,  8,  9,  9,  8,  8,  9,  9,  8,  9,  1,  8,  9],  //  3  — rareborn pillar row
  [  9,  8,  8,  8,  8,  9,  9,  8,  8,  9,  9,  8,  8,  8,  8,  9],  //  4  — passage through pillars
  [  9,  9,  9,  8,  9,  9,  9,  8,  8,  9,  9,  9,  8,  9,  9,  9],  //  5  — narrow pinch north
  [  9,  8,  8,  8,  9,  8,  8,  8,  8,  8,  8,  9,  8,  8,  8,  9],  //  6  — mid hall; chest col 7; potion col 1
  [  9,  8,  9,  8,  9,  8,  8,  8,  8,  8,  8,  9,  8,  9,  8,  9],  //  7  — column row
  [  9,  8,  8,  8,  9,  8,  8,  8,  8,  8,  8,  9,  8,  8,  8,  9],  //  8  — mid hall 2; ember root col 13
  [  9,  9,  9,  8,  9,  9,  9,  8,  8,  9,  9,  9,  8,  9,  9,  9],  //  9  — narrow pinch south
  [  9,  8,  8,  8,  8,  1,  1,  8,  8,  1,  1,  8,  8,  8,  8,  9],  // 10  — flooded antechamber
  [  9,  8,  9,  9,  8,  1,  9,  8,  8,  9,  1,  8,  9,  9,  8,  9],  // 11  — flooded corners
  [  9,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  9],  // 12  — entry hall; player spawns col 7
  [  9,  9,  9,  9,  9,  9,  9, 56,  9,  9,  9,  9,  9,  9,  9,  9],  // 13  — MIRE_EXIT at col 7
  [  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9,  9],  // 14  — solid bottom
];

// ─── Smuggler's Fort Interior  (16 × 15) ─────────────────────────────────────
// Disguised as an Imperial guard post from the outside (GUARD_POST tile on
// MAP3_N1 row 9 col 13). Entrance is blocked until the supervisor's investigation
// assignment is active (fort_quest_started = true).
// Floor plan mirrors DRENWICK_POST_MAP but a second TABLE at col 9 row 5 hints
// at extra occupants. Exit: col 7 row 11.
// Polwick: col 7 row 4.  Essa: col 9 row 6.
const SMUGGLER_FORT_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1  top wall
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2  thick top wall
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  3  interior cols 5-10
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  4  Polwick c7 ✓
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 33, 18, 19, 19, 19, 19, 19],  //  5  TABLE c9 (second desk — extra occupant)
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  6  Essa c9 ✓
  [ 19, 19, 19, 19, 19, 18, 33, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  7  TABLE c6 (main desk)
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  8
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  //  9
  [ 19, 19, 19, 19, 19, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19],  // 10  last floor row
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 11  INTERIOR_EXIT c7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 12
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14  bottom wall
];

// ─── Drenwick — MAP3_N2  (16 × 15) ───────────────────────────────────────────
// Connected south to MAP3_N1 via FEN_N2_ENTRANCE at row 14 col 8.
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
  [  3,  3,  3,  3,  3,  1,  3,  3,  3,  3,  3,  1, 82,  1,  1,  1],  //  0  border ← col 12 = NORTH_BASIN_EXIT; marsh gaps (cols 5, 11) + bog pond E off-map (cols 13-15), causeway crossing it
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
  [  3,  3,  3,  3,  3,  3,  3,  3, 50,  3,  3,  3,  3,  3,  3,  3],  // 14  ← col 8 = FEN_N2_ENTRANCE
];

// ─── The North Basin — South Approach  (16 × 15) ─────────────────────────────
// SKELETON PASS: this is the south-center entry map of a future 3×3 North
// Basin grid, north of Drenwick/MAP3_N2. Three of nine maps exist so far
// (this one, NORTH_BASIN_C_MAP directly north of it, and NORTH_BASIN_SW_MAP
// directly west of it) — the other six (N, NE, E, SE, W, NW) are not built:
//
//   [NW future]        [N future]           [NE future]
//   [W future]         [NORTH_BASIN_C_MAP]  [E future]
//   [NORTH_BASIN_SW_MAP] [NORTH_BASIN_S_MAP]  [SE future]
//
// Entered from MAP3_N2's row 0 col 12 (NORTH_BASIN_ENTRANCE at this map's
// row 14 col 12 returns south — still a point-tile transition). The basin
// road (col 12) runs the length of the map, "maintained" (PATH) only from
// the entrance up to row 3 — beyond that (rows 1-2) it reverts to
// unmaintained reeds, matching the "maintained only to Marker 4" sign posted
// near there. An east spur (row 7-8) heads toward the sea-lock/tidegate
// road, dead-ending at col 14 before the border with a closure sign.
//
// North and west are both OPEN EDGES using the new generic EDGE_TRANSITIONS
// system (world-transitions.js), not point-tiles: row 0 (cols 1-14) is
// broad open ground leading into the Reservoir's south shore, and row 9-11
// at col 0 is the "unsafe beyond the road" gap leading into the Silt Flats —
// walking off either simply requires standing in that open range and
// pressing further outward, anywhere along it, not hitting one specific
// tile. See EDGE_TRANSITIONS['NORTH_BASIN_S_MAP'] for the exact ranges. The
// east border remains plain impassable TREE, so it's still not traversable
// into the not-yet-built SE/E neighbours.
//
// No GRASS tiles anywhere on this map (deliberately) — movement.js's random-
// encounter check only rolls on GRASS, so this map has zero encounter-
// eligible terrain and needs no entry in combat.js's farMap/pool selection.
const NORTH_BASIN_S_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  3],  //  0  open edge, cols 1-14 → EDGE_TRANSITIONS north to NORTH_BASIN_C_MAP
  [  3, 23, 23, 23, 23, 23, 81, 81, 81, 81, 23, 23, 23, 23, 23,  3],  //  1  unmaintained beyond Marker 4; drying mud band c6-9 (no water on this row -- it's the EDGE_TRANSITIONS landing row)
  [  3, 23, 23, 23,  1, 23, 81, 81, 81, 81, 23, 23, 23, 23, 23,  3],  //  2  unmaintained beyond Marker 4
  [  3, 23,  1, 23, 23, 81, 81, 23, 23, 23, 23, 23,  2, 23,  1,  3],  //  3  ← Marker 4: road resumes south of here (col 12)
  [  3,  1,  1, 23, 23, 81, 81, 23, 23, 23, 23, 23,  2, 23, 23,  3],  //  4
  [  3, 23, 23,  1,  1, 23, 23, 23, 23, 23, 23, 23,  2, 23, 23,  3],  //  5  Water Authority survey stakes nearby (c10)
  [  3, 23,  1,  1, 23, 23, 23, 23, 23, 23, 23, 23,  2, 23,  1,  3],  //  6
  [  3, 23, 23, 23,  1,  1, 23, 23, 23, 23, 23, 23,  2,  2, 23,  3],  //  7  east spur begins (c12-13)
  [  3,  1,  1, 23, 23, 23, 23, 23, 23, 23, 23, 23,  2,  2,  2,  3],  //  8  east spur reaches c14 — tidegate closure sign just past it
  [ 23, 23,  1, 81, 81, 23, 23, 23, 23, 23, 23, 23,  2, 23,  1,  3],  //  9  open edge, row 9 → EDGE_TRANSITIONS west to NORTH_BASIN_SW_MAP
  [ 23, 23,  1,  1,  1,  1, 23, 23, 23, 23, 23, 23,  2, 23, 23,  3],  // 10  open edge, row 10 → EDGE_TRANSITIONS west
  [ 23, 23, 23,  1,  1, 23, 23, 23, 23, 23, 23, 23,  2, 23,  1,  3],  // 11  open edge, row 11 → EDGE_TRANSITIONS west
  [  3, 23, 23, 23,  1, 23, 23, 23, 23, 23, 23, 23,  2, 23, 23,  3],  // 12
  [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  2, 23, 23,  3],  // 13  open approach to the entrance
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3, 83,  3,  3,  3],  // 14  ← col 12 = NORTH_BASIN_ENTRANCE
];

const NORTH_BASIN_S_ITEMS = [];

// ─── The North Basin — Silt Flats  (16 × 15) ─────────────────────────────────
// The region's first real encounter map: a low, drying marsh field, still
// close to the road but well past being maintained. East is an OPEN EDGE
// using the generic EDGE_TRANSITIONS system (world-transitions.js), not a
// point-tile: col 15, rows 9-11, is open ground leading back to
// NORTH_BASIN_S_MAP's west edge (same rows on both sides, so crossing never
// clamps) — see EDGE_TRANSITIONS['NORTH_BASIN_SW_MAP'].
// North is now ALSO an OPEN EDGE (EDGE_TRANSITIONS, not the old point-tile):
// row 0, cols 1-10, is open ground up to NORTH_BASIN_W_MAP's (West Shore)
// south edge, x preserved. The open range stops at col 10 rather than col 14
// because rows 1-3 cols 11-13 are the reservoir finger (WATER) — landing a
// crossing there would strand the player, so cols 11-14 stay impassable
// border on that (water) side. See EDGE_TRANSITIONS['NORTH_BASIN_SW_MAP'].north.
// (The old NORTH_BASIN_W_EXIT/ENTRANCE point-tiles 90/91 are retired the same
// way tiles 84-87 were when their links became edges — see tiles.js.)
//
// Only a literal 3×3 block of water (rows 1-3, cols 11-13) — the SW finger
// of the central reservoir, poking down toward this corner of the basin,
// not a wide open-water band the way the Centre map is. Everything else here
// is the flats proper: GRASS-dominant (this is deliberately the *first* map
// in the region with GRASS — see movement.js's encounter check, which only
// rolls on GRASS — everything else in the North Basin so far has been kept
// safe on purpose; this one isn't), scattered with reed clumps, drying
// BASIN_MUD patches, bare EXPOSED_STONE where the old lakebed shows through,
// and a handful of FENCE_POST tiles — the last remains of a farm/pasture
// boundary the encroaching marsh swallowed long before the drought started
// exposing the rest of it. South/west borders are plain impassable TREE —
// SW is a corner of the planned 3×3 grid, so those two edges are the true
// edge of the region, not "future neighbour" placeholders. North is the one
// open crossing (to the West Shore), cols 1-10 of row 0.
//
// Encounters: NORTH_BASIN_ENEMY_TEMPLATES (combat.js), gentler than
// FAR_ENEMY_TEMPLATES on purpose — this is meant to be the basin's on-ramp,
// not another spike (see BALANCE_REPORT.md re: FAR pool's Rotwood Troll).
const NORTH_BASIN_SW_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  3,  3,  3,  3,  3],  //  0  open edge, cols 1-10 → EDGE_TRANSITIONS north to NORTH_BASIN_W_MAP (cols 11-14 stay border: reservoir finger below)
  [  3,  0, 23,  0,  0,  0, 23,  0,  0,  0, 23,  1,  1,  1, 23,  3],  //  1  3×3 reservoir finger begins (cols 11-13)
  [  3, 23,  0,  0, 88,  0,  0,  0,  0,  0, 23,  1,  1,  1, 23,  3],  //  2  reservoir finger
  [  3,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1, 23,  3],  //  3  reservoir finger ends; reed fringe around it
  [  3,  0, 23,  0, 88,  0,  0, 23, 23,  0,  0, 88,  0, 23,  0,  3],  //  4  marsh field begins
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3],  //  5  open field
  [  3,  0,  0, 89,  0,  0,  0,  0,  0,  0,  0,  0, 89,  0,  0,  3],  //  6  old fence posts, half-swallowed by silt
  [  3,  0, 88, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,  0,  3],  //  7  exposed lakebed stone
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3],  //  8  open field
  [  3, 81, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81, 81, 23],  //  9  drying mud patches; open edge, col 15 → EDGE_TRANSITIONS east
  [  3,  0,  0,  0, 89,  0,  0,  0,  0,  0,  0, 23, 23, 23, 23, 23],  // 10  open edge, col 15 → EDGE_TRANSITIONS east to NORTH_BASIN_S_MAP
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23],  // 11  open edge, col 15 → EDGE_TRANSITIONS east (matches South Approach's west edge exactly -- no clamping in normal play)
  [  3, 81, 81,  0,  0, 89,  0,  0,  0,  0,  0,  0,  0, 81, 81,  3],  // 12  drying mud patches
  [  3,  0,  0,  0,  0,  0, 88, 88,  0,  0,  0,  0,  0,  0,  0,  3],  // 13  exposed lakebed stone
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3],  // 14  border (true south edge of the region — SW is a corner)
];

const NORTH_BASIN_SW_ITEMS = [];

// ─── The North Basin — West Shore  (16 × 15) ─────────────────────────────────
// North of the Silt Flats ("W" in the future 3×3 grid). This is the west bank
// of the North Basin: still part of the drying reservoir system, but rougher
// and less maintained than the South Approach. The maintained road never
// reaches here — you come up off the flats onto bare shore ground.
//
// SOUTH is an OPEN EDGE (EDGE_TRANSITIONS, not a point-tile): row 14, cols
// 1-10, is open ground back down to the Silt Flats' north edge, x preserved
// (see EDGE_TRANSITIONS['NORTH_BASIN_W_MAP'].south). Cols 11-14 of row 14 stay
// border to line up with the Silt Flats' own reservoir-finger side.
//
// EAST is the reservoir itself — not a canal — and its shore is drawn UNEVEN
// on purpose: the WATER edge ripples between roughly col 11 and col 14 rather
// than sitting in a straight vertical line, with REEDS at the waterline and a
// couple of stranded FENCE_POST stakes (old waterline markers) where the
// basin has fallen away. A fisher's hut (drawn with the shared TRAPPER_HUT
// tile — a weathered shack; no fisher-specific tile added for one prop) leans
// near the eastern shore at row 6 col 10, exterior-only (no interior in this
// pass; MAP_FEATURES gives it flavor text). GRASS is the dominant walkable
// ground (so this map is dangerous — GRASS/REEDS are encounter-eligible),
// broken up by safer BASIN_MUD and EXPOSED_STONE patches.
//
// WEST (col 0) and NORTH (row 0) are plain impassable TREE border FOR NOW —
// their neighbours in the 3×3 grid aren't built yet. TODO: when the west and
// north maps are added, convert these two edges to EDGE_TRANSITIONS exactly
// like the south edge here (open the relevant border tiles + add the segment).
// They're kept as a plain TREE border line specifically so that's a one-line
// change later, not a teardown of hard-coded shore geometry.
//
// Encounters: NORTH_BASIN_ENEMY_TEMPLATES, same pool as the Silt Flats
// (combat.js) — the user asked to keep the same enemies rather than
// introduce a second, harsher tier for this map.
const NORTH_BASIN_W_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  3,  3,  3,  3,  3],  //  0  open edge cols 1-10 → EDGE_TRANSITIONS north to NORTH_BASIN_NW_MAP (the Upper Reach) — the "one-line change later" this border was reserved for
  [  3,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  3],  //  1  reservoir shore begins (uneven): reeds at c12, water c13-14
  [  3,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  3],  //  2  water reaches in to c12
  [  3,  0,  0,  0,  0,  0,  0,  0,  0, 89,  0,  0, 23,  1,  1,  3],  //  3  ← c9 stranded waterline stake
  [  3,  0,  0, 88,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  3],  //  4  inlet: water reaches in to c11
  [  3,  0,  0,  0,  0, 81, 81,  0,  0,  0,  0, 23,  1,  1,  1,  3],  //  5  drying mud patch (safer ground)
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0, 92,  0, 23,  1,  1,  3],  //  6  ← c10 = fisher's hut (TRAPPER_HUT tile)
  [  3,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  3],  //  7
  [  3,  0,  0,  0,  0,  0, 89,  0,  0,  0,  0,  0, 23,  1,  1,  3],  //  8  ← c6 old fishing gear (stranded stake)
  [  3,  0,  0,  0, 81, 81,  0,  0,  0,  0, 23,  1,  1,  1,  1,  3],  //  9  inlet: water reaches in to c11
  [  3,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  3],  // 10
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  3],  // 11
  [  3,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  3],  // 12
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  3],  // 13
  [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  3,  3,  3,  3,  3],  // 14  open edge, cols 1-10 → EDGE_TRANSITIONS south to NORTH_BASIN_SW_MAP
];

const NORTH_BASIN_W_ITEMS = [];

// ─── The North Basin — Centre Reservoir  (16 × 15) ───────────────────────────
// SKELETON PASS: the centre map of the future 3×3 North Basin grid, directly
// north of NORTH_BASIN_S_MAP. The maintained road ends entirely before this
// map — there is no PATH tile anywhere on it. South is an OPEN EDGE using
// the generic EDGE_TRANSITIONS system (world-transitions.js), not a
// point-tile: row 14, cols 1-14 (same as NORTH_BASIN_S_MAP's own north
// edge, so crossing never clamps), is open ground leading back down to
// NORTH_BASIN_S_MAP's north shore — see EDGE_TRANSITIONS['NORTH_BASIN_C_MAP'].
//
// Rows 0-4: open reservoir — still substantial, mostly WATER, matching "the
// north is still reservoir." Rows 5-9: a ragged, receding shoreline, uneven
// rather than a clean line (drought doesn't recede evenly) — ribbons of
// WATER still reach down into what used to be lakebed, flanked by dying
// REEDS at the waterline and drying BASIN_MUD further out. Rows 10-13:
// exposed reservoir bed, mostly BASIN_MUD — this is the part that's
// "especially along the south" receding and exposed, since it's the stretch
// closest to the (now-ended) road. No visual dock/mooring-post prop is drawn
// (no new decorative-overlay system added for a two-sign skeleton map), but
// the two signs below place that idea in the text instead.
//
// North/east/west are plain impassable TREE (the future N/NE/E/SE/S/SW/W/NW
// neighbours aren't built yet — see NORTH_BASIN_S_MAP's header for the full
// 3×3 layout); south is the one real, working edge.
//
// No GRASS tiles anywhere on this map either (same reasoning as
// NORTH_BASIN_S_MAP) — zero encounter-eligible terrain, no combat.js changes.
const NORTH_BASIN_C_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3],  //  0  border (reservoir continues beyond, off-map)
  [  3,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  3],  //  1  open reservoir
  [  3,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  3],  //  2  open reservoir
  [  3,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  3],  //  3  open reservoir
  [  3,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  3],  //  4  open reservoir
  [  3,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  3],  //  5  shoreline starts to ripple
  [  3,  1, 23, 23, 81,  1,  1,  1,  1,  1,  1, 81, 23, 23,  1,  3],  //  6  mud creeping in at the edges
  [  3, 23, 81, 81, 81, 23,  1,  1,  1,  1, 23, 81, 81, 81, 23,  3],  //  7  ← water authority gauge (c4)
  [  3, 81, 81, 81, 23, 23,  1,  1,  1,  1, 23, 23, 81, 81, 81,  3],  //  8  receding inlet reaches down at c6-9
  [  3, 81, 81, 23, 23,  1,  1, 23, 23,  1,  1, 23, 23, 81, 81,  3],  //  9  last residual pools
  [  3, 81, 81, 81, 23, 23, 81, 81, 81, 81, 23, 23, 81, 81, 81,  3],  // 10  ← stranded mooring post (c10)
  [  3, 81, 81, 81, 81, 23, 81, 81, 81, 81, 23, 81, 81, 81, 81,  3],  // 11  exposed bed
  [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  // 12  exposed bed
  [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  // 13  exposed bed, approach to the entrance — road has fully ended
  [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  3],  // 14  open edge, cols 1-14 → EDGE_TRANSITIONS south to NORTH_BASIN_S_MAP (matches its north edge exactly -- no clamping in normal play)
];

const NORTH_BASIN_C_ITEMS = [];

// ─── The North Basin — Upper Reach  (16 × 15) ────────────────────────────────
// The NW square of the 3×3 North Basin grid, directly north of the West
// Shore. This is the arm of the reservoir the water left FIRST — not a
// receding shoreline like the Reservoir map, but a finished fact: the whole
// square is exposed bed (BASIN_MUD) from border to border, with only two
// residual pools the drought hasn't taken yet. Deliberately liminal and
// wrong: no NPCs, no towns, no encounters (no GRASS and no other
// encounter-eligible terrain — the silence is the point), and no saving
// (MAP_METADATA allowSave: false, enforced by the save-confirm guard in
// input.js — the first map to actually use it). The wrongness is authored
// in MAP_FEATURES: a fence line crossing what was open water, a doorframe
// standing attached to nothing, a stair the water was hiding.
//
// Two entrances lead OUT of the square:
//   - CHAMBER_DOOR (103) at r3 c12 — the freestanding doorframe; stepping
//     through enters BASIN_CHAMBER_MAP (enterBasinChamber).
//   - SUNKEN_STAIR (107) at r9 c4 — the drought-exposed stairhead in its
//     stonework apron; stepping on descends to SUNKEN_GALLERY_MAP
//     (descendSunkenGallery).
//
// South edge: open cols 1-10 (REEDS, walkable) → EDGE_TRANSITIONS south to
// NORTH_BASIN_W_MAP (whose row-0 border opens the same cols — the "one-line
// change later" its header comment reserved). Ranges match exactly, so
// crossings never clamp. North/east/west stay TREE (unbuilt neighbours).
//
// The straight FENCE_POST line at r6 c2-c9 blocks — pass around it at c1 or
// c10+. Both entrances and the south edge stay mutually reachable either
// way (checked by the transition audit's escapability sweep).
const NORTH_BASIN_NW_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3],  //  0  north border (unbuilt N neighbour)
  [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  //  1  open bed
  [  3, 81, 88, 81, 81, 81, 81,  1,  1, 81, 81, 81, 88, 81, 81,  3],  //  2  north pool begins (c7-8)
  [  3, 81, 81, 81, 81, 81,  1,  1,  1,  1, 81, 88,103, 88, 81,  3],  //  3  pool c6-9; THE DOORFRAME at c12, stone flanks c11/c13
  [  3, 81, 81, 81, 81, 81, 81,  1,  1, 81, 81, 81, 81, 81, 81,  3],  //  4  pool tapers
  [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  //  5
  [  3, 81, 89, 89, 89, 89, 89, 89, 89, 89, 81, 81, 81, 81, 81,  3],  //  6  the fence line (c2-c9) — dead straight, in what was open water
  [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 88, 81, 81,  3],  //  7
  [  3, 81, 81, 88, 88, 88, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  //  8  stonework apron begins (c3-5)
  [  3, 81, 81, 88,107, 88, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  //  9  THE STAIRHEAD at c4
  [  3, 81, 81, 88, 88, 88, 81, 81, 81, 81,  1,  1, 81, 81, 81,  3],  // 10  apron ends; south residual pool c10-11
  [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  // 11
  [  3, 81, 81, 81, 81, 88, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  // 12
  [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  // 13  north-crossing landing row (cols 1-10 all walkable)
  [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3,  3,  3,  3,  3],  // 14  open edge cols 1-10 (BASIN_MUD, walkable) → EDGE_TRANSITIONS south to NORTH_BASIN_W_MAP
];

const NORTH_BASIN_NW_ITEMS = [];

// ─── The Unmarked Chamber  (16 × 15) ─────────────────────────────────────────
// Through the freestanding doorframe on the Upper Reach. A perfectly square
// 7×7 room (rows 3-9, cols 5-11) with the threshold gap dead center in the
// south wall (CHAMBER_EXIT, r10 c8). Nothing else. No encounters, no save,
// no NPCs, no vignette (render.js skips it here like the dream — flat light
// with no darkened corners is part of the wrongness). All the content is
// MAP_FEATURES text.
//
// Lore boundary: like the Deep Works sealed room, this chamber is
// deliberately unexplained. LORE.md was intentionally not updated and
// should stay untouched unless the chamber becomes story-important.
const BASIN_CHAMBER_MAP = [
  //  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
  [ 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105],  //  0
  [ 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105],  //  1
  [ 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105],  //  2
  [ 105, 105, 105, 105, 105, 104, 104, 104, 104, 104, 104, 104, 105, 105, 105, 105],  //  3  interior top (c5-c11)
  [ 105, 105, 105, 105, 105, 104, 104, 104, 104, 104, 104, 104, 105, 105, 105, 105],  //  4
  [ 105, 105, 105, 105, 105, 104, 104, 104, 104, 104, 104, 104, 105, 105, 105, 105],  //  5
  [ 105, 105, 105, 105, 105, 104, 104, 104, 104, 104, 104, 104, 105, 105, 105, 105],  //  6  center row
  [ 105, 105, 105, 105, 105, 104, 104, 104, 104, 104, 104, 104, 105, 105, 105, 105],  //  7
  [ 105, 105, 105, 105, 105, 104, 104, 104, 104, 104, 104, 104, 105, 105, 105, 105],  //  8
  [ 105, 105, 105, 105, 105, 104, 104, 104, 104, 104, 104, 104, 105, 105, 105, 105],  //  9  interior bottom
  [ 105, 105, 105, 105, 105, 105, 105, 105, 106, 105, 105, 105, 105, 105, 105, 105],  // 10  threshold (CHAMBER_EXIT) dead center, c8
  [ 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105],  // 11
  [ 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105],  // 12
  [ 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105],  // 13
  [ 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105],  // 14
];

const BASIN_CHAMBER_ITEMS = [];

// ─── The Sunken Gallery  (16 × 15) ───────────────────────────────────────────
// Down the drought-exposed stair. A long east-west hall that was underwater
// until this year: silt drifts (BASIN_MUD) on the floor, column stubs, and
// the whole south side still flooded — the water didn't leave, it only
// pulled back this far. The flooded rows are impassable WATER: the gallery
// visibly continues under it (future expansion goes there). Encounters use
// SUNKEN_GALLERY_ENEMY_TEMPLATES via MAP_METADATA.encounterPool — Pale
// Drowned and Silt Hag, identical stats to their Mire Vault entries (same
// creatures, newly exposed hunting ground). GALLERY_STAIR_UP (110) at r2 c2
// climbs back to the Upper Reach. No save here either (allowSave: false).
const SUNKEN_GALLERY_MAP = [
  //  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
  [ 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109],  //  0
  [ 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109],  //  1
  [ 109, 109, 110, 108, 108, 108, 108, 108, 108, 109, 108, 108, 108, 108, 109, 109],  //  2  stair up c2; column stub c9
  [ 109, 109, 108, 108,  81, 108, 108, 108, 108, 108, 108, 108,  81, 108, 109, 109],  //  3  silt drifts c4, c12
  [ 109, 109, 108, 108, 108, 109, 108, 108, 109, 108, 108, 108, 108, 108, 109, 109],  //  4  column stubs c5, c8
  [ 109, 109,  81, 108, 108, 108, 108, 108, 108, 108,  81, 108, 108, 108, 109, 109],  //  5  ← Potion at c13 (dry ledge)
  [ 109, 109, 108, 108, 108, 108, 109, 108, 108, 108, 108, 108, 108,  81, 109, 109],  //  6  column stub c6
  [ 109, 109,   1,   1, 108, 108, 108, 108, 108, 108, 108, 108,   1,   1, 109, 109],  //  7  water reaching in from both ends
  [ 109, 109,   1,   1,   1, 108, 108,  81, 108, 108, 108,   1,   1,   1, 109, 109],  //  8
  [ 109, 109,   1,   1,   1,   1, 108, 108, 108,   1,   1,   1,   1,   1, 109, 109],  //  9  mostly flooded
  [ 109, 109,   1,   1,   1,   1,   1,   1,   1,   1,   1,   1,   1,   1, 109, 109],  // 10  fully flooded — the gallery continues under it
  [ 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109],  // 11
  [ 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109],  // 12
  [ 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109],  // 13
  [ 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109],  // 14
];

const SUNKEN_GALLERY_ITEMS = [
  { name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 5.5 * TILE, picked: false },
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
// bridge_soldier_north at col 7 row 3: facing down, tolls southbound travelers.
// bridge_soldier_south at col 7 row 9: facing up, tolls northbound travelers.
// Player entering from south spawns at row 13; from north at row 1.
const BRIDGE_CROSSING_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3, 59,  3,  3,  3,  3,  3,  3,  3,  3],  //  0  BRIDGE_EXIT north col 7
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  1  N bank; player entry from north
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  2  N bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  3  bridge_soldier_north at c7
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  4  N bank approach
  [  1,  1,  1,  1,  1,  1,  1, 58,  1,  1,  1,  1,  1,  1,  1,  1],  //  5  canal; BRIDGE_DECK c7
  [  1,  1,  1,  1,  1,  1,  1, 58,  1,  1,  1,  1,  1,  1,  1,  1],  //  6  canal; BRIDGE_DECK c7
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  7  S bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  8  S bank
  [  3,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  0,  3],  //  9  bridge_soldier_south at c7
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
// washing basins along the walls. Exit: col 7 row 12.
const DRENWICK_WASH_HOUSE_MAP = [
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  1
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  2
  [ 19, 19, 18, 33, 33, 33, 33, 33, 33, 33, 18, 18, 18, 18, 19, 19],  //  3  cols 3-9 = wash basins (north wall), col 10 = notice area
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  4  col 2 = supply/linen shelf
  [ 19, 19, 33, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  5  col 2 = supply shelf
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  6
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  7
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  8  WASH_BASIN at col 7 row 8
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  //  9
  [ 19, 19, 18, 33, 33, 33, 18, 18, 18, 33, 33, 33, 18, 18, 19, 19],  // 10  cols 3-5 and 9-11 = stone benches
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19],  // 11
  [ 19, 19, 19, 19, 19, 19, 19, 20, 19, 19, 19, 19, 19, 19, 19, 19],  // 12  INTERIOR_EXIT col 7
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 13
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14
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
  [ 19, 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 33, 18, 19, 19],  //  5  col 12 = east shelving (allocation manifest nearby)
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

// ─── South Ruins — Entrance Hall  (16 × 15) ──────────────────────────────────
// The top floor of the ruin — a grand, half-drained castle hall the player
// lands in from the overworld DUNGEON_ENTRANCE tile, before ever reaching the
// monster-infested floor 1 below. No random encounters here (see combat.js's
// startCombat() pool selection and movement.js's encounter check — neither
// references inDungeonEntrance, so none of the floor pools ever get rolled).
// 77 = ruin floor   78 = ruin wall / broken pillar   79 = stairs down (→ floor 1)
// 80 = exit (→ overworld)   1 = standing water (drained fountain basin remnant)
// Layout: a narrow stair-corridor (rows 1-4, cols 6-9) opens into a wide
// colonnaded hall (rows 5-10, cols 2-13) with a dried central basin (rows 7-8,
// cols 7-8) and broken pillar stumps (col 4 and col 11 at rows 6 and 9), then
// narrows back into a south corridor (rows 11-12) to the entrance/exit at
// row 13 col 7 — the same col-7 spine DUNGEON_MAP's own entry room uses, so
// the two floors read as the same building.
const DUNGEON_ENTRANCE_MAP = [
  [78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78],  //  0
  [78,78,78,78,78,78,78,79,79,78,78,78,78,78,78,78],  //  1  ← stairs down, cols 7-8
  [78,78,78,78,78,78,77,77,77,77,78,78,78,78,78,78],  //  2
  [78,78,78,78,78,78,77,77,77,77,78,78,78,78,78,78],  //  3
  [78,78,78,78,78,78,77,77,77,77,78,78,78,78,78,78],  //  4
  [78,78,77,77,77,77,77,77,77,77,77,77,77,77,78,78],  //  5  hall opens, cols 2-13
  [78,78,77,77,78,77,77,77,77,77,77,78,77,77,78,78],  //  6  pillar stumps col 4, col 11
  [78,78,77,77,77,77,77, 1, 1,77,77,77,77,77,78,78],  //  7  drained basin, cols 7-8
  [78,78,77,77,77,77,77, 1, 1,77,77,77,77,77,78,78],  //  8  drained basin, cols 7-8
  [78,78,77,77,78,77,77,77,77,77,77,78,77,77,78,78],  //  9  pillar stumps col 4, col 11
  [78,78,77,77,77,77,77,77,77,77,77,77,77,77,78,78],  // 10
  [78,78,78,78,78,78,77,77,77,77,78,78,78,78,78,78],  // 11
  [78,78,78,78,78,78,77,77,77,77,78,78,78,78,78,78],  // 12  entry room
  [78,78,78,78,78,78,78,80,78,78,78,78,78,78,78,78],  // 13  ← exit, col 7 (return to overworld)
  [78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78],  // 14
];

const DUNGEON_ENTRANCE_ITEMS = [];

// ─── Dungeon Map  (16 × 15, same grid as MAP) ────────────────────────────────
// 4 = dungeon floor   5 = dungeon wall   7 = exit (return to overworld)
const DUNGEON_MAP = [
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],  //  0
  [5,5,5,5,5,4,4,4,10,4,4,5,5,5,5,5],  //  1  ← col 8 = stairs down to floor 2
  [5,5,5,5,5,4,4,4,4,4,4,5,5,5,5,5],  //  2  ← north exit at col 7
  [5,5,5,5,5,4,4,4,4,4,4,5,5,5,5,5],  //  3
  [5,5,5,5,5,5,5,4,4,5,5,5,5,5,5,5],  //  4  north corridor
  [5,5,4,4,4,4,4,4,4,4,4,4,4,4,5,5],  //  5
  [4,5,4,4,4,4,4,4,4,4,4,4,4,4,5,5],  //  6  main hall (col 0 = alcove)
  [4,72,4,4,4,4,4,4,4,4,4,4,4,4,5,5],  //  7  col 1 = false wall (secret entrance); col 0 = alcove, holds DUNGEON_ALCOVE_CHEST
  [4,5,4,4,4,4,4,4,4,4,4,4,4,4,5,5],  //  8  col 0 = alcove
  [5,5,5,5,5,5,5,4,4,5,5,5,5,5,5,5],  //  9  south corridor
  [5,5,5,5,5,5,5,4,4,5,5,5,5,5,5,5],  // 10
  [5,5,5,5,5,4,4,4,4,4,4,5,5,5,5,5],  // 11
  [5,5,5,5,5,4,4,4,4,4,4,5,5,5,5,5],  // 12  entry room
  [5,5,5,5,5,4,4,7,4,4,4,5,5,5,5,5],  // 13  ← south exit at col 7 (back to overworld)
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],  // 14
];

// ─── Dungeon 2 Map  (16 × 15) ────────────────────────────────────────────────
// 8 = d2 floor   9 = d2 wall   11 = stairs up (→ d1)   7 = exit (→ overworld)
const DUNGEON2_MAP = [
  [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],  //  0
  [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],  //  1
  [9,9,9,9,9,9,8,11,8,9,9,9,9,9,9,9],  //  2  ← stairs up col 7
  [9,9,9,9,9,9,8,8,8,9,9,9,9,9,9,9],  //  3  north corridor
  [9,9,9,9,9,9,8,8,8,9,9,9,9,9,9,9],  //  4
  [9,9,9,9,8,8,8,8,8,8,8,8,9,9,9,9],  //  5  main chamber
  [9,9,9,9,8,8,8,8,8,8,8,8,9,9,9,9],  //  6
  [9,9,9,9,8,8,8,8,8,8,8,8,9,9,9,9],  //  7
  [9,9,9,9,8,8,8,8,8,8,8,8,9,9,9,9],  //  8
  [9,9,9,9,9,9,8,8,8,9,9,9,9,9,9,9],  //  9  south corridor
  [9,9,9,9,9,9,8,8,8,9,9,9,9,9,9,9],  // 10
  [9,9,9,9,9,8,8,8,8,8,8,9,9,9,9,9],  // 11  south room
  [9,9,9,9,9,8,8,8,8,8,8,9,9,9,9,9],  // 12
  [9,9,9,9,9,8,8,10,8,8,8,9,9,9,9,9],  // 13  ← stairs down col 7 (→ floor 3)
  [9,9,9,9,9,9, 9, 9,9,9,9,9,9,9,9,9],  // 14
];

// ─── South Ruins — Floor 3, 3×3 sub-room grid ────────────────────────────────
//
//  Grid layout:  [TL] — [TC] — [TR]
//                 |      |      |
//                [ML] — [MC] — [MR]
//                 |      |      |
//                [BL] — [BC] — [BR]  ← stairs down to floor 4 ONLY in BR
//
//  Entry from floor 2: TC (stairs up at r1,c8).  Arrive at r3,c7.
//  Exit  to  floor 4: BR (stairs down at r13,c7). Arrive at r12,c7 when ascending.
//
//  Passage tile IDs:
//    68 = D3_EAST_PASSAGE  (right  wall opening)
//    69 = D3_WEST_PASSAGE  (left   wall opening)
//    70 = D3_SOUTH_PASSAGE (bottom wall opening)
//    71 = D3_NORTH_PASSAGE (top    wall opening)

// TC — Top-Centre (entry hub).  Stairs up r1c8.  Passages E→TR, W→TL, S→MC.
const DUNGEON3_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  //  0
  [ 5, 5, 5, 5, 5, 4, 4, 4,11, 4, 4, 5, 5, 5, 5, 5],  //  1  ← stairs up col 8
  [ 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  //  2
  [ 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  //  3  ← arrive here from floor 2
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  4
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  5
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  6
  [69, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,68],  //  7  ← W-passage c0, E-passage c15
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  8
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  9
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 10
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 11
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 12
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 13
  [ 5, 5, 5, 5, 5, 5, 5,70,70, 5, 5, 5, 5, 5, 5, 5],  // 14  ← S-passage c7+c8
];

// TL — Top-Left (old scripture room).  Passages E→TC, S→ML.
const DUNGEON3_TL_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  //  0
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  //  1
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  2
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  3
  [ 5, 5, 4, 4, 5, 5, 4, 4, 4, 4, 5, 5, 4, 4, 5, 5],  //  4  pillars c4-5, c10-11
  [ 5, 5, 4, 4, 5, 5, 4, 4, 4, 4, 5, 5, 4, 4, 5, 5],  //  5
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  6
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,68],  //  7  ← E-passage c15; arrive c14
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  8
  [ 5, 5, 4, 4, 5, 5, 4, 4, 4, 4, 5, 5, 4, 4, 5, 5],  //  9  pillars
  [ 5, 5, 4, 4, 5, 5, 4, 4, 4, 4, 5, 5, 4, 4, 5, 5],  // 10
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  // 11
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 12
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 13
  [ 5, 5, 5, 5, 5, 5, 5,70,70, 5, 5, 5, 5, 5, 5, 5],  // 14  ← S-passage c7+c8
];

// TR — Top-Right (old supply cache).  Passages W→TC, S→MR.
const DUNGEON3_TR_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  //  0
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  //  1
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  2
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  3
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  4
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  5
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  6
  [69, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  7  ← W-passage c0; arrive c1
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  8
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  9
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 10
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 11
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 12
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 13
  [ 5, 5, 5, 5, 5, 5, 5,70,70, 5, 5, 5, 5, 5, 5, 5],  // 14  ← S-passage c7+c8
];

// ML — Middle-Left (long gallery with pillars).  Passages N→TL, E→MC, S→BL.
const DUNGEON3_ML_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5,71,71, 5, 5, 5, 5, 5, 5, 5],  //  0  ← N-passage c7+c8
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  1  ← arrive from TL
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  2
  [ 5, 5, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 4, 5, 5],  //  3  pillars c3-4, c11-12
  [ 5, 5, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 4, 5, 5],  //  4
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  5
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  6
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,68],  //  7  ← E-passage c15; arrive c14
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  8
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  9
  [ 5, 5, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 4, 5, 5],  // 10  pillars
  [ 5, 5, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 4, 5, 5],  // 11
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  // 12
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 13
  [ 5, 5, 5, 5, 5, 5, 5,70,70, 5, 5, 5, 5, 5, 5, 5],  // 14  ← S-passage c7+c8
];

// MC — Middle-Centre (crossing hall).  Passages N→TC, W→ML, E→MR, S→BC.
const DUNGEON3_MC_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5,71,71, 5, 5, 5, 5, 5, 5, 5],  //  0  ← N-passage c7+c8
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  1  ← arrive from TC
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  2
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  3
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  4
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  5
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  6
  [69, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,68],  //  7  ← W c0, E c15
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  8
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  9
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  // 10
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  // 11
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  // 12
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 13
  [ 5, 5, 5, 5, 5, 5, 5,70,70, 5, 5, 5, 5, 5, 5, 5],  // 14  ← S-passage c7+c8
];

// MR — Middle-Right (rubble and collapse).  Passages N→TR, W→MC, S→BR.
const DUNGEON3_MR_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5,71,71, 5, 5, 5, 5, 5, 5, 5],  //  0  ← N-passage c7+c8
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  1  ← arrive from TR
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  2
  [ 5, 5, 4, 4, 5, 5, 4, 4, 4, 4, 5, 5, 4, 4, 5, 5],  //  3  rubble blocks c4-5, c10-11
  [ 5, 5, 4, 4, 5, 5, 4, 4, 4, 4, 5, 5, 4, 4, 5, 5],  //  4
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  5
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  6
  [69, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  7  ← W-passage c0; arrive c1
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  8
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  9
  [ 5, 5, 4, 4, 5, 5, 4, 4, 4, 4, 5, 5, 4, 4, 5, 5],  // 10  more rubble
  [ 5, 5, 4, 4, 5, 5, 4, 4, 4, 4, 5, 5, 4, 4, 5, 5],  // 11
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  // 12
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 13
  [ 5, 5, 5, 5, 5, 5, 5,70,70, 5, 5, 5, 5, 5, 5, 5],  // 14  ← S-passage c7+c8
];

// BL — Bottom-Left (old ritual chamber).  Passages N→ML, E→BC.
const DUNGEON3_BL_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5,71,71, 5, 5, 5, 5, 5, 5, 5],  //  0  ← N-passage c7+c8
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  1  ← arrive from ML
  [ 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],  //  2
  [ 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],  //  3
  [ 5, 4, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 4, 4, 5],  //  4  ceremonial pillars
  [ 5, 4, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 4, 4, 5],  //  5
  [ 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],  //  6
  [ 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,68],  //  7  ← E-passage c15; arrive c14
  [ 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],  //  8
  [ 5, 4, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 4, 4, 5],  //  9  ceremonial pillars
  [ 5, 4, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 4, 4, 5],  // 10
  [ 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],  // 11
  [ 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],  // 12
  [ 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],  // 13
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  // 14  no south exit
];

// BC — Bottom-Centre (approach hall).  Passages N→MC, W→BL, E→BR.
const DUNGEON3_BC_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5,71,71, 5, 5, 5, 5, 5, 5, 5],  //  0  ← N-passage c7+c8
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  1  ← arrive from MC
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  2
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  3
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  4
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  5
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  6
  [69, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,68],  //  7  ← W c0, E c15
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  8
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  9
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  // 10
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 11
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 12
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 13
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  // 14  no south exit
];

// BR — Bottom-Right (descent chamber).  Passages N→MR, W→BC.  Stairs DOWN r13c7.
const DUNGEON3_BR_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5,71,71, 5, 5, 5, 5, 5, 5, 5],  //  0  ← N-passage c7+c8
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  1  ← arrive from MR
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  2
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  3
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  4
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  5
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  6
  [69, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  7  ← W-passage c0; arrive c1
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  8
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  9
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 10
  [ 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  // 11
  [ 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  // 12  ← arrive here when ascending
  [ 5, 5, 5, 5, 5, 5, 4, 10, 4, 4, 4, 5, 5, 5, 5, 5], // 13  ← stairs DOWN to floor 4
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  // 14
];

// ─── South Ruins — Floor 4  (16 × 15) ────────────────────────────────────────
// Mulholland's floor. Stairs up col 8 row 1; Mulholland at (7.5T, 11.5T) blocks
// the stairs down (col 7, row 12) until defeated. Uses DUNGEON2 tile set.
const DUNGEON4_MAP = [
  [ 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],  //  0
  [ 9, 9, 9, 9, 9, 8, 8, 8,11, 8, 8, 9, 9, 9, 9, 9],  //  1  ← stairs up col 8
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  //  2
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  //  3  ← arrive here from above
  [ 9, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 9],  //  4
  [ 9, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9],  //  5
  [ 9, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9],  //  6
  [ 9, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9],  //  7
  [ 9, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9],  //  8
  [ 9, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 9],  //  9
  [ 9, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 9],  // 10
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  // 11  Mulholland at 7.5T,11.5T
  [ 9, 9, 9, 9, 9, 8, 8,10, 8, 8, 8, 9, 9, 9, 9, 9],  // 12  ← stairs down col 7
  [ 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],  // 13
  [ 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],  // 14
];

// ─── South Ruins — Floor 5  (16 × 15) ────────────────────────────────────────
// Wrongteeth's floor — deepest chamber. Stairs up col 8 row 1.
// Wrongteeth at (7.5T, 11.5T), far south of entry at row 3. No stairs down.
const DUNGEON5_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  //  0
  [ 5, 5, 5, 5, 5, 4, 4, 4,11, 4, 4, 5, 5, 5, 5, 5],  //  1  ← stairs up col 8
  [ 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  //  2
  [ 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  //  3  ← arrive here from above
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  4
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  5
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  6
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  7
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  8
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  9
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 10
  [ 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  // 11  Wrongteeth at 7.5T,11.5T
  [ 5, 5, 5, 5, 5, 4, 4,10, 4, 4, 4, 5, 5, 5, 5, 5],  // 12  ← stairs down col 7 (gated by BOSS.defeated)
  [ 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  // 13  dead end
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  // 14
];

// ─── South Ruins — Floor 6  (16 × 15) ────────────────────────────────────────
// Pillar hall. DUNGEON2 tile set. Stairs up col 8 row 1; stairs down col 7 row 13.
const DUNGEON6_MAP = [
  [ 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],  //  0
  [ 9, 9, 9, 9, 9, 8, 8, 8,11, 8, 8, 9, 9, 9, 9, 9],  //  1  ← stairs up col 8
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  //  2
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  //  3  ← arrive here from above
  [ 9, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 9],  //  4
  [ 9, 9, 8, 8, 9, 8, 8, 8, 8, 8, 8, 9, 8, 8, 9, 9],  //  5  pillar gaps at col 4 and col 11
  [ 9, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9],  //  6
  [ 9, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9],  //  7  main chamber
  [ 9, 9, 8, 8, 9, 8, 8, 8, 8, 8, 8, 9, 8, 8, 9, 9],  //  8  pillar gaps at col 4 and col 11
  [ 9, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 9],  //  9
  [ 9, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 9],  // 10
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  // 11
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  // 12
  [ 9, 9, 9, 9, 9, 8, 8,10, 8, 8, 8, 9, 9, 9, 9, 9],  // 13  ← stairs down col 7
  [ 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],  // 14
];

// ─── South Ruins — Floor 7  (16 × 15) ────────────────────────────────────────
// Catacomb niches. DUNGEON tile set. Stairs up col 8 row 1; stairs down col 7 row 13.
const DUNGEON7_MAP = [
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  //  0
  [ 5, 5, 5, 5, 5, 4, 4, 4,11, 4, 4, 5, 5, 5, 5, 5],  //  1  ← stairs up col 8
  [ 5, 4, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  //  2  cols 1-2 = hidden antechamber
  [ 5, 4, 4, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  //  3  cols 1-2 = hidden antechamber
  [ 5, 5,72, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  //  4  col 2 = false wall (secret from top-left niche)
  [ 5, 5, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 5, 4, 5, 5],  //  5  burial niches col 2 and col 13
  [ 5, 5, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 5, 4, 5, 5],  //  6  burial niches
  [ 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5],  //  7  central corridor
  [ 5, 5, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 5, 4, 5, 5],  //  8  burial niches
  [ 5, 5, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 5, 4, 5, 5],  //  9  burial niches
  [ 5, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 5],  // 10
  [ 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  // 11
  [ 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],  // 12
  [ 5, 5, 5, 5, 5, 4, 4,10, 4, 4, 4, 5, 5, 5, 5, 5],  // 13  ← stairs down col 7
  [ 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],  // 14
];

// ─── South Ruins — Floor 8  (16 × 15) ────────────────────────────────────────
// Central chamber with side passages to horror branches. DUNGEON2 tile set.
// Stairs up col 8 row 1. West horror door (64) col 0 row 7. East horror door (66) col 15 row 7.
const DUNGEON8_MAP = [
  [ 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],  //  0
  [ 9, 9, 9, 9, 9, 8, 8, 8,11, 8, 8, 9, 9, 9, 9, 9],  //  1  ← stairs up col 8
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  //  2
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  //  3  ← arrive here from above
  [ 9, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 9],  //  4
  [ 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9],  //  5
  [ 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9],  //  6
  [64, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,66],  //  7  ← west door col 0, east door col 15
  [ 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9],  //  8
  [ 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9],  //  9
  [ 9, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 9],  // 10
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  // 11
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  // 12
  [ 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9],  // 13  dead end
  [ 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],  // 14
];

// ─── South Ruins — West Horror Branch  (16 × 15) ─────────────────────────────
// Glutinous organic chamber, entered from the right. DUNGEON3 tile set (62/63).
// Return door (65) at col 15 row 7.
const DUNGEON8_WEST_MAP = [
  [63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63],  //  0
  [63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63],  //  1
  [63,63,63,63,63,63,62,62,62,62,63,63,63,63,63,63],  //  2
  [63,63,63,63,62,62,62,62,62,62,62,62,63,63,63,63],  //  3
  [63,63,63,62,62,62,62,62,62,62,62,62,62,63,63,63],  //  4
  [63,63,62,62,62,62,63,62,62,63,62,62,62,62,63,63],  //  5  organic protrusions at col 6, col 9
  [63,63,62,62,62,62,62,62,62,62,62,62,62,62,62,63],  //  6
  [63,63,62,62,62,62,62,62,62,62,62,62,62,62,62,65],  //  7  ← return door col 15
  [63,63,62,62,62,62,62,62,62,62,62,62,62,62,62,63],  //  8
  [63,63,62,62,62,63,62,62,62,62,63,62,62,62,63,63],  //  9  organic protrusions at col 5, col 10
  [63,63,63,62,62,62,62,62,62,62,62,62,62,63,63,63],  // 10
  [63,63,63,63,62,62,62,62,62,62,62,62,63,63,63,63],  // 11
  [63,63,63,63,63,62,62,62,62,62,63,63,63,63,63,63],  // 12
  [63,63,63,63,63,63,62,62,62,63,63,63,63,63,63,63],  // 13
  [63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63],  // 14
];

// ─── South Ruins — East Horror Branch  (16 × 15) ─────────────────────────────
// Glutinous organic chamber, entered from the left. DUNGEON3 tile set (62/63).
// Return door (67) at col 0 row 7.
const DUNGEON8_EAST_MAP = [
  [63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63],  //  0
  [63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63],  //  1
  [63,63,63,63,63,63,62,62,62,62,63,63,63,63,63,63],  //  2
  [63,63,63,63,62,62,62,62,62,62,62,62,63,63,63,63],  //  3
  [63,63,63,62,62,62,62,62,62,62,62,62,62,63,63,63],  //  4
  [63,63,62,62,62,62,63,62,62,62,62,62,62,62,63,63],  //  5  organic protrusion at col 6
  [63,62,62,62,62,62,62,62,62,62,62,62,62,62,63,63],  //  6
  [67,62,62,62,62,62,62,62,62,62,62,62,62,62,63,63],  //  7  ← return door col 0
  [63,62,62,62,62,62,62,62,62,62,62,62,62,62,63,63],  //  8
  [63,63,62,62,62,62,62,62,62,63,62,62,62,62,63,63],  //  9  organic protrusion at col 9
  [63,63,63,62,62,62,62,62,62,62,62,62,62,63,63,63],  // 10
  [63,63,63,63,62,62,62,62,62,62,62,62,63,63,63,63],  // 11
  [63,63,63,63,63,62,62,62,62,62,63,63,63,63,63,63],  // 12
  [63,63,63,63,63,63,62,62,62,63,63,63,63,63,63,63],  // 13
  [63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63],  // 14
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

// ─── East Sluice Level 1  (16 × 15) ─────────────────────────────────────────
// Calwick's drainage works beneath the wetland edge. Functional brick and stone,
// damp corridors, a main east-west drainage channel, three gate crossings.
// 27=floor  28=wall  29=exit-ladder (→ east Calwick)  30=channel
//
// Layout:
//   r1  c7: access ladder (SLUICE_EXIT = 29) — exit back to surface
//   r3 & r11: east-west maintenance corridors (c2–c13)
//   r4–r6 & r8–r10: gate shafts at c2-3 (wide alcove), c5, c10, c13-14
//   r7: main drainage channel — impassable except at gate platforms c5, c10, c13
//   r12: outlet inspection nook (c7-c8)
const SLUICE_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  //  0  outer wall
  [ 28, 28, 28, 28, 28, 28, 28, 29, 27, 28, 28, 28, 28, 28, 28, 28],  //  1  access ladder (29) + landing
  [ 28, 28, 28, 28, 28, 28, 28, 27, 27, 28, 28, 28, 28, 28, 28, 28],  //  2  access shaft
  [ 28, 28, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 28, 28],  //  3  north maintenance corridor
  [ 28, 28, 27, 27, 28, 27, 28, 28, 28, 28, 27, 28, 28, 27, 27, 28],  //  4  gate shafts; W alcove c2-3, E nook c13-14
  [ 28, 28, 27, 27, 28, 27, 28, 28, 28, 28, 27, 28, 28, 27, 27, 28],  //  5  gate shafts
  [ 28, 28, 27, 27, 28, 27, 28, 28, 28, 28, 27, 28, 28, 27, 27, 28],  //  6  gate shafts (channel bank above)
  [ 28, 30, 30, 30, 30, 27, 30, 30, 30, 30, 27, 30, 30, 27, 30, 28],  //  7  MAIN CHANNEL — gate platforms at c5,c10,c13
  [ 28, 28, 27, 27, 28, 27, 28, 28, 28, 28, 27, 28, 28, 27, 27, 28],  //  8  gate shafts (channel bank below)
  [ 28, 28, 27, 27, 28, 27, 28, 28, 28, 28, 27, 28, 28, 27, 27, 28],  //  9  gate shafts
  [ 28, 28, 27, 27, 28, 27, 28, 28, 28, 28, 27, 28, 28, 27, 27, 28],  // 10  gate shafts
  [ 28, 28, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 28, 28],  // 11  south maintenance corridor
  [ 28, 28, 28, 28, 28, 28, 28, 27, 10, 28, 28, 28, 28, 28, 28, 28],  // 12  outlet nook; col 8 = DUNGEON_STAIRS_DOWN → sluice level 2
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // 13  outer wall
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // 14  outer wall
];

// ─── East Sluice Level 2 ──────────────────────────────────────────────────────
// 16×15 corridor map. Entrance (tile 29 / SLUICE_EXIT) at r5 c8 — stepping on it
// returns player to Level 1. Ladder down from Level 1 lands player at r6 c8.
// Feature chamber: r11-r13, c10-c12.  East dead-end spur: r7-r8, c14.
// Cross-corridor: r3, c3-c7. South pocket: r11-r13, c3-c5.
// FALSE_WALL (38) at r9 c11 — looks like wall, leads to secret 2×2 area (c12-c13).
// DUNGEON_STAIRS_DOWN at r10 c12 → descends to Level 3.
const SLUICE_LEVEL2_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  //  0
  [ 28, 28, 27, 27, 27, 28, 28, 28, 28, 28, 28, 27, 27, 28, 28, 28],  //  1  NW dead-end (c2-c4) + NE pocket (c11-c12)
  [ 28, 28, 28, 28, 27, 27, 27, 27, 27, 27, 27, 27, 27, 28, 28, 28],  //  2  upper corridor (c4-c12)
  [ 28, 28, 28, 27, 27, 27, 27, 27, 28, 28, 28, 28, 27, 28, 28, 28],  //  3  cross-corridor (c3-c7) + east branch top (c12)
  [ 28, 28, 28, 28, 28, 28, 28, 27, 27, 28, 28, 28, 27, 27, 27, 28],  //  4  approach (c7-c8) + east corridor (c12-c14)
  [ 28, 28, 28, 28, 28, 28, 28, 27, 29, 27, 28, 28, 28, 28, 27, 28],  //  5  ENTRANCE / ladder up (29 at c8); east wall (c14)
  [ 28, 28, 28, 28, 28, 28, 28, 27, 27, 27, 27, 27, 27, 27, 27, 28],  //  6  east horizontal corridor (c7-c14)
  [ 28, 28, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 27, 28],  //  7  west corridor (c2-c7) + east dead-end spur (c14)
  [ 28, 28, 27, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, 28, 27, 28],  //  8  west shaft N (c2) + shaft (c7) + spur end (c14)
  [ 28, 28, 27, 28, 28, 28, 28, 27, 27, 27, 27, 38, 27, 27, 28, 28],  //  9  west shaft S (c2) + south corridor (c7-c10) + FALSE_WALL (c11) + secret entry (c12-c13)
  [ 28, 28, 27, 27, 27, 27, 27, 27, 28, 28, 27, 28, 10, 27, 28, 28],  // 10  bottom corridor (c2-c7) + feature access (c10) + STAIRS_DOWN (c12) + secret floor (c13)
  [ 28, 28, 28, 27, 27, 27, 28, 28, 28, 28, 27, 27, 27, 28, 28, 28],  // 11  south pocket (c3-c5) + feature chamber top (c10-c12)
  [ 28, 28, 28, 27, 27, 27, 28, 28, 28, 28, 27, 28, 27, 28, 28, 28],  // 12  south pocket (c3-c5) + feature chamber sides
  [ 28, 28, 28, 27, 27, 27, 28, 28, 28, 28, 27, 27, 27, 28, 28, 28],  // 13  south pocket (c3-c5) + feature chamber bottom
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // 14
];

// ─── East Sluice Level 3 — Deep Works ────────────────────────────────────────
// Accessed via DUNGEON_STAIRS_DOWN at Level 2 r10 c12 (hidden behind false wall).
// Player enters at r4 c7 (one south of DUNGEON2_STAIRS_UP at r3 c7).
// Layout: narrow entry shaft → wide east-west corridor (r5 c3-c11) →
//   west dead-end pocket (r7 c3-c5) + east dead-end pocket (r7 c9-c11) →
//   south shaft (c7 r4-r8) → south chamber (r9-r11 c5-c9).
// SEALED ROOM ENTRANCE: two consecutive FALSE_WALLs (38) at r7 c12-c13 — the
//   east pocket's dead end, deliberately indistinguishable from wall — lead
//   to SLUICE_SECRET_ENTRANCE (99, also rendered as wall) at r7 c14, which
//   transitions to SLUICE_SECRET_MAP (below). Nothing on this floor hints at
//   any of the three tiles; the floor looks exactly as it did before them.
const SLUICE_LEVEL3_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  //  0
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  //  1
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  //  2
  [ 28, 28, 28, 28, 28, 28, 28, 11, 28, 28, 28, 28, 28, 28, 28, 28],  //  3  DUNGEON2_STAIRS_UP (c7)
  [ 28, 28, 28, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, 28, 28, 28],  //  4  player entry shaft (c7)
  [ 28, 28, 28, 27, 27, 27, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28],  //  5  main corridor (c3-c11)
  [ 28, 28, 28, 27, 28, 28, 28, 27, 28, 28, 28, 27, 28, 28, 28, 28],  //  6  corridor sides (c3, c7, c11)
  [ 28, 28, 28, 27, 27, 27, 28, 27, 28, 27, 27, 27, 38, 38, 99, 28],  //  7  west pocket (c3-c5), c7 shaft, east pocket (c9-c11); FALSE_WALLs c12-c13 + hidden entrance (99, c14)
  [ 28, 28, 28, 28, 28, 27, 28, 27, 28, 28, 28, 28, 28, 28, 28, 28],  //  8  west end (c5), south shaft (c7)
  [ 28, 28, 28, 28, 28, 27, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28],  //  9  south chamber top + hidden annex (c10-c11)
  [ 28, 28, 28, 28, 28, 27, 28, 28, 28, 27, 27, 27, 28, 28, 28, 28],  // 10  south chamber sides + hidden annex (c10-c11)
  [ 28, 28, 28, 28, 28, 27, 27, 27, 27, 27, 38, 27, 28, 28, 28, 28],  // 11  south chamber bottom; c10 = false wall (secret)
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // 12
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // 13
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // 14
];

// ─── East Sluice — Sealed Room (SLUICE_SECRET_MAP, "sluiceFloor 4") ──────────
// Reached only through the Deep Works false walls above (L3 r7 c12-c13 →
// SLUICE_SECRET_ENTRANCE at c14). A narrow corridor from the entry point
// (SLUICE_SECRET_EXIT, 100, at r2 c7 — stepping on it returns to the L3 east
// pocket) runs down into a room the sluice was built around, not for:
// carved markings (95, east wall r9 c10), eleven notches (96, south wall
// r11 c7), an old blood stain (97, r9 c7), and a works clerk's journal
// (98, r10 c5). Encounters anywhere on this map are rare (1/64 per roll)
// but draw the Tallyman pool — see inSluiceSealedRoom() (movement.js).
const SLUICE_SECRET_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  //  0
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  //  1
  [ 28, 28, 28, 28, 28, 28, 28,100, 28, 28, 28, 28, 28, 28, 28, 28],  //  2  SLUICE_SECRET_EXIT (c7) → back to Deep Works
  [ 28, 28, 28, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, 28, 28, 28],  //  3  entry corridor (c7)
  [ 28, 28, 28, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, 28, 28, 28],  //  4  entry corridor
  [ 28, 28, 28, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, 28, 28, 28],  //  5  entry corridor
  [ 28, 28, 28, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, 28, 28, 28],  //  6  entry corridor
  [ 28, 28, 28, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, 28, 28, 28],  //  7  doorway into the room
  [ 28, 28, 28, 28, 28, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28],  //  8  room top (c5-c9)
  [ 28, 28, 28, 28, 28, 27, 27, 97, 27, 27, 95, 28, 28, 28, 28, 28],  //  9  room middle: blood stain (97, c7); marked wall (95, c10)
  [ 28, 28, 28, 28, 28, 98, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28],  // 10  room bottom: journal (98, c5)
  [ 28, 28, 28, 28, 28, 28, 28, 96, 28, 28, 28, 28, 28, 28, 28, 28],  // 11  notched wall (96, c7) in the room's south wall
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // 12
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // 13
  [ 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // 14
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

// ─── Takomo's Chamber  (16 × 15) ─────────────────────────────────────────────
// Secret boss area accessed through TAKOMO_GATE on the Drenwick Waterfront quay.
// Dungeon-tile set. TAKOMO_EXIT at col 0, row 7 returns to the waterfront.
// Takomo spawns at col 8, row 7 — centre of the chamber.
const TAKOMO_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5],  //  0
  [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5],  //  1
  [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5],  //  2
  [  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5],  //  3  chamber top
  [  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5],  //  4  angled corners (all floor inside)
  [  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5],  //  5  chamber interior
  [  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5],  //  6
  [ 76,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5],  //  7  TAKOMO_EXIT c0; passage c1-2; boss at c8
  [  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5],  //  8
  [  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5],  //  9
  [  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5],  // 10  angled corners
  [  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5],  // 11  chamber bottom
  [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5],  // 12
  [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5],  // 13
  [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5],  // 14
];

// ─── Falls Hamlet Interior  (16 × 15) ────────────────────────────────────────
// Three side-by-side house interiors for the hamlet at MAP3_N1 SW corner.
// Each room is 4 tiles wide; a single-tile dividing wall separates them.
// Room A (cols 1-4): Corvel.   Exit at col 2, row 13.
// Room B (cols 6-9): Gridd.    Exit at col 7, row 13.
// Room C (cols 11-14): Mabel + Imber.  Exit at col 12, row 13.
// TABLE tiles at row 5 (cols 2, 7, 12) serve as the shared worktable/bench.
const HAMLET_INTERIOR_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  north wall
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  //  1
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  //  2
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  //  3
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  //  4
  [ 19, 18, 33, 18, 18, 19, 18, 33, 18, 18, 19, 18, 33, 18, 18, 19],  //  5  bench/worktable in each room
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  //  6
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  //  7
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  //  8
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  //  9
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  // 10
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  // 11
  [ 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19, 18, 18, 18, 18, 19],  // 12
  [ 19, 18, 20, 18, 18, 19, 18, 20, 18, 18, 19, 18, 20, 18, 18, 19],  // 13  exits: c2 c7 c12
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14  south wall
];

// ─── Fen Brewery (MAP3_N1 row 4 col 13)  ─────────────────────────────────────
// Gorrit Wend's combined dwelling and mushroom-wine brewery. Small, cramped,
// and functional. Left half = living quarters; right half = fermentation works.
// 18=floor  19=wall  20=exit  33=table/vat (impassable)
//
// The dividing wall at col 6 has a passage at rows 5-6.
// Exit at col 3, row 13 (south, back to the fen path).
const FEN_BREWERY_MAP = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  //  0  north wall
  [ 19, 18, 18, 18, 18, 18, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  1  living / brewery tops
  [ 19, 18, 18, 18, 18, 18, 19, 18, 33, 18, 33, 18, 33, 18, 18, 19],  //  2  vats at c8 c10 c12
  [ 19, 18, 18, 18, 18, 18, 19, 18, 33, 18, 33, 18, 33, 18, 18, 19],  //  3  vats (tall)
  [ 19, 18, 18, 18, 18, 18, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  4  floor between vats and shelves
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  5  passage (partition gap)
  [ 19, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  6  passage continues
  [ 19, 18, 18, 18, 18, 18, 19, 18, 18, 18, 33, 18, 33, 18, 18, 19],  //  7  partition resumes; drying shelves c10 c12
  [ 19, 18, 18, 18, 18, 18, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  8
  [ 19, 18, 18, 18, 18, 18, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19],  //  9
  [ 19, 18, 18, 18, 18, 18, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 10
  [ 19, 18, 18, 18, 18, 18, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 11
  [ 19, 18, 18, 18, 18, 18, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 12
  [ 19, 18, 18, 20, 18, 18, 19, 18, 18, 18, 18, 18, 18, 18, 18, 19],  // 13  INTERIOR_EXIT col 3
  [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19],  // 14  south wall
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
  DRENWICK_WATERFRONT_MAP:        { id: 'drenwick_waterfront',        label: 'Drenwick Waterfront',   map: DRENWICK_WATERFRONT_MAP        },
  DRENWICK_INN_MAP:               { id: 'drenwick_inn',               label: 'Drenwick \u2014 Inn',                map: DRENWICK_INN_MAP               },
  DRENWICK_OFFICE_MAP:            { id: 'drenwick_office',            label: 'Drenwick \u2014 Office',             map: DRENWICK_OFFICE_MAP            },
  DRENWICK_HARBORMASTER_MAP:      { id: 'drenwick_harbormaster',      label: 'Drenwick \u2014 Harbormaster',       map: DRENWICK_HARBORMASTER_MAP      },
  DRENWICK_WASH_HOUSE_MAP:        { id: 'drenwick_wash_house',        label: 'Drenwick \u2014 Wash House',         map: DRENWICK_WASH_HOUSE_MAP        },
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
