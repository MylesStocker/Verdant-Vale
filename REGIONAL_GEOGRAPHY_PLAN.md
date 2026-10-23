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
