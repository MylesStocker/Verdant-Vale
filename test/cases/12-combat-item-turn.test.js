'use strict';
// Regression guard for BALANCE_REPORT.md's item-use finding: using an item
// in combat used to be a completely free action — the enemy never got a
// turn. Fixed in combat.js (phase === 'item' now queues an enemy response
// via the shared enemyTurnResponse() helper, same formula/effect-application
// as Attack's counter-attack). This test proves, via real keypresses through
// input.js, that using a potion now (a) applies the item's effect and (b)
// still lets the enemy hit the player afterward, rather than skipping its
// turn entirely.
//
// Enemy stats are pinned high-ATK/high-DEF so its hit is guaranteed to land
// for a wide, easily-asserted damage range without needing to mock
// Math.random: def:100 makes the player's own (unused, since we never
// attack) damage irrelevant, and atk:20 with the player's effectiveDef
// forced to 0 guarantees eDmg lands in 16-24 regardless of the attack-roll
// multiplier's randomness.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'combat: using an item consumes the turn and the enemy responds',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    g.run('startCombat()');
    g.run(`
      stats.items = [{ name: 'Potion', type: 'potion', heals: 20, price: 30 }];
      stats.hp = 10; stats.maxHp = 100; stats.def = 0;
      stats.armor = null; stats.shield = null;
      combat.enemy = { name: 'Test Dummy', hp: 999, maxHp: 999, atk: 20, def: 100, spd: 0 };
      combat.phase = 'choose'; combat.cursor = 1; // combatOptions()[1] === 'item'
    `);
    g.frames(10); // let flashTimer run out so input.js accepts combat keys

    g.press('Enter'); // open the item subscreen
    assert.equal(g.run('combat.phase'), 'item');
    assert.equal(g.run('combat.itemCursor'), 0);

    const hpBeforeUse = g.run('stats.hp');
    g.press('Enter'); // use the potion (itemCursor 0)

    assert.equal(g.run('combat.phase'), 'message', 'using the item should move into the message phase');
    assert.match(g.run('combat.message'), /restored/, 'first message should be the heal result');
    const hpAfterHeal = g.run('stats.hp');
    assert.ok(hpAfterHeal > hpBeforeUse, 'HP should have increased from the potion');
    assert.equal(g.run('stats.items.length'), 0, 'the potion should be consumed exactly once');
    assert.equal(g.run('combat.enemy.hp'), 999, 'an item does not damage the enemy');

    // Advance past the heal message to reach the (now-added) deferred enemy
    // response — this is exactly the bug: previously there was nothing here
    // to advance to, and this same press would have gone straight back to
    // the 'choose' phase with the enemy never having acted. Since this is
    // the queue's last entry, advanceCombatMessage() both reveals the
    // enemy's message *and* resolves the phase back to 'choose' in this one
    // press (there's no pending victory/defeat/escape flag to hold it open).
    const hpBeforeEnemyTurn = g.run('stats.hp');
    g.press('Enter');
    assert.match(g.run('combat.message'), /attacks for \d+!/, 'the enemy should get a response message after the item turn');
    const hpAfterEnemyTurn = g.run('stats.hp');
    assert.ok(hpAfterEnemyTurn < hpBeforeEnemyTurn, 'the enemy should have dealt damage after the item turn');
    assert.ok(hpBeforeEnemyTurn - hpAfterEnemyTurn >= 16 && hpBeforeEnemyTurn - hpAfterEnemyTurn <= 24,
      `enemy damage should land in the expected 16-24 range (got ${hpBeforeEnemyTurn - hpAfterEnemyTurn})`);
    assert.equal(g.run('combat.phase'), 'choose', 'combat should return to choose once the item-turn message sequence is fully drained');

    g.renderFrame();
  },
};
