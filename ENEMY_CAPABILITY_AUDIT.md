# Enemy capability audit

The Travellers' Rise increment extends the registry to 63 templates: 45 ordinary
(44 static plus authenticated 23), twelve token-owned canonical scripts, and six
pre-recruitment-only scripts. The original exhaustive 48,642 ordinary dry
preparations remain unchanged; the new fixed formation is covered independently.
All 20 flat pools retain their exact contents and selection behavior.

Pass 3 audited the original 60 exact identities in `ENEMY_TEMPLATE_REGISTRY`. Pass 4A added
Brace and Pass 4B adds the seven established landed-hit riders; all fifteen
migrated rows below are now ordinary under the implemented capability contract. Mechanical
classification and post-MQ5 reachability are separate: an ordinary template may
still have a scripted starter whose outcome lifecycle remains unsupported, and a
mandatory pre-MQ5 encounter may still require mechanics that the legacy Formation
engine owns.

Pass 5 added canonical execution support for nine scripted templates through an
authenticated lifecycle owner; Travellers' Rise adds three more behind one
formation lifecycle. The registry now reports **57 mechanically compatible
templates**: the 45 ordinary templates plus those twelve. The remaining
six are the fort trio (including Polwick's unresolved Firelit attack) and the
Receiver trio; all are necessarily pre-recruitment. Mechanical compatibility does
not itself authorize a story route: all 18 scripted rows retain their
`scripted-only lifecycle` audit classification, and the twelve canonical rows require
an exact one-use encounter token.

Canonical compatibility is derived by `enemyCapabilityMetadata(template)`. Every
record has the closed shape
`{ templateId: string, capabilities: readonly string[] }`. The record, array and
registry projection are deeply frozen. Template fields with execution meaning map
to capabilities through `ENEMY_TEMPLATE_FIELD_CAPABILITIES`; mechanics that live in
identity-specific legacy branches or scripted lifecycle owners are declared in the
audited `ENEMY_HIDDEN_CAPABILITIES` map. That map records requirements and cannot
grant approval. Unknown fields, capabilities, accessors, prototypes, duplicate
capabilities, missing ordinary fields and non-exact registry identities fail
closed.

The supported canonical mechanic registry is exactly `basic_attack`,
`standard_observe`, `standard_rewards`, `boss_escape_lock`, `brace`,
`curse_on_hit`, `void_shard_burst`, `acid_corrosion`, `slither_on_hit`,
`poison_spell`, `dazzle_on_hit`, `split_followup`, `regeneration`,
`melee_armor`, `counterattack`, `poison_on_hit`,
`mire_toad_reagent_observation`, `steal_and_flee`, `generated_stats`,
`observe_run_lock`, `guaranteed_drop`, and the nine authenticated story
lifecycle capabilities. Compatibility means that every derived requirement is
implemented by that mechanic registry. It never means that an enemy ID is
present in an approval list. The six pre-recruitment-only templates retain the
unsupported `fort_lifecycle`, `firelit_attack`, and Receiver lifecycle
capabilities under their existing singleton or Formation owners.

Reachability terms used below:

- **repeatable**: appears in a geographic pool or repeatable random override that
  can still be reached after recruitment;
- **reachable scripted**: an optional or stateful scripted route may still be
  reached after recruitment, although its starter remains under the Pass 1
  singleton guard;
- **permanently completed before recruitment**: MQ5 prerequisites necessarily
  resolve the Receiver formation first;
- **debug/test only**: no registered template currently has this status.

The declaration column is also the registration source. `data.js` contains pool
and bespoke singleton templates; `combat.js` contains legacy scripted templates,
Receiver actors, and the generated-23 registry sentinel. Observation-table and
sprite-dispatch references are presentation data unless the direct-reference
column says otherwise.

| Stable ID / name | Declaration; encounter sources | Post-MQ5 reachability | Required capabilities | Direct ID-specific semantic references | Before Pass 3 | Final category | Migration result / deferral |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `enemy_marsh_wisp` / Marsh Wisp | `data.js`; core overworld pool, Labs | repeatable | basic attack, observe, rewards | observation/sprite aliases only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_stone_crawler` / Stone Crawler | `data.js`; core overworld pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 20% |
| `enemy_briar_hound` / Briar Hound | `data.js`; core overworld pool, Labs | repeatable | base | observation/sprite aliases only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_marsh_wisp_early` / Marsh Wisp | `data.js`; starting-map pool | repeatable | base | observation/sprite alias only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_briar_hound_early` / Briar Hound | `data.js`; starting-map pool | repeatable | base | observation/sprite alias only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_bone_guard` / Bone Guard | `data.js`; first dungeon pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 25% |
| `enemy_shade_wraith` / Shade Wraith | `data.js`; first dungeon pool | repeatable | base + slither-on-hit | explicit legacy hit-effect ID branch | rejected | ordinary | Pass 4B: 25% landed-hit Slither with sampled Speed |
| `enemy_crypt_fiend` / Crypt Fiend | `data.js`; second dungeon pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_void_walker` / Void Walker | `data.js`; second dungeon pool | repeatable | base + curse-on-hit + shard burst | explicit legacy shard-burst ID branch | rejected | ordinary | Pass 4B: 20% landed-hit Curse plus independent 35% shard burst |
| `enemy_hollow` / Hollow | `data.js`; deep-dungeon pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 20% |
| `enemy_fen_shade` / Fen Shade | `data.js`; deep-dungeon pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_tomb_sentry` / Tomb Sentry | `data.js`; floor-eight pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 30% |
| `enemy_crypt_revenant` / Crypt Revenant | `data.js`; floor-eight pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_wall_tendril` / Wall Tendril | `data.js`; horror pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_dripping_maw` / Dripping Maw | `data.js`; horror pool | repeatable | base + acid corrosion | `acidChance` generic branch | rejected | ordinary | Pass 4B: 35% landed-hit per-instance corrosion, cap 6 |
| `enemy_the_seep` / The Seep | `data.js`; horror pool and split follow-up | repeatable | base + split follow-up | split starter/finalizer | supported | ordinary | Pass 4C: authenticated separate successor |
| `enemy_fen_lurker` / Fen Lurker | `data.js`; far-world pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_rotwood_troll` / Rotwood Troll | `data.js`; far-world pool | repeatable | base + regeneration | `regenPerTurn` generic branch | supported | ordinary | Pass 4C: round-end regeneration and Trollbane |
| `enemy_thornback` / Thornback | `data.js`; far-world pool | repeatable | base + melee armor + counterattack | armor/counter generic branches | supported | ordinary | Pass 4C: melee armor and immediate exact-attacker counter |
| `enemy_fen_witch` / Fen Witch | `data.js`; far-world pool | repeatable | base + poison spell | explicit legacy hit-effect ID branch | rejected | ordinary | Pass 4B: 25% landed-hit poison, Fen Mask ward preserved |
| `enemy_bog_serpent` / Bog Serpent | `data.js`; far-world pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_mire_toad_male` / Mire Toad | `data.js`; far/basin/upper pools and spawning site | repeatable | base + poison-on-hit + sex/reagent observation | sex-specific Observe/reagent and poison branches | supported | ordinary | Pass 4C: poison and per-instance reagent puzzle |
| `enemy_mire_toad_female` / Mire Toad | `data.js`; far/basin/upper pools and spawning site | repeatable | base + poison-on-hit + sex/reagent observation | sex-specific Observe/reagent and poison branches | supported | ordinary | Pass 4C: poison and per-instance reagent puzzle |
| `enemy_corpse_slug` / Corpse Slug | `data.js`; Thornmere pools | repeatable | base + slither-on-hit | explicit legacy hit-effect ID branch | rejected | ordinary | Pass 4B: 30% landed-hit Slither with sampled Speed |
| `enemy_marsh_rat` / Marsh Rat | `data.js`; lighthouse/shore/canal pools | repeatable | base | sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_shallows_skitter` / Shallows Skitter | `data.js`; lighthouse/shore/canal pools | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 25% |
| `enemy_lantern_moth` / Lantern Moth | `data.js`; lighthouse top pool | repeatable | base + dazzle-on-hit | `dazzleChance` generic branch | rejected | ordinary | Pass 4B: 40% landed-hit combat-only Dazzled accuracy penalty |
| `enemy_reed_grappler` / Reed Grappler | `data.js`; sluice pool, Labs | repeatable | base | observation/sprite only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_silt_lurker` / Silt Lurker | `data.js`; sluice pool, Labs | repeatable | base | observation/sprite only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_marsh_wisp_sluice_top` / Marsh Wisp | `data.js`; upper-sluice pool | repeatable | base | observation/sprite alias only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_sluice_slime` / Sluice Slime | `data.js`; upper-sluice pool, Labs | repeatable | base | observation/sprite only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_tallyman` / Tallyman | `data.js`; sealed-sluice rare pool | repeatable | base | opening-message ID branch only | rejected | ordinary | newly compatible; authored stats/rewards unchanged |
| `enemy_silt_crab` / Silt Crab | `data.js`; North Basin pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 20% |
| `enemy_mudflat_strider` / Mudflat Strider | `data.js`; North Basin pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_basin_gull` / Basin Gull | `data.js`; North Basin pool | repeatable | base + steal-and-flee | theft/flee generic branches | supported | ordinary | Pass 4C: gold theft, grace round and departure |
| `enemy_pale_drowned_gallery` / Pale Drowned | `data.js`; Gallery pool and trapped-Drowned starter | repeatable; separate reachable scripted route | base | trapped starter/finalizer is route-owned | rejected | ordinary | random template and authenticated trapped route compatible |
| `enemy_silt_hag_gallery` / Silt Hag | `data.js`; Gallery pool | repeatable | base | observation/sprite alias only | rejected | ordinary | newly compatible by capabilities |
| `enemy_silt_crab_upper` / Silt Crab | `data.js`; Upper Reach pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 20% |
| `enemy_basin_gull_upper` / Basin Gull | `data.js`; Upper Reach pool | repeatable | base + steal-and-flee | theft/flee generic branches | supported | ordinary | Pass 4C: gold theft, grace round and departure |
| `enemy_dust_drowned` / Dust-Drowned | `data.js`; Upper Reach pool | repeatable | base + curse-on-hit | `curseChance` generic branch | rejected | ordinary | Pass 4B: 20% landed-hit Curse, Amethyst Bangle ward preserved |
| `enemy_marrow_hulk` / Marrow Hulk | `data.js`; Upper Reach pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 25% |
| `enemy_silt_hag_vault` / Silt Hag | `data.js`; Mirethyst Vault pool | repeatable | base | observation/sprite alias only | rejected | ordinary | newly compatible by capabilities |
| `enemy_briar_warden` / Briar Warden | `combat.js`; Warden scripted starter | reachable scripted | base + Warden lifecycle | Warden activation/victory writers | rejected | scripted-only lifecycle | Pass 5 authenticated party route; legacy singleton preserved |
| `enemy_smuggler_guard` / Smuggler Guard | `combat.js`; fort guard starter | permanently completed before recruitment | base + fort lifecycle | fort sequence callbacks | rejected | scripted-only lifecycle | retained on mandatory pre-MQ5 singleton chain |
| `enemy_polwick` / Polwick | `combat.js`; fort Polwick starter | permanently completed before recruitment | base + fort lifecycle + firelit attack | Polwick fire/sequence branches | rejected | scripted-only lifecycle | retained on mandatory pre-MQ5 singleton chain |
| `enemy_essa` / Essa | `combat.js`; fort Essa starter | permanently completed before recruitment | base + fort lifecycle | fort completion writers | rejected | scripted-only lifecycle | retained on mandatory pre-MQ5 singleton chain |
| `enemy_pale_sentry` / Pale Sentry | `combat.js`; persistent Sentry starter | reachable scripted | base + persistent-HP lifecycle | Sentry HP/finalizer branches | rejected | scripted-only lifecycle | Pass 5 authenticated HP snapshot/writeback and outcome |
| `enemy_rainfish` / Rainfish | `data.js`; three-fight Still Water chain | reachable scripted | base + Rainfish chain | chain counter/wake finalizer | rejected | scripted-only lifecycle | Pass 5 authenticated separate-battle chain |
| `enemy_swamp_donkey` / Swamp Donkey | `data.js`; North Basin random override | repeatable | base | opening-message ID branch only | rejected | ordinary | newly compatible by capabilities |
| `enemy_takomo` / Takomo | `data.js`; Takomo scripted boss | reachable scripted | base + boss lock + Takomo lifecycle | Takomo outcome/reward writers | rejected | scripted-only lifecycle | Pass 5 authenticated route, legacy Run policy retained |
| `enemy_mulholland` / Mulholland | `data.js`; optional dungeon boss and Lab fixture | reachable scripted | base + boss lock | authored starter/finalizer route | compatible as explicit fixture | ordinary | Pass 5 authenticates the existing scripted route |
| `enemy_den_wraith` / Den Wraith | `data.js`; Den Wraith scripted starter | reachable scripted | base + curse-on-hit + Den lifecycle | curse plus quest finalizer | rejected | scripted-only lifecycle | Pass 5 authenticated route and quest finalizer |
| `enemy_kolm` / Kolm | `data.js`; sailor-brawl starter | reachable scripted | base + sailor-brawl lifecycle | stake/outcome writers | rejected | scripted-only lifecycle | Pass 5 stake/payout lifecycle |
| `enemy_wrongteeth` / Wrongteeth | `data.js`; optional dungeon boss | reachable scripted | base + boss lock + Wrongteeth lifecycle | defeat/hug/final reward flow | rejected | scripted-only lifecycle | Pass 5 authenticated knockdown; later choice unchanged |
| `enemy_lensweb_spider` / Lensweb Spider | `data.js`; lighthouse objective starter | reachable scripted | base + boss lock + Observe/Run lock + objective lifecycle | Observe-gated escape and lens finalizer | rejected | scripted-only lifecycle | Pass 5 Observe-gated party route and objective finalizer |
| `enemy_mimic_potion` / Mimic Potion | `data.js`; Gallery trap starter | reachable scripted | base + guaranteed drop + trap lifecycle | consumption/drop/finalizer branches | rejected | scripted-only lifecycle | Pass 5 sprung-trap and guaranteed-drop lifecycle |
| `enemy_road_impostor` / Road Impostor | `combat.js`; MQ5 Travellers' Rise fixed formation | reachable scripted | base + Travellers' Rise lifecycle | authenticated ambush staging/payment/outcome owner | new | scripted-only lifecycle | canonical fixed slot 0; ordinary attack and rewards |
| `enemy_bridled_hollow` / Bridled Hollow | `combat.js`; MQ5 Travellers' Rise fixed formation | reachable scripted | base + brace + Travellers' Rise lifecycle | authenticated ambush staging/payment/outcome owner | new | scripted-only lifecycle | canonical fixed slot 1; 20% established Brace |
| `enemy_fen_handler` / Fen Handler | `combat.js`; MQ5 Travellers' Rise fixed formation | reachable scripted | base + Travellers' Rise lifecycle | authenticated ambush staging/payment/outcome owner | new | scripted-only lifecycle | canonical fixed slot 2; Handler defeat does not alter Hollow |
| `enemy_gallery_receiver` / The Receiver | `combat.js`; mandatory Receiver Formation | permanently completed before recruitment | base + boss lock + Receiver coordination | Formation signals, staging and report | rejected | scripted-only lifecycle | retained exclusively on Receiver Formation path |
| `enemy_gallery_caller` / The Caller | `combat.js`; mandatory Receiver Formation | permanently completed before recruitment | base + Receiver coordination | Formation coordination branches | rejected | scripted-only lifecycle | retained exclusively on Receiver Formation path |
| `enemy_gallery_keeper` / The Keeper | `combat.js`; mandatory Receiver Formation | permanently completed before recruitment | base + Receiver coordination | Formation coordination branches | rejected | scripted-only lifecycle | retained exclusively on Receiver Formation path |
| `enemy_23` / 23 | `combat.js`; rare generated override | repeatable | base + generated stats | generation and opening-message branches | supported | ordinary | Pass 4C: authenticated generated record only |

## Reconciled totals

- Registered templates: **63**.
- Ordinary and capability-compatible: **45** — 22 Pass 3, eight Brace, seven status-special and eight unusual templates; generated 23 requires authenticated selection data.
- Scripted templates mechanically compatible behind exact lifecycle tokens: **12**.
- Total mechanically compatible: **57**.
- Special capability pending: **0** (23 at the Pass 3 checkpoint).
- Scripted-only lifecycle audit rows: **18** — twelve canonical routes (including the three-member Travellers' Rise formation) and six necessarily pre-recruitment legacy routes.
- Non-production/debug fixtures: **0**.
- Permanently completed before recruitment: **3** Receiver templates. This is a
  reachability subset, not a fifth mechanical category.

The isolated Eastern Fens records remain data-shape examples only. Mire Toad ×3
is structurally valid and mechanically supported after Pass 4C. Waspthra and Botfly are not registered templates,
so Waspthra ×1 and Botfly ×2 + Waspthra ×1 remain structural-only fixtures and
cannot pass runtime registration. No Eastern Fens production pool was added.

## Pass 4C legacy mechanic audit

This is an audit of the committed Pass 4B baseline, not a compatibility approval.
The eight templates are migrated in Pass 4C; the authority and approved translations
are documented in CANONICAL_PARTY_COMBAT.md.

| Templates | Actual authored mechanic | Legacy execution authority |
| --- | --- | --- |
| `enemy_the_seep` | Guaranteed separate smaller-Seep battle after parent victory; no split chance draw. | `startCombat`, `handleCombatAction` victory branch, `startSeepSplitCombat` |
| `enemy_rotwood_troll` | Up to 6 HP regeneration, with eligibility/amount captured when the legacy message queue is constructed; Trollbane suppresses the immediate response and three later regeneration checks. | `enemyRegenEntry`, item branch in `handleCombatAction`, suite 139 regeneration asymmetry sentinel |
| `enemy_thornback` | +90 DEF against melee Attack only; independent 90% additional counter check after the normal exchange, including a missed melee attempt. | Attack branch in `handleCombatAction`, suite 139 Thornback sentinel |
| `enemy_mire_toad_male` | 30% poison rider, hidden male identity, per-instance Observe progression, instant defeat by Jackbane. | `applyEnemyHitEffects`, `getObservationText`, reagent item branch |
| `enemy_mire_toad_female` | Same poison and observation contracts; hidden female identity, instant defeat by Henbane. | Same authorities; distinct authored `sex` |
| `enemy_basin_gull` | First landed hit steals 20–50 gold, capped by the purse; one subsequent player turn before flight; killing it returns its stolen gold. | `applyEnemyHitEffects`, `advanceCombatMessage`, `applyKillRewards` |
| `enemy_basin_gull_upper` | Identical theft/flight mechanic and stats to the other Gull variant. | Same authorities; independent registered template |
| `enemy_23` | Rare selection override generates seven values exactly once using `23 * ceil(random * 23)`. | `startCombat`, `startCanonicalPartyEncounter`, registered inline descriptor, suite 56 |

### Seep: approved separate-battle migration

The parent starts with 40 HP and `splits:true`. Its defeat pays the usual authored
170 XP, 35–62 gold and ordinary Potion chance. At victory acknowledgement the
legacy handler validates the successor, ends combat and presents the existing
split dialogue. Closing that dialogue starts a new enemy instance with 20 HP,
20 XP and 0–3 gold; ATK 45, DEF 0 and SPD 18 remain unchanged. The successor has
zero remaining splits. Defeat or escape does not initiate a successor. The split
itself consumes no RNG; normal reward draws belong to each separately completed
battle. This is a real new combatant, not a follow-up damage action.

The user approved preserving separate follow-up battles in Pass 4C and using the
established Guard → Polwick → Essa handoff pattern where applicable. Suite 143
checks that prior enemy callbacks become stale across that chain. Canonical
handoffs must retain their own authenticated encounter owner; the gang's singleton
starters and quest outcomes remain guarded. Same-slot, round-boundary enemy
replacement is a deliberate future extension, not part of this migration.

### Troll: regeneration and Trollbane

`enemyRegenEntry` samples `min(6, maxHp - hp)` while constructing the response
queue. Its eventual callback heals only a surviving exact enemy and clamps to
max HP. There is no regeneration RNG. Pending victory suppresses the factory;
Attack, Observe and ordinary spent-item paths reach it, while Run does not.

Timing is materially different from simply healing at round end: suite 139 proves
that a full-HP Troll hit in a player-first exchange heals 6 HP, whereas an
enemy-first exchange omits the heal because player damage was still deferred when
eligibility was sampled. This is explicitly labelled a preserved suspected defect
in the test. A multi-actor round needs an approved sampling boundary; neither the
code nor that singleton test establishes one for several allied actions.

Trollbane is consumed even on a non-regenerating target, where it has no effect.
On a regenerating target it suppresses that turn's response and sets three heal
suppression turns. The item-use branch skips its normal end-of-turn factories, so
the application does not decrement the new counter. Later regeneration-eligible
turns decrement it even at full HP. It does not generally suppress attacks on
those later turns. This state is battle-only and must be per enemy instance.

### Thornback: armor and counter

The authored +90 melee armor is added to DEF before the ordinary melee damage
formula, variance and critical. Offensive throwables and Bomb damage use ordinary
DEF or their existing ignore-DEF behavior and bypass that extra armor. The
existing Curse, evasion and Bullet Time rules still apply through their existing
owners; the extra armor is not a blanket damage reduction.

The counter is additional to the normal trade, checked only for melee Attack when
victory/defeat is not already pending. It can occur even if the melee attempt
missed. It uses one 90% decision draw; success then consumes variance, critical and
player-evasion draws. It targets the triggering attacker and does not apply the
ordinary landed-hit rider function. A lethal melee outcome suppresses the counter
check. The legacy suite 139 representative exchange uses eleven total draws
(seven for the normal trade plus four for a successful counter). `thornsReflect`
is a separate generic legacy branch and is not authored on this template.

### Mire Toads: poison, Observe and reagents

Both templates use a 30% poison check after a landed hit, only while the target is
not already poisoned. Fen Mask wards application after a successful check;
existing cures and poison persistence remain authoritative. Pass 4C must compose
this with the supported poison application behavior rather than duplicate it.

The first Observe reveals the exact instance's sex; the second identifies its
matching reagent; later observations use the existing flavour text. The runtime
`observeCount` belongs to that exact enemy. Neither the shared name nor sprite
reveals sex. Jackbane matches male; Henbane matches female. Reagents consume one
item whether matching, mismatched or used on an unsexed enemy. Matching immediately
sets the target's HP to zero and prevents its response. There is no required
prior-Observe gate and no reagent RNG. The migration must retain that distinction
between discovering the answer and being allowed to try a reagent.

### Basin Gulls: gold, grace turn and flight

The first landed hit consumes one theft amount draw, `20 + floor(random * 31)`,
then takes the lesser of that amount and current gold. Even an empty purse arms
flight and consumes the draw. There is no probability gate and no inventory item
selection, so key items, equipment and reserved consumables are not theft targets.

The end of that exchange changes the private state from `armed` to `flee`.
After the next spent player turn, a surviving Gull departs, with victory and
defeat checked first. Departure grants no singleton encounter rewards and does
not recover stolen gold. Killing the Gull returns its own stolen amount in
addition to normal rewards. Later hits do not steal again. Escape/cleanup clears
battle-local theft state without refunding it. No departure RNG is consumed.

The user approved one complete subsequent party round as the grace unit, and
rewards only for defeated enemies when mixed-formation departure resolves the battle. Mixed formations
must retain departed slots and the existing outcome/reward constraints; this audit
does not authorize a new universal reward policy.

### Generated 23: selection and provenance

The existing selector draws the ordinary pool entry, the optional North Basin
Donkey override, then the independent 1/256 override. On success it draws seven
values in order: HP, gold A, gold B, ATK, DEF, SPD, XP. HP is also max HP and gold
bounds are sorted. Each value uses `23 * ceil(random * 23)`; an exact zero roll
therefore yields zero. Canonical validation must reject unsafe actual actors
without clamping or rerolling; singleton generation must remain unchanged.

The registry entry is an inline identity descriptor, not a stat-bearing template.
Canonical support requires private provenance for the selected generated record,
one-time generation and snapshotted values throughout installation and playback.
Copying a template-shaped object is not authentication. Rendering already has
`drawBattle23`; observation uses the established fallback for the instance's
actual stats. No new pool entry or fixed stat template is authorized.

### Approved canonical translations

The user chose round-end HP for Troll regeneration, immediate per-attacker
Thornback counters, one full subsequent party round for Gull flight, and defeated-
enemy-only rewards after mixed departure. Singleton traces retain their original
timing. Seep stays a separate authenticated battle. See the current Pass 4C
contract in CANONICAL_PARTY_COMBAT.md for state, events, RNG and verification.
