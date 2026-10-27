# Reedbank river wrestling

## Player experience

Reedbank is entered through the rural marker on the western bank of overworld
chunk `(22,3)` (`MAINLAND_C22R3_MAP`), local tile `(3,8)`. It has seven modest
homestead facades, three shaded mushroom-log plots, six outdoor residents and
Nella's accessible provisions shop. The homes are facades, not enterable rooms.
The riverbank referee Tavin offers bouts against Orren. No quest gate or reward
flag is added. Names, dialogue, stakes and sport tuning are revisable content.

The lore basis is `LORE.md`'s river-wrestling paragraph: a popular ordinary
people's sport, with regional variations. Reedbank uses first shoulders to the
water and immediate release, not the Drenwick circuit's prolonged holds. There
are no punches, kicks, gouges, combat injuries, fatalities or equipment bonuses.

- **Practice:** free, no winnings or losses.
- **Paid bout:** 10g deducted on starting, not on viewing the rules. Winning pays
  20g including the stake (net +10g). Losing or giving in loses the 10g stake.
- **Footwork:** left/right arrows or A/D. Down/S braces against shoves and
  restores footing/stamina. Wrestlers cannot pass through each other.
- **Z:** grip. **X:** shove to reduce footing. **C:** throw a gripped opponent
  whose footing is in the orange portion (40 or less).
- **Space:** break a grip/backstep at a stamina cost. **Escape:** cancel the
  rules screen for free, or give in during the bout, losing a paid stake.
- **Enter/Space:** start or acknowledge a finished bout. The result holds briefly
  before acknowledgement; held/native-repeat keys cannot skip these boundaries.

Orren approaches, shoves, grips and throws, braces when unsteady and can break
an aging grip. Telegraphs, footing and stamina are visible. There is one
repeatable opponent, with no tournament, multiplayer, career or betting economy.
A fresh-key input sequence can win in approximately five seconds; an idle player
loses. Longer defensive play remains possible. This is a small playable MVP,
not a general-purpose fighting-game engine.

## Geography and transitions

The sole existing-grid delta is `MAINLAND_C22R3_MAP[8][3]`: `GRASS (0)` to
`FARM_HOUSE (54)`. Its authored note now identifies the village entrance. The
river, crossing, chunk edges, encounters and camera policy are unchanged.

| Source / trigger tile | Destination | Arrival pixels | Facing |
|---|---|---|---|
| Mainland C22R3 `(3,8)` | Reedbank village | `(240,432)` | up |
| Village `(7,14)` | Mainland C22R3 | `(112,304)` | down |
| Village `(8,6)` | Reedbank Provisions | `(240,432)` | up |
| Provisions `(7,14)` | Village | `(272,240)` | down |

Both new 16×15 discrete maps use the existing catalogue, neutral location-state
contract, canonical placement, collision and point-transition helper. No new
regional chunks, seams, tile types, camera changes or early-game access routes.
Village and shop disable random encounters and allow ordinary field saves.
There are now 1247 maps, still 1058 regional chunks and 1946 continuous seams.
The existing overworld source chunk retains its hard encounter profile.

## Residents and economy

| ID | Name | Place / role |
|---|---|---|
| `reedbank_tavin` | Tavin | Riverbank referee and purse keeper |
| `reedbank_orren` | Orren | Mushroom-log labourer and wrestler |
| `reedbank_bessa` | Bessa | Mushroom grower at the western plots |
| `reedbank_fenn` | Fenn | Homestead resident repairing roofs |
| `reedbank_oda` | Oda | Spectator with practical wrestling advice |
| `reedbank_sel` | Sel | Grower arranging mushroom sales |
| `reedbank_nella` | Nella | Provisions shopkeeper beside the counter |

All seven use the normal programmatic NPC sprites and repeatable dialogue.
They are stationary, positioned outside required routes. Nella uses the shared
shop purchase/sale authority with registered Potion, Bait and Reed Remedy stock.
No new items, equipment tiers, persistent NPC schedules or rareborn identities.

## Ownership and persistence

`river-wrestling.js` owns a private transient bout, deterministic 60Hz steps,
windups, recovery, grip, stamina, footing, AI, result and one-time settlement.
`getView()` returns a copy. `render-river-wrestling.js` paints it without mutation.
This is a sport, not a battle adapter: ordinary combat actors, health, statuses,
inventory, equipment and reward receipts are never borrowed or rewritten.
Only `stats.gold` changes. No new save fields or flags; `SAVE_VERSION` stays 5.

`input.js` remains the sole physical-key owner, passing held movement/brace and
fresh action presses. World update returns early for the bout. The shared
activity owner blocks combat preparation/execution, fishing, travel and story
checkpoint entry. The ordinary input router cannot open menus or warp panels.
`transitionToLocation`, `canSaveHere`, `saveGame` and `loadGame` refuse an active
bout, including its ready/result screens. Leaving the result releases movement
without releasing held action latches. Gold is persisted through normal saves
after returning to the bank. As with other unsaved gameplay, closing/reloading
the browser abandons progress since the last save; no automatic save is added.

## Verification

Baseline immediately preceding this addition: 263/263 suites passing.
Final complete regression: **265/265 passing** (`node test/run.js`). All 36
changed/new JavaScript files pass `node --check`; `git diff --check` is clean.
The complete transition audit passes 448 fixed journeys, 8 preserved-coordinate
journeys and 2026 edge segments, with zero dimension mismatches across 1247 maps.
All 1058 regional fingerprints match and all 490 NPC IDs are unique. Save version
remains 5. Native/2× wrestling browser review and the existing regional geography
browser review both pass with zero browser errors.

Git remains on `main` at `d2861931401ccb6256137ae76646610cecb48084`.
Nothing was staged, committed, merged or pushed. The exact current-task file
manifest is below; previous dirty quest, watchhouse and presentation work remains
preserved, including overlapping shared integration files.
Focused suites 328 and 329 exercise real key input, win, AI loss, giving in,
practice, insufficient funds, no duplicate payout, save/load exclusion and
post-result gold continuity, unchanged party/quest/location state, read-only
rendering, copied views, defensive controls, repeat-key isolation, 30/60Hz
agreement, both movement modes, every resident's reachable interaction, shop
purchase, nested save/load and the complete mainland/village/shop return route.

Reproduce the browser review with
`VV_BROWSER_PAGE=river-wrestling-browser.html node test/run-browser-smoke.js`.
Set `VV_BROWSER_OUTPUT` to an external directory to capture the screenshots.

Automated Chromium checks at 512×480 and 1024×960 cover the actual movement and
input routes, shop, save/load, rules, grip, shoulder-contact reveal, win and loss.
These are automated browser checks with inspected screenshots, not human
playtesting. Game-data validation: zero errors and the same six existing warnings.

Geographic evidence regenerated only because the one source tile changed:
`test/fixtures/regional-grid-fingerprints.js` (one hash), regional atlas live
inventory/vector/production overviews, and `test/transition-audit-output.json` (two maps and
four new door journeys). The audit now exercises the ordinary cell dispatcher.
Other pre-existing watchhouse/quest changes remain separate, uncommitted work.

## Short playtest route

1. Reach overworld chunk `(22,3)`; enter the little building on the west bank.
2. Walk around the seven homes and mushroom beds; speak to Oda for advice.
3. Enter Provisions, buy an item, save/load and walk back out.
4. Speak to Tavin beside the lower rope. Try free practice: approach, shove,
   grip and throw. Test bracing and Space to break a grip.
5. Play a 10g bout. Check +10g net for a win and −10g for a loss/giving in.
6. Leave through the southern path and confirm the riverbank return is safe.

## Deferred

More opponents, distinct tactics, tournaments, sound effects, bespoke portraits,
enterable homes, household schedules and tracked sporting achievements. Future
changes to stake sizes or AI should be playtested before treating them as balance
commitments. This pass does not alter Mornay or the existing Drenwick circuit.

## Files in this increment

Existing dirty work was snapshotted before editing and preserved. This list is
the wrestling/village increment, not the unrelated earlier uncommitted work.
The earlier map-count assertions change to the legitimate 1245 → 1247 total.
Suite 58 also checks the expanded NPC aggregate and exact handler order. Suites
322–323 verify the one approved marker/note change, then normalize detached
copies to compare every other value against their unchanged historical fixtures.

- `Art/qa/regional-geography/inventory.json`
- `Art/qa/regional-geography/overview.svg`
- `Art/qa/regional-geography/production-overview.png`
- `PROJECT_STATUS.md`
- `RIVER_WRESTLING_PLAN.md` — new
- `activity-ownership.js`
- `architecture.md`
- `content/interactions/reedbank-interactions.js` — new
- `content/maps/mainland-maps.js`
- `content/maps/reedbank-maps.js` — new
- `content/npcs/reedbank-npcs.js` — new
- `data.js`
- `index.html`
- `input.js`
- `interactions.js`
- `movement.js`
- `npcs.js`
- `render-river-wrestling.js` — new
- `render.js`
- `river-wrestling.js` — new
- `save.js`
- `shops.js`
- `test/cases/100-east-causeway.test.js`
- `test/cases/101-west-outfall-canal-tunnel.test.js`
- `test/cases/102-north-basin-drowned-rim.test.js`
- `test/cases/103-north-basin-mirewood.test.js`
- `test/cases/104-eastern-reaches-abandoned-farmhouse.test.js`
- `test/cases/201-travellers-rise-campsite.test.js`
- `test/cases/207-travellers-rise-campfire-night.test.js`
- `test/cases/218-mornay-exterior-topology.test.js`
- `test/cases/301-mornay-manifest.test.js`
- `test/cases/328-river-wrestling.test.js` — new
- `test/cases/329-reedbank-village.test.js` — new
- `test/cases/58-regional-content-split.test.js`
- `test/cases/98-thornmere-upper-shallows-scenery.test.js`
- `test/cases/99-thornmere-canal-head.test.js`
- `test/fixtures/regional-grid-fingerprints.js`
- `test/river-wrestling-browser.html` — new
- `test/river-wrestling-browser.js` — new
- `test/transition-audit-output.json`
- `test/transition-audit.js`
- `validation.js`
- `world-transitions.js`
- `test/cases/322-wetwoods-thornmere.test.js`
- `test/cases/323-valmere-shoreline.test.js`
