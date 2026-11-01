'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {J,dismiss,until}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const {fight,local}=require('./333-struck-entry-expedition.test');
const checks=[],test=(name,run)=>checks.push({name,run});
function fresh(solo=false){
 const g=createContext();g.run("storyCheckpointLab.apply('mq5_mornay_report_ready');mq5_report_delivered=true;worldToastTimer=0;");
 if(solo){g.run("transitionToLocation({mapId:'MORNAY_GATE_INN_MAP',x:240,y:432,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_gate_inn'}});fineNeedlework.accept()");dismiss(g);}
 office(g);return g;
}
function office(g){g.run("transitionToLocation({mapId:'MORNAY_OFFICE_MAP',x:144,y:144,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_office'}});dialogue.open=false;choice.open=false;");}
function talkVoss(g){walk(g,136,80,'Voss');g.press('Enter');assert.equal(g.run('dialogue.open'),true);}
function accept(g){talkVoss(g);dismiss(g);assert.equal(g.run('choice.open'),true);g.press('Enter');assert.deepEqual(J(g,'[MainQuest,greybank_stage]'),[6,2]);}
function search(g){local(g,'GREYBANK_TENT_MAP');walk(g,240,144,'tent table');g.press('Enter');assert.equal(g.run('greybank.phase()'),'intro');}
function unlock(g){search(g);dismiss(g);assert.equal(g.run('greybank_stage'),3);}
function vision(g){local(g,'GREYBANK_MAIN_MAP');const old=J(g,'{day,stats,statusEffects,slitherSpd,party:persistentParty.serialize(),step:player.step}');g.hold('ArrowUp');g.frames();g.release('ArrowUp');assert.equal(g.run('mapIdForRef(activeMap)'),'DREAM_MAP');
 const pos=J(g,'{x:_dreamReturn.x,y:_dreamReturn.y,facing:_dreamReturn.facing}');assert.deepEqual(J(g,'dialogue.pageSpeakers'),[null,null]);dismiss(g);assert.equal(g.run('mapIdForRef(activeMap)'),'GREYBANK_MAIN_MAP');assert.deepEqual(J(g,'{x:player.x,y:player.y,facing:player.facing}'),pos);assert.deepEqual(J(g,'{day,stats,statusEffects,slitherSpd,party:persistentParty.serialize(),step:player.step}'),old);}
function encounter(g,id){const b=J(g,`GREYBANK_BATTLES[${id}]`);local(g,b.mapId,b.x*32,b.y*32+32);g.press('Enter');assert.equal(g.run('dialogue.open'),true);dismiss(g);assert.equal(g.run('choice.open'),true);g.press('Enter');assert.equal(g.run('canonicalPartyCombat.getView().active'),true);}
function strong(g){g.run('stats.maxHp=300;stats.hp=300;stats.atk=1000;stats.def=40;stats.spd=40;');}
function winAll(g){strong(g);for(let i=0;i<4;i++){encounter(g,i);fight(g);assert.equal(g.run('greybank_wins'),(1<<(i+1))-1);assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');}}
function saved(g){assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');}

test('MQ5 prerequisite, explicit offer/decline/accept, held input and one-time 150g completion',()=>{
 const g=fresh();g.run('mq5_report_delivered=false');talkVoss(g);assert.equal(g.run('greybank_stage'),0);dismiss(g);assert.equal(g.run('mq5_report_delivered'),true);
 g.press('Enter');assert.equal(g.run('greybank_stage'),1);const page=g.run('dialogue.page');g.hold('Enter');g.frames(10);g.release('Enter');assert.ok(g.run('dialogue.page')<=page+1);dismiss(g);g.press('ArrowDown');g.press('Enter');assert.equal(g.run('MainQuest'),5);saved(g);assert.equal(g.run('greybank_stage'),1);
 accept(g);saved(g);unlock(g);vision(g);winAll(g);
 const gold=g.run('stats.gold');office(g);talkVoss(g);assert.match(J(g,'dialogue.pages').flat().join(' '),/quarter of the proceeds/);assert.match(J(g,'dialogue.pages').flat().join(' '),/unpaid wages/);
 const cb=g.run('dialogue.callbacks[0]');dismiss(g);cb();cb();assert.equal(g.run('stats.gold'),gold+150);assert.deepEqual(J(g,'[MainQuest,greybank_stage]'),[6,4]);saved(g);
 g.press('Enter');dismiss(g);assert.equal(g.run('stats.gold'),gold+150);assert.match(g.run('greybank.note().body'),/^Completed:/);assert.equal(g.run('greybank.invariantErrors().length'),0);
});
test('tent confrontation visibly has Brenna plus two supporters; no RNG, resources or recruitment; stale callbacks inert',()=>{
 for(const solo of [false,true]){
  const g=fresh(solo);accept(g);
  const before=g.run('JSON.stringify({stats,party:persistentParty.serialize(),day,MainQuest})');
  g.run('Math=Object.create(Math);Math.random=()=>{throw Error("no confrontation RNG")};');search(g);
  assert.deepEqual(J(g,"GREYBANK_NPCS.filter(n=>n.map==='greybank_tent').map(n=>n.id)"),['greybank_brenna','greybank_ovan','greybank_teri']);
  assert.equal(g.run('!!greybank.companion()'),!solo);assert.equal(g.run('dialogue.pageSpeakers.includes("esla")'),!solo);assert.equal(g.run('canonicalPartyCombat.getView().active'),false);
  assert.ok(J(g,'activityOwnership.combatPreparationConflicts(true)').includes('greybank_scene'));assert.ok(J(g,'activityOwnership.legacyExecutionConflicts()').includes('greybank_scene'));
  assert.equal(g.run('saveGame()||loadGame()||canSaveHere()'),false);const pos=J(g,'[player.x,player.y]');g.hold('ArrowDown');g.frames(12);g.release('ArrowDown');assert.deepEqual(J(g,'[player.x,player.y]'),pos);
  const cb=g.run('dialogue.callbacks[0]');dismiss(g);cb();assert.equal(g.run('greybank_stage'),3);assert.equal(g.run('JSON.stringify({stats,party:persistentParty.serialize(),day,MainQuest})'),before);
  g.press('Enter');assert.notEqual(g.run('greybank.phase()'),'intro');dismiss(g);saved(g);assert.equal(g.run('greybank_stage'),3);
  g.run("storyCheckpointLab.apply('mq5_mornay_report_ready')");cb();assert.equal(g.run('greybank_stage'),0);
 }
});
test('all reciprocal doors walk through real controls, save in every room, no alternate mill entry',()=>{
 for(const legacy of [false,true]){
  const g=fresh();accept(g);g.run(`forceLegacyRegionalView=${legacy}`);
  local(g,'GREYBANK_YARD_MAP',304,240);g.hold('ArrowUp');g.frames(18);g.release('ArrowUp');assert.equal(g.run('mapIdForRef(activeMap)'),'GREYBANK_YARD_MAP');assert.equal(g.run('greybank_stage'),2);
  unlock(g);vision(g);g.run('greybank_wins=15');
  for(const d of J(g,'GREYBANK_DOORS')){
   // Begin at the genuine reciprocal arrival, then walk to this exit.
   const reverse=J(g,`GREYBANK_DOORS.find(d=>d.source===${JSON.stringify(d.target)}&&d.target===${JSON.stringify(d.source)})`);
   local(g,d.source,reverse.x,reverse.y);saved(g);const target=[(d.col+.5)*32,(d.row+.5)*32];
   const candidates=[[target[0],target[1]+32,'ArrowUp'],[target[0],target[1]-32,'ArrowDown'],[target[0]+32,target[1],'ArrowLeft'],[target[0]-32,target[1],'ArrowRight']];
   const approach=candidates.find(([x,y])=>g.run(`canWalk(${x},${y})&&!TILE_PROPERTIES[tileAt(${x},${y})]?.isTransition`));assert.ok(approach,d.source);
   walk(g,approach[0],approach[1],d.source+' circulation');until(g,approach[2],()=>g.run('mapIdForRef(activeMap)')===d.target);
   assert.equal(g.run('canWalk(player.x,player.y)'),true);assert.deepEqual(J(g,'[player.x,player.y]'),[d.x,d.y]);saved(g);g.frames(10);assert.equal(g.run('mapIdForRef(activeMap)'),d.target);
  }
  assert.equal(g.run("GREYBANK_DOORS.filter(d=>!GREYBANK_CONTENT_KEYS[d.target]).length"),1);
 }
});
test('uncleared routes reject ordinary movement and out-of-order fights, while retreat stays open',()=>{
 const g=fresh();accept(g);unlock(g);vision(g);
 const attempts=[['GREYBANK_MAIN_MAP',400,112,'ArrowUp'],['GREYBANK_UPPER_MAP',112,112,'ArrowUp'],['GREYBANK_STORE_MAP',368,80,'ArrowRight']];
 for(let i=0;i<attempts.length;i++){
  const [map,x,y,key]=attempts[i];g.run(`greybank_wins=${[0,1,3][i]}`);local(g,map,x,y);
  g.hold(key);g.frames(18);g.release(key);assert.equal(g.run('mapIdForRef(activeMap)'),map,'victory gate stays closed');assert.equal(g.run('greybank_wins'),[0,1,3][i]);
 }
 local(g,'GREYBANK_WHEEL_MAP',240,240);assert.equal(g.run("scriptedPartyEncounters.start('greybank',3)"),false,'warping cannot forge missing preceding victories');
 office(g);talkVoss(g);dismiss(g);assert.equal(g.run('greybank_stage'),3,'premature report cannot pay');
});
test('mandatory vision restores exact scene, no resource/time changes, survives reload and retreat',()=>{
 const g=fresh();accept(g);unlock(g);g.run("addStatusEffect('poison')");vision(g);assert.equal(g.run('greybank_vision_seen'),true);saved(g);
 local(g,'GREYBANK_MAIN_MAP');g.hold('ArrowUp');g.frames(5);g.release('ArrowUp');assert.equal(g.run('dialogue.open'),false);assert.equal(g.run('greybank.tryVision()'),false);
});
test('canonical authenticated outcomes only: all encounters escape/defeat/retry; optional loot once',()=>{
 for(const outcome of ['escape','defeat'])for(let id=0;id<5;id++){
  const g=fresh(true);accept(g);unlock(g);vision(g);const prior=[0,1,3,7,7][id];g.run(`greybank_wins=${prior}`);strong(g);if(outcome==='defeat')g.run('stats.hp=1;stats.def=0;stats.spd=1');
  assert.throws(()=>g.run("scriptedPartyEncounters.finalize({}, {outcome:'victory',enemies:[]})"));encounter(g,id);fight(g,outcome);assert.equal(g.run('greybank_wins'),prior);saved(g);
  strong(g);encounter(g,id);fight(g);assert.equal(g.run('greybank_wins'),prior|(1<<id));assert.equal(g.run(`scriptedPartyEncounters.start('greybank',${id})`),false);
 }
 const g=fresh();accept(g);unlock(g);vision(g);winAll(g);encounter(g,4);fight(g);local(g,'GREYBANK_STORE_MAP',400,368);const before=g.run('stats.items.length');
 for(let i=0;i<3;i++){g.press('Enter');dismiss(g);saved(g);}assert.equal(g.run('stats.items.length'),before+4);assert.equal(g.run('greybank_cache_taken'),true);
});
test('real Fine Needlework absence remains intact through solo completion; Esla pages retain green',()=>{
 for(const solo of [false,true]){
  const g=fresh(solo),party=g.run('JSON.stringify(persistentParty.serialize().characters)');talkVoss(g);
  while(g.run('dialogue.open')){g.run('drawDialogue()');const p=J(g,'dialoguePagePresentation()');if(p.speakerId==='esla'){assert.equal(solo,false);assert.equal(p.styleId,'esla_light_green');}else assert.equal(p.styleId,null);g.press('Enter');}g.press('Enter');unlock(g);vision(g);winAll(g);office(g);talkVoss(g);assert.equal(g.run('dialogue.pageSpeakers.includes("esla")'),!solo);dismiss(g);
  if(solo){assert.equal(g.run('JSON.stringify(persistentParty.serialize().characters)'),party);assert.equal(g.run('fine_needlework_stage'),1);assert.equal(g.run('persistentParty.isAvailable("esla")'),false);}saved(g);
 }
});
test('invalid receipts fail atomically, old v5 saves default to unoffered, no new quest inventory',()=>{
 const g=fresh();saved(g);const raw=g.run('localStorage.getItem("verdantVale_save")');
 for(const patch of ['d.greybank_stage=2','d.greybank_wins=8','d.greybank_vision_seen=true','d.greybank_cache_taken=true','d.greybank_stage=4;d.MainQuest=6']){
  g.run('var d='+raw+';'+patch+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');const before=g.run('JSON.stringify({stats,player,greybank_stage,greybank_wins})');assert.equal(g.run('loadGame()'),false,patch);assert.equal(g.run('JSON.stringify({stats,player,greybank_stage,greybank_wins})'),before);
 }
 g.run('var d='+raw+';for(const k of Object.keys(d))if(k.startsWith("greybank_"))delete d[k];localStorage.setItem("verdantVale_save",JSON.stringify(d))');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('greybank_stage'),0);assert.equal(g.run('SAVE_VERSION'),5);
});
module.exports={name:'MQ6 Greybank: assignment, authenticated clearance, vision, absence, navigation and payment',checks,fresh,accept,unlock,vision,encounter,winAll,office,talkVoss,
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Greybank scenarios passed');}};
