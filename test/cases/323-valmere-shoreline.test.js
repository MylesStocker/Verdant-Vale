'use strict';
const assert = require('assert/strict');
const {createContext} = require('../harness');
const {sha} = require('../regional-atlas');
const {J} = require('./317-mainland-navigation.test');
const before = require('../fixtures/valmere-shore-invariants.json');

module.exports = {name: 'Valmere shoreline: scenery-only coves preserve Mornay, playable grids, access, seams and connected open water', run() {
  const g = createContext();
  const d = J(g, '({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})');
  const changed = new Set(before.changedIds);
  assert.equal(sha(d.chunks.filter(c => !changed.has(c.mapId)).map(c => [c.mapId, c.map])), before.protectedGridsSha256,
    'all other grids, including every playable grid and all Mornay approaches, are unchanged');
  assert.equal(sha(d.chunks.map(({map, ...rest}) => rest)), before.metadataSha256,
    'identities, coordinates, capabilities, encounters and regional bounds are unchanged');
  assert.equal(sha(d.edges), before.edgesSha256, 'no new crossings or altered transitions');
  assert.equal(sha(d.tiles), before.tilesSha256, 'existing tile/collision authority only');

  g.run("storyCheckpointLab.apply('mq5_assignment_ready'); dialogue.open=false");
  const placement = () => g.run('JSON.stringify({position:regionalWorldPosition(),map:mapIdForRef(activeMap),x:player.x,y:player.y})');
  const entry = placement();
  for (const id of changed) {
    const c = d.chunks.find(c => c.mapId === id);
    assert.ok(c, id + ' is registered');
    assert.equal(c.playerAccessible, false);
    assert.equal(c.allowRandomEncounters, false);
    assert.equal(c.allowSave, false);
    assert.ok(!d.edges[id] || Object.keys(d.edges[id]).length === 0, 'no scenery entrances');
    assert.ok(!(c.chunkX >= 15 && c.chunkX <= 19 && c.chunkY >= -5 && c.chunkY <= 1), 'Mornay buffer excluded');
    for (const legacy of [false, true]) {
      g.run('forceLegacyRegionalView=' + legacy);
      // A land-coloured scenery tile must not become a valid normal/debug destination.
      const i = c.map.flat().findIndex(t => d.tiles[t].walkable);
      if (i >= 0) assert.equal(g.run(`transitionToLocation({mapId:'${id}',x:${i % 16 * 32 + 16},y:${Math.floor(i / 16) * 32 + 16},facing:'down'})`), false);
      assert.equal(placement(), entry, 'rejected placement stays atomic');
    }
  }

  const by = new Map(d.chunks.map(c => [c.chunkX + ',' + c.chunkY, c]));
  const tile = (x,y) => by.get(Math.floor(x / 16) + ',' + Math.floor(y / 15))?.map[(y % 15 + 15) % 15][(x % 16 + 16) % 16];
  const isWater = (x,y) => d.tiles[tile(x,y)]?.isWater === true;
  // Measured pre-pass longest straight fen-bank run was 45 tiles. Permit natural
  // straighter stretches, but reject a return to long chunk-aligned walls.
  let longest = 0, run = 0, previous;
  for (let y = -225; y < 0; y++) {
    let shore = 95;
    for (let x = 96; x < 192; x++) if (tile(x,y) !== undefined && !isWater(x,y)) shore = x;
    run = shore === previous ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = shore;
  }
  assert.ok(longest < 24, 'fen banks vary within a chunk and a half');

  // Neither bank may close the western channel or bridge the lake with shoals.
  const q = [[195,-1]], seen = new Set(['195,-1']);
  assert.ok(isWater(...q[0]), 'southern channel remains open');
  for (let i = 0; i < q.length; i++) for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const x = q[i][0] + dx, y = q[i][1] + dy, key = x + ',' + y;
    if (x < 175 || x > 225 || y < -130 || y >= 0 || seen.has(key) || !isWater(x,y)) continue;
    seen.add(key); q.push([x,y]);
    assert.equal(d.tiles[tile(x,y)].walkable, false, 'water and submerged snags remain impassable');
  }
  assert.ok(seen.has('220,-125'), 'channel reaches open Valmere beyond the spit');
  const openWater = g.run('WATER');
  for (const c of d.chunks.filter(c => c.chunkX >= 12 && c.chunkY <= -8)) {
    assert.ok(c.map.flat().every(t => t === openWater), 'far lake stays uninterrupted open water');
  }
  assert.equal(g.run('SAVE_VERSION'), 5);
  assert.equal(g.run('validateGameData().errors'), 0);
}};
