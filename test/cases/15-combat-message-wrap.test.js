'use strict';
// Covers: the combat message box's text wrapping. Previously
// `drawCombat()` (render-battle.js) drew `combat.message` with a single,
// unwrapped `ctx.fillText()` call, so any message wider than the panel ran
// straight off the right edge of the box -- most visibly for long
// status-effect lines like Slither's "The slug's slime soaks in.
// Slithered! (SPD randomized each turn)".
//
// Fixed with a new `wrapMonospaceText(ctx, text, maxWidth)` helper, used to
// wrap the message to at most 2 lines (capped and ellipsis-truncated beyond
// that so the layout below it can never grow unbounded), with every fixed
// Y-offset below the message (HP bar, status icons, action menu, item list,
// victory/defeat overlays) shifted down by however many extra lines the
// message needed -- while the *bottom* edge of every box-shaped region below
// it is preserved exactly, so nothing else in the panel can overflow either.
//
// The real canvas stub's ctx.measureText() always returns a fixed
// {width: 40} (see harness.js -- it only needs to prove render code runs
// without throwing, not what it would actually draw), so it can't verify
// real wrapping math. This test instead calls the real, loaded
// wrapMonospaceText() directly with a fake proportional-width ctx (matching
// this game's monospace "Courier New" panel font), which is the part of
// this fix that actually needs pixel-accurate verification. It then
// separately smoke-tests that a full render with a long message active
// doesn't throw, across every combat phase.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Matches the real combat panel: PW=496, PAD=14 -> usable width 468px.
const MAX_WIDTH = 468;
const CHAR_W = 8.4; // approximate 14px "Courier New" advance width

function widthOf(s) { return s.length * CHAR_W; }

module.exports = {
  name: 'combat message box: long text wraps instead of overflowing',
  run() {
    const g = createContext();

    function wrap(text) {
      return g.run(`wrapMonospaceText({ measureText: s => ({ width: s.length * ${CHAR_W} }) }, ${JSON.stringify(text)}, ${MAX_WIDTH})`);
    }

    // 1. Short message stays on one line.
    {
      const lines = wrap('You attack for 5 damage!');
      assert.equal(lines.length, 1);
      assert.equal(lines[0], 'You attack for 5 damage!');
    }

    // 2. The exact reported offender: the Slither status message.
    {
      const msg = 'The slug’s slime soaks in. Slithered! (SPD randomized each turn)';
      const lines = wrap(msg);
      assert.ok(lines.length >= 2, `expected the slither message to wrap, got ${lines.length} line(s)`);
      for (const line of lines) {
        assert.ok(widthOf(line) <= MAX_WIDTH, `line "${line}" (${widthOf(line)}px) exceeds the panel width (${MAX_WIDTH}px)`);
      }
      assert.equal(lines.join(' '), msg, 'wrapping should not drop or duplicate any text');
    }

    // 3. Another real long in-game message (Briar Warden's Muddied line).
    {
      const msg = 'The Warden’s blow leaves you fouled with marsh muck. Muddied! (DEF−1, SPD−2)';
      const lines = wrap(msg);
      for (const line of lines) {
        assert.ok(widthOf(line) <= MAX_WIDTH, `line "${line}" exceeds the panel width`);
      }
      assert.equal(lines.join(' '), msg);
    }

    // 4. Pathological: a single unbroken "word" longer than the whole box
    // must still be hard-broken so no line can ever exceed maxWidth.
    {
      const msg = 'X'.repeat(200);
      const lines = wrap(msg);
      assert.ok(lines.length > 1);
      for (const line of lines) {
        assert.ok(widthOf(line) <= MAX_WIDTH, `hard-broken line exceeds the panel width (length ${line.length})`);
      }
      assert.equal(lines.join(''), msg, 'hard-broken chunks should reconstruct the original text exactly');
    }

    // 5. Full-stack smoke test: a real fight with the long Slither message
    // active must render without throwing, in every combat phase (this is
    // what actually exercises drawCombat()'s wrapping + layout-shift code,
    // not just the wrap function in isolation).
    g.press('Enter');
    g.press('Enter'); // close intro dialogue
    g.run('startCombat()');
    g.run(`
      combat.message = 'The slug’s slime soaks in. Slithered! (SPD randomized each turn)';
      combat.enemy = { name: 'Corpse Slug', hp: 40, maxHp: 62, atk: 13, def: 6, spd: 2 };
      statusEffects = ['slither'];
    `);
    for (const phase of ['choose', 'item', 'message', 'victory', 'defeat']) {
      g.run(`combat.phase = ${JSON.stringify(phase)};`);
      g.renderFrame(); // must not throw
    }
  },
};
