# Architecture

## Current maintenance contracts

Historical pass descriptions below record how systems were introduced. The
current authorities take precedence: save version 5 accepts only current saves;
`save.js` no longer ships executable old-version migrations. Frozen legacy ID
tables remain solely for registry-integrity evidence.

- `activity-ownership.js` reads exclusive owners without acquiring or releasing
  them. Water travel rejects every competing owner. Combat adds the shared
  travel/story exclusions while preserving its own Lab, Receiver, scripted-token
  and playback validation. Direct canonical preparation cannot bypass travel.
- `persistent-party.js` retains the highest numbered `canonical_encounter_N`
  reward receipt plus independently named story receipts. Old numbered receipts
  reject as stale; the most recent exact duplicate remains an idempotent no-op.
  Existing version-5 histories validate fully, then compact on load without
  re-awarding anything. IDs advance from the retained ordinal, never array size.
  No save field, inventory cap or content-count limit is added.
- `game-loop.js` supplies elapsed presentation time separately from the existing
  simulation delta. Ferry progress and Quickbloom update through their controllers;
  drawing does not advance either timer. Direct headless ticks still mean one
  authored frame. Quickbloom blocks playback even before its first update.
- `enemy-catalog.js` owns the unchanged authored templates, pool inventory and
  stable template registry, loaded immediately before `combat.js`. Combat keeps
  execution/installation. This is a bounded extraction, not a combat rewrite.
- `test/transition-audit.js` witnesses committed placement and checks the final
  destination. School stairs execute real movement. CLI verification is read-only;
  only `--write` regenerates the report after an intentional reviewed change.
- Headless Canvas supports an explicit API set; unknown method calls fail.
  Its fixed historical text metric is not visual evidence. Run
  `node test/run-browser-smoke.js` for actual DOM/Canvas/font checks in an isolated
  Chromium profile. `VV_BROWSER` selects an installed executable and
  `VV_BROWSER_OUTPUT` optionally saves PNG captures outside the repository.
- `test/validation-warning-baseline.json` explains reviewed warnings without
  suppressing them; suite 253 rejects newly introduced warnings. Dedicated enemy
  artwork remains a content decision, and long authored text is browser-tested.

Suite 252 is the unchanged house/cat suite formerly sharing prefix 61 with the
journal suite. Discovery now rejects duplicate numeric prefixes. Suite 253 covers
ownership, bounded receipts, elapsed animation, audit failure injection and the
warning baseline. Existing combat tests advance presentation time explicitly
before simulated acknowledgement; historical combat projections are unchanged.


## Two Jorans quest ownership

`two-jorans.js` owns the case and reward. The two ordinary numeric quest bindings
are declared in `quests.js`, mirrored by its existing sync, and registered in
`save.js`: stage 0–4 and a four-bit evidence set. Missing fields in pre-feature v5
saves default to zero. A shared invariant checks evidence and exact key ownership
before save and candidate load; no new payload container or version is added.
Dialogue callbacks recheck stage and proximity. Inventory claim consumes the key,
adds five existing items and closes the claim synchronously. Rendering and journal
reads do not mutate state. Beck’s released location derives from quest stage.
NPC and speaker fragments join the normal registries; the ordinary interaction
dispatch intercepts only the five named participants. Esla uses availability, not
merely recruitment, when filtering speaker pages. No map or transition changes.
Suites 330–331 cover control-driven interactions and persistence boundaries.

## Reedbank sport and village

`content/maps/reedbank-maps.js` owns two discrete grids, a four-entry reciprocal
point-door table and their content keys. `data.js` registers the maps;
`content/npcs/reedbank-npcs.js` joins `SIMPLE_NPCS`; the interaction fragment joins
`MAP_FEATURES` and routes NPC/shop interactions. `reedbankTryDoor()` is called by
ordinary movement and delegates every placement to `transitionToLocation`.
No regional alias, location-mode flag, camera change or new tile type is added.

`river-wrestling.js` owns a session-only sport, never a combat party or actor.
Its only persistent write is gold: deduct on paid start, settle once on a result.
Private footing/stamina/AI advance at 60Hz from elapsed simulation time. Rendering
consumes a copied view and remains read-only. The two new render functions live
in `render-river-wrestling.js`; village props remain aligned with blocking grids.

`input.js` owns all physical keys and passes normalized held movement/brace plus
fresh action presses. Its sport boundary retains action latches. The shared
activity owner excludes combat/fishing/travel/checkpoint ownership; movement
returns early, transitions and save/load reject active ready/fight/result states.
The sport adds no mutable save authority and preserves SAVE_VERSION 5. Suites
328–329 cover real controls, financial settlement, party isolation and navigation.

## Canonical party finalization policy (Pass 6)

See the current Pass 6 contract in `CANONICAL_PARTY_COMBAT.md`.
`partyTerminalOutcome` gives no-survivor defeat precedence in party resolution
and historical validation. `persistentParty.commitCombat` retains zero HP;
`awardRewards` grants full XP only to living terminal members, shared resources
once, and detached per-member/per-level presentation in stable slot order.
Canonical finalization prepends those pages without replacing authenticated
story callbacks. A failed reward commit keeps its receipt evidence and refuses
save/retry. `hasLivingMember` gates stable-field saving; load preparation rejects
all-Fallen data before writers. Field poison/Curse/cat damage preserve zero HP;
authored rest/treatment still restores Lely. No new persistent schema exists.

## Authenticated scripted party encounters (Pass 5)

`scriptedPartyEncounters` is the sole story-lifecycle owner for scripted fights
that remain reachable after canonical recruitment. Interaction, movement and
dialogue code still own proximity and authored choice prerequisites;
`scriptedCombatEntry` asks the lifecycle owner for a read-only canonical
preflight before consuming those UI states. The owner snapshots that exact UI
boundary so `validateInactiveCombatPreparation()` can inspect it without closing,
spoofing or rewriting it.

The lifecycle owner does not resolve combat. It issues a private token binding a
starter, ordered template and runtime enemy identities, lifecycle capability set, escape policy,
origin and objective. `canonicalPartyCombat`, `persistentParty` and the existing
standard session require the token through validation and installation. The
canonical resolver continues dispatching mechanics only through capability
metadata. Story finalization receives the exact token and terminal enemy snapshot
after authenticated canonical writeback/rewards and accepts it once.

Activation-time writes are limited to existing semantics: Kolm's stake, Lensweb
poison, Rainfish wake state and Mimic trap consumption. Persistent victory writes,
route items, board refreshes, payouts and follow-up callbacks occur only at
authenticated finalization. Pending Rainfish/Mire callbacks are origin-bound and
save-blocking. The fort trio remains singleton-owned and the Receiver trio remains
Formation-owned because both routes are necessarily resolved before MQ5.

Static `runLock` and `guaranteedDrop` fields remain capability metadata rather
than mutable actor fields. Observe-gated and guaranteed-drop behavior is read
from the validated mechanic profile; immutable battle snapshots carry only state
that can change during combat. This keeps duplicate instances independent and
avoids adding template metadata to result/playback schemas.

### Travellers' Rise ambush

`travellersRiseAmbush` owns the MQ5 road event's transient field presentation:
the exact Rise trigger, three projected actors, authored dialogue, deterministic
routes, reveal and Esla’s refusal of the demand. Its authenticated victory receipt hands presentation to the campsite owner after combat cleanup and reward acknowledgements. It delegates complete
formation preparation and the exact terminal receipt to
`scriptedPartyEncounters.startTravellersRise()`. That lifecycle definition binds
the stable Highwayman / Bridled Hollow / Fen Handler order and the ordinary
escape policy; combat mechanics remain capability-driven. The Bridled Hollow
combines the established Brace capability with the encounter lifecycle and
never depends on the Handler's runtime state.

Ordinary play starts the encounter without a payment choice or charge. Esla
refuses; the highwaymen threaten the party and fight. Existing historical paid
receipt fields and the dormant compatibility API remain loadable; they never
cause a new charge through this presentation. Only an authenticated victory writes
`travellers_rise_ambush_complete`. Finalization displays the existing XP, gold and
item receipt without awarding it twice. Nearby projected actors also answer
ordinary interaction before the unavoidable choke; conversation does not stage
routes from an arbitrary player position. Active staging/battle remains unsavable.
Movement routes and actors are session-only and are reset on load or developer
checkpoint application. No combat identity, route position or half-finished
cutscene enters the version-5 payload.

### Travellers’ Rise campsite introduction

`travellers-rise-camp.js` owns the automatic presentation after the ambush. It
waits for canonical combat finalization and every reward/level-up page to finish,
then validates both complete authored routes, speaker pages, placements and
exclusive route ownership before installing any pose. The real player is moved
through `placeAtLocation()` on each route tick; Esla has only a transient sprite
pose, with no copied HP/equipment/membership. Both use the existing waypoint
runtime and normal walking cadence. An optional owned-ID filter keeps unrelated
NPC routes frozen. The existing explicit player-collision exception now reaches
the regional route adapter as well as the local adapter; ordinary routes retain
their default collision behavior.

The single-tile rest marker overlays Travellers’ Rise `(6,4)` without changing
its grid. This entrance is separate from the ambush trigger `(10,7)` and the
onward east-exit gate; it never serves as the route choke. After victory the
first entry is automatic. Later interaction uses the same `enterTravellersRiseCamp()` fixed transition: local
`TRAVELLERS_RISE_CAMP_MAP`, arrival `(7.5,8.5)` in tile units. The local map is
16 columns × 15 rows, enclosed by trees and reeds, with a low ember ring and
three ordinary bedrolls and two decorative log seats north/south of the fire.
The logs have bark, grain and cut ends, with no sitting or collision behavior.
The camp has no random encounters, enemy spawns, combat triggers or hostile NPCs.
Its exit feature `(7,12)` returns to safe Rise tile
`(6.5,5.5)`. It has no regional placement, encounters or pickups. Merely entering
or completing the introduction has no rest effect.

The save-bound `travellers_rise_camp_stage` is closed: `0` introduction pending,
`1` rest agreed/night available, `2` full ambush/camp sequence completed. Stage
`2` is the one ordinary persisted completion receipt for the whole sequence; no
parallel completion flag exists. The introduction writes only `1`, on its final
acknowledgement; deliberate fire-ring interaction owns
the later night. Nonzero stages require MQ5,
canonical Esla membership and the authenticated ambush completion flag. Stable
campsite saves additionally require rest agreement. Active presentation refuses
save/load; a victory saved on the Rise before presentation resumes when the world
is ready. Load/checkpoint cleanup clears poses and callbacks, not saved story
progress. Exact session ownership makes stale callbacks inert. Faults retain
phase/message diagnostics, retire owned poses and release controls for load or
checkpoint recovery without advancing the story.

After agreement, both transient routes are retired and Esla’s projection is
removed; there is no follower system. The eastward gate remains closed until
stage `2`, with Esla’s reminder, while local exploration, camp exit/re-entry and
westward retreat remain available. Suite 201 covers the unchanged introduction.

### Travellers’ Rise campfire and night

`travellers-rise-night.js` is a bounded transient child of the camp owner, using
its existing input/save/interaction/update/cleanup gates and route validator.
At stage `1`, deliberate interaction within 65 native pixels of the cold ring
`(272,176)` starts it. `prepare()` checks exact map/MQ5/party/stage, neutral local
placement, all competing modal owners, every route cell, pairwise actor spacing,
seats, speaker pages and an ordinary-rest receipt before installing any pose.
The overworld entrance `(6,4)` and ambush trigger `(10,7)`/east-exit gate remain
separate and unchanged. The local camp is enemy-free at every stage.

Lely carries damp green branches; Esla walks to the dry material under the screen,
returns with kindling, and uses flint. Bloommarked resonance does not light the
fire. The two existing log seats at native `(272,128)` and `(272,224)` hold the
characters facing inward. Scene-only clipping preserves the established sprite
heads/torsos while adding bent knees; no ordinary sprite or follower changes.
`travellers-rise-night-dialogue.js` is immutable authored speaker-aware content:
Esla’s protective mother, emergency conservatorship, Academy and chosen Calwick
life follow LORE.md; Lely shares only present worries. Esla’s future secret is
undefined, lightly teasing and unrelated to plot. Her last line is “I promise.”

The fire progresses cold → kindling → embers → flame. A 60-update nightfall and
scene-local blue/warm pixel light field run below dialogue, with deterministic
flame and firelight animation. Rendering reads transient ticks; it consumes no
RNG and writes no story, combat or character state. A 48-update fade reaches one
fully black frame before completion, then holds black for 48 updates and fades
to dawn over 72. Both characters remain projected until safe control returns.
No lighting, pose or timer enters saves.

`persistentParty.prepareOvernightRest/validateOvernightRest/applyOvernightRest`
uses an opaque, single-use WeakMap receipt sealed against roster, resources,
revision and day. It follows existing bed/inn arithmetic: full HP (including
Fallen), removal of Poison/Muddied/Slither/Curse only, and day +1. Burn/Dazzled and
the stored Slither sample are retained, exactly as ordinary rest does; defeat
recovery is not called. Lely still uses stats/statusEffects; companions remain
private to persistentParty. No fee, dream, cat-quest callback, reward or XP is
attached to this campsite rest. Existing beds/inns remain unchanged.

Completion revalidates story ownership, both seat placements and the entire rest
receipt before mutation. It consumes the receipt and applies rest/day at full
blackout, while stage `1` remains authoritative through the black hold and dawn
fade. At completed morning it revalidates map, quest and membership, writes stage
`2`, updates derived journal text toward the Mornay regional office and releases
the existing east gate. A failed mirror write rolls stage back to `1`. MainQuest
stays `5`. Expected failure before this boundary retains stage `1`, diagnostics
and safe retry. Unexpected completion failure
retains its consumed receipt/diagnostic and refuses saving or blind replay;
loading a valid save or applying the Story Checkpoint resets transient ownership.
Active scenes refuse save/load. Stable stage `1` loads await deliberate interaction;
stage `2` loads show morning embers and never replay. SAVE_VERSION remains `5`
with no new payload field. Suite 207 is intentionally unused by the concurrent
202–206 terrain suites and covers this contract.

No build step: every file is a plain `<script src="...">` tag in `index.html`,
loaded in order. There are no `import`/`export` statements — a `const`/`let`/
`function` declared in one file is just a bare global name in every file
loaded after it. **Load order in `index.html` is load-bearing; don't reorder
scripts without checking this doc.**

Current integration totals: 251 maps, 115 regional chunks, 342 fixed-destination
transitions, 8 preserved-coordinate transitions, 240 edge-transition segments,
42 legacy house doors, 17 Mornay public-room doors and save version 5. Earlier subsystem
checkpoint references to version 4
describe their original increments; the persistent-party schema below is current.

### Mornay exterior topology

`content/maps/mornay-maps.js` owns Mornay's enterable exterior skeleton as one
closed `MORNAY_TOWN_LAYOUT` registry. Its 17 fixed-screen 16×15 maps use the
existing legacy-town architecture: catalog type `town`, ordinary town save
eligibility, no regional placement and no random encounters. The irregular
layout coordinates are:

| Position | Map ID |
|---|---|
| (0,0) | `MORNAY_OLD_FORT_MAP` |
| (0,1), (1,1) | `MORNAY_NORTH_UPPER_WEST_MAP`, `MORNAY_NORTH_UPPER_EAST_MAP` |
| (0,2), (1,2) | `MORNAY_NORTH_LOWER_WEST_MAP`, `MORNAY_NORTH_LOWER_EAST_MAP` |
| (0,3)–(3,3) | `MORNAY_MIDDLE_UPPER_WEST_MAP`, `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP`, `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP`, `MORNAY_MIDDLE_UPPER_EAST_MAP` |
| (0,4)–(3,4) | `MORNAY_MIDDLE_LOWER_WEST_MAP`, `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP`, `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP`, `MORNAY_MIDDLE_LOWER_EAST_MAP` |
| (1,5), (2,5) | `MORNAY_SOUTH_UPPER_WEST_MAP`, `MORNAY_SOUTH_UPPER_EAST_MAP` |
| (1,6), (2,6) | `MORNAY_WEST_GATE_MAP`, `MORNAY_EAST_GATE_MAP` |

`mornayTownNeighbor()` derives adjacency only from that registry.
`moveWithinMornay()` uses the four established town boundary tiles and canonical
`transitionToLocation()` with fixed, validated landings; there is no Mornay-only
camera or transition engine. The two `TOWN_ENTRANCE` cells on the regional crown
at `(7,3)` and `(8,3)` enter the West and East Gates respectively, and gate exits
return one tile south to `(7,4)` and `(8,4)`, facing down, beyond the entrance
triggers. The remaining upper four cells form the solid 2×3
overworld marker. Mornay does not roll the Calwick/Drenwick travelling-merchant cameo. The conventional debug destination enters West Gate.

The registered reserve labels for the western harbour identify an inert island
ferry berth and a future story-ship berth. They are ordinary deck presentation:
no ferry, island, ship or water-travel transition is registered. The population
pass adds explicit public-room doors, repeatable NPC dialogue and existing shop,
inn and treatment behavior. Berths, plot rooms and later story progression remain
inert. SAVE_VERSION stays 5; no town-specific persistent field was added.

### Canonical party encounters

`canonical-party-combat.js` owns real party encounters. One-member rosters
retain the singleton path in normal gameplay. `startCombat()` selects through the existing geographic
pool and overrides before calling the explicit `enter({enemies,escape})` boundary;
unsupported selections fail closed, without installing singleton state. Entry
accepts one to three exact capability-compatible templates (or template IDs), validates the
canonical roster, equipment, statuses, arithmetic, policy and cleanup readiness,
then obtains the private persistent-party bridge ticket. No combat RNG or identity
allocation occurs before validation. Selection RNG remains upstream of entry.

The standard session owns commands, exact targets, effects and historical playback.
Canonical resources remain with `stats`/`statusEffects`/`slitherSpd` and
`persistentParty`; authenticated terminal commitment occurs once. Victory grants
full XP to every living terminal member and shared rewards once through the existing
reward ledger; escape grants none. Defeat recovers all members and uses the shared
`applyCombatDefeatWorldRecovery()` time/gold/location authority. It never invokes
singleton cleanup. A failed resolution/finalization retains evidence, blocks
retry, simulation, saving/loading, and entry into other combat owners.

`render-party-battle.js` draws one detached immutable view. Enemy count alone
selects its presentation: one enemy reuses the exact Chapter One singleton
composition (`SINGLETON_ENEMY_BATTLE_LAYOUT`: sprite anchor 358/168, name 16/22,
HP track 16/26 at 130×7, HP text 152/33); two or three enemies retain the
Formation slots and strips. The Lab renderer is a thin caller of this shared
presentation; canonical combat has no Lab-state/API dependency. Input uses the
existing listener and key latch. `combat.active` retains
its singleton/Receiver meaning; canonical activity is explicit and session-owned.
Save version 5 and all persistent fields are unchanged. Suite 183 covers the bridge;
see [the encounter inventory and review checklist](CANONICAL_PARTY_COMBAT.md).

### Geographic formation bridge

`startCanonicalPartyEncounter()` normalizes the entire geographic table, validates
each actual party/enemy combination and the eligible Donkey override, then calls
`encounterFormations.select(pool)` once. Accepted inputs are exact registered raw
template arrays or frozen `{id, enemies, weight}` records with frozen ordered
one-to-three-ID arrays and positive safe weights. Malformed tables and predictable
authored preparation failures precede RNG, identities and gameplay mutation.

The selected IDs resolve in order through `ENEMY_TEMPLATE_REGISTRY`. Donkey's
eligible North Basin `< 1/16` check replaces the whole formation, followed by the
unconditional `< 1/256` generated-23 check; 23 wins if both succeed. Its seven
stat-generation draws occur only on success. One `canonicalPartyCombat.enter()`
call validates the actual final side and installs distinct fixed-slot instances.
The no-pool sentinel, pre-recruitment singleton path and cooldown/finalization
owners remain unchanged. See `CANONICAL_PARTY_COMBAT.md` for schema and draw order.

Claude may supply weighted pools/map assignments once this bridge reaches main,
without editing combat entry. Composition, weights, rates, permissions and Eastern
Fens content remain Claude-owned; this bridge changes none of them. Suite 194
covers ordered selection, duplicates, overrides, atomic failure and all nine sizes.

### Enemy capability authority — Pass 3

`enemy-capabilities.js` loads after `enemy-catalog.js` registers every template and `combat.js` supplies helpers,
but before `encounter-formations.js` prepares authored sides. It derives one deeply
frozen `{templateId, capabilities}` record per exact registered identity. Records
and arrays are closed plain data. Capability IDs are stable, unique strings from
`ENEMY_CAPABILITY_DEFINITIONS`; unknown IDs, unknown behavior-bearing template
fields, accessors, custom prototypes, mutable arrays, duplicate capabilities,
missing ordinary fields and stale registry coverage fail closed at startup or
preparation.

The canonical engine supports the mechanic registry `basic_attack`,
`standard_observe`, `standard_rewards`, `boss_escape_lock`, `brace`,
`curse_on_hit`, `void_shard_burst`, `acid_corrosion`, `slither_on_hit`,
`poison_spell`, and `dazzle_on_hit`. Compatibility is
set inclusion over the template's complete requirements. Template identity proves
registration only. `ENEMY_TEMPLATE_FIELD_CAPABILITIES` maps existing behavior
fields such as `defendChance`, `regenPerTurn` and `stealAndFlee` to explicit
requirements. `ENEMY_HIDDEN_CAPABILITIES` records behavior found in legacy
ID-specific execution or scripted outcome branches; it can only add requirements,
never approve an identity. `PARTY_ATTACK_TEMPLATE_IDS` no longer exists.

`preparePartyEnemyFormation()` requires exact registration, complete capability
support, closed template data and safe actual arithmetic independently of the
player roster. Two/three-enemy canonical installation uses the same capability
check through `validateCanonicalFormationDescriptors`; the older
`validateFormationDescriptors` and `FORMATION_STATE_TEMPLATE_IDS` remain private
to Formation/Receiver compatibility. All validation completes before RNG,
identity allocation or mutation. The full 60-template classification, encounter
sources and direct mechanic references are in
[ENEMY_CAPABILITY_AUDIT.md](ENEMY_CAPABILITY_AUDIT.md).

The 22 Pass 3 ordinary templates, eight Pass 4A Brace templates and seven Pass
4B landed-hit special templates may occupy any one to three enemy slots. Duplicate
templates allocate independent runtime IDs, HP and Observe progress without slot
compaction. The party renderer reuses each singleton sprite and applies one shared
layout envelope only when no legacy Formation measurement exists. Pools and
weights remain authored as before, so production encounters remain single-enemy.
Pass 4C below adds the eight unusual templates (45 total supported). The 15
scripted-lifecycle templates retain explicit capability rejection for Pass 5.

### Brace — Pass 4A

The singleton `handleCombatAction()` Attack branch is the semantic authority.
It rolls initiative, then `defendChance` when truthy, then both damage pairs even
when the enemy will not attack. A successful Brace replaces the enemy attack,
bypasses evasion and Cursed-fumble rolls, and applies
`max(1, floor(rolled melee damage / 2))`. The rolled critical multiplier is included
before halving, but the critical message is suppressed. Protection ignores the
initiative result. It is local to that exchange, with no timer or persistent
state. Item, Observe and Run branches never select Brace; offensive items and
delayed Bomb damage are unaffected. Tomb Sentry's Observe text mentions a fixed
interval, but actual runtime authority uses its authored 30% chance; neither
the text nor the singleton behavior changes here.

The user explicitly chose legacy exchange-wide timing and Attack-only eligibility
for canonical combat. Each living enemy targeted by at least one committed melee
Attack gets one decision, independent of other enemies and the number of incoming
Attacks. Successful protection covers every melee Attack on that exact enemy in
the round, including attacks before its scheduled slot. The enemy still occupies
its weighted-initiative slot; its scheduled action records holding the guard
instead of attacking. If defeated first, that slot records `actor_dead`, or is
truncated by a terminal outcome. There is no later activation or replacement
attack. Guard decisions already recorded at round start remain historical evidence.

Compatibility remains capability-driven. The existing `defendChance` field is a
finite number in [0,1]; zero retains the legacy no-draw behavior. Closed template
validation requires exact registered data and all capabilities to be supported.
The entire formation and actual arithmetic validate before RNG/identities/live
installation. No Brace identity list exists. Formation/Receiver and the older
Attack-only preparation API keep their separate restrictions; standard canonical
sessions execute Brace.

The minimal mutable mechanic state is `commandBattle.braced`, a private Set of
exact runtime enemy IDs. It is not on templates or canonical characters. Only
Brace-bearing snapshot enemies add `defendChance` and `braced: boolean`;
non-Brace records retain their old shape. All completed-round snapshots have
`braced:false`. Guard clears after action/effect resolution, also on terminal
escape/victory/defeat, before the round boundary. Existing lifecycle owners still
perform one-time HP/status/equipment/inventory writeback, rewards and recovery.
No Brace state, decision, reel or identity enters the save payload.

Canonical RNG order is deterministic:

1. Living enemy slot order: one decision draw for each eligible positive-chance
   bracer; then one ally-target draw only if it attacks and multiple allies live.
   Brace has `targetId:null` and no target-selection draw.
2. Existing allied Slither samples in slot order.
3. Exactly N−1 weighted initiative draws for N living actors, including bracers.
4. Existing scheduled action draws. A protected melee hit draws variance and
   critical only (two draws); an ordinary non-Cursed attack draws variance,
   critical and evasion (three). Skips/cancellations and scheduled Brace draw none.
5. Existing round-end effects. Playback/render/acknowledgement draw nothing;
   terminal world reward finalization retains its separate existing reward draws.

Representative full-round counts with no extra statuses/effects and nonlethal
hits (suite 187 uses explicit tapes):

| Round | Decisions | Target draws | Initiative | Execution | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1v1 successful Brace | 1 | 0 | 1 | 2 | 4 |
| 1v1 failed Brace, both attack | 1 | 0 | 1 | 6 | 8 |
| 1v1 Observe, enemy attacks | 0 | 0 | 1 | 3 | 4 |
| 2v1 successful Brace, both allies attack | 1 | 0 | 2 | 4 | 7 |
| 2v2 duplicate bracers, both brace | 2 | 0 | 3 | 4 | 9 |
| 2v2 duplicate bracers, one braces/one attacks | 2 | 1 | 3 | 8 | 14 |
| 2v2 bracer killed before its slot, ordinary enemy survives | 1 | 1 | 3 | 8 | 13 |
| 3v3, three independently targeted bracers | 3 | 0 | 5 | 6 | 14 |

Only eligible enemy command records add closed
`brace:{chance,roll,selected}`. Histories add `brace_check` (round-start decision
and before/after state), scheduled `brace`, and `brace_end` events. Protected
Attack events add `brace:{before,after,unmodifiedDamage,rolledCritical}`;
`attemptedDamage` is the halved result and existing applied-damage/HP fields retain
their meaning. The detached validator checks identities, eligibility, decision
thresholds, active-state continuity, halving, flags, skips, cleanup and exact final
projection. It never reruns AI, damage formulas or RNG. Frame zero remains the
pre-round state; each next frame projects one recorded event. Inconsistent or
out-of-order histories reject. Unexpected execution faults retain diagnostics
(including consumed Brace decision count) and prohibit retry without rollback.

The shared party renderer reads only the historical view, adds minimal Brace
messages and a `BRACE` badge, and calls registered sprites with their own default
optional arguments. This is required by Stone Crawler's palette parameter.
Singleton/Formation rendering is untouched. No Lab scenario or production group
was added; existing single-enemy pools keep their probabilities and count.

### Landed-hit status and offensive riders — Pass 4B

`canonicalEnemyMechanicProfile(template)` is the closed execution contract for
supported enemy mechanics. Field-backed probabilities remain on the registered
template; legacy parameters without template fields live in deeply frozen
capability metadata. The resulting record is closed, immutable and keyed by
capability. Formation preparation copies only fields mapped to supported
capabilities. Installation maps each exact enemy runtime ID to its validated
profile, so duplicates never share decisions or mutable state. Canonical
resolution dispatches capabilities in stable legacy order and never dispatches
on template identity.

Shade Wraith and Corpse Slug apply Slither after a surviving landed hit with 25%
and 30% chances. A success draws once more to sample Speed 1–20. Fen Witch uses
the same landed-hit structure at 25% for poison; Fen Mask blocks the application
after the chance succeeds. Void Walker and Dust-Drowned use their authored 20%
Curse chance; Amethyst Bangle blocks the application after the draw. Void Walker
then independently checks a 35% shard burst on every eligible landed hit. Carrying
a Void Shard wards it without consumption or damage RNG; otherwise a second draw
selects 8–14 extra damage. Lantern Moth checks 40% for combat-only Dazzled, whose
only modifier is the established eight-point outgoing Attack accuracy penalty.
Dripping Maw checks 35% for one combat-only Defence corrosion stack, capped at six.

These riders do not select a distinct enemy action and do not replace Attack.
Enemy command planning still commits only actor and exact target. With two or
three living allies, each attacking enemy consumes one target-selection draw;
with one living ally it consumes none. The N−1 initiative draws follow. A landed
ordinary Attack consumes variance, critical and evasion draws, then each eligible
rider consumes its chance draw and only the conditional secondary draws described
above. Misses, base-hit Fallen targets, dead actors and dead committed targets
consume no rider RNG. Cancellation never retargets or refunds earlier planning
RNG. Playback, rendering, preparation, projection and acknowledgement draw none.

Status ownership stays per canonical member: Lely uses the existing stats/status
authority; companions use `persistentParty`. Slither's sampled Speed and Acid
corrosion are per-member battle effects. Statuses applied during a round are
recorded immediately for playback but excluded from already committed same-round
command mechanics and initiative; they become active for the following round.
Slither, poison and Curse retain existing cure/writeback/recovery rules. Dazzled
and corrosion are transient combat state and are omitted from saves and cleanup
writeback. No global status flag or shared-template state exists.

Results record `enemy_effect_check`, `enemy_status`, `enemy_shard_burst` and
`enemy_corrosion`. The immutable playback validator captures poison/Curse ward
metadata with the existing item vocabulary, verifies every roll threshold and
state transition, and projects exactly one event per frame from the historical
frame-zero snapshot. Tampered identity, target, status, ward, sampled Speed,
corrosion, damage or final snapshot fails closed. The renderer consumes only this
view and adds concise event text plus a `COR` badge for corrosion.

### Unusual enemy mechanics — Pass 4C

The eight unusual templates bring mechanical support to 45/60; the other 15
remain guarded scripted lifecycles. No production pool/formation was authored.
`enemy-capabilities.js` owns immutable mechanic profiles; execution dispatches
through capabilities, never enemy IDs. Authored numeric template fields remain
unchanged. Exact legacy semantics, approved translations, RNG examples and tests
are in [CANONICAL_PARTY_COMBAT.md](CANONICAL_PARTY_COMBAT.md#pass-4c--unusual-ordinary-mechanics)
and the complete [enemy audit](ENEMY_CAPABILITY_AUDIT.md).

The generalized round owner stores per-instance `unusual` state: Troll
`{healingSuppressed,suppressedRound}`, Gull `{stolenGold,stolenRound,departed}`.
It is never written to templates or saves. Troll regeneration uses approved
round-end HP after existing burn/Bomb ticks; terminal outcomes suppress it.
Trollbane cancels the target's still-unexecuted action and suppresses regeneration
for the remainder of that combat. Later ordinary attacks resume; a new fight
starts unsuppressed. The singleton retains its internal `enemyStunTurns` field as
a 0/1 battle-local marker, while saved Trollbane items retain inert `stunTurns:3`
metadata for exact version-5 item rehydration compatibility. Thornback's authored
melee DEF applies only to Attack. Approved counters occur immediately after each
surviving melee exchange, against its exact attacker, never retargeting. Toads
compose the existing poison rider with exact-instance Observe and sex/reagent
handling. Correct reagents work without an Observe prerequisite.

Gulls steal gold only, once per exact instance. The approved grace is a complete
subsequent party round. Departure retains slot/HP/history while excluding the
actor from targeting/initiative. Its shared battle purse is snapshotted only for
Gull battles; authenticated `persistentParty.commitCombat()` writes it once to
existing `stats.gold`. Killing a Gull returns its stolen amount once. As explicitly
authorized, resolving a mixed formation after departure grants rewards only for
defeated slots, through the existing reward ledger. Voluntary Run pays nothing.
The Pass 6 policy above now governs universal rewards, Fallen state and recovery.

`canonical-enemy-records.js`, loaded after capability metadata, issues immutable
private-provenance records for selected generated 23 and smaller Seep successors.
The original record reference is required at entry; copies/forgeries and the raw
23 sentinel reject. Generated stats use exactly seven existing selection draws;
actual arithmetic validates before any combat identity or installation. Historical
origin evidence is retained for detached validation without generation or rerolls.

A defeated parent Seep queues a separate smaller battle, with its own identities
and rewards. The canonical owner holds a one-use callback/token; the existing
`scriptedCombatEntry.checkCallback()` hook asks it to preflight before dialogue
advances. The private token passes through existing preparation to permit only
that authenticated interstitial, without temporarily changing dialogue state.
Arbitrary tokens reject. Saves/loads refuse until the handoff completes. The old
Guard/Polwick/Essa singleton chain remains separate. Same-slot round-boundary
replacement remains a deliberate future extension.

New recorded events cover regeneration, counters, theft, gold recovery and
flight; armor records its numeric evidence. Reagents/Trollbane use existing item
snapshots. Creation validates closed histories and recorded arithmetic witnesses;
frame projection and rendering read immutable frames without calling live combat,
AI or RNG. Later rounds/encounters cannot change historical views. The shared
renderer adds concise messages and a FLED badge; legacy singleton/Formation
presentation, SAVE_VERSION 5 and geographic artifacts remain unchanged.

### Structural canonical battle envelope — Pass 2

The explicit canonical boundary supports one to three authored ally slots against
one to three enemy slots. This adds no normal-game route: recruitment still gates
automatic canonical entry, Chapter One still uses singleton combat, and the
Receiver still owns its established Formation lifecycle. No third production
character is introduced. Pass 3 later expands compatible ordinary enemies without
changing this structural envelope.

`canonicalPartyCombat.preparePlayerSide({escape})` reads the canonical roster
through `persistentParty.prepareCombat` and the private bridge's existing command
seed validator. It validates authored IDs/slots, unique membership, HP/statuses,
equipment, shared inventory, Rareborn bindings and prepared arithmetic, requires
at least one living ally, and retains Fallen slots. Lely remains owned by
`stats`/`statusEffects`/`slitherSpd`; companion ownership remains `persistentParty`.
The result is a frozen transient descriptor, not another mutable character owner.
Its exact fields are `members`, `inventory`, `equipment`, `escape`, `resonance`,
and optional `slither` when an existing Slither status needs its current sample.
Each member has `characterId`, `slot`, `name`, `hp`, `maxHp`, `atk`, `def`, `spd`,
`statuses`; inventory contains registered item IDs; each equipment row has
`weapon`, `armor`, `shield`, `accessory` IDs or null. Resonance rows contain
`characterId`, `slot`; Slither rows contain `slot`, `speed`. Equipment/capability
rows correspond exactly to member slots. Escape is `blocked` or `fastest_living`.
Level/XP/progression remain in their existing canonical owners, not runtime IDs.

`canonicalPartyCombat.prepareEnemySide(enemies)` delegates to
`preparePartyEnemyFormation` in `encounter-formations.js`. It accepts one to three
ordered registered IDs or exact capability-compatible template data, checks numeric safety and
the closed capability gate, and produces frozen templates and
slot descriptors without reading the roster. Duplicate templates remain distinct
slots. `prepare({enemies,escape})` composes these authorities into a frozen battle
plan and additionally checks cross-side arithmetic, cumulative initiative weights,
ownership, reward arithmetic and world cleanup. No RNG, identities, callbacks or
live writes occur in preparation. `enter` revalidates current canonical state;
external plans are not installation credentials. Identities are allocated only
after validation, remain unique across later encounters, and never enter saves.
The enemy-side result has exactly `ids`, `templates`, `slots`; each slot row is
`{enemyId, slot}`. The combined plan has `templates`, `ids`, `playerSide`,
`enemySide`, `escape`, `origin`, `xp`, `rewardId`, `memberIds`. Origin/reward fields
are validated cleanup/reward context, not an installed callback or awarded reward.

The existing generalized scheduler/controller/playback and presentation already
support six actors. Each living ally drafts in slot order; reservations/backtracking
remain per draft. Each living enemy samples a living ally once when there are
multiple living allies and uses no target-selection RNG when there is only one.
Initiative consumes N−1 draws (five for six actors). Targets remain frozen, dead
actors skip, dead targets cancel, slots never compact, and effects/Strain advance
once per completed round. Ally x positions remain 108, 256, 404. The older
`combatPlayerState.initialize` two-member Attack-only API and the Formation
enemy-storage two/three descriptor contract remain intentionally unchanged.

`enemy-capabilities.js` loads after `enemy-catalog.js` and `combat.js` (registry/copy authorities), then
`encounter-formations.js` loads before `persistent-party.js`. The exact authored
record is:

```js
Object.freeze({
  id: 'formation_example',
  enemies: Object.freeze(['enemy_marsh_wisp', 'enemy_marsh_wisp']),
  weight: 2,
})
```

Only `id`, `enemies`, `weight` are allowed. IDs match `formation_[a-z0-9_]+`;
the dense frozen enemy array contains one to three `enemy_[a-z0-9_]+` IDs in slot
order. Weight and total table weight are positive safe integers. Records/arrays
reject accessors, callbacks, extra fields, holes and mutable nested data. Authored
formation IDs are unique per table and cannot alias generated shorthand IDs.
`validateDefinition` checks immutable shape only; `normalizePool` also requires
registration. Neither implies runtime capability approval. Existing registered
template objects are shorthand for `{id:'formation_single_'+template.id,
enemies:[template.id],weight:1}`; repeated legacy entries retain their weighting.

`select(pool)` validates the entire table before exactly one `Math.random()` draw,
including a one-entry table. All-flat tables use the existing `floor(roll*length)`
index. Tables with explicit records use ordered cumulative half-open weight
intervals. The normalized result and selection are frozen. Startup and
`validateGameData()` validate registered pool data. Existing pools are unchanged;
the current geographic selector and its separate rare-23 override retain their
original RNG calls. Explicit weighted formations are data/preparation contracts
only until a later authorized routing pass; none is installed in geography here.

Suite 185 exercises all nine size combinations with a VM-only third definition,
including six-actor commands, outcomes, reservations, history, rejection and IDs.
Future Eastern Fens fixtures are shape-valid only: Mire Toad remains capability
blocked, while Waspthra/Botfly are absent from this registry and fail registration.
No mechanics are discarded to execute those records.

### Scripted singleton entry lifecycle

`scriptedCombatEntry` in `combat.js` supplies read-only preparation for the 15
dedicated starters and the inline Pale Sentry override. `requireSingletonEncounter`
retains the canonical roster gate and invokes this preparation. Authored callers
own quest/proximity prerequisites and check before staging combat dialogue;
registered choice/continuation callbacks carry their check in a WeakMap. Existing
input and dialogue dispatch check before consuming the choice, final page or
callback, then starters recheck before identities, RNG or combat writes.

Fort arrest state, Kolm's stake, Mimic trap consumption and Rainfish wake state
commit after successful activation. The trapped Drowned's existing slain flag
commits only after victory for its exact bound enemy; defeat/escape allow retry.
Lensweb finalization requires its exact enemy and victory or Observe-gated escape.
Singleton reward receipts prevent duplicate awards and retain failed resolutions;
inactive acknowledgement cannot repeat recovery. These runtime-only records do
not change save version 5. Low-level singleton replacement remains available for
the established normalization contract; world entry rejects active/foreign owners.
See [the complete starter/lifecycle audit](SCRIPTED_COMBAT_ENTRY_AUDIT.md) and suite
184. This does not expand canonical party enemy compatibility or alter Receiver/Lab
ownership, formulas, valid RNG order or ordinary encounter selection.

### Resonance MVP (Lab and canonical activation)

`resonance.js` loads before `combat.js`; its closed, frozen registry contains
`quickbloom`, `null`, `rainbow` and `eclipse`. `PERSISTENT_CHARACTER_DEFINITIONS` explicitly declares
Lely `{rareBorn:false, affinity:null}` and Esla
`{rareBorn:true, affinity:'bloommarked'}`. These static fields are not saved.
Canonical encounters supply these bindings through persistent-party preparation.
The original explicit headless API without a policy retains its older result shape.

Every immutable technique definition now has a nonempty frozen `elements` array
of unique stable IDs from `RESONANCE_ELEMENTS`: `bloommarked`, `firelit`, `void` and `prism`.
Quickbloom has `elements: Object.freeze(['bloommarked'])` and retains its separate
Bloommarked affinity requirement. Affinity controls caster eligibility; elements
identify which future elemental modifiers apply. Future modifiers must match
these static elements, not technique IDs, character IDs or inferred caster
affinity. Unknown, duplicate, empty, malformed and mutable element arrays reject.
No Firelit technique, elemental modifier or modifier item is added. Eclipse is
the story-bound combined technique described below. Quickbloom healing and its event shape remain unchanged. Offensive
events carry copied Void/Prism metadata and a deterministic damage witness; see
the Pass 2 contract below.

Command preparation optionally accepts `resonance:[{slot,characterId}]`, one
binding per member. A shared pure validator checks each against authored
metadata before identity allocation. Lab identities `lely_lab` / `esla_lab`
explicitly bind to the corresponding canonical definition without touching
persistent records. Membership, naming or technique possession grants no power.
Preparations without bindings retain their original four-command snapshots,
results, playback and controller views byte-for-byte.

The existing private command authority owns the optional snapshot array
`resonance:[{actorId,characterId,rareBorn,affinity,strain,appliedRound}]`.
No second HP, membership or inventory authority exists. All views are detached
and frozen. The new closed action is
`{type:'resonance',actorId,techniqueId,targetId,participantIds}`; ordinary
Quickbloom has just Esla's exact runtime ID in `participantIds`. Selection and
round preflight use the technique policy: one living wounded ally for healing or
one exact living enemy for ordinary damage, or all captured living enemies for
combined damage, plus zero participant Strain.
Healing is `max(1,floor(target.maxHp/5))`, clamped to missing HP. A target healed
full earlier still consumes the action and applies Strain; a dead actor/target
skips/cancels without healing or cost. There is no cure, revival or action RNG.

Definitions are closed `{id,name,kind,initiator,participants,target,effect,elements}`
records; the damaging variant additionally requires positive safe-integer `power`.
Each participant authors `{characterId,affinity,strain}`; supported
policies are `living_wounded_ally` / `heal_fifth`, ordinary `living_enemy` /
`damage` and combined `all_living_enemies` / `damage`; authored affinities are Bloommarked, Voidborn and Prismborn.
There is no callback language or runtime registry installation API. Ordinary
techniques have one participant; a combined definition requires two or three
unique explicitly authored Rareborn participants, including its initiator.
Frozen character-definition `knownTechniques` lists explicitly grant techniques.
`resonanceParticipants()` requires knowledge for every participant independently
of identity, Rareborn status and affinity; an absent list grants no technique.
The same policy gates menus, raw commands and historical validation without
extending capability snapshots or saves. Eclipse binds Sera and Liora; test 180 additionally supplies synthetic healing
fixtures solely inside its VM, never production characters or debug techniques.

Every combined participant submits an explicit compatible choice with the same
technique, authored ordered participant IDs and target selection. Partial draft
validation never fabricates missing choices; pending consent restricts the next
participant's menu/targets while retaining backtracking. The complete command
retains each consent. It coalesces to one initiative entry represented by the
authored initiator, using the minimum effective participant Speed at preparation.
The ordinary weighted planner uses N−1 draws over that coalesced list. Gear,
Muddied and retained Slither are included; later changes do not reschedule.
Participant death/disablement cancels once, consumes both/all opportunities and
applies no cost, fallback or retargeting. There is no latest-position wait path.
`partyActorCanAct` is a pure shared eligibility boundary; HP is currently its
only authored lock. Tests substitute a pure conditional policy to exercise
future disablement without adding Stun/Sleep. Frozen membership prevents removal
or replacement; unauthorized live-state corruption retains diagnostic lockout.

New closed events extend generalized playback only:
- `resonance`: ordinary plan fields plus technique ID/name, participant IDs,
  attempted/applied healing and target HP before/after.
- `resonance_damage`: plan/technique/participant IDs, name, elements, power,
  historical DEF, attempted/applied damage and target HP before/after.
- `resonance_damage_all`: the same technique metadata, null plan target, captured
  target IDs and ordered surviving-target damage witnesses, applied simultaneously.
- `resonance_cancel`: plan fields, technique/participant IDs, unavailable ID and
  `participant_dead`, `participant_disabled` or `target_dead` reason.
- `strain`: owner ID, before/after Strain and application-round numbers, and
  `application`, `recovery` or `cleanup` reason.

Successful Quickbloom sets Strain 1, exempting that application round. At the end
of the following completed round it becomes 0, even if Esla is Fallen. Effects,
playback frames, inspections and acknowledgement never advance it separately.
Victory/defeat/escape emit cleanup evidence; ordinary or emergency Lab teardown
also discards the entire private battle state. Save version and payload remain 5.
Generalized playback validates exact participants, initiative, wait/cancellation
placement, healing continuity and Strain transitions using detached history;
it consumes no RNG and never heals live actors. Old Attack-only playback is
unchanged. Historical outcome remains hidden until its recorded boundary.

The shared party renderer gives the immutable recorded `resonance` event for
`quickbloom` one presentation-only 24-frame flourish at the exact target slot.
Six deterministic leaf motes use `#3f8f52`, `#78c86f` and `#a8e89c`, ending in
a pale cross-shaped sparkle. Rendering never reruns healing or Strain and consumes
no RNG. Once rendering has begun, the canonical and Lab input routes hold that
playback frame until the 24 ticks complete. The transient timer clears on the
next event, all terminal cleanup, Lab exit, checkpoint reset and diagnostic abort;
it is neither combat state nor saved state.

The same session closure adds `moveTechnique`, `confirmTechnique`,
`cancelTechnique`, a `technique` phase and immutable technique/reservation views.
Target cancel returns to the technique list; list cancel returns to the command
row. Backtracking releases every participant reservation atomically and restores
the prior technique/target. The existing commitment still resolves once and
creates playback once. No new listener, controller, save field or field command.

The Party Lab alone opts in. The controller derives commands from the current
actor's authored identity and Rareborn capability. Lely has Attack / Item /
Observe / Run; Observe is her compensation for lacking Rareborn abilities. Esla
has Attack / Resonance / Item / Run and cannot select Observe. Both actors use
four boxes at x=22/139/256/373, width=111, y=414, height=38. Resonance remains
visible but dimmed/skipped for a strained Rareborn or without a wounded living
ally. The renderer consumes this controller-owned command list. Technique navigation reuses Up/Down/W/S and
Enter/Space; Escape/B cancels. Allied targeting uses the existing pale cursor.
The status row shows historical Strain; text uses copied playback evidence.
Lely stays x=108, Esla x=256, future slot 2 x=404; no art or baseline change.

### Persistent party lifecycle (save version 5)

`persistent-party.js`, loaded immediately after `combat.js`, owns `persistentParty`:
ordered persistent character IDs, non-Lely character records and idempotent reward
receipts. Lely is permanently slot 0 / field leader; her `stats`, `statusEffects`
and `slitherSpd` remain the sole mutable canonical authorities. Shared gold and
inventory stay in `stats.gold` / `stats.items`. Inspection is detached and deeply
frozen. There are no reorder/remove operations or ordinary overworld followers.
Temporary companion availability is separate from recruited membership (see below).
Recruitment is owned by MQ5 below.

The roster schema supports 1–3 fixed slots. Authored definitions currently contain
only `lely` and `esla`; future slot 2 needs its own authored definition/progression,
not a fabricated third character. Test 181 supplies a source-local fixture to
exercise three-member persistence, XP, preparation and commitment. `joinEsla()`
is idempotent; its no-argument preparation uses Lely's level, while the closed
`joinEsla({level:11})` call supplies MQ5's authored joining level and loadout. Both forms use Esla's
own progression and grant no shared resources. Her MQ5 recruitment equipment
is `Dragon Blade`, `Shadow Cloak`, `Mithril Shield`, and `Fen Mask`. Her provisional progression for level L is:
`maxHp=30+5*(L-1)`, `atk=6+(L-1)`, `def=2+floor((L-1)/2)`,
`spd=6+floor((L-1)/2)`. This anchors level 5 at 50/10/4/8 without copying Lely.
Joining XP is the authored threshold for that level. The no-argument structural
fixture retains empty slots; MQ5 equipment is installed in Esla's own slots
without adding duplicate items to shared inventory.
Authored definitions now carry static Rareborn/affinity metadata (see Resonance below).
The standard party controller is the availability authority. Its immutable view
includes per-command `enabled`/`disabledReason` records and per-Rareborn
availability records. Quickbloom reports `No wounded ally`, `Strained`, or the
Fallen actor reason from the same participant/Strain/target checks that gate its
technique row. Rendering continues to consume the controller decision and does
not infer eligibility or alter the approved battle layout.
No persistent Strain or speculative magic resources are stored.

Lifecycle APIs:

- `getView()` / `getFieldView()` expose available travelling members, compact active
  slots, personal equipment IDs/statuses, shared item IDs/gold and active-party defeat.
  `getActiveMember(id)` tests present participation; `getMember(id)` and
  `getRosterView()` retain recruited-history inspection, including absent members.
- `joinEsla()` and `resetForNewGame()` manage membership. Fresh script loading is
  Lely-only. Reset clears the roster/receipt ledger, leaving the existing Lely
  new-game initialization authority in place.
- `awardExperience(id,xp)` / `awardRewards({id,xp,gold,items})` give every available
  living member full XP; knocked-out members receive none. Lely uses unchanged `checkLevelUp`
  (three existing growth draws per level); Esla grows independently/deterministically.
  KO HP and progression stay unchanged. The saved receipt prevents repeat XP, gold and item
  grants; a reused ID with different contents rejects. Headless results identify
  each member with before/after values. Invalid awards reject before RNG/mutation.
  Unexpected host RNG failure retains evidence and blocks retry; it does not rewind
  Lely's existing growth authority. No existing singleton reward caller is rerouted.
- `recover()` restores each available member's maximum HP and clears the established removable
  poison/muddied/slither/cursed/burn/dazzled statuses, resetting Slither samples. Equipment,
  resources, time, flags and progression remain unchanged.
- `combatSnapshot()` produces detached base stats, current HP/statuses, personal
  equipment IDs, shared selectable inventory and owned Slither samples.
- `beginCombat(enemyIds)` starts the authentic standard session; callers exercise
  `combatPlayerState.session` explicitly. `commitCombat()` accepts no caller result.
  It requires the exact acknowledged victory/defeat/escape session and commits once.
- `isCombatPending()` and `getCombatDiagnostic()` expose pending/failed evidence.
  `serialize()`, `prepareLoad(...)`, `commitLoad(token)` are the save boundary.

Temporary availability is owned by the same closure. `prepareAvailabilityChange`,
`validateAvailabilityChange` and `applyAvailabilityChange` authenticate a private,
stale-sensitive receipt carrying character ID, availability, reason and return map.
Lély cannot be removed, and removing a companion cannot leave all active members
Fallen. Non-Lély records remain in place; no recruitment or inventory grants run
on reunion. Optional `party.absences` entries `{characterId,reason,returnMapId}`
serialize only while needed; absent fields in older v5 saves default to an empty
list. Active battle, field effects, menus, XP, treatment, rest and defeat recovery
exclude those records. Battle commitment maps compact active slots back to stable
character IDs. The historical `canonicalPartyCombat.hasMultipleMembers()` routing
gate continues to use recruited membership so a temporary solo journey still uses
the shared engine. Recruitment-history and past camp invariants remain unchanged.

`fine-needlework.js` owns the optional parcel/stage transaction and transient Esla
projection; it never owns her character record. `fine_needlework_stage` is a normal
quest binding. Candidate save invariants check cargo and companion absence together
before any load writer. The existing Polwick alliance classifier and lighthouse
reward priority are reused. Mornay room keys come from `mornayContentKey()`; a separate
quest NPC list adds Chuggie and one nonpersistent Esla projection without duplicating
the 300-resident manifest. The offer/departure uses exclusive input ownership and
the existing transient NPC route engine, with a bounded room collision preflight.
Save/load is blocked only during that presentation; no sprite coordinates are saved.
See `MORNAY_FINE_NEEDLEWORK_PLAN.md` for the state table and verification.

The bridge claims a once-only capability from the existing `combatPlayerState`
closure at script load. No second engine or party membership exists. Its private
owner binds exact roster, runtime member IDs, enemies and session references.
Preparation validates inactive state, supported 1–3 enemy templates, complete
inventory/equipment/status seeds and prospective numerical safety before either
identity allocator. Runtime IDs remain transient. A single supported boss may use
`enemy_mulholland`; multi-enemy construction retains the conservative formation
allowlist. No encounter, Lab or input route invokes this bridge.

Canonical state remains untouched throughout the prepared combat. Commitment
checks its initial persistent-state seal, exact membership, authenticated session,
final historical acknowledgement and current sealed final snapshot before writes.
It commits personal HP/statuses/equipment and shared inventory exactly once,
retaining unselectable key items. Victory retains zero-HP members; surviving HP is preserved. Burn, Dazzled and encounter-local effects end at cleanup;
ordinary persistent statuses and retained Slither samples keep their owners.
Completed-round count is returned in the receipt, not saved as ongoing combat.
XP/gold/drop awards are separate. Stale, replaced, malformed, incomplete, Lab or
replayed results reject without partial commitment. Failure retains diagnostic
state; no retry, resource refund, recovery or reward is automatic.

Save v5 adds `party: {order, characters, rewards}` and Lely's `slitherSpd`.
`characters` excludes Lely and contains `{characterId,hp,maxHp,atk,def,spd,level,xp,
statuses,equipment:{weapon,armor,shield,accessory},slitherSpeed}` with stable item IDs.
`rewards` contains closed `{id,xp,gold,items}` receipts. Lely continues through
existing `stats` and `statusEffects` fields. Candidate validation precedes every
load writer (including flag mirroring); opaque load tokens are single-use and
revision-bound. No RNG or combat identity allocation occurs on load. Version 4,
other mismatches and malformed party payloads reject without altering live state
or the on-disk save; there is no migration. Runtime IDs, drafts, playback, Labs,
cutaway parties and battle effects are absent. Saving/loading a pending bridge
or existing Lab remains blocked. Earlier v4 notes below describe those historical
increments, not the current save version.

### Canonical field-menu ownership

The field menu branches on `persistentParty.getView().members.length > 1`.
`drawMenu()` retains its entire solo body and common frame, Notebook, save/load
confirmations and banners. `partyFieldMenu.handleInput(event)` lives inside the
existing `menu.open` input branch and shares the one physical pressed-key latch.
It declines the solo path and original Notebook/save/load handlers. Multi-member
native repeats and modified/IME events are inert. Existing combat, Lab, Receiver,
cutscene, dialogue and other modal locks retain ownership; transitions are
synchronous and do not introduce a new menu lock state.

Menu-only state: selected persistent character ID, pending item/explicit target
IDs, the four-slot Unequip cursor and `menu.screen`. No mutable character record is
stored. Opening a multi-member menu resets the selected ID to `lely`; closing
and reopening therefore always returns to Lely. The controller reconciles a
stale selection against the current fixed roster, preferring Lely. This state
is transient and never enters save version 5.
The shared inventory still comes from `groupItems()` (first-occurrence order,
quantities, key-item filtering, four visible rows). Save and Load keep their
existing positions after inventory; Unequip and Status follow only for multiple
members. The Notebook shortcut remains N. No Party/Formation/Resonance command.

Multi-member flow:

- `main` → item → `partyTarget` → revalidated use → `main`; cancel preserves
  the inventory cursor/scroll and displayed character. The action target is a
  separate explicit stable ID, so the displayed page never silently chooses an
  item recipient. Invalid or missing targets consume nothing.
- `main` → Unequip/Status opens `partyUnequip`/`partyStatus` directly for
  the displayed member. Back returns to that same member page. Status left/right
  uses the shared selected-member authority and wraps through all fixed slots,
  including Fallen members. Unequip lists Weapon/Armor/Shield/Accessory for the
  selected stable identity. Occupied slots return exactly one registered item to
  shared inventory through `persistentParty`; empty slots are visible and inert.
  Replacement equipment still enters through Items and explicit member targeting.
- On `main`, Left/Right or A/D pages through canonical slot order without moving
  the highlighted command; Up/Down or W/S still navigates inventory and commands.
  Item targeting retains local four-direction navigation. Enter/Space confirms;
  Escape/B backs out. M retains the existing back/close convention. No listeners
  were added.

The recruited-party `main` screen renders one complete character sheet at a
time. Its common geometry contains name/page count, Level, current and maximum HP
with the existing segmented meter, cumulative XP plus progress toward the next
threshold, effective ATK/DEF/SPD, a persistent-status summary, and
Weapon/Armor/Shield/Accessory IDs. It retains shared gold, day, inventory, Save,
Load, Unequip, Status and Notebook access. Fallen members keep their fixed page;
two- and three-member rosters use the same layout. `getFieldView()` supplies the
immutable stat and progression projections, so rendering does not reproduce
combat/equipment or XP formulas. The single-member branch of `drawMenu()` is
unchanged and retains its draw-call recordings with no paging or companion hints.

Canonical APIs added in `persistent-party.js`:

- `getFieldView()` augments immutable member snapshots with
  `{effective:{atk,def,spd}, progression:{nextLevelXp,progress,required}}`.
- `fieldItemTargets(itemId)` returns frozen stable IDs of eligible members.
- `previewEquipment(characterId,itemId)` returns an immutable prospective member.
- `unequipFieldEquipment(characterId,slot)` authenticates the complete idle
  canonical state, validates the exact owner and registered equipment instance,
  then clears only that slot and returns one item to shared inventory. Empty,
  malformed and stale requests reject before mutation; Fallen owners remain valid.
- `useFieldItem(characterId,itemId)` validates locks, identity, inventory copy,
  target and arithmetic before any writer. It consumes one shared copy only on
  execution. Equipment replacement returns the prior copy to shared inventory and changes
  only the selected owner's slot. Ordinary heals use `healingItemAmount`; cures
  use `itemCuredStatuses`/the established cure-property registry. A cure with no
  matching status still consumes, matching existing solo field semantics. Field
  Ember Root remains healing-only. Battle-only items and reagents gain no field
  effects. Fallen members are excluded from healing targets, retained for cures and gear.

Lely remains `stats` + `statusEffects` + `slitherSpd`; non-Lely records remain private
in `persistentParty`. `effectiveDef` and `effectiveSpd` accept optional explicit
status/corrosion/sample arguments for personal previews; their defaults and all
existing combat arithmetic are unchanged. HP/item mutations do not replace
unrelated equipped objects. Existing solo mutation paths remain `input.js`'s
heal, `applyStatusCure`, and `equipItem`; singleton rewards still use their existing
paths. Party rewards/recovery remain `awardRewards`/`awardExperience`/`recover`.

Save v5 is unchanged. `prepareLoad` additionally rejects nested executable/custom
objects and Lely equipment in an invalid slot before restoration. Authored item
rehydration remains supported; unknown items and unsupported instance fields
reject atomically rather than installing inventory that cannot enter combat. The existing
key-item/former Void Shard inventory-restoration policy is shared through the pure
`savedEquipmentDisposition` helper; those records never restore invalid equipment.
Test 182 covers
eight complete solo draw-call hashes, input flows, ownership, stale targets,
control locks, immutable reads, two/three-member saves and display bounds. No
encounter caller was added by the menu. MQ5 now provides its canonical membership
through the story completion authority below.

### MQ5 assignment and canonical recruitment

`quests.js:mq5AssignmentReady()` checks the existing fort completion, reservoir
assignment/report, Gallery body discovery, canonical Sera/Liora completion and
pre-MQ5 quest state. `supervisorDialogueBody()` uses it to offer the assignment;
its sole completion callback is `completeMq5Assignment()`, which checks it again.
The callback invokes the one production `persistentParty.joinEsla({level:11})`
call before setting MainQuest to 5 and refreshing the established quest mirrors
and job board. All fallible member preparation precedes quest advancement; there
is no second Esla record, runtime identity allocation, RNG, resource grant or
recruitment flag. Already recruited members are never reset. Completed MQ5
conversations use the existing short reminder and no recruitment callback.

The assignment presentation is owned transiently by
`mq5-assignment-cutscene.js`. It divides the existing authored conversation into
Supervisor, narration and Esla pages, closes dialogue after the ferry briefing,
and lends Esla's one real office projection to the established `NPC_ROUTES`
waypoint runtime. Esla walks right from `(4.5,9.5)` to `(11.5,9.5)`, then north
to `(11.5,3.5)`, where she faces right beside the desk. The route is validated
against office terrain, furniture and fixed NPCs before it is installed. Its
transient runtime alone may enter the ordinary
player collision buffer so Esla can approach Lely; all other NPC routes retain
the player-blocking rule. While it runs, it exclusively owns input and the
simulation: menus, interactions, save/load and world advancement are blocked,
while rendering and route animation continue. It consumes no RNG and has no
saved midpoint. Arrival reopens the rest of the same conversation; only its final
acknowledgement invokes the unchanged `completeMq5Assignment()` authority.
Failure clears the transient route/dialogue, restores Esla's home projection,
unlocks controls and retains a diagnostic without partially recruiting her.

Speaker presentation is an explicit page contract rather than prose inference.
`DIALOGUE_SPEAKER_DEFINITIONS` in `npcs.js` maps stable speaker IDs to a name and
validated named dialogue style. `state.js:setSpeakerDialoguePages()` accepts only
closed `{speakerId, lines}` records, clones and freezes them, validates every
speaker before installation, and treats `speakerId:null` as narration/default.
`render-ui.js:drawDialogue()` resolves name and style independently for every
page and carries the speaker identity through visual repagination, so a coloured
page cannot leak into the next one. Esla's durable character and NPC definitions
use speaker ID `esla`; its named `esla_light_green` style uses readable pale-green
body `#a8e89c` and name/prompt `#8fda86` on the unchanged dialogue box. Legacy
string-array dialogue remains valid and byte-for-byte default-styled.

Esla still chooses the journey; the Supervisor's reluctance concerns staff
capacity. MainQuest remains the ferry authorization. The active Sealed Report
note derives the joint Mornay objective from canonical membership.
`npcs.js:eslaAvailableAsNpc()` is the read-only membership gate shared by Calwick
drawing, collision and interaction, and the infirmary follow-up's map projection.
No follower or new save binding is introduced. Tests 179, 195 and 198 cover these
boundaries.

Esla explicitly states that she does not know what happened to Dreyfuss; the
line remains an attributed Esla page and therefore uses her speaker colour.
`postMq5CompanionDialogue()` is a narrow ambient adapter: at MQ5 with canonical
Esla membership it preserves every existing NPC page in place, assigns those
pages a stable speaker ID and appends a closed mixed-speaker exchange.
`setNpcDialoguePages()` installs that form or the exact legacy line-array form
through the existing dialogue authority. Tomas, Aldric, Petra, Corvin, Oswin,
Veth, Holt, Sable, Renn and the Supervisor have selected post-recruitment
exchanges; quest and one-time pages retain priority. Numeric quest state alone,
NPC projection and Fallen status cannot substitute for membership. No generic
follower-dialogue framework, save flag or renderer path is introduced.

Recruitment activates canonical party routing for supported ordinary encounters.

### Developer Story Checkpoint Lab

`story-checkpoint-lab.js` owns a closed, immutable registry of developer story
fixtures and the one whole-session replacement boundary used by the backtick
menu. The registry contains `mq5_assignment_ready` (**MQ5 — Assignment Ready**)
and `mq5_campfire_ready` (**MQ5 — Campfire Ready**). A checkpoint is a developer convenience for
mechanics, story and playability checks; its deliberately generous resources
are not a balance-testing save.

The authority validates the complete definition before mutation: stable map and
item IDs, legal shop equipment slots, canonical level/XP and reachable Lely stat
growth, safe resources, the complete quest binding projection, lighthouse-route
invariants, and a walkable discrete placement. Application then asks the owning
combat, party, Receiver, Lab, fishing, UI, movement and location authorities to
discard session-only state before installing the validated canonical state.
It consumes no RNG or combat identities. The registry entry supplies data; menu,
confirmation, validation and reset machinery are shared, so a later authorized
checkpoint requires another bounded registry record rather than another menu.

The MQ5 checkpoint installs Lely at level 10 and 25,600 XP with the maximum
legal deterministic gains from nine ordinary level advances (120 HP, 35 ATK,
29 DEF, 16 SPD). Lely equips `Dragon Blade`, `Shadow Cloak`, `Mithril Shield`
and `Fen Mask`, the strongest general-purpose ordinary equipment sold before
MQ5 in each slot. The same four IDs are the canonical level-11 Esla recruitment
loadout in `persistent-party.js`; checkpoint application never patches Esla
after recruitment. The fixture sets 1,000 shared gold and its explicitly
authored consumable/reagent inventory, while leaving Esla absent until the real
Supervisor callback.

The checkpoint sits in `OFFICE_MAP` at local pixels `(384,104)`, immediately
south of the Supervisor. It derives the journal and ferry projection from the
normal quest state: `MainQuest` stays 4, the completed reservoir/Receiver/dream/
cutaway prerequisites are true, and the ferry remains absent until MQ5 is
assigned. Applying or cancelling never calls `saveGame()` and never touches
`localStorage`; a later deliberate Save produces an ordinary version-5 payload.
The transient on-screen confirmation is intentionally unsaved.
Unadapted specials and scripted encounters reject with diagnostics; they cannot
silently route a recruited roster through Lely-only reward/recovery flows.

The Campfire Ready developer checkpoint uses the same level-10 Lely, shared
inventory, 1,000 gold and day 6 as Assignment Ready. It includes canonical
level-11 Esla (40,000 XP, 80/80 HP and her production recruitment equipment),
sets MQ5 to 5 and the ambush victory flag to complete, with no payment receipt
and camp stage 0. Placement is Travellers’ Rise `(336,240)`, at the completed
ambush position. The normal automatic campsite introduction starts on the next
world update; afterward, interact with the cold fire ring to begin the night.
It neither replays combat rewards nor skips the campsite argument. Up/Down
selects either fixture; Apply/Cancel and no-automatic-save behavior are shared.
Esla’s immutable recruitment-profile preview and normal join authority validate
and install her loadout without a separate checkpoint character definition.


### Historical pre-bridge encounter routing audit (read-only)

`movement.update()` chooses geographic eligibility, then `startCombat()` selects
from `currentEncounterPool()`, applies the North Basin Swamp Donkey override and
rare generated `23`, and finally installs singleton combat. The smallest future
routing boundary is after an authentic encounter descriptor is fully selected,
before activation: branch on persistent roster size, retaining the exact existing
singleton path for Lely-only play. Do not route at map IDs or replace geographical
pool ownership. Scripted starters and their completion/reward owners require
individual review; merely having simple template stats does not authorize routing.

At the Pass 2 identity-list checkpoint, party-supported ordinary IDs were Marsh Wisp/Briar Hound (core and early),
Reed Grappler, Silt Lurker, Marsh Wisp (sluice top) and Sluice Slime. Other simple
pool enemies were still unreviewed. Passes 3 and 4A supersede this paragraph with
the capability authority and complete audit above. Brace and the seven Pass 4B
landed-hit riders are migrated; the remaining deferred mechanic list is:

| Capability | Existing template IDs requiring later review |
| --- | --- |
| Splitting / regeneration | `enemy_the_seep` / `enemy_rotwood_troll` |
| Armor and counters | `enemy_thornback` |
| Poison and sex-specific observations | `enemy_mire_toad_male`, `enemy_mire_toad_female` |
| Theft-and-flight | `enemy_basin_gull`, `enemy_basin_gull_upper` |
| Runtime-generated stats | `enemy_23` |

Optional/repeatable bespoke encounters remain relevant: Pale Sentry persistent HP,
Rainfish and spawning-toad chains, generated `23`, Seep follow-up, Den Wraith curse,
Lensweb Observe/Run lock, Mimic guaranteed drop, trapped Drowned, sailor brawl and
optional dungeon/boss routes (including Mulholland, Takomo and Wrongteeth). Their
location, sequence, outcome and quest writers cannot be inferred from the generic
stat block. Receiver victory/body discovery and the Sera/Liora return are mandatory
before MQ5. The fort report is resolved earlier, but guard/Polwick/Essa fights are
not universally mandatory because the spare/report route exists. No optional
western encounters should be assumed complete solely because MQ5 was assigned.
Eastern-fens terrain still has no encounters. This increment changes none of these
routes; supported enemy specials and explicit encounter/outcome ownership are the
next prerequisites before production routing.

### Gated player-side combat preparation

`combatPlayerState` in `combat.js` is a transient headless authority whose sole
visible preparation caller is the isolated developer Party Combat Lab; the headless
persistent bridge above is the other authorized lifecycle owner. A
separate explicit-only command preparation is documented below. It is orthogonal to enemy
`combat.mode` (`null` / `single` / `formation`). `getView()` returns `null` with
no prepared player side/enemies, a frozen `single` snapshot of canonical Lely
when existing enemy state is installed, or a frozen `party` snapshot after
explicit two-member preparation. Existing battles require no new initializer.

`initialize()` accepts exactly two flat data descriptors with `characterId`,
`slot`, `name`, `hp`, `maxHp`, `atk`, `def`, `spd`, and `statuses`. Slots must be
0/1 in input order; stable authored IDs must be unique. The existing singleton
`player` identity is reserved. Descriptors are plain or null-prototype data
records; arrays must be dense ordinary arrays. Accessors, callbacks, extra keys,
live runtime records, custom prototypes, unsupported statuses and unsafe numeric
values reject before installation or identity allocation. Combat numbers follow
the existing nonnegative safe-integer convention, with positive maximum HP and
HP no greater than that maximum. Future scheduling must separately validate
arithmetic overflow; this increment performs no attacks.

Each installed member privately owns mutable HP and a copied array of the six
existing status IDs. These are labels only: no duration, speed roll or effect
execution is implemented. Authored identity/name/base stats/max HP and slot are
frozen definitions; membership order is frozen. Runtime IDs `combat_party_N`
use a separate monotonic sequence, never enemy IDs and never RNG. Cleanup drops
membership, but does not recycle IDs. `setHp()` and `setStatuses()` require the
exact current runtime ID and inactive combat, with no owning party session;
zero HP retains the slot. Inspection by exact runtime ID or authored ID returns detached, recursively frozen snapshots,
never live records. There is no current-ally pointer or implicit retargeting.

Initialization uses the shared read-only inactive-combat preparation preflight.
Pending messages, outcomes, callbacks, sessions/playback, active UI, dangling
combat effects, and an existing pair reject. A neutral inactive singleton enemy
or untouched enemy formation can coexist without changing enemy identities,
observations, slots or escape policy. Enemy installation/cleanup leaves the pair
intact. `clear()` is the sole player-side cleanup: inactive only, no Lely/enemy,
reward, recovery, flag or inventory writes. Reinitialization is deterministic.

`assertSinglePlayerExecution()` guards activation, encounter starters, singleton
processing/finalizers, formation validation/playback, equipment/item effects,
status/reward mutation and battle drawing. The existing session cannot begin.
Keyboard input and world simulation are suspended during preparation. The one
debug-Lab input/render route is described below; there is no canonical caller.
Preparation cannot save. A successful load clears it at the existing commit
boundary, after validation; failed loads preserve it. No party metadata enters
save payloads or bindings; `SAVE_VERSION` remains 4.

Existing singleton assumptions deliberately retained:

| Authority | Current ownership and next boundary |
| --- | --- |
| HP, base stats, equipment, inventory | `state.js`'s canonical `stats`; world `player` owns position only. No second mutable Lely record. |
| Effective ATK/DEF/SPD and capabilities | Existing `combat.js` helpers read canonical equipment, `statusEffects`, `slitherSpd`, and corrosion. No party equipment/inventory policy yet. |
| Round effects | Bullet Time, Bomb, burn, poison, curse, muddied, Slither and dazzled remain under existing singleton/formation authorities. No per-member duration semantics introduced. |
| Targeting, sessions, playback | Existing enemy runtime IDs and slots; the player actor remains `player`. No allied targeting or initiative. |
| Rewards, defeat, recovery | Existing finalizers mutate canonical stats, inventory and world state. Prepared pairs cannot enter them. |
| Presentation, input, simulators | Existing views/controls and production combat formulas remain in use; historical traces and renderer comparison remain compatibility evidence. |
| Persistence | Canonical Lely and existing world flags only. No roster, slot, runtime ID or inactive preparation serialization. |

The Attack-only scheduler below is the sole explicitly invoked execution path
for prepared members. Inventory ownership, equipment exchange,
persistent world-party membership, Rareborn/resonance, rewards and presentation
remain separate future decisions. This increment supplies no canonical party
stats, characters, abilities, content or lore.

### Headless party Attack rounds

`combatPlayerState.resolveAttackRound({type:'attack-round', allyActions,
enemyActions})` is the sole new execution authority. Its only production-source
caller is the gated headless party session below, which has no gameplay entry.
Each action is exactly `{actorId,targetId}` using current runtime IDs. Every actor
alive at round start appears exactly once on its own side, with an initially
living opposing target. The method normalizes action-array order to ally slots
then enemy slots. Missing, duplicate, stale, wrong-side and dead identities reject,
as do extra fields, accessors, functions, custom prototypes and runtime records.
Two prepared party slots remain mandatory; a defeated slot stays in membership
and receives no command on subsequent rounds.

Supported enemy membership is one inactive singleton or two/three inactive
formation members. Canonical capability metadata admits ordinary mechanics and
excludes the Receiver trio and all bespoke capabilities. Party statuses must be
empty. Existing combat
bookkeeping must be neutral, with no messages, callbacks, sessions, playback,
outcomes or effects pending. Existing enemy-formation accounting remains untouched.
The party round authority binds the exact enemy membership; replacing it requires
explicit party cleanup/preparation, never an automatic rebind.

Initiative is weighted random ordering without replacement, only for this new
party scheduler. Existing singleton and one-player formation schedulers still
use their unchanged `speedWinChance()` contests and RNG order.

Before RNG, the scheduler snapshots effective Speed for every living actor.
Supported party members have no equipment/effects and use the existing minimum-one
Speed rule; ordinary enemies retain their raw Speed for attack/evasion arithmetic.
The pure, capacity-neutral `planPartyAttackOrder(actors,tape)` gives each positive
Speed exactly that weight. Legal zero Speed gets initiative weight 1 without
changing the stat. Negative/fractional/non-finite base Speed is invalid under the
existing preparation contract. `partyInitiativeWeights()` validates each weight
and the full safe-integer sum before installing round state or drawing RNG; all
remaining subset sums are then safe. No speed offset, probability cap or exponent
is applied. Canonical Lely and existing speed-contest rules are unaffected.

The planner scans remaining actors in ally-slot then enemy-slot order, selects
the cumulative interval containing `roll * totalWeight`, removes that actor's
entire weight and repeats. Intervals are `[start,end)`: an exact boundary selects
the next actor. Identity, side, slot and labels never change weights. The last
remaining actor is appended without RNG. For 2/3/4/5/6 living actors, initiative
uses exactly 1/2/3/4/5 rolls. The fixed plan uses only the initial Speed snapshots;
deaths cannot reorder it. Positive-weight pairwise precedence is `A/(A+B)`,
independent of the other actors present.

The pure planner accepts a numeric tape prefix and requests another value when
incomplete; replaying a pure prefix never reruns an attack or reads live state.
The top-level result schema is unchanged. Its immutable `initiative` array now
contains one `weighted_draw` per consumed roll, recording candidate IDs/weights
in scan order, selected identity/side/slot, weight, total, roll, point and interval
bounds. There is no pivot/contest metadata or draw record for the final actor.
The immutable `order` still contains every living actor and committed target.
Prepared gameplay scope remains exactly two allies against one to three enemies;
six-actor/3v3 fixtures exercise only the internal planner.

Suite 163 checks exact tapes, boundaries, snapshots, safe sums and N-1 draw counts.
Its statistical audit uses a fixed seeded xorshift32 PRNG, 12,000 rounds per
configuration, binomial/uniform-rank six-standard-error tolerances plus one-sample
rounding slack. It covers 2–6 actors, equal-speed ranks/first positions, side/slot
permutations, monotonic Speed, extreme gaps and pairwise precedence with unrelated
actors. It uses no ambient RNG and does not relax production party membership.

Execution uses the fixed plan and exact target identity, without retargeting.
A dead actor produces `skip/actor_dead`; a dead target produces
`cancel/target_dead`. Each executing attack consumes exactly three further RNG
values in variance → critical → evasion order. It uses the actor's own ATK and
target's own DEF, with the existing 80% incoming-defense cap for party targets.
`attackDamageNumbers()` preserves operation order and critical-before-rounding;
ordinary evasion uses the existing explicit-speed, false-capability branch of
`evadeChance()`, which never reads Lely's equipment or Bullet Time. Party base SPD
uses the existing minimum-one rule. `attackNumbersAreSafe()` is the unchanged
formation numeric check extracted behind its original wrapper, shared only for
preflight. All committed attack bounds and initiative sums validate before RNG.
Canonical Lely's stats, inventory, equipment and statuses are never impersonated.

Only the exact recipient's authoritative HP is assigned, once per executing
attack, clamped at zero. Events record attempted/applied damage, crit/evasion,
and HP before/after. All enemies dead means victory; both allies dead means
defeat. One casualty does not end the fight. A terminal hit immediately truncates
remaining execution, matching existing formation behavior; the unexecuted tail
remains in the plan without synthetic cancellation events. Sequential Attack
cannot produce a draw because the attacker survives its own action.

One successful call, including an early terminal result, advances the private
party round count exactly once and emits `round_end`. `getRoundView()` is
read-only; inspection, invalid requests and individual actions do not advance
it. The result deeply freezes `{round,command,initiative,order,events,outcome,
party,enemies}` snapshots, with no callbacks, presentation text or mutable
records. Future HP changes cannot alter a returned result. Ongoing rounds may
continue; terminal rounds reject further execution.

Unexpected post-validation exceptions retain consumed RNG and already-applied
HP, leave the count unadvanced, and expose a `fault` plus round/event/initiative
counts. They surface the original exception and reject retries. Reentrant member
mutation/cleanup is blocked while resolving. Explicit cleanup may discard the
fault but never refunds HP or RNG. All existing activation, input, rendering,
movement, item/status, reward and save guards remain intact. Successful load or
explicit cleanup discards transient round state; no payload or version change.

The detached playback and gated headless session below consume these results.
UI, broader target AI, content, equipment/inventory policy, rewards and
effect-duration timing remain deferred. No canonical stats or encounters were added.

### Generalized headless party command authority

`combatPlayerState.initializeCommandParty({members, inventory, escape})` is a
separate explicit preparation gate whose only production caller is the isolated
Party Combat Lab. `members` uses
the same closed descriptor schema/identity allocator as `initialize()`, but
accepts 1–3 ordered members. `inventory` is a dense detached array of registered
item-name IDs (duplicates represent quantities); no canonical inventory object
is accepted or mutated. `escape` is `blocked` or `fastest_living`; an already
blocked enemy-formation policy cannot be overridden. Initial equipment is empty.
`getCommandView()` exposes only copied frozen data. `clear()` discards this state
alongside the existing party authority, without enemy cleanup, rewards or RNG.

This gate requires an inactive, untouched, capability-compatible singleton or formation,
no session/playback/messages/outcomes or active Lab/UI. It validates the entire
request before allocating party identities. The fixed Lab scenarios use ordinary
templates plus Mulholland's metadata-driven boss lock; no Receiver coordination or
bespoke enemy capabilities are introduced. An internal
WeakMap captures `isBoss === true` when each enemy
instance is created. It adds no enumerable enemy field or save metadata. The
prepared command encounter retains that lock even after the boss dies. Member
and enemy arrays are bound exactly; external enemy HP/stat/observation edits or
replaced membership reject. External party HP/status setters are disabled for
command preparation. Legacy Attack preparation, scheduler, playback and sessions
cannot accept this expanded state.

Authority audit: canonical `stats`, `statusEffects`, `slitherSpd`, `combat` effects
and `equipItem()`/`applyStatusCure()` remain the singleton/one-player-formation
authorities. Those mutating wrappers cannot operate on another ally. The command
resolver instead owns each member's HP/status array, private registry-ID loadout,
and timed effects; it shares `formationItemDefinition`, `slotForType`,
`effectiveAtk`, `healingItemAmount`, `offensiveItemDamage`, `itemCuredStatuses`,
`attackDamageNumbers`, `attackNumbersAreSafe`, `playerIncomingMitigation`,
`evadeChance(..., false)`, `getObservationText`, and `speedWinChance`. DEF/SPD
composition uses the same base/gear/mud arithmetic with explicit member state,
never the global status readers. No temporary substitution of canonical Lely.

`resolveRound()` accepts this closed request:

```js
{ type: 'party-round', allyActions: [ /* below */ ],
  enemyActions: [{ actorId, targetId }] }
```

Allied actions are exactly `{type:'attack',actorId,targetId}`,
`{type:'observe',actorId,targetId}`, `{type:'item',actorId,itemId,targetId}`, or
`{type:'run',actorId}`. Only an established all-enemy item (`Void Shard`) omits
`targetId`; supplying one there rejects. Healing, cure and Bullet Time explicitly
target any living ally; equipment and Bait explicitly target their user. Offensive
items, Bombs, reagents and Trollbane target an exact living enemy. Key items reject.
Duplicate actors, unknown fields, accessors, prototypes, stale/wrong-side IDs,
dead actors/initial targets, aggregate overcommit and unsafe arithmetic reject
before any RNG or mutation. Every living ally and enemy supplies one action;
Run is an ordinary ally action and may appear beside any other allied command.

Equipment transfers one inventory copy to its user's private slot and returns
prior gear to shared inventory. Scheduled consumption happens only on execution;
dead users skip and dead targets cancel without consumption/retargeting. Numeric
preflight covers possible equipment changes, mud/cleared-status mitigation,
all opposing attack pairs, inventory commitments, observation-count additions,
item/delayed damage and cumulative Speed weights before execution. Bait remains
a non-consuming no-op; unmatched reagents and Trollbane on these unsexed,
non-regenerating enemies consume with no effect. Full-HP healing and absent-status
cures retain their established consuming no-effect behavior.

Poison remains a status without a combat tick. The approved generalized-party
Curse rule intentionally differs from legacy combat: check execution-time Curse
first (one draw, `< 0.25`). A fumble consumes the action and deals 1 damage without
variance, critical or evasion rolls; otherwise draw variance, critical and evasion
in that order. Thus ordinary Attack uses 3 action draws, proceeding Cursed Attack
4, and a fumble 1. Dead actors/targets skip/cancel before any conditional draw.
An earlier Amethyst Dust cure suppresses a later Curse check. Singleton and
one-player Formation retain variance → critical → Curse → evasion, including
legacy evasion on fumbles; their implementations and captures are unchanged.

Slither ownership preserves existing command-specific timing. An optional closed
`slither:[{slot,speed}]` preparation field must provide exactly one seed, in slot
order, for each descriptor carrying Slither. Speeds are safe integers 1–20; no
seed is allowed for an unaffected member. This represents an already-applied
status, consumes no RNG and never calls the singleton `triggerSlither()`.
Each private per-member effect stores `{speed,round,roll,source}`: prepared seeds
use round 0, null roll and source `prepared`. Before initiative, living allies
committing Attack or Observe each sample once in stable slot order:
`floor(draw * 20) + 1`. The sample records the current round and command source.
Item/Run and non-running allies reuse their prior/application sample; dead actors
consume no samples. A living actor later killed still retains its planned sample.
Initiative, evasion and Run all read the same owned Speed without resampling.
Slither overrides ordinary gear/mud Speed as it does in established combat.

The prospective maximum sampled-weight sum is validated before RNG or mutation.
New samples precede weighted initiative; later status changes never reorder it.
There is no Slither application-round exemption or timed expiry in existing
combat, and no authored Slither cure. Shared cure removal discards sampled state
when the status is removed (covered by an isolated cure-mapping fixture).
Whole-preparation cleanup discards it. The allowlisted enemies/items cannot apply
Slither mid-round; unsupported application capabilities continue to reject.
Read-only views cannot modify or inject stale samples.
Muddied affects DEF/SPD, Dazzled affects attack accuracy, Burn ticks once at the
round boundary. Ember Root respects the existing mud-acquisition gate. No
enemy applies new statuses. Supported equipment capabilities (defence-cap bypass,
evade-all and passive protection) never read canonical equipment.

Weighted initiative is the unchanged pure without-replacement planner, using
start-of-round effective Speed and minimum weight 1. It consumes N−1 draws;
each ordinary executed Attack consumes variance/critical/evasion draws in that
order. Curse uses the conditional contract above. Item/Observe have no action RNG;
Slither Observe still has its pre-initiative sample. A Run actor participates in the same
initiative plan as every other commanded ally and living enemy. Allowed Run consumes one success roll
using the runner's effective Speed against the fastest living enemy (slot order
breaks ties); blocked/dead-runner Run consumes none. Success truncates with
`escape`; failed/blocked attempts leave subsequent enemy actions scheduled.
Boss evidence and blocked encounter policy never unlock through Observe.

One completed sequence advances the existing private completed-round authority
once. Bullet Time exempts its application round and decrements once at each
later round end, including early terminal rounds as in Formation. Each user's
Bomb has its own exact target, fuse, damage, defence policy and application round;
it exempts application, ticks once after ongoing actions, clears on dead target,
and never retargets. Re-arming replaces only that user's Bomb. Burn then Bomb
ticks run in stable owner-slot order; terminal victory/defeat truncates remaining
actions/ticks. A dead owner does not remove an already-armed Bomb. No duration
advances per actor or frame. Terminal rounds cannot be retried.

The result is deeply frozen plain data with exact keys
`round, command, initiative, order, events, outcome, before, after, party, enemies`.
`initiative` retains the existing weighted-draw schema. Ordered actions retain
`actorId,targetId,side,slot,spd` and add `commandType`; Run/all-enemy items have a
null planned target. Outcomes are `ongoing/victory/defeat/escape`. Both snapshots
contain `party,enemies,inventory,equipment,effects,escapePolicy,bossLocked`.
Allies include original identity/slot/base stats/statuses plus side and explicit
effective stats/capabilities; enemies include observation state and boss evidence.
Gear/effects bind exact actor IDs. Final `party/enemies` duplicate the final
snapshot values for inspection, never live records.

Closed events (suites 170–171 assert exact keys): Attack retains damage/HP/crit/evade
fields plus ordered-action fields. Item/Equipment add item ID, effect category,
consumption and complete before/after snapshots. Observe adds before/after count,
unchanged escape flags and revealed lines. Run adds allowed/opponent/chance/roll/
success. Status and effect records explicitly describe application deltas; these
are annotations of the corresponding Item transition, not a second mutation.
`delayed_effect_tick` names effect, owner, target, before/after effect state and
damage/HP. Skip/cancel retain `actor_dead`/`target_dead`. A recorded `outcome`
precedes the final `round_end`, which has before/after count and effect snapshots.
The generalized playback validator below consumes this history. The Attack-only
playback API continues to reject generalized results.

Conditional status evidence is closed and immutable:
- `curse_check`: `type,actorId,targetId,side,slot,status,round,chance,roll,fumbled`.
  It immediately precedes the corresponding Attack; that Attack supplies exact
  HP/damage evidence. A fumble is distinct from evasion or cancellation.
- `slither_sample`: `type,actorId,side,slot,status,round,commandType,roll,
  speedBefore,speedAfter`. Samples precede initiative/action events; final effect
  snapshots retain the sample and its ownership. Playback must never reroll them.

`initialize()` and `initializeCommandParty()` both use private `members`,
`prepareMembers()`, `installMembers()`, and the same identity sequence and round
state. `commandBattle.roster` references those exact members, with no copied
mutable HP or statuses. Its sidecar owns only local inventory/loadouts/effects
and encounter bindings. Either initializer rejects existing membership; `clear()`
removes all party/command/round/session state atomically without touching canonical
Lely or enemies. Legacy setters and Attack sessions cannot mutate command parties.
No production caller enters this preparation. The explicit standard session below
is the generalized resolver's sole production-source caller; no gameplay path
starts that session mode.

Complete combat-item parity audit (stable registry name IDs; suite 171 asserts
exhaustive coverage and executes each available definition):

| Category | IDs | Generalized party behavior |
| --- | --- | --- |
| Healing | Potion; Elixir; Mushroom Wine; River Smelt; Canal Eel; Ember Root | Existing capped healing on a living ally; Ember Root preserves gated mud application. |
| Cure | Reed Remedy; Amethyst Dust | Shared poison/Curse cure properties; no matching status still consumes. |
| Temporary effect | Bullet Time | Selected ally owns evasion and three-round duration, application exempt. |
| Immediate damage | Sapper Charge; Throwing Knife | Exact enemy; existing defence/minimum-damage rules. |
| All-enemy damage | Void Shard | No selected target; simultaneous damage to living enemies. |
| Delayed damage | Bomb | User-owned fuse bound to exact enemy; application exempt. |
| Equipment | Bronze Knife; Iron Sword; Leather Armor; Steel Sword; Iron Shield; Swift Bangle; Battle Axe; Dragon Blade; Shadow Cloak; Mithril Shield; Wraithband; Warden Blade; Resonant Targe; Fen Mask; EvadeAll; Cat Armor; Old Boot; Fen Cowl; Bottle of Mushroom Wine; Case of Mushroom Wine; Amethyst Bangle | Acting ally equips; prior gear returns to local shared inventory. Existing stat/capability definitions remain authoritative. |
| Reagent | Henbane Sprig; Jackbane Vial | Consumed with no effect on supported unsexed templates, as established. |
| Compatibility-specific | Trollbane | Consumed with no effect on supported non-regenerating templates. |
| No effect | Bait | Non-consuming no-op. |
| Unavailable key | Old Fishing Rod; Fen Angler's Rod; Waxwood Rod; Sealed Letter; Warp Stone; Thank-You Note; Schilling; Cat-Shaped Key; Letter from Netto; Dispatch Letter; Doctor's Letter; The Drowned's Gift; Old Engagement Ring; Stashed Gem | Excluded from combat inventory; preparation/commands reject. |

All 38 selectable definitions are supported; all 14 keys reject. No new effects,
canonical inventory/equipment ownership, items, save fields or content are added.

Execution errors retain consumed RNG and mutations, set the existing diagnostic
fault, and block retry. No rollback, rewards, recovery, save binding, UI/input
integration or normal-gameplay route is added. Only the explicit standard session
below may invoke generalized resolution.
`SAVE_VERSION` stays 4. Existing `resolveAttackRound()` results remain unchanged.

### Detached generalized party command playback

`combatPlayerState.createRoundPlayback(result)` validates a completed frozen
`resolveRound()` history and builds a detached immutable reel.
`combatPlayerState.projectRoundPlaybackFrame(reel,index)` reads only that reel;
invalid indices throw `RangeError`, and copied/forged reels reject. Neither API
has a gameplay caller. The standard session below is their sole production-source
consumer. The Attack-only playback APIs and their schemas remain unchanged. No
Lab, input, renderer, save or content integration is added.

Reel keys are exactly `round,command,initiative,order,eventCount,frameCount,frames`.
Frame keys are exactly `round,command,frameIndex,eventIndex,currentEvent,party,
enemies,inventory,equipment,effects,escapePolicy,bossLocked,complete,outcome,
completedRounds`. Party/enemy records retain all recorded snapshot fields plus
`alive` and `defeated` derived from historical HP. Statuses and effective stats
are embedded in each party record; observation counts in each enemy record;
Slither ownership is embedded in member effects. Membership remains in original
slots, including defeated actors and duplicate authored enemy templates.

Frame zero copies `before`, has index 0 / event index −1 / null event, and reports
`completedRounds = round - 1`. Frame N follows event N−1. There are exactly
`eventCount + 1` frames; only the final `round_end` frame is complete. Outcome
remains `ongoing` through damaging/escape events, becomes visible at the recorded
`outcome` event, and remains available in the final frame. Completed-round count
and boundary duration changes advance only in the recorded `round_end` frame.
Repeated and out-of-order projections return the same frozen historical frame.

Creation requires a deeply frozen, data-only tree; it rejects accessors,
callbacks, custom prototypes, cycles/aliased containers, unknown keys/types,
unsafe numeric fields, malformed slots/identities and contradictory histories.
It validates exact commands, living actors/initial targets, Run exclusivity,
inventory reservations, complete ordered opportunities and weighted-draw records.
Recorded candidate order, weights, cumulative intervals and selected identities
must agree with the declared initiative order. No planner or RNG is invoked.

Projection uses recorded values and validates continuity:

- Attack checks exact actor/target, historical life state, HP before/after,
  applied loss, clamping, critical/evasion types and terminal truncation. It
  never recomputes attack, defence, critical or evasion formulas.
- `curse_check` must immediately precede a living Cursed ally's Attack. Its
  recorded 25% check and fumble flag must agree. A fumble records exactly one
  attempted damage with neither critical nor evasion; no unused rolls are added.
- Slither Attack/Observe samples occur exactly once per affected living actor,
  in slot order before actions. Recorded sample mapping, prior value, owner,
  round and resulting initiative Speed must agree. Item/Run retain their sample.
- Item/Equipment events validate their entire `before` against projection, then
  permit only category-specific changes recorded in `after`. Inventory removal,
  non-consuming no-ops, gear exchange/return, exact target, loadout owner and
  effective-stat fields are checked. Healing cannot damage; damage cannot heal;
  cures cannot add statuses. All unrelated state must remain identical.
- Status/effect annotation events must immediately match their Item transition;
  they do not apply it twice. Bullet Time/Bomb ownership and application rounds
  are retained. No effect function or live equipment mutation is called.
- Observe checks exact instance, count +1 and unchanged escape state, and copies
  revealed strings without rereading enemy text.
- Run checks the selected runner, historical boss/policy lock, fastest living
  opponent identity, recorded allowed/blocked roll evidence and success flag.
  It does not recompute the escape formula. Successful Run truncates execution.
- Dead actors skip; dead committed targets cancel without retargeting or item
  consumption. No additional reasons are accepted by this resolver contract.
- Burn/Bomb ticks follow recorded owner order and HP/effect continuity. Bombs
  retain their target and application exemption; terminal ticks truncate later
  work. Round end checks one increment and the recorded Bullet Time decrement.
- Victory requires all enemies dead, defeat all allies dead, escape a successful
  Run; otherwise outcome is ongoing. Final projection must exactly equal `after`,
  including inventory, equipment, statuses, effects and observation state.

A frozen vocabulary derived once from the item registry supplies only valid
IDs, key-item exclusion, effect categories, equipment slots and cure/mud ownership.
Playback never reads item amounts/bonuses or uses definitions to calculate an
alternative result. Recorded damage/healing amounts, effective-stat snapshots,
revealed text and escape probabilities remain evidence, not a second simulation.
Continuity validation does not cryptographically authenticate an entirely forged
but internally coherent history.

No live party/enemy/combat state, formulas or effect implementations are read by
creation or projection. RNG, identities, HP, inventory, statuses, observations,
round counters, rewards and saves remain unchanged. Reels survive cleanup,
replacement, subsequent rounds, registry changes and save/load. Suite 172 covers
authentic mixed-command histories, every selectable item, 1–3 actors per side,
3v3, malformed histories and isolation. Generalized controller and visible command
integration remain deferred; `SAVE_VERSION` remains 4.

### Detached party Attack playback and closed result contract

`combatPlayerState.createAttackRoundPlayback(result)` and
`combatPlayerState.projectAttackRoundPlaybackFrame(reel, frameIndex)` are headless,
explicit-only readers. The gated headless session is their only production-source
caller; no gameplay entry, UI, renderer, timing, reward/recovery path or save
binding reaches them. The private `partyAttackPlayback` authority validates/copies histories and recognizes its own
immutable reels; neither method reads current party/enemy/combat state. Existing
singleton/formation playback and their guards are unchanged.

Suite 163 locks the scheduler's existing exact schema, without changing its
returned data. Every object/array is frozen, plain data (no getters, callbacks,
custom prototypes, mutable containers or live combat records):

| Record | Exact keys |
| --- | --- |
| Result | `round, command, initiative, order, events, outcome, party, enemies` |
| Command | `type, allyActions, enemyActions` (`type: "attack-round"`) |
| Submitted action | `actorId, targetId` |
| Ordered action | `actorId, targetId, side, slot, spd` |
| Weighted draw | `type, actorId, side, slot, candidates, weight, totalWeight, roll, point, intervalStart, intervalEnd` (`type: "weighted_draw"`) |
| Draw candidate | `actorId, weight` |
| Attack event | `type` plus ordered-action keys plus `attemptedDamage, appliedDamage, critical, evaded, hpBefore, hpAfter` |
| Skip/cancel event | `type` plus ordered-action keys plus `reason` (`actor_dead` / `target_dead`) |
| Round-end event | `type, roundBefore, roundAfter, outcome` |
| Ally snapshot | `characterId, slot, name, maxHp, atk, def, spd, instanceId, hp, statuses` |
| Enemy snapshot | `id, name, hp, maxHp, atk, def, spd, xp, goldMin, goldMax, instanceId, slot, observeCount, escapeUnlocked` |

`round` is the positive safe-integer completed-round number; the only boundary
record is the final `round_end` with `roundBefore = round - 1` and
`roundAfter = round`. Outcomes are `ongoing/victory/defeat`; sides are `ally/enemy`.
HP/stats/slots and numeric enemy metadata are nonnegative safe integers, maximum
HP is positive and HP never exceeds it. Ally statuses are empty; enemy escape is
false. Critical/evasion fields are booleans. Runtime IDs retain their party/enemy
prefixes, are unique across the history, and bind exact side/slot membership.
Ally authored IDs are unique; enemy authored IDs may repeat. All commands name
initially living opposing targets, in canonical side/slot order. Ordered actions
are unique, keep committed targets and carry historical effective Speed.

Playback requires a deeply frozen input tree, as produced by the scheduler.
It rejects mutable/live records, accessors, foreign prototypes, cycles/aliases,
unknown fields and malformed values before returning anything. It copies the
whole supplied result, validates weighted candidates/intervals and their agreement
with the supplied order, then discards the source reference. It never calls the
initiative planner or draws/replays RNG. The order's historical Speed is the
weight authority; final enemy stat fields are not a replacement Speed snapshot.

Reconstruction starts with final HP in detached numeric storage and walks Attack
events backward, requiring each target's current projected HP to equal `hpAfter`
before restoring `hpBefore`. Forward projection checks exact actor/target IDs,
alive actors, target continuity, skips/cancellations, recorded loss, evasion and
zero-HP clamping. It checks numeric/boolean attack fields but does not rerun damage
or critical formulas: there are no attack RNG rolls in this schema. Validation is
structural consistency, not a provenance certificate for externally forged data.
Events must be an exact prefix of the fixed plan followed by one `round_end`;
ongoing rounds consume the whole plan and terminal HP forbids further action
events. Final projected HP must equal every authoritative final snapshot.

A reel has `round, command, initiative, order, eventCount, frameCount, frames`.
Each frame has `frameIndex, eventIndex, currentEvent, party, enemies, complete,
outcome, completedRounds`. Member rows retain every snapshot field, with historical
HP plus `side, alive, defeated`; fixed zero-HP slots never compact. Frame 0 is
before events (`eventIndex: -1`, `currentEvent: null`). Frame N is after event N−1,
so `frameCount = eventCount + 1`. Only the final frame is complete; outcome and
completed-round count change only on the recorded `round_end`, never on an earlier
lethal Attack. Repeated/out-of-order reads return the same immutable frames.
Invalid indices throw `RangeError`; forged/copied reels are not projection handles.

Playback's structural bounds are one to three allies and one to three enemies,
including six actors. Suite 164 exercises these bounds with frozen, noncanonical
structural fixtures. Live preparation remains exactly two allies; its scheduler
and returned results are unchanged. No combat identities are allocated by
playback. Cleanup, replacement actors, later rounds and save/load cannot change
an existing reel. No HP/status writes, round ticks, commands, messages, outcomes,
flags, inventory, equipment, rewards or saves are changed; `SAVE_VERSION` is 4.

### Standard headless party command sessions

`combatPlayerState.session.begin({commandSet:'standard'})` explicitly binds fresh
`initializeCommandParty()` state: one to three fixed ally slots against one to
three supported enemies. It extends the same private `sessionState` closure and
single-use resolver permit; it is not another controller or party model. Options
are closed records. The isolated Party Combat Lab is the sole production caller.
No-argument `begin()` remains available as the Attack-only compatibility path.
The two modes reject simultaneous entry and cannot adopt an
already resolved standalone round.

The standard command order is `attack, item, observe, run`. Its additional API is:

| API | Responsibility |
| --- | --- |
| `moveCommand('previous'|'next')` / `confirmCommand()` | Wrap the four commands, then enter targeting/item selection or submit that ally's Run draft. |
| `moveItem('previous'|'next')` / `confirmItem()` | Move a bounded inventory cursor; choose its item and explicit targeting category. |
| `cancelItem()` | Return to the acting ally's command menu, retaining the item cursor/scroll. |
| `moveTarget('previous'|'next')` / `confirmTarget()` | Wrap living exact runtime targets in slot order; validate and submit one closed draft. |
| `cancelTargeting()` | Return to the item list for Item, otherwise to the ally's command menu. |

The existing `submitAttack({actorId,targetId})` is also supported as an exact-ID
compatibility path in standard mode. All collection/navigation is RNG-free.
Attack and Observe target living enemies; default selection is the lowest living
slot, or a still-valid remembered cursor. Beneficial items target living allies,
defaulting to the actor. Equipment/no-effect self items explicitly target their
actor; all-enemy items omit a target. Duplicate templates never share identity.
Observe does not reveal knowledge until authentic round execution.

Normal phases are `awaiting_action -> targeting -> awaiting_action/ready`, or
`awaiting_action -> item -> targeting -> awaiting_action/ready`. Self/all-enemy
items can submit directly from `item`. Run likewise submits one draft and advances
to the next living ally. Dead allies are omitted from collection without compacting
slots. Once every living ally has a draft, `ready` requires a separate
`commitRound()` call. Backtracking restores Run exactly like any other draft.
All living allies remain possible enemy targets.

Items are grouped by stable registry ID in inventory first-appearance order,
matching existing combat grouping. Each row exposes `itemId,name,total,available,
usable,targeting`; categories are `ally,enemy,self,all_enemies`. Earlier Item
drafts reserve quantities, including established non-consuming no-op commitments
under the resolver's existing reservation rule. Reservations never consume live
inventory. Zero-available rows remain visible but cannot be selected. Key items
cannot enter the battle-local preparation, so they never appear. Cursor movement
clamps at list ends; `itemScroll` retains a three-row window, with no pixel layout.

`backtrack()` first cancels the current targeting/item depth. From `ready`,
or an ally's command menu with prior drafts, it removes the last draft, releases
its reservation and restores that ally's exact command/item/target cursor and
scroll. Targeted drafts reopen targeting; self/all-enemy items reopen the item
list. From targeting, cancel once to the command menu (twice for Item), then
backtrack again to edit an earlier ally. The first ally with no draft rejects;
scenario exit remains an adapter responsibility.

Every operation binds roster references, exact identities, fixed slots and full
prepared snapshots. The seal includes local inventory, equipment, statuses,
effects, observation, escape policy and item definitions. Commit reuses the full
resolver preflight, including aggregate reservations, prospective equipment and
all possible enemy-target arithmetic, before any target RNG or mutation.
Enemy actions are generated once in living enemy-slot order: one uniform draw
per enemy for two/three living allies, zero draws with one living ally. Targets
are frozen and never retargeted. The standard controller's single call site for
`resolveRound()` is followed immediately by its single `createRoundPlayback()`
call. Existing weighted initiative and conditional action RNG remain unchanged.

Commit proceeds synchronously through `resolving` to `playback` frame zero.
`advancePlayback()` moves one event at a time using generalized historical frames;
its final frame enters `playback_complete`. Only a separate
`acknowledgePlayback()` resumes `awaiting_action` at the first surviving slot or
locks `victory`, `defeat` or `escape`, retaining the final frame. All command and
cancellation operations reject during unresolved playback and terminal states.
Post-RNG exceptions retain consumed effects/targets and enter the existing
`fault` diagnostic phase, recording stage/target draws/completed rounds. No retry,
refund, automatic cleanup, rewards or recovery occurs.

Standard view keys are `commandSet,phase,nextActorId,currentAlly,commands,
selectedCommand,commandCursor,pendingCommandType,targetSide,
selectedTargetInstanceId,validTargetIds,selectedItemId,items,itemCursor,itemScroll,
allyActions,enemyActions,reservedInventory,ready,party,enemies,inventory,equipment,
effects,escapePolicy,bossLocked,playbackFrame,frameIndex,frameCount,completedRounds,
awaitingAcknowledgement,terminalOutcome,failure`. Every nested value is detached
and frozen. Selection is exposed only in its applicable collection phases.
During playback/terminal phases all HP, inventory, equipment, statuses, effective
stats, observation, Slither samples and temporary effects come exclusively from
`projectRoundPlaybackFrame()`, never from already-final live state. The retained
frame reveals outcome at its recorded boundary; terminal phase waits for ack.

Suite 173 covers selection, reservations, backtracking, all party sizes, Run,
exact target RNG, once-only scheduling/playback, historical continuity, stale
bindings, fault lockout and no unauthorized standard-mode callers. Legacy party
and formation suites continue to assert their original schemas/traces. The
debug-only Lab integration below owns the sole external standard-mode call path.
No encounter, content, persistent state or save bindings are changed;
`SAVE_VERSION` remains 4.

### Gated headless party session (Attack-only mode)

`combatPlayerState.session` is a frozen controller API whose sole production
caller is the isolated Party Combat Lab below. The controller itself has no input
or rendering dependency.
`begin()` requires fresh, valid inactive two-member preparation
and one to three supported enemies. It will not adopt a standalone resolved round
or unresolved playback. Enemy mode and existing singleton/formation controllers
remain unchanged; `combat.active` stays false.

| API | Responsibility |
| --- | --- |
| `begin()` | Bind exact membership, validate all possible Attack targets and begin collection. |
| `getView()` | Return a detached deeply frozen view or `null` before beginning. |
| `submitAttack({actorId,targetId})` | Accept the next living ally's exact runtime identity and a living enemy target. |
| `backtrack()` | Remove the last submitted action, reopening that living slot before commit. |
| `commitRound()` | Plan enemy targets once, resolve exactly once, immediately create immutable playback at frame zero. |
| `advancePlayback()` | Advance exactly one frame; reaching the final frame does not acknowledge it. |
| `acknowledgePlayback()` | Separately accept the final frame and resume collection or lock victory/defeat. |

Collection follows fixed ally slots, omitting zero-HP members without compacting
membership. Phases are `collecting -> ready -> resolving -> playback ->
playback_complete`; acknowledgement returns an ongoing round to `collecting`, or
locks `victory`/`defeat`. `resolving` is a synchronous internal phase. Backtracking
is permitted only during collection/readiness and consumes no RNG. Commands are
closed `{actorId,targetId}` records; duplicates, wrong-side/stale actors,
accessors, extra fields and nonprimitive identities reject before mutation.

The minimal enemy planner uses exactly one RNG draw per living enemy in slot
order when two allies live. With one living ally the target is deterministic and
uses no target RNG. For the stable living-ally slot list, `floor(roll *
livingCount)` chooses uniformly with replacement across enemies.
These frozen explicit targets are retained through playback and never retargeted.
No broader AI policy exists. All target draws precede the unchanged scheduler's
N−1 initiative draws and three draws per executing Attack. All possible opposing
attack pairs, current membership and cumulative Speed weights validate before
any target RNG; no targets are generated while backtracking.

The controller reuses the scheduler's extracted read-only state/action preflight.
It binds exact roster references, runtime identities, slots, supported stats and
HP, plus the private round authority. Subsequent operations reject replacement
or external mutation, pending legacy combat work, wrong phases, duplicate commits
and unresolved playback. While a session exists, direct scheduler calls and
`setHp`/`setStatuses` reject; only the controller's single-use private permission
can call the scheduler. Existing prepared-party input, rendering, movement,
saving, item/status and finalizer guards remain intact.

Views contain `phase, nextActorId, allyActions, enemyActions, party, enemies,
playbackFrame, frameIndex, frameCount, completedRounds, awaitingAcknowledgement,
terminalOutcome, failure`. During playback HP and round count come solely from
the historical frame, not already-resolved live HP. The final frame reveals the
recorded outcome; `terminalOutcome` locks only on acknowledgement. Ongoing
acknowledgement drops old commands/playback, preserves exact slots and collects
only surviving allies. Terminal acknowledgement grants no rewards or recovery.

Unexpected target/resolver/playback failures leave consumed RNG and applied HP
untouched, retain submitted/generated actions, and enter `fault` with stage,
target-draw count and completed-round diagnostics. No retry is allowed. Fault
views retain the last validated historical snapshot, not a reconstructed or
rolled-back live state. Existing explicit `combatPlayerState.clear()` may abandon
preparation outside resolution, dropping the session without changing enemy HP,
Lely or the world; it is not called automatically. Successful validated load also
discards transient state through that existing cleanup boundary. No fields or
bindings enter saves and `SAVE_VERSION` remains 4.

Suite 165 covers 2v1/2v2/2v3 collection, backtracking, uniform target intervals,
zero-HP slots, exact RNG budgets, one-shot resolution, acknowledged frame stepping,
terminal locks, stale membership and diagnostic failures. Suites 163/164 now
allow only this controller's scheduler/playback calls and still forbid gameplay
callers; their historical result and arithmetic assertions are unchanged. The
controller itself remains headless; the isolated Lab below owns its only menu,
input and rendering adapters without adding another target-planning authority.
Items/other commands, persistent parties, rewards/recovery and canonical content
remain deferred.

### Isolated Party Combat Lab adapter

`party-combat-lab.js` owns the isolated lifecycle around the authentic party
foundation and session. `PARTY_COMBAT_LAB_SCENARIOS` is a frozen five-record
catalogue with stable IDs `lely_esla_one`, `lely_esla_two` and
`lely_esla_three`; their supported ordinary memberships are respectively Marsh
Wisp; Marsh Wisp plus Briar Hound; and Reed Grappler, Silt Lurker plus Sluice
Slime. `command_showcase` uses two durable Reed Grapplers with wounded allies,
Curse and prepared Slither state. `boss_escape_lock` uses the existing Mulholland
template solely to display snapshotted `isBoss` Run blocking. No Receiver,
generated enemy or encounter ownership enters this catalogue.

The frozen `partyCombatLab` API is:

| Method | Contract |
| --- | --- |
| `isActive()` | Read the lifecycle gate without touching live session projection. |
| `isMenuOpen()` / `getMenuView()` | Inspect the isolated debug submenu. |
| `listScenarios()` | Return the frozen scenario catalogue. |
| `enter(id)` | Validate everything, install temporary enemies/party, then begin the real session. |
| `openMenu()` / `moveScenario()` / `closeMenu()` / `startScenario()` | Own the debug-only scenario-selection lifecycle. |
| `getView()` | Return a detached immutable active/inactive presentation view and recoverable error. |
| `moveCommand()` / `confirmCommand()` | Forward the current actor's menu: Lely has Attack, Item, Observe and Run; Esla has Attack, Resonance, Item and Run. |
| `moveItem()` / `confirmItem()` / `cancelItem()` | Forward the controller-owned item cursor, scroll and parent cancellation. |
| `moveTarget()` / `confirmTarget()` / `cancelTargeting()` | Forward exact ally/enemy targeting without accepting identities from input. |
| `submitAttack(action)` / `backtrack()` | Retain the exact-ID compatibility path and delegate deterministic editing. |
| `commitRound()` | Delegate one authentic session commit, including enemy planning, scheduler and playback. |
| `advancePlayback()` / `acknowledgePlayback()` | Delegate the existing historical frame boundaries. |
| `exit()` | Abandon temporary state without resolution, reward, recovery or RNG. |
| `emergencyAbort(message)` | Preserve a bounded diagnostic, then perform the same guarded cleanup. |

Entry requires empty inactive enemy state, no prepared party/session, neutral
combat bookkeeping, no Formation Lab/Receiver/debug/modal owner, valid regional
state and ordinary supported Lely state. It validates the selected frozen
scenario and templates, both temporary party descriptors, every possible attack
pair and the complete initiative sum before identities or state are installed.
Known invalid entry therefore consumes no RNG and no party/enemy identities.

The `lely_lab` member is a detached temporary snapshot. HP/max HP come from
canonical `stats`; ATK, DEF and SPD come from `effectiveAtk()`, `effectiveDef()`
and `effectiveSpd()`. Statuses must be empty and equipped objects may carry only
ordinary name/type/bonus/price data, so Cat Armor, status wards, guaranteed evade
and other unrepresented capabilities reject rather than being silently dropped.
The canonical stats object, inventory and equipment never become party-owned and
are never written by the Lab.

No Esla combat stat authority exists in canon. The adapter-local frozen
`PARTY_COMBAT_LAB_ESLA_PROFILE` is explicitly provisional: `hp/maxHp 50`, `atk
10`, `def 4`, `spd 8`, empty statuses and full HP on each entry. It defines no
level, equipment, Rareborn, resonance or persistent field. Her authored name is
reused; the profile is not character progression data.

Each entry also installs a detached shared inventory from existing registry IDs:
Potion ×3; Elixir, Reed Remedy, Amethyst Dust, Bullet Time, Throwing Knife and
Bomb ×2; and Sapper Charge, Void Shard, Bait, Iron Sword and Iron Shield ×1.
It is discarded on cleanup and never aliases canonical inventory or equipment.

The immutable Lab view adds only active state, scenario ID/label, presentation
profiles and diagnostic text to the controller view. Command/item cursors, scroll,
targets, drafts, reservations, historical state, playback and outcome remain
exclusively controller-owned.
It contains no canonical reference or callback. World simulation and keyboard
input are already inert while `combatPlayerState.hasParty()`; saving is already
refused. Loading has one narrow additional refusal while the Party Lab is active,
so it cannot invoke the ordinary successful-load party cleanup under the Lab.

Normal exit and emergency abort call the existing player preparation cleanup,
then the existing enemy collection cleanup. They do not call combat finalizers,
rewards, recovery, transitions or save code and draw no RNG. Canonical Lely/world
state was never mutated, so cleanup restores the exact pre-Lab canonical state by
discarding only temporary authorities. Enemy and party identity sequences remain
monotonic by design; immediate re-entry gets fresh provenance IDs. Unexpected
session failures keep their consumed RNG/applied temporary HP only long enough to
capture the error, then cleanup without retry. The debug-only route below adds no
save payload, encounter, quest or canonical party integration.

### Read-only Party Combat Lab renderer

`render-party-combat-lab.js` owns one presentation entry,
`drawPartyCombatLabBattle()`. It takes no arguments and acquires exactly one
detached immutable snapshot through `partyCombatLab.getView()`. An inactive Lab
draws nothing. An active snapshot is validated completely before the first canvas
operation: one to three fixed ally slots, one to three contiguous enemy slots, unique
runtime identities, safe historical HP, valid submitted actor/target identities,
phase/current-actor consistency, and playback-frame identity/HP agreement.

Enemy layouts are selected only by immutable roster size. A lone enemy uses the
Chapter One right-side sprite anchor and top-left name/HP strip through the shared
singleton geometry and sprite helper, with no A suffix. Two enemies retain their
232-pixel Formation slots and three retain their 144-pixel Formation slots. All
use the real `ENEMY_SPRITE_DISPATCH`, stable runtime identity, defeated dimming,
mechanic badges and historical HP. Ally positions are fixed at x 108, 256 and 404
on one feet baseline at y 277 and never compact. Lely calls the unchanged
`drawBattlePlayer()` at its ordinary x/y anchor. Esla calls `drawBattleEsla()`,
which scales the canonical `drawEslaFigureBody()` geometry and palette by 1.5;
no separate image or invented costume authority exists. The third slot is
structurally reserved but no third Lab member or canonical party is added.

The lower panel reuses the ordinary battle frame, colours, monospace typography,
segmented green HP meters and four command-box positions. It reserves three
compact member rows. Attack, Item, Observe and Run are controller-selectable;
the selected command uses the established highlight. Item selection uses three
visible rows, available quantities, scrolling and unusable dimming. Context and
playback events use the ordinary message area. Runtime IDs, submitted-record dumps,
diagnostic phases, control tutorials and large choosing labels are never drawn;
a small pale battlefield arrow identifies the choosing ally.

During playback, event text comes only from `playbackFrame.currentEvent` and all
displayed HP, inventory, equipment, status, effect and observation state comes
from the historical projection. Attack, Item, equipment, Observe, Run, Curse,
Slither, delayed effects, skips, cancellations and round boundaries are formatted
without recomputing combat. The playback-complete phase displays an explicit
pending-acknowledgement final frame; acknowledged victory/defeat keeps the same
final frame and HP visible.

The renderer calls no controller, scheduler, playback projector, RNG, identity,
save or gameplay authority. It does not increment `tick`. `render.js` routes to
it before world or combat drawing only while `partyCombatLab.isActive()`; it stays
inert otherwise. The renderer validates the controller-owned selected runtime ID
and draws exactly one cursor over that living ally or enemy slot only during
targeting. Suite 167 uses recorded canvas calls and exact state snapshots to
enforce this read-only boundary. Suite 169 additionally fixes the authentic
sprite/frame contract, three-slot geometry and source hashes for the unchanged
singleton, Formation and Receiver render authorities. Suite 197 locks the shared
one-enemy geometry, native sprite dispatch, right-side cursor, historical state,
one-to-three ally fit, unchanged two/three-enemy recordings and byte-identical
Chapter One draw calls.

The existing backtick debug menu has one `DEV: Party Combat Lab` row and a
five-scenario submenu. `input.js` routes that submenu and active Lab before every
world/combat handler while retaining the shared pressed-key latch and native
repeat guard. Left/Right or A/D moves commands and exact targets; Up/Down or W/S
moves the item list. Enter/Space confirms, while Escape/B cancels to the correct
parent, backtracks, or exits only from the first untouched ally/terminal phase.
Ready and ready-Run require separate confirmation; playback requires one
confirmation per frame and another for the retained final frame. Terminal
victory/defeat/escape exits only with Escape/B. No arbitrary IDs originate in input.
Normal exit and emergency abort return to the Party Lab submenu, restore only by
discarding temporary authorities, and never invoke reward or recovery code.
Suite 174 covers the five scenarios, four-command navigation, item reservations
and targeting categories, normal/failed/blocked Run, historical rendering,
terminal cleanup and exact canonical-state isolation. Ordinary singleton,
Formation, Receiver and Attack-only compatibility paths remain separate.

### Combat compatibility baseline reconciliation

The historical 52-trace digest covers suites **139, 140 and 141**, using
`sha256(JSON.stringify(traces.map(t => t.checkpoints)))`. Replaying Git objects
at `5637b5778076562df61d7baeb872e99eac19eaf3` reproduces 52 traces / 388
checkpoints / 482 RNG values and digest
`152d74c67c151513dde7aeff1aef7d8bceed56d6f708a31c161f237fffb18560`.
At terrain parent `afd591f247f624f55b9486105d3b639bf1f8093f` and with the
player-party foundation, the identical scope/projection produces 52 traces /
387 checkpoints / 482 RNG values and digest
`2034f8f2639c78e6d8b69d4d25a47f7d9e8ec53548f4227376faa30a8b288a66`.

All differences predate the party foundation, in commit
`32277bf8220d0c1ad21795db09712b42bf2d2149`: suite 139's Bullet Time/toad
scenario has one fewer first-Observe text acknowledgement after moving the item
hint to the second inspection; its Polwick scorch scenario reflects the approved
stronger stats. Suite 140's Polwick-gang scenario reflects those stronger
opponents and resulting HP carryover. No scenario was removed, merged or renamed.
The trace helper/projection source and suite 141 are byte-identical to `5637b57`.

The later 50-trace / 319-checkpoint / 263-RNG report captured only suites 139–140
and hashed `traces.map(t => ({checkpoints:t.checkpoints,rng:t.rng}))`, yielding
`22e3a94729c1a13ccfddcdca77c01b3d44feaf63f00659e46e0a5be90f3adb6f`.
That was a narrower reporting scope and different hash serialization, not deleted
coverage. Suite 141 still runs its two traces: primitive arithmetic comparison
(12 checkpoints / 24 RNG values) and the eighteen-round Thornback production
comparison (56 checkpoints / 195 RNG values). Both are in the complete regression
suite. Future comparisons must name the suite set and exact projection; raw
hashes from different scopes are not interchangeable. No expectations or trace
harness were rewritten to reconcile this difference.

### Canonical Gallery formation ownership

`gallery-receiver.js` loads after combat/rendering/the Formation Lab and before
bootstrap. It is the sole canonical formation owner: the existing initializer
still constructs inactive state, and `combat.active` permits a formation only
while that owner holds the exact installed membership. Lab/headless formations
remain inactive. `combat.enemy` remains invalid for every formation.

Successful `tryEdgeTransition()` arrivals notify the encounter after placement;
only a real arrival in R0C4 sets the save-bound seen flag. The actual Gallery
ascent and player Warp Stone route enforce the armed exit. Arming also requires
the existing save-bound `gallery_body_found` authority. Dreyfuss's R1C4 feature
is reachable before the player returns to the entrance stair; before that feature
sets the flag, approaching the stair cannot warn, stage members, allocate formation
identities, consume RNG, lock control, or begin combat. No map trigger or
new grid is involved. Encounter-owned warning/staging/aftermath gates freeze
world input and simulation; active battle uses the existing combat freeze and
formation adapter/renderer. Temporary actors are detached read-only display data.

The sole MQ4 report callback in `calwick-interactions.js` requires both
`gallery_body_found` and `gallery_receiver_defeated` before it can show the report,
grant a reward, set `reservoir_report_filed`, or advance `MainQuest` to 4. The MQ5
assignment separately rechecks body discovery, the filed report, and the canonical
post-cutaway flag before recruiting Esla and advancing `MainQuest` to 5 through
`completeMq5Assignment()` above.

The formation session owns every combat phase and target. Its terminal result
is finalized once by the encounter owner: victory records the completion flag
and shows aftermath, defeat calls the shared ordinary recovery procedure.
Neither grants per-member rewards. `prepareFormationEntry()` requires a real
completion receipt for singleton victory, ordinary escape, or completed ordinary
defeat recovery; pending dialogue/queues/callbacks still reject. Unexpected
post-resolution Receiver failures lock a diagnostic screen for page-reload
recovery, never using the Lab's HP refund. Only the two quest flags persist;
save/load cannot run while the canonical encounter is locked.

`resolveFormationRound()` is the one Attack/Item/Observe/Run authority;
`resolveFormationBasicAttackRound()` delegates as a compatibility entry point.
The private round state owns completion counts, pending playback, duration
application rounds and the encounter escape policy. The session alone owns the
four-command cursor, item cursor, target selection and playback cursor. Input
delegates to it and rendering consumes its immutable views, including historical
HP and statuses. A completed reel must be acknowledged before another round.
Registry-template `isBoss` metadata captures a lifetime formation escape lock;
otherwise an enabled Run uses one roll against the fastest living member.
Singleton escape rules are deliberately unchanged. Lab recovery additionally
restores its pre-entry inventory, equipment, statuses and temporary speed;
canonical recovery never uses that debug snapshot.

The exact Receiver/Caller/Keeper trio binds a transient coordination record to
its three runtime IDs inside `formationRounds`. Caller signalling replaces its
ordinary action; Receiver's next-round heavy strike replaces its own action.
Keeper protection uses retained living-member state at damage execution. Neither
mechanic changes singleton formulas. Signal/protection history travels with the
immutable command snapshots and playback frames; the renderer never consults
final live coordination while showing an earlier frame. Cleanup discards the
record. This is one authored relationship, not a general special-action system.

Load order:

```
tiles.js → maps.js → data.js → npcs.js → items.js → shops.js → quests.js →
validation.js → state.js → image-assets.js → save.js → world-transitions.js → game-loop.js →
render-tiles.js → render-interiors.js → render-entities.js → render-ui.js →
render.js → input.js → movement.js → combat.js → render-battle.js →
formation-lab.js → gallery-receiver.js → bootstrap.js → interactions.js
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
| `image-assets.js` | Stable optional raster-asset metadata, lazy one-image-per-id caching, bundle preload/settlement, and loaded-image lookup. Metadata declaration performs no load; failed assets settle for fail-soft rendering. | No drawing, scene progression, persistent state, or render-loop image construction. |
| `save.js` | `QUEST_FLAG_BINDINGS` (the flag registry) + derived `QUEST_FLAG_SCHEMA`, `SAVE_VERSION` (**5**), `migrateSave()` (v5 accepts ONLY the current version — no migration/fallback; old migration execution is removed), `saveGame()`, `loadGame()`, `resolveLoadLocation()` (the v4 discriminated-location preflight), `validateSaveSchema()`. | Don't declare new *persistent* variables here — declare them in the file that owns that concern, then add **one `QUEST_FLAG_BINDINGS` entry** here. `saveGame()` refuses to write when `regionalInvariantErrors()` is non-empty; `loadGame()` commits position via `placeAtLocation()` (regional-position.js), never by assigning `activeMap`/`player.x`/`player.y`. See "Save/flags" and "Canonical regional world position" below. |
| `world-transitions.js` | Every `enter*`/`exit*`/`ascend*`/`descend*` function that moves the player between maps/dungeons/towns/buildings, plus the generic `EDGE_TRANSITIONS` table and `tryEdgeTransition()`, and the debug-only `debugWarpToMap()`/`debugFindNearestWalkableTile()`/`debugEdgeTransitionSummary()`/`debugNearbyTransitionInfo()` helpers. | No drawing code — even location-specific hint overlays (e.g. the sluice gate hint) live in `render-entities.js`. |
| `game-loop.js` | The 60fps-capped `loop()` and its `requestAnimationFrame` kickoff. Intentionally tiny. | No game logic — normal frames call `update()` then `render()`; the transient first-fault boundary stops gameplay and presents a reload diagnostic on failure. |
| `render-tiles.js` | Per-cell base tile drawing (grass/water/dungeon/town/sluice tiles), the `drawTile(id, x, y)` dispatcher called once per grid cell every frame, the `drawMapTiles(map, originPxX?, originPxY?, range?)` loop that dispatches a whole (or sliced) rectangular map through `drawTile()` in row-major order, and the debug/validation-only `RENDERABLE_TILE_IDS` Set (mirrors the dispatcher's `case` labels). | Not furniture (`render-interiors.js`) and not sprites/items/NPCs (`render-entities.js`). Don't rewrite `drawTile()`'s dispatch shape without also updating `RENDERABLE_TILE_IDS` — they're two independent lists that happen to describe the same set today, checked for agreement only by hand, not by any automated cross-check between the two files. |
| `world-view.js` | **PURE** camera / chunk-visibility calculations for the continuous overworld: `regionPixelBounds()`, `cameraOriginForTarget()`, `visibleChunks()`, `chunkVisibleTileRange()`, and `buildContinuousWorldPlanFromWorld()` — the ONE plan entry, keyed on a region-world PIXEL point. Derives everything from `REGIONAL_LAYOUT` + `mapIdForChunk` (data.js) and `COLS`/`ROWS`/`TILE`. | No DOM/canvas, no state mutation, no duplicated layout data. The runtime camera feeds it the CANONICAL regional world position; there is no map-id+local plan overload (removed) and no player-local→world adapter here. |
| `regional-position.js` | **THE canonical regional-position authority**: the private canonical state `{ regionId, worldPxX, worldPxY }`; conversions `mapLocalPxToRegionWorldPx()` / `regionWorldPxToLocal()`; the derived read-model `regionalContext()` + accessors `regionalWorldPosition()` / `regionalDerivedLocation()` / `regionalActiveMapId()` / `regionalPlayerWorldPoint()`; atomic writers `commitRegionalWorldPosition()` (derives `activeMap`/`player.x`/`player.y`), `enterRegionalMapFromLocal()`, `clearRegionalPosition()`, `placeAtLocation()` (the regional/discrete router used by every location gateway); and read-only `regionalInvariantErrors()` / `regionalInvariantsHold()`. | Canonical state is not externally mutable and is `null` on every discrete location. Callers NEVER assign `activeMap`/`player.x`/`player.y` for a regional map — they go through this module. It never repairs state; the read model fails closed (returns null) on a broken invariant and `regionalInvariantErrors()` only reports. |
| `debug-warp.js` | **DEBUG-ONLY** logical warp destination catalog + resolver: `DEBUG_WARP_DESTINATIONS_AUTHORED`, derived outdoor destinations, `getDebugWarpDestinations()` (outdoor-first, deterministic), `debugDestinationById()`, and `debugWarpToDestination()`. Pairs each destination with the exact location-state its canonical `enter*()` wrapper sets; commits only through `transitionToLocation()`. | Reads production data (`MAP_CATALOG`, location bindings) but production never depends on it. Don't assign location flags directly here; don't run the `enter*()` wrappers' story/NPC side effects. |
| `continuous-seams.js` | **PRODUCTION** generalized seamless movement across eligible reciprocal ALIGNS seams (see "Continuous seams" below): the fail-closed structural classifier (`classifyContinuousSegment`/`continuousSegmentDiagnostics`), the derived eligible-seam index (`eligibleContinuousSeam`/`continuousSeamMapEligible`/`continuousSeamEntries`), exact-footprint engagement (`continuousSeamEngaged`), world-aware collision (`continuousFootprintWalkable`), per-axis movement + atomic handoff (`continuousSeamMove`), legacy-inset suppression (`continuousSeamSuppressLegacyEdge`), and the inspector diagnostic. | Active under continuous presentation (the production default), one shared choke point; derives its authority from `REGIONAL_LAYOUT`+`EDGE_TRANSITIONS` (never a hand-list, never `test/`). Uses `footprintCorners()` (movement.js) so the collision footprint isn't duplicated. |
| `continuous-content.js` | **PRODUCTION**, outdoor-content rendering under Continuous View (see "Neighbouring outdoor content" below): content-key AMBIGUITY derivation (`outdoorContentKeyEntries`/`outdoorContentKeyInfo`, grouped PURELY from `OUTDOOR_CONTENT_KEYS`), the shared active/neighbour `OUTDOOR_MAP_DECOR` decoration registry, the render context (`outdoorChunkContentContext`), `drawActiveOutdoorDecoration()`, and `drawNeighbourOutdoorContent()`. | Read-only: **never** assigns/spoofs `activeMap`/player/location/NPC/item state (no probe). The physical→logical key authority itself is `OUTDOOR_CONTENT_KEYS`/`outdoorContentKeyForMapId` in **data.js**. Covers only the 107 placed outdoor maps (60 accessible + 47 scenery-only chunks). Uses parameterized `drawMapWorldItems`/`drawContentNPCs` + landmark bodies (render-entities.js). |
| `world-point-content.js` | **PRODUCTION** world-aware STATIC content across seams (see "World-aware static content across seams" below): the PURE world-point resolver (`worldPointContentContext`), cross-seam authorization compose (`crossSeamNeighbourFor`, over `continuousSeamCrossingAt` in continuous-seams.js), the EXPLICIT capability authorities (`CROSS_SEAM_NPC_CAPABILITIES`/`crossSeamNpcCapabilityRecognized`, `crossSeamCollectibleItem`), the once-per-frame cross-seam item-pickup driver (`crossSeamStaticPickup`, calling `collectWorldItemNear` in movement.js), the opted-in neighbour-NPC interaction resolver/dispatch (`resolveCrossSeamInteractTarget`/`tryCrossSeamNeighbourInteract`), and the single prompt authority (`crossSeamInteractPromptTarget`) that drives both the press and `drawCrossSeamInteractPrompt` (render-entities.js). | Active under continuous presentation (the production default; only the `forceLegacyRegionalView` debug fallback disables it). **Assigns nothing** — no `activeMap`/player/coordinate/content-key/NPC-position write; canonical effects only (item `.picked`/grant/dialogue, NPC dialogue + authored `flag_sets`). FAIL-CLOSED: one directly-adjacent eligible-seam neighbour; unambiguous key for NPC ownership; NPCs must OPT IN via `crossSeamInteraction:'simple_dialogue'` and pickups via `crossSeamPickup:'registry_grant'` (both explicit allowlist capabilities, validated in validation.js); nothing crosses by default. |
| `regional-npc-runtime.js` | **PRODUCTION** chunk-aware regional NPC ownership + pose + simulation (see "Chunk-aware regional NPC runtime" below): `physicalMapIdForNpc` (logical key → physical outdoor map, fail-closed), `regionalNpcPose` (read-only live pixel pose), `nearbySimulationMapSet` (deterministic 3×3), `npcShouldSimulate` (lifecycle gate), `regionalNpcRouteCanOccupy` (world-aware, owner-chunk-confined occupancy). | Active under continuous presentation (the production default; only the `forceLegacyRegionalView` debug fallback disables it). **Assigns nothing** — no `activeMap`/player/location/NPC-ownership write. `npc.map` stays the logical key; physical ownership is distinct + explicit (`npc.physicalMapId` for ambiguous `'overworld'`). NPCs confined to one owner chunk (no cross-chunk routes yet). |
| `encounter-geography.js` | **PURE** geographic random-encounter authority (see "Geographic random-encounter authority" below): `geographicEncounterContext(regionId, worldPxX, worldPxY)` (physical chunk → `MAP_CATALOG` pool, fail-closed) + the read-only runtime selectors `playerStandingWorldPoint` / `regionalStandingEncounterContext` / `encounterGeographyOk`. | No randomness, no state mutation; composes `REGIONAL_LAYOUT`+`mapIdForChunk`+`MAP_CATALOG` (no new table). Physical map id is the pool authority — never a logical/`'overworld'` key. Independent of Continuous View. Consumed by `currentEncounterPool()` (combat.js) and the roll gate (movement.js). |
| `render-interiors.js` | Interior furniture drawing per building (tavern, house, hamlet, brewery, harbormaster, wash house, provision store, offices, schools) and the anchor position consts those functions use. | Those anchor consts are also read by `canWalk()` in `movement.js` for collision — moving/renaming one affects collision, not just drawing. |
| `render-entities.js` | Player sprite, all NPC sprites, world-view boss/special-enemy sprites, items/chests/world-items, merchant/traveller/shop drawing, and small world-feature hint overlays (sluice gate, Drenwick north gate, Thornmere stone). | Not base tiles or furniture (see above). |
| `render-ui.js` | Drawing only for overlay panels: continent map, parchment document reader (the Accord's established panel, with an optional authored visual theme), choice box, dialogue box, main/pause menu, debug menu, debug warp menu, and the debug map inspector overlay. | Panel *state* (`dialogue`, `menu`, `choice`, `debugMenu`, `warpMenu`, `debugInspector`, etc) lives in `state.js`/`combat.js`; panel *input handling* lives in `input.js`. This file only reads state and draws. |
| `render.js` | The single `render()` orchestrator — the canonical draw-call order (layering) for a frame — plus the pre-computed vignette, the extracted `drawActiveMapContent()` current-map content block, and the production continuous-view path (`continuousWorldViewActive()` / `drawContinuousWorld()`; see "Continuous regional overworld" below). | Don't put actual drawing logic here beyond the terrain/camera orchestration — call into the `render-*.js` files. If draw order/layering looks wrong, this is the file to fix. |
| `input.js` | The `keys` table and the `keydown`/`keyup` listeners; routes a keypress to whichever screen is active (combat, menu, choice, shop, debug menu, debug warp menu, overlay panels, overworld). | No game logic beyond routing — it calls into `movement.js`/`combat.js`/`interactions.js`/etc rather than mutating game state directly (aside from cursor/screen UI state). |
| `movement.js` | `player`, `locationName()`, `currentContentLocationKey()` (logical content-location key; `currentMapId()` is a deprecated alias), `tileAt()`, `canWalk()` (collision), `isEncounterEligibleTile()`, and `update()` — the per-frame advance of movement/cooldowns/encounter checks/`MAP_FEATURES` trigger-zone checks. | No drawing code. |
| `enemy-catalog.js` | Authored scripted enemy templates, `ENEMY_TEMPLATE_POOLS`, `ENEMY_TEMPLATE_REGISTRY`, and stable template registration. | Loaded after data and before combat. No battle installation, selection RNG or runtime identities. |
| `combat.js` | Equip helpers (`effectiveAtk`/etc), `choice`/`shop` state, the `combat` state object, all `start*Combat()` functions, turn resolution (`combatOptions`, `applyEnemyHitEffects`, `handleCombatAction`), and `currentEncounterPool()`. | Battle *rendering* (sprites, the combat screen UI) lives in `render-battle.js`, not here. |
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
interiors, dungeons, bridge, special) are authored directly here; the **107 regional
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
world point (retained by current `SAVE_VERSION` **5**). Keep the five terms distinct:

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
`displayName`. It holds one region, `'overworld'`, containing 60 accessible
wilderness maps plus 47 scenery-only chunks (107 placed total). Established
coordinates were derived from the game's own transitions (the broad
`EDGE_TRANSITIONS` crossings plus the single-tile world crossings in
`movement.js`); the Eastern Fens extension deliberately authors a winding chain
from `(6,2)` through a road turn at `(15,4)` to the Valmere threshold at `(18,0)`.
Each chunk is exactly `COLS×ROWS` (16×15),
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
| `THORNMERE_REGIONAL_CHUNK_DEFINITIONS` | `content/maps/thornmere-wilds-maps.js` | `MAP2`,`MAP3`,`MAP4`,`THORNMERE_NORTH_FEN_MAP`,`THORNMERE_CANAL_HEAD_MAP`,`THORNMERE_UPPER_SHALLOWS_MAP`,`MAP5`,`RODDON_WAY_MAP`,`MAP3_N1` |
| `DRENWICK_REGIONAL_CHUNK_DEFINITIONS` | `content/maps/drenwick-maps.js` | `MAP3_N2`,`DRENWICK_EAST_CANAL_MAP`,`DRENWICK_WEST_OUTFALL_MAP` |
| `NORTHERN_ROAD_REGIONAL_CHUNK_DEFINITIONS` | `maps.js` | `MAP_N1`,`MAP_N2` |
| `NORTH_BASIN_REGIONAL_CHUNK_DEFINITIONS` | `content/maps/north-basin-maps.js` | 16 chunks: 14 `NORTH_BASIN_*_MAP` (incl. five scenery-only water/woods chunks), `EAST_CAUSEWAY_MAP`, and `EASTERN_BANK_MAP` |
| `EASTERN_FENS_REGIONAL_CHUNK_DEFINITIONS` | `content/maps/eastern-fens-maps.js` | 23 accessible terrain-only chunks from old embankment to the unfinished southern-Valmere threshold |

A fragment is placed where its grids are defined (a `map:` reference must resolve at
fragment-eval time). Collectively the fragments author **exactly one definition per
placed regional map** (107 total — 60 accessible wilderness chunks + 47 scenery-only chunks). An authored definition OWNS:

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
  playerAccessible?,                 // OPTIONAL capability, default true; false = scenery-only (see "Scenery-only chunks")
  legacyCameraExclusion?,            // { mapId, side } continuous-camera policy — see "Continuous-side camera exclusion"
  notes?,
}
```

**Scenery-only (inaccessible) chunks — `playerAccessible: false`.** A placed regional
chunk may opt out of ever hosting the player. The optional `playerAccessible` capability
(default `true`, resolved onto every `REGIONAL_CHUNK_CATALOG` record) is the sole
declarative authority, read through the single predicate **`mapPlayerAccessible(mapId)`**
(data.js — false ONLY for a chunk that authored `playerAccessible: false`; every other
regional chunk and every discrete map is accessible). This cleanly separates **rendering
from player placement**:

- *Rendering still works.* `visibleChunks()`/`tileAtWorld()`/`worldToLocal()`/
  `mapRefForId()`/`mapEntryForId()` and the neighbour-content path all read a scenery-only
  chunk normally, so Continuous View draws its terrain (and any `OUTDOOR_MAP_DECOR`
  decoration) as a neighbour, once per frame at its stable world origin. It is never the
  *active* map (no legal seam/border lets the player in), so it only ever renders via the
  neighbour path.
- *Player placement fails closed everywhere*, through ONE shared authority — no
  scenery-only map id is hardcoded in movement, save, warp, or regional-position code:
  `mapPlayerAccessible()` is consulted by **`validatePlacement()`** (world-transitions.js —
  so `transitionToLocation()`, `resolveLoadLocation()` save-restore, and the debug-warp
  preflight all reject atomically) and by the canonical writer
  **`commitRegionalWorldPosition()`** (regional-position.js — so seam movement / direct
  canonical placement / a hand-edited v4 save reject too, even though the point resolves to
  a real drawable chunk). Debug warp additionally LISTS the destination but marks it
  `disabled` (reason `Scenery-only; no player access`), and `nearbySimulationMapSet()`
  excludes it (no NPC simulation there), both via the same predicate. A rejected operation
  mutates nothing (active location, player position/facing, inventory, flags, stored save).
- The chunk still needs a valid `encounterProfileId` (the catalog requires a resolved pool
  array) and a unique `contentKey`, but `allowRandomEncounters: false` plus the
  inaccessibility keep it from ever becoming an encounter/content location. Today there are
  seven scenery-only chunks: **`DRENWICK_WEST_OUTFALL_MAP`** (the West Outfall, chunk (1,3) — a
  drought-exposed canal settling ground whose surface water enters a boat-scale canal tunnel through
  a contiguous wooded `HILLS` ridge) and five North Basin water/woods chunks — **`NORTH_BASIN_N_MAP`** (2,0),
  **`NORTH_BASIN_NE_MAP`** (3,0), and **`NORTH_BASIN_NE2_MAP`** (4,0), deep open reservoir water north/east of the receding basin,
  **`NORTH_BASIN_E_MAP`** (3,1), water over forest (top-half WATER, bottom-half TREE), and
  **`NORTH_BASIN_E2_MAP`** (4,1), matched water/shore scenery east of it; and
  **`THORNMERE_UPPER_SHALLOWS_MAP`** (4,4), 90% WATER scenery between Northern
  Thornmere Fen and Thornmere Shallows. Its agreed southwest REEDS corner is the
  only edge-sequence exception; the shared accessibility authority still blocks
  both placed adjacencies.
  Each is kept inaccessible by matching its edges to its non-walkable placed neighbours;
  outward-facing sides remain ordinary blocked regional borders.

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
pool/items arrays) AND the authored definitions (all placed chunks present exactly once, no
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

**All 107 grids are authored inline.** Every placed regional grid now lives **inside its
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

**Regional chunks vs discrete maps.** Only the 107 placed regional chunks (60 accessible wilderness chunks + 47 scenery-only chunks) are
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
  localY }` or `null` (unknown regionId, out of range, or an unplaced gap
  chunk inside the bounding box).
- `tileAtWorld(regionId, worldX, worldY)` → the tile id, or **`REGION_VOID_TILE`**
  (`-1`, a documented void that is never a real tile id) for any missing chunk /
  out-of-range coordinate. Negative coordinates resolve when a chunk is placed there.

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
  currently 0–120 with four retired-but-still-present ids (84–87, formerly
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
- `encounterEligible` on `TILE_PROPERTIES` describes terrain eligibility; it
  does **not** grant a location permission to roll. In particular,
  `BASIN_MUD` and `EXPOSED_STONE` are ordinary eligible wilderness terrain,
  while `PATH` remains deliberately safe. The runtime conjunction also requires
  `currentLocationAllowsRandomEncounters()` (canonical map metadata plus regional
  player-access capability), `isEncounterEligibleTile()`, and valid encounter
  geography. Thus a town, safe interior, scenery-only chunk, or any map with
  `allowRandomEncounters: false` consumes no encounter-chance randomness even if
  it synthetically contains mud or exposed stone. `isEncounterEligibleTile()`
  remains the per-context tile decision function; its plain outdoor branch calls
  `isTileEncounterEligible(tile)`. Every dungeon-floor-number branch is
  still a hand-written `tile === DUNGEON_FLOOR`-style check, because the
  *same* tile id means different things depending on `dungeonFloor` (mutable
  state), which a single per-tile boolean can't capture. See that
  function's own comment before "simplifying" any of those branches.
- `TREE_IN_WATER` (stable id 120) is a nonwalkable, non-transitioning natural
  blocker with water/tree/blocker tags and `isWater: true`. Its normal procedural
  dispatcher first uses the existing animated water base, then draws a simple
  drowned trunk/canopy and waterline; it has no map-id branch or runtime randomness.

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
the continuous regional overworld section below.

### Continuous regional overworld (PRODUCTION DEFAULT, `render.js`)

The scrolling-camera regional overworld — continuous terrain from neighbouring chunks
plus seamless eligible-edge movement — is the **normal production presentation** for
placed `'continuous'` regional chunks. It needs **no debug mode and no opt-in flag**:
`continuousWorldViewActive()` returns true whenever the canonical invariants hold, the
active canonical location is a placed regional chunk, and its authored presentation is
`'continuous'`. Presentation is thus selected by **canonical location + chunk metadata**,
not a session toggle.

The **only** opt-out is a session-only debug fallback, **`forceLegacyRegionalView`**
(state.js; default OFF; debug-menu row `[ Legacy Regional Fallback ]`, `input.js`). ON,
it forces coherent legacy single-screen regional behaviour for comparison/recovery;
it is never saved/restored and changes canonical position / encounter ownership /
grids / content in no way. On a `legacy_screen` map, a discrete/nonregional context
(towns, interiors, dungeons, bridge, special maps, the hidden meadow), or a broken
canonical invariant, `render()` uses the **legacy path** (`drawMapTiles(activeMap)` +
`drawActiveMapContent()`), pixel-identical to before. `continuousWorldViewActive()` is
the ONE shared choke point every continuous consumer reads (render, seam movement,
regional NPC simulation, cross-seam content, inspector), so they follow the default —
and the fallback — together. Combat is unaffected (`render()` returns before the world
section when `combat.active`); geographic encounters and canonical position do **not**
depend on presentation mode.

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

**Verified render-work bound (static evidence).** Per frame the plan draws **≤ 4
visible chunks** and **only the viewport's tiles plus the unavoidable partial edge
row/column** — a hard bound of `(ceil(512/32)+1) × (ceil(480/32)+1) = 17 × 16 = 272`
`drawTile` calls, **not** `visibleChunks × 240`. Measured from `buildContinuousWorldPlanFromWorld`
at representative positions: chunk middle 2 chunks / 256 tiles; two-chunk seam 3 / 249;
four-chunk corner 2 / 240 — no world tile coordinate is drawn twice in a pass, and
neighbour content is drawn once per visible non-active chunk. Visible-chunk lookup is
the O(1) `_CHUNK_TO_MAP_ID` index (never a full-region scan); camera/catalog/visibility
resolution mutates no gameplay state and rebuilds no authority (catalog, seam
classifier, encounter registry, content ownership) per frame. This bound is enforced by
test 88. **Pending browser profiling** (not yet measured): real frame-time at a chunk
middle, a two-chunk seam, the MAP/MAP2/Roddon legacy-home corner, a four-chunk corner,
animated water, and a neighbouring-content view — see the manual checklist. No terrain
cache or offscreen canvas is used; none is warranted by the static evidence.

### Regional presentation modes: the Verdant Vale fixed-screen home

A placed regional outdoor map presents either in the scrolling **continuous** world
or as a fixed **`legacy_screen`** (single, non-scrolling map) *even though continuous is
the production default*. The MAP_CATALOG entry's optional
`regionalPresentation` is the SOLE authority (default `'continuous'` for a placed
regional outdoor map); `regionalPresentationForMapId()`/`isLegacyScreenMap()` (data.js)
resolve it. There is no second authored list of legacy maps and no scattered
`mapId === 'MAP'` presentation checks. Only **`MAP` (Verdant Vale)** is
`legacy_screen` today — the intentional small, self-contained *home*: leaving it east
(→ MAP2) or north (→ MAP_N1) reveals the larger scrolling world; returning restores
the fixed original-map presentation.

- **Metadata selects the mode.** `continuousWorldViewActive()` is the single choke point
  for the EFFECTIVE mode; it returns `false` on a `legacy_screen` active map regardless
  of anything else — so on MAP the legacy render path, legacy movement (no seamless
  handling), and NO regional NPC simulation / cross-boundary pickup/interaction/prompt
  all follow from that one predicate. The debug inspector shows `PRESENTATION: fixed
  legacy_screen home (MAP)`. Leaving home enters the continuous mode automatically on the
  first destination frame; there is no toggle to set. (The one manual control is the
  session-only `forceLegacyRegionalView` debug fallback, which forces legacy everywhere
  for comparison — see "Continuous regional overworld" above. The inspector distinguishes
  five states: production continuous / legacy_screen home / debug fallback / discrete-
  nonregional / canonical-invariant failure.)
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
  untouched. Current totals: ALIGNS 96 / NEEDS_REMAP 0 / INTENTIONAL_DISCRETE 4
  / BLOCKED 50 / BORDER 66. `validateRegionalPresentation()` checks recognized values on
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

### Continuous seams: generalized seamless movement (`continuous-seams.js`)

Lets the player *walk* across EVERY currently-safe reciprocal ALIGNS outdoor seam
— as though the adjacent 16×15 maps were one — whenever continuous presentation is
active (the production default; suppressed only by the `forceLegacyRegionalView`
debug fallback or on a `legacy_screen`/discrete map). Today the eligible authority
contains **144 directed segment entries / 72 reciprocal segment pairs** across 124
physical `ALIGNS` edges; segment entries and physical audit edges are deliberately
different units. The set is derived, not hand-listed.

- **Canonical model (Part 1).** The canonical runtime position of a placed map is now
  the region-world pixel point in `regional-position.js`; `activeMap` and `player.x/.y`
  are DERIVED projections, and v4 saves store the regional world point (see "Canonical
  regional world position" below). `continuousSeamMove()` still resolves cross-seam
  collision/handoff in world pixels, but now commits the result through the canonical
  authority (one `commitRegionalWorldPosition`) rather than assigning map/local directly.
- **Derived eligible-seam authority (no hand-maintained list), FAIL-CLOSED.** A
  directed edge `mapId|dir` is eligible iff, from `REGIONAL_LAYOUT` +
  `EDGE_TRANSITIONS` + placement: from/to are both placed in the same `regionId`,
  physically adjacent in `dir`, every segment passes the pure structural classifier,
  every `targetEdge` is the inverse of `dir`, ranges are ordered integers and form a
  deterministic sorted, duplicate-free, non-overlapping set, every source and
  reciprocal landing cell is base-walkable, and the reciprocal directed edge exists
  with the exact same complete range set. The O(1) `mapId|dir` index stores one small
  sorted list; the player’s orthogonal edge coordinate selects a single segment.
  A gap selects nothing and retains ordinary collision. If any member of an edge set
  is malformed, overlapping, behavior-bearing, nonreciprocal, or nonwalkable, the
  **whole edge** is omitted—no convenient subset is partially authorized.
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
  reciprocal inverse, identical complete range sets, no duplicates/overlaps, base-walkable source +
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
  via the shared active/neighbour `OUTDOOR_MAP_DECOR.MAP4` authority (single instance, no `activeMap`
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
- **First split-range seamless edge: Eastern Canal Banks.** The accessible
  `DRENWICK_EAST_CANAL_MAP` at `(3,3)` is divided into two disconnected fen banks
  by uninterrupted WATER across row 5. Its north edge joins
  `NORTH_BASIN_SE_MAP.south` broadly at `[1,14]`. Its west edge joins
  `MAP3_N2.east` through two separately indexed reciprocal structural ranges:
  north bank `[1,4]` and south bank `[6,13]`. Row 5 is absent from both sets, so
  it never suppresses collision or authorizes a crossing. Both banks use the
  existing `far` profile / exact `FAR_ENEMY_TEMPLATES` reference, and every
  walkable tile is GRASS or REEDS (encounter-eligible); no PATH or crossing tile
  exists. The only way to switch banks remains MAP3_N2's existing bridge.
- **Northern Thornmere Fen loop and Upper Shallows boundary.** The accessible
  `THORNMERE_NORTH_FEN_MAP` at `(3,4)` joins Eastern Canal Banks' south bank
  broadly at `[1,14]`, Northern Fen's east edge at `[1,13]`, and Thornmere's
  two north-shore approaches through split ranges `[1,2]` and `[13,14]`.
  Its one connected GRASS/REEDS landmass uses the existing `thornmere` profile;
  an irregular broad WATER inlet fills the east side, ending at a wholly
  nonwalkable WATER/TREE boundary toward the scenery-only Upper Shallows.
  The two separated southern ranges are independently indexed by the generalized
  multi-segment seam authority. No PATH, content, alias, point transition, or
  movement special case is involved.
- **Upper Shallows scenery.** `THORNMERE_UPPER_SHALLOWS_MAP` at `(4,4)` fills the
  former void east of Northern Thornmere Fen and north of MAP5. Its 216 WATER,
  18 REEDS, and 6 TREE cells form one large water body with three sparse shoreline/
  shoal remnants. It has no transition or content and is declaratively inaccessible.
  The user-selected REEDS southwest corner is the sole mismatch against the west
  neighbour's TREE and MAP5's WATER; both placed edges remain `BLOCKED`.
- **Thornmere Canal Head.** `THORNMERE_CANAL_HEAD_MAP` at `(4,3)` fills the former
  void east of Eastern Canal Banks and north of Upper Shallows. The lake occupies
  212 of 240 cells; its straight WATER row 5 carries the canal east without a bend.
  Two disconnected 10-cell REEDS shelves stay in columns 0–3 and join the corrected
  Drenwick shoreline through reciprocal ranges `[2,4]` and `[6,8]`. Crossing changes
  geographic ownership from `FAR_ENEMY_TEMPLATES` to the exact
  `THORNMERE_ENEMY_TEMPLATES` reference. North/east are borders; south remains a
  blocked adjacency to inaccessible Upper Shallows. No content or special runtime
  handling exists.
- **East Causeway.** `EAST_CAUSEWAY_MAP` at `(4,2)` continues the South Reservoir
  Road through a reciprocal `[6,10]` fen opening while keeping the row-8 PATH one
  tile wide. Mud and broken exposed stone precede a complete WATER interruption at
  columns 11–15. Ordinary movement remains blocked across the full adjacency. Once
  `MainQuest >= 5`, that existing quest authority also authorizes a deterministic
  official cable scow and one active-bank operator; no inventory token or second
  progression flag exists. `crossCausewayFerry()` uses `transitionToLocation()` in
  both directions through the reusable `waterTravelController` and creates no
  conditional `EDGE_TRANSITIONS` segment. A frozen route record owns the paired
  endpoints, cable-scow identity, integer visual path and 105-frame duration;
  a separate closed predicate registry delegates availability to the existing
  story authority without specializing the animation lifecycle to this route.
  The controller validates availability, exact endpoint, destination placement,
  neutral location state and exclusive-owner availability before installing its
  transient session. Directional departure fares belong to the frozen route:
  0g eastbound, 10g westbound. The controller checks available gold before
  departure and again before arrival, deducting exactly once only after successful
  placement. Declines, rejection and faults charge nothing; no fare flag is saved.
  The guard dialogue uses the shared mixed-speaker pages for Esla’s green objection.
  While active it alone advances, so movement, encounters,
  world time, menus, save/load and debug actions remain frozen. The renderer reads
  an immutable progress view and replaces the world with a deterministic water
  tableau; it does not advance `tick`, RNG or gameplay state. Only the terminal
  update calls `transitionToLocation()` once. Predictable rejection mutates
  nothing; pre-arrival faults retain a transient diagnostic and release input on
  the unchanged departure bank. Story Checkpoint replacement explicitly resets
  this transient owner. Parked side is derived from the current endpoint and is
  never saved, so `SAVE_VERSION` and the payload remain unchanged. Before
  MQ5, the renderer, NPC projection, action, and crossing all fail closed; only the
  established top-right `east_causeway_break` inspect remains. That inspect retains
  its location, collision, and text after the ferry appears, with the operator on a
  separate landing interaction.
- **Eastern Bank.** `EASTERN_BANK_MAP` at `(5,2)` is one accessible, encounter-free
  threshold chunk beyond the washed-out span. Its full west edge is WATER; a reused
  bridge-deck landing joins a maintained PATH and a reciprocal three-cell east seam.
  The map is safe/saveable and owns no item, shop, dungeon, encounter, major NPC cast,
  or onward quest content. It has no standalone map variable, compatibility alias,
  or `window.*` map export. The ferry remains its only connection to the established
  western world and its safe return.
- **Eastern Fens route.** Twenty-three accessible, encounter-free chunks extend
  from Eastern Bank through a broad hook of reciprocal structural seams. The old
  road first follows reliable raised ground east, reaches a managed navigable
  channel at `EASTERN_FENS_VALMERE_ROAD_TURN_MAP` `(15,4)`, then follows its
  embankment north to the Valmere before turning east along the southern shore.
  Existing `PATH`,
  `BRIDGE_DECK`, `WATER`, `REEDS`, `GRASS`, `BASIN_MUD`, `EXPOSED_STONE`, and
  `FENCE_POST` carry the raised road, timber walks, drainage, worked reeds, dry
  rise and broader-water approach. Stable tile 127, `DEEP_REEDS`, is the route's
  only new primitive: a deterministic, rendered, visually distinct *walkable* wet
  fen (made walkable by the exploration pass below; `category: 'natural'`), marked
  `encounterEligible: true`; map permission still prevents eastern
  encounters. The
  future camp site is reserved at `EASTERN_FENS_TRAVELLERS_RISE_MAP` `(12,3)`,
  215 of 400 walking steps from the ferry landing (about 53.8%), without content
  or state. `EASTERN_FENS_MORNAY_THRESHOLD_MAP` `(18,0)` ends safely on firm ground
  beside open Valmere water, at an ordinary unconnected east border before the
  unbuilt port. The twenty-three chunks own no NPCs, items, encounters,
  interactions, quest triggers, or save bindings. The original route occupies rows
  0–4. Canonical regional position now accepts placed negative coordinates; the
  northern water and Mornay approach/headland extend the envelope to row −2.
  **Explorability pass (done):** roads should communicate direction, safety,
  and convenience—not define the only terrain the player is permitted to
  traverse. The separate explorability pass has now made `DEEP_REEDS` walkable,
  water-framed every non-seam chunk border, opened the surrounding reed country
  into side routes, loops, and quiet discovery space, kept open water and major
  channels as genuine barriers, and holds the road to within ~10% of the fastest
  cross-country walk (444→400 steps) so it guides rather than imprisons. Still
  deferred to later passes: whether deep reeds or mud affect movement speed,
  visibility, or encounter pressure, and encounter integration. The completed
  envelope adds walkable infill, western pockets, the NW open fen, scenery, and
  the Mornay approach/headland. The native-viewport camera invariant includes
  negative rows and finds no visible void from reachable Eastern Fens tile centres.
- **North Basin — Flooded Rim.** `NORTH_BASIN_NW2_MAP` at `(0,0)` fills the
  northwest void with an accessible flooded woodland using the existing
  `north_basin` profile. WATER occupies 119/240 cells; its one connected
  walkable mass is mostly BASIN_MUD and REEDS with three EXPOSED_STONE remnants.
  Six `TREE_IN_WATER` blockers carry drowned cover through the pools. North and
  west remain outer blocked borders, and east remains blocked against Upper
  Reach. Two reciprocal structural ranges, `[3,6]` and `[9,12]`, join its south
  edge to West Mire's north without aliases, point transitions, content, or a
  map-specific runtime rule. Upper Reach's west edge replaces seven of its
  fourteen former TREE cells with clustered WATER, BASIN_MUD, and TREE_IN_WATER
  remnants, but the adjacency remains seam-free and blocked from the Flooded Rim.
  West Mire's west border remains impassable and
  seam-free while alternating TREE/WATER instead of a solid tree wall.
- **North Basin — Mirewood.** `NORTH_BASIN_MIREWOOD_MAP` at `(0,2)` fills the
  final regional void with an accessible flooded woodland using the existing
  `north_basin` profile. Its 85 walkable cells form one connected component in
  rows 1–9: 48 REEDS, 36 BASIN_MUD, and one EXPOSED_STONE remnant. The remaining
  155 cells are 98 WATER, 37 TREE, and 20 TREE_IN_WATER; all of rows 10–14 are
  blocked. North and west are blocked regional edges, south is blocked against
  Blocked Path, and two reciprocal structural east ranges, `[1,4]` and `[6,9]`,
  join Silt Flats. Only those eight Silt Flats west-edge landing cells changed.
  Mirewood owns no content, alias, point transition, or runtime special case.
- **Closure.** With this conversion the regional audit reaches **zero `NEEDS_REMAP`**:
  all 428 directed overworld edges classify as `ALIGNS` (124), `INTENTIONAL_DISCRETE` (4),
  `BLOCKED` (234), or `BORDER` (66); every `ALIGNS` edge is backed by the fail-closed
  `continuousSeamEntries()` authority (144 directed segment entries because split
  ranges share physical directed edges); and `REGIONAL_POINT_CROSSINGS` is reduced to
  exactly the four Verdant Vale legacy-home directed crossings. The continuous-seam
  graph has three components: the legacy home, the ferry-only Eastern Bank/Eastern
  Fens route, and the joined road/fen/basin cluster. The home point crossings and
  the bidirectional MQ5 ferry reconnect all 60 accessible chunks into one traversable
  graph. The Northern
  branch also rejoins the southern cluster through the Roddon Way seam, while Canal
  Head extends that component without creating a canal-bank bypass.
- **Continuous seam crossings do NOT reset the encounter cooldown.** The seamless
  handoff (`continuousSeamMove`) only swaps `activeMap` + local coordinates; it never
  calls `transitionToLocation`, so `combat.cooldown` is untouched (it just keeps
  ticking). Only the legacy edge/point path applies a fresh cooldown.
- **Seam edge base-walkability validation.** `continuousSeamEdgeWalkability()`
  (validation.js, pure) confirms — for every coordinate of every seam's identical
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

**Save v5 (`SAVE_VERSION = 5`, clean break — no migration).** Location is a
discriminated union: `{ kind:'regional', regionId, worldPxX, worldPxY }` or
`{ kind:'discrete', mapId, localPxX, localPxY }`. A regional save stores the canonical
region/world position only (no `activeMapId`/local as a second authority); a discrete
save stores the physical map id + local pixels. `player` carries facing only. Other
save data and location-state MODE flags (inTown, dungeonFloor, houseSourceMapId, …)
are unchanged. `saveGame()` refuses to write (leaving any existing save intact) if the
canonical invariant is broken; `loadGame()` accepts only version 5 and rejects any
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
  (data.js)** is the single declarative binding of each of the 107 region-placed
  outdoor maps to its logical key; **`currentContentLocationKey()` (movement.js)
  CONSUMES it** for neutral outdoor locations, so there is not a second,
  independently-maintained mapping (and no drift). `outdoorContentKeyForMapId(mapId)`
  → `key | null` is a **pure O(1) lookup** — it never probes/assigns `activeMap` or
  location state. Ambiguity is derived PURELY by grouping the object
  (`outdoorContentKeyEntries()`/`outdoorContentKeyInfo()` in continuous-content.js):
  a key owned by one map is unambiguous (its neighbouring NPCs are attributed to
  that chunk); a shared key is ambiguous (neighbour NPC rendering skipped; items +
  decorations unaffected). It covers ONLY the 107 placed outdoor maps — never
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
  (`drawThornmereStoneBody`, `drawDrenwichNorthGateBody`,
  `drawWestOutfallCanalTunnelBody`) drawn for active or neighbouring chunks through
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
above), rolls the random-encounter chance only when the current physical
location permits random encounters, `isEncounterEligibleTile()` says the
standing tile qualifies, encounter geography is valid, and `!debugMode`, handles world-item
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
3×3 NPC simulation set, camera position, or an assumed single active screen.
The physical chunk supplies the default pool. An eligible terrain definition may
refine it through `TILE_PROPERTIES[tile].encounterProfileId`, resolved against
`_ENCOUNTER_PROFILES`. Rocky Beach (134) is the first such terrain: its two
enemies occur only on its standing tiles. This adds no mutable state or cache.

- **Pure resolver, PIXEL units.** `geographicEncounterContext(regionId, worldPxX,
  worldPxY)` → `{ regionId, mapId, encounterPool } | null`. It composes existing
  authorities only (`REGIONAL_LAYOUT` placement + `mapIdForChunk` + `MAP_CATALOG`
  via `mapEntryForId`) — it adds no encounter table, consumes NO randomness, and
  mutates NO runtime state. One canonical grid-cell lookup selects any terrain
  refinement, only if the map permits encounters and has a non-null pool. An invalid
  profile fails closed. Otherwise the catalog pool is preserved (including `null`). Missing
  chunk / documented void / sparse hole / off-region / non-finite point →
  `null` (**fail closed**). Physical map id is the authority; `OUTDOOR_CONTENT_KEYS`
  / `npc.map` / `'overworld'` are never consulted, so `MAP`, `MAP5`, and
  `RODDON_WAY_MAP` resolve independently despite sharing the `'overworld'` key.
- **Runtime selectors + ONE shared authority.** `playerStandingWorldPoint()` converts
  the canonical regional position to world pixels — the STANDING
  POINT, not footprint corners/camera/visible chunks. `regionalStandingEncounterContext()`
  is the resolver at that point. **Both are independent of Continuous View — the debug
  toggle must not determine encounter geography.** `regionalEncounterResolution()` is
  the single shared authority both the roll gate AND pool selection consult (never two
  competing copies): it returns `{ regional, ok, pool }` — nonregional (legacy);
  placed + resolved + agrees with the active map; or placed + unresolved/void/
  inconsistent. **Fail-closed protection lives in BOTH the eligibility gate and the
  pool selection, not only at the roll gate.** `currentEncounterPool()` (combat.js, the
  stable caller-facing API) keeps its special dungeon/sluice/vault branches exactly;
  for a placed regional map it returns the geographic/terrain pool when `ok`
  (with the legacy `null → ENEMY_TEMPLATES` fallback), and the established empty no-pool
  result **`EMPTY_ENCOUNTER_POOL`** (a frozen empty array) when NOT `ok` — **never the
  stale `activeMap` pool**. Nonregional/unplaced maps keep the unchanged legacy
  `MAP_METADATA` fall-through. `startCombat()` treats an empty pool as "no encounter":
  it returns before selecting an enemy, so combat never activates and no enemy-selection
  randomness is consumed — so even a future *direct* `startCombat()` caller fails closed,
  not just the one roll site.
- **Only the standing-point chunk owns the roll.** The random-encounter roll stays
  at its single `update()` choke point at the same step cadence and `startCombat()`
  path. Before `Math.random()`, `currentLocationAllowsRandomEncounters()` requires
  the current physical map's `allowRandomEncounters: true` and, for regional chunks,
  `playerAccessible: true`; the standing tile must also be encounter-eligible.
  Consequently safe towns/interiors/special maps and scenery-only chunks consume no
  encounter-chance randomness even if an eligible terrain tile is present.
  `encounterGeographyOk()` is another AND-gate: on a
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
- **South Reservoir Road handoff.** `NORTH_BASIN_S_MAP.east ↔
  NORTH_BASIN_SE_MAP.west` is a reciprocal rows 7–8 seam: REEDS widen the physical
  entrance above the single-tile row-8 PATH road. The standing-point
  handoff changes pool ownership from `NORTH_BASIN_ENEMY_TEMPLATES` to the
  `upper_reach` profile's `UPPER_REACH_ENEMY_TEMPLATES` reference. PATH remains
  encounter-ineligible on both sides, while the destination chunk's
  GRASS/REEDS/BASIN_MUD/EXPOSED_STONE terrain is eligible; no new pool, rate,
  cadence, or enemy definition is involved.
- **Validation.** `validateEncounterGeography()` (pure) checks every placed map
  resolves from its own chunk centre back to itself with the canonical geographic/terrain
  pool reference, and that void/sparse/unknown-region/invalid coordinates fail closed.
  Tile profile registration and live terrain pool reachability are validated too.
- **Scope.** Terrain refinements change only pool selection inside placed regional
  wilderness. The location and standing-tile gates, cadence, rare overrides, scripted
  fights, towns and dungeon dispatch are unchanged. No cross-seam pool blending.

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
3. **Examine-only world items** (`tryExamineWorldItem()`) — persisted floor
   sparkles backed by `PICKUP_REGISTRY`. Ordinary records are consumed and grant
   their item on examination. A record with `scriptedInspect: '<encounter-id>'`
   is skipped by the generic grant path (fail closed); its named location
   handler owns the choice/dialogue and its combat finalizer decides when to set
   `.picked`, while `ENCOUNTER_HANDLERS` must contain the matching id.
4. **`MAP_FEATURES` inspectables** (`tryMapFeatures()`) — the lowest-priority
   **generic fallback**, run only when *no handler matched, or the matching
   handler did not consume the press*. "Consumed" is `interactionUiOpened()` —
   dialogue, choice, shop, reading panel (`accordPanel`), or continent map
   open — which is deliberately broader than the old `dialogue.open`-only
   guard, so a scripted interaction that opens a *choice menu* (not dialogue)
   can no longer let `MAP_FEATURES` open a second, competing dialogue
   underneath it. This is the invariant the priority contract exists to
   protect; handler ordering and the consumed/not-consumed return value are
   both load-bearing.
5. If nothing above fired, the press is a no-op.

### Dialogue page formatting contract

A dialogue page is an array of authored strings. `drawDialogue()` (via the pure
helpers `wrapDialogueLine` / `paginateDialoguePages` in `render-ui.js`)
word-wraps **each string independently** to the box width (496px box, 468px
text) and treats the boundary between two strings as a **hard line break**;
the wrapped sub-lines are then repaginated into height-safe visual pages of at
most three lines each.

Pages may alternatively be installed through
`setSpeakerDialoguePages([{speakerId, lines}, ...])` when a mixed-speaker scene
needs explicit presentation identity. `speakerId` must be a registered stable ID
or `null` for narration; unknown IDs, malformed/accessor records and unknown
fields fail before dialogue state changes. Speaker identity determines only the
name plate and named text style. It is transient presentation state and never
enters version-5 saves.

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
      sparkle: true,                   // optional inspect-only floor glint
      label: 'Road sign',             // debug/validation only, never shown to the player
    },
  ],
};
```

- **`inspect`** features are checked from `tryMapFeatures()` (proximity via
  `nearPlayer()`, the same mechanism NPCs use). An inspect may opt into the
  shared floor glint with `sparkle: true`; `drawAuthoredMapFeatureSparkles()`
  reads the same feature coordinate, condition/fallback gate, and radius, so
  the visual marker cannot drift from the interaction. Sunken Gallery inspects
  retain their established all-inspects-sparkle presentation.
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

## Save validation and browser failure boundaries

`validateSaveSchema(candidate)` is pure and runs before load writers. Quest
value types derive from `QUEST_FLAG_BINDINGS` defaults: booleans, non-negative
safe integers, and nullable strings. It does not hard-code stage maxima or
content counts. Existing lighthouse and Travellers' Rise authorities still
validate their closed states and cross-field invariants. World values outside
that registry (day, gold containers, booleans, stable-ID lists and the authored
brawl-day sentinel) receive explicit type/arithmetic checks. Missing fields keep
their established restore/default policy. Location bounds remain owned by the
location/catalogue authorities; inventory length is not capped here.

`rehydrateItem` supplies the same registry-backed policy to party load preflight
and restoration. Unknown names and fields absent from the current registered
item reject the load, preserving running state and stored bytes. Supported stale
registered values refresh from `ITEM_REGISTRY`; the existing key-item and former
Void Shard restoration exceptions remain. New registered items/metadata need no
save-specific name list. This does not enable new combat capabilities.

`saveStorage.read/write` contain browser storage exceptions and return explicit
results. Load-row rendering reads without mutation or exception leakage. A failed
Save/Load reports unavailable storage through existing menu banners; it cannot
report a successful save or delete/replace the old stored value on failed writes.
The storage methods rely on the browser's atomic `setItem` contract.

`gameRuntimeFailure` is a transient first-fault latch owned by `game-loop.js`.
An unexpected update/render error stops simulation, input and saving/loading;
the animation callback continues presenting a separate diagnostic screen, with
a DOM title fallback if Canvas is unavailable. No failed operation is retried,
rolled back or automatically saved. Reloading the page is the recovery route.
Normal update timing and normal draw calls are unchanged. No new save fields,
SAVE_VERSION change, fixed inventory/map limit or geographic changes are involved.
Suite 251 covers candidate rejection, registry growth, retained saves, denied
storage, failure-screen geometry and first-fault preservation.

## Save/flags — `QUEST_FLAG_BINDINGS` is the single source of truth

**`saveGame()` persists an explicit registry, not a blanket dump of every
global.** `QUEST_FLAG_BINDINGS` (`save.js`) is that registry: one entry per
persistent quest/world flag, each owning

- `key` — the stable, flat, top-level save-object key,
- `default` — the exact runtime default (used to seed a missing field on
  load; a *fresh* copy is taken each time via
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

### Save version 5 — persistent party, no migration, never deleted

`SAVE_VERSION` is the on-disk format number (currently **5**). v5 retains the v4
canonical location representation and adds the persistent party payload and Lely
Slither sample described above. Version 4 is intentionally unsupported; there is
**no migration path and no backward compatibility**. The
old migration registry has been removed (the frozen identity snapshots remain; nothing
consults it) and `migrateSave(parsed)` now accepts **only** the current version —
it validates the payload is object-like with `version === SAVE_VERSION` and returns
`{ ok: true, data, migratedFrom: null }`, else `{ ok: false, reason }`.

`loadGame()` calls it and, on `ok: false`, **warns and returns `false`, leaving the
save on disk untouched** — malformed JSON, an unversioned save, and *any* non-current
version (older v1/v2/v3/v4 or a future version) are all rejected cleanly and
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
enemy one, owned by `enemy-catalog.js` alongside scripted templates):

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

**Historical v2→v3 identity snapshots.** The frozen tables map the exact legacy v2
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

### Player-incoming defense mitigation

`effectiveDef()` (`combat.js`) remains the single effective player-DEF total:
base DEF plus equipped armor/shield, minus the existing Muddied penalty. Every
enemy-to-player damage roll passes through one runtime adapter,
`effectivePlayerIncomingMitigation(enemyAtk)`, which supplies the current
effective DEF and equipped-armor capability to the pure
`playerIncomingMitigation(enemyAtk, effectivePlayerDef, defenseCapBypass)` rule
before calling the unchanged shared `rollAttackDamage()` function:

```text
ordinary mitigation = min(effectiveDef(), floor(enemyAtk * 0.80))
```

`enemyAtk` is the live `combat.enemy.atk` value already used by the damage roll;
no display stat, name, map, pool, or enemy-specific branch participates. The
helper is used by Attack exchanges, item-turn responses, blocked and failed Run
hits, and Observe responses. Player-to-enemy calls still pass
`combat.enemy.def` directly to `rollAttackDamage()` and are unchanged. Variance,
critical multiplication, rounding, the minimum-one floor, evasion, status hooks,
and turn/message ordering remain owned by their existing paths after mitigation
is selected.

An equipped armor may declaratively retain legacy uncapped effective DEF with
the optional item capability `defenseCapBypass: true`. `ITEM_REGISTRY['Cat
Armor']` is the sole authored user; this preserves its hidden progression-
breaking behavior, including against Takomo. Runtime checks capability identity
with `=== true` and never inspect the item name. `validateItems()` rejects a
non-boolean value and rejects the capability on a non-armor. Item cloning,
equipment, and save/load rehydration already copy registry metadata, so this
adds no mutable state or save field and does not change `SAVE_VERSION`.

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
  (enemy-catalog.js) as `{ id: 'pool_<snake>', label, templates }` with a fresh
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

As of the last full pass: **0 errors, 4 warnings** across 118 maps, 28,320
tile cells, 177 NPCs, 114 item placements, 105 enemy templates, 67 map
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
  in its own fresh context; currently 182 suite files, all passing.
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
  historical version-migration layer (removed; see "Save/flags"), but that
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

Travellers’ Rise reachability originally depended on the east-exit guard
because walkable off-road terrain bypassed (10,7). The integrated natural-choke
correction below closes that route while retaining the guard in both movement
modes. Test 199 searches the full regional graph with the trigger removed and
proves no onward route exists; stage 2 opens the ordinary route after the night.
Loading remains inert and the separate campsite entrance stays at (6,4).

### Integrated Mornay peninsula identity cleanup

The six peninsula map IDs now use NECK_ROAD, WESTERN_COVE, EASTERN_SHORE,
HARBOUR_SHORE, TOWN_APPROACH and EASTERN_POINT under EASTERN_FENS_MORNAY.
All production catalogues, placement/seam references, debug/save lookup and
source-derived evidence agree. Only names changed in that checkpoint: every
grid, coordinate, encounter permission and pool was retained. The later Mornay
exterior topology section near the top supersedes its then-reserved marker.
No aliases or save migration are added: regional saves store canonical world
coordinates, which still resolve to the same placements under the renamed IDs.
The six maps retain their existing save restriction; malformed explicit retired
IDs still fail existing atomic validation.
SAVE_VERSION stays 5. The local campsite and all reviewed MQ5 story work are
integrated with the 22 enabled route chunks (11 easy and 11 hard profiles).

### Travellers’ Rise natural ambush choke

Three cells close the former staging shortcut: (11,4) grass → hills (119),
(11,5) rushes (89) → tree (3), and (11,6) grass → hills (119). All other grids,
seams, camp entry (6,4), return (6,5), pools and permissions are unchanged.
Removing trigger (10,7) from the tile graph leaves 121 reachable western cells
and no eastern-road access; retaining it connects 163 cells and all east exits.
The Impostor begins at (8.5,4.5), the cloaked Hollow at (10.5,3.5), and the
Handler retains (14.5,4.5). Their destinations remain (8.5,7.5), (10.5,5.5),
and (12.5,7.5). Preflight validates terrain, occupied cells, trigger exclusion,
all simultaneous actor positions and endpoint agreement before presentation.
Esla's post-victory campsite route uses row 6 to avoid the existing scrub at
(7,7). The original defensive east gate still blocks ambush/camp bypass and
opens after the existing stage-2 receipt. Load stays inert until deliberate
movement. Suite 217 covers graph and actual continuous/legacy input, while
199/201/207/208 retain payment, retry, save/load and one-time story coverage.

### Sera/Liora shared character scale and scene depth

The Bethany cutaway uses `SERA_LIORA_SCENE_METRICS` in `sera-liora-scene.js` for
normalized actor canvases, foot anchors, measured peer proportions and gait.
Sera's 146-pixel and Liora's 148-pixel neutral silhouettes differ by 1.37%; shared
facial landmarks are approximately 20 pixels. The nine Sera frames cover actual
four-direction room movement (left mirrors right), with a 0.20-second
gait and idle on dialogue/stop. The opening's existing 40-frame reveal projects a
validated floor approach (350,285) → (350,345), ending at the prior anchor.

`scene-depth.js` validates the complete draw plan before drawing: rear background,
world objects/actors sorted by finite ground depth, always-foreground effects,
then UI. Equal depths retain supplied order. It retains no state and consumes no
RNG. Bethany supplies exact-pixel bed masks at depth 350; actors behind draw first,
actors in front draw afterward. Collision remains owned by the unchanged room
movement authority. Waking Liora uses transparent poses behind original cover
pixels, never a resized opaque room patch.

No story text, trigger, save data, map grid or control handoff changes. Versioned
character assets and QA captures are documented in `Art/qa/sera-liora/depth-v2/`;
the supplied reference is QA only. Suite 260 covers pixels, scale, depth, animation,
route legality and rendering isolation. Existing cutaway tests retain lifecycle,
asset-failure, master-preservation and free-walk coverage with updated runtime
asset expectations.

The playable tail owns four repeatable interactions in the closed
`SERA_LIORA_GUEST_ROOM_INTERACTIONS` registry: standing Liora, the breakfast-table
starflowers, the town window and the writing desk. Each record supplies authored
continuous-pixel approach zones and facings because the transient Sera controller
does not project the ordinary tile player. Input asks this registry before the
existing door exit; active dialogue, route/cutscene ownership and invalid floor
positions fail closed. Rendering reads that same validated record for the
established blinking `SPACE` prompt, so its visual availability cannot diverge
from interaction availability. The existing exit-door zone supplies its prompt
anchor through the same drawing helper and its established availability check.
Mixed Liora dialogue uses stable `sera`/`liora` speaker
definitions, while observations remain default narration. No callback grants or
persists anything.

One rear walkable strip connects the existing main floor to the upper-right desk
through the visible gap between table and right bed. The solid desk and bed remain
in the shared collision authority. At foot depths below the bed's authored 350
anchor, the existing generic layered-scene painter places Sera behind the exact
bed foreground; the near floor reverses the order. `lioraPose === 'standing'`,
already the authoritative post-wake phase, also selects a deterministic unmade-bed
overlay clipped to the right-bed silhouette. The displaced pillow, exposed loose
sheet and blanket gathered to one side are presentation only. There is no new
mutable bed flag or save field.

Sera's centralized gait interval is 0.20 seconds (5 fps), a 30% frame-rate
reduction from 0.14 seconds (7.14 fps). Her movement remains 90 pixels per second,
the reveal remains 40 updates, and ordinary player/NPC cadences are untouched.
Suite 261 covers the interactions, route, painter order, bed phase, isolation and
timing. Automated native/2× Canvas evidence is under
`Art/qa/sera-liora/bedroom-v1/`.

### Mornay public-room authority

`content/maps/mornay-maps.js` owns `MORNAY_BUILDINGS`: distinct building IDs, room map IDs, source doors and reciprocal returns. `data.js` registers its 44 ordinary discrete interiors before deriving catalogue views. `movement.js` dispatches their doors and exits before generic town handlers; `world-transitions.js` validates the map and Mornay context together before committing. Save loading applies that same validation without changing SAVE_VERSION 5 or the location payload. Inn upstairs rooms use the same registry as exterior doors. No harbour or story transition is registered. `MORNAY_ROOM_FIXTURES` supplies both solid furniture tiles and rendering geometry.

Mornay population is authored once in `content/npcs/mornay-npcs.js`: 300 stable characters, 12 ordinary deterministic patrols and five companion exchanges. Author-only network classifications are not consumed by gameplay. `content/interactions/mornay-interactions.js` owns repeatable inspectables and service offers; it is dispatched before generic town interactions. `shops.js` supplies four existing-item inventories. Paid treatment goes through `persistentParty.treatMember()` (one gold per HP, selected stable member, no statuses/day change); inns use the existing overnight receipt before charging the fee. `render-mornay.js` is read-only and reuses fixture geometry; generic sprites accept optional hair/coat colours without changing old defaults.

Mornay residential refinement extends that same parent/child registry to houses, shared courts, flats and boarding rooms. No generic HOUSE_DOORS or house-source save fields are added. Two stationary pupils derive map/x/y/facing/pose from the existing Dayoff calendar; movers retain writable runtime coordinates and facing. Fixture geometry can span two horizontal tiles for ward beds, with TABLE providing collision and existing floor art restored under the authored furniture. `drawMornayRoomActors()` sorts room fixtures/NPCs/player without mutating gameplay; `isMornayRoomView()` selects this path only for registered Mornay interiors. Exterior and earlier-town drawing retain their existing dispatch. `authoredPose` opts Mornay residents into directional/seated drawing; it is content metadata, never persistence.

Mornay room orientation is derived by `mornayInteriorEntrance(building)` from the source return row relative to its door row. The map generator and `enterMornayBuilding()` share the resulting exit/arrival/facing contract. Southward entries use the north interior edge; northward entries use the south edge. The former southern floor stem remains open in reoriented rooms for existing v5 saves. Shop homes are ordinary child records, with `connection: 'stairs'` selecting read-only wooden stair art over their existing HOUSE_DOOR / INTERIOR_EXIT tiles. There is no second stair movement handler, tile type, location context or saved property.

### Expanded regional mainland authority

`MAINLAND_REGIONAL_CHUNK_DEFINITIONS` in `content/maps/mainland-maps.js` is the additional geographic fragment for the northern/western Great Fen, southern countryside, eastern mainland and open-lake/fringe scenery. Its 690 inline records join the existing fragment assembler and use the established `_regionalChunkCatalogEntry()` projection. No standalone map variables or `window` aliases are added. Existing map IDs/coordinates remain owned by their prior files. The current live catalogue has 934 regional chunks; older counts in historical implementation sections describe earlier checkpoints.

Negative columns use the existing floor-based world conversion and canonical pixel position; no movement/save extension is needed. `validateEncounterGeography()` tests an unplaced point beyond the actual western bound. `legacyBoundaryCrossingErrors()` requires player crossings only for accessible neighbours; scenery neighbours still require camera-exclusion metadata. This preserves the fixed-screen home while expanded bounds expose new framing. Seams remain reciprocal structural data with existing base-walkable border/inset landings. The river, bridges and warning bars are existing terrain tiles, not new movement or water authorities.

`test/regional-atlas.js --write` generates the human atlas, compact vector overview and live inventory. `--fingerprints` explicitly regenerates the terrain evidence after a reviewed grid change. The only allowed identical grid values are inaccessible, encounter-free, exit-free all-WATER scenery; accessible grids and physical map references remain unique. Suites 317/318 test physical return paths, story cut sets, original approach footing, negative controls/save/load, drainage, encounter ownership, Zolom observation ground and whole-region camera coverage.


### Bounded outdoor NPC ownership lookup

`physicalMapIdForNpc()` reads implicit ownership through `unambiguousOutdoorMapIdForContentKey()` in `continuous-content.js`. The same `_ccAmbiguity()` build derives forward diagnostic metadata and the reverse unique-key index; shared keys resolve to null. `outdoorContentKeyEntries()` remains diagnostic enumeration and must not enter per-NPC frame work. `data.js` tracks edits to the authoritative `OUTDOOR_CONTENT_KEYS` object with a private transient revision (assignment, deletion and property descriptors); a revision change rebuilds the indexes on the next read. NPC maps/positions/schedules are read live, and no cache is saved. Suite 319 enforces ownership parity, invalidation and bounded work after synthetic world-size growth. `test/profile-overworld.js` measures real-time Chromium update/render/frame costs against another existing checkout without changing either checkout. See `Art/qa/overworld-performance/README.md` for measured evidence and limits.


### Closed-edge regional camera framing

Regional chunk definitions may author `cameraClampEdges`, a unique list of closed cardinal edges. `data.js` projects that field unchanged into the chunk catalogue. `_continuousPlanCore()` combines these local edge limits with the existing global camera and legacy-screen exclusion; it reads the already-resolved placement and never changes regional position, movement or world bounds. Validation rejects malformed policies and policies hiding an open structural edge. The four early maps opt in: MAP_N1/MAP_N2 west, MAP2/MAP3 south. Other maps remain unrestricted by this policy. Suite 320 protects exact cell deltas, camera framing, the closed southern seam in both movement modes, and the explicitly sealed bank.


### Sera/Liora courtyard continuation

`sera-liora-courtyard.js` extends the existing transient Bethany scene with `courtyard_*` phases, scoped floor geometry and a validated Liora route. It reuses Sera’s room-space movement controller, the existing cutaway input owner, speaker metadata and `drawLayeredScene()`. The bedroom map identity remains the compatibility location for both scene stages; neither stage projects temporary actors onto Lely or enters saves. The existing infirmary completion now rejects inactive repeats; the courtyard callback additionally checks its stage and session epoch. Completion and checkpoint reset clear temporary actors/routes and invalidate stale asynchronous callbacks. Generated Liora frames use measured alpha bounds to retain the shared 148-pixel height/ground anchor. Suite 262 and the courtyard browser review cover the continuation; asset provenance and review evidence are under `Art/qa/sera-liora/courtyard-v1/`.

Mixed-speaker pagination in `drawDialogue()` measures each source page with its own validated speaker style and line height, then restores the active page’s body font before drawing. Cached visual pages retain their speaker metadata; legacy uniform pages keep their existing path. The courtyard browser check measures actual emitted text instead of re-wrapping already processed strings.


### Sera/Liora breakfast continuation and pre-battle handoff

`sera-liora-breakfast.js` extends the same transient special scene with authored paired departure/arrival, scoped floor/gate collision, one-at-a-time keeper/Liora/Sera routes, two deterministic scene-only beetles and a temporary fade. It reuses the existing Sera controller, protagonist sprites/metrics, speaker metadata, cutaway activity owner and depth painter. No world map, general follower, enemy definition, canonical-party member or save field is added. The courtyard callback now begins this continuation instead of completing the cutaway. `finishSeraLioraBreakfastPreBattle()` remains the sole normal battle handoff; Pass 4 below replaces its temporary ending with the shared battle, then the existing authenticated completion. Start, completion and checkpoint reset invalidate epochs and clear temporary routes/visibility/fade. Narrow gate-state/foreground crops retain the original plate outside their authored masks. Suite 263 and the extended native/2× courtyard browser harness cover the complete lifecycle.

### Reusable transient story battles — Pass 1

`story-battle.js` owns one detached, session-only context of authored profiles and inventory. `combatPlayerState.claimStoryBridge()` is independently claimed once; its private capability shares the canonical bridge's seed, arithmetic validation, enemy installation, standard command session, immutable playback and authenticated completion. It cannot use canonical/scripted handoffs, special escape policies or scripted-lifecycle enemies. Its party preparation does not depend on Lely's HP.

Between fights the context owns acknowledged HP/status/equipment/inventory. During a fight the ordinary session owns live resources. Terminal commitment verifies exact runtime membership and the acknowledged reel, validates a detached candidate, finishes the bound session, replaces context resources and consumes the outcome before invoking an authored continuation. It never snapshots/restores or writes canonical characters, grants rewards, recovers the world or moves story flags. Faults retain diagnostics until explicit discard/checkpoint reset.

Context existence blocks saves, loads, world simulation/input and competing combat entry. Cutaway start/end and checkpoint cleanup discard it through its authenticated owner. `SAVE_VERSION` and the payload are unchanged. `sera-liora-battle-profiles.js` supplies opening data independently of the name-agnostic adapter; `render-party-battle.js` registers pure adapters to the existing approved Sera/Liora assets. The breakfast controller now supplies the first playable caller (Pass 4 below). See `STORY_BATTLES.md` for game mechanics and deliberate deferrals.

### Independent offensive Resonance — story Pass 2

`resonance.js` extends the existing closed technique/effect union with Null and
Rainbow. The reusable damage effect is `max(1, power - enemy.def)`, clamped to
current HP, with no action RNG. Both authored powers are 120 provisional balance
data. Target side and eligibility come from technique policy, shared by command
preflight, selection, availability and history validation. Only one exact living,
present enemy is eligible; wrong-side, stale, missing, dead and departed targets
reject. A target killed earlier cancels without replacement or cost. Attack-only
mitigation/counters/accuracy and melee armour/Brace are not new spell mechanics.

`storyBattle.createContext` optionally accepts frozen-copy `resonance` bindings.
Opening data supplies `SERA_LIORA_OPENING_RESONANCE`. Rows with `source:'story'`
require the engine's private story preparation permit and resolve only through
`STORY_CHARACTER_DEFINITIONS`; canonical and Lab preparation retain their closed
persistent-character authority. Story capability snapshots carry that source so
detached history can validate authored provenance without a live context. Default
unbound contexts and canonical capability snapshots keep their accepted shapes.
The context retains only static bindings; mutable Strain remains in the ordinary
command authority and uses its existing recovery/terminal-cleanup lifecycle.

`resonance_damage` records plan/participant/technique IDs, technique name,
elements, power, historical DEF, attempted/applied damage and exact HP before/after.
Playback validates the deterministic witness and strict metadata, then projects
immutable frames without running a resolver, formula or RNG. Shared rendering
uses copied damage and element labels and historical enemy HP. Existing healing
history/Quickbloom presentation and ordinary weighted initiative are unchanged.
Damage kills process the same stolen-gold recovery receipts as the shared
resolver; the story adapter still has no gold/reward ownership.

Pass 3 below adds cooperative Tech and its combined scheduling. No playable story
input, breakfast handoff, encounter tuning, retry or second fight is connected. Beetle combat templates
are absent; authored lethality remains unverified until that encounter is added.
SAVE_VERSION remains 5, with no save-payload change.


### Explicit combined Resonance — story Pass 3

Eclipse uses the same shared Resonance authority and deterministic per-enemy
power-minus-base-DEF policy, with provisional power 120, Void/Prism metadata and
Strain 1 on each successful participant. Each actor's closed all-target action
uses `targetIds` instead of `targetId`: the exact round-start living, nondeparted
enemy IDs in slot order. Malformed/nonprimitive IDs reject before serialization,
RNG or writes. Execution hits only surviving captured IDs, computes all witnesses
before changing HP and emits one `resonance_damage_all` event before Strain and
terminal/gold recovery. No new target is acquired. Detached history checks every
consent, the single representative/minimum-Speed entry, initiative weights,
metadata, exact surviving hit set and HP deltas; pure scheduling witnesses are
captured at initialization just like the existing damage witness. Frame
projection/rendering consume recorded data without executing live effects or RNG.
The shared renderer supports explicit all-enemy confirmation/cursors and derives
disabled commands from controller availability. No new art, global planner change,
persistent state or save field is introduced. SAVE_VERSION remains 5. Breakfast
now enters the first authored battle through the separately authorized Pass 4
controller below. The second fight remains deferred.


### Breakfast story battle — Pass 4

`sera-liora-breakfast-battle.js` owns only scene stage, epoch, attempt and the
opaque context token. It routes keyboard commands to the existing standard party
session and shared playback. Input routes before the generic story-context block;
update advances only scene presentation; render consumes the immutable shared
view and never mutates effects. Two registered Buzzy Beetle identities use ordinary
capabilities, zero rewards and the approved scene sheet. No random pool changes.
The shared optional presentation fields are `backgroundAssetId` (registered
512×480 cutaway background) and `enemyFloorY` (integer140–212); defaults preserve
existing canonical/headless layouts. Bethany no longer supplies the raised floor
156. Its scene controller decorates the immutable presentation view with an
allowlisted `stagingId` and session-only `presentationSeconds`, reset at each
fight/retry and advanced only in update. These never enter the story adapter's
resources, action history or saves. `PARTY_BATTLE_SCENE_STAGING` in the shared
renderer owns the existing-plate crop, planted feet and scale for both scenes.
Its identity/background/participant checks fail closed; unstaged battles retain
their established geometry. The crop clears the entire canvas before painting.

Beetles reuse their three existing sprite frames in the 0/1/2/1 cycle, 0.20 seconds
per frame, with independent slot phase. Frame changes keep constant height and
floor contact; defeated/departed actors hold the neutral pose. Contact shadows,
target cursors and offensive Resonance effects use the staged positions.
Rendering remains read-only; sprite pose is optional for ordinary callers.
Suites 267 and 332 check alpha envelopes, UI clearance, movement frames, immutable
views, no RNG/resource mutations and targeting; 267–269 retain mechanical,
retry, carryover and final-completion coverage.

Generic `storyBattle.createContext(options)` retains strict activity exclusion.
A once-claimed scene bridge provides the sole authorized variant. Its read-only
owner predicate checks the controller identity/epoch, active cutaway, physical
map and allowed phase; preflight temporarily retains only that owner credential,
then stores it on the accepted context. The engine's opaque story permit maps
to that private predicate and may waive ONLY the active-cutaway preparation guard.
Other modal conflicts and generic context/canonical entry remain closed. No
public caller boolean, active=false spoof or canonical snapshot/restore exists.

Final dialogue defers entry until a later update after callback cleanup. Every
attempt has authenticated terminal acknowledgement, then separate outcome
commitment. Victory retains context through aftermath/fade and discards it via
the existing hospital completion. Escape/defeat confirmation defers a fresh
context until the next fade/update; faults never retry. Reset/start/completion
and ordinary checkpoints invalidate tokens and stale dialogue/asset callbacks.
Save/load also checks the scene controller before storage, covering assets/fades
without a context. A strict scene-only checkpoint variant enters the same preview
route without applying a world fixture or mutating canonical character data.
No save-schema/version change, new quest flag or second fight is introduced.


### Storeroom continuation — reviewed stage 1

`storyBattle.begin()` now privately records the accepted fight-entry resources
and normalized encounter recipe. `retry(token)` accepts only that context's most
recent completed, acknowledged defeat/escape, restores that entry through the same
shared preflight/install authority, and keeps the context token. A rejected
preflight cannot replace the entry snapshot. Victory and fault cannot retry.
Starting the next fight replaces the retry baseline with the previous victory's
committed HP, persistent statuses, equipment and inventory. Strain remains
battle-local; existing Burn/Dazzled terminal cleanup is unchanged.

The breakfast controller advances its same context from the two approved yard
beetles into a single ordinary large storeroom beetle. Stable per-fight callbacks
and monotonic receipt IDs authenticate retries; epoch/phase guards invalidate
stale dialogue and image continuations. `firstCleared` keeps the yard beetles
absent through every later stage. Both registered storeroom plates load as one
bundle after the crash and must be ready before room entry. The original plate
remains through combat; acknowledged second victory selects the flour-covered
breakfast-supplies variant using existing secondCleared state only. Shared scene
sprites and background/battle rendering remain read-only.
The server's final question ends at `review_hold`: context/input/save ownership
remain active, no hospital transition or completion flag fires. Courtyard return,
improvised breakfast and final completion await Dot's stage-1 review.


### Final courtyard breakfast — stage 2, pending final review

The former storeroom review hold now enters controller-owned `breakfast_ending_*`
phases: fade to seated breakfast, quiet plans, the generated pinky-promise still,
a two-second promise hold, and final fade. Two new opaque 512×480 stills include
both characters; standing sprites and the former hand/cup overlays are omitted
during the ending. Both assets preload in the breakfast bundle. Null, Rainbow
and Eclipse use authenticated shared-engine events for 24/30/42 presentation-frame
effects, including an expanding Eclipse burst; rendering never resolves damage
or spends resources. Scene input waits for the effect’s exact terminal frame. The same idle story context remains owned until
completion, so input/world simulation/save/load stay isolated through every stage.
`endingElapsed` is a transient presentation clock only. Confirm-key latches are
preserved; dialogue continuation failures enter the existing diagnostic fault.

Callbacks require the current state/epoch and expected stage. The controller marks
`completing` before calling `endSeraLioraCutawayAtHospital()` and writes no old state
after cleanup. That unchanged authority alone clears the context/actors, places
Lely and conditionally sets the existing opening-complete flag for true story
entry. Debug replay preserves current flags and canonical resources. Helpers now
follow the natural ending; the temporary direct hospital-completion test bypass
is removed. Suites 267/268 retain accepted fight/reveal/retry coverage; suite 269
covers final timing, completion, held input, reset, replay and fault isolation.

The ending fade now leads to a three-second `chapter_card` presentation showing
“Chapter 2” before the hospital handoff. It retains the same scene/context/input
ownership; completion and the existing story flag occur only after the card.
The renderer reads the bounded presentation clock without advancing it. Room,
courtyard and breakfast movement accept arrow keys alongside WASD through the
same local movement/collision authority; both aliases clear at control handoffs.

### Mornay tenement and blocked office follow-up

`MORNAY_BUILDINGS` now registers 67 rooms: South Rows gains two corridor floors, twenty flats and an attic. Each floor has eight reciprocal unit doors. Existing four flats retain their identities and geometry. `tiny` is immutable authoring metadata for five-by-five living space; it does not enter the save payload. `connection: 'hatch'` selects a concealed ceiling-seam presentation over the same ordinary HOUSE_DOOR, then descending ladder art on return; no new movement handler, tile ID, discovery flag or alternate transition authority exists.

`MORNAY_MAP_FEATURES` now includes registered interiors as well as exteriors, allowing five repeatable tenement/attic inspectables through the existing feature dispatcher. They contain no callbacks. Twelve additional `dayOff` placements reuse the existing NPC getters and calendar; stable objects, IDs and routes are preserved. Fourteen `reportText` strings are selected only at MainQuest 5; existing companion metadata owns Esla's interjections. These dialogues have no service/action, state write, handover or MQ advancement. `MORNAY_TOWN_PLAN.md` tracks the intentionally circular errands and future unresolved decisions. Save version and schema remain 5.


### Polwick companion visits and cargo room

`polwickEslaDialogue()` in `thornmere-wilds-interactions.js` handles three ambient exchanges only for the physically available fort NPC at the completed report stage and canonical Esla membership. It uses `setSpeakerDialoguePages()` with the stable `polwick` and `esla` speaker definitions. The existing unresolved arrest and combat retry dispatch retains precedence. After three completed exchanges, the original lighthouse handler retains its normal offer/reminder/turn-in behavior; otherwise the drought exchange repeats.

The sole new persistent authority is the ambient counter `polwick_esla_visit_stage` in `quests.js`, mirrored by `syncQuestFlagsToWindow()` and registered once in `QUEST_FLAG_BINDINGS`. It advances on completed dialogue with a captured-stage guard, is clamped for presentation, defaults to 0 when absent from a v5 save, and changes no outcome or quest. Standard numeric save validation rejects malformed values. There is no version change or migration.

The rear room extends only the existing `SMUGGLER_FORT_MAP`; no new map/location/door registry is needed. Crates reuse `FORT_CRATES` collision and drawing; the freight table uses the existing TABLE tile. The two inspectable anchors are active-fort-only and repeatable. The Flame reader content/theme remain unchanged. Exact 18-cell wall-only expansion is recorded in `Art/qa/polwick-fort/grid-deltas.json`; regional terrain, fingerprints and the transition artifact do not change.

### Mornay watchhouse

`mornay_watchhouse` is an ordinary `MORNAY_BUILDINGS` record, with the shared north-door entrance/return contract. Its fixture grid authors a full-width solid security screen, four rear cells and a gated yard; public access is intentionally confined to the northern booking room. Iron gates are `TABLE` collision fixtures, not `HOUSE_DOOR` tiles or dormant transitions. Rendering reuses damp masonry primitives without changing interior tile semantics. The records, property and rear-screen features are repeatable `inspect` data only. Existing resident IDs/schedule ownership remain unchanged; no jail state enters saves. Suite 327 checks the public component and ordinary input round trip. Test placement now derives room arrival from `mornayInteriorEntrance` instead of assuming every interior is publicly reachable from its south edge.


### Sedge Hollow expedition and linked clerk quests

`struck-entry.js` owns the optional Struck Entry expedition. `content/maps/third-lock-maps.js` registers seven discrete maps and thirteen point doors through the map catalogue and existing movement dispatcher. The sole regional marker is in `GREAT_FEN_C8RN3_MAP`; it uses the existing outdoor decoration/feature authorities. It does not change a regional grid, seam, camera or main-route gate. Forward local doors require clearance masks; reverse doors are always usable.

`scriptedPartyEncounters` issues the existing authenticated canonical-combat tokens for five `struck_entry` formations. This named entry also supports an unrecruited singleton; historical singleton and other scripted routing stay unchanged. Only its authenticated victory finalizer writes `struck_entry_wins`. Escape/defeat follow ordinary recovery, preserve earlier victories and grant no clearance. Formations reuse registered enemy templates and standard rewards.

Four defaulted v5 bindings in `quests.js`/`save.js` own progress: `struck_entry_stage`, `struck_entry_wins`, `struck_entry_cache`, `struck_entry_supplies`. `struckEntry.invariantErrors(candidate)` checks stage, ordered bits, receipts and delivery items before save/load mutation; old saves default to zero/false. `corvin_favor_done` remains the completion authority. Stage 3 delivers exactly one tally and toy boat; Corvin's guarded completion consumes them and sets stage 4/done. Already-completed older favours remain valid without expedition fields. The countersignature and cabinet filing remain separate existing actions. Renn's existing payout callback now rejects repeated/stale completion.

The five NPC records in `content/npcs/third-lock-npcs.js` retain stable identities. Heddra and Belric derive locations from the rescue stage rather than adding replacement bodies. Dialogue uses explicit speaker metadata and filters Esla through `persistentParty.isAvailable('esla')`; there are no recruitment, absence or equipment writers. Civilians never join combat. A short narrated cart/scow evacuation relocates them while leaving the player in the settlement, preventing a ferry/progression shortcut.

Suites 333/334 cover authenticated outcomes, retry, discovery order, delivery, existing Polwick outcomes, temporary companion absence, save atomicity, all local doors through movement input, survivor reachability and the original filing/payout choice. `test/third-lock-browser.html` is an isolated browser review fixture with ordinary input-driven routes at both scales and manual-play controls.

Geography correction: the destination is Sedge Hollow, an ordinary fen hamlet. Legacy `THIRD_LOCK_*` IDs remain stable for saves; they do not denote canal geography. Public titles, clues and journal text follow Heddra’s move from Drenwick. The historical tally still names its original Drenwick lock. No Drenwick grid, lock, route, combat formation, state binding or door changed.

### Standalone pinky-promise animation preview

`debug-promise-preview.js` owns only a transient phase and elapsed presentation time. Debug row 14 opens the separate three-second illustration study; previous debug actions retain their indices. It keeps the debug menu as its return destination, freezes normal update before world timers/movement, and intercepts physical keys with the existing repeat latch. Rendering is read-only. Escape cancels even while the lazy image load is pending; no completion callback can reopen the preview. Save/load reject while it owns presentation, without changing SAVE_VERSION 5 or the payload. `activityOwnership` registers `promise_preview` for ordinary exclusivity checks. No production cutaway controller, asset, bundle or timing is replaced.

Four six-pose sheets use the existing image registry/cache, with explicit source crops for 24 complete generated poses. The preview waits for all four sheets before starting and fails cancellably if any sheet fails. Each pose plays for 125 ms; duration derives from the 24-frame sequence (three seconds). Its generation prompts and limited-animation caveats are recorded in `assets/previews/sera-liora/README.md`. Suite 335 checks actual debug navigation, the three-second endpoint, replay, held input, failed/delayed loads, save refusal, state isolation, frame bounds and unchanged original art.


### The Fleck: town extension and fishing profile

Two `MORNAY_TOWN_LAYOUT` records extend the existing discrete Mornay graph. `mornayTownNeighbor` respects reciprocal `blockedEdges`, keeping the newly adjacent Old Fort/Net Lane boundary water-only. The ordinary town generator, catalogue registration and transition controller still own all movement. Seven `MORNAY_BUILDINGS` rooms use existing parent/child door context; `stairsDown` controls stair artwork only. Damp-room and waterfront drawing in `render-mornay.js` is read-only and uses existing collision-bearing tiles/fixtures. No regional chunk, camera, encounter pool or save schema is changed.

`interactFleckFishing` is active-map/local-range gated and rechecks rod, bait and cast ownership in its choice callback. `startFishing(power, waters)` owns a transient profile (`drenwick` default or `fleck`), with shared input/timer/result handling. Bait is consumed only after a successful launch. A completed cast cannot grant its reward twice; dismissal clears the profile. Save/load refuse active fishing rather than serialize it. Three registered food/fish items use ordinary healing, shop sale and inventory persistence; no new item type or progression flag. Suite 336 tests control-driven street round trips, casting outcomes, ownership/payment and shop persistence; existing Mornay exhaustive room/route suites include the new rooms.


### Compact regional settlement markers

`TOWN_ROOFS` (131), `TOWN_FORT` (132) and `TOWN_HARBOUR` (133) append to the stable tile registry. They are solid, non-encounter scenery with deterministic, tile-bounded Canvas renderers. They add no transition, interaction, camera or save authority. Mornay uses them in four existing solid marker cells; the two `TOWN_ENTRANCE` cells remain the sole entry authority. Narrow road paving is authored directly in the regional grids; adjacent walkable grass preserves the existing structural seam ranges and obeys ordinary encounter eligibility.


### Mornay marker shifted north — 2026-10-28

Follow-up to the road/marker pass: the two-by-three marker moves one row north within `EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP` (now rows 0–2, columns 7–8). Its gates are at row 2; the former gate cells on row 3 become road. Water replaces grass at row 2, columns 6 and 9, preventing lateral entry. Nine tile values change in this follow-up; no other regional grid changes. Return landings remain (240,144)/(272,144), now two rows south of the gates, facing down. Town maps, cameras, seams and SAVE_VERSION 5 are unchanged. Exact deltas are in `test/fixtures/mornay-north-shift.json`; suite 338 tests side collisions, southern gate round trips/save-load and connected shore ground. See `Art/qa/mornay/north-shift-v1/README.md` for evidence.


### Mornay optional job contracts

`mornay-jobs.js` owns the board, two removal records, existing-NPC conversation
branches, packet delivery flow, pure journal projection, active-map-only field
presentation and candidate/runtime invariants. `interactions.js` dispatches to
it after the existing optional cases; `render.js` calls its read-only renderer.
The board and creature overlays use existing drawing functions, not terrain IDs.

`enemy-catalog.js` registers two ordinary static removal templates, with existing
sprite dispatch in `render-battle.js`. `scripted-party-encounters.js` owns the
`mornay_removal` entry, exact target/origin authentication and victory receipt.
Both solo and multi-member parties use canonical combat. Only the authenticated
finalizer clears a hunt; escape/defeat do not. Giver callbacks separately guard
proximity/stage before paying once. Creature targets are active-map-only.

`quests.js` owns `mornay_peat_hunt`, `mornay_ridge_hunt` (0–3) and
`mornay_hoist_errand` (0–5); `save.js` binds each with default zero at version 5.
Load preflight checks candidate stage/packet consistency before mutation; old v5
saves omit these fields safely. Exactly one registered Hoist Inspection Packet
exists while errand stage is 1–4; none at 0/5. No session state is persisted.
Suite 339 covers input-driven interactions, reachability, authenticated outcomes,
solo/party combat, one-time payments, stale callbacks and atomic save rejection.

### Swallow deadline and presentation

`enemy-capabilities.js` maps positive integer `swallowAfterRounds` to the closed
`swallow_deadline` capability; only the Peat-Bed Maw currently authors it. The
canonical command resolver uses its existing completed-round authority, after
all scheduled actions, burn and Bomb ticks. A living deadline enemy records one
`swallow` event with round, deadline and exact living-party HP witnesses, then
ordinary defeat handling applies. Victory/escape preempt the event. There is no
new save field or second timer for combat progression. Legacy Formation rejects
the unsupported field rather than silently ignoring it.

Historical playback independently reconstructs deadline eligibility and exact
victims, rejects malformed history, and never rerolls or writes gameplay state.
`partyBattleSwallowAnimation` in `render-party-battle.js` reads that event and
owns only a 120-frame presentation clock. Normal elapsed-time update and input
blocking mirror Quickbloom; canonical/Lab cleanup resets it. Read-only rendering
reuses `drawBattlePeatMaw` for field/battle/emergence, clips above the UI, and
shows the remaining full rounds from the shared immutable battle view.
Suite 340 covers deadline boundaries, delayed-kill precedence, final-round
victory, escape, defeat/retry, replay and animation isolation, and MQ5 loadout
balance witnesses. SAVE_VERSION remains 5.

### Great Fen tactical encounters

`fen-combat.js` owns a pure reducer for the closed `fen_tactics` capability.
Runtime state lives inside command-round `unusual.fen` records; no save authority
is added. The resolver and playback verifier recompute identical effects from
current authenticated state at enemy actions, post-action reactions and round
boundaries. Recorded full before/after witnesses are compared, not executed as
commands. Ordinary bites retain the shared Attack path. Chorus reserves both
participants at round entry and schedules one action at minimum participant
Speed; interrupted partners cannot receive a replacement action. Slows affect
battle-effective Speed without writing character stats. Observe XP is paid only
through canonical victory receipts. `great_fen` is an authored profile, not a
map-ID exception. Solo encounters containing this capability use the canonical
engine; older solo content is unchanged. See GREAT_FEN_ENCOUNTERS.md.

### Zolom escape consumable and arrival warning

`itemAllowsEncounterEscape` is the narrow shared Serpentsmoke predicate: at least
one living, non-departed enemy, all Fen Zolom. Item events consume one registered
item through existing combat authority; canonical and Formation replay recompute
eligibility from authenticated state. Legacy singleton uses the ordinary escape
receipt. No rewards or persistent escape-unlock state are created. Canonical party Run
remains boss-locked; the older solo speed-contest Run is unchanged. Inventory persistence rehydrates the registered item at v5.
`warnFenZolomArrival` reads canonical geography before movement and before an
encounter roll, using a session-only per-visit latch; it adds no seam callbacks.
Henric's upstairs stock uses `MORNAY_SHOPS.hidden_supplies`, not a new shop system.


### Optional wilderness dreams

`wilderness-dreams.js` owns five frozen walking-site definitions and a session-only
active guard. `movement.js` supplies the canonical regional position before a
movement step; an actual tile crossing into a registered site interrupts before
encounter RNG and step effects. A map-keyed lookup bounds the work independently
of world size. Loading, warping or standing on a site does not trigger it.

The existing `enterDream()` / `exitDream()` gateway owns the white-map visit and
exact waking location/facing restore. The optional aftermath uses speaker pages:
neutral narration, then Esla's green words if she remains available. No rewards,
healing, quest progression or day advancement occurs.

Five `wilderness_dream_*_seen` booleans use `QUEST_FLAG_BINDINGS` and the existing
window-native normalization pattern. They are the only new saved state; missing
fields in version-5 saves default false. Save/load is blocked during the vision,
so its session-only return location cannot be lost. The guard is cleared before
the ordinary aftermath dialogue. No save version change or map/grid change.
See `Art/qa/wilderness-dreams/README.md` for sites, writing and verification.


### Broken Rise / Fen Caverns

`content/maps/fen-caverns-maps.js` authors the regional definition at (3,-1),
three discrete cave grids and eight reciprocal point-passage records.
`data.js` extends the existing fragment assembler/catalogue; the regional grid
has no standalone alias. The cave interiors have neutral location state,
ordinary saves and explicit content keys/titles. `fen-caverns.js` indexes the
passages by active physical map, derives outdoor cells from canonical regional
position, and calls `transitionToLocation()` for the same atomic placement used
elsewhere. `movement.js` invokes it with existing local-door dispatch.

No new location mode, persistent field or seam is introduced. Arrivals are off
reciprocal trigger tiles and face away. Cave maps have authored neutral debug
warp destinations. Transition audit exercises every passage; suite 348 walks
through all chambers in both directions and movement modes, saves/loads each
map, verifies all floor components, old geometry/cameras and progression cuts.


### Expanded-wilderness discoveries

`content/wilderness-discoveries.js` defines one-time examine pickups and three
scripted-inspect caches; authored `itemSetId` bindings resolve through
`_REGIONAL_ITEM_SETS` before pickup registry construction. `wilderness-discoveries.js`
owns active-physical-map choices and checks canonical regional coordinates.
The `wilderness_discovery` formation in `scriptedPartyEncounters` uses existing
solo/party combat and authenticated outcomes. Victory grants the selected cache
once and marks its stable pickup ID; escape/defeat do neither. Two peaceful
alternatives grant smaller supplies and consume the same pickup. The repeatable
bootmark clue uses MAP_FEATURES; the hidden dead-end uses WORLD_HOLLOW terrain.
No new persistent authority or save fields; version 5 collected IDs suffice.
