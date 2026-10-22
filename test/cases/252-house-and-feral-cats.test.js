'use strict';
// test/cases/61-house-and-feral-cats.test.js
//
// Covers the three cats added to Drenwick:
//   • Marla's two house cats (house:drenwick_north_a) — spriteType 'cat',
//     boundedWander (slow saunter), and a pet reaction that is a random purr OR
//     indifferent shrug with NO quest/flag/item side effects.
//   • The black feral cat (house:drenwick_apt_c1_u4, the empty fishing-rod flat)
//     — spriteType 'cat', the new `flee` movement type (keeps its distance from
//     the player, within authored bounds, and holds still once cornered), and a
//     stateful interaction: it GROWLS the first time and SCRATCHES for 2 every
//     time after, out of combat, floored at 1 HP (never a kill).
//
// The flee/wander engine lives in movement.js (startNpcRoute/updateNpcRoutes);
// this drives it through real frames and interactions, not internal calls.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function closeDialogue(g, max) {
  max = max || 8; let n = 0;
  while (g.run('dialogue.open') && n < max) { g.press('Enter'); n++; }
}
// Deterministic PRNG in the vm so wander pauses / flee decisions are stable
// across runs (same technique as 48-bounded-wander).
function seedRandom(g, seed) {
  g.run(`(function(){ var s = ${seed} >>> 0; Math.random = function(){ s = (1103515245 * s + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })()`);
}
const npc = (g, id, f) => g.run(`(function(){ var n = SIMPLE_NPCS.find(x => x.id === '${id}'); return ${f}; })()`);
function interactAt(g, x, y) {           // stand just below (x,y) and press interact
  g.run(`player.x = ${x}; player.y = ${y + 16}; player.facing = 'up';`);
  g.press('Enter');
}

module.exports = {
  name: 'House cats saunter and purr/ignore; the feral cat flees, then growls then scratches (-2)',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter'); // close intro
    seedRandom(g, 12345);               // deterministic wander/flee decisions

    // ── 1. All three are cat-sprited; movement types are as authored. ────────
    for (const id of ['north_a_cat_grey', 'north_a_cat_ginger', 'apt_c1_u4_feral_cat'])
      assert.equal(npc(g, id, 'n.spriteType'), 'cat', id + ' is a cat sprite');
    assert.equal(npc(g, 'north_a_cat_grey', 'n.movement.type'), 'boundedWander', 'house cat saunters');
    assert.equal(npc(g, 'north_a_cat_ginger', 'n.movement.type'), 'boundedWander', 'house cat saunters');
    assert.equal(npc(g, 'apt_c1_u4_feral_cat', 'n.movement.type'), 'flee', 'feral cat flees');
    // No quest/item strings attached to any of them.
    for (const id of ['north_a_cat_grey', 'north_a_cat_ginger', 'apt_c1_u4_feral_cat'])
      assert.equal(npc(g, id, '(n.flag_sets == null && (n.flag_required == null))'), true, id + ' sets/requires no flags');

    // ── 2. House cat: petting opens a purr-or-indifferent line, blank speaker,
    //       no HP change, no lingering callbacks (no quest/item). ─────────────
    g.run("enterHouse('drenwick_north_a');");
    g.frames(1); // let the wander engine start (ensureAutoMovers)
    assert.equal(g.run("!!NPC_ROUTES['north_a_cat_grey']"), true, 'the house cat has a live wander route on its map');
    g.run('stats.hp = 25; stats.maxHp = 30;');
    const gx = npc(g, 'north_a_cat_grey', 'n.x'), gy = npc(g, 'north_a_cat_grey', 'n.y');
    interactAt(g, gx, gy);
    assert.equal(g.run('dialogue.open'), true, 'petting opens a reaction');
    assert.equal(g.run("dialogue.name === ''"), true, 'the pet reaction is narration (blank speaker)');
    assert.match(g.run('dialogue.pages[0][0]'), /purr|unbothered|tolerates|blinks|not food/, 'purr or indifferent');
    assert.equal(g.run('stats.hp'), 25, 'petting a house cat never costs HP');
    assert.equal(g.run('dialogue.callbacks == null'), true, 'no quest/item callback hangs off a pet');
    closeDialogue(g);

    // Over many frames the saunterer actually moves (slow, but it moves) and
    // never leaves its authored bounds. Park the player far off so it isn't
    // just pinned against the "never step near the player" rule.
    g.run(`player.x = ${10.5 * 32}; player.y = ${8.5 * 32}; player.facing = 'down';`);
    const b = JSON.parse(g.run("JSON.stringify(SIMPLE_NPCS.find(n=>n.id==='north_a_cat_grey').movement.bounds)"));
    const sx = npc(g, 'north_a_cat_grey', 'n.x'), sy = npc(g, 'north_a_cat_grey', 'n.y');
    let moved = false;
    for (let i = 0; i < 60 && !moved; i++) {
      g.frames(60);
      const ax = npc(g, 'north_a_cat_grey', 'n.x'), ay = npc(g, 'north_a_cat_grey', 'n.y');
      if (ax !== sx || ay !== sy) moved = true;
      const col = Math.floor(ax / 32), row = Math.floor(ay / 32);
      assert.ok(col >= b.minCol && col <= b.maxCol && row >= b.minRow && row <= b.maxRow, 'house cat stays inside its wander bounds');
    }
    assert.ok(moved, 'the house cat saunters (moves off its start tile)');

    // ── 3. Feral cat: flees an approaching player, staying in bounds. ────────
    g.run("enterHouse('drenwick_apt_c1_u4');");
    const fb = JSON.parse(g.run("JSON.stringify(SIMPLE_NPCS.find(n=>n.id==='apt_c1_u4_feral_cat').movement.bounds)"));
    // Park the player two tiles below the cat's start; it should increase its
    // distance from the player over the next second, without leaving bounds.
    const fx0 = npc(g, 'apt_c1_u4_feral_cat', 'n.x'), fy0 = npc(g, 'apt_c1_u4_feral_cat', 'n.y');
    g.run(`player.x = ${fx0}; player.y = ${fy0 + 3 * 32};`);
    const d0 = g.run(`Math.hypot(${fx0} - player.x, ${fy0} - player.y)`);
    g.frames(120);
    const fx1 = npc(g, 'apt_c1_u4_feral_cat', 'n.x'), fy1 = npc(g, 'apt_c1_u4_feral_cat', 'n.y');
    const d1 = g.run(`Math.hypot(${fx1} - player.x, ${fy1} - player.y)`);
    assert.ok((fx1 !== fx0 || fy1 !== fy0), 'the feral cat bolts from an approaching player');
    assert.ok(d1 >= d0, 'the feral cat increases its distance from the player');
    const fcol = Math.floor(fx1 / 32), frow = Math.floor(fy1 / 32);
    assert.ok(fcol >= fb.minCol && fcol <= fb.maxCol && frow >= fb.minRow && frow <= fb.maxRow, 'the feral cat stays inside its bounds');

    // ── 4. Feral cat: first interaction GROWLS (no damage). ─────────────────
    g.run('stats.hp = 20; stats.maxHp = 30;');
    interactAt(g, fx1, fy1);
    assert.equal(g.run('dialogue.open'), true, 'the feral cat reacts when cornered');
    assert.match(g.run('dialogue.pages[0][0]'), /growl/, 'the first interaction is a growl');
    assert.equal(g.run('stats.hp'), 20, 'the growl does no damage');
    closeDialogue(g);

    // ── 5. Every interaction after that SCRATCHES for exactly 2. ─────────────
    interactAt(g, fx1, fy1);
    assert.match(g.run('dialogue.pages[0][0]'), /lashes out|rakes/, 'subsequent interactions scratch');
    assert.equal(g.run('stats.hp'), 18, 'the scratch deals exactly 2 damage');
    closeDialogue(g);

    // ── 6. The scratch is floored at 1 HP — a cat can sting, never kill. ─────
    g.run('stats.hp = 1;');
    interactAt(g, fx1, fy1);
    assert.equal(g.run('stats.hp'), 1, 'the scratch never drops the player below 1 HP');
    closeDialogue(g);
  },
};
