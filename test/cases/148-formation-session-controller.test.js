'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const {createContext}=require('../harness');
const ROOT=path.join(__dirname,'../..');
const API='formationSessionController';
const HIT=[0.5,0.99,0.99];
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,source)=>JSON.parse(g.run('JSON.stringify('+source+')'));
const code=(method,args=[])=>API+'.'+method+'('+args.map(value=>JSON.stringify(value)).join(',')+')';
const call=(g,method,args=[])=>g.run(code(method,args));
const view=g=>J(g,API+'.getView()');
const hp=g=>J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]');

function fresh(count=2,duplicate=false) {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=function(){throw Error('RNG outside exact confirmation tape');};
    dialogue.open=false;menu.open=false;statusEffects=[];
    stats.hp=100;stats.maxHp=100;stats.atk=8;stats.def=2;stats.spd=7;
    stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;stats.items=[];`);
  if(count) {
    const ids=['enemy_marsh_wisp','enemy_briar_hound','enemy_sluice_slime'];
    g.run('initializeFormationState('+JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:ids[duplicate?0:slot],slot})))+');');
  }
  return g;
}
function snapshot(g) {
  return g.run(`JSON.stringify({combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat))
      .filter(([,d])=>Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),
    mode:combat.mode,active:combat.active,stats:stats,status:statusEffects,
    observations:combat.enemies.map(e=>[e.observeCount,e.escapeUnlocked]),sequence:combatEnemyInstanceSequence,
    flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),dialogue:dialogue,day:day,
    save:localStorage.getItem('verdantVale_save')})`);
}
function unchanged(g,work) {
  const before=snapshot(g),members=g.run('combat.enemies');const result=work();
  assert.equal(snapshot(g),before);assert.equal(g.run('combat.enemies'),members);return result;
}
function rejected(g,method,args=[]) {
  const before=view(g);
  unchanged(g,()=>assert.throws(()=>call(g,method,args),/Invalid formation|Unsupported formation basic Attack/));
  assert.deepEqual(view(g),before,'invalid operation does not change the private session');
}
function confirm(g,tape) {
  const previous=g.run('Math.random');
  const used=g.run(`(function(){var tape=${JSON.stringify(tape)},used=[];
    Math.random=function(){if(used.length===tape.length)throw Error('RNG tape exhausted');
      var value=tape[used.length];used.push(value);return value;};return used;})()`);
  try {
    const result=call(g,'confirmTarget');
    assert.deepEqual(Array.from(used),tape,'no exhausted or unused confirmation RNG');
    return result;
  } finally {g.run('Math').random=previous;}
}
function finishFrames(g) {
  while(view(g).phase==='playback') unchanged(g,()=>call(g,'advancePlayback'));
  assert.equal(view(g).phase,'playback_complete');
}
function beginTargeting(g) {call(g,'begin');call(g,'beginAttack');}
function enterPhase(phase) {
  const g=fresh();call(g,'begin');if(phase==='awaiting_action')return g;
  if(phase==='victory')g.run('stats.atk=100;combat.enemies[1].hp=0;');
  if(phase==='defeat')g.run('stats.hp=1;');
  call(g,'beginAttack');if(phase==='targeting')return g;
  confirm(g,phase==='victory'?[0,...HIT]:phase==='defeat'?[0.99,0.99,...HIT]:[0,0,...HIT,...HIT,...HIT]);
  if(phase==='playback')return g;
  finishFrames(g);if(phase==='playback_complete')return g;
  call(g,'acknowledgePlayback');assert.equal(view(g).phase,phase);return g;
}
function frozenTree(value) {
  if(value && typeof value==='object') {
    assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozenTree);
  } else assert.notEqual(typeof value,'function');
}

for(const count of [2,3]) test('begin '+count+'-member session is inert and selects no target',()=>{
  const g=fresh(count);assert.equal(view(g),null);
  g.run(`resolveFormationRound=createFormationRoundPlayback=function(){throw Error('premature resolution or playback');};`);
  const result=unchanged(g,()=>call(g,'begin'));frozenTree(result);
  assert.deepEqual(view(g),{
    phase:'awaiting_action',availableActions:['attack','item','observe','run'],
    commandCursor:0,selectedCommand:'attack',selectedItemId:null,
    items:[],itemCursor:0,itemWindowStart:0,itemVisibleRows:3,playerStatuses:[],evadeTurns:0,
    player:J(g,"({id:'player',name:stats.name,hp:stats.hp,maxHp:stats.maxHp})"),
    enemies:J(g,'combat.enemies.map(e=>({instanceId:e.instanceId,templateId:e.id,slot:e.slot,hp:e.hp,maxHp:e.maxHp}))'),
    livingTargetInstanceIds:Array.from({length:count},(_,i)=>'combat_enemy_'+(i+1)),
    selectedTargetInstanceId:null,playbackFrame:null,awaitingAcknowledgement:false,terminalOutcome:null,
  });
  assert.equal(g.run('combat.active'),false);
});

for(const setup of [
  '', 'startWardenCombat();',
]) test('empty/singleton combat rejects every session mutation: '+setup,()=>{
  const g=fresh(0);g.run(setup);
  for(const method of ['begin','beginAttack','moveTarget','cancelTargeting','confirmTarget','advancePlayback','acknowledgePlayback']) {
    rejected(g,method,method==='moveTarget'?['next']:[]);
  }
});

for(const setup of [
  'combat.enemies=Object.freeze([combat.enemies[0]]);',
  'combat.enemies=Object.freeze([combat.enemies[0],combat.enemies[0]]);',
  'combat.enemies=Object.freeze([combat.enemies[1],combat.enemies[0]]);',
  'combat.enemies[0].hp=NaN;', 'stats.hp=0;', 'combat.enemies.forEach(e=>e.hp=0);',
  'statusEffects=["unknown"];', 'combat.messageQueue=["pending"];', 'combat.pendingVictory=true;',
  'combat.bombFuse=1;', 'combat.isLenswebSpider=true;', 'combat.enemies[0].counterChance=0.5;',
]) test('invalid or terminal state rejects session start atomically: '+setup,()=>{
  const g=fresh();g.run(setup);rejected(g,'begin');assert.equal(view(g),null);
});

test('targeting/cancellation do not resolve or mutate combat, and select the lowest living slot',()=>{
  const g=fresh(3);g.run('combat.enemies[0].hp=0;');call(g,'begin');
  const initial=view(g);
  unchanged(g,()=>call(g,'beginAttack'));
  assert.equal(view(g).phase,'targeting');assert.equal(view(g).selectedTargetInstanceId,'combat_enemy_2');
  unchanged(g,()=>call(g,'moveTarget',['next']));
  unchanged(g,()=>call(g,'cancelTargeting'));assert.deepEqual(view(g),initial);
  unchanged(g,()=>call(g,'beginAttack'));assert.equal(view(g).selectedTargetInstanceId,'combat_enemy_2');
});

test('target movement wraps both ways, skips dead slots, and never reorders membership',()=>{
  const g=fresh(3);g.run('combat.enemies[1].hp=0;');beginTargeting(g);
  const members=g.run('combat.enemies');
  for(const [direction,id] of [['previous','combat_enemy_3'],['next','combat_enemy_1'],['next','combat_enemy_3'],['next','combat_enemy_1']]) {
    unchanged(g,()=>call(g,'moveTarget',[direction]));assert.equal(view(g).selectedTargetInstanceId,id);
  }
  assert.equal(g.run('combat.enemies'),members);assert.deepEqual(J(g,'combat.enemies.map(e=>e.slot)'),[0,1,2]);
});

test('same-template targets remain distinct and one survivor stays selected',()=>{
  const g=fresh(3,true);beginTargeting(g);
  for(const id of ['combat_enemy_2','combat_enemy_3','combat_enemy_1']) {
    unchanged(g,()=>call(g,'moveTarget',['next']));assert.equal(view(g).selectedTargetInstanceId,id);
  }
  g.run('combat.enemies[1].hp=0;combat.enemies[2].hp=0;');
  for(const direction of ['previous','next']) {
    unchanged(g,()=>call(g,'moveTarget',[direction]));assert.equal(view(g).selectedTargetInstanceId,'combat_enemy_1');
  }
});

for(const direction of [null,0,1,-1,'left','Next','next ',{},['next']]) test('invalid movement rejects: '+JSON.stringify(direction),()=>{
  const g=fresh();beginTargeting(g);rejected(g,'moveTarget',[direction]);
});

const prohibited={
  awaiting_action:['moveTarget','cancelTargeting','confirmTarget','advancePlayback','acknowledgePlayback'],
  targeting:['beginAttack','advancePlayback','acknowledgePlayback'],
  playback:['beginAttack','moveTarget','cancelTargeting','confirmTarget','acknowledgePlayback'],
  playback_complete:['beginAttack','moveTarget','cancelTargeting','confirmTarget','advancePlayback'],
  victory:['beginAttack','moveTarget','cancelTargeting','confirmTarget','advancePlayback','acknowledgePlayback'],
  defeat:['beginAttack','moveTarget','cancelTargeting','confirmTarget','advancePlayback','acknowledgePlayback'],
};
for(const [phase,methods] of Object.entries(prohibited)) test('phase '+phase+' rejects invalid transitions and a second session',()=>{
  const g=enterPhase(phase);rejected(g,'begin');
  for(const method of methods)rejected(g,method,method==='moveTarget'?['next']:[]);
  rejected(g,'clearAfterCombatCleanup'); // no competing live-session cleanup
});

test('extra arguments cannot inject identities/actions, skip frames or bypass acknowledgement',()=>{
  const g=fresh();rejected(g,'begin',[{targetInstanceId:'combat_enemy_1'}]);beginTargeting(g);
  for(const [method,args] of [['confirmTarget',['combat_enemy_2']],['moveTarget',[]],['moveTarget',['next','next']],['cancelTargeting',['attack']]]) {
    rejected(g,method,args);
  }
  confirm(g,[0,0,...HIT,...HIT,...HIT]);rejected(g,'advancePlayback',[2]);finishFrames(g);rejected(g,'acknowledgePlayback',['victory']);
});

test('stale selected target cannot be moved, cancelled, confirmed or replaced by a same-template identity',()=>{
  const g=fresh(2,true);beginTargeting(g);const before=view(g),members=g.run('combat.enemies');
  g.run('combat.enemies[0].hp=0;');
  for(const method of ['moveTarget','cancelTargeting','confirmTarget'])rejected(g,method,method==='moveTarget'?['next']:[]);
  g.run(`combat.enemies[0].hp=14;var originalMembers=combat.enemies;
    combat.enemies=Object.freeze([createCombatEnemyInstance(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,0),combat.enemies[1]]);`);
  const state=snapshot(g);
  for(const method of ['moveTarget','cancelTargeting','confirmTarget']) {
    assert.throws(()=>call(g,method,method==='moveTarget'?['next']:[]),/stale state/);
    assert.equal(snapshot(g),state);
  }
  g.run('combat.enemies=originalMembers;');assert.equal(g.run('combat.enemies'),members);
  assert.deepEqual(view(g),before,'rejected stale operations left the private selection unchanged');
});

for(const setup of ['stats.hp=0;','stats.atk=Number.MAX_SAFE_INTEGER;',
  'combat.enemies[1].atk=Number.MAX_SAFE_INTEGER;','combat.enemies[1].regenPerTurn=1;',
  'combat.pendingEscape=true;','combat.bombFuse=1;','statusEffects=["unknown"];']) test('confirmation reruns complete resolver preflight: '+setup,()=>{
  const g=fresh();beginTargeting(g);g.run(setup);rejected(g,'confirmTarget');
  assert.equal(view(g).phase,'targeting');assert.equal(view(g).selectedTargetInstanceId,'combat_enemy_1');
});

test('confirmation resolves exactly once for selected duplicate and immediately constructs authentic frame zero',()=>{
  const g=fresh(2,true);beginTargeting(g);call(g,'moveTarget',['next']);const beforeHp=hp(g);
  g.run(`var calls=[],resolvedResult,createdReel,committedAction;
    var actualResolver=resolveFormationRound,actualPlayback=createFormationRoundPlayback;
    resolveFormationRound=function(action){calls.push('resolve');committedAction={...action};
      resolvedResult=actualResolver(action);return resolvedResult;};
    createFormationRoundPlayback=function(result){calls.push('create');if(result!==resolvedResult)throw Error('inauthentic result');
      createdReel=actualPlayback(result);return createdReel;};`);
  confirm(g,[0,0,...HIT,...HIT,...HIT]);
  assert.deepEqual(J(g,'calls'),['resolve','create']);
  assert.deepEqual(J(g,'committedAction'),{type:'attack',targetInstanceId:'combat_enemy_2'});
  const v=view(g);assert.equal(v.phase,'playback');assert.equal(v.selectedTargetInstanceId,null);
  assert.equal(v.playbackFrame.frameIndex,0);assert.equal(v.playbackFrame.currentEvent,null);
  assert.deepEqual([v.playbackFrame.player.hp,...v.playbackFrame.enemies.map(e=>e.hp)],beforeHp);
  assert.deepEqual(hp(g),[94,14,7]);
  assert.deepEqual(v.playbackFrame,J(g,'projectFormationPlaybackFrame(createdReel,0)'));
  rejected(g,'confirmTarget');assert.deepEqual(J(g,'calls'),['resolve','create']);
});

for(const initiative of [[0,0,0],[0.99,0.99,0.99],[0.99,0,0.99]]) test('every projected frame follows exact historical HP without RNG or damage replay: '+initiative,()=>{
  const g=fresh(3);beginTargeting(g);
  g.run(`var reel,actualCreate=createFormationRoundPlayback;createFormationRoundPlayback=function(result){reel=actualCreate(result);return reel;};`);
  confirm(g,[...initiative,...HIT,...HIT,...HIT,...HIT]);
  const finalHp=hp(g),count=g.run('reel.frameCount');
  for(let index=0;index<count;index++) {
    const v=unchanged(g,()=>view(g));
    assert.deepEqual(v.playbackFrame,J(g,'projectFormationPlaybackFrame(reel,'+index+')'));
    assert.equal(v.phase,index===count-1?'playback_complete':'playback');
    assert.equal(v.awaitingAcknowledgement,index===count-1);
    assert.deepEqual(hp(g),finalHp);
    if(index<count-1)unchanged(g,()=>call(g,'advancePlayback'));
  }
  const last=view(g);rejected(g,'advancePlayback');assert.deepEqual(view(g),last);
  unchanged(g,()=>call(g,'acknowledgePlayback'));assert.equal(view(g).phase,'awaiting_action');
  assert.equal(view(g).playbackFrame,null);assert.deepEqual(hp(g),finalHp);
});

for(const critical of [false,true]) for(const evaded of [false,true]) test('playback preserves recorded critical/evasion without controller rules: '+[critical,evaded],()=>{
  const g=fresh();beginTargeting(g);const before=hp(g);
  confirm(g,[0,0,0.5,critical?0:0.99,evaded?0:0.99,...HIT,...HIT]);
  const finalHp=hp(g);unchanged(g,()=>call(g,'advancePlayback'));
  const frame=view(g).playbackFrame,event=frame.currentEvent;
  assert.equal(event.critical,critical);assert.equal(event.evaded,evaded);
  assert.equal(frame.enemies[0].hp,event.hpAfter);assert.equal(event.hpBefore,before[1]);
  if(evaded)assert.equal(event.hpAfter,before[1]);
  finishFrames(g);unchanged(g,()=>call(g,'acknowledgePlayback'));assert.deepEqual(hp(g),finalHp);
});

test('one killed member is initially still historically visible; after acknowledgement targeting excludes it',()=>{
  const g=fresh();g.run('stats.atk=20;');beginTargeting(g);confirm(g,[0,0,...HIT,...HIT]);
  assert.deepEqual(view(g).livingTargetInstanceIds,['combat_enemy_1','combat_enemy_2']);
  assert.equal(g.run('combat.enemies[0].hp'),0);
  call(g,'advancePlayback');assert.deepEqual(view(g).livingTargetInstanceIds,['combat_enemy_2']);
  finishFrames(g);assert.equal(view(g).playbackFrame.outcome,'ongoing');
  rejected(g,'beginAttack');call(g,'acknowledgePlayback');call(g,'beginAttack');
  assert.equal(view(g).selectedTargetInstanceId,'combat_enemy_2');
  confirm(g,[0,...HIT,...HIT]);finishFrames(g);call(g,'acknowledgePlayback');
  assert.equal(view(g).phase,'awaiting_action');assert.equal(g.run('combat.enemies[1].hp'),7);
});

for(const outcome of ['victory','defeat']) test(outcome+' requires final-frame acknowledgement and remains terminal even if HP is externally changed',()=>{
  const g=fresh();g.run(outcome==='victory'?'stats.atk=100;combat.enemies[1].hp=0;':'stats.hp=1;');beginTargeting(g);
  confirm(g,outcome==='victory'?[0,...HIT]:[0.99,0.99,...HIT]);finishFrames(g);
  const final=view(g);assert.equal(final.terminalOutcome,null);assert.equal(final.playbackFrame.outcome,outcome);
  assert.equal(final.awaitingAcknowledgement,true);
  unchanged(g,()=>call(g,'acknowledgePlayback'));assert.equal(view(g).terminalOutcome,outcome);
  assert.deepEqual(view(g).playbackFrame,final.playbackFrame);
  g.run('stats.hp=100;combat.enemies.forEach(e=>e.hp=e.maxHp);');
  for(const method of prohibited[outcome])rejected(g,method,method==='moveTarget'?['next']:[]);
  assert.deepEqual(view(g).playbackFrame,final.playbackFrame,'terminal view retains history, not new live HP');
});

test('session API and views are deeply immutable, detached, and expose no mutable session authority',()=>{
  const g=enterPhase('playback'),v=call(g,'getView');frozenTree(v);
  const before=view(g),live=snapshot(g);assert.equal(g.run('typeof session'),'undefined');
  assert.ok(Object.isFrozen(g.run(API)));
  assert.notEqual(v.playbackFrame.player,g.run('stats'));
  v.playbackFrame.enemies.forEach((member,i)=>assert.notEqual(member,g.run('combat.enemies')[i]));
  for(const mutate of [()=>{v.phase='victory';},()=>v.livingTargetInstanceIds.push('fake'),
    ()=>{v.playbackFrame.player.hp=0;},()=>{v.playbackFrame.enemies[0].hp=0;}])assert.throws(mutate,{name:'TypeError'});
  assert.deepEqual(view(g),before);assert.equal(snapshot(g),live);
  call(g,'advancePlayback');assert.deepEqual(JSON.parse(JSON.stringify(v)),before,'retained view is historical');
});

for(const phase of Object.keys(prohibited)) test('established cleanup clears private session from '+phase,()=>{
  const g=enterPhase(phase),old=call(g,'getView'),copy=JSON.stringify(old);
  g.run('endCombat();');assert.equal(view(g),null);assert.equal(g.run('combat.mode'),null);
  assert.equal(g.run('combat.enemies.length'),0);assert.equal(JSON.stringify(old),copy);
  g.run('stats.hp=100;initializeFormationState([{enemyId:"enemy_marsh_wisp",slot:0},{enemyId:"enemy_marsh_wisp",slot:1}]);');
  assert.equal(view(g),null);call(g,'begin');assert.equal(view(g).phase,'awaiting_action');
  g.run('combat.enemy=null;startWardenCombat();');assert.equal(view(g),null);assert.equal(g.run('combat.mode'),'single');
});

test('only HP changes at confirmation; no messages, rewards, flags, finalizers, or save writes occur',()=>{
  const g=fresh();
  g.run(`var unwanted=0;applyKillRewards=endCombat=advanceCombatMessage=handleCombatAction=finalizeLenswebSpiderEvent=function(){unwanted++;throw Error('gameplay integration');};`);
  const before=JSON.parse(snapshot(g));beginTargeting(g);confirm(g,[0,0,...HIT,...HIT,...HIT]);finishFrames(g);call(g,'acknowledgePlayback');
  const after=JSON.parse(snapshot(g));after.stats.hp=before.stats.hp;
  after.combat.enemies.forEach((e,i)=>e.hp=before.combat.enemies[i].hp);
  assert.deepEqual(after,before);assert.equal(g.run('unwanted'),0);
});

test('saves exclude sessions and loading into cleared or fresh runtime cannot restore one',()=>{
  const g=fresh();g.run("resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);");
  assert.equal(g.run('saveGame()'),true);const raw=g.run("localStorage.getItem('verdantVale_save')");
  beginTargeting(g);assert.equal(g.run('saveGame()'),true);assert.equal(g.run("localStorage.getItem('verdantVale_save')"),raw);
  confirm(g,[0,0,...HIT,...HIT,...HIT]);assert.equal(g.run("localStorage.getItem('verdantVale_save')"),raw);
  assert.equal(g.run('saveGame()'),true);const saved=g.run("localStorage.getItem('verdantVale_save')");
  assert.doesNotMatch(saved,/formationSession|awaiting_action|targetInstanceId|playback|combat_enemy_/);
  const loaded=fresh(0);loaded.run("localStorage.setItem('verdantVale_save',"+JSON.stringify(saved)+');');
  assert.equal(loaded.run('loadGame()'),true);assert.equal(view(loaded),null);assert.equal(loaded.run('combat.mode'),null);
  g.run('combat.enemy=null;');assert.equal(g.run('loadGame()'),true);assert.equal(view(g),null);
});

test('controller callers are limited to the gated input and explicit developer lab presentation',()=>{
  const files=execFileSync('git',['ls-files','--','*.js','*.html'],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').filter(f=>!f.startsWith('test/'));
  for(const file of [...new Set([...files,'formation-lab.js'])]) {
    const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    if(file==='input.js') {
      assert.match(source,/combat\.mode === 'formation' && formationSessionController\.getView\(\)/);
      assert.doesNotMatch(source,/formationSessionController\.(begin|clearAfterCombatCleanup)\(/);
    } else if(file==='render.js') {
      assert.match(source,/formationCombatLab\.isActive\(\)/);
      assert.doesNotMatch(source,/formationSessionController\.(begin|beginAttack|confirmTarget|advancePlayback|acknowledgePlayback)\(/);
    // Definition, cleanup, entry check, and the read-only round/ack phase gates.
    } else if(!['formation-lab.js','gallery-receiver.js'].includes(file)) assert.equal((source.match(/\bformationSessionController\b/g)||[]).length,file==='combat.js'?5:0,file);
    assert.equal((source.match(/\binitializeFormationState\b/g)||[]).length,['combat.js','formation-lab.js','gallery-receiver.js'].includes(file)?1:0,file);
  }
  const source=fs.readFileSync(path.join(ROOT,'combat.js'),'utf8');
  const entry=source.slice(source.indexOf('function validateFormationEntry()'),source.indexOf('function validateFormationBasicAttackState('));
  assert.match(entry,/formationSessionController\.getView\(\) !== null/);
  assert.doesNotMatch(entry,/formationSessionController\.(?!getView)[a-zA-Z]+\(/);
  assert.match(source,/combatMode = null;\s*formationSessionController\.clearAfterCombatCleanup\(\);/);
  const g=enterPhase('playback'),before=view(g);
  const controller=source.slice(source.indexOf('const formationSessionController ='),source.indexOf('\n})();',source.indexOf('const formationSessionController =')));
  assert.doesNotMatch(controller,/Math\.random|stats\.hp\s*=|\.hp\s*=|combat\.enemy\b|combat\.active\s*=|applyKillRewards|endCombat\(|saveGame\(|handleCombatAction|advanceCombatMessage|ctx\.|drawCombat/);
  g.run(`var calls=0;resolveFormationBasicAttackRound=createFormationRoundPlayback=
    drawCombat=handleCombatAction=function(){calls++;};render();`);
  g.press('ArrowLeft');assert.equal(g.run('calls'),0);assert.equal(g.run('combat.active'),false);
  assert.throws(()=>g.run('combat.active=true'),/cannot activate/);
  for(const key of ['enemy','observeCount','escapeUnlocked'])assert.throws(()=>g.run('combat.'+key),/no singleton/);
  assert.deepEqual(view(g),before); // inert direction did not consume the reel
});

test('all eleven templates support headless sessions without changing pools or exposing encounters',()=>{
  const approved=J(fresh(0),'FORMATION_STATE_TEMPLATE_IDS');assert.equal(approved.length,11);
  for(const id of approved) {
    const g=fresh(0),pools=J(g,'ENEMY_TEMPLATE_POOLS');
    g.run('initializeFormationState('+JSON.stringify([0,1].map(slot=>({enemyId:id,slot})))+');');
    beginTargeting(g);call(g,'cancelTargeting');assert.equal(g.run('combat.active'),false);
    assert.deepEqual(J(g,'ENEMY_TEMPLATE_POOLS'),pools);
  }
});

module.exports={name:'headless formation sessions: private phases, exact targeting, one-time resolution and immutable playback',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' formation-session controller checks passed');}};
