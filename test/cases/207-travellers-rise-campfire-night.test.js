'use strict';
const assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'travellersRiseNight.getView()');
const resources=g=>g.run('JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),day,MainQuest,ids:combatEnemyInstanceSequence,stage:travellers_rise_camp_stage})');
function fresh(){const g=createContext();g.run(`storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;
 completeMq5Assignment();dialogue.open=false;travellers_rise_ambush_complete=true;
 transitionToLocation({mapId:'EASTERN_FENS_TRAVELLERS_RISE_MAP',x:10.5*TILE,y:7.5*TILE});
 Math=Object.create(Math);var nightRolls=0;Math.random=()=>{nightRolls++;throw Error('night RNG')}`);
 g.frames(1);g.run('finishDialogue()');g.frames(300);assert.equal(g.run('travellersRiseCamp.getView().phase'),'inside_dialogue');g.run('finishDialogue()');
 assert.equal(view(g).stage,1);return g;}
function begin(g){g.press('Enter');assert.equal(view(g).phase,'gather');}
function reach(g,phase){for(let i=0;view(g).phase!==phase;i++){
 assert.ok(i<1800,JSON.stringify(view(g)));assert.notEqual(view(g).phase,'fault',JSON.stringify(view(g).failure));
 if(g.run('dialogue.open'))g.run('finishDialogue()');else g.frames(1);
 }}
function done(g){reach(g,'idle');assert.equal(view(g).stage,2);}
function assertNoOwners(g){assert.equal(g.run('Object.keys(NPC_ROUTES).some(id=>id.startsWith("camp_night_"))'),false);assert.equal(view(g).actors.length,0);}

test('stage/map/real membership/modal prerequisites reject atomically with no RNG or identities',()=>{
 for(const mutation of ['MainQuest=4','travellers_rise_camp_stage=0','travellers_rise_camp_stage=2','travellers_rise_ambush_complete=false',
  'menu.open=true','dialogue.open=true','choice.open=true','shop.open=true','debugMenu.open=true','warpMenu.open=true','fishing.active=true',
  'persistentParty.resetForNewGame()','debugMenu.open=true;storyCheckpointLab.open();debugMenu.open=false',"transitionToLocation({mapId:'EASTERN_FENS_TRAVELLERS_RISE_MAP',x:208,y:176})",'day=Number.MAX_SAFE_INTEGER','day=0','stats.hp=NaN',
  'statusEffects=["unknown"]','stats.weapon={name:"Unknown"}','inTown=true']){
  const g=fresh();g.run(mutation);const before=resources(g),v=view(g),position=J(g,'[player.x,player.y]');
  assert.equal(g.run('travellersRiseNight.begin()'),false,mutation);assert.equal(resources(g),before);assert.deepEqual(view(g),v);assert.deepEqual(J(g,'[player.x,player.y]'),position);assert.equal(g.run('nightRolls'),0);
 }
});

test('fire entry is deliberate; camp remains enemy-free and distinct from the ambush choke',()=>{
 const g=fresh();assert.deepEqual(J(g,'travellersRiseCamp.getView().entrance'),{col:6,row:4});
 assert.deepEqual(J(g,'travellersRiseAmbush.getView().trigger'),{col:10,row:7});
 assert.deepEqual(view(g).firePosition,{x:272,y:176});
 assert.equal(g.run('MAP_CATALOG.TRAVELLERS_RISE_CAMP_MAP.allowRandomEncounters'),false);
 assert.equal(g.run('MAP_CATALOG.TRAVELLERS_RISE_CAMP_MAP.encounterPool'),null);
 assert.equal(g.run('currentMapFeatures()'),null);assert.deepEqual(J(g,"SIMPLE_NPCS.filter(n=>n.map==='travellers_rise_camp')"),[]);
 g.frames(100);assert.equal(view(g).phase,'idle');assert.equal(view(g).fire,'cold');assert.equal(view(g).stage,1);begin(g);
 assert.equal(g.run('nightRolls'),0);
});

test('every nearby safe entry tile prepares and walks without overlap or a stalled route',()=>{
 const g=fresh();for(let row=3;row<=7;row++)for(let col=6;col<=10;col++){
  const x=(col+.5)*32,y=(row+.5)*32;if(Math.hypot(x-272,y-176)>65)continue;
  g.run(`travellersRiseNight.resetTransient();placeAtLocation('TRAVELLERS_RISE_CAMP_MAP',${x},${y})`);
  assert.equal(g.run('travellersRiseNight.begin()'),true,`${col},${row}`);reach(g,'opening');
  const a=view(g).actors;assert.ok(Math.abs(a[0].x-a[1].x)>=18||Math.abs(a[0].y-a[1].y)>=18);
  g.run('travellersRiseNight.resetTransient()');
 }
 assert.equal(g.run('nightRolls'),0);
});

test('all walking is visible, orthogonal and bounded; both actors remain present across the whole scene',()=>{
 const g=fresh(),before=resources(g);begin(g);let previous=view(g),steps=0;
 while(view(g).phase!=='black'){
  const v=view(g);assert.equal(v.actors.length,2);assert.ok(Object.isFrozen(g.run('travellersRiseNight.getView()')));
  for(let i=0;i<2;i++){
   const a=v.actors[i],p=previous.actors[i];assert.ok(Math.abs(a.x-p.x)+Math.abs(a.y-p.y)<=2);
   assert.ok(a.x>=18&&a.x<=494&&a.y>=32&&a.y<300);assert.equal(g.run(`isTileWalkable(TRAVELLERS_RISE_CAMP_MAP[${Math.floor(a.y/32)}][${Math.floor(a.x/32)}])`),true);
  }
  assert.ok(Math.abs(v.actors[0].x-v.actors[1].x)>=18||Math.abs(v.actors[0].y-v.actors[1].y)>=18);
  previous=v;if(g.run('dialogue.open'))g.run('finishDialogue()');else g.frames(1);assert.ok(++steps<1800);
 }
 assert.deepEqual(view(g).actors.map(a=>[a.x,a.y,a.facing,a.seated]),[[272,128,'down',true],[272,224,'up',true]]);
 assert.equal(resources(g),before);assert.equal(g.run('nightRolls'),0);
});

test('cold ashes, logs and three bedrolls persist; physical fuel/flint leads to deterministic animated flame',()=>{
 const g=fresh();record(g);g.run('paint=[];travellersRiseCamp.draw()');let p=J(g,'paint');
 assert.equal(p.filter(r=>r.style.fillStyle==='#625a44').length,3);
 assert.equal(p.filter(r=>r.type==='fillRect'&&r.args[2]===48&&r.args[3]===13).length,2);
 assert.equal(p.some(r=>r.style.fillStyle==='#e99c42'),false);begin(g);reach(g,'fuel');
 g.run('paint=[];travellersRiseCamp.draw()');assert.ok(J(g,'paint').some(r=>r.style.fillStyle==='#617440'));
 reach(g,'spark');assert.equal(view(g).fire,'kindling');g.frames(36);assert.equal(view(g).fire,'embers');g.frames(36);assert.equal(view(g).fire,'lit');
 g.run('paint=[];travellersRiseNight.drawFire()');const a=J(g,'paint');g.frames(8);g.run('paint=[];travellersRiseNight.drawFire()');assert.notDeepEqual(J(g,'paint'),a);
 assert.equal(g.run('nightRolls'),0);
});

test('authored dialogue follows canonical biography, practical firecraft and the warm final promise',()=>{
 const g=fresh(),d=J(g,'TRAVELLERS_RISE_NIGHT_DIALOGUE'),text=Object.values(d).flat().flatMap(p=>p.lines).join(' ');
 for(const word of ['green when I was born','Alecton','before I was two','about ten','tried to drown me','emergency Imperial conservatorship','kept me alive','next two years in Halcyra','child of the continent','Academy at twelve','Somewhere quiet','placement office','larger Registry office','Tomas','smaller print','flint']){
  assert.ok(text.includes(word),word);
 }
 assert.doesNotMatch(text,/magic flame|summon.*fire|father died|secret.*(ruins|power|Thread)|kiss|destiny/i);
 const conversation=d.conversation;assert.deepEqual(conversation.slice(-5).map(p=>p.speakerId),['esla','lely','esla','lely','esla']);
 assert.equal(conversation.at(-1).lines[0],'“I promise.”');
 assert.ok(text.indexOf('tried to drown me')<text.indexOf('emergency Imperial conservatorship'));
 assert.ok(text.indexOf('emergency Imperial conservatorship')<text.indexOf('Academy at twelve'));
 assert.ok(text.indexOf('Tomas')<text.indexOf('I’m afraid it will become another file'));
 assert.equal(g.run('Object.isFrozen(TRAVELLERS_RISE_NIGHT_DIALOGUE.conversation[0].lines)'),true);
});

test('every spoken page uses explicit speaker identity; pagination preserves green Esla and default Lely',()=>{
 const g=fresh();begin(g);reach(g,'conversation');record(g);let green=0,plain=0,count=0;
 while(g.run('dialogue.open')){
  assert.ok(++count<100);g.run('paint=[];drawDialogue()');
  const speaker=g.run('dialoguePagePresentation().speakerId'),paint=J(g,'paint').filter(p=>p.type==='text');
  assert.ok(paint.some(p=>p.style.fillStyle===(speaker==='esla'?'#a8e89c':'#ccd8cc')));
  if(speaker==='esla')green++;else plain++;g.press('Enter');
 }
 assert.ok(green>=20&&plain>=15);assert.equal(view(g).phase,'black');
 g.run("openDialogue('',[['Ordinary system text']]);paint=[];drawDialogue()");assert.ok(J(g,'paint').some(p=>p.type==='text'&&p.style.fillStyle==='#ccd8cc'));
});

test('night overlay/firelight and seated sprites are bounded, deterministic and read-only at native and 2x',()=>{
 const g=fresh();begin(g);reach(g,'conversation');record(g);const before=resources(g),v=view(g);
 for(const scale of [1,2]){
  const draw=`paint=[];ctx.save();ctx.scale(${scale},${scale});travellersRiseCamp.draw();travellersRiseNight.drawPlayerPose();travellersRiseNight.drawNight();ctx.restore()`;
  g.run(draw);const paint=J(g,'paint');g.run(draw);assert.deepEqual(J(g,'paint'),paint);
  assert.ok(paint.some(p=>typeof p.style.fillStyle==='string'&&p.style.fillStyle.startsWith('rgba(7,15,38,')));
  assert.ok(paint.some(p=>typeof p.style.fillStyle==='string'&&p.style.fillStyle.startsWith('rgba(230,153,66,')));
  assert.ok(paint.some(p=>p.style.fillStyle==='#2a9a28'));assert.ok(paint.some(p=>p.style.fillStyle==='#5c7090'));
  for(const p of paint.filter(p=>p.bounds))assert.ok(p.bounds.every(Number.isInteger)&&p.bounds[0]>=0&&p.bounds[1]>=0&&p.bounds[2]<=512*scale&&p.bounds[3]<=480*scale);
 }
 assert.equal(resources(g),before);assert.deepEqual(view(g),v);assert.equal(g.run('nightRolls'),0);
});

test('night blocks movement, menu/debug, combat, saving and loading through final dawn',()=>{
 const g=fresh();g.run('saveGame()');const stored=g.run("localStorage.getItem('verdantVale_save')");begin(g);
 for(const phase of ['opening','spark','conversation','black','sleep','dawn']){
  reach(g,phase);const pos=J(g,'[player.x,player.y]');
  g.press('m');g.press('`');g.hold('ArrowRight');assert.equal(g.run('keys.ArrowRight'),false);g.release('ArrowRight');assert.deepEqual(J(g,'[player.x,player.y]'),pos);
  assert.equal(g.run('menu.open||debugMenu.open'),false);assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
  assert.equal(g.run('startCombat()'),false);assert.equal(g.run("localStorage.getItem('verdantVale_save')"),stored);
 }
 done(g);assert.equal(g.run('canSaveHere()'),true);
});

test('overnight receipt restores each member and ONLY ordinary-night statuses once, after full blackout',()=>{
 const g=fresh();g.run(`saveGame();var p=JSON.parse(localStorage.getItem('verdantVale_save'));p.stats.hp=0;
 p.statusEffects=['poison','muddied','slither','cursed','burn','dazzled'];p.slitherSpd=7;
 p.party.characters[0].hp=7;p.party.characters[0].statuses=['poison','muddied','slither','cursed','burn','dazzled'];p.party.characters[0].slitherSpeed=9;
 localStorage.setItem('verdantVale_save',JSON.stringify(p));loadGame();dialogue.open=false`);
 const before=J(g,'({day,stats,party:persistentParty.serialize(),ids:combatEnemyInstanceSequence})');begin(g);reach(g,'black');g.frames(48);
 assert.equal(view(g).black,1);assert.equal(view(g).stage,1);assert.equal(g.run('day'),before.day);assert.equal(g.run('stats.hp'),0);
 g.frames(1);assert.equal(view(g).phase,'sleep');assert.equal(g.run('day'),before.day+1);assert.equal(view(g).stage,1);
 for(const m of J(g,'persistentParty.getFieldView().members')){assert.equal(m.hp,m.maxHp);assert.deepEqual(m.statuses,['burn','dazzled']);}
 assert.equal(g.run('slitherSpd'),7);assert.equal(g.run('persistentParty.getMember("esla").slitherSpeed'),9);
 done(g);assert.equal(view(g).stage,2);const after=J(g,'({day,stats,party:persistentParty.serialize(),ids:combatEnemyInstanceSequence})');
 for(const key of ['items','gold','xp','level','weapon','armor','shield','accessory'])assert.deepEqual(after.stats[key],before.stats[key]);
 assert.deepEqual(after.party.rewards,before.party.rewards);assert.equal(after.ids,before.ids);assert.equal(g.run('MainQuest'),5);
 assert.equal(J(g,'getActiveQuestNotes()').find(n=>n.title==='Sealed Report').body,'Continue east to the Mornay regional office with Esla. Deliver the sealed report and request qualified assistance.');
 assert.equal(g.run("travellersRiseAmbush.blocksExit('EASTERN_FENS_TRAVELLERS_RISE_MAP','east')"),false);assertNoOwners(g);assert.equal(g.run('nightRolls'),0);
});

test('completed night survives save/load, descriptions, exit/re-entry and cannot replay',()=>{
 const g=fresh();begin(g);done(g);const day=g.run('day'),before=resources(g);assert.equal(g.run('travellersRiseNight.begin()'),false);
 g.press('Enter');assert.match(g.run('JSON.stringify(dialogue.pages)'),/last embers/);g.run('finishDialogue();saveGame()');
 const saved=J(g,"JSON.parse(localStorage.getItem('verdantVale_save'))");assert.equal(saved.version,5);assert.equal(saved.travellers_rise_camp_stage,2);assert.doesNotMatch(JSON.stringify(saved),/camp_night_|nightfall|completionStarted/);
 g.run('loadGame();dialogue.open=false');assert.deepEqual(JSON.parse(resources(g)),JSON.parse(before));assert.equal(view(g).phase,'idle');assert.equal(view(g).fire,'embers');
 assert.equal(g.run('exitTravellersRiseCamp()'),true);assert.equal(g.run('enterTravellersRiseCamp()'),true);g.frames(60);
 assert.equal(view(g).stage,2);assert.equal(g.run('day'),day);assert.equal(g.run('travellersRiseNight.begin()'),false);
});

test('stage-one save/load remains pending and starts only by interaction',()=>{
 const g=fresh();const day=g.run('day');g.run('saveGame();loadGame();dialogue.open=false');g.frames(60);
 assert.equal(view(g).stage,1);assert.equal(view(g).phase,'idle');assert.equal(g.run('day'),day);begin(g);
});

test('stale callbacks, repeated confirmations and a second rest application cannot duplicate completion',()=>{
 const g=fresh();begin(g);reach(g,'conversation');g.run('var oldNightCallback=dialogue.callbacks[0]');
 g.run('finishDialogue();oldNightCallback();oldNightCallback()');assert.equal(view(g).phase,'black');done(g);const before=resources(g);
 g.run('oldNightCallback();oldNightCallback()');assert.equal(resources(g),before);
 g.run('var restToken=persistentParty.prepareOvernightRest();persistentParty.applyOvernightRest(restToken)');
 const after=resources(g);assert.throws(()=>g.run('persistentParty.applyOvernightRest(restToken)'),/Invalid persistent/);assert.equal(resources(g),after);
 assert.throws(()=>g.run('persistentParty.applyOvernightRest(Object.freeze({}))'),/Invalid persistent/);
});

test('malformed route and invalidated completion reject before rest/day/stage writes',()=>{
 const g=fresh();g.run('var priorTile=TRAVELLERS_RISE_CAMP_MAP[4][8];TRAVELLERS_RISE_CAMP_MAP[4][8]=1');const before=resources(g);
 assert.equal(g.run('travellersRiseNight.begin()'),false);assert.equal(resources(g),before);assert.equal(view(g).phase,'idle');
 g.run('TRAVELLERS_RISE_CAMP_MAP[4][8]=priorTile');begin(g);reach(g,'black');g.run('stats.gold++');const changed=resources(g);g.frames(49);
 assert.equal(view(g).phase,'fault');assert.equal(view(g).failure.completionStarted,false);assert.equal(resources(g),changed);assert.equal(view(g).stage,1);
 assert.equal(g.run('canSaveHere()'),true);g.press('m');assert.equal(g.run('menu.open'),true);
});

test('interrupted route releases controls with diagnostics and stage one permits safe retry',()=>{
 const g=fresh();begin(g);g.run('delete NPC_ROUTES.camp_night_esla_pose');g.frames(1);
 assert.equal(view(g).phase,'fault');assert.match(view(g).failure.message,/route/);assert.equal(view(g).stage,1);assertNoOwners(g);
 assert.equal(g.run('travellersRiseNight.begin()'),true);done(g);
});

test('foreign route ownership fails closed without deleting another actor or locking controls',()=>{
 const g=fresh();begin(g);g.run(`var foreignPose={id:'camp_night_esla_pose',map:'travellers_rise_camp',x:400,y:300};
 NPC_ROUTES.camp_night_esla_pose.npc=foreignPose`);g.frames(1);
 assert.equal(view(g).phase,'fault');assert.match(view(g).failure.message,/ownership/);assert.equal(view(g).stage,1);
 assert.equal(g.run('NPC_ROUTES.camp_night_esla_pose.npc===foreignPose'),true);
 g.press('m');assert.equal(g.run('menu.open'),true);
});

test('unexpected post-rest failure preserves diagnostics, refuses save/blind retry, and load restores a safe session',()=>{
 const g=fresh();g.run('saveGame()');const stored=g.run("localStorage.getItem('verdantVale_save')"),day=g.run('day');
 begin(g);reach(g,'black');g.run('var realSync=syncQuestFlagsToWindow;syncQuestFlagsToWindow=()=>{throw Error("injected completion fault")}');g.frames(49+48+72);
 assert.equal(view(g).phase,'fault');assert.equal(view(g).failure.completionStarted,true);assert.equal(g.run('day'),day+1);
 assert.equal(view(g).stage,1);
 assert.equal(g.run('saveGame()'),false);assert.equal(g.run('travellersRiseNight.begin()'),false);assert.equal(g.run("localStorage.getItem('verdantVale_save')"),stored);
 g.run('syncQuestFlagsToWindow=realSync;loadGame();dialogue.open=false');assert.equal(view(g).stage,1);assert.equal(g.run('day'),day);assert.equal(view(g).failure,null);begin(g);done(g);
});

test('checkpoint reset clears night poses/lighting/receipts and makes old callbacks inert',()=>{
 const g=fresh();begin(g);reach(g,'conversation');g.run('var oldNightCallback=dialogue.callbacks[0];storyCheckpointLab.apply("mq5_assignment_ready")');
 const before=resources(g);g.run('oldNightCallback()');assert.equal(resources(g),before);assert.equal(view(g).phase,'idle');assert.equal(view(g).stage,0);
 assert.equal(view(g).darkness,0);assertNoOwners(g);assert.equal(g.run('persistentParty.getMember("esla")'),null);
});

test('an impossible all-Fallen stable field state cannot start a camp night',()=>{
 const g=fresh();g.run(`saveGame();var p=JSON.parse(localStorage.getItem('verdantVale_save'));
 p.party.characters[0].hp=0;localStorage.setItem('verdantVale_save',JSON.stringify(p));loadGame();dialogue.open=false;stats.hp=0`);
 const before=resources(g);assert.equal(g.run('travellersRiseNight.begin()'),false);assert.equal(resources(g),before);
 assert.equal(view(g).phase,'idle');assert.equal(view(g).stage,1);assert.equal(g.run('nightRolls'),0);
});

test('Fallen Esla receives the same ordinary rest; a stale callback cannot finish a fresh conversation',()=>{
 const g=fresh();g.run(`saveGame();var p=JSON.parse(localStorage.getItem('verdantVale_save'));
 p.party.characters[0].hp=0;localStorage.setItem('verdantVale_save',JSON.stringify(p));loadGame();dialogue.open=false`);
 begin(g);reach(g,'conversation');g.run('var stale=dialogue.callbacks[0];travellersRiseNight.resetTransient()');
 assert.equal(view(g).stage,1);assert.equal(g.run('travellersRiseNight.begin()'),true);reach(g,'conversation');
 const before=resources(g);g.run('stale()');assert.equal(view(g).phase,'conversation');assert.equal(resources(g),before);
 done(g);assert.equal(g.run('persistentParty.getMember("esla").hp'),80);
});

test('ordinary maps retain zero extra night draw calls, save version and all geographical artifacts',()=>{
 const g=createContext();record(g);g.run('paint=[];travellersRiseNight.drawFire();travellersRiseNight.drawEsla();travellersRiseNight.drawNight()');assert.deepEqual(J(g,'paint'),[]);
 assert.equal(g.run('travellersRiseNight.drawPlayerPose()'),false);assert.equal(g.run('SAVE_VERSION'),5);
 const fixture=require('../fixtures/regional-grid-fingerprints');for(const [id,hash]of Object.entries(fixture.fingerprints))assert.equal(crypto.createHash('sha256').update(g.run(`JSON.stringify(mapRefForId('${id}'))`)).digest('hex'),hash);
 assert.equal(g.run('Object.keys(MAP_CATALOG).length'),1244);
});

module.exports={name:'Travellers Rise campfire night: private conversation, local firelight and authenticated ordinary rest',
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' campfire night checks passed');}};
