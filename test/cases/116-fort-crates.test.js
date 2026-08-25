'use strict';
// Essa points the player to Polwick "over by the crates" in the smuggler's fort,
// but there were no crates. FORT_CRATES (npcs.js) now stacks a couple against the
// west wall beside Polwick — drawn as overlay furniture (drawFortCrates) and made
// solid via canWalk(), with no map-tile changes.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: "Smuggler's fort: crates stand beside Polwick, solid and rendered",
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    g.run("inSmugglerFort = true; activeMap = SMUGGLER_FORT_MAP; fort_quest_stage = 0;");

    // ── Essa's line references the crates the player is being sent to. ────────
    const essa = JSON.parse(g.run("JSON.stringify(SIMPLE_NPCS.find(n=>n.id==='essa').dialogue)"));
    assert.match(JSON.stringify(essa), /crates/, "Essa's dialogue still points at the crates");

    // ── A couple of crates, beside Polwick (col 7 row 4), on the same row. ────
    const crates = JSON.parse(g.run("JSON.stringify(FORT_CRATES.map(c=>[c.x/TILE, c.y/TILE]))"));
    assert.equal(crates.length, 2, 'a couple of crates');
    const polwick = JSON.parse(g.run("JSON.stringify((function(){const p=SIMPLE_NPCS.find(n=>n.id==='polwick');return [p.x/TILE,p.y/TILE];})())"));
    assert.deepEqual(polwick, [7.5, 4.5], 'Polwick is at col 7 row 4');
    for (const [cxs, cys] of crates) {
      assert.equal(cys, polwick[1], 'crate shares Polwick’s row');
      assert.ok(Math.abs(cxs - polwick[0]) <= 2.5, `crate is right beside Polwick (col ${cxs})`);
    }

    // ── The crate tiles were plain floor, and are now solid. ─────────────────
    for (const [cxs, cys] of crates) {
      assert.equal(g.run(`isTileWalkable(SMUGGLER_FORT_MAP[${Math.floor(cys)}][${Math.floor(cxs)}])`), true,
        `crate sits on a floor tile (${cxs},${cys}) — no tile change`);
      assert.equal(g.run(`canWalk(${cxs}*TILE, ${cys}*TILE)`), false, `crate tile is solid (${cxs},${cys})`);
    }

    // ── Polwick stays reachable; the crates don't wall anything off. ─────────
    assert.equal(g.run('canWalk(7.5*TILE, 5.5*TILE)'), true, 'the tile below Polwick (approach) is walkable');
    assert.equal(g.run('canWalk(8.5*TILE, 4.5*TILE)'), true, 'open floor beside Polwick is walkable');
    assert.equal(g.run('canWalk(5.5*TILE, 3.5*TILE)'), true, 'the back-left corner is still reachable (not isolated)');

    // ── The crates only exist inside the fort, and render without throwing. ──
    assert.doesNotThrow(() => g.run('drawFortCrates();'), 'drawFortCrates does not throw in the fort');
    g.run('inSmugglerFort = false;');
    assert.equal(g.run('canWalk(5.5*TILE, 4.5*TILE)'), true, 'outside the fort the crate collision does not apply');
  },
};
