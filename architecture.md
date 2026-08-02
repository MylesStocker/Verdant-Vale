# Architecture

No build step: every file is a plain `<script src="...">` tag in `index.html`,
loaded in order. There are no `import`/`export` statements — a `const`/`let`/
`function` declared in one file is just a bare global name in every file
loaded after it. **Load order in `index.html` is load-bearing; don't reorder
scripts without checking this doc.**

Load order:

```
tiles.js → maps.js → data.js → npcs.js → items.js → shops.js → quests.js →
validation.js → state.js → save.js → world-transitions.js → game-loop.js →
render-tiles.js → render-interiors.js → render-entities.js → render-ui.js →
render.js → input.js → movement.js → combat.js → render-battle.js →
bootstrap.js → interactions.js
```

Only two ordering rules actually matter (everything else is free to reorder
since function bodies resolve their globals at call time, after every script
has loaded):

- `game-loop.js` calls `requestAnimationFrame(loop)` immediately — `loop`
  must be defined earlier in that same file (it is).
- `bootstrap.js` runs a block of top-level state-setting code immediately on
  load (it's not inside a function). It must stay the **last** file loaded
  before `interactions.js`, because it reads `player`, `dialogue`,
  `TILE`/map constants, and `debugMode`, which must already exist.

`validateGameData()` (`validation.js`) is a notable *exception* to "load
order barely matters": it's defined early (right after `quests.js`) but its
function bodies reference things defined much later (`MAP_FEATURES`,
`TILE_PROPERTIES`, `RENDERABLE_TILE_IDS`, `BATTLE_SPRITE_NAMES`, `EDGE_TRANSITIONS`,
`mapRegistryId`). That's fine — it's never *called* until the whole page has
loaded (browser console, the debug menu's "Validate Data" row, or a test
harness that loads every script first) — but it means you can't sanity-check
one of its functions by calling it mid-load; only after `window.onload`/test
setup has finished.

## Global scope and `window` exposure — the one gotcha every file works around

**Top-level `const`/`let` do NOT become properties of `window`/`globalThis`.**
This is standard ES2015 semantics (unlike `var`, function declarations, or an
explicit assignment), but it's easy to forget in a codebase built entirely
out of shared global scope, and it has caused a real bug in this project:
`validateEnemies()`/`validateItems()` originally tried to look up things like
`window['ENEMY_TEMPLATES']` and `window['DUNGEON_CHEST']` by string name —
since those are declared with `const`, the lookup silently returned
`undefined` for *every one of them*, and the checks that depended on them
silently no-op'd instead of throwing (a wrong-but-quiet result is the worst
kind of bug to find).

The rule this codebase actually follows:

- **Bare identifier access always works**, anywhere, once the declaring file
  has loaded — `ENEMY_TEMPLATES`, `MAP_REGISTRY`, `player`, `TILE`, etc. are
  all just free variables resolved at call time. This is how ~everything in
  this codebase talks to everything else.
- **`window.X = X` exists purely for code that needs to look something up by
  a *dynamic, computed* name** (a string that isn't known until runtime) —
  e.g. `debugTileName(tileId)` needing `window[constantName]` to resolve a
  tile id to its constant name, or `mapRegistryId()`/`MAP_REGISTRY[mapId]`
  needing a string key. Every tile constant, every map constant, and most
  top-level helper functions get an explicit `window.X = X` line for exactly
  this reason (search any file for `window\.` to see the pattern) — not
  because bare access wouldn't work, but because *string-keyed* access needs
  the object property to exist.
- **If you need to look something up by a computed string and it's declared
  with `const`/`let`,** you must either add an explicit `window.X = X` export
  for it, or (safer, and the pattern `validation.js` uses throughout)
  resolve it via a literal `typeof X !== 'undefined' ? X : undefined`
  ternary for each name you need, never a `window[name]` string lookup
  against an un-exported `const`.

## File ownership

### Engine / runtime files

| File | Owns | Don't edit here |
|---|---|---|
| `state.js` | All core mutable game state: world/location flags, status effects, `stats`, `menu`/`debugMenu`/`debugInspector`/`warpMenu`, `dialogue`/`continentMap`/`accordPanel`, the `tick` counter, and tiny state-only helpers (`toggleMenu`, `checkLevelUp`, `toggleDebugMenu`, `toggleDebugInspector`, etc). | Combat state (`combat`, `choice`, `shop`) lives in `combat.js`. Furniture/NPC position consts live in `render-interiors.js` / `render-entities.js`, not here. |
| `save.js` | `QUEST_FLAG_BINDINGS` (the flag registry) + derived `QUEST_FLAG_SCHEMA`, `SAVE_VERSION`/`SAVE_MIGRATIONS`/`migrateSave()`, `saveGame()`, `loadGame()`, `validateSaveSchema()`. | Don't declare new *persistent* variables here — declare them in the file that owns that concern, then add **one `QUEST_FLAG_BINDINGS` entry** here (`saveGame`/`loadGame` read the registry generically — there's no per-flag load assignment to write). See "Save/flags" below — this is the single most common thing new content gets wrong. |
| `world-transitions.js` | Every `enter*`/`exit*`/`ascend*`/`descend*` function that moves the player between maps/dungeons/towns/buildings, plus the generic `EDGE_TRANSITIONS` table and `tryEdgeTransition()`, and the debug-only `debugWarpToMap()`/`debugFindNearestWalkableTile()`/`debugEdgeTransitionSummary()`/`debugNearbyTransitionInfo()` helpers. | No drawing code — even location-specific hint overlays (e.g. the sluice gate hint) live in `render-entities.js`. |
| `game-loop.js` | The 60fps-capped `loop()` and its `requestAnimationFrame` kickoff. Intentionally tiny. | No game logic — `loop()` should only ever call `update()` then `render()`. |
| `render-tiles.js` | Per-cell base tile drawing (grass/water/dungeon/town/sluice tiles), the `drawTile(id, x, y)` dispatcher called once per grid cell every frame, and the debug/validation-only `RENDERABLE_TILE_IDS` Set (mirrors the dispatcher's `case` labels). | Not furniture (`render-interiors.js`) and not sprites/items/NPCs (`render-entities.js`). Don't rewrite `drawTile()`'s dispatch shape without also updating `RENDERABLE_TILE_IDS` — they're two independent lists that happen to describe the same set today, checked for agreement only by hand, not by any automated cross-check between the two files. |
| `render-interiors.js` | Interior furniture drawing per building (tavern, house, hamlet, brewery, harbormaster, wash house, provision store, offices, schools) and the anchor position consts those functions use. | Those anchor consts are also read by `canWalk()` in `movement.js` for collision — moving/renaming one affects collision, not just drawing. |
| `render-entities.js` | Player sprite, all NPC sprites, world-view boss/special-enemy sprites, items/chests/world-items, merchant/traveller/shop drawing, and small world-feature hint overlays (sluice gate, Drenwick north gate, Thornmere stone). | Not base tiles or furniture (see above). |
| `render-ui.js` | Drawing only for overlay panels: continent map, Accord panel, choice box, dialogue box, main/pause menu, debug menu, debug warp menu, and the debug map inspector overlay. | Panel *state* (`dialogue`, `menu`, `choice`, `debugMenu`, `warpMenu`, `debugInspector`, etc) lives in `state.js`/`combat.js`; panel *input handling* lives in `input.js`. This file only reads state and draws. |
| `render.js` | The single `render()` orchestrator — the canonical draw-call order (layering) for a frame — plus the pre-computed vignette. | Don't put actual drawing logic here, only calls into the `render-*.js` files. If draw order/layering looks wrong, this is the file to fix. |
| `input.js` | The `keys` table and the `keydown`/`keyup` listeners; routes a keypress to whichever screen is active (combat, menu, choice, shop, debug menu, debug warp menu, overlay panels, overworld). | No game logic beyond routing — it calls into `movement.js`/`combat.js`/`interactions.js`/etc rather than mutating game state directly (aside from cursor/screen UI state). |
| `movement.js` | `player`, `locationName()`, `currentMapId()`, `tileAt()`, `canWalk()` (collision), `isEncounterEligibleTile()`, and `update()` — the per-frame advance of movement/cooldowns/encounter checks/`MAP_FEATURES` trigger-zone checks. | No drawing code. |
| `combat.js` | Equip helpers (`effectiveAtk`/etc), enemy stat templates, `choice`/`shop` state, the `combat` state object, all `start*Combat()` functions, turn resolution (`combatOptions`, `applyEnemyHitEffects`, `handleCombatAction`), and `currentEncounterPool()`. | Battle *rendering* (sprites, the combat screen UI) lives in `render-battle.js`, not here. |
| `render-battle.js` | Battle-screen sprite drawing for the player and every enemy type, `drawBattleGenericEnemy()` (the fallback for any enemy name with no dedicated sprite), the `BATTLE_SPRITE_NAMES` Set (debug/validation-only — mirrors which names *do* have a dedicated `case`), and `drawCombat()` (the action menu / item subscreen / message / victory / defeat UI). | Combat *logic* (damage, turn order, state transitions) lives in `combat.js` — this file only reads `combat` state and draws it. |
| `bootstrap.js` | The one-time new-game startup state (starting map/position, intro dialogue). | Must stay the last file loaded before `interactions.js` — see ordering rules above. Don't add anything here beyond one-time startup values. |
| `interactions.js` | `handleInteract()` (the interact-key dispatcher — a priority orchestrator over named location handlers, see below), `interactSimpleNPCs()`, and the `MAP_FEATURES` content-authoring registry (`tryMapFeatures()`, `checkMapFeatureTriggers()`, `evaluateMapFeatureCondition()`, `resolveMapFeaturePages()`, `debugMapFeatureInfo()`). Loaded last since `update()`/`handleInteract()` are called at runtime, by which point every script has finished loading. | See "Interactions" below for the full priority story. This is by far the largest file in the codebase. The *dispatch* is now a clean priority orchestrator (`INTERACT_HANDLERS` / `OVERWORLD_INTERACT_HANDLERS`, first-match-wins with explicit consumption), but the per-location behaviour it routes to — chests, quest triggers, boss encounters, town-specific dialogue branches — is still large, hand-written and one-off, so the physical file remains a maintainability hotspot despite the improved dispatch. `MAP_FEATURES` doesn't replace those handlers — it's the lowest-priority generic fallback, checked only if nothing consumed the press. |

### Content / data files

These aren't part of the historical "`main.js` split" (the table above), but
matter just as much for where new content goes:

| File | Owns |
|---|---|
| `tiles.js` | Tile pixel size (`TILE`), every numeric tile-id constant, `WALKABLE[]`, `TILE_PROPERTIES`, the tile helper functions (`getTileProperties`/`getTileName`/`isTileWalkable`/`isTileEncounterEligible`/`tileHasTag`/`isWaterTile`/`isRoadTile`/`isTransitionTile`), and the debug-only `DEBUG_TILE_NAMES`/`debugTileName()`. |
| `maps.js` | Every 16×15 map-grid constant, `MAP_REGISTRY`, and `mapRegistryId()`. |
| `data.js` | `MAP_METADATA`, the enemy-template pools (`ENEMY_TEMPLATES`, `DUNGEON_ENEMY_TEMPLATES`, etc), and most per-map `*_ITEMS` arrays. |
| `npcs.js` | `SIMPLE_NPCS` (every data-driven NPC) and `NPC_ACTIONS`. |
| `items.js` | `ITEM_REGISTRY`, `createItem()`, `grantItem()`. **Rule: define item properties in `ITEM_REGISTRY` and grant items with `createItem(name)`/`grantItem(name)` — never hand-write inventory item objects at runtime.** `loadGame()` re-creates saved items from the registry by name, so a registry edit propagates to existing saves. |
| `shops.js` | `SHOP_REGISTRY`. |
| `quests.js` | Quest-flag variables, `syncQuestFlagsToWindow()`, and quest-progression helper functions. |
| `validation.js` | `validateGameData()` and its ten `validate*()` category functions — see "Validation" below. |

## Maps: the 16×15 grid, `MAP_REGISTRY`, `MAP_METADATA`

Every map is a plain array-of-arrays tile grid: **`ROWS = 15` rows of
`COLS = 16` tile-id numbers each** (`state.js`). This is a hard, unchecked-at-
runtime convention every piece of code assumes — `validateGameData()`'s
`validateMaps()`/`validateMapMetadata()` are the only things that actually
verify a given map array is 15×16 (as an **error**, not a warning, if it
isn't), and `movement.js`'s `tileAt()` returns a hardcoded solid tile
(`TREE`/`DUNGEON_WALL`/`SLUICE_WALL`/`TOWN_BUILDING`, by context) for any
out-of-range coordinate rather than checking a per-map size.

Every registered map needs two, sometimes three, entries:

- **`MAP_REGISTRY`** (`maps.js`) — `{ id, label, map }`, keyed by a string
  (conventionally identical to the map constant's own name, e.g.
  `MAP2: { id: 'MAP2', label: '...', map: MAP2 }`). This is what
  `save.js`'s `mapToId()`/`mapFromId()` use to serialize `activeMap` —
  skipping this entry for a real map is a real, previously-hit bug (the
  Drenwick school basement was a working map missing from `MAP_REGISTRY`,
  which silently broke save/load specifically there).
- **`MAP_METADATA`** (`data.js`) — the newer, richer table: `{ id, map,
  displayName, region, type, items, encounterPool, allowRandomEncounters,
  allowSave, notes? }`, keyed *identically* to `MAP_REGISTRY` (same property
  names) so `mapRegistryId(activeMap)` resolves either table. `type` is one
  of `'outdoor' | 'town' | 'interior' | 'dungeon' | 'bridge' | 'special'`.
  `MAP_REGISTRY` and `MAP_METADATA` are two independently-maintained tables,
  **not** one derived from the other — `MAP_REGISTRY` lives in `maps.js`,
  which loads *before* `data.js`, and `MAP_METADATA.encounterPool` needs the
  `*_ENEMY_TEMPLATES` pools that only exist once `data.js` has loaded.
  `validateGameData()`'s `validateMapMetadata()` cross-checks the two tables
  agree (every `MAP_REGISTRY` key has a metadata entry and vice versa,
  errors if not) instead.
- **`MAP_FEATURES`** (`interactions.js`, optional) — see "Interactions"
  below; only needed if the map has inspectable signage or discovery
  triggers.

For a **plain outdoor map** with no new state flag (just another
`MAP2`/`MAP3`-style overworld square, the common case), `locationName()` and
`currentItemList()` need **no new lines** — both read
`MAP_METADATA[mapRegistryId(activeMap)]` directly for any map whose
`type === 'outdoor'`. For every **other** map type (town buildings, dungeon
floors, sluice floors, the vault), those two functions and `combat.js`'s
`currentEncounterPool()` still branch on existing state flags
(`inTown`+`townBuilding`, `inDungeon`+`dungeonFloor`, `inSluice`+`sluiceFloor`,
`inMireVault`) rather than reading metadata directly — those areas are
stepped through via a floor/room counter, not a flat 1:1 "this map always
means this name/pool" mapping, so a metadata read can't (and shouldn't)
replace that branching. Those maps still get a full `MAP_METADATA` entry
(populated to match what the state-flag logic already produces) purely for
validation/documentation.

## Transitions: point transitions vs `EDGE_TRANSITIONS`

**Two systems coexist, deliberately, and neither replaced the other.**
There is no "map transitions are one-tile-only" constraint in this codebase
— that was true of the *original* single mechanism, but is no longer an
accurate description of the architecture.

**Point transitions** (the original, still-dominant mechanism) — a specific
tile id (a door, a stairway, a gate, a named `*_EXIT`/`*_ENTRANCE` constant)
placed at a specific cell in a map's grid. `movement.js`'s `update()` checks
`curTile` after every successful move against a long, hand-written list of
`if (activeMap === X && curTile === Y) { someEnterOrExitFn(); return; }`
conditions. Each one is exactly one tile wide/tall — the player has to walk
onto that exact cell. This is still how the overwhelming majority of
transitions in the game work: town doors, dungeon stairs, house doors,
bridge gates, the world-map square-to-square exits (`MAP2_EXIT`, `MAP3_EXIT`,
`NORTH_EXIT`, etc).

**`EDGE_TRANSITIONS`** (`world-transitions.js`, newer, additive) — for a
*broad, open* border between two adjacent maps (a wide field boundary, a
whole shoreline) where a single-tile door would feel wrong. Keyed by source
map id, then direction (`'north'|'south'|'east'|'west'`), each entry an
array of segments: `{ targetMap, targetEdge, sourceRange: [min, max],
targetRange? , condition?, blockedText?, allowNonOppositeEdge?, oneWay? }`.
`tryEdgeTransition(direction)` (called from `movement.js`'s `update()` when
the player is standing in the outermost row/col of the map and pushes
further in that direction) resolves the segment whose `sourceRange` contains
the player's along-the-edge coordinate, clamps the landing coordinate into
the target map's `targetRange` (or defaults to mirroring `sourceRange`), and
replaces `activeMap`/`player.x`/`player.y` — preserving the player's
position along the edge rather than snapping to one fixed spot. A map with
no `EDGE_TRANSITIONS` entry (the common case, most maps) never satisfies the
`curCol`/`curRow` check in the first place, since border tiles are normally
solid and `canWalk()` already keeps the player off the outermost ring —
this is why `EDGE_TRANSITIONS` support requires **no changes** to maps that
don't use it.

Both mechanisms are validated: `validateGameData()`'s `validateTiles()`
checks point-transition tiles are walkable (a transition tile that isn't
walkable can never be reached to trigger it) and not present in
implausible bulk; `validateEdgeTransitions()` checks source/target maps
exist, direction/edge are valid, ranges are well-formed and in-bounds, at
least one source-edge and one target-landing coordinate are walkable, a
`condition` function (if present) doesn't throw, and a reciprocal link
exists in the other direction unless explicitly marked `oneWay: true`. The
exhaustive, call-every-real-function-and-check-the-landing-spot audit is a
separate tool, `test/transition-audit.js` (see "Testing" below) — the
in-game validator's point-transition checks are deliberately lighter-weight
structural sanity, not a duplicate of that audit.

## Tiles: constants, `WALKABLE`, `TILE_PROPERTIES`

- **Tile-id constants** (`tiles.js`) — plain numbers, `GRASS = 0` upward,
  currently 0–92 with four retired-but-still-present ids (84–87, formerly
  North Basin point-transition tiles, now superseded by `EDGE_TRANSITIONS`
  and intentionally left unused rather than renumbering everything after
  them). Every map array is just numbers from this range. **Never reuse or
  renumber an existing tile id** — old saves and every map array reference
  ids by number, not by name.
- **`WALKABLE[]`** (`tiles.js`) — a flat array, index = tile id, value =
  `true`/`false`. This is still the actual, sole source of truth
  `movement.js`'s collision reads (through `isTileWalkable()`, which is a
  thin wrapper: `WALKABLE[tileId] === true`, safe for an unknown id).
- **`TILE_PROPERTIES`** (`tiles.js`, newer, additive) — a richer per-tile
  metadata object keyed by tile id: `{ id, name, debugName, walkable,
  category, tags, encounterEligible, isWater?, isRoad?, isWall?,
  isInterior?, isDungeon?, isTransition?, isDecorative?, isSecret?,
  deprecated?, notes? }`. Every entry's `walkable` field is written as a
  live reference (`walkable: WALKABLE[GRASS]`, not a re-typed `true`/`false`
  literal), so it can never silently drift from the real `WALKABLE[]` array
  — `validateGameData()` still separately checks the two agree, to catch a
  future hand-edit that breaks that invariant. **`TILE_PROPERTIES.walkable`
  is documentation, not the thing collision reads** — `isTileWalkable()`
  reads `WALKABLE[]` directly, on purpose, so a mistake made while
  hand-authoring a new tile's metadata can never change real collision
  behavior; it would only ever surface as a validation error.
- `encounterEligible` on `TILE_PROPERTIES` describes whether a tile is
  *ever* the "encounters can fire here" tile in some real context — it does
  **not** mean encounters fire on that tile everywhere it appears.
  `movement.js`'s `isEncounterEligibleTile()` is still the actual
  per-context decision function; only its single context-independent
  branch (plain outdoor, no special-area flag active) was migrated to call
  `isTileEncounterEligible(tile)`. Every dungeon-floor-number branch is
  still a hand-written `tile === DUNGEON_FLOOR`-style check, because the
  *same* tile id means different things depending on `dungeonFloor` (mutable
  state), which a single per-tile boolean can't capture. See that
  function's own comment before "simplifying" any of those branches.

## Rendering: `drawTile()` and `RENDERABLE_TILE_IDS`

`render-tiles.js`'s `drawTile(id, x, y)` is a big `switch` with one `case`
per known tile id, called once per grid cell every frame from `render()`.
`RENDERABLE_TILE_IDS` (same file) is a `Set` of every id that switch
actually handles — built and maintained *by hand*, not derived from the
switch (that would require parsing this file's own source, which isn't
possible from a running browser). It exists solely so
`validateGameData()`'s `validateTiles()` can flag a tile used in a real map
that has no render `case` (it would render as nothing) — the same pattern
`render-battle.js`'s `BATTLE_SPRITE_NAMES` uses for enemy sprites. **Adding a
new tile id means adding both the `case` in `drawTile()` and the id to
`RENDERABLE_TILE_IDS`** — nothing enforces they stay in sync except running
`validateGameData()` and reading its output.

## Movement, collision, encounters

`movement.js`'s `update()` (called once per frame from `game-loop.js`):
early-returns if `combat.active`, or if `dialogue.open`/`menu.open`/
`choice.open`/`shop.open`; otherwise reads `keys[...]` into a `dx`/`dy`,
checks `EDGE_TRANSITIONS` first if the player is pushing against the
outermost row/col, then falls back to `canWalk()`-gated normal movement.
`canWalk(cx, cy)` is a 4-corner, radius-9px hitbox check reading
`isTileWalkable()` (not `WALKABLE[]` directly — see "Tiles" above) at each
corner, plus a handful of custom solid-object checks (chests, NPCs via
`SIMPLE_NPCS`' `solid: true`). After a successful move, `update()` checks
`curTile` against the long point-transition `if` chain (see "Transitions"
above), rolls the random-encounter chance if `isEncounterEligibleTile()`
says the current tile qualifies and `!debugMode`, handles world-item
pickup, and — unconditionally, not gated on `player.moving` — checks
`MAP_FEATURES` trigger zones (see "Interactions" below) once nothing else
already opened dialogue/started combat/opened a menu this frame.

**A structural trap in this function to know about**: the world-item
pickup loop (`for (const wi of currentItems) { ... }`) and the code that
runs *after* it are two separate statements at the same indent level, not
one nested inside the other — but because the loop's own closing brace and
the surrounding braces are easy to miscount by eye in a ~500-line function,
a real bug was introduced and caught during the `MAP_FEATURES` build: new
code intended to run "once per frame, after the loop" ended up nested
*inside* the loop instead, so it silently never ran on any map with zero
unpicked items on it (i.e. most maps, most of the time — this shipped
silently because a quick manual test happened to run on a map with pending
items). If you add code after this loop, verify with `node --check
movement.js` **and** a direct, targeted test that the new code actually
runs on a map with an *empty* item list, not just one with items on it.

## Interactions: `handleInteract()`, `SIMPLE_NPCS`, `MAP_FEATURES`

`interactions.js`'s `handleInteract()` (called when the interact key is
pressed) is checked in this priority order:

1. **Dialogue continuation** — if `dialogue.open`, advance/close it (and
   run any queued combat/callback triggers) and return; nothing else in
   this list runs on the same press.
2. **Named location handlers.** `handleInteract()` is a priority orchestrator
   over two dispatch tables — `INTERACT_HANDLERS` (top-level) and
   `OVERWORLD_INTERACT_HANDLERS`. The **first** entry whose `match()` returns
   true gets to `run()`, and no later entry runs, exactly reproducing the old
   else-if dispatch (locations are mutually exclusive; first match wins). Each
   handler is the hand-written behaviour for one map/building — chests,
   quest-object encounters, boss triggers, town-specific scripted dialogue, and
   (inside the relevant handler) `interactSimpleNPCs()` (which checks every
   `SIMPLE_NPCS` entry whose `.map` matches `currentMapId()`, opening either a
   plain `.dialogue` array or a custom `.action(npc)` callback for the nearest
   one in `TALK_RADIUS`). A handler returns **`true` when it CONSUMED the
   press** — opened dialogue/choice/shop/a reading panel, or otherwise handled
   it; a handler that wants to swallow a press without opening any UI just
   `return true`s. Within a single handler, NPCs and chests/quest content are
   still interleaved by proximity, not globally ordered against each other.
   Ordering rule for the tables: more-specific conditions go before
   more-generic ones (e.g. the Drenwick office handler before the generic
   office handler).
3. **`MAP_FEATURES` inspectables** (`tryMapFeatures()`) — the lowest-priority
   **generic fallback**, run only when *no handler matched, or the matching
   handler did not consume the press*. "Consumed" is `interactionUiOpened()` —
   dialogue, choice, shop, reading panel (`accordPanel`), or continent map
   open — which is deliberately broader than the old `dialogue.open`-only
   guard, so a scripted interaction that opens a *choice menu* (not dialogue)
   can no longer let `MAP_FEATURES` open a second, competing dialogue
   underneath it. This is the invariant the priority contract exists to
   protect; handler ordering and the consumed/not-consumed return value are
   both load-bearing.
4. If nothing above fired, the press is a no-op.

### Dialogue page formatting contract

A dialogue page is an array of authored strings. `drawDialogue()` (via the pure
helpers `wrapDialogueLine` / `paginateDialoguePages` in `render-ui.js`)
word-wraps **each string independently** to the box width (496px box, 468px
text) and treats the boundary between two strings as a **hard line break**;
the wrapped sub-lines are then repaginated into height-safe visual pages of at
most three lines each.

Because of that, the rule for authoring content is:

> **Within a dialogue page, each string is a hard authored line. Continuous
> prose that should wrap naturally must be stored as one string. Use multiple
> strings only for intentional line breaks.**

One complete prose sentence or continuous paragraph is one string — let the
renderer wrap it. Use multiple strings only for genuinely intentional breaks:
verse and song lyrics, the rareborn rhyme and other metrical writing, signs /
plaques / notices, lists and document formatting, short system-message
sequences, and deliberate comic or dramatic fragments (`'Twice.'`,
`'Nothing bites.'`) or separately quoted statements. Splitting one sentence
across two strings is the classic bug: if the first fragment is a little too
wide it wraps and orphans its final word before the second fragment begins.
Do **not** add a runtime heuristic that joins strings while the game runs —
that would unpredictably destroy poetry and deliberate pacing. Fix the content.

**`MAP_FEATURES`** (`interactions.js`) is the general, game-wide registry
for simple map content — signs, plaques, gauges, notices, survey markers
(`type: 'inspect'`), and rectangular area-discovery text (`type: 'trigger'`).
It superseded the old `INTERACTION_REGISTRY` pilot entirely (migrated, not
kept alongside it — there is no `INTERACTION_REGISTRY` in the current
codebase). Keyed by map id exactly like `MAP_METADATA`/`MAP_REGISTRY`
(`mapRegistryId(activeMap)`), so it works unchanged for any current or
future map without special-casing:

```js
const MAP_FEATURES = {
  NORTH_BASIN_S_MAP: [
    {
      id: 'north_basin_road_sign', type: 'inspect',
      x: 13.5, y: 12.5,              // tile units, not pixels
      radius: 24,                     // optional; defaults to TALK_RADIUS
      facing: 'down',                 // optional
      condition: () => someFlag,      // optional; caught if it throws
      pages: [['...']],
      fallbackPages: [['...']],       // shown instead of pages if condition is false
      onceFlag: 'saw_road_sign',      // optional
      repeatPages: [['...']],         // shown instead of pages once onceFlag is set
      label: 'Road sign',             // debug/validation only, never shown to the player
    },
  ],
};
```

- **`inspect`** features are checked from `tryMapFeatures()` (proximity via
  `nearPlayer()`, the same mechanism NPCs use).
- **`trigger`** features (`rect: {x1,y1,x2,y2}`, tile units) are checked
  from `checkMapFeatureTriggers()`, called once per frame from the tail of
  `movement.js`'s `update()` — **not** gated on `player.moving` (it runs
  unconditionally alongside the item-pickup loop). It only fires on the
  frame the player's tile position transitions from *outside* a zone to
  *inside* it, tracked via a `_wasInside` boolean written directly onto the
  feature object at runtime (transient, never saved, never part of the
  schema) — so standing or moving around inside a zone never re-fires it,
  but leaving and re-entering does (unless `onceFlag` is set).
- Both check types are gated against `dialogue.open`/`combat.active`/
  `menu.open`/`shop.open`/`choice.open`/`debugMenu.open`/`warpMenu.open` so
  they never interrupt or compete with other modal UI.

## Save/flags — `QUEST_FLAG_BINDINGS` is the single source of truth

**`saveGame()` persists an explicit registry, not a blanket dump of every
global.** `QUEST_FLAG_BINDINGS` (`save.js`) is that registry: one entry per
persistent quest/world flag, each owning

- `key` — the stable, flat, top-level save-object key,
- `default` — the exact runtime default (used to seed a missing field on
  load and by the v1→v2 migration; a *fresh* copy is taken each time via
  `cloneDefaultValue`),
- `get()` / `set(v)` — read/write the authoritative runtime value,
- `kind` — `'lexical'` (a `quests.js`/`state.js` `let`; `get`/`set` close
  over it, built with `lex(key, def, get, set)`) or `'window'` (a
  `window[key]` property; `get`/`set` are generic, built with `win(key, def)`).

`QUEST_FLAG_SCHEMA` is **derived** from the registry
(`QUEST_FLAG_BINDINGS.map(b => b.key)`) and is still exposed on `window` for
existing consumers (validation, `MAP_FEATURES` `onceFlag` cross-checks, tests).
There is no second hand-maintained key list to keep in sync.

`saveGame()` and `loadGame()` are **generic**: `saveGame()` runs
`syncQuestFlagsToWindow()` and then writes `b.get()` for every binding;
`loadGame()` writes each binding via `b.set(key in data ? data[key] :
cloneDefaultValue(b.default))`, then runs `syncQuestFlagsToWindow()` so
restored *lexical* values are mirrored to `window` and *window-native* flags
are normalized without being clobbered by a stale lexical default. A field
missing from the save takes that binding's declared default — never the
current session's (possibly dirtied) value.

Because `set(...)` handles a missing field with the declared default, setting
a bare `window[myNewFlag] = true` (or a plain `let myNewFlag = true;`) still
does **not** survive a save/load round-trip until it has a binding entry.
This directly affects `MAP_FEATURES`' `onceFlag`: it *is* a plain
`window[name]` boolean and correctly prevents re-showing within the current
session, but it will **not** survive save/load unless its name has a
`win(name, false)` binding. Rather than auto-registering flags at runtime (a
real save-schema change, with its own risk), `validateGameData()`'s
`validateMapFeatures()` warns whenever a feature's `onceFlag` isn't in
`QUEST_FLAG_SCHEMA` — a visible warning, not a silent surprise.

`validateSaveFlags()` (`validation.js`) checks the registry itself rather
than a hand-copied list: binding keys are unique, `QUEST_FLAG_SCHEMA` equals
`bindings.map(b => b.key)` in order, every binding has a `default` and
callable `get`/`set`, no getter throws, and every `v` in `1 …
SAVE_VERSION-1` has a registered `SAVE_MIGRATIONS[v]`. There is no longer a
maintained reverse-direction copy of the synced-flag list to keep in step.

### Versioned migration — old saves are upgraded, never deleted

`SAVE_VERSION` is the on-disk format number (currently **2**).
`SAVE_MIGRATIONS[v]` is a per-step function transforming a version-`v`
payload into a version-`(v+1)` one — a registry, deliberately *not* one
growing conditional, so the next format bump adds `SAVE_MIGRATIONS[N]` and
nothing else. `SAVE_MIGRATIONS[1]` (v1→v2) *clones* the parsed object (never
mutates it), preserves every existing field and flag value, seeds any binding
key the old save lacked with that binding's declared default, and sets
`version = 2`.

`migrateSave(parsed)` is the coordinator. It validates the payload
(object-like, numeric `version ≥ 1`, not from a future version) and applies
each required step in order **without touching `localStorage`**, returning
`{ ok: true, data, migratedFrom }` (`migratedFrom` = the original version if a
migration ran, else `null`) or `{ ok: false, reason }`. `loadGame()` calls it
and, on `ok: false`, **warns and returns `false`, leaving the save on disk
untouched** — malformed JSON, an unsupported/unversioned save, a future
version, a missing migration step, and a migration that throws are *all*
non-destructive. A save is never silently deleted.

Only after a *successful* migrating load does `loadGame()` persist the
upgrade: it backs the original raw text up under
`verdantVale_save_backup_v<from>` (**only if that key doesn't already
exist** — a backup is never overwritten) and writes the migrated v2 object to
the normal key via direct `localStorage.setItem` (**not** `saveGame()`, so no
current-session state leaks into the rewrite). A normal (already-current) v2
load creates no backup and rewrites nothing.

## Validation: `validateGameData()` as a content linter

`validateGameData()` (`validation.js`) is a general-purpose content linter,
not a smoke test — call it any time (browser console, or the debug menu's
"Validate Data" row) and it re-checks the *entire currently-loaded* game
data, collecting every issue rather than stopping at the first one. Ten
category functions, each addressable standalone:

`validateMaps`, `validateMapMetadata`, `validateTiles` (also covers
`TILE_PROPERTIES`, reported under a separate `"Tile Properties"` group tag),
`validateEdgeTransitions`, `validateNPCs`, `validateItems`, `validateEnemies`,
`validateDialogue`, `validateSaveFlags`, `validateMapFeatures`.

Two severities, both collected into module-level arrays reset at the start
of each run: `addValidationError(group, message)` for "definitely wrong /
likely to break the game" (routed to `console.error`), `addValidationWarning(group,
message)` for "suspicious, possibly intentional" (routed to `console.warn`).
The orchestrator prints a summary (checkmark line per category + total
warning/error counts) then every collected message grouped by category, and
returns a structured object: `{ errors, warnings, counts, errorList,
warningList }` — `errorList`/`warningList` are arrays of `{ group, message }`,
which is what tests and the debug menu read rather than re-parsing console
text.

As of the last full pass: **0 errors, 2 warnings** across 69 maps, 16,560
tile cells, 159 NPCs, 98 item placements, 29 enemy templates, 17 map
features, and the rest — see `PROJECT_STATUS.md` for what those 2 warnings
actually are (both intentional, nothing newly introduced).

**Known, accepted gap**: `validateEnemies()`'s battle-sprite-coverage check
only scans the pooled `*_ENEMY_TEMPLATES` arrays plus `PALE_SENTRY_TEMPLATE`
— it does not see enemy stat objects hand-written directly inside
`combat.js`'s scripted `start*Combat()` functions (`Polwick`, `Essa`,
`Smuggler Guard`, `Rainfish`). Those four have dedicated battle sprites
today, same as every pooled enemy, but that's despite this gap, not because
of it — nobody was ever warned to draw them; someone checked
`render-battle.js`'s dispatch by hand and noticed they were missing. If you
add a new scripted-boss enemy the same unpooled way, do the same manual
check — don't rely on a clean `validateGameData()` run to mean every enemy
has a sprite.

## Debug tools

- **Debug menu** (backtick key, `debugMenu` in `state.js`, always reachable
  regardless of `debugMode`'s value, drawn by `render-ui.js`'s
  `drawDebugMenu()`) — 8 rows: No Enemies / Poison / Muddied / Slither
  (toggles), Heal Full / Day +1 (actions), Warp to Map... (opens the warp
  menu), Validate Data (runs `validateGameData()`, shows a toast summary,
  full report to console).
- **Debug map inspector** (`I` key, `debugInspector` in `state.js`, a
  non-modal always-updating HUD overlay, doesn't block movement/input) —
  shows current map id/display name/region/type, tile-unit position and
  facing, current tile id/name/walkability/encounter-eligibility, tile
  category/tags/flags (from `TILE_PROPERTIES`), current encounter pool,
  nearby point/edge transition info, and `MAP_FEATURES` info (feature count
  on the map, nearby inspectable, active trigger zone).
- **Debug warp menu** (reached from the debug menu, `warpMenu` in
  `state.js`) — pick any `MAP_REGISTRY`-listed map, then nudge a target
  tile coordinate; `debugWarpToMap()` (`world-transitions.js`) validates
  the target, clamps out-of-bounds coordinates, nudges onto the nearest
  walkable tile if the exact spot is blocked, resets all `inX` area flags
  and the encounter cooldown, and (for non-`'outdoor'`-type maps) notes in
  its return message that area-specific state like a dungeon floor number
  or town building wasn't set — warping into a town/interior/dungeon by
  map+coordinate alone is a geometry/collision testing tool, not a
  substitute for actually entering that area's state normally.
- `debugMode` (`state.js`) — suppresses random encounters; this **is** the
  "toggle random encounters" feature (the debug menu's "No Enemies" row),
  not a separate mechanism.

## Testing

- **`test/harness.js`** — `createContext()` boots a fresh, isolated Node
  `vm` context, loading every script in the real `index.html` order, and
  returns `{ run(code), press(key), hold(key), release(key), frames(n),
  renderFrame() }`. `run()` evaluates arbitrary code in the game's global
  scope (read or write any variable/function). `press` fires a real
  keydown+keyup; `hold`/`release` fire one or the other, for movement held
  across multiple frames. `frames(n)` calls the real `update()` n times.
  **Player position conventions matter here**: this codebase places
  entities at `N.5 * TILE` (tile-*center*) coordinates, not `N * TILE`
  (tile-corner). Placing a test player at a whole-tile coordinate puts
  `canWalk()`'s 9px-radius hitbox straddling a tile boundary, which can
  spuriously block movement against a neighboring tile that has nothing to
  do with the thing under test — a real, previously-hit mistake worth
  checking first if a test's simulated movement mysteriously doesn't move
  the player at all.
- **`test/run.js`** — discovers and runs every `test/cases/*.test.js` file
  in its own fresh context; currently 51 tests, all passing.
- **`test/transition-audit.js`** — a standalone, exhaustive sweep: calls
  every real `enter*`/`exit*`/`ascend*`/`descend*` transition function live
  and checks the landing spot against the game's own collision logic
  (bounds + walkability), cross-references every `flatFns`-listed
  transition against `transitionTileNames`, and checks house doors and
  tile-constant references. Also wired into the main suite as one of the
  51 tests (`10-transition-audit`), which additionally asserts the audit's
  reset-state isolation self-check passes. Not the same thing as
  `validateGameData()`'s lighter-weight,
  browser-console-reachable point-transition sanity checks (see
  "Transitions" above) — this audit is exhaustive but test-only (uses
  `fs`/Node, can't run in a browser); `validateGameData()` is the
  always-available one.
- When adding a negative/failure-case test (deliberately malformed data),
  the established pattern across every test file since the North Basin
  work is: mutate the real, shared data temporarily inside the test,
  assert the expected error/behavior, then **immediately restore it** in
  the same test — never leave broken state for a later test in the same
  run to trip over. Verify a new test is actually load-bearing (not just
  passing by coincidence) by temporarily breaking the thing it claims to
  test and confirming the test fails, then restoring the fix — this has
  caught real bugs in the tests themselves multiple times (see
  `test/README.md`'s per-test notes for specifics).

## Known constraints — don't casually refactor these

- **Don't reorder `index.html`'s script tags** without rechecking the two
  ordering rules at the top of this doc.
- **Don't change existing tile ids, `MAP_REGISTRY`/`MAP_METADATA` keys, or
  quest-flag names** — saves, map arrays, and the `QUEST_FLAG_BINDINGS` keys
  all reference them by exact value/name. The save *format* has a
  version-migration layer (`SAVE_MIGRATIONS`, see "Save/flags"), but that
  upgrades payload shape forward — it does **not** rename existing keys/ids,
  so a rename still silently breaks old saves.
  `WALKABLE[]`/`TILE_PROPERTIES` grow by adding entries at new indices, not
  by renumbering.
- **Don't make `isTileWalkable()`/`TILE_PROPERTIES.walkable` the source of
  truth for collision** — `WALKABLE[]` is, on purpose, so a documentation
  mistake can never become a collision bug (see "Tiles" above).
- **Don't add a new persistent flag without also adding a
  `QUEST_FLAG_BINDINGS` entry** — see "Save/flags" above; the registry is the
  save gate, and this is the most common way new content silently fails to
  survive save/load.
- **Don't assume `MAP_FEATURES`/`INTERACTION_REGISTRY` interchangeably** —
  `INTERACTION_REGISTRY` no longer exists in this codebase. If you find a
  reference to it anywhere (an old comment, an old doc), it's stale.
- **Don't reorder `handleInteract()`'s dispatch tables** (`INTERACT_HANDLERS`
  / `OVERWORLD_INTERACT_HANDLERS`), or change a handler's consumed/not-consumed
  return value, without re-reading "Interactions" above first — the
  `MAP_FEATURES` fallback guarantee depends on the first-match-wins ordering
  and on every higher-priority path that handles a press *consuming* it
  (`interactionUiOpened()` becomes true, or the handler `return true`s). A
  "silent" action that handles a press but neither opens UI nor returns true
  is the classic way to let `MAP_FEATURES` fire a competing dialogue
  underneath it.
- **Don't add code after the world-item pickup loop in `movement.js`'s
  `update()` without counting braces carefully** — see "Movement" above
  for the exact bug this caused once already.
- **`RENDERABLE_TILE_IDS` and `BATTLE_SPRITE_NAMES` are hand-maintained,
  not derived** — adding a tile `case` to `drawTile()` or an enemy `case`
  to `drawBattleEnemy()` without also updating the matching Set means
  `validateGameData()` will report a false "not renderable"/"no battle
  sprite" finding (or, worse, miss a genuinely missing one if the Set is
  edited to match without the underlying `case` actually existing).
- **Run `validateGameData()`, the full test suite, and the transition
  audit after any content change**, not just after infrastructure changes
  — they're cheap, fast (a few seconds total), and this session's history
  shows real bugs caught by each of the three that the other two missed.

## Pattern: safe (encounter-free) entrance / interstitial areas

Some locations need a small sub-map that sits between the overworld and a
dangerous area — a foyer, a landing, a hallway — where the player can read
signage, meet NPCs, or just get their bearings before combat starts. This
game has one example so far: the **South Ruins Entrance Hall**
(`DUNGEON_ENTRANCE_MAP`), which sits between the overworld `DUNGEON_ENTRANCE`
tile and the real (encounter-bearing) `DUNGEON_MAP` floor 1. Entering the
ruins used to drop the player straight into combat territory; now it lands
them in this hall first.

The pattern is intentionally boring — a new map plus a new boolean state
flag, wired into every place the codebase already checks *other* areas'
booleans (`inSluice`, `inMireVault`, `inTakomo`, etc.). Nothing about it is
dungeon-specific; the same recipe works for a safe antechamber in front of
any future dangerous area.

### Systems a safe entrance area must touch

Using the South Ruins Entrance Hall as the running example:

1. **State flag** (`state.js`) — one new `let inX = false;`, declared
   alongside the other location flags (`inSluice`, `inMireVault`, ...).
   Example: `let inDungeonEntrance = false;` (state.js).
2. **Map definition** (`maps.js`) — a plain 16×15 tile grid constant, same
   shape as every other map. Example: `const DUNGEON_ENTRANCE_MAP = [...]`.
3. **`MAP_REGISTRY`** (`maps.js`) — an entry mapping a string id to `{ id,
   label, map }`. This is what `save.js`'s `mapToId()`/`mapFromId()` use to
   serialize `activeMap` — skipping this is exactly the
   `DRENWICK_SCHOOL_BASEMENT_MAP` bug mentioned above. Example:
   `DUNGEON_ENTRANCE_MAP: { id: 'DUNGEON_ENTRANCE_MAP', label:
   'South Ruins — Entrance', map: DUNGEON_ENTRANCE_MAP }`.
4. **Window exports** (`maps.js`) — `window.DUNGEON_ENTRANCE_MAP = ...` (and
   an items array export if the area has one), matching the export block
   every other map constant gets.
5. **Tile constants + `WALKABLE`/`TILE_PROPERTIES` entries** (`tiles.js`) —
   new tile ids for anything the area needs that doesn't already exist: at
   minimum a floor and a wall. Add the matching `WALKABLE[]` entry at the
   same index, a `TILE_PROPERTIES` entry (`walkable: WALKABLE[NEW_ID]`,
   plus `name`/`category`/`tags`/`encounterEligible`), and a `window.X = X`
   export. Example: `RUIN_FLOOR`/`RUIN_WALL`/`RUIN_STAIRS_DOWN`/`RUIN_EXIT`
   (ids 77-80). Prefer **new, dedicated tile ids for the area's own
   transition tiles** (its own stairs-down, its own exit) rather than
   reusing another area's transition tile id — see the warning below.
6. **Render tile dispatch** (`render-tiles.js`) — one `drawX(x, y)` function
   per new tile id, a `case X: drawX(x, y); break;` line in `drawTile()`'s
   big switch, **and the same tile id added to `RENDERABLE_TILE_IDS`**.
   Give the area its own visual identity here (the entrance hall uses a
   paler, mossier palette than the dungeon proper on purpose — it's meant
   to read as a different, safer place).
7. **Optional decorative overlay** (`render-entities.js` + `render.js`) — if
   the area wants scenery beyond the tile grid (broken pillars, a basin,
   etc.), add a `drawXDecor()` function gated on the state flag (same
   pattern as `drawMireVaultPillars()`), and one line in `render()`:
   `if (inX) drawXDecor();`. Collision for decorative props comes from
   putting a non-walkable tile under them in the map grid, not from a
   separate hitbox — see `drawSouthRuinsEntranceDecor()`.
8. **World transition functions** (`world-transitions.js`) — one function to
   *enter* the area (from the overworld or wherever it's reached from) and
   one to *leave* it, plus one to *proceed* from it into the dangerous area
   and one to *return* from the dangerous area back into it. Example:
   `enterDungeon()` (overworld → hall), `exitDungeon()` (hall → overworld),
   `descendToDungeon1()` (hall → real floor 1), `ascendToDungeonEntrance()`
   (floor 1 → hall). Each just sets the relevant flags, `activeMap`, and
   `player.x`/`y`/`facing`.
9. **Movement tile triggers** (`movement.js`) — one `if` per transition
   tile, calling the matching function from step 8. Also update whichever
   tile check used to lead straight into the dangerous area so it now leads
   into the new hall instead (floor 1's old exit tile now calls
   `ascendToDungeonEntrance()` instead of `exitDungeon()`). If the area's
   border should instead be a broad open edge rather than a single-tile
   door, use `EDGE_TRANSITIONS` (see "Transitions" above) instead of a new
   point-transition tile.
10. **Encounter suppression** (`movement.js`'s `isEncounterEligibleTile()`)
    — add the new flag to the exclusion list on the default (grass) branch,
    **and** an explicit `else if (inX) return false;`-shaped branch. The
    explicit branch is redundant with "just don't add a case for it" but is
    worth the one line: it makes the no-encounters guarantee a visible,
    intentional statement instead of an accident of omission that a future
    edit could silently break.
11. **`currentMapId()` / `locationName()`** (`movement.js`) — one line each,
    same `if (inX) return '...'` shape as every other area (skip
    `locationName()` if the area is a plain outdoor map — `MAP_METADATA`
    owns that case, see "Maps" above).
12. **`currentItemList()`** (`render-entities.js`) — one line in the
    `: inX ? X_ITEMS` ternary chain, even if the array is empty (`[]` or a
    dedicated empty `X_ITEMS = []`). **This one is easy to forget** — see
    the warning below. (Same skip as above for a plain outdoor map.)
13. **`handleInteract()` / `interactSimpleNPCs()`** (`interactions.js`) —
    one `else if (inX) { interactSimpleNPCs(); }` branch (or more, if the
    area has chests/environmental text). NPCs themselves are ordinary
    `SIMPLE_NPCS` entries (`npcs.js`) with `map: 'x'` matching whatever
    string `currentMapId()` returns for the area — no special-casing needed
    there. **(Optional)** a `MAP_FEATURES` entry for inspectable
    signage/plaques or discovery-trigger narration in the new area — see
    "Interactions" above; this is purely additive and needs no wiring
    beyond the `MAP_FEATURES` object itself.
14. **Save/load** (`save.js`) — add the flag to the object literal
    `saveGame()` builds, and one `if (data.inX !== undefined) inX =
    data.inX;` line in `loadGame()`'s modern (`activeMapId`-present) restore
    branch. A brand-new area has no old saves to support, so it does *not*
    need an entry in the legacy fallback branch below that.
15. **Transition audit** (`test/transition-audit.js`) — add the new
    enter/exit/descend/ascend functions to the `flatFns` list (they'll be
    called live and checked for bounds/walkability/escapability
    automatically), and add only the area's actual *transition* tiles (not
    its floor/wall) to the `transitionTileNames` list.
16. **Dedicated regression test** (`test/cases/`) — a test that drives the
    real transition functions and asserts the specific state each one
    produces, confirms the no-encounter guarantee holds even with
    `Math.random()` forced to the worst case, and exercises at least one
    NPC. See `test/cases/16-south-ruins-entrance.test.js`.
17. **`MAP_METADATA` entry** (`data.js`) — required regardless of type; see
    "Maps" above.

### Warnings

- **Do not let a safe entrance area use `inDungeon`** (or any other
  existing area's boolean) to save a step. It must get its **own** flag,
  kept separate from `inDungeon`/`dungeonFloor`. If it reuses `inDungeon`,
  it will silently inherit whatever encounter pool `combat.js`'s
  `currentEncounterPool()` assigns to that `dungeonFloor` value —
  reintroducing the exact bug this pattern exists to fix.
- **Do not forget `save.js` or `currentItemList()`.** Both are easy to miss
  because nothing throws if you skip them — `currentItemList()` in
  particular has a long ternary chain that silently falls through to
  `WORLD_ITEMS` (the *overworld's* items) for any flag it doesn't
  explicitly check, which would make stray overworld pickups appear to
  float in the new area.
- **Do not add the area's plain floor/wall tiles to
  `transitionTileNames`** in `test/transition-audit.js` — that list is for
  tiles that *trigger a transition* (stairs, exits, doors), cross-referenced
  against `movement.js` to confirm they're handled. A floor or wall tile
  will always show as "not handled in movement.js" there, which looks like
  a finding but isn't one.
- **Do not forget `RENDERABLE_TILE_IDS`** when adding a `case` to
  `drawTile()` for a new tile id — see "Rendering" above.

### Checklist for adding a future entrance area

- [ ] New `let inX = false;` in `state.js`
- [ ] New map constant in `maps.js`
- [ ] New `MAP_REGISTRY` entry in `maps.js`
- [ ] `window.X_MAP` (and items array) export in `maps.js`
- [ ] New tile ids + `WALKABLE[]` entries + `TILE_PROPERTIES` entries +
      `window.*` exports in `tiles.js`
- [ ] `drawX(x, y)` functions + `case` lines in `render-tiles.js`, and the
      same ids added to `RENDERABLE_TILE_IDS`
- [ ] (optional) `drawXDecor()` + hook in `render.js`
- [ ] Enter/exit/proceed/return functions in `world-transitions.js` (or an
      `EDGE_TRANSITIONS` entry if the border should be a broad open edge)
- [ ] Tile-trigger `if`s in `movement.js`, and repoint whatever used to lead
      straight into the dangerous area
- [ ] Encounter-exclusion entry in `movement.js`'s `isEncounterEligibleTile()`
      (both the exclusion list *and* the explicit branch)
- [ ] `currentMapId()` and `locationName()` lines in `movement.js` (skip
      `locationName()` for a plain outdoor map)
- [ ] `currentItemList()` line in `render-entities.js` (same skip)
- [ ] `interactSimpleNPCs()` wiring in `interactions.js`, plus any NPCs in
      `npcs.js`; optionally a `MAP_FEATURES` entry for inspectables/triggers
- [ ] Save/load lines in `save.js` (object literal + modern restore branch)
- [ ] New functions added to `flatFns`, new transition tiles (only) added to
      `transitionTileNames`, in `test/transition-audit.js`
- [ ] A dedicated `test/cases/NN-*.test.js` covering the transition chain,
      the no-encounter guarantee, and at least one NPC
- [ ] One `MAP_METADATA` entry (`data.js`) — required regardless of type
- [ ] `node --check` every touched file, then `node test/run.js`,
      `node test/transition-audit.js`, and `validateGameData()` (via a
      quick harness script or the debug menu) before calling it done

## NPC movement contract (Phase 1 — implemented for four pilots)

Status: **Movement is implemented for exactly four pilot NPCs, and no other
NPC moves.** All three authored types are live:

- **`scriptedRoute`** (one-way, explicitly started) — the two Imperial bridge
  toll guards (`bridge_soldier_north`, `bridge_soldier_south`). These are, and
  remain, the **only** scripted-route pilots.
- **`patrol`** (looping waypoint route, optionally auto-starting) — **Tobb Wend
  (`tobb_wend`, display name "Toby")** in `FEN_BREWERY_MAP`, the only patrol
  pilot. A small looping route among the eastern brewery vats.
- **`boundedWander`** (intermittent random wander inside an authored tile
  region) — **Tomas (`tomas`)** in `house:esla_house`, the only bounded-wander
  pilot. He waits, takes one short orthogonal step to a random legal neighbour,
  and waits again — domestic pottering, not a route.

The engine is shared (one route runtime, not three): movement.js holds
`NPC_ROUTES`, `startNpcRoute()` / `updateNpcRoutes()` (a `type` switch over the
three behaviours), `npcRouteCanOccupy()` (the one NPC-aware collision path),
`chooseWanderTarget()` / `wanderPauseFrames()`, `ensureAutoMovers()`,
`patrolNpcTalk()`, and the reset helpers `resetBridgeGuards()` /
`placeBridgeGuardsAside()` (guards) and `resetMovementNpc()` /
`resetAllMovers()` over `MOVEMENT_HOMES` (patrol + wander). The walking
renderers (render-entities.js: `drawWalkingGenericNPC()` for the clerk-bodied
guards, `drawWalkingWorker()` for Toby, `drawWalkingPatron()` for Tomas —
each preserving its own stationary sprite exactly) share one `(npc, facing,
step, moving)` signature, so a new NPC of an existing generic sprite type needs
no renderer work. Interaction is generic: `interactSimpleNPCs()` routes any
moving NPC with no custom `action` through `patrolNpcTalk()` (no per-NPC
branch). Tests: `45-npc-movement-contract` (validation), `46-bridge-guard-toll`
(guards), `47-brewery-patrol` (Toby), `48-bounded-wander` (Tomas). Broader NPC
movement remains deferred; there is deliberately no pathfinding, no schedules,
no cross-map movement, and no simulation of inactive maps.

Key invariants (all enforced and tested):

- **Auto-movers update only on their resolved active map.** `ensureAutoMovers()`
  starts an auto-managed mover (a `boundedWander`, or a `patrol` with
  `autoStart: true`) the frame its NPC's `map` equals `currentMapId()`, and
  suspends it (dropping the route, homing the NPC) the frame it doesn't — the
  same map-local filter `updateNpcRoutes()` and `drawSimpleNPCs()` already
  apply. This shared invariant keeps a mover off every other screen (the
  bridge-guard "appear everywhere after death" bug class), **not** an
  NPC-specific hide condition.
- **Runtime state is transient and never saved.** Position, facing, pause
  timer and the current wander/patrol target live in `NPC_ROUTES` only.
  `saveGame()` writes no route/position data; `loadGame()` calls
  `resetAllMovers()`, re-seating each auto-mover at its authored home (a save
  made mid-motion loads as a clean start), and the mover auto-restarts next
  frame if its map is active. No new save fields, no `SAVE_VERSION` bump. The
  defeat/respawn handler (combat.js) calls `resetAllMovers()` alongside
  `resetBridgeGuards()`.
- **Home is derived, not hardcoded.** `MOVEMENT_HOMES` is snapshotted once at
  movement.js load from each auto-mover's own authored `x`/`y`/`facing`
  (npcs.js loads first, so those are the pristine values) — no hand-maintained
  home table. `resetMovementNpc()` restores from it.
- **Interaction pauses and resumes a mover** (never a restart or teleport).
  Talking runs `patrolNpcTalk()`: the route freezes at its live position, the
  NPC faces the player (Lélý), and its ordinary dialogue opens unchanged. A
  beat after the dialogue closes it thaws — a patrol continues toward its same
  target waypoint; a wander drops the in-progress step and re-decides after a
  short pause. Interaction, collision and the SPACE hint all read live
  `npc.x`/`npc.y`, so there is no ghost target at the authored start.
- **Bounds are intent; live collision is authority.** A `boundedWander`'s
  `bounds` describe the safe interior region in tile coordinates and must
  exclude the exit/doorway, but every attempted step is *also* checked by
  `npcRouteCanOccupy()` — walkable tile, no transition, no house furniture
  (HOUSE_DATA solids, honoured at canWalk()'s own AABB radii), not the player,
  not another solid NPC. A blocked NPC picks another legal direction or waits
  and re-rolls after a pause; randomness is rolled only at a decision point,
  never per frame.

### Authored schema (opt-in)

Movement is opt-in per NPC via a `movement` property on the `SIMPLE_NPCS`
entry. **An NPC without `movement` must remain exactly as stationary as it
is today** — absence of the property is the permanent "never moves"
guarantee, not a default route.

```js
movement: {
  type: 'patrol',            // looping authored patrol (Tobb Wend)
  autoStart: true,           // patrol-only: initialise on map presence, no explicit start call
  waypoints: [               // authored route, walked in order, then repeated
    { x: 13.5, y: 3.5, pauseFrames: 180 },  // TILE units; per-waypoint dwell (frames)
    { x: 11.5, y: 4.5, pauseFrames: 240 },
  ],
  speed: 0.5,                // px per frame while moving; > 0, finite
  pauseFrames: 90,           // OPTIONAL movement-level default dwell; a waypoint's own wins
  loop: true,                // true: cycle forever; false: walk once, stop at the end
}
```

A `patrol` walks its waypoints in order and, with `loop: true`, wraps from the
last back to the first forever, dwelling at each waypoint for that waypoint's
`pauseFrames` (falling back to the movement-level `pauseFrames`, else 0).
`autoStart: true` (patrol-only) means `ensureAutoMovers()` starts and stops it
by map presence with no game-code call. Arrival snaps exactly to each waypoint,
so repeated loops accrue no positional drift.

The `scriptedRoute` type is a **one-way**
route that plays exactly once when explicitly started from game code via
`startNpcRoute(id)` (movement.js), rather than running on its own schedule.
`loop` must be `false`; a completed route stays completed (restarts require
an explicit reset, e.g. `resetBridgeGuards()`). This is the type the two
bridge-guard pilots use for their post-payment sidestep:

```js
movement: {
  type: 'scriptedRoute',
  waypoints: [{ x: 6.5, y: 9.5 }],  // TILE units
  speed: 0.5,
  pauseFrames: 0,
  loop: false,
}
```

The third type, `boundedWander`, is an intermittent random wander inside an
authored tile region — no route, no waypoints. It auto-manages by map presence
(like an `autoStart` patrol, but with no flag: a wander is always auto). At each
decision point it rolls **once** for a shuffled direction order and takes the
first one-tile orthogonal step that is both in `bounds` **and** passes live
occupancy, else it waits and re-rolls after another randomized pause. This is
the type Tomas uses to potter around Esla's house:

```js
movement: {
  type: 'boundedWander',
  bounds: { minCol: 4, maxCol: 11, minRow: 2, maxRow: 9 },  // TILE indices; safe interior, EXCLUDING the doorway
  speed: 0.5,               // px per frame while stepping (the shared NPC speed)
  minPauseFrames: 60,       // randomized wait between steps, min (~1s at 60fps)
  maxPauseFrames: 180,      // ...and max (~3s); min <= max
}
```

`bounds` are tile **indices** (integer col/row), unlike waypoints (tile-centre
`x.5` coordinates). They are authored *intent* describing the safe region; they
are **not** collision authority. Every attempted destination is also checked by
`npcRouteCanOccupy()` — walkable tile, no transition tile, no house furniture
(the HOUSE_DATA solids, at canWalk()'s own AABB radii — the one map-specific
extension the wander needed), not the player, not another solid NPC — so a
bound may safely overlap a wall or a chair as long as the doorway is excluded.
Runtime state (position, facing, pause timer, current step target) is transient
and never saved; home is the derived authored `x`/`y`/`facing` (`MOVEMENT_HOMES`).

Runtime motion state lives in movement.js's `NPC_ROUTES` (keyed by NPC id,
never saved); the live position is written to `npc.x`/`npc.y` because
collision, rendering and interaction all read those fields, and the explicit
reset helpers (`resetBridgeGuards()` / `placeBridgeGuardsAside()`) restore
the authored anchors on every bridge entry, exit and load — derived from
`bridge_toll_paid`, with no new save fields.

**Coordinate decision: waypoints are authored in TILE units** (`4.5` = the
horizontal centre of column 4), the same convention `MAP_FEATURES` already
uses for inspect coordinates — *not* pixels. This is deliberately different
from `npc.x`/`npc.y`, which are pixels (`4.5 * TILE`): authored content
reads best in tiles, and the runtime converts once (`wp.x * TILE`) when
following the route. Validation checks waypoints against tile-unit map
bounds (0..COLS, 0..ROWS). Do not mix conventions inside `movement`.

### Behavioural rules Phase 1 must implement

- **Opt-in only.** No `movement` property → the NPC never moves, turns,
  animates, or blocks differently than today.
- **Active map only.** Only NPCs whose resolved `map` equals
  `currentMapId()` update. Off-map NPCs never accumulate route progress.
- **Orthogonal authored routes.** NPCs walk axis-aligned segments between
  authored waypoints (waypoint pairs should share an x or a y; L-shapes are
  authored as explicit corner waypoints). No pathfinding.
- **Global freezes.** Movement stops whenever the player-update gate stops:
  `combat.active`, `dialogue.open`, `menu.open`, `choice.open`,
  `shop.open`, and during/after a map transition in the same frame.
- **Conversation stop.** An NPC being spoken to stops moving and sets its
  `facing` toward Lélý for the duration of the dialogue.
- **Collision-respecting.** A moving NPC must not enter: unwalkable tiles
  (`WALKABLE`), fixed solid obstacles (custom-code solids in `canWalk()`),
  the player's body (mirror of the existing 18px AABB), or another solid
  NPC's body. Blocked → wait, do not shove or re-path.
- **Forbidden tiles.** Moving NPCs may never stand on or cross transition
  tiles (`TILE_PROPERTIES.isTransition`), doorways, or authored prohibited
  chokepoints; routes must be authored clear of them and validation should
  eventually enforce it (see Phase 1 requirement below).
- **No world side effects.** NPC motion never rolls encounters, never
  triggers `EDGE_TRANSITIONS` or point-tile transitions, never picks up
  items, never fires `MAP_FEATURES` triggers.
- **Animation model.** Moving NPCs animate exactly the way the player does:
  `facing` (direction), `moving` (bool), `step` (frame counter) — the
  fields drawPlayer() already keys off. Generic NPC renderers are currently
  front-facing only, so Phase 1 must add directional/walk variants for the
  generic sprite types before any NPC visibly moves.
- **Runtime state is separate from authored data.** Route progress (current
  waypoint index, pause countdown, live px position) lives in a separate
  runtime table keyed by NPC id — the authored `SIMPLE_NPCS` entry (and its
  `movement` object) is never mutated. `NPC_REGISTRY` stays reference-only.
- **No save impact.** Incidental live coordinates are NOT saved; on load an
  NPC resumes from its authored anchor exactly as today. If a later feature
  needs persisted positions it must add that explicitly (new save fields +
  `SAVE_VERSION` bump), not inherit it silently from this system.
- **Permanently stationary categories.** Seated/workstation NPCs (clerks at
  desks, counters), shopkeepers, the two props inside `SIMPLE_NPCS`
  (`calwick_school_bookshelf`, `calwick_school_map`), the six position-only
  named figures (MERCHANT, TRAVELLER, INNKEEPER, DRENWICK_INNKEEPER,
  SUPERVISOR, ESLA — bespoke renderers, custom interaction wiring), and any
  bespoke-sprite NPC (`NPC_DRAW_FNS`) without directional rendering work
  stay stationary. Validation enforces the bespoke/prop part today.

### Validation (additive)

`validateNPCs()` validates `movement` only when present, so an NPC without it
reports nothing new. Checks: recognized `type`; `loop` must be `false` for a
`scriptedRoute`; `autoStart` must be boolean and is patrol-only; nonempty
`waypoints` array of finite tile-unit coordinates within map bounds, each with
an optional nonnegative finite per-waypoint `pauseFrames`; **every route
segment orthogonal** (each consecutive waypoint pair — and, for a looping
patrol, the last-to-first closure — shares an x or a y; diagonals error);
positive finite `speed`; nonnegative finite movement-level `pauseFrames`;
boolean `loop`; a (unique) id; a rendering classification that can move
(generic `spriteType`, not a bespoke `NPC_DRAW_FNS` entry); and no authored
`x`/`y` getter (a schedule getter would fight runtime motion). For a
`boundedWander` it instead requires a `bounds` object of finite in-map tile
indices with `minCol <= maxCol` and `minRow <= maxRow`, nonnegative finite
`minPauseFrames`/`maxPauseFrames` with `min <= max`, and rejects the
incompatible combinations (waypoints on a wanderer, `bounds` on a waypoint
route, `autoStart` on a non-patrol). **Full tile-by-tile route walkability is
intentionally NOT re-checked in the validator** — resolving an arbitrary
`npc.map` string to a grid there and re-deriving `canWalk()`'s corner/solid
logic would duplicate the collision system. Instead the real collision path
(`npcRouteCanOccupy()`) is exercised directly by the behavioural tests
(46/47/48), which drive actual frames and assert the pilots never stick,
overlap, clip furniture, leave bounds, or enter the exit — the single source of
truth stays in movement.js.

### Phase 1 implementation inventory

NPC population, classified for the pilot (counts as of Phase 0):

- **Generic standing humanoids — first-pilot candidates.** Standing
  `spriteType` patron/worker/traveler/child NPCs in open rooms (market
  browsers, dock loiterers, street children: e.g. `drenwick_market_2`
  (Sera), `drenwick_civic` patrons, Calwick square children). Requirement
  before any of them move: directional + walk-frame variants for the four
  generic sprite bodies.
- **Bespoke sprites needing directional rendering work.** `maren`, `wen`,
  `polwick` (`NPC_DRAW_FNS`), plus the six position-only named figures
  above. Excluded from movement until each gets its own directional art;
  validation errors on `movement` for `NPC_DRAW_FNS` ids today.
- **Seated / workstation NPCs — permanently stationary by design.** Desk
  clerks (Holt, Officer Veth at his ledger, Petra, harbormaster staff),
  counter staff (Oda, innkeepers, Nora's stall, tavern keeper), the
  infirmary staff around fixed furniture. Their sprites and interactions
  assume the furniture around them.
- **Dynamic schedule/getter NPCs — special care.** 89 `get map()` / 17
  `get x()` / 20 `get y()` entries (dayoff relocation, flag-gated
  appearances). A getter-scheduled NPC given `movement` is a validation
  error (x/y getters) or needs Phase 1 rules for "route only while resolved
  to this map" (map getters). Do not convert getters to plain fields for
  the pilot.
- **Non-NPC props — excluded.** `calwick_school_bookshelf`,
  `calwick_school_map` (inside `SIMPLE_NPCS`, bespoke draw fns), and all
  furniture/props outside it (HOUSE_DATA furniture, FILING_CABINET, etc.).

Exact touch-points Phase 1 will need (none touched in Phase 0):

- `npcs.js` — add `movement` to the chosen pilot NPCs; nothing structural.
- `movement.js` (or a new `npc-movement.js` loaded after it) — the route
  updater; called from `update()` **after** the player-freeze early-returns
  so every global freeze is inherited for free; reuse/extract the solid-NPC
  AABB constants from `canWalk()` rather than duplicating numbers.
- `render-entities.js` — directional/walk-frame variants of
  `drawGenericClerk/Patron/Worker/Traveler/drawCalwickChild`, keyed off the
  runtime `facing`/`moving`/`step`; `drawSimpleNPCs()` reads live runtime
  position for moving NPCs (authored position for everyone else).
- `interactions.js` — `interactSimpleNPCs()` gains the stop-and-face hook
  (set runtime `moving=false`, face the player) on successful interaction.
- `state.js` — the runtime motion-state table (id → {wpIndex, pause,
  px, py, facing, moving, step}), reset on map change.
- `validation.js` — the deferred route-walkability check via the real
  collision path.
- `test/` — a Phase 1 behavioural test (route following, freezes,
  collision, stop-and-face, no-encounter guarantee), replacing test 45's
  final "no real NPC has movement" assertion intentionally.
