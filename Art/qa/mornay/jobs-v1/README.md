# Mornay optional jobs — 2026-10-29

Historical initial-board evidence: the Maw’s rootworm art, HP and ordinary-fight
tuning below are superseded by [the Swallow revision](../maw-swallow-v1/README.md).
Other jobs and the board lifecycle evidence remain applicable.

Implemented on `main`, starting from `dc425d2`, with a clean initial worktree.
No commit or push requested. All changes remain unstaged.

## Playable content

Read the board in **South Mornay — Upper East**, tile (7,5), near the watchhouse.
It directs the party to existing residents; reading notices does not accept work.
All jobs require MQ5 or later, independently of one another.

- **The Peat-Bed Maw:** Iset, peat stall in Middle Lower West. Willow Basin,
  Great Fen chunk (-3,-8), local centre (272,208). 250g paid on return, 210 XP
  through combat. Boss HP360, Attack38, Defence12, Speed9.
- **The Ridgeback Snapper:** Torlin, Rusk Workshop Court on Middle Lower Central
  East. Upper River Valley, chunk (28,6), centre (368,208). 300g paid on return,
  230 XP through combat. Boss HP330, Attack40, Defence14, Speed12.
- **A Copy of a Copy:** Gessa on Middle Upper West → Arlis in Regional IJC Office
  → Gessa → Maura in Harbour Office → Gessa. 35g once. The packet appears in
  Notebook Special Items until delivered. The hoist stays condemned.

Both removal sites are connected to Mornay through existing ordinary land
routes. They are deep in wilderness, not in the town approach. Hunt dialogue and
journal give the named terrain, broad directions and survey square. Neither
creature enters a random pool. Warnings precede explicit confrontation; retreat
and defeat do not clear the job. Payments require returning to the giver.

Existing NPC identities, population, grids, doors, seams, camera settings,
encounter pools, main quest and story reservations are unchanged. SAVE_VERSION
is 5; three default-zero quest fields preserve progress in existing v5 saves.

## Evidence

Suite 339 exercises ordinary held movement to the board and existing NPCs,
Space/Enter dialogue and battle entry, both boss victories with solo and party
combat, rejected remote/forged starts and outcomes, retreat/defeat, duplicate
payment callbacks, each errand delivery, save/load, missing-field defaults,
invalid-save atomic rejection, journal/special item presence, text pagination,
read-only board rendering and wilderness reachability. The route graph uses
live terrain and reciprocal transitions. It is not a manual wilderness walk.

Manual Chrome review used `test/mornay-jobs-preview.html`: an isolated MQ5 fixture
that places the player at review locations and loads no saved game. Normal
Space/Enter controls were used after placement. Reviewed the board, Iset and
Torlin offers, both field targets, first boss battle entry, Gessa/Arlis dialogue
and Gessa's covering request. Captures cover native 512×480 and 2×1024×960 canvas
scales. A full manual wilderness journey and unassisted boss victory remain
recommended playtests; victories and the complete errand were automated.

- `board-1x.png`: first notice, native scale.
- `esla-advice-1x.png`: removal advice, only Esla's words green.
- `peat-maw-field-1x.png`: rootworm and damaged peat/timber marker.
- `peat-maw-battle-1x.png`: existing rootworm art in shared canonical battle.
- `torlin-offer-1x.png`: carpenter's contract and readable pagination.
- `ridgeback-field-2x.png`: full-page capture of the eastern target at 2×.
- `gessa-offer-2x.png`: full-page capture of the delivery offer at 2×.
- `errand-esla-1x.png`: “We should charge the paper rent. It has visited half the town.”

Balance smoke simulation used the established MQ5 checkpoint, Lely level10 and
Esla level11 with checkpoint equipment, fixed .5 RNG and basic attacks only.
Both bosses were beaten, with Lely104HP and Esla fallen. This shows a feasible
fight, not a complete difficulty audit. Supplies, healing and retreat matter;
fees/stats/dialogue remain revisable content.

Final full regression: **275 tests, 275 passed, 0 failed**. Focused suite 339
and the save-binding round-trip suite also passed separately. `git diff --check`
is clean. Syntax checks passed for all 19 changed/new JavaScript files.

Validation: 0 errors, 6 existing warnings. All 1,058 regional fingerprints are
unchanged. Transition audit matches its existing artifact: 1,263 maps, 479 fixed
transitions, 8 preserved-coordinate transitions and 2,026 edge segments. No
geographic artifacts were regenerated. All changed/new JavaScript passes syntax.
The enemy capability audit is a hand-maintained classification document; its
new rows and exhaustive registry assertions account for exactly two ordinary
boss templates. Item parity adds the packet as an unavailable key item. Save
registry assertions add three deliberate, defaulted fields without weakening
uniqueness, round-trip or failure checks.

## Walkthrough

1. At MQ5 read all three notices in South Upper East. Check that no job is yet
   accepted. Find Iset and Torlin at the places named by the board.
2. Accept either removal; check notebook directions. Save/load, travel to the
   marked remote clearing, decline confrontation once, then enter combat.
3. Try retreat and return, defeat/retry if desired, then win and revisit the
   giver. Confirm the creature stays gone and repeat conversations cannot pay.
4. Repeat for the other removal, using the eastern Reedbank crossing route.
5. Accept Gessa's errand, follow the notebook through both desks and back, saving
   midway. Confirm Special Items contains the packet until Gessa pays 35g.
6. With Esla present, check her green words and ordinary UI colours. Verify MQ5
   remains at its prior stage and existing town exits/services still function.

## File inventory

Production: `mornay-jobs.js` (content/interaction owner); `quests.js`, `save.js`,
`items.js`, `validation.js` (journal, packet and save invariants);
`scripted-party-encounters.js`, `enemy-catalog.js`, `render-battle.js` (two
ordinary boss records, existing sprites and authenticated outcomes);
`interactions.js`, `render.js`, `index.html` (dispatch/load/render integration).

Tests: new `test/cases/339-mornay-jobs.test.js`; registry/compatibility snapshots
in suites 51, 52, 171, 186, 188, 189 and 191; review fixture
`test/mornay-jobs-preview.html` and `.js`. Documentation:
`MORNAY_TOWN_PLAN.md`, `PROJECT_STATUS.md`, `architecture.md`,
`ENEMY_CAPABILITY_AUDIT.md`, and this folder's README/screenshots.
