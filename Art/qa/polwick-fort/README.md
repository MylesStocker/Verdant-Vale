# Polwick’s fort — rear cargo room and Esla visits

Implemented on the existing `main` working tree. All previous Mornay, Wetwoods, Thornmere and Valmere edits are preserved. Nothing staged, committed or pushed.

## Player-visible behavior

A narrow opening northwest of Polwick leads to a cargo room. Relabelled crates carry broken red seals; two ledgers, loose papers and a packing knife sit on a table. Inspection contrasts the legitimate cargo description with untaxed spirits and wrapped blades, plus instructions to avoid a patrol. The unchanged Unshackled Flame tract is concealed in the rear crate at tile (1,4). Both inspections are repeatable and give no items, rewards or quest flags.

When the party revisits after resolving the fort report, a living Polwick has three conversations with Esla:

1. She recognizes the smuggling, but says: “Lély made a choice, and I’m not dragging him back through it. For his sake, I’ll leave this alone. Don’t mistake that for approval.”
2. Polwick suggests following the Flame, with language about “dull hands” and the last war. Esla answers: “My Thread doesn’t make me better than Lély. Or anyone carrying your crates. Find someone else for that speech.”
3. He changes the subject to shallow channels, boatmen and the drought; Esla mentions the farms.

This draws on LORE.md’s Unshackled Flame entry and the existing tract, without changing either. Esla’s actual party membership is required. The sequence respects death/execution availability. The unresolved arrest/leave choice and all combat retry behavior remain unchanged. Once these exchanges are read, the existing lighthouse quest handler resumes its offer/reminder/turn-in behavior. Where that handler has nothing to say, drought small talk repeats.

Only completed conversations advance `polwick_esla_visit_stage`, a single numeric ambient counter in the existing save registry. It starts at 0 for an older v5 save, saturates at 3 during ordinary play, and never advances MainQuest or chooses a fort/lighthouse outcome. Existing numeric validation rejects malformed values. SAVE_VERSION remains 5.

## Exact layout change

[grid-deltas.json](grid-deltas.json) lists all **18 changed cells** in `SMUGGLER_FORT_MAP`: formerly solid wall becomes 17 floor tiles and one existing TABLE tile. Every original floor, exit and NPC coordinate remains unchanged. Four additional solid overlay crates use the established collision/drawing authority; the two old front crates remain. The room has no new map ID or transition. All regional grids, metadata, seams and fingerprints are identical to the preceding task.

## Changed files in this increment

- `content/maps/thornmere-wilds-maps.js`: rear-room grid extension only.
- `content/interactions/thornmere-wilds-interactions.js`: Esla exchanges and repeatable freight-record inspection; original tract text untouched.
- `npcs.js`: cargo anchors, Polwick speaker identity and dialogue dispatch priority.
- `render-interiors.js`: relocated tract sparkle, crate labels/seals, ledger-table props and inspection sparkle.
- `quests.js`, `save.js`: one ambient counter through the existing binding authority.
- `test/cases/51-save-binding-registry-migration.test.js`: explicit new binding and lexical-binding count.
- `test/cases/116-fort-crates.test.js`: retain original front-crate assertions, include the new solid crates.
- `test/cases/125-unshackled-flame-tract.test.js`: updated location; original reader/canon assertions retained.
- `test/cases/324-polwick-back-room.test.js`: actual-control navigation, inspections, sequence/styling, save/default/rejection behavior, eligibility and quest isolation.
- `test/polwick-fort-browser.js`: reproducible browser input/render review.
- `PROJECT_STATUS.md`, `architecture.md`: implementation/state contract and current tract location.
- `Art/qa/polwick-fort/`: evidence only, not gameplay assets.

## Verification and evidence

**260/260 full regression suites pass.** All 66 changed/new JavaScript files in the dirty working tree pass syntax checks. Validation reports zero errors and six unchanged warnings. `git diff --check` and targeted conflict-marker checks pass. All earlier dirty files outside the two deliberately updated documentation files retain their exact pre-task hashes.

Focused suites 07, 51, 106, 116, 125 and 324 pass. The new suite walks through the rear doorway, reads the tract, inspects freight records and leaves the fort with held arrow keys in both presentation modes. It checks read-completion progression, v5 round-trip and missing-field defaults, malformed-state rejection, Esla-only styling, living NPC/membership gates, unchanged outcome/resources and the subsequent lighthouse offer.

Browser: **83 automated checks / 16 capture events / 11 distinct PNGs / zero errors**. Normal exterior entry, indoor movement, cargo/ledger interactions, normal exit, both movement modes, all three conversations and save/load between them pass. Native 512×480 and 2× 1024×960 renders were visually inspected. This is automated browser input plus visual inspection, not a claimed human playthrough.

The transition audit matches its existing tracked artifact and was **not regenerated**. Regional authority hashes and all 1,058 fingerprints are unchanged. No atlas/fingerprint refresh is necessary for this interior-only change. [verification.json](verification.json) records final checks.

## Short playtest

1. On a save where Polwick was spared and the fort report has been resolved, return with Esla. Go behind and left of him through the narrow opening at (4,3).
2. Examine the rear table at (4,1), then the sparkling crate at (1,4). Read and close the existing Flame tract.
3. Speak to Polwick three times, reading each exchange fully. Save/reload between visits if desired. Confirm Esla’s objections are green and Polwick’s words are not.
4. Speak again to confirm the existing lighthouse quest remains available, then leave through the original southern door.
5. On an earlier unresolved fort save, confirm the arrest/leave choice still appears. Dead or executed Polwick must not reappear.

[Room, native scale](cargo-room-false-1x.png) · [Room, 2×](cargo-room-false-2x.png) · [Esla’s objection](esla-tolerates-2x.png) · [Flame rebuff](esla-rebuffs-1x.png) · [Drought small talk](drought-small-talk-1x.png)
