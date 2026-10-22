'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,source)=>JSON.parse(g.run('JSON.stringify('+source+')'));
function fresh(){const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;choice.open=false;
  Math=Object.create(Math);var lifecycleRolls=0;Math.random=()=>{lifecycleRolls++;throw Error('unexpected lifecycle RNG')}`);return g;}
function recruit(g){g.run(`storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;
  completeMq5Assignment();dialogue.open=false`);}
const npc=(g,id)=>J(g,`SIMPLE_NPCS.find(n=>n.id===${JSON.stringify(id)}).dialogue`);
function prepareNight(g){g.run(`storyCheckpointLab.apply('mq5_campfire_ready');dialogue.open=false`);g.frames(1);
  g.run('finishDialogue()');g.frames(300);g.run('finishDialogue()');assert.equal(g.run('travellers_rise_camp_stage'),1);}
function finishNight(g){g.press('Enter');let guard=0;while(g.run("travellersRiseNight.getView().phase!=='idle'")){
  if(g.run('dialogue.open'))g.run('finishDialogue()');else g.frames(1);assert.ok(guard++<2500);}}

test('camp stage two is the sole ordinary full-sequence receipt and every saved boundary is coherent',()=>{
  const g=fresh();assert.equal(g.run('travellersRiseSequenceComplete()'),false);
  g.run("storyCheckpointLab.apply('mq5_campfire_ready');dialogue.open=false");
  assert.deepEqual(J(g,'[travellers_rise_ambush_complete,travellers_rise_camp_stage,travellersRiseSequenceComplete()]'),[true,0,false]);
  g.frames(1);g.run('finishDialogue()');g.frames(300);g.run('finishDialogue()');
  assert.deepEqual(J(g,'[travellers_rise_ambush_complete,travellers_rise_camp_stage,travellersRiseSequenceComplete()]'),[true,1,false]);
  assert.equal(g.run('saveGame()'),true);g.run('travellers_rise_camp_stage=0;syncQuestFlagsToWindow();loadGame();dialogue.open=false');
  assert.deepEqual(J(g,'[travellers_rise_ambush_complete,travellers_rise_camp_stage,travellersRiseSequenceComplete()]'),[true,1,false]);
  finishNight(g);assert.deepEqual(J(g,'[travellers_rise_ambush_complete,travellers_rise_camp_stage,travellersRiseSequenceComplete()]'),[true,2,true]);
  assert.deepEqual(J(g,"travellersRiseAmbushInvariantErrors({MainQuest:5,travellers_rise_ambush_complete:true,travellers_rise_ambush_paid:false,travellers_rise_ambush_payment:0,travellers_rise_camp_stage:2,party:{order:['lely','esla']},location:{mapId:'TRAVELLERS_RISE_CAMP_MAP'}})"),[]);
  assert.equal(g.run('lifecycleRolls'),0);
});

test('the full-sequence receipt is withheld until the completed dawn and cannot replay rest or journal effects',()=>{
  const g=fresh();prepareNight(g);const beforeDay=g.run('day');g.press('Enter');let guard=0;
  while(!['sleep','fault'].includes(g.run('travellersRiseNight.getView().phase'))){if(g.run('dialogue.open'))g.run('finishDialogue()');else g.frames(1);assert.ok(guard++<2200);}
  assert.equal(g.run('travellers_rise_camp_stage'),1);assert.equal(g.run('day'),beforeDay+1);
  finishNight(g);const settled=J(g,'({day,stage:travellers_rise_camp_stage,stats,party:persistentParty.serialize(),journal:getActiveQuestNotes()})');
  assert.equal(settled.stage,2);assert.equal(g.run('travellersRiseNight.begin()'),false);g.frames(300);
  assert.deepEqual(J(g,'({day,stage:travellers_rise_camp_stage,stats,party:persistentParty.serialize(),journal:getActiveQuestNotes()})'),settled);
});

test('numeric MQ5 state alone cannot create any curated companion exchange',()=>{
  const g=fresh(),ids=['tomas','aldric','petra','corvin','oswin','district_officer','drenwick_clerk','thread_officer','harbormaster_interior','harbormaster'];
  g.run('day=1;MainQuest=5');
  for(const id of ids){const pages=npc(g,id);assert.ok(pages.every(Array.isArray),id);assert.doesNotMatch(JSON.stringify(pages),/Officer Jonbur|Two Calwick officers eastbound|There you are\. Both of you/);}
  g.run(`fort_quest_stage=6;reservoir_quest_started=true;reservoir_report_filed=true;supervisorDialogueBody()`);
  assert.equal(g.run('dialogue.pageSpeakers'),null);assert.doesNotMatch(g.run('JSON.stringify(dialogue.pages)'),/permitting the road/);
});

test('ten plausible Calwick and Drenwick contacts append mixed-speaker exchanges only after recruitment',()=>{
  const g=fresh();recruit(g);g.run('day=1');
  const expected={tomas:'tomas',aldric:'aldric',petra:'petra',corvin:'corvin',oswin:'oswin',
    district_officer:'veth',drenwick_clerk:'holt',thread_officer:'sable',harbormaster_interior:'renn'};
  for(const [id,speaker] of Object.entries(expected)){
    const pages=npc(g,id);assert.ok(pages.every(page=>page&&typeof page==='object'&&!Array.isArray(page)),id);
    assert.ok(pages.some(page=>page.speakerId===speaker),id);assert.ok(pages.some(page=>page.speakerId==='esla'),id);
  }
  g.run('day=5');const renn=npc(g,'harbormaster');assert.ok(renn.some(page=>page.speakerId==='renn'));assert.ok(renn.some(page=>page.speakerId==='esla'));
});

test('speaker installation gives Esla the shared green style and restores each ordinary speaker default',()=>{
  const g=fresh();recruit(g);g.run('day=1');
  for(const id of ['tomas','aldric','petra','corvin','oswin','district_officer','drenwick_clerk','thread_officer','harbormaster_interior']){
    g.run(`var selectedNpc=SIMPLE_NPCS.find(n=>n.id===${JSON.stringify(id)});setNpcDialoguePages(selectedNpc);dialogue.page=dialogue.pageSpeakers.indexOf('esla')`);
    assert.deepEqual(J(g,'dialoguePagePresentation()'),{name:'Esla',styleId:'esla_light_green',speakerId:'esla'},id);
    g.run('dialogue.page=0');assert.equal(g.run('dialoguePagePresentation().styleId'),null,id);
  }
  assert.equal(g.run('lifecycleRolls'),0);
});

test('Supervisor and Tomas exchanges survive save/load, honor Fallen membership, and checkpoint reset removes them',()=>{
  const g=fresh();recruit(g);g.run(`supervisorDialogueBody();var supervisorSpeakers=dialogue.pageSpeakers;
    saveGame();var saved=JSON.parse(localStorage.getItem('verdantVale_save'));saved.party.characters[0].hp=0;
    localStorage.setItem('verdantVale_save',JSON.stringify(saved));loadGame();dialogue.open=false;day=1`);
  assert.deepEqual(J(g,'supervisorSpeakers.slice(-3)'),['supervisor','esla','supervisor']);
  assert.equal(g.run("persistentParty.getMember('esla').hp"),0);assert.ok(npc(g,'tomas').some(page=>page.speakerId==='esla'));
  g.run("storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;day=1");assert.equal(g.run("persistentParty.getMember('esla')"),null);
  assert.ok(npc(g,'tomas').every(Array.isArray));
});

test('important existing quest pages retain priority ahead of the companion exchange',()=>{
  const g=fresh();recruit(g);g.run('day=1;corvin_favor_started=true;corvin_favor_done=false;weight_quest_stage=3');
  const corvin=npc(g,'corvin'),oldIndex=corvin.findIndex(page=>page.lines.some(line=>line.includes('old canal office'))),newIndex=corvin.findIndex(page=>page.speakerId==='esla');
  assert.ok(oldIndex>=0&&oldIndex<newIndex);
  g.run('sentry_quest_done=true');const veth=npc(g,'district_officer');
  assert.ok(veth.findIndex(page=>page.lines.some(line=>line.includes('watch order')))<veth.findIndex(page=>page.speakerId==='esla'));
});

test('the hardened sources add no duplicate completion flag or save-version change',()=>{
  const root=path.join(__dirname,'../..'),quest=fs.readFileSync(path.join(root,'quests.js'),'utf8'),save=fs.readFileSync(path.join(root,'save.js'),'utf8');
  assert.doesNotMatch(quest,/travellers_rise_sequence_complete/);assert.match(quest,/return stage\s*===\s*2/);assert.match(save,/const SAVE_VERSION = 5/);
});

module.exports={name:"Travellers' Rise one-time lifecycle and post-MQ5 settlement dialogue",run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}console.log('  '+checks.length+' lifecycle/dialogue checks passed');}};
