# MQ7 — The Missing Practitioner

## Scope and baseline

Implemented in the assigned `empire-game` checkout on `main`, starting at
`1519a92fbdd63b55241888c5917372a18351528d`. Preserves the existing uncommitted
MQ5, MQ6 and South Ruins expansion. Nothing staged, committed, merged or pushed;
other worktrees unchanged. The immediately preceding verified dirty baseline
was 289/289 suites, zero validation errors and six existing warnings.

After MQ6 is reported and paid, a **new deliberate conversation** with Marit
Voss offers MQ7 for **175 gold**. Accepting changes `MainQuest` to 7. Completion
keeps it at 7. There is no MQ8, ship departure, raid, arrest, faction enrollment,
new combat mechanic, new terrain type or image dependency.

Names, dialogue and the fee are revisable authored content. Neris is a registered
adult female Tidebound, distinct from existing male provisioner Neris Kelm.
Their stable IDs, roles and locations distinguish them; no existing NPC renamed.

## Geography and route

A lantern sign in **Shingle Headlands (20,0)**, east of Mornay, opens onto the old
guest road. Sole existing-grid delta: `MAINLAND_C20R0_MAP`, local **(7,3)**,
**0 / GRASS → 20 / INTERIOR_EXIT**. The regional return is **(240,144)**, facing
down, on ordinary grass south of the trigger. No edge, camera, encounter-table,
watercourse, ferry, Rise ambush or camp boundary changes. Nine local maps add
18 directed reciprocal point passages; regional chunk count stays 1,059.

| Map | Purpose and circulation |
|---|---|
| `LANTERN_TRACK_MAP` | Winding old guest road around wooded shelves; first required fight; south returns to mainland |
| `LANTERN_GULLY_MAP` | Fallen timber and eroded masonry; zigzag route, second required fight; north to house |
| `LANTERN_ORCHARD_MAP` | Former guesthouse facade, Orren, print and private bench; east path to water |
| `LANTERN_HALL_MAP` | Common room, Neris, Vena, table, stove, correspondence; north door to guest rooms |
| `LANTERN_BUNKS_MAP` | Four modest sleeping spaces, shared passage, Mara and Ilan, Accord extract |
| `LANTERN_CHANNEL_MAP` | Neris's Tidebound demonstration, third fight, safe bank beside feeder; return always open |
| `LANTERN_BEND_MAP` | Reed cut and small bridge to optional store; north to intake |
| `LANTERN_INTAKE_MAP` | Jammed screen and fourth required fight; retreat south |
| `LANTERN_COPSE_MAP` | Optional guarded carrier's cache; returns to bridge beside its trigger |

Walls, water, shelves, furniture and passages use existing tile properties.
Worn paths identify the bends. Outdoor exits are paths, not freestanding doors.
No random grinding is required; local maps use authored encounters only. All
rooms allow ordinary saving outside dialogue and combat. Civilians never join
combat or travel as escort actors. Regional exploration outside the sole entrance
is unchanged.

## Cast and dramatic structure

- **Neris** (`lantern_neris`): adult Tidebound, Esla's former Academy acquaintance,
  formerly employed on provincial water inspections. Likes over-peppered soup;
  remembers cracked practice tubes; affectionate, capable, presumptuous and
  Flame-aligned. Moves once to the water steps and returns after the debate,
  through a single stage-derived NPC record.
- **Orren** (`lantern_orren`): older Galeheart graduate. Packs letters, recommends
  dry socks, helps travellers move on; explicitly rejects Neris's politics.
- **Vena** (`lantern_vena`): young adult Rosebound whose window was broken after
  returning home. Accepts shelter, not automatic political membership.
- **Mara** (`lantern_mara`): commonborn net-mender accompanying her child. Notices
  the same social neglect as Lély and is practical about the help they need.
- **Ilan** (`lantern_ilan`): twelve-year-old Stonewrought, eager and nervous about
  going to the Junior Academy in the Bowl. Neither parent is rareborn.
- **Marit Voss**: existing assignment giver and recipient of the truthful report.

Neris welcomes Esla by name, remembers their pepper joke and offers only her a
cup/chair. Lély can answer, assert their shared assignment, or remain silent.
Esla explicitly corrects the treatment using the player's customized name.
After the intake clearance Neris praises “your investigator” to Esla and assumes
Lély will carry tools. Lély again has responses; Esla rejects the hierarchy.

Neris confirms voluntary departure during the welcome, not a surprise abduction
reveal. The party then helps with the house's concrete water-route danger while
learning what her decision means. Orren gives the route and historical context;
Neris demonstrates a controlled current using **existing water**, with an
explicit inability to create more or solve the drought. The final discussion
exposes her belief that resonance wielders should hold final political authority.
Her generosity is real; her idea of kindness is not equal citizenship.

Esla defends real education, friendship, legal protection, her work, her choice
to remain in Calwick and her love for Tomas. “That does not make the choices I
did make yours to dismiss.” She rejects the Flame explicitly. A private orchard
conversation lets Lély ask about the Academy or say she felt invisible. Esla
acknowledges being slow to notice and apologizes. The campfire disclosure remains
hers: nobody repeats or weaponizes the attempted drowning.

## History: mandatory versus optional

Mandatory conversations establish the Century War's overthrow, fragmentation
and catastrophe; Year 0 as exhausted survivors founding the Empire rather than
a neat documented victory; purges of collaborators and surrendered practitioners;
**3 AC** warrants extended to rareborn children; nearly seven centuries of
sanctioned killing until **700 AC**; rescission under the Accord alongside coercive
registration/evaluation/education and severe non-compliance penalties; first
students and the first Lantern Walk in **701 AC**; public survival as the Walk's
radical fact, while speeches could praise only the Empire and Accord.

Esla explicitly distinguishes modern protection and crimes against children from
the abolished automatic warrants. Random, non-hereditary rarebirth and community
through schooling, correspondence and mentorship are stated in the mandatory
orchard conversation. No magical bloodline or inherited caste is implied.

The approved property clarification is added to `LORE.md`: no inheritance, but
ownership through earnings, purchases, gifts and family support remains possible.
Sera Kethrin's wealth is preserved. Neris's political reading is her argument,
not an omniscient narrator's judgment. She rejects the Reclaimers as enemies;
there is no alliance, common headquarters or Reclaimer sponsorship of this house.

Optional, repeatable readings: correspondence from scattered postings; a copied
Accord extract; a print of the first Lantern Walk. They add context without
containing exclusive mandatory facts or granting flags, loot or quest progress.

## Battles and rewards

All formations reuse existing enemies, sprites, capabilities and shared canonical
combat. Their authenticated victory receipts alone open the next dangerous route.
Escape or defeat leaves the fight pending, with ordinary shared-engine resource
writeback/recovery; previously cleared fights stay cleared. No free local retry
restoration or separate combat rules.

| Fight | Formation | Purpose |
|---|---|---|
| Guest road | Hollowreed Choker + Botfly | Compulsory approach; direct mixed encounter |
| Timber gully | Fen Rootworm + Lantern Moth + Marsh Rat | Compulsory, three different threats |
| Water steps | Mudwrack Snapper + Sparkeel | Compulsory, durable attacker plus fast threat |
| Upper intake | Waspthra + Fen Rootworm + female Mire Toad | Compulsory final clearance |
| Old store | Willow-Veiled Stalker + Lantern Moth | Optional; warns about armour and counters / thrown supplies |

Normal battle XP, gold and drops remain the combat authority's responsibility.
Optional cache gives **3 Elixirs and 2 Reed Remedies**, exactly once. Reporting
pays **175 gold**, exactly once. No unique equipment, technique or faction reward.

## State and ownership

| Binding | Meaning |
|---|---|
| `lantern_stage` | 0 unoffered; 1 offered; 2 accepted; 3 welcome/responded; 4 history/Orren; 5 water demonstration; 6 final debate; 7 private conversation/report ready; 8 reported and paid |
| `lantern_wins` | Five authenticated victory bits, four required and one optional |
| `lantern_cache_taken` | Optional cache receipt |

These are three deliberate additions to `QUEST_FLAG_BINDINGS`, defaulted for old
version-5 saves. `SAVE_VERSION` remains **5**. No parallel quest ledger, saved
scene token, companion placement, custom party payload or speculative MQ8 state.
`lanternHouse.invariantErrors` checks prerequisites, ordered wins, mandatory-scene
receipts and payment coherence both live and before candidate save application.

`lantern-house.js` owns point-door dispatch, inspections, conversations, journal
and transient scene ownership. `scriptedPartyEncounters` owns authenticated
combat outcomes. Scene callbacks check generation, location, exact player origin,
party availability, quest stage and wins. Stale callbacks are inert. Movement,
save/load, competing activities and held confirmation are blocked during scenes.

Actual `persistentParty.isAvailable('esla')` is required for briefing, acceptance,
welcome, history, water demonstration, debate, private talk and report. Fine
Needlework is never modified. Guidance directs the player to resolve it and
reunite at the commercial inn. Exploration, retreat and already-accepted combat
remain possible while she is away. Fallen presence follows existing availability
rules; no scene heals her. Mixed-speaker pages preserve green Esla speech only.

## Quick test route

1. Debug menu → Story Checkpoint Lab → **MQ7 — Missing Practitioner Ready**.
   This deliberately replaces the test session; it does not write saves.
2. Speak to Voss, accept, travel east to Shingle Headlands **(20,0)** and walk
   north onto the lantern sign at local **(7,3)**.
3. Clear road and gully, enter house, talk to Neris. Try a Lély reply; explore
   guest rooms and letters. Speak to Orren outside.
4. Follow the east orchard path to Neris at the water steps. Clear the steps,
   follow the cut north to the intake and clear it. Optional: cross the bridge
   to the old store with supplies to penetrate the Stalker's armour.
5. Return to Neris, answer the second slight, then inspect the orchard bench
   with Esla. Try either private response.
6. Walk back out and report to Voss. Revisit to verify no second fee or MQ8.
7. Save mid-route; try retreat; repeat with Esla absent via the real Fine
   Needlework errand and with her Fallen. Reunite and continue.

## Verification and limits

Focused suite 354 covers lifecycle, all response branches, named player, real
absence, Fallen presence, all five escape/defeat/retry paths, forged receipts,
repeat loot/payment, stale callbacks, held input, atomic invalid loads, old v5
defaults, connected floors, every reciprocal passage through movement controls
in both regional modes, all room saves, history and speaker metadata.

`test/lantern-house-browser.js` performs a real Chromium Canvas/keyboard walkthrough
at native and 2× scale. It walks every local room, uses shared combat and inventory,
reads every authored conversation/inspection, checks text width/style and saves,
and captures the stages. It uses checkpoint resources without inflated combat
stats and heals with inventory. Only the long pre-existing overworld journeys
between office and approach are skipped with fixture placement. This is automated
browser gameplay and reviewed captures, **not a human manual full-world playtest**.

Final machine results and exact MQ7 file inventory are in
`Art/qa/lantern-house/verification.json`. Browser output is `browser-results.json`.
The remaining editorial questions are dialogue pacing, revised names, fee and
combat attrition for organically levelled parties. There is no claimed exhaustive
balance proof. Main-route travel, first-time blind exploration and optional-cache
value merit a human walkthrough.

Final verification: **290/290 regression suites passed**, 72 changed/new JS
syntax checks passed, validation **0 errors / 6 existing warnings**, all 1,059
regional fingerprints matched, and the read-only transition audit matched its
589 fixed-transition artifact. The successful browser run recorded **4,830
checks and 62 captures**. Nine focused scenario groups include real reunion
and resumption after Fine Needlework. `git diff --check` and conflict-marker
review passed. Nothing staged, committed or pushed.
