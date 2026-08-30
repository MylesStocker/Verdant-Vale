'use strict';
// Lély's issued weapon is the +2 Bronze Knife, while every positive canonical
// price accepted by an equipment slot is doubled. Consumables and reagents keep
// their established prices, and zero-value equipment remains zero.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Bronze Knife starter weapon and doubled equippable-item prices',
  run() {
    const g = createContext();

    assert.deepEqual(
      JSON.parse(g.run("JSON.stringify(ITEM_REGISTRY['Bronze Knife'])")),
      { name: 'Bronze Knife', type: 'weapon', bonus: 2, price: 80 }
    );

    const expectedPositiveEquipmentPrices = {
      'Bronze Knife': 80,
      'Iron Sword': 160,
      'Leather Armor': 120,
      'Steel Sword': 300,
      'Iron Shield': 140,
      'Swift Bangle': 180,
      'Battle Axe': 500,
      'Dragon Blade': 700,
      'Shadow Cloak': 560,
      'Mithril Shield': 440,
      'Wraithband': 400,
      'Warden Blade': 440,
      'Void Shard': 360,
      'Resonant Targe': 360,
      'Fen Mask': 400,
      'Fen Cowl': 240,
      'Amethyst Bangle': 800,
    };
    const actualPositiveEquipmentPrices = JSON.parse(g.run(`JSON.stringify(
      Object.fromEntries(Object.values(ITEM_REGISTRY)
        .filter(function(item){return slotForType(item.type) && !item.questItem && item.price > 0;})
        .map(function(item){return [item.name,item.price];}))
    )`));
    assert.deepEqual(actualPositiveEquipmentPrices, expectedPositiveEquipmentPrices);

    assert.deepEqual(
      JSON.parse(g.run(`JSON.stringify(Object.fromEntries(
        ['Potion','Elixir','Reed Remedy','Bullet Time','Amethyst Dust','River Smelt','Canal Eel','Ember Root','Henbane Sprig','Jackbane Vial']
          .map(function(name){return [name,ITEM_REGISTRY[name].price];})
      ))`)),
      {
        Potion: 30, Elixir: 80, 'Reed Remedy': 50, 'Bullet Time': 150,
        'Amethyst Dust': 60, 'River Smelt': 4, 'Canal Eel': 12,
        'Ember Root': 20, 'Henbane Sprig': 8, 'Jackbane Vial': 8,
      }
    );
    assert.equal(g.run("ITEM_REGISTRY['Cat Armor'].price"), 0);
    assert.equal(g.run("ITEM_REGISTRY['Old Boot'].price"), 0);
    assert.equal(g.run("ITEM_REGISTRY['Bottle of Mushroom Wine'].price"), 12);
    assert.equal(g.run("ITEM_REGISTRY['Case of Mushroom Wine'].price"), 132);

    assert.equal(
      g.run("MERCHANT_STOCK.every(function(item){return item.price===ITEM_REGISTRY[item.name].price;}) && TRAVELLER_STOCK.every(function(item){return item.price===ITEM_REGISTRY[item.name].price;})"),
      true,
      'both shops inherit the doubled registry prices'
    );
    assert.deepEqual(
      JSON.parse(g.run(`JSON.stringify(
        Object.values(MAP_CATALOG).flatMap(function(map){return map.items;})
          .concat(OPENABLE_CHESTS.map(function(chest){return chest.item;}).filter(Boolean))
          .filter(function(item){
            return slotForType(item.type) && !item.questItem
              && item.price !== ITEM_REGISTRY[item.name].price;
          })
          .map(function(item){return item.name;})
      )`)),
      [],
      'placed and chest equipment metadata has no stale pre-doubling price'
    );

    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.equal(JSON.parse(g.run('JSON.stringify(validateGameData())')).errors, 0);
  },
};
