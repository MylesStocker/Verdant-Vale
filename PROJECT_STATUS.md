# Project Status Checkpoint

Browser JRPG, plain `<script>` tags, no build step. This is a
snapshot, not a full report — see `architecture.md` for how everything
actually fits together.

## Current state

Playable start-to-endgame content across Calwick, Drenwick, the fen
wilderness, the South Ruins dungeon (10 floors, including a horror branch),
East Sluice (3 levels **plus the hidden Sealed Room — see the newest pass
below**), Mirethyst's Vault, the hidden meadow (Verdant Vale NW nook), and
the newer North Basin region (now 5 maps: South Approach, Reservoir, Silt
Flats, West Shore, and the Upper Reach — plus the unmarked chamber and the
Sunken Gallery hanging off the Upper Reach, see the newest pass below).
Every link *between* North Basin maps uses `EDGE_TRANSITIONS` rather than
point-tile doors (the region's entry from Drenwick is still a point-tile).
114 registered maps total in `MAP_REGISTRY`/`MAP_METADATA` (kept in exact
agreement by `validateGameData()`). Of those 114 IDs, 24 are the generated
Sunken Gallery grid rooms (`SUNKEN_GALLERY_R#C#`); the remaining 90 are the
individually-authored base maps. (Earlier notes here said "77 registered
maps" — that was the base-map count, from before the Sunken Gallery grid
rooms were added to the registry.)

- **Continuous regional overworld is the production default.** The scrolling
  camera, seamless eligible-edge movement, neighbouring-chunk content, regional
  NPC simulation, geographic encounters, and world-aware cross-seam interactions
  are the normal behaviour on placed `'continuous'` regional chunks — with **no
  debug mode and no toggle**. Presentation is chosen by canonical location + chunk
  metadata (`continuousWorldViewActive()`, the single shared choke point): a
  `legacy_screen` chunk (only **Verdant Vale / MAP**, deliberately fixed-screen), a
  discrete/nonregional map, or a broken canonical invariant falls back to the legacy
  single-screen path. The one manual control is a session-only debug fallback,
  `[ Legacy Regional Fallback ]` (`forceLegacyRegionalView`, default OFF, never
  saved), which forces coherent legacy behaviour for comparison/recovery. Geographic
  encounters and canonical position do not depend on presentation mode. Verified
  render bound: ≤ 4 visible chunks and ≤ `17×16 = 272` tile draws per 512×480 frame
  (chunk-indexed, no double-draw); **browser frame-time profiling still pending**.
- **27 regional chunks** now occupy the `'overworld'` 5×6 envelope (3 sparse void
  cells remain). Seven of them are **inaccessible scenery only** (`playerAccessible: false`):
  they render as neighbour terrain but no seam/border/transition lets the player in, and the
  shared placement authority (`mapPlayerAccessible()` via `validatePlacement()` +
  `commitRegionalWorldPosition()`) fail-closes every warp/transition/save/canonical
  placement; none owns items/NPCs/encounters:
  - **Drenwick West Outfall** (`DRENWICK_WEST_OUTFALL_MAP`, chunk (1,3)) — a drought-exposed
    canal settling ground with a static culvert decoration; the surface water enters a buried
    culvert beneath the western ridge, continuing underground toward the coast.
  - **North Basin Open Reservoir** (`NORTH_BASIN_N_MAP`, chunk (2,0)) — the deep open water
    NORTH of the receding reservoir (`NORTH_BASIN_C_MAP`), ~94% WATER with two small
    BASIN_MUD/TREE islets; only existing terrain types.
  - **North Basin Open Reservoir (East)** (`NORTH_BASIN_NE_MAP`, chunk (3,0)) — the reservoir
    continuing east of `NORTH_BASIN_N_MAP`, same style; its west edge exactly mirrors
    `NORTH_BASIN_N_MAP`'s east edge; north/south/east stay open-water borders.
  - **North Basin Open Reservoir** (`NORTH_BASIN_NE2_MAP`, chunk (4,0)) — the reservoir
    continuing east of `NORTH_BASIN_NE_MAP`; its west edge exactly mirrors that chunk's east
    edge, while its north/east borders remain open water and its south edge matches the East
    Shore reservoir scenery.
  - **North Basin Eastern Woods** (`NORTH_BASIN_E_MAP`, chunk (3,1)) — south of the Open
    Reservoir East: top half almost all WATER, bottom half almost all forest (TREE). Its north
    edge mirrors `NORTH_BASIN_NE_MAP`'s south edge and its west edge mirrors
    `NORTH_BASIN_C_MAP`'s east edge; its forested south edge is blocked against the
    playable South Reservoir Road.
  - **North Basin Open Reservoir (East Shore)** (`NORTH_BASIN_E2_MAP`, chunk (4,1)) — south
    of the Far East reservoir and east of the Eastern Woods; its north/west edges exactly
    mirror those nonwalkable neighbours; east remains reservoir scenery and south is a
    blocked exact match against East Causeway.
  - **Thornmere — Upper Shallows** (`THORNMERE_UPPER_SHALLOWS_MAP`, chunk (4,4)) —
    90% open WATER scenery east of Northern Thornmere Fen and north of Thornmere
    Shallows. Three sparse REEDS/TREE remnants break up the water; the explicitly
    agreed southwest REEDS corner is the sole mismatch against both neighbouring
    edge sequences. No transition or content enters the chunk.

  The new accessible **North Basin — South Reservoir Road** (`NORTH_BASIN_SE_MAP`,
  chunk (3,2)) continues the South Approach road east through a reciprocal rows 7–8
  continuous seam: a REEDS shoulder widens the entrance while the PATH road remains
  one tile wide on row 8. The irregular GRASS/REEDS fen uses the harder `upper_reach`
  encounter profile, and there is no southbound road. Its north boundary remains
  blocked; a new reciprocal `[6,10]` east seam carries the one-tile row-8 PATH and
  four REEDS shoulders into East Causeway. Its broad south edge enters only the
  northern bank of Eastern Canal Banks.

  The accessible **East Causeway** (`EAST_CAUSEWAY_MAP`, chunk (4,2)) continues
  that road into the Eastern Reaches through a broad five-tile fen opening. Its
  western 73 walkable cells form one component, while ordinary mud/stone subsidence
  and WATER completely interrupt the road from column 11 eastward. The present
  blockage is deliberately terrain-only: reopening it later requires only terrain
  replacement and an east seam, with no quest flag, save state, or movement rule.

  The accessible **Eastern Canal Banks** (`DRENWICK_EAST_CANAL_MAP`, chunk (3,3))
  continues the Drenwick canal straight east with uninterrupted WATER across row 5.
  Its GRASS/REEDS fen has exactly two disconnected walkable components. The broad
  north seam is `[1,14]`; the west edge has independently seamless north-bank
  `[1,4]` and south-bank `[6,13]` ranges, leaving canal row 5 blocked. It uses the
  existing `far` profile / exact `FAR_ENEMY_TEMPLATES` reference on both banks. No
  PATH, bridge, NPC, item, quest, interaction, landmark, or decoration is authored.
  Its corrected east shoreline is `T W R R R W R R R W T W T W T`; reciprocal
  `[2,4]` and `[6,8]` REEDS openings now enter Canal Head without joining its banks.

  The accessible **Thornmere — Canal Head** (`THORNMERE_CANAL_HEAD_MAP`, chunk
  (4,3)) is a broad-water lake outlet where the uninterrupted row-5 canal widens
  directly east into Thornmere. Its two disconnected 10-cell REEDS shoreline
  shelves occupy only columns 0–3, use the existing `thornmere` profile / exact
  `THORNMERE_ENEMY_TEMPLATES` reference, and leave north/east/south nonwalkable.
  The south edge matches Upper Shallows exactly; no transition enters that scenery.

  The accessible **Northern Thornmere Fen** (`THORNMERE_NORTH_FEN_MAP`, chunk
  (3,4)) extends the south bank into a one-component rough fen loop joining
  Northern Fen and Thornmere. It uses the existing `thornmere` profile and has
  broad north `[1,14]` and west `[1,13]` seams plus split Thornmere shoreline
  ranges `[1,2]` and `[13,14]`. A broad irregular WATER inlet penetrates from
  the east into the now-authored inaccessible Upper Shallows; its WATER/TREE
  boundary remains entirely blocked. No PATH, item, NPC, quest, interaction,
  building, landmark, decoration, point crossing, or compatibility alias exists.

  Audit: 108 directed physical edges → ALIGNS 42 / BORDER 22 / BLOCKED 40 /
  INTENTIONAL_DISCRETE 4. Continuous eligibility counts segment entries instead:
  48 directed entries / 24 reciprocal segment pairs. See architecture.md
  "Scenery-only (inaccessible) chunks" and "Continuous seams".
- **100 tests** (`test/cases/01-…100-`), `node test/run.js` — all passing.
- **Transition audit**, `node test/transition-audit.js` — reset-state
  isolation pass, 114 maps, 238 fixed-destination transitions, 8
  preserved-coordinate transitions, 42 house doors (0 problems), 49 tile
  constants cross-referenced — clean, no findings.
- **`validateGameData()`** (call from the browser console or the debug
  menu's "Validate Data" row) — **0 errors, 4 warnings**, all intentional
  (see below), across 114 maps, 114 metadata entries, 27,360 tile cells, 128
  edge transitions, 177 NPCs, 114 item placements, 105 enemy templates, 610
  dialogue/text entries, 180 save-flag checks, 63 map features, 73 pickup ids,
  19 chest ids.

## The 4 current warnings, and why none needs fixing

1. **`NOTICE_BOARD` is `isDecorative` and walkable** (`Tile Properties`
   group) — intentional, documented in `TILE_PROPERTIES`'s own `notes`
   field: it's a stand-in-front-of-it interactable, not a blocker, unlike
   most decorative tiles.
2. **`Takomo` has no dedicated battle sprite** (`Enemies` group) — a real,
   long-standing gap that was previously invisible: the old `validateEnemies()`
   only checked pooled templates + Pale Sentry, so scripted bosses like Takomo
   were a blind spot. The #4 enemy-template registry now structurally checks
   every template, which correctly surfaces that Takomo falls back to the
   generic battle sprite (`drawBattleGenericEnemy()`). It renders fine; giving
   it a bespoke sprite is a deliberately separate art task (out of scope for the
   identity/validation pass), so the warning is left as an honest TODO.
3. **One dialogue line (`npc.student_a1`) is 549 characters** (`Dialogue`
   group) — the renderer word-wraps it fine; flagged only because it's a
   genuine outlier against the rest of the game's dialogue (median ~57
   chars). Cosmetic, not broken.
4. **One apartment description line (`npc.apt_desca`) is 346 characters**
   (`Dialogue` group) — it likewise word-wraps correctly and is only flagged
   for being longer than the validator's review threshold.

(The ten pooled enemy templates that once warned for missing sprites — Hollow,
Fen Shade, Tomb Sentry, Crypt Revenant, Wall Tendril, Dripping Maw, The Seep,
Pale Drowned, Silt Hag, Pale Sentry — all got bespoke sprites earlier; and the
old "scripted/boss enemies validateEnemies structurally can't see" blind spot is
now gone — the #4 registry checks them all, which is exactly how Takomo's gap
finally became visible.)

## Recently completed infrastructure (this development arc)

In roughly the order built:

1. **North Basin region** — 4 new maps (South Approach, Reservoir, Silt
   Flats, and the Badlands skeleton — since fleshed out and renamed
   West Shore, see the content pass below), the region's first real
   random-encounter content (Silt Crab, Mudflat Strider).
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
8. **Quest-flag save binding registry + versioned migration** (`save.js`) —
   replaced the hand-maintained `QUEST_FLAG_SCHEMA` string list and the
   ~85-line manual `loadGame()` restore block with a single authoritative
   `QUEST_FLAG_BINDINGS` registry (key / default / get / set / lexical-vs-
   window kind per flag). `QUEST_FLAG_SCHEMA` is now *derived* from it, and
   `saveGame()`/`loadGame()` read/write the registry generically (missing
   fields fall back to declared defaults, never to current-session state).
   Added a real `SAVE_VERSION`=2 layer: a per-step `SAVE_MIGRATIONS` registry
   and `migrateSave()` coordinator that upgrades an old (v1) save forward,
   backs the original up under `verdantVale_save_backup_v1` (never
   overwritten) and rewrites the normal key to v2 — while **never** deleting a
   save it can't understand (malformed / future / unversioned / missing-step
   all return false and leave the file on disk untouched). `validateSaveFlags()`
   now checks the registry structurally instead of a copied list. Covered by
   the new **test 51**. See `architecture.md`'s "Save/flags" section.
9. **Stable identity for pickups, chests, and enemies + version-3 save**
   (`data.js`/`maps.js`/`combat.js`/`save.js`) — every persistent placed pickup
   (47), openable chest (9) and enemy template (53 = 40 pooled + 12 scripted + 1
   inline "23") now carries an authored, immutable id (`pickup_`/`chest_`/`enemy_`
   `<snake>`). Runtime registries: `PICKUP_REGISTRY` (discovered from
   `MAP_METADATA.items`), `CHEST_REGISTRY` (from `OPENABLE_CHESTS`), and
   `ENEMY_TEMPLATE_REGISTRY`; enemy clones into `combat.enemy` carry the id, so
   the two identically-named Mire Toads (and several cross-pool duplicates) stay
   distinguishable. `SAVE_VERSION` is now **3**: pickups/chests persist as
   `collectedPickupIds` / `openedChestIds` (stable ids), NOT array positions or
   per-chest fields, so reordering or adding a pickup never changes an existing
   save. A sequential `SAVE_MIGRATIONS[2]` converts v2 → v3 via frozen legacy
   snapshots (positional field → ordered ids; per-chest field → id); v1 saves run
   v1→v2→v3, backing up only the original source version write-once. Unknown ids
   are preserved (not erased) and never touch gameplay. New registry-driven
   pickup/chest/enemy validation (the enemy check removed the old special-enemy
   blind spot — which is how Takomo's missing sprite finally surfaced). That pass
   was identity + validation only; a later pass (**item 17**) makes those stable
   ids authoritative at runtime — combat/render/Observe dispatch now key on id,
   not name. One incidental fix: the Roddon Way potion (`pickup_roddon_way_potion`),
   previously omitted from persistence entirely, now persists like every other
   pickup. Covered by the new **test 52** (test 51 extended to the v1→v3 chain).
   See `architecture.md`'s "Save/flags" section.
10. **Canonical location-transition boundary** (`world-transitions.js`) — one
    authoritative `LOCATION_STATE_BINDINGS` registry of the ~25 mutable
    location-context fields (each with a neutral default + get/set), and one
    `transitionToLocation({ mapId, x, y, facing, state, cooldown })` helper that
    validates the whole destination (map/coords/facing/state-keys/invariants)
    then resets all location state to neutral, applies the destination's
    explicit overrides, moves the map, lands the player, and sets cooldown — all
    atomically (an invalid destination changes nothing). Every normal runtime
    transition (dungeon floors + rooms, sluice floors + Sealed Room, Sunken
    Gallery, towns/districts/buildings/houses/school stairs, bridge both ways,
    edge transitions, debug warp, defeat relocation) is now a thin wrapper over
    it that keeps only its own story side effects. **Debug warp and the
    transition-audit reset now share the registry** — no more hand-copied
    flag lists (the class of bug that once dropped `inBasinChamber`/
    `inSunkenGallery`). No save-format change (still v3, no migration), no
    player-visible change. Covered by the new **test 53**; the transition audit
    (25-field reset isolation, 236 fixed / 20 preserved / 42 door landings) all
    stays clean. See `architecture.md`'s "The canonical transition boundary".

Each of the above shipped with its own new/updated `test/cases/*.test.js`
file (23 through 26 cover the debug tools, tile properties, and map
features; 51 covers the save binding registry + migration; 52 covers stable
persistence ids; 53 covers the canonical location-transition boundary) and a
full `validateGameData()`/regression/transition-audit pass before being
considered done.

## Latest content & gameplay pass

Built on top of the infrastructure above; each item shipped with a regression
test update and a clean `validateGameData()`/audit pass.

1. **North Basin — West Shore** — the region's 4th map, previously the
   "Badlands" skeleton, fleshed out into the reservoir's west bank: an uneven
   eastern shoreline (the water edge ripples between roughly cols 11–14 rather
   than a straight vertical wall), a reeds/mud fringe, stranded waterline
   stakes, and a fisher's hut near the shore (reuses the `TRAPPER_HUT` tile —
   no fisher-specific tile added for one prop). 4 new `MAP_FEATURES`
   inspectables (fisher's hut, reservoir shore, waterline posts, west warning
   stakes). Its south link to the Silt Flats was the **last remaining North
   Basin point-tile transition** (tiles 90/91, `NORTH_BASIN_W_EXIT/ENTRANCE`)
   and is now an open `EDGE_TRANSITIONS` crossing (cols 1–10, x preserved;
   cols 11–14 stay border because the Silt Flats' reservoir finger, WATER,
   backs onto that side — an open edge there would soft-lock). Tiles 90/91 are
   now unused/dead: left defined (not formally retired in `TILE_PROPERTIES`
   like 84–87) as a conservative choice to stay off the tiles/rendering/
   movement machinery — safe to retire later. Renamed `data.js`/`MAP_REGISTRY`
   label Badlands → West Shore; test renamed `20-north-basin-badlands` →
   `20-north-basin-west-shore`.
2. **Burn status effect + Polwick's fire attack** (`state.js`, `combat.js`,
   `movement.js`, `render-battle.js`) — a combat-only damage-over-time status,
   **Burn**: a random 0–20 HP each turn with its own message line, cleared
   when the battle ends (it can't exist outside combat, so it needs no save
   persistence). Polwick — a firelit rareborn — now sometimes casts a fire
   attack when he lands a hit: extra scorch damage plus Burn, with a short
   fireball cast animation and a flickering `BRN` HUD tag. Polwick-only; no
   broad combat-balance change.
3. **Key items (`keyItem` flag)** (`state.js`, `combat.js`, `input.js`,
   `render-ui.js`, `render-entities.js`) — quest items flagged `keyItem: true`
   are filtered out of the equippable/usable/sellable inventory (via a shared
   `inventoryItems()` helper) while still shown in the notebook's Special Items
   section. Applied to the 2nd MainQuest's **Dispatch Letter** (was an
   equippable "accessory" — you could accidentally equip or sell the quest
   letter) and the new **Tweezers** item.
4. **Small content additions:**
   - **Rareborn spotting-rhyme** — a Calwick school child recites a
     hair-vs-eye-colour rhyme (canon: interesting *hair* colour signals a
     rareborn thread; interesting *eye* colour is purely cosmetic). A Drenwick
     school child starts the same rhyme and trails off if the player has
     already heard it (`rareborn_rhyme_heard` save flag; both children were
     previously filler-only).
   - **Abandoned Drenwick apartment** (`drenwick_apt_c1_u4`) — former resident
     (Ossian) removed; a searchable dresser (yields a Potion + Reed Remedy,
     once) and a floor sparkle that grants the **Tweezers** key item once.
     New save flags `abandonedAptDresserLooted` / `abandonedAptSparkleTaken`.
   - Player's-house window moved from the east to the north wall (cosmetic).

New save flags this pass: `rareborn_rhyme_heard`, `abandonedAptDresserLooted`,
`abandonedAptSparkleTaken` (all added to `QUEST_FLAG_SCHEMA`/`saveGame()`).

## Newest pass — main-story pacing + the East Sluice Sealed Room

1. **Post-MainQuest-3 rest week + reservoir assignment gate** — after Petra
   pays the fen post ticket (`MainQuest = 3`), the supervisor closes out the
   Polwick/Essa matter in outcome-aware wording (killed / reported /
   claimed-nothing — what he was *told*, via the new `fort_report_filed`
   flag, not what actually happened), orders the rest of the week off, and
   only offers the next main assignment (the drought-exposed reservoir bed
   north of Drenwick — a missing basin observer, and the supervisor plainly
   acknowledging the job is dangerous) from the first workday after the next
   Dayoff
   (`mq4_available_day = day + (5 - day % 5) + 1`). One main-story path in
   all three cases; the assignment sets `reservoir_quest_started` and
   `MainQuest` stays 3 until that quest (not yet built) completes. Notebook
   entries cover resting, returning, and the assignment. New save flags:
   `fort_report_filed`, `mq4_available_day`, `reservoir_quest_started`.
2. **East Sluice Sealed Room** — a hidden room now exists below the Deep
   Works. It is a **separate registered map, `SLUICE_SECRET_MAP`**
   ("East Sluice — Sealed Room", treated as `sluiceFloor` 4), reached only
   by walking through two `FALSE_WALL` tiles at Deep Works r7 c12-c13 (the
   east pocket's dead end) onto `SLUICE_SECRET_ENTRANCE` (tile 99, renders
   as plain sluice wall — deliberately zero indication); `SLUICE_SECRET_EXIT`
   (tile 100) returns to the pocket. The room contains **the Tallyman
   encounter** — `SLUICE_SECRET_ENEMY_TEMPLATES`, rolled at 1/64
   (`SLUICE_SECRET_ENCOUNTER_CHANCE`) via `inSluiceSealedRoom()`
   (movement.js/combat.js); atk 55 outclasses every boss, fleeing is the
   intended response — **and four related inspectables** on bespoke visible
   tiles 95-98: carved markings, eleven notches, an old blood stain, and an
   unsigned works clerk's journal (`MAP_FEATURES.SLUICE_SECRET_MAP`).
   **Lore boundary:** the room is deliberately unexplained (pre-war erasure
   tone); LORE.md was intentionally *not* updated and should stay untouched
   unless the room becomes story-important.
3. **Fenna's wine quest gate** — "A Bottle for Her Father" is now offered
   only at `MainQuest >= 2`; below that Fenna worries about the drought
   reaching the fen mushroom beds instead (seeding the quest's ingredients).
4. **Outdoor-map water edges (cosmetic)** — border TREE tiles were swapped
   to WATER where the adjacent interior tile is water or reeds (both tiles
   are impassable, so collision/encounters/transitions are untouched):
   MAP3 (north lake runs off the NW edge; south marsh drains off the
   bottom), MAP4 (the Thornmere opens off-map on the lower west/east and
   the whole south edge), MAP5 (open sea on all sides of the spit except
   the west landing), MAP3_N2 (the Drenwick canal now flows off both map
   edges instead of dead-ending into trees; the NE bog continues off-map
   under the causeway). Other outdoor maps keep tree borders — no interior
   water reaches their edges (and North Basin's dry edges are the drought
   story; the hidden meadow's tree ring is deliberate).
5. **Rest-week inn reactions** — on the Dayoff(s) between the fen post
   close-out and the reservoir assignment, the office staff at the Calwick
   inn get outcome-aware dialogue about the Polwick matter: Supervisor,
   Petra, and Corvin key on the filed report (`fort_report_filed` — they
   never magically know about an unreported kill), Esla keys on
   `smugglers_dead` itself (she closes the registry files, matching her
   office dialogue). Found-nothing playthroughs and post-assignment Dayoffs
   get the ordinary lines.
6. **Drenwick Dayoff closures** — `isClosedToday()` now covers
   `provision_store`; the Canal/Docks store door shows a closed notice on
   Dayoff instead of entering. The Drenwick school was already gated (same
   `isClosedToday('school')` as Calwick's); the inn/tavern deliberately
   stay open — Dayoff drinking is canon.
7. **Drenwick staff Dayoff relocation** — the office and school staff no
   longer vanish on Dayoff (`map: null`): Officer Veth, Holt, and Ms. Farne
   appear at the Drenwick inn, Officer Sable and Mr. Oben at the wash
   house, each with new off-duty dialogue (workday positions and dialogue
   untouched, including Veth's post-fort-quest commentary). Sable's old
   "absent on dayoff, coordinating northeast" comment was replaced — her
   new lines nod at it ("the Registry's northeast office doesn't answer on
   Dayoff either"). Test 30 sweeps the Dayoff inn/wash-house crowd for
   overlapping NPC positions.
8. **Daily office greetings** — the Supervisor and Esla open the player's
   first conversation of each day in the Calwick office with a
   "good morning" page (new save flags `supervisor_greet_day` /
   `esla_greet_day` record the last day each greeted). Implemented by
   prepending a page after the branch logic runs — safe because dialogue
   callbacks fire on the LAST page — via a thin `interactSupervisor()`
   wrapper around the renamed `supervisorDialogueBody()`, and at the Esla
   office block's single exit point (spread, not unshift: her rotation
   pages are shared array literals).
9. **The dream map (`DREAM_MAP`)** — the weekly strange dreams (rest in own
   bed, day % 7 === 3) now play with the player standing in a registered,
   all-white map: walkable `DREAM_FLOOR` (101) interior inside an invisible
   blocking `DREAM_EDGE` (102) ring (both tiles render identical pure
   white; the vignette overlay is skipped there so the white is total).
   `enterDream()`/`exitDream()` (world-transitions.js) stash and restore
   the waking world — map, position, facing, and the
   inTown/townBuilding/currentHouseId flags render.js keys its overlays on
   — with exitDream() wired as the dream dialogue's close callback. The
   stash is deliberately transient: the menu (hence saving) can't open
   during the dream dialogue. Movement is currently locked by the open
   dialogue, but the map is real and first-class specifically so the
   player can later walk around in it.
10. **Guild Hall furnished** — the Drenwick Guild Hall had NPCs (Foss,
    Cae) and a posting-board interact but rendered as a completely bare
    room: unlike every other Drenwick interior it had neither TABLE (33)
    blockers in its map nor a furniture overlay function. It now has both
    (`drawGuildHallFurniture()`, wired in render.js): north archive shelf,
    registrar's desk beside Foss, long members' table, and a visible
    freestanding posting board at r2 c13 — one tile north of the
    (unchanged) `GUILD_HALL_BOARD` reading spot, so the existing interact
    still works from where the player can actually stand (TALK_RADIUS 28 <
    a full tile). Also added Senna, a workday apprentice-post applicant
    planted in front of the board, echoing Ms. Farne's two-notices-where-
    there-were-nine placement lore.

11. **Calwick flavor pass + Basin Gull** — the starting town finally has
    environmental text: five new `MAP_FEATURES` inspectables (charter
    stone and public cistern on `TOWN_MAP`, water gauge and reed-drying
    racks on `EAST_TOWN_MAP`, a tenants' notice in
    `APARTMENT_CORRIDOR_MAP` — all Calwick-gated with the same
    `currentTownId` condition convention as the west survey marker, all on
    walkable street/grass/floor tiles clear of NPC/market/door
    positions). The cistern and gauge deliberately carry the drought
    story (three rainless months, "drought" now official, "same story up
    north"). Plus a third North Basin enemy, the **Basin Gull** —
    scavenger gull come inland for the die-offs on the exposed bed; hp 24
    / atk 14 / spd 12, same tier as its poolmates, with its own bespoke
    battle sprite (`drawBattleBasinGull()`, registered by id in
    `ENEMY_SPRITE_DISPATCH`). Test 34 covers all of it end-to-end.

12. **The Upper Reach, the unmarked chamber, and the Sunken Gallery** — the
    North Basin's 5th square (`NORTH_BASIN_NW_MAP`, north of the West Shore
    via a new cols-1-10 `EDGE_TRANSITIONS` crossing — the "one-line change
    later" the West Shore's row-0 border comment reserved) plus two areas
    hanging off it, both built on the full safe-entrance-area pattern (own
    flags `inBasinChamber`/`inSunkenGallery`, 8 new tiles 103–110):
    - **The Upper Reach** — the drained NW arm, exposed bed border to
      border, deliberately liminal: no NPCs, no encounters (structurally —
      note that REEDS are encounter-eligible game-wide, so the map uses
      BASIN_MUD everywhere including its open edge; a reeds border would
      have rolled generic-pool encounters). Saving IS allowed here
      (`allowSave: true` — see the audit-pass note below for why). 6
      `MAP_FEATURES` entries carry the wrongness (fence line across open
      water, a too-high waterline, a pool that won't ripple, first-entry
      narration).
    - **The unmarked chamber** (`BASIN_CHAMBER_MAP`) — through a
      freestanding doorframe (`CHAMBER_DOOR`, r3 c12; renders as clean
      masonry with a flat black opening — and stays flat black from every
      angle and from both sides, per the audit-pass fix below; nothing is
      visible through it in either direction). Perfectly square room,
      seamless surfaces, no vignette (render.js skips it like the dream),
      locationName "No Recorded Location". Saving is blocked here. Same
      lore boundary as the Sealed Room: deliberately unexplained, LORE.md
      untouched.
    - **The Sunken Gallery** (`SUNKEN_GALLERY_MAP`) — the drought-uncovered
      dungeon, down `SUNKEN_STAIR` (r9 c4). Half the hall still flooded;
      encounters via `MAP_METADATA.encounterPool` fall-through (zero
      combat.js changes) using `SUNKEN_GALLERY_ENEMY_TEMPLATES` — Pale
      Drowned/Silt Hag at their exact Mire Vault stats (same creatures,
      existing sprites). Saving is blocked here too. Bootless footprints
      walk out of the water and end at the stair — deliberately
      unresolved environmental strangeness, same register as the rest of
      this area; not documented anywhere as the missing basin observer or
      any other specific person/thing (see the audit-pass note below).
    - **First pass, two mechanics**: `MAP_METADATA.allowSave: false` was
      runtime-enforced for the first time (input.js save-confirm guard +
      a "The record won't hold here." banner) across all three new maps.
      A later audit pass (below) corrected this to just the two interiors
      — see that entry for the authoritative `canSaveHere()` version. The
      three first-entry narration onceFlags are the first *persisted*
      `MAP_FEATURES` flags: window-native flags in `QUEST_FLAG_SCHEMA`,
      normalized (never clobbered) by `syncQuestFlagsToWindow()`, restored
      via explicit `window.*` lines in `loadGame()`.
    Test 35 covers the whole chain: real-movement edge crossing both ways,
    structural silence, trigger once-firing, chamber worst-case-RNG
    no-encounter guarantee, gallery pool wiring + combat render, and (as
    extended by the later audit pass) save-allowed-on-the-Reach plus
    menu-level *and* direct-`saveGame()` save-refusal in the two interiors,
    a round trip on the Reach, and pre-MQ4 accessibility/persistence
    proof. Test 20's "north edge is border" assertion was updated to
    expect the new open edge.

13. **Flag-dependent dialogue pass** — seven previously-static NPCs
    converted to the established `get dialogue()` pattern: base pages
    unchanged, flag-gated pages appended after them. Test 36 proves the
    base prefix is unaffected by which flags are set (with vs. without,
    at current runtime) — it does *not* prove, and was never meant to
    prove, that the base text is byte-identical to whatever the static
    array literally read before this pass's conversion; no pre-conversion
    snapshot was ever captured to compare against.
    - **Maren** (guard post): reacts to `fort_report_filed` (what was
      *filed*, never an unreported kill — same convention as the rest-week
      inn reactions) and to `reservoir_quest_started` (road advice).
    - **Edda / Orren / Foss** key on `reservoir_quest_started` — the job
      posting that skipped the board, an inn rumor seeding the missing
      basin observer, and the guild's documentation-class-three pedantry
      for uncovered masonry.
    - **Cres** keys on the permanent `window.basin_chamber_seen` discovery
      flag via a plausible reaction that isn't perishable evidence — the
      player's own decision not to ask the records clerk about a
      structure with no file.
    - **Rhen / Kest** originally keyed on the permanent
      `window.upper_reach_seen` / `sunken_gallery_seen` discovery flags
      too (pale basin mud on the player's boots, the smell of
      channel-bottom) — a bug, fixed in the audit pass below: physical
      evidence that repeated forever isn't plausible. See that entry for
      the corrected same-day behavior.
    Side effect: test 24's dialogue-overflow check needed a plain
    assignable dialogue array and had been borrowing Maren's — it now uses
    Tern (still static) instead.
14. **Roddon Way** — one new 16×15 outdoor fen map (`RODDON_WAY_MAP`),
    modeling a roddon: the raised, silt-filled bed of a long-dead creek,
    left standing as the surrounding peat drained and subsided over a much
    longer span than the current three-month dry spell. No settlement,
    dungeon, quest, boss, or new enemy — deliberately in scope-only for a
    single map square.
    - **Attachment point**: MAP3_N1's (Northern Fen) west edge, rows 4-9,
      via a new reciprocal `EDGE_TRANSITIONS` pair. That edge was entirely
      unused border (plain `TREE` for all 15 rows) before this, and the
      chosen row range sits with a full buffer row clear of the Mire
      Entrance (col 1, row 3) and the hamlet farmhouses (col 1, rows
      10-12) on the MAP3_N1 side — no existing entrance, house, or pickup
      touched.
    - **One new tile, `RODDON_SILT`** (111) — the ridge itself: walkable,
      deliberately *not* encounter-eligible (the safe route through),
      visually distinct from `BASIN_MUD`/`EXPOSED_STONE` on purpose (those
      already carry specific North Basin drought-terrain meaning
      elsewhere; reusing them here would blur two unrelated stories).
      Registered everywhere the architecture requires: `WALKABLE[]`,
      `TILE_PROPERTIES`, `window.*` export, `DEBUG_TILE_NAMES`, a
      `drawRoddonSilt()` case in `render-tiles.js`, and
      `RENDERABLE_TILE_IDS`.
    - **Layout**: the ridge enters at the crossing's full width (rows
      4-9), tapers to its normal 2-3 tile width, and winds northwest
      through two bends to a small rounded terminus/viewpoint — a
      winding fossil watercourse shape, not a straight road. Surrounding
      wet fen mixes `GRASS` (peat), `REEDS` (reed/sedge, concentrated in
      the lower ground), two small `WATER` pools, and a few single-tile
      `TREE` scrub clumps, none of which enclose any ground. Reuses
      `FAR_ENEMY_TEMPLATES` — MAP3_N1's own pool — for encounters; no new
      enemies. `allowSave: true`, ordinary rules, no special-casing.
    - **Six inspectables** (`MAP_FEATURES`, no `onceFlag` on any of them —
      ordinary observational text, not worth a persistent flag): a
      viewpoint that explains "roddon" in-world and is the only one that
      does; an exposed bank showing silt over peat; a curved old channel
      bend in the ridge itself; a leaning District Drainage survey post
      (subsidence predates the current dry spell — explicit); stranded
      eel stakes above a shrunken pool; and cracked peat in the low
      ground, whose caption is careful to blame *only* the current
      three-month dry spell for the surface cracking, not the ridge
      itself. No `LORE.md` changes.
    - A design-time bug worth recording: the first hand-transcription of
      the map grid accidentally opened the *west* border (col 0, rows
      4-9) instead of leaving it sealed — a copy/paste artifact from
      simultaneously editing MAP3_N1's own crossing tiles. Test 37's
      border-sealed check (not just the flood-fill) caught it immediately
      before this ever reached a save file; fixed by re-checking the
      transcription against the connectivity script's original output.
15. **Audit pass over items 11-13** — six targeted corrections, no new
    content, all existing behavior preserved except where explicitly
    listed below:
    - **Chamber visuals vs. text** — the standing doorframe and the
      chamber threshold render as flat black openings (`drawChamberDoor()`/
      `drawChamberExit()`, render-tiles.js — unchanged), but their
      inspect text (interactions.js) said the exterior mudflat was
      visible through them. Rewritten so nothing is visible through
      either opening, in either direction, with no depth/reflection/light
      cue — still restrained, still unexplained.
    - **Rhen/Kest physical evidence made temporary** — `window.
      upper_reach_seen`/`sunken_gallery_seen` are permanent discovery
      flags; keying Rhen's mud comment and Kest's smell comment on them
      directly meant those lines repeated in every conversation forever
      after one visit. Both now key on new same-day markers,
      `window.upper_reach_visit_day`/`sunken_gallery_visit_day`
      (movement.js, written every frame the player is physically present,
      compared with `=== day`) — session-only, not in
      `QUEST_FLAG_SCHEMA`, and explicitly cleared at the top of
      `loadGame()` (save.js) so a same-day load from an older save can't
      leak a "visited today" marker into a timeline where the visit never
      happened. Resting always increments `day` (three `rest()` functions
      in interactions.js, one defeat-handler in combat.js), so the
      comparison expires on its own the moment a day passes. Test 38
      covers same-day firing, expiry on rest, expiry across a load, and
      re-arming on a fresh visit. Cres's permanent chamber reaction (a
      remembered decision, not perishable evidence) was intentionally
      left alone.
    - **Five Calwick inspectables made visible** — the Charter Stone,
      Public Cistern, Water Gauge, Reed-Drying Racks, and Apartment
      Notice sat on plain street/floor/reed/grass tiles with nothing
      marking them. Four new small walkable decorative tiles
      (`CHARTER_STONE`/`CISTERN`/`WATER_GAUGE`/`REED_RACK`, 112-115) now
      sit at each inspectable's exact interaction coordinate, following
      the same walkable-prop convention `NOTICE_BOARD` already
      established. The fifth (`APT_NOTICE`, 116) is a dedicated tile
      rather than a reuse of `NOTICE_BOARD` itself: that tile's draw
      function hard-codes a town-market cobblestone base, which would
      render wrong inside an interior corridor. None of the five set
      `isDecorative: true` (that flag only feeds a cosmetic debug label
      and would otherwise multiply `validateGameData()`'s one documented
      "isDecorative + walkable" warning fivefold for no benefit — the
      convention is documented in each tile's `notes` field instead, same
      as `BASIN_MUD`/`EXPOSED_STONE`). Test 39 proves the coordinate
      match, walkability, renderability, real-keypress interaction, and
      that no NPC or house door was displaced — automated coverage stops
      there; **actual visual appearance in a browser has not been
      manually checked in this pass.**
    - **Save restriction narrowed to the two interiors** — "no safe
      haven" was over-applied to the entire outdoor Upper Reach in the
      original pass. Re-read as "no town/bed/healing/shelter," not "the
      whole region refuses to save": `NORTH_BASIN_NW_MAP.allowSave` is
      now `true`; `BASIN_CHAMBER_MAP`/`SUNKEN_GALLERY_MAP` stay `false`.
      A new single authoritative helper, `canSaveHere()` (save.js, based
      on `MAP_METADATA...allowSave`), replaces the inline check that used
      to live only in input.js — the save-confirm menu still consults it
      for the banner, and `saveGame()` itself now also calls it as its
      first line, refusing to write *before touching localStorage* on any
      blocked map regardless of caller. Test 35 (extended) proves saving
      succeeds on the Reach via a real `saveGame()` call and a full
      round trip, and proves refusal in both interiors at both the
      menu level and via a direct `saveGame()` call, with the stored save
      byte-for-byte unchanged after every refusal.
    - **Pre-MQ4 flexibility confirmed, not newly built** — nothing in the
      code ever gated the Reach/chamber/gallery on
      `reservoir_quest_started` (no `condition` on the `EDGE_TRANSITIONS`
      crossing, no check in any tile trigger); this was already true, just
      unproven. Test 35 now explicitly asserts
      `reservoir_quest_started === false` before the walkthrough starts
      and again after the save/load round trip, and confirms all three
      discovery flags are in `QUEST_FLAG_SCHEMA` for a future reservoir
      quest to read back. The reservoir chapter itself is still not
      built.
    - **Gallery footprints un-canonized** — the footprints' own inspect
      text (interactions.js) was already appropriately ambiguous ("They
      are not yours. They are not wearing boots.") and untouched; only
      this file's *description* of them as "a soft, unwired hook for the
      MQ4 missing-observer quest" was overreaching, and is corrected
      above (item 12) to describe them as unresolved environmental
      strangeness. No code or player-visible text change was needed for
      this one — a documentation-only correction.
    - **Stale documentation corrected** — the Schilling sequence-break
      entry (recommended-tasks, below) and test 36's description (item 13
      above) were both inaccurate; both fixed above rather than left as
      separate entries.
    Tests 38, 39, 40 are new; tests 20, 24, 35, 36 were updated in place
    (not superseded) to match the corrected behavior.
16. **Pre-MQ4 north-bridge admonishment** — reactive dialogue, no new
    map/quest/lore. The Imperial toll bridge north of Drenwick (MAP3_N2)
    is the only crossing of the canal onto the basin road, and the North
    Basin is deliberately reachable before the reservoir assignment
    exists. If the player crosses NORTH before `reservoir_quest_started`,
    `exitBridgeNorth()` (world-transitions.js) sets a new monotonic flag
    `north_bridge_crossed_early`; the next time they report to the Calwick
    office supervisor, `interactSupervisor()` (interactions.js) prepends a
    one-time light admonishment (he asks why they went up there and tells
    them off, mildly), gated by a second flag `north_bridge_scolded` so it
    never repeats. Both flags are ordinary `quests.js` let-bindings —
    synced, in `QUEST_FLAG_SCHEMA`, restored in `loadGame()`, and mirrored
    in validation.js's cross-check list — following the `supervisor_greet_day`
    / `esla_said_*` pattern exactly. The scold is gated on
    `!reservoir_quest_started`, so it never fires once the basin actually
    *is* the assignment; it's set synchronously (like the daily greeting),
    not via `dialogue.callbacks`, so it can't collide with a branch's own
    callback (e.g. the MQ4 assignment). The bridge remains the sole
    chokepoint north (the canal is impassable WATER except the gate), so
    the one hook reliably captures every northward crossing. Test 41
    covers the real northward crossing arming the flag, the one-time
    admonishment firing and not repeating, save/load persistence, and the
    four negative cases (after assignment, already-assigned, never-crossed,
    and a southbound crossing).
17. **Stable enemy ids made authoritative at runtime**
    (`combat.js`/`render-battle.js`/`validation.js`) — the authored, immutable
    `enemy_<snake>` template ids (from item 9) are now the **sole** runtime
    identity of an enemy; `enemy.name` is presentation only. Renaming an enemy's
    display name no longer changes its battle sprite, its Observe/lore, or its
    special combat behaviour. Battle-sprite selection moved from a
    `combat.enemy.name` if/else chain (and the `BATTLE_SPRITE_NAMES` name Set) to
    an id-keyed `ENEMY_SPRITE_DISPATCH` table (`id → { draw, dy }`), with an
    explicit `ENEMY_GENERIC_SPRITE_IDS` opt-in for the one enemy (`enemy_takomo`)
    that intentionally reuses the generic silhouette — so a missing/unregistered
    id is now a *diagnosable* case (`console.warn`), not a silent fallback.
    `ENEMY_OBSERVATIONS` is re-keyed by id (shared-identity variants aliased onto
    one entry), and the id-keyed special branches (Corpse Slug / Shade Wraith
    slither, Fen Witch poison, Mire Toad / Den Wraith flavour, Tallyman / Swamp
    Donkey intros) replaced their name checks. `validateEnemies()` now proves
    every registered id resolves to exactly one of sprite/generic, that
    sprite/generic/Observe entries only reference registered ids, and guards
    against name-keyed dispatch returning. No enemy stats, pools, weights,
    rewards, AI, dialogue, lore, map content, or save behaviour changed — the
    change is architectural only. Covered by the new **test 56** (load-bearing
    rename + break-then-restore checks); tests 19/28/34/35 migrated from
    `BATTLE_SPRITE_NAMES` to the id-keyed table.

18. **Regional content split** (`content/`) — the three largest authored files
    were split by region into 16 thin content files, strictly code-neutral (no
    gameplay/behaviour change): `maps.js` 2528→357, `npcs.js` 5844→2505,
    `interactions.js` 6373→2030 lines. Region grids/NPCs/interactions now live in
    `content/{maps,npcs,interactions}/*`, loaded before their facade in
    `index.html`. The facades keep the authoritative aggregates: `MAP_REGISTRY`
    (unchanged literal), `SIMPLE_NPCS`/`NPC_REGISTRY`, `MAP_FEATURES` (now built by
    `mergeMapFeatureFragments([...])`, which throws on duplicate map ownership),
    and the `INTERACT_HANDLERS`/`OVERWORLD_INTERACT_HANDLERS` priority tables.
    `interactWildsAndOutposts()` was split into the four consecutively-registered
    `interact{CalwickVale,ThornmereWilds,DrenwickApproach,NorthBasinWilds}()`
    handlers. Proven behaviour-neutral by a before/after equivalence manifest
    (MAP_REGISTRY, map tile hashes, per-map NPC order + NPC fingerprints,
    `NPC_REGISTRY`, per-map `MAP_FEATURES` order, handler tables, stable-ID
    inventories, transition audit, save version/bindings all identical). Covered
    by **test 58**. `SAVE_VERSION` unchanged (3); the only structural delta is the
    mandated 20→23 `OVERWORLD_INTERACT_HANDLERS` entries from the wilds split. See
    architecture.md "Regional content files".
19. **Enemy validation + balance report unified on the pool registries** —
    strictly code-neutral tooling/validation refactor (no enemy, encounter, map,
    combat, reward, or balance change). `ENEMY_TEMPLATE_POOLS` (combat.js) became
    the **sole** encounter-pool inventory, an array of `{ id, label, templates }`
    with stable authored `pool_<snake>` ids (16 pools). Both consumers now read it
    directly: `validateEnemies()` dropped its hand-maintained `*_ENEMY_TEMPLATES`
    list and iterates the live registry (adding pool-id/one-array-per-id/empty/
    reachability checks against `MAP_METADATA` both ways), and
    `test/balance-report.js` deleted its parallel `POOLS`/`SPECIALS` tables,
    deriving pools + scripted enemies from the registries and referencing them in
    scenarios by **id** (validated before simulation; unknown id → non-zero exit).
    Every registered pool/scripted enemy now appears automatically — curated
    scenario or a default auto-coverage run — which newly surfaced the 5
    previously-uncovered pools (Sluice top/sealed, North Basin, Sunken Gallery,
    Upper Reach) and Swamp Donkey; **all pre-existing balance numbers are
    byte-identical**. The report is now importable (helpers exported; CLI guarded
    by `require.main`). Also fixed a latent duplicate-id check so a template
    repeated for spawn weight / shared across pools is no longer miscounted.
    Covered by **test 59** (9 contract points + 6 break-then-restore checks).
    `SAVE_VERSION` unchanged (3). See architecture.md "Stable identity …" and
    "Validation".
20. **"The Struck Entry" — Corvin's favour (side quest, partial)** — Corvin, the
    district ledger clerk (canal family from past Drenwick), carries one record
    he's barred from fixing himself: his father's name was struck from the old
    Drenwick canal keeper's roll, and correcting a record he has a personal stake
    in would void it (the same neutral-party rule the Weight Discrepancy runs on).
    He asks the player, off the clock at the Calwick inn on a Dayoff, to recover
    the original towpath tally — offered at a **1/3 chance rolled once per Dayoff
    and remembered** (mirroring the Fourteenth File availability roll). New flags
    (quests.js, saved + window-synced): `corvin_favor_started` / `corvin_favor_done`
    / `corvin_favor_offer_day` / `corvin_favor_offered`. **Crucially cross-wired
    into Aldric's Weight Discrepancy**: Corvin now only countersigns the correction
    once `corvin_favor_done` — before that he deflects (pointing the player to the
    inn), so Aldric's quest can't reach its clean finish. His work-day office
    dialogue gains an in-progress line once the favour is given, plus a dormant
    resolved line and a reciprocity beat at the signature. **Intentionally partial:
    the resolution isn't built — nothing sets `corvin_favor_done` yet**, so
    Corvin's quest has no completion and the Weight Discrepancy's best ending is
    gated pending future work. Covered by **test 60** (offer roll, accept/decline,
    the signature gate, flag round-trip); tests 14 and 51 updated for the new
    precondition and flag snapshot. `SAVE_VERSION` unchanged (3).

Each item shipped with tests (27-30, 34-41, 56, 58, 59, 60), a clean `validateGameData()`
run, and a clean transition audit (all new enter/exit functions and
transition tiles are registered in `test/transition-audit.js`).

## Known risks / caveats

- **`validateEnemies()`'s old battle-sprite blind spot is now closed** (item 17).
  The sprite check no longer scans templates pool-by-pool and match-by-name (a
  path that couldn't see the scripted/boss templates defined outside the pools).
  It now iterates the **`ENEMY_TEMPLATE_REGISTRY`** — which already contains every
  pooled *and* scripted/special template plus the inline "23" — and requires each
  registered id to resolve to exactly one of `ENEMY_SPRITE_DISPATCH` (bespoke art)
  or `ENEMY_GENERIC_SPRITE_IDS` (intentional generic silhouette). A scripted enemy
  added without a sprite is therefore now an **error**, not an unnoticed gap.
  `drawBattleGenericEnemy()` remains the safety net, but leaning on it silently is
  no longer possible: a missing/unregistered id at combat time logs a
  `console.warn`, and the only enemy on the generic silhouette by choice
  (`enemy_takomo`) is explicitly listed and still raises the standing "deserves
  its own look" *warning*. When you add an enemy, wire its **id** into
  `ENEMY_SPRITE_DISPATCH` (or the generic set) — the validator enforces it.
- **`handleInteract()` (`interactions.js`) has been refactored** from a single
  giant `if`/`else if` chain into a priority orchestrator over named location
  handlers held in two dispatch tables (`INTERACT_HANDLERS` /
  `OVERWORLD_INTERACT_HANDLERS`; first matching location wins, mirroring the
  old else-if dispatch). Consumption is now **explicit**: a
  handler returns `true` to consume the interact press (inside a handler
  body, `return true` is what the old chain's bare `return` was), and the
  `MAP_FEATURES` fallback runs only when nothing consumed — guarded by
  `interactionUiOpened()` (dialogue/choice/shop/reading panels), no longer
  by `dialogue.open` alone. The old failure mode ("a scripted interaction
  that opens a choice menu but not dialogue lets MAP_FEATURES open a
  competing dialogue underneath") is fixed structurally. Remaining caveat:
  the individual handler bodies are still long hand-written proximity-check
  sequences — the refactor changed the dispatch/fallback skeleton, not the
  per-location content.
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
- **`RENDERABLE_TILE_IDS`/`ENEMY_SPRITE_DISPATCH` are hand-maintained**,
  not derived from `drawTile()`'s actual `case` statements or (for enemies)
  from any name (can't parse a file's own source from inside a
  running browser). They currently agree with reality; nothing but
  `validateGameData()` catches future drift.
- **Git history is sparse** — a repo now exists, but with only a couple of
  commits and no branch discipline; commit (or at least stage) before large or
  destructive changes rather than assuming you can cleanly undo.
- Two historical audit docs (`TRANSITION_AUDIT.md`, `QUEST_TRACE.md`) have
  been moved to `Archived : Stale md files/` and are no longer maintained
  or linked from current docs — their *findings* were fixed and folded
  into this file and `architecture.md` at the time, but don't treat the
  archived files themselves as current.

## Recommended next tasks

Roughly in priority order:

1. ~~Draw dedicated battle sprites for the 4 remaining scripted bosses~~ —
   **done**: Smuggler Guard (plain steel-armored guard, sword and shield),
   Polwick (copper-red Firelit hair, dirty tunic, bare-knuckle swagger), Essa (long
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
   Fen Shade's "Observe" flavor text. `MAP_FEATURES` covered 7 maps / 17
   entries after that pass (now 17 maps / 49 entries, after the West Shore
   shoreline set, the Sealed Room set, the Calwick flavor pass — item 11
   above, which finally gave the starting town itself, its east side, and
   its apartment corridor their first environmental text — the Upper Reach
   pass — item 12, the Upper Reach/chamber/gallery signage — and Roddon
   Way — item 14, six inspectables). Still uncovered if more is wanted:
   Calwick's interiors, the rest of Drenwick's interiors, most dungeon
   floors, and most of the Thornmere fen proper (MAP3/MAP4/MAP5).
3. ~~Consider a dedicated regression test for the Schilling-the-bear
   sequence-break~~ — **fixed** (turned out to already be fixed in the
   underlying quest logic, just never confirmed by a test or reflected
   here): defeating or hugging Wrongteeth awards Schilling gated only on
   `!schilling_returned` (interactions.js's `killWrongteeth()`/
   `hugWrongteeth()`), never on `schilling_quest_started`, and Pip's
   `action()` (npcs.js) checks `stats.items.some(i => i.name ===
   'Schilling')` *before* checking whether the quest was ever started. A
   player who resolves Wrongteeth first, without ever having met Pip, can
   still turn the bear in and complete the quest normally. Test 40 proves
   this end to end (both the kill and hug branches) through the real
   boss-choice and NPC-interaction code paths, not just by granting the
   item directly.
4. **A full multi-district Drenwick walkthrough test**, and a save/load
   round-trip test for a specific mid-stage quest — both were suggested by
   earlier audits and never added; still open.

## Task difficulty guide for future coding assistants

**Safe for a lighter-weight/faster model, low architectural risk:**
- Drawing new battle sprites and adding the enemy's **id** to `ENEMY_SPRITE_DISPATCH`.
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
  pattern closely (there are 32 to copy from).
- Adding new enemy templates to an *existing* pool with reasonable stats
  (validated automatically by `validateEnemies()`).

**Reserve for a stronger/more careful model:**
- Changing `handleInteract()`'s dispatch tables or consumption semantics
  (`INTERACT_HANDLERS` order, `interactionUiOpened()`, the
  matched-but-not-consumed fallthrough). Adding a proximity check *inside*
  an existing location handler is now a normal, lower-risk task — just
  `return true` once handled — but reordering handlers or touching the
  orchestrator loop can still silently change which interaction wins a
  press.
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
