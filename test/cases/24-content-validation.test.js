'use strict';
// Covers: the expanded validateGameData() content linter (validation.js) --
// the broader, general-purpose validator built on top of the old
// registry-presence checks, now covering maps, MAP_METADATA, every tile
// used across every registered map, EDGE_TRANSITIONS, NPCs, items/chests,
// enemy templates (including battle-sprite coverage), dialogue text, save
// flags, and the interaction registry, with a real error-vs-warning
// severity split (collected into VALIDATION_ERRORS/VALIDATION_WARNINGS and
// returned from validateGameData(), not just printed).
//
// Per the brief, negative cases here construct bad data in isolation and
// restore it immediately after checking, rather than mutating anything
// that outlives this test -- same pattern established in
// 22-map-metadata.test.js's temporary-breakage sections.
//
//   1.  Valid, current game data passes with zero errors.
//   2.  A deliberately malformed map size (wrong row/col count) fails.
//   3.  A missing MAP_METADATA entry fails (mirrors 22's check, kept here
//       too so this file is a self-contained regression suite for the
//       linter itself, independent of 22 continuing to exist).
//   4.  An unknown numeric tile ID placed in a map fails.
//   5.  An EDGE_TRANSITIONS segment pointing at a nonexistent map fails.
//   6.  An EDGE_TRANSITIONS segment with an out-of-range sourceRange fails.
//   7.  An EDGE_TRANSITIONS segment whose entire target range lands on
//       blocked tiles fails (this codebase's chosen severity: error, since
//       it means the crossing can never land the player anywhere walkable).
//   8.  An NPC with an out-of-bounds coordinate fails.
//   9.  A structurally invalid enemy template (maxHp < hp) fails.
//   10. An excessively long dialogue line produces a warning, not an error,
//       and does not stop validateGameData() from completing.
//   11. The existing MAP <-> MAP2 point-tile transition still functions,
//       and validateGameData() reports no location-specific errors for it.
//   12. The existing EDGE_TRANSITIONS crossing (North Basin, South
//       Approach -> Reservoir) still functions, and validateEdgeTransitions()
//       reports zero errors for the real EDGE_TRANSITIONS table.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Runs validateGameData() with console output silenced, returning its
// structured result object ({errors, warnings, counts, errorList,
// warningList}) -- see validation.js's return value.
function runValidation(g) {
  g.run(`
    window.__origLog   = console.log;
    window.__origWarn  = console.warn;
    window.__origError = console.error;
    console.log = console.warn = console.error = function() {};
  `);
  const result = g.run('validateGameData()');
  g.run(`
    console.log   = window.__origLog;
    console.warn  = window.__origWarn;
    console.error = window.__origError;
  `);
  return result;
}

module.exports = {
  name: 'Content validation: validateGameData() as a general-purpose linter (maps, tiles, transitions, NPCs, items, enemies, dialogue)',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 1. Valid current game data passes with zero errors ──────────────────
    const clean = runValidation(g);
    assert.equal(clean.errors, 0, 'current game data should validate with zero errors: ' + JSON.stringify(clean.errorList));
    assert.ok(clean.warnings >= 0);
    assert.ok(clean.counts['Maps'] > 0 && clean.counts['NPCs'] > 0 && clean.counts['Enemies'] > 0,
      'every category should report a nonzero checked count for a fully-loaded game');

    // ── 2. Malformed map size fails ──────────────────────────────────────────
    g.run(`
      window.__savedMap2Rows = MAP_REGISTRY['MAP2'].map;
      MAP_REGISTRY['MAP2'].map = MAP_REGISTRY['MAP2'].map.slice(0, 10); // wrong row count
    `);
    let badSize;
    assert.doesNotThrow(() => { badSize = runValidation(g); }, 'a malformed map must not throw validateGameData()');
    assert.ok(badSize.errors > 0, 'a map with the wrong row count should be an error');
    assert.ok(
      badSize.errorList.some(e => e.message.includes('MAP2') && e.message.includes('rows')),
      'the error should identify MAP2 and mention the row-count mismatch: ' + JSON.stringify(badSize.errorList)
    );
    g.run(`MAP_REGISTRY['MAP2'].map = window.__savedMap2Rows; delete window.__savedMap2Rows;`); // restore

    // ── 3. Missing metadata entry fails ──────────────────────────────────────
    g.run(`
      window.__savedMap2Meta = MAP_METADATA['MAP2'];
      delete MAP_METADATA['MAP2'];
    `);
    const missingMeta = runValidation(g);
    assert.ok(
      missingMeta.errorList.some(e => e.message.includes('MAP_REGISTRY[MAP2]') && e.message.includes('no matching MAP_METADATA entry')),
      'a MAP_REGISTRY entry with no MAP_METADATA counterpart should be an error'
    );
    g.run(`MAP_METADATA['MAP2'] = window.__savedMap2Meta; delete window.__savedMap2Meta;`); // restore

    // ── 4. Unknown tile ID fails ─────────────────────────────────────────────
    g.run(`
      window.__savedTile = MAP_METADATA['MAP2'].map[0][0];
      MAP_METADATA['MAP2'].map[0][0] = 999999; // not a real tile id anywhere in tiles.js
    `);
    const badTile = runValidation(g);
    assert.ok(
      badTile.errorList.some(e => e.message.includes('999999') && e.message.includes('no WALKABLE entry')),
      'an unknown numeric tile id should be an error identifying the bad value: ' + JSON.stringify(badTile.errorList.filter(e => e.group === 'Tiles'))
    );
    g.run(`MAP_METADATA['MAP2'].map[0][0] = window.__savedTile; delete window.__savedTile;`); // restore

    // ── 5. Bad edge transition target fails ──────────────────────────────────
    g.run(`
      window.__hadNorth = !!(EDGE_TRANSITIONS['NORTH_BASIN_S_MAP'] && EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']['south']);
      if (!EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']) EDGE_TRANSITIONS['NORTH_BASIN_S_MAP'] = {};
      EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']['south'] = [
        { targetMap: 'NOT_A_REAL_MAP_ID', targetEdge: 'south', sourceRange: [0, 5] }
      ];
    `);
    const badTarget = runValidation(g);
    assert.ok(
      badTarget.errorList.some(e => e.group === 'EDGE_TRANSITIONS' && e.message.includes('NOT_A_REAL_MAP_ID') && e.message.includes('does not exist')),
      'an EDGE_TRANSITIONS segment pointing at a nonexistent map should be an error: ' + JSON.stringify(badTarget.errorList.filter(e => e.group === 'EDGE_TRANSITIONS'))
    );
    g.run(`delete EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']['south'];`); // restore

    // ── 6. Edge transition with out-of-range sourceRange fails ───────────────
    g.run(`
      EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']['south'] = [
        { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'south', sourceRange: [20, 25] }
      ];
    `);
    const badRange = runValidation(g);
    assert.ok(
      badRange.errorList.some(e => e.group === 'EDGE_TRANSITIONS' && e.message.includes('out of bounds')),
      'an out-of-range sourceRange should be an error: ' + JSON.stringify(badRange.errorList.filter(e => e.group === 'EDGE_TRANSITIONS'))
    );
    g.run(`delete EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']['south'];`); // restore

    // ── 7. Edge transition landing entirely on blocked tiles fails ──────────
    // NORTH_BASIN_C_MAP row 0 (its north edge) is open reservoir water --
    // pointing a transition's "south" targetEdge there lands one row inside
    // the SOUTH edge (row rows-2), not the north edge, so instead this
    // constructs a transition landing on row 1 (one tile inside the north
    // edge) at a column range confirmed entirely blocked, to exercise the
    // "no walkable landing tile anywhere in target range" rule directly.
    g.run(`
      window.__savedRow1 = NORTH_BASIN_C_MAP[1].slice();
      for (let c = 0; c < COLS; c++) NORTH_BASIN_C_MAP[1][c] = WATER;
      EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']['south'] = [
        { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'north', sourceRange: [0, 5] }
      ];
    `);
    const blockedLanding = runValidation(g);
    assert.ok(
      blockedLanding.errorList.some(e => e.group === 'EDGE_TRANSITIONS' && e.message.includes('no walkable landing tile')),
      'a target range that lands entirely on blocked tiles should be an error: ' + JSON.stringify(blockedLanding.errorList.filter(e => e.group === 'EDGE_TRANSITIONS'))
    );
    g.run(`
      for (let c = 0; c < COLS; c++) NORTH_BASIN_C_MAP[1][c] = window.__savedRow1[c];
      delete window.__savedRow1;
      delete EDGE_TRANSITIONS['NORTH_BASIN_S_MAP']['south'];
    `); // restore

    // ── 8. NPC with an out-of-bounds coordinate fails ───────────────────────
    g.run(`
      SIMPLE_NPCS.push({
        id: '_test_bad_npc', name: 'Test', map: 'town', x: 999 * TILE, y: 4 * TILE,
        solid: false, facing: 'down', dialogue: [['hi']],
        flag_required: null, flag_sets: null, action: null,
      });
    `);
    const badNpc = runValidation(g);
    assert.ok(
      badNpc.errorList.some(e => e.group === 'NPCs' && e.message.includes('_test_bad_npc') && e.message.includes('outside')),
      'an NPC placed far out of bounds should be an error: ' + JSON.stringify(badNpc.errorList.filter(e => e.group === 'NPCs'))
    );
    g.run(`SIMPLE_NPCS.pop();`); // restore

    // ── 8b. Coordinate upper bound is EXCLUSIVE of COLS/ROWS ────────────────
    // Regression: several validator checks accepted an index equal to the map
    // dimensions. Valid tile indices are 0..COLS-1 (columns) / 0..ROWS-1 (rows).
    // Mutations are guaranteed-restored in finally blocks so nothing leaks.
    // NPC exactly on the column edge (x === COLS*TILE) is rejected.
    g.run(`SIMPLE_NPCS.push({ id: '_test_npc_x_cols', name: 'T', map: 'town', x: COLS * TILE, y: 4 * TILE, solid: false, facing: 'down', dialogue: [['hi']], flag_required: null, flag_sets: null, action: null });`);
    try {
      const r = runValidation(g);
      assert.ok(r.errorList.some(e => e.group === 'NPCs' && e.message.includes('_test_npc_x_cols') && e.message.includes('outside')),
        'an NPC at exactly COLS*TILE must be out of bounds: ' + JSON.stringify(r.errorList.filter(e => e.message.includes('_test_npc_x_cols'))));
    } finally { g.run(`SIMPLE_NPCS.pop();`); }
    // NPC exactly on the row edge (y === ROWS*TILE) is rejected.
    g.run(`SIMPLE_NPCS.push({ id: '_test_npc_y_rows', name: 'T', map: 'town', x: 4 * TILE, y: ROWS * TILE, solid: false, facing: 'down', dialogue: [['hi']], flag_required: null, flag_sets: null, action: null });`);
    try {
      const r = runValidation(g);
      assert.ok(r.errorList.some(e => e.group === 'NPCs' && e.message.includes('_test_npc_y_rows') && e.message.includes('outside')),
        'an NPC at exactly ROWS*TILE must be out of bounds');
    } finally { g.run(`SIMPLE_NPCS.pop();`); }
    // NPC just inside the boundary is accepted.
    g.run(`SIMPLE_NPCS.push({ id: '_test_npc_inside', name: 'T', map: 'town', x: (COLS - 0.5) * TILE, y: (ROWS - 0.5) * TILE, solid: false, facing: 'down', dialogue: [['hi']], flag_required: null, flag_sets: null, action: null });`);
    try {
      const r = runValidation(g);
      assert.ok(!r.errorList.some(e => e.message.includes('_test_npc_inside')),
        'an NPC just inside the boundary must be accepted: ' + JSON.stringify(r.errorList.filter(e => e.message.includes('_test_npc_inside'))));
    } finally { g.run(`SIMPLE_NPCS.pop();`); }

    // MAP_FEATURES inspect coordinate at x === COLS / y === ROWS is out of bounds.
    g.run(`MAP_FEATURES['TOWN_MAP'].push({ id: '_test_feat_x_cols', type: 'inspect', x: COLS, y: 3.5, label: 'T', pages: [['x']], allowUnwalkable: true });`);
    try {
      const r = runValidation(g);
      assert.ok(r.errorList.some(e => e.message.includes('_test_feat_x_cols') && e.message.includes('out of bounds')),
        'an inspect feature at x === COLS must be out of bounds: ' + JSON.stringify(r.errorList.filter(e => e.message.includes('_test_feat_x_cols'))));
    } finally { g.run(`MAP_FEATURES['TOWN_MAP'].pop();`); }
    g.run(`MAP_FEATURES['TOWN_MAP'].push({ id: '_test_feat_y_rows', type: 'inspect', x: 3.5, y: ROWS, label: 'T', pages: [['x']], allowUnwalkable: true });`);
    try {
      const r = runValidation(g);
      assert.ok(r.errorList.some(e => e.message.includes('_test_feat_y_rows') && e.message.includes('out of bounds')),
        'an inspect feature at y === ROWS must be out of bounds');
    } finally { g.run(`MAP_FEATURES['TOWN_MAP'].pop();`); }
    // Inspect coordinate just inside the boundary is accepted.
    g.run(`MAP_FEATURES['TOWN_MAP'].push({ id: '_test_feat_inside', type: 'inspect', x: COLS - 0.5, y: ROWS - 0.5, label: 'T', pages: [['x']], allowUnwalkable: true });`);
    try {
      const r = runValidation(g);
      assert.ok(!r.errorList.some(e => e.message.includes('_test_feat_inside')),
        'an inspect feature just inside the boundary must be accepted: ' + JSON.stringify(r.errorList.filter(e => e.message.includes('_test_feat_inside'))));
    } finally { g.run(`MAP_FEATURES['TOWN_MAP'].pop();`); }
    // Trigger-rect convention is PRESERVED: rect boundaries x2 === COLS / y2 === ROWS
    // (player-center coordinates) are intentionally allowed and must not be flagged.
    g.run(`MAP_FEATURES['TOWN_MAP'].push({ id: '_test_trig_boundary', type: 'trigger', rect: { x1: 0, y1: 0, x2: COLS, y2: ROWS }, label: 'T', pages: [['x']] });`);
    try {
      const r = runValidation(g);
      assert.ok(!r.errorList.some(e => e.message.includes('_test_trig_boundary') && e.message.includes('out of bounds')),
        'a trigger rect with x2 === COLS / y2 === ROWS must remain permitted: ' + JSON.stringify(r.errorList.filter(e => e.message.includes('_test_trig_boundary'))));
    } finally { g.run(`MAP_FEATURES['TOWN_MAP'].pop();`); }

    // ── 9. Structurally invalid enemy template fails ────────────────────────
    g.run(`
      ENEMY_TEMPLATES.push({ name: '_test_bad_enemy', hp: 50, maxHp: 10, atk: 5, def: 1, spd: 5, xp: 5, goldMin: 1, goldMax: 2 });
    `);
    const badEnemy = runValidation(g);
    assert.ok(
      badEnemy.errorList.some(e => e.group === 'Enemies' && e.message.includes('_test_bad_enemy') && e.message.includes('maxHp')),
      'an enemy template with maxHp < hp should be an error: ' + JSON.stringify(badEnemy.errorList.filter(e => e.group === 'Enemies'))
    );
    g.run(`ENEMY_TEMPLATES.pop();`); // restore

    // ── 10. Dialogue overflow warns, does not error or throw ────────────────
    // tern has a plain, assignable dialogue array rather than a
    // getter-computed one -- needed since this test overwrites it. (This
    // used to use maren, whose dialogue became a flag-dependent getter in
    // the flag-dialogue pass.)
    g.run(`
      window.__savedTernDialogue = SIMPLE_NPCS.find(n => n.id === 'tern').dialogue;
      SIMPLE_NPCS.find(n => n.id === 'tern').dialogue = [[ 'x'.repeat(400) ]];
    `);
    let longLine;
    assert.doesNotThrow(() => { longLine = runValidation(g); }, 'an overly long dialogue line must not throw validateGameData()');
    assert.ok(
      longLine.warningList.some(w => w.group === 'Dialogue' && w.message.includes('tern') && w.message.includes('exceed dialogue width')),
      'an overly long dialogue line should be a warning: ' + JSON.stringify(longLine.warningList.filter(w => w.group === 'Dialogue'))
    );
    assert.ok(
      !longLine.errorList.some(e => e.message.includes('tern')),
      'an overly long dialogue line must not also be reported as an error'
    );
    g.run(`SIMPLE_NPCS.find(n => n.id === 'tern').dialogue = window.__savedTernDialogue; delete window.__savedTernDialogue;`); // restore

    // ── 11. Existing point transition (MAP <-> MAP2) still works ───────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap = MAP;
      player.x = 14.5*TILE; player.y = 4.5*TILE; player.facing = 'right';
      combat.cooldown = 0;
    `);
    g.hold('ArrowRight');
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === MAP2');
    }
    g.release('ArrowRight');
    assert.ok(crossed, 'the existing MAP2_EXIT point-tile transition should still work');

    // ── 12. Existing EDGE_TRANSITIONS crossing still works, validates clean ─
    g.run(`
      activeMap = NORTH_BASIN_S_MAP;
      player.x = 7.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
      combat.cooldown = 0;
    `);
    g.hold('ArrowUp');
    crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_C_MAP');
    }
    g.release('ArrowUp');
    assert.ok(crossed, 'the EDGE_TRANSITIONS crossing (South Approach -> Reservoir) should still work');
    assert.equal(g.run('player.x'), 7.5 * 32);

    const finalCheck = runValidation(g);
    assert.equal(finalCheck.errors, 0, 'validation should be fully clean again after every temporary breakage above was restored: ' + JSON.stringify(finalCheck.errorList));
    assert.ok(
      !finalCheck.errorList.some(e => e.group === 'EDGE_TRANSITIONS'),
      'the real EDGE_TRANSITIONS table (North Basin) should report zero errors'
    );

    g.renderFrame();
  },
};
