# Mornay Population and Services MVP Plan


## South Mornay Watchhouse and Jail — current addition

The public watchhouse occupies the lower-east civic frontage of **South Mornay — Upper East**, immediately north of the East Gate. Enter southward at **(12,10)**; return to **(12,9)** facing up. Its ordinary registered interior, `MORNAY_WATCHHOUSE_MAP` / `mornay_watchhouse`, receives the party at **(7.5,1.5)** facing down and exits through its northern door. No town street, gate, regional grid or camera policy changes.

The accessible booking room has a duty desk, notices, patched waiting benches, records cupboard, confiscated-property chest and a cramped guardroom. A bolted iron screen shows the rear: two four-bed communal cells, two individual cells, a central staff corridor and a separately gated exercise/delivery yard with a privy. **Ten beds** are represented. The rear is deliberately inaccessible; its visible gates are solid fixtures, with no door transitions, unlock flags, prison inventories, prisoner conversations, payments or quests. Existing damp masonry, beds, cupboards, tables and crate artwork is reused, with narrow procedural iron-screen and privy fixtures. No tile IDs or raster assets are added.

Hadrin Moss moves from Old Fort to booking duty. His suggested unofficial consideration is flavour only; his existing MQ5 refusal is retained. Anric Fell moves from West Gate to custody duty and refuses payment for recording arrests. Vannic Nair staffs the guardroom on workdays and retains his old Wold's Inn position and dialogue on Dayoff. All three stable identities remain; the **300-resident roster is now 93 exterior / 207 interior on workdays, 87 / 213 on Dayoff**. The separately registered Fine Needlework characters are not included in that historic resident benchmark.

Mornay now has **17 exterior maps and 68 interior maps in 24 establishments**. One former closed three-unit residential frontage is repurposed: **41 accessible self-contained dwellings, 17 implied dwellings behind 11 closed frontages, and four boarding rooms** remain. Old Fort's stable `mornay_watch_cells` notice now identifies its disused lockup and redirects public custody enquiries south; Old Fort plot access remains reserved. Names and flavour are revisable content.

Only one previously existing grid cell changes: `MORNAY_SOUTH_UPPER_EAST_MAP` **column 12, row 10**, `TOWN_BUILDING` (13) → `HOUSE_DOOR` (34). The added interior is 16 × 15. SAVE_VERSION remains **5**, with no new mutable state, loot or encounters. New suite **327** walks from East Gate, enters the booking room, reaches every staff/notice interaction, pushes against the security screen, saves/loads, walks out and exits town in both movement modes on workday and Dayoff. Existing room, population, service, render-depth and gate suites continue to apply. The transition audit is regenerated solely for the additional room and its two transitions; regional fingerprints are unchanged.

Walkthrough: enter East Gate and walk north one district. Enter the lower-right **WATCHHOUSE / JAIL** door. Speak to Hadrin at the desk and Anric beside the screen; visit Vannic in the small guardroom on a workday. Read the public notices, inspect the locked property chest and custody screen, save/load, and leave through the northern door. Confirm the four cells and yard stay inaccessible. Revisit Wold's Inn on Dayoff for Vannic. No MQ5 progress or payments should occur.


### Watchhouse verification

Final complete regression: **263/263 suites pass**. The first run exposed one stale suite-307 expectation that every room saved at the southern arrival; its expectation now follows the authored entrance direction. All existing invalid-context/atomic-load assertions remain. The complete suite was rerun after the correction.

All **48 changed or untracked JavaScript files** (including preserved earlier work) pass `node --check`. `validateGameData()` reports **1245 maps, 0 errors and 6 unchanged warnings**. All **1058 regional grid fingerprints** match without regeneration. The regenerated transition audit passes, then matches under read-only verification: **444 fixed transitions, 8 preserved-coordinate transitions, 2026 edge segments and 42 house doors**. Its diff adds only the watchhouse registry/dimensions, entry/exit records and increased INTERIOR_EXIT usage; there are no catch-up artifact changes. `git diff --check` and targeted conflict/stale-reference searches pass. SAVE_VERSION is still **5**.

Automated headless Chromium checks pass at **512×480 and 1024×960** using ordinary keyboard events after checkpoint placement at East Gate: walk north, approach the new door, enter southward, talk at booking, inspect notices and cells, push into the locked screen, save/load, leave north and return to East Gate. Eight screenshots were captured and the street, complete cutaway, booking dialogue and locked rear were visually inspected. All **17 pages** of new/revised staff and notice text fit measured Canvas glyph bounds. This is automated browser testing plus screenshot inspection, not a human playthrough. The manual walkthrough above remains the playtest checklist.

Changes remain **unstaged and uncommitted on main**, starting and ending at `d2861931401ccb6256137ae76646610cecb48084`. Earlier Fine Needlework/Buddy work is preserved. No Git branch changes, commits, merges or pushes were performed.

### Watchhouse file inventory

The following 25 files are changed by this addition. Other existing dirty files belong to earlier work and are preserved. Of these, `PROJECT_STATUS.md`, `architecture.md`, `render-mornay.js` and suite 58 already contained earlier edits; this pass adds only the watchhouse changes or catalogue-total adjustment. The global-total tests move from 1244 to 1245 without changing regional assertions.

- `MORNAY_TOWN_PLAN.md`
- `PROJECT_STATUS.md`
- `architecture.md`
- `content/maps/mornay-maps.js`
- `content/npcs/mornay-npcs.js`
- `content/interactions/mornay-interactions.js`
- `render-mornay.js`
- `test/cases/327-mornay-watchhouse.test.js`
- `test/cases/301-mornay-manifest.test.js`
- `test/cases/302-mornay-occupancy-routes.test.js`
- `test/cases/303-mornay-room-district-controls.test.js`
- `test/cases/307-mornay-persistence-atomicity.test.js`
- `test/cases/309-mornay-compatibility.test.js`
- `test/cases/58-regional-content-split.test.js`
- `test/cases/98-thornmere-upper-shallows-scenery.test.js`
- `test/cases/99-thornmere-canal-head.test.js`
- `test/cases/100-east-causeway.test.js`
- `test/cases/101-west-outfall-canal-tunnel.test.js`
- `test/cases/102-north-basin-drowned-rim.test.js`
- `test/cases/103-north-basin-mirewood.test.js`
- `test/cases/104-eastern-reaches-abandoned-farmhouse.test.js`
- `test/cases/201-travellers-rise-campsite.test.js`
- `test/cases/207-travellers-rise-campfire-night.test.js`
- `test/cases/218-mornay-exterior-topology.test.js`
- `test/transition-audit-output.json`

## Design and authority

Mornay is a cold, busy, primarily blue-collar freshwater port and county-seat-equivalent town of approximately 8,000 people on Valmere. Seventeen existing exterior maps retain their topology, paired southern gates, shore boundaries and reserved berths. Dense work yards and commercial streets contrast with ordinary southern services and quieter, better-kept northern institutions. There is no aetherrail, capital-city scale or universal hostility.

The prompt, LORE.md, physical maps/runtime registries, architecture.md and PROJECT_STATUS.md govern this plan, in that order. Names, prices and flavour dialogue below are revisable authored content, not immutable metaphysical canon. Cold, stormy water and shallow working shores are represented without resolving the previously deferred depth of the entire Valmere basin.

## Current pass — blocked Regional Office and South Rows

This pass supersedes the earlier reservation against enterable Reclaimer rooms **only for the new South Rows attic**. Other locked stairs, the island ferry, story berth, hydrographic office and Old Fort interiors remain reserved. MQ5 remains at 5. Per the user's follow-up, bureaucratic errands are repeatable conversations, not tracked side quests: no new inventory, payments, completion receipts, saved flags, reputation, or report handover. Future resolution is deliberately undefined.

### Bureaucratic errand ledger

| Person / place | What is requested or refused | Current outcome |
|---|---|---|
| Magistrate Marit Voss / Regional IJC | Superior to the Calwick Supervisor; demands a local jurisdiction certificate before allocating investigators | No assistance; refuses to write a formal refusal |
| Inessa / reception | Sends party to Maura, then Halden | Report stays with party |
| Maura / Harbour Public Room | Refuses to accept local responsibility for dead/missing Imperial staff | Sends party back to Magistrate |
| Halden / Records | Requires Maura's certificate plus Messa's certified copy | Will not accept report |
| Messa / copy desk | Can certify only an already accepted report | Sends party back to Records |
| Eldric / requisitions | Demands harbour freight tariff before estimating an investigation | No search party or travel warrant |
| Bera / payments | Promotes Magistrate's cousin's private expediting charge | Dialogue only; no gold is deducted or payment offered |
| Corven and Nerin / investigators | Defer to local watch, medical return, or Garrick reporting himself | No investigation starts |
| Hadrin / town watch; Dalen / harbour inspection | Call the basin and Imperial staff an Imperial responsibility | Redirect to Regional Office |
| Novra, Lenva, Vessa / administration | Hide behind staffing classification, appointments and complaint procedure | No useful assistance |

Fourteen existing NPCs receive report-specific lines at MQ5. Marit becomes the Regional Magistrate; Corven and Nerin become regional investigators. Earlier/debug visits do not disclose Dreyfuss's death or Garrick's disappearance. Six new companion exchanges plus Inessa's revised exchange show Esla's anger with existing green speaker metadata. All eleven Mornay companion conversations retain ordinary speaker ownership. Repeated visits change no persistent state.

### Tenement inventory and weekday occupancy

South Rows, entered southward at South Upper East **(3,10)**, now has **three residential floors, eight accessible units per floor, 24 units total**, plus an attic. Floor 1 retains the original entrance and four small flats (stable IDs, geometry and historical save positions). Twenty additional tiny one-room flats provide beds, a small stove, storage and table; each new flat's living area is five by five tiles, plus its entrance stem. Two shared landings and one attic add **23 maps**, bringing Mornay to **67 interiors + 17 exteriors**. No exterior grid or town connection changes.

| Floor | Units occupied on workdays | Units empty on workdays, occupied on Dayoff | Circulation |
|---|---|---|---|
| Ground | 1–4: existing households | 5–8: Fennel, Salwen, Rulon, Heba | Upper doors 1–4; lower doors 5–8; stairs right |
| Second | 9–12: Davi, Belli, Melli, Dorrie keeping house | 13–16: Maelin, Verda, Nerrin, Harnis | Eight numbered doors; stairs right |
| Third | 17–20: Osric, Lotte, Ysol, Brissa | 21–24: Elsven, Jessin, Vela, Neven | Eight numbered doors; concealed ceiling hatch left |

Eight existing residents move into units; twelve workers use the existing five-day calendar to return home on Dayoff. No new NPC identities: **300 total**, workday **95 exterior / 205 interior**, versus the prior 101/199. Four children do washing, cooking, childcare or mending instead of attending school; no rareborn identities or relatives are added. Dorrie's school seat is now empty. Kessa keeps the common landing. These changes do not imply all working-class residents support the Reclaimers.

The hatch is at third-floor **(1,6)**, approached from **(1,7)**. A loose ceiling seam, hanging cord, scuffed floor and inspectable clue conceal an ordinary reciprocal room connection. Step beneath it to enter; leave by the attic's southern ladder. It uses no discovery/key flag and survives save/load. The door is not labelled as a faction headquarters.

The empty attic contains bedding, food and bandages, printing materials, relabelled freight and guarded meeting instructions. A sheet identifies the Reclaimers; disagreement about blocking shipments versus endangering sleeping workers shows both clandestine methods and internal limits. No NPC confesses, names are omitted, and the material does not explain either Dreyfuss or Garrick. The existing nine author-only network ties and three confirmed members remain unchanged; the attic is evidence of a hideaway, not a quest or an allegiance choice.

### Exact existing-grid delta

Only `MORNAY_SOUTH_ROWS_MAP` changes: **eight cells**. Coordinates are zero-based; 18=floor, 33=solid furniture, 34=ordinary door.

| Col,row | Before → after | Reason |
|---|---|---|
| 14,6 | 18 → 34 | New unit door or staircase |
| 13,7 | 33 → 18 | Shared landing furniture relocation |
| 1,8 | 18 → 33 | Shared landing furniture relocation |
| 3,9 | 33 → 18 | Shared landing furniture relocation |
| 2,10 | 18 → 34 | New unit door or staircase |
| 5,10 | 18 → 34 | New unit door or staircase |
| 10,10 | 18 → 34 | New unit door or staircase |
| 13,10 | 18 → 34 | New unit door or staircase |

All other pre-existing grids, including all 944 regional chunks, are byte-identical to the starting HEAD. SAVE_VERSION remains 5. Names, administrative demands and flavour remain revisable content. Future MQ5 resolution, any tracked fetch quests, recruitment/investigation, and the attic's individual users remain deferred.

### Verification and walkthrough for this pass

Final complete regression: **257/257 suites pass**. All **21 changed/new JavaScript files** pass `node --check`; `validateGameData()` reports **0 errors / 6 unchanged warnings**, **1130 maps / 944 regional chunks**. The existing regional fingerprint suites pass without regenerated fingerprints. Both gate controllers, all 67 furnished room journeys in both movement modes on workday/Dayoff, all 300 resident conversations, services, historical combat and save/load remain covered. New suite 321 verifies per-floor occupancy, report-specific refusals, repeatability/state isolation, child household placements and attic save escape. The manifest allows only the two new landings and empty attic to have no scheduled resident.

Automated Chromium at **512×480 and 1024×960**: **10,665 checks**, **252 captures**, **0 errors**. Coverage includes every room door and save/load, the unbroken street–three floors–attic–street journey, actual input inspection of all attic evidence, Dayoff occupancy, both gates, shops, both inns, treatment, real-font text fitting and Esla's green dialogue. Representative screenshots were visually inspected. This is automated browser evidence, not a human playthrough.

Only `test/transition-audit-output.json` was regenerated through its established generator, then verified read-only. Fixed transitions rise **396 → 442** for the 23 rooms; registry/dimension rows rise **1107 → 1130**. Two tile-usage entries change. One existing escape record legitimately gains a clear left step: the laundry return, after Ysol moves home. Other pre-existing transition records are identical. There are no catch-up geographic changes. Catalogue-only assertions in earlier regional tests were updated to 1130 without weakening terrain/seam checks. `git diff --check` and conflict/stale-terminology checks pass.

For human playtesting:

1. At MQ5, enter Regional IJC (Middle Upper Central East, door 3,5). Speak to Magistrate Marit, Inessa, Halden, Messa, Bera and the two investigators; confirm Esla's anger and the refusal loop.
2. Visit Maura and Dalen in Harbour/Customs (North Lower West, door 11,5), then Hadrin at the South Upper East watchhouse. Return to the IJC: there is still no report handover or MQ5 advancement.
3. Enter South Rows from South Upper East (3,10). Explore eight doors per floor; stairs are at the right. Four homes on each floor are empty on a workday. Stay at an inn into Dayoff and revisit the occupied homes.
4. Speak with the children in units 9–12. On the third landing inspect the draught at (1,6), then step beneath the cord. Read the three attic evidence clusters, save/load, and descend all the way to the street.
5. Confirm both town gates, ordinary shops and the infirmary still work; the other story berths, closed stair, Collegium and hydrographic office remain reserved.

This pass is left unstaged and uncommitted on `main` at starting HEAD `59e7851156e2e4e8782748735d9f3c74e4189c6b`. Nothing is pushed or applied to another worktree. Two pre-existing untracked B3 atlas exports are untouched.

## Benchmark and target

Drenwick has 99 distinct, non-party humanoid characters available through ordinary gameplay: 9 across six exterior maps and 92 across interiors, with Renn and Veran appearing in both sets (9 + 92 - 2 = 99). The earlier 101 included the position-only travelling vendor and the party/cutscene projection of Esla. Scheduled placements, aliases, repeat placements and combat copies are deduplicated; cats, enemies, debug fixtures, bridge guards outside town and Tarvec approach content are excluded. The three infirmary staff/patient characters encountered during the ordinary MQ4 wake sequence remain included.

This is a comparable town-character count, not a claim that all 99 are permanent residents: eight are explicitly visitors, and domicile is not established for every remaining character. Drenwick comprises six exteriors and 49 logical interiors (12 public rooms, six corridors, 31 residences; some share map grids). The runtime NPC registry, house records and ordinary reachability are the authority, rather than raw placements or sprite counts.

Mornay target: **300 distinct non-party speaking humanoids**, comprising **93 exterior and 207 interior characters on workdays** across **17 exterior maps and 68 rooms in 24 establishments**. Ratio: **300 / 99 = 3.0303**. No schedule clones, duplicate placements, party copies, animals or debug fixtures inflate this total. Twelve exterior characters have deterministic patrols; the others have stationary activity poses; Maris Glyn and Ferin Wold attend school on workdays and return home on Dayoff. All 300 speak, so moving/ambient and speaking totals overlap.

## Main integration — 2026-10-23

The user authorized bringing the recent work onto `main`. This combines Mornay checkpoint `f4c9f5486e7221f2acd378dc95506a750bfe5bdd` with main’s existing Eastern Fens expansion at `472233cc7a66de0f38267e0b5ab54c501e41aee1`. The combined runtime contains **407 maps**, including **244 regional chunks** and **44 Mornay interiors**. Regional grids, fingerprints, encounter content and the expanded seam definitions are preserved from main; Mornay content and entrance behavior are preserved from its checkpoint. SAVE_VERSION remains 5.

Twelve overlapping test expectations are reconciled to 407 total maps while retaining the expansion’s regional totals and warning baseline. Main already used prefix 315 for the Great Fen test, so the incoming Mornay shop-home suite is renamed to `316-mornay-shop-homes-orientation.test.js`, with byte-identical contents. References below to suite 315 and branch-only totals describe the original Mornay checkpoint. The existing QA captures likewise remain evidence of that checkpoint rather than a new manual playtest. Only the transition artifact is regenerated for the combined authorities; no regional fingerprint or image is regenerated.

Combined-main verification: **236/236 regression suites passed**. `validateGameData()` reports **zero errors and the same 14 warnings already documented on main**; the two Fen Zolom warnings belong to the earlier expansion. All changed/new JavaScript passes syntax checks. The transition audit passes **407 maps, 396 fixed destinations, eight preserved-coordinate routes and 380 edge segments**; the regenerated artifact matches read-only verification, and every non-Mornay transition/seam record is unchanged. Automated Chromium passes **7,119 checks at native and 2× scale**, with zero browser errors. No new screenshots or fingerprint artifacts were written. Both test-number uniqueness and `git diff --check` pass. The user-authorized merge is local; nothing is pushed, and the Mornay source branch remains at its original checkpoint.

## Entrance orientation and shopkeeper homes

This follow-up starts from `ab084c686e8dc14a9b375aa004ea88b97e961c6a`. Eight buildings entered while walking south now have their interior entrance at the north edge, matching the physical approach. `mornayInteriorEntrance()` derives the interior side from the registered source door and return cell; grid generation and arrival dispatch share it. Their arrival is **(240,48), facing down**, and their exit tile is **(7,0)**. Other rooms keep arrival **(240,432), facing up**, exit **(7,14)**. Source door/return coordinates and both overworld gate contracts are unchanged.

| Corrected room | Source street | Door tile | Street return tile / facing |
|---|---|---|---|
| Hume Boardinghouse | South Upper West | 3,10 | 3,9 up |
| East Ward Shared Court | Middle Lower East | 3,9 | 3,8 up |
| Reed’s Net Room | Middle Upper East | 3,9 | 3,8 up |
| Pate’s Kitchen | South Upper West | 12,10 | 12,9 up |
| Vale House | North Upper West | 11,8 | 11,7 up |
| Examiner’s House | North Upper East | 3,8 | 3,7 up |
| Dock Steps Tenement | Middle Upper West | 3,9 | 3,8 up |
| South Rows Apartments | South Upper East | 3,10 | 3,9 up |

**Three of four operational shops now have accessible family homes upstairs.** Kelm Provisions, Stern Apothecary and Sorn Work Gear each have visible wooden stairs at (7,1), with downstairs return (7,2), facing down. Their upper rooms use the established parent/child room registry and ordinary transition tiles; `connection: 'stairs'` changes presentation only. Upstairs arrival is (240,432), facing up, and the descending stair is (7,14). No new tile ID, persistent authority or service closure is introduced. Venn Chandlery remains a shop and storehouse without an accessible home.

| Home | Keeper downstairs | Existing upstairs residents | Domestic character |
|---|---|---|---|
| Kelm Family Rooms | Neris Kelm | Adra Kelm, his sister and assistant | Two beds, dresser, household pantry, stove and supper table |
| Stern Family Rooms | Melva Stern | Ilda Stern, her visiting sister | Two beds, dresser, reading desk/cabinet, stove and small dining table |
| Sorn Family Rooms | Hesta Sorn | Henric Sorn, her brother; Berren Sorn, visiting nephew | Three beds, repairs bench, kitchen and family table |

All 300 identities remain. Adra, Henric and Ilda move from the streets; Berren visits his aunt from Shared Court Flat 1, where Selda remains. At that shop-home checkpoint the split was 101 exterior / 199 interior, with 54 seated primary placements; the current tenement split is recorded above. Four short household lines establish those relationships; names and relationships remain revisable local flavour. No rareborn person or rareborn relative is added. Keepers, stock, prices, inns, treatment, schedules, patrols, Reclaimer ties and story reservations retain their established behavior.

Existing saves in the eight reoriented rooms at the former southern arrival remain valid: their floor stem is retained and connects through the furnished room to the new north exit. SAVE_VERSION stays 5. No old walkable non-transition cell is removed, no exterior grid changes, and none of the 115 regional fingerprints require regeneration.

Read-only reviews reused `mornay_layout_review` (Sol Medium) and `mornay_refinement_correctness` (Sol High). Accepted the three-shop family mix, permanently available keepers and explicit stair presentation. The correctness reviewer independently passed 16 old-save/input-exit journeys and the shop-controller suite; neither final reviewer found a concrete defect. The optional suggestion to put surnames on the stair signs is deferred: the existing HUD titles and household dialogue already identify ownership. `mornay_refinement_tests` (Sol High) exclusively wrote suite 315 while the root paused all edits. Its complete diff was accepted after review: actual walking, historical save coordinates, reachable conversations, stair art tied to traversable connections and single purchases provide behavioral coverage. No nested delegation was used.

### Exact existing-grid changes in this follow-up

Coordinates below are zero-based. `INTERIOR_WALL=19`, `INTERIOR_FLOOR=18`, `INTERIOR_EXIT=20`, `HOUSE_DOOR=34`. These are **73 changed cells across 11 existing interior grids**, plus three newly registered 15×16 home grids. All other existing grids are byte-equivalent to the starting checkpoint.

- Provisioner, Apothecary and Work Gear: (7,1), WALL → HOUSE_DOOR, rendered as an ascending wooden stair.
- Each of the eight corrected rooms: (7,0), WALL → EXIT; (7,14), EXIT → WALL.
- Boardinghouse: columns 7–8, rows 1–3, WALL → FLOOR.
- Shared Court, Reed’s, Pate’s, Dock Steps and South Rows: columns 7–8, rows 1–4, WALL → FLOOR.
- Vale’s and Examiner’s houses: columns 7–8, rows 1–2, WALL → FLOOR.

### Walkthrough for this follow-up

Enter Hume Boardinghouse in South Upper West by walking south and verify that the party arrives below the top door. Walk through Shared Court to a flat and back, then leave north. Visit Kelm Provisions in Middle Upper Central West, Stern Apothecary in South Upper East and Sorn Work Gear in Middle Lower Central West: follow HOME UP, speak with the family, save/load, descend, purchase and leave. Check both town gates normally. The representative screenshots below were captured by automated Chromium, not a human playthrough.

### Changed authorities and verification evidence

- `content/maps/mornay-maps.js`: three household records/fixture plans and shared entrance orientation; `world-transitions.js`: consume that arrival contract.
- `content/npcs/mornay-npcs.js`: four existing placements and household lines; `render-mornay.js`: read-only wooden stair presentation using existing floor art and colours.
- `test/cases/303-mornay-room-district-controls.test.js`
- `test/cases/307-mornay-persistence-atomicity.test.js` and `311-mornay-furnished-door-walks.test.js`: correct directional expectations while retaining actual held-control journeys. New suite `315-mornay-shop-homes-orientation.test.js`: historical save positions, full upstairs/service journeys and purchase continuity. Suites 301/309 reflect the three rooms and resident redistribution; suites 58/98–104/201/207/218 only update legitimate catalogue totals. No assertion accepts both old and new behavior.
- `test/browser-smoke.js`: assert arrival side/facing and leave through the corresponding edge. `PROJECT_STATUS.md`, `architecture.md` and this plan record the new authority and housing inventory.
- `test/transition-audit-output.json` is the only regenerated geographic artifact, via `node test/transition-audit.js --write`, then independently verified read-only. Catalogue 275 → 278; fixed transitions 390 → 396. Only registry IDs, dimensions, Mornay transition records and tile usage change. Eight entry destinations move north; Sorn’s existing street return also gains an unobstructed leftward step after Adra moves upstairs. All existing exit coordinates stay unchanged. Every non-Mornay fixed-transition record remains byte-equivalent; there are no catch-up changes or fingerprint edits.

Final verification for this follow-up: **234/234 regression suites passed**, including singleton/Formation/party-command/Resonance compatibility, old-town behavior, all Mornay routes, services, story isolation and regional fingerprints. All 21 changed/new JavaScript files pass `node --check`. `validateGameData()` reports **278 maps, 481 registry NPCs, zero errors and the same 12 existing warnings**. Transition audit: **396 fixed destinations, eight preserved-coordinate routes and 240 edge segments**, all passing; generated artifact matches read-only verification. The old regional grids and 115 fingerprints are unchanged, and SAVE_VERSION remains **5**.

Suite 311 walks all 44 furnished room journeys on both workday/Dayoff in both presentation settings (176 journeys). New suite 315 adds 32 historical-southern-arrival save/load escapes, 12 complete shop/home/service walks, 16 reachable household conversations and 12 exact single purchases with reload continuity. The input-level gate suite, both inns, treatment, routes, first-name labels, Esla styling and inert Reclaimer/story reservations all pass. Roster comparison matches all 300 plan lines; ID, conflict-marker, stale-count/terminology and `git diff --check` checks pass. Other worktrees, including unrelated dirty work, are left untouched. This checkpoint is local to `agent/mornay-population`; nothing is merged or pushed.

Automated Chromium passed **7,119 checks**, produced 172 captures and reported zero browser errors at native and 2× size. The root inspected representative rooms, north entrances and stairs at both scales. Ten selected captures and source/capture SHA-256 values are retained in [the QA manifest](Art/qa/mornay/shop-homes-v1/manifest.json). Examples: [Kelm stairs](Art/qa/mornay/shop-homes-v1/mornay_provisioner-1x.png), [Kelm home](Art/qa/mornay/shop-homes-v1/mornay_kelm_home-1x.png), [Stern home](Art/qa/mornay/shop-homes-v1/mornay_stern_home-2x.png), [Sorn home](Art/qa/mornay/shop-homes-v1/mornay_sorn_home-2x.png), [Shared Court north entrance](Art/qa/mornay/shop-homes-v1/mornay_court-1x.png). These are new QA captures, not replacement game artwork. Human playtesting remains the short route above.

## Lore-based dialogue refinement

214 of the 300 residents now have revised ambient dialogue, grounded in the existing `LORE.md` rather than additional worldbuilding. The roster below contains the current lines. Local relationships, opinions and anecdotes remain revisable flavour, not additions to immutable canon.

- **Work and travel:** Thornmere drought and lighter scow loads; the raised fen road and temporary cable scow; Drynport trade; bulk water freight versus expensive aetherrail; Kethrin credit and ordinary gold payments.
- **Education and administration:** the Education Act / Instruction to Twelve Act; optional public-school enrolment; the cost of preparation and waiting for a civil-service vacancy; the fee-paying Civic Collegium; Mera Dren's successful petition and the help omitted from official retellings.
- **Ordinary life:** the five-day week and unequal access to Dayoff; river wrestling; Erik Jontek's popular dance tune; honey and costly northern sugar; mushroom wine; repair work, shared meals, nursing, household care and fen burial customs.
- **The wider world:** letters, freight, prints and hopes of travel reference Lumina, Halcyra, Stonehaven, Bethany's Skybloom and Fort Ariel. Residents do not acquire privileged knowledge of the central crisis, the cutaway protagonists or reserved story content.
- **Rareborn scarcity:** no new rareborn NPC, rareborn relative, inherited ability or local magical service is introduced. Elrin Vey remains the sole explicitly identified rareborn resident in the authored roster. Ordinary medicine, manual work and commonborn lives carry the dialogue; the one counterfeited-Bracelet reference does not create shop stock or an interaction.

All 300 identities, first-name dialogue labels, positions, schedules, service behavior, five Esla exchanges and nine authored Reclaimer ties are preserved. This pass changes dialogue text and this plan only; graphics, room layouts, topology and SAVE_VERSION 5 remain unchanged.

Verification for this dialogue pass: all 233 regression suites passed; focused suites 301/308, JavaScript syntax, `validateGameData()` and `git diff --check` passed. Validation retains 0 errors and the 12 existing warnings. After the final wording corrections, controller checks exercised all three corrected conversations and confirmed no persistent-state mutation. Automated headless Chrome passed 6,731 checks at 512×480 and 1024×960, including 586 text-fit checks across the 293 non-service residents and zero browser errors. The run produced 166 transient captures; no tracked visual or geographic artifact was regenerated. A structural comparison against the starting commit proves that only 214 `text` fields changed in the NPC authority, and all 300 plan entries match runtime content.

The existing `mornay_layout_review` agent was reused for a read-only lore/coherence review. Accepted its factual correction from “after Dayoff” to “over Dayoff”; also accepted its small optional clarifications about Vessa Fallow's downstairs shared stove and Corvinna Dale's rail journey occurring earlier in her travels. The reviewer found no added rareborn or rareborn relatives, no private/future-story disclosures and no further evidence-backed lore defects. No new research agents, production writers or visual changes were needed.

Human editorial spot-check: speak with Vessa Auld outside the Regional Office, Benna Lark by the Collegium, Melva at the apothecary, the ward-school pupils, and Belric in Hume Boarding House room 3. Judge conversational rhythm and how much local knowledge feels natural; automated browser verification is not a manual playthrough.

## Residential refinement

This pass builds domestic life into the existing port. It preserves the 300 identities, all services, seventeen exterior connections, two gates and inert story reservations. The starting checkpoint is `6f065af3db3c1286712f65df71ab182f2a16b803`. The earlier complete baseline at that exact tree passed 229/229 suites. This refinement is local to `agent/mornay-population`; no other worktree receives it.

The source audit confirms Calwick has seven houses and one four-unit apartment entrance (11 dwellings). Drenwick has seven houses and six four-unit entrances (31 dwellings); the six apartment entrances occupy three paired exterior structures. `npcs.js` owns `HOUSE_DOORS` / `HOUSE_DATA`, `maps.js` the shared old-town grids, and `world-transitions.js` their house context. Mornay extends its existing `MORNAY_BUILDINGS` parent/child registry instead of mixing in that older house context.

### Housing inventory

| Building | District / street door | Accessible dwellings | Character |
|---|---|---:|---|
| Glyn Household | Middle Lower Central East (3,5) | 1 | Dockworker's household; Maris attends school on workdays |
| Reed’s Net Room | Middle Upper East (3,9) | 1 | Modest home and seated net-making workroom |
| Pate’s Kitchen | South Upper West (12,10) | 1 | Ordinary kitchen, older resident and visitors |
| Rann Workroom House | Middle Lower Central West (12,5) | 1 | Seamwork and apprentice's shared domestic space |
| Vale House | North Upper West (11,8) | 1 | Comfortable merchant household, dining and accounts |
| Examiner’s House | North Upper East (3,8) | 1 | Comfortable household with reading and writing furniture |
| East Ward Shared Court | Middle Lower East (3,9) | 4 | Four modest flats, shared washing and repair space |
| Dock Steps Tenement | Middle Upper West (3,9) | 4 | Lake workers, household repairs and shift lodging |
| South Rows Tenement | South Upper East (3,10) | 24 | Three floors, eight units each; weekday household care and Dayoff workers |
| Hume Boardinghouse | South Upper West (3,10) | 4 rented rooms, counted separately | Shared stove/dining room and four private sleeping rooms |
| Kelm Family Rooms | Above Kelm Provisions, stair (7,1) | 1 | Provisioner and assistant’s household pantry and kitchen |
| Stern Family Rooms | Above Stern Apothecary, stair (7,1) | 1 | Apothecary’s home with room for her visiting sister |
| Sorn Family Rooms | Above Sorn Work Gear, stair (7,1) | 1 | Keeper’s family household, repairs and nephew’s visit |

There are now **41 accessible self-contained dwellings**, plus **four boarding rooms**. Eleven closed frontages imply another **17 self-contained dwellings**: eight single homes and three three-unit tenements. Total represented residential capacity is **58 dwellings plus four boarding rooms**. The remaining former three-unit frontage is now the watchhouse. Inn guest beds are separate commercial lodging, not counted again as dwellings. These examples represent a compressed town of approximately 8,000; no numeric population claim is inferred from rendered beds. The housing mix deliberately does not triple Drenwick's building count.

| Closed residential frontage | Door tile | Represented dwellings |
|---|---|---:|
| `MORNAY_SOUTH_UPPER_WEST_MAP` | 2,5 | 1 |
| `MORNAY_EAST_GATE_MAP` | 3,5 | 1 |
| `MORNAY_WEST_GATE_MAP` | 12,10 | 3 |
| `MORNAY_MIDDLE_LOWER_EAST_MAP` | 12,5 | 3 |
| `MORNAY_MIDDLE_LOWER_EAST_MAP` | 12,9 | 1 |
| `MORNAY_MIDDLE_UPPER_EAST_MAP` | 4,5 | 1 |
| `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | 3,9 | 1 |
| `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | 12,9 | 1 |
| `MORNAY_NORTH_LOWER_EAST_MAP` | 3,5 | 3 |
| `MORNAY_NORTH_UPPER_EAST_MAP` | 12,8 | 1 |
| `MORNAY_NORTH_UPPER_WEST_MAP` | 3,6 | 1 |

Closed frontages remain ordinary solid building cells, with no registered interior or interaction. Windows stay on existing building massing. Eight new exterior doors open six homes and two block common areas; existing Shared Court and Hume entrances serve their new child rooms. Flat doors are columns 2, 5, 10 and 13 on common-room row 4; boarding room doors use row 3. All have reciprocal returns, with no new saved housing state.

### Residents, furnishing and presentation

The first residential pass changed 44 primary placements; the shop-home follow-up changes four further placements. All 300 stable IDs and names remain. Before the tenement follow-up the split was 101 outdoors and 199 indoors. With the watchhouse it is now 93/207 on workdays and 87/213 on Dayoff. Maris Glyn and Ferin Wold change between school and home using the established five-day `isDayOff()` calendar. Their map, coordinates, facing and pose are derived, with no duplicate NPC, schedule flag or save field. Twelve patrols remain deterministic; four now follow longer bent routes. Fifty-four primary placements are seated. The authored category totals remain 159 workers, 32 officials, 24 service staff, 18 merchants and 67 residents/visitors; these are content categories, not mutually exclusive real-world occupations.

Rooms use existing furniture vocabulary: `drawTable()` and `drawInfirmaryBed()` directly, plus coordinate-only adaptations of `drawHouseFurniture()`, Calwick office desks/cabinets and the earlier ward-school furniture. There are desks, classroom work surfaces, filing cabinets, domestic beds, dressers, stoves, supply shelves, benches and tubs. No old-town rendering wrapper is invoked with spoofed state. Collision and fixture drawing share `MORNAY_ROOM_FIXTURES`; occupied seats use the existing solid NPC anchor. Short partitions divide sleeping alcoves from work/reception space. Beds in the infirmary now use the established two-tile ward-bed drawing, retaining all eight beds and the registered healer; 15 people remain in the ward.

`render-mornay.js` restores the floor under TABLE collision cells before drawing the actual furniture. Mornay rooms sort fixtures, residents and the player by depth; other towns retain their prior drawing path. Directional/seated poses are explicit opt-ins. Room names appear once in the existing HUD title. Exterior business/home signs, useful care/school markings and numbered unit doors remain visible.

### Review decisions

Read-only housing research (`housing_patterns`) established the old-town benchmark and recommended registry reuse; both accepted. Its proposed fourth block was reduced to three to keep a substantial, coherent sample without mechanically multiplying buildings. Furnishing research (`furnishing_assets`) identified existing asset functions; accepted direct reuse and isolated coordinate adaptations. Layout research (`mornay_layout_review`) identified repeated rows and furniture arrays; accepted role-based placement, room plans, household redistribution and explicit pose support.

The exclusive Sol High test writer (`mornay_refinement_tests`) edited only new suites 311–314 after the root stopped editing. Root inspected all four: actual held-control travel, schedule/overnight persistence, painter order and old-town dispatch, and solid/inert facades are meaningful behavioral checks. Its confirmed Dayoff-facing defect was fixed without weakening the test. The follow-up coherence review also caught Fressa's obsolete hospital-tense dialogue; corrected. Its suggestions prompted small fixture differences in the examiner's house, repairer's flat and seamworker's flat. Broader corridor density and Corra's front-step phrasing remain optional editorial matters, not correctness defects.

A fresh Sol High correctness reviewer (`mornay_refinement_correctness`) found an overlapping warehouse pair introduced during final staging. Bram now stands beside the warehouse entrance and Ivara waits separately. Independent review confirmed both conversations on workday and Dayoff and found no other unreachable or shadowed resident across 58 maps / 300 identities. The root alone edited production, resolved findings, regenerated the transition artifact and created local checkpoints. No agent used nested delegation; no more than three subagents ran concurrently.

## District matrix

NPC density counts below refer to exterior characters. Every street keeps its mandatory central crossing and boundary approach clear; door approaches remain free. Northern one-tile horizontal streets receive no NPC or solid decoration. Props are visual only unless existing tile collision explicitly applies.

| Map ID | Role | Visible buildings / usable doors | Exterior NPCs | Hazards and circulation | Environmental story | Reserved content |
|---|---|---|---:|---|---|---|
| `MORNAY_OLD_FORT_MAP` | Obsolete fort, watch post and disused lockup | Watch post; disused lockup; records shutters. Doors: No usable door | 2 | Clear row 7, columns 7–8, doors and boundary cells | Weathered masonry, patched wall, old watch bench | Fort plot and lookout |
| `MORNAY_NORTH_UPPER_WEST_MAP` | Merchant frontage and commercial lodging | Ledger House; merchant houses. Doors: Ledger House (11,5), Vale House (11,8) | 3 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Kept steps and sheltered benches; swept empty berth | Story ship berth; boarding |
| `MORNAY_NORTH_UPPER_EAST_MAP` | Wealth and examination privilege | Walled Civic Collegium; merchant houses. Doors: Examiner’s House (3,8) | 2 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Fee notice; tutor demand; clean paving | Collegium inaccessible |
| `MORNAY_NORTH_LOWER_WEST_MAP` | Harbour administration and working quay | Harbour/customs room; net sheds. Doors: Harbour and Customs Public Room (11,5) | 7 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Rope inspection; mutual-aid collection; covered notices | Island ferry berth inactive |
| `MORNAY_NORTH_LOWER_EAST_MAP` | Shipping offices and lake-trade supplies | Venn Chandlery; shipping offices; sailor lodgings. Doors: Venn Chandlery and Secondhand (11,5) | 7 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Secondhand goods, spare rope, patched sail | No ship departure |
| `MORNAY_MIDDLE_UPPER_WEST_MAP` | Warehousing and transshipment | Fen Warehouse; bonded stores. Doors: Fen Warehouse (3,5), Dock Steps Tenement (3,9) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Scales, sacks, tally disputes, guarded logistics | Locked warehouse annex |
| `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | Provision market and print stalls | Kelm Provisions; market stalls. Doors: Kelm Provisions (3,5) | 10 | Clear row 7, columns 7–8, doors and boundary cells | Fish prices; measures; confiscation notice | Petitions and print disputes inert |
| `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | Regional administration | Regional IJC Office; courier desk; archives. Doors: Regional IJC Office (3,5) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Queues; contractors; fees; redirected responsibility | Operational plot dialogue and sealed archives |
| `MORNAY_MIDDLE_UPPER_EAST_MAP` | Waterworks and survey frontage | Closed hydrographic office; waterworks. Doors: Reed’s Net Room (3,9) | 6 | Clear row 7, columns 7–8, doors and boundary cells | Gauge readings, drainage repair, storm marks | Hydrographer and Esla history absent |
| `MORNAY_MIDDLE_LOWER_WEST_MAP` | Freight yards, carts and fen products | Cart sheds; freight stores; smoking sheds. Doors: No usable door | 9 | Clear row 7, columns 7–8, doors and boundary cells | Peat, salt fish barrels, damaged harness | No freight quests |
| `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | Workwear and ordinary commerce | Sorn Work Gear; cobbler and cloth fronts. Doors: Sorn Work Gear (3,5), Rann Workroom House (12,5) | 6 | Clear row 7, columns 7–8, doors and boundary cells | Used tools, repairs, oil, patched roofs | Equipment progression deferred |
| `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | Repair crafts and small printing | Rusk Workshop Court; cooper and forge fronts. Doors: Rusk Workshop Court (12,5), Glyn Household (3,5) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Benches, wheel repair, pasted-over handbills | Printer and organizer hooks inert |
| `MORNAY_MIDDLE_LOWER_EAST_MAP` | Worker housing and washing | Quill Laundry; East Ward Shared Court. Doors: Quill Laundry (3,5), East Ward Shared Court (3,9) | 2 | Clear row 7, columns 7–8, doors and boundary cells | Laundry, shared repairs, mutual aid, suspected meeting facade | Locked back stair; no headquarters |
| `MORNAY_SOUTH_UPPER_WEST_MAP` | Ordinary care and inexpensive housing | Mornay Infirmary; Hume Boardinghouse. Doors: Mornay Infirmary (12,5), Hume Boardinghouse (3,10), Pate’s Kitchen (12,10) | 5 | Clear row 7, columns 7–8, doors and boundary cells | Beds, injured workers, linen, rent, shifts | No new medical or lodging quest |
| `MORNAY_SOUTH_UPPER_EAST_MAP` | Ward services, market and civic lockup | South Ward School; Stern Apothecary. Doors: Stern Apothecary (3,5), South Ward School (12,5), South Rows Apartments (3,10), Watchhouse / Jail (12,10) | 7 | Clear row 7, columns 7–8, doors and boundary cells | Lunch sellers, remedies, parents, ordinary schooling | No school progression |
| `MORNAY_WEST_GATE_MAP` | Passenger arrivals and cheap lodging | Wold's Gate Inn; watch shelter. Doors: Wold's Gate Inn (3,5) | 3 | Clear row 7, columns 7–8, doors and boundary cells | Porters, handcarts, arrivals and tired travellers | No new overworld links |
| `MORNAY_EAST_GATE_MAP` | Freight arrivals and labour hiring | Hiring board; cart inspection; watch shelter. Doors: No usable door | 5 | Clear row 7, columns 7–8, doors and boundary cells | Loads, wheels, hiring notices and waiting labour | No transport or labour quest |

## Interior and door matrix

Coordinates are zero-based tile columns/rows. Southward entry arrives at tile centre (7,1), facing down, with exit (7,0); northward entry arrives at (7,13), facing up, with exit (7,14). Exits return to the listed source tile centre with the listed facing. Child flats, inn bedrooms and shop homes originate in their registered parent rooms. Returns avoid immediate re-entry.

| ID / map | Establishment | Source map | Door | Return / facing | NPCs (workday) |
|---|---|---|---|---|---:|
| `mornay_office` / `MORNAY_OFFICE_MAP` | Regional IJC Office | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | 3,5 | 3,6 down | 16 |
| `mornay_infirmary` / `MORNAY_INFIRMARY_MAP` | Mornay Infirmary | `MORNAY_SOUTH_UPPER_WEST_MAP` | 12,5 | 12,6 down | 15 |
| `mornay_provisioner` / `MORNAY_PROVISIONER_MAP` | Kelm Provisions | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | 3,5 | 3,6 down | 6 |
| `mornay_apothecary` / `MORNAY_APOTHECARY_MAP` | Stern Apothecary | `MORNAY_SOUTH_UPPER_EAST_MAP` | 3,5 | 3,6 down | 7 |
| `mornay_workgear` / `MORNAY_WORKGEAR_MAP` | Sorn Work Gear | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | 3,5 | 3,6 down | 8 |
| `mornay_chandler` / `MORNAY_CHANDLER_MAP` | Venn Chandlery and Secondhand | `MORNAY_NORTH_LOWER_EAST_MAP` | 11,5 | 11,6 down | 7 |
| `mornay_watchhouse` / `MORNAY_WATCHHOUSE_MAP` | South Mornay Watchhouse & Jail | `MORNAY_SOUTH_UPPER_EAST_MAP` | 12,10 | 12,9 up | 3 (2 on Dayoff) |
| `mornay_gate_inn` / `MORNAY_GATE_INN_MAP` | Wold's Gate Inn | `MORNAY_WEST_GATE_MAP` | 3,5 | 3,6 down | 9 |
| `mornay_gate_beds` / `MORNAY_GATE_BEDS_MAP` | Gate Inn Shared Rooms | `MORNAY_GATE_INN_MAP` | 7,1 | 7,2 down | 8 |
| `mornay_commercial_inn` / `MORNAY_COMMERCIAL_INN_MAP` | Ledger House | `MORNAY_NORTH_UPPER_WEST_MAP` | 11,5 | 11,6 down | 9 |
| `mornay_commercial_beds` / `MORNAY_COMMERCIAL_BEDS_MAP` | Ledger House Rooms | `MORNAY_COMMERCIAL_INN_MAP` | 7,1 | 7,2 down | 7 |
| `mornay_school` / `MORNAY_SCHOOL_MAP` | South Ward School | `MORNAY_SOUTH_UPPER_EAST_MAP` | 12,5 | 12,6 down | 14 |
| `mornay_harbour` / `MORNAY_HARBOUR_MAP` | Harbour and Customs Public Room | `MORNAY_NORTH_LOWER_WEST_MAP` | 11,5 | 11,6 down | 14 |
| `mornay_warehouse` / `MORNAY_WAREHOUSE_MAP` | Fen Warehouse | `MORNAY_MIDDLE_UPPER_WEST_MAP` | 3,5 | 3,6 down | 11 |
| `mornay_workshop` / `MORNAY_WORKSHOP_MAP` | Rusk Workshop Court | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | 12,5 | 12,6 down | 10 |
| `mornay_laundry` / `MORNAY_LAUNDRY_MAP` | Quill Laundry | `MORNAY_MIDDLE_LOWER_EAST_MAP` | 3,5 | 3,6 down | 7 |
| `mornay_boarding` / `MORNAY_BOARDING_MAP` | Hume Boardinghouse | `MORNAY_SOUTH_UPPER_WEST_MAP` | 3,10 | 3,9 up | 1 |
| `mornay_court` / `MORNAY_COURT_MAP` | East Ward Shared Court | `MORNAY_MIDDLE_LOWER_EAST_MAP` | 3,9 | 3,8 up | 1 |
| `mornay_glyn_home` / `MORNAY_GLYN_HOME_MAP` | Glyn Household | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | 3,5 | 3,6 down | 1 |
| `mornay_reed_home` / `MORNAY_REED_HOME_MAP` | Reed’s Net Room | `MORNAY_MIDDLE_UPPER_EAST_MAP` | 3,9 | 3,8 up | 1 |
| `mornay_pate_home` / `MORNAY_PATE_HOME_MAP` | Pate’s Kitchen | `MORNAY_SOUTH_UPPER_WEST_MAP` | 12,10 | 12,9 up | 3 |
| `mornay_rann_home` / `MORNAY_RANN_HOME_MAP` | Rann Workroom House | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | 12,5 | 12,6 down | 2 |
| `mornay_vale_home` / `MORNAY_VALE_HOME_MAP` | Vale House | `MORNAY_NORTH_UPPER_WEST_MAP` | 11,8 | 11,7 up | 2 |
| `mornay_dane_home` / `MORNAY_DANE_HOME_MAP` | Examiner’s House | `MORNAY_NORTH_UPPER_EAST_MAP` | 3,8 | 3,7 up | 3 |
| `mornay_dock_steps` / `MORNAY_DOCK_STEPS_MAP` | Dock Steps Tenement | `MORNAY_MIDDLE_UPPER_WEST_MAP` | 3,9 | 3,8 up | 1 |
| `mornay_south_rows` / `MORNAY_SOUTH_ROWS_MAP` | South Rows Tenement — Ground Floor | `MORNAY_SOUTH_UPPER_EAST_MAP` | 3,10 | 3,9 up | 1 |
| `mornay_court_unit_1` / `MORNAY_COURT_UNIT_1_MAP` | East Ward Shared Court — Flat 1 | `MORNAY_COURT_MAP` | 2,4 | 2,5 down | 1 |
| `mornay_court_unit_2` / `MORNAY_COURT_UNIT_2_MAP` | East Ward Shared Court — Flat 2 | `MORNAY_COURT_MAP` | 5,4 | 5,5 down | 2 |
| `mornay_court_unit_3` / `MORNAY_COURT_UNIT_3_MAP` | East Ward Shared Court — Flat 3 | `MORNAY_COURT_MAP` | 10,4 | 10,5 down | 2 |
| `mornay_court_unit_4` / `MORNAY_COURT_UNIT_4_MAP` | East Ward Shared Court — Flat 4 | `MORNAY_COURT_MAP` | 13,4 | 13,5 down | 2 |
| `mornay_dock_steps_unit_1` / `MORNAY_DOCK_STEPS_UNIT_1_MAP` | Dock Steps Tenement — Flat 1 | `MORNAY_DOCK_STEPS_MAP` | 2,4 | 2,5 down | 2 |
| `mornay_dock_steps_unit_2` / `MORNAY_DOCK_STEPS_UNIT_2_MAP` | Dock Steps Tenement — Flat 2 | `MORNAY_DOCK_STEPS_MAP` | 5,4 | 5,5 down | 2 |
| `mornay_dock_steps_unit_3` / `MORNAY_DOCK_STEPS_UNIT_3_MAP` | Dock Steps Tenement — Flat 3 | `MORNAY_DOCK_STEPS_MAP` | 10,4 | 10,5 down | 2 |
| `mornay_dock_steps_unit_4` / `MORNAY_DOCK_STEPS_UNIT_4_MAP` | Dock Steps Tenement — Flat 4 | `MORNAY_DOCK_STEPS_MAP` | 13,4 | 13,5 down | 1 |
| `mornay_south_rows_unit_1` / `MORNAY_SOUTH_ROWS_UNIT_1_MAP` | South Rows — Unit 1 | `MORNAY_SOUTH_ROWS_MAP` | 2,4 | 2,5 down | 2 |
| `mornay_south_rows_unit_2` / `MORNAY_SOUTH_ROWS_UNIT_2_MAP` | South Rows — Unit 2 | `MORNAY_SOUTH_ROWS_MAP` | 5,4 | 5,5 down | 2 |
| `mornay_south_rows_unit_3` / `MORNAY_SOUTH_ROWS_UNIT_3_MAP` | South Rows — Unit 3 | `MORNAY_SOUTH_ROWS_MAP` | 10,4 | 10,5 down | 2 |
| `mornay_south_rows_unit_4` / `MORNAY_SOUTH_ROWS_UNIT_4_MAP` | South Rows — Unit 4 | `MORNAY_SOUTH_ROWS_MAP` | 13,4 | 13,5 down | 2 |
| `mornay_boarding_unit_1` / `MORNAY_BOARDING_UNIT_1_MAP` | Hume Boardinghouse — Room 1 | `MORNAY_BOARDING_MAP` | 2,3 | 2,4 down | 2 |
| `mornay_boarding_unit_2` / `MORNAY_BOARDING_UNIT_2_MAP` | Hume Boardinghouse — Room 2 | `MORNAY_BOARDING_MAP` | 5,3 | 5,4 down | 1 |
| `mornay_boarding_unit_3` / `MORNAY_BOARDING_UNIT_3_MAP` | Hume Boardinghouse — Room 3 | `MORNAY_BOARDING_MAP` | 10,3 | 10,4 down | 2 |
| `mornay_boarding_unit_4` / `MORNAY_BOARDING_UNIT_4_MAP` | Hume Boardinghouse — Room 4 | `MORNAY_BOARDING_MAP` | 13,3 | 13,4 down | 1 |
| `mornay_kelm_home` / `MORNAY_KELM_HOME_MAP` | Kelm Family Rooms | `MORNAY_PROVISIONER_MAP` | 7,1 | 7,2 down | 1 |
| `mornay_stern_home` / `MORNAY_STERN_HOME_MAP` | Stern Family Rooms | `MORNAY_APOTHECARY_MAP` | 7,1 | 7,2 down | 1 |
| `mornay_sorn_home` / `MORNAY_SORN_HOME_MAP` | Sorn Family Rooms | `MORNAY_WORKGEAR_MAP` | 7,1 | 7,2 down | 2 |
| `mornay_south_rows_floor_2` / `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | South Rows Tenement — Floor 2 | `MORNAY_SOUTH_ROWS_MAP` | 14,6 | 14,7 down | 0 |
| `mornay_south_rows_floor_3` / `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | South Rows Tenement — Floor 3 | `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | 14,6 | 14,7 down | 0 |
| `mornay_south_rows_unit_5` / `MORNAY_SOUTH_ROWS_UNIT_5_MAP` | South Rows — Unit 5 | `MORNAY_SOUTH_ROWS_MAP` | 2,10 | 2,9 up | 0 |
| `mornay_south_rows_unit_6` / `MORNAY_SOUTH_ROWS_UNIT_6_MAP` | South Rows — Unit 6 | `MORNAY_SOUTH_ROWS_MAP` | 5,10 | 5,9 up | 0 |
| `mornay_south_rows_unit_7` / `MORNAY_SOUTH_ROWS_UNIT_7_MAP` | South Rows — Unit 7 | `MORNAY_SOUTH_ROWS_MAP` | 10,10 | 10,9 up | 0 |
| `mornay_south_rows_unit_8` / `MORNAY_SOUTH_ROWS_UNIT_8_MAP` | South Rows — Unit 8 | `MORNAY_SOUTH_ROWS_MAP` | 13,10 | 13,9 up | 0 |
| `mornay_south_rows_unit_9` / `MORNAY_SOUTH_ROWS_UNIT_9_MAP` | South Rows — Unit 9 | `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | 2,4 | 2,5 down | 1 |
| `mornay_south_rows_unit_10` / `MORNAY_SOUTH_ROWS_UNIT_10_MAP` | South Rows — Unit 10 | `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | 5,4 | 5,5 down | 1 |
| `mornay_south_rows_unit_11` / `MORNAY_SOUTH_ROWS_UNIT_11_MAP` | South Rows — Unit 11 | `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | 10,4 | 10,5 down | 1 |
| `mornay_south_rows_unit_12` / `MORNAY_SOUTH_ROWS_UNIT_12_MAP` | South Rows — Unit 12 | `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | 13,4 | 13,5 down | 1 |
| `mornay_south_rows_unit_13` / `MORNAY_SOUTH_ROWS_UNIT_13_MAP` | South Rows — Unit 13 | `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | 2,10 | 2,9 up | 0 |
| `mornay_south_rows_unit_14` / `MORNAY_SOUTH_ROWS_UNIT_14_MAP` | South Rows — Unit 14 | `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | 5,10 | 5,9 up | 0 |
| `mornay_south_rows_unit_15` / `MORNAY_SOUTH_ROWS_UNIT_15_MAP` | South Rows — Unit 15 | `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | 10,10 | 10,9 up | 0 |
| `mornay_south_rows_unit_16` / `MORNAY_SOUTH_ROWS_UNIT_16_MAP` | South Rows — Unit 16 | `MORNAY_SOUTH_ROWS_FLOOR_2_MAP` | 13,10 | 13,9 up | 0 |
| `mornay_south_rows_unit_17` / `MORNAY_SOUTH_ROWS_UNIT_17_MAP` | South Rows — Unit 17 | `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | 2,4 | 2,5 down | 1 |
| `mornay_south_rows_unit_18` / `MORNAY_SOUTH_ROWS_UNIT_18_MAP` | South Rows — Unit 18 | `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | 5,4 | 5,5 down | 1 |
| `mornay_south_rows_unit_19` / `MORNAY_SOUTH_ROWS_UNIT_19_MAP` | South Rows — Unit 19 | `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | 10,4 | 10,5 down | 1 |
| `mornay_south_rows_unit_20` / `MORNAY_SOUTH_ROWS_UNIT_20_MAP` | South Rows — Unit 20 | `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | 13,4 | 13,5 down | 1 |
| `mornay_south_rows_unit_21` / `MORNAY_SOUTH_ROWS_UNIT_21_MAP` | South Rows — Unit 21 | `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | 2,10 | 2,9 up | 0 |
| `mornay_south_rows_unit_22` / `MORNAY_SOUTH_ROWS_UNIT_22_MAP` | South Rows — Unit 22 | `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | 5,10 | 5,9 up | 0 |
| `mornay_south_rows_unit_23` / `MORNAY_SOUTH_ROWS_UNIT_23_MAP` | South Rows — Unit 23 | `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | 10,10 | 10,9 up | 0 |
| `mornay_south_rows_unit_24` / `MORNAY_SOUTH_ROWS_UNIT_24_MAP` | South Rows — Unit 24 | `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | 13,10 | 13,9 up | 0 |
| `mornay_south_rows_attic` / `MORNAY_SOUTH_ROWS_ATTIC_MAP` | South Rows — Attic | `MORNAY_SOUTH_ROWS_FLOOR_3_MAP` | 1,6 | 1,7 down | 0 |

## Shops, services and institutions

| Business | Deterministic existing stock / behavior |
|---|---|
| Kelm Provisions | Potion 30; Bait 6 |
| Stern Apothecary | Potion 30; Elixir 80; Reed Remedy 50; Amethyst Dust 60 |
| Sorn Work Gear | Bronze Knife 80; Leather Armor 120; Iron Shield 140; Iron Sword 160; Fen Cowl 240 |
| Venn Chandlery and Secondhand | Bait 6; Throwing Knife 35; Leather Armor 120; Swift Bangle 180. Ordinary buying/selling only; no pledge ledger. |
| Wold’s Gate Inn | 30 gold, shared rooms and road/freight clientele |
| Ledger House | 40 gold, respectable commercial lodging, separate upstairs rooms |
| Mornay Infirmary | Ordinary physician, nurses, orderlies, dispenser, multiple beds and patients; one registered Bloommarked resonance healer. Existing pay-per-HP convention, one gold per HP restored, capped by missing HP and funds, selectable party member. No day or condition changes. |

Inns use the existing party overnight-recovery authority, advance the existing day count once, and preserve its established retained conditions. Treatment is a small canonical party-owner operation, not a second health authority. Stock reuses registered items without adding an equipment tier. Both commercial keepers and ordinary staff have individual dialogue.

Accessible institutions: Regional IJC Office including dispatch/records reception; infirmary; four shops; two inns and their sleeping rooms; ordinary South Ward School; harbour/customs public room; warehouse; workshop; laundry; boardinghouse; shared residential court.

Facade-only institutions: walled fee-paying Civic Collegium; hydrographic office; Old Fort disused lockup/records; locked archives and suspected meeting stair. The Civic Collegium prepares adolescents for the Civic Examination, commercial clerkships and junior Imperial service. It is socially exclusive and inaccessible in this pass. The ordinary ward school serves local families and adult literacy without a new school mechanic. Hiring remains a public gate board, not a quest system.

## Relationships, dialogue and Reclaimer knowledge

The nine meaningful non-Imperial network ties are author-only classifications; no faction UI, membership disclosure, reputation, mutable flags or recruitment exists. They span waterfront labour, logistics and educated/professional circles. Three are confirmed members in the writing plan, not publicly identified to Lely or Esla.

| Character | Author-only relationship | Public expression |
|---|---|---|
| Nessa Quill | confirmed member | laundry organiser; guarded, repeatable conversation |
| Bram Fen | confirmed member | warehouse tallyman; guarded, repeatable conversation |
| Tavi Rusk | confirmed member | compositor; guarded, repeatable conversation |
| Dena Mere | labour associate; sympathetic, membership unconfirmed | dock representative; guarded, repeatable conversation |
| Yara Kelm | medical mutual-aid associate | senior nurse; guarded, repeatable conversation |
| Hal Venn | logistics associate | chandler and secondhand dealer; guarded, repeatable conversation |
| Pella Dorn | sympathizer falsely accused of organizing violence | print seller; guarded, repeatable conversation |
| Sima Wold | boarding and lodging associate | inn proprietor on errands; guarded, repeatable conversation |
| Oren Teal | educated sympathizer | headteacher; guarded, repeatable conversation |

Edrin Saye (customs) and Jessa Nair (watch) discuss Reclaimer activity or accusations; Magistrate Marit Voss now foregrounds bureaucratic refusal of the Drenwick report. Workers with ordinary grievances are not automatically members. Aid, justified anger and political courage coexist with secrecy, illicit carriage of papers/goods, disagreement over coercion, and opportunistic accusations. No enterable building is marked as a headquarters.

Cross-references connect Nessa–Nelda–Verna–Yara (laundry, school, family, infirmary); Dena–Perrin–Yelda (dock representation, pupil, washer); Bram–Varda (warehouse ledgers); Tavi–Halden–Vesta–Pella (printing and seized sheets); Neris–Yara–Adra (provisions and medical work); Sima–Rella (gate inn); Jessa–Ossa (watch and home); Harlis–Maris (worker and pupil); Heba–Ilven (net mending); Niva–Nelva (fish and household food).

Lely and Esla know the faction exists and have their established professional/road experience. Optional brewery reading is not presumed. They do not know this local membership list, connect it to the central crisis, or expose, join, arrest or investigate anyone. The earlier ambush remains unaffiliated. Officials may recognize Imperial credentials; most people respond to strangers. Selected medical, administrative and practical exchanges use existing mixed-speaker metadata and Esla’s green style when her established companion availability permits.

Environmental evidence includes the existing street notices and locked meeting stair, plus the now-accessible South Rows attic described in the current-pass ledger. Its printing, supplies, relabelled freight and meeting notes identify Reclaimer activity without identifying members or granting state/rewards.

## Complete roster

Each row is one stable character and one concise dialogue purpose. Two pupils and twelve tenement workers have derived school/home or work/home placements, identified in the movement column. Location keys name an exterior map or the interior key above. Roles also define economic/social clusters; the relationships above connect those clusters. Future quest candidates are the nine network characters and selected officials, but every conversation remains repeatable and inert. No purely silent resident is required: “ambient” means incidental street/work/family dialogue rather than a quest.

| Stable ID | Name | Location | Role / cluster | Movement | Revisable dialogue seed |
|---|---|---|---|---|---|
| `mornay_hadrin_moss` | Hadrin Moss | `MORNAY_WATCHHOUSE_MAP` | booking officer | Standing; faces down | Name, business, and wait. I've heard every explanation except a short one. Copies go through the ordinary queue. A consideration for the clerk sometimes makes that queue shorter. |
| `mornay_elva_tern` | Elva Tern | `MORNAY_OLD_FORT_MAP` | wall inspector | Standing; faces left | Perris can mend this wall. Getting the repair approved means proving which office owns the crack. Apparently the watch owns one side and the town owns the rain. |
| `mornay_perris_dun` | Perris Dun | `MORNAY_OLD_FORT_MAP` | mason | Standing; faces up | These stones have been fitted more than once. See the old mortar? People like to call everything ancient. Sometimes a wall is just somebody else's repair bill. |
| `mornay_lotte_brin` | Lotte Brin | `MORNAY_SOUTH_ROWS_UNIT_18_MAP` | resident sketching | Standing; faces right | I sketch the landing when the washing is down. Half the doors are quiet on workdays. You can tell when a shift ends without a clock. |
| `mornay_maelin_rook` | Maelin Rook | `MORNAY_NORTH_UPPER_WEST_MAP` | berth steward | Standing; faces left; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_13_MAP` | An empty berth still needs sweeping. |
| `mornay_corra_pike` | Corra Pike | `MORNAY_VALE_HOME_MAP` | house steward | Standing; faces up | Leave the bill with me. Mrs Vale accepts a Kethrin letter of credit from a shipping partner, but the woman who washes her curtains would prefer gold. |
| `mornay_fennel_ashe` | Fennel Ashe | `MORNAY_NORTH_UPPER_WEST_MAP` | gardener | Standing; faces right; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_5_MAP` | The lake wind has very definite ideas about my hedges. |
| `mornay_nesta_vale` | Nesta Vale | `MORNAY_VALE_HOME_MAP` | shipowner's widow | Seated; faces left | Drynport takes its charges, Mornay takes its charges, and a damaged cargo still belongs to me. My tenants say the rents should come down. They have an answer for everything. |
| `mornay_osric_bell` | Osric Bell | `MORNAY_SOUTH_ROWS_UNIT_17_MAP` | retired pilot | Standing; faces left | A whole life on Valmere and this is the room I can afford. Still, I have a dry chair and neighbours who knock before bad weather. |
| `mornay_celda_verne` | Celda Verne | `MORNAY_DANE_HOME_MAP` | household secretary | Standing; faces up | A letter from Halcyra goes straight to Mr Dane's desk. The carpenter's bill waits beneath it. I put the bill on top again when he isn't looking. |
| `mornay_idris_pell` | Idris Pell | `MORNAY_NORTH_UPPER_EAST_MAP` | Collegium porter | Standing; faces right | Civic Collegium. Upper pupils only. The fees prepare them for the Civic Examination, clerkships and junior service. Visitors require an appointment. You have neither pupil nor appointment with you. |
| `mornay_benna_lark` | Benna Lark | `MORNAY_NORTH_UPPER_EAST_MAP` | Collegium student | Standing; faces down | The Civic Examination itself costs very little. Mother paid for three years of preparation here. I used to think everyone meant the same thing by an inexpensive examination. |
| `mornay_tassel_dorn` | Tassel Dorn | `MORNAY_DANE_HOME_MAP` | domestic worker | Standing; faces right | The family visits on Dayoff, so I work on Dayoff. Mr Dane says rest is essential to clear thinking. I expect he is right; I haven't tested it lately. |
| `mornay_ulric_dane` | Ulric Dane | `MORNAY_DANE_HOME_MAP` | retired examiner | Seated; faces left | The Examination may be open. An evening without work, a lamp and somebody to correct your answers are less evenly shared. |
| `mornay_dena_mere` | Dena Mere | `MORNAY_NORTH_LOWER_WEST_MAP` | dock representative | Standing; faces right | A missed day's pay reaches the supper table before the explanation. Nessa has kept three crews fed. That does not give anyone the right to speak for every worker here. |
| `mornay_salwen_reed` | Salwen Reed | `MORNAY_NORTH_LOWER_WEST_MAP` | rope inspector | Standing; faces left; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_6_MAP` | Gessa wants this rope condemned. The owner wants another week from it. I have put my name beside hers. |
| `mornay_niva_cole` | Niva Cole | `MORNAY_NORTH_LOWER_WEST_MAP` | fish seller | Standing; faces left | Heba mends the nets, I sell what comes out. The Valmere catch has farther to travel than a Thornmere basket. Pay for fresh fish while I can still honestly call it fresh. |
| `mornay_rulon_hart` | Rulon Hart | `MORNAY_NORTH_LOWER_WEST_MAP` | scow hand | Standing; faces up; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_7_MAP` | We came down from Drynport with water over the bow. Lowen says the next freight will make it tonight. Lowen has a warm room and no intention of joining the crew. |
| `mornay_heba_flint` | Heba Flint | `MORNAY_NORTH_LOWER_WEST_MAP` | net mender | Seated; faces left; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_8_MAP` | Ilven still ties the difficult knots at home. Pay him for them. He needs wages, not people calling him brave. |
| `mornay_davi_fenner` | Davi Fenner | `MORNAY_SOUTH_ROWS_UNIT_9_MAP` | child keeping house | Standing; faces left | Mother's at the fish sheds. I stir the pot and keep the little ones off the stairs. Oren says I can still come to school. Who would mind the pot? |
| `mornay_merra_keld` | Merra Keld | `MORNAY_NORTH_LOWER_WEST_MAP` | laundry collector | Patrol; faces down | The Drynport crews tie their laundry into sailcloth. Better than the clerk who sends it with a written inventory. I can count six dirty shirts without a witness. |
| `mornay_jorin_vetch` | Jorin Vetch | `MORNAY_NORTH_LOWER_EAST_MAP` | lodging tout | Standing; faces right | Rella has beds at the gate inn. If you need a room while you look for work, ask Della Hume. Neither price includes somebody finding you a job. |
| `mornay_alwen_corst` | Alwen Corst | `MORNAY_NORTH_LOWER_EAST_MAP` | customs messenger | Patrol; faces down | The packet waits over Dayoff; the urgent letters don't stop arriving. Saye marks his urgent before he reads them. I sort by departure, not by the size of the underline. |
| `mornay_cessa_brack` | Cessa Brack | `MORNAY_NORTH_LOWER_EAST_MAP` | sailor's spouse | Standing; faces up | He wrote about Drynport's bridges for half a page, then asked whether the roof still leaked. I sent back a drawing of the bucket. That should answer him. |
| `mornay_tobin_yarrow` | Tobin Yarrow | `MORNAY_NORTH_LOWER_EAST_MAP` | sail repairer | Standing; faces right | Elda sends me the small sail repairs. A Valmere squall tests every stitch, so we both sign the finished patch. The captain can argue with two of us. |
| `mornay_ersa_vole` | Ersa Vole | `MORNAY_NORTH_LOWER_EAST_MAP` | discharged deckhand | Standing; faces left | The boat took on less cargo and kept fewer hands. They call that the drought allowance. I asked whether my room would take less rent. It wouldn't. |
| `mornay_lowen_greaves` | Lowen Greaves | `MORNAY_NORTH_LOWER_EAST_MAP` | shipping agent | Standing; faces down | The passenger can come by coach. His grain needs a barge, a warehouse and another vessel. He keeps asking why the grain hasn't kept up with him. |
| `mornay_brena_sill` | Brena Sill | `MORNAY_NORTH_LOWER_EAST_MAP` | dockside baker | Standing; faces right | Crew bread, baked firm. Honey on a loaf is extra. If somebody promised you northern sugar for that price, ask to see it before handing over your gold. |
| `mornay_bram_fen` | Bram Fen | `MORNAY_MIDDLE_UPPER_WEST_MAP` | warehouse tallyman | Standing; faces right | Varda keeps the signed tally. I keep the count of what actually arrived. No, those are not always the same number. You want a manifest, use the public office. |
| `mornay_gessa_tarn` | Gessa Tarn | `MORNAY_MIDDLE_UPPER_WEST_MAP` | unloading forewoman | Standing; faces left | Hands clear. Set it down together. The hoist was condemned once already; ask Arlis why the contractor signed it back into use. |
| `mornay_halen_wick` | Halen Wick | `MORNAY_MIDDLE_UPPER_WEST_MAP` | barrel roller | Patrol; faces down | Lume grain comes in sacks; fish goes out in barrels. I used to think round goods would be easier. You learn a great deal in your first shift. |
| `mornay_ivara_gorse` | Ivara Gorse | `MORNAY_MIDDLE_UPPER_WEST_MAP` | freight customer | Standing; faces up | My reed mats came through the fen channel on a scow. Now Varda needs a harbour release and the harbour needs her receipt. The mats have rented more rooms than I have. |
| `mornay_petren_shaw` | Petren Shaw | `MORNAY_DOCK_STEPS_MAP` | warehouse carpenter | Standing; faces left | I build crates all day and mend our stair rail after supper. Gessa says a broken rail is a workplace hazard. I said she should tell my landlord that. |
| `mornay_dossa_marr` | Dossa Marr | `MORNAY_MIDDLE_UPPER_WEST_MAP` | porter | Standing; faces right | Hands clear. There's no spare set in the stores. |
| `mornay_vannic_hale` | Vannic Hale | `MORNAY_MIDDLE_UPPER_WEST_MAP` | scale keeper | Standing; faces down | Corvin at Calwick once caught a discrepancy in a damaged scale. I hear that story whenever I check ours. Useful lesson. Less useful when someone tells it while leaning on the pan. |
| `mornay_fenna_orl` | Fenna Orl | `MORNAY_MIDDLE_UPPER_WEST_MAP` | packet runner | Standing; faces left | Drynport packet copies go in this bundle; local receipts in that one. Put them together and somebody will send a sack of onions halfway round the lake for a signature. |
| `mornay_hobb_tress` | Hobb Tress | `MORNAY_MIDDLE_UPPER_WEST_MAP` | sack patcher | Standing; faces down | Gessa wants every grain sack patched before it leaves. Good. The little flour drifting out along the road belongs in somebody's supper. |
| `mornay_pella_dorn` | Pella Dorn | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | print seller | Standing; faces left | Recipes, petitions, weather sheets. Edrin knows what I sell. A rival called them Reclaimer instructions and the watch took the lot. They have not returned the recipes either. |
| `mornay_orna_bex` | Orna Bex | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | vegetable seller | Standing; faces down | The dry spell has made the small onions smaller. Same journey, same cart charge. Bent ones cost less; sound ones don't become bent because you dislike the price. |
| `mornay_micah_wren` | Micah Wren | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | honey dealer | Standing; faces down | Honey. Local, and you can taste it. The finest northern sugar can cost more than gold by weight. Mrs Vale has some. I expect she keeps a close eye on her spoon. |
| `mornay_sova_kern` | Sova Kern | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | cobbler's runner | Standing; faces up | Hesta wants these boots back before the morning hiring. Their owner has one good pair and one chance to look ready. I'll take the short street. |
| `mornay_evin_rusk` | Evin Rusk | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | market inspector | Standing; faces right | Stamped measures, please. A gold piece buys the same weight whoever holds it. I would like that to be true at every counter in Mornay. |
| `mornay_talma_noll` | Talma Noll | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | basket seller | Standing; faces down | Fen reeds make a sound basket if you cut and dry them properly. My customers know that. The freight office insists I describe them as manufactured goods. |
| `mornay_ressa_muir` | Ressa Muir | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | shopper | Standing; faces right | Orna's onions, Niva's fish, then home. On Dayoff I sometimes buy a little mushroom wine. A person ought to have one errand they look forward to. |
| `mornay_dolen_weir` | Dolen Weir | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | street sweeper | Patrol; faces down | Keep moving, please. The fish water reaches this gutter before the carts do. |
| `mornay_ansel_crowe` | Ansel Crowe | `MORNAY_SOUTH_ROWS_UNIT_2_MAP` | music teacher | Seated; faces left | Everyone wants Erik Jontek's 'Shut Up and Kiss Me' tune. Vessa can play it by ear; I am still trying to persuade my pupils to count the opening beats. |
| `mornay_belli_hume` | Belli Hume | `MORNAY_SOUTH_ROWS_UNIT_10_MAP` | child keeping house | Standing; faces right | Della needs me at home today. Washing, then the market, then more washing. I borrowed a reader, but my hands keep getting it wet. |
| `mornay_carden_firth` | Carden Firth | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | cloth buyer | Standing; faces left | A client wanted a coat in the latest Academy fashion. I showed her a good warm weave. She bought the fashionable one and came back for a lining. |
| `mornay_vessa_auld` | Vessa Auld | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | petition copyist | Standing; faces up | Mera Dren had neighbours, measurements and a clerk to help. People remember the petition and forget the help. Tell me what happened before paying me to make it sound official. |
| `mornay_torren_glass` | Torren Glass | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | waiting claimant | Standing; faces left | I brought measurements, just like Mera Dren. Arlis sent me to Maura; Maura sent me back. The woman in the schoolbook got an engineer. I would settle for one answer. |
| `mornay_helma_quist` | Helma Quist | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | office cleaner | Standing; faces left | They had the public benches repaired after a visiting official caught his coat. Our stairs have been loose since winter. |
| `mornay_arven_beck` | Arven Beck | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | courier | Patrol; faces down | Calwick, Drenwick, then the fen road. The cable scow keeps the letters moving while they repair that causeway. I have carried several notices explaining how temporary it is. |
| `mornay_nerit_wold` | Nerit Wold | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | examination candidate | Standing; faces up | The examination is open to everyone. The Collegium's practice papers aren't. I borrow Ulric Dane's old exercises after my shift; he marks them while I mend his fire. |
| `mornay_sella_croft` | Sella Croft | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | licence applicant | Standing; faces up | Corven says my licence needs the old receipt. The old receipt went down with the boat. Apparently that is the boat's responsibility. |
| `mornay_garren_yew` | Garren Yew | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | document carrier | Standing; faces left | The ribbon means untouched, not unimportant. |
| `mornay_edda_purl` | Edda Purl | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | notice reader | Standing; faces up | The notice says petitions may be submitted by any resident. Vessa helped me read the smaller bit about copies. I can manage the first part myself now. |
| `mornay_varek_linn` | Varek Linn | `MORNAY_MIDDLE_UPPER_EAST_MAP` | waterworks overseer | Standing; faces right | The public hydrographic office is closed. Repairs still have to be measured. Hessa and Ketta do that work in all weathers. |
| `mornay_hessa_dorr` | Hessa Dorr | `MORNAY_MIDDLE_UPPER_EAST_MAP` | survey assistant | Standing; faces left | Ketta reads the gauge; I check the bank. Old water marks matter more than a captain's memory. The public survey office is closed; harbour enquiries go to Maura. |
| `mornay_nollis_vane` | Nollis Vane | `MORNAY_MIDDLE_UPPER_EAST_MAP` | drainage worker | Standing; faces up | Less water doesn't mean less work. Silt stays where the current used to shift it. The men waiting for a full scow think we can clear the channel by arguing with it. |
| `mornay_ketta_roy` | Ketta Roy | `MORNAY_MIDDLE_UPPER_EAST_MAP` | gauge reader | Standing; faces right | The Thornmere reports are low again. Our own readings go in a separate book. Two falling gauges aren't an explanation; they are two things somebody needs to understand. |
| `mornay_ossa_fenwick` | Ossa Fenwick | `MORNAY_MIDDLE_UPPER_EAST_MAP` | pipe fitter | Standing; faces left | The contract covers the pipe. Excavating to reach the pipe is apparently a separate contract. I am waiting for a signature. |
| `mornay_derren_kest` | Derren Kest | `MORNAY_MIDDLE_UPPER_EAST_MAP` | water carrier | Patrol; faces down | I fill these at the pump, not off the quay. Hanne at the infirmary checks. The lake being fresh water doesn't make everything that drains into it good to drink. |
| `mornay_berrit_fane` | Berrit Fane | `MORNAY_MIDDLE_LOWER_WEST_MAP` | cart-yard foreman | Standing; faces up | Hiring is at the East Gate. I need two sober hands tomorrow, if the freight clears. Do not pay a middleman to hear that. |
| `mornay_helven_moss` | Helven Moss | `MORNAY_MIDDLE_LOWER_WEST_MAP` | carter | Standing; faces right | Berrit wants the Drynport consignment moved before dark. Torlin has my spare wheel. Between them they've arranged my whole day without giving me a sound cart. |
| `mornay_iset_brill` | Iset Brill | `MORNAY_MIDDLE_LOWER_WEST_MAP` | peat seller | Standing; faces right | Peat for the smokers, reeds for packing. Calwick sends the same sort of loads through the canals. Nobody puts that on a fine school map, but towns still need fuel. |
| `mornay_jessa_fallow` | Jessa Fallow | `MORNAY_MIDDLE_LOWER_WEST_MAP` | harness maker | Standing; faces left | Rurik keeps bringing me the same worn strap. I patch it while he saves for a new one. His mule gets Dayoff more reliably than either of us. |
| `mornay_rurik_dean` | Rurik Dean | `MORNAY_MIDDLE_LOWER_WEST_MAP` | teamster | Standing; faces left | The raised road keeps the wheels out of the fen. It also means every cart meets every other cart on the same dry strip. My mule has become very patient with fools. |
| `mornay_vela_thorne` | Vela Thorne | `MORNAY_MIDDLE_LOWER_WEST_MAP` | freight cook | Standing; faces down | A bowl for Kelda too. Her injury happened in this yard; the yard can feed her while they argue about wages. |
| `mornay_dennet_vale` | Dennet Vale | `MORNAY_MIDDLE_LOWER_WEST_MAP` | stores checker | Standing; faces right | One crate of medicine gets a clerk's escort. Ten loads of peat get me and a borrowed cart. I know which is worth more. I also know what heats the clerk's room. |
| `mornay_mora_wist` | Mora Wist | `MORNAY_MIDDLE_LOWER_WEST_MAP` | yard messenger | Patrol; faces down | Berrit sends me to Hal, Hal sends me to Varda, Varda says Berrit has the paper. I can do the whole circuit before the soup goes cold now. |
| `mornay_kelda_frey` | Kelda Frey | `MORNAY_MIDDLE_LOWER_WEST_MAP` | injured porter | Standing; faces right | The foreman remembers the fall. The contractor remembers employing someone else. Yara says the ankle will take time. |
| `mornay_adra_kelm` | Adra Kelm | `MORNAY_KELM_HOME_MAP` | provisioner's assistant | Standing; faces left | My brother keeps the shop; I keep our supper out of his stock tally. Neris tried counting the kitchen salt once. He won't do it twice. |
| `mornay_henric_sorn` | Henric Sorn | `MORNAY_SORN_HOME_MAP` | workgear hawker | Standing; faces right | Hesta sells downstairs and I take the repaired gear round the yards. My sister says supper starts when I put the tools away. Berren is watching me closely. |
| `mornay_malva_teel` | Malva Teel | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | secondhand bookseller | Standing; faces up | Old examination books, half price. The sums still work. Check the law questions with Mr Dane before trusting a dead clerk's certainty. |
| `mornay_iven_bellows` | Iven Bellows | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | knife sharpener | Standing; faces right | I sharpen fish knives and removal crews' blades on the same stone. Both customers need a clean edge. Only one insists on telling me the whole fight. |
| `mornay_essie_rann` | Essie Rann | `MORNAY_RANN_HOME_MAP` | seamstress | Seated; faces left | Jorra can sew a straight seam now. The work comes from dock families, mostly: cuffs, blankets, a coat made to last another winter. She gets her share when I am paid. |
| `mornay_pelren_oxley` | Pelren Oxley | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | customer | Standing; faces left | A coat for a Mornay winter, please. Not one for a gentleman walking between warm rooms in Halcyra. The lake doesn't care how well I look on arrival. |
| `mornay_theda_wark` | Theda Wark | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | lamp oil carrier | Patrol; faces down | Nerit needs lamp oil for his examination reading. He asked for the smallest measure. I found a bottle that lets him carry every drop home. |
| `mornay_corlen_brume` | Corlen Brume | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | sign painter | Standing; faces down | A merchant asked for Stonehaven grey. I told him Stonehaven says it is still grey. He paid more for the words on the pot than the colour on his sign. |
| `mornay_nella_gant` | Nella Gant | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | shop sweeper | Standing; faces right | People wipe their feet while entering. Leaving seems to inspire trust. |
| `mornay_tavi_rusk` | Tavi Rusk | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | compositor | Standing; faces up | My uncle prints what he is paid to print. Do not put my words in his mouth. If you want work copied, ask at the front bench. |
| `mornay_dalen_hesk` | Dalen Hesk | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | cooper | Standing; faces right | Fish barrels must stay tight all the way to Drynport. The empty ones come back with three different owners' marks. I know my own work by the hoops. |
| `mornay_savra_linnet` | Savra Linnet | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | forge striker | Standing; faces right | Cerren judges a weld by the sound. I keep the blows steady. Visitors ask whether we use resonance. Mostly we use a second pair of hands and stop before we're too tired. |
| `mornay_orenna_flint` | Orenna Flint | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | potter | Standing; faces left | Plain jars for Melva, bowls for Rella. The fine northern houses want matching cups. I make those after the orders people need tomorrow. |
| `mornay_breck_yarrow` | Breck Yarrow | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | carpenter apprentice | Standing; faces left | They give repair work to boys when the lake trade slows. Master stays until I finish. He says replacing fingers ruins the saving. |
| `mornay_ilma_dace` | Ilma Dace | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | dyer | Standing; faces down | Blue-grey for lake crews, dark cuffs for office wear. A Collegium parent wanted white. I asked whether her son intended to touch anything while he was dressed. |
| `mornay_korrin_ashe` | Korrin Ashe | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | workshop runner | Patrol; faces down | Everybody's urgent parcel is waiting for somebody else's. |
| `mornay_verda_pike` | Verda Pike | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | furniture repairer | Standing; faces right; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_14_MAP` | I mend the chairs families bring here instead of throwing away. That one has served three children learning their letters. I would like it to survive a fourth. |
| `mornay_ysol_reed` | Ysol Reed | `MORNAY_SOUTH_ROWS_UNIT_19_MAP` | grandmother | Standing; faces left | The children keep this place going. Officials call it a choice about school. Choosing between a lesson and somebody's supper is a mean sort of choice. |
| `mornay_tessa_glyn` | Tessa Glyn | `MORNAY_DOCK_STEPS_UNIT_4_MAP` | home seamworker | Seated; faces left | Harlis says Maris reads the office replies now. Mine is still young enough to think paper is for eating. I keep the rent notice high up for both our sakes. |
| `mornay_loric_mallow` | Loric Mallow | `MORNAY_DOCK_STEPS_UNIT_1_MAP` | kettle repairer | Standing; faces left | People bring me kettles before they buy new ones. The good repair money comes after a freight payday. Lately I have been waiting with everybody else. |
| `mornay_enna_quist` | Enna Quist | `MORNAY_DOCK_STEPS_UNIT_1_MAP` | tenant | Seated; faces right | The upstairs family practise that Jontek dance on Dayoff. I am happy for them. I would be happier if happiness came down a little more softly through the ceiling. |
| `mornay_ferin_wold` | Ferin Wold | `MORNAY_SCHOOL_MAP` | pupil | Standing; faces left; Dayoff: `MORNAY_DOCK_STEPS_UNIT_4_MAP` | I drew the cable scow at the broken causeway. Oren said the cable needed to reach both banks. Mine did. The people kept falling off the edge of the paper. |
| `mornay_bessa_marrin` | Bessa Marrin | `MORNAY_MIDDLE_LOWER_EAST_MAP` | yard gardener | Standing; faces left | We keep kitchen herbs in the yard and share them. Melva says she needs measured quantities for medicine. Fair enough; I measure supper by who's coming home. |
| `mornay_sima_wold` | Sima Wold | `MORNAY_SOUTH_UPPER_WEST_MAP` | inn proprietor on errands | Standing; faces up | Rella keeps the inn running. People leave letters there for neighbours who cannot safely receive them at work. A closed envelope is still closed when an officer holds it. |
| `mornay_gerris_cove` | Gerris Cove | `MORNAY_SOUTH_UPPER_WEST_MAP` | itinerant repairer | Standing; faces right | Drenwick has the same loose hinges as Mornay, just fewer stairs between them. I bring small tools. There is always somebody with a door they have been meaning to mend. |
| `mornay_rona_kett` | Rona Kett | `MORNAY_SOUTH_UPPER_WEST_MAP` | bread carrier | Standing; faces right | The warm loaves go first. I carry the disappointment home. |
| `mornay_hollis_pate` | Hollis Pate | `MORNAY_PATE_HOME_MAP` | retired cook | Seated; faces right | At the inn I learnt to boil water before worrying about seasoning. Selven would approve. Sit down if your feet hurt; supper can have another opinion at the table. |
| `mornay_tilda_mere` | Tilda Mere | `MORNAY_SOUTH_UPPER_WEST_MAP` | dockworker's sister | Standing; faces left | Dena remembers everyone's wages and forgets her own lunch. |
| `mornay_vennel_saye` | Vennel Saye | `MORNAY_COURT_UNIT_3_MAP` | clerk's parent | Standing; faces left | Edrin passed his examinations at this table. We cleared the supper things so he could study. I am proud of him. It would still be nice to receive an ordinary letter. |
| `mornay_kessa_tern` | Kessa Tern | `MORNAY_SOUTH_ROWS_MAP` | boardinghouse maid | Standing; faces right | Twenty-four units. Four workdays of empty rooms and children keeping the others going. On Dayoff the grown-ups come back and ask why the water's cold. |
| `mornay_orvin_clay` | Orvin Clay | `MORNAY_SOUTH_UPPER_WEST_MAP` | furniture mover | Standing; faces left | It came through that door once. This comforts nobody. |
| `mornay_jalda_firth` | Jalda Firth | `MORNAY_SOUTH_ROWS_UNIT_4_MAP` | travelling aunt | Seated; faces left | My nephew passed the Civic Examination and waited a year for a vacancy. His first letter was all about the desk. His second asked whether I could send a warm blanket. |
| `mornay_fenric_dorr` | Fenric Dorr | `MORNAY_SOUTH_UPPER_EAST_MAP` | road guide | Standing; faces right | For Calwick, keep to the raised fen road and ask after the crossings. A dry month doesn't turn the marsh into firm ground. I've seen people learn that with a loaded cart. |
| `mornay_selma_greaves` | Selma Greaves | `MORNAY_SOUTH_UPPER_EAST_MAP` | lunch seller | Patrol; faces down | Sit and eat. Vela sends the empty bowls back from the yard, so I know how many hands got hired. Fewer bowls this week. More people asking the price first. |
| `mornay_torva_dale` | Torva Dale | `MORNAY_SOUTH_UPPER_EAST_MAP` | pack repairer | Standing; faces left | The strap failed where you kept telling yourself it would hold. |
| `mornay_ilda_stern` | Ilda Stern | `MORNAY_STERN_HOME_MAP` | traveller | Seated; faces right | My sister Melva keeps a bed for me above her shop. I saved for a rail journey once, then spent it on our mother's roof. Mother says the view from a dry room is quite good. |
| `mornay_brannic_hume` | Brannic Hume | `MORNAY_SOUTH_UPPER_EAST_MAP` | wagon guard | Standing; faces right | The merchant's letter travels ahead. I guard the load that follows. He has already complained from his inn that we are late. We met the same shallow channel as everyone else. |
| `mornay_melli_voss` | Melli Voss | `MORNAY_SOUTH_ROWS_UNIT_11_MAP` | child keeping house | Standing; faces left | The school bell means turn the washing. The next one means put the kettle on. I can hear every lesson starting from here. |
| `mornay_oswen_lark` | Oswen Lark | `MORNAY_SOUTH_UPPER_EAST_MAP` | letter writer | Standing; faces down | Elva sends gold to her son when the crew is idle. He sends it back when he's paid. I write the letters and leave the little quarrel about who needs it more exactly as they say it. |
| `mornay_delra_tress` | Delra Tress | `MORNAY_SOUTH_UPPER_EAST_MAP` | jug seller | Standing; faces right | Hold the base as well. That advice comes free. |
| `mornay_jessa_nair` | Jessa Nair | `MORNAY_WEST_GATE_MAP` | watch sergeant | Standing; faces left | Keep the gateway clear. We have orders to ask about Reclaimer printers. A labour complaint is not an answer to that question, whatever some employers tell us. |
| `mornay_anric_fell` | Anric Fell | `MORNAY_WATCHHOUSE_MAP` | custody constable | Standing; faces right | Keep your coins. Every name goes in the book, every bruise gets written down. Hadrin can call that troublesome if he likes. The rear door stays locked; visits need written authority. |
| `mornay_porrin_beck` | Porrin Beck | `MORNAY_WEST_GATE_MAP` | road porter | Patrol; faces down | Rella keeps a chair near the inn door for people who have walked the fen road. I'll get this bag there. Its owner is coming at his own pace. |
| `mornay_vilda_thorn` | Vilda Thorn | `MORNAY_WEST_GATE_MAP` | returning resident | Standing; faces left | A week in Calwick and I could hear myself think. Here the carts start before dawn. I missed the noise, though I won't admit that to my neighbours. |
| `mornay_dalven_rill` | Dalven Rill | `MORNAY_EAST_GATE_MAP` | freight watch | Standing; faces right | Declare the load before unloading. If someone offers to lose the excise copy for a fee, remember whose hand took the money. |
| `mornay_meret_shaw` | Meret Shaw | `MORNAY_EAST_GATE_MAP` | wagon checker | Standing; faces down | A loose wheel is not a local administrative custom. |
| `mornay_varen_noll` | Varen Noll | `MORNAY_EAST_GATE_MAP` | delivery driver | Patrol; faces down | A parcel for Mrs Vale, another for the shared court. The first has a seal and three lines of address. The second says 'ask Selda'. Selda is usually quicker. |
| `mornay_hilda_vane` | Hilda Vane | `MORNAY_EAST_GATE_MAP` | animal minder | Standing; faces right | Let him smell your hand. He has had a day of strangers. |
| `mornay_cressa_mote` | Cressa Mote | `MORNAY_EAST_GATE_MAP` | exhausted traveller | Seated; faces right | Drynport is all steps and bridges. I thought I would have a rest from climbing in Mornay. Della says the room she has is upstairs. Of course it is. |
| `mornay_marit_voss` | Marit Voss | `MORNAY_OFFICE_MAP` | Regional Magistrate | Standing; faces down | Magistrate Voss. Your Supervisor answers to this office. Regional work requires regional priorities; urgency is not something a visitor declares. |
| `mornay_inessa_cray` | Inessa Cray | `MORNAY_OFFICE_MAP` | reception clerk | Standing; faces down | Enquiries before luncheon. Corrections after luncheon. The Magistrate's contractors do not need an appointment. |
| `mornay_halden_quill` | Halden Quill | `MORNAY_OFFICE_MAP` | records supervisor | Standing; faces down | I have a backlog. Moving a file to the urgent shelf creates a different backlog. At least this one is in alphabetical order. |
| `mornay_bera_senn` | Bera Senn | `MORNAY_OFFICE_MAP` | payments clerk | Standing; faces down | The copying fee is posted. Our approved expediter charges separately. He is the Magistrate's cousin, but you needn't put that on the form. |
| `mornay_eldric_fane` | Eldric Fane | `MORNAY_OFFICE_MAP` | requisitions clerk | Standing; faces down | The contractor has been paid. If the supplies are missing, fetch his explanation. I am not walking over there to be told the same thing. |
| `mornay_novra_dain` | Novra Dain | `MORNAY_OFFICE_MAP` | registration administrator | Standing; faces down | The school register is the school's responsibility. If the children aren't there, Oren can send another return. I do not visit homes. |
| `mornay_coris_wren` | Coris Wren | `MORNAY_OFFICE_MAP` | archive assistant | Standing; faces right | Old freight books record water levels beside the loads. Ketta asked for copies. I leave the mud stains in the margins; sometimes they tell you why the clerk stopped writing. |
| `mornay_lenva_purl` | Lenva Purl | `MORNAY_OFFICE_MAP` | appointment clerk | Standing; faces left | The Magistrate has no vacant appointments. A contractor cancelled one, but I am holding it in case he changes his mind. |
| `mornay_torben_clay` | Torben Clay | `MORNAY_OFFICE_MAP` | building porter | Standing; faces left | That door sticks. Please blame the door before the Empire. |
| `mornay_messa_yule` | Messa Yule | `MORNAY_OFFICE_MAP` | copy clerk | Seated; faces left | The contractor's letters get two copies and red string. Everyone else gets the end of the spool. |
| `mornay_arlis_rook` | Arlis Rook | `MORNAY_OFFICE_MAP` | infrastructure liaison | Standing; faces down | The hoist certificate is a contractor matter. If Gessa contests it, she must provide another inspection. This desk cannot suspend an authorized contract on hearsay. |
| `mornay_wenda_flax` | Wenda Flax | `MORNAY_OFFICE_MAP` | payroll petitioner | Standing; faces right | Three weeks of unpaid work. Bera says the signature is missing. My replacement had somebody to speak for him; his pay went through. I have brought my own timesheets again. |
| `mornay_corven_dace` | Corven Dace | `MORNAY_OFFICE_MAP` | regional investigator | Standing; faces down | Field visits raise questions. Questions require reports. I clear a great deal more work if I stay at my desk. |
| `mornay_helis_tarn` | Helis Tarn | `MORNAY_OFFICE_MAP` | archive conservator | Standing; faces up | We dry the books a few leaves at a time. The oldest water records are the first people ask for when the water behaves strangely. They were less interested in paying to keep the roof sound. |
| `mornay_nerin_gant` | Nerin Gant | `MORNAY_OFFICE_MAP` | regional investigator | Standing; faces up | I am reviewing the last review. There is no approved allowance for another field visit this quarter. |
| `mornay_vessa_lund` | Vessa Lund | `MORNAY_OFFICE_MAP` | public assistant | Standing; faces left | Take a number. Keep your place. If a desk sends you back here, take another number; the first enquiry has been dealt with. |
| `mornay_yara_kelm` | Yara Kelm | `MORNAY_INFIRMARY_MAP` | senior nurse | Standing; faces left | Rest is treatment. Nessa brings clean linen when the stores run short; I do not ask whose meetings she attends. No one gets to use a patient's bed as a political favour. |
| `mornay_selven_orr` | Selven Orr | `MORNAY_INFIRMARY_MAP` | physician | Standing; faces down | We clean, bind and watch the wound. The ward charges one gold for each point of health restored. You may pay for what you can afford. Tell me who needs care. |
| `mornay_hanne_brist` | Hanne Brist | `MORNAY_INFIRMARY_MAP` | infirmary steward | Standing; faces down | Eight beds, clean water and enough linen to change them. Those are my first requests. Yara can make a small stock last, but she shouldn't have to do it every week. |
| `mornay_elrin_vey` | Elrin Vey | `MORNAY_INFIRMARY_MAP` | registered Bloommarked healer | Standing; faces down | I am the registered Bloommarked healer. Resonance can support damaged tissue; it cannot replace a clean wound, food or sleep. Selven directs the care. I cannot mend a working life in an afternoon. |
| `mornay_jonna_mire` | Jonna Mire | `MORNAY_INFIRMARY_MAP` | dispenser | Standing; faces right | Melva's potions can keep a hurt traveller on their feet long enough to reach us. They haven't put a broken bone back together on the road. Selven still needs to examine it. |
| `mornay_padris_kett` | Padris Kett | `MORNAY_INFIRMARY_MAP` | orderly | Standing; faces left | Fressa got home, then found she couldn't manage the stairs. We practised them here before she tried again. People think leaving the ward is the end of the work. |
| `mornay_lessa_fern` | Lessa Fern | `MORNAY_INFIRMARY_MAP` | trainee nurse | Standing; faces right | Yara makes me wash again when I touch the wrong cloth. I used to think she was being severe. Then I watched how carefully she does it herself, even after a whole night here. |
| `mornay_nevin_brack` | Nevin Brack | `MORNAY_INFIRMARY_MAP` | patient with crushed foot | Seated; faces right | The hoist slipped. Gessa stopped the shift; the owner says she overreacted. I would like him to stand on this foot before deciding. |
| `mornay_elma_pike` | Elma Pike | `MORNAY_SOUTH_ROWS_UNIT_4_MAP` | patient's partner | Standing; faces right | Nevin wants to get back to the quay. I want him to be able to stand without gripping the bed. Gessa sent word that she knows which of us is right. |
| `mornay_dorran_bale` | Dorran Bale | `MORNAY_INFIRMARY_MAP` | recovering boat hand | Seated; faces left | Something struck us on the fen road. I did not see enough to give it a name. The nurse needs the wound cleaned, not another story about it. |
| `mornay_mirren_ashe` | Mirren Ashe | `MORNAY_SOUTH_ROWS_UNIT_3_MAP` | exhausted caregiver | Standing; faces left | The ward sent Fressa home with instructions I can read. That helps. A neighbour takes my place when I need the market. I am beginning to get a little sleep again. |
| `mornay_vela_rinn` | Vela Rinn | `MORNAY_INFIRMARY_MAP` | cook | Standing; faces right; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_23_MAP` | Broth, soft grain, a little mushroom when Selven allows it. Good food for getting your strength back. I save the mushroom wine for my own Dayoff. |
| `mornay_jessin_corst` | Jessin Corst | `MORNAY_INFIRMARY_MAP` | linen orderly | Standing; faces up; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_22_MAP` | Fenric brings linen from Nessa's laundry. I count the clean sheets before the beds need changing. We've learnt not to wait for the accounts office to finish agreeing with itself. |
| `mornay_teren_lume` | Teren Lume | `MORNAY_INFIRMARY_MAP` | night nurse | Standing; faces right | More road injuries this month. More lifting injuries too. We record both; counting only the frightening ones would leave half the beds unexplained. |
| `mornay_orla_nair` | Orla Nair | `MORNAY_INFIRMARY_MAP` | watch constable visiting colleague | Standing; faces left | She complains properly now. That is an improvement. |
| `mornay_fressa_dean` | Fressa Dean | `MORNAY_SOUTH_ROWS_UNIT_3_MAP` | discharged patient | Seated; faces left | Yara says a little more walking each day. Mirren waits at the landing so I don't have to pretend I am managing. I'd like to carry her shopping again someday. |
| `mornay_pelda_hesk` | Pelda Hesk | `MORNAY_INFIRMARY_MAP` | patient's mother | Standing; faces right | They explained the dressing slowly, then let me practise. I had expected to be sent away until visiting time. Now I can do something useful when he comes home. |
| `mornay_vanis_teal` | Vanis Teal | `MORNAY_INFIRMARY_MAP` | infirmary accountant | Standing; faces left | The ordinary ward accounts for nearly all our work. The resonance allocation is limited. People hear the healer's title and imagine we have no other expenses. |
| `mornay_neris_kelm` | Neris Kelm | `MORNAY_PROVISIONER_MAP` | provisioner | Standing; faces down | Potion or bait? Prices are marked. Yara's infirmary order is already set aside; the counter stock is for anyone with the coin. |
| `mornay_eldra_fenn` | Eldra Fenn | `MORNAY_PROVISIONER_MAP` | stockkeeper | Standing; faces right | The jars nearest the front came first. This dry spell has delayed enough orders without us wasting the stock that did arrive. Check the seals before packing. |
| `mornay_pavin_marr` | Pavin Marr | `MORNAY_PROVISIONER_MAP` | counter assistant | Standing; faces down | If you need the small measure, ask for the small measure. |
| `mornay_linna_bexley` | Linna Bexley | `MORNAY_PATE_HOME_MAP` | household shopper | Standing; faces up | Hollis taught me to stretch a pot with grain and mushrooms. It works until the grain price rises too. Then we take turns pretending we wanted a smaller helping. |
| `mornay_heddin_wist` | Heddin Wist | `MORNAY_PROVISIONER_MAP` | travelling labourer | Standing; faces up | I can read the hiring notice, thanks to the Education Act. It says there may be work tomorrow. Reading it twice doesn't make it promise anything more. |
| `mornay_toria_brume` | Toria Brume | `MORNAY_PROVISIONER_MAP` | provision packer | Standing; faces right | These plain jars go to Yara's ward. I pack each one separately. A delayed boat is bad enough without delivering a box of broken medicine when it finally gets here. |
| `mornay_keven_muir` | Keven Muir | `MORNAY_PROVISIONER_MAP` | kitchen buyer | Standing; faces left | The Ledger House wants northern sugar for a guest. Odrin can make a good pudding with honey. The guest wants the expensive word on the bill as much as the taste. |
| `mornay_yenna_vetch` | Yenna Vetch | `MORNAY_SOUTH_ROWS_UNIT_1_MAP` | neighbour collecting order | Seated; faces right | Rissa watches my little ones while I collect our orders. I bring her mother's medicine back too. That's how two households manage an ordinary market morning. |
| `mornay_melva_stern` | Melva Stern | `MORNAY_APOTHECARY_MAP` | apothecary | Standing; faces down | Potions for the road, properly labelled compounds for the ward. Tell me what you need. None of these replaces cleaning a wound, and a larger dose isn't automatically a better one. |
| `mornay_arret_cole` | Arret Cole | `MORNAY_APOTHECARY_MAP` | apprentice | Standing; faces down | Melva has me copy the recipe before measuring anything. The reading lessons I complained about are proving useful. So is admitting when I can't make out a number. |
| `mornay_vessa_gorse` | Vessa Gorse | `MORNAY_APOTHECARY_MAP` | herb sorter | Standing; faces up | The dry spell changed what the collectors brought in. Melva tests each batch before we use it. A familiar leaf from stressed ground isn't a promise of familiar strength. |
| `mornay_nerrin_hale` | Nerrin Hale | `MORNAY_APOTHECARY_MAP` | sleepless customer | Standing; faces up; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_15_MAP` | The night shift ends when the schoolchildren start passing my window. I know their Mera Dren lesson almost by heart. I would prefer to learn it after sleeping. |
| `mornay_orel_quist` | Orel Quist | `MORNAY_APOTHECARY_MAP` | medicine courier | Standing; faces left | Some costly medicines travel by rail in the northeast. These go to the next district in my pack. Melva wraps the glass carefully; I pick my steps just as carefully. |
| `mornay_thelin_vole` | Thelin Vole | `MORNAY_APOTHECARY_MAP` | carpenter buying salve | Standing; faces left | I mend the dry walkways people use through the fen. One splinter and I am here buying salve. Hesta sold me good gloves. I had taken them off. |
| `mornay_rissa_yew` | Rissa Yew | `MORNAY_SOUTH_ROWS_UNIT_1_MAP` | caregiver | Standing; faces left | My mother thinks a bitter medicine must be doing more. I read Melva's directions aloud anyway. We have agreed the label gets a vote, even in her own house. |
| `mornay_dannet_pate` | Dannet Pate | `MORNAY_APOTHECARY_MAP` | bottle washer | Standing; faces left | Plain water isn't always clean water. Melva taught me that before she trusted me with a bottle. Now I spend half my time washing and the other half refusing to hurry it. |
| `mornay_hesta_sorn` | Hesta Sorn | `MORNAY_WORKGEAR_MAP` | workgear keeper | Standing; faces down | Working knives, road arms and gear we can repair. Try both boots. Your employer's promise to replace them is not payment. |
| `mornay_morren_flint` | Morren Flint | `MORNAY_WORKGEAR_MAP` | fitter | Standing; faces down | A removal crew bought belts here last week. They asked about spare straps before asking about polish. I find that reassuring in people who mean to go back out into the fen. |
| `mornay_isa_marrin` | Isa Marrin | `MORNAY_WORKGEAR_MAP` | leatherworker | Standing; faces down | Jessa does the cart harness; I do belts and pack straps. We exchange scraps. Good leather costs too much to throw away because a piece is an awkward shape. |
| `mornay_fenris_roy` | Fenris Roy | `MORNAY_WORKGEAR_MAP` | dock recruit | Standing; faces up | Gessa said gloves, sound boots and no loose sleeves. The men outside offered several more expensive opinions. I think I will start with the woman who runs the shift. |
| `mornay_galda_thorn` | Galda Thorn | `MORNAY_WORKGEAR_MAP` | survey worker | Standing; faces right | Ketta needs the bank measured where the mud pulls your boots off. A new pair isn't a luxury if the old soles stay behind. Try explaining that on an expense form. |
| `mornay_perren_croft` | Perren Croft | `MORNAY_WORKGEAR_MAP` | repair customer | Standing; faces up | These boots survived three seasons on the canal banks. The cloth inside went first. Hesta repaired that instead of selling me a whole new pair; I came back for a reason. |
| `mornay_lorna_wark` | Lorna Wark | `MORNAY_WORKGEAR_MAP` | counter assistant | Standing; faces left | Sizes are on the shelf edge, not the shelf you wish were yours. |
| `mornay_dessin_bellows` | Dessin Bellows | `MORNAY_WORKGEAR_MAP` | pack stitcher | Standing; faces left | I stitched a hidden pocket for a courier's sealed papers. He wanted it dry, not secret. That is a harder promise on the fen road. |
| `mornay_hal_venn` | Hal Venn | `MORNAY_CHANDLER_MAP` | chandler and secondhand dealer | Standing; faces down | We sell outright and buy outright. Jarven keeps the public book. I will not name a seller because someone in a good coat asks. The object is what I value. |
| `mornay_elsra_firth` | Elsra Firth | `MORNAY_CHANDLER_MAP` | chandler's assistant | Standing; faces up | A lake boat wants rope, wick and spare fittings. A visitor asks why we don't get a railway. I ask which of those a railway would deliver to a boat in a squall. |
| `mornay_jarven_clay` | Jarven Clay | `MORNAY_CHANDLER_MAP` | secondhand clerk | Seated; faces left | No pledges for later redemption. An outright sale at the usual secondhand rate. Keep anything you cannot afford to lose. |
| `mornay_nessa_corst` | Nessa Corst | `MORNAY_CHANDLER_MAP` | sailor buying tools | Standing; faces up | I sold my tools when the crew was laid off. The drought has made us all very careful about cargo weight, except the rent man. These will have to earn their price again. |
| `mornay_veldin_greaves` | Veldin Greaves | `MORNAY_CHANDLER_MAP` | mate buying supplies | Standing; faces left | Oil, wick, a spare sounding line. Captain says we know the Drynport run. I would like the water to know it too before we stop checking. |
| `mornay_brissa_tern` | Brissa Tern | `MORNAY_SOUTH_ROWS_UNIT_20_MAP` | resident selling plate | Standing; faces right | The landlord calls the attic storage. I hear chairs after dark. Leave it alone, please. Some of us need what comes down those stairs. |
| `mornay_otrin_dain` | Otrin Dain | `MORNAY_CHANDLER_MAP` | repairer examining purchase | Standing; faces down | Stonehaven steel, if the old mark is honest. I'll judge the edge before paying for the name. There's useful work left in it either way. |
| `mornay_fennra_rill` | Fennra Rill | `MORNAY_CHANDLER_MAP` | candle maker | Standing; faces left | Nerit reads by lamplight; some of his neighbours buy my candle ends. Study costs something even when the examination doesn't. I save the longest pieces for them. |
| `mornay_rella_wold` | Rella Wold | `MORNAY_GATE_INN_MAP` | gate innkeeper and cook | Standing; faces down | Sima is on errands. Thirty gold for the party to rest. Shared rooms upstairs; keep your boots off the blankets. |
| `mornay_benric_cove` | Benric Cove | `MORNAY_GATE_INN_MAP` | serving worker | Standing; faces left | Dayoff brings half the ward in to talk. The crews still change shifts and the bowls still need washing. Rella gives us our rest in turns when the rush is over. |
| `mornay_delsa_quill` | Delsa Quill | `MORNAY_GATE_INN_MAP` | card player | Seated; faces right | The collection paid for food, not revenge. Some young fool proposed breaking a contractor's windows. Whose wages would replace the glass? |
| `mornay_torva_brin` | Torva Brin | `MORNAY_GATE_INN_MAP` | merchant's clerk | Seated; faces right | My employer travels with a Kethrin letter of credit. I carry enough gold for meals and keep every receipt. His paper opens accounts; mine explains why I ate supper. |
| `mornay_issen_dorr` | Issen Dorr | `MORNAY_GATE_INN_MAP` | roads worker | Seated; faces left | The causeway notices still say temporary. I've repaired enough road to know wet ground is difficult. I'd like the officials renewing the notice to spend a morning out there with us. |
| `mornay_pelda_wren` | Pelda Wren | `MORNAY_GATE_INN_MAP` | traveller | Seated; faces left | I asked for an ordinary inn. Rella found me a bed and someone showed me where the water was. After the fen road, being left in peace feels remarkably kind. |
| `mornay_orven_lume` | Orven Lume | `MORNAY_GATE_INN_MAP` | potter visiting market | Seated; faces right | Oren orders sturdy cups for the school. I bring a few extra; children happen. He pays for the order and returns the sound ones nobody needed. |
| `mornay_hessa_vane` | Hessa Vane | `MORNAY_PATE_HOME_MAP` | local regular | Standing; faces left | We used to watch river wrestling on Dayoff. Drenwick takes its holds and breaks seriously. I prefer a clean bout and somewhere warm afterward. |
| `mornay_vannic_nair` | Vannic Nair | `MORNAY_WATCHHOUSE_MAP` | watch guard | Seated; faces down; Dayoff at Wold’s Inn | Two shared cells, two singles. Ten beds if nobody doubles up. The yard takes deliveries before exercise, and the privy drains badly. We asked for repairs before the last lake storm. |
| `mornay_senric_teel` | Senric Teel | `MORNAY_GATE_INN_MAP` | kitchen boy | Standing; faces up | Marla taught me the chorus of that Jontek song. Rella says I may sing after I carry the soup. Apparently dancing while carrying it is not a useful new skill. |
| `mornay_marla_fallow` | Marla Fallow | `MORNAY_GATE_INN_MAP` | itinerant singer | Standing; faces left | I know the Jontek tune. Everybody knows the Jontek tune. If one person asks for an old canal song, I shall sing it with unreasonable gratitude. |
| `mornay_elva_brack` | Elva Brack | `MORNAY_DOCK_STEPS_UNIT_2_MAP` | sailor's mother | Seated; faces left | He sends money from Drynport when the crew is paid. I ask Oswen to write back about the kitchen and the neighbours. I want him to have a little of home, not just another bill. |
| `mornay_farren_moss` | Farren Moss | `MORNAY_GATE_BEDS_MAP` | travelling clerk | Standing; faces left | I passed the accounts examination and took the first vacancy. It was nowhere near home. They were quite right that Imperial service would let me see more of the province. |
| `mornay_idda_fane` | Idda Fane | `MORNAY_GATE_BEDS_MAP` | farm visitor | Standing; faces left | At home we stop when the weather lets us. Here they call the fifth day Dayoff and make plans. I like that. I would like to make a plan that survives the weather. |
| `mornay_ossen_mote` | Ossen Mote | `MORNAY_GATE_BEDS_MAP` | seasonal labourer | Standing; faces left | I cut reeds until the contractor stopped taking bundles. Berrit's yard may need hands tomorrow. My bed is the one with everything I own underneath; I keep it ready to move. |
| `mornay_velra_hume` | Velra Hume | `MORNAY_GATE_BEDS_MAP` | visiting seamworker | Standing; faces down | I brought a spare dress and have mended everybody else's. Rella put a meal aside for me. That wasn't the arrangement, but I was glad of it. |
| `mornay_jalin_reed` | Jalin Reed | `MORNAY_GATE_BEDS_MAP` | pack trader | Standing; faces left | A dealer offered me cheap imitation Bracelets. Said people would buy the promise even if the work was poor. I carry needles and buttons. They do what I say they do. |
| `mornay_nesset_yarrow` | Nesset Yarrow | `MORNAY_GATE_BEDS_MAP` | boat passenger | Standing; faces left | I came off the lake crossing wet to the knees. Rella found dry socks and asked no questions until I'd eaten. I shall remember Mornay rather better for that. |
| `mornay_brelna_ashe` | Brelna Ashe | `MORNAY_GATE_BEDS_MAP` | student applicant | Standing; faces right | I can pass the Collegium's reading exercises. Father can pay for the journey here. We haven't yet found anyone who treats those two facts as enough for a place. |
| `mornay_corra_purl` | Corra Purl | `MORNAY_GATE_BEDS_MAP` | housekeeper | Standing; faces up | A shared room still contains private belongings. Kindly remember that. |
| `mornay_gerta_vell` | Gerta Vell | `MORNAY_COMMERCIAL_INN_MAP` | commercial innkeeper | Standing; faces down | Forty gold for the party to rest at the Ledger House. Quiet rooms upstairs. We have commercial guests who need their sleep. |
| `mornay_odrin_vale` | Odrin Vale | `MORNAY_COMMERCIAL_INN_MAP` | cook | Standing; faces right | Good honey, fruit, a little patience. That's the pudding. The guest who wanted northern sugar asked for a second helping before remembering to complain. |
| `mornay_lessa_crowe` | Lessa Crowe | `MORNAY_COMMERCIAL_INN_MAP` | server | Standing; faces left | The passengers argue about which capital is grander. Lumina for beauty, Halcyra for importance. Neither party has yet noticed who brought their supper. |
| `mornay_harnet_brill` | Harnet Brill | `MORNAY_COMMERCIAL_INN_MAP` | lake skipper | Seated; faces right | A passenger called the Valmere a big pond. We passed the headland and took water over the bow for an hour. He calls it the inland sea now. The water hasn't changed its opinion of him. |
| `mornay_nessa_wren` | Nessa Wren | `MORNAY_COMMERCIAL_INN_MAP` | deckhand | Seated; faces left | They wrestle in moving water at Drenwick. On this lake I spend my wages trying to stay out of it. I'll watch a bout from the bank, thanks. |
| `mornay_elda_wick` | Elda Wick | `MORNAY_COMMERCIAL_INN_MAP` | sailmaker | Seated; faces right | Three crews asked for sail repairs on credit. Tobin and I share the small jobs so both workshops keep going. Trust matters. So does having enough gold to buy the thread. |
| `mornay_corvinna_dale` | Corvinna Dale | `MORNAY_COMMERCIAL_INN_MAP` | cargo passenger | Seated; faces right | Earlier in the journey, my client took the rail with samples and a contract. I am travelling with the actual cloth. When he asks where I've been, I shall tell him where his profit was waiting. |
| `mornay_pelren_sill` | Pelren Sill | `MORNAY_COMMERCIAL_INN_MAP` | crew cook | Seated; faces down | No crew to feed until morning. Odrin brought out a bowl and didn't ask me to improve it. It is a pleasure to be somebody else's hungry customer for once. |
| `mornay_vessa_kest` | Vessa Kest | `MORNAY_SOUTH_ROWS_UNIT_2_MAP` | local musician | Standing; faces right | Ansel teaches the notes; I teach his pupils the canal songs their parents request. On Dayoff we manage a whole room between us, provided nobody argues about the verses. |
| `mornay_talric_gant` | Talric Gant | `MORNAY_COMMERCIAL_INN_MAP` | off-duty shipping clerk | Seated; faces left | I copied a Bethany traveller's letter for a shipping client. Terraces, gardens, starflowers shining after sunset. I'd like to see Skybloom someday without somebody dictating the description. |
| `mornay_jorra_vey` | Jorra Vey | `MORNAY_COMMERCIAL_BEDS_MAP` | boatswain | Standing; faces left | Wake me for departure. Leave improvements to the world until afterward. |
| `mornay_merdin_shaw` | Merdin Shaw | `MORNAY_DOCK_STEPS_UNIT_2_MAP` | deckhand | Standing; faces right | We practise tying knots. My wages still untie themselves. |
| `mornay_sella_dace` | Sella Dace | `MORNAY_COMMERCIAL_BEDS_MAP` | navigator's assistant | Standing; faces left | Drynport's quays change with the water. I mark the soundings before putting the chart away. The old chart isn't lying; it just hasn't been there lately. |
| `mornay_verren_noll` | Verren Noll | `MORNAY_COMMERCIAL_BEDS_MAP` | lake crewman | Standing; faces up | My daughter found Drynport on the school map and traced my crossing with her finger. I wish journeys were that simple. I send a letter whenever I can. |
| `mornay_brinna_beck` | Brinna Beck | `MORNAY_COMMERCIAL_BEDS_MAP` | freighter's mate | Standing; faces up | A shallower scow carries less, so a full warehouse doesn't mean full wages for us. People see the cargo waiting and think every crew must be busy. |
| `mornay_hessa_rann` | Hessa Rann | `MORNAY_COMMERCIAL_BEDS_MAP` | rope worker travelling home | Standing; faces left | Essie has kept a place for me at supper. I brought her good thread. If the packet is late, she'll feed everyone else and keep mine warm; she always does. |
| `mornay_torren_linn` | Torren Linn | `MORNAY_COMMERCIAL_BEDS_MAP` | cabin attendant | Standing; faces up | I scrub cabins, not navigate them. Nevertheless every passenger who sees a dark cloud asks me whether we shall arrive. I usually say the skipper would like to know too. |
| `mornay_elsven_pike` | Elsven Pike | `MORNAY_COMMERCIAL_BEDS_MAP` | crew member writing home | Seated; faces left; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_21_MAP` | I'm writing about the meal, the room, a child waving from the quay. My family knows the lake is dangerous. They deserve to hear something else about my days on it. |
| `mornay_oren_teal` | Oren Teal | `MORNAY_SCHOOL_MAP` | headteacher | Standing; faces down | The Empire teaches a child to petition, then charges the parent to have the words copied. I understand why the Reclaimers find listeners. I will not have children carrying their messages. |
| `mornay_nelda_quill` | Nelda Quill | `MORNAY_SCHOOL_MAP` | school administrator | Standing; faces down | The ward school is publicly funded. Boots and aprons still cost families money. Nessa brings what she can; Oren makes sure a missing apron doesn't become a missing pupil. |
| `mornay_hadria_beck` | Hadria Beck | `MORNAY_SCHOOL_MAP` | arithmetic teacher | Standing; faces down | Four workdays, then Dayoff. We count a week's pay and what the household needs. The children notice immediately when I give the example family more mouths than meals. |
| `mornay_serren_crowe` | Serren Crowe | `MORNAY_SCHOOL_MAP` | reading teacher | Standing; faces left | We read Mera Dren's petition and practise writing our own. The lesson is useful even if the official picture leaves everyone who helped her outside the frame. |
| `mornay_tessa_orr` | Tessa Orr | `MORNAY_SCHOOL_MAP` | classroom helper | Standing; faces right | A parent can choose whether to send a child to school. Some need help with work at home. I keep the missed reading ready; I would rather they came back than felt ashamed. |
| `mornay_perrin_mere` | Perrin Mere | `MORNAY_SCHOOL_MAP` | pupil | Seated; faces up | Aunt Dena says counting your pay is arithmetic you should practise. |
| `mornay_vella_corst` | Vella Corst | `MORNAY_SCHOOL_MAP` | pupil | Seated; faces up | Father says his boat is important even if it isn't on the big map. I told him Calwick isn't important enough for that map either. He said that was not helping. |
| `mornay_ivenna_sorn` | Ivenna Sorn | `MORNAY_SCHOOL_MAP` | pupil | Seated; faces up | Mera got the road moved thirty paces. I wrote thirteen by mistake. Hadria asked whether the village would still reach its water. I went back and checked. |
| `mornay_dorrie_firth` | Dorrie Firth | `MORNAY_SOUTH_ROWS_UNIT_12_MAP` | child keeping house | Standing; faces right | I missed the end of the Mera Dren lesson. Mother can't leave work and someone has to mend these stockings. I still want to know how the story ends. |
| `mornay_helren_pate` | Helren Pate | `MORNAY_SCHOOL_MAP` | pupil | Seated; faces up | Fort Ariel grows strawberries inside a warm circle in the polar cold. The book says nobody knows how she did it. I like a book that admits it doesn't know something. |
| `mornay_maris_glyn` | Maris Glyn | `MORNAY_SCHOOL_MAP` | pupil | Standing; faces left; Dayoff: `MORNAY_GLYN_HOME_MAP` | I read the Mera Dren story to my little brother. He wants the engineer in the picture too. Father says that's the first sensible complaint we've had all week. |
| `mornay_bessa_rook` | Bessa Rook | `MORNAY_SCHOOL_MAP` | parent | Standing; faces left | We can manage the ward school. The Collegium wants fees and preparation. My daughter asks what happens if she is clever enough but we are not rich enough. |
| `mornay_ellin_hesk` | Ellin Hesk | `MORNAY_SCHOOL_MAP` | caretaker | Standing; faces up | I learnt my letters late. These children have a place to learn before they start hauling and mending. I keep the roof sound; that is my part of the Education Act. |
| `mornay_verra_moss` | Verra Moss | `MORNAY_SCHOOL_MAP` | adult learner | Seated; faces up | I can read the levy notice myself now. I don't agree with it, but I know what it actually says. Oren says that's a better place to start an argument. |
| `mornay_edrin_saye` | Edrin Saye | `MORNAY_HARBOUR_MAP` | customs assessor | Standing; faces down | The Reclaimers use real grievances. That does not make every unlisted crate harmless. If Voss wants a cargo inquiry, she can send a signed request. We will not own her speculation. |
| `mornay_maura_dell` | Maura Dell | `MORNAY_HARBOUR_MAP` | harbour administrator | Standing; faces down | The town pays for quays, not Imperial enquiries. The IJC has an office for those. A large one, if you need directions. |
| `mornay_hassel_muir` | Hassel Muir | `MORNAY_HARBOUR_MAP` | manifest clerk | Standing; faces down | Write Thornmere if that's where the cargo started, not just Valmere province. A tax heading and a lake are different sorts of place. The next clerk needs to know which you mean. |
| `mornay_vessa_fenn` | Vessa Fenn | `MORNAY_HARBOUR_MAP` | fee clerk | Standing; faces down | Small consignments pay the minimum charge. Large ones spread it across more cargo. I did not write the schedule and cannot waive it. |
| `mornay_orris_teel` | Orris Teel | `MORNAY_HARBOUR_MAP` | berth scheduler | Standing; faces down | Drynport sends a departure estimate; Lowen writes it down as an arrival promise. Then two captains want the same water. I leave room in the schedule for weather. He calls it wasted space. |
| `mornay_dalen_wist` | Dalen Wist | `MORNAY_HARBOUR_MAP` | inspection officer | Standing; faces down | I have recorded the damaged hoist as awaiting inspection. It remains on the list. That is what the list is for. |
| `mornay_berra_yule` | Berra Yule | `MORNAY_HARBOUR_MAP` | customs copyist | Seated; faces left | Initial the correction here. I'll show you which box, but I can't sign it for you. People are afraid a small mistake will cost another journey. Sometimes they are right. |
| `mornay_neven_brume` | Neven Brume | `MORNAY_HARBOUR_MAP` | harbour messenger | Standing; faces left; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_24_MAP` | The scheduled packet waits over Dayoff. My legs don't. If Maura needs a reply from the quay before morning, she sends me with it. |
| `mornay_tilda_vole` | Tilda Vole | `MORNAY_HARBOUR_MAP` | waiting agent | Standing; faces up | A Kethrin credit letter doesn't unload a barge. My client finds that surprising every time. I have asked him to pay the waiting crew before writing another complaint. |
| `mornay_harnis_roy` | Harnis Roy | `MORNAY_HARBOUR_MAP` | barge master | Standing; faces up; Dayoff: `MORNAY_SOUTH_ROWS_UNIT_16_MAP` | I paid a broker for quick clearance. He knew which clerk was away before the harbour did. I am beginning to understand what I bought. |
| `mornay_elna_stern` | Elna Stern | `MORNAY_HARBOUR_MAP` | small trader | Standing; faces left | One little consignment of reed mats. The minimum charge takes more of my profit than a full boat's owner loses. Vessa understands the sum; she still has to collect it. |
| `mornay_corren_wark` | Corren Wark | `MORNAY_HARBOUR_MAP` | archive clerk | Standing; faces up | The freight books show where scows used to load fully. Now captains come in to argue with the old figures. I give them copies. They should have something better than memory to work from. |
| `mornay_delsin_orl` | Delsin Orl | `MORNAY_HARBOUR_MAP` | inspection assistant | Standing; faces up | I sat the internal examination after years of counting boxes. My supervisor noticed I could do the sums. I try to notice when the newer hands can do more than they're paid for. |
| `mornay_rissa_dane` | Rissa Dane | `MORNAY_HARBOUR_MAP` | vessel owner | Standing; faces up | I paid for a sound hull and a careful skipper. Mrs Vale says I could have bought a cheaper boat. Perhaps. I prefer to hear the crew complain about me in person. |
| `mornay_varda_fen` | Varda Fen | `MORNAY_WAREHOUSE_MAP` | warehouse supervisor | Standing; faces down | Bram catches missing sacks. I catch the arguments. The bonded annex is locked. Work in the public store does not authorize you beyond that door. |
| `mornay_helric_tress` | Helric Tress | `MORNAY_WAREHOUSE_MAP` | hoist operator | Standing; faces left | Gessa's signal means stop, even with a load hanging. Nevin is in the infirmary because someone wanted one more lift. No cargo is worth another man going there. |
| `mornay_istra_wick` | Istra Wick | `MORNAY_WAREHOUSE_MAP` | packing lead | Standing; faces up | Reed padding under the jars, heavy sacks below the light goods. We are sending this through two transfers before it leaves the fen channel. Pack for every pair of hands, not just ours. |
| `mornay_polren_hale` | Polren Hale | `MORNAY_WAREHOUSE_MAP` | salt porter | Standing; faces down | The fish needs salt and somebody has to bring it in. Plenty of water in the Valmere, no salt to take from it. The smokers wait for these sacks just as we wait for our pay. |
| `mornay_gessa_noll` | Gessa Noll | `MORNAY_WAREHOUSE_MAP` | grain checker | Standing; faces up | A merchant described the rich Lume floodplain to me while I checked his grain. I said rich grain still spoils if he leaves it in a wet sack. He let me finish checking. |
| `mornay_merrit_dace` | Merrit Dace | `MORNAY_WAREHOUSE_MAP` | freight scribe | Standing; faces left | I write down what passes the door. Bram keeps his own count. Two records are useful when somebody decides a missing sack must have been a careless labourer's fault. |
| `mornay_arla_rill` | Arla Rill | `MORNAY_WAREHOUSE_MAP` | crate assembler | Standing; faces left | The merchant took the quick road. His goods will go by water, as heavy things usually do. I build the crate for the journey the goods get, not the one he remembers. |
| `mornay_oden_gant` | Oden Gant | `MORNAY_DOCK_STEPS_UNIT_3_MAP` | night porter | Seated; faces left | People carry folded papers through a warehouse as well as sacks. No label tells you which will get a man dismissed. Ask the day clerk about cargo. |
| `mornay_nessa_muir` | Nessa Muir | `MORNAY_WAREHOUSE_MAP` | meal runner | Standing; faces right | Vela sends Kelda's bowl first. I bring it while the yard is eating so she has company. Losing a shift shouldn't mean losing the people you used to work beside. |
| `mornay_verdin_clay` | Verdin Clay | `MORNAY_WAREHOUSE_MAP` | warehouse sweeper | Standing; faces up | Lost grain feeds something. I prefer it not live here. |
| `mornay_lerna_brack` | Lerna Brack | `MORNAY_WAREHOUSE_MAP` | damaged-goods clerk | Standing; faces left | Wet before loading or wet in our store? It matters to the claim. I ask the porter who carried it, though his name isn't printed on the expensive paperwork. |
| `mornay_fenna_crowe` | Fenna Crowe | `MORNAY_WAREHOUSE_MAP` | new packer | Standing; faces right | I could read the labels before I got here. Istra showed me which damaged corners to look for. School and a patient workmate have kept me from making two different sorts of mistake. |
| `mornay_halden_rusk` | Halden Rusk | `MORNAY_WORKSHOP_MAP` | printer | Standing; faces down | My nephew Tavi sets the type. I have refused work from officials and from their enemies. A threat does not become an argument because it arrives with a petition. |
| `mornay_irma_bellows` | Irma Bellows | `MORNAY_WORKSHOP_MAP` | toolmaker | Standing; faces down | I make a handle to fit the hand. A man with an old injury may need a different grip, not a different trade. Selven sent someone over to try one last week. |
| `mornay_cerren_flint` | Cerren Flint | `MORNAY_WORKSHOP_MAP` | smith | Standing; faces up | Stonehaven makes fine metalwork. I still test a secondhand blade before trusting the mark. Hal understands; he'd rather I found a flaw here than a customer found it on the road. |
| `mornay_vesta_dorr` | Vesta Dorr | `MORNAY_WORKSHOP_MAP` | printer's reader | Standing; faces up | Pella's sheets were seized before anyone read them. That pleased the man selling blank forms next door. He has doubled his prices. |
| `mornay_pelda_gorse` | Pelda Gorse | `MORNAY_WORKSHOP_MAP` | paper cutter | Standing; faces down | I keep the paper offcuts for Oren's reading class. There's room for a few words on almost anything. Tavi leaves them blank on both sides when he can. |
| `mornay_jerrin_cole` | Jerrin Cole | `MORNAY_WORKSHOP_MAP` | repair apprentice | Standing; faces down | Torlin let me fit a spoke, then made me explain how the wheel would take the weight. I hoped he'd just tell me it looked good. I understand why he didn't. |
| `mornay_hessa_yarrow` | Hessa Yarrow | `MORNAY_WORKSHOP_MAP` | sailcloth stitcher | Seated; faces up | Tobin marks the worn places; I stitch the reinforcement. We leave the sound cloth alone. A crew buying repairs deserves more than an impressive patch over the wrong tear. |
| `mornay_torlin_hesk` | Torlin Hesk | `MORNAY_WORKSHOP_MAP` | wheelwright | Standing; faces right | Helven wants his spare wheel before the freight clears. I told him a rushed wheel can scatter a whole day's wages across the road. He is waiting, though not quietly. |
| `mornay_nilda_linnet` | Nilda Linnet | `MORNAY_WORKSHOP_MAP` | pattern drafter | Standing; faces down | The Collegium ordered cloth cut to a precise pattern. Essie's customers bring a child's old coat and ask how much room I can leave for growing. Both take care; only one impresses people. |
| `mornay_orsa_purl` | Orsa Purl | `MORNAY_WORKSHOP_MAP` | workshop bookkeeper | Seated; faces left | Gold paid, timber bought, hours worked. I keep all three. When a customer disputes a repair, I want the apprentice's time on the page as plainly as the master's name. |
| `mornay_nessa_quill` | Nessa Quill | `MORNAY_LAUNDRY_MAP` | laundry organiser | Standing; faces left | A person can work all week and still need a neighbour. We collect for supper and rent. Anyone demanding names before giving a coin can keep the coin. |
| `mornay_yelda_mere` | Yelda Mere | `MORNAY_LAUNDRY_MAP` | washer | Standing; faces up | Dena wants the next meeting about the hoist and unpaid shifts. Others want speeches about bringing everything down. We still have washing to finish afterward. |
| `mornay_cossa_beck` | Cossa Beck | `MORNAY_LAUNDRY_MAP` | mender | Seated; faces down | A school apron, a dock coat, Mrs Vale's table linen. I mend the same sort of tear in all three. People are less different at the elbows than they think. |
| `mornay_brinna_mote` | Brinna Mote | `MORNAY_DOCK_STEPS_UNIT_3_MAP` | laundry customer | Standing; faces left | My employer calls the collection a conspiracy. He sent his own porter to ask for food after cutting the man's hours. |
| `mornay_terenna_vane` | Terenna Vane | `MORNAY_LAUNDRY_MAP` | wringer operator | Standing; faces down | The rollers take the water out; somebody still has to fetch it in. Jessa and I change places before our hands give out. Dry weather hasn't made washing any lighter. |
| `mornay_jessa_reed` | Jessa Reed | `MORNAY_LAUNDRY_MAP` | washer's assistant | Standing; faces up | Yara needs plain sheets, the inns want them all back at once, and our own washing waits. Nessa puts a household bundle through between orders when she can. |
| `mornay_fenric_orr` | Fenric Orr | `MORNAY_LAUNDRY_MAP` | infirmary laundry carrier | Standing; faces right | Yara asks for the plain sheets first. Nessa sends them whether the last bill was paid or not. Neither of them has time to argue about credit for it. |
| `mornay_orlin_bale` | Orlin Bale | `MORNAY_LAUNDRY_MAP` | neighbour awaiting wash | Standing; faces left | I offered to help. They found an alarming amount of help for me. |
| `mornay_della_hume` | Della Hume | `MORNAY_BOARDING_MAP` | boardinghouse keeper | Standing; faces right | Rent includes a bed. It does not include finding work. The hiring board is at the East Gate; do not give a stranger your last coin for a place in line. |
| `mornay_hesten_vale` | Hesten Vale | `MORNAY_BOARDING_UNIT_1_MAP` | seasonal clerk | Seated; faces right | Temporary clerk, examination passed, still waiting for a permanent appointment. I can recite the Council's Three Elevens. It hasn't made the vacancy list any longer. |
| `mornay_rella_fenner` | Rella Fenner | `MORNAY_BOARDING_UNIT_1_MAP` | dock worker | Standing; faces left | The early shift eats quietly. Della leaves space by the stove for us. Dayoff or workday, the boats still need unloading when they reach the quay. |
| `mornay_otrin_wren` | Otrin Wren | `MORNAY_BOARDING_UNIT_2_MAP` | unemployed joiner | Seated; faces left | They dismissed a man for organizing. Then the foreman dismissed two men who had never spoken to him. Cheap hands were waiting outside. |
| `mornay_vessa_fallow` | Vessa Fallow | `MORNAY_BOARDING_UNIT_4_MAP` | kitchen worker | Seated; faces left | At work I cook for the Ledger House. Downstairs I share a stove with three households. We put one pot on for everyone when the freight pay is late. |
| `mornay_belric_tern` | Belric Tern | `MORNAY_BOARDING_UNIT_3_MAP` | retired carrier | Seated; faces left | My wife rests in deep water, away from the boats. Her name is in our family book. The water keeps the body; we keep the name. I like having people here to say it to. |
| `mornay_jorra_yew` | Jorra Yew | `MORNAY_RANN_HOME_MAP` | apprentice seamworker | Standing; faces right | Essie pays me for useful work, even while I'm learning. I've put a little aside. Nothing grand planned yet; I'd just like the next decision to be one I can afford. |
| `mornay_marden_sill` | Marden Sill | `MORNAY_BOARDING_UNIT_3_MAP` | remittance sender | Standing; faces left | Some men offer quiet passages and cheap carriage. One asked for a fee in the Reclaimers' name. Hal sent him away. I still keep my papers on me. |
| `mornay_selda_brin` | Selda Brin | `MORNAY_COURT_UNIT_1_MAP` | parent | Seated; faces right | The Education Act pays for lessons, not for the supper a child could have helped earn. We take turns with the younger ones so the older ones can go. Most days it works. |
| `mornay_harlis_glyn` | Harlis Glyn | `MORNAY_GLYN_HOME_MAP` | dockworker | Seated; faces right | Maris read me the Mera Dren lesson, then read the reply to our own complaint. She asked why the office hadn't sent an engineer. I said we'd write again. She fetched the pencil. |
| `mornay_etta_rook` | Etta Rook | `MORNAY_COURT_UNIT_2_MAP` | elder resident | Seated; faces left | Mother dated everything from the Millennial Accord. Before it, after it, the winter we still had the bunting. I remember the mending more clearly than the speeches she described. |
| `mornay_davren_fenwick` | Davren Fenwick | `MORNAY_COURT_MAP` | home repairer | Standing; faces down | Everyone under this roof put something toward the repair. Selda kept the names and amounts. We can argue over a missing bowl later; the rain was coming into all our rooms. |
| `mornay_nelva_pike` | Nelva Pike | `MORNAY_COURT_UNIT_4_MAP` | fish seller's sister | Standing; faces right | Niva brings the fish she couldn't sell. I cook enough for Verna too. She sends the dish back clean, usually with something mended folded inside it. |
| `mornay_ossa_nair` | Ossa Nair | `MORNAY_COURT_UNIT_3_MAP` | constable's parent | Seated; faces left | Jessa learned her letters at the ward school and joined the watch. I am proud of her. I still tell her to eat before she starts checking my latch for the third time. |
| `mornay_berren_sorn` | Berren Sorn | `MORNAY_SORN_HOME_MAP` | child | Standing; faces left | Aunt Hesta fixes boots downstairs. I wait up here till Mother finishes work. Aunt says my feet are repeat customers. |
| `mornay_cerra_muir` | Cerra Muir | `MORNAY_COURT_UNIT_2_MAP` | elder's caregiver | Standing; faces right | Etta tells the same story differently every afternoon. I put the kettle on and listen. There are worse ways to spend time than letting somebody remember a life. |
| `mornay_ilven_reed` | Ilven Reed | `MORNAY_REED_HOME_MAP` | homebound net maker | Seated; faces left | Heba brings the difficult nets here. I can't take the quay steps now, but I can still earn by my hands. The boats going toward Drynport carry a little of my work with them. |
| `mornay_verna_quill` | Verna Quill | `MORNAY_COURT_UNIT_4_MAP` | Nessa's mother | Seated; faces left | Nessa learnt her sums counting laundry bundles here. Now she counts what the neighbours need. I wish she'd remember that her own supper belongs in the total. |

## Implementation decisions and reservations

- Reuse the 17-map topology and all existing regional grids. New ordinary building doors are explicit registry entries; room IDs use `mornay_` prefixes so Calwick/Drenwick handlers cannot claim them.
- Maintain SAVE_VERSION 5 and the existing location payload. Dialogue, network classifications, decorations and routes add no saved state. Existing item, gold, day and party health authorities remain responsible for service results.
- Correct the two stale faction references in `LORE.md` and Fenwick’s `npcs.js` dialogue to Reclaimers. The audit found no legacy internal/persistence identifier requiring retention; do not invent an alias or historical rename.
- Gate departures already use safe approach PATH tiles: West (240,144), East (272,144), facing down. Town arrival remains (240,432). Controller tests cover both movement presentations, saves and debug arrival.
- Hydrographer/Esla history, ship mystery, clandestine boarding, Island ferry, major quests, resolution of the Regional Office dead end, Old Fort plot and Reclaimer recruitment/investigation remain inactive. No placeholder doors expose them.
- Rendering uses existing programmatic sprites, tile vocabulary and deterministic narrow decorations. No new image assets, dependency, terrain type, random encounters or save schema.

## Deliberately deferred and verification

Later editorial review may revise names, quip frequency, exact prices, class accents and stock progression. A new equipment tier needs its own balance audit. The proposed Fen Angler’s Rod was rejected as shop stock because the item registry marks it as a quest/key item; ordinary Leather Armor is used instead. Valmere basin depth, hydrographic principal, ship narrative and future Reclaimer objectives are deliberately unresolved.

Required verification includes input-driven gate and door routes; safe landings; unique roster IDs and comparable counts; swept patrol/collision checks; buying, selling, both inn receipts and treatment; save/load every room; mixed-speaker styling and text fit; no mutable Reclaimer state; inert reserved content; no town encounters; catalogue and fingerprints; full transition artifact; old-town and historical combat regression. Test 300 owns gate controls; suites 301–310 cover the populated MVP, and the exclusive refinement test writer used the independently checked free block 311–314. Browser/manual evidence must be reported separately from simulated controls.


## Historical MVP delivery at 6f065af

The following record preserves the earlier MVP delivery and its then-current counts and worktree state. The current tables above include the subsequent residential refinement. The codex worktree already contained that completed MVP at this refinement’s start; this pass makes no further cross-worktree integration.

### Approved source and prerequisite exception

Starting HEAD: `fe5992ec4bb647ce6f89554ad409a16a143769ec`. `main` and `agent/codex` both point there; `agent/claude` points to `3758d01beb014d50f918c34a98f20735b9ca4a42`. Merge bases: main/codex = `fe5992ec4bb647ce6f89554ad409a16a143769ec`; main/claude and codex/claude = `3758d01beb014d50f918c34a98f20735b9ca4a42`. No active Git operation was present in any of the 20 registered worktrees.

Committed foundations were checked rather than reconstructed: Mornay skeleton and both entrances (`d32aef5`), ferry presentation (`79e8b9a`), Sera/Liora ownership and presentation (`9d93fed`, `052b949`, `fe5992e`), Rise ambush (`3758d01`), integrated Fens/MQ5 (`089b7f8`), Rise camp/dialogue (`e6b4671`), party menus/singleton compatibility (`3b35723`) and preceding canonical party integration (`feee974`). The dedicated worktree started clean. The source had no tracked changes, but its approved QA PNG was untracked; this was the exact original preflight blocker.

The user's explicit resume exception authorized copying only `Art/qa/sera-liora/Sera and Liora between twin beds.png`. The source remains untouched and untracked in the codex worktree; the destination is a normal tracked 2,203,880-byte image, not a symlink. Both SHA-256 values match suite 260's authority: `47fbf97862f2865fda59a0750970112933fe0cdbd41c49bc29b0544b27c9a025`. The image was neither regenerated nor altered. Suite 260 passed, then the complete restored baseline passed **218/218** before the image-only prerequisite commit. The earlier preflight's only failure was the missing image (217/218).

### Coordinated agents and integration decisions

All initial findings were reused after the pause. Only the root edited production, changed Git, regenerated shared artifacts or committed. No nested delegation occurred. Concurrency stayed within available slots and the user's four-agent ceiling. All subagents used GPT-6.1 Sol; none used Astra.

| Agent | Assignment / effort | Accepted findings and corrections |
|---|---|---|
| `gate_debugger` | Paired gate diagnosis / High | Accepted entrance-marker bounce diagnosis, row-4 safe returns, both-mode held-input coverage. Rejected the old topology test's row-3 landing as an authority. |
| `drenwick_benchmark` | Ordinary town census / Medium | Accepted registry/schedule union and overlap methodology. Corrected provisional 101 to 99 by removing a position-only visitor and party Esla projection; retained ordinary wake-scene staff/patient. Visitors count comparably in both towns. |
| `urban_geography` | Seventeen-district matrix / Medium | Accepted district roles, central circulation and narrow northern lane restrictions, reserve protection. Root placed infirmary/school in the South, commercial inn in North Upper West and harbour room in North Lower West. |
| `economy_institutions` | Services and institutions / Medium | Accepted existing stocks, combined chandler/secondhand business, two prices and ordinary paid-care convention. Rejected quest/key-item Fen Angler's Rod as merchandise; used Leather Armor. Accepted rest-receipt gold-seal warning. |
| `npc_network` | Full roster and dialogue clusters / Medium | Accepted 300 identities and connected family/work networks. Root reduced proposed patrols to 12 safe routes, revised numerous quips into practical concerns, and renamed Liora Bexley to Linna Bexley to avoid confusion with the established character. |
| `reclaimer_canon` | Canon, terminology and knowledge / Medium | Accepted two stale text corrections, nine network ties, three concealed members and optional-reading/ambush knowledge limits. No legacy faction identifier required preservation. |
| `state_architecture` | Ownership and implementation surface / Medium | Accepted distinct room IDs, existing registries/location payload and save version 5. Corrected its initial missed Drenwick exterior paid-treatment authority using economy/root tracing. |
| `verification_audit` | Complete test matrix / High | Accepted controller, service, collision, state and compatibility matrix. Audited all worktrees and reserved previously unused 300–319 block. |
| `mornay_test_writer` | Exclusive new focused tests / High | Wrote only new 301–310 after root production stopped at `b5ced18`; all ten passed. Root inspected every file and bounded its roster parser to the roster section after adding delivery tables. Tests exercise input, collision, accounting and atomicity, including an independently derived census; no production defect reproduced. |
| `mornay_correctness_review` | Fresh final correctness / High | No evidence-backed defect. Independently reran 300, 303, 305, 306, 307 and 308 successfully. No files changed. |
| `mornay_coherence_review` | Fresh final town coherence / Medium | No canon or coherence blocker. Five subjective editorial/visual suggestions are recorded below rather than silently rewritten. No files changed. |

### Local checkpoint chain

The final test/documentation checkpoint containing this delivery record follows `b5ced18`. Its exact SHA and parent are supplied with the delivery response; a commit cannot contain its own resulting hash. All preceding full hashes and parents are:

| Commit | Parent | Subject |
|---|---|---|
| `29c87c9097ac3c663b7386d48a8f02910e02266f` | `fe5992ec4bb647ce6f89554ad409a16a143769ec` | chore(test): track approved Sera and Liora reference image |
| `da794f77f6a62b7e033a337bcb6229088e41054b` | `29c87c9097ac3c663b7386d48a8f02910e02266f` | fix(mornay): restore paired overworld exits |
| `f3902739d142a132479a6fa511e6cd0ba5fe3431` | `da794f77f6a62b7e033a337bcb6229088e41054b` | docs(mornay): define population and services plan |
| `f5095e3b681bab1cc1ddf6b387cc74b19706cb50` | `f3902739d142a132479a6fa511e6cd0ba5fe3431` | fix(lore): restore Reclaimer terminology |
| `3ec5fdec6cab592fdb6deb404ffe8df9fcf7f6cc` | `f5095e3b681bab1cc1ddf6b387cc74b19706cb50` | feat(mornay): add civic and commercial interiors |
| `b5ced18db5269b6e36454af7a55f57780048854e` | `3ec5fdec6cab592fdb6deb404ffe8df9fcf7f6cc` | feat(mornay): populate services and Reclaimer networks |

Services, street population and Reclaimer content were combined in one checkpoint because they share the NPC, interaction and rendering authorities. No milestone was committed with a failing focused check.

### Gate defect, corrected contract and evidence

Reproduction on the approved source used the real keyboard listeners and `update()`: start on Town Approach below either entrance, hold Up into the corresponding gate, then hold Down toward the southern exit. The party left town onto the same `TOWN_ENTRANCE` marker and re-entered on the next update. Existing transition cooldown did not suppress this tile dispatch. Both regional presentation modes behaved alike; direct topology tests incorrectly required the marker landing and stopped before the next input frame.

`world-transitions.js:exitTown()` now follows the existing town convention of landing beyond the entrance trigger. No input-specific or debug-only escape was added. Gate identity comes from the actual gate map, so loading a gate save or arriving by debug warp needs no remembered origin.

| Gate | Local arrival | Local exit tile | Town Approach return | Canonical regional world point | Facing |
|---|---|---|---|---|---|
| West | `(240,432)` px, up | `(7,14)` | tile `(7,4)`, centre `(240,144)` px | `(8944,-1296)` | down |
| East | `(240,432)` px, up | `(7,14)` | tile `(8,4)`, centre `(272,144)` px | `(8976,-1296)` | down |

Both returns use existing PATH tile 2 with a valid full player collision footprint. They are south of the trigger row `(7,3)/(8,3)` and the four solid crown tiles in rows 1–2. Continued Down movement leaves the marker, idle frames do not re-enter, and deliberate Up movement re-enters the correct gate. Tests cover both complete round trips, both presentations, saving/loading each gate and conventional West Gate debug warp followed by ordinary exit. Automated Chrome repeats these routes at both display sizes. No manual pre-fix or post-fix human playthrough is claimed.

### Delivered population and political distribution

The census is **99 Drenwick comparable characters versus 300 Mornay characters: 3.0303×**. Drenwick is a union of 9 exterior and 92 interior identities with Renn and Veran shared. Schedule aliases, duplicate placements, cutscene party copies, enemies and debug fixtures do not inflate it. Eight Drenwick characters are explicitly visitors; the remaining 91 are not all established permanent residents. Suite 310 derives the ordinary schedule union over ten days.

Mornay has 120 exterior and 180 interior speakers; all 300 have unique stable IDs and distinct names. There are 12 moving speakers and 288 stationary speakers, zero silent-only residents, and 293 incidental/ambient speakers plus seven operational service keepers. Movement and speaking counts overlap. Authored primary role buckets (exclusive, rather than a claim that occupations never overlap) are: 159 workers, 67 residents/visitors, 32 officials, 24 service workers and 18 merchants. The seven transactional keepers comprise four shops, two inns and one physician. The exterior district matrix and room matrix above give every map's exact count; the full roster gives every person and location.

Nine network-linked residents occupy eight exterior districts: five are outside and four inside. Three are author-only confirmed members; four are associates; two are sympathizers, one of whom is falsely accused of organizing violence. Three additional Imperial/watch observers are separate from those nine.

| Character | Classification | Exact location |
|---|---|---|
| Dena Mere | labour associate; sympathetic, membership unconfirmed | `MORNAY_NORTH_LOWER_WEST_MAP` |
| Bram Fen | confirmed member | `MORNAY_MIDDLE_UPPER_WEST_MAP` |
| Pella Dorn | sympathizer falsely accused of organizing violence | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` |
| Tavi Rusk | confirmed member | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` |
| Sima Wold | boarding and lodging associate | `MORNAY_SOUTH_UPPER_WEST_MAP` |
| Yara Kelm | medical mutual-aid associate | `MORNAY_INFIRMARY_MAP` |
| Hal Venn | logistics associate | `MORNAY_CHANDLER_MAP` |
| Oren Teal | educated sympathizer | `MORNAY_SCHOOL_MAP` |
| Nessa Quill | confirmed member | `MORNAY_LAUNDRY_MAP` |

Imperial observers are Jessa Nair (West Gate), Marit Voss (Regional IJC Office, Middle Upper Central East) and Edrin Saye (Harbour/Customs room, North Lower West). The network is conveyed through linen and food aid, contested wages, missing freight, private letter carriage, printers, seized sheets and guarded associations. Thirteen inspectable notices also identify ordinary institutions and inert reserves; only a restrained subset concerns political activity. The locked back stair and bonded annex do not open.

Representative connected dialogue includes Gessa asking why Arlis's contractor returned a condemned hoist to use; Kelda describing a contractor denying her employment after an injury; Nessa refusing to trade contributors' names for donations; Marit separating wage grievances from conspiracy; and Benna describing three years of paid examination preparation. The five companion conversations use canonical `speakerId: 'esla'` and `esla_light_green` (`#a8e89c`), gated by actual companion availability. Lely remains quiet. No one exposes membership, assumes optional brewery reading, attributes the earlier ambush to the faction, resolves the central mystery or starts an investigation.

The two corrected stale faction references were Fenwick's dialogue in `npcs.js` and the ambusher non-affiliation passage in `LORE.md`. Runtime and lore now consistently say Reclaimers. **Retained internal or persistence faction identifiers: none.** The obsolete spelling remains only where a test or this audit explicitly describes the prohibited terminology; it is not an alias, faction or historical rename.

### Exact existing-grid changes

All 115 regional grids and fingerprints are unchanged by this branch. Exactly 18 cells in existing Mornay exteriors changed: fifteen `TOWN_BUILDING` (13) cells became ordinary `HOUSE_DOOR` (34), and three northern approach cells became `TOWN_FLOOR` (12). No other existing-grid cell changed. Coordinates are zero-based `(column,row)`:

| Exterior | 13 → 34 doors | 13 → 12 approach |
|---|---|---|
| North Upper West | `(11,5)` | `(11,6)` |
| North Lower West | `(11,5)` | `(11,6)` |
| North Lower East | `(11,5)` | `(11,6)` |
| Middle Upper West | `(3,5)` | — |
| Middle Upper Central West | `(3,5)` | — |
| Middle Upper Central East | `(3,5)` | — |
| Middle Lower Central West | `(3,5)` | — |
| Middle Lower Central East | `(12,5)` | — |
| Middle Lower East | `(3,5)`, `(3,9)` | — |
| South Upper West | `(12,5)`, `(3,10)` | — |
| South Upper East | `(3,5)`, `(12,5)` | — |
| West Gate | `(3,5)` | — |

The 17 new room grids use existing walls, floor, exit, door and solid fixture tiles. Furniture collision and rendering share `MORNAY_ROOM_FIXTURES`. Exterior dressing is deterministic and sits on existing building massing; no new terrain type, random decoration, dependency or bespoke portrait was added. The only added raster file is the explicitly authorized prerequisite QA reference.

### File-level delivery

| Files | Purpose |
|---|---|
| `Art/qa/sera-liora/Sera and Liora between twin beds.png` | Exact approved test reference import. |
| `LORE.md`, `MORNAY_TOWN_PLAN.md`, `architecture.md`, `PROJECT_STATUS.md` | Canon terminology, approved institution definitions, complete roster/district/service plan, ownership/current status and delivery record. Historical skeleton verification is labelled as historical. |
| `content/maps/mornay-maps.js`, `data.js` | Door/return/fixture authorities, 17 rooms and catalogue registration. |
| `content/npcs/mornay-npcs.js`, `npcs.js` | 300 stable speakers, 12 routes, companion exchanges, registry integration and Fenwick correction. |
| `content/interactions/mornay-interactions.js`, `interactions.js`, `shops.js` | Inert inspectables, four inventories, two inns and selected-member treatment offers. |
| `persistent-party.js` | Narrow canonical `treatMember()` operation; no new saved authority. |
| `movement.js`, `world-transitions.js`, `save.js`, `validation.js` | Safe gate returns, room dispatch/reciprocity, map-context validation and existing save-v5 integration. |
| `render-mornay.js`, `render-entities.js`, `render.js`, `index.html` | Deterministic town details, room fixtures, optional sprite palette variation and script/render integration. |
| `test/browser-smoke.js` | Real Chrome keyboard, Canvas, font and service review at both display scales. |
| `test/cases/300-mornay-gate-controller.test.js` | Root-owned gate prerequisite coverage. |
| `test/cases/301-mornay-manifest.test.js`, `302-mornay-occupancy-routes.test.js`, `303-mornay-room-district-controls.test.js`, `304-mornay-shop-controller.test.js`, `305-mornay-inn-recovery.test.js` | Delegated identity/reachability/routes, every room and street crossing, real commerce and both inn recovery contracts. |
| `test/cases/306-mornay-treatment-controller.test.js`, `307-mornay-persistence-atomicity.test.js`, `308-mornay-dialogue-reservations.test.js`, `309-mornay-compatibility.test.js`, `310-mornay-comparable-census.test.js` | Delegated care accounting, forged-save rejection, inert content/style, no encounters/read-only rendering and independent benchmark. |
| `test/cases/45-npc-movement-contract.test.js`, `46-bridge-guard-toll.test.js`, `58-regional-content-split.test.js` | Extend explicit mover/aggregate expectations for the twelve new routes and Mornay registry; retain old assertions. |
| `test/cases/98-thornmere-upper-shallows-scenery.test.js`, `99-thornmere-canal-head.test.js`, `100-east-causeway.test.js`, `101-west-outfall-canal-tunnel.test.js`, `102-north-basin-drowned-rim.test.js`, `103-north-basin-mirewood.test.js`, `104-eastern-reaches-abandoned-farmhouse.test.js`, `201-travellers-rise-campsite.test.js`, `207-travellers-rise-campfire-night.test.js`, `218-mornay-exterior-topology.test.js` | Legitimate catalogue total update to 251; case 218 also corrects the defective gate landing expectation. No topology/fingerprint/compatibility assertions were relaxed. |
| `test/transition-audit.js`, `test/transition-audit-output.json` | Enumerate new reciprocal room transitions and regenerate their authoritative audit. |

### Verification and artifact accounting

The final complete `node test/run.js` regression passed **229/229 suites, 0 failures**. This includes the historical singleton, Formation, party-command, Resonance, Sera/Liora, MQ5, Eastern Fens, Travellers' Rise, ferry, old-town and no-visible-void compatibility coverage. The restored prerequisite baseline was 218/218; eleven new Mornay suites account for the increase.

The 11 Mornay suites cover both gate round trips, actual held controls for all 17 rooms and all 46 directed exterior crossings in both regional modes, all 300 reachable conversations on workday and Dayoff, all twelve moving routes and swept occupancy, four complete inventories through buy/sell/cancel/insufficient-funds/save flows, both inns for solo/companion/mixed Fallen parties, and selected-member full/partial/zero-funds treatment. Every room saves/loads and exits normally; 136 forged room-save combinations reject atomically. Dialogue/notices remain repeatable without flag, reward, allegiance or MainQuest mutation. Canonical speaker styling survives pagination. Every exterior/interior remains escapable and the town does not roll encounters.

`node --check` passed for all 41 changed/new JavaScript files. `validateGameData()` reports 251 maps, 481 total registry NPCs, 956 text entries, 205 existing save flags, **0 errors and the same 12 baseline warnings**. The warnings remain the documented notice-board property, eight generic battle sprites, one reserved encounter pool and two older long-dialogue entries. SAVE_VERSION remains **5** with no added payload field. Unique IDs, route validation, fixture collision, malformed placement rejection, state isolation, fingerprints, stale-reference/conflict searches and `git diff --check` pass.

The complete read-only transition audit passes: **251 maps, 342 fixed destinations, 8 preserved-coordinate transitions, 240 edge segments and 42 legacy house doors**. Its fixed destinations include 34 new room entry/exit records. The 17 Mornay room doors are registry entries, distinct from the legacy house-door count.

Only `test/transition-audit-output.json` was regenerated, always through `node test/transition-audit.js --write`. The gate checkpoint changed two return destinations; the room checkpoint added 17 map/dimension records and 34 fixed transitions; populated collision changed 38 escape-direction booleans across 26 Mornay records (11 door returns and 15 district landings), all still escapable and OK. These are current-input changes, not unrelated catch-up. Regional fingerprint fixtures were not regenerated.

The first populated full run exposed twelve historical assertions tied to old map totals, mover lists or the aggregate NPC array. Those expectations were updated for the authorized additions without relaxing the substantive assertions; their focused reruns passed before checkpointing. No historical combat or old-town production workaround was introduced.

### Browser evidence and remaining human review

The in-app browser execution tool was unavailable. The existing local headless Chrome workflow was used instead: `node test/run-browser-smoke.js` with a temporary capture-output directory. It passed **1,071 checks with no browser errors and produced 118 Canvas captures**. The actual DOM Canvas displayed at 512×480 and 1024×960; exported Canvas PNGs retain the logical 512×480 resolution, so they are not full-viewport screenshots.

Real browser keyboard events exercised both gates in both movement modes at both scales, save/load in both gates, ordinary departure after West Gate debug warp, every room entrance/exit and room save, four shop purchases, both inn rests, infirmary care and representative cluster conversations. Every exterior was placed/rendered, and all 293 non-service NPC dialogues were measured using actual browser fonts. Esla's green interjection, Collegium/reserve presentation, no town battles, ferry behaviour and old-town rendering were inspected. The root visually reviewed eight captures; the coherence reviewer inspected four. These are automated browser evidence and visual inspection of captures, not a human continuous playthrough. All 46 district crossings were separately exercised through VM keyboard controls.

Remaining human feel/pacing checklist, at both display sizes:

1. From `EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP`, walk Up from `(240,144)` into West Gate, Down out, then repeat at `(272,144)` for East Gate. Hold departure; release/repress; save/load each gate; use the conventional Mornay West Gate debug destination and leave normally. Repeat in Legacy Regional Fallback.
2. Traverse the full 17-map district matrix above. Check foreground readability, route clearance and perceived density, especially the narrow North rows, Middle market and freight yards. Read political evidence at North Lower West `(12.5,8.2)`, Middle Upper Central West `(2.5,9.2)`, Middle Lower Central East `(2.5,5.8)`, Middle Lower West `(12.5,9.2)` and locked Middle Lower East stair `(12.5,5.8)` (tile units).
3. Walk every exact door/return pair in the interior matrix, including both inn upstairs rooms. Save/load in the IJC office, infirmary, warehouse and both lodging rooms; confirm furniture and moving residents cannot obstruct an exit. Use all four keepers, both innkeepers and physician Selven Orr.
4. Speak to the five companion-exchange speakers: Inessa Cray in the IJC office; Yara Kelm and Elrin Vey in the infirmary; Dena Mere at North Lower West; Nessa Quill in the laundry. Check green Esla text and normal text afterward. Sample workers, parents, children, exam candidates, clerks, shopkeepers, patients, crews, injured/unemployed residents and all nine network-linked residents from the roster.
5. Inspect the locked Civic Collegium at North Upper East `(12.5,6.2)`, hydrographic frontage at Middle Upper East `(12.5,5.8)`, Old Fort disused lockup `(10.5,2.8)`, story berth at North Upper West `(4.5,10.5)` and island ferry reserve at North Lower West `(4.5,4.5)`. No boarding, quest, faction, investigation or reputation interface should activate.
6. Revisit Calwick and Drenwick; use their ordinary exits and representative services. Confirm no random Mornay encounter and unchanged causeway ferry behaviour. Judge crowding and dialogue rhythm across a sustained visit; automation does not establish those qualities.

### Editorial questions retained for later review

The fresh coherence reviewer found no blocker but recommended considering: (1) reducing the shared aphoristic voice among unrelated workers and customers; (2) making Sima's letter-drop hint and Yara's mention of Nessa's meetings more guarded; (3) clarifying whether Elna's complaint means a lower per-unit charge rather than lower total freight fee; (4) depicting injured patients resting rather than standing beside beds; and (5) varying the repeated room geometry and regular NPC rows. These are recorded suggestions, not silently applied rewrites. Names, prices and flavour remain revisable. A new equipment progression tier still requires a separate balance audit.

The scope deliberately leaves Regional Office operational plot dialogue, hydrographer/Esla history, ship mystery, clandestine boarding, island ferry, Old Fort plot, new major quests, Reclaimer recruitment/investigation and allegiance/reputation systems inactive. The Civic Collegium has no interior. No future principal character was introduced and no hidden mutable story hook was added.

### Worktree preservation and final status

All 20 registered worktrees were rechecked. Every non-Mornay HEAD, status entry and active-operation result matches preflight. No worktree has a merge, rebase, cherry-pick, revert, bisect or sequencer operation in progress. Paths below are relative to the original repository to avoid committing machine-specific absolute paths. The dedicated branch's exact final checkpoint hash is in the delivery response; after that checkpoint its porcelain status is empty.

| Worktree | Branch | HEAD | Porcelain status |
|---|---|---|---|
| `.` | `main` | `fe5992ec4bb647ce6f89554ad409a16a143769ec` | clean |
| `../empire-game-claude` | `agent/claude` | `3758d01beb014d50f918c34a98f20735b9ca4a42` | 65 entries, reproduced below |
| `../empire-game-codex` | `agent/codex` | `fe5992ec4bb647ce6f89554ad409a16a143769ec` | 1 entries, reproduced below |
| `../empire-game-integration` | `integration/eastern-party-foundations` | `3d5413a8b3094070da503c5cb05c0a689b4c92b5` | clean |
| `../empire-game-mornay-population` | `agent/mornay-population` | delivery checkpoint containing this record | clean |
| `.claude/worktrees/bullet-time` | `bullet-time` | `ff43da6bf6161d0dd5a2a5fc89b1b5ff570e2cbf` | clean |
| `.claude/worktrees/canonical-transition` | `canonical-transition` | `190dd83c17720eeb08579f0a5f483cd3ae87cf98` | clean |
| `.claude/worktrees/enemy-id-authority` | `enemy-id-authority` | `a75b700b7f9e685469fbae2ca28b777475b8bee1` | clean |
| `.claude/worktrees/enemy-pool-registry-consumers` | `enemy-pool-registry-consumers` | `a1a43ab559b51f2ff249541fdf2f3fad842d7f06` | clean |
| `.claude/worktrees/mundane-dilemmas` | `mundane-dilemmas` | `e8b624b83032a4ed8354f110669333665e86e801` | clean |
| `.claude/worktrees/post-door-top` | `post-door-top` | `6aa7a828471e844692aff48875fdbf0b5674af76` | clean |
| `.claude/worktrees/regional-content-split` | `regional-content-split` | `318503b4863ed136cad010f5e600039990b9f524` | clean |
| `.claude/worktrees/save-binding-migration` | `worktree-save-binding-migration` | `a949335a0bf5674eedb15789e09c158cae61b91c` | clean |
| `.claude/worktrees/secret-northern-road-seam` | `secret-northern-road-seam` | `d37c360dbe55f852f3ac3edcea16a866a9c648e3` | clean |
| `.claude/worktrees/sluice-easy-top-floor` | `sluice-easy-top-floor` | `507b6965a21b86086d7c796b784c1bf081053f0e` | clean |
| `.claude/worktrees/sluice-top-fix` | `sluice-top-fix` | `42e82da663378c610b2523952e260e43c509fc2c` | clean |
| `.claude/worktrees/small-fixes-2` | `small-fixes-2` | `3b5e22f801dc639ad1df4aa3377a05f83872dd27` | clean |
| `.claude/worktrees/small-fixes-batch` | `small-fixes-batch` | `f98861c7fdfa6c9f5197fe493b3ac5fed9ff2335` | clean |
| `.claude/worktrees/stable-ids-v3` | `stable-ids-v3` | `29607ee4d943277a56c2e919d3ddb53612138e33` | clean |
| `.claude/worktrees/status-cure-contract` | `status-cure-contract` | `6ecccd8536e905f1d4e2ed1335ebc806b31b774d` | 5 entries, reproduced below |

Exact retained porcelain entries for `agent/claude`:

```text
 M ENEMY_CAPABILITY_AUDIT.md
 M OVERWORLD_ATLAS.md
 M combat.js
 M content/maps/eastern-fens-maps.js
 M data.js
 M index.html
 M render-battle.js
 M test/cases/100-east-causeway.test.js
 M test/cases/101-west-outfall-canal-tunnel.test.js
 M test/cases/102-north-basin-drowned-rim.test.js
 M test/cases/103-north-basin-mirewood.test.js
 M test/cases/104-eastern-reaches-abandoned-farmhouse.test.js
 M test/cases/105-small-ui-pickup-and-gold-polish.test.js
 M test/cases/106-thornmere-lighthouse-dual-quests.test.js
 M test/cases/107-thornmere-lighthouse-interior.test.js
 M test/cases/155-formation-four-command-integration.test.js
 M test/cases/161-eastern-fens-route.test.js
 M test/cases/175-eastern-fens-exploration.test.js
 M test/cases/176-eastern-fens-envelope.test.js
 M test/cases/177-eastern-fens-western-pockets.test.js
 M test/cases/178-eastern-fens-nw-open-fen.test.js
 M test/cases/186-enemy-capability-migration.test.js
 M test/cases/188-status-specials-party-combat.test.js
 M test/cases/189-unusual-enemy-capabilities-party-combat.test.js
 M test/cases/191-universal-party-combat-compatibility.test.js
 M test/cases/200-eastern-fens-mornay-encounter-content.test.js
 M test/cases/201-travellers-rise-campsite.test.js
 M test/cases/207-travellers-rise-campfire-night.test.js
 M test/cases/209-eastern-fens-new-terrain-tiles.test.js
 M test/cases/213-eastern-fens-storm-shoals.test.js
 M test/cases/215-eastern-fens-valmere-mornay-peninsula.test.js
 M test/cases/52-stable-persistence-ids.test.js
 M test/cases/58-regional-content-split.test.js
 M test/cases/69-world-view-and-drawmaptiles.test.js
 M test/cases/71-continuous-world-view.test.js
 M test/cases/72-continuous-seams.test.js
 M test/cases/73-continuous-neighbour-content.test.js
 M test/cases/76-geographic-encounters.test.js
 M test/cases/77-map3-fen-seam-pilot.test.js
 M test/cases/78-verdant-vale-legacy-home.test.js
 M test/cases/83-map3n2-northbasin-seam-closure.test.js
 M test/cases/84-canonical-regional-position.test.js
 M test/cases/85-canonical-consumers-part2.test.js
 M test/cases/86-regional-chunk-catalog.test.js
 M test/cases/88-continuous-regional-production-default.test.js
 M test/cases/89-west-outfall-scenery-chunk.test.js
 M test/cases/90-north-basin-open-reservoir.test.js
 M test/cases/91-north-basin-open-reservoir-east.test.js
 M test/cases/92-north-basin-eastern-woods.test.js
 M test/cases/93-north-basin-open-reservoir-far-east.test.js
 M test/cases/94-north-basin-east-shore-reservoir.test.js
 M test/cases/95-north-basin-eastern-road.test.js
 M test/cases/96-eastern-canal-banks.test.js
 M test/cases/97-northern-thornmere-fen.test.js
 M test/cases/98-thornmere-upper-shallows-scenery.test.js
 M test/cases/99-thornmere-canal-head.test.js
 M test/fixtures/regional-grid-fingerprints.js
 M test/transition-audit-output.json
 M world-transitions.js
?? content/maps/eastern-shore-maps.js
?? content/maps/great-fen-maps.js
?? content/maps/southern-moraine-maps.js
?? content/maps/valmere-expanse-maps.js
?? test/cases/218-great-fen-expansion.test.js
?? test/cases/219-valmere-expanse.test.js
```

Exact retained porcelain entries for `agent/codex`:

```text
?? "Art/qa/sera-liora/Sera and Liora between twin beds.png"
```

Exact retained porcelain entries for `status-cure-contract`:

```text
 M interactions.js
 M maps.js
 M npcs.js
 M render-interiors.js
 M test/cases/30-rest-week-inn-and-dayoff-closures.test.js
```

## Refinement grid deltas

Compared with `6f065af`, the following are every changed existing-grid cell, expressed as zero-based (column,row) groups and stable tile IDs. New room grids are authored in `MORNAY_INTERIOR_MAPS`; no regional grid, boundary transition cell or gate return changed. Tile IDs: 18 INTERIOR_FLOOR, 19 INTERIOR_WALL, 33 TABLE; exterior IDs are recorded numerically below.

| Existing map | Old → new tile | Cells (column,row) |
|---|---|---|
| `MORNAY_NORTH_UPPER_WEST_MAP` | 13 → 34 | (11,8) |
| `MORNAY_NORTH_UPPER_EAST_MAP` | 13 → 34 | (3,8) |
| `MORNAY_MIDDLE_UPPER_WEST_MAP` | 13 → 34 | (3,9) |
| `MORNAY_MIDDLE_UPPER_EAST_MAP` | 13 → 34 | (3,9) |
| `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | 13 → 34 | (12,5) |
| `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | 13 → 34 | (3,5) |
| `MORNAY_SOUTH_UPPER_WEST_MAP` | 13 → 34 | (12,10) |
| `MORNAY_SOUTH_UPPER_EAST_MAP` | 13 → 34 | (3,10) |
| `MORNAY_OFFICE_MAP` | 18 → 33 | (1,2), (5,2), (13,2), (3,3), (2,7), (5,7), (10,7), (13,7), (14,10), (3,11) |
| `MORNAY_OFFICE_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (13,3), (2,6), (4,6), (6,6), (9,6), (11,6), (13,6) |
| `MORNAY_INFIRMARY_MAP` | 18 → 33 | (1,2), (2,2), (13,2), (5,3), (1,5), (2,5), (4,5), (5,5), (10,5), (11,5), (13,5), (14,5), (1,9), (5,9), (10,9), (14,9), (14,12) |
| `MORNAY_INFIRMARY_MAP` | 33 → 18 | (2,3), (4,3), (11,3), (13,3), (2,6), (4,6), (11,6), (13,6) |
| `MORNAY_PROVISIONER_MAP` | 18 → 33 | (1,2), (2,2), (11,2), (12,2), (3,4), (4,4), (5,4), (12,6), (13,6), (3,10) |
| `MORNAY_PROVISIONER_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (11,3), (13,3) |
| `MORNAY_APOTHECARY_MAP` | 18 → 33 | (2,2), (12,2), (13,2), (10,4), (11,4), (12,4), (3,6), (13,9), (2,10) |
| `MORNAY_APOTHECARY_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (11,3), (13,3) |
| `MORNAY_WORKGEAR_MAP` | 18 → 33 | (2,2), (5,2), (11,4), (12,4), (3,5), (4,5), (5,5), (12,9), (2,10) |
| `MORNAY_WORKGEAR_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (11,3), (13,3) |
| `MORNAY_CHANDLER_MAP` | 18 → 33 | (2,2), (3,2), (13,2), (10,5), (11,5), (12,5), (3,6), (11,10), (2,11) |
| `MORNAY_CHANDLER_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (11,3), (13,3) |
| `MORNAY_GATE_INN_MAP` | 18 → 33 | (1,2), (4,2), (2,4), (3,4), (11,4), (4,7), (3,11) |
| `MORNAY_GATE_INN_MAP` | 33 → 18 | (2,3), (4,3), (11,3), (13,3), (2,9), (4,9), (13,9) |
| `MORNAY_GATE_BEDS_MAP` | 18 → 33 | (7,5), (2,8), (4,8), (11,8), (13,8), (1,11) |
| `MORNAY_GATE_BEDS_MAP` | 33 → 18 | (2,6), (4,6), (11,6), (13,6), (2,9), (4,9), (11,9), (13,9) |
| `MORNAY_COMMERCIAL_INN_MAP` | 18 → 33 | (10,2), (14,2), (3,4), (11,4), (12,4), (12,7), (11,10) |
| `MORNAY_COMMERCIAL_INN_MAP` | 33 → 18 | (2,3), (4,3), (11,3), (13,3), (2,9), (11,9), (13,9) |
| `MORNAY_COMMERCIAL_BEDS_MAP` | 18 → 33 | (5,3), (10,3), (1,6), (5,9), (10,9) |
| `MORNAY_COMMERCIAL_BEDS_MAP` | 33 → 18 | (4,3), (11,3), (2,6), (4,6), (13,6), (4,9), (11,9) |
| `MORNAY_SCHOOL_MAP` | 18 → 33 | (1,2), (13,2), (4,3), (3,6), (10,6), (3,9), (10,9), (13,11) |
| `MORNAY_SCHOOL_MAP` | 33 → 18 | (2,6), (4,6), (9,6), (11,6), (13,6), (2,9), (4,9), (9,9), (11,9), (13,9) |
| `MORNAY_HARBOUR_MAP` | 18 → 33 | (1,2), (13,2), (5,3), (3,7), (10,7), (13,7), (14,10), (3,11) |
| `MORNAY_HARBOUR_MAP` | 33 → 18 | (4,3), (6,3), (9,3), (13,3), (2,6), (4,6), (6,6), (9,6), (11,6), (13,6) |
| `MORNAY_WAREHOUSE_MAP` | 18 → 33 | (1,2), (2,2), (11,2), (12,2), (13,2), (5,3), (12,5), (2,8), (3,8), (12,9), (4,11) |
| `MORNAY_WAREHOUSE_MAP` | 33 → 18 | (2,3), (6,3), (9,3), (11,3), (13,3), (2,9), (4,9), (6,9), (9,9), (13,9) |
| `MORNAY_WORKSHOP_MAP` | 18 → 33 | (1,2), (14,2), (3,3), (4,7), (5,7), (12,8), (2,11), (13,11) |
| `MORNAY_WORKSHOP_MAP` | 33 → 18 | (4,3), (6,3), (9,3), (13,3) |
| `MORNAY_LAUNDRY_MAP` | 18 → 33 | (14,2), (11,4), (3,8), (12,9), (1,11) |
| `MORNAY_LAUNDRY_MAP` | 33 → 18 | (11,3), (13,3), (2,9), (4,9), (11,9), (13,9) |
| `MORNAY_BOARDING_MAP` | 18 → 19 | (1,2), (2,2), (3,2), (4,2), (5,2), (6,2), (7,2), (8,2), (9,2), (10,2), (11,2), (12,2), (13,2), (14,2), (1,3), (3,3), (6,3), (7,3), (8,3), (9,3), (12,3), (14,3) |
| `MORNAY_BOARDING_MAP` | 18 → 33 | (2,7), (3,7), (13,7), (5,9), (10,9) |
| `MORNAY_BOARDING_MAP` | 18 → 34 | (5,3), (10,3) |
| `MORNAY_BOARDING_MAP` | 33 → 18 | (2,6), (4,6), (11,6), (13,6), (2,9), (4,9), (11,9), (13,9) |
| `MORNAY_BOARDING_MAP` | 33 → 19 | (4,3), (11,3) |
| `MORNAY_BOARDING_MAP` | 33 → 34 | (2,3), (13,3) |
| `MORNAY_COURT_MAP` | 18 → 19 | (1,2), (2,2), (3,2), (4,2), (5,2), (6,2), (7,2), (8,2), (9,2), (10,2), (11,2), (12,2), (13,2), (14,2), (1,3), (3,3), (5,3), (6,3), (7,3), (8,3), (9,3), (10,3), (12,3), (14,3), (1,4), (3,4), (4,4), (6,4), (7,4), (8,4), (9,4), (11,4), (12,4), (14,4) |
| `MORNAY_COURT_MAP` | 18 → 33 | (2,8), (11,8), (3,11) |
| `MORNAY_COURT_MAP` | 18 → 34 | (2,4), (5,4), (10,4), (13,4) |
| `MORNAY_COURT_MAP` | 33 → 18 | (2,9), (4,9), (11,9), (13,9) |
| `MORNAY_COURT_MAP` | 33 → 19 | (2,3), (4,3), (11,3), (13,3) |

## Residential refinement verification and walkthrough

The production checkpoint is `80bdddfbe8f22602f63be36e0ead2f034569cb7d` (`feat(mornay): add residential life and varied room layouts`), parent `6f065af3db3c1286712f65df71ab182f2a16b803`. The following local QA checkpoint records this section and screenshots; its parent is `80bdddf`. No merge, push, rebase, force-update or application to another worktree occurred in this pass.

| Verification | Result |
|---|---|
| Baseline at the unchanged starting MVP checkpoint | 229/229 complete suites passed |
| Focused Mornay block 300–314 | 15/15 passed after every confirmed defect was corrected |
| Final `node test/run.js` | **233/233 passed**, including historical singleton, Formation, party-command, Resonance, Sera/Liora, ferry, Fens, Rise and earlier-town compatibility |
| Syntax | All 26 changed/new JavaScript files passed `node --check` |
| `validateGameData()` | 275 maps, 481 registry NPCs; zero errors, the same twelve pre-existing warnings; no Mornay occupancy warning |
| SAVE_VERSION / payload | Version 5; no new fields; all 41 room save contexts round-trip and 328 forged contexts reject atomically |
| Resident access | All 300 distinct conversations reachable and unshadowed on workday and Dayoff; twelve patrols sweep safely and pause/resume |
| New navigation coverage | 164 complete furnished door journeys: all 41 rooms × workday/Dayoff × continuous/legacy setting, including nested apartment save/load and walking fully outside |
| Both town gates | Controller and Chrome entry/exit, gate save/load, safe West (240,144) / East (272,144) returns facing down, no immediate re-entry, ordinary exit after debug warp |
| Services | Four deterministic inventories/buy/sell flows, two inns at existing 30/40 gold, and existing lawful selected-member treatment remain operational |
| Rendering | Each room fixture, resident and player once; actor/furniture depth order, HUD-only room names and exact old-town stationary Canvas dispatch verified |
| Facades / reservations | Closed homes remain solid and inert; all street arms walkable; Collegium, hydrographic office, harbour departures, ship, island ferry and suspected meeting places remain inactive |
| Transition audit | 275 valid grids; 390/390 fixed destinations, eight preserved-coordinate routes and 240 edge segments pass; 258 non-Mornay fixed-transition records are byte-equivalent |
| Regional geography | All 115 fingerprints unchanged; 160 continuous seams and 115 layout placements retained |
| Terminology / state | Reclaimers retained, no stale faction terminology introduced, no ambient flag/reward/quest/faction mutation; Esla remains green |
| Repository checks | Whitespace, conflict markers, stale references and final file list reviewed; other worktrees unchanged |

Only `test/transition-audit-output.json` was regenerated, through `node test/transition-audit.js --write`, then verified without writing. Its changed sections are registry IDs, dimensions, Mornay fixed transitions and tile usage. The catalogue grows 251 → 275 and fixed destinations 342 → 390 because 24 new rooms each have entry and exit. There are no catch-up changes to non-Mornay fixed transitions. Regional fingerprint artifacts were not regenerated.

The change surfaces are the Mornay map/door/fixture authority; the existing roster and derived schedules; the catalogue note; read-only Mornay rendering and its narrow dispatch hooks; the plan/status/architecture documentation; existing exact-count and route tests; four new behavioral suites; browser walking/capture checks; the transition artifact; and the QA capture package. No shop stock, service recovery authority, lore canon, save schema, combat system, regional grid or other town content was edited.

### Browser evidence

Automated headless Chrome used the real input listeners, Canvas fonts, storage and production update/render functions at 512×480 and 1024×960. The final run passed **6,731 assertions**, produced **166 captures**, and reported **zero browser errors**. It walks from street/parent arrivals to every door, uses all shops/inns/treatment, exercises both gates in both settings plus debug/save/load routes, visits all exterior maps, checks representative dialogue clusters and measures all 293 ambient dialogue presentations. It also verifies unchanged Calwick/Drenwick rendering. This is automated browser evidence, not a manual human playthrough.

Thirty-six representative captures (eighteen views at both scales) are tracked with dimensions and SHA-256 values in [the capture manifest](Art/qa/mornay/residential-v1/manifest.json). These are canvas captures at the displayed pixel sizes; the existing DOM/HUD map title is intentionally outside the exported canvas. Native-scale and 2× images were visually inspected for readable numbers/signs, furniture, actor depth and crowding.

| View | Native | 2× |
|---|---|---|
| South housing and care street | [512×480](Art/qa/mornay/residential-v1/mornay_south_upper_west_map-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_south_upper_west_map-2x.png) |
| East Ward residential street | [512×480](Art/qa/mornay/residential-v1/mornay_middle_lower_east_map-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_middle_lower_east_map-2x.png) |
| South Rows and ward services | [512×480](Art/qa/mornay/residential-v1/mornay_south_upper_east_map-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_south_upper_east_map-2x.png) |
| Glyn household | [512×480](Art/qa/mornay/residential-v1/mornay_glyn_home-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_glyn_home-2x.png) |
| Net maker’s home | [512×480](Art/qa/mornay/residential-v1/mornay_reed_home-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_reed_home-2x.png) |
| Vale House | [512×480](Art/qa/mornay/residential-v1/mornay_vale_home-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_vale_home-2x.png) |
| Examiner’s House | [512×480](Art/qa/mornay/residential-v1/mornay_dane_home-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_dane_home-2x.png) |
| Dock Steps common room | [512×480](Art/qa/mornay/residential-v1/mornay_dock_steps-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_dock_steps-2x.png) |
| Repairer’s flat | [512×480](Art/qa/mornay/residential-v1/mornay_dock_steps_unit_1-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_dock_steps_unit_1-2x.png) |
| Seamworker’s flat | [512×480](Art/qa/mornay/residential-v1/mornay_dock_steps_unit_4-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_dock_steps_unit_4-2x.png) |
| Boarding common kitchen | [512×480](Art/qa/mornay/residential-v1/mornay_boarding-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_boarding-2x.png) |
| Shared boarding bedroom | [512×480](Art/qa/mornay/residential-v1/mornay_boarding_unit_3-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_boarding_unit_3-2x.png) |
| Ward School | [512×480](Art/qa/mornay/residential-v1/mornay_school-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_school-2x.png) |
| Gate Inn | [512×480](Art/qa/mornay/residential-v1/mornay_gate_inn-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_gate_inn-2x.png) |
| Ledger House | [512×480](Art/qa/mornay/residential-v1/mornay_commercial_inn-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_commercial_inn-2x.png) |
| Regional IJC Office | [512×480](Art/qa/mornay/residential-v1/mornay_office-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_office-2x.png) |
| Harbour/customs office | [512×480](Art/qa/mornay/residential-v1/mornay_harbour-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_harbour-2x.png) |
| Infirmary | [512×480](Art/qa/mornay/residential-v1/mornay_infirmary-1x.png) | [1024×960](Art/qa/mornay/residential-v1/mornay_infirmary-2x.png) |

### Short human walkthrough

1. Enter West Gate, visit Wold’s Inn at (3,5), then go north to South Upper West. Inspect the infirmary (12,5), Hume common room (3,10) and its four numbered bedrooms, then Pate’s Kitchen (12,10).
2. In South Upper East, inspect the school (12,5), apothecary (3,5), and South Rows apartments (3,10). Walk into a numbered flat, save/load there, then walk back through the common room to the street.
3. Visit East Ward Shared Court in Middle Lower East (3,9), Rann Workroom in Middle Lower Central West (12,5), and Glyn Household in Middle Lower Central East (3,5). Compare homes and neighbours with the public workspaces.
4. Visit Dock Steps in Middle Upper West (3,9), and Reed’s Net Room in Middle Upper East (3,9). Inspect domestic repair work, beds and storage. Check Ferin at school on a workday and Dock Steps Flat 4 on Dayoff; Maris returns to the Glyn home.
5. In North Upper West compare Ledger House (11,5) with Vale House (11,8). In North Upper East visit Examiner’s House (3,8), then inspect the still-closed Civic Collegium. Visit the Regional IJC office in Middle Upper Central East (3,5) and harbour office in North Lower West (11,5).
6. Use each shop and both inns, speak with care staff and selected labour/Reclaimer-linked residents, and repeat at 2× scale. Check that counter access, patrols, signs, flat numbers and Esla’s green interjections read naturally. Save inside each gate and exit; leave through East Gate as well as West Gate. Confirm no reserved harbour or story route opens.

Remaining editorial judgments are the deliberately generous shared circulation areas, the repeated construction logic of some flats, Corra’s front-step phrasing, and the established names/prices/flavour dialogue. They do not block navigation or services and can be revised without making new canon. No confirmed implementation defect remains from either review.

### Final worktree preservation

All twenty registered worktrees were inspected. Nineteen retain exactly their starting HEAD and porcelain status, including both unrelated dirty worktrees. No active merge, rebase, cherry-pick, revert or bisect operation was present. The Mornay branch ends clean after the local QA commit; its full final hash is supplied in the delivery message.

| Worktree | Branch | HEAD | Final status |
|---|---|---|---|
| `empire-game` | `main` | `fe5992ec4bb647ce6f89554ad409a16a143769ec` | Clean |
| `empire-game-claude` | `agent/claude` | `3758d01beb014d50f918c34a98f20735b9ca4a42` | Unchanged; 65 porcelain entries (listed below) |
| `empire-game-codex` | `agent/codex` | `6f065af3db3c1286712f65df71ab182f2a16b803` | Clean |
| `empire-game-integration` | `integration/eastern-party-foundations` | `3d5413a8b3094070da503c5cb05c0a689b4c92b5` | Clean |
| `empire-game-mornay-population` | `agent/mornay-population` | QA delivery commit, parent `80bdddf` | Clean after delivery commit |
| `bullet-time` | `bullet-time` | `ff43da6bf6161d0dd5a2a5fc89b1b5ff570e2cbf` | Clean |
| `canonical-transition` | `canonical-transition` | `190dd83c17720eeb08579f0a5f483cd3ae87cf98` | Clean |
| `enemy-id-authority` | `enemy-id-authority` | `a75b700b7f9e685469fbae2ca28b777475b8bee1` | Clean |
| `enemy-pool-registry-consumers` | `enemy-pool-registry-consumers` | `a1a43ab559b51f2ff249541fdf2f3fad842d7f06` | Clean |
| `mundane-dilemmas` | `mundane-dilemmas` | `e8b624b83032a4ed8354f110669333665e86e801` | Clean |
| `post-door-top` | `post-door-top` | `6aa7a828471e844692aff48875fdbf0b5674af76` | Clean |
| `regional-content-split` | `regional-content-split` | `318503b4863ed136cad010f5e600039990b9f524` | Clean |
| `save-binding-migration` | `worktree-save-binding-migration` | `a949335a0bf5674eedb15789e09c158cae61b91c` | Clean |
| `secret-northern-road-seam` | `secret-northern-road-seam` | `d37c360dbe55f852f3ac3edcea16a866a9c648e3` | Clean |
| `sluice-easy-top-floor` | `sluice-easy-top-floor` | `507b6965a21b86086d7c796b784c1bf081053f0e` | Clean |
| `sluice-top-fix` | `sluice-top-fix` | `42e82da663378c610b2523952e260e43c509fc2c` | Clean |
| `small-fixes-2` | `small-fixes-2` | `3b5e22f801dc639ad1df4aa3377a05f83872dd27` | Clean |
| `small-fixes-batch` | `small-fixes-batch` | `f98861c7fdfa6c9f5197fe493b3ac5fed9ff2335` | Clean |
| `stable-ids-v3` | `stable-ids-v3` | `29607ee4d943277a56c2e919d3ddb53612138e33` | Clean |
| `status-cure-contract` | `status-cure-contract` | `6ecccd8536e905f1d4e2ed1335ebc806b31b774d` | Unchanged; 5 porcelain entries (listed below) |

Unchanged `empire-game-claude` status:

```text
 M ENEMY_CAPABILITY_AUDIT.md
 M OVERWORLD_ATLAS.md
 M combat.js
 M content/maps/eastern-fens-maps.js
 M data.js
 M index.html
 M render-battle.js
 M test/cases/100-east-causeway.test.js
 M test/cases/101-west-outfall-canal-tunnel.test.js
 M test/cases/102-north-basin-drowned-rim.test.js
 M test/cases/103-north-basin-mirewood.test.js
 M test/cases/104-eastern-reaches-abandoned-farmhouse.test.js
 M test/cases/105-small-ui-pickup-and-gold-polish.test.js
 M test/cases/106-thornmere-lighthouse-dual-quests.test.js
 M test/cases/107-thornmere-lighthouse-interior.test.js
 M test/cases/155-formation-four-command-integration.test.js
 M test/cases/161-eastern-fens-route.test.js
 M test/cases/175-eastern-fens-exploration.test.js
 M test/cases/176-eastern-fens-envelope.test.js
 M test/cases/177-eastern-fens-western-pockets.test.js
 M test/cases/178-eastern-fens-nw-open-fen.test.js
 M test/cases/186-enemy-capability-migration.test.js
 M test/cases/188-status-specials-party-combat.test.js
 M test/cases/189-unusual-enemy-capabilities-party-combat.test.js
 M test/cases/191-universal-party-combat-compatibility.test.js
 M test/cases/200-eastern-fens-mornay-encounter-content.test.js
 M test/cases/201-travellers-rise-campsite.test.js
 M test/cases/207-travellers-rise-campfire-night.test.js
 M test/cases/209-eastern-fens-new-terrain-tiles.test.js
 M test/cases/213-eastern-fens-storm-shoals.test.js
 M test/cases/215-eastern-fens-valmere-mornay-peninsula.test.js
 M test/cases/52-stable-persistence-ids.test.js
 M test/cases/58-regional-content-split.test.js
 M test/cases/69-world-view-and-drawmaptiles.test.js
 M test/cases/71-continuous-world-view.test.js
 M test/cases/72-continuous-seams.test.js
 M test/cases/73-continuous-neighbour-content.test.js
 M test/cases/76-geographic-encounters.test.js
 M test/cases/77-map3-fen-seam-pilot.test.js
 M test/cases/78-verdant-vale-legacy-home.test.js
 M test/cases/83-map3n2-northbasin-seam-closure.test.js
 M test/cases/84-canonical-regional-position.test.js
 M test/cases/85-canonical-consumers-part2.test.js
 M test/cases/86-regional-chunk-catalog.test.js
 M test/cases/88-continuous-regional-production-default.test.js
 M test/cases/89-west-outfall-scenery-chunk.test.js
 M test/cases/90-north-basin-open-reservoir.test.js
 M test/cases/91-north-basin-open-reservoir-east.test.js
 M test/cases/92-north-basin-eastern-woods.test.js
 M test/cases/93-north-basin-open-reservoir-far-east.test.js
 M test/cases/94-north-basin-east-shore-reservoir.test.js
 M test/cases/95-north-basin-eastern-road.test.js
 M test/cases/96-eastern-canal-banks.test.js
 M test/cases/97-northern-thornmere-fen.test.js
 M test/cases/98-thornmere-upper-shallows-scenery.test.js
 M test/cases/99-thornmere-canal-head.test.js
 M test/fixtures/regional-grid-fingerprints.js
 M test/transition-audit-output.json
 M world-transitions.js
?? content/maps/eastern-shore-maps.js
?? content/maps/great-fen-maps.js
?? content/maps/southern-moraine-maps.js
?? content/maps/valmere-expanse-maps.js
?? test/cases/218-great-fen-expansion.test.js
?? test/cases/219-valmere-expanse.test.js
```

Unchanged `status-cure-contract` status:

```text
 M interactions.js
 M maps.js
 M npcs.js
 M render-interiors.js
 M test/cases/30-rest-week-inn-and-dayoff-closures.test.js
```


## Two Jorans — subsequent optional sidequest

The original 300-resident roster is unchanged. Two additional named quest
characters are registered separately: Joran Beck (stoneworker, watchhouse booking
room until released, then Old Fort) and Joran Alden (freight contractor, Fen
Warehouse). Existing Anric, Perris and Varda support the evidence trail.

Anric separates mistaken accusations after four accounts; Beck gives a key to
five Sapper Charges at the Old Fort. Local detention correction does not unlock
the barred jail, activate Old Fort plot content or advance MQ5. The supply box
uses an existing blocked wall cell; no floor plan, doorway or terrain changes.
See `MORNAY_TWO_JORANS_PLAN.md` for exact identities, locations and persistence.
Names and local phrasing remain revisable content.
