# Overworld performance correction

Starting Codex HEAD: `12c76ddcac89555bbd8fdba57485a4ef2fed4b66`. Comparison: existing main checkout at `fb42db428b9e6217cbacaadf77dec9fdd4f08a3e`. No branch synchronization, geography rollback, or edit to another worktree. The three existing untracked visual-atlas files are preserved and excluded from this checkpoint.

## Browser method

Measurements use real-time Chromium `requestAnimationFrame` and the production game loop, update and Canvas renderer. One page is measured at a time, in the two existing checkouts. Browser: Chrome 155.0.8059.86, headless with GPU disabled; host Apple M5 / arm64 macOS, Node v24.14.1. The CSS display boxes are 512×480 and 1024×960, over the same 512×480 Canvas; emulated browser viewport 1280×1100, DPR 1.

Both versions use the same Assignment Ready checkpoint: solo Lely, MainQuest 4, day 6, no statuses, Slither multiplier 1, authored SPEED 2 pixels/update. The outdoor route is unchanged ordinary grass on MAP3, x336–432 / y240, reversing through DOM keyboard events before reaching obstacles. The indoor control is the Calwick player house, x176–304 / y272. Each scene warms for one second; outdoor idle and walking samples each last five seconds, indoor samples three seconds. Update and render costs are separately instrumented with `performance.now()`. Frame intervals come from production renders; distance is accumulated from actual successful movement, not estimated from SPEED. Debug suppresses random encounters during timing. Every reported sample has **zero excluded dialogue/encounter updates**. Separate three-second CPU profiles follow the timing samples and are not used for FPS results.

[before.json](before.json) was recorded before editing production. [after-initial.json](after-initial.json) retains the first post-fix run. [after.json](after.json) is the repeat performed after all functional tests finished, with no concurrent test workload. Each includes unchanged-main controls and both scales; profiler summaries include idle/program samples, so percentages are sample shares rather than whole-machine CPU utilization. These are automated browser measurements, not a human playthrough, VM frame-rate estimates, or universal hardware guarantees.

## Measured cause

`physicalMapIdForNpc()` called `outdoorContentKeyEntries()` for every implicit owner query. That diagnostic API materializes fresh records for **every** outdoor binding, after which the caller scans them for one key. Rendering invokes this repeatedly from neighbouring NPC drawing and cross-seam interaction prompts. Expanding from 244 to 934 chunks increased the size of every such list; the frame path scaled with the whole world rather than the relevant key.

The pre-fix Chromium profile places **89.4% of samples inside `physicalMapIdForNpc()` inclusively** (88.6% self). A separate deterministic instrumented update/render through the real runtime with the VM Canvas stub counted **2,222 lists / 2,075,348 materialized entries** at the benchmark position. That count is a runtime operation count, not a browser timing measurement.

Ordinary walking still advances exactly **2 pixels/update** before and after. The slowdown is missed frames: Codex rendering consumed roughly 23 ms/frame, exceeding the 16.67 ms budget, while main stayed near 6 ms. Indoors remained near 60 fps in both versions. Visible-chunk selection is already viewport-bounded; world coordinate and seam lookups are indexed. Region bounds still scan placements, and NPC passes still visit resident lists, but the profile did not justify changing those paths, encounters or collision rules.

## Correction

- `regional-npc-runtime.js`: `physicalMapIdForNpc()` delegates implicit ownership to one O(1) key lookup. Explicit physical ownership retains its original placement/content-key checks; ambiguous, unknown and nonregional keys fail closed.
- `continuous-content.js`: `_ccAmbiguity()` derives the forward diagnostic and reverse unique-owner indexes together. `unambiguousOutdoorMapIdForContentKey()` reads the reverse index without creating a whole-world list. `outdoorContentKeyEntries()` remains the fresh diagnostic enumeration API.
- `data.js`: the existing `OUTDOOR_CONTENT_KEYS` object tracks successful assignment, deletion and `defineProperty` edits through a private transient revision. The next lookup rebuilds both derived indexes once. Cached positive/negative/ambiguous results therefore cannot survive binding edits incorrectly. No NPC position, schedule, route, facing, gameplay flag or saved field is cached.

No movement speed, timer, terrain/status multiplier, encounter table/roll, world grid, camera, seam definition, persistent payload or SAVE_VERSION change. No geographic artifact regeneration.

## Outdoor measurements

Main rows below use the final unchanged-main control; Codex before uses the recorded pre-fix run; Codex after uses the final repeat. All values are directly measured.

| Scale | Build | Activity | FPS | Pixels/s | Mean update ms | Mean render ms | p95 frame ms |
|---|---|---|---:|---:|---:|---:|---:|
| 1× | Main | idle | 59.98 | 0.00 | 0.093 | 6.180 | 17.5 |
| 1× | Main | walk | 59.98 | 119.96 | 0.136 | 6.218 | 17.5 |
| 1× | Codex before | idle | 41.00 | 0.00 | 0.253 | 22.981 | 25.1 |
| 1× | Codex before | walk | 40.73 | 81.47 | 0.306 | 23.061 | 25.4 |
| 1× | Codex after | idle | 59.98 | 0.00 | 0.155 | 1.163 | 17.4 |
| 1× | Codex after | walk | 59.98 | 119.96 | 0.253 | 1.089 | 17.5 |
| 2× | Main | idle | 59.99 | 0.00 | 0.093 | 6.053 | 17.5 |
| 2× | Main | walk | 59.98 | 119.97 | 0.132 | 6.162 | 17.5 |
| 2× | Codex before | idle | 40.43 | 0.00 | 0.258 | 23.283 | 25.6 |
| 2× | Codex before | walk | 40.77 | 81.54 | 0.299 | 23.051 | 25.5 |
| 2× | Codex after | idle | 59.99 | 0.00 | 0.076 | 0.640 | 17.5 |
| 2× | Codex after | walk | 60.00 | 119.99 | 0.162 | 0.677 | 17.5 |

Native walking render cost falls from **23.061 to 1.089 ms** (95.3% lower); 2× falls from **23.051 to 0.677 ms** (97.1% lower). Walking returns from about 81.5 to 120 pixels/second, matching the main control and retaining two pixels/update. Idle render costs improve similarly.

The first native post-fix walking trial returned **53.19 fps / 106.38 pixels/s**, with mean render 1.288 ms and p95 frame interval 33.7 ms. Its adjacent indoor-idle sample also missed some frame slots. The repeated protocol returned 59.98 fps natively. The low measured update/render cost demonstrates that the original 23 ms ownership bottleneck is removed, but these observations do not establish the exact cause of the first trial's missed slots; both runs are retained rather than hidden. Browser/OS scheduling and the existing frame-based movement loop can still affect distance per real second under external load. Changing that timing model is outside this correction.

## Indoor walking controls

| Scale | Build | FPS | Pixels/s | Mean update ms | Mean render ms |
|---|---|---:|---:|---:|---:|
| 1× | Main | 60.00 | 119.99 | 0.607 | 0.776 |
| 1× | Codex before | 59.99 | 119.98 | 1.206 | 0.728 |
| 1× | Codex after | 59.98 | 119.96 | 0.282 | 0.597 |
| 2× | Main | 59.98 | 119.96 | 0.590 | 0.771 |
| 2× | Codex before | 59.96 | 119.92 | 0.758 | 0.487 |
| 2× | Codex after | 59.97 | 119.95 | 0.079 | 0.224 |

## Functional verification

- Complete regression: **239/239 suites**, zero failures. All five changed/new JavaScript files pass syntax checks.
- Suite **319** verifies independent ownership parity for the existing residents, explicit/ambiguous/unknown owners, cached misses becoming valid, aliases becoming ambiguous and unique again, assignment/delete/descriptor edits, detached diagnostic results, state purity, and two-pixel held movement. With an additional 2,048 instrumented unrelated bindings, warm ownership/update/render performs **zero binding enumerations and zero reads of the extra tail**. Re-entering the original list API on that path throws. There are no wall-clock assertions.
- Automated Chromium targeted smoke: **82 checks** at native/2× scale. Held negative-to-zero seams in continuous/legacy modes, negative debug warp/save/load, walking/camera framing on the four explorable bounds (column -7/29, row -14/11), river-mouth water collision and retreat, indoor movement, and ordinary movement-triggered grass encounter entry all pass. [functional.json](functional.json) records exact locations and distinguishes synchronous input checks from timing measurements.
- Existing browser suites: **110 geography checks** and **7,119 lifecycle checks**, both zero errors. Both river bridges, Mornay gates/rooms/services, earlier towns, speaker styling and ferry presentation remain covered.
- `validateGameData()`: **0 errors / the same 14 warnings**. All **934 regional fingerprints** remain unchanged. Read-only transition audit matches its committed artifact. SAVE_VERSION stays **5**. `git diff --check`, conflict-marker, stale hot-path enumeration and final scope checks pass. [verification.json](verification.json) contains exact results.

## Reproduce and inspect

From the Codex worktree, with installed Chromium and Node providing built-in WebSocket:

```sh
node test/profile-overworld.js ../empire-game /tmp/overworld-comparison
node test/profile-overworld.js ../empire-game /tmp/overworld-smoke --smoke-only
node test/run.js
node test/transition-audit.js
```

`VV_BROWSER` can select the Chromium executable. The comparison checkout is read-only. The selected output prefix receives timing JSON and separate main/Codex `.cpuprofile` files; open those in Chrome DevTools to inspect the sampling stacks. A manual playtest should walk the benchmark grass, cross a nearby seam, press against a river bank, save/load west of column zero, and enter/leave a familiar building. No human playthrough is claimed here.

The three production files above are the entire gameplay correction. Suite 319, the profiling tool, this evidence package and the brief architecture/status entries provide coverage and reproducibility. Existing visual-atlas files remain unrelated and untracked. Nothing is merged into main or pushed.
