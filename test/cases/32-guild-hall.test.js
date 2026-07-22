'use strict';
// The Drenwick Guild Hall (Canal Engineers' Guild) is no longer a bare box:
// its map now carries TABLE (33) blockers for the archive shelf, the posting
// board, the registrar's desk, and the members' table (drawn by the new
// drawGuildHallFurniture() overlay, wired in render.js like every other
// Drenwick interior), the previously-invisible posting board has a visible
// stand one tile north of its reading spot, and Senna (workday applicant)
// joins Foss (always) and Cae (dayoff).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Drenwick Guild Hall: furniture tiles + overlay, visible posting board, staffed on all days',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    g.run(`
      inTown = true;
      currentTownId = 'drenwick';
      enterBuilding('guild_hall');
    `);
    assert.equal(g.run('currentMapId()'), 'drenwick_guild_hall');

    // ── Furniture blockers in the map ───────────────────────────────────────
    assert.equal(g.run('WALKABLE[TABLE]'), false, 'precondition: TABLE blocks');
    for (let c = 1; c <= 5; c++) assert.equal(g.run(`DRENWICK_GUILD_HALL_MAP[1][${c}]`), 33, `archive shelf at r1 c${c}`);
    assert.equal(g.run('DRENWICK_GUILD_HALL_MAP[2][13]'), 33, 'posting board stand at r2 c13');
    assert.equal(g.run('DRENWICK_GUILD_HALL_MAP[4][1]'), 33, 'registrar desk at r4 c1');
    assert.equal(g.run('DRENWICK_GUILD_HALL_MAP[4][2]'), 33, 'registrar desk at r4 c2');
    for (let c = 5; c <= 8; c++) assert.equal(g.run(`DRENWICK_GUILD_HALL_MAP[8][${c}]`), 33, `members' table at r8 c${c}`);
    // NPC standing spots and the board-reading spot stay walkable.
    assert.equal(g.run('DRENWICK_GUILD_HALL_MAP[4][3]'), 18, 'Foss stands on open floor');
    assert.equal(g.run('DRENWICK_GUILD_HALL_MAP[7][8]'), 18, 'Cae stands on open floor');
    assert.equal(g.run('DRENWICK_GUILD_HALL_MAP[2][12]'), 18, 'Senna stands on open floor');
    assert.equal(g.run('DRENWICK_GUILD_HALL_MAP[3][13]'), 18, 'board-reading spot (GUILD_HALL_BOARD) stays walkable');
    g.renderFrame(); // furniture overlay must draw without throwing

    // ── The posting board reads from its established spot ───────────────────
    g.run('player.x = GUILD_HALL_BOARD.x; player.y = GUILD_HALL_BOARD.y;');
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Posting Board');
    assert.ok(/apprentice post/.test(JSON.stringify(g.run('dialogue.pages')).toLowerCase()));
    let n = g.run('dialogue.pages.length');
    for (let i = 0; i < n; i++) g.press('Enter');

    // ── Staff: Foss always, Senna on workdays, Cae on Dayoff ────────────────
    assert.equal(g.run("SIMPLE_NPCS.find(x => x.id === 'guild_registrar').map"), 'drenwick_guild_hall');
    assert.equal(g.run("SIMPLE_NPCS.find(x => x.id === 'guild_applicant').map"), 'drenwick_guild_hall', 'Senna present on a workday');
    assert.equal(g.run("SIMPLE_NPCS.find(x => x.id === 'guild_senior').map"), null, 'Cae absent on a workday');
    assert.ok(/shortlist/.test(JSON.stringify(g.run("SIMPLE_NPCS.find(x => x.id === 'guild_applicant').dialogue")).toLowerCase()),
      'Senna re-reads the notice');

    // Talk to Foss from beside his desk.
    g.run('player.x = 3.5 * TILE; player.y = 5.3 * TILE;');
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Foss');
    n = g.run('dialogue.pages.length');
    for (let i = 0; i < n; i++) g.press('Enter');

    // Dayoff: Cae in, Senna out (the hall itself stays open).
    g.run('day = 5;');
    assert.equal(g.run("SIMPLE_NPCS.find(x => x.id === 'guild_senior').map"), 'drenwick_guild_hall', 'Cae present on Dayoff');
    assert.equal(g.run("SIMPLE_NPCS.find(x => x.id === 'guild_applicant').map"), null, 'Senna absent on Dayoff');
  },
};
