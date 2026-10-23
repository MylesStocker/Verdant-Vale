# Mornay Population and Services MVP Plan

## Design and authority

Mornay is a cold, busy, primarily blue-collar freshwater port and county-seat-equivalent town of approximately 8,000 people on Valmere. Seventeen existing exterior maps retain their topology, paired southern gates, shore boundaries and reserved berths. Dense work yards and commercial streets contrast with ordinary southern services and quieter, better-kept northern institutions. There is no aetherrail, capital-city scale or universal hostility.

The prompt, LORE.md, physical maps/runtime registries, architecture.md and PROJECT_STATUS.md govern this plan, in that order. Names, prices and flavour dialogue below are revisable authored content, not immutable metaphysical canon. Cold, stormy water and shallow working shores are represented without resolving the previously deferred depth of the entire Valmere basin.

## Benchmark and target

Drenwick has 99 distinct, non-party humanoid characters available through ordinary gameplay: 9 across six exterior maps and 92 across interiors, with Renn and Veran appearing in both sets (9 + 92 - 2 = 99). The earlier 101 included the position-only travelling vendor and the party/cutscene projection of Esla. Scheduled placements, aliases, repeat placements and combat copies are deduplicated; cats, enemies, debug fixtures, bridge guards outside town and Tarvec approach content are excluded. The three infirmary staff/patient characters encountered during the ordinary MQ4 wake sequence remain included.

This is a comparable town-character count, not a claim that all 99 are permanent residents: eight are explicitly visitors, and domicile is not established for every remaining character. Drenwick comprises six exteriors and 49 logical interiors (12 public rooms, six corridors, 31 residences; some share map grids). The runtime NPC registry, house records and ordinary reachability are the authority, rather than raw placements or sprite counts.

Mornay target: **300 distinct non-party speaking humanoids**, comprising **104 exterior and 196 interior characters** across **17 exterior maps and 41 rooms in 23 establishments**. Ratio: **300 / 99 = 3.0303**. No schedule clones, duplicate placements, party copies, animals or debug fixtures inflate this total. Twelve exterior characters have deterministic patrols; the others have stationary activity poses; Maris Glyn and Ferin Wold attend school on workdays and return home on Dayoff. All 300 speak, so moving/ambient and speaking totals overlap.

## Residential refinement

This pass builds domestic life into the existing port. It preserves the 300 identities, all services, seventeen exterior connections, two gates and inert story reservations. The starting checkpoint is `6f065af3db3c1286712f65df71ab182f2a16b803`. The earlier complete baseline at that exact tree passed 229/229 suites. This refinement is local to `agent/mornay-population`; no other worktree receives it.

The source audit confirms Calwick has seven houses and one four-unit apartment entrance (11 dwellings). Drenwick has seven houses and six four-unit entrances (31 dwellings); the six apartment entrances occupy three paired exterior structures. `npcs.js` owns `HOUSE_DOORS` / `HOUSE_DATA`, `maps.js` the shared old-town grids, and `world-transitions.js` their house context. Mornay extends its existing `MORNAY_BUILDINGS` parent/child registry instead of mixing in that older house context.

### Housing inventory

| Building | District / street door | Accessible dwellings | Character |
|---|---|---:|---|
| Glyn Household | Middle Lower Central East (3,5) | 1 | Dockworker's household; Maris attends school on workdays |
| Reed’s Net Room | Middle Upper East (3,9) | 1 | Modest home and seated net-making workroom |
| Pate’s Kitchen | South Upper West (12,10) | 1 | Ordinary kitchen, older resident and visitors |
| Rann Workroom House | Middle Lower Central West (12,5) | 1 | Seamwork and apprentice's shared domestic space |
| Vale House | North Upper West (11,8) | 1 | Comfortable merchant household, dining and accounts |
| Examiner’s House | North Upper East (3,8) | 1 | Comfortable household with reading and writing furniture |
| East Ward Shared Court | Middle Lower East (3,9) | 4 | Four modest flats, shared washing and repair space |
| Dock Steps Tenement | Middle Upper West (3,9) | 4 | Lake workers, household repairs and shift lodging |
| South Rows Apartments | South Upper East (3,10) | 4 | Ordinary households, care and music near ward services |
| Hume Boardinghouse | South Upper West (3,10) | 4 rented rooms, counted separately | Shared stove/dining room and four private sleeping rooms |

There are **18 accessible self-contained dwellings**, plus **four boarding rooms**. Twelve closed frontages imply another **20 self-contained dwellings**: eight single homes and four three-unit tenements. Total represented residential capacity is **38 dwellings plus four boarding rooms**. Inn guest beds are separate commercial lodging, not counted again as dwellings. These examples represent a compressed town of approximately 8,000; no numeric population claim is inferred from rendered beds. The housing mix deliberately does not triple Drenwick's building count.

| Closed residential frontage | Door tile | Represented dwellings |
|---|---|---:|
| `MORNAY_SOUTH_UPPER_WEST_MAP` | 2,5 | 1 |
| `MORNAY_SOUTH_UPPER_EAST_MAP` | 11,10 | 3 |
| `MORNAY_EAST_GATE_MAP` | 3,5 | 1 |
| `MORNAY_WEST_GATE_MAP` | 12,10 | 3 |
| `MORNAY_MIDDLE_LOWER_EAST_MAP` | 12,5 | 3 |
| `MORNAY_MIDDLE_LOWER_EAST_MAP` | 12,9 | 1 |
| `MORNAY_MIDDLE_UPPER_EAST_MAP` | 4,5 | 1 |
| `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | 3,9 | 1 |
| `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | 12,9 | 1 |
| `MORNAY_NORTH_LOWER_EAST_MAP` | 3,5 | 3 |
| `MORNAY_NORTH_UPPER_EAST_MAP` | 12,8 | 1 |
| `MORNAY_NORTH_UPPER_WEST_MAP` | 3,6 | 1 |

Closed frontages remain ordinary solid building cells, with no registered interior or interaction. Windows stay on existing building massing. Eight new exterior doors open six homes and two block common areas; existing Shared Court and Hume entrances serve their new child rooms. Flat doors are columns 2, 5, 10 and 13 on common-room row 4; boarding room doors use row 3. All have reciprocal returns, with no new saved housing state.

### Residents, furnishing and presentation

Forty-four existing characters change their primary map; all 300 stable IDs and names remain. Workday population is 104 outdoors and 196 indoors; the same split holds on Dayoff. Maris Glyn and Ferin Wold change between school and home using the established five-day `isDayOff()` calendar. Their map, coordinates, facing and pose are derived, with no duplicate NPC, schedule flag or save field. Twelve patrols remain deterministic; four now follow longer bent routes. Fifty-three primary placements are seated. The authored category totals remain 159 workers, 32 officials, 24 service staff, 18 merchants and 67 residents/visitors; these are content categories, not mutually exclusive real-world occupations.

Rooms use existing furniture vocabulary: `drawTable()` and `drawInfirmaryBed()` directly, plus coordinate-only adaptations of `drawHouseFurniture()`, Calwick office desks/cabinets and the earlier ward-school furniture. There are desks, classroom work surfaces, filing cabinets, domestic beds, dressers, stoves, supply shelves, benches and tubs. No old-town rendering wrapper is invoked with spoofed state. Collision and fixture drawing share `MORNAY_ROOM_FIXTURES`; occupied seats use the existing solid NPC anchor. Short partitions divide sleeping alcoves from work/reception space. Beds in the infirmary now use the established two-tile ward-bed drawing, retaining all eight beds and the registered healer; 15 people remain in the ward.

`render-mornay.js` restores the floor under TABLE collision cells before drawing the actual furniture. Mornay rooms sort fixtures, residents and the player by depth; other towns retain their prior drawing path. Directional/seated poses are explicit opt-ins. Room names appear once in the existing HUD title. Exterior business/home signs, useful care/school markings and numbered unit doors remain visible.

### Review decisions

Read-only housing research (`housing_patterns`) established the old-town benchmark and recommended registry reuse; both accepted. Its proposed fourth block was reduced to three to keep a substantial, coherent sample without mechanically multiplying buildings. Furnishing research (`furnishing_assets`) identified existing asset functions; accepted direct reuse and isolated coordinate adaptations. Layout research (`mornay_layout_review`) identified repeated rows and furniture arrays; accepted role-based placement, room plans, household redistribution and explicit pose support.

The exclusive Sol High test writer (`mornay_refinement_tests`) edited only new suites 311–314 after the root stopped editing. Root inspected all four: actual held-control travel, schedule/overnight persistence, painter order and old-town dispatch, and solid/inert facades are meaningful behavioral checks. Its confirmed Dayoff-facing defect was fixed without weakening the test. The follow-up coherence review also caught Fressa's obsolete hospital-tense dialogue; corrected. Its suggestions prompted small fixture differences in the examiner's house, repairer's flat and seamworker's flat. Broader corridor density and Corra's front-step phrasing remain optional editorial matters, not correctness defects.

A fresh Sol High correctness reviewer (`mornay_refinement_correctness`) found an overlapping warehouse pair introduced during final staging. Bram now stands beside the warehouse entrance and Ivara waits separately. Independent review confirmed both conversations on workday and Dayoff and found no other unreachable or shadowed resident across 58 maps / 300 identities. The root alone edited production, resolved findings, regenerated the transition artifact and created local checkpoints. No agent used nested delegation; no more than three subagents ran concurrently.

## District matrix

NPC density counts below refer to exterior characters. Every street keeps its mandatory central crossing and boundary approach clear; door approaches remain free. Northern one-tile horizontal streets receive no NPC or solid decoration. Props are visual only unless existing tile collision explicitly applies.

| Map ID | Role | Visible buildings / usable doors | Exterior NPCs | Hazards and circulation | Environmental story | Reserved content |
|---|---|---|---:|---|---|---|
| `MORNAY_OLD_FORT_MAP` | Obsolete fort, watch and holding cells | Watch post; locked cells; records shutters. Doors: No usable door | 4 | Clear row 7, columns 7–8, doors and boundary cells | Weathered masonry, patched wall, old watch bench | Fort plot and lookout |
| `MORNAY_NORTH_UPPER_WEST_MAP` | Merchant frontage and commercial lodging | Ledger House; merchant houses. Doors: Ledger House (11,5), Vale House (11,8) | 3 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Kept steps and sheltered benches; swept empty berth | Story ship berth; boarding |
| `MORNAY_NORTH_UPPER_EAST_MAP` | Wealth and examination privilege | Walled Civic Collegium; merchant houses. Doors: Examiner’s House (3,8) | 2 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Fee notice; tutor demand; clean paving | Collegium inaccessible |
| `MORNAY_NORTH_LOWER_WEST_MAP` | Harbour administration and working quay | Harbour/customs room; net sheds. Doors: Harbour and Customs Public Room (11,5) | 7 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Rope inspection; mutual-aid collection; covered notices | Island ferry berth inactive |
| `MORNAY_NORTH_LOWER_EAST_MAP` | Shipping offices and lake-trade supplies | Venn Chandlery; shipping offices; sailor lodgings. Doors: Venn Chandlery and Secondhand (11,5) | 7 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Secondhand goods, spare rope, patched sail | No ship departure |
| `MORNAY_MIDDLE_UPPER_WEST_MAP` | Warehousing and transshipment | Fen Warehouse; bonded stores. Doors: Fen Warehouse (3,5), Dock Steps Tenement (3,9) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Scales, sacks, tally disputes, guarded logistics | Locked warehouse annex |
| `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | Provision market and print stalls | Kelm Provisions; market stalls. Doors: Kelm Provisions (3,5) | 10 | Clear row 7, columns 7–8, doors and boundary cells | Fish prices; measures; confiscation notice | Petitions and print disputes inert |
| `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | Regional administration | Regional IJC Office; courier desk; archives. Doors: Regional IJC Office (3,5) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Queues; contractors; fees; redirected responsibility | Operational plot dialogue and sealed archives |
| `MORNAY_MIDDLE_UPPER_EAST_MAP` | Waterworks and survey frontage | Closed hydrographic office; waterworks. Doors: Reed’s Net Room (3,9) | 6 | Clear row 7, columns 7–8, doors and boundary cells | Gauge readings, drainage repair, storm marks | Hydrographer and Esla history absent |
| `MORNAY_MIDDLE_LOWER_WEST_MAP` | Freight yards, carts and fen products | Cart sheds; freight stores; smoking sheds. Doors: No usable door | 9 | Clear row 7, columns 7–8, doors and boundary cells | Peat, salt fish barrels, damaged harness | No freight quests |
| `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | Workwear and ordinary commerce | Sorn Work Gear; cobbler and cloth fronts. Doors: Sorn Work Gear (3,5), Rann Workroom House (12,5) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Used tools, repairs, oil, patched roofs | Equipment progression deferred |
| `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | Repair crafts and small printing | Rusk Workshop Court; cooper and forge fronts. Doors: Rusk Workshop Court (12,5), Glyn Household (3,5) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Benches, wheel repair, pasted-over handbills | Printer and organizer hooks inert |
| `MORNAY_MIDDLE_LOWER_EAST_MAP` | Worker housing and washing | Quill Laundry; East Ward Shared Court. Doors: Quill Laundry (3,5), East Ward Shared Court (3,9) | 2 | Clear row 7, columns 7–8, doors and boundary cells | Laundry, shared repairs, mutual aid, suspected meeting facade | Locked back stair; no headquarters |
| `MORNAY_SOUTH_UPPER_WEST_MAP` | Ordinary care and inexpensive housing | Mornay Infirmary; Hume Boardinghouse. Doors: Mornay Infirmary (12,5), Hume Boardinghouse (3,10), Pate’s Kitchen (12,10) | 5 | Clear row 7, columns 7–8, doors and boundary cells | Beds, injured workers, linen, rent, shifts | No new medical or lodging quest |
| `MORNAY_SOUTH_UPPER_EAST_MAP` | Ward services and southern market | South Ward School; Stern Apothecary. Doors: Stern Apothecary (3,5), South Ward School (12,5), South Rows Apartments (3,10) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Lunch sellers, remedies, parents, ordinary schooling | No school progression |
| `MORNAY_WEST_GATE_MAP` | Passenger arrivals and cheap lodging | Wold's Gate Inn; watch shelter. Doors: Wold's Gate Inn (3,5) | 4 | Clear row 7, columns 7–8, doors and boundary cells | Porters, handcarts, arrivals and tired travellers | No new overworld links |
| `MORNAY_EAST_GATE_MAP` | Freight arrivals and labour hiring | Hiring board; cart inspection; watch shelter. Doors: No usable door | 5 | Clear row 7, columns 7–8, doors and boundary cells | Loads, wheels, hiring notices and waiting labour | No transport or labour quest |

## Interior and door matrix

Coordinates are zero-based tile columns/rows. Arrival in each room is tile centre (7,13), facing up; the exit at (7,14) returns to the listed source tile centre with the listed facing. Bedroom doors originate in their inn common rooms. North-facing street returns for lower buildings avoid immediate re-entry.

| ID / map | Establishment | Source map | Door | Return / facing | NPCs (workday) |
|---|---|---|---|---|---:|
| `mornay_office` / `MORNAY_OFFICE_MAP` | Regional IJC Office | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | 3,5 | 3,6 down | 16 |
| `mornay_infirmary` / `MORNAY_INFIRMARY_MAP` | Mornay Infirmary | `MORNAY_SOUTH_UPPER_WEST_MAP` | 12,5 | 12,6 down | 15 |
| `mornay_provisioner` / `MORNAY_PROVISIONER_MAP` | Kelm Provisions | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | 3,5 | 3,6 down | 6 |
| `mornay_apothecary` / `MORNAY_APOTHECARY_MAP` | Stern Apothecary | `MORNAY_SOUTH_UPPER_EAST_MAP` | 3,5 | 3,6 down | 7 |
| `mornay_workgear` / `MORNAY_WORKGEAR_MAP` | Sorn Work Gear | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | 3,5 | 3,6 down | 8 |
| `mornay_chandler` / `MORNAY_CHANDLER_MAP` | Venn Chandlery and Secondhand | `MORNAY_NORTH_LOWER_EAST_MAP` | 11,5 | 11,6 down | 8 |
| `mornay_gate_inn` / `MORNAY_GATE_INN_MAP` | Wold's Gate Inn | `MORNAY_WEST_GATE_MAP` | 3,5 | 3,6 down | 10 |
| `mornay_gate_beds` / `MORNAY_GATE_BEDS_MAP` | Gate Inn Shared Rooms | `MORNAY_GATE_INN_MAP` | 7,1 | 7,2 down | 8 |
| `mornay_commercial_inn` / `MORNAY_COMMERCIAL_INN_MAP` | Ledger House | `MORNAY_NORTH_UPPER_WEST_MAP` | 11,5 | 11,6 down | 9 |
| `mornay_commercial_beds` / `MORNAY_COMMERCIAL_BEDS_MAP` | Ledger House Rooms | `MORNAY_COMMERCIAL_INN_MAP` | 7,1 | 7,2 down | 7 |
| `mornay_school` / `MORNAY_SCHOOL_MAP` | South Ward School | `MORNAY_SOUTH_UPPER_EAST_MAP` | 12,5 | 12,6 down | 15 |
| `mornay_harbour` / `MORNAY_HARBOUR_MAP` | Harbour and Customs Public Room | `MORNAY_NORTH_LOWER_WEST_MAP` | 11,5 | 11,6 down | 14 |
| `mornay_warehouse` / `MORNAY_WAREHOUSE_MAP` | Fen Warehouse | `MORNAY_MIDDLE_UPPER_WEST_MAP` | 3,5 | 3,6 down | 11 |
| `mornay_workshop` / `MORNAY_WORKSHOP_MAP` | Rusk Workshop Court | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | 12,5 | 12,6 down | 10 |
| `mornay_laundry` / `MORNAY_LAUNDRY_MAP` | Quill Laundry | `MORNAY_MIDDLE_LOWER_EAST_MAP` | 3,5 | 3,6 down | 7 |
| `mornay_boarding` / `MORNAY_BOARDING_MAP` | Hume Boardinghouse | `MORNAY_SOUTH_UPPER_WEST_MAP` | 3,10 | 3,9 up | 1 |
| `mornay_court` / `MORNAY_COURT_MAP` | East Ward Shared Court | `MORNAY_MIDDLE_LOWER_EAST_MAP` | 3,9 | 3,8 up | 1 |
| `mornay_glyn_home` / `MORNAY_GLYN_HOME_MAP` | Glyn Household | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | 3,5 | 3,6 down | 1 |
| `mornay_reed_home` / `MORNAY_REED_HOME_MAP` | Reed’s Net Room | `MORNAY_MIDDLE_UPPER_EAST_MAP` | 3,9 | 3,8 up | 1 |
| `mornay_pate_home` / `MORNAY_PATE_HOME_MAP` | Pate’s Kitchen | `MORNAY_SOUTH_UPPER_WEST_MAP` | 12,10 | 12,9 up | 3 |
| `mornay_rann_home` / `MORNAY_RANN_HOME_MAP` | Rann Workroom House | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | 12,5 | 12,6 down | 2 |
| `mornay_vale_home` / `MORNAY_VALE_HOME_MAP` | Vale House | `MORNAY_NORTH_UPPER_WEST_MAP` | 11,8 | 11,7 up | 2 |
| `mornay_dane_home` / `MORNAY_DANE_HOME_MAP` | Examiner’s House | `MORNAY_NORTH_UPPER_EAST_MAP` | 3,8 | 3,7 up | 3 |
| `mornay_dock_steps` / `MORNAY_DOCK_STEPS_MAP` | Dock Steps Tenement | `MORNAY_MIDDLE_UPPER_WEST_MAP` | 3,9 | 3,8 up | 1 |
| `mornay_south_rows` / `MORNAY_SOUTH_ROWS_MAP` | South Rows Apartments | `MORNAY_SOUTH_UPPER_EAST_MAP` | 3,10 | 3,9 up | 1 |
| `mornay_court_unit_1` / `MORNAY_COURT_UNIT_1_MAP` | East Ward Shared Court — Flat 1 | `MORNAY_COURT_MAP` | 2,4 | 2,5 down | 2 |
| `mornay_court_unit_2` / `MORNAY_COURT_UNIT_2_MAP` | East Ward Shared Court — Flat 2 | `MORNAY_COURT_MAP` | 5,4 | 5,5 down | 2 |
| `mornay_court_unit_3` / `MORNAY_COURT_UNIT_3_MAP` | East Ward Shared Court — Flat 3 | `MORNAY_COURT_MAP` | 10,4 | 10,5 down | 2 |
| `mornay_court_unit_4` / `MORNAY_COURT_UNIT_4_MAP` | East Ward Shared Court — Flat 4 | `MORNAY_COURT_MAP` | 13,4 | 13,5 down | 2 |
| `mornay_dock_steps_unit_1` / `MORNAY_DOCK_STEPS_UNIT_1_MAP` | Dock Steps Tenement — Flat 1 | `MORNAY_DOCK_STEPS_MAP` | 2,4 | 2,5 down | 2 |
| `mornay_dock_steps_unit_2` / `MORNAY_DOCK_STEPS_UNIT_2_MAP` | Dock Steps Tenement — Flat 2 | `MORNAY_DOCK_STEPS_MAP` | 5,4 | 5,5 down | 2 |
| `mornay_dock_steps_unit_3` / `MORNAY_DOCK_STEPS_UNIT_3_MAP` | Dock Steps Tenement — Flat 3 | `MORNAY_DOCK_STEPS_MAP` | 10,4 | 10,5 down | 2 |
| `mornay_dock_steps_unit_4` / `MORNAY_DOCK_STEPS_UNIT_4_MAP` | Dock Steps Tenement — Flat 4 | `MORNAY_DOCK_STEPS_MAP` | 13,4 | 13,5 down | 1 |
| `mornay_south_rows_unit_1` / `MORNAY_SOUTH_ROWS_UNIT_1_MAP` | South Rows Apartments — Flat 1 | `MORNAY_SOUTH_ROWS_MAP` | 2,4 | 2,5 down | 2 |
| `mornay_south_rows_unit_2` / `MORNAY_SOUTH_ROWS_UNIT_2_MAP` | South Rows Apartments — Flat 2 | `MORNAY_SOUTH_ROWS_MAP` | 5,4 | 5,5 down | 2 |
| `mornay_south_rows_unit_3` / `MORNAY_SOUTH_ROWS_UNIT_3_MAP` | South Rows Apartments — Flat 3 | `MORNAY_SOUTH_ROWS_MAP` | 10,4 | 10,5 down | 2 |
| `mornay_south_rows_unit_4` / `MORNAY_SOUTH_ROWS_UNIT_4_MAP` | South Rows Apartments — Flat 4 | `MORNAY_SOUTH_ROWS_MAP` | 13,4 | 13,5 down | 2 |
| `mornay_boarding_unit_1` / `MORNAY_BOARDING_UNIT_1_MAP` | Hume Boardinghouse — Room 1 | `MORNAY_BOARDING_MAP` | 2,3 | 2,4 down | 2 |
| `mornay_boarding_unit_2` / `MORNAY_BOARDING_UNIT_2_MAP` | Hume Boardinghouse — Room 2 | `MORNAY_BOARDING_MAP` | 5,3 | 5,4 down | 1 |
| `mornay_boarding_unit_3` / `MORNAY_BOARDING_UNIT_3_MAP` | Hume Boardinghouse — Room 3 | `MORNAY_BOARDING_MAP` | 10,3 | 10,4 down | 2 |
| `mornay_boarding_unit_4` / `MORNAY_BOARDING_UNIT_4_MAP` | Hume Boardinghouse — Room 4 | `MORNAY_BOARDING_MAP` | 13,3 | 13,4 down | 1 |

## Shops, services and institutions

| Business | Deterministic existing stock / behavior |
|---|---|
| Kelm Provisions | Potion 30; Bait 6 |
| Stern Apothecary | Potion 30; Elixir 80; Reed Remedy 50; Amethyst Dust 60 |
| Sorn Work Gear | Bronze Knife 80; Leather Armor 120; Iron Shield 140; Iron Sword 160; Fen Cowl 240 |
| Venn Chandlery and Secondhand | Bait 6; Throwing Knife 35; Leather Armor 120; Swift Bangle 180. Ordinary buying/selling only; no pledge ledger. |
| Wold’s Gate Inn | 30 gold, shared rooms and road/freight clientele |
| Ledger House | 40 gold, respectable commercial lodging, separate upstairs rooms |
| Mornay Infirmary | Ordinary physician, nurses, orderlies, dispenser, multiple beds and patients; one registered Bloommarked resonance healer. Existing pay-per-HP convention, one gold per HP restored, capped by missing HP and funds, selectable party member. No day or condition changes. |

Inns use the existing party overnight-recovery authority, advance the existing day count once, and preserve its established retained conditions. Treatment is a small canonical party-owner operation, not a second health authority. Stock reuses registered items without adding an equipment tier. Both commercial keepers and ordinary staff have individual dialogue.

Accessible institutions: Regional IJC Office including dispatch/records reception; infirmary; four shops; two inns and their sleeping rooms; ordinary South Ward School; harbour/customs public room; warehouse; workshop; laundry; boardinghouse; shared residential court.

Facade-only institutions: walled fee-paying Civic Collegium; hydrographic office; Old Fort watch/holding cells/records; locked archives and suspected meeting stair. The Civic Collegium prepares adolescents for the Civic Examination, commercial clerkships and junior Imperial service. It is socially exclusive and inaccessible in this pass. The ordinary ward school serves local families and adult literacy without a new school mechanic. Hiring remains a public gate board, not a quest system.

## Relationships, dialogue and Reclaimer knowledge

The nine meaningful non-Imperial network ties are author-only classifications; no faction UI, membership disclosure, reputation, mutable flags or recruitment exists. They span waterfront labour, logistics and educated/professional circles. Three are confirmed members in the writing plan, not publicly identified to Lely or Esla.

| Character | Author-only relationship | Public expression |
|---|---|---|
| Nessa Quill | confirmed member | laundry organiser; guarded, repeatable conversation |
| Bram Fen | confirmed member | warehouse tallyman; guarded, repeatable conversation |
| Tavi Rusk | confirmed member | compositor; guarded, repeatable conversation |
| Dena Mere | labour associate; sympathetic, membership unconfirmed | dock representative; guarded, repeatable conversation |
| Yara Kelm | medical mutual-aid associate | senior nurse; guarded, repeatable conversation |
| Hal Venn | logistics associate | chandler and secondhand dealer; guarded, repeatable conversation |
| Pella Dorn | sympathizer falsely accused of organizing violence | print seller; guarded, repeatable conversation |
| Sima Wold | boarding and lodging associate | inn proprietor on errands; guarded, repeatable conversation |
| Oren Teal | educated sympathizer | headteacher; guarded, repeatable conversation |

Marit Voss (IJC), Edrin Saye (customs) and Jessa Nair (watch) discuss Reclaimer activity or accusations. Workers with ordinary grievances are not automatically members. Aid, justified anger and political courage coexist with secrecy, illicit carriage of papers/goods, disagreement over coercion, and opportunistic accusations. No enterable building is marked as a headquarters.

Cross-references connect Nessa–Nelda–Verna–Yara (laundry, school, family, infirmary); Dena–Perrin–Yelda (dock representation, pupil, washer); Bram–Varda (warehouse ledgers); Tavi–Halden–Vesta–Pella (printing and seized sheets); Neris–Yara–Adra (provisions and medical work); Sima–Rella (gate inn); Jessa–Ossa (watch and home); Harlis–Maris (worker and pupil); Heba–Ilven (net mending); Niva–Nelva (fish and household food).

Lely and Esla know the faction exists and have their established professional/road experience. Optional brewery reading is not presumed. They do not know this local membership list, connect it to the central crisis, or expose, join, arrest or investigate anyone. The earlier ambush remains unaffiliated. Officials may recognize Imperial credentials; most people respond to strangers. Selected medical, administrative and practical exchanges use existing mixed-speaker metadata and Esla’s green style when her established companion availability permits.

Environmental evidence is restrained: a mutual-aid collection notice, scraped slogan, overwritten handbill, confiscation notice and locked suspected meeting stair. None blocks circulation or grants state/rewards.

## Complete roster

Each row is one stable character and one concise dialogue purpose. Two pupils have derived school/home placements, identified in the movement column. Location keys name an exterior map or the interior key above. Roles also define economic/social clusters; the relationships above connect those clusters. Future quest candidates are the nine network characters and selected officials, but every conversation remains repeatable and inert. No purely silent resident is required: “ambient” means incidental street/work/family dialogue rather than a quest.

| Stable ID | Name | Location | Role / cluster | Movement | Revisable dialogue seed |
|---|---|---|---|---|---|
| `mornay_hadrin_moss` | Hadrin Moss | `MORNAY_OLD_FORT_MAP` | watch veteran | Standing; faces right | Mostly I watch the weather now. It remains insubordinate. |
| `mornay_elva_tern` | Elva Tern | `MORNAY_OLD_FORT_MAP` | wall inspector | Standing; faces left | The crack is old. The water getting into it is new. |
| `mornay_perris_dun` | Perris Dun | `MORNAY_OLD_FORT_MAP` | mason | Standing; faces up | Someone fitted these stones before my grandfather had opinions. |
| `mornay_lotte_brin` | Lotte Brin | `MORNAY_OLD_FORT_MAP` | resident sketching | Seated; faces up | People keep posing. I am drawing the wall. |
| `mornay_maelin_rook` | Maelin Rook | `MORNAY_NORTH_UPPER_WEST_MAP` | berth steward | Standing; faces left | An empty berth still needs sweeping. |
| `mornay_corra_pike` | Corra Pike | `MORNAY_VALE_HOME_MAP` | house steward | Standing; faces up | Tradesmen use the side entrance. Leave the bill with me; the household does not discuss accounts at the front step. |
| `mornay_fennel_ashe` | Fennel Ashe | `MORNAY_NORTH_UPPER_WEST_MAP` | gardener | Standing; faces right | The lake wind has very definite ideas about my hedges. |
| `mornay_nesta_vale` | Nesta Vale | `MORNAY_VALE_HOME_MAP` | shipowner's widow | Seated; faces left | The harbour fees keep rising. My tenants seem to think that should come out of my income. |
| `mornay_osric_bell` | Osric Bell | `MORNAY_NORTH_UPPER_WEST_MAP` | retired pilot | Seated; faces left | A fine coat has never improved a vessel's turning circle. |
| `mornay_celda_verne` | Celda Verne | `MORNAY_DANE_HOME_MAP` | household secretary | Standing; faces up | The invitation says noon. In this house that means whenever the host arrives. |
| `mornay_idris_pell` | Idris Pell | `MORNAY_NORTH_UPPER_EAST_MAP` | Collegium porter | Standing; faces right | Civic Collegium. Upper pupils only. The fees prepare them for the Civic Examination, clerkships and junior service. Visitors require an appointment. You have neither pupil nor appointment with you. |
| `mornay_benna_lark` | Benna Lark | `MORNAY_NORTH_UPPER_EAST_MAP` | Collegium student | Standing; faces down | Our tutor says the Examination rewards preparation. Mother calls that reassuring. She has paid for three years of it. |
| `mornay_tassel_dorn` | Tassel Dorn | `MORNAY_DANE_HOME_MAP` | domestic worker | Standing; faces right | These steps are grander than the kitchen they lead to. |
| `mornay_ulric_dane` | Ulric Dane | `MORNAY_DANE_HOME_MAP` | retired examiner | Seated; faces left | The Examination may be open. An evening without work, a lamp and somebody to correct your answers are less evenly shared. |
| `mornay_dena_mere` | Dena Mere | `MORNAY_NORTH_LOWER_WEST_MAP` | dock representative | Standing; faces right | A missed day's pay reaches the supper table before the explanation. Nessa has kept three crews fed. That does not give anyone the right to speak for every worker here. |
| `mornay_salwen_reed` | Salwen Reed | `MORNAY_NORTH_LOWER_WEST_MAP` | rope inspector | Standing; faces left | Gessa wants this rope condemned. The owner wants another week from it. I have put my name beside hers. |
| `mornay_niva_cole` | Niva Cole | `MORNAY_NORTH_LOWER_WEST_MAP` | fish seller | Standing; faces left | Fresh this morning. I cannot promise freshness in your kitchen tomorrow. |
| `mornay_rulon_hart` | Rulon Hart | `MORNAY_NORTH_LOWER_WEST_MAP` | scow hand | Standing; faces up | The open lake was white yesterday. Lowen says the freight can still arrive tonight. Lowen is staying on shore. |
| `mornay_heba_flint` | Heba Flint | `MORNAY_NORTH_LOWER_WEST_MAP` | net mender | Seated; faces left | Ilven still ties the difficult knots at home. Pay him for them. He needs wages, not people calling him brave. |
| `mornay_davi_fenner` | Davi Fenner | `MORNAY_NORTH_LOWER_WEST_MAP` | child | Standing; faces up | That berth looks ready. Grown-ups say looking ready isn't enough. |
| `mornay_merra_keld` | Merra Keld | `MORNAY_NORTH_LOWER_WEST_MAP` | laundry collector | Patrol | Harbour sheets come back smelling of every harbour except this one. |
| `mornay_jorin_vetch` | Jorin Vetch | `MORNAY_NORTH_LOWER_EAST_MAP` | lodging tout | Standing; faces right | Dry bedding. Quiet depends on who has just been paid. |
| `mornay_alwen_corst` | Alwen Corst | `MORNAY_NORTH_LOWER_EAST_MAP` | customs messenger | Patrol | If the packet were lighter, I would suspect a missing enclosure. |
| `mornay_cessa_brack` | Cessa Brack | `MORNAY_NORTH_LOWER_EAST_MAP` | sailor's spouse | Standing; faces up | He describes every port by the meal he couldn't afford. |
| `mornay_tobin_yarrow` | Tobin Yarrow | `MORNAY_NORTH_LOWER_EAST_MAP` | sail repairer | Standing; faces right | A patch should last longer than the explanation. |
| `mornay_ersa_vole` | Ersa Vole | `MORNAY_NORTH_LOWER_EAST_MAP` | discharged deckhand | Standing; faces left | My legs still expect the street to move. |
| `mornay_lowen_greaves` | Lowen Greaves | `MORNAY_NORTH_LOWER_EAST_MAP` | shipping agent | Standing; faces down | The vessel is punctual. The cargo has other commitments. |
| `mornay_brena_sill` | Brena Sill | `MORNAY_NORTH_LOWER_EAST_MAP` | dockside baker | Standing; faces right | Crew bread is baked firm. Nobody wants crumbs in the rigging. |
| `mornay_bram_fen` | Bram Fen | `MORNAY_MIDDLE_UPPER_WEST_MAP` | warehouse tallyman | Standing; faces right | Varda keeps the signed tally. I keep the count of what actually arrived. No, those are not always the same number. You want a manifest, use the public office. |
| `mornay_gessa_tarn` | Gessa Tarn | `MORNAY_MIDDLE_UPPER_WEST_MAP` | unloading forewoman | Standing; faces left | Hands clear. Set it down together. The hoist was condemned once already; ask Arlis why the contractor signed it back into use. |
| `mornay_halen_wick` | Halen Wick | `MORNAY_MIDDLE_UPPER_WEST_MAP` | barrel roller | Patrol | Round goods still find a way to be difficult. |
| `mornay_ivara_gorse` | Ivara Gorse | `MORNAY_MIDDLE_UPPER_WEST_MAP` | freight customer | Standing; faces up | The harbour wants a warehouse receipt. Varda wants a release from the harbour. My cargo is paying rent while they correspond. |
| `mornay_petren_shaw` | Petren Shaw | `MORNAY_DOCK_STEPS_MAP` | warehouse carpenter | Standing; faces left | A crate is a room built for something that won't thank you. |
| `mornay_dossa_marr` | Dossa Marr | `MORNAY_MIDDLE_UPPER_WEST_MAP` | porter | Standing; faces right | Hands clear. There's no spare set in the stores. |
| `mornay_vannic_hale` | Vannic Hale | `MORNAY_MIDDLE_UPPER_WEST_MAP` | scale keeper | Standing; faces down | The scales are checked every morning. If a clerk wants a lighter weight, he can put that request in writing. |
| `mornay_fenna_orl` | Fenna Orl | `MORNAY_MIDDLE_UPPER_WEST_MAP` | packet runner | Standing; faces left | The red string belongs to the parcel. Nobody told the parcel that. |
| `mornay_hobb_tress` | Hobb Tress | `MORNAY_MIDDLE_UPPER_WEST_MAP` | sack patcher | Standing; faces down | A small hole can employ six people if nobody admits seeing it. |
| `mornay_pella_dorn` | Pella Dorn | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | print seller | Standing; faces left | Recipes, petitions, weather sheets. Edrin knows what I sell. A rival called them Reclaimer instructions and the watch took the lot. They have not returned the recipes either. |
| `mornay_orna_bex` | Orna Bex | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | vegetable seller | Standing; faces down | Bent ones cost less. Bruised ones go to the evening pot. No, you cannot have sound ones at the bruised price. |
| `mornay_micah_wren` | Micah Wren | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | honey dealer | Standing; faces down | Taste is the advertisement. Please leave some advertisement for everyone else. |
| `mornay_sova_kern` | Sova Kern | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | cobbler's runner | Standing; faces up | One boot collected. Apparently the other is still making up its mind. |
| `mornay_evin_rusk` | Evin Rusk | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | market inspector | Standing; faces right | Use the stamped measure. I know the stamp costs money. I also know who sells the replacement stamps. |
| `mornay_talma_noll` | Talma Noll | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | basket seller | Standing; faces down | The handle is supposed to bear the weight. Your arm bears enough. |
| `mornay_ressa_muir` | Ressa Muir | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | shopper | Standing; faces right | I came for onions. The town has made a morning of it. |
| `mornay_dolen_weir` | Dolen Weir | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | street sweeper | Patrol | Keep moving, please. The fish water reaches this gutter before the carts do. |
| `mornay_ansel_crowe` | Ansel Crowe | `MORNAY_SOUTH_ROWS_UNIT_2_MAP` | music teacher | Seated; faces left | Practising quietly is still practising. My neighbours remain unconvinced. |
| `mornay_belli_hume` | Belli Hume | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | errand child | Standing; faces left | The change is correct. I counted it before buying nothing. |
| `mornay_carden_firth` | Carden Firth | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | cloth buyer | Standing; faces left | A good weave survives being called unfashionable. |
| `mornay_vessa_auld` | Vessa Auld | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | petition copyist | Standing; faces up | The IJC office takes petitions. The harbour takes cargo complaints. If yours concerns both, write two copies. They will not share one. |
| `mornay_torren_glass` | Torren Glass | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | waiting claimant | Standing; faces left | Arlis sent me to the harbour. Maura sent me back. I have stopped explaining the roof and started asking for names. |
| `mornay_helma_quist` | Helma Quist | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | office cleaner | Standing; faces left | They had the public benches repaired after a visiting official caught his coat. Our stairs have been loose since winter. |
| `mornay_arven_beck` | Arven Beck | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | courier | Patrol | Nobody signs quickly until I have somewhere else to be. |
| `mornay_nerit_wold` | Nerit Wold | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | examination candidate | Standing; faces up | Collegium pupils get practice papers. I borrow them after work. I am not asking anyone to lower the pass mark. |
| `mornay_sella_croft` | Sella Croft | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | licence applicant | Standing; faces up | Corven says my licence needs the old receipt. The old receipt went down with the boat. Apparently that is the boat's responsibility. |
| `mornay_garren_yew` | Garren Yew | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | document carrier | Standing; faces left | The ribbon means untouched, not unimportant. |
| `mornay_edda_purl` | Edda Purl | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | notice reader | Standing; faces up | They have moved the closing time into the smallest sentence. |
| `mornay_varek_linn` | Varek Linn | `MORNAY_MIDDLE_UPPER_EAST_MAP` | waterworks overseer | Standing; faces right | The public hydrographic office is closed. Repairs still have to be measured. Hessa and Ketta do that work in all weathers. |
| `mornay_hessa_dorr` | Hessa Dorr | `MORNAY_MIDDLE_UPPER_EAST_MAP` | survey assistant | Standing; faces left | Keep clear of the survey rod. We are measuring the bank, not taking passengers. Public enquiries are with the harbour office. |
| `mornay_nollis_vane` | Nollis Vane | `MORNAY_MIDDLE_UPPER_EAST_MAP` | drainage worker | Standing; faces up | A blocked channel is everybody's problem just after it becomes mine. |
| `mornay_ketta_roy` | Ketta Roy | `MORNAY_MIDDLE_UPPER_EAST_MAP` | gauge reader | Standing; faces right | A shallow shore can still take a boat apart. A crew blamed an unseen shoal; another blamed a rotten sounding line. I have only the readings. |
| `mornay_ossa_fenwick` | Ossa Fenwick | `MORNAY_MIDDLE_UPPER_EAST_MAP` | pipe fitter | Standing; faces left | The contract covers the pipe. Excavating to reach the pipe is apparently a separate contract. I am waiting for a signature. |
| `mornay_derren_kest` | Derren Kest | `MORNAY_MIDDLE_UPPER_EAST_MAP` | water carrier | Patrol | It gets heavier between the pump and the upstairs landing. |
| `mornay_berrit_fane` | Berrit Fane | `MORNAY_MIDDLE_LOWER_WEST_MAP` | cart-yard foreman | Standing; faces up | Hiring is at the East Gate. I need two sober hands tomorrow, if the freight clears. Do not pay a middleman to hear that. |
| `mornay_helven_moss` | Helven Moss | `MORNAY_MIDDLE_LOWER_WEST_MAP` | carter | Standing; faces right | A wheel only squeaks when someone important is listening. |
| `mornay_iset_brill` | Iset Brill | `MORNAY_MIDDLE_LOWER_WEST_MAP` | peat seller | Standing; faces right | Peat for the smokers, reed bundles for packing. Keep both dry. We earn little enough before half the load turns to water. |
| `mornay_jessa_fallow` | Jessa Fallow | `MORNAY_MIDDLE_LOWER_WEST_MAP` | harness maker | Standing; faces left | Leather remembers being neglected. |
| `mornay_rurik_dean` | Rurik Dean | `MORNAY_MIDDLE_LOWER_WEST_MAP` | teamster | Standing; faces left | The mule has identified every shortcut I would regret. |
| `mornay_vela_thorne` | Vela Thorne | `MORNAY_MIDDLE_LOWER_WEST_MAP` | freight cook | Standing; faces down | A bowl for Kelda too. Her injury happened in this yard; the yard can feed her while they argue about wages. |
| `mornay_dennet_vale` | Dennet Vale | `MORNAY_MIDDLE_LOWER_WEST_MAP` | stores checker | Standing; faces right | The label says fragile. So does the man who dropped it. |
| `mornay_mora_wist` | Mora Wist | `MORNAY_MIDDLE_LOWER_WEST_MAP` | yard messenger | Patrol | I know the fastest route. It contains three people who need me. |
| `mornay_kelda_frey` | Kelda Frey | `MORNAY_MIDDLE_LOWER_WEST_MAP` | injured porter | Standing; faces right | The foreman remembers the fall. The contractor remembers employing someone else. Yara says the ankle will take time. |
| `mornay_adra_kelm` | Adra Kelm | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | provisioner's assistant | Standing; faces right | Neris is in the market shop. Yara needs the plain jars kept aside for the infirmary. Everyone else can manage with a different lid. |
| `mornay_henric_sorn` | Henric Sorn | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | workgear hawker | Standing; faces left | Good gloves are cheaper than learning how much you need fingers. |
| `mornay_malva_teel` | Malva Teel | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | secondhand bookseller | Standing; faces up | Someone underlined every useful passage and several arguments. |
| `mornay_iven_bellows` | Iven Bellows | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | knife sharpener | Standing; faces right | Sharp tools ask less force. They still ask attention. |
| `mornay_essie_rann` | Essie Rann | `MORNAY_RANN_HOME_MAP` | seamstress | Seated; faces left | Try lifting your arms before declaring it a perfect fit. |
| `mornay_pelren_oxley` | Pelren Oxley | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | customer | Standing; faces left | The cheaper coat is only cheaper if winter agrees. |
| `mornay_theda_wark` | Theda Wark | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | lamp oil carrier | Patrol | No, it is not perfume. Stand farther away and hope. |
| `mornay_corlen_brume` | Corlen Brume | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | sign painter | Standing; faces down | They requested larger letters and a smaller price. |
| `mornay_nella_gant` | Nella Gant | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | shop sweeper | Standing; faces right | People wipe their feet while entering. Leaving seems to inspire trust. |
| `mornay_tavi_rusk` | Tavi Rusk | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | compositor | Standing; faces up | My uncle prints what he is paid to print. Do not put my words in his mouth. If you want work copied, ask at the front bench. |
| `mornay_dalen_hesk` | Dalen Hesk | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | cooper | Standing; faces right | A barrel must agree with itself all the way round. |
| `mornay_savra_linnet` | Savra Linnet | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | forge striker | Standing; faces right | I count the blows. That is why we still have a rhythm. |
| `mornay_orenna_flint` | Orenna Flint | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | potter | Standing; faces left | A handle is a promise made to a stranger's fingers. |
| `mornay_breck_yarrow` | Breck Yarrow | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | carpenter apprentice | Standing; faces left | They give repair work to boys when the lake trade slows. Master stays until I finish. He says replacing fingers ruins the saving. |
| `mornay_ilma_dace` | Ilma Dace | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | dyer | Standing; faces down | This stain is professional. The other one is lunch. |
| `mornay_korrin_ashe` | Korrin Ashe | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | workshop runner | Patrol | Everybody's urgent parcel is waiting for somebody else's. |
| `mornay_verda_pike` | Verda Pike | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | furniture repairer | Standing; faces right | Old chairs sag where people felt safest. |
| `mornay_ysol_reed` | Ysol Reed | `MORNAY_MIDDLE_LOWER_EAST_MAP` | grandmother | Standing; faces right | Children grow taller while you are looking for their other sock. |
| `mornay_tessa_glyn` | Tessa Glyn | `MORNAY_DOCK_STEPS_UNIT_4_MAP` | home seamworker | Seated; faces left | The baby sleeps whenever the needle breaks. |
| `mornay_loric_mallow` | Loric Mallow | `MORNAY_DOCK_STEPS_UNIT_1_MAP` | kettle repairer | Standing; faces left | A dent is character. A hole requires my attention. |
| `mornay_enna_quist` | Enna Quist | `MORNAY_DOCK_STEPS_UNIT_1_MAP` | tenant | Seated; faces right | The upstairs family is moving one chair. It has taken all morning. |
| `mornay_ferin_wold` | Ferin Wold | `MORNAY_SCHOOL_MAP` | pupil | Standing; faces left; Dayoff: `MORNAY_DOCK_STEPS_UNIT_4_MAP` | I can spell warehouse. I would rather draw one. |
| `mornay_bessa_marrin` | Bessa Marrin | `MORNAY_MIDDLE_LOWER_EAST_MAP` | yard gardener | Standing; faces left | We agreed to share the herbs. We are discussing what share means. |
| `mornay_sima_wold` | Sima Wold | `MORNAY_SOUTH_UPPER_WEST_MAP` | inn proprietor on errands | Standing; faces up | Rella keeps the inn running. People leave letters there for neighbours who cannot safely receive them at work. A closed envelope is still closed when an officer holds it. |
| `mornay_gerris_cove` | Gerris Cove | `MORNAY_SOUTH_UPPER_WEST_MAP` | itinerant repairer | Standing; faces right | Every town has one stubborn clock and twelve owners. |
| `mornay_rona_kett` | Rona Kett | `MORNAY_SOUTH_UPPER_WEST_MAP` | bread carrier | Standing; faces right | The warm loaves go first. I carry the disappointment home. |
| `mornay_hollis_pate` | Hollis Pate | `MORNAY_PATE_HOME_MAP` | retired cook | Seated; faces right | An inn's reputation is mostly its clean water. |
| `mornay_tilda_mere` | Tilda Mere | `MORNAY_SOUTH_UPPER_WEST_MAP` | dockworker's sister | Standing; faces left | Dena remembers everyone's wages and forgets her own lunch. |
| `mornay_vennel_saye` | Vennel Saye | `MORNAY_COURT_UNIT_3_MAP` | clerk's parent | Standing; faces left | Edrin's handwriting improved when he stopped writing to us. |
| `mornay_kessa_tern` | Kessa Tern | `MORNAY_SOUTH_ROWS_MAP` | boardinghouse maid | Standing; faces right | I can carry linen or answer directions. Usually I am asked for both. |
| `mornay_orvin_clay` | Orvin Clay | `MORNAY_SOUTH_UPPER_WEST_MAP` | furniture mover | Standing; faces left | It came through that door once. This comforts nobody. |
| `mornay_jalda_firth` | Jalda Firth | `MORNAY_SOUTH_ROWS_UNIT_4_MAP` | travelling aunt | Seated; faces left | My nephew has grown respectable. I preferred receiving interesting letters. |
| `mornay_fenric_dorr` | Fenric Dorr | `MORNAY_SOUTH_UPPER_EAST_MAP` | road guide | Standing; faces right | Ask how the road is today. Old advice can get very wet. |
| `mornay_selma_greaves` | Selma Greaves | `MORNAY_SOUTH_UPPER_EAST_MAP` | lunch seller | Patrol | Eat sitting down. Walking is already taking its share. |
| `mornay_torva_dale` | Torva Dale | `MORNAY_SOUTH_UPPER_EAST_MAP` | pack repairer | Standing; faces left | The strap failed where you kept telling yourself it would hold. |
| `mornay_ilda_stern` | Ilda Stern | `MORNAY_SOUTH_UPPER_EAST_MAP` | traveller | Standing; faces up | I packed for every weather and forgot comfortable shoes. |
| `mornay_brannic_hume` | Brannic Hume | `MORNAY_SOUTH_UPPER_EAST_MAP` | wagon guard | Standing; faces right | My employer calls waiting vigilance when he has to pay for it. |
| `mornay_melli_voss` | Melli Voss | `MORNAY_SOUTH_UPPER_EAST_MAP` | market child | Standing; faces left | That man sells maps. I think he is lost. |
| `mornay_oswen_lark` | Oswen Lark | `MORNAY_SOUTH_UPPER_EAST_MAP` | letter writer | Standing; faces down | You may miss someone without making every sentence sorrowful. |
| `mornay_delra_tress` | Delra Tress | `MORNAY_SOUTH_UPPER_EAST_MAP` | jug seller | Standing; faces right | Hold the base as well. That advice comes free. |
| `mornay_jessa_nair` | Jessa Nair | `MORNAY_WEST_GATE_MAP` | watch sergeant | Standing; faces left | Keep the gateway clear. We have orders to ask about Reclaimer printers. A labour complaint is not an answer to that question, whatever some employers tell us. |
| `mornay_anric_fell` | Anric Fell | `MORNAY_WEST_GATE_MAP` | watch constable | Standing; faces down | Directions cost nothing. Please stop offering me coins. |
| `mornay_porrin_beck` | Porrin Beck | `MORNAY_WEST_GATE_MAP` | road porter | Patrol | The bag has arrived. Its owner is negotiating with his knees. |
| `mornay_vilda_thorn` | Vilda Thorn | `MORNAY_WEST_GATE_MAP` | returning resident | Standing; faces left | The town smells different after a week away. By supper it won't. |
| `mornay_dalven_rill` | Dalven Rill | `MORNAY_EAST_GATE_MAP` | freight watch | Standing; faces right | Declare the load before unloading. If someone offers to lose the excise copy for a fee, remember whose hand took the money. |
| `mornay_meret_shaw` | Meret Shaw | `MORNAY_EAST_GATE_MAP` | wagon checker | Standing; faces down | A loose wheel is not a local administrative custom. |
| `mornay_varen_noll` | Varen Noll | `MORNAY_EAST_GATE_MAP` | delivery driver | Patrol | The address says near the big building. I admire its confidence. |
| `mornay_hilda_vane` | Hilda Vane | `MORNAY_EAST_GATE_MAP` | animal minder | Standing; faces right | Let him smell your hand. He has had a day of strangers. |
| `mornay_cressa_mote` | Cressa Mote | `MORNAY_EAST_GATE_MAP` | exhausted traveller | Seated; faces right | I shall appreciate the architecture after finding a chair. |
| `mornay_marit_voss` | Marit Voss | `MORNAY_OFFICE_MAP` | senior officer | Standing; faces down | Reclaimer sheets have reached three wards. We want evidence of offences, not a list of people your employer dislikes. Harbour matters still go to Saye. I will not sign for his department. |
| `mornay_inessa_cray` | Inessa Cray | `MORNAY_OFFICE_MAP` | reception clerk | Standing; faces down | Imperial credentials? Regional enquiries begin here. A credential does not make the responsible desk available. State the office you need. |
| `mornay_halden_quill` | Halden Quill | `MORNAY_OFFICE_MAP` | records supervisor | Standing; faces down | A missing file requires the number on its cover. I understand why that is difficult. I am not authorized to change the requirement. |
| `mornay_bera_senn` | Bera Senn | `MORNAY_OFFICE_MAP` | payments clerk | Standing; faces down | The fee is posted. The contractor's handling charge is separate. No, this office does not issue a receipt for his portion. |
| `mornay_eldric_fane` | Eldric Fane | `MORNAY_OFFICE_MAP` | requisitions clerk | Standing; faces down | The quay repairs have been referred to a private contractor. Completion is now his responsibility. Payment authorization remains ours. |
| `mornay_novra_dain` | Novra Dain | `MORNAY_OFFICE_MAP` | registration administrator | Standing; faces down | A child without a record still needs a school place. Oren sends them over with a neighbour who can speak for the family. We do what the forms permit. |
| `mornay_coris_wren` | Coris Wren | `MORNAY_OFFICE_MAP` | archive assistant | Standing; faces right | Dry hands, please. The damp has already made its amendments. |
| `mornay_lenva_purl` | Lenva Purl | `MORNAY_OFFICE_MAP` | appointment clerk | Standing; faces left | A forwarding letter is not an appointment. You may wait for one, but please leave the seats nearest the door for scheduled visitors. |
| `mornay_torben_clay` | Torben Clay | `MORNAY_OFFICE_MAP` | building porter | Standing; faces left | That door sticks. Please blame the door before the Empire. |
| `mornay_messa_yule` | Messa Yule | `MORNAY_OFFICE_MAP` | copy clerk | Seated; faces left | I copied the contractor's complaint twice. Both copies call the same dismissed porter a different kind of threat. |
| `mornay_arlis_rook` | Arlis Rook | `MORNAY_OFFICE_MAP` | infrastructure liaison | Standing; faces down | The hoist certificate is a contractor matter. If Gessa contests it, she must provide another inspection. This desk cannot suspend an authorized contract on hearsay. |
| `mornay_wenda_flax` | Wenda Flax | `MORNAY_OFFICE_MAP` | payroll petitioner | Standing; faces right | I am owed three weeks. Bera says the signature is missing. My replacement was paid before the ink dried. |
| `mornay_corven_dace` | Corven Dace | `MORNAY_OFFICE_MAP` | licence officer | Standing; faces down | The rule is awkward. Ignoring it would make your licence useless. |
| `mornay_helis_tarn` | Helis Tarn | `MORNAY_OFFICE_MAP` | archive conservator | Standing; faces up | Dust is patient. We have adopted the same strategy. |
| `mornay_nerin_gant` | Nerin Gant | `MORNAY_OFFICE_MAP` | junior examiner | Standing; faces up | They teach Mera Dren as proof that a petition works. They spend less time on the neighbours who helped her make one. |
| `mornay_vessa_lund` | Vessa Lund | `MORNAY_OFFICE_MAP` | public assistant | Standing; faces left | Tell me in the words you have. We will start there. |
| `mornay_yara_kelm` | Yara Kelm | `MORNAY_INFIRMARY_MAP` | senior nurse | Standing; faces left | Rest is treatment. Nessa brings clean linen when the stores run short; I do not ask whose meetings she attends. No one gets to use a patient's bed as a political favour. |
| `mornay_selven_orr` | Selven Orr | `MORNAY_INFIRMARY_MAP` | physician | Standing; faces down | We clean, bind and watch the wound. The ward charges one gold for each point of health restored. You may pay for what you can afford. Tell me who needs care. |
| `mornay_hanne_brist` | Hanne Brist | `MORNAY_INFIRMARY_MAP` | infirmary steward | Standing; faces down | Clean bedding is a medical supply. We have eight beds in this ward and more calls than hands. Keep the passage free. |
| `mornay_elrin_vey` | Elrin Vey | `MORNAY_INFIRMARY_MAP` | registered Bloommarked healer | Standing; faces down | I am the registered Bloommarked healer. Resonance can support damaged tissue; it cannot replace a clean wound, food or sleep. Selven directs the care. I cannot mend a working life in an afternoon. |
| `mornay_jonna_mire` | Jonna Mire | `MORNAY_INFIRMARY_MAP` | dispenser | Standing; faces right | Melva sends the labelled stock. Do not take a bedside jar because it looks like the one you use at home. |
| `mornay_padris_kett` | Padris Kett | `MORNAY_INFIRMARY_MAP` | orderly | Standing; faces left | Slowly. The bed will still be there when we reach it. |
| `mornay_lessa_fern` | Lessa Fern | `MORNAY_INFIRMARY_MAP` | trainee nurse | Standing; faces right | I know the answer. My hands are taking longer to learn. |
| `mornay_nevin_brack` | Nevin Brack | `MORNAY_INFIRMARY_MAP` | patient with crushed foot | Seated; faces right | The hoist slipped. Gessa stopped the shift; the owner says she overreacted. I would like him to stand on this foot before deciding. |
| `mornay_elma_pike` | Elma Pike | `MORNAY_SOUTH_ROWS_UNIT_4_MAP` | patient's partner | Standing; faces right | He says he needs nothing. He has eaten everything I brought. |
| `mornay_dorran_bale` | Dorran Bale | `MORNAY_INFIRMARY_MAP` | recovering boat hand | Seated; faces left | Something struck us on the fen road. I did not see enough to give it a name. The nurse needs the wound cleaned, not another story about it. |
| `mornay_mirren_ashe` | Mirren Ashe | `MORNAY_SOUTH_ROWS_UNIT_3_MAP` | exhausted caregiver | Standing; faces left | I sat down for a moment. It appears to have become an hour. |
| `mornay_vela_rinn` | Vela Rinn | `MORNAY_INFIRMARY_MAP` | cook | Standing; faces right | Convalescent broth is not punishment. I wish people would taste it first. |
| `mornay_jessin_corst` | Jessin Corst | `MORNAY_INFIRMARY_MAP` | linen orderly | Standing; faces up | The clean stack stays clean if visitors stop leaning on it. |
| `mornay_teren_lume` | Teren Lume | `MORNAY_INFIRMARY_MAP` | night nurse | Standing; faces right | More road injuries this month. More lifting injuries too. We record both; counting only the frightening ones would leave half the beds unexplained. |
| `mornay_orla_nair` | Orla Nair | `MORNAY_INFIRMARY_MAP` | watch constable visiting colleague | Standing; faces left | She complains properly now. That is an improvement. |
| `mornay_fressa_dean` | Fressa Dean | `MORNAY_SOUTH_ROWS_UNIT_3_MAP` | discharged patient | Seated; faces left | They said I could go home. I had forgotten how many stairs that involves. |
| `mornay_pelda_hesk` | Pelda Hesk | `MORNAY_INFIRMARY_MAP` | patient's mother | Standing; faces right | I brought his good shirt. I needed something useful to carry. |
| `mornay_vanis_teal` | Vanis Teal | `MORNAY_INFIRMARY_MAP` | infirmary accountant | Standing; faces left | The ordinary ward accounts for nearly all our work. The resonance allocation is limited. People hear the healer's title and imagine we have no other expenses. |
| `mornay_neris_kelm` | Neris Kelm | `MORNAY_PROVISIONER_MAP` | provisioner | Standing; faces down | Potion or bait? Prices are marked. Yara's infirmary order is already set aside; the counter stock is for anyone with the coin. |
| `mornay_eldra_fenn` | Eldra Fenn | `MORNAY_PROVISIONER_MAP` | stockkeeper | Standing; faces right | Front shelf first. Older goods deserve their turn. |
| `mornay_pavin_marr` | Pavin Marr | `MORNAY_PROVISIONER_MAP` | counter assistant | Standing; faces down | If you need the small measure, ask for the small measure. |
| `mornay_linna_bexley` | Linna Bexley | `MORNAY_PATE_HOME_MAP` | household shopper | Standing; faces up | Three mouths have become four opinions about supper. |
| `mornay_heddin_wist` | Heddin Wist | `MORNAY_PROVISIONER_MAP` | travelling labourer | Standing; faces up | Enough for tomorrow. Tomorrow's work can pay for the day after. |
| `mornay_toria_brume` | Toria Brume | `MORNAY_PROVISIONER_MAP` | provision packer | Standing; faces right | Paper outside the jar, please. It does little good inside. |
| `mornay_keven_muir` | Keven Muir | `MORNAY_PROVISIONER_MAP` | kitchen buyer | Standing; faces left | We budgeted for onions before everyone remembered liking them. |
| `mornay_yenna_vetch` | Yenna Vetch | `MORNAY_SOUTH_ROWS_UNIT_1_MAP` | neighbour collecting order | Seated; faces right | Neris puts the heavy things together. My arms object to this efficiency. |
| `mornay_melva_stern` | Melva Stern | `MORNAY_APOTHECARY_MAP` | apothecary | Standing; faces down | Tell me what you need before choosing a jar. More medicine is not always better medicine. The marked price includes the bottle. |
| `mornay_arret_cole` | Arret Cole | `MORNAY_APOTHECARY_MAP` | apprentice | Standing; faces down | The plain jars are labelled too. Especially the plain jars. |
| `mornay_vessa_gorse` | Vessa Gorse | `MORNAY_APOTHECARY_MAP` | herb sorter | Standing; faces up | Dried does not mean indistinguishable. |
| `mornay_nerrin_hale` | Nerrin Hale | `MORNAY_APOTHECARY_MAP` | sleepless customer | Standing; faces up | I sleep very well just before I must get up. |
| `mornay_orel_quist` | Orel Quist | `MORNAY_APOTHECARY_MAP` | medicine courier | Standing; faces left | She packed the glass separately. I wish roads did the same. |
| `mornay_thelin_vole` | Thelin Vole | `MORNAY_APOTHECARY_MAP` | carpenter buying salve | Standing; faces left | I wore gloves all week except the moment that mattered. |
| `mornay_rissa_yew` | Rissa Yew | `MORNAY_SOUTH_ROWS_UNIT_1_MAP` | caregiver | Standing; faces left | My mother trusts anything that tastes unpleasant. A troublesome standard. |
| `mornay_dannet_pate` | Dannet Pate | `MORNAY_APOTHECARY_MAP` | bottle washer | Standing; faces left | Clear glass is honest about how much work remains. |
| `mornay_hesta_sorn` | Hesta Sorn | `MORNAY_WORKGEAR_MAP` | workgear keeper | Standing; faces down | Working knives, road arms and gear we can repair. Try both boots. Your employer's promise to replace them is not payment. |
| `mornay_morren_flint` | Morren Flint | `MORNAY_WORKGEAR_MAP` | fitter | Standing; faces down | A belt should hold your gear, not remind you of every meal. |
| `mornay_isa_marrin` | Isa Marrin | `MORNAY_WORKGEAR_MAP` | leatherworker | Standing; faces down | I repair the seam before polishing the story. |
| `mornay_fenris_roy` | Fenris Roy | `MORNAY_WORKGEAR_MAP` | dock recruit | Standing; faces up | They told me what to buy. Then everyone disagreed. |
| `mornay_galda_thorn` | Galda Thorn | `MORNAY_WORKGEAR_MAP` | survey worker | Standing; faces right | Mud takes the shine off fine purchases very democratically. |
| `mornay_perren_croft` | Perren Croft | `MORNAY_WORKGEAR_MAP` | repair customer | Standing; faces up | They lasted three seasons. I came to complain and bought the same pair. |
| `mornay_lorna_wark` | Lorna Wark | `MORNAY_WORKGEAR_MAP` | counter assistant | Standing; faces left | Sizes are on the shelf edge, not the shelf you wish were yours. |
| `mornay_dessin_bellows` | Dessin Bellows | `MORNAY_WORKGEAR_MAP` | pack stitcher | Standing; faces left | A good repair should become boring immediately. |
| `mornay_hal_venn` | Hal Venn | `MORNAY_CHANDLER_MAP` | chandler and secondhand dealer | Standing; faces down | We sell outright and buy outright. Jarven keeps the public book. I will not name a seller because someone in a good coat asks. The object is what I value. |
| `mornay_elsra_firth` | Elsra Firth | `MORNAY_CHANDLER_MAP` | chandler's assistant | Standing; faces up | Lamp wicks here. Rope there. Both burn if you are sufficiently careless. |
| `mornay_jarven_clay` | Jarven Clay | `MORNAY_CHANDLER_MAP` | secondhand clerk | Seated; faces left | No pledges for later redemption. An outright sale at the usual secondhand rate. Keep anything you cannot afford to lose. |
| `mornay_nessa_corst` | Nessa Corst | `MORNAY_CHANDLER_MAP` | sailor buying tools | Standing; faces up | I sold my tools when the crew was laid off. They are not on the shelf now. These will have to earn their price too. |
| `mornay_veldin_greaves` | Veldin Greaves | `MORNAY_CHANDLER_MAP` | mate buying supplies | Standing; faces left | The captain remembers oil once the lamps go out. |
| `mornay_brissa_tern` | Brissa Tern | `MORNAY_CHANDLER_MAP` | resident selling plate | Standing; faces right | It was never useful on the wall. Let it be useful somewhere. |
| `mornay_otrin_dain` | Otrin Dain | `MORNAY_CHANDLER_MAP` | repairer examining purchase | Standing; faces down | Whoever repaired this before me had faith instead of screws. |
| `mornay_fennra_rill` | Fennra Rill | `MORNAY_CHANDLER_MAP` | candle maker | Standing; faces left | Even light requires somebody trimming the ends. |
| `mornay_rella_wold` | Rella Wold | `MORNAY_GATE_INN_MAP` | gate innkeeper and cook | Standing; faces down | Sima is on errands. Thirty gold for the party to rest. Shared rooms upstairs; keep your boots off the blankets. |
| `mornay_benric_cove` | Benric Cove | `MORNAY_GATE_INN_MAP` | serving worker | Standing; faces left | I remember the table. Remind me which hungry person belongs to it. |
| `mornay_delsa_quill` | Delsa Quill | `MORNAY_GATE_INN_MAP` | card player | Seated; faces right | The collection paid for food, not revenge. Some young fool proposed breaking a contractor's windows. Whose wages would replace the glass? |
| `mornay_torva_brin` | Torva Brin | `MORNAY_GATE_INN_MAP` | merchant's clerk | Seated; faces right | My employer has rented a room for himself and a chair for the accounts. |
| `mornay_issen_dorr` | Issen Dorr | `MORNAY_GATE_INN_MAP` | roads worker | Seated; faces left | A hot meal improves my report on the road considerably. |
| `mornay_pelda_wren` | Pelda Wren | `MORNAY_GATE_INN_MAP` | traveller | Seated; faces left | I asked for somewhere ordinary. It is wonderfully ordinary. |
| `mornay_orven_lume` | Orven Lume | `MORNAY_GATE_INN_MAP` | potter visiting market | Seated; faces right | I travel with empty baskets and return without having seen the town. |
| `mornay_hessa_vane` | Hessa Vane | `MORNAY_PATE_HOME_MAP` | local regular | Standing; faces left | That corner gets the least draught. We have established this through sacrifice. |
| `mornay_vannic_nair` | Vannic Nair | `MORNAY_GATE_INN_MAP` | off-duty watch | Seated; faces right | Off duty. If somebody calls the washer a Reclaimer again, they can make the complaint in writing tomorrow. Tonight she is bringing clean linen. |
| `mornay_senric_teel` | Senric Teel | `MORNAY_GATE_INN_MAP` | kitchen boy | Standing; faces up | You can tell clean plates by how much heavier they become. |
| `mornay_marla_fallow` | Marla Fallow | `MORNAY_GATE_INN_MAP` | itinerant singer | Standing; faces left | A roomful of talk makes an excellent excuse for forgetting a verse. |
| `mornay_elva_brack` | Elva Brack | `MORNAY_DOCK_STEPS_UNIT_2_MAP` | sailor's mother | Seated; faces left | He sends money. I would occasionally prefer a spelling mistake. |
| `mornay_farren_moss` | Farren Moss | `MORNAY_GATE_BEDS_MAP` | travelling clerk | Standing; faces left | The man below me snores in remarkably official intervals. |
| `mornay_idda_fane` | Idda Fane | `MORNAY_GATE_BEDS_MAP` | farm visitor | Standing; faces left | At home the dark is quiet. Here it keeps clearing its throat. |
| `mornay_ossen_mote` | Ossen Mote | `MORNAY_GATE_BEDS_MAP` | seasonal labourer | Standing; faces left | My bed is the one with everything I own underneath. |
| `mornay_velra_hume` | Velra Hume | `MORNAY_GATE_BEDS_MAP` | visiting seamworker | Standing; faces down | I brought a spare dress and have mended everybody else's. |
| `mornay_jalin_reed` | Jalin Reed | `MORNAY_GATE_BEDS_MAP` | pack trader | Standing; faces left | I counted my stock twice. Now I cannot remember counting my shirts. |
| `mornay_nesset_yarrow` | Nesset Yarrow | `MORNAY_GATE_BEDS_MAP` | boat passenger | Standing; faces left | Dry socks have changed my opinion of the entire journey. |
| `mornay_brelna_ashe` | Brelna Ashe | `MORNAY_GATE_BEDS_MAP` | student applicant | Standing; faces right | I rehearsed my introduction. Nobody has asked for it. |
| `mornay_corra_purl` | Corra Purl | `MORNAY_GATE_BEDS_MAP` | housekeeper | Standing; faces up | A shared room still contains private belongings. Kindly remember that. |
| `mornay_gerta_vell` | Gerta Vell | `MORNAY_COMMERCIAL_INN_MAP` | commercial innkeeper | Standing; faces down | Forty gold for the party to rest at the Ledger House. Quiet rooms upstairs. We have commercial guests who need their sleep. |
| `mornay_odrin_vale` | Odrin Vale | `MORNAY_COMMERCIAL_INN_MAP` | cook | Standing; faces right | I can feed a boatload. I cannot make them agree on seasoning. |
| `mornay_lessa_crowe` | Lessa Crowe | `MORNAY_COMMERCIAL_INN_MAP` | server | Standing; faces left | Raise a hand for service. Shouting raises only my expectations. |
| `mornay_harnet_brill` | Harnet Brill | `MORNAY_COMMERCIAL_INN_MAP` | lake skipper | Seated; faces right | The near shore looked harmless. Beyond the headland we spent an hour with water over the bow. Tell that to anyone promising you an easy lake crossing. |
| `mornay_nessa_wren` | Nessa Wren | `MORNAY_COMMERCIAL_INN_MAP` | deckhand | Seated; faces left | A shore chair ought to be easier to balance on. |
| `mornay_elda_wick` | Elda Wick | `MORNAY_COMMERCIAL_INN_MAP` | sailmaker | Seated; faces right | Three crews asked for sail repairs on credit. I can trust a crew and still need to buy thread. |
| `mornay_corvinna_dale` | Corvinna Dale | `MORNAY_COMMERCIAL_INN_MAP` | cargo passenger | Seated; faces right | I bought passage, not an apprenticeship in keeping out of the way. |
| `mornay_pelren_sill` | Pelren Sill | `MORNAY_COMMERCIAL_INN_MAP` | crew cook | Seated; faces down | Eating another person's cooking is my entire leave. |
| `mornay_vessa_kest` | Vessa Kest | `MORNAY_SOUTH_ROWS_UNIT_2_MAP` | local musician | Standing; faces right | Sailors request the songs that make other sailors interrupt. |
| `mornay_talric_gant` | Talric Gant | `MORNAY_COMMERCIAL_INN_MAP` | off-duty shipping clerk | Seated; faces left | I have put the ledger away. Please do not describe your cargo. |
| `mornay_jorra_vey` | Jorra Vey | `MORNAY_COMMERCIAL_BEDS_MAP` | boatswain | Standing; faces left | Wake me for departure. Leave improvements to the world until afterward. |
| `mornay_merdin_shaw` | Merdin Shaw | `MORNAY_DOCK_STEPS_UNIT_2_MAP` | deckhand | Standing; faces right | We practise tying knots. My wages still untie themselves. |
| `mornay_sella_dace` | Sella Dace | `MORNAY_COMMERCIAL_BEDS_MAP` | navigator's assistant | Standing; faces left | I check the chart before sleep. The shore does not need checking. |
| `mornay_verren_noll` | Verren Noll | `MORNAY_COMMERCIAL_BEDS_MAP` | lake crewman | Standing; faces up | My daughter thinks every parcel comes straight from the boat. |
| `mornay_brinna_beck` | Brinna Beck | `MORNAY_COMMERCIAL_BEDS_MAP` | freighter's mate | Standing; faces up | A room without cargo feels wasteful until I lie down. |
| `mornay_hessa_rann` | Hessa Rann | `MORNAY_COMMERCIAL_BEDS_MAP` | rope worker travelling home | Standing; faces left | I have carried that present through three ports. It is now slightly less square. |
| `mornay_torren_linn` | Torren Linn | `MORNAY_COMMERCIAL_BEDS_MAP` | cabin attendant | Standing; faces up | On shore I can finally clean a floor that stays level. |
| `mornay_elsven_pike` | Elsven Pike | `MORNAY_COMMERCIAL_BEDS_MAP` | crew member writing home | Seated; faces left | I say the weather was fine. They worry less about weather. |
| `mornay_oren_teal` | Oren Teal | `MORNAY_SCHOOL_MAP` | headteacher | Standing; faces down | The Empire teaches a child to petition, then charges the parent to have the words copied. I understand why the Reclaimers find listeners. I will not have children carrying their messages. |
| `mornay_nelda_quill` | Nelda Quill | `MORNAY_SCHOOL_MAP` | school administrator | Standing; faces down | Nessa sends clean aprons when a family cannot. We record aprons, not reasons. Oren says a child should not inherit a neighbour's accusation. |
| `mornay_hadria_beck` | Hadria Beck | `MORNAY_SCHOOL_MAP` | arithmetic teacher | Standing; faces down | They understand shares immediately when the subject is lunch. |
| `mornay_serren_crowe` | Serren Crowe | `MORNAY_SCHOOL_MAP` | reading teacher | Standing; faces left | Sound it out. A difficult word is not an accusation. |
| `mornay_tessa_orr` | Tessa Orr | `MORNAY_SCHOOL_MAP` | classroom helper | Standing; faces right | One pencil dropped. Thirty scholars have discovered it. |
| `mornay_perrin_mere` | Perrin Mere | `MORNAY_SCHOOL_MAP` | pupil | Seated; faces up | Aunt Dena says counting your pay is arithmetic you should practise. |
| `mornay_vella_corst` | Vella Corst | `MORNAY_SCHOOL_MAP` | pupil | Seated; faces up | My father says his boat is important. I drew it slightly too large. |
| `mornay_ivenna_sorn` | Ivenna Sorn | `MORNAY_SCHOOL_MAP` | pupil | Seated; faces up | I put the answer on the wrong line. It was a very good answer. |
| `mornay_dorrie_firth` | Dorrie Firth | `MORNAY_SCHOOL_MAP` | pupil | Seated; faces up | We are writing about home. Mine has the best window. |
| `mornay_helren_pate` | Helren Pate | `MORNAY_SCHOOL_MAP` | pupil | Seated; faces up | The map fits on paper. Walking it seems unfair. |
| `mornay_maris_glyn` | Maris Glyn | `MORNAY_SCHOOL_MAP` | pupil | Standing; faces left; Dayoff: `MORNAY_GLYN_HOME_MAP` | I read to my little brother. He insists the pictures are corrections. |
| `mornay_bessa_rook` | Bessa Rook | `MORNAY_SCHOOL_MAP` | parent | Standing; faces left | We can manage the ward school. The Collegium wants fees and preparation. My daughter asks what happens if she is clever enough but we are not rich enough. |
| `mornay_ellin_hesk` | Ellin Hesk | `MORNAY_SCHOOL_MAP` | caretaker | Standing; faces up | Small boots bring in a tremendous amount of town. |
| `mornay_verra_moss` | Verra Moss | `MORNAY_SCHOOL_MAP` | adult learner | Seated; faces up | I can read the notice myself now. I still dislike what it says. |
| `mornay_edrin_saye` | Edrin Saye | `MORNAY_HARBOUR_MAP` | customs assessor | Standing; faces down | The Reclaimers use real grievances. That does not make every unlisted crate harmless. If Voss wants a cargo inquiry, she can send a signed request. We will not own her speculation. |
| `mornay_maura_dell` | Maura Dell | `MORNAY_HARBOUR_MAP` | harbour administrator | Standing; faces down | Berth allocation here. Excise with Saye. Unsafe shore works with Arlis at the IJC office. Please do not bring their unanswered forms back to my counter. |
| `mornay_hassel_muir` | Hassel Muir | `MORNAY_HARBOUR_MAP` | manifest clerk | Standing; faces down | Use the same cargo name on both copies. Poetry delays clearance. |
| `mornay_vessa_fenn` | Vessa Fenn | `MORNAY_HARBOUR_MAP` | fee clerk | Standing; faces down | Small consignments pay the minimum charge. Large ones spread it across more cargo. I did not write the schedule and cannot waive it. |
| `mornay_orris_teel` | Orris Teel | `MORNAY_HARBOUR_MAP` | berth scheduler | Standing; faces down | Two captains have requested the same empty water. |
| `mornay_dalen_wist` | Dalen Wist | `MORNAY_HARBOUR_MAP` | inspection officer | Standing; faces down | The fee is for an inspection, not for finding something wrong. Some of my colleagues seem to need reminding. |
| `mornay_berra_yule` | Berra Yule | `MORNAY_HARBOUR_MAP` | customs copyist | Seated; faces left | The correction needs initials, not an account of your disappointment. |
| `mornay_neven_brume` | Neven Brume | `MORNAY_HARBOUR_MAP` | harbour messenger | Standing; faces left | The answer reached the quay just after the question sailed. |
| `mornay_tilda_vole` | Tilda Vole | `MORNAY_HARBOUR_MAP` | waiting agent | Standing; faces up | My client considers waiting part of my fee, somehow. |
| `mornay_harnis_roy` | Harnis Roy | `MORNAY_HARBOUR_MAP` | barge master | Standing; faces up | I paid a broker for quick clearance. He knew which clerk was away before the harbour did. I am beginning to understand what I bought. |
| `mornay_elna_stern` | Elna Stern | `MORNAY_HARBOUR_MAP` | small trader | Standing; faces left | The fee is smaller for a large shipment. A useful discovery for large people. |
| `mornay_corren_wark` | Corren Wark | `MORNAY_HARBOUR_MAP` | archive clerk | Standing; faces up | Old manifests are dull until somebody urgently needs one. |
| `mornay_delsin_orl` | Delsin Orl | `MORNAY_HARBOUR_MAP` | inspection assistant | Standing; faces up | I count the boxes. Guessing is apparently a senior privilege. |
| `mornay_rissa_dane` | Rissa Dane | `MORNAY_HARBOUR_MAP` | vessel owner | Standing; faces up | I paid for a better hull. Water has yet to congratulate me. |
| `mornay_varda_fen` | Varda Fen | `MORNAY_WAREHOUSE_MAP` | warehouse supervisor | Standing; faces down | Bram catches missing sacks. I catch the arguments. The bonded annex is locked. Work in the public store does not authorize you beyond that door. |
| `mornay_helric_tress` | Helric Tress | `MORNAY_WAREHOUSE_MAP` | hoist operator | Standing; faces left | Watch my hand before moving the load. |
| `mornay_istra_wick` | Istra Wick | `MORNAY_WAREHOUSE_MAP` | packing lead | Standing; faces up | Heavy underneath. That principle has survived every new foreman. |
| `mornay_polren_hale` | Polren Hale | `MORNAY_WAREHOUSE_MAP` | salt porter | Standing; faces down | Salt finds every scratch you forgot you had. |
| `mornay_gessa_noll` | Gessa Noll | `MORNAY_WAREHOUSE_MAP` | grain checker | Standing; faces up | A dry sack can hide damp grain. Feel the corners. |
| `mornay_merrit_dace` | Merrit Dace | `MORNAY_WAREHOUSE_MAP` | freight scribe | Standing; faces left | I write down what passed the door, not what someone hoped would. |
| `mornay_arla_rill` | Arla Rill | `MORNAY_WAREHOUSE_MAP` | crate assembler | Standing; faces left | There is a difference between shut and secured. |
| `mornay_oden_gant` | Oden Gant | `MORNAY_DOCK_STEPS_UNIT_3_MAP` | night porter | Seated; faces left | People carry folded papers through a warehouse as well as sacks. No label tells you which will get a man dismissed. Ask the day clerk about cargo. |
| `mornay_nessa_muir` | Nessa Muir | `MORNAY_WAREHOUSE_MAP` | meal runner | Standing; faces right | If you cannot leave the load, I can bring the bowl. |
| `mornay_verdin_clay` | Verdin Clay | `MORNAY_WAREHOUSE_MAP` | warehouse sweeper | Standing; faces up | Lost grain feeds something. I prefer it not live here. |
| `mornay_lerna_brack` | Lerna Brack | `MORNAY_WAREHOUSE_MAP` | damaged-goods clerk | Standing; faces left | Describe the damage before suggesting whose fault it must be. |
| `mornay_fenna_crowe` | Fenna Crowe | `MORNAY_WAREHOUSE_MAP` | new packer | Standing; faces right | The others showed me once, then stayed close enough to show me again. |
| `mornay_halden_rusk` | Halden Rusk | `MORNAY_WORKSHOP_MAP` | printer | Standing; faces down | My nephew Tavi sets the type. I have refused work from officials and from their enemies. A threat does not become an argument because it arrives with a petition. |
| `mornay_irma_bellows` | Irma Bellows | `MORNAY_WORKSHOP_MAP` | toolmaker | Standing; faces down | A tool should fit the hand that actually uses it. |
| `mornay_cerren_flint` | Cerren Flint | `MORNAY_WORKSHOP_MAP` | smith | Standing; faces up | I hear a bad weld before a customer sees it. |
| `mornay_vesta_dorr` | Vesta Dorr | `MORNAY_WORKSHOP_MAP` | printer's reader | Standing; faces up | Pella's sheets were seized before anyone read them. That pleased the man selling blank forms next door. He has doubled his prices. |
| `mornay_pelda_gorse` | Pelda Gorse | `MORNAY_WORKSHOP_MAP` | paper cutter | Standing; faces down | Straight edges begin with a table that does not wobble. |
| `mornay_jerrin_cole` | Jerrin Cole | `MORNAY_WORKSHOP_MAP` | repair apprentice | Standing; faces down | I put the pieces in order. Then discovered a piece of yesterday. |
| `mornay_hessa_yarrow` | Hessa Yarrow | `MORNAY_WORKSHOP_MAP` | sailcloth stitcher | Seated; faces up | These stitches are for wind, not admiration. |
| `mornay_torlin_hesk` | Torlin Hesk | `MORNAY_WORKSHOP_MAP` | wheelwright | Standing; faces right | A wheel need not look splendid. It must remain round under complaint. |
| `mornay_nilda_linnet` | Nilda Linnet | `MORNAY_WORKSHOP_MAP` | pattern drafter | Standing; faces down | Draw the allowance before cutting away your optimism. |
| `mornay_orsa_purl` | Orsa Purl | `MORNAY_WORKSHOP_MAP` | workshop bookkeeper | Seated; faces left | They remember owing one another favours. I remember the timber. |
| `mornay_nessa_quill` | Nessa Quill | `MORNAY_LAUNDRY_MAP` | laundry organiser | Standing; faces left | A person can work all week and still need a neighbour. We collect for supper and rent. Anyone demanding names before giving a coin can keep the coin. |
| `mornay_yelda_mere` | Yelda Mere | `MORNAY_LAUNDRY_MAP` | washer | Standing; faces up | Dena wants the next meeting about the hoist and unpaid shifts. Others want speeches about bringing everything down. We still have washing to finish afterward. |
| `mornay_cossa_beck` | Cossa Beck | `MORNAY_LAUNDRY_MAP` | mender | Seated; faces down | I recognise half the street by the elbows. |
| `mornay_brinna_mote` | Brinna Mote | `MORNAY_DOCK_STEPS_UNIT_3_MAP` | laundry customer | Standing; faces left | My employer calls the collection a conspiracy. He sent his own porter to ask for food after cutting the man's hours. |
| `mornay_terenna_vane` | Terenna Vane | `MORNAY_LAUNDRY_MAP` | wringer operator | Standing; faces down | Mind your sleeve. The rollers are thorough. |
| `mornay_jessa_reed` | Jessa Reed | `MORNAY_LAUNDRY_MAP` | washer's assistant | Standing; faces up | Wet linen weighs more than the people who request it. |
| `mornay_fenric_orr` | Fenric Orr | `MORNAY_LAUNDRY_MAP` | infirmary laundry carrier | Standing; faces right | Yara asks for the plain sheets first. Nessa sends them whether the last bill was paid or not. Neither of them has time to argue about credit for it. |
| `mornay_orlin_bale` | Orlin Bale | `MORNAY_LAUNDRY_MAP` | neighbour awaiting wash | Standing; faces left | I offered to help. They found an alarming amount of help for me. |
| `mornay_della_hume` | Della Hume | `MORNAY_BOARDING_MAP` | boardinghouse keeper | Standing; faces right | Rent includes a bed. It does not include finding work. The hiring board is at the East Gate; do not give a stranger your last coin for a place in line. |
| `mornay_hesten_vale` | Hesten Vale | `MORNAY_BOARDING_UNIT_1_MAP` | seasonal clerk | Seated; faces right | My position is temporary. My cupboard has begun to feel permanent. |
| `mornay_rella_fenner` | Rella Fenner | `MORNAY_BOARDING_UNIT_1_MAP` | dock worker | Standing; faces left | The early shift eats quietly. We know who is still sleeping. |
| `mornay_otrin_wren` | Otrin Wren | `MORNAY_BOARDING_UNIT_2_MAP` | unemployed joiner | Seated; faces left | They dismissed a man for organizing. Then the foreman dismissed two men who had never spoken to him. Cheap hands were waiting outside. |
| `mornay_vessa_fallow` | Vessa Fallow | `MORNAY_BOARDING_UNIT_4_MAP` | kitchen worker | Seated; faces left | At work I cook. Here I negotiate for a turn at the stove. |
| `mornay_belric_tern` | Belric Tern | `MORNAY_BOARDING_UNIT_3_MAP` | retired carrier | Seated; faces left | I used to know the town by addresses. Now I know its benches. |
| `mornay_jorra_yew` | Jorra Yew | `MORNAY_RANN_HOME_MAP` | apprentice seamworker | Standing; faces right | My first paid seam was crooked. The customer wore it anyway. |
| `mornay_marden_sill` | Marden Sill | `MORNAY_BOARDING_UNIT_3_MAP` | remittance sender | Standing; faces left | Some men offer quiet passages and cheap carriage. One asked for a fee in the Reclaimers' name. Hal sent him away. I still keep my papers on me. |
| `mornay_selda_brin` | Selda Brin | `MORNAY_COURT_UNIT_1_MAP` | parent | Seated; faces right | The children call it one large house when they want somebody else's supper. |
| `mornay_harlis_glyn` | Harlis Glyn | `MORNAY_GLYN_HOME_MAP` | dockworker | Seated; faces right | Maris reads the office replies aloud now. She asks why they never answer the question. I have run out of ways to soften it. |
| `mornay_etta_rook` | Etta Rook | `MORNAY_COURT_UNIT_2_MAP` | elder resident | Seated; faces left | Everyone consults me about the old days. Nobody asks where I left my cup. |
| `mornay_davren_fenwick` | Davren Fenwick | `MORNAY_COURT_MAP` | home repairer | Standing; faces down | We share a roof. Repairs make that arrangement remarkably explicit. |
| `mornay_nelva_pike` | Nelva Pike | `MORNAY_COURT_UNIT_4_MAP` | fish seller's sister | Standing; faces right | Niva brings what did not sell. I have become skilled at looking delighted. |
| `mornay_ossa_nair` | Ossa Nair | `MORNAY_COURT_UNIT_3_MAP` | constable's parent | Seated; faces left | Jessa checks the latch when she visits. Then forgets to eat. |
| `mornay_berren_sorn` | Berren Sorn | `MORNAY_COURT_UNIT_1_MAP` | child | Standing; faces left | My aunt fixes boots. She says my feet are repeat customers. |
| `mornay_cerra_muir` | Cerra Muir | `MORNAY_COURT_UNIT_2_MAP` | elder's caregiver | Standing; faces right | We argue about the tea. It means she is having a better day. |
| `mornay_ilven_reed` | Ilven Reed | `MORNAY_REED_HOME_MAP` | homebound net maker | Seated; faces left | Heba sends the difficult knots. My hands still work even if my legs will not take the quay steps. Pay for the net, not the story. |
| `mornay_verna_quill` | Verna Quill | `MORNAY_COURT_UNIT_4_MAP` | Nessa's mother | Seated; faces left | My daughter brings food round and tells me not to worry. People who say that should try coming home before dark. |

## Implementation decisions and reservations

- Reuse the 17-map topology and all existing regional grids. New ordinary building doors are explicit registry entries; room IDs use `mornay_` prefixes so Calwick/Drenwick handlers cannot claim them.
- Maintain SAVE_VERSION 5 and the existing location payload. Dialogue, network classifications, decorations and routes add no saved state. Existing item, gold, day and party health authorities remain responsible for service results.
- Correct the two stale faction references in `LORE.md` and Fenwick’s `npcs.js` dialogue to Reclaimers. The audit found no legacy internal/persistence identifier requiring retention; do not invent an alias or historical rename.
- Gate departures already use safe approach PATH tiles: West (240,144), East (272,144), facing down. Town arrival remains (240,432). Controller tests cover both movement presentations, saves and debug arrival.
- Hydrographer/Esla history, ship mystery, clandestine boarding, Island ferry, major quests, Regional Office operations, Old Fort plot and Reclaimer recruitment/investigation remain inactive. No placeholder doors expose them.
- Rendering uses existing programmatic sprites, tile vocabulary and deterministic narrow decorations. No new image assets, dependency, terrain type, random encounters or save schema.

## Deliberately deferred and verification

Later editorial review may revise names, quip frequency, exact prices, class accents and stock progression. A new equipment tier needs its own balance audit. The proposed Fen Angler’s Rod was rejected as shop stock because the item registry marks it as a quest/key item; ordinary Leather Armor is used instead. Valmere basin depth, hydrographic principal, ship narrative and future Reclaimer objectives are deliberately unresolved.

Required verification includes input-driven gate and door routes; safe landings; unique roster IDs and comparable counts; swept patrol/collision checks; buying, selling, both inn receipts and treatment; save/load every room; mixed-speaker styling and text fit; no mutable Reclaimer state; inert reserved content; no town encounters; catalogue and fingerprints; full transition artifact; old-town and historical combat regression. Test 300 owns gate controls; reserve 301–319 for the exclusive post-production test writer. Browser/manual evidence must be reported separately from simulated controls.


## Historical MVP delivery at 6f065af

The following record preserves the earlier MVP delivery and its then-current counts and worktree state. The current tables above include the subsequent residential refinement. The codex worktree already contained that completed MVP at this refinement’s start; this pass makes no further cross-worktree integration.

### Approved source and prerequisite exception

Starting HEAD: `fe5992ec4bb647ce6f89554ad409a16a143769ec`. `main` and `agent/codex` both point there; `agent/claude` points to `3758d01beb014d50f918c34a98f20735b9ca4a42`. Merge bases: main/codex = `fe5992ec4bb647ce6f89554ad409a16a143769ec`; main/claude and codex/claude = `3758d01beb014d50f918c34a98f20735b9ca4a42`. No active Git operation was present in any of the 20 registered worktrees.

Committed foundations were checked rather than reconstructed: Mornay skeleton and both entrances (`d32aef5`), ferry presentation (`79e8b9a`), Sera/Liora ownership and presentation (`9d93fed`, `052b949`, `fe5992e`), Rise ambush (`3758d01`), integrated Fens/MQ5 (`089b7f8`), Rise camp/dialogue (`e6b4671`), party menus/singleton compatibility (`3b35723`) and preceding canonical party integration (`feee974`). The dedicated worktree started clean. The source had no tracked changes, but its approved QA PNG was untracked; this was the exact original preflight blocker.

The user's explicit resume exception authorized copying only `Art/qa/sera-liora/Sera and Liora between twin beds.png`. The source remains untouched and untracked in the codex worktree; the destination is a normal tracked 2,203,880-byte image, not a symlink. Both SHA-256 values match suite 260's authority: `47fbf97862f2865fda59a0750970112933fe0cdbd41c49bc29b0544b27c9a025`. The image was neither regenerated nor altered. Suite 260 passed, then the complete restored baseline passed **218/218** before the image-only prerequisite commit. The earlier preflight's only failure was the missing image (217/218).

### Coordinated agents and integration decisions

All initial findings were reused after the pause. Only the root edited production, changed Git, regenerated shared artifacts or committed. No nested delegation occurred. Concurrency stayed within available slots and the user's four-agent ceiling. All subagents used GPT-6.1 Sol; none used Astra.

| Agent | Assignment / effort | Accepted findings and corrections |
|---|---|---|
| `gate_debugger` | Paired gate diagnosis / High | Accepted entrance-marker bounce diagnosis, row-4 safe returns, both-mode held-input coverage. Rejected the old topology test's row-3 landing as an authority. |
| `drenwick_benchmark` | Ordinary town census / Medium | Accepted registry/schedule union and overlap methodology. Corrected provisional 101 to 99 by removing a position-only visitor and party Esla projection; retained ordinary wake-scene staff/patient. Visitors count comparably in both towns. |
| `urban_geography` | Seventeen-district matrix / Medium | Accepted district roles, central circulation and narrow northern lane restrictions, reserve protection. Root placed infirmary/school in the South, commercial inn in North Upper West and harbour room in North Lower West. |
| `economy_institutions` | Services and institutions / Medium | Accepted existing stocks, combined chandler/secondhand business, two prices and ordinary paid-care convention. Rejected quest/key-item Fen Angler's Rod as merchandise; used Leather Armor. Accepted rest-receipt gold-seal warning. |
| `npc_network` | Full roster and dialogue clusters / Medium | Accepted 300 identities and connected family/work networks. Root reduced proposed patrols to 12 safe routes, revised numerous quips into practical concerns, and renamed Liora Bexley to Linna Bexley to avoid confusion with the established character. |
| `reclaimer_canon` | Canon, terminology and knowledge / Medium | Accepted two stale text corrections, nine network ties, three concealed members and optional-reading/ambush knowledge limits. No legacy faction identifier required preservation. |
| `state_architecture` | Ownership and implementation surface / Medium | Accepted distinct room IDs, existing registries/location payload and save version 5. Corrected its initial missed Drenwick exterior paid-treatment authority using economy/root tracing. |
| `verification_audit` | Complete test matrix / High | Accepted controller, service, collision, state and compatibility matrix. Audited all worktrees and reserved previously unused 300–319 block. |
| `mornay_test_writer` | Exclusive new focused tests / High | Wrote only new 301–310 after root production stopped at `b5ced18`; all ten passed. Root inspected every file and bounded its roster parser to the roster section after adding delivery tables. Tests exercise input, collision, accounting and atomicity, including an independently derived census; no production defect reproduced. |
| `mornay_correctness_review` | Fresh final correctness / High | No evidence-backed defect. Independently reran 300, 303, 305, 306, 307 and 308 successfully. No files changed. |
| `mornay_coherence_review` | Fresh final town coherence / Medium | No canon or coherence blocker. Five subjective editorial/visual suggestions are recorded below rather than silently rewritten. No files changed. |

### Local checkpoint chain

The final test/documentation checkpoint containing this delivery record follows `b5ced18`. Its exact SHA and parent are supplied with the delivery response; a commit cannot contain its own resulting hash. All preceding full hashes and parents are:

| Commit | Parent | Subject |
|---|---|---|
| `29c87c9097ac3c663b7386d48a8f02910e02266f` | `fe5992ec4bb647ce6f89554ad409a16a143769ec` | chore(test): track approved Sera and Liora reference image |
| `da794f77f6a62b7e033a337bcb6229088e41054b` | `29c87c9097ac3c663b7386d48a8f02910e02266f` | fix(mornay): restore paired overworld exits |
| `f3902739d142a132479a6fa511e6cd0ba5fe3431` | `da794f77f6a62b7e033a337bcb6229088e41054b` | docs(mornay): define population and services plan |
| `f5095e3b681bab1cc1ddf6b387cc74b19706cb50` | `f3902739d142a132479a6fa511e6cd0ba5fe3431` | fix(lore): restore Reclaimer terminology |
| `3ec5fdec6cab592fdb6deb404ffe8df9fcf7f6cc` | `f5095e3b681bab1cc1ddf6b387cc74b19706cb50` | feat(mornay): add civic and commercial interiors |
| `b5ced18db5269b6e36454af7a55f57780048854e` | `3ec5fdec6cab592fdb6deb404ffe8df9fcf7f6cc` | feat(mornay): populate services and Reclaimer networks |

Services, street population and Reclaimer content were combined in one checkpoint because they share the NPC, interaction and rendering authorities. No milestone was committed with a failing focused check.

### Gate defect, corrected contract and evidence

Reproduction on the approved source used the real keyboard listeners and `update()`: start on Town Approach below either entrance, hold Up into the corresponding gate, then hold Down toward the southern exit. The party left town onto the same `TOWN_ENTRANCE` marker and re-entered on the next update. Existing transition cooldown did not suppress this tile dispatch. Both regional presentation modes behaved alike; direct topology tests incorrectly required the marker landing and stopped before the next input frame.

`world-transitions.js:exitTown()` now follows the existing town convention of landing beyond the entrance trigger. No input-specific or debug-only escape was added. Gate identity comes from the actual gate map, so loading a gate save or arriving by debug warp needs no remembered origin.

| Gate | Local arrival | Local exit tile | Town Approach return | Canonical regional world point | Facing |
|---|---|---|---|---|---|
| West | `(240,432)` px, up | `(7,14)` | tile `(7,4)`, centre `(240,144)` px | `(8944,-1296)` | down |
| East | `(240,432)` px, up | `(7,14)` | tile `(8,4)`, centre `(272,144)` px | `(8976,-1296)` | down |

Both returns use existing PATH tile 2 with a valid full player collision footprint. They are south of the trigger row `(7,3)/(8,3)` and the four solid crown tiles in rows 1–2. Continued Down movement leaves the marker, idle frames do not re-enter, and deliberate Up movement re-enters the correct gate. Tests cover both complete round trips, both presentations, saving/loading each gate and conventional West Gate debug warp followed by ordinary exit. Automated Chrome repeats these routes at both display sizes. No manual pre-fix or post-fix human playthrough is claimed.

### Delivered population and political distribution

The census is **99 Drenwick comparable characters versus 300 Mornay characters: 3.0303×**. Drenwick is a union of 9 exterior and 92 interior identities with Renn and Veran shared. Schedule aliases, duplicate placements, cutscene party copies, enemies and debug fixtures do not inflate it. Eight Drenwick characters are explicitly visitors; the remaining 91 are not all established permanent residents. Suite 310 derives the ordinary schedule union over ten days.

Mornay has 120 exterior and 180 interior speakers; all 300 have unique stable IDs and distinct names. There are 12 moving speakers and 288 stationary speakers, zero silent-only residents, and 293 incidental/ambient speakers plus seven operational service keepers. Movement and speaking counts overlap. Authored primary role buckets (exclusive, rather than a claim that occupations never overlap) are: 159 workers, 67 residents/visitors, 32 officials, 24 service workers and 18 merchants. The seven transactional keepers comprise four shops, two inns and one physician. The exterior district matrix and room matrix above give every map's exact count; the full roster gives every person and location.

Nine network-linked residents occupy eight exterior districts: five are outside and four inside. Three are author-only confirmed members; four are associates; two are sympathizers, one of whom is falsely accused of organizing violence. Three additional Imperial/watch observers are separate from those nine.

| Character | Classification | Exact location |
|---|---|---|
| Dena Mere | labour associate; sympathetic, membership unconfirmed | `MORNAY_NORTH_LOWER_WEST_MAP` |
| Bram Fen | confirmed member | `MORNAY_MIDDLE_UPPER_WEST_MAP` |
| Pella Dorn | sympathizer falsely accused of organizing violence | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` |
| Tavi Rusk | confirmed member | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` |
| Sima Wold | boarding and lodging associate | `MORNAY_SOUTH_UPPER_WEST_MAP` |
| Yara Kelm | medical mutual-aid associate | `MORNAY_INFIRMARY_MAP` |
| Hal Venn | logistics associate | `MORNAY_CHANDLER_MAP` |
| Oren Teal | educated sympathizer | `MORNAY_SCHOOL_MAP` |
| Nessa Quill | confirmed member | `MORNAY_LAUNDRY_MAP` |

Imperial observers are Jessa Nair (West Gate), Marit Voss (Regional IJC Office, Middle Upper Central East) and Edrin Saye (Harbour/Customs room, North Lower West). The network is conveyed through linen and food aid, contested wages, missing freight, private letter carriage, printers, seized sheets and guarded associations. Thirteen inspectable notices also identify ordinary institutions and inert reserves; only a restrained subset concerns political activity. The locked back stair and bonded annex do not open.

Representative connected dialogue includes Gessa asking why Arlis's contractor returned a condemned hoist to use; Kelda describing a contractor denying her employment after an injury; Nessa refusing to trade contributors' names for donations; Marit separating wage grievances from conspiracy; and Benna describing three years of paid examination preparation. The five companion conversations use canonical `speakerId: 'esla'` and `esla_light_green` (`#a8e89c`), gated by actual companion availability. Lely remains quiet. No one exposes membership, assumes optional brewery reading, attributes the earlier ambush to the faction, resolves the central mystery or starts an investigation.

The two corrected stale faction references were Fenwick's dialogue in `npcs.js` and the ambusher non-affiliation passage in `LORE.md`. Runtime and lore now consistently say Reclaimers. **Retained internal or persistence faction identifiers: none.** The obsolete spelling remains only where a test or this audit explicitly describes the prohibited terminology; it is not an alias, faction or historical rename.

### Exact existing-grid changes

All 115 regional grids and fingerprints are unchanged by this branch. Exactly 18 cells in existing Mornay exteriors changed: fifteen `TOWN_BUILDING` (13) cells became ordinary `HOUSE_DOOR` (34), and three northern approach cells became `TOWN_FLOOR` (12). No other existing-grid cell changed. Coordinates are zero-based `(column,row)`:

| Exterior | 13 → 34 doors | 13 → 12 approach |
|---|---|---|
| North Upper West | `(11,5)` | `(11,6)` |
| North Lower West | `(11,5)` | `(11,6)` |
| North Lower East | `(11,5)` | `(11,6)` |
| Middle Upper West | `(3,5)` | — |
| Middle Upper Central West | `(3,5)` | — |
| Middle Upper Central East | `(3,5)` | — |
| Middle Lower Central West | `(3,5)` | — |
| Middle Lower Central East | `(12,5)` | — |
| Middle Lower East | `(3,5)`, `(3,9)` | — |
| South Upper West | `(12,5)`, `(3,10)` | — |
| South Upper East | `(3,5)`, `(12,5)` | — |
| West Gate | `(3,5)` | — |

The 17 new room grids use existing walls, floor, exit, door and solid fixture tiles. Furniture collision and rendering share `MORNAY_ROOM_FIXTURES`. Exterior dressing is deterministic and sits on existing building massing; no new terrain type, random decoration, dependency or bespoke portrait was added. The only added raster file is the explicitly authorized prerequisite QA reference.

### File-level delivery

| Files | Purpose |
|---|---|
| `Art/qa/sera-liora/Sera and Liora between twin beds.png` | Exact approved test reference import. |
| `LORE.md`, `MORNAY_TOWN_PLAN.md`, `architecture.md`, `PROJECT_STATUS.md` | Canon terminology, approved institution definitions, complete roster/district/service plan, ownership/current status and delivery record. Historical skeleton verification is labelled as historical. |
| `content/maps/mornay-maps.js`, `data.js` | Door/return/fixture authorities, 17 rooms and catalogue registration. |
| `content/npcs/mornay-npcs.js`, `npcs.js` | 300 stable speakers, 12 routes, companion exchanges, registry integration and Fenwick correction. |
| `content/interactions/mornay-interactions.js`, `interactions.js`, `shops.js` | Inert inspectables, four inventories, two inns and selected-member treatment offers. |
| `persistent-party.js` | Narrow canonical `treatMember()` operation; no new saved authority. |
| `movement.js`, `world-transitions.js`, `save.js`, `validation.js` | Safe gate returns, room dispatch/reciprocity, map-context validation and existing save-v5 integration. |
| `render-mornay.js`, `render-entities.js`, `render.js`, `index.html` | Deterministic town details, room fixtures, optional sprite palette variation and script/render integration. |
| `test/browser-smoke.js` | Real Chrome keyboard, Canvas, font and service review at both display scales. |
| `test/cases/300-mornay-gate-controller.test.js` | Root-owned gate prerequisite coverage. |
| `test/cases/301-mornay-manifest.test.js`, `302-mornay-occupancy-routes.test.js`, `303-mornay-room-district-controls.test.js`, `304-mornay-shop-controller.test.js`, `305-mornay-inn-recovery.test.js` | Delegated identity/reachability/routes, every room and street crossing, real commerce and both inn recovery contracts. |
| `test/cases/306-mornay-treatment-controller.test.js`, `307-mornay-persistence-atomicity.test.js`, `308-mornay-dialogue-reservations.test.js`, `309-mornay-compatibility.test.js`, `310-mornay-comparable-census.test.js` | Delegated care accounting, forged-save rejection, inert content/style, no encounters/read-only rendering and independent benchmark. |
| `test/cases/45-npc-movement-contract.test.js`, `46-bridge-guard-toll.test.js`, `58-regional-content-split.test.js` | Extend explicit mover/aggregate expectations for the twelve new routes and Mornay registry; retain old assertions. |
| `test/cases/98-thornmere-upper-shallows-scenery.test.js`, `99-thornmere-canal-head.test.js`, `100-east-causeway.test.js`, `101-west-outfall-canal-tunnel.test.js`, `102-north-basin-drowned-rim.test.js`, `103-north-basin-mirewood.test.js`, `104-eastern-reaches-abandoned-farmhouse.test.js`, `201-travellers-rise-campsite.test.js`, `207-travellers-rise-campfire-night.test.js`, `218-mornay-exterior-topology.test.js` | Legitimate catalogue total update to 251; case 218 also corrects the defective gate landing expectation. No topology/fingerprint/compatibility assertions were relaxed. |
| `test/transition-audit.js`, `test/transition-audit-output.json` | Enumerate new reciprocal room transitions and regenerate their authoritative audit. |

### Verification and artifact accounting

The final complete `node test/run.js` regression passed **229/229 suites, 0 failures**. This includes the historical singleton, Formation, party-command, Resonance, Sera/Liora, MQ5, Eastern Fens, Travellers' Rise, ferry, old-town and no-visible-void compatibility coverage. The restored prerequisite baseline was 218/218; eleven new Mornay suites account for the increase.

The 11 Mornay suites cover both gate round trips, actual held controls for all 17 rooms and all 46 directed exterior crossings in both regional modes, all 300 reachable conversations on workday and Dayoff, all twelve moving routes and swept occupancy, four complete inventories through buy/sell/cancel/insufficient-funds/save flows, both inns for solo/companion/mixed Fallen parties, and selected-member full/partial/zero-funds treatment. Every room saves/loads and exits normally; 136 forged room-save combinations reject atomically. Dialogue/notices remain repeatable without flag, reward, allegiance or MainQuest mutation. Canonical speaker styling survives pagination. Every exterior/interior remains escapable and the town does not roll encounters.

`node --check` passed for all 41 changed/new JavaScript files. `validateGameData()` reports 251 maps, 481 total registry NPCs, 956 text entries, 205 existing save flags, **0 errors and the same 12 baseline warnings**. The warnings remain the documented notice-board property, eight generic battle sprites, one reserved encounter pool and two older long-dialogue entries. SAVE_VERSION remains **5** with no added payload field. Unique IDs, route validation, fixture collision, malformed placement rejection, state isolation, fingerprints, stale-reference/conflict searches and `git diff --check` pass.

The complete read-only transition audit passes: **251 maps, 342 fixed destinations, 8 preserved-coordinate transitions, 240 edge segments and 42 legacy house doors**. Its fixed destinations include 34 new room entry/exit records. The 17 Mornay room doors are registry entries, distinct from the legacy house-door count.

Only `test/transition-audit-output.json` was regenerated, always through `node test/transition-audit.js --write`. The gate checkpoint changed two return destinations; the room checkpoint added 17 map/dimension records and 34 fixed transitions; populated collision changed 38 escape-direction booleans across 26 Mornay records (11 door returns and 15 district landings), all still escapable and OK. These are current-input changes, not unrelated catch-up. Regional fingerprint fixtures were not regenerated.

The first populated full run exposed twelve historical assertions tied to old map totals, mover lists or the aggregate NPC array. Those expectations were updated for the authorized additions without relaxing the substantive assertions; their focused reruns passed before checkpointing. No historical combat or old-town production workaround was introduced.

### Browser evidence and remaining human review

The in-app browser execution tool was unavailable. The existing local headless Chrome workflow was used instead: `node test/run-browser-smoke.js` with a temporary capture-output directory. It passed **1,071 checks with no browser errors and produced 118 Canvas captures**. The actual DOM Canvas displayed at 512×480 and 1024×960; exported Canvas PNGs retain the logical 512×480 resolution, so they are not full-viewport screenshots.

Real browser keyboard events exercised both gates in both movement modes at both scales, save/load in both gates, ordinary departure after West Gate debug warp, every room entrance/exit and room save, four shop purchases, both inn rests, infirmary care and representative cluster conversations. Every exterior was placed/rendered, and all 293 non-service NPC dialogues were measured using actual browser fonts. Esla's green interjection, Collegium/reserve presentation, no town battles, ferry behaviour and old-town rendering were inspected. The root visually reviewed eight captures; the coherence reviewer inspected four. These are automated browser evidence and visual inspection of captures, not a human continuous playthrough. All 46 district crossings were separately exercised through VM keyboard controls.

Remaining human feel/pacing checklist, at both display sizes:

1. From `EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP`, walk Up from `(240,144)` into West Gate, Down out, then repeat at `(272,144)` for East Gate. Hold departure; release/repress; save/load each gate; use the conventional Mornay West Gate debug destination and leave normally. Repeat in Legacy Regional Fallback.
2. Traverse the full 17-map district matrix above. Check foreground readability, route clearance and perceived density, especially the narrow North rows, Middle market and freight yards. Read political evidence at North Lower West `(12.5,8.2)`, Middle Upper Central West `(2.5,9.2)`, Middle Lower Central East `(2.5,5.8)`, Middle Lower West `(12.5,9.2)` and locked Middle Lower East stair `(12.5,5.8)` (tile units).
3. Walk every exact door/return pair in the interior matrix, including both inn upstairs rooms. Save/load in the IJC office, infirmary, warehouse and both lodging rooms; confirm furniture and moving residents cannot obstruct an exit. Use all four keepers, both innkeepers and physician Selven Orr.
4. Speak to the five companion-exchange speakers: Inessa Cray in the IJC office; Yara Kelm and Elrin Vey in the infirmary; Dena Mere at North Lower West; Nessa Quill in the laundry. Check green Esla text and normal text afterward. Sample workers, parents, children, exam candidates, clerks, shopkeepers, patients, crews, injured/unemployed residents and all nine network-linked residents from the roster.
5. Inspect the locked Civic Collegium at North Upper East `(12.5,6.2)`, hydrographic frontage at Middle Upper East `(12.5,5.8)`, Old Fort cells `(10.5,2.8)`, story berth at North Upper West `(4.5,10.5)` and island ferry reserve at North Lower West `(4.5,4.5)`. No boarding, quest, faction, investigation or reputation interface should activate.
6. Revisit Calwick and Drenwick; use their ordinary exits and representative services. Confirm no random Mornay encounter and unchanged causeway ferry behaviour. Judge crowding and dialogue rhythm across a sustained visit; automation does not establish those qualities.

### Editorial questions retained for later review

The fresh coherence reviewer found no blocker but recommended considering: (1) reducing the shared aphoristic voice among unrelated workers and customers; (2) making Sima's letter-drop hint and Yara's mention of Nessa's meetings more guarded; (3) clarifying whether Elna's complaint means a lower per-unit charge rather than lower total freight fee; (4) depicting injured patients resting rather than standing beside beds; and (5) varying the repeated room geometry and regular NPC rows. These are recorded suggestions, not silently applied rewrites. Names, prices and flavour remain revisable. A new equipment progression tier still requires a separate balance audit.

The scope deliberately leaves Regional Office operational plot dialogue, hydrographer/Esla history, ship mystery, clandestine boarding, island ferry, Old Fort plot, new major quests, Reclaimer recruitment/investigation and allegiance/reputation systems inactive. The Civic Collegium has no interior. No future principal character was introduced and no hidden mutable story hook was added.

### Worktree preservation and final status

All 20 registered worktrees were rechecked. Every non-Mornay HEAD, status entry and active-operation result matches preflight. No worktree has a merge, rebase, cherry-pick, revert, bisect or sequencer operation in progress. Paths below are relative to the original repository to avoid committing machine-specific absolute paths. The dedicated branch's exact final checkpoint hash is in the delivery response; after that checkpoint its porcelain status is empty.

| Worktree | Branch | HEAD | Porcelain status |
|---|---|---|---|
| `.` | `main` | `fe5992ec4bb647ce6f89554ad409a16a143769ec` | clean |
| `../empire-game-claude` | `agent/claude` | `3758d01beb014d50f918c34a98f20735b9ca4a42` | 65 entries, reproduced below |
| `../empire-game-codex` | `agent/codex` | `fe5992ec4bb647ce6f89554ad409a16a143769ec` | 1 entries, reproduced below |
| `../empire-game-integration` | `integration/eastern-party-foundations` | `3d5413a8b3094070da503c5cb05c0a689b4c92b5` | clean |
| `../empire-game-mornay-population` | `agent/mornay-population` | delivery checkpoint containing this record | clean |
| `.claude/worktrees/bullet-time` | `bullet-time` | `ff43da6bf6161d0dd5a2a5fc89b1b5ff570e2cbf` | clean |
| `.claude/worktrees/canonical-transition` | `canonical-transition` | `190dd83c17720eeb08579f0a5f483cd3ae87cf98` | clean |
| `.claude/worktrees/enemy-id-authority` | `enemy-id-authority` | `a75b700b7f9e685469fbae2ca28b777475b8bee1` | clean |
| `.claude/worktrees/enemy-pool-registry-consumers` | `enemy-pool-registry-consumers` | `a1a43ab559b51f2ff249541fdf2f3fad842d7f06` | clean |
| `.claude/worktrees/mundane-dilemmas` | `mundane-dilemmas` | `e8b624b83032a4ed8354f110669333665e86e801` | clean |
| `.claude/worktrees/post-door-top` | `post-door-top` | `6aa7a828471e844692aff48875fdbf0b5674af76` | clean |
| `.claude/worktrees/regional-content-split` | `regional-content-split` | `318503b4863ed136cad010f5e600039990b9f524` | clean |
| `.claude/worktrees/save-binding-migration` | `worktree-save-binding-migration` | `a949335a0bf5674eedb15789e09c158cae61b91c` | clean |
| `.claude/worktrees/secret-northern-road-seam` | `secret-northern-road-seam` | `d37c360dbe55f852f3ac3edcea16a866a9c648e3` | clean |
| `.claude/worktrees/sluice-easy-top-floor` | `sluice-easy-top-floor` | `507b6965a21b86086d7c796b784c1bf081053f0e` | clean |
| `.claude/worktrees/sluice-top-fix` | `sluice-top-fix` | `42e82da663378c610b2523952e260e43c509fc2c` | clean |
| `.claude/worktrees/small-fixes-2` | `small-fixes-2` | `3b5e22f801dc639ad1df4aa3377a05f83872dd27` | clean |
| `.claude/worktrees/small-fixes-batch` | `small-fixes-batch` | `f98861c7fdfa6c9f5197fe493b3ac5fed9ff2335` | clean |
| `.claude/worktrees/stable-ids-v3` | `stable-ids-v3` | `29607ee4d943277a56c2e919d3ddb53612138e33` | clean |
| `.claude/worktrees/status-cure-contract` | `status-cure-contract` | `6ecccd8536e905f1d4e2ed1335ebc806b31b774d` | 5 entries, reproduced below |

Exact retained porcelain entries for `agent/claude`:

```text
 M ENEMY_CAPABILITY_AUDIT.md
 M OVERWORLD_ATLAS.md
 M combat.js
 M content/maps/eastern-fens-maps.js
 M data.js
 M index.html
 M render-battle.js
 M test/cases/100-east-causeway.test.js
 M test/cases/101-west-outfall-canal-tunnel.test.js
 M test/cases/102-north-basin-drowned-rim.test.js
 M test/cases/103-north-basin-mirewood.test.js
 M test/cases/104-eastern-reaches-abandoned-farmhouse.test.js
 M test/cases/105-small-ui-pickup-and-gold-polish.test.js
 M test/cases/106-thornmere-lighthouse-dual-quests.test.js
 M test/cases/107-thornmere-lighthouse-interior.test.js
 M test/cases/155-formation-four-command-integration.test.js
 M test/cases/161-eastern-fens-route.test.js
 M test/cases/175-eastern-fens-exploration.test.js
 M test/cases/176-eastern-fens-envelope.test.js
 M test/cases/177-eastern-fens-western-pockets.test.js
 M test/cases/178-eastern-fens-nw-open-fen.test.js
 M test/cases/186-enemy-capability-migration.test.js
 M test/cases/188-status-specials-party-combat.test.js
 M test/cases/189-unusual-enemy-capabilities-party-combat.test.js
 M test/cases/191-universal-party-combat-compatibility.test.js
 M test/cases/200-eastern-fens-mornay-encounter-content.test.js
 M test/cases/201-travellers-rise-campsite.test.js
 M test/cases/207-travellers-rise-campfire-night.test.js
 M test/cases/209-eastern-fens-new-terrain-tiles.test.js
 M test/cases/213-eastern-fens-storm-shoals.test.js
 M test/cases/215-eastern-fens-valmere-mornay-peninsula.test.js
 M test/cases/52-stable-persistence-ids.test.js
 M test/cases/58-regional-content-split.test.js
 M test/cases/69-world-view-and-drawmaptiles.test.js
 M test/cases/71-continuous-world-view.test.js
 M test/cases/72-continuous-seams.test.js
 M test/cases/73-continuous-neighbour-content.test.js
 M test/cases/76-geographic-encounters.test.js
 M test/cases/77-map3-fen-seam-pilot.test.js
 M test/cases/78-verdant-vale-legacy-home.test.js
 M test/cases/83-map3n2-northbasin-seam-closure.test.js
 M test/cases/84-canonical-regional-position.test.js
 M test/cases/85-canonical-consumers-part2.test.js
 M test/cases/86-regional-chunk-catalog.test.js
 M test/cases/88-continuous-regional-production-default.test.js
 M test/cases/89-west-outfall-scenery-chunk.test.js
 M test/cases/90-north-basin-open-reservoir.test.js
 M test/cases/91-north-basin-open-reservoir-east.test.js
 M test/cases/92-north-basin-eastern-woods.test.js
 M test/cases/93-north-basin-open-reservoir-far-east.test.js
 M test/cases/94-north-basin-east-shore-reservoir.test.js
 M test/cases/95-north-basin-eastern-road.test.js
 M test/cases/96-eastern-canal-banks.test.js
 M test/cases/97-northern-thornmere-fen.test.js
 M test/cases/98-thornmere-upper-shallows-scenery.test.js
 M test/cases/99-thornmere-canal-head.test.js
 M test/fixtures/regional-grid-fingerprints.js
 M test/transition-audit-output.json
 M world-transitions.js
?? content/maps/eastern-shore-maps.js
?? content/maps/great-fen-maps.js
?? content/maps/southern-moraine-maps.js
?? content/maps/valmere-expanse-maps.js
?? test/cases/218-great-fen-expansion.test.js
?? test/cases/219-valmere-expanse.test.js
```

Exact retained porcelain entries for `agent/codex`:

```text
?? "Art/qa/sera-liora/Sera and Liora between twin beds.png"
```

Exact retained porcelain entries for `status-cure-contract`:

```text
 M interactions.js
 M maps.js
 M npcs.js
 M render-interiors.js
 M test/cases/30-rest-week-inn-and-dayoff-closures.test.js
```

## Refinement grid deltas

Compared with `6f065af`, the following are every changed existing-grid cell, expressed as zero-based (column,row) groups and stable tile IDs. New room grids are authored in `MORNAY_INTERIOR_MAPS`; no regional grid, boundary transition cell or gate return changed. Tile IDs: 18 INTERIOR_FLOOR, 19 INTERIOR_WALL, 33 TABLE; exterior IDs are recorded numerically below.

| Existing map | Old → new tile | Cells (column,row) |
|---|---|---|
| `MORNAY_NORTH_UPPER_WEST_MAP` | 13 → 34 | (11,8) |
| `MORNAY_NORTH_UPPER_EAST_MAP` | 13 → 34 | (3,8) |
| `MORNAY_MIDDLE_UPPER_WEST_MAP` | 13 → 34 | (3,9) |
| `MORNAY_MIDDLE_UPPER_EAST_MAP` | 13 → 34 | (3,9) |
| `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | 13 → 34 | (12,5) |
| `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | 13 → 34 | (3,5) |
| `MORNAY_SOUTH_UPPER_WEST_MAP` | 13 → 34 | (12,10) |
| `MORNAY_SOUTH_UPPER_EAST_MAP` | 13 → 34 | (3,10) |
| `MORNAY_OFFICE_MAP` | 18 → 33 | (1,2), (5,2), (13,2), (3,3), (2,7), (5,7), (10,7), (13,7), (14,10), (3,11) |
| `MORNAY_OFFICE_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (13,3), (2,6), (4,6), (6,6), (9,6), (11,6), (13,6) |
| `MORNAY_INFIRMARY_MAP` | 18 → 33 | (1,2), (2,2), (13,2), (5,3), (1,5), (2,5), (4,5), (5,5), (10,5), (11,5), (13,5), (14,5), (1,9), (5,9), (10,9), (14,9), (14,12) |
| `MORNAY_INFIRMARY_MAP` | 33 → 18 | (2,3), (4,3), (11,3), (13,3), (2,6), (4,6), (11,6), (13,6) |
| `MORNAY_PROVISIONER_MAP` | 18 → 33 | (1,2), (2,2), (11,2), (12,2), (3,4), (4,4), (5,4), (12,6), (13,6), (3,10) |
| `MORNAY_PROVISIONER_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (11,3), (13,3) |
| `MORNAY_APOTHECARY_MAP` | 18 → 33 | (2,2), (12,2), (13,2), (10,4), (11,4), (12,4), (3,6), (13,9), (2,10) |
| `MORNAY_APOTHECARY_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (11,3), (13,3) |
| `MORNAY_WORKGEAR_MAP` | 18 → 33 | (2,2), (5,2), (11,4), (12,4), (3,5), (4,5), (5,5), (12,9), (2,10) |
| `MORNAY_WORKGEAR_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (11,3), (13,3) |
| `MORNAY_CHANDLER_MAP` | 18 → 33 | (2,2), (3,2), (13,2), (10,5), (11,5), (12,5), (3,6), (11,10), (2,11) |
| `MORNAY_CHANDLER_MAP` | 33 → 18 | (2,3), (4,3), (6,3), (9,3), (11,3), (13,3) |
| `MORNAY_GATE_INN_MAP` | 18 → 33 | (1,2), (4,2), (2,4), (3,4), (11,4), (4,7), (3,11) |
| `MORNAY_GATE_INN_MAP` | 33 → 18 | (2,3), (4,3), (11,3), (13,3), (2,9), (4,9), (13,9) |
| `MORNAY_GATE_BEDS_MAP` | 18 → 33 | (7,5), (2,8), (4,8), (11,8), (13,8), (1,11) |
| `MORNAY_GATE_BEDS_MAP` | 33 → 18 | (2,6), (4,6), (11,6), (13,6), (2,9), (4,9), (11,9), (13,9) |
| `MORNAY_COMMERCIAL_INN_MAP` | 18 → 33 | (10,2), (14,2), (3,4), (11,4), (12,4), (12,7), (11,10) |
| `MORNAY_COMMERCIAL_INN_MAP` | 33 → 18 | (2,3), (4,3), (11,3), (13,3), (2,9), (11,9), (13,9) |
| `MORNAY_COMMERCIAL_BEDS_MAP` | 18 → 33 | (5,3), (10,3), (1,6), (5,9), (10,9) |
| `MORNAY_COMMERCIAL_BEDS_MAP` | 33 → 18 | (4,3), (11,3), (2,6), (4,6), (13,6), (4,9), (11,9) |
| `MORNAY_SCHOOL_MAP` | 18 → 33 | (1,2), (13,2), (4,3), (3,6), (10,6), (3,9), (10,9), (13,11) |
| `MORNAY_SCHOOL_MAP` | 33 → 18 | (2,6), (4,6), (9,6), (11,6), (13,6), (2,9), (4,9), (9,9), (11,9), (13,9) |
| `MORNAY_HARBOUR_MAP` | 18 → 33 | (1,2), (13,2), (5,3), (3,7), (10,7), (13,7), (14,10), (3,11) |
| `MORNAY_HARBOUR_MAP` | 33 → 18 | (4,3), (6,3), (9,3), (13,3), (2,6), (4,6), (6,6), (9,6), (11,6), (13,6) |
| `MORNAY_WAREHOUSE_MAP` | 18 → 33 | (1,2), (2,2), (11,2), (12,2), (13,2), (5,3), (12,5), (2,8), (3,8), (12,9), (4,11) |
| `MORNAY_WAREHOUSE_MAP` | 33 → 18 | (2,3), (6,3), (9,3), (11,3), (13,3), (2,9), (4,9), (6,9), (9,9), (13,9) |
| `MORNAY_WORKSHOP_MAP` | 18 → 33 | (1,2), (14,2), (3,3), (4,7), (5,7), (12,8), (2,11), (13,11) |
| `MORNAY_WORKSHOP_MAP` | 33 → 18 | (4,3), (6,3), (9,3), (13,3) |
| `MORNAY_LAUNDRY_MAP` | 18 → 33 | (14,2), (11,4), (3,8), (12,9), (1,11) |
| `MORNAY_LAUNDRY_MAP` | 33 → 18 | (11,3), (13,3), (2,9), (4,9), (11,9), (13,9) |
| `MORNAY_BOARDING_MAP` | 18 → 19 | (1,2), (2,2), (3,2), (4,2), (5,2), (6,2), (7,2), (8,2), (9,2), (10,2), (11,2), (12,2), (13,2), (14,2), (1,3), (3,3), (6,3), (7,3), (8,3), (9,3), (12,3), (14,3) |
| `MORNAY_BOARDING_MAP` | 18 → 33 | (2,7), (3,7), (13,7), (5,9), (10,9) |
| `MORNAY_BOARDING_MAP` | 18 → 34 | (5,3), (10,3) |
| `MORNAY_BOARDING_MAP` | 33 → 18 | (2,6), (4,6), (11,6), (13,6), (2,9), (4,9), (11,9), (13,9) |
| `MORNAY_BOARDING_MAP` | 33 → 19 | (4,3), (11,3) |
| `MORNAY_BOARDING_MAP` | 33 → 34 | (2,3), (13,3) |
| `MORNAY_COURT_MAP` | 18 → 19 | (1,2), (2,2), (3,2), (4,2), (5,2), (6,2), (7,2), (8,2), (9,2), (10,2), (11,2), (12,2), (13,2), (14,2), (1,3), (3,3), (5,3), (6,3), (7,3), (8,3), (9,3), (10,3), (12,3), (14,3), (1,4), (3,4), (4,4), (6,4), (7,4), (8,4), (9,4), (11,4), (12,4), (14,4) |
| `MORNAY_COURT_MAP` | 18 → 33 | (2,8), (11,8), (3,11) |
| `MORNAY_COURT_MAP` | 18 → 34 | (2,4), (5,4), (10,4), (13,4) |
| `MORNAY_COURT_MAP` | 33 → 18 | (2,9), (4,9), (11,9), (13,9) |
| `MORNAY_COURT_MAP` | 33 → 19 | (2,3), (4,3), (11,3), (13,3) |
