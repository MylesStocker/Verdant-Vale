'use strict';
const assert=require('assert/strict');
const {J,fresh,place,reachable,dismiss}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const ids={officer:'mornay_anric_fell',beck:'two_jorans_beck',perris:'mornay_perris_dun',varda:'mornay_varda_fen',alden:'two_jorans_alden'};
function speak(g,id){
 const n=J(g,`SIMPLE_NPCS.find(n=>n.id==='${id}')`);
 const map=n.map.slice(7).toUpperCase();place(g,map);
 const p=reachable(g).find(([x,y])=>Math.hypot(x-n.x,y-n.y)<28&&g.run(`SIMPLE_NPCS.find(n=>n.map===currentContentLocationKey()&&Math.hypot(n.x-${x},n.y-${y})<TALK_RADIUS)?.id`)===id);
 assert.ok(p,id+' reachable and unshadowed from the ordinary entrance');walk(g,...p,id);g.press(' ');assert.equal(g.run('dialogue.name'),n.name);return J(g,'dialogue.pageSpeakers');
}
function start(g){speak(g,ids.officer);dismiss(g);g.press('Enter');dismiss(g);assert.equal(g.run('two_jorans_stage'),1);}
function evidence(g,order=['beck','perris','varda','alden']){for(const who of order){speak(g,ids[who]);dismiss(g);}}
function complete(g){speak(g,ids.officer);assert.equal(g.run('two_jorans_stage'),1);dismiss(g);assert.equal(g.run('two_jorans_stage'),2);speak(g,ids.beck);dismiss(g);assert.equal(g.run('two_jorans_stage'),3);}
const stable=g=>g.run('JSON.stringify({party:persistentParty.serialize(),gold:stats.gold,hp:stats.hp,mp:stats.mp,MainQuest,day})');
module.exports={name:'Two Jorans: independent evidence, corrected detention, Esla speaker styling, special key and five one-time charges',ids,speak,start,evidence,complete,
 run(){
  for(const withEsla of [false,true])for(const legacy of [false,true]){
   const g=fresh(legacy);if(withEsla)g.run("storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment()");
   const before=stable(g);
   speak(g,ids.officer);dismiss(g);g.press('ArrowDown');g.press('Enter');assert.equal(g.run('two_jorans_stage'),0,'decline is inert');
   start(g);speak(g,ids.officer);dismiss(g);assert.equal(g.run('two_jorans_stage'),1,'no completion without statements');
   const first=speak(g,ids.beck);
   assert.equal(first.includes('esla'),withEsla);
   if(withEsla)assert.equal(g.run("DIALOGUE_SPEAKER_DEFINITIONS.esla.dialogueStyleId"),'esla_light_green');
   for(let i=0;i<first.length;i++){g.run('dialogue.page='+i);assert.equal(g.run('dialoguePagePresentation().styleId'),first[i]==='esla'?'esla_light_green':null);}g.run('dialogue.page=0');
   dismiss(g);assert.equal(g.run('two_jorans_evidence'),1);
   speak(g,ids.beck);dismiss(g);assert.equal(g.run('two_jorans_evidence'),1,'repeat statements do not count twice');
   assert.match(g.run("getActiveQuestNotes().find(n=>n.title.startsWith('Two Jorans')).body"),/Perris/);
   for(const who of (legacy?['alden','varda','perris']:['perris','varda','alden'])){
    speak(g,ids[who]);dismiss(g);assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');
   }
   assert.equal(g.run('two_jorans_evidence'),15);
   complete(g);assert.equal(stable(g),before,'MQ5, party, time, health and gold unchanged');
   assert.equal(g.run("stats.items.filter(i=>i.name==='Joran’s Supply Key').length"),1);
   assert.ok(g.run("ITEM_REGISTRY['Joran’s Supply Key'].keyItem"));
   const notes=J(g,'getActiveQuestNotes()'),keyIndex=notes.findIndex(n=>n.title==='Joran’s Supply Key');
   assert.ok(keyIndex>notes.findIndex(n=>n.header==='SPECIAL ITEMS'));
   g.press('m');g.press('n');for(let i=0;i<keyIndex;i++)g.press('ArrowDown');g.press('Enter');
   assert.equal(g.run('dialogue.name'),'Joran’s Supply Key');dismiss(g);
   assert.match(g.run("getSpecialItemInspectPages('Joran’s Supply Key').flat().join(' ')"),/south wall/);
   assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');
   const count=g.run("stats.items.filter(i=>i.name==='Sapper Charge').length");
   walk(g,304,336,'supply box approach');g.press(' ');dismiss(g);
   assert.equal(g.run('two_jorans_stage'),4);assert.equal(g.run("stats.items.filter(i=>i.name==='Sapper Charge').length"),count+5);
   assert.equal(g.run("stats.items.some(i=>i.name==='Joran’s Supply Key')"),false);
   for(let i=0;i<3;i++){g.press(' ');dismiss(g);}
   assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');g.press(' ');dismiss(g);
   assert.equal(g.run("stats.items.filter(i=>i.name==='Sapper Charge').length"),count+5,'claim survives repeats and reload');
   speak(g,ids.beck);dismiss(g);speak(g,ids.officer);dismiss(g);assert.equal(g.run('two_jorans_stage'),4);
   const state=g.run('JSON.stringify({stats,stage:two_jorans_stage,facts:two_jorans_evidence})');g.renderFrame();g.run('validateGameData()');assert.equal(g.run('JSON.stringify({stats,stage:two_jorans_stage,facts:two_jorans_evidence})'),state);
   assert.equal(g.run('SAVE_VERSION'),5);
  }
 }
};
