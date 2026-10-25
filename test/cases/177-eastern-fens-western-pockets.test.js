'use strict';

// Western Eastern Fens off-road envelope (increment 3). Eastern Bank → managed
// drainage now has walkable off-road pockets you can leave the road to explore,
// each a dead-end that ends at an authored natural boundary (no void, no abrupt
// edge, no shortcut). Terrain/navigation only — no content of any kind.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// pocket mapId -> { route neighbour it seams to, edge on the pocket side }
const POCKETS = {
  EASTERN_FENS_ENVELOPE_C6R3_MAP: { via: 'EASTERN_FENS_EMBANKMENT_W_MAP', edge: 'north' },  // south reedbed
  EASTERN_FENS_ENVELOPE_C10R1_MAP: { via: 'EASTERN_FENS_DRAINAGE_NW_MAP', edge: 'south' },   // drainage flats
  EASTERN_FENS_ENVELOPE_C9R4_MAP: { via: 'EASTERN_FENS_DRY_RISE_MAP', edge: 'north' },        // hummock clearing
};
const INV = { north: 'south', south: 'north', east: 'west', west: 'east' };

function context() { const g = createContext(); g.press('Enter'); g.press('Enter'); return g; }

module.exports = {
  name: 'Eastern Fens western pockets: 3 walkable off-road dead-ends, authored boundaries, route intact, no content',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // ── Deep Reeds walkable + encounter-eligible; tile eligibility alone does
    //    not create encounters — the chunk-level allowRandomEncounters flag
    //    governs it. The Eastern Fens Mornay content pass later enables
    //    encounters on exactly the 22 main-route chunks (easy/hard split by
    //    chunk column); every exploration/envelope chunk (these 3 pockets
    //    included) and Travellers' Rise stay encounter-free. ─────────────────
    assert.equal(g.run('WALKABLE[DEEP_REEDS]'), true);
    assert.equal(g.run('TILE_PROPERTIES[DEEP_REEDS].encounterEligible'), true);
    // 22 main-route Eastern Fens chunks + 14 Great Fen chunks (1 converted
    // entry chunk + 13 fresh) + 7 Valmere expanse chunks (1 converted entry
    // chunk + 6 fresh) + 6 Eastern Shore/Southern Moraine chunks + the 2
    // North Fen Zolom-gate chunks (7,0)/(8,0) that happen to use Deep Reeds
    // and have encounters enabled = 192 after the mainland pass; 14 reserved Thornmere shore grids now reuse it.
    assert.equal(g.run("Object.keys(REGIONAL_CHUNK_CATALOG).filter(function(id){return REGIONAL_CHUNK_CATALOG[id].map.some(function(r){return r.includes(127);})&&MAP_CATALOG[id].allowRandomEncounters===true;}).length"), 206,
      '206 regional chunks with Deep Reeds retain encounter permission, including 14 sealed Thornmere shore chunks');
    for (const id of Object.keys(POCKETS))
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), false, `${id} (exploration pocket) stays encounter-free`);
    // tile 127 is still confined to the Eastern Fens plus its directly-seamed
    // siblings the Great Fen, the Valmere expanse, the Eastern Shore, and the
    // Southern Moraine (no sequence break into any other region)
    assert.deepEqual(J("JSON.stringify(Object.keys(REGIONAL_CHUNK_CATALOG).filter(function(id){return ['Eastern Fens','Great Fen','Valmere','Eastern Shore','Southern Moraine','Wetwoods','Thornmere'].indexOf(REGIONAL_CHUNK_CATALOG[id].region)===-1&&REGIONAL_CHUNK_CATALOG[id].map.some(function(r){return r.includes(127);});}))"), [],
      'DEEP_REEDS used only inside the Eastern Fens, the Great Fen, the Valmere expanse, the Eastern Shore, Southern Moraine, Wetwoods or Thornmere');

    // ── 3 distinct walkable pockets, each a reciprocal single-seam dead-end ────
    let pocketCount = 0;
    for (const [id, p] of Object.entries(POCKETS)) {
      pocketCount++;
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), true, `${id} is walkable`);
      const dirs = J(`JSON.stringify(Object.keys(EDGE_TRANSITIONS['${id}']||{}))`);
      assert.deepEqual(dirs, id==='EASTERN_FENS_ENVELOPE_C9R4_MAP'?[p.edge,'south']:[p.edge], `${id} retains its old approach; dry-rise toe also opens into countryside`);
      // reciprocal: the route neighbour seams back to this pocket
      assert.equal(g.run(`(EDGE_TRANSITIONS['${id}']['${p.edge}']||[]).some(function(s){return s.targetMap==='${p.via}'&&s.targetEdge==='${INV[p.edge]}';})`), true, `${id} seam -> ${p.via}`);
      assert.equal(g.run(`(EDGE_TRANSITIONS['${p.via}']['${INV[p.edge]}']||[]).some(function(s){return s.targetMap==='${id}';})`), true, `${p.via} seams back to ${id}`);
      // the seam lands on walkable terrain both ways
      const bad = J(`JSON.stringify((function(){var out=[];[['${id}'],['${p.via}']].forEach(function(x){var mid=x[0],dirs=EDGE_TRANSITIONS[mid]||{},src=mapRefForId(mid);Object.keys(dirs).forEach(function(dir){(dirs[dir]||[]).forEach(function(seg){if(seg.targetMap!=='${id}'&&seg.targetMap!=='${p.via}')return;var sr=seg.sourceRange,er=dir==='north'?0:dir==='south'?ROWS-1:null,ec=dir==='west'?0:dir==='east'?COLS-1:null;for(var a=sr[0];a<=sr[1];a++){var r=er!==null?er:a,c=ec!==null?ec:a;if(!src[r]||!WALKABLE[src[r][c]])continue;var L=edgeTransitionLanding(seg,a),tm=mapRefForId(seg.targetMap);if(!L||!tm[L.row]||!WALKABLE[tm[L.row][L.col]])out.push(mid+' '+dir+' '+a);}});});});return out;})())`);
      assert.deepEqual(bad, [], `${id} seam lands on walkable terrain both ways`);
      // every walkable cell that sits on a chunk edge is inside the seam range —
      // i.e. the pocket terminates at AUTHORED terrain, never a bare walkable map
      // edge into void/abrupt termination.
      const edgeLeak = J(`JSON.stringify((function(){var m=REGIONAL_CHUNK_CATALOG['${id}'].map,leaks=[];
        var seam=EDGE_TRANSITIONS['${id}']['${p.edge}'][0].sourceRange;
        function ok(edge,idx){return (EDGE_TRANSITIONS['${id}'][edge]||[]).some(s=>idx>=s.sourceRange[0]&&idx<=s.sourceRange[1]);}
        for(var c=0;c<COLS;c++){if(WALKABLE[m[0][c]]&&!ok('north',c))leaks.push('n'+c);if(WALKABLE[m[ROWS-1][c]]&&!ok('south',c))leaks.push('s'+c);}
        for(var r=0;r<ROWS;r++){if(WALKABLE[m[r][0]]&&!ok('west',r))leaks.push('w'+r);if(WALKABLE[m[r][COLS-1]]&&!ok('east',r))leaks.push('e'+r);}
        return leaks;})())`);
      assert.deepEqual(edgeLeak, [], `${id} walkable terrain ends at authored boundaries, not a bare map edge`);
      // the pocket contains a believable non-walkable boundary (water/tree/hills/fence), not just open reed
      assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${id}'].map.flat().some(function(t){return t===WATER||t===TREE_IN_WATER||t===HILLS||t===FENCE_POST;})`), true, `${id} ends at a physical boundary`);
      // no content in the pocket
      assert.equal(g.run(`MAP_CATALOG['${id}'].items.length`), 0, `${id} no items`);
      assert.equal(g.run(`(MAP_FEATURES['${id}']||[]).length`), 0, `${id} no feature/trigger`);
      assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.physicalMapId==='${id}';})`), false, `${id} no NPC`);
    }
    assert.equal(pocketCount, 3, 'three distinct western off-road pockets');

    // ── Ferry → Mornay threshold still traversable BOTH ways at 400 steps ──
    const search = `function(a,b){var q=[a],h=0,D={},K=function(n){return n.id+'|'+n.r+'|'+n.c;};D[K(a)]=0;while(h<q.length){var n=q[h++],k=K(n);if(n.id===b.id&&n.r===b.r&&n.c===b.c)return D[k];var m=REGIONAL_CHUNK_CATALOG[n.id].map;[[-1,0],[1,0],[0,-1],[0,1]].forEach(function(e){var rr=n.r+e[0],cc=n.c+e[1];if(rr>=0&&rr<ROWS&&cc>=0&&cc<COLS&&WALKABLE[m[rr][cc]])p({id:n.id,r:rr,c:cc},k);});var ed=n.r===0?'north':n.r===ROWS-1?'south':n.c===0?'west':n.c===COLS-1?'east':null;if(ed){var ix=(ed==='north'||ed==='south')?n.c:n.r;((EDGE_TRANSITIONS[n.id]||{})[ed]||[]).forEach(function(sg){if(ix<sg.sourceRange[0]||ix>sg.sourceRange[1])return;var t=REGIONAL_CHUNK_CATALOG[sg.targetMap].map,rr=n.r,cc=n.c;if(sg.targetEdge==='north')rr=0;else if(sg.targetEdge==='south')rr=ROWS-1;else if(sg.targetEdge==='west')cc=0;else cc=COLS-1;if(WALKABLE[t[rr][cc]])p({id:sg.targetMap,r:rr,c:cc},k);});}function p(x,f){var kk=K(x);if(D[kk]!==undefined)return;D[kk]=D[f]+1;q.push(x);}}return null;}`;
    const fwd = g.run(`(${search})({id:'EASTERN_BANK_MAP',r:8,c:5},{id:'EASTERN_FENS_MORNAY_THRESHOLD_MAP',r:10,c:15})`);
    const rev = g.run(`(${search})({id:'EASTERN_FENS_MORNAY_THRESHOLD_MAP',r:10,c:15},{id:'EASTERN_BANK_MAP',r:8,c:5})`);
    assert.equal(fwd, 400, 'ferry -> threshold still 400 steps (pockets are dead-ends, no shortcut)');
    assert.equal(rev, 400, 'threshold -> ferry still 400 steps');

    // ── Future camp rise (9,3) reachable but inert ────────────────────────────
    assert.equal(g.run("mapPlayerAccessible('EASTERN_FENS_DRY_RISE_MAP')"), true);
    assert.ok(g.run("REGIONAL_CHUNK_CATALOG['EASTERN_FENS_DRY_RISE_MAP'].map.flat().filter(function(t){return t===GRASS;}).length") >= 40, 'the dry rise keeps its stopping ground');
    assert.equal(g.run("(MAP_FEATURES['EASTERN_FENS_DRY_RISE_MAP']||[]).length"), 0, 'camp rise has no feature/trigger');
    assert.equal(g.run("SIMPLE_NPCS.some(function(n){return n.physicalMapId==='EASTERN_FENS_DRY_RISE_MAP';})"), false, 'camp rise has no NPC');

    // ── Remaining western scenery stays unenterable (no seam, not accessible) ──
    for (const [cx, cy] of [[5,1],[9,1],[7,3]]) {
      const id = g.run(`mapIdForChunk('overworld',${cx},${cy})`);
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), false, `${id} scenery-only`);
      assert.equal(g.run(`typeof EDGE_TRANSITIONS['${id}']`), 'undefined', `${id} has no seam, cannot be entered`);
    }

    // ── No new saved state introduced by this segment ─────────────────────────
    assert.equal(g.run("QUEST_FLAG_SCHEMA.some(function(k){return /env_|pocket|reedbed|hummock|drainage_flat/i.test(k);})"), false, 'no new save flags');
    assert.equal(g.run('SAVE_VERSION'), 5, 'terrain adds no change to the integrated party save version');
  },
};
