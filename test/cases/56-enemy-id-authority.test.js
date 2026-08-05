'use strict';
// test/cases/56-enemy-id-authority.test.js
//
// Architectural contract: STABLE ENEMY TEMPLATE IDS are the sole runtime
// identity for enemies. An enemy's player-facing `name` is presentation only.
// Renaming it must not change its battle sprite, its Observe/lore text, or any
// identity-dependent combat behaviour.
//
// This is the load-bearing guard for the "make stable enemy ids authoritative"
// refactor. It proves, across representative enemy kinds (pooled, cloned,
// scripted, boss, inline), that:
//
//   - every enemy entering combat carries a registered stable id;
//   - battle-sprite dispatch is id-keyed (ENEMY_SPRITE_DISPATCH);
//   - Observe/lore dispatch is id-keyed (ENEMY_OBSERVATIONS);
//   - special combat behaviour keys on id, not name;
//   - changing an enemy's display name leaves all of the above unchanged.
//
// It also includes break-then-restore checks: the validator / a runtime
// identity check must FAIL when an enemy loses its id, when an id-keyed
// dispatch entry points at an unregistered id, when a scripted encounter drops
// its template id, and when Observe/lore is keyed by name instead of id. Every
// mutation is undone in a `finally` so the shared vm context is never left
// dirty.

const assert = require('assert');
const { createContext } = require('../harness');

// Runs validateGameData() with console silenced; returns its structured result.
function runValidation(g) {
  g.run(`
    window.__origLog = console.log; window.__origWarn = console.warn; window.__origError = console.error;
    console.log = console.warn = console.error = function() {};
  `);
  const result = g.run('validateGameData()');
  g.run(`
    console.log = window.__origLog; console.warn = window.__origWarn; console.error = window.__origError;
  `);
  return result;
}

module.exports = {
  name: 'Enemy id authority: stable ids drive sprite/Observe/behaviour; name is presentation only',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    const REG = 'ENEMY_TEMPLATE_REGISTRY';

    // ── 1. Baseline: current data validates clean (0 errors) ────────────────
    const clean = runValidation(g);
    assert.equal(clean.errors, 0, 'baseline should validate with zero errors: ' + JSON.stringify(clean.errorList));

    // ── 2. Every registered template has a well-formed, unique id ───────────
    assert.equal(g.run(`
      (function(){
        var reg = ${REG}; var ids = Object.keys(reg); var re = /^enemy_[a-z0-9_]+$/;
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i], t = reg[id];
          if (!re.test(id)) return 'bad id format: ' + id;
          if (!t || t.id !== id) return 'key/id mismatch: ' + id;
          if (typeof t.name !== 'string' || !t.name) return 'missing name: ' + id;
        }
        return 'ok';
      })()
    `), 'ok');

    // ── 3. A normal POOLED enemy: a real startCombat() roll carries a
    //       registered id (Math.random pinned to dodge the 1/256 "23" and the
    //       North-Basin Swamp Donkey overrides while still taking pool[0]). ──
    assert.equal(g.run(`
      (function(){
        var _r = Math.random; Math.random = function(){ return 0.05; };
        try {
          startCombat();
          var e = combat.enemy;
          if (!e || !e.id) return 'pooled enemy has no id';
          if (!${REG}[e.id]) return 'pooled enemy id not registered: ' + e.id;
          return 'ok';
        } finally { Math.random = _r; combat.active = false; combat.enemy = null; }
      })()
    `), 'ok');

    // ── 4. A CLONED enemy preserves its id through the spread/assign clone ──
    assert.equal(g.run(`
      (function(){
        var base = ${REG}['enemy_marsh_wisp'];
        var spread = Object.assign({}, base);          // same path startCombat uses ({ ...t })
        if (spread.id !== 'enemy_marsh_wisp') return 'spread clone lost id';
        if (!${REG}[spread.id]) return 'clone id not registered';
        return 'ok';
      })()
    `), 'ok');

    // ── 5. A SCRIPTED enemy (Briar Warden) preserves its template id ────────
    assert.equal(g.run(`
      (function(){
        try {
          startWardenCombat();
          return (combat.enemy && combat.enemy.id === 'enemy_briar_warden' && combat.isWarden) ? 'ok'
               : 'scripted warden id/flag wrong: ' + (combat.enemy && combat.enemy.id);
        } finally { endCombat(); }
      })()
    `), 'ok');

    // ── 6. A BOSS (Wrongteeth) preserves its template id ────────────────────
    assert.equal(g.run(`
      (function(){
        try {
          startBossCombat();
          return (combat.enemy && combat.enemy.id === 'enemy_wrongteeth' && combat.isBoss) ? 'ok'
               : 'boss id/flag wrong: ' + (combat.enemy && combat.enemy.id);
        } finally { endCombat(); }
      })()
    `), 'ok');

    // ── 7. The registered INLINE enemy (the 1/256 "23") carries its stable id
    //       and is registered even though it has no static stat block. ───────
    assert.equal(g.run(`
      (function(){
        var _r = Math.random; Math.random = function(){ return 0; }; // forces the 1/256 override
        try {
          startCombat();
          var e = combat.enemy;
          return (e && e.id === 'enemy_23' && ${REG}['enemy_23'] && combat.is23) ? 'ok'
               : 'inline 23 id wrong: ' + (e && e.id);
        } finally { Math.random = _r; endCombat(); }
      })()
    `), 'ok');

    // ── 8. Sprite dispatch is id-keyed and total over the registry ──────────
    //   Every registered id is in exactly one of ENEMY_SPRITE_DISPATCH (bespoke
    //   art) or ENEMY_GENERIC_SPRITE_IDS (intentional generic silhouette), and
    //   no dispatch/generic entry references an unregistered id.
    assert.equal(g.run(`
      (function(){
        var reg = ${REG}, disp = ENEMY_SPRITE_DISPATCH, gen = ENEMY_GENERIC_SPRITE_IDS;
        var ids = Object.keys(reg);
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i];
          var inD = Object.prototype.hasOwnProperty.call(disp, id), inG = gen.has(id);
          if (inD === inG) return 'id must be in exactly one of sprite/generic: ' + id + ' (inD=' + inD + ', inG=' + inG + ')';
          if (inD && typeof disp[id].draw !== 'function') return 'sprite entry not callable: ' + id;
        }
        var dk = Object.keys(disp);
        for (var j = 0; j < dk.length; j++) if (!reg[dk[j]]) return 'sprite dispatch references unregistered id: ' + dk[j];
        var bad = null; gen.forEach(function(id){ if (!reg[id]) bad = id; });
        if (bad) return 'generic set references unregistered id: ' + bad;
        return 'ok';
      })()
    `), 'ok');

    // ── 9. Observe/lore dispatch is id-keyed; every key resolves to a template
    assert.equal(g.run(`
      (function(){
        var reg = ${REG}, obs = ENEMY_OBSERVATIONS, keys = Object.keys(obs);
        for (var i = 0; i < keys.length; i++) if (!reg[keys[i]]) return 'Observe key not a registered id: ' + keys[i];
        // Shared-identity aliases share one entry (e.g. the three Marsh Wisp ids)
        if (obs['enemy_marsh_wisp'] !== obs['enemy_marsh_wisp_early']) return 'Marsh Wisp variants should share Observe lore';
        return 'ok';
      })()
    `), 'ok');

    // ── 10. LOAD-BEARING: renaming a template's display name changes NOTHING
    //   about its identity dispatch. Subject: Corpse Slug -- it has a bespoke
    //   sprite, custom Observe lore, AND an id-keyed special (slither-on-hit),
    //   so one subject exercises all three. We give the live enemy a decoy
    //   name, then prove sprite dispatch, Observe text, and the slither
    //   behaviour are all unchanged. Name restored in finally.
    assert.equal(g.run(`
      (function(){
        combat.active = true;
        combat.enemy = Object.assign({}, ${REG}['enemy_corpse_slug']);
        var id = combat.enemy.id;
        var realName = combat.enemy.name;

        // Sprite: capture the entry the id resolves to, then confirm
        // drawBattleEnemy() dispatches to THAT entry even after a rename.
        var entry = ENEMY_SPRITE_DISPATCH[id];
        var origDraw = entry.draw;
        var observeBefore = JSON.stringify(getObservationText(combat.enemy, 0));

        var spriteCalledForId = false;
        var _r = Math.random;
        try {
          combat.enemy.name = 'RENAMED DECOY — not a real enemy';

          // (a) sprite: drawBattleEnemy must still call the id's entry
          entry.draw = function(){ spriteCalledForId = true; };
          drawBattleEnemy(100, 100);

          // (b) Observe: text must be byte-identical to the pre-rename lookup
          var observeAfter = JSON.stringify(getObservationText(combat.enemy, 0));

          // (c) special behaviour: slither-on-hit still fires (id-keyed),
          //     forced via Math.random = 0 so the 0.30 gate always trips.
          removeStatusEffect('slither');
          combat.messageQueue = [];
          Math.random = function(){ return 0; };
          applyEnemyHitEffects();
          var slithered = hasStatusEffect('slither');

          if (!spriteCalledForId) return 'sprite dispatch did not use id after rename';
          if (observeAfter !== observeBefore) return 'Observe text changed after rename';
          if (!slithered) return 'slither special did not fire after rename (should be id-keyed)';
          return 'ok';
        } finally {
          entry.draw = origDraw;
          combat.enemy && (combat.enemy.name = realName);
          Math.random = _r;
          removeStatusEffect('slither');
          combat.active = false; combat.enemy = null; combat.messageQueue = [];
        }
      })()
    `), 'ok');

    // ── 11. BREAK-THEN-RESTORE: a runtime enemy that loses its id fails a
    //   registered-id check. (Demonstrates the guard behind requirement #1.) ─
    assert.equal(g.run(`
      (function(){
        var ok = function(e){ return !!(e && ${REG}[e.id]); };
        var e = Object.assign({}, ${REG}['enemy_marsh_wisp']);
        assert_true(ok(e), 'sanity: intact clone passes');
        var saved = e.id;
        try {
          delete e.id;                     // enemy loses its id at runtime
          return ok(e) ? 'check WRONGLY passed with no id' : 'ok';
        } finally { e.id = saved; }
        function assert_true(c,m){ if(!c) throw new Error(m); }
      })()
    `), 'ok');

    // ── 12. BREAK-THEN-RESTORE: a sprite-dispatch entry pointing at an
    //   unregistered id makes validateGameData() error. ──────────────────────
    (function () {
      const before = clean.errors;
      let after;
      try {
        g.run(`ENEMY_SPRITE_DISPATCH['enemy_does_not_exist'] = { draw: function(){}, dy: 0 };`);
        after = runValidation(g);
      } finally {
        g.run(`delete ENEMY_SPRITE_DISPATCH['enemy_does_not_exist'];`);
      }
      assert.ok(after.errors > before, 'a sprite dispatch entry with an unregistered id must raise a validation error');
      assert.ok(after.errorList.some(e => e.group === 'Enemies' && /enemy_does_not_exist/.test(e.message)),
        'the error should name the offending sprite-dispatch id');
      const restored = runValidation(g);
      assert.equal(restored.errors, 0, 'removing the bad sprite entry restores a clean validation');
    })();

    // ── 13. BREAK-THEN-RESTORE: Observe/lore keyed by an unregistered id (the
    //   shape a name-keyed table would take) makes validateGameData() error. ─
    (function () {
      let after;
      try {
        g.run(`ENEMY_OBSERVATIONS['Corpse Slug'] = [{ lines: ['name-keyed, not id-keyed'] }];`);
        after = runValidation(g);
      } finally {
        g.run(`delete ENEMY_OBSERVATIONS['Corpse Slug'];`);
      }
      assert.ok(after.errorList.some(e => e.group === 'Enemies' && /ENEMY_OBSERVATIONS/.test(e.message) && /Corpse Slug/.test(e.message)),
        'Observe/lore keyed by display name (not id) must raise a validation error');
      assert.equal(runValidation(g).errors, 0, 'removing the name-keyed Observe entry restores a clean validation');
    })();

    // ── 14. BREAK-THEN-RESTORE: a scripted encounter that drops its template
    //   id is caught -- both at runtime (spawned enemy has no registered id)
    //   and by validateGameData() (template no longer registered). ───────────
    (function () {
      let runtimeResult, after;
      try {
        g.run(`window.__savedWardenId = BRIAR_WARDEN_TEMPLATE.id; delete BRIAR_WARDEN_TEMPLATE.id;`);
        runtimeResult = g.run(`
          (function(){
            try { startWardenCombat(); return !!(combat.enemy && ${REG}[combat.enemy.id]); }
            finally { endCombat(); }
          })()
        `);
        after = runValidation(g);
      } finally {
        g.run(`BRIAR_WARDEN_TEMPLATE.id = window.__savedWardenId; delete window.__savedWardenId;`);
      }
      assert.equal(runtimeResult, false, 'a scripted enemy that lost its template id must fail the registered-id check');
      assert.ok(after.errors > 0, 'a scripted template with no id must raise a validation error');
      assert.equal(runValidation(g).errors, 0, 'restoring the scripted template id restores a clean validation');
    })();

    // ── 15. BREAK-THEN-RESTORE: disconnecting an identity-sensitive branch
    //   from its id changes behaviour -- proving the branch really keys on id.
    //   With the live enemy's id swapped to a decoy, the Corpse Slug slither
    //   special must NOT fire; restoring the id makes it fire again. ──────────
    assert.equal(g.run(`
      (function(){
        var _r = Math.random;
        combat.active = true;
        combat.enemy = Object.assign({}, ${REG}['enemy_corpse_slug']);
        var realId = combat.enemy.id;
        try {
          Math.random = function(){ return 0; };

          combat.enemy.id = 'enemy_marsh_wisp';     // disconnect from the slug id
          removeStatusEffect('slither'); combat.messageQueue = [];
          applyEnemyHitEffects();
          var firedWhenDisconnected = hasStatusEffect('slither');

          combat.enemy.id = realId;                 // reconnect
          removeStatusEffect('slither'); combat.messageQueue = [];
          applyEnemyHitEffects();
          var firedWhenConnected = hasStatusEffect('slither');

          if (firedWhenDisconnected) return 'slither fired under the wrong id (branch is not id-gated)';
          if (!firedWhenConnected) return 'slither did not fire under the correct id';
          return 'ok';
        } finally {
          Math.random = _r; removeStatusEffect('slither');
          combat.active = false; combat.enemy = null; combat.messageQueue = [];
        }
      })()
    `), 'ok');

    // ── 16. Final: context left clean -- validation still passes with 0 errors
    assert.equal(runValidation(g).errors, 0, 'context must be left clean after all break-then-restore checks');
  },
};
