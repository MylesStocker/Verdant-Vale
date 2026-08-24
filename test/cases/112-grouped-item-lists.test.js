'use strict';
// The combat Item subscreen and the shop Sell screen now group multiples of the
// same item into one row (e.g. "Potion 3"), exactly like the pause menu's item
// list. All three read the single grouping authority, groupItems() (state.js):
// the cursor indexes GROUPS, and the action operates on the group's
// representative instance. Selecting a stacked item consumes/sells exactly one.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  // Deterministic inventory: 3 Potions + 1 Elixir → two groups.
  g.run("stats.items.length=0; grantItem('Potion'); grantItem('Potion'); grantItem('Potion'); grantItem('Elixir');");
  return g;
}

module.exports = {
  name: 'Grouped item lists: combat Item + shop Sell stack multiples like the pause menu',
  run() {
    const g = fresh();

    // ── 0. The grouping authority collapses the three Potions into one row. ──
    assert.equal(g.run('inventoryItems().length'), 4, 'four raw item instances');
    assert.equal(g.run('groupItems().length'), 2, 'two grouped rows (Potion, Elixir)');
    assert.equal(g.run("groupItems().map(x=>x.name+'/'+x.count).join(',')"), 'Potion/3,Elixir/1', 'Potion stacks to 3');

    // ── 1. Combat Item menu indexes GROUPS, with Back at groups.length. ──────
    // flashTimer gates combat key input (input.js); clear it so presses register.
    g.run("startCombat('marsh_rat'); combat.flashTimer=0; combat.phase='item'; combat.itemCursor=0;");
    assert.doesNotThrow(() => g.renderFrame(), 'combat item render does not throw');
    // Navigation lands Back on the grouped length, not the raw item count.
    g.run('combat.itemCursor=0;');
    g.press('ArrowDown'); g.press('ArrowDown');            // 0→1→2 (clamped at Back)
    assert.equal(g.run('combat.itemCursor'), 2, 'cursor clamps at Back = groupItems().length (2), not 4');
    g.press('ArrowDown');
    assert.equal(g.run('combat.itemCursor'), 2, 'cannot move past Back');

    // Using the Potion group (cursor 0) consumes exactly ONE Potion.
    g.run('combat.itemCursor=0; stats.hp=1;');
    g.run('handleCombatAction();');
    assert.equal(g.run("inventoryItems().filter(i=>i.name==='Potion').length"), 2, 'exactly one Potion consumed');
    assert.equal(g.run('stats.hp'), 21, 'Potion healed 20');
    assert.equal(g.run('combat.phase'), 'message', 'using an item enters the message phase');
    g.run('endCombat();');

    // ── 2. Shop Sell screen: same grouping; Back sits after the grouped rows. ─
    g.run("shop.open=true; shop.title='TRAVELLER'; shop.stock=TRAVELLER_STOCK; shop.screen='sell'; shop.cursor=0;");
    assert.doesNotThrow(() => g.renderFrame(), 'sell render does not throw');
    g.run('shop.cursor=0;');
    g.press('ArrowDown'); g.press('ArrowDown'); g.press('ArrowDown'); // clamp at Back
    assert.equal(g.run('shop.cursor'), 2, 'sell Back = groupItems().length (2), not the raw item count');

    // Selling the Potion group (cursor 0) removes exactly ONE Potion for half price.
    g.run('shop.cursor=0;');
    const goldBefore = g.run('stats.gold');
    g.press('Enter');
    assert.equal(g.run("inventoryItems().filter(i=>i.name==='Potion').length"), 1, 'exactly one Potion sold');
    assert.equal(g.run('stats.gold') - goldBefore, 15, 'sold for 50% of the 30g price');
    assert.equal(g.run("groupItems().map(x=>x.name+'/'+x.count).join(',')"), 'Potion/1,Elixir/1', 'group now shows Potion 1');

    // Selling the last Potion collapses the row; the cursor stays valid (no crash).
    g.run('shop.cursor=0;');
    g.press('Enter');
    assert.equal(g.run("inventoryItems().some(i=>i.name==='Potion')"), false, 'Potion group gone');
    assert.ok(g.run('shop.cursor') <= g.run('groupItems().length'), 'sell cursor stays within bounds after the group empties');
    assert.doesNotThrow(() => g.renderFrame(), 'sell render still safe after the group empties');

    // ── 3. Validation stays clean. ──────────────────────────────────────────
    const v = JSON.parse(g.run('JSON.stringify(validateGameData())'));
    assert.equal(v.errors, 0, 'validation clean');
  },
};
