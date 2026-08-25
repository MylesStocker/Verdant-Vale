'use strict';
// The East Causeway is the classic RPG "broken bridge": the one road east runs out
// where the drought heaved its middle span into the lake. It now has an examinable
// at the road's end that explains the washout and lampshades the trope, and two
// NPCs (Oswin in Calwick, Veran in Drenwick) mention it in dialogue.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Broken causeway: examinable explanation + lampshade, and NPC mentions',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // ── The examinable sits at the road's end (col 10 row 8), on walkable stone
    //    with water immediately east. ─────────────────────────────────────────
    assert.equal(g.run("(MAP_FEATURES['EAST_CAUSEWAY_MAP']||[]).filter(function(f){return f.type==='inspect';}).length"), 1,
      'exactly one examinable on the causeway');
    const M = "MAP_CATALOG['EAST_CAUSEWAY_MAP'].map";
    assert.equal(g.run(`isTileWalkable(${M}[8][10])`), true, 'the road ends on walkable stone (col 10)');
    assert.equal(g.run(`isTileWalkable(${M}[8][11])`), false, 'open water blocks the way east (col 11)');

    // ── Standing at the road's end and examining explains the washout, and the
    //    last page lampshades the broken-bridge trope. ─────────────────────────
    g.run("resetLocationState(); placeAtLocation('EAST_CAUSEWAY_MAP',10.5*TILE,8.5*TILE); __reconcileCanonicalForTest&&__reconcileCanonicalForTest(); dialogue.open=false; choice.open=false;");
    assert.equal(g.run("(currentMapFeatures()||[]).some(function(f){return f.id==='east_causeway_break';})"), true,
      'the causeway examinable is live on this map');
    g.run('handleInteract();');
    assert.equal(g.run('dialogue.open'), true, 'examining the causeway opens a description');
    const pages = g.run('JSON.stringify(dialogue.pages)');
    assert.match(pages, /causeway|span|road/i, 'it explains the broken causeway');
    assert.match(pages, /drought|heaved|lake/i, 'it gives the in-world reason (drought heaved the span into the lake)');
    // The lampshade: the one road out, conveniently impassable, "always" fixed later.
    assert.match(pages, /always going to arrive|way over|there always turns out to be one/i,
      'the last page lampshades the classic broken-bridge trope');

    // ── Two characters mention it. ───────────────────────────────────────────
    g.run('MainQuest=2;');
    assert.match(g.run("JSON.stringify(SIMPLE_NPCS.find(function(n){return n.id==='oswin';}).dialogue)"),
      /causeway/i, 'Oswin mentions the causeway');
    g.run('day=1;'); // Veran is home (not the quay-day branch) on this day
    assert.match(g.run("JSON.stringify(SIMPLE_NPCS.find(function(n){return n.id==='veran_retired';}).dialogue)"),
      /causeway/i, 'Veran mentions the causeway');

    // ── Validation stays clean. ──────────────────────────────────────────────
    assert.equal(JSON.parse(g.run('JSON.stringify(validateGameData())')).errors, 0, 'validation clean');
  },
};
