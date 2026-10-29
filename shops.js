'use strict';

// ─── Shop stock ───────────────────────────────────────────────────────────────
// Item properties live in ITEM_REGISTRY (items.js, loaded before this file);
// these lists choose what each shop carries. Stock entries are fresh
// createItem() instances so display code can read prices/stats directly. The
// travelling salesman applies a shop-only premium to equipment; canonical item
// values remain the authority for inventory, rewards, pickups, and resale.
const MERCHANT_STOCK = [
  'Potion', 'Iron Sword', 'Leather Armor', 'Steel Sword', 'Iron Shield', 'Swift Bangle', 'Throwing Knife',
].map(createItem);

const TRAVELLER_EQUIPMENT_TYPES = ['weapon', 'armor', 'shield', 'accessory'];
function createTravellerStockItem(name) {
  const item = createItem(name);
  if (TRAVELLER_EQUIPMENT_TYPES.includes(item.type)) {
    item.price *= name === 'Dragon Blade' ? 3 : 2;
  }
  return item;
}

const TRAVELLER_STOCK = [
  'Elixir', 'Battle Axe', 'Dragon Blade', 'Shadow Cloak', 'Mithril Shield', 'Wraithband', 'Fen Mask', 'Sapper Charge',
].map(createTravellerStockItem);

// Mornay shops reuse registered goods and the ordinary purchase/sale controller.
// The fishing rod is deliberately absent: its registered identity is a quest item.
const MORNAY_SHOPS = Object.freeze({
  fleck_tavern:Object.freeze({id:'mornay_fleck_tavern',label:'THE CROOKED OAR',stock:['Smoked Lake Fish'].map(createItem)}),
  fleck_smoker:Object.freeze({id:'mornay_fleck_smoker',label:'NERYS SMOKEHOUSE',stock:['Smoked Lake Fish','Bait'].map(createItem)}),
  provisioner: Object.freeze({id:'mornay_provisioner',label:'KELM PROVISIONS',stock:['Potion','Bait'].map(createItem)}),
  apothecary: Object.freeze({id:'mornay_apothecary',label:'STERN APOTHECARY',stock:['Potion','Elixir','Reed Remedy','Amethyst Dust'].map(createItem)}),
  workgear: Object.freeze({id:'mornay_workgear',label:'SORN WORK GEAR',stock:['Bronze Knife','Leather Armor','Iron Shield','Iron Sword','Fen Cowl'].map(createItem)}),
  chandler: Object.freeze({id:'mornay_chandler',label:'VENN CHANDLERY',stock:['Bait','Throwing Knife','Leather Armor','Swift Bangle'].map(createItem)})
});

// ─── Shop registry ────────────────────────────────────────────────────────────
// Additive/reference-only: gameplay code has not yet been migrated to use this.
const SHOP_REGISTRY = {
  reedbank_provisions:{id:'reedbank_provisions',label:'REEDBANK PROVISIONS',stock:['Potion','Bait','Reed Remedy'].map(createItem)},
  ...Object.fromEntries(Object.values(MORNAY_SHOPS).map(s => [s.id,s])),
  merchant:  { id: 'merchant',  label: 'Merchant',             stock: MERCHANT_STOCK  },
  traveller: { id: 'traveller', label: 'Travelling Salesman',  stock: TRAVELLER_STOCK },
};

// ─── Expose to global scope ───────────────────────────────────────────────────
window.MERCHANT_STOCK  = MERCHANT_STOCK;
window.TRAVELLER_STOCK = TRAVELLER_STOCK;
window.SHOP_REGISTRY   = SHOP_REGISTRY;
