'use strict';
// Speed-based evasion (combat.js): every attack is an ATTEMPT the defender may
// dodge, decided by the ONE central evadeChance()/attackEvaded(). Covers the
// formula (base / speed advantage / floor / cap), Bullet Time precedence, player
// AND enemy evasion in real combat, prevention of on-hit effects on a dodge, and
// a boss/special fight routing through the same decision.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Drive one combat turn with Math.random pinned to `rnd`; drain the deferred
// message queue; return the resulting state. `setup` seeds combat state and
// `action` kicks the turn off (an Attack via phase 'choose', or an item use via
// phase 'item').
function runTurn(g, setup, rnd, action) {
  return JSON.parse(g.run(`(function(){
    ${setup}
    var _r = Math.random; Math.random = function(){ return ${rnd}; };
    try {
      ${action}
      var guard = 0;
      while (combat.phase === 'message' && guard++ < 30) handleCombatAction();
      var all = ((combat.messageQueue||[]).concat([combat.message]))
        .map(function(m){ return typeof m === 'string' ? m : (m && m.text) || ''; });
      return JSON.stringify({
        hp: stats.hp, ehp: combat.enemy.hp, msg: all.join(' | '),
        poison: hasStatusEffect('poison'), isBoss: combat.isBoss,
      });
    } finally { Math.random = _r; }
  })()`));
}

module.exports = {
  name: 'evasion: central speed-based dodge (formula, both sides, on-hit block, Bullet Time, boss)',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // ── 1. Formula: base, speed advantage, cap, floor ───────────────────────
    g.run('combat.evadeTurns = 0;');
    assert.equal(g.run('evadeChance(5,5,false)'), 0.08, 'equal speed => 8% base');
    assert.ok(Math.abs(g.run('evadeChance(5,10,false)') - 0.155) < 1e-9, '+5 defender spd => ~15.5%');
    assert.equal(g.run('evadeChance(0,100,false)'), 0.30, 'huge advantage caps at 30%');
    assert.equal(g.run('evadeChance(100,0,false)'), 0.02, 'huge disadvantage floors at 2%');

    // ── 2. Bullet Time precedence ───────────────────────────────────────────
    g.run('combat.evadeTurns = 2;');
    assert.equal(g.run('evadeChance(5,5,true)'), 0.90, 'Bullet Time raises the player evade to 90%');
    assert.equal(g.run('evadeChance(5,5,false)'), 0.08, 'Bullet Time does not help an enemy defender');
    const btEvade = g.run('(function(){var _r=Math.random;Math.random=function(){return 0.5;};try{return attackEvaded(5,5,true);}finally{Math.random=_r;}})()');
    assert.equal(btEvade, true, 'a 0.5 roll evades under Bullet Time');
    g.run('combat.evadeTurns = 0;');
    const baseNoEvade = g.run('(function(){var _r=Math.random;Math.random=function(){return 0.5;};try{return attackEvaded(5,5,true);}finally{Math.random=_r;}})()');
    assert.equal(baseNoEvade, false, 'the same 0.5 roll does NOT evade at the 8% base once the buff is gone');

    // ── 3. Enemy evasion: player attacks, a FAST enemy dodges ───────────────
    // Player slow (spd 1) vs fast enemy (spd 30): the enemy's evade chance caps
    // at 30%; a 0.1 roll dodges the player's blow (enemy HP unchanged).
    const enemyEv = runTurn(g,
      `combat.active=true; combat.phase='choose'; combat.cursor=0; combat.evadeTurns=0; combat.isBoss=false;
       stats.hp=100; stats.maxHp=100; stats.atk=20; stats.def=5; stats.spd=1;
       stats.weapon=null; stats.armor=null; stats.shield=null; stats.accessory=null; statusEffects=[];
       combat.enemy={ id:'d', name:'Wisp', hp:200, maxHp:200, atk:1, def:0, spd:30, xp:0, goldMin:0, goldMax:0 };
       combat.messageQueue=[]; combat.pendingVictory=false; combat.pendingDefeat=false;`,
      0.1, 'handleCombatAction();');
    assert.equal(enemyEv.ehp, 200, "the fast enemy evades the player's blow (HP unchanged)");
    assert.ok(/The Wisp evades!/.test(enemyEv.msg), 'shows the generic enemy evade line: ' + enemyEv.msg);

    // ── 4 + 5. Player evasion AND prevention of on-hit effects (item path) ───
    // Player fast (spd 30) vs slow enemy (spd 1): player evade caps at 30%. A
    // 0.1 roll dodges the enemy's item-turn response, so its GUARANTEED poison
    // (poisonChance 1) never lands.
    const itemSetup = (hp) =>
      `combat.active=true; combat.phase='item'; combat.itemCursor=0; combat.evadeTurns=0; combat.isBoss=false;
       stats.hp=${hp}; stats.maxHp=100; stats.def=5; stats.spd=30;
       stats.weapon=null; stats.armor=null; stats.shield=null; stats.accessory=null; statusEffects=[];
       stats.items=[{ name:'Potion', type:'potion', heals:20, price:30 }];
       combat.enemy={ id:'d', name:'Wisp', hp:200, maxHp:200, atk:20, def:0, spd:1, poisonChance:1, xp:0, goldMin:0, goldMax:0 };
       combat.messageQueue=[]; combat.pendingVictory=false; combat.pendingDefeat=false;`;
    const playerEv = runTurn(g, itemSetup(50), 0.1, 'handleCombatAction();');
    assert.equal(playerEv.hp, 70, 'player evades the response — only the +20 heal applies, no damage');
    assert.equal(playerEv.poison, false, 'an evaded hit lands no on-hit effect (no poison)');
    assert.ok(/evades!/.test(playerEv.msg), 'shows the player evade line: ' + playerEv.msg);

    // control: same setup but a 0.5 roll is above the 30% cap => the hit lands,
    // dealing damage AND applying the guaranteed poison.
    const control = runTurn(g, itemSetup(50), 0.5, 'handleCombatAction();');
    assert.ok(control.hp < 70, 'without a dodge the enemy response deals damage (hp ' + control.hp + ')');
    assert.equal(control.poison, true, 'a landed hit applies the on-hit poison');

    // ── 6. Boss/special fight uses the same central evasion ─────────────────
    // isBoss=true, boss slower than the fast player: the player evades the boss's
    // return blow, proving special fights route through the same decision.
    const boss = runTurn(g,
      `combat.active=true; combat.phase='choose'; combat.cursor=0; combat.evadeTurns=0; combat.isBoss=true;
       stats.hp=100; stats.maxHp=100; stats.atk=20; stats.def=5; stats.spd=30;
       stats.weapon=null; stats.armor=null; stats.shield=null; stats.accessory=null; statusEffects=[];
       combat.enemy={ id:'boss', name:'Boss', hp:500, maxHp:500, atk:40, def:0, spd:5, xp:0, goldMin:0, goldMax:0 };
       combat.messageQueue=[]; combat.pendingVictory=false; combat.pendingDefeat=false;`,
      0.1, 'handleCombatAction();');
    assert.equal(boss.isBoss, true, 'still flagged as a boss fight');
    assert.equal(boss.hp, 100, "player evades the boss's blow (HP unchanged)");
    assert.ok(/evades!/.test(boss.msg), 'boss fight shows the generic evade line: ' + boss.msg);
  },
};
