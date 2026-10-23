'use strict';
const assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'travellersRiseCamp.getView()');
const persistent=g=>g.run(`JSON.stringify({party:persistentParty.serialize(),stats,statusEffects,slitherSpd,
  day,MainQuest,sequence:combatEnemyInstanceSequence,receipt:canonicalPartyCombat.getReceipt()})`);
function fresh(real=false){
 const g=createContext();g.run(`storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;
   Math=Object.create(Math);var campRolls=0;Math.random=()=>{campRolls++;throw Error('unexpected camp RNG')}`);
 if(real){g.run('supervisorDialogueBody();finishDialogue()');g.frames(300);g.run('finishDialogue()');}
 else g.run('completeMq5Assignment()');
 g.run("dialogue.open=false;placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',10.5*TILE,7.5*TILE)");
 return g;
}
function pending(g){g.run('travellers_rise_ambush_complete=true;syncQuestFlagsToWindow()');}
function intro(g){g.frames(1);assert.equal(view(g).phase,'outside_dialogue');g.run('finishDialogue()');}
function arrive(g){const trace=[];for(let i=0;view(g).phase!=='inside_dialogue';i++){
 assert.ok(i<400,JSON.stringify(view(g)));g.frames(1);trace.push(view(g));
 }return trace;}
function complete(g){intro(g);arrive(g);g.run('finishDialogue()');assert.equal(view(g).stage,1);}
const input=(g,command)=>g.run('partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),QUICKBLOOM_ANIMATION_FRAMES*MS_PER_FRAME/1000);canonicalPartyCombat.handleInput('+JSON.stringify(command)+')');
const battle=g=>J(g,'canonicalPartyCombat.getView()');
function startAmbush(g){
 g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',9.5*TILE,7.5*TILE)");g.frames(1);
 g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',10.5*TILE,7.5*TILE)");g.frames(1);g.run('finishDialogue()');
 for(let i=0;g.run("travellersRiseAmbush.getView().phase==='walking'");i++){assert.ok(i<400);g.frames(1);}
 g.run('finishDialogue();choice.open=false;choice.callbacks[0]()');assert.equal(g.run('canonicalPartyCombat.isActive()'),true);
}
function win(g){g.run('Math.random=()=>{campRolls++;return .5}');for(let i=0;battle(g).phase!=='victory';i++){
 assert.ok(i<1000);const v=battle(g);if(['awaiting_action','targeting','ready','playback','playback_complete'].includes(v.phase))input(g,'confirm');
 else throw Error('unexpected phase '+v.phase);
 }input(g,'confirm');}

test('one local 16x15 map, one-tile entrance, safe paired fixed placements and no regional or encounter changes',()=>{
 const g=fresh(),map=J(g,'TRAVELLERS_RISE_CAMP_MAP');assert.equal(map.length,15);assert.ok(map.every(r=>r.length===16));
 assert.equal(g.run("mapRefForId('TRAVELLERS_RISE_CAMP_MAP')===TRAVELLERS_RISE_CAMP_MAP"),true);
 assert.equal(g.run("isRegionalMapId('TRAVELLERS_RISE_CAMP_MAP')"),false);
 assert.deepEqual(view(g).entrance,{col:6,row:4});assert.deepEqual(view(g).exit,{col:7,row:12});
 for(const id of ['TRAVELLERS_RISE_CAMP_MAP','EASTERN_FENS_TRAVELLERS_RISE_MAP']){
  assert.equal(g.run(`MAP_METADATA.${id}.allowRandomEncounters`),false);
 }
 assert.equal(g.run('Object.keys(MAP_CATALOG).length'),407);
 assert.equal(g.run('Object.keys(REGIONAL_CHUNK_CATALOG).length'),244);
 assert.ok(map[0].every(t=>t===1)&&map[14].every(t=>t===1));assert.ok(map.every(row=>row[0]===1&&row[15]===1));
 const fixture=require('../fixtures/regional-grid-fingerprints');
 for(const [id,hash]of Object.entries(fixture.fingerprints))assert.equal(crypto.createHash('sha256').update(g.run(`JSON.stringify(mapRefForId('${id}'))`)).digest('hex'),hash);
});

test('pre-victory examination cannot enter, reveal, complete or bypass the ambush',()=>{
 const g=fresh();g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',6.5*TILE,5.5*TILE)");
 const before=persistent(g);assert.equal(g.run('enterTravellersRiseCamp()'),false);g.press('Enter');
 assert.match(g.run('JSON.stringify(dialogue.pages)'),/travellers have occupied/);assert.doesNotMatch(g.run('JSON.stringify(dialogue.pages)'),/Hollow/);
 assert.equal(view(g).stage,0);assert.equal(persistent(g),before);
 assert.equal(g.run("travellersRiseAmbush.blocksExit('EASTERN_FENS_TRAVELLERS_RISE_MAP','east')"),true);
});

test('debug preview, no MQ5 or missing membership cannot start an introduction',()=>{
 const g=fresh();pending(g);g.run('MainQuest=4');g.frames(1);assert.equal(view(g).active,false);
 g.run("storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;travellers_rise_ambush_complete=true;MainQuest=5;placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',10.5*TILE,7.5*TILE)");
 g.frames(1);assert.equal(view(g).active,false);assert.equal(g.run('enterTravellersRiseCamp()'),false);
});

test('real Supervisor, authenticated ambush victory, reward pages and level-up acknowledgements precede automatic entry',()=>{
 const g=fresh(true);g.run('stats.atk=10000;stats.xp=XP_THRESHOLDS[stats.level]-1');startAmbush(g);
 assert.equal(view(g).active,false);win(g);assert.equal(g.run('travellers_rise_ambush_complete'),true);
 assert.equal(view(g).active,false);assert.equal(g.run('dialogue.open'),true);assert.match(g.run('JSON.stringify(dialogue.pages)'),/level/i);
 const afterRewards=persistent(g);g.frames(10);assert.equal(view(g).active,false);assert.equal(persistent(g),afterRewards);
 while(g.run('dialogue.open'))g.press('Enter');
 // A held east key cannot sneak one movement between the last page and update.
 const position=J(g,'[player.x,player.y]');g.hold('ArrowRight');assert.equal(g.run('keys.ArrowRight'),false);g.frames(1);g.release('ArrowRight');
 assert.equal(view(g).phase,'outside_dialogue');assert.deepEqual(J(g,'[player.x,player.y]'),position);
 g.run('Math.random=()=>{throw Error("camp consumed RNG")};finishDialogue()');arrive(g);g.run('finishDialogue()');
 assert.equal(view(g).stage,1);assert.equal(persistent(g),afterRewards);assert.equal(g.run('canonicalPartyCombat.finish()'),false);
});

test('escape and defeat do not schedule the camp; payment and retries remain with the ambush owner',()=>{
 for(const outcome of ['escape','defeat']){
  const g=fresh();if(outcome==='defeat')g.run(`saveGame();var fallen=JSON.parse(localStorage.getItem('verdantVale_save'));
    fallen.stats.hp=1;fallen.party.characters[0].hp=0;localStorage.setItem('verdantVale_save',JSON.stringify(fallen));loadGame();dialogue.open=false`);startAmbush(g);
  if(outcome==='escape'){
   g.run('Math.random=()=>0');while(battle(g).phase==='awaiting_action'){
    for(let i=0;battle(g).selectedCommand!=='run';i++){assert.ok(i<8);input(g,'right');}input(g,'confirm');
   }input(g,'confirm');while(battle(g).phase==='playback')input(g,'confirm');if(battle(g).phase==='playback_complete')input(g,'confirm');
   assert.equal(battle(g).phase,'escape');input(g,'confirm');
  }else{
   g.run('Math.random=()=>.5');input(g,'confirm');input(g,'confirm');input(g,'confirm');
   while(battle(g).phase==='playback')input(g,'confirm');
   if(battle(g).phase==='playback_complete')input(g,'confirm');
   assert.equal(battle(g).phase,'defeat');input(g,'confirm');
  }
  assert.equal(view(g).stage,0);assert.equal(view(g).active,false);assert.equal(g.run('travellers_rise_ambush_complete'),false);
 }
});

test('both characters remain visible and walk legal successive cells with normal animation cadence',()=>{
 const g=fresh(),MQ5_HOME_X=g.run('ESLA.x');pending(g);intro(g);const before=persistent(g),trace=arrive(g);
 let previous={map:'EASTERN_FENS_TRAVELLERS_RISE_MAP',actors:[{x:336,y:240},{x:272,y:240}]},moving=0;
 for(const row of trace){
  assert.equal(row.actors.length,2);assert.ok(Object.isFrozen(g.run('travellersRiseCamp.getView()')));
  const map=row.phase==='rise_walk'?'EASTERN_FENS_TRAVELLERS_RISE_MAP':'TRAVELLERS_RISE_CAMP_MAP';
  for(let i=0;i<2;i++){
   const a=row.actors[i];assert.ok(a.y+10<320&&a.x>=16&&a.x<=496);
   assert.equal(g.run(`isTileWalkable(mapRefForId('${map}')[${Math.floor(a.y/32)}][${Math.floor(a.x/32)}])`),true);
   if(map===previous.map){const p=previous.actors[i],d=Math.abs(a.x-p.x)+Math.abs(a.y-p.y);assert.ok(d<=2);if(d)moving++;}
  }
  assert.ok(Math.abs(row.actors[0].x-row.actors[1].x)>=18||Math.abs(row.actors[0].y-row.actors[1].y)>=18,'actors never overlap');
  previous={map,actors:row.actors};
 }
 assert.ok(moving>150);assert.deepEqual(view(g).actors.map(a=>[a.x,a.y,a.facing]),[[208,176,'right'],[336,176,'left']]);
 assert.equal(g.run('ESLA.x'),MQ5_HOME_X);assert.equal(g.run('eslaAvailableAsNpc()'),false);
 assert.equal(persistent(g),before);assert.equal(g.run('campRolls'),0);
});

test('every cutscene phase blocks ordinary input, save/load, combat, menus and unrelated simulation',()=>{
 const g=fresh();pending(g);g.frames(1);
 for(const next of [null,'finishDialogue()','finishDialogue()']){
  if(next){if(view(g).phase==='rise_walk')arrive(g);else g.run(next);}
  const state=persistent(g),position=J(g,'[player.x,player.y]');
  for(const key of ['m','`','Escape','b','ArrowRight'])g.press(key);
  assert.deepEqual(J(g,'[menu.open,debugMenu.open]'),[false,false]);assert.deepEqual(J(g,'[player.x,player.y]'),position);
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);assert.equal(g.run('startCombat()'),false);
  assert.throws(()=>g.run("canonicalPartyCombat.enter([ENEMY_TEMPLATE_REGISTRY.enemy_marsh_rat])"));
  assert.equal(persistent(g),state);
 }
});

test('exact authored pages use canonical green/default metadata and rendering is read-only at both scales',()=>{
 const g=fresh();pending(g);g.frames(1);record(g);
 const before=persistent(g);let phases=0;
 for(const outside of [true,false]){
  if(!outside){g.run('finishDialogue()');arrive(g);}
  const authored=J(g,'travellersRiseCamp.dialogue.'+(outside?'outside':'inside'));
  assert.equal(authored.length,outside?3:11);
  for(let i=0;i<authored.length;i++){
   g.run('dialogue.page='+i);assert.equal(g.run('dialoguePagePresentation().speakerId'),authored[i].speakerId);
   assert.equal(g.run('dialoguePagePresentation().styleId'),authored[i].speakerId==='esla'?'esla_light_green':null);
  }
  for(const scale of [1,2]){
   g.run(`paint=[];ctx.save();ctx.scale(${scale},${scale});travellersRiseCamp.draw();drawPlayer();ctx.restore()`);
   const paint=J(g,'paint');assert.ok(paint.length>30);for(const c of paint.filter(p=>p.bounds)){
    assert.ok(c.bounds[0]>=0&&c.bounds[1]>=0&&c.bounds[2]<=512*scale&&c.bounds[3]<=480*scale);
   }
  }
  phases++;
 }
 assert.equal(phases,2);assert.equal(persistent(g),before);assert.equal(g.run('campRolls'),0);
 const lines=J(g,'travellersRiseCamp.dialogue.inside').map(p=>p.lines[0]);
 assert.ok(lines.includes('“Every hour we lose is another hour before Mornay sees the report.”'));
 assert.ok(lines.includes('“Fine. At first light, we move.”'));assert.equal(lines.at(-1),'“At first light.”');
});

test('completion changes only the one camp stage and journal; no rest, resources, time or extra reward',()=>{
 const g=fresh();pending(g);g.run("stats.hp=73;statusEffects.push('Poison');slitherSpd=1");
 const before=persistent(g);assert.equal(J(g,'getActiveQuestNotes()').find(n=>n.title==='Sealed Report').body,'Inspect the ambushers’ campsite at Travellers’ Rise.');
 intro(g);arrive(g);g.run('var staleCampCallback=dialogue.callbacks[0];finishDialogue();staleCampCallback()');
 assert.equal(view(g).stage,1);assert.equal(view(g).actors.length,0);assert.equal(persistent(g),before);assert.equal(g.run('MainQuest'),5);
 assert.equal(J(g,'getActiveQuestNotes()').find(n=>n.title==='Sealed Report').body,'Settle in with Esla at the Travellers’ Rise campfire.');
 assert.equal(g.run("Object.keys(NPC_ROUTES).some(id=>id.startsWith('camp_'))"),false);
});

test('manual exit and revisit use the same registered destination without replaying the argument',()=>{
 const g=fresh();pending(g);complete(g);const before=persistent(g);
 g.run("placeAtLocation('TRAVELLERS_RISE_CAMP_MAP',7.5*TILE,11.5*TILE)");g.press('Enter');
 assert.deepEqual(J(g,'[mapIdForRef(activeMap),player.x,player.y]'),['EASTERN_FENS_TRAVELLERS_RISE_MAP',208,176]);
 assert.equal(g.run('canWalk(player.x,player.y)'),true);g.press('Enter');
 assert.deepEqual(J(g,'[mapIdForRef(activeMap),player.x,player.y]'),['TRAVELLERS_RISE_CAMP_MAP',240,272]);g.frames(1);
 assert.equal(view(g).active,false);assert.equal(g.run('dialogue.open'),false);assert.equal(persistent(g),before);
});

test('save/load inside preserves stage and placement, rejects contradictions atomically and does not save poses',()=>{
 const g=fresh();pending(g);complete(g);assert.equal(g.run('saveGame()'),true);
 const bytes=g.run("localStorage.getItem('verdantVale_save')"),data=JSON.parse(bytes);
 assert.equal(data.version,5);assert.equal(data.travellers_rise_camp_stage,1);assert.equal(data.location.mapId,'TRAVELLERS_RISE_CAMP_MAP');
 assert.doesNotMatch(bytes,/camp_lely_pose|camp_esla_pose|rise_walk|inside_dialogue/);
 for(const patch of [{travellers_rise_camp_stage:-1},{travellers_rise_camp_stage:3},{travellers_rise_camp_stage:'1'},
   {travellers_rise_camp_stage:0},{travellers_rise_ambush_complete:false},{MainQuest:4}]){
  const changed={...data,...patch};g.run(`localStorage.setItem('verdantVale_save',${JSON.stringify(JSON.stringify(changed))});stats.gold=777`);
  const before=persistent(g);assert.equal(g.run('loadGame()'),false);assert.equal(persistent(g),before);
 }
 g.run(`localStorage.setItem('verdantVale_save',${JSON.stringify(bytes)})`);assert.equal(g.run('loadGame()'),true);
 assert.equal(view(g).stage,1);assert.equal(view(g).active,false);assert.equal(g.run('mapIdForRef(activeMap)'),'TRAVELLERS_RISE_CAMP_MAP');
});

test('saved victory before introduction resumes only when the world is ready',()=>{
 const g=fresh();pending(g);assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
 assert.equal(view(g).phase,'idle');g.run("openDialogue('',[['Reward acknowledgement fixture']])");g.frames(20);assert.equal(view(g).phase,'idle');
 g.run('finishDialogue()');g.frames(1);assert.equal(view(g).phase,'outside_dialogue');
});

test('checkpoint reset clears cutscene ownership, projected actors and camp defaults without changing the saved game',()=>{
 const g=fresh();pending(g);intro(g);g.frames(12);g.run("localStorage.setItem('verdantVale_save','keep existing save');storyCheckpointLab.apply('mq5_assignment_ready')");
 assert.equal(view(g).stage,0);assert.equal(view(g).phase,'idle');assert.equal(view(g).actors.length,0);
 assert.equal(g.run('travellers_rise_ambush_complete'),false);assert.equal(g.run('MainQuest'),4);assert.equal(g.run('persistentParty.getMember("esla")'),null);
 assert.equal(g.run("localStorage.getItem('verdantVale_save')"),'keep existing save');
});

test('invalid route rejects before presentation mutation and a runtime fault leaves diagnostics and usable recovery controls',()=>{
 const g=fresh();pending(g);const before=persistent(g),pos=J(g,'[player.x,player.y]');
 g.run('TRAVELLERS_RISE_CAMP_MAP[5][6]=1');assert.throws(()=>g.run('travellersRiseCamp.prepare()'),/blocked/);
 assert.equal(persistent(g),before);assert.deepEqual(J(g,'[player.x,player.y]'),pos);assert.equal(view(g).phase,'idle');
 g.run('TRAVELLERS_RISE_CAMP_MAP[5][6]=0');intro(g);g.run("delete NPC_ROUTES.camp_esla_pose");g.frames(1);
 assert.equal(view(g).phase,'fault');assert.match(view(g).failure.message,/disappeared/);assert.equal(view(g).stage,0);assert.equal(view(g).active,false);
 g.press('m');assert.equal(g.run('menu.open'),true);assert.equal(persistent(g),before);
});

test('the pending night blocks every east exit in both regional modes while local and westward movement remain available',()=>{
 const g=fresh();pending(g);complete(g);
 for(const legacy of [false,true])for(const row of [7,8,9]){
  g.run(`forceLegacyRegionalView=${legacy};dialogue.open=false;placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',15.5*TILE,${row+.5}*TILE)`);
  const pos=J(g,'regionalWorldPosition()');g.hold('ArrowRight');g.frames(8);g.release('ArrowRight');
  assert.deepEqual(J(g,'regionalWorldPosition()'),pos);assert.equal(g.run('dialoguePagePresentation().speakerId'),'esla');g.run('finishDialogue()');
  g.hold('ArrowLeft');g.frames(8);g.release('ArrowLeft');assert.ok(g.run('player.x')<15.5*32);
 }
 assert.equal(g.run("travellersRiseAmbush.blocksExit('EASTERN_FENS_TRAVELLERS_RISE_MAP','west')"),false);
 g.run('travellers_rise_camp_stage=2');assert.equal(g.run("travellersRiseAmbush.blocksExit('EASTERN_FENS_TRAVELLERS_RISE_MAP','east')"),false);
});

test('solo field rendering and NPC movement retain their default owners; campsite drawing is absent elsewhere',()=>{
 const g=createContext();record(g);g.run('paint=[];travellersRiseCamp.draw()');assert.deepEqual(J(g,'paint'),[]);
 assert.equal(g.run('travellersRiseCamp.blocksInput()'),false);assert.equal(g.run('travellersRiseCamp.blocksEast()'),false);
 const source=fs.readFileSync(require.resolve('../../travellers-rise-camp.js'),'utf8');assert.doesNotMatch(source,/Math\.random|stats\.[a-z]+\s*=|day\s*\+|MainQuest\s*=/);
});


test('fractional victory positions remain separated, stale callbacks cannot own a fresh introduction, and unrelated routes do not tick',()=>{
 const g=fresh();pending(g);
 g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',320.5,232.5);var foreignPose={id:'unrelated_camp_test',map:'eastern_fens_12',x:400,y:300,facing:'left'};startTransientNpcRoute(foreignPose,{type:'scriptedRoute',waypoints:[{x:11.5,y:9.375}],speed:2,pauseFrames:0,loop:false});");
 g.frames(1);const first=view(g);assert.ok(first.actors[0].x-first.actors[1].x>=18);
 g.run('var oldCampCallback=dialogue.callbacks[0];finishDialogue()');arrive(g);assert.deepEqual(J(g,'[foreignPose.x,foreignPose.y]'),[400,300]);
 g.run("storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',10.5*TILE,7.5*TILE);travellers_rise_ambush_complete=true");
 g.frames(1);g.run('oldCampCallback()');assert.equal(view(g).phase,'outside_dialogue');
});


test('visual repagination preserves every Esla speaker page and stale regional projections reject preparation',()=>{
 const g=fresh();pending(g);g.run('player.x+=1');assert.throws(()=>g.run('travellersRiseCamp.prepare()'));
 g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',10.5*TILE,7.5*TILE)");intro(g);arrive(g);record(g);
 const before=persistent(g);let green=0,ordinary=0,guard=0;
 while(g.run('dialogue.open')){
  assert.ok(guard++<40);g.run('paint=[];drawDialogue()');
  const presentation=J(g,'dialoguePagePresentation()'),paint=J(g,'paint').filter(p=>p.type==='text');
  assert.ok(paint.some(p=>p.style.fillStyle===(presentation.speakerId==='esla'?'#a8e89c':'#ccd8cc')));
  if(presentation.speakerId==='esla')green++;else ordinary++;
  g.press('Enter');
 }
 assert.ok(green>=6&&ordinary>=5);assert.equal(view(g).stage,1);assert.equal(persistent(g),before);assert.equal(g.run('campRolls'),0);
});

test('rest entrance is a separate one-tile feature, never the ambush trigger or onward choke',()=>{
 const g=fresh();assert.deepEqual(view(g).entrance,{col:6,row:4});
 assert.deepEqual(J(g,'travellersRiseAmbush.getView().trigger'),{col:10,row:7});
 assert.notDeepEqual(view(g).entrance,J(g,'travellersRiseAmbush.getView().trigger'));
 record(g);g.run('paint=[];travellersRiseCamp.draw()');
 for(const p of J(g,'paint').filter(p=>p.bounds)){
  assert.ok(p.bounds[0]>=192&&p.bounds[2]<=224&&p.bounds[1]>=128&&p.bounds[3]<=160,'entrance occupies exactly its own tile');
 }
 for(const pos of [[6.5,5.5],[6.5,4.5],[7.5,4.5]]){
  g.run(`placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',${pos[0]}*TILE,${pos[1]}*TILE)`);g.frames(1);
  assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');assert.equal(view(g).active,false);
  assert.equal(g.run('enterTravellersRiseCamp()'),false);
  assert.equal(g.run("travellersRiseAmbush.blocksExit('EASTERN_FENS_TRAVELLERS_RISE_MAP','east')"),true);
  assert.equal(g.run("travellersRiseAmbush.blocksExit('EASTERN_FENS_TRAVELLERS_RISE_MAP','west')"),false);
 }
 assert.equal(g.run('campRolls'),0);
});

test('two readable decorative log seats flank the unchanged fire and three bedrolls at both scales',()=>{
 const g=fresh();pending(g);complete(g);record(g);const before=persistent(g),map=J(g,'TRAVELLERS_RISE_CAMP_MAP');
 for(const scale of [1,2]){
  g.run(`paint=[];ctx.save();ctx.scale(${scale},${scale});travellersRiseCamp.draw();ctx.restore()`);
  const paint=J(g,'paint'),rect=(x,y,w,h,color)=>paint.some(p=>p.type==='fillRect'&&
   JSON.stringify(p.args)===JSON.stringify([x,y,w,h])&&p.style.fillStyle===color);
  for(const y of [122,214]){
   assert.ok(rect(244,y,48,13,'#493b2a'),'dark bark outline');
   assert.ok(rect(251,y+3,32,2,'#9b8056'),'lengthwise wood grain');
   assert.ok(rect(244,y+2,5,9,'#b4a079')&&rect(287,y+2,5,9,'#b4a079'),'two cut ends');
   assert.ok(y+13<160||y>189,'seats flank the fire without hiding it');
  }
  for(const [c,r]of [[4,3],[10,3],[11,9]])assert.ok(rect(c*32+2,r*32+4,25,17,'#625a44'),'bedroll retained');
  assert.ok(rect(265,171,15,10,'#342d25'),'cold fire ring retained');
  assert.equal(rect(269,174,4,3,'#b26d3d'),false,'night starts from cold ashes');
  for(const p of paint.filter(p=>p.bounds))assert.ok(p.bounds.every(Number.isInteger)&&
   p.bounds[0]>=0&&p.bounds[1]>=0&&p.bounds[2]<=512*scale&&p.bounds[3]<=480*scale);
 }
 assert.deepEqual(J(g,'TRAVELLERS_RISE_CAMP_MAP'),map);assert.equal(persistent(g),before);assert.equal(g.run('campRolls'),0);
});

test('camp has no encounter permission, enemy pool, NPC spawns or combat triggers on any walkable cell',()=>{
 const g=fresh();pending(g);complete(g);const before=persistent(g);
 assert.equal(g.run('MAP_CATALOG.TRAVELLERS_RISE_CAMP_MAP.allowRandomEncounters'),false);
 assert.equal(g.run('MAP_CATALOG.TRAVELLERS_RISE_CAMP_MAP.encounterPool'),null);
 assert.equal(g.run('currentLocationAllowsRandomEncounters()'),false);
 assert.deepEqual(J(g,"SIMPLE_NPCS.filter(n=>n.map==='travellers_rise_camp'||n.physicalMapId==='TRAVELLERS_RISE_CAMP_MAP')"),[]);
 assert.equal(g.run('currentMapFeatures()'),null);
 const map=J(g,'TRAVELLERS_RISE_CAMP_MAP');let checked=0;
 for(let row=0;row<15;row++)for(let col=0;col<16;col++){
  if(!g.run(`isTileWalkable(${map[row][col]})`))continue;
  g.run(`placeAtLocation('TRAVELLERS_RISE_CAMP_MAP',${col+.5}*TILE,${row+.5}*TILE);combat.cooldown=0;player.step=15;checkMapFeatureTriggers()`);
  g.hold('ArrowRight');g.frames(1);g.release('ArrowRight');checked++;
  assert.equal(g.run('combat.active||canonicalPartyCombat.isActive()'),false);
  assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');assert.equal(view(g).active,false);
  assert.equal(g.run('dialogue.open'),false);assert.equal(g.run('regionalActiveMapId()'),'TRAVELLERS_RISE_CAMP_MAP');
 }
 assert.ok(checked>100);assert.equal(persistent(g),before);assert.equal(g.run('campRolls'),0);
});

module.exports={name:'Travellers Rise campsite: automatic two-character introduction, saved pending night and mandatory stop',
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' campsite checks passed');}};
