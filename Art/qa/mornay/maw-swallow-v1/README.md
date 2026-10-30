# Peat-Bed Maw: Swallow — 2026-10-29

Requested follow-up to the uncommitted Mornay job board. Work remains on `main`
at `dc425d2`; prior jobs and other existing changes are preserved. No commit/push.

## Player rule and tuning

The Peat-Bed Maw is a giant mouth rooted under the drying ground. Its field and
battle sprite is new deterministic programmatic art, with peat-covered lips and
uneven ivory teeth. No new tile type, image asset or geographic edit.

The party gets **six complete combat rounds**, not six individual character
commands. Planning/menu time does not count. Every surviving participant can
act on round six; its delayed Bomb damage also resolves before the deadline.
If the Maw is still alive, **Swallow** takes every living party member, bypassing
armour and evasion. A two-second mouth-emergence/engulfing/closing animation plays
before the player can advance playback. Ordinary defeat recovery follows.
There are no lost characters or permanent capture state. Escape remains possible;
failed escapes and non-damaging actions still spend a round. Retry resets the
round counter and the Maw's HP. A kill or successful escape on round six wins
precedence over Swallow.

HP **480**, Attack **18**, Defence **12**, Speed **9**. HP rose from 360; basic
Attack fell from 38 so ordinary damage does not eclipse the damage deadline.
The required average is 80 damage per round. The 250g giver payment and 210 XP,
accepted/cleared/paid quest stages and target location are unchanged. No changes
to the Snapper, other encounters, progression or save schema/version 5.

Iset now describes a mouth in the ground. Esla warns explicitly about six rounds
and spending damage supplies. Field warning, Observe, notebook and the visible
countdown reinforce the rule. Only available Esla speaks; her words remain green.

## Automated evidence

Suite 340 covers solo/two-member parties surviving five full rounds, exact
sixth-round defeat, every sixth-round action preceding Swallow, final-action
victory, a Bomb killing at the deadline, successful final-round escape, normal
defeat/no reward, save/load and retry at round zero. It rejects altered deadline,
missing victims, altered HP and omitted-event history. Playback and rendering
consume no RNG and mutate no party, quest or canonical resource state. Confirm
cannot skip the animation; elapsed-time completion unlocks it. Invalid authored
deadlines fail closed. Suite 339 retains the entire three-job lifecycle checks.

A reproducible balance witness uses the normal MQ5 assignment-ready checkpoint:
Lely level 10 with Dragon Blade and Esla level 11 with her standard loadout. Fixed
RNG 0.5, ordinary basic attacks from both characters leave 174 HP and lose on
round 6. Lely attacking while Esla uses one Bomb and four Sapper Charges wins on
round 6. These are existing items; no free supplies are granted. This demonstrates
a demanding but feasible prepared route, not an exhaustive balance survey.

**Final regression: 276 tests, 276 passed, 0 failed.** Focused suites 339/340
also passed independently.

Validation: 0 errors / 6 existing warnings. All 28 changed/new JavaScript files
(including the earlier job-board changes) pass `node --check`. `git diff --check`
passes. No map/transition/camera inputs changed and no geographic artifacts were
regenerated. Registry population stays 75 enemy templates; the existing Maw ID
now declares the one new explicit `swallow_deadline` mechanic.

## Browser evidence

Chrome review through `test/peat-maw-preview.html`, an isolated MQ5 fixture that
loads no saved game. It enters the real encounter via Space/Enter dispatch and
resolves six real shared-engine rounds via dispatched keyboard events. Captures
show the actual resulting immutable combat view, not a fabricated event. The
fixture can replay the presentation clock separately for inspecting keyframes.
Normal wilderness traversal was not repeated for this art/mechanic change.

- `field-1x.png`: mouth in the existing Willow Basin clearing.
- `battle-countdown-1x.png`: 480 HP and six full rounds remaining.
- `emergence-1x.png`: peat opens under the party.
- `swallowing-1x.png`: Lely and Esla descend behind foreground teeth.
- `closed-jaws-2x.png`: closed mouth, party swallowed, UI readable at 2×.

The two-second playback was triggered in Chrome; emergence, descending
characters and closed-mouth keyframes were inspected at native/2× scale.
Browser error log was empty. Final-round victory/recovery and other lifecycle
assertions are automated evidence, not claims of an unassisted browser victory.

## Walkthrough

1. Speak to Iset on Middle Lower West, then travel to Willow Basin (-3,-8), local
   (272,208). Read the new warning and engage.
2. Check the six-round countdown. Try a normal attack-only attempt, observe the
   huge mouth rise and swallow the party, and confirm normal recovery.
3. Return with strong equipment/damage items. Defeat it by the end of round 6,
   then collect Iset's existing fee. Also try an early retreat and retry.
4. At native/2× scale check that the animation stays above the battle UI and
   cannot be skipped while the characters descend.

## Files changed in this follow-up

- `enemy-catalog.js`: Maw HP/Attack and six-round deadline parameter.
- `enemy-capabilities.js`: explicit closed capability/parameter validation.
- `combat.js`: deadline resolution, independently checked replay event, Observe.
- `render-battle.js`: reusable mouth geometry, sprite dispatch and bounds.
- `render-party-battle.js`: countdown, event text and isolated Swallow animation.
- `canonical-party-combat.js`, `movement.js`, `input.js`, `party-combat-lab.js`:
  elapsed animation update, input gating and cleanup using existing owners.
- `mornay-jobs.js`: mouth description, warnings, Esla advice and journal.
- `test/cases/340-peat-maw-swallow.test.js`: mechanics/presentation/balance checks.
- `test/cases/186-enemy-capability-migration.test.js`: retain the exhaustive
  supported-capability snapshot, adding only `swallow_deadline`.
- `test/peat-maw-preview.html`, `.js`: reproducible browser review fixture.
- `ENEMY_CAPABILITY_AUDIT.md`, `architecture.md`, `PROJECT_STATUS.md`,
  `MORNAY_TOWN_PLAN.md`, prior jobs QA index and this folder: current contract,
  evidence and supersession of the old rootworm presentation.

All earlier job-board files remain uncommitted alongside this follow-up.
