'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function place(g,inn='gate'){assert.equal(g.run(`transitionToLocation({mapId:'MORNAY_${inn.toUpperCase()}_INN_MAP',x:240,y:432,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_${inn}_inn'}})`),true);g.run('dialogue.open=false;dialogue.callbacks=null;choice.open=false');}
function fresh(){const g=createContext();g.run(`storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();
 fort_quest_stage=6;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;syncQuestFlagsToWindow();`);place(g);
 assert.equal(g.run('saveGame()'),true);g.run(`var personalSave=JSON.parse(localStorage.getItem('verdantVale_save'));
 personalSave.party.characters[0].hp=17;personalSave.party.characters[0].xp+=37;
 personalSave.party.characters[0].statuses=['poison','slither','cursed'];personalSave.party.characters[0].slitherSpeed=13;
 personalSave.party.characters[0].equipment.shield='Iron Shield';localStorage.setItem('verdantVale_save',JSON.stringify(personalSave));`);
 assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');return g;}
const esla=g=>g.run('JSON.stringify(persistentParty.serialize().characters.find(m=>m.characterId==="esla"))');
const ids=(g,expression)=>J(g,expression+'.members.map(m=>m.characterId)');
function absent(g){assert.equal(g.run('fineNeedlework.accept()'),true);assert.equal(g.run('persistentParty.isAvailable("esla")'),false);}
const input=(g,key)=>g.run('partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),QUICKBLOOM_ANIMATION_FRAMES*MS_PER_FRAME/1000);canonicalPartyCombat.handleInput('+JSON.stringify(key)+')');
const combat=g=>J(g,'canonicalPartyCombat.getView()');
function command(g,name){let n=0;while(combat(g).selectedCommand!==name){assert.ok(n++<8,name+' enabled');input(g,'right');}input(g,'confirm');if(combat(g).phase==='targeting')input(g,'confirm');}
function round(g){input(g,'confirm');let n=0;while(combat(g).phase==='playback'){assert.ok(n++<300);input(g,'confirm');}if(combat(g).phase==='playback_complete')input(g,'confirm');}

test('temporary absence retains recruitment and exact character ownership; reunion never recruits or grants gear again',()=>{
 const g=fresh(),before=esla(g);absent(g);
 assert.equal(esla(g),before);assert.notEqual(g.run('persistentParty.getMember("esla")'),null);assert.equal(g.run('persistentParty.getActiveMember("esla")'),null);
 assert.deepEqual(ids(g,'persistentParty.getView()'),['lely']);assert.deepEqual(ids(g,'persistentParty.getFieldView()'),['lely']);assert.deepEqual(ids(g,'persistentParty.getRosterView()'),['lely','esla']);
 assert.deepEqual(J(g,'persistentParty.serialize().order'),['lely','esla']);
 assert.deepEqual(J(g,'persistentParty.getAbsence("esla")'),{characterId:'esla',reason:'fine_needlework',returnMapId:'MORNAY_COMMERCIAL_INN_MAP'});
 g.run('persistentParty.joinEsla({level:11})');assert.equal(esla(g),before);assert.equal(g.run('persistentParty.isAvailable("esla")'),false,'repeat recruitment cannot end absence');
 const inventory=J(g,'stats.items.map(i=>i.name).filter(n=>n!=="Embroideries Parcel")');
 assert.equal(g.run('fineNeedlework.returnParcel()'),true);place(g,'commercial');assert.equal(g.run('fineNeedlework.reunite()'),true);
 assert.equal(esla(g),before);assert.equal(g.run('persistentParty.getAbsence("esla")'),null);assert.deepEqual(ids(g,'persistentParty.getView()'),['lely','esla']);assert.deepEqual(J(g,'stats.items.map(i=>i.name)'),inventory);
 assert.equal(g.run('fineNeedlework.reunite()'),false);assert.equal(esla(g),before);
});
test('availability preparation is detached, stale receipts reject, and cannot remove the last living field member',()=>{
 const g=fresh(),before=esla(g);g.run(`var availabilityRequest={characterId:'esla',available:false,reason:'fine_needlework',returnMapId:'MORNAY_COMMERCIAL_INN_MAP'};
 var availabilityToken=persistentParty.prepareAvailabilityChange(availabilityRequest)`);
 assert.equal(g.run('persistentParty.isAvailable("esla")'),true);assert.equal(esla(g),before);
 g.run('persistentParty.treatMember("lely")');
 // The receipt authenticates all canonical values, including shared resources.
 g.run('stats.gold++');assert.throws(()=>g.run('persistentParty.validateAvailabilityChange(availabilityToken)'));assert.equal(g.run('persistentParty.isAvailable("esla")'),true);
 g.run('stats.hp=0');assert.throws(()=>g.run('persistentParty.prepareAvailabilityChange(availabilityRequest)'));assert.equal(esla(g),before);assert.equal(g.run('persistentParty.isAvailable("esla")'),true);
});
test('solo menu and field effects target only Lely; absent Esla cannot be treated or targeted',()=>{
 const g=fresh();absent(g);const before=esla(g);g.run('stats.items.push(createItem("Potion"));stats.hp=5');
 assert.deepEqual(J(g,'persistentParty.fieldItemTargets("Potion")'),['lely']);assert.throws(()=>g.run('persistentParty.useFieldItem("esla","Potion")'));assert.throws(()=>g.run('persistentParty.treatMember("esla")'));
 g.press('m');assert.equal(g.run('menu.open'),true);assert.deepEqual(ids(g,'partyFieldMenu.getView()'),['lely']);
 g.run('var menuPaint=[];ctx.fillText=function(t){menuPaint.push(String(t))};drawMenu()');assert.equal(J(g,'menuPaint').some(t=>t.includes('Esla')),false);
 g.press('Escape');g.run('statusEffects=["poison"];player.step=239;keys.ArrowLeft=true');g.frames(1);g.run('keys.ArrowLeft=false');assert.equal(esla(g),before);
 g.run('mornayTreatmentChoices(SIMPLE_NPCS.find(n=>n.service==="treatment"))');assert.equal(J(g,'choice.options').some(t=>t.includes('Esla')),false);g.run('choice.open=false');
});
test('ordinary and scripted encounters use canonical solo Lely; authenticated victory gives absent Esla no XP or participation changes',()=>{
 const g=fresh();absent(g);const before=esla(g);g.run('stats.atk=10000;stats.def=1000;Math=Object.create(Math);Math.random=()=>.5');
 g.run('canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp"],escape:"fastest_living"})');assert.deepEqual(combat(g).party.map(m=>m.characterId),['lely']);
 assert.equal(g.run('combatPlayerState.session.getView().inventory.includes("Embroideries Parcel")'),false);
 let n=0;while(combat(g).phase==='awaiting_action'){assert.ok(n++<12);command(g,'attack');round(g);}assert.equal(combat(g).phase,'victory');input(g,'confirm');assert.equal(combat(g).active,false);assert.equal(esla(g),before);
 const memberBefore=g.run('JSON.stringify(persistentParty.getMember("esla"))');
 g.run('dialogue.open=false;warden_quest_started=true;warden_quest_defeated=false;startWardenCombat()');assert.equal(g.run('canonicalPartyCombat.isActive()'),true);assert.deepEqual(combat(g).party.map(m=>m.characterId),['lely']);assert.equal(g.run('JSON.stringify(persistentParty.getMember("esla"))'),memberBefore);
});
test('paid rest and defeat recovery preserve exact absent record and return location',()=>{
 const g=fresh();absent(g);const before=esla(g);g.run('stats.gold=500;stats.hp=1;statusEffects=["poison","cursed"]');
 assert.equal(g.run('mornayRest("gate_inn")'),true);assert.equal(g.run('stats.hp===stats.maxHp'),true);assert.equal(esla(g),before);assert.equal(g.run('persistentParty.isAvailable("esla")'),false);
 g.run('dialogue.open=false;stats.hp=0;persistentParty.recover()');assert.equal(g.run('stats.hp===stats.maxHp'),true);assert.equal(esla(g),before);assert.equal(g.run('persistentParty.getAbsence("esla").returnMapId'),'MORNAY_COMMERCIAL_INN_MAP');
});
test('real solo defeat applies recovery once while Esla remains absent and unchanged',()=>{
 const g=fresh();absent(g);const before=esla(g);g.run('stats.hp=1;stats.def=0;stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;Math=Object.create(Math);Math.random=()=>.999999');
 g.run('canonicalPartyCombat.enter({enemies:["enemy_briar_hound"],escape:"fastest_living"})');let n=0;
 while(combat(g).phase==='awaiting_action'){assert.ok(n++<20);command(g,'run');round(g);}assert.equal(combat(g).phase,'defeat');const day=g.run('day');input(g,'confirm');
 assert.equal(combat(g).active,false);assert.equal(g.run('day'),day+1);assert.equal(g.run('stats.hp===stats.maxHp'),true);assert.equal(g.run('persistentParty.isAvailable("esla")'),false);assert.equal(esla(g),before);
 assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(g.run('day'),day+1);g.run('dialogue.open=false');assert.equal(g.run('saveGame()&&loadGame()'),true);assert.equal(esla(g),before);
});
test('solo ferry works both regional presentations, charging only return fare and suppressing absent speech',()=>{
 for(const legacy of [false,true]){const g=fresh();absent(g);const before=esla(g);g.run(`forceLegacyRegionalView=${legacy};stats.gold=27;placeAtLocation('EASTERN_BANK_MAP',5.5*TILE,8.5*TILE);interactCausewayFerry()`);
  assert.equal(J(g,'dialogue.pageSpeakers').includes('esla'),false);g.run('dialogue.open=false;dialogue.callbacks=null;choice.open=false');
  assert.equal(g.run('crossCausewayFerry()'),true);g.frames(g.run('WATER_TRAVEL_ROUTES.causeway_ferry.durationFrames'));assert.equal(g.run('regionalActiveMapId()'),'EAST_CAUSEWAY_MAP');assert.equal(g.run('stats.gold'),17);
  assert.equal(g.run('crossCausewayFerry()'),true);g.frames(g.run('WATER_TRAVEL_ROUTES.causeway_ferry.durationFrames'));assert.equal(g.run('regionalActiveMapId()'),'EASTERN_BANK_MAP');assert.equal(g.run('stats.gold'),17);assert.equal(esla(g),before);
 }
});
test('post-MQ5 Supervisor and Polwick exchanges do not supply absent Esla lines or consume reunion-independent progress',()=>{
 const g=fresh();absent(g);g.run('supervisorDialogueBody()');assert.equal(J(g,'(dialogue.pageSpeakers||[])').includes('esla'),false);
 g.run('dialogue.open=false;dialogue.callbacks=null;enterSmugglerFort()');assert.equal(g.run('polwickEslaDialogue(SIMPLE_NPCS.find(n=>n.id==="polwick"))'),false);assert.equal(g.run('polwick_esla_visit_stage'),0);
 assert.equal(g.run('MainQuest'),5);assert.notEqual(g.run('persistentParty.getMember("esla")'),null);
});
module.exports={name:'Temporary party availability: durable ownership, active-only effects, solo combat/ferry and recovery',run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' temporary-availability checks passed');}};
