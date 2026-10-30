# Valmere access and Serpentsmoke — 2026-10-29

This pass extends the user's clarified **full shoreline north of row 0**, in
columns 9 and 10. Existing uncommitted Mornay jobs/Maw and Great Fen encounters
were preserved. Main remains at `dc425d2`; no Git operation was requested.

## Player-visible changes

- All 25 land-bearing shoreline chunks in those columns, through row -13,
  have connected foot access. Eleven formerly scenery-only chunks now permit
  placement, saving and ordinary Eastern Fens hard encounters. Existing Great
  Fen assignments remain unchanged; open lake water remains impassable.
- (8,0) now uses the ordinary Eastern Fens hard pool. Its terrain and seams are
  unchanged. (7,0) retains Fen Zolom and warns on arrival, before encounter RNG.
  The warning pauses movement and can be dismissed before retreating.
- Messa Yule's MQ5 paperwork conversation directs the party to Henric Sorn,
  upstairs at Sorn Work Gear, Middle Lower Central West. His private stock is
  Serpentsmoke (60g), Trollbane (15g), and Reed Remedy (50g). The existing room,
  family, stairs, ordinary shop controller and save authority are reused.
- Serpentsmoke consumes one item and guarantees escape when its action resolves
  in a Zolom-only fight. Initiative still matters: an enemy can act first.
  No victory reward is paid. Use against another enemy wastes the item/action.
  Mixed encounters with another living creature cannot use this escape.
- No MQ5 advancement, discovery flag, new NPC/interior, camera change, new tile
  type, enemy-stat change or save-schema change. SAVE_VERSION stays 5.

Price and wording are revisable content. The warning intentionally says not to
**rely** on running: canonical party combat retains its boss Run lock; the older
solo engine retains its existing probabilistic speed contest. This pass does
not change either ordinary Run rule. Serpentsmoke works in both engines.

## Exact geographic evidence

- `grid-deltas.json`: all 88 TREE(3) → GRASS(0)/REED(23) cells, across 13 grids.
  No water or other terrain types changed.
- `metadata-deltas.json`: eleven access changes and the two Zolom-area notes/
  profile changes (13 records total).
- `edge-deltas.json`: 40 directed structural edge entries. Reciprocal openings
  retain geometry and base walkability; boundary and legacy inset cells agree.
- Every walkable tile in all 25 accessible shore chunks has a return path to
  the established (7,0) approach. No new isolated walkable component.
- Live totals: 1058 regional chunks, 488 explorable / 570 scenery-only,
  469 encounter-enabled chunks, 1263 total maps, 2072 edge segments,
  1992 continuous eligible segments. Physical-edge audit: ALIGNS1568,
  BLOCKED2494, BORDER166, INTENTIONAL_DISCRETE4.

## Verification

Final verification: **280/280 full regression suites pass**, including historical
singleton, Formation, party/Resonance, Sera/Liora, old towns, progression boundaries
and both Mornay gates. Validation: **0 errors, 6 pre-existing warnings** (notice
board walkability, Zolom ATK, Takomo generic sprite, historical unrouted raw pool,
two older long dialogue entries). Syntax: **78 changed/new JavaScript files pass**
across the complete dirty worktree. All1058 fingerprints match. Transition audit:
0 dimension mismatches, all479 fixed destinations valid; structural seam checks
pass. `git diff --check` and conflict-marker search pass. Save version remains5.

Focused suites
343/344 cover actual controller item selection, single consumption, authenticated
RNG-free replay and forged-item rejection, wrong-creature and mixed-fight failure,
canonical solo/party and legacy singleton escape, legacy Formation mismatch,
ordinary shop payment/insufficient funds/inventory persistence, unchanged MQ5
flags, every changed seam midpoint in continuous AND legacy modes, save/load on
all eleven new chunks, return paths and warning timing/re-entry/debug arrival.

An additional deterministic headless check drove a normal movement frame with
encounters enabled on all eleven new chunks; every one entered an ordinary
random fight. No terrain-eligibility exception was needed.

The older all-seam walking suite acknowledges the new warning before measuring
motion. The shop-home walking suite closes Henric's newly offered shop before
continuing to his family. Historical terrain tests reverse only exact reviewed
later changes on detached snapshots; original protected-grid assertions remain.

Browser evidence is from an isolated MQ5 fixture, not a whole-game playthrough.
It loads live scripts without HTTP cache, does not load existing saves and uses
native keyboard input for dialogue, shops and battle. Its Walk buttons dispatch
held keyboard input and simulate 45 ordinary update frames to avoid background-tab
throttling. Random encounters are disabled in this visual fixture only; the
normal pool, permission and combat contracts are verified by automated suites.

Observed in Chrome:
- Northern (9,-12) → (10,-12) crossing and return.
- Walk from southern Reedbelt into (7,0), warning and retreat to the Reedbelt.
- Messa's full directions and readable pagination.
- Henric's conversation, shop, one purchase reducing gold1000→940.
- Actual party command selection and Serpentsmoke escape, Zolom still400HP,
  return to field and no gold reward. Fixture Lely has300HP to inspect the flow;
  this is not balance evidence. Zolom acted before the smoke and hit Esla.
- Shore and shop visuals at512×480 and1024×960 CSS scale. Double-scale screenshots
  show the visible viewport; they are not full-canvas captures.

Screenshots: `shore-native.png`, `shore-2x.png`, `northern-crossing.png`,
`zolom-warning.png`, `messa-tip.png`, `messa-directions.png`,
`henric-purchase.png`, `henric-2x.png`, `serpentsmoke-escape.png`.

## Artifacts

Regenerated only through established tools:
- `node test/regional-atlas.js --fingerprints`:13 changed grid hashes; all1058
  verified. Other hashes preserved.
- `node test/transition-audit.js --write`: transition audit JSON.
- `node test/regional-atlas.js --write`: atlas Markdown, inventory JSON and SVG.
  Inventory also catches up the preceding Great Fen encounter-profile assignment
  on174 chunks; those earlier assignments are not new geography in this pass.
  Generator snapshot date updated to2026-10-29.

## Suggested follow-up walkthrough

1. From the Eastern Fens, approach (7,0), read the warning and retreat.
2. Visit (8,0); encounters should be ordinary enemies, never Fen Zolom.
3. Follow the newly open bank north through columns9–10 and return. Save/reload
   along the shore, particularly around the northern bends.
4. During MQ5, talk to Messa in the Regional IJC Office. Follow her directions
   upstairs at Sorn Work Gear, speak with Henric and buy Serpentsmoke.
5. In a Zolom battle use Item → Serpentsmoke → Fen Zolom. Confirm the escape and
   consumed item; reload an ordinary save to verify inventory continuity.

This checklist supplements the automated exhaustive seam/save coverage; no claim
is made that every shoreline tile was manually walked in the browser.

## Files changed by this pass

The following list distinguishes this pass from the larger pre-existing dirty
worktree. Shared production files retain the preceding jobs and Great Fen work.

- `Art/qa/regional-geography/inventory.json`
- `Art/qa/regional-geography/overview.svg`
- `Art/qa/valmere-access/ (this report, exact deltas and screenshots)`
- `GREAT_FEN_ENCOUNTERS.md`
- `MORNAY_TOWN_PLAN.md`
- `OVERWORLD_ATLAS.md`
- `PROJECT_STATUS.md`
- `architecture.md`
- `combat.js`
- `content/maps/eastern-fens-maps.js`
- `content/maps/great-fen-maps.js`
- `content/maps/mainland-maps.js`
- `content/npcs/mornay-npcs.js`
- `data.js`
- `items.js`
- `movement.js`
- `render-battle.js`
- `render-party-battle.js`
- `shops.js`
- `test/cases/100-east-causeway.test.js`
- `test/cases/101-west-outfall-canal-tunnel.test.js`
- `test/cases/102-north-basin-drowned-rim.test.js`
- `test/cases/103-north-basin-mirewood.test.js`
- `test/cases/155-formation-four-command-integration.test.js`
- `test/cases/171-party-command-status-hardening.test.js`
- `test/cases/176-eastern-fens-envelope.test.js`
- `test/cases/177-eastern-fens-western-pockets.test.js`
- `test/cases/178-eastern-fens-nw-open-fen.test.js`
- `test/cases/200-eastern-fens-mornay-encounter-content.test.js`
- `test/cases/316-mornay-shop-homes-orientation.test.js`
- `test/cases/317-mainland-navigation.test.js`
- `test/cases/318-mainland-water-camera.test.js`
- `test/cases/322-wetwoods-thornmere.test.js`
- `test/cases/323-valmere-shoreline.test.js`
- `test/cases/342-great-fen-geography-art.test.js`
- `test/cases/343-serpentsmoke.test.js`
- `test/cases/344-valmere-access-warning.test.js`
- `test/cases/72-continuous-seams.test.js`
- `test/cases/77-map3-fen-seam-pilot.test.js`
- `test/cases/78-verdant-vale-legacy-home.test.js`
- `test/cases/83-map3n2-northbasin-seam-closure.test.js`
- `test/cases/85-canonical-consumers-part2.test.js`
- `test/cases/86-regional-chunk-catalog.test.js`
- `test/cases/88-continuous-regional-production-default.test.js`
- `test/cases/89-west-outfall-scenery-chunk.test.js`
- `test/cases/90-north-basin-open-reservoir.test.js`
- `test/cases/91-north-basin-open-reservoir-east.test.js`
- `test/cases/92-north-basin-eastern-woods.test.js`
- `test/cases/95-north-basin-eastern-road.test.js`
- `test/cases/96-eastern-canal-banks.test.js`
- `test/cases/97-northern-thornmere-fen.test.js`
- `test/cases/98-thornmere-upper-shallows-scenery.test.js`
- `test/cases/99-thornmere-canal-head.test.js`
- `test/fixtures/regional-grid-fingerprints.js`
- `test/fixtures/valmere-access-history.js`
- `test/regional-atlas.js`
- `test/regional-geography-browser.js`
- `test/transition-audit-output.json`
- `test/valmere-access-preview.html`
- `test/valmere-access-preview.js`
- `validation.js`
- `world-transitions.js`

## Final Git state

Branch `main`, HEAD `dc425d2`, no staged changes. Nothing committed, merged or
pushed. Existing dirty work remains present. `git-status.txt` records the exact
final status of this checkout, including prior work outside this pass. No other
worktree was edited.
