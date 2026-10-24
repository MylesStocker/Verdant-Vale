# Story-battle Pass 1 — review evidence

Pass 1 adds a reusable transient battle context, Sera/Liora opening builds,
registered equipment and adapters to their existing approved sprites. The
breakfast confrontation still fades to Lely before combat. No playable encounter,
spell, cooperative Tech, new combat menu, retry/aftermath sequence or second fight
is connected.

Game mechanics and revisable equipment/build decisions are recorded in
[`STORY_BATTLES.md`](../../../../STORY_BATTLES.md).

## Shared engine and resource ownership

The call path is:

`storyBattle.createContext` → private `claimStoryBridge.preparePlayer` →
`commandRounds.seed` / shared effective-stat and safety checks;

`storyBattle.begin` → shared lifecycle bridge → existing enemy construction →
`commandRounds.install` → standard `combatPlayerState.session.begin`;

`storyBattle.act` → the existing command/session controller → `resolveRound` →
existing initiative, status, item and Attack resolution → immutable playback;

`storyBattle.complete` → bound, acknowledged terminal snapshot → candidate
validation → bridge finish → one context-resource commitment → outcome handler.

The adapter contains no damage calculation or character-name branch. Builds
supply base stats and equipment separately, so bonuses are applied once by the
shared engine. Different authored profiles need no adapter change. The existing
renderer owns sprite registration and presentation; its Sera/Liora entries use
approved source frames at one common scale and measured feet.

| State | Owner / policy |
| --- | --- |
| Lely stats, statuses, equipment, inventory, XP/gold; canonical roster/companions | Existing `stats`, status and `persistentParty` authorities throughout; never impersonated or snapshot-restored |
| Story resources between fights | Immutable acknowledged context profiles/inventory |
| Story resources during a battle | Existing shared engine members and command state; displayed historical HP comes from playback |
| Completed results | Authenticated against exact runtime members and acknowledged terminal reel; committed once before callback |
| Ordinary statuses / Slither | Persist with HP, equipment and inventory; sample is carried into a fresh round-zero provenance record |
| Encounter-only state | Burn/Dazzled use established battle-end removal; evasion buffs, bombs and round state are discarded |
| Resolver/validation fault | Locked diagnostic; partial engine effects remain applied until explicit discard/reset, with no retry/refund |
| Outcome callback failure/reentrancy | Commitment already consumed; cannot repeat old results or erase a newly started battle |
| Save / reset | No payload additions, SAVE_VERSION 5. Save/load refused for the whole context, including between fights. Explicit discard, cutaway restart/end or checkpoint clears it |

Context ownership also blocks competing combat entry, direct canonical resource
mutation APIs, world simulation and ordinary keyboard input. Special canonical
handoffs, scripted-lifecycle enemies and special escape policies are rejected.
The story capability cannot consume a pending singleton completion receipt.

## Verification

Final complete regression: **243/243 suites passed**. All **17 scoped JavaScript files** and all **37 aggregate changed/untracked JavaScript files** pass syntax checks. The companion `verification.json` records exact final results. Commands include:

```sh
node --check <each changed JavaScript file>
node -e "require('./test/cases/264-story-battle-context.test.js').run()"
node test/run.js
VV_BROWSER_PAGE=sera-liora-courtyard-browser.html \
  VV_BROWSER_OUTPUT=/tmp/story-battle-pass1-browser \
  node test/run-browser-smoke.js
git diff --check
```

`validateGameData()` runs through `test/harness.js` in the established runtime
script order. Final validation has zero errors and the same 14 existing warnings;
SAVE_VERSION remains 5.

Suite 264 has 14 substantive behavior groups, including:

- Both real shared-engine attacks under identical RNG with and without the
  registered gear, including renamed actors and equipment-driven incoming damage.
- Actual Sera/Liora HP/builds and shared renderer integration with approved assets.
- HP/status/Slither/inventory/equipment continuation into a later fixture battle.
- Acknowledged victory/escape/defeat, Fallen actors, canonical HP zero, one-time
  callback, thrown callback and reentrant continuation.
- Invalid/duplicate preparation, zero allocation/RNG on rejection, stale tokens,
  competing ownership, held input, save/load, direct canonical API guards and resets.
- Fault before resolution and after real item consumption/healing/enemy damage;
  partial state is retained without retry or refund until explicit reset.

A controlled shared-engine fixture (1,000-HP ordinary enemy, 100 ATK, 0 DEF, 1 SPD; every RNG draw 0.5) records Sera/Liora hits of 50/46 with equipment and 22/20 without it. The incoming hit is 62 versus 86. Both runs preserve canonical resources exactly. These are fixture measurements, not beetle balance decisions.

Existing exhaustive tests 155 and 171 include the four additional ordinary
registered gear definitions. The inventory fixture grows from 38 to 42 selectable
rows; each new item is explicitly asserted. Tests 165 and 173 retain their closed
forwarder lists with the new authorized story adapter included. No gameplay
assertion was removed.

Rendering of the new battle profiles is tested using simulated Canvas call
records, not browser raster evidence. Separately, the unchanged playable cutaway
was exercised by installed Chromium at 512×480 and 1024×960: 3,291 checks,
22 captures, zero errors and zero combat starts. Those browser checks use real
assets/keyboard events with deterministic update steps; they are not a human
real-time playtest.

No regional grids, transitions, encounters, geographic fingerprints, audit
artifacts, artwork or image metadata were changed or regenerated in this pass.
The 66 prior dirty files outside the seven overlapping integration/documentation
files remain byte-identical, including all existing cutaway art and atlas files.
Only the documented additive changes were made to those seven overlapping files.

## Review and limits

Dispatch configuration: `gpt-6-astra`, High, handled difficult architecture,
isolation and final correctness review; `gpt-6.1-sol`, Medium, handled bounded
pattern investigation and only the new suite 264. The lead's runtime model label
is not available for independent verification. Astra's concrete fault-diagnostic
and between-fights canonical-mutation findings were fixed and covered; its final
targeted review found no remaining concrete defect.

Presentation currently accepts the shared renderer's label and registered sprites;
background uses its existing location presentation. There is no new battle UI or
player-facing entry point. Existing active-cutaway preparation guards remain
closed; a later authored playable handoff must deliberately integrate that owner.
Rareborn definitions record canon only; this pass adds no Resonance bindings,
spells or scheduling changes. All attack and ordinary initiative rules remain
shared. A later encounter remains a test fixture here, not an authored second fight.

## Short walkthrough checklist

1. Use **Play Sera/Liora Cutaway** in the existing debug menu.
2. Finish the bedroom and courtyard, walk to the breakfast terrace and advance
   keeper/gate/confrontation dialogue.
3. Confirm the existing pre-battle fade and infirmary return, with no battle menu.
4. Smoke-test ordinary Lely combat and a recruited Lely/Esla encounter separately.
5. Review the builds and ownership evidence before authorizing the next pass.

## Git and scoped file inventory

Worktree: existing Codex checkout. Branch `agent/codex`.
Starting and final HEAD: `df88701eb9f4fb0559b0d402a5fb63baab34aa28`.
Everything remains unstaged and uncommitted. No branch changes, commits, merges,
rebases, pushes or deployments were performed. Main and other worktrees were
untouched. Main remains clean at `fb42db428b9e6217cbacaadf77dec9fdd4f08a3e`.

The following is the Pass 1 increment, separate from pre-existing dirty work:

- `PROJECT_STATUS.md`
- `STORY_BATTLES.md`
- `activity-ownership.js`
- `architecture.md`
- `combat.js`
- `index.html`
- `input.js`
- `items.js`
- `movement.js`
- `persistent-party.js`
- `render-party-battle.js`
- `save.js`
- `sera-liora-battle-profiles.js`
- `story-battle.js`
- `story-checkpoint-lab.js`
- `test/cases/155-formation-four-command-integration.test.js`
- `test/cases/165-party-session-controller.test.js`
- `test/cases/171-party-command-status-hardening.test.js`
- `test/cases/173-party-command-session-controller.test.js`
- `test/cases/264-story-battle-context.test.js`
- `world-transitions.js`
- `Art/qa/sera-liora/story-battle-pass1/README.md`
- `Art/qa/sera-liora/story-battle-pass1/verification.json`
