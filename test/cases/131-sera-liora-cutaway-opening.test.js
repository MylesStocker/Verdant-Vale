'use strict';

// Covers the debug-only preview of the fully scripted first Sera/Liora cutaway:
// scoped typography, Bethany room/staging, input lock, ordered beats/actions,
// and the temporary continuation into Esla's existing Drenwick waking sequence.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const EXPECTED = [
  ['Sera',  'Liora.'],
  ['Sera',  'Liora, wake up.'],
  ['Liora', 'I am awake.'],
  ['Sera',  'You said that five minutes ago.'],
  ['Liora', 'Was I convincing?'],
  ['Sera',  'Not especially.'],
  ['Liora', 'Then let me try again.'],
  ['Sera',  'Open your eyes.'],
  ['Liora', 'Is something wrong?'],
  ['Sera',  'Quite the opposite. The clouds have sunk below the lower roofs. The upper terraces look as though they’ve floated away.'],
  ['Liora', 'Have they?'],
  ['Sera',  'Come to the window and decide.'],
  ['Liora', 'They’ll still be floating at noon.'],
  ['Sera',  'The clouds won’t. And the starflower stalls are opening.'],
  ['Liora', 'You saved the flowers until the end.'],
  ['Sera',  'I know my audience.'],
  ['Liora', 'Five more minutes.'],
  ['Sera',  'You spent them.'],
  ['Liora', 'I was asleep. They don’t count.'],
  ['Sera',  'Up.'],
  ['Liora', 'All right. But if the town is still attached to the mountain, I’m coming back.'],
  ['Sera',  'Agreed.'],
];

module.exports = {
  name: 'First Sera/Liora cutaway debug preview: white opening, scoped style, scripted Bethany room, hospital continuation',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    assert.equal(g.run('SAVE_VERSION'), 4, 'save schema version remains unchanged');
    assert.equal(g.run("SERA_LIORA_CUTAWAY_SCENE_ID"), 'sera_liora_cutaway_opening');
    assert.equal(g.run("SERA_LIORA_GUEST_ROOM_ID"), 'bethany_guest_house_finest_room');
    assert.equal(g.run('SERA_LIORA_CUTAWAY_BEATS.length'), 22, 'exactly 22 approved dialogue beats');
    assert.deepEqual(
      JSON.parse(g.run('JSON.stringify(SERA_LIORA_CUTAWAY_BEATS.map(function(b){return [b.character,b.text];}))')),
      EXPECTED,
      'approved wording, contractions, speakers, and order are exact'
    );
    assert.equal(g.run("SERA_LIORA_CUTAWAY_BEATS.filter(function(b){return b.character==='Sera';}).every(function(b){return b.styleId===SERA_DIALOGUE_STYLE_ID;})"), true,
      'every Sera entry explicitly opts into the elegant style');
    assert.equal(g.run("SERA_LIORA_CUTAWAY_BEATS.filter(function(b){return b.character==='Liora';}).every(function(b){return b.styleId===null;})"), true,
      'every Liora entry keeps default typography');
    assert.equal(g.run("/Sera/.test(dialogueTextStyle.toString())"), false,
      'style resolution does not compare a speaker name');

    assert.equal(g.run("basinChamberDreamSequence.toString().includes('startSeraLioraCutaway')"), false,
      'normal story progression does not expose the held cutaway');
    g.run('window.basin_chamber_dream_done=false; window.basin_chamber_exits=0;' +
          'reservoir_report_filed=false; syncQuestFlagsToWindow(); debugPlaySeraLioraCutaway();');
    assert.equal(g.run('seraLioraCutscene.active'), true);
    assert.equal(g.run('seraLioraCutscene.startCount'), 1);
    g.run('startSeraLioraCutaway()');
    assert.equal(g.run('seraLioraCutscene.startCount'), 1, 'active cutaway cannot duplicate itself');
    assert.equal(g.run('activeMap === DREAM_MAP'), true, 'debug preview stages the existing white map');
    assert.equal(g.run('seraLioraCutscene.beat'), 0);
    assert.equal(g.run('dialogue.pages[0][0]'), 'Liora.');
    assert.equal(g.run('dialogue.name'), '', 'Sera remains unnamed over white');
    assert.equal(g.run('dialogue.presentation'), 'white_field');
    assert.equal(g.run('dialogue.styleId'), 'sera_elegant');
    assert.equal(g.run("drawActiveMapContent.toString().includes('drawPlayer();')"), true, 'ordinary player rendering still exists');
    assert.equal(g.run("drawActiveMapContent.toString().includes('if (seraLioraCutscene.active)')"), true, 'cutaway explicitly suppresses it');

    g.run('__fills=[]; ctx.fillRect=function(x,y,w,h){__fills.push({style:String(ctx.fillStyle),x:x,y:y,w:w,h:h});}; tick=0; render();');
    assert.match(g.run('ctx.font'), /Georgia/, 'white-field Sera line renders in the elegant serif');
    assert.equal(g.run("__fills.some(function(f){return f.style==='#08121e';})"), false, 'ordinary heavy dialogue box is absent over white');
    assert.equal(g.run("__fills.some(function(f){return f.style.indexOf('rgba(0,0,0')===0||f.style.indexOf('rgba(0, 0, 0')===0;})"), false, 'no black frame or vignette is drawn over the white opening');

    // The first close produces a short, locked, still-white natural beat.
    const whitePos = g.run('JSON.stringify([player.x,player.y])');
    g.press(' ');
    assert.equal(g.run('seraLioraCutscene.phase'), 'white_pause');
    assert.equal(g.run('dialogue.open'), false);
    g.press('m'); g.press('n'); g.press('`'); g.press('i');
    assert.equal(g.run('menu.open || debugMenu.open || warpMenu.open || debugInspector.open || choice.open'), false,
      'all player-mode overlays stay locked');
    g.hold('ArrowRight'); g.frames(17); g.release('ArrowRight');
    assert.equal(g.run('JSON.stringify([player.x,player.y])'), whitePos, 'held movement cannot move or skip the silent beat');
    assert.equal(g.run('dialogue.open'), false);
    g.frames(1);
    assert.equal(g.run('dialogue.pages[0][0]'), 'Liora, wake up.');
    assert.equal(g.run('seraLioraCutscene.beat'), 1);

    // The second line closes into a fully white overlay over the already-loaded
    // Bethany room, then gently uncovers it before Liora speaks.
    g.press(' ');
    assert.equal(g.run('activeMap === BETHANY_GUEST_ROOM_MAP'), true);
    assert.equal(g.run('seraLioraCutscene.phase'), 'room_reveal');
    assert.equal(g.run('seraLioraCutscene.revealAlpha'), 1);
    assert.equal(g.run('dialogue.open'), false);
    assert.equal(g.run('locationName()'), 'Bethany — Guest House');
    assert.equal(g.run("MAP_CATALOG.BETHANY_GUEST_ROOM_MAP.displayName"), 'Bethany — Guest House');
    assert.equal(g.run('BETHANY_GUEST_ROOM_MAP.length'), 15);
    assert.equal(g.run('BETHANY_GUEST_ROOM_MAP.every(function(row){return row.length===16;})'), true);
    assert.equal(g.run('MAP_CATALOG.BETHANY_GUEST_ROOM_MAP.allowSave'), false);
    assert.equal(g.run("getDebugWarpDestinations().some(function(d){return d.mapId==='BETHANY_GUEST_ROOM_MAP';})"), false,
      'room is not exposed through debug warp');
    g.run('__fills=[]; tick=0; render();');
    assert.equal(g.run("__fills.filter(function(f){return f.x===0&&f.y===0&&f.w===512&&f.h===480;}).slice(-1)[0].style"), 'rgba(255,255,255,1)',
      'the room-load frame remains fully white rather than flashing the room or black');

    g.frames(20);
    assert.ok(g.run('seraLioraCutscene.revealAlpha') > 0 && g.run('seraLioraCutscene.revealAlpha') < 1,
      'white opacity falls gradually');
    g.press(' '); g.press('m'); g.press('`');
    assert.equal(g.run('dialogue.open || menu.open || debugMenu.open'), false, 'silent reveal ignores advance and menu commands');
    g.frames(20);
    assert.equal(g.run('seraLioraCutscene.beat'), 2);
    assert.equal(g.run('dialogue.pages[0][0]'), 'I am awake.');
    assert.equal(g.run('dialogue.styleId'), null);
    g.run('tick=0; render();');
    assert.match(g.run('ctx.font'), /Courier New/, 'Liora renders with established typography');

    const appearance = JSON.parse(g.run('JSON.stringify(SERA_LIORA_CUTAWAY_APPEARANCE)'));
    assert.equal(appearance.Sera.hair, '#050509', 'Sera hair is jet black');
    assert.deepEqual(appearance.Liora.hair,
      ['#f04452', '#ff8a32', '#f6df3c', '#43c46b', '#30bddd', '#4274db', '#9a4fd0'],
      'Liora hair visibly owns the complete saturated spectrum');
    assert.equal(appearance.Liora.heightPx - appearance.Sera.heightPx, 1);
    assert.equal(g.run('seraLioraCutscene.lioraPose'), 'sleeping');
    assert.equal(g.run("SIMPLE_NPCS.some(function(n){return n.map==='bethany_guest_house_finest_room';})"), false);
    assert.equal(g.run('MAP_CATALOG.BETHANY_GUEST_ROOM_MAP.items.length'), 0);

    // Advance each remaining one-page authored beat exactly once and check the
    // pose changes happen only at their approved persuasion beats.
    for (let next = 3; next < EXPECTED.length; next++) {
      g.press(' ');
      assert.equal(g.run('seraLioraCutscene.beat'), next, 'advanced exactly once to beat ' + next);
      assert.equal(g.run('dialogue.pages[0][0]'), EXPECTED[next][1]);
      if (next < 7) assert.equal(g.run('seraLioraCutscene.lioraPose'), 'sleeping');
      if (next === 7) assert.equal(g.run('seraLioraCutscene.lioraPose'), 'settled');
      if (next === 8) assert.equal(g.run('seraLioraCutscene.lioraPose'), 'attentive');
      if (next === 10) assert.equal(g.run('seraLioraCutscene.lioraPose'), 'awake');
      if (next === 20) assert.equal(g.run('seraLioraCutscene.lioraPose'), 'sitting');
      assert.equal(g.run('choice.open || menu.open || combat.active'), false);
    }
    assert.equal(g.run('dialogue.pages[0][0]'), 'Agreed.');
    assert.equal(g.run('seraLioraCutscene.lioraPose'), 'sitting');
    assert.equal(g.run('activeMap === BETHANY_GUEST_ROOM_MAP'), true);

    g.press(' ');
    assert.equal(g.run('seraLioraCutscene.phase'), 'final_hold');
    g.frames(29);
    assert.equal(g.run('activeMap === BETHANY_GUEST_ROOM_MAP'), true, 'final image holds on Liora sitting up');
    g.frames(1);
    assert.equal(g.run('activeMap === DRENWICK_INFIRMARY_MAP'), true, 'extension point continues into existing hospital wake');
    assert.equal(g.run('dialogue.name'), 'Esla');
    assert.equal(g.run('seraLioraCutscene.active'), false);
    assert.equal(g.run('window.basin_chamber_dream_done'), false, 'debug preview does not complete story progression');
    assert.equal(g.run('_dreamReturn'), null);
    assert.equal(g.run('dialogue.styleId'), null, 'hospital dialogue returns to default styling');
    assert.equal(g.run('dialogue.presentation'), 'box');

    while (g.run('dialogue.open')) g.press(' ');
    const beforeMove = g.run('player.y');
    g.hold('ArrowDown'); g.frames(1); g.release('ArrowDown');
    assert.notEqual(g.run('player.y'), beforeMove, 'normal control returns at the hospital’s existing post-dialogue point');
    g.run('saveGame();');
    const saved = JSON.parse(g.run("localStorage.getItem('verdantVale_save')"));
    assert.equal(saved.version, 4);
    assert.equal(Object.keys(saved).some((key) => /sera|liora|bethany/i.test(key)), false,
      'no cutaway state enters the save schema');
  },
};
