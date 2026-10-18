# Scripted combat entry — Pass 1

Baseline: `2b37229013c790318152985e4709b4ea81629bec`, 183 regression suites.
This increment hardens entry and consequence timing. It does not approve any
additional enemy for canonical party combat. All nine approved party templates,
the save-v5 schema, combat formulas, authored dialogue, maps and rewards remain
unchanged. Ordinary encounter selection RNG remains upstream as previously
authorized; this audit concerns scripted initialization, not that selection rule.

## Inventory and lifecycle

There are **15 dedicated `start*Combat` functions**, excluding the ordinary
`startCombat`. There is also **one inline scripted override**, Pale Sentry, inside
`startCombat`: **16 singleton scripted paths** in total. The earlier count of 15
counted named starters only. Searches include their callers, queued handlers,
choice callbacks, movement triggers and victory continuations. The Receiver is
an additional production encounter with its own Formation lifecycle; neither it
nor either Combat Lab is a singleton starter or included in the 16.

All dedicated starters are in `combat.js`. The table names their upstream entry
points as well. `C/` means `content/interactions/`. Shared behavior in the table:

- **Entry reads:** persistent roster; runtime combat/party/session ownership;
  enemy template data and reserved metadata; identity counter capacity; player
  HP, inventory/status containers; writable combat fields; applicable handler,
  chain count, objective or persistent HP. The authored caller owns its quest,
  proximity and location prerequisites. These checks consume no RNG or IDs.
- **Activation:** the existing starter installs one fresh enemy, activates combat,
  sets its mode/message/queues and encounter-local flags. No new engine is used.
  Mire Toad alone draws selection RNG here, after both candidates validate.
- **Rewards:** existing `applyKillRewards(enemy,msgs)` grants the original XP,
  gold and drops. A WeakMap claims each exact active enemy once, before reward
  RNG. Successful repeats are inert; unexpected failures retain a non-retryable
  resolving receipt. No refund or rollback is introduced.
- **Victory:** existing `handleCombatAction` after message playback owns story
  consequences and cleanup. It now ignores acknowledgement after combat has ended.
- **Defeat:** `recoverCombatDefeat` restores HP, removes the existing recovery
  statuses, clears combat, and delegates existing day/gold/location consequences
  to `applyCombatDefeatWorldRecovery`. No victory reward/completion is applied.
  Repeated action acknowledgement cannot recover twice.
- **Escape:** ordinary probabilistic Run gives no victory reward or completion.
  Exceptions are explicitly listed. Existing locks and attack costs are retained.
- **Party rejection:** every row remains unsupported for a recruited party;
  the existing diagnostic propagates before initialization or caller writes.

| Starter / template | Production caller, prerequisites and additional reads | Previous pre-entry writes; correction / activation writes | Victory / callback and reward owner | Defeat, escape and revisit |
| --- | --- | --- | --- | --- |
| `startSeepSplitCombat` / `enemy_the_seep` | `combat.js: handleCombatAction`; defeated Seep with positive split count; reads remaining count and registry template | Interstitial/continuation could be consumed before rejection. Validate before staging the next fight and again before callback consumption. Existing reduced HP/XP/gold retained. | Standard kill rewards for each exact enemy; final remnant ends chain. | Standard recovery; ordinary Run; no new persistent completion. |
| `startRainfishCombat` / `enemy_rainfish` | `movement.js: update`; MAP3_N1 pond zone, Still Water stage 1, not yet woken; victory continuation reads remaining count | `rainfish_woken`, movement/status/time ticks preceded rejection. Read-only step preview rejects first; wake flag is written only after installation. Continuations preflight before staging/consumption. | Standard rewards per fish; three-fight aftermath only after final victory. | Standard recovery; Run blocked; wake flag means activated school, not victory, and retains its established defeat behavior. |
| `startMireToadSpawnCombat` / `enemy_mire_toad_male`, `enemy_mire_toad_female` | `C/thornmere-wilds-interactions.js: interactMireToadSpawnSite`; unpicked spawn-site inspectable, Investigate choice; queued `mire_toad_spawn`; continuation count | Choice/dialogue/callback changes preceded rejection. Both templates now validate before randomized sex selection; protected choice and continuation. | Standard rewards per toad; last victory marks pickup and grants the existing Reed Remedy once. | Standard recovery; Run blocked; site remains available unless chain completed. |
| `startBossCombat` / `enemy_wrongteeth` | `C/south-ruins-interactions.js: interactWrongteethFloor`; nearby, not defeated/knocked down; queued `boss` | Intro dialogue/queued ID preceded rejection. Caller now preflights first. | Standard rewards; victory sets `BOSS.knockedDown`; existing subsequent authored decision remains separate. | Standard recovery; ordinary Run; no knockdown on rejection/defeat/escape. |
| `startWardenCombat` / `enemy_briar_warden` | `C/calwick-interactions.js: interactCalwickVale`; meadow proximity, quest started and not defeated; queued `warden` | Intro staging preceded rejection; preflight before staging. | Standard rewards; `warden_quest_defeated`, job-board refresh; existing NPC fee remains separate. | Standard recovery/Run; retry until defeated. |
| `startFortGuardCombat` / `enemy_smuggler_guard` | `C/thornmere-wilds-interactions.js: interactSmugglerFort`; arrest choice at stage 0 or guard retry at stage 1; queued `fort_guard` | Arrest set stage 1 before valid installation; choice/dialogue consumed. Stage 1 now commits in the handler after activation, preserving stage-1 defeat/retry semantics. | Standard rewards; stage 2 and queued Polwick follow authenticated victory. Next starter validates before stage/handoff writes. | Standard recovery; Run blocked; retry current stage. |
| `startFortPolwickCombat` / `enemy_polwick` | Same fort interaction, stage 2 proximity, or guard-victory continuation; queued `fort_polwick` | Retry intro/queue could precede rejection; preflight before staging and dispatch. | Standard rewards; stage 3 and queued Essa; next starter validates before handoff. | Standard recovery; Run blocked; stage 2 retained on defeat. |
| `startFortEssaCombat` / `enemy_essa` | Same fort interaction, stage 3 proximity, or Polwick-victory continuation; queued `fort_essa` | Retry intro/queue could precede rejection; protected staging/dispatch. | Standard rewards; stage 4, `smugglers_dead`, report dialogue. | Standard recovery; Run blocked; stage 3 retained on defeat. |
| `startMulhollandCombat` / `enemy_mulholland` | `C/south-ruins-interactions.js: interactMulhollandFloor`; nearby undefeated blocker; queued `mulholland` | Intro staging preceded rejection; caller preflights first. | Standard rewards; `MULHOLLAND.defeated` and existing passage aftermath. | Standard recovery/Run; blocker remains until victory. |
| `startDenWraithCombat` / `enemy_den_wraith` | `interactions.js: interactHouseInterior`; quest started, undefeated, correct house/proximity; queued `den_wraith` | Intro staging preceded rejection; caller preflights first. | Standard rewards; `DEN_WRAITH.defeated`, `den_wraith_defeated`, board refresh; existing NPC fee remains separate. | Standard recovery/Run; retry until victory. |
| `startSailorBrawlCombat` / `enemy_kolm` | `npcs.js: NPC_ACTIONS.kolmBrawler`; existing daily offer, Accept choice, 50g available; queued `kolm_brawler` | 50g deduction and intro preceded rejection. Preflight before choice consumption; deduct once only after handler installs combat. Poor-player dialogue is preserved. | Standard rewards; victory records `sailor_brawl_fight_day` and returns the existing 100g stake/payout once. | Standard recovery/Run; spent stake is not refunded on non-victory, as before. |
| `startTakomoCombat` / `enemy_takomo` | `C/thornmere-wilds-interactions.js: interactTakomoChamber`; nearby undefeated boss; queued `takomo` | Intro staging preceded rejection; preflight first. | Standard rewards; `TAKOMO.defeated` and existing aftermath. | Standard recovery/Run; no defeat flag without victory. |
| `startMimicPotionCombat` / `enemy_mimic_potion` | `interactions.js: tryExamineWorldItem`; nearby unpicked trap sparkle; queued `mimic_potion` | Pickup was consumed before dialogue/entry. Handler now marks it picked only after installation; repeated queued entry into a sprung trap is inert. | Standard XP/gold and existing guaranteed Potion drop through kill rewards. | Standard recovery/Run; picked means sprung, so successful activation still consumes the trap even if the player loses/flees. |
| `startLenswebSpiderCombat` / `enemy_lensweb_spider` | `C/thornmere-wilds-interactions.js: interactLighthouseLens`; valid active route objective, unresolved spider, Reach choice; queued `lensweb_spider` | Choice/intro could be consumed before rejection; protected callback. Poison remains activation-time, after installation; objective stays battle-local. | `finalizeLenswebSpiderEvent` now authenticates exact runtime enemy, completed victory or Observe-gated escape, and unchanged objective before granting it once. Kill rewards remain separate. | Standard defeat, no objective; Observe unlocks guaranteed Run, which legitimately finalizes the objective; repeat finalizer is inert. |
| `startTrappedDrownedCombat` / `enemy_pale_drowned_gallery` | `C/north-basin-interactions.js: interactSunkenGallery`; trapped encounter proximity, neither freed nor slain, Put it down choice | **Slain flag set before entry rejection.** Removed from choice. Protected input/callback rejects without closing choice or writing any state. Activation binds the exact enemy only. | Standard rewards; acknowledged authenticated victory alone writes existing `window.sunken_gallery_drowned_slain`. An ordinary pooled Drowned kill cannot resolve this event. | Standard defeat/Run; neither completes the event. Retry gets a fresh identity; completed/freed event cannot be started again. |
| Inline Pale Sentry / `enemy_pale_sentry` | `combat.js: startCombat`, invoked by ordinary encounter cadence; canonical MAP_N2, accepted unfinished contract; reads `pale_sentry_hp` | Party override was already rejected before pool selection/installation. Solo override now validates template/state/persistent HP before installation. Ordinary world movement/chance selection is outside this initializer. | Standard rewards; victory completes contract, zeroes persistent HP and refreshes board. | Existing persistent-HP escape/recovery semantics retained; ordinary Run; no new contract behavior. |

## Preparation boundary and diagnostics

`scriptedCombatEntry` is a small read-only authority in `combat.js`, reached by
`requireSingletonEncounter`. It does not resolve combat or invent new quest
prerequisites. The registry maps the existing queued IDs to their existing
starters. Production interactions validate before staging their combat-specific
intro. Registered choice/continuation callbacks carry a pure check in a WeakMap;
the existing input listener and dialogue dispatcher run that check before closing
the choice, advancing the final page, shifting a callback or clearing the queue.
Starters revalidate at installation. Missing templates remain inert before RNG;
invalid templates/state throw. Unknown queued IDs retain warning diagnostics and
are rejected without installing a pending ID.

Legacy low-level singleton replacement is retained because the existing
normalization and capture contracts exercise it. World dialogue/choice entry
requires inactive combat; foreign party, Lab and Receiver owners cannot pass.
No callbacks, identities, receipts or playback data are added to saves.

The Rainfish preview is restricted to the existing interior pond step and uses
the existing speed, diagonal and collision rules. It writes no position and does
not change terrain, seams, encounter eligibility or RNG cadence for valid play.

Confirmed additional lifecycle defects were repeatable singleton kill rewards,
repeat recovery through an inactive defeat phase, and Lensweb's callable
finalizer trusting an unauthenticated pending objective. The exact-enemy reward
receipt, inactive action guard and Lensweb outcome checks address these without
changing valid combat calculations. Unexpected post-activation exceptions remain
visible; this pass adds no rollback.

## Verification and limitations

Suite `184-scripted-combat-entry-atomicity.test.js` exercises every dedicated
starter with recruited-party rejection, legitimate solo installation, victory,
reward replay, defeat/recovery and existing Run policy. Additional cases exercise
real proximity callers, queued dispatch, physical choice input, Rainfish movement,
malformed templates/handlers/identity counters, continuation staging, Drowned
save/load and retry, forged finalization, and an injected reward-RNG failure.
Snapshots cover canonical state, flags, inventory/equipment/statuses, NPCs,
pickups, chests, location/time, combat/session state, runtime identity sequence,
pending callbacks and existing saved bytes. RNG calls and callback/array identity
are checked separately.

Existing suites 07 and 109 retain their activation assertions and now also assert
the absence of premature fort-stage/Mimic writes. Suite 142 expects no selection
roll for missing toad templates. Suite 56 retains invalid-ID/validation assertions
and additionally requires rejection before allocation. Suite 62 supplies a valid
stake for its dispatcher spies; its warning, order and exactly-once assertions
remain intact. No existing test is deleted or skipped.

Pass 2 remains deferred: enemy capability expansion, removal of compatibility
allowlists, universal party encounters, new formation schemas and scripted-party
adaptations. The 16 scripted singleton paths still reject recruited parties.
Receiver and both Labs keep their own lifecycle authorities. No browser testing
is claimed; headless checks do not prove manual presentation.

Manual checks: reject Put it down with Esla present and revisit the unchanged
Drowned; solo win, flee and lose/retry it; check fort arrest/retry, Kolm stake and
payout, Mimic trap activation, Rainfish wake timing, and Lensweb Observe/Run.
Save/load after completed or abandoned combat and confirm the existing outcome.

## Verification record

- Complete baseline regression: **183/183**; final regression: **184/184**.
- New focused suite: **61 checks passed**. Broader focused run: **53 suites
  passed** (scripted quests, combat authorities, canonical/persistent party,
  Formation, Receiver, MQ5 and save/load). After the final callback check, all
  12 directly affected suites and the complete suite passed again.
- Syntax: all **16** changed/new JavaScript files pass `node --check`.
- `validateGameData()`: **0 errors, 4 existing warnings** (Notice Board
  walkability, Takomo generic sprite, and two long dialogue entries).
- **107/107** regional fingerprints match. Read-only transition audit matches
  the committed artifact exactly: **208 maps, 256 fixed destinations, 8
  preserved-coordinate transitions, 224 edge segments, 42 house doors, 428
  placed edges**. Classifications: 124 ALIGNS, 66 BORDER, 234 BLOCKED,
  4 INTENTIONAL_DISCRETE; no hard incompatibilities.
- Save/load and rejection snapshots pass; **SAVE_VERSION = 5**.
- `git diff --check`, conflict-marker search and final caller/file-scope review
  pass. Existing duplicate test prefix 61 is unchanged; new prefix 184 was free.
- No transition/fingerprint artifact was regenerated. No browser/manual test
  was performed. HEAD remains the baseline hash; index remains empty.

| Historical captures | Count | Unchanged SHA-256 digest |
| --- | --- | --- |
| Singleton | 52 traces / 387 checkpoints / 482 RNG values | `2034f8f2639c78e6d8b69d4d25a47f7d9e8ec53548f4227376faa30a8b288a66` |
| Formation | 133 | `403050ca0c4c346ad886eff4f2083736103bdb93aa50d387761b5d5215e6e36e` |
| Party Attack | 586 | `b97f7bdc7c8012218a32c663d3a2b52a9f61e1c826993d40e956dc03caa13d8f` |
| Generalized party commands | 1,271 | `b084ef1cfd7a1694a7a5a0a63c0267fd8a0c12368861a56f6542edb34548e4ea` |

Unchanged artifact SHA-256 values:

- `test/transition-audit-output.json`:
  `6dd95428521b8971bc7bd6ee6040928f4311b1f7787b0798c35e817a51377337`
- `test/fixtures/regional-grid-fingerprints.js`:
  `cd2038ef431700a07b29849c996113702cb692f042f836ae61df4995c1bb1ae1`

## Changed-file responsibilities

| Files | Purpose |
| --- | --- |
| `combat.js` | Shared preparation, 15 starter guards/Sentry validation, authenticated Drowned and Lensweb outcomes, exact-enemy reward receipts, continuation guards, inactive acknowledgement guard. |
| `canonical-party-combat.js` | Existing singleton roster gate delegates to read-only preparation; party compatibility gates unchanged. |
| `interactions.js` | Preflight world trap/Den Wraith callers and queue/dispatch; commit fort arrest, stake and Mimic consumption after activation. |
| `input.js` | Validate selected registered callback before closing a choice. |
| `movement.js` | Pure Rainfish step preview and activation-time wake flag. |
| `npcs.js` | Protect Kolm's acceptance callback and defer stake deduction to activation. |
| `content/interactions/calwick-interactions.js` | Warden caller guard. |
| `content/interactions/north-basin-interactions.js` | Protect Drowned choice; remove premature slain write. |
| `content/interactions/south-ruins-interactions.js` | Mulholland/Wrongteeth caller guards. |
| `content/interactions/thornmere-wilds-interactions.js` | Fort/Takomo callers and fort/toad/Lensweb choices. |
| `test/cases/184-scripted-combat-entry-atomicity.test.js` | New deterministic audit/lifecycle suite. |
| `test/cases/07-fort-quest-retry.test.js`, `test/cases/109-mimic-potion.test.js` | Assert corrected timing while retaining successful-activation and persistence checks. |
| `test/cases/142-single-enemy-state-normalization.test.js` | Missing toad template now consumes zero RNG. |
| `test/cases/56-enemy-id-authority.test.js` | Invalid template ID rejects before installation; validation/restoration assertions retained. |
| `test/cases/62-encounter-dispatch.test.js` | Provide legitimate stake in dispatch spy fixtures; all dispatcher assertions retained. |
| `architecture.md`, `PROJECT_STATUS.md`, `CANONICAL_PARTY_COMBAT.md`, `SCRIPTED_COMBAT_ENTRY_AUDIT.md` | Lifecycle authority, current status, corrected diagnostic limitation and complete audit/evidence. |
