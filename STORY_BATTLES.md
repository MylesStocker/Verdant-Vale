# Story battles — current decisions

Authored cutaway parties use the same combat calculations, equipment bonuses,
statuses, initiative, action resolution and historical playback as ordinary
party battles. A story context supplies its own party, temporary inventory,
encounter, presentation label and optional victory/defeat/escape continuations.
It does not borrow or replace the canonical party.

Sera begins at 220/220 HP and Liora at 290/290 HP. Opening builds are revisable
balance data; these numbers do not establish a general progression tier.

| Character | Base ATK / DEF / SPD | Weapon | Armour | Effective ATK / DEF / SPD |
| --- | --- | --- | --- | --- |
| Sera | 22 / 12 / 16 | Fine Sabre, ATK +28 | Reinforced Travel Coat, DEF +22 | 50 / 34 / 16 |
| Liora | 20 / 14 / 14 | Balanced Staff, ATK +26 | Woven Guard Coat, DEF +24 | 46 / 38 / 14 |

Both use actual registered equipment definitions. There are no character-specific
damage overrides. The equipment is granted only by the cutaway profiles, never
by an opening-world pickup, shop or canonical inventory operation. Prices are
zero because this equipment is outside the canonical economy. The temporary
opening inventory contains two Elixirs and one Reed Remedy.

HP, ordinary statuses, sampled Slither Speed, equipment and remaining temporary
inventory carry into another battle in the same context. Existing battle-end
cleanup removes Burn and Dazzled; encounter-local evasion buffs, bombs and other
round state do not carry. Fallen members remain at zero HP. No automatic revive,
world recovery, XP, gold, item reward or quest advancement occurs.

The context exists only for the current session. Saving and loading are refused
while it exists, including between battles. Discarding it, restarting the cutaway
or applying a story checkpoint clears it. Nothing is added to the save payload;
SAVE_VERSION remains 5. A failed resolver locks the context until explicit reset.
Outcome continuations run once, after the terminal reel is acknowledged and its
resources committed. A continuation failure cannot repeat commitment.

## Independent offensive Resonance

An opening story context explicitly opts in with
`resonance: SERA_LIORA_OPENING_RESONANCE`. These bindings are checked against the
closed authored story character definitions through the private story bridge.
Supplying a character name, stats or profile alone grants no Resonance capability.
Older unbound contexts retain their existing command behavior.

With those bindings, both opening menus are Attack, Resonance, Item, Run. Sera's
list contains Null and Eclipse; Liora's contains Rainbow and Eclipse when both
participants are available. Null has Void element
metadata and Rainbow has Prism metadata; affinity remains a separate caster
eligibility requirement. Both use the same single-target damaging effect:

- One exact living enemy instance, chosen explicitly; no automatic retargeting.
- Authored power 120 for each spell, currently provisional balance data.
- Attempted damage = max(1, power − target's base DEF).
- Applied damage = min(target's current HP, attempted damage).
- No spell-specific variance, critical, accuracy, evasion or other action RNG.
- Melee-only armour/Brace and Attack-only Curse/accuracy/counter rules do not apply.
  No elemental resistance or weakness system is added.

Thus DEF 0 gives 120 attempted damage, DEF 20 gives 100, and DEF at least 119
gives one. Arithmetic accepts positive safe-integer power and nonnegative
safe-integer DEF. Applied damage stays between one and the target's remaining HP.
A spell kills exactly when current HP is at most max(1, 120 − DEF).

Successful execution applies Strain 1 through the existing owner: its application
round is exempt, the next completed recovery round clears it, and another spell
is unavailable during that recovery round. Death/unavailability of the caster or
chosen target before execution cancels/skips the effect without applying Strain.
Battle termination clears Strain through existing cleanup; no new magic resource
is added to the context or saves. Ordinary initiative remains unchanged.

The damage event records the exact target, element metadata, power, historical
DEF, attempted/applied damage and HP transition. The history validator checks
this witness; frame projection and rendering never execute the effect or RNG.
Quickbloom keeps its existing healing event and semantics.

The first authored Buzzy Beetle encounter is now playable from breakfast, as
described below. Its real template verifies the one-spell and two-landed-hit
bounds. The second fight remains deferred.


## Eclipse: explicit cooperative choice

Each character's frozen authored `knownTechniques` list explicitly grants her
techniques: Sera knows Null/Eclipse, Liora knows Rainbow/Eclipse, and Esla knows
Quickbloom. Every required participant must know a technique as well as match
its identity/affinity requirements; missing knowledge fails closed in selection,
preflight and detached history. These lists are static metadata, not save state.

Eclipse appears in both characters' Resonance lists when both know it. Choosing it for Sera leaves
Liora's action uncommitted. Liora must open Resonance, select Eclipse and confirm
its all-enemy target set herself. While that request is pending, incompatible
commands are dimmed and skipped; backtracking withdraws the request. Both
choices remain in the round record. A one-sided, conflicting, duplicate or
malformed selection cannot begin resolution or consume RNG/resources.

The compatible choices become ONE weighted initiative entry. Its Speed is the
minimum effective Speed of the participants at round preparation: equipment,
Muddied and a retained Slither sample count. It does not wait for the last of two
random initiative positions, and a later mid-round speed change does not move
it. Ordinary actions and the shared weighted planner keep their existing rules.
Both participants spend their action opportunities on this one technique.

Eclipse records Void and Prism elements, provisional power 120 per enemy, and
uses the same max(1, power − base DEF) formula as Null/Rainbow, clamped to each
enemy's remaining HP. Both characters explicitly confirm the same ordered set
of all living, present enemies when collecting the round. At execution, only
survivors of that captured set are hit; no replacement target appears. Damage
is applied as one simultaneous event before terminal checks, with no action RNG,
new elemental modifier, melee armour/Brace rule, counter or evasion roll.
Successful execution applies Strain 1 to each participant once. If either is
Fallen or unable to act before execution, the technique cancels once, consumes
their opportunities and applies no damage or Strain; it does not fall back to
separate spells. Existing recovery and terminal cleanup rules remain in force.

These are reusable combined-Resonance rules, also tested with synthetic two- and
three-person healing techniques. They add no persistent state. Current damage
numbers remain revisable balance data; the first authored encounter below now
verifies those bounds against actual beetle templates.


## First breakfast battle — Pass 4 baseline

After the final confrontation line, the scene fades into an ordinary shared
command session: Sera and Liora versus two distinct Buzzy Beetles. The registered
`enemy_buzzy_beetle` template has HP64, ATK2, DEF4 and SPD4, with zero XP/gold and
no special mechanics or random-pool assignment. These are revisable balance
numbers. The ordinary damage formula remains `round(ATK × variance − DEF)`,
minimum one, with the existing critical multiplier and 0.8–1.2 variance range.
Sera's noncritical landed hits deal 36–56; Liora's deal 33–51. Thus any single
noncritical hit leaves a beetle alive, and any two landed hits kill it. Criticals
may kill earlier. Misses do not count as landed hits. Null/Rainbow deal 116 each,
and Eclipse deals 116 to each, capped at the beetles' remaining 64 HP. Incoming
landed hits deal 1–2 HP through ordinary mitigation/critical rules.

The ordinary menus, targets, items, explicit Eclipse consent, Strain, weighted
initiative and historical playback are all playable. Confirm advances one event
at a time; terminal playback must be acknowledged before a separate confirmation
consumes the outcome. No canonical XP, gold, inventory or equipment reward is
granted. Victory shows a short keeper/Sera/Liora exchange, removes the two scene
beetles, fades and uses the established infirmary return exactly once. Only a
true story entry sets the existing opening-complete flag; debug previews do not.

Run uses the normal fastest-living escape policy. An acknowledged escape or
defeat offers a local retry confirmation. It starts a NEW detached attempt from
the immutable opening profiles and temporary inventory; it never invokes Lely's
recovery, charges gold or advances the story. Execution faults retain diagnostics
until explicit reset/checkpoint; they do not retry partial effects. Successful
resources remain in the story context through aftermath, so a future battle can
use that established carry contract; this pass adds no second fight.

The shared renderer reuses the approved sunny breakfast plate and beetle sheet.
Bounded presentation metadata separates the creatures from the larger story
sprites; no artwork was generated. Native/2× browser keyboard review and captures
are in `Art/qa/sera-liora/story-battle-pass4/`. The existing Debug → Story
Checkpoint Lab now includes **Sera/Liora — Breakfast Battle**. This scene-only
preview preserves Lely's resources and stored save, and returns to the infirmary
without setting completion. World fixtures retain their existing reset semantics.
Saving/loading is blocked throughout loading, fade, battle, retry and aftermath.
SAVE_VERSION remains 5.


## Storeroom continuation — accepted stage 1

This supersedes the Pass 4 temporary hospital ending above. The keeper cautiously
asks whether both travellers are all right; a crash reveals another beetle in the
storeroom. The new plate shows flour bins, sacks, breakfast supplies and scattered
flowers. The keeper asks them to be careful; Sera suggests Eclipse. This is a
narrative suggestion, with no forced command, automatic partner consent or extra
Resonance rule. Attacks, individual spells and items remain available. Both
authored fights use the existing blocked escape policy: Run stays visible but
always fails without an escape roll. Defeat still offers a local entry-state retry.

`enemy_large_buzzy_beetle` is an ordinary, larger-rendered pest: HP96, ATK2, DEF4,
SPD4, zero XP/gold, outside every random pool. Two to three landed noncritical
opening attacks defeat it; Null, Rainbow or Eclipse each defeat it in one hit.
The original two HP64 beetles and their mechanics are unchanged. Numbers remain
revisable balance data, not new lore.

Both fights use one context token. HP, inventory, equipment and persistent
statuses carry from acknowledged victory. Burn/Dazzled clean up and Strain resets
through existing terminal rules. A private per-fight entry snapshot and encounter
recipe permit acknowledged defeat/escape retries only; retry cannot replenish
resources spent before that fight began. Faults retain diagnostics without refund.

After acknowledged second victory, the background changes to the registered
flour-covered breakfast-supplies plate: recognizable bread, fruit and serving trays
are visibly dusted with flour. The server asks whether they are done. Following
Dot's stage-1 approval, closing that line now starts the final breakfast below.
No new save fields, quests, rewards or persistent party changes are introduced.


## Final courtyard breakfast — stage 2

The approved terrace/table returns through a white fade, with the travellers facing
one another over an improvised breakfast. They choose a quiet garden walk through
Bethany, agree to return before Skybloom and remember tomorrow's departure. A
little-finger promise to stay together as always remains an intimate, unlabelled
moment; it reveals no future outcome or connection to Lely. Generated stills show
both characters seated and eating, then linking pinkies. A two-second hold stays
on the promise image; confirm/cancel cannot skip it. No post-promise eating
animation remains. Null, Rainbow and Eclipse now have deterministic 24/30/42-frame
effects driven by their shared-engine events; Eclipse is an expanding burst.
These visuals never resolve damage, spend Strain or modify battle history.

The final fade calls the existing infirmary completion authority exactly once.
The same temporary story context/resources remain owned until that cleanup. Lely's
HP, statuses, inventory, equipment, money, experience, party and day are preserved;
her infirmary placement and the existing story-only opening-complete flag follow
the unchanged awakening authority. Debug replays do not newly set that flag.
Reset/checkpoint invalidates stale callbacks and held confirm cannot skip the
hospital's first page. No new art, combat mechanic, save field or quest is added.
The implementation remains uncommitted for final review.
