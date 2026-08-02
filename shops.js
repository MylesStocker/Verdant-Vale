'use strict';

// ─── Shop stock ───────────────────────────────────────────────────────────────
// Item properties live in ITEM_REGISTRY (items.js, loaded before this file);
// these lists only choose what each shop carries. Stock entries are fresh
// createItem() instances so display code can read prices/stats directly.
const MERCHANT_STOCK = [
  'Potion', 'Iron Sword', 'Leather Armor', 'Steel Sword', 'Iron Shield', 'Swift Bangle',
].map(createItem);

const TRAVELLER_STOCK = [
  'Elixir', 'Battle Axe', 'Dragon Blade', 'Shadow Cloak', 'Mithril Shield', 'Wraithband',
].map(createItem);

// ─── Shop registry ────────────────────────────────────────────────────────────
// Additive/reference-only: gameplay code has not yet been migrated to use this.
const SHOP_REGISTRY = {
  merchant:  { id: 'merchant',  label: 'Merchant',             stock: MERCHANT_STOCK  },
  traveller: { id: 'traveller', label: 'Travelling Salesman',  stock: TRAVELLER_STOCK },
};

// ─── Expose to global scope ───────────────────────────────────────────────────
window.MERCHANT_STOCK  = MERCHANT_STOCK;
window.TRAVELLER_STOCK = TRAVELLER_STOCK;
window.SHOP_REGISTRY   = SHOP_REGISTRY;
