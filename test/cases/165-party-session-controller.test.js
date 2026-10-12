'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run}),HIT=[0.5,0.99,0.99];
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const equal=(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
function fresh(count=2) {
  const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;menu.open=false;Math=Object.create(Math);
    var rngCalls=0,getterCalls=0;Math.random=()=>{rngCalls++;throw Error('unexpected RNG');};
    ${count===1?'combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};':'initializeFormationState('+JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:'enemy_marsh_wisp',slot})))+');'}
    combat.enemies.forEach(e=>Object.assign(e,{hp:100,maxHp:100,atk:10,def:3,spd:10}));
    var fixtures=[{characterId:'fixture_amber',slot:0,name:'Amber',hp:100,maxHp:100,atk:10,def:3,spd:10,statuses:[]},
      {characterId:'fixture_cobalt',slot:1,name:'Cobalt',hp:100,maxHp:100,atk:10,def:3,spd:10,statuses:[]}];
    combatPlayerState.initialize(fixtures);var controller=combatPlayerState.session;`);return g;
}
const view=g=>g.run('controller.getView()');
const hp=g=>J(g,'[...combatPlayerState.getView().members,...combat.enemies].map(m=>m.hp)');
function state(g) {return g.run(`JSON.stringify({combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([k,d])=>k!=='enemies'&&Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),
  party:combatPlayerState.getView(),round:combatPlayerState.getRoundView(),session:(()=>{try{return controller.getView();}catch(e){return e.message;}})(),
  enemies:combat.enemies.map(e=>Object.getOwnPropertyDescriptors(e)),enemySequence:combatEnemyInstanceSequence,stats,statusEffects,slitherSpd,player,day,dialogue,choice,
  flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save')})`);}
function frozen(value) {if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));for(const d of Object.values(Object.getOwnPropertyDescriptors(value))){assert.ok(Object.hasOwn(d,'value'));frozen(d.value);}}else assert.notEqual(typeof value,'function');}
function reject(g,source) {
  const before=state(g),calls=g.run('rngCalls'),members=g.run('combat.enemies');
  assert.throws(()=>g.run(source),/Invalid party session|Unsupported party|Invalid player-party|Party session owns|Unsupported formation entry|Prepared player party/);
  assert.equal(state(g),before);assert.equal(g.run('rngCalls'),calls);assert.equal(g.run('getterCalls'),0);assert.equal(g.run('combat.enemies'),members);
}
function submit(g,targetId) {
  const v=view(g),target=targetId||v.enemies.find(e=>e.hp>0).instanceId;
  return g.run('controller.submitAttack('+JSON.stringify({actorId:v.nextActorId,targetId:target})+')');
}
function ready(g,separate=false) {if(!view(g))g.run('controller.begin()');let i=0;while(view(g).phase==='collecting'){const v=view(g),enemies=v.enemies.filter(e=>e.hp>0);submit(g,enemies[(separate?i:0)%enemies.length].instanceId);i++;}return view(g);}
function taped(g,source,tape,hook='') {
  g.run('var tape='+JSON.stringify(tape)+';var used=[];Math.random=()=>{rngCalls++;'+hook+'if(used.length>=tape.length)throw Error("injected RNG failure");const v=tape[used.length];used.push(v);return v;};');
  try {const result=g.run(source);equal(J(g,'used'),tape);return result;}
  finally {g.run('Math.random=()=>{rngCalls++;throw Error("unexpected RNG");};');}
}
function commit(g,targets,initiative,attacks) {
  const v=view(g),allies=v.party.filter(m=>m.hp>0),enemies=v.enemies.filter(m=>m.hp>0),actors=allies.length+enemies.length;
  const targetTape=allies.length>1?(targets||enemies.map(()=>0)):[];
  return taped(g,'controller.commitRound()',[...targetTape,...(initiative||Array(actors-1).fill(0)),...Array.from({length:attacks??actors},()=>HIT).flat()]);
}
function finish(g) {
  let v=view(g),before=hp(g),calls=g.run('rngCalls'),round=g.run('combatPlayerState.getRoundView().completedRounds');
  while(v.phase==='playback') {
    const index=v.frameIndex;v=g.run('controller.advancePlayback()');assert.equal(v.frameIndex,index+1);frozen(v);equal(hp(g),before);
    assert.equal(g.run('rngCalls'),calls);assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),round);
  }
  assert.equal(v.phase,'playback_complete');assert.equal(v.awaitingAcknowledgement,true);return v;
}

for(const count of [1,2,3])test('2v'+count+' begin, sequential commands, single resolution, frame stepping and acknowledgement',()=>{
  const g=fresh(count),canonical=J(g,'({stats,statusEffects,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');
  assert.equal(view(g),null);const begin=g.run('controller.begin()');frozen(begin);assert.equal(begin.phase,'collecting');assert.equal(begin.nextActorId,'combat_party_1');
  assert.equal(begin.enemyActions.length,0);assert.equal(begin.allyActions.length,0);assert.equal(g.run('rngCalls'),0);
  const first=submit(g);assert.equal(first.nextActorId,'combat_party_2');assert.equal(first.allyActions.length,1);
  const queued=submit(g);assert.equal(queued.phase,'ready');assert.equal(queued.nextActorId,null);assert.equal(g.run('rngCalls'),0);
  const result=commit(g);assert.equal(result.phase,'playback');assert.equal(result.frameIndex,0);assert.equal(result.completedRounds,0);
  equal(result.party.map(m=>m.hp),[100,100]);equal(result.enemies.map(m=>m.hp),Array(count).fill(100));
  assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),1);assert.equal(g.run('combat.active'),false);
  equal(result.enemyActions.map(a=>a.actorId),result.enemies.map(e=>e.instanceId));equal(result.enemyActions.map(a=>a.targetId),Array(count).fill('combat_party_1'));
  const stable=JSON.stringify(result);for(let i=0;i<3;i++)equal(view(g),result);
  finish(g);reject(g,'controller.advancePlayback()');reject(g,'controller.commitRound()');reject(g,'controller.begin()');
  const next=g.run('controller.acknowledgePlayback()');assert.equal(next.phase,'collecting');assert.equal(next.nextActorId,'combat_party_1');
  assert.equal(next.completedRounds,1);assert.equal(next.playbackFrame,null);assert.equal(next.allyActions.length,0);assert.equal(next.enemyActions.length,0);
  reject(g,'controller.acknowledgePlayback()');assert.equal(JSON.stringify(result),stable);
  equal(J(g,'({stats,statusEffects,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})'),canonical);
  ready(g);commit(g);finish(g);g.run('controller.acknowledgePlayback()');assert.equal(view(g).completedRounds,2);
});
test('backtracking reopens the last living slot without RNG, HP change or enemy planning',()=>{
  const g=fresh();g.run('controller.begin()');reject(g,'controller.backtrack()');const before=hp(g);
  const first=submit(g);const saved=JSON.stringify(first);g.run('controller.backtrack()');assert.equal(view(g).nextActorId,'combat_party_1');
  submit(g,'combat_enemy_2');submit(g,'combat_enemy_1');assert.equal(view(g).phase,'ready');
  g.run('controller.backtrack()');assert.equal(view(g).nextActorId,'combat_party_2');assert.equal(view(g).allyActions[0].targetId,'combat_enemy_2');
  submit(g,'combat_enemy_2');assert.equal(view(g).phase,'ready');assert.equal(g.run('rngCalls'),0);equal(hp(g),before);
  assert.equal(JSON.stringify(first),saved);assert.equal(view(g).enemyActions.length,0);
});
for(const roll of [0,0.499999,0.5,1-Number.EPSILON/2])test('uniform enemy target interval at '+roll,()=>{
  const g=fresh(3);ready(g);const result=commit(g,[roll,roll,roll]);
  equal(result.enemyActions.map(a=>a.targetId),Array(3).fill(roll<0.5?'combat_party_1':'combat_party_2'));
  assert.equal(g.run('used.length'),3+4+5*3);frozen(result.enemyActions);
});
test('defeated ally slots are skipped and a sole living ally consumes no target draws',()=>{
  const g=fresh(3);g.run('combatPlayerState.setHp("combat_party_1",0);');const v=g.run('controller.begin()');assert.equal(v.nextActorId,'combat_party_2');
  reject(g,'controller.submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_1"})');submit(g);
  const result=commit(g);equal(result.enemyActions.map(a=>a.targetId),Array(3).fill('combat_party_2'));
  assert.equal(g.run('used.length'),3+4*3,'three initiative draws plus four executing attacks; zero target draws');
  finish(g);const next=g.run('controller.acknowledgePlayback()');assert.equal(next.nextActorId,'combat_party_2');equal(next.party.map(m=>m.slot),[0,1]);assert.equal(next.party[0].hp,0);
});
test('retained committed target dies: cancellation and dead actor skip never retarget',()=>{
  const g=fresh(3);g.run('combatPlayerState.setHp("combat_party_1",1);');ready(g);
  // E0 kills A0; E1 keeps its dead target and cancels; A0 is skipped.
  const result=commit(g,[0,0,0.999],[0.5,0.625,0,0],3);
  equal(result.enemyActions.map(a=>a.targetId),['combat_party_1','combat_party_1','combat_party_2']);
  const events=[];while(view(g).phase==='playback'){const v=g.run('controller.advancePlayback()');events.push(v.playbackFrame.currentEvent);}
  assert.equal(events[0].actorId,'combat_enemy_1');assert.equal(events[1].type,'cancel');assert.equal(events[1].reason,'target_dead');
  assert.equal(events[2].type,'skip');assert.equal(events[2].reason,'actor_dead');
  const next=g.run('controller.acknowledgePlayback()');assert.equal(next.nextActorId,'combat_party_2');
  reject(g,'controller.submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_1"})');
});
test('dead enemies keep slots and receive no action on subsequent rounds',()=>{
  const g=fresh();g.run('combat.enemies[0].hp=1;');ready(g);const first=commit(g,[0,0],undefined,2);
  assert.equal(first.enemyActions.length,2);finish(g);const next=g.run('controller.acknowledgePlayback()');
  equal(next.enemies.map(e=>e.hp),[0,100]);equal(next.enemies.map(e=>e.slot),[0,1]);
  reject(g,'controller.submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_1"})');ready(g);
  const second=commit(g,[0.999]);equal(second.enemyActions.map(a=>a.actorId),['combat_enemy_2']);
});
for(const outcome of ['victory','defeat'])test(outcome+' requires final-frame acknowledgement, locks terminal state and grants nothing',()=>{
  const g=fresh(),canonical=J(g,'({stats,statusEffects,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');
  g.run(outcome==='victory'?'combat.enemies.forEach(e=>e.hp=1);':'combatPlayerState.setHp("combat_party_1",1);combatPlayerState.setHp("combat_party_2",1);');
  ready(g,true);commit(g,[0,0.999],outcome==='victory'?[0,0,0]:[0.625,0.875,0],2);
  assert.equal(view(g).terminalOutcome,null);reject(g,'controller.acknowledgePlayback()');
  const final=finish(g);assert.equal(final.terminalOutcome,null);assert.equal(final.playbackFrame.outcome,outcome);
  reject(g,'controller.commitRound()');const terminal=g.run('controller.acknowledgePlayback()');assert.equal(terminal.phase,outcome);assert.equal(terminal.terminalOutcome,outcome);frozen(terminal);
  for(const op of ['begin()','submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_1"})','backtrack()','commitRound()','advancePlayback()','acknowledgePlayback()'])reject(g,'controller.'+op);
  equal(J(g,'({stats,statusEffects,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})'),canonical);assert.equal(g.run('combat.active'),false);
});

for(const change of [
  'combatPlayerState.clear()','combat.enemy=null','combat.pendingVictory=true','combat.pendingDefeat=true','combat.pendingEscape=true',
  'combat.message="pending"','combat.messageQueue=["pending"]','dialogue.callbacks=[()=>{}]','dialogue.open=true','debugMenu.open=true',
  'combat.enemies[0].hp=0;combat.enemies[1].hp=0','combatPlayerState.setHp("combat_party_1",0);combatPlayerState.setHp("combat_party_2",0)',
  'combatPlayerState.setStatuses("combat_party_1",["burn"])','combat.enemies[0].isBoss=true','combat.enemies[0].regenPerTurn=2',
  'combat.enemies[0].id="enemy_gallery_receiver"','combat.enemies[0].atk=Number.MAX_SAFE_INTEGER','combat.enemies[0].spd=Infinity',
  'Object.defineProperty(combat.enemies[0],"hp",{get(){getterCalls++;return 10;}})',
])test('begin fails atomically on invalid preparation: '+change,()=>{const g=fresh();g.run(change);reject(g,'controller.begin()');});
test('all possible enemy targets are numerically checked before any random choice',()=>{
  const g=fresh();g.run('combatPlayerState.clear();fixtures[0].def=6000000000000000;fixtures[1].def=0;combatPlayerState.initialize(fixtures);combat.enemies[0].atk=6000000000000000;');
  assert.equal(g.run('attackNumbersAreSafe(combat.enemies[0].atk,playerIncomingMitigation(combat.enemies[0].atk,fixtures[0].def,false))'),true);
  assert.equal(g.run('attackNumbersAreSafe(combat.enemies[0].atk,0)'),false);reject(g,'controller.begin()');
});
for(const change of [
  'request.actorId="combat_party_999"','request.actorId="combat_party_2"','request.actorId="combat_enemy_1"',
  'request.targetId="combat_enemy_999"','request.targetId="combat_party_2"','request.targetId={}','request.actorId=()=>{}',
  'request.type="attack"','request.callback=()=>{}','delete request.targetId','Object.setPrototypeOf(request,{})',
  'Object.defineProperty(request,"actorId",{get(){getterCalls++;return "combat_party_1";}})',
  'Object.defineProperty(request,"targetId",{get(){getterCalls++;return "combat_enemy_1";}})',
])test('closed exact ally action rejects: '+change,()=>{const g=fresh();g.run('controller.begin();var request={actorId:"combat_party_1",targetId:"combat_enemy_1"};'+change);reject(g,'controller.submitAttack(request)');});
test('wrong arity, duplicates, early commit and invalid phases consume no RNG',()=>{
  const g=fresh();for(const op of ['begin(true)','submitAttack({})','backtrack()','commitRound()','advancePlayback()','acknowledgePlayback()','getView(true)'])reject(g,'controller.'+op);
  g.run('controller.begin()');for(const op of ['begin()','backtrack()','commitRound()','advancePlayback()','acknowledgePlayback()','submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_1"},true)'])reject(g,'controller.'+op);
  submit(g);reject(g,'controller.submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_1"})');submit(g);
  for(const op of ['submitAttack({actorId:"combat_party_2",targetId:"combat_enemy_1"})','commitRound(true)','backtrack(true)','advancePlayback()','acknowledgePlayback()'])reject(g,'controller.'+op);
  commit(g);for(const op of ['submitAttack({})','backtrack()','commitRound()','begin()','advancePlayback(true)','acknowledgePlayback()'])reject(g,'controller.'+op);
  finish(g);reject(g,'controller.acknowledgePlayback(true)');
});
for(const change of ['combat.enemy=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp}',
  'combat.enemies=Object.freeze(combat.enemies.map(e=>Object.defineProperties({...e},Object.getOwnPropertyDescriptors(e))))',
  'combat.enemies[0].hp-=1','combat.enemies[0].spd+=1','combat.enemies[0].observeCount+=1','combat.message="pending"'])
  for(const stage of ['collecting','ready','playback','playback_complete'])test('stale binding rejects in '+stage+': '+change,()=>{
    const g=fresh();g.run('controller.begin()');if(stage!=='collecting')ready(g);if(['playback','playback_complete'].includes(stage))commit(g);if(stage==='playback_complete')finish(g);
    g.run(change);reject(g,'controller.getView()');
    reject(g,stage==='collecting'?'controller.submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_1"})':stage==='ready'?'controller.commitRound()':stage==='playback'?'controller.advancePlayback()':'controller.acknowledgePlayback()');
  });
test('active session owns scheduling and member mutation, including unresolved playback',()=>{
  const g=fresh();ready(g);
  for(const source of ['combatPlayerState.resolveAttackRound({})','combatPlayerState.setHp("combat_party_1",1)','combatPlayerState.setStatuses("combat_party_1",[])','combat.active=true','formationSessionController.begin()'])reject(g,source);
  commit(g);reject(g,'combatPlayerState.resolveAttackRound({})');finish(g);reject(g,'combatPlayerState.resolveAttackRound({})');
});
test('orphaned standalone round cannot be adopted as a fresh session',()=>{
  const g=fresh(1);taped(g,'combatPlayerState.resolveAttackRound({type:"attack-round",allyActions:[{actorId:"combat_party_1",targetId:"combat_enemy_1"},{actorId:"combat_party_2",targetId:"combat_enemy_1"}],enemyActions:[{actorId:"combat_enemy_1",targetId:"combat_party_1"}]})',[0,0,...HIT,...HIT,...HIT]);
  reject(g,'controller.begin()');
});
for(const bad of ['NaN','Infinity','-1','1'])test('invalid target RNG '+bad+' faults without HP changes or retry',()=>{
  const g=fresh();ready(g);const before=hp(g);g.run('Math.random=()=>{rngCalls++;return '+bad+';};');
  assert.throws(()=>g.run('controller.commitRound()'),/Invalid party target RNG/);equal(hp(g),before);assert.equal(g.run('rngCalls'),1);
  equal(view(g).failure,{stage:'targets',targetDraws:1,completedRounds:0});assert.equal(view(g).phase,'fault');reject(g,'controller.commitRound()');
});
for(const op of ['controller.commitRound()','controller.backtrack()','combatPlayerState.clear()','combatPlayerState.setHp("combat_party_1",1)','combatPlayerState.resolveAttackRound({})'])test('target planning blocks reentrant '+op,()=>{
  const g=fresh();ready(g);const before=hp(g);g.run('Math.random=()=>{rngCalls++;'+op+';return 0;};');
  assert.throws(()=>g.run('controller.commitRound()'),/Invalid party session|Invalid player-party|Party session owns/);equal(hp(g),before);assert.equal(view(g).phase,'fault');assert.equal(g.run('rngCalls'),1);
});
test('replaced membership during target RNG stops before scheduler execution',()=>{
  const g=fresh();ready(g);g.run('Math.random=()=>{rngCalls++;combat.enemy=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};return 0;};');
  assert.throws(()=>g.run('controller.commitRound()'),/Invalid party session/);assert.equal(view(g).failure.stage,'targets');assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),0);
});
test('scheduler failure retains applied HP, targets and diagnostics without a second resolution',()=>{
  const g=fresh();ready(g);
  assert.throws(()=>taped(g,'controller.commitRound()',[0,0,0,0,0,...HIT]),/injected RNG failure/);
  equal(hp(g),[100,100,93,100]);const v=view(g);assert.equal(v.phase,'fault');assert.equal(v.failure.stage,'resolve');assert.equal(v.enemyActions.length,2);
  assert.equal(g.run('combatPlayerState.getRoundView().phase'),'fault');reject(g,'controller.commitRound()');reject(g,'controller.begin()');
});
test('playback failure retains completed authoritative round and locks retries',()=>{
  const g=fresh();ready(g);g.run('var originalCopy=copyFormationData;copyFormationData=function(value){if(value&&value.events&&combatPlayerState.getRoundView().completedRounds===1)throw Error("injected playback failure");return originalCopy(value);};');
  assert.throws(()=>commit(g),/Invalid party Attack playback history/);g.run('copyFormationData=originalCopy;');
  assert.equal(view(g).phase,'fault');equal(view(g).failure,{stage:'playback',targetDraws:2,completedRounds:1});assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),1);
  equal(hp(g),[86,100,86,100]);reject(g,'controller.commitRound()');
});
test('explicit preparation cleanup drops only session state; old views stay immutable and stale actors reject',()=>{
  const g=fresh();ready(g);const old=commit(g),saved=JSON.stringify(old);g.run('combatPlayerState.clear();');assert.equal(view(g),null);
  assert.equal(g.run('combat.enemies[0].hp'),86);g.run('combat.enemy=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};combatPlayerState.initialize(fixtures);controller.begin();');
  reject(g,'controller.submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_3"})');assert.equal(view(g).nextActorId,'combat_party_3');assert.equal(JSON.stringify(old),saved);
});
test('no gameplay entry, input/render/reward route or saved controller payload',()=>{
  const g=fresh();ready(g);const before=state(g);g.press('Enter');g.press('ArrowRight');g.frames(3);assert.equal(state(g),before);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('SAVE_VERSION'), 5);
  for(const source of ['drawCombat()','handleCombatAction()','endCombat()','recoverCombatDefeat()'])reject(g,source);
  const labCalls={begin:1,submitAttack:0,backtrack:0,commitRound:0,advancePlayback:0,acknowledgePlayback:0};
  for(const file of scriptOrderFromIndexHtml()) {
    const fileSource=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
    for(const [method,count] of Object.entries(labCalls))assert.equal((fileSource.match(new RegExp('combatPlayerState\\.session\\.'+method+'\\s*\\(','g'))||[]).length,file==='party-combat-lab.js'?count:0,file+': '+method);
    assert.equal((fileSource.match(/combatPlayerState\.session\[method\]\s*\(/g)||[]).length,file==='party-combat-lab.js'?1:0,file+': guarded forwarder');
  }
  const source=fs.readFileSync(path.join(__dirname,'../../combat.js'),'utf8');
  const start=source.indexOf('  const session=(() => {'),end=source.indexOf('    session,',start),controllerSource=source.slice(start,end);
  assert.equal((controllerSource.match(/combatPlayerState\.resolveAttackRound\s*\(/g)||[]).length,1,'one scheduler call site');
  assert.equal((controllerSource.match(/combatPlayerState\.createAttackRoundPlayback\s*\(/g)||[]).length,1,'one playback creation call site');
  const old=view(g),serial=JSON.stringify(old);frozen(old);assert.throws(()=>{old.allyActions[0].targetId='bad';});assert.throws(()=>old.party.pop());assert.equal(JSON.stringify(old),serial);
});
module.exports={name:'gated party session: exact command collection, uniform targets, one-shot resolution and acknowledged playback',checks,
  run(){for(const check of checks){try{check.run();}catch(error){console.error('Failed party session check:',check.name);throw error;}}console.log('  '+checks.length+' party session checks passed');}};
