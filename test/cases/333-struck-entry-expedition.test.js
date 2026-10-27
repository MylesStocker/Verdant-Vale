'use strict';
const assert=require('assert/strict');
const {fresh,J,place:townPlace,dismiss,reachable}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const view=g=>J(g,'canonicalPartyCombat.getView()');
function local(g,id,x=240,y=400){assert.equal(g.run(`transitionToLocation({mapId:${JSON.stringify(id)},x:${x},y:${y},cooldown:true})`),true);g.run('dialogue.open=false;dialogue.callbacks=null;choice.open=false;');}
function speak(g,id){
 const n=J(g,`SIMPLE_NPCS.find(n=>n.id===${JSON.stringify(id)})`);
 const p=reachable(g).find(([x,y])=>Math.hypot(x-n.x,y-n.y)<28&&g.run(`SIMPLE_NPCS.find(n=>n.map===currentContentLocationKey()&&Math.hypot(n.x-${x},n.y-${y})<TALK_RADIUS)?.id`)===id);
 assert.ok(p,'reachable unshadowed '+id);walk(g,...p,id);g.press(' ');assert.equal(g.run('dialogue.open'),true,id);return J(g,'dialogue.pages').flat().join(' ');
}
function input(g,key){return g.run(`partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),10);canonicalPartyCombat.handleInput(${JSON.stringify(key)})`);}
function command(g,name){for(let i=0;view(g).selectedCommand!==name;i++){assert.ok(i<8);input(g,'right');}input(g,'confirm');if(view(g).phase==='targeting')input(g,'confirm');}
function fight(g,outcome='victory'){
 g.run('Math=Object.create(Math);Math.random=()=>0.5;');
 for(let rounds=0;view(g).active;rounds++){
  assert.ok(rounds<80,'fight resolves');
  while(view(g).phase==='awaiting_action')command(g,outcome==='escape'?'run':outcome==='defeat'?'observe':'attack');
  if(view(g).phase==='ready')input(g,'confirm');
  for(let i=0;view(g).phase==='playback';i++){assert.ok(i<160);input(g,'confirm');}
  if(view(g).phase==='playback_complete')input(g,'confirm');
  if(['victory','defeat','escape'].includes(view(g).phase)){assert.equal(view(g).phase,outcome);input(g,'confirm');}
  assert.notEqual(view(g).phase,'fault',JSON.stringify(view(g)));
 }
 dismiss(g);
}
function encounter(g,id){
 const b=J(g,`STRUCK_ENTRY_BATTLES[${id}]`);local(g,b.mapId,b.x*32,b.y*32+32);
 g.press(' ');assert.equal(g.run('dialogue.open'),true,'visible encounter responds to input');dismiss(g);
 assert.deepEqual(J(g,'choice.options'),['Clear the route','Withdraw']);g.press('Enter');assert.equal(view(g).active,true);
}
function victories(g,ids=[0,1,2,3]){for(const id of ids){encounter(g,id);fight(g);assert.ok(g.run(`struck_entry_wins & ${1<<id}`));assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');}}
function setup(party=false){const g=fresh();g.run('MainQuest=5;struck_entry_stage=1;corvin_favor_started=true;stats.maxHp=300;stats.hp=300;stats.atk=1000;stats.def=40;stats.spd=40;');if(party)g.run('persistentParty.joinEsla()');return g;}
function rescue(g){local(g,'THIRD_LOCK_SHELTER_MAP');speak(g,'struck_heddra');dismiss(g);assert.equal(g.run('struck_entry_stage'),2);speak(g,'struck_heddra');const stale=g.run('dialogue.callbacks[0]');dismiss(g);assert.equal(g.run('struck_entry_stage'),3);stale();return stale;}

test('Mornay direct lead and old-office lead work in either order, without an address flag or new prerequisites',()=>{
 for(const officeFirst of [false,true]){
  const g=fresh();g.run('corvin_favor_started=true;MainQuest=5;');
  const office=()=>{assert.ok(g.run("transitionToLocation({mapId:'DRENWICK_OFFICE_MAP',x:400,y:100,state:{inTown:true,currentTownId:'drenwick',townBuilding:'office'}})"));g.press(' ');assert.match(J(g,'dialogue.pages').flat().join(' '),/Heddra Dorr/);dismiss(g);};
  if(officeFirst)office();
  townPlace(g,'MORNAY_MIDDLE_LOWER_WEST_MAP');assert.match(speak(g,'struck_iswen'),/correct the score/);dismiss(g);
  assert.equal(g.run('struck_entry_stage'),1);assert.equal(g.run('corvin_favor_done'),false);
  if(!officeFirst)office();assert.equal(g.run('struck_entry_stage'),1);
 }
});
test('four authenticated victories, optional fight, rescue and delivery persist; no duplicate gifts or automatic filing',()=>{
 for(const party of [false,true]){
  const g=setup(party),before=J(g,'{gold:stats.gold,xp:stats.xp}');
  assert.throws(()=>g.run("scriptedPartyEncounters.finalize({}, {outcome:'victory',enemies:[]})"));
  victories(g);victories(g,[4]);assert.ok(g.run('stats.gold')>before.gold);assert.ok(g.run('stats.xp')>before.xp);
  local(g,'THIRD_LOCK_LANDING_MAP',272,112);g.press(' ');dismiss(g);
  assert.equal(g.run("stats.items.filter(i=>i.name==='Reinforced Travel Coat').length"),1);
  assert.equal(g.run("stats.items.filter(i=>i.name==='Elixir').length"),2);
  g.press(' ');dismiss(g);assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');g.press(' ');dismiss(g);
  assert.equal(g.run("stats.items.filter(i=>i.name==='Reinforced Travel Coat').length"),1);
  rescue(g);assert.equal(g.run("mapIdForRef(activeMap)"),'THIRD_LOCK_COTTAGES_MAP');
  assert.equal(g.run("SIMPLE_NPCS.filter(n=>n.id==='struck_heddra').length"),1);
  assert.equal(g.run("SIMPLE_NPCS.find(n=>n.id==='struck_heddra').map"),g.run("mornayContentKey('MORNAY_GATE_INN_MAP')"));
  assert.equal(g.run("SIMPLE_NPCS.find(n=>n.id==='struck_belric').map"),g.run("mornayContentKey('MORNAY_INFIRMARY_MAP')"));
  assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false;day=1;weight_quest_stage=2');
  assert.ok(g.run("transitionToLocation({mapId:'OFFICE_MAP',x:304,y:128,state:{inTown:true,currentTownId:'calwick',townBuilding:'office'}})"));g.press(' ');
  assert.match(J(g,'dialogue.pages').flat().join(' '),/did Heddra come back/);const done=g.run('dialogue.callbacks[0]');dismiss(g);done();
  assert.equal(g.run('corvin_favor_done'),true);assert.equal(g.run('struck_entry_stage'),4);
  assert.equal(g.run("stats.items.filter(i=>['Third Lock Towpath Tally','Carved Canal Boat'].includes(i.name)).length"),0);
  assert.equal(g.run('weight_note_signed'),false);assert.equal(g.run('cabinetCaseFlag'),false);assert.equal(g.run('weight_quest_stage'),2);
  g.press(' ');dismiss(g);assert.equal(g.run('weight_note_signed'),true);assert.equal(g.run('weight_quest_stage'),2);
  assert.equal(g.run('saveGame()&&loadGame()'),true);assert.equal(g.run('struckEntry.invariantErrors().length'),0);
 }
});
test('escape, defeat, retreat and retry leave all creatures uncleared and survivors available',()=>{
 for(const outcome of ['escape','defeat'])for(let id=0;id<5;id++){
  const g=setup(),prior=[0,1,3,7,1][id];g.run(`struck_entry_wins=${prior}`);if(outcome==='defeat')g.run('stats.hp=1;stats.def=0;stats.spd=1');
  encounter(g,id);fight(g,outcome);assert.equal(g.run('struck_entry_wins'),prior);assert.equal(g.run('struck_entry_stage'),1);
  assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false;stats.hp=300;stats.def=40;stats.spd=40');
  victories(g,[id]);assert.equal(g.run('struck_entry_wins'),prior|(1<<id));
 }
 const g=setup();local(g,'THIRD_LOCK_APPROACH_MAP',240,208);g.press(' ');dismiss(g);g.press('ArrowDown');g.press('Enter');
 assert.equal(view(g).active,false);assert.equal(g.run('struck_entry_wins'),0);
});
test('out-of-order exploration keeps victories and gifts until Corvin asks; prior completed saves remain completed',()=>{
 const g=setup();g.run('corvin_favor_started=false');victories(g);rescue(g);
 assert.ok(g.run("transitionToLocation({mapId:'OFFICE_MAP',x:304,y:128,state:{inTown:true,currentTownId:'calwick',townBuilding:'office'}})"));g.run('day=1');g.press(' ');dismiss(g);
 assert.equal(g.run('corvin_favor_done'),false);assert.equal(g.run('struck_entry_stage'),3);
 g.run('corvin_favor_started=true');g.press(' ');dismiss(g);assert.equal(g.run('corvin_favor_done'),true);
 const h=fresh();h.run('corvin_favor_done=true;weight_quest_stage=4;');assert.equal(h.run('saveGame()'),true);
 h.run("var old=JSON.parse(localStorage.getItem('verdantVale_save'));for(const k of Object.keys(old))if(k.startsWith('struck_entry_'))delete old[k];localStorage.setItem('verdantVale_save',JSON.stringify(old))");
 assert.equal(h.run('loadGame()'),true);assert.equal(h.run('corvin_favor_done'),true);assert.equal(h.run('weight_quest_stage'),4);assert.equal(h.run('struck_entry_stage'),0);
 h.run('struck_entry_stage=2;struck_entry_wins=15');local(h,'THIRD_LOCK_SHELTER_MAP');speak(h,'struck_heddra');dismiss(h);
 assert.equal(h.run('struck_entry_stage'),3);assert.equal(h.run('stats.items.filter(i=>i.name==="Carved Canal Boat"||i.name==="Third Lock Towpath Tally").length'),0);
 assert.match(h.run('struckEntry.note().body'),/no further delivery/);assert.equal(h.run('saveGame()&&loadGame()'),true);
});
test('absent Esla remains absent, unspoken and untouched through the expedition',()=>{
 const g=fresh();g.run("storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();fort_quest_stage=6;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;syncQuestFlagsToWindow()");
 townPlace(g,'MORNAY_GATE_INN_MAP');assert.equal(g.run('fineNeedlework.accept()'),true);dismiss(g);
 g.run('struck_entry_stage=1;corvin_favor_started=true;stats.maxHp=300;stats.hp=300;stats.atk=1000;stats.def=40;stats.spd=40;');
 const before=g.run('JSON.stringify(persistentParty.serialize().characters)');
 victories(g,[0,1]);local(g,'THIRD_LOCK_SHELTER_MAP');speak(g,'struck_heddra');assert.ok(!J(g,'dialogue.pageSpeakers').includes('esla'));dismiss(g);
 assert.equal(g.run('persistentParty.isAvailable("esla")'),false);
 assert.equal(g.run('JSON.stringify(persistentParty.serialize().characters)'),before,'absent member state/equipment unchanged');
});
test('both Polwick outcomes permit completion without changing the main route or Fine Needlework',()=>{
 for(const spared of [false,true]){
  const g=setup();g.run(`fort_quest_stage=6;smugglers_dead=${!spared};fort_report_filed=${!spared};smugglers_execution_day=0;`);
  const state=()=>g.run('JSON.stringify({MainQuest,fort_quest_stage,smugglers_dead,fort_report_filed,smugglers_execution_day,travel:travellers_rise_ambush_complete,party:persistentParty.serialize().characters})');
  const before=state();victories(g);rescue(g);
  assert.ok(g.run("transitionToLocation({mapId:'OFFICE_MAP',x:304,y:128,state:{inTown:true,currentTownId:'calwick',townBuilding:'office'}})"));
  g.run('day=1;weight_quest_stage=2');g.press(' ');dismiss(g);g.press(' ');dismiss(g);
  assert.equal(g.run('corvin_favor_done&&weight_note_signed'),true);assert.equal(state(),before);
 }
});
test('invalid stage/victory/item saves fail atomically and a cleared fight cannot be restarted',()=>{
 const g=setup();victories(g,[0]);local(g,'THIRD_LOCK_APPROACH_MAP',240,208);assert.equal(g.run("scriptedPartyEncounters.start('struck_entry',0)"),false);
 assert.equal(g.run('saveGame()'),true);const valid=g.run('localStorage.getItem("verdantVale_save")');
 for(const edit of ['d.struck_entry_stage=3','d.struck_entry_wins=8','d.struck_entry_wins=32','d.struck_entry_cache=true',"d.stats.items.push({name:'Carved Canal Boat',type:'accessory',bonus:0,price:0,questItem:true,keyItem:true})"]){
  g.run('var d='+valid+';'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');
  const before=g.run('JSON.stringify({stats,player,party:persistentParty.serialize(),stage:struck_entry_stage,wins:struck_entry_wins})');
  assert.equal(g.run('loadGame()'),false,edit);assert.equal(g.run('JSON.stringify({stats,player,party:persistentParty.serialize(),stage:struck_entry_stage,wins:struck_entry_wins})'),before);
 }
});
module.exports={name:'Struck Entry: authenticated expedition, rescue, delivery, discovery order, retries and save isolation',checks,setup,local,speak,encounter,fight,victories,rescue,
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Third Lock lifecycle scenarios passed');}};
