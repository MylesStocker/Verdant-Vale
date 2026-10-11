'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {createContext,scriptOrderFromIndexHtml} = require('../harness');
const ROOT = path.join(__dirname,'../..');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,source)=>JSON.parse(g.run('JSON.stringify('+source+')'));
const fixtures=`[
  {characterId:'fixture_amber',slot:0,name:'Fixture Amber',hp:21,maxHp:30,atk:7,def:3,spd:9,statuses:[]},
  {characterId:'fixture_cobalt',slot:1,name:'Fixture Cobalt',hp:32,maxHp:40,atk:11,def:5,spd:4,statuses:[]}
]`;
const pair='combatPlayerState.initialize(descriptors)';
function fresh() {
  const g=createContext();
  g.run(`dialogue.open=false;dialogue.callbacks=null;dialogue.triggerEncounterId=null;menu.open=false;
    var descriptors=${fixtures};var rngCalls=0, getterCalls=0;
    Math=Object.create(Math);Math.random=()=>{rngCalls++;throw Error('unexpected RNG');};`);
  return g;
}
function snapshot(g) {
  return g.run(`JSON.stringify({stats,statusEffects,slitherSpd,player,day,
    combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat))
      .filter(([,d])=>Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),
    active:combat.active,mode:combat.mode,enemySequence:combatEnemyInstanceSequence,
    observations:combat.enemies.map(e=>[e.observeCount,e.escapeUnlocked]),
    rounds:formationRounds.getView(),session:formationSessionController.getView(),
    party:combatPlayerState.getView(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),
    dialogue,choice,menu,save:localStorage.getItem('verdantVale_save')})`);
}
function inert(g,fn) {
  const before=snapshot(g), enemy=g.run('combat.enemies'),stats=g.run('stats'),items=g.run('stats.items');
  const result=fn();
  assert.equal(snapshot(g),before);
  assert.equal(g.run('combat.enemies'),enemy);assert.equal(g.run('stats'),stats);assert.equal(g.run('stats.items'),items);
  assert.equal(g.run('rngCalls'),0);return result;
}
function rejected(g,source,pattern=/Invalid player-party|Unsupported formation entry|Prepared player party/) {
  inert(g,()=>assert.throws(()=>g.run(source),pattern));
}
function installed(g) { g.run(pair);return J(g,'combatPlayerState.getView()'); }
function frozenTree(value) {
  if (value && typeof value==='object') {
    assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozenTree);
  } else assert.notEqual(typeof value,'function');
}
const enemies="initializeFormationState([{enemyId:'enemy_marsh_wisp',slot:0},{enemyId:'enemy_briar_hound',slot:1}],{escape:'fastest_living'})";

test('default state is absent; existing single/formation actors read canonical Lely without cloning',()=>{
  for(const setup of ['', 'startWardenCombat()',enemies]) {
    const g=fresh();assert.equal(g.run('combatPlayerState.getView()'),null);
    assert.equal(g.run('combatPlayerState.hasParty()'),false);
    if (!setup) continue;
    const canonical=g.run('stats');g.run(setup);
    assert.equal(g.run('combatPlayerState.hasParty()'),false);
    assert.equal(g.run('combatPlayerState.getView().shape'),'single');
    const before=g.run('combatPlayerState.getView()');frozenTree(before);
    g.run("stats.hp=12;stats.atk=17;addStatusEffect('poison');");
    assert.equal(g.run('stats'),canonical);
    assert.equal(g.run('combatPlayerState.getView().members[0].hp'),12);
    assert.equal(g.run('combatPlayerState.getView().members[0].atk'),17);
    assert.deepEqual(J(g,'combatPlayerState.getView().members[0].statuses'),['poison']);
    assert.equal(before.members[0].hp,30,'old snapshot cannot become a live authority');
  }
});

test('ordered identities, private mutable HP/status, detached fixtures and immutable views',()=>{
  const g=fresh(),canonical=J(g,'stats');
  g.run('descriptors[1].statuses=descriptors[0].statuses;');
  const result=g.run(pair);frozenTree(result);assert.ok(Object.isFrozen(g.run('combatPlayerState')));
  assert.deepEqual(Array.from(result.members,m=>m.instanceId),['combat_party_1','combat_party_2']);
  assert.deepEqual(Array.from(result.members,m=>m.slot),[0,1]);
  assert.equal(g.run('combat.mode'),null);assert.equal(g.run('combat.active'),false);
  assert.equal(g.run('combatEnemyInstanceSequence'),0);
  g.run("descriptors[0].hp=1;descriptors[0].name='Changed fixture';descriptors[0].statuses.push('burn');");
  assert.equal(g.run('combatPlayerState.getMember("combat_party_1").hp'),21);
  assert.equal(g.run('combatPlayerState.getMember("combat_party_1").name'),'Fixture Amber');
  assert.deepEqual(J(g,'combatPlayerState.getMember("combat_party_2").statuses'),[]);
  g.run("combatPlayerState.setHp('combat_party_1',0);var newStatuses=['poison'];combatPlayerState.setStatuses('combat_party_1',newStatuses);newStatuses.push('burn');");
  assert.deepEqual(J(g,'combatPlayerState.getView().members.map(m=>[m.instanceId,m.slot,m.hp,m.statuses])'),[
    ['combat_party_1',0,0,['poison']],['combat_party_2',1,32,[]],
  ]);
  assert.equal(g.run("combatPlayerState.getMemberByCharacterId('fixture_amber').instanceId"),'combat_party_1');
  for(const value of ['fixture_amber','combat_party_0','combat_enemy_1','combat_party_3',null,0,{}]) {
    assert.equal(g.run('combatPlayerState.getMember('+JSON.stringify(value)+')'),null);
  }
  assert.equal(g.run("combatPlayerState.getMemberByCharacterId('fixture_amb')"),null);
  assert.throws(()=>{result.members.reverse();});assert.throws(()=>{result.members[0].hp=4;});
  assert.throws(()=>{result.members[0].statuses.push('burn');});
  assert.deepEqual(J(g,'stats'),canonical);assert.equal(g.run('rngCalls'),0);
  assert.equal(result.members[0].hp,21);
});

const malformed=[
  'descriptors=[]','descriptors.length=1','descriptors.push({...descriptors[0],slot:2})',
  'descriptors[1].characterId=descriptors[0].characterId','descriptors[0].characterId="player"',
  'descriptors[1].characterId=""','descriptors[1].characterId={}',
  'descriptors[1].slot=0','descriptors.reverse()','delete descriptors[0].slot','descriptors[1].slot="1"',
  'descriptors[1].name=" "','descriptors[1].name=()=>"name"',
  'descriptors[1].equipment=null','descriptors[1].effects={}','descriptors[1].instanceId="combat_party_1"',
  'descriptors[1][Symbol("extra")]=1','descriptors.extra=true','delete descriptors[0]',
  'Object.setPrototypeOf(descriptors[1],{inherited:true})','Object.setPrototypeOf(descriptors,{})',
  'descriptors[1]=stats','descriptors[1]=()=>{}',
  'descriptors[1].statuses=["unknown"]','descriptors[1].statuses=["poison","poison"]',
  'descriptors[1].statuses={poison:1}','descriptors[1].statuses=[{id:"poison",turns:2}]',
  'descriptors[1].statuses=[()=>{}]','descriptors[1].statuses=["poison"];delete descriptors[1].statuses[0]',
  'Object.setPrototypeOf(descriptors[1].statuses,{})','descriptors[1].statuses.extra=true',
  'Object.defineProperty(descriptors[1],"hp",{get(){getterCalls++;return 10;}})',
  'Object.defineProperty(descriptors,1,{get(){getterCalls++;return {};}})',
  'Object.defineProperty(descriptors[1],"statuses",{get(){getterCalls++;return [];}})',
  'descriptors[1].statuses=["poison"];Object.defineProperty(descriptors[1].statuses,0,{get(){getterCalls++;return "poison";}})',
  'descriptors[1].hp=descriptors[1].maxHp+1','descriptors[1].maxHp=0',
];
for(const field of ['hp','maxHp','atk','def','spd']) for(const value of ['NaN','Infinity','-Infinity','-1','0.5','Number.MAX_SAFE_INTEGER+1','"3"','3n','null'])
  malformed.push('descriptors[1].'+field+'='+value);
for(const mutation of malformed) test('atomic descriptor rejection: '+mutation,()=>{
  const g=fresh();g.run(mutation);rejected(g,pair);
  assert.equal(g.run('getterCalls'),0);
  g.run('descriptors='+fixtures);const v=installed(g);
  assert.deepEqual(v.members.map(m=>m.instanceId),['combat_party_1','combat_party_2'],'failure allocates zero identities');
  assert.equal(g.run('combatEnemyInstanceSequence'),0);
});

test('null-prototype data accepted, zero HP retained, finite safe integer boundaries accepted',()=>{
  const g=fresh();g.run('descriptors[0]=Object.assign(Object.create(null),descriptors[0]);descriptors[0].hp=0;descriptors[0].atk=Number.MAX_SAFE_INTEGER;');
  const v=installed(g);assert.equal(v.members[0].hp,0);assert.equal(v.members[0].atk,Number.MAX_SAFE_INTEGER);
  rejected(g,pair);rejected(g,'combatPlayerState.initialize(descriptors,true)');
  rejected(g,'combatPlayerState.initialize(combatPlayerState.getView().members)');
});

for(const setup of [
  'stats.hp=0','combat.active=true','combat.pendingVictory=true','combat.pendingDefeat=true','combat.pendingEscape=true',
  'combat.phase="victory"','combat.message="unacknowledged"','combat.messageQueue=["pending"]',
  'combat.messageQueue=[()=>{}]','combat.bombFuse=1','combat.evadeTurns=1',
  'dialogue.open=true','dialogue.callbacks=[()=>{}]','dialogue.triggerEncounterId="pending"',
  'debugMenu.open=true','choice.open=true','menu.open=true','shop.open=true','fishing.active=true','seraLioraCutscene.active=true',
  'warpMenu.open=true','accordPanel.open=true','continentMap.open=true',
  enemies+';formationSessionController.begin()',
]) test('busy preparation is rejected atomically: '+setup,()=>{
  const g=fresh();g.run(setup);rejected(g,pair);
});

test('pending or acknowledged formation outcomes cannot acquire player preparation',()=>{
  for(const lethal of [false,true]) {
    const g=fresh();g.run(enemies);
    g.run(`Math.random=()=>0.5;stats.hp=1000;stats.maxHp=1000;${lethal?'stats.atk=1000;combat.enemies[1].hp=0;':''}
      var round=resolveFormationRound({type:'attack',targetInstanceId:combat.enemies[0].instanceId});
      var playback=createFormationRoundPlayback(round);
      Math.random=()=>{rngCalls++;throw Error('unexpected RNG');};`);
    rejected(g,pair);
    g.run('acknowledgeFormationRound(playback,playback.frameCount-1)');rejected(g,pair);
  }
});

test('inactive single enemy and formation coexistence, observation and identity ownership',()=>{
  for(const setup of ["combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp}",enemies]) {
    const g=fresh();g.run(setup+';combat.enemies[0].observeCount=2;');
    const enemy=g.run('combat.enemies'), mode=g.run('combat.mode'),before=J(g,'combat.enemies'),seq=g.run('combatEnemyInstanceSequence'),round=J(g,'formationRounds.getView()');
    installed(g);
    assert.equal(g.run('combat.enemies'),enemy);assert.deepEqual(J(g,'combat.enemies'),before);
    assert.equal(g.run('combat.mode'),mode);assert.equal(g.run('combat.active'),false);
    assert.equal(g.run('combat.enemies[0].observeCount'),2);assert.equal(g.run('combatEnemyInstanceSequence'),seq);
    assert.deepEqual(J(g,'formationRounds.getView()'),round);
    const party=J(g,'combatPlayerState.getView()');g.run('combat.enemy=null');
    assert.deepEqual(J(g,'combatPlayerState.getView()'),party);
    g.run(enemies);assert.deepEqual(J(g,'combatPlayerState.getView()'),party);
    const installedEnemies=g.run('combat.enemies');g.run('combatPlayerState.clear()');
    assert.equal(g.run('combat.enemies'),installedEnemies);assert.equal(g.run('combat.mode'),'formation');
  }
});

const starters=[...fs.readFileSync(path.join(ROOT,'combat.js'),'utf8').matchAll(/function (start\w*Combat)\(/g)].map(m=>m[1]+'(1)');
const guards=[...starters,
  'combat.active=true','combat.active=1','combat.active={}',
  'handleCombatAction()','advanceCombatMessage()','endCombat()','recoverCombatDefeat()',
  'finalizeLenswebSpiderEvent()','resolveLenswebSpiderEscape()',
  'applyKillRewards(combat.enemies[0],[])','checkLevelUp([])',
  'equipItem({type:"weapon",name:"Fixture",bonus:1})','applyStatusCure({curesPoison:true})',
  'applyEnemyHitEffects(combat.enemies[0])','burnTickEntry(combat.enemies[0])',
  'enemyRegenEntry(combat.enemies[0])','bombFuseEntry()','tickEvadeBuff()',
  'enemyTurnResponse(combat.enemies[0],()=>"unused")','rollSlitherSpd()',
  'addStatusEffect("poison")','removeStatusEffect("poison")','triggerSlither()',
  'rollAttackDamage(7,2)','attackEvaded(5,6,true)',
  'prepareFormationEntry()',
  'resolveFormationBasicAttackRound({type:"attack",targetInstanceId:"combat_enemy_1"})',
  'resolveFormationRound({type:"attack",targetInstanceId:"combat_enemy_1"})',
  'resolveFormationRound({type:"item",itemId:"Potion"})','resolveFormationRound({type:"run"})',
  'resolveFormationRound({get type(){getterCalls++;return "attack";}})',
  'formationSessionController.begin()','createFormationRoundPlayback({})','createFormationCommandPlayback({})',
  'formationRounds.finish({outcome:"ongoing"},combat.enemies)',
  'acknowledgeFormationRound({},0)','formationRounds.prepare()','formationRounds.applied("evade",1)',
  'handleFormationInputCommand("confirm")','drawCombat()','drawCombat({})','drawFormationCombat({})',
];
for(const source of guards) test('execution rejected before RNG or mutation: '+source,()=>{
  for(const setup of ['',enemies]) {
    const g=fresh();if(setup) g.run(setup);installed(g);
    // Drawing must fail even before touching a flash frame or the canvas.
    g.run('var canvasCalls=0;ctx.fillRect=ctx.save=()=>{canvasCalls++;};');
    rejected(g,source,/Prepared player party/);
    assert.equal(g.run('canvasCalls'),0);assert.equal(g.run('getterCalls'),0);
  }
});

test('keyboard and held keys cannot operate combat, menus or world simulation',()=>{
  const g=fresh();g.hold('ArrowRight');installed(g);
  const before=snapshot(g);g.run('combat.cooldown=7;var oldTick=tick;');
  for(const key of ['ArrowLeft','ArrowRight','Enter',' ','Escape','i','`']) g.press(key);
  g.frames(10);assert.equal(g.run('keys.ArrowRight'),false);
  assert.equal(g.run('combat.cooldown'),7);assert.equal(g.run('tick'),g.run('oldTick'));
  g.run('combat.cooldown=0;');assert.equal(snapshot(g),before);
});

test('mutation validation and exact stale identity rejection never replace or compact members',()=>{
  const g=fresh();installed(g);
  for(const source of [
    'combatPlayerState.setHp("fixture_amber",1)','combatPlayerState.setHp("combat_party_1",-1)',
    'combatPlayerState.setHp("combat_party_1",31)','combatPlayerState.setHp("combat_party_1",NaN)',
    'combatPlayerState.setHp("combat_party_1",0.5)','combatPlayerState.setHp("combat_party_3",1)',
    'combatPlayerState.setStatuses("combat_party_1",["unknown"])',
    'combatPlayerState.setStatuses("combat_party_1",["burn","burn"])',
    'combatPlayerState.setStatuses("combat_party_1",{poison:1})',
    'combatPlayerState.setHp("combat_party_1",1,true)',
    'combatPlayerState.setStatuses("combat_party_1",[],true)',
    'combatPlayerState.clear(true)',
  ]) rejected(g,source);
  g.run('combatActive=true');rejected(g,'combatPlayerState.clear()');
  rejected(g,'combatPlayerState.setHp("combat_party_1",1)');g.run('combatActive=false');
  const canonical=J(g,'stats');g.run('combatPlayerState.clear()');
  assert.equal(g.run('combatPlayerState.getView()'),null);
  const next=installed(g);assert.deepEqual(next.members.map(m=>m.instanceId),['combat_party_3','combat_party_4']);
  assert.deepEqual(next.members.map(m=>m.slot),[0,1]);
  rejected(g,'combatPlayerState.setHp("combat_party_1",1)');
  assert.equal(g.run('combatPlayerState.getMember("combat_party_1")'),null);
  assert.deepEqual(J(g,'stats'),canonical);assert.equal(g.run('rngCalls'),0);
});

test('save payload/version unchanged, invalid load atomic, successful/fresh load never resumes a party',()=>{
  const g=fresh();g.run("resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);saveGame();");
  const raw=g.run("localStorage.getItem('verdantVale_save')");assert.ok(raw);
  installed(g);rejected(g,'combat.active=true');
  inert(g,()=>assert.equal(g.run('saveGame()'),false));
  assert.equal(g.run('SAVE_VERSION'),4);assert.doesNotMatch(raw,/combat_party|fixture_amber|characterId|party|instanceId/);
  g.run("localStorage.setItem('verdantVale_save','{bad');");
  inert(g,()=>assert.equal(g.run('loadGame()'),false));
  g.run('localStorage.setItem("verdantVale_save",'+JSON.stringify(raw)+')');
  assert.equal(g.run('loadGame()'),true);assert.equal(g.run('combatPlayerState.hasParty()'),false);
  assert.equal(g.run('combatPlayerState.getView()'),null);
  assert.equal(g.run('saveGame()'),true);assert.equal(g.run('localStorage.getItem("verdantVale_save")'),raw);
  const h=fresh();h.run('localStorage.setItem("verdantVale_save",'+JSON.stringify(raw)+')');
  assert.equal(h.run('loadGame()'),true);assert.equal(h.run('combatPlayerState.getView()'),null);
});

test('live records, stale callbacks and extra initialization arguments fail before installation',()=>{
  const g=fresh();g.run('combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};descriptors[1]=combat.enemies[0];');
  rejected(g,pair);g.run('combat.enemy=null;descriptors='+fixtures);installed(g);
  g.run('var previousMembers=combatPlayerState.getView().members;combatPlayerState.clear();descriptors=previousMembers;');
  rejected(g,pair);g.run('descriptors='+fixtures);rejected(g,'combatPlayerState.initialize(descriptors,true)');
  const v=installed(g);assert.equal(v.members[0].instanceId,'combat_party_3');
  g.run('combatPlayerState.clear();combatPlayerState.clear();');assert.equal(g.run('combatPlayerState.getView()'),null);
});

test('dead enemies and unresolved singleton receipts do not masquerade as preparation',()=>{
  for(const setup of [
    'combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,hp:0}',
    'completedSingleVictoryReceipt={message:"victory"}',
    'combat.enemies=[]',
  ]) {
    const g=fresh();g.run(setup);rejected(g,pair);
  }
});

test('invalid location load preserves party and member identity until a valid load commits',()=>{
  const g=fresh();g.run("resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);saveGame();");
  g.run("var saved=JSON.parse(localStorage.getItem('verdantVale_save'));saved.location={kind:'discrete',mapId:'NO_SUCH_MAP',x:16,y:16};localStorage.setItem('verdantVale_save',JSON.stringify(saved));");
  installed(g);inert(g,()=>assert.equal(g.run('loadGame()'),false));
  assert.equal(g.run('combatPlayerState.getMember("combat_party_1").characterId'),'fixture_amber');
});

test('old deferred singleton callbacks remain inert with a prepared party',()=>{
  const g=fresh();g.run('combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};var deferred=bindCombatEnemyEffect(combat.enemies[0].instanceId,()=>{stats.hp=0;Math.random();});');
  installed(g);inert(g,()=>g.run('deferred()'));
});

test('cleanup resumes identical canonical singleton combat without new setup',()=>{
  const baseline=fresh(),prepared=fresh();installed(prepared);
  prepared.run('combatPlayerState.setHp("combat_party_1",0);combatPlayerState.setStatuses("combat_party_2",["burn"]);combatPlayerState.clear();');
  for(const g of [baseline,prepared]) g.run('Math.random=()=>0.5;startWardenCombat();handleCombatAction();');
  assert.equal(snapshot(prepared),snapshot(baseline));
});

test('only the isolated Party Lab initializes members; no mutation caller or persistent party authority',()=>{
  const files=scriptOrderFromIndexHtml();
  for(const file of files) {
    const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.equal((source.match(/combatPlayerState\.initialize\s*\(/g)||[]).length,0,file);
    assert.equal((source.match(/combatPlayerState\.initializeCommandParty\s*\(/g)||[]).length,file==='party-combat-lab.js'?1:0,file);
    assert.doesNotMatch(source,/combatPlayerState\.(setHp|setStatuses)\s*\(/,file);
  }
  const g=fresh();assert.deepEqual(J(g,'QUEST_FLAG_BINDINGS.filter(b=>/party|ally|combat_party/.test(b.key)).map(b=>b.key)'),[]);
});

module.exports={name:'gated player-party state: atomic ownership, execution guards and save isolation',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' player-party foundation checks passed');}};
