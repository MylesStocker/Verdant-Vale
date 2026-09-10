'use strict';

// The carved poem deep in the South Ruins (West Deeper Chamber, floor 13):
// a wall sparkle that warns the player it is long, then offers to read it in the
// accordPanel document reader.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'South Ruins carved poem: long-warning + read/leave gate + accordPanel reader',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // Stand at the poem sparkle on floor 13 and examine it.
    g.run(`
      inDungeon = true; dungeonFloor = 13; activeMap = DUNGEON8_WEST_LOWER2_MAP;
      inTown = false; inSluice = false;
      player.x = SOUTH_RUINS_POEM.x; player.y = SOUTH_RUINS_POEM.y;
      dialogue.open = false; choice.open = false; accordPanel.open = false;
      interactDungeon8WestDeep();
    `);

    // 1. It opens a dialogue that WARNS the poem is long, before any read prompt.
    assert.equal(g.run('dialogue.open'), true, 'examining the wall opens a dialogue');
    assert.equal(g.run('choice.open'), false, 'the read choice does not appear until the warning is read');
    assert.ok(/long/i.test(g.run('dialogue.pages.flat().join(" ")')), 'the warning says the poem is long');

    // 2. Dismissing the warning opens a Read it / Leave it choice.
    g.run('dialogue.callbacks[0]();');
    assert.equal(g.run('choice.open'), true, 'a read/leave choice follows the warning');
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(choice.options)')), ['Read it', 'Leave it'],
      'the choice is exactly Read it / Leave it');

    // 3. "Read it" opens the accordPanel reader with the paginated poem.
    g.run('choice.callbacks[0]();');
    assert.equal(g.run('accordPanel.open'), true, 'reading opens the document reader');
    assert.ok(g.run('accordPanel.pages.length') >= 8, 'the poem is paginated into many pages');
    assert.ok(/There was no room\./.test(g.run('accordPanel.pages[0].join(" ")')),
      'the poem begins with its opening line');
    // Every page fits the reader (no page packs more than the safe line budget).
    assert.ok(g.run('accordPanel.pages.every(function(p){ return p.length <= 11; })'),
      'no page exceeds the safe per-page line budget');

    // 4. "Leave it" (from a fresh open) does not open the reader.
    g.run(`
      dialogue.open = false; choice.open = false; accordPanel.open = false;
      interactDungeon8WestDeep(); dialogue.callbacks[0](); choice.callbacks[1]();
    `);
    assert.equal(g.run('accordPanel.open'), false, 'declining leaves the reader closed');

    assert.equal(g.run('validateGameData().errors'), 0, 'no validation errors');
  },
};
