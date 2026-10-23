'use strict';

// Valmere expanse (BOUNDED OVERWORLD VOLUME EXPANSION, increment 2: the
// inland sea's open-water/near-shore extension north of the Mornay
// peninsula). Entered only from EASTERN_FENS_VALMERE_REVEAL_MAP via a single
// new reed-gap seam opened in its west border, leading into converted
// EASTERN_FENS_ENVELOPE_C14R0_MAP/C14RN1_MAP, then north into fresh
// territory. Every walkable chunk is encounter-enabled immediately on the
// established hard Eastern Fens/Mornay formation pool; roadless throughout;
// open water stays non-walkable/encounter-disabled; none of the six
// protected Mornay peninsula grids are touched.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function context() { const g = createContext(); g.press('Enter'); g.press('Enter'); return g; }

// The 2 converted entry chunks keep their original, stable mapIds/coordinates.
const CONVERTED = [
  ['EASTERN_FENS_ENVELOPE_C14R0_MAP', 14, 0],
  ['EASTERN_FENS_ENVELOPE_C14RN1_MAP', 14, -1],
];
// The 11 fresh walkable near-shore chunks.
const FRESH = [
  ['VALMERE_EXPANSE_C13RN6_MAP', 13, -6], ['VALMERE_EXPANSE_C14RN6_MAP', 14, -6],
  ['VALMERE_EXPANSE_C14RN5_MAP', 14, -5], ['VALMERE_EXPANSE_C15RN5_MAP', 15, -5],
  ['VALMERE_EXPANSE_C13RN4_MAP', 13, -4], ['VALMERE_EXPANSE_C14RN4_MAP', 14, -4],
  ['VALMERE_EXPANSE_C13RN3_MAP', 13, -3], ['VALMERE_EXPANSE_C14RN3_MAP', 14, -3],
  ['VALMERE_EXPANSE_C13RN2_MAP', 13, -2], ['VALMERE_EXPANSE_C14RN2_MAP', 14, -2],
  ['VALMERE_EXPANSE_C13RN1_MAP', 13, -1],
];
const ALL_WALK = [...CONVERTED, ...FRESH];
const WALK_IDS = new Set(ALL_WALK.map(([id]) => id));
const ENTRANCE = 'EASTERN_FENS_VALMERE_REVEAL_MAP';

// The 35 non-walkable open-water envelope chunks.
const ENVELOPE = [
  ['VALMERE_EXPANSE_ENVELOPE_C12RN7_MAP', 12, -7], ['VALMERE_EXPANSE_ENVELOPE_C13RN7_MAP', 13, -7],
  ['VALMERE_EXPANSE_ENVELOPE_C14RN7_MAP', 14, -7], ['VALMERE_EXPANSE_ENVELOPE_C15RN7_MAP', 15, -7],
  ['VALMERE_EXPANSE_ENVELOPE_C16RN7_MAP', 16, -7], ['VALMERE_EXPANSE_ENVELOPE_C17RN7_MAP', 17, -7],
  ['VALMERE_EXPANSE_ENVELOPE_C18RN7_MAP', 18, -7], ['VALMERE_EXPANSE_ENVELOPE_C19RN7_MAP', 19, -7],
  ['VALMERE_EXPANSE_ENVELOPE_C20RN7_MAP', 20, -7],
  ['VALMERE_EXPANSE_ENVELOPE_C12RN6_MAP', 12, -6], ['VALMERE_EXPANSE_ENVELOPE_C15RN6_MAP', 15, -6],
  ['VALMERE_EXPANSE_ENVELOPE_C16RN6_MAP', 16, -6], ['VALMERE_EXPANSE_ENVELOPE_C17RN6_MAP', 17, -6],
  ['VALMERE_EXPANSE_ENVELOPE_C18RN6_MAP', 18, -6], ['VALMERE_EXPANSE_ENVELOPE_C19RN6_MAP', 19, -6],
  ['VALMERE_EXPANSE_ENVELOPE_C20RN6_MAP', 20, -6],
  ['VALMERE_EXPANSE_ENVELOPE_C12RN5_MAP', 12, -5], ['VALMERE_EXPANSE_ENVELOPE_C13RN5_MAP', 13, -5],
  ['VALMERE_EXPANSE_ENVELOPE_C16RN5_MAP', 16, -5], ['VALMERE_EXPANSE_ENVELOPE_C17RN5_MAP', 17, -5],
  ['VALMERE_EXPANSE_ENVELOPE_C18RN5_MAP', 18, -5], ['VALMERE_EXPANSE_ENVELOPE_C19RN5_MAP', 19, -5],
  ['VALMERE_EXPANSE_ENVELOPE_C20RN5_MAP', 20, -5],
  ['VALMERE_EXPANSE_ENVELOPE_C12RN4_MAP', 12, -4], ['VALMERE_EXPANSE_ENVELOPE_C12RN3_MAP', 12, -3],
  ['VALMERE_EXPANSE_ENVELOPE_C12RN2_MAP', 12, -2], ['VALMERE_EXPANSE_ENVELOPE_C12RN1_MAP', 12, -1],
  ['VALMERE_EXPANSE_ENVELOPE_C13R0_MAP', 13, 0], ['VALMERE_EXPANSE_ENVELOPE_C12R0_MAP', 12, 0],
  ['VALMERE_EXPANSE_ENVELOPE_C19R1_MAP', 19, 1], ['VALMERE_EXPANSE_ENVELOPE_C19R0_MAP', 19, 0],
  ['VALMERE_EXPANSE_ENVELOPE_C19RN1_MAP', 19, -1], ['VALMERE_EXPANSE_ENVELOPE_C19RN2_MAP', 19, -2],
  ['VALMERE_EXPANSE_ENVELOPE_C19RN3_MAP', 19, -3], ['VALMERE_EXPANSE_ENVELOPE_C19RN4_MAP', 19, -4],
];
const ROAD_IDS = [2, 12, 21, 58]; // PATH, TOWN_FLOOR, TOWN_MARKET, BRIDGE_DECK
const MORNAY_SIX = ['EASTERN_FENS_MORNAY_NECK_ROAD_MAP', 'EASTERN_FENS_MORNAY_WESTERN_COVE_MAP', 'EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP',
  'EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP', 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP', 'EASTERN_FENS_MORNAY_EASTERN_POINT_MAP'];

module.exports = {
  name: 'Valmere expanse: single-entrance near-shore spine, open-water envelope, hard-pool encounters, no sequence break',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // ── 1. The entrance exists, is a real structural seam, no progression flag. ─
    assert.equal(g.run(`mapPlayerAccessible('${ENTRANCE}')`), true, `${ENTRANCE} stays player-accessible`);
    assert.equal(g.run(`(EDGE_TRANSITIONS['${ENTRANCE}'].west||[]).some(function(s){return s.targetMap==='EASTERN_FENS_ENVELOPE_C14R0_MAP'&&s.targetEdge==='east';})`), true, 'entrance opens west into the Valmere expanse');
    assert.equal(g.run("(EDGE_TRANSITIONS['EASTERN_FENS_ENVELOPE_C14R0_MAP'].east||[]).some(function(s){return s.targetMap==='" + ENTRANCE + "'&&s.targetEdge==='west';})"), true, 'reciprocal east seam exists');
    const seg = J(`JSON.stringify(EDGE_TRANSITIONS['${ENTRANCE}'].west)`);
    for (const s of seg) assert.deepEqual(Object.keys(s).sort(), ['sourceRange', 'targetEdge', 'targetMap'], 'entrance seam has only allowed structural properties (no flag/condition/callback)');

    // ── 2. Every chunk placed at its authored coordinate, unique mapId, no
    //      coordinate collides with any other placed chunk anywhere. ────────
    const ALL = [...ALL_WALK, ...ENVELOPE];
    for (const [id, cx, cy] of ALL) {
      assert.equal(g.run(`mapIdForChunk('overworld',${cx},${cy})`), id, `${id} placed at (${cx},${cy})`);
    }
    const allCoordKeys = J("JSON.stringify(REGIONAL_LAYOUT.overworld.placements.map(function(p){return p.chunkX+','+p.chunkY;}))");
    assert.equal(new Set(allCoordKeys).size, allCoordKeys.length, 'no two placed chunks share a coordinate');
    assert.equal(new Set(ALL.map(([id]) => id)).size, ALL.length, `${ALL.length} unique Valmere expanse mapIds`);

    // ── 3. No road tile anywhere in the Valmere expanse. ────────────────────
    for (const [id] of ALL) {
      const flat = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map.flat())`);
      for (const roadId of ROAD_IDS) assert.ok(!flat.includes(roadId), `${id} contains no road tile id ${roadId}`);
    }

    // ── 4. Every walkable chunk is encounter-enabled immediately, routed
    //      through the established hard pool. ──────────────────────────────
    for (const [id] of ALL_WALK) {
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), true, `${id} has encounters enabled immediately`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].encounterPool===EASTERN_FENS_MORNAY_HARD_FORMATIONS`), true, `${id} resolves through the hard pool`);
      assert.equal(g.run(`_REGIONAL_CHUNK_DEFINITIONS.find(function(d){return d.mapId==='${id}';}).encounterProfileId`), 'eastern_fens_mornay_hard', `${id} authored with the hard profile id`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), true, `${id} allows save`);
    }

    // ── 5. Open water stays non-walkable, encounter-disabled, unsaved, and
    //      carries zero EDGE_TRANSITIONS of its own (no tile-path crosses
    //      the lake). ──────────────────────────────────────────────────────
    for (const [id] of ENVELOPE) {
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), false, `${id} stays non-walkable`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), false, `${id} stays encounter-disabled`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), false, `${id} stays unsaved`);
      assert.equal(g.run(`typeof EDGE_TRANSITIONS['${id}']`), 'undefined', `${id} carries no transitions (no path crosses open water)`);
    }

    // ── 6. Closed-system topology: every EDGE_TRANSITIONS target reachable
    //      from a Valmere walkable chunk is either another Valmere walkable
    //      chunk or the single authorized entrance -- never Mornay,
    //      Travellers' Rise, the North Basin, or any other region. ─────────
    for (const [id] of ALL_WALK) {
      const targets = J(`JSON.stringify(Object.values(EDGE_TRANSITIONS['${id}']||{}).flat().map(function(s){return s.targetMap;}))`);
      for (const t of targets) assert.ok(WALK_IDS.has(t) || t === ENTRANCE, `${id} seam -> ${t} stays inside the Valmere expanse or its one authorized entrance`);
    }
    {
      const targets = J(`JSON.stringify(Object.values(EDGE_TRANSITIONS['${ENTRANCE}']||{}).flat().map(function(s){return s.targetMap;}))`);
      for (const t of targets) {
        assert.ok(WALK_IDS.has(t) || t === 'EASTERN_FENS_CHANNEL_ROAD_N_MAP' || t === 'EASTERN_FENS_VALMERE_SHORE_W_MAP',
          `${ENTRANCE} seam -> ${t} is the Valmere expanse or the pre-existing Eastern Fens route (never Mornay/North Basin/wider continent)`);
      }
    }
    // None of the six protected Mornay peninsula chunks appear anywhere in
    // the Valmere expanse's own reachable id set.
    for (const mornayId of MORNAY_SIX) assert.ok(!WALK_IDS.has(mornayId), `${mornayId} is not part of the Valmere expanse`);

    // ── 7. Full connectivity: BFS across the expanse's own graph from the
    //      entrance reaches every walkable chunk -- one connected network,
    //      no isolated pockets. ────────────────────────────────────────────
    function bfsFrom(startId) {
      const seen = new Set([startId]);
      const stack = [startId];
      while (stack.length) {
        const id = stack.pop();
        const dirs = J(`JSON.stringify(EDGE_TRANSITIONS['${id}']||{})`);
        for (const segs of Object.values(dirs)) {
          for (const seg of segs) {
            if (!seen.has(seg.targetMap)) { seen.add(seg.targetMap); stack.push(seg.targetMap); }
          }
        }
      }
      return seen;
    }
    const reached = bfsFrom(ENTRANCE);
    for (const [id] of ALL_WALK) assert.ok(reached.has(id), `${id} reachable from the Valmere entrance`);

    // ── 8. Every branch is safely returnable: every directed seam out of a
    //      Valmere chunk (or the entrance, restricted to the Valmere side)
    //      has a reciprocal seam back. ───────────────────────────────────────
    for (const [id] of [...ALL_WALK, [ENTRANCE]]) {
      const dirs = J(`JSON.stringify(EDGE_TRANSITIONS['${id}']||{})`);
      for (const [dir, segs] of Object.entries(dirs)) {
        for (const seg of segs) {
          if (!WALK_IDS.has(seg.targetMap) && seg.targetMap !== ENTRANCE) continue;
          const backSegs = J(`JSON.stringify((EDGE_TRANSITIONS['${seg.targetMap}']||{})['${seg.targetEdge}']||[])`);
          assert.ok(backSegs.some((b) => b.targetMap === id), `${id} ${dir} -> ${seg.targetMap} has a reciprocal seam back`);
        }
      }
    }

    // ── 9. Protected grids: the entrance is byte-identical to its
    //      pre-expansion grid except the 3 authorized seam cells (col 0,
    //      rows 6-8). The six Mornay peninsula grids are completely
    //      untouched (fingerprints stable). ─────────────────────────────────
    {
      const current = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ENTRANCE}'].map)`);
      const restored = current.map((row) => row.slice());
      restored[6][0] = 1; restored[7][0] = 1; restored[8][0] = 1; // WATER
      let diffCells = 0;
      for (let r = 0; r < 15; r++) for (let c = 0; c < 16; c++) if (restored[r][c] !== current[r][c]) diffCells++;
      assert.equal(diffCells, 3, `${ENTRANCE}: exactly the 3 authorized seam cells differ from its pre-expansion grid`);
    }
    for (const id of MORNAY_SIX) {
      const got = sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`));
      assert.equal(got, GRID_FP.fingerprints[id], `${id}: Mornay peninsula grid untouched by the Valmere expansion`);
    }

    // ── 10. No new NPC/pickup/quest/story content anywhere in the Valmere
    //       expanse. ─────────────────────────────────────────────────────────
    for (const [id] of ALL) {
      assert.equal(g.run(`MAP_CATALOG['${id}'].items.length`), 0, `${id} has no items`);
      assert.equal(g.run(`(MAP_FEATURES['${id}']||[]).length`), 0, `${id} has no feature/quest trigger`);
      assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.physicalMapId==='${id}';})`), false, `${id} has no NPC`);
    }

    // ── 11. Save/load restores the exact valid Valmere map/placement. ──────
    const SAMPLE = 'VALMERE_EXPANSE_C14RN3_MAP'; // interior chunk, reachable from the entrance
    g.run(`placeAtLocation('${SAMPLE}',8.5*TILE,8.5*TILE);player.facing='right';saveGame();`);
    const saved = J("localStorage.getItem('verdantVale_save')");
    assert.equal(saved.version, 5, 'SAVE_VERSION unchanged');
    assert.equal(saved.location.kind, 'regional', 'regional save payload shape unchanged');
    g.run("placeAtLocation('MAP2',2.5*TILE,2.5*TILE);player.facing='down';");
    assert.equal(g.run('loadGame()'), true, 'load succeeds');
    assert.equal(g.run('mapIdForRef(activeMap)'), SAMPLE, 'load restores the exact saved Valmere map');
    assert.equal(g.run('player.x'), 8.5 * g.run('TILE'));
    assert.equal(g.run('player.y'), 8.5 * g.run('TILE'));
    assert.equal(g.run('player.facing'), 'right');

    // ── 12. Zero visible void from every reachable Valmere tile, using the
    //       real production camera at the native 512x480 viewport. ─────────
    const voidResult = J(`JSON.stringify((function(){
      var start={id:'${ENTRANCE}',r:0,c:0}, seen={}, reach=[];
      function key(n){return n.id+'|'+n.r+'|'+n.c;}
      // seed from every walkable-border cell of the entrance so the BFS can
      // actually enter the expanse regardless of which cell we start from
      var map0=REGIONAL_CHUNK_CATALOG[start.id].map;
      for (var rr=0; rr<ROWS; rr++) for (var cc=0; cc<COLS; cc++) if (WALKABLE[map0[rr][cc]]) { seen[key({id:start.id,r:rr,c:cc})]=1; }
      var stack=Object.keys(seen).map(function(k){var p=k.split('|');return {id:p[0],r:+p[1],c:+p[2]};});
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
        if(REGIONAL_CHUNK_CATALOG[p[0]]&&REGIONAL_CHUNK_CATALOG[p[0]].region==='Valmere')reach.push([p[0],+p[1],+p[2]]);});
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
      return {reachable:n, reachedAllValmere: reach.length>=${ALL_WALK.length}, voids:Object.keys(voids)};
    })())`);
    assert.ok(voidResult.reachedAllValmere, `BFS from the entrance reaches all ${ALL_WALK.length} Valmere walkable chunks (got ${voidResult.reachable})`);
    assert.deepEqual(voidResult.voids, [], 'no reachable Valmere tile can scroll an unplaced (void) coordinate into the 512x480 camera');

    // ── 13. validateGameData() stays clean with the Valmere expanse registered. ──
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0, 'no validation errors');
  },
};
