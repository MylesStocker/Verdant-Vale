'use strict';
// Regression guard alongside 12-combat-item-turn.test.js: the fix that made
// using an item consume the turn (combat.js, phase === 'item') must not
// affect backing out of the item subscreen without using anything. There
// are two real ways to back out (input.js): navigating the cursor onto the
// "[ Back ]" row and confirming with Enter (routes through
// handleCombatAction()'s phase === 'item' branch), or pressing 'b'/Escape
// directly (input.js sets combat.phase = 'choose' itself and never calls
// handleCombatAction() at all). Both must leave HP, the enemy, and the
// inventory untouched — no enemy turn, no item consumed.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function setUpFight(g) {
  g.run('startCombat()');
  g.run(`
    stats.items = [{ name: 'Potion', type: 'potion', heals: 20, price: 30 }];
    stats.hp = 50; stats.maxHp = 100; stats.def = 0;
    stats.armor = null; stats.shield = null;
    combat.enemy = { name: 'Test Dummy', hp: 999, maxHp: 999, atk: 20, def: 100, spd: 0 };
    combat.phase = 'choose'; combat.cursor = 1; // combatOptions()[1] === 'item'
  `);
  g.frames(10); // let flashTimer run out
}

module.exports = {
  name: 'combat: backing out of the item menu does not consume a turn',
  run() {
    // ── Path 1: navigate to "[ Back ]" and confirm with Enter ────────────────
    {
      const g = createContext();
      g.press('Enter'); g.press('Enter'); // close intro dialogue
      setUpFight(g);

      g.press('Enter'); // open item subscreen
      assert.equal(g.run('combat.phase'), 'item');

      g.press('ArrowDown'); // only one item, so this lands on the Back row (itemCursor === items.length)
      assert.equal(g.run('combat.itemCursor'), 1, 'cursor should be on the Back row');

      const hpBefore    = g.run('stats.hp');
      const itemsBefore = g.run('stats.items.length');
      const enemyHpBefore = g.run('combat.enemy.hp');

      g.press('Enter'); // confirm Back

      assert.equal(g.run('combat.phase'), 'choose', 'Back should return straight to the choose phase, not "message"');
      assert.equal(g.run('stats.hp'), hpBefore, 'HP must be unchanged — no enemy turn from Back');
      assert.equal(g.run('stats.items.length'), itemsBefore, 'inventory must be unchanged — nothing was used');
      assert.equal(g.run('combat.enemy.hp'), enemyHpBefore);
    }

    // ── Path 2: press 'b' directly from the item subscreen ───────────────────
    {
      const g = createContext();
      g.press('Enter'); g.press('Enter'); // close intro dialogue
      setUpFight(g);

      g.press('Enter'); // open item subscreen
      assert.equal(g.run('combat.phase'), 'item');
      assert.equal(g.run('combat.itemCursor'), 0, 'cursor starts on the first item, not Back');

      const hpBefore    = g.run('stats.hp');
      const itemsBefore = g.run('stats.items.length');

      g.press('b'); // input.js handles this directly, bypassing handleCombatAction() entirely

      assert.equal(g.run('combat.phase'), 'choose', "'b' should return straight to the choose phase");
      assert.equal(g.run('stats.hp'), hpBefore, 'HP must be unchanged');
      assert.equal(g.run('stats.items.length'), itemsBefore, 'inventory must be unchanged — nothing was used');
    }

    // Regression tripwire: if item use is ever wired up to fire on the Back
    // row too, this pins today's contract (item.type checks are keyed off
    // combat.itemCursor === stats.items.length meaning "Back", not an item).
  },
};
