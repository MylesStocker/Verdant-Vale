#!/usr/bin/env node
'use strict';
// Paired deterministic report for the bounded player-defense increment.
// Each scenario runs the committed legacy formula and the corrected formula
// with the same seed, 4,000 trials, and attack/heal policy.

const { createContext } = require('./harness');

const TRIALS = 4000;
const BASE_SEED = 1000;
const g = createContext();
const pull = (expr) => JSON.parse(g.run(`JSON.stringify(${expr})`));
const START = pull('stats');
const ITEMS = pull('ITEM_REGISTRY');
const ENEMIES = pull('ENEMY_TEMPLATE_REGISTRY');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function baseAt(level) {
  return {
    maxHp: START.maxHp + 10 * (level - 1),
    atk: START.atk + 2 * (level - 1),
    def: START.def + 2 * (level - 1),
    spd: START.spd + 0.5 * (level - 1),
  };
}

function playerAt(level, gearNames) {
  const p = baseAt(level);
  for (const name of gearNames) {
    const item = ITEMS[name];
    if (item.type === 'weapon') p.atk += item.bonus;
    if (item.type === 'armor' || item.type === 'shield') p.def += item.bonus;
    if (item.type === 'accessory') p.spd += item.bonus;
    if (item.type === 'armor' && item.defenseCapBypass === true) p.defenseCapBypass = true;
  }
  return p;
}

const GEAR = {
  starter: ['Bronze Knife', 'Leather Armor'],
  first: ['Bronze Knife', 'Leather Armor'],
  starterShield: ['Bronze Knife', 'Leather Armor', 'Iron Shield'],
  leanSteel: ['Steel Sword', 'Leather Armor'],
  second: ['Steel Sword', 'Leather Armor', 'Iron Shield', 'Swift Bangle'],
  dragon: ['Dragon Blade', 'Shadow Cloak', 'Mithril Shield', 'Wraithband'],
  cat: ['Dragon Blade', 'Cat Armor', 'Mithril Shield', 'Wraithband'],
};

const SCENARIOS = [
  { label: 'Lv1 starter vs opening Marsh Wisp', level: 1, gear: 'starter', enemies: ['enemy_marsh_wisp_early'], potions: 0 },
  { label: 'Lv2 starter + shield vs Bone Guard', level: 2, gear: 'starterShield', enemies: ['enemy_bone_guard'], potions: 0 },
  { label: 'Lv2 starter + shield vs Shade Wraith', level: 2, gear: 'starterShield', enemies: ['enemy_shade_wraith'], potions: 0 },
  { label: 'First-tier vs Polwick gang (0 Potions)', level: 3, gear: 'first', enemies: ['enemy_smuggler_guard', 'enemy_polwick', 'enemy_essa'], potions: 0 },
  { label: 'First-tier vs Polwick gang (3 Potions)', level: 3, gear: 'first', enemies: ['enemy_smuggler_guard', 'enemy_polwick', 'enemy_essa'], potions: 3 },
  { label: 'Lv4 playtest gear vs Polwick gang (0 Potions)', level: 4, gear: 'second', enemies: ['enemy_smuggler_guard', 'enemy_polwick', 'enemy_essa'], potions: 0 },
  { label: 'Lv4 playtest gear vs Polwick gang (3 Potions)', level: 4, gear: 'second', enemies: ['enemy_smuggler_guard', 'enemy_polwick', 'enemy_essa'], potions: 3 },
  { label: 'Lv5 Steel + starter armor vs Briar Warden', level: 5, gear: 'leanSteel', enemies: ['enemy_briar_warden'], potions: 0 },
  { label: 'Lv5 lighthouse gear vs Marsh Rat', level: 5, gear: 'second', enemies: ['enemy_marsh_rat'], potions: 0 },
  { label: 'Lv5 lighthouse gear vs Shallows Skitter', level: 5, gear: 'second', enemies: ['enemy_shallows_skitter'], potions: 0 },
  { label: 'Lv5 lighthouse gear vs Lantern Moth', level: 5, gear: 'second', enemies: ['enemy_lantern_moth'], potions: 0 },
  { label: 'Lv5 lighthouse gear vs Lensweb Spider', level: 5, gear: 'second', enemies: ['enemy_lensweb_spider'], potions: 3 },
  { label: 'Lv5 Gallery gear vs Pale Drowned', level: 5, gear: 'second', enemies: ['enemy_pale_drowned_gallery'], potions: 1 },
  { label: 'Lv5 Gallery gear vs Silt Hag', level: 5, gear: 'second', enemies: ['enemy_silt_hag_gallery'], potions: 1 },
  { label: 'First-tier vs Corpse Slug', level: 3, gear: 'first', enemies: ['enemy_corpse_slug'], potions: 0 },
  { label: 'Second-tier vs Basin Gull', level: 4, gear: 'second', enemies: ['enemy_basin_gull'], potions: 0 },
  { label: 'Second-tier vs Silt Hag', level: 4, gear: 'second', enemies: ['enemy_silt_hag_gallery'], potions: 0 },
  { label: 'Second-tier vs Crypt Fiend', level: 4, gear: 'second', enemies: ['enemy_crypt_fiend'], potions: 0 },
  { label: 'Dragon-tier vs Fen Shade', level: 6, gear: 'dragon', enemies: ['enemy_fen_shade'], potions: 0 },
  { label: 'Dragon-tier vs Crypt Revenant', level: 6, gear: 'dragon', enemies: ['enemy_crypt_revenant'], potions: 0 },
  { label: 'Lv5 Steel + starter armor vs Pale Sentry', level: 5, gear: 'leanSteel', enemies: ['enemy_pale_sentry'], potions: 3 },
  { label: 'Intended late vs Mulholland', level: 7, gear: 'dragon', enemies: ['enemy_mulholland'], potions: 3 },
  { label: 'Intended late vs Wrongteeth', level: 7, gear: 'dragon', enemies: ['enemy_wrongteeth'], potions: 3 },
  { label: 'INVALID normal progression: ordinary late vs Takomo', level: 7, gear: 'dragon', enemies: ['enemy_takomo'], potions: 3 },
  { label: 'Secret exception: Cat Armor vs Takomo', level: 7, gear: 'cat', enemies: ['enemy_takomo'], potions: 3 },
];

function speedWinChance(own, other) {
  const a = Math.max(1, own), b = Math.max(1, other);
  return Math.min(0.9, Math.max(0.1, a / (a + b)));
}

function evadeChance(attackerSpd, defenderSpd) {
  return Math.min(0.30, Math.max(0.02, 0.08 + 0.015 * (defenderSpd - attackerSpd)));
}

function damageRoll(atk, def, rng) {
  const variance = 0.8 + rng() * 0.4;
  const crit = rng() < 0.10;
  let dmg = atk * variance - def;
  if (crit) dmg *= 1.5;
  return Math.max(1, Math.round(dmg));
}

function incomingDef(player, enemyAtk, corrected) {
  if (!corrected || player.defenseCapBypass === true) return player.def;
  return Math.min(player.def, Math.floor(enemyAtk * 0.80));
}

function simulateTrial(scenario, corrected, rng, hitDamages) {
  const player = { ...playerAt(scenario.level, GEAR[scenario.gear]), hp: 0 };
  player.hp = player.maxHp;
  let potionsLeft = scenario.potions;
  let potionsUsed = 0;
  let turns = 0;

  for (const enemyId of scenario.enemies) {
    const template = ENEMIES[enemyId];
    let enemyHp = template.maxHp;
    let burn = false;
    let polwickHasCast = false;

    while (player.hp > 0 && enemyHp > 0 && turns < 500) {
      turns++;
      const burnAtTurnStart = burn;

      const applyEnemyHit = (dmg) => {
        hitDamages.push(dmg);
        player.hp = Math.max(0, player.hp - dmg);
        if (player.hp <= 0) return;
        if (enemyId === 'enemy_polwick' && !burn && (!polwickHasCast || rng() < 0.5)) {
          polwickHasCast = true;
          burn = true;
          player.hp = Math.max(0, player.hp - (4 + Math.floor(rng() * 5)));
        }
      };

      const enemyAttempt = () => {
        const dmg = damageRoll(template.atk, incomingDef(player, template.atk, corrected), rng);
        if (rng() >= evadeChance(template.spd, player.spd)) applyEnemyHit(dmg);
      };

      if (potionsLeft > 0 && player.hp / player.maxHp <= 0.35) {
        player.hp = Math.min(player.maxHp, player.hp + 20);
        potionsLeft--; potionsUsed++;
        enemyAttempt();
        if (burnAtTurnStart && player.hp > 0) player.hp = Math.max(0, player.hp - Math.floor(rng() * 21));
        continue;
      }

      const playerFirst = rng() < speedWinChance(player.spd, template.spd);
      const enemyDefending = !!(template.defendChance && rng() < template.defendChance);
      const pRoll = damageRoll(player.atk, template.def, rng);
      // Runtime always pre-rolls the enemy attack before resolving the exchange.
      const eDmg = damageRoll(template.atk, incomingDef(player, template.atk, corrected), rng);

      if (enemyDefending) {
        enemyHp = Math.max(0, enemyHp - Math.max(1, Math.floor(pRoll / 2)));
      } else if (playerFirst) {
        if (rng() >= evadeChance(player.spd, template.spd)) enemyHp = Math.max(0, enemyHp - pRoll);
        if (enemyHp > 0 && rng() >= evadeChance(template.spd, player.spd)) applyEnemyHit(eDmg);
      } else {
        if (rng() >= evadeChance(template.spd, player.spd)) applyEnemyHit(eDmg);
        if (player.hp > 0 && rng() >= evadeChance(player.spd, template.spd)) enemyHp = Math.max(0, enemyHp - pRoll);
      }

      if (burnAtTurnStart && enemyHp > 0 && player.hp > 0)
        player.hp = Math.max(0, player.hp - Math.floor(rng() * 21));
    }
    if (player.hp <= 0 || turns >= 500) break;
    burn = false;
  }

  return {
    win: player.hp > 0 && turns < 500,
    hp: player.hp,
    potionsUsed,
    turns,
  };
}

function runScenario(scenario, corrected, seed) {
  const rng = mulberry32(seed);
  const hitDamages = [];
  let wins = 0, hp = 0, potions = 0, turns = 0;
  for (let i = 0; i < TRIALS; i++) {
    const result = simulateTrial(scenario, corrected, rng, hitDamages);
    if (result.win) wins++;
    hp += result.hp;
    potions += result.potionsUsed;
    turns += result.turns;
  }
  const sumDamage = hitDamages.reduce((a, b) => a + b, 0);
  const floorHits = hitDamages.filter((d) => d === 1).length;
  return {
    winRate: wins / TRIALS * 100,
    avgHp: hp / TRIALS,
    avgPotions: potions / TRIALS,
    avgTurns: turns / TRIALS,
    damageMean: hitDamages.length ? sumDamage / hitDamages.length : 0,
    damageMin: hitDamages.length ? Math.min(...hitDamages) : 0,
    damageMax: hitDamages.length ? Math.max(...hitDamages) : 0,
    floorPct: hitDamages.length ? floorHits / hitDamages.length * 100 : 0,
  };
}

function fmt(n, digits = 1) { return n.toFixed(digits); }
function signed(n, digits = 1) { return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}`; }

function capSummary(scenario, player) {
  const caps = scenario.enemies.map((id) => Math.floor(ENEMIES[id].atk * 0.80));
  const cap = [...new Set(caps)].join('/');
  const active = player.defenseCapBypass === true
    ? 'bypassed'
    : caps.every((c) => player.def > c) ? 'yes'
      : caps.some((c) => player.def > c) ? 'mixed' : 'no';
  return { cap, active };
}

function runReport() {
  console.log(`# Player-defense balance increment (${TRIALS} trials; base seed ${BASE_SEED})`);
  console.log('');
  console.log('| Scenario | DEF | 80% ATK cap | Active? | Formula | Enemy dmg mean (range) | Floor hits | Win | Avg HP | Avg Potions | Avg turns | Difference from baseline |');
  console.log('|---|---:|---:|:---:|:---|---:|---:|---:|---:|---:|---:|:---|');
  SCENARIOS.forEach((scenario, index) => {
    const player = playerAt(scenario.level, GEAR[scenario.gear]);
    const caps = capSummary(scenario, player);
    const baseline = runScenario(scenario, false, BASE_SEED + index);
    const corrected = runScenario(scenario, true, BASE_SEED + index);
    const row = (formula, r, delta) =>
      `| ${scenario.label} | ${player.def} | ${caps.cap} | ${caps.active} | ${formula} | ${fmt(r.damageMean)} (${r.damageMin}–${r.damageMax}) | ${fmt(r.floorPct)}% | ${fmt(r.winRate)}% | ${fmt(r.avgHp)} | ${fmt(r.avgPotions, 2)} | ${fmt(r.avgTurns)} | ${delta} |`;
    console.log(row('baseline', baseline, '—'));
    console.log(row('corrected', corrected,
      `dmg ${signed(corrected.damageMean - baseline.damageMean)}; floor ${signed(corrected.floorPct - baseline.floorPct)}pp; win ${signed(corrected.winRate - baseline.winRate)}pp; HP ${signed(corrected.avgHp - baseline.avgHp)}; pots ${signed(corrected.avgPotions - baseline.avgPotions, 2)}; turns ${signed(corrected.avgTurns - baseline.avgTurns)}`));
  });
}

if (require.main === module) runReport();

module.exports = { TRIALS, BASE_SEED, GEAR, SCENARIOS, playerAt, runScenario, runReport };
