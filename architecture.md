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
| `save.js` | `QUEST_FLAG_SCHEMA`, `saveGame()`, `loadGame()`, `validateSaveSchema()`. | Don't declare new *persistent* variables here — declare them in the file that owns that concern, then wire them into `saveGame`/`loadGame`/`QUEST_FLAG_SCHEMA` here. See "Save/flags" below — this is the single most common thing new content gets wrong. |
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
| `interactions.js` | `handleInteract()` (the interact-key dispatcher), `interactSimpleNPCs()`, and the `MAP_FEATURES` content-authoring registry (`tryMapFeatures()`, `checkMapFeatureTriggers()`, `evaluateMapFeatureCondition()`, `resolveMapFeaturePages()`, `debugMapFeatureInfo()`). Loaded last since `update()`/`handleInteract()` are called at runtime, by which point every script has finished loading. | See "Interactions" below for the full priority story — this file is the single biggest one in the codebase (~4,200 lines) precisely because most scripted, one-off interaction logic (chests, quest triggers, boss encounters, town-specific dialogue branches) is hand-written directly in `handleInteract()`'s giant `if`/`else if` chain, not data-driven. `MAP_FEATURES` doesn't replace that chain — it's the lowest-priority fallback checked only if nothing in it fired. |

### Content / data files

These aren't part of the historical "`main.js` split" (the table above), but
matter just as much for where new content goes:

| File | Owns |
|---|---|
| `tiles.js` | Tile pixel size (`TILE`), every numeric tile-id constant, `WALKABLE[]`, `TILE_PROPERTIES`, the tile helper functions (`getTileProperties`/`getTileName`/`isTileWalkable`/`isTileEncounterEligible`/`tileHasTag`/`isWaterTile`/`isRoadTile`/`isTransitionTile`), and the debug-only `DEBUG_TILE_NAMES`/`debugTileName()`. |
| `maps.js` | Every 16×15 map-grid constant, `MAP_REGISTRY`, and `mapRegistryId()`. |
| `data.js` | `MAP_METADATA`, the enemy-template pools (`ENEMY_TEMPLATES`, `DUNGEON_ENEMY_TEMPLATES`, etc), and most per-map `*_ITEMS` arrays. |
| `npcs.js` | `SIMPLE_NPCS` (every data-driven NPC) and `NPC_ACTIONS`. |
| `items.js` | `ITEM_REGISTRY`. |
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
2. **The entire hand-written `if`/`else if` chain** (by `dungeonFloor`,
   then the enormous "not in a dungeon" branch covering every town/area,
   then floors 4/5) — chests, quest-object encounters, boss triggers,
   town-specific scripted dialogue, and (inside each area's branch)
   `interactSimpleNPCs()` (which itself checks every `SIMPLE_NPCS` entry
   whose `.map` matches `currentMapId()`, opening either a plain
   `.dialogue` array or a custom `.action(npc)` callback for the nearest
   one in `TALK_RADIUS`). NPCs and chests/quest content are interleaved
   throughout this chain by area, not globally ordered against each other —
   whichever this specific area's branch checks first wins for that area.
3. **`MAP_FEATURES` inspectables** (`tryMapFeatures()`) — checked **last**,
   guarded by a plain `if (!dialogue.open) tryMapFeatures();` at the very
   end of `handleInteract()`. This single guard is enough to guarantee
   `MAP_FEATURES` never steals an interaction from anything above it,
   *without* restructuring the giant chain: every path through it that
   "handles" a press sets `dialogue.open = true` as its feedback mechanism
   (verified for every custom NPC `.action` callback in the codebase), and
   `dialogue.open` is guaranteed false on entry to `handleInteract()` (step
   1 would have returned early otherwise) — so if it's true by the time
   this line runs, something above already claimed the press this frame.
4. If nothing above fired, the press is a no-op.

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

## Save/flags — `QUEST_FLAG_SCHEMA` is the actual save gate

**`saveGame()` persists an explicit list, not a blanket dump of every
global.** `QUEST_FLAG_SCHEMA` (`save.js`) is that list; `saveGame()` only
writes `window[key]` for each `key` in the schema. This is the single
easiest thing to get wrong when adding new persistent state: setting a bare
`window[myNewFlag] = true` (or a plain `let myNewFlag = true;`) does
**not** make it survive a save/load round-trip — it has to also be added to
`QUEST_FLAG_SCHEMA`, or it silently resets next session.

This directly affects `MAP_FEATURES`' `onceFlag`: it *is* a plain
`window[name]` boolean and *does* correctly prevent re-showing within the
current session (that part needs no schema change), but it will **not**
survive save/load unless its name is also added to `QUEST_FLAG_SCHEMA`.
Rather than auto-registering flags into the schema at runtime (a real save-
schema change, with its own risk), `validateGameData()`'s `validateMapFeatures()`
warns instead, whenever a feature's `onceFlag` isn't in `QUEST_FLAG_SCHEMA` —
so an unpersisted once-only flag is a visible warning, not a silent surprise,
until/unless someone decides persistence is actually wanted for that
specific feature.

`validateSaveFlags()` (`validation.js`) also cross-checks the *reverse*
direction: every key `syncQuestFlagsToWindow()` (`quests.js`) writes should
also be in `QUEST_FLAG_SCHEMA`, or it would be silently dropped from saves.
That reverse-direction list is a maintained cross-check copy inside
`validation.js`, not derived automatically (there's no way to introspect a
function body's assignments from outside it) — when `quests.js` adds a new
synced flag, `QUEST_FLAG_SCHEMA` needs it first, then that cross-check list
in `validation.js` needs updating to match, or `validateGameData()` will
report a spurious error.

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
  in its own fresh context; currently 26 tests, all passing.
- **`test/transition-audit.js`** — a standalone, exhaustive sweep: calls
  every real `enter*`/`exit*`/`ascend*`/`descend*` transition function live
  and checks the landing spot against the game's own collision logic
  (bounds + walkability), cross-references every `flatFns`-listed
  transition against `transitionTileNames`, and checks house doors and
  tile-constant references. Also wired into the main suite as one of the
  26 tests. Not the same thing as `validateGameData()`'s lighter-weight,
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
  quest-flag names** — saves, map arrays, and `QUEST_FLAG_SCHEMA` all
  reference them by exact value/name, with no migration layer.
  `WALKABLE[]`/`TILE_PROPERTIES` grow by adding entries at new indices, not
  by renumbering.
- **Don't make `isTileWalkable()`/`TILE_PROPERTIES.walkable` the source of
  truth for collision** — `WALKABLE[]` is, on purpose, so a documentation
  mistake can never become a collision bug (see "Tiles" above).
- **Don't add a new persistent flag without also adding it to
  `QUEST_FLAG_SCHEMA`** — see "Save/flags" above; this is the most common
  way new content silently fails to survive save/load.
- **Don't assume `MAP_FEATURES`/`INTERACTION_REGISTRY` interchangeably** —
  `INTERACTION_REGISTRY` no longer exists in this codebase. If you find a
  reference to it anywhere (an old comment, an old doc), it's stale.
- **Don't restructure `handleInteract()`'s priority ordering** by moving
  logic around inside the giant `if`/`else if` chain without re-reading
  "Interactions" above first — the `MAP_FEATURES` priority guarantee
  depends specifically on every higher-priority path setting
  `dialogue.open = true`, which is easy to accidentally break with a
  "silent" action that doesn't.
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
