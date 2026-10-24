# Sera/Liora — first breakfast battle (Pass 4)

The first Buzzy Beetle encounter is playable through the ordinary shared party
command engine. Work remains unstaged/uncommitted on `agent/codex` at `df88701`;
nothing is merged or pushed. Stop here for Dot's review. The second fight is
not authored or connected.

## Player experience

The existing bedroom/courtyard/breakfast walk, keeper exchange, gate opening and
confrontation lead to a white fade and two distinct Buzzy Beetle battle actors.
Both characters use Attack / Resonance / Item / Run. Null, Rainbow and explicit
cooperative Eclipse use the shared target, Strain, initiative and replay owners.
Enter confirms a selection, commits a prepared round and advances one historical
event at a time. Terminal playback must be acknowledged before a separate
confirmation consumes the outcome.

Victory removes the scene beetles and shows:

- Keeper: “I’ll see to breakfast. Thank you, both of you.”
- Sera: “Please start with the coffee.”
- Liora: “And shut the delivery gate this time.”

The final fade uses the existing infirmary awakening exactly once. Only a true
story entry sets the existing opening-complete flag; previews do not. There is
no XP, gold or item reward. No canonical character resource is borrowed, replaced
or restored. The temporary context retains acknowledged resources through the
aftermath, preserving the existing carry contract without starting another fight.

Run uses the existing fastest-living escape rule. Acknowledged Run/defeat shows
“Retry this encounter?”; Enter stages a fresh detached attempt after callback
cleanup and a short fade. It starts from the immutable opening builds/inventory,
not Lely's recovery or a rollback of partially executed combat. Faults retain
diagnostics until explicit reset/checkpoint; they do not retry automatically.

## Real encounter bounds

`enemy_buzzy_beetle` is a registered ordinary template: HP64 / ATK2 / DEF4 / SPD4,
XP0 / gold0. It has no special mechanic or random-pool assignment. Both battle
slots clone that identity into distinct runtime actors. These are revisable
balance numbers, not new metaphysical canon.

| Action | Actual shared arithmetic | Result against 64 HP |
| --- | --- | --- |
| Sera ordinary noncritical hit | `round(50 × variance − 4)`, variance 0.8–1.2 | 36–56; one never kills, any two landed hits kill |
| Liora ordinary noncritical hit | `round(46 × variance − 4)` | 33–51; one never kills, any two landed hits kill |
| Critical ordinary hit | Existing critical-before-rounding rule | Can kill earlier |
| Null / Rainbow | `max(1, 120 − 4)` | 116 attempted / 64 applied: one-spell kill |
| Eclipse | Same formula per captured living enemy | 116 attempted each; one action at minimum effective Speed |
| Beetle attack | Existing mitigation and critical rules | 1–2 HP per landed hit |

Misses do not count as landed attacks. Armour/weapon contributions remain real
registered equipment; no character-specific damage override was added. Existing
ordinary scheduling, elemental metadata and Strain rules are unchanged.

## Ownership and isolation

`sera-liora-breakfast-battle.js` owns only scene stage, epoch, attempt and an opaque
context token. `storyBattle` leases temporary resources to the existing command
session. Generic context creation still rejects an active cutaway, including a
forged extra authorizer argument. A once-claimed scene bridge supplies a private
read-only ownership predicate; the engine's opaque story permit may waive ONLY
the cutaway preparation guard for that recognized owner. Other modal exclusions
remain intact. No `active=false` spoof, canonical snapshot/restore or alternative
combat resolver exists.

Initial entry and retry wait for normal dialogue cleanup before shared preflight.
Start/end/reset and ordinary checkpoints discard the context and invalidate stale
dialogue/asset continuations. Save/load guards include the scene controller, so
loading, initial fade and pre-context faults cannot expose a save window. Saving
remains blocked through retry, aftermath and final fade. SAVE_VERSION remains 5.

The strict new scene-checkpoint record enters the existing debug preview path
without applying a world fixture or changing Lely's resources. Existing MQ5 world
checkpoints retain their deliberately state-replacing behavior.

## Presentation and browser evidence

No artwork was generated or changed. Battle rendering reuses the approved
breakfast background, protagonists and beetle sheet. Optional shared presentation
metadata validates a registered 512×480 cutaway background and integer enemy
floor 140–212 before allocation. Defaults preserve existing canonical/headless
views. The breakfast floor is 156, leaving clear space above the story characters'
actual alpha bounds. Rendering is read-only.

The first browser run exposed overlapping sprites on the default night arena.
That was corrected using these bounded presentation choices. The final automated
Chromium run follows actual DOM keyboard events from bedroom through courtyard,
breakfast, battle, aftermath and hospital at 512×480 and 1024×960. Native scale uses
Null/Rainbow; 2× uses independently confirmed Eclipse. It passes **3,301 checks**,
with zero browser errors and zero calls to the legacy singleton starter. There
are 34 capture events and 32 unique PNG files (each actor's technique list shares
its scale's capture name). The coordinator visually inspected representative
native/2× battle, targeting, damage and aftermath captures. This is automated
browser execution plus screenshot inspection, not a claimed human playtest.

Representative captures:

- [Native battle](first-battle-1x.png)
- [2× all-enemy targeting](battle-targets-2x.png)
- [Native Null damage](battle-damage-1x.png)
- [2× Eclipse damage](battle-damage-2x.png)
- [Victory aftermath](breakfast-aftermath-1x.png)
- [Infirmary return](infirmary-return-2x.png)

The battle remains an abstract JRPG formation over the existing plate; no bespoke
combat animation or new arena illustration was commissioned in this pass.

## Verification and review

Exact final regression, syntax, validation, hashes, file inventory, preservation
checks and Git status are in `verification.json`. The accepted starting baseline
was 245/245 suites. Suite 267 adds 19 focused groups covering the complete keyboard
route, real attack endpoints/critical kills, actual spell kills, explicit Eclipse,
local Run/defeat retries, canonical values/object identities, true/preview
completion, checkpoints, held input/modal isolation, historical rendering,
authenticated owner rejection, failures, stale continuations, direct checkpoint,
PNG alpha separation and invalid presentation settings.

The existing architecture reviewer remained read-only. Its concrete findings were
fixed: public authorizer leakage, retry before dialogue cleanup, stale asynchronous
asset rejection, and save/load windows before context creation. Final scoped
review found no remaining evidence-backed defects. The Sol test writer edited
only new suite 267; the coordinator inspected it, tightened the incoming-damage
bound and independently reran it. Existing tests were changed only for approved
endpoints/caller allowlists/checkpoint navigation and the one new ordinary enemy.

The first full run exposed stale exact compatibility totals in suites 188/189
and the old registry count in suite 52. These were updated to 66 compatible and
72 registered templates, with all behavior/persistence assertions retained. The
complete ordinary preparation enumeration grows from 78,702 to **83,157**, and
the authored registry grows from 71 to **72**. `ENEMY_CAPABILITY_AUDIT.md` is a
maintained source document: one row/current note was added, with its older
70-template introductory snapshot explicitly identified as historical. No tracked
geographic artifact needed regeneration; no maps, grids, seams or pools changed.

## Files and walkthrough

Production changes: `combat.js`, `story-battle.js`, new
`sera-liora-breakfast-battle.js`, `sera-liora-breakfast.js`, `enemy-catalog.js`,
`index.html`, `input.js`, `movement.js`, `render.js`, `render-battle.js`,
`render-party-battle.js`, `render-ui.js`, `save.js`, `story-checkpoint-lab.js`.
Tests/helpers: suites 52, 186, 188, 189, 191, 192, 263–267,
`test/sera-liora-courtyard-helpers.js` and
`test/sera-liora-courtyard-browser.js`. Documentation: `STORY_BATTLES.md`,
`architecture.md`, `PROJECT_STATUS.md`, `ENEMY_CAPABILITY_AUDIT.md` and this packet.
The JSON lists exact paths and every PNG.

1. Use the normal cutaway route, or open Debug → Story Checkpoint Lab →
   **Sera/Liora — Breakfast Battle** → Apply.
2. Use arrows and Enter to choose ordinary attacks twice, or Null/Rainbow on
   separate targets. Check that a single landed noncritical attack leaves HP.
3. Select Eclipse for Sera, then explicitly confirm it for Liora; inspect both
   enemy cursors, the simultaneous hit and Strain frames.
4. Try Run and confirm the local retry. Verify a fresh temporary attempt starts
   without field recovery or a canonical resource change.
5. Acknowledge victory, read the three aftermath pages and confirm the existing
   infirmary return. Review both native and 2× readability.
6. Apply an ordinary checkpoint while testing to verify cleanup. Faults require
   an explicit reset/checkpoint/reload; they are not an automatic retry path.

No second fight, faction/story branch, new save field, world terrain or additional
canonical reward is introduced. Leave this pass for Dot's review before any
further integration or commit.
