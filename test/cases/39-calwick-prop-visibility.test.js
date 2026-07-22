'use strict';
// Covers: audit fix #3 -- the five Calwick inspectables added in an earlier
// pass (Charter Stone, Public Cistern, Water Gauge, Reed-Drying Racks,
// Apartment Notice) sat on plain street/floor/reed/grass tiles with nothing
// visibly marking them. Each now has a small walkable decorative prop tile
// placed at its EXACT interaction coordinate: four new tiles (CHARTER_STONE,
// CISTERN, WATER_GAUGE, REED_RACK) plus a fifth (APT_NOTICE) that is a
// dedicated tile rather than a reuse of NOTICE_BOARD, because that tile's
// draw function hard-codes a town-market cobblestone base that would render
// wrong inside an interior corridor.
//
//   1. Each of the five map cells holds the expected new tile id, at the
//      exact x/y each MAP_FEATURES inspectable already used (no coordinate
//      drift between the interaction point and the visible object).
//   2. All five tiles are walkable (collision unchanged from before this
//      fix -- these coordinates were already walkable street/floor tiles).
//   3. All five are registered renderable (RENDERABLE_TILE_IDS) and a real
//      render frame at each location does not throw.
//   4. Each inspectable still opens dialogue via a real interact keypress
//      (interaction reachability unaffected by the tile swap).
//   5. No NPC or house door sits on the changed cell (collision-adjacent
//      content untouched).
//   6. Only the four genuinely new tiles are marked without isDecorative,
//      so validateGameData()'s "isDecorative + walkable" warning count is
//      unchanged (still only the pre-existing NOTICE_BOARD warning).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Calwick props: visible tiles at the five inspectable coordinates, collision/interaction/render unaffected',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // [mapGlobal, row, col, expectedTileConst, townBuilding, featureId, needle]
    const PROPS = [
      ['TOWN_MAP',               5,  1, 'CHARTER_STONE', null,   'calwick_charter_stone', 'boundary stone'],
      ['TOWN_MAP',               12, 11, 'CISTERN',       null,   'calwick_town_cistern',   'cistern'],
      ['EAST_TOWN_MAP',          5,  13, 'WATER_GAUGE',   'east', 'calwick_wetland_gauge',  'measuring stave'],
      ['EAST_TOWN_MAP',          10, 7,  'REED_RACK',     'east', 'calwick_reed_racks',     'drying rack'],
      ['APARTMENT_CORRIDOR_MAP', 7,  2,  'APT_NOTICE',    'apt',  'calwick_apt_notice',     'framed notice'],
    ];

    for (const [mapGlobal, row, col, tileConst, building, featureId, needle] of PROPS) {
      // ── 1. Exact tile at the exact interaction coordinate ────────────────
      const feature = g.run(`MAP_FEATURES['${mapGlobal}'].find(f => f.id === '${featureId}')`);
      assert.ok(feature, `${featureId} should still be registered in MAP_FEATURES['${mapGlobal}']`);
      const fx = feature.x, fy = feature.y;
      assert.equal(Math.floor(fx), col, `${featureId}: feature x should address col ${col}`);
      assert.equal(Math.floor(fy), row, `${featureId}: feature y should address row ${row}`);
      const actualTile = g.run(`${mapGlobal}[${row}][${col}]`);
      assert.equal(actualTile, g.run(tileConst), `${mapGlobal}[${row}][${col}] should be ${tileConst}`);

      // ── 2. Walkable (collision unchanged) ─────────────────────────────────
      assert.equal(g.run(`WALKABLE[${tileConst}]`), true, `${tileConst} must be walkable`);

      // ── 3. Renderable, real render frame doesn't throw ────────────────────
      assert.equal(g.run(`RENDERABLE_TILE_IDS.has(${tileConst})`), true, `${tileConst} must be in RENDERABLE_TILE_IDS`);
      g.run(`
        inDungeon=false; inTown=true; inSluice=false; currentTownId='calwick';
        townBuilding = ${building ? JSON.stringify(building) : 'null'};
        activeMap = ${mapGlobal}; player.x=${fx}*TILE; player.y=${fy}*TILE; dialogue.open=false;
      `);
      assert.doesNotThrow(() => g.renderFrame(), `rendering ${mapGlobal} at (${fx},${fy}) must not throw`);
      assert.equal(g.run('canWalk(player.x, player.y)'), true, `${featureId}'s coordinate must remain walkable in practice`);

      // ── 4. Real interact keypress still opens the inspectable ─────────────
      g.press('Enter');
      assert.equal(g.run('dialogue.open'), true, `${featureId} should still open dialogue via a real interact press`);
      assert.ok(g.run('dialogue.pages.flat().join(" ")').includes(needle),
        `${featureId}'s dialogue should still mention "${needle}"`);
      g.run('dialogue.open = false;');

      // ── 5. No NPC or house door sits on this cell ──────────────────────────
      const npcClash = g.run(`SIMPLE_NPCS.some(n => {
        let m; try { m = n.map; } catch (e) { return false; }
        if (m !== '${g.run(`currentMapId()`)}') return false;
        return Math.floor(n.x / TILE) === ${col} && Math.floor(n.y / TILE) === ${row};
      })`);
      assert.equal(npcClash, false, `no NPC should sit on the ${featureId} tile`);
      const curMapId = g.run('currentMapId()');
      const doorClash = g.run(`typeof HOUSE_DOORS !== 'undefined' && HOUSE_DOORS.some(d => d.map === '${curMapId}' && d.col === ${col} && d.row === ${row})`);
      assert.equal(doorClash, false, `no house door on ${curMapId} should sit on the ${featureId} tile`);
    }

    g.run('inTown=false; townBuilding=null;');

    // ── 6. Warning count unaffected -- only NOTICE_BOARD's isDecorative warning ─
    g.run(`
      window.__ol=console.log; window.__ow=console.warn; window.__oe=console.error;
      console.log=console.warn=console.error=function(){};
    `);
    const result = g.run('validateGameData()');
    g.run('console.log=window.__ol; console.warn=window.__ow; console.error=window.__oe;');
    assert.equal(result.errors, 0, `validateGameData() should report 0 errors, got: ${JSON.stringify(result.errorList)}`);
    const decorativeWarnings = (result.warningList || []).filter(w =>
      JSON.stringify(w).includes('isDecorative'));
    assert.equal(decorativeWarnings.length, 1,
      `only NOTICE_BOARD's isDecorative warning should remain, got: ${JSON.stringify(decorativeWarnings)}`);
  },
};
