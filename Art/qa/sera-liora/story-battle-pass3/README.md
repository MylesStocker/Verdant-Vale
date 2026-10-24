# Story battle Pass 3 — Eclipse review packet

Pass 3 implements Eclipse through shared Resonance. It does not connect a playable
battle caller to breakfast or proceed to Pass 4. All work remains unstaged and
uncommitted on `agent/codex`; nothing is merged or pushed.

## Behavior and shared contract

- Every participant must explicitly know the technique through frozen authored
  `knownTechniques` metadata. Identity/affinity matching grants no knowledge;
  absent lists fail closed. The shared participant policy gates menus, raw
  preflight and detached history without changing snapshots or saves.
- Sera and Liora each explicitly select and confirm Eclipse and its all-enemy
  target set. The first choice never drafts the other character's action.
- Pending consent derives from the existing draft list. Only compatible commands,
  techniques and targets remain enabled. Backtracking withdraws one choice at a
  time and restores alternatives; no additional consent state is persisted.
- Complete round commands retain one choice per living actor. Combined choices
  coalesce into one weighted initiative entry, represented by the authored
  initiator, at the minimum effective participant Speed at preparation. Gear,
  Muddied and retained Slither count. The shared weighted planner is unchanged;
  ordinary attacks/items/Observe/Run keep their existing scheduling.
- Eclipse has Void/Prism metadata and provisional power 120 per enemy. It reuses
  `max(1, power - base DEF)` with HP clamping and no action RNG. This is revisable
  balance data, not a new progression tier or an authored beetle balance claim.
- Both participants confirm the exact ordered living/nondeparted enemy set at
  collection. Execution hits only surviving captured IDs, computes all hit
  witnesses first, applies them simultaneously and emits one shared event.
- Successful execution applies Strain 1 each once; the existing recovery and
  terminal cleanup rules remain authoritative. A required participant becoming
  Fallen/unable to act cancels once without damage, Strain, fallback or retargeting.
- Immutable history verifies every consent, the single minimum-Speed entry,
  weighted intervals, captured/surviving IDs, copied metadata, HP deltas and
  Strain. Captured pure witnesses avoid calling replaceable live scheduling or
  damage helpers. Projection and rendering never repeat effects or RNG.
- Shared presentation adds all-enemy cursors/confirmation, copied hit summaries
  and disabled-command styling. No graphics/assets were authored or changed.

## Implementation files added or changed in this pass

| File | Reason |
| --- | --- |
| `sera-liora-battle-profiles.js` | Static explicit Null/Eclipse and Rainbow/Eclipse knowledge lists |
| `persistent-party.js` | Static explicit Quickbloom knowledge for Esla; Lely definition/state unchanged |
| `resonance.js` | Explicit participant knowledge, Eclipse definition, generic consent/coalescing/Speed policies, all-enemy target side |
| `combat.js` | Strict all-target schema, genuine partial drafts, explicit consent UI, combined scheduling, simultaneous effect, detached replay validation |
| `render-party-battle.js` | All-target confirmation/cursors, copied damage text, shared availability styling |
| `test/cases/180-resonance-mvp.test.js` | Replace obsolete automatic reservation/latest-position expectations with explicit two-/three-person healing consent and one minimum-Speed entry |
| `test/cases/183-canonical-party-combat-integration.test.js` | Exact closed registry assertion includes Eclipse; Esla still only has Quickbloom |
| `test/cases/185-canonical-battle-envelope.test.js` | Exact closed registry assertion includes Eclipse |
| `test/cases/265-offensive-resonance.test.js` | Independent spell tests explicitly choose their intended spell with Eclipse also in the list |
| `test/cases/266-combined-eclipse.test.js` | New focused behavioral regression suite |
| `STORY_BATTLES.md` | Current mechanics and deliberate deferrals |
| `architecture.md` | Shared action/history contract; supersedes former latest-participant wait rule |
| `PROJECT_STATUS.md` | Pass 3 review boundary/current status |
| This README and `verification.json` | Scoped evidence and preservation record |

Only these files differ from the Pass 3 starting snapshot. Of 96 previously dirty
individual files, 84 are byte-for-byte unchanged and 12 were deliberately extended.
Suite 266 and this two-file packet are new. Existing breakfast/courtyard art,
prior QA packets, atlas, world/geographic inputs, save implementation, item data,
story adapter and opening build numbers remain unchanged in this pass. No generated
geographic artifacts needed regeneration.

## Delegation and review

Reused the existing architecture reviewer and focused test writer. The reviewer
remained read-only; the coordinator alone changed production and existing tests.
The test writer edited only new suite 266; the coordinator inspected the entire
file and independently reran it. The review found two concrete defects, both
repaired and regression-tested: malformed ID objects could invoke serialization
hooks before rejection, and detached history called a replaceable live Speed
helper. The final read-only review found no remaining evidence-backed defects
within scope. A narrow pending-consent availability improvement was also accepted.

## Verification

The accepted preceding Pass 2 baseline was 244/244 suites. Final Pass 3 totals,
syntax, validation, hashes, focused checks and exact Git status are recorded in
`verification.json`.

Suite 266 has 23 behavioral groups covering explicit/manual consent, withdrawal,
atomic incompatible-action rejection, 1/2/3-enemy simultaneous effects, exact RNG
budgets, equipment/Muddied/Slither Speed, ordinary scheduling, participant death
and synthetic disablement, surviving captured targets, Strain recovery/cleanup,
renamed authored actors, strict history tampering, captured witnesses, canonical
object/value isolation, reset/fault behavior, no playable caller and malformed
ID hooks/accessors. Suite 180 retains 81 checks including generic two-/three-person
healing combinations. Suite 265 retains its 19 independent offense groups.

Commands:

```sh
node --check <each changed or new JavaScript file>
node -e "require('./test/cases/180-resonance-mvp.test').run(); require('./test/cases/264-story-battle-context.test').run(); require('./test/cases/265-offensive-resonance.test').run(); require('./test/cases/266-combined-eclipse.test').run()"
node test/run.js
# validateGameData() in a fresh test/harness createContext()
git diff --check
```

No maps, grids, encounters or transitions changed in this pass. No geographic
artifact was regenerated; the complete regression includes the existing geography,
fingerprint, transition, save and historical combat compatibility suites.
SAVE_VERSION remains 5; no new save field, quest flag or reward is added.

## Evidence limits and next review

All new execution/selection/replay evidence is automated headless simulation.
Native and 2× cursor/layout checks use a recording Canvas, not a browser playtest.
No new browser or human combat playtest was performed. Actual Buzzy Beetle combat
templates are still absent, so real encounter lethality/balance remains unverified.
Breakfast still performs its existing pre-battle fade back to Lely.

Dot can rerun suites 180, 264, 265 and 266, inspect the shared production diff and
verify that Sera's first choice leaves Liora uncommitted. After playable battle
integration is separately authorized, manual review should check native/2× menu
readability, all-enemy cursors and damage summaries; independently confirm both
choices/backtracking, Strain recovery, cancellation and Lely-state preservation.
Do not treat this packet as authorization for Pass 4.


## Eligibility follow-up for Dot

The remaining gap was that `resonanceParticipants()` matched character, Rareborn
status and affinity without checking authored technique knowledge. It now also
requires membership in the character definition's frozen `knownTechniques` list.
Sera explicitly knows Null/Eclipse, Liora Rainbow/Eclipse and Esla Quickbloom.
Synthetic test casters explicitly receive only their fixture techniques. Nothing
is inferred from affinity, the technique's participant declaration or a caller's
claimed selection. No new capability field or persistent authority is added.

The new regression removes only Eclipse from an otherwise eligible Liora. It
checks both menus, exact raw combined consent rejection before RNG/writes,
detached history rejection, canonical value/reference isolation and a positive
control where both know Eclipse. Replaying the test against the old shared
eligibility source fails, confirming it detects the original gap. The earlier
read-only review predates this follow-up; current automated verification is
recorded separately in `verification.json`. No browser playtest is claimed.
