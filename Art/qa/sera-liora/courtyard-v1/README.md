# Bethany courtyard — Part 2

**Historical Part 2 checkpoint:** its approved content is preserved. [Part 3](../breakfast-v1/README.md) now replaces the temporary courtyard-to-infirmary endpoint with the adjacent breakfast confrontation. The original verification/captures below describe Part 2; use the Part 3 report for the current complete walkthrough.

Implemented on `agent/codex`, based on `df88701`, left unstaged and uncommitted for review. Main and other worktrees are untouched. The three earlier standalone regional visual-atlas files remain unrelated and untracked.

## Playable sequence

After the approved bedroom opening, its interactions, unmade bed and 90 px/s Sera control remain intact. Using the bedroom door now reveals the generated courtyard. Sera arrives at `(166,254)`, with Liora absent. Walk down off the threshold and right toward the town arch. After about two seconds of ordinary control, Liora calls from the doorway, Sera stops and turns, and confirmation lets Liora walk over. They remain visible and still through seven further dialogue pages, then the existing authenticated completion returns to Lely and the unchanged Esla infirmary dialogue.

The rightward first-contact line is x=300. A second line at y=326 catches a player approaching the lower edge instead, so unexpected angles cannot leave the courtyard or hide either actor behind the bottom dialogue box. The legal paved area and door apron exclude the planting, bench, wall and arch supports. Liora's route first clears the doorway at y=280, approaches on a free parallel line, and ends 86 pixels beside Sera. Every route segment is sampled against floor geometry and Sera's occupied footprint before activation, and each movement step is checked again. All legal first-contact positions are covered by suite 262.

## Assets and presentation

- `assets/backgrounds/cutaways/sera-liora/courtyard-v1.png`: generated empty 512×480 courtyard, with source retained at `Art/generated/sera-liora/courtyard-v1-imagegen-source.png`.
- `assets/sprites/cutaways/sera-liora/courtyard-v1/liora-walk.png`: generated transparent 384×576 directional sheet (down/up/right; left mirrors right), with source retained at `Art/generated/sera-liora/liora-walk-courtyard-v1-imagegen-source.png`.
- Sera's existing sheet, the approved bedroom artwork, bed poses and all older masters are unchanged.
- Existing `drawLayeredScene()` sorts both actors by foot depth. Narrow foreground planting polygons repaint only their original background pixels through the same painter. No new rendering engine or terrain asset authority is introduced.
- The existing 0.20-second gait and 90 px/s movement are shared. Measured generated-cell bounds keep Liora at her established 148-pixel silhouette height alongside Sera's 146-pixel height, with consistent ground contact.

[ASSET_PROMPTS.md](ASSET_PROMPTS.md) contains both built-in imagegen prompts and reference roles. [manifest.json](manifest.json) records source/runtime/capture hashes and dimensions. The original ten captures and both added breakfast-line captures were visually inspected. No blocking proportions, route, text, alpha or transition issues were found in those captures; animation was checked through frame assertions and browser movement, not a human real-time playthrough.

## State and extension point

`sera-liora-courtyard.js` owns session-only route/actor state and the `courtyard_*` stages. It reuses the existing Sera movement controller, `seraLioraCutscene.active` input ownership and Bethany special-scene map identity. The underlying tile map is unchanged: the transient cutaway already uses scene-space footprint collision rather than the ordinary tile player. No new regional/discrete map, world entrance, save field, inventory writer, party member, reward or quest authority is added. Save access and menus remain unavailable under the established cutaway policy. SAVE_VERSION remains **5**.

The conversation's single completion callback checks active stage plus a monotonically changing session epoch. `endSeraLioraCutawayAtHospital()` now refuses inactive repeats, owns the completion count and invokes the existing story-entry authentication. It clears movement and temporary actors before the existing infirmary handoff. Preview completion stays progression-neutral. Checkpoint resets invalidate delayed loads and captured dialogue callbacks. Part 3 can replace this conversation's final continuation without changing the bedroom, party or save model. Breakfast, town exploration, Skybloom itself and battles remain future content.

## Verification

- Full regression: **241 passed / 0 failed**, after all nine focused Sera/Liora suites passed.
- Syntax: **21 changed/new JavaScript files** pass `node --check`.
- `validateGameData()`: **0 errors / 14 unchanged warnings**.
- **934 unchanged regional fingerprints**, unchanged map totals, SAVE_VERSION **5**.
- Read-only transition audit matches its existing tracked artifact. No geographic artifacts were regenerated for this pass.
- Automated Chromium DOM-keyboard/production-Canvas walkthrough: **174 checks / 12 captures / 0 browser errors**, at native 512×480 and 2× 1024×960.
- Separate headless async checks: cold courtyard asset wait, failed courtyard asset handoff, and late image completion after checkpoint reset all pass. These are additional ad hoc checks, not extra full-regression suites.
- Scope, exact file inventory, whitespace and conflict-marker checks pass. All production/test/documentation changes remain unstaged and uncommitted.

The initial browser check re-wrapped text while checking it and missed a mixed-font overflow. The follow-up reproduces a painted Liora line reaching x=526.082 beyond the box edge x=504, then verifies the correction by measuring emitted text in its actual drawing font. The corrected page keeps “private showing.” together on the second line. Dialogue wording is unchanged. `drawDialogue()` now measures each speaker’s pages using that speaker’s body font and line height, and restores the active page’s font before drawing. Suite 43 covers both speaker orders, narration, Esla and multi-page text. See [native](liora-breakfast-1x.png) and [2×](liora-breakfast-2x.png) captures.

The browser test walks from the bedroom to its door using real DOM keyboard events, then through the entire courtyard sequence. It checks spacing, bounded movement, both visible actors on every page, text width with actual browser fonts, one-time return, unchanged party/resources, unsaved scene policy and actor cleanup. Captures and input are automated; this is not a claim of manual human playtesting.

Reproduce:

```sh
node test/run.js
VV_BROWSER_PAGE=sera-liora-courtyard-browser.html VV_BROWSER_OUTPUT=/tmp/courtyard-review node test/run-browser-smoke.js
node test/transition-audit.js
```

## Review walkthrough

1. Debug menu → **Play Sera/Liora Cutaway**, or reach the normal final-dream handoff.
2. Finish the bedroom dialogue, inspect Liora/flowers/window/desk, then use the left-hand door.
3. Walk down from the courtyard threshold and right; confirm Sera gets solo movement before Liora calls. Try walking south instead on a fresh preview.
4. Confirm Liora's approach: no overlap, clipping, teleport or movement during spoken pages. Check both silhouettes and text at 1× and 2×.
5. Finish the conversation. Confirm the Esla awakening, retained party/resources and no repeated return from held confirmation.

## Final dialogue

1. **Liora:** “Sera! Wait!”
2. **Sera:** “There you are. Breakfast on the terrace. I asked them to keep the sunny table.”
3. **Liora:** “I wanted to see the garden before you booked the rest of the mountain.”
4. **Sera:** “After breakfast. Then we wander Bethany. You choose the streets; I choose the pastries.”
5. **Liora:** “I choose how long we stop, too.”
6. **Sera:** “Naturally. Within reason. It’s our last full day, and I want a good view of Skybloom tonight.”
7. **Liora:** “Then let’s eat. I’d like to see it before you arrange a private showing.”
8. **Sera:** “I was only going to ask about a better view.”

## Exact file inventory

- `Art/generated/sera-liora/courtyard-v1-imagegen-source.png`
- `Art/generated/sera-liora/liora-walk-courtyard-v1-imagegen-source.png`
- `Art/qa/sera-liora/courtyard-v1/ASSET_PROMPTS.md`
- `Art/qa/sera-liora/courtyard-v1/README.md`
- `Art/qa/sera-liora/courtyard-v1/approach-1x.png`
- `Art/qa/sera-liora/courtyard-v1/approach-2x.png`
- `Art/qa/sera-liora/courtyard-v1/arrival-1x.png`
- `Art/qa/sera-liora/courtyard-v1/arrival-2x.png`
- `Art/qa/sera-liora/courtyard-v1/call-1x.png`
- `Art/qa/sera-liora/courtyard-v1/call-2x.png`
- `Art/qa/sera-liora/courtyard-v1/conversation-1x.png`
- `Art/qa/sera-liora/courtyard-v1/conversation-2x.png`
- `Art/qa/sera-liora/courtyard-v1/infirmary-return-1x.png`
- `Art/qa/sera-liora/courtyard-v1/infirmary-return-2x.png`
- `Art/qa/sera-liora/courtyard-v1/liora-breakfast-1x.png`
- `Art/qa/sera-liora/courtyard-v1/liora-breakfast-2x.png`
- `Art/qa/sera-liora/courtyard-v1/manifest.json`
- `Art/qa/sera-liora/courtyard-v1/verification.json`
- `PROJECT_STATUS.md`
- `architecture.md`
- `assets/backgrounds/cutaways/sera-liora/courtyard-v1.png`
- `assets/sprites/cutaways/sera-liora/courtyard-v1/liora-walk.png`
- `data.js`
- `image-assets.js`
- `index.html`
- `input.js`
- `movement.js`
- `render-entities.js`
- `render-ui.js`
- `render.js`
- `sera-liora-courtyard.js`
- `sera-liora-scene.js`
- `story-checkpoint-lab.js`
- `test/cases/131-sera-liora-cutaway-opening.test.js`
- `test/cases/132-sera-liora-debug-menu.test.js`
- `test/cases/133-sera-liora-raster-integration.test.js`
- `test/cases/137-sera-liora-bed-patch-integration.test.js`
- `test/cases/138-sera-liora-guest-room-free-walk.test.js`
- `test/cases/261-sera-liora-bedroom-interactions.test.js`
- `test/cases/262-sera-liora-courtyard.test.js`
- `test/cases/43-dialogue-wrapping.test.js`
- `test/sera-liora-courtyard-browser.html`
- `test/sera-liora-courtyard-browser.js`
- `test/sera-liora-courtyard-helpers.js`
- `world-transitions.js`
