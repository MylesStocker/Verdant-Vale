# Rocky Beach — Valmere

Authored against clean main at 286911f. New stable tile 134; SAVE_VERSION 5.

603 terrain-only cell changes across 23 existing chunks: wave-washed grey
shingle on selected Valmere shores. Only existing grass (119), reeds (8), exposed stone (5) and gravel (471)
change. Sixteen chunks are accessible; seven remain scenery. Roads, trees, water, content, map metadata, structural seams, camera
settings and access are identical to the baseline. Gravel shore continues
across screen boundaries; sheltered reed beds remain. Exact coordinates and
old/new tile IDs are in [grid-deltas.json](grid-deltas.json). Historical
fingerprints remain strict via detached, exact-cell reversals.

## Encounters

The canonical standing tile selects the registered Rocky Beach profile.
Other terrain retains the chunk pool; location permissions still apply. One
cell read per lookup, no cache, RNG, save field or persistent mutation.
Normal single-enemy encounters have equal selection weight:

| Enemy | HP | ATK | DEF | SPD | XP | Gold | Existing mechanic |
|---|---:|---:|---:|---:|---:|---|---|
| Shingleback Crab |150|34|16|8|90|18–28|30% Brace|
| Storm Gull |105|38|7|25|95|20–30|Steals gold on a landed hit, then attempts to flee; defeat it to recover stolen gold|

Both have dedicated deterministic animated Canvas sprites and Observe text.
Neither appears in other encounter pools. The existing rare 23 override
remains unchanged. No new enemy mechanics, drops, quests or progression rules.

## Changed grids

| Map | Chunk | Changed cells | Access |
|---|---|---:|---|
| EASTERN_FENS_ENVELOPE_C14RN1_MAP | (14,-1) | 13 | existing accessible |
| VALMERE_EXPANSE_C14RN6_MAP | (14,-6) | 37 | existing accessible |
| VALMERE_EXPANSE_C15RN5_MAP | (15,-5) | 44 | existing accessible |
| VALMERE_EXPANSE_C14RN4_MAP | (14,-4) | 40 | existing accessible |
| VALMERE_EXPANSE_C14RN3_MAP | (14,-3) | 43 | existing accessible |
| VALMERE_EXPANSE_C14RN2_MAP | (14,-2) | 26 | existing accessible |
| VALMERE_EXPANSE_ENVELOPE_C13RN7_MAP | (13,-7) | 52 | scenery |
| VALMERE_EXPANSE_ENVELOPE_C14RN7_MAP | (14,-7) | 21 | scenery |
| VALMERE_EXPANSE_ENVELOPE_C15RN6_MAP | (15,-6) | 4 | scenery |
| MAINLAND_C10RN6_MAP | (10,-6) | 1 | existing accessible |
| MAINLAND_C27RN2_MAP | (27,-2) | 44 | scenery |
| MAINLAND_C28RN2_MAP | (28,-2) | 37 | scenery |
| MAINLAND_C29RN2_MAP | (29,-2) | 26 | scenery |
| MAINLAND_C20RN1_MAP | (20,-1) | 58 | existing accessible |
| MAINLAND_C22RN1_MAP | (22,-1) | 4 | existing accessible |
| MAINLAND_C23RN1_MAP | (23,-1) | 12 | existing accessible |
| MAINLAND_C24RN1_MAP | (24,-1) | 41 | existing accessible |
| MAINLAND_C20R0_MAP | (20,0) | 22 | existing accessible |
| MAINLAND_C21R0_MAP | (21,0) | 51 | existing accessible |
| MAINLAND_C22R0_MAP | (22,0) | 8 | existing accessible |
| MAINLAND_C10RN9_MAP | (10,-9) | 2 | existing accessible |
| MAINLAND_C29RN1_MAP | (29,-1) | 12 | scenery |
| MAINLAND_C10RN12_MAP | (10,-12) | 5 | existing accessible |

## Verification

- Suites 345/346: exact whole-world/metadata/edge baseline outside the reviewed
  cells; original tile properties; only two exclusive enemies; both movement
  modes; save/load; actual held-input random encounter entry; singleton and
  party Attack/Observe; deterministic animated sprites and bounds; constant-work
  read-only geography and live-grid invalidation; malformed profiles fail closed.
- Chromium: 59 checks at 512×480 and 1024×960, including held-key beach
  entry/return in both views, saves, real random-encounter dispatch and ordinary
  Attack victories against both enemies. Controlled RNG and a durable QA party
  make this functional evidence, not a difficulty playtest.
- Visual inspection: coastal shingle and both sprites at native/2× scale.
- Final regression: **282/282 pass**, including 143,712 ordinary-formation
  preparations. Syntax: all 30 changed JavaScript files pass. Validation:
  **zero errors, six unchanged warnings**. All 1058 fingerprints verify.
  `git diff --check` and conflict-marker checks pass; SAVE_VERSION stays 5.
- Regenerated: 23 grid fingerprints, atlas Markdown, inventory hashes, SVG and
  production-painted overview. Transition audit still matches; not regenerated.

## Short playtest

1. Visit Valmere — Shingle Shore at (14,-3), walk from grass onto grey stones
   around local (9,5), save/load, then return inland.
2. Explore Shingle Headlands at (20,-1), and the small western-bank pocket at
   (10,-12). Water remains solid; existing routes remain available.
3. On the beach with debug mode off, encounter both enemies. Watch the crab
   brace; let the gull steal, then defeat it before it escapes. Check Observe.
4. Return to grass/reeds and check that ordinary regional enemies resume.

No manual human playthrough or balance certification is claimed.

## Exact uncommitted file inventory

Runtime changes cover terrain, pool resolution/validation, enemy content and
programmatic art. Tests extend registry totals and preserve earlier geography
assertions; documents and QA images record the implementation.

- `Art/qa/regional-geography/inventory.json`
- `Art/qa/regional-geography/overview.svg`
- `Art/qa/regional-geography/production-overview.png`
- `Art/qa/rocky-beach/MAINLAND_C10RN12_MAP-1x.png`
- `Art/qa/rocky-beach/MAINLAND_C10RN12_MAP-2x.png`
- `Art/qa/rocky-beach/MAINLAND_C20RN1_MAP-1x.png`
- `Art/qa/rocky-beach/MAINLAND_C20RN1_MAP-2x.png`
- `Art/qa/rocky-beach/README.md`
- `Art/qa/rocky-beach/VALMERE_EXPANSE_C14RN3_MAP-1x.png`
- `Art/qa/rocky-beach/VALMERE_EXPANSE_C14RN3_MAP-2x.png`
- `Art/qa/rocky-beach/browser-review.json`
- `Art/qa/rocky-beach/enemy_shingleback_crab-1x.png`
- `Art/qa/rocky-beach/enemy_shingleback_crab-2x.png`
- `Art/qa/rocky-beach/enemy_storm_gull-1x.png`
- `Art/qa/rocky-beach/enemy_storm_gull-2x.png`
- `Art/qa/rocky-beach/grid-deltas.json`
- `ENEMY_CAPABILITY_AUDIT.md`
- `OVERWORLD_ATLAS.md`
- `PROJECT_STATUS.md`
- `REGIONAL_GEOGRAPHY_PLAN.md`
- `architecture.md`
- `combat.js`
- `content/maps/eastern-fens-maps.js`
- `content/maps/mainland-maps.js`
- `content/maps/valmere-expanse-maps.js`
- `data.js`
- `encounter-geography.js`
- `enemy-catalog.js`
- `render-battle.js`
- `render-tiles.js`
- `test/cases/101-west-outfall-canal-tunnel.test.js`
- `test/cases/186-enemy-capability-migration.test.js`
- `test/cases/187-brace-capability-party-combat.test.js`
- `test/cases/188-status-specials-party-combat.test.js`
- `test/cases/189-unusual-enemy-capabilities-party-combat.test.js`
- `test/cases/191-universal-party-combat-compatibility.test.js`
- `test/cases/317-mainland-navigation.test.js`
- `test/cases/322-wetwoods-thornmere.test.js`
- `test/cases/323-valmere-shoreline.test.js`
- `test/cases/345-rocky-beach.test.js`
- `test/cases/346-rocky-beach-art.test.js`
- `test/cases/52-stable-persistence-ids.test.js`
- `test/cases/59-enemy-pool-registry-consumers.test.js`
- `test/cases/76-geographic-encounters.test.js`
- `test/cases/86-regional-chunk-catalog.test.js`
- `test/fixtures/regional-grid-fingerprints.js`
- `test/fixtures/rocky-beach-history.js`
- `test/fixtures/rocky-beach-invariants.json`
- `test/regional-atlas.js`
- `test/rocky-beach-browser.html`
- `test/rocky-beach-browser.js`
- `tiles.js`
- `validation.js`
