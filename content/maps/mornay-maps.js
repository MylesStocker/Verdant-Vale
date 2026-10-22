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
    "kind": "lodging"
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
    "kind": "housing"
  }
].map(b => Object.freeze(b)));
function mornayBuilding(id) { return MORNAY_BUILDINGS.find(b => b.id === id) || null; }
function mornayRoomForMap(mapId) { return MORNAY_BUILDINGS.find(b => b.mapId === mapId) || null; }
function mornayDoorAt(mapId, col, row) {
  return MORNAY_BUILDINGS.find(b => b.sourceMapId === mapId && b.doorCol === col && b.doorRow === row) || null;
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

// Fixtures share geometry between collision and drawing. Beds are one tile in
// this established 32px vocabulary; no invisible furniture collision exists.
const MORNAY_ROOM_FIXTURES = Object.freeze(Object.fromEntries(MORNAY_BUILDINGS.map(b => {
  const props = [];
  const add = (kind, cols, rows) => rows.forEach(row => cols.forEach(col => props.push(Object.freeze({kind,col,row}))));
  if (b.kind === 'infirmary' || b.kind === 'lodging') {
    add('bed', [2,4,11,13], [6,9]); add('supply', [2,4,11,13], [3]);
  } else if (b.kind === 'school') add('desk', [2,4,6,9,11,13], [6,9]);
  else if (b.kind === 'office') add('desk', [2,4,6,9,11,13], [3,6]);
  else if (b.kind === 'shop') add('counter', [2,4,6,9,11,13], [3]);
  else if (b.kind === 'inn') add('table', [2,4,11,13], [3,9]);
  else if (b.kind === 'warehouse') add('cargo', [2,4,6,9,11,13], [3,9]);
  else if (b.kind === 'workshop') add('bench', [2,4,6,9,11,13], [3]);
  else if (b.kind === 'laundry') add('tub', [2,4,11,13], [3,9]);
  else add('table', [2,4,11,13], [3,9]);
  return [b.id, Object.freeze(props)];
})));
const MORNAY_INTERIOR_MAPS = Object.freeze(Object.fromEntries(MORNAY_BUILDINGS.map(b => {
  const grid = Array.from({length:15}, (_,r) => Array.from({length:16}, (_,c) =>
    r < 2 || r === 14 || c === 0 || c === 15 ? INTERIOR_WALL : INTERIOR_FLOOR));
  grid[14][7] = INTERIOR_EXIT;
  for (const f of MORNAY_ROOM_FIXTURES[b.id]) grid[f.row][f.col] = TABLE;
  for (const child of MORNAY_BUILDINGS.filter(child => child.sourceMapId === b.mapId))
    grid[child.doorRow][child.doorCol] = HOUSE_DOOR;
  return [b.mapId, grid];
})));
// Ordinary discrete maps follow the existing export contract, never regional aliases.
for (const b of MORNAY_BUILDINGS) window[b.mapId] = MORNAY_INTERIOR_MAPS[b.mapId];
