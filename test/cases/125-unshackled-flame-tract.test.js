'use strict';
// The Unshackled Flame tract is a visible, repeatable document on Polwick's
// ledger table and opens in a Flame-themed variant of the established full-page
// Accord reader. It adds no pickup, flag, map-grid delta, or save state.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: "Polwick's fort: Unshackled Flame tract uses the themed document reader",
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    g.run(`
      resetLocationState();
      activeMap=SMUGGLER_FORT_MAP;inSmugglerFort=true;fort_quest_stage=0;
      player.x=POLWICK_FLAME_TRACT.x;player.y=POLWICK_FLAME_TRACT.y+TILE;
      dialogue.open=false;choice.open=false;accordPanel.open=false;
    `);

    // The tract sits on the authored main table; no map cell or collision changed.
    assert.deepEqual(JSON.parse(g.run('JSON.stringify([POLWICK_FLAME_TRACT.x/TILE,POLWICK_FLAME_TRACT.y/TILE])')), [6.5, 7.5]);
    assert.equal(g.run('SMUGGLER_FORT_MAP[7][6]'), 33, 'tract rests on the existing table tile');

    g.run('interactSmugglerFort();');
    assert.equal(g.run('choice.open'), true);
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(choice.options)')), ['Read it', 'Leave it']);
    g.press(' ');

    assert.equal(g.run('accordPanel.open'), true);
    assert.equal(g.run('accordPanel.title'), 'THE WRONG SIDE WON');
    assert.equal(g.run('accordPanel.theme'), 'flame');
    assert.equal(g.run('accordPanel.pages.length'), 6);
    const text = g.run("POLWICK_FLAME_TRACT_PAGES.flat().join(' ')");
    for (const line of [
      'They teach the Century War as a warning.',
      'All births are terrible from inside the womb.',
      'The old chains were not destroyed. They were melted down and worked into delicate links.',
      'The Eight Threads were not born to bow before dull hands.',
      'Its registers depend upon compliance.',
      'Peace is the name they gave our defeat.',
      'Let it end.',
    ]) assert.ok(text.includes(line), 'tract preserves requested line: ' + line);

    // The in-world pamphlet and the reader's Flame mark both draw; ordinary
    // documents explicitly reset to the established Imperial theme.
    const flameColours = JSON.parse(g.run(`(function(){
      var seen=[],old=ctx.fillRect;
      ctx.fillRect=function(){seen.push(ctx.fillStyle);};
      try{drawPolwickFlameTract();drawAccordPanel();}finally{ctx.fillRect=old;}
      return JSON.stringify(seen);
    })()`));
    for (const colour of ['#3a0808', '#8a1818', '#d84818', '#f0a020'])
      assert.ok(flameColours.includes(colour), 'Flame presentation draws ' + colour);
    g.run(`
      var shelf=SIMPLE_NPCS.find(function(n){return n.id==='calwick_school_bookshelf';});
      choice.open=false;shelf.action();choice.callbacks[0]();choice.callbacks[0]();
    `);
    assert.equal(g.run('accordPanel.theme'), 'imperial');

    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.equal(JSON.parse(g.run('JSON.stringify(validateGameData())')).errors, 0);
  },
};
