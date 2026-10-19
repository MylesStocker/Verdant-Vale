'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const equal=(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
function fresh(){const g=createContext();g.run('dialogue.open=false;Math=Object.create(Math);var rolls=0;Math.random=()=>{rolls++;throw Error("unexpected RNG");};');return g;}
const view=g=>J(g,'persistentParty.getView()');
const state=g=>g.run('JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.getView(),payload:persistentParty.serialize(),seq:combatEnemyInstanceSequence,round:combatPlayerState.getRoundView(),enemies:combat.enemies,location:snapshotLocationState(),player,day,tick,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem("verdantVale_save")})');
function reject(g,source){const before=state(g),rolls=g.run('rolls');assert.throws(()=>g.run(source));assert.equal(state(g),before);assert.equal(g.run('rolls'),rolls);}
function frozen(value){if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));for(const d of Object.values(Object.getOwnPropertyDescriptors(value))){assert.ok('value'in d);frozen(d.value);}}}
function seed(g,{hp,eslaHp,statuses,equipment,inventory}={}){
 g.run('saveGame();var saved=JSON.parse(localStorage.getItem("verdantVale_save"));');
 if(hp!==undefined)g.run('saved.stats.hp='+hp);
 if(eslaHp!==undefined)g.run('saved.party.characters[0].hp='+eslaHp);
 if(statuses)g.run('saved.party.characters[0].statuses='+JSON.stringify(statuses));
 if(equipment)g.run('saved.party.characters[0].equipment='+JSON.stringify(equipment));
 if(inventory)g.run('saved.stats.items='+JSON.stringify(inventory)+'.map(id=>({...ITEM_REGISTRY[id]}));');
 assert.equal(g.run('localStorage.setItem("verdantVale_save",JSON.stringify(saved));loadGame()'),true);
}
function begin(g,enemies=['enemy_marsh_wisp']){return g.run('persistentParty.beginCombat('+JSON.stringify(enemies)+')');}
function attacks(g){while(g.run('combatPlayerState.session.getView().phase')==='awaiting_action')g.run('combatPlayerState.session.confirmCommand();combatPlayerState.session.confirmTarget();');}
function resolve(g,roll=0.5){const v=g.run('combatPlayerState.session.getView()'),a=v.party.filter(m=>m.hp>0).length,e=v.enemies.filter(m=>m.hp>0).length;
 const prefix=(a>1?e:0)+a+e-1;g.run('var draws=0;Math.random=()=>{rolls++;return draws++<'+prefix+'?0:'+roll+'};combatPlayerState.session.commitRound();Math.random=()=>{rolls++;throw Error("unexpected RNG")};');}
function acknowledge(g){while(g.run('combatPlayerState.session.getView().phase')==='playback')g.run('combatPlayerState.session.advancePlayback()');g.run('combatPlayerState.session.acknowledgePlayback()');}
function chooseItem(g,id,target){g.run('combatPlayerState.session.moveCommand("next");combatPlayerState.session.confirmCommand()');let n=0;while(g.run('combatPlayerState.session.getView().selectedItemId')!==id){assert.ok(n++<60);g.run('combatPlayerState.session.moveItem("next")');}g.run('combatPlayerState.session.confirmItem()');if(g.run('combatPlayerState.session.getView().phase')==='targeting'){if(target)while(g.run('combatPlayerState.session.getView().selectedTargetInstanceId')!==target)g.run('combatPlayerState.session.moveTarget("next")');g.run('combatPlayerState.session.confirmTarget()');}}

test('new game is Lely-only; immutable adapters read the one canonical Lely authority',()=>{
 const g=fresh(),before=g.run('JSON.stringify(stats)');equal(view(g).members.map(m=>m.characterId),['lely']);frozen(g.run('persistentParty.getView()'));
 g.run('stats.hp=7;stats.level=5;stats.xp=800;stats.atk=99;statusEffects=["cursed"];');
 assert.equal(view(g).members[0].hp,7);assert.equal(view(g).members[0].atk,99);equal(view(g).members[0].statuses,['cursed']);
 const v=g.run('persistentParty.getView()');assert.throws(()=>{v.members[0].hp=0});assert.equal(g.run('stats.hp'),7);
 assert.equal(g.run('persistentParty.getMember("unknown")'),null);assert.equal(g.run('combatEnemyInstanceSequence'),0);assert.equal(g.run('rolls'),0);
});
test('Esla joins once at current level with independent authored growth and empty gear',()=>{
 const g=fresh();g.run('stats.level=5;stats.xp=900;stats.atk=77;stats.def=99;stats.spd=45;var before=JSON.stringify(stats);persistentParty.joinEsla();');
 const e=view(g).members[1];equal([e.level,e.xp,e.hp,e.maxHp,e.atk,e.def,e.spd],[5,800,50,50,10,4,8]);
 equal(Object.values(e.equipment),[null,null,null,null]);assert.equal(g.run('JSON.stringify(stats)===before'),true);
 const before=state(g);g.run('persistentParty.joinEsla()');assert.equal(state(g),before);reject(g,'persistentParty.joinEsla("unknown")');
 assert.equal(g.run('rolls'),0);assert.equal(g.run('combatEnemyInstanceSequence'),0);
});
test('full independent XP, KO retention, single shared reward grant and save-backed deduplication',()=>{
 const g=fresh();g.run('persistentParty.joinEsla()');seed(g,{eslaHp:0});g.run('Math.random=()=>{rolls++;return 0.5};');
 const r=g.run('persistentParty.awardRewards({id:"fixture_reward",xp:100,gold:17,items:["Potion"]})');
 assert.equal(r.applied,true);frozen(r);const v=view(g);equal(v.members.map(m=>[m.level,m.xp]),[[2,100],[2,100]]);assert.equal(v.members[1].hp,0);
 equal([v.members[0].maxHp,v.members[0].atk,v.members[1].maxHp,v.members[1].atk],[40,10,35,7]);assert.equal(g.run('rolls'),3);
 const before=state(g);assert.equal(g.run('persistentParty.awardRewards({id:"fixture_reward",xp:100,gold:17,items:["Potion"]}).applied'),false);assert.equal(state(g),before);
 reject(g,'persistentParty.awardRewards({id:"fixture_reward",xp:101,gold:17,items:["Potion"]})');
 g.run('saveGame();loadGame()');assert.equal(g.run('persistentParty.awardRewards({id:"fixture_reward",xp:100,gold:17,items:["Potion"]}).applied'),false);
 assert.equal(view(g).gold,17);equal(view(g).inventory,['Potion']);
});
test('invalid rewards fail before RNG or mutation, including getters and unsafe arithmetic',()=>{
 const g=fresh();for(const s of ['{id:"x",xp:-1,gold:0,items:[]}','{id:"x",xp:Infinity,gold:0,items:[]}',
 '{id:"x",xp:0,gold:0,items:["missing"]}','{id:"x",xp:0,gold:0,items:[],extra:1}',
 '{get id(){throw Error("getter")},xp:0,gold:0,items:[]}','Object.create({id:"x",xp:0,gold:0,items:[]})'])reject(g,'persistentParty.awardRewards('+s+')');
 g.run('stats.xp=Number.MAX_SAFE_INTEGER');reject(g,'persistentParty.awardExperience("x",1)');
});
test('recovery restores all HP, clears ordinary removable statuses, retains gear/resources',()=>{
 const g=fresh();g.run('persistentParty.joinEsla();stats.hp=0;statusEffects=["poison","cursed","slither","muddied"];');seed(g,{hp:0,eslaHp:0,statuses:['poison','slither','cursed','burn','dazzled']});
 assert.equal(view(g).defeated,true);equal(view(g).members.map(m=>m.slot),[0,1]);g.run('persistentParty.recover()');
 assert.equal(view(g).defeated,false);equal(view(g).members.map(m=>m.hp),[30,30]);equal(view(g).members.map(m=>m.statuses),[[],[]]);assert.equal(g.run('rolls'),0);
});
test('version 5 round trip contains only persistent identities and restores exact personal ownership',()=>{
 const g=fresh();g.run('persistentParty.joinEsla();stats.weapon={...ITEM_REGISTRY["Iron Sword"]};stats.items=[{...ITEM_REGISTRY.Potion}];statusEffects=["slither"];slitherSpd=13;');
 seed(g,{eslaHp:17,statuses:['slither'],equipment:{weapon:null,armor:null,shield:'Iron Shield',accessory:null}});
 const before=view(g);g.run('saveGame();var raw=localStorage.getItem("verdantVale_save");persistentParty.resetForNewGame();stats.hp=1;');
 assert.equal(g.run('loadGame()'),true);equal(view(g),before);assert.equal(g.run('SAVE_VERSION'),5);assert.equal(g.run('rolls'),0);assert.equal(g.run('combatEnemyInstanceSequence'),0);
 const saved=JSON.parse(g.run('raw'));equal(saved.party.order,['lely','esla']);assert.equal(saved.party.characters.length,1);assert.equal(saved.party.characters[0].characterId,'esla');
 assert.equal(saved.slitherSpd,13);assert.ok(!/instanceId|combat_party_|combat_enemy_|playback|commandSet/.test(JSON.stringify(saved.party)));
});
test('invalid party saves, old versions and membership replacement reject atomically before any load writers',()=>{
 const g=fresh();g.run('persistentParty.joinEsla();saveGame();var valid=localStorage.getItem("verdantVale_save")');
 const changes=['d.version=4','delete d.party','d.party.extra=1','d.party.order=["esla","lely"]','d.party.order=["lely","esla","esla"]',
 'd.party.order=["lely","missing"]','d.party.order=["lely","esla","x","y"]','d.party.characters[0].hp=-1',
 'd.party.characters[0].atk=999','d.party.characters[0].statuses=["unknown"]','d.party.characters[0].equipment.weapon="Potion"',
 'd.party.characters[0].instanceId="combat_party_1"','d.stats.hp=Infinity','d.slitherSpd=0'];
 for(const edit of changes){g.run('var d=JSON.parse(valid);'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');const before=state(g);assert.equal(g.run('loadGame()'),false,edit);assert.equal(state(g),before,edit);}
 assert.equal(g.run('rolls'),0);
});
test('new-game roster reset discards recruitment and award ledger without duplicating Lely',()=>{
 const g=fresh();g.run('persistentParty.joinEsla();persistentParty.awardExperience("fixture",0);var before=JSON.stringify(stats);persistentParty.resetForNewGame();');
 equal(view(g).members.map(m=>m.characterId),['lely']);equal(J(g,'persistentParty.serialize().rewards'),[]);assert.equal(g.run('JSON.stringify(stats)===before'),true);
});
test('detached combat preparation, initial equipment and statuses, supported groups, fresh IDs',()=>{
 for(const ids of [['enemy_marsh_wisp'],['enemy_marsh_wisp','enemy_briar_hound'],['enemy_marsh_wisp','enemy_marsh_wisp','enemy_briar_hound']]){
  const g=fresh();g.run('persistentParty.joinEsla();stats.weapon={...ITEM_REGISTRY["Iron Sword"]};stats.items=[{...ITEM_REGISTRY.Potion}];statusEffects=["slither"];slitherSpd=9');
  const s=g.run('persistentParty.combatSnapshot()');frozen(s);assert.equal(s.equipment[0].weapon,'Iron Sword');assert.equal(s.members[0].atk,8);
  const canonical=g.run('JSON.stringify({stats,statusEffects,slitherSpd})');const b=begin(g,ids);equal(b.party.map(m=>m.characterId),['lely','esla']);assert.equal(b.party[0].effective.atk,12);
  assert.equal(g.run('JSON.stringify({stats,statusEffects,slitherSpd})'),canonical);assert.equal(g.run('rolls'),0);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
 }
});
test('invalid enemy/preparation input consumes no identities, RNG or mutation',()=>{
 const g=fresh();for(const code of ['[]','["enemy_gallery_receiver"]','["enemy_23"]','["missing"]','["enemy_stone_crawler","enemy_marsh_wisp"]','["enemy_marsh_wisp","enemy_marsh_wisp","enemy_marsh_wisp","enemy_marsh_wisp"]','Object.create([])'])reject(g,'persistentParty.beginCombat('+code+')');
 g.run('stats.atk=Number.MAX_SAFE_INTEGER');reject(g,'persistentParty.beginCombat(["enemy_marsh_wisp"])');
});
test('authentic victory requires final acknowledgement, commits once, revives KOs to one and preserves survivors',()=>{
 const g=fresh();g.run('persistentParty.joinEsla();stats.atk=100');seed(g,{eslaHp:0});const before=g.run('JSON.stringify(stats)');begin(g);attacks(g);resolve(g);assert.equal(g.run('JSON.stringify(stats)'),before);
 assert.throws(()=>g.run('persistentParty.commitCombat()'));while(g.run('combatPlayerState.session.getView().phase')==='playback')g.run('combatPlayerState.session.advancePlayback()');assert.throws(()=>g.run('persistentParty.commitCombat()'));
 g.run('combatPlayerState.session.acknowledgePlayback()');const rolls=g.run('rolls'),result=g.run('persistentParty.commitCombat()');assert.equal(result.outcome,'victory');equal(view(g).members.map(m=>m.hp),[30,1]);assert.equal(g.run('rolls'),rolls);assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('combat.mode'),null);
 reject(g,'persistentParty.commitCombat()');const v=begin(g);assert.equal(v.party[0].instanceId,'combat_party_3');assert.equal(v.enemies[0].instanceId,'combat_enemy_2');
});
test('canonical Lely may start knocked out; the living ally owns the action and wins',()=>{
 const g=fresh();g.run('stats.level=20;persistentParty.joinEsla();stats.hp=0');begin(g);attacks(g);resolve(g);acknowledge(g);const r=g.run('persistentParty.commitCombat()');assert.equal(r.outcome,'victory');assert.equal(g.run('stats.hp'),1);
});
test('shared item consumption and personal equipment commit once, key items survive',()=>{
 const g=fresh();g.run('persistentParty.joinEsla();stats.atk=100;stats.items=[{...ITEM_REGISTRY["Iron Sword"]},{...ITEM_REGISTRY.Potion},{...Object.values(ITEM_REGISTRY).find(i=>i.keyItem)}];stats.hp=10;');
 begin(g);chooseItem(g,'Potion');chooseItem(g,'Iron Sword');resolve(g);acknowledge(g);assert.equal(g.run('stats.hp'),10);assert.equal(g.run('stats.items.length'),3);
 attacks(g);resolve(g);acknowledge(g);g.run('persistentParty.commitCombat()');const v=view(g);assert.equal(v.members[0].equipment.weapon,null);assert.equal(v.members[1].equipment.weapon,'Iron Sword');assert.equal(v.inventory.length,1);assert.equal(g.run('stats.items[0].keyItem'),true);
});
test('equipment exchange returns the old personal item to shared inventory once',()=>{
 const g=fresh();g.run('persistentParty.joinEsla();stats.atk=100;stats.weapon={...ITEM_REGISTRY["Bronze Knife"]};stats.items=[{...ITEM_REGISTRY["Iron Sword"]}];');
 begin(g);chooseItem(g,'Iron Sword');attacks(g);resolve(g);acknowledge(g);
 if(g.run('combatPlayerState.session.getView().phase')==='awaiting_action'){attacks(g);resolve(g);acknowledge(g);}
 g.run('persistentParty.commitCombat()');assert.equal(view(g).members[0].equipment.weapon,'Iron Sword');assert.equal(view(g).members[1].equipment.weapon,null);equal(view(g).inventory,['Bronze Knife']);
});
test('escape and defeat commit exact HP with no victory revival or rewards',()=>{
 const escape=fresh();escape.run('persistentParty.joinEsla();combatPlayerState.session;');begin(escape);
 for(let i=0;i<2;i++)escape.run('combatPlayerState.session.moveCommand("previous");combatPlayerState.session.confirmCommand()');resolve(escape,0);acknowledge(escape);assert.equal(escape.run('persistentParty.commitCombat().outcome'),'escape');equal(view(escape).members.map(m=>m.hp),[30,30]);assert.equal(view(escape).gold,0);
 const defeat=fresh();defeat.run('persistentParty.joinEsla()');seed(defeat,{hp:1,eslaHp:1});begin(defeat,['enemy_mulholland']);
 let n=0;while(!['defeat','victory'].includes(defeat.run('combatPlayerState.session.getView().phase'))){assert.ok(n++<10);attacks(defeat);resolve(defeat,0.6);acknowledge(defeat);}
 assert.equal(defeat.run('persistentParty.commitCombat().outcome'),'defeat');assert.equal(view(defeat).defeated,true);assert.equal(view(defeat).gold,0);
});
test('stale canonical state, substituted runtime members, caller results and Lab histories cannot commit',()=>{
 const g=fresh();g.run('stats.atk=100');begin(g);attacks(g);resolve(g);acknowledge(g);g.run('stats.gold=1');const before=g.run('JSON.stringify(stats)');assert.throws(()=>g.run('persistentParty.commitCombat()'));assert.equal(g.run('JSON.stringify(stats)'),before);
 const altered=fresh();altered.run('stats.atk=100');begin(altered);attacks(altered);resolve(altered);acknowledge(altered);assert.throws(()=>altered.run('persistentParty.commitCombat({outcome:"victory"})'));altered.run('combat.enemy=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp}');assert.throws(()=>altered.run('persistentParty.commitCombat()'));
 const lab=fresh();assert.ok(lab.run('partyCombatLab.enter("lely_esla_one")'));assert.throws(()=>lab.run('persistentParty.commitCombat()'));assert.throws(()=>lab.run('persistentParty.beginCombat(["enemy_marsh_wisp"])'));
});
test('private bridge capability cannot be reclaimed; only MQ5 recruits and canonical encounter owner finalizes',()=>{
 const g=fresh();reject(g,'combatPlayerState.claimPersistentBridge()');
 const scripts=scriptOrderFromIndexHtml();for(const file of scripts){const src=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');assert.equal(/persistentParty\.(beginCombat|commitCombat|awardRewards|awardExperience|recover|resetForNewGame)\s*\(/.test(src),file==='canonical-party-combat.js',file);assert.equal((src.match(/persistentParty\.joinEsla\s*\(/g)||[]).length,file==='quests.js'?1:0,file);}
 assert.equal(g.run('SAVE_VERSION'),5);
});
test('future third-slot capacity uses an authored test fixture, never a production character',()=>{
 const read=fs.readFileSync;let g;
 try {fs.readFileSync=function(file,...args){let source=read.call(this,file,...args);
  if(String(file).endsWith('/persistent-party.js'))source=source.replace("  lely:Object.freeze", "  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture',progression:Object.freeze({hpBase:20,hpPerLevel:2,atkBase:4,atkPerLevel:1,defBase:1,defEveryLevels:2,spdBase:5,spdEveryLevels:2})}),\n  lely:Object.freeze");
  return source;};g=fresh();}finally{fs.readFileSync=read;}
 g.run('persistentParty.joinEsla();saveGame();var d=JSON.parse(localStorage.getItem("verdantVale_save"));d.party.order.push("fixture_third");d.party.characters.push({characterId:"fixture_third",hp:20,maxHp:20,atk:4,def:1,spd:5,level:1,xp:0,statuses:[],equipment:{weapon:null,armor:null,shield:null,accessory:null},slitherSpeed:1});localStorage.setItem("verdantVale_save",JSON.stringify(d));');
 assert.equal(g.run('loadGame()'),true);equal(view(g).members.map(m=>m.slot),[0,1,2]);
 g.run('Math.random=()=>{rolls++;return 0.5};persistentParty.awardExperience("three",100)');equal(view(g).members.map(m=>m.level),[2,2,2]);
 assert.equal(view(g).members[2].maxHp,22);g.run('stats.atk=100');begin(g,['enemy_marsh_wisp','enemy_marsh_wisp','enemy_marsh_wisp']);
 let rounds=0;while(g.run('combatPlayerState.session.getView().phase')==='awaiting_action'){assert.ok(rounds++<6);attacks(g);resolve(g);acknowledge(g);}
 assert.equal(g.run('persistentParty.commitCombat().outcome'),'victory');equal(view(g).members.map(m=>m.slot),[0,1,2]);
});
test('cure and retained Slither sample commit to the exact personal owner without rewards',()=>{
 const g=fresh();g.run('persistentParty.joinEsla();stats.atk=100;stats.items=[{...ITEM_REGISTRY["Amethyst Dust"]}];statusEffects=["slither"];slitherSpd=17');
 seed(g,{statuses:['cursed']});begin(g);const esla=g.run('combatPlayerState.session.getView().party[1].instanceId');chooseItem(g,'Amethyst Dust',esla);attacks(g);resolve(g);acknowledge(g);
 if(g.run('combatPlayerState.session.getView().phase')==='awaiting_action'){attacks(g);resolve(g);acknowledge(g);}
 const end=g.run('combatPlayerState.session.getView()');g.run('persistentParty.commitCombat()');
 equal(view(g).members[1].statuses,[]);assert.equal(view(g).gold,0);assert.equal(g.run('slitherSpd'),end.effects[0].slither.speed);
});
test('combat-only Dazzled ends at persistent commitment just as at singleton cleanup',()=>{
 const g=fresh();g.run('stats.atk=100;statusEffects=["dazzled"]');begin(g);attacks(g);resolve(g);acknowledge(g);g.run('persistentParty.commitCombat()');equal(view(g).members[0].statuses,[]);
});
test('malformed final runtime HP and read-only canonical ownership cannot partially commit',()=>{
 const g=fresh();g.run('stats.atk=100');begin(g);attacks(g);resolve(g);acknowledge(g);const before=g.run('JSON.stringify(stats)');
 g.run('combat.enemies[0].hp=NaN');assert.throws(()=>g.run('persistentParty.commitCombat()'));assert.equal(g.run('JSON.stringify(stats)'),before);assert.equal(g.run('persistentParty.isCombatPending()'),true);
 const locked=fresh();locked.run('stats.atk=100');begin(locked);attacks(locked);resolve(locked);acknowledge(locked);locked.run('Object.defineProperty(stats,"hp",{writable:false})');
 assert.throws(()=>locked.run('persistentParty.commitCombat()'));assert.equal(locked.run('combatPlayerState.hasParty()'),true);
});
test('a host RNG failure during valid XP retains evidence and blocks duplicate retry',()=>{
 const g=fresh();assert.throws(()=>g.run('persistentParty.awardExperience("fault",100)'));const before=g.run('JSON.stringify(stats)'),rolls=g.run('rolls');
 assert.throws(()=>g.run('persistentParty.awardExperience("fault",100)'));assert.equal(g.run('JSON.stringify(stats)'),before);assert.equal(g.run('rolls'),rolls);assert.equal(g.run('persistentParty.getCombatDiagnostic().stage'),'lely_level_up');
});
module.exports={name:'persistent party lifecycle: canonical ownership, save v5 and authentic combat commitment',run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' persistent-party checks passed');}};
