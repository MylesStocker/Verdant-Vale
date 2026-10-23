# Mornay Population and Services MVP Plan

## Design and authority

Mornay is a cold, busy, primarily blue-collar freshwater port and county-seat-equivalent town of approximately 8,000 people on Valmere. Seventeen existing exterior maps retain their topology, paired southern gates, shore boundaries and reserved berths. Dense work yards and commercial streets contrast with ordinary southern services and quieter, better-kept northern institutions. There is no aetherrail, capital-city scale or universal hostility.

The prompt, LORE.md, physical maps/runtime registries, architecture.md and PROJECT_STATUS.md govern this plan, in that order. Names, prices and flavour dialogue below are revisable authored content, not immutable metaphysical canon. Cold, stormy water and shallow working shores are represented without resolving the previously deferred depth of the entire Valmere basin.

## Benchmark and target

Drenwick has 99 distinct, non-party humanoid characters available through ordinary gameplay: 9 across six exterior maps and 92 across interiors, with Renn and Veran appearing in both sets (9 + 92 - 2 = 99). The earlier 101 included the position-only travelling vendor and the party/cutscene projection of Esla. Scheduled placements, aliases, repeat placements and combat copies are deduplicated; cats, enemies, debug fixtures, bridge guards outside town and Tarvec approach content are excluded. The three infirmary staff/patient characters encountered during the ordinary MQ4 wake sequence remain included.

This is a comparable town-character count, not a claim that all 99 are permanent residents: eight are explicitly visitors, and domicile is not established for every remaining character. Drenwick comprises six exteriors and 49 logical interiors (12 public rooms, six corridors, 31 residences; some share map grids). The runtime NPC registry, house records and ordinary reachability are the authority, rather than raw placements or sprite counts.

Mornay target: **300 distinct non-party speaking humanoids**, comprising **120 exterior and 180 interior characters** across **17 exterior maps and 17 rooms in 15 establishments**. Ratio: **300 / 99 = 3.0303**. No schedule clones, duplicate placements, party copies, animals or debug fixtures inflate this total. Twelve exterior characters have deterministic patrols; the others are stationary. All 300 speak, so moving/ambient and speaking totals overlap.

## District matrix

NPC density counts below refer to exterior characters. Every street keeps its mandatory central crossing and boundary approach clear; door approaches remain free. Northern one-tile horizontal streets receive no NPC or solid decoration. Props are visual only unless existing tile collision explicitly applies.

| Map ID | Role | Visible buildings / usable doors | Exterior NPCs | Hazards and circulation | Environmental story | Reserved content |
|---|---|---|---:|---|---|---|
| `MORNAY_OLD_FORT_MAP` | Obsolete fort, watch and holding cells | Watch post; locked cells; records shutters. Doors: No usable door | 4 | Clear row 7, columns 7–8, doors and boundary cells | Weathered masonry, patched wall, old watch bench | Fort plot and lookout |
| `MORNAY_NORTH_UPPER_WEST_MAP` | Merchant frontage and commercial lodging | Ledger House; merchant houses. Doors: Ledger House (11,5) | 5 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Kept steps and sheltered benches; swept empty berth | Story ship berth; boarding |
| `MORNAY_NORTH_UPPER_EAST_MAP` | Wealth and examination privilege | Walled Civic Collegium; merchant houses. Doors: No usable door | 5 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Fee notice; tutor demand; clean paving | Collegium inaccessible |
| `MORNAY_NORTH_LOWER_WEST_MAP` | Harbour administration and working quay | Harbour/customs room; net sheds. Doors: Harbour and Customs Public Room (11,5) | 7 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Rope inspection; mutual-aid collection; covered notices | Island ferry berth inactive |
| `MORNAY_NORTH_LOWER_EAST_MAP` | Shipping offices and lake-trade supplies | Venn Chandlery; shipping offices; sailor lodgings. Doors: Venn Chandlery and Secondhand (11,5) | 7 | Clear narrow row 7 and columns 7–8; berth planking unobstructed | Secondhand goods, spare rope, patched sail | No ship departure |
| `MORNAY_MIDDLE_UPPER_WEST_MAP` | Warehousing and transshipment | Fen Warehouse; bonded stores. Doors: Fen Warehouse (3,5) | 9 | Clear row 7, columns 7–8, doors and boundary cells | Scales, sacks, tally disputes, guarded logistics | Locked warehouse annex |
| `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | Provision market and print stalls | Kelm Provisions; market stalls. Doors: Kelm Provisions (3,5) | 11 | Clear row 7, columns 7–8, doors and boundary cells | Fish prices; measures; confiscation notice | Petitions and print disputes inert |
| `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | Regional administration | Regional IJC Office; courier desk; archives. Doors: Regional IJC Office (3,5) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Queues; contractors; fees; redirected responsibility | Operational plot dialogue and sealed archives |
| `MORNAY_MIDDLE_UPPER_EAST_MAP` | Waterworks and survey frontage | Closed hydrographic office; waterworks. Doors: No usable door | 6 | Clear row 7, columns 7–8, doors and boundary cells | Gauge readings, drainage repair, storm marks | Hydrographer and Esla history absent |
| `MORNAY_MIDDLE_LOWER_WEST_MAP` | Freight yards, carts and fen products | Cart sheds; freight stores; smoking sheds. Doors: No usable door | 9 | Clear row 7, columns 7–8, doors and boundary cells | Peat, salt fish barrels, damaged harness | No freight quests |
| `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | Workwear and ordinary commerce | Sorn Work Gear; cobbler and cloth fronts. Doors: Sorn Work Gear (3,5) | 9 | Clear row 7, columns 7–8, doors and boundary cells | Used tools, repairs, oil, patched roofs | Equipment progression deferred |
| `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | Repair crafts and small printing | Rusk Workshop Court; cooper and forge fronts. Doors: Rusk Workshop Court (12,5) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Benches, wheel repair, pasted-over handbills | Printer and organizer hooks inert |
| `MORNAY_MIDDLE_LOWER_EAST_MAP` | Worker housing and washing | Quill Laundry; East Ward Shared Court. Doors: Quill Laundry (3,5), East Ward Shared Court (3,9) | 6 | Clear row 7, columns 7–8, doors and boundary cells | Laundry, shared repairs, mutual aid, suspected meeting facade | Locked back stair; no headquarters |
| `MORNAY_SOUTH_UPPER_WEST_MAP` | Ordinary care and inexpensive housing | Mornay Infirmary; Hume Boardinghouse. Doors: Mornay Infirmary (12,5), Hume Boardinghouse (3,10) | 9 | Clear row 7, columns 7–8, doors and boundary cells | Beds, injured workers, linen, rent, shifts | No new medical or lodging quest |
| `MORNAY_SOUTH_UPPER_EAST_MAP` | Ward services and southern market | South Ward School; Stern Apothecary. Doors: Stern Apothecary (3,5), South Ward School (12,5) | 8 | Clear row 7, columns 7–8, doors and boundary cells | Lunch sellers, remedies, parents, ordinary schooling | No school progression |
| `MORNAY_WEST_GATE_MAP` | Passenger arrivals and cheap lodging | Wold's Gate Inn; watch shelter. Doors: Wold's Gate Inn (3,5) | 4 | Clear row 7, columns 7–8, doors and boundary cells | Porters, handcarts, arrivals and tired travellers | No new overworld links |
| `MORNAY_EAST_GATE_MAP` | Freight arrivals and labour hiring | Hiring board; cart inspection; watch shelter. Doors: No usable door | 5 | Clear row 7, columns 7–8, doors and boundary cells | Loads, wheels, hiring notices and waiting labour | No transport or labour quest |

## Interior and door matrix

Coordinates are zero-based tile columns/rows. Arrival in each room is tile centre (7,13), facing up; the exit at (7,14) returns to the listed source tile centre with the listed facing. Bedroom doors originate in their inn common rooms. North-facing street returns for lower buildings avoid immediate re-entry.

| ID / map | Establishment | Source map | Door | Return / facing | NPCs |
|---|---|---|---|---|---:|
| `mornay_office` / `MORNAY_OFFICE_MAP` | Regional IJC Office | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | 3,5 | 3,6 down | 16 |
| `mornay_infirmary` / `MORNAY_INFIRMARY_MAP` | Mornay Infirmary | `MORNAY_SOUTH_UPPER_WEST_MAP` | 12,5 | 12,6 down | 18 |
| `mornay_provisioner` / `MORNAY_PROVISIONER_MAP` | Kelm Provisions | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | 3,5 | 3,6 down | 8 |
| `mornay_apothecary` / `MORNAY_APOTHECARY_MAP` | Stern Apothecary | `MORNAY_SOUTH_UPPER_EAST_MAP` | 3,5 | 3,6 down | 8 |
| `mornay_workgear` / `MORNAY_WORKGEAR_MAP` | Sorn Work Gear | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | 3,5 | 3,6 down | 8 |
| `mornay_chandler` / `MORNAY_CHANDLER_MAP` | Venn Chandlery and Secondhand | `MORNAY_NORTH_LOWER_EAST_MAP` | 11,5 | 11,6 down | 8 |
| `mornay_gate_inn` / `MORNAY_GATE_INN_MAP` | Wold's Gate Inn | `MORNAY_WEST_GATE_MAP` | 3,5 | 3,6 down | 12 |
| `mornay_gate_beds` / `MORNAY_GATE_BEDS_MAP` | Gate Inn Shared Rooms | `MORNAY_GATE_INN_MAP` | 7,1 | 7,2 down | 8 |
| `mornay_commercial_inn` / `MORNAY_COMMERCIAL_INN_MAP` | Ledger House | `MORNAY_NORTH_UPPER_WEST_MAP` | 11,5 | 11,6 down | 10 |
| `mornay_commercial_beds` / `MORNAY_COMMERCIAL_BEDS_MAP` | Ledger House Rooms | `MORNAY_COMMERCIAL_INN_MAP` | 7,1 | 7,2 down | 8 |
| `mornay_school` / `MORNAY_SCHOOL_MAP` | South Ward School | `MORNAY_SOUTH_UPPER_EAST_MAP` | 12,5 | 12,6 down | 14 |
| `mornay_harbour` / `MORNAY_HARBOUR_MAP` | Harbour and Customs Public Room | `MORNAY_NORTH_LOWER_WEST_MAP` | 11,5 | 11,6 down | 14 |
| `mornay_warehouse` / `MORNAY_WAREHOUSE_MAP` | Fen Warehouse | `MORNAY_MIDDLE_UPPER_WEST_MAP` | 3,5 | 3,6 down | 12 |
| `mornay_workshop` / `MORNAY_WORKSHOP_MAP` | Rusk Workshop Court | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | 12,5 | 12,6 down | 10 |
| `mornay_laundry` / `MORNAY_LAUNDRY_MAP` | Quill Laundry | `MORNAY_MIDDLE_LOWER_EAST_MAP` | 3,5 | 3,6 down | 8 |
| `mornay_boarding` / `MORNAY_BOARDING_MAP` | Hume Boardinghouse | `MORNAY_SOUTH_UPPER_WEST_MAP` | 3,10 | 3,9 up | 8 |
| `mornay_court` / `MORNAY_COURT_MAP` | East Ward Shared Court | `MORNAY_MIDDLE_LOWER_EAST_MAP` | 3,9 | 3,8 up | 10 |

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

Each row is one stable character, one placement and one concise dialogue purpose. Location keys name an exterior map or the interior key above. Roles also define economic/social clusters; the relationships above connect those clusters. Future quest candidates are the nine network characters and selected officials, but every conversation remains repeatable and inert. No purely silent resident is required: “ambient” means incidental street/work/family dialogue rather than a quest.

| Stable ID | Name | Location | Role / cluster | Movement | Revisable dialogue seed |
|---|---|---|---|---|---|
| `mornay_hadrin_moss` | Hadrin Moss | `MORNAY_OLD_FORT_MAP` | watch veteran | Stationary | Mostly I watch the weather now. It remains insubordinate. |
| `mornay_elva_tern` | Elva Tern | `MORNAY_OLD_FORT_MAP` | wall inspector | Stationary | The crack is old. The water getting into it is new. |
| `mornay_perris_dun` | Perris Dun | `MORNAY_OLD_FORT_MAP` | mason | Stationary | Someone fitted these stones before my grandfather had opinions. |
| `mornay_lotte_brin` | Lotte Brin | `MORNAY_OLD_FORT_MAP` | resident sketching | Stationary | People keep posing. I am drawing the wall. |
| `mornay_maelin_rook` | Maelin Rook | `MORNAY_NORTH_UPPER_WEST_MAP` | berth steward | Stationary | An empty berth still needs sweeping. |
| `mornay_corra_pike` | Corra Pike | `MORNAY_NORTH_UPPER_WEST_MAP` | house steward | Stationary | Tradesmen use the side entrance. Leave the bill with me; the household does not discuss accounts at the front step. |
| `mornay_fennel_ashe` | Fennel Ashe | `MORNAY_NORTH_UPPER_WEST_MAP` | gardener | Stationary | The lake wind has very definite ideas about my hedges. |
| `mornay_nesta_vale` | Nesta Vale | `MORNAY_NORTH_UPPER_WEST_MAP` | shipowner's widow | Stationary | The harbour fees keep rising. My tenants seem to think that should come out of my income. |
| `mornay_osric_bell` | Osric Bell | `MORNAY_NORTH_UPPER_WEST_MAP` | retired pilot | Stationary | A fine coat has never improved a vessel's turning circle. |
| `mornay_celda_verne` | Celda Verne | `MORNAY_NORTH_UPPER_EAST_MAP` | household secretary | Stationary | The invitation says noon. My employer means whenever she arrives. |
| `mornay_idris_pell` | Idris Pell | `MORNAY_NORTH_UPPER_EAST_MAP` | Collegium porter | Stationary | Civic Collegium. Upper pupils only. The fees prepare them for the Civic Examination, clerkships and junior service. Visitors require an appointment. You have neither pupil nor appointment with you. |
| `mornay_benna_lark` | Benna Lark | `MORNAY_NORTH_UPPER_EAST_MAP` | Collegium student | Stationary | Our tutor says the Examination rewards preparation. Mother calls that reassuring. She has paid for three years of it. |
| `mornay_tassel_dorn` | Tassel Dorn | `MORNAY_NORTH_UPPER_EAST_MAP` | domestic worker | Stationary | These steps are grander than the kitchen they lead to. |
| `mornay_ulric_dane` | Ulric Dane | `MORNAY_NORTH_UPPER_EAST_MAP` | retired examiner | Stationary | The Examination may be open. An evening without work, a lamp and somebody to correct your answers are less evenly shared. |
| `mornay_dena_mere` | Dena Mere | `MORNAY_NORTH_LOWER_WEST_MAP` | dock representative | Stationary | A missed day's pay reaches the supper table before the explanation. Nessa has kept three crews fed. That does not give anyone the right to speak for every worker here. |
| `mornay_salwen_reed` | Salwen Reed | `MORNAY_NORTH_LOWER_WEST_MAP` | rope inspector | Stationary | Gessa wants this rope condemned. The owner wants another week from it. I have put my name beside hers. |
| `mornay_niva_cole` | Niva Cole | `MORNAY_NORTH_LOWER_WEST_MAP` | fish seller | Stationary | Fresh this morning. I cannot promise freshness in your kitchen tomorrow. |
| `mornay_rulon_hart` | Rulon Hart | `MORNAY_NORTH_LOWER_WEST_MAP` | scow hand | Stationary | The open lake was white yesterday. Lowen says the freight can still arrive tonight. Lowen is staying on shore. |
| `mornay_heba_flint` | Heba Flint | `MORNAY_NORTH_LOWER_WEST_MAP` | net mender | Stationary | Ilven still ties the difficult knots at home. Pay him for them. He needs wages, not people calling him brave. |
| `mornay_davi_fenner` | Davi Fenner | `MORNAY_NORTH_LOWER_WEST_MAP` | child | Stationary | That berth looks ready. Grown-ups say looking ready isn't enough. |
| `mornay_merra_keld` | Merra Keld | `MORNAY_NORTH_LOWER_WEST_MAP` | laundry collector | Patrol | Harbour sheets come back smelling of every harbour except this one. |
| `mornay_jorin_vetch` | Jorin Vetch | `MORNAY_NORTH_LOWER_EAST_MAP` | lodging tout | Stationary | Dry bedding. Quiet depends on who has just been paid. |
| `mornay_alwen_corst` | Alwen Corst | `MORNAY_NORTH_LOWER_EAST_MAP` | customs messenger | Patrol | If the packet were lighter, I would suspect a missing enclosure. |
| `mornay_cessa_brack` | Cessa Brack | `MORNAY_NORTH_LOWER_EAST_MAP` | sailor's spouse | Stationary | He describes every port by the meal he couldn't afford. |
| `mornay_tobin_yarrow` | Tobin Yarrow | `MORNAY_NORTH_LOWER_EAST_MAP` | sail repairer | Stationary | A patch should last longer than the explanation. |
| `mornay_ersa_vole` | Ersa Vole | `MORNAY_NORTH_LOWER_EAST_MAP` | discharged deckhand | Stationary | My legs still expect the street to move. |
| `mornay_lowen_greaves` | Lowen Greaves | `MORNAY_NORTH_LOWER_EAST_MAP` | shipping agent | Stationary | The vessel is punctual. The cargo has other commitments. |
| `mornay_brena_sill` | Brena Sill | `MORNAY_NORTH_LOWER_EAST_MAP` | dockside baker | Stationary | Crew bread is baked firm. Nobody wants crumbs in the rigging. |
| `mornay_bram_fen` | Bram Fen | `MORNAY_MIDDLE_UPPER_WEST_MAP` | warehouse tallyman | Stationary | Varda keeps the signed tally. I keep the count of what actually arrived. No, those are not always the same number. You want a manifest, use the public office. |
| `mornay_gessa_tarn` | Gessa Tarn | `MORNAY_MIDDLE_UPPER_WEST_MAP` | unloading forewoman | Stationary | Hands clear. Set it down together. The hoist was condemned once already; ask Arlis why the contractor signed it back into use. |
| `mornay_halen_wick` | Halen Wick | `MORNAY_MIDDLE_UPPER_WEST_MAP` | barrel roller | Patrol | Round goods still find a way to be difficult. |
| `mornay_ivara_gorse` | Ivara Gorse | `MORNAY_MIDDLE_UPPER_WEST_MAP` | freight customer | Stationary | The harbour wants a warehouse receipt. Varda wants a release from the harbour. My cargo is paying rent while they correspond. |
| `mornay_petren_shaw` | Petren Shaw | `MORNAY_MIDDLE_UPPER_WEST_MAP` | warehouse carpenter | Stationary | A crate is a room built for something that won't thank you. |
| `mornay_dossa_marr` | Dossa Marr | `MORNAY_MIDDLE_UPPER_WEST_MAP` | porter | Stationary | Hands clear. There's no spare set in the stores. |
| `mornay_vannic_hale` | Vannic Hale | `MORNAY_MIDDLE_UPPER_WEST_MAP` | scale keeper | Stationary | The scales are checked every morning. If a clerk wants a lighter weight, he can put that request in writing. |
| `mornay_fenna_orl` | Fenna Orl | `MORNAY_MIDDLE_UPPER_WEST_MAP` | packet runner | Stationary | The red string belongs to the parcel. Nobody told the parcel that. |
| `mornay_hobb_tress` | Hobb Tress | `MORNAY_MIDDLE_UPPER_WEST_MAP` | sack patcher | Stationary | A small hole can employ six people if nobody admits seeing it. |
| `mornay_pella_dorn` | Pella Dorn | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | print seller | Stationary | Recipes, petitions, weather sheets. Edrin knows what I sell. A rival called them Reclaimer instructions and the watch took the lot. They have not returned the recipes either. |
| `mornay_orna_bex` | Orna Bex | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | vegetable seller | Stationary | Bent ones cost less. Bruised ones go to the evening pot. No, you cannot have sound ones at the bruised price. |
| `mornay_micah_wren` | Micah Wren | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | honey dealer | Stationary | Taste is the advertisement. Please leave some advertisement for everyone else. |
| `mornay_sova_kern` | Sova Kern | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | cobbler's runner | Stationary | One boot collected. Apparently the other is still making up its mind. |
| `mornay_evin_rusk` | Evin Rusk | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | market inspector | Stationary | Use the stamped measure. I know the stamp costs money. I also know who sells the replacement stamps. |
| `mornay_talma_noll` | Talma Noll | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | basket seller | Stationary | The handle is supposed to bear the weight. Your arm bears enough. |
| `mornay_ressa_muir` | Ressa Muir | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | shopper | Stationary | I came for onions. The town has made a morning of it. |
| `mornay_dolen_weir` | Dolen Weir | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | street sweeper | Patrol | Keep moving, please. The fish water reaches this gutter before the carts do. |
| `mornay_ansel_crowe` | Ansel Crowe | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | music teacher | Stationary | Practising quietly is still practising. My neighbours remain unconvinced. |
| `mornay_belli_hume` | Belli Hume | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | errand child | Stationary | The change is correct. I counted it before buying nothing. |
| `mornay_carden_firth` | Carden Firth | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | cloth buyer | Stationary | A good weave survives being called unfashionable. |
| `mornay_vessa_auld` | Vessa Auld | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | petition copyist | Stationary | The IJC office takes petitions. The harbour takes cargo complaints. If yours concerns both, write two copies. They will not share one. |
| `mornay_torren_glass` | Torren Glass | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | waiting claimant | Stationary | Arlis sent me to the harbour. Maura sent me back. I have stopped explaining the roof and started asking for names. |
| `mornay_helma_quist` | Helma Quist | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | office cleaner | Stationary | They had the public benches repaired after a visiting official caught his coat. Our stairs have been loose since winter. |
| `mornay_arven_beck` | Arven Beck | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | courier | Patrol | Nobody signs quickly until I have somewhere else to be. |
| `mornay_nerit_wold` | Nerit Wold | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | examination candidate | Stationary | Collegium pupils get practice papers. I borrow them after work. I am not asking anyone to lower the pass mark. |
| `mornay_sella_croft` | Sella Croft | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | licence applicant | Stationary | Corven says my licence needs the old receipt. The old receipt went down with the boat. Apparently that is the boat's responsibility. |
| `mornay_garren_yew` | Garren Yew | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | document carrier | Stationary | The ribbon means untouched, not unimportant. |
| `mornay_edda_purl` | Edda Purl | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | notice reader | Stationary | They have moved the closing time into the smallest sentence. |
| `mornay_varek_linn` | Varek Linn | `MORNAY_MIDDLE_UPPER_EAST_MAP` | waterworks overseer | Stationary | The public hydrographic office is closed. Repairs still have to be measured. Hessa and Ketta do that work in all weathers. |
| `mornay_hessa_dorr` | Hessa Dorr | `MORNAY_MIDDLE_UPPER_EAST_MAP` | survey assistant | Stationary | Keep clear of the survey rod. We are measuring the bank, not taking passengers. Public enquiries are with the harbour office. |
| `mornay_nollis_vane` | Nollis Vane | `MORNAY_MIDDLE_UPPER_EAST_MAP` | drainage worker | Stationary | A blocked channel is everybody's problem just after it becomes mine. |
| `mornay_ketta_roy` | Ketta Roy | `MORNAY_MIDDLE_UPPER_EAST_MAP` | gauge reader | Stationary | A shallow shore can still take a boat apart. A crew blamed an unseen shoal; another blamed a rotten sounding line. I have only the readings. |
| `mornay_ossa_fenwick` | Ossa Fenwick | `MORNAY_MIDDLE_UPPER_EAST_MAP` | pipe fitter | Stationary | The contract covers the pipe. Excavating to reach the pipe is apparently a separate contract. I am waiting for a signature. |
| `mornay_derren_kest` | Derren Kest | `MORNAY_MIDDLE_UPPER_EAST_MAP` | water carrier | Patrol | It gets heavier between the pump and the upstairs landing. |
| `mornay_berrit_fane` | Berrit Fane | `MORNAY_MIDDLE_LOWER_WEST_MAP` | cart-yard foreman | Stationary | Hiring is at the East Gate. I need two sober hands tomorrow, if the freight clears. Do not pay a middleman to hear that. |
| `mornay_helven_moss` | Helven Moss | `MORNAY_MIDDLE_LOWER_WEST_MAP` | carter | Stationary | A wheel only squeaks when someone important is listening. |
| `mornay_iset_brill` | Iset Brill | `MORNAY_MIDDLE_LOWER_WEST_MAP` | peat seller | Stationary | Peat for the smokers, reed bundles for packing. Keep both dry. We earn little enough before half the load turns to water. |
| `mornay_jessa_fallow` | Jessa Fallow | `MORNAY_MIDDLE_LOWER_WEST_MAP` | harness maker | Stationary | Leather remembers being neglected. |
| `mornay_rurik_dean` | Rurik Dean | `MORNAY_MIDDLE_LOWER_WEST_MAP` | teamster | Stationary | The mule has identified every shortcut I would regret. |
| `mornay_vela_thorne` | Vela Thorne | `MORNAY_MIDDLE_LOWER_WEST_MAP` | freight cook | Stationary | A bowl for Kelda too. Her injury happened in this yard; the yard can feed her while they argue about wages. |
| `mornay_dennet_vale` | Dennet Vale | `MORNAY_MIDDLE_LOWER_WEST_MAP` | stores checker | Stationary | The label says fragile. So does the man who dropped it. |
| `mornay_mora_wist` | Mora Wist | `MORNAY_MIDDLE_LOWER_WEST_MAP` | yard messenger | Patrol | I know the fastest route. It contains three people who need me. |
| `mornay_kelda_frey` | Kelda Frey | `MORNAY_MIDDLE_LOWER_WEST_MAP` | injured porter | Stationary | The foreman remembers the fall. The contractor remembers employing someone else. Yara says the ankle will take time. |
| `mornay_adra_kelm` | Adra Kelm | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | provisioner's assistant | Stationary | Neris is in the market shop. Yara needs the plain jars kept aside for the infirmary. Everyone else can manage with a different lid. |
| `mornay_henric_sorn` | Henric Sorn | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | workgear hawker | Stationary | Good gloves are cheaper than learning how much you need fingers. |
| `mornay_malva_teel` | Malva Teel | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | secondhand bookseller | Stationary | Someone underlined every useful passage and several arguments. |
| `mornay_iven_bellows` | Iven Bellows | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | knife sharpener | Stationary | Sharp tools ask less force. They still ask attention. |
| `mornay_essie_rann` | Essie Rann | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | seamstress | Stationary | Try lifting your arms before declaring it a perfect fit. |
| `mornay_pelren_oxley` | Pelren Oxley | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | customer | Stationary | The cheaper coat is only cheaper if winter agrees. |
| `mornay_theda_wark` | Theda Wark | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | lamp oil carrier | Patrol | No, it is not perfume. Stand farther away and hope. |
| `mornay_corlen_brume` | Corlen Brume | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | sign painter | Stationary | They requested larger letters and a smaller price. |
| `mornay_nella_gant` | Nella Gant | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | shop sweeper | Stationary | People wipe their feet while entering. Leaving seems to inspire trust. |
| `mornay_tavi_rusk` | Tavi Rusk | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | compositor | Stationary | My uncle prints what he is paid to print. Do not put my words in his mouth. If you want work copied, ask at the front bench. |
| `mornay_dalen_hesk` | Dalen Hesk | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | cooper | Stationary | A barrel must agree with itself all the way round. |
| `mornay_savra_linnet` | Savra Linnet | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | forge striker | Stationary | I count the blows. That is why we still have a rhythm. |
| `mornay_orenna_flint` | Orenna Flint | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | potter | Stationary | A handle is a promise made to a stranger's fingers. |
| `mornay_breck_yarrow` | Breck Yarrow | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | carpenter apprentice | Stationary | They give repair work to boys when the lake trade slows. Master stays until I finish. He says replacing fingers ruins the saving. |
| `mornay_ilma_dace` | Ilma Dace | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | dyer | Stationary | This stain is professional. The other one is lunch. |
| `mornay_korrin_ashe` | Korrin Ashe | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | workshop runner | Patrol | Everybody's urgent parcel is waiting for somebody else's. |
| `mornay_verda_pike` | Verda Pike | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | furniture repairer | Stationary | Old chairs sag where people felt safest. |
| `mornay_ysol_reed` | Ysol Reed | `MORNAY_MIDDLE_LOWER_EAST_MAP` | grandmother | Stationary | Children grow taller while you are looking for their other sock. |
| `mornay_tessa_glyn` | Tessa Glyn | `MORNAY_MIDDLE_LOWER_EAST_MAP` | home seamworker | Stationary | The baby sleeps whenever the needle breaks. |
| `mornay_loric_mallow` | Loric Mallow | `MORNAY_MIDDLE_LOWER_EAST_MAP` | kettle repairer | Stationary | A dent is character. A hole requires my attention. |
| `mornay_enna_quist` | Enna Quist | `MORNAY_MIDDLE_LOWER_EAST_MAP` | tenant | Stationary | The upstairs family is moving one chair. It has taken all morning. |
| `mornay_ferin_wold` | Ferin Wold | `MORNAY_MIDDLE_LOWER_EAST_MAP` | pupil | Stationary | I can spell warehouse. I would rather draw one. |
| `mornay_bessa_marrin` | Bessa Marrin | `MORNAY_MIDDLE_LOWER_EAST_MAP` | yard gardener | Stationary | We agreed to share the herbs. We are discussing what share means. |
| `mornay_sima_wold` | Sima Wold | `MORNAY_SOUTH_UPPER_WEST_MAP` | inn proprietor on errands | Stationary | Rella keeps the inn running. People leave letters there for neighbours who cannot safely receive them at work. A closed envelope is still closed when an officer holds it. |
| `mornay_gerris_cove` | Gerris Cove | `MORNAY_SOUTH_UPPER_WEST_MAP` | itinerant repairer | Stationary | Every town has one stubborn clock and twelve owners. |
| `mornay_rona_kett` | Rona Kett | `MORNAY_SOUTH_UPPER_WEST_MAP` | bread carrier | Stationary | The warm loaves go first. I carry the disappointment home. |
| `mornay_hollis_pate` | Hollis Pate | `MORNAY_SOUTH_UPPER_WEST_MAP` | retired cook | Stationary | An inn's reputation is mostly its clean water. |
| `mornay_tilda_mere` | Tilda Mere | `MORNAY_SOUTH_UPPER_WEST_MAP` | dockworker's sister | Stationary | Dena remembers everyone's wages and forgets her own lunch. |
| `mornay_vennel_saye` | Vennel Saye | `MORNAY_SOUTH_UPPER_WEST_MAP` | clerk's parent | Stationary | Edrin's handwriting improved when he stopped writing to us. |
| `mornay_kessa_tern` | Kessa Tern | `MORNAY_SOUTH_UPPER_WEST_MAP` | boardinghouse maid | Stationary | I can carry linen or answer directions. Usually I am asked for both. |
| `mornay_orvin_clay` | Orvin Clay | `MORNAY_SOUTH_UPPER_WEST_MAP` | furniture mover | Stationary | It came through that door once. This comforts nobody. |
| `mornay_jalda_firth` | Jalda Firth | `MORNAY_SOUTH_UPPER_WEST_MAP` | travelling aunt | Stationary | My nephew has grown respectable. I preferred receiving interesting letters. |
| `mornay_fenric_dorr` | Fenric Dorr | `MORNAY_SOUTH_UPPER_EAST_MAP` | road guide | Stationary | Ask how the road is today. Old advice can get very wet. |
| `mornay_selma_greaves` | Selma Greaves | `MORNAY_SOUTH_UPPER_EAST_MAP` | lunch seller | Patrol | Eat sitting down. Walking is already taking its share. |
| `mornay_torva_dale` | Torva Dale | `MORNAY_SOUTH_UPPER_EAST_MAP` | pack repairer | Stationary | The strap failed where you kept telling yourself it would hold. |
| `mornay_ilda_stern` | Ilda Stern | `MORNAY_SOUTH_UPPER_EAST_MAP` | traveller | Stationary | I packed for every weather and forgot comfortable shoes. |
| `mornay_brannic_hume` | Brannic Hume | `MORNAY_SOUTH_UPPER_EAST_MAP` | wagon guard | Stationary | My employer calls waiting vigilance when he has to pay for it. |
| `mornay_melli_voss` | Melli Voss | `MORNAY_SOUTH_UPPER_EAST_MAP` | market child | Stationary | That man sells maps. I think he is lost. |
| `mornay_oswen_lark` | Oswen Lark | `MORNAY_SOUTH_UPPER_EAST_MAP` | letter writer | Stationary | You may miss someone without making every sentence sorrowful. |
| `mornay_delra_tress` | Delra Tress | `MORNAY_SOUTH_UPPER_EAST_MAP` | jug seller | Stationary | Hold the base as well. That advice comes free. |
| `mornay_jessa_nair` | Jessa Nair | `MORNAY_WEST_GATE_MAP` | watch sergeant | Stationary | Keep the gateway clear. We have orders to ask about Reclaimer printers. A labour complaint is not an answer to that question, whatever some employers tell us. |
| `mornay_anric_fell` | Anric Fell | `MORNAY_WEST_GATE_MAP` | watch constable | Stationary | Directions cost nothing. Please stop offering me coins. |
| `mornay_porrin_beck` | Porrin Beck | `MORNAY_WEST_GATE_MAP` | road porter | Patrol | The bag has arrived. Its owner is negotiating with his knees. |
| `mornay_vilda_thorn` | Vilda Thorn | `MORNAY_WEST_GATE_MAP` | returning resident | Stationary | The town smells different after a week away. By supper it won't. |
| `mornay_dalven_rill` | Dalven Rill | `MORNAY_EAST_GATE_MAP` | freight watch | Stationary | Declare the load before unloading. If someone offers to lose the excise copy for a fee, remember whose hand took the money. |
| `mornay_meret_shaw` | Meret Shaw | `MORNAY_EAST_GATE_MAP` | wagon checker | Stationary | A loose wheel is not a local administrative custom. |
| `mornay_varen_noll` | Varen Noll | `MORNAY_EAST_GATE_MAP` | delivery driver | Patrol | The address says near the big building. I admire its confidence. |
| `mornay_hilda_vane` | Hilda Vane | `MORNAY_EAST_GATE_MAP` | animal minder | Stationary | Let him smell your hand. He has had a day of strangers. |
| `mornay_cressa_mote` | Cressa Mote | `MORNAY_EAST_GATE_MAP` | exhausted traveller | Stationary | I shall appreciate the architecture after finding a chair. |
| `mornay_marit_voss` | Marit Voss | `office` | senior officer | Stationary | Reclaimer sheets have reached three wards. We want evidence of offences, not a list of people your employer dislikes. Harbour matters still go to Saye. I will not sign for his department. |
| `mornay_inessa_cray` | Inessa Cray | `office` | reception clerk | Stationary | Imperial credentials? Regional enquiries begin here. A credential does not make the responsible desk available. State the office you need. |
| `mornay_halden_quill` | Halden Quill | `office` | records supervisor | Stationary | A missing file requires the number on its cover. I understand why that is difficult. I am not authorized to change the requirement. |
| `mornay_bera_senn` | Bera Senn | `office` | payments clerk | Stationary | The fee is posted. The contractor's handling charge is separate. No, this office does not issue a receipt for his portion. |
| `mornay_eldric_fane` | Eldric Fane | `office` | requisitions clerk | Stationary | The quay repairs have been referred to a private contractor. Completion is now his responsibility. Payment authorization remains ours. |
| `mornay_novra_dain` | Novra Dain | `office` | registration administrator | Stationary | A child without a record still needs a school place. Oren sends them over with a neighbour who can speak for the family. We do what the forms permit. |
| `mornay_coris_wren` | Coris Wren | `office` | archive assistant | Stationary | Dry hands, please. The damp has already made its amendments. |
| `mornay_lenva_purl` | Lenva Purl | `office` | appointment clerk | Stationary | A forwarding letter is not an appointment. You may wait for one, but please leave the seats nearest the door for scheduled visitors. |
| `mornay_torben_clay` | Torben Clay | `office` | building porter | Stationary | That door sticks. Please blame the door before the Empire. |
| `mornay_messa_yule` | Messa Yule | `office` | copy clerk | Stationary | I copied the contractor's complaint twice. Both copies call the same dismissed porter a different kind of threat. |
| `mornay_arlis_rook` | Arlis Rook | `office` | infrastructure liaison | Stationary | The hoist certificate is a contractor matter. If Gessa contests it, she must provide another inspection. This desk cannot suspend an authorized contract on hearsay. |
| `mornay_wenda_flax` | Wenda Flax | `office` | payroll petitioner | Stationary | I am owed three weeks. Bera says the signature is missing. My replacement was paid before the ink dried. |
| `mornay_corven_dace` | Corven Dace | `office` | licence officer | Stationary | The rule is awkward. Ignoring it would make your licence useless. |
| `mornay_helis_tarn` | Helis Tarn | `office` | archive conservator | Stationary | Dust is patient. We have adopted the same strategy. |
| `mornay_nerin_gant` | Nerin Gant | `office` | junior examiner | Stationary | They teach Mera Dren as proof that a petition works. They spend less time on the neighbours who helped her make one. |
| `mornay_vessa_lund` | Vessa Lund | `office` | public assistant | Stationary | Tell me in the words you have. We will start there. |
| `mornay_yara_kelm` | Yara Kelm | `infirmary` | senior nurse | Stationary | Rest is treatment. Nessa brings clean linen when the stores run short; I do not ask whose meetings she attends. No one gets to use a patient's bed as a political favour. |
| `mornay_selven_orr` | Selven Orr | `infirmary` | physician | Stationary | We clean, bind and watch the wound. The ward charges one gold for each point of health restored. You may pay for what you can afford. Tell me who needs care. |
| `mornay_hanne_brist` | Hanne Brist | `infirmary` | infirmary steward | Stationary | Clean bedding is a medical supply. We have eight beds in this ward and more calls than hands. Keep the passage free. |
| `mornay_elrin_vey` | Elrin Vey | `infirmary` | registered Bloommarked healer | Stationary | I am the registered Bloommarked healer. Resonance can support damaged tissue; it cannot replace a clean wound, food or sleep. Selven directs the care. I cannot mend a working life in an afternoon. |
| `mornay_jonna_mire` | Jonna Mire | `infirmary` | dispenser | Stationary | Melva sends the labelled stock. Do not take a bedside jar because it looks like the one you use at home. |
| `mornay_padris_kett` | Padris Kett | `infirmary` | orderly | Stationary | Slowly. The bed will still be there when we reach it. |
| `mornay_lessa_fern` | Lessa Fern | `infirmary` | trainee nurse | Stationary | I know the answer. My hands are taking longer to learn. |
| `mornay_nevin_brack` | Nevin Brack | `infirmary` | patient with crushed foot | Stationary | The hoist slipped. Gessa stopped the shift; the owner says she overreacted. I would like him to stand on this foot before deciding. |
| `mornay_elma_pike` | Elma Pike | `infirmary` | patient's partner | Stationary | He says he needs nothing. He has eaten everything I brought. |
| `mornay_dorran_bale` | Dorran Bale | `infirmary` | recovering boat hand | Stationary | Something struck us on the fen road. I did not see enough to give it a name. The nurse needs the wound cleaned, not another story about it. |
| `mornay_mirren_ashe` | Mirren Ashe | `infirmary` | exhausted caregiver | Stationary | I sat down for a moment. It appears to have become an hour. |
| `mornay_vela_rinn` | Vela Rinn | `infirmary` | cook | Stationary | Convalescent broth is not punishment. I wish people would taste it first. |
| `mornay_jessin_corst` | Jessin Corst | `infirmary` | linen orderly | Stationary | The clean stack stays clean if visitors stop leaning on it. |
| `mornay_teren_lume` | Teren Lume | `infirmary` | night nurse | Stationary | More road injuries this month. More lifting injuries too. We record both; counting only the frightening ones would leave half the beds unexplained. |
| `mornay_orla_nair` | Orla Nair | `infirmary` | watch constable visiting colleague | Stationary | She complains properly now. That is an improvement. |
| `mornay_fressa_dean` | Fressa Dean | `infirmary` | discharged patient | Stationary | They say I can go home. Home has considerably more stairs. |
| `mornay_pelda_hesk` | Pelda Hesk | `infirmary` | patient's mother | Stationary | I brought his good shirt. I needed something useful to carry. |
| `mornay_vanis_teal` | Vanis Teal | `infirmary` | infirmary accountant | Stationary | The ordinary ward accounts for nearly all our work. The resonance allocation is limited. People hear the healer's title and imagine we have no other expenses. |
| `mornay_neris_kelm` | Neris Kelm | `provisioner` | provisioner | Stationary | Potion or bait? Prices are marked. Yara's infirmary order is already set aside; the counter stock is for anyone with the coin. |
| `mornay_eldra_fenn` | Eldra Fenn | `provisioner` | stockkeeper | Stationary | Front shelf first. Older goods deserve their turn. |
| `mornay_pavin_marr` | Pavin Marr | `provisioner` | counter assistant | Stationary | If you need the small measure, ask for the small measure. |
| `mornay_linna_bexley` | Linna Bexley | `provisioner` | household shopper | Stationary | Three mouths have become four opinions about supper. |
| `mornay_heddin_wist` | Heddin Wist | `provisioner` | travelling labourer | Stationary | Enough for tomorrow. Tomorrow's work can pay for the day after. |
| `mornay_toria_brume` | Toria Brume | `provisioner` | provision packer | Stationary | Paper outside the jar, please. It does little good inside. |
| `mornay_keven_muir` | Keven Muir | `provisioner` | kitchen buyer | Stationary | We budgeted for onions before everyone remembered liking them. |
| `mornay_yenna_vetch` | Yenna Vetch | `provisioner` | neighbour collecting order | Stationary | Neris puts the heavy things together. My arms object to this efficiency. |
| `mornay_melva_stern` | Melva Stern | `apothecary` | apothecary | Stationary | Tell me what you need before choosing a jar. More medicine is not always better medicine. The marked price includes the bottle. |
| `mornay_arret_cole` | Arret Cole | `apothecary` | apprentice | Stationary | The plain jars are labelled too. Especially the plain jars. |
| `mornay_vessa_gorse` | Vessa Gorse | `apothecary` | herb sorter | Stationary | Dried does not mean indistinguishable. |
| `mornay_nerrin_hale` | Nerrin Hale | `apothecary` | sleepless customer | Stationary | I sleep very well just before I must get up. |
| `mornay_orel_quist` | Orel Quist | `apothecary` | medicine courier | Stationary | She packed the glass separately. I wish roads did the same. |
| `mornay_thelin_vole` | Thelin Vole | `apothecary` | carpenter buying salve | Stationary | I wore gloves all week except the moment that mattered. |
| `mornay_rissa_yew` | Rissa Yew | `apothecary` | caregiver | Stationary | My mother trusts anything that tastes unpleasant. A troublesome standard. |
| `mornay_dannet_pate` | Dannet Pate | `apothecary` | bottle washer | Stationary | Clear glass is honest about how much work remains. |
| `mornay_hesta_sorn` | Hesta Sorn | `workgear` | workgear keeper | Stationary | Working knives, road arms and gear we can repair. Try both boots. Your employer's promise to replace them is not payment. |
| `mornay_morren_flint` | Morren Flint | `workgear` | fitter | Stationary | A belt should hold your gear, not remind you of every meal. |
| `mornay_isa_marrin` | Isa Marrin | `workgear` | leatherworker | Stationary | I repair the seam before polishing the story. |
| `mornay_fenris_roy` | Fenris Roy | `workgear` | dock recruit | Stationary | They told me what to buy. Then everyone disagreed. |
| `mornay_galda_thorn` | Galda Thorn | `workgear` | survey worker | Stationary | Mud takes the shine off fine purchases very democratically. |
| `mornay_perren_croft` | Perren Croft | `workgear` | repair customer | Stationary | They lasted three seasons. I came to complain and bought the same pair. |
| `mornay_lorna_wark` | Lorna Wark | `workgear` | counter assistant | Stationary | Sizes are on the shelf edge, not the shelf you wish were yours. |
| `mornay_dessin_bellows` | Dessin Bellows | `workgear` | pack stitcher | Stationary | A good repair should become boring immediately. |
| `mornay_hal_venn` | Hal Venn | `chandler` | chandler and secondhand dealer | Stationary | We sell outright and buy outright. Jarven keeps the public book. I will not name a seller because someone in a good coat asks. The object is what I value. |
| `mornay_elsra_firth` | Elsra Firth | `chandler` | chandler's assistant | Stationary | Lamp wicks here. Rope there. Both burn if you are sufficiently careless. |
| `mornay_jarven_clay` | Jarven Clay | `chandler` | secondhand clerk | Stationary | No pledges for later redemption. An outright sale at the usual secondhand rate. Keep anything you cannot afford to lose. |
| `mornay_nessa_corst` | Nessa Corst | `chandler` | sailor buying tools | Stationary | I sold my tools when the crew was laid off. They are not on the shelf now. These will have to earn their price too. |
| `mornay_veldin_greaves` | Veldin Greaves | `chandler` | mate buying supplies | Stationary | The captain remembers oil once the lamps go out. |
| `mornay_brissa_tern` | Brissa Tern | `chandler` | resident selling plate | Stationary | It was never useful on the wall. Let it be useful somewhere. |
| `mornay_otrin_dain` | Otrin Dain | `chandler` | repairer examining purchase | Stationary | Whoever repaired this before me had faith instead of screws. |
| `mornay_fennra_rill` | Fennra Rill | `chandler` | candle maker | Stationary | Even light requires somebody trimming the ends. |
| `mornay_rella_wold` | Rella Wold | `gate_inn` | gate innkeeper and cook | Stationary | Sima is on errands. Thirty gold for the party to rest. Shared rooms upstairs; keep your boots off the blankets. |
| `mornay_benric_cove` | Benric Cove | `gate_inn` | serving worker | Stationary | I remember the table. Remind me which hungry person belongs to it. |
| `mornay_delsa_quill` | Delsa Quill | `gate_inn` | card player | Stationary | The collection paid for food, not revenge. Some young fool proposed breaking a contractor's windows. Whose wages would replace the glass? |
| `mornay_torva_brin` | Torva Brin | `gate_inn` | merchant's clerk | Stationary | My employer has rented a room for himself and a chair for the accounts. |
| `mornay_issen_dorr` | Issen Dorr | `gate_inn` | roads worker | Stationary | A hot meal improves my report on the road considerably. |
| `mornay_pelda_wren` | Pelda Wren | `gate_inn` | traveller | Stationary | I asked for somewhere ordinary. It is wonderfully ordinary. |
| `mornay_orven_lume` | Orven Lume | `gate_inn` | potter visiting market | Stationary | I travel with empty baskets and return without having seen the town. |
| `mornay_hessa_vane` | Hessa Vane | `gate_inn` | local regular | Stationary | That corner gets the least draught. We have established this through sacrifice. |
| `mornay_vannic_nair` | Vannic Nair | `gate_inn` | off-duty watch | Stationary | Off duty. If somebody calls the washer a Reclaimer again, they can make the complaint in writing tomorrow. Tonight she is bringing clean linen. |
| `mornay_senric_teel` | Senric Teel | `gate_inn` | kitchen boy | Stationary | You can tell clean plates by how much heavier they become. |
| `mornay_marla_fallow` | Marla Fallow | `gate_inn` | itinerant singer | Stationary | A roomful of talk makes an excellent excuse for forgetting a verse. |
| `mornay_elva_brack` | Elva Brack | `gate_inn` | sailor's mother | Stationary | He sends money. I would occasionally prefer a spelling mistake. |
| `mornay_farren_moss` | Farren Moss | `gate_beds` | travelling clerk | Stationary | The man below me snores in remarkably official intervals. |
| `mornay_idda_fane` | Idda Fane | `gate_beds` | farm visitor | Stationary | At home the dark is quiet. Here it keeps clearing its throat. |
| `mornay_ossen_mote` | Ossen Mote | `gate_beds` | seasonal labourer | Stationary | My bed is the one with everything I own underneath. |
| `mornay_velra_hume` | Velra Hume | `gate_beds` | visiting seamworker | Stationary | I brought a spare dress and have mended everybody else's. |
| `mornay_jalin_reed` | Jalin Reed | `gate_beds` | pack trader | Stationary | I counted my stock twice. Now I cannot remember counting my shirts. |
| `mornay_nesset_yarrow` | Nesset Yarrow | `gate_beds` | boat passenger | Stationary | Dry socks have changed my opinion of the entire journey. |
| `mornay_brelna_ashe` | Brelna Ashe | `gate_beds` | student applicant | Stationary | I rehearsed my introduction. Nobody has asked for it. |
| `mornay_corra_purl` | Corra Purl | `gate_beds` | housekeeper | Stationary | A shared room still contains private belongings. Kindly remember that. |
| `mornay_gerta_vell` | Gerta Vell | `commercial_inn` | commercial innkeeper | Stationary | Forty gold for the party to rest at the Ledger House. Quiet rooms upstairs. We have commercial guests who need their sleep. |
| `mornay_odrin_vale` | Odrin Vale | `commercial_inn` | cook | Stationary | I can feed a boatload. I cannot make them agree on seasoning. |
| `mornay_lessa_crowe` | Lessa Crowe | `commercial_inn` | server | Stationary | Raise a hand for service. Shouting raises only my expectations. |
| `mornay_harnet_brill` | Harnet Brill | `commercial_inn` | lake skipper | Stationary | The near shore looked harmless. Beyond the headland we spent an hour with water over the bow. Tell that to anyone promising you an easy lake crossing. |
| `mornay_nessa_wren` | Nessa Wren | `commercial_inn` | deckhand | Stationary | A shore chair ought to be easier to balance on. |
| `mornay_elda_wick` | Elda Wick | `commercial_inn` | sailmaker | Stationary | Three crews asked for sail repairs on credit. I can trust a crew and still need to buy thread. |
| `mornay_corvinna_dale` | Corvinna Dale | `commercial_inn` | cargo passenger | Stationary | I bought passage, not an apprenticeship in keeping out of the way. |
| `mornay_pelren_sill` | Pelren Sill | `commercial_inn` | crew cook | Stationary | Eating another person's cooking is my entire leave. |
| `mornay_vessa_kest` | Vessa Kest | `commercial_inn` | local musician | Stationary | Sailors request the songs that make other sailors interrupt. |
| `mornay_talric_gant` | Talric Gant | `commercial_inn` | off-duty shipping clerk | Stationary | I have put the ledger away. Please do not describe your cargo. |
| `mornay_jorra_vey` | Jorra Vey | `commercial_beds` | boatswain | Stationary | Wake me for departure. Leave improvements to the world until afterward. |
| `mornay_merdin_shaw` | Merdin Shaw | `commercial_beds` | deckhand | Stationary | We practise tying knots. My wages still untie themselves. |
| `mornay_sella_dace` | Sella Dace | `commercial_beds` | navigator's assistant | Stationary | I check the chart before sleep. The shore does not need checking. |
| `mornay_verren_noll` | Verren Noll | `commercial_beds` | lake crewman | Stationary | My daughter thinks every parcel comes straight from the boat. |
| `mornay_brinna_beck` | Brinna Beck | `commercial_beds` | freighter's mate | Stationary | A room without cargo feels wasteful until I lie down. |
| `mornay_hessa_rann` | Hessa Rann | `commercial_beds` | rope worker travelling home | Stationary | I have carried that present through three ports. It is now slightly less square. |
| `mornay_torren_linn` | Torren Linn | `commercial_beds` | cabin attendant | Stationary | On shore I can finally clean a floor that stays level. |
| `mornay_elsven_pike` | Elsven Pike | `commercial_beds` | crew member writing home | Stationary | I say the weather was fine. They worry less about weather. |
| `mornay_oren_teal` | Oren Teal | `school` | headteacher | Stationary | The Empire teaches a child to petition, then charges the parent to have the words copied. I understand why the Reclaimers find listeners. I will not have children carrying their messages. |
| `mornay_nelda_quill` | Nelda Quill | `school` | school administrator | Stationary | Nessa sends clean aprons when a family cannot. We record aprons, not reasons. Oren says a child should not inherit a neighbour's accusation. |
| `mornay_hadria_beck` | Hadria Beck | `school` | arithmetic teacher | Stationary | They understand shares immediately when the subject is lunch. |
| `mornay_serren_crowe` | Serren Crowe | `school` | reading teacher | Stationary | Sound it out. A difficult word is not an accusation. |
| `mornay_tessa_orr` | Tessa Orr | `school` | classroom helper | Stationary | One pencil dropped. Thirty scholars have discovered it. |
| `mornay_perrin_mere` | Perrin Mere | `school` | pupil | Stationary | Aunt Dena says counting your pay is arithmetic you should practise. |
| `mornay_vella_corst` | Vella Corst | `school` | pupil | Stationary | My father says his boat is important. I drew it slightly too large. |
| `mornay_ivenna_sorn` | Ivenna Sorn | `school` | pupil | Stationary | I put the answer on the wrong line. It was a very good answer. |
| `mornay_dorrie_firth` | Dorrie Firth | `school` | pupil | Stationary | We are writing about home. Mine has the best window. |
| `mornay_helren_pate` | Helren Pate | `school` | pupil | Stationary | The map fits on paper. Walking it seems unfair. |
| `mornay_maris_glyn` | Maris Glyn | `school` | pupil | Stationary | I read to my little brother. He insists the pictures are corrections. |
| `mornay_bessa_rook` | Bessa Rook | `school` | parent | Stationary | We can manage the ward school. The Collegium wants fees and preparation. My daughter asks what happens if she is clever enough but we are not rich enough. |
| `mornay_ellin_hesk` | Ellin Hesk | `school` | caretaker | Stationary | Small boots bring in a tremendous amount of town. |
| `mornay_verra_moss` | Verra Moss | `school` | adult learner | Stationary | I can read the notice myself now. I still dislike what it says. |
| `mornay_edrin_saye` | Edrin Saye | `harbour` | customs assessor | Stationary | The Reclaimers use real grievances. That does not make every unlisted crate harmless. If Voss wants a cargo inquiry, she can send a signed request. We will not own her speculation. |
| `mornay_maura_dell` | Maura Dell | `harbour` | harbour administrator | Stationary | Berth allocation here. Excise with Saye. Unsafe shore works with Arlis at the IJC office. Please do not bring their unanswered forms back to my counter. |
| `mornay_hassel_muir` | Hassel Muir | `harbour` | manifest clerk | Stationary | Use the same cargo name on both copies. Poetry delays clearance. |
| `mornay_vessa_fenn` | Vessa Fenn | `harbour` | fee clerk | Stationary | Small consignments pay the minimum charge. Large ones spread it across more cargo. I did not write the schedule and cannot waive it. |
| `mornay_orris_teel` | Orris Teel | `harbour` | berth scheduler | Stationary | Two captains have requested the same empty water. |
| `mornay_dalen_wist` | Dalen Wist | `harbour` | inspection officer | Stationary | The fee is for an inspection, not for finding something wrong. Some of my colleagues seem to need reminding. |
| `mornay_berra_yule` | Berra Yule | `harbour` | customs copyist | Stationary | The correction needs initials, not an account of your disappointment. |
| `mornay_neven_brume` | Neven Brume | `harbour` | harbour messenger | Stationary | The answer reached the quay just after the question sailed. |
| `mornay_tilda_vole` | Tilda Vole | `harbour` | waiting agent | Stationary | My client considers waiting part of my fee, somehow. |
| `mornay_harnis_roy` | Harnis Roy | `harbour` | barge master | Stationary | I paid a broker for quick clearance. He knew which clerk was away before the harbour did. I am beginning to understand what I bought. |
| `mornay_elna_stern` | Elna Stern | `harbour` | small trader | Stationary | The fee is smaller for a large shipment. A useful discovery for large people. |
| `mornay_corren_wark` | Corren Wark | `harbour` | archive clerk | Stationary | Old manifests are dull until somebody urgently needs one. |
| `mornay_delsin_orl` | Delsin Orl | `harbour` | inspection assistant | Stationary | I count the boxes. Guessing is apparently a senior privilege. |
| `mornay_rissa_dane` | Rissa Dane | `harbour` | vessel owner | Stationary | I paid for a better hull. Water has yet to congratulate me. |
| `mornay_varda_fen` | Varda Fen | `warehouse` | warehouse supervisor | Stationary | Bram catches missing sacks. I catch the arguments. The bonded annex is locked. Work in the public store does not authorize you beyond that door. |
| `mornay_helric_tress` | Helric Tress | `warehouse` | hoist operator | Stationary | Watch my hand before moving the load. |
| `mornay_istra_wick` | Istra Wick | `warehouse` | packing lead | Stationary | Heavy underneath. That principle has survived every new foreman. |
| `mornay_polren_hale` | Polren Hale | `warehouse` | salt porter | Stationary | Salt finds every scratch you forgot you had. |
| `mornay_gessa_noll` | Gessa Noll | `warehouse` | grain checker | Stationary | A dry sack can hide damp grain. Feel the corners. |
| `mornay_merrit_dace` | Merrit Dace | `warehouse` | freight scribe | Stationary | I write down what passed the door, not what someone hoped would. |
| `mornay_arla_rill` | Arla Rill | `warehouse` | crate assembler | Stationary | There is a difference between shut and secured. |
| `mornay_oden_gant` | Oden Gant | `warehouse` | night porter | Stationary | People carry folded papers through a warehouse as well as sacks. No label tells you which will get a man dismissed. Ask the day clerk about cargo. |
| `mornay_nessa_muir` | Nessa Muir | `warehouse` | meal runner | Stationary | If you cannot leave the load, I can bring the bowl. |
| `mornay_verdin_clay` | Verdin Clay | `warehouse` | warehouse sweeper | Stationary | Lost grain feeds something. I prefer it not live here. |
| `mornay_lerna_brack` | Lerna Brack | `warehouse` | damaged-goods clerk | Stationary | Describe the damage before suggesting whose fault it must be. |
| `mornay_fenna_crowe` | Fenna Crowe | `warehouse` | new packer | Stationary | The others showed me once, then stayed close enough to show me again. |
| `mornay_halden_rusk` | Halden Rusk | `workshop` | printer | Stationary | My nephew Tavi sets the type. I have refused work from officials and from their enemies. A threat does not become an argument because it arrives with a petition. |
| `mornay_irma_bellows` | Irma Bellows | `workshop` | toolmaker | Stationary | A tool should fit the hand that actually uses it. |
| `mornay_cerren_flint` | Cerren Flint | `workshop` | smith | Stationary | I hear a bad weld before a customer sees it. |
| `mornay_vesta_dorr` | Vesta Dorr | `workshop` | printer's reader | Stationary | Pella's sheets were seized before anyone read them. That pleased the man selling blank forms next door. He has doubled his prices. |
| `mornay_pelda_gorse` | Pelda Gorse | `workshop` | paper cutter | Stationary | Straight edges begin with a table that does not wobble. |
| `mornay_jerrin_cole` | Jerrin Cole | `workshop` | repair apprentice | Stationary | I put the pieces in order. Then discovered a piece of yesterday. |
| `mornay_hessa_yarrow` | Hessa Yarrow | `workshop` | sailcloth stitcher | Stationary | These stitches are for wind, not admiration. |
| `mornay_torlin_hesk` | Torlin Hesk | `workshop` | wheelwright | Stationary | A wheel need not look splendid. It must remain round under complaint. |
| `mornay_nilda_linnet` | Nilda Linnet | `workshop` | pattern drafter | Stationary | Draw the allowance before cutting away your optimism. |
| `mornay_orsa_purl` | Orsa Purl | `workshop` | workshop bookkeeper | Stationary | They remember owing one another favours. I remember the timber. |
| `mornay_nessa_quill` | Nessa Quill | `laundry` | laundry organiser | Stationary | A person can work all week and still need a neighbour. We collect for supper and rent. Anyone demanding names before giving a coin can keep the coin. |
| `mornay_yelda_mere` | Yelda Mere | `laundry` | washer | Stationary | Dena wants the next meeting about the hoist and unpaid shifts. Others want speeches about bringing everything down. We still have washing to finish afterward. |
| `mornay_cossa_beck` | Cossa Beck | `laundry` | mender | Stationary | I recognise half the street by the elbows. |
| `mornay_brinna_mote` | Brinna Mote | `laundry` | laundry customer | Stationary | My employer calls the collection a conspiracy. He sent his own porter to ask for food after cutting the man's hours. |
| `mornay_terenna_vane` | Terenna Vane | `laundry` | wringer operator | Stationary | Mind your sleeve. The rollers are thorough. |
| `mornay_jessa_reed` | Jessa Reed | `laundry` | washer's assistant | Stationary | Wet linen weighs more than the people who request it. |
| `mornay_fenric_orr` | Fenric Orr | `laundry` | infirmary laundry carrier | Stationary | Yara asks for the plain sheets first. Nessa sends them whether the last bill was paid or not. Neither of them has time to argue about credit for it. |
| `mornay_orlin_bale` | Orlin Bale | `laundry` | neighbour awaiting wash | Stationary | I offered to help. They found an alarming amount of help for me. |
| `mornay_della_hume` | Della Hume | `boarding` | boardinghouse keeper | Stationary | Rent includes a bed. It does not include finding work. The hiring board is at the East Gate; do not give a stranger your last coin for a place in line. |
| `mornay_hesten_vale` | Hesten Vale | `boarding` | seasonal clerk | Stationary | My position is temporary. My cupboard has begun to feel permanent. |
| `mornay_rella_fenner` | Rella Fenner | `boarding` | dock worker | Stationary | The early shift eats quietly. We know who is still sleeping. |
| `mornay_otrin_wren` | Otrin Wren | `boarding` | unemployed joiner | Stationary | They dismissed a man for organizing. Then the foreman dismissed two men who had never spoken to him. Cheap hands were waiting outside. |
| `mornay_vessa_fallow` | Vessa Fallow | `boarding` | kitchen worker | Stationary | At work I cook. Here I negotiate for a turn at the stove. |
| `mornay_belric_tern` | Belric Tern | `boarding` | retired carrier | Stationary | I used to know the town by addresses. Now I know its benches. |
| `mornay_jorra_yew` | Jorra Yew | `boarding` | apprentice seamworker | Stationary | My first paid seam was crooked. The customer wore it anyway. |
| `mornay_marden_sill` | Marden Sill | `boarding` | remittance sender | Stationary | Some men offer quiet passages and cheap carriage. One asked for a fee in the Reclaimers' name. Hal sent him away. I still keep my papers on me. |
| `mornay_selda_brin` | Selda Brin | `court` | parent | Stationary | The children call it one large house when they want somebody else's supper. |
| `mornay_harlis_glyn` | Harlis Glyn | `court` | dockworker | Stationary | Maris reads the office replies aloud now. She asks why they never answer the question. I have run out of ways to soften it. |
| `mornay_etta_rook` | Etta Rook | `court` | elder resident | Stationary | Everyone consults me about the old days. Nobody asks where I left my cup. |
| `mornay_davren_fenwick` | Davren Fenwick | `court` | home repairer | Stationary | We share a roof. Repairs make that arrangement remarkably explicit. |
| `mornay_nelva_pike` | Nelva Pike | `court` | fish seller's sister | Stationary | Niva brings what did not sell. I have become skilled at looking delighted. |
| `mornay_ossa_nair` | Ossa Nair | `court` | constable's parent | Stationary | Jessa checks the latch when she visits. Then forgets to eat. |
| `mornay_berren_sorn` | Berren Sorn | `court` | child | Stationary | My aunt fixes boots. She says my feet are repeat customers. |
| `mornay_cerra_muir` | Cerra Muir | `court` | elder's caregiver | Stationary | We argue about the tea. It means she is having a better day. |
| `mornay_ilven_reed` | Ilven Reed | `court` | homebound net maker | Stationary | Heba sends the difficult knots. My hands still work even if my legs will not take the quay steps. Pay for the net, not the story. |
| `mornay_verna_quill` | Verna Quill | `court` | Nessa's mother | Stationary | My daughter brings food round and tells me not to worry. People who say that should try coming home before dark. |

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


## Implementation delivery record

The populated-town MVP is implemented on `agent/mornay-population` in the dedicated sibling worktree `../empire-game-mornay-population`. The district, room, service and complete 300-character tables above describe the delivered content. The delivery leaves this branch clean with local checkpoints; nothing is merged, pushed, rebased, force-updated or applied to another worktree.

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
