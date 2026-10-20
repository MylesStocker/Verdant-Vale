'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const root=path.join(__dirname,'../..'),checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const d of Object.values(Object.getOwnPropertyDescriptors(v))){assert.ok('value'in d);frozen(d.value);}}};
function context({combined=0,disabled=false}={}){
 const read=fs.readFileSync;
 try{
  if(combined||disabled)fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);
   if(String(file).endsWith('/persistent-party.js')&&combined)s=s.replace('  lely:Object.freeze',Array.from({length:combined},(_,i)=>`  fixture_${String.fromCharCode(97+i)}:Object.freeze({id:'fixture_${String.fromCharCode(97+i)}',slot:${i},name:'Fixture',rareBorn:true,affinity:'bloommarked'}),`).join('\n')+'\n  lely:Object.freeze');
   if(String(file).endsWith('/resonance.js')){
    if(combined){const participants=Array.from({length:combined},(_,i)=>({characterId:'fixture_'+String.fromCharCode(97+i),affinity:'bloommarked',strain:1}));s=s.replace('  quickbloom:validateResonanceTechnique',`  fixture_shared:validateResonanceTechnique({...${JSON.stringify({id:'fixture_shared',name:'Fixture shared heal',kind:'combined',initiator:'fixture_a',participants,target:'living_wounded_ally',effect:'heal_fifth'})},elements:Object.freeze(['bloommarked'])}),\n  quickbloom:validateResonanceTechnique`);}
    if(disabled)s=s.replace('return actor.hp > 0;',"return actor.hp > 0 && !(['fixture_b','esla'].includes(actor.characterId) && party[0].hp < 40);");
   }return s;};
  return createContext();
 }finally{fs.readFileSync=read;}
}
function fresh(options={}){
 const {combined=0,allies=combined||2,enemies=1,party=[],enemy=[],inventory=[],enabled=true,prepare=true}=options,g=context(options);
 const members=Array.from({length:allies},(_,slot)=>({characterId:combined?'fixture_'+String.fromCharCode(97+slot):allies===1?'esla':['lely','esla','fixture_c'][slot],slot,name:combined?'Fixture '+slot:allies===1?'Esla':['Lely','Esla','Fixture'][slot],hp:50,maxHp:100,atk:1,def:0,spd:10,statuses:[],...party[slot]}));
 g.run(`dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMenu.open=false;
  ${enemies===1?'combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};':'initializeFormationState('+JSON.stringify(Array.from({length:enemies},(_,slot)=>({enemyId:'enemy_marsh_wisp',slot})))+',{escape:"fastest_living"});'}
  combat.enemies.forEach((e,i)=>Object.assign(e,{hp:1000,maxHp:1000,atk:1,def:0,spd:10},${JSON.stringify(enemy)}[i]||{}));
  var seed=${JSON.stringify({members,inventory,escape:'fastest_living',...(enabled?{resonance:members.map(m=>({slot:m.slot,characterId:m.characterId}))}:{})})};
  Math=Object.create(Math);var used=[];Math.random=()=>{throw Error('unexpected RNG')};
  ${prepare?'combatPlayerState.initializeCommandParty(seed);':''}`);
 return g;
}
const state=g=>g.run('JSON.stringify({party:combatPlayerState.getView(),local:combatPlayerState.getCommandView(),round:combatPlayerState.getRoundView(),session:combatPlayerState.session.getView(),seq:combatEnemyInstanceSequence,stats,statusEffects,slitherSpd,player,day,tick,save:localStorage.getItem("verdantVale_save")})');
const view=g=>J(g,'combatPlayerState.getCommandView()');
const ids=g=>view(g).party.map(m=>m.instanceId);
function action(g,{actor=1,target=0,techniqueId='quickbloom',participants=[actor]}={}){const a=ids(g);return {type:'resonance',actorId:a[actor],techniqueId,targetId:a[target],participantIds:participants.map(i=>a[i])};}
function command(g,res=action(g)){
 const v=view(g),covered=res?.participantIds||[];
 const actions=v.party.filter(m=>m.hp>0&&!covered.includes(m.instanceId)).map(m=>({type:'observe',actorId:m.instanceId,targetId:v.enemies.find(e=>e.hp>0).instanceId}));
 if(res)actions.push(res);actions.sort((a,b)=>v.party.findIndex(m=>m.instanceId===a.actorId)-v.party.findIndex(m=>m.instanceId===b.actorId));
 return {type:'party-round',allyActions:actions,enemyActions:v.enemies.filter(e=>e.hp>0).map(e=>({actorId:e.instanceId,targetId:v.party.find(m=>m.hp>0).instanceId}))};
}
function tape(g,c,order){const v=view(g),pool=[...v.party.filter(m=>m.hp>0).map(m=>({id:m.instanceId,w:m.effective.spd})),...v.enemies.filter(e=>e.hp>0).map(e=>({id:e.instanceId,w:Math.max(1,e.spd)}))];
 const wanted=order?order.map(x=>(x[0]==='a'?v.party:v.enemies)[+x.slice(1)].instanceId):pool.map(m=>m.id),out=[];
 for(const id of wanted.slice(0,-1)){const i=pool.findIndex(m=>m.id===id);assert.ok(i>=0);out.push((pool.slice(0,i).reduce((n,m)=>n+m.w,0)+pool[i].w/2)/pool.reduce((n,m)=>n+m.w,0));pool.splice(i,1);}return out;
}
function resolve(g,c=command(g),order,draws){const t=[...tape(g,c,order),...(draws||c.enemyActions.flatMap(()=>[.5,.99,.99]))];
 g.run(`var request=${JSON.stringify(c)},tape=${JSON.stringify(t)},used=[];Math.random=()=>{if(used.length===tape.length)throw Error('tape exhausted');const v=tape[used.length];used.push(v);return v;};var result=combatPlayerState.resolveRound(request);`);
 assert.deepEqual(J(g,'used'),t);frozen(g.run('result'));const before=state(g);g.run('var reel=combatPlayerState.createRoundPlayback(result)');assert.equal(state(g),before);return J(g,'result');}
function reject(g,source){const before=state(g);assert.throws(()=>g.run(source));assert.equal(state(g),before);}
function editResult(g,source){g.run('var altered='+JSON.stringify(J(g,'result'))+';'+source+';altered=copyFormationData(altered)');reject(g,'combatPlayerState.createRoundPlayback(altered)');}
function finish(g){g.run('while(combatPlayerState.session.getView().phase==="playback")combatPlayerState.session.advancePlayback()');return J(g,'combatPlayerState.session.getView()');}

test('explicit static metadata, sole frozen Quickbloom definition, no capability by membership',()=>{
 const g=fresh({enabled:false});assert.equal(g.run('PERSISTENT_CHARACTER_DEFINITIONS.lely.rareBorn'),false);assert.equal(g.run('PERSISTENT_CHARACTER_DEFINITIONS.lely.affinity'),null);
 assert.equal(g.run('PERSISTENT_CHARACTER_DEFINITIONS.esla.rareBorn'),true);assert.equal(g.run('PERSISTENT_CHARACTER_DEFINITIONS.esla.affinity'),'bloommarked');
 assert.deepEqual(J(g,'Object.keys(RESONANCE_TECHNIQUES)'),['quickbloom']);frozen(g.run('RESONANCE_TECHNIQUES'));
 g.run('var bad='+JSON.stringify(command(g)));reject(g,'combatPlayerState.resolveRound(bad)');assert.equal(view(g).resonance,undefined);
});
for(const edit of ["d.extra=1","d.kind='combined'","d.participants.push(d.participants[0]);d.kind='combined'","d.initiator='absent'","d.effect='damage'","d.target='enemy'","d.participants[0].affinity='unknown'","d.participants[0].strain=Infinity","d.participants[0].strain=-1","Object.defineProperty(d,'name',{get(){throw Error('getter invoked')}})","Object.setPrototypeOf(d,{})","d.callback=()=>{}","d.participants[0].extra=true","d.participants[0].characterId=''","d.participants.length=3"])
 test('closed technique rejection: '+edit,()=>{const g=fresh();g.run('var d='+JSON.stringify(J(g,'RESONANCE_TECHNIQUES.quickbloom'))+';d.elements=Object.freeze([...d.elements]);'+edit);reject(g,'validateResonanceTechnique(d)');});
for(const edit of ["seed.resonance[0].characterId='esla'","seed.resonance[1].slot=0","seed.resonance[1].characterId='unknown'","seed.resonance.push(seed.resonance[1])","seed.resonance[1].strain=0","Object.defineProperty(seed.resonance[1],'characterId',{get(){throw Error('getter')}})"])
 test('preparation rejects invalid capability bindings without allocating identities: '+edit,()=>{const g=fresh({prepare:false});const original=J(g,'seed');g.run(edit);reject(g,'combatPlayerState.initializeCommandParty(seed)');g.run('combatPlayerState.initializeCommandParty('+JSON.stringify(original)+')');assert.deepEqual(ids(g),['combat_party_1','combat_party_2']);});
for(const [max,hp,amount]of [[100,50,20],[100,99,1],[4,1,1],[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER-1,1]])test('deterministic bounded Quickbloom '+max+'/'+hp,()=>{
 const g=fresh({party:[{maxHp:max,hp},{}]}),r=resolve(g),e=r.events.find(e=>e.type==='resonance');assert.equal(e.attemptedHealing,Math.max(1,Math.floor(max/5)));assert.equal(e.appliedHealing,amount);assert.equal(e.hpAfter,hp+amount);
 assert.equal(r.initiative.length,2);assert.equal(g.run('used.length'),5);assert.equal(r.after.resonance[1].strain,1);assert.equal(r.after.resonance[1].appliedRound,1);
});
test('Quickbloom may heal Esla without curing statuses or rolling Curse',()=>{
 const g=fresh({party:[{},{statuses:['cursed','poison']}]}),r=resolve(g,command(g,action(g,{target:1})));assert.equal(r.after.party[1].hp,70);assert.deepEqual(r.after.party[1].statuses,['cursed','poison']);assert.equal(r.events.some(e=>e.type==='curse_check'),false);
});
for(const mutate of [c=>c.allyActions[1].actorId=c.allyActions[0].actorId,c=>c.allyActions[1].targetId='combat_party_999',c=>c.allyActions[1].targetId=c.enemyActions[0].actorId,c=>c.allyActions[1].techniqueId='missing',c=>c.allyActions[1].participantIds.reverse().push(c.allyActions[0].actorId),c=>c.allyActions[1].extra=true])test('invalid action preserves every authority '+mutate.toString(),()=>{const g=fresh(),c=command(g);mutate(c);g.run('var bad='+JSON.stringify(c));reject(g,'combatPlayerState.resolveRound(bad)');});
for(const p of [{hp:0},{hp:100}])test('initial Fallen/full target rejects '+p.hp,()=>{const g=fresh({party:[p,{}]});g.run('var bad='+JSON.stringify(command(g)));reject(g,'combatPlayerState.resolveRound(bad)');});
test('actor death skips Quickbloom; target death cancels; neither applies Strain',()=>{
 for(const target of [0,1]){const g=fresh({party:[{hp:target===0?1:50},{hp:target===1?1:50}]}),c=command(g);c.enemyActions[0].targetId=ids(g)[target];const r=resolve(g,c,['e0','a0','a1']);assert.equal(r.events.some(e=>e.type==='resonance'),false);assert.equal(r.after.resonance[1].strain,0);assert.ok(r.events.some(e=>e.type===(target===1?'skip':'cancel')&&e.actorId===ids(g)[1]));}
});
test('earlier healing to full still executes, records zero healing and applies Strain',()=>{
 const g=fresh({party:[{hp:90},{}],inventory:['Potion']}),c=command(g);c.allyActions[0]={type:'item',actorId:ids(g)[0],itemId:'Potion',targetId:ids(g)[0]};const r=resolve(g,c);const e=r.events.find(e=>e.type==='resonance');assert.equal(e.hpBefore,100);assert.equal(e.appliedHealing,0);assert.equal(r.after.resonance[1].strain,1);
});
test('one whole recovery round, no playback/inspection ticks, then reuse',()=>{
 const g=fresh();resolve(g);const first=g.run('reel'),before=state(g);for(let i=0;i<first.frameCount;i++)g.run('combatPlayerState.projectRoundPlaybackFrame(reel,'+i+')');assert.equal(state(g),before);
 g.run('var bad='+JSON.stringify(command(g)));reject(g,'combatPlayerState.resolveRound(bad)');
 const r=resolve(g,command(g,null));assert.equal(r.after.resonance[1].strain,0);assert.equal(r.events.filter(e=>e.type==='strain'&&e.reason==='recovery').length,1);assert.equal(r.round,2);
 resolve(g);assert.equal(view(g).resonance[1].strain,1);
});
test('Strain ticks even if its owner falls during the recovery round',()=>{
 const g=fresh({party:[{},{hp:1}]}),c=command(g);resolve(g,c);const next=command(g,null);next.enemyActions[0].targetId=ids(g)[1];const r=resolve(g,next,['e0','a0','a1']);assert.equal(r.after.party[1].hp,0);assert.equal(r.after.resonance[1].strain,0);
});
test('terminal escape and victory discard Strain with historical cleanup evidence',()=>{
 for(const outcome of ['escape','victory']){
  const g=fresh({inventory:['Sapper Charge'],enemy:[outcome==='victory'?{hp:30}:{}]});resolve(g);
  const c=command(g,null);c.allyActions[0]=outcome==='escape'?{type:'run',actorId:ids(g)[0]}:{type:'item',actorId:ids(g)[0],itemId:'Sapper Charge',targetId:view(g).enemies[0].instanceId};
  const r=resolve(g,c,null,outcome==='escape'?[0]:[]);assert.equal(r.outcome,outcome);assert.equal(r.after.resonance[1].strain,0);assert.ok(r.events.some(e=>e.type==='strain'&&e.reason==='cleanup'));
 }
});
for(const n of [2,3])test('synthetic '+n+'-participant technique waits for latest weighted position, once',()=>{
 const g=fresh({combined:n,enemies:3}),c=command(g,action(g,{actor:0,participants:Array.from({length:n},(_,i)=>i),techniqueId:'fixture_shared'}));
 const order=n===3?['a2','e0','a0','e1','a1','e2']:['a1','e0','e1','a0','e2'],r=resolve(g,c,order);
 assert.equal(r.initiative.length,n+2);assert.equal(r.order.filter(p=>p.side==='ally').length,n);assert.equal(r.events.filter(e=>e.type==='resonance_wait').length,n-1);
 const execution=r.events.find(e=>e.type==='resonance');assert.equal(execution.actorId,ids(g)[n===3?1:0]);assert.equal(r.events.filter(e=>e.type==='resonance').length,1);
 assert.deepEqual(r.after.resonance.map(c=>c.strain),Array(n).fill(1));assert.equal(g.run('used.length'),n+2+9);
});
for(const n of [2,3])test('synthetic combined participant death cancels once and consumes reserved actions '+n,()=>{
 const g=fresh({combined:n,party:[{}, {hp:1},{}]}),c=command(g,action(g,{actor:0,participants:Array.from({length:n},(_,i)=>i),techniqueId:'fixture_shared'}));c.enemyActions[0].targetId=ids(g)[1];
 const r=resolve(g,c,n===3?['a0','e0','a1','a2']:['a0','e0','a1']);assert.equal(r.events.filter(e=>e.type==='resonance_cancel').length,1);assert.equal(r.events.find(e=>e.type==='resonance_cancel').unavailableId,ids(g)[1]);assert.equal(r.events.some(e=>e.type==='resonance'),false);assert.ok(r.after.resonance.every(c=>c.strain===0));
});
test('pure eligibility policy gates disabled participants before and after commitment',()=>{
 const pre=fresh({combined:2,disabled:true,party:[{hp:20},{}]});pre.run('var bad='+JSON.stringify(command(pre,action(pre,{actor:0,participants:[0,1],techniqueId:'fixture_shared'}))));reject(pre,'combatPlayerState.resolveRound(bad)');
 const g=fresh({combined:2,disabled:true,enemy:[{atk:20}]}),c=command(g,action(g,{actor:0,participants:[0,1],techniqueId:'fixture_shared'}));const r=resolve(g,c,['a0','e0','a1']);assert.equal(r.events.find(e=>e.type==='resonance_cancel').reason,'participant_disabled');assert.ok(r.after.resonance.every(c=>c.strain===0));
 const ordinary=fresh({disabled:true,enemy:[{atk:20}]}),r2=resolve(ordinary,command(ordinary),['e0','a0','a1']);assert.equal(r2.events.find(e=>e.type==='skip').reason,'actor_disabled');assert.equal(r2.after.resonance[1].strain,0);
});
test('combined command requires exact participants and exclusive action ownership',()=>{
 const g=fresh({combined:3}),a=action(g,{actor:0,participants:[0,1,2],techniqueId:'fixture_shared'});
 for(const mutation of [c=>c.allyActions[0].participantIds.reverse(),c=>c.allyActions[0].participantIds.pop(),c=>c.allyActions.push({type:'attack',actorId:ids(g)[1],targetId:view(g).enemies[0].instanceId})]){const c=command(g,a);mutation(c);g.run('var bad='+JSON.stringify(c));reject(g,'combatPlayerState.resolveRound(bad)');}
});
test('combined controller reserves every slot and backtracking releases the complete draft',()=>{
 const g=fresh({combined:3});g.run('combatPlayerState.session.begin({commandSet:"standard"});combatPlayerState.session.moveCommand("next");combatPlayerState.session.confirmCommand();combatPlayerState.session.confirmTechnique();combatPlayerState.session.confirmTarget()');
 let s=J(g,'combatPlayerState.session.getView()');assert.equal(s.phase,'ready');assert.equal(s.allyActions.length,1);assert.equal(s.reservedActions[0].participantIds.length,3);
 g.run('combatPlayerState.session.backtrack()');s=J(g,'combatPlayerState.session.getView()');assert.equal(s.phase,'targeting');assert.equal(s.reservedActions.length,0);assert.equal(s.allyActions.length,0);assert.equal(s.nextActorId,ids(g)[0]);
 g.run('combatPlayerState.session.confirmTarget();Math.random=()=>0.99;combatPlayerState.session.commitRound()');assert.equal(g.run('combatPlayerState.session.getView().frameIndex'),0);finish(g);g.run('combatPlayerState.session.acknowledgePlayback()');assert.equal(g.run('combatPlayerState.session.getView().phase'),'awaiting_action');
});
test('deeply immutable playback is historical and independent after cleanup/replacement',()=>{
 const g=fresh(),r=resolve(g),reel=g.run('reel');frozen(reel);assert.equal(reel.frameCount,r.events.length+1);assert.equal(reel.frames[0].party[0].hp,50);assert.equal(reel.frames[0].resonance[1].strain,0);
 const healing=reel.frames.find(f=>f.currentEvent?.type==='resonance');assert.equal(healing.party[0].hp,70);assert.equal(healing.resonance[1].strain,0);assert.equal(reel.frames[healing.frameIndex+1].resonance[1].strain,1);
 const data=JSON.stringify(reel),before=state(g);for(const i of [reel.frameCount-1,0,2,1,0])assert.equal(g.run('combatPlayerState.projectRoundPlaybackFrame(reel,'+i+')'),reel.frames[i]);assert.equal(state(g),before);
 assert.throws(()=>{reel.frames[0].resonance[1].strain=9});assert.throws(()=>g.run('result.events.reverse()'));g.run('combatPlayerState.clear();combat.enemy=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};combatPlayerState.initializeCommandParty(seed)');assert.equal(JSON.stringify(reel),data);assert.equal(g.run('combatPlayerState.projectRoundPlaybackFrame(reel,0).party[0].hp'),50);
 assert.throws(()=>g.run('combatPlayerState.projectRoundPlaybackFrame(reel,-1)'),/bounds/);
});
for(const edit of ["altered.events.find(e=>e.type==='resonance').targetId=altered.enemies[0].instanceId","altered.events.find(e=>e.type==='resonance').hpBefore++","altered.events.find(e=>e.type==='resonance').appliedHealing++","altered.events.find(e=>e.type==='resonance').techniqueName='Forgery'","altered.events.find(e=>e.type==='strain').after=0","altered.events.find(e=>e.type==='strain').appliedRoundAfter=0","altered.events.reverse()","altered.before.resonance[0].rareBorn=true","altered.before.resonance[1].actorId=altered.before.party[0].instanceId","altered.after.resonance[1].strain=0","altered.events.find(e=>e.type==='resonance').extra=true","altered.command.allyActions[1].participantIds=[altered.party[0].instanceId]","altered.initiative.reverse()"])
 test('malformed Resonance history rejects without live mutation: '+edit,()=>{const g=fresh();resolve(g);editResult(g,edit);});
for(const edit of ["altered.events.find(e=>e.type==='resonance_wait').executeActorId=altered.party[0].instanceId","altered.events.find(e=>e.type==='resonance').participantIds.pop()","altered.events.find(e=>e.type==='resonance_wait').actorId=altered.party[1].instanceId"])
 test('combined history tampering rejects: '+edit,()=>{const g=fresh({combined:2});resolve(g,command(g,action(g,{actor:0,participants:[0,1],techniqueId:'fixture_shared'})));editResult(g,edit);});

test('Esla replaces Observe with Resonance; technique cancellation, exact ally targeting and no RNG collection',()=>{
 const g=context();g.run('dialogue.open=false;Math=Object.create(Math);Math.random=()=>{throw Error("RNG during selection")};partyCombatLab.enter("command_showcase")');
 const v=()=>J(g,'partyCombatLab.getView()');assert.deepEqual(v().commands,['attack','item','observe','run']);assert.ok(!v().enabledCommands.includes('resonance'));
 g.press('ArrowRight');assert.equal(v().selectedCommand,'item');g.press('ArrowLeft');g.press('Enter');g.press('Enter');assert.equal(v().party.find(m=>m.instanceId===v().nextActorId).name,'Esla');
 g.press('ArrowRight');assert.equal(v().selectedCommand,'resonance');g.press('Enter');assert.equal(v().phase,'technique');assert.equal(v().techniques[0].name,'Quickbloom');g.press('Enter');assert.equal(v().targetSide,'ally');
 const a=v().selectedTargetInstanceId;g.press('ArrowRight');assert.notEqual(v().selectedTargetInstanceId,a);g.press('ArrowRight');assert.equal(v().selectedTargetInstanceId,a);
 g.press('Escape');assert.equal(v().phase,'technique');g.press('Escape');assert.equal(v().phase,'awaiting_action');g.press('Enter');g.press('Enter');g.press('Enter');assert.equal(v().phase,'ready');g.press('Escape');assert.equal(v().phase,'targeting');assert.equal(v().selectedTargetInstanceId,a);
});
test('Lab historical Strain, final acknowledgement, restoration, repeat protection and fresh re-entry',()=>{
 const g=context();g.run('dialogue.open=false;var world=JSON.stringify({stats,statusEffects,player,day,tick,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())});partyCombatLab.enter("command_showcase");partyCombatLab.submitAttack({actorId:partyCombatLab.getView().nextActorId,targetId:partyCombatLab.getView().enemies[0].instanceId});partyCombatLab.moveCommand("next");partyCombatLab.confirmCommand();partyCombatLab.confirmTechnique();partyCombatLab.confirmTarget();Math=Object.create(Math);var rng=0;Math.random=()=>{rng++;return 0.99};partyCombatLab.commitRound()');
 assert.equal(g.run('partyCombatLab.getView().frameIndex'),0);assert.equal(g.run('partyCombatLab.getView().resonance[1].strain'),0);const count=g.run('rng');finish(g);assert.equal(g.run('rng'),count);assert.equal(g.run('partyCombatLab.getView().resonance[1].strain'),1);
 g.press('Escape');assert.equal(g.run('partyCombatLab.getView().phase'),'playback_complete');g.press('Enter');assert.equal(g.run('combatPlayerState.getCommandView().resonance[1].strain'),1);
 g.run('partyCombatLab.submitAttack({actorId:partyCombatLab.getView().nextActorId,targetId:partyCombatLab.getView().enemies[0].instanceId})');assert.equal(g.run('partyCombatLab.getView().enabledCommands.includes("resonance")'),false);
 g.press('ArrowRight');assert.equal(g.run('partyCombatLab.getView().selectedCommand'),'item');const saved=state(g);g.keydown('Enter',{repeat:true});assert.equal(state(g),saved);
 g.run('partyCombatLab.emergencyAbort("test abort")');assert.equal(g.run('combatPlayerState.getCommandView()'),null);assert.equal(g.run('JSON.stringify({stats,statusEffects,player,day,tick,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})===world'),true);
 assert.ok(g.run('partyCombatLab.enter("command_showcase")'));assert.equal(g.run('partyCombatLab.getView().resonance[1].strain'),0);assert.ok(g.run('partyCombatLab.exit()'));assert.equal(g.run('rng'),count);
});
for(const scenario of ['lely_esla_one','lely_esla_two','lely_esla_three','command_showcase','boss_escape_lock'])test('actor-specific command boxes, read-only native/2x layout: '+scenario,()=>{
 const g=context();g.run('dialogue.open=false;Math=Object.create(Math);Math.random=()=>{throw Error("render RNG")};partyCombatLab.enter('+JSON.stringify(scenario)+')');record(g);
 for(const rareborn of [false,true]){
  if(rareborn)g.run('partyCombatLab.submitAttack({actorId:partyCombatLab.getView().nextActorId,targetId:partyCombatLab.getView().enemies[0].instanceId})');
  const before=state(g);g.run('paint=[];drawPartyCombatLabBattle()');const calls=J(g,'paint'),boxes=calls.filter(c=>c.type==='strokeRect'&&c.args[1]===414);
  assert.equal(boxes.length,4);assert.deepEqual(boxes.map(c=>c.args[0]),[22,139,256,373]);
  for(const scale of [1,2])for(const b of boxes){assert.ok(b.args[0]*scale>=0);assert.ok((b.args[0]+b.args[2])*scale<=512*scale);assert.ok((b.args[1]+b.args[3])*scale<=480*scale);}
  const resonance=calls.find(c=>c.type==='text'&&c.args[0]==='Resonance');assert.equal(!!resonance,rareborn);
  if(rareborn)assert.equal(resonance.style.fillStyle,g.run('partyCombatLab.getView().enabledCommands.includes("resonance")')?'#6b8890':'#344f5a');
  assert.equal(state(g),before);
 }
});
test('commonborn navigation wraps through four commands and backtracking restores the right actor menu',()=>{
 const g=context();g.run('dialogue.open=false;partyCombatLab.enter("command_showcase");Math=Object.create(Math);Math.random=()=>{throw Error("navigation RNG")};');
 const selected=()=>g.run('partyCombatLab.getView().selectedCommand');
 for(const expected of ['item','observe','run','attack']){g.press('ArrowRight');assert.equal(selected(),expected);}
 g.press('ArrowLeft');assert.equal(selected(),'run');g.press('ArrowRight');g.press('Enter');g.press('Enter');
 assert.deepEqual(J(g,'partyCombatLab.getView().commands'),['attack','resonance','item','run']);
 assert.equal(J(g,'partyCombatLab.getView().commands').includes('observe'),false);
 g.press('ArrowRight');assert.equal(selected(),'resonance');g.press('Enter');g.press('Enter');g.press('Enter');
 g.press('Escape');assert.equal(g.run('partyCombatLab.getView().phase'),'targeting');g.press('Escape');g.press('Escape');g.press('Escape');
 assert.equal(g.run('partyCombatLab.getView().phase'),'targeting');assert.deepEqual(J(g,'partyCombatLab.getView().commands'),['attack','item','observe','run']);
 g.press('Escape');assert.equal(selected(),'attack');
});
test('no field/save/ordinary renderer hints, no registry mutation API, no canonical entry',()=>{
 const g=context();g.run('dialogue.open=false;saveGame()');const saved=g.run('localStorage.getItem("verdantVale_save")');assert.doesNotMatch(saved,/"(?:rareBorn|affinity|resonance|strain|Quickbloom)"/i);assert.equal(g.run('SAVE_VERSION'),5);
 for(const f of ['party-field-menu.js','render-battle.js','save.js'])assert.doesNotMatch(fs.readFileSync(path.join(root,f),'utf8'),/Quickbloom|RESONANCE_TECHNIQUES|partyActorCanAct/);
 assert.ok(Object.isFrozen(g.run('RESONANCE_TECHNIQUES')));assert.throws(()=>g.run('"use strict";RESONANCE_TECHNIQUES.fake=RESONANCE_TECHNIQUES.quickbloom'));
});

test('full or Fallen allies never enable Quickbloom; invalid phase leaves drafts untouched',()=>{
 for(const party of [[{hp:100},{hp:100}],[{hp:0},{hp:100}]]){
  const g=fresh({party});g.run('combatPlayerState.session.begin({commandSet:"standard"})');
  if(party[0].hp)g.run('combatPlayerState.session.submitAttack({actorId:combatPlayerState.session.getView().nextActorId,targetId:combat.enemies[0].instanceId})');
  assert.equal(g.run('combatPlayerState.session.getView().enabledCommands.includes("resonance")'),false);
  reject(g,'combatPlayerState.session.confirmTechnique()');g.run('combatPlayerState.session.moveCommand("next")');assert.equal(g.run('combatPlayerState.session.getView().selectedCommand'),'item');
 }
});
test('terminal defeat clears Strain with immutable cleanup evidence',()=>{
 const d=fresh({party:[{hp:1},{hp:1}],enemy:[{atk:100}],enemies:2});
 // One successful heal precedes both lethal enemy actions in the application round.
 const dc=command(d);dc.enemyActions[1].targetId=ids(d)[1];
 const r=resolve(d,dc,['a0','a1','e0','e1'],[.5,.99,.99,.5,.99,.99]);
 assert.equal(r.outcome,'defeat');assert.ok(r.after.resonance.every(c=>c.strain===0));assert.ok(r.events.some(e=>e.type==='strain'&&e.reason==='cleanup'));
});
test('combined pre-commit Fallen participant and missing capability reject atomically',()=>{
 for(const party of [[{},{hp:0}],[{},{}]]){
  const g=fresh({combined:2,party,enabled:party[1].hp===0});
  g.run('var bad='+JSON.stringify(command(g,action(g,{actor:0,participants:[0,1],techniqueId:'fixture_shared'}))));reject(g,'combatPlayerState.resolveRound(bad)');
 }
});
test('Lab recovery round unlocks Resonance only after completion, with historical enabled styling',()=>{
 const g=context();g.run(`dialogue.open=false;partyCombatLab.enter('command_showcase');Math=Object.create(Math);Math.random=()=>.99;
  partyCombatLab.submitAttack({actorId:partyCombatLab.getView().nextActorId,targetId:partyCombatLab.getView().enemies[0].instanceId});
  partyCombatLab.moveCommand('next');partyCombatLab.confirmCommand();partyCombatLab.confirmTechnique();partyCombatLab.confirmTarget();partyCombatLab.commitRound()`);
 finish(g);g.run('partyCombatLab.acknowledgePlayback()');
 g.run(`partyCombatLab.submitAttack({actorId:partyCombatLab.getView().nextActorId,targetId:partyCombatLab.getView().enemies[0].instanceId})`);
 record(g);g.run('paint=[];drawPartyCombatLabBattle()');assert.equal(J(g,'paint').find(c=>c.type==='text'&&c.args[0]==='Resonance').style.fillStyle,'#344f5a');
 g.run(`partyCombatLab.submitAttack({actorId:partyCombatLab.getView().nextActorId,targetId:partyCombatLab.getView().enemies[0].instanceId});partyCombatLab.commitRound()`);
 assert.equal(g.run('partyCombatLab.getView().resonance[1].strain'),1);finish(g);assert.equal(g.run('partyCombatLab.getView().resonance[1].strain'),0);
 g.run(`partyCombatLab.acknowledgePlayback();partyCombatLab.submitAttack({actorId:partyCombatLab.getView().nextActorId,targetId:partyCombatLab.getView().enemies[0].instanceId});paint=[];drawPartyCombatLabBattle()`);
 assert.equal(g.run('partyCombatLab.getView().enabledCommands.includes("resonance")'),true);
 assert.notEqual(J(g,'paint').find(c=>c.type==='text'&&c.args[0]==='Resonance').style.fillStyle,'#344f5a');
});
test('post-RNG failure retains diagnostic lockout and does not retry or refund',()=>{
 const g=fresh();g.run('var bad='+JSON.stringify(command(g))+';var rng=0;Math.random=()=>{rng++;throw Error("injected RNG failure")};');
 assert.throws(()=>g.run('combatPlayerState.resolveRound(bad)'),/injected/);assert.equal(g.run('rng'),1);
 assert.throws(()=>g.run('combatPlayerState.resolveRound(bad)'));assert.equal(g.run('rng'),1);assert.equal(view(g).resonance[1].strain,0);
});
test('capability identities reject coercion callbacks before invoking them',()=>{
 const g=fresh({prepare:false});g.run("var coercions=0;seed.resonance[1].characterId={[Symbol.toPrimitive](){coercions++;return 'esla'}}");
 reject(g,'combatPlayerState.initializeCommandParty(seed)');assert.equal(g.run('coercions'),0);
});
test('technique and action accessors never execute; malformed Strain histories reject',()=>{
 const g=fresh();g.run('var touches=0,bad='+JSON.stringify(command(g))+";Object.defineProperty(bad.allyActions[1],'techniqueId',{get(){touches++;return 'quickbloom'}})");
 reject(g,'combatPlayerState.resolveRound(bad)');assert.equal(g.run('touches'),0);
 resolve(g);
 for(const edit of ["altered.before.resonance[1].strain=-1","altered.before.resonance[1].strain=Number.MAX_SAFE_INTEGER+1","altered.before.resonance[1].appliedRound=3","altered.before.resonance[1].extra=true","altered.events.push(altered.events.at(-1))","for(const s of [altered.before,altered.after]){s.resonance[0].rareBorn=true;s.resonance[0].affinity=\'bloommarked\'}"])
  editResult(g,edit);
});
test('malformed Lab capability metadata rejects before identity allocation',()=>{
 const read=fs.readFileSync;let g;
 try{fs.readFileSync=function(file,...args){const s=read.call(this,file,...args);return String(file).endsWith('/persistent-party.js')?s.replace("rareBorn:true,affinity:'bloommarked'","rareBorn:true,affinity:'invalid'"):s};g=createContext();}finally{fs.readFileSync=read;}
 g.run('dialogue.open=false;Math=Object.create(Math);Math.random=()=>{throw Error("entry RNG")};var seq=combatEnemyInstanceSequence;');
 assert.equal(g.run('partyCombatLab.enter("lely_esla_one")'),false);assert.equal(g.run('combatEnemyInstanceSequence===seq'),true);assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('combat.mode'),null);
});

module.exports={name:'Resonance MVP: authored capability, Quickbloom, Strain, synthetic combined contracts, history and Lab isolation',checks,run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Resonance MVP checks passed');}};
