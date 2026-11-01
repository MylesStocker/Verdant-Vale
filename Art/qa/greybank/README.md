# MQ6 — Greybank Mill verification

Branch `main`, HEAD unchanged at `1519a92fbdd63b55241888c5917372a18351528d`.
Pre-existing MQ5 work is preserved. Everything is unstaged and uncommitted;
no merge, push or changes to another worktree.

## Automated checks

- Complete regression: **288/288 suites passed**, zero failures (baseline: 286).
- Suite 351: **8 lifecycle scenarios**, including both party-presence branches,
  all five fights' real shared-engine victories/escapes/defeats/retries, guarded
  progression, every reciprocal door in both regional modes, intermediate
  save/load, stale callbacks, receipts and the mandatory exact-return vision.
- Suite 352: exact reviewed regional delta/metadata reversal, early/post-ferry
  reachability, six connected room grids, safe doors, read-only marker rendering.
- **53** changed/new JavaScript files pass `node --check`, including preserved
  MQ5 files. Generator changes checked again after final atlas-label update.
- `validateGameData()`: **0 errors, 6 existing warnings**. 1,273 maps, 512 NPCs,
  1,059 regional chunks. No new warning.
- All **1,059** regional fingerprints match. Only the existing `(21,7)` grid's
  hash changes; no camera, terrain-property, structural seam or drainage edits.
- Read-only transition audit matches: **499** fixed-destination transitions,
  **8** preserved-coordinate transitions, **2,072** structural segments,
  **42** house doors. No hard seam conflicts or remaps.
- `git diff --check`, changed-file conflict-marker checks and state-writer review
  pass. **SAVE_VERSION remains 5**.

The initial full run exposed only obsolete map-count, NPC-fragment, handler-order
and binding-registry snapshots. Those now explicitly include six maps, four NPCs,
one bounded handler and four fields. Existing terrain, behavior and historical
combat assertions remain in place; strict older geography snapshots reverse
only the reviewed deltas on detached test data.

## Browser and visual evidence

`test/greybank-browser.html/js` runs in isolated headless Chromium at native
512×480 and doubled 1024×960. It uses actual keyboard events, real Canvas text
measurements and the production combat and inventory menu. The session starts
from the existing level-10 MQ5 checkpoint, with its normal stats/equipment and
inventory; RNG is fixed at 0.5. Travel to the world marker and back to Mornay uses
fixtures, while the complete mill route and all fights use ordinary controls.
This is automated browser evidence, **not a human gameplay playtest**.

**2,695 assertions, 30 captures, no browser errors.** Captures of the exterior,
confrontation, interiors, white vision and audience were inspected visually;
native and 2× presentations remain readable. Healing spends ordinary Elixirs.
The four required fights take **3, 3, 4, 7 rounds**; optional fight **4 rounds**.
Esla falls in the strongest encounter; Lély can finish the expedition. Broader
combat balance and subjective dialogue pacing remain human playtest judgments.

Representative captures:

- [Mill marker](mill-marker-1x.png), [riverside yard](yard-1x.png).
- [Brenna and two supporters](confrontation-1x.png), [2×](confrontation-2x.png).
- [Upper machinery and stairs](machinery-1x.png), [wheelhouse](wheelhouse-2x.png).
- [Relief-grain store](grain-store-1x.png), [white vision](vision-1x.png).
- [Final audience](final-audience-1x.png).

The updated MQ5 browser check also passes **575 assertions** to cover the existing accompanied
and Fine Needlework solo audiences followed by deliberately declining MQ6.
See `browser-results.json` for exact outcomes and `MQ6_GREYBANK_MILL.md` at the
repository root for the full dialogue, authorities, rewards and walkthrough.

## Artifacts

- `grid-deltas.json`: exactly one GRASS→INTERIOR_EXIT cell.
- `metadata-deltas.json`: 70 fields (68 river names plus approach name/note).
- `baseline.json`: starting committed HEAD and original chunk/edge hashes.
- Atlas generator: updated `OVERWORLD_ATLAS.md`, regional inventory and SVG.
  The linked production PNG is explicitly labelled as predating Greybank.
- Fingerprint generator: one changed grid hash.
- Transition generator: six additional maps and twelve point transitions.
- Browser captures/result summary and exact final Git status.

No unrelated terrain/artifact catch-up changes, image generation, new enemy art,
new terrain IDs, save version increase or persistent companion staging.
