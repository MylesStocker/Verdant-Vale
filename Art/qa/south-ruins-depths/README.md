# South Ruins depths — review evidence

This folder contains automated Chromium canvas captures, not a recording of a
human playthrough. `browser-results.json` records **639 passing checks** and
**36 captures**, covering native 512×480 and 2× 1024×960 presentation.

- Both MQ6 gate states; all 72 directed doors walked using keyboard events.
- Save/load before each traversal; exact safe landings and return paths.
- All six floor descents, the three saved coffers, and reward non-duplication.
- Six variant sprites at two animation times: pixel differences prove motion;
  snapshots prove rendering does not change player/party/quest state.
- A real random encounter displayed through canonical party combat.
- No browser errors.

Traversal fixtures suppress random encounters while measuring navigation and
place the party at each reciprocal arrival. Actual keyboard input then traverses
the room and its doorway. They do not claim a single unassisted expedition from
Calwick. Direct sprite sheets are labelled by enemy ID; `deep-battle-*` is the
actual combat view. Captures use the existing post-MQ5 party checkpoint, with
MQ6 completion supplied as test setup.

Representative captures:

- `sealed-descent-1x.png`, `open-descent-1x.png`
- `floor-1-1x.png` through `floor-6-1x.png`
- `chest_south_depth_2-1x.png`, `chest_south_depth_4-1x.png`,
  `chest_south_depth_6-1x.png`
- `enemy_folded_seep-2x.png`, `enemy_manyfold_seep-2x.png`,
  `enemy_hollowed_maw-2x.png`, `enemy_nerve_lattice-2x.png`
- `deep-battle-1x.png` and `deep-battle-2x.png`

## Static and automated checks

Baseline: **288/288** complete regression suites passed before production edits.
Final: **289/289** complete regression suites pass, including the expanded
**186,585** immutable formation preparations and all historical combat checks.
Focused suite 353 passes: MQ6 gating, controls in continuous/default and legacy
sessions, save/load in every new room, exact old-grid preservation, no stranded
walkable components, one descent per floor, increasing navigation distances,
unique/reciprocal door records, one-time rewards, old-v5 receipt defaults, all six
random enemy installations and shared-engine victories, original enemy stats,
and registry validation. Strong-party combat here tests lifecycle, not balance.

`validateGameData()` reports **zero errors and six pre-existing warnings**.
All **1059 regional fingerprints** match; none were regenerated in this pass.
SAVE_VERSION stays **5**. Syntax checks cover **66 changed/new JavaScript files**,
including pre-existing work. `git diff --check` passes.

The transition audit passes and its regenerated artifact matches read-only:
**1309 maps, 571 fixed transitions, 8 preserved-coordinate transitions,
2072 structural segments, 42 house-door returns**. All 571 fixed landings are
walkable and escapable. No hard overlaps or remapped seams were introduced.
The increment is 36 discrete maps and 72 point transitions over the immediately
preceding dirty MQ6 baseline; the artifact also retains that earlier work.
No regional atlas or fingerprint regeneration was needed.

`grid-deltas.json` compares every pre-existing map against the pre-pass runtime.
Only `DUNGEON8_WEST_LOWER2_MAP` row 11, col 6 changes (62 → 10).

## Manual follow-up

See [the implementation report](../../../SOUTH_RUINS_DEPTHS.md) for exact rewards,
room inventory, ownership and the playtest checklist. Review the full expedition's
length, healing pressure and late-floor HP with ordinary equipment. Existing
horror floor/wall art is deliberately dark; assess readability on the player's
display. No human manual playtest or broad balance certification is claimed.

Work remains unstaged and uncommitted on `main`; no Git history or remote changed.

Exact final worktree status, including pre-existing changes, is recorded in
[`final-status.txt`](final-status.txt). HEAD remains
`1519a92fbdd63b55241888c5917372a18351528d`.
