# Fine Needlework — implementation contract

Optional smuggling delivery in the existing rooms and geography. Chuggie uses the tavern/common room of Wold's Gate Inn; Esla waits at Ledger House. No invented parcel contents, forced encounter, faction system, or MainQuest advancement. Names and dialogue are revisable content.

Eligibility reuses `polwickLighthouseOutcome() === 'allied'`: the established terminal spared-and-concealed outcome, written by leaving the smugglers alive and reporting “Found nothing.” Alive, unresolved, killed and truthfully reported outcomes do not qualify.

One registered protected item, `Embroideries Parcel`, and one numeric quest stage: 0 unstarted; 1 carrying; 2 delivered awaiting reunion; 3 withdrawn awaiting reunion; 4 completed and reunited; 5 withdrawn and reunited. Delivery pays 1,500g once; withdrawal never pays and allows another offer only after reunion. Chuggie can always take an active parcel back even if Polwick becomes unavailable.

Persistent party ownership remains canonical. Recruited membership and character records are unchanged by temporary absence. Active views/menus, battle installation, participation rewards, care/rest/recovery and travelling dialogue exclude absent members. Availability uses authenticated prepare/validate/apply receipts and optional serialized absence records `{characterId,reason,returnMapId}`; missing records in existing v5 saves default to none. Rejoining restores the same record without recruitment or equipment grants. Acceptance requires living Lély and validates cargo, quest and party changes before any mutation. Candidate save invariants validate quest/cargo/absence together before load commits. SAVE_VERSION stays 5.

A transient Esla projection places her beside Lély for the warning and shows departure using existing sprite/staging conventions. The inn projection is visible only while her canonical absence exists. There is no duplicate recruited character or saved sprite position. The main party's past MQ5/camp invariants continue to read recruitment history, while present-tense scenes read active availability.

Root owns shared party/save/quest/NPC integration and final review. Read-only audit establishes branches, locations and caller risks. Content agent owns only the new frozen dialogue file. Verification agent owns only new focused suites 325/326. No Git mutation or edits to other worktrees; leave uncommitted.

## Implemented lifecycle and presentation

| Stage | Meaning | Parcel | Esla | Next action |
|---|---|---|---|---|
| 0 | Not accepted | None | Travelling | Allied offer; accept or decline |
| 1 | Carrying | Exactly one protected key item | Ledger House | Deliver to Polwick or return to Chuggie |
| 2 | Delivered, paid | None | Ledger House | Reunion; no further offers |
| 3 | Withdrawn, unpaid | None | Ledger House | Reunion before another offer |
| 4 | Completed and reunited | None | Travelling | Repeatable completion acknowledgement |
| 5 | Withdrawn and reunited | None | Travelling | Eligible to accept again |

Chuggie is at tile centre (9.5, 7.5) in `MORNAY_GATE_INN_MAP`, the existing
Wold's Gate Inn common room. Esla waits at (13.5, 9.5) in
`MORNAY_COMMERCIAL_INN_MAP`, Ledger House. The waiting spot was moved north during
visual review so she remains visible above the dialogue box. Existing interiors,
fixtures, residents and entrances are unchanged. Room identities use the existing
`mornayContentKey()` authority.

The warning stages Esla on nearby clear floor without teleporting Lély. A bounded
room search checks an orthogonal departure path against the existing terrain,
furniture, NPC and player collision authority. Ordinary movement, other NPC routes,
combat entry and save/load pause during the offer/departure; dialogue and the
explicit choice remain usable. After her last acceptance line she walks towards
the existing exit. A stalled presentation releases its transient route and keeps
the authoritative waiting state; it cannot duplicate the parcel or companion.
Reunion applies after her final words, removing the inn projection.

Final authored dialogue is in `content/interactions/fine-needlework-dialogue.js`.
Representative lines:

- Chuggie: “Our usual associates won’t take the road now. Too dangerous, they say.
  Get the parcel to Polwick at the old fen post, and he’ll pay you 1,500 gold.”
- Esla: “Embroideries. Of course. Lély, he’s asking you to smuggle for him.
  Please don’t take it.”
- Esla: “I won’t be part of this. If you accept, I’ll wait at the Ledger House
  here in Mornay. You’ll be making that journey without me.”
- Polwick: “Still tied. Good. Fifteen hundred, as agreed.”
- Esla on reunion: “I’m not going to ask what you’ve been doing. Please don’t
  tell me.” Then: “Right. Let’s get back to it.”

Speaker metadata gives only Esla's words her established green style. NPC headers
and panel chrome remain neutral. No parcel contents or wider faction connection
are asserted. Existing lighthouse reward turn-in has priority over this delivery;
parcel handoff then precedes ambient offers/reminders. Polwick's three existing
Esla conversations do not run or advance while she is absent.

## Delegation and review

- Audit agent: read-only Polwick branch tracing, room/collision inspection and
  recruited-versus-present caller audit. Accepted the terminal alliance authority
  and the two existing inns; refined the waiting coordinate after visual review.
- Content agent: only the new frozen dialogue/journal file. Accepted its explicit
  warning, repeatable decline/return/reoffer text, unspecified contents and reunion.
- Verification agent: only suites 325/326. Accepted the state, ordinary-control,
  solo combat/defeat/ferry and save tests. Its ordinary input test exposed a room-key
  mismatch that direct owner tests missed; the root corrected both NPC projections
  to use `mornayContentKey()`.
- Root: all shared state, save, interaction, staging, rendering and final integration.

## Changed-file ownership

- `fine-needlework.js`: lifecycle, atomic preflight, cross-save invariants and
  transient offer/departure presentation.
- `content/interactions/fine-needlework-dialogue.js`,
  `content/npcs/fine-needlework-npcs.js`: authored text and two NPC projections.
- `persistent-party.js`, `canonical-party-combat.js`: reusable availability,
  active-slot battle installation/commit, active-only participation and recovery.
- `quests.js`, `save.js`, `items.js`, `validation.js`: registered stage, protected
  parcel, journal, candidate preflight and data validation.
- `npcs.js`, `content/interactions/calwick-interactions.js`,
  `content/interactions/north-basin-interactions.js`,
  `content/interactions/thornmere-wilds-interactions.js`: active-presence dialogue,
  Polwick turn-in dispatch and speaker registration.
- `travellers-rise-ambush.js`, `travellers-rise-camp.js`,
  `travellers-rise-night.js`, `scripted-party-encounters.js`: present-tense scene
  eligibility; recruitment-history invariants are retained.
- `activity-ownership.js`, `input.js`, `movement.js`, `story-checkpoint-lab.js`:
  bounded scene ownership, controls and transient reset.
- `render-mornay.js`, `render-entities.js`, `index.html`: depth-sorted quest actors,
  reuse of Esla's walking figure and script registration.
- `test/cases/325-fine-needlework.test.js`,
  `test/cases/326-temporary-party-availability.test.js`: focused coverage.
- `test/cases/51-save-binding-registry-migration.test.js`: updated exact binding
  snapshot and coherent round-trip fixture for the new flag.
- `test/cases/171-party-command-status-hardening.test.js`: new parcel explicitly
  classified as unavailable in the independent exhaustive combat item matrix.
- `test/cases/58-regional-content-split.test.js`: aggregate includes the quest NPC
  list while retaining exact ownership/count assertions.
- `test/cases/313-mornay-room-painter-order.test.js`: renderer accounts for all
  registered room actors, including the new visitor, with one-draw and depth checks.
- `architecture.md`, `PROJECT_STATUS.md`, this document: implementation contracts.

## Playtest checklist and limitations

1. Use a post-MQ5 save with Polwick spared and the Supervisor told “Found nothing.”
   Visit Chuggie at Wold's Gate Inn; decline first, then accept after Esla's warning.
2. Watch Esla depart. Check the solo menu and protected notebook parcel. Save/load.
3. Visit Ledger House: she refuses reunion while the parcel is present.
4. Return the parcel to Chuggie; confirm no payment. Rejoin Esla, then accept again.
5. Travel west via the paid return ferry, deliver to Polwick, and verify 1,500g once.
   If holding the lighthouse gem, turn that in first and talk again for delivery.
6. Return to Ledger House and finish her reunion dialogue. Confirm her previous
   health, statuses, equipment and progression, and that Chuggie has no second job.
7. Also try killed/reported/unresolved Polwick saves; none should offer the parcel.

Automated browser checks use ordinary keys for local approach, choices and dialogue,
with validated placement between rooms. They are not a manual end-to-end wilderness
round trip. No forced encounters, new destinations, encounter rebalancing, faction
reputation or MQ5 advancement are added. General follower rendering and companions
beyond the existing authored roster remain outside scope.

## Verification evidence

Focused suites 325 and 326 contain 12 lifecycle/staging checks and 8 party integration
checks. These exercise ordinary held/tapped local movement and dialogue, exact saved
character preservation, both ferry presentations, authentic solo victory and defeat,
scripted battle routing, paid rest, treatment exclusion, field/menu exclusion,
protected parcel, both resolution paths, re-offering, one-time payment, lighthouse
priority, old-v5 defaults and malformed-save rejection before mutation.

Real headless Chromium runs the local acceptance/departure/inn/withdrawal/reunion
sequence at 512×480 and 1024×960 display sizes, using actual DOM key events.
Screenshots were visually reviewed; all 24 authored dialogue pages additionally
passed real Canvas glyph-bound measurements. This is browser automation plus image
inspection, not a claimed manual end-to-end wilderness playthrough. The independent
read-only audit's final review reported no evidence-backed normal-gameplay defects.

All 29 changed/new JavaScript files pass `node --check`. `validateGameData()` reports
zero errors and the six existing reviewed warnings. Map/catalogue totals remain
1,244; all 1,058 regional grid authorities are untouched. No geography, artwork,
transition report or fingerprint artifact was regenerated. `SAVE_VERSION` remains 5.
`git diff --check` and changed-file conflict-marker checks pass.

The initial full run passed 259/262 suites; three pre-feature expectations required
explicit updates for the new protected item and two quest NPC entries. The exact
binding list, exhaustive unavailable-item matrix, NPC aggregation and room painter
assertions retain their substantive checks. All affected suites pass individually.

Final complete regression: **262 suites passed, zero failed**. This includes the
historical singleton/Formation/party/Resonance tests, existing Mornay circulation
and service suites, save boundaries, geographic fingerprints and both ferry
presentations. No production changes were made after the final run started.

Delivery state: branch `main`, HEAD `d2861931401ccb6256137ae76646610cecb48084`
unchanged from the clean starting checkout. The 33 listed implementation,
documentation and test files remain unstaged/uncommitted. Nothing was committed,
merged, rebased or pushed; no other worktree was changed.
