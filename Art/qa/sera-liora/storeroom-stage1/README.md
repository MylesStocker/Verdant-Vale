# Bethany storeroom — stage 1 review packet

Implemented on `agent/codex`, left unstaged and uncommitted for Dot's review.
This stage ends after the server's question. It deliberately does not implement
courtyard return, improvised breakfast, the pinky promise, eating hold or final
hospital completion. First-fight mechanics and existing artwork are preserved.

The keeper cautiously asks whether both travellers are all right. A storeroom
crash leads to the larger beetle among flour bins, a warning about the supplies,
and Sera suggesting Eclipse. Ordinary commands and both explicit Eclipse choices
remain available. The same context carries HP, persistent statuses, equipment and
inventory. Retry uses a private snapshot of this fight's entry, so fight-two
retry cannot undo consumption or injuries from fight one. Strain remains local
to each battle; ordinary Burn/Dazzled terminal cleanup is unchanged. The larger
beetle is HP96/ATK2/DEF4/SPD4, zero rewards, with ordinary capabilities only.

After victory, flour-covered breakfast supplies are revealed and the server asks,
“Are you two done in here?” Closing that line reaches an inert `review_hold`.
Temporary resources stay isolated and saving/loading remains blocked. There is
no natural hospital return, quest advancement, new save flag or schema change.
The unchanged hospital authority is still explicitly tested by older compatibility
suites after asserting this new hold; these direct calls are not natural-route
completion evidence.

## Verification

Exact results, source hashes, incremental file inventory, initial/final status
and log hashes are recorded in `verification.json`. Focused suite 268 covers
carryover, actual item/equipment consumption, persistent statuses, current-entry
retry, failed preparation atomicity, both ordinary spells, attacks, explicit
Eclipse, genuine controller input, asset faults and stale callbacks. The full
regression includes historical singleton/Formation/party/Resonance behavior.
Validation reports zero errors and 14 existing warnings; SAVE_VERSION remains 5.
No map/grid/edge/random-pool input changed. No geographic artifact was regenerated.
`ENEMY_CAPABILITY_AUDIT.md` is maintained source, extended for the new template;
registry and compatibility assertions remain substantive.

The Chromium run uses DOM keyboard events, the production Canvas renderer and
real PNG assets at 512×480 and 1024×960. It is automated gameplay plus coordinator
screenshot inspection, not a human playtest. Native uses ordinary attacks in the
storeroom; 2× uses both explicit Eclipse selections. Painted dialogue glyph bounds
are checked. Existing-scene cosmetic fixes remain deferred. The server has distinct
speaker metadata; the existing keeper artwork remains an MVP stand-in at this stop.

## Walkthrough

1. Open Debug → Story Checkpoint Lab → Sera/Liora — Breakfast Battle, or follow
   the normal bedroom/courtyard/breakfast route.
2. In the first fight, take a little damage or use an Elixir before winning.
3. Acknowledge terminal playback, then confirm its outcome. Read the keeper's
   question, crash and storeroom warning. Inspect flour bins and scattered flowers.
4. Verify the second fight retains wounded HP and depleted supplies. Try attacks,
   Null/Rainbow, or manually select Eclipse for both characters. Backtracking works.
5. Choose Run in either fight: it remains visible but always fails; combat continues.
   Defeat retry restores this fight's entry only.
   Forced-defeat retry is covered by an isolated lethal-template test fixture;
   production beetles retain their easy ordinary stats.
6. Win and acknowledge. Read the supplies reveal and server's question. Closing
   it intentionally holds the scene for review; reload to leave this incomplete
   ending. No save, completion flag or Lely recovery should occur.

Representative captures: `storeroom-intro-1x.png`, `storeroom-battle-1x.png`,
`storeroom-aftermath-1x.png`, `storeroom-review-stop-1x.png`, and matching 2× captures.

## Generation provenance

Built-in **imagegen**, one new opaque background. Style/reference inputs:
`assets/backgrounds/cutaways/sera-liora/breakfast-v1/terrace.png` and
`assets/backgrounds/cutaways/sera-liora/courtyard-v1.png`. Neither was edited.
Generated source: `Art/generated/sera-liora/storeroom-v1-imagegen-source.png`
(1295×1214 RGB). Runtime: `assets/backgrounds/cutaways/sera-liora/storeroom-v1.png`
(512×480 RGB, Lanczos downsample only). The original tool output was preserved.
Both file hashes appear in `verification.json`.

Final generation prompt:

> Use case: stylized-concept. Asset type: opaque background plate for a 512x480 JRPG cutscene and shared battle. Primary request: generate a NEW guesthouse kitchen storeroom in Bethany, using the two supplied images ONLY as visual style/material/lighting references, not edit targets. Match their detailed painted pixel-art aesthetic, warm stone, oak beams, teal accents, sunny mountain guesthouse atmosphere and elevated near-frontal game camera. Interior: large wooden flour bins, sacks of flour, shelves with breakfast supplies, a tipped flour scoop, light spilled flour, and a restrained scattering of colorful alpine flowers on the stone floor. A pantry in disorder after a large beetle has disturbed breakfast stores. No people, no beetles, no text, no UI, no labels. Composition: nearly square 16:15 canvas, intended exact output512x480 or same ratio; back wall and flour bins in upper half; spacious unobstructed stone floor across central/lower area for separate character sprites and a bottom dialogue overlay. Keep floor visible at y~190 to350 at target scale; do not paint characters into asset. Daylight enters from a small side window; coherent perspective and warm modest domestic furnishing. No photorealism, no modern packaging, no watermark. Preserve reference style without changing any existing artwork.

## Delegation and limits

Astra handled read-only state/correctness design and final review. Accepted private
entry snapshots, stable per-fight receipts, same-token carryover and stale prompt
protection. Its final independent checks found no remaining defects. Sol handled
bounded existing-pattern/test investigation and authored only new suite 268;
the coordinator inspected every test, added the repeated-retry regression and
integrated all production changes. No nested delegation or agent Git operations.

Automatic approval review rejected an initial proposed whole-file controller
rewrite in this dirty worktree. The rejected command made no changes; inspected
targeted patches were then accepted. Temporary before-images preserve all prior
uncommitted work. No changes were staged, committed, merged or pushed.

Subsequent Run-policy follow-up uses the existing shared `blocked` escape policy
for both authored fights. Original verification.json records the stage-1 snapshot;
`run-policy-followup.json` records the later focused change and verification.
