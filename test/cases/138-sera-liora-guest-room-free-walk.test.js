'use strict';

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');

const ROOT = path.join(__dirname, '..', '..');
const WALK_PATH = 'assets/sprites/cutaways/sera-liora/close/sera-walk-cycle-3x3-v1.png';
const WALK_SOURCE = 'Art/generated/sera-liora/sera-walk-cycle-3x3-v1-imagegen-source.png';
const LIORA_PATH = 'Art/generated/sera-liora/liora-standing-actor-master-v1.png';
const sha256 = (relativePath) => crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, relativePath))).digest('hex');

function installImmediateImages(g) {
  g.run(`
    window.Image=function(){this.onload=null;this.onerror=null;this.naturalWidth=0;this.naturalHeight=0;this._src='';};
    Object.defineProperty(window.Image.prototype,'src',{set:function(value){this._src=value;var id=Object.keys(IMAGE_ASSET_REGISTRY).find(function(key){return IMAGE_ASSET_REGISTRY[key].path===value;});this.naturalWidth=IMAGE_ASSET_REGISTRY[id].width;this.naturalHeight=IMAGE_ASSET_REGISTRY[id].height;this.onload();},get:function(){return this._src;}});
  `);
}

function enterFreeWalk(g) {
  g.run('debugPlaySeraLioraCutaway();');
  g.press(' '); g.frames(18); g.press(' '); g.frames(40);
  while (g.run('seraLioraCutscene.beat') < 21) g.press(' ');
  assert.equal(g.run('seraLioraCutscene.lioraPose'), 'sitting');
  g.run("keys.d=true;keys.D=true;");
  g.press(' ');
  assert.equal(g.run("seraLioraCutscene.phase"), 'free_walk');
}

module.exports = {
  name: 'Sera/Liora Guest Room free-walk: transient actor, walk cycle, collision, door completion, Lely isolation',
  run() {
    assert.equal(sha256(WALK_SOURCE), 'aa82a9764c7be53a02505792d5234ad388dbca82df3ace03d461ea353796bc2c');
    assert.equal(sha256(WALK_PATH), 'acc229af2a099dece0bb616f84dba2e59a6bcb5b20a03a48c81dd4d1fe33e51e');
    assert.equal(sha256(LIORA_PATH), '30314196315427343241d7202791529e184338a029d6132fb484656ccd67d9a5');

    const g = createContext();
    g.press('Enter'); g.press('Enter');
    installImmediateImages(g);
    g.run(`
      stats.hp=17;stats.maxHp=44;stats.atk=13;stats.def=9;stats.spd=11;
      stats.xp=77;stats.level=3;stats.gold=4321;
      statusEffects=['poison'];day=12;window.basin_chamber_dream_done=false;
      menu.notebookOffset=3;menu.notebookCursor=4;
      window.__lelyBefore=JSON.stringify({stats:stats,statusEffects:statusEffects,day:day,
        questFlags:QUEST_FLAG_SCHEMA.reduce(function(out,key){out[key]=window[key];return out;},{}),
        notebook:{offset:menu.notebookOffset,cursor:menu.notebookCursor},
        encounter:{active:combat.active,enemy:combat.enemy,phase:combat.phase},
        fishingActive:fishing.active,saveVersion:SAVE_VERSION});
    `);
    enterFreeWalk(g);

    assert.equal(g.run('dialogue.open'), false, 'walking begins only after the final page closes');
    assert.equal(g.run('seraLioraGuestRoomWalk.active && !seraLioraGuestRoomWalk.inputLocked'), true);
    assert.equal(g.run('seraLioraCutscene.lioraPose'), 'standing');
    assert.deepEqual(JSON.parse(g.run('JSON.stringify([seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y,seraLioraGuestRoomWalk.facing])')),
      [350, 345, 'down']);
    assert.deepEqual(JSON.parse(g.run('JSON.stringify([seraLioraGuestRoomWalk.lioraX,seraLioraGuestRoomWalk.lioraY])')),
      [270, 345]);
    assert.equal(g.run('keys.d || keys.D'), false, 'held input from the closing page is cleared atomically');
    assert.equal(g.run('JSON.stringify([player.x,player.y,player.facing])'), JSON.stringify([240, 240, 'up']),
      'the cutaway map projection is never reused as Sera control state');

    const config = JSON.parse(g.run('JSON.stringify(SERA_LIORA_GUEST_ROOM_MOVEMENT)'));
    assert.equal(config.speedPxPerSecond, 90);
    assert.equal(config.animationFrameSeconds, 0.14);
    assert.deepEqual(config.doorZone, { x: 55, y: 194, width: 32, height: 22, facing: 'left' });
    assert.equal(config.walkableAreas.length, 3);
    assert.deepEqual(config.obstacles.map((o) => o.id),
      ['breakfast_table', 'left_bed', 'right_bed', 'left_luggage', 'right_luggage']);
    assert.equal(g.run('seraLioraFootprintWalkable(350,345)'), true, 'Sera spawn is valid');
    assert.equal(g.run('seraLioraFootprintWalkable(270,345)'), false, 'standing Liora is solid');
    const doorPath = JSON.parse(g.run(`(function(){
      var step=2,startX=350,startY=345,queue=[[startX,startY]],head=0;
      var seen=new Set([startX+','+startY]);
      while(head<queue.length){
        var point=queue[head++],x=point[0],y=point[1];
        if(seraLioraRectContainsPoint(SERA_LIORA_GUEST_ROOM_MOVEMENT.doorZone,x,y)){
          return JSON.stringify({reachable:true,x:x,y:y,visited:seen.size});
        }
        [[step,0],[-step,0],[0,step],[0,-step]].forEach(function(delta){
          var nx=x+delta[0],ny=y+delta[1],key=nx+','+ny;
          if(!seen.has(key)&&seraLioraFootprintWalkable(nx,ny)){
            seen.add(key);queue.push([nx,ny]);
          }
        });
      }
      return JSON.stringify({reachable:false,visited:seen.size});
    })()`));
    assert.equal(doorPath.reachable, true,
      'an exhaustive footprint search finds a continuous collision-valid route to the visible door threshold');
    assert.ok(doorPath.x <= 87 && doorPath.y <= 216,
      'the reachable interaction point overlaps the visible door threshold, not the bedside floor');

    const x0 = g.run('seraLioraGuestRoomWalk.x');
    g.hold('d'); g.frames(1); g.release('d'); g.frames(1);
    assert.ok(g.run('seraLioraGuestRoomWalk.x') > x0, 'D moves only Sera to the right');
    assert.equal(g.run('seraLioraGuestRoomWalk.facing'), 'right');
    assert.equal(g.run('seraLioraGuestRoomWalk.animationFrame'), 1, 'release returns to neutral frame');
    assert.deepEqual(JSON.parse(g.run('JSON.stringify([seraLioraGuestRoomWalk.lioraX,seraLioraGuestRoomWalk.lioraY])')),
      [270, 345], 'Liora never moves');

    g.run('seraLioraGuestRoomWalk.x=350;seraLioraGuestRoomWalk.y=380;seraLioraGuestRoomWalk.animationTime=0;keys.d=true;keys.s=true;');
    g.run('updateSeraLioraGuestRoomFreeWalk(1/60);');
    const diagonalDistance = g.run('Math.hypot(seraLioraGuestRoomWalk.x-350,seraLioraGuestRoomWalk.y-380)');
    assert.ok(Math.abs(diagonalDistance - 1.5) < 0.0001, 'diagonal motion is normalized to cardinal speed');
    g.run('keys.d=false;keys.s=false;');

    g.run('seraLioraGuestRoomWalk.x=350;seraLioraGuestRoomWalk.y=380;keys.d=true;');
    for (let i = 0; i < 60; i++) g.run('updateSeraLioraGuestRoomFreeWalk(1/60);');
    const sixtyFpsDistance = g.run('seraLioraGuestRoomWalk.x-350');
    g.run('seraLioraGuestRoomWalk.x=350;seraLioraGuestRoomWalk.y=380;seraLioraGuestRoomWalk.animationTime=0;');
    for (let i = 0; i < 30; i++) g.run('updateSeraLioraGuestRoomFreeWalk(1/30);');
    const thirtyFpsDistance = g.run('seraLioraGuestRoomWalk.x-350');
    assert.ok(Math.abs(sixtyFpsDistance - thirtyFpsDistance) < 0.0001, 'distance is stable at 30 and 60 simulated fps');
    g.run('keys.d=false;updateSeraLioraGuestRoomFreeWalk(1/60);');
    assert.equal(g.run('seraLioraGuestRoomWalk.moving'), false);
    assert.equal(g.run('seraLioraGuestRoomWalk.animationFrame'), 1);

    g.run(`
      window.__draws=[];window.__scales=[];
      ctx.drawImage=function(){__draws.push(Array.from(arguments).map(function(v){return v&&v._src?v._src:v;}));};
      ctx.scale=function(x,y){__scales.push([x,y]);};
      seraLioraGuestRoomWalk.x=350;seraLioraGuestRoomWalk.y=345;
      seraLioraGuestRoomWalk.facing='up';seraLioraGuestRoomWalk.moving=true;seraLioraGuestRoomWalk.animationFrame=2;render();
    `);
    let draws = JSON.parse(g.run('JSON.stringify(__draws)'));
    let walkDraw = draws.find((args) => args[0] === WALK_PATH);
    assert.deepEqual(walkDraw.slice(1, 5), [224, 168, 112, 168], 'up movement selects row 2 and actual step frame 3');
    assert.equal(draws.filter((args) => args[0] === LIORA_PATH).length, 1, 'approved standing Liora draws once');
    assert.equal(draws.some((args) => /under-covers-v1-patch/.test(args[0])), false, 'standing atomically replaces the sitting patch');
    assert.equal(draws.some((args) => /sera-standing-fit-v2/.test(args[0])), false, 'free walk does not duplicate standing Sera');
    g.run("__draws=[];__scales=[];seraLioraGuestRoomWalk.facing='left';render();");
    draws = JSON.parse(g.run('JSON.stringify(__draws)'));
    walkDraw = draws.find((args) => args[0] === WALK_PATH);
    assert.equal(walkDraw[2], 336, 'left uses the right-facing source row');
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(__scales)')), [[-1, 1]], 'left is mechanically mirrored, never rotated');

    g.run('seraLioraGuestRoomWalk.x=371;seraLioraGuestRoomWalk.y=260;keys.d=true;keys.w=true;');
    const slideBefore = JSON.parse(g.run('JSON.stringify([seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y])'));
    g.run('updateSeraLioraGuestRoomFreeWalk(1/60);');
    const slideAfter = JSON.parse(g.run('JSON.stringify([seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y])'));
    assert.equal(slideAfter[0], slideBefore[0], 'right-bed collision blocks the occupied axis');
    assert.ok(slideAfter[1] < slideBefore[1], 'collision still slides along the open axis');
    g.run('keys.d=false;keys.w=false;seraLioraGuestRoomWalk.x=300;seraLioraGuestRoomWalk.y=345;keys.a=true;updateSeraLioraGuestRoomFreeWalk(1/60);');
    assert.equal(g.run('seraLioraGuestRoomWalk.x'), 300, 'Sera cannot enter Liora collider');
    g.run('keys.a=false;seraLioraGuestRoomWalk.x=350;seraLioraGuestRoomWalk.y=240;keys.w=true;updateSeraLioraGuestRoomFreeWalk(1/60);');
    assert.equal(g.run('seraLioraGuestRoomWalk.y'), 240, 'breakfast table blocks movement');
    g.run('keys.w=false;seraLioraGuestRoomWalk.x=350;seraLioraGuestRoomWalk.y=345;keys.d=true;');
    for (let i = 0; i < 200; i++) g.run('updateSeraLioraGuestRoomFreeWalk(1/60);');
    assert.ok(g.run('seraLioraGuestRoomWalk.x') <= 371, 'outer/right-bed boundary contains Sera');
    g.run('keys.d=false;');

    g.press('m'); g.press('Escape'); g.press('`'); g.press('i');
    assert.equal(g.run('menu.open || debugMenu.open || debugInspector.open || warpMenu.open'), false,
      'ordinary menus and debug overlays remain unavailable');
    assert.equal(g.run('trySeraLioraGuestRoomDoor()'), false, 'door interaction outside its zone does nothing');

    // Reach the visible door threshold using only the local movement function:
    // down around fixed Liora, left across the lower floor, then north through
    // the narrow aisle along the right side of the left bed.
    g.run('seraLioraGuestRoomWalk.x=350;seraLioraGuestRoomWalk.y=345;');
    g.hold('s'); g.frames(30); g.release('s');
    g.hold('a'); g.frames(130); g.release('a');
    g.hold('w'); g.frames(120); g.release('w');
    g.hold('a'); g.frames(60); g.release('a');
    g.press('a');
    assert.equal(g.run('seraLioraDoorInteractionAvailable()'), true, 'door approach is reachable and facing-gated');
    g.press('Enter');
    assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'), 1);
    assert.equal(g.run('seraLioraGuestRoomWalk.active'), false);
    assert.equal(g.run('seraLioraCutscene.active'), false);
    assert.equal(g.run('activeMap === DRENWICK_INFIRMARY_MAP'), true);
    assert.equal(g.run('dialogue.name'), 'Esla');
    assert.equal(g.run('trySeraLioraGuestRoomDoor()'), false);
    assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'), 1, 'completion is idempotent while interaction is held');
    assert.equal(g.run('JSON.stringify({stats:stats,statusEffects:statusEffects,day:day,questFlags:QUEST_FLAG_SCHEMA.reduce(function(out,key){out[key]=window[key];return out;},{}),notebook:{offset:menu.notebookOffset,cursor:menu.notebookCursor},encounter:{active:combat.active,enemy:combat.enemy,phase:combat.phase},fishingActive:fishing.active,saveVersion:SAVE_VERSION})'),
      g.run('__lelyBefore'), 'free walk does not mutate Lely gameplay state');
    assert.deepEqual(JSON.parse(g.run('JSON.stringify([player.x,player.y,player.facing])')), [240, 272, 'up'],
      'existing hospital completion authority owns Lely placement');

    const saveText = fs.readFileSync(path.join(ROOT, 'save.js'), 'utf8');
    assert.doesNotMatch(saveText, /seraLioraGuestRoomWalk|free_walk|walk_cycle/, 'transient walk state has no save binding');
    assert.equal(g.run('SAVE_VERSION'), 4);
  },
};
