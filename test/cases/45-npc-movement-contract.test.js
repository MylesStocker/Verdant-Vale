'use strict';
// Covers: the Phase 0 "Future NPC movement contract" (architecture.md) —
// specifically the ADDITIVE validation for the optional `movement` property
// on SIMPLE_NPCS entries (validation.js's validateNPCs()). No movement
// system exists yet; these tests exercise the validator against SYNTHETIC
// fixture NPCs pushed into SIMPLE_NPCS temporarily and removed afterwards,
// the same construct-bad-data-in-isolation pattern as 24-content-validation.
//
//   1. The current, real game data validates with zero errors and zero
//      movement-related warnings (no real NPC has `movement`, and the new
//      validation block is a no-op for NPCs without it).
//   2. A well-formed synthetic patrol config passes (no new errors).
//   3. Malformed movement configs each fail clearly: unrecognized type,
//      empty/missing waypoint list, non-finite coordinates, out-of-bounds
//      waypoints, non-positive/non-finite speed, negative pauseFrames,
//      non-boolean loop, missing id, bespoke-rendered NPC, dynamic x getter.
//   4. Validation does not mutate the NPC definition.
//   5. Exactly the three approved Phase 1 pilots have movement configs, and no
//      other real NPC does: the two Imperial bridge guards (scriptedRoute) and
//      Tobb Wend, the fen-brewery auto-patrol (patrol). (This replaced the
//      Phase 0 "no real NPC has movement" assertion when the pilots landed —
//      see architecture.md's movement-contract status.)

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Runs validateGameData() with console output silenced (same helper shape
// as 24-content-validation.test.js), returning its structured result.
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

// Pushes a synthetic NPC (built from a JS-source object literal string so
// getters can be expressed), validates, pops it, and returns the movement-
// related error/warning lines for the fixture id.
function validateFixture(g, npcLiteral, id) {
  g.run(`SIMPLE_NPCS.push(${npcLiteral});`);
  const res = runValidation(g);
  g.run('SIMPLE_NPCS.pop();');
  return {
    res,
    errors:   res.errorList.map(e => e.message).filter(e => e.includes('[' + id + ']')),
    warnings: res.warningList.map(w => w.message).filter(w => w.includes('[' + id + ']')),
  };
}

module.exports = {
  name: 'NPC movement contract (Phase 0): additive validation, synthetic fixtures, no real NPC moves',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    // ── 1. Current game: zero errors, zero movement-related output ─────────
    const clean = runValidation(g);
    assert.equal(clean.errors, 0, 'current game data should validate with zero errors: ' + JSON.stringify(clean.errorList));
    const movementMentions = clean.errorList.concat(clean.warningList).map(m => m.message).filter(m => /movement\b/i.test(m));
    // .length compare, not deepEqual vs [] -- vm-realm arrays fail deepStrictEqual's prototype check
    assert.equal(movementMentions.length, 0, 'the movement validator must produce nothing for the current game: ' + JSON.stringify(movementMentions));
    const baselineWarnings = clean.warnings;

    // ── 2. A well-formed synthetic patrol passes ────────────────────────────
    const good = validateFixture(g, `{
      id: 'zz_test_patrol', name: 'Fixture', map: 'town', x: 3.5 * TILE, y: 3.5 * TILE,
      solid: false, facing: 'down', spriteType: 'patron', dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: { type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }, { x: 6.5, y: 3.5 }], speed: 0.5, pauseFrames: 90, loop: true },
    }`, 'zz_test_patrol');
    assert.equal(good.errors.length, 0, 'a well-formed patrol config must produce no errors: ' + JSON.stringify(good.errors));
    assert.equal(good.res.warnings, baselineWarnings, 'a well-formed patrol config must add no warnings');

    // pauseFrames and loop are optional
    const minimal = validateFixture(g, `{
      id: 'zz_test_minimal', name: 'Fixture', map: 'town', x: 3.5 * TILE, y: 3.5 * TILE,
      solid: false, facing: 'down', spriteType: 'worker', dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: { type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1 },
    }`, 'zz_test_minimal');
    assert.equal(minimal.errors.length, 0, 'pauseFrames/loop are optional: ' + JSON.stringify(minimal.errors));

    // A well-formed auto-starting looping patrol with per-waypoint dwell and
    // orthogonal segments (the Tobb Wend form) passes with no errors.
    const autoPatrol = validateFixture(g, `{
      id: 'zz_test_autopatrol', name: 'Fixture', map: 'town', x: 3.5 * TILE, y: 3.5 * TILE,
      solid: false, facing: 'down', spriteType: 'worker', dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: { type: 'patrol', autoStart: true, speed: 0.5, loop: true, waypoints: [
        { x: 3.5, y: 3.5, pauseFrames: 60 }, { x: 5.5, y: 3.5, pauseFrames: 30 },
        { x: 5.5, y: 5.5, pauseFrames: 90 }, { x: 3.5, y: 5.5, pauseFrames: 45 },
      ] },
    }`, 'zz_test_autopatrol');
    assert.equal(autoPatrol.errors.length, 0, 'a well-formed auto-patrol must produce no errors: ' + JSON.stringify(autoPatrol.errors));

    // A well-formed boundedWander (the Tomas form) passes with no errors.
    const wander = validateFixture(g, `{
      id: 'zz_test_wander', name: 'Fixture', map: 'town', x: 5.5 * TILE, y: 5.5 * TILE,
      solid: true, facing: 'down', spriteType: 'patron', dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: { type: 'boundedWander', bounds: { minCol: 4, maxCol: 11, minRow: 2, maxRow: 9 }, speed: 0.5, minPauseFrames: 60, maxPauseFrames: 180 },
    }`, 'zz_test_wander');
    assert.equal(wander.errors.length, 0, 'a well-formed boundedWander must produce no errors: ' + JSON.stringify(wander.errors));

    // A well-formed one-way scriptedRoute (the Phase 1 type) passes too.
    const scripted = validateFixture(g, `{
      id: 'zz_test_scripted', name: 'Fixture', map: 'town', x: 3.5 * TILE, y: 3.5 * TILE,
      solid: false, facing: 'down', spriteType: 'patron', dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: { type: 'scriptedRoute', waypoints: [{ x: 5.5, y: 3.5 }], speed: 0.5, pauseFrames: 0, loop: false },
    }`, 'zz_test_scripted');
    assert.equal(scripted.errors.length, 0, 'a well-formed scriptedRoute must produce no errors: ' + JSON.stringify(scripted.errors));

    // ── 3. Malformed configs fail clearly ───────────────────────────────────
    const base = (id, movement) => `{
      id: '${id}', name: 'Fixture', map: 'town', x: 3.5 * TILE, y: 3.5 * TILE,
      solid: false, facing: 'down', spriteType: 'patron', dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: ${movement},
    }`;
    const failCases = [
      ['zz_bad_type',    `{ type: 'wander', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1 }`,                    /not a recognized movement type/],
      ['zz_no_wps',      `{ type: 'patrol', waypoints: [], speed: 1 }`,                                       /waypoints must be a nonempty array/],
      ['zz_missing_wps', `{ type: 'patrol', speed: 1 }`,                                                      /waypoints must be a nonempty array/],
      ['zz_nan_wp',      `{ type: 'patrol', waypoints: [{ x: NaN, y: 3.5 }], speed: 1 }`,                     /finite numbers/],
      ['zz_string_wp',   `{ type: 'patrol', waypoints: [{ x: '4.5', y: 3.5 }], speed: 1 }`,                   /finite numbers/],
      ['zz_oob_wp',      `{ type: 'patrol', waypoints: [{ x: 99, y: 3.5 }], speed: 1 }`,                      /outside map bounds/],
      ['zz_zero_speed',  `{ type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 0 }`,                     /speed must be a positive finite number/],
      ['zz_inf_speed',   `{ type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: Infinity }`,              /speed must be a positive finite number/],
      ['zz_neg_pause',   `{ type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1, pauseFrames: -5 }`,    /pauseFrames must be a nonnegative/],
      ['zz_bad_loop',    `{ type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1, loop: 'yes' }`,        /loop must be a boolean/],
      ['zz_not_object',  `'patrol'`,                                                                          /movement must be a plain object/],
      ['zz_route_loop',  `{ type: 'scriptedRoute', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1, loop: true }`,   /loop must be false for a scriptedRoute/],
      // Phase 1 patrol additions:
      ['zz_bad_autostart',   `{ type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1, autoStart: 'yes' }`,          /autoStart must be a boolean/],
      ['zz_autostart_route', `{ type: 'scriptedRoute', waypoints: [{ x: 5.5, y: 3.5 }], speed: 1, autoStart: true }`,    /autoStart is only meaningful for a patrol/],
      ['zz_neg_wp_pause',    `{ type: 'patrol', waypoints: [{ x: 3.5, y: 3.5, pauseFrames: -5 }], speed: 1 }`,           /waypoints\[0\]\.pauseFrames must be a nonnegative/],
      ['zz_diagonal',        `{ type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }, { x: 5.5, y: 6.5 }], speed: 1, loop: true }`, /is diagonal; routes must be orthogonal/],
      // Phase 1 boundedWander additions:
      ['zz_wander_no_bounds', `{ type: 'boundedWander', speed: 1 }`,                                                                 /requires a bounds object/],
      ['zz_wander_nan_bound', `{ type: 'boundedWander', bounds: { minCol: NaN, maxCol: 5, minRow: 2, maxRow: 4 }, speed: 1 }`,       /bounds\.minCol must be a finite number/],
      ['zz_wander_minmax',    `{ type: 'boundedWander', bounds: { minCol: 8, maxCol: 4, minRow: 2, maxRow: 4 }, speed: 1 }`,         /bounds\.minCol must be <= maxCol/],
      ['zz_wander_oob',       `{ type: 'boundedWander', bounds: { minCol: 4, maxCol: 99, minRow: 2, maxRow: 4 }, speed: 1 }`,        /bounds must be inside the map/],
      ['zz_wander_pause',     `{ type: 'boundedWander', bounds: { minCol: 4, maxCol: 8, minRow: 2, maxRow: 4 }, speed: 1, minPauseFrames: 200, maxPauseFrames: 60 }`, /minPauseFrames must be <= maxPauseFrames/],
      ['zz_wander_negpause',  `{ type: 'boundedWander', bounds: { minCol: 4, maxCol: 8, minRow: 2, maxRow: 4 }, speed: 1, minPauseFrames: -5 }`, /minPauseFrames must be a nonnegative/],
      ['zz_wander_wps',       `{ type: 'boundedWander', bounds: { minCol: 4, maxCol: 8, minRow: 2, maxRow: 4 }, speed: 1, waypoints: [{ x: 4.5, y: 3.5 }] }`, /must not have waypoints/],
      ['zz_wander_speed',     `{ type: 'boundedWander', bounds: { minCol: 4, maxCol: 8, minRow: 2, maxRow: 4 }, speed: 0 }`,        /speed must be a positive finite number/],
      ['zz_patrol_bounds',    `{ type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1, bounds: { minCol: 4, maxCol: 8, minRow: 2, maxRow: 4 } }`, /bounds applies only to a boundedWander/],
    ];
    for (const [id, movement, rx] of failCases) {
      const bad = validateFixture(g, base(id, movement), id);
      assert.ok(bad.errors.some(e => rx.test(e)), id + ' should fail with ' + rx + '; got: ' + JSON.stringify(bad.errors));
    }

    // Bespoke-rendered id (NPC_DRAW_FNS) — movement must be rejected.
    // 'maren' is a real bespoke id; the fixture reuses it, which also trips
    // the duplicate-id error — assert specifically on the bespoke message.
    const bespoke = validateFixture(g, base('maren', `{ type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1 }`), 'maren');
    assert.ok(bespoke.errors.some(e => /bespoke-rendered NPC/.test(e)),
      'movement on a bespoke-rendered (NPC_DRAW_FNS) id must be an error: ' + JSON.stringify(bespoke.errors));

    // Missing id — movement requires one.
    g.run(`SIMPLE_NPCS.push({ name: 'NoId', map: 'town', x: 3.5 * TILE, y: 3.5 * TILE, solid: false, spriteType: 'patron',
      dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: { type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1 } });`);
    const noId = runValidation(g);
    g.run('SIMPLE_NPCS.pop();');
    assert.ok(noId.errorList.some(e => /movement requires the NPC to have an id/.test(e.message)),
      'movement without an id must be an error: ' + JSON.stringify(noId.errorList.filter(e => /movement/.test(e.message))));

    // Dynamic x getter — the authored schedule would fight runtime motion.
    const getterX = validateFixture(g, `{
      id: 'zz_getter_x', name: 'Fixture', map: 'town', get x() { return 3.5 * TILE; }, y: 3.5 * TILE,
      solid: false, facing: 'down', spriteType: 'patron', dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: { type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1 },
    }`, 'zz_getter_x');
    assert.ok(getterX.errors.some(e => /dynamic x\/y getter/.test(e)),
      'movement + x getter must be an error: ' + JSON.stringify(getterX.errors));

    // Dynamic map getter — a warning (special care), not an error.
    const getterMap = validateFixture(g, `{
      id: 'zz_getter_map', name: 'Fixture', get map() { return 'town'; }, x: 3.5 * TILE, y: 3.5 * TILE,
      solid: false, facing: 'down', spriteType: 'patron', dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: { type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }], speed: 1 },
    }`, 'zz_getter_map');
    assert.equal(getterMap.errors.length, 0, 'movement + map getter alone is not an error: ' + JSON.stringify(getterMap.errors));
    assert.ok(getterMap.warnings.some(w => /dynamic map getter/.test(w)),
      'movement + map getter should warn: ' + JSON.stringify(getterMap.warnings));

    // ── 4. Validation does not mutate the NPC definition ────────────────────
    g.run(`SIMPLE_NPCS.push({
      id: 'zz_mutation_probe', name: 'Fixture', map: 'town', x: 3.5 * TILE, y: 3.5 * TILE,
      solid: false, facing: 'down', spriteType: 'patron', dialogue: [], flag_required: null, flag_sets: null, action: null,
      movement: { type: 'patrol', waypoints: [{ x: 3.5, y: 3.5 }, { x: 6.5, y: 3.5 }], speed: 0.5, pauseFrames: 90, loop: true },
    });`);
    const before = g.run('JSON.stringify(SIMPLE_NPCS[SIMPLE_NPCS.length - 1])');
    runValidation(g);
    const after = g.run('JSON.stringify(SIMPLE_NPCS[SIMPLE_NPCS.length - 1])');
    g.run('SIMPLE_NPCS.pop();');
    assert.equal(after, before, 'validateGameData() must not mutate an NPC definition (movement included)');

    // ── 5. Exactly the four approved Phase 1 pilots have movement ───────────
    // (The two bridge guards use one-way scriptedRoutes; Tobb Wend uses an
    // auto-starting patrol; Tomas uses a bounded wander.) Any additional NPC
    // gaining movement must be a deliberate, reviewed decision updating this list.
    const APPROVED_PILOTS = ['bridge_soldier_south', 'bridge_soldier_north', 'tobb_wend', 'tomas'];
    const withMovement = g.run('SIMPLE_NPCS.filter(n => n.movement !== undefined).map(n => n.id)');
    assert.equal(JSON.stringify(Array.from(withMovement).sort()), JSON.stringify(APPROVED_PILOTS.slice().sort()),
      'exactly the four approved pilots may have movement; found: ' + JSON.stringify(withMovement));
    // The guards use scriptedRoute; Tobb patrol; Tomas boundedWander — no other type.
    const typeById = g.run('JSON.stringify(SIMPLE_NPCS.filter(n => n.movement !== undefined).map(n => n.id + ":" + n.movement.type).sort())');
    assert.equal(typeById, JSON.stringify([
      'bridge_soldier_north:scriptedRoute',
      'bridge_soldier_south:scriptedRoute',
      'tobb_wend:patrol',
      'tomas:boundedWander',
    ]), 'guards scriptedRoute, Tobb patrol, Tomas boundedWander: ' + typeById);
    // Tobb's patrol auto-starts and loops.
    assert.equal(g.run("SIMPLE_NPCS.find(n => n.id === 'tobb_wend').movement.autoStart"), true, 'Tobb autoStart');
    assert.equal(g.run("SIMPLE_NPCS.find(n => n.id === 'tobb_wend').movement.loop"), true, 'Tobb loops');
    // Tomas is the only boundedWander.
    assert.equal(g.run("JSON.stringify(SIMPLE_NPCS.filter(n => n.movement && n.movement.type === 'boundedWander').map(n => n.id))"),
      JSON.stringify(['tomas']), 'Tomas is the only boundedWander NPC');

    // The validator state is clean again after all fixtures were removed.
    const finalCheck = runValidation(g);
    assert.equal(finalCheck.errors, 0, 'validation should be fully clean after all fixtures were removed: ' + JSON.stringify(finalCheck.errorList));
    assert.equal(finalCheck.warnings, baselineWarnings, 'warning count should be back to the pre-fixture baseline');
  },
};
