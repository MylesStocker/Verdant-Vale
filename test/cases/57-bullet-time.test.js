'use strict';
// test/cases/57-bullet-time.test.js
//
// Covers the "Bullet Time" consumable (items.js + combat.js): a combat-only
// buff that raises the player's evade rate to 90% for the next 3 turns.
//
//   - registry shape (type 'buff', 90% / 3 turns, battleOnly);
//   - using it in battle sets combat.evadeTurns = 3 and consumes the item;
//   - while active, an incoming enemy hit is dodged (no HP loss, no on-hit
//     effect) — proven by pinning Math.random below/above the 0.90 threshold;
//   - the buff ticks down once per player turn and expires (no evade at 0);
//   - it is battle-only: it does nothing (isn't consumed or equipped) outside
//     combat.
//
// Every Math.random override is restored in a finally.

const assert = require('assert');
const { createContext } = require('../harness');

module.exports = {
  name: 'Bullet Time: combat-only evade buff (90% for 3 turns)',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    // ── 1. Registry shape ───────────────────────────────────────────────────
    const def = JSON.parse(g.run("JSON.stringify(createItem('Bullet Time'))"));
    assert.equal(def.type, 'buff', 'Bullet Time is a buff-type item');
    assert.equal(def.evadeRate, 0.90, 'raises evade to 90%');
    assert.equal(def.evadeTurns, 3, 'lasts 3 turns');
    assert.equal(def.battleOnly, true, 'is flagged battle-only');

    // ── 2. Using it in battle: sets the buff, consumes the item, dodges the
    //       enemy's response (Math.random pinned to 0 → below the 0.90 gate). ─
    const used = JSON.parse(g.run(`(function(){
      stats.maxHp = 100; stats.hp = 100;
      combat.enemy = { id:'enemy_marsh_wisp', name:'Marsh Wisp', hp:9999, maxHp:9999, atk:40, def:0, spd:5, xp:0, goldMin:0, goldMax:0 };
      combat.active = true; combat.evadeTurns = 0;
      stats.items = [ createItem('Bullet Time') ];
      combat.phase = 'item'; combat.itemCursor = 0;
      var _r = Math.random; Math.random = function(){ return 0; };  // force the dodge
      try {
        handleCombatAction();
        var evadeTurns = combat.evadeTurns;
        var consumed   = !stats.items.some(function(i){ return i.name === 'Bullet Time'; });
        // Apply the deferred enemy-response entry (normally applied on message advance).
        combat.messageQueue.forEach(function(m){ if (m && typeof m !== 'string' && m.apply) m.apply(); });
        var dodgeShown = (combat.message + JSON.stringify(combat.messageQueue)).indexOf('Evaded') >= 0;
        return JSON.stringify({ evadeTurns: evadeTurns, consumed: consumed, hp: stats.hp, dodgeShown: dodgeShown });
      } finally { Math.random = _r; }
    })()`));
    assert.equal(used.evadeTurns, 3, 'using Bullet Time sets evadeTurns to 3');
    assert.equal(used.consumed, true, 'the item is consumed on use');
    assert.equal(used.hp, 100, 'the enemy response is dodged — no HP lost');
    assert.equal(used.dodgeShown, true, 'the dodge is reported to the player');

    // ── 3. Control: with the buff expired (evadeTurns 0), the same hit lands. ─
    const control = JSON.parse(g.run(`(function(){
      stats.maxHp = 100; stats.hp = 100;
      combat.enemy = { id:'enemy_marsh_wisp', name:'Marsh Wisp', hp:9999, maxHp:9999, atk:40, def:0, spd:5, xp:0, goldMin:0, goldMax:0 };
      combat.active = true; combat.evadeTurns = 0;
      stats.items = [ createItem('Potion') ];       // ordinary item — spends a turn
      combat.phase = 'item'; combat.itemCursor = 0;
      var _r = Math.random; Math.random = function(){ return 0.5; };  // would dodge IF the buff were up
      try {
        handleCombatAction();
        combat.messageQueue.forEach(function(m){ if (m && typeof m !== 'string' && m.apply) m.apply(); });
        return JSON.stringify({ hp: stats.hp });
      } finally { Math.random = _r; }
    })()`));
    assert.ok(control.hp < 100, 'with no buff active the enemy hit deals damage (evade is not a base ability)');

    // ── 4. Evade roll respects the rate and the counter. ────────────────────
    const rolls = JSON.parse(g.run(`(function(){
      var _r = Math.random;
      try {
        combat.evadeTurns = 2; Math.random = function(){ return 0.95; }; var high = bulletTimeEvades();   // above 0.90 → miss
        Math.random = function(){ return 0.10; }; var low  = bulletTimeEvades();                          // below 0.90 → dodge
        combat.evadeTurns = 0; Math.random = function(){ return 0; }; var expired = bulletTimeEvades();    // counter spent → never
        return JSON.stringify({ high: high, low: low, expired: expired });
      } finally { Math.random = _r; }
    })()`));
    assert.equal(rolls.high, false, 'a roll above 90% is not a dodge');
    assert.equal(rolls.low, true, 'a roll below 90% is a dodge while active');
    assert.equal(rolls.expired, false, 'no dodge once the buff has expired');

    // ── 5. Ticks down once per turn: 3 → 2 → 1 → 0. ─────────────────────────
    const seq = JSON.parse(g.run(`(function(){
      combat.evadeTurns = 3; var s = [];
      for (var i = 0; i < 4; i++) { s.push(combat.evadeTurns); tickEvadeBuff(); }
      return JSON.stringify(s);
    })()`));
    assert.deepEqual(seq, [3, 2, 1, 0], 'the buff ticks down one turn at a time and floors at 0');

    // ── 6. Battle-only: it cannot be equipped/consumed outside combat. ──────
    const field = JSON.parse(g.run(`(function(){
      stats.items = [ createItem('Bullet Time') ]; stats.weapon = null; stats.accessory = null;
      equipItem(stats.items[0]);   // the field menu's fallback for non-potion items
      return JSON.stringify({
        stillInBag: stats.items.some(function(i){ return i.name === 'Bullet Time'; }),
        notEquipped: stats.weapon === null && stats.accessory === null,
      });
    })()`));
    assert.equal(field.stillInBag, true, 'Bullet Time is not consumed outside combat');
    assert.equal(field.notEquipped, true, 'Bullet Time is not equippable');
  },
};
