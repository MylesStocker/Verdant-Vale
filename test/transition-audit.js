#!/usr/bin/env node
'use strict';
// test/transition-audit.js
//
// Reusable map-transition / exit-tile integrity checker. Loads the real game
// (via test/harness.js -- same vm context used by the regression suite),
// then for every enter*/exit*/ascend*/descend* transition function actually
// CALLS it in that live context (rather than re-implementing its logic or
// hand-transcribing its destination coordinates) and inspects the resulting
// activeMap/player.x/player.y/player.facing against:
//
//   - map bounds (both the nominal COLS x ROWS the game's own tileAt() uses,
//     and the map array's own actual dimensions -- a mismatch there is a
//     latent crash bug, since tileAt() indexes by the nominal size)
//   - tile walkability, via the game's own WALKABLE[] table
//   - the game's own canWalk() collision (hitbox + chests + solid NPCs +
//     furniture), not a re-implementation of it
//   - whether the player can step away in at least one of the 4 cardinal
//     directions from the landing spot (not sealed into a 1-tile pocket)
//
// Run: node test/transition-audit.js
//
// This does not mutate any file. It's read-only introspection of the loaded
// game plus (harmless, in-memory) calls to its own transition functions.

const path = require('path');
const { createContext } = require('./harness');

const g = createContext();

// ── helpers ──────────────────────────────────────────────────────────────
const TILE = g.run('TILE');
const COLS = g.run('COLS');
const ROWS = g.run('ROWS');

function esc(s) { return JSON.stringify(s); }

// Resolves a live `activeMap` array reference back to its MAP_REGISTRY id.
// Falls back to a small list of maps confirmed (by a source-text sweep, see
// the "MAP_REGISTRY completeness" section of the audit report) to be real,
// in-use map grids that MAP_REGISTRY itself doesn't list -- without this,
// any transition landing on one of them would be unauditable rather than
// flagged as the actual finding (a missing registry entry).
const UNREGISTERED_BUT_REAL_MAPS = ['DRENWICK_SCHOOL_BASEMENT_MAP'];
function mapLabel() {
  const fromRegistry = g.run(`(() => {
    for (const [id, entry] of Object.entries(MAP_REGISTRY)) {
      if (entry.map === activeMap) return id;
    }
    return null;
  })()`);
  if (fromRegistry) return fromRegistry;
  for (const name of UNREGISTERED_BUT_REAL_MAPS) {
    if (g.run(`activeMap === ${name}`)) return name;
  }
  return null;
}
// Given a label from mapLabel(), returns a JS expression (valid inside
// g.run()) that evaluates to that map's array -- MAP_REGISTRY[label].map
// for registered maps, or the bare global name for the small fallback list.
function mapExprForLabel(label) {
  return UNREGISTERED_BUT_REAL_MAPS.includes(label) ? label : `MAP_REGISTRY['${label}'].map`;
}

// Snapshot the handful of location flags a transition might set, so we can
// restore a clean baseline between checks (each transition function is
// side-effecting on shared globals).
function resetState() {
  g.run(`
    inDungeon=false; dungeonFloor=1; inTown=false; currentTownId=null; townBuilding=null;
    currentHouseId=null; houseSourceMap=null; houseSourceBuilding=null;
    inSluice=false; sluiceFloor=1; inMireVault=false; inTakomo=false; inFenBrewery=false;
    inHamletInterior=false; inLorraHouse=false; inMarenPost=false; inDrenwrickPost=false;
    inBridgePost=false; inSmugglerFort=false; bridge_entry_direction=null; bridge_toll_paid=false;
    inDungeonEntrance=false;
    activeMap = MAP; player.x = 8*TILE; player.y = 8*TILE; player.facing='down';
  `);
}

const results = [];

// Runs `setupCode` (arbitrary JS run in the live context, typically a call
// to a transition function or a direct state assignment mimicking one),
// then validates wherever the player ended up.
function check(name, setupCode, opts) {
  opts = opts || {};
  resetState();
  if (opts.pre) g.run(opts.pre);
  let error = null;
  try {
    g.run(setupCode);
  } catch (e) {
    error = e.message;
  }
  const record = { name, group: opts.group || '(other)', setupCode, error };
  if (error) {
    record.verdict = 'ERROR';
    results.push(record);
    return record;
  }

  const label = mapLabel();
  const px = g.run('player.x');
  const py = g.run('player.y');
  const facing = g.run('player.facing');
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);

  record.destMap = label;
  record.px = px; record.py = py; record.facing = facing;
  record.tileCol = tx; record.tileRow = ty;

  if (label === null) {
    record.verdict = 'UNRESOLVED_MAP';
    results.push(record);
    return record;
  }

  // Nominal nested-array bounds check via the exact logic tileAt() uses.
  const nominalOOB = tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS;
  // Actual array bounds -- a map whose real array is smaller than COLSxROWS
  // is a latent crash: tileAt() will index past the end of a short row.
  const mapExpr = mapExprForLabel(label);
  const actualDims = g.run(`(() => {
    const m = ${mapExpr};
    return { rows: m.length, cols: m[0] ? m[0].length : 0 };
  })()`);
  record.actualDims = actualDims;
  const dimsMismatch = actualDims.rows !== ROWS || actualDims.cols !== COLS;
  record.dimsMismatch = dimsMismatch;

  const actualOOB = ty < 0 || ty >= actualDims.rows || tx < 0 || tx >= actualDims.cols;
  record.outOfBounds = nominalOOB || actualOOB;

  if (record.outOfBounds) {
    record.verdict = 'OUT_OF_BOUNDS';
    results.push(record);
    return record;
  }

  const tileId = g.run(`${mapExpr}[${ty}][${tx}]`);
  const walkableByTable = g.run(`WALKABLE[${tileId}]`) === true;
  record.tileId = tileId;
  record.walkableByTable = walkableByTable;

  // Live canWalk() check -- reuses every special-cased solid body (chests,
  // NPCs, furniture) the real game applies, since all the flags the
  // transition set are still live in this context.
  const canWalkHere = g.run(`canWalk(${px}, ${py})`);
  record.canWalkHere = canWalkHere;

  // Can the player step away in at least one direction? Test a modest
  // (half-tile) step in each of the 4 cardinal directions.
  const step = TILE / 2;
  const dirs = { up: [0, -step], down: [0, step], left: [-step, 0], right: [step, 0] };
  const escapes = {};
  for (const [dir, [dx, dy]] of Object.entries(dirs)) {
    escapes[dir] = g.run(`canWalk(${px + dx}, ${py + dy})`);
  }
  record.escapes = escapes;
  record.canEscape = Object.values(escapes).some(Boolean);

  if (!canWalkHere) {
    record.verdict = 'BLOCKED_DESTINATION';
  } else if (!record.canEscape) {
    record.verdict = 'SEALED_POCKET';
  } else {
    record.verdict = 'OK';
  }
  results.push(record);
  return record;
}

// ── 1. MAP_REGISTRY dimension sweep ─────────────────────────────────────
const registryIds = g.run('Object.keys(MAP_REGISTRY)');
const dimReport = [];
for (const id of registryIds) {
  const dims = g.run(`(() => { const m = MAP_REGISTRY['${id}'].map; return { rows: m.length, cols: m[0]?m[0].length:0 }; })()`);
  dimReport.push({ id, rows: dims.rows, cols: dims.cols, ok: dims.rows === ROWS && dims.cols === COLS });
}
// Also sweep any maps in UNREGISTERED_BUT_REAL_MAPS that AREN'T already
// covered by the registry loop above -- keeps this a live safety net for a
// *future* map added without a registry entry, without double-counting one
// that's already been fixed (DRENWICK_SCHOOL_BASEMENT_MAP was exactly this
// case; it's now in MAP_REGISTRY, so the loop above already covers it).
for (const name of UNREGISTERED_BUT_REAL_MAPS) {
  if (registryIds.includes(name)) continue;
  const dims = g.run(`(() => { const m = ${name}; return { rows: m.length, cols: m[0]?m[0].length:0 }; })()`);
  dimReport.push({ id: name + ' (UNREGISTERED)', rows: dims.rows, cols: dims.cols, ok: dims.rows === ROWS && dims.cols === COLS });
}

// ── 2. Simple flat transition functions (no args, no branches) ─────────
const flatFns = [
  'enterDungeon', 'exitDungeon', 'descendToDungeon1', 'ascendToDungeonEntrance',
  'descendToDungeon2', 'ascendToDungeon1', 'descendToDungeon3', 'ascendToDungeon2',
  'descendToDungeon4', 'ascendToDungeon3', 'descendToDungeon5', 'ascendToDungeon4',
  'descendToDungeon6', 'ascendToDungeon5', 'descendToDungeon7', 'ascendToDungeon6',
  'descendToDungeon8', 'ascendToDungeon7',
  'enterDungeon8West', 'exitDungeon8West', 'enterDungeon8East', 'exitDungeon8East',
  'd3_TC_to_TL', 'd3_TL_to_TC', 'd3_TC_to_TR', 'd3_TR_to_TC', 'd3_TC_to_MC', 'd3_MC_to_TC',
  'd3_TL_to_ML', 'd3_ML_to_TL', 'd3_TR_to_MR', 'd3_MR_to_TR', 'd3_ML_to_MC', 'd3_MC_to_ML',
  'd3_MC_to_MR', 'd3_MR_to_MC', 'd3_ML_to_BL', 'd3_BL_to_ML', 'd3_MC_to_BC', 'd3_BC_to_MC',
  'd3_MR_to_BR', 'd3_BR_to_MR', 'd3_BL_to_BC', 'd3_BC_to_BL', 'd3_BC_to_BR', 'd3_BR_to_BC',
  'enterLorraHouse', 'exitLorraHouse',
  'enterMarenPost', 'exitMarenPost',
  'enterDrenwrickPost', 'exitDrenwrickPost',
  'enterBridgePostFromSouth', 'enterBridgePostFromNorth', 'exitBridgeSouth', 'exitBridgeNorth',
  'enterSmugglerFort', 'exitSmugglerFort',
  'enterMireVault', 'exitMireVault',
  'enterTakomo', 'exitTakomo',
  'enterFenBrewery', 'exitFenBrewery',
  'exitHamletInterior', // room-dependent branch handled by pre-seeding player.x below
  'enterSluice', 'exitSluice',
  'descendToSluice2', 'ascendToSluice1', 'descendToSluice3', 'ascendToSluice2',
  'exitEastTownToWorld',
  // NOTE: enterEastTown/exitEastTown/enterWestTown/exitWestTown are
  // deliberately NOT in this flat list -- they preserve player.y from
  // whatever the resetState() baseline happens to be, which isn't a real
  // crossing row. They're validated properly (against every real EAST_EXIT/
  // WEST_EXIT/etc. row on the source map) in the "preserved coordinate
  // transitions" section below instead.
];
for (const fn of flatFns) {
  check(fn, `${fn}()`, { group: 'flat-transitions' });
}

// exitHamletInterior branches on player.x at call time -- check all 3 rooms.
check('exitHamletInterior (from room A)', 'player.x = 2*TILE; exitHamletInterior();', { group: 'flat-transitions' });
check('exitHamletInterior (from room B)', 'player.x = 7*TILE; exitHamletInterior();', { group: 'flat-transitions' });
check('exitHamletInterior (from room C)', 'player.x = 12*TILE; exitHamletInterior();', { group: 'flat-transitions' });

// enterHamletInterior(room) -- 3 rooms.
for (const room of ['A', 'B', 'C']) {
  check(`enterHamletInterior('${room}')`, `enterHamletInterior('${room}')`, { group: 'flat-transitions' });
}

// ── 3. enterTownAt(townId, entryPoint) -- every registered entry point ──
const townEntryPoints = g.run(`
  Object.entries(TOWN_ENTRY_POINTS).flatMap(([town, pts]) => Object.keys(pts).map(pt => [town, pt]))
`);
for (const [town, pt] of townEntryPoints) {
  check(`enterTownAt('${town}', '${pt}')`, `enterTownAt('${town}', '${pt}')`, { group: 'town-entry' });
}

// ── 4. enterBuilding(building) -- Calwick and Drenwick, every building ──
const calwickBuildings = ['inn', 'office', 'school', 'apt'];
for (const b of calwickBuildings) {
  check(`enterBuilding('${b}') [calwick]`, `currentTownId=null; enterBuilding('${b}')`, { group: 'enter-building' });
}
const drenwickBuildings = ['inn', 'office', 'harbormaster', 'wash_house', 'provision_store', 'guild_hall', 'tavern', 'school',
  'drenwick_apt_a1', 'drenwick_apt_a2', 'drenwick_apt_b1', 'drenwick_apt_b2', 'drenwick_apt_c1', 'drenwick_apt_c2'];
for (const b of drenwickBuildings) {
  check(`enterBuilding('${b}') [drenwick]`, `currentTownId='drenwick'; enterBuilding('${b}')`, { group: 'enter-building' });
}

// ── 5. enterHouse(houseId) -- every HOUSE_DOORS entry ────────────────────
const houseIds = g.run(`HOUSE_DOORS.map(d => d.houseId)`);
for (const id of houseIds) {
  check(`enterHouse('${id}')`, `enterHouse('${id}')`, { group: 'enter-house' });
}

// ── 6. exitBuilding() -- every prior townBuilding value, both towns ──────
// Non-house exits first (these don't need houseReturnPos/houseSourceMap).
const calwickExitPriors = ['inn', 'office', 'school', 'apt', null];
for (const prev of calwickExitPriors) {
  check(`exitBuilding() [calwick, from ${prev}]`,
    `currentTownId=null; townBuilding=${prev === null ? 'null' : esc(prev)}; exitBuilding();`,
    { group: 'exit-building' });
}
const drenwickExitPriors = ['inn', 'office', 'harbormaster', 'wash_house', 'provision_store', 'tavern', 'school', 'guild_hall',
  'drenwick_apt_a1', 'drenwick_apt_a2', 'drenwick_apt_b1', 'drenwick_apt_b2', 'drenwick_apt_c1', 'drenwick_apt_c2'];
for (const prev of drenwickExitPriors) {
  check(`exitBuilding() [drenwick, from ${prev}]`,
    `currentTownId='drenwick'; townBuilding=${esc(prev)}; exitBuilding();`,
    { group: 'exit-building' });
}
// House exits (Calwick and Drenwick) -- need to have actually entered via
// enterHouse() first so houseSourceMap/houseReturnPos are populated *from
// the correct source map* -- enterHouse() captures `activeMap` as
// houseSourceMap at the moment it's called, so the source map must be set
// to wherever that house's door actually lives (per HOUSE_DOORS), exactly
// as the real game would have it after walking there via enterBuilding()/
// moveToDrenwichDistrict(), not left at whatever resetState()'s baseline is.
function resolveDoorMapExpr(doorMapId) {
  if (doorMapId === 'west') return 'WEST_TOWN_MAP';
  if (doorMapId === 'east') return 'EAST_TOWN_MAP';
  if (doorMapId === 'apt') return 'APARTMENT_CORRIDOR_MAP';
  if (doorMapId === 'drenwick_west_residential') return 'DRENWICK_WEST_RESIDENTIAL_MAP';
  if (doorMapId.startsWith('drenwick_apt_')) return 'APARTMENT_CORRIDOR_MAP';
  return null;
}
for (const id of houseIds) {
  const isDrenwick = id.startsWith('drenwick_');
  const doorMapId = g.run(`HOUSE_DOORS.find(d => d.houseId === ${esc(id)}).map`);
  const srcMapExpr = resolveDoorMapExpr(doorMapId);
  check(`exitBuilding() [house: ${id}]`,
    `${isDrenwick ? "currentTownId='drenwick';" : ''} ${srcMapExpr ? `activeMap=${srcMapExpr};` : ''} enterHouse('${id}'); exitBuilding();`,
    { group: 'exit-building' });
}

// ── 7. exitTown() -- every branch ────────────────────────────────────────
const exitTownCases = [
  { pre: `currentTownId=null;`, label: 'calwick' },
  { pre: `currentTownId='drenwick'; activeMap=DRENWICK_MARKET_MAP;`, label: 'drenwick market' },
  { pre: `currentTownId='drenwick'; activeMap=DRENWICK_EAST_OUTSKIRTS_MAP; player.facing='right';`, label: 'drenwick east outskirts (east exit)' },
  { pre: `currentTownId='drenwick'; activeMap=DRENWICK_EAST_OUTSKIRTS_MAP; player.facing='down';`, label: 'drenwick east outskirts (south exit)' },
  { pre: `currentTownId='drenwick'; activeMap=DRENWICK_CIVIC_MAP;`, label: 'drenwick civic (default)' },
];
for (const c of exitTownCases) {
  check(`exitTown() [${c.label}]`, `${c.pre} exitTown();`, { group: 'exit-town' });
}

// ── 8. moveToDrenwichDistrict() call sites (extracted from movement.js) ──
const districtMoves = [
  ['DRENWICK_CIVIC_MAP -> north', 'DRENWICK_WEST_RESIDENTIAL_MAP', 7.5, 13.5, 'up'],
  ['DRENWICK_CIVIC_MAP -> east', 'DRENWICK_EAST_OUTSKIRTS_MAP', 1.5, 4.5, 'right'],
  ['DRENWICK_WEST_RESIDENTIAL_MAP -> north', 'DRENWICK_CANAL_DOCKS_MAP', 7.5, 12.5, 'up'],
  ['DRENWICK_WEST_RESIDENTIAL_MAP -> south (back to civic)', 'DRENWICK_CIVIC_MAP', 7.5, 4.5, 'down'],
  ['DRENWICK_WEST_RESIDENTIAL_MAP -> east', 'DRENWICK_MARKET_MAP', 1.5, 8.5, 'right'],
  ['DRENWICK_CANAL_DOCKS_MAP -> south (back to west res.)', 'DRENWICK_WEST_RESIDENTIAL_MAP', 7.5, 1.5, 'down'],
  ['DRENWICK_CANAL_DOCKS_MAP -> east', 'DRENWICK_WATERFRONT_MAP', 1.5, 7.5, 'right'],
  ['DRENWICK_EAST_OUTSKIRTS_MAP -> north', 'DRENWICK_MARKET_MAP', 7.5, 12.5, 'up'],
  ['DRENWICK_EAST_OUTSKIRTS_MAP -> west (back to civic)', 'DRENWICK_CIVIC_MAP', 14.5, 4.5, 'left'],
  ['DRENWICK_MARKET_MAP -> north', 'DRENWICK_WATERFRONT_MAP', 7.5, 12.5, 'up'],
  ['DRENWICK_MARKET_MAP -> south (back to east outskirts)', 'DRENWICK_EAST_OUTSKIRTS_MAP', 7.5, 1.5, 'down'],
  ['DRENWICK_MARKET_MAP -> west (back to west res.)', 'DRENWICK_WEST_RESIDENTIAL_MAP', 14.5, 8.5, 'left'],
  ['DRENWICK_WATERFRONT_MAP -> south (back to market)', 'DRENWICK_MARKET_MAP', 7.5, 4.5, 'down'],
  ['DRENWICK_WATERFRONT_MAP -> west (back to canal docks)', 'DRENWICK_CANAL_DOCKS_MAP', 14.5, 7.5, 'left'],
];
for (const [label, destMap, x, y, facing] of districtMoves) {
  check(`moveToDrenwichDistrict: ${label}`,
    `moveToDrenwichDistrict(${destMap}, ${x}, ${y}, ${esc(facing)});`,
    { group: 'drenwick-district' });
}

// ── 9. Drenwick school staircases (inline in movement.js) ────────────────
const schoolStairs = [
  ['ground -> basement (west stairs)', () => `activeMap=DRENWICK_SCHOOL_BASEMENT_MAP; player.x=2.5*TILE; player.y=3.5*TILE; player.facing='down';`],
  ['ground -> upper (east stairs)', () => `activeMap=DRENWICK_SCHOOL_UPPER_MAP; player.x=13.5*TILE; player.y=3.5*TILE; player.facing='up';`],
  ['upper -> ground', () => `activeMap=DRENWICK_SCHOOL_GROUND_MAP; player.x=13.5*TILE; player.y=3.5*TILE; player.facing='down';`],
  ['basement -> ground', () => `activeMap=DRENWICK_SCHOOL_GROUND_MAP; player.x=2.5*TILE; player.y=3.5*TILE; player.facing='down';`],
];
for (const [label, code] of schoolStairs) {
  check(`Drenwick school stairs: ${label}`, `currentTownId='drenwick'; inTown=true; ${code()}`, { group: 'school-stairs' });
}
// Flag: DRENWICK_SCHOOL_BASEMENT_MAP is used by the above but is NOT in
// MAP_REGISTRY -- record that separately (checked below, not a `check()` case).
const basementInRegistry = registryIds.includes('DRENWICK_SCHOOL_BASEMENT_MAP');

// ── 10. "Preserved coordinate" transitions -- scan every occurrence of the
//         source edge tile and verify the destination is walkable at that
//         preserved row/col, not just the one row/col a human play-test
//         happened to cross at. ───────────────────────────────────────────
function scanTileOccurrences(mapName, tileConst) {
  return g.run(`(() => {
    const m = ${mapName};
    const id = ${tileConst};
    const hits = [];
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) if (m[r][c] === id) hits.push([r, c]);
    return hits;
  })()`);
}

const preservedTransitions = [
  { name: 'enterMap2', srcMap: 'MAP', srcTile: 'MAP2_EXIT', destMap: 'MAP2', fixedAxis: 'x', fixedVal: 1.5, facing: 'right' },
  { name: 'exitMap2', srcMap: 'MAP2', srcTile: 'MAP2_ENTRANCE', destMap: 'MAP', fixedAxis: 'x', fixedVal: 14.5, facing: 'left' },
  { name: 'enterMap3', srcMap: 'MAP2', srcTile: 'MAP3_EXIT', destMap: 'MAP3', fixedAxis: 'x', fixedVal: 1.5, facing: 'right' },
  { name: 'exitMap3', srcMap: 'MAP3', srcTile: 'MAP3_ENTRANCE', destMap: 'MAP2', fixedAxis: 'x', fixedVal: 14.5, facing: 'left' },
  { name: 'enterMap4', srcMap: 'MAP3', srcTile: 'MAP4_EXIT', destMap: 'MAP4', fixedAxis: 'x', fixedVal: 1.5, facing: 'right' },
  { name: 'exitMap4', srcMap: 'MAP4', srcTile: 'MAP4_ENTRANCE', destMap: 'MAP3', fixedAxis: 'x', fixedVal: 14.5, facing: 'left' },
  { name: 'enterMap5', srcMap: 'MAP4', srcTile: 'MAP5_EXIT', destMap: 'MAP5', fixedAxis: 'x', fixedVal: 1.5, facing: 'right' },
  { name: 'exitMap5', srcMap: 'MAP5', srcTile: 'MAP5_ENTRANCE', destMap: 'MAP4', fixedAxis: 'x', fixedVal: 14.5, facing: 'left' },
  { name: 'enterMap3N1', srcMap: 'MAP3', srcTile: 'FEN_N_EXIT', destMap: 'MAP3_N1', fixedAxis: 'y', fixedVal: 13.5, facing: 'up' },
  { name: 'exitMap3N1', srcMap: 'MAP3_N1', srcTile: 'FEN_N_ENTRANCE', destMap: 'MAP3', fixedAxis: 'y', fixedVal: 1.5, facing: 'down' },
  { name: 'enterMap3N2', srcMap: 'MAP3_N1', srcTile: 'FEN_N2_EXIT', destMap: 'MAP3_N2', fixedAxis: 'y', fixedVal: 13.5, facing: 'up' },
  { name: 'exitMap3N2', srcMap: 'MAP3_N2', srcTile: 'FEN_N2_ENTRANCE', destMap: 'MAP3_N1', fixedAxis: 'y', fixedVal: 1.5, facing: 'down' },
  { name: 'enterMapN1', srcMap: 'MAP', srcTile: 'NORTH_EXIT', destMap: 'MAP_N1', fixedAxis: 'y', fixedVal: 13.5, facing: 'up' },
  { name: 'exitMapN1', srcMap: 'MAP_N1', srcTile: 'NORTH_ENTRANCE', destMap: 'MAP', fixedAxis: 'y', fixedVal: 1.5, facing: 'down' },
  { name: 'enterMapN2', srcMap: 'MAP_N1', srcTile: 'NORTH2_EXIT', destMap: 'MAP_N2', fixedAxis: 'y', fixedVal: 13.5, facing: 'up' },
  { name: 'exitMapN2', srcMap: 'MAP_N2', srcTile: 'NORTH2_ENTRANCE', destMap: 'MAP_N1', fixedAxis: 'y', fixedVal: 1.5, facing: 'down' },
  { name: 'enterNorthBasinS', srcMap: 'MAP3_N2', srcTile: 'NORTH_BASIN_EXIT', destMap: 'NORTH_BASIN_S_MAP', fixedAxis: 'y', fixedVal: 13.5, facing: 'up' },
  { name: 'exitNorthBasinS', srcMap: 'NORTH_BASIN_S_MAP', srcTile: 'NORTH_BASIN_ENTRANCE', destMap: 'MAP3_N2', fixedAxis: 'y', fixedVal: 1.5, facing: 'down' },
  // South approach <-> Reservoir, south approach <-> Silt Flats, AND Silt
  // Flats <-> West Shore used to be point-tile entries here (enterNorthBasinC/
  // exitNorthBasinC/enterNorthBasinSW/exitNorthBasinSW, and
  // enterNorthBasinW/exitNorthBasinW); all are now handled by the generic
  // EDGE_TRANSITIONS system, which this preserved-coordinate sweep doesn't
  // model (it's specifically for the fixed single-tile pattern) — see
  // test/cases/21-edge-transitions.test.js and 20-north-basin-west-shore.test.js
  // for their dedicated coverage.
  { name: 'enterEastTown', srcMap: 'TOWN_MAP', srcTile: 'EAST_ENTRANCE', destMap: 'EAST_TOWN_MAP', fixedAxis: 'x', fixedVal: 1.5, facing: 'right' },
  { name: 'exitEastTown', srcMap: 'EAST_TOWN_MAP', srcTile: 'EAST_EXIT', destMap: 'TOWN_MAP', fixedAxis: 'x', fixedVal: 14.5, facing: 'left' },
  { name: 'enterWestTown', srcMap: 'TOWN_MAP', srcTile: 'WEST_ENTRANCE', destMap: 'WEST_TOWN_MAP', fixedAxis: 'x', fixedVal: 13.5, facing: 'left' },
  { name: 'exitWestTown', srcMap: 'WEST_TOWN_MAP', srcTile: 'WEST_EXIT', destMap: 'TOWN_MAP', fixedAxis: 'x', fixedVal: 1.5, facing: 'right' },
];

const preservedResults = [];
for (const t of preservedTransitions) {
  const occurrences = scanTileOccurrences(t.srcMap, t.srcTile);
  const rowsOrCols = [];
  for (const [r, c] of occurrences) {
    const preservedIndex = t.fixedAxis === 'x' ? r : c; // the axis NOT fixed
    if (!rowsOrCols.includes(preservedIndex)) rowsOrCols.push(preservedIndex);
  }
  const perCandidate = [];
  for (const idx of rowsOrCols) {
    resetState();
    const destTargetTile = t.destMap; // set activeMap for context flags via inTown etc not needed for world maps
    g.run(`activeMap = ${t.destMap};`);
    const px = t.fixedAxis === 'x' ? t.fixedVal * TILE : (idx + 0.5) * TILE;
    const py = t.fixedAxis === 'y' ? t.fixedVal * TILE : (idx + 0.5) * TILE;
    g.run(`player.x = ${px}; player.y = ${py}; player.facing = ${esc(t.facing)};`);
    const tileId = g.run(`activeMap[${Math.floor(py / TILE)}] ? activeMap[${Math.floor(py / TILE)}][${Math.floor(px / TILE)}] : undefined`);
    const walkableByTable = g.run(`WALKABLE[${tileId}]`) === true;
    const canWalkHere = g.run(`canWalk(${px}, ${py})`);
    perCandidate.push({ idx, px, py, tileId, walkableByTable, canWalkHere });
  }
  const bad = perCandidate.filter(c => !c.canWalkHere);
  preservedResults.push({
    name: t.name, srcMap: t.srcMap, srcTile: t.srcTile, destMap: t.destMap,
    occurrenceCount: occurrences.length, candidateCount: perCandidate.length,
    bad, allOk: bad.length === 0, perCandidate,
  });
}

// ── 11. Tile-constant usage cross-reference ───────────────────────────────
// For every transition-ish tile constant, how many maps actually place it,
// and does movement.js's dispatch (as text) reference that constant name?
const movementSrc = require('fs').readFileSync(path.join(__dirname, '..', 'movement.js'), 'utf8');
const transitionTileNames = [
  'DUNGEON_ENTRANCE', 'DUNGEON_EXIT', 'DUNGEON_STAIRS_DOWN', 'DUNGEON2_STAIRS_UP',
  'TOWN_ENTRANCE', 'TOWN_EXIT', 'INN_DOOR', 'OFFICE_DOOR', 'INTERIOR_EXIT',
  'EAST_ENTRANCE', 'EAST_EXIT', 'SLUICE_ENTRANCE', 'SLUICE_EXIT',
  'WEST_ENTRANCE', 'WEST_EXIT', 'HOUSE_DOOR', 'SCHOOL_DOOR', 'APT_DOOR', 'APT_INTERIOR_DOOR',
  'MAP2_EXIT', 'MAP2_ENTRANCE', 'MAP3_EXIT', 'MAP3_ENTRANCE',
  'NORTH_EXIT', 'NORTH_ENTRANCE', 'NORTH2_EXIT', 'NORTH2_ENTRANCE',
  'FEN_N_EXIT', 'FEN_N_ENTRANCE', 'FEN_N2_EXIT', 'FEN_N2_ENTRANCE',
  'MAP4_EXIT', 'MAP4_ENTRANCE', 'GUARD_POST', 'FARM_HOUSE',
  'MIRE_ENTRANCE', 'MIRE_EXIT', 'BRIDGE_GATE', 'BRIDGE_EXIT',
  'MAP5_EXIT', 'MAP5_ENTRANCE', 'DUNGEON8_WEST_DOOR', 'DUNGEON8_WEST_RET',
  'DUNGEON8_EAST_DOOR', 'DUNGEON8_EAST_RET', 'D3_EAST_PASSAGE', 'D3_WEST_PASSAGE',
  'D3_SOUTH_PASSAGE', 'D3_NORTH_PASSAGE', 'TAKOMO_GATE', 'TAKOMO_EXIT',
  'RUIN_STAIRS_DOWN', 'RUIN_EXIT',
  'NORTH_BASIN_EXIT', 'NORTH_BASIN_ENTRANCE',
  // NORTH_BASIN_W_EXIT/ENTRANCE (90/91) retired: the Silt Flats <-> West Shore
  // link is now an EDGE_TRANSITIONS crossing, not a point-tile, so those tiles
  // are no longer placed on any map (this list is a cross-reference of
  // *active* transition tiles — the orphan check in
  // test/cases/10-transition-audit.test.js would flag them otherwise).
];
const tileUsage = [];
for (const name of transitionTileNames) {
  const usageCount = g.run(`(() => {
    let n = 0;
    for (const id of Object.keys(MAP_REGISTRY)) {
      const m = MAP_REGISTRY[id].map;
      for (const row of m) if (row.includes(${name})) { n++; break; }
    }
    return n;
  })()`);
  const handledInMovement = movementSrc.includes(name);
  tileUsage.push({ name, mapsUsingIt: usageCount, handledInMovement });
}

// ── 12. HOUSE_DOORS return-position formula sweep ─────────────────────────
// exitBuilding()'s house branch uses houseReturnPos = {x:(col+0.5)*TILE, y:(row+1.5)*TILE}
// computed from the door's OWN col/row -- verify that's walkable on the door's map.
const houseDoors = g.run(`HOUSE_DOORS.map(d => ({ map: d.map, col: d.col, row: d.row, houseId: d.houseId }))`);
const houseDoorResults = [];
for (const d of houseDoors) {
  // Resolve d.map (a currentMapId()-style string) to an actual map array,
  // via the same resolver used to set up the exitBuilding() house checks
  // above, so the two sections can't silently diverge.
  const mapExpr = resolveDoorMapExpr(d.map);
  if (!mapExpr) { houseDoorResults.push({ ...d, skipped: 'unresolved map id' }); continue; }
  const rx = (d.col + 0.5) * TILE;
  const ry = (d.row + 1.5) * TILE;
  const tileId = g.run(`${mapExpr}[${d.row + 1}] ? ${mapExpr}[${d.row + 1}][${d.col}] : undefined`);
  const walkableByTable = g.run(`WALKABLE[${tileId}]`) === true;
  houseDoorResults.push({ ...d, mapExpr, rx, ry, tileId, walkableByTable });
}

// ── Exports (for test/cases/*.test.js to assert on) ───────────────────────
// All the checking above already ran as a side effect of loading this
// module -- both `node test/transition-audit.js` (standalone CLI) and
// `require('../transition-audit.js')` (from a regression test case) get the
// exact same results. Only the human-readable report below is CLI-only.
const auditData = { registryIds, dimReport, basementInRegistry, results, preservedResults, tileUsage, houseDoorResults };
module.exports = auditData;

// ── Report (standalone CLI use only; skipped when required as a module) ──
if (require.main === module) {
console.log('='.repeat(80));
console.log('MAP DIMENSION SWEEP:', dimReport.filter(d => !d.ok).length, 'mismatches out of', dimReport.length, 'maps');
for (const d of dimReport) if (!d.ok) console.log('  MISMATCH', d.id, `rows=${d.rows} cols=${d.cols} (expected ${ROWS}x${COLS})`);

console.log('='.repeat(80));
console.log('DRENWICK_SCHOOL_BASEMENT_MAP in MAP_REGISTRY:', basementInRegistry);

console.log('='.repeat(80));
const byVerdict = {};
for (const r of results) byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;
console.log('FIXED-DESTINATION TRANSITIONS:', results.length, 'checked ->', JSON.stringify(byVerdict));
for (const r of results) {
  if (r.verdict !== 'OK') {
    console.log(`  [${r.verdict}] ${r.name}`);
    console.log(`    dest=${r.destMap} px=${r.px} py=${r.py} tile=(${r.tileCol},${r.tileRow}) tileId=${r.tileId}`);
    if (r.error) console.log('    error:', r.error);
    if (r.escapes) console.log('    escapes:', JSON.stringify(r.escapes));
  }
}

console.log('='.repeat(80));
console.log('PRESERVED-COORDINATE TRANSITIONS:', preservedResults.length, 'checked');
for (const p of preservedResults) {
  console.log(`  ${p.allOk ? 'OK  ' : 'FAIL'} ${p.name}: ${p.srcMap}[${p.srcTile}] x${p.occurrenceCount} occurrences -> ${p.candidateCount} candidate rows/cols on ${p.destMap}, ${p.bad.length} unwalkable`);
  if (!p.allOk) {
    for (const b of p.bad) console.log(`      bad candidate idx=${b.idx} px=${b.px} py=${b.py} tileId=${b.tileId}`);
  }
}

console.log('='.repeat(80));
console.log('TILE CONSTANT USAGE:');
for (const t of tileUsage) {
  const flag = t.mapsUsingIt === 0 ? ' <-- UNUSED BY ANY MAP' : (!t.handledInMovement ? ' <-- NOT REFERENCED IN movement.js' : '');
  console.log(`  ${t.name}: used by ${t.mapsUsingIt} map(s), handled in movement.js: ${t.handledInMovement}${flag}`);
}

console.log('='.repeat(80));
const badDoors = houseDoorResults.filter(d => d.skipped || !d.walkableByTable);
console.log('HOUSE_DOORS return-position sweep:', houseDoorResults.length, 'doors,', badDoors.length, 'problems');
for (const d of badDoors) {
  if (d.skipped) console.log(`  SKIP  ${d.houseId} (${d.map}) -- ${d.skipped}`);
  else console.log(`  BAD   ${d.houseId} (${d.map} col=${d.col} row=${d.row}) -> tileId=${d.tileId} not walkable`);
}

console.log('='.repeat(80));
console.log('SUMMARY');
console.log('  maps checked:', registryIds.length);
console.log('  fixed-destination transitions checked:', results.length);
console.log('  preserved-coordinate transitions checked:', preservedResults.length);
console.log('  house doors checked:', houseDoorResults.length);
console.log('  tile constants cross-referenced:', tileUsage.length);

// Dump full JSON for the report-writing pass.
require('fs').writeFileSync(
  path.join(__dirname, 'transition-audit-output.json'),
  JSON.stringify(auditData, null, 2)
);
console.log('\nFull detail written to test/transition-audit-output.json');
} // end require.main === module
