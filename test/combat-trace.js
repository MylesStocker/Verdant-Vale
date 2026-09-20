'use strict';

const assert = require('assert/strict');
const { createContext } = require('./harness');

// Production-executed compatibility checkpoints, NOT a combat implementation.
// Every step has an exact finite RNG tape: extra AND missing calls fail. Each
// trace gets its own VM Math object; the existing harness shares the host Math,
// so never patch Math.random on that inherited object. No disk/storage writes
// outside the harness's in-memory localStorage. No real animation loop runs.
function createCombatTrace(watches = {}) {
  const g = createContext();
  g.run(`Math = Object.create(Math);
    Math.random = function() { throw new Error('Combat trace: RNG outside a taped step'); };`);
  const checkpoints = [];
  const rng = [];
  let stepping = false;

  function checkpoint(label, values = []) {
    const state = JSON.parse(g.run(`JSON.stringify({
      active: combat.active, phase: combat.phase, message: combat.message,
      queue: combat.messageQueue.map(function(entry) {
        return typeof entry === 'string' ? {text: entry, deferred: false}
          : {text: entry.text, deferred: typeof entry.apply === 'function'};
      }),
      // Preserve the pre-normalization gameplay projection. Instance identity
      // and the collection invariant are asserted directly by suite 142.
      enemy: combat.enemy && Object.fromEntries(Object.entries(combat.enemy).filter(function(pair) {
        return !['instanceId','slot'].includes(pair[0]);
      })),
      player: {hp: stats.hp, maxHp: stats.maxHp, atk: stats.atk, def: stats.def,
        spd: stats.spd, level: stats.level, xp: stats.xp, gold: stats.gold,
        items: stats.items, weapon: stats.weapon, armor: stats.armor,
        shield: stats.shield, accessory: stats.accessory},
      statuses: statusEffects, slitherSpd: slitherSpd,
      pending: {victory: combat.pendingVictory, defeat: combat.pendingDefeat, escape: combat.pendingEscape},
      local: Object.fromEntries(Object.entries(combat).filter(function(pair) {
        // Bomb binding and mode are internal metadata, tested in suites 143/145.
        return !['mode','enemy','enemies','bombTargetInstanceId','active','phase','message','messageQueue','pendingVictory','pendingDefeat','pendingEscape'].includes(pair[0]);
      }).map(function(pair) {
        // Preserve the original logical checkpoint keys/order while observing
        // the instance authority directly, including empty-combat defaults.
        if (pair[0] === 'observeCount') return [pair[0], combat.enemy ? combat.enemy.observeCount : 0];
        if (pair[0] === 'escapeUnlocked') return [pair[0], combat.enemy ? combat.enemy.escapeUnlocked : false];
        return pair;
      })),
      dialogue: {open: dialogue.open, page: dialogue.page, name: dialogue.name,
        pages: dialogue.pages, triggerEncounterId: dialogue.triggerEncounterId || null,
        callbacks: (dialogue.callbacks || []).map(function(cb) {return typeof cb === 'function';})},
      day: day, mapId: mapIdForRef(activeMap)
    })`));
    state.watched = {};
    for (const [key, expression] of Object.entries(watches)) {
      const value = g.run('JSON.stringify(' + expression + ')');
      state.watched[key] = value === undefined ? null : JSON.parse(value);
    }
    const result = { label, rngValues: [...values], rngCount: rng.length, ...state };
    checkpoints.push(result);
    return result;
  }

  function step(label, tape, action) {
    assert.equal(stepping, false, 'Nested trace steps are not supported');
    assert.ok(Array.isArray(tape) && tape.every(v => Number.isFinite(v) && v >= 0 && v < 1),
      label + ': RNG tape must contain numbers in [0,1)');
    stepping = true;
    const previous = g.run('Math.random');
    const used = g.run(`(function() {
      var tape = ${JSON.stringify(tape)}, used = [];
      Math.random = function() {
        if (used.length === tape.length) throw new Error(${JSON.stringify(label + ': RNG tape exhausted')});
        var value = tape[used.length]; used.push(value); return value;
      };
      return used;
    })()`);
    try {
      if (typeof action === 'string') g.run(action);
      else action(g);
      assert.equal(used.length, tape.length, label + ': unused RNG values');
      rng.push(...used);
      return checkpoint(label, used);
    } finally {
      // The detached Math object is VM-local, including on assertion failure.
      g.run('Math').random = previous;
      stepping = false;
    }
  }

  function press(label, tape = [], key = 'Enter') {
    return step(label, tape, game => game.press(key));
  }

  // Only messages known to consume no RNG may use this convenience path.
  // On-hit effects or bomb kills requiring randomness must be advanced with an
  // explicit press/tape first. Stop before outcome acknowledgment or next action.
  function drainMessages(limit = 50) {
    let count = 0;
    while (g.run("combat.active && combat.phase === 'message'")) {
      assert.ok(count++ < limit, 'Combat trace: message drain limit exceeded');
      press('message ' + count);
    }
    return checkpoints[checkpoints.length - 1];
  }

  return { g, checkpoints, rng, checkpoint, step, press, drainMessages };
}

module.exports = { createCombatTrace };
