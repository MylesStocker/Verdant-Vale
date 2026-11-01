'use strict';
const assert=require('assert/strict'),fs=require('fs');
const {createContext}=require('../harness');
const H=require('./180-resonance-mvp.test'),S=require('./356-seed-dart.test');
const {J,view,ids,state,reject}=H,{call,choose,spell,round}=S;
const tests=[],test=(name,run)=>tests.push({name,run});
function synthetic(mode){
 const read=fs.readFileSync;
 try{fs.readFileSync=function(f,...a){let s=read.call(this,f,...a);if(typeof s!=='string')return s;
  if(mode==='pair'&&String(f).endsWith('/persistent-party.js'))s=s.replace('  lely:Object.freeze',"  fixture_a:Object.freeze({rareBorn:true,affinity:'bloommarked',knownTechniques:Object.freeze(['fixture_dart_a'])}),\n  fixture_b:Object.freeze({rareBorn:true,affinity:'bloommarked',knownTechniques:Object.freeze(['fixture_dart_b'])}),\n  lely:Object.freeze");
  if(mode==='pair'&&String(f).endsWith('/resonance.js'))s=s.replace('  quickbloom:validate', ['a','b'].map(x=>`  fixture_dart_${x}:validateResonanceTechnique({id:'fixture_dart_${x}',name:'Fixture Dart',kind:'ordinary',initiator:'fixture_${x}',elements:Object.freeze(['bloommarked']),participants:[{characterId:'fixture_${x}',affinity:'bloommarked',strain:1}],target:'living_enemy',effect:'damage',power:75,reagentCost:{itemId:'Dart Seed',quantity:1}}),`).join('\n')+'\n  quickbloom:validate');
  if(mode==='double'&&String(f).endsWith('/resonance.js'))s=s.replace("power:75,reagentCost:{itemId:'Dart Seed',quantity:1}","power:75,reagentCost:{itemId:'Dart Seed',quantity:2}");
  if(mode==='lab'&&String(f).endsWith('/party-combat-lab.js'))s=s.replace("Object.freeze({slot:1,characterId:'esla'})","Object.freeze({slot:1,characterId:'esla',level:11})").replace("  'Potion','Potion','Potion'","  'Dart Seed','Potion','Potion','Potion'");
  return s;};return ['pair','double'].includes(mode)?H.fresh({prepare:false,inventory:mode==='double'?['Dart Seed','Potion','Dart Seed','Dart Seed']:['Dart Seed']}):createContext();
 }finally{fs.readFileSync=read;}
}
test('two synthetic casters compete for one shared seed, cancel releases; no production additions',()=>{
 const g=synthetic('pair');g.run("seed.members.forEach((m,i)=>m.characterId='fixture_'+['a','b'][i]);seed.resonance.forEach((c,i)=>c.characterId=seed.members[i].characterId);combatPlayerState.initializeCommandParty(seed);combatPlayerState.session.begin({commandSet:'standard'});");
 spell(g,'fixture_dart_a');assert.deepEqual(J(g,'combatPlayerState.session.getView().reservedInventory'),[{itemId:'Dart Seed',quantity:1}]);assert.equal(J(g,'combatPlayerState.session.getView().techniques').length,0);
 call(g,'backtrack');assert.deepEqual(J(g,'combatPlayerState.session.getView().reservedInventory'),[]);call(g,'cancelTargeting');call(g,'cancelTechnique');choose(g,'attack');call(g,'confirmTarget');spell(g,'fixture_dart_b');assert.equal(J(g,'combatPlayerState.session.getView().reservedInventory')[0].quantity,1);
 const q=H.command(g,null);q.allyActions=view(g).party.map((a,i)=>({type:'resonance',actorId:a.instanceId,techniqueId:'fixture_dart_'+['a','b'][i],targetId:view(g).enemies[0].instanceId,participantIds:[a.instanceId]}));
 // Complete-command validation also rejects oversubscription before any RNG.
 const raw=synthetic('pair');raw.run("seed.members.forEach((m,i)=>m.characterId='fixture_'+['a','b'][i]);seed.resonance.forEach((c,i)=>c.characterId=seed.members[i].characterId);combatPlayerState.initializeCommandParty(seed);var bad="+JSON.stringify(q));reject(raw,'combatPlayerState.resolveRound(bad)');
 round(g);assert.deepEqual(view(g).inventory,[]);
});
test('synthetic quantity two is reserved, consumed and historically verified as a quantity',()=>{
 const g=synthetic('double');g.run('seed.resonance[1].level=11;combatPlayerState.initializeCommandParty(seed);combatPlayerState.session.begin({commandSet:"standard"})');
 choose(g,'observe');call(g,'confirmTarget');spell(g);assert.deepEqual(J(g,'combatPlayerState.session.getView().reservedInventory'),[{itemId:'Dart Seed',quantity:2}]);round(g);assert.deepEqual(view(g).inventory,['Potion','Dart Seed']);
});
test('temporary Lab spending discarded on exit; canonical inventory untouched',()=>{
 const g=synthetic('lab');g.run("dialogue.open=false;Math=Object.create(Math);Math.random=()=>.5;stats.items=[createItem('Dart Seed'),createItem('Potion')];Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,{hp:1000,maxHp:1000});var original=JSON.stringify([stats,statusEffects,persistentParty.serialize()]);partyCombatLab.enter('lely_esla_one')");
 choose(g,'observe');call(g,'confirmTarget');spell(g);round(g);assert.ok(!view(g).inventory.includes('Dart Seed'));g.run('partyCombatLab.exit()');assert.equal(g.run('JSON.stringify([stats,statusEffects,persistentParty.serialize()])===original'),true);
});
test('story context carries spending, local retry restores entry, reset isolates live state',()=>{
 const g=createContext();g.run("dialogue.open=false;Math=Object.create(Math);Math.random=()=>.5;var original=JSON.stringify([stats,statusEffects,persistentParty.serialize()]);Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,{hp:50,maxHp:50,atk:1,def:0,spd:1});var token=storyBattle.createContext({id:'seed_fixture',party:[{characterId:'esla',name:'Esla',hp:80,maxHp:80,atk:16,def:7,spd:11,statuses:[],equipment:{weapon:null,armor:null,shield:null,accessory:null},slitherSpeed:1}],inventory:['Dart Seed','Dart Seed'],resonance:[{slot:0,characterId:'esla',level:11}]});storyBattle.begin(token,{encounter:['enemy_marsh_wisp'],escape:'blocked',presentation:{label:'Reagent fixture'}})");
 spell(g);round(g);g.run('storyBattle.complete(token)');assert.deepEqual(J(g,'storyBattle.getState(token).inventory'),['Dart Seed']);
 g.run("Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,{hp:1000,maxHp:1000,atk:9999});storyBattle.begin(token,{encounter:['enemy_marsh_wisp'],escape:'blocked',presentation:{label:'Retry fixture'}})");
 spell(g);g.run('var i=0;Math.random=()=>i++===0?0:.99');call(g,'commitRound');S.ack(g);assert.equal(J(g,'combatPlayerState.session.getView().phase'),'defeat');assert.deepEqual(view(g).inventory,[]);
 g.run('storyBattle.complete(token);storyBattle.retry(token)');assert.deepEqual(view(g).inventory,['Dart Seed']);g.run('storyBattle.reset()');assert.equal(g.run('JSON.stringify([stats,statusEffects,persistentParty.serialize()])===original'),true);
});
test('damage exceeds level-11 equipped noncritical Attack across ordinary defences',()=>{
 const g=createContext();g.run('dialogue.open=false;persistentParty.joinEsla({level:11})');const atk=g.run("effectiveAtk({...persistentParty.getMember('esla'),weapon:createItem('Dragon Blade')})");assert.equal(atk,28);
 for(const def of [0,7,12,30]){const damage=g.run(`resonanceDamageAmount(75,${def})`),high=g.run(`attackDamageNumbers(${atk},${def},1.2,false).dmg`);assert.ok(damage>high*1.8);}
});
test('pods are reachable examinables, grant once, persist; apothecary stock cheap and repeatable',()=>{
 const {fresh,dismiss}=require('./301-mornay-manifest.test'),{local}=require('./333-struck-entry-expedition.test');
 const g=fresh();g.run('debugMode=true');for(const [id,map,x,y]of [['pickup_fen_dart_seed','MAP3_N1',304,272],['pickup_basin_dart_seed','NORTH_BASIN_S_MAP',336,208]]){
  local(g,map,x,y);assert.ok(g.run(`WALKABLE[activeMap[${Math.floor(y/32)}][${Math.floor(x/32)}]]`));const n=g.run("stats.items.filter(i=>i.name==='Dart Seed').length");g.press(' ');dismiss(g);assert.equal(g.run("stats.items.filter(i=>i.name==='Dart Seed').length"),n+1);g.press(' ');dismiss(g);assert.equal(g.run("stats.items.filter(i=>i.name==='Dart Seed').length"),n+1);assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');assert.equal(g.run(`PICKUP_REGISTRY['${id}'].picked`),true);
 }
 assert.equal(g.run("MORNAY_SHOPS.apothecary.stock.find(i=>i.name==='Dart Seed').price"),4);assert.equal(g.run('SAVE_VERSION'),5);
});
module.exports={name:'Seed Dart: competing drafts, Lab/story isolation, balance and ordinary supply',run(){for(const t of tests){try{t.run();}catch(e){e.message=t.name+': '+e.message;throw e;}}console.log('  '+tests.length+' Seed Dart owner/supply groups passed');}};
