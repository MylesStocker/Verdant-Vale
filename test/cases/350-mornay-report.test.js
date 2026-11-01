'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(){const g=createContext();g.run("storyCheckpointLab.apply('mq5_mornay_report_ready');worldToastTimer=0");return g;}
function approach(g){g.hold('ArrowUp');g.frames(32);g.release('ArrowUp');g.hold('ArrowLeft');g.frames(4);g.release('ArrowLeft');assert.deepEqual(J(g,'[player.x,player.y]'),[136,80]);}
function report(g){approach(g);g.press('Enter');assert.equal(g.run('mornayReport.isActive()'),true);}
function close(g){for(let i=0;g.run('dialogue.open');i++){assert.ok(i<100);g.run('drawDialogue()');g.press('Enter');}}
const preserved=g=>g.run(`JSON.stringify({stats,party:persistentParty.serialize(),statusEffects,slitherSpd,day,
 flags:QUEST_FLAG_BINDINGS.filter(b=>b.key!=='mq5_report_delivered').map(b=>[b.key,b.get()]),
 pickups:collectedPickupIdsForSave(),chests:openedChestIdsForSave()})`);
// Keep test snapshots on existing registered authorities; no replacement inventory.

test('checkpoint installs a coherent post-camp state and leaves stored saves untouched',()=>{
 const g=createContext();g.run("localStorage.setItem('verdantVale_save','untouched')");
 assert.equal(g.run("storyCheckpointLab.apply('mq5_mornay_report_ready')"),true);
 assert.equal(g.run("localStorage.getItem('verdantVale_save')"),'untouched');
 assert.deepEqual(J(g,'[MainQuest,travellers_rise_camp_stage,travellers_rise_ambush_complete,mq5_report_delivered]'),[5,2,true,false]);
 assert.equal(g.run('mornayReport.eligible()&&canWalk(player.x,player.y)'),true);
 assert.equal(g.run('saveGame()&&loadGame()'),true);
});
test('genuine assignment and mandatory discoveries are required; arrival alone is inert',()=>{
 for(const assignment of ['MainQuest=4','MainQuest=6','fort_quest_stage=5','reservoir_quest_started=false','reservoir_report_filed=false',
  'window.gallery_body_found=false','gallery_receiver_defeated=false','sera_liora_opening_complete=false']){
  const g=fresh();g.run(assignment);approach(g);g.press('Enter');assert.equal(g.run('mornayReport.isActive()'),false,assignment);close(g);assert.equal(g.run('mq5_report_delivered'),false);
 }
 const g=fresh();g.frames(30);assert.equal(g.run('mq5_report_delivered'),false);assert.equal(g.run('dialogue.open'),false);
});
test('ordinary controls show both women, preserve resources and complete only on the last acknowledgement',()=>{
 const g=fresh();report(g);const before=preserved(g),pos=J(g,'[player.x,player.y]'),companion=J(g,'mornayReport.companion()');
 assert.ok(companion);assert.ok(Math.hypot(companion.x-pos[0],companion.y-pos[1])>=28);
 assert.equal(g.run(`isTileWalkable(tileAt(${companion.x},${companion.y}))&&!npcRouteCustomSolidBlocks(${companion.x},${companion.y})`),true);
 g.run('var seenEsla=0,eslaDraw=drawWalkingEslaFigure;drawWalkingEslaFigure=(...args)=>{seenEsla++;return eslaDraw(...args)};drawMornayRoomActors()');assert.equal(g.run('seenEsla'),1);
 g.hold('ArrowDown');g.frames(20);g.release('ArrowDown');assert.deepEqual(J(g,'[player.x,player.y]'),pos);
 g.press('m');g.press('`');assert.equal(g.run('menu.open||debugMenu.open'),false);
 assert.equal(g.run('saveGame()||loadGame()||canSaveHere()'),false);
 let green=false;
 while(g.run('dialogue.open')){
  g.run('drawDialogue()');const p=J(g,'dialoguePagePresentation()');
  assert.equal(g.run('mq5_report_delivered'),false,'all visible pages precede completion');
  if(p.speakerId==='esla'){green=true;assert.equal(p.styleId,'esla_light_green');}else assert.equal(p.styleId,null);
  g.press('Enter');
 }
 assert.ok(green);assert.equal(g.run('mq5_report_delivered'),true);assert.equal(g.run('mornayReport.companion()'),null);
 assert.equal(preserved(g),before);assert.equal(g.run('MainQuest'),5);
 const note=J(g,'getActiveQuestNotes()').find(n=>n.title==='Request for Assistance');assert.match(note.body,/Completed:.*received.*no assistance or timetable/i);
 assert.doesNotMatch(note.body,/carry|deliver|rejoin|wait until/i);
 g.press('Enter');assert.equal(g.run('mornayReport.isActive()'),false);assert.equal(g.run('greybank_stage'),1);assert.match(g.run('dialogue.pages.flat().join(" ")'),/Greybank Mill/);close(g);g.press('ArrowDown');g.press('Enter');assert.equal(g.run('MainQuest'),5);assert.equal(g.run('mq5_report_delivered'),true);
 walk(g,240,432,'free movement after report');
});
test('held confirmation cannot skip pages, complete twice or reopen the handoff',()=>{
 const g=fresh();report(g);g.run('var completionCallback=dialogue.callbacks[0]');
 g.hold('Enter');const page=g.run('dialogue.page');g.frames(20);assert.equal(g.run('dialogue.page'),page);assert.equal(g.run('mq5_report_delivered'),false);g.release('Enter');
 close(g);const before=preserved(g);g.run('completionCallback();completionCallback()');assert.equal(preserved(g),before);assert.equal(g.run('mq5_report_delivered'),true);
});
test('Fine Needlework absence, cargo and return location survive solo reporting and reload',()=>{
 const g=fresh();g.run("transitionToLocation({mapId:'MORNAY_GATE_INN_MAP',x:240,y:432,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_gate_inn'}})");
 assert.equal(g.run('fineNeedlework.accept()'),true);
 g.run("transitionToLocation({mapId:'MORNAY_OFFICE_MAP',x:144,y:144,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_office'}})");
 assert.equal(g.run('saveGame()&&loadGame()'),true);const before=preserved(g);report(g);
 assert.equal(g.run('mornayReport.companion()'),null);assert.equal(g.run('dialogue.pageSpeakers.includes("esla")'),false);
 close(g);assert.equal(preserved(g),before);assert.equal(g.run('saveGame()&&loadGame()'),true);assert.equal(preserved(g),before);
 assert.equal(g.run('persistentParty.getAbsence("esla").returnMapId'),'MORNAY_COMMERCIAL_INN_MAP');
 assert.equal(g.run('fine_needlework_stage'),1);assert.equal(g.run('mq5_report_delivered'),true);
});
test('field reporting adds no unrelated HP gate',()=>{
 const g=fresh();g.run('stats.hp=0');report(g);assert.ok(g.run('mornayReport.companion()'));close(g);assert.equal(g.run('mq5_report_delivered'),true);assert.equal(g.run('stats.hp'),0);
});
test('optional evidence is discovery-gated and private dreams never enter the account',()=>{
 const g=fresh();let pages=J(g,'mornayReport.pages(true)'),text=pages.flatMap(p=>p.lines).join(' ');
 assert.doesNotMatch(text,/notebook|survey marks|dream|hallucination|white room/i);
 g.run('window.gallery_clue_satchel=true');assert.match(g.run('mornayReport.pages(false).flatMap(p=>p.lines).join(" ")'),/Garrick’s kit/);
 g.run('window.gallery_clue_notebook=true;window.gallery_clue_survey=true');pages=J(g,'mornayReport.pages(false)');text=pages.flatMap(p=>p.lines).join(' ');
 assert.match(text,/notebook/);assert.match(text,/survey marks/);assert.ok(pages.filter(p=>/notebook|survey marks/.test(p.lines.join(' '))).every(p=>p.speakerId==='lely'));
 assert.equal(pages.some(p=>p.speakerId==='esla'),false);
});
test('save/load before and after delivery uses the one binding; old version-5 saves default false',()=>{
 const g=fresh();assert.equal(g.run('saveGame()'),true);g.run('var beforeReportSave=localStorage.getItem("verdantVale_save")');report(g);close(g);assert.equal(g.run('saveGame()'),true);
 g.run('var afterReportSave=localStorage.getItem("verdantVale_save");mq5_report_delivered=false');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('mq5_report_delivered'),true);
 assert.equal(g.run('SAVE_VERSION'),5);assert.equal(g.run('QUEST_FLAG_BINDINGS.filter(b=>b.key==="mq5_report_delivered").length'),1);
 g.run('localStorage.setItem("verdantVale_save",beforeReportSave)');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('mq5_report_delivered'),false);report(g);close(g);
 g.run('var old=JSON.parse(beforeReportSave);delete old.mq5_report_delivered;localStorage.setItem("verdantVale_save",JSON.stringify(old))');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('mq5_report_delivered'),false);
 for(const edit of ['d.mq5_report_delivered="yes"','d.MainQuest=4','d.gallery_body_found=false']){
  const before=preserved(g);g.run('var d=JSON.parse(afterReportSave);'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');assert.equal(g.run('loadGame()'),false,edit);assert.equal(preserved(g),before);assert.equal(g.run('mq5_report_delivered'),false);
 }
});
test('every collision-valid two-pixel approach can stage Esla without moving Lély',()=>{
 const g=fresh(),result=J(g,`(()=>{
  const npc=SIMPLE_NPCS.find(n=>n.id==='mornay_marit_voss'),failures=[];let tested=0;
  for(let y=npc.y-26;y<=npc.y+26;y+=2)for(let x=npc.x-26;x<=npc.x+26;x+=2){
   if(Math.hypot(x-npc.x,y-npc.y)>=TALK_RADIUS||!canWalk(x,y))continue;
   placeAtLocation('MORNAY_OFFICE_MAP',x,y);tested++;
   if(!mornayReport.interact(npc)||!mornayReport.companion()||player.x!==x||player.y!==y)failures.push([x,y]);
   mornayReport.reset();dialogue.open=false;dialogue.callbacks=null;
  }return {tested,failures};})()`);
 assert.ok(result.tested>0);assert.deepEqual(result.failures,[]);assert.equal(g.run('mq5_report_delivered'),false);
});
test('validation uses the lexical getter and rejects a missing authoritative value',()=>{
 const g=fresh();assert.equal(g.run('window.mq5_report_delivered'),undefined);
 assert.equal(g.run('validateGameData().errors'),0);
 g.run('var reportBinding=QUEST_FLAG_BINDINGS.find(b=>b.key==="mq5_report_delivered");reportBinding.get=()=>undefined');
 assert.equal(g.run('validateGameData().errorList.some(e=>e.message.includes("mq5_report_delivered")&&e.message.includes("getter returned undefined"))'),true);
});
test('checkpoint reset invalidates an interrupted audience callback',()=>{
 const g=fresh();report(g);g.run('var staleAudience=dialogue.callbacks[0];storyCheckpointLab.apply("mq5_mornay_report_ready");staleAudience()');assert.equal(g.run('mq5_report_delivered||mornayReport.isActive()'),false);
});
test('completed office followups remove report errands while retaining the existing Serpentsmoke tip',()=>{
 const g=fresh();report(g);close(g);
 const content=J(g,'MORNAY_NPCS.filter(n=>MORNAY_RESIDENTS.find(r=>r.id===n.id)?.reportText).map(n=>n.dialogue)');
 assert.doesNotMatch(JSON.stringify(content),/Fetch|bring Maura|before accepting|still needs|until.*certificate|incomplete/i);
 assert.match(JSON.stringify(content),/Henric.*Serpentsmoke/);
 for(const d of [4,5]){g.run('day='+d);assert.doesNotMatch(g.run('SIMPLE_NPCS.find(n=>n.id==="district_officer").dialogue.flatMap(p=>p.lines||p).join(" ")'),/report will arrive|Mornay gets the sealed report/);}
 g.run('supervisorDialogueBody()');assert.doesNotMatch(g.run('dialogue.pages.flat().join(" ")'),/should be on the road|give them the report/i);
});
module.exports={name:'MQ5 Mornay report: audience, presence, completion, persistence and isolation',run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Mornay report checks passed');}};
