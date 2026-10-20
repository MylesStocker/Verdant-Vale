# Enemy capability audit

Pass 3 audited the 60 exact identities in `ENEMY_TEMPLATE_REGISTRY`. Pass 4A adds
Brace to the supported mechanics; the eight migrated rows below are now ordinary
under the implemented capability contract. Mechanical
classification and post-MQ5 reachability are separate: an ordinary template may
still have a scripted starter whose outcome lifecycle remains unsupported, and a
mandatory pre-MQ5 encounter may still require mechanics that the legacy Formation
engine owns.

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
`standard_observe`, `standard_rewards`, `boss_escape_lock`, and `brace`. Compatibility means
that every derived requirement is in that mechanic registry. It never means that
an enemy ID is present in an approval list.

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
| `enemy_shade_wraith` / Shade Wraith | `data.js`; first dungeon pool | repeatable | base + slither-on-hit | explicit hit-effect ID branch | rejected | special capability pending | defer Slither infliction |
| `enemy_crypt_fiend` / Crypt Fiend | `data.js`; second dungeon pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_void_walker` / Void Walker | `data.js`; second dungeon pool | repeatable | base + curse-on-hit + shard burst | explicit shard-burst ID branch | rejected | special capability pending | defer curse and shard burst |
| `enemy_hollow` / Hollow | `data.js`; deep-dungeon pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 20% |
| `enemy_fen_shade` / Fen Shade | `data.js`; deep-dungeon pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_tomb_sentry` / Tomb Sentry | `data.js`; floor-eight pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 30% |
| `enemy_crypt_revenant` / Crypt Revenant | `data.js`; floor-eight pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_wall_tendril` / Wall Tendril | `data.js`; horror pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_dripping_maw` / Dripping Maw | `data.js`; horror pool | repeatable | base + acid corrosion | `acidChance` generic branch | rejected | special capability pending | defer Corroded handling |
| `enemy_the_seep` / The Seep | `data.js`; horror pool and split follow-up | repeatable | base + split follow-up | split starter/finalizer | rejected | special capability pending | defer sequential split lifecycle |
| `enemy_fen_lurker` / Fen Lurker | `data.js`; far-world pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_rotwood_troll` / Rotwood Troll | `data.js`; far-world pool | repeatable | base + regeneration | `regenPerTurn` generic branch | rejected | special capability pending | defer regeneration |
| `enemy_thornback` / Thornback | `data.js`; far-world pool | repeatable | base + melee armor + counterattack | armor/counter generic branches | rejected | special capability pending | defer projectile puzzle mechanics |
| `enemy_fen_witch` / Fen Witch | `data.js`; far-world pool | repeatable | base + poison spell | explicit hit-effect ID branch | rejected | special capability pending | defer poison spell |
| `enemy_bog_serpent` / Bog Serpent | `data.js`; far-world pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_mire_toad_male` / Mire Toad | `data.js`; far/basin/upper pools and spawning site | repeatable | base + poison-on-hit + sex/reagent observation | sex-specific Observe/reagent and poison branches | rejected | special capability pending | defer per-instance reagent/observation mechanic |
| `enemy_mire_toad_female` / Mire Toad | `data.js`; far/basin/upper pools and spawning site | repeatable | base + poison-on-hit + sex/reagent observation | sex-specific Observe/reagent and poison branches | rejected | special capability pending | defer per-instance reagent/observation mechanic |
| `enemy_corpse_slug` / Corpse Slug | `data.js`; Thornmere pools | repeatable | base + slither-on-hit | explicit hit-effect ID branch | rejected | special capability pending | defer Slither infliction |
| `enemy_marsh_rat` / Marsh Rat | `data.js`; lighthouse/shore/canal pools | repeatable | base | sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_shallows_skitter` / Shallows Skitter | `data.js`; lighthouse/shore/canal pools | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 25% |
| `enemy_lantern_moth` / Lantern Moth | `data.js`; lighthouse top pool | repeatable | base + dazzle-on-hit | `dazzleChance` generic branch | rejected | special capability pending | defer Dazzled infliction |
| `enemy_reed_grappler` / Reed Grappler | `data.js`; sluice pool, Labs | repeatable | base | observation/sprite only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_silt_lurker` / Silt Lurker | `data.js`; sluice pool, Labs | repeatable | base | observation/sprite only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_marsh_wisp_sluice_top` / Marsh Wisp | `data.js`; upper-sluice pool | repeatable | base | observation/sprite alias only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_sluice_slime` / Sluice Slime | `data.js`; upper-sluice pool, Labs | repeatable | base | observation/sprite only | compatible | ordinary | capability-derived compatibility retained |
| `enemy_tallyman` / Tallyman | `data.js`; sealed-sluice rare pool | repeatable | base | opening-message ID branch only | rejected | ordinary | newly compatible; authored stats/rewards unchanged |
| `enemy_silt_crab` / Silt Crab | `data.js`; North Basin pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 20% |
| `enemy_mudflat_strider` / Mudflat Strider | `data.js`; North Basin pool | repeatable | base | observation/sprite only | rejected | ordinary | newly compatible by capabilities |
| `enemy_basin_gull` / Basin Gull | `data.js`; North Basin pool | repeatable | base + steal-and-flee | theft/flee generic branches | rejected | special capability pending | defer stolen-gold lifecycle |
| `enemy_pale_drowned_gallery` / Pale Drowned | `data.js`; Gallery pool and trapped-Drowned starter | repeatable; separate reachable scripted route | base | trapped starter/finalizer is route-owned | rejected | ordinary | random template newly compatible; trapped route remains deferred to Pass 5 |
| `enemy_silt_hag_gallery` / Silt Hag | `data.js`; Gallery pool | repeatable | base | observation/sprite alias only | rejected | ordinary | newly compatible by capabilities |
| `enemy_silt_crab_upper` / Silt Crab | `data.js`; Upper Reach pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 20% |
| `enemy_basin_gull_upper` / Basin Gull | `data.js`; Upper Reach pool | repeatable | base + steal-and-flee | theft/flee generic branches | rejected | special capability pending | defer stolen-gold lifecycle |
| `enemy_dust_drowned` / Dust-Drowned | `data.js`; Upper Reach pool | repeatable | base + curse-on-hit | `curseChance` generic branch | rejected | special capability pending | defer Curse infliction |
| `enemy_marrow_hulk` / Marrow Hulk | `data.js`; Upper Reach pool | repeatable | base + brace | `defendChance` generic branch | rejected | ordinary | Pass 4A: Brace migrated, 25% |
| `enemy_silt_hag_vault` / Silt Hag | `data.js`; Mirethyst Vault pool | repeatable | base | observation/sprite alias only | rejected | ordinary | newly compatible by capabilities |
| `enemy_briar_warden` / Briar Warden | `combat.js`; Warden scripted starter | reachable scripted | base + Warden lifecycle | Warden activation/victory writers | rejected | scripted-only lifecycle | defer bespoke outcome to Pass 5 |
| `enemy_smuggler_guard` / Smuggler Guard | `combat.js`; fort guard starter | reachable scripted | base + fort lifecycle | fort sequence callbacks | rejected | scripted-only lifecycle | defer fort outcome chain |
| `enemy_polwick` / Polwick | `combat.js`; fort Polwick starter | reachable scripted | base + fort lifecycle + firelit attack | Polwick fire/sequence branches | rejected | scripted-only lifecycle | defer fire attack and fort outcome |
| `enemy_essa` / Essa | `combat.js`; fort Essa starter | reachable scripted | base + fort lifecycle | fort completion writers | rejected | scripted-only lifecycle | defer fort outcome chain |
| `enemy_pale_sentry` / Pale Sentry | `combat.js`; persistent Sentry starter | reachable scripted | base + persistent-HP lifecycle | Sentry HP/finalizer branches | rejected | scripted-only lifecycle | defer persistent HP/outcome |
| `enemy_rainfish` / Rainfish | `data.js`; three-fight Still Water chain | reachable scripted | base + Rainfish chain | chain counter/wake finalizer | rejected | scripted-only lifecycle | defer chained encounter lifecycle |
| `enemy_swamp_donkey` / Swamp Donkey | `data.js`; North Basin random override | repeatable | base | opening-message ID branch only | rejected | ordinary | newly compatible by capabilities |
| `enemy_takomo` / Takomo | `data.js`; Takomo scripted boss | reachable scripted | base + boss lock + Takomo lifecycle | Takomo outcome/reward writers | rejected | scripted-only lifecycle | defer authored boss outcome |
| `enemy_mulholland` / Mulholland | `data.js`; optional dungeon boss and Lab fixture | reachable scripted | base + boss lock | authored starter/finalizer route | compatible as explicit fixture | ordinary | capability-derived template support; scripted route remains deferred |
| `enemy_den_wraith` / Den Wraith | `data.js`; Den Wraith scripted starter | reachable scripted | base + curse-on-hit + Den lifecycle | curse plus quest finalizer | rejected | scripted-only lifecycle | defer status and outcome |
| `enemy_kolm` / Kolm | `data.js`; sailor-brawl starter | reachable scripted | base + sailor-brawl lifecycle | stake/outcome writers | rejected | scripted-only lifecycle | defer brawl outcome |
| `enemy_wrongteeth` / Wrongteeth | `data.js`; optional dungeon boss | reachable scripted | base + boss lock + Wrongteeth lifecycle | defeat/hug/final reward flow | rejected | scripted-only lifecycle | defer authored boss outcome |
| `enemy_lensweb_spider` / Lensweb Spider | `data.js`; lighthouse objective starter | reachable scripted | base + boss lock + Observe/Run lock + objective lifecycle | Observe-gated escape and lens finalizer | rejected | scripted-only lifecycle | defer bespoke Run and objective outcome |
| `enemy_mimic_potion` / Mimic Potion | `data.js`; Gallery trap starter | reachable scripted | base + guaranteed drop + trap lifecycle | consumption/drop/finalizer branches | rejected | scripted-only lifecycle | defer guaranteed drop and trap outcome |
| `enemy_gallery_receiver` / The Receiver | `combat.js`; mandatory Receiver Formation | permanently completed before recruitment | base + boss lock + Receiver coordination | Formation signals, staging and report | rejected | scripted-only lifecycle | retained exclusively on Receiver Formation path |
| `enemy_gallery_caller` / The Caller | `combat.js`; mandatory Receiver Formation | permanently completed before recruitment | base + Receiver coordination | Formation coordination branches | rejected | scripted-only lifecycle | retained exclusively on Receiver Formation path |
| `enemy_gallery_keeper` / The Keeper | `combat.js`; mandatory Receiver Formation | permanently completed before recruitment | base + Receiver coordination | Formation coordination branches | rejected | scripted-only lifecycle | retained exclusively on Receiver Formation path |
| `enemy_23` / 23 | `combat.js`; rare generated override | repeatable | base + generated stats | generation and opening-message branches | rejected | special capability pending | registry sentinel cannot authorize selected runtime stats; defer generated-instance contract |

## Reconciled totals

- Registered templates: **60**.
- Ordinary and capability-compatible: **30** — the 22 Pass 3 templates plus
  the eight Brace-family templates. No other capability was migrated.
- Special capability pending: **15** (23 at the Pass 3 checkpoint).
- Scripted-only lifecycle: **15**.
- Non-production/debug fixtures: **0**.
- Permanently completed before recruitment: **3** Receiver templates. This is a
  reachability subset, not a fifth mechanical category.

The isolated Eastern Fens records remain data-shape examples only. Mire Toad ×3
is structurally valid but capability-blocked by `poison_on_hit` and
`mire_toad_reagent_observation`. Waspthra and Botfly are not registered templates,
so Waspthra ×1 and Botfly ×2 + Waspthra ×1 remain structural-only fixtures and
cannot pass runtime registration. No Eastern Fens production pool was added.
