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
`TILE_PROPERTIES`, `RENDERABLE_TILE_IDS`, `ENEMY_SPRITE_DISPATCH`, `EDGE_TRANSITIONS`,
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
| `save.js` | `QUEST_FLAG_BINDINGS` (the flag registry) + derived `QUEST_FLAG_SCHEMA`, `SAVE_VERSION` (**4**), `migrateSave()` (v4 accepts ONLY the current version — no migration/fallback; `SAVE_MIGRATIONS` is retired/unused), `saveGame()`, `loadGame()`, `resolveLoadLocation()` (the v4 discriminated-location preflight), `validateSaveSchema()`. | Don't declare new *persistent* variables here — declare them in the file that owns that concern, then add **one `QUEST_FLAG_BINDINGS` entry** here. `saveGame()` refuses to write when `regionalInvariantErrors()` is non-empty; `loadGame()` commits position via `placeAtLocation()` (regional-position.js), never by assigning `activeMap`/`player.x`/`player.y`. See "Save/flags" and "Canonical regional world position" below. |
| `world-transitions.js` | Every `enter*`/`exit*`/`ascend*`/`descend*` function that moves the player between maps/dungeons/towns/buildings, plus the generic `EDGE_TRANSITIONS` table and `tryEdgeTransition()`, and the debug-only `debugWarpToMap()`/`debugFindNearestWalkableTile()`/`debugEdgeTransitionSummary()`/`debugNearbyTransitionInfo()` helpers. | No drawing code — even location-specific hint overlays (e.g. the sluice gate hint) live in `render-entities.js`. |
| `game-loop.js` | The 60fps-capped `loop()` and its `requestAnimationFrame` kickoff. Intentionally tiny. | No game logic — `loop()` should only ever call `update()` then `render()`. |
| `render-tiles.js` | Per-cell base tile drawing (grass/water/dungeon/town/sluice tiles), the `drawTile(id, x, y)` dispatcher called once per grid cell every frame, the `drawMapTiles(map, originPxX?, originPxY?, range?)` loop that dispatches a whole (or sliced) rectangular map through `drawTile()` in row-major order, and the debug/validation-only `RENDERABLE_TILE_IDS` Set (mirrors the dispatcher's `case` labels). | Not furniture (`render-interiors.js`) and not sprites/items/NPCs (`render-entities.js`). Don't rewrite `drawTile()`'s dispatch shape without also updating `RENDERABLE_TILE_IDS` — they're two independent lists that happen to describe the same set today, checked for agreement only by hand, not by any automated cross-check between the two files. |
| `world-view.js` | **PURE** camera / chunk-visibility calculations for the continuous overworld: `regionPixelBounds()`, `cameraOriginForTarget()`, `visibleChunks()`, `chunkVisibleTileRange()`, and `buildContinuousWorldPlanFromWorld()` — the ONE plan entry, keyed on a region-world PIXEL point. Derives everything from `REGIONAL_LAYOUT` + `mapIdForChunk` (data.js) and `COLS`/`ROWS`/`TILE`. | No DOM/canvas, no state mutation, no duplicated layout data. The runtime camera feeds it the CANONICAL regional world position; there is no map-id+local plan overload (removed) and no player-local→world adapter here. |
| `regional-position.js` | **THE canonical regional-position authority**: the private canonical state `{ regionId, worldPxX, worldPxY }`; conversions `mapLocalPxToRegionWorldPx()` / `regionWorldPxToLocal()`; the derived read-model `regionalContext()` + accessors `regionalWorldPosition()` / `regionalDerivedLocation()` / `regionalActiveMapId()` / `regionalPlayerWorldPoint()`; atomic writers `commitRegionalWorldPosition()` (derives `activeMap`/`player.x`/`player.y`), `enterRegionalMapFromLocal()`, `clearRegionalPosition()`, `placeAtLocation()` (the regional/discrete router used by every location gateway); and read-only `regionalInvariantErrors()` / `regionalInvariantsHold()`. | Canonical state is not externally mutable and is `null` on every discrete location. Callers NEVER assign `activeMap`/`player.x`/`player.y` for a regional map — they go through this module. It never repairs state; the read model fails closed (returns null) on a broken invariant and `regionalInvariantErrors()` only reports. |
| `debug-warp.js` | **DEBUG-ONLY** logical warp destination catalog + resolver: `DEBUG_WARP_DESTINATIONS_AUTHORED`, derived outdoor destinations, `getDebugWarpDestinations()` (outdoor-first, deterministic), `debugDestinationById()`, and `debugWarpToDestination()`. Pairs each destination with the exact location-state its canonical `enter*()` wrapper sets; commits only through `transitionToLocation()`. | Reads production data (`MAP_CATALOG`, location bindings) but production never depends on it. Don't assign location flags directly here; don't run the `enter*()` wrappers' story/NPC side effects. |
| `continuous-seams.js` | **DEBUG-ONLY** generalized seamless movement across eligible reciprocal ALIGNS seams (see "Continuous seams" below): the fail-closed structural classifier (`classifyContinuousSegment`/`continuousSegmentDiagnostics`), the derived eligible-seam index (`eligibleContinuousSeam`/`continuousSeamMapEligible`/`continuousSeamEntries`), exact-footprint engagement (`continuousSeamEngaged`), world-aware collision (`continuousFootprintWalkable`), per-axis movement + atomic handoff (`continuousSeamMove`), legacy-inset suppression (`continuousSeamSuppressLegacyEdge`), and the inspector diagnostic. | Only active under Continuous View; derives its authority from `REGIONAL_LAYOUT`+`EDGE_TRANSITIONS` (never a hand-list, never `test/`). Uses `footprintCorners()` (movement.js) so the collision footprint isn't duplicated. |
| `continuous-content.js` | **DEBUG-ONLY**, read-only neighbouring outdoor-content rendering under Continuous View (see "Neighbouring outdoor content" below): content-key AMBIGUITY derivation (`outdoorContentKeyEntries`/`outdoorContentKeyInfo`, grouped PURELY from `OUTDOOR_CONTENT_KEYS`), the `OUTDOOR_MAP_DECOR` decoration registry, the render context (`outdoorChunkContentContext`), and `drawNeighbourOutdoorContent()`. | Read-only: **never** assigns/spoofs `activeMap`/player/location/NPC/item state (no probe). The physical→logical key authority itself is `OUTDOOR_CONTENT_KEYS`/`outdoorContentKeyForMapId` in **data.js**. Covers only the 15 placed outdoor maps. Uses parameterized `drawMapWorldItems`/`drawContentNPCs` + landmark bodies (render-entities.js). |
| `world-point-content.js` | **DEBUG-ONLY** world-aware STATIC content across seams (see "World-aware static content across seams" below): the PURE world-point resolver (`worldPointContentContext`), cross-seam authorization compose (`crossSeamNeighbourFor`, over `continuousSeamCrossingAt` in continuous-seams.js), the EXPLICIT capability authorities (`CROSS_SEAM_NPC_CAPABILITIES`/`crossSeamNpcCapabilityRecognized`, `crossSeamCollectibleItem`), the once-per-frame cross-seam item-pickup driver (`crossSeamStaticPickup`, calling `collectWorldItemNear` in movement.js), the opted-in neighbour-NPC interaction resolver/dispatch (`resolveCrossSeamInteractTarget`/`tryCrossSeamNeighbourInteract`), and the single prompt authority (`crossSeamInteractPromptTarget`) that drives both the press and `drawCrossSeamInteractPrompt` (render-entities.js). | Only active under Continuous View. **Assigns nothing** — no `activeMap`/player/coordinate/content-key/NPC-position write; canonical effects only (item `.picked`/grant/dialogue, NPC dialogue + authored `flag_sets`). FAIL-CLOSED: one directly-adjacent eligible-seam neighbour; unambiguous key for NPC ownership; NPCs must OPT IN via `crossSeamInteraction:'simple_dialogue'` and pickups via `crossSeamPickup:'registry_grant'` (both explicit allowlist capabilities, validated in validation.js); nothing crosses by default. |
| `regional-npc-runtime.js` | **DEBUG-ONLY** chunk-aware regional NPC ownership + pose + simulation (see "Chunk-aware regional NPC runtime" below): `physicalMapIdForNpc` (logical key → physical outdoor map, fail-closed), `regionalNpcPose` (read-only live pixel pose), `nearbySimulationMapSet` (deterministic 3×3), `npcShouldSimulate` (lifecycle gate), `regionalNpcRouteCanOccupy` (world-aware, owner-chunk-confined occupancy). | Only active under Continuous View. **Assigns nothing** — no `activeMap`/player/location/NPC-ownership write. `npc.map` stays the logical key; physical ownership is distinct + explicit (`npc.physicalMapId` for ambiguous `'overworld'`). NPCs confined to one owner chunk (no cross-chunk routes yet). |
| `encounter-geography.js` | **PURE** geographic random-encounter authority (see "Geographic random-encounter authority" below): `geographicEncounterContext(regionId, worldPxX, worldPxY)` (physical chunk → `MAP_CATALOG` pool, fail-closed) + the read-only runtime selectors `playerStandingWorldPoint` / `regionalStandingEncounterContext` / `encounterGeographyOk`. | No randomness, no state mutation; composes `REGIONAL_LAYOUT`+`mapIdForChunk`+`MAP_CATALOG` (no new table). Physical map id is the pool authority — never a logical/`'overworld'` key. Independent of Continuous View. Consumed by `currentEncounterPool()` (combat.js) and the roll gate (movement.js). |
| `render-interiors.js` | Interior furniture drawing per building (tavern, house, hamlet, brewery, harbormaster, wash house, provision store, offices, schools) and the anchor position consts those functions use. | Those anchor consts are also read by `canWalk()` in `movement.js` for collision — moving/renaming one affects collision, not just drawing. |
| `render-entities.js` | Player sprite, all NPC sprites, world-view boss/special-enemy sprites, items/chests/world-items, merchant/traveller/shop drawing, and small world-feature hint overlays (sluice gate, Drenwick north gate, Thornmere stone). | Not base tiles or furniture (see above). |
| `render-ui.js` | Drawing only for overlay panels: continent map, Accord panel, choice box, dialogue box, main/pause menu, debug menu, debug warp menu, and the debug map inspector overlay. | Panel *state* (`dialogue`, `menu`, `choice`, `debugMenu`, `warpMenu`, `debugInspector`, etc) lives in `state.js`/`combat.js`; panel *input handling* lives in `input.js`. This file only reads state and draws. |
| `render.js` | The single `render()` orchestrator — the canonical draw-call order (layering) for a frame — plus the pre-computed vignette, the extracted `drawActiveMapContent()` current-map content block, and the DEBUG continuous-view path (`continuousWorldViewActive()` / `drawContinuousWorld()`; see "Continuous-view prototype" below). | Don't put actual drawing logic here beyond the terrain/camera orchestration — call into the `render-*.js` files. If draw order/layering looks wrong, this is the file to fix. |
| `input.js` | The `keys` table and the `keydown`/`keyup` listeners; routes a keypress to whichever screen is active (combat, menu, choice, shop, debug menu, debug warp menu, overlay panels, overworld). | No game logic beyond routing — it calls into `movement.js`/`combat.js`/`interactions.js`/etc rather than mutating game state directly (aside from cursor/screen UI state). |
| `movement.js` | `player`, `locationName()`, `currentContentLocationKey()` (logical content-location key; `currentMapId()` is a deprecated alias), `tileAt()`, `canWalk()` (collision), `isEncounterEligibleTile()`, and `update()` — the per-frame advance of movement/cooldowns/encounter checks/`MAP_FEATURES` trigger-zone checks. | No drawing code. |
| `combat.js` | Equip helpers (`effectiveAtk`/etc), enemy stat templates, `choice`/`shop` state, the `combat` state object, all `start*Combat()` functions, turn resolution (`combatOptions`, `applyEnemyHitEffects`, `handleCombatAction`), and `currentEncounterPool()`. | Battle *rendering* (sprites, the combat screen UI) lives in `render-battle.js`, not here. |
| `render-battle.js` | Battle-screen sprite drawing for the player and every enemy type, `drawBattleGenericEnemy()` (the fallback silhouette for ids opted into `ENEMY_GENERIC_SPRITE_IDS`), the id-keyed `ENEMY_SPRITE_DISPATCH` table (`enemy.id → { draw, dy }`) that `drawBattleEnemy()` dispatches on, and `drawCombat()` (the action menu / item subscreen / message / victory / defeat UI). | Combat *logic* (damage, turn order, state transitions) lives in `combat.js` — this file only reads `combat` state and draws it. |
| `bootstrap.js` | The one-time new-game startup state (starting map/position, intro dialogue). | Must stay the last file loaded before `interactions.js` — see ordering rules above. Don't add anything here beyond one-time startup values. |
| `interactions.js` | `handleInteract()` (the interact-key dispatcher — a priority orchestrator over named location handlers, see below), `interactSimpleNPCs()`, and the `MAP_FEATURES` content-authoring registry (`tryMapFeatures()`, `checkMapFeatureTriggers()`, `evaluateMapFeatureCondition()`, `resolveMapFeaturePages()`, `debugMapFeatureInfo()`). Loaded last since `update()`/`handleInteract()` are called at runtime, by which point every script has finished loading. | See "Interactions" below for the full priority story. This is by far the largest file in the codebase. The *dispatch* is now a clean priority orchestrator (`INTERACT_HANDLERS` / `OVERWORLD_INTERACT_HANDLERS`, first-match-wins with explicit consumption), but the per-location behaviour it routes to — chests, quest triggers, boss encounters, town-specific dialogue branches — is still large, hand-written and one-off, so the physical file remains a maintainability hotspot despite the improved dispatch. `MAP_FEATURES` doesn't replace those handlers — it's the lowest-priority generic fallback, checked only if nothing consumed the press. **Region-specific interaction functions and `MAP_FEATURES` fragments now live in `content/interactions/*` (see "Regional content files"); `interactions.js` keeps the generic engine, the merge (`mergeMapFeatureFragments`), the cross-region handlers, and the priority tables.** |

### Content / data files

These aren't part of the historical "`main.js` split" (the table above), but
matter just as much for where new content goes:

| File | Owns |
|---|---|
| `tiles.js` | Tile pixel size (`TILE`), every numeric tile-id constant, `WALKABLE[]`, `TILE_PROPERTIES`, the tile helper functions (`getTileProperties`/`getTileName`/`isTileWalkable`/`isTileEncounterEligible`/`tileHasTag`/`isWaterTile`/`isRoadTile`/`isTransitionTile`), and the debug-only `DEBUG_TILE_NAMES`/`debugTileName()`. |
| `maps.js` | The **facade** for map *arrays*: every `window.*` map export, the Sunken Gallery grid-room arrays, and the shared/special maps that don't belong to one region (`MAP_N1`/`MAP_N2`, `APARTMENT_CORRIDOR_MAP`, `SMALL_APARTMENT_MAP`, `HOUSE_INTERIOR_MAP`, `DREAM_MAP`). Region-specific map grids live in `content/maps/*` (below), declared **before** `maps.js`. The map *catalog* + registry/metadata views + helpers are built in `data.js` (not here), since they need the enemy pools/item arrays it defines. |
| `data.js` | `REGIONAL_CHUNK_CATALOG` (**the resolved runtime catalog** for placed regional chunks — assembled from the distributed `*_REGIONAL_CHUNK_DEFINITIONS` fragments in the geographic map files and resolved through `_ENCOUNTER_PROFILES`/`_REGIONAL_ITEM_SETS`; the regional slice of `MAP_CATALOG` + `REGIONAL_LAYOUT` + `OUTDOOR_CONTENT_KEYS` derive from it — see "Regional chunk authoring"); `MAP_CATALOG` (per-map catalog: discrete maps authored inline, regional entries derived) plus its `MAP_METADATA` alias, generated `MAP_REGISTRY`, and canonical helpers (`mapIdForRef`/`mapEntryForId`/`mapRefForId`, deprecated `mapRegistryId`); the enemy-template pools; and most per-map `*_ITEMS` arrays. |
| `npcs.js` | The **facade** for NPCs: `NPC_ACTIONS`, `NPC_REGISTRY`, `HOUSE_DOORS`, `HOUSE_DATA`, the shared named-position/workstation objects, `SHARED_NPCS` (generic house/apartment residents + genuinely cross-region NPCs), and the authoritative `SIMPLE_NPCS = [...CALWICK_NPCS, ...THORNMERE_WILDS_NPCS, ...DRENWICK_TOWN_NPCS, ...DRENWICK_INTERIOR_NPCS, ...SOUTH_RUINS_NPCS, ...SHARED_NPCS]` (concatenation only — no source-order tags, no sorting). Regional NPC arrays live in `content/npcs/*`, declared **before** `npcs.js`. |
| `items.js` | `ITEM_REGISTRY`, `createItem()`, `grantItem()`. **Rule: define item properties in `ITEM_REGISTRY` and grant items with `createItem(name)`/`grantItem(name)` — never hand-write inventory item objects at runtime.** `loadGame()` re-creates saved items from the registry by name, so a registry edit propagates to existing saves. |
| `shops.js` | `SHOP_REGISTRY`. |
| `quests.js` | Quest-flag variables, `syncQuestFlagsToWindow()`, and quest-progression helper functions. |
| `validation.js` | `validateGameData()` and its ten `validate*()` category functions — see "Validation" below. |

### Regional content files (`content/`)

The three largest authored-content files were split by **region** so each is a
thin facade over region files that only *declare* content. There are exactly 16
regional files and five regions (Calwick, Thornmere Wilds, Drenwick, South
Ruins, North Basin — Drenwick further split town vs interior for NPCs and
interactions):

```
content/maps/{calwick,thornmere-wilds,drenwick,south-ruins,north-basin}-maps.js
content/npcs/{calwick,thornmere-wilds,drenwick-town,drenwick-interior,south-ruins}-npcs.js
content/interactions/{calwick,thornmere-wilds,drenwick-town,drenwick-interior,south-ruins,north-basin}-interactions.js
```

`index.html` loads them in a fixed order: the five map files **before** `maps.js`,
the five NPC files (after `data.js`) **before** `npcs.js`, and the six interaction
files (after `bootstrap.js`) **before** `interactions.js`. The facades reference
the region-declared constants; because classic `<script>` tags share one global
scope, a `const` declared by an earlier file is visible to the later facade.

**Authoring rules:**

- **Maps**: the map *array* goes in the region's `*-maps.js`; add its ONE
  `MAP_CATALOG` entry in `data.js` (keyed by the canonical id, `id` === key).
  `MAP_REGISTRY`/`MAP_METADATA` are derived from the catalog — never author them
  directly. Generated-room builders and adjacent `*_ITEMS` arrays move with their
  region. (A new *content-location key* — a new NPC-schedulable location — is a
  separate concern: add it to `currentContentLocationKey()` and
  `VALID_CONTENT_LOCATION_KEYS`, not the catalog.)
- **NPCs** go in the region's `*-npcs.js` array (`CALWICK_NPCS`, …). `npcs.js`
  derives `NPC_REGISTRY` and assembles `SIMPLE_NPCS` from those arrays plus
  `SHARED_NPCS`. Within a region, keep on-map NPCs in their original relative
  order so per-map filtering of `SIMPLE_NPCS` is byte-identical.
- **Interaction functions and `MAP_FEATURES` entries** go in the region's
  `*-interactions.js` (`const CALWICK_MAP_FEATURES = { … }`, …). `interactions.js`
  keeps the generic engine, `interactHouseInterior()`, the cross-region
  `interactTownOutdoor()`, `SHARED_MAP_FEATURES`, and builds `MAP_FEATURES` via
  `mergeMapFeatureFragments([...])` — **which throws on duplicate map ownership**
  rather than silently overwriting.
- **Handler priority** stays explicitly owned by `interactions.js`:
  `INTERACT_HANDLERS` and `OVERWORLD_INTERACT_HANDLERS` are hand-written there and
  reference the regional functions (not flattened from arrays). The former
  region-mixing `interactWildsAndOutposts()` was split into
  `interactCalwickVale()` / `interactThornmereWilds()` / `interactDrenwickApproach()`
  / `interactNorthBasinWilds()` (the last is the catch-all with the generic tail),
  inserted consecutively at the same priority slot.
- **Shared content stays in the facade only when it genuinely crosses regions**
  (generic house/apartment residents and maps, cross-region NPC schedules,
  `interactTownOutdoor`, the apartment-corridor signage). Do not add a new
  regional bucket without an explicit architectural decision.

## Maps: the 16×15 grid, `MAP_CATALOG`, and the two identity namespaces

Every map is a plain array-of-arrays tile grid: **`ROWS = 15` rows of
`COLS = 16` tile-id numbers each** (`state.js`). This is a hard, unchecked-at-
runtime convention every piece of code assumes — `validateGameData()`'s
`validateMaps()`/`validateMapMetadata()` are the only things that actually
verify a given map array is 15×16 (as an **error**, not a warning, if it
isn't), and `movement.js`'s `tileAt()` returns a hardcoded solid tile
(`TREE`/`DUNGEON_WALL`/`SLUICE_WALL`/`TOWN_BUILDING`, by context) for any
out-of-range coordinate rather than checking a per-map size.

**Two distinct identity namespaces — do not conflate them:**

1. **Canonical physical map id** — a stable string like `MAP`,
   `HOUSE_INTERIOR_MAP`, `DRENWICK_CIVIC_MAP`. This is what save/transition code
   uses. One physical grid = one id.
2. **Logical content-location key** — what `currentContentLocationKey()`
   (`movement.js`) returns: `'west'`, `'house:<houseId>'`, `'drenwick_civic'`,
   per-apartment keys, etc. A *shared* physical grid stands in for many
   houses/apartments, and NPC `.map` values / `HOUSE_DOORS` / schedules key off
   these — so this is deliberately NOT the physical id. `validateNPCs()` checks
   `npc.map` against `VALID_CONTENT_LOCATION_KEYS`, a hand-maintained allowlist
   of these keys (not derived from the catalog).

**`MAP_CATALOG`** (`data.js`) is the ONE authoritative catalog of physical maps.
It is keyed by the canonical physical id (its `id` field MUST equal its key —
`validateGameData()` errors otherwise), and each entry carries
`{ id, map, displayName, region, type, items, encounterPool,
allowRandomEncounters, allowSave, notes? }`. `type` is one of `'outdoor' |
'town' | 'interior' | 'dungeon' | 'bridge' | 'special'`. **Discrete** maps (towns,
interiors, dungeons, bridge, special) are authored directly here; the **15 regional
outdoor chunks are DERIVED** from `REGIONAL_CHUNK_CATALOG` via
`_regionalChunkCatalogEntry()` (see "Regional chunk authoring" below) — their entry
is `MAP2: _regionalChunkCatalogEntry('MAP2')`, not a hand-authored copy. It lives in `data.js`
because it needs the `*_ENEMY_TEMPLATES` pools and `*_ITEMS` arrays defined
there; the map arrays themselves come from `maps.js` / `content/maps/*` (loaded
first). The 24 Sunken Gallery grid rooms are added to the catalog in a loop
before the views below are derived, so they are ordinary catalog entries.

**Derived compatibility views (never authored independently):**

- **`MAP_METADATA`** is an *alias* of `MAP_CATALOG` (same objects) — existing
  metadata consumers read it unchanged.
- **`MAP_REGISTRY`** is *generated* from the catalog as `{ id, label:
  displayName, map }` — its label is always the canonical `displayName`, its id
  always the canonical key (the old competing lowercase Drenwick ids are gone).
- **Canonical helpers** (`data.js`): `mapIdForRef(mapRef)` (reverse map-array→id
  lookup, O(1) via a prebuilt index), `mapEntryForId(id)`, `mapRefForId(id)` —
  all return `null` for unknowns, never a silent fallback. `mapRegistryId()` is a
  **deprecated alias** of `mapIdForRef()` kept for console tooling.

`validateGameData()`'s `validateMapMetadata()` validates the catalog directly:
id===key, 15×16 dimensions, every required field, and that **no map array is
registered under two ids**. (The old MAP_REGISTRY↔MAP_METADATA cross-check is
gone — with one authored table and two derived views, there is nothing to
cross-check.)

- **`MAP_FEATURES`** (`interactions.js`, optional) — see "Interactions"
  below; only needed if the map has inspectable signage or discovery
  triggers.

For a **plain outdoor map** with no new state flag (just another
`MAP2`/`MAP3`-style overworld square, the common case), `locationName()` and
`currentItemList()` need **no new lines** — both read
`mapEntryForId(mapIdForRef(activeMap))` (via `MAP_METADATA`) directly for any map
whose `type === 'outdoor'`. For every **other** map type (town buildings, dungeon
floors, sluice floors, the vault), those two functions and `combat.js`'s
`currentEncounterPool()` still branch on existing state flags
(`inTown`+`townBuilding`, `inDungeon`+`dungeonFloor`, `inSluice`+`sluiceFloor`,
`inMireVault`) rather than reading metadata directly — those areas are
stepped through via a floor/room counter, not a flat 1:1 "this map always
means this name/pool" mapping, so a metadata read can't (and shouldn't)
replace that branching. Those maps still get a full `MAP_METADATA` entry
(populated to match what the state-flag logic already produces) purely for
validation/documentation.

### `REGIONAL_LAYOUT`: regions, chunks, and world coordinates (continuous-overworld prework)

The two namespaces above are about **identity** (which map, which logical
location). Layout adds a third, orthogonal concept about **geometry** — where the
principal wilderness maps sit relative to one another on a single continuous
grid. Originally behaviour-neutral prework; as of **Canonical regional world
position (Part 1)** it is the authority `regional-position.js` derives the runtime
canonical `{ regionId, worldPxX, worldPxY }` from, and v4 regional saves persist that
world point (`SAVE_VERSION` is now **4**). Keep the five terms distinct:

| Term | What it is | Example |
| --- | --- | --- |
| **Physical map id** | canonical `MAP_CATALOG` key; one physical grid = one id | `MAP`, `NORTH_BASIN_S_MAP` |
| **Content-location key** | logical `currentContentLocationKey()` label; a shared grid can back many keys | `'west'`, `'house:esla_house'` |
| **Region** | a `REGIONAL_LAYOUT` key: one continuous chunk grid | `'overworld'` |
| **Chunk** | one map-sized cell in a region, at integer `(chunkX, chunkY)`; **east = +X, south = +Y** | `MAP` at `(0, 5)` |
| **Local coordinate** | a tile `(x, y)` **within** one map, `0 ≤ x < COLS`, `0 ≤ y < ROWS` | `(8, 8)` on `MAP` |
| **World coordinate** | a tile coordinate in a **region's** continuous space: `worldX = chunkX*COLS + localX`, `worldY = chunkY*ROWS + localY` | `MAP (8,8)` → world `(8, 83)` |

**`REGIONAL_LAYOUT`** (`data.js`) is the geometry view. Its `placements` are now
**DERIVED from `REGIONAL_CHUNK_CATALOG`** (the single authority — see below), in the
records' authored order; a small `_REGION_META` table supplies region-level `id`/
`displayName`. It holds one region, `'overworld'`, containing the 15 principal
connected wilderness maps. Their chunk coordinates were derived from the game's own
transitions (the broad `EDGE_TRANSITIONS` crossings plus the single-tile world
crossings in `movement.js`), not invented. Each chunk is exactly `COLS×ROWS` (16×15),
verified by `validateRegionalLayout()` / `validateRegionalChunkCatalog()`.

### Regional chunk authoring: distributed definitions → resolved catalog

A placed regional outdoor chunk is authored in **two clearly separated layers**:

1. **Authored chunk-definition fragments** — the sole human-edited authority,
   distributed across the geographic `content/maps/*.js` files (and `maps.js`).
2. **The resolved runtime catalog** (`REGIONAL_CHUNK_CATALOG`, `data.js`) — generated
   from those fragments and consumed by existing systems. It is the resolved view,
   **not** a second authority.

This keeps terrain grids **out of `data.js`**: they live in the geographic map files,
so `data.js` (which every map file loads before) never grows a grid literal per chunk.

**Authored fragments.** Each geographic file that owns regional grids declares one
`*_REGIONAL_CHUNK_DEFINITIONS` array. Today:

| Fragment | File | Chunks |
|---|---|---|
| `CALWICK_REGIONAL_CHUNK_DEFINITIONS` | `content/maps/calwick-maps.js` | `MAP` |
| `THORNMERE_REGIONAL_CHUNK_DEFINITIONS` | `content/maps/thornmere-wilds-maps.js` | `MAP2`,`MAP3`,`MAP4`,`MAP5`,`RODDON_WAY_MAP`,`MAP3_N1` |
| `DRENWICK_REGIONAL_CHUNK_DEFINITIONS` | `content/maps/drenwick-maps.js` | `MAP3_N2` |
| `NORTHERN_ROAD_REGIONAL_CHUNK_DEFINITIONS` | `maps.js` | `MAP_N1`,`MAP_N2` |
| `NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS` | `content/maps/north-basin-maps.js` | the 5 `NORTH_BASIN_*_MAP` |

A fragment is placed where its grids are defined (a `map:` reference must resolve at
fragment-eval time). Collectively the fragments author **exactly one definition per
placed regional map** (15 total). An authored definition OWNS:

```js
{
  mapId, regionId, chunkX, chunkY,   // identity + placement (integers)
  map,                               // the 15×16 tile grid, authored INLINE in the record
  displayName, region,               // catalog display metadata
  contentKey,                        // logical content-location key
  presentation,                      // 'continuous' | 'legacy_screen'
  encounterProfileId,                // STABLE id → an encounter pool (resolved in data.js)
  itemSetId?,                        // STABLE id → an items array (resolved in data.js); omit for an item-less chunk
  allowRandomEncounters, allowSave,
  legacyCameraExclusion?,            // { mapId, side } continuous-camera policy — see "Continuous-side camera exclusion"
  notes?,
}
```

The definition holds **stable ids, not runtime references**, for the two things that
would otherwise force a load-order dependency: the encounter pools live in `data.js`
(loaded *after* the map files), so a fragment names a stable `encounterProfileId`
instead of the pool array; item content stays authored once (in the map files /
`WORLD_ITEMS`) and is named by a stable `itemSetId` rather than duplicated into the
record.

**Runtime assembly (`data.js`).** In load order after the fragments:

- `_ENCOUNTER_PROFILES` — the one registry mapping `encounterProfileId` → pool array.
- `_REGIONAL_ITEM_SETS` — the one registry mapping `itemSetId` → items array.
- `_REGIONAL_CHUNK_DEFINITIONS` — the fragments merged deterministically (fixed
  fragment order; no consumer depends on placement/content-key list order).
- `REGIONAL_CHUNK_CATALOG` — built by resolving each definition: it exposes the actual
  `encounterPool`/`items` arrays consumers expect (same references as before), keyed
  by `mapId`. Pure construction — no gameplay-state mutation, no circular deps, no
  dynamically-invented `window` authority.

Everything downstream is a **generated compatibility view** derived from the resolved
catalog, so no placement / content key / presentation / encounter / identity value is
authored twice:

- the **regional slice of `MAP_CATALOG`** — each entry is `_regionalChunkCatalogEntry(mapId)`;
- **`REGIONAL_LAYOUT`** placements (region/chunk);
- **`OUTDOOR_CONTENT_KEYS`** (mapId → contentKey);
- `regionalPresentationForMapId()` (from the record's `presentation`);
- the reverse map-ref→id and chunk-coordinate indexes.

`validateRegionalChunkCatalog()` enforces the contract across BOTH layers: the
resolved records (unique non-empty ids, known region, integer/unique coords, 15×16
grid of valid tiles, unique physical grid refs, recognized presentation, resolved
pool/items arrays) AND the authored definitions (all 15 present exactly once, no
mapId/coordinate in two fragments, **known** `encounterProfileId`/`itemSetId` with a
useful message on an unknown id, every definition resolves into the catalog and every
catalog record traces back to a definition). It **fails closed** on an unrecognized
authored field (an unknown key could imply unsupported behaviour silently ignored).

**Add-a-regional-chunk workflow (going forward):** author ONE definition in the
appropriate geographic `*_REGIONAL_CHUNK_DEFINITIONS` fragment — its grid inline, plus
metadata and a stable `encounterProfileId`/`itemSetId` (add a new registry entry only
if you need a genuinely new pool or item set). That's it for the map itself; add
separate NPC/item/interaction content only if the chunk has any. You do **not**
hand-edit `MAP_CATALOG`, `REGIONAL_LAYOUT`, `OUTDOOR_CONTENT_KEYS`, or presentation
metadata — they derive. A future item-less, NPC-less chunk is still just one
definition (its grid + metadata). New regional grids should be authored **inline in
the fragment record**, never as a bare `const MAP… = [...]` variable.

**All 15 grids are authored inline.** Every placed regional grid now lives **inside its
chunk definition record** (`map: [ …15×16… ]`) in the owning geographic fragment — there
are no standalone `const MAP… = [...]` grid variables and no `map: MAP…` references to
them. `data.js` holds no terrain grids at all; it only assembles and resolves the
fragments.

**Compatibility aliases.** A number of pre-existing consumers still reference a regional
map by its bare identifier — `state.js`'s initial `let activeMap = MAP`, `movement.js`'s
`activeMap === MAP…` transition checks, render/audit code, and the tests + harness's
`window.*` reads. So after building the catalog, `data.js` declares one **derived alias
per map** — `const MAP… = REGIONAL_CHUNK_CATALOG.MAP….map` (+ a derived `window.MAP…`).
These are references to the catalog grid, **never a second grid or authority**, and are
the sole `const MAP…` / `window.MAP…` declarations in the codebase (the former exports in
`maps.js` were removed). They exist only to avoid a large, unrelated consumer refactor; a
**new** regional chunk never needs one (new code uses `mapRefForId(id)` / the catalog
helpers). Migrating those consumers off the bare identifiers, and dropping the aliases, is
a possible later cleanup — out of scope here.

**Regional chunks vs discrete maps.** Only the 15 placed wilderness chunks are
authored through this system. Discrete town / interior / dungeon / bridge / special
maps are NOT regional chunks: they stay authored directly in `MAP_CATALOG`, carry no
chunk definition and no `REGIONAL_LAYOUT` placement, and keep the physical `mapId` +
local-coordinate model (no canonical regional position). This increment does not
touch them.

**Deliberately excluded** (kept off the continuous grid): the hidden Briar Warden
meadow (`MEADOW_MAP`) and every other pocket/special map, plus all town,
interior, bridge, and dungeon maps. They remain separate maps reached by
point/gate transitions.

**Derived indexes + side-effect-free helpers** (`data.js`, mirroring the
`MAP_CATALOG` helper contract — unknown inputs return `null`, never a silent
fallback):

- `regionPlacementForMapId(mapId)` → `{ regionId, mapId, chunkX, chunkY }` or
  `null`. (`regionId` is the string `REGIONAL_LAYOUT` key, e.g. `'overworld'` —
  distinct from `MAP_CATALOG`'s geographic `region` field like `'North Basin'`.)
- `mapIdForChunk(regionId, chunkX, chunkY)` → physical map id or `null`.
- `localToWorld(mapId, localX, localY)` → `{ regionId, worldX, worldY }` or `null`.
- `worldToLocal(regionId, worldX, worldY)` → `{ mapId, chunkX, chunkY, localX,
  localY }` or `null` (unknown regionId, negative, out of range, or an unplaced gap
  chunk inside the bounding box).
- `tileAtWorld(regionId, worldX, worldY)` → the tile id, or **`REGION_VOID_TILE`**
  (`-1`, a documented void that is never a real tile id) for any missing chunk /
  out-of-range / negative coordinate.

Both this layout API and the `world-view.js` camera API use `regionId` for that
string key; `MAP_CATALOG`'s `region` (a human/geographic grouping) is a different
field and is left as `region`.

`validateRegionalLayout()` (in `validateGameData()`) checks the authority and its
derived indexes: every placed id is a real *outdoor* catalog map of the right
dimensions, integer chunk coords, unique chunk positions, no map placed twice,
and both reverse indexes agree with the authored placements. The extended
**continuous seam-readiness report** in `test/transition-audit.js` classifies each
placed edge (`ALIGNS` / `NEEDS_REMAP` / `BLOCKED` / `OUTSIDE_REGION` / `CONFLICT`
/ `BORDER`) — read-only; it reports incompatibilities rather than editing
content to hide them.

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
bridge gates, and the two Verdant Vale legacy-home square-to-square exits
(`MAP2_EXIT`, `NORTH_EXIT`) — the only overworld point crossings left, now that
every convertible one has become a continuous EDGE_TRANSITIONS seam.

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

### The canonical transition boundary — `transitionToLocation()`

However a transition is *triggered* (point tile, `EDGE_TRANSITIONS`, a scripted
event, debug warp, defeat relocation), the actual location change goes through
**one** boundary: `transitionToLocation(spec)` (`world-transitions.js`). It is
the only ordinary runtime code that simultaneously changes the map, the location
state, the player landing, and the transition cooldown.

**Location-state binding registry.** `LOCATION_STATE_BINDINGS`
(`world-transitions.js`) is the single authoritative list of the ~25 mutable
fields that define which area/map *mode* the player is in (`inDungeon`,
`dungeonFloor`, `inTown`, `currentTownId`, `townBuilding`, `currentHouseId` +
house source/return context, `inSluice`, `sluiceFloor`, every standalone `inX`
flag, `bridge_entry_direction`/`bridge_toll_paid`, …), each with a stable key,
neutral default, and get/set closures. `resetLocationState()` returns every
field to neutral; `snapshotLocationState()`/`applyLocationState()` capture and
restore a complete state. **Debug warp, the transition-audit reset, AND
save/load all use this same registry** — there are no more hand-copied lists
(neither a "clear every flag" list nor a per-field save/restore list) that can
silently forget one (which is exactly how `inBasinChamber`/`inSunkenGallery` were
once missed). Each binding also carries optional persistence metadata, so
`serializeLocationState()` flattens the live state into the save payload and
`deserializeLocationState()` rebuilds a complete candidate from a payload (map
refs ↔ registry ids via `mapRegistryId()`; `houseReturnPos` deep-copied; a
non-null unknown `houseSourceMapId` fails safely) — `saveGame()`/`loadGame()` no
longer maintain their own location field list. Persistent story/quest flags (e.g.
`dilemma_voss`) are **not** location state and are never in this registry — a
transition must not reset them, and they are serialized separately.

**The helper's contract.** `spec = { mapId, x, y, facing, state?, cooldown? }`:
a registered `MAP_REGISTRY` id, exact destination pixel coordinates (the caller
computes these, including any preserved coordinate such as the current
`player.y`), a facing, an optional object of **non-neutral location-state
overrides** (unknown keys rejected; every unspecified field defaults to neutral),
and an optional cooldown boolean. It validates the *whole* destination — map
resolves, coordinates finite and in-bounds, **the destination base tile is
walkable**, facing valid, state keys known, and the location invariants hold (at
most one major area mode active; town/house context only while `inTown`; a house
id needs `townBuilding: 'house'`; `inDungeon`/`inSluice` need a valid floor and a
non-`in*` destination can't keep a meaningful one; bridge state can't leak off
the bridge) — **before mutating anything**. The map/coordinate/bounds/walkable/
facing part is a shared pure helper, `validatePlacement({mapId,x,y,facing})`
(`world-transitions.js`), reused by save restoration. An in-bounds but **blocked**
destination is rejected — there is no auto-nudge and no temporary mutate/rollback.
On any failure it warns and returns `false`, leaving the map, position, facing,
cooldown, and every location field completely untouched. On success it resets all
location state to neutral, applies the overrides, changes the map, places and
faces the player, and applies cooldown.

**Edge-transition landings.** `tryEdgeTransition()` computes its destination
landing tile through the pure `edgeTransitionLanding(seg, along)` helper (the
exact clamp + one-tile-inside-border mapping); edge validation and the transition
audit call the *same* helper, so validation can't drift from runtime. Edge
validation now checks, for **every** walkable source-edge coordinate, that its
specific clamped landing is in-bounds and base-walkable (stronger than the old
"some source + some target is walkable" aggregate). **Story/quest/
dialogue/reward/NPC-reroll side effects stay in the wrapper functions**, never in
the generic helper. The rule is **"neutral defaults plus explicit destination
state"**: an outdoor transition needs no manual `false` list, while a dungeon/
sluice/town-building/house destination explicitly supplies exactly its own
non-neutral context (deliberately enumerated, not a blanket "preserve all").

**Approved direct location mutations** (everything else goes through the helper):
the initial declarations (`state.js`), new-game bootstrap (`bootstrap.js`),
`saveGame()`/`loadGame()` restoration (a restore is deliberately **not** a
gameplay transition — it fires no cooldown/dialogue/reroll; `exitDream()` and
save/load may reuse the low-level `applyLocationState()`), the helper and its
registry setters themselves, test/audit fixtures, ordinary per-frame
`player.facing` changes, and the single in-place `bridge_toll_paid = true` when
the toll is paid (an on-the-bridge state change, not a location change).

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
`render-battle.js`'s `ENEMY_SPRITE_DISPATCH` uses for enemy sprites (keyed by
stable enemy id). **Adding a
new tile id means adding both the `case` in `drawTile()` and the id to
`RENDERABLE_TILE_IDS`** — nothing enforces they stay in sync except running
`validateGameData()` and reading its output.

**`drawMapTiles(map, originPxX?, originPxY?, range?)`** (same file) is the
extracted, parameterized form of `render()`'s former inline
`for r,c: drawTile(activeMap[r][c], c*TILE, r*TILE)` loop. It reads its
dimensions from the supplied `map` (never `activeMap`), draws row-major, defaults
to origin `(0,0)` and the whole map, and accepts an optional half-open LOCAL TILE
`range` so a future caller can draw only a visible slice. `render()` now calls
`drawMapTiles(activeMap)` — with the default origin/range this is pixel-identical
to the old loop. **The `originPx` is the map's stable drawing-space/world origin,
not a camera-relative texture phase**: `drawTile()` keys procedural patterns
(animated water, etc.) off the absolute pixel coords it receives, so a future
continuous renderer must apply the camera as a *separate* transform (e.g.
`ctx.translate`) and pass each chunk its stable world-pixel origin — feeding a
camera-shifted origin here would make those patterns crawl as the camera moves.
The pure geometry that decides *which* chunks/slices to draw lives in
`world-view.js` (see the layout section); its first consumer is the debug
continuous-view prototype below.

### Continuous-view prototype (DEBUG-only, `render.js`)

A visual prototype of a scrolling-camera overworld that draws terrain from
neighbouring chunks. It is **off by default and never saved** (`continuousWorldViewEnabled`,
state.js; a debug-menu toggle `[ Continuous View ]`). When off — or on a map with
no `REGIONAL_LAYOUT` placement under `regionId 'overworld'` (towns, interiors,
dungeons, bridge, special maps, the hidden meadow) — `render()` uses the **legacy
path** (`drawMapTiles(activeMap)` + `drawActiveMapContent()`), pixel-identical to
before. `continuousWorldViewActive()` gates this; combat is unaffected (`render()`
returns before the world section when `combat.active`).

`render()`'s former inline current-map content block (items → furniture → NPCs →
special entities → landmarks → hints → player) is extracted verbatim, in the same
order, into **`drawActiveMapContent()`** — used by both paths.

The pure plan comes from **`buildContinuousWorldPlanFromWorld(regionId, worldPxX,
worldPxY, viewportPxW, viewportPxH)`** (world-view.js), fed the CANONICAL regional
world position (`regionalWorldPosition()`). It returns `null` off a placed point,
else `{ regionId, activeMapId, activePlacement, playerWorldPxX, playerWorldPxY,
camPxX, camPxY, visibleChunks }` — the active map + local are DERIVED from the world
point, never re-read off `activeMap`. Player world pixels are the canonical point (not
via `mapLocalPxToWorldPx`) — **note `localToWorld()` (data.js) is TILE-unit; player
pixels must never be passed to it.** The camera uses `cameraOriginForTarget()`
(integer, pixel-aligned, clamped to region bounds) and `visibleChunks()`.

`drawContinuousWorld()` then: (1) fills the 512×480 viewport with a stable void
colour; (2) `ctx.save()` + `ctx.translate(-camPxX, -camPxY)` — the camera is a
**separate transform, never subtracted from tile coords**; (3) draws each visible
placed chunk's terrain **once** via `drawMapTiles(chunkMap, ch.worldPxX,
ch.worldPxY, range)` at its stable world-pixel origin with the exact half-open
local range; (4) `ctx.save()` + translate to the active chunk's world origin,
`drawActiveMapContent()`, `ctx.restore()`; (5) `ctx.restore()` back to screen
space. All screen-space layers (vignette, dialogue, menus, panels, toasts, hints,
inspector, combat UI) are drawn **after** the restore, outside any transform.

**Intentional prototype limitations (not bugs):** edge transitions still drive
movement; crossing a seam can visibly jump because destinations still use
inset/remapped landing coords; NEEDS_REMAP seams are untouched; **only the active
map's entities/content render — neighbouring chunks show terrain only** (chunk-
aware entities are a later phase); no save-schema/world-position migration; no
terrain cache. Approx work per frame: ≤4 visible chunks, ≤ one 512×480 viewport of
`drawTile` calls (~ 16×15 = 240 tiles, plus partial edge tiles), same order of
magnitude as the legacy single-map draw.

### Regional presentation modes: the Verdant Vale fixed-screen home

A placed regional outdoor map presents either in the scrolling **continuous** world
or as a fixed **`legacy_screen`** (single, non-scrolling map) *even while the session
Continuous View toggle is on*. The MAP_CATALOG entry's optional
`regionalPresentation` is the SOLE authority (default `'continuous'` for a placed
regional outdoor map); `regionalPresentationForMapId()`/`isLegacyScreenMap()` (data.js)
resolve it. There is no second authored list of legacy maps and no scattered
`mapId === 'MAP'` presentation checks. Only **`MAP` (Verdant Vale)** is
`legacy_screen` today — the intentional small, self-contained *home*: leaving it east
(→ MAP2) or north (→ MAP_N1) reveals the larger scrolling world; returning restores
the fixed original-map presentation.

- **Toggle vs EFFECTIVE mode.** The session toggle `continuousWorldViewEnabled` is
  never mutated by entering/leaving home. `continuousWorldViewActive()` is the single
  choke point for the EFFECTIVE mode and now also returns `false` on a `legacy_screen`
  active map — so on MAP the legacy render path, legacy movement (no seamless
  handling), and NO regional NPC simulation / cross-boundary pickup/interaction/prompt
  all follow from that one predicate, with the toggle still logically on. The debug
  inspector shows "toggle ON, effective SUPPRESSED (legacy_screen map)". Leaving home
  re-enables the effective continuous mode automatically on the first destination
  frame — no menu reopen.
- **Continuous-side camera exclusion (declarative, stable-side).** From another
  continuous map the camera must never reveal a `legacy_screen` chunk OR a void hole in
  its place — and it must do so **without switching which side of the home it hugs as
  the player moves within one continuous area**.
  - *Why the old rule jumped.* The original `continuousCameraOrigin()` slid the camera
    to the excluded rect's nearest edge along whichever axis was the **smaller**
    correction. At MAP's **NE diagonal corner** two corrections are both valid — keep
    the viewport east of MAP, or keep it north — and the least-correction pick **flips
    axes across the diagonal line** `worldX + worldY = MAP.rightPx + (MAP.topPx − VH)`.
    MAP2 never showed the bug because it shares MAP's row (the Y-overlap is always on, so
    east always wins); **RODDON_WAY_MAP sits one row north**, so the Y-overlap is
    conditional and the camera jumped (~48–82 px in a single 2 px step) crossing that
    line — visibly around Roddon's col 6 rows 8↔9 and cols 5↔6 in the lower half.
  - *The fix — a declarative side policy.* Each chunk definition may carry an optional
    `legacyCameraExclusion: { mapId, side }` (schema field; resolved onto
    `REGIONAL_CHUNK_CATALOG`, read via `legacyCameraExclusionForMapId()`). It names the
    `legacy_screen` chunk to hide and the **fixed side** the whole viewport stays on.
    Current assignments: **MAP2 → east**, **RODDON_WAY_MAP → east** (both the
    southern/eastern approach), **MAP_N1 → north**. `resolveLegacyCameraExclusion()`
    pairs the policy with the excluded chunk's pixel rect; `continuousCameraOrigin()`
    then applies a **single-axis monotone clamp** — `east → camX ≥ rect.right`,
    `west → camX ≤ rect.left − VW`, `south → camY ≥ rect.bottom`,
    `north → camY ≤ rect.top − VH` — and **never compares horizontal vs vertical
    magnitudes**, so it cannot change axes at a corner. The clamp is pure, integer,
    pixel-aligned, and preserves half-open rectangle semantics; because the policy names
    the side the source chunk actually lies on (validated), the player stays in frame.
  - *No camera history.* The camera remains a pure function of the current canonical
    position — no smoothing, easing, interpolation, or retained mutable camera state
    (any of which could mask the jump or momentarily expose MAP/void). A continuous map
    with **no** policy is unconstrained (its viewport can't reach the home).
    `buildContinuousWorldPlanFromWorld()` applies the resolved policy and,
    belt-and-suspenders, still filters any `legacy_screen` neighbour from the
    visible-chunk list; `visibleChunks()` stays pure geometry; excluded area is never
    filled with invented terrain.
  - *Validation for future legacy-screen boundaries.* `validateLegacyCameraExclusion()`
    fails closed: recognized keys only; `side ∈ {north,south,east,west}`; the excluded
    map exists in the same region and **is** `legacy_screen`; the source map is **not**
    `legacy_screen`; the source chunk's coordinates are consistent with the chosen side;
    the clamp is feasible (hides the rect **and** keeps the player visible); and — the
    completeness rule — **every** continuous chunk whose reachable player-centred
    viewport can intersect a `legacy_screen` rect must carry an unambiguous policy for
    it. Unknown / malformed / contradictory policies are hard errors. There is no
    Roddon-specific camera conditional and no second camera-policy table in
    `world-view.js`; the declarative policy is the single source.
- **Continuous-side NPC simulation excludes legacy_screen chunks.** `nearbySimulationMapSet()`
  (regional-npc-runtime.js) omits every `legacy_screen` chunk from the nearby 3×3
  simulation set (via `isLegacyScreenMap`, not a hardcoded id), so a MAP-owned NPC does
  not initialise/update a route, move, face, collide, prompt, or interact while a nearby
  continuous map (MAP2 / MAP_N1 / RODDON) is active — the home stays hidden behind its
  border. This is the ONE shared simulation-scope filter; every consumer
  (`npcShouldSimulate`, `regionalNpcInSimulationScope`, route start/update, occupancy)
  inherits it. When the legacy map itself is active the effective mode is already false,
  so regional nearby simulation is off anyway; legacy town/interior/dungeon NPC behaviour
  is unchanged.
- **`INTENTIONAL_DISCRETE` vs `NEEDS_REMAP`.** The four directed edges of
  `MAP ↔ MAP2` and `MAP ↔ MAP_N1` are deliberately-kept discrete point crossings, not
  unresolved remaps. The transition audit derives a fifth seam-readiness class,
  **`INTENTIONAL_DISCRETE`** — a point crossing to the correct placed neighbour whose
  adjacency crosses a `legacy_screen` presentation boundary (derived from catalog
  presentation metadata + placement + the existing point-transition model, not
  hardcoded edge names). It is audit/presentation policy only: these edges are NOT
  eligible continuous seams, the fail-closed segment classifier is unchanged, and the
  four point transitions (tiles, dispatch, wrappers, inset landing, cooldown) are
  untouched. Post-increment totals: ALIGNS 16 / NEEDS_REMAP 10 / INTENTIONAL_DISCRETE 4
  / BLOCKED 4 / BORDER 26. `validateRegionalPresentation()` checks recognized values on
  placed outdoor maps, that no eligible continuous seam crosses a legacy_screen
  boundary, and that a legacy_screen map stays available to geographic encounters and
  save/placement (MAP is never removed from `REGIONAL_LAYOUT`/`MAP_CATALOG`/geography/
  saves/debug warp).
- **Reciprocal legacy-boundary crossings are a validation invariant.** EVERY placed
  adjacency between a `legacy_screen` and a `continuous` regional map must have a correct
  reciprocal INTENTIONAL_DISCRETE point crossing: both directed crossings exist, each
  targets the physically adjacent map, they use reciprocal inverse edges, their EXIT
  tiles sit base-walkable on the correct borders, and no broad eligible seam crosses the
  boundary. `validateGameData()` enforces this (`legacyBoundaryCrossingErrors()`),
  naming the maps + edge on failure. An **exterior/unplaced** legacy-screen edge (no
  placed neighbouring chunk) stays an ordinary `BORDER` and requires no exit. The
  transition audit and validation share ONE point-crossing description authority —
  **`REGIONAL_POINT_CROSSINGS`** (world-transitions.js), a declarative
  `{ from, dir, to, tile }` inventory describing (not replacing) the runtime dispatch;
  the audit derives its `POINT_WORLD_CROSSINGS` from it so the two never drift.

### Continuous seams: generalized seamless movement (DEBUG-only, `continuous-seams.js`)

Lets the player *walk* across EVERY currently-safe reciprocal ALIGNS outdoor seam
— as though the adjacent 16×15 maps were one — but ONLY while Continuous View is
on. (Today that is the 7 pairs / 14 directed seams of the North Basin and the
Thornmere fen shelf; the set is derived, not hand-listed.)

- **Canonical model (Part 1).** The canonical runtime position of a placed map is now
  the region-world pixel point in `regional-position.js`; `activeMap` and `player.x/.y`
  are DERIVED projections, and v4 saves store the regional world point (see "Canonical
  regional world position" below). `continuousSeamMove()` still resolves cross-seam
  collision/handoff in world pixels, but now commits the result through the canonical
  authority (one `commitRegionalWorldPosition`) rather than assigning map/local directly.
- **Derived eligible-seam authority (no hand-maintained list), FAIL-CLOSED.** A
  directed edge `mapId|dir` is eligible iff, from `REGIONAL_LAYOUT` +
  `EDGE_TRANSITIONS` + placement: from/to are both placed in the same `regionId`,
  physically adjacent in `dir`, it is the only segment on that edge, the segment
  passes the pure structural classifier, its `targetEdge` is the inverse of `dir`,
  and the reciprocal directed edge exists with an identical range.
  **`classifyContinuousSegment(seg)` is an ALLOWLIST, not a denylist:** the only
  recognized structural properties are `targetMap`, `targetEdge`, `sourceRange`,
  and `targetRange` (`CONTINUOUS_STRUCTURAL_PROPS`). Any other own property — the
  known behaviour-bearing `condition`/`blockedText`, or ANY future/unknown one
  (`callback`, `onTransition`, `onEnter`, `effect`, `stateChange`, `message`,
  `cost`, …) — makes the segment **ineligible with a surfaced reason** ("fail
  closed"), so a new behaviour-bearing property can never be silently walked
  through. A `targetRange` is eligible only when **identical** to `sourceRange`
  (non-remapping — treated exactly as if omitted); any differing `targetRange` is a
  remap and is ineligible. `continuousSegmentDiagnostics()` exposes the per-edge
  classification + reason (read-only), and `validateContinuousSeams()`
  cross-checks the derived index against the classifier (plus regionId, adjacency,
  reciprocal inverse, identical ranges, no duplicates, base-walkable source +
  landing, index agreement); nothing depends on `test/transition-audit.js`.
  **Physical adjacency alone never authorizes seamless travel** — a placed-adjacent
  BLOCKED pair (e.g. `NB_C`↔`NB_W`) is not eligible.
- **Exact-footprint engagement (no fixed corridor).** `continuousSeamEngaged(dx,dy)`
  is true iff Continuous View is on, the active map participates in an eligible
  seam, and the CURRENT footprint already touches an eligible seam, OR the CANDIDATE
  footprint (after this frame's `dx,dy`) would, OR the candidate standing point
  crosses one — using the shared `footprintCorners()` (radius `COLLISION_RADIUS`),
  each resolved to its chunk. Merely being within a tile of a seam with the
  footprint fully inside one map does NOT engage. So the approach doesn't inset:
  while Continuous View is on, `update()` SUPPRESSES its legacy inset edge
  transition for an eligible in-range seam (`continuousSeamSuppressLegacyEdge`),
  letting `canWalk()` walk the player up to the edge until footprint contact
  engages the seamless path.
- **World-aware collision** reuses `canWalk()`'s exact footprint (same
  `footprintCorners`) in world pixels (`continuousFootprintWalkable(regionId,
  worldPxX, worldPxY)`): a corner in the standing chunk uses ordinary tile
  walkability; a corner in a DIFFERENT chunk is allowed ONLY across an eligible
  seam, in range, direction matching, with a walkable destination tile —
  otherwise impassable (missing chunk / `REGION_VOID_TILE` / out-of-region /
  out-of-range / ineligible neighbour / blocked tile / **diagonal** all block).
  Solid NPCs on eligible seam maps block, center-based, exactly like `canWalk()`.
- **Movement + atomic handoff.** `continuousSeamMove` resolves X then Y (Y from the
  possibly-handed-off map/position), each axis once, wall-sliding preserved. When
  the STANDING POINT crosses into an eligible neighbour chunk, `activeMap` switches
  atomically and the same world-pixel position converts to destination-local
  pixels — preserving sub-tile progress, facing, step, cooldown, and location
  state. No inset/nudge/clamp/toast/`transitionToLocation`; no double legacy
  dispatch. At most one handoff per axis (two in a diagonal frame only if each
  axis independently crosses a real eligible seam; no such corner exists in the
  current layout). `update()` does not return early, so step/status/point-
  transition/encounter/NPC housekeeping all run once, and the destination map is
  authoritative immediately.
- **Legacy fallback by classification.** Continuous View off → all transitions
  legacy. On: eligible reciprocal ALIGNS seams are seamless; NEEDS_REMAP seams stay
  discrete/remapped; BLOCKED/conditioned transitions keep their behaviour/messages;
  BORDER/void stays blocked; point transitions, towns, interiors, dungeons, houses,
  bridge, meadow, and special maps stay legacy. Toggling off near a seam can't
  strand the player. The transition audit totals are unchanged.
- **First converted former point crossing (pilot): Thornmere Fen ↔ Northern Fen.**
  `MAP3.north ↔ MAP3_N1.south` was a `FEN_N_EXIT`/`FEN_N_ENTRANCE` point-tile warp
  (`enterMap3N1`/`exitMap3N1`); it is now a structural `EDGE_TRANSITIONS` seam — the
  single **col-8 `PATH`**, `sourceRange [8, 8]`, reciprocal, no `targetRange`. MAP3's
  north edge is otherwise open lake, so the seam is deliberately **one tile wide**;
  that one-tile road corridor is **authored geography, unchanged** (only the two
  former transition tiles at `MAP3[0][8]`/`MAP3_N1[14][8]` became ordinary `PATH`).
  With **Continuous View on** it is walked seamlessly (world-aware footprint
  collision keeps the crossing to the col-8 corridor; the standing-point handoff
  swaps `activeMap` as the centre passes the chunk boundary). With **Continuous View
  off** the same connection works through the legacy broad-edge path
  (`tryEdgeTransition`), landing one tile inside the destination edge (row 13 / row
  1) with the encounter cooldown applied — matching the retired point transition.
  Both maps stay `FAR_ENEMY_TEMPLATES` on each side (geographic ownership).
- **Second converted former point crossing: Eastern Reaches ↔ Thornmere Fen.**
  `MAP2.east ↔ MAP3.west` was a `MAP3_EXIT`/`MAP3_ENTRANCE` point-tile warp
  (`enterMap3`/`exitMap3`); it is now a structural `EDGE_TRANSITIONS` seam — the
  single **row-11 `PATH`**, `sourceRange [11, 11]`, reciprocal, no `targetRange`.
  Both maps' shared edge is otherwise closed, so the seam is one tile wide; the
  corridor is authored geography, unchanged (only `MAP2[11][15]`/`MAP3[11][0]` became
  ordinary `PATH`). Unlike the pilot, the two sides own **different** pools —
  `MAP2` = `ENEMY_TEMPLATES`, `MAP3` = `FAR_ENEMY_TEMPLATES` — so pool ownership flips
  exactly at the standing-point handoff. **Cooldown nuance:** the retired
  `enterMap3`/`exitMap3` did *not* apply an encounter cooldown, but the generic legacy
  broad-edge path (`tryEdgeTransition`) does. We keep that established generic
  behaviour rather than special-casing the seam, so with **Continuous View off** this
  crossing now applies a cooldown where the old point transition did not — a
  fallback-mode-only difference (Continuous View on is still cooldown-neutral).
- **Third converted former point crossing: Thornmere Fen ↔ Thornmere.**
  `MAP3.east ↔ MAP4.west` was a `MAP4_EXIT`/`MAP4_ENTRANCE` point-tile warp
  (`enterMap4`/`exitMap4`); it is now a structural `EDGE_TRANSITIONS` seam — the single
  **row-6** crossing, `sourceRange [6, 6]`, reciprocal, no `targetRange`. The
  replacement terrain is **asymmetric**: the MAP3 side continues as `PATH`
  (`MAP3[6][15]`), the MAP4 side begins as ordinary `GRASS` shore (`MAP4[6][0]`);
  `continuousSeamEdgeWalkability()` only requires both border cells be base-walkable,
  not identical. Pools differ — `MAP3` = `FAR_ENEMY_TEMPLATES`, `MAP4` =
  `THORNMERE_ENEMY_TEMPLATES` — flipping at the standing-point handoff. **Cooldown
  parity:** both retired wrappers applied `cooldown: true` and the generic legacy edge
  path does too, so behaviour is identical in both modes (Continuous View on never
  resets it; off applies it, exactly as `enterMap4`/`exitMap4` did). The Thornmere
  Standing Stone (MAP4 lake island, col 7) is unaffected: its body draws world-locked
  via the `OUTDOOR_MAP_DECOR.MAP4` neighbour authority (single instance, no `activeMap`
  read) while the SPACE hint and interaction stay gated on `activeMap === MAP4`.
- **Fourth converted former point crossing: Thornmere ↔ Thornmere Shallows.**
  `MAP4.east ↔ MAP5.west` was a `MAP5_EXIT`/`MAP5_ENTRANCE` point-tile warp
  (`enterMap5`/`exitMap5`); it is now a structural `EDGE_TRANSITIONS` seam — the single
  **row-6** GRASS spit, `sourceRange [6, 6]`, reciprocal, no `targetRange`. Replacement
  terrain is **symmetric `GRASS`** on both shores (`MAP4[6][15]`/`MAP5[6][0]`); the
  surrounding tree/water edge stays blocked, so only row 6 crosses. Both maps share the
  `THORNMERE_ENEMY_TEMPLATES` pool, so the crossing causes **no pool change**. Cooldown
  parity holds (both retired wrappers and the generic edge path apply `cooldown: true`).
  MAP5 carries the ambiguous `overworld` content key but owns no items/NPCs/decor, so it
  contributes nothing when rendered as a neighbour (neighbour content is keyed by
  physical-map ownership, never the shared key) — no leakage or duplication.
- **Fifth converted former point crossing: Northern Road ↔ Drenwick Approach.**
  `MAP_N1.north ↔ MAP_N2.south` was a `NORTH2_EXIT`/`NORTH2_ENTRANCE` point-tile warp
  (`enterMapN2`/`exitMapN2`); it is now a structural `EDGE_TRANSITIONS` seam — the single
  **col-7** PATH, `sourceRange [7, 7]`, reciprocal, no `targetRange` (a vertical seam,
  mirror of the MAP3↔MAP3_N1 pilot). Both shores are the col-7 road (`MAP_N1[0][7]` /
  `MAP_N2[14][7]` → PATH); the rest of each edge is forest wall, so only column 7
  crosses. Both maps share `FAR_ENEMY_TEMPLATES` (no pool change), and cooldown parity
  holds (both retired wrappers and the generic edge path apply `cooldown: true`). Two
  MAP_N2 specials are unaffected and stay active-map-gated: the **Pale Sentry** scripted
  encounter (`startCombat()` checks `activeMap === MAP_N2 && sentry_quest_started &&
  !sentry_quest_done`, so it only applies after the standing-point handoff onto MAP_N2),
  and the **sealed Drenwick gate** (body world-locked via `OUTDOOR_MAP_DECOR.MAP_N2`,
  SPACE hint gated on `activeMap === MAP_N2`). The `MAP ↔ MAP_N1` legacy boundary on
  MAP_N1's *south* edge (`NORTH_ENTRANCE`) is untouched and stays INTENTIONAL_DISCRETE.
- **Sixth (final) converted former point crossing: Drenwick's north fen ↔ North Basin
  South Approach.** `MAP3_N2.north ↔ NORTH_BASIN_S_MAP.south` was a
  `NORTH_BASIN_EXIT`/`NORTH_BASIN_ENTRANCE` point-tile warp
  (`enterNorthBasinS`/`exitNorthBasinS`); it is now a structural `EDGE_TRANSITIONS` seam —
  the single **col-12** PATH causeway, `sourceRange [12, 12]`, reciprocal, no
  `targetRange`. Pools change `FAR_ENEMY_TEMPLATES ↔ NORTH_BASIN_ENEMY_TEMPLATES` at the
  handoff; the causeway PATH is encounter-safe while the basin reeds keep their behaviour;
  cooldown parity holds. The North Basin road sign (`MAP_FEATURES`, active-map-gated via
  `currentMapFeatures()`) is not inspectable from MAP3_N2 before the handoff. The
  BRIDGE_GATE at MAP3_N2 row 5 col 12 is a separate crossing and is untouched.
- **Closure.** With this conversion the regional audit reaches **zero `NEEDS_REMAP`**:
  all 60 directed overworld edges classify as `ALIGNS` (26), `INTENTIONAL_DISCRETE` (4),
  `BLOCKED` (4), or `BORDER` (26); every `ALIGNS` edge is backed by the fail-closed
  `continuousSeamEntries()` authority; and `REGIONAL_POINT_CROSSINGS` is reduced to
  exactly the four Verdant Vale legacy-home directed crossings. The continuous-seam graph
  is deliberately split into three components — the legacy home (isolated), the Northern
  Road branch (`MAP_N1`/`MAP_N2`), and the southern/basin cluster — which the two
  INTENTIONAL_DISCRETE home crossings reconnect into one traversable 15-map graph: the
  Northern branch rejoins the world *through* the Verdant Vale legacy presentation, by
  design, rather than through a blocked wall.
- **Continuous seam crossings do NOT reset the encounter cooldown.** The seamless
  handoff (`continuousSeamMove`) only swaps `activeMap` + local coordinates; it never
  calls `transitionToLocation`, so `combat.cooldown` is untouched (it just keeps
  ticking). Only the legacy edge/point path applies a fresh cooldown.
- **Seam edge base-walkability validation.** `continuousSeamEdgeWalkability()`
  (validation.js, pure) confirms — for every coordinate of a seam's identical
  reciprocal range — that BOTH the source border tile and its reciprocal landing
  border tile are base-walkable; `validateContinuousSeams()` errors otherwise. This
  is the general guard that a converted point crossing (or any future one) cannot
  strand/soft-lock the seamless footprint on a blocked border cell.
- **Out of scope / future.** No caching. (Regional consumers now all read the
  canonical context — see below.)

### Canonical regional world position (`regional-position.js`)

The runtime position of a placed wilderness map is now a **canonical region-world
PIXEL point** — `{ regionId, worldPxX, worldPxY }` — held privately in
`regional-position.js`. `activeMap`, `player.x`, `player.y` are **temporary
compatibility PROJECTIONS derived from it**, not a second authority. Keep these
distinct:

- **Canonical regional world position** — `{ regionId, worldPxX, worldPxY }`; the
  ONE authority for a placed map (incl. Verdant Vale's `legacy_screen` MAP —
  geographic position is independent of presentation mode, so MAP is canonical
  regional even while its continuous rendering is suppressed).
- **Derived physical chunk / local projection** — `activeMap` + `player.x/player.y`,
  computed from the canonical point by `commitRegionalWorldPosition()`. Callers never
  assign them for a regional map. `player.facing` is NOT part of the position.
- **Discrete-map local position** — towns/interiors/dungeons/houses/bridges/dream/
  special maps keep the physical `activeMap` + local `player.x/y` model; canonical
  regional state is **`null`** there.

**Writers routed through the authority.** Location gateways —
`transitionToLocation()`, dream restore (`exitDream()`), bootstrap, debug warp
(via `transitionToLocation()`), defeat/reset (via `transitionToLocation()`) and
`loadGame()` — commit position through `placeAtLocation(mapId, localPxX, localPxY)`
(regional → commit canonical + derive projections; discrete → set physical map/local
+ clear canonical). Movement is CANONICAL-FIRST: an accepted regional step is
calculated from the canonical world point (`regionalWorldPosition()`), runs the same
X-then-Y `canWalk()` collision, and commits the accepted world candidate via ONE
`commitRegionalWorldPosition()` — which DERIVES the destination map + local (a handoff
when the standing point crosses an eligible seam, else the same chunk). `player.x +=`
remains only on discrete maps. There is no reverse local→canonical sync (the old
`regionalCommitFromActiveLocal()` is gone), no runtime path reconstructs canonical from
a conflicting projection, and there is no "repair from activeMap/local" loop —
`regionalInvariantErrors()` only REPORTS (missing/stale/disagreeing projections).

**Camera.** `render.js`'s continuous path reads `regionalWorldPosition()` and feeds
`buildContinuousWorldPlanFromWorld()` — the camera consumes the canonical world point
directly and never re-derives it from `activeMap`+local. Rendering stays read-only.

**Save v4 (`SAVE_VERSION = 4`, clean break — no migration).** Location is a
discriminated union: `{ kind:'regional', regionId, worldPxX, worldPxY }` or
`{ kind:'discrete', mapId, localPxX, localPxY }`. A regional save stores the canonical
region/world position only (no `activeMapId`/local as a second authority); a discrete
save stores the physical map id + local pixels. `player` carries facing only. Other
save data and location-state MODE flags (inTown, dungeonFloor, houseSourceMapId, …)
are unchanged. `saveGame()` refuses to write (leaving any existing save intact) if the
canonical invariant is broken; `loadGame()` accepts only version 4 and rejects any
other version / unknown kind / malformed coords / void point / blocked placement /
inconsistent state atomically (running state + stored save untouched). Regional load
derives the chunk/local projection from the world point; discrete load uses the
existing map-local path.

**Consumers (all migrated).** Every regional runtime consumer reads the canonical
context, never `activeMap`+local: geographic encounters (`playerStandingWorldPoint()`
→ `regionalPlayerWorldPoint()`, so pool ownership + the Pale Sentry's MAP_N2 branch
follow the canonical current chunk); regional NPC simulation/collision
(`nearbySimulationMapSet()`, player-vs-NPC collision → `regionalPlayerWorldPoint()`);
world-aware items/pickups (`activePlayerWorldPoint()` → canonical); interactions &
map-features (`currentMapFeatures()` → `regionalActiveMapId()`); the seam movement
helpers (`continuousSeamEngaged`/`_csMoveAxis`/diagnostic read `regionalWorldPosition()`);
rendering (camera `buildContinuousWorldPlanFromWorld()`, `continuousWorldViewActive()`,
`currentContentLocationKey()`/`locationName()`/`currentItemList()`/debug inspector →
`regionalActiveMapId()`/`regionalContext()`). Each fails closed (does nothing / empty
result) on a broken invariant rather than acting on a stale position. `activeMap`,
`player.x`, `player.y` remain as READ-ONLY compatibility projections, never consulted
as an independent geographic authority.

### Neighbouring outdoor content, READ-ONLY (`continuous-content.js`)

Under Continuous View, every VISIBLE placed outdoor chunk renders its authored
world content (items, NPCs, procedural landmarks) at its stable world origin —
not just terrain. This is purely VISUAL: neighbouring content never updates,
interacts, is collected, triggers, or controls encounters. **`activeMap` remains
the sole behaviour authority**; only the active chunk gets the player and
active-only prompts/hints. Behaviour ownership still switches at the standing-
point handoff (see "Continuous seams"); this only removes visual pop-in.

- **Explicit render context.** `render()`'s `drawContinuousWorld()` draws, under
  the camera transform: (1) all terrain row-major; (2) each NON-active chunk's
  content via `drawNeighbourOutdoorContent(outdoorChunkContentContext(mapId,
  false))` at that chunk's world origin, row-major; (3) the active chunk's full
  `drawActiveMapContent()` (+ player, + active-only hints) LAST, so active
  layering and player-on-top are preserved exactly. A map renders at the SAME
  world origin whether active or neighbour, so nothing jumps on handoff. The
  context is `{ mapId, map, contentLocationKey, isActiveChunk }`.
- **Physical map id → outdoor content-location key: ONE declarative authority.**
  The two namespaces stay distinct (physical ids identify chunks/`MAP_CATALOG`;
  content-location keys identify NPC/content ownership) and are NOT one-to-one —
  `MAP`/`MAP5`/`RODDON_WAY_MAP` share the `'overworld'` key. **`OUTDOOR_CONTENT_KEYS`
  (data.js)** is the single declarative binding of each of the 15 region-placed
  outdoor maps to its logical key; **`currentContentLocationKey()` (movement.js)
  CONSUMES it** for neutral outdoor locations, so there is not a second,
  independently-maintained mapping (and no drift). `outdoorContentKeyForMapId(mapId)`
  → `key | null` is a **pure O(1) lookup** — it never probes/assigns `activeMap` or
  location state. Ambiguity is derived PURELY by grouping the object
  (`outdoorContentKeyEntries()`/`outdoorContentKeyInfo()` in continuous-content.js):
  a key owned by one map is unambiguous (its neighbouring NPCs are attributed to
  that chunk); a shared key is ambiguous (neighbour NPC rendering skipped; items +
  decorations unaffected). It covers ONLY the 15 outdoor maps — never
  towns/houses/interiors/dungeons. `validateContinuousContent()` checks the binding
  covers exactly the placed outdoor maps (no missing/stray) and errors if a map
  owns NPC content under an ambiguous key. **Nothing in the resolver, ambiguity
  derivation, or render path assigns `activeMap`/player/location state — zero
  transient mutation, not merely net-zero.**
- **Parameterized, read-only draws.** `drawWorldItems()`/`drawSimpleNPCs()` gained
  explicit-input twins `drawMapWorldItems(list)` / `drawContentNPCs(contentKey)`
  (used for neighbours). Items respect each entry's collected `.picked` state; NPCs
  render at their existing runtime/schedule positions with no advance, dialogue, or
  player-relative prompt. Procedural landmarks are split into a static body
  (`drawThornmereStoneBody`, `drawDrenwichNorthGateBody`) drawn on neighbours via
  the sole `OUTDOOR_MAP_DECOR` registry, and an active-only SPACE hint that stays
  in the active draw function. Nothing here reads/spoofs/mutates `activeMap`,
  `player`, location flags, NPC state, or item state.
- **Still out of scope.** Neighbour content does not update/interact/collect/
  trigger; encounters, schedules, collision, and pickups are unchanged; NEEDS_REMAP
  seams still inset; no save/world-position migration; no caching.

### World-aware static content across seams (`world-point-content.js`)

A narrow, opt-in extension of the read-only neighbour rendering above: under
Continuous View, a NARROW, explicitly-safe set of nearby STATIC outdoor content
may also RESOLVE across ONE directly adjacent eligible seam — (a) automatic
world-item pickups, and (b) safe stationary simple-dialogue NPC interaction
targets. Nothing else crosses. **Neighbouring NPC movement/schedules/wandering/AI
and encounters are NOT changed**; `activeMap` remains the sole authority for
those. Behaviour ownership still switches only at the standing-point handoff — this
merely lets an in-reach item or a stationary NPC one tile across the seam be
collected/talked-to before that handoff, instead of being untouchable until it
happens.

- **PURE world-point resolver.** `worldPointContentContext(regionId, worldPxX,
  worldPxY)` → `{ regionId, mapId, map, localPxX, localPxY, contentKey,
  contentKeyUnambiguous } | null`. Units are PIXELS. A missing chunk / documented
  void / off-region / negative / non-finite point returns `null` (never invents a
  chunk). `contentKey`/`contentKeyUnambiguous` come straight from the
  `OUTDOOR_CONTENT_KEYS` authority + its grouped ambiguity — the same single
  source the renderer and `currentContentLocationKey()` use. It **assigns nothing**
  (no `activeMap`/player/coordinate/content-key/NPC write; no probe, no
  snapshot/restore) — zero transient mutation, not merely net-zero.
- **FAIL-CLOSED authorization reuses the movement gate.** `continuousSeamCrossingAt(
  activeMapId, targetWorldPxX, targetWorldPxY)` (continuous-seams.js) is a PUBLIC,
  read-only wrapper over the exact `_csCrossingSeam` predicate the collision path
  uses: it returns the single eligible seam a standing observer on the active chunk
  would cross to REACH a target point, or `null`. All of these must hold, or it is
  `null`: Continuous View on; active map placed; the target chunk **directly
  cardinally adjacent** (diagonal never counts); a **reciprocal** eligible seam
  between them; the crossing coordinate **inside the seam's approved range**; the
  target in a placed (non-void) chunk. `crossSeamNeighbourFor()` composes this gate
  with the pure resolver and cross-checks that the seam's declared neighbour matches
  the map the point physically lands on. `TALK_RADIUS`/pickup-radius reach is an
  additional AND on top.
- **Cross-seam item pickup, with an EXPLICIT item-capability classifier.**
  `update()`'s pickup was parameterized into `collectWorldItemNear(wi, atX, atY,
  {crossSeam})` — the active loop calls it with `player.x/player.y`;
  `crossSeamStaticPickup()` (run once/frame, AFTER the active sweep so the active
  map keeps deterministic priority) calls it for each eligible-seam neighbour's
  items with the player expressed in that neighbour's LOCAL frame, so the 20 px
  radius test measures the true world distance either way. The item's SHARED object
  is mutated in place (canonical `.picked`/grant/dialogue), so it disappears
  immediately and can **never re-grant** on a later handoff; it persists through the
  existing stable-id pickup registry (`PICKUP_REGISTRY`, save.js) unchanged.
  Crossing is **fail-closed by an EXPLICIT per-pickup capability ALLOWLIST**
  (`crossSeamItemCapability`/`crossSeamCollectibleItem`) — NOT a "not
  quest_item/inscription" denylist. A placed pickup crosses a seam ONLY if it opts
  in with `crossSeamPickup: 'registry_grant'` (the sole recognized capability,
  authority `CROSS_SEAM_ITEM_CAPABILITIES`) **and** satisfies that capability's
  contract in full: a stable `pickup_<snake>` id; a `name` resolving in
  `ITEM_REGISTRY`; both the pickup's `type` and the registry definition's `type` in
  the ordinary allowlist `CROSS_SEAM_ORDINARY_ITEM_TYPES` (`potion`/`weapon`/`armor`/
  `shield`/`accessory` — the plain grant types; `rod`/`buff`/`reagent` and any
  unknown type are excluded); neither the pickup nor the registry definition marks
  `questItem`/`keyItem`; and **no unknown behaviour-bearing property** — every
  pickup key must be a structural field (`id/name/type/x/y/picked/crossSeamPickup`)
  or an ordinary item-value field mirrored on the registry definition
  (`heals`/`price`/`bonus`). Absence of the opt-in, an unrecognized capability, a
  `quest_item`/`inscription` pickup type, a quest/key item, an unknown registry
  type, or any `scriptedPickup`/`onCollect`/`callback`/invented property all fail
  closed. A registry-backed non-special item is therefore **NOT** automatically
  eligible — it must explicitly opt in. To extend the contract, add a new capability
  to `CROSS_SEAM_ITEM_CAPABILITIES` with its own explicit schema (never widen the
  denylist). The active-map pickup path ignores `crossSeamPickup` entirely, so
  authored items keep unchanged on-map behaviour. `validateGameData()` errors on any
  pickup that declares `crossSeamPickup` but violates the contract.
- **Cross-seam interaction requires EXPLICIT NPC opt-in (no absence-based
  eligibility).** `tryCrossSeamNeighbourInteract()` is the LOWEST-priority fallback
  in `handleInteract()`, tried only when the active map (all handlers +
  `MAP_FEATURES`) resolved nothing this press, so active-map behaviour is unchanged
  and it can never fire beneath open UI or duplicate an active prompt. A neighbour
  NPC is cross-seam-interactable ONLY if it **opts in** with a recognized capability
  — `crossSeamInteraction: 'simple_dialogue'` (the sole capability today; the
  authority is `CROSS_SEAM_NPC_CAPABILITIES`). Absence or any unknown value fails
  closed — eligibility is **never** inferred from missing action/route metadata, so
  future behaviour cannot silently become safe. An opt-in additionally requires the
  neighbour's **UNAMBIGUOUS** content key, within `TALK_RADIUS` in world pixels,
  authorized across the seam; the dispatch opens ONLY simple dialogue at the NPC's
  canonical runtime position (no clone/move/schedule-advance, no scripted
  fight/cutscene) and applies the NPC's authored `flag_sets`. `validateGameData()`
  is the primary guard: an opted-in NPC that also carries an action / movement route
  / ambiguous ownership / no dialogue, or declares an unrecognized capability, is a
  hard **error**; the runtime gate (`_crossSeamDialogueNpc`) re-checks the same
  structure as defence-in-depth.
- **Cross-seam interaction PROMPT (same authority as the press).**
  `crossSeamInteractPromptTarget()` is the single pure authority that decides BOTH
  what a press dispatches to and whether a prompt renders: it returns the opted-in
  neighbour NPC `resolveCrossSeamInteractTarget()` selects, unless a higher-priority
  ACTIVE-map simple-NPC target is present (which would win the press), in which case
  it returns `null` and suppresses the prompt. `drawContinuousWorld()` calls
  `drawCrossSeamInteractPrompt()` inside the camera transform, after active content:
  it renders **exactly one** SPACE hint above that NPC's world-pixel position, or
  none. After a handoff the former neighbour is the ACTIVE map, so it is no longer a
  cross-seam neighbour and the authority returns `null` — the prompt cannot
  duplicate. Prompt selection and rendering mutate nothing.
- **No authored targets today; synthetic-fixture tested.** There are ZERO authored
  outdoor NPCs on any seam-eligible content key, and none of the three authored
  world items sits within pickup radius of an eligible seam — so this path is
  exercised only by synthetic fixtures (test 74). No gameplay content was added or
  moved to enable it; the mechanism is general and validated for when such content
  is authored.
- **Still out of scope.** Encounters (the active map stays the sole pool
  authority; pickup/interaction queries never roll), scripted fights/cutscenes,
  and any non-cardinal or more-than-one-neighbour ownership all stay
  legacy/active-only. (Nearby regional NPC *movement* is now chunk-aware — see the
  next section.)

### Chunk-aware regional NPC runtime (`regional-npc-runtime.js`)

Regional outdoor NPCs on NEARBY chunks get explicit physical-map ownership and keep
updating / rendering / colliding / prompting / interacting consistently while
visible from another chunk. Crossing the player's active-map boundary does not
reset, duplicate, freeze, teleport, or redraw a nearby NPC. No authored outdoor NPC
exercises this yet — it is built and validated with synthetic fixtures (test 75);
no gameplay content was added or moved.

- **Logical key vs PHYSICAL ownership.** `npc.map` stays the LOGICAL
  content-location key (`currentContentLocationKey()`), NOT a physical map id.
  `physicalMapIdForNpc(npc)` is the ONE authority for a regional NPC's placed
  outdoor physical map: derived when the logical key is UNAMBIGUOUS, or declared via
  `npc.physicalMapId` when the key is AMBIGUOUS (`'overworld'` → MAP / MAP5 /
  RODDON_WAY_MAP). An explicit `physicalMapId` must be a placed outdoor map whose
  `OUTDOOR_CONTENT_KEYS` key AGREES with `npc.map`. Unknown / unplaced / nonoutdoor /
  disagreeing / ambiguous-without-declaration all **fail closed** (null). Towns,
  interiors, dungeons, bridge, meadow, houses, and special maps are nonregional
  (null) and keep their exact legacy content-key lifecycle.
- **Runtime pose authority (read-only).** `regionalNpcPose(npc)` → `{ npc, mapId,
  contentKey, localPxX, localPxY, worldPxX, worldPxY, facing, route } | null` is the
  ONE pose every consumer (rendering, collision, prompt, interaction) reads. World
  position = the owner chunk's placement origin + the NPC's CURRENT LIVE local
  position (its route writes `npc.x/npc.y`). It never copies the NPC or mutates
  state.
- **Nearby simulation set (physical proximity, not draw calls).**
  `nearbySimulationMapSet()` returns the active chunk plus every placed chunk within
  one chunk on either axis (a max **3×3** neighbourhood), deterministic **row-major**,
  sparse chunks omitted; `null` when Continuous View is off or the active map is
  nonregional (legacy). An NPC keeps animating in its OWN chunk without needing an
  eligible seam; seam eligibility still gates CROSS-boundary player collision /
  interaction. Simulation is based on physical proximity, so it never fluctuates
  with a one-pixel visibility change.
- **Lifecycle.** `ensureAutoMovers()` / `updateNpcRoutes()` now gate on
  `npcShouldSimulate(npc)`: regional NPCs use nearby-set membership; nonregional NPCs
  and legacy mode use the exact old active-content-key gate. A regional NPC KEEPS its
  live position / waypoint / pause / facing / animation step across the player's
  active-map handoff (its chunk stays in the set — no restart, no reset, no jump);
  once its chunk LEAVES the set it suspends via the established home contract
  (`resetMovementNpc` → authored `MOVEMENT_HOMES`) and restarts from home when
  simulated again. Each NPC updates exactly once per eligible frame, and every
  existing global freeze (dialogue / combat / menu / choice / shop / debug / warp)
  freezes it exactly as before. Route state stays session-only; `SAVE_VERSION`
  remains 3; load and defeat still restore authored homes (`resetAllMovers`).
- **World-aware occupancy.** `regionalNpcRouteCanOccupy(npc, localNx, localNy)`
  resolves a route step against the NPC's OWN physical map: terrain + transition
  tiles read via `tileAtWorld` from that map, the full `COLLISION_RADIUS` footprint
  confined to the OWNER CHUNK (this is how "an NPC cannot leave its map" is enforced
  this increment), the player in regional world pixels, and every OTHER solid
  regional NPC via `regionalNpcPose` (so two NPCs in different local frames can't
  overlap and distant NPCs never collide). `npcRouteCanOccupy()` dispatches here for
  a regional NPC in scope; nonregional NPCs keep the legacy active-map path. The
  player's own cross-seam collision (`continuousFootprintWalkable`) now blocks on
  solid regional NPC poses too (the old content-key→offset probe was removed).
- **Rendering.** Neighbouring chunks render NPCs by PHYSICAL-map ownership
  (`drawContentNPCsForPhysicalMap(mapId)`), so an unambiguous derived owner AND an
  explicit-`physicalMapId` owner (a mover on the ambiguous `'overworld'` key) both
  render at their own chunk from the same LIVE pose the active map uses — a neighbour
  mover visibly advances instead of appearing frozen. Each NPC renders exactly once
  (active chunk via `drawSimpleNPCs`; neighbours via their own chunk's pass, with a
  guard so an explicit-owner NPC is never also drawn at the active-local frame).
  Handoff produces no duplicate / disappearance / jump / reset. Active-only generic
  prompts stay suppressed for neighbours except through the shared cross-seam prompt
  selector.
- **Moving cross-seam interaction (explicit, fail-closed).** A new recognized NPC
  capability `crossSeamInteraction: 'moving_simple_dialogue'` lets a MOVING neighbour
  (has `movement` + an explicit `physicalMapId`) open ordinary dialogue + `flag_sets`.
  Interacting FREEZES its live route at its current position and turns it toward the
  player using WORLD-coordinate deltas; it resumes the same route after the dialogue
  closes (the existing `resumeDelay` thaw) — never restarted or teleported home. The
  interaction target and the prompt use the same live pose; exactly one prompt / one
  interaction. Absence, unknown capability, an action / scripted behaviour, or
  unresolved (ambiguous) ownership all fail closed; active-map target priority is
  unchanged. `validateGameData()` errors on a mismatched / unplaced `physicalMapId`,
  an ambiguous-key mover without a declaration, `simple_dialogue` on a mover,
  `moving_simple_dialogue` without movement / `physicalMapId`, or an opted-in NPC
  carrying an action.
- **Schedules.** No authored schedule (day/flag-based `npc.map` getter) currently
  enters a regional outdoor logical key — every scheduled/dynamic NPC resolves to a
  town/house/interior key — so schedule schemas are unchanged. A future scheduled NPC
  that could occupy a regional outdoor key must resolve `physicalMapId` explicitly for
  each such location (ambiguity fails validation); the physical map is never inferred
  from `activeMap`.
- **LIMITATION — no cross-chunk NPC routes yet.** A regional NPC is confined to its
  ONE owner chunk: occupancy blocks any step leaving the chunk, landing on a
  transition tile, or leaving the map. Seamless PLAYER transitions do not authorize
  NPC travel. Cross-chunk NPC movement is future work — it will require an explicit
  movement capability and a world-space route schema.

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

### Geographic random-encounter authority (`encounter-geography.js`)

For the placed regional wilderness, the random-encounter pool is owned by the
**physical chunk beneath the player's STANDING POINT in world space** — never a
logical content key, the shared `'overworld'` key, visible/neighbour chunks, the
3×3 NPC simulation set, camera position, or an assumed single active screen. This
is architectural preparation for a continuous/chunked overworld; it is
**behaviour-neutral** with the current maps (the standing point is always on the
active chunk, so the resolved pool equals the active map's own `MAP_CATALOG` pool —
and `MAP_METADATA === MAP_CATALOG`, so the reference is identical).

- **Pure resolver, PIXEL units.** `geographicEncounterContext(regionId, worldPxX,
  worldPxY)` → `{ regionId, mapId, encounterPool } | null`. It composes existing
  authorities only (`REGIONAL_LAYOUT` placement + `mapIdForChunk` + `MAP_CATALOG`
  via `mapEntryForId`) — it adds no encounter table, consumes NO randomness, and
  mutates NO runtime state. The pool comes straight from the canonical catalog entry
  (may be `null` where a placed map legitimately has none — never invented). Missing
  chunk / documented void / sparse hole / off-region / negative / non-finite point →
  `null` (**fail closed**). Physical map id is the authority; `OUTDOOR_CONTENT_KEYS`
  / `npc.map` / `'overworld'` are never consulted, so `MAP`, `MAP5`, and
  `RODDON_WAY_MAP` resolve independently despite sharing the `'overworld'` key.
- **Runtime selectors + ONE shared authority.** `playerStandingWorldPoint()` converts
  the player's centre (`player.x/player.y`) to region world pixels — the STANDING
  POINT, not footprint corners/camera/visible chunks. `regionalStandingEncounterContext()`
  is the resolver at that point. **Both are independent of Continuous View — the debug
  toggle must not determine encounter geography.** `regionalEncounterResolution()` is
  the single shared authority both the roll gate AND pool selection consult (never two
  competing copies): it returns `{ regional, ok, pool }` — nonregional (legacy);
  placed + resolved + agrees with the active map; or placed + unresolved/void/
  inconsistent. **Fail-closed protection lives in BOTH the eligibility gate and the
  pool selection, not only at the roll gate.** `currentEncounterPool()` (combat.js, the
  stable caller-facing API) keeps its special dungeon/sluice/vault branches exactly;
  for a placed regional map it returns the geographic pool when `ok` (behaviour-neutral,
  with the legacy `null → ENEMY_TEMPLATES` fallback), and the established empty no-pool
  result **`EMPTY_ENCOUNTER_POOL`** (a frozen empty array) when NOT `ok` — **never the
  stale `activeMap` pool**. Nonregional/unplaced maps keep the unchanged legacy
  `MAP_METADATA` fall-through. `startCombat()` treats an empty pool as "no encounter":
  it returns before selecting an enemy, so combat never activates and no enemy-selection
  randomness is consumed — so even a future *direct* `startCombat()` caller fails closed,
  not just the one roll site.
- **Only the standing-point chunk owns the roll.** The random-encounter roll stays
  at its single `update()` choke point at the same step cadence and `startCombat()`
  path. `encounterGeographyOk()` is an added AND-gate before `Math.random()`: on a
  placed regional map the standing-point chunk must resolve and agree with the
  active-map handoff invariant, else **fail closed (no encounter)** rather than
  rolling the wrong pool; nonregional maps (dungeon/sluice/vault/town/interior/
  meadow/bridge/special) return `true` and roll exactly as before. It consumes no
  randomness, so the `Math.random()` cadence is unchanged. There is no additional
  roll at a seamless handoff (`continuousSeamMove` rolls nothing), none from
  neighbour/visible chunks, none from the NPC simulation set, and none renderer-
  driven — the debug inspector (`render-ui.js`) only *reads* `currentEncounterPool()`.
  Crossing a seam changes the applicable pool only when the standing point belongs to
  the destination chunk and the normal physical handoff swaps `activeMap`.
- **Validation.** `validateEncounterGeography()` (pure) checks every placed map
  resolves from its own chunk centre back to itself with the exact canonical pool
  reference, and that void/sparse/unknown-region/invalid coordinates fail closed.
- **Limitation.** Encounter geography is per **physical chunk**; there are no
  sub-chunk encounter zones and no cross-seam pool blending yet.

## Interactions: `handleInteract()`, `SIMPLE_NPCS`, `MAP_FEATURES`

`interactions.js`'s `handleInteract()` (called when the interact key is
pressed) is checked in this priority order:

1. **Dialogue continuation** — if `dialogue.open`, advance it; when the last
   page closes, `finishDialogue()` runs the next queued callback and then
   dispatches at most one queued encounter, and we return; nothing else in this
   list runs on the same press. Fights are queued generically with
   `queueDialogueEncounter(id)` (sets `dialogue.triggerEncounterId`); a single
   `ENCOUNTER_HANDLERS` table maps each id to its `start*Combat()` function, and
   the id is cleared before combat starts so a repeated press can't re-fire it.
   (There are no per-fight `trigger*Combat` booleans — that was the old model.)
2. **Named location handlers.** `handleInteract()` is a priority orchestrator
   over two dispatch tables — `INTERACT_HANDLERS` (top-level) and
   `OVERWORLD_INTERACT_HANDLERS`. The **first** entry whose `match()` returns
   true gets to `run()`, and no later entry runs, exactly reproducing the old
   else-if dispatch (locations are mutually exclusive; first match wins). Each
   handler is the hand-written behaviour for one map/building — chests,
   quest-object encounters, boss triggers, town-specific scripted dialogue, and
   (inside the relevant handler) `interactSimpleNPCs()` (which checks every
   `SIMPLE_NPCS` entry whose `.map` matches `currentContentLocationKey()`, opening either a
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

**Location context is a *second* registry, not a hand-list in `save.js`.** The
map-`mode` fields (`inDungeon`, `inTown`, house/bridge/sluice context, …) are
owned by `LOCATION_STATE_BINDINGS` (`world-transitions.js`; see "The canonical
transition boundary"). `saveGame()` writes them via `serializeLocationState()`
(plus `activeMapId` — the active map is not a binding — via `mapRegistryId()`,
and `dilemma_voss` separately, as non-location data). `loadGame()` **preflights
the entire location restore before mutating any runtime state** (not just
location — also stats, quests, and session markers): `deserializeLocationState()`
rebuilds a complete candidate, legacy pre-`activeMapId` saves derive their map
from the mode flags, any compatibility repair (e.g. clearing stranded
`inBridgePost`) runs on the *candidate*, then `validatePlacement()` (map/coords/
bounds/base-walkable/facing) and `validateLocationState()` (the invariants) must
both pass. Unknown `activeMapId`, malformed/out-of-bounds/blocked player
placement, an invalid `houseSourceMapId`, or a broken invariant make the load
**return `false` with the running game and the stored save both untouched**. Only
once valid does it commit the location atomically via `applyLocationState()` — no
per-field restore assignments remain.

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
callable `get`/`set`, and no getter throws. (The old migration-coverage check is
gone — v4 has no migration path.) There is no longer a maintained reverse-direction
copy of the synced-flag list to keep in step.

### Save version 4 — a clean break, no migration, never deleted

`SAVE_VERSION` is the on-disk format number (currently **4**). v4 introduced the
discriminated location representation (see "Canonical regional world position"
above) and is a deliberate **clean break**: there are no pre-v4 saves in the wild,
so there is **no migration path and no backward compatibility**. The
`SAVE_MIGRATIONS` registry is retired (kept only as historical reference; nothing
consults it) and `migrateSave(parsed)` now accepts **only** the current version —
it validates the payload is object-like with `version === SAVE_VERSION` and returns
`{ ok: true, data, migratedFrom: null }`, else `{ ok: false, reason }`.

`loadGame()` calls it and, on `ok: false`, **warns and returns `false`, leaving the
save on disk untouched** — malformed JSON, an unversioned save, and *any* non-current
version (older v1/v2/v3 or a future version) are all rejected cleanly and
non-destructively. A save is never silently deleted, and no versioned backup files
are written (that path only ran on a successful migration, which no longer happens).

### Stable identity — pickups, chests, and enemy templates (v3)

**Every persistent placed pickup, openable chest, and enemy template carries an
authored, immutable `id`.** IDs are lowercase, category-prefixed snake case —
`pickup_<snake>` / `chest_<snake>` / `enemy_<snake>` — developer-facing (never
shown to the player), and **never derived at runtime** from array index,
coordinates, display name, or registry order. The id lives *on the object*, so
moving a pickup, reordering an array, or renaming an enemy's display `name`
never changes its id. **Once an id has shipped in a save, it must never be
renamed or reused for a different entity without an explicit migration** — a
stored id string is a permanent contract, even if the object later moves (an id
containing a location hint keeps that literal string regardless).

Three runtime registries key those objects by id (all in `data.js` except the
enemy one, which is in `combat.js` because scripted templates live there):

- **`PICKUP_REGISTRY`** — *discovered* by walking `MAP_METADATA.items` (the
  authoritative per-map content list), so it's complete and dedupes an array
  reachable under two names (`DUNGEON3_ITEMS === DUNGEON3_TC_ITEMS`) or via two
  metadata keys. Shops, `ITEM_REGISTRY` definitions, chest rewards and combat
  items are never here. 47 pickups.
- **`CHEST_REGISTRY`** — built from the explicit `OPENABLE_CHESTS` list (the one
  registration path: add a chest there + give it an id). Only *ordinary openable
  chests* (`.opened` boolean). 9 chests. The player-house stored-gold container
  (a value, not open/closed), dresser `.looted`, and sparkle `.taken` are
  **not** chests — they keep their own direct save fields.
- **`ENEMY_TEMPLATE_REGISTRY`** — every pooled template, every scripted/special
  template, and the runtime-inline "23" (a descriptor, since it's generated with
  random stats). Combat clones a template with `{ ...t }`, which carries `id`
  through to `combat.enemy`, so two identically-named records (the male/female
  Mire Toads, and several cross-pool duplicates like Silt Crab) stay
  distinguishable. 53 templates across 45 distinct display names. **The stable
  `id` is the sole runtime identity of an enemy** — see the next section.
- **`ENEMY_TEMPLATE_POOLS`** (combat.js) — the **sole authoritative inventory of
  random encounter pools**, an array of `{ id, label, templates }`. Each `id` is
  a stable, authored `pool_<snake>` handle (never derived at runtime from the
  label, source variable, `MAP_METADATA`, array order, or the enemies inside);
  `templates` is the actual pool array that `currentEncounterPool()` /
  `MAP_METADATA.encounterPool` hand out, order and spawn-weight repetition
  preserved; one distinct array is one entry. This registry is the *single* pool
  list in the codebase: both `validateEnemies()` and `test/balance-report.js`
  read it directly (id-referenced), so **a pool registered here is picked up by
  validation and the balance report automatically — there is no second list to
  keep in sync.** `validateEnemies()` cross-checks it against
  `MAP_METADATA.encounterPool` both ways (a live map spawning from an
  unregistered pool errors; a registered pool no map routes to warns as
  unreachable), and the balance report gives every registered pool a scenario —
  curated or a default auto-coverage run — so a new pool can never silently
  vanish from either tool. A repeated template (same object, for spawn weight or
  shared across pools) is **not** a duplicate-id error; only two *distinct*
  records claiming one id is.

**v3 save shape.** `saveGame()` writes `collectedPickupIds` (ids whose pickup is
`picked`) and `openedChestIds` (ids whose chest is `opened`) — sorted,
duplicate-free arrays — and **no** positional pickup arrays or per-chest
`.opened` fields. `loadGame()` first *resets* every registered pickup to
uncollected / chest to closed, then applies the saved id arrays; a registered
object absent from the arrays keeps its reset state (it never inherits the
current session's value). An **unknown id** (content temporarily missing or
retired) is warned about, kept in an internal unresolved set so a later save
doesn't erase it, and never applied to gameplay.

**v2→v3 migration snapshots.** `SAVE_MIGRATIONS[2]` maps the exact legacy v2
fields to ids using two **frozen** tables in `save.js` — `LEGACY_V2_PICKUP_FIELDS`
(legacy field → ids in v2 index order) and `LEGACY_V2_CHEST_FIELDS` (legacy
field → id). These are *migration history, not the runtime source of truth*:
never change or reorder them after shipping, even if the live arrays are later
reordered (that independence is the whole point). A legacy `true` beyond the
snapshot's known length is a meaningful value with no mapping — the migration
*throws* (so `migrateSave` fails safely and the save is left untouched) rather
than silently discarding it. After conversion the obsolete positional/per-chest
fields are removed from the v3 payload.

### Enemy identity is the stable id — sprite, Observe, and behaviour dispatch

**`enemy.id` is the sole runtime identity of an enemy; `enemy.name` is
presentation only.** Renaming a template's player-facing `name` never changes
its battle sprite, its Observe/combat lore, its special combat behaviour, its
scripted-encounter behaviour, or any victory/defeat/reward/quest handling. Every
enemy that enters combat carries a registered stable id: pool rolls, scripted
setups, and the Pale Sentry all clone via `{ ...TEMPLATE }` (which copies `id`),
and the runtime-inline "23" sets `id: 'enemy_23'` explicitly.

All identity-dependent dispatch keys on the id:

- **Battle sprite** — `render-battle.js`'s `ENEMY_SPRITE_DISPATCH` maps each
  template id to `{ draw, dy }` (the dedicated draw function + its vertical
  offset). `drawBattleEnemy()` looks up `combat.enemy.id`, never the name.
  Several ids that share one look (the three Marsh Wisp variants, gallery/vault
  Pale Drowned, male/female Mire Toad, …) map to the same entry. 52 of the 53
  ids have a dedicated sprite; the remaining one (`enemy_takomo`) is listed in
  **`ENEMY_GENERIC_SPRITE_IDS`** — an *explicit, id-safe* opt-in to the generic
  silhouette (`drawBattleGenericEnemy()`). An enemy that reaches combat with a
  missing or *unregistered* id is not silently rendered generic: it logs a
  developer-facing `console.warn`. An id must be in **exactly one** of
  `ENEMY_SPRITE_DISPATCH` or `ENEMY_GENERIC_SPRITE_IDS`.
- **Observe / lore** — `combat.js`'s `ENEMY_OBSERVATIONS` is keyed by id;
  `getObservationText()` looks up `enemy.id`. Shared-identity ids are aliased
  onto one authored entry via a small block below the literal. (The two Mire
  Toad ids deliberately go through the separate `enemy.sex` Observe branch — a
  gameplay *property*, not a name.)
- **Special combat behaviour** — the id-keyed status/message branches in
  `combat.js` (`enemy_corpse_slug`/`enemy_shade_wraith` slither-on-hit,
  `enemy_fen_witch` poison, the `enemy_mire_toad_*` poison flavour, the
  `enemy_den_wraith` curse flavour, the `enemy_tallyman`/`enemy_swamp_donkey`
  intro lines). Scripted-encounter *context* (which fight this is — boss,
  warden, fort-Polwick, …) is still tracked by the explicit `combat.is*` flags
  set at spawn; those are encounter state, not name-derived identity, and are
  already id-safe.

`validateGameData()` enforces the whole contract: malformed/duplicate/missing
ids, runtime-reachable templates absent from the registry, registry entries that
don't resolve, every registered id resolving to exactly one of sprite/generic,
sprite/generic/Observe entries pointing only at registered ids, and a guard
against name-keyed battle-sprite dispatch (`BATTLE_SPRITE_NAMES`) being
reintroduced. The remaining `enemy.name` uses in combat are all presentation:
message strings (`A … appeared!`, defeat/attack/brace lines) and the combat-UI
name plate.

### Adding, moving, renaming, or retiring a pickup / chest / enemy

- **Add a pickup**: put the object in the map's `_ITEMS` array (reachable via
  `MAP_METADATA.items`) with a fresh `id: 'pickup_<snake>'`. That's it —
  discovery + save/load are automatic. Do **not** add it to
  `LEGACY_V2_PICKUP_FIELDS` (it never existed in a v2 save).
- **Add an openable chest**: give it an `id: 'chest_<snake>'` and list it in
  `OPENABLE_CHESTS`.
- **Add an enemy template**: give it an immutable `id: 'enemy_<snake>'`; it's
  picked up by the registry automatically if it's in a pool or in
  `ENEMY_SCRIPTED_TEMPLATES`. Then wire its **id** into the presentation
  dispatch: add a `draw` entry to `ENEMY_SPRITE_DISPATCH` (or opt into the
  generic silhouette via `ENEMY_GENERIC_SPRITE_IDS`), and, if it has bespoke
  lore, an `ENEMY_OBSERVATIONS[id]` entry. `validateGameData()` errors if the id
  resolves to neither a sprite nor the generic set. A scripted (unpooled)
  template also lands in the balance report automatically — the report derives
  its scripted-enemy set from registry templates that aren't pool members, so no
  balance-report edit is needed to cover it.
- **Add a random encounter pool**: register the array in `ENEMY_TEMPLATE_POOLS`
  (combat.js) as `{ id: 'pool_<snake>', label, templates }` with a fresh
  immutable id, and route a map/floor to that same array via
  `MAP_METADATA.encounterPool`. Both `validateEnemies()` and the balance report
  then pick it up with no further edits. To measure a pool at a specific player
  state, add a scenario (referencing its `pool_<snake>` id, never the array) to
  `POOL_SCENARIOS` in `test/balance-report.js`; otherwise it gets a default
  auto-coverage run. **Never** rename or reuse a shipped `pool_<snake>` id.
- **Move / re-place** any of them: change coordinates freely — the id is
  unchanged, so existing saves still resolve it.
- **Rename the display `name`**: fine — `name` is player-facing, `id` is not.
- **Retire** an entity: removing it leaves old saves carrying an id the registry
  no longer knows; that id is preserved (unresolved) and simply does nothing.
- **Never** rename or reuse a shipped `id`, or reorder a `LEGACY_V2_*` snapshot —
  either silently corrupts existing saves. `validateGameData()` catches missing/
  duplicate/misformatted ids, placements with no id, and snapshot ids that don't
  resolve.

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

As of the last full pass: **0 errors, 4 warnings** across 101 maps, 24,240
tile cells, 171 NPCs, 112 item placements, 53 enemy templates, 63 map
features, and the rest — see `PROJECT_STATUS.md` for what those 4 warnings
actually are (all intentional, nothing newly introduced).

**Battle-sprite coverage is now fully checked by id** (previously an accepted
gap). `validateEnemies()` iterates the whole `ENEMY_TEMPLATE_REGISTRY` — which
contains scripted/boss templates and the inline "23", not just the pooled
`*_ENEMY_TEMPLATES` arrays — and requires every registered id to resolve to
exactly one of `ENEMY_SPRITE_DISPATCH` (bespoke art) or
`ENEMY_GENERIC_SPRITE_IDS` (intentional generic silhouette). A new scripted-boss
enemy added the unpooled way therefore *is* caught: if its id has no sprite and
isn't opted into the generic set, `validateGameData()` errors. No manual
render-battle.js check is needed anymore.

`validateEnemies()` also owns the **enemy-pool registry** as its sole pool
inventory: it iterates `ENEMY_TEMPLATE_POOLS` (`{ id, label, templates }`)
directly — no hand-maintained list of `*_ENEMY_TEMPLATES` names anymore — and
checks pool-id format/uniqueness, one-array-per-id, non-empty pools, member
registration, and the `MAP_METADATA` reachability cross-check both ways. This is
the same registry `test/balance-report.js` consumes, so the linter and the
balance report can never disagree about which pools exist.

## Debug tools

- **Debug menu** (backtick key, `debugMenu` in `state.js`, always reachable
  regardless of `debugMode`'s value, drawn by `render-ui.js`'s
  `drawDebugMenu()`) — 8 rows: No Enemies / Poison / Muddied / Slither
  (toggles), Heal Full / Day +1 (actions), Warp to... (opens the warp
  menu), Validate Data (runs `validateGameData()`, shows a toast summary,
  full report to console).
- **Debug map inspector** (`I` key, `debugInspector` in `state.js`, a
  non-modal always-updating HUD overlay, doesn't block movement/input) —
  shows current map id/display name/region/type, tile-unit position and
  facing, current tile id/name/walkability/encounter-eligibility, tile
  category/tags/flags (from `TILE_PROPERTIES`), current encounter pool,
  nearby point/edge transition info, and `MAP_FEATURES` info (feature count
  on the map, nearby inspectable, active trigger zone).
- **Debug warp menu** (reached from the debug menu, `warpMenu` in `state.js`) —
  pick a **logical destination** from the catalog in `debug-warp.js`, then nudge a
  target tile coordinate; `debugWarpToDestination()` clamps out-of-bounds
  coordinates, nudges onto the nearest walkable tile if the exact spot is blocked,
  preflights placement + location-state invariants, then commits through the
  canonical `transitionToLocation()`. Key points, and the reason this file exists:
  - **A physical map id is not always a complete logical destination.** A shared
    grid backs many logical places (`HOUSE_INTERIOR_MAP` = every house,
    `SMALL_APARTMENT_MAP` = every apartment unit, `APARTMENT_CORRIDOR_MAP` = the
    Calwick + six Drenwick apartment corridors), and most non-outdoor maps need a
    specific runtime *mode* (`inDungeon`+`dungeonFloor`, `inTown`+`townBuilding`,
    `inSluice`+`sluiceFloor`, `inBridgePost`+…). So each destination carries the
    exact location-state overrides its canonical `enter*()` wrapper establishes —
    the **authoritative source is runtime behaviour, not `MAP_CATALOG.type` or the
    display label** (e.g. the tavern's furniture gate needs `townBuilding: 'tavern'`
    even though its name/key key off `activeMap`).
  - **Outdoor destinations are derived** from `MAP_CATALOG` (`type === 'outdoor'`)
    with neutral state; every non-outdoor destination is authored. **Reusable
    physical maps have multiple destinations** (distinct `currentHouseId` + return
    context). The list is **outdoor-first**, then town / interior / dungeon /
    special, sorted by label then id.
  - **All warps preflight and commit through `transitionToLocation()`** — no
    location flag is ever assigned directly, and the `enter*()` wrappers'
    story/NPC side effects (guard resets, `travellerPresent`, quest flags, patrol
    resets) are deliberately NOT run. A warp performs no quest/dialogue/reward/
    combat/inventory/day side effect.
  - **Unsupported locations are never entered partially.** There is no
    "successful but incomplete" warp: an unknown/disabled/malformed/invalid/
    unwalkable destination returns failure and leaves `activeMap`, the player,
    the encounter cooldown, and every location field untouched (the menu stays
    open). If a physical map can't be represented safely it is omitted or shown
    disabled with a reason, never guessed.
  - The old map-only `debugWarpToMap()` (`world-transitions.js`) is retained but
    **restricted to unambiguous outdoor maps** (neutral state); it refuses any
    non-outdoor map id and points the caller at `debugWarpToDestination()`.
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
  in its own fresh context; currently 53 tests, all passing.
- **`test/transition-audit.js`** — a standalone, exhaustive sweep: calls
  every real `enter*`/`exit*`/`ascend*`/`descend*` transition function live
  and checks the landing spot against the game's own collision logic
  (bounds + walkability), cross-references every `flatFns`-listed
  transition against `transitionTileNames`, and checks house doors and
  tile-constant references. Also wired into the main suite as one of the
  53 tests (`10-transition-audit`), which additionally asserts the audit's
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
- **`RENDERABLE_TILE_IDS` and `ENEMY_SPRITE_DISPATCH` are hand-maintained,
  not derived** — adding a tile `case` to `drawTile()` without also updating
  the matching Set, or a new bespoke enemy sprite without adding its **id** to
  `ENEMY_SPRITE_DISPATCH` (or `ENEMY_GENERIC_SPRITE_IDS`), means
  `validateGameData()` will report a "not renderable" / "no battle sprite"
  finding (an *error* for an enemy id in neither table). Dispatch is by stable
  enemy id, never by display name.
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
   Example: `let inDungeonEntrance = false;` (state.js). Then add it to
   `LOCATION_STATE_BINDINGS` (`world-transitions.js`) with its neutral default,
   so `resetLocationState()`/`transitionToLocation()` (and debug warp and the
   transition-audit reset) all clear it automatically — this is what makes the
   "don't hand-clear other flags" rule in step 8 safe.
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
   (floor 1 → hall). Each is a thin wrapper that calls
   `transitionToLocation({ mapId, x, y, facing, state, cooldown })` (see "The
   canonical transition boundary" above) — you supply **only** this area's own
   non-neutral location state (e.g. `state: { inX: true }`, or a dungeon
   floor). **Do NOT hand-clear the other `inX` flags** — the helper resets all
   location state to neutral first, so a transition can no longer forget to
   clear an incompatible flag (the class of bug this boundary exists to
   prevent). Add the new `inX` field to `LOCATION_STATE_BINDINGS` in the same
   file so it's part of that reset. Keep any story/quest/dialogue side effects
   in the wrapper, around the `transitionToLocation()` call.
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
11. **`currentContentLocationKey()` / `locationName()`** (`movement.js`) — one line each,
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
    string `currentContentLocationKey()` returns for the area — no special-casing needed
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
- [ ] `currentContentLocationKey()` and `locationName()` lines in `movement.js` (skip
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
  `autoStart: true`) the frame its NPC's `map` equals `currentContentLocationKey()`, and
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
  `currentContentLocationKey()` update. Off-map NPCs never accumulate route progress.
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
