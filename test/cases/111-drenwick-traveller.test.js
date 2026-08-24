'use strict';
// The Travelling Salesman now also visits the Drenwick MARKETPLACE, at the same
// 1-in-3 per-town-entry chance she visits Calwick's square. Presence + position
// are owned by one authority, currentTravellerSpot() (npcs.js), which the sprite,
// collision, and shop all read. She appears on Calwick's TOWN_MAP and Drenwick's
// DRENWICK_MARKET_MAP only — never on Drenwick's other squares (Civic/Outskirts)
// or inside any building.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run('debugMode=true;dialogue.open=false;choice.open=false;menu.open=false;shop.open=false;');
  return g;
}
const R = (g, c) => g.run(c);
// Put the player in a town-square map with a chosen presence roll.
function inSquare(g, mapId, x, y, townId, present, building) {
  g.run(`resetLocationState();placeAtLocation('${mapId}',${x}*TILE,${y}*TILE);` +
        `inTown=true;currentTownId='${townId}';townBuilding=${building ? `'${building}'` : 'null'};` +
        `travellerPresent=${present};`);
}

module.exports = {
  name: 'Drenwick Traveller: 1/3 marketplace appearance, shared with Calwick square',
  run() {
    const g = fresh();

    // ── 0. The Drenwick stall spot is walkable market floor, clear of the market
    //       NPCs (davan 9.5,7.5 / nora 4.5,5.5 / jost 9.5,5.5) and the notice board.
    assert.equal(g.run('isTileWalkable(DRENWICK_MARKET_MAP[6][5])'), true, 'stall tile is walkable');
    assert.equal(g.run('DRENWICK_MARKET_MAP[6][5]'), 21, 'stall tile is market-square floor');
    assert.equal(g.run('DRENWICK_TRAVELLER.x') === g.run('5.5*TILE') && g.run('DRENWICK_TRAVELLER.y') === g.run('6.5*TILE'), true, 'stall at col 5 row 6');
    for (const occ of ['9.5*TILE,7.5*TILE', '4.5*TILE,5.5*TILE', '9.5*TILE,5.5*TILE', '7.5*TILE,6.5*TILE']) {
      assert.equal(g.run(`DRENWICK_TRAVELLER.x===${occ.split(',')[0]}&&DRENWICK_TRAVELLER.y===${occ.split(',')[1]}`), false, `stall not on an occupant (${occ})`);
    }

    // ── 1. Calwick square: unchanged — present iff the roll came up. ─────────
    inSquare(g, 'TOWN_MAP', 7.5, 10.5, 'calwick', true, null);
    assert.equal(g.run('JSON.stringify(currentTravellerSpot())'), g.run('JSON.stringify(TRAVELLER)'), 'Calwick square: present at the Calwick spot');
    inSquare(g, 'TOWN_MAP', 7.5, 10.5, 'calwick', false, null);
    assert.equal(g.run('currentTravellerSpot()'), null, 'Calwick square: absent when the roll failed');

    // ── 2. Drenwick marketplace: NOW present when the roll came up. ──────────
    inSquare(g, 'DRENWICK_MARKET_MAP', 7.5, 8.5, 'drenwick', true, null);
    assert.equal(g.run('JSON.stringify(currentTravellerSpot())'), g.run('JSON.stringify(DRENWICK_TRAVELLER)'), 'Drenwick market: present at the market stall');
    inSquare(g, 'DRENWICK_MARKET_MAP', 7.5, 8.5, 'drenwick', false, null);
    assert.equal(g.run('currentTravellerSpot()'), null, 'Drenwick market: absent when the roll failed');

    // ── 3. Not on Drenwick's OTHER squares, nor inside any building. ────────
    inSquare(g, 'DRENWICK_CIVIC_MAP', 7.5, 11.5, 'drenwick', true, null);
    assert.equal(g.run('currentTravellerSpot()'), null, 'Drenwick Civic square: no Traveller');
    inSquare(g, 'DRENWICK_EAST_OUTSKIRTS_MAP', 2.5, 4.5, 'drenwick', true, null);
    assert.equal(g.run('currentTravellerSpot()'), null, 'Drenwick Outskirts: no Traveller');
    inSquare(g, 'DRENWICK_MARKET_MAP', 7.5, 8.5, 'drenwick', true, 'inn');
    assert.equal(g.run('currentTravellerSpot()'), null, 'inside a building (townBuilding set): no Traveller');
    // Not on the overworld either.
    g.run('resetLocationState();placeAtLocation("MAP2",6.5*TILE,6.5*TILE);__reconcileCanonicalForTest();travellerPresent=true;');
    assert.equal(g.run('currentTravellerSpot()'), null, 'overworld: no Traveller');

    // ── 4. Shop opens on interact when adjacent, in the Drenwick market. ────
    inSquare(g, 'DRENWICK_MARKET_MAP', 5.5, 7.5, 'drenwick', true, null);
    g.run('player.x=5.5*TILE;player.y=7.0*TILE;shop.open=false;dialogue.open=false;choice.open=false;handleInteract();');
    assert.equal(g.run('shop.open') === true && g.run('shop.title') === 'TRAVELLER', true, 'adjacent interact opens the TRAVELLER shop');
    assert.equal(g.run('JSON.stringify(shop.stock)'), g.run('JSON.stringify(TRAVELLER_STOCK)'), 'shop sells the Traveller stock');
    // Away from the stall: no shop.
    g.run('shop.open=false;player.x=11.5*TILE;player.y=8.5*TILE;handleInteract();');
    assert.equal(g.run("shop.open && shop.title==='TRAVELLER'"), false, 'not adjacent: no Traveller shop');

    // ── 5. Collision — the stall tile is solid in the Drenwick market. ──────
    inSquare(g, 'DRENWICK_MARKET_MAP', 7.5, 8.5, 'drenwick', true, null);
    assert.equal(g.run('canWalk(5.5*TILE,6.5*TILE)'), false, 'present: stall tile is solid');
    g.run('travellerPresent=false;');
    assert.equal(g.run('canWalk(5.5*TILE,6.5*TILE)'), true, 'absent: stall tile is walkable again');

    // ── 6. Rendering the market square with the Traveller present does not throw.
    inSquare(g, 'DRENWICK_MARKET_MAP', 7.5, 8.5, 'drenwick', true, null);
    assert.doesNotThrow(() => g.renderFrame(), 'render does not throw with the market Traveller present');

    // ── 7. enterTownAt() still rolls the 1/3 chance on a Drenwick entry
    //       (unchanged authority; deterministic via a controlled RNG sweep). ──
    let present = 0; const N = 3000;
    for (let i = 0; i < N; i++) {
      g.run(`var _r=Math.random;Math.random=function(){return ${i / N};};enterTownAt('drenwick','south');Math.random=_r;`);
      if (g.run('travellerPresent')) present++;
    }
    const frac = present / N;
    assert.ok(Math.abs(frac - 1 / 3) < 0.02, `Drenwick entry sets travellerPresent ~1/3 of the time (got ${frac.toFixed(3)})`);
    // A win (rng < 1/3) and a loss (rng >= 1/3) both resolve deterministically.
    g.run("var _r=Math.random;Math.random=function(){return 0.1;};enterTownAt('drenwick','south');Math.random=_r;");
    assert.equal(g.run('travellerPresent'), true, 'rng 0.1 < 1/3 => present');
    g.run("var _r=Math.random;Math.random=function(){return 0.9;};enterTownAt('drenwick','south');Math.random=_r;");
    assert.equal(g.run('travellerPresent'), false, 'rng 0.9 >= 1/3 => absent');

    // ── 8. Validation stays clean. ─────────────────────────────────────────
    const v = JSON.parse(g.run('JSON.stringify(validateGameData())'));
    assert.equal(v.errors, 0, 'validation clean');
  },
};
