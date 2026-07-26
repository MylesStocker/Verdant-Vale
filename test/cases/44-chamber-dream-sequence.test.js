'use strict';
// Covers the unmarked chamber ("No Recorded Location") scripted content:
//   1. The first-entry narration notes the total ABSENCE of the bog smell —
//      the chamber is completely odourless.
//   2. The player's FIRST exit is the ordinary step back to the Upper Reach.
//   3. The SECOND exit does not return them to the reach at all: it plays the
//      dream monologue in the all-white DREAM_MAP, then wakes them at the
//      Drenwick infirmary (waterfront) with Esla, who explains she found them
//      wandering the marshes and brought them back to town.
//   4. The exit counter is a persisted, window-native flag (survives save/load)
//      and later exits never re-trigger the one-time dream.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Unmarked chamber: odourless first-entry text; second exit → dream → wake at Drenwick infirmary',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    // ── 1. First-entry narration: completely odourless ──────────────────────
    const arrival = g.run(
      "MAP_FEATURES['BASIN_CHAMBER_MAP'].find(f => f.id === 'basin_chamber_arrival').pages.flat().join(' ')"
    );
    assert.ok(/odourless/i.test(arrival), 'chamber first-entry text should note the air is completely odourless');
    assert.ok(/smell/i.test(arrival), 'chamber first-entry text should reference the (absent) bog smell');

    // Clean outdoor state; the counter and one-time flag start fresh, and MQ4
    // (the reservoir assignment) is NOT yet given.
    g.run('inDungeon=false; inTown=false; inSluice=false; inSunkenGallery=false; ' +
          'menu.open=false; dialogue.open=false; ' +
          'window.basin_chamber_exits=0; window.basin_chamber_dream_done=false; ' +
          'reservoir_quest_started=false; syncQuestFlagsToWindow();');

    // ── 2. First exit is ordinary — back to the Upper Reach ─────────────────
    g.run('inBasinChamber=true; activeMap=BASIN_CHAMBER_MAP;');
    g.run('exitBasinChamber()');
    assert.equal(g.run('window.basin_chamber_exits'), 1, 'first exit increments the counter to 1');
    assert.equal(g.run('activeMap === NORTH_BASIN_NW_MAP'), true, 'first exit returns to the Upper Reach');
    assert.equal(g.run('inBasinChamber'), false);
    assert.equal(g.run('dialogue.open'), false, 'first exit opens no dialogue');

    // Counter persists across save/load.
    g.run('saveGame();');
    g.run('window.basin_chamber_exits = 99;'); // clobber, then restore from save
    g.run('loadGame();');
    assert.equal(g.run('window.basin_chamber_exits'), 1, 'the exit counter round-trips through save/load');

    // ── 3. The MQ4 gate: a SECOND exit before the reservoir assignment does
    //       NOT trigger the dream — it's an ordinary exit. ────────────────────
    g.run('inBasinChamber=true; activeMap=BASIN_CHAMBER_MAP; dialogue.open=false;');
    g.run('exitBasinChamber()');
    assert.equal(g.run('window.basin_chamber_exits'), 2, 'the exit still counts');
    assert.equal(g.run('activeMap === NORTH_BASIN_NW_MAP'), true, 'pre-MQ4, the second exit is ordinary — no dream');
    assert.equal(g.run('dialogue.open'), false, 'pre-MQ4, no dream monologue');
    assert.equal(g.run('window.basin_chamber_dream_done'), false, 'the sequence has not fired');

    // ── 4. Once MQ4 (reservoir assignment) is given, the next exit triggers
    //       the dream — even though the count is already past two. ────────────
    g.run('reservoir_quest_started = true; syncQuestFlagsToWindow();');
    g.run('inBasinChamber=true; activeMap=BASIN_CHAMBER_MAP; dialogue.open=false;');
    g.run('exitBasinChamber()');
    assert.equal(g.run('activeMap === DREAM_MAP'), true, 'post-MQ4, the exit warps into the dream, not the reach');
    assert.equal(g.run('window.basin_chamber_dream_done'), true, 'the one-time flag is now set');
    assert.equal(g.run('dialogue.open'), true, 'the dream monologue opens');
    assert.equal(g.run('dialogue.name'), '', 'the monologue has no speaker name');
    const monologue = g.run('dialogue.pages.flat().join(" ")');
    assert.ok(/four of us took the backroads/.test(monologue), 'the authored monologue plays');
    assert.ok(/find the Truth/.test(monologue), 'the monologue ends on the beast’s line');

    // ── Click through the dream → wake inside the Drenwick infirmary ────────
    let woke = false;
    for (let i = 0; i < 80 && !woke; i++) { g.press(' '); woke = g.run('activeMap === DRENWICK_INFIRMARY_MAP'); }
    assert.ok(woke, 'closing the dream wakes the player inside the Drenwick infirmary interior');
    assert.equal(g.run('townBuilding'), 'infirmary', 'they wake in the infirmary building');
    assert.equal(g.run('locationName()'), 'Drenwick — Infirmary');
    assert.equal(g.run('dialogue.name'), 'Esla', 'Esla is there when they wake');
    const esla = g.run('dialogue.pages.flat().join(" ")');
    assert.ok(/marshes/i.test(esla), 'Esla explains she found them in the marshes');
    assert.ok(/(brought you back|cart)/i.test(esla), 'Esla explains she brought them back to town');
    assert.equal(g.run('inTown'), true);
    assert.equal(g.run('currentTownId'), 'drenwick', 'they wake in Drenwick');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'they wake on a walkable tile, not stuck');

    // ── Esla's dialogue closes cleanly; the player is free ──────────────────
    let free = false;
    for (let i = 0; i < 20 && !free; i++) { g.press(' '); free = !g.run('dialogue.open'); }
    assert.ok(free, 'Esla’s dialogue closes without throwing (callbacks handled)');
    assert.equal(g.run('activeMap === DRENWICK_INFIRMARY_MAP'), true, 'still inside the infirmary, free to move');

    // ── The infirmary interior: staff, a patient, and the Doctor's Letter ───
    const staff = g.run("SIMPLE_NPCS.filter(n => n.map === 'drenwick_infirmary').map(n => n.name).sort()");
    assert.equal(JSON.stringify(staff), JSON.stringify(['Esla', 'Fisk', 'Merrin', 'Odger']),
      'the infirmary is populated: Merrin (infirmarer), Fisk (orderly), Odger (patient), Esla');
    // The letter is pickable from the dispensary counter and is a hidden key item.
    g.run("dialogue.open=false; player.x=11.5*TILE; player.y=11.5*TILE;");
    g.press(' ');
    assert.equal(g.run('dialogue.name'), "Doctor's Letter", 'the counter letter can be picked up');
    assert.ok(g.run("stats.items.some(i => i.name === \"Doctor's Letter\")"), 'the Doctor’s Letter enters the inventory');
    assert.ok(g.run("ITEM_REGISTRY[\"Doctor's Letter\"].keyItem"), 'it is a key item (Special Items only, not equippable)');
    assert.ok(!g.run("inventoryItems().some(i => i.name === \"Doctor's Letter\")"), 'kept out of the equip/use list');

    // ── The vestibule door exits to the waterfront and cannot be re-entered ──
    for (let i = 0; i < 8 && g.run('dialogue.open'); i++) g.press(' ');
    g.run("player.x=7.5*TILE; player.y=11.5*TILE; player.facing='down';");
    g.hold('ArrowDown');
    let out = false;
    for (let i = 0; i < 20 && !out; i++) { g.frames(1); out = g.run('activeMap === DRENWICK_WATERFRONT_MAP'); }
    g.release('ArrowDown');
    assert.ok(out, 'leaving through the vestibule returns to the waterfront in front of the infirmary');
    assert.equal(g.run('townBuilding'), null, 'back outside the building');

    // ── 5. A later chamber exit never re-triggers the one-time dream, even
    //       with MQ4 assigned and the counter well past two. ──────────────────
    g.run('inTown=false; inBasinChamber=true; activeMap=BASIN_CHAMBER_MAP; dialogue.open=false;');
    g.run('exitBasinChamber()');
    assert.equal(g.run('activeMap === NORTH_BASIN_NW_MAP'), true, 'a later exit is ordinary again — no repeat dream');
    assert.equal(g.run('dialogue.open'), false);
    assert.equal(g.run('window.basin_chamber_dream_done'), true, 'the one-time flag stays set');

    // The one-time flag round-trips through save/load too.
    g.run('saveGame();');
    g.run('window.basin_chamber_dream_done = false;');
    g.run('loadGame();');
    assert.equal(g.run('window.basin_chamber_dream_done'), true, 'the dream-done flag persists through save/load');
  },
};
