# The Fleck — implementation and review

Two new town screens extend north from North Mornay — Upper East, then east. Net Lane is 173/240 water; Water Steps is 180/240 water. Seven new rooms represent a tavern, main-floor hall, lower landing and four flats. Eleven new residents join the historic Mornay roster (311 total). See MORNAY_TOWN_PLAN.md for the complete roster and economy.

## Scope and geography

Only one existing grid cell changes: MORNAY_NORTH_UPPER_EAST_MAP, column 7 / row 0, WATER 1 → NORTH_EXIT 43. Exact delta is in grid-deltas.json. The remaining nine grids are new. Old Fort's adjacent water boundary remains closed; town gates and all pre-existing street connections remain. Boats are tethered scenery, not transport. No regional terrain, camera, quest or save-schema change. SAVE_VERSION 5.

The lower apartments show recurrent storm flooding through watermarks, puddles, tubs and residents' accounts. Floods and rent are not simulated. Names, rent and fishing balance are revisable. Existing tiles and procedural furnishing are reused; no new tile IDs, raster production assets or dependencies.

## Services and fishing

Brenna's Crooked Oar food counter: Smoked Lake Fish, 18g, restores 20 HP. Nerys's smoking-shed sales hatch: same fish plus 6g bait. Normal sale recovery is 9g for smoked fish. These are ordinary registered shops.

Fishing point: Water Steps (11.5,11.5), lowest landing. Existing rod plus one bait per accepted cast. Old/Fen/Waxwood rods require 10/9/8 prompts with 72/90/108-frame windows. Pike chances 42/54/66%; otherwise perch. Valmere Perch restores 24 HP and sells for 11g; Lake Pike restores 36 HP and sells for 19g. Drenwick's normal profile and special-letter rules are unchanged. Fleck catches never grant quest items. Wrong input, timeout and cancel yield no item. Active-cast save/load is refused; dismissed rewards persist normally.

## Verification evidence

- Suite 336 follows real movement controls through both new screens and back, including save/load, in continuous and Legacy Regional Fallback sessions. It exercises fishing through interaction/input (no rod, no bait, both rewards, wrong input, timeout, cancellation, duplicate resolution, all rod profiles), save refusal during a cast, ordinary catch persistence, and shop purchase/sale/insufficient funds without party/quest changes.
- Existing Mornay suites cover every resident and route on workdays/Dayoff, every room and district return path, all furniture/door walks, save/load, dialogue width, read-only rendering, gate round trips, services and inert story reservations. Historical item parity now includes all three new food/catch items; catalogue expectations increase only by the nine registered maps.
- validateGameData(): 1,263 maps, 508 NPCs, 154 item placements, 0 errors / 6 existing warnings. The warnings remain the notice-board property, Zolom attack value, generic Takomo sprite, reserved Mornay encounter pool and two older long dialogue pages.
- All 1,058 regional fingerprints match without regeneration. Transition audit regenerated through its established generator and subsequently matches read-only. It adds nine map/dimension records and eighteen fixed transitions. Existing fixed-transition records are unchanged. Counts: 479 fixed, 8 preserved-coordinate, 2,026 edge segments, 42 house doors. Six tile-use counts legitimately increase; no catch-up changes were found.
- First regression exposed thirteen stale map/item expectations and a test-isolation issue: the new fishing test left the harness’s shared Math.random override active, forcing the rare “23” encounter in the later Sunken Gallery test. Suite 336 now restores RNG in finally after each scenario, including failure paths; no combat code or Gallery assertion was edited. Final full regression result is recorded below.

## Browser evidence

A local isolated test fixture (`test/fleck-preview.html`) loads production scripts without loading the user's save. Its buttons place the party for review; subsequent arrows/Space/Enter use normal game controls. Browser actions walked North Upper East → Net Lane → Water Steps, approached the lower landing, launched fishing and observed timeout/return. A separate ordinary-control walk descended from the main hall and returned upstairs. Screenshots were visually inspected at native 512×480 and doubled 1024×960 scales. Browser error log was empty.

This is browser control/visual inspection, not a complete human playthrough. Successful fishing, shop payment and exhaustive room save/load are automated harness evidence. Screenshots include review-fixture controls outside the game canvas.

- water-steps-1x.png / water-steps-2x.png: hatch, baskets, irregular shoreline, two rowing boats, occupied upper step and lower casting place.
- net-lane-2x.png: tavern, tenement, nets and laundry.
- tavern-1x.png: counter, stove, patrons and tables.
- main-floor-1x.png: north entrance, two flats and descending stairs.
- lower-landing-1x.png / lower-room-1x.png: upward return, tubs, flood marks and damp accommodation.
- fishing-1x.png: ordinary casting UI with harder Fleck profile.

## Short playtest route

1. From North Mornay — Upper East, take the middle north street into Net Lane.
2. Visit the Crooked Oar on the left, speak to Brenna and buy smoked fish.
3. Enter Fleck House on the lower-right side; inspect rent card, both main-floor flats, descend at the right-hand stairs, visit both lower rooms, then return upstairs and outside.
4. Head east to Water Steps. Speak to Nerys beside the sales hatch; buy bait. Talk to Oswin above the lower steps.
5. With an existing rod, press Space at the lowest step. Try a failed and a successful cast, inspect/sell the catch, and save/load after dismissing the result.
6. Return west and south. Existing town gates should still work. Boats, Old Fort water gap and story berths remain unavailable.

## Files changed by this task

Production: Mornay map/room/NPC/interaction authorities, renderer, fishing profile, item and shop registries, active-fishing save guards; data.js comment corrected. Documentation: plan/status/architecture and this QA folder. Tests: new lifecycle/visual fixtures, exhaustive census/topology expectations and food parity. Only the transition audit artifact was regenerated.

The list below excludes untouched pre-existing pinky-promise preview work. Overlapping existing files are PROJECT_STATUS.md and architecture.md (appended documentation), and save.js (fishing guards before preserved preview guards).

- `Art/qa/mornay/fleck-v1/README.md`
- `Art/qa/mornay/fleck-v1/fishing-1x.png`
- `Art/qa/mornay/fleck-v1/grid-deltas.json`
- `Art/qa/mornay/fleck-v1/lower-landing-1x.png`
- `Art/qa/mornay/fleck-v1/lower-room-1x.png`
- `Art/qa/mornay/fleck-v1/main-floor-1x.png`
- `Art/qa/mornay/fleck-v1/net-lane-2x.png`
- `Art/qa/mornay/fleck-v1/tavern-1x.png`
- `Art/qa/mornay/fleck-v1/water-steps-1x.png`
- `Art/qa/mornay/fleck-v1/water-steps-2x.png`
- `MORNAY_TOWN_PLAN.md`
- `PROJECT_STATUS.md`
- `architecture.md`
- `content/interactions/mornay-interactions.js`
- `content/maps/mornay-maps.js`
- `content/npcs/mornay-npcs.js`
- `data.js`
- `fishing.js`
- `items.js`
- `render-mornay.js`
- `save.js`
- `shops.js`
- `test/cases/100-east-causeway.test.js`
- `test/cases/101-west-outfall-canal-tunnel.test.js`
- `test/cases/102-north-basin-drowned-rim.test.js`
- `test/cases/103-north-basin-mirewood.test.js`
- `test/cases/104-eastern-reaches-abandoned-farmhouse.test.js`
- `test/cases/155-formation-four-command-integration.test.js`
- `test/cases/171-party-command-status-hardening.test.js`
- `test/cases/201-travellers-rise-campsite.test.js`
- `test/cases/207-travellers-rise-campfire-night.test.js`
- `test/cases/215-eastern-fens-valmere-mornay-peninsula.test.js`
- `test/cases/218-mornay-exterior-topology.test.js`
- `test/cases/301-mornay-manifest.test.js`
- `test/cases/302-mornay-occupancy-routes.test.js`
- `test/cases/303-mornay-room-district-controls.test.js`
- `test/cases/309-mornay-compatibility.test.js`
- `test/cases/310-mornay-comparable-census.test.js`
- `test/cases/314-mornay-inert-facades-streets.test.js`
- `test/cases/321-mornay-office-tenement.test.js`
- `test/cases/336-mornay-fleck.test.js`
- `test/cases/58-regional-content-split.test.js`
- `test/cases/98-thornmere-upper-shallows-scenery.test.js`
- `test/cases/99-thornmere-canal-head.test.js`
- `test/fleck-preview.html`
- `test/fleck-preview.js`
- `test/transition-audit-output.json`

## Final result and Git state

**272/272 full regression suites pass** after RNG cleanup, including suite 336 followed by the untouched Gallery suite. All **46 changed/new JavaScript files** pass `node --check`. Validation is **0 errors / 6 existing warnings**; transition audit matches read-only; all 1,058 regional fingerprints match; `git diff --check` and conflict-marker review pass. No save version/payload change.

Branch remains **main**, starting and ending HEAD **4f45e8a608775cabaff6c25e25dd071b2f73eab4**, one commit ahead of origin/main. Work is unstaged and uncommitted; no branch switch, merge, push or commit. The shared checkout has 47 modified tracked files and 21 untracked files (68 file paths total), including preserved earlier animation work. This task changes 47 paths including documentation, tests and screenshots. All earlier file bytes are retained, allowing for the documented appended text and fishing guards. The temporary browser-review server was stopped.
