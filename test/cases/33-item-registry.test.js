'use strict';
// Covers: ITEM_REGISTRY as the single authoritative source of item
// properties — createItem()/grantItem() semantics, canonical metadata on
// every migrated grant path (shop purchase, quest reward, chest, fishing,
// enemy drop), save/load rehydration from the registry, unknown-legacy-item
// tolerance, key-item retention, and mushroom-wine non-key behavior.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'item registry: createItem()/grantItem() are the single source of item properties',
  run() {
    // ── createItem(): independence, registry immutability, unknown names ────
    {
      const g = createContext();
      g.press('Enter');
      g.press('Enter'); // close intro dialogue

      const independent = g.run(`
        const a = createItem('Potion');
        const b = createItem('Potion');
        a !== b && a !== ITEM_REGISTRY['Potion'] && b !== ITEM_REGISTRY['Potion']
          && JSON.stringify(a) === JSON.stringify(b);
      `);
      assert.equal(independent, true, 'two createItem() calls must return independent, equal-valued clones');

      const registryUntouched = g.run(`
        const c = createItem('Potion');
        c.price = 9999;
        c.heals = -5;
        ITEM_REGISTRY['Potion'].price === 30 && ITEM_REGISTRY['Potion'].heals === 20;
      `);
      assert.equal(registryUntouched, true, 'mutating an instance must not change the registry');

      const threw = g.run(`
        let msg = null;
        try { createItem('Definitely Not An Item'); } catch (e) { msg = e.message; }
        msg;
      `);
      assert.ok(threw && threw.includes('Definitely Not An Item'), 'createItem() must throw a clear error for unknown items');

      // grantItem() pushes exactly the instance it returns.
      const granted = g.run(`
        const before = stats.items.length;
        const it = grantItem('Elixir');
        stats.items.length === before + 1 && stats.items[stats.items.length - 1] === it
          && it !== ITEM_REGISTRY['Elixir'] && it.heals === 50 && it.price === 80;
      `);
      assert.equal(granted, true, 'grantItem() must create, push, and return the same fresh instance');
    }

    // ── Shop purchase via real keypress delivers canonical metadata ─────────
    {
      const g = createContext();
      g.press('Enter');
      g.press('Enter');
      g.run(`
        stats.gold = 500;
        shop.open = true; shop.screen = 'buy'; shop.stock = MERCHANT_STOCK; shop.cursor = 0;
      `);
      g.press('Enter'); // buy MERCHANT_STOCK[0] (Potion)
      const bought = JSON.parse(g.run(`
        const it = stats.items[stats.items.length - 1];
        JSON.stringify({ it, canonical: it !== ITEM_REGISTRY['Potion'] && it !== MERCHANT_STOCK[0] });
      `));
      assert.equal(bought.canonical, true, 'purchased item must be a fresh instance, not the registry/stock object');
      assert.deepEqual(bought.it, { name: 'Potion', type: 'potion', heals: 20, price: 30 },
        'purchased item must carry complete canonical metadata');
      assert.equal(g.run('stats.gold'), 470, 'purchase price deducted');

      // Shop stock itself is registry-derived (no duplicate definitions).
      const stockCanonical = g.run(`
        MERCHANT_STOCK.every(s => {
          const def = ITEM_REGISTRY[s.name];
          return def && s !== def && Object.keys(def).every(k => s[k] === def[k]);
        }) && TRAVELLER_STOCK.every(s => {
          const def = ITEM_REGISTRY[s.name];
          return def && s !== def && Object.keys(def).every(k => s[k] === def[k]);
        });
      `);
      assert.equal(stockCanonical, true, 'every shop stock entry must mirror its registry definition');
    }

    // ── Representative quest reward: Pip's Cat-Shaped Key ───────────────────
    {
      const g = createContext();
      g.press('Enter');
      g.press('Enter');
      g.run(`
        grantItem('Schilling');
        day = 2;
        SIMPLE_NPCS.find(n => n.id === 'pip').action();
        dialogue.callbacks[0]();
      `);
      const key = JSON.parse(g.run("JSON.stringify(stats.items.find(i => i.name === 'Cat-Shaped Key'))"));
      assert.deepEqual(key,
        { name: 'Cat-Shaped Key', type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
        'quest reward must carry complete canonical metadata (incl. keyItem)');
    }

    // ── Representative chest: dungeon floor 1 chest (Elixir) ────────────────
    {
      const g = createContext();
      g.press('Enter');
      g.press('Enter');
      g.run(`
        inDungeon = true; dungeonFloor = 1; activeMap = DUNGEON_MAP;
        player.x = DUNGEON_CHEST.x; player.y = DUNGEON_CHEST.y;
        interactDungeonFloor1();
      `);
      assert.equal(g.run('DUNGEON_CHEST.opened'), true, 'chest should open');
      const loot = JSON.parse(g.run('JSON.stringify(stats.items[stats.items.length - 1])'));
      assert.deepEqual(loot, { name: 'Steel Sword', type: 'weapon', bonus: 7, price: 150 },
        'chest loot must carry complete canonical metadata');
      assert.equal(g.run('stats.items[stats.items.length - 1] !== DUNGEON_CHEST.item'), true,
        'chest loot must be a fresh instance, not the chest record\'s item field');
    }

    // ── Representative fishing reward (Drenwick waterfront) ─────────────────
    {
      const g = createContext();
      g.press('Enter');
      g.press('Enter');
      g.run(`
        inTown = true; currentTownId = 'drenwick'; activeMap = DRENWICK_WATERFRONT_MAP;
        player.x = DRENWICK_FISHING_SPOT.x; player.y = DRENWICK_FISHING_SPOT.y;
        interactTownOutdoor();
      `);
      assert.equal(g.run('choice.open'), true, 'fishing choice should open');
      // Pin the catch roll to the River Smelt band (0.40 <= r < 0.65), then restore.
      g.run(`
        const realRandom = Math.random;
        Math.random = () => 0.5;
        try { choice.callbacks[0](); } finally { Math.random = realRandom; }
      `);
      const fish = JSON.parse(g.run("JSON.stringify(stats.items.find(i => i.name === 'River Smelt'))"));
      assert.deepEqual(fish, { name: 'River Smelt', type: 'potion', heals: 8, price: 4 },
        'fishing reward must carry complete canonical metadata');
    }

    // ── Representative enemy drop: post-victory Potion ───────────────────────
    {
      const g = createContext();
      g.press('Enter');
      g.press('Enter');
      g.run(`
        startCombat();
        combat.enemy = { name: 'Test Dummy', hp: 1, maxHp: 1, atk: 1, def: 0, spd: 0, xp: 1, goldMin: 0, goldMax: 0 };
        combat.cursor = 0;
      `);
      g.frames(10); // let flashTimer run out so input is accepted
      // Pin Math.random to 0 for the killing blow so droppedPotion (< 0.12) is
      // guaranteed; restore immediately after the action resolves.
      g.run('window.__realRandom = Math.random; Math.random = () => 0;');
      g.press('Enter'); // attack — lethal, victory messages built here
      g.run('Math.random = window.__realRandom; delete window.__realRandom;');
      const drop = JSON.parse(g.run("JSON.stringify(stats.items.find(i => i.name === 'Potion') || null)"));
      assert.deepEqual(drop, { name: 'Potion', type: 'potion', heals: 20, price: 30 },
        'enemy drop must carry complete canonical metadata');
    }

    // ── Save/load: items + equipment rehydrated from the registry ───────────
    {
      const g = createContext();
      g.press('Enter');
      g.press('Enter');
      g.run('saveGame()');
      // Simulate a stale save: outdated numbers, a missing keyItem flag, an
      // extra per-instance field, an unknown legacy item, and stale equipped gear.
      g.run(`
        (function() {
          const raw = JSON.parse(localStorage.getItem('verdantVale_save'));
          raw.stats.items.push(
            { name: 'Potion', type: 'potion', heals: 1, price: 999, engraving: 'to Pa' },
            { name: 'Schilling', type: 'accessory', bonus: 0, price: 0 },
            { name: 'Mushroom Wine', type: 'potion', heals: 5, questItem: true, price: 8 },
            { name: 'Old Charm', type: 'accessory', bonus: 1, price: 5 }
          );
          raw.stats.weapon = { name: 'Iron Sword', type: 'weapon', bonus: 99, price: 1 };
          localStorage.setItem('verdantVale_save', JSON.stringify(raw));
        })();
      `);
      assert.equal(g.run('loadGame()'), true, 'load must succeed despite the unknown legacy item');

      const potion = JSON.parse(g.run("JSON.stringify(stats.items.find(i => i.name === 'Potion'))"));
      assert.equal(potion.heals, 20, 'registry heals must override stale saved value');
      assert.equal(potion.price, 30, 'registry price must override stale saved value');
      assert.equal(potion.engraving, 'to Pa', 'unknown per-instance fields must be preserved');

      const wpn = JSON.parse(g.run('JSON.stringify(stats.weapon)'));
      assert.deepEqual(wpn, { name: 'Iron Sword', type: 'weapon', bonus: 4, price: 80 },
        'equipped gear must be rehydrated from the registry');

      const sch = JSON.parse(g.run("JSON.stringify(stats.items.find(i => i.name === 'Schilling'))"));
      assert.equal(sch.questItem, true, 'protected quest item regains questItem on load');
      assert.equal(sch.keyItem, true, 'protected quest item regains keyItem on load');

      const charm = JSON.parse(g.run("JSON.stringify(stats.items.find(i => i.name === 'Old Charm'))"));
      assert.deepEqual(charm, { name: 'Old Charm', type: 'accessory', bonus: 1, price: 5 },
        'unknown legacy items must survive the load unchanged');

      // Mushroom wine: still a normal, non-key inventory item after loading.
      const wine = JSON.parse(g.run("JSON.stringify(stats.items.find(i => i.name === 'Mushroom Wine'))"));
      assert.equal(wine.questItem, true, 'Mushroom Wine keeps questItem (Special Items listing)');
      assert.ok(!wine.keyItem, 'Mushroom Wine must NOT gain keyItem');
      assert.equal(g.run("inventoryItems().some(i => i.name === 'Mushroom Wine')"), true,
        'Mushroom Wine stays in ordinary inventory (usable/sellable)');
      assert.equal(g.run("inventoryItems().some(i => i.name === 'Schilling')"), false,
        'Schilling stays out of ordinary inventory');
    }

    // ── All protected key items are registered with both flags ──────────────
    {
      const g = createContext();
      const flags = g.run(`
        ['Schilling', 'Cat-Shaped Key', 'Thank-You Note', 'Letter from Netto', 'Dispatch Letter', 'Tweezers']
          .every(n => ITEM_REGISTRY[n] && ITEM_REGISTRY[n].questItem === true && ITEM_REGISTRY[n].keyItem === true);
      `);
      assert.equal(flags, true, 'all six protected items must carry questItem + keyItem in the registry');
      const wines = g.run(`
        ['Mushroom Wine', 'Bottle of Mushroom Wine', 'Case of Mushroom Wine']
          .every(n => ITEM_REGISTRY[n].questItem === true && !ITEM_REGISTRY[n].keyItem);
      `);
      assert.equal(wines, true, 'mushroom wines must stay questItem-only (no keyItem)');
    }
  },
};
