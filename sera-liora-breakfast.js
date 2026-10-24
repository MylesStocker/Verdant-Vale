'use strict';

// A bounded continuation of the existing scene. These actors/routes are not
// party members, NPC schedules, encounter definitions or persistent state.
const SERA_LIORA_BREAKFAST = Object.freeze({
  walkableAreas: Object.freeze([
    {x:20,y:260,width:270,height:100}, {x:236,y:216,width:54,height:88},
    {x:20,y:319,width:484,height:61}, {x:314,y:245,width:63,height:115},
    {x:324,y:194,width:180,height:105},
  ].map(Object.freeze)),
  gate: Object.freeze({x:313,y:297,width:65,height:14}),
  gatePatch: Object.freeze({x:314,y:245,width:62,height:66}),
  keeper: Object.freeze({x:257,y:235}),
  beetles: Object.freeze([
    Object.freeze({id:'bethany_buzzy_1',x:386,y:189,offset:0}),
    Object.freeze({id:'bethany_buzzy_2',x:481,y:191,offset:2}),
  ]),
  problemPages: Object.freeze([
    {speakerId:'bethany_keeper',lines:['The back gate was left open! Two Buzzy Beetles got into the kitchen yard and stores.']},
    {speakerId:'bethany_keeper',lines:['We shut the inner gate. No breakfast until we’ve cleared them out.']},
    {speakerId:'sera',lines:['An excellent argument for helping. Open it for us, please.']},
    {speakerId:'liora',lines:['We’ll take care of them. Stay by the kitchen. I’ll take the one by the delivery gate.']},
    {speakerId:'sera',lines:['Then the other one is mine. I refuse to spend a sunny morning negotiating with beetles.']},
    {speakerId:'bethany_keeper',lines:['Thank you. Stand back while I get the latch.']},
  ].map(p=>Object.freeze({speakerId:p.speakerId,lines:Object.freeze(p.lines)}))),
  finalPages: Object.freeze([
    Object.freeze({speakerId:'liora',lines:Object.freeze(['Ready?'])}),
    Object.freeze({speakerId:'sera',lines:Object.freeze(['Very. Let’s rescue breakfast.'])}),
  ]),
  fadeSeconds: 0.65,
});
const seraLioraBreakfast = {epoch:0,visible:false,triggered:false,gateOpen:false,
  clock:0,fade:0,leader:'sera',route:null,routeIndex:0,routeActor:null,
  keeper:{x:257,y:235,facing:'down',moving:false,animationTime:0,animationFrame:1}};
function resetSeraLioraBreakfast() {
  if(typeof seraLioraBreakfastBattle!=='undefined')seraLioraBreakfastBattle.reset();
  const b=seraLioraBreakfast;b.epoch++;
  Object.assign(b,{visible:false,triggered:false,gateOpen:false,clock:0,fade:0,
    leader:'sera',route:null,routeIndex:0,routeActor:null});
  Object.assign(b.keeper,SERA_LIORA_BREAKFAST.keeper,
    {facing:'down',moving:false,animationTime:0,animationFrame:1});
}
function isSeraLioraBreakfastSequence() {
  return seraLioraCutscene.active && activeMap===BETHANY_GUEST_ROOM_MAP &&
    (seraLioraCutscene.phase.startsWith('breakfast_') || seraLioraCutscene.phase.startsWith('courtyard_departure'));
}
function seraLioraBreakfastAssetsReady() {
  return IMAGE_ASSET_BUNDLES.sera_liora_breakfast.every(id=>!!loadedImageAsset(id));
}
function breakfastActor(id) {
  if(id==='sera')return {...seraLioraGuestRoomWalk};
  if(id==='keeper')return {...seraLioraBreakfast.keeper};
  const c=seraLioraCourtyard;
  return {x:c.lioraX,y:c.lioraY,facing:c.lioraFacing,moving:c.moving,
    animationTime:c.animationTime,animationFrame:c.animationFrame};
}
function setBreakfastActor(id,v) {
  if(id==='sera')Object.assign(seraLioraGuestRoomWalk,v);
  else if(id==='keeper')Object.assign(seraLioraBreakfast.keeper,v);
  else {
    const c=seraLioraCourtyard;
    for(const [key,value]of Object.entries(v))c[({x:'lioraX',y:'lioraY',facing:'lioraFacing'})[key]||key]=value;
  }
}
function stopBreakfastActor(id) { setBreakfastActor(id,{moving:false,animationTime:0,animationFrame:1}); }
function breakfastBeetleViews() {
  if(seraLioraBreakfastBattle.hasWon())return [];
  const t=seraLioraBreakfast.clock,m=SERA_LIORA_SCENE_METRICS;
  return SERA_LIORA_BREAKFAST.beetles.map(b=>({id:b.id,
    x:b.x+Math.sin(t*1.1+b.offset)*3,y:b.y+Math.sin(t*0.7+b.offset)*2,
    frame:m.cycle[Math.floor((t+b.offset)/0.20)%m.cycle.length],facing:b.id==='bethany_buzzy_1'?'left':'right'}));
}
function breakfastFloorWalkable(x,y) {
  const r=SERA_LIORA_GUEST_ROOM_MOVEMENT.collisionRadius,g=SERA_LIORA_BREAKFAST.gate;
  if(![x,y].every(Number.isFinite))return false;
  if(!seraLioraBreakfast.gateOpen && x+r>g.x && x-r<g.x+g.width && y+r>g.y && y-r<g.y+g.height)return false;
  return [[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]].every(p=>
    SERA_LIORA_BREAKFAST.walkableAreas.some(area=>seraLioraRectContainsPoint(area,...p)));
}
function breakfastActorWalkable(id,x,y) {
  if(!breakfastFloorWalkable(x,y))return false;
  for(const other of ['sera','liora','keeper']){
    if(other===id)continue;const p=breakfastActor(other);
    if(Math.abs(x-p.x)<30 && Math.abs(y-p.y)<22)return false;
  }
  return breakfastBeetleViews().every(p=>Math.abs(x-p.x)>=33 || Math.abs(y-p.y)>=20);
}
function seraLioraBreakfastFootprintWalkable(x,y) { return breakfastActorWalkable('sera',x,y); }
function breakfastRouteValid(id,points) {
  if(!['sera','liora','keeper'].includes(id)||!Array.isArray(points)||!points.length)return false;
  let from=breakfastActor(id);
  for(const to of points){
    if(!to||![to.x,to.y].every(Number.isFinite))return false;
    const n=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)));
    for(let i=0;i<=n;i++)if(!breakfastActorWalkable(id,
      from.x+(to.x-from.x)*i/n,from.y+(to.y-from.y)*i/n))return false;
    from=to;
  }
  return true;
}
function beginBreakfastWalk(id,points,phase) {
  if(!breakfastRouteValid(id,points))return false;
  Object.assign(seraLioraBreakfast,{route:points.map(p=>({...p})),routeIndex:0,routeActor:id});
  for(const actor of ['sera','liora','keeper'])stopBreakfastActor(actor);
  seraLioraCutscene.phase=phase;return true;
}
function moveBreakfastActor(id,to,dt,walkable) {
  const p=breakfastActor(id),dx=to.x-p.x,dy=to.y-p.y,d=Math.hypot(dx,dy);
  const step=Math.min(d,SERA_LIORA_GUEST_ROOM_MOVEMENT.speedPxPerSecond*dt);
  if(d===0){stopBreakfastActor(id);return true;}
  const x=p.x+dx/d*step,y=p.y+dy/d*step;
  if(!walkable(x,y))return false;
  const time=p.animationTime+dt,m=SERA_LIORA_SCENE_METRICS;
  setBreakfastActor(id,{x,y,moving:true,animationTime:time,
    facing:Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down'),
    animationFrame:m.cycle[Math.floor(time/m.frameSeconds)%m.cycle.length]});
  if(step===d){stopBreakfastActor(id);return true;}return false;
}
function beginSeraLioraBreakfastDeparture() {
  if(!seraLioraCutscene.active || seraLioraCutscene.phase!=='courtyard_dialogue' || dialogue.open)return false;
  const b=seraLioraBreakfast,c=seraLioraCourtyard,w=seraLioraGuestRoomWalk;
  b.leader=w.x>c.lioraX?'sera':'liora';w.inputLocked=true;
  clearSeraLioraMovementKeys();
  seraLioraCutscene.phase='courtyard_departure_align';return true;
}
function enterSeraLioraBreakfast() {
  const b=seraLioraBreakfast,epoch=b.epoch;
  seraLioraCutscene.phase='courtyard_departure_assets';
  function arrive(){
    if(!isSeraLioraBreakfastSequence() || b.epoch!==epoch || seraLioraCutscene.phase!=='courtyard_departure_assets')return;
    if(!seraLioraBreakfastAssetsReady()){endSeraLioraCutawayAtHospital();return;}
    b.visible=true;
    for(const id of ['sera','liora'])setBreakfastActor(id,{x:id===b.leader?112:36,y:330,
      facing:'right',moving:false,animationTime:0,animationFrame:1});
    seraLioraCutscene.phase='breakfast_arrival';
  }
  if(seraLioraBreakfastAssetsReady())arrive();else preloadImageAssetBundle('sera_liora_breakfast').then(arrive);
}
function openBreakfastPages(pages,phase,next) {
  const epoch=seraLioraBreakfast.epoch;
  for(const id of ['sera','liora','keeper'])stopBreakfastActor(id);
  seraLioraCutscene.phase=phase;
  openDialogue('',[[]],[function(){
    if(isSeraLioraBreakfastSequence() && seraLioraBreakfast.epoch===epoch && seraLioraCutscene.phase===phase)next();
  }]);setSpeakerDialoguePages(pages);
}
function triggerSeraLioraBreakfast() {
  const b=seraLioraBreakfast,w=seraLioraGuestRoomWalk;
  if(!b.visible || !isSeraLioraBreakfastSequence() || seraLioraCutscene.phase!=='breakfast_free' ||
    b.triggered || dialogue.open || (w.x<190 && w.y<344) || !breakfastActorWalkable('sera',w.x,w.y))return false;
  b.triggered=true;w.inputLocked=true;clearSeraLioraMovementKeys();
  w.facing='up';seraLioraBreakfast.keeper.facing='down';
  openBreakfastPages(SERA_LIORA_BREAKFAST.problemPages,'breakfast_problem',()=>
    beginBreakfastWalk('keeper',[{x:268,y:270},{x:268,y:332},{x:305,y:332}],'breakfast_keeper_latch'));
  return true;
}
function trySeraLioraBreakfastInteraction() {
  const w=seraLioraGuestRoomWalk;
  if(!isSeraLioraBreakfastSequence() || seraLioraCutscene.phase!=='breakfast_free' ||
    dialogue.open || !w.active || w.inputLocked || w.facing!=='up' || w.x<100 || w.x>184 || w.y>286 ||
    !breakfastActorWalkable('sera',w.x,w.y))return false;
  stopBreakfastActor('sera');openDialogue('',[['Two places are set. Neither has breakfast.']]);return true;
}
// The sole authored first-battle handoff; shared combat owns every effect.
function finishSeraLioraBreakfastPreBattle() {
  if(!isSeraLioraBreakfastSequence() || seraLioraCutscene.phase!=='breakfast_final' || dialogue.open)return false;
  return seraLioraBreakfastBattle.start();
}
function updateSeraLioraBreakfast(deltaSeconds) {
  if(!isSeraLioraBreakfastSequence())return;
  const b=seraLioraBreakfast,phase=seraLioraCutscene.phase;
  const dt=Number.isFinite(deltaSeconds)?Math.max(0,Math.min(deltaSeconds,0.05)):MS_PER_FRAME/1000;
  player.moving=false;
  if(phase==='breakfast_return'){endSeraLioraCutawayAtHospital();return;}
  if(phase==='breakfast_fade'){
    b.fade=Math.min(1,b.fade+dt/SERA_LIORA_BREAKFAST.fadeSeconds);
    if(b.fade===1)seraLioraCutscene.phase='breakfast_return';return;
  }
  if(b.visible)b.clock+=dt;
  if(dialogue.open)return;
  // An unusual courtyard approach can leave Liora on the right. Let Sera
  // pass on the clear lower lane before they leave, so the next area's player
  // arrival never starts behind a companion blocking the onward route.
  if(phase.startsWith('courtyard_departure_pass_')){
    const w=breakfastActor('sera'),c=breakfastActor('liora');
    const to=phase.endsWith('_down')?{x:w.x,y:368}:
      phase.endsWith('_right')?{x:c.x+86,y:368}:{x:w.x,y:310};
    if(moveBreakfastActor('sera',to,dt,(x,y)=>seraLioraCourtyardFloorWalkable(x,y)&&
      (Math.abs(x-c.x)>=30||Math.abs(y-c.y)>=22))){
      if(phase.endsWith('_down'))seraLioraCutscene.phase='courtyard_departure_pass_right';
      else if(phase.endsWith('_right'))seraLioraCutscene.phase='courtyard_departure_pass_up';
      else{b.leader='sera';seraLioraCutscene.phase='courtyard_departure_walk';}
    }return;
  }
  if(phase==='courtyard_departure_align' || phase==='courtyard_departure_walk' || phase==='breakfast_arrival'){
    const done=[];
    for(const id of ['sera','liora']){
      const p=breakfastActor(id);
      const to=phase==='courtyard_departure_align'?{x:p.x,y:310}:
        phase==='courtyard_departure_walk'?{x:id===b.leader?450:364,y:310}:{x:id===b.leader?156:80,y:330};
      const floor=b.visible?(x,y)=>breakfastActorWalkable(id,x,y):seraLioraCourtyardFloorWalkable;
      done.push(moveBreakfastActor(id,to,dt,floor));
    }
    if(done.every(Boolean)){
      if(phase==='courtyard_departure_align')seraLioraCutscene.phase=b.leader==='sera'?'courtyard_departure_walk':'courtyard_departure_pass_down';
      else if(phase==='courtyard_departure_walk')enterSeraLioraBreakfast();
      else{seraLioraCutscene.phase='breakfast_free';seraLioraGuestRoomWalk.inputLocked=false;clearSeraLioraMovementKeys();}
    }return;
  }
  if(phase==='breakfast_free'){updateSeraLioraGuestRoomFreeWalk(dt);triggerSeraLioraBreakfast();return;}
  if(!b.route)return;
  const target=b.route[b.routeIndex],id=b.routeActor;
  if(!moveBreakfastActor(id,target,dt,(x,y)=>breakfastActorWalkable(id,x,y)))return;
  if(++b.routeIndex<b.route.length)return;
  b.route=null;b.routeActor=null;
  if(phase==='breakfast_keeper_latch'){
    b.gateOpen=true;
    beginBreakfastWalk('keeper',[{x:268,y:332},{x:268,y:250},{x:257,y:235}],'breakfast_keeper_clear');
  }else if(phase==='breakfast_keeper_clear'){
    b.keeper.facing='down';const p=breakfastActor('liora');
    beginBreakfastWalk('liora',[{x:p.x,y:368},{x:345,y:368},{x:345,y:280},{x:435,y:280},{x:435,y:290}],'breakfast_liora');
  }else if(phase==='breakfast_liora'){
    const p=breakfastActor('sera');
    beginBreakfastWalk('sera',[{x:p.x,y:368},{x:345,y:368},{x:345,y:290}],'breakfast_sera');
  }else if(phase==='breakfast_sera'){
    setBreakfastActor('sera',{facing:'up'});setBreakfastActor('liora',{facing:'up'});
    openBreakfastPages(SERA_LIORA_BREAKFAST.finalPages,'breakfast_final',finishSeraLioraBreakfastPreBattle);
  }
}
function drawSeraLioraBreakfast() {
  if(seraLioraBreakfastBattle.isStoreroom()){seraLioraBreakfastBattle.drawStoreroomBackground();return;}
  ctx.drawImage(loadedImageAsset('cutaway_bethany_breakfast_v1'),0,0);
  if(seraLioraBreakfast.gateOpen){const r=SERA_LIORA_BREAKFAST.gatePatch;
    ctx.drawImage(loadedImageAsset('cutaway_bethany_breakfast_gate_open_v1'),r.x,r.y,r.width,r.height,r.x,r.y,r.width,r.height);}
}
const SERA_LIORA_KEEPER_BOUNDS=Object.freeze([
  [23,39,102,187],[27,39,99,184],[21,39,100,187],
  [21,38,103,185],[26,38,101,183],[19,38,101,185],
  [18,31,107,180],[29,31,95,181],[15,31,105,181],
].map(Object.freeze));
const SERA_LIORA_BEETLE_BOUNDS=Object.freeze([[12,34,119,98],[10,35,112,99],[8,34,113,98]].map(Object.freeze));
function drawBreakfastKeeper() {
  const p=seraLioraBreakfast.keeper,row=({down:0,up:1,right:2,left:2})[p.facing],frame=p.moving?p.animationFrame:1;
  const r=SERA_LIORA_KEEPER_BOUNDS[row*3+frame],height=138,width=(r[2]-r[0])*height/(r[3]-r[1]);
  ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));if(p.facing==='left')ctx.scale(-1,1);
  ctx.drawImage(loadedImageAsset('cutaway_bethany_keeper_v1'),frame*128+r[0],row*192+r[1],r[2]-r[0],r[3]-r[1],-width/2,-height,width,height);ctx.restore();
}
function drawBreakfastBeetle(p) {
  const r=SERA_LIORA_BEETLE_BOUNDS[p.frame],height=32,width=(r[2]-r[0])*height/(r[3]-r[1]);
  ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));if(p.facing==='right')ctx.scale(-1,1);
  ctx.drawImage(loadedImageAsset('cutaway_buzzy_beetle_scene_v1'),p.frame*128+r[0],r[1],r[2]-r[0],r[3]-r[1],-width/2,-height,width,height);ctx.restore();
}
function drawSeraLioraBreakfastActors() {
  if(seraLioraBreakfastBattle.isEndingTerrace()){seraLioraBreakfastBattle.drawEndingActors();return;}
  if(seraLioraBreakfastBattle.isStoreroom()){seraLioraBreakfastBattle.drawStoreroomActors();return;}
  const w=seraLioraGuestRoomWalk,c=seraLioraCourtyard;
  const entries=[{id:'sera',layer:'world',depth:w.y,draw:()=>drawSeraLioraSceneSera(seraLioraSceneSeraView())},
    {id:'liora',layer:'world',depth:c.lioraY,draw:()=>drawSeraLioraCourtyardLiora({x:c.lioraX,y:c.lioraY,facing:c.lioraFacing,frame:c.moving&&!dialogue.open?c.animationFrame:1})},
    {id:'keeper',layer:'world',depth:seraLioraBreakfast.keeper.y,draw:drawBreakfastKeeper}];
  for(const p of breakfastBeetleViews())entries.push({id:p.id,layer:'world',depth:p.y,draw:()=>drawBreakfastBeetle(p)});
  entries.push({id:'yard-barrier',layer:'world',depth:312,draw:()=>{
    ctx.save();ctx.beginPath();ctx.rect(295,160,19,153);ctx.rect(376,242,18,71);ctx.rect(394,267,118,46);
    if(!seraLioraBreakfast.gateOpen)ctx.rect(314,245,62,66);
    ctx.clip();ctx.drawImage(loadedImageAsset('cutaway_bethany_breakfast_v1'),0,0);ctx.restore();
  }});
  drawLayeredScene(entries);
}
function drawSeraLioraBreakfastFade() {
  if(isSeraLioraBreakfastSequence()&&seraLioraBreakfast.fade>0){ctx.fillStyle='rgba(255,255,255,'+seraLioraBreakfast.fade+')';ctx.fillRect(0,0,512,480);}
}
