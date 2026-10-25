# Regional geography pass — mainland and drainage

## Authority and baseline

Worktree: existing `agent/codex`. Starting HEAD `cfba9a195600be1988ea40602a4ff02beb26f248`, clean, no active Git operation; the agent registry showed no other active editor. Fast-forwarded to committed main `fb42db428b9e6217cbacaadf77dec9fdd4f08a3e`. Main and the Mornay worktree are read-only throughout this pass. The approved Sera/Liora reference is already tracked and matches suite 260: `47fbf97862f2865fda59a0750970112933fe0cdbd41c49bc29b0544b27c9a025`; no prerequisite import is needed.

The synchronized baseline passes 236/236 suites. Live data agrees with the atlas: 244 regional chunks, 121 accessible, 123 scenery, 407 total maps. The atlas is evidence, never the runtime authority. SAVE_VERSION remains 5. A disposable VM fixture relocated two adjacent chunks into negative columns and passed actual held-control crossing, lookup, camera/render and save/load in continuous and legacy modes before any western authoring. No production coordinate correction is required.

## Landforms and exploration

The approximate authored window is columns -8 through 30, rows -15 through 12. Irregular explorable footprints and a small scenery halo follow landforms; the window is not a rectangular quota or the edge of the continent.

- **Great Fen:** broad sedge plains, peat fans, willow basins, slow channels and raised gravel islands north of row -3, extending substantially west of column zero. Existing (7,0)/(8,0) entrances retain the southern transitional fen. Internal water frames become wetland/woodland. Multiple branching loops cross recognizable multi-chunk landforms. The southern wooded sill and deep channels separate the fen from the early reservoir country; the fen does not provide a ferry or Rise bypass.
- **Valmere:** a vast open, cold freshwater sea across the north/northeast, continuing beyond both limits. Preserve the existing western-shore spit, Mornay peninsula, marker, harbour, town entrances and eastern exposure. No opposite shore or walkable shoal chain. East of Mornay, an irregular mainland shore has shingle points, eroded banks and reed coves, with broad wooded country behind it.
- **South:** pasture and mixed woodland begin south of Thornmere around columns 4–8 and broaden into rolling country. A deep reed-fringed channel physically separates the early western bank from the post-ferry bank. One bounded southern opening from `MAP3` and one from the existing western dry-rise toe provide exploration; neither changes their content. Raised land, soil and vegetation change gradually into the Southern Moraine.
- **Moraine and eastern mainland:** wooded ridges, gravel shoulders, kettle hollows and sheltered valleys join the existing southern and eastern offshoots to substantial mainland. A wooded western scarp keeps the west side of Travellers’ Rise separate from the onward country. Only the established Rise crossing joins those story sides. Quiet clearings, coves and ridge ends may terminate naturally, with return paths.

## Drainage, chosen before channels

The new unnamed river arrives from the southeastern edge near (28,12), bends northwest through the higher country near (25,8), passes through a low gap between the wooded moraine ridges, then runs north near (22,2) to Valmere east of Mornay. Its mouth is separate from the sheltered harbour. The lower channel widens toward the lake; two tributaries descend from the western moraine and eastern wooded hills. Two ordinary timber crossings permit exploration on both banks. The upstream river and Valmere’s continental outlet continue outside this window. No water simulation or new quest mechanism is added.

Existing infrastructure is preserved: the North Basin reservoir, its exposed waterlines and sluice content; the Drenwick canal’s water row, guarded bridge and working waterfront; the West Outfall’s boat-scale tunnel through its wooded ridge; the North Basin/East Causeway breach and official cable scow; and the managed eastern channel carrying the road north to Valmere. The new river is a separate catchment, not an invented connection to a quest sluice or the cause of the drought. Local fen channels remain slow and shallow, with deep reaches impassable. The western countryside separation channel is not declared to be Valmere’s continental outlet.

## Danger, sparse future sites and state

Fen Zolom retains its exact template, stats, escape rules and two current encounter assignments. Raised natural creek-bed ground outside both southern entrances gives an encounter-free observation/retreat approach. Flattened vegetation, drag scars, splintered timber and deserted banks are visible before entering the encounter-bearing reeds. Northern return approaches receive corresponding safe observation ground. Ordinary wilderness uses the existing compatible hard formations; main-route tables and encounter selection are unchanged.

Four inert future sites: a raised fen hamlet island, a shore observation/weather-station point, an abandoned forestry/quarry clearing and a river/mill terrace. Minimal unoccupied traces only; no NPC, item, interaction, reward, quest, mutable flag or transport service. Names and descriptive landform labels are revisable cartographic flavour.

## Implementation and verification contract

Author inline 15×16 grids through regional definition fragments; retain every existing map ID and coordinate. Structural seams remain reciprocal ordinary `EDGE_TRANSITIONS`, with no callbacks, conditions or movement exceptions. Keep all protected content grids unchanged except the explicitly documented southern boundary openings and Zolom presentation cells. Add geographically appropriate scenery wherever expanded camera bounds would expose void, including around older accessible terrain.

Verify whole-region tile reachability and return paths from each story side; remove ferry connectivity and the Rise trigger from the navigation graph and prove the story sides remain separated. Exercise negative-coordinate controls/save/load, continuous and legacy seams, river/shore edges, encounter ownership, all accessible camera positions, old towns and historical combat. Render the overview from live tile data and inspect representative production browser views. Record exact existing-grid deltas, legitimate fingerprints and transition artifacts, focused/final tests, counts, screenshots and local checkpoint commits below.

## Initial mainland checkpoint footprint and drainage

The final live window is exactly **columns -8…30, rows -15…12**. It contains **934 regional chunks: 481 explorable and 453 scenery**, with 462 encounter-enabled chunks. The full catalogue contains 1,097 maps. There are 690 added chunks: **331 explorable, 359 scenery**. Of those scenery additions, 228 are plain open-lake chunks; about 72% of newly authored non-open-water land is explorable. Another 29 existing scenery chunks become explorable; every one of the original 121 accessible map IDs retains access. No map ID or existing chunk coordinate is removed or moved.

| Display region | Total | Explorable | Scenery | Encounters |
|---|---:|---:|---:|---:|
| Great Fen | 247 | 174 | 73 | 174 |
| Valmere | 271 | 13 | 258 | 13 |
| Southern Countryside | 97 | 67 | 30 | 67 |
| Southern Moraine | 131 | 96 | 35 | 96 |
| Eastern Mainland | 64 | 49 | 15 | 49 |
| Existing Eastern Shore | 17 | 16 | 1 | 16 |

Earlier starting-region chunks account for the remainder. The fen has western willow basins, a long sedge plain, peat fans and several broad raised islands. Its slow channels have limited gravel fords; those do not cross the separate deep water that protects story progression. Northern/western margins read as continuing bog woodland, rather than an inland fen surrounded by open sea. The existing Valmere western shore is now one attached irregular spit, including its old eastern headland. The southern and eastern country contains broad woodland clearings, stressed pasture, gravel shoulders, moraine crests, kettle ponds and river banks. No population, quest or transport service was added.

The new river is intentionally unnamed. From the southeastern edge near **(28,12)** it flows **northwest** to **(25,8)**, through the low moraine gap, bends past **(25.5,6)** and **(23,4.5)**, then flows **north** near **(22,2)** into Valmere near **(22,0)**. This is east of Mornay's peninsula and sheltered harbour. A western tributary descends from the moraine near **(18,10.5)** toward the river near **(25,8)**; an eastern tributary joins near **(25.5,6)** from the wooded country near **(30,4.5)**. Water continues beyond the southeastern authored boundary. The lake outlet remains outside this region and undefined.

Two timber bridges cross the river: the lower crossing is near **(22,3)**, on world tile row **49**; the moraine crossing is near **(25,8)**, on world tile row **120**. Both have clear gravel bank approaches. The river channel takes precedence over the shoreline shingle, so the mouth is not sealed by beach terrain. Water connectivity includes the channel beneath existing bridge-deck art; no water simulation or special crossing mechanic is introduced.

### Existing water infrastructure trace

- `NORTH_BASIN_*` grids and their authored interactions remain byte-equivalent. The eastern side of the exposed western banks is the **reservoir**, not a canal (`north-basin-maps.js`, western-bank authority; `north-basin-interactions.js`, exposed-basin observation). Low waterlines and sluice quest semantics are preserved.
- The Drenwick watercourse crosses **west–east** through `MAP3_N2` and `DRENWICK_EAST_CANAL_MAP`, continuing along row 5 into `NORTH_BASIN_SE_MAP`. The guarded crossing remains in place. `DRENWICK_WEST_OUTFALL_MAP` carries the western water into its existing boat-scale tunnel through the ridge. Grids establish channel orientation and continuation, but do not specify a single simulated hydraulic head or net current; this pass does not invent one.
- The broken East Causeway remains a water barrier. Its official cable-scow endpoints and `MainQuest >= 5` availability are unchanged. The eastern road follows the managed channel north to Valmere, as established in lore and the original route grids.
- The new eastern river is a **separate catchment**. It is not connected to a quest sluice or declared responsible for the reservoir decline. Thornmere remains its own freshwater basin. The deep southern reed channel separates the early and post-ferry countryside; its continuation outside the window is not declared to be Valmere's continental outlet.

## Reservations, warnings and exact changes

Four unoccupied trace sites remain inert: fen footing stones near **(-2,-9)**; a shore observation-station point near **(24,0)**; a forestry/quarry clearing near **(18,8)**; and a river/mill terrace near **(23,3)**. Their stones, timber or stakes have no interaction, door, NPC, pickup or quest state. The wider lake, island ferry, Mornay harbour departures and all reserved Mornay story content remain governed by their earlier authorities.

Safe natural creek-bed bars (`RODDON_SILT`, 111) lead north from the existing reedbelt boardwalks at columns 7 and 8. The bars are not encounter terrain. Flattened/muddy reed bands and splintered timber mark the two Zolom maps beyond them. Equivalent safe observation strips lie on the northern approaches. Entering the encounter-bearing reeds retains the original Zolom pool and escape rules; being able to retreat on the geography is not a promise of escape after combat begins.

Exactly **143 existing regional grids / 22,083 cells** change. The complete `[column,row,old tile,new tile]` record is [grid-deltas.json](Art/qa/regional-geography/grid-deltas.json), generated by comparing final live data with the synchronized baseline. The 101 other existing regional grids remain byte-equivalent, as do all discrete towns/interiors and existing content/speaker/party authorities. In the protected approach area, changes are limited to:

- `MAP3`: columns 10–12, row 14, TREE → GRASS (three cells), opening the southern countryside.
- `EASTERN_FENS_ENVELOPE_C9R4_MAP`: columns 7–9, rows 7–14, to GRAVEL_BAR (24 cells), opening the western dry-rise toe southward.
- Each southern Zolom approach: seven creek-bed cells plus two timber props (nine cells); the original boardwalks remain unchanged.
- Each Zolom territory map: sixteen changed cells in the muddy drag band / splintered timber presentation; its mandatory entry/exit cells and encounter assignment remain unchanged.

The remaining edits reshape existing Great Fen, Valmere, Eastern Shore and Southern Moraine terrain/framing. Terrain changes can make an old saved standing cell non-walkable; invalid placement continues to fail atomically rather than silently relocating the party. No save migration, payload field or version bump is added. All new maps and representative new locations support ordinary version-5 save/load.

## Architecture and evidence decisions

`content/maps/mainland-maps.js` adds one ordinary regional fragment with inline grids. `data.js` resolves it through the existing profile/catalogue machinery; `index.html` supplies the normal load-order entry. Existing regional owners retain their original IDs. `world-transitions.js` contains ordinary reciprocal structural seams; no callback, condition, input-specific escape or map-specific movement exception is added.

Two bounded diagnostic corrections are required by the larger window. Encounter validation now checks a point west of the **actual minimum authored column**, rather than assuming every negative coordinate is void. Legacy-boundary validation distinguishes scenery-only neighbours from player crossings; all newly visible neighbours still carry the established camera-exclusion policy. Verdant Vale's home retains `legacy_screen`, with no new home exit. Movement, rendering, encounter selection and save schema are unchanged.

Plain open Valmere intentionally has repeated all-WATER scenery grids. The fingerprint test now permits duplicates **only** when every cell is WATER, the map is inaccessible and encounter-free, and no structural exit exists. Explorable grids remain unique and every grid has a fingerprint. This avoids adding fake islands or rocks merely to manufacture hash differences. The coarse map-ID graph has two components because opposite banks can occupy one chunk; the stronger **tile graph** proves the ferry and Rise separations.

Generated evidence uses `node test/regional-atlas.js --write`, `node test/regional-atlas.js --fingerprints` and `node test/transition-audit.js --write`. The atlas, overview, inventory, fingerprints and transition audit reflect legitimately changed inputs. There are no geographic catch-up edits from another worktree. Atlas/SVG and production-Canvas overview are distinct views of the same live tile grids. Historical aggregate tests are updated for the authorized footprint; route, callback rejection, collision, state and combat assertions remain substantive.

## Walkthrough checklist

1. From Thornmere's `MAP3` (2,5), confirm the seven-cell water barrier blocks the former southern opening. The southwestern bank remains sealed for this pass; use debug warp to inspect that reserved component and to leave an existing save inside it.
2. Cross the official ferry normally. Inspect either Zolom approach from the safe creek-bed bar; stop and turn back before the encounter-bearing reeds if avoiding the creature. Check that the original boardwalk remains visible.
3. Explore north into the Great Fen and branch west to the Willow Basin near (-6,-10), north toward the Peat Fans near (4,-12), and back through the gravel fords. Save/load west of column zero and cross back through column zero in both presentation settings.
4. Complete the ordinary Travellers' Rise ambush and campsite/campfire requirements, then continue toward Mornay. Verify both town gates and familiar services.
5. Follow the eastern shore into the new mainland. Inspect the separate river mouth near (22,0), cross the lower bridge near (22,3), follow the valley to the moraine gap near (25,8), cross its bridge and return along the other bank. Inspect a sheltered cove, kettle pond and the sparse future-site traces.
6. Review the shore and fen at 512×480 and 1024×960. Open lake water and outer woodland remain impassable, with no visible camera void. The submitted browser evidence is automated input/Canvas verification plus visual inspection of captures, not a human playthrough.

## Final verification evidence

- Focused suites **317/318 pass**. They preserve original route footing and coordinates, prove physical ferry/Rise cut sets and return paths, exercise negative-coordinate held controls and v5 save/load in both presentation modes, check drainage and encounter ownership, and enter/retreat from both Zolom approaches without changing their combat rules.
- The camera check covers **81,551 walkable tile centres plus 326,204 conservative tile-corner extrema** (407,755 viewports), including earlier accessible terrain: no visible void. Four reed cells that were already unreachable in the baseline remain documented exceptions to the navigation flood; no new unreachable walkable cell is exempted.
- `validateGameData()` reports **0 errors / 14 existing warnings**; every warning message also occurs in the synchronized baseline. IDs and chunk coordinates are unique. All **934 fingerprints** match. The exact delta artifact was checked against final live data and the baseline, not just counted.
- The transition audit verifies **396 fixed placements, eight preserved-coordinate cases, 2,058 structural segments and 1,978 continuous-eligible entries**. Its tracked artifact matches the read-only audit. There are no remapping/conflicting regional edges. Main-route encounter tables, enemy templates, formations, flags and SAVE_VERSION 5 remain unchanged.
- Automated Chrome geography review passes **110 checks / 27 captures / 0 errors**, including held keyboard crossings through column zero and both river bridges in continuous/legacy views, ten terrain save/load locations, safe Zolom observation ground and earlier-town rendering. The existing browser lifecycle passes **7,119 checks / 172 captures / 0 errors**, including both Mornay gates, services, homes, dialogue styling and ferry presentation. These are automated controls and inspected Canvas captures, not a human playthrough.
- Fifteen PNGs, including the production overview and seven native/2× view pairs, are packaged with hashes and provenance in [the evidence guide](Art/qa/regional-geography/README.md). The [vector overview](Art/qa/regional-geography/overview.svg), [production overview](Art/qa/regional-geography/production-overview.png), live inventory and exact grid deltas are generated/read from actual data.

The map owners changed are `eastern-fens-maps.js`, `great-fen-maps.js`, `valmere-expanse-maps.js`, `eastern-shore-maps.js`, `southern-moraine-maps.js`, `thornmere-wilds-maps.js` and the new `mainland-maps.js`. Registration/load order changes are confined to `data.js` and `index.html`; structural geography is in `world-transitions.js`; two bounded diagnostics are in `validation.js`. Tests retain substantive collision, state, route and combat assertions while updating footprint-dependent expectations. The atlas, fingerprints and transition artifact are regenerated because their actual inputs changed, with no unrelated catch-up increment. QA tooling and documentation are the remaining files.

No player-facing NPC, dialogue, item, quest, building, new terrain type or mutable state is introduced. Regional enemy reweighting is deferred: this pass uses the existing compatible hard table rather than changing route balance. River naming, settlement development and any regional lake-outlet explanation remain later design decisions. All other worktrees remain untouched; the unrelated status-cure worktree's existing five-file edits are preserved.

The final complete regression passes **238/238 suites, zero failures**, following the synchronized **236/236** baseline. This includes historical singleton, Formation, party-command and Resonance compatibility; ferry/Rise/camp sequences; Calwick/Drenwick/Mornay lifecycles; and the complete 1,978-entry held-control seam sweep. All **58 changed/new JavaScript files** pass `node --check`; `git diff --check`, conflict-marker, unique-ID, fingerprint and final file-scope reviews pass. [verification.json](Art/qa/regional-geography/verification.json) records the exact results and validator warnings. Initial footprint-dependent test failures were corrected by asserting the authorized geography; no combat, state, collision or progression assertion was dropped to obtain this result.

The local plan checkpoint is `fd36e37` (parent `fb42db4`); the terrain, tests, artifacts and final evidence form the next coherent checkpoint on `agent/codex`. Nothing is merged into main or pushed. Main remains `fb42db4`, Mornay remains `f4c9f54` and Claude remains `3bd0d25`. Final checkpoint hash and clean Git status are reported with delivery.


## Early-region framing follow-up (current)

Northern Road (`MAP_N1`) and Blocked Path (`MAP_N2`) retain their old western camera edge at world X 0. Eastern Reaches (`MAP2`) and Thornmere Fen (`MAP3`) retain their old southern edge at world Y 2880 (native camera top capped at 2400). These are four authored `cameraClampEdges` policies; global region bounds, the expanded world, and other maps' cameras remain unchanged. The legacy-screen home exclusion still applies independently. Policies are validated and may only name closed structural edges.

Exactly seven MAP3 cells change GRASS → WATER: columns 9–12 on row 13 and columns 10–12 on row 14. Both directions of the former MAP3/southern-mainland seam are removed. The [delta record](Art/qa/early-region/grid-deltas.json) is relative to `fb6c65f`; every other grid is unchanged in this follow-up. The original mainland delta snapshot remains historical evidence. Relative to the original synchronized foundation, 143 grids now differ in 22,087 cells.

Myles explicitly confirmed that the southern area should remain sealed for this pass. Its western-bank component spans parts of 34 chunks; some chunks also contain a separate reachable eastern bank. Terrain and placement/save permissions remain intact for authoring and existing saves, but no replacement route, one-way exit, emergency transition or new progression flag is invented. Existing saves inside the sealed component need debug warp to leave. Navigation tests now distinguish ordinary story-side components from this deliberately reserved component while continuing to require internal connectivity throughout each.

[Early-region verification and screenshots](Art/qa/early-region/README.md) record focused camera/water tests, browser checks and final regression. SAVE_VERSION remains 5. This follow-up is delivered as a local checkpoint on `agent/codex` at Myles’s request; it is not merged into main or pushed.

Follow-up verification: 240/240 regression suites; 32 JavaScript syntax checks; 130 automated browser checks / 37 captures / zero errors; validator zero errors / 14 unchanged warnings; all 934 current fingerprints and the read-only transition audit match. See the early-region evidence guide for the exact file inventory.

## Wetwoods and Thornmere refinement — 2026-10-25

Implemented in the primary `main` checkout at `59e7851`, with the existing uncommitted Mornay office/tenement work preserved. The user-supplied B3 western-waterway image guides the broad composition, not runtime coordinates or new canon. The clarified limit is column −8 west and row +13 south. This pass stays within the existing region bounds **−8…30 / −15…12**, so neither camera settings nor global camera bounds change.

**Wetwoods:** 114 new scenery chunks fill the western woodland belt, from column −8 toward the existing western framing, between rows −4 and +12. Dense woodland, irregular clearings, flooded hollows and a winding watercourse replace blank space. Eight existing inaccessible western framing grids blend into that belt. Existing tree, flooded-tree, grass, reed, deep-reed, mud and water tiles suffice. The watercourse is a woodland drainage feature, not a newly asserted connection to the managed reservoir/sluices or Valmere's continental outlet. Wetwoods is revisable map flavour, following the reference image.

**Thornmere:** 20 existing terrain grids in the already-sealed southern reserve now form a connected freshwater basin southeast of Calwick, centered near chunk (2,9). Its narrow northern connection reaches the existing shallows; indented reed margins, exposed mud, wooded banks and submerged snags distinguish it from the exposed Valmere coast. The existing seven-cell MAP3 water closure is unchanged. Four former reserved land chunks—`MAINLAND_C1R8_MAP`, `MAINLAND_C2R8_MAP`, `MAINLAND_C1R9_MAP`, `MAINLAND_C2R9_MAP`—are now entirely impassable water and use existing scenery-only permissions. Their IDs and coordinates remain stable. Old debug-only saves standing on submerged terrain cannot load there; placement continues to reject invalid saves atomically. Ordinary gameplay saves and routes are unchanged.

Exactly **28 existing grids / 4,874 cells** change; the other **916 existing regional grids** are byte-equivalent. The [complete cell and metadata delta](Art/qa/wetwoods-thornmere/grid-deltas.json) is relative to this task's starting terrain. The 20 changed structural transition records only trim or reshape existing reserve shoreline connections to valid edge and legacy landing cells. No previously closed physical edge is opened. There are no new entrances, interactions, NPCs, encounters, items, tile IDs, mutable state, camera policies or story changes.

The live inventory is now **1,058 regional chunks: 477 placement-enabled, 581 scenery-only, 458 encounter-enabled**, with **1,244 total maps** including the prior uncommitted Mornay rooms. Some placement-enabled southern shore chunks remain deliberately sealed from ordinary gameplay. The new scenery is never a placement target. Encounter permissions are removed only from the four submerged chunks; all other existing encounter assignments remain unchanged.

Suite 322 pins every one of the **454 ordinary-play/protected regional grids** and the exact tile-level reachable sets on all three story sides: 2,792 early tiles, 42,498 ferry-side tiles and 30,820 onward tiles with the Rise trigger cut. These sets remain identical, proving no new starting access or ferry/ambush bypass. Suite 317 additionally checks the reserved shoreline return paths; 318 checks every remaining walkable cell's five camera sample positions; 320 retains the exact four early camera policies and seven water cells. Scenery rejection is atomic. SAVE_VERSION stays 5.

The atlas, live inventory, production overview, fingerprints and transition audit are regenerated from their authorities. Audit totals change to 2,026 structural segments / 1,946 continuous-eligible entries; all 442 fixed destinations and eight preserved-coordinate transitions remain. The audit already contained the earlier Mornay additions when this task began; they are preserved, not part of this geographic increment. Historical test totals and explicit terrain-region allowlists are updated for the added scenery and reused shoreline tiles; gameplay assertions remain intact.

[Verification, screenshots and manual checklist](Art/qa/wetwoods-thornmere/README.md) distinguish automated input checks, read-only scenery renders and visual inspection. The original B3 PNG/HTML are unchanged. Nothing is staged, committed, merged or pushed by this pass.

Final refinement verification: **258/258 suites**, 52 JavaScript syntax checks, zero validation errors / six unchanged warnings, 1,058 matching fingerprints and a matching transition audit. Browser review: 155 automated checks / 49 captures / zero errors, with native and 2× visual inspection. No camera or ordinary-play reachability change.

## Valmere wilderness shoreline refinement (2026-10-25)

This subsequent scenery-only pass rounds the Great Fen’s lake margin into wooded points and reed-lined bays, curves the wilderness spit west of Mornay, and adds gravel coves and low headlands along the far eastern shore. Existing water, reeds, submerged trees/rocks, gravel, grass and woodland tiles provide the entire visual vocabulary. The longest straight fen-bank run falls from 45 to 18 tiles. Open Valmere continues north and east; the western water channel remains connected around the spit.

Exactly **45 existing scenery grids / 4,321 cells** change across `great-fen-maps.js`, `valmere-expanse-maps.js` and `mainland-maps.js`. See the [exact per-cell delta](Art/qa/valmere-shoreline/grid-deltas.json), measured against the working tree after the Wetwoods/Thornmere pass. Every other regional grid—including all 477 placement-enabled chunks—is byte-equivalent. All chunk metadata, permissions, encounters, structural seams, bounds and tile definitions are unchanged. The exclusion buffer at columns 15–19 / rows −5…1 protects Mornay’s entire peninsula, harbour, approaches and gates. No Mornay town, interior, NPC, interaction or rendering files are touched by this increment.

No camera, movement, save, content or encounter code changes. SAVE_VERSION remains 5; there are no new chunks, entrances or accessible areas. Suite 323 pins all unchanged grids and metadata, rejects placement into scenic land in both presentation modes, and checks coastline variation and the connected impassable channel. Existing progression and no-visible-void suites remain intact.

The atlas, inventory, vector/production overviews and 45 legitimately changed fingerprints are refreshed. The read-only transition audit still matches its existing artifact, so that artifact is not regenerated for this increment. [Evidence and walkthrough](Art/qa/valmere-shoreline/README.md) include before/after production renders and native/2× detail views. Existing dirty Mornay and Wetwoods work is preserved; this pass remains unstaged and uncommitted.

Final shoreline verification: **259/259 suites**, 55 JavaScript syntax checks, zero validation errors / six unchanged warnings, 1,058 matching fingerprints and unchanged transition artifact. Browser: 163 automated checks / 57 captures / zero errors. Exact 4,321-cell delta and preservation of all out-of-scope prior files verified.
