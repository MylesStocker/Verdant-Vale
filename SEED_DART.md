# Seed Dart — implementation and review

Work is in the existing `main` checkout, starting at
`1519a92fbdd63b55241888c5917372a18351528d`. Earlier uncommitted MQ5/MQ6/MQ7,
South Ruins and Meat Paw work is preserved. This increment is uncommitted.

## Ability and balance

Esla learns `seed_dart` through her frozen character learnset at level 11.
An existing recruited Esla needs no recruitment replay or save migration.
The canonical element is `bloommarked`; each execution targets the selected,
exact living enemy, consumes one **Dart Seed**, and applies existing **Strain 1**.
There is no poison, MP, status rider, new equipment tier or added reward roll.

The existing offensive Resonance formula is `max(1, 75 - enemy.def)`.
It has no attack variance, critical roll or ordinary Attack evasion roll. It
uses the same defensive/capability path as Null/Rainbow, not the projectile Item
or melee path. No new elemental resistance model is introduced.

Level-11 Esla has 16 base Attack plus 12 from the recruitment Dragon Blade:
28 effective Attack. Against a plain enemy with the following defence,
her noncritical Attack varies over `max(1, round(28 * [0.8,1.2) - defence))`.

| Enemy defence | Noncritical Attack range | Seed Dart |
|---:|---:|---:|
| 0 | 22–34 | 75 |
| 7 | 15–27 | 68 |
| 12 | 10–22 | 63 |
| 30 | 1–4 | 45 |

Damage is capped by remaining target HP. The shared formula still floors damage
at 1 against very high defence, and an executed cast still spends its seed.
Strain retains the application-round exemption and one full recovery round.
This is a representative arithmetic comparison, not a full campaign balance
playthrough. Power 75 and price 4g are revisable balance content.

## Cost and ownership contract

The optional closed technique field is
`reagentCost: {itemId: 'Dart Seed', quantity: 1}`. Its ID must be a registered
ordinary `component`; quantities must be positive safe integers. Component
items have only `name`, `type` and a nonnegative integer `price`. Unknown fields,
IDs, incompatible item types and malformed quantities reject. Validated
techniques and their nested costs are frozen.

The existing draft reservation mechanism aggregates Item and reagent costs
against one battle inventory. Confirming a complete target draft reserves;
selecting a menu row alone does not. Backtracking/removing that draft releases
its reservation. Combined-technique consent would pay once on the initiating
command, not once per partner. All committed commands undergo full aggregate
preflight before RNG or combat mutation.

Execution checks ordinary actor/target availability first. A dead, disabled or
departed participant/target cancels under existing rules without spending or
Strain. A valid cast removes the cost from battle-local inventory once. Its
existing effect event gains a frozen `reagent` witness containing ID, quantity
and ordered inventory before/after. Replay independently verifies that sequence,
matching damage, Strain and final state. It never spends live inventory or
consults the live reservation helper. Reagent-free effect events retain their
historical shapes and RNG order.

Canonical victory/escape/defeat use authenticated terminal writeback. Lab exit
throws away temporary spending. Story contexts carry their own inventory and
restore only the current battle's entry resources on retry. Nothing separately
deducts from `stats.items` during a cast. No save field or version change:
**SAVE_VERSION remains 5**.

The new optional battle capability `level` is copied from the existing persistent
character level at preparation and validated in historical snapshots. It is not
a new persistent authority. Bindings without this field preserve their older
shape and baseline knowledge; item possession grants no technique entitlement.

## Supply and presentation

- Production `completeMq5Assignment()` grants ten seeds, protected by the
  existing once-only MQ5 boundary. Structural `joinEsla()`, loading and temporary
  reunions grant none. Old saves receive the ability, not a retroactive kit.
- Post-recruitment Story Checkpoint Lab fixtures explicitly replace inventory
  with a kit including ten seeds. Assignment Ready starts without them, then
  receives ten through normal recruitment. Cleanup itself grants nothing.
- Melva at **Stern Apothecary**, Mornay South Upper East, sells unlimited
  individual seeds for **4g**. Bait costs 6g and existing fen banes 8g; seeds are
  deliberately cheaper. Ordinary purchasing, resale and saving apply.
- `pickup_fen_dart_seed`: **MAP3_N1**, local tile **(9,8)**, one split seed-pod
  among reeds. Grants one seed on examination.
- `pickup_basin_dart_seed`: **NORTH_BASIN_S_MAP**, local tile **(10,6)**, one dry
  pod among withered stalks. Grants one seed on examination.

Both pickups are ordinary one-time stable IDs. No terrain cell, seam, map,
camera, encounter table or story boundary changed. Existing pickup order was
preserved. Atlas inputs/grids did not change, so no geographic artifact was
regenerated.

Seeds stack in ordinary inventory. They are neither equipment nor a directly
usable field/battle Item. Shared and historical battle menus omit them; field
targeting returns no eligible recipient. The Resonance list uses its existing
technique name/Strain presentation, with no seed counts, requirements or missing
seed text. Damage uses the existing Resonance message/presentation; no bespoke
projectile graphic or menu redesign was added.

## Verification and walkthrough

Focused suites 356–357 cover level gating, existing recruitment, cost validation,
competing synthetic actors, backtracking, last seed, cancellations, Strain,
exact damage/RNG, immutable and tampered histories, canonical terminal spending,
Lab discard, story carryover/retry, pods, merchant price and saves. Existing
shared-engine, Quickbloom, Eclipse, story-cutaway, historical Attack/Item and
shop suites remain substantive. Component-aware Item expectations were updated;
old renderer hashes are retained after normalizing only the intentional Item
list helper call. No historical combat baseline was regenerated.

The automated Chrome keyboard/Canvas pass performed **124 assertions** and
produced **10 captures**, at native 512×480 and nearest-neighbour 1024×960.
It cast Seed Dart, cancelled a ready draft, spent the last seed, checked the
next list, healed with Quickbloom, escaped with inventory writeback, saved/loaded,
and bought two seeds for 8g at the actual apothecary. Combat setup uses explicit
fixtures; this was not a human campaign playthrough. Captures were visually
inspected for menu fit, damage wrapping and shop readability.

For manual review:
1. Load the MQ7 Ready checkpoint, or recruit Esla normally through MQ5.
2. In a wilderness fight, choose Esla → Resonance → Seed Dart; backtrack once,
   then cast. Confirm the selected enemy takes damage and Esla needs a recovery round.
3. Spend the final seed. After Strain clears, Seed Dart is unavailable; wounded
   allies still permit Quickbloom.
4. Escape/finish, inspect inventory, save/load and buy more at Stern Apothecary.
5. Examine the two seed pods and revisit after loading to confirm no duplicate.

Evidence: [native list](Art/qa/seed-dart/technique-list-1x.png),
[2× damage](Art/qa/seed-dart/seed-dart-impact-2x.png),
[2× merchant](Art/qa/seed-dart/apothecary-stock-2x.png),
[browser results](Art/qa/seed-dart/browser-results.json).


## Incremental files

Earlier dirty files outside this list were not edited by this task.

| Files | Change |
|---|---|
| `resonance.js` | Seed Dart definition, validated cost, level eligibility and shared draft-cost query. |
| `persistent-party.js` | Esla learnset and copied battle capability level from the existing member authority. |
| `combat.js` | Inventory-only components, aggregate draft/preflight reservations, execution witnesses and independent replay verification; shared legacy Item filtering. |
| `items.js`, `shops.js` | Registered Dart Seed and Stern Apothecary stock at 4g. |
| `quests.js` | Ten seeds at successful production MQ5 recruitment. |
| `story-checkpoint-lab.js` | Explicit ten-seed inventory for post-recruitment fixture replacement. |
| `render-battle.js` | Legacy Item list uses the shared component filter; no art/layout changes. |
| `content/maps/thornmere-wilds-maps.js`, `content/maps/north-basin-maps.js` | Two examine-only pods in existing item sets; zero grid-cell changes. |
| `LORE.md`, `architecture.md`, `PROJECT_STATUS.md`, `SEED_DART.md` | Ability canon, ownership contract, status and review evidence. |
| `test/cases/356-seed-dart.test.js`, `test/cases/357-seed-dart-owners.test.js` | Focused ability, cost, cancellation, replay, ownership and supply tests. |
| `test/cases/149-formation-battle-rendering.test.js`, `test/cases/169-party-combat-visual-convergence.test.js` | Preserve historical rendering hashes while accounting only for the component Item-list filter. |
| `test/cases/154-formation-command-rounds.test.js`, `test/cases/155-formation-four-command-integration.test.js`, `test/cases/171-party-command-status-hardening.test.js`, `test/cases/172-party-command-playback.test.js` | Exhaustive inventory/action distinction and direct component-action rejection; existing Item coverage retained. |
| `test/cases/179-mq5-esla-recruitment.test.js`, `test/cases/192-story-checkpoint-lab.test.js` | Exact ten-seed recruitment/fixture expectations. |
| `test/cases/180-resonance-mvp.test.js`, `test/cases/183-canonical-party-combat-integration.test.js`, `test/cases/185-canonical-battle-envelope.test.js` | Explicit new technique registry expectations; existing mechanics assertions retained; reusable test helpers exported. |
| `test/cases/196-party-unequip-and-resonance-availability.test.js` | Healthy Esla can cast with seeds; without seeds Quickbloom retains its wound requirement. |
| `test/cases/304-mornay-shop-controller.test.js`, `test/cases/52-stable-persistence-ids.test.js` | Exact new shop stock/price and two added pickup IDs. |
| `test/seed-dart-browser.html`, `test/seed-dart-browser.js` | Isolated real-keyboard/Canvas test page. |
| `Art/qa/seed-dart/` | Ten named PNG captures, browser result JSON and verification record. |

The ten images are `technique-list`, `seed-dart-impact`, `last-seed-spent`,
`quickbloom`, and `apothecary-stock`, each suffixed `-1x.png` and `-2x.png`.

## Final verification result

- Complete regression: **293/293 suites passed**, zero failures.
- Syntax: **99 changed/new JavaScript files passed** across the combined working tree.
- `validateGameData()`: **zero errors**, six existing warnings (decorative noticeboard,
  Zolom attack, Takomo generic sprite, unused Eastern Fens pool, two long dialogues).
- All **1,059 regional fingerprints** match; read-only transition audit matches its
  existing artifact (589 fixed destinations, eight preserved-coordinate transitions,
  2,072 edge segments and 42 house doors). No geographic artifact was regenerated.
- Automated Chrome: **124 assertions**, ten captures, zero errors, at both scales.
- Both new pods have collision-valid examination approaches; focused tests exercise
  their actual examine input and save/load persistence.
- `git diff --check` passed. SAVE_VERSION remains **5**. No earlier file was removed.

This task modifies 27 existing files and adds 17 files, including this document,
focused tests, browser harness and QA evidence. The other 1,208 task-entry files
retain their exact hashes. Final branch is `main`; HEAD remains
`1519a92fbdd63b55241888c5917372a18351528d`. Combined status is 84 tracked modified
files and 224 untracked files, with nothing staged. Earlier dirty work remains;
nothing was committed, merged, rebased or pushed. Other worktrees were untouched.

Machine-readable evidence and the exact incremental file list:
[verification record](Art/qa/seed-dart/verification.json).
