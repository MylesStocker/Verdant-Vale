'use strict';
const assert=require('assert/strict');
const {fresh,J,dismiss}=require('./301-mornay-manifest.test');
function bank(g,gold=100){
 assert.equal(g.run("transitionToLocation({mapId:'REEDBANK_VILLAGE_MAP',x:312,y:304,facing:'right'})"),true);
 g.run(`dialogue.open=false;stats.gold=${gold};`);
}
function offer(g,paid=true){
 g.press(' ');assert.equal(g.run('dialogue.name'),'Tavin');dismiss(g);
 assert.equal(g.run('choice.open'),true);
 if(paid)g.press('ArrowDown');g.press('Enter');
}
const view=g=>J(g,'riverWrestling.getView()');
function winWithControls(g,onFrame=()=>{}){
 for(let i=0;i<2400;i++){
  const v=view(g);if(v.phase==='result'){g.release('ArrowRight');return v;}
  if(v.phase==='fight'){
   if(v.opponent.x-v.you.x>48)g.hold('ArrowRight');else g.release('ArrowRight');
   if(!v.you.windup&&!v.you.recovery&&v.opponent.x-v.you.x<=58){
    if(v.you.stamina<28)g.hold('ArrowDown');
    else {g.release('ArrowDown');g.press(v.opponent.footing<=40?(v.you.grip?'c':'z'):'x');}
   }
  }
  g.frames();onFrame(view(g));
 }
 assert.fail('ordinary footwork, shoves, grip and throw should produce a winnable bout');
}
const party=g=>g.run('JSON.stringify({party:persistentParty.serialize(),stats:{...stats,gold:0},MainQuest,day,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),location:snapshotLocationState(),position:[player.x,player.y,player.facing]})');
module.exports={
 name:'River wrestling: real controls, free practice, paid win/loss, atomic settlement and isolated session ownership',
 bank,offer,view,winWithControls,
 run(){
  const g=fresh();bank(g);const before=party(g);assert.equal(g.run('saveGame()'),true);
  offer(g);assert.equal(view(g).phase,'ready');assert.equal(g.run('stats.gold'),100);
  assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('loadGame()'),false);
  g.press('Escape');assert.equal(g.run('stats.gold'),100);assert.equal(g.run('riverWrestling.isActive()'),false);
  offer(g);g.press('Enter');assert.equal(g.run('stats.gold'),90);
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
  assert.equal(g.run("transitionToLocation({mapId:'MAP',x:240,y:240,facing:'down'})"),false);
  assert.ok(J(g,'activityOwnership.combatPreparationConflicts(false)').includes('river_wrestling'));
  assert.ok(J(g,'activityOwnership.legacyExecutionConflicts()').includes('river_wrestling'));
  assert.equal(g.run('startFishing()'),false);
  const state=JSON.stringify(view(g));g.renderFrame();g.renderFrame();assert.equal(JSON.stringify(view(g)),state,'render is read-only');
  const copy=g.run('riverWrestling.getView()');copy.you.footing=0;assert.equal(view(g).you.footing,100,'view cannot mutate authority');
  const v=winWithControls(g);assert.equal(v.winner,'you');assert.equal(g.run('stats.gold'),110);
  assert.equal(party(g),before,'no health, inventory, quests, time, location or party changes');
  g.frames(180);assert.equal(g.run('stats.gold'),110,'result cannot pay repeatedly');
  g.press('Enter');assert.equal(g.run('riverWrestling.isActive()'),false);
  assert.equal(g.run('saveGame()'),true);g.run('stats.gold=1');assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');assert.equal(g.run('stats.gold'),110);
  // An idle player is thrown under ordinary AI rules, not an artificial timeout.
  offer(g);g.press('Enter');g.frames(700);assert.equal(view(g).phase,'result');assert.equal(view(g).winner,'opponent');
  assert.equal(g.run('stats.gold'),100);g.press('Enter');
  offer(g,false);g.press('Enter');assert.equal(winWithControls(g).winner,'you');assert.equal(g.run('stats.gold'),100);
  g.frames(50);g.press('Enter');offer(g);g.press('Enter');g.press('Escape');g.frames(50);g.press('Enter');
  assert.equal(g.run('stats.gold'),90,'giving in loses exactly the original stake');
  bank(g,9);offer(g);assert.equal(g.run('riverWrestling.isActive()'),false);dismiss(g);
  assert.equal(g.run('stats.gold'),9);offer(g,false);g.press('Enter');g.press('Escape');g.frames(50);g.press('Enter');assert.equal(g.run('stats.gold'),9);
  // Defensive controls are actual mechanics. Hold brace against several shoves.
  bank(g);offer(g,false);g.press('Enter');g.hold('ArrowDown');g.frames(240);g.release('ArrowDown');
  assert.ok(view(g).you.footing>85,'brace absorbs shoves and recovers footing');
  g.frames(700);assert.equal(view(g).phase,'result');g.press('Enter');
  // Break an acquired grip before a throw, using Space rather than state edits.
  offer(g,false);g.press('Enter');for(let i=0;i<600&&!view(g).opponent.grip;i++)g.frames();
  assert.ok(view(g).opponent.grip>0);g.press(' ');assert.equal(view(g).opponent.grip,0);assert.ok(view(g).you.stamina<100);
  g.press('Escape');g.frames(50);g.press('Enter');
  // Native repeat never starts a bout, repeats an action or acknowledges a
  // result. The input owner retains physical action latches across screens.
  offer(g,false);g.keydown('Enter',{repeat:true});assert.equal(view(g).phase,'ready');g.release('Enter');g.press('Enter');
  g.hold('x');g.frames(60);const heldStamina=view(g).you.stamina;
  g.keydown('x',{repeat:true});assert.equal(view(g).you.stamina,heldStamina);
  assert.equal(view(g).you.windup,0);g.release('x');
  g.keydown('Escape',{repeat:true});assert.equal(view(g).phase,'fight');g.release('Escape');
  g.press('Escape');g.frames(50);g.keydown('Enter',{repeat:true});assert.equal(view(g).phase,'result');g.release('Enter');g.press('Enter');
  // Movement/brace support both advertised control families. Simulation uses
  // elapsed time, so lower refresh rates do not change authored action timing.
  const a=fresh(),b=fresh();bank(a);bank(b);offer(a,false);offer(b,false);a.press('Enter');b.press('Enter');
  a.hold('d');b.hold('ArrowRight');a.run('for(let i=0;i<60;i++)update(1/60)');b.run('for(let i=0;i<30;i++)update(1/30)');
  assert.deepEqual(view(a),view(b));assert.ok(view(a).you.x>190);
  a.release('d');b.release('ArrowRight');
  assert.equal(g.run('SAVE_VERSION'),5);
 }
};
