'use strict';

// Terrain-only contract for the long MQ5 route east of the cable ferry.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const ROUTE = [
  ['EASTERN_BANK_MAP', 5, 2],
  ['EASTERN_FENS_EMBANKMENT_W_MAP', 6, 2],
  ['EASTERN_FENS_EMBANKMENT_E_MAP', 7, 2],
  ['EASTERN_FENS_REEDBELT_N_MAP', 7, 1],
  ['EASTERN_FENS_REEDBELT_E_MAP', 8, 1],
  ['EASTERN_FENS_REEDBELT_S_MAP', 8, 2],
  ['EASTERN_FENS_DRY_RISE_APPROACH_MAP', 9, 2],
  ['EASTERN_FENS_DRY_RISE_MAP', 9, 3],
  ['EASTERN_FENS_DRAINAGE_SW_MAP', 10, 3],
  ['EASTERN_FENS_DRAINAGE_NW_MAP', 10, 2],
  ['EASTERN_FENS_WORKED_REEDS_MAP', 11, 2],
  ['EASTERN_FENS_MANAGED_REEDS_MAP', 12, 2],
  ['EASTERN_FENS_TRAVELLERS_RISE_MAP', 12, 3],
  ['EASTERN_FENS_WIDE_WATER_MAP', 13, 3],
  ['EASTERN_FENS_CHANNEL_APPROACH_W_MAP', 13, 4],
  ['EASTERN_FENS_CHANNEL_APPROACH_E_MAP', 14, 4],
  ['EASTERN_FENS_VALMERE_ROAD_TURN_MAP', 15, 4],
  ['EASTERN_FENS_CHANNEL_ROAD_S_MAP', 15, 3],
  ['EASTERN_FENS_CHANNEL_ROAD_MID_MAP', 15, 2],
  ['EASTERN_FENS_CHANNEL_ROAD_N_MAP', 15, 1],
  ['EASTERN_FENS_VALMERE_REVEAL_MAP', 15, 0],
  ['EASTERN_FENS_VALMERE_SHORE_W_MAP', 16, 0],
  ['EASTERN_FENS_VALMERE_SHORE_E_MAP', 17, 0],
  ['EASTERN_FENS_MORNAY_THRESHOLD_MAP', 18, 0],
];
const NEW_IDS = ROUTE.slice(1).map((entry) => entry[0]);
const CONTENT_KEYS = NEW_IDS.map((_, index) => `eastern_fens_${String(index + 1).padStart(2, '0')}`);

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens: hooked Valmere route, measured camp reservation, and terrain-only contract',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // Registration and physical coordinates are exact and unique.
    assert.equal(g.run('EASTERN_FENS_REGIONAL_CHUNK_DEFINITIONS.length'), 23);
    assert.deepEqual(J('JSON.stringify(EASTERN_FENS_REGIONAL_CHUNK_DEFINITIONS.map(function(d){return [d.mapId,d.chunkX,d.chunkY];}))'), ROUTE.slice(1));
    assert.equal(new Set(ROUTE.map(([, x, y]) => `${x},${y}`)).size, ROUTE.length);
    for (const [id, x, y] of ROUTE) {
      assert.deepEqual(J(`JSON.stringify((function(){var p=regionPlacementForMapId('${id}');return [p.chunkX,p.chunkY];})())`), [x, y], `${id} coordinate`);
      assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${id}'].map.length===15&&REGIONAL_CHUNK_CATALOG['${id}'].map.every(function(row){return row.length===16;})`), true, `${id} is 15x16`);
      assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${id}'].map.flat().every(function(tile){return !!TILE_PROPERTIES[tile];})`), true, `${id} uses registered terrain`);
    }
    assert.equal(g.run('new Set(_REGIONAL_CHUNK_DEFINITIONS.map(function(d){return d.mapId;})).size===_REGIONAL_CHUNK_DEFINITIONS.length'), true);
    assert.equal(g.run("new Set(_REGIONAL_CHUNK_DEFINITIONS.map(function(d){return d.regionId+':'+d.chunkX+','+d.chunkY;})).size===_REGIONAL_CHUNK_DEFINITIONS.length"), true);

    // Deep Reeds is now walkable wet fen terrain (exploration pass), still a
    // deterministic, rendered, visually distinct primitive kept encounter-free.
    assert.equal(g.run('DEEP_REEDS'), 127);
    assert.equal(g.run('WALKABLE[DEEP_REEDS]'), true);
    assert.equal(g.run("TILE_PROPERTIES[DEEP_REEDS].category"), 'natural');
    assert.equal(g.run("TILE_PROPERTIES[DEEP_REEDS].encounterEligible"), true);
    assert.equal(g.run('RENDERABLE_TILE_IDS.has(DEEP_REEDS)'), true);
    assert.equal(g.run('EASTERN_FENS_REGIONAL_CHUNK_DEFINITIONS.every(function(d){return d.map.some(function(row){return row.includes(DEEP_REEDS);});})'), true);

    // The route is one reciprocal structural chain. Its long eastward crossing
    // turns north for four chunks before a shorter eastward southern-shore leg.
    assert.equal(ROUTE.length, 24, 'Eastern Bank plus 23 authored chunks');
    assert.deepEqual(ROUTE.slice(16, 21).map((entry) => entry.slice(1)), [[15,4],[15,3],[15,2],[15,1],[15,0]], 'Valmere approach is predominantly northbound');
    for (let i = 0; i < ROUTE.length - 1; i++) {
      const from = ROUTE[i], to = ROUTE[i + 1];
      const dx = to[1] - from[1], dy = to[2] - from[2];
      const dir = dx === 1 ? 'east' : dx === -1 ? 'west' : dy === 1 ? 'south' : 'north';
      const reverse = { east: 'west', west: 'east', north: 'south', south: 'north' }[dir];
      assert.equal(g.run(`EDGE_TRANSITIONS['${from[0]}']['${dir}'].some(function(s){return s.targetMap==='${to[0]}'&&s.targetEdge==='${reverse}'&&Object.keys(s).every(function(k){return ['targetMap','targetEdge','sourceRange'].includes(k);});})`), true, `${from[0]} -> ${to[0]}`);
      assert.equal(g.run(`EDGE_TRANSITIONS['${to[0]}']['${reverse}'].some(function(s){return s.targetMap==='${from[0]}'&&s.targetEdge==='${dir}'&&Object.keys(s).every(function(k){return ['targetMap','targetEdge','sourceRange'].includes(k);});})`), true, `${to[0]} -> ${from[0]}`);
    }
    for (let a = 0; a < ROUTE.length; a++) {
      for (let b = a + 2; b < ROUTE.length; b++) {
        const first = ROUTE[a], second = ROUTE[b];
        if (Math.abs(first[1] - second[1]) + Math.abs(first[2] - second[2]) !== 1) continue;
        assert.equal(g.run(`Object.values(EDGE_TRANSITIONS['${first[0]}']||{}).flat().some(function(s){return s.targetMap==='${second[0]}';})`), false,
          `${first[0]} has no accidental shortcut to ${second[0]}`);
      }
    }
    assert.equal(g.run("typeof EDGE_TRANSITIONS['EASTERN_FENS_MORNAY_THRESHOLD_MAP'].east"), 'undefined', 'the unfinished port border has no false onward transition');
    assert.equal(g.run("WALKABLE[REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_THRESHOLD_MAP'].map[10][15]]"), true, 'the temporary endpoint itself is safe');

    // The route itself stays in non-negative rows; unplaced coordinates (gap
    // columns, or far north of the authored chunks) still resolve to void.
    assert.equal(ROUTE.every((entry) => entry[1] >= 0 && entry[2] >= 0), true);
    assert.equal(g.run("regionWorldPxToLocal('overworld',2560,-1)"), null);
    assert.equal(g.run("mapIdForChunk('overworld',15,1)"), 'EASTERN_FENS_CHANNEL_ROAD_N_MAP');
    assert.deepEqual(J("JSON.stringify(mapLocalPxToRegionWorldPx('EASTERN_FENS_CHANNEL_ROAD_N_MAP',64,96))"),
      { regionId: 'overworld', worldPxX: 7744, worldPxY: 576 });
    assert.equal(g.run("regionWorldPxToLocal('overworld',7744,576).mapId"), 'EASTERN_FENS_CHANNEL_ROAD_N_MAP');
    assert.equal(g.run("regionPixelBounds('overworld').minChunkY"), -4);
    assert.equal(g.run("buildContinuousWorldPlanFromWorld('overworld',15*COLS*TILE,0,512,480).activePlacement.mapId"), 'EASTERN_FENS_VALMERE_REVEAL_MAP');

    for (const id of ['EASTERN_FENS_VALMERE_REVEAL_MAP', 'EASTERN_FENS_VALMERE_SHORE_W_MAP', 'EASTERN_FENS_VALMERE_SHORE_E_MAP']) {
      assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${id}'].map[0].every(function(t){return t===WATER&&!WALKABLE[t];})`), true, `${id} keeps the Valmere north edge non-walkable`);
      assert.equal(g.run(`typeof EDGE_TRANSITIONS['${id}'].north`), 'undefined', `${id} has no false transition into the Valmere`);
    }

    // The Mornay Threshold now opens north onto the walkable Mornay approach.
    assert.equal(g.run("REGIONAL_CHUNK_CATALOG['EASTERN_FENS_MORNAY_THRESHOLD_MAP'].map[0][7]"), g.run('PATH'), 'the Mornay threshold north edge opens a walkable corridor');
    assert.equal(g.run("EDGE_TRANSITIONS['EASTERN_FENS_MORNAY_THRESHOLD_MAP'].north[0].targetMap"), 'EASTERN_FENS_MORNAY_APPROACH_E_MAP', 'the Mornay threshold seams north to the Mornay approach');

    // Compute the shortest valid tile route over the actual collision table and
    // structural seams. One viewport is canvas.width / TILE = 16 tile steps.
    const measured = J(`JSON.stringify((function(){
      function search(start, goal) {
        var queue=[start], head=0, dist={}, prev={};
        function key(n){return n.id+'|'+n.r+'|'+n.c;}
        dist[key(start)]=0;
        while(head<queue.length){
          var n=queue[head++], nk=key(n);
          if(n.id===goal.id&&n.r===goal.r&&n.c===goal.c){
            var maps=[], cur=nk;
            while(cur){var id=cur.split('|')[0];if(maps[0]!==id)maps.unshift(id);cur=prev[cur];}
            return {distance:dist[nk],maps:maps};
          }
          var map=REGIONAL_CHUNK_CATALOG[n.id].map;
          [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(delta){
            var rr=n.r+delta[0],cc=n.c+delta[1];
            if(rr>=0&&rr<ROWS&&cc>=0&&cc<COLS&&WALKABLE[map[rr][cc]])push({id:n.id,r:rr,c:cc},nk);
          });
          var edge=n.r===0?'north':n.r===ROWS-1?'south':n.c===0?'west':n.c===COLS-1?'east':null;
          if(edge){
            var index=(edge==='north'||edge==='south')?n.c:n.r;
            (EDGE_TRANSITIONS[n.id]&&EDGE_TRANSITIONS[n.id][edge]||[]).forEach(function(seg){
              if(index<seg.sourceRange[0]||index>seg.sourceRange[1])return;
              var target=REGIONAL_CHUNK_CATALOG[seg.targetMap].map,rr=n.r,cc=n.c;
              if(seg.targetEdge==='north')rr=0;else if(seg.targetEdge==='south')rr=ROWS-1;
              else if(seg.targetEdge==='west')cc=0;else cc=COLS-1;
              if(WALKABLE[target[rr][cc]])push({id:seg.targetMap,r:rr,c:cc},nk);
            });
          }
          function push(next,from){var k=key(next);if(dist[k]!==undefined)return;dist[k]=dist[from]+1;prev[k]=from;queue.push(next);}
        }
        return null;
      }
      var west={id:'EASTERN_BANK_MAP',r:8,c:5};
      var east={id:'EASTERN_FENS_MORNAY_THRESHOLD_MAP',r:10,c:15};
      var camp={id:'EASTERN_FENS_TRAVELLERS_RISE_MAP',r:7,c:10};
      return {forward:search(west,east),reverse:search(east,west),toCamp:search(west,camp),campToEnd:search(camp,east),viewportTiles:canvas.width/TILE};
    })())`);
    assert.equal(measured.viewportTiles, 16, 'viewport width derives to 16 tiles at 512px / 32px');
    // Deep Reeds became walkable, so the road is no longer the ONLY path: the
    // shortest walk may cut modest corners through open fen. It stays within ~10%
    // of the original 444-step road (444 -> 400, 9.9% shorter) so the road
    // remains the clearest, fastest route and still threads every chunk in order.
    assert.equal(measured.forward.distance, 400, 'shortest ferry-landing to Valmere threshold route is 400 tile steps');
    assert.ok((444 - measured.forward.distance) / 444 <= 0.11, 'shortest route is not more than ~10% shorter than the original road');
    assert.equal(measured.reverse.distance, measured.forward.distance, 'the same route is safely reversible');
    assert.deepEqual(measured.forward.maps, ROUTE.map((entry) => entry[0]), 'shortest route traverses every planned chunk in order');
    const viewportWidths = measured.forward.distance / measured.viewportTiles;
    assert.equal(viewportWidths, 25, 'the measured route is 25 normal viewport widths');
    const campPercent = measured.toCamp.distance / measured.forward.distance * 100;
    assert.equal(measured.toCamp.distance + measured.campToEnd.distance, measured.forward.distance, 'camp anchor lies on the shortest route');
    assert.equal(measured.toCamp.distance, 215, 'travellers rise anchor is 215 steps from the ferry landing');
    assert.equal(measured.campToEnd.distance, 185, 'Valmere threshold is 185 steps beyond the camp anchor');
    assert.ok(campPercent >= 45 && campPercent <= 60, `camp lies ${campPercent.toFixed(1)}% through the measured route`);

    // The relocated travellers' rise is terrain only, as is every other new chunk.
    assert.ok(g.run("REGIONAL_CHUNK_CATALOG['EASTERN_FENS_TRAVELLERS_RISE_MAP'].map.flat().filter(function(t){return t===GRASS||t===EXPOSED_STONE;}).length") >= 60,
      'travellers rise has a substantial dry stopping area');
    for (let i = 0; i < NEW_IDS.length; i++) {
      const id = NEW_IDS[i], key = CONTENT_KEYS[i];
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), false, `${id} has no random encounters`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), true, `${id} is saveable`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].items.length`), 0, `${id} has no items`);
      assert.equal(g.run(`(MAP_FEATURES['${id}']||[]).length`), 0, `${id} has no feature or quest trigger`);
      assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.physicalMapId==='${id}'||n.map==='${key}';})`), false, `${id} has no NPC`);
      assert.equal(g.run(`Object.prototype.hasOwnProperty.call(OUTDOOR_MAP_DECOR,'${key}')`), false, `${id} has no authored landmark decoration`);
    }
    assert.equal(g.run("QUEST_FLAG_SCHEMA.some(function(k){return /eastern_fens|travellers_rise|valmere|port_threshold/i.test(k);})"), false, 'route adds no saved quest state');
    assert.equal(g.run('SAVE_VERSION'), 5);

    // Access remains behind the existing MQ5 ferry authorization. Debug warps
    // are previews and do not forge story progress.
    assert.equal(g.run("MainQuest=4;placeAtLocation('EAST_CAUSEWAY_MAP',10.5*TILE,8.5*TILE);crossCausewayFerry()"), false);
    assert.equal(g.run("SIMPLE_NPCS.find(function(n){return n.id==='causeway_ferry_operator';}).map"), null);
    g.run("debugWarpToDestination('outdoor:EASTERN_FENS_MORNAY_THRESHOLD_MAP');");
    assert.equal(g.run("regionPlacementForMapId(mapIdForRef(activeMap)).chunkY"), 0, 'debug warp resolves the northern-row endpoint');
    assert.equal(g.run('MainQuest'), 4, 'debug preview remains progression-neutral');
  },
};
