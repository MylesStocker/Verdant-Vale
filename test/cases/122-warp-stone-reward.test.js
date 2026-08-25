'use strict';
// The best outcome of the reservoir arc (MQ4, 6–8 clues) now rewards a rare Warp
// Stone instead of the starter-tier Swift Bangle. The Warp Stone is a notebook
// special item whose inspect ACTION opens a player-facing warp menu (towns +
// overworld only, no interiors/dungeons/special maps, no disabled scenery, no
// tile-coordinate picker) — built on the notebook inspect system.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Warp Stone: MQ4 top reward + notebook-inspect warp menu (towns + overworld)',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // ── 1. The item is a rare notebook special item. ─────────────────────────
    assert.equal(g.run("!!ITEM_REGISTRY['Warp Stone']"), true, 'Warp Stone exists');
    assert.equal(g.run("ITEM_REGISTRY['Warp Stone'].questItem"), true, 'it is a quest item (Special Items list)');
    assert.equal(g.run("ITEM_REGISTRY['Warp Stone'].keyItem"), true, 'it is a key item (never equip/use/sell)');

    // ── 2. MQ4 thorough tier grants the Warp Stone (not Swift Bangle); the
    //       serviceable tier is unchanged (Elixir). ───────────────────────────
    function fileReport(clueFlags) {
      const g2 = createContext(); g2.press('Enter'); g2.press('Enter');
      g2.run(`['gallery_clue_satchel','gallery_clue_notebook','gallery_clue_visitor','gallery_clue_survey','gallery_clue_silt','gallery_clue_gauge','gallery_clue_reliefs','gallery_clue_stair'].forEach(function(f){ window[f]=false; });`);
      g2.run(clueFlags.map(f => `window['${f}']=true;`).join(''));
      g2.run('reservoir_report_filed=false; stats.items=[]; stats.gold=0; dialogue.open=false;');
      g2.run('reportBasinFindings();');
      for (let i = 0; i < 40; i++) g2.press('Enter');
      return g2;
    }
    const thorough = fileReport(['gallery_clue_satchel','gallery_clue_notebook','gallery_clue_visitor','gallery_clue_survey','gallery_clue_silt','gallery_clue_gauge']); // 6 clues
    assert.equal(thorough.run("stats.items.some(function(i){return i.name==='Warp Stone';})"), true, 'thorough (6 clues) grants the Warp Stone');
    assert.equal(thorough.run("stats.items.some(function(i){return i.name==='Swift Bangle';})"), false, 'no longer the Swift Bangle');
    assert.equal(thorough.run('stats.gold'), 250, 'thorough still pays 250 gold');
    const serviceable = fileReport(['gallery_clue_satchel','gallery_clue_notebook','gallery_clue_visitor']); // 3 clues
    assert.equal(serviceable.run("stats.items.some(function(i){return i.name==='Elixir';})"), true, 'the 3–5 tier still grants an Elixir');
    assert.equal(serviceable.run("stats.items.some(function(i){return i.name==='Warp Stone';})"), false, 'lower tiers do not grant the Warp Stone');

    // ── 3. Inspect action + curated destinations. ────────────────────────────
    assert.equal(g.run("getSpecialItemInspectAction('Warp Stone')"), 'warp', 'inspecting the Warp Stone triggers the warp action');
    assert.equal(g.run("getSpecialItemInspectAction('Letter from Netto')"), null, 'ordinary special items have no action (they read)');
    const cats = JSON.parse(g.run("JSON.stringify(Array.from(new Set(getPlayerWarpDestinations().map(function(d){return d.category;}))).sort())"));
    assert.deepEqual(cats, ['outdoor', 'town'], 'player warp offers only towns + overworld');
    assert.equal(g.run("getPlayerWarpDestinations().some(function(d){return d.disabled;})"), false, 'no disabled scenery chunks are offered');
    assert.ok(g.run("getPlayerWarpDestinations().length < getDebugWarpDestinations().length"), 'it is a curated subset of the debug catalog');

    // ── 4. Inspecting it in the notebook opens the player warp menu. ─────────
    g.run("stats.items=[]; grantItem('Warp Stone'); stats.items[0].questItem=true; stats.items[0].keyItem=true;");
    const notes = JSON.parse(g.run('JSON.stringify(getActiveQuestNotes())'));
    const row = notes.findIndex(n => n.title === 'Warp Stone');
    assert.ok(row >= 0, 'the Warp Stone shows in the SPECIAL ITEMS notebook section');
    g.run(`menu.open=true; menu.screen='notebook'; menu.notebookCursor=${row}; dialogue.open=false; warpMenu.open=false;`);
    g.press('Enter');
    assert.equal(g.run('menu.open'), false, 'the menu closes');
    assert.equal(g.run('dialogue.open'), false, 'no reader dialogue opens (it acts instead of reading)');
    assert.equal(g.run('warpMenu.open'), true, 'the warp menu opens');
    assert.equal(g.run('warpMenu.playerMode'), true, 'in player mode');
    assert.equal(g.run('warpMenu.mode'), 'list', 'starting at the destination list');

    // ── 5. Picking a destination warps DIRECTLY (no coordinate picker). ──────
    g.run("warpMenu.cursor=0;");
    g.press('Enter');
    assert.notEqual(g.run('warpMenu.mode'), 'coord', 'player mode never enters the tile-coordinate picker');
    assert.equal(g.run('warpMenu.open'), false, 'the warp fires and the menu closes');
  },
};
