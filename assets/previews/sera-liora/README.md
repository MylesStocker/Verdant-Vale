# Pinky-promise animation study

A separate debug-only animation generated with the built-in imagegen tool, using the original production pinky-promise still as its visual reference. The actual cutaway and its artwork remain unchanged.

Open the backtick debug menu and select **Pinky Promise Animation**. **24 separately drawn poses × 125 ms = three seconds at 8 fps.** The final pose remains visible after playback for review. Enter/Space replays; Escape/backtick returns to the same debug row.

## Selected artwork

Four unmodified six-panel PNGs form one runtime sequence, each read left-to-right, then top-to-bottom. All four must load before playback starts. Failure of any sheet leaves a cancellable error screen.

| File | Poses | Dimensions | Action |
| --- | --- | --- | --- |
| pinky-promise-v2-a.png | 1–6 | 1586×992 | Raise hands and reach |
| pinky-promise-v2-b.png | 7–12 | 1585×992 | Link pinkies and lift |
| pinky-promise-v2-c.png | 13–18 | 1586×992 | Gentle promise shake and lowering |
| pinky-promise-v2-d.png | 19–24 | 1586×992 | Settle, blink and smile |

The registry crops each panel to 524×491 at x=2/531/1059 and y=2/499, excluding divider lines. The controller combines four sheets into one sequence without duplicated poses or crossfades. The older nine-pose `pinky-promise-sheet-v1.png` remains preserved but is no longer registered or played.

This remains an animation study: hand, clothing and background details vary between generated drawings. Exact registration and polished in-between motion would need further art refinement. Each sheet was visually inspected; browser screenshots show the reach, linked hands, settling and final pose.

## Generation provenance and prompts

Built-in imagegen was used, not the API fallback. Each selected output was copied unchanged into this directory, preserving its source. A used the original still; B and C used the original plus the preceding sheet. D's first request failed with a network error; a shorter retry using C alone succeeded.

Original reference: `assets/backgrounds/cutaways/sera-liora/breakfast-v1/pinky-promise-v1.png`.

### Sheet A

Use case: illustration-story. A SIX-frame animation sprite sheet, exactly THREE columns by TWO rows, six complete equal panels edge-to-edge, no text, numbers, gutters or borders. Aim 1536x960. Use attached original still as identity, clothing, detailed anime style and fixed camera reference: adult Sera black hair black/gold jacket LEFT; adult Liora vivid full rainbow hair blue/gold jacket RIGHT, seated at Bethany courtyard breakfast. Keep table, food, flowers, buildings and scale fixed across panels. Only small gradual character motion, with anatomically coherent hands and pinkies, not a full handshake. Both women fully visible as in reference in every panel. Read left-to-right then top-to-bottom. Sheet A, frames 1–6 of a 24-pose three-second pinky promise. Begin BEFORE the reference linked pose. 1: inner hands just above table, separated, looking warmly at each other. 2: forearms lift slightly. 3: hands lift a little further, little fingers beginning to extend. 4: hands reach lower chest height, palms facing inward, fingers loosely curled except pinkies. 5: hands approach each other, gap about 15 cm. 6: hands slightly closer with gap about 10 cm, pinkies extended but not touching yet. Every frame is a distinct small incremental pose. Faces and background stay registered, no camera changes. Exactly six complete panels.

### Sheet B

Use case: illustration-story. A SIX-frame animation sprite sheet, exactly THREE columns by TWO rows, six complete equal panels edge-to-edge, no text, numbers, gutters or borders. Aim 1536x960. Use attached original still as identity, clothing, detailed anime style and fixed camera reference: adult Sera black hair black/gold jacket LEFT; adult Liora vivid full rainbow hair blue/gold jacket RIGHT, seated at Bethany courtyard breakfast. Keep table, food, flowers, buildings and scale fixed across panels. Only small gradual character motion, with anatomically coherent hands and pinkies, not a full handshake. Both women fully visible as in reference in every panel. Read left-to-right then top-to-bottom. The SECOND attached image is the preceding six-frame sheet. Continue its FINAL bottom-right panel seamlessly in all composition, scale and clothing. Sheet B, frames 7–12: hands already close at chest height. 7: extended little fingertips brush. 8: pinky tips overlap slightly. 9: pinkies begin curling around each other. 10: linked pinkies settle with relaxed wrists. 11: linked hands lift just a little. 12: lift another small increment, about 2cm total. Six DISTINCT subtle incremental poses, consistent hand geometry; preserve eye contact and soft smiles (Liora can have partly closed eyes as reference). Do not restart the reach or change camera, table or courtyard. Exactly six complete equal panels, three columns two rows.

### Sheet C

Use case: illustration-story. A SIX-frame animation sprite sheet, exactly THREE columns by TWO rows, six complete equal panels edge-to-edge, no text, numbers, gutters or borders. Aim 1536x960. Use attached original still as identity, clothing, detailed anime style and fixed camera reference: adult Sera black hair black/gold jacket LEFT; adult Liora vivid full rainbow hair blue/gold jacket RIGHT, seated at Bethany courtyard breakfast. Keep table, food, flowers, buildings and scale fixed across panels. Only small gradual character motion, with anatomically coherent hands and pinkies, not a full handshake. Both women fully visible as in reference in every panel. Read left-to-right then top-to-bottom. The SECOND attached image is the preceding six-frame sheet. Continue its FINAL bottom-right panel seamlessly, same camera and exact table registration. Sheet C, frames 13–18: pinkies already linked and hands raised near chin height. 13: linked hands rise a tiny increment from preceding final pose. 14: rise another tiny increment, heads tilt inward slightly. 15: highest point of gentle promise shake, relaxed shoulders. 16: linked hands lower slightly. 17: lower a little more. 18: hands return toward chest height, still linked. Six DISTINCT incremental character poses, not six identical panels. Preserve little finger linking with other fingers curled; do not clasp full palms. Maintain costumes, warm smiles, fixed background and meal. Exactly six complete equal panels, three columns two rows.

### Sheet D — selected retry

Continue this six-panel animation sheet with the NEXT six poses, same exact 3-column 2-row grid, character identities, detailed anime style, camera, table, courtyard and costumes. Start from its bottom-right panel. Sera left black hair, Liora right rainbow hair, both adult women. All six panels show linked pinkies gently settling at chest height. Across panels 1–6, Sera slowly blinks (open, half-closed, closed, half-open, open, open) and both gradually straighten their slightly inclined heads by a few degrees and soften their smiles. Tiny distinct wrist and hand settling between each panel. Liora eyes softly closed and smiling. Pinkies stay linked, no full-hand clasp. Fixed background, no camera movement. SIX distinct sequential drawings, not repeated images. Exactly THREE columns TWO rows, full equal panels, no labels or gutters. Preserve all details of reference.

### Sheet D — failed request (no output)

Use case: illustration-story. A SIX-frame animation sprite sheet, exactly THREE columns by TWO rows, six complete equal panels edge-to-edge, no text, numbers, gutters or borders. Aim 1536x960. Use attached original still as identity, clothing, detailed anime style and fixed camera reference: adult Sera black hair black/gold jacket LEFT; adult Liora vivid full rainbow hair blue/gold jacket RIGHT, seated at Bethany courtyard breakfast. Keep table, food, flowers, buildings and scale fixed across panels. Only small gradual character motion, with anatomically coherent hands and pinkies, not a full handshake. Both women fully visible as in reference in every panel. Read left-to-right then top-to-bottom. The SECOND attached image is the preceding six-frame sheet. Continue its FINAL bottom-right panel seamlessly, same camera, breakfast and scale. Sheet D, frames 19–24 of the same animation. Linked pinkies remain at chest height. 19: hands settle slightly downward, heads gently inclined toward one another. 20: tiny further hand settling, Sera begins a slow blink. 21: Sera blink half closed, Liora tilts head a fraction and smiles. 22: Sera eyes briefly closed, Liora smile subtly softens. 23: Sera eyes reopening toward Liora, wrists relax slightly. 24: Sera eyes open, looking warmly at Liora, Liora eyes softly closed; both settle into still pinky promise close to original reference. SIX DISTINCT SMALL PROGRESSIVE poses, not duplicates. Do not release the pinkies, do not wave or shake full hands. No cut, zoom, new props or moving background. EXACTLY three columns and two rows, six complete equal panels.

## Verification

Focused suites 133 and 335 pass. Suite 335 checks all 24 source crops and 125 ms intervals, sheet order/bounds, completion, late-sheet loading/failure, replay, cancellation, held movement input, save refusal and unchanged original art. Native 512×480 browser review used the actual debug menu and keyboard controls for playback, replay and Escape return. Full regression: **271/271 suites pass**. All 15 dirty/new JavaScript files pass syntax checks. Validation: **0 errors / 6 existing warnings**. Screenshots were captured at the reach, linked, settling and completed poses; no fresh 2× browser pass was performed.

No maps, transitions, fingerprints, dependencies or save schema changed. SAVE_VERSION remains 5. No commit or push.

## Files changed for the 24-pose revision

- `debug-promise-preview.js`: four-sheet playback and complete-load gate; duration derives from frame count.
- `image-assets.js`: four new debug registrations replace the nine-pose registration.
- `test/cases/335-pinky-promise-preview.test.js`: timing, ordering and multi-sheet loading coverage.
- `test/cases/133-sera-liora-raster-integration.test.js`: new asset metadata.
- `assets/previews/sera-liora/pinky-promise-v2-a.png`, `pinky-promise-v2-b.png`, `pinky-promise-v2-c.png`, `pinky-promise-v2-d.png`: generated artwork.
- `assets/previews/sera-liora/README.md`, `PROJECT_STATUS.md`, `architecture.md`: playback and provenance documentation.

Earlier uncommitted debug-menu integration remains preserved.
