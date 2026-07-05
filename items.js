'use strict';

// ─── Items ────────────────────────────────────────────────────────────────────
// Placeholder for static item/equipment catalog definitions.
//
// Audit result: all item definitions in data.js are embedded inside stateful
// collections (picked: false, opened: false) and cannot be separated without
// breaking mutable game state. No standalone item catalog arrays exist to move.
//
// Shop inventories (MERCHANT_STOCK, TRAVELLER_STOCK) live in npcs.js as they
// are tightly coupled to NPC placement data.
//
// Add standalone item catalog constants here as they are introduced.

// ─── Item registry ────────────────────────────────────────────────────────────
// Additive/reference-only: gameplay code has not yet been migrated to use this.
// Keyed by item name. Chest-only items seeded here (data.js loads before items.js).
// Shop items are added in shops.js after MERCHANT_STOCK/TRAVELLER_STOCK are defined.
const ITEM_REGISTRY = {
  // Chest-only items (not sold in any shop)
  'Warden Blade': { name: 'Warden Blade', type: 'weapon',    bonus: 10, price: 220 },
  'Void Shard':   { name: 'Void Shard',   type: 'accessory', bonus:  5, price: 180 },
  'Iron Targe':   { name: 'Iron Targe',   type: 'shield',    bonus:  8, price: 180 },
  'Fen Mask':     { name: 'Fen Mask',     type: 'accessory', bonus:  5, price: 200 },
  'Cat Armor':    { name: 'Cat Armor',    type: 'armor',     bonus: 99, price:   0 },
  // Herbalist items
  'Reed Remedy':  { name: 'Reed Remedy',  type: 'potion', heals: 0, curesPoison: true, price: 50 },
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
};

window.ITEM_REGISTRY = ITEM_REGISTRY;
