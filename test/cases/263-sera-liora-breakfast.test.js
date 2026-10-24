'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const {completeBreakfast}=require('../sera-liora-courtyard-helpers');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(story=false){
 const g=createContext();g.press('Enter');g.press('Enter');
 g.run(`window.Image=function(){};Object.defineProperty(window.Image.prototype,'src',{set:function(v){this._src=v;const m=Object.values(IMAGE_ASSET_REGISTRY).find(m=>m.path===v);this.naturalWidth=m.width;this.naturalHeight=m.height;this.onload();}});`);
 if(story)g.run("transitionToLocation({mapId:'DREAM_MAP',x:240,y:240,facing:'down'});startSeraLioraCutaway(true)");else g.run('debugPlaySeraLioraCutaway()');
 g.press(' ');g.frames(18);g.press(' ');g.frames(40);while(g.run('seraLioraCutscene.beat')<21)g.press(' ');g.press(' ');
 for(const [key,n]of [['s',30],['a',130],['w',120],['a',60]]){g.hold(key);g.frames(n);g.release(key);}g.press('a');g.press('Enter');
 g.hold('s');g.frames(20);g.release('s');g.hold('d');g.frames(110);g.release('d');g.press('Enter');g.frames(250);for(let i=0;i<7;i++)g.press('Enter');
 assert.equal(g.run('seraLioraCutscene.phase'),'courtyard_departure_align');return g;
}
function reachBreakfast(g){let n=0;while(g.run("seraLioraCutscene.phase!=='breakfast_free'")&&n++<700)g.frames(1);assert.ok(n<700);}
const resources='JSON.stringify({stats,statusEffects,day,party:persistentParty.serialize()})';
module.exports={name:'Bethany breakfast: paired travel, two contained scene beetles, valid keeper/party staging, shared battle handoff and one acknowledged victory return',run(){
 const g=fresh();g.run("window.__combatStarts=0;startCombat=function(){__combatStarts++;throw Error('Premature cutaway combat');}");
 const before=g.run(resources),flags=g.run('JSON.stringify(QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]))');
 const frames={sera:new Set(),liora:new Set()};let n=0;
 while(g.run("seraLioraCutscene.phase!=='breakfast_free'")&&n++<700){
  const phase=g.run('seraLioraCutscene.phase'),old=J(g,"[breakfastActor('sera'),breakfastActor('liora')]");g.frames(1);
  const now=J(g,"[breakfastActor('sera'),breakfastActor('liora')]");
  for(let i=0;i<2;i++){
   if(phase===g.run('seraLioraCutscene.phase'))assert.ok(Math.hypot(now[i].x-old[i].x,now[i].y-old[i].y)<=1.50001,'walking, not teleporting within an area');
   if(now[i].moving)frames[i===0?'sera':'liora'].add(now[i].animationFrame);
  }
  assert.ok(Math.abs(now[0].x-now[1].x)>=30||Math.abs(now[0].y-now[1].y)>=22,'paired travel never overlaps');
 }
 assert.ok(n<700);assert.equal(frames.sera.size,3);assert.equal(frames.liora.size,3);
 assert.deepEqual(J(g,"[breakfastActor('sera').x,breakfastActor('liora').x]"),[156,80]);
 assert.equal(g.run('seraLioraBreakfast.visible'),true);assert.equal(g.run('seraLioraBreakfast.gateOpen'),false);
 assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0);
 assert.deepEqual(J(g,'breakfastBeetleViews().map(b=>b.id)'),['bethany_buzzy_1','bethany_buzzy_2']);
 assert.equal(g.run('breakfastFloorWalkable(345,303)'),false,'inner gate really blocks entry');
 assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('saveGame()'),false);
 assert.equal(g.run('beginSeraLioraBreakfastDeparture()'),false,'cannot replay the courtyard continuation');
 assert.equal(g.run("breakfastRouteValid('sera',[{x:345,y:303}])"),false,'cannot route through a closed gate');
 g.run("seraLioraGuestRoomWalk.x=150;seraLioraGuestRoomWalk.y=280;seraLioraGuestRoomWalk.facing='up'");
 assert.equal(g.run('trySeraLioraBreakfastInteraction()'),true);assert.equal(g.run('dialogue.pages[0][0]'),'Two places are set. Neither has breakfast.');
 g.press('Enter');assert.equal(g.run(resources),before);
 g.run('seraLioraGuestRoomWalk.x=156;seraLioraGuestRoomWalk.y=330');g.hold('d');g.frames(45);g.release('d');
 assert.equal(g.run('seraLioraCutscene.phase'),'breakfast_problem');assert.equal(g.run('dialoguePagePresentation().speakerId'),'bethany_keeper');
 for(let i=0;i<5;i++)assert.equal(g.run('triggerSeraLioraBreakfast()'),false);
 const stopped=J(g,"[breakfastActor('sera'),breakfastActor('liora')]");g.hold('w');g.frames(10);g.release('w');
 assert.deepEqual(J(g,"[breakfastActor('sera'),breakfastActor('liora')]"),stopped,'ordinary movement cannot interrupt dialogue');
 const problemCallback=g.run('dialogue.callbacks[0]');for(let i=0;i<6;i++)g.press('Enter');
 const phases=new Set(),seenPositions=new Set();n=0;
 while(g.run("seraLioraCutscene.phase!=='breakfast_final'")&&n++<1300){
  phases.add(g.run('seraLioraCutscene.phase'));
  const old=J(g,"['sera','liora','keeper'].map(breakfastActor)");g.frames(1);
  const current=J(g,"['sera','liora','keeper'].map(breakfastActor)");
  for(let i=0;i<3;i++){
   assert.ok(Math.hypot(current[i].x-old[i].x,current[i].y-old[i].y)<=1.50001,'staged actors never teleport');
   assert.equal(g.run(`breakfastFloorWalkable(${current[i].x},${current[i].y})`),true,'all actor feet stay on clear floor');
   for(let j=i+1;j<3;j++)assert.ok(Math.abs(current[i].x-current[j].x)>=30||Math.abs(current[i].y-current[j].y)>=22,'staged actor footprints never overlap');
  }
  for(const b of J(g,'breakfastBeetleViews()')){
   assert.ok(b.x>358&&b.x<485&&b.y>186&&b.y<194,'restrained scuttle remains inside the yard');
   seenPositions.add(b.x+','+b.y);
  }
  assert.equal(g.run('combat.active'),false);assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0);
 }
 assert.ok(n<1300);assert.ok(seenPositions.size>10);
 for(const phase of ['breakfast_keeper_latch','breakfast_keeper_clear','breakfast_liora','breakfast_sera'])assert.ok(phases.has(phase));
 assert.equal(g.run('seraLioraBreakfast.gateOpen'),true);assert.equal(g.run('breakfastFloorWalkable(345,303)'),true);
 assert.deepEqual(J(g,"['sera','liora'].map(id=>{const p=breakfastActor(id);return [p.x,p.y,p.facing,p.moving]})"),[[345,290,'up',false],[435,290,'up',false]]);
 assert.equal(g.run('finishSeraLioraBreakfastPreBattle()'),false,'final spoken beat cannot be bypassed while dialogue owns input');
 const renderState=g.run('JSON.stringify({b:seraLioraBreakfast,c:seraLioraCourtyard,w:seraLioraGuestRoomWalk})');
 g.run("window.__images=[];ctx.drawImage=function(im,...args){__images.push([im._src,...args]);};drawSeraLioraBreakfastActors()");
 const images=J(g,'__images');assert.equal(images.filter(i=>i[0].endsWith('/buzzy-beetle.png')).length,2,'exactly two independently rendered creatures');
 assert.equal(images.filter(i=>i[0].endsWith('/sera-walk.png')).length,1);assert.equal(images.filter(i=>i[0].endsWith('/liora-walk.png')).length,1);assert.equal(images.filter(i=>i[0].endsWith('/keeper-walk.png')).length,1);
 assert.equal(g.run('JSON.stringify({b:seraLioraBreakfast,c:seraLioraCourtyard,w:seraLioraGuestRoomWalk})'),renderState,'rendering does not advance actors');
 problemCallback();assert.equal(g.run('seraLioraCutscene.phase'),'breakfast_final','stale dialogue cannot restart staging');
 const finish=g.run('dialogue.callbacks[0]');g.press('Enter');g.press('Enter');
 assert.equal(g.run('seraLioraCutscene.phase'),'breakfast_battle_fade');finish();assert.equal(g.run('finishSeraLioraBreakfastPreBattle()'),false);
 g.frames(39);assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0);
 g.frames(1);assert.equal(g.run('seraLioraCutscene.phase'),'breakfast_battle');
 assert.equal(g.run('seraLioraBreakfastBattle.getView().enemies.length'),2);
 assert.equal(g.run('storyBattle.hasContext()'),true);finish();assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0);
 completeBreakfast(g);assert.equal(g.run('activeMap===DRENWICK_INFIRMARY_MAP'),true);assert.equal(g.run('dialogue.name'),'Esla');
 assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),1);const wake=J(g,'dialogue.pages');finish();problemCallback();
 assert.deepEqual(J(g,'dialogue.pages'),wake);assert.equal(g.run('endSeraLioraCutawayAtHospital()'),false);
 assert.equal(g.run('__combatStarts'),0);assert.equal(g.run(resources),before);assert.equal(g.run('JSON.stringify(QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]))'),flags);
 assert.equal(g.run('seraLioraBreakfast.visible'),false);assert.equal(g.run('seraLioraBreakfast.route'),null);assert.equal(g.run('seraLioraCourtyard.lioraVisible'),false);assert.equal(g.run('seraLioraBreakfast.fade'),0);
 // An unusual courtyard approach leaves Liora ahead. The bounded passing lane
 // keeps both actors legal and Sera leads at the next controllable arrival.
 const u=fresh();u.run("seraLioraGuestRoomWalk.x=79;seraLioraGuestRoomWalk.y=326;seraLioraCourtyard.lioraX=165;seraLioraCourtyard.lioraY=326;seraLioraBreakfast.leader='liora'");
 n=0;while(u.run("seraLioraCutscene.phase!=='breakfast_free'")&&n++<700){u.frames(1);const p=J(u,"[breakfastActor('sera'),breakfastActor('liora')]");assert.ok(Math.abs(p[0].x-p[1].x)>=30||Math.abs(p[0].y-p[1].y)>=22);}
 assert.ok(n<700);assert.deepEqual(J(u,"[breakfastActor('sera').x,breakfastActor('liora').x]"),[156,80]);
 // All reachable first-contact positions must leave valid scripted routes.
 for(const [x,y]of [...Array.from({length:76},(_,i)=>[190,269+i]),...Array.from({length:162},(_,i)=>[29+i,344])]){
  u.run(`seraLioraGuestRoomWalk.x=${x};seraLioraGuestRoomWalk.y=${y};seraLioraCutscene.phase='breakfast_free';seraLioraBreakfast.triggered=false;seraLioraBreakfast.gateOpen=false;dialogue.open=false;seraLioraCourtyard.lioraX=80;seraLioraCourtyard.lioraY=330;`);
  if(!u.run(`breakfastActorWalkable('sera',${x},${y})`))continue;
  assert.equal(u.run('triggerSeraLioraBreakfast()'),true,'first contact '+x+','+y);
  u.run('seraLioraBreakfast.gateOpen=true');
  assert.equal(u.run("breakfastRouteValid('liora',[{x:80,y:368},{x:345,y:368},{x:345,y:280},{x:435,y:280},{x:435,y:290}])"),true);
  u.run('seraLioraCourtyard.lioraX=435;seraLioraCourtyard.lioraY=290');
  assert.equal(u.run(`breakfastRouteValid('sera',[{x:${x},y:368},{x:345,y:368},{x:345,y:290}])`),true);
 }
 const r=fresh(true);reachBreakfast(r);r.hold('d');r.frames(45);r.release('d');const stale=r.run('dialogue.callbacks[0]');
 r.run("storyCheckpointLab.apply('mq5_assignment_ready')");stale();assert.equal(r.run('seraLioraBreakfast.visible'),false);assert.equal(r.run('seraLioraBreakfast.route'),null);
 const s=fresh(true);completeBreakfast(s);assert.equal(s.run('sera_liora_opening_complete'),true);assert.equal(s.run('seraLioraGuestRoomWalk.completionCount'),1);
 assert.equal(s.run('SAVE_VERSION'),5);
 const save=fs.readFileSync(path.join(__dirname,'../../save.js'),'utf8');assert.doesNotMatch(save,/\bseraLioraBreakfast\b|breakfast_final/);
 const source=fs.readFileSync(path.join(__dirname,'../../sera-liora-breakfast.js'),'utf8');assert.doesNotMatch(source,/\b(?:startCombat|createEnemy|startCanonicalBattle|gainExperience|addItem)\s*\(/);
}};
