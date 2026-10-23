'use strict';

// Eastern Fens regional envelope (Phase 2). PERMANENT INVARIANT: using the real
// production camera (continuousCameraOrigin) and visible-chunk geometry at the
// native 512x480 viewport, no reachable Eastern Fens tile can ever scroll an
// UNPLACED regional coordinate (void) into view. Also locks the 37 new chunks
// (4 walkable infill + 33 non-walkable scenery), the resolved bridge/road spurs,
// and that the route is unshortened.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const INFILL = {
  EASTERN_FENS_BRIDGE_INLET_W_MAP: [13, 2],
  EASTERN_FENS_BRIDGE_INLET_E_MAP: [14, 2],
  EASTERN_FENS_CHANNEL_ELBOW_MAP: [14, 3],
  EASTERN_FENS_REED_HOLLOW_MAP: [11, 3],
};
// (10,1),(6,3),(9,4) were upgraded to walkable western pockets (increment 3);
// (7,0),(8,0),(6,1) to the walkable NW open fen (increment 4); (14,0) to the
// Valmere expanse gateway (later increment); (18,1) to the Eastern Shore
// gateway and (15,5) to the Southern Moraine gateway (final increment); the
// rest stay scenery.
const SCENERY_COORDS = [
  [6,0],[9,0],[5,1],[9,1],[11,1],[12,1],[13,1],
  [14,1],[16,1],[17,1],[16,2],[16,3],[16,4],
  [5,3],[7,3],[8,3],[8,4],[10,4],[11,4],[12,4],[12,5],[13,5],[14,5],[16,5],
];
const WESTERN_POCKETS = [
  ['EASTERN_FENS_ENVELOPE_C6R3_MAP', 6, 3],
  ['EASTERN_FENS_ENVELOPE_C10R1_MAP', 10, 1],
  ['EASTERN_FENS_ENVELOPE_C9R4_MAP', 9, 4],
  ['EASTERN_FENS_ENVELOPE_C7R0_MAP', 7, 0],
  ['EASTERN_FENS_ENVELOPE_C8R0_MAP', 8, 0],
  ['EASTERN_FENS_ENVELOPE_C6R1_MAP', 6, 1],
];

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens envelope: zero visible void from reachable terrain, 4 walkable infill + 33 scenery, resolved spurs',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // The 4 infill chunks are placed, player-accessible, encounter/content-free.
    for (const id of Object.keys(INFILL)) {
      const [cx, cy] = INFILL[id];
      assert.deepEqual(J(`JSON.stringify((function(){var p=regionPlacementForMapId('${id}');return [p.chunkX,p.chunkY];})())`), [cx, cy], `${id} placed at ${cx},${cy}`);
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), true, `${id} is walkable/accessible`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), false, `${id} no encounters`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].items.length`), 0, `${id} no items`);
      assert.equal(g.run(`(MAP_FEATURES['${id}']||[]).length`), 0, `${id} no feature/quest trigger`);
      assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.physicalMapId==='${id}';})`), false, `${id} no NPC`);
    }
    // The 33 scenery perimeter chunks are placed, NOT player-accessible, non-saving.
    for (const [cx, cy] of SCENERY_COORDS) {
      const id = g.run(`mapIdForChunk('overworld',${cx},${cy})`);
      assert.ok(id, `a chunk is placed at ${cx},${cy}`);
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), false, `${id} (${cx},${cy}) is scenery-only`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), false, `${id} does not save`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), false, `${id} no encounters`);
    }
    // The walkable off-road pockets (western increment 3 + NW open fen increment 4)
    // are accessible, upgraded from scenery, and still content-free. (7,0)/(8,0)
    // are the one exception: the Fen Zolom gate (see test 178), encounters on.
    for (const [id, cx, cy] of WESTERN_POCKETS) {
      const isGate = id === 'EASTERN_FENS_ENVELOPE_C7R0_MAP' || id === 'EASTERN_FENS_ENVELOPE_C8R0_MAP';
      assert.equal(g.run(`mapIdForChunk('overworld',${cx},${cy})`), id, `${id} placed at ${cx},${cy}`);
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), true, `${id} is a walkable pocket`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), isGate, `${id} encounters ${isGate ? 'on (Fen Zolom gate)' : 'off'}`);
    }
    // Totals after increments 3 + 4 + the Great Fen expansion (28 Great Fen
    // chunks: 4 converted entry chunks + 24 fresh, all walkable).
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.length'), 934, 'route + infill + scenery + northern water placements + Great Fen');
    assert.equal(g.run('REGIONAL_LAYOUT.overworld.placements.filter(function(p){return mapPlayerAccessible(p.mapId);}).length'), 481, '66 pre-Great-Fen accessible chunks + 28 Great Fen chunks');

    // THE PERMANENT INVARIANT: zero visible void from every reachable EF tile.
    const voidResult = J(`JSON.stringify((function(){
      // 1) reachable EF tiles from the ferry across structural seams
      var start={id:'EASTERN_BANK_MAP',r:8,c:5}, seen={}, reach=[];
      function key(n){return n.id+'|'+n.r+'|'+n.c;}
      var stack=[start]; seen[key(start)]=1;
      while(stack.length){var n=stack.pop(), map=REGIONAL_CHUNK_CATALOG[n.id].map;
        function push(x){var k=key(x);if(seen[k])return;if(!WALKABLE[REGIONAL_CHUNK_CATALOG[x.id].map[x.r][x.c]])return;seen[k]=1;stack.push(x);}
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d){var rr=n.r+d[0],cc=n.c+d[1];
          if(rr>=0&&rr<ROWS&&cc>=0&&cc<COLS&&WALKABLE[map[rr][cc]])push({id:n.id,r:rr,c:cc});});
        var edge=n.r===0?'north':n.r===ROWS-1?'south':n.c===0?'west':n.c===COLS-1?'east':null;
        if(edge){var idx=(edge==='north'||edge==='south')?n.c:n.r;
          ((EDGE_TRANSITIONS[n.id]||{})[edge]||[]).forEach(function(seg){
            if(idx<seg.sourceRange[0]||idx>seg.sourceRange[1])return;
            var rr=n.r,cc=n.c; if(seg.targetEdge==='north')rr=0;else if(seg.targetEdge==='south')rr=ROWS-1;else if(seg.targetEdge==='west')cc=0;else cc=COLS-1;
            push({id:seg.targetMap,r:rr,c:cc});});}
      }
      Object.keys(seen).forEach(function(k){var p=k.split('|');
        if(REGIONAL_CHUNK_CATALOG[p[0]]&&REGIONAL_CHUNK_CATALOG[p[0]].region==='Eastern Fens')reach.push([p[0],+p[1],+p[2]]);});
      // 2) for every reachable tile, the real camera's visible chunk coords; any unplaced = void
      var voids={}, cw=COLS*TILE, chp=ROWS*TILE, n=reach.length;
      for(var i=0;i<n;i++){var e=reach[i];
        var w=mapLocalPxToRegionWorldPx(e[0],(e[2]+0.5)*TILE,(e[1]+0.5)*TILE);
        var ex=resolveLegacyCameraExclusion('overworld',e[0]);
        var cam=continuousCameraOrigin('overworld',w.worldPxX,w.worldPxY,512,480,ex);
        if(!cam)continue;
        var fx=Math.floor(cam.camPxX/cw),lx=Math.ceil((cam.camPxX+512)/cw)-1;
        var fy=Math.floor(cam.camPxY/chp),ly=Math.ceil((cam.camPxY+480)/chp)-1;
        for(var cy=fy;cy<=ly;cy++)for(var cx=fx;cx<=lx;cx++){
          if(!chunkVisibleTileRange(cam.camPxX,cam.camPxY,512,480,cx,cy))continue;
          if(!mapIdForChunk('overworld',cx,cy))voids[cx+','+cy]=1;
        }
      }
      return {reachable:n, voids:Object.keys(voids)};
    })())`);
    assert.ok(voidResult.reachable > 3000, `broad reachable fen (${voidResult.reachable} tiles)`);
    assert.deepEqual(voidResult.voids, [], 'no reachable Eastern Fens tile can scroll an unplaced (void) coordinate into the 512x480 camera');

    // Camera bounds are unchanged by Phase 2 itself (all new Phase-2 chunks
    // fit inside the existing overworld bbox); the later Great Fen, Valmere,
    // Eastern Shore, and Southern Moraine expansions grow the bbox further
    // north, east, and south, which this same assertion now reflects.
    const b = J("JSON.stringify(regionPixelBounds('overworld'))");
    assert.equal(b.maxChunkX, 30, 'east bbox now col 20 (the Valmere expanse open water)');
    assert.equal(b.maxChunkY, 12, 'south bbox now row 7 (the Southern Moraine expansion)');
    assert.equal(b.minChunkY, -15, 'north bbox now row -7 (the Great Fen + Valmere expansions)');

    // Resolved spurs: the WIDE_WATER north bridge is now a real seam into the
    // bridge inlet (13,2); the CHANNEL_APPROACH_W south road now ends against the
    // placed southern fen chunk (13,5), not void.
    assert.equal(g.run("(EDGE_TRANSITIONS['EASTERN_FENS_WIDE_WATER_MAP'].north||[]).some(function(s){return s.targetMap==='EASTERN_FENS_BRIDGE_INLET_W_MAP';})"), true, 'WIDE_WATER north bridge enters the inlet');
    assert.ok(g.run("mapIdForChunk('overworld',13,5)"), 'CHANNEL_APPROACH_W south road ends against a placed fen chunk at (13,5)');

    // Every new seam lands on a base-walkable tile (no blocked/out-of-bounds).
    const badLandings = J(`JSON.stringify((function(){
      var bad=[]; var fresh=['EASTERN_FENS_WIDE_WATER_MAP','EASTERN_FENS_WORKED_REEDS_MAP','EASTERN_FENS_BRIDGE_INLET_W_MAP','EASTERN_FENS_BRIDGE_INLET_E_MAP','EASTERN_FENS_CHANNEL_ELBOW_MAP','EASTERN_FENS_REED_HOLLOW_MAP'];
      fresh.forEach(function(id){var dirs=EDGE_TRANSITIONS[id]||{},src=mapRefForId(id);
        Object.keys(dirs).forEach(function(dir){ (dirs[dir]||[]).forEach(function(seg){
          var sr=seg.sourceRange,er=dir==='north'?0:dir==='south'?ROWS-1:null,ec=dir==='west'?0:dir==='east'?COLS-1:null;
          for(var a=sr[0];a<=sr[1];a++){var r=er!==null?er:a,c=ec!==null?ec:a;
            if(!src[r]||!WALKABLE[src[r][c]])continue;
            var L=edgeTransitionLanding(seg,a),tm=mapRefForId(seg.targetMap);
            if(!L||L.row<0||L.row>=ROWS||L.col<0||L.col>=COLS||!WALKABLE[tm[L.row][L.col]])bad.push(id+' '+dir+' '+a);}
        });});
      });
      return bad;
    })())`);
    assert.deepEqual(badLandings, [], 'every new envelope seam lands on walkable terrain');

    // The infill pockets are dead-ends off the route: the ferry->threshold
    // shortest walk is unchanged at 400 steps (no cross-country shortcut added).
    const dist = g.run(`(function(){
      function search(start,goal){var q=[start],h=0,dist={},key=function(n){return n.id+'|'+n.r+'|'+n.c;};dist[key(start)]=0;
        while(h<q.length){var n=q[h++],nk=key(n);if(n.id===goal.id&&n.r===goal.r&&n.c===goal.c)return dist[nk];
          var map=REGIONAL_CHUNK_CATALOG[n.id].map;
          [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d){var rr=n.r+d[0],cc=n.c+d[1];if(rr>=0&&rr<ROWS&&cc>=0&&cc<COLS&&WALKABLE[map[rr][cc]])push({id:n.id,r:rr,c:cc},nk);});
          var edge=n.r===0?'north':n.r===ROWS-1?'south':n.c===0?'west':n.c===COLS-1?'east':null;
          if(edge){var idx=(edge==='north'||edge==='south')?n.c:n.r;((EDGE_TRANSITIONS[n.id]||{})[edge]||[]).forEach(function(seg){if(idx<seg.sourceRange[0]||idx>seg.sourceRange[1])return;var t=REGIONAL_CHUNK_CATALOG[seg.targetMap].map,rr=n.r,cc=n.c;if(seg.targetEdge==='north')rr=0;else if(seg.targetEdge==='south')rr=ROWS-1;else if(seg.targetEdge==='west')cc=0;else cc=COLS-1;if(WALKABLE[t[rr][cc]])push({id:seg.targetMap,r:rr,c:cc},nk);});}
          function push(x,f){var k=key(x);if(dist[k]!==undefined)return;dist[k]=dist[f]+1;q.push(x);}}
        return null;}
      return search({id:'EASTERN_BANK_MAP',r:8,c:5},{id:'EASTERN_FENS_MORNAY_THRESHOLD_MAP',r:10,c:15});
    })()`);
    assert.equal(dist, 400, 'ferry->threshold shortest walk unchanged at 400 steps');
  },
};
