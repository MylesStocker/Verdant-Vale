'use strict';
// Covers: player movement (input.js -> movement.js) across a real map
// boundary (movement.js -> world-transitions.js). Walks the player out of
// the starting house through its door tile and confirms exitBuilding() fired
// and restored the pre-house map/position.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'movement: walking onto the house door tile crosses the map boundary',
  run() {
    const g = createContext();

    // Close the intro dialogue first -- update() ignores movement input while
    // dialogue.open is true, same as a real player would have to.
    g.press('Enter');
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), false, 'precondition: dialogue must be closed to move');
    assert.equal(g.run('townBuilding'), 'house', 'precondition: still inside the house');

    // Stand directly above the door (INTERIOR_EXIT tile) at HOUSE_INTERIOR_MAP
    // row 10, col 7, then hold Down onto it. (The new-game spawn is elsewhere in
    // the house — col 10, row 4 — so this test positions the player at the door
    // rather than relying on the spawn sitting above it.)
    g.run('player.x = 7.5 * TILE; player.y = 9.5 * TILE; player.facing = "down";');
    g.hold('ArrowDown');

    let crossed = false;
    for (let i = 0; i < 40; i++) {
      g.frames(1);
      if (g.run('townBuilding') !== 'house') { crossed = true; break; }
    }
    g.release('ArrowDown');

    assert.equal(crossed, true, 'player should have crossed the door tile within 40 frames of holding Down');

    // exitBuilding() for the calwick player_house restores houseSourceMap/
    // houseSourceBuilding/houseReturnPos and clears currentHouseId.
    assert.equal(g.run('activeMap === WEST_TOWN_MAP'), true, 'should land back on WEST_TOWN_MAP');
    assert.equal(g.run('townBuilding'), 'west');
    assert.equal(g.run('currentHouseId'), null);
    assert.equal(g.run('player.x'), 2.5 * 32, 'player.x should match houseReturnPos');
    assert.equal(g.run('player.y'), 12.5 * 32, 'player.y should match houseReturnPos');
    assert.equal(g.run('player.facing'), 'down');

    // The world should keep rendering fine from the new map.
    g.renderFrame();
  },
};
