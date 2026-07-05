# Map Transition / Exit-Tile Integrity Audit

Audit pass only — no map data, transition code, or coordinates were changed.

> **Update:** both findings below (Issue #1 and Issue #2) have since been
> fixed. See the "RESOLVED" notes on each for exactly what changed, and
> `test/cases/09-basement-save-load.test.js` / `test/cases/10-transition-audit.test.js`
> for the regression coverage added alongside the fixes.
> `test/transition-audit.js` is now wired into the main suite (`node
> test/run.js`) as of that same pass, not just runnable standalone.

## Method

Rather than hand-tracing 98 transition functions and eyeballing coordinates
against tile grids (error-prone at this scale, and exactly the kind of thing
a script does more reliably), this audit is driven by a new reusable script,
**`test/transition-audit.js`**, built on the same `test/harness.js` the
regression suite uses. It loads the real game into a live `vm` context and:

1. **Calls every transition function directly** (`enterDungeon()`,
   `exitBuilding()`, `moveToDrenwichDistrict(...)`, etc. — all 98 of them,
   across every argument/branch combination that produces a distinct
   destination) and reads back the real `activeMap`/`player.x`/`player.y`/
   `player.facing` the game itself set, rather than re-transcribing
   coordinates from source by hand (which risks transcription error).
2. Validates each landing spot against **the game's own logic** — the real
   `WALKABLE[]` table, the real `canWalk()` (so hitbox radius, chests, solid
   NPCs, and furniture are all accounted for exactly as the game applies
   them), and both the nominal `COLS`×`ROWS` bounds `tileAt()` uses and each
   map's actual array dimensions (a mismatch there is a latent crash, since
   `tileAt()` indexes by the nominal size regardless of a map's real size).
3. Checks the player **can step away** from the landing tile in at least one
   of 4 directions (not sealed into a 1-tile pocket).
4. For the ~20 transitions that **preserve one axis** from the source map
   (e.g. `enterMap2()` keeps `player.y`, only fixes `x`) — these can't be
   checked with one hardcoded coordinate — it scans the source map for
   *every* occurrence of the crossing tile and validates the destination at
   each one, not just whichever row a human playtester happened to cross at.
5. Cross-references every transition-tile constant against which maps
   actually place it and whether `movement.js` actually handles it, in both
   directions.
6. Sweeps every `HOUSE_DOORS` entry's generic return-position formula
   (`{x:(col+0.5)*TILE, y:(row+1.5)*TILE}`) against its source map.
7. Diffs every `const *_MAP = [...]` array declared in `maps.js` against
   `MAP_REGISTRY`'s keys, in both directions.

Run it yourself any time with:

```
node test/transition-audit.js
```

It's read-only (no file mutation) and writes full per-check detail to
`test/transition-audit-output.json` for follow-up digging.

**Self-check note:** the first run of this script produced 13 false-alarm
failures, all caused by bugs in the *script's own test setup* (testing
preserved-axis functions like `enterEastTown()` with a non-representative
baseline row, and testing Drenwick house exits without first placing the
player on the correct source map) — not real game bugs. I fixed those setup
bugs (documented in the script's comments) before trusting any result below;
mentioning this because a validator that never second-guesses its own
findings isn't trustworthy.

## Summary counts

Numbers below are from the original audit pass. Post-fix, `MAP_REGISTRY` now
has 64 entries (was 63 registered + 1 unregistered) and there are 226 (was
225) individual destination checks, since the new Drenwick `east` entry
point is picked up automatically by the same sweep — see "RESOLVED" notes
below for current numbers.

| | |
|---|---|
| Maps checked (dimensions + registry membership) | 64 (63 registered + 1 confirmed real but unregistered) |
| Transition functions checked | 98 of 98 in `world-transitions.js` (100% — verified by cross-checking function names, not just spot-checking) |
| Individual destination checks (function × argument/branch combinations) | 225, all landing on a valid, walkable, escapable tile |
| Preserved-axis transitions checked | 20, across all 24 real source-tile occurrences (not just one row each) |
| House-door return positions checked | 42, all walkable |
| Transition tile constants cross-referenced | 51, all used by at least one map *and* handled in `movement.js` |
| Broken destinations found | **0** |
| Out-of-bounds destinations found | **0** |
| Sealed-pocket destinations found | **0** |
| Map dimension mismatches found | **0** |
| Orphaned tile constants (in maps, unhandled in code) | **0** |
| Dead tile constants (handled in code, unused by any map) | **0** |
| Real structural issues found | **2** (both minor — both now fixed, see below) |

This game's map/transition layer is in genuinely good shape. The two issues
below are narrow and non-breaking; nothing here strands a player or crashes
the game.

---

## Transition table by region

Full per-check detail (source tile, exact destination pixel, tile ID,
`canWalk()` result, escape directions) is in
`test/transition-audit-output.json`. This table is the region-grouped
summary; ✅ means every check in that group passed with no exceptions.

### Overworld world-map chain

| Transition | Source → Dest | Axis preserved | Verdict |
|---|---|---|---|
| `enterMap2` / `exitMap2` | MAP ↔ MAP2 | y | ✅ |
| `enterMap3` / `exitMap3` | MAP2 ↔ MAP3 | y | ✅ |
| `enterMap4` / `exitMap4` | MAP3 ↔ MAP4 | y | ✅ |
| `enterMap5` / `exitMap5` | MAP4 ↔ MAP5 | y | ✅ |
| `enterMapN1` / `exitMapN1` | MAP ↔ MAP_N1 | x | ✅ |
| `enterMapN2` / `exitMapN2` | MAP_N1 ↔ MAP_N2 | x | ✅ |
| `enterMap3N1` / `exitMap3N1` | MAP3 ↔ MAP3_N1 | x | ✅ |
| `enterMap3N2` / `exitMap3N2` | MAP3_N1 ↔ MAP3_N2 | x | ✅ |
| `enterDungeon` / `exitDungeon` | MAP ↔ DUNGEON_MAP | fixed | ✅ |
| `enterTownAt('calwick', *)` (3 entry points) | MAP → TOWN_MAP / EAST_TOWN_MAP | fixed | ✅ |
| `enterTownAt('drenwick', *)` (2 entry points) | MAP3_N2 → DRENWICK_CIVIC_MAP / DRENWICK_MARKET_MAP | fixed | ✅ |
| `exitTown` (5 branches: Calwick, Drenwick Market/East-Outskirts×2/Civic-default) | town → world | fixed | ✅ |

### Calwick town

| Transition | Source → Dest | Verdict |
|---|---|---|
| `enterEastTown` / `exitEastTown` | TOWN_MAP ↔ EAST_TOWN_MAP | ✅ (2 real crossing rows each, both checked) |
| `enterWestTown` / `exitWestTown` | TOWN_MAP ↔ WEST_TOWN_MAP | ✅ (2 real crossing rows each) |
| `exitEastTownToWorld` | EAST_TOWN_MAP → MAP | ✅ — see "One-way transitions" |
| `enterBuilding('inn'/'office'/'school'/'apt')` | TOWN_MAP/EAST/WEST → INN_MAP/OFFICE_MAP/SCHOOL_MAP/APARTMENT_CORRIDOR_MAP | ✅ (all 4) |
| `enterHouse(...)` — 7 West Calwick houses + `apt_1..4` | door → HOUSE_INTERIOR_MAP / SMALL_APARTMENT_MAP | ✅ (all 11) |
| `exitBuilding()` — every prior `townBuilding` value | interior → TOWN_MAP/EAST/WEST | ✅ (5 non-house + 11 house cases) |
| `enterSluice` / `exitSluice` | EAST_TOWN_MAP ↔ SLUICE_MAP | ✅ |
| `descendToSluice2`/`ascendToSluice1`, `descendToSluice3`/`ascendToSluice2` | sluice floors 1↔2↔3 | ✅ |

### Drenwick town (10 exterior districts + interiors)

| Transition | Source → Dest | Verdict |
|---|---|---|
| `moveToDrenwichDistrict(...)` — 14 call sites (all district↔district edges in movement.js) | Civic/WestRes/CanalDocks/EastOutskirts/Market/Waterfront, both directions each | ✅ (all 14) |
| `enterBuilding(...)` — inn/office/harbormaster/wash_house/provision_store/guild_hall/tavern/school | district → respective interior map | ✅ (all 8) |
| `enterBuilding('drenwick_apt_a1'..'c2')` — 6 corridors | DRENWICK_EAST_OUTSKIRTS_MAP → APARTMENT_CORRIDOR_MAP | ✅ (all 6) |
| `enterHouse(...)` — 7 residential houses + 24 apartment units | door → HOUSE_INTERIOR_MAP / SMALL_APARTMENT_MAP | ✅ (all 31) |
| `exitBuilding()` — every prior Drenwick `townBuilding` value | interior → correct district, correct door-relative position | ✅ (8 non-house + 6 apt-corridor + 7 house cases) |
| School stairs (ground↔basement, ground↔upper) — inline in `movement.js` | DRENWICK_SCHOOL_GROUND_MAP ↔ BASEMENT / UPPER | ✅ — but see **Issue #1** (registry gap, not a destination bug) |
| `enterTakomo` / `exitTakomo` | DRENWICK_WATERFRONT_MAP ↔ TAKOMO_MAP | ✅ |

### Dungeon (South Ruins)

| Transition | Source → Dest | Verdict |
|---|---|---|
| `enterDungeon` / `exitDungeon` | MAP ↔ floor 1 | ✅ |
| `descendToDungeon2..8` / `ascendToDungeon1..7` (14 fns) | floors 1↔2↔3↔4↔5↔6↔7↔8 | ✅ |
| `enterDungeon8West`/`exitDungeon8West`, `enterDungeon8East`/`exitDungeon8East` | floor 8 ↔ horror-branch floors 9/10 | ✅ |
| Floor-3 3×3 sub-room grid — 22 `d3_*` functions (11 bidirectional pairs) | TC/TL/TR/ML/MC/MR/BL/BC/BR | ✅ (all 22) |

Note: `descendToDungeon5` (floor 4→5) requires `MULHOLLAND.defeated`, and
`descendToDungeon6` (floor 5→6) requires `BOSS.defeated` — these guards live
in `movement.js`, not in the destination functions themselves, so they don't
affect destination validity. See **Recommended fixes** for a UX note.

### East Sluice, standalone interiors, and misc.

| Transition | Source → Dest | Verdict |
|---|---|---|
| `enterLorraHouse` / `exitLorraHouse` | MAP2 ↔ LORRA_HOUSE_MAP | ✅ |
| `enterMarenPost` / `exitMarenPost` | MAP ↔ MAREN_POST_MAP | ✅ |
| `enterDrenwrickPost` / `exitDrenwrickPost` | MAP3_N2 ↔ DRENWICK_POST_MAP | ✅ |
| `enterBridgePostFromSouth`/`North`, `exitBridgeSouth`/`North` | MAP3_N2 ↔ BRIDGE_CROSSING_MAP (toll-gated) | ✅ |
| `enterSmugglerFort` / `exitSmugglerFort` | MAP3_N1 ↔ SMUGGLER_FORT_MAP | ✅ |
| `enterMireVault` / `exitMireVault` | MAP3_N1 ↔ MIRE_VAULT_MAP | ✅ |
| `enterFenBrewery` / `exitFenBrewery` | MAP3_N1 ↔ FEN_BREWERY_MAP | ✅ |
| `enterHamletInterior('A'/'B'/'C')` / `exitHamletInterior` | MAP3_N1 ↔ HAMLET_INTERIOR_MAP (3 rooms, shared map) | ✅ (all 3 rooms both directions) |

---

## Passed

Everything in the transition table above. In full:

- All 64 maps have correct `16×15` dimensions (both nominal and actual array
  size) — no latent out-of-bounds crash risk anywhere.
- All 225 fixed-destination checks land on a walkable tile the player can
  step away from.
- All 20 preserved-axis transitions are valid across *every* real crossing
  point on their source map, not just a single spot-check.
- All 42 house-door return positions (the generic
  `{col+0.5, row+1.5}` formula) are walkable.
- Every transition tile constant used by any map is handled in
  `movement.js`, and every constant `movement.js` checks for is placed by at
  least one map — no orphans in either direction.
- Every paired location (dungeon floors, sluice floors, all standalone
  interiors, the floor-3 sub-room grid, the Falls Hamlet's 3 rooms, the
  bridge checkpoint) has a working return transition.

---

## Issues Found

### Issue #1 — `DRENWICK_SCHOOL_BASEMENT_MAP` is not registered in `MAP_REGISTRY` — ✅ RESOLVED

**Fix applied:** added
`DRENWICK_SCHOOL_BASEMENT_MAP: { id: 'drenwick_school_basement', label: 'Drenwick — School (Archive)', map: DRENWICK_SCHOOL_BASEMENT_MAP }`
to `MAP_REGISTRY` in `maps.js`, immediately after the `DRENWICK_SCHOOL_UPPER_MAP`
entry, matching the exact `id`/`label` naming convention its two sibling
school maps already use (`id` matches what `currentMapId()` independently
returns for this map, `label` matches what `locationName()` displays for
it). No other code changed — `mapToId()`/`mapFromId()` in `save.js` already
handled any registered map correctly; the map just needed to be in the
registry.

Regression coverage: `test/cases/09-basement-save-load.test.js` saves while
standing in the basement, mutates `activeMap` away to the overworld, loads,
and asserts the player is restored to the exact basement position — plus
that the restored spot is actually walkable via the real `canWalk()`. I
verified this test fails without the fix (temporarily removed the registry
line, confirmed red, restored it, confirmed green again) before trusting it.

**Severity (pre-fix): minor, save/load-only — not a destination bug.** The map itself
is real, correctly sized, and every stairs transition into and out of it
lands on a walkable `INTERIOR_FLOOR` tile (confirmed above). The problem is
narrower: `MAP_REGISTRY` is what `saveGame()`/`loadGame()` use
(`mapToId()`/`mapFromId()` in `save.js`) to serialize `activeMap` as a
string id. I confirmed via a full source-text sweep of every
`const *_MAP = [...]` declaration in `maps.js` against `MAP_REGISTRY`'s keys
that this is the **only** map with this gap — every other of the 63
registered maps correctly round-trips.

**Concrete failure scenario:** a player saves while standing in the
Drenwick school basement. `mapToId(DRENWICK_SCHOOL_BASEMENT_MAP)` returns
`null` (not found in the registry), so `activeMapId` is written as `null` to
the save file. On load, `mapFromId(null)` also returns `null`, so
`activeMap` is never reassigned by that line — the player would load back
into whatever `activeMap` already held at load time (the pre-load-game
default), not the basement. This doesn't crash, but it silently teleports
the player to the wrong map on load specifically from this one location.

### Issue #2 — Drenwick's main gate has an asymmetric entry point for one approach direction — ✅ RESOLVED

**Fix applied:** added an `east` entry to `TOWN_ENTRY_POINTS.drenwick` in
`world-transitions.js`:

```js
east: { map: DRENWICK_EAST_OUTSKIRTS_MAP, x: 1.5 * TILE, y: 4.5 * TILE, facing: 'right', townBuilding: null },
```

This reuses the *exact* spot and facing the internal
`DRENWICK_CIVIC_MAP → DRENWICK_EAST_OUTSKIRTS_MAP` transition already lands
players at (`movement.js`'s `MAP2_EXIT` handler on the Civic map) — not a
new, unvalidated coordinate. The reasoning: `entryPointFromFacing()` labels
an approach by the direction of travel (moving rightward/eastward into the
gate → key `'east'`), and Calwick's own `east` entry continues the player
in the same direction they were already moving, into the next area from its
western edge. Applying that identical logic to Drenwick, continuing
eastward past the gate lands the player at East Outskirts' western edge —
which is also literally the spot the game already uses for "just arrived at
East Outskirts from the west." Chosen over inventing a new coordinate
specifically to avoid introducing an unvalidated destination.

Regression coverage: this is automatically picked up by
`test/transition-audit.js`'s existing `TOWN_ENTRY_POINTS` sweep (it iterates
every registered entry point dynamically, so the new key needed no script
changes) — confirmed the check count went from 225 to 226 and the new entry
resolves to a real, walkable position. I verified this catches breakage by
temporarily pointing the new entry at an unwalkable/out-of-bounds spot and
confirming both `node test/transition-audit.js` and the wired-in
`test/cases/10-transition-audit.test.js` failed, then restored the correct
coordinate and confirmed both pass again.

**Severity (pre-fix): minor, not a broken destination.** I checked (not assumed) the
actual tile neighbors around both world-map town gates:

- Calwick's `TOWN_ENTRANCE` (MAP, row 1 col 5): tiles to both its left and
  right are `GRASS` (walkable), so it's approachable from the side as well
  as from below. `TOWN_ENTRY_POINTS.calwick` defines all three of
  `south`/`east`/`west`, matching all three real approach directions — this
  one is fully correct.
- Drenwick's `TOWN_ENTRANCE` (MAP3_N2, row 6 col 8) has the *same* tile
  layout — both left and right neighbors are walkable `GRASS`, so a player
  can physically approach from either side, same as Calwick. But
  `TOWN_ENTRY_POINTS.drenwick` only defines `south` and `west` — there's no
  `east` entry.

`entryPointFromFacing()` maps a rightward approach to the key `'east'`, and
`enterTownAt()` falls back to `town.south` when the requested key doesn't
exist. So: a player who approaches the Drenwick gate walking rightward
(coming from its west side) lands at the `south` entry
(`DRENWICK_CIVIC_MAP`) instead of a `west`-style entry, even though the
same approach direction on the Calwick gate would land somewhere geography-
matched. Not broken — `DRENWICK_CIVIC_MAP` is a perfectly valid, walkable
landing spot (confirmed above) — just a minor inconsistency in which of the
two towns' gates has full directional coverage.

---

## One-way transitions that appear intentional

- **`exitEastTownToWorld()`** (EAST_TOWN_MAP, `townBuilding==='east'`, on
  `TOWN_EXIT` → straight to `MAP` at a fixed spot). There's no matching
  `MAP → EAST_TOWN_MAP` tile at that landing spot — returning to East
  Calwick from the world requires walking back through `TOWN_MAP`'s east
  entrance instead. This reads as a deliberate "back-alley shortcut out,
  not in" rather than a bug: it doesn't strand the player (they land in the
  ordinary overworld, fully able to walk anywhere), and `enterEastTown()` is
  still reachable the normal way. Marking this "appears intentional" rather
  than investigating further, per the audit's guidance to avoid speculation
  where the evidence doesn't clearly point to a bug.
- **Dungeon floor 4→5 and 5→6 descents gated on `MULHOLLAND.defeated` /
  `BOSS.defeated`.** Not literally one-way — they open up once the floor
  boss is beaten — but worth listing here since walking onto the stairs
  tile before that does nothing at all, silently, with no explanatory
  dialogue (unlike, for example, the bridge checkpoint, which does show an
  "Imperial Soldier" dialogue when blocked). See Recommended fixes.

No other one-way or seemingly-accidental single-direction transitions were
found — every other location in the game has a confirmed, validated return
path.

---

## Recommended fixes

1. ~~Add `DRENWICK_SCHOOL_BASEMENT_MAP` to `MAP_REGISTRY`~~ — **done**, see
   Issue #1 above.
2. ~~Decide whether Drenwick's gate should get an `east` entry point~~ —
   **done**, see Issue #2 above (added, reusing an already-validated
   coordinate).
3. **(UX polish, optional, still open)** Add a short "the way is blocked"
   style dialogue when a player steps onto the floor-4→5 or floor-5→6
   stairs before defeating that floor's boss, matching the pattern already
   used for the bridge toll gate and the smugglers' fort guard post. Not a
   correctness issue — the stairs simply do nothing until the boss falls —
   but every *other* conditionally-locked transition in the game explains
   itself, and this pair is the only silent one. Left out of this fix pass
   since it's dialogue/UX, not a transition/save-load correctness issue,
   which was this pass's explicit scope.

Nothing else in this audit rises to "needs a fix."

---

## Suggested regression tests

1. ~~`test/transition-audit.js` itself, wired into the regression run.~~ —
   **done.** It runs in ~50ms, well under the "sub-second" bar. It's
   refactored to export its collected results (`module.exports`) from a
   `require.main === module` guard around the human-readable report, so
   `node test/transition-audit.js` still works standalone exactly as
   before, and `test/cases/10-transition-audit.test.js` asserts on the same
   underlying data (zero duplicated checking logic between the two).
2. ~~A regression case asserting `DRENWICK_SCHOOL_BASEMENT_MAP` round-trips
   through save/load~~ — **done**, `test/cases/09-basement-save-load.test.js`.
3. ~~The Drenwick world-gate entry-point behavior~~ — **covered** as a side
   effect of #1: `test/cases/10-transition-audit.test.js` asserts every
   `TOWN_ENTRY_POINTS` entry (now including `drenwick.east`) resolves to a
   walkable, escapable tile, so a future edit to `TOWN_ENTRY_POINTS.drenwick`
   that breaks the destination will fail there. (A test asserting the
   *specific* entry-point key resolution logic in `enterTownAt()`, e.g. that
   an unconfigured key falls back to `south` rather than crashing, would
   still be a reasonable narrower addition later — not added here since the
   fallback behavior itself didn't change.)

Still open, for a future pass (the transition layer's *structural* integrity
is now covered by `test/transition-audit.js`; these are about specific
gameplay flows through it):

4. **One full multi-district Drenwick walk**, e.g. Civic → West Residential
   → Canal Docks → Waterfront → Market → East Outskirts → back to Civic,
   asserting `activeMap`/`player.x`/`player.y` at each hop — this exercises
   the same edges `transition-audit.js` validates individually, but as one
   continuous player path rather than isolated function calls.
5. **The Falls Hamlet's 3-room discrimination logic** (`enterHamletInterior`
   picks a room from `player.y`, `exitHamletInterior` picks a return spot
   from `player.x`) — this is the one transition pair in the game whose
   correctness depends on a runtime heuristic rather than a fixed lookup,
   making it the most likely to break silently under future map edits.
