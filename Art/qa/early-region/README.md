# Early-region framing and southern closure

The early region again keeps the requested edges on screen:

| Map | Edge | Native camera limit |
|---|---|---|
| Northern Road / MAP_N1 | West | camera X ≥ 0 |
| Blocked Path / MAP_N2 | West | camera X ≥ 0 |
| Eastern Reaches / MAP2 | South | camera Y ≤ 2400; viewport bottom ≤ 2880 |
| Thornmere Fen / MAP3 | South | camera Y ≤ 2400; viewport bottom ≤ 2880 |

The limits are authored as `cameraClampEdges` on those four chunk definitions and resolved read-only in the existing continuous render plan. They combine with the legacy-screen home exclusion. Global world bounds, all other cameras, character movement speed and the performance fix are unchanged. Legacy Regional Fallback retains its fixed-screen presentation.

Exactly **seven cells**, all GRASS (0) → WATER (1), change in MAP3: `(9,13)` through `(12,13)` and `(10,14)` through `(12,14)`. Every other grid is unchanged relative to `fb6c65f`. [grid-deltas.json](grid-deltas.json) records the comparison. The obsolete MAP3.south / MAINLAND_C2R6_MAP.north structural seam pair is removed, reducing structural segments 2058→2056 and continuous entries 1978→1976. Main route, ferry, Rise and camp contracts remain intact.

Myles explicitly chose to keep the southwestern bank sealed for this pass. That component spans parts of 34 chunks; some chunks contain a separate reachable eastern bank as well. Its terrain and placement permissions are preserved, with no invented replacement entrance or escape. Existing saves within it need debug warp to leave. Suite 317 treats it as a deliberately reserved connected component while retaining all normal progression cuts and ordinary-component return checks.

Verification: **240/240 regression suites**, **32 changed/new JavaScript syntax checks**, `validateGameData()` **0 errors / the same 14 warnings**, SAVE_VERSION **5**, all **934 fingerprints** matching, read-only transition artifact matching, and clean whitespace/conflict-marker/scope checks. Suite 320 protects the exact seven-cell mask, four camera policies, unrestricted western exploration elsewhere, invalid metadata rejection, state purity and held-input blocking from both sides in continuous and legacy modes. Existing ownership/performance suite 319 still passes. [verification.json](verification.json) records exact results.

Automated Chromium review passes **130 checks / 37 captures / zero browser errors**. Ten requested-view captures at 512×480 and 1024×960 are retained here with hashes in [manifest.json](manifest.json). They were visually inspected; this is automated input/Canvas evidence, not a human playthrough. The current atlas SVG/inventory/production overview were regenerated from live data; other retained regional views were re-rendered and verified byte-identical. The pre-existing untracked visual-atlas files remain their original snapshot.

Manual walkthrough: walk west in Northern Road and Blocked Path, then south in Eastern Reaches and Thornmere Fen; the camera should stop at the original boundary. Push south from MAP3 column 10 at row 12 and confirm the water prevents departure. Repeat with Legacy Regional Fallback. Use debug warp to inspect or leave the sealed southern bank.

This pass is delivered as a local checkpoint on `agent/codex` at Myles’s request. Nothing is merged into main or pushed. Other worktrees and the unrelated untracked visual-atlas files are untouched.

## Exact file inventory for this pass

- `Art/qa/early-region/README.md`
- `Art/qa/early-region/blocked-path-west-1x.png`
- `Art/qa/early-region/blocked-path-west-2x.png`
- `Art/qa/early-region/eastern-reaches-south-1x.png`
- `Art/qa/early-region/eastern-reaches-south-2x.png`
- `Art/qa/early-region/grid-deltas.json`
- `Art/qa/early-region/manifest.json`
- `Art/qa/early-region/northern-road-west-1x.png`
- `Art/qa/early-region/northern-road-west-2x.png`
- `Art/qa/early-region/thornmere-fen-south-1x.png`
- `Art/qa/early-region/thornmere-fen-south-2x.png`
- `Art/qa/early-region/thornmere-water-barrier-1x.png`
- `Art/qa/early-region/thornmere-water-barrier-2x.png`
- `Art/qa/early-region/verification.json`
- `Art/qa/regional-geography/README.md`
- `Art/qa/regional-geography/inventory.json`
- `Art/qa/regional-geography/manifest.json`
- `Art/qa/regional-geography/overview.svg`
- `Art/qa/regional-geography/production-overview.png`
- `OVERWORLD_ATLAS.md`
- `PROJECT_STATUS.md`
- `REGIONAL_GEOGRAPHY_PLAN.md`
- `architecture.md`
- `content/maps/thornmere-wilds-maps.js`
- `data.js`
- `maps.js`
- `test/cases/100-east-causeway.test.js`
- `test/cases/101-west-outfall-canal-tunnel.test.js`
- `test/cases/102-north-basin-drowned-rim.test.js`
- `test/cases/103-north-basin-mirewood.test.js`
- `test/cases/317-mainland-navigation.test.js`
- `test/cases/320-early-region-framing.test.js`
- `test/cases/72-continuous-seams.test.js`
- `test/cases/77-map3-fen-seam-pilot.test.js`
- `test/cases/78-verdant-vale-legacy-home.test.js`
- `test/cases/83-map3n2-northbasin-seam-closure.test.js`
- `test/cases/85-canonical-consumers-part2.test.js`
- `test/cases/86-regional-chunk-catalog.test.js`
- `test/cases/87-roddon-legacy-camera.test.js`
- `test/cases/88-continuous-regional-production-default.test.js`
- `test/cases/89-west-outfall-scenery-chunk.test.js`
- `test/cases/90-north-basin-open-reservoir.test.js`
- `test/cases/91-north-basin-open-reservoir-east.test.js`
- `test/cases/92-north-basin-eastern-woods.test.js`
- `test/cases/95-north-basin-eastern-road.test.js`
- `test/cases/96-eastern-canal-banks.test.js`
- `test/cases/97-northern-thornmere-fen.test.js`
- `test/cases/98-thornmere-upper-shallows-scenery.test.js`
- `test/cases/99-thornmere-canal-head.test.js`
- `test/fixtures/regional-grid-fingerprints.js`
- `test/regional-atlas.js`
- `test/regional-geography-browser.js`
- `test/transition-audit-output.json`
- `validation.js`
- `world-transitions.js`
- `world-view.js`
