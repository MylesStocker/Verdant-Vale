# Story-battle Pass 2 — independent offensive Resonance

Null and Rainbow now use the shared Resonance command/effect/history framework.
Explicit opening story bindings give both standard command models Attack,
Resonance, Item, Run, with only Null for Sera and Rainbow for Liora. The existing
breakfast fade, playable entry/input routing and all encounter definitions are
unchanged. No cooperative Tech, new scheduling, retry/aftermath or second fight
is connected.

## Mechanics and acceptance boundary

| Technique | Caster affinity | Element | Authored power | Cost |
| --- | --- | --- | --- | --- |
| Null | Voidborn | Void (`void`) | 120, provisional | Strain 1 |
| Rainbow | Prismborn | Prism (`prism`) | 120, provisional | Strain 1 |

Both use the same data-driven effect: attempted damage is
`max(1, power - target.def)` and applied damage is clamped to current HP.
There are no technique/character-specific damage branches and no spell action
variance, crit, accuracy or evasion RNG. Base enemy DEF applies; melee-only
armour, Brace and Attack-only Curse/accuracy/counter rules are unchanged.
No resistance/weakness system is introduced. At DEF 0 attempted damage is 120;
at DEF 20 it is 100; at DEF 119 or higher it is one. The effect arithmetic has
safe-integer validation and minimum/maximum boundary checks.

A spell kills when current HP is at most `max(1, 120 - DEF)`. Both techniques
kill the clearly synthetic 100-HP / 10-DEF fixture, with attempted damage 110
and applied damage 100. These values are test fixtures, **not beetle stats**.

**Authored-beetle lethality is deferred.** Only `bethany_buzzy_1` and
`bethany_buzzy_2` scene actors exist in `sera-liora-breakfast.js`; no Buzzy Beetle
combat template, capability or formation is authored. This pass neither invents
those stats nor claims their one-spell kill requirement has been tested. Actual
lethality/variance tuning and human combat playtesting wait for Pass 4.

One exact living, present enemy is selected. Missing, stale, foreign, wrong-side,
dead and departed targets reject before action RNG/state mutation. A target
killed earlier cancels without retargeting or Strain; a caster killed earlier
skips without effect or cost. Existing terminal truncation remains unchanged.

Successful use applies Strain 1 once. Its application round is exempt; the next
completed recovery round clears it. During that round Resonance is unavailable.
Projection/rendering/acknowledgement do not tick Strain. Victory, escape or defeat
clears it through existing cleanup. It does not persist across fights or saves.

Game-only decisions and exact bounds are in
[`STORY_BATTLES.md`](../../../../STORY_BATTLES.md).

## Shared machinery and isolation

`resonance.js` supplies the closed target/effect policy and authored techniques.
`storyBattle.createContext({...resonance:SERA_LIORA_OPENING_RESONANCE})` explicitly
opts in. Each `source:'story'` binding requires the private story preparation
permit and resolves against `STORY_CHARACTER_DEFINITIONS`. Names, stats and
party membership alone do not confer a capability. Canonical and Lab preparation
retain their existing persistent-character authority. Older unbound context
shapes and command behavior remain unchanged.

`combatPlayerState` still owns preparation, command collection, ordinary weighted
initiative, effect execution, Strain and historical playback. Target policy is
shared by availability, selection, raw command validation and historical checks.
The story adapter only forwards existing technique/navigation operations.
Lely's stats/statuses/equipment/inventory/XP/gold, persistent party, quest flags
and location remain under existing owners. No snapshot/restore impersonation,
canonical grant, save-payload field or SAVE_VERSION change was added.

The new closed `resonance_damage` event records exact plan/target/participant and
technique IDs, name, element metadata, power, historical DEF, attempted/applied
damage and HP before/after. Replay validates that deterministic witness and
source provenance. Immutable projection and rendering never resolve a spell or
consume RNG. The shared renderer narrates recorded Void/Prism damage and uses
historical enemy HP. Quickbloom's healing event and behavior remain unchanged.

The independent architecture review caught a reusable-engine edge case: a spell
killing an enemy holding stolen gold emits the shared recovery receipt. Replay
now processes that receipt after the technique/Strain events, matching the
resolver. A synthetic gold-bearing fixture proves the interaction; no story
inventory/gold API or canonical reward behavior was added.

## Verification and review evidence

Final verification: **244/244 complete regression suites pass**, **19 offensive
checks pass**, all **9 scoped / 42 aggregate dirty JavaScript files** pass syntax,
and validation reports **0 errors / 14 existing warnings**, SAVE_VERSION **5**.
Exact validation output, hashes and Git status are in `verification.json`. Commands include:

```sh
node --check <each changed JavaScript file>
node -e "const t=require('./test/cases/265-offensive-resonance.test.js'); t.run(); console.log(t.checks.length)"
node test/run.js
git diff --check
```

Focused suites include 155, 165, 166, 170–174, 180–183, 185, 187–191, 196, 197,
264 and 265. `validateGameData()` runs through the established `test/harness.js`
script order. Syntax checks cover all dirty/new JavaScript, including accepted
prior work. The exact technique/element assertions in 180/183/185 now include
Null, Rainbow, Void and Prism; canonical Esla still explicitly has only Quickbloom.
No substantive assertion was removed.

Suite 265 has 19 behavior groups. It covers separate exact targets for both
spells, unchanged results under renamed authored profiles/different Attack stats,
strict action-RNG accounting, damage/HP bounds, melee armour/Brace distinction,
selection/backtracking, earlier target kill/caster death, Strain and terminal
cleanup, canonical isolation, invalid bindings and arithmetic, strict history
metadata/source/damage/HP/Strain tampering, read-only projection/rendering and late
resolver failure retaining applied effects.

Actual shared command-preparation fixtures reject missing/null/empty/dead/stale/
foreign/ally targets with zero RNG and no state change. The dead enemy is created
by a genuine kill and recovery round. A live session then proves defeated enemies
are absent from selectable target IDs. Natural end-of-round Gull departure is
also exercised, followed by actual command rejection of that departed ID and a
valid surviving-target control. Natural departure occurs at round end; this test
does **not** claim mid-round departure/cancellation evidence.

An independent review read an intermediate fixture seeded at HP 0, correctly
rejected by preparation. The fixture was corrected to start at HP 1 and reach
death through combat; the production guard was preserved. The final standalone
19-group run passes, and its hash is recorded for independent rerun.

All new combat and Canvas evidence is headless/simulated. No browser or human
combat playtest was performed for Pass 2, and no authored-beetle kill is claimed.
Geographic inputs, fingerprints, transition artifacts, artwork and assets are
unchanged; no shared artifacts were regenerated.

Astra (`gpt-6-astra`, High configuration) reviewed difficult framework/state and
final correctness; Sol (`gpt-6.1-sol`, Medium configuration) audited patterns and
wrote only new suite 265. The lead runtime model label remains unverified.
The reviewed replay defect was fixed and covered; final review found no remaining
concrete defect. No nested delegation or competing production writer was used.

## Review checklist and deferred work

- Review the two spell definitions, power/DEF formula and exact provenance channel.
- Rerun suite 265 and inspect actual selection, Strain, damage and replay evidence.
- Keep authored-beetle lethality and human testing deferred until real stats exist.
- Authorize the next pass only after review; no Tech/minimum-Speed scheduling or
  breakfast handoff/input integration has begun.

## Git and scoped files

Existing Codex worktree, branch `agent/codex`.
Starting and final HEAD: `df88701eb9f4fb0559b0d402a5fb63baab34aa28`.
Everything remains unstaged/uncommitted. Nothing was committed, merged, rebased,
pushed or deployed. Main and other worktrees were untouched. Of the 89 pre-existing
dirty files, 82 outside this increment remain byte-identical. The following list
is the Pass 2 increment, separate from accepted prior work:

- `PROJECT_STATUS.md`
- `STORY_BATTLES.md`
- `architecture.md`
- `combat.js`
- `render-party-battle.js`
- `resonance.js`
- `sera-liora-battle-profiles.js`
- `story-battle.js`
- `test/cases/180-resonance-mvp.test.js`
- `test/cases/183-canonical-party-combat-integration.test.js`
- `test/cases/185-canonical-battle-envelope.test.js`
- `test/cases/265-offensive-resonance.test.js`
- `Art/qa/sera-liora/story-battle-pass2/README.md`
- `Art/qa/sera-liora/story-battle-pass2/verification.json`
