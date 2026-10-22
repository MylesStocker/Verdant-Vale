'use strict';

// Mornay exterior skeleton: seventeen discrete 16x15 legacy-town maps.
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

function _mornayBuildExterior(def) {
  const base = def.district === 'south' ? TOWN_FLOOR
    : def.district === 'fort' ? EXPOSED_STONE
      : TOWN_FLOOR;
  const grid = Array.from({ length: 15 }, (_, row) =>
    Array.from({ length: 16 }, (_, col) =>
      row === 0 || row === 14 || col === 0 || col === 15 ? TOWN_BUILDING : base));

  // District massing. Roads remain a connected cross through every screen;
  // future doors are deliberately absent, so every building is inert.
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
