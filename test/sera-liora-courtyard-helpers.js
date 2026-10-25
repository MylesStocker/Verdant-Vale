'use strict';
const assert=require('assert/strict');
function completeCourtyard(g) {
  assert.equal(g.run('seraLioraCutscene.phase'),'courtyard_free','bedroom door enters the courtyard');
  assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0,'door is no longer completion');
  g.hold('s');g.frames(20);g.release('s');
  g.hold('d');g.frames(110);g.release('d');
  assert.equal(g.run('seraLioraCutscene.phase'),'courtyard_call');
  g.press('Enter');
  let n=0;while(g.run("seraLioraCutscene.phase==='courtyard_approach'")&&n++<300)g.frames(1);
  assert.ok(n<300,'Liora walks to Sera');
  while(g.run("seraLioraCutscene.phase==='courtyard_dialogue'")&&n++<320)g.press('Enter');
  completeBreakfast(g);
  assert.equal(g.run('activeMap===DRENWICK_INFIRMARY_MAP'),true);
}
function completeBreakfast(g) {
  let n=0;
  while(g.run('seraLioraCutscene.active')&&n++<1800){
    if(g.run('dialogue.open'))g.press('Enter');
    else if(g.run("seraLioraBreakfastBattle.getState()?.stage==='battle'"))advanceBreakfastBattle(g);
    else if(g.run("seraLioraCutscene.phase==='breakfast_free'")){
      g.hold('d');g.frames(45);g.release('d');
    }else g.frames(1);
  }
  assert.ok(n<1800,'both shared battles and the natural breakfast ending reach the infirmary');
  assertHospital(g);
}
function assertHospital(g){
  assert.equal(g.run('activeMap===DRENWICK_INFIRMARY_MAP'),true);
  assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),1);
  assert.equal(g.run('seraLioraBreakfastBattle.isActive()||storyBattle.hasContext()'),false);
}
function completeEnding(g){
  let n=0;
  while(g.run('seraLioraCutscene.active')&&n++<600){
    if(g.run('dialogue.open'))g.press('Enter');else g.frames(1);
  }
  assert.ok(n<600,'authored dialogue, two-second promise hold and final fade complete naturally');
  assertHospital(g);
}
function advanceBreakfastBattle(g){
 const v=JSON.parse(g.run('JSON.stringify(seraLioraBreakfastBattle.getView())'));
 if(v.phase==='awaiting_action'){
  const wanted=v.enabledCommands.includes('resonance')?'resonance':'attack';
  if(v.selectedCommand!==wanted)g.press('ArrowRight');else g.press('Enter');
 }else if(v.phase==='technique'){
  if(v.selectedTechniqueId==='eclipse')g.press('ArrowDown');else g.press('Enter');
 }else if(v.phase==='targeting'){
  const alive=v.enemies.filter(e=>e.hp>0),slot=v.party.find(m=>m.instanceId===v.nextActorId).slot;
  const desired=alive[Math.min(slot,alive.length-1)].instanceId;
  if(v.selectedTargetInstanceId!==desired)g.press('ArrowRight');else g.press('Enter');
 }else if(v.phase==='playback'&&g.run('partyBattleQuickbloomAnimation.blocksAdvance(seraLioraBreakfastBattle.getView())||partyBattleOffensiveResonanceAnimation.blocksAdvance(seraLioraBreakfastBattle.getView())'))g.frames(1);
 else g.press('Enter');
}
module.exports={completeCourtyard,completeBreakfast,completeEnding,advanceBreakfastBattle};
