'use strict';
// Covers: the Calwick environmental-flavor pass -- five new MAP_FEATURES
// 'inspect' entries across TOWN_MAP (charter stone, public cistern),
// EAST_TOWN_MAP (water gauge, reed-drying racks), and
// APARTMENT_CORRIDOR_MAP (building notice) -- plus the third North Basin
// enemy, the Basin Gull, with its dedicated battle sprite.
//
//   1. Each of the five inspectables opens dialogue from its authored spot
//      (all five sit on walkable tiles, clear of NPCs/market/doors).
//   2. The cistern and the water gauge both carry the drought story --
//      making the flavor pass consistent with the North Basin arc, not
//      free-floating decoration.
//   3. The entries are Calwick-gated (same currentTownId condition
//      convention as the west survey marker): with another town id the
//      press is a silent no-op, since none of them author fallbackPages.
//   4. Basin Gull is in NORTH_BASIN_ENEMY_TEMPLATES -- the pool
//      MAP_METADATA points all four North Basin maps at -- with stats
//      inside the region's existing tier (nothing boss-shaped).
//   5. Basin Gull has a dedicated sprite: registered in
//      BATTLE_SPRITE_NAMES, and a real combat render frame with it as the
//      active enemy draws without throwing.
//   6. validateGameData() stays clean: 0 errors, and no warning mentions
//      the new feature ids or the new enemy.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Each entry: [map global, townBuilding, feature x/y, a string the first
// dialogue page must contain].
const INSPECTABLES = [
  ['TOWN_MAP',                null,   1.5,  5.5, 'boundary stone'],
  ['TOWN_MAP',                null,  11.5, 12.5, 'cistern'],
  ['EAST_TOWN_MAP',           'east', 13.5,  5.5, 'measuring stave'],
  ['EAST_TOWN_MAP',           'east',  7.5, 10.5, 'drying racks'],
  ['APARTMENT_CORRIDOR_MAP',  'apt',   2.5,  7.5, 'framed notice'],
];

function standAt(g, mapGlobal, townBuilding, x, y, townId) {
  g.run(`
    inDungeon = false; inSluice = false; inMarenPost = false;
    inTown = true;
    currentTownId = ${JSON.stringify(townId)};
    townBuilding = ${JSON.stringify(townBuilding)};
    activeMap = ${mapGlobal};
    player.x = ${x} * TILE;
    player.y = ${y} * TILE;
    player.facing = 'down';
  `);
}

module.exports = {
  name: 'Calwick flavor pass (5 inspectables) + Basin Gull (3rd North Basin enemy, dedicated sprite)',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 1 & 2. All five inspectables open and read correctly ───────────────
    for (const [mapGlobal, townBuilding, x, y, needle] of INSPECTABLES) {
      standAt(g, mapGlobal, townBuilding, x, y, 'calwick');
      assert.equal(g.run('dialogue.open'), false,
        `precondition: no dialogue open before inspecting at ${mapGlobal} (${x},${y})`);
      g.press('Enter');
      assert.equal(g.run('dialogue.open'), true,
        `the ${mapGlobal} inspectable at (${x},${y}) should open dialogue`);
      const firstPage = g.run('dialogue.pages[0].join(" ")');
      assert.ok(firstPage.includes(needle),
        `first page at ${mapGlobal} (${x},${y}) should mention "${needle}", got: ${firstPage}`);
      g.run('dialogue.open = false;');
    }

    // The two water-bookkeeping ones must actually carry the drought story.
    standAt(g, 'TOWN_MAP', null, 11.5, 12.5, 'calwick');
    g.press('Enter');
    assert.ok(g.run('dialogue.pages.flat().join(" ")').includes('drought'),
      'the cistern text should tie into the (now official) drought');
    g.run('dialogue.open = false;');

    standAt(g, 'EAST_TOWN_MAP', 'east', 13.5, 5.5, 'calwick');
    g.press('Enter');
    assert.ok(g.run('dialogue.pages.flat().join(" ")').includes('up north'),
      'the wetland gauge should echo the North Basin water-level story');
    g.run('dialogue.open = false;');

    // ── 3. Calwick-gated: another town id makes the press a silent no-op ───
    standAt(g, 'TOWN_MAP', null, 1.5, 5.5, 'drenwick');
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), false,
      'with currentTownId !== calwick the condition fails and (no fallbackPages) nothing should open');
    standAt(g, 'TOWN_MAP', null, 1.5, 5.5, 'calwick'); // and back on -> works again
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true);
    g.run('dialogue.open = false; inTown = false; townBuilding = null;');

    // ── 4. Basin Gull is in the shared North Basin pool with sane stats ────
    const gull = g.run(`NORTH_BASIN_ENEMY_TEMPLATES.find(t => t.name === 'Basin Gull')`);
    assert.ok(gull, 'Basin Gull should be in NORTH_BASIN_ENEMY_TEMPLATES');
    assert.equal(g.run(`NORTH_BASIN_ENEMY_TEMPLATES.length`), 3,
      'the North Basin pool should now have three enemies');
    // Same tier as its poolmates -- a variety add, not a balance change.
    assert.ok(gull.hp <= 30 && gull.atk <= 15 && gull.xp <= 25,
      `Basin Gull stats should sit in the existing North Basin tier, got ${JSON.stringify(gull)}`);
    // The Silt Flats and West Shore share this pool via MAP_METADATA (the
    // South Approach and Reservoir are deliberately encounter-free), so
    // being in the array is being in the region's encounters -- verify.
    for (const key of ['NORTH_BASIN_SW_MAP', 'NORTH_BASIN_W_MAP']) {
      assert.equal(
        g.run(`MAP_METADATA['${key}'].encounterPool === NORTH_BASIN_ENEMY_TEMPLATES`), true,
        `${key} should draw encounters from the shared North Basin pool`);
    }

    // ── 5. Dedicated sprite: registered, and a combat frame renders ────────
    assert.equal(g.run(`BATTLE_SPRITE_NAMES.has('Basin Gull')`), true,
      'Basin Gull should have a dedicated battle sprite registered');
    g.run(`
      startCombat();
      combat.enemy = Object.assign({}, NORTH_BASIN_ENEMY_TEMPLATES.find(t => t.name === 'Basin Gull'));
    `);
    assert.doesNotThrow(() => g.renderFrame(),
      'rendering a combat frame with Basin Gull as the enemy must not throw');
    g.run(`endCombat(); combat.active = false; dialogue.open = false;`);

    // ── 6. Content validation stays clean ──────────────────────────────────
    g.run(`
      window.__origLog = console.log; window.__origWarn = console.warn; window.__origError = console.error;
      console.log = console.warn = console.error = function() {};
    `);
    const result = g.run('validateGameData()');
    g.run(`
      console.log = window.__origLog; console.warn = window.__origWarn; console.error = window.__origError;
    `);
    assert.equal(result.errors, 0, `validateGameData() should report 0 errors, got: ${JSON.stringify(result.errorList)}`);
    const offending = (result.warningList || []).filter(w =>
      /calwick_(charter_stone|town_cistern|wetland_gauge|reed_racks|apt_notice)|Basin Gull/.test(String(w)));
    // .length, not deepEqual against [] -- warningList comes from the vm
    // context, so its Array prototype is a different realm's and strict
    // deepEqual would fail even when empty.
    assert.equal(offending.length, 0,
      `no validation warning should mention the new features or the new enemy, got: ${offending.join(' | ')}`);
  },
};
