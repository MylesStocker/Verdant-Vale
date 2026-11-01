# Wildspore — implementation and review

Work remains on `main` at `1519a92fbdd63b55241888c5917372a18351528d`, unstaged and
uncommitted. Earlier quest, geography, combat and Seed Dart work is preserved.
No other worktree is edited.

## Behavior

- Starting Esla technique, including already-recruited characters and existing
  checkpoints. Knowledge is authored, not a new save flag. Lely and the cutaway
  characters do not learn it.
- Bloommarked; one exact living enemy; no damage and no seed cost.
- **Strain 3**, with the existing application-round exemption and three recovery
  rounds. Esla may use ordinary commands while recovering.
- **75% reduction of normal hit chance**, explicitly approved by Myles:
  80% becomes 20%, 60% becomes 15%, 100% becomes 25%. Existing guaranteed evasion
  remains guaranteed. This is multiplicative, not a flat 75-percentage-point loss.
- Covers the enemy's **next two action rounds**. If Esla goes first in round 1,
  the enemy is affected in rounds 1 and 2. If it goes first, rounds 2 and 3.
  Counters during the effect are also affected. Brace/skip opportunities count;
  the effect does not pause indefinitely when the enemy chooses not to attack.
- Ordinary attacks and Meat Paw's Paw/Claw/Pounce use the reduced chance. Their
  hit-dependent effects require a successful hit as before. Guaranteed fen
  techniques, damage over time and Swallow bypass hit checks as before.
- Dead/departed targets or unavailable casters cancel under existing action rules
  without Strain. Recasting refreshes rather than stacks the effect; production
  Strain timing prevents overlapping ordinary casts by Esla.

## Ownership and presentation

The shared command battle privately owns the enemy accuracy effect; copied
immutable application, attack-roll and cleanup evidence is independently checked
by playback. Rendering, projection and acknowledgement neither draw RNG nor
advance duration. No extra random draw, independent enemy HP authority or save
field was introduced. Canonical terminal outcomes clear spores, Lab discards
temporary changes, and story retries restore clean battle-entry state.

The existing Resonance menu and message presentation are reused. No new artwork,
portrait, equipment, terrain, encounters, story progression or map changes.
The cast text names the target and duration, and expiry says its aim clears.

## Verification

Focused suite 358 covers starting knowledge, caster ownership, malformed
metadata, fast/slow initiative, exact target, probability arithmetic, Strain,
actor/target cancellation, tampered histories, RNG count, Meat Paw strikes,
counters, terminal cleanup, save/load, Lab discard and story defeat/retry.
Existing suite expectations were updated for the additional technique and
its availability to a healthy Esla. The offensive Resonance suite's source-injected
synthetic caster was updated to match the new authored knowledge list, with an
explicit assertion that its injection occurs; its gameplay assertions are unchanged. Historical renderer baselines are untouched.

Automated Chrome keyboard/Canvas checks: **160 assertions**, eight captures,
zero errors, at 512×480 and 1024×960. Captures were visually inspected for menu
and message fitting. This uses isolated combat fixtures, not a human campaign
playthrough. The existing Seed Dart browser walkthrough also passed all 124
assertions after the addition; its three-spell menu was visually inspected.
See [browser results](Art/qa/wildspore/browser-results.json),
[native technique list](Art/qa/wildspore/technique-list-1x.png), and
[2× cast](Art/qa/wildspore/wildspore-cast-2x.png).

## Exact incremental files

- `resonance.js`: closed accuracy effect definition and pure probability/duration policies.
- `persistent-party.js`: Esla's authored starting knowledge.
- `combat.js`: private effect ownership, existing hit-roll integration, expiry,
  cleanup and independent replay evidence.
- `render-party-battle.js`: application and expiry messages.
- `LORE.md`, `architecture.md`, `PROJECT_STATUS.md`, `WILDSPORE.md`: canon,
  ownership, status and review evidence.
- `test/cases/180-resonance-mvp.test.js`, `183-canonical-party-combat-integration.test.js`,
  `185-canonical-battle-envelope.test.js`, `196-party-unequip-and-resonance-availability.test.js`:
  explicit registry/menu expectations; Quickbloom wound restrictions retained.
- `test/cases/265-offensive-resonance.test.js`: maintain and assert the synthetic
  caster injection against Esla's expanded starting knowledge.
- `test/cases/358-wildspore.test.js`: focused behavioral and ownership coverage.
- `test/wildspore-browser.html`, `test/wildspore-browser.js`: isolated browser harness.
- `Art/qa/wildspore/`: `technique-list`, `wildspore-cast`, `three-strain`,
  `spores-clear`, each with `-1x.png` and `-2x.png`; `browser-results.json` and
  `verification.json`.

## Playtest checklist

1. Load an Esla checkpoint or recruit her normally; enter combat without seeds.
2. Choose Wildspore against one enemy. Check three Strain and frequent misses.
3. Against multiple enemies, verify only the selected enemy's accuracy changes.
4. Check fast and slow initiative: two enemy action rounds, then aim clears.
5. Use Attack/Items while recovering; Wildspore becomes available after three
   recovery rounds. Try Meat Paw if desired; no escape behavior was changed.
6. Finish/escape, save/load, and confirm no spores or Strain carry into a new fight.

The 75% multiplier and three-Strain tradeoff follow the approved design; a full
campaign balance playthrough remains editorial/playtest work.

## Final verification and Git state

- **294/294 full regression suites passed**, zero failures. The first run exposed
  the stale synthetic-caster injection in suite 265; it was corrected without
  altering its gameplay assertions, and the complete suite was rerun successfully.
- All **11 JavaScript files changed or added by this pass** pass syntax checks.
- `validateGameData()`: **zero errors, six pre-existing warnings**.
- **160 automated Wildspore browser assertions** and eight captures, plus
  **124 existing Seed Dart browser assertions**, pass at native and 2× scales.
- `git diff --check` passed; no conflict markers. Save version remains **5**.
- Zero terrain/grid changes. Geographic fingerprints, atlas and transition
  artifacts retain their task-entry hashes; none required regeneration.
- This pass changes **12 existing files** and adds **14 files**. All other
  **1,240 task-entry files** retain their hashes; no earlier file was removed.
- Branch/HEAD remain `main` / `1519a92fbdd63b55241888c5917372a18351528d`.
  Combined working-tree status, including earlier work: **85 tracked modified,
  238 untracked files, zero staged**. Nothing committed, merged, rebased or pushed.

[Machine-readable verification and exact file list](Art/qa/wildspore/verification.json).
