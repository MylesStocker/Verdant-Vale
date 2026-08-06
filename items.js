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
  'Swift Bangle':    { name: 'Swift Bangle',    type: 'accessory', bonus: 2,  price: 90  },
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
  // Combat-only consumable buff: on use in battle, raises the player's evade
  // rate to 90% for the next 3 turns (see combat.js's item branch + the evade
  // roll on every incoming enemy hit). type 'buff' has no equip slot, so like a
  // reagent it does nothing outside combat; battleOnly makes that explicit.
  'Bullet Time':  { name: 'Bullet Time',  type: 'buff', evadeRate: 0.90, evadeTurns: 3, battleOnly: true, price: 150 },
  // Hidden meadow chest (MEADOW_CHEST, data.js) — the one curse-cure item.
  // Amethyst is the established anti-curse material (cf. Amethyst Bangle).
  'Amethyst Dust': { name: 'Amethyst Dust', type: 'potion', heals: 0, curesCursed: true, price: 60 },
  // Tavern items
  'Mushroom Wine': { name: 'Mushroom Wine', type: 'potion', heals: 5, questItem: true, price: 8 },
  // Fishing — Drenwick Waterfront. A rod (type 'rod') is required to fish at
  // all; its fishingPower shifts the odds toward useful catches (see
  // bestFishingPower()/rollFishingOutcome() below and interactions.js). Rods are
  // key items — they live in the Special Items notebook and can't be sold, so
  // you never lose your only rod. Old Fishing Rod is the worst (power 1); higher
  // fishingPower rods can be added later without touching the fishing logic.
  'Old Fishing Rod': { name: 'Old Fishing Rod', type: 'rod', fishingPower: 1, price: 0, questItem: true, keyItem: true },
  'River Smelt':   { name: 'River Smelt',   type: 'potion', heals:  8, price:  4 },
  'Canal Eel':     { name: 'Canal Eel',     type: 'potion', heals: 20, price: 12 },
  'Old Boot':      { name: 'Old Boot',      type: 'accessory', bonus: 0, price: 0 },
  // Pure flavor/quest artifact (a voided transit letter fished up) — keyItem so
  // it lives in the Special Items notebook only, never the equip/use list.
  'Sealed Letter': { name: 'Sealed Letter', type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  // Mirethyst's Vault items (the Mirestone Blade chest was removed — the
  // vault's mid-hall is reserved for a future secret crypt entrance)
  'Fen Cowl':        { name: 'Fen Cowl',        type: 'armor',  bonus: 4, price: 120 },
  'Ember Root':      { name: 'Ember Root',       type: 'potion', heals: 15, causesMuddied: true, price: 20 },
  // Sex-specific fen reagents (folk toad-banes sold cheap in Drenwick). Used in
  // combat: a matched reagent instantly drops the target (see combat.js's item
  // branch); the wrong one, or one used on anything but a sexed enemy, is wasted
  // and costs the turn. Henbane kills the hen (female); Jackbane the jack (male).
  'Henbane Sprig':   { name: 'Henbane Sprig',    type: 'reagent', sexBane: 'female', price: 8 },
  'Jackbane Vial':   { name: 'Jackbane Vial',    type: 'reagent', sexBane: 'male',   price: 8 },
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
  'Schilling':         { name: 'Schilling',         type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  'Cat-Shaped Key':    { name: 'Cat-Shaped Key',    type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  'Letter from Netto': { name: 'Letter from Netto', type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  'Dispatch Letter':   { name: 'Dispatch Letter',   type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },
  "Doctor's Letter":   { name: "Doctor's Letter",   type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true },  // picked from the Drenwick infirmary counter
  "The Drowned's Gift": { name: "The Drowned's Gift", type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true }, // left at the freed Pale Drowned's pool, post-MQ4 (Sunken Gallery R1C2)
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

// ─── Fishing ──────────────────────────────────────────────────────────────────
// Fishing at the Drenwick waterfront requires a rod (an item of type 'rod'). The
// best rod the player holds sets the fishingPower used for the catch odds; with
// no rod, fishing isn't possible at all. Returns 0 when the player holds no rod.
function bestFishingPower() {
  let best = 0;
  for (const it of stats.items) {
    if (it && it.type === 'rod' && typeof it.fishingPower === 'number' && it.fishingPower > best) best = it.fishingPower;
  }
  return best;
}

// Rolls one cast's outcome for a rod of the given power (Old Fishing Rod = 1).
// A better rod means fewer empty casts and less junk, and more (and better)
// fish. Returns one of: 'nothing' | 'boot' (junk) | 'smelt' (heal 8) |
// 'eel' (heal 20) | 'letter' (rare flavour catch). At power 1 the odds are
// deliberately stingy — no more fishing up an endless free heal.
function rollFishingOutcome(power) {
  const p     = Math.max(1, power);
  const bonus = Math.min(0.45, (p - 1) * 0.15);   // quality bonus, 0 at power 1
  // Cumulative boundaries in [0,1). Empty casts and junk shrink as the rod
  // improves; the fish bands grow. The rare 'letter' keeps its ~3% top sliver.
  const nothing = 0.55 - bonus * 0.70;
  const boot    = nothing + (0.15 - bonus * 0.10);
  const smelt   = boot    + (0.20 + bonus * 0.40);
  const eel     = smelt   + (0.07 + bonus * 0.40);
  const r = Math.random();
  if (r < nothing) return 'nothing';
  if (r < boot)    return 'boot';
  if (r < smelt)   return 'smelt';
  if (r < eel)     return 'eel';
  return 'letter';
}

window.ITEM_REGISTRY = ITEM_REGISTRY;
window.createItem    = createItem;
window.grantItem     = grantItem;
window.bestFishingPower   = bestFishingPower;
window.rollFishingOutcome = rollFishingOutcome;
