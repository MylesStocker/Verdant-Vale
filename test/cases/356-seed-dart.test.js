'use strict';
const assert=require('assert/strict'),fs=require('fs');
const {createContext}=require('../harness');
const H=require('./180-resonance-mvp.test');
const {J,view,ids,command,resolve,reject,state,editResult}=H;
const tests=[],test=(name,run)=>tests.push({name,run});
function fresh(options={}){
 const g=H.fresh({...options,inventory:options.inventory||['Dart Seed'],prepare:false});
 g.run(`seed.resonance.forEach(c=>{c.level=${options.level??11}});combatPlayerState.initializeCommandParty(seed)`);return g;
}
function dart(g,actor=1,target=0){return {type:'resonance',actorId:ids(g)[actor],techniqueId:'seed_dart',targetId:view(g).enemies[target].instanceId,participantIds:[ids(g)[actor]]};}
const sv=g=>J(g,'combatPlayerState.session.getView()');
function call(g,m,...a){return g.run(`combatPlayerState.session.${m}(${a.map(JSON.stringify).join(',')})`);}
function choose(g,c){let n=0;while(sv(g).selectedCommand!==c){assert.ok(n++<5);call(g,'moveCommand','next');}call(g,'confirmCommand');}
function spell(g,id='seed_dart'){choose(g,'resonance');let n=0;while(sv(g).selectedTechniqueId!==id){assert.ok(n++<5);call(g,'moveTechnique','next');}call(g,'confirmTechnique');call(g,'confirmTarget');}
function ack(g){while(sv(g).phase==='playback')call(g,'advancePlayback');call(g,'acknowledgePlayback');}
function round(g){g.run('Math.random=()=>.5');call(g,'commitRound');ack(g);}

test('level authority, no entitlement from seeds, closed frozen cost and preflight rejection',()=>{
 for(const level of [1,10,11,20]){const g=fresh({level});if(level<11){g.run('var bad='+JSON.stringify(command(g,dart(g))));reject(g,'combatPlayerState.resolveRound(bad)');}else assert.equal(resolve(g,command(g,dart(g))).events.find(e=>e.type==='resonance_damage').techniqueId,'seed_dart');}
 const g=fresh();g.run('var bad='+JSON.stringify(command(g,dart(g,0))));reject(g,'combatPlayerState.resolveRound(bad)');
 assert.ok(g.run('Object.isFrozen(RESONANCE_TECHNIQUES.seed_dart.reagentCost)'));
 for(const change of ["d.reagentCost.quantity=0","d.reagentCost.quantity=-1","d.reagentCost.quantity=.5","d.reagentCost.quantity=Number.MAX_SAFE_INTEGER+1","d.reagentCost.itemId='missing'","d.reagentCost.itemId='Potion'","d.reagentCost.extra=1","d.reagentCost=null","Object.defineProperty(d.reagentCost,'quantity',{get(){throw Error('getter')}})"]){
  g.run('var d='+JSON.stringify(J(g,'RESONANCE_TECHNIQUES.seed_dart'))+';d.elements=Object.freeze(d.elements);'+change);reject(g,'validateResonanceTechnique(d)');
 }
 g.run("var d=RESONANCE_TECHNIQUES.seed_dart;ITEM_REGISTRY['Dart Seed'].heals=20");reject(g,'validateResonanceTechnique(d)');g.run("delete ITEM_REGISTRY['Dart Seed'].heals");
 const no=fresh({inventory:[]});no.run('var bad='+JSON.stringify(command(no,dart(no))));reject(no,'combatPlayerState.resolveRound(bad)');
 const item=command(g,null);item.allyActions[1]={type:'item',actorId:ids(g)[1],itemId:'Dart Seed',targetId:ids(g)[1]};g.run('var bad='+JSON.stringify(item));reject(g,'combatPlayerState.resolveRound(bad)');
});
test('execution spends once, exact damage, one Strain, no spell RNG; immutable/tampered playback',()=>{
 const g=fresh({enemy:[{def:12}],inventory:['Potion','Dart Seed','Elixir','Dart Seed']}),r=resolve(g,command(g,dart(g))),e=r.events.find(e=>e.type==='resonance_damage');
 assert.equal(e.attemptedDamage,63);assert.deepEqual(e.elements,['bloommarked']);assert.deepEqual(e.reagent,{itemId:'Dart Seed',quantity:1,inventoryBefore:['Potion','Dart Seed','Elixir','Dart Seed'],inventoryAfter:['Potion','Elixir','Dart Seed']});
 assert.deepEqual(r.after.inventory,e.reagent.inventoryAfter);assert.equal(r.after.resonance[1].strain,1);assert.equal(r.events.filter(e=>e.type==='strain'&&e.reason==='application').length,1);assert.equal(g.run('used.length'),5);
 const before=state(g);g.run("Math.random=()=>{throw Error('replay RNG')};for(let n=0;n<reel.frameCount;n++)combatPlayerState.projectRoundPlaybackFrame(reel,n)");assert.equal(state(g),before);
 for(const edit of ["delete e.reagent","e.reagent.quantity=2","e.reagent.itemId='Potion'","e.reagent.inventoryBefore.reverse()","e.reagent.inventoryAfter.push('Dart Seed')","e.actorId=altered.before.party[0].instanceId","e.appliedDamage++","altered.after.inventory.push('Dart Seed')","altered.events=altered.events.filter(e=>e.type!=='strain')"])
  editResult(g,"var e=altered.events.find(e=>e.type==='resonance_damage');"+edit);
 const resisted=fresh({enemy:[{def:100}]});assert.equal(resolve(resisted,command(resisted,dart(resisted))).events.find(e=>e.type==='resonance_damage').appliedDamage,1);assert.deepEqual(view(resisted).inventory,[]);
});
test('dead/disabled actor and exact dead target cancel without spending or Strain',()=>{
 const dead=fresh({party:[{},{hp:1}]});let c=command(dead,dart(dead));c.enemyActions[0].targetId=ids(dead)[1];let r=resolve(dead,c,['e0','a0','a1']);assert.deepEqual(r.after.inventory,['Dart Seed']);assert.equal(r.after.resonance[1].strain,0);
 const disabled=fresh({disabled:true,party:[{hp:40},{}]});r=resolve(disabled,command(disabled,dart(disabled)),['e0','a0','a1']);assert.deepEqual(r.after.inventory,['Dart Seed']);assert.equal(r.after.resonance[1].strain,0);
 const target=fresh({enemies:2,enemy:[{hp:1},{}],inventory:['Dart Seed','Sapper Charge']});c=command(target,dart(target));c.allyActions[0]={type:'item',actorId:ids(target)[0],itemId:'Sapper Charge',targetId:view(target).enemies[0].instanceId};
 r=resolve(target,c,['a0','a1','e0','e1'],[.5,.99,.99]);assert.deepEqual(r.after.inventory,['Dart Seed']);assert.equal(r.after.resonance[1].strain,0);assert.ok(r.events.some(e=>e.type==='cancel'));
});
test('draft reservation/backtrack, last seed, recovery, and stale submission remain non-faulting',()=>{
 const g=fresh();call(g,'begin',{commandSet:'standard'});choose(g,'observe');call(g,'confirmTarget');spell(g);
 assert.equal(sv(g).phase,'ready');assert.deepEqual(sv(g).reservedInventory,[{itemId:'Dart Seed',quantity:1}]);assert.deepEqual(view(g).inventory,['Dart Seed']);
 call(g,'backtrack');assert.deepEqual(sv(g).reservedInventory,[]);assert.equal(sv(g).phase,'targeting');call(g,'cancelTargeting');call(g,'cancelTechnique');choose(g,'item');assert.ok(!sv(g).items.some(i=>i.itemId==='Dart Seed'));call(g,'cancelItem');spell(g);round(g);
 assert.deepEqual(view(g).inventory,[]);assert.equal(view(g).resonance[1].strain,1);
 choose(g,'observe');call(g,'confirmTarget');choose(g,'attack');call(g,'confirmTarget');round(g);assert.equal(view(g).resonance[1].strain,0);
 choose(g,'observe');call(g,'confirmTarget');assert.ok(!sv(g).techniques.some(t=>t.techniqueId==='seed_dart'));
 const before=state(g);assert.throws(()=>g.run('combatPlayerState.session.confirmTechnique()'));assert.equal(state(g),before);assert.notEqual(sv(g).phase,'fault');
});
test('production supply once, structural joins neutral, save/load and recruited level 11 eligibility',()=>{
 const g=createContext();g.run("dialogue.open=false;storyCheckpointLab.apply('mq5_assignment_ready')");assert.equal(g.run("stats.items.filter(i=>i.name==='Dart Seed').length"),0);
 assert.equal(g.run('completeMq5Assignment()'),true);assert.equal(g.run("stats.items.filter(i=>i.name==='Dart Seed').length"),10);assert.equal(g.run('completeMq5Assignment()'),false);
 assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false;persistentParty.joinEsla({level:11})');assert.equal(g.run("stats.items.filter(i=>i.name==='Dart Seed').length"),10);
 const structural=createContext();structural.run('dialogue.open=false;persistentParty.joinEsla({level:11})');assert.equal(structural.run("stats.items.filter(i=>i.name==='Dart Seed').length"),0);
 structural.run("grantItem('Dart Seed');persistentParty.beginCombat(['enemy_marsh_wisp'],{escape:'fastest_living'})");choose(structural,'observe');call(structural,'confirmTarget');assert.ok(sv(structural).techniques.some(t=>t.techniqueId==='seed_dart'));
 assert.deepEqual(J(g,"persistentParty.fieldItemTargets('Dart Seed')"),[]);
});

test('canonical victory and escape authenticate inventory once; no live deduction during battle',()=>{
 for(const outcome of ['victory','escape']){
  const g=createContext();g.run("dialogue.open=false;storyCheckpointLab.apply('mq7_lantern_house_ready');stats.items=[createItem('Dart Seed')];Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,{hp:"+(outcome==='victory'?50:1000)+",maxHp:1000,atk:1,def:0,spd:1});persistentParty.beginCombat(['enemy_marsh_wisp'],{escape:'fastest_living'})");
  choose(g,'observe');call(g,'confirmTarget');spell(g);round(g);assert.equal(g.run('stats.items.length'),1);
  if(outcome==='escape'){choose(g,'run');choose(g,'run');g.run('Math.random=()=>0');call(g,'commitRound');ack(g);}
  assert.equal(sv(g).phase,outcome);const receipt=J(g,'persistentParty.commitCombat()');assert.deepEqual(receipt.inventory,[]);assert.equal(g.run('stats.items.length'),0);assert.throws(()=>g.run('persistentParty.commitCombat()'));
 }
});
test('reusing a previously valid cast after the last seed rejects before RNG or mutation',()=>{
 const g=fresh(),prior=command(g,dart(g));resolve(g,prior);resolve(g,command(g,null));assert.equal(view(g).resonance[1].strain,0);
 g.run('var stale='+JSON.stringify(prior)+';var staleDraws=0;Math.random=()=>{staleDraws++;throw Error("stale command drew RNG")};');reject(g,'combatPlayerState.resolveRound(stale)');assert.equal(g.run('staleDraws'),0);assert.equal(g.run('combatPlayerState.session.getView()'),null);
});
test('canonical defeat preserves executed spending through authenticated writeback',()=>{
 const g=createContext();g.run("dialogue.open=false;storyCheckpointLab.apply('mq7_lantern_house_ready');stats.hp=0;stats.items=[createItem('Dart Seed')];Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,{hp:1000,maxHp:1000,atk:9999,def:0,spd:1});persistentParty.beginCombat(['enemy_marsh_wisp'],{escape:'blocked'})");
 spell(g);g.run('var draw=0;Math.random=()=>draw++===0?0:.99');call(g,'commitRound');ack(g);assert.equal(sv(g).phase,'defeat');assert.equal(g.run('stats.items.length'),1);assert.deepEqual(J(g,'persistentParty.commitCombat().inventory'),[]);assert.equal(g.run('stats.items.length'),0);
});
module.exports={name:'Seed Dart: level learning, component metadata, reservations, cancellation, replay and canonical ownership',fresh,dart,call,choose,spell,ack,round,run(){for(const t of tests){try{t.run();}catch(e){e.message=t.name+': '+e.message;throw e;}}console.log('  '+tests.length+' Seed Dart groups passed');}};
