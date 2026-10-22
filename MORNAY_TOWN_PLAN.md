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
| Venn Chandlery and Secondhand | Bait 6; Throwing Knife 35; Fen Angler’s Rod 120; Swift Bangle 180. Ordinary buying/selling only; no pledge ledger. |
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
| `mornay_corra_pike` | Corra Pike | `MORNAY_NORTH_UPPER_WEST_MAP` | house steward | Stationary | Deliveries use the side entrance. Everybody hopes to be an exception. |
| `mornay_fennel_ashe` | Fennel Ashe | `MORNAY_NORTH_UPPER_WEST_MAP` | gardener | Stationary | The lake wind has very definite ideas about my hedges. |
| `mornay_nesta_vale` | Nesta Vale | `MORNAY_NORTH_UPPER_WEST_MAP` | shipowner's widow | Stationary | My husband liked arriving more than being home. |
| `mornay_osric_bell` | Osric Bell | `MORNAY_NORTH_UPPER_WEST_MAP` | retired pilot | Stationary | A fine coat has never improved a vessel's turning circle. |
| `mornay_celda_verne` | Celda Verne | `MORNAY_NORTH_UPPER_EAST_MAP` | household secretary | Stationary | The invitation says noon. My employer means whenever she arrives. |
| `mornay_idris_pell` | Idris Pell | `MORNAY_NORTH_UPPER_EAST_MAP` | Collegium porter | Stationary | The Civic Collegium is not receiving visitors. Fees cover upper schooling for the Civic Examination, clerkships and junior service. They do not cover visitors. |
| `mornay_benna_lark` | Benna Lark | `MORNAY_NORTH_UPPER_EAST_MAP` | Collegium student | Stationary | Mother says I must pass the Examination. She has paid enough to expect it, apparently. |
| `mornay_tassel_dorn` | Tassel Dorn | `MORNAY_NORTH_UPPER_EAST_MAP` | domestic worker | Stationary | These steps are grander than the kitchen they lead to. |
| `mornay_ulric_dane` | Ulric Dane | `MORNAY_NORTH_UPPER_EAST_MAP` | retired examiner | Stationary | The examination costs little. Years with a tutor cost rather more. |
| `mornay_dena_mere` | Dena Mere | `MORNAY_NORTH_LOWER_WEST_MAP` | dock representative | Stationary | A missed day's pay reaches the supper table before the explanation. |
| `mornay_salwen_reed` | Salwen Reed | `MORNAY_NORTH_LOWER_WEST_MAP` | rope inspector | Stationary | Frayed ends are courteous. Some ropes give no warning. |
| `mornay_niva_cole` | Niva Cole | `MORNAY_NORTH_LOWER_WEST_MAP` | fish seller | Stationary | Fresh this morning. I cannot promise freshness in your kitchen tomorrow. |
| `mornay_rulon_hart` | Rulon Hart | `MORNAY_NORTH_LOWER_WEST_MAP` | scow hand | Stationary | Small boats do the awkward work. Large boats get painted. |
| `mornay_heba_flint` | Heba Flint | `MORNAY_NORTH_LOWER_WEST_MAP` | net mender | Stationary | Everyone sees the fish. Nobody compliments the knots. |
| `mornay_davi_fenner` | Davi Fenner | `MORNAY_NORTH_LOWER_WEST_MAP` | child | Stationary | That berth looks ready. Grown-ups say looking ready isn't enough. |
| `mornay_merra_keld` | Merra Keld | `MORNAY_NORTH_LOWER_WEST_MAP` | laundry collector | Patrol | Harbour sheets come back smelling of every harbour except this one. |
| `mornay_jorin_vetch` | Jorin Vetch | `MORNAY_NORTH_LOWER_EAST_MAP` | lodging tout | Stationary | Dry bedding. Quiet depends on who has just been paid. |
| `mornay_alwen_corst` | Alwen Corst | `MORNAY_NORTH_LOWER_EAST_MAP` | customs messenger | Patrol | If the packet were lighter, I would suspect a missing enclosure. |
| `mornay_cessa_brack` | Cessa Brack | `MORNAY_NORTH_LOWER_EAST_MAP` | sailor's spouse | Stationary | He describes every port by the meal he couldn't afford. |
| `mornay_tobin_yarrow` | Tobin Yarrow | `MORNAY_NORTH_LOWER_EAST_MAP` | sail repairer | Stationary | A patch should last longer than the explanation. |
| `mornay_ersa_vole` | Ersa Vole | `MORNAY_NORTH_LOWER_EAST_MAP` | discharged deckhand | Stationary | My legs still expect the street to move. |
| `mornay_lowen_greaves` | Lowen Greaves | `MORNAY_NORTH_LOWER_EAST_MAP` | shipping agent | Stationary | The vessel is punctual. The cargo has other commitments. |
| `mornay_brena_sill` | Brena Sill | `MORNAY_NORTH_LOWER_EAST_MAP` | dockside baker | Stationary | Crew bread is baked firm. Nobody wants crumbs in the rigging. |
| `mornay_bram_fen` | Bram Fen | `MORNAY_MIDDLE_UPPER_WEST_MAP` | warehouse tallyman | Stationary | Nine sacks came off. Eight reached the ledger. Ask about the ledger. |
| `mornay_gessa_tarn` | Gessa Tarn | `MORNAY_MIDDLE_UPPER_WEST_MAP` | unloading forewoman | Stationary | Set it down together. Your back is not a competition. |
| `mornay_halen_wick` | Halen Wick | `MORNAY_MIDDLE_UPPER_WEST_MAP` | barrel roller | Patrol | Round goods still find a way to be difficult. |
| `mornay_ivara_gorse` | Ivara Gorse | `MORNAY_MIDDLE_UPPER_WEST_MAP` | freight customer | Stationary | My order crossed the lake faster than this courtyard. |
| `mornay_petren_shaw` | Petren Shaw | `MORNAY_MIDDLE_UPPER_WEST_MAP` | warehouse carpenter | Stationary | A crate is a room built for something that won't thank you. |
| `mornay_dossa_marr` | Dossa Marr | `MORNAY_MIDDLE_UPPER_WEST_MAP` | porter | Stationary | Hands clear. There's no spare set in the stores. |
| `mornay_vannic_hale` | Vannic Hale | `MORNAY_MIDDLE_UPPER_WEST_MAP` | scale keeper | Stationary | The scales agree with neither gentleman. I find that reassuring. |
| `mornay_fenna_orl` | Fenna Orl | `MORNAY_MIDDLE_UPPER_WEST_MAP` | packet runner | Stationary | The red string belongs to the parcel. Nobody told the parcel that. |
| `mornay_hobb_tress` | Hobb Tress | `MORNAY_MIDDLE_UPPER_WEST_MAP` | sack patcher | Stationary | A small hole can employ six people if nobody admits seeing it. |
| `mornay_pella_dorn` | Pella Dorn | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | print seller | Stationary | A petition, a recipe, a weather sheet. Somehow only one is suspicious. |
| `mornay_orna_bex` | Orna Bex | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | vegetable seller | Stationary | Choose the bent ones if you mean to cook them. |
| `mornay_micah_wren` | Micah Wren | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | honey dealer | Stationary | Taste is the advertisement. Please leave some advertisement for everyone else. |
| `mornay_sova_kern` | Sova Kern | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | cobbler's runner | Stationary | One boot collected. Apparently the other is still making up its mind. |
| `mornay_evin_rusk` | Evin Rusk | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | market inspector | Stationary | A standard measure saves a remarkable number of arguments. |
| `mornay_talma_noll` | Talma Noll | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | basket seller | Stationary | The handle is supposed to bear the weight. Your arm bears enough. |
| `mornay_ressa_muir` | Ressa Muir | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | shopper | Stationary | I came for onions. The town has made a morning of it. |
| `mornay_dolen_weir` | Dolen Weir | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | street sweeper | Patrol | Stalls move. Their rubbish develops a sense of ownership. |
| `mornay_ansel_crowe` | Ansel Crowe | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | music teacher | Stationary | Practising quietly is still practising. My neighbours remain unconvinced. |
| `mornay_belli_hume` | Belli Hume | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | errand child | Stationary | The change is correct. I counted it before buying nothing. |
| `mornay_carden_firth` | Carden Firth | `MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP` | cloth buyer | Stationary | A good weave survives being called unfashionable. |
| `mornay_vessa_auld` | Vessa Auld | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | petition copyist | Stationary | Say what happened first. We can find dignified words afterward. |
| `mornay_torren_glass` | Torren Glass | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | waiting claimant | Stationary | They know which desk has it. We have reached that stage. |
| `mornay_helma_quist` | Helma Quist | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | office cleaner | Stationary | Ink travels farther than any official in this building. |
| `mornay_arven_beck` | Arven Beck | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | courier | Patrol | Nobody signs quickly until I have somewhere else to be. |
| `mornay_nerit_wold` | Nerit Wold | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | examination candidate | Stationary | I remember the answer whenever I leave the room. |
| `mornay_sella_croft` | Sella Croft | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | licence applicant | Stationary | My name has been mine longer than their form has existed. |
| `mornay_garren_yew` | Garren Yew | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | document carrier | Stationary | The ribbon means untouched, not unimportant. |
| `mornay_edda_purl` | Edda Purl | `MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP` | notice reader | Stationary | They have moved the closing time into the smallest sentence. |
| `mornay_varek_linn` | Varek Linn | `MORNAY_MIDDLE_UPPER_EAST_MAP` | waterworks overseer | Stationary | Water follows the level. Budgets take a less direct route. |
| `mornay_hessa_dorr` | Hessa Dorr | `MORNAY_MIDDLE_UPPER_EAST_MAP` | survey assistant | Stationary | Hold the rod straight. We already know the ground is crooked. |
| `mornay_nollis_vane` | Nollis Vane | `MORNAY_MIDDLE_UPPER_EAST_MAP` | drainage worker | Stationary | A blocked channel is everybody's problem just after it becomes mine. |
| `mornay_ketta_roy` | Ketta Roy | `MORNAY_MIDDLE_UPPER_EAST_MAP` | gauge reader | Stationary | One dry week makes people experts. I keep the older readings. |
| `mornay_ossa_fenwick` | Ossa Fenwick | `MORNAY_MIDDLE_UPPER_EAST_MAP` | pipe fitter | Stationary | The leak can hear us discussing how expensive it is. |
| `mornay_derren_kest` | Derren Kest | `MORNAY_MIDDLE_UPPER_EAST_MAP` | water carrier | Patrol | It gets heavier between the pump and the upstairs landing. |
| `mornay_berrit_fane` | Berrit Fane | `MORNAY_MIDDLE_LOWER_WEST_MAP` | cart-yard foreman | Stationary | Arrivals to the left. Complaints have formed their own queue. |
| `mornay_helven_moss` | Helven Moss | `MORNAY_MIDDLE_LOWER_WEST_MAP` | carter | Stationary | A wheel only squeaks when someone important is listening. |
| `mornay_iset_brill` | Iset Brill | `MORNAY_MIDDLE_LOWER_WEST_MAP` | peat seller | Stationary | Keep the peat dry. The fish smokers need heat, not another yard full of damp. |
| `mornay_jessa_fallow` | Jessa Fallow | `MORNAY_MIDDLE_LOWER_WEST_MAP` | harness maker | Stationary | Leather remembers being neglected. |
| `mornay_rurik_dean` | Rurik Dean | `MORNAY_MIDDLE_LOWER_WEST_MAP` | teamster | Stationary | The mule has identified every shortcut I would regret. |
| `mornay_vela_thorne` | Vela Thorne | `MORNAY_MIDDLE_LOWER_WEST_MAP` | freight cook | Stationary | You can argue over whose turn it was after eating. |
| `mornay_dennet_vale` | Dennet Vale | `MORNAY_MIDDLE_LOWER_WEST_MAP` | stores checker | Stationary | The label says fragile. So does the man who dropped it. |
| `mornay_mora_wist` | Mora Wist | `MORNAY_MIDDLE_LOWER_WEST_MAP` | yard messenger | Patrol | I know the fastest route. It contains three people who need me. |
| `mornay_kelda_frey` | Kelda Frey | `MORNAY_MIDDLE_LOWER_WEST_MAP` | injured porter | Stationary | The lighter duty comes with heavier opinions. |
| `mornay_adra_kelm` | Adra Kelm | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | provisioner's assistant | Stationary | We sold the last small jar. There are many large regrets. |
| `mornay_henric_sorn` | Henric Sorn | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | workgear hawker | Stationary | Good gloves are cheaper than learning how much you need fingers. |
| `mornay_malva_teel` | Malva Teel | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | secondhand bookseller | Stationary | Someone underlined every useful passage and several arguments. |
| `mornay_iven_bellows` | Iven Bellows | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | knife sharpener | Stationary | Sharp tools ask less force. They still ask attention. |
| `mornay_essie_rann` | Essie Rann | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | seamstress | Stationary | Try lifting your arms before declaring it a perfect fit. |
| `mornay_pelren_oxley` | Pelren Oxley | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | customer | Stationary | The cheaper coat is only cheaper if winter agrees. |
| `mornay_theda_wark` | Theda Wark | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | lamp oil carrier | Patrol | No, it is not perfume. Stand farther away and hope. |
| `mornay_corlen_brume` | Corlen Brume | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | sign painter | Stationary | They requested larger letters and a smaller price. |
| `mornay_nella_gant` | Nella Gant | `MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP` | shop sweeper | Stationary | People wipe their feet while entering. Leaving seems to inspire trust. |
| `mornay_tavi_rusk` | Tavi Rusk | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | compositor | Stationary | Letters look harmless in separate drawers. |
| `mornay_dalen_hesk` | Dalen Hesk | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | cooper | Stationary | A barrel must agree with itself all the way round. |
| `mornay_savra_linnet` | Savra Linnet | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | forge striker | Stationary | I count the blows. That is why we still have a rhythm. |
| `mornay_orenna_flint` | Orenna Flint | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | potter | Stationary | A handle is a promise made to a stranger's fingers. |
| `mornay_breck_yarrow` | Breck Yarrow | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | carpenter apprentice | Stationary | Master says measure twice. I would like the second result to improve. |
| `mornay_ilma_dace` | Ilma Dace | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | dyer | Stationary | This stain is professional. The other one is lunch. |
| `mornay_korrin_ashe` | Korrin Ashe | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | workshop runner | Patrol | Everybody's urgent parcel is waiting for somebody else's. |
| `mornay_verda_pike` | Verda Pike | `MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP` | furniture repairer | Stationary | Old chairs sag where people felt safest. |
| `mornay_ysol_reed` | Ysol Reed | `MORNAY_MIDDLE_LOWER_EAST_MAP` | grandmother | Stationary | Children grow taller while you are looking for their other sock. |
| `mornay_tessa_glyn` | Tessa Glyn | `MORNAY_MIDDLE_LOWER_EAST_MAP` | home seamworker | Stationary | The baby sleeps whenever the needle breaks. |
| `mornay_loric_mallow` | Loric Mallow | `MORNAY_MIDDLE_LOWER_EAST_MAP` | kettle repairer | Stationary | A dent is character. A hole requires my attention. |
| `mornay_enna_quist` | Enna Quist | `MORNAY_MIDDLE_LOWER_EAST_MAP` | tenant | Stationary | The upstairs family is moving one chair. It has taken all morning. |
| `mornay_ferin_wold` | Ferin Wold | `MORNAY_MIDDLE_LOWER_EAST_MAP` | pupil | Stationary | I can spell warehouse. I would rather draw one. |
| `mornay_bessa_marrin` | Bessa Marrin | `MORNAY_MIDDLE_LOWER_EAST_MAP` | yard gardener | Stationary | We agreed to share the herbs. We are discussing what share means. |
| `mornay_sima_wold` | Sima Wold | `MORNAY_SOUTH_UPPER_WEST_MAP` | inn proprietor on errands | Stationary | Rella has the rooms today. Boots by the bench, people by the fire, if they can agree. |
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
| `mornay_jessa_nair` | Jessa Nair | `MORNAY_WEST_GATE_MAP` | watch sergeant | Stationary | Keep the gateway clear. Arriving is easier when others can leave. |
| `mornay_anric_fell` | Anric Fell | `MORNAY_WEST_GATE_MAP` | watch constable | Stationary | Directions cost nothing. Please stop offering me coins. |
| `mornay_porrin_beck` | Porrin Beck | `MORNAY_WEST_GATE_MAP` | road porter | Patrol | The bag has arrived. Its owner is negotiating with his knees. |
| `mornay_vilda_thorn` | Vilda Thorn | `MORNAY_WEST_GATE_MAP` | returning resident | Stationary | The town smells different after a week away. By supper it won't. |
| `mornay_dalven_rill` | Dalven Rill | `MORNAY_EAST_GATE_MAP` | freight watch | Stationary | List the load before unloading it. Memory becomes generous afterward. |
| `mornay_meret_shaw` | Meret Shaw | `MORNAY_EAST_GATE_MAP` | wagon checker | Stationary | A loose wheel is not a local administrative custom. |
| `mornay_varen_noll` | Varen Noll | `MORNAY_EAST_GATE_MAP` | delivery driver | Patrol | The address says near the big building. I admire its confidence. |
| `mornay_hilda_vane` | Hilda Vane | `MORNAY_EAST_GATE_MAP` | animal minder | Stationary | Let him smell your hand. He has had a day of strangers. |
| `mornay_cressa_mote` | Cressa Mote | `MORNAY_EAST_GATE_MAP` | exhausted traveller | Stationary | I shall appreciate the architecture after finding a chair. |
| `mornay_marit_voss` | Marit Voss | `office` | senior officer | Stationary | A complaint about wages is not, by itself, evidence of conspiracy. |
| `mornay_inessa_cray` | Inessa Cray | `office` | reception clerk | Stationary | State the office you need. Your whole journey can wait a moment. |
| `mornay_halden_quill` | Halden Quill | `office` | records supervisor | Stationary | Misfiled is a location, regrettably not one we have indexed. |
| `mornay_bera_senn` | Bera Senn | `office` | payments clerk | Stationary | The amount is correct. The authorising signature has gone wandering. |
| `mornay_eldric_fane` | Eldric Fane | `office` | requisitions clerk | Stationary | We cannot requisition the time required to complete a requisition. |
| `mornay_novra_dain` | Novra Dain | `office` | registration administrator | Stationary | Children are not missing paperwork. Paperwork is missing children. |
| `mornay_coris_wren` | Coris Wren | `office` | archive assistant | Stationary | Dry hands, please. The damp has already made its amendments. |
| `mornay_lenva_purl` | Lenva Purl | `office` | appointment clerk | Stationary | An appointment tells us when to expect your delay. |
| `mornay_torben_clay` | Torben Clay | `office` | building porter | Stationary | That door sticks. Please blame the door before the Empire. |
| `mornay_messa_yule` | Messa Yule | `office` | copy clerk | Stationary | I have copied this sentence enough to distrust its meaning. |
| `mornay_arlis_rook` | Arlis Rook | `office` | infrastructure liaison | Stationary | Urgent repairs have become a category of permanent furniture. |
| `mornay_wenda_flax` | Wenda Flax | `office` | payroll petitioner | Stationary | They paid my replacement promptly. I trained him. |
| `mornay_corven_dace` | Corven Dace | `office` | licence officer | Stationary | The rule is awkward. Ignoring it would make your licence useless. |
| `mornay_helis_tarn` | Helis Tarn | `office` | archive conservator | Stationary | Dust is patient. We have adopted the same strategy. |
| `mornay_nerin_gant` | Nerin Gant | `office` | junior examiner | Stationary | I passed the examination. Nobody examined whether I liked desks. |
| `mornay_vessa_lund` | Vessa Lund | `office` | public assistant | Stationary | Tell me in the words you have. We will start there. |
| `mornay_yara_kelm` | Yara Kelm | `infirmary` | senior nurse | Stationary | Rest is treatment, even when it looks like doing nothing. |
| `mornay_selven_orr` | Selven Orr | `infirmary` | physician | Stationary | Tell me where it hurts before telling me why it cannot. |
| `mornay_hanne_brist` | Hanne Brist | `infirmary` | infirmary steward | Stationary | Clean bedding is a medical supply. I keep making that argument. |
| `mornay_elrin_vey` | Elrin Vey | `infirmary` | registered Bloommarked healer | Stationary | Healing helps living tissue. It does not excuse lifting that load again. |
| `mornay_jonna_mire` | Jonna Mire | `infirmary` | dispenser | Stationary | The label is for remembering after you leave this room. |
| `mornay_padris_kett` | Padris Kett | `infirmary` | orderly | Stationary | Slowly. The bed will still be there when we reach it. |
| `mornay_lessa_fern` | Lessa Fern | `infirmary` | trainee nurse | Stationary | I know the answer. My hands are taking longer to learn. |
| `mornay_nevin_brack` | Nevin Brack | `infirmary` | patient with crushed foot | Stationary | I keep dreaming I am late for a shift I cannot stand through. |
| `mornay_elma_pike` | Elma Pike | `infirmary` | patient's partner | Stationary | He says he needs nothing. He has eaten everything I brought. |
| `mornay_dorran_bale` | Dorran Bale | `infirmary` | recovering boat hand | Stationary | They forbid lifting. Nobody has explained how to feel useful. |
| `mornay_mirren_ashe` | Mirren Ashe | `infirmary` | exhausted caregiver | Stationary | I sat down for a moment. It appears to have become an hour. |
| `mornay_vela_rinn` | Vela Rinn | `infirmary` | cook | Stationary | Convalescent broth is not punishment. I wish people would taste it first. |
| `mornay_jessin_corst` | Jessin Corst | `infirmary` | linen orderly | Stationary | The clean stack stays clean if visitors stop leaning on it. |
| `mornay_teren_lume` | Teren Lume | `infirmary` | night nurse | Stationary | Daylight makes people apologise for things they told us at night. |
| `mornay_orla_nair` | Orla Nair | `infirmary` | watch constable visiting colleague | Stationary | She complains properly now. That is an improvement. |
| `mornay_fressa_dean` | Fressa Dean | `infirmary` | discharged patient | Stationary | They say I can go home. Home has considerably more stairs. |
| `mornay_pelda_hesk` | Pelda Hesk | `infirmary` | patient's mother | Stationary | I brought his good shirt. I needed something useful to carry. |
| `mornay_vanis_teal` | Vanis Teal | `infirmary` | infirmary accountant | Stationary | A saved bed-sheet is visible. A prevented infection is harder to invoice. |
| `mornay_neris_kelm` | Neris Kelm | `provisioner` | provisioner | Stationary | Buy for the journey you are taking, not the one the bag suggests. |
| `mornay_eldra_fenn` | Eldra Fenn | `provisioner` | stockkeeper | Stationary | Front shelf first. Older goods deserve their turn. |
| `mornay_pavin_marr` | Pavin Marr | `provisioner` | counter assistant | Stationary | If you need the small measure, ask for the small measure. |
| `mornay_liora_bexley` | Liora Bexley | `provisioner` | household shopper | Stationary | Three mouths have become four opinions about supper. |
| `mornay_heddin_wist` | Heddin Wist | `provisioner` | travelling labourer | Stationary | Enough for tomorrow. Tomorrow's work can pay for the day after. |
| `mornay_toria_brume` | Toria Brume | `provisioner` | provision packer | Stationary | Paper outside the jar, please. It does little good inside. |
| `mornay_keven_muir` | Keven Muir | `provisioner` | kitchen buyer | Stationary | We budgeted for onions before everyone remembered liking them. |
| `mornay_yenna_vetch` | Yenna Vetch | `provisioner` | neighbour collecting order | Stationary | Neris puts the heavy things together. My arms object to this efficiency. |
| `mornay_melva_stern` | Melva Stern | `apothecary` | apothecary | Stationary | A larger dose is not a more determined recovery. |
| `mornay_arret_cole` | Arret Cole | `apothecary` | apprentice | Stationary | The plain jars are labelled too. Especially the plain jars. |
| `mornay_vessa_gorse` | Vessa Gorse | `apothecary` | herb sorter | Stationary | Dried does not mean indistinguishable. |
| `mornay_nerrin_hale` | Nerrin Hale | `apothecary` | sleepless customer | Stationary | I sleep very well just before I must get up. |
| `mornay_orel_quist` | Orel Quist | `apothecary` | medicine courier | Stationary | She packed the glass separately. I wish roads did the same. |
| `mornay_thelin_vole` | Thelin Vole | `apothecary` | carpenter buying salve | Stationary | I wore gloves all week except the moment that mattered. |
| `mornay_rissa_yew` | Rissa Yew | `apothecary` | caregiver | Stationary | My mother trusts anything that tastes unpleasant. A troublesome standard. |
| `mornay_dannet_pate` | Dannet Pate | `apothecary` | bottle washer | Stationary | Clear glass is honest about how much work remains. |
| `mornay_hesta_sorn` | Hesta Sorn | `workgear` | workgear keeper | Stationary | Try both boots. Most people intend to use both feet. |
| `mornay_morren_flint` | Morren Flint | `workgear` | fitter | Stationary | A belt should hold your gear, not remind you of every meal. |
| `mornay_isa_marrin` | Isa Marrin | `workgear` | leatherworker | Stationary | I repair the seam before polishing the story. |
| `mornay_fenris_roy` | Fenris Roy | `workgear` | dock recruit | Stationary | They told me what to buy. Then everyone disagreed. |
| `mornay_galda_thorn` | Galda Thorn | `workgear` | survey worker | Stationary | Mud takes the shine off fine purchases very democratically. |
| `mornay_perren_croft` | Perren Croft | `workgear` | repair customer | Stationary | They lasted three seasons. I came to complain and bought the same pair. |
| `mornay_lorna_wark` | Lorna Wark | `workgear` | counter assistant | Stationary | Sizes are on the shelf edge, not the shelf you wish were yours. |
| `mornay_dessin_bellows` | Dessin Bellows | `workgear` | pack stitcher | Stationary | A good repair should become boring immediately. |
| `mornay_hal_venn` | Hal Venn | `chandler` | chandler and secondhand dealer | Stationary | I value the object. You needn't tell me what selling it costs you. |
| `mornay_elsra_firth` | Elsra Firth | `chandler` | chandler's assistant | Stationary | Lamp wicks here. Rope there. Both burn if you are sufficiently careless. |
| `mornay_jarven_clay` | Jarven Clay | `chandler` | secondhand clerk | Stationary | Outright sales at this counter. We keep no pledges for later redemption. |
| `mornay_nessa_corst` | Nessa Corst | `chandler` | sailor buying tools | Stationary | I sold my old tools when work stopped. These will have to earn their price too. |
| `mornay_veldin_greaves` | Veldin Greaves | `chandler` | mate buying supplies | Stationary | The captain remembers oil once the lamps go out. |
| `mornay_brissa_tern` | Brissa Tern | `chandler` | resident selling plate | Stationary | It was never useful on the wall. Let it be useful somewhere. |
| `mornay_otrin_dain` | Otrin Dain | `chandler` | repairer examining purchase | Stationary | Whoever repaired this before me had faith instead of screws. |
| `mornay_fennra_rill` | Fennra Rill | `chandler` | candle maker | Stationary | Even light requires somebody trimming the ends. |
| `mornay_rella_wold` | Rella Wold | `gate_inn` | gate innkeeper and cook | Stationary | Sima is on errands. Rooms are thirty gold; the blankets have seen worse weather than you. |
| `mornay_benric_cove` | Benric Cove | `gate_inn` | serving worker | Stationary | I remember the table. Remind me which hungry person belongs to it. |
| `mornay_delsa_quill` | Delsa Quill | `gate_inn` | card player | Stationary | He loses graciously. It gives him more practice. |
| `mornay_torva_brin` | Torva Brin | `gate_inn` | merchant's clerk | Stationary | My employer has rented a room for himself and a chair for the accounts. |
| `mornay_issen_dorr` | Issen Dorr | `gate_inn` | roads worker | Stationary | A hot meal improves my report on the road considerably. |
| `mornay_pelda_wren` | Pelda Wren | `gate_inn` | traveller | Stationary | I asked for somewhere ordinary. It is wonderfully ordinary. |
| `mornay_orven_lume` | Orven Lume | `gate_inn` | potter visiting market | Stationary | I travel with empty baskets and return without having seen the town. |
| `mornay_hessa_vane` | Hessa Vane | `gate_inn` | local regular | Stationary | That corner gets the least draught. We have established this through sacrifice. |
| `mornay_vannic_nair` | Vannic Nair | `gate_inn` | off-duty watch | Stationary | Tonight I am responsible only for this bowl. |
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
| `mornay_gerta_vell` | Gerta Vell | `commercial_inn` | commercial innkeeper | Stationary | The Ledger House keeps quiet rooms for forty gold. Merchant, clerk or skipper: the price is the same. |
| `mornay_odrin_vale` | Odrin Vale | `commercial_inn` | cook | Stationary | I can feed a boatload. I cannot make them agree on seasoning. |
| `mornay_lessa_crowe` | Lessa Crowe | `commercial_inn` | server | Stationary | Raise a hand for service. Shouting raises only my expectations. |
| `mornay_harnet_brill` | Harnet Brill | `commercial_inn` | lake skipper | Stationary | The voyage was uneventful. I hope to repeat this dull achievement. |
| `mornay_nessa_wren` | Nessa Wren | `commercial_inn` | deckhand | Stationary | A shore chair ought to be easier to balance on. |
| `mornay_elda_wick` | Elda Wick | `commercial_inn` | sailmaker | Stationary | The torn part always points toward the person explaining the accident. |
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
| `mornay_oren_teal` | Oren Teal | `school` | headteacher | Stationary | Children can learn a public system without learning that it is beyond question. |
| `mornay_nelda_quill` | Nelda Quill | `school` | school administrator | Stationary | Nessa sends clean aprons when a family cannot. We record aprons, not reasons. |
| `mornay_hadria_beck` | Hadria Beck | `school` | arithmetic teacher | Stationary | They understand shares immediately when the subject is lunch. |
| `mornay_serren_crowe` | Serren Crowe | `school` | reading teacher | Stationary | Sound it out. A difficult word is not an accusation. |
| `mornay_tessa_orr` | Tessa Orr | `school` | classroom helper | Stationary | One pencil dropped. Thirty scholars have discovered it. |
| `mornay_perrin_mere` | Perrin Mere | `school` | pupil | Stationary | Aunt Dena says counting your pay is arithmetic you should practise. |
| `mornay_vella_corst` | Vella Corst | `school` | pupil | Stationary | My father says his boat is important. I drew it slightly too large. |
| `mornay_ivenna_sorn` | Ivenna Sorn | `school` | pupil | Stationary | I put the answer on the wrong line. It was a very good answer. |
| `mornay_dorrie_firth` | Dorrie Firth | `school` | pupil | Stationary | We are writing about home. Mine has the best window. |
| `mornay_helren_pate` | Helren Pate | `school` | pupil | Stationary | The map fits on paper. Walking it seems unfair. |
| `mornay_maris_glyn` | Maris Glyn | `school` | pupil | Stationary | I read to my little brother. He insists the pictures are corrections. |
| `mornay_bessa_rook` | Bessa Rook | `school` | parent | Stationary | I never had time for school. I make time to bring her. |
| `mornay_ellin_hesk` | Ellin Hesk | `school` | caretaker | Stationary | Small boots bring in a tremendous amount of town. |
| `mornay_verra_moss` | Verra Moss | `school` | adult learner | Stationary | I can read the notice myself now. I still dislike what it says. |
| `mornay_edrin_saye` | Edrin Saye | `harbour` | customs assessor | Stationary | If hungry porters are the whole explanation, your investigation is unfinished. |
| `mornay_maura_dell` | Maura Dell | `harbour` | harbour administrator | Stationary | A vessel's arrival and permission to unload are separate entries. |
| `mornay_hassel_muir` | Hassel Muir | `harbour` | manifest clerk | Stationary | Use the same cargo name on both copies. Poetry delays clearance. |
| `mornay_vessa_fenn` | Vessa Fenn | `harbour` | fee clerk | Stationary | I can explain the charge. That does not mean I invented it. |
| `mornay_orris_teel` | Orris Teel | `harbour` | berth scheduler | Stationary | Two captains have requested the same empty water. |
| `mornay_dalen_wist` | Dalen Wist | `harbour` | inspection officer | Stationary | Open the crate properly. Splinters are not evidence of cooperation. |
| `mornay_berra_yule` | Berra Yule | `harbour` | customs copyist | Stationary | The correction needs initials, not an account of your disappointment. |
| `mornay_neven_brume` | Neven Brume | `harbour` | harbour messenger | Stationary | The answer reached the quay just after the question sailed. |
| `mornay_tilda_vole` | Tilda Vole | `harbour` | waiting agent | Stationary | My client considers waiting part of my fee, somehow. |
| `mornay_harnis_roy` | Harnis Roy | `harbour` | barge master | Stationary | The cargo is honest. Its description has become ambitious. |
| `mornay_elna_stern` | Elna Stern | `harbour` | small trader | Stationary | The fee is smaller for a large shipment. A useful discovery for large people. |
| `mornay_corren_wark` | Corren Wark | `harbour` | archive clerk | Stationary | Old manifests are dull until somebody urgently needs one. |
| `mornay_delsin_orl` | Delsin Orl | `harbour` | inspection assistant | Stationary | I count the boxes. Guessing is apparently a senior privilege. |
| `mornay_rissa_dane` | Rissa Dane | `harbour` | vessel owner | Stationary | I paid for a better hull. Water has yet to congratulate me. |
| `mornay_varda_fen` | Varda Fen | `warehouse` | warehouse supervisor | Stationary | Bram catches missing sacks. I catch the arguments afterward. |
| `mornay_helric_tress` | Helric Tress | `warehouse` | hoist operator | Stationary | Watch my hand before moving the load. |
| `mornay_istra_wick` | Istra Wick | `warehouse` | packing lead | Stationary | Heavy underneath. That principle has survived every new foreman. |
| `mornay_polren_hale` | Polren Hale | `warehouse` | salt porter | Stationary | Salt finds every scratch you forgot you had. |
| `mornay_gessa_noll` | Gessa Noll | `warehouse` | grain checker | Stationary | A dry sack can hide damp grain. Feel the corners. |
| `mornay_merrit_dace` | Merrit Dace | `warehouse` | freight scribe | Stationary | I write down what passed the door, not what someone hoped would. |
| `mornay_arla_rill` | Arla Rill | `warehouse` | crate assembler | Stationary | There is a difference between shut and secured. |
| `mornay_oden_gant` | Oden Gant | `warehouse` | night porter | Stationary | The building makes different noises when everyone is asleep. |
| `mornay_nessa_muir` | Nessa Muir | `warehouse` | meal runner | Stationary | If you cannot leave the load, I can bring the bowl. |
| `mornay_verdin_clay` | Verdin Clay | `warehouse` | warehouse sweeper | Stationary | Lost grain feeds something. I prefer it not live here. |
| `mornay_lerna_brack` | Lerna Brack | `warehouse` | damaged-goods clerk | Stationary | Describe the damage before suggesting whose fault it must be. |
| `mornay_fenna_crowe` | Fenna Crowe | `warehouse` | new packer | Stationary | The others showed me once, then stayed close enough to show me again. |
| `mornay_halden_rusk` | Halden Rusk | `workshop` | printer | Stationary | My nephew Tavi sets small type beautifully. His opinions are a larger format. |
| `mornay_irma_bellows` | Irma Bellows | `workshop` | toolmaker | Stationary | A tool should fit the hand that actually uses it. |
| `mornay_cerren_flint` | Cerren Flint | `workshop` | smith | Stationary | I hear a bad weld before a customer sees it. |
| `mornay_vesta_dorr` | Vesta Dorr | `workshop` | printer's reader | Stationary | A missing word can reverse a sentence. Usually the expensive word. |
| `mornay_pelda_gorse` | Pelda Gorse | `workshop` | paper cutter | Stationary | Straight edges begin with a table that does not wobble. |
| `mornay_jerrin_cole` | Jerrin Cole | `workshop` | repair apprentice | Stationary | I put the pieces in order. Then discovered a piece of yesterday. |
| `mornay_hessa_yarrow` | Hessa Yarrow | `workshop` | sailcloth stitcher | Stationary | These stitches are for wind, not admiration. |
| `mornay_torlin_hesk` | Torlin Hesk | `workshop` | wheelwright | Stationary | A wheel need not look splendid. It must remain round under complaint. |
| `mornay_nilda_linnet` | Nilda Linnet | `workshop` | pattern drafter | Stationary | Draw the allowance before cutting away your optimism. |
| `mornay_orsa_purl` | Orsa Purl | `workshop` | workshop bookkeeper | Stationary | They remember owing one another favours. I remember the timber. |
| `mornay_nessa_quill` | Nessa Quill | `laundry` | laundry organiser | Stationary | A person can work all week and still need a neighbour. |
| `mornay_yelda_mere` | Yelda Mere | `laundry` | washer | Stationary | Dena sends dock cloths separately. Somebody taught her consideration. |
| `mornay_cossa_beck` | Cossa Beck | `laundry` | mender | Stationary | I recognise half the street by the elbows. |
| `mornay_brinna_mote` | Brinna Mote | `laundry` | laundry customer | Stationary | The stain belongs to my employer. The embarrassment has been delegated. |
| `mornay_terenna_vane` | Terenna Vane | `laundry` | wringer operator | Stationary | Mind your sleeve. The rollers are thorough. |
| `mornay_jessa_reed` | Jessa Reed | `laundry` | washer's assistant | Stationary | Wet linen weighs more than the people who request it. |
| `mornay_fenric_orr` | Fenric Orr | `laundry` | infirmary laundry carrier | Stationary | Yara asks for the plain sheets first. Comfort need not be decorative. |
| `mornay_orlin_bale` | Orlin Bale | `laundry` | neighbour awaiting wash | Stationary | I offered to help. They found an alarming amount of help for me. |
| `mornay_della_hume` | Della Hume | `boarding` | boardinghouse keeper | Stationary | Rent includes a bed and reasonable patience. |
| `mornay_hesten_vale` | Hesten Vale | `boarding` | seasonal clerk | Stationary | My position is temporary. My cupboard has begun to feel permanent. |
| `mornay_rella_fenner` | Rella Fenner | `boarding` | dock worker | Stationary | The early shift eats quietly. We know who is still sleeping. |
| `mornay_otrin_wren` | Otrin Wren | `boarding` | unemployed joiner | Stationary | I keep the tools clean. Being ready is something I can still do. |
| `mornay_vessa_fallow` | Vessa Fallow | `boarding` | kitchen worker | Stationary | At work I cook. Here I negotiate for a turn at the stove. |
| `mornay_belric_tern` | Belric Tern | `boarding` | retired carrier | Stationary | I used to know the town by addresses. Now I know its benches. |
| `mornay_jorra_yew` | Jorra Yew | `boarding` | apprentice seamworker | Stationary | My first paid seam was crooked. The customer wore it anyway. |
| `mornay_marden_sill` | Marden Sill | `boarding` | remittance sender | Stationary | I allow myself the postage before deciding what I can spare. |
| `mornay_selda_brin` | Selda Brin | `court` | parent | Stationary | The children call it one large house when they want somebody else's supper. |
| `mornay_harlis_glyn` | Harlis Glyn | `court` | dockworker | Stationary | Maris reads my letters aloud now. I pretend to check the spelling. |
| `mornay_etta_rook` | Etta Rook | `court` | elder resident | Stationary | Everyone consults me about the old days. Nobody asks where I left my cup. |
| `mornay_davren_fenwick` | Davren Fenwick | `court` | home repairer | Stationary | We share a roof. Repairs make that arrangement remarkably explicit. |
| `mornay_nelva_pike` | Nelva Pike | `court` | fish seller's sister | Stationary | Niva brings what did not sell. I have become skilled at looking delighted. |
| `mornay_ossa_nair` | Ossa Nair | `court` | constable's parent | Stationary | Jessa checks the latch when she visits. Then forgets to eat. |
| `mornay_berren_sorn` | Berren Sorn | `court` | child | Stationary | My aunt fixes boots. She says my feet are repeat customers. |
| `mornay_cerra_muir` | Cerra Muir | `court` | elder's caregiver | Stationary | We argue about the tea. It means she is having a better day. |
| `mornay_ilven_reed` | Ilven Reed | `court` | homebound net maker | Stationary | Heba sends the difficult knots. She says it keeps me objectionable. |
| `mornay_verna_quill` | Verna Quill | `court` | Nessa's mother | Stationary | My daughter washes half the town's linen and worries about the other half. |

## Implementation decisions and reservations

- Reuse the 17-map topology and all existing regional grids. New ordinary building doors are explicit registry entries; room IDs use `mornay_` prefixes so Calwick/Drenwick handlers cannot claim them.
- Maintain SAVE_VERSION 5 and the existing location payload. Dialogue, network classifications, decorations and routes add no saved state. Existing item, gold, day and party health authorities remain responsible for service results.
- Correct the two stale faction references in `LORE.md` and Fenwick’s `npcs.js` dialogue to Reclaimers. The audit found no legacy internal/persistence identifier requiring retention; do not invent an alias or historical rename.
- Gate departures already use safe approach PATH tiles: West (240,144), East (272,144), facing down. Town arrival remains (240,432). Controller tests cover both movement presentations, saves and debug arrival.
- Hydrographer/Esla history, ship mystery, clandestine boarding, Island ferry, major quests, Regional Office operations, Old Fort plot and Reclaimer recruitment/investigation remain inactive. No placeholder doors expose them.
- Rendering uses existing programmatic sprites, tile vocabulary and deterministic narrow decorations. No new image assets, dependency, terrain type, random encounters or save schema.

## Deliberately deferred and verification

Later editorial review may revise names, quip frequency, exact prices, class accents and stock progression. A new equipment tier needs its own balance audit. Valmere basin depth, hydrographic principal, ship narrative and future Reclaimer objectives are deliberately unresolved.

Required verification includes input-driven gate and door routes; safe landings; unique roster IDs and comparable counts; swept patrol/collision checks; buying, selling, both inn receipts and treatment; save/load every room; mixed-speaker styling and text fit; no mutable Reclaimer state; inert reserved content; no town encounters; catalogue and fingerprints; full transition artifact; old-town and historical combat regression. Test 300 owns gate controls; reserve 301–319 for the exclusive post-production test writer. Browser/manual evidence must be reported separately from simulated controls.
