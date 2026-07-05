# Project Status Checkpoint

Browser JRPG, plain `<script>` tags, no build step, no git repo. This is a
snapshot, not a full report — see `architecture.md` for how everything
actually fits together.

## Current state

Playable start-to-endgame content across Calwick, Drenwick, the fen
wilderness, the South Ruins dungeon (10 floors, including a horror branch),
East Sluice (3 levels), Mirethyst's Vault, and the newer North Basin region
(4 maps: South Approach, Reservoir, Silt Flats, Badlands) reached via
`EDGE_TRANSITIONS` rather than point-tile doors. 69 registered maps total
(`MAP_REGISTRY`/`MAP_METADATA`, kept in exact agreement by
`validateGameData()`).

- **26 tests**, `node test/run.js` — all passing.
- **Transition audit**, `node test/transition-audit.js` — 69 maps, 228
  fixed-destination transitions, 24 preserved-coordinate transitions, 42
  house doors, 57 tile constants cross-referenced — clean, no findings.
- **`validateGameData()`** (call from the browser console or the debug
  menu's "Validate Data" row) — **0 errors, 2 warnings**, both intentional
  (see below), across 69 maps, 16,560 tile cells, 4 edge transitions, 159
  NPCs, 98 item placements, 29 enemy templates, 432 dialogue/text entries,
  75 save flags, 17 map features.

## The 2 current warnings, and why neither needs fixing

1. **`NOTICE_BOARD` is `isDecorative` and walkable** (`Tile Properties`
   group) — intentional, documented in `TILE_PROPERTIES`'s own `notes`
   field: it's a stand-in-front-of-it interactable, not a blocker, unlike
   most decorative tiles.
2. **One dialogue line (`npc.student_a1`) is 549 characters** (`Dialogue`
   group) — the renderer word-wraps it fine; flagged only because it's a
   genuine outlier against the rest of the game's dialogue (median ~57
   chars). Cosmetic, not broken.

(Two categories of warning that used to show up here are gone for good
reasons, not just suppressed: the ten pooled enemy templates that had no
dedicated battle sprite — Hollow, Fen Shade, Tomb Sentry, Crypt Revenant,
Wall Tendril, Dripping Maw, The Seep, Pale Drowned, Silt Hag, Pale Sentry —
all got bespoke sprites; and the four ruins NPCs whose `map:
'dungeon_entrance'` wasn't in `validateNPCs()`'s known-map-id list got
fixed by adding that id to the list in `validation.js` — a real false
positive, now corrected, not a real gap. See "Known risks" below for four
*more* enemies in the same missing-sprite situation that `validateEnemies()`
still can't see to warn about at all.)

## Recently completed infrastructure (this development arc)

In roughly the order built:

1. **North Basin region** — 4 new maps (South Approach, Reservoir, Silt
   Flats, Badlands), the region's first real random-encounter content
   (Silt Crab, Mudflat Strider).
2. **`EDGE_TRANSITIONS`** (`world-transitions.js`) — a second, additive
   transition mechanism for broad open borders between adjacent maps,
   alongside (not replacing) the original one-tile point-transition system.
   Retired 4 point-transition tile ids (84–87) in favor of it for the North
   Basin links.
3. **`MAP_METADATA`** (`data.js`) — central per-map bookkeeping (display
   name, region, type, items, encounter pool, save/encounter permissions),
   migrating `locationName()`/`currentItemList()`/combat's pool selection
   for plain outdoor maps off hand-written per-map branches.
4. **Debug map inspector / warp tool** — a non-modal HUD overlay (`I` key)
   showing live map/tile/encounter/transition info, plus a debug-menu-driven
   warp-to-any-map tool with bounds/walkability validation.
5. **Expanded `validateGameData()`** — from a flat registry-presence check
   into a ten-category content linter with error/warning severity, grouped
   output, and a structured `{errors, warnings, counts, errorList,
   warningList}` return object.
6. **`TILE_PROPERTIES`** (`tiles.js`) — per-tile metadata (name, category,
   tags, encounter eligibility, water/road/wall/transition/decorative/
   secret flags) layered on top of the existing numeric tile constants and
   `WALKABLE[]`, plus 8 helper functions (`isTileWalkable`,
   `isTileEncounterEligible`, `tileHasTag`, etc). `WALKABLE[]` itself is
   unchanged and remains the actual source of truth for collision.
7. **`MAP_FEATURES`** (`interactions.js`) — replaced the
   `INTERACTION_REGISTRY` pilot entirely with a general `inspect`/`trigger`
   content-authoring system (conditional text, once-only flags, debug
   inspector integration, full validation coverage). See `architecture.md`'s
   "Interactions" section for the complete design.

Each of the above shipped with its own new/updated `test/cases/*.test.js`
file (23 through 26 cover the debug tools, tile properties, and map
features specifically) and a full `validateGameData()`/regression/
transition-audit pass before being considered done.

## Known risks / caveats

- **`validateEnemies()`'s battle-sprite check has a real, accepted blind
  spot**: it only scans the pooled `*_ENEMY_TEMPLATES` arrays plus
  `PALE_SENTRY_TEMPLATE`. Four enemies — **Polwick, Essa, Smuggler
  Guard, Rainfish** — are hand-written stat objects inside `combat.js`'s
  scripted `start*Combat()` functions, outside any pool, so
  `validateGameData()` structurally cannot warn about them either way.
  All four now have dedicated sprites anyway (added by hand, checked
  against `render-battle.js`'s dispatch directly, not discovered via the
  linter) — along with the ten pooled enemies from the same backlog
  (Hollow, Fen Shade, Tomb Sentry, Crypt Revenant, Wall Tendril, Dripping
  Maw, The Seep, Pale Drowned, Silt Hag, Pale Sentry), every enemy in the
  game now has a bespoke battle sprite. If a *future* scripted enemy is
  added the same unpooled way, remember `validateEnemies()` still won't
  catch a missing sprite for it — check `render-battle.js`'s dispatch by
  hand and update `BATTLE_SPRITE_NAMES` there.
- **`handleInteract()` (`interactions.js`) is ~3,300 lines**, almost
  entirely one hand-written `if`/`else if` chain. `MAP_FEATURES`'
  lowest-priority guarantee depends on every higher-priority path in that
  chain setting `dialogue.open = true` as feedback — true today (verified
  by reading every custom NPC `.action`), but nothing enforces it stays
  true for a newly-added scripted interaction that does something "silent."
- **`movement.js`'s `update()` has a proven brace-counting trap** right
  after the world-item pickup loop — see `architecture.md`'s "Movement"
  section. Any future edit in that vicinity should be verified against a
  map with an *empty* item list, not just one with items on it.
- **`onceFlag` persistence is opt-in, not automatic** — a `MAP_FEATURES`
  entry's `onceFlag` works within the current session unconditionally, but
  silently does *not* survive save/load unless its name is also added to
  `QUEST_FLAG_SCHEMA` (`save.js`). `validateGameData()` warns when this is
  the case; it's not a bug, just something to check before assuming a
  once-only trigger/sign is meant to be permanent.
- **`RENDERABLE_TILE_IDS`/`BATTLE_SPRITE_NAMES` are hand-maintained
  parallel lists**, not derived from `drawTile()`/`drawBattleEnemy()`'s
  actual `case` statements (can't parse a file's own source from inside a
  running browser). They currently agree with reality; nothing but
  `validateGameData()` catches future drift.
- **No git repository** — changes aren't version-controlled at the repo
  level; be extra careful with anything destructive.
- Two historical audit docs (`TRANSITION_AUDIT.md`, `QUEST_TRACE.md`) have
  been moved to `Archived : Stale md files/` and are no longer maintained
  or linked from current docs — their *findings* were fixed and folded
  into this file and `architecture.md` at the time, but don't treat the
  archived files themselves as current.

## Recommended next tasks

Roughly in priority order:

1. ~~Draw dedicated battle sprites for the 4 remaining scripted bosses~~ —
   **done**: Smuggler Guard (plain steel-armored guard, sword and shield),
   Polwick (sky-blue hair, dirty tunic, bare-knuckle swagger), Essa (long
   brown hair, fire-red eyes, drawn bow), and Rainfish (translucent,
   drippy, deliberately quizzical-looking rather than threatening) all now
   have dedicated sprites. Every enemy in the game has a bespoke battle
   sprite as of this pass — see "Known risks" above.
2. ~~Expand `MAP_FEATURES` content for existing maps that have little or
   no environmental flavor text yet~~ — **done**: 8 new `inspect` signs
   added across 5 previously-uncovered maps (Drenwick West Residential,
   East Outskirts, and Waterfront — all three had zero NPCs and zero
   environmental text before this — plus South Ruins floors 1 and 6).
   The East Outskirts drainage notice and the Waterfront canal notice both
   deliberately continue the North Basin drought/water-level story
   ("consistent with reports from the northern basin district"), and the
   floor-6 sign references the same seepage lore already established in
   Fen Shade's "Observe" flavor text. `MAP_FEATURES` now covers 7 maps, 17
   entries total. Plenty of maps are still uncovered (most of Calwick, the
   rest of Drenwick's interiors, most dungeon floors) if more is wanted.
3. **Consider a dedicated regression test for the Schilling-the-bear
   sequence-break** (defeating the floor-5 boss before ever meeting Pip
   permanently locks that quest) — a known, still-unfixed issue from
   before this development arc; explicitly out of scope until someone
   decides whether to fix the underlying quest logic or just document it
   as intended.
4. **A full multi-district Drenwick walkthrough test**, and a save/load
   round-trip test for a specific mid-stage quest — both were suggested by
   earlier audits and never added; still open.

## Task difficulty guide for future coding assistants

**Safe for a lighter-weight/faster model, low architectural risk:**
- Drawing new battle sprites and adding the name to `BATTLE_SPRITE_NAMES`.
- Adding new `MAP_FEATURES` `inspect` entries (signs/plaques/notices) to
  existing maps — the system is generalized, validated, and the priority
  guarantee is already proven; a new inspect-only entry can't break
  anything else.
- Adding new tile ids for an existing `TILE_PROPERTIES` category (another
  wall/floor/decorative-blocker variant) as long as the checklist in
  `architecture.md`'s "safe entrance area" section is followed exactly
  (constant, `WALKABLE[]`, `TILE_PROPERTIES`, `window.X` export,
  `drawTile()` case, `RENDERABLE_TILE_IDS`).
- Writing additional regression tests that follow an existing test file's
  pattern closely (there are 26 to copy from).
- Adding new enemy templates to an *existing* pool with reasonable stats
  (validated automatically by `validateEnemies()`).

**Reserve for a stronger/more careful model:**
- Anything touching `handleInteract()`'s priority ordering, or adding a new
  kind of "silent" interaction (one that doesn't set `dialogue.open`) —
  risks quietly breaking the `MAP_FEATURES` priority guarantee.
- Anything editing inside or near `movement.js`'s `update()` function body,
  especially near/after the world-item pickup loop.
- Any new "safe entrance area" (full 17-step pattern in `architecture.md`)
  — many small, easy-to-forget touchpoints across ~8 files, several of
  which fail silently rather than throwing if skipped.
- Save-schema changes (`QUEST_FLAG_SCHEMA`, `saveGame()`/`loadGame()`'s
  legacy-fallback branch) — real risk of breaking old-save compatibility.
- Changes to `validateGameData()`'s own architecture (new severity rules,
  new groups, changes to how `TILE_PROPERTIES`/`WALKABLE` cross-validate) —
  this is the safety net for everything else; a subtle bug here can hide
  real problems rather than just reporting a false positive.
- Anything reconciling `EDGE_TRANSITIONS` and point transitions, or
  changing how either resolves a landing coordinate — collision/soft-lock
  risk, and this exact area has had real, previously-shipped bugs (a water
  soft-lock, an asymmetric-range clamp) before this arc's fixes.
