'use strict';
// Nine bounded player-facing polish fixes: Merta's soup, Schilling notice text,
// causeway/gift sparkles, Sunken Gallery reward placement, infirmary Esla,
// hidden debug hint, Corvin's notebook entry, and explicit curse prefixes.

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');

const ROOT = path.join(__dirname, '..', '..');

module.exports = {
  name: 'small meaningful polish: soup, labels, sparkles, rewards, Esla, notebook, and curse clarity',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // 1. Merta names the dish, heals exactly 5 HP (capped), and reports it.
    g.run("stats.hp=10;stats.maxHp=20;statusEffects=[];choice.open=false;dialogue.open=false;SIMPLE_NPCS.find(function(n){return n.id==='merta';}).action();");
    assert.match(g.run('choice.options[0]'), /South Mushroom Soup/);
    g.run('choice.callbacks[0]();');
    assert.equal(g.run('stats.hp'), 15);
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /South Mushroom Soup/);
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /Healed 5 HP\./);

    // 2. Both live states of Schilling's notice use the canonical place name.
    for (const started of [false, true]) {
      g.run(`day=2;schilling_returned=false;schilling_quest_started=${started};refreshJobBoard();`);
      const notice = g.run('JOB_BOARD_NOTICES[0]');
      assert.match(notice, /South Ruins/);
      assert.doesNotMatch(notice, /east dungeon/i);
    }

    // 3. The broken-causeway feature opts into the shared sparkle at its exact point.
    assert.equal(g.run("MAP_FEATURES.EAST_CAUSEWAY_MAP.find(function(f){return f.id==='east_causeway_break';}).sparkle"), true);
    const causewaySparkles = JSON.parse(g.run(`(function(){
      resetLocationState();placeAtLocation('EAST_CAUSEWAY_MAP',10.5*TILE,8.5*TILE);
      var calls=[],old=drawExamineSparkle;drawExamineSparkle=function(sx,sy){calls.push([sx,sy]);};
      try{drawAuthoredMapFeatureSparkles();}finally{drawExamineSparkle=old;}
      return JSON.stringify(calls);
    })()`));
    assert.deepEqual(causewaySparkles, [[Math.round(10.5 * 32), Math.round(8.5 * 32)]]);

    // 4. The Drowned's gift sparkles only while it is present, and its notebook
    // description is specific and pithy rather than the generic fallback.
    const giftSparkles = JSON.parse(g.run(`(function(){
      resetLocationState();activeMap=SUNKEN_GALLERY_R1C2;inSunkenGallery=true;MainQuest=4;
      window.sunken_gallery_drowned_freed=true;window.sunken_gallery_drowned_slain=false;window.sunken_gallery_gift_taken=false;
      var counts=[],old=drawExamineSparkle;drawExamineSparkle=function(){counts.push(arguments.length);};
      drawSunkenGalleryFeatures();window.sunken_gallery_gift_taken=true;drawSunkenGalleryFeatures();drawExamineSparkle=old;
      return JSON.stringify(counts);
    })()`));
    assert.equal(giftSparkles.length, 1, 'gift has one sparkle before pickup and none afterward');
    assert.equal(g.run("getSpecialItemInspectPages(\"The Drowned's Gift\")[0][0]"),
      'A hideous little thank-you, made with enormous care.');

    // 5. Potion and Bullet Time have swapped sources without changing either
    // existing persistence authority.
    assert.equal(g.run('SUNKEN_GALLERY_CHEST.item.name'), 'Potion');
    g.run(`
      activeMap=SUNKEN_GALLERY_R2C2;inSunkenGallery=true;player.x=8.5*TILE;player.y=8.5*TILE;
      window.sunken_gallery_recess_opened=false;stats.items=[];dialogue.open=false;choice.open=false;
      interactSunkenGallery();dialogue.callbacks[0]();choice.callbacks[0]();
    `);
    assert.equal(g.run("stats.items.filter(function(i){return i.name==='Bullet Time';}).length"), 1);
    assert.equal(g.run('window.sunken_gallery_recess_opened'), true);

    // 6. Infirmary Esla dispatches through the established bespoke Esla palette.
    assert.equal(g.run("typeof NPC_DRAW_FNS.infirmary_esla"), 'function');
    const eslaStyles = JSON.parse(g.run(`(function(){
      var npc=SIMPLE_NPCS.find(function(n){return n.id==='infirmary_esla';}),styles=[],old=ctx.fillRect;
      ctx.fillRect=function(){styles.push(ctx.fillStyle);};
      try{drawOneContentNPC(npc);}finally{ctx.fillRect=old;}
      return JSON.stringify(styles);
    })()`));
    assert.ok(eslaStyles.includes('#2a9a28'), 'Esla has her distinctive green hair');
    assert.ok(eslaStyles.includes('#3a6868'), 'Esla has her established teal blouse');

    // 7. The normal render no longer advertises how to open the debug menu.
    const renderSource = fs.readFileSync(path.join(ROOT, 'render.js'), 'utf8');
    assert.doesNotMatch(renderSource, /\[ ` \] debug|Debug menu hint/);

    // 8. Corvin's accepted favour appears only while active.
    g.run('corvin_favor_started=true;corvin_favor_done=false;');
    let struck = JSON.parse(g.run("JSON.stringify(getActiveQuestNotes().filter(function(n){return n.title==='The Struck Entry';}))"));
    assert.deepEqual(struck, [{ title: 'The Struck Entry', body: "Find Corvin's father's original towpath tally in the old Drenwick canal office." }]);
    g.run('corvin_favor_done=true;');
    struck = JSON.parse(g.run("JSON.stringify(getActiveQuestNotes().filter(function(n){return n.title==='The Struck Entry';}))"));
    assert.deepEqual(struck, []);

    // 9. Every authored curse-caused mishap starts with the same plain cue.
    g.run(`
      statusEffects=['cursed'];resetLocationState();activeMap=DUNGEON_MAP;inDungeon=true;dungeonFloor=1;
      DUNGEON_CHEST.opened=false;player.x=DUNGEON_CHEST.x;player.y=DUNGEON_CHEST.y;dialogue.open=false;
      interactDungeonFloor1();
    `);
    assert.match(g.run('dialogue.pages[0][0]'), /^Cursed!/);
    const combatSource = fs.readFileSync(path.join(ROOT, 'combat.js'), 'utf8');
    const movementSource = fs.readFileSync(path.join(ROOT, 'movement.js'), 'utf8');
    const southRuinsSource = fs.readFileSync(path.join(ROOT, 'content/interactions/south-ruins-interactions.js'), 'utf8');
    const sluiceSource = fs.readFileSync(path.join(ROOT, 'content/interactions/thornmere-wilds-interactions.js'), 'utf8');
    assert.equal((combatSource.match(/`Cursed! \$\{stats\.name\} swings wildly/g) || []).length, 2);
    assert.match(movementSource, /showWorldToast\('Cursed! '/);
    assert.equal((southRuinsSource.match(/\[\['Cursed! You yank/g) || []).length, 2);
    assert.match(sluiceSource, /\[\['Cursed! You trip/);

    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.equal(JSON.parse(g.run('JSON.stringify(validateGameData())')).errors, 0, 'validation remains clean');
  },
};
