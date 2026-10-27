'use strict';
const assert=require('assert/strict');
const {fresh,place,dismiss,J}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const {ids,speak,start,evidence}=require('./330-two-jorans.test');
const snapshot=g=>g.run('JSON.stringify({stats,party:persistentParty.serialize(),location:snapshotLocationState(),player,day,MainQuest,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');
module.exports={name:'Two Jorans: atomic saves, old-save defaults, stale callbacks, sealed supplies and lossless dialogue',run(){
 const g=fresh();place(g,'MORNAY_OLD_FORT_MAP');walk(g,304,336,'locked cache');
 const initial=snapshot(g);g.press(' ');dismiss(g);assert.equal(snapshot(g),initial,'no early loot or quest activation');
 assert.equal(g.run('saveGame()'),true);
 g.run(`var oldJorans=JSON.parse(localStorage.getItem('verdantVale_save'));delete oldJorans.two_jorans_stage;delete oldJorans.two_jorans_evidence;localStorage.setItem('verdantVale_save',JSON.stringify(oldJorans));`);
 assert.equal(g.run('loadGame()'),true);assert.equal(g.run('two_jorans_stage'),0);assert.equal(g.run('two_jorans_evidence'),0);g.run('dialogue.open=false');
 start(g);speak(g,ids.beck);const stale=g.run('dialogue.callbacks[0]');
 place(g,'MORNAY_OLD_FORT_MAP');g.run('dialogue.callbacks=null');stale();assert.equal(g.run('two_jorans_evidence'),0,'leaving interview cannot complete it');
 evidence(g);speak(g,ids.officer);const release=g.run('dialogue.callbacks[0]');dismiss(g);release();assert.equal(g.run('two_jorans_stage'),2);
 assert.equal(g.run('saveGame()&&loadGame()'),true,'released awaiting thanks persists');g.run('dialogue.open=false');
 speak(g,ids.beck);const gift=g.run('dialogue.callbacks[0]');dismiss(g);gift();assert.equal(g.run("stats.items.filter(i=>i.name==='Joran’s Supply Key').length"),1,'duplicate callback cannot duplicate key');
 assert.equal(g.run('saveGame()'),true);g.run('var validJoransSave=localStorage.getItem("verdantVale_save")');
 for(const edit of ['d.two_jorans_stage=9','d.two_jorans_stage=2.5','d.two_jorans_evidence=16','d.two_jorans_evidence=3','d.two_jorans_stage=0',
  "d.stats.items=d.stats.items.filter(i=>i.name!=='Joran’s Supply Key')","d.stats.items.push(d.stats.items.find(i=>i.name==='Joran’s Supply Key'))"]){
  g.run('var d=JSON.parse(validJoransSave);'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');
  const before=snapshot(g),raw=g.run('localStorage.getItem("verdantVale_save")');assert.equal(g.run('loadGame()'),false,edit);assert.equal(snapshot(g),before,edit);assert.equal(g.run('localStorage.getItem("verdantVale_save")'),raw,'bad save retained');
 }
 g.run('localStorage.setItem("verdantVale_save",validJoransSave)');assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');
 walk(g,304,336,'unlocked cache');g.press(' ');dismiss(g);gift();release();stale();
 assert.equal(g.run('two_jorans_stage'),4);assert.equal(g.run("stats.items.filter(i=>i.name==='Sapper Charge').length"),5);
 // Charges remain ordinary consumables: spending them cannot make a valid
 // completed quest unsaveable or silently restock the cache on reload.
 g.run("stats.items=stats.items.filter(i=>i.name!=='Sapper Charge')");assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');g.press(' ');dismiss(g);
 assert.equal(g.run("stats.items.filter(i=>i.name==='Sapper Charge').length"),0);
 for(const pages of Object.values(J(g,'TWO_JORANS_CONTENT'))){for(const [speaker,line]of pages){
  assert.ok(g.run(`!!DIALOGUE_SPEAKER_DEFINITIONS[${JSON.stringify(speaker)}]`),speaker);
  const wrapped=g.run('paginateDialoguePages')([[line]],468,3,s=>s.length*8.4);
  assert.ok(wrapped.every(p=>p.length<=3&&p.every(s=>s.length*8.4<=468)));
  assert.equal(wrapped.flat().join(' ').replace(/\s+/g,' ').trim(),line.replace(/\s+/g,' ').trim(),'all words survive page fitting');
 }}
 // A recruited but temporarily absent Esla must not speak from the other inn.
 const a=fresh();a.run("storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();fort_quest_stage=6;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;syncQuestFlagsToWindow()");
 place(a,'MORNAY_GATE_INN_MAP');assert.equal(a.run('fineNeedlework.accept()'),true);a.run('dialogue.open=false');
 start(a);speak(a,ids.beck);assert.equal(J(a,'dialogue.pageSpeakers').includes('esla'),false);dismiss(a);
 assert.equal(a.run('fine_needlework_stage'),1);assert.equal(a.run('persistentParty.isAvailable("esla")'),false);
}};
