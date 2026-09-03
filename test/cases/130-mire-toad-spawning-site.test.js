'use strict';

// Northern Fen tile (6,6): repeatable decline, randomized three-Mire-Toad
// chain, one Reed Remedy after the third victory, and stable-id persistence.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function itemCount(g, name) {
  return g.run(`stats.items.filter(function(i){return i.name===${JSON.stringify(name)};}).length`);
}

function closeDialogue(g) {
  while (g.run('dialogue.open')) g.press('Enter');
}

module.exports = {
  name: 'Northern Fen Mire Toad spawning site: choice, randomized chain, reward, removal, persistence',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    g.run(`
      resetLocationState();
      placeAtLocation('MAP3_N1', 6.5*TILE, 6.5*TILE);
      player.facing='down';
    `);
    const id = 'pickup_map3n1_mire_toad_spawn';

    assert.equal(g.run(`PICKUP_REGISTRY['${id}'].x`), 6.5 * 32);
    assert.equal(g.run(`PICKUP_REGISTRY['${id}'].y`), 6.5 * 32);
    assert.equal(g.run(`isTileWalkable(mapRefForId('MAP3_N1')[6][6])`), true, 'site is on walkable reeds');
    assert.equal(g.run(`PICKUP_REGISTRY['${id}'].picked`), false);

    // The shared examine renderer draws exactly one sparkle for the site.
    const sparkle = JSON.parse(g.run(`(function(){
      var calls=[], old=drawExamineSparkle;
      drawExamineSparkle=function(){calls.push(Array.prototype.slice.call(arguments,0,4));};
      try{drawWorldItems();}finally{drawExamineSparkle=old;}
      return JSON.stringify(calls);
    })()`));
    assert.deepEqual(sparkle.filter(c => c[2] === 6.5 * 32 && c[3] === 6.5 * 32),
      [[6.5 * 32, 6.5 * 32, 6.5 * 32, 6.5 * 32]]);

    // Examine identifies the site, then declining closes cleanly and preserves it.
    g.run('handleInteract()');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /Mire Toad spawning site/);
    closeDialogue(g);
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(choice.options)')), ['Investigate', 'Leave it alone']);
    g.run('choice.cursor=1');
    g.press('Enter');
    assert.equal(g.run('choice.open || dialogue.open || combat.active'), false);
    assert.equal(g.run(`PICKUP_REGISTRY['${id}'].picked`), false, 'decline leaves sparkle retryable');

    // Re-examine and accept. Each chained starter consumes a fresh sex roll.
    g.run('handleInteract()');
    closeDialogue(g);
    g.run(`
      window.__oldRandom=Math.random;
      window.__toadRolls=[0.1,0.9,0.1];
      Math.random=function(){return window.__toadRolls.shift();};
    `);
    g.press('Enter'); // Investigate
    closeDialogue(g); // starts first fight
    assert.equal(g.run('combat.isMireToadSpawn && combat.mireToadRemaining===2'), true);
    assert.equal(g.run('combat.enemy.sex'), 'male');
    assert.equal(itemCount(g, 'Reed Remedy'), 0);

    // Running is blocked for the consecutive attack; it cannot skip the chain.
    g.run('Math.random=function(){return 0.5;}; combat.cursor=3; handleCombatAction();');
    assert.equal(g.run('combat.active'), true);
    assert.match(g.run('combat.message'), /spawning bed is all around you/);
    g.run('combat.phase="choose"; Math.random=function(){return window.__toadRolls.shift();};');

    g.run('combat.phase="victory"; handleCombatAction();');
    assert.equal(itemCount(g, 'Reed Remedy'), 0, 'no reward after first victory');
    closeDialogue(g);
    assert.equal(g.run('combat.enemy.sex'), 'female');
    assert.equal(g.run('combat.mireToadRemaining'), 1);

    g.run('combat.phase="victory"; handleCombatAction();');
    assert.equal(itemCount(g, 'Reed Remedy'), 0, 'no reward after second victory');
    closeDialogue(g);
    assert.equal(g.run('combat.enemy.sex'), 'male');
    assert.equal(g.run('combat.mireToadRemaining'), 0);

    g.run('combat.phase="victory"; handleCombatAction();');
    assert.equal(itemCount(g, 'Reed Remedy'), 1, 'third victory grants exactly one Reed Remedy');
    assert.equal(g.run(`PICKUP_REGISTRY['${id}'].picked`), true, 'third victory consumes site');
    closeDialogue(g);
    g.run('handleInteract()');
    assert.equal(g.run('dialogue.open || choice.open || combat.active'), false, 'resolved site cannot be re-opened');

    // Completion rides the existing stable pickup-id save path; SAVE_VERSION stays 4.
    g.run('Math.random=window.__oldRandom; delete window.__oldRandom; delete window.__toadRolls; saveGame();');
    g.run(`PICKUP_REGISTRY['${id}'].picked=false;`);
    assert.equal(g.run('loadGame()'), true);
    assert.equal(g.run(`PICKUP_REGISTRY['${id}'].picked`), true, 'resolved sparkle survives save/load');
    assert.equal(g.run('SAVE_VERSION'), 4);

    // A defeat ends the transient chain without consuming a fresh site's state.
    const retry = createContext();
    retry.press('Enter');
    retry.press('Enter');
    retry.run(`startMireToadSpawnCombat(2); combat.phase='defeat'; handleCombatAction();`);
    assert.equal(retry.run(`PICKUP_REGISTRY['${id}'].picked`), false, 'defeat leaves the site retryable');
    assert.equal(retry.run('combat.active'), false);
  },
};
