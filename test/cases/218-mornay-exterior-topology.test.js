'use strict';

// Mornay exterior skeleton: exact irregular 17-screen topology, paired land
// gates, safe reciprocal legacy-town movement, save/debug integration, and
// deliberately inert future harbour facilities.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const EXPECTED = Object.freeze([
  ['MORNAY_OLD_FORT_MAP', 0, 0, 'fort'],
  ['MORNAY_NORTH_UPPER_WEST_MAP', 0, 1, 'north'],
  ['MORNAY_NORTH_UPPER_EAST_MAP', 1, 1, 'north'],
  ['MORNAY_NORTH_LOWER_WEST_MAP', 0, 2, 'north'],
  ['MORNAY_NORTH_LOWER_EAST_MAP', 1, 2, 'north'],
  ['MORNAY_MIDDLE_UPPER_WEST_MAP', 0, 3, 'middle'],
  ['MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP', 1, 3, 'middle'],
  ['MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP', 2, 3, 'middle'],
  ['MORNAY_MIDDLE_UPPER_EAST_MAP', 3, 3, 'middle'],
  ['MORNAY_MIDDLE_LOWER_WEST_MAP', 0, 4, 'middle'],
  ['MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP', 1, 4, 'middle'],
  ['MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP', 2, 4, 'middle'],
  ['MORNAY_MIDDLE_LOWER_EAST_MAP', 3, 4, 'middle'],
  ['MORNAY_SOUTH_UPPER_WEST_MAP', 1, 5, 'south'],
  ['MORNAY_SOUTH_UPPER_EAST_MAP', 2, 5, 'south'],
  ['MORNAY_WEST_GATE_MAP', 1, 6, 'south'],
  ['MORNAY_EAST_GATE_MAP', 2, 6, 'south'],
]);

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

function connectedWalkable(grid, walkable) {
  const cells = [];
  for (let row = 0; row < grid.length; row++) for (let col = 0; col < grid[row].length; col++) {
    if (walkable.has(grid[row][col])) cells.push([row, col]);
  }
  assert.ok(cells.length, 'map has walkable cells');
  const seen = new Set([cells[0].join(',')]);
  const queue = [cells[0]];
  while (queue.length) {
    const [row, col] = queue.shift();
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = row + dr, nc = col + dc, key = nr + ',' + nc;
      if (nr < 0 || nr >= 15 || nc < 0 || nc >= 16 || seen.has(key) || !walkable.has(grid[nr][nc])) continue;
      seen.add(key); queue.push([nr, nc]);
    }
  }
  return { count: cells.length, reached: seen.size };
}

module.exports = {
  name: 'Mornay exterior: exact 17-area legacy-town topology, paired gates, safe traversal and inert harbour reserves',
  run() {
    const g = context();
    const R = (code) => g.run(code);
    const J = (code) => JSON.parse(R(code));

    // 1-5. Exact irregular topology and stable descriptive identities.
    const layout = J('JSON.stringify(MORNAY_TOWN_LAYOUT.map(d=>({id:d.id,x:d.x,y:d.y,district:d.district,displayName:d.displayName,reserves:d.reserves})))');
    assert.equal(layout.length, 17, 'exactly seventeen exterior maps');
    assert.deepEqual(layout.map(d => [d.id, d.x, d.y, d.district]), EXPECTED, 'exact approved irregular layout');
    assert.deepEqual(layout.reduce((out, d) => ((out[d.district] = (out[d.district] || 0) + 1), out), {}),
      { fort: 1, north: 4, middle: 8, south: 4 }, '1 fort + 4 north + 8 middle + 4 south');
    assert.deepEqual(layout.filter(d => d.district === 'north').map(d => [d.x, d.y]), [[0,1],[1,1],[0,2],[1,2]], 'North Mornay is west-offset');
    assert.deepEqual(layout.filter(d => d.district === 'fort').map(d => [d.x, d.y]), [[0,0]], 'Old Fort occupies only the northwestern tip');
    assert.equal(new Set(layout.map(d => d.id)).size, 17, 'map ids are unique');

    const coords = new Map(layout.map(d => [d.x + ',' + d.y, d.id]));
    const expectedNeighbor = (d, dir) => {
      const delta = { north:[0,-1], south:[0,1], west:[-1,0], east:[1,0] }[dir];
      return coords.get((d.x + delta[0]) + ',' + (d.y + delta[1])) || null;
    };
    let directedEdges = 0;
    for (const d of layout) for (const dir of ['north','south','west','east']) {
      const expected = expectedNeighbor(d, dir);
      assert.equal(R(`mornayTownNeighbor('${d.id}','${dir}')`), expected, `${d.id}.${dir} matches topology`);
      if (expected) directedEdges++;
    }
    assert.equal(directedEdges, 46, '23 reciprocal internal adjacencies');

    // 6. Both gates reach all seventeen screens.
    for (const gate of ['MORNAY_WEST_GATE_MAP', 'MORNAY_EAST_GATE_MAP']) {
      const seen = new Set([gate]), queue = [gate];
      while (queue.length) {
        const id = queue.shift();
        for (const dir of ['north','south','west','east']) {
          const next = R(`mornayTownNeighbor('${id}','${dir}')`);
          if (next && !seen.has(next)) { seen.add(next); queue.push(next); }
        }
      }
      assert.equal(seen.size, 17, `${gate} reaches every exterior`);
    }

    // 7-10, 13-15. Map dimensions, metadata, connected streets, exact
    // reciprocal transitions, safe landings and visible authored boundaries.
    const walkableIds = new Set(J('JSON.stringify(Object.keys(WALKABLE).filter(id=>WALKABLE[id]).map(Number))'));
    const transitionTiles = { north: 43, south: 44, west: 40, east: 39 };
    const opposite = { north:'south', south:'north', west:'east', east:'west' };
    for (const d of layout) {
      const grid = J(`JSON.stringify(MAP_CATALOG['${d.id}'].map)`);
      assert.equal(grid.length, 15, `${d.id}: 15 rows`);
      grid.forEach((row, n) => assert.equal(row.length, 16, `${d.id}: row ${n} has 16 columns`));
      assert.equal(R(`MAP_CATALOG['${d.id}'].type`), 'town');
      assert.equal(R(`MAP_CATALOG['${d.id}'].region`), 'Mornay');
      assert.equal(R(`MAP_CATALOG['${d.id}'].allowRandomEncounters`), false, `${d.id}: encounters disabled`);
      assert.equal(R(`MAP_CATALOG['${d.id}'].encounterPool`), null, `${d.id}: no encounter pool`);
      assert.equal(R(`MAP_CATALOG['${d.id}'].allowSave`), true, `${d.id}: ordinary town saving allowed`);
      const connected = connectedWalkable(grid, walkableIds);
      assert.equal(connected.reached, connected.count, `${d.id}: no disconnected walkable pocket`);

      for (const dir of ['north','south','west','east']) {
        const next = expectedNeighbor(d, dir);
        const cells = dir === 'north' ? grid[0].map((v,c)=>[v,0,c])
          : dir === 'south' ? grid[14].map((v,c)=>[v,14,c])
            : dir === 'west' ? grid.map((row,r)=>[row[0],r,0])
              : grid.map((row,r)=>[row[15],r,15]);
        const allowedExternalGate = d.district === 'south' && d.id.endsWith('_GATE_MAP') && dir === 'south';
        const walkableBoundary = cells.filter(([tile]) => walkableIds.has(tile));
        if (next) {
          assert.deepEqual(walkableBoundary, [[transitionTiles[dir], dir === 'south' ? 14 : dir === 'north' ? 0 : 7, dir === 'east' ? 15 : dir === 'west' ? 0 : 7]], `${d.id}.${dir}: one authored transition tile`);
          assert.equal(R(`mornayTownNeighbor('${next}','${opposite[dir]}')`), d.id, `${d.id}.${dir}: reciprocal neighbor`);
          R(`currentTownId='mornay';inTown=true;townBuilding=null;activeMap=MAP_CATALOG['${d.id}'].map;transitionCooldown=0;`);
          assert.equal(R(`moveWithinMornay('${dir}')`), true, `${d.id}.${dir}: transition succeeds`);
          assert.equal(R('mapIdForRef(activeMap)'), next, `${d.id}.${dir}: exact destination`);
          assert.equal(R('WALKABLE[activeMap[Math.floor(player.y/TILE)][Math.floor(player.x/TILE)]]'), true, `${d.id}.${dir}: safe walkable landing`);
        } else if (allowedExternalGate) {
          assert.deepEqual(walkableBoundary, [[15,14,7]], `${d.id}: one authored external TOWN_EXIT`);
        } else {
          assert.equal(walkableBoundary.length, 0, `${d.id}.${dir}: exposed edge is visibly blocked`);
        }
      }
    }

    // 7-8. Only the two gate screens connect to the overworld, and each
    // preserves its corresponding marker identity on the round trip.
    assert.deepEqual(layout.filter(d => J(`JSON.stringify(MAP_CATALOG['${d.id}'].map.flat().includes(TOWN_EXIT))`)).map(d => d.id),
      ['MORNAY_WEST_GATE_MAP', 'MORNAY_EAST_GATE_MAP']);
    const crown = J("JSON.stringify(MAP_CATALOG['EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP'].map)");
    assert.deepEqual([crown[3][7], crown[3][8]], [14,14], 'only the two southern crown cells are town entrances');
    assert.equal(crown.flat().filter(t => t === 14).length, 2, 'exactly two overworld entrances');
    for (const spec of [{ point:'west_gate', gate:'MORNAY_WEST_GATE_MAP', col:7 }, { point:'east_gate', gate:'MORNAY_EAST_GATE_MAP', col:8 }]) {
      R(`dialogue.open=false;enterTownAt('mornay','${spec.point}')`);
      assert.equal(R('mapIdForRef(activeMap)'), spec.gate, `${spec.point}: enters exact gate`);
      assert.equal(R('currentTownId'), 'mornay');
      assert.equal(R('continuousWorldViewActive()'), false, 'Mornay uses fixed legacy-town presentation');
      R('transitionCooldown=0;exitTown()');
      assert.equal(R('mapIdForRef(activeMap)'), 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP');
      assert.deepEqual(J('JSON.stringify({col:Math.floor(player.x/TILE),row:Math.floor(player.y/TILE),facing:player.facing})'), { col:spec.col, row:4, facing:'down' }, `${spec.point}: exact paired return placement`);
    }

    // 16. A normal SAVE_VERSION 5 save/load restores a valid Mornay screen.
    R("dialogue.open=false;transitionToLocation({mapId:'MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP',x:7.5*TILE,y:7.5*TILE,facing:'right',state:{inTown:true,currentTownId:'mornay',townBuilding:null}})");
    assert.equal(R('saveGame()'), true, 'save allowed in Mornay');
    R("transitionToLocation({mapId:'MAP',x:7.5*TILE,y:7.5*TILE,facing:'down'});dialogue.open=false");
    assert.equal(R('loadGame()'), true, 'load succeeds');
    assert.equal(R('mapIdForRef(activeMap)'), 'MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP');
    assert.equal(R('currentTownId'), 'mornay');
    assert.equal(R('SAVE_VERSION'), 5, 'save schema unchanged');

    // 17. Conventional debug warp targets West Gate safely.
    const warp = J("JSON.stringify(getDebugWarpDestinations().find(d=>d.id==='town:mornay_west_gate'))");
    assert.equal(warp.mapId, 'MORNAY_WEST_GATE_MAP');
    assert.equal(R("debugWarpToDestination('town:mornay_west_gate').success"), true);
    assert.equal(R('mapIdForRef(activeMap)'), 'MORNAY_WEST_GATE_MAP');
    assert.equal(R('currentTownId'), 'mornay');
    assert.equal(R('WALKABLE[activeMap[Math.floor(player.y/TILE)][Math.floor(player.x/TILE)]]'), true);

    // 18-19. Harbour reserves are presentation-only: ordinary deck tiles,
    // with no map, NPC, interaction, transition or story authority.
    const ferryDef = layout.find(d => d.reserves.includes('inert island ferry berth'));
    const shipDef = layout.find(d => d.reserves.includes('story ship berth'));
    assert.equal(ferryDef.id, 'MORNAY_NORTH_LOWER_WEST_MAP');
    assert.equal(shipDef.id, 'MORNAY_NORTH_UPPER_WEST_MAP');
    assert.ok(J(`JSON.stringify(MAP_CATALOG['${ferryDef.id}'].map.flat())`).includes(58), 'inert ferry berth uses established deck presentation');
    assert.ok(J(`JSON.stringify(MAP_CATALOG['${shipDef.id}'].map.flat())`).includes(58), 'future story-ship berth uses established deck presentation');
    assert.equal(R("Object.keys(MAP_CATALOG).some(id=>/MORNAY.*ISLAND|ISLAND.*MORNAY/.test(id))"), false, 'no Mornay Island map');
    assert.equal(R("getDebugWarpDestinations().some(d=>/mornay.*(ferry|island|ship)/i.test(d.id))"), false, 'no ferry/island/ship debug authority');
    assert.deepEqual(J("JSON.stringify(Object.keys(TOWN_ENTRY_POINTS.mornay))"), ['west_gate','east_gate'], 'reserved berths add no external entry or transition authority');

    // 20-22. Existing towns and regional/story geography retain their
    // authorities; only the crown fingerprint changes from this increment.
    assert.deepEqual(J("JSON.stringify(Object.keys(TOWN_ENTRY_POINTS.calwick))"), ['south','east','west']);
    assert.deepEqual(J("JSON.stringify(Object.keys(TOWN_ENTRY_POINTS.drenwick))"), ['south','west','east']);
    assert.equal(R("MAP_CATALOG['EASTERN_FENS_TRAVELLERS_RISE_MAP'].allowRandomEncounters"), false);
    assert.equal(R("MAP_CATALOG['TRAVELLERS_RISE_CAMP_MAP'].allowRandomEncounters"), false);
    assert.equal(R("MAP_CATALOG['TRAVELLERS_RISE_CAMP_MAP'].map.length"), 15);
    assert.equal(R("Object.keys(MAP_CATALOG).length"), 1097, '407-map integrated baseline plus 690 mainland chunks; Mornay remains 17 exteriors and 44 rooms');
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      const actual = R(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      assert.equal(sha256(actual), fp, `${id}: regional fingerprint current`);
    }
    assert.equal(R('validateGameData().errors'), 0, 'general validation passes');
  },
};
