# Regional geography evidence

These images come from the final live tile grids, not a painted proposal. `overview.svg` is the compact cartographic rendering; `production-overview.png` uses the production tile painter at four pixels per tile. Dark unfilled space in an overview is outside the authored window. Suite 318 checks that gameplay viewports cannot expose it.

The browser run uses installed Chromium, production scripts, DOM keyboard events, Canvas and local storage. It passed 110 geography checks and captured 27 images; the separate existing lifecycle run passed 7,119 checks with 172 captures. Both reported zero browser errors. This is automated browser evidence plus visual inspection of captures, not a human gameplay session. Random battles are suppressed by the established debug fixture while checking movement; ordinary encounter ownership and compatibility are covered by the regression suites.

`manifest.json` records the packaged PNG hashes, sizes, terrain fingerprint digest and renderer hashes. Fifteen PNGs are retained here: the overview and seven representative views at 512×480 and 1024×960. Cartographic display names were cleaned up after capture; titles live outside the captured gameplay Canvas, and the captured grids/renderers are unchanged.

| View | Location | Review purpose |
|---|---|---|
| western-willow-fen | (-6,-10) | Dense reeds, sedge and wooded fen edge |
| southern-pasture | (4,8) | Open stressed pasture beside mixed woodland |
| river-mouth | (22,0) | Lake/river bank and protected reed margin |
| lower-river-crossing | (22,3) | Timber crossing and gravel bank approaches |
| moraine-river-gap | (25,8) | River valley through wooded higher ground |
| zolom-southern-warning | Reedbelt North, column 7 | Safe observation bar, disturbed reeds and timber |
| lake-headland | (24,0) | Inert observation-site trace and woodland |

Reproduce from the repository root:

```sh
node test/regional-atlas.js --write
VV_BROWSER_PAGE=regional-geography-browser.html node test/run-browser-smoke.js
node test/run-browser-smoke.js
node test/run.js
node test/transition-audit.js
```

Set `VV_BROWSER_OUTPUT` to a chosen output directory to retain browser PNGs. `--fingerprints` is a separate deliberate atlas-generator option, used only after reviewed terrain changes. `inventory.json` is the live chunk/access/encounter/hash inventory. `grid-deltas.json` compares all existing regional grids with the synchronized committed baseline, using `[column,row,oldTileId,newTileId]` records. Full drainage, scope decisions, verification and the walkthrough are in [REGIONAL_GEOGRAPHY_PLAN.md](../../../REGIONAL_GEOGRAPHY_PLAN.md).

Follow-up: the current terrain overview/inventory/fingerprints include the seven-cell Thornmere Fen water closure. `grid-deltas.json` preserves the initial mainland checkpoint; [the early-region delta record](../early-region/grid-deltas.json) records the subsequent seven cells. [Early-region evidence](../early-region/README.md) covers restored camera framing and the sealed southern bank. The later browser review has 130 checks / 37 captures, with zero errors.
