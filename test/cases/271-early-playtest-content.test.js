'use strict';
const assert = require('assert/strict');
const {createContext} = require('../harness');
const text = g => g.run('dialogue.pages.flat().join(" ")');
function fresh() {
  const g=createContext();g.press('Enter');g.press('Enter');
  g.run('dialogue.open=false;choice.open=false;day=1;currentTownId="calwick";MainQuest=0;fort_quest_started=false;');
  return g;
}
function esla(g) {
  g.run('dialogue.open=false;player.x=ESLA.x;player.y=ESLA.y;interactCalwickOffice()');
  assert.equal(g.run('dialogue.name'),'Esla');
}
module.exports={
 name:'Early playtest content: sluice directions, survival advice, carried letters, reward receipts and Fen Mask',
 run(){
  const g=fresh();
  g.run('sluice_job_started=true;sluice_fixed=false;supervisorDialogueBody()');
  assert.match(text(g),/East from the square.*residential streets.*hatch.*boardwalk/);
  assert.doesNotMatch(text(g),/West gate/);
  // Every random variant includes the practical instruction, not just one roll.
  for(const random of [0,0.4,0.9]){
    g.run('Math.random=function(){return '+random+'};sluice_job_started=true;sluice_fixed=false;MainQuest=0;');esla(g);
    assert.match(text(g),/only one level.*first level.*stronger.*Do not descend any deeper/);
    assert.match(text(g),/Treasure is optional.*health allows/);
    g.run('dispatch_quest_started=true;dispatch_delivered=false;MainQuest=1;esla_said_sluice=true;');esla(g);
    assert.match(text(g),/Monsters do not attack on the road here.*Step off the road and they do/);
    g.run('dispatch_quest_started=false;');
  }
  for(const stage of [0,1,2,3,4,5]){
    g.run('drama_stage='+stage+';stats.items=[];');
    const before=g.run('JSON.stringify({stage:drama_stage,items:stats.items})');
    const note=JSON.parse(g.run('JSON.stringify(getActiveQuestNotes().filter(n=>n.title==="Sena\'s Letter"||n.title==="Davan\'s Reply"))'));
    assert.equal(note.length,stage>0&&stage<5?1:0);
    if(stage===1||stage===3)assert.match(note[0].body,/Sena.*Davan.*east stalls.*Drenwick/);
    if(stage===2||stage===4)assert.match(note[0].body,/Davan.*Sena.*Calwick/);
    assert.equal(g.run('JSON.stringify({stage:drama_stage,items:stats.items})'),before,'notebook reads existing state without mutation');
  }
  for(const [stage,gold]of [[2,300],[3,80]]){
    g.run('sickle_quest_stage='+stage+';stats.gold=0;NPC_ACTIONS.mabelSickleQuest({name:"Mabel"})');
    assert.equal(g.run('stats.gold'),gold);assert.match(text(g),new RegExp('Received '+gold+' gold'));
    g.run('NPC_ACTIONS.mabelSickleQuest({name:"Mabel"})');assert.equal(g.run('stats.gold'),gold,'receipt does not regrant reward');
  }
  g.run('MainQuest=0;sluice_job_started=false;stats.accessory=null;stats.items=[];');esla(g);
  assert.doesNotMatch(text(g),/Fen Mask/);
  for(const equipped of [false,true]){
    g.run('stats.items=[];stats.accessory=null;'+(equipped?'stats.accessory=createItem("Fen Mask")':'grantItem("Fen Mask")'));
    esla(g);assert.match(text(g),/Fen Mask wards off poison.*equipped/);
    esla(g);assert.match(text(g),/Fen Mask wards off poison/,'advice repeats using possession, no tutorial flag');
    assert.equal(g.run('dialogue.pageSpeakers.every(id=>id==="esla")'),true);
    g.run('player.x=ESLA_DAYOFF.x;player.y=ESLA_DAYOFF.y;dialogue.open=false;interactCalwickInn()');
    assert.match(text(g),/Fen Mask wards off poison.*equipped/);
  }
  for (const stage of [0,1,2,3]) {
    g.run('cat_quest_stage='+stage+';stats.items=[];');
    const keepsakes=JSON.parse(g.run('JSON.stringify(getActiveQuestNotes().filter(n=>n.title==="Tarnished Coin"||n.title==="Bent Iron Key"))'));
    assert.equal(keepsakes.length,stage===3?2:stage===2?1:0);
    assert.equal(g.run('stats.items.length'),0,'derived keepsakes do not add saved inventory');
  }
  assert.match(g.run('getSpecialItemInspectPages("Tarnished Coin").flat().join(" ")'),/pre-Empire/);
  assert.match(g.run('getSpecialItemInspectPages("Bent Iron Key").flat().join(" ")'),/fits nothing/);
  assert.equal(g.run('SAVE_VERSION'),5);
 }
};
