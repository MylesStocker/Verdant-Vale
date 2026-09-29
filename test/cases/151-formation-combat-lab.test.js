'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const ROOT=path.join(__dirname,'../..');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'formationSessionController.getView()');
const lab=g=>J(g,'formationCombatLab.getView()');
const HIT=[0.5,0.99,0.99];
function fresh() {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=()=>{throw Error('unexpected lab RNG');};
    dialogue.open=false;menu.open=false;statusEffects=[];stats.hp=100;stats.maxHp=100;
    stats.atk=8;stats.def=2;stats.spd=7;stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
    resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);player.facing='left';`);
  return g;
}
function open(g,scenario=0) {
  g.press('`');for(let i=0;i<11;i++)g.press('ArrowDown');g.press('Enter');
  assert.equal(g.run('debugMode'),false);assert.equal(g.run('formationCombatLab.isMenuOpen()'),true);
  for(let i=0;i<scenario;i++)g.press('ArrowDown');
}
function start(g,scenario=0) {open(g,scenario);g.press('Enter');assert.equal(g.run('formationCombatLab.isActive()'),true);}
function state(g) {
  return g.run(`JSON.stringify({stats,player,day,statusEffects,location:regionalWorldPosition(),map:mapIdForRef(activeMap),
    locationState:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),
    npcs:SIMPLE_NPCS.map(n=>[n.id,n.x,n.y,n.facing]),
    combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>'value' in d).map(([k,d])=>[k,d.value])),
    debugMode,debugInspector,forceLegacyRegionalView,defeatWakeAtHome,worldToast,worldToastTimer,
    save:localStorage.getItem('verdantVale_save')})`);
}
function tape(g,values,work) {
  g.run('var labTape='+JSON.stringify(values)+',labUsed=0;Math.random=()=>{if(labUsed===labTape.length)throw Error("tape exhausted");return labTape[labUsed++];};');
  try {work();assert.equal(g.run('labUsed'),values.length,'no exhausted/unused lab rolls');}
  finally {g.run('Math.random=()=>{throw Error("unexpected lab RNG");};');}
}
function round(g,values) {
  g.press('Enter');assert.equal(view(g).phase,'targeting');
  tape(g,values,()=>g.press('Enter'));assert.equal(view(g).phase,'playback');
  assert.equal(view(g).playbackFrame.frameIndex,0);
}
function finish(g) {
  while(view(g).phase==='playback')g.press('Enter');
  assert.equal(view(g).phase,'playback_complete');
}

test('backtick lab row is explicitly labelled DEV and leaves all earlier debug rows intact',()=>{
  const g=fresh();record(g);g.press('`');g.renderFrame();
  const text=J(g,'paint.filter(c=>c.type==="text").map(c=>c.args[0])').join('\n');
  assert.match(text,/DEV: Formation Combat Lab/);assert.match(text,/Play Sera\/Liora Cutaway/);assert.match(text,/Warp to Map/);
  assert.equal(g.run('DEBUG_MENU_ROW_COUNT'),12);assert.equal(g.run('debugMode'),false);
  for(let i=0;i<11;i++)g.press('ArrowDown');g.hold('Enter');g.hold('Enter');
  assert.equal(g.run('formationCombatLab.isMenuOpen()'),true);assert.equal(g.run('combat.mode'),null);
  g.release('Enter');g.renderFrame();assert.equal(lab(g).cursor,0);
  assert.ok(J(g,'paint.filter(c=>c.type==="text").map(c=>c.args[0])').includes('DEV: FORMATION COMBAT LAB'));
});

for(const scenario of [0,1,2])test('scenario '+scenario+' uses real allowlisted construction and independent stable instances',()=>{
  const g=fresh(),templates=J(g,'ENEMY_TEMPLATE_REGISTRY');
  g.run(`var initCount=0,realInit=initializeFormationState;
    initializeFormationState=d=>{initCount++;return realInit(d);};`);
  start(g,scenario);
  const enemies=J(g,'combat.enemies'),ids=J(g,'FORMATION_LAB_SCENARIOS['+scenario+'].ids');
  assert.equal(g.run('initCount'),1);assert.equal(enemies.length,scenario===0?2:3);
  assert.deepEqual(enemies.map(e=>e.id),ids);assert.deepEqual(enemies.map(e=>e.slot),ids.map((_,i)=>i));
  assert.equal(new Set(enemies.map(e=>e.instanceId)).size,enemies.length);
  assert.ok(ids.every(id=>g.run('FORMATION_STATE_TEMPLATE_IDS').includes(id)));
  assert.equal(g.run('combat.active'),false);assert.equal(view(g).phase,'awaiting_action');
  assert.equal(g.run('Object.isFrozen(combat.enemies)'),true);assert.deepEqual(J(g,'ENEMY_TEMPLATE_REGISTRY'),templates);
  if(scenario===2)assert.deepEqual(J(g,'getFormationBattleLayout(formationSessionController.getView()).map(e=>e.label)'),['Marsh Wisp A','Marsh Wisp B','Marsh Wisp C']);
  assert.ok(Object.isFrozen(g.run('formationCombatLab.getView()')));
});

test('varied silhouettes cover wide and tall bounds without adding templates or assets',()=>{
  const g=fresh();start(g,1);
  const ids=J(g,'combat.enemies.map(e=>e.id)');
  assert.deepEqual(ids,['enemy_reed_grappler','enemy_silt_lurker','enemy_sluice_slime']);
  const positions=J(g,'getFormationBattleLayout(formationSessionController.getView())');
  assert.ok(positions[0].scale<1);assert.ok(positions[1].scale<1);assert.equal(positions[2].scale,1);
});

for(const blocked of ['dialogue.open=true;','seraLioraCutscene.active=true;','fishing.active=true;',
  'menu.open=true;','choice.open=true;','shop.open=true;','warpMenu.open=true;',
  'accordPanel.open=true;','continentMap.open=true;','startWardenCombat();']) {
  test('entry refuses blocking state: '+blocked,()=>{
    const g=fresh();g.run('debugMenu.open=true;'+blocked);
    const before=state(g);assert.equal(g.run('formationCombatLab.open()'),false);assert.equal(state(g),before);
  });
}

test('ordinary calls cannot open a lab without its debug menu and existing formation state is preserved',()=>{
  const g=fresh();assert.equal(g.run('formationCombatLab.open()'),false);
  g.run('initializeFormationState([{enemyId:"enemy_marsh_wisp",slot:0},{enemyId:"enemy_marsh_wisp",slot:1}]);debugMenu.open=true;');
  const members=g.run('combat.enemies');assert.equal(g.run('formationCombatLab.open()'),false);assert.equal(g.run('combat.enemies'),members);
});

for(const unsupported of ['stats.hp=0;','statusEffects=["unknown"];','combat.bombFuse=1;',
  'combat.message="pending";','combat.pendingVictory=true;','stats.accessory={type:"accessory",name:"EvadeAll",bonus:0,evadeAll:true};']) {
  test('unsupported start is refused without changing player/world or clearing the unsupported state: '+unsupported,()=>{
    const g=fresh();open(g);g.run(unsupported);const before=state(g);g.press('Enter');
    assert.equal(g.run('formationCombatLab.isActive()'),false);assert.equal(g.run('combat.mode'),null);
    assert.equal(view(g),null);assert.equal(state(g),before);assert.match(lab(g).error,/Requires idle combat/);
  });
}

test('input-driven round resolves exactly once and plays historical HP without additional gameplay',()=>{
  const g=fresh();start(g);record(g);
  g.run(`var resolves=0,realResolver=resolveFormationRound;resolveFormationRound=a=>{resolves++;return realResolver(a);};
    var drawViews=[],realDrawCombat=drawCombat;drawCombat=v=>{drawViews.push(v);return realDrawCombat(v);};`);
  const beforeHP=J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]');
  g.hold('Enter');g.hold('Enter');g.release('Enter');assert.equal(view(g).phase,'targeting');assert.equal(g.run('resolves'),0);
  g.press('d');const selected=view(g).selectedTargetInstanceId;
  tape(g,[0,0,...HIT,...HIT,...HIT],()=>g.hold('Enter'));
  assert.equal(g.run('resolves'),1);assert.equal(view(g).playbackFrame.frameIndex,0);
  g.hold('Enter');g.release('Enter');assert.equal(view(g).playbackFrame.frameIndex,0);
  const live=J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]');assert.notDeepEqual(live,beforeHP);
  g.renderFrame();const seen=g.run('drawViews.at(-1)');assert.ok(Object.isFrozen(seen));
  assert.deepEqual([seen.player.hp,...Array.from(seen.enemies,e=>e.hp)],beforeHP);
  g.press('Escape');assert.equal(view(g).phase,'playback');
  while(view(g).phase==='playback') {
    const index=view(g).playbackFrame.frameIndex;g.hold('Enter');g.hold('Enter');g.release('Enter');
    assert.equal(view(g).playbackFrame.frameIndex,index+1);assert.deepEqual(J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]'),live);
    g.renderFrame();assert.deepEqual(J(g,'drawViews.at(-1).playbackFrame'),view(g).playbackFrame);
  }
  assert.equal(view(g).phase,'playback_complete');g.press('Escape');assert.equal(view(g).phase,'playback_complete');
  g.hold('Enter');g.hold('Enter');g.release('Enter');assert.equal(view(g).phase,'awaiting_action');
  g.press('Enter');assert.equal(view(g).phase,'targeting');g.press('d');assert.equal(view(g).selectedTargetInstanceId,selected);
  tape(g,[0,0,...HIT,...HIT,...HIT],()=>g.press('Enter'));assert.equal(g.run('resolves'),2);
});

test('Escape cancels targeting; only a later press exits awaiting_action',()=>{
  const g=fresh();start(g);g.press('Enter');g.hold('Escape');g.hold('Escape');
  assert.equal(view(g).phase,'awaiting_action');assert.equal(g.run('formationCombatLab.isActive()'),true);
  g.release('Escape');g.hold('Escape');g.hold('Escape');
  assert.equal(view(g),null);assert.equal(g.run('formationCombatLab.isMenuOpen()'),true);
  g.release('Escape');g.press('Escape');assert.equal(lab(g),null);assert.equal(g.run('debugMenu.open'),true);
});

for(const outcome of ['victory','defeat'])test(outcome+' stays terminal until Escape, then restores exact HP and world',()=>{
  const g=fresh();g.run(outcome==='victory'?'stats.hp=83;stats.atk=100;':'stats.hp=1;');open(g);
  const before=state(g),originalTick=g.run('tick');g.press('Enter');
  g.run(`applyKillRewards=endCombat=handleCombatAction=advanceCombatMessage=finalizeLenswebSpiderEvent=()=>{throw Error('normal finalizer/reward executed');};`);
  round(g,outcome==='victory'?[0,0,...HIT,...HIT]:[0.99,0.99,...HIT]);finish(g);g.press('Enter');
  if(outcome==='victory') {assert.equal(view(g).phase,'awaiting_action');round(g,[0,...HIT]);finish(g);g.press('Enter');}
  assert.equal(view(g).phase,outcome);const terminal=view(g);
  for(const key of ['Enter',' ','a','d','b','B','m','`'])g.press(key);
  assert.deepEqual(view(g),terminal);g.frames(10);g.renderFrame();assert.equal(g.run('formationCombatLab.isActive()'),true);
  if(outcome==='defeat')assert.equal(g.run('stats.hp'),0);
  g.press('Escape');assert.equal(g.run('tick'),originalTick);assert.equal(state(g),before);
  assert.equal(g.run('combat.mode'),null);assert.equal(g.run('combat.enemies.length'),0);assert.equal(view(g),null);
  assert.equal(g.run('debugMenu.open'),true);assert.equal(g.run('debugMenu.cursor'),11);
  g.press('Enter');assert.equal(view(g).phase,'awaiting_action');g.press('Escape');assert.equal(state(g),before);
});

test('world simulation is frozen before timers, NPC updates, input, and automatic triggers',()=>{
  const g=fresh();g.run('combat.cooldown=71;worldToastTimer=83;');open(g);
  const beforeEntry=state(g);g.press('Enter');
  const before=state(g);g.hold('d');g.hold('w');g.frames(120);g.release('d');g.release('w');
  assert.equal(state(g),before);g.press('Escape');assert.equal(state(g),beforeEntry);
});

test('held movement and accept/exit latches do not cross lab boundaries',()=>{
  const g=fresh();open(g);g.hold('d');g.hold('Enter');g.hold('Enter');
  assert.equal(view(g).phase,'awaiting_action');assert.equal(g.run('pressedKeys.d'),false);g.release('Enter');
  g.hold('Escape');g.hold('Escape');assert.equal(g.run('formationCombatLab.isMenuOpen()'),true);
  assert.equal(g.run('debugMenu.open'),true);g.release('Escape');g.release('d');
});

test('save/load are inert during the lab; a fresh reload contains no lab or changed HP',()=>{
  const g=fresh();g.run('stats.hp=47;saveGame();');const saved=g.run("localStorage.getItem('verdantVale_save')");start(g);
  round(g,[0,0,...HIT,...HIT,...HIT]);const before=state(g);
  assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
  assert.equal(state(g),before);assert.equal(g.run("localStorage.getItem('verdantVale_save')"),saved);
  const reloaded=fresh();reloaded.run("localStorage.setItem('verdantVale_save',"+JSON.stringify(saved)+');');
  assert.equal(reloaded.run('loadGame()'),true);assert.equal(reloaded.run('stats.hp'),47);assert.equal(lab(reloaded),null);assert.equal(view(reloaded),null);
  assert.equal(reloaded.run('combat.mode'),null);assert.doesNotMatch(saved,/formation|playback|instanceId|combat_enemy_/);
  finish(g);g.press('Enter');g.press('Escape');g.press('Escape');
  assert.equal(g.run('canSaveHere()'),true);assert.equal(g.run('stats.hp'),47);
});

test('inactive top-level routing and existing full debug warp stay unchanged',()=>{
  const g=fresh();g.run('var battleRenders=0;drawCombat=()=>{battleRenders++;};');g.renderFrame();assert.equal(g.run('battleRenders'),0);
  g.press('`');for(let i=0;i<6;i++)g.press('ArrowDown');g.press('Enter');
  assert.equal(g.run('warpMenu.open'),true);assert.equal(g.run('warpMenu.playerMode'),false);assert.equal(lab(g),null);
  assert.equal(g.run('warpMenu.destinations.length'),g.run('getDebugWarpDestinations().length'));
});

test('only the labelled debug action opens the lab and only lab start initializes/begins formations',()=>{
  const files=scriptOrderFromIndexHtml();
  for(const file of files) {
    const s=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.equal((s.match(/\binitializeFormationState\b/g)||[]).length,['combat.js','formation-lab.js','gallery-receiver.js'].includes(file)?1:0,file);
    assert.equal((s.match(/formationSessionController\.begin\(/g)||[]).length,['formation-lab.js','gallery-receiver.js'].includes(file)?1:0,file);
    assert.equal((s.match(/formationCombatLab\.open\(/g)||[]).length,file==='input.js'?1:0,file);
    if(/content\/|interactions|debug-warp|data\.js|quests|maps|npcs/.test(file))assert.doesNotMatch(s,/formationCombatLab|FORMATION_LAB_SCENARIOS/,file);
  }
  const labSource=fs.readFileSync(path.join(ROOT,'formation-lab.js'),'utf8');
  assert.doesNotMatch(labSource,/Math\.random|applyKillRewards\(|endCombat\(|saveGame\(|loadGame\(|transitionToLocation\(|combat\.active\s*=|\.gold\s*=|\.xp\s*=|selectedTarget|frameIndex|actionQueue/);
  const g=fresh();assert.equal(g.run('FORMATION_STATE_TEMPLATE_IDS.length'),11);
  g.run('startWardenCombat();');assert.equal(g.run('combat.mode'),'single');assert.equal(g.run('combat.enemies.length'),1);
});

module.exports={name:'developer Formation Combat Lab: real UI lifecycle, isolated state, restoration and no progression',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' formation lab checks passed');}};
