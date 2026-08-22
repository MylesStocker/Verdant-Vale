'use strict';
// Scripted Lensweb Spider boss event at the Abandoned Lighthouse lens.
// Covers: the reach-through lens choice, atomic battle startup with a battle-local
// pending item and start-of-battle Poison, the Observe-gated 0%/100% Run contract,
// the shared idempotent victory/escape finalizer, defeat/retry, persistence (nothing
// transient serialized), route exclusivity, and static/scope guarantees. The
// interior topology + lens-front integration is covered by case 107.

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const RING = 'Old Engagement Ring';
const GEM  = 'Stashed Gem';

function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run('debugMode=true;dialogue.open=false;choice.open=false;shop.open=false;menu.open=false;');
  return g;
}
function closeUi(g) {
  g.run('dialogue.open=false;dialogue.callbacks=null;dialogue.triggerEncounterId=null;choice.open=false;shop.open=false;menu.open=false;');
}
function count(g, name) {
  return g.run(`stats.items.filter(function(i){return i&&i.name===${JSON.stringify(name)};}).length`);
}
// Establish an accepted route with a consistent Polwick outcome (mirrors case 107).
function establishRoute(g, route) {
  const outcome = route === 'supervisor'
    ? 'fort_quest_stage=6;smugglers_dead=true;fort_report_filed=false;smugglers_execution_day=0;'
    : 'fort_quest_stage=6;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;';
  const stage = route === 'supervisor' ? 1 : 3;
  g.run(`${outcome}reservoir_quest_started=true;MainQuest=4;lighthouse_quest_stage=${stage};lighthouse_spider_resolved=false;stats.items=[];syncQuestFlagsToWindow();`);
}
// Place at the lens, spider unresolved, no items, and reach through the web up to
// the point where combat is active. Returns nothing; combat is live afterward.
function reachThroughToCombat(g) {
  closeUi(g);
  g.run("transitionToLocation({mapId:'LIGHTHOUSE_LANTERN_MAP',x:7.5*TILE,y:5.5*TILE,facing:'right',state:{inLighthouse:true}});");
  g.run('handleInteract();');                 // descriptive dialogue opens
  g.run('handleInteract();'); g.run('handleInteract();'); // advance to the choice
  assert.equal(g.run('choice.open'), true, 'reach-through choice offered');
  g.run('choice.open=false; choice.callbacks[0]();'); // "Reach through the web"
  g.run('handleInteract();'); g.run('handleInteract();'); // advance the bite dialogue -> dispatch encounter
  assert.equal(g.run('combat.active'), true, 'combat is live after reaching through');
  assert.equal(g.run('combat.enemy.id'), 'enemy_lensweb_spider');
  g.run('combat.flashTimer=0;');
}
const cursorFor = (g, action) => g.run(`combatOptions().indexOf(${JSON.stringify(action)})`);
function act(g, action) { g.run(`combat.cursor=${cursorFor(g, action)};handleCombatAction();`); }
function drainMessages(g, max = 40) {
  for (let i = 0; i < max && g.run("combat.phase==='message'"); i++) g.run('handleCombatAction();');
}

module.exports = {
  name: 'Lensweb Spider: lens choice, poisoned startup, Observe-gated run, victory/escape/defeat, persistence, scope',
  run() {
    const g = fresh();
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Enemy registration + deterministic sprite ───────────────────────
    assert.equal(g.run("!!ENEMY_TEMPLATE_REGISTRY['enemy_lensweb_spider']"), true, 'registered');
    assert.equal(g.run("ENEMY_TEMPLATE_POOLS.some(function(p){return p.templates.some(function(t){return t.id==='enemy_lensweb_spider';});})"), false, 'not in any random pool');
    assert.equal(g.run("ENEMY_SCRIPTED_TEMPLATES.filter(function(t){return t.id==='enemy_lensweb_spider';}).length"), 1, 'registered exactly once (scripted)');
    assert.equal(g.run("!!ENEMY_SPRITE_DISPATCH['enemy_lensweb_spider']"), true, 'has a dedicated battle sprite');
    assert.equal(g.run("LENSWEB_SPIDER_TEMPLATE.runLock"), 'observe_gated', 'narrow validated run capability');
    // Deterministic sprite: the draw function itself consumes no Math.random
    // (tick-driven Math.sin/cos only). Draw it directly across two ticks.
    g.run("var _r=Math.random;var _c=0;Math.random=function(){_c++;return 0.5;};drawBattleLenswebSpider(100,100);tick++;drawBattleLenswebSpider(100,100);window.__spriteRandCalls=_c;Math.random=_r;");
    assert.equal(g.run('window.__spriteRandCalls'), 0, 'the Lensweb Spider sprite consumes no randomness');

    // ── 2. Startup (both routes): one battle, correct pending item held but NOT
    //      in inventory, excluded item absent, poisoned, resolved false, and the
    //      reach-through -> combat-start path consumes no randomness. ──────────
    for (const [route, item, other] of [['supervisor', RING, GEM], ['polwick', GEM, RING]]) {
      establishRoute(g, route);
      closeUi(g);
      g.run("transitionToLocation({mapId:'LIGHTHOUSE_LANTERN_MAP',x:7.5*TILE,y:5.5*TILE,facing:'right',state:{inLighthouse:true}});");
      g.run('statusEffects=[];');
      g.run('handleInteract();'); g.run('handleInteract();'); g.run('handleInteract();');
      assert.equal(g.run('choice.open'), true, `${route}: choice offered`);
      const hpBefore = g.run('stats.hp');
      // Count randomness across the reach-through and the combat startup itself.
      g.run('var _r=Math.random;window.__startRand=0;Math.random=function(){window.__startRand++;return 0.5;};');
      g.run('choice.open=false; choice.callbacks[0]();');
      g.run('handleInteract();'); g.run('handleInteract();');
      g.run('Math.random=_r;');
      assert.equal(g.run('window.__startRand'), 0, `${route}: startup consumes no randomness (no escape roll)`);
      assert.equal(g.run('combat.active') && g.run("combat.enemy.id==='enemy_lensweb_spider'"), true, `${route}: exactly one spider battle started`);
      assert.equal(g.run('combat.isLenswebSpider'), true);
      assert.equal(g.run('combat.pendingLighthouseObjective'), item, `${route}: correct pending objective held`);
      assert.equal(count(g, item), 0, `${route}: pending item not yet in inventory`);
      assert.equal(count(g, other), 0, `${route}: excluded objective absent`);
      assert.equal(g.run("hasStatusEffect('poison')"), true, `${route}: begins combat poisoned`);
      assert.equal(g.run('stats.hp'), hpBefore, `${route}: no immediate poison damage tick at startup`);
      assert.equal(g.run('lighthouse_spider_resolved'), false, `${route}: unresolved during the fight`);
      // Clean up this probe fight without finalizing anything.
      g.run('endCombat();'); closeUi(g);
      assert.equal(g.run('lighthouse_spider_resolved'), false, `${route}: abnormal endCombat grants nothing`);
      assert.equal(count(g, item), 0, `${route}: abnormal endCombat leaves no item`);
    }

    // ── 3. Run BEFORE Observe is a guaranteed 0% — deterministic even when a
    //      speed roll would otherwise succeed. Consumes the turn; no finalize. ─
    establishRoute(g, 'supervisor'); reachThroughToCombat(g);
    g.run('stats.hp=200;stats.maxHp=200;');           // survive the free hit
    // Math.random=0 would make an ordinary speed-based escape SUCCEED; the spider must still fail.
    g.run('var _r=Math.random;Math.random=function(){return 0;};');
    act(g, 'run'); drainMessages(g);
    g.run('Math.random=_r;');
    assert.equal(g.run('combat.pendingEscape'), false, 'run before Observe does not escape (deterministic 0%)');
    assert.equal(g.run('combat.active'), true, 'still in the fight after a failed run');
    assert.equal(g.run("combat.phase==='choose'"), true, 'the turn was consumed, back to the menu');
    assert.equal(count(g, RING), 0, 'a failed run finalizes nothing');
    assert.equal(g.run('lighthouse_spider_resolved'), false);

    // ── 4. Observe shows the spider-specific clue, unlocks escape for THIS
    //      battle only, and is idempotent across repeats. ─────────────────────
    g.run('combat.messageQueue=[];');
    act(g, 'observe');
    const obsText = g.run("[combat.message].concat(combat.messageQueue.map(function(m){return typeof m==='string'?m:m.text;})).join(' ')");
    assert.match(obsText, /back away|will not follow|retreat safely|does not close|guards the lens/i, 'observe surfaces the retreat clue');
    assert.equal(g.run('combat.escapeUnlocked'), true, 'Observe unlocks escape');
    drainMessages(g);
    act(g, 'observe'); drainMessages(g);   // repeat: must not stack or change state
    assert.equal(g.run('combat.escapeUnlocked'), true, 'repeat Observe stays unlocked (idempotent, no >100%)');

    // ── 5. Run AFTER Observe is a guaranteed 100% — deterministic with ZERO
    //      escape-roll randomness — and finalizes the escape event. ───────────
    g.run('var _r=Math.random;window.__escRand=0;Math.random=function(){window.__escRand++;return 0.999;};');
    act(g, 'run');                          // escapeUnlocked -> pendingEscape, no roll
    assert.equal(g.run('window.__escRand'), 0, 'the guaranteed escape consumes no randomness');
    assert.equal(g.run('combat.pendingEscape'), true, 'run after Observe escapes deterministically');
    drainMessages(g);                        // resolves the escape -> finalize + aftermath
    g.run('Math.random=_r;');
    assert.equal(g.run('combat.active'), false, 'combat ended on escape');
    assert.equal(count(g, RING), 1, 'escape grants exactly one route item');
    assert.equal(g.run('lighthouse_spider_resolved'), true, 'escape resolves the spider');
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /retreats.*behind|refuses to pursue|pull.*hand/i, 'escape aftermath: spider retreats behind the lens frame and will not pursue');
    // Revisiting the lens starts no new battle (item now held, spider resolved).
    closeUi(g); g.run('player.x=7.5*TILE;player.y=5.5*TILE;handleInteract();');
    assert.equal(g.run('combat.active'), false, 'no new battle after an escape resolution');
    assert.equal(count(g, RING), 1, 'no duplicate item on revisit');

    // ── 6. Victory (both routes): item once, resolved, normal XP/gold once,
    //      idempotent callbacks, no new battle on revisit. ────────────────────
    for (const [route, item] of [['supervisor', RING], ['polwick', GEM]]) {
      const gv = fresh(); const Jv = (e) => JSON.parse(gv.run(e));
      establishRoute(gv, route); reachThroughToCombat(gv);
      const xp0 = gv.run('stats.xp'), gold0 = gv.run('stats.gold');
      gv.run('stats.hp=500;stats.maxHp=500;combat.enemy.hp=1;combat.cursor=0;handleCombatAction();'); // one lethal attack
      for (let i = 0; i < 30 && gv.run("combat.phase!=='victory'"); i++) gv.run('handleCombatAction();');
      assert.equal(gv.run("combat.phase"), 'victory', `${route}: reaches victory`);
      gv.run('handleCombatAction();'); // run the spider victory block (finalize + aftermath)
      assert.equal(count(gv, item), 1, `${route}: victory grants exactly one item`);
      assert.equal(gv.run('lighthouse_spider_resolved'), true, `${route}: victory resolves`);
      assert.ok(gv.run('stats.xp') > xp0, `${route}: XP awarded`);
      assert.ok(gv.run('stats.gold') > gold0, `${route}: gold awarded`);
      const snap = gv.run('JSON.stringify([stats.xp,stats.gold,stats.items.length])');
      // A repeat outcome callback cannot duplicate anything.
      gv.run('combat.active=true;combat.pendingVictory=true;combat.phase="victory";combat.isLenswebSpider=true;combat.pendingLighthouseObjective=' + JSON.stringify(item) + ';handleCombatAction();');
      assert.equal(gv.run('JSON.stringify([stats.xp,stats.gold,stats.items.length])'), snap, `${route}: repeat callback duplicates nothing`);
      // Revisit: no new battle.
      closeUi(gv); gv.run("transitionToLocation({mapId:'LIGHTHOUSE_LANTERN_MAP',x:7.5*TILE,y:5.5*TILE,facing:'right',state:{inLighthouse:true}});handleInteract();");
      assert.equal(gv.run('combat.active'), false, `${route}: no new battle after victory`);
    }

    // ── 7. Defeat: no item, resolved stays false, pending + Observe-unlock state
    //      cleared, then the player can choose again and win/escape normally. ──
    {
      const gd = fresh();
      establishRoute(gd, 'polwick'); reachThroughToCombat(gd);
      gd.run('defeatWakeAtHome=false;stats.hp=300;stats.maxHp=300;');
      act(gd, 'observe'); drainMessages(gd);           // unlock escape, then throw the fight
      assert.equal(gd.run('combat.escapeUnlocked'), true);
      gd.run('var _r=Math.random;Math.random=function(){return 0.99;};'); // no evade; enemy hits hard
      gd.run('stats.hp=1;stats.maxHp=30;combat.enemy.atk=999;combat.cursor=0;handleCombatAction();');
      for (let i = 0; i < 30 && gd.run("combat.phase!=='defeat'"); i++) gd.run('handleCombatAction();');
      assert.equal(gd.run("combat.phase"), 'defeat', 'reaches the defeat phase');
      gd.run('handleCombatAction();');                 // run the established defeat/recovery path
      gd.run('Math.random=_r;');
      assert.equal(gd.run('combat.active'), false, 'combat ended on defeat');
      assert.equal(count(gd, GEM), 0, 'defeat grants no item');
      assert.equal(gd.run('lighthouse_spider_resolved'), false, 'defeat leaves resolved false');
      assert.equal(gd.run('combat.pendingLighthouseObjective'), null, 'pending objective cleared');
      assert.equal(gd.run('combat.escapeUnlocked'), false, 'Observe unlock cleared');
      assert.equal(gd.run("hasStatusEffect('poison')"), false, 'defeat recovery cleared poison');
      // Retry: choose again and win.
      closeUi(gd); establishRoute(gd, 'polwick'); reachThroughToCombat(gd);
      gd.run('stats.hp=500;stats.maxHp=500;combat.enemy.hp=1;combat.cursor=0;handleCombatAction();');
      for (let i = 0; i < 30 && gd.run("combat.phase!=='victory'"); i++) gd.run('handleCombatAction();');
      gd.run('handleCombatAction();');
      assert.equal(count(gd, GEM), 1, 'retry victory grants the item');
      assert.equal(gd.run('lighthouse_spider_resolved'), true, 'retry victory resolves');
    }

    // ── 8. Persistence: victory & escape both survive save/load; nothing
    //      transient (pending objective / escape unlock) is in the payload. ────
    {
      const gs = fresh(); establishRoute(gs, 'supervisor'); reachThroughToCombat(gs);
      gs.run('stats.hp=500;stats.maxHp=500;combat.enemy.hp=1;combat.cursor=0;handleCombatAction();');
      for (let i = 0; i < 30 && gs.run("combat.phase!=='victory'"); i++) gs.run('handleCombatAction();');
      gs.run('handleCombatAction();'); closeUi(gs);
      gs.run("player.x=7.5*TILE;player.y=6.5*TILE;saveGame();");
      const payload = gs.run("localStorage.getItem('verdantVale_save')");
      assert.equal(payload.indexOf('pendingLighthouseObjective'), -1, 'no transient pending objective serialized');
      assert.equal(payload.indexOf('escapeUnlocked'), -1, 'no transient escape unlock serialized');
      const saved = JSON.parse(payload);
      assert.equal(saved.version, 4, 'SAVE_VERSION remains 4');
      assert.equal(saved.lighthouse_spider_resolved, true, 'resolved flag is in the payload');
      gs.run('stats.items=[];lighthouse_spider_resolved=false;lighthouse_quest_stage=0;loadGame();');
      assert.equal(count(gs, RING), 1, 'item restored on load');
      assert.equal(gs.run('lighthouse_spider_resolved'), true, 'resolved restored on load');
    }
    {
      const ge = fresh(); establishRoute(ge, 'polwick'); reachThroughToCombat(ge);
      ge.run('stats.hp=200;stats.maxHp=200;');
      act(ge, 'observe'); drainMessages(ge); act(ge, 'run'); drainMessages(ge); closeUi(ge);
      assert.equal(count(ge, GEM), 1);
      ge.run("player.x=7.5*TILE;player.y=6.5*TILE;saveGame();stats.items=[];lighthouse_spider_resolved=false;loadGame();");
      assert.equal(count(ge, GEM), 1, 'escape item survives save/load');
      assert.equal(ge.run('lighthouse_spider_resolved'), true, 'escape resolved survives save/load');
    }

    // ── 9. Old-save compatibility: a v4 save missing the new key loads with the
    //      default false, SAVE_VERSION unchanged. ────────────────────────────
    {
      const go = fresh();
      go.run("transitionToLocation({mapId:'LIGHTHOUSE_LANTERN_MAP',x:7.5*TILE,y:6.5*TILE,facing:'right',state:{inLighthouse:true}});");
      go.run('lighthouse_spider_resolved=true;saveGame();');
      go.run("var o=JSON.parse(localStorage.getItem('verdantVale_save'));delete o.lighthouse_spider_resolved;localStorage.setItem('verdantVale_save',JSON.stringify(o));");
      go.run('lighthouse_spider_resolved=true;');   // dirty runtime value
      assert.equal(go.run('loadGame()'), true, 'old-style v4 save still loads');
      assert.equal(go.run('lighthouse_spider_resolved'), false, 'missing key defaults to false');
      assert.equal(go.run('SAVE_VERSION'), 4);
    }

    // ── 10. Run/Observe unchanged for other enemies; no later battle inherits
    //      the unlock. ──────────────────────────────────────────────────────
    {
      const gn = fresh();
      gn.run('startDenWraithCombat();combat.flashTimer=0;stats.hp=500;stats.maxHp=500;');
      assert.equal(gn.run('combat.escapeUnlocked'), false, 'a fresh non-spider battle is not escape-unlocked');
      assert.equal(gn.run('combat.enemy.runLock'), undefined, 'ordinary enemy has no run lock');
      act(gn, 'observe'); drainMessages(gn);
      assert.equal(gn.run('combat.escapeUnlocked'), false, 'Observe does not unlock escape for ordinary enemies');
      // Its Run uses the ordinary speed contest (consumes randomness for the roll).
      gn.run('stats.hp=500;stats.maxHp=500;var _r=Math.random;window.__nr=0;Math.random=function(){window.__nr++;return 0.99;};');
      act(gn, 'run'); drainMessages(gn); gn.run('Math.random=_r;');
      assert.ok(gn.run('window.__nr') > 0, 'ordinary Run still rolls a speed contest');
      gn.run('endCombat();');
      // A spider battle then a later battle does not inherit the unlock.
      const gl = fresh(); establishRoute(gl, 'supervisor'); reachThroughToCombat(gl);
      gl.run('stats.hp=200;stats.maxHp=200;');
      act(gl, 'observe'); drainMessages(gl); act(gl, 'run'); drainMessages(gl); closeUi(gl);
      gl.run('startDenWraithCombat();');
      assert.equal(gl.run('combat.escapeUnlocked'), false, 'a later battle does not inherit the escape unlock');
    }

    // ── 11. Scope: quest items are never map pickups / chest / shop / enemy loot;
    //      no lighthouse random-encounter pool; source has no scattered name checks. ─
    const root = path.join(__dirname, '..', '..');
    for (const nm of [RING, GEM]) {
      assert.equal(g.run(`(window.WORLD_ITEMS||[]).some(function(w){return w&&w.name===${JSON.stringify(nm)};})`), false, `${nm} is not a world pickup`);
      assert.equal(g.run(`Object.keys(CHEST_REGISTRY).some(function(k){var c=CHEST_REGISTRY[k];return (c.items||[]).some&&(c.items||[]).some(function(i){return i&&i.name===${JSON.stringify(nm)};});})`), false, `${nm} is not chest loot`);
      assert.equal(g.run(`JSON.stringify(MERCHANT_STOCK||[]).indexOf(${JSON.stringify(nm)})`), -1, `${nm} is not shop stock`);
    }
    // This increment adds NO lighthouse random-encounter pool. The lantern room's
    // pool is the pre-existing one from the encounter-pool increment (it holds the
    // Lantern Moth, never the boss spider), and it is left unchanged here.
    assert.equal(g.run("MAP_CATALOG['LIGHTHOUSE_LANTERN_MAP'].encounterPool===LIGHTHOUSE_TOP_ENEMY_TEMPLATES"), true, 'lantern room random-encounter pool unchanged (pre-existing)');
    assert.equal(g.run("(MAP_CATALOG['LIGHTHOUSE_LANTERN_MAP'].encounterPool||[]).some(function(e){return e.id==='enemy_lensweb_spider';})"), false, 'the boss spider is not in any random-encounter pool');
    const combatSrc = fs.readFileSync(path.join(root, 'combat.js'), 'utf8');
    assert.doesNotMatch(combatSrc, /name\s*===\s*'Lensweb Spider'|name\s*===\s*"Lensweb Spider"/, 'no scattered enemy-name special cases');

    // ── 12. Regional fingerprints unchanged; validation clean. ──────────────
    const crypto = require('crypto');
    const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG[${JSON.stringify(id)}].map)`)), fp, `${id} grid unchanged`);
    }
    const validation = J('JSON.stringify(validateGameData())');
    assert.equal(validation.errors, 0, 'validation clean');
  },
};
