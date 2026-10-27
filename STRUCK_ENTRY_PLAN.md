# The Struck Entry / The Weight Discrepancy

Starting checkout: main, d2861931401ccb6256137ae76646610cecb48084. Existing staged: none; 98 dirty/untracked paths from earlier work preserved. No Git mutation or other worktree changes authorized. Previous full regression: 268/268 passed, validation 0 errors / 6 existing warnings.

## Story and geography

Sedge Hollow is an ordinary fen hamlet of peat cutters, reed harvesters and eel fishers, entered from Great Fen Gravel Spur (chunk 8,-3), at a footpath sign (local 7,4). Its cottages, kitchen gardens, reed-drying racks and natural channels belong to the fen; the local timber footbridge has no lock or canal works. This optional discrete branch has one regional entrance and return. It creates no regional seam, early-game access, camera change or shortcut to Mornay. Existing regional grids remain untouched.

Iswen Dorr (41), a waterfront net mender in Mornay Middle Lower West, played with Corvin as a child. Her mother Heddra (67) formerly cooked for the Drenwick canal crews. When that work ended, she moved to Sedge Hollow with her belongings and papers she had saved as the old office was emptied. The tally travelled with her; the canal did not extend here. Injured neighbour Belric Nall (63) has a splinted leg. All are ordinary commonborn. Elset (71) and Tam (29) remain at Sedge Hollow. Names, ages and flavour are revisable content.

Heddra and Belric are in the shelter. After four clearances, a short narrated evacuation takes them along the cleared route to a supply scow. Lely stays at the settlement; this is not a new passenger ferry. Heddra lodges at Wold’s Gate Inn, near Iswen’s work; Belric recovers at Mornay Infirmary. Each has one NPC identity with derived location. Esla contributes only when available, and uses ordinary splinting/support rather than miraculous healing.

The Drenwick canal remains the modest waterway from Drenwick to the western river, with all existing locks and terrain untouched. Iswen’s childhood was in Drenwick; her current net-mending work is on Mornay’s waterfront. The old-office clue records Heddra’s change of address rather than implying a distant canal depot.

Stable `THIRD_LOCK_*` map/content IDs, `third_lock_*` feature IDs and source filenames are retained for saved locations and content references. All destination titles, directions and journal text use Sedge Hollow. The existing **Third Lock Towpath Tally** item retains its stable name: it is the historical Drenwick third-lock record, carried to the hamlet in Heddra’s belongings. No new save field or migration is introduced.

## Maps and encounters

Seven local maps: approach, cottages, common cottage, survivors’ shelter, reed cut, crossing, old landing. Four required visible formations: approach (two Fen Lurkers), shelter lane (Hollowreed Choker + Bog Serpent), reed cut (Fen Witch + two Reed Grapplers), crossing (Fen Rootworm + Fen Lurker). Optional old landing: Willow-veiled Stalker + Fen Witch + Bog Serpent. All use existing stats, capabilities, sprites and ordinary XP/gold/drops. No new enemy templates or HP inflation.

| Battle | Formation | Standard XP | Standard gold range |
| --- | --- | ---: | ---: |
| Required 1 — approach | Two Fen Lurkers | 76 | 16–36g |
| Required 2 — shelter lane | Hollowreed Choker + Bog Serpent | 92 | 21–39g |
| Required 3 — reed cut | Fen Witch + two Reed Grapplers | 102 | 22–46g |
| Required 4 — crossing | Fen Rootworm + Fen Lurker | 96 | 21–40g |
| Optional — landing | Willow-Veiled Stalker + Fen Witch + Bog Serpent | 170 | 39–72g |

Required combat totals: 366 base XP and 80–161g; all five: 536 base XP and 119–233g, plus the existing ordinary drop rolls. These are template totals paid through the shared reward owner, not additional quest payouts.

The optional cache contains a Reinforced Travel Coat, two Elixirs and two Reed Remedies. A one-time relief chest supplies three Potions, one Trollbane and two Sapper Charges. Tally and carved toy boat are ordinary special items; granted together after rescue, consumed together at Corvin’s resolution. No extra cash reward for the favour. Renn’s existing 60g payout remains.

## Ownership and order

Existing corvin_favor_started/done and weight_quest_stage/weight_note_signed/cabinetCaseFlag remain authoritative. Added save-v5 defaulted bindings: struck_entry_stage (0 unknown, 1 lead/exploration, 2 survivors contacted, 3 rescued, 4 delivered), struck_entry_wins (five victory bits), struck_entry_cache, struck_entry_supplies. No party/presence/equipment writers. Pre-existing completed favour remains completed even without expedition fields.

The old-office lead is available in Drenwick’s existing office. Iswen can give directions directly once Corvin has asked; no mandatory address retrieval. Exploration/rescue before accepting Corvin’s favour is supported, retaining the tally until he asks. Corvin cannot edit his father’s entry: Lely attests the recovered original and writes the restoration. Completing this does not sign or file Renn’s correction automatically. Existing filing choices/consequences remain.

Combat uses scriptedPartyEncounters tokens and canonicalPartyCombat, including a deliberately scoped one-member entry for this expedition. Only authenticated victory sets clearance bits. Defeat/escape never clear a gate. Local doors remain reciprocal; progress gates affect forward access only. No escort engine or new save schema.


## Location inventory and walkthrough

Coordinates below are local tile centres unless marked as pixels.

| Map | Function / residents | Progress and returns |
| --- | --- | --- |
| `THIRD_LOCK_APPROACH_MAP` | Fen footpath; two visible lurkers | Southern exit returns to Great Fen Gravel Spur; northern path opens after fight 1 |
| `THIRD_LOCK_COTTAGES_MAP` | Two occupied cottages, abandoned shells, gardens, handcart; Tam (5.5,10.5) | Eastern cottage lane opens after fight 2; common cottage and optional landing remain discoverable |
| `THIRD_LOCK_COMMON_MAP` | Elset (8.5,5.5), domestic furniture, relief chest (12.5,2.5) | West cottage door, return to main settlement |
| `THIRD_LOCK_SHELTER_MAP` | Heddra (5.5,5.5), Belric (10.5,4.5), bed, stove and supplies | East cottage door, always-returnable once inside |
| `THIRD_LOCK_REED_CUT_MAP` | Western escape route; witch and grapplers | Fight 3 opens north path; south returns to cottages |
| `THIRD_LOCK_CROSSING_MAP` | Local timber footbridge over a natural channel; rootworm and lurker | Fight 4 completes rescue clearance; return south to collect survivors |
| `THIRD_LOCK_LANDING_MAP` | Optional abandoned landing and supply box (8.5,2.5) | Harder fight; no regional exit or story shortcut |

1. Accept Corvin's existing Dayoff favour at Calwick's inn (its existing once-per-Dayoff availability roll is preserved). Speak to Iswen on `MORNAY_MIDDLE_LOWER_WEST_MAP` at (7.5,8.5), or inspect the northeast closure-record shelf in `DRENWICK_OFFICE_MAP` at (12.5,2.5).
2. Find the HOMES marker at `GREAT_FEN_C8RN3_MAP`, world chunk (8,-3), local (7.5,4.5). Space offers entry. Arrival is approach pixels (240,400); return is Great Fen pixels (240,176), facing down. No existing regional grid cells change.
3. Clear the approach, visit Elset's western cottage for supplies, clear the eastern cottage lane and speak to Heddra. Clear the western reed cut and crossing. Return to Heddra for the short cart/scow evacuation. The player remains at cottages pixels (240,272).
4. Optionally clear the eastern abandoned landing and open its supply box. Previously cleared fights stay cleared through retreat, defeat, travel and save/load.
5. Heddra is now at `MORNAY_GATE_INN_MAP` (11.5,11.5); Belric is at `MORNAY_INFIRMARY_MAP` (6.5,11.5). Speak to Iswen again for the aftermath. The three are reachable on both workdays and Dayoff.
6. Deliver the tally and boat to Corvin in Calwick's office on a workday or inn on Dayoff. His first question is whether Heddra is safe. Speak again for the existing countersignature, choose whether to file at the office cabinet, then return to Renn for the existing 60g reward.

Useful review lines: Iswen remembers Corvin correcting a game score nobody was keeping; Elset remembers his mother recognizing shirts by their worn elbows; Belric remembers his father checking the last rope twice. Heddra says, “Tell him his father’s name was never missing in this house.” Corvin recognizes the thumb-darkened page corner and the repaired boat: “He said a boat was allowed to be a boat.”

## Verification and review notes

Tests separate lifecycle fixtures (high attack to exercise authenticated outcome/writeback without measuring balance) from browser pacing. Browser pacing uses the existing MQ5 checkpoint build, unequipped, with three Potions and two Elixirs, then only naturally collected relief supplies. Deterministic RNG 0.5 makes runs reproducible. It is not a balance sweep across levels, equipment or enemy random rolls. An earlier deliberately weaker solo build could clear the required route but exhausted its supplies at the optional fight; retreat and preparation remain meaningful. No enemy stats or combat formulas changed.

The full browser route uses actual key events for walking, doors, dialogue, command selection, targeting and battle playback. Fixtures place the party at the regional marker and, after the expedition, at existing town-room arrival points; it does not claim a continuous overworld walk between towns. Manual browser input separately checks marker entry/return and 1×/2× readability. Corvin's ordinary offer/random availability remains covered by existing suite 60. Suites 333/334 cover both Polwick outcomes, real temporary Esla absence, all five escape/defeat retries, one-time items/rewards, older completed saves, invalid save rejection, door/save return paths and connected walkable terrain.

Only `test/transition-audit-output.json` is regenerated, through `node test/transition-audit.js --write`. Relative to this task's already-dirty starting artifact: 1,247 → 1,254 maps and 448 → 461 fixed transitions (the thirteen new local doors); regional placements/edges remain unchanged. Earlier uncommitted geography/Mornay artifact changes remain preserved. Regional fingerprints are verified, not regenerated.

## Incremental file inventory

This inventory distinguishes this task's edits from the many pre-existing uncommitted changes. Map/dialogue/NPC fragments and `struck-entry.js` implement the new branch; existing owners register it. Test changes preserve explicit map totals, item classification and exact dialogue assertions while adding the authorized seven maps, two key items and one Great Fen marker. Existing offer/countersignature, main-route, combat and save tests remain substantive.

- `PROJECT_STATUS.md`
- `STRUCK_ENTRY_PLAN.md`
- `architecture.md`
- `content/interactions/calwick-interactions.js`
- `content/interactions/drenwick-interior-interactions.js`
- `content/interactions/third-lock-dialogue.js`
- `content/maps/third-lock-maps.js`
- `content/npcs/calwick-npcs.js`
- `content/npcs/third-lock-npcs.js`
- `continuous-content.js`
- `data.js`
- `index.html`
- `interactions.js`
- `items.js`
- `movement.js`
- `npcs.js`
- `quests.js`
- `render.js`
- `save.js`
- `scripted-party-encounters.js`
- `struck-entry.js`
- `test/cases/100-east-causeway.test.js`
- `test/cases/101-west-outfall-canal-tunnel.test.js`
- `test/cases/102-north-basin-drowned-rim.test.js`
- `test/cases/103-north-basin-mirewood.test.js`
- `test/cases/104-eastern-reaches-abandoned-farmhouse.test.js`
- `test/cases/124-small-meaningful-polish.test.js`
- `test/cases/171-party-command-status-hardening.test.js`
- `test/cases/201-travellers-rise-campsite.test.js`
- `test/cases/207-travellers-rise-campfire-night.test.js`
- `test/cases/218-mornay-exterior-topology.test.js`
- `test/cases/301-mornay-manifest.test.js`
- `test/cases/315-great-fen-expansion.test.js`
- `test/cases/333-struck-entry-expedition.test.js`
- `test/cases/334-struck-entry-navigation.test.js`
- `test/cases/51-save-binding-registry-migration.test.js`
- `test/cases/58-regional-content-split.test.js`
- `test/cases/60-corvin-struck-entry.test.js`
- `test/cases/98-thornmere-upper-shallows-scenery.test.js`
- `test/cases/99-thornmere-canal-head.test.js`
- `test/third-lock-browser.html`
- `test/third-lock-browser.js`
- `test/transition-audit-output.json`
- `test/transition-audit.js`
- `validation.js`


## Final verification results

- Baseline: 268/268 suites. Final: **270/270 passed**, including 14 new lifecycle/navigation scenarios and the original combat, ferry, campsite, main-route, Mornay, Corvin and filing suites. Initial integration run exposed old exact totals/text/item-list assumptions; they were updated narrowly, then the complete suite passed.
- All 96 changed/untracked JavaScript files in the shared checkout pass `node --check` (including earlier work). `git diff --check` passes; no conflict markers or deletions introduced.
- `validateGameData()`: **0 errors, 6 pre-existing warnings**. Final catalogue: 1,254 maps, 497 NPC records, 149 items; 1,058 regional chunks and 1,946 continuous seams unchanged. SAVE_VERSION remains **5**.
- Regional fingerprint suite passes with no fingerprint edits in this task. Transition audit regenerates and then matches read-only: 461 fixed destinations, 8 preserved-coordinate transitions, 2,026 edge segments and 42 house-door checks; no new regional edge.
- Browser: **909 assertions pass** across 512×480 solo and 1024×960 accompanied fixtures, all five fights, shelter save/load, evacuation, Mornay aftermath, Corvin's resolution, countersignature, explicit filing and Renn's 60g payout. Separate temporary-absence fixture suppresses Esla. No browser runtime errors observed.
- Reproducible browser combat rounds: solo **4 / 5 / 5 / 8 / 6**; accompanied **2 / 3 / 3 / 5 / 3**, in required 1–4 / optional order. These measure the documented fixture and deterministic rolls only.
- Manual browser checks: marker entry and ordinary walking return at both scales; sign/prompt spacing, dialogue fitting, cottage/survivor staging, green Esla text, Mornay placement, Corvin and filing presentation visually inspected. Full continuous between-town travel was not manually replayed.
- Starting/final HEAD unchanged: `d2861931401ccb6256137ae76646610cecb48084`, branch `main`. Nothing staged, committed, merged, rebased or pushed. Final shared-checkout status: **76 modified tracked paths / 37 untracked paths**, including all 98 pre-existing dirty paths; this task has the 45-file incremental inventory above. Other worktrees untouched.

Remaining editorial/playtest questions: difficulty across other builds/random rolls; whether to shorten the rescue or Corvin scene; eventual richer cart/scow staging. Current evacuation is deliberately a bounded narration/transition, with no escort subsystem or passenger shortcut. No incomplete quest stage remains.

## Geography correction — Sedge Hollow

This increment changes 63 local cells across five expedition exteriors, using existing tile IDs only. The two cottage interiors, all thirteen doors, NPC positions, encounter anchors/formations, rescue state and rewards are unchanged. Every other authored grid—including Drenwick and all regional chunks—is unchanged from the start of this correction. Local map names, entry sign, clues and notebook text now identify the hamlet independently of the Drenwick canal. Kitchen beds and the timber footbridge are read-only presentation over existing walkable terrain. Reed racks reuse the established tile/rendering contract.

Exact deltas use zero-based (column,row):

| Map | Tile change | Cells |
| --- | --- | --- |
| `THIRD_LOCK_APPROACH_MAP` | WATER → REEDS | (10,1), (11,1), (10,2), (11,2), (10,5), (10,6), (10,7), (11,7), (10,8), (11,8), (10,11), (10,12), (11,12), (10,13), (11,13) |
| `THIRD_LOCK_COTTAGES_MAP` | GRASS → REED_RACK | (8,3), (13,7) |
| `THIRD_LOCK_COTTAGES_MAP` | GRASS → WATER | (1,10) |
| `THIRD_LOCK_COTTAGES_MAP` | GRASS → REEDS | (2,10) |
| `THIRD_LOCK_COTTAGES_MAP` | WATER → REEDS | (5,11), (4,13), (5,13) |
| `THIRD_LOCK_REED_CUT_MAP` | WATER → REEDS | (4,1), (4,2), (3,3), (4,3), (4,6), (4,7), (3,8), (4,8), (4,11), (4,12), (3,13), (4,13) |
| `THIRD_LOCK_CROSSING_MAP` | GRASS → WATER | (1,5), (2,5), (3,5), (4,5), (11,10), (12,10), (13,10), (14,10) |
| `THIRD_LOCK_CROSSING_MAP` | WATER → REEDS | (11,6), (12,6), (13,6), (14,6), (1,9), (2,9), (3,9), (4,9) |
| `THIRD_LOCK_LANDING_MAP` | WATER → REEDS | (4,1), (3,2), (4,2), (4,3), (4,6), (3,7), (4,7), (3,8), (4,8), (4,11), (4,12), (3,13), (4,13) |

Incremental file inventory (earlier uncommitted files are preserved):

- `STRUCK_ENTRY_PLAN.md`
- `content/interactions/third-lock-dialogue.js`
- `content/maps/third-lock-maps.js`
- `content/npcs/third-lock-npcs.js`
- `struck-entry.js`
- `test/cases/334-struck-entry-navigation.test.js`
- `test/third-lock-browser.html`
- `LORE.md`
- `PROJECT_STATUS.md`
- `architecture.md`
- `quests.js`

Manual walkthrough: speak to Iswen on Mornay’s Middle Lower West waterfront; compare the forwarding-address clue in Drenwick’s office; enter via the HOMES board on Great Fen Gravel Spur; inspect the gardens and drying racks; cross the cleared timber footbridge; return for Heddra and Belric, then deliver the historical tally and boat to Corvin. The displayed hamlet name Sedge Hollow remains revisable flavour.

Correction verification: **270/270 full regression suites pass**; focused suites 333/334 pass all **16 lifecycle/navigation scenarios**, including the new forwarding-address and footbridge save/load checks. The browser fixture passes **909 checks** at 512×480 and 1024×960 through all five fights, rescue, delivery and filing; no browser errors. Automated route replay is distinct from manual marker entry/exit and visual inspection of the hamlet, footbridge and dialogue. All 96 dirty/new JavaScript files pass syntax. Validation: **0 errors / 6 existing warnings**. Transition audit matches read-only; no artifact regeneration or fingerprint edits. SAVE_VERSION **5**. All other pre-existing file bytes are preserved. Branch remains `main` at `d2861931401ccb6256137ae76646610cecb48084`; nothing staged, committed or pushed. Shared checkout now has 77 modified tracked paths and 37 untracked paths, including earlier work.
