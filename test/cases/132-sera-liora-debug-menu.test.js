'use strict';

// Covers the direct debug-menu replay route without expanding either warp
// catalog or mutating story progression while normal-play access is held.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Sera/Liora cutaway debug-menu preview: direct, progression-neutral, absent from Warp Stone',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    assert.equal(g.run('DEBUG_MENU_ROW_COUNT'), 11);
    g.run(`
      __debugLabels = [];
      ctx.fillText = function(text) { __debugLabels.push(String(text)); };
      debugMenu.open = true;
      debugMenu.cursor = 10;
      drawDebugMenu();
    `);
    assert.equal(g.run("__debugLabels.some(function(text){return text.indexOf('Play Sera/Liora Cutaway') >= 0;})"), true,
      'debug menu renders the dedicated cutscene action');

    const debugWarpCount = g.run('getDebugWarpDestinations().length');
    const playerWarpCount = g.run('getPlayerWarpDestinations().length');
    assert.equal(g.run("getDebugWarpDestinations().some(function(d){return d.mapId==='BETHANY_GUEST_ROOM_MAP';})"), false,
      'guest room is absent from the debug warp catalog');
    assert.equal(g.run("getPlayerWarpDestinations().some(function(d){return d.mapId==='BETHANY_GUEST_ROOM_MAP'||/Sera|Liora|Bethany/.test(d.label);})"), false,
      'cutscene and guest room are absent from the player-facing Warp Stone');

    g.run(`
      window.basin_chamber_dream_done = false;
      window.basin_chamber_exits = 1;
      reservoir_report_filed = false;
      syncQuestFlagsToWindow();
      debugMenu.open = true;
      debugMenu.cursor = 10;
    `);
    g.press('Enter');

    assert.equal(g.run('debugMenu.open'), false, 'action closes the debug menu');
    assert.equal(g.run('seraLioraCutscene.active'), true, 'cutscene orchestration starts from the debug action');
    assert.equal(g.run('seraLioraCutscene.startCount'), 1, 'preview starts exactly once');
    assert.equal(g.run('activeMap === DREAM_MAP'), true, 'preview begins on the existing white map');
    assert.equal(g.run('seraLioraCutscene.beat'), 0);
    assert.equal(g.run('dialogue.pages[0][0]'), 'Liora.');
    assert.equal(g.run('dialogue.presentation'), 'white_field');
    assert.equal(g.run('_dreamReturn'), null, 'preview does not retain a normal dream return point');
    assert.equal(g.run('window.basin_chamber_dream_done'), false, 'preview does not complete the story dream');
    assert.equal(g.run('window.basin_chamber_exits'), 1, 'preview preserves chamber progress');
    assert.equal(g.run('reservoir_report_filed'), false, 'preview preserves quest progress');
    assert.equal(g.run('getDebugWarpDestinations().length'), debugWarpCount, 'debug warp catalog remains unchanged');
    assert.equal(g.run('getPlayerWarpDestinations().length'), playerWarpCount, 'Warp Stone catalog remains unchanged');

    // Advance the exact same scripted route through its silent pauses/reveal
    // and prove that the temporary endpoint remains the existing hospital wake.
    let guard = 0;
    while (!g.run('activeMap === DRENWICK_INFIRMARY_MAP') && guard < 300) {
      if (g.run('dialogue.open')) g.press(' ');
      else g.frames(1);
      guard++;
    }
    assert.ok(guard < 300, 'preview reaches the hospital without looping');
    assert.equal(g.run('dialogue.name'), 'Esla');
    assert.equal(g.run('seraLioraCutscene.active'), false);
    assert.equal(g.run('window.basin_chamber_dream_done'), false, 'hospital handoff still leaves story completion untouched');

    while (g.run('dialogue.open')) g.press(' ');
    const beforeMove = g.run('player.y');
    g.hold('ArrowDown');
    g.frames(1);
    g.release('ArrowDown');
    assert.notEqual(g.run('player.y'), beforeMove, 'normal control returns after existing hospital dialogue');
  },
};
