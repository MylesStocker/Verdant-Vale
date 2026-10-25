'use strict';
const assert=require('assert/strict'),fs=require('fs'),Module=require('module');
const {createContext}=require('../harness');
function helpers(file,names){const p=require.resolve('./'+file),m=new Module(p,module);m.filename=p;m.paths=module.paths;m._compile(fs.readFileSync(p,'utf8')+'\nmodule.exports={'+names+'};',p);return m.exports;}
const walkHelpers=helpers('138-sera-liora-guest-room-free-walk.test.js','installImmediateImages,enterFreeWalk');
const ending=helpers('269-sera-liora-breakfast-ending.test.js','endingReady,arrive,promise,promiseHold,fadeFrames,resources,room,snapshot,retained');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function free(){const g=createContext();g.press('Enter');g.press('Enter');walkHelpers.installImmediateImages(g);g.run("keys.ArrowUp=true;keys.ArrowRight=true");walkHelpers.enterFreeWalk(g);assert.equal(g.run('keys.ArrowUp||keys.ArrowRight||keys.d||keys.D'),false,'all held movement aliases clear on handoff');return g;}
function hold(g,key,n){g.hold(key);g.frames(n);g.release(key);}
function walk(g){return J(g,'({x:seraLioraGuestRoomWalk.x,y:seraLioraGuestRoomWalk.y,facing:seraLioraGuestRoomWalk.facing,moving:seraLioraGuestRoomWalk.moving,frame:seraLioraGuestRoomWalk.animationFrame})');}
function chapter(story=false){const r=ending.endingReady({story});ending.arrive(r);ending.promise(r);ending.promiseHold(r);r.g.frames(120+ending.fadeFrames(r.g));assert.equal(ending.room(r.g).stage,'chapter_card');return r;}
module.exports={name:'Cutaway: ordinary arrow controls, safe alias handoffs and owned Chapter 2 before hospital',run(){
 for(const [letter,arrow]of [['w','ArrowUp'],['a','ArrowLeft'],['s','ArrowDown'],['d','ArrowRight']]){
  const a=free(),b=free();hold(a,letter,12);hold(b,arrow,12);assert.deepEqual(walk(b),walk(a),arrow+' matches speed, facing, collision and animation');
 }
 {
  const g=free(),origin=walk(g);hold(g,'d',10);const single=walk(g).x-origin.x;
  g.run('seraLioraGuestRoomWalk.x='+origin.x+';seraLioraGuestRoomWalk.y='+origin.y);g.hold('d');g.hold('ArrowRight');g.frames(10);g.release('d');g.release('ArrowRight');
  assert.equal(walk(g).x-origin.x,single,'same direction aliases do not double speed');
  const before=walk(g);g.hold('a');g.hold('ArrowRight');g.frames(10);g.release('a');g.release('ArrowRight');assert.equal(walk(g).x,before.x,'opposing aliases cancel');
 }
 {
  const g=free(),before=g.run('JSON.stringify({stats,statusEffects,party:persistentParty.serialize(),day})');
  for(const [key,n]of [['ArrowDown',30],['ArrowLeft',130],['ArrowUp',120],['ArrowLeft',60]])hold(g,key,n);
  g.press('ArrowLeft');g.press('Enter');assert.equal(g.run('seraLioraCutscene.phase'),'courtyard_free');
  hold(g,'ArrowDown',20);hold(g,'ArrowRight',110);assert.equal(g.run('seraLioraCutscene.phase'),'courtyard_call');
  let n=0;while(g.run('seraLioraCutscene.phase')!=='breakfast_free'&&n++<700){if(g.run('dialogue.open'))g.press('Enter');else g.frames(1);}
  assert.ok(n<700,'arrow route reaches breakfast through ordinary staging');const start=walk(g);hold(g,'ArrowUp',10);assert.ok(walk(g).y<start.y);assert.equal(walk(g).facing,'up');
  assert.equal(g.run('JSON.stringify({stats,statusEffects,party:persistentParty.serialize(),day})'),before,'local control never moves or changes Lely');
 }
 {
  const r=chapter(true),g=r.g;ending.retained(r);const calls=g.run('calls');
  assert.equal(g.run('seraLioraCutscene.phase'),'breakfast_ending_chapter');assert.equal(g.run('sera_liora_opening_complete'),false);
  g.frames(30);const before=ending.snapshot(g);g.run('var cardPaint=[];var cardText=ctx.fillText;ctx.fillText=function(text,x,y){cardPaint.push({text,x,y,color:ctx.fillStyle})};');
  g.renderFrame();g.renderFrame();g.run('ctx.fillText=cardText');assert.equal(ending.snapshot(g),before,'chapter render is read-only');
  assert.deepEqual(J(g,'cardPaint'),[{text:'Chapter 2',x:256,y:248,color:'#e8d9aa'},{text:'Chapter 2',x:256,y:248,color:'#e8d9aa'}]);
  for(const key of ['Enter','Escape','m','ArrowDown',' '])g.press(key);
  assert.equal(g.run('menu.open||choice.open||dialogue.open||saveGame()||loadGame()'),false);assert.equal(ending.room(g).stage,'chapter_card');
  g.frames(149);assert.equal(ending.room(g).stage,'chapter_card');ending.retained(r);assert.equal(g.run('calls'),calls);
  g.frames(1);assert.equal(g.run('activeMap===DRENWICK_INFIRMARY_MAP'),true);assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),1);assert.equal(g.run('sera_liora_opening_complete'),true);
  const wake=g.run('JSON.stringify(dialogue.pages)');g.frames(200);for(const cb of r.callbacks)cb();assert.equal(g.run('JSON.stringify(dialogue.pages)'),wake);assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),1);
 }
 {
  const r=chapter(),g=r.g;g.run('seraLioraBreakfastBattle.update(100)');assert.equal(ending.room(g).endingElapsed,.05,'large delta remains bounded');
  g.run('seraLioraBreakfastBattle.update(-1)');assert.equal(ending.room(g).endingElapsed,.05);
  assert.equal(g.run('storyCheckpointLab.apply("mq5_assignment_ready")'),true);const before=ending.resources(g);g.frames(300);for(const cb of r.callbacks)cb();assert.equal(ending.resources(g),before);assert.equal(g.run('seraLioraBreakfastBattle.isActive()||storyBattle.hasContext()'),false);assert.equal(g.run('SAVE_VERSION'),5);
 }
}};
