# Canonical party combat integration review

## Geographic formation bridge

`startCanonicalPartyEncounter()` accepts the existing legacy flat arrays of
exact registered template objects and immutable authored formation records:
`Object.freeze({id: 'formation_example', enemies: Object.freeze(['enemy_marsh_wisp']), weight: 1})`.
Formation IDs match `/^formation_[a-z0-9_]+$/` and are unique within a table;
enemy IDs match `/^enemy_[a-z0-9_]+$/` and may repeat in authored slot order.
Enemy arrays contain one to three ordered registered IDs. The existing
`encounterFormations` normalizer owns closed-record, accessor/prototype,
immutability, ID, count and cumulative-weight validation. The geographic
`EMPTY_ENCOUNTER_POOL` sentinel remains inert; malformed or empty authored
tables fail closed.

Before RNG, every normalized formation is checked through the existing complete
canonical preflight against the actual party, arithmetic, lifecycle ownership,
identity capacity and cleanup state. Eligible North Basin Donkey entry is also
preflighted. Then `encounterFormations.select(pool)` runs exactly once. Flat
arrays retain their exact uniform index mapping, including repeated entries;
weighted tables use the selector's existing cumulative-weight mapping. Each uses
one selection draw. The selected ordered IDs resolve through
`ENEMY_TEMPLATE_REGISTRY`; duplicates remain separate fixed-slot runtime actors
when the complete array reaches `canonicalPartyCombat.enter()` exactly once.

Rare overrides remain whole-encounter replacements in their original order:
North Basin outdoor eligibility adds one strict `< 1/16` Donkey check, then every
ordinary selection adds one strict `< 1/256` generated-23 check. Successful 23
selection alone issues its seven authenticated draws (HP, two gold bounds, ATK,
DEF, SPD, XP). It wins if both overrides succeed. Thus entry consumes two draws
outside North Basin or three within it, plus seven only on a 23 success. No
rejected/discarded candidate receives a runtime identity. Generated actual values
are validated by canonical entry before installation; invalid generated values
retain the consumed selection evidence without partial combat or cooldown writes.
Malformed tables and predictable authored preparation failures consume zero draws.

The pre-recruitment singleton route, Sentry story override, combat finalization,
reward/cooldown authorities, save refusal and all five historical combat capture
projections are unchanged. Suite 194 covers the bridge, including the 1–3 by 1–3
matrix, exact draws, stale/unsupported inputs, save/load and Run cleanup.

### Handoff to Claude

After this bridge reaches main, weighted pools and geographic assignments can be
supplied through the existing encounter data authorities without editing
`combat.js` or canonical installation. Claude owns formation composition/weights,
map assignments, rates and encounter permissions. This increment supplies no
Eastern Fens pool, enemy, rate or permission change and imports no content branch.
Waspthra/Botfly definitions and the Eastern Fens population remain outside this
worktree's bridge work. Tests use existing registered templates and one isolated
third-member fixture, never production formations.

## MQ5 Travellers' Rise scripted formation

The Rise road event is a production two-member-versus-three-enemy use of the
existing canonical engine. `travellersRiseAmbush` owns deterministic field
staging and dialogue; `scriptedPartyEncounters` authenticates the exact ordered
Highwayman, Bridled Hollow and Fen Handler formation (the legacy
`enemy_road_impostor` ID is retained). The three registered
templates require the closed `travellers_rise_ambush_lifecycle` capability; the
Hollow additionally declares the already-supported `brace` capability. No enemy
ID chooses its combat behavior, and defeating the Handler has no effect on the
Hollow.

Entry validates the complete story gate, routes, map cells, player side, enemy
side, lifecycle token and arithmetic before identities, combat RNG, payment or
story mutation. Refusal installs directly. The payment path records a separate
clamped 0–100 gold receipt once immediately before a successful installation;
escape and defeat keep that receipt and permit a free retry. Only authenticated
victory writes completion, grants the normal per-instance rewards once and
hands the journal to the deferred camp objective. Staging, playback and rendering
consume no RNG, and active event state remains unsaved under SAVE_VERSION 5.

## Pass 6 — living rewards, Fallen field operation and universal verification

Pass 5 was verified at 190/190 suites and checkpointed as
`4512eabc75d4a194e72f14ce98589822e6e4d59a`
(`feat(combat): migrate scripted encounters to canonical party battles`).
Pass 6 is an uncommitted policy increment. This section supersedes earlier
checkpoint descriptions of XP for Fallen members and victory revival.

**Rewards and progression.** After final playback acknowledgement, the exact
session and canonical-state seal authenticate writeback. Reward eligibility comes
from the terminal snapshot: each defeated, reward-eligible enemy contributes its
authored XP once; every living active member receives that full sum, Fallen
members receive zero. Shared gold and item drops resolve once in fixed enemy-slot
order, with the original gold draw followed by the drop draw (or guaranteed drop).
Party size never multiplies shared rewards. Voluntary Run and defeat grant none.
The approved mixed-Gull departure exception rewards only defeated instances;
Seep successors retain separate battle receipts. Scripted fees, payouts, guaranteed
objectives and chain callbacks retain their existing authenticated owner.

The existing saved receipt ledger prevents duplicate grants. Shared gold/items
commit before XP/growth; unexpected growth or scripted-finalizer failure retains
its diagnostic and spent work, blocks unsafe retry and refuses saving. There is
no rollback or reward reroll. Initial terminal acknowledgement performs the one
transaction; subsequent acknowledgement and rendering perform no reward RNG.

Lely still uses `stats` and `checkLevelUp`, including three growth draws per
level and the established +10 HP rule. Companions still use their authored
`persistentParty` progression and HP increase by the max-HP gain. Both authorities
already support multiple levels per award; no new curve was added. Member-specific
pages are ordered by fixed party slot, one page per level, ahead of existing story
or chained-battle aftermath. Closing those pages does not repeat progression.

**Fallen and recovery.** Zero HP retains the member and slot; victory does not
revive. `partyTerminalOutcome` is shared by both party resolvers and their
historical validators: no living ally means defeat first, including simultaneous
all-party/all-enemy death; otherwise enemy victory/departure conditions apply.
Singleton and Receiver Formation retain their separate unchanged authorities.
Membership, not the living-member count, continues to select canonical combat.

Fallen Lely can move, interact, open the menu, save/load, use the ferry and enter
another battle while a companion survives. No input/movement/transition HP lock
was found. Field poison/Curse and cat-scratch minimum-one damage no longer revive
Fallen Lely; solo behavior is unchanged. Existing beds, inns, infirmary and other
authored treatment retain their restoration behavior, as explicitly approved.
Items and Quickbloom remain non-reviving. Stable all-Fallen saves are rejected
before load writers, and saving an all-Fallen field state is refused.

Defeat commits completed actions, restores every member through their existing
owner, clears established recoverable statuses/sampled Slither, sets shared gold
to zero, advances one day and uses the existing home/stay recovery destination and
messages once. It grants no rewards or completion and does not refund spent items.
Scripted defeat finalizers accept that authenticated recovery movement.

| State | Victory / Run writeback | Full-party defeat |
| --- | --- | --- |
| HP, fixed membership, equipment | Exact terminal values; zero stays zero | HP maximum for every member; equipment and membership retained |
| Shared inventory / gold | Completed consumption/exchanges/theft; eligible rewards once | No item refund; existing zero-gold consequence |
| Poison, Curse, Slither / sample, Muddied | Existing persistent ownership retained | Established recovery clears and resets sample to 1 |
| Burn, Dazzled, corrosion, Brace, Bullet Time, Bomb, Strain | Combat-only cleanup; never saved | Cleared through cleanup/recovery |
| Observation | Existing authored enemy/quest authority; no new saved observation field | Same existing authority |
| Drafts, reservations, playback, runtime IDs/tokens | Cleared after safe finalization; monotonic IDs never rewind | Same; faults retain diagnostics rather than masquerading as completion |

**Coverage and route audit.** The registry remains 60: 45 ordinary mechanical
records (44 static plus authenticated generated 23), nine Category A scripted
records and six Category B pre-recruitment-only records. The complete template
and starter tables in `ENEMY_CAPABILITY_AUDIT.md` and
`SCRIPTED_COMBAT_ENTRY_AUDIT.md` remain authoritative; all 12 reachable scripted
routes, including Mulholland, the Toad chain and trapped Drowned, retain Pass 5
coverage. No capability approval list or new enemy-ID dispatch was introduced.
Takomo now uses the existing registered generic silhouette in the shared party
renderer; singleton rendering is unchanged.

The new case 191 exhausts all 16,214 unordered formations of one through three
of the 44 static ordinary templates for each party size: **48,642 complete dry
preparations**, with no RNG, identities or mutation. It also installs each static
template for all three sizes (132 installations), tests authenticated generated
records in mixed groups, and retains ordered/duplicate execution coverage from
185–190. All 20 production flat pools (60 entries) normalize without changing
selection or weighting; the 80 encounter-enabled metadata entries retain their
existing dispatchers. North Basin Donkey and rare-23 overrides are unchanged;
generated 23 retains seven authenticated draws. Eastern maps inherit a dormant
pool profile but `allowRandomEncounters: false` remains authoritative; no pool,
formation, map, encounter permission or artifact was edited.

The simulated end-to-end test performs actual assignment/pay callbacks, the
fort leave/report route, rest-week assignment, earned singleton XP, authentic
Receiver Formation victory/report, story cutaway completion, MQ5 recruitment,
party menu/save/load, geographic combat, Quickbloom/Strain, rewards, Fallen field
movement/ferry/save/load, a subsequent battle and exactly-once total defeat.
Travel uses validated placements, not a claim of manual walking; quest flags,
levels, recruitment and combat outcomes are not seeded. Three-member tests use
an isolated authored fixture, never a production third character.

SAVE_VERSION remains **5** with no new fields or migration. Geographic artifacts
and all five historical combat capture digests are unchanged. No browser testing
was performed. Manual checks: play a solo fight; recruit Esla via MQ5; try a
backtracking ordinary and optional scripted fight; check all commands and
Quickbloom recovery; win with one Fallen; check member-specific level pages;
move/menu/save/load/ferry with Fallen Lely; rest/treat her; lose the full party;
check both Labs and Receiver remain isolated.

### Pass 6 verification result

- Complete regression: **191/191**, including all cases 162–191 and every legacy
  combat, progression, field, save/load, ferry, recruitment and scripted suite.
- Case 191: **25 checks**, 48,642 dry preparations and 132 actual installations.
- Syntax: all **14** changed/new JavaScript files pass `node --check`.
- `validateGameData()`: **0 errors, 4 established warnings**.
- Regional catalogue test: **107/107** stored fingerprints match.
- Read-only transition audit: 208 maps, 256 fixed transitions, 8 preserved-coordinate
  transitions, 224 edge segments, 42 house doors; reset isolation passes,
  zero hard regional incompatibilities. Its output was redirected outside the
  repository; tracked artifacts were not regenerated.
- `git diff --check`, conflict-marker, ordinary-compatibility authority, non-combat
  HP-reader, reward/progression/finalizer writer and exact file-scope reviews pass.
- Historical capture checks reran the existing 139–141, 147, 164, 172 and 180
  scenarios; complete captured data retain these supplied SHA-256 digests:

| Capture | Count | SHA-256 |
| --- | --- | --- |
| Singleton | 52 traces / 387 checkpoints / 482 RNG values | `2034f8f2639c78e6d8b69d4d25a47f7d9e8ec53548f4227376faa30a8b288a66` |
| Formation | 133 | `403050ca0c4c346ad886eff4f2083736103bdb93aa50d387761b5d5215e6e36e` |
| Party Attack | 586 | `b97f7bdc7c8012218a32c663d3a2b52a9f61e1c826993d40e956dc03caa13d8f` |
| Generalized commands | 1,271 | `b084ef1cfd7a1694a7a5a0a63c0267fd8a0c12368861a56f6542edb34548e4ea` |
| Resonance | 130 | `026f44f41da431c818e33de08fe2679065cd461d9a2d638627b7b6ba0a168f74` |

Tracked fingerprint artifact: `cd2038ef431700a07b29849c996113702cb692f042f836ae61df4995c1bb1ae1`.
Tracked transition artifact: `6dd95428521b8971bc7bd6ee6040928f4311b1f7787b0798c35e817a51377337`.
Both equal HEAD byte-for-byte. SAVE_VERSION is 5. Pass 6 remains unstaged and
uncommitted; no push, merge or rebase was performed, and other worktrees were untouched.

## Pass 5 — authenticated scripted encounter lifecycles

Pass 4C was checkpointed at `f2ed970fe6990fbafe66346ce5aefce03f6cb6a5`.
Pass 5 routes every scripted encounter that can remain unresolved after MQ5
through canonical party combat while leaving its pre-recruitment singleton path
unchanged. Nine of the 15 guarded templates are reachable and migrated: Briar
Warden, Pale Sentry, Rainfish, Takomo, Den Wraith, Kolm, Wrongteeth, Lensweb
Spider and Mimic Potion. The same authority also owns reachable Mulholland, Mire
Toad spawning-site and trapped-Drowned routes whose base templates were already
ordinary. The fort guard/Polwick/Essa chain and Receiver/Caller/Keeper formation
are required before recruitment and retain their legacy owners.

`scriptedPartyEncounters` issues a private one-use token containing the exact
starter, ordered template IDs, allocated runtime instance IDs, lifecycle capabilities, escape policy, origin and
activation objective. `canonicalPartyCombat` and its persistent bridge require
that token at validation, installation and finalization. A bare scripted template
cannot enter through the ordinary boundary. The complete dry preflight precedes
stake deduction, poison, pickup consumption, wake state, RNG and identities.
Unexpected post-preflight installation failures retain their diagnostic and do
not roll those activation consequences back.

Finalization occurs after canonical HP/status/inventory writeback and ordinary
reward receipt, but before transient battle cleanup. It authenticates the exact
token, ordered template IDs and runtime instance IDs once. Victory then commits the existing flag, NPC/board state,
stake payout, guaranteed drop, objective or chain callback. Defeat and ordinary
escape commit no victory consequence. Kolm keeps the spent 50-gold stake on either;
Mimic remains sprung; Rainfish remains woken. Lensweb's Observe-gated escape is
the sole non-victory story success and grants the exact route objective once.
Pale Sentry writes remaining HP on every outcome and completes only on victory.

Rainfish and Mire Toad retain separate authenticated battles. Their interstitial
callback is origin-bound, blocks saving, accepts only the next exact chain stage
and allocates fresh identities. Toad sex selection remains one draw after both
candidates pass full preflight. No dynamic formation mutation or same-slot
replacement was added. Scripted escape policy is data passed to the existing
controller: Rainfish/Toad are blocked, Lensweb is Observe-gated, ordinary routes
use the legacy speed contest, and the legacy-runnable boss-presented Wrongteeth,
Takomo and Mulholland use that same contest without changing template metadata.

The capability registry now has 54 mechanically supported templates. Nine still
need a story token; six remain mechanically guarded because their mandatory
pre-recruitment legacy engines own unresolved behavior. SAVE_VERSION remains 5.
No production formation, geography, dialogue, balance or save field changed.
See `SCRIPTED_COMBAT_ENTRY_AUDIT.md` for the complete 15-template proof.

## Pass 4C — unusual ordinary mechanics

Pass 4B was verified and checkpointed at
`10d2f27eeb2061cfa24a301207ef53010fabdb4f`
(`feat(combat): support status specials in canonical party battles`). Pass 4C was
checkpointed at `f2ed970fe6990fbafe66346ce5aefce03f6cb6a5`. At that checkpoint the registry had 60 templates: **45 mechanically
supported, zero special-capability pending, 15 scripted-lifecycle guarded**.
Generated 23 is mechanically supported only with an authenticated generated
record; its bare registry sentinel remains invalid encounter input.

### Approved party translations and ownership

- Seep remains a **separate smaller battle** after authenticated parent rewards.
  A private one-use handoff issues the 20-HP/20-XP/0–3-gold successor, keeping its
  other authored stats. Defeated parents in a formation queue successors in slot
  order. The old identities remain stale. The canonical owner uses the existing
  dialogue callback preflight hook; a private token permits only its own dialogue
  during read-only preparation and installation. No UI state is spoofed to validate.
  Saves/loads refuse while the interstitial handoff is pending. Final successor
  victory uses the existing completion text. No runtime formation replacement is
  implemented; same-slot round-boundary replacement remains a future extension.
- Troll regeneration samples **round-end HP**, as explicitly approved. A surviving
  Troll heals at most its authored six HP after burn/Bomb ticks, without RNG or
  exceeding max HP. Terminal outcomes suppress it. Run-only rounds retain the
  legacy absence of regeneration. Trollbane consumes on any target; on a Troll
  it suppresses an unexecuted action in that round and regeneration for the rest
  of combat. Later ordinary attacks are not stunned. Duplicates have independent
  battle-local suppression booleans; a new fight starts unsuppressed.
- Thornback adds its authored 90 DEF only to melee Attack. As explicitly approved,
  an immediate 90% counter follows each melee attempt, even a miss, provided both
  actors survive and combat remains ongoing. It targets the exact triggering ally
  without target RNG, uses the ordinary damage/critical/evasion arithmetic, and
  applies no landed-hit status rider. Items/Bombs bypass armor and never counter.
  Existing Curse/Bullet Time rules are retained; no singleton timing changed.
- Each Mire Toad uses the existing poison rider (30%, existing-status skip, Fen
  Mask ward after the decision draw). Sex/Observe count belongs to each exact
  instance. Jackbane Vial matches male, Henbane Sprig matches female; correct use
  defeats that target even without prior Observe. Wrong/unsexed use still consumes.
  Dead users/targets skip/cancel without consumption or retargeting.
- Each Gull steals **gold, never inventory**, on its first landed nonlethal hit:
  `min(purse,20+floor(roll*31))`. Even a zero purse consumes the amount draw and
  arms flight. The approved grace is **one full subsequent party round**, after
  which a surviving Gull departs without slot compaction. Killing it first returns
  its own stolen gold once. Departure retains HP/history but removes the exact
  instance from targeting, commands and initiative; no further theft occurs.
  The user explicitly authorized **rewards for defeated enemies only** when all
  remaining enemies resolve after a departure. This ends as Escape, not Victory;
  XP/gold/Potion draws cover only defeated slots. Voluntary Run remains reward-free.
  This is the bounded exception to the otherwise deferred Pass 6 reward policies.
- Generated 23 uses the existing seven selection-generation draws, once, in order:
  HP, gold A, gold B, ATK, DEF, SPD, XP; each is `23*ceil(roll*23)`. The private
  `canonicalEnemyRecords` issuer freezes the selected data and records provenance
  in a WeakMap. Copies/forgeries and the bare sentinel reject. History contains
  issued `{kind,template,rolls}` evidence, validated without generating or rerolling.
  Actual zero/unsafe stats reject after selection and before combat installation.

`enemy-capabilities.js` owns the supported mechanic vocabulary and closed profiles.
No enemy-ID execution/approval list was added. The new profile fields are
`regeneration:{amount}`, `melee_armor:{defense}`, `counterattack:{chance}`,
`poison_on_hit:{chance}`, `mire_toad_reagent_observation:{sex}`,
`steal_and_flee:{minGold:20,goldSpan:31,graceRounds:1}`,
`split_followup:{hp:20,xp:20,goldMin:0,goldMax:3}`, `generated_stats:{factor:23}`.
All profiles are deeply immutable; existing authored fields and registry validation
remain authoritative. Contradictory armor/counter and regeneration/flight profiles
reject before installation. Arithmetic includes the actual armor-enhanced defence.

Only the generalized round owner stores mutable enemy mechanic state. Snapshot
`unusual` is closed: Troll `{healingSuppressed,suppressedRound}`; Gull
`{stolenGold,stolenRound,departed}`. No global status, template mutation or second
Lely record is introduced. A Gull battle additionally snapshots its shared `gold`
purse; authenticated writeback updates `stats.gold` once. This is combat-only
schema, not a save field. Persistent status/equipment/inventory owners and recovery
remain unchanged. SAVE_VERSION stays 5.

New immutable history evidence covers `regeneration`, `counter_check`,
`counterattack`, `theft`, `gold_recovered`, `departure`; melee armor adds a bounded
`armor` record with its defense and damage rolls. Reagents and Trollbane use the
existing item before/after transition. Projection verifies exact identities,
formula evidence, state/timer transitions, inventories and final snapshots without
executing combat or consuming RNG. Frame zero remains historical. The shared
renderer adds concise messages and a FLED badge using those frames only.

### Representative deterministic RNG contracts

Target draws remain one per attacking enemy when more than one ally lives, zero
with one ally. Weighted initiative remains N−1 (five for six actors). Each ordinary
attack consumes its existing three damage/critical/evasion draws. No targeting or
initiative draw is added for a counter; cancelled scheduled actors do not refund
previously committed draws.

| Case | Total draws (excluding world selection/rewards) |
| --- | --- |
| Troll 1v1 Attack + regeneration | 7: initiative 1, two attacks 6; regeneration 0 |
| Player-first Trollbane 1v1 | 1 initiative; suppressed enemy does not attack |
| Thornback 1v1 with successful counter | 11: initiative 1, melee 3, check 1, counter 3, enemy attack 3 |
| Thornback lethal player-first melee | 4: initiative 1 + melee 3; no counter |
| Toad 1v1 Observe with new poison check | 5: initiative 1 + attack 3 + poison 1 |
| Player-first matching reagent 1v1 | 1 initiative; no reagent RNG |
| Gull 1v1 Observe with first theft | 5: initiative 1 + attack 3 + amount 1 |
| Next Gull Observe round ending in flight | 4: initiative 1 + attack 3; flight 0 |
| Three allies/three Toads, Observe + two reagents, enemies first | 20: target 3 + initiative 5 + attacks 9 + poison 3 |
| Generated 23 selection-generation | 7 generation draws, separate from existing pool/override draws |

The intended Mire Toad ×3 fixture now executes; Waspthra/Botfly remain unregistered.
No production formation, pool, geography, stats, save fields or new content was
added. At the Pass 4C checkpoint all 15 scripted lifecycles were deferred to Pass 5;
the Pass 5 section above now supersedes that routing state. Pass 6 above supersedes the earlier deferral of the
remaining universal rewards/XP/Fallen/recovery policies. Both Labs and Receiver stay isolated.

No browser testing was performed. Optional smoke: pre-MQ5 singleton; recruited
Seep and its smaller successor; Troll/Trollbane; Thornback melee versus items;
each Toad's Observe/reagent; Gull theft then kill/flight/Run; save/load afterward.

### Final verification and review

The Pass 4B checkpoint passed **188/188** before commit. The completed Pass 4C
increment passes **189/189**, including all **22** grouped suite-189 checks and
all 72 template/side-size preparation/entry combinations (eight templates × nine
sizes). **68 focused suites** passed; final changed-suite reruns include the new
handoff/forgery, mixed-six-actor and Fallen/counter checks. All **15** changed/new
JavaScript files pass `node --check`. Save/load, party/Formation/Receiver/Lab,
field-menu, recruitment, status/cure, rewards and recovery suites pass.

`validateGameData()` reports **0 errors / 4 established warnings**, all **107**
regional fingerprints match, and the read-only transition audit JSON matches its
tracked authority byte-for-byte (256 fixed transitions, 224 edge segments; reset
isolation passes all 26 fields). SAVE_VERSION is **5**. Neither artifact was
regenerated:

- `test/fixtures/regional-grid-fingerprints.js`:
  `cd2038ef431700a07b29849c996113702cb692f042f836ae61df4995c1bb1ae1`
- `test/transition-audit-output.json`:
  `6dd95428521b8971bc7bd6ee6040928f4311b1f7787b0798c35e817a51377337`

| Preserved capture | Count | SHA-256 |
| --- | --- | --- |
| Singleton | 52 traces / 387 checkpoints / 482 RNG values | `2034f8f2639c78e6d8b69d4d25a47f7d9e8ec53548f4227376faa30a8b288a66` |
| Formation | 133 | `403050ca0c4c346ad886eff4f2083736103bdb93aa50d387761b5d5215e6e36e` |
| Party Attack | 586 | `b97f7bdc7c8012218a32c663d3a2b52a9f61e1c826993d40e956dc03caa13d8f` |
| Generalized commands | 1,271 | `b084ef1cfd7a1694a7a5a0a63c0267fd8a0c12368861a56f6542edb34548e4ea` |
| Resonance | 130 | `026f44f41da431c818e33de08fe2679065cd461d9a2d638627b7b6ba0a168f74` |

Final source/diff review finds no new production enemy-ID mechanic dispatch,
compatibility allowlist, geography/pool change, conflict marker or save-field
change. `git diff --check` passes. The two existing test files numbered 61 are
already present in the checkpoint; neither was renamed or changed. Test 189 uses
the reserved Codex number. Other assertions remain intact; former special-enemy
rejection fixtures now use still-guarded scripted enemies or positively verify
migrated support, with generated records covered through their authenticated path.

### Files in this increment

| File | Purpose |
| --- | --- |
| `canonical-enemy-records.js` (new) | Private generated/successor provenance and immutable history evidence. |
| `enemy-capabilities.js` | Enable the eight mechanics and validate their closed profiles/state seeds. |
| `encounter-formations.js` | Accept authenticated source records while validating all formation members. |
| `combat.js` | Per-instance mechanics, arithmetic, fixed departed slots, events/playback and handoff preflight. |
| `canonical-party-combat.js` | Authenticated separate Seep handoffs and approved defeated-slot flight rewards. |
| `persistent-party.js` | Existing-owner shared-gold writeback and private handoff validation. |
| `render-party-battle.js` | Historical mechanic messages and departed-slot presentation. |
| `save.js` | Refuse save/load during a pending authenticated Seep handoff; no payload change. |
| `index.html` | Register provenance authority after capabilities and before formation/canonical users. |
| `test/cases/189-unusual-enemy-capabilities-party-combat.test.js` (new) | Deterministic mechanics, 72 preparation combinations, ownership, lifecycle, playback and atomicity. |
| `test/cases/181-persistent-party-lifecycle.test.js` | Preserve unsupported-entry assertions using a still-guarded template. |
| `test/cases/183-canonical-party-combat-integration.test.js` | Preserve rejection/atomicity coverage with guarded templates and unsafe generated stats. |
| `test/cases/185-canonical-battle-envelope.test.js` | Confirm Toad formation support while retaining missing-template and invalid-state rejection. |
| `test/cases/186-enemy-capability-migration.test.js` | Update complete 60-template classification and capability vocabulary; retain all guarded cohorts. |
| `test/cases/187-brace-capability-party-combat.test.js` | Retain explicit unsupported scripted/raw-generated rejection after migration. |
| `test/cases/188-status-specials-party-combat.test.js` | Assert migrated capabilities and unchanged scripted guards, retaining status coverage. |
| `ENEMY_CAPABILITY_AUDIT.md` | Complete updated inventory, legacy evidence and approved translations. |
| `architecture.md` | Ownership, provenance, per-instance state and authenticated handoff contracts. |
| `PROJECT_STATUS.md` | Checkpoint, completed scope, validation results and deferred work. |
| `CANONICAL_PARTY_COMBAT.md` | Current mechanic contract, exact verification and review record. |

Final HEAD remains `10d2f27eeb2061cfa24a301207ef53010fabdb4f` on
`agent/codex`; the index is empty and all Pass 4C changes are unstaged/uncommitted.
Only the explicitly authorized Pass 4B checkpoint was committed. Nothing was
pushed, merged or rebased; other worktrees were neither entered nor modified.

The sections below retain earlier checkpoint histories. Their supported/pending
counts describe those stages; the current authority is the Pass 4C 45/0/15 inventory
above.

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
| Mire Toad ×3 | Valid | Uses registered male Toad ID three times; supported since Pass 4C; no production formation is authored. |
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

## Pass 4A Brace migration

All eight existing Brace templates are now accepted by capability compatibility:
Stone Crawler, Bone Guard, Hollow, Tomb Sentry, Shallows Skitter, both Silt Crab
variants, and Marrow Hulk. They require no additional unsupported mechanics.
Together with Pass 3's 22 templates this gives 30 supported templates, 15 remaining
special-capability rejections and 15 scripted-lifecycle rejections, from the same
60-template registry. No ordinary stat, reward, pool, formation, geography or
singleton mechanic changed.

The user resolved the singleton/canonical scheduling ambiguity explicitly in
favor of legacy behavior: roll only when targeted by a committed melee Attack,
and protect the exchange from round start regardless of initiative. A successful
guard replaces the enemy's attack, halves the rolled melee damage (minimum one),
includes any rolled critical multiplier but suppresses the critical message,
and bypasses evasion and Cursed-fumble checks. Item/Bomb damage is unchanged.
Each exact instance makes one independent decision per eligible round; all
targeted melee hits share that instance's guard for that round. It clears at the
completed round boundary or terminal cleanup. Dead scheduled actors skip; terminal
outcomes truncate without another activation. The complete audited legacy
semantics, closed snapshot/event schemas and RNG table are in
[architecture.md](architecture.md#brace--pass-4a).

Suite 187 covers the full nine-size matrix, all eight sprites, duplicate/mixed
bracers, exact tapes and count assertions, item/Bomb bypass, Curse/critical rules,
Observe/Run/boss locks, Quickbloom/Strain/Slither, immutable and tampered histories,
atomic invalid preparation, outcome/reward idempotence, recovery, save refusal,
fresh subsequent identities, and the natural recruited Stone Crawler route.
Verification passes 27 grouped checks in suite 187, 46 focused suites and the
complete 187/187 regression. All nine changed/new JavaScript files pass syntax
checks; data validation is 0 errors / 4 established warnings, fingerprints are
107/107, and the read-only transition audit exactly matches its committed artifact.
Historical singleton, Formation, party Attack, generalized-command and Resonance
captures retain the exact digests below. SAVE_VERSION stays 5; transition and
fingerprint artifacts are unchanged and have not been regenerated.

Pass 4B owns the landed-hit status/offensive riders described below; Pass 4C
still owns the remaining special mechanics, and Pass 5 owns scripted outcomes.
Mire Toad remains poison/reagent-blocked; Waspthra/Botfly remain unregistered.
No optional Lab scenario was added. No browser testing was performed. Manual
smoke checklist: compare a solo Stone Crawler fight; after recruitment find a
natural Stone Crawler and inspect Brace before/after its scheduled slot; try
Attack versus item damage, Observe and Run; finish victory/escape/defeat and
save/load afterward; confirm both Labs and Receiver remain separate.

## Pass 4B landed-hit status and offensive specials

Seven repeatable templates now route through canonical capability compatibility:
Shade Wraith and Corpse Slug (`slither_on_hit`), Void Walker
(`curse_on_hit` plus `void_shard_burst`), Dripping Maw (`acid_corrosion`), Fen
Witch (`poison_spell`), Lantern Moth (`dazzle_on_hit`) and Dust-Drowned
(`curse_on_hit`). This raises the capability-compatible cohort to 37 templates;
eight special-capability and fifteen scripted-lifecycle templates remain closed.
No identity list or canonical ID switch grants support. Closed immutable mechanic
profiles combine existing template fields with audited legacy parameters, and the
complete formation validates before RNG, identities or installation.

All seven mechanics are landed-hit riders on the enemy's ordinary Attack. They
do not replace the Attack or add an AI branch. A miss, actor-dead skip,
target-dead cancellation, or base hit that makes the target Fallen performs no
rider check. On a surviving landed target, the stable legacy order is Slither,
Fen Witch poison, Curse, Void shard burst, Dazzle, then Acid. Each applicable
check consumes one draw; Slither consumes a second draw only on success to sample
Speed 1–20, and an unwarded successful shard burst consumes a second draw for
8–14 damage. Void Shard inventory wards the burst without consumption or a damage
draw. Fen Mask and Amethyst Bangle preserve their existing poison/Curse wards.

Status and corrosion ownership is exact-member state. Slither, poison and Curse
write back through Lely's status authority or the companion's persistent-party
record. Dazzled and corrosion are combat-only: Dazzled applies the established
eight-point Attack accuracy penalty and corrosion subtracts one Defence per
successful application to a cap of six. Both clear at cleanup and never enter the
version-5 save. A rider applied after order commitment cannot reorder that round
or alter the target's already committed action; it becomes active for command
mechanics on the following round. Existing cure items can remove an older status
before a later action, and a later landed hit may reapply it under the legacy rule.

Enemy targeting remains independent of capabilities. Every attacking enemy first
commits one exact living ally using the existing policy; a single living ally
costs no target-selection draw. Weighted initiative then uses N−1 draws. Execution
uses three ordinary Attack draws, followed by only the applicable conditional
rider draws. Frozen targets never retarget, and committed RNG is not refunded
when an actor or target later becomes unavailable. Duplicate templates keep
separate runtime IDs, status decisions, corrosion and history.

The detached result adds closed `enemy_effect_check`, `enemy_status`,
`enemy_shard_burst`, and `enemy_corrosion` evidence. Frame zero remains the
pre-round state and each later frame applies exactly one recorded event. Playback
captures equipment ward flags once, reconstructs Slither samples and corrosion,
and rejects altered identities, thresholds, rolls, status transitions, damage or
final snapshots without rerunning RNG. The shared renderer adds concise rider
messages and a `COR` badge; singleton rendering remains unchanged.

Suite 188 covers all nine party/enemy sizes, six-actor scheduling, duplicate and
mixed formations, exact target ownership, same-round timing, cancellation,
Quickbloom/Observe/Run, wards and cures, historical rendering, outcomes,
writeback, recovery and version-5 save/load. Production pools remain flat
single-enemy pools with unchanged selection RNG. Pass 4C retains The Seep,
Rotwood Troll, Thornback, both Mire Toad variants, both Basin Gull variants and
generated enemy 23. Scripted lifecycle templates remain guarded for Pass 5.


## Pass 3 ordinary-enemy capability migration (checkpoint evidence)

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
No Eastern Fens pools, scripted escort, campfire, Mornay, or new content was added.

## State and lifecycle authorities

`canonicalPartyCombat.enter({enemies, escape})` accepts one to three template IDs
or exact template-shaped instances. Existing runtime IDs, altered templates,
accessors, unsupported fields/capabilities, unsafe arithmetic and unsupported
policies reject. Current structural group support covers all 30 capability-compatible
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
acknowledgements cannot reapply them. Under Pass 6, victory retains Fallen members
at zero HP and grants full encounter XP only to members living at finalization,
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

In the original integration below, unadapted templates and bespoke encounters were unavailable
to a recruited party and stop with development diagnostics. This deliberately
retains their capabilities rather than approximating them. It is not a complete
conversion of all western combat. The completed command contract is actor-specific:
Lely has Attack / Item / Observe / Run, while Esla has Attack / Resonance / Item / Run.

## Manual browser checklist

1. Before MQ5, fight an ordinary enemy: confirm unchanged solo visuals, input,
   messages, formulas, rewards and recovery, with no party UI hint.
2. Complete MQ5; confirm one level-11 Esla recruitment and both field-menu members.
3. Trigger a supported ordinary encounter after recruitment (starting-map Wisp or
   Briar Hound); confirm positions 108/256 and independent HP.
4. Exercise Attack, Resonance, Item, Observe and Run; confirm Lely has no Resonance.
5. Wound an ally, use Esla's Quickbloom, and complete its following recovery round.
6. Win; confirm full XP for both living members, shared rewards once, and
   persistent HP/equipment/inventory after repeated confirmation.
7. Escape after using an item; confirm consumption/HP persist and no rewards.
8. Let every member fall; confirm membership, full recovery, one lost-gold/day
   consequence, and the existing home/stay location choice.
9. Confirm save/load refusal in battle and successful version-5 save/load afterward.
10. Exercise both Labs and the Receiver before recruitment; verify isolated,
    refundable Lab state and the unchanged Receiver Formation/story path.
