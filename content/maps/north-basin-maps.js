'use strict';

// North Basin maps: basin squares, Basin Chamber, Sunken Gallery rooms and builders.
// Region content moved verbatim from maps.js by the regional-content-split.
// Loaded BEFORE maps.js, which keeps MAP_REGISTRY, window.* exports, and mapRegistryId().
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
// No GRASS on this map, but its REEDS are encounter-eligible all the same
// (same as GRASS — see tiles.js's TILE_PROPERTIES), so it DOES roll random
// encounters. Its pool is NORTH_BASIN_ENEMY_TEMPLATES (MAP_METADATA) — the
// same gentle basin creatures as the Silt Flats; the maintained road (PATH)
// and the water stay safe, so you meet things in the reeds.
// NORTH_BASIN_S_MAP’s 15×16 tile grid is now authored inline in its regional chunk definition record below.

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
// crossing there would strand the player, so cols 11-14 stay impassable —
// and cols 11-13 of row 0 are drawn as WATER (the finger continues off-map),
// col 14 as TREE. See EDGE_TRANSITIONS['NORTH_BASIN_SW_MAP'].north.
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
// NORTH_BASIN_SW_MAP’s 15×16 tile grid is now authored inline in its regional chunk definition record below.

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
// on purpose: the WATER edge ripples between roughly col 11 and col 14, then
// carries on as open WATER right off the east border (col 15, rows 1-13) —
// the reservoir doesn't stop at the map edge, so that whole column is WATER
// rather than a TREE line — with REEDS at the waterline and a
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
// NORTH_BASIN_W_MAP’s 15×16 tile grid is now authored inline in its regional chunk definition record below.

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
// The north edge is open reservoir WATER (the lake simply continues off-map),
// and the east/west edges are WATER too through the still-flooded upper rows
// (1-6); all of it is impassable, exactly like a TREE border — there's no
// working exit on any of these edges (the future N/NE/E/SE/S/SW/W/NW
// neighbours aren't built yet — see NORTH_BASIN_S_MAP's header for the full
// 3×3 layout). South is the one real, working edge.
//
// No GRASS on this map either, but (like the South Approach) its REEDS are
// encounter-eligible, so it rolls random encounters from the basin pool
// (NORTH_BASIN_ENEMY_TEMPLATES, MAP_METADATA). Open water and the exposed mud
// bed stay safe; encounters lurk in the reed fringe.
// NORTH_BASIN_C_MAP’s 15×16 tile grid is now authored inline in its regional chunk definition record below.

const NORTH_BASIN_C_ITEMS = [];

// ─── The North Basin — Upper Reach  (16 × 15) ────────────────────────────────
// The NW square of the 3×3 North Basin grid, directly north of the West
// Shore. This is the arm of the reservoir the water left FIRST — not a
// receding shoreline like the Reservoir map, but a finished fact: the whole
// square is exposed bed (BASIN_MUD) from border to border, with only two
// residual pools the drought hasn't taken yet. Deliberately liminal and
// wrong: no NPCs, no towns. It was long silent, but the oldest-exposed ground
// now carries its own random encounters — its BASIN_MUD rolls (this map only;
// see isEncounterEligibleTile in movement.js) against UPPER_REACH_ENEMY_TEMPLATES:
// two stranded basin creatures shared with the Silt Flats, and two new tough
// ones (Dust-Drowned, Marrow Hulk) that reflect how long and how wrong this
// arm has been dry. Ordinary outdoor saving still applies (allowSave: true;
// only the two interiors it leads to block saving). The wrongness is authored
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
// crossings never clamp. The north edge (row 0) and the whole east edge
// (col 15) are open reservoir WATER — the flooded arm the water pulled back
// into, continuing off-map; impassable exactly like a border. West stays TREE.
//
// The straight FENCE_POST line at r6 c2-c9 blocks — pass around it at c1 or
// c10+. Both entrances and the south edge stay mutually reachable either
// way (checked by the transition audit's escapability sweep).
// NORTH_BASIN_NW_MAP’s 15×16 tile grid is now authored inline in its regional chunk definition record below.

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

// ─── The Sunken Gallery — entrance hall  (16 × 15) ───────────────────────────
// Down the drought-exposed stair. A long east-west hall that was underwater
// until this year: silt drifts (BASIN_MUD) on the floor, column stubs, and
// the whole south side still flooded — the water didn't leave, it only
// pulled back this far. The flooded rows are impassable WATER: the gallery
// visibly continues under it.
// This hall is only the south-west corner (grid cell R4C0) of a larger 5×5
// complex; the other 24 rooms (galleryRoom() below) open off to the north and
// east. Two doorways are cut into this hall's walls to reach them: the north
// wall at cols 4-6 (up into R3C0) and the east wall at rows 3-5 (across into
// R4C1) — see EDGE_TRANSITIONS in world-transitions.js. Encounters use
// SUNKEN_GALLERY_ENEMY_TEMPLATES via MAP_METADATA.encounterPool — Pale
// Drowned and Silt Hag, identical stats to their Mire Vault entries (same
// creatures, newly exposed hunting ground). GALLERY_STAIR_UP (110) at r2 c2
// climbs back to the Upper Reach. No save here either (allowSave: false).
const SUNKEN_GALLERY_MAP = [
  //  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
  [ 109, 109, 109, 109, 108, 108, 108, 109, 109, 109, 109, 109, 109, 109, 109, 109],  //  0  north doorway c4-6 → R3C0
  [ 109, 109, 109, 109, 108, 108, 108, 109, 109, 109, 109, 109, 109, 109, 109, 109],  //  1
  [ 109, 109, 110, 108, 108, 108, 108, 108, 108, 109, 108, 108, 108, 108, 109, 109],  //  2  stair up c2; column stub c9
  [ 109, 109, 108, 108,  81, 108, 108, 108, 108, 108, 108, 108,  81, 108, 108, 108],  //  3  east doorway c14-15 → R4C1; silt c4, c12
  [ 109, 109, 108, 108, 108, 109, 108, 108, 109, 108, 108, 108, 108, 108, 108, 108],  //  4  east doorway c14-15; column stubs c5, c8
  [ 109, 109,  81, 108, 108, 108, 108, 108, 108, 108,  81, 108, 108, 108, 108, 108],  //  5  east doorway c14-15; ← Potion at c13 (dry ledge)
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
  { id: 'pickup_sunken_gallery_potion', name: 'Potion', type: 'potion', heals: 20, price: 30, x: 13.5 * TILE, y: 5.5 * TILE, picked: false },
];

// ─── The Sunken Gallery — the wider complex  (5 × 5 grid of rooms) ────────────
// The entrance hall above is only the south-west corner of a far larger drowned
// structure. The remaining twenty-four rooms are laid out on a 5×5 grid and
// joined with the generic open-edge system (EDGE_TRANSITIONS, world-
// transitions.js) — the same mechanism the North Basin surface maps use, so
// walking off one room's open side arrives in its neighbour with the
// inSunkenGallery flag still set (tryEdgeTransition never touches it).
//
// Grid coordinates (row, col); row 0 = north, col 0 = west:
//
//     C0     C1     C2     C3     C4
//   R0[R0C0][R0C1][R0C2][R0C3][R0C4]
//   R1[R1C0][R1C1][R1C2][R1C3][R1C4]
//   R2[R2C0][R2C1][R2C2][R2C3][R2C4]
//   R3[R3C0][R3C1][R3C2][R3C3][R3C4]
//   R4[ENTR][R4C1][R4C2][R4C3][R4C4]     ENTR = SUNKEN_GALLERY_MAP (the stair down)
//
// For now every new room is deliberately blank: GALLERY_FLOOR (108) throughout,
// a GALLERY_WALL (109) border, and no other elements at all. Each side that
// faces an adjacent room is opened (its border run becomes floor) so the player
// can walk through; sides on the outside of the grid stay walled. No new tile
// types are introduced — only the two the gallery already uses.
//
// galleryRoom(sides) builds one room. `sides` is any combination of the letters
// n/s/e/w naming the open sides. Dimensions are the literal 16×15 grid (COLS ×
// ROWS from state.js, which loads AFTER this file, so they can't be referenced
// by name here). Each call returns a fresh array, so every room is its own
// object and mapRegistryId() identity holds.
function galleryRoom(sides) {
  const F = GALLERY_FLOOR, W = GALLERY_WALL;
  const H = 15, Wd = 16; // ROWS × COLS
  const grid = [];
  for (let r = 0; r < H; r++) {
    const row = [];
    for (let c = 0; c < Wd; c++)
      row.push((r === 0 || r === H - 1 || c === 0 || c === Wd - 1) ? W : F);
    grid.push(row);
  }
  // Open each requested side by turning its border run into floor, stopping one
  // tile short of the corners so the corners stay solid masonry.
  if (sides.includes('n')) for (let c = 1; c < Wd - 1; c++) grid[0][c]      = F;
  if (sides.includes('s')) for (let c = 1; c < Wd - 1; c++) grid[H - 1][c]  = F;
  if (sides.includes('w')) for (let r = 1; r < H - 1; r++)  grid[r][0]      = F;
  if (sides.includes('e')) for (let r = 1; r < H - 1; r++)  grid[r][Wd - 1] = F;
  return grid;
}

// The 24 grid cells other than the entrance (R4C0), in reading order. Shared
// with data.js (MAP_METADATA) and the MAP_REGISTRY loop below via window.
const SUNKEN_GALLERY_GRID_CELLS = [
  'R0C0', 'R0C1', 'R0C2', 'R0C3', 'R0C4',
  'R1C0', 'R1C1', 'R1C2', 'R1C3', 'R1C4',
  'R2C0', 'R2C1', 'R2C2', 'R2C3', 'R2C4',
  'R3C0', 'R3C1', 'R3C2', 'R3C3', 'R3C4',
           'R4C1', 'R4C2', 'R4C3', 'R4C4',
];

// Each room's open sides point only at real neighbours. The entrance is at
// (R4,C0), so R3C0 opens south onto it and R4C1 opens west onto it (those two
// joins use the entrance's narrower, offset doorways — see EDGE_TRANSITIONS).
// `const X = window.X = ...` both declares the const and exports it, so the
// MAP_REGISTRY loop below and data.js can reach every room by id.
const SUNKEN_GALLERY_R0C0 = window.SUNKEN_GALLERY_R0C0 = galleryRoom('se');
const SUNKEN_GALLERY_R0C1 = window.SUNKEN_GALLERY_R0C1 = galleryRoom('sew');
const SUNKEN_GALLERY_R0C2 = window.SUNKEN_GALLERY_R0C2 = galleryRoom('sew');
const SUNKEN_GALLERY_R0C3 = window.SUNKEN_GALLERY_R0C3 = galleryRoom('sew');
const SUNKEN_GALLERY_R0C4 = window.SUNKEN_GALLERY_R0C4 = galleryRoom('sw');
const SUNKEN_GALLERY_R1C0 = window.SUNKEN_GALLERY_R1C0 = galleryRoom('nse');
const SUNKEN_GALLERY_R1C1 = window.SUNKEN_GALLERY_R1C1 = galleryRoom('nsew');
const SUNKEN_GALLERY_R1C2 = window.SUNKEN_GALLERY_R1C2 = galleryRoom('nsew');
const SUNKEN_GALLERY_R1C3 = window.SUNKEN_GALLERY_R1C3 = galleryRoom('nsew');
const SUNKEN_GALLERY_R1C4 = window.SUNKEN_GALLERY_R1C4 = galleryRoom('nsw');
const SUNKEN_GALLERY_R2C0 = window.SUNKEN_GALLERY_R2C0 = galleryRoom('nse');
const SUNKEN_GALLERY_R2C1 = window.SUNKEN_GALLERY_R2C1 = galleryRoom('nsew');
const SUNKEN_GALLERY_R2C2 = window.SUNKEN_GALLERY_R2C2 = galleryRoom('nsew');
const SUNKEN_GALLERY_R2C3 = window.SUNKEN_GALLERY_R2C3 = galleryRoom('nsew');
const SUNKEN_GALLERY_R2C4 = window.SUNKEN_GALLERY_R2C4 = galleryRoom('nsw');
const SUNKEN_GALLERY_R3C0 = window.SUNKEN_GALLERY_R3C0 = galleryRoom('nse');
const SUNKEN_GALLERY_R3C1 = window.SUNKEN_GALLERY_R3C1 = galleryRoom('nsew');
const SUNKEN_GALLERY_R3C2 = window.SUNKEN_GALLERY_R3C2 = galleryRoom('nsew');
const SUNKEN_GALLERY_R3C3 = window.SUNKEN_GALLERY_R3C3 = galleryRoom('nsew');
const SUNKEN_GALLERY_R3C4 = window.SUNKEN_GALLERY_R3C4 = galleryRoom('nsw');
const SUNKEN_GALLERY_R4C1 = window.SUNKEN_GALLERY_R4C1 = galleryRoom('new');
const SUNKEN_GALLERY_R4C2 = window.SUNKEN_GALLERY_R4C2 = galleryRoom('new');
const SUNKEN_GALLERY_R4C3 = window.SUNKEN_GALLERY_R4C3 = galleryRoom('new');
const SUNKEN_GALLERY_R4C4 = window.SUNKEN_GALLERY_R4C4 = galleryRoom('nw');

// ─── Sunken Gallery: the water temple's upper level ───────────────────────────
// The Gallery is the topmost, most public floor of a temple older than the
// Empire — a violent, priest-ruled people who held water not as a shared
// resource but as something the sacred ruler owned and granted downward in
// return for tribute, oaths, soldiers, hostages and submission. This level is
// laid out to read as that machine: an entrance colonnade, a tribute court with
// a receiving dais, guarded training pools that double as cells, family
// surrender chambers, and carved friezes of children presented to the
// sanctuary — all of it now flooded and water-wrecked, half-drowned by the same
// water it once rationed. The deeper, restricted floors are still under the
// water (the submerged stair in R0C4).
//
// This builder paints each room's interior to its zone. It touches only rows
// 3-11, cols 3-12, leaving a two-tile walkable margin inside every border — so
// the full-width doorways always connect no matter what's in the middle
// (verified by the connectivity sweep). Tiles: GALLERY_WALL (109) columns/
// masonry, TEMPLE_CARVING (118) relief walls, TEMPLE_SHALLOWS (117) wadeable
// flood, WATER (1) deep pools, BASIN_MUD (81) silt, EXPOSED_STONE (88) dry dais.
// The ten investigative features (interactions.js) keep their exact tiles and
// their walkable standing-tiles, re-asserted after each room's flooding.
(function buildSunkenGalleryTemple() {
  const W = GALLERY_WALL, C = TEMPLE_CARVING, SH = TEMPLE_SHALLOWS, DP = 1, SI = BASIN_MUD, DA = EXPOSED_STONE, F = GALLERY_FLOOR;
  const fill = (m, r1, c1, r2, c2, t) => { for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) m[r][c] = t; };
  const put  = (m, r, c, t) => { m[r][c] = t; };
  const grid = (m, rs, cs, t) => { for (const r of rs) for (const c of cs) m[r][c] = t; };

  // ENTRANCE COLONNADE — two files of columns flank the processional aisle.
  grid(SUNKEN_GALLERY_R4C1, [4, 6, 8, 10], [4, 11], W);
  fill(SUNKEN_GALLERY_R4C1, 7, 7, 8, 9, SI);                 // (feature) disturbed silt patch
  grid(SUNKEN_GALLERY_R3C0, [4, 6, 10], [4, 11], W);
  put(SUNKEN_GALLERY_R3C0, 7, 8, W);                         // (feature) column the satchel is caught behind
  put(SUNKEN_GALLERY_R3C0, 8, 8, F);
  grid(SUNKEN_GALLERY_R4C2, [6, 10], [4, 8, 12], W);         // (feature) survey-marked columns + a matching file
  put(SUNKEN_GALLERY_R4C2, 7, 8, F);

  // TRIBUTE COURT — a broad court with a raised receiving dais and reliefs.
  fill(SUNKEN_GALLERY_R4C3, 3, 5, 3, 9, C); fill(SUNKEN_GALLERY_R4C3, 7, 6, 9, 9, SH); grid(SUNKEN_GALLERY_R4C3, [5, 11], [4, 11], W);
  fill(SUNKEN_GALLERY_R4C4, 3, 6, 3, 9, C); fill(SUNKEN_GALLERY_R4C4, 6, 6, 8, 9, DA);
  fill(SUNKEN_GALLERY_R3C2, 3, 5, 3, 10, C); fill(SUNKEN_GALLERY_R3C2, 5, 6, 7, 9, DA); grid(SUNKEN_GALLERY_R3C2, [9], [5, 10], W);
  fill(SUNKEN_GALLERY_R3C3, 3, 4, 3, 11, C); grid(SUNKEN_GALLERY_R3C3, [5, 7, 9], [4, 11], W);
  fill(SUNKEN_GALLERY_R3C4, 6, 5, 9, 10, SH);

  // GUARDED TRAINING POOLS / CELLS — pools boxed by posts, half prison.
  fill(SUNKEN_GALLERY_R2C0, 6, 7, 8, 9, DP); grid(SUNKEN_GALLERY_R2C0, [5, 6, 7, 8, 9], [6, 10], W);
  fill(SUNKEN_GALLERY_R2C1, 5, 5, 6, 10, SH);
  put(SUNKEN_GALLERY_R2C1, 7, 7, W); put(SUNKEN_GALLERY_R2C1, 7, 8, W); put(SUNKEN_GALLERY_R2C1, 7, 9, W); // (feature) reliefs
  put(SUNKEN_GALLERY_R2C1, 8, 8, F); grid(SUNKEN_GALLERY_R2C1, [5, 9], [4, 11], W);

  // FLOODED CEREMONIAL HALLS — wadeable shallows with deeper basins.
  fill(SUNKEN_GALLERY_R3C1, 4, 4, 6, 11, SH); put(SUNKEN_GALLERY_R3C1, 7, 8, W); put(SUNKEN_GALLERY_R3C1, 8, 8, F); // (feature) gauge masonry
  fill(SUNKEN_GALLERY_R2C2, 5, 4, 9, 11, SH); put(SUNKEN_GALLERY_R2C2, 7, 8, W); put(SUNKEN_GALLERY_R2C2, 8, 8, F); // (feature) recess masonry
  fill(SUNKEN_GALLERY_R2C3, 4, 4, 10, 11, SH); fill(SUNKEN_GALLERY_R2C3, 6, 7, 8, 9, DP);
  fill(SUNKEN_GALLERY_R2C4, 4, 4, 10, 10, SH);
  fill(SUNKEN_GALLERY_R1C2, 4, 4, 9, 11, SH); fill(SUNKEN_GALLERY_R1C2, 6, 7, 7, 9, DP); put(SUNKEN_GALLERY_R1C2, 8, 8, SH); // (feature) drowned pool
  fill(SUNKEN_GALLERY_R1C3, 4, 4, 6, 11, SH); fill(SUNKEN_GALLERY_R1C3, 9, 4, 11, 11, SH);
  put(SUNKEN_GALLERY_R1C3, 7, 8, SI); put(SUNKEN_GALLERY_R1C3, 8, 8, SI);                                   // (feature) boot-print silt
  fill(SUNKEN_GALLERY_R1C4, 4, 4, 10, 10, SH);
  fill(SUNKEN_GALLERY_R1C4, 7, 6, 8, 8, SI); // silt bar where Dreyfuss's body washed up (feature)

  // FAMILY FAREWELL / SURRENDER CHAMBERS — carved friezes of the presentation.
  fill(SUNKEN_GALLERY_R1C0, 3, 5, 3, 9, C); fill(SUNKEN_GALLERY_R1C0, 7, 6, 8, 9, SH);
  fill(SUNKEN_GALLERY_R1C1, 4, 4, 4, 11, C); grid(SUNKEN_GALLERY_R1C1, [7, 9], [5, 10], W);

  // SANCTUARY THRESHOLD — deepest and most drowned; the stair goes on down.
  fill(SUNKEN_GALLERY_R0C0, 5, 4, 9, 10, SH); fill(SUNKEN_GALLERY_R0C0, 6, 4, 8, 6, DP); fill(SUNKEN_GALLERY_R0C0, 3, 7, 3, 11, C);
  fill(SUNKEN_GALLERY_R0C1, 5, 4, 9, 11, SH); fill(SUNKEN_GALLERY_R0C1, 6, 7, 8, 9, DP);
  fill(SUNKEN_GALLERY_R0C2, 8, 4, 10, 11, SH); put(SUNKEN_GALLERY_R0C2, 6, 8, W); put(SUNKEN_GALLERY_R0C2, 7, 8, F);   // (feature) notebook ledge
  fill(SUNKEN_GALLERY_R0C3, 5, 4, 9, 11, SH); fill(SUNKEN_GALLERY_R0C3, 6, 6, 8, 9, DP); fill(SUNKEN_GALLERY_R0C3, 3, 4, 3, 11, C);
  fill(SUNKEN_GALLERY_R0C4, 4, 4, 10, 11, SH); fill(SUNKEN_GALLERY_R0C4, 6, 6, 8, 9, DP); put(SUNKEN_GALLERY_R0C4, 9, 7, F); // (feature) submerged stair pool
})();

// ── Regional chunk definitions (North Basin) ─────────────────────────────────
// Authored authority for this file's placed regional chunks. data.js merges the
// per-file *_REGIONAL_CHUNK_DEFINITIONS fragments and resolves encounterProfileId /
// itemSetId into the runtime REGIONAL_CHUNK_CATALOG (see data.js for the contract).
const NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS = [
  { mapId: 'NORTH_BASIN_S_MAP', regionId: 'overworld', chunkX: 2, chunkY: 2, map: [
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
      [  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  2,  3,  3,  3],  // 14  ← col 12 = south seam → MAP3_N2.north (continuous causeway)
    ],
    displayName: 'North Basin — South Approach', region: 'North Basin', contentKey: 'north_basin_s',
    presentation: 'continuous', encounterProfileId: 'north_basin', itemSetId: 'north_basin_s',
    allowRandomEncounters: true, allowSave: true,
    notes: 'The basin entry. It has no GRASS, but its REEDS are encounter-eligible all the same (see tiles.js TILE_PROPERTIES), so it does roll random encounters — now from the basin pool (NORTH_BASIN_ENEMY_TEMPLATES, the same gentle creatures as the Silt Flats) instead of the generic ENEMY_TEMPLATES fallback it used when this was left encounterPool: null. The maintained road (PATH, col 12) and the water stay safe; you meet things by cutting through the reeds.' },
  { mapId: 'NORTH_BASIN_C_MAP', regionId: 'overworld', chunkX: 2, chunkY: 1, map: [
      //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
      [  3,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  3],  //  0  open reservoir continues beyond, off-map — WATER right to the top edge (impassable, same as a TREE border)
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  1  open reservoir
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  2  open reservoir
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  3  open reservoir
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  4  open reservoir
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1],  //  5  shoreline starts to ripple
      [  1,  1, 23, 23, 81,  1,  1,  1,  1,  1,  1, 81, 23, 23,  1,  1],  //  6  mud creeping in at the edges
      [  3, 23, 81, 81, 81, 23,  1,  1,  1,  1, 23, 81, 81, 81, 23,  3],  //  7  ← water authority gauge (c4)
      [  3, 81, 81, 81, 23, 23,  1,  1,  1,  1, 23, 23, 81, 81, 81,  3],  //  8  receding inlet reaches down at c6-9
      [  3, 81, 81, 23, 23,  1,  1, 23, 23,  1,  1, 23, 23, 81, 81,  3],  //  9  last residual pools
      [  3, 81, 81, 81, 23, 23, 81, 81, 81, 81, 23, 23, 81, 81, 81,  3],  // 10  ← stranded mooring post (c10)
      [  3, 81, 81, 81, 81, 23, 81, 81, 81, 81, 23, 81, 81, 81, 81,  3],  // 11  exposed bed
      [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  // 12  exposed bed
      [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3],  // 13  exposed bed, approach to the entrance — road has fully ended
      [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  3],  // 14  open edge, cols 1-14 → EDGE_TRANSITIONS south to NORTH_BASIN_S_MAP (matches its north edge exactly -- no clamping in normal play)
    ],
    displayName: 'North Basin — Reservoir', region: 'North Basin', contentKey: 'north_basin_c',
    presentation: 'continuous', encounterProfileId: 'north_basin', itemSetId: 'north_basin_c',
    allowRandomEncounters: true, allowSave: true,
    notes: 'The receding reservoir. Like the South Approach it has no GRASS but its REEDS are encounter-eligible, so it rolls random encounters — now from the basin pool (NORTH_BASIN_ENEMY_TEMPLATES) instead of the generic ENEMY_TEMPLATES fallback. Open water and the exposed BASIN_MUD bed stay safe; encounters lurk in the reed fringe of the receding shoreline.' },
  { mapId: 'NORTH_BASIN_SW_MAP', regionId: 'overworld', chunkX: 1, chunkY: 2, map: [
      //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
      [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1,  1,  1,  3,  3],  //  0  open edge, cols 1-10 → EDGE_TRANSITIONS north to NORTH_BASIN_W_MAP (cols 11-13 = the reservoir finger continuing off-map as WATER; col 14 stays TREE border)
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
    ],
    displayName: 'North Basin — Silt Flats', region: 'North Basin', contentKey: 'north_basin_sw',
    presentation: 'continuous', encounterProfileId: 'north_basin', itemSetId: 'north_basin_sw',
    allowRandomEncounters: true, allowSave: true },
  { mapId: 'NORTH_BASIN_W_MAP', regionId: 'overworld', chunkX: 1, chunkY: 1, map: [
      //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
      [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  3,  3,  1,  1,  3],  //  0  open edge cols 1-10 → EDGE_TRANSITIONS north to NORTH_BASIN_NW_MAP (the Upper Reach) — the "one-line change later" this border was reserved for
      [  3,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1],  //  1  reservoir shore begins (uneven): reeds at c12, water c13-14
      [  3,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1],  //  2  water reaches in to c12
      [  3,  0,  0,  0,  0,  0,  0,  0,  0, 89,  0,  0, 23,  1,  1,  1],  //  3  ← c9 stranded waterline stake
      [  3,  0,  0, 88,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1],  //  4  inlet: water reaches in to c11
      [  3,  0,  0,  0,  0, 81, 81,  0,  0,  0,  0, 23,  1,  1,  1,  1],  //  5  drying mud patch (safer ground)
      [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0, 92,  0, 23,  1,  1,  1],  //  6  ← c10 = fisher's hut (TRAPPER_HUT tile)
      [  3,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1],  //  7
      [  3,  0,  0,  0,  0,  0, 89,  0,  0,  0,  0,  0, 23,  1,  1,  1],  //  8  ← c6 old fishing gear (stranded stake)
      [  3,  0,  0,  0, 81, 81,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1],  //  9  inlet: water reaches in to c11
      [  3,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1],  // 10
      [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1],  // 11
      [  3,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1],  // 12
      [  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1,  1,  1],  // 13
      [  3, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  3,  3,  1,  1,  3],  // 14  open edge, cols 1-10 → EDGE_TRANSITIONS south to NORTH_BASIN_SW_MAP
    ],
    displayName: 'North Basin — West Shore', region: 'North Basin', contentKey: 'north_basin_w',
    presentation: 'continuous', encounterProfileId: 'north_basin', itemSetId: 'north_basin_w',
    allowRandomEncounters: true, allowSave: true,
    notes: 'West bank of the reservoir, north of the Silt Flats. Shares the Silt Flats’ enemy pool by design (user request), not a separate harsher tier. South edge is an open EDGE_TRANSITIONS crossing (cols 1-10) to the Silt Flats; north edge is now an open crossing (cols 1-10) to the Upper Reach; west is impassable border until that neighbour is built.' },
  { mapId: 'NORTH_BASIN_NW_MAP', regionId: 'overworld', chunkX: 1, chunkY: 0, map: [
      //  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],  //  0  north edge: open reservoir WATER (the flooded arm continues off-map; impassable)
      [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],  //  1  open bed
      [  3, 81, 88, 81, 81, 81, 81,  1,  1, 81, 81, 81, 88, 81, 81,  1],  //  2  north pool begins (c7-8)
      [  3, 81, 81, 81, 81, 81,  1,  1,  1,  1, 81, 88,103, 88, 81,  1],  //  3  pool c6-9; THE DOORFRAME at c12, stone flanks c11/c13
      [  3, 81, 81, 81, 81, 81, 81,  1,  1, 81, 81, 81, 81, 81, 81,  1],  //  4  pool tapers
      [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],  //  5
      [  3, 81, 89, 89, 89, 89, 89, 89, 89, 89, 81, 81, 81, 81, 81,  1],  //  6  the fence line (c2-c9) — dead straight, in what was open water
      [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 88, 81, 81,  1],  //  7
      [  3, 81, 81, 88, 88, 88, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],  //  8  stonework apron begins (c3-5)
      [  3, 81, 81, 88,107, 88, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],  //  9  THE STAIRHEAD at c4
      [  3, 81, 81, 88, 88, 88, 81, 81, 81, 81,  1,  1, 81, 81, 81,  1],  // 10  apron ends; south residual pool c10-11
      [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],  // 11
      [  3, 81, 81, 81, 81, 88, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],  // 12
      [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],  // 13  north-crossing landing row (cols 1-10 all walkable)
      [  3, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  3,  3,  3,  3,  1],  // 14  open edge cols 1-10 (BASIN_MUD, walkable) → EDGE_TRANSITIONS south to NORTH_BASIN_W_MAP
    ],
    displayName: 'North Basin — Upper Reach', region: 'North Basin', contentKey: 'north_basin_nw',
    presentation: 'continuous', encounterProfileId: 'upper_reach', itemSetId: 'north_basin_nw',
    allowRandomEncounters: true, allowSave: true,
    notes: 'The drained NW arm — exposed bed border to border. Once deliberately silent; now the oldest-exposed ground has its own encounters (UPPER_REACH_ENEMY_TEMPLATES): two stranded basin creatures shared with the Silt Flats, and two new tough ones (Dust-Drowned, Marrow Hulk) reflecting how long this arm has been dry and wrong. Only BASIN_MUD rolls (isEncounterEligibleTile special-cases this map so other maps’ mud stays safe). No NPCs. "No safe haven" means no town, bed, healing, or shelter -- allowSave is still true like any ordinary outdoor map (see canSaveHere(), save.js); only the two interiors it leads to block saving. Holds the standing doorframe (CHAMBER_DOOR → BASIN_CHAMBER_MAP) and the drought-exposed stairhead (SUNKEN_STAIR → SUNKEN_GALLERY_MAP).' },
];
window.NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS = NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS;
