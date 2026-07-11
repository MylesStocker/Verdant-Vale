'use strict';
// The weekly strange dream (rest in own bed, day % 7 === 3) now plays with
// the player standing in DREAM_MAP — a real, registered, all-white map
// (walkable DREAM_FLOOR interior, invisible blocking DREAM_EDGE ring) —
// entered via enterDream() and left via exitDream() when the dream dialogue
// closes, restoring the waking world exactly (map, position, facing, and the
// inTown/townBuilding/currentHouseId flags the renderer keys on).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'dream map: all-white registered map, entered for the weekly dream, waking world restored',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── The map itself ──────────────────────────────────────────────────────
    assert.equal(g.run('MAP_REGISTRY.DREAM_MAP.map === DREAM_MAP'), true, 'DREAM_MAP is registered');
    assert.equal(g.run('MAP_METADATA.DREAM_MAP.allowRandomEncounters'), false);
    assert.equal(g.run('DREAM_MAP.every(row => row.every(t => t === DREAM_FLOOR || t === DREAM_EDGE))'), true,
      'the dream contains nothing but white');
    assert.equal(g.run(`
      DREAM_MAP.every((row, r) => row.every((t, c) =>
        (r === 0 || r === 14 || c === 0 || c === 15) ? t === DREAM_EDGE : t === DREAM_FLOOR))
    `), true, 'border ring blocks, interior walks');
    assert.equal(g.run('WALKABLE[DREAM_FLOOR]'), true);
    assert.equal(g.run('WALKABLE[DREAM_EDGE]'), false);
    assert.equal(g.run('RENDERABLE_TILE_IDS.has(DREAM_FLOOR) && RENDERABLE_TILE_IDS.has(DREAM_EDGE)'), true);

    // ── Dream night: rest in the player's own bed on a day % 7 === 3 eve ────
    g.run(`
      inTown = true;
      currentTownId = 'calwick';
      enterHouse('player_house');
      day = 2; // rest() increments to 3, and 3 % 7 === 3 -> dream night
      const bed = HOUSE_DATA.player_house.bed;
      player.x = bed.x;
      player.y = bed.y;
    `);
    const bedX = g.run('player.x'), bedY = g.run('player.y');
    g.press('Enter');
    assert.equal(g.run('choice.open'), true, 'bed should offer Rest/Leave');
    g.run('choice.cursor = 0;');
    g.press('Enter'); // Rest

    // Now dreaming: white map, player centred, dialogue up, world stashed.
    assert.equal(g.run('day'), 3);
    assert.equal(g.run('dialogue.open'), true, 'dream text should be showing');
    assert.equal(g.run('activeMap === DREAM_MAP'), true, 'the dream plays on DREAM_MAP');
    assert.equal(g.run('inTown'), false, 'house/town render overlays are suppressed in the dream');
    assert.equal(g.run('townBuilding'), null);
    assert.equal(g.run('currentHouseId'), null);
    assert.equal(g.run('player.x'), 7.5 * 32, 'player stands at the centre of the white');
    assert.equal(g.run('player.y'), 7.5 * 32);
    const dreamText = JSON.stringify(g.run('dialogue.pages')).toLowerCase();
    assert.ok(/you wake/.test(dreamText), 'the dream text is one of the DREAMS entries');
    g.renderFrame(); // the all-white frame must render without throwing

    // Page through the dream -> exitDream() restores the bedroom exactly.
    const pages = g.run('dialogue.pages.length');
    for (let i = 0; i < pages; i++) g.press('Enter');
    assert.equal(g.run('dialogue.open'), false);
    assert.equal(g.run('activeMap === HOUSE_INTERIOR_MAP'), true, 'waking returns to the bedroom');
    assert.equal(g.run('inTown'), true);
    assert.equal(g.run('townBuilding'), 'house');
    assert.equal(g.run('currentHouseId'), 'player_house');
    assert.equal(g.run('player.x'), bedX, 'player wakes where they fell asleep');
    assert.equal(g.run('player.y'), bedY);

    // ── Ordinary night: no dream, no map swap ───────────────────────────────
    g.run('day = 4;'); // rest() -> 5, and 5 % 7 !== 3
    g.press('Enter');
    g.run('choice.cursor = 0;');
    g.press('Enter'); // Rest
    assert.equal(g.run('day'), 5);
    assert.equal(g.run('dialogue.open'), false, 'no dream text on an ordinary night');
    assert.equal(g.run('activeMap === HOUSE_INTERIOR_MAP'), true, 'no map swap on an ordinary night');
  },
};
