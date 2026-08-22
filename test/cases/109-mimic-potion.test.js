'use strict';
// Sunken Gallery "dropped potion" trap: an examine sparkle in the distant
// far-corner room (R0C4) that springs the scripted Mimic Potion fight instead of
// granting an item. Covers the trap flow (dialogue, queued encounter, consumed
// sparkle, no up-front item), the glass-cannon calibration (dies in 2 player hits;
// can drop the expected Sunken-Gallery player in 2 of its hits), the 100% Potion
// drop on death, deterministic rendering, persistence, and scope.

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run('debugMode=true;dialogue.open=false;choice.open=false;menu.open=false;');
  return g;
}
function closeUi(g) { g.run('dialogue.open=false;dialogue.callbacks=null;dialogue.triggerEncounterId=null;choice.open=false;menu.open=false;'); }
function potions(g) { return g.run("stats.items.filter(function(i){return i&&i.name==='Potion';}).length"); }
// Stand on the mimic sparkle in the distant far-corner room.
function atSparkle(g) {
  g.run('resetLocationState();__clearRegionalPositionForTest&&__clearRegionalPositionForTest();');
  g.run('activeMap=SUNKEN_GALLERY_R0C4;inSunkenGallery=true;player.x=7.5*TILE;player.y=12.5*TILE;stats.items=[];dialogue.open=false;');
}

module.exports = {
  name: 'Mimic Potion: Sunken Gallery trap sparkle, glass-cannon fight, guaranteed Potion drop, scope',
  run() {
    const g = fresh();
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Enemy + sparkle registration; placement is distant and walkable ──
    assert.equal(g.run("!!ENEMY_TEMPLATE_REGISTRY['enemy_mimic_potion']"), true, 'enemy registered');
    assert.equal(g.run("ENEMY_SCRIPTED_TEMPLATES.filter(function(t){return t.id==='enemy_mimic_potion';}).length"), 1, 'registered exactly once (scripted)');
    assert.equal(g.run("ENEMY_TEMPLATE_POOLS.some(function(p){return p.templates.some(function(t){return t.id==='enemy_mimic_potion';});})"), false, 'not in any random pool');
    assert.equal(g.run("!!ENEMY_SPRITE_DISPATCH['enemy_mimic_potion']"), true, 'has a battle sprite');
    assert.equal(g.run("!!PICKUP_REGISTRY['pickup_sunken_gallery_mimic']"), true, 'trap sparkle registered');
    // R0C4 is the far corner (diagonally opposite the entrance at R4C0).
    assert.equal(g.run("MAP_CATALOG['SUNKEN_GALLERY_R0C4'].items===SUNKEN_GALLERY_MIMIC_ITEMS"), true, 'far-corner room owns the trap item set');
    assert.equal(g.run('isTileWalkable(SUNKEN_GALLERY_R0C4[12][7])'), true, 'sparkle sits on walkable floor');
    // Only THIS gallery room carries the trap; the other rooms stay blank.
    assert.equal(g.run("Object.keys(MAP_CATALOG).filter(function(k){return /^SUNKEN_GALLERY_R\\dC\\d$/.test(k)&&MAP_CATALOG[k].items.length>0;}).length"), 1, 'exactly one gallery room has the trap');

    // ── 2. Examine springs the scripted fight (no item granted up front) ────
    atSparkle(g);
    assert.equal(g.run('tryExamineWorldItem()'), true, 'examine consumes the interact');
    assert.deepEqual(J('JSON.stringify(dialogue.pages)'),
      [['Someone must have dropped a potion on the ground!'], ['It attacks you!']],
      'grounded first line, "It attacks you!" second line');
    assert.equal(g.run("dialogue.triggerEncounterId"), 'mimic_potion', 'a mimic encounter is queued');
    assert.equal(g.run("PICKUP_REGISTRY['pickup_sunken_gallery_mimic'].picked"), true, 'sparkle consumed on examination');
    assert.equal(potions(g), 0, 'no potion granted up front (reward is on the kill)');
    g.run('handleInteract();'); g.run('handleInteract();'); // close dialogue -> dispatch encounter
    assert.equal(g.run('combat.active') && g.run("combat.enemy.id==='enemy_mimic_potion'"), true, 'exactly one Mimic Potion fight starts');
    assert.equal(g.run('combat.enemy.hp'), 40); assert.equal(g.run('combat.enemy.atk'), 60);
    assert.equal(g.run('combat.enemy.def'), 0); assert.equal(g.run('combat.enemy.guaranteedDrop'), 'Potion');
    // A second examine on the consumed sparkle does nothing (one-time trap).
    g.run('combat.active=false;combat.enemy=null;'); closeUi(g);
    assert.equal(g.run('tryExamineWorldItem()'), false, 'the sprung trap does not re-trigger');

    // ── 3. Glass-cannon calibration (deterministic mid rolls: variance 1.0, no
    //      crit). Dies in 2 player hits; can drop the expected Gallery player in 2
    //      of ITS hits. Uses the real damage formula. ──────────────────────────
    // Expected Sunken-Gallery player benchmarks (base level curve + gear tiers,
    // mirrors test/balance-report.js): the typical L4–L5 player with mid-game gear.
    // (A better-geared T4 player survives to ~3 mid-rolls — variance still often
    // makes it 2 — which is a fine reward for gearing up.)
    const dmg = (atk, def) => Math.max(1, Math.round(atk * 1.0 - def)); // Math.random()=0.5 => variance 1.0, no crit
    for (const [lbl, pAtk, pDef, pHp] of [['L4 T3', 21, 19, 60], ['L5 T3', 23, 21, 70]]) {
      const playerHit = dmg(pAtk, 0);            // vs mimic def 0
      assert.equal(Math.ceil(40 / playerHit), 2, `${lbl}: player kills the mimic in 2 hits`);
      const mimicHit = dmg(60, pDef);
      assert.equal(Math.ceil(pHp / mimicHit), 2, `${lbl}: the mimic can drop the player in 2 hits`);
    }

    // ── 4. Victory drops exactly one Potion, 100% of the time (replaces the 12%
    //      bonus roll — never zero, never two). ────────────────────────────────
    let dropped = [];
    for (let t = 0; t < 150; t++) {
      g.run('startMimicPotionCombat();combat.flashTimer=0;stats.hp=999;stats.maxHp=999;stats.items=[];combat.cursor=0;');
      for (let i = 0; i < 20 && g.run("combat.phase!=='victory'"); i++) g.run('handleCombatAction();');
      dropped.push(potions(g));
      g.run('handleCombatAction();'); // acknowledge victory -> endCombat
    }
    assert.ok(dropped.every(n => n === 1), 'every kill drops exactly one Potion (100%, never 0 or 2)');
    assert.equal(g.run('combat.active'), false, 'combat ends normally after victory');

    // ── 5. Ordinary enemies keep the 12% bonus-potion roll (behaviour preserved). ─
    g.run('startDenWraithCombat();');
    assert.equal(g.run('combat.enemy.guaranteedDrop'), undefined, 'ordinary enemy has no guaranteed drop');
    g.run('endCombat();');

    // ── 6. Deterministic sprite (no Math.random in the draw). ───────────────
    g.run("var _r=Math.random;var _c=0;Math.random=function(){_c++;return 0.5;};drawBattleMimicPotion(100,100);tick++;drawBattleMimicPotion(100,100);window.__mc=_c;Math.random=_r;");
    assert.equal(g.run('window.__mc'), 0, 'the Mimic Potion sprite consumes no randomness');

    // ── 7. Persistence: the sprung sparkle stays sprung across save/load. ────
    {
      const gs = fresh();
      gs.run('resetLocationState();activeMap=SUNKEN_GALLERY_R0C4;inSunkenGallery=true;player.x=7.5*TILE;player.y=12.5*TILE;stats.items=[];');
      gs.run('tryExamineWorldItem();'); // spring it
      assert.equal(gs.run("PICKUP_REGISTRY['pickup_sunken_gallery_mimic'].picked"), true, 'sprung');
      // The gallery is allowSave:false, but the sprung state lives on the GLOBAL
      // pickup registry, so it round-trips through collectedPickupIds from any
      // saveable overworld spot.
      gs.run("resetLocationState();placeAtLocation('MAP2',6.5*TILE,6.5*TILE);__reconcileCanonicalForTest&&__reconcileCanonicalForTest();");
      assert.equal(gs.run('canSaveHere()'), true, 'overworld allows saving');
      gs.run('saveGame();');
      const payload = gs.run("localStorage.getItem('verdantVale_save')");
      assert.ok(payload && payload.indexOf('pickup_sunken_gallery_mimic') !== -1, 'sprung trap id is persisted as collected');
      gs.run("PICKUP_REGISTRY['pickup_sunken_gallery_mimic'].picked=false;loadGame();");
      assert.equal(gs.run("PICKUP_REGISTRY['pickup_sunken_gallery_mimic'].picked"), true, 'stays sprung after load');
      assert.equal(gs.run('SAVE_VERSION'), 4);
    }

    // ── 8. Scope: the trap grants no map/chest/shop item; source has no scattered
    //      name checks; regional fingerprints unchanged; validation clean. ──────
    assert.equal(g.run("(window.WORLD_ITEMS||[]).some(function(w){return w&&w.id==='pickup_sunken_gallery_mimic';})"), false, 'trap is not a Verdant Vale world pickup');
    const combatSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'combat.js'), 'utf8');
    assert.doesNotMatch(combatSrc, /name\s*===\s*['"]Mimic Potion['"]/, 'no scattered enemy-name special cases');
    const crypto = require('crypto');
    const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG[${JSON.stringify(id)}].map)`)), fp, `${id} grid unchanged`);
    }
    const validation = J('JSON.stringify(validateGameData())');
    assert.equal(validation.errors, 0, 'validation clean');
  },
};
