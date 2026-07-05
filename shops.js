'use strict';

// ─── Merchant stock ───────────────────────────────────────────────────────────
const MERCHANT_STOCK = [
  { name: 'Potion',        type: 'potion',    heals: 20, price: 30  },
  { name: 'Iron Sword',    type: 'weapon',    bonus: 4,  price: 80  },
  { name: 'Leather Armor', type: 'armor',     bonus: 3,  price: 60  },
  { name: 'Steel Sword',   type: 'weapon',    bonus: 7,  price: 150 },
  { name: 'Iron Shield',   type: 'shield',    bonus: 3,  price: 70  },
  { name: 'Swiftstone',    type: 'accessory', bonus: 2,  price: 90  },
];

// ─── Travelling Salesman stock ────────────────────────────────────────────────
const TRAVELLER_STOCK = [
  { name: 'Elixir',         type: 'potion',    heals: 50, price: 80  },
  { name: 'Battle Axe',     type: 'weapon',    bonus: 9,  price: 250 },
  { name: 'Dragon Blade',   type: 'weapon',    bonus: 12, price: 350 },
  { name: 'Shadow Cloak',   type: 'armor',     bonus: 8,  price: 280 },
  { name: 'Mithril Shield', type: 'shield',    bonus: 6,  price: 220 },
  { name: 'Wraithband',     type: 'accessory', bonus: 4,  price: 200 },
];

// ─── Populate ITEM_REGISTRY with shop items ───────────────────────────────────
// items.js (and its ITEM_REGISTRY) loads before shops.js; extend it here.
for (const item of [...MERCHANT_STOCK, ...TRAVELLER_STOCK]) {
  if (!ITEM_REGISTRY[item.name]) ITEM_REGISTRY[item.name] = { name: item.name, type: item.type, price: item.price, ...(item.heals !== undefined ? { heals: item.heals } : { bonus: item.bonus }) };
}

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
