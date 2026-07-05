'use strict';
// test/balance-report.js
//
// Read-only combat/economy balance simulator. Does NOT modify any gameplay
// file. Companion to BALANCE_REPORT.md — every number in that report was
// produced by this script, not hand-estimated.
//
// Method (same philosophy as test/transition-audit.js): rather than
// hand-transcribing enemy stats/formulas from the source files and risking
// a copy error that quietly invalidates the whole report, this script loads
// the real game into a live `vm` context via test/harness.js and reads the
// actual constant objects (ENEMY_TEMPLATES, XP_THRESHOLDS, MERCHANT_STOCK,
// etc.) directly out of it. The turn-resolution formula itself (damage,
// turn order, brace, curse-fumble, escape chance) is re-implemented here in
// plain JS so thousands of Monte-Carlo trials run fast — but it is
// re-implemented, not guessed: SELF-CHECK below drives one real combat turn
// through the actual `handleCombatAction()` in the vm context with
// `Math.random` pinned to a fixed sequence, and asserts this script's
// reimplementation produces byte-identical damage numbers for the same
// inputs. If the two ever disagree (e.g. someone changes combat.js and
// forgets this file), the script exits non-zero instead of silently
// reporting stale numbers.
//
// Determinism: all Monte-Carlo sampling uses a seeded PRNG (mulberry32), not
// Math.random, so `node test/balance-report.js` prints identical numbers on
// every run.
//
// Run: node test/balance-report.js

const assert = require('assert');
const { createContext } = require('./harness');

// ─── Seeded PRNG (mulberry32) — deterministic Monte Carlo ───────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 1 — pull real constants out of the live game
// ─────────────────────────────────────────────────────────────────────────
const g = createContext();
function pull(name) { return JSON.parse(g.run(`JSON.stringify(${name})`)); }

const XP_THRESHOLDS = pull('XP_THRESHOLDS');
const MAX_LEVEL      = pull('MAX_LEVEL');
const STARTING_STATS = pull('stats'); // level 1, no gear
const ENCOUNTER_CHANCE   = pull('ENCOUNTER_CHANCE');
const ENCOUNTER_COOLDOWN = pull('ENCOUNTER_COOLDOWN');

const POOLS = {
  'MAP (start overworld)':            pull('EARLY_ENEMY_TEMPLATES'),
  'MAP2 (overworld, post-start)':     pull('ENEMY_TEMPLATES'),
  'MAP3 / MAP_N1 / MAP_N2 / MAP3_N1 / MAP3_N2 (far overworld)': pull('FAR_ENEMY_TEMPLATES'),
  'MAP4 / MAP5 (Thornmere)':          pull('THORNMERE_ENEMY_TEMPLATES'),
  'East Sluice':                      pull('SLUICE_ENEMY_TEMPLATES'),
  "Mirethyst's Vault":                pull('MIRE_VAULT_ENEMY_TEMPLATES'),
  'Dungeon floor 1':                  pull('DUNGEON_ENEMY_TEMPLATES'),
  'Dungeon floors 2-3':               pull('DUNGEON2_ENEMY_TEMPLATES'),
  'Dungeon floors 4-5':               pull('DUNGEON2_ENEMY_TEMPLATES'), // combat.js: same pool as 2-3
  'Dungeon floors 6-7':               pull('DUNGEON6_ENEMY_TEMPLATES'),
  'Dungeon floor 8':                  pull('DUNGEON8_ENEMY_TEMPLATES'),
  'Dungeon floors 9-10 (horror)':     pull('DUNGEON_HORROR_ENEMY_TEMPLATES'),
};

const SPECIALS = {
  'Briar Warden':      pull('BRIAR_WARDEN_TEMPLATE'),
  'Smuggler Guard':    pull('SMUGGLER_GUARD_TEMPLATE'),
  'Polwick':           pull('POLWICK_TEMPLATE'),
  'Essa':              pull('ESSA_TEMPLATE'),
  'Pale Sentry':       pull('PALE_SENTRY_TEMPLATE'),
  'Mulholland':        pull('MULHOLLAND_TEMPLATE'),
  'Den Wraith':        pull('DEN_WRAITH_TEMPLATE'),
  'Kolm (sailor brawl)': pull('SAILOR_BRAWLER_TEMPLATE'),
  'Takomo':            pull('TAKOMO_TEMPLATE'),
  'Wrongteeth (boss)': pull('BOSS_TEMPLATE'),
  'Rainfish (x3 chain, per-fish)': pull('RAINFISH_TEMPLATE'),
};

const MERCHANT_STOCK  = pull('MERCHANT_STOCK');
const TRAVELLER_STOCK = pull('TRAVELLER_STOCK');

// ─────────────────────────────────────────────────────────────────────────
// STEP 2 — self-check: verify this script's formula against the real
// handleCombatAction() with Math.random pinned. Math is shared by reference
// between this process and the vm sandbox (see harness.js), so overriding
// Math.random here also affects code executed inside the vm.
// ─────────────────────────────────────────────────────────────────────────
function selfCheck() {
  const realRandom = Math.random;
  try {
    Math.random = () => 0.5; // fixed: turn order becomes deterministic, roll multiplier = 1.0, all chance checks (<0.5) are false

    // ── Attack self-check ──────────────────────────────────────────────────
    g.run(`
      stats.atk = 8; stats.def = 3; stats.spd = 10; stats.hp = 30; stats.maxHp = 30;
      stats.weapon = null; stats.armor = null; stats.shield = null; stats.accessory = null;
      statusEffects = [];
      combat.enemy = { name: 'SelfCheckDummy', hp: 100, maxHp: 100, atk: 10, def: 2, spd: 5 };
      combat.active = true; combat.phase = 'choose'; combat.cursor = 0;
      combat.messageQueue = []; combat.pendingVictory = false; combat.pendingDefeat = false;
      handleCombatAction();
    `);
    // Damage from the loser-of-the-speed-tie's hit is deferred inside a
    // { text, apply() } message object and only actually applied when the
    // player advances past it (advanceCombatMessage() -> handleCombatAction()
    // while phase 'message') — drain the queue so it's fully resolved before
    // reading final state, matching how the real game/player experiences it.
    while (g.run("combat.phase") === 'message') g.run('handleCombatAction()');
    const enemyHpAfter = g.run('combat.enemy.hp');
    const playerHpAfter = g.run('stats.hp');
    // Reimplemented formula, same fixed inputs, same fixed Math.random()=0.5:
    // player faster (10 > 5) -> attacks first. rawPDmg = max(1, 8-2) = 6.
    const expectedPDmg = Math.max(1, 8 - 2);
    // enemy counters: atkRoll = 10*(0.8+0.5*0.4)=10*1.0=10; eDmg = max(1, round(10-3))=7
    const expectedEDmg = Math.max(1, Math.round(10 * (0.8 + 0.5 * 0.4) - 3));
    assert.strictEqual(100 - enemyHpAfter, expectedPDmg, `attack self-check: enemy damage mismatch (real=${100 - enemyHpAfter}, expected=${expectedPDmg})`);
    assert.strictEqual(30 - playerHpAfter, expectedEDmg, `attack self-check: player damage mismatch (real=${30 - playerHpAfter}, expected=${expectedEDmg})`);

    // ── Observe self-check ─────────────────────────────────────────────────
    g.run(`
      stats.hp = 30; stats.maxHp = 30; stats.def = 3;
      combat.enemy = { name: 'SelfCheckDummy2', hp: 100, maxHp: 100, atk: 10, def: 2, spd: 5 };
      combat.isBoss = false; combat.isWarden = false; combat.isFortGuard = false;
      combat.isFortPolwick = false; combat.isFortEssa = false; combat.isMulholland = false;
      combat.isPaleSentry = false; combat.isDenWraith = false; combat.isSailorBrawl = false;
      combat.isTakomo = false; combat.isRainfish = false; combat.is23 = false;
      combat.phase = 'choose'; combat.cursor = 2; combat.observeCount = 0;
      combat.messageQueue = []; combat.pendingVictory = false; combat.pendingDefeat = false;
      handleCombatAction();
    `);
    while (g.run("combat.phase") === 'message') g.run('handleCombatAction()');
    const playerHpAfterObserve = g.run('stats.hp');
    // skipChance = 0.5 (not special); Math.random()=0.5 -> `0.5 < 0.5` is false -> enemy DOES close in.
    const expectedObsEDmg = Math.max(1, Math.round(10 * (0.8 + 0.5 * 0.4) - 3));
    assert.strictEqual(30 - playerHpAfterObserve, expectedObsEDmg, `observe self-check: damage mismatch (real=${30 - playerHpAfterObserve}, expected=${expectedObsEDmg})`);

    // ── Item-use self-check ─────────────────────────────────────────────────
    // Regression guard for the item-use fix: using a potion must now consume
    // the turn and let the enemy respond via enemyTurnResponse(), the same
    // atk/effectiveDef formula as everywhere else, rather than being a free
    // action with no counter-attack at all.
    g.run(`
      stats.hp = 10; stats.maxHp = 100; stats.def = 3;
      stats.weapon = null; stats.armor = null; stats.shield = null; stats.accessory = null;
      stats.items = [{ name: 'Potion', type: 'potion', heals: 20, price: 30 }];
      statusEffects = [];
      combat.enemy = { name: 'SelfCheckDummy3', hp: 100, maxHp: 100, atk: 10, def: 2, spd: 5 };
      combat.phase = 'item'; combat.itemCursor = 0;
      combat.messageQueue = []; combat.pendingVictory = false; combat.pendingDefeat = false;
      handleCombatAction();
    `);
    const itemsAfterUse = g.run('stats.items.length');
    while (g.run("combat.phase") === 'message') g.run('handleCombatAction()');
    const playerHpAfterItem = g.run('stats.hp');
    const finalPhaseAfterItem = g.run('combat.phase');
    // healed = min(20, 100-10) = 20 -> hp 10+20=30; enemy responds:
    // atkRoll = 10*(0.8+0.5*0.4)=10; eDmg = max(1, round(10-3)) = 7 -> hp 30-7=23
    const expectedHpAfterItem = 10 + 20 - Math.max(1, Math.round(10 * (0.8 + 0.5 * 0.4) - 3));
    assert.strictEqual(itemsAfterUse, 0, 'item self-check: the potion should be consumed exactly once');
    assert.strictEqual(playerHpAfterItem, expectedHpAfterItem, `item self-check: final HP mismatch (real=${playerHpAfterItem}, expected=${expectedHpAfterItem}) — did the enemy response fire?`);
    assert.strictEqual(finalPhaseAfterItem, 'choose', 'item self-check: combat should resolve back to choose once the enemy response message drains');

    console.log('[self-check] PASSED — attack, observe, and item-use formulas match the real combat.js exactly.\n');
  } finally {
    Math.random = realRandom;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 3 — reimplemented (and now verified) combat model, driven by the
// seeded PRNG for deterministic Monte Carlo.
// ─────────────────────────────────────────────────────────────────────────
function effAtk(p) { return p.atk; } // gear already folded into p.atk by caller
function effDef(p, statuses) { return Math.max(0, p.def - (statuses.muddied ? 1 : 0)); }
function effSpd(p, statuses, rng) {
  if (statuses.slither) return Math.floor(rng() * 20) + 1;
  return Math.max(1, p.spd - (statuses.muddied ? 2 : 0));
}

// Faithful port of applyEnemyHitEffects() (combat.js) — enemy-name-keyed and
// curseChance-keyed status application on every landed enemy hit.
function applyEnemyHitEffects(enemyTemplate, statuses, rng) {
  if (enemyTemplate.name === 'Briar Warden' && !statuses.muddied && rng() < 0.30) statuses.muddied = true;
  if (enemyTemplate.name === 'Corpse Slug' && !statuses.slither && rng() < 0.30) statuses.slither = true;
  if (enemyTemplate.name === 'Shade Wraith' && !statuses.slither && rng() < 0.25) statuses.slither = true;
  // Fen Witch's poison only ticks on overworld movement, not in combat — no in-fight effect.
  if (enemyTemplate.curseChance && !statuses.cursed && rng() < enemyTemplate.curseChance) statuses.cursed = true;
}

// One fight. player: {atk,def,spd,hp,maxHp}. Returns outcome record.
// opts.potions: number of in-fight heals available once HP falls to
// opts.healThreshold (0..1) of max, opts.potionHeal per use. Each heal now
// consumes the turn and exposes the player to a normal enemy hit — combat.js
// used to let item use skip the enemy's turn entirely (see BALANCE_REPORT.md
// finding B1); that's fixed, and this model was updated to match.
function simulateFight(playerIn, enemyTemplateIn, rng, opts) {
  opts = opts || {};
  const potionHeal = opts.potionHeal || 0;
  const healThreshold = opts.healThreshold != null ? opts.healThreshold : 0.35;
  let potionsLeft = opts.potions || 0;

  const player = { ...playerIn, hp: playerIn.maxHp };
  const enemy = { hp: enemyTemplateIn.maxHp };
  const statuses = { muddied: false, slither: false, cursed: false };
  let turns = 0;
  let damageTaken = 0;
  let potionsUsed = 0;
  const MAX_TURNS = 500;

  while (player.hp > 0 && enemy.hp > 0 && turns < MAX_TURNS) {
    turns++;

    // Healing consumes the turn (combat.js fix: the item phase now runs
    // enemyTurnResponse(), the same atk/effectiveDef formula used everywhere
    // else, right after the item's effect resolves). No turn-order check
    // here — like Observe and a failed Run, the enemy's response to an item
    // turn isn't gated on relative SPD, it always fires.
    if (potionsLeft > 0 && player.hp / player.maxHp <= healThreshold) {
      const healed = Math.min(potionHeal, player.maxHp - player.hp);
      player.hp = Math.min(player.maxHp, player.hp + healed);
      potionsLeft--; potionsUsed++;
      const atkRoll = enemyTemplateIn.atk * (0.8 + rng() * 0.4);
      const eDmg = Math.max(1, Math.round(atkRoll - effDef(player, statuses)));
      player.hp = Math.max(0, player.hp - eDmg);
      damageTaken += eDmg;
      if (player.hp > 0) applyEnemyHitEffects(enemyTemplateIn, statuses, rng);
      continue;
    }

    const playerSpd = effSpd(player, statuses, rng);
    const enemySpd  = enemyTemplateIn.spd;
    const playerFirst = playerSpd > enemySpd || (playerSpd === enemySpd && rng() < 0.5);

    const enemyDefending = !!(enemyTemplateIn.defendChance && rng() < enemyTemplateIn.defendChance);
    const rawPDmg = Math.max(1, effAtk(player) - enemyTemplateIn.def);
    const cursedFumble = !enemyDefending && statuses.cursed && rng() < 0.25;
    const pDmg = enemyDefending ? Math.max(1, Math.floor(rawPDmg / 2)) : (cursedFumble ? 1 : rawPDmg);
    const atkRoll = enemyTemplateIn.atk * (0.8 + rng() * 0.4);
    const eDmg = Math.max(1, Math.round(atkRoll - effDef(player, statuses)));

    if (enemyDefending) {
      enemy.hp = Math.max(0, enemy.hp - pDmg);
    } else if (playerFirst) {
      enemy.hp = Math.max(0, enemy.hp - pDmg);
      if (enemy.hp > 0) {
        player.hp = Math.max(0, player.hp - eDmg);
        damageTaken += eDmg;
        if (player.hp > 0) applyEnemyHitEffects(enemyTemplateIn, statuses, rng);
      }
    } else {
      player.hp = Math.max(0, player.hp - eDmg);
      damageTaken += eDmg;
      if (player.hp > 0) {
        applyEnemyHitEffects(enemyTemplateIn, statuses, rng);
        enemy.hp = Math.max(0, enemy.hp - pDmg);
      }
    }
  }

  return {
    win: enemy.hp <= 0 && player.hp > 0,
    timedOut: turns >= MAX_TURNS,
    turns,
    hpFracRemaining: Math.max(0, player.hp) / player.maxHp,
    damageTaken,
    potionsUsed,
  };
}

function monteCarlo(player, enemyTemplate, seed, trials, opts) {
  const rng = mulberry32(seed);
  let wins = 0, totalTurns = 0, totalHpFrac = 0, totalDmg = 0, deaths = 0, timeouts = 0;
  for (let i = 0; i < trials; i++) {
    const r = simulateFight(player, enemyTemplate, rng, opts);
    if (r.win) { wins++; totalHpFrac += r.hpFracRemaining; }
    else if (!r.timedOut) deaths++;
    if (r.timedOut) timeouts++;
    totalTurns += r.turns;
    totalDmg += r.damageTaken;
  }
  return {
    winRate: wins / trials,
    deathRate: deaths / trials,
    timeoutRate: timeouts / trials,
    avgTurns: totalTurns / trials,
    avgHpFracAtWin: wins > 0 ? totalHpFrac / wins : 0,
    avgDamageTaken: totalDmg / trials,
  };
}

function dangerRating(stats) {
  if (stats.deathRate === 0 && stats.avgHpFracAtWin >= 0.75) return 'Trivial';
  if (stats.deathRate < 0.02 && stats.avgHpFracAtWin >= 0.5) return 'Easy';
  if (stats.deathRate < 0.10 && stats.avgHpFracAtWin >= 0.3) return 'Moderate';
  if (stats.deathRate < 0.35) return 'Dangerous';
  return 'Deadly';
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 4 — player level curve (from the real XP_THRESHOLDS / level-up deltas)
// ─────────────────────────────────────────────────────────────────────────
function baseStatsAtLevel(level) {
  // Mirrors state.js checkLevelUp(): +10 maxHp, +2 atk, +1 def per level; SPD never changes with level.
  return {
    level,
    maxHp: STARTING_STATS.maxHp + 10 * (level - 1),
    atk:   STARTING_STATS.atk + 2 * (level - 1),
    def:   STARTING_STATS.def + 1 * (level - 1),
    spd:   STARTING_STATS.spd,
  };
}

// Illustrative gear tiers used for benchmarking only — NOT extracted from any
// scripted level-gate in the game (there isn't one). See BALANCE_REPORT.md
// for the reasoning behind each tier's contents and assumed availability.
const GEAR_TIERS = {
  'T0 unequipped':                { atk: 0,  def: 0,  spd: 0, note: 'before Aldric issues the starting kit' },
  'T1 starting kit':              { atk: 4,  def: 3,  spd: 0, note: 'Iron Sword + Leather Armor (free, day 1)' },
  'T2 + Iron Shield':             { atk: 4,  def: 6,  spd: 0, note: '+ Iron Shield (merchant, 70g)' },
  'T3 dungeon-1 chest gear':      { atk: 7,  def: 11, spd: 2, note: 'Steel Sword (chest) + Iron Targe (chest) + Swiftstone (90g)' },
  'T4 sluice/traveller gear':     { atk: 10, def: 16, spd: 4, note: 'Warden Blade (chest) + Shadow Cloak (280g) + Iron Targe (chest) + Wraithband (200g)' },
  'T5 best traveller gear':       { atk: 12, def: 16, spd: 4, note: 'Dragon Blade (350g) + Shadow Cloak (280g) + Iron Targe (chest) + Wraithband (200g)' },
};

function playerAt(level, tierName) {
  const base = baseStatsAtLevel(level);
  const gear = GEAR_TIERS[tierName];
  return { atk: base.atk + gear.atk, def: base.def + gear.def, spd: base.spd + gear.spd, maxHp: base.maxHp };
}

// ─────────────────────────────────────────────────────────────────────────
// PRINT — level curve
// ─────────────────────────────────────────────────────────────────────────
console.log('='.repeat(78));
console.log('BALANCE SIMULATION — empire-game');
console.log('='.repeat(78) + '\n');

selfCheck();

console.log('--- Player level curve (base stats, no gear) ---');
console.log('Lvl | XP to reach | MaxHP | ATK | DEF | SPD');
for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
  const b = baseStatsAtLevel(lvl);
  const xpNeeded = lvl === 1 ? 0 : XP_THRESHOLDS[lvl - 1];
  console.log(`${String(lvl).padStart(3)} | ${String(xpNeeded).padStart(11)} | ${String(b.maxHp).padStart(5)} | ${String(b.atk).padStart(3)} | ${String(b.def).padStart(3)} | ${String(b.spd).padStart(3)}`);
}

console.log('\n--- Gear tiers (illustrative benchmarking assumption, see report) ---');
for (const [name, g2] of Object.entries(GEAR_TIERS)) {
  console.log(`${name.padEnd(28)} ATK+${g2.atk} DEF+${g2.def} SPD+${g2.spd}   (${g2.note})`);
}

// ─────────────────────────────────────────────────────────────────────────
// PRINT — enemy pools + per-pool average XP/gold + danger vs a "typical"
// player for that pool (levels are an editorial assignment based on
// geography ordering established in TRANSITION_AUDIT.md's overworld chain).
// ─────────────────────────────────────────────────────────────────────────
const POOL_BENCHMARK = {
  'MAP (start overworld)':            { level: 1, tier: 'T0 unequipped' },
  'MAP2 (overworld, post-start)':     { level: 1, tier: 'T1 starting kit' },
  'MAP3 / MAP_N1 / MAP_N2 / MAP3_N1 / MAP3_N2 (far overworld)': { level: 2, tier: 'T2 + Iron Shield' },
  'MAP4 / MAP5 (Thornmere)':          { level: 3, tier: 'T3 dungeon-1 chest gear' },
  'East Sluice':                      { level: 1, tier: 'T1 starting kit' },
  "Mirethyst's Vault":                { level: 2, tier: 'T2 + Iron Shield' },
  'Dungeon floor 1':                  { level: 2, tier: 'T2 + Iron Shield' },
  'Dungeon floors 2-3':               { level: 3, tier: 'T3 dungeon-1 chest gear' },
  'Dungeon floors 4-5':               { level: 4, tier: 'T3 dungeon-1 chest gear' },
  'Dungeon floors 6-7':               { level: 5, tier: 'T4 sluice/traveller gear' },
  'Dungeon floor 8':                  { level: 6, tier: 'T4 sluice/traveller gear' },
  'Dungeon floors 9-10 (horror)':     { level: 7, tier: 'T5 best traveller gear' },
};

console.log('\n' + '='.repeat(78));
console.log('ENEMY POOLS BY AREA');
console.log('='.repeat(78));

let seedCounter = 1000;
const poolResults = {};
for (const [poolName, templates] of Object.entries(POOLS)) {
  const bench = POOL_BENCHMARK[poolName];
  const player = playerAt(bench.level, bench.tier);
  console.log(`\n--- ${poolName} --- (benchmark: Lv.${bench.level}, ${bench.tier} => ATK${player.atk}/DEF${player.def}/SPD${player.spd}/HP${player.maxHp})`);
  console.log('Enemy            HP  ATK DEF SPD | XP  Gold(avg) | WinRate DeathRate AvgTurns HP%@Win | Danger');
  const rows = [];
  for (const t of templates) {
    const mc = monteCarlo(player, t, seedCounter++, 4000, { potions: 0 });
    const avgGold = (t.goldMin + t.goldMax) / 2;
    const rating = dangerRating(mc);
    rows.push({ name: t.name, t, mc, avgGold, rating });
    console.log(
      `${t.name.padEnd(16)} ${String(t.hp).padStart(3)} ${String(t.atk).padStart(3)} ${String(t.def).padStart(3)} ${String(t.spd).padStart(3)} | ` +
      `${String(t.xp).padStart(3)} ${avgGold.toFixed(1).padStart(6)}      | ` +
      `${(mc.winRate * 100).toFixed(1).padStart(6)}% ${(mc.deathRate * 100).toFixed(1).padStart(8)}% ${mc.avgTurns.toFixed(1).padStart(8)} ${(mc.avgHpFracAtWin * 100).toFixed(0).padStart(6)}%  | ${rating}`
    );
  }
  const avgXP = templates.reduce((s, t) => s + t.xp, 0) / templates.length;
  const avgGold = templates.reduce((s, t) => s + (t.goldMin + t.goldMax) / 2, 0) / templates.length;
  poolResults[poolName] = { rows, avgXP, avgGold, bench, player };
  console.log(`Pool average: ${avgXP.toFixed(1)} XP/fight, ${avgGold.toFixed(1)} gold/fight`);
}

// ─────────────────────────────────────────────────────────────────────────
// PRINT — fights needed per level, assuming the player fights exclusively
// in one pool (isolates each area's grind rate; real play mixes areas).
// ─────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(78));
console.log('FIGHTS-PER-LEVEL, BY POOL (if player fought exclusively in that pool)');
console.log('='.repeat(78));
for (const [poolName, data] of Object.entries(poolResults)) {
  const fightsForLvl = [];
  for (let lvl = 1; lvl < MAX_LEVEL; lvl++) {
    const xpNeeded = XP_THRESHOLDS[lvl] - (lvl === 1 ? 0 : XP_THRESHOLDS[lvl - 1]);
    fightsForLvl.push(Math.ceil(xpNeeded / data.avgXP));
  }
  console.log(`${poolName.padEnd(58)} fights per level-up (Lv1->2, 2->3, ...): [${fightsForLvl.join(', ')}]`);
}

// ─────────────────────────────────────────────────────────────────────────
// PRINT — economy: potion/elixir affordability by pool, gear cost-effectiveness
// ─────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(78));
console.log('ECONOMY');
console.log('='.repeat(78));
console.log('\n--- Fights needed to afford a Potion (30g) / Elixir (80g) / Inn rest (20g), by pool avg gold ---');
for (const [poolName, data] of Object.entries(poolResults)) {
  const potionFights = Math.ceil(30 / data.avgGold);
  const elixirFights = Math.ceil(80 / data.avgGold);
  const restFights = Math.ceil(20 / data.avgGold);
  console.log(`${poolName.padEnd(58)} Potion: ${potionFights}  Elixir: ${elixirFights}  Inn rest: ${restFights}  (avg ${data.avgGold.toFixed(1)}g/fight)`);
}

console.log('\n--- Shop gear cost-effectiveness (gold per +1 stat point) ---');
console.log('Item              Type       Bonus  Price  Gold/point  Source');
for (const item of [...MERCHANT_STOCK, ...TRAVELLER_STOCK]) {
  if (item.bonus === undefined) continue;
  const perPoint = item.price / item.bonus;
  const source = MERCHANT_STOCK.includes(item) ? 'Merchant (Calwick, always)' : 'Traveller (1/3 chance/town visit, not Drenwick)';
  console.log(`${item.name.padEnd(17)} ${item.type.padEnd(10)} ${String(item.bonus).padStart(5)}  ${String(item.price).padStart(5)}  ${perPoint.toFixed(1).padStart(10)}  ${source}`);
}

console.log('\n--- Chest/reward gear (free — for comparison against shop gold/point above) ---');
const CHEST_GEAR = [
  { name: 'Steel Sword',     type: 'weapon',    bonus: 7, price: 150, source: 'Dungeon floor-1 chest' },
  { name: 'Iron Targe',      type: 'shield',    bonus: 8, price: 180, source: 'Dungeon floor-1 hidden alcove chest' },
  { name: 'Warden Blade',    type: 'weapon',    bonus: 10, price: 220, source: 'Sluice secret chest (false wall)' },
  { name: 'Void Shard',      type: 'accessory', bonus: 5, price: 180, source: 'Sluice level-3 chest' },
  { name: 'Fen Mask',        type: 'accessory', bonus: 5, price: 200, source: 'Sluice level-3 deep secret chest' },
  { name: 'Mirestone Blade', type: 'weapon',    bonus: 8, price: 200, source: "Mirethyst's Vault chest" },
  { name: 'Fen Cowl',        type: 'armor',     bonus: 4, price: 120, source: "Mirethyst's Vault NPC gift" },
];
for (const item of CHEST_GEAR) {
  console.log(`${item.name.padEnd(17)} ${item.type.padEnd(10)} ${String(item.bonus).padStart(5)}  free (${item.price}g shop-equivalent value)  ${item.source}`);
}

// ─────────────────────────────────────────────────────────────────────────
// PRINT — boss/special encounters, at plausible player states, with and
// without a 3-potion stock (potions now cost a turn — see the fixed
// item-phase behavior noted above — so this is no longer a free-heal
// exploit, just "does carrying potions help")
// ─────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(78));
console.log('BOSS / SPECIAL ENCOUNTERS');
console.log('='.repeat(78));

// Plausible player state at first-availability, per quest-gate found in QUEST_TRACE.md / combat.js comments.
const SPECIAL_BENCHMARK = {
  'Briar Warden':        { level: 2, tier: 'T1 starting kit', note: 'gated on sluice_reward_given — reachable very early' },
  'Smuggler Guard':      { level: 3, tier: 'T2 + Iron Shield', note: 'gated on dispatch_rewarded (MainQuest 2)' },
  'Polwick':             { level: 3, tier: 'T2 + Iron Shield', note: 'fought immediately after the guard, same visit' },
  'Essa':                { level: 3, tier: 'T2 + Iron Shield', note: 'fought immediately after Polwick, same visit' },
  'Pale Sentry':         { level: 4, tier: 'T3 dungeon-1 chest gear', note: '500 HP persists across encounters — chip-away by design' },
  'Mulholland':          { level: 5, tier: 'T3 dungeon-1 chest gear', note: 'guards dungeon floor 4->5 stairs' },
  'Den Wraith':          { level: 4, tier: 'T3 dungeon-1 chest gear', note: 'available day>=11' },
  'Kolm (sailor brawl)': { level: 3, tier: 'T2 + Iron Shield', note: 'optional inn brawl, Dayoff only' },
  'Takomo':              { level: 6, tier: 'T4 sluice/traveller gear', note: 'secret Drenwick Waterfront chamber' },
  'Wrongteeth (boss)':   { level: 5, tier: 'T3 dungeon-1 chest gear', note: 'dungeon floor 5, gates floor 5->6' },
  'Rainfish (x3 chain, per-fish)': { level: 2, tier: 'T1 starting kit', note: 'forced 3-fight chain, cannot flee' },
};

console.log('\nEnemy                  HP   ATK DEF SPD | Benchmark player          | No-potion: Win% Death% AvgTurns HP%@Win Danger | +3 potions: Win% Death%');
for (const [name, template] of Object.entries(SPECIALS)) {
  const bench = SPECIAL_BENCHMARK[name];
  const player = playerAt(bench.level, bench.tier);
  const noPotion = monteCarlo(player, template, seedCounter++, 4000, { potions: 0 });
  const withPotion = monteCarlo(player, template, seedCounter++, 4000, { potions: 3, potionHeal: 20, healThreshold: 0.35 });
  console.log(
    `${name.padEnd(22)} ${String(template.hp).padStart(4)} ${String(template.atk).padStart(3)} ${String(template.def).padStart(3)} ${String(template.spd).padStart(3)} | ` +
    `Lv.${bench.level} ${bench.tier.padEnd(22)} | ` +
    `${(noPotion.winRate * 100).toFixed(1).padStart(5)}% ${(noPotion.deathRate * 100).toFixed(1).padStart(6)}% ${noPotion.avgTurns.toFixed(1).padStart(8)} ${(noPotion.avgHpFracAtWin * 100).toFixed(0).padStart(6)}%  ${dangerRating(noPotion).padEnd(9)} | ` +
    `${(withPotion.winRate * 100).toFixed(1).padStart(5)}% ${(withPotion.deathRate * 100).toFixed(1).padStart(6)}%`
  );
  console.log(`   note: ${bench.note}`);
}

// ─────────────────────────────────────────────────────────────────────────
// PRINT — Observe's effect on expected incoming damage vs Attack
// ─────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(78));
console.log('OBSERVE — EFFECT ON EXPECTED INCOMING DAMAGE');
console.log('='.repeat(78));
console.log('Compares one "Observe" action against one "Attack" action, same matchup, no kill this turn.');
console.log('Enemy            Player(Lv/tier)              | AvgEnemyDmg | P(hit)Observe P(hit)Attack | E[dmg]Observe E[dmg]Attack');
{
  const rngCheck = mulberry32(99);
  for (const [poolName, templates] of Object.entries(POOLS)) {
    const bench = POOL_BENCHMARK[poolName];
    const player = playerAt(bench.level, bench.tier);
    for (const t of templates) {
      const def = effDef(player, { muddied: false });
      // Average eDmg magnitude when a hit lands (atk multiplier averages to 1.0 over [0.8,1.2])
      const avgEDmg = Math.max(1, Math.round(t.atk * 1.0 - def));
      const isSpecial = false; // none of the area pools are "special" fights
      const skipChance = isSpecial ? 0.25 : 0.50;
      const observeHitChance = 1 - skipChance;
      // Attack: player takes a hit unless (player is faster AND kills this turn) or enemy braces.
      // Approximate "kills this turn" as a coarse indicator using single-hit vs remaining HP is fight-dependent,
      // so this table reports the STEADY-STATE per-exchange hit chance (mid-fight turn, not a kill turn):
      // player faster -> enemy still counters at 100% (no brace) unless defendChance
      const playerFaster = player.spd > t.spd;
      const attackHitChance = t.defendChance ? (1 - t.defendChance) : 1.0; // mid-fight turn, non-kill
      const eObserve = observeHitChance * avgEDmg;
      const eAttack = attackHitChance * avgEDmg;
      console.log(
        `${t.name.padEnd(16)} Lv.${bench.level} ${bench.tier.padEnd(22)} | ${String(avgEDmg).padStart(4)}       | ` +
        `${(observeHitChance * 100).toFixed(0).padStart(6)}%       ${(attackHitChance * 100).toFixed(0).padStart(6)}%     | ` +
        `${eObserve.toFixed(2).padStart(6)}       ${eAttack.toFixed(2)}`
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PRINT — encounter cadence (geometry: how often the player fights per tile
// walked on encounter terrain)
// ─────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(78));
console.log('ENCOUNTER CADENCE');
console.log('='.repeat(78));
console.log(`ENCOUNTER_CHANCE = ${ENCOUNTER_CHANCE} per tile crossed on encounter terrain (checked every 16 movement frames == 1 tile at SPEED=2px/frame).`);
console.log(`ENCOUNTER_COOLDOWN = ${ENCOUNTER_COOLDOWN} frames (~${(ENCOUNTER_COOLDOWN / 60).toFixed(1)}s, ~${(ENCOUNTER_COOLDOWN / 16).toFixed(1)} tiles of travel time) of guaranteed safety after each fight.`);
console.log(`Expected tiles between encounter rolls succeeding: ${(1 / ENCOUNTER_CHANCE).toFixed(1)} (geometric mean).`);
console.log(`Expected total tiles walked per encounter (roll gap + mandatory cooldown gap): ~${(1 / ENCOUNTER_CHANCE + ENCOUNTER_COOLDOWN / 16).toFixed(1)} tiles.`);
console.log('(Continuous-movement-on-encounter-terrain estimate; real routes mix in non-grass tiles, town, and menus, so actual fights/minute in play will be lower than this ceiling.)');

console.log('\nDone.');
