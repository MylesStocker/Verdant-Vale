# Mornay road and overworld marker — 2026-10-28

The road from the lakeward bend through the channel, Valmere shore and Mornay peninsula is one or two tiles wide. Walkable grass replaces excess paving. At the crown it reaches only the two southern gates; it no longer runs beside the town marker. The four solid cells above the gates now show dense roofs, a northwestern fort and a western harbour. The existing compact footprint, entrance cells and town interiors are preserved.

## Exact terrain scope

`grid-deltas.json` records every changed cell as map ID, zero-based column/row, old tile and new tile. `before-fingerprints.json` records the twelve pre-pass grids. All 1,058 current regional grids were compared with a pre-edit snapshot: exactly 200 cells differ, with no added or removed chunks. All changed cells retain their previous walkability.

| Map ID suffix (prefix `EASTERN_FENS_`) | Changed cells |
|---|---:|
| VALMERE_ROAD_TURN_MAP | 9 |
| CHANNEL_ROAD_S_MAP | 4 |
| CHANNEL_ROAD_MID_MAP | 4 |
| CHANNEL_ROAD_N_MAP | 4 |
| VALMERE_REVEAL_MAP | 10 |
| VALMERE_SHORE_W_MAP | 16 |
| VALMERE_SHORE_E_MAP | 16 |
| MORNAY_THRESHOLD_MAP | 34 |
| MORNAY_APPROACH_M_MAP | 30 |
| MORNAY_APPROACH_E_MAP | 42 |
| MORNAY_NECK_ROAD_MAP | 15 |
| MORNAY_TOWN_APPROACH_MAP | 16 |

196 cells change PATH (2) to GRASS (0). Four crown cells change solid TOWN_BUILDING (13) to new solid TOWN_ROOFS (131), TOWN_FORT (132) and TOWN_HARBOUR (133). No existing tile ID changes. These tiles are deterministic, bounded Canvas scenery with no interaction, encounter or transition behavior. The harbour is a town-scale symbol, not a new departure point.

Crown marker: row 1 columns 7–8 = fort/roofs; row 2 = harbour/roofs; row 3 = unchanged West/East gates. Returns remain crown-local (240,144)/(272,144), facing down. Structural seam ranges include grassy shoulders and remain unchanged. No camera, world-coordinate, story, save, town, NPC or combat authority was changed in this pass. SAVE_VERSION remains 5. Grass verges follow normal off-road encounter eligibility where the existing map already permits encounters; encounter permissions and pools are unchanged.

## Verification and visual evidence

- Baseline: 272/272 suites passed before this pass. Final full regression: **273/273 passed, zero failures** (`node test/run.js`).
- Syntax checks passed for all 57 changed/new JavaScript files; `git diff --check` and conflict-marker scans passed.
- Suite 337: exact cell deltas and prior hashes, road connectivity/width across seams, solid marker registration, translated deterministic read-only rendering, four ordinary-input gate journeys (both gates in continuous and Legacy presentation), save/load inside each gate and safe exits without immediate re-entry.
- Historical suites 101, 215, 317, 322 and 323 account for the approved new tiles/cells. Original historical hashes remain unchanged. Detached test projections reverse only verified recorded changes; they never change runtime grids. `note-deltas.json` records the five corrected descriptive notes.
- All 1,058 current regional fingerprints match; exactly twelve hashes were regenerated.
- `validateGameData()`: 1,263 maps, 508 NPCs; zero errors and six existing warnings.
- Transition audit: 479 fixed destinations, eight preserved-coordinate transitions, 2,026 edge segments and 42 house doors. Generated output is byte-identical to the pre-pass Fleck artifact; this pass adds no transitions.
- Native Chrome controls in the isolated fixture: West and East gate entry/exit in continuous view, plus West gate entry/exit in Legacy view. Inspected the town at 512×480 and 1024×960, the road bend at 2× and shore road at 1×. No browser console errors recorded.
- Separately, the existing regional-geography browser fixture completed 163 automated checks with zero errors and produced 57 captures. Its production-rendered overview was saved to the established atlas PNG. These automated fixture checks are not described as manual playthroughs.

Screenshots: `town-1x.png`, `town-2x.png`, `west-gate-return-1x.png`, `east-gate-return-1x.png`, `legacy-gate-return-1x.png`, `road-bend-2x.png`, `shore-road-1x.png`. The 2× bend capture is a viewport crop caused by focusing the larger canvas; the visible bend was inspected.

## Files and generated evidence

`pass-files.json` lists exact files changed or created by this pass, separated from earlier dirty Fleck and pinky-promise preview work. Production changes are confined to `content/maps/eastern-fens-maps.js`, `tiles.js` and `render-tiles.js`. Documentation adds the presentation decision to the Mornay plan, project status and architecture.

Regenerated using established tools:

- `node test/regional-atlas.js --fingerprints`: twelve grid fingerprints.
- `node test/regional-atlas.js --write`: atlas Markdown, live inventory and SVG overview, including new marker colours.
- Existing `test/regional-geography-browser.html`: production-rendered overview PNG.
- `node test/transition-audit.js --write`: no increment relative to the already-dirty Fleck artifact.

The prior Fleck transition-artifact differences against HEAD remain prior work. Existing Fleck/runtime/preview changes were preserved, not folded into this terrain pass.

## Short playtest route

1. Follow the Valmere shore road and the western bend towards Mornay; check the modest width and walkable shoulders.
2. Approach the crown and inspect the fort, roofs and small harbour at native and double scale.
3. Enter through West Gate, save/load, then leave south. Repeat through East Gate.
4. Walk along both sides of the marker: no road attaches to the walls and no new harbour exit appears.
5. Repeat a gate round trip with Legacy Regional Fallback enabled.

Starting and final branch: `main`; HEAD remains `4f45e8a608775cabaff6c25e25dd071b2f73eab4`. Nothing staged, committed, merged or pushed.
