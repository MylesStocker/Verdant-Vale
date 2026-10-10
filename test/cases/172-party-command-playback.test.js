'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const H=require('./170-party-command-rounds.test'),{ITEM_MATRIX}=require('./171-party-command-status-hardening.test');
const {fresh,command,resolve,J,ids,canonical,state,frozen,HIT}=H;
const {scriptOrderFromIndexHtml}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const equal=(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
const fields=['party','enemies','inventory','equipment','effects','escapePolicy','bossLocked'];
const projection=f=>Object.fromEntries(fields.map(k=>[k,['party','enemies'].includes(k)?f[k].map(({alive,defeated,...m})=>m):f[k]]));
function unchanged(g,fn){const before=state(g),world=canonical(g),sequence=g.run('combatEnemyInstanceSequence');const value=fn();assert.equal(state(g),before);assert.equal(canonical(g),world);assert.equal(g.run('combatEnemyInstanceSequence'),sequence);assert.equal(g.run('rngCalls'),0);assert.equal(g.run('getterCalls'),0);return value;}
function create(g){g.run('rngCalls=0;var getterCalls=0;Math.random=()=>{rngCalls++;throw Error("playback RNG")};');
  return unchanged(g,()=>g.run('var reel=combatPlayerState.createRoundPlayback(result);reel'));}
function verify(g,reel){
  const r=J(g,'result');frozen(reel);assert.deepEqual(Object.keys(reel).sort(),['round','command','initiative','order','eventCount','frameCount','frames'].sort());
  equal(reel.command,r.command);equal(reel.initiative,r.initiative);equal(reel.order,r.order);assert.equal(reel.frameCount,r.events.length+1);assert.equal(reel.eventCount,r.events.length);
  equal(projection(reel.frames[0]),r.before);equal(projection(reel.frames.at(-1)),r.after);
  for(const [i,f]of reel.frames.entries()){
    assert.deepEqual(Object.keys(f).sort(),['round','command','frameIndex','eventIndex','currentEvent',...fields,'complete','outcome','completedRounds'].sort());
    assert.equal(f.round,r.round);equal(f.command,r.command);assert.equal(f.frameIndex,i);assert.equal(f.eventIndex,i-1);equal(f.currentEvent,i?r.events[i-1]:null);
    assert.equal(f.complete,i===r.events.length);assert.equal(f.completedRounds,i===r.events.length?r.round:r.round-1);
    assert.equal(f.outcome,i>r.events.findIndex(e=>e.type==='outcome')?r.outcome:'ongoing');
    for(const side of ['party','enemies']){equal(f[side].map(m=>m.instanceId),r.before[side].map(m=>m.instanceId));
      f[side].forEach((m,slot)=>{assert.equal(m.slot,slot);assert.equal(m.alive,m.hp>0);assert.equal(m.defeated,m.hp===0);});}
  }
  unchanged(g,()=>{for(const i of [...reel.frames.keys()].reverse())assert.equal(g.run('combatPlayerState.projectRoundPlaybackFrame(reel,'+i+')'),reel.frames[i]);});
  return reel;
}
function fixture(options={},actions,order,execution){const g=fresh(options);resolve(g,command(g,actions),order,execution);const reel=create(g);verify(g,reel);return {g,reel,r:J(g,'result')};}
const eventFrame=(reel,type)=>reel.frames.find(f=>f.currentEvent?.type===type);
function slither(type='attack'){
  const g=fresh({allies:1,enemies:1,inventory:['Potion'],party:[{statuses:['slither']}],slither:[{slot:0,speed:5}]});
  const c=command(g,type==='item'?[['item',0,'a0','Potion']]:[[type,0,0]]);
  if(type==='attack'||type==='observe'){
    const tape=[0.5,0,...(type==='attack'?HIT:[]),...HIT];g.run(`var tape=${JSON.stringify(tape)},used=0;Math.random=()=>tape[used++];var result=combatPlayerState.resolveRound(${JSON.stringify(c)})`);assert.equal(g.run('used'),tape.length);
  }else resolve(g,c,null,type==='run'?[0]:HIT);
  const reel=create(g);verify(g,reel);return {g,reel,r:J(g,'result')};
}
function altered(g,edit){g.run('var bad='+JSON.stringify(J(g,'result'))+';'+edit+`;function freezeHistory(v,seen=new Set()){
  if(v&&['object','function'].includes(typeof v)&&!seen.has(v)){seen.add(v);for(const d of Object.values(Object.getOwnPropertyDescriptors(v)))if(Object.hasOwn(d,'value'))freezeHistory(d.value,seen);Object.freeze(v);}}
  freezeHistory(bad);`);}
function rejects(g,expression='combatPlayerState.createRoundPlayback(bad)'){unchanged(g,()=>assert.throws(()=>g.run(expression),/Invalid party command playback history/));}
function corrupt(make,edits){for(const edit of edits)test('reject '+edit,()=>{const {g}=make();altered(g,edit);rejects(g);});}
for(let a=1;a<=3;a++)for(let e=1;e<=3;e++)test(`${a}v${e} complete Attack history, fixed slots and duplicate enemy identities`,()=>{
  const {reel}=fixture({allies:a,enemies:e});assert.equal(reel.order.length,a+e);assert.equal(reel.initiative.length,a+e-1);
  assert.equal(new Set(reel.frames[0].enemies.map(m=>m.instanceId)).size,e);assert.equal(new Set(reel.frames[0].enemies.map(m=>m.id)).size,1);
});
test('Attack-only playback API and generalized ordinary HP projections agree without changing either schema',()=>{
  const {g,reel,r}=fixture(),old=fresh({legacy:true}),c=command(old),tape=J(g,'tape');
  old.run(`var tape=${JSON.stringify(tape)};Math.random=()=>tape.shift();var result=combatPlayerState.resolveAttackRound(${JSON.stringify({...c,type:'attack-round',allyActions:c.allyActions.map(({type,...a})=>a)})});var reel=combatPlayerState.createAttackRoundPlayback(result)`);
  const previous=J(old,'reel');equal(reel.initiative,previous.initiative);
  for(let i=0;i<previous.frames.length-1;i++)equal([...reel.frames[i].party,...reel.frames[i].enemies].map(m=>m.hp),[...previous.frames[i].party,...previous.frames[i].enemies].map(m=>m.hp));
  equal(r.party.map(m=>m.hp),J(old,'result.party.map(m=>m.hp)'));assert.equal(Object.keys(previous.frames[0]).length,8);
});
test('Observe records authored text and exact duplicate-instance progress',()=>{
  const {reel,r}=fixture({},[['attack',0,0],['observe',1,1]]),f=eventFrame(reel,'observe');equal(f.currentEvent.lines,r.events.find(e=>e.type==='observe').lines);equal(f.enemies.map(m=>m.observeCount),[0,1]);
});
test('healing changes only the selected ally and consumes one shared item',()=>{
  const {reel}=fixture({inventory:['Potion'],party:[{hp:10},{hp:10}]},[['item',0,'a1','Potion'],['observe',1,0]]),f=eventFrame(reel,'item');equal(f.party.map(m=>m.hp),[10,30]);equal(f.inventory,[]);
});
test('cure annotations do not apply twice; a later Attack has no Curse check',()=>{
  const {reel,r}=fixture({inventory:['Amethyst Dust'],party:[{},{statuses:['cursed']}]},[['item',0,'a1','Amethyst Dust'],['attack',1,0]]),f=eventFrame(reel,'status');
  equal(projection(f),projection(reel.frames[f.frameIndex-1]));equal(f.party[1].statuses,[]);assert.ok(!r.events.some(e=>e.type==='curse_check'));
});
test('Bullet Time application and application exemption, later decrement only at round_end',()=>{
  const {g,reel}=fixture({inventory:['Bullet Time']},[['item',0,'a1','Bullet Time'],['observe',1,0]]);
  assert.equal(eventFrame(reel,'item').effects[1].evadeTurns,3);assert.equal(reel.frames.at(-1).effects[1].evadeTurns,3);
  resolve(g,command(g,[['observe',0,0],['observe',1,0]]),null,[...HIT,...HIT]);const next=create(g);verify(g,next);
  assert.equal(next.frames.at(-2).effects[1].evadeTurns,3);assert.equal(next.frames.at(-1).effects[1].evadeTurns,2);
});
test('immediate offensive item targets exactly one enemy',()=>{const {reel}=fixture({inventory:['Sapper Charge']},[['item',0,1,'Sapper Charge'],['observe',1,0]]);equal(eventFrame(reel,'item').enemies.map(m=>m.hp),[100,50]);});
test('all-enemy item has no fabricated selected target',()=>{const {reel}=fixture({enemies:3,inventory:['Void Shard']},[['item',0,null,'Void Shard'],['observe',1,0]]);const f=eventFrame(reel,'item');equal(f.enemies.map(m=>m.hp),[43,43,43]);assert.equal(f.currentEvent.targetId,null);});
test('Bomb application, countdown and detonation are projected once per recorded event',()=>{
  const {g,reel}=fixture({inventory:['Bomb']},[['item',0,1,'Bomb'],['observe',1,0]]);assert.equal(reel.frames.at(-1).effects[0].bomb.fuse,3);
  for(const fuse of [2,1,0]){resolve(g,command(g,[['observe',0,0],['observe',1,0]]),null,[...HIT,...HIT]);const p=create(g);verify(g,p);const f=eventFrame(p,'delayed_effect_tick');assert.equal(f.currentEvent.effect,'bomb');assert.equal(f.effects[0].bomb?.fuse||0,fuse);assert.equal(f.enemies[1].hp,fuse?100:20);}
});
test('equipment exchange preserves another ally and returns the exact prior item',()=>{
  const {g}=fixture({inventory:['Iron Sword','Steel Sword']},[['item',0,'a0','Iron Sword'],['observe',1,0]]);
  resolve(g,command(g,[['item',0,'a0','Steel Sword'],['observe',1,0]]),null,[...HIT,...HIT]);const reel=create(g);verify(g,reel);const f=eventFrame(reel,'equipment');
  equal(f.equipment.map(m=>m.weapon),['Steel Sword',null]);equal(f.inventory,['Iron Sword']);assert.equal(f.party[0].effective.atk,17);
});
for(const id of ['Bait','Henbane Sprig','Jackbane Vial','Trollbane'])test('established no-effect history '+id,()=>{
  const {reel}=fixture({inventory:[id]},[['item',0,id==='Bait'?'a0':0,id],['observe',1,0]]);const f=eventFrame(reel,'item');equal(f.enemies.map(m=>m.hp),[100,100]);equal(f.inventory,id==='Bait'?[id]:[]);
});
for(const type of ['item','observe'])test('dead committed target cancels '+type+' without consumption or retargeting',()=>{
  const {reel}=fixture({inventory:['Sapper Charge','Throwing Knife'],enemy:[{hp:20},{}]},[['item',0,0,'Sapper Charge'],type==='item'?['item',1,0,'Throwing Knife']:['observe',1,0]],null,HIT);
  const f=eventFrame(reel,'cancel');assert.equal(f.currentEvent.reason,'target_dead');equal(f.inventory,['Throwing Knife']);assert.equal(f.enemies[0].hp,0);assert.equal(f.enemies[0].slot,0);
});
test('dead item user is retained, skipped, and consumes nothing',()=>{
  const {reel}=fixture({inventory:['Potion'],party:[{hp:1},{}]},[['item',0,'a1','Potion'],['observe',1,0]],['e0','a0','a1','e1'],[...HIT,...HIT]);const f=eventFrame(reel,'skip');assert.equal(f.party[0].hp,0);equal(f.inventory,['Potion']);
});
for(const [draw,fumbled]of [[0.8,false],[0.1,true]])test('Curse check '+(fumbled?'fumble':'proceeds')+' precedes recorded Attack',()=>{
  const {reel}=fixture({allies:1,enemies:1,party:[{statuses:['cursed']}]},undefined,undefined,[draw,...(fumbled?[]:HIT),...HIT]),f=eventFrame(reel,'curse_check');
  assert.equal(f.currentEvent.fumbled,fumbled);assert.equal(f.enemies[0].hp,100);assert.equal(reel.frames[f.frameIndex+1].currentEvent.attemptedDamage,fumbled?1:7);
});
for(const type of ['attack','observe','item','run'])test('Slither ownership on '+type,()=>{
  const {reel}=slither(type),sample=eventFrame(reel,'slither_sample'),f=reel.frames.at(-1);assert.equal(!!sample,['attack','observe'].includes(type));
  assert.equal(f.effects[0].slither.speed,sample?11:5);assert.equal(reel.order[0].spd,sample?11:5);assert.equal(f.party[0].effective.spd,sample?11:5);
});
for(const [name,options,order,execution]of [
  ['blocked',{escape:'blocked'},null,[...HIT,...HIT]],['boss',{boss:true},null,[...HIT,...HIT]],
  ['failed',{},null,[0.99,...HIT,...HIT]],['success',{},['e0','a0','e1'],[...HIT,0]],
  ['runner death',{party:[{hp:1},{}]},['e0','a0','e1'],[...HIT,...HIT]]])test('Run '+name,()=>{
    const {reel}=fixture(options,[['run',0]],order,execution);assert.equal(reel.order.length,3);assert.equal(reel.frames.at(-1).outcome,name==='success'?'escape':'ongoing');
    if(name==='runner death')assert.ok(!eventFrame(reel,'run'));else assert.equal(eventFrame(reel,'run').currentEvent.roll,['blocked','boss'].includes(name)?null:name==='failed'?0.99:0);
});
for(const outcome of ['victory','defeat'])test(outcome+' truncates actions, remains hidden until outcome, retains final frame',()=>{
  const options=outcome==='victory'?{inventory:['Void Shard'],enemy:[{hp:20},{hp:20}]}:{party:[{hp:1},{hp:1}]};
  const {reel}=fixture(options,outcome==='victory'?[['item',0,null,'Void Shard'],['observe',1,0]]:undefined,outcome==='victory'?null:['e0','e1','a0','a1'],outcome==='victory'?[]:[...HIT,...HIT]);
  assert.equal(reel.frames.at(-1).outcome,outcome);assert.equal(reel.frames.at(-2).outcome,outcome);assert.equal(reel.frames.at(-3).outcome,'ongoing');assert.equal(reel.frames.at(-2).complete,false);
});
test('Burn ticks in owner-slot order once, before Bomb and round completion',()=>{
  const {reel}=fixture({party:[{statuses:['burn']},{statuses:['burn']}]},[['observe',0,0],['observe',1,0]],null,[...HIT,...HIT,0.25,0.5]);
  equal(reel.frames.filter(f=>f.currentEvent?.type==='delayed_effect_tick').map(f=>f.currentEvent.attemptedDamage),[5,10]);
});
test('zero-HP starting members retain slots and collect no commands',()=>{const {reel}=fixture({allies:3,party:[{hp:0},{},{}]});assert.equal(reel.frames[0].party[0].defeated,true);assert.ok(reel.order.every(a=>a.actorId!==reel.frames[0].party[0].instanceId));});
for(const [effect,items]of Object.entries(ITEM_MATRIX))if(effect!=='unavailable_key')for(const id of items)test('complete authored item playback '+id,()=>{
  const friendly=['heal','cure','evade','equip','nothing'].includes(effect);
  fixture({inventory:[id],party:[{hp:20,statuses:['poison','cursed']},{}]},[['item',0,effect==='damage_all'?null:friendly?'a0':0,id],['observe',1,1]],null,[...HIT,...HIT]);
});
test('returned structures are detached from source objects; reads do not rerun any combat authority',()=>{
  const {g,reel}=fixture(),before=JSON.stringify(reel),source=g.run('result'),seen=new Set();
  const collect=v=>{if(v&&typeof v==='object'){seen.add(v);Object.values(v).forEach(collect);}};collect(source);
  const check=v=>{if(v&&typeof v==='object'){assert.ok(!seen.has(v));Object.values(v).forEach(check);}};check(reel);
  assert.throws(()=>source.events.reverse());assert.throws(()=>{reel.frames[0].party[0].hp=1;});assert.throws(()=>reel.frames[0].inventory.push('Potion'));
  g.run(`for(const name of ['planPartyAttackOrder','partyInitiativeWeights','attackDamageNumbers','evadeChance','speedWinChance','healingItemAmount','offensiveItemDamage','itemCuredStatuses','formationItemDefinition','getObservationText','rollSlitherSpd','equipItem','applyStatusCure','resolveFormationRound','endCombat'])globalThis[name]=()=>{throw Error('forbidden '+name);};
    Object.defineProperty(stats,'hp',{get(){throw Error('live Lely read')},configurable:true});Object.defineProperty(combat.enemies[0],'hp',{get(){throw Error('live enemy read')},configurable:true});
    for(const id of Object.keys(ITEM_REGISTRY))ITEM_REGISTRY[id]={keyItem:true};`);
  equal(g.run('combatPlayerState.createRoundPlayback(result)'),reel);
  for(const i of [2,0,reel.frameCount-1,1,0])assert.equal(g.run('combatPlayerState.projectRoundPlaybackFrame(reel,'+i+')'),reel.frames[i]);assert.equal(JSON.stringify(reel),before);assert.equal(g.run('rngCalls'),0);
});
test('later inventory, gear, HP, status, observation, cleanup, replacement and saves cannot change history',()=>{
  const {g,reel}=fixture({inventory:['Potion','Iron Sword','Amethyst Dust'],party:[{statuses:['cursed']},{}]},[['observe',0,0],['observe',1,1]]),before=JSON.stringify(reel);g.run('var historical=result');
  resolve(g,command(g,[['item',0,'a0','Amethyst Dust'],['item',1,'a1','Iron Sword']]),null,[...HIT,...HIT]);
  resolve(g,command(g,[['item',0,'a1','Potion'],['observe',1,0]]),null,[...HIT,...HIT]);
  g.run('combatPlayerState.clear();combat.enemy=null;saveGame();loadGame();dialogue.open=false;dialogue.callbacks=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};combatPlayerState.initialize(seed.members);var result=historical');
  create(g);equal(g.run('reel'),reel);assert.equal(JSON.stringify(reel),before);
});
test('invalid frame indices and forged reels reject without mutation',()=>{
  const {g}=fixture();for(const index of ['-1','1.5','NaN','Infinity','undefined','null','"0"','reel.frameCount','Number.MAX_SAFE_INTEGER'])unchanged(g,()=>assert.throws(()=>g.run('combatPlayerState.projectRoundPlaybackFrame(reel,'+index+')'),e=>e.name==='RangeError'));
  for(const v of ['null','{}','copyFormationData(reel)'])rejects(g,'combatPlayerState.projectRoundPlaybackFrame('+v+',0)');
  rejects(g,'combatPlayerState.createRoundPlayback(result,true)');rejects(g,'combatPlayerState.projectRoundPlaybackFrame(reel,0,true)');
});
corrupt(()=>fixture(),[
  'bad.extra=true','delete bad.before','bad.round=0','bad.round=1.5','bad.outcome="escape"','bad.after.inventory.push("Potion")','bad.before.inventory.push("Warp Stone")',
  'bad.before.party[0].hp=99','bad.before.party[0].hp=101','bad.before.party[0].maxHp=0','bad.before.party[0].effective.atk=Infinity','bad.before.party[0].effective.extra=0',
  'bad.before.party[1].instanceId=bad.before.party[0].instanceId','bad.before.party[1].characterId=bad.before.party[0].characterId','bad.before.party[0].side="enemy"','bad.before.party[0].slot=1','bad.before.party.reverse()',
  'bad.before.enemies[0].instanceId="combat_enemy_9007199254740992"','bad.before.enemies[0].id="enemy_gallery_receiver"','bad.before.enemies[0].escapeUnlocked=true','bad.before.enemies.pop()',
  'bad.after.party[0].name="Replacement"','bad.after.party[0].hp--','bad.party[0].hp--','bad.enemies[0].hp--','bad.before.effects[0].actorId=bad.before.party[1].instanceId',
  'bad.before.effects[0].evadeTurns=-1','bad.before.equipment[0].weapon="Potion"','bad.before.equipment[0].extra=0','bad.before.party[0].statuses=["unknown"]',
  'bad.command.type="attack-round"','bad.command.allyActions.pop()','bad.command.enemyActions.pop()','bad.command.allyActions.reverse()',
  'bad.command.allyActions[0].targetId=bad.before.party[1].instanceId','bad.command.enemyActions[0].actorId=bad.before.party[0].instanceId',
  'bad.command.allyActions[0].actorId="combat_party_999"','bad.command.allyActions[0].extra=0','bad.command.allyActions[1]={...bad.command.allyActions[0]}',
  'bad.order.reverse()','bad.order[0].targetId=bad.before.enemies[1].instanceId','bad.order[0].spd++','bad.order[0].slot=1','bad.order.pop()',
  'bad.initiative.reverse()','bad.initiative[0].candidates.reverse()','bad.initiative[0].weight++','bad.initiative[0].totalWeight++','bad.initiative[0].roll=1','bad.initiative[0].point++','bad.initiative[0].intervalStart++','bad.initiative[0].intervalEnd++',
  'bad.events[0].type="unknown"','bad.events[0].extra=0','bad.events[0].actorId=bad.before.party[1].instanceId','bad.events[0].targetId=bad.before.enemies[1].instanceId',
  'bad.events[0].hpBefore--','bad.events[0].hpAfter--','bad.events[0].appliedDamage++','bad.events[0].attemptedDamage++','bad.events[0].critical=1','bad.events[0].evaded=true',
  'bad.events[0]={type:"skip",...bad.order[0],reason:"actor_dead"}','bad.events[0]={type:"cancel",...bad.order[0],reason:"target_dead"}',
  'bad.events.pop()','bad.events.splice(-2,1)','bad.events.push({...bad.events.at(-1)})','bad.events.at(-1).roundBefore++','bad.events.at(-1).roundAfter++','bad.events.at(-1).effectsBefore[0].evadeTurns=1',
  'bad.events.at(-2).outcome="victory"','bad.events.at(-1).outcome="defeat"','bad.events[0].hpBefore=()=>100',
  'Object.defineProperty(bad.events[0],"hpBefore",{get(){getterCalls++;return 100}})','Object.setPrototypeOf(bad.events[0],{extra:true})','bad.before.self=bad.before',
]);
const heal=()=>fixture({inventory:['Potion'],party:[{hp:10},{hp:10}]},[['item',0,'a1','Potion'],['observe',1,0]]);
corrupt(heal,['bad.events[0].consumed=false','bad.events[0].before.inventory=[]','bad.events[0].after.inventory.push("Potion")','bad.events[0].after.party[0].hp++',
  'bad.events[0].after.party[1].statuses.push("burn")','bad.events[0].itemId="Warp Stone"','bad.events[0].effect="damage"',
  'bad.events[0].after.enemies[0].hp--','bad.events[0].after.equipment[1].weapon="Iron Sword"']);
const gear=()=>fixture({inventory:['Iron Sword']},[['item',0,'a0','Iron Sword'],['observe',1,0]]);
corrupt(gear,['bad.events[0].after.equipment[1].weapon="Iron Sword"','bad.events[0].after.equipment[0].weapon="Steel Sword"','bad.events[0].after.inventory.push("Iron Sword")','bad.events[0].after.party[0].effective.def++']);
const observed=()=>fixture({},[['observe',0,0],['observe',1,1]]);
corrupt(observed,['bad.events[0].countBefore++','bad.events[0].countAfter++','bad.events[0].escapeAfter=true','bad.events[0].lines=[7]']);
const cursed=()=>fixture({allies:1,enemies:1,party:[{statuses:['cursed']}]},undefined,undefined,[0.1,...HIT]);
corrupt(cursed,['bad.events.shift()','bad.events[0].roll=0.9','bad.events[0].fumbled=false','bad.events[0].chance=0.5','bad.events[0].status="burn"','bad.events[1].critical=true','bad.events[1].evaded=true','bad.events[1].attemptedDamage=2']);
corrupt(()=>slither(),['bad.events.shift()','bad.events[0].speedAfter++','bad.events[0].speedBefore++','bad.events[0].slot=1','bad.events[0].round++','bad.before.effects[0].slither.round=1','bad.before.effects[0].slither.speed=0','bad.after.effects[0].slither.roll=0.1']);
const running=()=>fixture({},[['run',0]],null,[0]);
corrupt(running,['bad.events[0].success=false','bad.events[0].allowed=false','bad.events[0].roll=1','bad.events[0].opponentId="combat_enemy_999"','bad.before.bossLocked=true',
  'bad.events.splice(1,0,{type:"skip",...bad.order[1],reason:"actor_dead"})']);
corrupt(()=>fixture({escape:'blocked'},[['run',0]],null,[...HIT,...HIT]),['bad.events[0].roll=0','bad.events[0].success=true','bad.events[0].chance=0.5']);
const buff=()=>fixture({inventory:['Bullet Time']},[['item',0,'a1','Bullet Time'],['observe',1,0]]);
corrupt(buff,['bad.events.splice(1,1)','bad.events[1].effectsBefore[1].evadeTurns=1','bad.events[0].after.effects[1].evadeAppliedRound=0','bad.events.at(-1).effectsAfter[1].evadeTurns=2']);
const bombTick=()=>{const {g}=fixture({inventory:['Bomb']},[['item',0,0,'Bomb'],['observe',1,0]]);resolve(g,command(g,[['observe',0,0],['observe',1,0]]),null,[...HIT,...HIT]);const reel=create(g);verify(g,reel);return {g,reel};};
corrupt(bombTick,['bad.events.find(e=>e.type==="delayed_effect_tick").before.fuse++','bad.events.find(e=>e.type==="delayed_effect_tick").after.fuse++','bad.events.find(e=>e.type==="delayed_effect_tick").targetId=bad.before.enemies[1].instanceId','bad.events.find(e=>e.type==="delayed_effect_tick").ownerId=bad.before.party[1].instanceId']);
test('mutable source trees reject before getters or RNG; no production caller or save changes',()=>{
  const {g}=fixture();g.run('var bad='+JSON.stringify(J(g,'result')));rejects(g);
  for(const file of scriptOrderFromIndexHtml())if(file!=='combat.js')assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),/combatPlayerState\.(?:createRoundPlayback|projectRoundPlaybackFrame)\(/,file);
  assert.equal(g.run('SAVE_VERSION'),4);assert.equal(g.run('combat.active'),false);
});
test('recorded mud application changes only its target; status annotation preserves that frame',()=>{
  const g=fresh({inventory:['Ember Root']});g.run('MUDSLITHER_INFLICTABLE=true');resolve(g,command(g,[['item',0,'a1','Ember Root'],['observe',1,0]]));const reel=create(g);verify(g,reel);
  const f=eventFrame(reel,'status');equal(f.party[1].statuses,['muddied']);assert.equal(f.party[1].effective.spd,8);equal(projection(f),projection(reel.frames[f.frameIndex-1]));
});
test('recorded burn defeat stops remaining boundary work',()=>{
  const {reel}=fixture({allies:1,enemies:1,party:[{hp:1,statuses:['burn']}]},[['observe',0,0]],null,[0.5,0.99,0,0.99]);
  assert.equal(reel.frames.at(-1).outcome,'defeat');assert.equal(eventFrame(reel,'delayed_effect_tick').party[0].hp,0);
});
test('Bomb victory truncates subsequent boundary ticks and retains historical zero-HP slot',()=>{
  const {g}=fixture({enemies:1,inventory:['Bomb'],enemy:[{hp:70}]},[['item',0,0,'Bomb'],['observe',1,0]],null,HIT);
  for(let round=0;round<3;round++)resolve(g,command(g,[['observe',0,0],['observe',1,0]]),null,HIT);
  const reel=create(g);verify(g,reel);assert.equal(reel.frames.at(-1).outcome,'victory');assert.equal(reel.frames.at(-1).enemies[0].slot,0);assert.equal(reel.frames.at(-1).effects[0].bomb,null);
});
test('encounter boss lock remains historical after the only boss has died',()=>{
  const {g}=fixture({boss:true,inventory:['Sapper Charge'],enemy:[{hp:20},{}]},[['item',0,0,'Sapper Charge'],['observe',1,1]],null,HIT);
  resolve(g,command(g,[['run',0]]),null,HIT);const reel=create(g);verify(g,reel);assert.equal(reel.frames[0].enemies[0].hp,0);assert.equal(eventFrame(reel,'run').currentEvent.allowed,false);
});
test('Slither historical samples survive cleanup and replacement with fresh identities',()=>{
  const {g,reel}=slither(),before=JSON.stringify(reel);g.run('var historical=result;combatPlayerState.clear();combat.enemy=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};combatPlayerState.initializeCommandParty(seed);var result=historical');
  assert.equal(g.run('combatPlayerState.getView().members[0].instanceId'),'combat_party_2');create(g);equal(g.run('reel'),reel);assert.equal(JSON.stringify(reel),before);
});
test('initially dead targets, extra Run allies and false terminal continuation reject',()=>{
  const {g}=fixture();for(const edit of ['bad.before.enemies[0].hp=0','bad.command.allyActions[0]={type:"run",actorId:bad.command.allyActions[0].actorId}']){altered(g,edit);rejects(g);}
  const victory=fixture({allies:1,enemies:1,enemy:[{hp:1}]},undefined,null,HIT);altered(victory.g,'bad.events.splice(1,0,{type:"skip",...bad.order[1],reason:"actor_dead"})');rejects(victory.g);
});
const cured=()=>fixture({inventory:['Amethyst Dust'],party:[{},{statuses:['cursed']}]},[['item',0,'a1','Amethyst Dust'],['attack',1,0]]);
corrupt(cured,['bad.events.splice(1,1)','bad.events[1].statusesBefore=[]','bad.events[1].statusesAfter=["cursed"]','bad.events[0].after.party[0].statuses=["poison"]']);
corrupt(()=>slither('item'),['bad.events.unshift({type:"slither_sample",actorId:bad.before.party[0].instanceId,side:"ally",slot:0,status:"slither",round:1,commandType:"item",roll:0.5,speedBefore:5,speedAfter:11})']);

module.exports={name:'Detached generalized party command playback: historical continuity, isolation and closed schemas',checks,
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' generalized party playback checks passed');}};
