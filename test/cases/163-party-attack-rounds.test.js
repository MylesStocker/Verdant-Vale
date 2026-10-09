'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const ROOT=path.join(__dirname,'../..'),checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const HIT=[0.5,0.99,0.99];
const setup=count=>`dialogue.open=false;dialogue.callbacks=null;menu.open=false;
  ${count===1?'combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};':
    'initializeFormationState('+JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:'enemy_marsh_wisp',slot})))+');'}
  for(const enemy of combat.enemies) Object.assign(enemy,{hp:100,maxHp:100,atk:10,def:3,spd:10});
  combatPlayerState.initialize([
    {characterId:'fixture_amber',slot:0,name:'Fixture Amber',hp:100,maxHp:100,atk:10,def:3,spd:10,statuses:[]},
    {characterId:'fixture_cobalt',slot:1,name:'Fixture Cobalt',hp:100,maxHp:100,atk:10,def:3,spd:10,statuses:[]}
  ]);`;
function commands(g) {g.run(`var command={type:'attack-round',
  allyActions:combatPlayerState.getView().members.filter(m=>m.hp>0).map((m,i)=>({actorId:m.instanceId,targetId:combat.enemies[i%combat.enemies.length].instanceId})),
  enemyActions:combat.enemies.filter(m=>m.hp>0).map((m,i)=>({actorId:m.instanceId,targetId:combatPlayerState.getView().members[i%2].instanceId}))};`);}
function fresh(count=1) {
  const g=createContext();g.run(setup(count));commands(g);
  g.run(`Math=Object.create(Math);var rngCalls=0,getterCalls=0;Math.random=()=>{rngCalls++;throw Error('unexpected RNG');};`);
  return g;
}
function snapshot(g) {return g.run(`JSON.stringify({
  combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).map(([k,d])=>[k,'value' in d?d.value:'accessor']).filter(([k])=>k!=='enemies')),
  enemies:combat.enemies.map(e=>Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(e)).map(([k,d])=>[k,'value' in d?d.value:'accessor']))),
  mode:combat.mode,active:combat.active,party:combatPlayerState.getView(),round:combatPlayerState.getRoundView(),
  enemyRound:formationRounds.getView(),coordination:formationRounds.coordination(),
  stats,statusEffects,slitherSpd,day,player,dialogue,choice,enemySequence:combatEnemyInstanceSequence,
  flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save')})`);}
function reject(g,source='combatPlayerState.resolveAttackRound(command)') {
  const before=snapshot(g),roster=g.run('combat.enemies');
  assert.throws(()=>g.run(source),/Unsupported party|Invalid formation|Invalid player-party|Unsupported formation entry/);
  assert.equal(snapshot(g),before);assert.equal(g.run('combat.enemies'),roster);assert.equal(g.run('rngCalls'),0);
  assert.equal(g.run('getterCalls'),0);
}
function actors(g) {return J(g,`[...command.allyActions.map(a=>({...a,side:'ally',slot:combatPlayerState.getMember(a.actorId).slot,spd:Math.max(1,combatPlayerState.getMember(a.actorId).spd)})),
  ...command.enemyActions.map(a=>({...a,side:'enemy',slot:combat.enemies.find(e=>e.instanceId===a.actorId).slot,spd:combat.enemies.find(e=>e.instanceId===a.actorId).spd}))].sort((a,b)=>(a.side==='ally'?0:1)-(b.side==='ally'?0:1)||a.slot-b.slot)`);}
// Select the midpoint of each desired actor's remaining weighted interval.
function orderTape(g,ids=actors(g).map(a=>a.actorId)) {
  const pool=actors(g),tape=[];
  for(const id of ids.slice(0,-1)) {
    const index=pool.findIndex(a=>a.actorId===id);assert.ok(index>=0);
    const weights=pool.map(a=>Math.max(1,a.spd));
    tape.push((weights.slice(0,index).reduce((a,b)=>a+b,0)+weights[index]/2)/weights.reduce((a,b)=>a+b,0));
    pool.splice(index,1);
  }
  return tape;
}
function synthetic(count,speeds=[]) {
  const allies=Math.ceil(count/2);
  return Array.from({length:count},(_,i)=>({actorId:'fixture_'+i,targetId:'target_'+i,
    side:i<allies?'ally':'enemy',slot:i<allies?i:i-allies,spd:speeds[i]??10}));
}
function plan(g,input,tape) {return g.run('planPartyAttackOrder('+JSON.stringify(input)+','+JSON.stringify(tape)+')');}
function auditDraws(result,input,tape) {
  const remaining=input.slice();
  assert.equal(result.complete,true);assert.equal(result.initiative.length,input.length-1);
  for(const [i,draw] of result.initiative.entries()) {
    const weights=remaining.map(a=>Math.max(1,a.spd)),index=remaining.findIndex(a=>a.actorId===draw.actorId);
    assert.ok(index>=0);const actor=remaining[index];
    equal(draw.candidates,remaining.map((a,j)=>({actorId:a.actorId,weight:weights[j]})));
    assert.equal(draw.type,'weighted_draw');assert.equal(draw.side,actor.side);assert.equal(draw.slot,actor.slot);
    assert.equal(draw.weight,weights[index]);assert.equal(draw.totalWeight,weights.reduce((a,b)=>a+b,0));
    assert.equal(draw.intervalStart,weights.slice(0,index).reduce((a,b)=>a+b,0));
    assert.equal(draw.intervalEnd,draw.intervalStart+draw.weight);assert.equal(draw.roll,tape[i]);
    assert.equal(draw.point,draw.roll*draw.totalWeight);
    assert.ok(draw.point>=draw.intervalStart&&draw.point<draw.intervalEnd);
    assert.equal(result.order[i].actorId,draw.actorId);remaining.splice(index,1);
  }
  assert.equal(result.order.at(-1).actorId,remaining[0].actorId);
  assert.equal(new Set(result.order.map(a=>a.actorId)).size,input.length);
}
function exact(g,tape) {
  g.run('var tape='+JSON.stringify(tape)+';var used=[];Math.random=()=>{if(used.length===tape.length)throw Error("RNG tape exhausted");const v=tape[used.length];used.push(v);return v;};');
  let result;
  try {result=g.run('combatPlayerState.resolveAttackRound(command)');assert.deepEqual(J(g,'used'),tape);}
  finally {g.run('Math.random=()=>{rngCalls++;throw Error("unexpected RNG");};');}
  return result;
}
function frozen(value) {if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozen);}else assert.notEqual(typeof value,'function');}
function hp(g) {return J(g,'[combatPlayerState.getView().members.map(m=>m.hp),combat.enemies.map(e=>e.hp)]');}
function equal(a,b) {assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));}

for(const count of [1,2,3]) test('valid two allies versus '+count+' exact enemies, immutable results and one round',()=>{
  const g=fresh(count),before=J(g,'({stats,statusEffects,day,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),enemyRound:formationRounds.getView()})');
  const plan=actors(g),sequence=g.run('combatEnemyInstanceSequence'),membership=g.run('combat.enemies');
  const result=exact(g,[...orderTape(g),...plan.flatMap(()=>HIT)]);frozen(result);
  equal(result.order,plan);assert.equal(result.round,1);assert.equal(result.outcome,'ongoing');
  equal(result.events.at(-1),{type:'round_end',roundBefore:0,roundAfter:1,outcome:'ongoing'});
  assert.equal(result.initiative.length,plan.length-1);
  assert.equal(g.run("used.length"),(plan.length-1)+3*plan.length);
  assert.equal(result.events.filter(e=>e.type==='attack').length,plan.length);
  for(const event of result.events.filter(e=>e.type==='attack')) {assert.equal(event.attemptedDamage,7);assert.equal(event.appliedDamage,7);assert.equal(event.hpBefore-event.hpAfter,7);}
  equal(result.command,J(g,'command'));
  equal(result.party.map(m=>m.hp),count===1?[93,100]:count===2?[93,93]:[86,93]);
  equal(result.enemies.map(m=>m.hp),count===1?[86]:count===2?[93,93]:[93,93,100]);
  assert.deepEqual(hp(g),[Array.from(result.party,m=>m.hp),Array.from(result.enemies,m=>m.hp)]);
  assert.equal(g.run('combat.active'),false);assert.equal(g.run('combat.enemies'),membership);
  assert.equal(g.run('combatEnemyInstanceSequence'),sequence);
  assert.deepEqual(J(g,'({stats,statusEffects,day,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),enemyRound:formationRounds.getView()})'),before);
  const old=JSON.stringify(result);g.run('combatPlayerState.setHp(command.allyActions[0].actorId,80);combat.enemies[0].hp=60;');
  assert.equal(JSON.stringify(result),old);assert.throws(()=>{result.party[0].hp=1;});
});

const malformed=[
  'command.type="attack"','command.type="item"','command.extra=true','delete command.type',
  'command.allyActions.pop()','command.enemyActions.pop()',
  'command.allyActions[1]={...command.allyActions[0]}','command.enemyActions.push({...command.enemyActions[0]})',
  'command.enemyActions[1]={...command.enemyActions[0]}',
  'command.allyActions[0].actorId="missing"','command.allyActions[0].actorId="combat_party_999"',
  'command.allyActions[0].targetId="missing"','command.enemyActions[0].targetId="combat_party_999"',
  'command.allyActions[0].actorId=command.enemyActions[0].actorId',
  'command.enemyActions[0].actorId=command.allyActions[0].actorId',
  'command.allyActions[0].targetId=command.allyActions[1].actorId',
  'command.enemyActions[0].targetId=command.enemyActions[0].actorId',
  'command.allyActions[0].actorId={}','command.allyActions[0].callback=()=>{}',
  'command.allyActions[0].targetId=()=>{}','command.allyActions.extra=1',
  'delete command.allyActions[0]','command.allyActions[0]=combat.enemies[0]',
  'command.allyActions[0]=combatPlayerState.getMember(command.allyActions[0].actorId)',
  'Object.setPrototypeOf(command,{inherited:true})','Object.setPrototypeOf(command.allyActions,{})',
  'Object.setPrototypeOf(command.allyActions[0],{inherited:true})',
  'command[Symbol("unknown")]=1',
  'command.allyActions[0].targetId=command',
  'command.enemyActions[0].actorId=command.enemyActions[0]',
  'Object.defineProperty(command,"type",{get(){getterCalls++;return "attack-round";}})',
  'Object.defineProperty(command.allyActions,0,{get(){getterCalls++;return {};}})',
  'Object.defineProperty(command.enemyActions[0],"targetId",{get(){getterCalls++;return "bad";}})',
];
for(const change of malformed) test('atomic command rejection: '+change,()=>{const g=fresh(2);g.run(change);reject(g);});
for(const change of [
  'combatPlayerState.setHp(command.allyActions[0].actorId,0)',
  'combat.enemies[0].hp=0',
  'combat.enemies[0].hp=0;command.enemyActions.shift()',
  'combat.enemies[0].hp=0;command.allyActions.forEach(a=>a.targetId=combat.enemies[1].instanceId)',
  'combatPlayerState.setHp(command.allyActions[0].actorId,0);command.allyActions.shift()',
  'combatPlayerState.setHp(command.allyActions[0].actorId,0);combatPlayerState.setHp(command.allyActions[1].actorId,0);command.allyActions=[]',
  'combat.enemies.forEach(e=>e.hp=0);command.enemyActions=[]',
  'combat.pendingVictory=true','combat.pendingDefeat=true','combat.pendingEscape=true',
  'combat.message="pending"','combat.messageQueue=[()=>{}]','dialogue.callbacks=[()=>{}]',
  'combat.bombFuse=1','combat.evadeTurns=1','combat.corrosion=1','combat.phase="victory"',
  'combat.enemies[0].atk=Number.MAX_SAFE_INTEGER','combat.enemies[0].hp=NaN',
  'combat.enemies[0].spd=Infinity','combat.enemies[0].def=-1','combat.enemies[0].atk=0.5',
  'combat.enemies[0].regenPerTurn=2','combat.enemies[0].counterChance=0.2',
  'combat.enemies[0].thornsReflect=true','combat.enemies[0].isBoss=true',
  'Object.defineProperty(combat.enemies[0],"hp",{get(){getterCalls++;return 20;}})',
  'Object.defineProperty(combat.enemies[0],"hp",{writable:false})',
  'Object.setPrototypeOf(combat.enemies[0],{})',
  'combat.enemies[0].id="enemy_gallery_receiver"',
]) test('atomic state rejection: '+change,()=>{const g=fresh(2);g.run(change);reject(g);});
for(const status of ['poison','burn','cursed','slither','muddied','dazzled']) test('unsupported party status '+status,()=>{
  const g=fresh();g.run('combatPlayerState.setStatuses(command.allyActions[1].actorId,['+JSON.stringify(status)+'])');reject(g);
});

test('unsafe ally arithmetic and initiative sum reject before RNG',()=>{
  for(const field of ['atk','spd']) {
    const g=fresh();g.run(`var d=combatPlayerState.getView().members.map(({instanceId,...m})=>m);combatPlayerState.clear();d[1].${field}=Number.MAX_SAFE_INTEGER;combatPlayerState.initialize(d);`);commands(g);reject(g);
  }
});

test('stale party and enemy identities cannot retarget a replacement',()=>{
  const g=fresh(2);g.run('var stale=command;combatPlayerState.clear();combat.enemy=null;'+setup(2));
  g.run('command=stale');reject(g);
});

test('session/playback and active combat cannot reach the scheduler',()=>{
  const g=createContext();g.run('dialogue.open=false;initializeFormationState([{enemyId:"enemy_marsh_wisp",slot:0},{enemyId:"enemy_briar_hound",slot:1}]);formationSessionController.begin();');
  assert.throws(()=>g.run('combatPlayerState.resolveAttackRound({})'),/Unsupported party/);
  const h=fresh();h.run('combatActive=true');reject(h);h.run('combatActive=false');
  for(const source of ['combat.active=true','handleCombatAction()','formationSessionController.begin()',
    'resolveFormationRound({type:"run"})','createFormationRoundPlayback({})','drawCombat()',
    'handleFormationInputCommand("confirm")','endCombat()','recoverCombatDefeat()'])
    assert.throws(()=>h.run(source),/Prepared player party/);
});

test('weighted cumulative boundaries and final append use exact numeric tapes',()=>{
  const g=fresh(),input=synthetic(3,[2,3,5]),before=snapshot(g);
  for(const [roll,first] of [[0,0],[0.199999,0],[0.2,1],[0.499999,1],[0.5,2],[1-Number.EPSILON/2,2]]) {
    const tape=[roll,0],result=plan(g,input,tape);frozen(result);auditDraws(result,input,tape);
    assert.equal(result.order[0].actorId,input[first].actorId);
  }
  const result=plan(g,input,[0.2,0.5]);
  equal(result.order.map(a=>a.actorId),['fixture_1','fixture_2','fixture_0']);
  assert.equal(result.initiative[1].totalWeight,7);assert.equal(result.initiative[1].intervalStart,2);
  assert.equal(plan(g,input,[0.2]).complete,false);
  assert.throws(()=>plan(g,input,[0.2,0.5,0]),/Unused/);
  assert.equal(snapshot(g),before);assert.equal(g.run('rngCalls'),0);
});

for(let count=2;count<=6;count++) test(count+' actors need exactly '+(count-1)+' initiative draws, including synthetic 3v3',()=>{
  const g=fresh(),input=synthetic(count),tape=Array(count-1).fill(0.999);
  assert.equal(plan(g,input,tape.slice(0,-1)).complete,false);
  const result=plan(g,input,tape);auditDraws(result,input,tape);
  equal(result.order.map(a=>a.actorId),input.map(a=>a.actorId).reverse());
  assert.throws(()=>plan(g,input,[...tape,0]),/Unused/);
  assert.equal(g.run('rngCalls'),0);
  if(count===6) {assert.equal(input.filter(a=>a.side==='ally').length,3);assert.equal(input.filter(a=>a.side==='enemy').length,3);}
});

test('equal speeds have equal intervals; increasing one speed only enlarges its first-selection interval',()=>{
  const g=fresh();
  for(let count=2;count<=6;count++) {
    const input=synthetic(count);
    for(let index=0;index<count;index++) {
      const result=plan(g,input,[(index+0.5)/count,...Array(count-2).fill(0)]),draw=result.initiative[0];
      assert.equal(draw.actorId,input[index].actorId);assert.equal(draw.intervalEnd-draw.intervalStart,10);
      assert.equal(draw.weight/draw.totalWeight,1/count);
      let probability=0;
      for(const speed of [1,2,10,100,10000]) {
        const varied=input.map((a,i)=>({...a,spd:i===index?speed:a.spd}));
        const total=speed+10*(count-1),roll=(index*10+speed/2)/total;
        const d=plan(g,varied,[roll,...Array(count-2).fill(0)]).initiative[0];
        assert.equal(d.actorId,input[index].actorId);assert.equal(d.weight,speed);
        assert.ok(d.weight/d.totalWeight>probability);probability=d.weight/d.totalWeight;
      }
    }
  }
});

test('identity, label, side and slot change no weights; command-record permutations stay deterministic',()=>{
  const g=fresh(3),h=fresh(3),input=synthetic(6,[1,10,1000,4,10,21]),tape=[0.15,0.6,0.9,0.4,0.1];
  const changed=input.map((a,i)=>({...a,actorId:'renamed_'+i,label:'different label '+i,side:a.side==='ally'?'enemy':'ally',slot:2-a.slot}));
  const a=plan(g,input,tape),b=plan(g,changed,tape);
  equal(a.order.map(m=>input.findIndex(v=>v.actorId===m.actorId)),b.order.map(m=>changed.findIndex(v=>v.actorId===m.actorId)));
  equal(a.initiative.map(d=>[d.weight,d.totalWeight,d.intervalStart,d.intervalEnd]),b.initiative.map(d=>[d.weight,d.totalWeight,d.intervalStart,d.intervalEnd]));
  for(const env of [g,h]) env.run('combat.enemies[0].spd=1;combat.enemies[1].spd=1000;combat.enemies[2].spd=10;');
  h.run('command.allyActions=command.allyActions.map(a=>({...a})).reverse();command.enemyActions=command.enemyActions.map(a=>({...a})).reverse();');
  const roundTape=[...orderTape(g),...actors(g).flatMap(()=>HIT)];equal(exact(g,roundTape),exact(h,roundTape));
});

test('legal zero Speed gets weight one without altering either side underlying stats',()=>{
  const g=fresh();g.run('var d=combatPlayerState.getView().members.map(({instanceId,...m})=>({...m,spd:0}));combatPlayerState.clear();combatPlayerState.initialize(d);combat.enemies[0].spd=0;');commands(g);
  const result=exact(g,[...orderTape(g),...HIT,...HIT,...HIT]);
  equal(result.initiative[0].candidates.map(c=>c.weight),[1,1,1]);
  equal(result.party.map(m=>m.spd),[0,0]);assert.equal(result.enemies[0].spd,0);
  equal(result.order.map(m=>m.spd),[1,1,0]);
  const input=synthetic(3,[0,0,0]),planned=plan(g,input,[0,0]);
  equal(planned.order.map(m=>m.spd),[0,0,0]);equal(planned.initiative[0].candidates.map(c=>c.weight),[1,1,1]);
});

test('Speed snapshots precede RNG and live changes cannot recalculate the remaining draw weights',()=>{
  const g=fresh();g.run('combat.enemies[0].spd=20');
  const input=actors(g),tape=[...orderTape(g),...HIT,...HIT,...HIT];
  g.run('var tape='+JSON.stringify(tape)+';var used=0;Math.random=()=>{if(!used)combat.enemies[0].spd=1000;return tape[used++];};');
  const result=g.run('combatPlayerState.resolveAttackRound(command)');auditDraws({complete:true,...result},input,tape.slice(0,2));
  assert.equal(g.run('used'),11);equal(result.order.map(a=>a.spd),[10,10,20]);
  assert.equal(result.initiative[1].totalWeight,30);assert.equal(result.enemies[0].spd,1000);
});

test('invalid Speed and unsafe full sums reject before reading an initiative tape',()=>{
  const g=fresh(),before=snapshot(g);
  for(const speed of ['NaN','Infinity','-Infinity','-1','0.5','Number.MAX_SAFE_INTEGER+1','"10"','null','undefined']) {
    assert.throws(()=>g.run('planPartyAttackOrder([{spd:'+speed+'}],{get length(){getterCalls++;throw Error("tape read");}})'),/Unsupported party initiative/);
  }
  // Each pair fits, but the full six-actor sum does not.
  assert.throws(()=>g.run('planPartyAttackOrder(Array.from({length:6},()=>({spd:Math.floor(Number.MAX_SAFE_INTEGER/4)})),{get length(){getterCalls++;throw Error("tape read");}})'),/Unsupported party initiative weight sum/);
  assert.equal(g.run('getterCalls'),0);assert.equal(g.run('rngCalls'),0);assert.equal(snapshot(g),before);
  const h=fresh(3);h.run('var d=combatPlayerState.getView().members.map(({instanceId,...m})=>({...m,spd:Math.floor(Number.MAX_SAFE_INTEGER/4)}));combatPlayerState.clear();combatPlayerState.initialize(d);combat.enemies.forEach(e=>e.spd=Math.floor(Number.MAX_SAFE_INTEGER/4));');commands(h);reject(h);
  const input=synthetic(2,[Number.MAX_SAFE_INTEGER-1,1]);
  for(const roll of [0,1-Number.EPSILON/2]) auditDraws(plan(g,input,[roll]),input,[roll]);
});

for(const side of ['enemy','ally']) test(side+' killed before opportunity is skipped while other actors live',()=>{
  const g=fresh(2),a=actors(g),a0=a[0].actorId,a1=a[1].actorId,e0=a[2].actorId,e1=a[3].actorId;
  if(side==='enemy') g.run('combat.enemies[0].hp=1;');else g.run('combatPlayerState.setHp(command.allyActions[0].actorId,1);');
  const ids=side==='enemy'?[a0,e0,a1,e1]:[e0,a0,a1,e1];
  const result=exact(g,[...orderTape(g,ids),...Array.from({length:3},()=>HIT).flat()]);
  assert.equal(result.outcome,'ongoing');assert.equal(result.events[1].type,'skip');assert.equal(result.events[1].reason,'actor_dead');
  assert.equal(result.events[1].actorId,side==='enemy'?e0:a0);
  assert.equal(result.party.length,2);assert.equal(result.enemies.length,2);
  equal(result.party.map(m=>m.slot),[0,1]);equal(result.enemies.map(m=>m.slot),[0,1]);
});

for(const side of ['enemy','ally']) test('dead '+side+' committed target cancels without retargeting',()=>{
  const g=fresh(2),a=actors(g),[a0,a1,e0,e1]=a.map(x=>x.actorId);
  if(side==='enemy') g.run('combat.enemies[0].hp=1;command.allyActions[1].targetId=command.allyActions[0].targetId;');
  else g.run('combatPlayerState.setHp(command.allyActions[0].actorId,1);command.enemyActions[1].targetId=command.enemyActions[0].targetId;');
  const ids=side==='enemy'?[a0,a1,e0,e1]:[e0,e1,a0,a1];
  const result=exact(g,[...orderTape(g,ids),...HIT,...HIT]);
  assert.equal(result.events[1].type,'cancel');assert.equal(result.events[1].reason,'target_dead');
  assert.equal(result.events[2].type,'skip');assert.equal(result.outcome,'ongoing');
});

for(const outcome of ['victory','defeat']) test('terminal '+outcome+' truncates execution, increments once and rejects another round',()=>{
  const g=fresh(),ids=actors(g).map(x=>x.actorId);
  if(outcome==='victory')g.run('combat.enemies[0].hp=1;');
  else {g.run('combatPlayerState.setHp(command.allyActions[0].actorId,0);combatPlayerState.setHp(command.allyActions[1].actorId,1);');commands(g);g.run('command.enemyActions[0].targetId=command.allyActions[0].actorId;');}
  const order=outcome==='victory'?ids:actors(g).map(a=>a.actorId).reverse();
  const result=exact(g,[...orderTape(g,order),...HIT]);
  assert.equal(result.outcome,outcome);assert.equal(result.events.length,2);assert.equal(result.events[0].type,'attack');
  assert.equal(result.events.at(-1).type,'round_end');assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),1);
  reject(g);assert.equal(g.run('combat.active'),false);
});

test('ongoing rounds use only living actors and retain defeated slots',()=>{
  const g=fresh(2);g.run('combatPlayerState.setHp(command.allyActions[0].actorId,0);combat.enemies[0].hp=0;');commands(g);
  g.run('command.allyActions[0].targetId=combat.enemies[1].instanceId;command.enemyActions[0].targetId=command.allyActions[0].actorId;');
  for(const round of [1,2]) {
    const result=exact(g,[...orderTape(g),...HIT,...HIT]);assert.equal(result.round,round);assert.equal(result.outcome,'ongoing');
    assert.equal(result.party[0].hp,0);assert.equal(result.enemies[0].hp,0);assert.equal(result.order.length,2);
    assert.equal(result.initiative.length,1);assert.equal(g.run('used.length'),7);
    equal(result.initiative[0].candidates.map(c=>c.actorId),result.order.map(a=>a.actorId));
    equal(result.party.map(m=>m.slot),[0,1]);equal(result.enemies.map(m=>m.slot),[0,1]);
    const before=snapshot(g);g.run('combatPlayerState.getRoundView();combatPlayerState.getView()');assert.equal(snapshot(g),before);
  }
});

test('full round failure preserves consumed RNG/HP, exposes fault, and cannot retry',()=>{
  const g=fresh(),initial=orderTape(g);g.run('var tape='+JSON.stringify([...initial,...HIT])+';var used=0;Math.random=()=>{if(used===tape.length)throw Error("injected RNG failure");return tape[used++];};');
  assert.throws(()=>g.run('combatPlayerState.resolveAttackRound(command)'),/injected RNG failure/);
  assert.equal(g.run('combat.enemies[0].hp'),93);assert.equal(g.run('used'),initial.length+3);
  equal(g.run('combatPlayerState.getRoundView()'),{completedRounds:0,phase:'fault',outcome:'ongoing',failure:{round:1,completedEvents:1,initiativeRolls:2}});
  g.run('Math.random=()=>{rngCalls++;throw Error("unexpected RNG");};');reject(g);
  g.run('combatPlayerState.clear()');assert.equal(g.run('combat.enemies[0].hp'),93);assert.equal(g.run('combatPlayerState.getRoundView()'),null);
});

test('preparation cannot be replaced or mutated reentrantly during initiative',()=>{
  for(const source of ['combatPlayerState.clear()','combatPlayerState.setHp(command.allyActions[0].actorId,1)']) {
    const g=fresh(),before=hp(g);g.run('Math.random=()=>{'+source+';return 0.5;};');
    assert.throws(()=>g.run('combatPlayerState.resolveAttackRound(command)'),/Invalid player-party/);
    assert.deepEqual(hp(g),before);assert.equal(g.run('combatPlayerState.getRoundView().phase'),'fault');
  }
});

test('arithmetic matches production variance, crit, ordinary evasion and incoming-defense cap',()=>{
  const reference=createContext();reference.run('dialogue.open=false;Math=Object.create(Math);');let comparisons=0;
  for(const side of ['ally','enemy']) for(const atk of [0,10,52]) for(const def of [0,3,100])
    for(const speeds of [[0,0],[1,100],[100,1]]) for(const rolls of [[0,0.09,0],[0.5,0.1,0.99],[1-Number.EPSILON/2,0.99,0.99]]) {
      const g=fresh(),base=actors(g),first=side==='ally'?base[0].actorId:base[2].actorId;
      g.run(`var defs=combatPlayerState.getView().members.map(({instanceId,...m})=>({...m,hp:1000,maxHp:1000}));combatPlayerState.clear();
        defs[0].${side==='ally'?'atk':'def'}=${side==='ally'?atk:def};defs[0].spd=${side==='ally'?speeds[0]:speeds[1]};combatPlayerState.initialize(defs);
        Object.assign(combat.enemies[0],{hp:1000,maxHp:1000,${side==='ally'?'def':'atk'}:${side==='ally'?def:atk},spd:${side==='ally'?speeds[1]:speeds[0]}});`);
      commands(g);const current=actors(g),actor=current[side==='ally'?0:2],rest=current.filter(a=>a!==actor).map(a=>a.actorId);
      const result=exact(g,[...orderTape(g,[actor.actorId,...rest]),...rolls,...HIT,...HIT]);
      const actorSpd=side==='ally'?Math.max(1,speeds[0]):speeds[0],targetSpd=side==='enemy'?Math.max(1,speeds[1]):speeds[1];
      reference.run(`var rolls=${JSON.stringify(rolls)},i=0;Math.random=()=>rolls[i++];`);
      const expected=J(reference,`(()=>{const hit=rollAttackDamage(${atk},${side==='enemy'?`playerIncomingMitigation(${atk},${def},false)`:def});return {damage:hit.dmg,critical:hit.crit,evaded:attackEvaded(${actorSpd},${targetSpd},${side==='enemy'})};})()`);
      const event=result.events[0];assert.equal(event.attemptedDamage,expected.damage);assert.equal(event.critical,expected.critical);assert.equal(event.evaded,expected.evaded);
      assert.equal(event.appliedDamage,expected.evaded?0:expected.damage);comparisons++;
    }
  assert.equal(comparisons,162);console.log('  '+comparisons+' explicit-actor arithmetic comparisons passed');
});

test('canonical Lely equipment/status/inventory is not impersonated, and saves/input stay isolated',()=>{
  const g=fresh();g.run('stats.atk=999;stats.def=999;stats.spd=999;stats.accessory={evadeAll:true,bonus:999};statusEffects=["poison"];stats.items=[createItem("Potion")];');
  const canonical=J(g,'({stats,statusEffects,slitherSpd})');const result=exact(g,[...orderTape(g),...HIT,...HIT,...HIT]);
  assert.equal(result.events[0].attemptedDamage,7);assert.equal(result.events[2].evaded,false);
  assert.deepEqual(J(g,'({stats,statusEffects,slitherSpd})'),canonical);
  const before=snapshot(g);g.press('Enter');g.press('ArrowRight');g.frames(5);assert.equal(g.run('saveGame()'),false);assert.equal(snapshot(g),before);
});

test('320 mixed-speed seeded tapes give repeatable complete weighted orders',()=>{
  const g=fresh();
  for(let count=2;count<=6;count++) {
    const input=synthetic(count,[1,10,1000,4,10,20]);
    for(let seed=1;seed<=64;seed++) {
      let state=seed;const tape=Array.from({length:count-1},()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;});
      const result=plan(g,input,tape);auditDraws(result,input,tape);equal(result,plan(g,input,tape));
    }
  }
  assert.equal(g.run('rngCalls'),0);
});

test('seeded statistical audit: weighted 2–6 actor ranks, permutations, gaps and pair independence',()=>{
  const g=fresh(),before=snapshot(g),planner=g.run('planPartyAttackOrder');
  // Fixed xorshift32 streams, 12,000 samples/configuration; no ambient RNG.
  // Six standard errors plus one sample of rounding slack are conservative
  // across all comparisons. Rank variance for equal weights is (N^2-1)/12.
  const samples=12000,reports=[];
  const tolerance=p=>6*Math.sqrt(p*(1-p)/samples)+1/samples;
  const near=(actual,expected,limit,label)=>assert.ok(Math.abs(actual-expected)<=limit,
    label+': '+actual+' vs '+expected+' (tolerance '+limit+')');
  function sample(label,input,seed=0x51a7c0de) {
    const nativeInput=g.run('('+JSON.stringify(input)+')'),tape=g.run('[]');
    const index=new Map(input.map((a,i)=>[a.actorId,i])),first=Array(input.length).fill(0),ranks=Array(input.length).fill(0);
    const pairCounts=Array.from({length:input.length},()=>Array(input.length).fill(0)),rngHistogram={};
    let state=seed>>>0,calls=0;
    const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;calls++;return (state>>>0)/4294967296;};
    for(let iteration=0;iteration<samples;iteration++) {
      const start=calls;
      tape.length=0;
      // Full tape length is also audited through initiative records. Exact
      // prefix/extra-tape tests above prove this is the planner's requirement.
      for(let i=1;i<input.length;i++)tape.push(random());
      const result=planner(nativeInput,tape);assert.equal(result.complete,true);
      assert.equal(result.initiative.length,input.length-1);
      const used=calls-start;rngHistogram[used]=(rngHistogram[used]||0)+1;
      const order=Array.from(result.order,a=>index.get(a.actorId));
      assert.equal(new Set(order).size,input.length);
      first[order[0]]++;
      for(let rank=0;rank<order.length;rank++) {
        ranks[order[rank]]+=rank+1;
        for(let later=rank+1;later<order.length;later++)pairCounts[order[rank]][order[later]]++;
      }
    }
    assert.equal(calls,samples*(input.length-1));
    assert.deepEqual(rngHistogram,{[input.length-1]:samples});
    const frequencies=first.map(v=>v/samples),averageRanks=ranks.map(v=>v/samples),weights=input.map(a=>Math.max(1,a.spd));
    const total=weights.reduce((a,b)=>a+b,0);let maxFirstError=0,maxPairError=0,maxRankError=0;
    for(let i=0;i<input.length;i++) {
      const expected=weights[i]/total;
      near(frequencies[i],expected,tolerance(expected),label+' first '+i);
      maxFirstError=Math.max(maxFirstError,Math.abs(frequencies[i]-expected));
      for(let j=i+1;j<input.length;j++) {
        const p=weights[i]/(weights[i]+weights[j]),observed=pairCounts[i][j]/samples;
        near(observed,p,tolerance(p),label+' pair '+i+'/'+j);
        maxPairError=Math.max(maxPairError,Math.abs(observed-p));
      }
      if(new Set(weights).size===1) {
        const expectedRank=(input.length+1)/2;
        near(averageRanks[i],expectedRank,6*Math.sqrt((input.length**2-1)/(12*samples))+1/samples,label+' rank '+i);
        maxRankError=Math.max(maxRankError,Math.abs(averageRanks[i]-expectedRank));
      }
    }
    const report={label,actors:input.length,first:frequencies,averageRanks,pair01:pairCounts[0][1]/samples,
      maxFirstError,maxPairError,maxRankError,rngHistogram};reports.push(report);return report;
  }
  for(let count=2;count<=6;count++) {
    const input=synthetic(count),baseline=sample('equal-'+count,input);
    // Reverse physical scan order and authored slots. Each identity must still
    // have the same distribution; aggregate comparisons are identity-matched.
    const permuted=input.map(a=>({...a,slot:count-1-a.slot})).reverse();
    const slots=sample('slot-permutation-'+count,permuted,0x739e12ab);
    const sides=sample('side-permutation-'+count,input.map(a=>({...a,side:a.side==='ally'?'enemy':'ally'})),0x19d5ce73);
    const diffTolerance=6*Math.sqrt(2*(1/count)*(1-1/count)/samples)+2/samples;
    for(let i=0;i<count;i++) {
      near(baseline.first[i],slots.first[count-1-i],diffTolerance,'slot-invariant frequency '+count+'/'+i);
      near(baseline.first[i],sides.first[i],diffTolerance,'side-invariant frequency '+count+'/'+i);
    }
  }
  const monotonic=[1,4,16].map(speed=>sample('speed-'+speed,synthetic(6,[speed,4,4,4,4,4])));
  for(let i=1;i<monotonic.length;i++) {
    assert.ok(monotonic[i].first[0]>monotonic[i-1].first[0]);
    assert.ok(monotonic[i].averageRanks[0]<monotonic[i-1].averageRanks[0]);
  }
  const extreme=sample('extreme-3v3',synthetic(6,[1000,1,1,1,1,1]));
  assert.ok(extreme.first[0]>0.98,'no inherited 90% cap');
  assert.ok(extreme.first[0]<1,'small weights remain selectable');
  const pair=sample('pair-alone',synthetic(2,[2,7]));
  for(let count=3;count<=6;count++) {
    const other=sample('pair-with-'+(count-2),synthetic(count,[2,7,1,11,3,40]),0x6dc891f1+count);
    near(other.pair01,pair.pair01,6*Math.sqrt(2*(2/9)*(7/9)/samples)+2/samples,'unrelated actors preserve A/(A+B)');
  }
  const heavy=sample('pair-heavy-3v3',synthetic(6,[2,7,1000,2000,3000,4000]),0xe71a89c3);
  near(heavy.pair01,pair.pair01,6*Math.sqrt(2*(2/9)*(7/9)/samples)+2/samples,'heavy unrelated actors preserve pair odds');
  assert.equal(reports.length,25);assert.equal(g.run('rngCalls'),0);assert.equal(snapshot(g),before);
  // One compact deterministic audit record is retained in the regression log.
  console.log('  weighted initiative audit: '+JSON.stringify({samplesPerConfiguration:samples,configurations:reports.length,
    totalRounds:samples*reports.length,maxFirstError:Math.max(...reports.map(r=>r.maxFirstError)),
    maxPairError:Math.max(...reports.map(r=>r.maxPairError)),maxEqualRankError:Math.max(...reports.map(r=>r.maxRankError)),
    equal3v3:reports.find(r=>r.label==='equal-6'),monotonicFirst:monotonic.map(r=>r.first[0]),
    extremeFirst:extreme.first[0],pairAlone:pair.pair01,pairHeavy3v3:heavy.pair01,
    rngCounts:reports.slice(0,15).filter((_,i)=>i%3===0).map(r=>({actors:r.actors,distribution:r.rngHistogram}))}));
});

test('two initially living allies can both die; later planned actors are truncated',()=>{
  const g=fresh(3);g.run('combatPlayerState.getView().members.forEach(m=>combatPlayerState.setHp(m.instanceId,1));');
  const a=actors(g),ids=[a[2],a[3],a[4],a[0],a[1]].map(x=>x.actorId);
  const result=exact(g,[...orderTape(g,ids),...HIT,...HIT]);
  assert.equal(result.outcome,'defeat');equal(result.party.map(m=>m.hp),[0,0]);
  assert.equal(result.order.length,5);assert.equal(result.events.length,3);
  assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),1);reject(g);
});

test('three-enemy victory requires a second complete round after two enemies die',()=>{
  const g=fresh(3);g.run('combat.enemies.forEach(e=>e.hp=1);');
  const first=exact(g,[...orderTape(g),...HIT,...HIT,...HIT]);
  assert.equal(first.outcome,'ongoing');equal(first.enemies.map(e=>e.hp),[0,0,1]);
  commands(g);g.run('command.allyActions.forEach(a=>a.targetId=combat.enemies[2].instanceId);');
  const last=exact(g,[...orderTape(g),...HIT]);
  assert.equal(last.outcome,'victory');assert.equal(last.round,2);assert.equal(last.events.length,2);
  equal(last.enemies.map(e=>e.hp),[0,0,0]);reject(g);
});

test('round identity cannot silently bind replacement enemies; explicit cleanup resets only party rounds',()=>{
  const g=fresh();exact(g,[...orderTape(g),...HIT,...HIT,...HIT]);
  const view=g.run('combatPlayerState.getRoundView()');frozen(view);
  g.run('combat.enemy=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};');commands(g);reject(g);
  g.run('var d=combatPlayerState.getView().members.map(({instanceId,...m})=>m);combatPlayerState.clear();combatPlayerState.initialize(d);');
  assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),0);assert.equal(view.completedRounds,1);
});

test('no production scheduler callers and no saved round metadata',()=>{
  for(const file of scriptOrderFromIndexHtml()) assert.doesNotMatch(fs.readFileSync(path.join(ROOT,file),'utf8'),/combatPlayerState\.resolveAttackRound\s*\(/,file);
  const g=createContext();g.run('dialogue.open=false;resetLocationState();placeAtLocation("MAP",7.5*TILE,9.5*TILE);saveGame();');
  const before=g.run('localStorage.getItem("verdantVale_save")');
  g.run(setup(1));commands(g);g.run('var rngCalls=0;Math=Object.create(Math);');exact(g,[...orderTape(g),...HIT,...HIT,...HIT]);
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('localStorage.getItem("verdantVale_save")'),before);
  assert.equal(g.run('loadGame()'),true);assert.equal(g.run('combatPlayerState.getRoundView()'),null);
  assert.equal(g.run('saveGame()'),true);assert.equal(g.run('localStorage.getItem("verdantVale_save")'),before);assert.equal(g.run('SAVE_VERSION'),4);
});

module.exports={name:'headless party Attack rounds: explicit commands, weighted initiative, exact HP and isolation',checks,
 run(){for(const check of checks){try{check.run();}catch(error){console.error('Failed party scheduler check:',check.name);throw error;}}
 console.log('  '+checks.length+' party scheduler checks passed');}};
