'use strict';

// Thornmere Wilds maps: eastern reaches, fen, Mire Vault, hamlet, brewery, East Sluice.
// Region content moved verbatim from maps.js by the regional-content-split.
// Loaded BEFORE maps.js, which keeps MAP_REGISTRY, window.* exports, and mapRegistryId().
// ─── Eastern World Map  (16 × 15) ────────────────────────────────────────────
// Connected to MAP via MAP2_EXIT at MAP row 4 col 15 / MAP2_ENTRANCE at col 0.
// Connected to MAP3 via MAP3_EXIT at row 11 col 15 / MAP3_ENTRANCE at col 0.
// Road enters from the west (col 0 row 4), winds south and east, exits east (row 11 col 15).
// Small lake at rows 8-10, cols 5-7.  Reeds at rows 7,10.  Forest clusters rows 2-3 and 7-8.
const MAP2 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3, 23, 23, 23,  3],  //  0  ← cols 12-14 = open-fen crossing → EDGE_TRANSITIONS north to Roddon Way (roadless: cut NE across the fen)
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
  [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  2,  2,  2,  2,  2],  // 11  east seam c15 → MAP3.west (continuous)
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

// ─── Far-Eastern World Map — Thornmere Fen  (16 × 15) ────────────────────────
// Connected to MAP2 via a continuous seam at row 11 (MAP2.east ↔ MAP3.west).
// Heavy wetland character: large northern lake (rows 1-3), mid-pond (rows 5-7),
// southern marsh (rows 12-13), reeds throughout.
// Road enters from the west (col 0 row 11), heads east to col 8, bends north to
// row 0, where the col-8 PATH is now the seamless MAP3↔MAP3_N1 crossing (former
// FEN_N_EXIT point tile). Also branches east at row 6: road runs col 8→15, where the
// col-15 PATH is now the continuous MAP3.east ↔ MAP4.west seam (former MAP4_EXIT).
const MAP3 = [
  //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [  1,  1,  1,  1,  1,  1,  1,  1,  2,  3,  3,  3,  3,  3,  3,  3],  //  0  ← col 8 = PATH seam to MAP3_N1; N lake continues off-map W of the road
  [  1, 23, 23,  1,  1,  1,  1, 23,  2,  0,  0,  0,  0,  0,  0,  3],  //  1  N lake + reeds; road at col 8; water W edge
  [  1, 23,  1,  1,  1,  1,  1,  1,  2,  0,  0,  0,  0,  3,  3,  3],  //  2  N lake + reeds; road at col 8; water W edge
  [  3,  0,  1,  1,  1, 23, 23,  0,  2,  0,  0,  0,  0,  3,  0,  3],  //  3  N lake edge; road at col 8
  [  3,  0, 23, 23, 23,  0,  0,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  4  reeds band; road at col 8
  [  3,  0,  0, 23,  1,  1, 23,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  5  mid-pond; road at col 8
  [  3,  0,  0, 23,  1,  1,  1, 23,  2,  2,  2,  2,  2,  2,  2,  2],  //  6  mid-pond + road east; col 15 seam → MAP4.west (continuous)
  [  3,  0,  0,  0, 23,  1, 23,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  7  reeds + road N/S
  [  3,  0,  0,  0,  0, 23,  0,  0,  2,  0,  0,  0,  0,  0,  0,  3],  //  8  reeds + road
  [  3,  0, 23,  0,  0,  0, 23, 23,  2,  0,  0,  0,  0,  0,  0,  3],  //  9  reeds + road
  [  3,  0, 23,  1,  0,  0,  0, 23,  2,  0,  0,  0,  0,  0,  0,  3],  // 10  water + reeds + road
  [  2,  2,  2,  2,  2,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  3],  // 11  ← col 0 = west seam → MAP2.east (continuous)
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
  [  0,  0,  1,  1,  1,  1,  1,  0,  0,  1,  1,  1,  1,  1,  0,  0],  //  6  ← island NW/NE (cols 7-8); col 0 = west seam → MAP3.east; col 15 = east seam → MAP5.west (continuous, GRASS shore)
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
// PILOT: MAP5's tile grid is authored directly inside its chunk definition in
// THORNMERE_REGIONAL_CHUNK_DEFINITIONS (bottom of this file) — the first regional
// chunk on the declarative chunk format, with its grid living in its record rather
// than as a standalone `const MAP5 = [...]` variable. data.js exposes a derived
// compat alias (`const MAP5 = REGIONAL_CHUNK_CATALOG.MAP5.map`) for bare-MAP5
// consumers. MAP5_ITEMS (its item ownership) stays here as ordinary content,
// referenced from the record by the stable itemSetId 'map5'.
const MAP5_ITEMS = [];

// ─── Northern Fen — MAP3_N1  (16 × 15) ───────────────────────────────────────
// Connected south to MAP3 by the seamless col-8 PATH crossing (EDGE_TRANSITIONS
// MAP3_N1.south ↔ MAP3.north, sourceRange [8,8]) — the former FEN_N_EXIT/ENTRANCE
// point tiles at MAP3 row 0 col 8 / MAP3_N1 row 14 col 8, now ordinary road.
// Connected north to MAP3_N2 (Drenwick) via an open EDGE_TRANSITIONS crossing:
// row 0, cols 3-13 (open fen, with the road at col 8 running through the
// middle) — see EDGE_TRANSITIONS['MAP3_N1'].north. Replaced the old single
// FEN_N2_EXIT road tile, so the fen now continues across the boundary instead
// of being walled by trees with one gap.
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
  [  3,  3,  3, 23, 23, 23, 23, 23,  2, 23, 23, 23, 23, 23,  3,  3],  //  0  open-fen crossing cols 3-13 (road at col 8) → EDGE_TRANSITIONS north to MAP3_N2 (Drenwick)
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
  [  3,  3,  3,  3,  3,  3,  3,  3,  2,  3,  3,  3,  3,  3,  3,  3],  // 14  ← col 8 = PATH seam to MAP3 (former FEN_N_ENTRANCE point tile)
];

const MAP3_N1_ITEMS = [
  // Mabel's fen sickle — lost at the north bank overhang (quest: Still Water).
  // Col 5, row 3: REEDS tile, directly above the bog pond water at row 4 col 5.
  { id: 'pickup_map3n1_fen_sickle', name: 'Fen Sickle', type: 'quest_item', x: 5.5 * TILE, y: 3.5 * TILE, picked: false },
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
// comment), and south to the Eastern Reaches (MAP2) via a second open
// crossing at cols 12-14 — a deliberately roadless fen gap off the SE
// corner, so reaching it means leaving the ridge and cutting across open
// fen (dissuading casual use). North and west stay plain impassable TREE
// border throughout, and the unused stretches of the east edge (rows 0-3,
// 10-14) and south edge (cols 1-11, also TREE) make clear those aren't
// overlooked exits either.
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
  [   3,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   3],  // 13  open lower fen; the SE stretch (c12-14) runs down to the MAP2 crossing
  [   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3,  23,  23,  23,   3],  // 14  cols 12-14 = open-fen crossing → EDGE_TRANSITIONS south to MAP2 (Eastern Reaches); no road
];

const RODDON_WAY_ITEMS = [
  // A small find at the end of the ridge — reaching the terminus/viewpoint
  // is its own reward; this is just a nod to it. Ordinary consumable via
  // the item registry (items.js); grantItem() overwrites type/heals/price
  // from ITEM_REGISTRY at pickup time regardless of what's listed here.
  { id: 'pickup_roddon_way_potion', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 2.5 * TILE, y: 1.5 * TILE, picked: false },
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

// ── Regional chunk definitions (Thornmere) ───────────────────────────────────
// Authored authority for this file's placed regional chunks. data.js merges the
// per-file *_REGIONAL_CHUNK_DEFINITIONS fragments and resolves encounterProfileId /
// itemSetId into the runtime REGIONAL_CHUNK_CATALOG (see data.js for the contract).
// MAP5 is the pilot: its grid is authored inline here, not as a `const MAP5` var.
const THORNMERE_REGIONAL_CHUNK_DEFINITIONS = [
  { mapId: 'MAP2', regionId: 'overworld', chunkX: 1, chunkY: 5, map: MAP2,
    displayName: 'Eastern Reaches', region: 'Eastern Reaches', contentKey: 'map2',
    presentation: 'continuous', encounterProfileId: 'reaches', itemSetId: 'map2',
    allowRandomEncounters: true, allowSave: true },
  { mapId: 'MAP3', regionId: 'overworld', chunkX: 2, chunkY: 5, map: MAP3,
    displayName: 'Thornmere Fen', region: 'Thornmere', contentKey: 'map3',
    presentation: 'continuous', encounterProfileId: 'far', itemSetId: 'map3',
    allowRandomEncounters: true, allowSave: true },
  { mapId: 'MAP4', regionId: 'overworld', chunkX: 3, chunkY: 5, map: MAP4,
    displayName: 'Thornmere', region: 'Thornmere', contentKey: 'map4',
    presentation: 'continuous', encounterProfileId: 'thornmere', itemSetId: 'map4',
    allowRandomEncounters: true, allowSave: true },
  // ── MAP5 / Thornmere Shallows — PILOT: grid authored directly in this record ──
  { mapId: 'MAP5', regionId: 'overworld', chunkX: 4, chunkY: 5,
    displayName: 'Thornmere Shallows', region: 'Thornmere', contentKey: 'overworld',
    presentation: 'continuous', encounterProfileId: 'thornmere', itemSetId: 'map5',
    allowRandomEncounters: true, allowSave: true,
    map: [
      //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  0  open water — the shallows continue off-map north
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  1  open water, open to W and E edges
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  2  open water, open to W and E edges
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  3  open water, open to W and E edges
      [  1,  1, 23,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  4  spit north shoulder; water W and E edges
      [  1, 23,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1],  //  5  spit north edge, cols 2-7; water W and E edges
      [  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1],  //  6  ← col 0 = west seam → MAP4.east (continuous, GRASS shore); spit body; water E edge
      [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1],  //  7  spit widest / tip extends to col 9; lone shore tree by the landing (col 0)
      [  1, 23,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1],  //  8  spit south edge, mirrors row 5; water W and E edges
      [  1,  1, 23,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  9  spit south shoulder, mirrors row 4
      [  1,  1,  1, 23,  0, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 10  spit inner tip
      [  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 11  last reed marking spit end
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 12  open water
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 13  open water
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  // 14  open water — the shallows continue off-map south
    ] },
  { mapId: 'RODDON_WAY_MAP', regionId: 'overworld', chunkX: 1, chunkY: 4, map: RODDON_WAY_MAP,
    displayName: 'Roddon Way', region: 'Thornmere', contentKey: 'overworld',
    presentation: 'continuous', encounterProfileId: 'far', itemSetId: 'roddon_way',
    allowRandomEncounters: true, allowSave: true,
    notes: 'A single dead-end fen map off MAP3_N1’s west edge (an old creek-bed ridge, RODDON_SILT) -- no other neighbours. Reuses MAP3_N1’s own encounter pool; no new enemies. Ordinary regional geography, not connected to the North Basin drought story.' },
  { mapId: 'MAP3_N1', regionId: 'overworld', chunkX: 2, chunkY: 4, map: MAP3_N1,
    displayName: 'Northern Fen', region: 'Thornmere', contentKey: 'map3_n1',
    presentation: 'continuous', encounterProfileId: 'far', itemSetId: 'map3_n1',
    allowRandomEncounters: true, allowSave: true },
];
window.THORNMERE_REGIONAL_CHUNK_DEFINITIONS = THORNMERE_REGIONAL_CHUNK_DEFINITIONS;
