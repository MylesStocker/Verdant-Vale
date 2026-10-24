'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[],test=(name,run)=>checks.push({name,run}),ROOT=path.join(__dirname,'../..');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function context({renamed=false,third=false,disabled=false,low=false,missingEclipse=false}={}){
 const read=fs.readFileSync;
 try{fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);if(typeof s!=='string')return s;
  if(String(file).endsWith('/combat.js')){const marker="stage='playback';const playback=combatPlayerState.createRoundPlayback(result)";assert.equal(s.split(marker).length,2);s=s.replace(marker,'window.__eclipseResult=result;'+marker);}
  if(String(file).endsWith('/sera-liora-battle-profiles.js')&&third)s=s.replace('const STORY_CHARACTER_DEFINITIONS=Object.freeze({',"const STORY_CHARACTER_DEFINITIONS=Object.freeze({fixture_third:Object.freeze({id:'fixture_third',name:'Synthetic third',rareBorn:false,affinity:null,spriteId:'lely'}),");
  if(String(file).endsWith('/resonance.js')&&disabled)s=s.replace('return actor.hp > 0;',"return actor.hp > 0 && !(actor.slot===1 && party[0].hp<200);");
  if(missingEclipse&&String(file).endsWith('/sera-liora-battle-profiles.js')){assert.ok(s.includes("knownTechniques:Object.freeze(['rainbow','eclipse'])"));s=s.replace("knownTechniques:Object.freeze(['rainbow','eclipse'])","knownTechniques:Object.freeze(['rainbow'])");}
  if((renamed||low)&&['resonance.js','sera-liora-battle-profiles.js'].some(name=>String(file).endsWith('/'+name)))s=s.replace(/\bsera\b/g,'fixture_void_actor').replace(/\bliora\b/g,'fixture_prism_actor');
  if(low&&String(file).endsWith('/resonance.js'))s=s.replaceAll("affinity:'voidborn'","affinity:'bloommarked'").replaceAll("affinity:'prismborn'","affinity:'bloommarked'");
  if(low&&String(file).endsWith('/persistent-party.js'))s=s.replace('  lely:Object.freeze',"  fixture_void_actor:Object.freeze({id:'fixture_void_actor',slot:0,name:'Synthetic A',rareBorn:true,affinity:'bloommarked',knownTechniques:Object.freeze(['eclipse'])}),fixture_prism_actor:Object.freeze({id:'fixture_prism_actor',slot:1,name:'Synthetic B',rareBorn:true,affinity:'bloommarked',knownTechniques:Object.freeze(["+(missingEclipse?'':"'eclipse'")+"])}),\n  lely:Object.freeze");
  return s;
 };return createContext();}finally{fs.readFileSync=read;}
}
function fresh({count=2,hp=1000,def=7,party='',enemy='',ids=null,...options}={}){
 const g=context(options),enemies=ids||Array(count).fill('enemy_marsh_wisp');
 g.run(`dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMenu.open=false;
 var profiles=SERA_LIORA_OPENING_PROFILES.map(m=>({...m,statuses:[...m.statuses],equipment:{...m.equipment}})),bindings=SERA_LIORA_OPENING_RESONANCE.map(c=>({...c}));
 ${options.third?"profiles.push({characterId:'fixture_third',name:'Synthetic third',hp:100,maxHp:100,atk:80,def:0,spd:30,statuses:[],slitherSpeed:1,equipment:{weapon:null,armor:null,shield:null,accessory:null}});bindings.push({slot:2,characterId:'fixture_third',source:'story'});":''}${party}
 ${[...new Set(enemies)].map(id=>'Object.assign(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'],{name:"Synthetic Eclipse fixture",hp:'+hp+',maxHp:'+hp+',atk:1,def:'+def+',spd:1});').join('')}${enemy}
 Math=Object.create(Math);var calls=0,used=[];Math.random=()=>{calls++;throw Error('unexpected Eclipse RNG');};
 var canonicalRefs={stats,items:stats.items,weapon:stats.weapon,armor:stats.armor,statuses:statusEffects,player};
 var token=storyBattle.createContext({id:'eclipse_fixture',party:profiles,inventory:[],resonance:bindings});
 storyBattle.begin(token,{encounter:${JSON.stringify(enemies)},escape:'blocked',presentation:{label:'Synthetic Eclipse fixture'}});`);return g;
}
const view=g=>J(g,'storyBattle.getView(token)'),local=g=>J(g,'combatPlayerState.getCommandView()');
const canonical=g=>g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),player,day,tick,location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save')})`);
const state=g=>g.run(`JSON.stringify({stats,statusEffects,slitherSpd,canonical:persistentParty.serialize(),player,day,tick,location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save'),story:storyBattle.getState(token),view:storyBattle.getView(token),runtime:combatPlayerState.getCommandView(),sequence:combatEnemyInstanceSequence})`);
function refs(g){assert.equal(g.run('canonicalRefs.stats===stats&&canonicalRefs.items===stats.items&&canonicalRefs.weapon===stats.weapon&&canonicalRefs.armor===stats.armor&&canonicalRefs.statuses===statusEffects&&canonicalRefs.player===player'),true);}
function act(g,method,...args){return g.run('storyBattle.act(token,'+JSON.stringify(method)+args.map(a=>','+JSON.stringify(a)).join('')+')');}
function choose(g,name){let n=0;while(view(g).selectedCommand!==name){assert.ok(n++<6);act(g,'moveCommand','next');}act(g,'confirmCommand');}
function technique(g,id='eclipse',confirm=true){choose(g,'resonance');let n=0;while(view(g).selectedTechniqueId!==id){assert.ok(n++<6);act(g,'moveTechnique','next');}act(g,'confirmTechnique');if(confirm)act(g,'confirmTarget');}
function both(g){technique(g);assert.equal(view(g).phase,'awaiting_action');technique(g);}
function attacks(g){let n=0;while(view(g).phase==='awaiting_action'){assert.ok(n++<4);const v=view(g);act(g,'submitAttack',{actorId:v.nextActorId,targetId:v.enemies.find(e=>e.hp>0).instanceId});}}
function orderTape(g,{combined=true,order}={}){
 const v=view(g),allies=combined?[{id:v.party[0].instanceId,w:Math.min(...v.party.slice(0,2).map(m=>m.effective.spd))},...v.party.slice(2).filter(m=>m.hp>0).map(m=>({id:m.instanceId,w:m.effective.spd}))]:v.party.filter(m=>m.hp>0).map(m=>({id:m.instanceId,w:m.effective.spd}));
 const pool=[...allies,...v.enemies.filter(e=>e.hp>0&&!e.unusual?.departed).map(e=>({id:e.instanceId,w:Math.max(1,e.spd)}))];const wanted=order?order.map(id=>(id[0]==='a'?v.party:v.enemies)[+id.slice(1)].instanceId):pool.map(m=>m.id),tape=[];
 for(const id of wanted.slice(0,-1)){const index=pool.findIndex(m=>m.id===id);assert.ok(index>=0);tape.push((pool.slice(0,index).reduce((s,m)=>s+m.w,0)+pool[index].w/2)/pool.reduce((s,m)=>s+m.w,0));pool.splice(index,1);}return tape;
}
function commit(g,{combined=true,order,execution,targets}={}){
 const v=view(g),livingEnemies=v.enemies.filter(e=>e.hp>0&&!e.unusual?.departed),targetTape=v.party.filter(m=>m.hp>0).length>1?(targets||livingEnemies.map(()=>0)):[];
 const tape=[...targetTape,...orderTape(g,{combined,order}),...(execution||livingEnemies.flatMap(()=>[0.5,0.99,0.99]))];
 g.run('var tape='+JSON.stringify(tape)+`,used=[];Math.random=()=>{calls++;if(used.length===tape.length)throw Error('Eclipse tape exhausted');const value=tape[used.length];used.push(value);return value;};`);
 try{act(g,'commitRound');assert.deepEqual(J(g,'used'),tape);}finally{g.run(`Math.random=()=>{calls++;throw Error('unexpected Eclipse RNG');};`);}return J(g,'__eclipseResult');
}
function finish(g){while(view(g).phase==='playback')act(g,'advancePlayback');assert.equal(view(g).phase,'playback_complete');return act(g,'acknowledgePlayback');}
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const d of Object.values(Object.getOwnPropertyDescriptors(v))){assert.ok(Object.hasOwn(d,'value'));frozen(d.value);}}}
function rejectHistory(g,edit){g.run('var altered='+JSON.stringify(J(g,'__eclipseResult'))+';'+edit+';altered=copyFormationData(altered);');const before=state(g),calls=g.run('calls');assert.throws(()=>g.run('combatPlayerState.createRoundPlayback(altered)'));assert.equal(state(g),before);assert.equal(g.run('calls'),calls);}

test('both characters explicitly select Eclipse and backtracking removes only the chosen consent',()=>{
 const g=fresh(),before=canonical(g),resources=local(g);choose(g,'resonance');assert.deepEqual(view(g).techniques.map(t=>t.techniqueId),['null','eclipse']);act(g,'cancelTechnique');technique(g);
 let v=view(g);assert.equal(v.phase,'awaiting_action');assert.equal(v.nextActorId,v.party[1].instanceId);assert.equal(v.allyActions.length,1);assert.equal(v.allyActions[0].actorId,v.party[0].instanceId);assert.equal(v.reservedActions.length,1);assert.equal(act(g,'commitRound'),false);assert.equal(g.run('calls'),0);
 choose(g,'resonance');assert.deepEqual(view(g).techniques.map(t=>t.techniqueId),['eclipse']);act(g,'cancelTechnique');technique(g);v=view(g);assert.equal(v.phase,'ready');assert.equal(v.allyActions.length,2);assert.deepEqual(v.allyActions.map(a=>a.actorId),v.party.map(m=>m.instanceId));assert.ok(v.allyActions.every(a=>a.techniqueId==='eclipse'));
 act(g,'backtrack');assert.equal(view(g).phase,'targeting');assert.equal(view(g).nextActorId,view(g).party[1].instanceId);assert.equal(view(g).allyActions.length,1);act(g,'cancelTargeting');act(g,'cancelTechnique');act(g,'backtrack');assert.equal(view(g).allyActions.length,0);assert.deepEqual(local(g),resources);assert.equal(canonical(g),before);assert.equal(g.run('calls'),0);g.run('storyBattle.reset()');
});

test('pending consent exposes only compatible choices and rejects raw incompatible attacks atomically',()=>{
 const g=fresh();technique(g);let v=view(g);assert.equal(v.phase,'awaiting_action');assert.equal(v.selectedCommand,'resonance');assert.deepEqual(v.enabledCommands,['resonance']);
 for(const command of ['attack','item','run'])assert.equal(v.commandAvailability.find(c=>c.command===command).enabled,false);
 const before=state(g);assert.throws(()=>act(g,'submitAttack',{actorId:v.party[1].instanceId,targetId:v.enemies[0].instanceId}),/Combined Resonance/);assert.equal(state(g),before);assert.equal(g.run('storyBattle.getState(token).phase'),'battle');assert.equal(g.run('calls'),0);
 act(g,'confirmCommand');v=view(g);assert.equal(v.phase,'technique');assert.deepEqual(v.techniques.map(t=>t.techniqueId),['eclipse']);assert.equal(v.allyActions.length,1);
 act(g,'confirmTechnique');assert.equal(view(g).phase,'targeting');assert.equal(view(g).targetMode,'all');assert.equal(view(g).allyActions.length,1);assert.equal(act(g,'commitRound'),false);act(g,'confirmTarget');assert.equal(view(g).phase,'ready');assert.equal(view(g).allyActions.length,2);
 act(g,'backtrack');act(g,'cancelTargeting');act(g,'cancelTechnique');act(g,'backtrack');act(g,'cancelTargeting');act(g,'cancelTechnique');assert.equal(view(g).allyActions.length,0);assert.deepEqual(view(g).enabledCommands,['attack','resonance','item','run']);choose(g,'resonance');assert.deepEqual(view(g).techniques.map(t=>t.techniqueId),['null','eclipse']);assert.equal(g.run('calls'),0);g.run('storyBattle.reset()');
});

test('an otherwise eligible partner must explicitly know Eclipse in menus, shared preflight and detached history',()=>{
 const g=fresh({missingEclipse:true}),before=canonical(g),v=view(g);
 assert.equal(g.run('STORY_CHARACTER_DEFINITIONS.liora.rareBorn'),true);
 assert.equal(g.run('STORY_CHARACTER_DEFINITIONS.liora.affinity'),'prismborn');
 assert.deepEqual(J(g,'STORY_CHARACTER_DEFINITIONS.liora.knownTechniques'),['rainbow']);
 assert.equal(v.party[1].hp,v.party[1].maxHp);assert.equal(v.resonance[1].strain,0);
 assert.deepEqual(J(g,'resonanceParticipants(RESONANCE_TECHNIQUES.eclipse,storyBattle.getView(token).party,storyBattle.getView(token).resonance).map(m=>m?.characterId??null)'),['sera',null]);
 choose(g,'resonance');assert.deepEqual(view(g).techniques.map(t=>t.techniqueId),['null']);act(g,'cancelTechnique');
 technique(g,'null');choose(g,'resonance');assert.deepEqual(view(g).techniques.map(t=>t.techniqueId),['rainbow']);
 assert.equal(g.run('calls'),0);assert.equal(canonical(g),before);refs(g);
 // Real shared round preparation with matching identities/affinities, zero
 // Strain, exact consent and valid targets still rejects an unknowing partner.
 const raw=lowFixture({missingEclipse:true}),request=rawRequest(raw),old=lowState(raw);
 raw.run('var unknownRequest='+JSON.stringify(request));assert.throws(()=>raw.run('combatPlayerState.resolveRound(unknownRequest)'));
 assert.equal(lowState(raw),old);assert.equal(raw.run('calls'),0);
 // Positive control: the same story builds with both authored knowledge lists
 // resolve normally. Detached replay must not infer knowledge from affinity.
 const control=fresh();both(control);const result=commit(control);assert.equal(result.events.filter(e=>e.type==='resonance_damage_all').length,1);
 g.run('var foreignHistory=copyFormationData('+JSON.stringify(result)+')');const stateBefore=state(g);
 assert.throws(()=>g.run('combatPlayerState.createRoundPlayback(foreignHistory)'));assert.equal(state(g),stateBefore);assert.equal(g.run('calls'),0);assert.equal(canonical(g),before);refs(g);
 g.run('storyBattle.reset()');control.run('storyBattle.reset()');
});

for(const count of [1,2,3])test('one simultaneous Eclipse damages '+count+' exact captured living targets with one initiative entry',()=>{
 const g=fresh({count}),before=canonical(g);both(g);const r=commit(g),event=r.events.find(e=>e.type==='resonance_damage_all');assert.equal(r.events.filter(e=>e.type==='resonance_damage_all').length,1);assert.ok(!r.events.some(e=>e.type==='resonance_wait'));
 assert.equal(r.order.filter(p=>p.side==='ally').length,1);assert.equal(r.order[0].actorId,r.before.party[0].instanceId);assert.equal(r.order[0].spd,14);assert.equal(r.order[0].targetId,null);assert.equal(r.initiative.length,count);assert.equal(g.run('used.length'),count+count+count*3);
 assert.deepEqual(event.elements,['void','prism']);assert.equal(event.power,120);assert.deepEqual(event.targetIds,r.before.enemies.map(e=>e.instanceId));assert.deepEqual(event.hits.map(h=>h.targetId),event.targetIds);event.hits.forEach(h=>{assert.equal(h.defense,7);assert.equal(h.attemptedDamage,113);assert.equal(h.appliedDamage,113);assert.equal(h.hpAfter,887);});assert.deepEqual(r.after.resonance.map(c=>c.strain),[1,1]);assert.equal(canonical(g),before);refs(g);finish(g);g.run('storyBattle.reset()');assert.equal(canonical(g),before);refs(g);
});

for(const spec of [
 {name:'equipment',party:"profiles[1].equipment.accessory='Swift Bangle';",speed:16},
 {name:'Muddied',party:"profiles[1].statuses=['muddied'];",speed:12},
 {name:'prepared Slither',party:"profiles[0].statuses=['slither'];profiles[0].slitherSpeed=3;",speed:3},
 {name:'zero base speed floor',party:'profiles[1].spd=0;',speed:1},
])test('combined initiative uses minimum effective SPD with '+spec.name+' and no extra sample',()=>{
 const g=fresh({count:1,party:spec.party});both(g);const r=commit(g);assert.equal(r.order.find(p=>p.side==='ally').spd,spec.speed);assert.equal(r.initiative[0].candidates.find(c=>c.actorId===r.before.party[0].instanceId).weight,spec.speed);assert.ok(!r.events.some(e=>e.type==='slither_sample'));assert.equal(g.run('used.length'),5);g.run('storyBattle.reset()');
});

test('ordinary independent attacks keep separate initiative rows and their existing RNG budget',()=>{
 const g=fresh({count:2});attacks(g);const r=commit(g,{combined:false,execution:Array(4).fill([0.5,0.99,0.99]).flat()});assert.equal(r.order.filter(p=>p.side==='ally').length,2);assert.equal(r.initiative.length,3);assert.deepEqual(r.order.filter(p=>p.side==='ally').map(p=>p.spd),[16,14]);assert.equal(g.run('used.length'),2+3+12);g.run('storyBattle.reset()');
});

for(const disabled of [false,true])test('an unavailable participant cancels Eclipse once without damage or Strain: '+(disabled?'disabled':'Fallen'),()=>{
 const g=fresh({count:1,disabled,enemy:'ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.atk='+(disabled?100:1000)+';'});both(g);const r=commit(g,{order:['e0','a0'],targets:[disabled?0:0.75]});const cancellations=r.events.filter(e=>e.type==='resonance_cancel');assert.equal(cancellations.length,1);assert.equal(cancellations[0].reason,disabled?'participant_disabled':'participant_dead');assert.equal(cancellations[0].unavailableId,r.before.party[1].instanceId);assert.ok(!r.events.some(e=>e.type==='resonance_damage_all'));assert.deepEqual(r.after.resonance.map(c=>c.strain),[0,0]);assert.equal(r.after.enemies[0].hp,1000);g.run('storyBattle.reset()');
});

test('an earlier independent action can kill a captured target; Eclipse hits only surviving captured IDs',()=>{
 const g=fresh({third:true,count:2,ids:['enemy_marsh_wisp','enemy_briar_hound'],enemy:'ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.hp=20;ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.maxHp=20;'});both(g);attacks(g);const r=commit(g,{order:['a2','a0','e0','e1'],execution:[0.5,0.99,0.99,0.5,0.99,0.99]});const e=r.events.find(e=>e.type==='resonance_damage_all');assert.deepEqual(e.targetIds,r.before.enemies.map(m=>m.instanceId));assert.deepEqual(e.hits.map(h=>h.targetId),[r.before.enemies[1].instanceId]);assert.equal(r.after.enemies[0].hp,0);assert.equal(r.after.enemies[1].hp,887);assert.equal(r.order.filter(p=>p.side==='ally').length,2);g.run('storyBattle.reset()');
});

test('both Strain charges block the recovery round, clear once, and terminal cleanup does not carry Strain',()=>{
 const g=fresh({count:1});both(g);commit(g);finish(g);assert.deepEqual(view(g).resonance.map(c=>c.strain),[1,1]);assert.ok(!view(g).enabledCommands.includes('resonance'));attacks(g);const r=commit(g,{combined:false,execution:Array(3).fill([0.5,0.99,0.99]).flat()});assert.deepEqual(r.after.resonance.map(c=>c.strain),[0,0]);assert.equal(r.events.filter(e=>e.type==='strain'&&e.reason==='recovery').length,2);finish(g);assert.ok(view(g).enabledCommands.includes('resonance'));g.run('storyBattle.reset()');
 const h=fresh({count:3,hp:100,def:0});both(h);const terminal=commit(h,{execution:[]});assert.equal(terminal.outcome,'victory');assert.deepEqual(terminal.after.resonance.map(c=>c.strain),[0,0]);finish(h);assert.equal(h.run('storyBattle.complete(token).outcome'),'victory');h.run("storyBattle.begin(token,{encounter:['enemy_marsh_wisp'],escape:'blocked',presentation:{label:'Temporary follow-up fixture'}})");assert.deepEqual(view(h).resonance.map(c=>c.strain),[0,0]);h.run('storyBattle.reset()');
});

test('renamed authored actors use the same generic consent, representative and minimum-speed machinery',()=>{
 const g=fresh({renamed:true,count:2});both(g);const r=commit(g);assert.deepEqual(r.before.party.map(m=>m.characterId),['fixture_void_actor','fixture_prism_actor']);assert.equal(r.order.filter(p=>p.side==='ally').length,1);assert.equal(r.events.find(e=>e.type==='resonance_damage_all').hits.length,2);assert.equal(r.order[0].spd,14);g.run('storyBattle.reset()');
});

test('strict history validates every consent, initiative candidate, captured target, simultaneous hit and Strain',()=>{
 const g=fresh({count:3});both(g);commit(g);
 for(const edit of ["altered.command.allyActions.pop()","altered.command.allyActions[1].techniqueId='rainbow'","altered.command.allyActions[1].targetIds.reverse()","altered.command.allyActions[1].participantIds.reverse()","altered.command.allyActions[1].actorId=altered.command.allyActions[0].actorId","altered.order[0].spd++","altered.order[0].actorId=altered.before.party[1].instanceId","altered.initiative[0].candidates[0].weight++","altered.after.resonance[1].strain=0","altered.events.find(e=>e.type==='strain').after=2"])rejectHistory(g,edit);
 for(const edit of ["e.techniqueId='null'","e.techniqueName='Forgery'","e.elements.reverse()","e.elements=['void']","e.power++","e.targetIds.reverse()","e.targetIds.pop()","e.participantIds.reverse()","e.hits.reverse()","e.hits.pop()","e.hits.push({...e.hits[0]})","e.hits[0].targetId=altered.before.party[0].instanceId","e.hits[0].defense++","e.hits[0].attemptedDamage++","e.hits[0].appliedDamage++","e.hits[0].hpBefore--","e.hits[0].hpAfter++","e.hits[0].extra=1"])rejectHistory(g,"var e=altered.events.find(e=>e.type==='resonance_damage_all');"+edit);
 g.run('storyBattle.reset()');
});

test('one playback boundary applies all damage simultaneously and projection calls no live formula or RNG',()=>{
 const g=fresh({count:3});both(g);commit(g);const before=state(g);g.run(`resonanceDamageAmount=()=>{throw Error('live Eclipse formula called');};resonancePlanSpeed=()=>{throw Error('live plan speed called');};resonancePlansActor=()=>{throw Error('live coalescing called');};validateResonanceConsents=()=>{throw Error('live consent validator called');};var reel=combatPlayerState.createRoundPlayback(__eclipseResult);`);assert.equal(state(g),before);frozen(g.run('reel'));
 const frames=J(g,'reel.frames'),index=frames.findIndex(f=>f.currentEvent?.type==='resonance_damage_all');assert.ok(index>0);assert.deepEqual(frames[index-1].enemies.map(e=>e.hp),[1000,1000,1000]);assert.deepEqual(frames[index].enemies.map(e=>e.hp),[887,887,887]);assert.deepEqual(frames[index].resonance.map(c=>c.strain),[0,0]);assert.equal(frames[index+1].currentEvent.type,'strain');
 for(let i=0;i<g.run('reel.frameCount');i++){g.run('var frame=combatPlayerState.projectRoundPlaybackFrame(reel,'+i+');');frozen(g.run('frame'));assert.equal(state(g),before);}g.run('storyBattle.reset()');
});

test('simulated native and 2x rendering places a cursor on every captured living enemy without state writes',()=>{
 for(const scale of [1,2]){
  const g=fresh({count:3});technique(g,'eclipse',false);assert.equal(view(g).targetMode,'all');assert.equal(view(g).selectedTargetInstanceId,null);const ids=view(g).enemies.map(e=>e.instanceId);assert.deepEqual(view(g).validTargetIds,ids);assert.deepEqual(J(g,'partyBattleLayout(storyBattle.getView(token)).targetIds'),ids);
  record(g);g.run(`var cursors=[],originalCursor=drawPartyCombatTargetCursor;drawPartyCombatTargetCursor=(x,y)=>{cursors.push({x,y,matrix:matrix.slice()});originalCursor(x,y);};ctx.scale(${scale},${scale});`);const before=state(g);g.run('drawPartyBattle(storyBattle.getView(token));');assert.equal(state(g),before);assert.equal(g.run('calls'),0);const cursors=J(g,'cursors'),layout=J(g,'partyBattleLayout(storyBattle.getView(token))');assert.equal(cursors.length,3);cursors.forEach((c,i)=>{assert.equal(c.x,layout.enemies[i].x+layout.enemies[i].width/2);assert.equal(c.y,63);assert.deepEqual(c.matrix,[scale,scale,0,0]);});assert.match(J(g,"paint.filter(c=>c.type==='text').map(c=>c.args[0]).join(' ')"),/all living enemies/i);g.run('storyBattle.reset()');
 }
});

test('partial and faulted contexts remain canonical-independent and reset invalidates their tokens',()=>{
 const g=fresh({count:1,party:'stats.hp=0;'}),before=canonical(g);technique(g);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);assert.equal(canonical(g),before);refs(g);g.run('var stale=token;storyBattle.reset();');assert.throws(()=>g.run('storyBattle.getState(stale)'),/stale/);assert.equal(canonical(g),before);refs(g);
 const h=fresh({count:1}),old=canonical(h);both(h);const tape=[0,...orderTape(h)];h.run('var partial='+JSON.stringify(tape)+`,at=0;Math.random=()=>{if(at===partial.length)throw Error('late combined failure');return partial[at++];};`);assert.throws(()=>act(h,'commitRound'),/late combined failure/);assert.equal(h.run('storyBattle.getState(token).phase'),'fault');assert.equal(local(h).enemies[0].hp,887);assert.deepEqual(local(h).resonance.map(c=>c.strain),[1,1]);assert.equal(act(h,'commitRound'),false);assert.equal(h.run('storyBattle.complete(token)'),false);assert.equal(canonical(h),old);h.run('storyBattle.reset()');assert.equal(canonical(h),old);refs(h);
});

test('Eclipse has no ambient startup or caller beyond the authorized breakfast adapter',()=>{
 for(const file of scriptOrderFromIndexHtml()){if(['story-battle.js','sera-liora-breakfast-battle.js'].includes(file))continue;assert.doesNotMatch(fs.readFileSync(path.join(ROOT,file),'utf8'),/storyBattle\.(createContext|begin|act|complete)\s*\(/,file);}
 assert.doesNotMatch(fs.readFileSync(path.join(ROOT,'sera-liora-breakfast.js'),'utf8'),/storyBattle|eclipse/i);const g=context();assert.equal(g.run('storyBattle.hasContext()'),false);assert.equal(g.run('SAVE_VERSION'),5);
});

function lowFixture(options={}){const g=context({low:true,...options});g.run(`dialogue.open=false;dialogue.callbacks=null;
 installFormationState(preparePartyEnemyFormation(['enemy_marsh_wisp','enemy_marsh_wisp']).templates,{escape:'blocked'});combat.enemies.forEach(e=>Object.assign(e,{hp:1000,maxHp:1000,atk:1,def:7,spd:1}));
 combatPlayerState.initializeCommandParty({members:[{characterId:'fixture_void_actor',slot:0,name:'Synthetic A',hp:100,maxHp:100,atk:1,def:0,spd:20,statuses:[]},{characterId:'fixture_prism_actor',slot:1,name:'Synthetic B',hp:100,maxHp:100,atk:1,def:0,spd:6,statuses:[]}],inventory:[],escape:'blocked',resonance:[{slot:0,characterId:'fixture_void_actor'},{slot:1,characterId:'fixture_prism_actor'}]});Math=Object.create(Math);var calls=0;Math.random=()=>{calls++;throw Error('unexpected consent rejection RNG');};`);return g;}
function rawRequest(g){const v=local(g),participants=v.party.map(m=>m.instanceId),targetIds=v.enemies.map(m=>m.instanceId);return {type:'party-round',allyActions:participants.map(actorId=>({type:'resonance',actorId,techniqueId:'eclipse',participantIds:participants,targetIds})),enemyActions:v.enemies.map(e=>({actorId:e.instanceId,targetId:participants[0]}))};}
const lowState=g=>g.run('JSON.stringify({stats,statusEffects,party:combatPlayerState.getView(),local:combatPlayerState.getCommandView(),round:combatPlayerState.getRoundView(),enemies:combat.enemies,sequence:combatEnemyInstanceSequence})');
test('actual shared preparation rejects incomplete, conflicting and malformed consent before RNG or writes',()=>{
 const g=lowFixture(),request=rawRequest(g);
 for(const edit of ["bad.allyActions.pop()","bad.allyActions[1]={type:'attack',actorId:bad.allyActions[1].actorId,targetId:bad.enemyActions[0].actorId}","bad.allyActions[1].techniqueId='rainbow'","bad.allyActions[1].participantIds.reverse()","bad.allyActions[1].targetIds.reverse()","bad.allyActions[0].targetIds=[]","bad.allyActions[0].targetIds.push('foreign_enemy')","bad.allyActions[0].targetIds[0]=bad.allyActions[0].actorId","bad.allyActions[1].actorId=bad.allyActions[0].actorId"]){g.run('var bad='+JSON.stringify(request)+';'+edit);const before=lowState(g);assert.throws(()=>g.run('combatPlayerState.resolveRound(bad)'));assert.equal(lowState(g),before);assert.equal(g.run('calls'),0);}
 g.run('var request='+JSON.stringify(request)+`;var controlTape=[0,0,0.5,0.99,0.99,0.5,0.99,0.99],used=0;Math.random=()=>controlTape[used++];var control=combatPlayerState.resolveRound(request);`);assert.equal(g.run('used'),8);assert.equal(g.run('control.order.filter(p=>p.side==="ally").length'),1);assert.equal(g.run('control.order[0].spd'),6);
});
test('malformed consent IDs reject before toJSON, property accessors, RNG or state writes',()=>{
 const g=lowFixture(),request=rawRequest(g);
 for(const edit of [
  "bad.allyActions[0].targetIds[0]={toJSON(){hooks++;return bad.enemyActions[0].actorId;}}",
  "bad.allyActions[0].participantIds[0]={toJSON(){hooks++;return bad.allyActions[0].actorId;}}",
  "bad.allyActions[0].targetIds[0]={get toJSON(){hooks++;throw Error('caller accessor invoked');}}",
  "bad.allyActions[0].participantIds[0]={get toJSON(){hooks++;throw Error('caller accessor invoked');}}",
  "Object.defineProperty(bad.allyActions[0].targetIds,'0',{get(){hooks++;throw Error('target accessor invoked');}})",
  "Object.defineProperty(bad.allyActions[0].participantIds,'0',{get(){hooks++;throw Error('participant accessor invoked');}})",
  "bad.allyActions[0].targetIds[0]=null",
  "bad.allyActions[0].participantIds[0]=7",
 ]){
  g.run('var hooks=0,bad='+JSON.stringify(request)+';'+edit);const before=lowState(g);assert.throws(()=>g.run('combatPlayerState.resolveRound(bad)'));assert.equal(g.run('hooks'),0);assert.equal(g.run('calls'),0);assert.equal(lowState(g),before);
 }
});

module.exports={name:'Explicit Eclipse consent: one minimum-speed initiative action and simultaneous all-enemy witnesses',checks,run(){for(const {name,run}of checks){try{run();}catch(e){e.message=name+': '+e.message;throw e;}}}};
