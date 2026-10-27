'use strict';

// Mornay town: seventeen discrete 16x15 legacy-town maps.
// The layout is intentionally irregular and is the one topology authority used
// by movement, validation, tests and documentation. Coordinates here are town-
// layout coordinates only; these maps are discrete and are not regional chunks.
const MORNAY_TOWN_LAYOUT = Object.freeze([
  Object.freeze({ id: 'MORNAY_OLD_FORT_MAP',                       x: 0, y: 0, district: 'fort',   displayName: 'Old Fort Mornay',                         waterEdges: ['north', 'west', 'east'], reserves: ['old fort lookout'] }),
  Object.freeze({ id: 'MORNAY_NORTH_UPPER_WEST_MAP',               x: 0, y: 1, district: 'north',  displayName: 'North Mornay — Upper West',               waterEdges: ['west'], reserves: ['story ship berth'] }),
  Object.freeze({ id: 'MORNAY_NORTH_UPPER_EAST_MAP',               x: 1, y: 1, district: 'north',  displayName: 'North Mornay — Upper East',               waterEdges: ['north', 'east'], reserves: ['older merchant properties'] }),
  Object.freeze({ id: 'MORNAY_NORTH_LOWER_WEST_MAP',               x: 0, y: 2, district: 'north',  displayName: 'North Mornay — Lower West',               waterEdges: ['west'], reserves: ['inert island ferry berth', 'harbour ward'] }),
  Object.freeze({ id: 'MORNAY_NORTH_LOWER_EAST_MAP',               x: 1, y: 2, district: 'north',  displayName: 'North Mornay — Lower East',               waterEdges: ['east'], reserves: ['customs and ship offices', 'sailors lodging'] }),
  Object.freeze({ id: 'MORNAY_MIDDLE_UPPER_WEST_MAP',              x: 0, y: 3, district: 'middle', displayName: 'Middle Mornay — Upper West',              waterEdges: ['west'], reserves: ['harbour warehouses'] }),
  Object.freeze({ id: 'MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP',      x: 1, y: 3, district: 'middle', displayName: 'Middle Mornay — Upper Central West',      market: true, reserves: ['commercial square'] }),
  Object.freeze({ id: 'MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP',      x: 2, y: 3, district: 'middle', displayName: 'Middle Mornay — Upper Central East',      market: true, reserves: ['regional IJC office and archives'] }),
  Object.freeze({ id: 'MORNAY_MIDDLE_UPPER_EAST_MAP',              x: 3, y: 3, district: 'middle', displayName: 'Middle Mornay — Upper East',              waterEdges: ['north', 'east'], reserves: ['survey and waterworks'] }),
  Object.freeze({ id: 'MORNAY_MIDDLE_LOWER_WEST_MAP',              x: 0, y: 4, district: 'middle', displayName: 'Middle Mornay — Lower West',              waterEdges: ['west'], reserves: ['freight warehouses'] }),
  Object.freeze({ id: 'MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP',      x: 1, y: 4, district: 'middle', displayName: 'Middle Mornay — Lower Central West',      market: true, reserves: ['commercial street'] }),
  Object.freeze({ id: 'MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP',      x: 2, y: 4, district: 'middle', displayName: 'Middle Mornay — Lower Central East',      reserves: ['workshops'] }),
  Object.freeze({ id: 'MORNAY_MIDDLE_LOWER_EAST_MAP',              x: 3, y: 4, district: 'middle', displayName: 'Middle Mornay — Lower East',              waterEdges: ['east'], reserves: ['residences and workshops'] }),
  Object.freeze({ id: 'MORNAY_SOUTH_UPPER_WEST_MAP',               x: 1, y: 5, district: 'south',  displayName: 'South Mornay — Upper West',               reserves: ['inn and ordinary shops'] }),
  Object.freeze({ id: 'MORNAY_SOUTH_UPPER_EAST_MAP',               x: 2, y: 5, district: 'south',  displayName: 'South Mornay — Upper East',               reserves: ['southern market and traveller services'] }),
  Object.freeze({ id: 'MORNAY_WEST_GATE_MAP',                      x: 1, y: 6, district: 'south',  displayName: 'Mornay — West Gate',                      gate: 'west', reserves: ['arrival yard'] }),
  Object.freeze({ id: 'MORNAY_EAST_GATE_MAP',                      x: 2, y: 6, district: 'south',  displayName: 'Mornay — East Gate',                      gate: 'east', reserves: ['freight yard'] }),
]);

const MORNAY_TOWN_MAP_IDS = Object.freeze(MORNAY_TOWN_LAYOUT.map((d) => d.id));
const _MORNAY_TOWN_BY_ID = Object.freeze(Object.fromEntries(MORNAY_TOWN_LAYOUT.map((d) => [d.id, d])));
const _MORNAY_TOWN_BY_COORD = Object.freeze(Object.fromEntries(MORNAY_TOWN_LAYOUT.map((d) => [d.x + ',' + d.y, d.id])));
const _MORNAY_DIRECTION_DELTA = Object.freeze({ north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] });

function mornayTownDefinition(mapId) {
  return Object.prototype.hasOwnProperty.call(_MORNAY_TOWN_BY_ID, mapId) ? _MORNAY_TOWN_BY_ID[mapId] : null;
}

function mornayTownNeighbor(mapId, direction) {
  const def = mornayTownDefinition(mapId);
  const delta = _MORNAY_DIRECTION_DELTA[direction];
  if (!def || !delta) return null;
  return _MORNAY_TOWN_BY_COORD[(def.x + delta[0]) + ',' + (def.y + delta[1])] || null;
}

function _mornayFillRect(grid, row0, row1, col0, col1, tile) {
  for (let row = row0; row <= row1; row++) {
    for (let col = col0; col <= col1; col++) grid[row][col] = tile;
  }
}

// One authority for doors, rooms, return placement and discrete location context.
// The historic town skeleton and its boundary graph remain independent.
const MORNAY_BUILDINGS = Object.freeze([
  {
    "key": "office",
    "id": "mornay_office",
    "mapId": "MORNAY_OFFICE_MAP",
    "name": "Regional IJC Office",
    "sourceMapId": "MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP",
    "doorCol": 3,
    "doorRow": 5,
    "returnCol": 3,
    "returnRow": 6,
    "facing": "down",
    "kind": "office"
  },
  {
    "key": "infirmary",
    "id": "mornay_infirmary",
    "mapId": "MORNAY_INFIRMARY_MAP",
    "name": "Mornay Infirmary",
    "sourceMapId": "MORNAY_SOUTH_UPPER_WEST_MAP",
    "doorCol": 12,
    "doorRow": 5,
    "returnCol": 12,
    "returnRow": 6,
    "facing": "down",
    "kind": "infirmary"
  },
  {
    "key": "provisioner",
    "id": "mornay_provisioner",
    "mapId": "MORNAY_PROVISIONER_MAP",
    "name": "Kelm Provisions",
    "sourceMapId": "MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP",
    "doorCol": 3,
    "doorRow": 5,
    "returnCol": 3,
    "returnRow": 6,
    "facing": "down",
    "kind": "shop"
  },
  {
    "key": "apothecary",
    "id": "mornay_apothecary",
    "mapId": "MORNAY_APOTHECARY_MAP",
    "name": "Stern Apothecary",
    "sourceMapId": "MORNAY_SOUTH_UPPER_EAST_MAP",
    "doorCol": 3,
    "doorRow": 5,
    "returnCol": 3,
    "returnRow": 6,
    "facing": "down",
    "kind": "shop"
  },
  {
    "key": "workgear",
    "id": "mornay_workgear",
    "mapId": "MORNAY_WORKGEAR_MAP",
    "name": "Sorn Work Gear",
    "sourceMapId": "MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP",
    "doorCol": 3,
    "doorRow": 5,
    "returnCol": 3,
    "returnRow": 6,
    "facing": "down",
    "kind": "shop"
  },
  {
    "key": "chandler",
    "id": "mornay_chandler",
    "mapId": "MORNAY_CHANDLER_MAP",
    "name": "Venn Chandlery and Secondhand",
    "sourceMapId": "MORNAY_NORTH_LOWER_EAST_MAP",
    "doorCol": 11,
    "doorRow": 5,
    "returnCol": 11,
    "returnRow": 6,
    "facing": "down",
    "kind": "shop"
  },
  {
    "key": "gate_inn",
    "id": "mornay_gate_inn",
    "mapId": "MORNAY_GATE_INN_MAP",
    "name": "Wold's Gate Inn",
    "sourceMapId": "MORNAY_WEST_GATE_MAP",
    "doorCol": 3,
    "doorRow": 5,
    "returnCol": 3,
    "returnRow": 6,
    "facing": "down",
    "kind": "inn"
  },
  {
    "key": "gate_beds",
    "id": "mornay_gate_beds",
    "mapId": "MORNAY_GATE_BEDS_MAP",
    "name": "Gate Inn Shared Rooms",
    "sourceMapId": "MORNAY_GATE_INN_MAP",
    "doorCol": 7,
    "doorRow": 1,
    "returnCol": 7,
    "returnRow": 2,
    "facing": "down",
    "kind": "lodging"
  },
  {
    "key": "commercial_inn",
    "id": "mornay_commercial_inn",
    "mapId": "MORNAY_COMMERCIAL_INN_MAP",
    "name": "Ledger House",
    "sourceMapId": "MORNAY_NORTH_UPPER_WEST_MAP",
    "doorCol": 11,
    "doorRow": 5,
    "returnCol": 11,
    "returnRow": 6,
    "facing": "down",
    "kind": "inn"
  },
  {
    "key": "commercial_beds",
    "id": "mornay_commercial_beds",
    "mapId": "MORNAY_COMMERCIAL_BEDS_MAP",
    "name": "Ledger House Rooms",
    "sourceMapId": "MORNAY_COMMERCIAL_INN_MAP",
    "doorCol": 7,
    "doorRow": 1,
    "returnCol": 7,
    "returnRow": 2,
    "facing": "down",
    "kind": "lodging"
  },
  {
    "key": "school",
    "id": "mornay_school",
    "mapId": "MORNAY_SCHOOL_MAP",
    "name": "South Ward School",
    "sourceMapId": "MORNAY_SOUTH_UPPER_EAST_MAP",
    "doorCol": 12,
    "doorRow": 5,
    "returnCol": 12,
    "returnRow": 6,
    "facing": "down",
    "kind": "school"
  },
  {
    "key": "harbour",
    "id": "mornay_harbour",
    "mapId": "MORNAY_HARBOUR_MAP",
    "name": "Harbour and Customs Public Room",
    "sourceMapId": "MORNAY_NORTH_LOWER_WEST_MAP",
    "doorCol": 11,
    "doorRow": 5,
    "returnCol": 11,
    "returnRow": 6,
    "facing": "down",
    "kind": "office"
  },
  {
    "key": "warehouse",
    "id": "mornay_warehouse",
    "mapId": "MORNAY_WAREHOUSE_MAP",
    "name": "Fen Warehouse",
    "sourceMapId": "MORNAY_MIDDLE_UPPER_WEST_MAP",
    "doorCol": 3,
    "doorRow": 5,
    "returnCol": 3,
    "returnRow": 6,
    "facing": "down",
    "kind": "warehouse"
  },
  {
    "key": "workshop",
    "id": "mornay_workshop",
    "mapId": "MORNAY_WORKSHOP_MAP",
    "name": "Rusk Workshop Court",
    "sourceMapId": "MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP",
    "doorCol": 12,
    "doorRow": 5,
    "returnCol": 12,
    "returnRow": 6,
    "facing": "down",
    "kind": "workshop"
  },
  {
    "key": "laundry",
    "id": "mornay_laundry",
    "mapId": "MORNAY_LAUNDRY_MAP",
    "name": "Quill Laundry",
    "sourceMapId": "MORNAY_MIDDLE_LOWER_EAST_MAP",
    "doorCol": 3,
    "doorRow": 5,
    "returnCol": 3,
    "returnRow": 6,
    "facing": "down",
    "kind": "laundry"
  },
  {
    "key": "boarding",
    "id": "mornay_boarding",
    "mapId": "MORNAY_BOARDING_MAP",
    "name": "Hume Boardinghouse",
    "sourceMapId": "MORNAY_SOUTH_UPPER_WEST_MAP",
    "doorCol": 3,
    "doorRow": 10,
    "returnCol": 3,
    "returnRow": 9,
    "facing": "up",
    "kind": "boarding"
  },
  {
    "key": "court",
    "id": "mornay_court",
    "mapId": "MORNAY_COURT_MAP",
    "name": "East Ward Shared Court",
    "sourceMapId": "MORNAY_MIDDLE_LOWER_EAST_MAP",
    "doorCol": 3,
    "doorRow": 9,
    "returnCol": 3,
    "returnRow": 8,
    "facing": "up",
    "kind": "corridor"
  },
  {
    "key": "glyn_home",
    "id": "mornay_glyn_home",
    "mapId": "MORNAY_GLYN_HOME_MAP",
    "name": "Glyn Household",
    "sourceMapId": "MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP",
    "doorCol": 3,
    "doorRow": 5,
    "returnCol": 3,
    "returnRow": 6,
    "facing": "down",
    "kind": "house",
    "housing": "modest",
    "sign": "GLYN HOME"
  },
  {
    "key": "reed_home",
    "id": "mornay_reed_home",
    "mapId": "MORNAY_REED_HOME_MAP",
    "name": "Reed’s Net Room",
    "sourceMapId": "MORNAY_MIDDLE_UPPER_EAST_MAP",
    "doorCol": 3,
    "doorRow": 9,
    "returnCol": 3,
    "returnRow": 8,
    "facing": "up",
    "kind": "house",
    "housing": "modest",
    "sign": "REED’S NET ROOM"
  },
  {
    "key": "pate_home",
    "id": "mornay_pate_home",
    "mapId": "MORNAY_PATE_HOME_MAP",
    "name": "Pate’s Kitchen",
    "sourceMapId": "MORNAY_SOUTH_UPPER_WEST_MAP",
    "doorCol": 12,
    "doorRow": 10,
    "returnCol": 12,
    "returnRow": 9,
    "facing": "up",
    "kind": "house",
    "housing": "modest",
    "sign": "PATE’S KITCHEN"
  },
  {
    "key": "rann_home",
    "id": "mornay_rann_home",
    "mapId": "MORNAY_RANN_HOME_MAP",
    "name": "Rann Workroom House",
    "sourceMapId": "MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP",
    "doorCol": 12,
    "doorRow": 5,
    "returnCol": 12,
    "returnRow": 6,
    "facing": "down",
    "kind": "house",
    "housing": "modest",
    "sign": "RANN WORKROOM"
  },
  {
    "key": "vale_home",
    "id": "mornay_vale_home",
    "mapId": "MORNAY_VALE_HOME_MAP",
    "name": "Vale House",
    "sourceMapId": "MORNAY_NORTH_UPPER_WEST_MAP",
    "doorCol": 11,
    "doorRow": 8,
    "returnCol": 11,
    "returnRow": 7,
    "facing": "up",
    "kind": "house",
    "housing": "comfortable",
    "sign": "VALE HOUSE"
  },
  {
    "key": "dane_home",
    "id": "mornay_dane_home",
    "mapId": "MORNAY_DANE_HOME_MAP",
    "name": "Examiner’s House",
    "sourceMapId": "MORNAY_NORTH_UPPER_EAST_MAP",
    "doorCol": 3,
    "doorRow": 8,
    "returnCol": 3,
    "returnRow": 7,
    "facing": "up",
    "kind": "house",
    "housing": "comfortable",
    "sign": "EXAMINER’S HOUSE"
  },
  {
    "key": "dock_steps",
    "id": "mornay_dock_steps",
    "mapId": "MORNAY_DOCK_STEPS_MAP",
    "name": "Dock Steps Tenement",
    "sourceMapId": "MORNAY_MIDDLE_UPPER_WEST_MAP",
    "doorCol": 3,
    "doorRow": 9,
    "returnCol": 3,
    "returnRow": 8,
    "facing": "up",
    "kind": "corridor",
    "sign": "DOCK STEPS"
  },
  {
    "key": "south_rows",
    "id": "mornay_south_rows",
    "mapId": "MORNAY_SOUTH_ROWS_MAP",
    "name": "South Rows Tenement — Ground Floor",
    "sourceMapId": "MORNAY_SOUTH_UPPER_EAST_MAP",
    "doorCol": 3,
    "doorRow": 10,
    "returnCol": 3,
    "returnRow": 9,
    "facing": "up",
    "kind": "corridor",
    "sign": "SOUTH ROWS"
  },
  {
    "key": "court_unit_1",
    "id": "mornay_court_unit_1",
    "mapId": "MORNAY_COURT_UNIT_1_MAP",
    "name": "East Ward Shared Court — Flat 1",
    "sourceMapId": "MORNAY_COURT_MAP",
    "doorCol": 2,
    "doorRow": 4,
    "returnCol": 2,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 1,
    "sign": "1"
  },
  {
    "key": "court_unit_2",
    "id": "mornay_court_unit_2",
    "mapId": "MORNAY_COURT_UNIT_2_MAP",
    "name": "East Ward Shared Court — Flat 2",
    "sourceMapId": "MORNAY_COURT_MAP",
    "doorCol": 5,
    "doorRow": 4,
    "returnCol": 5,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 2,
    "sign": "2"
  },
  {
    "key": "court_unit_3",
    "id": "mornay_court_unit_3",
    "mapId": "MORNAY_COURT_UNIT_3_MAP",
    "name": "East Ward Shared Court — Flat 3",
    "sourceMapId": "MORNAY_COURT_MAP",
    "doorCol": 10,
    "doorRow": 4,
    "returnCol": 10,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 3,
    "sign": "3"
  },
  {
    "key": "court_unit_4",
    "id": "mornay_court_unit_4",
    "mapId": "MORNAY_COURT_UNIT_4_MAP",
    "name": "East Ward Shared Court — Flat 4",
    "sourceMapId": "MORNAY_COURT_MAP",
    "doorCol": 13,
    "doorRow": 4,
    "returnCol": 13,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 4,
    "sign": "4"
  },
  {
    "key": "dock_steps_unit_1",
    "id": "mornay_dock_steps_unit_1",
    "mapId": "MORNAY_DOCK_STEPS_UNIT_1_MAP",
    "name": "Dock Steps Tenement — Flat 1",
    "sourceMapId": "MORNAY_DOCK_STEPS_MAP",
    "doorCol": 2,
    "doorRow": 4,
    "returnCol": 2,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 1,
    "sign": "1"
  },
  {
    "key": "dock_steps_unit_2",
    "id": "mornay_dock_steps_unit_2",
    "mapId": "MORNAY_DOCK_STEPS_UNIT_2_MAP",
    "name": "Dock Steps Tenement — Flat 2",
    "sourceMapId": "MORNAY_DOCK_STEPS_MAP",
    "doorCol": 5,
    "doorRow": 4,
    "returnCol": 5,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 2,
    "sign": "2"
  },
  {
    "key": "dock_steps_unit_3",
    "id": "mornay_dock_steps_unit_3",
    "mapId": "MORNAY_DOCK_STEPS_UNIT_3_MAP",
    "name": "Dock Steps Tenement — Flat 3",
    "sourceMapId": "MORNAY_DOCK_STEPS_MAP",
    "doorCol": 10,
    "doorRow": 4,
    "returnCol": 10,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 3,
    "sign": "3"
  },
  {
    "key": "dock_steps_unit_4",
    "id": "mornay_dock_steps_unit_4",
    "mapId": "MORNAY_DOCK_STEPS_UNIT_4_MAP",
    "name": "Dock Steps Tenement — Flat 4",
    "sourceMapId": "MORNAY_DOCK_STEPS_MAP",
    "doorCol": 13,
    "doorRow": 4,
    "returnCol": 13,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 4,
    "sign": "4"
  },
  {
    "key": "south_rows_unit_1",
    "id": "mornay_south_rows_unit_1",
    "mapId": "MORNAY_SOUTH_ROWS_UNIT_1_MAP",
    "name": "South Rows — Unit 1",
    "sourceMapId": "MORNAY_SOUTH_ROWS_MAP",
    "doorCol": 2,
    "doorRow": 4,
    "returnCol": 2,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 1,
    "sign": "1"
  },
  {
    "key": "south_rows_unit_2",
    "id": "mornay_south_rows_unit_2",
    "mapId": "MORNAY_SOUTH_ROWS_UNIT_2_MAP",
    "name": "South Rows — Unit 2",
    "sourceMapId": "MORNAY_SOUTH_ROWS_MAP",
    "doorCol": 5,
    "doorRow": 4,
    "returnCol": 5,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 2,
    "sign": "2"
  },
  {
    "key": "south_rows_unit_3",
    "id": "mornay_south_rows_unit_3",
    "mapId": "MORNAY_SOUTH_ROWS_UNIT_3_MAP",
    "name": "South Rows — Unit 3",
    "sourceMapId": "MORNAY_SOUTH_ROWS_MAP",
    "doorCol": 10,
    "doorRow": 4,
    "returnCol": 10,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 3,
    "sign": "3"
  },
  {
    "key": "south_rows_unit_4",
    "id": "mornay_south_rows_unit_4",
    "mapId": "MORNAY_SOUTH_ROWS_UNIT_4_MAP",
    "name": "South Rows — Unit 4",
    "sourceMapId": "MORNAY_SOUTH_ROWS_MAP",
    "doorCol": 13,
    "doorRow": 4,
    "returnCol": 13,
    "returnRow": 5,
    "facing": "down",
    "kind": "flat",
    "unit": 4,
    "sign": "4"
  },
  {
    "key": "boarding_unit_1",
    "id": "mornay_boarding_unit_1",
    "mapId": "MORNAY_BOARDING_UNIT_1_MAP",
    "name": "Hume Boardinghouse — Room 1",
    "sourceMapId": "MORNAY_BOARDING_MAP",
    "doorCol": 2,
    "doorRow": 3,
    "returnCol": 2,
    "returnRow": 4,
    "facing": "down",
    "kind": "bedsit",
    "unit": 1,
    "sign": "1"
  },
  {
    "key": "boarding_unit_2",
    "id": "mornay_boarding_unit_2",
    "mapId": "MORNAY_BOARDING_UNIT_2_MAP",
    "name": "Hume Boardinghouse — Room 2",
    "sourceMapId": "MORNAY_BOARDING_MAP",
    "doorCol": 5,
    "doorRow": 3,
    "returnCol": 5,
    "returnRow": 4,
    "facing": "down",
    "kind": "bedsit",
    "unit": 2,
    "sign": "2"
  },
  {
    "key": "boarding_unit_3",
    "id": "mornay_boarding_unit_3",
    "mapId": "MORNAY_BOARDING_UNIT_3_MAP",
    "name": "Hume Boardinghouse — Room 3",
    "sourceMapId": "MORNAY_BOARDING_MAP",
    "doorCol": 10,
    "doorRow": 3,
    "returnCol": 10,
    "returnRow": 4,
    "facing": "down",
    "kind": "bedsit",
    "unit": 3,
    "sign": "3"
  },
  {
    "key": "boarding_unit_4",
    "id": "mornay_boarding_unit_4",
    "mapId": "MORNAY_BOARDING_UNIT_4_MAP",
    "name": "Hume Boardinghouse — Room 4",
    "sourceMapId": "MORNAY_BOARDING_MAP",
    "doorCol": 13,
    "doorRow": 3,
    "returnCol": 13,
    "returnRow": 4,
    "facing": "down",
    "kind": "bedsit",
    "unit": 4,
    "sign": "4"
  },
  {
    "key": "kelm_home",
    "id": "mornay_kelm_home",
    "mapId": "MORNAY_KELM_HOME_MAP",
    "name": "Kelm Family Rooms",
    "sourceMapId": "MORNAY_PROVISIONER_MAP",
    "doorCol": 7,
    "doorRow": 1,
    "returnCol": 7,
    "returnRow": 2,
    "facing": "down",
    "kind": "house",
    "housing": "modest",
    "connection": "stairs",
    "sign": "HOME UP"
  },
  {
    "key": "stern_home",
    "id": "mornay_stern_home",
    "mapId": "MORNAY_STERN_HOME_MAP",
    "name": "Stern Family Rooms",
    "sourceMapId": "MORNAY_APOTHECARY_MAP",
    "doorCol": 7,
    "doorRow": 1,
    "returnCol": 7,
    "returnRow": 2,
    "facing": "down",
    "kind": "house",
    "housing": "modest",
    "connection": "stairs",
    "sign": "HOME UP"
  },
  {
    "key": "sorn_home",
    "id": "mornay_sorn_home",
    "mapId": "MORNAY_SORN_HOME_MAP",
    "name": "Sorn Family Rooms",
    "sourceMapId": "MORNAY_WORKGEAR_MAP",
    "doorCol": 7,
    "doorRow": 1,
    "returnCol": 7,
    "returnRow": 2,
    "facing": "down",
    "kind": "house",
    "housing": "modest",
    "connection": "stairs",
    "sign": "HOME UP"
  },
  ...[2,3].map(floor => ({
    key:'south_rows_floor_'+floor, id:'mornay_south_rows_floor_'+floor,
    mapId:'MORNAY_SOUTH_ROWS_FLOOR_'+floor+'_MAP',
    name:'South Rows Tenement — Floor '+floor,
    sourceMapId:floor===2?'MORNAY_SOUTH_ROWS_MAP':'MORNAY_SOUTH_ROWS_FLOOR_2_MAP',
    doorCol:14,doorRow:6,returnCol:14,returnRow:7,facing:'down',
    kind:'corridor',connection:'stairs',sign:'UP',tenementFloor:floor
  })),
  ...Array.from({length:20},(_,i)=>{
    const unit=i+5,floor=Math.ceil(unit/8),slot=(unit-1)%8,lower=slot>=4;
    return {key:'south_rows_unit_'+unit,id:'mornay_south_rows_unit_'+unit,
      mapId:'MORNAY_SOUTH_ROWS_UNIT_'+unit+'_MAP',name:'South Rows — Unit '+unit,
      sourceMapId:floor===1?'MORNAY_SOUTH_ROWS_MAP':'MORNAY_SOUTH_ROWS_FLOOR_'+floor+'_MAP',
      doorCol:[2,5,10,13][slot%4],doorRow:lower?10:4,
      returnCol:[2,5,10,13][slot%4],returnRow:lower?9:5,facing:lower?'up':'down',
      kind:'flat',unit,tiny:true,sign:String(unit)};
  }),
  {key:'south_rows_attic',id:'mornay_south_rows_attic',mapId:'MORNAY_SOUTH_ROWS_ATTIC_MAP',
    name:'South Rows — Attic',sourceMapId:'MORNAY_SOUTH_ROWS_FLOOR_3_MAP',
    doorCol:1,doorRow:6,returnCol:1,returnRow:7,facing:'down',
    kind:'attic',connection:'hatch',sign:''},
  {key: "watchhouse", id: "mornay_watchhouse", mapId: "MORNAY_WATCHHOUSE_MAP",
    name: "South Mornay Watchhouse & Jail", sourceMapId: "MORNAY_SOUTH_UPPER_EAST_MAP",
    doorCol:12, doorRow:10, returnCol:12, returnRow:9, facing:"up", kind:"watchhouse"}

].map(b => Object.freeze(b)));

const MORNAY_RESIDENTIAL_FACADES = Object.freeze([
  {
    "mapId": "MORNAY_SOUTH_UPPER_WEST_MAP",
    "col": 2,
    "row": 5,
    "units": 1
  },
  {
    "mapId": "MORNAY_EAST_GATE_MAP",
    "col": 3,
    "row": 5,
    "units": 1
  },
  {
    "mapId": "MORNAY_WEST_GATE_MAP",
    "col": 12,
    "row": 10,
    "units": 3
  },
  {
    "mapId": "MORNAY_MIDDLE_LOWER_EAST_MAP",
    "col": 12,
    "row": 5,
    "units": 3
  },
  {
    "mapId": "MORNAY_MIDDLE_LOWER_EAST_MAP",
    "col": 12,
    "row": 9,
    "units": 1
  },
  {
    "mapId": "MORNAY_MIDDLE_UPPER_EAST_MAP",
    "col": 4,
    "row": 5,
    "units": 1
  },
  {
    "mapId": "MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP",
    "col": 3,
    "row": 9,
    "units": 1
  },
  {
    "mapId": "MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP",
    "col": 12,
    "row": 9,
    "units": 1
  },
  {
    "mapId": "MORNAY_NORTH_LOWER_EAST_MAP",
    "col": 3,
    "row": 5,
    "units": 3
  },
  {
    "mapId": "MORNAY_NORTH_UPPER_EAST_MAP",
    "col": 12,
    "row": 8,
    "units": 1
  },
  {
    "mapId": "MORNAY_NORTH_UPPER_WEST_MAP",
    "col": 3,
    "row": 6,
    "units": 1
  }
].map(f => Object.freeze(f)));
function mornayBuilding(id) { return MORNAY_BUILDINGS.find(b => b.id === id) || null; }
function mornayRoomForMap(mapId) { return MORNAY_BUILDINGS.find(b => b.mapId === mapId) || null; }
function mornayDoorAt(mapId, col, row) {
  return MORNAY_BUILDINGS.find(b => b.sourceMapId === mapId && b.doorCol === col && b.doorRow === row) || null;
}
// The source approach determines which side of the room contains its entrance.
// Keep the grid and arrival in agreement; no input- or map-specific exceptions.
function mornayInteriorEntrance(building) {
  const north = building.returnRow < building.doorRow;
  return { col: 7, exitRow: north ? 0 : 14, arrivalRow: north ? 1 : 13,
    facing: north ? 'down' : 'up' };
}
function mornayContentKey(mapId) { return 'mornay:' + mapId.toLowerCase(); }

function _mornayBuildExterior(def) {
  const base = def.district === 'south' ? TOWN_FLOOR
    : def.district === 'fort' ? EXPOSED_STONE
      : TOWN_FLOOR;
  const grid = Array.from({ length: 15 }, (_, row) =>
    Array.from({ length: 16 }, (_, col) =>
      row === 0 || row === 14 || col === 0 || col === 15 ? TOWN_BUILDING : base));

  // District massing. Roads remain a connected cross through every screen;
  // explicit registered doors open only the populated public rooms below.
  if (def.district === 'south') {
    _mornayFillRect(grid, 2, 5, 1, 4, TOWN_BUILDING);
    _mornayFillRect(grid, 2, 5, 11, 14, TOWN_BUILDING);
    _mornayFillRect(grid, 10, 12, 1, 5, TOWN_BUILDING);
    _mornayFillRect(grid, 10, 12, 10, 14, TOWN_BUILDING);
    _mornayFillRect(grid, 6, 8, 1, 14, TOWN_FLOOR);
    _mornayFillRect(grid, 1, 13, 6, 9, TOWN_FLOOR);
  } else if (def.district === 'middle') {
    _mornayFillRect(grid, 1, 5, 1, 5, TOWN_BUILDING);
    _mornayFillRect(grid, 1, 5, 10, 14, TOWN_BUILDING);
    _mornayFillRect(grid, 9, 13, 1, 5, TOWN_BUILDING);
    _mornayFillRect(grid, 9, 13, 10, 14, TOWN_BUILDING);
    _mornayFillRect(grid, 6, 8, 1, 14, TOWN_FLOOR);
    _mornayFillRect(grid, 1, 13, 6, 9, TOWN_FLOOR);
    if (def.market) _mornayFillRect(grid, 5, 9, 5, 10, TOWN_MARKET);
  } else if (def.district === 'north') {
    _mornayFillRect(grid, 1, 6, 1, 5, TOWN_BUILDING);
    _mornayFillRect(grid, 1, 6, 10, 14, TOWN_BUILDING);
    _mornayFillRect(grid, 8, 13, 1, 5, TOWN_BUILDING);
    _mornayFillRect(grid, 8, 13, 10, 14, TOWN_BUILDING);
    _mornayFillRect(grid, 7, 7, 1, 14, TOWN_FLOOR);
    _mornayFillRect(grid, 1, 13, 7, 8, TOWN_FLOOR);
    // Practical harbour planking. These are ordinary walkable tiles with no
    // interaction or transition authority; the two berths remain inert.
    if (def.reserves.includes('story ship berth')) {
      _mornayFillRect(grid, 9, 10, 1, 3, BRIDGE_DECK);
      _mornayFillRect(grid, 9, 10, 4, 6, TOWN_FLOOR);
    }
    if (def.reserves.includes('inert island ferry berth')) {
      _mornayFillRect(grid, 4, 5, 1, 3, BRIDGE_DECK);
      _mornayFillRect(grid, 4, 5, 4, 6, TOWN_FLOOR);
    }
  } else {
    // Weathered local fort: exposed-stone approach, a compact wall and one
    // open southern gate into the courtyard. It remains one connected space.
    _mornayFillRect(grid, 2, 2, 3, 12, TOWN_BUILDING);
    _mornayFillRect(grid, 11, 11, 3, 12, TOWN_BUILDING);
    _mornayFillRect(grid, 2, 11, 3, 3, TOWN_BUILDING);
    _mornayFillRect(grid, 2, 11, 12, 12, TOWN_BUILDING);
    _mornayFillRect(grid, 3, 10, 4, 11, EXPOSED_STONE);
    grid[11][7] = TOWN_FLOOR;
    grid[11][8] = TOWN_FLOOR;
    _mornayFillRect(grid, 3, 10, 7, 8, TOWN_FLOOR);
  }

  // Visible perimeter authority: water on authored shore edges, otherwise
  // solid town fabric/walls. No map relies on an out-of-bounds invisible wall.
  for (const edge of def.waterEdges || []) {
    if (edge === 'north') for (let col = 0; col < 16; col++) grid[0][col] = WATER;
    if (edge === 'south') for (let col = 0; col < 16; col++) grid[14][col] = WATER;
    if (edge === 'west') for (let row = 0; row < 15; row++) grid[row][0] = WATER;
    if (edge === 'east') for (let row = 0; row < 15; row++) grid[row][15] = WATER;
  }

  // Each real adjacency gets one conventional legacy-town boundary tile and a
  // two-tile-wide interior approach. The target landing is one full tile in.
  if (mornayTownNeighbor(def.id, 'north')) {
    grid[0][7] = NORTH_EXIT;
    for (let row = 1; row <= 7; row++) grid[row][7] = grid[row][8] = TOWN_FLOOR;
  }
  if (mornayTownNeighbor(def.id, 'south')) {
    grid[14][7] = NORTH_ENTRANCE;
    for (let row = 7; row <= 13; row++) grid[row][7] = grid[row][8] = TOWN_FLOOR;
  }
  if (mornayTownNeighbor(def.id, 'west')) {
    grid[7][0] = MAP2_ENTRANCE;
    for (let col = 1; col <= 7; col++) grid[7][col] = TOWN_FLOOR;
  }
  if (mornayTownNeighbor(def.id, 'east')) {
    grid[7][15] = MAP2_EXIT;
    for (let col = 7; col <= 14; col++) grid[7][col] = TOWN_FLOOR;
  }
  if (def.gate) {
    grid[14][7] = TOWN_EXIT;
    for (let row = 7; row <= 13; row++) grid[row][7] = grid[row][8] = TOWN_FLOOR;
  }
  for (const b of MORNAY_BUILDINGS.filter(b => b.sourceMapId === def.id)) {
    grid[b.doorRow][b.doorCol] = HOUSE_DOOR;
    grid[b.returnRow][b.returnCol] = TOWN_FLOOR;
  }
  return grid;
}

const MORNAY_EXTERIOR_MAPS = Object.freeze(Object.fromEntries(
  MORNAY_TOWN_LAYOUT.map((def) => [def.id, _mornayBuildExterior(def)]),
));

const {
  MORNAY_OLD_FORT_MAP,
  MORNAY_NORTH_UPPER_WEST_MAP,
  MORNAY_NORTH_UPPER_EAST_MAP,
  MORNAY_NORTH_LOWER_WEST_MAP,
  MORNAY_NORTH_LOWER_EAST_MAP,
  MORNAY_MIDDLE_UPPER_WEST_MAP,
  MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP,
  MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP,
  MORNAY_MIDDLE_UPPER_EAST_MAP,
  MORNAY_MIDDLE_LOWER_WEST_MAP,
  MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP,
  MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP,
  MORNAY_MIDDLE_LOWER_EAST_MAP,
  MORNAY_SOUTH_UPPER_WEST_MAP,
  MORNAY_SOUTH_UPPER_EAST_MAP,
  MORNAY_WEST_GATE_MAP,
  MORNAY_EAST_GATE_MAP,
} = MORNAY_EXTERIOR_MAPS;

// Discrete town maps follow the established legacy map export convention.
for (const id of MORNAY_TOWN_MAP_IDS) window[id] = MORNAY_EXTERIOR_MAPS[id];
window.MORNAY_TOWN_LAYOUT = MORNAY_TOWN_LAYOUT;
window.MORNAY_TOWN_MAP_IDS = MORNAY_TOWN_MAP_IDS;
window.MORNAY_EXTERIOR_MAPS = MORNAY_EXTERIOR_MAPS;
window.mornayTownDefinition = mornayTownDefinition;
window.mornayTownNeighbor = mornayTownNeighbor;

// Shared fixture geometry is the collision and rendering authority. Public-room
// furniture follows the established Calwick/Drenwick vocabulary; apartments use
// compact plans, with a clear entrance stem and individually registered doors.
const MORNAY_ROOM_FIXTURES = Object.freeze({
  mornay_watchhouse: [
    {kind:'desk',col:10,row:3}, {kind:'cabinet',col:1,row:2},
    {kind:'cargo',col:13,row:2}, {kind:'table',col:3,row:4},
    {kind:'bench',col:1,row:5}, {kind:'bench',col:2,row:5},
    // The full-width security screen has no transition or unlock state.
    ...Array.from({length:14},(_,i)=>({kind:i===5?'barredDoor':'bars',col:i+1,row:6})),
    // Rear corridor, two communal cells, two individual cells, enclosed yard.
    ...[5,7,11].flatMap(col=>Array.from({length:7},(_,i)=>({
      kind:(col===11?i===1:i===1||i===6)?'barredDoor':'bars',axis:'vertical',col,row:i+7}))),
    ...[1,2,3,4].flatMap(col=>[9,12].map(row=>({kind:'homebed',col,row}))),
    {kind:'homebed',col:9,row:9}, {kind:'homebed',col:9,row:12},
    {kind:'bench',col:13,row:8}, {kind:'cargo',col:12,row:12},
    {kind:'privy',col:14,row:12}
  ],
  "mornay_kelm_home": [{"kind":"homebed","col":3,"row":5},{"kind":"homebed","col":4,"row":5},{"kind":"dresser","col":5,"row":5},{"kind":"stove","col":12,"row":5},{"kind":"supply","col":13,"row":5},{"kind":"table","col":10,"row":9},{"kind":"supply","col":12,"row":11}],
  "mornay_stern_home": [{"kind":"homebed","col":11,"row":5},{"kind":"homebed","col":12,"row":5},{"kind":"dresser","col":10,"row":5},{"kind":"desk","col":3,"row":5},{"kind":"cabinet","col":4,"row":5},{"kind":"stove","col":3,"row":10},{"kind":"table","col":10,"row":9}],
  "mornay_sorn_home": [{"kind":"homebed","col":3,"row":5},{"kind":"homebed","col":4,"row":5},{"kind":"homebed","col":11,"row":5},{"kind":"dresser","col":12,"row":5},{"kind":"bench","col":11,"row":8},{"kind":"table","col":5,"row":10},{"kind":"stove","col":2,"row":11},{"kind":"supply","col":13,"row":11}],
  "mornay_office": [{"kind":"desk","col":3,"row":3},{"kind":"desk","col":11,"row":3},{"kind":"desk","col":2,"row":7},{"kind":"desk","col":5,"row":7},{"kind":"desk","col":10,"row":7},{"kind":"desk","col":13,"row":7},{"kind":"cabinet","col":1,"row":2},{"kind":"cabinet","col":5,"row":2},{"kind":"cabinet","col":13,"row":2},{"kind":"cabinet","col":14,"row":10},{"kind":"table","col":3,"row":11}],
  "mornay_infirmary": [{"kind":"bed","col":1,"row":5,"w":2},{"kind":"bed","col":4,"row":5,"w":2},{"kind":"bed","col":10,"row":5,"w":2},{"kind":"bed","col":13,"row":5,"w":2},{"kind":"bed","col":1,"row":9,"w":2},{"kind":"bed","col":4,"row":9,"w":2},{"kind":"bed","col":10,"row":9,"w":2},{"kind":"bed","col":13,"row":9,"w":2},{"kind":"supply","col":1,"row":2},{"kind":"supply","col":2,"row":2},{"kind":"desk","col":5,"row":3},{"kind":"supply","col":13,"row":2},{"kind":"stove","col":14,"row":12}],
  "mornay_provisioner": [{"kind":"counter","col":3,"row":4},{"kind":"counter","col":4,"row":4},{"kind":"counter","col":5,"row":4},{"kind":"supply","col":1,"row":2},{"kind":"supply","col":2,"row":2},{"kind":"supply","col":11,"row":2},{"kind":"supply","col":12,"row":2},{"kind":"cargo","col":12,"row":6},{"kind":"cargo","col":13,"row":6},{"kind":"table","col":3,"row":10}],
  "mornay_apothecary": [{"kind":"counter","col":10,"row":4},{"kind":"counter","col":11,"row":4},{"kind":"counter","col":12,"row":4},{"kind":"supply","col":12,"row":2},{"kind":"supply","col":13,"row":2},{"kind":"supply","col":2,"row":2},{"kind":"desk","col":3,"row":6},{"kind":"tub","col":2,"row":10},{"kind":"cabinet","col":13,"row":9}],
  "mornay_workgear": [{"kind":"counter","col":3,"row":5},{"kind":"counter","col":4,"row":5},{"kind":"counter","col":5,"row":5},{"kind":"bench","col":11,"row":4},{"kind":"bench","col":12,"row":4},{"kind":"supply","col":2,"row":2},{"kind":"supply","col":5,"row":2},{"kind":"bench","col":12,"row":9},{"kind":"cargo","col":2,"row":10}],
  "mornay_chandler": [{"kind":"counter","col":10,"row":5},{"kind":"counter","col":11,"row":5},{"kind":"counter","col":12,"row":5},{"kind":"cargo","col":2,"row":2},{"kind":"cargo","col":3,"row":2},{"kind":"bench","col":3,"row":6},{"kind":"supply","col":13,"row":2},{"kind":"table","col":11,"row":10},{"kind":"cargo","col":2,"row":11}],
  "mornay_gate_inn": [{"kind":"counter","col":2,"row":4},{"kind":"counter","col":3,"row":4},{"kind":"stove","col":1,"row":2},{"kind":"supply","col":4,"row":2},{"kind":"table","col":4,"row":7},{"kind":"table","col":11,"row":4},{"kind":"table","col":11,"row":9},{"kind":"table","col":3,"row":11}],
  "mornay_commercial_inn": [{"kind":"counter","col":11,"row":4},{"kind":"counter","col":12,"row":4},{"kind":"stove","col":14,"row":2},{"kind":"cabinet","col":10,"row":2},{"kind":"table","col":3,"row":4},{"kind":"table","col":4,"row":9},{"kind":"table","col":11,"row":10},{"kind":"table","col":12,"row":7}],
  "mornay_gate_beds": [{"kind":"homebed","col":2,"row":3},{"kind":"homebed","col":4,"row":3},{"kind":"homebed","col":11,"row":3},{"kind":"homebed","col":13,"row":3},{"kind":"homebed","col":2,"row":8},{"kind":"homebed","col":4,"row":8},{"kind":"homebed","col":11,"row":8},{"kind":"homebed","col":13,"row":8},{"kind":"dresser","col":1,"row":11},{"kind":"table","col":7,"row":5}],
  "mornay_commercial_beds": [{"kind":"homebed","col":2,"row":3},{"kind":"homebed","col":5,"row":3},{"kind":"homebed","col":10,"row":3},{"kind":"homebed","col":13,"row":3},{"kind":"homebed","col":2,"row":9},{"kind":"homebed","col":5,"row":9},{"kind":"homebed","col":10,"row":9},{"kind":"homebed","col":13,"row":9},{"kind":"dresser","col":1,"row":6},{"kind":"desk","col":11,"row":6}],
  "mornay_school": [{"kind":"desk","col":4,"row":3},{"kind":"cabinet","col":1,"row":2},{"kind":"cabinet","col":13,"row":2},{"kind":"studentdesk","col":3,"row":6},{"kind":"studentdesk","col":6,"row":6},{"kind":"studentdesk","col":10,"row":6},{"kind":"studentdesk","col":3,"row":9},{"kind":"studentdesk","col":6,"row":9},{"kind":"studentdesk","col":10,"row":9},{"kind":"desk","col":13,"row":11}],
  "mornay_harbour": [{"kind":"desk","col":2,"row":3},{"kind":"desk","col":5,"row":3},{"kind":"desk","col":11,"row":3},{"kind":"desk","col":3,"row":7},{"kind":"desk","col":10,"row":7},{"kind":"desk","col":13,"row":7},{"kind":"cabinet","col":1,"row":2},{"kind":"cabinet","col":13,"row":2},{"kind":"cabinet","col":14,"row":10},{"kind":"table","col":3,"row":11}],
  "mornay_warehouse": [{"kind":"cargo","col":1,"row":2},{"kind":"cargo","col":2,"row":2},{"kind":"cargo","col":4,"row":3},{"kind":"cargo","col":5,"row":3},{"kind":"cargo","col":11,"row":2},{"kind":"cargo","col":12,"row":2},{"kind":"cargo","col":13,"row":2},{"kind":"cargo","col":2,"row":8},{"kind":"cargo","col":3,"row":8},{"kind":"cargo","col":11,"row":9},{"kind":"cargo","col":12,"row":9},{"kind":"desk","col":12,"row":5},{"kind":"bench","col":4,"row":11}],
  "mornay_workshop": [{"kind":"bench","col":2,"row":3},{"kind":"bench","col":3,"row":3},{"kind":"bench","col":11,"row":3},{"kind":"stove","col":14,"row":2},{"kind":"bench","col":4,"row":7},{"kind":"bench","col":5,"row":7},{"kind":"bench","col":12,"row":8},{"kind":"desk","col":2,"row":11},{"kind":"supply","col":1,"row":2},{"kind":"cargo","col":13,"row":11}],
  "mornay_laundry": [{"kind":"tub","col":2,"row":3},{"kind":"tub","col":4,"row":3},{"kind":"bench","col":11,"row":4},{"kind":"table","col":3,"row":8},{"kind":"tub","col":12,"row":9},{"kind":"supply","col":14,"row":2},{"kind":"stove","col":1,"row":11}],
  "mornay_boarding": [{"kind":"stove","col":2,"row":7},{"kind":"supply","col":3,"row":7},{"kind":"table","col":5,"row":9},{"kind":"table","col":10,"row":9},{"kind":"dresser","col":13,"row":7}],
  "mornay_court": [{"kind":"tub","col":2,"row":8},{"kind":"table","col":11,"row":8},{"kind":"bench","col":3,"row":11}],
  "mornay_dock_steps": [{"kind":"bench","col":3,"row":8},{"kind":"cargo","col":12,"row":10},{"kind":"tub","col":13,"row":7}],
  "mornay_south_rows": [{kind:'tub',col:1,row:8},{kind:'stove',col:12,row:7}],
  mornay_south_rows_floor_2:[{kind:'tub',col:1,row:8},{kind:'supply',col:12,row:7}],
  mornay_south_rows_floor_3:[{kind:'tub',col:12,row:7},{kind:'bench',col:3,row:7}],
  mornay_south_rows_attic:[{kind:'homebed',col:2,row:3},{kind:'homebed',col:3,row:3},
    {kind:'press',col:5,row:5},{kind:'desk',col:6,row:5},{kind:'supply',col:12,row:3},
    {kind:'supply',col:11,row:3},{kind:'cargo',col:11,row:9},{kind:'cargo',col:12,row:9},
    {kind:'table',col:3,row:9},{kind:'bench',col:4,row:10},{kind:'bench',col:2,row:10}],
  ...Object.fromEntries(Array.from({length:20},(_,i)=>['mornay_south_rows_unit_'+(i+5),[
    {kind:'homebed',col:i%2?10:6,row:8},{kind:'dresser',col:i%2?6:10,row:8},
    {kind:'table',col:i%2?10:6,row:11},{kind:'stove',col:i%2?6:10,row:11}]])),
  "mornay_glyn_home": [{"kind":"homebed","col":3,"row":5},{"kind":"homebed","col":4,"row":5},{"kind":"dresser","col":11,"row":5},{"kind":"stove","col":3,"row":10},{"kind":"table","col":10,"row":9},{"kind":"supply","col":12,"row":10}],
  "mornay_reed_home": [{"kind":"homebed","col":11,"row":5},{"kind":"dresser","col":10,"row":5},{"kind":"stove","col":3,"row":5},{"kind":"bench","col":4,"row":9},{"kind":"supply","col":12,"row":10}],
  "mornay_pate_home": [{"kind":"homebed","col":3,"row":5},{"kind":"homebed","col":4,"row":5},{"kind":"dresser","col":11,"row":5},{"kind":"stove","col":3,"row":10},{"kind":"table","col":10,"row":9},{"kind":"supply","col":12,"row":10}],
  "mornay_rann_home": [{"kind":"homebed","col":11,"row":5},{"kind":"dresser","col":10,"row":5},{"kind":"stove","col":3,"row":5},{"kind":"table","col":4,"row":9},{"kind":"supply","col":12,"row":10}],
  "mornay_vale_home": [{"kind":"homebed","col":3,"row":4},{"kind":"dresser","col":5,"row":3},{"kind":"cabinet","col":12,"row":3},{"kind":"desk","col":11,"row":5},{"kind":"table","col":4,"row":9},{"kind":"stove","col":12,"row":11},{"kind":"table","col":10,"row":10}],
  "mornay_dane_home": [{"kind":"homebed","col":4,"row":4},{"kind":"dresser","col":5,"row":3},{"kind":"cabinet","col":12,"row":3},{"kind":"desk","col":10,"row":5},{"kind":"desk","col":4,"row":9},{"kind":"stove","col":12,"row":11},{"kind":"cabinet","col":12,"row":8}],
  "mornay_court_unit_1": [{"kind":"homebed","col":4,"row":6},{"kind":"homebed","col":5,"row":6},{"kind":"stove","col":10,"row":6},{"kind":"table","col":9,"row":9},{"kind":"dresser","col":4,"row":11}],
  "mornay_court_unit_2": [{"kind":"homebed","col":10,"row":6},{"kind":"dresser","col":9,"row":6},{"kind":"stove","col":4,"row":6},{"kind":"table","col":5,"row":9}],
  "mornay_court_unit_3": [{"kind":"homebed","col":4,"row":5},{"kind":"homebed","col":5,"row":5},{"kind":"dresser","col":10,"row":5},{"kind":"table","col":9,"row":8},{"kind":"stove","col":4,"row":11}],
  "mornay_court_unit_4": [{"kind":"homebed","col":10,"row":5},{"kind":"homebed","col":9,"row":5},{"kind":"dresser","col":4,"row":5},{"kind":"table","col":5,"row":8},{"kind":"stove","col":10,"row":11}],
  "mornay_dock_steps_unit_1": [{"kind":"homebed","col":4,"row":6},{"kind":"homebed","col":5,"row":6},{"kind":"stove","col":10,"row":6},{"kind":"table","col":9,"row":9},{"kind":"cargo","col":10,"row":11},{"kind":"bench","col":4,"row":9}],
  "mornay_dock_steps_unit_2": [{"kind":"homebed","col":10,"row":6},{"kind":"dresser","col":9,"row":6},{"kind":"stove","col":4,"row":6},{"kind":"table","col":5,"row":9}],
  "mornay_dock_steps_unit_3": [{"kind":"homebed","col":4,"row":5},{"kind":"homebed","col":5,"row":5},{"kind":"dresser","col":10,"row":5},{"kind":"table","col":9,"row":8},{"kind":"stove","col":4,"row":11}],
  "mornay_dock_steps_unit_4": [{"kind":"homebed","col":10,"row":5},{"kind":"homebed","col":9,"row":5},{"kind":"supply","col":4,"row":5},{"kind":"bench","col":5,"row":8},{"kind":"stove","col":10,"row":11}],
  "mornay_south_rows_unit_1": [{"kind":"homebed","col":4,"row":6},{"kind":"homebed","col":5,"row":6},{"kind":"stove","col":10,"row":6},{"kind":"table","col":9,"row":9},{"kind":"dresser","col":10,"row":11}],
  "mornay_south_rows_unit_2": [{"kind":"homebed","col":10,"row":6},{"kind":"dresser","col":9,"row":6},{"kind":"stove","col":4,"row":6},{"kind":"table","col":5,"row":9}],
  "mornay_south_rows_unit_3": [{"kind":"homebed","col":4,"row":5},{"kind":"homebed","col":5,"row":5},{"kind":"supply","col":10,"row":5},{"kind":"table","col":9,"row":8},{"kind":"stove","col":4,"row":11}],
  "mornay_south_rows_unit_4": [{"kind":"homebed","col":10,"row":5},{"kind":"homebed","col":9,"row":5},{"kind":"dresser","col":4,"row":5},{"kind":"table","col":5,"row":8},{"kind":"stove","col":10,"row":11}],
  "mornay_boarding_unit_1": [{"kind":"homebed","col":4,"row":6},{"kind":"homebed","col":5,"row":6},{"kind":"table","col":9,"row":9},{"kind":"dresser","col":4,"row":11}],
  "mornay_boarding_unit_2": [{"kind":"homebed","col":10,"row":6},{"kind":"dresser","col":9,"row":6},{"kind":"table","col":5,"row":9}],
  "mornay_boarding_unit_3": [{"kind":"homebed","col":4,"row":5},{"kind":"homebed","col":5,"row":5},{"kind":"dresser","col":10,"row":5},{"kind":"table","col":9,"row":8}],
  "mornay_boarding_unit_4": [{"kind":"homebed","col":10,"row":5},{"kind":"homebed","col":9,"row":5},{"kind":"dresser","col":4,"row":5},{"kind":"table","col":5,"row":8}]
});
const MORNAY_INTERIOR_MAPS = Object.freeze(Object.fromEntries(MORNAY_BUILDINGS.map(b => {
  const compact = b.kind === 'flat' || b.kind === 'bedsit';
  const house = b.kind === 'house';
  const left = b.tiny ? 6 : compact ? 4 : house ? 2 : 1, right = b.tiny ? 10 : compact ? 11 : house ? 13 : 14;
  const top = b.tiny ? 8 : compact ? (b.unit % 2 ? 5 : 6) : house ? (b.housing === 'comfortable' ? 3 : 5) : b.kind === 'corridor' ? 5 : b.kind === 'boarding' ? 4 : 2;
  const grid = Array.from({length:15}, (_,r) => Array.from({length:16}, (_,c) =>
    r >= top && r < 13 && c >= left && c <= right ? INTERIOR_FLOOR : INTERIOR_WALL));
  if (!compact && !house) for(let c=1;c<15;c++) grid[13][c]=INTERIOR_FLOOR;
  grid[13][7] = grid[13][8] = INTERIOR_FLOOR;
  const entrance = mornayInteriorEntrance(b);
  // Retain the old southern floor stem so existing interior saves stay walkable.
  if (entrance.exitRow === 0)
    for (let row=1;row<top;row++) grid[row][7] = grid[row][8] = INTERIOR_FLOOR;
  grid[entrance.exitRow][entrance.col] = INTERIOR_EXIT;
  // Short partitions distinguish sleeping alcoves from work and reception space.
  // All openings join the entrance stem; no separate placement or door state.
  if(house && b.housing==='comfortable')for(let row=3;row<=6;row++)grid[row][8]=INTERIOR_WALL;
  else if(house){
    const cols=['reed_home','rann_home'].includes(b.key)?[10,11,12,13]:[2,3,4];
    for(const col of cols)grid[7][col]=INTERIOR_WALL;
  }
  if(compact && b.unit>=3)for(let row=5;row<=6;row++)grid[row][7]=INTERIOR_WALL;
  if(b.kind==='watchhouse') {
    // A cutaway view of an intentionally inaccessible rear, not another route.
    // The central rear corridor joins all four cells and the locked yard gate.
    for(const col of [1,2,3,4,5,7,8,9,10]) grid[11][col]=INTERIOR_WALL;
    grid[2][5]=grid[3][5]=INTERIOR_WALL; // cramped guardroom; opening below
  }
  for (const f of MORNAY_ROOM_FIXTURES[b.id])
    for(let dx=0;dx<(f.w||1);dx++) grid[f.row][f.col+dx] = TABLE;
  for (const child of MORNAY_BUILDINGS.filter(child => child.sourceMapId === b.mapId)) {
    grid[child.doorRow][child.doorCol] = HOUSE_DOOR;
    grid[child.returnRow][child.returnCol] = INTERIOR_FLOOR;
  }
  return [b.mapId, grid];
})));
// Ordinary discrete maps follow the existing export contract, never regional aliases.
for (const b of MORNAY_BUILDINGS) window[b.mapId] = MORNAY_INTERIOR_MAPS[b.mapId];
