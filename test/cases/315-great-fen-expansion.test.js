'use strict';

// Great Fen expansion (BOUNDED OVERWORLD VOLUME EXPANSION, increment 1 of the
// authorized ~60-90 chunk volume: the Great Fen walkable core itself, 28
// chunks -- 4 converted entry chunks + 24 fresh). Entered only from world
// chunks (7,0)/(8,0) via a reed-gap seam opened in their north border; both
// entrances join the SAME connected component; roadless throughout; every
// reachable chunk is encounter-enabled immediately on the established hard
// Eastern Fens/Mornay formation pool; no story gate; stays entirely on the
// pre-ambush (west) side of Travellers' Rise and never touches Mornay, the
// North Basin, or any wider west/north continent.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function context() { const g = createContext(); g.press('Enter'); g.press('Enter'); return g; }

// The 4 converted entry chunks keep their original, stable mapIds/coordinates.
const CONVERTED = [
  ['EASTERN_FENS_ENVELOPE_C6RN1_MAP', 6, -1],
  ['EASTERN_FENS_ENVELOPE_C7RN1_MAP', 7, -1],
  ['EASTERN_FENS_ENVELOPE_C8RN1_MAP', 8, -1],
  ['EASTERN_FENS_ENVELOPE_C9RN1_MAP', 9, -1],
];
// The 24 fresh Great Fen chunks, authored in content/maps/great-fen-maps.js.
const FRESH = [
  ['GREAT_FEN_C1RN5_MAP', 1, -5], ['GREAT_FEN_C2RN5_MAP', 2, -5], ['GREAT_FEN_C3RN5_MAP', 3, -5],
  ['GREAT_FEN_C4RN5_MAP', 4, -5], ['GREAT_FEN_C5RN5_MAP', 5, -5],
  ['GREAT_FEN_C2RN4_MAP', 2, -4], ['GREAT_FEN_C3RN4_MAP', 3, -4], ['GREAT_FEN_C4RN4_MAP', 4, -4],
  ['GREAT_FEN_C5RN4_MAP', 5, -4], ['GREAT_FEN_C6RN4_MAP', 6, -4], ['GREAT_FEN_C7RN4_MAP', 7, -4],
  ['GREAT_FEN_C3RN3_MAP', 3, -3], ['GREAT_FEN_C4RN3_MAP', 4, -3], ['GREAT_FEN_C5RN3_MAP', 5, -3],
  ['GREAT_FEN_C6RN3_MAP', 6, -3], ['GREAT_FEN_C7RN3_MAP', 7, -3], ['GREAT_FEN_C8RN3_MAP', 8, -3], ['GREAT_FEN_C9RN3_MAP', 9, -3],
  ['GREAT_FEN_C5RN2_MAP', 5, -2], ['GREAT_FEN_C6RN2_MAP', 6, -2], ['GREAT_FEN_C7RN2_MAP', 7, -2],
  ['GREAT_FEN_C8RN2_MAP', 8, -2], ['GREAT_FEN_C9RN2_MAP', 9, -2], ['GREAT_FEN_C10RN2_MAP', 10, -2],
];
const ALL = [...CONVERTED, ...FRESH];
const GREAT_FEN_IDS = new Set(ALL.map(([id]) => id));
const ENTRANCES = ['EASTERN_FENS_ENVELOPE_C7R0_MAP', 'EASTERN_FENS_ENVELOPE_C8R0_MAP'];
const ROAD_IDS = [2, 12, 21, 58]; // PATH, TOWN_FLOOR, TOWN_MARKET, BRIDGE_DECK

module.exports = {
  name: 'Great Fen expansion: dual-entrance connected roadless wetland, hard-pool encounters, no sequence break',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));
    const currentFenIds = new Set(J("JSON.stringify(Object.values(REGIONAL_CHUNK_CATALOG).filter(c=>c.region==='Great Fen'&&c.playerAccessible!==false).map(c=>c.mapId))"));

    // ── 1-2. Both entrances exist, are placed at their authored coordinates,
    //         and provide a real structural seam (not a point crossing). ────
    for (const id of ENTRANCES) {
      assert.equal(g.run(`mapPlayerAccessible('${id}')`), true, `${id} stays player-accessible`);
    }
    assert.equal(g.run("(EDGE_TRANSITIONS['EASTERN_FENS_ENVELOPE_C7R0_MAP'].north||[]).some(function(s){return s.targetMap==='EASTERN_FENS_ENVELOPE_C7RN1_MAP'&&s.targetEdge==='south';})"), true, '(7,0) opens north into the Great Fen');
    assert.equal(g.run("(EDGE_TRANSITIONS['EASTERN_FENS_ENVELOPE_C8R0_MAP'].north||[]).some(function(s){return s.targetMap==='EASTERN_FENS_ENVELOPE_C8RN1_MAP'&&s.targetEdge==='south';})"), true, '(8,0) opens north into the Great Fen');
    assert.equal(g.run("(EDGE_TRANSITIONS['EASTERN_FENS_ENVELOPE_C7RN1_MAP'].south||[]).some(function(s){return s.targetMap==='EASTERN_FENS_ENVELOPE_C7R0_MAP'&&s.targetEdge==='north';})"), true, 'reciprocal south seam exists');
    assert.equal(g.run("(EDGE_TRANSITIONS['EASTERN_FENS_ENVELOPE_C8RN1_MAP'].south||[]).some(function(s){return s.targetMap==='EASTERN_FENS_ENVELOPE_C8R0_MAP'&&s.targetEdge==='north';})"), true, 'reciprocal south seam exists');
    // No progression flag / condition / callback on either seam -- only the
    // allowed structural properties exist.
    for (const [id, dir] of [['EASTERN_FENS_ENVELOPE_C7R0_MAP', 'north'], ['EASTERN_FENS_ENVELOPE_C8R0_MAP', 'north']]) {
      const segs = J(`JSON.stringify(EDGE_TRANSITIONS['${id}'].${dir})`);
      for (const seg of segs) assert.deepEqual(Object.keys(seg).sort(), ['sourceRange', 'targetEdge', 'targetMap'], `${id}.${dir} has only allowed structural properties (no flag/condition/callback)`);
    }

    // ── 3. Every chunk is placed at its authored coordinate, has a unique
    //      mapId, and no coordinate collides with any other placed chunk. ──
    for (const [id, cx, cy] of ALL) {
      assert.equal(g.run(`mapIdForChunk('overworld',${cx},${cy})`), id, `${id} placed at (${cx},${cy})`);
    }
    const allCoordKeys = J("JSON.stringify(REGIONAL_LAYOUT.overworld.placements.map(function(p){return p.chunkX+','+p.chunkY;}))");
    assert.equal(new Set(allCoordKeys).size, allCoordKeys.length, 'no two placed chunks share a coordinate (includes the Great Fen footprint)');
    assert.equal(new Set(ALL.map(([id]) => id)).size, 28, '28 unique Great Fen mapIds');

    // ── 4. No road/path/causeway/bridge/town-street tile anywhere in the
    //      Great Fen, and no road metadata of any kind on its definitions. ──
    for (const [id] of ALL) {
      const flat = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map.flat())`);
      for (const roadId of ROAD_IDS) assert.ok(!flat.includes(roadId), `${id} contains no road tile id ${roadId}`);
    }

    // ── 5. Every reachable Great Fen chunk is encounter-enabled immediately,
    //      routed through the established hard Eastern Fens/Mornay pool --
    //      the exact same pool object, not a duplicate/introductory table. ──
    for (const [id] of ALL) {
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowRandomEncounters`), true, `${id} has encounters enabled immediately`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].encounterPool===GREAT_FEN_FORMATIONS`), true, `${id} resolves through the hard pool`);
      assert.equal(g.run(`_REGIONAL_CHUNK_DEFINITIONS.find(function(d){return d.mapId==='${id}';}).encounterProfileId`), 'great_fen', `${id} authored with the hard profile id`);
      assert.equal(g.run(`MAP_CATALOG['${id}'].allowSave`), true, `${id} allows save`);
    }

    // ── 6. Closed-system topology: every EDGE_TRANSITIONS target reachable
    //      from a Great Fen chunk is either another Great Fen chunk or one of
    //      the two authorized entrances -- never Mornay, Travellers' Rise,
    //      the North Basin, or any other region. This alone proves the Great
    //      Fen cannot reach east of Travellers' Rise, cannot reach Mornay,
    //      and cannot escape into the wider west/north continent. ──────────
    for (const [id] of ALL) {
      const targets = J(`JSON.stringify(Object.values(EDGE_TRANSITIONS['${id}']||{}).flat().map(function(s){return s.targetMap;}))`);
      for (const t of targets) {
        assert.ok(currentFenIds.has(t) || ENTRANCES.includes(t), `${id} seam -> ${t} stays inside the Great Fen or its two authorized entrances`);
      }
    }
    // The two entrances themselves point into the Great Fen and into the
    // pre-existing Eastern Fens reedbelt only -- never anywhere else new.
    for (const id of ENTRANCES) {
      const targets = J(`JSON.stringify(Object.values(EDGE_TRANSITIONS['${id}']||{}).flat().map(function(s){return s.targetMap;}))`);
      for (const t of targets) {
        assert.ok(currentFenIds.has(t) || t === 'EASTERN_FENS_REEDBELT_N_MAP' || t === 'EASTERN_FENS_REEDBELT_E_MAP' || ENTRANCES.includes(t),
          `${id} seam -> ${t} is the Great Fen or the pre-existing Eastern Fens route (never Mornay/North Basin/wider continent)`);
      }
    }

    // ── 7. Full connectivity: BFS across the Great Fen's own graph from
    //      EITHER entrance reaches every one of the 28 chunks -- one
    //      connected component, substantial network, no isolated pockets. ──
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
    const fromC7R0 = bfsFrom('EASTERN_FENS_ENVELOPE_C7R0_MAP');
    const fromC8R0 = bfsFrom('EASTERN_FENS_ENVELOPE_C8R0_MAP');
    for (const [id] of ALL) {
      assert.ok(fromC7R0.has(id), `${id} reachable from the (7,0) entrance`);
      assert.ok(fromC8R0.has(id), `${id} reachable from the (8,0) entrance`);
    }
    // Both entrances land in the SAME connected component (not two separate pockets).
    assert.ok(fromC7R0.has('EASTERN_FENS_ENVELOPE_C8R0_MAP'), 'the (7,0) and (8,0) entrances join the same connected Great Fen component');

    // ── 8. Every branch is safely returnable: every directed seam out of a
    //      Great Fen chunk (or either entrance, restricted to the Great Fen
    //      side) has a reciprocal seam back. ────────────────────────────────
    for (const [id] of [...ALL, ['EASTERN_FENS_ENVELOPE_C7R0_MAP'], ['EASTERN_FENS_ENVELOPE_C8R0_MAP']]) {
      const dirs = J(`JSON.stringify(EDGE_TRANSITIONS['${id}']||{})`);
      for (const [dir, segs] of Object.entries(dirs)) {
        for (const seg of segs) {
          if (!GREAT_FEN_IDS.has(seg.targetMap) && !ENTRANCES.includes(seg.targetMap)) continue;
          const backSegs = J(`JSON.stringify((EDGE_TRANSITIONS['${seg.targetMap}']||{})['${seg.targetEdge}']||[])`);
          assert.ok(backSegs.some((b) => b.targetMap === id), `${id} ${dir} -> ${seg.targetMap} has a reciprocal seam back`);
        }
      }
    }

    // ── 9. Protected grids: (7,0)/(8,0) are byte-identical to their
    //      pre-expansion grid except the 3 authorized seam cells at row 0,
    //      cols 7-9 (water -> walkable reed-gap opening). ───────────────────
    for (const id of ENTRANCES) {
      const current = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`);
      const restored = current.map((row) => row.slice());
      restored[0][7] = 1; restored[0][8] = 1; restored[0][9] = 1; // WATER
      let diffCells = 0;
      for (let r = 0; r < 15; r++) for (let c = 0; c < 16; c++) if (restored[r][c] !== current[r][c]) diffCells++;
      assert.equal(diffCells, 3, `${id}: exactly the 3 authorized seam cells differ from its pre-expansion grid`);
    }

    // ── 10. Mornay's six peninsula grids are untouched (fingerprints stable). ─
    for (const id of ['EASTERN_FENS_MORNAY_NECK_ROAD_MAP', 'EASTERN_FENS_MORNAY_WESTERN_COVE_MAP', 'EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP',
      'EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP', 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP', 'EASTERN_FENS_MORNAY_EASTERN_POINT_MAP']) {
      const got = sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${id}'].map)`));
      assert.equal(got, GRID_FP.fingerprints[id], `${id}: Mornay peninsula grid untouched by the Great Fen expansion`);
    }

    // ── 11. The optional Third Lock marker is the sole later content addition. ─
    for (const [id] of ALL) {
      assert.equal(g.run(`MAP_CATALOG['${id}'].items.length`), 0, `${id} has no items`);
      assert.deepEqual(JSON.parse(g.run(`JSON.stringify((MAP_FEATURES['${id}']||[]).map(f=>f.id))`)), id==='GREAT_FEN_C8RN3_MAP'?['third_lock_towpath']:[], `${id}: only the authored Third Lock marker may exist`);
      assert.equal(g.run(`SIMPLE_NPCS.some(function(n){return n.physicalMapId==='${id}';})`), false, `${id} has no NPC`);
    }

    // ── 12. Save/load restores the exact valid Great Fen map/placement. ────
    const SAMPLE = 'GREAT_FEN_C7RN3_MAP'; // interior chunk, reachable from both entrances
    g.run(`placeAtLocation('${SAMPLE}',8.5*TILE,8.5*TILE);player.facing='right';saveGame();`);
    const saved = J("localStorage.getItem('verdantVale_save')");
    assert.equal(saved.version, 5, 'SAVE_VERSION unchanged');
    assert.equal(saved.location.kind, 'regional', 'regional save payload shape unchanged');
    g.run("placeAtLocation('MAP2',2.5*TILE,2.5*TILE);player.facing='down';");
    assert.equal(g.run('loadGame()'), true, 'load succeeds');
    assert.equal(g.run('mapIdForRef(activeMap)'), SAMPLE, 'load restores the exact saved Great Fen map');
    assert.equal(g.run('player.x'), 8.5 * g.run('TILE'));
    assert.equal(g.run('player.y'), 8.5 * g.run('TILE'));
    assert.equal(g.run('player.facing'), 'right');

    // ── 13. Zero visible void from every reachable Great Fen tile, using the
    //       real production camera at the native 512x480 viewport. ─────────
    const voidResult = J(`JSON.stringify((function(){
      var start={id:'EASTERN_FENS_ENVELOPE_C7R0_MAP',r:0,c:7}, seen={}, reach=[];
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
        if(REGIONAL_CHUNK_CATALOG[p[0]]&&REGIONAL_CHUNK_CATALOG[p[0]].region==='Great Fen')reach.push([p[0],+p[1],+p[2]]);});
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
      return {reachable:n, reachedAllGreatFen: reach.length>=28, voids:Object.keys(voids)};
    })())`);
    assert.ok(voidResult.reachedAllGreatFen, `BFS from the (7,0) entrance reaches all 28 Great Fen chunks (got ${voidResult.reachable})`);
    assert.deepEqual(voidResult.voids, [], 'no reachable Great Fen tile can scroll an unplaced (void) coordinate into the 512x480 camera');

    // ── 14. validateGameData() stays clean with the Great Fen registered. ──
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0, 'no validation errors');
  },
};
