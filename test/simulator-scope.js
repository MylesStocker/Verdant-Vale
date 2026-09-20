'use strict';

// Test tooling only. Production handlers, exercised by combat-trace.js, are the
// compatibility oracle. Neither Monte Carlo model reproduces a whole battle.
// An allowlist makes new authored properties visible without teaching these
// reports a second combat engine. Presence (even false/zero) requires review.
const COMMON_FIELDS = [
  'id', 'name', 'hp', 'maxHp', 'atk', 'def', 'spd', 'xp', 'goldMin', 'goldMax',
  'defendChance',
];
const FAST_FIELDS = new Set([...COMMON_FIELDS, 'curseChance']);
const DEFENSE_FIELDS = new Set(COMMON_FIELDS);

function simulatorScope(model, enemies) {
  if (model !== 'fast' && model !== 'defense') throw new Error('Unknown simulator: ' + model);
  const understood = model === 'fast' ? FAST_FIELDS : DEFENSE_FIELDS;
  const omitted = [];
  for (const enemy of enemies) {
    const id = enemy.id || '(unnamed fixture)';
    for (const field of Object.keys(enemy)) {
      if (!understood.has(field)) omitted.push(id + '.' + field);
    }
    // Production also has identity/context-driven behavior with no template
    // property. These are diagnostics, not an alternative enemy inventory.
    if (enemy.id === 'enemy_polwick') omitted.push(id + (model === 'fast'
      ? ': fire/scorch/Burn' : ': production fire/queue timing (simplified Burn modeled)'));
    if (enemy.id === 'enemy_fen_witch') omitted.push(id + ': poison-on-hit');
    if (enemy.id === 'enemy_pale_sentry') omitted.push(id + ': persistent starting HP');
  }
  return {
    classification: 'approximate',
    model: model === 'fast' ? 'attack/heal comparison' : 'historical defense comparison',
    omitted: [...new Set(omitted)],
    limits: [
      'No production event/RNG parity, message queue, rewards, level-ups, quests or recovery.',
      'Full-HP start; Attack/heal policy only. No inventory actions, Observe or escape execution.',
      model === 'fast'
        ? 'Isolated opponents; curse modeled partially; no other active status/buff lifecycle.'
        : 'Sequential HP/potion carryover only; no quest handoffs or status carryover except simplified Polwick Burn within each fight.',
    ],
  };
}

function scopeLabel(scope) {
  return 'APPROXIMATE — ' + (scope.omitted.length
    ? 'omitted/unmodeled: ' + scope.omitted.join(', ')
    : 'core subset; event/RNG/reward parity not modeled');
}

module.exports = { simulatorScope, scopeLabel };
