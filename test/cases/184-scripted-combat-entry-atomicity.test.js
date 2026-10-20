'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const ring='fort_quest_stage=6;smugglers_dead=true;fort_report_filed=false;smugglers_execution_day=0;reservoir_quest_started=true;MainQuest=4;lighthouse_quest_stage=1;lighthouse_spider_resolved=false;';
const specs=[
 ['startSeepSplitCombat','0','enemy_the_seep','enterDungeon8West();'],
 ['startRainfishCombat','0','enemy_rainfish','sickle_quest_stage=1;rainfish_woken=true;'],
 ['startMireToadSpawnCombat','0','enemy_mire_toad_female','PICKUP_REGISTRY.pickup_map3n1_mire_toad_spawn.picked=false;'],
 ['startBossCombat','','enemy_wrongteeth','BOSS.defeated=false;BOSS.knockedDown=false;'],
 ['startWardenCombat','','enemy_briar_warden','warden_quest_started=true;warden_quest_defeated=false;'],
 ['startFortGuardCombat','','enemy_smuggler_guard','fort_quest_started=true;fort_quest_stage=1;'],
 ['startFortPolwickCombat','','enemy_polwick','fort_quest_started=true;fort_quest_stage=2;'],
 ['startFortEssaCombat','','enemy_essa','fort_quest_started=true;fort_quest_stage=3;'],
 ['startMulhollandCombat','','enemy_mulholland','MULHOLLAND.defeated=false;'],
 ['startDenWraithCombat','','enemy_den_wraith',"den_wraith_quest_started=true;den_wraith_defeated=false;currentHouseId='west_i';"],
 ['startSailorBrawlCombat','','enemy_kolm','stats.gold=100;sailor_brawl_fight_day=-1;'],
 ['startTakomoCombat','','enemy_takomo','TAKOMO.defeated=false;'],
 ['startMimicPotionCombat','','enemy_mimic_potion','PICKUP_REGISTRY.pickup_sunken_gallery_mimic.picked=false;'],
 ['startLenswebSpiderCombat','','enemy_lensweb_spider',ring],
 ['startTrappedDrownedCombat','','enemy_pale_drowned_gallery','window.sunken_gallery_drowned_freed=false;window.sunken_gallery_drowned_slain=false;'],
];
const PARTY_MIGRATED=new Set(['startRainfishCombat','startMireToadSpawnCombat','startBossCombat','startWardenCombat',
 'startMulhollandCombat','startDenWraithCombat','startSailorBrawlCombat','startTakomoCombat','startMimicPotionCombat',
 'startLenswebSpiderCombat','startTrappedDrownedCombat']);
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(){const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;Math=Object.create(Math);
 var entryRolls=0;Math.random=()=>{entryRolls++;return 0.5};saveGame();`);return g;}
// Observe canonical save inputs without calling saveGame (which normalizes flags
// and changes the menu). Also retain callback/collection identity separately.
function snapshot(g){return {json:g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),
 flags:Object.fromEntries(QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])),pickups:PICKUP_REGISTRY,chests:CHEST_REGISTRY,
 npcs:NPC_REGISTRY,boss:BOSS,mulholland:MULHOLLAND,takomo:TAKOMO,wraith:DEN_WRAITH,
 day,sailor_brawl_fight_day,defeatWakeAtHome,player,location:snapshotLocationState(),regional:regionalWorldPosition(),
 map:mapIdForRef(activeMap),combat,sequence:combatEnemyInstanceSequence,dialogue,choice,menu,worldToastTimer,
 canonical:canonicalPartyCombat.getView(),receiver:galleryReceiverEncounter.getView(),
 partyRuntime:combatPlayerState.getView(),save:localStorage.getItem('verdantVale_save')},
 (key,value)=>typeof value==='function'?value.toString():value)`),
 refs:[g.run('combat.enemies'),g.run('dialogue.callbacks'),g.run('choice.callbacks'),
 ...Array.from(g.run('dialogue.callbacks||[]')),...Array.from(g.run('choice.callbacks||[]'))]};}
function atomic(g,call,pattern=/unsupported scripted|Scripted combat entry|Prepared player party/){
 const before=snapshot(g),rolls=g.run('entryRolls');assert.throws(()=>g.run(call),pattern);
 const after=snapshot(g);assert.equal(after.json,before.json);assert.equal(after.refs.length,before.refs.length);
 after.refs.forEach((r,i)=>assert.equal(r,before.refs[i]));assert.equal(g.run('entryRolls'),rolls);
}
function win(g){g.run('stats.hp=stats.maxHp=2000;stats.atk=10000;stats.def=100;combat.cursor=0;');
 let n=0;while(g.run('combat.active && combat.phase!=="victory"')){assert.ok(n++<100);g.run('handleCombatAction()');}
 assert.equal(g.run('combat.phase'),'victory');g.run('handleCombatAction()');assert.equal(g.run('combat.active'),false);}
function drownedChoice(g){g.run("descendSunkenGallery();placeAtLocation('SUNKEN_GALLERY_R1C2',8.5*TILE,8.5*TILE);dialogue.open=false;interactSunkenGallery();handleInteract();handleInteract();choice.cursor=1;");assert.equal(g.run('choice.open'),true);}
function confirmChoice(g){g.press('Enter');}
function drain(g){let n=0;while(g.run('combat.active && combat.phase==="message"')){assert.ok(n++<100);g.run('handleCombatAction()');}}

for(const [name,args,id,setup] of specs){
 test(name+': recruited-party routing is either canonical or atomically guarded',()=>{const g=fresh();g.run(setup+'persistentParty.joinEsla({level:11});');
  if(PARTY_MIGRATED.has(name)){const before=g.run('entryRolls');g.run(name+'('+args+')');assert.equal(g.run('canonicalPartyCombat.isActive()'),true);
   assert.equal(g.run('combat.active'),false);assert.equal(g.run('canonicalPartyCombat.getView().enemies[0].id'),id);
   assert.equal(g.run('entryRolls')-before,name==='startMireToadSpawnCombat'?1:0);
  }else atomic(g,name+'('+args+')');
 });
 test(name+': original solo installation, real victory and one-time rewards',()=>{
  const g=fresh();g.run(setup);const before=g.run('entryRolls');g.run(name+'('+args+')');
  assert.equal(g.run('combat.active'),true);assert.equal(g.run('combat.enemy.id'),id);
  assert.equal(g.run('combatEnemyInstanceSequence'),1);assert.equal(g.run('entryRolls')-before,name==='startMireToadSpawnCombat'?1:0);
  g.run('var firstEnemy=combat.enemy;');win(g);const rewards=J(g,'[stats.xp,stats.gold,stats.items]');
  g.run('applyKillRewards(firstEnemy,[]);');assert.deepEqual(J(g,'[stats.xp,stats.gold,stats.items]'),rewards);
 });
 test(name+': legacy defeat and escape policy',()=>{
  const g=fresh();g.run(setup+name+'('+args+');');const beforeDay=g.run('day');
  g.run('defeatWakeAtHome=false;stats.hp=1;stats.atk=1;stats.def=0;combat.enemy.atk=10000;Math.random=()=>{entryRolls++;return 0.99};combat.cursor=0;handleCombatAction();');
  drain(g);assert.equal(g.run('combat.phase'),'defeat');g.run('handleCombatAction()');
  assert.equal(g.run('combat.active'),false);assert.equal(g.run('stats.hp===stats.maxHp'),true);
  assert.equal(g.run('stats.gold'),0);assert.equal(g.run('stats.xp'),0);assert.equal(g.run('day'),beforeDay+1);
  g.run('handleCombatAction()');assert.equal(g.run('day'),beforeDay+1,'repeated acknowledgement cannot recover twice');
  const h=fresh();h.run(setup+name+'('+args+');stats.hp=stats.maxHp=2000;stats.def=100;Math.random=()=>{entryRolls++;return 0};combat.cursor=3;handleCombatAction();');drain(h);
  const blocked=['startRainfishCombat','startMireToadSpawnCombat','startFortGuardCombat','startFortPolwickCombat','startFortEssaCombat','startLenswebSpiderCombat'].includes(name);
  assert.equal(h.run('combat.active'),blocked,name+' keeps its existing Run policy');assert.equal(h.run('stats.xp'),0);
  if(blocked)h.run('endCombat()');
 });
}
test('inventory covers all 15 dedicated scripted starters, plus the Sentry override separately',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../combat.js'),'utf8');
 const names=[...source.matchAll(/^function (start\w*Combat)\(/gm)].map(m=>m[1]).filter(n=>n!=='startCombat').sort();
 assert.deepEqual(names,specs.map(s=>s[0]).sort());
 const g=fresh();g.run("resetLocationState();placeAtLocation('MAP_N2',1.5*TILE,9.5*TILE);sentry_quest_started=true;sentry_quest_done=false;persistentParty.joinEsla({level:11});");
 g.run('startCombat()');assert.equal(g.run('canonicalPartyCombat.isActive()'),true);
 assert.equal(g.run('canonicalPartyCombat.getView().enemies[0].id'),'enemy_pale_sentry');
});
test('actual Drowned choice installs canonical combat without premature completion',()=>{
 const g=fresh();drownedChoice(g);g.run('persistentParty.joinEsla({level:11});');confirmChoice(g);
 assert.equal(g.run('canonicalPartyCombat.isActive()'),true);assert.equal(g.run('combat.active'),false);
 assert.equal(g.run('!!window.sunken_gallery_drowned_slain'),false);
});
test('Drowned victory is authenticated, remains one-time and survives saving; ordinary Drowned kills do not resolve the event',()=>{
 const g=fresh();drownedChoice(g);confirmChoice(g);assert.equal(g.run('!!window.sunken_gallery_drowned_slain'),false);
 g.run('combat.phase="victory";combat.pendingVictory=true;');atomic(g,'handleCombatAction()',/Invalid trapped Drowned victory/);
 g.run('combat.phase="choose";combat.pendingVictory=false;');win(g);
 assert.equal(g.run('window.sunken_gallery_drowned_slain'),true);const rewards=J(g,'[stats.xp,stats.gold,stats.items]');
 g.run('handleCombatAction();startTrappedDrownedCombat();');assert.equal(g.run('combat.active'),false);
 assert.deepEqual(J(g,'[stats.xp,stats.gold,stats.items]'),rewards);
 g.run('dialogue.open=false;interactSunkenGallery();');assert.match(g.run('dialogue.pages.flat().join(" ")'),/Churned silt/);
 g.run("dialogue.open=false;choice.open=false;resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);");
 assert.equal(g.run('saveGame()'),true);g.run('window.sunken_gallery_drowned_slain=false;');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('window.sunken_gallery_drowned_slain'),true);
 const h=fresh();h.run('combat.enemy={...SUNKEN_GALLERY_ENEMY_TEMPLATES[0]};combat.active=true;');win(h);assert.equal(h.run('!!window.sunken_gallery_drowned_slain'),false);
});
test('Drowned escape and real defeat leave the event retryable with fresh identities',()=>{
 for(const outcome of ['escape','defeat']){
  const g=fresh();drownedChoice(g);confirmChoice(g);const first=g.run('combat.enemy.instanceId');
  if(outcome==='escape')g.run('Math.random=()=>{entryRolls++;return 0};combat.cursor=3;handleCombatAction();');
  else g.run('defeatWakeAtHome=false;stats.hp=1;stats.atk=1;stats.def=0;combat.enemy.atk=10000;Math.random=()=>{entryRolls++;return 0.99};combat.cursor=0;handleCombatAction();');
  let n=0;while(g.run('combat.active')){assert.ok(n++<60);g.run('handleCombatAction()');}
  assert.equal(g.run('!!window.sunken_gallery_drowned_slain'),false);assert.equal(g.run('stats.xp'),0);
  g.run('dialogue.open=false;dialogue.callbacks=null;Math.random=()=>{entryRolls++;return 0.5};');drownedChoice(g);confirmChoice(g);
  assert.notEqual(g.run('combat.enemy.instanceId'),first);win(g);assert.equal(g.run('window.sunken_gallery_drowned_slain'),true);
 }
});
test('pre-recruitment-only queued entries still reject before dialogue mutation',()=>{
 const g=fresh();g.run('persistentParty.joinEsla({level:11});');
 const ids=['fort_guard','fort_polwick','fort_essa'];
 for(const id of ids){atomic(g,'queueDialogueEncounter('+JSON.stringify(id)+')');
  g.run('dialogue.open=true;dialogue.pages=[["test"]];dialogue.page=0;dialogue.triggerEncounterId='+JSON.stringify(id));
  atomic(g,'finishDialogue()');atomic(g,'handleInteract()');g.run('dialogue.triggerEncounterId=null;dialogue.open=false;');
 }
});
test('pre-recruitment fort callers reject before staging dialogue',()=>{
 const cases=[
  ['fort_quest_stage=1;player.x=6.5*TILE;player.y=9.5*TILE;','interactSmugglerFort()'],
  ['fort_quest_stage=2;player.x=7.5*TILE;player.y=4.5*TILE;','interactSmugglerFort()'],
  ['fort_quest_stage=3;player.x=9.5*TILE;player.y=6.5*TILE;','interactSmugglerFort()'],
 ];
 for(const [setup,call]of cases){const g=fresh();g.run(setup+'persistentParty.joinEsla({level:11});');atomic(g,call);}
});
test('fort arrest choice remains atomically guarded after recruitment',()=>{
 const g=fresh();g.run("enterSmugglerFort();player.x=7.5*TILE;player.y=4.5*TILE;interactSmugglerFort();handleInteract();handleInteract();handleInteract();");
 assert.equal(g.run('choice.open'),true);g.run('persistentParty.joinEsla({level:11});');atomic(g,'choice.callbacks[0]()');
 const before=snapshot(g);assert.throws(()=>confirmChoice(g),/unsupported scripted/);assert.equal(snapshot(g).json,before.json);
});
test('Rainfish movement installs canonical combat and commits wake state only after preparation',()=>{
 const g=fresh();g.run("resetLocationState();placeAtLocation('MAP3_N1',7.5*TILE,4.5*TILE);sickle_quest_stage=1;rainfish_woken=false;persistentParty.joinEsla({level:11});statusEffects=['cursed'];player.step=79;keys.ArrowLeft=true;");
 g.run('update(1/60)');assert.equal(g.run('canonicalPartyCombat.isActive()'),true);assert.equal(g.run('rainfish_woken'),true);
});
test('missing toad templates, reserved metadata, frozen combat fields, malformed chain and unknown dispatch reject without RNG/identities',()=>{
 for(const setup of ['combatEnemyInstanceSequence=Number.MAX_SAFE_INTEGER',"Object.defineProperty(combat,'message',{writable:false})",'RAINFISH_TEMPLATE.instanceId="forged"']){
  const g=fresh();g.run(setup);atomic(g,'startRainfishCombat(2)');
 }
 const g=fresh();atomic(g,'startRainfishCombat(-1)');
 const unknownBefore=snapshot(g);assert.equal(g.run('queueDialogueEncounter("forged")'),false);assert.equal(snapshot(g).json,unknownBefore.json);assert.equal(g.run('entryRolls'),0);
 g.run('delete ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male;');const before=snapshot(g);g.run('startMireToadSpawnCombat(2)');assert.equal(snapshot(g).json,before.json);assert.equal(g.run('entryRolls'),0);
});
test('Lensweb forged completion cannot grant a pending objective',()=>{
 const g=fresh();g.run(ring+'startLenswebSpiderCombat();');atomic(g,'finalizeLenswebSpiderEvent()',/Invalid Lensweb Spider finalization/);
});
test('queued activation commits the Kolm stake once and keeps its poor-player refusal',()=>{
 const g=fresh();g.run("stats.gold=100;NPC_ACTIONS.kolmBrawler({name:'Kolm'});handleInteract();");confirmChoice(g);
 assert.equal(g.run('stats.gold'),100,'no stake before activation');g.run('finishDialogue()');
 assert.equal(g.run('combat.isSailorBrawl'),true);assert.equal(g.run('stats.gold'),50);
 g.run('finishDialogue()');assert.equal(g.run('stats.gold'),50);win(g);assert.equal(g.run('stats.gold'),150);
 g.run('handleCombatAction()');assert.equal(g.run('stats.gold'),150);
 const h=fresh();h.run("NPC_ACTIONS.kolmBrawler({name:'Kolm'});handleInteract();");confirmChoice(h);
 assert.equal(h.run('combat.active'),false);assert.equal(h.run('stats.gold'),0);assert.equal(h.run('entryRolls'),0);
});
test('missing handlers reject before a choice closes or stages dialogue',()=>{
 const g=fresh();g.run("stats.gold=100;NPC_ACTIONS.kolmBrawler({name:'Kolm'});handleInteract();ENCOUNTER_HANDLERS.kolm_brawler=null;");
 atomic(g,'choice.callbacks[0]()');const before=snapshot(g);assert.throws(()=>confirmChoice(g),/missing encounter handler/);assert.equal(snapshot(g).json,before.json);
});
test('malformed pending callbacks reject before dialogue or choice consumption',()=>{
 const g=fresh();g.run('dialogue.open=true;dialogue.pages=[["test"]];dialogue.callbacks=[42];');
 atomic(g,'finishDialogue()');atomic(g,'handleInteract()');
 g.run('dialogue.open=false;choice.open=true;choice.options=["test"];choice.cursor=0;choice.callbacks=[42];');
 const before=snapshot(g);assert.throws(()=>confirmChoice(g),/invalid callback/);assert.equal(snapshot(g).json,before.json);
});
test('reward acknowledgement cannot replay awards while the defeated enemy is still installed',()=>{
 const g=fresh();g.run('startWardenCombat();stats.hp=stats.maxHp=2000;stats.atk=10000;combat.cursor=0;handleCombatAction();');drain(g);
 assert.equal(g.run('combat.phase'),'victory');const before=snapshot(g),rolls=g.run('entryRolls');
 g.run('applyKillRewards(combat.enemy,[]);');assert.equal(snapshot(g).json,before.json);assert.equal(g.run('entryRolls'),rolls);
});
test('sequential follow-ups validate before clearing the completed battle or staging the next one',()=>{
 for(const [start,broken] of [
  ['startRainfishCombat(1)','RAINFISH_TEMPLATE'],['startSeepSplitCombat(1)','ENEMY_TEMPLATE_REGISTRY.enemy_the_seep'],
  ['startMireToadSpawnCombat(1)','ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male'],
  ['startFortGuardCombat()','POLWICK_TEMPLATE'],['startFortPolwickCombat()','ESSA_TEMPLATE'],
 ]){
  const g=fresh();g.run(start+';stats.hp=stats.maxHp=2000;stats.atk=10000;stats.def=100;combat.cursor=0;handleCombatAction();');drain(g);
  assert.equal(g.run('combat.phase'),'victory');g.run(broken+'.instanceId="invalid";');atomic(g,'handleCombatAction()');
 }
});
test('reward resolution claims an exact enemy once and cannot retry after an unexpected RNG failure',()=>{
 const g=fresh();g.run('startWardenCombat();combat.enemy.hp=0;Math.random=()=>{entryRolls++;throw Error("injected reward failure")};');
 assert.throws(()=>g.run('applyKillRewards(combat.enemy,[])'),/injected reward failure/);const before=snapshot(g),rolls=g.run('entryRolls');
 assert.throws(()=>g.run('applyKillRewards(combat.enemy,[])'),/cannot be retried/);assert.equal(snapshot(g).json,before.json);assert.equal(g.run('entryRolls'),rolls);
});
module.exports={name:'Scripted combat entry: atomic preflight, authored callers and authenticated Drowned outcomes',checks,
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' scripted-entry checks passed');}};
