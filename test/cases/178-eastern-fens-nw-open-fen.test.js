'use strict';

// NW open-fen expansion (increment 4). The reedbelt (7,1)/(8,1) now opens
// off-road into a walkable open north fen — no terrain wall at the road — that
// the player can wander into. It stays zero-void, never connects to the
// separate North Basin, and holds no content beyond the Fen Zolom gate.
//
// The two north-lobe chunks (7,0)/(8,0) are the gate into the Great Fen: their
// sole random encounter is the Fen Zolom (enemy_fen_zolom, data.js) — 400 HP,
// isBoss:true, essentially unwinnable, escape blocked. isBoss propagates
// through the shared installFormationState() (combat.js) regardless of which
// pool/dispatcher drew the encounter, so no geographic-dispatch code needed to
// change. (6,1), the west lobe, is unaffected and stays on the ordinary 'far' pool.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// NW fen chunk -> the single reedbelt/fen edge each seams on.
const NW = {
  EASTERN_FENS_ENVELOPE_C7R0_MAP: [7, 0],   // north lobe (off reedbelt 7,1 north)
  EASTERN_FENS_ENVELOPE_C8R0_MAP: [8, 0],   // north lobe (off reedbelt 8,1 north)
  EASTERN_FENS_ENVELOPE_C6R1_MAP: [6, 1],   // west lobe (off reedbelt 7,1 west)
};
const WALKABLE_SET = new Set();

function context() { const g = createContext(); g.press('Enter'); g.press('Enter'); return g; }

module.exports = {
  name: 'Eastern Fens NW open fen: reedbelt opens off-road, bounded & zero-void, never joins North Basin, Fen Zolom gate on the two Great Fen entrances',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // (7,1) and (8,1) each open to the north/NW (not sealed by terrain).
    assert.equal(g.run("(EDGE_TRANSITIONS['EASTERN_FENS_REEDBELT_N_MAP'].north||[]).some(function(s){return s.targetMap==='EASTERN_FENS_ENVELOPE_C7R0_MAP';})"), true, '(7,1) opens north into the fen');
    assert.equal(g.run("(EDGE_TRANSITIONS['EASTERN_FENS_REEDBELT_N_MAP'].west||[]).some(function(s){return s.targetMap==='EASTERN_FENS_ENVELOPE_C6R1_MAP';})"), true, '(7,1) opens west into the fen');
    assert.equal(g.run("(EDGE_TRANSITIONS['EASTERN_FENS_REEDBELT_E_MAP'].north||[]).some(function(s){return s.targetMap==='EASTERN_FENS_ENVELOPE_C8R0_MAP';})"), true, '(8,1) opens north into the fen');

    // Each NW chunk: accessible, reciprocal seams, substantial walkable fen, and
    // every seam lands on walkable terrain.
    for (const [id, [cx, cy]] of Object.entries(NW)) {
      assert.equal(g.run(`mapIdForChunk('overworld',${cx},${cy})`), id, `${id} at ${cx},${cy}`);
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), true, `${id} is walkable fen`);
      const walk = g.run(`REGIONAL_CHUNK_CATALOG['${id}'].map.flat().filter(function(t){return WALKABLE[t];}).length`);
      assert.ok(walk >= 40, `${id} is a broad open fen (${walk} walkable tiles)`);
      // never seamed to the separate North Basin / any other foreign chunk.
      // The Great Fen is the one authorized sibling expansion seamed north
      // off (7,0)/(8,0) -- everything else must stay within the Eastern Fens.
      const targets = J(`JSON.stringify(Object.values(EDGE_TRANSITIONS['${id}']||{}).flat().map(function(s){return s.targetMap;}))`);
      for (const t of targets) assert.ok(['Eastern Fens', 'Great Fen'].includes(g.run(`REGIONAL_CHUNK_CATALOG['${t}'].region`)), `${id} seam -> ${t} stays within the Eastern Fens or the Great Fen (never the North Basin)`);
      // reciprocity + walkable landings
      const bad = J(`JSON.stringify((function(){var out=[];var dirs=EDGE_TRANSITIONS['${id}']||{},src=mapRefForId('${id}');
        Object.keys(dirs).forEach(function(dir){(dirs[dir]||[]).forEach(function(seg){
          var back=EDGE_TRANSITIONS[seg.targetMap]&&EDGE_TRANSITIONS[seg.targetMap][seg.targetEdge]||[];
          if(!back.some(function(b){return b.targetMap==='${id}';}))out.push('no-recip '+dir);
          var sr=seg.sourceRange,er=dir==='north'?0:dir==='south'?ROWS-1:null,ec=dir==='west'?0:dir==='east'?COLS-1:null;
          for(var a=sr[0];a<=sr[1];a++){var r=er!==null?er:a,c=ec!==null?ec:a;if(!src[r]||!WALKABLE[src[r][c]])continue;var L=edgeTransitionLanding(seg,a),tm=mapRefForId(seg.targetMap);if(!L||!tm[L.row]||!WALKABLE[tm[L.row][L.col]])out.push('blocked '+dir+' '+a);}
        });});return out;})())`);
      assert.deepEqual(bad, [], `${id} seams are reciprocal and land on walkable ground`);
      // bounded: no walkable tile on a NON-seam edge (ends at authored water, not a bare/void edge)
      const leak = J(`JSON.stringify((function(){var m=REGIONAL_CHUNK_CATALOG['${id}'].map,dirs=EDGE_TRANSITIONS['${id}']||{},leaks=[];
        function inSeam(edge,idx){return (dirs[edge]||[]).some(function(s){return idx>=s.sourceRange[0]&&idx<=s.sourceRange[1];});}
        for(var c=0;c<COLS;c++){if(WALKABLE[m[0][c]]&&!inSeam('north',c))leaks.push('n'+c);if(WALKABLE[m[ROWS-1][c]]&&!inSeam('south',c))leaks.push('s'+c);}
        for(var r=0;r<ROWS;r++){if(WALKABLE[m[r][0]]&&!inSeam('west',r))leaks.push('w'+r);if(WALKABLE[m[r][COLS-1]]&&!inSeam('east',r))leaks.push('e'+r);}
        return leaks;})())`);
      assert.deepEqual(leak, [], `${id} walkable fen ends at authored boundaries, never a bare map edge`);
      // no content (items/NPCs/features) on any of the three lobes
      assert.equal(g.run(`MAP_CATALOG['${id}'].items.length`), 0, `${id} no items`);
      assert.equal(g.run(`(MAP_FEATURES['${id}']||[]).length`), 0, `${id} no feature/trigger`);
      assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.physicalMapId==='${id}';})`), false, `${id} no NPC`);
      // the two Great Fen entrances (7,0)/(8,0) carry the Fen Zolom gate;
      // the west lobe (6,1) is unaffected and stays encounter-free
      const isGate = id === 'EASTERN_FENS_ENVELOPE_C7R0_MAP' || id === 'EASTERN_FENS_ENVELOPE_C8R0_MAP';
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), isGate, `${id} encounters ${isGate ? 'on (Fen Zolom gate)' : 'off (unaffected west lobe)'}`);
    }

    // The Fen Zolom gate: the sole encounter on both entrances is the Fen
    // Zolom, and it is a genuinely unwinnable fight (isBoss blocks escape via
    // the shared installFormationState() path, not a per-dispatcher special case).
    for (const id of ['EASTERN_FENS_ENVELOPE_C7R0_MAP', 'EASTERN_FENS_ENVELOPE_C8R0_MAP']) {
      const pool = J(`JSON.stringify(MAP_CATALOG['${id}'].encounterPool)`);
      assert.equal(pool.length, 1, `${id} pool has exactly one entry`);
      assert.equal(pool[0].id, 'enemy_fen_zolom', `${id} pool is solely the Fen Zolom`);
    }
    const zolom = J("JSON.stringify(ENEMY_TEMPLATE_REGISTRY.enemy_fen_zolom)");
    assert.equal(zolom.hp, 400, 'Fen Zolom has 400 HP');
    assert.equal(zolom.maxHp, 400, 'Fen Zolom maxHp matches hp');
    assert.ok(zolom.atk > 50, 'Fen Zolom hits far harder than ordinary far-pool enemies');
    assert.equal(g.run('ENEMY_TEMPLATE_REGISTRY.enemy_fen_zolom.isBoss'), true, 'Fen Zolom is flagged isBoss');
    assert.equal(g.run('canonicalEnemyIsCompatible(ENEMY_TEMPLATE_REGISTRY.enemy_fen_zolom)'), true, 'Fen Zolom is canonical-party-combat compatible');
    // Entering a Fen Zolom fight genuinely blocks escape (not just flagged) —
    // the run command resolves with allowed:false/chance:0, confirmed directly
    // against the actual event stream, not the requested escape policy string.
    // Turn order within the round is itself randomized (a speed-weighted
    // initiative roll, not a strict sort), so a starter-stat party can
    // otherwise be defeated by the faster Zolom before their queued run is
    // ever reached, making the run event's presence flaky run to run.
    // Math.random is pinned here (restored after) the same way test 155's
    // own tape() helper pins it for deterministic combat-event assertions.
    const originalRandom = g.run('Math.random');
    g.run('Math.random=()=>0');
    const runEvents = J(`JSON.stringify((function(){
      canonicalPartyCombat.enter({enemies:[ENEMY_TEMPLATE_REGISTRY.enemy_fen_zolom], escape:'fastest_living'});
      canonicalPartyCombat.handleInput('right');canonicalPartyCombat.handleInput('right');canonicalPartyCombat.handleInput('right');
      canonicalPartyCombat.handleInput('confirm');canonicalPartyCombat.handleInput('confirm');
      var events=[];
      for(var i=0;i<10;i++){
        var v=canonicalPartyCombat.getView();if(v.phase!=='playback')break;
        if(v.playbackFrame&&v.playbackFrame.currentEvent&&v.playbackFrame.currentEvent.type==='run')events.push(v.playbackFrame.currentEvent);
        canonicalPartyCombat.handleInput('confirm');
      }
      return events;
    })())`);
    g.run('Math').random = originalRandom;
    assert.equal(runEvents.length, 1, 'exactly one run attempt was resolved');
    assert.equal(runEvents[0].allowed, false, 'the Fen Zolom fight disallows running');
    assert.equal(runEvents[0].chance, 0, 'escape chance is exactly zero, not merely low');
    assert.equal(runEvents[0].success, false, 'the run attempt fails');

    // The NW margin stays the fen's open edge: (6,0) is still scenery-only, and
    // (5,0) -- the "expansion-ready" slot this comment used to describe as
    // unbuilt void -- is now filled by the Great Fen's own zero-void framing
    // (GREAT_FEN_ENVELOPE_C5R0_MAP), still non-walkable, never exposed as void.
    const c60 = g.run("mapIdForChunk('overworld',6,0)");
    assert.equal(g.run(`mapPlayerAccessible('${c60}')`), false, '(6,0) stays the scenery open-water NW margin');
    const c50 = g.run("mapIdForChunk('overworld',5,0)");
    assert.equal(c50, 'GREAT_FEN_ENVELOPE_C5R0_MAP', '(5,0) is now the Great Fen envelope framing chunk');
    assert.equal(g.run(`mapPlayerAccessible('${c50}')`), false, '(5,0) stays non-walkable scenery');

    // The three NW chunks are genuinely reachable on foot from the ferry.
    const reached = J(`JSON.stringify((function(){
      var start={id:'EASTERN_BANK_MAP',r:8,c:5}, seen={}, chunks={};
      function key(n){return n.id+'|'+n.r+'|'+n.c;}
      var stack=[start]; seen[key(start)]=1;
      while(stack.length){var n=stack.pop(), map=REGIONAL_CHUNK_CATALOG[n.id].map;
        function push(x){var k=key(x);if(seen[k])return;if(!WALKABLE[REGIONAL_CHUNK_CATALOG[x.id].map[x.r][x.c]])return;seen[k]=1;stack.push(x);}
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d){var rr=n.r+d[0],cc=n.c+d[1];if(rr>=0&&rr<ROWS&&cc>=0&&cc<COLS&&WALKABLE[map[rr][cc]])push({id:n.id,r:rr,c:cc});});
        var edge=n.r===0?'north':n.r===ROWS-1?'south':n.c===0?'west':n.c===COLS-1?'east':null;
        if(edge){var idx=(edge==='north'||edge==='south')?n.c:n.r;((EDGE_TRANSITIONS[n.id]||{})[edge]||[]).forEach(function(seg){if(idx<seg.sourceRange[0]||idx>seg.sourceRange[1])return;var rr=n.r,cc=n.c;if(seg.targetEdge==='north')rr=0;else if(seg.targetEdge==='south')rr=ROWS-1;else if(seg.targetEdge==='west')cc=0;else cc=COLS-1;push({id:seg.targetMap,r:rr,c:cc});});}
      }
      Object.keys(seen).forEach(function(k){chunks[k.split('|')[0]]=1;});
      return chunks;
    })())`);
    for (const id of Object.keys(NW)) assert.ok(reached[id], `${id} is reachable on foot from the ferry`);
  },
};
