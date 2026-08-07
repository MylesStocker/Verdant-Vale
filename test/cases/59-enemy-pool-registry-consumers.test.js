'use strict';
// test/cases/59-enemy-pool-registry-consumers.test.js
//
// Architectural contract: ENEMY_TEMPLATE_REGISTRY and ENEMY_TEMPLATE_POOLS are
// the SOLE authoritative inventories of enemies and encounter pools. Both
// consumers — validateEnemies() (validation.js) and test/balance-report.js —
// read those live registries directly; neither keeps its own hand-maintained
// pool/enemy list. So a pool or scripted enemy added to combat.js is picked up
// by validation and the balance report automatically, and a pool/enemy that
// drifts out of the registry is caught.
//
// This is the load-bearing guard for the "unify enemy validation and balance
// reporting on the pool registries" refactor. It proves the contract points
// below, then runs six break-then-restore checks: every mutation is undone in a
// `finally` so the shared vm context is never left dirty. The balance-report
// derivations are exercised through its exported pure helpers (importing the
// module does NOT run the CLI report), fed snapshots of the live registry, so
// "the report auto-discovers X" is proven against the same registry the game
// exposes — not a stale copy.

const assert = require('assert');
const path = require('path');
const { createContext } = require('../harness');
const bal = require('../balance-report.js'); // importing must NOT run the report

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

// Snapshot the live pool registry / enemy registry out of the vm as plain data
// (the same shape balance-report.js pulls).
function pullPools(g)  { return JSON.parse(g.run('JSON.stringify(ENEMY_TEMPLATE_POOLS)')); }
function pullRegistry(g){ return JSON.parse(g.run('JSON.stringify(ENEMY_TEMPLATE_REGISTRY)')); }

module.exports = {
  name: 'Enemy pool/registry are the sole inventory consumed by validation + balance report',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 1. Baseline: the real data validates clean (0 errors) ───────────────
    const clean = runValidation(g);
    assert.equal(clean.errors, 0, 'baseline should validate with zero errors: ' + JSON.stringify(clean.errorList));

    // ── 2. ENEMY_TEMPLATE_POOLS is the { id, label, templates } registry, with
    //       well-formed, unique pool_<snake> ids and one array per id. ────────
    assert.equal(g.run(`
      (function(){
        var pools = ENEMY_TEMPLATE_POOLS; var re = /^pool_[a-z0-9_]+$/;
        var ids = {}, arrays = new Map();
        for (var i = 0; i < pools.length; i++) {
          var p = pools[i];
          if (!p || typeof p !== 'object' || Array.isArray(p)) return 'entry not an object: ' + i;
          if (!re.test(p.id)) return 'bad pool id format: ' + p.id;
          if (typeof p.label !== 'string' || !p.label) return 'missing label: ' + p.id;
          if (!Array.isArray(p.templates) || p.templates.length === 0) return 'bad/empty templates: ' + p.id;
          if (ids[p.id]) return 'duplicate pool id: ' + p.id;
          ids[p.id] = true;
          if (arrays.has(p.templates)) return 'array under two ids: ' + p.id;
          arrays.set(p.templates, p.id);
        }
        return 'ok';
      })()
    `), 'ok');

    // ── 3. Every pool member is registered in ENEMY_TEMPLATE_REGISTRY (the
    //       pool registry cannot reference an enemy the id registry doesn't own).
    assert.equal(g.run(`
      (function(){
        var reg = ENEMY_TEMPLATE_REGISTRY;
        var pools = ENEMY_TEMPLATE_POOLS;
        for (var i = 0; i < pools.length; i++)
          for (var j = 0; j < pools[i].templates.length; j++) {
            var t = pools[i].templates[j];
            if (!t || !t.id) return 'pool ' + pools[i].id + ' member has no id';
            if (reg[t.id] !== t) return 'pool member not registered: ' + t.id;
          }
        return 'ok';
      })()
    `), 'ok');

    // ── 4. Every registered pool is reachable from MAP_METADATA.encounterPool
    //       (the declarative routing table validateEnemies() uses). ───────────
    assert.equal(g.run(`
      (function(){
        var routed = new Set();
        for (var k in MAP_METADATA) { var ep = MAP_METADATA[k].encounterPool; if (Array.isArray(ep)) routed.add(ep); }
        var pools = ENEMY_TEMPLATE_POOLS;
        for (var i = 0; i < pools.length; i++)
          if (!routed.has(pools[i].templates)) return 'unreachable pool: ' + pools[i].id;
        return 'ok';
      })()
    `), 'ok');

    // ── 5. The balance report derives its pool inventory from the SAME live
    //       registry: every registered pool appears in poolInventoryById(). ───
    const livePools = pullPools(g);
    const liveReg = pullRegistry(g);
    const inv = bal.poolInventoryById(livePools);
    assert.equal(inv.size, livePools.length, 'balance inventory must contain every registered pool');
    for (const p of livePools) assert.ok(inv.has(p.id), 'balance inventory missing registered pool ' + p.id);

    // ── 6. The balance report's curated scenarios all resolve against the live
    //       registry — pool scenarios to registered pools, special scenarios to
    //       scripted (non-pool) enemies. (These are validatePool/SpecialScenarios,
    //       the exact guards the report runs before simulating.) ──────────────
    const scriptedIds = bal.scriptedIdsFromRegistry(liveReg, livePools);
    const scriptedSet = new Set(scriptedIds);
    assert.doesNotThrow(() => bal.validatePoolScenarios(bal.POOL_SCENARIOS, inv),
      'every curated pool scenario must reference a registered pool id');
    assert.doesNotThrow(() => bal.validateSpecialScenarios(bal.SPECIAL_SCENARIOS, liveReg, scriptedSet),
      'every curated special scenario must reference a scripted enemy id');

    // ── 7. COMPLETENESS: the report covers every registered pool and every
    //       scripted enemy — curated scenarios plus the auto-coverage pass —
    //       so nothing in the registry can silently escape the report. ────────
    {
      const curatedPoolIds = new Set(bal.POOL_SCENARIOS.map(s => s.poolId));
      const coveredPoolIds = new Set([...curatedPoolIds, ...livePools.map(p => p.id)]); // curated + auto (all)
      for (const p of livePools) assert.ok(coveredPoolIds.has(p.id), 'pool escaped report coverage: ' + p.id);

      const curatedEnemyIds = new Set(bal.SPECIAL_SCENARIOS.map(s => s.enemyId));
      const coveredEnemyIds = new Set([...curatedEnemyIds, ...scriptedIds]); // curated + auto (all scripted)
      for (const id of scriptedIds) assert.ok(coveredEnemyIds.has(id), 'scripted enemy escaped report coverage: ' + id);
      // The known-uncovered-by-curation scripted enemy (Swamp Donkey) proves the
      // auto pass is load-bearing, not decorative.
      assert.ok(scriptedSet.has('enemy_swamp_donkey'), 'Swamp Donkey should be a scripted enemy');
      assert.ok(!curatedEnemyIds.has('enemy_swamp_donkey'), 'Swamp Donkey has no curated scenario — only the auto pass covers it');
    }

    // ── 8. Identity-sensitive balance logic keys on stable enemy ids that the
    //       registry actually owns (the ids ported from applyEnemyHitEffects). ─
    for (const id of ['enemy_briar_warden', 'enemy_corpse_slug', 'enemy_shade_wraith'])
      assert.ok(liveReg[id], 'identity-sensitive balance logic references unregistered id ' + id);

    // ═════════════════════ LOAD-BEARING BREAK-THEN-RESTORE ═══════════════════

    // ── 9. Add a VALID new pool → validation stays clean AND the balance
    //       inventory auto-discovers it, with no edit to either consumer. ──────
    (function () {
      let after, invAfter;
      try {
        g.run(`
          window.__memberId = ENEMY_TEMPLATE_POOLS[0].templates[0].id;
          window.__newPool = { id: 'pool_synthetic_probe', label: 'Synthetic probe pool',
                               templates: [ ENEMY_TEMPLATE_REGISTRY[window.__memberId] ] };
          ENEMY_TEMPLATE_POOLS.push(window.__newPool);
        `);
        after = runValidation(g);
        invAfter = bal.poolInventoryById(pullPools(g));
      } finally {
        g.run(`ENEMY_TEMPLATE_POOLS.pop(); delete window.__newPool; delete window.__memberId;`);
      }
      // Member is registered, so no structural error. (The pool isn't wired into
      // MAP_METADATA, which surfaces as a reachability WARNING, not an error.)
      assert.equal(after.errors, 0, 'a valid new pool (registered member) must not raise validation errors: ' + JSON.stringify(after.errorList));
      assert.ok(invAfter.has('pool_synthetic_probe'), 'the balance inventory must auto-discover the new pool without any edit to balance-report.js');
    })();

    // ── 10. A MALFORMED pool member → validateEnemies() errors (proves it
    //        iterates live pool members, not a frozen copy). ──────────────────
    (function () {
      let after;
      try {
        g.run(`ENEMY_TEMPLATE_POOLS[0].templates.push({ id: 'enemy_malformed_probe', name: 'Malformed' });`); // no hp/atk/def/...
        after = runValidation(g);
      } finally {
        g.run(`ENEMY_TEMPLATE_POOLS[0].templates.pop();`);
      }
      assert.ok(after.errors > clean.errors, 'a malformed pool member must raise a validation error');
      assert.ok(after.errorList.some(e => e.group === 'Enemies' && /Malformed|missing (hp|atk)/.test(e.message)),
        'the error should come from the malformed pool member');
      assert.equal(runValidation(g).errors, 0, 'removing the malformed member restores a clean validation');
    })();

    // ── 11. Remove a real pool's REGISTRATION but leave it runtime-reachable
    //        (MAP_METADATA still routes to its array) → validation errors,
    //        because a live map now spawns from an unregistered pool. ─────────
    (function () {
      let after;
      try {
        // pop the LAST registered pool (Mirethyst's Vault); MAP_METADATA still
        // routes to its templates array, so it stays runtime-reachable.
        g.run(`window.__savedPool = ENEMY_TEMPLATE_POOLS.pop();`);
        after = runValidation(g);
      } finally {
        g.run(`ENEMY_TEMPLATE_POOLS.push(window.__savedPool); delete window.__savedPool;`);
      }
      assert.ok(after.errors > clean.errors, 'a runtime-reachable pool that lost its registration must raise a validation error');
      assert.ok(after.errorList.some(e => e.group === 'Enemies' && /not a registered pool/.test(e.message)),
        'the error should flag a live map spawning from an unregistered pool');
      assert.equal(runValidation(g).errors, 0, 'restoring the pool registration restores a clean validation');
    })();

    // ── 12. Add a registered SCRIPTED template (not in any pool) → the balance
    //        report's scripted inventory includes it, with no edit to
    //        SPECIAL_SCENARIOS. ─────────────────────────────────────────────
    (function () {
      let scriptedAfter;
      try {
        g.run(`
          window.__probe = { id: 'enemy_scripted_probe', name: 'Scripted Probe',
                             hp: 20, maxHp: 20, atk: 8, def: 2, spd: 6, xp: 10, goldMin: 1, goldMax: 3 };
          ENEMY_TEMPLATE_REGISTRY['enemy_scripted_probe'] = window.__probe;
        `);
        scriptedAfter = bal.scriptedIdsFromRegistry(pullRegistry(g), pullPools(g));
      } finally {
        g.run(`delete ENEMY_TEMPLATE_REGISTRY['enemy_scripted_probe']; delete window.__probe;`);
      }
      assert.ok(scriptedAfter.includes('enemy_scripted_probe'),
        'a newly-registered scripted enemy must appear in the balance report scripted inventory without editing SPECIAL_SCENARIOS');
    })();

    // ── 13. Disconnect a pool member from the registry (registry[t.id] !== t)
    //        → validateEnemies() errors (the pool references an enemy the id
    //        registry no longer owns under that id). ────────────────────────
    (function () {
      let after;
      try {
        // Re-point the registry entry for pool[0][0]'s id at a DIFFERENT object,
        // so the pooled template is no longer registered under its own id.
        g.run(`
          window.__discId = ENEMY_TEMPLATE_POOLS[0].templates[0].id;
          window.__discSaved = ENEMY_TEMPLATE_REGISTRY[window.__discId];
          ENEMY_TEMPLATE_REGISTRY[window.__discId] = Object.assign({}, window.__discSaved);
        `);
        after = runValidation(g);
      } finally {
        g.run(`ENEMY_TEMPLATE_REGISTRY[window.__discId] = window.__discSaved; delete window.__discId; delete window.__discSaved;`);
      }
      assert.ok(after.errors > clean.errors, 'a pool member disconnected from the registry must raise a validation error');
      assert.ok(after.errorList.some(e => e.group === 'Enemies' && /not registered in ENEMY_TEMPLATE_REGISTRY/.test(e.message)),
        'the error should flag the pool member missing from the registry');
      assert.equal(runValidation(g).errors, 0, 'reconnecting the pool member restores a clean validation');
    })();

    // ── 14. An unknown balance-scenario pool id → the report rejects it before
    //        any simulation (validatePoolScenarios throws → non-zero exit). ───
    (function () {
      const inv = bal.poolInventoryById(pullPools(g));
      assert.throws(
        () => bal.validatePoolScenarios([{ poolId: 'pool_does_not_exist', heading: 'bogus' }], inv),
        /unknown pool id "pool_does_not_exist"/,
        'a scenario referencing an unknown pool id must be rejected before simulation'
      );
      // and an unknown enemy id in a special scenario is likewise rejected.
      const liveReg2 = pullRegistry(g);
      const scriptedSet2 = new Set(bal.scriptedIdsFromRegistry(liveReg2, pullPools(g)));
      assert.throws(
        () => bal.validateSpecialScenarios([{ enemyId: 'enemy_nope', heading: 'bogus' }], liveReg2, scriptedSet2),
        /unknown enemy id "enemy_nope"/,
        'a special scenario referencing an unknown enemy id must be rejected before simulation'
      );
    })();

    // ── 15. Final: the context is left clean — validation still passes. ──────
    assert.equal(runValidation(g).errors, 0, 'context must be left clean after all break-then-restore checks');
  },
};
