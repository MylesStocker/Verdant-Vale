'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[],test=(name,run)=>checks.push({name,run}),ROOT=path.join(__dirname,'../..');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function context(renamed=false){
 const read=fs.readFileSync;
 try{
  fs.readFileSync=function(file,...args){let source=read.call(this,file,...args);if(typeof source!=='string')return source;
   if(String(file).endsWith('/combat.js')){
    const marker="stage='playback';const playback=combatPlayerState.createRoundPlayback(result)";
    assert.equal(source.split(marker).length,2,'capture one authentic session result without changing execution');
    source=source.replace(marker,"window.__offensiveResult=result;"+marker);
   }
   if(renamed&&['resonance.js','sera-liora-battle-profiles.js'].some(name=>String(file).endsWith('/'+name)))
    source=source.replace(/\bsera\b/g,'fixture_void_actor').replace(/\bliora\b/g,'fixture_prism_actor');
   return source;
  };
  return createContext();
 }finally{fs.readFileSync=read;}
}
function fresh({renamed=false,unbound=false,count=2,hp=1000,def=7,party='',enemy='',enemyId='enemy_marsh_wisp'}={}){
 const g=context(renamed);g.run(`dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMenu.open=false;
 var profiles=SERA_LIORA_OPENING_PROFILES.map(m=>({...m,statuses:[...m.statuses],equipment:{...m.equipment}}));
 var bindings=SERA_LIORA_OPENING_RESONANCE.map(c=>({...c}));${party}
 // Explicit synthetic combat numbers on existing templates, never authored beetle statistics.
 Object.assign(ENEMY_TEMPLATE_REGISTRY['${enemyId}'],{name:'Synthetic offense fixture',hp:${hp},maxHp:${hp},atk:1,def:${def},spd:1});${enemy}
 Math=Object.create(Math);var used=[];Math.random=()=>{throw Error('unexpected RNG');};
 var token=storyBattle.createContext({id:'offense_fixture',party:profiles,inventory:[]${unbound?'':',resonance:bindings'}});
 storyBattle.begin(token,{encounter:${JSON.stringify(Array(count).fill(enemyId))},escape:'blocked',presentation:{label:'Synthetic offense fixture'}});`);return g;
}
const view=g=>J(g,'storyBattle.getView(token)');
const local=g=>J(g,'combatPlayerState.getCommandView()');
const canonical=g=>g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),player,day,tick,location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save')})`);
const state=g=>g.run(`JSON.stringify({canonical:{stats,statusEffects,slitherSpd,party:persistentParty.serialize(),player,day,tick,location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save')},story:storyBattle.getState(token),view:storyBattle.getView(token),runtime:combatPlayerState.getCommandView(),seq:combatEnemyInstanceSequence})`);
function act(g,method,...args){return g.run('storyBattle.act(token,'+JSON.stringify(method)+args.map(a=>','+JSON.stringify(a)).join('')+')');}
function choose(g,name){let n=0;while(view(g).selectedCommand!==name){assert.ok(n++<6);act(g,'moveCommand','next');}act(g,'confirmCommand');}
function spell(g,targetSlot=0){choose(g,'resonance');assert.equal(view(g).phase,'technique');while(view(g).selectedTechniqueId==='eclipse')act(g,'moveTechnique','next');act(g,'confirmTechnique');assert.equal(view(g).phase,'targeting');const target=view(g).enemies[targetSlot].instanceId;let n=0;while(view(g).selectedTargetInstanceId!==target){assert.ok(n++<4);act(g,'moveTarget','next');}act(g,'confirmTarget');}
function attacks(g){let n=0;while(view(g).phase==='awaiting_action'){assert.ok(n++<4);const v=view(g);act(g,'submitAttack',{actorId:v.nextActorId,targetId:v.enemies.find(e=>e.hp>0).instanceId});}}
function initiative(g,order){const v=view(g),pool=[...v.party.filter(m=>m.hp>0).map(m=>({id:m.instanceId,w:m.effective.spd})),...v.enemies.filter(m=>m.hp>0&&!m.unusual?.departed).map(m=>({id:m.instanceId,w:Math.max(1,m.spd)}))];
 const wanted=order?order.map(id=>(id[0]==='a'?v.party:v.enemies)[+id.slice(1)].instanceId):pool.map(m=>m.id),draws=[];
 for(const id of wanted.slice(0,-1)){const index=pool.findIndex(m=>m.id===id);assert.ok(index>=0);draws.push((pool.slice(0,index).reduce((s,m)=>s+m.w,0)+pool[index].w/2)/pool.reduce((s,m)=>s+m.w,0));pool.splice(index,1);}return draws;
}
function commit(g,{order,enemyAttacks=view(g).enemies.filter(m=>m.hp>0).length,extra=[]}={}){
 const v=view(g),targetDraws=v.party.filter(m=>m.hp>0).length>1?v.enemies.filter(m=>m.hp>0).map(()=>0):[];
 const tape=[...targetDraws,...initiative(g,order),...extra,...Array.from({length:enemyAttacks},()=>[0.5,0.99,0.99]).flat()];
 g.run('var tape='+JSON.stringify(tape)+`,used=[];Math.random=()=>{if(used.length===tape.length)throw Error('tape exhausted');const value=tape[used.length];used.push(value);return value;};`);
 try{act(g,'commitRound');assert.deepEqual(J(g,'used'),tape);}finally{g.run(`Math.random=()=>{throw Error('unexpected RNG');};`);}return J(g,'__offensiveResult');
}
function finish(g){while(view(g).phase==='playback')act(g,'advancePlayback');assert.equal(view(g).phase,'playback_complete');return act(g,'acknowledgePlayback');}
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const d of Object.values(Object.getOwnPropertyDescriptors(v))){assert.ok(Object.hasOwn(d,'value'));frozen(d.value);}}}
function rejectHistory(g,edit){g.run('var altered='+JSON.stringify(J(g,'__offensiveResult'))+';'+edit+';altered=copyFormationData(altered);');const before=state(g);assert.throws(()=>g.run('combatPlayerState.createRoundPlayback(altered)'));assert.equal(state(g),before);}

test('opt-in story capabilities expose independent offense alongside cooperative Eclipse and ordinary defaults remain unbound',()=>{
 const g=fresh();frozen(g.run('RESONANCE_TECHNIQUES'));assert.deepEqual(view(g).commands,['attack','resonance','item','run']);choose(g,'resonance');assert.deepEqual(view(g).techniques.map(t=>t.techniqueId),['null','eclipse']);act(g,'cancelTechnique');spell(g);choose(g,'resonance');assert.deepEqual(view(g).techniques.map(t=>t.techniqueId),['rainbow']);
 const plain=fresh({unbound:true});assert.deepEqual(view(plain).commands,['attack','item','observe','run']);assert.equal(Object.hasOwn(view(plain),'resonance'),false);
});

test('Null and Rainbow affect exact separate targets using authored power minus base DEF without action RNG',()=>{
 for(const renamed of [false,true]){
  const g=fresh({renamed,party:renamed?'profiles[0].atk=1;profiles[1].atk=80;':''});const before=canonical(g);spell(g,0);spell(g,1);const result=commit(g);
  const hits=result.events.filter(e=>e.type==='resonance_damage');assert.equal(hits.length,2);assert.deepEqual(hits.map(e=>e.techniqueId),['null','rainbow']);assert.deepEqual(hits.map(e=>e.elements),[['void'],['prism']]);
  hits.forEach((e,i)=>{assert.equal(e.targetId,result.before.enemies[i].instanceId);assert.equal(e.attemptedDamage,120-7);assert.equal(e.appliedDamage,113);assert.equal(e.hpBefore-e.hpAfter,113);assert.equal(e.defense,7);assert.equal(e.power,120);});
  assert.deepEqual(result.after.enemies.map(e=>e.hp),[887,887]);assert.deepEqual(result.after.resonance.map(c=>c.strain),[1,1]);assert.equal(g.run('used.length'),11,'two target + three initiative + six enemy attack draws only');assert.equal(canonical(g),before);
  if(renamed)assert.deepEqual(result.before.party.map(m=>m.characterId),['fixture_void_actor','fixture_prism_actor']);finish(g);assert.equal(canonical(g),before);g.run('storyBattle.reset()');
 }
});

test('deterministic offense clamps damage to one and ignores melee-only armor',()=>{
 for(const defense of [0,119,120,999]){const g=fresh({def:defense,count:1});spell(g);spell(g);const r=commit(g);assert.deepEqual(r.events.filter(e=>e.type==='resonance_damage').map(e=>e.attemptedDamage),[Math.max(1,120-defense),Math.max(1,120-defense)]);g.run('storyBattle.reset()');}
 const g=fresh({count:1,enemyId:'enemy_thornback'});spell(g);spell(g);const r=commit(g);assert.ok(r.events.filter(e=>e.type==='resonance_damage').every(e=>e.defense===7&&e.appliedDamage===113));g.run('storyBattle.reset()');
});

test('selection cancellation and backtracking preserve exact command ownership without cost or RNG',()=>{
 const g=fresh(),before=canonical(g);choose(g,'resonance');act(g,'moveTechnique','next');act(g,'cancelTechnique');assert.equal(view(g).phase,'awaiting_action');assert.equal(view(g).allyActions.length,0);assert.equal(local(g).resonance[0].strain,0);
 choose(g,'resonance');act(g,'confirmTechnique');assert.deepEqual(view(g).validTargetIds,view(g).enemies.map(m=>m.instanceId));act(g,'cancelTargeting');assert.equal(view(g).phase,'technique');act(g,'cancelTechnique');
 spell(g,1);assert.equal(view(g).nextActorId,view(g).party[1].instanceId);act(g,'backtrack');assert.equal(view(g).nextActorId,view(g).party[0].instanceId);assert.equal(view(g).allyActions.length,0);assert.equal(local(g).resonance[0].strain,0);assert.deepEqual(J(g,'used'),[]);assert.equal(canonical(g),before);g.run('storyBattle.reset()');
});

test('a prior exact-target kill cancels the second technique without Strain or retargeting',()=>{
 const g=fresh({hp:60,def:0});spell(g,0);spell(g,0);const r=commit(g,{enemyAttacks:1});assert.equal(r.events.filter(e=>e.type==='resonance_damage').length,1);const cancel=r.events.find(e=>e.type==='cancel'&&e.actorId===r.before.party[1].instanceId);assert.equal(cancel.reason,'target_dead');assert.equal(cancel.targetId,r.before.enemies[0].instanceId);assert.equal(r.after.enemies[1].hp,60);assert.deepEqual(r.after.resonance.map(c=>c.strain),[1,0]);g.run('storyBattle.reset()');
});

test('Strain one blocks the following collection round and recovers through ordinary attacks',()=>{
 const g=fresh();spell(g);spell(g,1);commit(g);finish(g);assert.deepEqual(view(g).resonance.map(c=>c.strain),[1,1]);assert.ok(!view(g).enabledCommands.includes('resonance'));assert.equal(view(g).resonanceAvailability[0].disabledReason,'Strained');attacks(g);const r=commit(g,{extra:[0.5,0.99,0.99,0.5,0.99,0.99]});assert.deepEqual(r.after.resonance.map(c=>c.strain),[0,0]);finish(g);assert.ok(view(g).enabledCommands.includes('resonance'));g.run('storyBattle.reset()');
});

for(const slot of [0,1])test('each authored technique defeats a bounded synthetic fixture, not an authored beetle',()=>{
 const g=fresh({count:1,hp:100,def:10,party:'profiles['+(1-slot)+'].hp=0;'});const before=canonical(g);spell(g);const r=commit(g,{enemyAttacks:0});const event=r.events.find(e=>e.type==='resonance_damage');assert.equal(event.techniqueId,slot===0?'null':'rainbow');assert.equal(event.attemptedDamage,110);assert.equal(event.appliedDamage,100);assert.equal(r.outcome,'victory');assert.equal(r.after.resonance[slot].strain,0);finish(g);const receipt=g.run('storyBattle.complete(token)');assert.equal(receipt.outcome,'victory');assert.equal(canonical(g),before);g.run('storyBattle.reset()');
});

test('invalid arithmetic, target eligibility, techniques and story capabilities fail closed without RNG',()=>{
 const g=fresh();assert.equal(g.run('resonanceDamageAmount(Number.MAX_SAFE_INTEGER,0)'),Number.MAX_SAFE_INTEGER);assert.equal(g.run('resonanceDamageAmount(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER)'),1);assert.equal(g.run('resonanceDamageAmount(1,Number.MAX_SAFE_INTEGER)'),1);for(const args of [[0,0],[-1,0],[1,-1],[Infinity,0],[1,NaN]])assert.throws(()=>g.run('resonanceDamageAmount('+args.map(v=>String(v)).join(',')+')'));
 assert.equal(g.run("resonanceTargetEligible(RESONANCE_TECHNIQUES.null,{hp:1},'ally')"),false);assert.equal(g.run("resonanceTargetEligible(RESONANCE_TECHNIQUES.null,{hp:0},'enemy')"),false);assert.equal(g.run("resonanceTargetEligible(RESONANCE_TECHNIQUES.null,{hp:1,unusual:{departed:true}},'enemy')"),false);assert.equal(g.run("resonanceTargetEligible(RESONANCE_TECHNIQUES.null,null,'enemy')"),false);
 for(const edit of ["d.target='living_wounded_ally'","d.power=0","d.power=Infinity","d.effect='callback'","d.kind='combined'","d.elements=Object.freeze(['unknown'])","d.extra=true","d.participants[0].affinity='unknown'"]){const before=state(g);g.run('var d={...RESONANCE_TECHNIQUES.null,participants:RESONANCE_TECHNIQUES.null.participants.map(p=>({...p}))};'+edit);assert.throws(()=>g.run('validateResonanceTechnique(d)'));assert.equal(state(g),before);}
 g.run('storyBattle.reset()');
 const ordinary=context();ordinary.run(`dialogue.open=false;dialogue.callbacks=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};
 var seed={members:SERA_LIORA_OPENING_PROFILES.map((m,slot)=>({characterId:m.characterId,slot,name:m.name,hp:m.hp,maxHp:m.maxHp,atk:m.atk,def:m.def,spd:m.spd,statuses:[]})),inventory:[],escape:'blocked',resonance:SERA_LIORA_OPENING_RESONANCE};Math=Object.create(Math);Math.random=()=>{throw Error('unexpected RNG');};`);
 const ordinaryBefore=ordinary.run('JSON.stringify({stats,enemy:combat.enemies,seq:combatEnemyInstanceSequence})');assert.throws(()=>ordinary.run('combatPlayerState.initializeCommandParty(seed)'));assert.equal(ordinary.run('combatPlayerState.hasParty()'),false);assert.equal(ordinary.run('JSON.stringify({stats,enemy:combat.enemies,seq:combatEnemyInstanceSequence})'),ordinaryBefore);
 for(const edit of ["bindings[0].source='canonical'","delete bindings[0].source","bindings[0].characterId='esla'","bindings[0].slot=1","bindings[0].extra=true"]){const h=context();h.run(`dialogue.open=false;dialogue.callbacks=null;var bindings=SERA_LIORA_OPENING_RESONANCE.map(c=>({...c}));${edit};Math=Object.create(Math);Math.random=()=>{throw Error('unexpected RNG');};`);const seq=h.run('combatEnemyInstanceSequence');assert.throws(()=>h.run("storyBattle.createContext({id:'bad',party:SERA_LIORA_OPENING_PROFILES,inventory:[],resonance:bindings})"));assert.equal(h.run('storyBattle.hasContext()'),false);assert.equal(h.run('combatEnemyInstanceSequence'),seq);}
});

test('offensive history rejects altered damage, metadata, source, side, stale IDs and Strain without live writes',()=>{
 const g=fresh();spell(g);spell(g,1);commit(g);
 const edits=["e.techniqueId='rainbow'","e.techniqueName='Other'","e.elements=['prism']","e.power++","e.defense++","e.attemptedDamage++","e.appliedDamage++","e.hpBefore--","e.hpAfter++","e.targetId=altered.before.party[0].instanceId","e.targetId='combat_enemy_999'","e.participantIds=[altered.before.party[1].instanceId]","e.side='enemy'","e.extra=true"];
 for(const edit of edits)rejectHistory(g,"var e=altered.events.find(e=>e.type==='resonance_damage');"+edit);
 for(const edit of ["altered.before.resonance[0].source='canonical'","delete altered.before.resonance[0].source","altered.before.resonance[0].affinity='prismborn'","altered.after.resonance[0].strain=0","altered.events.find(e=>e.type==='strain').after=2","altered.command.allyActions[0].targetId=altered.before.party[0].instanceId"])rejectHistory(g,edit);
 g.run('storyBattle.reset()');
});

test('immutable playback and shared offensive rendering use recorded witnesses without live formulas or RNG',()=>{
 const g=fresh();spell(g);spell(g,1);commit(g);frozen(g.run('__offensiveResult'));const before=state(g);
 g.run(`resonanceDamageAmount=()=>{throw Error('live damage formula called');};var reel=combatPlayerState.createRoundPlayback(__offensiveResult);`);assert.equal(state(g),before);frozen(g.run('reel'));
 for(let i=0;i<g.run('reel.frameCount');i++){g.run('var projected=combatPlayerState.projectRoundPlaybackFrame(reel,'+i+');');frozen(g.run('projected'));assert.equal(state(g),before);}
 record(g);let rendered=0;while(view(g).phase==='playback'){act(g,'advancePlayback');if(view(g).playbackFrame.currentEvent?.type==='resonance_damage'){
   const stable=state(g);g.run('paint=[];drawPartyBattle(storyBattle.getView(token));');assert.equal(state(g),stable);const text=J(g,"paint.filter(c=>c.type==='text').map(c=>c.args[0]).join(' ')");assert.match(text,/takes 113 (Void|Prism) damage/);rendered++;
  }}assert.equal(rendered,2);g.run('storyBattle.reset()');
});

test('late failure after one technique retains its damage and Strain, locks retry, and preserves canonical resources',()=>{
 const g=fresh(),before=canonical(g);spell(g);spell(g,1);
 // Two target draws and three initiative draws complete; the following enemy attack draw fails after both deterministic techniques.
 const order=initiative(g);g.run('var partialTape='+JSON.stringify([0,0,...order])+`,late=0;Math.random=()=>{if(late===partialTape.length)throw Error('late offense failure');return partialTape[late++];};`);
 assert.throws(()=>act(g,'commitRound'),/late offense failure/);const partial=local(g);assert.deepEqual(partial.enemies.map(m=>m.hp),[887,887]);assert.deepEqual(partial.resonance.map(c=>c.strain),[1,1]);assert.equal(g.run('storyBattle.getState(token).phase'),'fault');assert.equal(act(g,'commitRound'),false);assert.equal(g.run('storyBattle.complete(token)'),false);assert.deepEqual(local(g),partial);assert.equal(canonical(g),before);g.run('storyBattle.reset()');assert.equal(canonical(g),before);
});

test('offensive definitions add no caller beyond the authorized breakfast adapter',()=>{
 for(const file of scriptOrderFromIndexHtml()){if(['story-battle.js','sera-liora-breakfast-battle.js'].includes(file))continue;assert.doesNotMatch(fs.readFileSync(path.join(ROOT,file),'utf8'),/storyBattle\.(createContext|begin|act|complete)\s*\(/,file);}
 const g=context();assert.equal(g.run('storyBattle.hasContext()'),false);assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('SAVE_VERSION'),5);
});
test('an actor killed before its scheduled technique skips without damage or Strain',()=>{
 const g=fresh({enemy:'ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.atk=1000;'});spell(g);spell(g,1);const r=commit(g,{order:['e0','e1','a0','a1'],enemyAttacks:1});
 assert.equal(r.after.party[0].hp,0);assert.ok(r.events.some(e=>e.type==='skip'&&e.actorId===r.before.party[0].instanceId&&e.reason==='actor_dead'));assert.equal(r.after.resonance[0].strain,0);assert.equal(r.events.filter(e=>e.type==='resonance_damage').length,1);assert.equal(r.after.enemies[0].hp,1000);g.run('storyBattle.reset()');
});

test('offensive Resonance recovers stolen fixture gold and authentic history includes the recovery',()=>{
 // VM-only resource seed exercises an existing shared theft interaction. It does not add a story gold API.
 const read=fs.readFileSync;let g;
 try{fs.readFileSync=function(file,...args){let source=read.call(this,file,...args);if(String(file).endsWith('/story-battle.js')){assert.equal(source.split('return copy(request);').length,2);source=source.replace('return copy(request);','request.gold=100;return copy(request);');}return source;};g=context();}finally{fs.readFileSync=read;}
 g.run(`dialogue.open=false;dialogue.callbacks=null;var profiles=SERA_LIORA_OPENING_PROFILES.map(m=>({...m,statuses:[],equipment:{...m.equipment}}));profiles[1].hp=0;
 var token=storyBattle.createContext({id:'gold_witness_fixture',party:profiles,inventory:[],resonance:SERA_LIORA_OPENING_RESONANCE});
 storyBattle.begin(token,{encounter:['enemy_basin_gull'],escape:'blocked',presentation:{label:'Synthetic gold interaction'}});Math=Object.create(Math);`);
 const before=canonical(g);choose(g,'run');const tape=[...initiative(g),0.5,0.99,0.99,0];g.run('var goldTape='+JSON.stringify(tape)+`,goldUsed=0;Math.random=()=>{if(goldUsed===goldTape.length)throw Error('gold tape exhausted');return goldTape[goldUsed++];};`);
 act(g,'commitRound');assert.equal(g.run('goldUsed'),tape.length);assert.equal(g.run('__offensiveResult.after.gold'),80);assert.equal(g.run('__offensiveResult.events.find(e=>e.type==="theft").amount'),20);finish(g);
 spell(g);const r=commit(g,{enemyAttacks:0});assert.equal(r.outcome,'victory');assert.equal(r.events.find(e=>e.type==='resonance_damage').appliedDamage,28);assert.equal(r.events.find(e=>e.type==='gold_recovered').amount,20);assert.equal(r.after.gold,100);
 const stable=state(g);g.run('var recoveredReel=combatPlayerState.createRoundPlayback(__offensiveResult);');assert.equal(state(g),stable);frozen(g.run('recoveredReel'));rejectHistory(g,"altered.events.find(e=>e.type==='gold_recovered').amount++");assert.equal(canonical(g),before);g.run('storyBattle.reset()');
});

test('a braced enemy reduces ordinary melee but offensive Resonance still uses its base DEF',()=>{
 const g=fresh({count:1,enemyId:'enemy_stone_crawler'});attacksOne();spell(g);
 function attacksOne(){const v=view(g);act(g,'submitAttack',{actorId:v.nextActorId,targetId:v.enemies[0].instanceId});}
 const tape=[0,...initiative(g,['e0','a0','a1']),0.5,0.99];g.run('var braceTape='+JSON.stringify(tape)+`,braceUsed=0;Math.random=()=>{if(braceUsed===braceTape.length)throw Error('brace tape exhausted');return braceTape[braceUsed++];};`);
 act(g,'commitRound');assert.equal(g.run('braceUsed'),tape.length);g.run(`Math.random=()=>{throw Error('unexpected RNG');};`);
 const r=J(g,'__offensiveResult');assert.ok(r.events.some(e=>e.type==='brace'));const hit=r.events.find(e=>e.type==='resonance_damage');assert.equal(hit.techniqueId,'rainbow');assert.equal(hit.defense,7);assert.equal(hit.appliedDamage,113);const melee=r.events.find(e=>e.type==='attack'&&e.side==='ally');assert.ok(melee.appliedDamage<melee.brace.unmodifiedDamage);assert.equal(r.after.enemies[0].hp,887-melee.appliedDamage);g.run('storyBattle.reset()');
});

function lowFixture({departed=false}={}){
 const read=fs.readFileSync;let g;
 try{fs.readFileSync=function(file,...args){let source=read.call(this,file,...args);if(String(file).endsWith('/persistent-party.js'))source=source.replace("knownTechniques:Object.freeze(['quickbloom'])","knownTechniques:Object.freeze(['quickbloom','fixture_offense'])");if(String(file).endsWith('/resonance.js'))source=source.replace('  quickbloom:validateResonanceTechnique',`  fixture_offense:validateResonanceTechnique({id:'fixture_offense',name:'Synthetic offense',kind:'ordinary',initiator:'esla',participants:[{characterId:'esla',affinity:'bloommarked',strain:1}],target:'living_enemy',effect:'damage',power:120,elements:Object.freeze(['void'])}),\n  quickbloom:validateResonanceTechnique`);return source;};g=context();}finally{fs.readFileSync=read;}
 g.run(`dialogue.open=false;dialogue.callbacks=null;
 installFormationState(preparePartyEnemyFormation(${JSON.stringify(departed?['enemy_basin_gull','enemy_marsh_wisp']:['enemy_marsh_wisp','enemy_marsh_wisp','enemy_marsh_wisp'])}).templates,{escape:'blocked'});
 combat.enemies.forEach((e,i)=>Object.assign(e,{hp:${departed?'1000':'i===0?1:1000'},maxHp:1000,atk:1,def:7,spd:1}));
 combatPlayerState.initializeCommandParty({members:[{characterId:'esla',slot:0,name:'Synthetic Esla caster',hp:1000,maxHp:1000,atk:1,def:0,spd:10,statuses:[]}],inventory:[],gold:100,escape:'blocked',resonance:[{slot:0,characterId:'esla'}]});
 Math=Object.create(Math);var lowCalls=0;Math.random=()=>{lowCalls++;throw Error('unexpected target rejection RNG');};`);return g;
}
const lowState=g=>g.run(`JSON.stringify({stats,statusEffects,party:combatPlayerState.getView(),command:combatPlayerState.getCommandView(),round:combatPlayerState.getRoundView(),enemies:combat.enemies,sequence:combatEnemyInstanceSequence,save:localStorage.getItem('verdantVale_save')})`);
function lowRequest(g,type='resonance',target=1){const v=local(g),actorId=v.party[0].instanceId;return {type:'party-round',allyActions:[type==='run'?{type:'run',actorId}:{type:'resonance',actorId,techniqueId:'fixture_offense',targetId:v.enemies[target].instanceId,participantIds:[actorId]}],enemyActions:v.enemies.filter(e=>e.hp>0&&!e.unusual?.departed).map(e=>({actorId:e.instanceId,targetId:actorId}))};}
function lowResolve(g,request,execution){const living=request.allyActions.length+request.enemyActions.length,tape=[...Array(living-1).fill(0),...execution];g.run('var lowTape='+JSON.stringify(tape)+`,lowUsed=0;Math.random=()=>{if(lowUsed===lowTape.length)throw Error('low tape exhausted');return lowTape[lowUsed++];};var lowResult=combatPlayerState.resolveRound(`+JSON.stringify(request)+');');assert.equal(g.run('lowUsed'),tape.length);g.run(`Math.random=()=>{lowCalls++;throw Error('unexpected target rejection RNG');};`);return J(g,'lowResult');}

test('actual shared command preparation atomically rejects dead, stale, foreign and wrong-side targets',()=>{
 const g=lowFixture();lowResolve(g,lowRequest(g,'resonance',0),[0.5,0.99,0.99,0.5,0.99,0.99]);lowResolve(g,lowRequest(g,'run'),[0.5,0.99,0.99,0.5,0.99,0.99]);const request=lowRequest(g),actor=local(g).party[0].instanceId;
 for(const targetId of [undefined,null,'',local(g).enemies[0].instanceId,'combat_enemy_999','foreign_enemy',actor]){
  const bad={...request,allyActions:request.allyActions.map(a=>({...a,targetId}))};const before=lowState(g),calls=g.run('lowCalls');assert.throws(()=>g.run('combatPlayerState.resolveRound('+JSON.stringify(bad)+')'));assert.equal(lowState(g),before);assert.equal(g.run('lowCalls'),calls);
 }
 const r=lowResolve(g,request,[0.5,0.99,0.99,0.5,0.99,0.99]);assert.equal(r.events.find(e=>e.type==='resonance_damage').targetId,local(g).enemies[1].instanceId);assert.equal(r.after.enemies[0].hp,0);assert.equal(r.after.enemies[2].hp,1000);
});

test('a naturally departed enemy is excluded by actual shared command preparation',()=>{
 const g=lowFixture({departed:true});const first=lowResolve(g,lowRequest(g,'run'),[0.5,0.99,0.99,0,0.5,0.99,0.99]);assert.equal(first.after.gold,80);
 const second=lowResolve(g,lowRequest(g,'run'),[0.5,0.99,0.99,0.5,0.99,0.99]);assert.equal(second.after.enemies[0].unusual.departed,true);assert.equal(second.outcome,'ongoing');
 const bad=lowRequest(g,'resonance',0),before=lowState(g),calls=g.run('lowCalls');assert.throws(()=>g.run('combatPlayerState.resolveRound('+JSON.stringify(bad)+')'));assert.equal(lowState(g),before);assert.equal(g.run('lowCalls'),calls);
 const result=lowResolve(g,lowRequest(g,'resonance',1),[0.5,0.99,0.99]);assert.equal(result.events.find(e=>e.type==='resonance_damage').targetId,result.before.enemies[1].instanceId);assert.equal(result.after.enemies[0].hp,result.before.enemies[0].hp);
});

test('actual session selection excludes genuinely defeated IDs after normal recovery and cancellation costs nothing',()=>{
 const g=fresh({count:3,hp:60,def:0});spell(g,0);spell(g,0);commit(g,{enemyAttacks:2});finish(g);
 assert.equal(view(g).enemies[0].hp,0);attacks(g);commit(g,{enemyAttacks:1,extra:[0.5,0.99,0.99,0.5,0.99,0.99]});finish(g);
 const v=view(g);assert.deepEqual(v.enemies.map(e=>e.hp>0),[false,false,true]);assert.equal(v.resonance[0].strain,0);
 const before=canonical(g),resources=J(g,'storyBattle.getState(token)'),runtime=local(g),draws=J(g,'used');
 choose(g,'resonance');act(g,'confirmTechnique');assert.deepEqual(view(g).validTargetIds,[v.enemies[2].instanceId]);assert.equal(view(g).selectedTargetInstanceId,v.enemies[2].instanceId);
 act(g,'cancelTargeting');act(g,'cancelTechnique');assert.equal(view(g).phase,'awaiting_action');assert.equal(view(g).allyActions.length,0);assert.deepEqual(local(g),runtime);assert.deepEqual(J(g,'storyBattle.getState(token)'),resources);assert.equal(canonical(g),before);assert.deepEqual(J(g,'used'),draws);g.run('storyBattle.reset()');
});

module.exports={name:'Offensive Resonance: exact targets, deterministic witnesses and isolated story capabilities',checks,run(){for(const {name,run}of checks){try{run();}catch(e){e.message=name+': '+e.message;throw e;}}}};
