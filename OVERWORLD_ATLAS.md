# Overworld Atlas

A dated, human-readable snapshot of every placed regional chunk, generated
directly from `REGIONAL_CHUNK_CATALOG` — so a future session can answer "what's
where, and did terrain change since I last looked" without reading the whole
game codebase. This file is a readable index, not a gameplay authority: the
game always reads live from `data.js`/`content/maps/*.js`.

**Snapshot date: 2026-10-22 (Eastern Shore + Southern Moraine)**

A companion visual version of this snapshot (same data, rendered as a
zoomable tile map with region/terrain legends) is published at:
https://claude.ai/code/artifact/994b8035-db9f-4e1c-aa20-eee4781d2d97

## How to tell if terrain changed since this snapshot

This file's chunk list/coordinates/names change only when a chunk is
added, removed, moved, renamed, or has its encounter/save/access flags
flipped — regenerate it (new date, re-run the same extraction) when that
happens.

For whether a chunk's actual **tile grid** changed (any single tile edit),
don't re-derive this file — the repository already owns a precise,
narrower authority for exactly that question:
[`test/fixtures/regional-grid-fingerprints.js`](test/fixtures/regional-grid-fingerprints.js),
a `sha256(JSON.stringify(map))` per chunk, checked by the regression suite
and "regenerated only on an intentional, reviewed terrain edit." If that
file's hash for a given map id is unchanged since this snapshot, that
chunk's grid is byte-identical. As of this snapshot it holds 244 fingerprints,
last touched 2026-10-22 (Mornay approach road-gap fix, see change log below).

## Totals (as of this snapshot)

- **244** placed chunks, all in the single continuous `regionId: 'overworld'`
  coordinate space (every chunk's `chunkX`/`chunkY` shares one grid — there is
  no per-region-local origin).
- Global chunk extent: **x 0–20, y −7–7** (21×15 chunks → 336×225 tiles).
- **11** named display regions (flavor labels within that one grid, not
  separate coordinate spaces): Verdant Vale, Eastern Reaches, Drenwick,
  Drenwick Fens, Thornmere, North Basin, Eastern Fens, Great Fen, Valmere,
  Eastern Shore, Southern Moraine.
- **121** chunks are player-walkable; **123** are scenery-only
  (`playerAccessible: false`).
- **102** chunks currently have `allowRandomEncounters: true`.

| Region | Chunks | Walkable | With encounters | Chunk range (x, y) |
|---|---|---|---|---|
| Verdant Vale | 1 | 1 | 1 | x[0..0] y[5..5] |
| Eastern Reaches | 3 | 3 | 2 | x[1..5] y[2..5] |
| Drenwick | 2 | 2 | 2 | x[2..3] y[3..3] |
| Drenwick Fens | 1 | 0 | 0 | x[1..1] y[3..3] |
| Thornmere | 10 | 9 | 9 | x[0..4] y[3..5] |
| North Basin | 17 | 9 | 9 | x[0..4] y[-1..2] |
| Eastern Fens | 73 | 42 | 24 | x[5..18] y[-4..5] |
| Great Fen | 58 | 28 | 28 | x[0..11] y[-6..0] |
| Valmere | 48 | 13 | 13 | x[12..20] y[-7..1] |
| Eastern Shore | 17 | 7 | 7 | x[17..20] y[1..5] |
| Southern Moraine | 14 | 7 | 7 | x[13..18] y[5..7] |

## Per-chunk index, by region

Sorted by chunk y then x (roughly north-to-south reading order within a
region). "Walkable" is `playerAccessible !== false`; "Encounters" is
`allowRandomEncounters`.

### Verdant Vale (1 chunk)

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `MAP` | (0, 5) | Verdant Vale | yes | yes |

### Eastern Reaches (3 chunks)

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `EAST_CAUSEWAY_MAP` | (4, 2) | East Causeway | yes | yes |
| `EASTERN_BANK_MAP` | (5, 2) | Eastern Bank | yes | no |
| `MAP2` | (1, 5) | Eastern Reaches | yes | yes |

### Drenwick (2 chunks)

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `MAP3_N2` | (2, 3) | Drenwick | yes | yes |
| `DRENWICK_EAST_CANAL_MAP` | (3, 3) | Eastern Canal Banks | yes | yes |

### Drenwick Fens (1 chunk)

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `DRENWICK_WEST_OUTFALL_MAP` | (1, 3) | West Outfall | no | no |

### Thornmere (10 chunks)

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `MAP_N2` | (0, 3) | Blocked Path | yes | yes |
| `THORNMERE_CANAL_HEAD_MAP` | (4, 3) | Thornmere — Canal Head | yes | yes |
| `MAP_N1` | (0, 4) | Northern Road | yes | yes |
| `RODDON_WAY_MAP` | (1, 4) | Roddon Way | yes | yes |
| `MAP3_N1` | (2, 4) | Northern Fen | yes | yes |
| `THORNMERE_NORTH_FEN_MAP` | (3, 4) | Northern Thornmere Fen | yes | yes |
| `THORNMERE_UPPER_SHALLOWS_MAP` | (4, 4) | Thornmere — Upper Shallows | no | no |
| `MAP3` | (2, 5) | Thornmere Fen | yes | yes |
| `MAP4` | (3, 5) | Thornmere | yes | yes |
| `MAP5` | (4, 5) | Thornmere Shallows | yes | yes |

### North Basin (17 chunks)

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `NORTH_BASIN_ENVELOPE_C0RN1_MAP` | (0, -1) | North Basin — North Rim Water | no | no |
| `NORTH_BASIN_ENVELOPE_C1RN1_MAP` | (1, -1) | North Basin — North Rim Water | no | no |
| `NORTH_BASIN_ENVELOPE_C2RN1_MAP` | (2, -1) | North Basin — North Rim Water | no | no |
| `NORTH_BASIN_NW2_MAP` | (0, 0) | North Basin — Flooded Rim | yes | yes |
| `NORTH_BASIN_NW_MAP` | (1, 0) | North Basin — Upper Reach | yes | yes |
| `NORTH_BASIN_N_MAP` | (2, 0) | North Basin — Open Reservoir | no | no |
| `NORTH_BASIN_NE_MAP` | (3, 0) | North Basin — Open Reservoir (East) | no | no |
| `NORTH_BASIN_NE2_MAP` | (4, 0) | North Basin — Open Reservoir (Far East) | no | no |
| `NORTH_BASIN_W2_MAP` | (0, 1) | North Basin — West Mire | yes | yes |
| `NORTH_BASIN_W_MAP` | (1, 1) | North Basin — West Shore | yes | yes |
| `NORTH_BASIN_C_MAP` | (2, 1) | North Basin — Reservoir | yes | yes |
| `NORTH_BASIN_E_MAP` | (3, 1) | North Basin — Eastern Woods | no | no |
| `NORTH_BASIN_E2_MAP` | (4, 1) | North Basin — Open Reservoir (East Shore) | no | no |
| `NORTH_BASIN_MIREWOOD_MAP` | (0, 2) | North Basin — Mirewood | yes | yes |
| `NORTH_BASIN_SW_MAP` | (1, 2) | North Basin — Silt Flats | yes | yes |
| `NORTH_BASIN_S_MAP` | (2, 2) | North Basin — South Approach | yes | yes |
| `NORTH_BASIN_SE_MAP` | (3, 2) | North Basin — South Reservoir Road | yes | yes |

### Eastern Fens (73 chunks)

Includes the 23-chunk Mornay route (Eastern Bank → Travellers' Rise →
Valmere shore → Mornay Threshold) and the surrounding exploration/scenery
envelope. The region now reads as four landscape bands along that route —
wild interior fen/willow carr, managed drainage, widening storm-influenced
channel, and the Valmere shoreline — plus a moraine ridge and a raised peat
bog in the envelope. Beyond the threshold, six chunks at (16-18, -2) and
(16-18, -3) form the Mornay peninsula: one coherent, irregular landform
extending north into Valmere (a sheltered western cove and harbour shore, a
neck road up the spine, and a more exposed eastern shore/point), not six
town-interior maps. The peninsula's northern crown reserves a compact 3x2
Mornay settlement footprint (`EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP`,
rows 1-2, cols 7-9) — the whole town at overworld scale. No enterable town
transition exists yet; the footprint is a solid marker until the separate
interior Mornay town map is built (see change log).

`EASTERN_FENS_ENVELOPE_C7R0_MAP`/`_C8R0_MAP` (7,0)/(8,0) each now also carry
a reed-gap seam in their north border (row 0, cols 7-9) opening onto the
**Great Fen** (see that region below) — the four chunks immediately north of
them at (6-9,-1), formerly Eastern Fens scenery water, were converted into
the Great Fen's two entry chunks and moved to that region (see change log).
Both are now also the Fen Zolom gate: their sole random encounter is a single
400 HP, escape-blocked enemy (`enemy_fen_zolom`, data.js) guarding the way
into the Great Fen (see change log).

`EASTERN_FENS_VALMERE_REVEAL_MAP` (15,0) now also carries a reed-gap seam in
its west border (col 0, rows 6-8) opening onto the **Valmere expanse** (see
that region below) — `EASTERN_FENS_ENVELOPE_C14R0_MAP`/`_C14RN1_MAP` at
(14,0)/(14,-1), formerly Eastern Fens scenery water, were converted into the
Valmere expanse's entry chunks and moved to that region (see change log).

`EASTERN_FENS_MORNAY_THRESHOLD_MAP` (18,0) now also carries a grass-gap seam
in its south border (row 14, cols 7-9) opening onto the **Eastern Shore** (see
that region below) — `EASTERN_FENS_ENVELOPE_C18R1_MAP` at (18,1), formerly
Eastern Fens scenery water, was converted into the Eastern Shore's entry
chunk and moved to that region (see change log). It no longer appears in the
Eastern Fens table below.

`EASTERN_FENS_VALMERE_ROAD_TURN_MAP` (15,4) now also carries a grass-gap seam
in its south border (row 14, cols 7-9) opening onto the **Southern Moraine**
(see that region below) — `EASTERN_FENS_ENVELOPE_C15R5_MAP` at (15,5),
formerly Eastern Fens scenery water, was converted into the Southern
Moraine's entry chunk and moved to that region (see change log). It no
longer appears in the Eastern Fens table below.

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `EASTERN_FENS_ENVELOPE_C15RN4_MAP` | (15, -4) | Eastern Fens — Valmere Open Water | no | no |
| `EASTERN_FENS_ENVELOPE_C16RN4_MAP` | (16, -4) | Eastern Fens — Valmere Open Water | no | no |
| `EASTERN_FENS_ENVELOPE_C17RN4_MAP` | (17, -4) | Eastern Fens — Valmere Open Water | no | no |
| `EASTERN_FENS_ENVELOPE_C18RN4_MAP` | (18, -4) | Eastern Fens — Valmere Open Water | no | no |
| `EASTERN_FENS_ENVELOPE_C15RN3_MAP` | (15, -3) | Eastern Fens — Valmere Open Water | no | no |
| `EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP` | (16, -3) | Mornay Peninsula — Harbour Shore | yes | no |
| `EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP` | (17, -3) | Mornay Peninsula — Town Approach (reserves the 3x2 Mornay footprint) | yes | no |
| `EASTERN_FENS_MORNAY_EASTERN_POINT_MAP` | (18, -3) | Mornay Peninsula — Eastern Point | yes | no |
| `EASTERN_FENS_ENVELOPE_C15RN2_MAP` | (15, -2) | Eastern Fens — Valmere Open Water | no | no |
| `EASTERN_FENS_MORNAY_WESTERN_COVE_MAP` | (16, -2) | Mornay Peninsula — Western Cove | yes | no |
| `EASTERN_FENS_MORNAY_NECK_ROAD_MAP` | (17, -2) | Mornay Peninsula — Neck Road | yes | no |
| `EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP` | (18, -2) | Mornay Peninsula — Eastern Shore | yes | no |
| `EASTERN_FENS_ENVELOPE_C15RN1_MAP` | (15, -1) | Eastern Fens — Valmere Open Water | no | no |
| `EASTERN_FENS_MORNAY_APPROACH_W_MAP` | (16, -1) | Valmere — Mornay Approach (West) | yes | no |
| `EASTERN_FENS_MORNAY_APPROACH_M_MAP` | (17, -1) | Valmere — Mornay Approach | yes | no |
| `EASTERN_FENS_MORNAY_APPROACH_E_MAP` | (18, -1) | Valmere — Mornay Approach (East) | yes | no |
| `EASTERN_FENS_ENVELOPE_C6R0_MAP` | (6, 0) | Eastern Fens — Open Fen Water | no | no |
| `EASTERN_FENS_ENVELOPE_C7R0_MAP` | (7, 0) | Eastern Fens — North Fen (Fen Zolom gate) | yes | yes |
| `EASTERN_FENS_ENVELOPE_C8R0_MAP` | (8, 0) | Eastern Fens — North Fen (Fen Zolom gate) | yes | yes |
| `EASTERN_FENS_ENVELOPE_C9R0_MAP` | (9, 0) | Eastern Fens — Flooded Reeds | no | no |
| `EASTERN_FENS_VALMERE_REVEAL_MAP` | (15, 0) | Valmere — Southern Shore | yes | yes |
| `EASTERN_FENS_VALMERE_SHORE_W_MAP` | (16, 0) | Valmere — Southern Shore | yes | yes |
| `EASTERN_FENS_VALMERE_SHORE_E_MAP` | (17, 0) | Valmere — Southern Shore | yes | yes |
| `EASTERN_FENS_MORNAY_THRESHOLD_MAP` | (18, 0) | Valmere — Mornay Threshold | yes | yes |
| `EASTERN_FENS_ENVELOPE_C5R1_MAP` | (5, 1) | Eastern Fens — Flooded Reeds | no | no |
| `EASTERN_FENS_ENVELOPE_C6R1_MAP` | (6, 1) | Eastern Fens — Northwest Fen | yes | no |
| `EASTERN_FENS_REEDBELT_N_MAP` | (7, 1) | Eastern Fens — Reedbelt | yes | yes |
| `EASTERN_FENS_REEDBELT_E_MAP` | (8, 1) | Eastern Fens — Reedbelt | yes | yes |
| `EASTERN_FENS_ENVELOPE_C9R1_MAP` | (9, 1) | Eastern Fens — Peat Bog: West Margin | no | no |
| `EASTERN_FENS_ENVELOPE_C10R1_MAP` | (10, 1) | Eastern Fens — Peat Bog: Clearing | yes | no |
| `EASTERN_FENS_ENVELOPE_C11R1_MAP` | (11, 1) | Eastern Fens — Peat Bog: Willow Stand | no | no |
| `EASTERN_FENS_ENVELOPE_C12R1_MAP` | (12, 1) | Eastern Fens — Peat Bog: Hummocks | no | no |
| `EASTERN_FENS_ENVELOPE_C13R1_MAP` | (13, 1) | Eastern Fens — Peat Bog: East Margin | no | no |
| `EASTERN_FENS_ENVELOPE_C14R1_MAP` | (14, 1) | Eastern Fens — Peat Bog: Drainage Lip | no | no |
| `EASTERN_FENS_CHANNEL_ROAD_N_MAP` | (15, 1) | Eastern Fens — Valmere Channel Road | yes | yes |
| `EASTERN_FENS_ENVELOPE_C16R1_MAP` | (16, 1) | Eastern Fens — Silted Margin | no | no |
| `EASTERN_FENS_ENVELOPE_C17R1_MAP` | (17, 1) | Eastern Fens — Silted Margin | no | no |
| `EASTERN_FENS_EMBANKMENT_W_MAP` | (6, 2) | Eastern Fens — Old Embankment | yes | yes |
| `EASTERN_FENS_EMBANKMENT_E_MAP` | (7, 2) | Eastern Fens — Old Embankment | yes | yes |
| `EASTERN_FENS_REEDBELT_S_MAP` | (8, 2) | Eastern Fens — Reedbelt | yes | yes |
| `EASTERN_FENS_DRY_RISE_APPROACH_MAP` | (9, 2) | Eastern Fens — Dry Rise | yes | yes |
| `EASTERN_FENS_DRAINAGE_NW_MAP` | (10, 2) | Eastern Fens — Managed Drainage | yes | yes |
| `EASTERN_FENS_WORKED_REEDS_MAP` | (11, 2) | Eastern Fens — Managed Drainage | yes | yes |
| `EASTERN_FENS_MANAGED_REEDS_MAP` | (12, 2) | Eastern Fens — Managed Drainage | yes | yes |
| `EASTERN_FENS_BRIDGE_INLET_W_MAP` | (13, 2) | Eastern Fens — Bridge Inlet | yes | no |
| `EASTERN_FENS_BRIDGE_INLET_E_MAP` | (14, 2) | Eastern Fens — Bridge Inlet | yes | no |
| `EASTERN_FENS_CHANNEL_ROAD_MID_MAP` | (15, 2) | Eastern Fens — Valmere Channel Road | yes | yes |
| `EASTERN_FENS_ENVELOPE_C16R2_MAP` | (16, 2) | Eastern Fens — Broken Embankment | no | no |
| `EASTERN_FENS_ENVELOPE_C5R3_MAP` | (5, 3) | Eastern Fens — Flooded Reeds | no | no |
| `EASTERN_FENS_ENVELOPE_C6R3_MAP` | (6, 3) | Eastern Fens — South Reedbed | yes | no |
| `EASTERN_FENS_ENVELOPE_C7R3_MAP` | (7, 3) | Eastern Fens — Mire Hummocks | no | no |
| `EASTERN_FENS_ENVELOPE_C8R3_MAP` | (8, 3) | Eastern Fens — Flooded Reeds | no | no |
| `EASTERN_FENS_DRY_RISE_MAP` | (9, 3) | Eastern Fens — Dry Rise | yes | yes |
| `EASTERN_FENS_DRAINAGE_SW_MAP` | (10, 3) | Eastern Fens — Managed Drainage | yes | yes |
| `EASTERN_FENS_REED_HOLLOW_MAP` | (11, 3) | Eastern Fens — Reed Hollow | yes | no |
| `EASTERN_FENS_TRAVELLERS_RISE_MAP` | (12, 3) | Eastern Fens — Travellers’ Rise | yes | **no (reserved — see below)** |
| `EASTERN_FENS_WIDE_WATER_MAP` | (13, 3) | Eastern Fens — Lakeward Reach | yes | yes |
| `EASTERN_FENS_CHANNEL_ELBOW_MAP` | (14, 3) | Eastern Fens — Channel Elbow | yes | no |
| `EASTERN_FENS_CHANNEL_ROAD_S_MAP` | (15, 3) | Eastern Fens — Valmere Channel Road | yes | yes |
| `EASTERN_FENS_ENVELOPE_C16R3_MAP` | (16, 3) | Eastern Fens — Storm Shoal | no | no |
| `EASTERN_FENS_ENVELOPE_C8R4_MAP` | (8, 4) | Eastern Fens — Moraine Ridge: West Shoulder | no | no |
| `EASTERN_FENS_ENVELOPE_C9R4_MAP` | (9, 4) | Eastern Fens — Moraine Ridge: Hummock Clearing | yes | no |
| `EASTERN_FENS_ENVELOPE_C10R4_MAP` | (10, 4) | Eastern Fens — Moraine Ridge: Hollow | no | no |
| `EASTERN_FENS_ENVELOPE_C11R4_MAP` | (11, 4) | Eastern Fens — Moraine Ridge: East Shoulder | no | no |
| `EASTERN_FENS_ENVELOPE_C12R4_MAP` | (12, 4) | Eastern Fens — Moraine Ridge: Outwash | no | no |
| `EASTERN_FENS_CHANNEL_APPROACH_W_MAP` | (13, 4) | Eastern Fens — Channel Approach | yes | yes |
| `EASTERN_FENS_CHANNEL_APPROACH_E_MAP` | (14, 4) | Eastern Fens — Channel Approach | yes | yes |
| `EASTERN_FENS_VALMERE_ROAD_TURN_MAP` | (15, 4) | Eastern Fens — Valmere Road Turn | yes | yes |
| `EASTERN_FENS_ENVELOPE_C16R4_MAP` | (16, 4) | Eastern Fens — Storm Shoal: Mudbank | no | no |
| `EASTERN_FENS_ENVELOPE_C12R5_MAP` | (12, 5) | Eastern Fens — Moraine Ridge: Drowned Toe | no | no |
| `EASTERN_FENS_ENVELOPE_C13R5_MAP` | (13, 5) | Eastern Fens — Storm Shoal: West | no | no |
| `EASTERN_FENS_ENVELOPE_C14R5_MAP` | (14, 5) | Eastern Fens — Lakeward Shallows | no | no |
| `EASTERN_FENS_ENVELOPE_C16R5_MAP` | (16, 5) | Eastern Fens — Lakeward Shallows: East | no | no |

### Great Fen (58 chunks)

A vast, lightly-populated wetland west/northwest of Mornay, reached only by
walking north off `EASTERN_FENS_ENVELOPE_C7R0_MAP`/`_C8R0_MAP` through a
reed-gap seam opened in their north border. No story gate — reachable as
soon as the player gets there. Entirely roadless (no PATH/TOWN_FLOOR/
TOWN_MARKET/BRIDGE_DECK tiles anywhere in the region); navigated via reeds,
mud, grass, basin mud, hummocks, gravel bars, and small wooded islands.
28 chunks are walkable, densely interconnected (every adjacent pair seamed,
giving broad loops/branches rather than one corridor), and immediately
encounter-enabled on the established hard Eastern Fens/Mornay formation
pool — the same pool, not a duplicate introductory table. The other 23 are
non-walkable scenery closing the zero-visible-void camera envelope around
the walkable core's irregular footprint, mirroring the Eastern Fens envelope
convention. Four of the walkable chunks (`EASTERN_FENS_ENVELOPE_C6RN1_MAP`
through `_C9RN1_MAP`, at (6–9,−1)) are converted Eastern Fens scenery
chunks — their mapIds/coordinates are unchanged, only their grid/metadata
moved them into this region. The whole footprint stays on the pre-ambush
(west) side of Travellers' Rise and has no connection to Mornay, the North
Basin, or open Valmere.

**Reserved for future content (not built):** `GREAT_FEN_C8RN2_MAP` (8, -2) —
a central, four-way-connected "Gravel Spur" chunk — is the plausible
raised-ground site for a future tiny hamlet, Imperial survey post, or
drainage outpost. No settlement, NPC, or structure exists there yet; this is
a location note only.

7 additional non-walkable framing chunks at (0-6,-6) were added after the
Valmere expanse extended the overworld region's overall camera bounds
further north — the Great Fen's own north edge needed them to stay
zero-void under the larger bounding box (see change log).

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `GREAT_FEN_ENVELOPE_C0RN6_MAP` | (0, -6) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C1RN6_MAP` | (1, -6) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C2RN6_MAP` | (2, -6) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C3RN6_MAP` | (3, -6) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C4RN6_MAP` | (4, -6) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C5RN6_MAP` | (5, -6) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C6RN6_MAP` | (6, -6) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C0RN5_MAP` | (0, -5) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_C1RN5_MAP` | (1, -5) | Great Fen — Hummock Ground | yes | yes |
| `GREAT_FEN_C2RN5_MAP` | (2, -5) | Great Fen — Mud Basin | yes | yes |
| `GREAT_FEN_C3RN5_MAP` | (3, -5) | Great Fen — Gravel Spur | yes | yes |
| `GREAT_FEN_C4RN5_MAP` | (4, -5) | Great Fen — Drowned Woodland | yes | yes |
| `GREAT_FEN_C5RN5_MAP` | (5, -5) | Great Fen — Blackwater Reeds | yes | yes |
| `GREAT_FEN_ENVELOPE_C6RN5_MAP` | (6, -5) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C7RN5_MAP` | (7, -5) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C8RN5_MAP` | (8, -5) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C0RN4_MAP` | (0, -4) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C1RN4_MAP` | (1, -4) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_C2RN4_MAP` | (2, -4) | Great Fen — Mud Basin | yes | yes |
| `GREAT_FEN_C3RN4_MAP` | (3, -4) | Great Fen — Gravel Spur | yes | yes |
| `GREAT_FEN_C4RN4_MAP` | (4, -4) | Great Fen — Drowned Woodland | yes | yes |
| `GREAT_FEN_C5RN4_MAP` | (5, -4) | Great Fen — Blackwater Reeds | yes | yes |
| `GREAT_FEN_C6RN4_MAP` | (6, -4) | Great Fen — Hummock Ground | yes | yes |
| `GREAT_FEN_C7RN4_MAP` | (7, -4) | Great Fen — Mud Basin | yes | yes |
| `GREAT_FEN_ENVELOPE_C8RN4_MAP` | (8, -4) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C9RN4_MAP` | (9, -4) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C10RN4_MAP` | (10, -4) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C1RN3_MAP` | (1, -3) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C2RN3_MAP` | (2, -3) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_C3RN3_MAP` | (3, -3) | Great Fen — Gravel Spur | yes | yes |
| `GREAT_FEN_C4RN3_MAP` | (4, -3) | Great Fen — Drowned Woodland | yes | yes |
| `GREAT_FEN_C5RN3_MAP` | (5, -3) | Great Fen — Blackwater Reeds | yes | yes |
| `GREAT_FEN_C6RN3_MAP` | (6, -3) | Great Fen — Hummock Ground | yes | yes |
| `GREAT_FEN_C7RN3_MAP` | (7, -3) | Great Fen — Mud Basin | yes | yes |
| `GREAT_FEN_C8RN3_MAP` | (8, -3) | Great Fen — Gravel Spur | yes | yes |
| `GREAT_FEN_C9RN3_MAP` | (9, -3) | Great Fen — Drowned Woodland | yes | yes |
| `GREAT_FEN_ENVELOPE_C10RN3_MAP` | (10, -3) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C11RN3_MAP` | (11, -3) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C2RN2_MAP` | (2, -2) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C3RN2_MAP` | (3, -2) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C4RN2_MAP` | (4, -2) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_C5RN2_MAP` | (5, -2) | Great Fen — Blackwater Reeds | yes | yes |
| `GREAT_FEN_C6RN2_MAP` | (6, -2) | Great Fen — Hummock Ground | yes | yes |
| `GREAT_FEN_C7RN2_MAP` | (7, -2) | Great Fen — Mud Basin | yes | yes |
| `GREAT_FEN_C8RN2_MAP` | (8, -2) | Great Fen — Gravel Spur (reserved hamlet/outpost site) | yes | yes |
| `GREAT_FEN_C9RN2_MAP` | (9, -2) | Great Fen — Drowned Woodland | yes | yes |
| `GREAT_FEN_C10RN2_MAP` | (10, -2) | Great Fen — Blackwater Reeds | yes | yes |
| `GREAT_FEN_ENVELOPE_C11RN2_MAP` | (11, -2) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C4RN1_MAP` | (4, -1) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C5RN1_MAP` | (5, -1) | Great Fen — Open Fen Water | no | no |
| `EASTERN_FENS_ENVELOPE_C6RN1_MAP` | (6, -1) | Great Fen — Hummock Ground (converted entry chunk) | yes | yes |
| `EASTERN_FENS_ENVELOPE_C7RN1_MAP` | (7, -1) | Great Fen — Mud Basin (converted entry chunk) | yes | yes |
| `EASTERN_FENS_ENVELOPE_C8RN1_MAP` | (8, -1) | Great Fen — Gravel Spur (converted entry chunk) | yes | yes |
| `EASTERN_FENS_ENVELOPE_C9RN1_MAP` | (9, -1) | Great Fen — Drowned Woodland (converted entry chunk) | yes | yes |
| `GREAT_FEN_ENVELOPE_C10RN1_MAP` | (10, -1) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C11RN1_MAP` | (11, -1) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C5R0_MAP` | (5, 0) | Great Fen — Open Fen Water | no | no |
| `GREAT_FEN_ENVELOPE_C10R0_MAP` | (10, 0) | Great Fen — Open Fen Water | no | no |

### Valmere expanse (48 chunks)

The inland sea's open-water/near-shore extension north of the Mornay
peninsula, reached only by walking west off `EASTERN_FENS_VALMERE_REVEAL_MAP`
through a reed-gap seam opened in its west border. No story gate. Entirely
roadless; navigated via gravel shingle, basin mud, exposed stone points, and
sheltered reed-fringed coves -- reeds are confined to sheltered margins only,
per Valmere's exposed-coast character. 13 chunks are walkable (2 converted
Eastern Fens entry chunks at (14,0)/(14,-1), plus 11 fresh), immediately
encounter-enabled on the same established hard Eastern Fens/Mornay formation
pool used by the Great Fen. The other 35 are non-walkable open-water scenery
closing the lake's zero-visible-void camera envelope -- open water stays
permanently non-walkable and encounter-disabled; no tile-path crosses it. No
opposite/northern shore is authored; the lake visibly continues beyond this
envelope. None of the six protected Mornay peninsula grids are touched.

**Reserved for future content (not built):** `VALMERE_EXPANSE_C14RN6_MAP`
(14, -6) -- the northernmost exposed rocky point in the authored envelope --
is the plausible site for a future hydrographic survey post or weather
station. No structure exists there yet; this is a location note only.

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `VALMERE_EXPANSE_ENVELOPE_C12RN7_MAP` | (12, -7) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C13RN7_MAP` | (13, -7) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C14RN7_MAP` | (14, -7) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C15RN7_MAP` | (15, -7) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C16RN7_MAP` | (16, -7) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C17RN7_MAP` | (17, -7) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C18RN7_MAP` | (18, -7) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C19RN7_MAP` | (19, -7) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C20RN7_MAP` | (20, -7) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C12RN6_MAP` | (12, -6) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_C13RN6_MAP` | (13, -6) | Valmere — Shingle Shore | yes | yes |
| `VALMERE_EXPANSE_C14RN6_MAP` | (14, -6) | Valmere — Rocky Point | yes | yes |
| `VALMERE_EXPANSE_ENVELOPE_C15RN6_MAP` | (15, -6) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C16RN6_MAP` | (16, -6) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C17RN6_MAP` | (17, -6) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C18RN6_MAP` | (18, -6) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C19RN6_MAP` | (19, -6) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C20RN6_MAP` | (20, -6) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C12RN5_MAP` | (12, -5) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C13RN5_MAP` | (13, -5) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_C14RN5_MAP` | (14, -5) | Valmere — Sheltered Cove | yes | yes |
| `VALMERE_EXPANSE_C15RN5_MAP` | (15, -5) | Valmere — Shingle Shore | yes | yes |
| `VALMERE_EXPANSE_ENVELOPE_C16RN5_MAP` | (16, -5) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C17RN5_MAP` | (17, -5) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C18RN5_MAP` | (18, -5) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C19RN5_MAP` | (19, -5) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C20RN5_MAP` | (20, -5) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C12RN4_MAP` | (12, -4) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_C13RN4_MAP` | (13, -4) | Valmere — Rocky Point | yes | yes |
| `VALMERE_EXPANSE_C14RN4_MAP` | (14, -4) | Valmere — Reed Shallows | yes | yes |
| `VALMERE_EXPANSE_ENVELOPE_C19RN4_MAP` | (19, -4) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C12RN3_MAP` | (12, -3) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_C13RN3_MAP` | (13, -3) | Valmere — Sheltered Cove | yes | yes |
| `VALMERE_EXPANSE_C14RN3_MAP` | (14, -3) | Valmere — Shingle Shore | yes | yes |
| `VALMERE_EXPANSE_ENVELOPE_C19RN3_MAP` | (19, -3) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C12RN2_MAP` | (12, -2) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_C13RN2_MAP` | (13, -2) | Valmere — Reed Shallows | yes | yes |
| `VALMERE_EXPANSE_C14RN2_MAP` | (14, -2) | Valmere — Muddy Margin | yes | yes |
| `VALMERE_EXPANSE_ENVELOPE_C19RN2_MAP` | (19, -2) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C12RN1_MAP` | (12, -1) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_C13RN1_MAP` | (13, -1) | Valmere — Shingle Shore | yes | yes |
| `EASTERN_FENS_ENVELOPE_C14RN1_MAP` | (14, -1) | Valmere — Rocky Point | yes | yes |
| `VALMERE_EXPANSE_ENVELOPE_C19RN1_MAP` | (19, -1) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C12R0_MAP` | (12, 0) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C13R0_MAP` | (13, 0) | Valmere — Open Water | no | no |
| `EASTERN_FENS_ENVELOPE_C14R0_MAP` | (14, 0) | Valmere — Sheltered Cove | yes | yes |
| `VALMERE_EXPANSE_ENVELOPE_C19R0_MAP` | (19, 0) | Valmere — Open Water | no | no |
| `VALMERE_EXPANSE_ENVELOPE_C19R1_MAP` | (19, 1) | Valmere — Open Water | no | no |

### Eastern Shore (17 chunks)

A coastal shelf east of the Mornay peninsula, reached by walking south off
`EASTERN_FENS_MORNAY_THRESHOLD_MAP` through a grass-gap seam opened in its
south border. No story gate. Entirely roadless; navigated via clay bank,
storm shingle, sheltered cove, and wind-shaped woodland terrain drawn from
the existing palette. 7 chunks are walkable (1 converted Eastern Fens entry
chunk at (18,1), plus 6 fresh), immediately encounter-enabled on the same
established hard Eastern Fens/Mornay formation pool used by the Great Fen
and Valmere expanse. The other 10 are non-walkable framing chunks closing
the zero-visible-void camera envelope — the Southern Moraine's own bounds
extension (south to y=7) required these alongside the region's own shape.

**Reserved for future content (not built):** `EASTERN_SHORE_C19R4_MAP`
(19, 4) is a dead-end "Sheltered Cove" terminus — the plausible site for a
future outlet corridor continuing east/south. No structure exists there
yet; this is a location note only.

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `EASTERN_FENS_ENVELOPE_C18R1_MAP` | (18, 1) | Eastern Shore — Clay Bank | yes | yes |
| `EASTERN_SHORE_ENVELOPE_C20R1_MAP` | (20, 1) | Eastern Shore — Framing | no | no |
| `EASTERN_SHORE_ENVELOPE_C17R2_MAP` | (17, 2) | Eastern Shore — Framing | no | no |
| `EASTERN_SHORE_C18R2_MAP` | (18, 2) | Eastern Shore — Storm Shingle | yes | yes |
| `EASTERN_SHORE_C19R2_MAP` | (19, 2) | Eastern Shore — Clay Bank | yes | yes |
| `EASTERN_SHORE_C20R2_MAP` | (20, 2) | Eastern Shore — Wind-Shaped Woodland | yes | yes |
| `EASTERN_SHORE_ENVELOPE_C17R3_MAP` | (17, 3) | Eastern Shore — Framing | no | no |
| `EASTERN_SHORE_C18R3_MAP` | (18, 3) | Eastern Shore — Sheltered Cove | yes | yes |
| `EASTERN_SHORE_C19R3_MAP` | (19, 3) | Eastern Shore — Storm Shingle | yes | yes |
| `EASTERN_SHORE_ENVELOPE_C20R3_MAP` | (20, 3) | Eastern Shore — Framing | no | no |
| `EASTERN_SHORE_ENVELOPE_C17R4_MAP` | (17, 4) | Eastern Shore — Framing | no | no |
| `EASTERN_SHORE_ENVELOPE_C18R4_MAP` | (18, 4) | Eastern Shore — Framing | no | no |
| `EASTERN_SHORE_C19R4_MAP` | (19, 4) | Eastern Shore — Sheltered Cove (reserved outlet-corridor site) | yes | yes |
| `EASTERN_SHORE_ENVELOPE_C20R4_MAP` | (20, 4) | Eastern Shore — Framing | no | no |
| `EASTERN_SHORE_ENVELOPE_C18R5_MAP` | (18, 5) | Eastern Shore — Framing | no | no |
| `EASTERN_SHORE_ENVELOPE_C19R5_MAP` | (19, 5) | Eastern Shore — Framing | no | no |
| `EASTERN_SHORE_ENVELOPE_C20R5_MAP` | (20, 5) | Eastern Shore — Framing | no | no |

### Southern Moraine (14 chunks)

A gravel-ridge wilderness south of the Eastern Fens channel road, reached by
walking south off `EASTERN_FENS_VALMERE_ROAD_TURN_MAP` through a grass-gap
seam opened in its south border. No story gate. Entirely roadless; navigated
via mixed woodland, meadow, gravel ridge, and kettle-pond terrain drawn from
the existing palette. 7 chunks are walkable (1 converted Eastern Fens entry
chunk at (15,5), plus 6 fresh), immediately encounter-enabled on the same
established hard Eastern Fens/Mornay formation pool. The other 7 are
non-walkable framing chunks closing the zero-visible-void camera envelope.

**Reserved for future content (not built):** `SOUTHERN_MORAINE_C17R7_MAP`
(17, 7) is a dead-end "Gravel Ridge" terminus — the plausible site for a
future quarry or forestry outpost. No structure exists there yet; this is a
location note only.

| Map ID | Chunk (x,y) | Display name | Walkable | Encounters |
|---|---|---|---|---|
| `EASTERN_FENS_ENVELOPE_C15R5_MAP` | (15, 5) | Southern Moraine — Gravel Ridge | yes | yes |
| `SOUTHERN_MORAINE_ENVELOPE_C17R5_MAP` | (17, 5) | Southern Moraine — Framing | no | no |
| `SOUTHERN_MORAINE_ENVELOPE_C13R6_MAP` | (13, 6) | Southern Moraine — Framing | no | no |
| `SOUTHERN_MORAINE_C14R6_MAP` | (14, 6) | Southern Moraine — Mixed Woodland (kettle-pond cove) | yes | yes |
| `SOUTHERN_MORAINE_C15R6_MAP` | (15, 6) | Southern Moraine — Meadow | yes | yes |
| `SOUTHERN_MORAINE_C16R6_MAP` | (16, 6) | Southern Moraine — Gravel Ridge | yes | yes |
| `SOUTHERN_MORAINE_C17R6_MAP` | (17, 6) | Southern Moraine — Kettle Pond | yes | yes |
| `SOUTHERN_MORAINE_ENVELOPE_C18R6_MAP` | (18, 6) | Southern Moraine — Framing | no | no |
| `SOUTHERN_MORAINE_ENVELOPE_C13R7_MAP` | (13, 7) | Southern Moraine — Framing | no | no |
| `SOUTHERN_MORAINE_ENVELOPE_C14R7_MAP` | (14, 7) | Southern Moraine — Framing | no | no |
| `SOUTHERN_MORAINE_ENVELOPE_C15R7_MAP` | (15, 7) | Southern Moraine — Framing | no | no |
| `SOUTHERN_MORAINE_C16R7_MAP` | (16, 7) | Southern Moraine — Meadow | yes | yes |
| `SOUTHERN_MORAINE_C17R7_MAP` | (17, 7) | Southern Moraine — Gravel Ridge (reserved quarry/outpost site) | yes | yes |
| `SOUTHERN_MORAINE_ENVELOPE_C18R7_MAP` | (18, 7) | Southern Moraine — Framing | no | no |

## Change log

Append a dated entry here whenever a terrain/geography change is made —
a chunk added/removed/moved, an encounter/save/access flag flipped, or a
canon rename — so this index stays trustworthy without re-deriving it from
code each time.

### 2026-10-21

- **Confirmed canon rename complete, nothing left to do.** Searched the
  entire repository case-insensitively for "Cardenport"/"carden" — zero
  matches anywhere (map ids, `LORE.md`, dialogue, this atlas). All Mornay
  map ids (`EASTERN_FENS_MORNAY_*`) and display names already read
  "Mornay" throughout, consistent with the existing
  `refactor(canon): rename Cardenport to Mornay` commit.
- **Eastern Fens Mornay random encounters went live** on 22 of the 23
  main-route chunks (`EASTERN_FENS_EMBANKMENT_W_MAP` through
  `EASTERN_FENS_MORNAY_THRESHOLD_MAP`): chunk column ≤12 draws from an
  easy-leaning weighted formation table, column ≥13 from a hard-leaning
  one. `EASTERN_FENS_TRAVELLERS_RISE_MAP` (12, 3) is the one exception —
  it stays encounter-free, reserved for its own MQ5 scripted ambush.
  New roster: Botfly, Waspthra, Sparkeel, Mudwrack Snapper, Fen Rootworm,
  Willow-Veiled Stalker, Hollowreed Choker, plus a Mire Toad reuse.

### 2026-10-21 (terrain/geography redesign)

- **One readable drainage system, four landscape bands.** The Eastern Fens
  route now reads x5–9 wild interior fen/willow carr → x10–12 managed
  drainage/worked reeds → x13–15 widening storm-influenced channel/lakeward
  wetlands → x16–18 Valmere shoreline. Natural channels meander; artificial
  ditches/reed plots/drainage cuts are straightened. Thornmere stays calm,
  enclosed, muddy; Valmere reads colder, more exposed, with shingle, driftwood,
  and eroded banks. Drought shown via low-water marks, exposed mud, a stranded
  boat, and cracked peat hollows — no desert terrain.
- **Moraine ridge built** at (8–11, 4) and (12, 5): `EASTERN_FENS_ENVELOPE_C8R4_MAP`
  through `_C12R5_MAP`, now a connected Gravel Bar ridge spine with Hills scrub
  flanks and Basin Mud hollows, replacing scattered open water.
- **Raised peat bog built** at (9–14, 1): `EASTERN_FENS_ENVELOPE_C9R1_MAP`
  through `_C14R1_MAP`, now Basin Mud/willow-Tree/wet-ground, replacing another
  would-be lake.
- **3 new tiles** (ids 128–130): `GRAVEL_BAR` (walkable, natural), `DRIFTWOOD`
  and `STRANDED_BOAT` (non-walkable decorative), mirroring `DEEP_REEDS`'s
  footprint throughout `tiles.js`/`render-tiles.js`.
- **The six "Mornay" town-shell chunks were converted to scenery** (this
  intermediate state was superseded the same day — see the 2026-10-21
  correction entry below).
- **Travellers' Rise interior reshaped**, terrain only: a Hills/Tree wall
  now seals the open west fen (col 9, rows 8–13) from the exit corridor, and
  a second wall (cols 12–14, rows 1–3) seals an entrance-adjacent shortcut
  into the NPC home/route area. The west fen remains a walkable
  retreat/exploration pocket. The TRIGGER tile (10,7) and all 13 hardcoded
  NPC home/route/destination cells in `travellers-rise-ambush.js` are
  untouched at that intermediate checkpoint. Its row-4 staging route still
  allowed access to the eastern neighborhood; the exit guard prevented story
  bypass. The integrated natural-choke correction below closes that remaining
  gap and relocates two homes while retaining all final actor positions.
- No Mornay town streets/NPCs/shops/quests, no combat/encounter/MQ5/ambush-
  lifecycle changes, no save-version change. Full suite: 208/208 passed.

### 2026-10-21 (Mornay peninsula correction)

- **Corrected an overcorrection.** The six chunks converted to non-walkable
  scenery earlier the same day went too far in the opposite direction from
  the originally-flagged six-chunk town. Reworked into one coherent,
  irregular peninsula extending north into Valmere — walkable again (66
  accessible chunks, matching the pre-scenery total), but not a town grid.
- **Peninsula shape**: `EASTERN_FENS_MORNAY_NECK_ROAD_MAP` (17,-2) is the
  neck road/spine (a single PATH corridor, water cut into both the west and
  east sides so the landmass isn't a rectangular slab); `_WESTERN_COVE_MAP`
  (16,-2) is a sheltered cove/harbour-facing shore (drought mud, a stranded
  boat); `_EASTERN_SHORE_MAP` (18,-2) is a more exposed eastern shore (narrow
  shingle, open rockier water); `_HARBOUR_SHORE_MAP` (16,-3) is the western harbour
  shore continuing north; `_TOWN_APPROACH_MAP` (17,-3) is the northern
  crown; `_EASTERN_POINT_MAP` (18,-3) is the exposed eastern point. Substantial
  open Valmere water remains visible on every side (the lake still reads as
  an inland sea). `EASTERN_FENS_MORNAY_APPROACH_M_MAP`'s (17,-1) north seam
  reopened (cols 7-9) so the existing approach connects into the peninsula's
  southern neck. 8 new reciprocal seam pairs connect the six chunks into one
  walkable landform, with two authored coastal dead ends (a mooring spur
  ending at rock/reeds, a point tip ending at open water) for local
  exploration — not a bypass around anything.
- **Reserved the compact 3x2 Mornay settlement footprint**: 6 TOWN_BUILDING
  tiles at `EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP` rows 1-2, cols 7-9 —
  the whole town at overworld scale, reusing the established
  TOWN_ENTRANCE/`enterTownAt()` convention already used by Calwick (`MAP`)
  and Drenwick (`MAP3_N2`) for when the real interior town map exists. The
  neck road terminates naturally at the footprint's southern face (row 3).
  Future entry tile: (col 8, row 2) on `EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP`
  — presently solid (TOWN_BUILDING). Future return-landing tile: (col 8,
  row 3) on the same chunk — presently the walkable road (PATH). No
  transition to a nonexistent Mornay town map was created; no closure/guard/
  lore explanation was invented. Wiring the real transition is left for
  Codex.
- No TOWN_FLOOR or TOWN_MARKET tiles anywhere on the peninsula (no literal
  streets); TOWN_BUILDING appears nowhere except the 6-tile footprint. No
  Mornay town content, no combat/encounter/MQ5/ambush-lifecycle changes, no
  save-version change. The 8 new terrain test files from the earlier pass
  were renumbered 201–208 → 209–216 to resolve a collision with Codex's
  campsite/campfire-night/lifecycle tests at the same numbers; test 215 was
  rewritten for the peninsula and test 216's framing of the Travellers' Rise
  residual bypass was recorded for the later natural-choke correction below. Full suite:
  208/208 passed.

### 2026-10-21 (Mornay peninsula internal names)

The six peninsula IDs now describe Neck Road, Western Cove, Eastern Shore,
Harbour Shore, Town Approach and Eastern Point. Their display names, grid
hashes, placements, coastal spurs and structural seams are unchanged. The
3×2 town footprint remains solid: future entry (8,2), future return (8,3),
with no town transition. Catalogues, save placement, debug warp, tests and
source-derived artifacts use the same renamed IDs. No compatibility aliases
are retained for the unreleased district placeholders. Regional saved world
coordinates remain compatible; the six maps retain their save restrictions.
Malformed explicit retired IDs reject through existing unknown-map validation.

### 2026-10-22 (Great Fen expansion)

- **New region: the Great Fen**, 51 chunks (28 walkable, 23 scenery-only
  framing), reached from `EASTERN_FENS_ENVELOPE_C7R0_MAP`/`_C8R0_MAP` via a
  new 3-cell reed-gap seam opened in each one's north border (row 0, cols
  7-9 — the only grid edit on those two chunks). No story gate.
- **4 existing Eastern Fens scenery chunks converted**: `EASTERN_FENS_
  ENVELOPE_C6RN1_MAP` through `_C9RN1_MAP` (6-9,-1) became the Great Fen's
  two entry points — mapIds/coordinates unchanged, grid and metadata
  (`region`, `encounterProfileId`, `allowRandomEncounters`, `allowSave`)
  rewritten. **23 fresh chunks** authored in a new file,
  `content/maps/great-fen-maps.js` (`GREAT_FEN_C*_MAP`, chunkX 1-10,
  chunkY -5..-2, densely interconnected — every adjacent pair seamed, giving
  broad loops/branches, not one corridor).
- **23 non-walkable framing chunks** (`GREAT_FEN_ENVELOPE_C*_MAP`, same
  file) close a real zero-visible-void gap: the walkable footprint is
  irregular, not a rectangle, so the production camera could scroll
  unplaced coordinates into view near its edges. Mirrors the established
  Eastern Fens envelope convention exactly (scattered water/reed/rock
  scenery, `playerAccessible: false`, no seam/transition).
- **Entirely roadless**: zero PATH/TOWN_FLOOR/TOWN_MARKET/BRIDGE_DECK tiles
  anywhere in the region, swept by an automated test. Terrain built from the
  existing palette only (GRASS, REEDS, DEEP_REEDS, BASIN_MUD, EXPOSED_STONE,
  GRAVEL_BAR, HILLS, TREE, TREE_IN_WATER, ROCKS_IN_WATER) — no new tile ids.
- **Hard-pool encounters enabled immediately** on all 28 walkable chunks
  (`encounterProfileId: 'eastern_fens_mornay_hard'`, the same formation
  table the Eastern Fens Mornay route's hard-leaning chunks already use —
  no separate introductory pool, no second combat-entry bridge).
- **Closed-system topology**: every seam reachable from inside the Great
  Fen targets only another Great Fen chunk or the two authorized entrances
  — proven directly, not just by omission. No route reaches Mornay, east of
  Travellers' Rise, the North Basin, or any wider west/north continent.
  Stays entirely on the pre-ambush (west) side of Travellers' Rise.
- **Reserved for future content (not built)**: `GREAT_FEN_C8RN2_MAP` (8,-2)
  — a central, four-way-connected raised-gravel chunk — is the plausible
  site for a future tiny hamlet, Imperial survey post, or drainage outpost.
  No settlement/NPC/structure exists there.
- No Mornay/North Basin/Valmere-expanse/eastern-shore/southern-moraine
  content yet (deferred to a later increment of the same authorized task).
  No combat/encounter-mechanics/save-version changes. New focused test
  `218-great-fen-expansion.test.js`; ~30 pre-existing tests updated for
  legitimately-shifted world totals (map counts, transition-audit ALIGNS/
  BORDER/BLOCKED, seam counts, region pixel bounds). Full suite: 213/213
  passed.

### 2026-10-22 (Valmere expanse)

- **New region: the Valmere expanse**, 48 chunks (13 walkable, 35
  non-walkable open water), reached from `EASTERN_FENS_VALMERE_REVEAL_MAP`
  via a new 3-cell reed-gap seam opened in its west border (col 0, rows
  6-8 — the only grid edit on that chunk). No story gate.
- **2 existing Eastern Fens scenery chunks converted**:
  `EASTERN_FENS_ENVELOPE_C14R0_MAP`/`_C14RN1_MAP` (14,0)/(14,-1) became the
  expanse's entry points — mapIds/coordinates unchanged, grid/metadata
  rewritten. **11 fresh chunks** authored in a new file,
  `content/maps/valmere-expanse-maps.js` (`VALMERE_EXPANSE_C*_MAP`, a
  branching comb of sheltered coves and rough points along one shore
  spine — never a single corridor).
- **35 non-walkable open-water chunks** (`VALMERE_EXPANSE_ENVELOPE_C*_MAP`,
  same file) close the lake's zero-visible-void camera envelope. 29 were
  needed around the near-shore spine itself; a further 13 were needed only
  after discovering that extending the region's overall camera bounds
  (required for Valmere's own extent) exposed two unrelated pre-existing
  edges to new void: 7 more chunks at (0-6,-6) to re-close the Great Fen's
  own north edge, and 6 more chunks at (19, 1 down to -4) to re-close the
  Eastern Fens/Mornay peninsula's own east edge. Both are side effects of
  one shared global bounding box, not design changes to either region.
- **Entirely roadless**: zero PATH/TOWN_FLOOR/TOWN_MARKET/BRIDGE_DECK tiles
  anywhere in the region, swept by an automated test. Reeds confined to
  sheltered margins only; shingle/gravel/exposed-stone on exposed coasts,
  per Valmere's storm-exposed character (distinct from the Great Fen's
  reed-heavy look). No new tile ids.
- **Hard-pool encounters enabled immediately** on all 13 walkable chunks
  (`encounterProfileId: 'eastern_fens_mornay_hard'`) — the same pool the
  Great Fen and the Eastern Fens Mornay route's hard-leaning chunks already
  use, no separate introductory pool.
- **Closed-system topology**: every seam reachable from inside the Valmere
  expanse targets only another Valmere expanse chunk or the single
  authorized entrance — proven directly. None of the six protected Mornay
  peninsula grids are touched or reachable from this region.
- **Reserved for future content (not built)**: `VALMERE_EXPANSE_C14RN6_MAP`
  (14,-6) — the northernmost exposed rocky point — is the plausible site
  for a future hydrographic survey post or weather station. No structure
  exists there.
- No Mornay/North Basin/eastern-shore/southern-moraine content yet
  (deferred to a later increment of the same authorized task). No
  combat/encounter-mechanics/save-version changes. New focused test
  `219-valmere-expanse.test.js`; ~35 pre-existing tests updated for
  legitimately-shifted world totals (map counts, transition-audit ALIGNS/
  BORDER/BLOCKED, seam counts, region pixel bounds, tile-confinement
  checks widened to include 'Valmere'). Full suite: 214/214 passed.

### 2026-10-22 (Eastern Shore + Southern Moraine)

- **Two new regions: the Eastern Shore** (17 chunks, 7 walkable) east of the
  Mornay peninsula, and **the Southern Moraine** (14 chunks, 7 walkable)
  south of the Eastern Fens channel road — the third and final increment of
  this overworld expansion task.
- **2 existing Eastern Fens scenery chunks converted**: `EASTERN_FENS_
  ENVELOPE_C18R1_MAP` (18,1) became the Eastern Shore's entry point;
  `EASTERN_FENS_ENVELOPE_C15R5_MAP` (15,5) became the Southern Moraine's
  entry point — mapIds/coordinates unchanged, grid/metadata rewritten,
  moved to their new regions (no longer listed under Eastern Fens above).
  **12 fresh chunks** authored across two new files,
  `content/maps/eastern-shore-maps.js` and
  `content/maps/southern-moraine-maps.js`.
- **17 non-walkable framing chunks** (`EASTERN_SHORE_ENVELOPE_C*_MAP`,
  `SOUTHERN_MORAINE_ENVELOPE_C*_MAP`) close the zero-visible-void camera
  envelope for both new sub-regions and for the Southern Moraine's own
  bounds extension (south to y=7).
- **Topology bug found and fixed during verification**: the two entrance
  chunks were initially wired with only a seam *into* their own new
  sub-region, with no seam back to the pre-existing walkable network —
  leaving both sub-networks genuinely unreachable (confirmed directly via
  `continuousSeamEntries()`, not assumed). Fixed by carving a 3-cell
  grass-gap seam in `EASTERN_FENS_MORNAY_THRESHOLD_MAP`'s south border (row
  14, cols 7-9) and `EASTERN_FENS_VALMERE_ROAD_TURN_MAP`'s south border
  (same cols), with matching reciprocal seams on the entry chunks' north
  borders — the same established seam convention used throughout this
  expansion. Continuous-only graph connectivity re-verified at exactly 3
  components (Verdant Vale and the Eastern Bank ferry route isolated,
  everything else — including both new sub-regions — joined).
- **Entirely roadless**: zero PATH/TOWN_FLOOR/TOWN_MARKET/BRIDGE_DECK tiles
  anywhere in either region. Terrain built from the existing palette only —
  no new tile ids.
- **Hard-pool encounters enabled immediately** on all 14 walkable chunks
  across both regions (`encounterProfileId: 'eastern_fens_mornay_hard'`) —
  the same pool the Great Fen, Valmere expanse, and Eastern Fens Mornay
  route's hard-leaning chunks already use.
- **Reserved for future content (not built)**: `EASTERN_SHORE_C19R4_MAP`
  (19,4) — a dead-end cove terminus — is the plausible site for a future
  outlet corridor; `SOUTHERN_MORAINE_C17R7_MAP` (17,7) — a dead-end ridge
  terminus — is the plausible site for a future quarry/forestry outpost.
  No structure exists at either.
- No combat/encounter-mechanics/save-version changes. ~21 pre-existing test
  files updated for legitimately-shifted world totals (transition-audit
  ALIGNS/BLOCKED, `continuousSeamEntries()` count, region pixel bounds, the
  test-83 connectivity graph). Full suite: 214/214 passed;
  `validateGameData()` 0 errors; transition audit 0 CONFLICT/OUTSIDE_REGION/
  NEEDS_REMAP.

### 2026-10-22 (Fen Zolom gate)

- **The two Great Fen entrances (7,0)/(8,0) went from encounter-free to a
  single, essentially unwinnable encounter.** Both chunks previously used
  the ordinary `far` pool but with `allowRandomEncounters: false`
  (test/cases/178's own comment described this as reserved for "later be
  enemy-gated in" / a "beeftank gate" — a plan that existed only as a test
  comment, with no implementation or design-doc entry anywhere else in the
  repo). Resolved by building the gate: both chunks now draw from a new,
  solo-entry `north_fen_zolom` encounter profile — every random encounter on
  either chunk is the Fen Zolom, never anything else.
- **New enemy: Fen Zolom** (`enemy_fen_zolom`, data.js) — 400 HP, 65 ATK
  (higher than any other enemy in the game, including story bosses), marked
  `isBoss: true`. A deliberate homage to Final Fantasy VII's Midgar Zolom,
  including that game's own mistranslation as the joke.
- **Running is genuinely impossible, not just difficult.** `isBoss: true`
  is the same flag every other unbeatable/boss fight in the game already
  uses (Takomo, Mulholland, the Lensweb Spider, the final boss); the shared
  combat installer (`installFormationState`, combat.js) always derives
  `bossLocked` from `templates.some(t=>t.isBoss)` regardless of which pool
  or dispatcher drew the encounter — so the geographic random-encounter
  dispatcher needed no code changes at all. Confirmed directly, not assumed:
  a live combat simulation shows the Run command resolves with
  `allowed:false, chance:0, success:false`.
- No terrain/grid changes (fingerprints unaffected), no save-version change.
  test/cases/178 extended with the Fen Zolom gate's proof points (pool
  composition, isBoss, canonical-combat compatibility, and the direct
  escape-block simulation above). Full suite passed; `validateGameData()`
  0 errors.

### 2026-10-22 (Mornay approach road-gap fix)

- **Closed a visible gap in the maintained road between the Valmere
  threshold and Mornay.** `EASTERN_FENS_MORNAY_APPROACH_M_MAP` (17,-1) —
  "the middle approach" — was the only chunk in the Threshold→Mornay chain
  without a paved spine: every sibling chunk (`_APPROACH_E_MAP`,
  `_NECK_ROAD_MAP`, `_TOWN_APPROACH_MAP`) carries a full-height PATH column,
  but APPROACH_M had pavement only at its single-row north seam into
  `_NECK_ROAD_MAP`. The west seam connecting it to `_APPROACH_E_MAP` was also
  unpaved grass-to-grass, so walking the road meant detouring through ~1.5
  chunks of open fen between the two paved ends.
- **Fix**: `EASTERN_FENS_MORNAY_APPROACH_M_MAP` gained a full-height PATH
  spine (cols 7-9, rows 0-13, matching its siblings) plus a rows-6-8 spur
  east to its col-15 seam; `EASTERN_FENS_MORNAY_APPROACH_E_MAP` (18,-1)
  gained a matching rows-6-8 spur west to its col-0 seam, so the two spurs
  meet exactly at the chunk boundary. No tile ids, topology, seams,
  encounter/save flags, or chunk placements changed — only existing
  grass/reed cells repaved along the new corridor.
- Both chunks' regional-grid fingerprints were recomputed and updated;
  test/cases/215 (which hardcodes a historical grid/fingerprint for
  `_APPROACH_M_MAP` and sweeps `_APPROACH_E_MAP` as "untouched") was updated
  to recognize this later, separately-authorized change. Full suite:
  214/214 passed; `validateGameData()` 0 errors; transition audit 0 hard
  incompatibilities.

### Travellers’ Rise natural ambush choke

Three cells close the former staging shortcut: (11,4) grass → hills (119),
(11,5) rushes (89) → tree (3), and (11,6) grass → hills (119). All other grids,
seams, camp entry (6,4), return (6,5), pools and permissions are unchanged.
Removing trigger (10,7) from the tile graph leaves 121 reachable western cells
and no eastern-road access; retaining it connects 163 cells and all east exits.
The Impostor begins at (8.5,4.5), the cloaked Hollow at (10.5,3.5), and the
Handler retains (14.5,4.5). Their destinations remain (8.5,7.5), (10.5,5.5),
and (12.5,7.5). Preflight validates terrain, occupied cells, trigger exclusion,
all simultaneous actor positions and endpoint agreement before presentation.
Esla's post-victory campsite route uses row 6 to avoid the existing scrub at
(7,7). The original defensive east gate still blocks ambush/camp bypass and
opens after the existing stage-2 receipt. Load stays inert until deliberate
movement. Suite 217 covers graph and actual continuous/legacy input, while
199/201/207/208 retain payment, retry, save/load and one-time story coverage.
