'use strict';
// Covers: Roddon Way (RODDON_WAY_MAP) -- a single new 16x15 outdoor fen map
// off MAP3_N1's west edge, modeling a roddon (the raised, silt-filled bed
// of a long-dead creek). No settlement, no dungeon, no quest, no boss, no
// new enemy type, no new persistent flag -- just terrain, one new tile
// (RODDON_SILT), and six inspectables.
//
//   1.  The map is registered (MAP_REGISTRY/MAP_METADATA) and exactly
//       16 columns x 15 rows.
//   2.  EDGE_TRANSITIONS is reciprocal: MAP3_N1.west <-> RODDON_WAY_MAP.east,
//       identical [4,9] ranges on both sides (so no clamping in normal play).
//   3.  Real-movement crossing both ways lands on a walkable, in-bounds tile
//       one column inside the border (never on the trigger column itself),
//       and a single idle frame afterward does not re-cross on its own.
//   4.  Flood fill: every walkable tile on the map is reachable from the
//       entrance -- no islands, nothing stranded.
//   5.  Every border tile is impassable TREE except the col-15 mouth
//       (rows 4-9) and the reciprocal col-0 opening on MAP3_N1 -- the
//       unconnected edges stay visibly blocked, not implied exits.
//   6.  currentEncounterPool() resolves to FAR_ENEMY_TEMPLATES (MAP3_N1's
//       own pool, reused -- no new enemy pool, no new enemies). RODDON_SILT
//       is not encounter-eligible; GRASS/REEDS on this map still are.
//   7.  allowSave is true and a real save-menu save actually succeeds here
//       (unlike an allowSave:false area) -- ordinary saving, no special case.
//   8.  Each of the six inspectables opens dialogue with its expected text
//       via a real interact keypress, and none of them sets a new
//       QUEST_FLAG_SCHEMA-tracked flag (no onceFlag anywhere on this map).
//   9.  RODDON_SILT is registered: WALKABLE, TILE_PROPERTIES (walkable,
//       non-encounter-eligible), RENDERABLE_TILE_IDS, and a real render
//       frame with it on screen does not throw.
//   10. Existing MAP3_N1 transitions (FEN_N_EXIT/ENTRANCE to MAP3) still
//       work unchanged -- the new west opening didn't interfere.
//   11. validateGameData() reports 0 errors and no warning mentions Roddon
//       Way or RODDON_SILT.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Roddon Way: registration, reciprocal edge crossing, connectivity, encounter/save rules, inspectables, tile rendering',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 1. Registration and exact size ──────────────────────────────────────
    assert.equal(g.run('MAP_REGISTRY.RODDON_WAY_MAP.map === RODDON_WAY_MAP'), true);
    assert.equal(g.run('MAP_METADATA.RODDON_WAY_MAP.displayName'), 'Roddon Way');
    assert.equal(g.run('MAP_METADATA.RODDON_WAY_MAP.region'), 'Thornmere');
    assert.equal(g.run('RODDON_WAY_MAP.length'), 15, 'must be exactly 15 rows');
    assert.equal(g.run('RODDON_WAY_MAP.every(row => row.length === 16)'), true, 'must be exactly 16 cols on every row');

    // ── 2. Reciprocal EDGE_TRANSITIONS ──────────────────────────────────────
    const west = g.run("EDGE_TRANSITIONS.MAP3_N1.west");
    const east = g.run("EDGE_TRANSITIONS.RODDON_WAY_MAP.east");
    assert.equal(west.length, 1);
    assert.equal(east.length, 1);
    assert.equal(west[0].targetMap, 'RODDON_WAY_MAP');
    assert.equal(west[0].targetEdge, 'east');
    assert.equal(east[0].targetMap, 'MAP3_N1');
    assert.equal(east[0].targetEdge, 'west');
    // JSON comparison, not assert.deepEqual -- sourceRange is a vm-context
    // array (different Array prototype than the host realm), which strict
    // deepEqual treats as unequal even when the contents match.
    assert.equal(JSON.stringify(west[0].sourceRange), '[4,9]');
    assert.equal(JSON.stringify(east[0].sourceRange), '[4,9]');
    assert.equal(west[0].targetRange, undefined, 'identical ranges -- targetRange should default to sourceRange, not be duplicated');
    assert.equal(east[0].targetRange, undefined);

    // Reciprocal south crossing to the Eastern Reaches (MAP2), cols 12-14.
    const rodSouth  = g.run("EDGE_TRANSITIONS.RODDON_WAY_MAP.south");
    const map2North = g.run("EDGE_TRANSITIONS.MAP2.north");
    assert.equal(rodSouth.length, 1);
    assert.equal(map2North.length, 1);
    assert.equal(rodSouth[0].targetMap, 'MAP2');
    assert.equal(rodSouth[0].targetEdge, 'north');
    assert.equal(map2North[0].targetMap, 'RODDON_WAY_MAP');
    assert.equal(map2North[0].targetEdge, 'south');
    assert.equal(JSON.stringify(rodSouth[0].sourceRange), '[12,14]');
    assert.equal(JSON.stringify(map2North[0].sourceRange), '[12,14]');

    // ── 3. Real-movement crossing, both directions ──────────────────────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap=MAP3_N1;
      player.x=1.5*TILE; player.y=6.5*TILE; player.facing='left';
      combat.cooldown=0; debugMode=true;
    `);
    g.hold('ArrowLeft');
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) { g.frames(1); crossed = g.run('activeMap === RODDON_WAY_MAP'); }
    g.release('ArrowLeft');
    assert.ok(crossed, 'walking west off MAP3_N1 should enter Roddon Way within 40 frames');
    assert.equal(g.run('player.x'), 14.5 * 32, 'should land one tile inside the east border (col 14), not on the trigger column (15)');
    assert.equal(g.run('player.y'), 6.5 * 32, 'row should be preserved exactly (matching ranges, no clamping)');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'the landing tile must be walkable');
    assert.equal(g.run('locationName()'), 'Roddon Way');

    // A single idle frame must not re-trigger the crossing on its own.
    g.frames(1);
    assert.equal(g.run('activeMap === RODDON_WAY_MAP'), true, 'landing must not immediately bounce back');

    g.run("player.facing='right';");
    g.hold('ArrowRight');
    let back = false;
    for (let i = 0; i < 60 && !back; i++) { g.frames(1); back = g.run('activeMap === MAP3_N1'); }
    g.release('ArrowRight');
    assert.ok(back, 'walking east off Roddon Way should return to MAP3_N1 within 60 frames');
    assert.equal(g.run('player.x'), 1.5 * 32, 'should land one tile inside MAP3_N1\'s west border (col 1)');
    assert.equal(g.run('player.y'), 6.5 * 32);
    assert.equal(g.run('canWalk(player.x, player.y)'), true);
    g.frames(1);
    assert.equal(g.run('activeMap === MAP3_N1'), true, 'landing back on MAP3_N1 must not immediately bounce again');

    // ── 4 & 5. Flood-fill connectivity + sealed borders ─────────────────────
    const floodResult = g.run(`(() => {
      const grid = RODDON_WAY_MAP;
      const rows = grid.length, cols = grid[0].length;
      const start = [6, 14]; // an entrance-side ridge tile (row, col)
      if (!WALKABLE[grid[start[0]][start[1]]]) return { error: 'start tile not walkable' };
      const seen = new Set([start.join(',')]);
      const queue = [start];
      let totalWalkable = 0;
      for (const row of grid) for (const t of row) if (WALKABLE[t]) totalWalkable++;
      while (queue.length) {
        const [r, c] = queue.shift();
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          const key = nr + ',' + nc;
          if (seen.has(key)) continue;
          if (!WALKABLE[grid[nr][nc]]) continue;
          seen.add(key);
          queue.push([nr, nc]);
        }
      }
      return { totalWalkable, reachable: seen.size };
    })()`);
    assert.equal(floodResult.error, undefined, floodResult.error);
    assert.equal(floodResult.reachable, floodResult.totalWalkable,
      `every walkable tile must be reachable from the entrance -- got ${floodResult.reachable}/${floodResult.totalWalkable} (islands or stranded tiles present)`);
    assert.ok(floodResult.totalWalkable > 50, 'sanity: the map should have a substantial walkable area, not a degenerate one');

    const borderCheck = g.run(`(() => {
      const grid = RODDON_WAY_MAP;
      const problems = [];
      for (let c = 0; c < 16; c++) {
        if (grid[0][c] !== TREE) problems.push('north row col ' + c + ' is not TREE');
        // South edge: cols 12-14 are the open MAP2 crossing (REEDS); the rest stays TREE.
        const southOK = (c >= 12 && c <= 14) ? grid[14][c] === REEDS : grid[14][c] === TREE;
        if (!southOK) problems.push('south row col ' + c + ' unexpected tile ' + grid[14][c]);
      }
      for (let r = 0; r < 15; r++) {
        if (grid[r][0] !== TREE) problems.push('west col row ' + r + ' is not TREE');
        const eastOK = (r >= 4 && r <= 9) ? grid[r][15] === RODDON_SILT : grid[r][15] === TREE;
        if (!eastOK) problems.push('east col row ' + r + ' unexpected tile ' + grid[r][15]);
      }
      return problems;
    })()`);
    // .length, not deepEqual against [] -- borderCheck comes from the vm
    // context, so its Array prototype differs from the host's and strict
    // deepEqual would fail even when empty.
    assert.equal(borderCheck.length, 0,
      `every unconnected border tile must stay TREE; only the rows 4-9 east mouth and the cols 12-14 south crossing may open. Problems: ${borderCheck.join(' | ')}`);

    // ── 6. Encounter pool + tile encounter-eligibility ──────────────────────
    g.run('inMireVault=false; inSluice=false; inDungeon=false;');
    assert.equal(g.run('currentEncounterPool() === FAR_ENEMY_TEMPLATES'), true,
      'Roddon Way must reuse MAP3_N1\'s existing pool -- no new enemy pool');
    assert.equal(g.run('isTileEncounterEligible(RODDON_SILT)'), false, 'the ridge itself must be the safe route through');
    assert.equal(g.run('isTileEncounterEligible(GRASS)'), true, 'ordinary fen ground must keep the established encounter behavior');
    assert.equal(g.run('isTileEncounterEligible(REEDS)'), true);

    // ── 7. Normal saving (contrast with an allowSave:false area) ────────────
    assert.equal(g.run('MAP_METADATA.RODDON_WAY_MAP.allowSave'), true);
    g.run(`
      activeMap = RODDON_WAY_MAP; dialogue.open = false;
      menu.open = true; menu.screen = 'saveConfirm'; menu.saveCursor = 0;
      menu.saveMessage = 0; menu.saveBlockedMessage = 0;
    `);
    g.press('Enter');
    assert.ok(g.run('menu.saveMessage > 0'), 'saving on Roddon Way must succeed normally, not be refused');
    assert.equal(g.run('menu.saveBlockedMessage'), 0, 'no "won\'t hold" banner should appear here');
    g.run('menu.open = false;');

    // ── 8. Each inspectable fires via the real interact key ─────────────────
    const inspectables = [
      ['roddon_way_viewpoint',      6.5,  2.5, 'Roddon'],
      ['roddon_way_bank',           8.5,  3.5, 'silt'],
      ['roddon_way_channel_curve',  3.5,  2.5, 'bend'],
      ['roddon_way_survey_post',    3.5,  1.5, 'District Drainage'],
      ['roddon_way_eel_stakes',     6.5, 11.5, 'eel run'],
      ['roddon_way_cracked_peat',   6.5,  8.5, 'peat'],
    ];
    for (const [id, x, y, needle] of inspectables) {
      g.run(`
        inDungeon=false; inTown=false; inSluice=false; activeMap=RODDON_WAY_MAP;
        player.x=${x}*TILE; player.y=${y}*TILE; player.facing='down'; dialogue.open=false;
      `);
      assert.equal(g.run('dialogue.open'), false, `precondition: no dialogue open before ${id}`);
      g.press('Enter');
      assert.equal(g.run('dialogue.open'), true, `${id} should open dialogue via a real interact press`);
      const text = g.run('dialogue.pages.flat().join(" ")');
      assert.ok(text.includes(needle), `${id} text should mention "${needle}", got: ${text}`);
      g.run('dialogue.open = false;');
    }
    // No onceFlag anywhere on this map -- confirm none of the six ids appear
    // in QUEST_FLAG_SCHEMA (ordinary inspect text shouldn't need persistence).
    const schemaHit = g.run(`QUEST_FLAG_SCHEMA.filter(k => k.startsWith('roddon'))`);
    assert.equal(schemaHit.length, 0, 'Roddon Way inspectables must not register any persistent flag');

    // ── 9. RODDON_SILT tile registration ─────────────────────────────────────
    assert.equal(g.run('WALKABLE[RODDON_SILT]'), true);
    assert.equal(g.run('TILE_PROPERTIES[RODDON_SILT].walkable'), true);
    assert.equal(g.run('TILE_PROPERTIES[RODDON_SILT].encounterEligible'), false);
    assert.equal(g.run('RENDERABLE_TILE_IDS.has(RODDON_SILT)'), true);
    g.run('player.x = 6.5*TILE; player.y = 6.5*TILE;'); // standing on ridge
    assert.doesNotThrow(() => g.renderFrame(), 'rendering a frame with RODDON_SILT on screen must not throw');

    // ── 10. Existing MAP3_N1 transitions still work ──────────────────────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap=MAP3;
      player.x=8.5*TILE; player.y=1.5*TILE; player.facing='up'; combat.cooldown=0;
    `);
    g.hold('ArrowUp');
    let toFen = false;
    for (let i = 0; i < 40 && !toFen; i++) { g.frames(1); toFen = g.run('activeMap === MAP3_N1'); }
    g.release('ArrowUp');
    assert.ok(toFen, 'the pre-existing MAP3 <-> MAP3_N1 point-transition (FEN_N_EXIT) must still work');
    assert.equal(g.run('canWalk(player.x, player.y)'), true);

    // ── 11. validateGameData() clean ─────────────────────────────────────────
    g.run(`
      window.__origLog = console.log; window.__origWarn = console.warn; window.__origError = console.error;
      console.log = console.warn = console.error = function() {};
    `);
    const result = g.run('validateGameData()');
    g.run(`console.log = window.__origLog; console.warn = window.__origWarn; console.error = window.__origError;`);
    assert.equal(result.errors, 0, `validateGameData() should report 0 errors, got: ${JSON.stringify(result.errorList)}`);
    const offending = (result.warningList || []).filter(w => /roddon|RODDON/i.test(JSON.stringify(w)));
    assert.equal(offending.length, 0, `no validation warning should mention Roddon Way, got: ${JSON.stringify(offending)}`);
  },
};
