'use strict';
// Completing the Sena↔Davan courier quest (drama_stage) now rewards 2 Elixirs
// instead of 25 gold. The reward fires from the final Sena dialogue's completion
// callback (interactions.js), which also advances drama_stage 4 → 5.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Davan/Sena note quest: completion rewards 2 Elixirs (not gold)',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // Stand next to Sena in Calwick carrying the final note (stage 4).
    assert.ok(g.run("!!SIMPLE_NPCS.find(n=>n.id==='sena')"), 'Sena NPC exists');
    g.run("drama_stage=4; syncQuestFlagsToWindow(); inTown=true; currentTownId='calwick'; townBuilding=null;");
    g.run("var s=SIMPLE_NPCS.find(n=>n.id==='sena'); player.x=s.x; player.y=s.y-0.4*TILE;");
    g.run("stats.items.length=0; stats.gold=40; dialogue.open=false; choice.open=false;");

    // Hand over the note; drain the multi-page Sena dialogue so the completion
    // callback fires on the last page.
    g.run("handleInteract();");
    assert.equal(g.run('dialogue.open'), true, 'delivering the final note opens Sena’s dialogue');
    assert.equal(g.run('dialogue.name'), 'Sena', 'it is Sena speaking');
    // The player is told, in dialogue, that they received the Elixirs.
    const pagesText = g.run('JSON.stringify(dialogue.pages)');
    assert.match(pagesText, /Elixir/, 'the completion dialogue names the Elixir reward');
    assert.match(pagesText, /Got 2 Elixirs/, 'the completion dialogue announces the 2 Elixirs');
    for (let i = 0; i < 8; i++) g.press('Enter');

    // Reward: exactly 2 Elixirs, no gold change, quest marked complete.
    assert.equal(g.run("inventoryItems().filter(i=>i.name==='Elixir').length"), 2, 'grants exactly 2 Elixirs');
    assert.equal(g.run('inventoryItems().length'), 2, 'and nothing else');
    assert.equal(g.run('stats.gold'), 40, 'gold is unchanged (reward is no longer 25g)');
    assert.equal(g.run('drama_stage'), 5, 'quest advances to complete (stage 5)');

    // Idempotent: re-approaching Sena after completion does not re-grant the reward.
    g.run("dialogue.open=false; choice.open=false; handleInteract();");
    for (let i = 0; i < 8; i++) g.press('Enter');
    assert.equal(g.run("inventoryItems().filter(i=>i.name==='Elixir').length"), 2, 'no double reward after completion');
    assert.equal(g.run('drama_stage'), 5, 'still complete');
  },
};
