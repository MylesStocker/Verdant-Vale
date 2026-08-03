# Regression test suite

Run everything:

```
node test/run.js
```

No dependencies (uses Node's built-in `assert` and `vm` modules only), no
browser required, exits non-zero on failure so it's CI-friendly.

## How it works

The game is plain `<script src="...">` tags with no bundler — every file
shares one global scope, the same way real `<script>` tags do. `harness.js`
recreates that: it parses `index.html` for its current script order, stubs
out `document`/`canvas`/`ctx`/`localStorage`, and loads every file into one
Node `vm` context in that order. Because it reads the order from
`index.html` itself, the harness stays correct if scripts are ever added,
removed, or reordered there — nothing to update in the harness.

Each test case in `cases/*.test.js` calls `createContext()` to get its own
fresh, isolated game (no state leaks between tests), then drives it with:

- `g.press(key)` — a real keydown+keyup tap (matches input.js's fire-once-
  per-press guard; use this for menu/dialogue/combat confirms).
- `g.hold(key)` / `g.release(key)` — keydown only / keyup only, for held
  movement across multiple frames.
- `g.frames(n)` — calls the real `update()` n times.
- `g.renderFrame()` — calls the real `render()` once.
- `g.run(code)` — evaluates arbitrary code in the game's global scope and
  returns its value; used both to read state (`g.run('player.x')`) and to
  set up scenarios directly (teleporting the player, pinning an enemy's
  stats, etc).

## Coverage

- `01-boot-intro` — every script loads in real `index.html` order with no
  throw; the intro dialogue's starting state is correct; closing it via real
  Enter presses works.
- `02-movement-boundary` — holding Down walks the player onto the house's
  door tile and `exitBuilding()` fires, restoring the pre-house map/position.
- `03-menu-debug-menu` — the pause menu and debug menu each open/close via
  their real keys (`M`/`Escape`, `` ` ``).
- `04-npc-dialogue` — a full interaction dialogue (open → every page →
  close) via `handleInteract()`.
- `05-combat` — a full fight from `startCombat()` through attack, message
  advances, victory, and `endCombat()`, asserting exact XP/gold gained.
- `06-save-load` — `saveGame()`/`loadGame()` round-trip through a stubbed
  `localStorage`, including the "no save present" case.
- `07-fort-quest-retry` — regression guard for QUEST_TRACE.md Issue #1: the
  smugglers'-fort guard fight is abandoned (simulated via `endCombat()`,
  same call both a flee and a loss funnel through) and must still be
  retriggerable and completable afterward, rather than soft-locking
  `fort_quest_stage` forever.
- `08-fort-found-nothing-ticket` — regression guard for QUEST_TRACE.md Issue
  #2: choosing "Found nothing" when reporting the fort back to the
  Supervisor must still issue a pay ticket (reduced, 15g via
  `fort_pay_ticket_reduced`) and still advance `MainQuest` to 3, rather than
  withholding both permanently.
- `09-basement-save-load` — regression guard for TRANSITION_AUDIT.md Issue
  #1: saving while inside the Drenwick school basement must restore the
  basement (and the player's exact position there) on load, not silently
  leave the player on whatever map was active at load time.
- `10-transition-audit` — wires `test/transition-audit.js` (the full map/
  transition/exit-tile integrity sweep — see `TRANSITION_AUDIT.md`) into the
  regular suite. Asserts every map dimension, transition destination,
  preserved-axis crossing, tile-constant cross-reference, and house-door
  return position the audit script checks. If this fails, run
  `node test/transition-audit.js` directly for the full human-readable
  breakdown of what broke.
- `11-starting-kit-requisition` — the player now starts with an empty
  inventory; the Supervisor issues a requisition ticket alongside the first
  assignment (the sluice job), and Aldric exchanges it for the starting kit
  (Iron Sword + Leather Armor) on next visit, then reverts to his normal
  dialogue on every visit after. Covers the ticket grant, the exchange, the
  ticket being consumed, and Aldric *not* repeating the exchange on a second
  visit.
- `12-combat-item-turn` — regression guard for the balance-audit finding
  that using an item in combat used to be a completely free action (no
  enemy counter). Proves, via real keypresses, that using a potion now
  applies its effect *and* lets the enemy respond afterward via the shared
  `enemyTurnResponse()` helper (same formula as Attack's counter).
- `13-combat-item-back-no-turn` — companion to 12: backing out of the item
  subscreen (via the "[ Back ]" row + Enter, or the direct `b`/`Escape` key)
  must still spend no turn and trigger no enemy response, in either case.
- `14-cabinet-case-weight-quest` — `cabinetCaseFlag` used to be declared,
  schema'd, synced, and read but never once set anywhere (an orphaned flag).
  It's now wired into the Weight Discrepancy quest's completion: once Corvin
  countersigns, Aldric redirects the player to file the note themselves at
  the Calwick office's Filing Cabinet, where a 3-option branching choice
  (only reachable via real dialogue/choice-box state, not internal function
  calls) is the actual, mandatory point where the flag flips and the quest
  can reach stage 3. Covers the pre/post-sign Aldric dialogue split, the
  cabinet's branching choice, the "decline" option being a stall rather
  than a dead end (and the cabinet remaining retriable afterward), Esla's
  reactive line, and save/load round-tripping the new `weight_note_signed`
  flag alongside `cabinetCaseFlag`.
- `15-combat-message-wrap` — the combat message box used to draw
  `combat.message` with a single, unwrapped `fillText()` call, so long
  messages (most visibly Slither's "The slug's slime soaks in. Slithered!
  (SPD randomized each turn)") ran straight off the right edge of the
  panel. Fixed with a `wrapMonospaceText()` helper in `render-battle.js`,
  used to wrap the message (capped at 2 lines, ellipsis-truncated beyond
  that) with everything below it in the panel shifted down to match, while
  every box's *bottom* edge is preserved so nothing else can overflow
  either. Since the real canvas stub's `measureText()` always returns a
  fixed width (see "Known simplifications" below) and can't verify actual
  wrapping math, this test calls the real, loaded `wrapMonospaceText()`
  directly with a fake proportional-width ctx against several real
  in-game messages (including the exact reported Slither line) and a
  pathological unbroken-long-word case, then separately smoke-tests that a
  full render with that message active doesn't throw across every combat
  phase.
- `16-south-ruins-entrance` — the new South Ruins Entrance Hall
  (`DUNGEON_ENTRANCE_MAP`), a no-encounter area between the overworld and
  the monster-infested dungeon floor 1, with its own `inDungeonEntrance`
  state flag kept deliberately separate from `inDungeon`/`dungeonFloor` so
  it can never pick up a combat-encounter pool. Covers the full transition
  chain (`enterDungeon()` -> `descendToDungeon1()` ->
  `ascendToDungeonEntrance()` -> `exitDungeon()`); that walking around the
  hall never triggers a random encounter even with `Math.random()` forced
  to 0 (the value that would guarantee one on every roll if the area were
  mistakenly wired into an encounter pool); that the corridor up to the
  stairs is actually walkable end to end (regression guard: Perrin
  originally stood at col 9, inside the corridor's own col 6-9 span,
  blocking it -- now checks both that exact coordinate and a real walk up
  that column reaches the corridor); that Rovan and Perrin both greet the
  player by name (`stats.name`), not just generically; and that
  `inDungeonEntrance` round-trips through save/load. Verified both the
  encounter-suppression and corridor-clear checks actually guard their
  regressions (not just tautologies) by temporarily reintroducing each bug
  and confirming the test fails, then restoring the fix.
- `17-north-basin-entry` — the skeleton first map of a future 3×3 "North
  Basin" region north of Drenwick (`NORTH_BASIN_S_MAP`), reached via a new
  causeway/exit added to `MAP3_N2` at row 0 col 12 (extending north from the
  Imperial bridge's north landing). Drives the actual crossing both
  directions via real held-key movement across the tile boundary (stopping
  the instant `activeMap` changes, rather than holding for a fixed frame
  count — an early version of this test overshot straight past the landing
  spot and kept walking on the *new* map for the leftover held-key frames,
  which is worth knowing if a future test in this style flakes the same
  way). Also covers a save/load round-trip on the new map (needs no
  dedicated flag — `NORTH_BASIN_S_MAP` is a plain `activeMap` value,
  persisted generically via `MAP_REGISTRY`), and confirms the map's one
  still-unbuilt edge (east — the future SE neighbour) has no working exit —
  every border tile there is checked to be the plain impassable border
  tile, not an accidentally-wired transition. (North and west *were* also
  "future, no exit yet" edges when this test was first written; they're
  real connections now that `NORTH_BASIN_C_MAP` and `NORTH_BASIN_SW_MAP`
  exist, and this test's assertions for both were updated accordingly rather
  than left stale — see `18-north-basin-center` and
  `19-north-basin-silt-flats` below.) Verified the crossing assertion is
  load-bearing by temporarily disabling the tile trigger and confirming the
  test fails, then restoring the fix.
- `18-north-basin-center` — the North Basin's centre reservoir
  (`NORTH_BASIN_C_MAP`), the second map of the future 3×3 grid, directly
  north of `NORTH_BASIN_S_MAP` (whose own north edge was updated from "no
  exit yet" to a real crossing as part of adding this map). Mirrors test 17's
  structure exactly: real held-key crossing both directions, save/load
  round-trip, the *other* three edges (north/east/west — the future
  N/E/W neighbours) still plain impassable border, and zero `GRASS` tiles
  (encounter-free by construction, same reasoning as the south approach).
  Verified load-bearing the same way as test 17.
- `19-north-basin-silt-flats` — the North Basin's Silt Flats
  (`NORTH_BASIN_SW_MAP`), southwest of `NORTH_BASIN_S_MAP` (whose own west
  edge, row 10 col 0, was updated from "no exit yet" to a real crossing as
  part of adding this map — reached by going *off* the road rather than
  continuing along it, unlike the north/centre crossing). This is the
  region's first real encounter map, so unlike 17/18 it isn't a safe
  skeleton: it has `GRASS` on purpose and its own enemy pool
  (`NORTH_BASIN_ENEMY_TEMPLATES`, gentler by design than
  `FAR_ENEMY_TEMPLATES` — see combat.js's comment there re: not repeating the
  Rotwood Troll spike from `BALANCE_REPORT.md`). Covers the same
  crossing/save-load/edge-border pattern as 17/18, plus two things unique to
  a combat-bearing map: repeatedly calling `startCombat()` and asserting
  every enemy name produced is one of `NORTH_BASIN_ENEMY_TEMPLATES` (never
  the generic or FAR pool), and a static check that both new enemies
  (Silt Crab, Mudflat Strider) have a `drawBattleEnemy()` dispatch entry in
  `render-battle.js` — this codebase has a documented history of enemies
  shipped without one, which leaves them invisible in combat. Verified both
  the crossing assertion and the battle-sprite-dispatch assertion are
  load-bearing the same way as tests 17/18 (disabled the tile trigger /
  removed the dispatch line, confirmed the test fails, restored the fix).
  (Later revised twice more: once to shrink the map's water down to a literal
  3×3 "reservoir finger" per a follow-up request, which also added a real
  north exit — `NORTH_BASIN_W_EXIT` at row 0 col 4 — so the edge-border
  assertions were updated the same way test 17's were; and once because the
  30-iteration `startCombat()` loop can, rarely, hit combat.js's unrelated,
  pre-existing 1-in-256 "23" secret encounter that overrides *any* map's
  pool — that's real intentional behaviour, not a bug, so the valid-name set
  now allows for it too. Confirmed stable across five repeated full-suite
  runs after that fix, since it's inherently a randomness-dependent test.)
- `20-north-basin-badlands` — the North Basin's Badlands (`NORTH_BASIN_W_MAP`),
  north of the Silt Flats (whose own north edge, row 0 col 4, is the real
  crossing added for this map). At the user's request this map shares the
  Silt Flats' enemy pool rather than getting its own harsher tier, so this
  test checks that the *same* `NORTH_BASIN_ENEMY_TEMPLATES` pool is reached
  from this map too (not a second, separately-defined pool that happens to
  contain the same two enemies) — same "23" secret-encounter allowance as
  test 19, for the same reason. Also covers two things specific to this
  map's named requirements: exactly one `TRAPPER_HUT` tile exists, is
  impassable, and (via a full flood-fill from the entrance) doesn't seal off
  any part of the map; and the requested "line of higher ground along the
  western edge" is checked literally — a solid column of `EXPOSED_STONE`
  down column 1, rows 1-13. Verified the crossing assertion is load-bearing
  the same way as the earlier North Basin tests.
- `21-edge-transitions` — the new generic `EDGE_TRANSITIONS` system
  (`world-transitions.js`), which lets a player walk off a broad open edge
  segment of a map (not a single point tile) into an adjacent one. Converted
  two existing North Basin links to use it as the proof of concept:
  `NORTH_BASIN_S_MAP` (South Approach) and `NORTH_BASIN_C_MAP`
  (Reservoir), north/south, and `NORTH_BASIN_S_MAP` and
  `NORTH_BASIN_SW_MAP` (Silt Flats), east/west — both used to be
  `NORTH_BASIN_C_EXIT`/`NORTH_BASIN_C_ENTRANCE`/`NORTH_BASIN_SW_EXIT`/
  `NORTH_BASIN_SW_ENTRANCE` point-tiles, now fully retired (tile IDs 84-87,
  left unused rather than renumbering everything after them).

  This test went through two passes. The first shipped with deliberately
  mismatched source/target ranges on both links (Reservoir's south edge two
  columns narrower than South Approach's north edge; Silt Flats' east edge a
  row narrower than South Approach's west edge) specifically to exercise
  clamping — but that mismatch was live in actual gameplay, not just a test
  fixture, and a real player hit it two ways: crossing at the wide side's
  extreme columns/rows got clamped onto the narrow side (surprising, and
  visibly inconsistent — "3 open squares one way, 2 open the other"), and
  one of the "normal" landing columns (South Approach row 1, col 13) turned
  out to be `WATER` — an actual soft-lock. Both North Basin range pairs are
  now symmetric (South Approach's north edge and the Reservoir's south edge
  are both cols 1-14; South Approach's west edge and the Silt Flats' east
  edge are both rows 9-11), and every landing row/column is walkable across
  its *entire* range, not spot-checked — this test now walks the full range
  in both directions, not just a couple of representative points, since that
  full sweep is exactly what would have caught col 13 being water.

  Clamping itself is still real system behaviour (a future map might
  legitimately need mismatched ranges), so it's proven separately: the test
  temporarily replaces South Approach's real `north` segment with a
  test-only one carrying a deliberately narrower target range, checks
  clamping at both extremes lands somewhere walkable, then restores the
  exact shipped segment before continuing. The blocked-condition check uses
  the same swap-and-restore technique (an earlier version used a fake
  direction key like `'_testBlocked'` instead of the real `'north'`, which
  accidentally exercised the *y*-axis instead of *x* — `tryEdgeTransition()`
  picks the axis by checking whether direction is literally `'north'`/
  `'south'`, so anything else silently reads the wrong coordinate).

  Also covers: a nonexistent edge (South Approach's own east, which has no
  entry in either direction) returning false and leaving the player and map
  untouched, checked both via a direct `tryEdgeTransition()` call and via
  real held-key movement into the (still-solid) border; and a representative
  untouched point-tile transition (`MAP` and `MAP2`) confirming the existing
  system is unaffected by any of this. Verified the crossing assertion is
  load-bearing by temporarily disabling the edge-transition interception in
  `movement.js`'s movement loop and confirming the test fails, then
  restoring the fix.
- `22-map-metadata` — the new `MAP_METADATA` registry (`data.js`), the
  central per-map bookkeeping table that replaced the scattered, growing
  per-map conditionals in `locationName()`, `currentItemList()`, and
  `combat.js`'s enemy-pool ladder. Checks (0) `MAP_REGISTRY` and
  `MAP_METADATA` have exactly the same key set; (1) `locationName()` returns
  the right name for an outdoor map purely through the metadata lookup, with
  no per-map hardcoded line left for it (`NORTH_BASIN_SW_MAP`, `MAP2`); (2)
  `currentItemList()` returns the exact `MAP3_N1_ITEMS` array (not a copy)
  for a map with a real pickup; (3) it also returns an empty array rather
  than throwing both for a map metadata explicitly marks as itemless
  (`NORTH_BASIN_C_MAP`) and for a map with *no* metadata entry at all — a
  throwaway 15×16 array standing in for "a brand-new map nobody has wired up
  yet," which is exactly the gap this table exists to make loud rather than
  a silent `undefined`; (4) deleting a registered map's metadata entry
  produces a specific `validateGameData()` warning, not silence; (5) a
  metadata entry pointing at an `undefined` map constant is caught the same
  way, without `validateGameData()` throwing partway through the rest of the
  table; and (6) both an untouched point-tile transition (`MAP` to `MAP2`)
  and the `EDGE_TRANSITIONS` system (South Approach to the Reservoir) still
  work after the migration, since both paths resolve maps through
  `mapRegistryId()`/`MAP_METADATA` machinery this pass touched. Also
  confirms validation goes fully clean again after both temporarily-injected
  breakages (4, 5) are undone, so the test doesn't leak state into later
  runs. Verified load-bearing by temporarily disabling the `locationName()`
  metadata lookup and confirming the test fails, then restoring the fix.
- `23-debug-map-inspector` — the developer-only Debug Map Inspector / Warp
  Tool: `debugInspector`/`warpMenu` state (`state.js`),
  `debugWarpToMap()`/`debugFindNearestWalkableTile()`/
  `debugEdgeTransitionSummary()`/`debugNearbyTransitionInfo()`
  (`world-transitions.js`), `debugTileName()` (`tiles.js`), and the extended
  debug menu (`render-ui.js`, `input.js`). Covers all 7 points asked for:
  the inspector's underlying data (map id, tile coords, encounter
  eligibility/pool, nearby-transition summary) can be read without
  throwing, and a full `render()` with the inspector open doesn't throw
  either; warping to a valid map + a *confirmed-walkable* coordinate lands
  exactly there with `facing`/`combat.cooldown` set and every special
  location flag (`inDungeon`/`inTown`/etc) cleared, even when warping away
  from one of those areas; an unknown map id is rejected without touching
  `activeMap`/position; an out-of-bounds coordinate is clamped into range
  and a blocked-but-in-bounds one nudges to the nearest walkable tile,
  neither ever leaving the player off-map or stuck in a wall; normal
  movement and the pause menu are unaffected with every debug overlay
  closed, and the debug-only `'i'` key has zero effect on the normal menu;
  and both an existing point-tile transition (`MAP` to `MAP2`) and the
  `EDGE_TRANSITIONS` system (South Approach to the Reservoir) still work,
  with the latter's data also checked against `debugEdgeTransitionSummary()`
  directly. One bug caught while writing this test: the first draft picked
  `NORTH_BASIN_C_MAP` col 7 row 7 as a "known-good" warp target for the
  exact-landing case without checking it against the real map data — that
  tile is open reservoir water, not walkable, so `debugWarpToMap()`
  (correctly) nudged the landing spot elsewhere and the assertion failed
  against the wrong expected coordinate. Fixed by picking and verifying an
  actually-walkable tile (row 12) for that case, leaving the nudge-to-
  nearest-walkable behavior itself covered separately, deliberately, with a
  known-blocked tile. Verified load-bearing by temporarily short-circuiting
  `debugWarpToMap()` to always fail and confirming the test catches it,
  then restoring the fix.
- `24-content-validation` — the expanded `validateGameData()` content
  linter (`validation.js`), rebuilt as ten focused functions
  (`validateMaps`/`validateMapMetadata`/`validateTiles`/
  `validateEdgeTransitions`/`validateNPCs`/`validateItems`/`validateEnemies`/
  `validateDialogue`/`validateSaveFlags`/`validateMapFeatures`) with a real
  error-vs-warning severity split (`addValidationError`/
  `addValidationWarning`, collected into `VALIDATION_ERRORS`/
  `VALIDATION_WARNINGS` and returned structurally, not just printed) and a
  grouped, readable report. Covers all 12 points asked for: current game
  data validates with zero errors; a malformed map size, a missing
  `MAP_METADATA` entry, an unknown numeric tile ID, an `EDGE_TRANSITIONS`
  segment pointing at a nonexistent map, an out-of-range `sourceRange`, a
  target range that lands entirely on blocked tiles, an out-of-bounds NPC,
  and a structurally invalid enemy template (`maxHp < hp`) are each
  constructed temporarily and confirmed to produce a specific, identifying
  error, then immediately restored; an excessively long dialogue line is
  confirmed to produce a warning, not an error, without validateGameData()
  throwing; and the real `MAP` to `MAP2` point transition and the real
  North Basin `EDGE_TRANSITIONS` crossing both still work end-to-end, with
  the table itself validating error-free afterward. Two real, pre-existing
  bugs were found and fixed while building this (not merely detected and
  left as warnings, since they were clear, narrowly-scoped content bugs
  rather than balance/gameplay changes): ten enemy templates (Hollow, Fen
  Shade, Tomb Sentry, Crypt Revenant, Wall Tendril, Dripping Maw, The Seep,
  Pale Drowned, Silt Hag, Pale Sentry) had no battle sprite mapping in
  `render-battle.js` and would have rendered as nothing at all in combat --
  fixed by adding a generic fallback sprite (`drawBattleGenericEnemy()`) and
  a `BATTLE_SPRITE_NAMES` registry so `validateEnemies()` can flag any
  future enemy in the same situation as a warning instead of a silent
  blank. Also caught and fixed during development (not pre-existing bugs,
  but bugs in the validator itself, corrected before this test file was
  finalized): a solid-NPC overlap check that collapsed every `house:`
  interior into one bucket, producing ~500 false-positive warnings between
  NPCs in entirely different houses; dialogue-length thresholds calibrated
  against a guess rather than this game's real writing style (median
  authored line is ~57 characters and relies on the renderer's word-wrap,
  so an initial 58-character threshold flagged nearly every line in the
  game -- recalibrated using the real distribution); a `dialogue: null`
  convention (used by `pip`/`mirethyst` for NPCs whose interaction is
  handled entirely through their `action` callback) that was incorrectly
  rejected as "not an array"; and several `window[name]` string-keyed
  lookups (for enemy-template pools and non-map-scoped item/chest arrays)
  that silently resolved to `undefined` because those constants are
  declared with top-level `const` in this codebase, which -- unlike `var`
  or an explicit `window.X = X` assignment -- never actually becomes a
  `window` property; switched to real `typeof X !== 'undefined' ? X :
  undefined` identifier checks, matching the convention already used
  everywhere else in this file. Verified load-bearing by temporarily
  disabling the map-dimension check inside `validateMaps()` and confirming
  the test catches it, then restoring the fix.
- `25-tile-properties` — the new `TILE_PROPERTIES` terrain-metadata
  registry (`tiles.js`): name/category/tags/encounterEligible plus flags
  (`isWater`/`isRoad`/`isWall`/`isInterior`/`isDungeon`/`isTransition`/
  `isDecorative`/`isSecret`/`deprecated`) for all 89 real tile constants
  plus the 4 retired-but-still-present numeric ids, its helper functions
  (`getTileProperties`/`getTileName`/`isTileWalkable`/
  `isTileEncounterEligible`/`tileHasTag`/`isWaterTile`/`isRoadTile`/
  `isTransitionTile`), movement.js's conservative migration to
  `isTileWalkable()`/`isTileEncounterEligible()`, the debug inspector's new
  `PROPS:` line, and validation.js's new "Tile Properties" group. Covers
  all 11 points asked for: `isTileWalkable()` matches the real `WALKABLE[]`
  array exactly for representative tiles across every context (outdoor,
  interior, dungeon, North Basin) and for an unknown tile id; movement
  still blocks on a temporarily-water-walled row and still crosses ordinary
  ground after the `canWalk()` migration; encounter eligibility is
  unchanged for outdoor GRASS (eligible), outdoor PATH (not), a real
  dungeon-floor tile in its own floor context (eligible), and North
  Basin's BASIN_MUD (not, despite being walkable); a full render() with the
  debug inspector open (now showing tile category/tags) doesn't throw; an
  unknown tile id, a tile with no `TILE_PROPERTIES` entry despite having a
  `WALKABLE` entry, and a deliberately-mismatched `WALKABLE`/
  `TILE_PROPERTIES.walkable` pair are each constructed temporarily and
  confirmed to fail validation with a specific, identifying error, then
  restored; the real `MAP` to `MAP2` point transition and the real North
  Basin `EDGE_TRANSITIONS` crossing both still work; and the debug menu's
  "Validate Data" row still works end-to-end (shows a toast, leaves the
  menu open) with its underlying structured result actually carrying a
  "Tile Properties" group entry, not just console text. `TILE_PROPERTIES`
  is built with `walkable: WALKABLE[CONST]` for every entry (a live
  reference, not a re-typed literal) specifically so it can never
  transcribe a value wrong; a script cross-check while building it
  confirmed the 89 real tile names line up 1:1 with both
  `DEBUG_TILE_NAMES` and a new `RENDERABLE_TILE_IDS` Set (`render-tiles.js`,
  mirroring `drawTile()`'s switch cases the same way `BATTLE_SPRITE_NAMES`
  mirrors the battle-sprite dispatcher) before any of it was wired into
  validation. Verified load-bearing by temporarily disabling the
  `WALKABLE`/`TILE_PROPERTIES.walkable` agreement check and confirming the
  test catches it, then restoring the fix.
- `26-map-features` — the new `MAP_FEATURES` content-authoring system
  (interactions.js): generalized `'inspect'`/`'trigger'` map features
  replacing the `INTERACTION_REGISTRY` pilot (all 9 entries migrated, not
  kept alongside it), `tryMapFeatures()`/`checkMapFeatureTriggers()`/
  `debugMapFeatureInfo()`, the reordered interaction priority in
  `handleInteract()`, and the new "Map Features" `validateGameData()`
  group. Covers all 15 points asked for: an existing NPC (Maren) and an
  existing chest (`DUNGEON_CHEST`) still work; a migrated environmental
  sign (the North Basin road sign) still shows its exact original text; a
  fresh `inspect` feature displays text on interact; an `inspect` feature
  co-located with an NPC does not steal the interaction (the NPC wins);
  interacting where nothing exists doesn't crash; a `trigger` zone fires on
  entry, does not re-fire every frame while standing/moving inside it, and
  fires again after leaving and re-entering; `onceFlag` shows `repeatPages`
  on a second entry; conditional `inspect` text shows `pages` when true and
  `fallbackPages` when false; a feature pointing at a nonexistent map, an
  out-of-bounds inspect coordinate, an invalid trigger rectangle, and
  duplicate feature ids each fail validation with a specific error; and the
  debug inspector's new feature-info line renders without crashing and
  correctly reports North Basin's 5 real features plus which one the
  player is standing near. One thing caught while writing this test, not a
  pre-existing bug but a wrong assumption of mine while building the
  system: `onceFlag` is a plain `window[name]` boolean (works within the
  current session, proven directly), but `saveGame()` persists only flags
  explicitly listed in `QUEST_FLAG_SCHEMA` (`save.js`) rather than a
  blanket dump of every global -- so a freshly-invented `onceFlag` does NOT
  survive save/load until its name is also added to that schema. Rather
  than risk a schema change to make this automatic, this was deferred (per
  the brief's own escape hatch) and validation now warns whenever a used
  `onceFlag` isn't registered in `QUEST_FLAG_SCHEMA`, so it's never a
  silent surprise; the test asserts the actual (session-only) behavior and
  that the warning fires. Also found and fixed during development: a real
  bug in my own first `movement.js` edit, where a missing closing brace put
  the new trigger-zone check *inside* the (usually empty) world-item-pickup
  `for` loop instead of after it, so it silently never ran on any map with
  zero unpicked items on it -- caught by direct testing of the trigger
  mechanism before this test file was finalized, not by the test itself.
  Verified load-bearing by temporarily removing the `!dialogue.open`
  priority guard around `tryMapFeatures()` in `handleInteract()` and
  confirming the test (co-located NPC vs. inspectable) catches it, then
  restoring the fix.
- `27-post-fort-rest-week` — after the fen-post case (`MainQuest 3`), the
  supervisor's outcome-aware close-out (killed / reported / claimed-nothing
  wording, keyed on `fort_report_filed`), the ordered rest week, and the next
  main assignment (the drought-exposed reservoir bed) only becoming available
  from the first workday after the next Dayoff. Runtime: drives the office
  supervisor dialogue across the relevant flag states.
- `28-sluice-sealed-room` — the East Sluice Sealed Room: walking through the two
  `FALSE_WALL` tiles at Deep Works r7 c12–13 reaches `SLUICE_SECRET_MAP` (a
  separate registered map treated as `sluiceFloor` 4) with its own deadly
  rare-encounter pool (the Tallyman) and its bespoke inspectables. Runtime
  transitions + encounter wiring.
- `29-fenna-quest-gate` — "A Bottle for Her Father" is offered only at
  `MainQuest >= 2`; below that Fenna instead voices the drought complaint that
  seeds the quest's ingredients. Runtime dialogue gating.
- `30-rest-week-inn-and-dayoff-closures` — on the rest-week Dayoff the Calwick
  inn office staff (Supervisor / Petra / Corvin key on the filed report; Esla on
  `smugglers_dead` itself) give outcome-aware lines, and Drenwick Dayoff
  building closures (`isClosedToday`) behave. Runtime; also stubs `Math.random`
  so the Fourteenth File 1/3 offer can't perturb these Dayoff assertions.
- `31-dream-map` — resting in the player's own bed on `day % 7 === 3` enters the
  registered all-white `DREAM_MAP`, and the dialogue's close callback
  (`exitDream`) restores the waking world (map, position, facing, and the
  in-town/building flags render keys on). Runtime.
- `32-guild-hall` — the Drenwick Guild Hall: `TABLE` blockers + the furniture
  overlay (`drawGuildHallFurniture`), a visible free-standing posting board one
  tile north of the (unchanged) reading spot, and staff present on all days.
  Runtime + render.
- `33-item-registry` — `createItem()`/`grantItem()` are the single source of
  item properties: a granted item's fields come from `ITEM_REGISTRY`, key-item
  filtering routes correctly, and an unknown saved item is preserved. Runtime /
  source-of-truth.
- `34-calwick-flavor-and-basin-gull` — the Calwick flavor pass (five
  `MAP_FEATURES` inspectables across the town maps) plus the Basin Gull (the
  third North Basin enemy) with its dedicated battle sprite registered in
  `BATTLE_SPRITE_NAMES`. Runtime + validation.
- `35-upper-reach-chamber-gallery` — the North Basin NW "Upper Reach" open-edge
  crossing, its map-local exposed-bed encounters (`BASIN_MUD` only, own pool),
  the unmarked chamber (save refused), and the Sunken Gallery (save refusal plus
  a full save/load round trip after climbing back out). Runtime.
- `36-flag-dependent-dialogue` — seven NPCs converted to the `get dialogue()`
  flag-gated pattern react to filed reports / the basin assignment / Upper Reach
  evidence; proves the base pages are unaffected by which flags are set. Runtime.
- `37-roddon-way` — the Roddon Way map: registration, the reciprocal
  `EDGE_TRANSITIONS` crossing with MAP3_N1, flood-fill connectivity with sealed
  borders, encounter/save rules, the six inspectables, and `RODDON_SILT` tile
  rendering. Runtime + validation + render.
- `38-temporary-physical-evidence` — Rhen's mud and Kest's smell lines key on
  same-day `window.*_visit_day` markers that expire on day-advance and on load,
  and re-arm on a fresh visit — never permanent. Runtime.
- `39-calwick-prop-visibility` — the five Calwick inspectables sit on visible
  walkable prop tiles at their exact interaction coordinates; collision,
  interaction and render are unaffected and no NPC or house door is displaced.
  Runtime + render.
- `40-schilling-sequence-break` — defeating *or* hugging Wrongteeth before ever
  meeting Pip still awards Schilling and completes the quest, exercised through
  the real boss-choice and NPC-interaction code paths (not by granting the item
  directly). Runtime.
- `41-north-bridge-admonishment` — crossing the north bridge before the
  reservoir assignment arms `north_bridge_crossed_early`; the supervisor
  questions it once (`north_bridge_scolded`), it persists across save/load, and
  never fires after the assignment, when already assigned, when never crossed,
  or on a southbound crossing. Runtime.
- `42-school-continent-map` — the Calwick school continent-map fixture:
  interacting opens/closes the overlay panel, a real render doesn't throw, and
  no game state changes. Runtime + render.
- `43-dialogue-wrapping` — the dialogue-page formatting contract: continuous
  prose stored as one string wraps with no orphaned words, and intentional
  breaks (separate strings) are preserved. Exercises the `render-ui.js` wrap
  helpers directly (source/behavior check).
- `44-chamber-dream-sequence` — the unmarked chamber's odourless first-entry
  text, and the second-exit → dream → wake-at-Drenwick-infirmary sequence.
  Runtime.
- `45-npc-movement-contract` — the additive `validateNPCs()` movement-config
  validation: synthetic patrol / scriptedRoute / boundedWander fixtures pass or
  fail with the right diagnostics (including the exclusive `COLS`/`ROWS`
  bounds), and exactly the approved real NPCs carry a `movement` config.
  Validation / static — synthetic fixtures pushed into `SIMPLE_NPCS` and popped;
  no real NPC moves in this test.
- `46-bridge-guard-toll` — the two Imperial bridge toll-guard `scriptedRoute`
  pilots: physical gating before payment, both guards' paid sidestep routes,
  resets, save/load, defeat-respawn map-locality (they don't leak onto other
  screens), and the clerk-bodied walking render. Runtime + render.
- `47-brewery-patrol` — Toby (`tobb_wend`) auto-patrols the brewery vats on a
  looping `patrol`: correct order/pauses/loop with no positional drift, waits
  when blocked, freezes to talk and resumes toward the same waypoint, stays
  map-local, and uses the worker walk render. Runtime + render.
- `48-bounded-wander` — Tomas (`tomas`) `boundedWander`s inside Esla's house:
  over many deterministic (seeded-`Math.random`) decisions he never leaves his
  bounds, enters the exit, occupies an invalid tile, or overlaps the player /
  another solid NPC; moves only orthogonally with pauses; every global freeze
  stops him; live interaction stops/faces/resumes him; he's map-local; save/load
  restores a valid home; and the patron walk render animates then returns to the
  exact stationary sprite. Runtime + render.
- `49-fourteenth-file` — the Fourteenth File side quest: the 1/3 Dayoff
  availability roll (offered / not / stable within a Dayoff / gated), assignment,
  the three far-flung `MAP_FEATURES` clues, and the report with its moral choice
  (file accurately vs seal the warden's part), the partial-evidence path, and
  save/load. Runtime.
- `50-history-book-ariel` — the Calwick schoolhouse bookshelf gains a sixth
  reading entry, a plainer scholarly Fort Ariel note shelved among the five
  Imperial primers; the note opens in the parchment reader with a non-primer
  heading and the defensible facts, while the primers keep their heading.
  Runtime.
- `51-save-binding-registry-migration` — the quest-flag save binding registry
  and the versioned migration layer (`save.js`). Asserts the binding-registry
  contract (unique keys, a stable 85-key ordered snapshot, `QUEST_FLAG_SCHEMA`
  derived from it, every binding has a default + callable get/set, both
  lexical and window kinds present), a complete round-trip of *all* 85 flags
  plus their window mirrors, missing-field fallback to declared defaults (never
  the dirtied session value, `vale_tutorial_seen` included), the sequential
  **v1→v2→v3** migration (existing flag values + non-flag fields survive both
  steps, absent flags default, legacy positional pickup / per-chest state maps to
  stable ids, normal key rewritten to **v3** with only `verdantVale_save_backup_v1`
  created — no fabricated v2 backup — and never overwritten, a current v3 load
  re-migrates/rewrites nothing), and that a save it can't understand (malformed /
  future / unversioned / missing-step) is refused *and left untouched on disk*
  rather than deleted. Includes a load-bearing section that breaks a binding
  setter, the v1→v2 registration, and the future-version guard in turn —
  confirming each check fails, then restoring in a `finally`. Runtime.
- `52-stable-persistence-ids` — the stable-identity systems (`#4`): immutable
  ids for the 47 world pickups, 9 openable chests and 51 enemy templates, v3
  id-based persistence, and the v2→v3 migration. Asserts the registry contracts
  (one valid unique id each; keys === object/template ids; all random + scripted
  enemy templates represented; both Mire Toads share their display name but have
  distinct ids; combat-start paths — boss/Takomo/Kolm/a random encounter/the
  inline "23" — preserve the template id). Proves **pickup persistence is by id,
  not array position** (reverses a pickup array, saves/loads, confirms the same
  objects are collected — fails if index persistence returns) and **chest
  persistence is by id** and independent of registry enumeration order, with the
  nonstandard home-chest gold / dresser / sparkle fields surviving. Exercises the
  v2→v3 migration on a realistic legacy payload (positional booleans + per-chest
  fields → stable ids, unrelated state preserved, legacy fields removed, verbatim
  write-once `backup_v2`), and unknown-id handling (warn not throw, no gameplay,
  preserved + deduped on resave). A load-bearing section breaks a pickup id, a
  chest migration mapping, an enemy registry entry, the v2→v3 registration and
  id-based application in turn, confirming each check fails then restoring in a
  `finally`. Runtime.
- `53-canonical-location-transition` — the canonical location-transition
  boundary (`#5`): the `LOCATION_STATE_BINDINGS` registry and
  `transitionToLocation()` (`world-transitions.js`). Asserts registry
  completeness (all ~25 location fields); that dirtying every field then doing a
  neutral outdoor transition resets EVERY one (no hand-copied list can forget
  one); that invalid destinations — unknown map, out-of-bounds/non-finite
  coordinates, bad facing, unknown state key, invalid floor, contradictory
  modes — each return false and leave all map/position/facing/cooldown/flags
  untouched (atomic); and that representative real transitions (town district/
  building/house with source+return context that doesn't leak, dungeon floors,
  sluice floors + Sealed Room, basin chamber, sunken gallery, bridge from both
  directions with toll/direction cleared on exit, an edge transition preserving
  a coordinate, debug warp with its clamp + full reset + no side effects, and
  the defeat-relocation-to-home shape) land on walkable tiles with
  `currentMapId()`/`currentEncounterPool()` agreeing. Confirms the East Sluice
  top floor still rolls Marsh Wisp/Sluice Slime, and that `loadGame()` restores
  location WITHOUT running a transition (cooldown untouched). Load-bearing
  section breaks reset coverage, a special-flag application, and rejects a
  contradictory destination, restoring in `finally`. Runtime.
- `54-status-cure-contract` — the shared status-cure contract (`combat.js`).
  Asserts status-restoring items (Reed Remedy, Amethyst Dust) show a BLANK
  `itemStatLabel()`/`itemStatParen()` (no cured-status leak, no empty `()`),
  while ordinary heal/equipment labels are unchanged; that in real combat a cure
  removes an active matching status with its existing confirmation, or reports
  the exact "Used <item> — nothing happens." while still consuming the item and
  the turn (the enemy still acts); that a cure removes ONLY its matching status;
  that a future/temporary `curesX` property routes through the same
  `applyStatusCure()` path automatically (no new branch); and that an
  unregistered `curesX` property is a `validateGameData()` error. Runtime.

## Known simplifications (see comments at the top of each affected test)

- **Combat is entered via `startCombat()` directly**, not by walking through
  grass until the random-encounter roll fires. The encounter *trigger* is
  probability/cooldown-based flavor timing, not logic worth pinning down in
  a regression test; `startCombat()` is the same function that path calls.
  The enemy's stats are then overwritten to `{hp:1, def:0}` so the fight's
  *outcome* is deterministic without mocking `Math.random` (mocking it would
  mean mutating the one `Math` object shared across every test's `vm`
  context, which risks leaking between test files).
- **Save/load is invoked directly** (`g.run('saveGame()')`), not by
  navigating the pause menu's save/load confirm screens — menu navigation
  itself is covered separately in `03-menu-debug-menu`.
- **The NPC dialogue test uses the survey-marker `MAP_FEATURES` inspectable**
  (formerly an `INTERACTION_REGISTRY` pilot entry, migrated -- see
  `26-map-features`), not a `SIMPLE_NPCS` entry, so it needs no quest-flag
  setup — just standing in the right spot. It exercises the same
  open/advance/close dialogue pipeline a real NPC conversation would.
- Menu ↔ debug-menu switching is not tested in *both* directions: reading
  `input.js` shows `` ` `` is only handled by the plain-overworld keydown
  branch, so it has no effect while the pause menu is already open (and
  vice versa) — the currently-open one has to be closed first. That's real,
  intentional-looking behavior, not a gap in the test.

## Not covered yet

- The warn-only legacy-fallback restore path in `loadGame()` (an old save with
  no `activeMapId`, where `activeMap` is derived from the stored `inX` flags).
  (Save-file schema drift and version handling are now covered by `51` and `52` —
  the binding-registry round-trip, the sequential v1→v2→v3 migration + per-source
  backups, id-based pickup/chest persistence, unknown-id preservation, and the
  never-delete guarantees for malformed/future/unversioned/missing-step saves;
  save/load *round-trips* also in `06`, `09`, `49`, and one corrupted-save repair
  in `46`.)
- Shop buy/sell gold flows, equip/unequip, and the notebook/inventory menu
  screen. (The Aldric requisition *exchange* is covered in `11`, and reading
  panels in `42`/`50`, but no test drives a gold buy/sell or the equip UI.)
- Most special/boss combat variants — the Pale Sentry contract fight, the sailor
  brawl (Kolm), Mulholland, the Den Wraith, Takomo, the rainfish chain, and the
  1-in-256 "23" encounter. (Wrongteeth's boss-choice path *is* covered, through
  real combat, in `40`; a generic random fight in `05`; a retriable guard fight
  in `07`.)
- Actual rasterized/pixel output. The canvas context is a no-op stub, so no test
  asserts what a frame literally looks like. Several render tests (`46`–`48`,
  `50`) do, however, assert on the *sequence of draw calls* (`fillRect`
  arguments + `fillStyle`) to prove walk frames differ, stationary sprites stay
  byte-identical, and unrelated NPCs are unchanged.

(No longer gaps, now that they are covered: individual map/building transitions
— `world-transitions.js` is exhaustively exercised by the transition audit
(`10`), with the bridge toll gate specifically in `46` and many crossings in
`16`–`21`/`28`/`35`/`37`; and quest-gated NPCs / multi-stage quest dialogue —
see `07`/`08`/`14`/`27`/`29`/`36`/`40`/`41`/`49`.)

Extending: drop a new `NN-name.test.js` file in `cases/` exporting
`{ name, run() }` (`run` may be async) — `run.js` picks it up automatically,
no registration needed.
