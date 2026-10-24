'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const { completeCourtyard } = require('../sera-liora-courtyard-helpers');

const ROOT = path.join(__dirname, '..', '..');
const J = (g, source) => JSON.parse(g.run('JSON.stringify(' + source + ')'));

function installImmediateImages(g) {
  g.run(`
    window.Image=function(){this.onload=null;this.onerror=null;this.naturalWidth=0;this.naturalHeight=0;this._src='';};
    Object.defineProperty(window.Image.prototype,'src',{set:function(value){
      this._src=value;var id=Object.keys(IMAGE_ASSET_REGISTRY).find(function(key){return IMAGE_ASSET_REGISTRY[key].path===value;});
      this.naturalWidth=IMAGE_ASSET_REGISTRY[id].width;this.naturalHeight=IMAGE_ASSET_REGISTRY[id].height;this.onload();
    },get:function(){return this._src;}});
  `);
}

function enterFreeWalk(g) {
  g.run('debugPlaySeraLioraCutaway();');
  g.press(' '); g.frames(18); g.press(' '); g.frames(40);
  while (g.run('seraLioraCutscene.beat') < 21) g.press(' ');
  g.press(' ');
  assert.equal(g.run("seraLioraCutscene.phase==='free_walk'"), true);
}

function placeAtApproach(g, id, index = 0) {
  g.run(`
    (function(){
      var r=SERA_LIORA_GUEST_ROOM_INTERACTIONS.find(function(v){return v.id==='${id}';});
      var z=r.approaches[${index}];
      seraLioraGuestRoomWalk.x=z.x+z.width/2;
      seraLioraGuestRoomWalk.y=z.y+z.height/2;
      seraLioraGuestRoomWalk.facing=z.facing;
      seraLioraGuestRoomWalk.moving=false;
    })();
  `);
}

function closeDialogue(g) {
  while (g.run('dialogue.open')) g.press('Enter');
}

module.exports = {
  name: 'Sera/Liora playable bedroom: inspectables, desk route, unmade bed and calmer Sera gait',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    installImmediateImages(g);

    assert.equal(g.run('SAVE_VERSION'), 5);
    assert.equal(g.run("Object.prototype.hasOwnProperty.call(IMAGE_ASSET_REGISTRY,'cutaway_right_bed_unmade_depth_v2')"), true);
    assert.deepEqual(J(g, 'Object.keys(DIALOGUE_SPEAKER_DEFINITIONS).filter(function(id){return id===\'sera\'||id===\'liora\';})'), ['sera', 'liora']);
    assert.deepEqual(J(g, '[DIALOGUE_SPEAKER_DEFINITIONS.sera.dialogueStyleId,DIALOGUE_SPEAKER_DEFINITIONS.liora.dialogueStyleId]'),
      ['sera_elegant', null]);
    assert.equal(g.run("trySeraLioraGuestRoomInteraction()"), false, 'room interactions do not exist before room control');

    enterFreeWalk(g);
    const interactions = J(g, 'SERA_LIORA_GUEST_ROOM_INTERACTIONS');
    assert.deepEqual(interactions.map((entry) => entry.id), ['liora', 'flowers', 'window', 'writing_desk']);
    assert.equal(g.run('validateSeraLioraGuestRoomInteractions()'), true);
    assert.equal(g.run(`(function deep(v){return !v||typeof v!=='object'||Object.isFrozen(v)&&Object.values(v).every(deep);})(SERA_LIORA_GUEST_ROOM_INTERACTIONS)`), true);

    const expected = {
      liora: [
        ['Still attached to the mountain?'],
        ['For the moment. You may ask again after breakfast.'],
        ['I intend to.'],
      ],
      flowers: [[
        'A vase of starflowers catches the morning light.',
        'Every bloom is regally purple.',
      ]],
      window: [[
        'Below the window, Bethany’s bright roofs step down the mountain.',
        'Morning cloud drifts beneath the lower terraces.',
      ]],
      writing_desk: [[
        'Paper, ink, and a clean blotter are laid out in careful order.',
        'The top sheet is still blank.',
      ]],
    };
    const pristine = g.run(`JSON.stringify({stats:stats,statusEffects:statusEffects,day:day,inventory:stats.items,
      flags:QUEST_FLAG_SCHEMA.map(function(key){return [key,window[key]];}),player:player,party:persistentParty.serialize()})`);
    g.run("window.__roomRandom=Math.random;Math.random=function(){throw Error('room interaction RNG');};");
    for (const record of interactions) {
      placeAtApproach(g, record.id);
      assert.equal(g.run("seraLioraGuestRoomInteractionAt('" + record.id + "').id"), record.id);
      g.run("tick=16;window.__roomPrompt=[];ctx.fillText=function(text,x,y){__roomPrompt.push([text,x,y]);};drawSeraLioraCutawayActors();");
      assert.deepEqual(J(g, '__roomPrompt'), [['SPACE', record.prompt.x, record.prompt.y - 28]],
        record.id + ' uses the familiar SPACE interaction indicator');
      const facing = g.run('seraLioraGuestRoomWalk.facing');
      g.run("seraLioraGuestRoomWalk.facing='" + (facing === 'up' ? 'down' : 'up') + "'");
      assert.equal(g.run("seraLioraGuestRoomInteractionAt('" + record.id + "')"), null, record.id + ' requires facing');
      g.run("window.__roomPrompt=[];drawSeraLioraCutawayActors();");
      assert.deepEqual(J(g, '__roomPrompt'), [], record.id + ' prompt obeys the same facing authority');
      g.run("seraLioraGuestRoomWalk.facing='" + facing + "'");
      assert.equal(g.run('seraLioraFootprintWalkable(seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y)'), true,
        record.id + ' approach is legal floor');
      if (record.id === 'liora') {
        g.press('Enter');
        assert.equal(g.run('dialogue.open'), true, 'ordinary interaction input opens Liora dialogue');
      } else {
        assert.equal(g.run('trySeraLioraGuestRoomInteraction()'), true);
      }
      assert.deepEqual(J(g, 'dialogue.pages'), expected[record.id]);
      if (record.id === 'liora') {
        assert.deepEqual(J(g, 'dialogue.pageSpeakers'), ['sera', 'liora', 'sera']);
        assert.equal(g.run('dialoguePagePresentation().styleId'), 'sera_elegant');
        g.press('Enter');
        assert.deepEqual(J(g, 'dialoguePagePresentation()'), { name: 'Liora', styleId: null, speakerId: 'liora' });
      }
      closeDialogue(g);
      assert.equal(g.run(`JSON.stringify({stats:stats,statusEffects:statusEffects,day:day,inventory:stats.items,
        flags:QUEST_FLAG_SCHEMA.map(function(key){return [key,window[key]];}),player:player,party:persistentParty.serialize()})`), pristine,
        record.id + ' is repeatable and progression-neutral');
      assert.equal(g.run('trySeraLioraGuestRoomInteraction()'), true, record.id + ' repeats');
      closeDialogue(g);
      g.run(`seraLioraGuestRoomWalk.x=100;seraLioraGuestRoomWalk.y=400;
        seraLioraGuestRoomWalk.facing=SERA_LIORA_GUEST_ROOM_INTERACTIONS.find(function(v){return v.id==='${record.id}';}).approaches[0].facing;`);
      assert.equal(g.run("seraLioraGuestRoomInteractionAt('" + record.id + "')"), null,
        record.id + ' cannot activate at invalid distance');
    }
    g.run('Math.random=__roomRandom;');

    g.run("seraLioraGuestRoomWalk.x=420;seraLioraGuestRoomWalk.y=300;seraLioraGuestRoomWalk.facing='left';");
    assert.equal(g.run("seraLioraGuestRoomInteractionAt('liora')"), null, 'right bed blocks a through-bed Liora interaction');
    g.run("seraLioraGuestRoomWalk.x=256;seraLioraGuestRoomWalk.y=210;seraLioraGuestRoomWalk.facing='up';");
    assert.equal(g.run("seraLioraGuestRoomInteractionAt('flowers')"), null, 'table footprint is not a legal flower approach');

    placeAtApproach(g, 'writing_desk');
    g.run("seraLioraGuestRoomWalk.x=350;seraLioraGuestRoomWalk.y=345;seraLioraGuestRoomWalk.facing='up';");
    assert.equal(g.run("seraLioraGuestRoomInteractionAt('writing_desk')"), null, 'desk cannot be used from the near side of its bed');
    g.run('seraLioraGuestRoomWalk.inputLocked=true;');
    placeAtApproach(g, 'flowers');
    assert.equal(g.run('trySeraLioraGuestRoomInteraction()'), false, 'input ownership blocks interactions');
    g.run('seraLioraGuestRoomWalk.inputLocked=false;dialogue.open=true;');
    assert.equal(g.run('trySeraLioraGuestRoomInteraction()'), false, 'active dialogue blocks a second interaction');
    g.run('dialogue.open=false;');

    const route = J(g, `(function(){
      var start=[350,345],step=2,queue=[start],head=0,seen=new Set([start.join(',')]),parents=new Map();
      function target(x,y){var z=SERA_LIORA_GUEST_ROOM_INTERACTIONS.find(function(r){return r.id==='writing_desk';}).approaches[0];return seraLioraRectContainsPoint(z,x,y);}
      while(head<queue.length){
        var p=queue[head++],x=p[0],y=p[1];
        if(target(x,y)){
          var key=x+','+y,path=[[x,y]];
          while(parents.has(key)){key=parents.get(key);path.push(key.split(',').map(Number));}
          path.reverse();return {reachable:true,path:path,visited:seen.size};
        }
        [[step,0],[-step,0],[0,step],[0,-step]].forEach(function(d){
          var nx=x+d[0],ny=y+d[1],key=nx+','+ny;
          if(!seen.has(key)&&seraLioraFootprintWalkable(nx,ny)){seen.add(key);parents.set(key,x+','+y);queue.push([nx,ny]);}
        });
      }
      return {reachable:false,path:[],visited:seen.size};
    })()`);
    assert.equal(route.reachable, true, 'writing desk has a continuous legal route');
    const bedDepth = g.run('SERA_LIORA_SCENE_METRICS.beds[1].depth');
    assert.ok(route.path.some((point) => point[1] < bedDepth), 'route enters the bed-behind depth region');
    for (const [x, y] of route.path) assert.equal(g.run(`seraLioraFootprintWalkable(${x},${y})`), true);

    g.run(`window.__draw=[];ctx.drawImage=function(im,...args){__draw.push([im._src,...args]);};
      seraLioraGuestRoomWalk.x=455;seraLioraGuestRoomWalk.y=211;seraLioraGuestRoomWalk.facing='up';drawSeraLioraCutawayActors();`);
    let draws = J(g, '__draw');
    const actorPath = 'assets/sprites/cutaways/sera-liora/depth-v2/sera-walk.png';
    const bedPath = 'assets/sprites/cutaways/sera-liora/depth-v2/right-bed.png';
    const unmadePath = 'assets/sprites/cutaways/sera-liora/depth-v2/right-bed-unmade.png';
    assert.ok(draws.findIndex((draw) => draw[0] === actorPath) < draws.findIndex((draw) => draw[0] === bedPath),
      'Sera is occluded behind Liora’s bed on the rear desk route');
    assert.equal(draws.filter((draw) => draw[0] === unmadePath).length, 1, 'standing Liora selects one unmade-bed overlay');
    g.run("__draw=[];seraLioraGuestRoomWalk.x=370;seraLioraGuestRoomWalk.y=380;drawSeraLioraCutawayActors();");
    draws = J(g, '__draw');
    assert.ok(draws.findIndex((draw) => draw[0] === actorPath) > draws.findIndex((draw) => draw[0] === bedPath),
      'Sera returns in front of the bed on the near floor');
    placeAtApproach(g, 'liora');
    g.run('__draw=[];trySeraLioraGuestRoomInteraction();drawSeraLioraCutawayActors();');
    assert.equal(J(g, '__draw').filter((draw) => draw[0] === unmadePath).length, 1, 'dialogue never remakes Liora’s bed');
    closeDialogue(g);

    assert.equal(g.run('SERA_LIORA_SCENE_METRICS.frameSeconds'), 0.20);
    assert.ok(Math.abs((1 / 0.14 - 1 / 0.20) / (1 / 0.14) - 0.30) < 0.0001, 'frame rate is reduced exactly 30%');
    g.run("seraLioraGuestRoomWalk.x=170;seraLioraGuestRoomWalk.y=380;seraLioraGuestRoomWalk.facing='right';seraLioraGuestRoomWalk.animationTime=0;keys.d=true;");
    const x0 = g.run('seraLioraGuestRoomWalk.x');
    const seenFrames = new Set();
    for (let i = 0; i < 60; i++) {
      g.run('updateSeraLioraGuestRoomFreeWalk(1/60)');
      seenFrames.add(g.run('seraLioraGuestRoomWalk.animationFrame'));
    }
    assert.ok(Math.abs(g.run('seraLioraGuestRoomWalk.x') - x0 - 90) < 0.001, 'movement remains 90 px/s');
    assert.equal(seenFrames.size, 3, 'all real gait frames still cycle');
    assert.equal(g.run('SERA_LIORA_SCENE_METRICS.approach.frames'), 40, 'cutscene waypoint duration is unchanged');
    const entitySource = fs.readFileSync(path.join(ROOT, 'render-entities.js'), 'utf8');
    assert.match(entitySource, /player\.step >> 3/, 'ordinary player cadence remains unchanged');
    assert.match(entitySource, /rt\.step >> 3/, 'generic routed-NPC cadence remains unchanged');
    assert.match(entitySource, /frame = \(step >> 3\)/, 'worker-NPC cadence remains unchanged');
    g.run('keys.d=false;dialogue.open=true;updateSeraLioraGuestRoomFreeWalk(1/60);');
    assert.deepEqual(J(g, '[seraLioraGuestRoomWalk.moving,seraLioraGuestRoomWalk.animationFrame]'), [false, 1]);
    g.run('dialogue.open=false;');

    // The transient room has no save restoration contract. A fresh replay
    // derives the unmade bed from the authoritative post-wake standing phase.
    assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'save.js'), 'utf8'), /seraLioraGuestRoomWalk|SERA_LIORA_GUEST_ROOM_INTERACTIONS/);
    g.run("seraLioraGuestRoomWalk.x=70;seraLioraGuestRoomWalk.y=205;seraLioraGuestRoomWalk.facing='left';");
    assert.equal(g.run('seraLioraDoorInteractionAvailable()'), true);
    g.run("tick=16;window.__roomPrompt=[];drawSeraLioraCutawayActors();");
    assert.deepEqual(J(g, '__roomPrompt'), [['SPACE', 43, 130]],
      'the exit door uses the same familiar SPACE interaction indicator');
    assert.equal(g.run('trySeraLioraGuestRoomDoor()'), true, 'bedroom door enters the courtyard');
    completeCourtyard(g);
    assert.equal(g.run('activeMap === DRENWICK_INFIRMARY_MAP'), true);
    assert.equal(g.run('SAVE_VERSION'), 5);
  },
};
