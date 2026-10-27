'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {reachable}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const CARGO='Embroideries Parcel';
function place(g,where='chuggie'){
 if(where==='polwick')g.run('dialogue.open=false;choice.open=false;enterSmugglerFort()');
 else {const inn=where==='esla'?'commercial':'gate';assert.equal(g.run(`transitionToLocation({mapId:'MORNAY_${inn.toUpperCase()}_INN_MAP',x:240,y:432,facing:'up',state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_${inn}_inn'}})`),true);}
 g.run('dialogue.open=false;dialogue.callbacks=null;choice.open=false;');
}
function fresh(){const g=createContext();g.run(`storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();
 fort_quest_stage=6;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;syncQuestFlagsToWindow();`);place(g);return g;}
const state=g=>g.run('JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),location:snapshotLocationState(),player,day})');
const count=g=>g.run(`stats.items.filter(i=>i.name===${JSON.stringify(CARGO)}).length`);
function close(g){for(let i=0;i<100&&g.run('dialogue.open');i++)g.press(' ');assert.equal(g.run('dialogue.open'),false);}
function choose(g,index){close(g);assert.equal(g.run('choice.open'),true);g.run('choice.cursor='+index);g.press(' ');}
function accept(g){assert.equal(g.run('fineNeedlework.accept()'),true);assert.equal(g.run('fine_needlework_stage'),1);assert.equal(count(g),1);}
function chuggie(g){return g.run(`fineNeedlework.interactChuggie(SIMPLE_NPCS.find(n=>n.id==='mornay_chuggie'))`);}
function talkByWalking(g,id){
 const npc=J(g,`SIMPLE_NPCS.find(n=>n.id===${JSON.stringify(id)})`),radius=g.run('TALK_RADIUS');
 const point=reachable(g).find(([x,y])=>Math.hypot(x-npc.x,y-npc.y)<radius&&
  g.run(`SIMPLE_NPCS.find(n=>n.map===currentContentLocationKey()&&Math.hypot(${x}-n.x,${y}-n.y)<TALK_RADIUS)?.id`)===id);
 assert.ok(point,id+' has an unshadowed ordinary interaction approach');walk(g,...point,id+' approach');g.press(' ');assert.equal(g.run('dialogue.open'),true);
}

test('only the exact terminal alliance offers work; killed and reported outcomes dismiss Imperial agents',()=>{
 const outcomes=[
  ['unresolved',0,false,false,0],['guard',1,false,false,0],['polwick fight',2,false,false,0],['Essa fight',3,false,false,0],
  ['killed unreported',4,true,false,0],['spared unreported',5,false,false,0],['killed concealed',6,true,false,0],
  ['killed reported',6,true,true,0],['reported',6,false,true,50],['invalid execution',6,false,false,50],['allied',6,false,false,0],
 ];
 for(const [name,stage,dead,reported,execution]of outcomes){const g=fresh();g.run(`fort_quest_stage=${stage};smugglers_dead=${dead};fort_report_filed=${reported};smugglers_execution_day=${execution};syncQuestFlagsToWindow()`);
  const before=state(g);assert.equal(chuggie(g),true,name);const text=g.run('dialogue.pages.flat().join(" ")');
  if(name==='allied'){assert.match(text,/embroideries/i);assert.match(text,/1,500/);close(g);assert.deepEqual(J(g,'choice.options'),['Accept','Decline']);}
  else {close(g);assert.equal(g.run('choice.open'),false,name);if(name.startsWith('killed')||name==='reported')assert.match(text,/Imperial agents/i);}
  assert.equal(state(g),before,name+' conversation cannot mutate quest, cargo or party');
 }
});
test('warning precedes clear decline; only Esla pages use her green styling',()=>{
 const g=fresh(),before=state(g);assert.equal(chuggie(g),true);const text=g.run('dialogue.pages.flat().join(" ")');
 assert.match(text,/illegal|smuggl/i);assert.match(text,/Ledger House/);assert.ok(J(g,'dialogue.pageSpeakers').includes('esla'));
 const speakers=J(g,'dialogue.pageSpeakers');for(let i=0;i<speakers.length;i++){g.run('dialogue.page='+i);assert.equal(g.run('dialoguePagePresentation().styleId'),speakers[i]==='esla'?'esla_light_green':null);}
 g.run('dialogue.page=0');choose(g,1);assert.equal(state(g),before);assert.equal(count(g),0);assert.equal(g.run('persistentParty.isAvailable("esla")'),true);
});
test('ordinary controls stage both women, walk Esla out, refuse early reunion, return cargo and reunite once',()=>{
 const g=fresh();assert.equal(g.run('saveGame()'),true);talkByWalking(g,'mornay_chuggie');
 assert.equal(g.run('fineNeedlework.getView().phase'),'offer');assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
 g.run(`var needleworkPaint=[],originalNeedleworkNpcDraw=drawOneContentNPC,originalNeedleworkPlayerDraw=drawPlayer;
 drawOneContentNPC=function(n){needleworkPaint.push(n.id);return originalNeedleworkNpcDraw(n)};
 drawPlayer=function(){needleworkPaint.push('lely');return originalNeedleworkPlayerDraw()}`);g.renderFrame();
 assert.ok(J(g,'needleworkPaint').includes('lely'),'Lely is rendered during objection');assert.ok(J(g,'needleworkPaint').includes('fine_needlework_esla'),'Esla is rendered during objection');
 choose(g,0);assert.equal(g.run('fine_needlework_stage'),1);assert.equal(g.run('persistentParty.isAvailable("esla")'),false);assert.equal(count(g),1);
 assert.equal(g.run('FINE_NEEDLEWORK_NPCS[1].map'),g.run('mornayContentKey("MORNAY_GATE_INN_MAP")'),'departure remains visible until last accepted words');close(g);
 assert.equal(g.run('fineNeedlework.getView().phase'),'walking');const start=J(g,'fineNeedlework.getView().pose'),position=J(g,'[player.x,player.y]');
 g.press('m');assert.equal(g.run('menu.open'),false);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
 g.frames(1);assert.notDeepEqual(J(g,'fineNeedlework.getView().pose'),start,'real route advances the projection');
 let frames=0;while(g.run('fineNeedlework.getView().phase')!=='idle'){assert.ok(frames++<1000,'departure reaches authored exit');g.frames(1);}
 assert.deepEqual(J(g,'[player.x,player.y]'),position,'departure never relocates Lely');assert.equal(g.run('NPC_ROUTES.fine_needlework_esla'),undefined);
 assert.equal(g.run('FINE_NEEDLEWORK_NPCS[1].map'),g.run('mornayContentKey("MORNAY_COMMERCIAL_INN_MAP")'));assert.equal(g.run('saveGame()'),true);
 // Travel between these existing rooms uses validated fixture placement; every
 // approach inside them and every quest choice uses ordinary held/tapped input.
 place(g,'esla');talkByWalking(g,'fine_needlework_esla');assert.ok(J(g,'dialogue.pageSpeakers').every(s=>s==='esla'));assert.equal(g.run('dialoguePagePresentation().styleId'),'esla_light_green');close(g);
 assert.equal(g.run('fine_needlework_stage'),1);assert.equal(g.run('persistentParty.isAvailable("esla")'),false);
 place(g);talkByWalking(g,'mornay_chuggie');choose(g,0);close(g);assert.equal(g.run('fine_needlework_stage'),3);assert.equal(count(g),0);
 place(g,'esla');talkByWalking(g,'fine_needlework_esla');assert.match(g.run('dialogue.pages.flat().join(" ")'),/not going to ask|don’t tell me/);assert.equal(g.run('persistentParty.isAvailable("esla")'),false,'last words finish before reunion');close(g);
 assert.equal(g.run('fine_needlework_stage'),5);assert.equal(g.run('persistentParty.isAvailable("esla")'),true);assert.equal(g.run('FINE_NEEDLEWORK_NPCS[1].map'),null,'inn projection disappears when companion returns');assert.equal(g.run('saveGame()&&loadGame()'),true);
});
test('acceptance is atomic for Fallen Lely, wrong place, unavailable Esla, nonalliance, and duplicate cargo',()=>{
 for(const setup of ['stats.hp=0','MainQuest=4','fort_report_filed=true;smugglers_execution_day=day+5',
  'grantItem("Embroideries Parcel")','placeAtLocation("MAP",8.5*TILE,8.5*TILE)',
  'persistentParty.applyAvailabilityChange(persistentParty.prepareAvailabilityChange({characterId:"esla",available:false,reason:"fine_needlework",returnMapId:"MORNAY_COMMERCIAL_INN_MAP"}))']){
  const g=fresh();g.run(setup);const before=state(g);assert.equal(g.run('fineNeedlework.accept()'),false,setup);assert.equal(state(g),before,setup);
 }
 const g=fresh();accept(g);const before=state(g);assert.equal(g.run('fineNeedlework.accept()'),false);assert.equal(state(g),before);
});
test('one protected parcel is excluded from ordinary inventory, field targeting, equipment and battle items',()=>{
 const g=fresh();accept(g);assert.equal(g.run(`ITEM_REGISTRY[${JSON.stringify(CARGO)}].keyItem&&ITEM_REGISTRY[${JSON.stringify(CARGO)}].questItem`),true);
 assert.equal(g.run(`groupItems().some(i=>i.name===${JSON.stringify(CARGO)})`),false);
 assert.deepEqual(J(g,`persistentParty.fieldItemTargets(${JSON.stringify(CARGO)})`),[]);
 assert.equal(g.run(`persistentParty.combatSnapshot().inventory.includes(${JSON.stringify(CARGO)})`),false);
 const before=state(g);assert.throws(()=>g.run(`persistentParty.useFieldItem('lely',${JSON.stringify(CARGO)})`));assert.equal(state(g),before);
 assert.throws(()=>g.run(`persistentParty.previewEquipment('lely',${JSON.stringify(CARGO)})`));assert.equal(state(g),before);
});
test('carriage refuses reunion; withdrawal removes exactly one parcel, pays nothing and waits for reunion before reoffering',()=>{
 const g=fresh(),gold=g.run('stats.gold');accept(g);place(g,'esla');const carrying=state(g);assert.equal(g.run('fineNeedlework.reunite()'),false);assert.equal(state(g),carrying);
 place(g);assert.equal(g.run('fineNeedlework.returnParcel()'),true);assert.equal(count(g),0);assert.equal(g.run('fine_needlework_stage'),3);assert.equal(g.run('stats.gold'),gold);
 assert.equal(g.run('persistentParty.isAvailable("esla")'),false);const withdrawn=state(g);assert.equal(g.run('fineNeedlework.returnParcel()'),false);assert.equal(g.run('fineNeedlework.accept()'),false);assert.equal(state(g),withdrawn);
 place(g,'esla');assert.equal(g.run('fineNeedlework.reunite()'),true);assert.equal(g.run('fine_needlework_stage'),5);assert.equal(g.run('persistentParty.isAvailable("esla")'),true);
 const reunited=state(g);assert.equal(g.run('fineNeedlework.reunite()'),false);assert.equal(state(g),reunited);
 place(g);accept(g);assert.equal(g.run('stats.gold'),gold);assert.equal(count(g),1);
});
test('existing Polwick interaction delivers once for exactly 1500 gold before ambient companion/lighthouse offers',()=>{
 const g=fresh(),gold=g.run('stats.gold'),mq=g.run('MainQuest');accept(g);place(g,'polwick');
 g.run(`NPC_ACTIONS.polwickConfront(SIMPLE_NPCS.find(n=>n.id==='polwick'))`);
 assert.equal(g.run('fine_needlework_stage'),2);assert.equal(g.run('stats.gold'),gold+1500);assert.equal(count(g),0);
 assert.equal(g.run('persistentParty.isAvailable("esla")'),false);assert.equal(g.run('polwick_esla_visit_stage'),0);assert.equal(g.run('MainQuest'),mq);
 close(g);const before=state(g);assert.equal(g.run('fineNeedlework.deliver()'),false);assert.equal(state(g),before);
 assert.match(g.run('JSON.stringify(getActiveQuestNotes())'),/Ledger House/);
 place(g,'esla');assert.equal(g.run('fineNeedlework.reunite()'),true);assert.equal(g.run('fine_needlework_stage'),4);
 place(g);const done=state(g);assert.equal(g.run('fineNeedlework.accept()'),false);assert.equal(state(g),done);assert.equal(chuggie(g),true);close(g);assert.equal(g.run('choice.open'),false);assert.equal(g.run('stats.gold'),gold+1500);
});
test('an existing lighthouse reward retains turn-in priority without consuming the parcel or its payment',()=>{
 const g=fresh(),gold=g.run('stats.gold');accept(g);g.run('lighthouse_quest_stage=3;grantItem("Stashed Gem");syncQuestFlagsToWindow()');place(g,'polwick');
 g.run('NPC_ACTIONS.polwickConfront(SIMPLE_NPCS.find(n=>n.id==="polwick"))');assert.match(g.run('dialogue.pages.flat().join(" ")'),/Four hundred/);close(g);assert.equal(g.run('lighthouse_quest_stage'),4);assert.equal(g.run('fine_needlework_stage'),1);assert.equal(count(g),1);assert.equal(g.run('stats.gold'),gold+400);
 g.run('NPC_ACTIONS.polwickConfront(SIMPLE_NPCS.find(n=>n.id==="polwick"))');assert.equal(g.run('fine_needlework_stage'),2);assert.equal(count(g),0);assert.equal(g.run('stats.gold'),gold+1900);close(g);
 assert.equal(g.run('fineNeedlework.deliver()'),false);assert.equal(g.run('stats.gold'),gold+1900);
});
test('unavailable Polwick preserves recovery by returning cargo to Chuggie',()=>{
 const g=fresh();accept(g);g.run('smugglers_dead=true;syncQuestFlagsToWindow()');place(g,'polwick');const before=state(g);assert.equal(g.run('fineNeedlework.deliver()'),false);assert.equal(state(g),before);
 place(g);assert.equal(g.run('fineNeedlework.returnParcel()'),true);assert.equal(count(g),0);place(g,'esla');assert.equal(g.run('fineNeedlework.reunite()'),true);
});
test('delivery rejects overflow and duplicated cargo without removing any parcel or granting partial payment',()=>{
 for(const setup of ['stats.gold=Number.MAX_SAFE_INTEGER','grantItem("Embroideries Parcel")']){
  const g=fresh();accept(g);place(g,'polwick');g.run(setup);const before=state(g);assert.equal(g.run('fineNeedlework.deliver()'),false,setup);assert.equal(state(g),before,setup);
 }
});
test('valid lifecycle stages save/load with cargo and return location intact; malformed combinations fail before writers',()=>{
 for(const resolution of ['carrying','delivered','withdrawn']){
  const g=fresh();accept(g);if(resolution==='delivered'){place(g,'polwick');assert.equal(g.run('fineNeedlework.deliver()'),true);}if(resolution==='withdrawn')assert.equal(g.run('fineNeedlework.returnParcel()'),true);
  assert.equal(g.run('saveGame()'),true);const before=state(g);g.run('stats.gold+=7');assert.equal(g.run('loadGame()'),true);assert.equal(state(g),before,resolution);
  assert.equal(g.run('persistentParty.getAbsence("esla").returnMapId'),'MORNAY_COMMERCIAL_INN_MAP');
  if(resolution!=='carrying'){place(g,'esla');assert.equal(g.run('fineNeedlework.reunite()'),true);assert.equal(g.run('saveGame()'),true);const reunited=state(g);assert.equal(g.run('loadGame()'),true);assert.equal(state(g),reunited);}
 }
 const g=fresh();accept(g);assert.equal(g.run('saveGame()'),true);g.run('var validNeedleworkSave=localStorage.getItem("verdantVale_save")');
 for(const edit of ['d.fine_needlework_stage=0','d.fine_needlework_stage=2','d.stats.items=d.stats.items.filter(i=>i.name!=="Embroideries Parcel")',
  'd.stats.items.push(d.stats.items.find(i=>i.name==="Embroideries Parcel"))','delete d.party.absences','d.party.absences[0].returnMapId="OFFICE_MAP"','d.stats.hp=0']){
  g.run('var d=JSON.parse(validNeedleworkSave);'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');const before=state(g);assert.equal(g.run('loadGame()'),false,edit);assert.equal(state(g),before,edit);
 }
});
test('older version-5 saves default the optional quest and availability fields without changing recruitment',()=>{
 const g=fresh();assert.equal(g.run('saveGame()'),true);g.run(`var oldNeedleworkSave=JSON.parse(localStorage.getItem('verdantVale_save'));
 delete oldNeedleworkSave.fine_needlework_stage;delete oldNeedleworkSave.party.absences;
 localStorage.setItem('verdantVale_save',JSON.stringify(oldNeedleworkSave));`);
 const before=g.run('JSON.stringify(persistentParty.serialize().characters)');assert.equal(g.run('loadGame()'),true);
 assert.equal(g.run('fine_needlework_stage'),0);assert.equal(g.run('persistentParty.isAvailable("esla")'),true);assert.equal(g.run('JSON.stringify(persistentParty.serialize().characters)'),before);assert.equal(g.run('SAVE_VERSION'),5);
});
module.exports={name:'Fine Needlework: exact alliance, atomic cargo lifecycle, protected payment and save invariants',run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Fine Needlework checks passed');}};
