'use strict';
// Reclaimer literature is hidden beneath the Wend brewery's central vat. A
// small sparkle reveals the repeatable green-and-ochre document-reader treatment.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Wend Brewery: Reclaimer tract sparkles and uses its own document theme',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    g.run(`
      resetLocationState();activeMap=FEN_BREWERY_MAP;inFenBrewery=true;
      player.x=BREWERY_RECLAIMER_TRACT.x;player.y=BREWERY_RECLAIMER_TRACT.y+TILE;
      dialogue.open=false;choice.open=false;accordPanel.open=false;
    `);

    assert.deepEqual(
      JSON.parse(g.run('JSON.stringify([BREWERY_RECLAIMER_TRACT.x/TILE,BREWERY_RECLAIMER_TRACT.y/TILE])')),
      [10.5, 4.5]
    );
    assert.equal(g.run('FEN_BREWERY_MAP[3][10]'), 33, 'central vat remains on the tile above');
    assert.equal(g.run('FEN_BREWERY_MAP[4][10]'), 18, 'sparkle sits on unchanged floor immediately beneath the vat');

    const sparkle = JSON.parse(g.run(`(function(){
      var calls=[],old=drawExamineSparkle;
      drawExamineSparkle=function(){calls.push(Array.prototype.slice.call(arguments));};
      try{drawFenBreweryFurniture();}finally{drawExamineSparkle=old;}
      return JSON.stringify(calls);
    })()`));
    assert.deepEqual(sparkle, [[
      Math.round(10.5 * 32), Math.round(4.5 * 32), 10.5 * 32, 4.5 * 32,
      g.run('TALK_RADIUS*1.5'),
    ]]);

    g.run('interactThornmereWilds();');
    assert.equal(g.run('choice.open'), true);
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(choice.options)')), ['Read it', 'Leave it']);
    g.press(' ');
    assert.equal(g.run('accordPanel.open'), true);
    assert.equal(g.run('accordPanel.title'), 'EVERYTHING THEY OWN WAS MADE BY SOMEONE ELSE');
    assert.equal(g.run('accordPanel.theme'), 'reclaimer');
    assert.equal(g.run('accordPanel.pages.length'), 6);

    const text = g.run("BREWERY_RECLAIMER_TRACT_PAGES.flat().join(' ')");
    for (const line of [
      'The miller owns the wheel, but did he divert the river?',
      'This theft is so old that they have taught us to call it order.',
      'We do not suffer from scarcity alone. We suffer from permission.',
      'The Reclaimer answer is simple: they should not.',
      'Stand together instead.',
      'They possess the titles.',
      'We possess everything that makes those titles valuable.',
    ]) assert.ok(text.includes(line), 'tract preserves requested line: ' + line);

    const colours = JSON.parse(g.run(`(function(){
      var seen=[],old=ctx.fillRect;
      ctx.fillRect=function(){seen.push(ctx.fillStyle);};
      try{drawAccordPanel();}finally{ctx.fillRect=old;}
      return JSON.stringify(seen);
    })()`));
    for (const colour of ['#6f7440', '#d7cd91', '#213c2c', '#557040', '#f0d880'])
      assert.ok(colours.includes(colour), 'Reclaimer presentation draws ' + colour);
    assert.equal(colours.includes('#d84818'), false, 'Reclaimer reader does not use the Flame accent');

    g.run('accordPanel.open=false;choice.open=false;');
    g.run('interactThornmereWilds();');
    assert.equal(g.run('choice.open'), true, 'tract remains readable without a persistent read flag');

    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.equal(JSON.parse(g.run('JSON.stringify(validateGameData())')).errors, 0);
  },
};
