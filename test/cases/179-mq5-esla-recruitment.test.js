'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(){const g=createContext();g.run('dialogue.open=false;dialogue.callbacks=null;Math=Object.create(Math);Math.random=()=>{throw Error("unexpected recruitment RNG")};');return g;}
function ready(g){g.run(`fort_quest_stage=6;sluice_job_started=true;sluice_fixed=true;sluice_reward_given=true;
 dispatch_quest_started=true;dispatch_delivered=true;dispatch_rewarded=true;fort_quest_started=true;
 mq4_available_day=1;reservoir_quest_started=true;reservoir_report_filed=true;gallery_receiver_defeated=true;
 window.gallery_body_found=true;sera_liora_opening_complete=true;MainQuest=4;syncQuestFlagsToWindow();`);}
function assign(g){g.run('supervisorDialogueBody();finishDialogue()');assert.equal(g.run('MainQuest'),5);}
const state=g=>g.run('JSON.stringify({party:persistentParty.serialize(),stats,statusEffects,slitherSpd,MainQuest,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),player,day,tick,enemySequence:combatEnemyInstanceSequence})');
function seed(g,edit){g.run('dialogue.open=false;saveGame();var payload=JSON.parse(localStorage.getItem("verdantVale_save"));'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(payload))');assert.equal(g.run('loadGame()'),true);}
function paint(g){g.run('paint=[];drawMenu()');return J(g,'paint').filter(p=>p.type==='text').map(p=>p.args[0]);}
function extra(g,i){g.run('menu.itemCursor=groupItems().length+'+i);g.press('Enter');}

test('pre-MQ5 membership remains Lely-only, with Esla available as an NPC',()=>{
 const g=fresh();assert.deepEqual(J(g,'persistentParty.serialize().order'),['lely']);assert.equal(g.run('eslaAvailableAsNpc()'),true);
 ready(g);g.run('supervisorDialogueBody()');assert.equal(g.run('MainQuest'),4);assert.equal(g.run('persistentParty.getMember("esla")'),null);
 assert.equal(g.run('dialogue.callbacks[0]===completeMq5Assignment'),true);
});
test('every established prerequisite is revalidated before completion',()=>{
 for(const edit of ['fort_quest_stage=5','reservoir_quest_started=false','reservoir_report_filed=false','window.gallery_body_found=false','sera_liora_opening_complete=false']){
  const g=fresh();ready(g);g.run('supervisorDialogueBody();'+edit);const before=state(g);
  assert.equal(g.run('completeMq5Assignment()'),false);assert.equal(state(g),before,edit);
  assert.equal(g.run('persistentParty.getMember("esla")'),null);
 }
});
test('debug Sera/Liora preview is neutral; canonical completion enables, but does not itself recruit',()=>{
 const g=fresh();ready(g);g.run('sera_liora_opening_complete=false;syncQuestFlagsToWindow();startSeraLioraCutaway(false);endSeraLioraCutawayAtHospital();');
 assert.equal(g.run('sera_liora_opening_complete'),false);assert.equal(g.run('completeMq5Assignment()'),false);assert.equal(g.run('MainQuest'),4);
 g.run('dialogue.open=false;startSeraLioraCutaway(true);endSeraLioraCutawayAtHospital();');
 assert.equal(g.run('mq5AssignmentReady()'),true);assert.equal(g.run('persistentParty.getMember("esla")'),null);
 g.run('dialogue.open=false;');assign(g);
});
test('the assignment retains its setup and gives Esla explicit agency without a player choice',()=>{
 const g=fresh();ready(g);g.run('supervisorDialogueBody()');const text=g.run('dialogue.pages.flat().join(" ")');
 for(const re of [/Dreyfuss is dead/,/Garrick is still missing/,/beyond what Calwick or Drenwick/,/district seal/,/firsthand account/,/Empire has sent a cable ferry/,/six years/,/Cardenport is long/,/short of staff/,/Sending Lely alone would be irresponsible/,/I am going with her/,/You know the Gallery\. I know the road/,/Lely, you still carry the report/])assert.match(text,re);
 assert.doesNotMatch(text,/Rareborn|Resonance|romance|bodyguard/);assert.equal(g.run('choice.open'),false);
 assert.equal(g.run('dialogue.callbacks.length'),1);
});
test('the paginated Supervisor scene recruits only after its final confirmed page',()=>{
 const g=fresh();ready(g);g.run('interactSupervisor();drawDialogue()');let pages=0;
 while(g.run('dialogue.open')){
  assert.equal(g.run('persistentParty.getMember("esla")'),null);
  assert.equal(g.run('MainQuest'),4);assert.ok(pages++<80);
  g.press('Enter');if(g.run('dialogue.open'))g.run('drawDialogue()');
 }
 assert.ok(pages>=10);assert.equal(g.run('MainQuest'),5);
 assert.equal(g.run('persistentParty.getMember("esla").level'),11);
});
test('canonical completion recruits level 11 using authored progression, without shared-resource or Lely mutation',()=>{
 const g=fresh();ready(g);g.run('stats.level=3;stats.items=[createItem("Potion"),createItem("Iron Sword")];stats.gold=73');
 const before=J(g,'({stats,statusEffects,slitherSpd,player,day,tick,flags:QUEST_FLAG_BINDINGS.filter(b=>b.key!=="MainQuest").map(b=>b.get())})');assign(g);
 const after=J(g,'({stats,statusEffects,slitherSpd,player,day,tick,flags:QUEST_FLAG_BINDINGS.filter(b=>b.key!=="MainQuest").map(b=>b.get())})');
 assert.deepEqual(after,before);assert.deepEqual(J(g,'persistentParty.serialize().order'),['lely','esla']);
 const e=J(g,'persistentParty.getMember("esla")');assert.equal(e.slot,1);assert.equal(e.level,11);
 assert.deepEqual([e.hp,e.maxHp,e.atk,e.def,e.spd],[80,80,16,7,11]);assert.equal(e.xp,g.run('XP_THRESHOLDS[10]'));
 assert.deepEqual(e.statuses,[]);assert.deepEqual(e.equipment,{weapon:null,armor:null,shield:null,accessory:null});
 assert.equal(g.run('persistentParty.getMember("lely").slot'),0);assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('combatEnemyInstanceSequence'),0);
 g.run('combatPlayerState.initialize([{characterId:"fixture_a",slot:0,name:"A",hp:1,maxHp:1,atk:1,def:1,spd:1,statuses:[]},{characterId:"fixture_b",slot:1,name:"B",hp:1,maxHp:1,atk:1,def:1,spd:1,statuses:[]}])');
 assert.deepEqual(J(g,'combatPlayerState.getView().members.map(m=>m.instanceId)'),['combat_party_1','combat_party_2']);
});
test('repeat conversation and repeated completion cannot reset Esla or replay recruitment',()=>{
 const g=fresh();ready(g);assign(g);g.run('stats.items=[createItem("Iron Sword")];persistentParty.useFieldItem("esla","Iron Sword");persistentParty.awardExperience("recruitment-test",23)');
 seed(g,'payload.party.characters[0].hp=17;payload.party.characters[0].statuses=["cursed"]');const before=state(g);
 g.run('supervisorDialogueBody()');assert.equal(g.run('dialogue.callbacks'),null);assert.doesNotMatch(g.run('dialogue.pages.flat().join(" ")'),/I am going with her|I had meant to ask/);
 g.run('finishDialogue()');assert.equal(g.run('completeMq5Assignment()'),false);assert.equal(state(g),before);
});
test('an already populated roster is never reset when finishing the assignment',()=>{
 const g=fresh();ready(g);g.run('persistentParty.joinEsla();');seed(g,'payload.party.characters[0].hp=1;payload.party.characters[0].statuses=["poison"]');
 const member=g.run('JSON.stringify(persistentParty.getMember("esla"))');assign(g);assert.equal(g.run('JSON.stringify(persistentParty.getMember("esla"))'),member);
});
test('malformed preparation options and invalid canonical state fail atomically before MQ5 advances',()=>{
 const g=fresh();ready(g);
 for(const expr of ['persistentParty.joinEsla({level:0})','persistentParty.joinEsla({level:11,extra:1})','persistentParty.joinEsla({get level(){throw Error("getter executed")}})','persistentParty.joinEsla(Object.create({level:11}))','persistentParty.joinEsla({level:NaN})']){
  const b=state(g);assert.throws(()=>g.run(expr),/Invalid persistent/);assert.equal(state(g),b);
 }
 g.run('stats.hp=-1;supervisorDialogueBody()');const b=state(g);assert.throws(()=>g.run('finishDialogue()'),/Invalid persistent/);assert.equal(state(g),b);
 assert.equal(g.run('MainQuest'),4);assert.equal(g.run('persistentParty.getMember("esla")'),null);
});
test('conflicting detached combat preparation prevents both recruitment and advancement',()=>{
 const g=fresh();ready(g);g.run('combatPlayerState.initialize([{characterId:"fixture_a",slot:0,name:"A",hp:1,maxHp:1,atk:1,def:1,spd:1,statuses:[]},{characterId:"fixture_b",slot:1,name:"B",hp:1,maxHp:1,atk:1,def:1,spd:1,statuses:[]}])');
 const b=state(g);assert.throws(()=>g.run('completeMq5Assignment()'),/Invalid persistent/);assert.equal(state(g),b);
});
test('Calwick office and Dayoff NPC drawing, interactions and collision follow membership',()=>{
 for(const inn of [false,true]){
  const g=fresh();g.run(`inTown=true;currentTownId='calwick';townBuilding='${inn?'inn':'office'}';day=${inn?10:7};netto_letter_received=true;var pos=${inn?'ESLA_DAYOFF':'ESLA'};player.x=pos.x;player.y=pos.y;`);
  g.run('handleInteract()');assert.equal(g.run('dialogue.name'),'Esla');assert.equal(g.run('dialogue.open'),true);g.run('dialogue.open=false;dialogue.callbacks=null');
  // Isolate only the existing authored footprint from map floor/other props.
  assert.equal(g.run('canWalk(pos.x,pos.y)'),false);
  g.run('var figureCalls=0;drawEslaFigure=()=>figureCalls++;drawEslaSprite()');assert.equal(g.run('figureCalls'),1);
  ready(g);assign(g);g.run('dialogue.open=false;dialogue.name="";drawEslaSprite();handleInteract()');
  assert.equal(g.run('figureCalls'),1);assert.notEqual(g.run('dialogue.name'),'Esla');assert.equal(g.run('canWalk(pos.x,pos.y)'),true);
 }
});
test('the hospital follow-up projection also disappears without changing its pre-join dialogue',()=>{
 const g=fresh();assert.equal(g.run('SIMPLE_NPCS.find(n=>n.id==="infirmary_esla").map'),'drenwick_infirmary');
 const pages=g.run('JSON.stringify(SIMPLE_NPCS.find(n=>n.id==="infirmary_esla").dialogue)');ready(g);assign(g);
 assert.equal(g.run('SIMPLE_NPCS.find(n=>n.id==="infirmary_esla").map'),null);assert.equal(g.run('JSON.stringify(SIMPLE_NPCS.find(n=>n.id==="infirmary_esla").dialogue)'),pages);
});
test('journal and ferry authorization change at completion, with no new flag or key item',()=>{
 const g=fresh();ready(g);assert.equal(g.run('SIMPLE_NPCS.find(n=>n.id==="causeway_ferry_operator").map'),null);
 assign(g);assert.match(g.run('getActiveQuestNotes().find(n=>n.title==="Sealed Report").body'),/Lely and Esla.*ferry at the broken causeway.*Cardenport/);
 assert.notEqual(g.run('SIMPLE_NPCS.find(n=>n.id==="causeway_ferry_operator").map'),null);
 assert.equal(g.run('QUEST_FLAG_SCHEMA.some(k=>/esla.*join|recruit/i.test(k))'),false);
});
test('recruitment automatically replaces the unchanged solo menu with the canonical member menu',()=>{
 const g=fresh();record(g);g.run('menu.open=true;');assert.doesNotMatch(paint(g).join(' '),/Esla|Equipment|Status|CHARACTERS/);
 g.run('menu.open=false');ready(g);assign(g);g.press('m');const text=paint(g);assert.ok(text.includes('Esla'));assert.ok(text.includes('Lv. 11'));assert.ok(text.includes('Lély'));
 extra(g,2);g.press('ArrowDown');g.press('Enter');assert.equal(g.run('menu.screen'),'partyEquipment');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');
 g.press('b');g.press('b');extra(g,3);g.press('ArrowDown');g.press('Enter');assert.equal(g.run('menu.screen'),'partyStatus');assert.ok(paint(g).includes('Lv. 11'));
});
test('post-recruitment item targeting and equipment use the same persistent members',()=>{
 const g=fresh();ready(g);assign(g);g.run('stats.hp=1;stats.items=["Potion","Potion","Iron Sword"].map(createItem)');seed(g,'payload.party.characters[0].hp=1');g.press('m');
 g.press('Enter');g.press('ArrowDown');g.press('Enter');assert.equal(g.run('persistentParty.getMember("esla").hp'),21);assert.equal(g.run('stats.hp'),1);
 g.press('Enter');g.press('Enter');assert.equal(g.run('stats.hp'),21);assert.equal(g.run('persistentParty.getMember("esla").hp'),21);
 extra(g,2);g.press('ArrowDown');g.press('Enter');g.press('Enter');assert.equal(g.run('persistentParty.getMember("esla").equipment.weapon'),'Iron Sword');assert.equal(g.run('stats.weapon'),null);
});
test('save/load restores individual Esla state, roster, MQ5 and absent NPC projection',()=>{
 const g=fresh();ready(g);assign(g);g.run('stats.items=[createItem("Iron Shield")];persistentParty.useFieldItem("esla","Iron Shield")');
 seed(g,'payload.party.characters[0].hp=0;payload.party.characters[0].statuses=["cursed","slither"];payload.party.characters[0].slitherSpeed=9');
 const before=J(g,'persistentParty.getView()');g.run('saveGame();persistentParty.resetForNewGame();MainQuest=4;');assert.equal(g.run('eslaAvailableAsNpc()'),true);
 assert.equal(g.run('loadGame()'),true);assert.deepEqual(J(g,'persistentParty.getView()'),before);assert.equal(g.run('MainQuest'),5);assert.equal(g.run('eslaAvailableAsNpc()'),false);
 assert.equal(g.run('persistentParty.getMember("esla").level'),11);assert.equal(g.run('SAVE_VERSION'),5);
 assert.deepEqual(J(g,'persistentParty.fieldItemTargets("Potion")'),['lely']);
 assert.doesNotMatch(g.run('JSON.stringify(JSON.parse(localStorage.getItem("verdantVale_save")).party)'),/instanceId|playback|session|esla_joined/);
});
test('the sole canonical join caller is MQ5; there is no canonical party combat activation',()=>{
 const root=path.join(__dirname,'../..');
 for(const file of scriptOrderFromIndexHtml()){
  const src=fs.readFileSync(path.join(root,file),'utf8');assert.equal((src.match(/persistentParty\.joinEsla\s*\(/g)||[]).length,file==='quests.js'?1:0,file);
  assert.doesNotMatch(src,/persistentParty\.(beginCombat|commitCombat)\s*\(/,file);
 }
 const g=fresh();ready(g);assign(g);assert.equal(g.run('combatPlayerState.getView()'),null);assert.equal(g.run('partyCombatLab.isActive()'),false);
});
module.exports={name:'MQ5 canonical Esla recruitment: agency, atomic assignment, NPC membership, field menu and persistence',run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' MQ5 recruitment checks passed');}};
