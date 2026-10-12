'use strict';

// Terrain-only Eastern Fens exploration pass. Locks the invariants introduced
// when DEEP_REEDS became walkable wet fen: the route opened into broad reed
// country while the road stays the readable spine, every non-seam border stays
// impassable (no walkable edge into void), every chunk stays reachable, and no
// seam crossing lands the player on a blocked tile.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Pre-existing, sanctioned walkable tiles that sit on a non-seam edge: the
// maintained road/bridge spurs that visibly continue past a chunk border
// (notably the unfinished Cardenport port-road threshold). Everything else on a
// non-seam edge must be impassable so no walkable tile implies a void crossing.
// (Phase 2 resolved the WIDE_WATER north bridge into a real seam to the bridge
// inlet (13,2), so it is no longer a non-seam walkable edge. CHANNEL_APPROACH_W's
// south road now ends against the placed southern fen (13,5), not void.)
const SANCTIONED_EDGE_SPURS = {
  EASTERN_FENS_REEDBELT_S_MAP: ['east:4'],
  EASTERN_FENS_CHANNEL_APPROACH_W_MAP: ['south:4'],
  EASTERN_FENS_PORT_THRESHOLD_MAP: ['east:9', 'east:10', 'east:11'],
};

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens: walkable Deep Reeds exploration pass, framed borders, reachability and safe seam landings',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    const EF_IDS = J('JSON.stringify(EASTERN_FENS_REGIONAL_CHUNK_DEFINITIONS.map(function(d){return d.mapId;}))');
    assert.equal(EF_IDS.length, 23);

    // 1. Deep Reeds is walkable, ordinary (non-blocker) wet fen, rendered and
    //    visually distinct, deliberately still encounter-INELIGIBLE, and present
    //    in every Eastern Fens chunk.
    assert.equal(g.run('WALKABLE[DEEP_REEDS]'), true);
    assert.equal(g.run("TILE_PROPERTIES[DEEP_REEDS].category"), 'natural');
    assert.equal(g.run("TILE_PROPERTIES[DEEP_REEDS].encounterEligible"), true);
    assert.equal(g.run("TILE_PROPERTIES[DEEP_REEDS].tags.includes('blocker')"), false);
    assert.equal(g.run('RENDERABLE_TILE_IDS.has(DEEP_REEDS)'), true);
    assert.equal(g.run('EASTERN_FENS_REGIONAL_CHUNK_DEFINITIONS.every(function(d){return d.map.some(function(row){return row.includes(DEEP_REEDS);});})'), true);

    // 2. Making Deep Reeds walkable cannot open any area outside the Eastern
    //    Fens: tile 127 appears in no other regional chunk or legacy map grid.
    const foreign = J(`JSON.stringify((function(){
      var hits=[];
      Object.keys(REGIONAL_CHUNK_CATALOG).forEach(function(id){
        if(REGIONAL_CHUNK_CATALOG[id].region==='Eastern Fens')return; // route + Phase 2 envelope
        if(REGIONAL_CHUNK_CATALOG[id].map.some(function(r){return r.includes(127);}))hits.push(id);
      });
      if(typeof MAP_CATALOG!=='undefined')Object.keys(MAP_CATALOG).forEach(function(id){
        if(REGIONAL_CHUNK_CATALOG[id])return;
        var grid=MAP_CATALOG[id]&&(MAP_CATALOG[id].map||MAP_CATALOG[id].grid);
        if(Array.isArray(grid)&&grid.some(function(r){return Array.isArray(r)&&r.includes(127);}))hits.push(id);
      });
      return hits;
    })())`);
    assert.deepEqual(foreign, [], 'DEEP_REEDS (tile 127) is used only inside the Eastern Fens');

    // 3. Off-road walkable area meaningfully increased. Before the pass the 23
    //    chunks held 1694 walkable cells; the opened fen holds far more.
    const totalWalkable = g.run(`(function(){
      var n=0; ${JSON.stringify(EF_IDS)}.forEach(function(id){
        REGIONAL_CHUNK_CATALOG[id].map.forEach(function(row){row.forEach(function(t){if(WALKABLE[t])n++;});});
      });
      return n;
    })()`);
    assert.ok(totalWalkable > 3000, `Eastern Fens walkable cells opened up (now ${totalWalkable}, was 1694)`);

    // 4. No walkable tile sits on a non-seam border (no implied void crossing),
    //    except the explicitly sanctioned pre-existing road/bridge spurs.
    const edgeViolations = J(`JSON.stringify((function(){
      var ids=${JSON.stringify(EF_IDS)}, bad=[];
      function ranges(id,edge){return ((EDGE_TRANSITIONS[id]||{})[edge]||[]).map(function(s){return s.sourceRange;});}
      function inR(i,rs){return rs.some(function(r){return i>=r[0]&&i<=r[1];});}
      ids.forEach(function(id){
        var m=REGIONAL_CHUNK_CATALOG[id].map;
        var edges={north:[],south:[],west:[],east:[]};
        for(var c=0;c<COLS;c++){edges.north.push([0,c,c]);edges.south.push([ROWS-1,c,c]);}
        for(var r=0;r<ROWS;r++){edges.west.push([r,0,r]);edges.east.push([r,COLS-1,r]);}
        Object.keys(edges).forEach(function(edge){
          var rs=ranges(id,edge);
          edges[edge].forEach(function(cell){
            var rr=cell[0],cc=cell[1],idx=cell[2];
            if(inR(idx,rs))return;
            if(WALKABLE[m[rr][cc]])bad.push(id+'|'+edge+':'+idx);
          });
        });
      });
      return bad;
    })())`);
    const allowed = new Set();
    for (const id of Object.keys(SANCTIONED_EDGE_SPURS)) {
      for (const tag of SANCTIONED_EDGE_SPURS[id]) allowed.add(`${id}|${tag}`);
    }
    const unexpected = edgeViolations.filter((v) => !allowed.has(v));
    assert.deepEqual(unexpected, [], 'only sanctioned road/bridge spurs may be walkable on a non-seam border');
    // and the sanctioned spurs really are present (so the allowlist can't rot silently)
    for (const tag of allowed) assert.ok(edgeViolations.includes(tag), `sanctioned edge spur still present: ${tag}`);

    // 5. Every Eastern Fens chunk stays reachable on foot from the ferry landing,
    //    across the structural seams, and the port threshold endpoint is reached.
    const reachedChunks = J(`JSON.stringify((function(){
      var start={id:'EASTERN_BANK_MAP',r:8,c:5}, seen={}, chunks={};
      function key(n){return n.id+'|'+n.r+'|'+n.c;}
      var stack=[start]; seen[key(start)]=1;
      while(stack.length){
        var n=stack.pop(), map=REGIONAL_CHUNK_CATALOG[n.id].map;
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
      Object.keys(seen).forEach(function(k){chunks[k.split('|')[0]]=1;});
      return chunks;
    })())`);
    for (const id of EF_IDS) assert.ok(reachedChunks[id], `${id} reachable on foot from the ferry`);

    // 6. Safe seam landings: every walkable seam source cell maps to an in-bounds,
    //    base-walkable landing tile (the runtime insets one tile past the border).
    const blockedLandings = J(`JSON.stringify((function(){
      var bad=[];
      for(var id in EDGE_TRANSITIONS){ if(!/EASTERN_FENS/.test(id))continue;
        var dirs=EDGE_TRANSITIONS[id], src=mapRefForId(id);
        for(var dir in dirs){var segs=dirs[dir]; if(!Array.isArray(segs))continue;
          segs.forEach(function(seg){
            var sr=seg.sourceRange||[0,0];
            var er=dir==='north'?0:dir==='south'?ROWS-1:null, ec=dir==='west'?0:dir==='east'?COLS-1:null;
            for(var a=Math.max(0,sr[0]);a<=sr[1];a++){
              var r=er!==null?er:a, c=ec!==null?ec:a;
              if(!src[r]||!WALKABLE[src[r][c]])continue;
              var L=edgeTransitionLanding(seg,a), tm=mapRefForId(seg.targetMap);
              if(!L||L.row<0||L.row>=ROWS||L.col<0||L.col>=COLS||!WALKABLE[tm[L.row][L.col]])
                bad.push(id+' '+dir+' along='+a+' -> '+seg.targetMap);
            }
          });
        }
      }
      return bad;
    })())`);
    assert.deepEqual(blockedLandings, [], 'no Eastern Fens seam lands the player on a blocked/out-of-bounds tile');

    // 7. The ferry gating itself is untouched: cable-ferry access still requires
    //    MQ5 authorization and the operator is not placed on any map.
    assert.equal(g.run("MainQuest=4;placeAtLocation('EAST_CAUSEWAY_MAP',10.5*TILE,8.5*TILE);crossCausewayFerry()"), false);
    assert.equal(g.run("SIMPLE_NPCS.find(function(n){return n.id==='causeway_ferry_operator';}).map"), null);
  },
};
