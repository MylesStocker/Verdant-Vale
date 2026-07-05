# Quest State Audit

Audit pass only — **no gameplay code was changed.** Every quest/progression
variable declared in `quests.js`, plus two quest-like variables that live
outside it (`dilemma_voss` in `state.js`, `window.mirethyst_rewarded` in
`npcs.js`/`save.js`), was traced end-to-end through every file that reads or
writes it: `quests.js`, `save.js`, `interactions.js`, `npcs.js`, `combat.js`,
`movement.js`, `world-transitions.js`.

**38 quest/progression variables found, grouped into 16 quest chains.**

Structural integrity check (done programmatically, not by eye): the 36
variables declared in `quests.js` are in **exact 1:1 correspondence** across
`quests.js`'s own declarations, `QUEST_FLAG_SCHEMA`, `syncQuestFlagsToWindow()`,
and `loadGame()`'s manual restore lines — 36 declared = 36 in schema = 36
synced = 36 restored on load, no orphans in any direction. This part of the
plumbing is clean.

A note on `syncQuestFlagsToWindow()` before the per-quest sections: the
`window.*` mirror it maintains is documented in `quests.js` as
"debugging/console inspection only." I verified that claim by grepping every
`window.<flag>` read across the whole codebase outside `quests.js`/`save.js`/
`validation.js` — there are none except `window.mirethyst_rewarded` (its own
special case, see its section). `saveGame()` and `validateSaveSchema()` both
call `syncQuestFlagsToWindow()` themselves immediately before reading, so a
mutation site that forgets to call it has **zero effect on save/load
correctness**. I still note per-quest which mutation sites skip the call, per
your ask (item 7), but treat it as a completeness/consistency note, not a
functional bug, throughout.

---

## 1. Sluice Inspection

Flags: `sluice_job_started`, `sluice_fixed`, `sluice_pay_ticket_ready`, `sluice_reward_given`

| Stage | Meaning | Checked in | Set in | Entry | Exit |
|---|---|---|---|---|---|
| all false | Not started | Supervisor dialogue (`interactSupervisor`, interactions.js:270) | — | Talk to Supervisor (Calwick office) | Accept → `sluice_job_started=true` |
| `sluice_job_started` only | Go inspect the gate | interactions.js:276, 818 | `interactSupervisor` callback | — | Interact with West Gate (SLUICE_GATE, inside East Sluice) → `sluice_fixed=true` |
| `+sluice_fixed` | Report back | interactions.js:281 | West Gate callback (interactions.js:827) | — | Talk to Supervisor → `sluice_pay_ticket_ready=true` |
| `+sluice_pay_ticket_ready` | Collect pay | interactions.js:288, 1625 | Supervisor callback (interactions.js:287) | — | Talk to Petra (office, or inn on Dayoff) → 50g, `sluice_reward_given=true`, `MainQuest=1` |
| `sluice_reward_given` | Complete | interactions.js:293, 1012; npcs.js:154,242,700,1044,1097 | Petra callback (interactions.js:1638) | — | Unlocks Overseer Mault (warden quest) and Supervisor's dispatch offer |

**Reachability:** every stage reachable, every NPC statically located or
correctly relocated on Dayoff (Petra: office → inn). **Dead ends:** none.
**Save/schema:** all 4 flags present, correct. **Sync gaps:** the
`sluice_job_started=true` and `sluice_pay_ticket_ready=true` callbacks don't
call `syncQuestFlagsToWindow()` (the final reward callback does). No
functional impact (see note above).

---

## 2. The Dispatch Letter (`MainQuest`)

Flags: `MainQuest`, `dispatch_quest_started`, `dispatch_delivered`, `dispatch_pay_ticket_ready`, `dispatch_rewarded`

Continues directly from Sluice Inspection via the same `interactSupervisor()`
else-if chain (interactions.js:295-431).

| Stage | Meaning | Set in | Entry | Exit |
|---|---|---|---|---|
| `sluice_reward_given && !dispatch_quest_started` | Offered | Supervisor | — | Accept → letter item granted, `dispatch_quest_started=true` |
| `+!dispatch_delivered` | Carrying letter | Supervisor callback | — | Deliver to Officer Veth (Drenwick district office) → `dispatch_delivered=true` |
| `+dispatch_delivered, !dispatch_pay_ticket_ready` | Report back | Veth interaction | — | Talk to Supervisor → `dispatch_pay_ticket_ready=true` |
| `+dispatch_pay_ticket_ready` | Collect pay | Supervisor | — | Petra → 75g, `dispatch_rewarded=true`, `MainQuest=2` |
| `dispatch_rewarded` | Complete | Petra callback | — | Unlocks fort quest offer from Supervisor |

`MainQuest` itself only takes values 0/1/2/3 anywhere in the codebase (set at
interactions.js:1640/1665/1689); nothing checks `MainQuest >= 4`, so 3 is its
practical ceiling. **Dead ends:** none in this segment on its own — see
**Issue #1** below for how the *following* quest (fort) can prevent
`MainQuest` from ever reaching 3.

Officer Veth is a static `SIMPLE_NPCS` entry (interactions.js:1382-1420,
checked) — no day-gating, always reachable. **Save/schema:** all 5 fields
correct. **Sync gaps:** `dispatch_quest_started`/`dispatch_pay_ticket_ready`
callbacks do call `syncQuestFlagsToWindow()` here (unlike the sluice
equivalents) — inconsistent between the two nearly-identical quests, but
again harmless.

---

## 3. The Unmarked Post (fort / smugglers) — ⚠️ contains the audit's most serious finding

Flags: `fort_quest_started`, `fort_quest_stage`, `fort_pay_ticket_ready`, `smugglers_dead`, `smugglers_execution_day`

| Stage | Meaning | Set in | Entry condition | Exit |
|---|---|---|---|---|
| `!fort_quest_started` | Not offered | — | Requires `dispatch_rewarded` | Supervisor offers → `fort_quest_started=true` |
| `fort_quest_started`, `fort_quest_stage===0` | Guard post enterable | movement.js:348 (`if (fort_quest_started) enterSmugglerFort()`) | — | Confront Polwick (interactSmugglerFort, interactions.js:435) → choice |
| `fort_quest_stage===1` | Guard fight in progress | Polwick "arrest" choice (interactions.js:455) | — | **Only exit: win the guard fight** (combat.js:826 → stage 2) |
| `fort_quest_stage===2` | Polwick fight in progress | combat.js:826 (guard victory) | — | **Only exit: win the Polwick fight** (combat.js:842 → stage 3) |
| `fort_quest_stage===3` | Essa fight in progress | combat.js:842 (Polwick victory) | — | **Only exit: win the Essa fight** (combat.js:856 → stage 4, `smugglers_dead=true`) |
| `fort_quest_stage===4` | All defeated | combat.js:856 | — | Report to Supervisor → choice |
| `fort_quest_stage===5` | Spared ("Leave them be") | Polwick "leave" choice (interactions.js:469) | — | Report to Supervisor → choice |
| `fort_quest_stage===6` | Reported | Supervisor's report/foundNothing choice | — | Terminal — see Issue #2 |

**Issue #1 — CONFIRMED SEVERE: permanent soft-lock if the guard/Polwick/Essa
fight is fled or lost.**

`fort_guard`, `polwick`, and `essa` (npcs.js:3224-3299) are only *present on
the map* when `fort_quest_stage === 0` or `fort_quest_stage >= 5`:

```js
if (fort_quest_stage === 0 || fort_quest_stage >= 5) return 'smuggler_fort';
return null;
```

The only way to *enter* combat with any of them is the trigger chain fired
from the previous fight's victory dialogue
(`dialogue.triggerFortGuardCombat` → `triggerFortPolwickCombat` →
`triggerFortEssaCombat`, combat.js:826-859). There is no standalone
"re-approach and refight" entry point, and I confirmed with a full-codebase
grep that `fort_quest_stage` is **never reset to 0** by any mechanism (no
retry, no debug-menu reset, nothing).

Concretely: if the player chooses "Make an arrest" (`fort_quest_stage=1`)
and then either **flees** the guard fight (`Run`, `pendingEscape` →
`endCombat()`) or **loses** it (HP hits 0, generic defeat handler just
resets HP/gold/day and calls `endCombat()`), `fort_quest_stage` stays at `1`
forever. At stage 1, no NPC on `smuggler_fort` is visible/interactable, so
there is no way to retry the fight, no way to progress, no way to reach the
Supervisor's report branch (his dialogue chain has no case for stages 1-3,
so it falls to a generic "have you looked into it yet?" line forever). The
same applies verbatim to fleeing/losing at stage 2 (Polwick) or 3 (Essa).

This is a genuine permanent dead end, not a design choice — it directly
contradicts the pattern used everywhere else in the codebase for "boss in a
fixed room" fights (Briar Warden, Den Wraith — see sections 4 and 11), both
of which are **proximity-triggered and infinitely retriable**: the enemy
stays present and interactable until defeated, regardless of how many times
the player flees or loses. The fort fight sequence is the only one that
removes its own retry path.

**Issue #2 — reward can be permanently forfeited, capping `MainQuest` below
3.** At the reporting choice (stage 4 or 5 → 6), "Report what I found" sets
`fort_pay_ticket_ready=true` **and**, if the smugglers weren't already
killed, `smugglers_execution_day = day+5`. "Found nothing" sets neither —
only `fort_quest_stage=6`. Once at stage 6, there is no other path to
`fort_pay_ticket_ready`. This permanently:
- forfeits the 200g reward (no recovery path — Petra's fort-ticket branch is
  gated on `fort_pay_ticket_ready`, which can now never become true),
- caps `MainQuest` at 2 forever (it's only set to 3 inside the Petra
  fort-ticket payment callback),
- leaves the `sluice_reward_given && dispatch_rewarded && MainQuest >= 3`
  bonus dialogue at npcs.js:154 permanently unreachable.

This reads like it could be *intentional* narrative writing ("lying to your
supervisor costs you the reward"), and if so it's a reasonable design — but
I can't tell from the code whether the `MainQuest` cap and the
now-unreachable bonus dialogue were an accepted consequence or an oversight,
so I'm flagging it rather than guessing. Recommend a design decision here
before touching it.

`smugglers_dead`/`smugglers_execution_day` are otherwise handled correctly:
they're consumed purely to despawn the fort NPCs once resolved
(npcs.js:3230,3253,3282), and `smugglers_dead` is set unconditionally on the
Essa kill (combat.js:857) regardless of what the player later tells the
Supervisor, so the "fought them, then lied about it" combination correctly
still despawns the NPCs.

**Save/schema:** all 5 fields present and correctly restored — meaning
**save/load can restore stage 1/2/3, i.e. the dead-locked state itself, with
full fidelity.** This is worth calling out: a save made while soft-locked
stays soft-locked forever, with no in-game indication anything is wrong.

---

## 4. Removal Contract (Briar Warden)

Flags: `warden_quest_started`, `warden_quest_defeated`, `warden_quest_rewarded`

| Stage | Meaning | Set in | Entry | Exit |
|---|---|---|---|---|
| none set | Not offered | — | Requires `sluice_reward_given` | Overseer Mault (Calwick square) offers → choice → `warden_quest_started=true` |
| `warden_quest_started` | Fight available | movement.js collision + interactions.js:601 (proximity trigger near `BRIAR_WARDEN_SPAWN`) | — | Defeat the warden (any number of attempts) → `warden_quest_defeated=true` |
| `+warden_quest_defeated` | Collect pay | Mault dialogue | — | Talk to Mault → 120g, `warden_quest_rewarded=true` |
| `warden_quest_rewarded` | Complete | — | — | Terminal, passage description only |

**Reachability:** fully reachable. **Dead ends: none** — this is the
retry-safe pattern the fort quest (section 3) should match: the warden is a
persistent, proximity-triggered obstacle (also blocks `canWalk()` while
active), so fleeing or losing just ends that one combat; the player can
simply walk up and try again indefinitely. **Save/schema:** correct. **Sync
gap:** `combat.js:826`'s `warden_quest_defeated = true; refreshJobBoard();`
does not call `syncQuestFlagsToWindow()` (harmless, per the note above).

---

## 5. Schilling the Bear

Flags: `schilling_quest_started`, `schilling_returned`

| Stage | Meaning | Set in | Entry | Exit |
|---|---|---|---|---|
| neither | Not started | — | Talk to Pip (Calwick school, day≥2) | `schilling_quest_started=true` |
| `schilling_quest_started` | Bear lost in dungeon | Pip action (npcs.js:949) | — | Defeat Wrongteeth (dungeon floor 5) via either "Kill it" or "Let it hold you" — **both** grant the Schilling item if `schilling_quest_started && !schilling_returned` (combat/interactions.js:3577,3619) |
| holding "Schilling" item | Ready to return | Boss-defeat choice callback | — | Return to Pip → Cat-Shaped Key, `schilling_returned=true` |
| `schilling_returned` | Complete | Pip action (npcs.js:921) | — | Terminal |

**Issue #3 — sequence-break can permanently miss the quest.** Wrongteeth
(`BOSS`) is a unique, one-time fight — `BOSS.defeated` becomes permanently
true the moment either choice is picked, with no re-fight mechanism. Nothing
in the game gates dungeon-floor progression on having visited Pip first. If
the player reaches and defeats Wrongteeth *before* ever talking to Pip
(`schilling_quest_started` still `false`), neither victory branch grants the
bear (both explicitly check `schilling_quest_started && !schilling_returned`
first). The player can still visit Pip afterward and set
`schilling_quest_started=true`, but the bear is now unobtainable forever
(Pip's "still in there" waiting dialogue, npcs.js:929, becomes permanent) —
so `schilling_returned` can never become true, and the Cat-Shaped Key can
never be obtained. This is a soft, avoidable sequence-break (a completionist
issue, not something an average linear playthrough is likely to hit, since
Pip is introduced early via the job board / town NPCs), but it is a genuine
permanent dead end.

**Reward-item note (not a dead end, but worth flagging):** the "Cat-Shaped
Key" granted here (npcs.js:920) is never read, checked, or consumed anywhere
else in the codebase — I grepped every occurrence. The comment in quests.js
line 44 says it's "used later in the cat-quest arc," but the cat quest
(section 6) never references it. Either the linkage was removed/never
finished, or I'm missing something outside the files in scope — flagging
rather than editing the comment, since I can't confirm which.

**Save/schema:** correct. **Sync gap:** `schilling_quest_started=true`
(npcs.js:949) doesn't call `syncQuestFlagsToWindow()`; the return callback
does.

---

## 6. Pell's Secret (`cat_quest_stage`)

| Stage | Meaning | Set in | Entry | Exit |
|---|---|---|---|---|
| 0 | Normal | — | — | Rest in player's bed → 1 |
| 1 | Cat drops a coin next visit | bed-rest (interactions.js:2774) | Interact with cat (player house) | → 2 |
| 2 | Cat will show stash corner | interactions.js:2686 | Interact with cat → choice "Look in the corner" | → 3 |
| 3 | Stash found (done) | interactions.js:2712 | — | Terminal — falls through to generic Pet/Leave |

**Reachability:** fully reachable, entirely contained to the player's house,
no combat, no NPC that can vanish. **Dead ends: none.** Does **not** in fact
depend on the Cat-Shaped Key from section 5, despite the quests.js comment
implying a connection — confirmed by grep, no cross-reference exists in
either direction. **Save/schema:** correct, all sync calls present here.

---

## 7. The Weight Discrepancy (`weight_quest_stage`)

| Stage | Meaning | Set in | NPC/Location |
|---|---|---|---|
| 0 | Unstarted | — | Harbormaster Renn (`harbormaster_interior`, Drenwick) |
| 1 | Renn briefed, go to Aldric | Renn "take" choice | Aldric (`office`, Calwick — static, always present when office open) |
| 2 | Aldric done, go to Corvin | Aldric callback | Corvin (`office`/`inn` — relocates on Dayoff, same pattern as Petra) |
| 3 | Corvin signed, return to Renn | Corvin callback | Renn |
| 4 | Paid, complete | Renn callback (+60g) | Terminal |

**Reachability:** fully reachable. All three offices/NPCs correctly close
and relocate together on Dayoff (`isClosedToday('office')` blocks entry the
same day `Petra`/`Corvin`/`Renn` relocate or disappear) — no window where a
required NPC is unreachable. **Dead ends: none.** No combat, no failure
path. **Save/schema:** correct, sync calls present at every transition.

---

## 8. Between Posts (`drama_stage`)

| Stage | Meaning | NPC |
|---|---|---|
| 0 | Unstarted (gated on `dispatch_rewarded` before Sena offers the letter) | Sena (Calwick square) |
| 1 | Carrying note 1 to Davan | Davan (Drenwick market) |
| 2 | Carrying reply to Sena | Sena |
| 3 | Carrying note 3 to Davan | Davan |
| 4 | Carrying final note to Sena | Sena |
| 5 | Complete (+25g) | Terminal |

**Reachability:** fully reachable — clean alternating ping-pong, both NPCs
statically located (no day-gating), each stage has a "wrong NPC" waiting
line and a correct-NPC advance line. Nice touch: won't offer the errand
until the player has already been to Drenwick once (`dispatch_rewarded`),
so it never sends a first-time player somewhere they don't know how to
reach. **Dead ends: none.** No combat. **Save/schema:** correct, sync calls
present at every transition (the most consistent quest in the codebase on
this point).

---

## 9. The Pale Sentry

Flags: `sentry_quest_started`, `sentry_quest_done`, `sentry_quest_rewarded`, `pale_sentry_hp`

| Stage | Meaning | Set in |
|---|---|---|
| none | Not offered | — |
| `sentry_quest_started` | Creature roams MAP_N2, 500 HP persists across encounters | Constable Tarvec accept choice; `pale_sentry_hp=500` |
| `+sentry_quest_done` | Killed | combat.js:870 (enemy HP reaches 0) |
| `+sentry_quest_rewarded` | Paid (100g) | Tarvec dialogue |

**Reachability & retry-safety:** this is the best-designed persistence
pattern in the codebase. The sentry is a **random encounter** (not a fixed
NPC) that only fires while `sentry_quest_started && !sentry_quest_done`; its
HP is explicitly persisted on every `endCombat()` call regardless of how
combat ended (`pale_sentry_hp = Math.max(0, combat.enemy.hp)`,
combat.js:220), so fleeing or losing simply preserves whatever damage was
already dealt and lets the player re-encounter it later. **Dead ends:
none.** **Save/schema:** correct, including `pale_sentry_hp` itself.

---

## 10. Still Water (sickle)

Flags: `sickle_quest_stage`, `gridd_rainfish_warned`, `rainfish_woken`

| Stage | Meaning | Set in |
|---|---|---|
| 0 | Unstarted (notice on Drenwick market board) | — |
| 1 | Quest given, sickle at pond (MAP3_N1) | Reading the Drenwick job board |
| 2 | Retrieved clean (avoided the rainfish danger zone) | Sickle pickup, `!rainfish_woken` |
| 3 | Retrieved churned (walked through the danger zone, fought the mandatory 3-fight rainfish chain first) | Sickle pickup, `rainfish_woken` |
| 4 | Complete (+300g clean / +80g churned) | Mabel (hamlet) |

`gridd_rainfish_warned` is pure flavor (changes one line of Gridd's dialogue
text) with no mechanical effect. `rainfish_woken` gates a one-time forced
3-fight combat chain (`startRainfishCombat`, cannot flee mid-chain by
design) triggered by *walking into* a specific tile region — not an NPC, so
it can't disappear.

**Reachability & retry-safety:** confirmed no dead end even on a rainfish
chain loss — `rainfish_woken` is set *before* combat starts (at the
movement trigger), so losing the fight just costs gold/HP via the normal
defeat handler; the sickle item is still sitting at its position afterward
and picks up correctly via the "already woken" (stage 3, churned) branch.
**Dead ends: none.** **Save/schema:** correct, sync calls present.

---

## 11. The Unoccupied Property (Den Wraith)

Flags: `den_wraith_quest_started`, `den_wraith_defeated`, `den_wraith_rewarded`

| Stage | Meaning | Set in |
|---|---|---|
| none | Not offered (visible from day≥11 via Calwick job board) | — |
| `den_wraith_quest_started` | Wraith active in house `west_i`, Dayoff-only entry | Reading the Calwick job board |
| `+den_wraith_defeated` | Killed | combat.js:758, proximity-triggered fight inside the house, same retry-safe pattern as the Briar Warden |
| `+den_wraith_rewarded` | Paid (200g) | Morden (Calwick square) |

**Reachability & retry-safety:** confirmed retry-safe — same proximity-
trigger pattern as the Briar Warden (section 4), not the fort quest's
disappearing-NPC pattern. Fleeing/losing just ends that attempt; the wraith
is still there next Dayoff. **Dead ends: none.** **Save/schema:** correct.

---

## 12. The Long Way Round (Dessa & Orwen)

Flags: `letter_quest_stage` (0-7), `dessa_met`

An 8-state alternating quest between Dessa (`drenwick_west_a`) and Orwen
(`apt_1`, Calwick), fully mapped 1:1 with a "waiting" line on the wrong side
at every stage and exactly one valid advance path per stage (0→1→2→...→7).
`dessa_met` gates a mandatory first "introduction, no quest yet" visit
before Dessa will offer the quest at all — a light rapport gate, not a
progression risk since it just delays the offer by one visit, never blocks
it.

**Reachability:** fully reachable — no combat, no failure path, both NPCs
statically located in their houses (not day-gated). **Dead ends: none.**
Purely narrative — no material reward at completion (stage 7), which is
consistent with its emotional framing rather than a bug.

**Sync gaps:** noticeably more here than other quests — the 0→1, 2→3, and
4→5 transition callbacks (interactions.js:2993, 3049, 3087) do not call
`syncQuestFlagsToWindow()`; only 1→2, 3→4, and 5→6 (Orwen's side) do. As
established, no functional impact, but worth normalizing if this file is
ever revisited for style.

**Save/schema:** correct for both flags.

---

## 13. Netto's Letter (`netto_letter_received`)

Non-quest flavor delivery: Supervisor holds a letter from the player's
brother, delivered once `day > 6` on next office visit. One-shot,
`stats.items` gets a flavor accessory, flag set, never re-triggers
(`day > 6 && !netto_letter_received` guard). **Dead ends: none — this is
the simplest possible flag and it's implemented correctly.** Notably this
*is* one of the few mutation sites that correctly calls
`syncQuestFlagsToWindow()` (interactions.js:265). **Save/schema:** correct.

---

## 14. The Voss Dilemma (`dilemma_voss`) — outside `quests.js`

`dilemma_voss: null | 'report' | 'protect' | 'abstain'`, declared in
`state.js`, **not** part of `QUEST_FLAG_SCHEMA`, **not** synced by
`syncQuestFlagsToWindow()`. This looked suspicious at first glance (a
quest-like flag entirely outside the schema system), but `save.js` has an
explicit comment acknowledging it (`// dilemma_voss: main.js var, not in
syncQuestFlagsToWindow — remains in location block below`, save.js:262) and
correctly saves/restores it as a direct property in the main save-data
object rather than through the schema spread. **This is intentional and
correctly implemented, not a bug** — just organizationally inconsistent
with every other quest flag, which may be worth normalizing for
maintainability but has no functional issue.

The quest itself is a one-shot, three-branch moral-choice vignette
(`apt_voss`, Drenwick) with no reward and three terminal epilogue states.
**Dead ends: none — not applicable (no further progression by design).**

---

## 15. Mirethyst's Vault (`window.mirethyst_rewarded`) — outside `quests.js`

The **only** flag in the codebase that lives *purely* on `window` — there
is no plain `let` binding anywhere, and gameplay code reads
`window.mirethyst_rewarded` directly (npcs.js:3918), which is the one
exception to the "window mirror is debug-only" rule established at the top
of this report. Functionally this is fine (`undefined` is falsy, behaves
identically to `false` pre-set), and `save.js` correctly persists it
(`mirethystRewarded: !!window.mirethyst_rewarded`, restored at save.js:448)
as a direct property, same pattern as `dilemma_voss`.

One-shot NPC gift (Fen Cowl armor, DEF+4) in Mirethyst's Vault, gated purely
on `!window.mirethyst_rewarded`, granted permanently on first interaction.
**Dead ends: none.** Flagging only because it's a structurally distinct
pattern from every other flag and worth knowing about if `quests.js`'s
save/schema system is ever refactored.

---

## 16. `cabinetCaseFlag` — orphaned, effectively dead — ✅ RESOLVED

Declared, schema'd, synced, and read (interactions.js:1458, gates one
"disturbed files" flavor line on the Calwick office filing cabinet) — but
**never once set to `true` anywhere in the codebase.** I grepped every
assignment to this variable; the only ones are its own `let` declaration and
`window.` mirror. Its own comment says "set true when a case plants
something in the cabinet," implying a hook that was either removed or never
wired up. Not a dead end in the "stuck progression" sense — it's just
permanently unreachable flavor text under current code, harmless but
vestigial.

**Fix applied:** wired into the Weight Discrepancy quest (section 7) as a
mandatory completion step. A new flag, `weight_note_signed`, tracks whether
Corvin has countersigned the correction (still within `weight_quest_stage
=== 2`); once true, Aldric redirects the player to file the note themselves
at the Calwick office's Filing Cabinet rather than doing it in person — he's
"elbow-deep in the quarterly intake." The cabinet itself is the actual
decision point (not any NPC dialogue), offering a 3-option branching choice:
two options file the note properly (setting `cabinetCaseFlag = true` and
advancing `weight_quest_stage` to 3, unlocking Renn's payoff), and a third
("This isn't your job — find Aldric instead") declines without setting
anything, looping the player back to Aldric's same redirect rather than
dead-ending — so the flag's change is mandatory to complete the quest, but
declining once is a stall, not a trap. Esla, seated by the *other* office
cabinet, gets a reactive line once the flag is set ("Someone's been in
Aldric's cabinet... I notice more than I say"), and that other cabinet
(`ESLA_CABINET`) gets a misdirecting hint line during the mid-quest window
pointing the player to the correct one — deliberately so a first-time player
can't immediately tell which cabinet, or which of the cabinet's three
options, actually matters. Regression coverage:
`test/cases/14-cabinet-case-weight-quest.test.js`, which drives the whole
sequence through real dialogue/choice-box state (including the decline
loop and re-triability) rather than calling internal functions directly.

---

## Issues Found (summary)

Ranked by severity:

1. **[SEVERE — RESOLVED] Fort quest permanent soft-lock** (section 3).
   Fleeing or losing the guard/Polwick/Essa fight left `fort_quest_stage`
   stuck at 1/2/3 forever, since the only NPCs that could re-trigger those
   fights were hidden from that point on and nothing reset the stage. Fixed:
   each combatant's `get map()` getter (npcs.js) now stays visible during
   its own in-progress stage (guard: stage 1, Polwick: stage 2, Essa: stage
   3) in addition to stage 0, and `interactSmugglerFort()` (interactions.js)
   now re-triggers that stage's fight on proximity, matching the retry-safe
   pattern already used by the Briar Warden and Den Wraith fights.
   Regression test: `test/cases/07-fort-quest-retry.test.js`.
2. **[MODERATE — RESOLVED] Fort quest reward could be permanently
   forfeited** (section 3, Issue #2) via the "Found nothing" choice at the
   reporting step. Fixed: "Found nothing" now issues a reduced 15g pay
   ticket (new `fort_pay_ticket_reduced` flag, fully wired through
   `QUEST_FLAG_SCHEMA`/`syncQuestFlagsToWindow`/`loadGame`, same pattern as
   every other quest ticket) instead of withholding the reward outright, the
   Supervisor's reaction now includes an explicit disappointment beat, and
   `MainQuest` still advances to 3 via the same Petra ticket-redemption path
   used by the honest report. The full 200g "Report what I found" path is
   unchanged. Regression test:
   `test/cases/08-fort-found-nothing-ticket.test.js`.
3. **[MINOR] Schilling quest can be permanently missed by sequence-breaking**
   (section 5, Issue #3) — defeating Wrongteeth (a unique, one-time fight)
   before ever talking to Pip locks `schilling_returned` at `false` forever,
   since nothing else can re-grant the Schilling item.
4. **[COSMETIC] "Cat-Shaped Key" reward item has no consumer anywhere** in
   the codebase, despite a comment claiming it's used in the cat-quest arc
   (section 5). Not a dead end (the item is granted successfully), just
   unfinished/orphaned linkage — or an inaccurate comment.
5. **[COSMETIC — RESOLVED] `cabinetCaseFlag` is permanently unreachable** —
   declared, schema'd, read, but never set (section 16). Fixed: wired into
   the Weight Discrepancy quest as a mandatory completion step (filing the
   countersigned note at the Calwick office cabinet), with new branching
   dialogue at Aldric and the cabinet itself, and reactive flavor from
   Esla. Regression test: `test/cases/14-cabinet-case-weight-quest.test.js`.
6. **[COSMETIC] Inconsistent `syncQuestFlagsToWindow()` usage** across
   mutation sites, most noticeably in the Long Way Round quest (section 12)
   and the Sluice/Warden quests. Confirmed to have **no functional impact**
   on save/load, since `saveGame()`/`validateSaveSchema()` self-sync
   immediately before reading. Worth normalizing for consistency, not
   urgency.
7. **[COSMETIC] Organizational inconsistency, not a bug:** `dilemma_voss`
   and `window.mirethyst_rewarded` (sections 14-15) are quest-like state
   that live entirely outside `quests.js`/`QUEST_FLAG_SCHEMA`, each with
   its own bespoke (but correct) save/load handling. Both verified correct;
   flagged only for future maintainability.

No other dead ends, unreachable stages, missing setters, missing dialogue
branches, or save/schema gaps were found across the other 11 quest chains.
Reward-repeat exploits: none found anywhere — every reward-granting
callback is gated by a flag that flips before the callback can re-fire.

## Answering the audit's structural questions directly

- **Every stage reachable?** At audit time, all stages were reachable
  *except* fort-quest stages 1/2/3 post-flee/loss. **Update:** the fort
  quest's soft-lock and reward-forfeiture (Issues #1 and #2) have since been
  fixed — see the "RESOLVED" entries below. Every stage in every quest is
  now reachable and exitable, with one still-open exception: the Schilling
  sequence-break (section 5, Issue #3) remains unfixed by design — it was
  explicitly out of scope for the fort-quest fix pass.
- **Dead-end states found?** At audit time: one severe (fort quest
  mid-fight), one moderate (fort quest reward forfeiture) — both now fixed,
  see "Issues Found" — and one minor (Schilling sequence-break), still open.
- **Save/schema/sync gaps?** No structural gaps (37/37/37/37 alignment
  confirmed programmatically, updated from 36 after adding
  `fort_pay_ticket_reduced` for the fort-quest fix). Numerous individual
  mutation sites skip `syncQuestFlagsToWindow()`, but this has been verified
  to have zero functional effect given how the window mirror is actually
  consumed.

---

## Suggested Regression Tests

In priority order, for the existing `test/` harness (see `test/README.md`
for the house style — fresh `createContext()` per test, `g.press`/`g.run`,
etc.):

1. **Fort quest fight-loss recovery (regression guard for Issue #1).** Set
   `fort_quest_started=true`, walk into the smuggler fort, trigger the
   guard fight via Polwick's "arrest" choice, deliberately lose or flee it,
   then assert whether the player has *any* remaining path to progress
   (currently: none). This test should currently *fail* if written to
   assert "quest is still completable" — write it that way deliberately so
   it starts red and turns green the moment this is fixed, rather than
   quietly encoding the bug as expected behavior.
2. **Sluice → Dispatch → Fort → `MainQuest` full happy path.** Drive
   `sluice_job_started` through `MainQuest=3` end to end via real
   Supervisor/Petra/Veth/Polwick-fight-won interactions, asserting the
   `MainQuest` value at each milestone. High value: it's the main quest
   spine and touches the most files (`quests.js`, `combat.js`,
   `interactions.js`, `npcs.js`).
3. **Fort quest "Found nothing" branch (regression guard for Issue #2).**
   Reach stage 4 or 5, choose "Found nothing," assert `fort_pay_ticket_ready`
   stays `false` and `MainQuest` stays capped — documents current behavior
   precisely so a future change to this (intentional or not) is visible in
   a diff instead of silent.
4. **Briar Warden and Den Wraith retry-after-flee.** Start each quest, lose
   or flee the fight once, confirm the fight is still triggerable
   afterward and eventually completable. These are the "known good"
   pattern — good regression coverage to make sure a future refactor
   doesn't accidentally make them match the fort quest's broken pattern.
5. **Schilling sequence-break (regression guard for Issue #3).** Defeat
   Wrongteeth with `schilling_quest_started` still `false`, then talk to
   Pip afterward; assert the bear/key can never be obtained — again,
   written to document current behavior rather than silently encode it as
   "correct."
6. **Save/load mid-quest for at least one multi-stage quest.** Pick one
   with numeric stages (e.g. `letter_quest_stage` or `sickle_quest_stage`),
   advance to a middle stage, save, mutate away, load, confirm the exact
   stage and any related item/gold state round-trips. The existing
   `06-save-load.test.js` covers the save/load *mechanism* generically;
   this would cover a *specific quest's* full state (items granted,
   flags, NPC dialogue branch reached) round-tripping correctly.
7. **Pale Sentry HP persistence across a flee.** Damage it partway, flee,
   re-encounter, confirm HP is carried over rather than reset — this is the
   one quest with genuinely nontrivial persisted numeric state
   (`pale_sentry_hp`) and deserves its own explicit check independent of
   the general combat test already in the suite.

Lower priority (clean, low-complexity, low-regression-risk quests — cheap
to add later but not urgent): Weight Discrepancy, Between Posts, Pell's
Secret, The Voss Dilemma, Mirethyst's Vault, Netto's Letter.
