'use strict';
// Eastern Fens — Mornay approach: the full 8-enemy roster (Botfly, Waspthra,
// Mire Toad reuse, Sparkeel, Mudwrack Snapper, Fen Rootworm, Willow-Veiled
// Stalker, Hollowreed Choker) and the two authored encounter-formation tables
// ({ id, enemies, weight }, the closed schema in encounter-formations.js) —
// an easy-leaning table (chunk column <= 12, Eastern Bank through Travellers'
// Rise) and a hard-leaning table (column >= 13, Travellers' Rise to Mornay
// Threshold). Both tables share the same 16 formation ids/compositions; only
// the weights differ. Now live on 22 of the 23 Eastern Fens route chunks via
// the eastern_fens_mornay_easy/_hard encounter profiles (data.js,
// content/maps/eastern-fens-maps.js) — Travellers' Rise alone stays
// encounter-free, reserved for its own MQ5 scripted ambush. This suite
// proves the content is correct, genuinely routed (not just prepared), and
// that nothing here is a second selector/dispatcher of its own.

const assert = require('assert/strict');
const fs = require('fs');
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


// The isolated third member uses the existing Lab sprite identity; it is not
// added to the production character registry.
function geographicContext(count) {
  const read=fs.readFileSync;let g;
  try {
    fs.readFileSync=function(file,...args){let source=read.call(this,file,...args);
      if(String(file).endsWith('/encounter-formations.js'))source=source.replace('    select(pool){',
        '    select(pool){window.contentSelectCalls=(window.contentSelectCalls||0)+1;');
      if(String(file).endsWith('/canonical-party-combat.js'))source=source.replace('    enter(request){',
        '    enter(request){window.contentEnterCalls=(window.contentEnterCalls||0)+1;window.contentEntered=request.enemies;');
      if(String(file).endsWith('/persistent-party.js')&&count===3)source=source.replace('  lely:Object.freeze',
        "  lely_lab:Object.freeze({id:'lely_lab',slot:2,name:'Fixture third',rareBorn:false,affinity:null,progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),\n  lely:Object.freeze");
      return source;
    };
    g=ctx();
  }finally{fs.readFileSync=read;}
  g.run(`dialogue.open=false;dialogue.callbacks=null;${count>1?'MainQuest=5;persistentParty.joinEsla({level:11});':''}`);
  if(count===3)g.run(`saveGame();var fixture=JSON.parse(localStorage.getItem('verdantVale_save'));
    fixture.party.order.push('lely_lab');fixture.party.characters.push({...fixture.party.characters[0],characterId:'lely_lab'});
    localStorage.setItem('verdantVale_save',JSON.stringify(fixture));loadGame();dialogue.open=false;`);
  g.run("resetLocationState();placeAtLocation('MAP2',8.5*TILE,8.5*TILE);combat.cooldown=37;");
  return g;
}

module.exports = {
  name: 'Eastern Fens — Mornay approach: full 8-enemy roster, easy/hard formation tables, inertness',
  run() {
    const g = ctx();

    // ── 1. Exact authored stats for the seven new templates ──────────────────
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

    // ── 7. LIVE ROUTING: exactly 22 of 23 route chunks, split by column,
    //    Travellers' Rise excluded; the raw flat template array stays unrouted ─
    assert.equal(
      g.run("Object.values(MAP_METADATA).some(m=>m.encounterPool===EASTERN_FENS_MORNAY_ENEMY_TEMPLATES)"),
      false, 'the raw enemy-template array itself is never a map encounterPool (only the formation tables are)');
    const ROUTE_EASY = ['EASTERN_FENS_EMBANKMENT_W_MAP','EASTERN_FENS_EMBANKMENT_E_MAP','EASTERN_FENS_REEDBELT_N_MAP',
      'EASTERN_FENS_REEDBELT_E_MAP','EASTERN_FENS_REEDBELT_S_MAP','EASTERN_FENS_DRY_RISE_APPROACH_MAP',
      'EASTERN_FENS_DRY_RISE_MAP','EASTERN_FENS_DRAINAGE_SW_MAP','EASTERN_FENS_DRAINAGE_NW_MAP',
      'EASTERN_FENS_WORKED_REEDS_MAP','EASTERN_FENS_MANAGED_REEDS_MAP'];
    const ROUTE_HARD = ['EASTERN_FENS_WIDE_WATER_MAP','EASTERN_FENS_CHANNEL_APPROACH_W_MAP','EASTERN_FENS_CHANNEL_APPROACH_E_MAP',
      'EASTERN_FENS_VALMERE_ROAD_TURN_MAP','EASTERN_FENS_CHANNEL_ROAD_S_MAP','EASTERN_FENS_CHANNEL_ROAD_MID_MAP',
      'EASTERN_FENS_CHANNEL_ROAD_N_MAP','EASTERN_FENS_VALMERE_REVEAL_MAP','EASTERN_FENS_VALMERE_SHORE_W_MAP',
      'EASTERN_FENS_VALMERE_SHORE_E_MAP','EASTERN_FENS_MORNAY_THRESHOLD_MAP'];
    assert.equal(ROUTE_EASY.length, 11); assert.equal(ROUTE_HARD.length, 11);
    for (const id of ROUTE_EASY) {
      assert.equal(g.run(`MAP_METADATA['${id}'].encounterPool===EASTERN_FENS_MORNAY_EASY_FORMATIONS`), true, `${id} routes to the easy table`);
      assert.equal(g.run(`MAP_METADATA['${id}'].allowRandomEncounters`), true, `${id} has encounters enabled`);
    }
    for (const id of ROUTE_HARD) {
      assert.equal(g.run(`MAP_METADATA['${id}'].encounterPool===EASTERN_FENS_MORNAY_HARD_FORMATIONS`), true, `${id} routes to the hard table`);
      assert.equal(g.run(`MAP_METADATA['${id}'].allowRandomEncounters`), true, `${id} has encounters enabled`);
    }
    assert.equal(g.run("MAP_METADATA['EASTERN_FENS_TRAVELLERS_RISE_MAP'].allowRandomEncounters"), false,
      "Travellers' Rise stays encounter-free, reserved for its own MQ5 scripted ambush");
    assert.equal(g.run("MAP_METADATA['EASTERN_FENS_TRAVELLERS_RISE_MAP'].encounterPool===EASTERN_FENS_MORNAY_EASY_FORMATIONS"), false);
    // No other map (any other region, or an Eastern Fens exploration/envelope
    // chunk) was touched. The Great Fen expansion (28 chunks: 4 converted
    // entry chunks + 24 fresh) reuses this same hard pool, so the HARD count
    // grew through the mainland pass to 426. Four sealed reserve chunks are
    // now open Thornmere water/scenery, leaving 422. The Great Fen tier takes
    // over 174 existing wilderness chunks, leaving 248; eleven opened Valmere shore chunks and (8,0) bring it
    // to 260. EASY is unchanged.
    assert.equal(g.run(`Object.values(MAP_METADATA).filter(m=>m.encounterPool===EASTERN_FENS_MORNAY_EASY_FORMATIONS).length`), 11);
    assert.equal(g.run(`Object.values(MAP_METADATA).filter(m=>m.encounterPool===EASTERN_FENS_MORNAY_HARD_FORMATIONS).length`), 260);
    assert.equal((g.run('startCanonicalPartyEncounter.toString()').match(/encounterFormations\.select\(pool\)/g)||[]).length,1);

    // ── 8. Actual geographic selection and installation: all 32 records ────
    // Each isolated fixture supplies the unchanged authored table at the pool
    // boundary. The real selector and real entry remain active and are spied,
    // not replaced. No production map permission or assignment is changed.
    let installed=0;
    for (const table of ['EASTERN_FENS_MORNAY_EASY_FORMATIONS','EASTERN_FENS_MORNAY_HARD_FORMATIONS']) {
      const formations=J(g,`JSON.stringify(${table})`),total=formations.reduce((n,f)=>n+f.weight,0);
      let cumulative=0;
      for (const formation of formations) {
        const roll=(cumulative+formation.weight/2)/total;cumulative+=formation.weight;
        for(const count of [1,2,3]) {
          const g2=geographicContext(count),label=`${table}/${formation.id}/${count} allies`;
          g2.run(`currentEncounterPool=()=>${table};var tape=[${roll},0.5],used=[];
            Math=Object.create(Math);Math.random=()=>{if(!tape.length)throw Error('extra RNG');const r=tape.shift();used.push(r);return r;};`);
          // One-member explicit canonical fixture; the normal pre-recruitment
          // routing gate is separately preserved by suite 194.
          g2.run(count===1?'startCanonicalPartyEncounter()':'startCombat()');
          assert.deepEqual(J(g2,'JSON.stringify(used)'),[roll,0.5],label+': one selection then failed rare override');
          assert.equal(g2.run('tape.length'),0,label);
          assert.equal(g2.run('window.contentSelectCalls'),1,label+': select once');
          assert.equal(g2.run('window.contentEnterCalls'),1,label+': enter once');
          assert.equal(g2.run('combat.cooldown'),37,label+': entry preserves cooldown');
          assert.equal(g2.run('canonicalPartyCombat.isActive()'),true,label);
          const view=J(g2,'JSON.stringify(canonicalPartyCombat.getView())');
          assert.equal(view.party.length,count,label);
          assert.deepEqual(view.enemies.map(e=>e.id),formation.enemies,label+': ordered IDs');
          assert.deepEqual(view.enemies.map(e=>e.name.toLowerCase().replace(/ /g,'_')),
            formation.enemies.map(id=>ENEMY_TEMPLATE_REGISTRY_NAMES[id]),label+': names');
          assert.deepEqual(view.enemies.map(e=>e.slot),formation.enemies.map((_,i)=>i),label+': fixed slots');
          assert.equal(new Set([...view.party,...view.enemies].map(e=>e.instanceId)).size,count+formation.enemies.length,label+': independent identities');
          assert.equal(g2.run('window.contentEntered.every(t=>t===ENEMY_TEMPLATE_REGISTRY[t.id])'),true,label+': exact registered records');
          const before=g2.run('JSON.stringify({stats,party:persistentParty.getView(),combat:canonicalPartyCombat.getView(),sequence:combatEnemyInstanceSequence})');
          g2.run('Math.random=()=>{throw Error("render RNG")};drawPartyBattle(canonicalPartyCombat.getView())');
          assert.equal(g2.run('JSON.stringify({stats,party:persistentParty.getView(),combat:canonicalPartyCombat.getView(),sequence:combatEnemyInstanceSequence})'),before,label+': rendering read-only');
          installed++;
        }
      }
    }
    assert.equal(installed,96);
    console.log('  32 authored formation records × 3 party sizes: 96 real geographic installations');
  },
};
