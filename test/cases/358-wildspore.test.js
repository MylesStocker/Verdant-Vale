'use strict';
const assert=require('assert/strict');
const H=require('./180-resonance-mvp.test');
const S=require('./356-seed-dart.test');
const {J,view,ids,command,resolve,reject,state,editResult}=H;
const tests=[],test=(name,run)=>tests.push({name,run});
const wild=g=>({...S.dart(g),techniqueId:'wildspore'});
function fresh(options={}) {return S.fresh({inventory:[],...options});}

test('starting knowledge without seeds, no Lely entitlement, closed accuracy metadata',()=>{
 const g=fresh({level:1});const r=resolve(g,command(g,wild(g)));assert.ok(r.events.some(e=>e.type==='resonance_accuracy'));assert.deepEqual(r.after.inventory,[]);assert.equal(r.after.resonance[1].strain,3);
 const bad=fresh();bad.run('var c='+JSON.stringify(command(bad,{...wild(bad),actorId:ids(bad)[0],participantIds:[ids(bad)[0]]})));reject(bad,'combatPlayerState.resolveRound(c)');
 for(const change of ['d.hitMultiplier=0','d.hitMultiplier=1','d.hitMultiplier=NaN','d.rounds=0','d.rounds=1.5','d.target="living_wounded_ally"','d.power=10']){
  g.run('var d='+JSON.stringify(J(g,'RESONANCE_TECHNIQUES.wildspore'))+';d.elements=Object.freeze(d.elements);'+change);reject(g,'validateResonanceTechnique(d)');
 }
});
test('75 percent reduction covers exactly the next two action rounds, fast and slow casts',()=>{
 for(const fast of [true,false]){
  const g=fresh(),r=resolve(g,command(g,wild(g)),fast?['a0','a1','e0']:['e0','a0','a1'],[.5,.99,.5]);
  const hit=r.events.find(e=>e.type==='attack'),status=r.after.enemies[0].accuracyEffect;
  assert.equal(status.expiresRound,fast?2:3);assert.equal(hit.evaded,fast);assert.equal(!!hit.accuracy,fast);if(fast)assert.ok(hit.accuracy.chance>=.75);
  assert.equal(r.after.resonance[1].strain,3);
  for(let n=2;n<=4;n++){
   const next=resolve(g,command(g,null),undefined,[.5,.99,.5]),attack=next.events.find(e=>e.type==='attack');
   assert.equal(attack.evaded,n<=status.expiresRound);assert.equal(!!attack.accuracy,n<=status.expiresRound);
   assert.equal(!!next.after.enemies[0].accuracyEffect,n<status.expiresRound);assert.equal(next.after.resonance[1].strain,4-n);
   assert.equal(next.events.filter(e=>e.type==='resonance_accuracy_end').length,n===status.expiresRound?1:0);
  }
 }
});
test('exact enemy only; existing evasion stacks multiplicatively; no extra RNG; immutable replay rejects tampering',()=>{
 const g=fresh({enemies:2}),r=resolve(g,command(g,wild(g)),undefined,[.5,.99,.5,.5,.99,.5]);
 const hits=r.events.filter(e=>e.type==='attack');assert.equal(hits[0].evaded,true);assert.equal(hits[1].evaded,false);assert.ok(!r.after.enemies[1].accuracyEffect);assert.equal(g.run('used.length'),9);
 const base=g.run('evadeChance(10,10,false)');assert.equal(hits[0].accuracy.chance,1-(1-base)*.25);
 const before=state(g);g.run("Math.random=()=>{throw Error('playback RNG')};for(let n=0;n<reel.frameCount;n++)combatPlayerState.projectRoundPlaybackFrame(reel,n)");assert.equal(state(g),before);
 for(const mutation of ['e.after.expiresRound++','e.after.techniqueId="quickbloom"','e.targetId=altered.before.enemies[1].instanceId','altered.after.enemies[0].accuracyEffect.expiresRound++','altered.events.find(e=>e.type==="attack").accuracy.chance=.1','delete altered.events.find(e=>e.type==="attack").accuracy','altered.events=altered.events.filter(e=>e.type!=="strain")'])
  editResult(g,"var e=altered.events.find(e=>e.type==='resonance_accuracy');"+mutation);
});
test('dead target or caster cancels without Strain or status',()=>{
 const dead=fresh({party:[{},{hp:1}]});let c=command(dead,wild(dead));c.enemyActions[0].targetId=ids(dead)[1];let r=resolve(dead,c,['e0','a0','a1']);assert.equal(r.after.resonance[1].strain,0);assert.ok(!r.after.enemies[0].accuracyEffect);
 const target=fresh({enemies:2,enemy:[{hp:1},{}],inventory:['Sapper Charge']});c=command(target,wild(target));c.allyActions[0]={type:'item',actorId:ids(target)[0],itemId:'Sapper Charge',targetId:view(target).enemies[0].instanceId};
 r=resolve(target,c,['a0','a1','e0','e1'],[.5,.99,.99]);assert.equal(r.after.resonance[1].strain,0);assert.ok(!r.after.enemies[0].accuracyEffect);
});

function enemyFixture(id) {
 const g=H.fresh({prepare:false,party:[{hp:500,maxHp:500},{hp:500,maxHp:500}]});
 g.run(`combat.enemy={...ENEMY_TEMPLATE_REGISTRY['${id}']};combat.enemy.hp=combat.enemy.maxHp=2000;combatPlayerState.initializeCommandParty(seed)`);return g;
}
test('Meat Paw strikes and melee counters use the reduced chance, without extra draws',()=>{
 for(const [move,name]of [[.15,'Paw'],[.5,'Claw'],[.9,'Pounce']]){
  const g=enemyFixture('enemy_meat_paw'),r=resolve(g,command(g,wild(g)),['a0','a1','e0'],[move,.5]),e=r.events.find(e=>e.type==='vital_strike');
  assert.equal(e.attackName,name);assert.equal(e.evaded,true);assert.equal(e.appliedDamage,0);assert.ok(e.chance>=.75);assert.equal(g.run('used.length'),4);
  editResult(g,'altered.events.find(e=>e.type==="vital_strike").chance=.1');
 }
 const g=enemyFixture('enemy_thornback'),c=command(g,wild(g));c.allyActions[0]={type:'attack',actorId:ids(g)[0],targetId:view(g).enemies[0].instanceId};
 const r=resolve(g,c,['a1','a0','e0'],[.5,.99,.99,0,.5,.99,.5,.5,.99,.5]),e=r.events.find(e=>e.type==='counterattack');
 assert.equal(e.evaded,true);assert.equal(e.appliedDamage,0);assert.ok(e.evasionChance>=.75);
 editResult(g,'altered.events.find(e=>e.type==="counterattack").evasionChance=.1');
 assert.equal(g.run("resonanceAccuracyEvasion(.5,{techniqueId:'wildspore'})"),.875);
 assert.equal(g.run("resonanceAccuracyEvasion(1,{techniqueId:'wildspore'})"),1);
});
test('victory and escape clear battle-only spores and Strain; expired effects can be refreshed',()=>{
 for(const end of ['victory','escape']){
  const g=fresh({enemy:[{hp:40}],inventory:['Sapper Charge']});resolve(g,command(g,wild(g)));
  const c=command(g,null);if(end==='victory')c.allyActions[0]={type:'item',actorId:ids(g)[0],itemId:'Sapper Charge',targetId:view(g).enemies[0].instanceId};else c.allyActions=c.allyActions.map(a=>({type:'run',actorId:a.actorId}));
  const r=resolve(g,c,undefined,end==='escape'?[0]:[]);assert.equal(r.outcome,end);assert.ok(!r.after.enemies[0].accuracyEffect);assert.equal(r.after.resonance[1].strain,0);assert.equal(r.events.find(e=>e.type==='resonance_accuracy_end').reason,'cleanup');
  editResult(g,'altered.events=altered.events.filter(e=>e.type!=="resonance_accuracy_end")');
 }
 const g=fresh();resolve(g,command(g,wild(g)));for(let n=0;n<3;n++)resolve(g,command(g,null));
 const r=resolve(g,command(g,wild(g)));assert.equal(r.after.resonance[1].strain,3);assert.equal(r.after.enemies[0].accuracyEffect.expiresRound,6);
});
test('canonical battle cleanup never saves spores; existing recruited Esla has starting spell',()=>{
 const {createContext}=require('../harness'),g=createContext();
 g.run("dialogue.open=false;storyCheckpointLab.apply('mq7_lantern_house_ready');stats.items=[];Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,{hp:1000,maxHp:1000,atk:1,def:0,spd:1});persistentParty.beginCombat(['enemy_marsh_wisp'],{escape:'fastest_living'})");
 S.choose(g,'observe');S.call(g,'confirmTarget');S.spell(g,'wildspore');S.round(g);assert.equal(view(g).resonance[1].strain,3);assert.ok(view(g).enemies[0].accuracyEffect);
 S.choose(g,'run');S.choose(g,'run');g.run('Math.random=()=>0');S.call(g,'commitRound');S.ack(g);assert.equal(J(g,'combatPlayerState.session.getView().phase'),'escape');assert.ok(!view(g).enemies[0].accuracyEffect);
 g.run('persistentParty.commitCombat();dialogue.open=false');assert.equal(g.run('saveGame()&&loadGame()'),true);assert.doesNotMatch(g.run('localStorage.getItem("verdantVale_save")'),/accuracyEffect|wildspore|expiresRound/);assert.equal(g.run('SAVE_VERSION'),5);
});

test('Lab discard and story defeat/retry reset spores without changing the canonical party',()=>{
 const {createContext}=require('../harness'),lab=createContext();
 lab.run("dialogue.open=false;Math=Object.create(Math);Math.random=()=>.5;var original=JSON.stringify([stats,statusEffects,persistentParty.serialize()]);partyCombatLab.enter('command_showcase')");
 S.choose(lab,'observe');S.call(lab,'confirmTarget');S.spell(lab,'wildspore');S.round(lab);assert.ok(view(lab).enemies[0].accuracyEffect);lab.run('partyCombatLab.exit()');assert.equal(lab.run('JSON.stringify([stats,statusEffects,persistentParty.serialize()])===original'),true);
 const g=createContext();g.run("dialogue.open=false;Math=Object.create(Math);var original=JSON.stringify([stats,statusEffects,persistentParty.serialize()]);Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,{hp:1000,maxHp:1000,atk:9999,def:0,spd:1});var token=storyBattle.createContext({id:'wildspore_fixture',party:[{characterId:'esla',name:'Esla',hp:80,maxHp:80,atk:16,def:7,spd:11,statuses:[],equipment:{weapon:null,armor:null,shield:null,accessory:null},slitherSpeed:1}],inventory:[],resonance:[{slot:0,characterId:'esla'}]});storyBattle.begin(token,{encounter:['enemy_marsh_wisp'],escape:'blocked',presentation:{label:'Wildspore fixture'}})");
 S.spell(g,'wildspore');g.run('var i=0;Math.random=()=>i++===0?0:.99');S.call(g,'commitRound');S.ack(g);assert.equal(J(g,'combatPlayerState.session.getView().phase'),'defeat');assert.ok(!view(g).enemies[0].accuracyEffect);assert.equal(view(g).resonance[0].strain,0);
 g.run('storyBattle.complete(token);storyBattle.retry(token)');assert.ok(!view(g).enemies[0].accuracyEffect);assert.equal(view(g).resonance[0].strain,0);assert.equal(view(g).party[0].hp,80);g.run('storyBattle.reset()');assert.equal(g.run('JSON.stringify([stats,statusEffects,persistentParty.serialize()])===original'),true);
});
module.exports={name:'Wildspore: starting spell, exact accuracy reduction, two action rounds, Strain and authenticated playback',fresh,wild,run(){for(const t of tests){try{t.run();}catch(e){e.message=t.name+': '+e.message;throw e;}}console.log('  '+tests.length+' Wildspore groups passed');}};
