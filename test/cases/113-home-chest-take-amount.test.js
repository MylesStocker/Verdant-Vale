'use strict';
// The Home / life-savings chest (player_house) now offers "Take amount…" on the
// withdraw side, mirroring the existing "Deposit amount…" picker — so the player
// can pull out a chosen sum instead of only "Take all" or nothing. Withdraw is
// clamped to the chest balance; invalid input and cancel leave gold untouched.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  // Stand inside the player's house, at the chest tile.
  g.run("inTown=true; townBuilding='house'; currentHouseId='player_house';");
  g.run("player.x=11.5*TILE; player.y=7.5*TILE;");
  return g;
}
const G = (g, c) => g.run(c);
// Open the chest and invoke the "Take amount…" callback with a given prompt reply.
function takeAmount(g, reply) {
  g.run("choice.open=false; dialogue.open=false; interactHouseInterior();");
  g.run(`window.prompt=function(){return ${JSON.stringify(reply)};};`);
  g.run("var _i=choice.options.indexOf('Take amount…'); choice.callbacks[_i]();");
}

module.exports = {
  name: 'Home chest: Take amount… withdraws a chosen sum (mirrors Deposit amount…)',
  run() {
    const g = fresh();

    // ── 0. With gold in the chest, "Take amount…" is offered, ahead of "Take all",
    //       and alongside the existing deposit options. ───────────────────────
    g.run("HOUSE_DATA.player_house.chest.gold=100; stats.gold=5;");
    g.run("choice.open=false; dialogue.open=false; interactHouseInterior();");
    const opts = JSON.parse(g.run('JSON.stringify(choice.options)'));
    assert.ok(opts.includes('Take amount…'), 'Take amount… is offered when the chest holds gold');
    assert.ok(opts.indexOf('Take amount…') < opts.indexOf('Take all  (100g)'),
      'Take amount… precedes Take all (mirrors Deposit amount… before Deposit all)');

    // ── 1. A valid partial withdrawal moves exactly that much to the pocket. ──
    takeAmount(g, '30');
    assert.equal(G(g, 'stats.gold'), 35, 'pocket gains 30 (5 → 35)');
    assert.equal(G(g, 'HOUSE_DATA.player_house.chest.gold'), 70, 'chest drops by 30 (100 → 70)');
    assert.match(G(g, 'JSON.stringify(dialogue.pages)'), /You take 30g from the chest/, 'reports the amount taken');

    // ── 2. Over-withdrawal clamps to the chest balance (never goes negative). ─
    takeAmount(g, '999');
    assert.equal(G(g, 'HOUSE_DATA.player_house.chest.gold'), 0, 'chest cannot go below zero');
    assert.equal(G(g, 'stats.gold'), 105, 'pocket receives only what the chest held (35 + 70)');

    // ── 3. Invalid input is rejected; nothing moves. ─────────────────────────
    g.run("HOUSE_DATA.player_house.chest.gold=50; stats.gold=10;");
    for (const bad of ['abc', '0', '-5']) {
      takeAmount(g, bad);
      assert.equal(G(g, 'HOUSE_DATA.player_house.chest.gold'), 50, `chest unchanged for input "${bad}"`);
      assert.equal(G(g, 'stats.gold'), 10, `pocket unchanged for input "${bad}"`);
      assert.match(G(g, 'JSON.stringify(dialogue.pages)'), /Not a valid amount/, `input "${bad}" reports invalid`);
    }

    // ── 4. Cancelling the prompt (null) leaves gold untouched. ───────────────
    g.run("choice.open=false; dialogue.open=false; interactHouseInterior();");
    g.run("window.prompt=function(){return null;};");
    g.run("var _i=choice.options.indexOf('Take amount…'); choice.callbacks[_i]();");
    assert.equal(G(g, 'HOUSE_DATA.player_house.chest.gold'), 50, 'chest unchanged on cancel');
    assert.equal(G(g, 'stats.gold'), 10, 'pocket unchanged on cancel');

    // ── 5. An empty chest offers no take options at all (unchanged behavior). ─
    g.run("HOUSE_DATA.player_house.chest.gold=0; stats.gold=25;");
    g.run("choice.open=false; dialogue.open=false; interactHouseInterior();");
    const empty = JSON.parse(g.run('JSON.stringify(choice.options)'));
    assert.ok(!empty.includes('Take amount…'), 'no Take amount… when the chest is empty');
    assert.ok(!empty.some(o => o.startsWith('Take all')), 'no Take all when the chest is empty');
  },
};
