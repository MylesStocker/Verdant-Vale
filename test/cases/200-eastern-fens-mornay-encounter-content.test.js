'use strict';
// Eastern Fens — Mornay approach: the full 8-enemy roster (Botfly, Waspthra,
// Mire Toad reuse, Sparkeel, Mudwrack Snapper, Fen Rootworm, Willow-Veiled
// Stalker, Hollowreed Choker) and the two authored encounter-formation tables
// ({ id, enemies, weight }, the closed schema in encounter-formations.js) —
// an easy-leaning table (meant for chunk column <= 12, Eastern Bank through
// Travellers' Rise) and a hard-leaning table (column >= 13, Travellers' Rise
// to Mornay Threshold). Both tables share the same 16 formation ids/
// compositions; only the weights differ. Content and validation only — NOT
// yet assigned to any geographic pool/MAP_METADATA entry, because the live
// geographic dispatcher (startCanonicalPartyEncounter(), combat.js) does not
// yet call encounterFormations.select() (see PROJECT_STATUS.md). This suite
// proves the content is correct and that it is genuinely inert: nothing here
// is reachable through ordinary play yet, and nothing here is a second
// selector/dispatcher of its own.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function ctx() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  return g;
}
const J = (g, e) => JSON.parse(g.run(e));

const NEW_TEMPLATES = {
  enemy_botfly:               { id: 'enemy_botfly', name: 'Botfly', hp: 32, maxHp: 32, atk: 16, def: 2, spd: 14, xp: 38, goldMin: 8, goldMax: 15, poisonChance: 0.22 },
  enemy_waspthra:             { id: 'enemy_waspthra', name: 'Waspthra', hp: 56, maxHp: 56, atk: 24, def: 5, spd: 11, xp: 60, goldMin: 14, goldMax: 26, acidChance: 0.30 },
  enemy_sparkeel:             { id: 'enemy_sparkeel', name: 'Sparkeel', hp: 42, maxHp: 42, atk: 23, def: 6, spd: 19, xp: 50, goldMin: 11, goldMax: 20, dazzleChance: 0.40 },
  enemy_mudwrack_snapper:     { id: 'enemy_mudwrack_snapper', name: 'Mudwrack Snapper', hp: 115, maxHp: 115, atk: 27, def: 20, spd: 7, xp: 70, goldMin: 16, goldMax: 28, defendChance: 0.35 },
  enemy_fen_rootworm:         { id: 'enemy_fen_rootworm', name: 'Fen Rootworm', hp: 80, maxHp: 80, atk: 22, def: 10, spd: 9, xp: 58, goldMin: 13, goldMax: 22, regenPerTurn: 8 },
  enemy_willow_veiled_stalker:{ id: 'enemy_willow_veiled_stalker', name: 'Willow-Veiled Stalker', hp: 68, maxHp: 68, atk: 27, def: 8, spd: 14, xp: 72, goldMin: 17, goldMax: 30, meleeArmor: 90, counterChance: 0.9 },
  enemy_hollowreed_choker:    { id: 'enemy_hollowreed_choker', name: 'Hollowreed Choker', hp: 58, maxHp: 58, atk: 21, def: 7, spd: 10, xp: 44, goldMin: 11, goldMax: 19 },
};
const EXPECTED_CAPABILITIES = {
  enemy_botfly: ['basic_attack', 'standard_observe', 'standard_rewards', 'poison_on_hit'],
  enemy_waspthra: ['basic_attack', 'standard_observe', 'standard_rewards', 'acid_corrosion'],
  enemy_sparkeel: ['basic_attack', 'standard_observe', 'standard_rewards', 'dazzle_on_hit'],
  enemy_mudwrack_snapper: ['basic_attack', 'standard_observe', 'standard_rewards', 'brace'],
  enemy_fen_rootworm: ['basic_attack', 'standard_observe', 'standard_rewards', 'regeneration'],
  enemy_willow_veiled_stalker: ['basic_attack', 'standard_observe', 'standard_rewards', 'melee_armor', 'counterattack'],
  // Deliberately ordinary/no mechanic: splits is not genuinely reusable yet
  // (hardcodes The Seep's successor stats/text) -- see data.js comment.
  enemy_hollowreed_choker: ['basic_attack', 'standard_observe', 'standard_rewards'],
};

const EASY_WEIGHTS = {
  formation_botfly_solo: 16, formation_sparkeel_solo: 14, formation_botfly_duo: 12,
  formation_rootworm_solo: 10, formation_mire_toad_pair_mixed: 10, formation_choker_solo: 8,
  formation_botfly_sparkeel: 8, formation_waspthra_solo: 6, formation_botfly_pair_waspthra: 4,
  formation_mire_toad_trio: 3, formation_waspthra_duo: 3, formation_snapper_solo: 4,
  formation_stalker_solo: 4, formation_snapper_stalker: 2, formation_waspthra_trio: 1, formation_the_gauntlet: 1,
};
const HARD_WEIGHTS = {
  formation_botfly_solo: 4, formation_sparkeel_solo: 4, formation_botfly_duo: 4,
  formation_rootworm_solo: 6, formation_mire_toad_pair_mixed: 6, formation_choker_solo: 6,
  formation_botfly_sparkeel: 6, formation_waspthra_solo: 10, formation_botfly_pair_waspthra: 10,
  formation_mire_toad_trio: 8, formation_waspthra_duo: 10, formation_snapper_solo: 12,
  formation_stalker_solo: 12, formation_snapper_stalker: 10, formation_waspthra_trio: 8, formation_the_gauntlet: 10,
};
const COMPOSITIONS = {
  formation_botfly_solo: ['enemy_botfly'],
  formation_sparkeel_solo: ['enemy_sparkeel'],
  formation_botfly_duo: ['enemy_botfly', 'enemy_botfly'],
  formation_rootworm_solo: ['enemy_fen_rootworm'],
  formation_mire_toad_pair_mixed: ['enemy_mire_toad_male', 'enemy_mire_toad_female'],
  formation_choker_solo: ['enemy_hollowreed_choker'],
  formation_botfly_sparkeel: ['enemy_botfly', 'enemy_sparkeel'],
  formation_waspthra_solo: ['enemy_waspthra'],
  formation_botfly_pair_waspthra: ['enemy_botfly', 'enemy_botfly', 'enemy_waspthra'],
  formation_mire_toad_trio: ['enemy_mire_toad_male', 'enemy_mire_toad_male', 'enemy_mire_toad_female'],
  formation_waspthra_duo: ['enemy_waspthra', 'enemy_waspthra'],
  formation_snapper_solo: ['enemy_mudwrack_snapper'],
  formation_stalker_solo: ['enemy_willow_veiled_stalker'],
  formation_snapper_stalker: ['enemy_mudwrack_snapper', 'enemy_willow_veiled_stalker'],
  formation_waspthra_trio: ['enemy_waspthra', 'enemy_waspthra', 'enemy_waspthra'],
  formation_the_gauntlet: ['enemy_waspthra', 'enemy_mudwrack_snapper', 'enemy_willow_veiled_stalker'],
};
const ENEMY_TEMPLATE_REGISTRY_NAMES = {
  enemy_botfly: 'botfly', enemy_waspthra: 'waspthra', enemy_sparkeel: 'sparkeel',
  enemy_mudwrack_snapper: 'mudwrack_snapper', enemy_fen_rootworm: 'fen_rootworm',
  enemy_willow_veiled_stalker: 'willow-veiled_stalker', enemy_hollowreed_choker: 'hollowreed_choker',
  enemy_mire_toad_male: 'mire_toad', enemy_mire_toad_female: 'mire_toad',
};

module.exports = {
  name: 'Eastern Fens — Mornay approach: full 8-enemy roster, easy/hard formation tables, inertness',
  run() {
    const g = ctx();

    // ── 1. Exact authored stats for the five new templates ──────────────────
    for (const [id, spec] of Object.entries(NEW_TEMPLATES)) {
      assert.deepEqual(J(g, `JSON.stringify(ENEMY_TEMPLATE_REGISTRY['${id}'])`), spec, id + ': matches the authored spec exactly');
      assert.deepEqual(J(g, `JSON.stringify(enemyCapabilityMetadata(ENEMY_TEMPLATE_REGISTRY['${id}']).capabilities)`),
        EXPECTED_CAPABILITIES[id], id + ': exactly the intended mechanic, nothing else');
    }

    // ── 2. Pool registration (combat.js) covers all 7 new-content ids ───────
    assert.deepEqual(J(g, "JSON.stringify(ENEMY_TEMPLATE_POOLS.find(p=>p.id==='pool_eastern_fens_mornay').templates.map(t=>t.id))"),
      ['enemy_botfly', 'enemy_waspthra', 'enemy_sparkeel', 'enemy_mudwrack_snapper', 'enemy_fen_rootworm', 'enemy_willow_veiled_stalker', 'enemy_hollowreed_choker']);

    // ── 3. Both formation tables: schema, weights, order, shared ids/compositions ─
    for (const [table, weights] of [['EASTERN_FENS_MORNAY_EASY_FORMATIONS', EASY_WEIGHTS], ['EASTERN_FENS_MORNAY_HARD_FORMATIONS', HARD_WEIGHTS]]) {
      const normalized = J(g, `JSON.stringify(encounterFormations.normalizePool(${table}))`);
      assert.equal(normalized.mode, 'weighted');
      assert.equal(normalized.formations.length, 16, table + ': 16 formations');
      const total = Object.values(weights).reduce((a, b) => a + b, 0);
      assert.equal(normalized.totalWeight, total, table + ': total weight');
      for (const f of normalized.formations) {
        assert.deepEqual(f.enemies, COMPOSITIONS[f.id], table + ': ' + f.id + ' composition');
        assert.equal(f.weight, weights[f.id], table + ': ' + f.id + ' weight');
      }
      assert.deepEqual(normalized.formations.map(f => f.id).sort(), Object.keys(weights).sort(), table + ': exact formation id set');
    }
    // Same ids/compositions in both tables -- only weights differ.
    const easyIds = J(g, 'JSON.stringify(EASTERN_FENS_MORNAY_EASY_FORMATIONS.map(f=>f.id))').sort();
    const hardIds = J(g, 'JSON.stringify(EASTERN_FENS_MORNAY_HARD_FORMATIONS.map(f=>f.id))').sort();
    assert.deepEqual(easyIds, hardIds, 'easy and hard tables share the exact same formation id set');

    // ── 4. Mire Toad ids are reused exactly as already registered elsewhere ─
    for (const id of ['enemy_mire_toad_male', 'enemy_mire_toad_female'])
      assert.deepEqual(J(g, `JSON.stringify(ENEMY_TEMPLATE_REGISTRY['${id}'])`),
        J(g, `JSON.stringify(MIRE_TOAD_ENEMY_TEMPLATES.find(t=>t.id==='${id}'))`),
        id + ': untouched, reused exactly as already registered elsewhere');

    // ── 5. Both tables frozen: table, every formation, every enemies array ──
    for (const table of ['EASTERN_FENS_MORNAY_EASY_FORMATIONS', 'EASTERN_FENS_MORNAY_HARD_FORMATIONS']) {
      assert.equal(g.run(`Object.isFrozen(${table})`), true, table + ' is frozen');
      assert.equal(g.run(`${table}.every(f=>Object.isFrozen(f)&&Object.isFrozen(f.enemies))`), true,
        table + ': every formation and its enemies array is frozen');
    }

    // ── 6. Every formation validates individually via the closed schema ─────
    // Validated BY REFERENCE inside the vm (a JSON round-trip through Node
    // would strip Object.freeze and produce a fresh unfrozen copy -- exactly
    // what validateDefinition's "must be immutable" check is there to catch).
    for (const table of ['EASTERN_FENS_MORNAY_EASY_FORMATIONS', 'EASTERN_FENS_MORNAY_HARD_FORMATIONS']) {
      for (let i = 0; i < 16; i++) {
        assert.doesNotThrow(() => g.run(`encounterFormations.validateDefinition(${table}[${i}])`),
          `${table}[${i}] validates against the closed { id, enemies, weight } schema`);
      }
    }

    // ── 7. INERTNESS: not reachable from any live geographic pool yet ───────
    assert.equal(
      g.run("Object.values(MAP_METADATA).some(m=>m.encounterPool===EASTERN_FENS_MORNAY_ENEMY_TEMPLATES)"),
      false, 'no live map yet points its encounterPool at the new enemy templates');
    assert.match(g.run('startCanonicalPartyEncounter.toString()'), /pool\[Math\.floor/,
      'the live geographic dispatcher still does a flat single-template draw; encounterFormations.select is not yet called from it');
    assert.doesNotMatch(g.run('startCanonicalPartyEncounter.toString()'), /encounterFormations\.select/,
      'confirms the exact missing seam this suite documents, rather than asserting it blind');

    // ── 8. End-to-end: canonicalPartyCombat.enter() accepts every authored ──
    // formation in BOTH tables today, with distinct runtime identities for
    // duplicate templates and authored order preserved. A fresh context per
    // formation (a live canonical party battle has no mid-test cancel path).
    const allFormations = [
      ...J(g, 'JSON.stringify(EASTERN_FENS_MORNAY_EASY_FORMATIONS)'),
      ...J(g, 'JSON.stringify(EASTERN_FENS_MORNAY_HARD_FORMATIONS)'),
    ];
    for (const formation of allFormations) {
      const g2 = ctx();
      g2.run("MainQuest=5; persistentParty.joinEsla({level:11}); resetLocationState(); placeAtLocation('MAP',7.5*TILE,9.5*TILE);");
      g2.run('Math=Object.create(Math); Math.random=()=>0.5;');
      const entered = g2.run(`canonicalPartyCombat.enter({enemies:${JSON.stringify(formation.enemies)}.map(id=>ENEMY_TEMPLATE_REGISTRY[id]), escape:'fastest_living'})`);
      assert.ok(entered, formation.id + ': canonicalPartyCombat.enter() accepts it');
      assert.equal(g2.run('canonicalPartyCombat.isActive()'), true);
      const view = J(g2, 'JSON.stringify(canonicalPartyCombat.getView())');
      assert.deepEqual(view.enemies.map(e => e.name).map(n => n.toLowerCase().replace(/ /g, '_')),
        formation.enemies.map(id => ENEMY_TEMPLATE_REGISTRY_NAMES[id]), formation.id + ': authored enemy order preserved');
      assert.equal(new Set(view.enemies.map(e => e.instanceId)).size, formation.enemies.length,
        formation.id + ': every body (including duplicate templates) gets a distinct runtime identity');
    }
  },
};
