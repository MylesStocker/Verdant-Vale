'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,source)=>JSON.parse(g.run('JSON.stringify('+source+')'));
const expectedEquipment={weapon:'Dragon Blade',armor:'Shadow Cloak',shield:'Mithril Shield',accessory:'Fen Mask'};
const expectedInventory={'Potion':20,'Elixir':10,'Reed Remedy':10,'Amethyst Dust':10,'Bullet Time':5,
  'Throwing Knife':10,'Bomb':5,'Sapper Charge':5,'Henbane Sprig':5,'Jackbane Vial':5,'Trollbane':5};
function fresh(){const g=createContext();g.run('dialogue.open=false;dialogue.callbacks=null;Math=Object.create(Math);var checkpointRolls=0;Math.random=()=>{checkpointRolls++;throw Error("checkpoint used RNG")};');return g;}
function snapshot(g){return g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),
 flags:Object.fromEntries(QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])),location:snapshotLocationState(),map:mapIdForRef(activeMap),
 player,day,travellerPresent,pickups:collectedPickupIdsForSave(),chests:openedChestIdsForSave(),boss:[BOSS.defeated,BOSS.knockedDown,MULHOLLAND.defeated,TAKOMO.defeated,DEN_WRAITH.defeated],
 combat:{active:combat.active,mode:combat.mode,enemies:combat.enemies.length,party:combatPlayerState.hasParty(),canonical:canonicalPartyCombat.isActive()},
 ui:{dialogue:dialogue.open,choice:choice.open,menu:menu.open,debug:debugMenu.open,warp:warpMenu.open,fishing:fishing.active,cutscene:seraLioraCutscene.active},save:localStorage.getItem('verdantVale_save')})`);}
function apply(g){assert.equal(g.run('storyCheckpointLab.apply("mq5_assignment_ready")'),true);}
function inventory(g){return J(g,'Object.fromEntries(groupItems().map(g=>[g.name,g.count]))');}
function closeDialogue(g){g.run(`var guard=0;while(dialogue.open||mq5AssignmentCutscene.getView().phase==='walking'){
 if(guard++>600)throw Error('dialogue loop');if(dialogue.open)handleInteract();else update();
}`);}

test('debug menu discovers the world and scene checkpoints and Cancel mutates nothing',()=>{
 const g=fresh(),before=snapshot(g),calls=g.run('checkpointRolls'),seq=g.run('combatEnemyInstanceSequence');
 g.press('`');g.run('debugMenu.cursor=13');g.press('Enter');
 assert.equal(g.run('storyCheckpointLab.isOpen()'),true);assert.deepEqual(J(g,'storyCheckpointLab.list()'),[{id:'mq5_assignment_ready',label:'MQ5 — Assignment Ready'},{id:'mq5_campfire_ready',label:'MQ5 — Campfire Ready'},{id:'sera_liora_battle_ready',label:'Sera/Liora — Breakfast Battle'}]);
 g.press('Enter');assert.equal(g.run('storyCheckpointLab.getView().phase'),'confirm');g.press('ArrowRight');g.press('Enter');
 assert.equal(g.run('storyCheckpointLab.getView().phase'),'list');g.press('Escape');assert.equal(g.run('storyCheckpointLab.isOpen()'),false);
 g.run('debugMenu.open=false');assert.equal(snapshot(g),before);assert.equal(g.run('checkpointRolls'),calls);assert.equal(g.run('combatEnemyInstanceSequence'),seq);
});
test('confirmed Apply closes developer UI without touching storage or allocation authorities',()=>{
 const g=fresh();g.run(`localStorage.setItem('verdantVale_save','existing bytes')`);g.press('`');g.run('debugMenu.cursor=13');g.press('Enter');
 g.press('Enter');assert.equal(g.run('storyCheckpointLab.getView().phase'),'confirm');g.press('Enter');
 assert.equal(g.run('storyCheckpointLab.isOpen()'),false);assert.equal(g.run('debugMenu.open'),false);
 assert.equal(g.run('worldToast'),'DEV CHECKPOINT LOADED: MQ5 — ASSIGNMENT READY');
 assert.equal(g.run(`localStorage.getItem('verdantVale_save')`),'existing bytes');assert.equal(g.run('checkpointRolls'),0);
 assert.equal(g.run('combatEnemyInstanceSequence'),0);
});
test('application installs the exact deterministic MQ5 pre-assignment fixture',()=>{
 const g=fresh();apply(g);const stats=J(g,'stats'),party=J(g,'persistentParty.serialize()');
 assert.deepEqual([stats.level,stats.xp,stats.hp,stats.maxHp,stats.atk,stats.def,stats.spd,stats.gold],[10,25600,120,120,35,29,16,1000]);
 assert.deepEqual(Object.fromEntries(Object.keys(expectedEquipment).map(slot=>[slot,stats[slot].name])),expectedEquipment);
 assert.deepEqual(inventory(g),expectedInventory);assert.deepEqual(party,{order:['lely'],characters:[],rewards:[]});
 assert.deepEqual(J(g,'statusEffects'),[]);assert.equal(g.run('slitherSpd'),1);assert.equal(g.run('MainQuest'),4);
 assert.equal(g.run('mq5AssignmentReady()'),true);assert.equal(g.run('persistentParty.getMember("esla")'),null);
 assert.equal(g.run('SIMPLE_NPCS.find(n=>n.id==="causeway_ferry_operator").map'),null);
 assert.deepEqual(J(g,'[mapIdForRef(activeMap),player.x,player.y,player.facing,inTown,currentTownId,townBuilding]'),['OFFICE_MAP',384,104,'up',true,'calwick','office']);
 assert.deepEqual(J(g,'getActiveQuestNotes().map(n=>n.title)'),['Beyond Local Authority']);
});
test('all required story gates and mandatory receipts are complete while optional state is clean',()=>{
 const g=fresh();apply(g);const flags=J(g,'Object.fromEntries(QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]))');
 for(const key of ['sluice_job_started','sluice_fixed','sluice_reward_given','dispatch_quest_started','dispatch_delivered','dispatch_rewarded',
  'fort_quest_started','reservoir_quest_started','reservoir_report_filed','upper_reach_seen','basin_chamber_seen','sunken_gallery_seen',
  'basin_chamber_dream_done','gallery_body_found','gallery_deeper_stair_seen','gallery_receiver_defeated','sera_liora_opening_complete'])assert.equal(flags[key],true,key);
 assert.equal(flags.MainQuest,4);assert.equal(flags.fort_quest_stage,6);assert.equal(flags.mq4_available_day,6);assert.equal(flags.basin_chamber_exits,2);
 for(const key of ['sluice_pay_ticket_ready','equipment_ticket_ready','dispatch_pay_ticket_ready','fort_pay_ticket_ready','smugglers_dead','fort_report_filed',
  'warden_quest_started','sentry_quest_started','sickle_quest_stage','lighthouse_quest_stage'])assert.deepEqual(flags[key],J(g,'QUEST_FLAG_BINDINGS.find(b=>b.key==='+JSON.stringify(key)+').default'),key);
 const exact=J(g,`(()=>{const value=Object.fromEntries(QUEST_FLAG_BINDINGS.map(b=>[b.key,cloneDefaultValue(b.default)]));Object.assign(value,{
  sluice_job_started:true,sluice_fixed:true,sluice_pay_ticket_ready:false,sluice_reward_given:true,equipment_ticket_ready:false,MainQuest:4,
  dispatch_quest_started:true,dispatch_delivered:true,dispatch_pay_ticket_ready:false,dispatch_rewarded:true,
  fort_quest_started:true,fort_quest_stage:6,fort_pay_ticket_ready:false,fort_pay_ticket_reduced:false,
  smugglers_dead:false,smugglers_execution_day:0,fort_report_filed:false,mq4_available_day:6,
  reservoir_quest_started:true,reservoir_report_filed:true,upper_reach_seen:true,basin_chamber_seen:true,
  sunken_gallery_seen:true,basin_chamber_exits:2,basin_chamber_dream_done:true,gallery_body_found:true,
  gallery_deeper_stair_seen:true,gallery_receiver_defeated:true,sera_liora_opening_complete:true});return value})()`);
 assert.deepEqual(flags,exact);
 assert.deepEqual(J(g,'collectedPickupIdsForSave()'),[]);assert.deepEqual(J(g,'openedChestIdsForSave()'),[]);
});
test('preview, malformed validation and cancellation are atomic and allocate nothing',()=>{
 const g=fresh(),before=snapshot(g);g.run(`var bad=JSON.parse(JSON.stringify(STORY_CHECKPOINTS[0]));bad.inventory[0][0]='unknown item';
  var freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}return v};freeze(bad)`);
 assert.throws(()=>g.run('storyCheckpointLab.validateDefinition(bad)'),/Story checkpoint/);assert.equal(snapshot(g),before);
 assert.equal(g.run('checkpointRolls'),0);assert.equal(g.run('combatEnemyInstanceSequence'),0);
});
test('a contaminated runtime is replaced completely and repeated application is idempotent',()=>{
 const g=fresh();g.run(`persistentParty.joinEsla();dialogue.open=false;
  canonicalPartyCombat.enter({enemies:['enemy_marsh_wisp'],escape:'fastest_living'});
  statusEffects=['poison','cursed'];stats.hp=1;stats.gold=99999;stats.items=[createItem('Cat Armor')];
  dialogue.open=true;dialogue.pages=[['stale']];choice.open=true;menu.open=true;warpMenu.open=true;fishing.active=true;
  menu.notebookOffset=9;menu.notebookCursor=9;debugMenu.cursor=12;
  seraLioraCutscene.active=true;debugMode=true;forceLegacyRegionalView=true;keys.ArrowLeft=true;BOSS.defeated=true;
  PICKUP_REGISTRY[PICKUP_REGISTRY_IDS[0]].picked=true;CHEST_REGISTRY[CHEST_REGISTRY_IDS[0]].opened=true;`);
 apply(g);const once=snapshot(g);apply(g);assert.equal(snapshot(g),once);assert.equal(g.run('checkpointRolls'),0);
 assert.deepEqual(J(g,'[combat.active,combat.mode,combat.enemies.length,combatPlayerState.hasParty(),canonicalPartyCombat.isActive(),formationCombatLab.isOpen(),partyCombatLab.isActive(),galleryReceiverEncounter.isLocked()]'),[false,null,0,false,false,false,false,false]);
 assert.deepEqual(J(g,'[dialogue.open,choice.open,menu.open,debugMenu.open,warpMenu.open,fishing.active,seraLioraCutscene.active,keys.ArrowLeft]'),[false,false,false,false,false,false,false,false]);
 assert.deepEqual(J(g,'[menu.notebookOffset,menu.notebookCursor,debugMenu.cursor,warpMenu.targetCol,warpMenu.targetRow]'),[0,0,0,8,7]);
});
test('stored save bytes remain unchanged until deliberate Save, then version-5 load is ordinary',()=>{
 const g=fresh();g.run(`localStorage.setItem('verdantVale_save','opaque existing save bytes')`);apply(g);
 assert.equal(g.run(`localStorage.getItem('verdantVale_save')`),'opaque existing save bytes');assert.equal(g.run('SAVE_VERSION'),5);
 assert.equal(g.run('saveGame()'),true);const raw=g.run(`localStorage.getItem('verdantVale_save')`);assert.equal(JSON.parse(raw).version,5);
 g.run('stats.gold=7;MainQuest=0;');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('stats.gold'),1000);assert.equal(g.run('MainQuest'),4);
 assert.deepEqual(J(g,'persistentParty.serialize().order'),['lely']);
});
test('real Supervisor assignment preserves dialogue, recruits Esla once and activates ferry once',()=>{
 const g=fresh();apply(g);g.run('handleInteract()');assert.equal(g.run('dialogue.name'),'Supervisor');
 const text=g.run('[...MQ5_ASSIGNMENT_OPENING_PAGES,...MQ5_ASSIGNMENT_AFTER_WALK_PAGES].flatMap(page=>page.lines).join(" ")');
 assert.match(text,/I am going with her/);assert.match(text,/You know the Gallery\. I know the road/);assert.equal(g.run('choice.open'),false);
 closeDialogue(g);assert.equal(g.run('MainQuest'),5);let esla=J(g,'persistentParty.getMember("esla")');
 assert.deepEqual([esla.level,esla.xp,esla.hp,esla.maxHp,esla.atk,esla.def,esla.spd],[11,40000,80,80,16,7,11]);
 assert.deepEqual(esla.statuses,[]);assert.deepEqual(esla.equipment,expectedEquipment);
 assert.notEqual(g.run('SIMPLE_NPCS.find(n=>n.id==="causeway_ferry_operator").map'),null);
 const before=snapshot(g);assert.equal(g.run('completeMq5Assignment()'),false);g.run('supervisorDialogueBody()');closeDialogue(g);assert.equal(snapshot(g),before);
});
test('the checkpoint leaves debug warp, both Labs, field menu, save and combat authorities usable',()=>{
 const g=fresh();apply(g);g.run('debugMenu.open=true');assert.equal(g.run('formationCombatLab.open()'),true);assert.equal(g.run('formationCombatLab.closeMenu()'),true);
 assert.equal(g.run('partyCombatLab.openMenu()'),true);assert.equal(g.run('partyCombatLab.closeMenu()'),true);g.run('debugMenu.open=false');
 assert.equal(g.run('debugWarpToDestination("interior:calwick_office",8,7).success'),true);apply(g);g.run('supervisorDialogueBody()');closeDialogue(g);
 assert.equal(g.run('persistentParty.getView().members.length'),2);g.press('m');assert.equal(g.run('menu.open'),true);g.press('Escape');
 g.run('canonicalPartyCombat.enter({enemies:["enemy_marsh_wisp"],escape:"fastest_living"})');
 assert.equal(g.run('canonicalPartyCombat.getView().active'),true);assert.equal(g.run('canonicalPartyCombat.getView().party.length'),2);
});
test('fresh New Game remains unchanged and the Lab renderer is scale-independent',()=>{
 const g=fresh();assert.deepEqual(J(g,'[stats.level,stats.xp,stats.hp,stats.gold,persistentParty.serialize().order,MainQuest]'),[1,0,30,0,['lely'],0]);
 g.run(`debugMenu.open=true;debugMenu.cursor=13;storyCheckpointLab.open();var painted=[];ctx.fillText=(...args)=>painted.push(args);drawDebugMenu()`);
 assert.ok(J(g,'painted.map(x=>x[0])').some(text=>text.includes('MQ5 — Assignment Ready')));
 g.run('storyCheckpointLab.handleInput("confirm","Enter");painted=[];canvas.width=1024;canvas.height=960;drawDebugMenu()');
 assert.ok(J(g,'painted.map(x=>x[0])').some(text=>text.includes('Apply')));assert.ok(J(g,'painted.map(x=>x[0])').some(text=>text.includes('Cancel')));
});


test('Campfire Ready navigation wraps and cancellation preserves all runtime and stored data',()=>{
 const g=fresh(),before=snapshot(g);g.press('`');g.run('debugMenu.cursor=13');g.press('Enter');
 g.press('ArrowUp');assert.equal(g.run('storyCheckpointLab.getView().cursor'),2);
 g.press('ArrowDown');assert.equal(g.run('storyCheckpointLab.getView().cursor'),0);
 g.press('ArrowDown');g.press('Enter');g.press('ArrowRight');g.press('Enter');g.press('Escape');
 g.run('debugMenu.open=false');assert.equal(snapshot(g),before);assert.equal(g.run('checkpointRolls'),0);
 assert.equal(g.run('combatEnemyInstanceSequence'),0);
});
test('Campfire Ready installs the same generous party fixture after victory, without replaying rewards',()=>{
 const g=fresh();apply(g);g.run('completeMq5Assignment()');const expected=J(g,'persistentParty.serialize()'),expectedStats=J(g,'stats');
 g.run("localStorage.setItem('verdantVale_save','preserve me');storyCheckpointLab.apply('mq5_campfire_ready')");
 assert.deepEqual(J(g,'persistentParty.serialize()'),expected);assert.deepEqual(J(g,'stats'),expectedStats);
 assert.deepEqual(inventory(g),expectedInventory);
 assert.deepEqual(J(g,'[MainQuest,day,travellers_rise_ambush_complete,travellers_rise_ambush_paid,travellers_rise_ambush_payment,travellers_rise_camp_stage]'),[5,6,true,false,0,0]);
 assert.deepEqual(J(g,'[regionalActiveMapId(),player.x,player.y]'),['EASTERN_FENS_TRAVELLERS_RISE_MAP',336,240]);
 assert.deepEqual(J(g,'travellersRiseAmbushInvariantErrors()'),[]);assert.deepEqual(J(g,'regionalInvariantErrors()'),[]);
 assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');assert.equal(g.run('combat.active'),false);
 assert.equal(g.run("localStorage.getItem('verdantVale_save')"),'preserve me');assert.equal(g.run('combatEnemyInstanceSequence'),0);
 const once=snapshot(g);g.run("storyCheckpointLab.apply('mq5_campfire_ready')");assert.equal(snapshot(g),once);
 assert.equal(g.run('checkpointRolls'),0);
 assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
 assert.equal(g.run('travellers_rise_camp_stage'),0);assert.equal(g.run('stats.gold'),1000);
 g.frames(1);assert.equal(g.run('travellersRiseCamp.getView().phase'),'outside_dialogue');
 assert.equal(g.run('combatEnemyInstanceSequence'),0);
});
test('new checkpoint reaches the real campfire scene, rests once and saves normally',()=>{
 const g=fresh();g.press('`');g.run('debugMenu.cursor=13');g.press('Enter');g.press('ArrowDown');g.press('Enter');g.press('Enter');
 assert.equal(g.run('worldToast'),'DEV CHECKPOINT LOADED: MQ5 — CAMPFIRE READY');
 g.frames(1);g.run('finishDialogue()');g.frames(300);assert.equal(g.run('travellersRiseCamp.getView().phase'),'inside_dialogue');
 g.run('finishDialogue()');assert.equal(g.run('travellers_rise_camp_stage'),1);
 assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
 g.press('Enter');assert.equal(g.run('travellersRiseNight.isActive()'),true);
 for(let n=0;g.run('travellersRiseNight.isActive()');n++){
  assert.ok(n<2000);if(g.run('dialogue.open'))g.run('finishDialogue()');else g.frames(1);
 }
 assert.deepEqual(J(g,'[MainQuest,day,travellers_rise_camp_stage,stats.gold,stats.hp,persistentParty.getMember("esla").hp]'),[5,7,2,1000,120,80]);
 assert.equal(g.run('travellersRiseCamp.blocksEast()'),false);assert.equal(g.run('checkpointRolls'),0);
 assert.equal(g.run('combatEnemyInstanceSequence'),0);assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
 assert.deepEqual(J(g,'[travellers_rise_camp_stage,day]'),[2,7]);
 g.run("storyCheckpointLab.apply('mq5_campfire_ready')");assert.deepEqual(J(g,'[travellers_rise_camp_stage,day]'),[0,6]);
 assert.equal(g.run('travellersRiseNight.isActive()'),false);
});
test('contradictory post-ambush checkpoint data rejects without any mutation',()=>{
 const g=fresh(),before=snapshot(g);
 for(const mutation of ['bad.party="unknown"','bad.flags.MainQuest=4','bad.flags.travellers_rise_ambush_complete=false',
  'bad.flags.travellers_rise_ambush_paid=true','bad.flags.travellers_rise_ambush_payment=100',
  'bad.flags.travellers_rise_camp_stage=2','bad.location.x=0']){
  g.run(`var bad=JSON.parse(JSON.stringify(STORY_CHECKPOINTS[1]));${mutation};
   var freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}return v};freeze(bad)`);
  assert.throws(()=>g.run('storyCheckpointLab.validateDefinition(bad)'),/Story checkpoint/);assert.equal(snapshot(g),before);
 }
 assert.equal(g.run('checkpointRolls'),0);assert.equal(g.run('combatEnemyInstanceSequence'),0);
});

test('checkpoint authority does not call RNG or combat identity allocators',()=>{
 const source=require('fs').readFileSync(require('path').join(__dirname,'../../story-checkpoint-lab.js'),'utf8');
 assert.doesNotMatch(source,/Math\.random|createCombatEnemyInstance|combatPlayerState\.initialize|canonicalPartyCombat\.enter/);
});

module.exports={name:'Developer Story Checkpoint Lab: atomic MQ5 assignment-ready fixture',run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}console.log('  '+checks.length+' Story Checkpoint Lab checks passed');}};
