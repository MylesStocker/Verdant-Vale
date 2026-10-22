# Overworld Atlas

A dated, human-readable snapshot of every placed regional chunk, generated
directly from `REGIONAL_CHUNK_CATALOG` — so a future session can answer "what's
where, and did terrain change since I last looked" without reading the whole
game codebase. This file is a readable index, not a gameplay authority: the
game always reads live from `data.js`/`content/maps/*.js`.

**Snapshot date: 2026-10-21 (terrain refresh)**

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
chunk's grid is byte-identical. As of this snapshot it holds 115 fingerprints,
last touched 2026-10-21 (Eastern Fens terrain/geography redesign, see change
log below).

## Totals (as of this snapshot)

- **115** placed chunks, all in the single continuous `regionId: 'overworld'`
  coordinate space (every chunk's `chunkX`/`chunkY` shares one grid — there is
  no per-region-local origin).
- Global chunk extent: **x 0–18, y −4–5** (19×10 chunks → 304×150 tiles).
- **7** named display regions (flavor labels within that one grid, not
  separate coordinate spaces): Verdant Vale, Eastern Reaches, Drenwick,
  Drenwick Fens, Thornmere, North Basin, Eastern Fens.
- **66** chunks are player-walkable; **49** are scenery-only
  (`playerAccessible: false`).
- **45** chunks currently have `allowRandomEncounters: true`.

| Region | Chunks | Walkable | With encounters | Chunk range (x, y) |
|---|---|---|---|---|
| Verdant Vale | 1 | 1 | 1 | x[0..0] y[5..5] |
| Eastern Reaches | 3 | 3 | 2 | x[1..5] y[2..5] |
| Drenwick | 2 | 2 | 2 | x[2..3] y[3..3] |
| Drenwick Fens | 1 | 0 | 0 | x[1..1] y[3..3] |
| Thornmere | 10 | 9 | 9 | x[0..4] y[3..5] |
| North Basin | 17 | 9 | 9 | x[0..4] y[-1..2] |
| Eastern Fens | 81 | 42 | 22 | x[5..18] y[-4..5] |

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

### Eastern Fens (81 chunks)

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
| `EASTERN_FENS_ENVELOPE_C6RN1_MAP` | (6, -1) | Eastern Fens — Open Fen Water | no | no |
| `EASTERN_FENS_ENVELOPE_C7RN1_MAP` | (7, -1) | Eastern Fens — Open Fen Water | no | no |
| `EASTERN_FENS_ENVELOPE_C8RN1_MAP` | (8, -1) | Eastern Fens — Open Fen Water | no | no |
| `EASTERN_FENS_ENVELOPE_C9RN1_MAP` | (9, -1) | Eastern Fens — Open Fen Water | no | no |
| `EASTERN_FENS_ENVELOPE_C14RN1_MAP` | (14, -1) | Eastern Fens — Valmere Open Water | no | no |
| `EASTERN_FENS_ENVELOPE_C15RN1_MAP` | (15, -1) | Eastern Fens — Valmere Open Water | no | no |
| `EASTERN_FENS_MORNAY_APPROACH_W_MAP` | (16, -1) | Valmere — Mornay Approach (West) | yes | no |
| `EASTERN_FENS_MORNAY_APPROACH_M_MAP` | (17, -1) | Valmere — Mornay Approach | yes | no |
| `EASTERN_FENS_MORNAY_APPROACH_E_MAP` | (18, -1) | Valmere — Mornay Approach (East) | yes | no |
| `EASTERN_FENS_ENVELOPE_C6R0_MAP` | (6, 0) | Eastern Fens — Open Fen Water | no | no |
| `EASTERN_FENS_ENVELOPE_C7R0_MAP` | (7, 0) | Eastern Fens — North Fen | yes | no |
| `EASTERN_FENS_ENVELOPE_C8R0_MAP` | (8, 0) | Eastern Fens — North Fen | yes | no |
| `EASTERN_FENS_ENVELOPE_C9R0_MAP` | (9, 0) | Eastern Fens — Flooded Reeds | no | no |
| `EASTERN_FENS_ENVELOPE_C14R0_MAP` | (14, 0) | Eastern Fens — Silted Margin | no | no |
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
| `EASTERN_FENS_ENVELOPE_C18R1_MAP` | (18, 1) | Eastern Fens — Drainage Flats | no | no |
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
| `EASTERN_FENS_ENVELOPE_C15R5_MAP` | (15, 5) | Eastern Fens — Storm Shoal: East | no | no |
| `EASTERN_FENS_ENVELOPE_C16R5_MAP` | (16, 5) | Eastern Fens — Lakeward Shallows: East | no | no |

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
  untouched (verified byte-identical). An integration follow-up is tracked
  for Codex: the NPC's own row-4 route still bridges the TRIGGER column to
  the home area, so the authored "every eastbound route crosses the trigger"
  intention isn't fully terrain-enforced yet — `blocksExit('east')` at the
  movement layer prevents any actual sequence break in the meantime (proven
  by `test/cases/199`), and closing the gap requires relocating NPC
  route/home cells, which is ambush-lifecycle work, not terrain.
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
  residual bypass was corrected to an open Codex follow-up. Full suite:
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
