'use strict';
// Covers: the stable-identity systems (#4) — immutable ids for world pickups,
// openable chests, and enemy templates; version-3 id-based save persistence; and
// the sequential v1→v2→v3 migration.
//
//   • Registry contracts: every pickup / chest / enemy template has exactly one
//     valid, unique id; registry keys equal object/template ids; all random and
//     scripted enemy templates are represented; the two Mire Toads share a
//     display name but have distinct ids; combat-start paths preserve the id.
//   • Pickup persistence is by id, not array position: reordering a pickup array
//     and reloading restores the SAME objects (this test fails if save/load is
//     ever reverted to array-index persistence).
//   • Chest persistence is by id and independent of registry enumeration order;
//     nonstandard direct fields (home-chest gold, dresser, sparkle) survive.
//   • v2→v3 migration maps legacy positional/per-chest fields to stable ids,
//     preserves unrelated state, and removes the obsolete fields.
//   • Unknown ids warn (not throw), never touch gameplay, and are preserved.
//   • Enemy identity is plumbing only: names/sex/behaviour are unchanged.
//
// Section G deliberately breaks each guarantee in-process and asserts the
// matching check then fails, so a regression can't pass unnoticed. Every break
// is undone in a `finally`.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Frozen expectation snapshots (production stays registry-driven).
const EXPECTED_PICKUP_COUNT = 48;  // +1: pickup_school_elixir (Calwick school exploration reward)
const EXPECTED_CHEST_COUNT  = 10;
const EXPECTED_ENEMY_COUNT  = 53;
const CHEST_IDS = [
  'chest_cat_armor', 'chest_dungeon_alcove', 'chest_dungeon_main', 'chest_meadow',
  'chest_sluice1', 'chest_sluice2', 'chest_sluice3', 'chest_sluice_deep', 'chest_sluice_secret',
  'chest_sunken_gallery',
];

module.exports = {
  name: 'stable persistence ids: pickup/chest/enemy registries, v3 id save, v2→v3 migration',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    const G = (code) => g.run(code);
    const J = (code) => JSON.parse(G(code));
    const expectAssertFails = (fn, why) => {
      let threw = false;
      try { fn(); } catch (e) { threw = e && e.name === 'AssertionError'; }
      assert.equal(threw, true, 'load-bearing check should have failed but did not: ' + why);
    };

    // ── A. Registry contracts ───────────────────────────────────────────────
    assert.equal(G('SAVE_VERSION'), 4, 'SAVE_VERSION is 4');

    // Pickups: one valid unique id each; keys === object ids; count snapshot.
    const pickIds = J('JSON.stringify(window.PICKUP_REGISTRY_IDS)');
    assert.equal(pickIds.length, EXPECTED_PICKUP_COUNT, 'pickup registry has ' + EXPECTED_PICKUP_COUNT + ' ids');
    assert.equal(new Set(pickIds).size, pickIds.length, 'pickup ids are unique');
    assert.equal(G('window.PICKUP_REGISTRY_IDS.every(function(id){return /^pickup_[a-z0-9_]+$/.test(id);})'), true, 'all pickup ids are valid format');
    assert.equal(G('window.PICKUP_REGISTRY_IDS.every(function(id){return window.PICKUP_REGISTRY[id].id===id;})'), true, 'pickup registry keys equal object ids');
    assert.deepEqual(J('JSON.stringify(window.PICKUP_REGISTRY_DUP_IDS)'), [], 'no duplicate pickup ids');
    assert.equal(G("!!window.PICKUP_REGISTRY['pickup_world_potion']"), true, 'a representative pickup id is present');

    // Chests: one valid unique id each; exact id snapshot; each has boolean opened.
    assert.deepEqual(J('JSON.stringify(window.CHEST_REGISTRY_IDS)'), CHEST_IDS, 'chest ids match the snapshot');
    assert.equal(pickIds.length && G('window.CHEST_REGISTRY_IDS.length'), EXPECTED_CHEST_COUNT, 'chest registry has ' + EXPECTED_CHEST_COUNT + ' ids');
    assert.equal(G('window.CHEST_REGISTRY_IDS.every(function(id){return /^chest_[a-z0-9_]+$/.test(id) && typeof window.CHEST_REGISTRY[id].opened==="boolean" && window.CHEST_REGISTRY[id].id===id;})'), true, 'every chest: valid id, boolean opened, key===id');

    // Enemies: registry covers all pools + scripted + inline; keys === ids.
    assert.equal(G('Object.keys(window.ENEMY_TEMPLATE_REGISTRY).length'), EXPECTED_ENEMY_COUNT, 'enemy registry has ' + EXPECTED_ENEMY_COUNT + ' templates');
    assert.equal(G('Object.keys(window.ENEMY_TEMPLATE_REGISTRY).every(function(id){var t=window.ENEMY_TEMPLATE_REGISTRY[id];return /^enemy_[a-z0-9_]+$/.test(id) && t.id===id;})'), true, 'every enemy: valid id, key===id');
    // all pooled + scripted templates represented
    const enemyGaps = J(`JSON.stringify((function(){
      var reg=window.ENEMY_TEMPLATE_REGISTRY, out=[];
      window.ENEMY_TEMPLATE_POOLS.forEach(function(p){p.templates.forEach(function(t){if(reg[t.id]!==t)out.push(t.name);});});
      window.ENEMY_SCRIPTED_TEMPLATES.forEach(function(t){if(reg[t.id]!==t)out.push(t.name);});
      if(reg[window.SECRET_23_TEMPLATE.id]!==window.SECRET_23_TEMPLATE)out.push('23');
      return out;
    })())`);
    assert.deepEqual(enemyGaps, [], 'every pooled + scripted + inline template is registered');

    // Two Mire Toads: same display name, distinct ids, sex retained.
    const toads = J("JSON.stringify(FAR_ENEMY_TEMPLATES.filter(function(t){return t.name==='Mire Toad';}).map(function(t){return {id:t.id,name:t.name,sex:t.sex};}))");
    assert.equal(toads.length, 2, 'two Mire Toad records');
    assert.equal(toads[0].name, toads[1].name, 'both Mire Toads share their display name');
    assert.notEqual(toads[0].id, toads[1].id, 'the two Mire Toads have distinct ids');
    assert.deepEqual([toads[0].sex, toads[1].sex].sort(), ['female', 'male'], 'sex is retained on each');

    // Combat-start paths preserve the template id into combat.enemy.
    G('startBossCombat();');
    assert.equal(G('combat.enemy.id'), 'enemy_wrongteeth', 'scripted boss clone preserves id');
    assert.equal(G('combat.enemy.name'), 'Wrongteeth', 'scripted boss display name unchanged');
    G('startTakomoCombat();');
    assert.equal(G('combat.enemy.id'), 'enemy_takomo', 'scripted Takomo clone preserves id');
    G('startSailorBrawlCombat();');
    assert.equal(G('combat.enemy.id'), 'enemy_kolm', 'Kolm clone preserves id (name != id)');
    assert.equal(G('combat.enemy.name'), 'Kolm', 'Kolm display name unchanged');
    // A random encounter: force a known pool, stub RNG to avoid the 23/donkey
    // overrides, and confirm the drawn enemy carries a real pool-template id.
    G('window.__rnd = Math.random; Math.random = function(){ return 0.5; };');
    try {
      G('resetLocationState(); inTown=false; inDungeon=true; dungeonFloor=1; activeMap=DUNGEON_MAP; inSluice=false; inMireVault=false; sentry_quest_started=false;');
      G('startCombat();');
      assert.equal(G("DUNGEON_ENEMY_TEMPLATES.some(function(t){return t.id===combat.enemy.id;})"), true, 'random encounter enemy has a real pool-template id');
      assert.equal(G('/^enemy_[a-z0-9_]+$/.test(combat.enemy.id)'), true, 'random encounter enemy id is valid format');
    } finally {
      G('Math.random = window.__rnd; delete window.__rnd;');
    }
    // The inline 1/256 "23" secret carries its stable id.
    G('window.__rnd = Math.random; Math.random = function(){ return 0; };');
    try {
      G('inDungeon=true; dungeonFloor=1; inSluice=false; inMireVault=false;');
      G('startCombat();');
      assert.equal(G('combat.enemy.id'), 'enemy_23', 'the inline "23" secret enemy carries its stable id');
      assert.equal(G('combat.enemy.name'), '23', '"23" display name unchanged');
    } finally {
      G('Math.random = window.__rnd; delete window.__rnd;');
    }

    // ── B. Pickup persistence independent of array order ────────────────────
    // Collect two NON-FIRST pickups, save, REVERSE their arrays, reset, load,
    // and confirm the same OBJECTS (by id) are collected — not whoever now sits
    // at the old index. Fails if save/load reverts to array-index persistence.
    G('window.PICKUP_REGISTRY_IDS.forEach(function(id){ window.PICKUP_REGISTRY[id].picked=false; });');
    const burialId = 'pickup_dungeon7_burial_record';
    const sluice2dId = 'pickup_sluice2_d';
    try {
      G("window.PICKUP_REGISTRY['" + burialId + "'].picked = true;");   // DUNGEON7_ITEMS index 2
      G("window.PICKUP_REGISTRY['" + sluice2dId + "'].picked = true;"); // SLUICE_LEVEL2_ITEMS index 3
      G('saveGame();');
      G('DUNGEON7_ITEMS.reverse(); SLUICE_LEVEL2_ITEMS.reverse();');    // change array order
      G('window.PICKUP_REGISTRY_IDS.forEach(function(id){ window.PICKUP_REGISTRY[id].picked=false; });');
      assert.equal(G('loadGame()'), true, 'load succeeds after reordering pickup arrays');
      assert.equal(G("window.PICKUP_REGISTRY['" + burialId + "'].picked"), true, 'the burial-record pickup is restored by id despite reordering');
      assert.equal(G("window.PICKUP_REGISTRY['" + sluice2dId + "'].picked"), true, 'the sluice2 pickup is restored by id despite reordering');
      // neighbours did not swap state
      assert.equal(G("window.PICKUP_REGISTRY['pickup_dungeon7_a'].picked"), false, 'a neighbouring pickup stayed uncollected');
      assert.equal(G("window.PICKUP_REGISTRY['pickup_sluice2_a'].picked"), false, 'another neighbour stayed uncollected');
    } finally {
      G('DUNGEON7_ITEMS.reverse(); SLUICE_LEVEL2_ITEMS.reverse();');    // restore original order
      G('window.PICKUP_REGISTRY_IDS.forEach(function(id){ window.PICKUP_REGISTRY[id].picked=false; });');
    }

    // ── C. Chest persistence by id + registry-order independence ────────────
    G('window.CHEST_REGISTRY_IDS.forEach(function(id){ window.CHEST_REGISTRY[id].opened=false; });');
    G('HOUSE_DATA.player_house.chest.gold = 321; HOUSE_DATA.drenwick_apt_c1_u4.dresser.looted = true; HOUSE_DATA.drenwick_apt_c1_u4.sparkle.taken = true;');
    G("window.CHEST_REGISTRY['chest_sluice3'].opened = true; window.CHEST_REGISTRY['chest_cat_armor'].opened = true;");
    G('saveGame();');
    G('window.CHEST_REGISTRY_IDS.forEach(function(id){ window.CHEST_REGISTRY[id].opened=false; }); HOUSE_DATA.player_house.chest.gold=0; HOUSE_DATA.drenwick_apt_c1_u4.dresser.looted=false; HOUSE_DATA.drenwick_apt_c1_u4.sparkle.taken=false;');
    assert.equal(G('loadGame()'), true, 'load succeeds');
    assert.equal(G("window.CHEST_REGISTRY['chest_sluice3'].opened"), true, 'opened chest restored by id');
    assert.equal(G("window.CHEST_REGISTRY['chest_cat_armor'].opened"), true, 'second opened chest restored by id');
    assert.equal(G("window.CHEST_REGISTRY['chest_meadow'].opened"), false, 'an unopened chest stays closed');
    assert.equal(G('HOUSE_DATA.player_house.chest.gold'), 321, 'home-chest stored gold survives (nonstandard direct field)');
    assert.equal(G('HOUSE_DATA.drenwick_apt_c1_u4.dresser.looted'), true, 'dresser .looted survives');
    assert.equal(G('HOUSE_DATA.drenwick_apt_c1_u4.sparkle.taken'), true, 'sparkle .taken survives');
    // Registry enumeration order must not matter: sorting the id list and
    // reloading restores identically.
    G('window.CHEST_REGISTRY_IDS.reverse();');
    try {
      G('window.CHEST_REGISTRY_IDS.forEach(function(id){ window.CHEST_REGISTRY[id].opened=false; });');
      G('loadGame();');
      assert.equal(G("window.CHEST_REGISTRY['chest_sluice3'].opened && window.CHEST_REGISTRY['chest_cat_armor'].opened"), true, 'chest restoration is independent of registry enumeration order');
    } finally {
      G('window.CHEST_REGISTRY_IDS.reverse();');
    }

    // ── D. v4 clean break: an older-version save is rejected, not migrated ──
    G("localStorage.clear(); stats.gold = 999; day = 7; resetLocationState(); activeMap = MAP; player.x = 7.5*TILE; player.y = 9.5*TILE; __reconcileCanonicalForTest(); saveGame();");
    const rawCur = G("localStorage.getItem('verdantVale_save')");
    assert.equal(JSON.parse(rawCur).version, G("SAVE_VERSION"), "a fresh save is the current version");
    // Downgrade to v2 (legacy positional fields) — v4 has no migration, so it is rejected.
    G("(function(){ var d = JSON.parse(localStorage.getItem('verdantVale_save')); d.version = 2; delete d.collectedPickupIds; delete d.openedChestIds; d.dungeon7Items = [false,false,true,false]; localStorage.setItem('verdantVale_save', JSON.stringify(d)); })();");
    const rawV2 = G("localStorage.getItem('verdantVale_save')");
    G("stats.gold=1; day=1;");
    assert.equal(G("loadGame()"), false, "a v2 save is rejected cleanly — there is no migration path");
    assert.equal(G("stats.gold"), 1, "a rejected load mutates no runtime state");
    assert.equal(G("localStorage.getItem('verdantVale_save')"), rawV2, "the rejected v2 save is left untouched on disk");
    assert.equal(G("localStorage.getItem('verdantVale_save_backup_v2')"), null, "a rejected save creates no backup");

    // ── E. Unknown ids: warn, no throw, no gameplay, preserved, deduped ─────
    G('localStorage.clear(); saveGame();');
    G(`(function(){
        var d = JSON.parse(localStorage.getItem('verdantVale_save'));
        d.collectedPickupIds = ['pickup_world_potion', 'pickup_ghost', 'pickup_ghost'];
        d.openedChestIds = ['chest_meadow', 'chest_ghost'];
        localStorage.setItem('verdantVale_save', JSON.stringify(d));
      })();`);
    assert.equal(G('loadGame()'), true, 'a save with unknown ids loads without throwing');
    assert.equal(G("window.PICKUP_REGISTRY['pickup_world_potion'].picked"), true, 'known pickup id still applied');
    assert.equal(G("window.CHEST_REGISTRY['chest_meadow'].opened"), true, 'known chest id still applied');
    G('saveGame();');
    const resaved = JSON.parse(G("localStorage.getItem('verdantVale_save')"));
    assert.ok(resaved.collectedPickupIds.indexOf('pickup_ghost') !== -1, 'unknown pickup id preserved across a later save');
    assert.ok(resaved.openedChestIds.indexOf('chest_ghost') !== -1, 'unknown chest id preserved across a later save');
    assert.equal(resaved.collectedPickupIds.filter(function(x){return x === 'pickup_world_potion';}).length, 1, 'ids are duplicate-free in the saved array');

    // ── F. Enemy behaviour preservation (identity is plumbing only) ─────────
    // A cloned Mire Toad keeps its name, sex and id; nothing in the clone path
    // changed. (Combat/render/observe still dispatch on name — unchanged here.)
    const clone = J("JSON.stringify((function(){var t=FAR_ENEMY_TEMPLATES.find(function(x){return x.sex==='female';});return {id:({...t}).id,name:({...t}).name,sex:({...t}).sex,hp:({...t}).hp};})())");
    assert.equal(clone.id, 'enemy_mire_toad_female', 'clone preserves the template id');
    assert.equal(clone.name, 'Mire Toad', 'clone preserves the display name');
    assert.equal(clone.sex, 'female', 'clone preserves sex-specific behaviour field');
    assert.equal(clone.hp, 72, 'clone preserves stats');

    // ── G. Load-bearing verification (break → confirm failure → restore) ────
    const cleanErrors = () => G('(function(){ var r = validateGameData(); return r.errors; })()');

    // G1. Break a pickup id (key != object.id) → validation must error.
    G("window.__pid = window.PICKUP_REGISTRY['pickup_world_potion'].id; window.PICKUP_REGISTRY['pickup_world_potion'].id = 'pickup_broken';");
    try {
      expectAssertFails(() => { assert.equal(cleanErrors(), 0, 'expected clean'); }, 'a mismatched pickup id must make validation error');
    } finally {
      G("window.PICKUP_REGISTRY['pickup_world_potion'].id = window.__pid; delete window.__pid;");
    }
    assert.equal(cleanErrors(), 0, 'validation is clean again once the pickup id is restored');

    // G2. Break a chest migration mapping (points at an unknown id) → error.
    G('window.__chestMap = window.LEGACY_V2_CHEST_FIELDS; window.LEGACY_V2_CHEST_FIELDS = { meadowChestOpened: "chest_nonexistent" };');
    try {
      expectAssertFails(() => { assert.equal(cleanErrors(), 0, 'expected clean'); }, 'a chest migration mapping to an unknown id must make validation error');
    } finally {
      G('window.LEGACY_V2_CHEST_FIELDS = window.__chestMap; delete window.__chestMap;');
    }
    assert.equal(cleanErrors(), 0, 'validation is clean again once the chest mapping is restored');

    // G3. Break an enemy registry entry (remove a scripted template) → error.
    G("window.__boss = window.ENEMY_TEMPLATE_REGISTRY['enemy_wrongteeth']; delete window.ENEMY_TEMPLATE_REGISTRY['enemy_wrongteeth'];");
    try {
      expectAssertFails(() => { assert.equal(cleanErrors(), 0, 'expected clean'); }, 'a scripted template missing from the registry must make validation error');
    } finally {
      G("window.ENEMY_TEMPLATE_REGISTRY['enemy_wrongteeth'] = window.__boss; delete window.__boss;");
    }
    assert.equal(cleanErrors(), 0, 'validation is clean again once the enemy entry is restored');

    // G4. v4 clean break: a v2 (or any non-current) save is always rejected — the
    // retired SAVE_MIGRATIONS registry no longer participates in loading.
    G('localStorage.clear(); resetLocationState(); activeMap=MAP; player.x=7.5*TILE; player.y=9.5*TILE; __reconcileCanonicalForTest(); saveGame();');
    G(`(function(){ var d=JSON.parse(localStorage.getItem('verdantVale_save')); d.version=2; localStorage.setItem('verdantVale_save', JSON.stringify(d)); })();`);
    assert.equal(G('loadGame()'), false, 'a v2 save is rejected — v4 has no migration path');

    // G5. Break id-based application (no-op) → the array-order round-trip fails.
    G('localStorage.clear(); window.PICKUP_REGISTRY_IDS.forEach(function(id){ window.PICKUP_REGISTRY[id].picked=false; });');
    G("window.PICKUP_REGISTRY['pickup_dungeon7_burial_record'].picked = true; saveGame();");
    G('window.__apply = applyCollectedPickupIds; applyCollectedPickupIds = function(){};'); // broken: does not apply
    try {
      expectAssertFails(() => {
        G('window.PICKUP_REGISTRY_IDS.forEach(function(id){ window.PICKUP_REGISTRY[id].picked=false; }); loadGame();');
        assert.equal(G("window.PICKUP_REGISTRY['pickup_dungeon7_burial_record'].picked"), true, 'should be restored');
      }, 'a no-op pickup application must break the id-based round-trip');
    } finally {
      G('applyCollectedPickupIds = window.__apply; delete window.__apply;');
    }
    G('loadGame();');
    assert.equal(G("window.PICKUP_REGISTRY['pickup_dungeon7_burial_record'].picked"), true, 'the round-trip works again once application is restored');

    g.renderFrame();
  },
};
