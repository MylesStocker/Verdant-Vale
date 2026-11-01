# MQ6 — The Greybank Mill

## Scope and working state

Implemented in the assigned `empire-game` checkout on `main`, starting at
`1519a92fbdd63b55241888c5917372a18351528d`. The pre-existing uncommitted MQ5
audience, its tests, documentation and captures are preserved. This work is
unstaged and uncommitted. No other checkout, branch or remote is changed.

MQ6 is a main mission offered by existing Regional Magistrate **Marit Voss**
after MQ5 delivery. It does not replace her earlier audience. A subsequent,
deliberate conversation offers the commission, and accepting sets `MainQuest=6`.
Payment is **150g**, stated before acceptance and paid exactly once. Completing
MQ6 leaves `MainQuest=6` and marks its own journal entry completed; MQ7 does not
exist or activate in this pass.

## Authorities and persistence

| Authority | Meaning |
|---|---|
| `mq5_report_delivered` | Existing genuine MQ5 completion prerequisite |
| `greybank_stage` | 0 unoffered; 1 offered; 2 accepted; 3 tent confrontation complete/access granted; 4 reported, completed and paid |
| `greybank_wins` | Authenticated victories: bits 0–3 required, bit 4 optional |
| `greybank_vision_seen` | The mandatory white vision has returned to the exact normal scene |
| `greybank_cache_taken` | Optional repair chest received once |

These are four lexical bindings in the existing version-5 registry, defaulting
to zero/false when absent from an older v5 save. The stage is also the key/access
receipt and the final payment receipt; neither needs another item or flag.
`greybank.invariantErrors` protects live saves and candidate loads. Invalid
receipts fail without mutating the running game or stored save.

`greybank.js` owns repeatable interactions and transient dialogue/choice/vision
sessions. Origin/presence checks and generation tokens invalidate abandoned or
replayed callbacks. Movement, competing activities, held confirmation and
save/load are blocked during scenes. No companion position or scene token is
saved. Esla is projected beside Lély on checked, clear floor only while present;
Fine Needlework absence is retained and her lines are omitted when absent.

`scriptedPartyEncounters` authenticates all victories through the canonical
party engine, including solo play. Escape and defeat leave the corresponding
bit unset; retry creates a fresh encounter using ordinary combat rules and
resource writeback. No enemy templates, mechanics, rewards or graphics are
redefined. No faction reputation, recruitment, political defection or additional
travel authority is added.

## Geography and rooms

The CHAMBERI RIVER is the existing southeastern river flowing north into
Valmere east of Mornay, with its mouth separate from the harbour. Greybank works
a valley tributary near (21,7). Drenwick's modest canal, its locks and the
separate western river are unchanged.

Exact existing-grid change: `MAINLAND_C21R7_MAP`, local **(10,7)**,
**GRASS (0) → INTERIOR_EXIT (20)**. This was unoccupied, accessible grass beside
the valley waterway. No paths, water, seams, encounter tables or camera policies
change. The approach's display name and note identify the mill; 68 existing
River Lowlands/Upper River Valley names now identify the CHAMBERI RIVER. All 70
metadata field changes are listed in `Art/qa/greybank/metadata-deltas.json`.
The return is local **(368,240)**, facing right/east, on grass beside the marker
and away from its trigger. The marker uses the existing shared outdoor-decoration
registry, so it remains visible from neighbouring chunks without activating
interactions across seams.

| Map | Function and route |
|---|---|
| `GREYBANK_YARD_MAP` | Riverside approach; workers, mill facade, tent, cart and river. Only exterior return leads to the original marker. |
| `GREYBANK_TENT_MAP` | Search the table to meet Brenna and exactly two supporters. Nobody joins the party. Return directly to the yard. |
| `GREYBANK_MAIN_MAP` | Locked until the introduction; meal chute, millstones, relief cart, first encounter. Stair to upper works gated by first victory. |
| `GREYBANK_UPPER_MAP` | Shaft housing, drive machinery and second encounter; stairs descend to the private grain store after victory. |
| `GREYBANK_STORE_MAP` | Marked relief stock, brief distribution/wage instructions, third encounter; door to wheelhouse. Optional supply recess contains a separate fifth battle and repair chest. |
| `GREYBANK_WHEEL_MAP` | Water pit, static timber wheel and tools; strongest required encounter. Return through the cleared store and machinery floor. |

All six grids are 15×16, saveable, encounter-free outside the authored fights,
with connected floor and safe return paths. Twelve reciprocal point transitions
use the existing location gateway. No alternative door skips the tent. Existing
wooden stairs, doors, beds, tables, cargo, benches, masonry, terrain, NPC sprites
and enemy graphics are reused. The wheel and mill marker use the same simple
Canvas timber palette; there are no new terrain types or raster assets.

## People, evidence and boundaries

- **Brenna:** Reclaimer organiser with her own purposes; uses the party's access
  and fighting ability, gives the key, and remains at the tent. This is a new
  first-name-only quest identity, **distinct from Brenna Kett**, the existing
  Crooked Oar keeper. The shared name is approved: `greybank_brenna` and
  `mornay_brenna_kett` have distinct identities, roles and locations.
- **Ovan:** unpaid mill worker and one of her two supporters.
- **Teri:** supporter involved in mutual aid and illicit movement of food;
  openly disagrees about how far the group should go.
- **Dessa:** a separate mill worker in the yard, not automatically a Reclaimer.

The three tent residents appear together when the table is searched during the
accepted mission and remain repeatably available afterward. No combat starts
and no combat RNG is consumed by the confrontation. Brenna directly rejects
confusion between Reclaimers and the Unshackled Flame: they are enemies.

Required encounter introductions expose relief stamps, unpaid wages and the
instruction to withhold stock for higher drought prices. Voss receives **one
quarter of distribution proceeds**, her operating partners the other three
quarters; the ordinary 150g commission is the party's only quest payment.
Repeatable inspections and Dessa's account reinforce those facts. The real
infestation is never attributed to political monster control, the drought's
cause or the Travellers' Rise ambushers. Voss protects the arrangement when
confronted. Esla remains an Imperial officer, angry at this office's conduct and
committed to the original request.

## Vision

The first attempted ordinary movement on the main mill floor after gaining
access interrupts before step damage or encounter processing. Every normal
successful route crosses this room. The existing `enterDream`/`exitDream`
gateway shows white surroundings with unattributed text and no portrait:

> The cursor is still blinking.

> There is no one left to answer.

The exact map, location context, position and facing return immediately.
Resources and day are untouched. The completion receipt prevents replay after
retreat or save/load. It has no device, marker, explanatory NPC exchange, reward
or relation to the mill's machinery, grain scheme or drought.

## Rewards and encounters

Normal engine rewards remain authoritative; XP below is the formation's base
reward before ordinary party distribution. Gold is the sum of existing ranges.
The optional chest grants **2 Elixirs and 2 Sapper Charges**, once, after its fight.
No special faction reward, extra equipment tier or promised assistance is added.

| Encounter | Composition | Base XP | Gold |
|---|---|---:|---:|
| Meal-spattered floor | Marsh Rat, Marsh Rat, Marsh Rat | 72 | 12–27g |
| Stopped machinery | Lantern Moth, Lantern Moth, Marsh Rat | 84 | 14–33g |
| Private relief stock | Fen Rootworm, Marsh Rat, Marsh Rat | 106 | 21–40g |
| The wheel pit | Mudwrack Snapper, Fen Rootworm, Lantern Moth | 158 | 34–62g |
| The supply recess (optional) | Lantern Moth, Fen Rootworm | 88 | 18–34g |

Required base rewards: **420 XP, 81–162g**, plus the 150g commission. Optional fight: **88 XP, 18–34g**, plus the chest.

## Final authored audience and confrontation dialogue

Esla entries are omitted in the solo branch; other speakers and scene facts remain. Text, names and commission prices are revisable implementation content.

### Assignment

**Marit Voss:** “Greybank Mill has stopped. Creatures in the works. We need it cleared to protect Mornay’s food supply. The commission pays 150 gold on completion.”

**Esla:** “We came for assistance with Calwick and Drenwick. A man is dead. Another is missing.”

**Marit Voss:** “I remember your report. Freeing resources begins with dealing with immediate priorities. Hungry people cannot wait for specialists.”

**Marit Voss:** “Greybank stands beside the CHAMBERI RIVER valley waterway, southwest of the lowland crossing. Take the southern valley to the mill marker. Speak to the workers.”

**Esla:** “Then we will clear it. But this is not an answer to the Supervisor’s request.”


### Tent confrontation

**Narration:** The canvas door opens. A woman steps inside. Two people follow her and stop on either side of the entrance.

**Brenna:** “Hands where I can see them. That is my table.”

**Lély:** “The mill is locked.”

**Esla:** “Stay behind me, Lély. We have not taken anything.”

**Ovan:** “Uniforms. Of course.”

**Teri:** “Let her speak, Ovan.”

**Brenna:** “Brenna. Voss sent you to save the food supply? There is food inside. It has owners now. Somehow the people who paid for it are not among them.”

**Esla:** “If you have an accusation, make it plainly.”

**Brenna:** “Relief grain, private locks. People working without pay. I organise the people your office leaves hungry. Call us Reclaimers if you need a heading.”

**Esla:** “You will find no sympathy from me for the Flame, either.”

**Brenna:** “The Unshackled Flame would put a rareborn boot on the same necks. They are our enemies. Do not confuse us.”

**Brenna:** “The creatures are real. We cannot reach the works. You can clear them, and you can read a sack label. Here is the key. Go and see whose interests you are protecting.”

**Esla:** “Getting the workers back safely is worth doing. It does not mean I agree with you about the Empire.”

**Brenna:** “I asked you to open your eyes, not change your coat.”


### Final report

**Lély:** “The mill is clear. The relief grain is locked in private storage. The workers have not been paid.”

**Marit Voss:** “Then deliveries can resume. An excellent result.”

**Lély:** “The instructions say to hold it for a higher drought price. A quarter of the proceeds goes to you.”

**Marit Voss:** “My distribution interest is properly recorded. Grain must be stored, transported and sold by someone. Ownership is not part of your commission.”

**Esla:** “And the unpaid wages? Does their work count as part of somebody’s commission?”

**Marit Voss:** “An operating matter for the partners. You were retained to remove creatures. You have done so. Your fee is 150 gold.”

**Esla:** “We have restored your business. We still need help for Calwick and Drenwick.”

**Marit Voss:** “Your request remains on record. I have no deployment to offer you.”

**Esla:** “Then our purpose here has not changed.”

**Narration:** Commission complete: Greybank Mill. Received 150 gold. No assistance has been assigned.

## Repeatable inspections and encounter introductions

**Meal-spattered floor:** Rats swarm the meal chute. On a waiting cart: PUBLIC RELIEF GRAIN. Dessa’s unpaid wage slips are pinned beside it.

**Stopped machinery:** Lantern Moths have nested in the dry drive belts. The stairs beyond lead down to the locked private store.

**Private relief stock:** A rootworm burrows through sealed relief sacks. A short instruction hangs above them: HOLD FOR HIGHER DROUGHT PRICE. Distribution proceeds: Marit Voss, one quarter; operating partners, three quarters. Workers’ wages: deferred.

**The wheel pit:** A Mudwrack Snapper holds the wheel pit. Roots foul the axle and a moth flickers above it. Clear them and the workers can reach the whole mill again.

**The supply recess:** A moth and a rootworm crowd an abandoned repair chest. This recess is not needed to clear the mill.

## Repeatable resident lines

**Brenna, uncleared:** “Through the main floor, up to the machinery, down into
the store. The wheelhouse is beyond it. Do not mistake our key for an invitation
to join us.”

**Brenna, wheelhouse clear:** “You made it safe. Good. Now watch who gets paid.
We will keep feeding the families while they argue about accounts.”

**Ovan:** “I used to turn that wheel. Three weeks owed. They can afford a lock,
but not my wages.”

**Teri:** “We share food. We move it without asking permission, too. Brenna and
I disagree about how far that should go. Today there are children waiting for
supper.”

**Dessa, uncleared:** “Three weeks without wages. I swept the meal off my coat
into a bowl last night. Tell that to whoever sent you.”

**Dessa, wheelhouse clear:** “I can reach the chute again. Thank you. Now I only
have to persuade the owners that work ought to be paid.”

**Voss, active reminder:** “Greybank Mill, in the southern CHAMBERI RIVER valley.
Clear the whole works, then report here for your 150 gold.”

**Voss, completed:** “Your fee has been paid. The request from Calwick remains
on record. I have no further answer.”

Other inspections are brief and repeatable: the tent's food-share/unpaid-wage
list, private tallies over public relief deliveries, worn drive bearings and
grease, the same distribution/wage instruction encountered during the required
store fight, and workers' tools wrapped against river spray. None grants a clue
about the drought or explains the vision. The table before assignment says its
occupant is out; after the introduction it confirms the key was handed over.

## Walkthrough for review

1. Apply **MQ5 — Mornay Report Ready** in the existing Story Checkpoint Lab,
   then finish Voss's MQ5 audience through ordinary dialogue. Talk to her again;
   accept **Greybank Mill — 150 gold**. Check the journal reads active MQ6.
2. Travel to the small mill marker at chunk **(21,7), local (10,7)**. The mill
   door in the yard is locked. Enter the tent to the west and examine the table.
3. Watch Brenna arrive with **Ovan and Teri only**. Esla is visible and speaks
   on green pages when available. Nobody joins the party. Return to the yard.
4. Enter the main mill. Take one step: read the two white vision pages and
   return to precisely the same place. Save/reload and retreat/re-enter to check
   it cannot repeat.
5. Fight the rats; take the northeast stairs. Fight the moths and rat; take the
   northwest stairs down. Read the relief-stock instructions and clear the
   rootworm group. The wheelhouse door is northeast, approached around the
   adjacent cargo. Heal between fights using the ordinary inventory menu.
6. Clear the wheelhouse. Optionally return to the store's southeastern recess
   for its extra fight and repair chest. Walk all the way back to the marker.
7. Report to Voss. Confirm the 150g payment and **completed MQ6**, with no MQ7,
   personnel promise or travel restriction. Repeat the talk to check no payment.
8. Repeat with Esla away on **Fine Needlework**; her absent record, cargo and
   return destination must remain intact and she must not appear or speak.

## Verification and limitations

Focused suites **351** and **352** cover the lifecycle, real-input doors in both
regional modes, the mandatory vision, authenticated victory/escape/defeat/retry
for every encounter, absence, old-save defaults, malformed receipts, one-time
rewards, exact reviewed regional deltas, connected floors and progression gates.
The final regression passed **288/288 suites**. Validation has **zero errors and six existing warnings**; all **1,059 fingerprints**, the transition audit and **53 JavaScript syntax checks** pass. Full evidence is recorded in `Art/qa/greybank/README.md`.

Browser evidence is **automated headless Chromium**, not a human playthrough.
It dispatches ordinary keyboard events for all room navigation, dialogue,
choices, attacks and inventory healing at **512×480 and 1024×960**. Initial
world travel and the final return to Mornay use location fixtures; long-distance
walking is covered by existing regional topology tests, not this browser run.
The existing level-10 checkpoint's stats, equipment and inventory are unchanged;
RNG is fixed at 0.5 for reproducibility. Native and doubled captures were visually
inspected. There are **2,695 browser assertions and 30 captures**. At either
scale the required battles take **3, 3, 4 and 7 rounds**, optional **4 rounds**.
Normal Elixirs are spent between battles. Esla falls in the final encounter and
Lély wins; no special healing or resurrection is added. These are deterministic
examples, not a broad balance audit or a measured combat-time percentage.

Exact fee, sparse MVP furnishing and dialogue pacing merit editorial review.
NPCs may share names when their stable IDs and character metadata distinguish
them; Brenna and Brenna Kett are approved separate people. No new rareborn identities or
families are introduced. No ship, island, hydrographer, recruitment, MQ7 or
Drenwick-canal expansion is activated.

## Files and generated evidence

Production:
- `greybank.js`: quest, dialogue, inspections, scene ownership and presentation.
- `content/maps/greybank-maps.js`: six grids, furniture and twelve point doors.
- `content/npcs/greybank-npcs.js`: four stable world residents.
- `content/maps/mainland-maps.js`: one marker cell and CHAMBERI RIVER metadata.
- `data.js`, `npcs.js`, `index.html`: registrations and load order.
- `quests.js`, `save.js`, `validation.js`: four bindings, journal and invariants.
- `scripted-party-encounters.js`: shared authenticated formation dispatch.
- `interactions.js`, `movement.js`, `input.js`, `activity-ownership.js`:
  bounded dispatch, exclusive scenes, held-key protection and vision trigger.
- `render.js`, `render-mornay.js`, `continuous-content.js`: mill rendering,
  sorted office companion and shared active/neighbour marker body.
- `story-checkpoint-lab.js`: transient session reset; no new checkpoint profile.

Tests:
- New `351-greybank-mill.test.js`, `352-greybank-geography.test.js`,
  `greybank-browser.html/js` and `fixtures/greybank-history.js`.
- Existing suites 100–104, 201, 207, 218, 301, 58, 98 and 99 retain their
  substantive assertions with the catalogue total changed **1267 → 1273**.
- Suite 51 adds the four explicit registered keys and valid round-trip fixtures.
  Suite 58 adds the four-NPC fragment and narrowly scoped interaction handler.
- Suite 350 and the MQ5 browser follow-up now test that a **new deliberate**
  conversation offers MQ6; MQ5 completion itself remains isolated and unchanged.
- `fixtures/wilderness-discoveries-history.js` reverses only the reviewed MQ6
  deltas on detached snapshots, preserving strict older geography hashes.
- `test/transition-audit.js` exercises every added point dispatcher.

Documentation: this report, `LORE.md`, `PROJECT_STATUS.md`, `architecture.md`,
`MORNAY_TOWN_PLAN.md`, `REGIONAL_GEOGRAPHY_PLAN.md` and `OVERWORLD_ATLAS.md`.

Regenerated by their existing authorities:
- `node test/regional-atlas.js --fingerprints`: only the `(21,7)` fingerprint
  changes; no other grid hashes change.
- `node test/regional-atlas.js --write`: atlas Markdown, live inventory and SVG
  overview include river names and the one marker. The earlier production-rendered
  PNG is retained as historical evidence, not claimed as a fresh MQ6 rendering.
- `node test/transition-audit.js --write`: six added maps and twelve point doors.
  The structural seam inventory is unchanged.
- `Art/qa/greybank`: exact delta records, baseline hash, browser result summary,
  captures and verification notes. No catch-up terrain or unrelated artifacts.

Pre-existing MQ5-only edits and captures remain uncommitted alongside this work;
they have not been discarded or implicitly published.
