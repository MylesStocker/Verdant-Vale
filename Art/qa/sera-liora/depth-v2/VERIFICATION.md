# Sera/Liora visual repair — verification record

Branch `agent/codex`, unchanged HEAD `9d93fedb51b2a15db0f85ac8436654c6c5743f85`.
Preflight had no interrupted operation, staged changes or modified tracked files.
The only untracked file was the expected supplied twin-bed reference.
No commits, staging, merging, rebasing, pushes or changes to other worktrees.
Claude was read only for the explicitly requested test-prefix availability check;
260 was unused in both test directories. No other Claude files were inspected.

## Diagnosis and result

- Independent standing, walking and high-resolution master fitting produced
  inconsistent peer head sizes. Versioned shared-scale sprites replace those
  runtime references; the original masters remain intact.
- Opaque room/bed drawing happened before all actors. A validated reusable
  rear/world/foreground/UI painter now sorts actors and exact bed masks by ground
  depth, with stable equal-depth order. Collision remains separate and unchanged.
- The old waking patches baked oversized Liora into opaque furniture. New
  transparent wake poses sit behind exact original blanket pixels, using the
  same facial scale as standing peers.
- The opening used a fixed standing image. The existing free-walk cycle had a
  separate scale. Both now use nine coherent frames (three directions × three
  gait poses, with left mirrored). Movement changes pixels; idle/dialogue stop it.

No old scripted waypoint crossed a mattress: the checked-in opening had no moving
approach. Its existing 40-frame reveal now shows a legal (350,285) → (350,345)
approach, preserving the endpoint, timing, dialogue, trigger and handoff. Room
collision and map geometry are byte-preserved. The reference is not a room asset.

## Verification

- Clean baseline: 216/216 suites.
- Final complete regression: **217/217**, zero failures.
- Focused 131, 132, 133, 136, 137, 138 and 260: all pass.
- Syntax: all 13 changed/new JavaScript files pass `node --check`.
- `validateGameData()`: 0 errors, 12 established warnings; 234 maps.
- All 115 regional fingerprints pass, unchanged.
- Read-only transition audit matches committed artifact: 308 fixed destinations,
  8 preserved-coordinate transitions, 240 edge segments, 42 house doors.
- SAVE_VERSION remains 5; `save.js` and save bindings unchanged. Full regression
  includes save/load and cutaway/debug replay/isolation checks.
- `git diff --check`, duplicate numeric-prefix scan and conflict-marker scan pass.
- Ordinary Chapter One rendering: 1,822 calls, identical baseline/current digest
  `5357dec373136eaaa539e435046409423bf32ccfc3c0a81936243a52765e644e`.
- Production contains no reference-PNG load. Reference SHA-256 remains
  `47fbf97862f2865fda59a0750970112933fe0cdbd41c49bc29b0544b27c9a025`.
- Generated geographic artifacts were not regenerated.

Historical captures remain exact:

| Family | Count | SHA-256 |
|---|---|---|
| Singleton | 52 traces / 387 checkpoints / 482 RNG values | `2034f8f2639c78e6d8b69d4d25a47f7d9e8ec53548f4227376faa30a8b288a66` |
| Formation | 133 | `403050ca0c4c346ad886eff4f2083736103bdb93aa50d387761b5d5215e6e36e` |
| Party Attack | 586 | `b97f7bdc7c8012218a32c663d3a2b52a9f61e1c826993d40e956dc03caa13d8f` |
| Generalized commands | 1,271 | `b084ef1cfd7a1694a7a5a0a63c0267fd8a0c12368861a56f6542edb34548e4ea` |
| Resonance | 130 | `026f44f41da431c818e33de08fe2679065cd461d9a2d638627b7b6ba0a168f74` |

Unchanged fingerprint artifact SHA-256:
`f63a320d895c2d4d1aa52e1c2fd0533f6688d9b2a168e3d46542f9b19445c8be`.
Unchanged transition artifact SHA-256:
`81a8aed2d737c264530328a4122f4eb660ebbc99d264ba44b02ac84e4b0f8677`.

## Existing-test changes

133 retains registry/header checks, lazy loading, failure fallback, portraits,
replay and save behavior; its expected bundle and draw calls now name the new
assets. 137 retains archived master hashes and asynchronous wake-asset waiting,
but verifies transparent pose selection and original-cover compositing instead
of obsolete opaque patches. 138 retains movement, collision, door, control and
Lely-isolation checks; only runtime sheet paths and normalized crop dimensions
change. Tests 131, 132 and 136 remain unchanged.

## Browser evidence and remaining review

Automated isolated Chrome loaded real production scripts and images for six
states at native 512×480 and nearest-neighbour 1024×960. The matching baseline
captures use the immutable starting commit. These are deterministic QA fixtures,
not a manual playthrough. In-app interactive browser control was unavailable.

At both scales, manually:
1. Play the debug cutaway, then verify the normal story entry when available.
2. Watch the opening approach, moving legs/arms/hem, and bed occlusion.
3. Check sleeping/waking face size, original room alignment and readable dialogue.
4. Check both peers on the same ground plane at takeover.
5. Walk all four directions behind/in front of each bed; stop and resume.
6. Verify no animation during dialogue, no duplicate actors, and unchanged exit
   interaction/hospital return; replay the debug scene.
7. Smoke-test ordinary Lely movement, menus and save/load afterward.

Face landmarks are authored and visually reviewed measurements, not automated
face recognition; the focused suite also checks actual silhouette pixel heights,
alpha/baseline margins, distinct gait pixels and exact furniture source pixels.
Final artistic acceptance remains the user's visual review.

## Exact changed/new file inventory

- `Art/generated/sera-liora/liora-waking-poses-v2-source.png` — Accepted versioned ImageGen source; approved masters not overwritten.
- `Art/generated/sera-liora/peer-walk-poses-v2-source.png` — Accepted versioned ImageGen source; approved masters not overwritten.
- `Art/qa/sera-liora/Sera and Liora between twin beds.png` — Untouched user-supplied reference; pre-existing untracked file.
- `Art/qa/sera-liora/depth-v2/README.md` — QA provenance, measurements, evidence and manual review instructions.
- `Art/qa/sera-liora/depth-v2/VERIFICATION.md` — QA provenance, measurements, evidence and manual review instructions.
- `Art/qa/sera-liora/depth-v2/after/approach-1x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/approach-2x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/behind-bed-1x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/behind-bed-2x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/front-bed-1x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/front-bed-2x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/standing-1x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/standing-2x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/takeover-1x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/takeover-2x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/waking-1x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/after/waking-2x.png` — Corrected QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/approach-1x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/approach-2x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/behind-bed-1x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/behind-bed-2x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/front-bed-1x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/front-bed-2x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/standing-1x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/standing-2x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/takeover-1x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/takeover-2x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/waking-1x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/before/waking-2x.png` — Committed-baseline QA Canvas capture.
- `Art/qa/sera-liora/depth-v2/capture-runner.js` — Reproduce isolated real-Canvas QA captures; not production-loaded.
- `Art/qa/sera-liora/depth-v2/capture-scene.js` — Reproduce isolated real-Canvas QA captures; not production-loaded.
- `Art/qa/sera-liora/depth-v2/capture-sha256.json` — Capture integrity manifest.
- `Art/qa/sera-liora/depth-v2/comparison-sheet.png` — Compact labelled QA comparison, never runtime art.
- `Art/qa/sera-liora/depth-v2/derive-assets.py` — Reproduce uniform-scale character assets and exact furniture masks.
- `PROJECT_STATUS.md` — Scoped scale/depth/animation ownership and compatibility documentation.
- `architecture.md` — Scoped scale/depth/animation ownership and compatibility documentation.
- `assets/sprites/cutaways/sera-liora/depth-v2/left-bed.png` — Normalized character frames or exact-source furniture mask.
- `assets/sprites/cutaways/sera-liora/depth-v2/liora-lying.png` — Normalized character frames or exact-source furniture mask.
- `assets/sprites/cutaways/sera-liora/depth-v2/liora-sitting.png` — Normalized character frames or exact-source furniture mask.
- `assets/sprites/cutaways/sera-liora/depth-v2/liora-standing.png` — Normalized character frames or exact-source furniture mask.
- `assets/sprites/cutaways/sera-liora/depth-v2/right-bed.png` — Normalized character frames or exact-source furniture mask.
- `assets/sprites/cutaways/sera-liora/depth-v2/right-cover.png` — Normalized character frames or exact-source furniture mask.
- `assets/sprites/cutaways/sera-liora/depth-v2/sera-walk.png` — Normalized character frames or exact-source furniture mask.
- `image-assets.js` — Register versioned runtime assets and opening bundle.
- `index.html` — Load the two presentation modules.
- `movement.js` — Read shared gait cadence/cycle; collision unchanged.
- `render-entities.js` — Replace opaque-patch/independent-actor drawing with scoped layered scene.
- `render.js` — Replace opaque-patch/independent-actor drawing with scoped layered scene.
- `scene-depth.js` — Reusable validated stable layered painter.
- `sera-liora-scene.js` — Immutable peer metrics, read-only animation view and room composition.
- `test/cases/133-sera-liora-raster-integration.test.js` — Update superseded runtime asset expectations; preserve original behavioral coverage.
- `test/cases/137-sera-liora-bed-patch-integration.test.js` — Update superseded runtime asset expectations; preserve original behavioral coverage.
- `test/cases/138-sera-liora-guest-room-free-walk.test.js` — Update superseded runtime asset expectations; preserve original behavioral coverage.
- `test/cases/260-sera-liora-scene-depth.test.js` — Focused pixels, scale, route, depth, animation and render-isolation coverage.
- `world-transitions.js` — Validate approach and use shared asset readiness; dialogue unchanged.
