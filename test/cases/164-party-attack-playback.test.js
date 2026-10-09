'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run}),HIT=[0.5,0.99,0.99];
const J=(g,source)=>JSON.parse(g.run('JSON.stringify('+source+')'));
const equal=(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
function fresh(count=2) {
  const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;menu.open=false;Math=Object.create(Math);
    var rngCalls=0,getterCalls=0;Math.random=()=>{rngCalls++;throw Error('unexpected playback RNG');};
    ${count===1?'combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};':
      'initializeFormationState('+JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:'enemy_marsh_wisp',slot})))+');'}
    combat.enemies.forEach(e=>Object.assign(e,{hp:100,maxHp:100,atk:10,def:3,spd:10}));
    var fixtures=[{characterId:'fixture_amber',slot:0,name:'Amber',hp:100,maxHp:100,atk:10,def:3,spd:10,statuses:[]},
      {characterId:'fixture_cobalt',slot:1,name:'Cobalt',hp:100,maxHp:100,atk:10,def:3,spd:10,statuses:[]}];
    combatPlayerState.initialize(fixtures);`);return g;
}
function state(g) {return g.run(`JSON.stringify({combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),
  active:combat.active,mode:combat.mode,party:combatPlayerState.getView(),round:combatPlayerState.getRoundView(),
  enemyRound:formationRounds.getView(),coordination:formationRounds.coordination(),
  stats,statusEffects,slitherSpd,player,day,dialogue,choice,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),
  enemySequence:combatEnemyInstanceSequence,save:localStorage.getItem('verdantVale_save')})`);}
function unchanged(g,work) {const before=state(g),members=g.run('combat.enemies');const value=work();assert.equal(state(g),before);assert.equal(g.run('combat.enemies'),members);assert.equal(g.run('rngCalls'),0);assert.equal(g.run('getterCalls'),0);return value;}
function resolve(g,orderIndices,rolls=[],changeCommands='',firstRollHook='') {
  g.run(`var command={type:'attack-round',
    allyActions:combatPlayerState.getView().members.filter(m=>m.hp>0).map((m,i)=>({actorId:m.instanceId,targetId:combat.enemies.filter(e=>e.hp>0)[i%combat.enemies.filter(e=>e.hp>0).length].instanceId})),
    enemyActions:combat.enemies.filter(e=>e.hp>0).map((e,i)=>({actorId:e.instanceId,targetId:combatPlayerState.getView().members.filter(m=>m.hp>0)[i%combatPlayerState.getView().members.filter(m=>m.hp>0).length].instanceId}))};`+changeCommands);
  const initial=J(g,'[...combatPlayerState.getView().members,...combat.enemies].filter(m=>m.hp>0).map(m=>({id:m.instanceId,weight:Math.max(1,m.spd)}))');
  const desired=(orderIndices||initial.map((_,i)=>i)).map(i=>initial[i]),pool=initial.slice(),tape=[];
  for(const actor of desired.slice(0,-1)) {const i=pool.indexOf(actor);tape.push((pool.slice(0,i).reduce((n,a)=>n+a.weight,0)+actor.weight/2)/pool.reduce((n,a)=>n+a.weight,0));pool.splice(i,1);}
  for(let i=0;i<initial.length;i++)tape.push(...(rolls[i]||HIT));
  g.run('var tape='+JSON.stringify(tape)+';var used=[];Math.random=()=>{if(!used.length){'+firstRollHook+'}if(used.length>=tape.length)throw Error("exhausted tape");const v=tape[used.length];used.push(v);return v;};');
  try {g.run('var roundResult=combatPlayerState.resolveAttackRound(command);');}
  finally {g.run('Math.random=()=>{rngCalls++;throw Error("unexpected playback RNG");};');}
  assert.equal(g.run('used.length'),initial.length-1+3*g.run('roundResult.events.filter(e=>e.type==="attack").length'));
  return g.run('roundResult');
}
const create=g=>unchanged(g,()=>g.run('var playback=combatPlayerState.createAttackRoundPlayback(roundResult);playback;'));
function frozen(value) {if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));for(const d of Object.values(Object.getOwnPropertyDescriptors(value))){assert.ok(Object.hasOwn(d,'value'));frozen(d.value);}}else assert.notEqual(typeof value,'function');}
function noSharedObjects(a,b) {const collect=(v,set)=>{if(v&&typeof v==='object'){set.add(v);Object.values(v).forEach(child=>collect(child,set));}};const left=new Set(),right=new Set();collect(a,left);collect(b,right);for(const ref of left)assert.ok(!right.has(ref),'no source object retained');}
const hpRows=frame=>[...frame.party,...frame.enemies].map(m=>m.hp);
const strip=members=>Array.from(members,({side,alive,defeated,...snapshot})=>snapshot);
function verify(g,reel,beforeHp) {
  const result=g.run('roundResult');frozen(reel);noSharedObjects(reel,result);
  equal(Object.keys(reel).sort(),['round','command','initiative','order','eventCount','frameCount','frames'].sort());
  assert.equal(reel.round,result.round);equal(reel.command,result.command);equal(reel.initiative,result.initiative);equal(reel.order,result.order);
  assert.equal(reel.frameCount,result.events.length+1);assert.equal(reel.eventCount,result.events.length);
  equal(hpRows(reel.frames[0]),beforeHp);assert.equal(reel.frames[0].eventIndex,-1);assert.equal(reel.frames[0].currentEvent,null);
  reel.frames.forEach((frame,index)=>{
    equal(Object.keys(frame).sort(),['frameIndex','eventIndex','currentEvent','party','enemies','complete','outcome','completedRounds'].sort());
    assert.equal(frame.frameIndex,index);assert.equal(frame.eventIndex,index-1);assert.equal(frame.complete,index===reel.eventCount);
    assert.equal(frame.outcome,index===reel.eventCount?result.outcome:'ongoing');
    assert.equal(frame.completedRounds,index===reel.eventCount?result.round:result.round-1);
    for(const [side,members,snapshots] of [['ally',frame.party,result.party],['enemy',frame.enemies,result.enemies]]) members.forEach((m,slot)=>{
      assert.equal(m.side,side);assert.equal(m.slot,slot);assert.equal(m.instanceId,snapshots[slot].instanceId);
      assert.equal(m.maxHp,snapshots[slot].maxHp);assert.equal(m.alive,m.hp>0);assert.equal(m.defeated,m.hp===0);
    });
    if(!index)return;
    const event=result.events[index-1];equal(frame.currentEvent,event);assert.notEqual(frame.currentEvent,event);
    const previous=hpRows(reel.frames[index-1]);
    if(event.type==='attack') {
      const at=[...frame.party,...frame.enemies].findIndex(m=>m.instanceId===event.targetId);
      assert.equal(previous[at],event.hpBefore);previous[at]=event.hpAfter;
    }
    equal(hpRows(frame),previous);
  });
  equal(strip(reel.frames.at(-1).party),result.party);equal(strip(reel.frames.at(-1).enemies),result.enemies);
}
const liveHp=g=>J(g,'[...combatPlayerState.getView().members,...combat.enemies].map(m=>m.hp)');
function ordinary(count=2) {const g=fresh(count),before=liveHp(g);resolve(g);const reel=create(g);verify(g,reel,before);return {g,reel};}
function altered(g,change) {
  g.run(`var bad=${JSON.stringify(g.run("roundResult"))};${change}
    function freezeData(value,seen=new Set()) {if(value&&['object','function'].includes(typeof value)&&!seen.has(value)) {
      seen.add(value);for(const descriptor of Object.values(Object.getOwnPropertyDescriptors(value)))if(Object.hasOwn(descriptor,'value'))freezeData(descriptor.value,seen);Object.freeze(value);}}
    freezeData(bad);`);
}
function reject(g,expression='combatPlayerState.createAttackRoundPlayback(bad)') {
  unchanged(g,()=>assert.throws(()=>g.run(expression),/Invalid party Attack playback history/));
}

for(const count of [1,2,3])test('authentic 2v'+count+' frame zero, exact forward HP and final snapshots',()=>ordinary(count));
for(const side of ['ally','enemy'])for(const evaded of [false,true])test(side+' critical '+(evaded?'evaded':'hit')+' remains recorded metadata',()=>{
  const g=fresh(),before=liveHp(g),order=side==='ally'?[0,1,2,3]:[2,0,1,3];
  resolve(g,order,[[0.5,0,evaded?0:0.99]]);const reel=create(g);verify(g,reel,before);
  const event=reel.frames[1].currentEvent;assert.equal(event.side,side);assert.equal(event.critical,true);assert.equal(event.evaded,evaded);
  if(evaded){assert.equal(event.appliedDamage,0);assert.equal(event.hpBefore,event.hpAfter);}
});
for(const side of ['ally','enemy'])test(side+' death: clamping, actor skip and stable zero-HP slots',()=>{
  const g=fresh();g.run(side==='enemy'?'combat.enemies[0].hp=1':'combatPlayerState.setHp(combatPlayerState.getView().members[0].instanceId,1)');
  const before=liveHp(g);resolve(g,side==='enemy'?[0,2,1,3]:[2,0,1,3]);const reel=create(g);verify(g,reel,before);
  assert.equal(reel.frames[1].currentEvent.attemptedDamage,7);assert.equal(reel.frames[1].currentEvent.appliedDamage,1);
  assert.equal(reel.frames[2].currentEvent.type,'skip');assert.equal(reel.frames[2].currentEvent.reason,'actor_dead');
  assert.equal(reel.frames.at(-1).outcome,'ongoing');
  for(const frame of reel.frames.slice(1)){assert.equal((side==='ally'?frame.party:frame.enemies)[0].hp,0);assert.equal((side==='ally'?frame.party:frame.enemies)[0].slot,0);}
});
for(const side of ['ally','enemy'])test('dead '+side+' target cancels without retargeting',()=>{
  const g=fresh();g.run(side==='enemy'?'combat.enemies[0].hp=1':'combatPlayerState.setHp(combatPlayerState.getView().members[0].instanceId,1)');const before=liveHp(g);
  resolve(g,side==='enemy'?[0,1,2,3]:[2,3,0,1],[],side==='enemy'?'command.allyActions[1].targetId=command.allyActions[0].targetId;':'command.enemyActions[1].targetId=command.enemyActions[0].targetId;');
  const reel=create(g);verify(g,reel,before);assert.equal(reel.frames[2].currentEvent.type,'cancel');assert.equal(reel.frames[2].currentEvent.reason,'target_dead');
  equal(hpRows(reel.frames[2]),hpRows(reel.frames[1]));assert.equal(reel.frames[3].currentEvent.type,'skip');
});
for(const outcome of ['victory','defeat'])test('full '+outcome+' truncates events and reveals outcome only at round_end',()=>{
  const g=fresh(3);g.run(outcome==='victory'?'combat.enemies[0].hp=1;combat.enemies[1].hp=0;combat.enemies[2].hp=0;':
    'combatPlayerState.getView().members.forEach(m=>combatPlayerState.setHp(m.instanceId,1));');
  const before=liveHp(g);resolve(g,outcome==='victory'?[0,1,2]:[2,3,4,0,1]);const reel=create(g);verify(g,reel,before);
  assert.equal(reel.frames.at(-1).outcome,outcome);assert.equal(reel.frames.at(-2).outcome,'ongoing');
  assert.ok(reel.eventCount<reel.order.length+1);assert.equal(reel.frames.at(-1).currentEvent.type,'round_end');
  equal(hpRows(reel.frames.at(-1)),hpRows(reel.frames.at(-2)));
});
test('duplicate authored enemy IDs remain separate runtime targets',()=>{
  const {g,reel}=ordinary(3);assert.equal(new Set(reel.frames[0].enemies.map(m=>m.id)).size,1);assert.equal(new Set(reel.frames[0].enemies.map(m=>m.instanceId)).size,3);
  assert.equal(reel.frames.at(-1).enemies[0].hp,93);assert.equal(reel.frames.at(-1).enemies[1].hp,93);assert.equal(reel.frames.at(-1).enemies[2].hp,100);
  unchanged(g,()=>{for(const index of [3,0,6,2,1,5,4,0,6])assert.equal(g.run('combatPlayerState.projectAttackRoundPlaybackFrame(playback,'+index+')'),reel.frames[index]);});
});
test('invalid indices throw RangeError; copied or forged reels reject',()=>{
  const {g}=ordinary();unchanged(g,()=>assert.throws(()=>g.run('combatPlayerState.projectAttackRoundPlaybackFrame(playback)'),e=>e.name==='RangeError'));for(const index of ['-1','1.5','NaN','Infinity','undefined','null','"0"','playback.frameCount','Number.MAX_SAFE_INTEGER'])
    unchanged(g,()=>assert.throws(()=>g.run('combatPlayerState.projectAttackRoundPlaybackFrame(playback,'+index+')'),e=>e.name==='RangeError'));
  for(const source of ['null','{}','copyFormationData(playback)'])reject(g,'combatPlayerState.projectAttackRoundPlaybackFrame('+source+',0)');
  reject(g,'combatPlayerState.createAttackRoundPlayback(roundResult,true)');reject(g,'combatPlayerState.projectAttackRoundPlaybackFrame(playback,0,true)');
});
test('source and reel mutation attempts fail; no source object is retained',()=>{
  const {g,reel}=ordinary(),before=JSON.stringify(reel),source=g.run('roundResult');
  for(const target of [source,reel])assert.throws(()=>Object.defineProperty(target,'extra',{value:1}));
  assert.throws(()=>{source.events[0].hpAfter=0;});assert.throws(()=>source.party.pop());assert.throws(()=>{reel.frames[0].party[0].hp=0;});
  assert.throws(()=>reel.initiative[0].candidates.pop());assert.equal(JSON.stringify(reel),before);
  noSharedObjects(reel,source);noSharedObjects(reel,g.run('combat.enemies'));
});
test('live HP changes, another round, cleanup and replacement cannot alter existing or newly created historical reels',()=>{
  const {g,reel}=ordinary(),before=JSON.stringify(reel);g.run('var historical=roundResult;');resolve(g);
  g.run('combatPlayerState.setHp(combatPlayerState.getView().members[0].instanceId,1);combat.enemies[0].hp=2;combatPlayerState.clear();combat.enemy=null;');
  g.run('combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};combatPlayerState.initialize(fixtures);');
  unchanged(g,()=>{equal(g.run('combatPlayerState.createAttackRoundPlayback(historical)'),reel);for(let i=reel.frameCount-1;i>=0;i--)assert.equal(g.run('combatPlayerState.projectAttackRoundPlaybackFrame(playback,'+i+')'),reel.frames[i]);});
  assert.equal(JSON.stringify(reel),before);equal(J(g,'combatPlayerState.getView().members.map(m=>m.instanceId)'),['combat_party_3','combat_party_4']);
});
test('no initiative planner, arithmetic, live snapshot, resolver or finalizer is called during playback',()=>{
  const {g,reel}=ordinary();
  g.run(`for(const name of ['planPartyAttackOrder','partyInitiativeWeights','rollAttackDamage','attackDamageNumbers','evadeChance','endCombat','recoverCombatDefeat','resolveFormationRound']) {
    globalThis[name]=()=>{throw Error('forbidden helper '+name);};}
    Object.defineProperty(stats,'hp',{get(){throw Error('live Lely read');},configurable:true});
    Object.defineProperty(combat.enemies[0],'hp',{get(){throw Error('live enemy read');},configurable:true});`);
  equal(g.run('combatPlayerState.createAttackRoundPlayback(roundResult)'),reel);
  assert.equal(g.run('combatPlayerState.projectAttackRoundPlaybackFrame(playback,0)'),reel.frames[0]);assert.equal(g.run('rngCalls'),0);
});

test('zero Speed and enemy Speed changes retain the historical initiative snapshot',()=>{
  const g=fresh();g.run('combatPlayerState.clear();fixtures.forEach(m=>m.spd=0);combatPlayerState.initialize(fixtures);combat.enemies.forEach(e=>e.spd=0);');
  const before=liveHp(g);resolve(g,undefined,[],'','combat.enemies[0].spd=1000;');
  const reel=create(g);verify(g,reel,before);equal(reel.order.map(a=>a.spd),[1,1,0,0]);
  equal(reel.initiative[0].candidates.map(c=>c.weight),[1,1,1,1]);assert.equal(reel.frames[0].enemies[0].spd,1000);
});
test('later round metadata advances in its final frame only',()=>{
  const {g}=ordinary(),before=liveHp(g);resolve(g);const reel=create(g);verify(g,reel,before);
  assert.equal(reel.round,2);assert.equal(reel.frames[0].completedRounds,1);assert.equal(reel.frames.at(-1).completedRounds,2);
});

const corruptions=[
  'bad.extra=true','delete bad.round','bad.round=0','bad.round=1.5','bad.round=Number.MAX_SAFE_INTEGER+1','bad.outcome="escape"',
  'bad.command.type="run"','bad.command.extra=1','bad.command.allyActions.pop()','bad.command.enemyActions=[]',
  'bad.command.allyActions.reverse()','bad.command.allyActions[1]={...bad.command.allyActions[0]}',
  'bad.command.allyActions[0].extra=0','bad.command.allyActions[0].actorId="combat_enemy_1"',
  'bad.command.enemyActions[0].targetId="combat_enemy_2"','bad.command.allyActions[0].targetId="combat_enemy_999"',
  'bad.party[1].instanceId=bad.party[0].instanceId','bad.party[0].instanceId="combat_enemy_1"',
  'bad.party[1].characterId=bad.party[0].characterId','bad.party[0].characterId="player"','bad.party[0].characterId="Bad ID"',
  'bad.party[0].spd=11','bad.party[0].name=""','bad.party[0].slot=1','bad.party.reverse()','bad.party.shift()',
  'bad.party[0].hp=-1','bad.party[0].hp=101','bad.party[0].maxHp=0','bad.party[0].atk=Infinity','bad.party[0].spd=-1',
  'bad.party[0].statuses=["burn"]','bad.party[0].equipment={}','bad.enemies[0].id="enemy_gallery_receiver"',
  'bad.enemies[1].instanceId=bad.enemies[0].instanceId','bad.enemies[0].instanceId="combat_enemy_0"',
  'bad.enemies[0].instanceId="combat_enemy_9007199254740992"','bad.enemies[0].slot=2','bad.enemies[0].maxHp=0',
  'bad.enemies[0].observeCount=-1','bad.enemies[0].escapeUnlocked=true','bad.enemies[0].xp=0.5','bad.enemies[0].extra=1',
  'bad.order.pop()','bad.order.reverse()','bad.order[1]={...bad.order[0]}','bad.order[0].extra=1',
  'bad.order[0].side="enemy"','bad.order[0].slot=1','bad.order[0].spd=0','bad.order[0].spd=NaN',
  'bad.order[0].targetId=bad.enemies[1].instanceId','bad.initiative.pop()','bad.initiative.reverse()',
  'bad.initiative[0].type="pivot"','bad.initiative[0].actorId=bad.enemies[0].instanceId','bad.initiative[0].side="enemy"',
  'bad.initiative[0].slot=1','bad.initiative[0].weight=11','bad.initiative[0].totalWeight=41',
  'bad.initiative[0].roll=1','bad.initiative[0].roll=-0.1','bad.initiative[0].point+=1',
  'bad.initiative[0].intervalStart+=1','bad.initiative[0].intervalEnd+=1','bad.initiative[0].candidates.pop()',
  'bad.initiative[0].candidates.reverse()','bad.initiative[0].candidates[0].weight=0',
  'bad.initiative[0].candidates[0].actorId="combat_party_999"','bad.initiative[0].candidates[0].extra=1',
  'bad.initiative[0].roll=0.6;bad.initiative[0].point=24',
  'bad.events.pop()','bad.events.shift()','bad.events.reverse()','bad.events[0]=null',
  'bad.events[0].type="status"','bad.events[0].extra=1','bad.events[0].side="enemy"','bad.events[0].slot=1',
  'bad.events[0].targetId=bad.enemies[1].instanceId','bad.events[0].actorId=bad.party[1].instanceId',
  'bad.events[0].hpBefore=99','bad.events[0].hpAfter=92','bad.events[0].appliedDamage=8',
  'bad.events[0].attemptedDamage=6','bad.events[0].attemptedDamage=0','bad.events[0].attemptedDamage=Number.MAX_SAFE_INTEGER+1',
  'bad.events[0].critical=1','bad.events[0].evaded=true','bad.events[0].evaded="false"',
  'bad.events.at(-1).roundBefore=1','bad.events.at(-1).roundAfter=2','bad.events.at(-1).outcome="victory"',
  'bad.enemies[0].hp-=1','bad.party[0].hp=0',
  'bad.events[0]={type:"skip",...bad.order[0],reason:"actor_removed"}',
  'bad.events[0]={type:"skip",...bad.order[0],reason:"actor_dead"}',
  'bad.events[0]={type:"cancel",...bad.order[0],reason:"target_dead"}',
  'bad.events[0]={type:"cancel",...bad.order[0],reason:"target_removed"}',
  'bad.events.splice(1,0,{...bad.events[0]})','bad.events.splice(1,0,{...bad.events.at(-1)})',
  'bad.outcome="victory";bad.events.at(-1).outcome="victory"',
  'bad.outcome="defeat";bad.events.at(-1).outcome="defeat"',
  'bad.command.allyActions[0].callback=()=>{getterCalls++;}',
  'Object.defineProperty(bad,"round",{get(){getterCalls++;return 1;}})',
  'Object.defineProperty(bad.events[0],"hpAfter",{get(){getterCalls++;return 93;}})',
  'Object.defineProperty(bad.party,0,{get(){getterCalls++;return {};}})',
  'Object.setPrototypeOf(bad,{inherited:true})','Object.setPrototypeOf(bad.events[0],{inherited:true})',
  'Object.setPrototypeOf(bad.events,{inherited:true})','bad.events[0]=new Date()',
  'bad[Symbol("extra")]=0','bad.events.extra=true','delete bad.events[0]','bad.events[0]=bad',
];
for(const change of corruptions)test('reject frozen contradictory or non-data history: '+change,()=>{const {g}=ordinary();altered(g,change);reject(g);});
test('unfrozen trees and writable live enemy references reject without freezing live state',()=>{
  const {g}=ordinary();g.run('var bad='+JSON.stringify(g.run('roundResult'))+';');reject(g);
  g.run('bad=Object.freeze({...roundResult,enemies:Object.freeze([combat.enemies[0],roundResult.enemies[1]])});');reject(g);
  assert.equal(g.run('Object.isFrozen(combat.enemies[0])'),false);
});
test('attacks after terminal HP and historically dead attackers reject even with coherent damage arithmetic',()=>{
  const g=fresh(1);g.run('combatPlayerState.setHp(combatPlayerState.getView().members[0].instanceId,1);combatPlayerState.setHp(combatPlayerState.getView().members[1].instanceId,1);');
  resolve(g,[2,0,1],[], 'command.allyActions.forEach(a=>a.targetId=combat.enemies[0].instanceId);');
  altered(g,'bad.events[1]={type:"attack",...bad.order[1],attemptedDamage:7,appliedDamage:7,critical:false,evaded:false,hpBefore:100,hpAfter:93};bad.events[2].hpBefore=93;bad.events[2].hpAfter=86;bad.enemies[0].hp=86;');reject(g);
  const h=fresh(1);h.run('combat.enemies[0].hp=1;');resolve(h);
  altered(h,'bad.events.splice(1,0,{type:"cancel",...bad.order[1],reason:"target_dead"});');reject(h);
});
test('contradictory dead skip/cancel and broken repeated-target continuity reject',()=>{
  const g=fresh(1);resolve(g);altered(g,'bad.events[0].hpBefore=101;');reject(g);
  const h=fresh(2);h.run('combat.enemies[0].hp=1;');resolve(h,[0,1,2,3],[], 'command.allyActions[1].targetId=command.allyActions[0].targetId;');
  altered(h,'bad.events[1]={type:"skip",...bad.order[1],reason:"actor_dead"};');reject(h);
  altered(h,'bad.events[2]={type:"cancel",...bad.order[2],reason:"target_dead"};');reject(h);
});

test('unsafe cumulative draw arithmetic rejects without initiative replay',()=>{
  const {g}=ordinary();altered(g,`const weight=Math.floor(Number.MAX_SAFE_INTEGER/3);
    bad.party.forEach(m=>m.spd=weight);bad.enemies.forEach(m=>m.spd=weight);
    bad.order.forEach(a=>a.spd=weight);bad.events.filter(e=>e.type!=='round_end').forEach(e=>e.spd=weight);
    bad.initiative.forEach(d=>{d.candidates.forEach(c=>c.weight=weight);d.weight=weight;d.totalWeight=d.candidates.length*weight;
      d.intervalStart=0;d.intervalEnd=weight;d.roll=0;d.point=0;});`);reject(g);
});
test('saving and loading contain no playback state; a historical reel survives a fresh load',()=>{
  const g=fresh();g.run('combatPlayerState.clear();combat.enemy=null;resetLocationState();placeAtLocation("MAP",7.5*TILE,9.5*TILE);');
  assert.equal(g.run('saveGame()'),true);const saved=g.run('localStorage.getItem("verdantVale_save")');
  g.run('combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,hp:100,maxHp:100,atk:10,def:3,spd:10};combatPlayerState.initialize(fixtures);');
  resolve(g);const reel=create(g),historical=JSON.stringify(reel);assert.equal(g.run('saveGame()'),false);
  assert.equal(g.run('localStorage.getItem("verdantVale_save")'),saved);assert.equal(g.run('loadGame()'),true);
  assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('saveGame()'),true);
  assert.equal(g.run('localStorage.getItem("verdantVale_save")'),saved);
  assert.equal(g.run('combatPlayerState.projectAttackRoundPlaybackFrame(playback,0)'),reel.frames[0]);assert.equal(JSON.stringify(reel),historical);
});
test('a coherent frozen structural copy is accepted, and null-prototype data remain inert',()=>{
  const {g,reel}=ordinary();altered(g,'Object.setPrototypeOf(bad,null);');
  equal(unchanged(g,()=>g.run('combatPlayerState.createAttackRoundPlayback(bad)')),reel);
});

function capacityFixture(g,allies,enemies) {
  g.run(`var structural=${JSON.stringify(g.run("roundResult"))};
    structural.party=[...Array.from({length:${allies}},(_,slot)=>({...structural.party[0],characterId:'fixture_capacity_'+slot,instanceId:'combat_party_'+(slot+10),slot,hp:100,statuses:[]}))];
    structural.enemies=[...Array.from({length:${enemies}},(_,slot)=>({...structural.enemies[0],instanceId:'combat_enemy_'+(slot+10),slot,hp:100}))];
    structural.command={type:'attack-round',allyActions:structural.party.map((m,i)=>({actorId:m.instanceId,targetId:structural.enemies[i%structural.enemies.length].instanceId})),
      enemyActions:structural.enemies.map((m,i)=>({actorId:m.instanceId,targetId:structural.party[i%structural.party.length].instanceId}))};
    structural.order=[...structural.command.allyActions.map((a,slot)=>({...a,side:'ally',slot,spd:10})),...structural.command.enemyActions.map((a,slot)=>({...a,side:'enemy',slot,spd:10}))];
    structural.initiative=planPartyAttackOrder(structural.order,Array(structural.order.length-1).fill(0)).initiative;
    structural.events=structural.order.map(a=>{const target=[...structural.party,...structural.enemies].find(m=>m.instanceId===a.targetId),hpBefore=target.hp;target.hp-=7;
      return {type:'attack',...a,attemptedDamage:7,appliedDamage:7,critical:false,evaded:false,hpBefore,hpAfter:target.hp};});
    structural.events.push({type:'round_end',roundBefore:0,roundAfter:1,outcome:'ongoing'});structural.round=1;structural.outcome='ongoing';roundResult=copyFormationData(structural);`);
}
for(const [allies,enemies] of [[1,1],[1,3],[3,1],[3,3]])test('structural '+allies+'v'+enemies+' capacity without preparing additional live allies',()=>{
  const {g}=ordinary(3),before=state(g);capacityFixture(g,allies,enemies);assert.equal(state(g),before);
  const reel=create(g);verify(g,reel,Array(allies+enemies).fill(100));assert.equal(reel.order.length,allies+enemies);assert.equal(g.run('combatPlayerState.getView().members.length'),2);
  if(allies===3&&enemies===3) {assert.equal(reel.frameCount,8);assert.equal(reel.initiative.length,5);}
});
test('six-actor history cannot expand preparation; only the gated session calls playback, with no save field or visible route',()=>{
  const {g}=ordinary();capacityFixture(g,3,3);create(g);g.run('combatPlayerState.clear();');
  unchanged(g,()=>assert.throws(()=>g.run('combatPlayerState.initialize([...fixtures,{...fixtures[1],characterId:"fixture_third",slot:2}])'),/Invalid player-party/));
  for(const file of scriptOrderFromIndexHtml()) {
    const source=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
    for(const method of ['createAttackRoundPlayback','projectAttackRoundPlaybackFrame']) {
      const pattern=new RegExp('combatPlayerState\\.'+method+'\\s*\\(','g');
      assert.equal((source.match(pattern)||[]).length,file==='combat.js'?1:0,file);
      if(file==='combat.js') {
        const start=source.indexOf('  const session=(() => {'),end=source.indexOf('    session,',start);
        assert.ok(start>=0&&end>start);assert.doesNotMatch(source.slice(0,start)+source.slice(end),pattern);
      }
    }
    if(file!=='combat.js')assert.doesNotMatch(source,/partyAttackPlayback/,file);
  }
  assert.equal(g.run('SAVE_VERSION'),4);
});
module.exports={name:'detached party Attack playback: closed histories, immutable frames and zero live-state effects',checks,
  run(){for(const check of checks){try{check.run();}catch(error){console.error('Failed party playback check:',check.name);throw error;}}console.log('  '+checks.length+' party playback checks passed');}};
