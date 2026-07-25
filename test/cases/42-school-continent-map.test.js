'use strict';
// Covers: the Calwick school wall map (calwick_school_map SIMPLE_NPC) and the
// full-screen continent-map inspection panel it opens (drawContinentMapPanel,
// render-ui.js). The panel graphic was rewritten as a professional Imperial
// survey; this proves the interaction, close controls, rendering and
// no-side-effects contract are all intact after that rewrite.
//
//   1. Interacting with the school wall map through the REAL input path
//      (a Space keypress adjacent to it) opens the continent-map panel.
//   2. Space and Escape each close it (and it re-opens each time).
//   3. Exactly ONE school-map SIMPLE_NPC trigger exists (no accidental
//      duplicate), and the map cell is solid so it is a reachable wall object.
//   4. A real render frame with the panel open — and a real frame of the
//      school interior with the wall-map sprite — both run without throwing.
//   5. Viewing the map changes no save/progression state (flags, day,
//      position, MainQuest all unchanged).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'School continent map: interaction opens/closes the panel, renders, and changes no state',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── Reachable, non-duplicate school trigger ──────────────────────────────
    const nTriggers = g.run(
      'SIMPLE_NPCS.filter(function(n){try{return n.map===\"school\"}catch(e){return false}})' +
      '.filter(function(n){return typeof n.action===\"function\" && ' +
      '/continentMap\\.open\\s*=\\s*true/.test(n.action.toString())}).length'
    );
    assert.equal(nTriggers, 1, 'exactly one school SIMPLE_NPC should open the continent map');

    const mapNpc = g.run('SIMPLE_NPCS.find(function(n){return n.id===\"calwick_school_map\"})');
    assert.ok(mapNpc, 'calwick_school_map SIMPLE_NPC should exist');
    assert.equal(mapNpc.solid, true, 'the wall map should be a solid, reachable wall object');

    // ── Stand in the Calwick school, walked up against the wall map ──────────
    g.run(
      'inDungeon=false; inSluice=false; inTown=true; currentTownId="calwick"; ' +
      'townBuilding="school"; activeMap=SCHOOL_MAP; menu.open=false; shop.open=false; ' +
      'dialogue.open=false; choice.open=false; continentMap.open=false; ' +
      'player.x=2.5*TILE+22; player.y=2.5*TILE; player.facing="left";'
    );
    assert.equal(g.run('!canWalk(2.5*TILE, 2.5*TILE)'), true, 'map cell must be solid');

    // ── 5. Snapshot save/progression state BEFORE viewing ────────────────────
    const before = g.run(
      'JSON.stringify({flags: QUEST_FLAG_SCHEMA.map(function(k){return window[k]}), ' +
      'day: day, px: player.x, py: player.y, mq: MainQuest})'
    );

    // ── 1. Real input path opens the panel ───────────────────────────────────
    g.press(' ');
    assert.equal(g.run('continentMap.open'), true, 'Space adjacent to the map opens the panel');

    // ── 4. Open panel renders without throwing ───────────────────────────────
    assert.doesNotThrow(function () { g.renderFrame(); }, 'open continent-map panel should render');

    // ── 2. Escape closes; re-open; Space closes ──────────────────────────────
    g.press('Escape');
    assert.equal(g.run('continentMap.open'), false, 'Escape closes the panel');
    g.press(' ');
    assert.equal(g.run('continentMap.open'), true, 'Space re-opens the panel');
    g.press(' ');
    assert.equal(g.run('continentMap.open'), false, 'Space closes the panel');

    // ── 4b. School interior (wall-map sprite) renders without throwing ───────
    assert.doesNotThrow(function () { g.renderFrame(); }, 'school interior with wall-map sprite should render');

    // ── 5. No save/progression state changed by viewing ──────────────────────
    const after = g.run(
      'JSON.stringify({flags: QUEST_FLAG_SCHEMA.map(function(k){return window[k]}), ' +
      'day: day, px: player.x, py: player.y, mq: MainQuest})'
    );
    assert.equal(after, before, 'viewing the continent map must not change any save/progression state');
  },
};
