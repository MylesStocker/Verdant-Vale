# South Ruins — six post-MQ6 levels

Access remains through the South Ruins entrance on the original starting map.
Follow the old western horror branch down to **West Passage, Deeper**. The new
stair is at local **(6,11)**. It opens only when **Greybank Mill is reported and
paid** (`greybank_stage === 4`), not merely when its last battle is won. No new
key, world event, MainQuest advancement or gate save flag is introduced.

Only one existing grid cell changed: `DUNGEON8_WEST_LOWER2_MAP` row 11, column 6,
from horror floor 62 to stairs-down 10. The existing 1000g chest at (8,13), poem,
upward tendon and original encounter pool remain. The return lands at local
(6.5,10.5), facing up. All overworld grids, cameras and regional seams are unchanged.

## Layout

Each main floor spans three room columns. Galleries fold southward as more
rooms are added. Walls, two-tile gaps and lateral doors form visible routes;
there are no invisible passable walls, keys, timed puzzles or one-way drops.
The fifth and sixth floors include an additional room beyond the descent room,
so following every corridor to its end does not automatically find the stair.

| New floor | Name | Rooms | Down stair (room index; local tile) | Shortest stair route |
|---|---|---:|---|---:|
| 1 | The Fold | 3 | 2; (12,11) | 52 tile steps |
| 2 | Blind Galleries | 4 | 3; (12,3) | 81 |
| 3 | The Knotted Halls | 5 | 4; (3,11) | 106 |
| 4 | The Inward Rooms | 6 | 5; (3,11) | 124 |
| 5 | The Long Contraction | 8 | 6; (3,3) | 127 |
| 6 | The Unquiet Bed | 9 | 7; (12,3) | 146 |

Room indices are zero-based stable IDs; the map title shows index + 1.
There are **35 main rooms plus one small final vault**. Each of the six floors
has exactly one usable downward stair. The sixth leads into its final treasure
vault, not a seventh full floor. The vault has a return stair and no encounters.
The 72 directed connections all land off their reciprocal trigger.

Navigation distances are BFS measurements over the actual walkable grids and
room connections, excluding upstairs escape and the downward transition itself.
They measure minimum travel, not a claim about how long a human takes to search.
All three treasures sit away from mandatory transition cells.

## Enemies and graphics

| Enemy | HP | ATK / DEF / SPD | Existing effect |
|---|---:|---|---|
| Folded Seep | 240 | 42 / 2 / 13 | None |
| Inverted Maw | 420 | 36 / 8 / 5 | Acid, 35% |
| Knotted Tendril | 280 | 38 / 4 / 12 | None |
| Manyfold Seep | 520 | 46 / 3 / 14 | Curse, 15% |
| Hollowed Maw | 720 | 40 / 9 / 6 | Acid, 40% |
| Nerve Lattice | 440 | 42 / 5 / 13 | None |

Floors 1–2 use the first three enemies; floors 3–4 mix Inverted Maw,
Knotted Tendril and Manyfold Seep; floors 5–6 use the final three. Ordinary
encounter selection, escape, combat, Observe fallback and rewards are reused.
Original monsters and stats are untouched. The new Seep variants do not inherit
`splits`: that legacy mechanic creates the original fixed small Seep successor,
which would undermine the new monsters' endurance and identity.

The actual animated Seep, Maw and Tendril routines are reused. Four clipped,
offset bands shear their silhouettes; altered palettes, misplaced eyes and a
ragged mouth seam distinguish the variants. No image assets, new terrain IDs,
rendering randomness or combat-engine changes are needed. Raster captures are
QA evidence only. Names, rewards and tuning remain revisable content.

## Treasures

Each chest uses the existing openable-chest ID registry. Its receipt is saved
in the existing opened-chest collection; rewards are granted once before the
presentation opens. Reloading or repeatedly inspecting cannot duplicate them.

| Floor | Location | Reward |
|---|---|---|
| 2 | Room 2, (12,11) | 1000g, Dragon Blade, 3 Elixirs |
| 4 | Room 4, (3,11) | 1600g, Resonant Targe, Amethyst Bangle, 4 Elixirs |
| 6 | Final vault, (12,11) | 3000g, Fen Mask, 5 Void Shards, 6 Elixirs |

Equipment and consumables reuse `ITEM_REGISTRY`. No cutaway-only equipment or
invulnerability debug rewards are granted. SAVE_VERSION remains **5**, with no
new payload fields or location flags. New maps use neutral location context
and catalog-owned encounter pools. Returning to the old chamber restores its
existing `inDungeon: true, dungeonFloor: 13` projection.

## Ownership and changed files in this pass

- `content/maps/south-ruins-depths-maps.js`: room geometry and reciprocal doors.
- `content/maps/south-ruins-maps.js`: the single old-room cell and its comment.
- `south-ruins-depths.js`: completion gate, chest inspection and chest/grate paint.
- `data.js`: enemies, pools, chest records and map/chest registration.
- `enemy-catalog.js`: three discoverable encounter-pool entries.
- `render-battle.js`: six variant sprite registrations and bounded distortion.
- `movement.js`, `interactions.js`, `render.js`: narrow dispatch hooks and titles.
- `debug-warp.js`: derived review destinations with neutral room state.
- `index.html`: new map and interaction scripts in dependency order.
- `test/cases/353-south-ruins-depths.test.js`: controls, gating, navigation, state,
  chest receipts, encounters, old-grid preservation and validation.
- Existing map-total assertions in suites 58, 98–104, 201, 207, 218 and 301:
  1273 → 1309 for the 36 new discrete rooms; previous substantive geography
  assertions remain intact.
- `test/cases/52-stable-persistence-ids.test.js`: preserves exact old IDs and
  adds the three new chest IDs and six new enemy identities.
- `test/cases/186-enemy-capability-migration.test.js`,
  `188-status-specials-party-combat.test.js`,
  `189-unusual-enemy-capabilities-party-combat.test.js`,
  `191-universal-party-combat-compatibility.test.js` and
  `ENEMY_CAPABILITY_AUDIT.md`: extend the audited roster and exhaustive matrix;
  no historical mechanic assertions are removed.
- `test/transition-audit.js` and its generated output: 72 new directed doors.
- `test/south-ruins-depths-browser.html/js` and `Art/qa/south-ruins-depths/`:
  automated Chromium movement/visual evidence at native and 2× scale.
- `architecture.md`, `PROJECT_STATUS.md`, this document: ownership and review route.

All pre-existing MQ5/MQ6 edits remain present. Nothing is staged, committed or
pushed by this pass. See the QA README for final verification results.

## Playtest checklist

1. Before MQ6's paid report, visit West Passage, Deeper and try the barred stair
   at (6,11). Confirm the original chest and upward route still work.
2. Report Greybank to Voss, return and descend. Save/load on each floor.
3. Explore across each three-column floor; check the increasingly indirect
   stair routes and the extra rooms beyond the floor-five/six descents.
4. Find the floor-two and floor-four coffers; descend from floor six into the
   final vault. Reload and inspect again to check the rewards remain taken.
5. Fight the distorted monsters with normal equipment. Check animation, escape,
   acid/curse, healing supply pressure and whether HP needs editorial tuning.
6. Climb all the way back to the old ruins and the original overworld entrance.

Automated strong-party combat checks prove lifecycle correctness, not human
balance. The final HP curve and length of a full exploration run merit playtesting.
