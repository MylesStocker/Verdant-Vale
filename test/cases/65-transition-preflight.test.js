'use strict';
// Phase 2 guard: the strengthened transition preflight + edge-transition
// validation.
//   • transitionToLocation() rejects an in-bounds but BLOCKED destination
//     atomically (no auto-nudge, no partial mutation of map/player/facing/
//     location/cooldown).
//   • validateEdgeTransitions() checks EVERY walkable source-edge coordinate's
//     exact clamped landing — a segment with one good and one blocked landing
//     fails, where the old aggregate "some landing is walkable" check passed it.
//   • edgeTransitionLanding() applies the runtime clamp for differing ranges.
//   • All authored transitions still pass (audit + validation stay green).

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Run validateGameData() with output silenced (it populates the global
// VALIDATION_ERRORS, which the assertions below read in-realm).
function runValidation(g) {
  g.run('window.__l=console.log; window.__w=console.warn; window.__e=console.error; console.log=console.warn=console.error=function(){};');
  const res = g.run('validateGameData()');
  g.run('console.log=window.__l; console.warn=window.__w; console.error=window.__e;');
  return res;
}

module.exports = {
  name: 'transition preflight: blocked dest rejected atomically; per-coordinate edge landings validated',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const TILE = g.run('TILE');

    // ── transitionToLocation rejects a blocked destination atomically ────────
    // SLUICE_MAP tile (7,7) is a known non-walkable base tile.
    g.run(`resetLocationState(); activeMap = MAP; player.x = 7.5*TILE; player.y = 9.5*TILE; player.facing = 'down'; combat.cooldown = 0;`);
    const before = g.run(`JSON.stringify({ map: mapRegistryId(activeMap), px: player.x, py: player.y, pf: player.facing, cd: combat.cooldown, loc: snapshotLocationState() })`);
    const ok = g.run(`transitionToLocation({ mapId: 'SLUICE_MAP', x: 7.5*TILE, y: 7.5*TILE, facing: 'down', state: { inSluice: true, sluiceFloor: 1 }, cooldown: true })`);
    assert.equal(ok, false, 'a blocked in-bounds destination must be rejected');
    const after = g.run(`JSON.stringify({ map: mapRegistryId(activeMap), px: player.x, py: player.y, pf: player.facing, cd: combat.cooldown, loc: snapshotLocationState() })`);
    assert.equal(after, before, 'map, player position/facing, location state, and cooldown are all unchanged after a rejected transition');

    // Sanity: the same transition to a WALKABLE sluice tile succeeds (so the
    // rejection above is really about walkability, not the sluice state).
    const walk = g.run(`(function(){ var w = debugFindNearestWalkableTile(SLUICE_MAP, 7, 7); return transitionToLocation({ mapId:'SLUICE_MAP', x:(w.col+0.5)*TILE, y:(w.row+0.5)*TILE, facing:'down', state:{ inSluice:true, sluiceFloor:1 } }); })()`);
    assert.equal(walk, true, 'the same crossing to a walkable sluice tile succeeds');

    // ── edgeTransitionLanding() applies the runtime clamp (differing ranges) ─
    // sourceRange [3,10] but targetRange [3,3]: every source coord clamps to 3.
    const clampHi = JSON.parse(g.run(`JSON.stringify(edgeTransitionLanding({ targetEdge:'north', sourceRange:[3,10], targetRange:[3,3] }, 10))`));
    const clampLo = JSON.parse(g.run(`JSON.stringify(edgeTransitionLanding({ targetEdge:'north', sourceRange:[3,10], targetRange:[3,3] }, 1))`));
    assert.equal(clampHi.col, 3, 'a source coord above targetRange clamps down to the target max');
    assert.equal(clampLo.col, 3, 'a source coord below targetRange clamps up to the target min');
    // Identity mapping when ranges match.
    const ident = JSON.parse(g.run(`JSON.stringify(edgeTransitionLanding({ targetEdge:'south', sourceRange:[2,9] }, 6))`));
    assert.equal(ident.col, 6, 'with no separate targetRange the along-coord maps through unclamped');

    // ── One good + one blocked landing fails (old aggregate would pass) ──────
    // Two reachable source coords (cols 3,4); landing col 3 walkable, col 4
    // blocked. The old "at least one target walkable" check would pass because
    // col 3 is fine; the per-coordinate check must flag col 4.
    g.run(`
      window.__s3 = NORTH_BASIN_S_MAP[ROWS-1][3]; window.__s4 = NORTH_BASIN_S_MAP[ROWS-1][4];
      NORTH_BASIN_S_MAP[ROWS-1][3] = GRASS; NORTH_BASIN_S_MAP[ROWS-1][4] = GRASS;   // two reachable sources
      window.__l3 = NORTH_BASIN_C_MAP[1][3]; window.__l4 = NORTH_BASIN_C_MAP[1][4];
      NORTH_BASIN_C_MAP[1][3] = GRASS;   // good landing
      NORTH_BASIN_C_MAP[1][4] = WATER;   // blocked landing
      if (!EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']) EDGE_TRANSITIONS['NORTH_BASIN_S_MAP'] = {};
      EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']['south'] = [
        { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'north', sourceRange: [3, 4] }
      ];
    `);
    // Document that the OLD aggregate check would have passed: a walkable landing exists.
    assert.equal(g.run('WALKABLE[NORTH_BASIN_C_MAP[1][3]]'), true, 'precondition: one landing (col 3) IS walkable — old aggregate check would pass');
    const res = runValidation(g);
    const edgeMsgs = JSON.parse(g.run('JSON.stringify(VALIDATION_ERRORS.filter(function(e){return e.group===\"EDGE_TRANSITIONS\";}).map(function(e){return e.message;}))'));
    assert.ok(edgeMsgs.some(m => /col 4/.test(m) && /not base-walkable|strand/.test(m)),
      'the blocked col-4 landing must be flagged even though col 3 is walkable: ' + JSON.stringify(edgeMsgs));
    g.run(`
      NORTH_BASIN_S_MAP[ROWS-1][3] = window.__s3; NORTH_BASIN_S_MAP[ROWS-1][4] = window.__s4;
      NORTH_BASIN_C_MAP[1][3] = window.__l3; NORTH_BASIN_C_MAP[1][4] = window.__l4;
      delete EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']['south'];
      delete window.__s3; delete window.__s4; delete window.__l3; delete window.__l4;
    `);

    // ── All authored transitions still pass ─────────────────────────────────
    const clean = runValidation(g);
    const authoredEdgeErrors = g.run('VALIDATION_ERRORS.filter(function(e){return e.group===\"EDGE_TRANSITIONS\";}).length');
    assert.equal(authoredEdgeErrors, 0, 'no authored EDGE_TRANSITIONS errors after restore');
    const audit = require('../transition-audit.js');
    const badEdges = audit.edgeLandingResults.filter(e => !e.allOk);
    assert.equal(badEdges.length, 0, 'audit: every authored edge landing is in-bounds + base-walkable');
  },
};
