'use strict';
// The best shield in the game was "Iron Targe" (def 8), sitting in a floor-1
// hidden alcove chest — far too easy to get. It is renamed "Resonant Targe" and
// moved to the very bottom of the South Ruins (floor 8, The Drowned Chamber) as an
// examine pickup with its own flavour text. The floor-1 alcove chest now holds a
// modest Amethyst Dust instead.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Resonant Targe: renamed best shield, moved to the bottom level, flavourful pickup',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // ── 1. Renamed in the item registry; the old name is gone. ───────────────
    assert.equal(g.run("!!ITEM_REGISTRY['Resonant Targe']"), true, 'Resonant Targe exists');
    assert.equal(g.run("!!ITEM_REGISTRY['Iron Targe']"), false, 'Iron Targe no longer exists');
    assert.equal(g.run("ITEM_REGISTRY['Resonant Targe'].type"), 'shield');
    assert.equal(g.run("ITEM_REGISTRY['Resonant Targe'].bonus"), 8);

    // Still the single best shield in the game.
    const bestShieldBonus = g.run("Math.max.apply(null, Object.values(ITEM_REGISTRY).filter(function(i){return i.type==='shield';}).map(function(i){return i.bonus;}))");
    assert.equal(bestShieldBonus, 8, 'no shield beats it');
    assert.equal(
      g.run("Object.values(ITEM_REGISTRY).filter(function(i){return i.type==='shield'&&i.bonus===8;}).length"),
      1, 'it is the unique best shield');

    // ── 2. The floor-1 alcove chest no longer hands out the best shield. ─────
    assert.equal(g.run('DUNGEON_ALCOVE_CHEST.item.name'), 'Amethyst Dust', 'the easy floor-1 chest now holds Amethyst Dust');
    assert.equal(g.run('DUNGEON_ALCOVE_CHEST.item.type'), 'potion', 'no shield in the floor-1 chest');

    // ── 3. It now lives on floor 8 (the bottom) as a registered examine pickup. ─
    assert.equal(g.run("!!PICKUP_REGISTRY['pickup_dungeon8_resonant_targe']"), true, 'targe pickup registered');
    assert.equal(
      g.run("MAP_CATALOG['DUNGEON8_MAP'].items.some(function(i){return i.id==='pickup_dungeon8_resonant_targe'&&i.examine===true;})"),
      true, 'it is an examine pickup in the Drowned Chamber');
    // Nowhere shallower: no other map places a Resonant Targe.
    assert.equal(
      g.run("Object.keys(MAP_CATALOG).filter(function(k){var it=MAP_CATALOG[k].items||[];return it.some(function(i){return i.name==='Resonant Targe';});}).join(',')"),
      'DUNGEON8_MAP', 'the only placement is the bottom floor');

    // ── 4. Examining it grants the shield, with special flavour text. ────────
    g.run("resetLocationState(); activeMap=DUNGEON8_MAP; inDungeon=true; dungeonFloor=8; player.x=7.5*TILE; player.y=13.5*TILE; stats.items=[]; stats.shield=null; dialogue.open=false;");
    assert.equal(g.run('isTileWalkable(DUNGEON8_MAP[13][7])'), true, 'it sits on walkable floor at the dead end');
    assert.equal(g.run('tryExamineWorldItem()'), true, 'examine takes it');
    assert.equal(g.run("stats.items.filter(function(i){return i.name==='Resonant Targe';}).length"), 1, 'exactly one Resonant Targe granted');
    assert.match(g.run('JSON.stringify(dialogue.pages)'), /hum|spiral|watch/, 'the pickup shows its special flavour text');
    // And it equips as the best shield.
    g.run("equipItem(stats.items.find(function(i){return i.name==='Resonant Targe';}));");
    assert.equal(g.run('stats.shield && stats.shield.bonus'), 8, 'equips as an 8-def shield');

    // Sprung state persists on the global pickup registry.
    assert.equal(g.run("PICKUP_REGISTRY['pickup_dungeon8_resonant_targe'].picked"), true, 'the pickup is consumed');
    assert.equal(g.run('tryExamineWorldItem()'), false, 'it does not re-grant');
  },
};
