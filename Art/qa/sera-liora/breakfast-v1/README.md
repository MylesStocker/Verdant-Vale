# Bethany breakfast — Part 3

Part 2’s approved bedroom/courtyard content now continues right into the breakfast terrace. Both protagonists visibly walk between the scenes; Sera then regains control with Liora present. The unserved table can be inspected. Approaching the keeper—or the lower edge of the guest floor—starts a single interruption about two Buzzy Beetles in the yard and stores.

Sera and Liora volunteer without payment or persuasion. The keeper walks to the inner latch, opens the gate and steps aside. Liora and then Sera walk through validated routes into the yard; two independent beetles remain present and scuttle only a few pixels near the stores. After the final two spoken pages, a 0.65-second white fade uses the existing authenticated infirmary completion. The infestation is **not resolved**. No battle, attack, damage, victory, reward, combat statistics, enemy definition or Resonance technique is implemented.

## Geography, movement and state

The guest table/terrace is left of the kitchen service entrance. The low fence and closed inner gate separate it from the yard/stores on the right; the open back delivery doors show how the creatures entered. Both beetles can be seen before access opens. The generated plate contains no actors or text. An alternate open-gate image is consumed only through the inner gate's `(314,245,62,66)` crop, retaining all other base pixels. Existing `drawLayeredScene()` orders humans, monsters and the fence by ground depth. Foreground fence pixels intentionally hide part of Liora's lower dress when she stands inside the yard.

The same transient Bethany special-scene map identity and Sera room-space controller remain in use. Neither the underlying tile grid nor map/catalogue totals change. New floor/gate geometry belongs only to this scene stage. The inner gate blocks the footprint at `(345,303)` until the keeper opens it. Routes are sampled before starting and checked at each step against the floor, other actors and beetles. The lower passing lane avoids the stationary player; an unusual courtyard approach adds a small authored pass so Sera still leads at the next controllable arrival. There is no general follower system.

Final foot positions: Sera `(345,290)`, Liora `(435,290)`, both facing the yard. The beetles' base positions are `(386,189)` and `(481,191)`, with deterministic ±3px horizontal / ±2px vertical scuttles. Stable scene IDs are `bethany_buzzy_1` and `bethany_buzzy_2`; they are not enemy IDs. The keeper uses the temporary `bethany_keeper` speaker definition and is not added to the ordinary NPC registry or canonical party.

`sera-liora-breakfast.js` owns the new transient stage/routes. `finishSeraLioraBreakfastPreBattle()` is the sole normal future battle handoff: its temporary body starts the fade; it never invokes combat. Completion and checkpoint reset invalidate the scene epoch, clear routes/actors/fade and release cutaway ownership through the existing authorities. Cached image callbacks and old dialogue callbacks cannot restart the scene. Part 2's early return is replaced; the existing Esla awakening, one-time story flag, and progression order remain unchanged.

Lely's inventory, equipment, HP, XP, gold, statuses, day and canonical party remain isolated. SAVE_VERSION stays **5**; the existing cutaway menu/save policy is unchanged and transient actors are absent from saves. No new mutable quest state is introduced.

## Verification and visual review

- **242/242** complete regression suites, after **12** focused cutaway/dialogue suites passed.
- **24** changed/new JavaScript syntax checks; data validation **0 errors / 14 existing warnings**.
- All **934** regional fingerprints unchanged; read-only transition audit matches the existing artifact. No geographic artifact regenerated.
- Automated Chromium walkthrough: **3,291 checks / 22 captures / 0 browser errors / 0 combat starts**, at 512×480 and 1024×960. Ten new Part 3 captures are retained here; earlier Part 2 evidence remains separate.
- Three additional ad hoc async checks pass: pending breakfast images, failed-image safe handoff, and a late image completion after checkpoint reset. These are not extra full-regression suites.
- Suite 263 covers paired walking, two independently rendered beetles, containment, all reachable first-contact routes, keeper access, valid spacing, zero combat, fade/one-time completion, canonical-state isolation and reset. Earlier tests change only endpoint/asset expectations; their bedroom/courtyard assertions remain.
- The browser walkthrough uses real DOM keyboard events and production Canvas/fonts. It checks the entire bedroom → courtyard → breakfast → infirmary flow, including actual painted dialogue bounds, table inspection, gate state and the fade.

Representative arrival, departure, keeper, confrontation and fade captures were visually inspected. This is automated input/Canvas evidence plus static visual inspection, **not human real-time playtesting**. No blocking visual issue was found. Liora's hair slightly overlaps the inner edges of the beetle silhouettes in the final pose; both remain distinctly readable. This is a possible later composition refinement, not a resolved infestation or battle result.

[Asset prompts](ASSET_PROMPTS.md), [dimensions and hashes](manifest.json), and [verification details](verification.json) record the reproducible evidence. The generated sources are retained; approved bedroom/courtyard and protagonist art is unchanged.

```sh
node test/run.js
VV_BROWSER_PAGE=sera-liora-courtyard-browser.html VV_BROWSER_OUTPUT=/tmp/bethany-review node test/run-browser-smoke.js
node test/transition-audit.js
```

## Short walkthrough

1. Debug menu → **Play Sera/Liora Cutaway**, or use the normal final-dream entry.
2. Finish the bedroom, use its left door, then walk down/right in the courtyard. Finish the approved courtyard exchange.
3. Watch both women walk right into the breakfast terrace. Move Sera up to inspect the empty table, then right toward the keeper. Try a southern courtyard approach on another preview.
4. Advance the keeper's pages. Watch the latch, gate opening, keeper stepping aside, and both protagonists approaching without overlap.
5. Confirm two beetles stay visible, then close “Let’s rescue breakfast.” Expect a fade and Esla's existing infirmary awakening, **no combat**.
6. Repeat at 2×, hold movement/confirmation during staging, and confirm the return happens once.

## Final dialogue

1. **Keeper:** “The back gate was left open! Two Buzzy Beetles got into the kitchen yard and stores.”
2. **Keeper:** “We shut the inner gate. No breakfast until we’ve cleared them out.”
3. **Sera:** “An excellent argument for helping. Open it for us, please.”
4. **Liora:** “We’ll take care of them. Stay by the kitchen. I’ll take the one by the delivery gate.”
5. **Sera:** “Then the other one is mine. I refuse to spend a sunny morning negotiating with beetles.”
6. **Keeper:** “Thank you. Stand back while I get the latch.”
7. **Liora:** “Ready?”
8. **Sera:** “Very. Let’s rescue breakfast.”

Optional table inspection: “Two places are set. Neither has breakfast.”

## Exact Part 3 file increment

- `Art/generated/sera-liora/breakfast-gate-open-v1-imagegen-source.png`
- `Art/generated/sera-liora/breakfast-keeper-v1-imagegen-source.png`
- `Art/generated/sera-liora/breakfast-v1-imagegen-source.png`
- `Art/generated/sera-liora/buzzy-beetle-scene-v1-imagegen-source.png`
- `Art/qa/sera-liora/breakfast-v1/ASSET_PROMPTS.md`
- `Art/qa/sera-liora/breakfast-v1/README.md`
- `Art/qa/sera-liora/breakfast-v1/breakfast-arrival-1x.png`
- `Art/qa/sera-liora/breakfast-v1/breakfast-arrival-2x.png`
- `Art/qa/sera-liora/breakfast-v1/confrontation-1x.png`
- `Art/qa/sera-liora/breakfast-v1/confrontation-2x.png`
- `Art/qa/sera-liora/breakfast-v1/courtyard-departure-1x.png`
- `Art/qa/sera-liora/breakfast-v1/courtyard-departure-2x.png`
- `Art/qa/sera-liora/breakfast-v1/keeper-opens-gate-1x.png`
- `Art/qa/sera-liora/breakfast-v1/keeper-opens-gate-2x.png`
- `Art/qa/sera-liora/breakfast-v1/manifest.json`
- `Art/qa/sera-liora/breakfast-v1/pre-battle-fade-1x.png`
- `Art/qa/sera-liora/breakfast-v1/pre-battle-fade-2x.png`
- `Art/qa/sera-liora/breakfast-v1/verification.json`
- `Art/qa/sera-liora/courtyard-v1/README.md`
- `PROJECT_STATUS.md`
- `architecture.md`
- `assets/backgrounds/cutaways/sera-liora/breakfast-v1/gate-open.png`
- `assets/backgrounds/cutaways/sera-liora/breakfast-v1/terrace.png`
- `assets/sprites/cutaways/sera-liora/breakfast-v1/buzzy-beetle.png`
- `assets/sprites/cutaways/sera-liora/breakfast-v1/keeper-walk.png`
- `data.js`
- `image-assets.js`
- `index.html`
- `input.js`
- `movement.js`
- `npcs.js`
- `render-entities.js`
- `render.js`
- `sera-liora-breakfast.js`
- `sera-liora-courtyard.js`
- `sera-liora-scene.js`
- `story-checkpoint-lab.js`
- `test/cases/132-sera-liora-debug-menu.test.js`
- `test/cases/133-sera-liora-raster-integration.test.js`
- `test/cases/137-sera-liora-bed-patch-integration.test.js`
- `test/cases/262-sera-liora-courtyard.test.js`
- `test/cases/263-sera-liora-breakfast.test.js`
- `test/sera-liora-courtyard-browser.js`
- `test/sera-liora-courtyard-helpers.js`
- `world-transitions.js`

Earlier uncommitted Part 2/font-fix files remain present separately; the list above records only files added or changed by Part 3. Unrelated standalone regional visual-atlas files are untouched.
