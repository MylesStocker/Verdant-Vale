# Valmere wilderness shoreline — 2026-10-25

Scenery-only refinement in the existing primary working tree, on `main` at `59e7851156e2e4e8782748735d9f3c74e4189c6b`. No commit, staging, merge or push. Earlier uncommitted Mornay and Wetwoods/Thornmere work is preserved.

## Visible result

- The Great Fen’s former staircase/straight lake edge becomes wooded points and reed-lined bays. Its longest straight shoreline run decreases from 45 to 18 tiles.
- The wilderness spit west of Mornay gains a rounded northern tip and curved western bank, with gravel and occasional submerged rocks.
- The far eastern lake margin gains low headlands and coves. Valmere remains open water to the north and east.

[Before/after comparison](before-after.png) uses the production tile renderer on the immediately preceding Wetwoods/Thornmere state and the final live grids. [Full production atlas](../regional-geography/production-overview.png) shows the whole authored window. There are no new gameplay image assets.

## Exact scope and preservation

45 existing scenery grids / 4,321 tile cells change. [grid-deltas.json](grid-deltas.json) records every changed local coordinate and old/new tile ID relative to the working tree at the start of this increment. The other 1,013 regional grids, including all 477 placement-enabled grids, are identical. Chunk metadata, tile definitions, structural transitions, access permissions, encounters and camera bounds are unchanged. No new chunks, doors, NPCs, items, save fields, story hooks or tiles.

Mornay is excluded, including the entire regional buffer at columns 15–19 / rows −5…1. Hash comparison confirms all previously dirty files with Mornay-specific names are unchanged; all other prior production edits are also preserved. No Mornay interior/exterior or shore/harbour tile changes. The western channel remains connected around the wilderness spit. Scenery land remains invalid for both ordinary and debug placement; submerged trees and rocks remain impassable. SAVE_VERSION is 5.

## Incremental files

Production grids only:

- `content/maps/great-fen-maps.js`: six scenery grids.
- `content/maps/valmere-expanse-maps.js`: eight scenery grids.
- `content/maps/mainland-maps.js`: 31 scenery grids; earlier Wetwoods/Thornmere edits retained.

Tests and tools:

- `test/cases/323-valmere-shoreline.test.js`: protected-grid/metadata invariants, both-mode atomic placement rejection, coastline variation and connected impassable water.
- `test/fixtures/valmere-shore-invariants.json`: independent pre-pass hashes, with the explicitly authorized scenery IDs excluded from the protected-grid hash.
- `test/regional-geography-browser.js`: four additional native/2× scenic render pairs; prior controls/camera/save checks retained.
- `test/regional-atlas.js`: generated atlas description of this refinement.
- `test/fixtures/regional-grid-fingerprints.js`: exactly 45 changed hashes, generated through `node test/regional-atlas.js --fingerprints`.

Documentation/generated evidence:

- `REGIONAL_GEOGRAPHY_PLAN.md`, `PROJECT_STATUS.md`: appended scope and preservation record.
- `OVERWORLD_ATLAS.md`, `Art/qa/regional-geography/inventory.json`, `overview.svg`: regenerated using `node test/regional-atlas.js --write`.
- `Art/qa/regional-geography/production-overview.png`: refreshed by the browser’s production tile painter.
- This folder: exact deltas, comparison, eight detail PNGs, browser result and verification record.

The transition artifact is **not** regenerated: `node test/transition-audit.js` confirms its existing contents still match. Earlier Mornay and Wetwoods artifact changes remain separate, already present changes.

## Verification

Full regression: **259/259 suites passed**, zero failures (`node test/run.js`).

Focused suites 317, 318, 320, 322 and 323 pass: tile-level progression/return routes, every walkable tile’s camera samples, original early camera clamps and southern water closure, earlier Wetwoods/Thornmere invariants, and new shoreline safety. All 55 changed/new JavaScript files across the current dirty worktree pass `node --check`. Validation reports zero errors and six pre-existing warnings. All 1,058 fingerprints match. Transition audit: 1,244 maps, 442 fixed destinations, eight preserved-coordinate transitions, 2,026 structural segments and 1,946 continuous-eligible entries; tracked artifact matches. `git diff --check` and targeted conflict-marker checks pass.

Browser: **163 automated checks / 57 captures / zero errors**. This includes held-key negative/zero seam crossings and river crossings in both movement modes, save/load, original camera clamps, sealed Thornmere exit, and earlier-town views. Added scenery renders use the real tile painter at canonical coordinates and prove that rendering leaves gameplay placement unchanged. Native 512×480 and 2× 1024×960 shoreline captures and the overview were visually inspected. These are automated browser/input checks and read-only scenery views, **not a human walking playthrough through inaccessible areas**.

The six existing validation warnings concern the decorative notice board, Fen Zolom’s high attack, Takomo’s generic sprite, an unused legacy Eastern Fens pool, and two older long dialogue pages. This terrain pass does not change them.

## Short visual walkthrough

1. Open the before/after comparison and inspect the western fen margin, spit and far eastern coast; confirm that Mornay’s peninsula/harbour match exactly.
2. Inspect `valmere-fen-bank-1x.png` and `-2x.png`: scenery chunk (10,−11), curved reeds and wet woodland.
3. Inspect `valmere-western-cove-1x.png` / `-2x.png` at (12,−4), and `valmere-spit-tip-1x.png` / `-2x.png` at (13,−7). These are inaccessible cartographic views, not warp destinations.
4. Inspect `valmere-eastern-headland-1x.png` / `-2x.png` at (27,−2); compare with the accessible coast near (24,0) in ordinary gameplay.
5. In game, revisit the existing Valmere reveal/shore route and Mornay approaches. Confirm familiar paths and entrances, then check Northern Road’s west camera clamp and Thornmere Fen’s blocked southern edge.
