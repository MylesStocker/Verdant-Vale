# Storeroom flour reveal — visual follow-up for Dot review

After acknowledged victory in the second Sera/Liora fight, the original storeroom
plate changes to an imagegen-edited variant showing bread rolls, fruit, cups,
plates and breakfast trays visibly coated in flour. Before victory, during combat
and during unconsumed terminal playback, the approved original plate remains.
The existing `secondCleared` state selects the image; rendering adds no state,
RNG, rewards, HP changes or flags. The large beetle disappears through its
existing victory presentation. The final server question and `review_hold` remain
unchanged. The final breakfast stage is still deferred for Dot's review.

Both images load and validate before room entry. Missing either image fails
closed while preserving committed first-fight resources. Combat, blocked Run,
carryover, current-fight defeat retry, Lely isolation and SAVE_VERSION 5 are
unchanged. No map, collision, seam or geographical artifact changed.

## Before and after

Native captures: `before-1x.png` and `after-1x.png`.
2× captures: `before-2x.png` and `after-2x.png`.
These are production Canvas/real-PNG captures from automated Chromium DOM-keyboard
playthroughs. The coordinator inspected the before/after composition at both
scales: the flour-covered food is visible above the dialogue box and between the
protagonists. Character staging was not changed. This is not a human playtest claim.

Suite 268 verifies the actual image painted before victory, at terminal victory
before outcome consumption, afterward and at the review hold. It also verifies
read-only painting and failure of either missing plate. Suite 133 verifies PNG
metadata and registration. The browser checks actual painted image objects,
read-only scene/resource state and dialogue bounds at native and 2× scales.
Full results, file hashes, exact incremental inventory and Git status are in
`verification.json`. Prior QA packets remain historical snapshots.

## Short walkthrough

1. Debug → Story Checkpoint Lab → Sera/Liora — Breakfast Battle.
2. Win the yard encounter and continue through the keeper's question/crash.
3. Inspect the storeroom before combat: beetle by the bins, original floor.
4. Win the larger-beetle encounter with attacks, spells or both explicit Eclipse
   selections. Run continues to fail under the existing blocked escape policy.
5. Acknowledge playback, then confirm the outcome. Verify flour-covered bread,
   fruit and serving trays appear immediately with the supplies-reveal line.
6. Advance to the server's question and close it. The flour variant remains at
   the review hold; the final breakfast/hospital continuation must not start.

## Art provenance

Tool: built-in imagegen, precise-object edit of the existing approved runtime
plate `assets/backgrounds/cutaways/sera-liora/storeroom-v1.png`. The original plate
is unchanged. A distinct variant is saved as:

- Source: `Art/generated/sera-liora/storeroom-flour-v1-imagegen-source.png`
  (1295×1214 RGB).
- Runtime: `assets/backgrounds/cutaways/sera-liora/storeroom-flour-v1.png`
  (512×480 RGB; Lanczos downsample only).

Original tool output was preserved. No new character art, portraits or battle
mechanics were introduced. The full generation prompt is below.

Use case: precise-object-edit. Asset type: post-victory variant of the supplied 512x480 JRPG storeroom background. Edit target: the supplied approved Bethany storeroom plate. Preserve its painted pixel-art style, perspective, lighting, room composition, flour bins, shelves, window, flowers, floor and furnishing positions. Make a clearly visible localized aftermath reveal: in the open central midground below the flour bins, between the future character positions at x160/y350 and x365/y350, show two wooden breakfast trays containing recognizable bread rolls, fruit, plates and a folded napkin, now visibly blanketed with spilled white flour. Use bright powder coating with small areas of golden bread and red/green fruit showing through, flour heaped on the trays and nearby breakfast supplies, and powder scattered just around them. The flour-covered food and serving supplies must be immediately legible at 512x480, not merely another pile of flour on the floor. Place the key trays roughly in x210..315,y210..270 at target scale so they remain above the dialogue box and between separate character sprites. This is an aftermath detail in the SAME room, not a new room design. Keep all other room features as unchanged and pixel-aligned as possible. No people, beetles, text, UI, magical effects or new large furniture. Opaque background, same 16:15 framing.
