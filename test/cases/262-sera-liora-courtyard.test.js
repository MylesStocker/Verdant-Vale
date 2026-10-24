'use strict';
const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {createContext}=require('../harness');
const {completeBreakfast}=require('../sera-liora-courtyard-helpers');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(story=false) {
  const g=createContext();g.press('Enter');g.press('Enter');
  g.run(`window.Image=function(){};Object.defineProperty(window.Image.prototype,'src',{set:function(v){this._src=v;const m=Object.values(IMAGE_ASSET_REGISTRY).find(m=>m.path===v);this.naturalWidth=m.width;this.naturalHeight=m.height;this.onload();}});`);
  if(story)g.run("transitionToLocation({mapId:'DREAM_MAP',x:240,y:240,facing:'down'});startSeraLioraCutaway(true)");
  else g.run('debugPlaySeraLioraCutaway()');
  g.press(' ');g.frames(18);g.press(' ');g.frames(40);
  while(g.run('seraLioraCutscene.beat')<21)g.press(' ');g.press(' ');
  g.run("seraLioraGuestRoomWalk.x=70;seraLioraGuestRoomWalk.y=205;seraLioraGuestRoomWalk.facing='left'");
  g.press('Enter');assert.equal(g.run('seraLioraCutscene.phase'),'courtyard_free');
  return g;
}
function trigger(g){g.hold('s');g.frames(20);g.release('s');g.hold('d');g.frames(110);g.release('d');}
module.exports={name:'Bethany courtyard: solo movement, unavoidable rendezvous, valid animated route, repeat-safe story return and reset isolation',run(){
  const g=fresh();
  const before=g.run('JSON.stringify({stats,statusEffects,party:persistentParty.serialize(),day,player,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])})');
  assert.equal(g.run('seraLioraCourtyard.lioraVisible'),false);
  assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0);
  assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('saveGame()'),false);
  const start=J(g,'[seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y]');
  g.hold('s');g.frames(10);g.release('s');
  assert.deepEqual(J(g,'[seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y]'),[start[0],start[1]+15]);
  assert.equal(g.run('seraLioraCourtyard.triggered'),false,'actual solo movement precedes interruption');
  g.hold('d');g.frames(110);g.release('d');
  assert.equal(g.run('seraLioraCutscene.phase'),'courtyard_call');
  assert.deepEqual(J(g,'dialogue.pageSpeakers'),['liora']);
  assert.equal(g.run('dialogue.pages[0][0]'),'Sera! Wait!');
  assert.equal(g.run('seraLioraGuestRoomWalk.facing'),'left');
  assert.equal(g.run('seraLioraGuestRoomWalk.moving'),false);
  assert.equal(g.run('seraLioraCourtyard.lioraVisible'),true);
  assert.equal(g.run('seraLioraCourtyardRouteValid(seraLioraCourtyard.route)'),true);
  assert.equal(g.run('seraLioraCourtyardRouteValid([{x:10,y:10}])'),false);
  const stopped=J(g,'[seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y,seraLioraGuestRoomWalk.facing]');
  for(let n=0;n<5;n++)assert.equal(g.run('triggerSeraLioraCourtyard()'),false);
  g.hold('s');g.frames(30);g.release('s');g.press('a');
  assert.deepEqual(J(g,'[seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y,seraLioraGuestRoomWalk.facing]'),stopped);
  assert.equal(g.run('JSON.stringify({stats,statusEffects,party:persistentParty.serialize(),day,player,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])})'),before);
  g.hold('Enter');
  const frames=new Set(),facings=new Set();let n=0,last=J(g,'[seraLioraCourtyard.lioraX,seraLioraCourtyard.lioraY]');
  while(g.run("seraLioraCutscene.phase==='courtyard_approach'")&&n++<400){
    g.frames(1);const p=J(g,'[seraLioraCourtyard.lioraX,seraLioraCourtyard.lioraY]');
    assert.ok(Math.hypot(p[0]-last[0],p[1]-last[1])<=1.50001,'no teleports');
    assert.equal(g.run(`seraLioraCourtyardFloorWalkable(${p[0]},${p[1]})`),true);
    assert.ok(Math.abs(p[0]-stopped[0])>=29||Math.abs(p[1]-stopped[1])>=21,'no actor overlap');
    assert.deepEqual(J(g,'[seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y]'),stopped.slice(0,2));
    frames.add(g.run('seraLioraCourtyard.animationFrame'));facings.add(g.run('seraLioraCourtyard.lioraFacing'));last=p;
  }
  assert.ok(n<400);assert.equal(g.run('seraLioraCutscene.phase'),'courtyard_dialogue');assert.equal(frames.size,3);
  g.keydown('Enter',{repeat:true});assert.equal(g.run('dialogue.page'),0,'held confirmation cannot skip the new conversation');g.release('Enter');
  assert.ok(facings.has('down')&&facings.has('right'),'walking follows route turns');
  assert.ok(Math.abs(Math.abs(last[0]-stopped[0])-86)<0.00001);assert.equal(last[1],stopped[1]);
  assert.equal(g.run('seraLioraCourtyard.moving'),false);
  assert.deepEqual(J(g,'[seraLioraGuestRoomWalk.facing,seraLioraCourtyard.lioraFacing]'),['left','right']);
  assert.equal(g.run('dialoguePagePresentation().styleId'),'sera_elegant');
  assert.deepEqual(J(g,'dialogue.pageSpeakers'),['sera','liora','sera','liora','sera','liora','sera']);
  const finish=g.run('dialogue.callbacks[0]');
  g.run('window.__actors=[];ctx.drawImage=function(im,...args){__actors.push([im._src,...args]);};');
  for(let i=0;i<7;i++){
    g.run('__actors=[];render()');const draws=J(g,'__actors');
    assert.equal(draws.filter(v=>v[0].endsWith('/sera-walk.png')).length,1);
    assert.equal(draws.filter(v=>v[0].endsWith('/courtyard-v1/liora-walk.png')).length,1);
    const li=draws.find(v=>v[0].endsWith('/courtyard-v1/liora-walk.png'));
    assert.equal(li[8],148,'all Liora poses share measured height');
    assert.equal(g.run('seraLioraCourtyard.lioraVisible'),true);
    const still=J(g,'[seraLioraCourtyard.lioraX,seraLioraCourtyard.lioraY]');g.frames(5);
    assert.deepEqual(J(g,'[seraLioraCourtyard.lioraX,seraLioraCourtyard.lioraY]'),still);
    g.press('Enter');
  }
  assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0,'courtyard now continues without completing');
  completeBreakfast(g);
  assert.equal(g.run('activeMap===DRENWICK_INFIRMARY_MAP'),true);assert.equal(g.run('dialogue.name'),'Esla');
  assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),1);assert.equal(g.run('seraLioraCourtyard.lioraVisible'),false);
  finish();assert.equal(g.run('endSeraLioraCutawayAtHospital()'),false);assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),1);
  assert.equal(g.run('sera_liora_opening_complete'),false,'preview remains progression-neutral');
  const after=J(g,'({stats,statusEffects,party:persistentParty.serialize(),day})'),old=JSON.parse(before);
  assert.deepEqual(after,{stats:old.stats,statusEffects:old.statusEffects,party:old.party,day:old.day});
  assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),[240,272,'up']);
  // Test every reachable first-contact position from either side of the trigger.
  const u=fresh();
  for(const [x,y]of [...Array.from({length:58},(_,i)=>[300,269+i]),...Array.from({length:232},(_,i)=>[69+i,326])]){
    if(!u.run(`seraLioraCourtyardFloorWalkable(${x},${y})`))continue;
    u.run(`resetSeraLioraCourtyard();dialogue.open=false;seraLioraCutscene.phase='courtyard_free';seraLioraGuestRoomWalk.x=${x};seraLioraGuestRoomWalk.y=${y};`);
    assert.equal(u.run('triggerSeraLioraCourtyard()'),true,'trigger route from '+x+','+y);
  }
  const s=fresh(true);trigger(s);s.press('Enter');s.frames(250);const stale=s.run('dialogue.callbacks[0]');
  for(let i=0;i<7;i++)s.press('Enter');assert.equal(s.run('sera_liora_opening_complete'),false);
  completeBreakfast(s);assert.equal(s.run('sera_liora_opening_complete'),true);
  stale();assert.equal(s.run('seraLioraGuestRoomWalk.completionCount'),1);
  const r=fresh();trigger(r);const resume=r.run('dialogue.callbacks[0]');
  r.run("storyCheckpointLab.apply('mq5_assignment_ready')");resume();
  assert.equal(r.run('seraLioraCutscene.active'),false);assert.equal(r.run('seraLioraCourtyard.lioraVisible'),false);
  assert.deepEqual(J(r,'seraLioraCourtyard.route'),[]);assert.equal(r.run('seraLioraGuestRoomWalk.active'),false);
  assert.equal(r.run('SAVE_VERSION'),5);
  const source=fs.readFileSync(path.join(__dirname,'../../save.js'),'utf8');assert.doesNotMatch(source,/seraLioraCourtyard|courtyard_free/);
}};
