'use strict';
// Muddied and Slither are kept in the game (effects, HUD, debug menu) but are no
// longer obtainable in normal play: no enemy, item, or terrain inflicts them, and
// nothing player-facing names them, so a new player never learns they exist. The
// single MUDSLITHER_INFLICTABLE gate (state.js) governs every acquisition path;
// the debug triggers still work. Nothing here toggles the flag (defaults off).

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Muddied/Slither: not obtainable in normal play (debug-only), effects/code retained',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // ── The gate defaults off. ───────────────────────────────────────────────
    assert.equal(g.run('MUDSLITHER_INFLICTABLE'), false, 'the acquisition gate is off by default');

    // ── No enemy inflicts them, even with the on-hit rolls forced to always hit. ─
    // Warden (muddied):
    g.run("statusEffects=[]; startCombat('briar_warden'); combat.isWarden=true; combat.messageQueue=[]; var _r=Math.random; Math.random=function(){return 0;}; applyEnemyHitEffects(); Math.random=_r;");
    assert.equal(g.run("hasStatusEffect('muddied')"), false, 'the Warden no longer muddies the player');
    assert.equal(g.run("combat.messageQueue.some(function(m){return /Muddied/.test(m);})"), false, 'no Muddied message is queued');
    g.run('endCombat();');
    // Corpse slug + shade wraith (slither):
    for (const id of ['enemy_corpse_slug', 'enemy_shade_wraith']) {
      g.run(`statusEffects=[]; startCombat('marsh_rat'); combat.enemy.id='${id}'; combat.messageQueue=[]; var _r=Math.random; Math.random=function(){return 0;}; applyEnemyHitEffects(); Math.random=_r;`);
      assert.equal(g.run("hasStatusEffect('slither')"), false, `${id} no longer slithers the player`);
      g.run('endCombat();');
    }

    // ── The muddying item (Ember Root) neither muddies nor advertises it. ─────
    assert.doesNotMatch(g.run("itemStatLabel(ITEM_REGISTRY['Ember Root'])"), /mudd/i, 'Ember Root shows no "muddies" tag');
    g.run("statusEffects=[]; stats.hp=1; stats.maxHp=30; startCombat('marsh_rat'); combat.flashTimer=0; stats.items=[createItem('Ember Root')]; combat.phase='item'; combat.itemCursor=0;");
    g.run('handleCombatAction();');
    assert.equal(g.run("hasStatusEffect('muddied')"), false, 'using Ember Root does not muddy the player');
    assert.equal(g.run("combat.messageQueue.concat([combat.message]).some(function(m){return /heavy|Muddied/i.test(m||'');})"), false, 'no message hints at a muddied side-effect');
    g.run('endCombat();');

    // ── No observe "tell" names either status. ───────────────────────────────
    assert.doesNotMatch(g.run("JSON.stringify(ENEMY_OBSERVATIONS['enemy_briar_warden'])"), /Muddy|Muddied/, 'the Warden observation never mentions Muddy');
    assert.doesNotMatch(g.run("JSON.stringify(ENEMY_OBSERVATIONS['enemy_shade_wraith'])"), /slither/i, 'the wraith observation never mentions slither');

    // ── But the effects and their code are retained: the debug triggers still
    //    apply them (the only remaining acquisition path). ────────────────────
    g.run("statusEffects=[];");
    assert.equal(g.run("typeof triggerMuddied==='function' && typeof triggerSlither==='function'"), true, 'the trigger functions still exist');
    g.run('triggerMuddied(); triggerSlither();');
    assert.equal(g.run("hasStatusEffect('muddied')"), true, 'debug can still apply Muddied');
    assert.equal(g.run("hasStatusEffect('slither')"), true, 'debug can still apply Slither');
    g.run("removeStatusEffect('muddied'); removeStatusEffect('slither');");
  },
};
