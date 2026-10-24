'use strict';

// Part 2 is a transient stage of the existing Bethany scene, not a new world
// location or party. All coordinates are the same 512x480 foot space as Part 1.
const SERA_LIORA_COURTYARD = Object.freeze({
  spawn: Object.freeze({ x: 166, y: 254 }),
  walkableAreas: Object.freeze([
    Object.freeze({ x: 140, y: 240, width: 54, height: 54 }),
    Object.freeze({ x: 60, y: 260, width: 410, height: 152 }),
  ]),
  // Covers both ways toward the screen edge; no angle/facing can bypass it.
  // Stops before the established dialogue box would hide either actor's feet.
  trigger: Object.freeze({ east: 300, south: 326 }),
  separation: 86,
  foreground: Object.freeze([
    Object.freeze([[0,327],[20,325],[42,340],[61,360],[78,385],[94,407],[145,433],[120,480],[0,480]].map(Object.freeze)),
    Object.freeze([[512,328],[491,338],[473,359],[459,386],[428,414],[383,441],[389,480],[512,480]].map(Object.freeze)),
  ]),
  pages: Object.freeze([
    Object.freeze({ speakerId: 'sera', lines: Object.freeze(['There you are. Breakfast on the terrace. I asked them to keep the sunny table.']) }),
    Object.freeze({ speakerId: 'liora', lines: Object.freeze(['I wanted to see the garden before you booked the rest of the mountain.']) }),
    Object.freeze({ speakerId: 'sera', lines: Object.freeze(['After breakfast. Then we wander Bethany. You choose the streets; I choose the pastries.']) }),
    Object.freeze({ speakerId: 'liora', lines: Object.freeze(['I choose how long we stop, too.']) }),
    Object.freeze({ speakerId: 'sera', lines: Object.freeze(['Naturally. Within reason. It’s our last full day, and I want a good view of Skybloom tonight.']) }),
    Object.freeze({ speakerId: 'liora', lines: Object.freeze(['Then let’s eat. I’d like to see it before you arrange a private showing.']) }),
    Object.freeze({ speakerId: 'sera', lines: Object.freeze(['I was only going to ask about a better view.']) }),
  ]),
});
const seraLioraCourtyard = { epoch: 0, triggered: false, lioraVisible: false,
  lioraX: 166, lioraY: 254, lioraFacing: 'down', moving: false,
  animationTime: 0, animationFrame: 1, route: [], routeIndex: 0 };

function resetSeraLioraCourtyard() {
  seraLioraCourtyard.epoch++;
  Object.assign(seraLioraCourtyard, { triggered: false, lioraVisible: false,
    lioraX: SERA_LIORA_COURTYARD.spawn.x, lioraY: SERA_LIORA_COURTYARD.spawn.y,
    lioraFacing: 'down', moving: false, animationTime: 0, animationFrame: 1,
    route: [], routeIndex: 0 });
}
function isSeraLioraCourtyard() {
  return seraLioraCutscene.active && activeMap === BETHANY_GUEST_ROOM_MAP &&
    seraLioraCutscene.phase.startsWith('courtyard_');
}
function seraLioraCourtyardAssetsReady() {
  return ['cutaway_bethany_courtyard_v1', 'cutaway_liora_walk_courtyard_v1',
    'cutaway_sera_walk_depth_v2'].every(id => !!loadedImageAsset(id));
}
function seraLioraCourtyardFloorWalkable(x, y) {
  const r = SERA_LIORA_GUEST_ROOM_MOVEMENT.collisionRadius;
  return [[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]].every(p =>
    SERA_LIORA_COURTYARD.walkableAreas.some(area => seraLioraRectContainsPoint(area, ...p)));
}
function seraLioraCourtyardFootprintWalkable(x, y) {
  const c = seraLioraCourtyard;
  return seraLioraCourtyardFloorWalkable(x,y) &&
    (!c.lioraVisible || Math.abs(x-c.lioraX) >= 29 || Math.abs(y-c.lioraY) >= 21);
}
function stopSeraLioraSceneActor() {
  Object.assign(seraLioraGuestRoomWalk, { moving: false, animationTime: 0, animationFrame: 1 });
}
function clearSeraLioraMovementKeys() {
  for (const k of ['w','a','s','d','W','A','S','D','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']) keys[k] = false;
}
function enterSeraLioraCourtyard() {
  if (!seraLioraGuestRoomControlAvailable()) return false;
  seraLioraGuestRoomWalk.inputLocked = true;
  stopSeraLioraSceneActor();
  seraLioraCutscene.phase = 'courtyard_asset_wait';
  const epoch = seraLioraCourtyard.epoch;
  function arrive() {
    if (!isSeraLioraCourtyard() || seraLioraCutscene.phase !== 'courtyard_asset_wait' ||
        epoch !== seraLioraCourtyard.epoch) return;
    if (!seraLioraCourtyardAssetsReady()) { endSeraLioraCutawayAtHospital(); return; }
    Object.assign(seraLioraGuestRoomWalk, SERA_LIORA_COURTYARD.spawn,
      { active: true, inputLocked: false, facing: 'down' });
    clearSeraLioraMovementKeys();
    seraLioraCutscene.phase = 'courtyard_free';
  }
  if (seraLioraCourtyardAssetsReady()) arrive();
  else preloadImageAssetBundle('sera_liora_courtyard').then(arrive);
  return true;
}
function seraLioraCourtyardRouteValid(route) {
  const w = seraLioraGuestRoomWalk, spawn = SERA_LIORA_COURTYARD.spawn;
  let from = spawn;
  for (const to of route) {
    if (![to.x,to.y].every(Number.isFinite)) return false;
    const distance = Math.hypot(to.x-from.x,to.y-from.y);
    // Sample more finely than a runtime step, including both endpoints.
    for (let i=0,n=Math.max(1,Math.ceil(distance));i<=n;i++) {
      const x=from.x+(to.x-from.x)*i/n,y=from.y+(to.y-from.y)*i/n;
      if (!seraLioraCourtyardFloorWalkable(x,y) ||
          Math.abs(x-w.x)<29 && Math.abs(y-w.y)<21) return false;
    }
    from=to;
  }
  return route.length > 0;
}
function triggerSeraLioraCourtyard() {
  const c = seraLioraCourtyard, w = seraLioraGuestRoomWalk;
  if (!isSeraLioraCourtyard() || seraLioraCutscene.phase !== 'courtyard_free' ||
      c.triggered || dialogue.open || !seraLioraCourtyardFootprintWalkable(w.x,w.y) ||
      w.x < SERA_LIORA_COURTYARD.trigger.east && w.y < SERA_LIORA_COURTYARD.trigger.south) return false;
  const endX=w.x+(w.x<246?1:-1)*SERA_LIORA_COURTYARD.separation;
  const route=[{x:SERA_LIORA_COURTYARD.spawn.x,y:280},{x:endX,y:280},{x:endX,y:w.y}];
  if (!seraLioraCourtyardRouteValid(route)) return false;
  c.triggered=true;c.lioraVisible=true;c.route=route;c.routeIndex=0;
  w.inputLocked=true;stopSeraLioraSceneActor();clearSeraLioraMovementKeys();
  const dx=c.lioraX-w.x,dy=c.lioraY-w.y;
  w.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
  seraLioraCutscene.phase='courtyard_call';
  const epoch=c.epoch;
  openDialogue('', [[]], [function() {
    if (isSeraLioraCourtyard() && c.epoch===epoch && seraLioraCutscene.phase==='courtyard_call')
      seraLioraCutscene.phase='courtyard_approach';
  }]);
  setSpeakerDialoguePages([{speakerId:'liora',lines:['Sera! Wait!']}]);
  return true;
}
function openSeraLioraCourtyardConversation() {
  const c=seraLioraCourtyard,w=seraLioraGuestRoomWalk;
  c.moving=false;c.animationFrame=1;
  w.facing=c.lioraX<w.x?'left':'right';c.lioraFacing=c.lioraX<w.x?'right':'left';
  seraLioraCutscene.phase='courtyard_dialogue';
  const epoch=c.epoch;
  openDialogue('', [[]], null);
  setSpeakerDialoguePages(SERA_LIORA_COURTYARD.pages);
  dialogue.callbacks=[function(){
    if (!isSeraLioraCourtyard() || c.epoch!==epoch || seraLioraCutscene.phase!=='courtyard_dialogue') return;
    beginSeraLioraBreakfastDeparture();
  }];
}
function updateSeraLioraCourtyard(deltaSeconds) {
  if (!isSeraLioraCourtyard()) return;
  player.moving=false;
  const c=seraLioraCourtyard;
  if (seraLioraCutscene.phase==='courtyard_free') {
    updateSeraLioraGuestRoomFreeWalk(deltaSeconds);
    triggerSeraLioraCourtyard();return;
  }
  stopSeraLioraSceneActor();
  if (dialogue.open || seraLioraCutscene.phase!=='courtyard_approach') { c.moving=false;return; }
  const to=c.route[c.routeIndex];
  if (!to) { openSeraLioraCourtyardConversation();return; }
  const dt=Number.isFinite(deltaSeconds)?Math.max(0,Math.min(deltaSeconds,0.05)):MS_PER_FRAME/1000;
  const dx=to.x-c.lioraX,dy=to.y-c.lioraY,distance=Math.hypot(dx,dy);
  const step=Math.min(distance,SERA_LIORA_GUEST_ROOM_MOVEMENT.speedPxPerSecond*dt);
  if (distance>0) {
    const x=c.lioraX+dx/distance*step,y=c.lioraY+dy/distance*step,w=seraLioraGuestRoomWalk;
    if (!seraLioraCourtyardFloorWalkable(x,y) || Math.abs(x-w.x)<29 && Math.abs(y-w.y)<21) return;
    c.lioraX=x;c.lioraY=y;c.moving=true;
    c.lioraFacing=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    c.animationTime+=dt;
    const m=SERA_LIORA_SCENE_METRICS;c.animationFrame=m.cycle[Math.floor(c.animationTime/m.frameSeconds)%m.cycle.length];
  }
  if (step===distance) {
    c.routeIndex++;
    if (c.routeIndex===c.route.length) openSeraLioraCourtyardConversation();
  }
}
function drawSeraLioraCourtyard() {
  const background=loadedImageAsset('cutaway_bethany_courtyard_v1');
  if (!background) return; // asset-wait keeps the existing room visible instead
  ctx.drawImage(background,0,0);
}
function drawSeraLioraCourtyardActors() {
  const c=seraLioraCourtyard,w=seraLioraGuestRoomWalk;
  if (seraLioraCutscene.phase==='courtyard_asset_wait') return;
  const entries=[{id:'sera',layer:'world',depth:w.y,draw:()=>drawSeraLioraSceneSera(seraLioraSceneSeraView())}];
  if(c.lioraVisible) entries.push({id:'liora',layer:'world',depth:c.lioraY,draw:()=>
    drawSeraLioraCourtyardLiora({x:c.lioraX,y:c.lioraY,facing:c.lioraFacing,
      frame:c.moving&&!dialogue.open?c.animationFrame:1})});
  entries.push({id:'courtyard-planting',layer:'foreground',depth:430,draw:()=>{
    ctx.save();ctx.beginPath();
    for(const polygon of SERA_LIORA_COURTYARD.foreground){
      ctx.moveTo(...polygon[0]);for(const p of polygon.slice(1))ctx.lineTo(...p);ctx.closePath();
    }
    ctx.clip();ctx.drawImage(loadedImageAsset('cutaway_bethany_courtyard_v1'),0,0);ctx.restore();
  }});
  drawLayeredScene(entries);
}

// Measured alpha bounds of each generated cell. Fit every pose to the existing
// 148px Liora metric and a shared ground anchor, rather than allowing generated
// cell padding to change apparent scale or make a step float.
const SERA_LIORA_COURTYARD_LIORA_BOUNDS = Object.freeze([
  [26,30,109,190],[22,30,105,186],[21,30,104,190],
  [24,26,111,184],[22,26,106,184],[21,26,108,184],
  [14,25,106,180],[22,25,103,181],[17,25,110,180],
].map(Object.freeze));
function drawSeraLioraCourtyardLiora(view) {
  const image=loadedImageAsset('cutaway_liora_walk_courtyard_v1');
  if(!image)return;
  const row=({down:0,up:1,right:2,left:2})[view.facing];
  const b=SERA_LIORA_COURTYARD_LIORA_BOUNDS[row*3+view.frame],height=SERA_LIORA_SCENE_METRICS.Liora.height;
  const width=(b[2]-b[0])*height/(b[3]-b[1]);
  ctx.save();ctx.translate(Math.round(view.x),Math.round(view.y));
  if(view.facing==='left')ctx.scale(-1,1);
  ctx.drawImage(image,view.frame*128+b[0],row*192+b[1],b[2]-b[0],b[3]-b[1],
    -width/2,-height,width,height);
  ctx.restore();
}
