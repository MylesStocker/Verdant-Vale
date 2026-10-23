'use strict';

// Terrain-redesign pass, batch 0: three new tiles mirroring DEEP_REEDS's own
// footprint exactly (tiles.js constants/WALKABLE/TILE_PROPERTIES, render-tiles.js
// draw function + drawTile() case + RENDERABLE_TILE_IDS, no validation.js change
// needed since validateTiles() already fails closed generically on any unmapped
// tile id). This batch adds no chunk-grid content yet — the confinement checks
// below are written to hold both now (vacuously true) and once later batches
// place these tiles, exactly mirroring test 175's own DEEP_REEDS confinement check.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

module.exports = {
  name: 'Eastern Fens terrain redesign: three new tiles (Gravel Bar, Driftwood, Stranded Boat) registered correctly and confined to Eastern Fens',
  run() {
    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. Gravel Bar (128) — walkable, natural, encounter-eligible like other
    //    walkable natural terrain, rendered.
    assert.equal(g.run('WALKABLE[GRAVEL_BAR]'), true);
    assert.equal(g.run("TILE_PROPERTIES[GRAVEL_BAR].category"), 'natural');
    assert.equal(g.run("TILE_PROPERTIES[GRAVEL_BAR].encounterEligible"), true);
    assert.equal(g.run("TILE_PROPERTIES[GRAVEL_BAR].tags.includes('blocker')"), false);
    assert.equal(g.run('RENDERABLE_TILE_IDS.has(GRAVEL_BAR)'), true);

    // 2. Driftwood (129) — impassable decorative blocker, not encounter-eligible.
    assert.equal(g.run('WALKABLE[DRIFTWOOD]'), false);
    assert.equal(g.run("TILE_PROPERTIES[DRIFTWOOD].category"), 'decorative_blocker');
    assert.equal(g.run("TILE_PROPERTIES[DRIFTWOOD].encounterEligible"), false);
    assert.equal(g.run("TILE_PROPERTIES[DRIFTWOOD].isDecorative"), true);
    assert.equal(g.run('RENDERABLE_TILE_IDS.has(DRIFTWOOD)'), true);

    // 3. Stranded Boat (130) — impassable decorative blocker, drought signal.
    assert.equal(g.run('WALKABLE[STRANDED_BOAT]'), false);
    assert.equal(g.run("TILE_PROPERTIES[STRANDED_BOAT].category"), 'decorative_blocker');
    assert.equal(g.run("TILE_PROPERTIES[STRANDED_BOAT].encounterEligible"), false);
    assert.equal(g.run("TILE_PROPERTIES[STRANDED_BOAT].isDecorative"), true);
    assert.equal(g.run('RENDERABLE_TILE_IDS.has(STRANDED_BOAT)'), true);

    // 4. Stable ids, no collision with any existing/retired tile constant.
    assert.deepEqual(J('JSON.stringify([GRAVEL_BAR,DRIFTWOOD,STRANDED_BOAT])'), [128, 129, 130]);
    assert.equal(g.run('new Set([GRAVEL_BAR,DRIFTWOOD,STRANDED_BOAT]).size'), 3);

    // 5. Deterministic rendering: no Math.random anywhere in their draw code.
    const fs = require('fs');
    const renderSource = fs.readFileSync(require('path').join(__dirname, '..', '..', 'render-tiles.js'), 'utf8');
    for (const fn of ['drawGravelBar', 'drawDriftwood', 'drawStrandedBoat']) {
      const body = renderSource.slice(renderSource.indexOf('function ' + fn));
      assert.doesNotMatch(body.slice(0, body.indexOf('\n}')), /Math\.random/, fn + ' is deterministic');
    }

    // 6. Confined to the Eastern Fens region plus its directly-seamed
    //    siblings the Great Fen and the Valmere expanse (mirrors test 175's
    //    DEEP_REEDS confinement check, widened as each expansion reused
    //    tiles from this same approved natural palette). Holds vacuously
    //    true for Driftwood/Stranded Boat until a later batch places them,
    //    then proves they never leak into any other region.
    const ALLOWED_REGIONS = ['Eastern Fens', 'Great Fen', 'Valmere', 'Eastern Shore', 'Southern Moraine'];
    for (const id of [128, 129, 130]) {
      const foreign = J(`JSON.stringify((function(){
        var hits=[];
        Object.keys(REGIONAL_CHUNK_CATALOG).forEach(function(mid){
          if(${JSON.stringify(ALLOWED_REGIONS)}.indexOf(REGIONAL_CHUNK_CATALOG[mid].region)!==-1)return;
          if(REGIONAL_CHUNK_CATALOG[mid].map.some(function(r){return r.includes(${id});}))hits.push(mid);
        });
        if(typeof MAP_CATALOG!=='undefined')Object.keys(MAP_CATALOG).forEach(function(mid){
          if(REGIONAL_CHUNK_CATALOG[mid])return;
          var grid=MAP_CATALOG[mid]&&(MAP_CATALOG[mid].map||MAP_CATALOG[mid].grid);
          if(Array.isArray(grid)&&grid.some(function(r){return Array.isArray(r)&&r.includes(${id});}))hits.push(mid);
        });
        return hits;
      })())`);
      assert.deepEqual(foreign, [], `tile ${id} is used only inside the Eastern Fens, the Great Fen, the Valmere expanse, the Eastern Shore, or the Southern Moraine`);
    }

    // 7. validateGameData() stays clean with the new tiles registered.
    const v = J('JSON.stringify(validateGameData())');
    assert.equal(v.errors, 0);
  },
};
