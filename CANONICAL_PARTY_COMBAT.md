# Canonical party combat integration review

Pass 2 is checkpointed at `5a26974ab277cfd5bdbf8d30031f6b9520d08c`
(`feat(combat): add canonical battle envelope`). Pass 3 is the current unstaged,
uncommitted increment on `agent/codex`. No push, merge, rebase, main modification
or other worktree modification was performed. Earlier integration inventories
below are retained as historical evidence and are explicitly labelled.

## Pass 2 structural envelope

The explicit canonical API represents 1–3 authored allies against 1–3 approved
enemies. All nine size combinations pass suite 185. Normal routing is unchanged:
one-member gameplay stays singleton, recruited supported encounters stay canonical,
Receiver stays Formation. No third canonical member or new geographic route exists.

Read-only `preparePlayerSide({escape})` uses persistent-party canonical ownership;
`prepareEnemySide(enemies)` validates ordered registered IDs/exact template data
without inspecting the roster. `prepare({enemies,escape})` produces a recursively
frozen combined plan after cross-side arithmetic, safe cumulative weights, owner,
reward and cleanup checks. Preparing allocates no identities and consumes no RNG.
`enter` rechecks current state rather than trusting a supplied prior plan. Slots
are fixed; Fallen members retain them. Runtime IDs are unique per instance and
fresh on later encounters. Duplicate names retain slot-based A/B/C presentation.
Lely still writes through stats/status/equipment authorities; companions through
persistentParty; shared inventory and authenticated outcomes retain one-time
writeback/reward semantics. No persistent schema or ownership changes were made.

The exact formation schema, shorthand and validation boundaries are documented in
[architecture.md](architecture.md#structural-canonical-battle-envelope--pass-2).
An authored formation is frozen `{id, enemies: Object.freeze([...]), weight}`.
One to three ordered registered IDs map directly to enemy slots. Positive safe
integer weights have a safe total; authored IDs are unique. Existing exact template
objects normalize to one-enemy formations at weight 1 and retain repeated entries.
The whole table validates before one selection draw. Legacy flat tables retain
`floor(roll*length)`; explicit weighted tables use cumulative half-open intervals.
The existing normal-game pool selector and separate rare-23 override are untouched.
No explicit formations are added to production geographic pools in this pass.

Test-only intended formations:

| Composition | Shape | Registration/runtime status |
| --- | --- | --- |
| Mire Toad ×3 | Valid | Uses registered male Toad ID three times; poison/sex mechanics remain blocked. |
| Waspthra ×1 | Valid | `enemy_waspthra` is a fixture spelling, not an assigned production ID; template absent, rejects. |
| Botfly ×2 + Waspthra ×1 | Valid | `enemy_botfly` and `enemy_waspthra` are fixture spellings; templates absent, reject. |

Execution tests use approved duplicate Marsh Wisps. No enemy mechanics, stats or
templates were invented. Pass 3 subsequently migrates ordinary enemies by
capability; special instance mechanics and content activation remain deferred.

Resonance definitions add frozen nonempty unique `elements` arrays. Quickbloom is
`['bloommarked']`, separately from its Bloommarked affinity requirement. `firelit`
is a valid future element identifier; no Firelit technique/item is implemented.
Future elemental modifiers match static technique elements rather than caster or
technique IDs. Healing, Strain, RNG and combat-result/playback schemas are unchanged.
Suite 180's synthetic definition inputs were updated only for this required field.

Verification: full regression 185/185 (Pass 2 baseline 184/184), 0 validation
errors / 4 established warnings, 107 fingerprints, exact committed transition
audit, SAVE_VERSION 5. Historical evidence remains byte-identical:

| Projection | Count | SHA-256 |
| --- | --- | --- |
| Singleton | 52 traces / 387 checkpoints / 482 RNG values | `2034f8f2639c78e6d8b69d4d25a47f7d9e8ec53548f4227376faa30a8b288a66` |
| Formation | 133 captures | `403050ca0c4c346ad886eff4f2083736103bdb93aa50d387761b5d5215e6e36e` |
| Party Attack | 586 captures | `b97f7bdc7c8012218a32c663d3a2b52a9f61e1c826993d40e956dc03caa13d8f` |
| Generalized commands | 1,271 captures | `b084ef1cfd7a1694a7a5a0a63c0267fd8a0c12368861a56f6542edb34548e4ea` |

An additional Pass 1/Pass 2 comparison of suite 180's 130 Resonance result/playback
captures is identical: `026f44f41da431c818e33de08fe2679065cd461d9a2d638627b7b6ba0a168f74`.
The only intended static definition-shape extension is `elements`; no historical
combat-result or event field changes. Suite 185 contains 30 checks, including
the nine size combinations. The focused verification run covers 43 suites.

No transition/fingerprint artifact was regenerated. No browser testing was
performed; this pass adds no visible production route. Optional smoke review:
pre-MQ5 singleton, post-MQ5 supported encounter and all commands, Quickbloom's
recovery round, victory/escape/defeat persistence and save/load, both Labs and
Receiver. The third member and explicit formation examples remain headless-only.

## Pass 3 ordinary-enemy capability migration

The registry still contains 60 exact templates. The complete evidence table is
[ENEMY_CAPABILITY_AUDIT.md](ENEMY_CAPABILITY_AUDIT.md): 22 templates are ordinary
and compatible, 23 require unsupported mechanics, and 15 belong to scripted-only
lifecycles. Thirteen ordinary templates that the old identity list rejected now
work in canonical combat. All 22 ordinary templates prepare against one, two and
three canonical members and can occupy one, two or three stable enemy slots,
including duplicates and mixed formations. Pools, weights and enemy counts remain
unchanged; this authorizes existing single-enemy routing only.

`enemy-capabilities.js` derives a frozen record with exactly `templateId` and
`capabilities` for every registered template. Canonical support is the closed
mechanic set `basic_attack`, `standard_observe`, `standard_rewards`, and
`boss_escape_lock`. Field-backed requirements and the audited hidden legacy
branches are combined before compatibility is decided. Unknown fields or
capabilities, missing ordinary data, accessors, custom prototypes, duplicates and
non-exact identities fail closed. `PARTY_ATTACK_TEMPLATE_IDS` has been removed;
template identity establishes registration only and never mechanic approval.
`FORMATION_STATE_TEMPLATE_IDS` remains solely for the older Formation/Receiver
constructor and is not read by canonical preparation.

Special mechanics remain explicit rejections, including brace, Curse/Corroded/
Slither/Dazzled infliction, Void Walker shard burst, split follow-up, regeneration,
melee armor/counterattack, Mire Toad reagent state, theft-and-flight, generated 23
stats, and every scripted lifecycle listed in the audit. The trapped Pale Drowned
template is ordinary in geographic pools; its separate trapped-Drowned starter
remains guarded as scripted content. Mulholland's template retains metadata-driven
boss escape lock; its authored boss outcome also remains guarded.

Ordinary party rendering keeps each registered singleton sprite and uses a shared
conservative layout envelope when the legacy Formation renderer has no measured
bounds. Stable slots, A/B/C duplicate labels, independent HP/Observe state,
historical defeated actors and exact runtime targeting remain unchanged. Test 186
also proves a synthetic registered ordinary template is accepted from capabilities
without adding its ID to any authority.

Verification: suite 186 has 17 grouped checks; 43 focused suites and the complete
186/186 regression pass. Validation reports 60 capability records, 0 errors and
the four established warnings. All 107 regional fingerprints and the read-only
transition audit match their committed artifacts. Singleton (52 traces / 387
checkpoints / 482 RNG values), Formation (133), party Attack (586), generalized
commands (1,271) and Resonance (130) retain the exact digests recorded above.
`SAVE_VERSION` remains 5. Browser testing was not performed.

## Original integration baseline and scope (historical)

- Before synchronization: `225620231cd2a58716fbaaf4ccb71c967fbbaa89`.
- Synchronized baseline and final HEAD: `3d5413a8b3094070da503c5cb05c0a689b4c92b5`.
- Local main advanced during implementation to
  `4a09ee2fe3235de5dcecf462a77b8e343e31781b` (freshwater canon/text correction
  in LORE.md and eastern-fens-maps.js). That later commit was not imported;
  verification describes the recorded synchronized baseline plus this working diff.
- The worktree was clean; the original Codex HEAD was an ancestor of local main.
  Synchronization used `git merge --ff-only main`; baseline regression: 182/182.
- Existing 181 and 182 were preserved. With approval, the new suite is
  `test/cases/183-canonical-party-combat-integration.test.js`.
- No gameplay data, maps, terrain, dialogue, quests, rewards, balance or persistent
  schema changed. SAVE_VERSION remains 5. No generated artifact was regenerated.

## Encounter compatibility inventory before Pass 3 (historical)

This table records the identity-list checkpoint before capability migration. It is
superseded by [ENEMY_CAPABILITY_AUDIT.md](ENEMY_CAPABILITY_AUDIT.md) and is retained
only to show which ordinary templates moved from review-needed to compatible.

The runtime registry has 60 unique template IDs. This inventory is audit
evidence, not a second runtime registry: 9 supported templates
(eight ordinary, plus the explicit Mulholland boss-lock fixture),
16 requiring bounded adaptation, and 35 unsupported/bespoke.
Only the approved eight ordinary templates route automatically. A basic stat block
does not confer capability approval or authorize a scripted quest outcome.

| Template | Classification | Capability / boundary |
| --- | --- | --- |
| `enemy_marsh_wisp` | Compatible | Ordinary Attack/Observe/Run and shared rewards; approved sprite bounds. |
| `enemy_stone_crawler` | Unsupported/bespoke | defendChance |
| `enemy_briar_hound` | Compatible | Ordinary Attack/Observe/Run and shared rewards; approved sprite bounds. |
| `enemy_marsh_wisp_early` | Compatible | Ordinary Attack/Observe/Run and shared rewards; approved sprite bounds. |
| `enemy_briar_hound_early` | Compatible | Ordinary Attack/Observe/Run and shared rewards; approved sprite bounds. |
| `enemy_bone_guard` | Unsupported/bespoke | defendChance |
| `enemy_shade_wraith` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_crypt_fiend` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_void_walker` | Unsupported/bespoke | curseChance |
| `enemy_hollow` | Unsupported/bespoke | defendChance |
| `enemy_fen_shade` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_tomb_sentry` | Unsupported/bespoke | defendChance |
| `enemy_crypt_revenant` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_wall_tendril` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_dripping_maw` | Unsupported/bespoke | acidChance |
| `enemy_the_seep` | Unsupported/bespoke | splits |
| `enemy_fen_lurker` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_rotwood_troll` | Unsupported/bespoke | regenPerTurn |
| `enemy_thornback` | Unsupported/bespoke | meleeArmor, counterChance |
| `enemy_fen_witch` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_bog_serpent` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_mire_toad_male` | Unsupported/bespoke | poisonChance, sex |
| `enemy_mire_toad_female` | Unsupported/bespoke | poisonChance, sex |
| `enemy_corpse_slug` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_marsh_rat` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_shallows_skitter` | Unsupported/bespoke | defendChance |
| `enemy_lantern_moth` | Unsupported/bespoke | dazzleChance |
| `enemy_reed_grappler` | Compatible | Ordinary Attack/Observe/Run and shared rewards; approved sprite bounds. |
| `enemy_silt_lurker` | Compatible | Ordinary Attack/Observe/Run and shared rewards; approved sprite bounds. |
| `enemy_marsh_wisp_sluice_top` | Compatible | Ordinary Attack/Observe/Run and shared rewards; approved sprite bounds. |
| `enemy_sluice_slime` | Compatible | Ordinary Attack/Observe/Run and shared rewards; approved sprite bounds. |
| `enemy_tallyman` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_silt_crab` | Unsupported/bespoke | defendChance |
| `enemy_mudflat_strider` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_basin_gull` | Unsupported/bespoke | stealAndFlee |
| `enemy_pale_drowned_gallery` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. Trapped-Drowned interaction is a separate bespoke entry. |
| `enemy_silt_hag_gallery` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_silt_crab_upper` | Unsupported/bespoke | defendChance |
| `enemy_basin_gull_upper` | Unsupported/bespoke | stealAndFlee |
| `enemy_dust_drowned` | Unsupported/bespoke | curseChance |
| `enemy_marrow_hulk` | Unsupported/bespoke | defendChance |
| `enemy_silt_hag_vault` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_briar_warden` | Unsupported/bespoke | Warden quest completion |
| `enemy_smuggler_guard` | Unsupported/bespoke | fort sequence handoff |
| `enemy_polwick` | Unsupported/bespoke | Polwick fire and fort sequence |
| `enemy_essa` | Unsupported/bespoke | fort completion and quest flags |
| `enemy_pale_sentry` | Unsupported/bespoke | persistent HP and contract completion |
| `enemy_rainfish` | Unsupported/bespoke | three-fight chain |
| `enemy_swamp_donkey` | Bounded adaptation needed | Basic stats only; party capability approval and sprite-bound audit still required. |
| `enemy_takomo` | Unsupported/bespoke | scripted boss outcome |
| `enemy_mulholland` | Compatible | Explicit single-enemy template only; boss lock retained. Authored Mulholland quest encounter remains unsupported. |
| `enemy_den_wraith` | Unsupported/bespoke | curse and scripted outcome |
| `enemy_kolm` | Unsupported/bespoke | sailor-brawl outcome |
| `enemy_wrongteeth` | Unsupported/bespoke | dungeon boss outcome |
| `enemy_lensweb_spider` | Unsupported/bespoke | Observe unlock, Run lock, pending objective reward |
| `enemy_mimic_potion` | Unsupported/bespoke | guaranteed item replaces potion roll |
| `enemy_gallery_receiver` | Unsupported/bespoke | Receiver coordination and story lifecycle |
| `enemy_gallery_caller` | Unsupported/bespoke | Receiver coordination |
| `enemy_gallery_keeper` | Unsupported/bespoke | Receiver coordination |
| `enemy_23` | Unsupported/bespoke | generated stats and inline encounter identity |

Ordinary pools remain unchanged. Geographic selection, the North Basin Swamp
Donkey override and rare generated 23 retain their existing selection rolls.
Selection occurs before the canonical entry boundary, as approved. Unsupported
selections then throw a precise diagnostic before combat RNG, runtime identity
allocation, or gameplay mutation; there is no solo fallback or capability removal.
The 23 generation rolls are selection rolls, not battle-resolution rolls.

Every existing scripted singleton starter has a roster guard, including Seep
follow-up, Rainfish, spawning toads, dungeon boss, Warden, all three fort fights,
Mulholland, Den Wraith, sailor brawl, Takomo, Mimic, Lensweb and trapped Drowned.
Pale Sentry's persistent-HP override is rejected before selection. Pass 1 now adds
read-only scripted preparation and caller guards before combat-specific staging,
choice/queue consumption or activation. Drowned slain state waits for authenticated
victory; fort arrest, Kolm stake, Mimic consumption and Rainfish wake state wait for
successful activation. Exact-enemy reward receipts and outcome checks preserve
idempotence. Valid singleton combat captures remain unchanged. See the complete
[15-starter plus Sentry lifecycle audit](SCRIPTED_COMBAT_ENTRY_AUDIT.md) and suite
184. These corrections do not approve any additional canonical-party template.

The Receiver retains its pre-MQ5 Formation path. Both Labs retain their existing
temporary profiles, inventory, cleanup and refund contracts. All three reject
entry while a canonical encounter (including a retained fault) owns combat.
No Eastern Fens pools, scripted escort, campfire, Cardenport, or new content was added.

## State and lifecycle authorities

`canonicalPartyCombat.enter({enemies, escape})` accepts one to three template IDs
or exact template-shaped instances. Existing runtime IDs, altered templates,
accessors, unsupported fields/capabilities, unsafe arithmetic and unsupported
policies reject. Current structural group support covers all 22 capability-compatible
ordinary templates. Policies are `fastest_living` and `blocked`,
with the existing immutable boss lock additionally enforced.

`persistentParty.validateCombat()` performs the same private bridge validation
without installation. Entry validates canonical member state, inventory, equipment,
statuses, Rareborn bindings, arithmetic, reward capacity, cleanup fields and defeat
destination before allocating any identity. Authenticated completed solo handoffs
are validated through the existing Formation entry authority and normalized only
after all checks pass.

| State | Import and final writeback authority |
| --- | --- |
| Membership | `persistentParty` ordered canonical roster, including Fallen members |
| Lely HP/base stats/progression/equipment | Existing `stats`; no second persistent Lely record |
| Lely statuses / Slither | `statusEffects` and `slitherSpd` |
| Esla HP/level/XP/statuses/equipment | Private personal record in `persistentParty` |
| Rareborn metadata | `PERSISTENT_CHARACTER_DEFINITIONS` via existing Resonance binding validator |
| Shared inventory / gold | `stats.items` / `stats.gold` |
| Runtime commands, targets, effects, reservations | Generalized party resolver and standard session controller |
| Authenticated terminal commitment | `persistentParty.commitCombat()`, private bridge ticket and canonical-state seal |
| XP and shared rewards | `persistentParty.awardRewards()`; original Lely `checkLevelUp()`, existing Esla progression |
| Full-party recovery | `persistentParty.recover()` |
| Defeat day/gold/location consequences | Shared `applyCombatDefeatWorldRecovery()` |

Canonical resources remain unchanged during commands and historical playback.
The bridge commits completed actions once at terminal acknowledgement; repeated
acknowledgements cannot reapply them. Victory revives Fallen members to 1 HP under
the existing lifecycle policy, grants full encounter XP to every starting member,
and rolls shared gold and the existing 12% Potion drop once per defeated enemy.
Party size never multiplies shared rewards. Reward receipts use the existing
persistent ledger; runtime combat identities do not enter it.

Escape grants no rewards and preserves committed HP, statuses, inventory and
equipment. Defeat requires all members Fallen, restores every member, preserves
membership, removes gold, advances one day and applies the existing home/stay
recovery choice. Canonical outcomes never call singleton `endCombat()` or
`recoverCombatDefeat()`. A failed recovery transition is diagnosed rather than
treated as successful cleanup.

A resolution or finalization error retains its stage, session evidence and any
completed writeback, prohibits retry and blocks simulation, save/load and other
combat owners. RNG is never refunded. Reloading the page from an earlier valid
save is the recovery route for a development fault.

## Presentation and input

`render-party-battle.js` receives one recursively frozen view and owns no combat
lifecycle. The Lab wrapper supplies its own view; canonical rendering supplies its
own. Ally x positions remain 108, 256 and 404. Enemy slots, historical HP, cursors,
command styling and playback presentation are preserved.

Lely has Attack / Item / Observe / Run. Esla additionally has Resonance, with
Quickbloom and the existing one-round Strain rule. No combined production technique
exists. Input reuses the physical key latch and existing listener: arrows/WASD
navigate, Enter/Space confirms, Escape/B cancels or backtracks. A completed terminal
screen is confirmed once more to commit and return to the world; cancellation
cannot refund a real encounter.

`combat.active` retains its singleton/Receiver contract. Canonical activity has
an explicit owner, and input, simulation, save/load and rendering consult that
owner. Historical playback is detached and cannot mutate canonical resources.

## Verification evidence

- Baseline regression: 182/182. Final integration regression: 183/183.
- Syntax checks cover every changed/new JavaScript file (22 files).
- All 33 focused lifecycle, resolver, playback, controller, field-menu, MQ5,
  Resonance, Lab, Receiver and canonical integration suites pass, including
  18 deterministic canonical integration checks in suite 183.
- `git diff --check`, changed-file conflict-marker search and caller-authority
  review pass. The only duplicate test prefix is the pre-existing pair numbered 61.
- `validateGameData()`: 0 errors, 4 existing warnings; 208 maps and metadata
  entries, 107 regional chunks, 144 eligible directed seams.
- All 107 regional grid fingerprints match without regeneration.
- Complete read-only transition audit, loaded through its exported audit data,
  is deeply identical to `test/transition-audit-output.json`: 208 maps,
  256 fixed destinations, 8 preserved-coordinate transitions, 224 edge segments,
  42 house doors; physical edges ALIGNS 124 / BORDER 66 / BLOCKED 234 /
  INTENTIONAL_DISCRETE 4.
- Historical captures compare the synchronized baseline's Git objects against the
  working tree, without creating or entering another worktree:

| Capture | Count | Matching SHA-256 |
| --- | --- | --- |
| Singleton suites 139–141 | 52 traces, 387 checkpoints, 482 RNG values | `2034f8f2639c78e6d8b69d4d25a47f7d9e8ec53548f4227376faa30a8b288a66` |
| Formation suite 147 histories/playback | 133 captured values | `403050ca0c4c346ad886eff4f2083736103bdb93aa50d387761b5d5215e6e36e` |
| Party Attack suite 164 histories/playback | 586 captured values | `b97f7bdc7c8012218a32c663d3a2b52a9f61e1c826993d40e956dc03caa13d8f` |
| Generalized party suite 172 histories/playback | 1,271 captured values | `b084ef1cfd7a1694a7a5a0a63c0267fd8a0c12368861a56f6542edb34548e4ea` |

The playback captures include fixtures used to exercise invalid-history rejection;
they are comparisons of suite evidence, not counts of authored encounters.
Existing singleton, Formation and Receiver renderer source hashes remain locked by
their tests. Existing assertions were retained: only extracted renderer names,
diagnostic wording and exact authorized caller counts changed.

No browser or manual gameplay testing was performed.

## Files and remaining limitations

New production files: `canonical-party-combat.js`, `render-party-battle.js`.
Production edits: `combat.js`, `persistent-party.js`, `index.html`, `input.js`,
`movement.js`, `render.js`, `save.js`, `render-party-combat-lab.js`,
`party-combat-lab.js`, `formation-lab.js`, `gallery-receiver.js`.
Documentation: this report, `architecture.md`, `PROJECT_STATUS.md`.
New tests: suite 183. Existing source-ownership/extraction checks updated in suites
152, 165, 167, 168, 169, 173, 174, 179 and 181. No test file was renamed.

Unadapted ordinary templates and all listed bespoke encounters remain unavailable
to a recruited party and stop with development diagnostics. This deliberately
retains their capabilities rather than approximating them. It is not a complete
conversion of all western combat. Esla retains Observe under this task's explicit
five-command contract.

## Manual browser checklist

1. Before MQ5, fight an ordinary enemy: confirm unchanged solo visuals, input,
   messages, formulas, rewards and recovery, with no party UI hint.
2. Complete MQ5; confirm one level-11 Esla recruitment and both field-menu members.
3. Trigger a supported ordinary encounter after recruitment (starting-map Wisp or
   Briar Hound); confirm positions 108/256 and independent HP.
4. Exercise Attack, Resonance, Item, Observe and Run; confirm Lely has no Resonance.
5. Wound an ally, use Esla's Quickbloom, and complete its following recovery round.
6. Win; confirm full XP for both starting members, shared rewards once, and
   persistent HP/equipment/inventory after repeated confirmation.
7. Escape after using an item; confirm consumption/HP persist and no rewards.
8. Let every member fall; confirm membership, full recovery, one lost-gold/day
   consequence, and the existing home/stay location choice.
9. Confirm save/load refusal in battle and successful version-5 save/load afterward.
10. Exercise both Labs and the Receiver before recruitment; verify isolated,
    refundable Lab state and the unchanged Receiver Formation/story path.
