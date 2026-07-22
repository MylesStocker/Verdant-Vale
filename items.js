'use strict';

// ─── Item registry ────────────────────────────────────────────────────────────
// The single authoritative source for inventory-item properties. Every item
// that can enter stats.items or an equipment slot is defined here, keyed by
// item name. Runtime code must not hand-write item objects — use
// createItem(name) / grantItem(name) below. Placed world/chest records in
// data.js keep only their positional/mutable fields (x, y, picked, opened)
// plus the item name; loadGame() re-creates saved items from these
// definitions so stale saved metadata never survives a load.
//
// Inscriptions (type 'inscription') are lore text, never enter the inventory,
// and are intentionally not registered.
const ITEM_REGISTRY = {
  // Merchant (Calwick) stock — see SHOP_REGISTRY in shops.js for who sells what
  'Potion':        { name: 'Potion',        type: 'potion',    heals: 20, price: 30  },
  'Iron Sword':    { name: 'Iron Sword',    type: 'weapon',    bonus: 4,  price: 80  },
  'Leather Armor': { name: 'Leather Armor', type: 'armor',     bonus: 3,  price: 60  },
  'Steel Sword':   { name: 'Steel Sword',   type: 'weapon',    bonus: 7,  price: 150 },
  'Iron Shield':   { name: 'Iron Shield',   type: 'shield',    bonus: 3,  price: 70  },
  'Swiftstone':    { name: 'Swiftstone',    type: 'accessory', bonus: 2,  price: 90  },
  // Travelling Salesman stock
  'Elixir':         { name: 'Elixir',         type: 'potion',    heals: 50, price: 80  },
  'Battle Axe':     { name: 'Battle Axe',     type: 'weapon',    bonus: 9,  price: 250 },
  'Dragon Blade':   { name: 'Dragon Blade',   type: 'weapon',    bonus: 12, price: 350 },
  'Shadow Cloak':   { name: 'Shadow Cloak',   type: 'armor',     bonus: 8,  price: 280 },
  'Mithril Shield': { name: 'Mithril Shield', type: 'shield',    bonus: 6,  price: 220 },
  'Wraithband':     { name: 'Wraithband',     type: 'accessory', bonus: 4,  price: 200 },
  // Chest-only items (not sold in any shop)
  'Warden Blade': { name: 'Warden Blade', type: 'weapon',    bonus: 10, price: 220 },
  'Void Shard':   { name: 'Void Shard',   type: 'accessory', bonus:  5, price: 180 },
  'Iron Targe':   { name: 'Iron Targe',   type: 'shield',    bonus:  8, price: 180 },
  'Fen Mask':     { name: 'Fen Mask',     type: 'accessory', bonus:  5, price: 200 },
  'Cat Armor':    { name: 'Cat Armor',    type: 'armor',     bonus: 99, price:   0 },
  // Herbalist items
  'Reed Remedy':  { name: 'Reed Remedy',  type: 'potion', heals: 0, curesPoison: true, price: 50 },
  // Hidden meadow chest (MEADOW_CHEST, data.js) — the one curse-cure item.
  // Amethyst is the established anti-curse material (cf. Amethyst Bangle).
  'Amethyst Dust': { name: 'Amethyst Dust', type: 'potion', heals: 0, curesCursed: true, price: 60 },
  // Tavern items
  'Mushroom Wine': { name: 'Mushroom Wine', type: 'potion', heals: 5, questItem: true, price: 8 },
  // Fishing — Drenwick Waterfront
  'River Smelt':   { name: 'River Smelt',   type: 'potion', heals:  8, price:  4 },
  'Canal Eel':     { name: 'Canal Eel',     type: 'potion', heals: 20, price: 12 },
  'Old Boot':      { name: 'Old Boot',      type: 'accessory', bonus: 0, price: 0 },
  'Sealed Letter': { name: 'Sealed Letter', type: 'accessory', bonus: 0, price: 0, questItem: true },
  // Mirethyst's Vault items
  'Mirestone Blade': { name: 'Mirestone Blade', type: 'weapon', bonus: 8, price: 200 },
  'Fen Cowl':        { name: 'Fen Cowl',        type: 'armor',  bonus: 4, price: 120 },
  'Ember Root':      { name: 'Ember Root',       type: 'potion', heals: 15, causesMuddied: true, price: 20 },
  // Fen Brewery — Gorrit Wend sells freshly made mushroom wine directly (distinct
  // from the tavern's by-the-cup 'Mushroom Wine'); bought as a gift, not a heal item.
  'Bottle of Mushroom Wine': { name: 'Bottle of Mushroom Wine', type: 'accessory', bonus: 0, price: 12,  questItem: true },
  'Case of Mushroom Wine':   { name: 'Case of Mushroom Wine',   type: 'accessory', bonus: 0, price: 132, questItem: true },
  // Fenna's reward for delivering a case rather than a bottle — real equipment,
  // not a flavor-only key item, so it isn't questItem-flagged.
  'Amethyst Bangle': { name: 'Amethyst Bangle', type: 'accessory', bonus: 3, price: 400, preventsCursed: true },
  // One-off quest/event key items — questItem + keyItem so they live in the
  // Special Items notebook, never equippable, usable, or sold. (keyItem is
  // never inferred from questItem — the mushroom wines above stay ordinary.)
  'Thank-You Note':    { name: 'Thank-You Note',    type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  'Tweezers':          { name: 'Tweezers',          type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  'Schilling':         { name: 'Schilling',         type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  'Cat-Shaped Key':    { name: 'Cat-Shaped Key',    type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  'Letter from Netto': { name: 'Letter from Netto', type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  'Dispatch Letter':   { name: 'Dispatch Letter',   type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
};

// Returns a fresh instance of the named item. Never hands out (or mutates)
// the registry definition itself.
function createItem(name) {
  const def = ITEM_REGISTRY[name];
  if (!def) throw new Error('createItem: unknown item "' + name + '" — add it to ITEM_REGISTRY (items.js)');
  return { ...def };
}

// Creates the named item, adds it to the player's inventory, and returns it.
function grantItem(name) {
  const item = createItem(name);
  stats.items.push(item);
  return item;
}

window.ITEM_REGISTRY = ITEM_REGISTRY;
window.createItem    = createItem;
window.grantItem     = grantItem;
