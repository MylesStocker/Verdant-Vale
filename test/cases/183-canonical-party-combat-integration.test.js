'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'canonicalPartyCombat.getView()');
const party=g=>J(g,'persistentParty.getView()');
function fresh(){const g=createContext();g.run(`dialogue.open=false;persistentParty.joinEsla();
 Math=Object.create(Math);var rolls=0;Math.random=()=>{rolls++;throw Error('unexpected RNG')};`);return g;}
function seed(g,changes){g.run('saveGame();var saved=JSON.parse(localStorage.getItem("verdantVale_save"));'+changes+
 ';localStorage.setItem("verdantVale_save",JSON.stringify(saved));');assert.equal(g.run('loadGame()'),true);}
const state=g=>g.run('JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.getView(),location:snapshotLocationState(),regional:regionalWorldPosition(),player,day,seq:combatEnemyInstanceSequence,combat,canonical:canonicalPartyCombat.getView()})');
function enter(g,ids=['enemy_marsh_wisp'],escape='fastest_living'){return J(g,'canonicalPartyCombat.enter('+JSON.stringify({enemies:ids,escape})+')');}
function input(g,key){return g.run('canonicalPartyCombat.handleInput('+JSON.stringify(key)+')');}
function command(g,name){let n=0;while(view(g).selectedCommand!==name){assert.ok(n++<6);input(g,'right');}input(g,'confirm');}
function attack(g){command(g,'attack');input(g,'confirm');}
function attacks(g){let n=0;while(view(g).phase==='awaiting_action'){assert.ok(n++<4);attack(g);}}
function resolve(g,mode='allies'){
 const v=view(g),a=v.party.filter(m=>m.hp>0).length,e=v.enemies.filter(m=>m.hp>0).length;
 const prefix=(a>1?e:0)+a+e-1;
 g.run('var draw=0;Math.random=()=>{rolls++;return '+(mode==='enemies'?'0.99':'draw++<'+prefix+'?0:0.5')+'};');
 input(g,'confirm');g.run('Math.random=()=>{rolls++;throw Error("unexpected RNG")};');
}
function acknowledge(g){let n=0;while(view(g).phase==='playback'){assert.ok(n++<150);input(g,'confirm');}assert.equal(view(g).phase,'playback_complete');input(g,'confirm');}
function finish(g){g.run('Math.random=()=>{rolls++;return 0.5};');return g.run('canonicalPartyCombat.finish()');}
function item(g,id,targetSlot){command(g,'item');let n=0;while(view(g).selectedItemId!==id){assert.ok(n++<70);input(g,'down');}input(g,'confirm');
 if(view(g).phase==='targeting'){if(targetSlot!==undefined){const target=view(g).party[targetSlot].instanceId;while(view(g).selectedTargetInstanceId!==target)input(g,'right');}input(g,'confirm');}}

test('one-member canonical roster keeps the exact singleton path, input and presentation; recruited ordinary encounters route to the party',()=>{
 const g=createContext();g.run('dialogue.open=false;Math=Object.create(Math);var rolls=0;Math.random=()=>{rolls++;return 0.5};startCombat();');
 assert.equal(g.run('combat.active'),true);assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('canonicalPartyCombat.isActive()'),false);
 assert.equal(g.run('rolls'),2);assert.equal(g.run('combat.mode'),'single');
 const h=fresh();h.run('Math.random=()=>{rolls++;return 0.99};startCombat()');assert.equal(view(h).active,true);assert.equal(h.run('rolls'),2);assert.equal(h.run('combat.active'),false);
 assert.deepEqual(view(h).party.map(m=>m.characterId),['lely','esla']);
});
test('unsupported world selection and pre-recruitment scripted encounters never install singleton gameplay state',()=>{
 const g=fresh();g.run('Math.random=()=>{rolls++;return 0};');const before=state(g);
 assert.throws(()=>g.run('startCombat()'),/invalid enemy arithmetic: enemy_23/);assert.equal(state(g),before);assert.equal(g.run('combatEnemyInstanceSequence'),0);
 for(const name of ['startFortGuardCombat','startFortPolwickCombat','startFortEssaCombat','startSeepSplitCombat']){
  const rolls=g.run('rolls');assert.throws(()=>g.run(name+'()'),/unsupported scripted encounter/);assert.equal(state(g),before);assert.equal(g.run('rolls'),rolls);
 }
});
test('authenticated completed singleton bookkeeping normalizes only after full party entry preflight',()=>{
 const g=createContext();g.run('dialogue.open=false;stats.atk=100;Math=Object.create(Math);Math.random=()=>0.5;startCombat();');g.frames(8);
 let n=0;while(g.run('combat.active')){assert.ok(n++<30);g.run('handleCombatAction()');}
 g.run('persistentParty.joinEsla()');assert.equal(g.run('combat.phase'),'victory');const before=state(g);
 assert.throws(()=>enter(g,['enemy_gallery_keeper']));assert.equal(state(g),before);enter(g);assert.equal(view(g).phase,'awaiting_action');
 assert.equal(g.run('combat.phase'),'choose');assert.equal(g.run('completedSingleVictoryReceipt'),null);
});
test('explicit boundary validates atomically, accepts exact one/two/three enemy groups and imports canonical state',()=>{
 for(const ids of [['enemy_marsh_wisp'],['enemy_marsh_wisp','enemy_briar_hound'],['enemy_marsh_wisp','enemy_marsh_wisp','enemy_briar_hound']]){
  const g=fresh();g.run('stats.weapon={...ITEM_REGISTRY["Iron Sword"]};statusEffects=["cursed"];');
  seed(g,'saved.party.characters[0].hp=17;saved.party.characters[0].statuses=["muddied"];saved.party.characters[0].equipment.shield="Iron Shield"');
  const before=party(g),v=enter(g,ids);assert.equal(g.run('rolls'),0);assert.equal(v.enemies.length,ids.length);
  assert.deepEqual(v.party.map(m=>[m.characterId,m.hp,m.statuses]),before.members.map(m=>[m.characterId,m.hp,m.statuses]));
  assert.equal(v.equipment[0].weapon,'Iron Sword');assert.equal(v.equipment[1].shield,'Iron Shield');assert.deepEqual(party(g),before);
  assert.deepEqual(v.resonance.map(m=>[m.characterId,m.rareBorn,m.strain]),[['lely',false,0],['esla',true,0]]);
  assert.equal(g.run('partyCombatLab.isActive()'),false);assert.equal(g.run('combat.active'),false);
 }
 const g=fresh();assert.ok(g.run('canonicalPartyCombat.enter({enemies:[{...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp}],escape:"blocked"})'));
});
test('unsupported capabilities, stale identities, malformed parties, unsafe arithmetic and cleanup reject before RNG or identities',()=>{
 for(const setup of ['', 'stats.atk=Number.MAX_SAFE_INTEGER','stats.gold=Number.MAX_SAFE_INTEGER','dialogue.open=true','debugMenu.open=true',
  'Object.defineProperty(combat,"cooldown",{writable:false})', 'Object.freeze(dialogue)',
  'ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.goldMin=0;ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.goldMax=Number.MAX_SAFE_INTEGER']){
  const g=fresh();g.run(setup);const before=state(g);assert.throws(()=>enter(g,setup?['enemy_marsh_wisp']:['enemy_gallery_keeper']));assert.equal(state(g),before);assert.equal(g.run('rolls'),0);
 }
 for(const request of [
  '{enemies:[],escape:"fastest_living"}',
  '{enemies:["enemy_marsh_wisp"],escape:"unknown"}',
  '{enemies:["enemy_gallery_receiver"],escape:"blocked"}',
  '{enemies:[{...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,regenPerTurn:1}],escape:"blocked"}',
  '{enemies:[{...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,instanceId:"combat_enemy_1",slot:0}],escape:"blocked"}',
  '{enemies:["enemy_marsh_wisp"],get escape(){throw Error("accessor")}}',
 ]){const g=fresh(),before=state(g);assert.throws(()=>g.run('canonicalPartyCombat.enter('+request+')'));assert.equal(state(g),before);assert.equal(g.run('rolls'),0);}
});
test('Attack victory writes each member once, grants full XP only to living members, shares gold/items once and saves cleanly',()=>{
 const g=fresh();g.run('stats.atk=100;');seed(g,'saved.party.characters[0].hp=0');
 const before=party(g);enter(g);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
 attacks(g);resolve(g);acknowledge(g);assert.equal(view(g).phase,'victory');assert.deepEqual(party(g),before);
 const historical=g.run('combatPlayerState.session.getView().playbackFrame');
 const receipt=finish(g);assert.equal(receipt.outcome,'victory');assert.equal(view(g).active,false);
 assert.deepEqual(party(g).members.map(m=>m.xp),[12,0]);assert.equal(party(g).gold,2);assert.equal(party(g).members[1].hp,0);
 assert.equal(party(g).inventory.length,0);assert.equal(g.run('persistentParty.serialize().rewards.length'),1);
 const after=state(g),rolls=g.run('rolls');assert.equal(g.run('canonicalPartyCombat.finish()'),false);input(g,'confirm');assert.equal(state(g),after);assert.equal(g.run('rolls'),rolls);
 assert.equal(historical.party[1].hp,0);assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
 assert.equal(g.run('SAVE_VERSION'),5);assert.doesNotMatch(g.run('localStorage.getItem("verdantVale_save")'),/combat_party_|combat_enemy_|playbackFrame|appliedRound/);
 const first=receipt.writeback;enter(g);assert.notEqual(view(g).party[0].instanceId,'combat_party_1');assert.equal(first.members[1].hp,0);
});
test('all enemies must fall before group victory; rewards are per encounter enemy, never per ally',()=>{
 const g=fresh();g.run('stats.atk=100;stats.def=100;');enter(g,['enemy_marsh_wisp','enemy_briar_hound']);
 attack(g);attack(g);resolve(g);acknowledge(g);assert.equal(view(g).phase,'awaiting_action');
 attacks(g);resolve(g);acknowledge(g);assert.equal(view(g).phase,'victory');finish(g);
 assert.deepEqual(party(g).members.map(m=>m.xp),[28,28]);assert.equal(party(g).gold,8);assert.equal(g.run('persistentParty.serialize().rewards.length'),1);
});
test('reward drops are shared once and full XP levels only living members through existing growth authorities',()=>{
 const g=fresh();g.run('stats.atk=1000;');seed(g,'saved.party.characters[0].hp=0');enter(g,['enemy_mulholland']);
 attacks(g);resolve(g);acknowledge(g);g.run('Math.random=()=>{rolls++;return 0}');g.run('canonicalPartyCombat.finish()');
 assert.deepEqual(party(g).members.map(m=>[m.level,m.xp]),[[2,180],[1,0]]);
 assert.deepEqual(party(g).inventory,['Potion']);assert.equal(party(g).gold,30);
 assert.equal(party(g).members[1].maxHp,30);assert.equal(party(g).members[1].atk,6);
 assert.equal(g.run('persistentParty.serialize().rewards.length'),1);
});
test('Item reservation, independent equipment/status ownership and completed consumption persist through escape',()=>{
 const g=fresh();g.run('stats.items=["Potion","Iron Shield","Reed Remedy"].map(id=>({...ITEM_REGISTRY[id]}));stats.hp=8;statusEffects=["cursed"];');
 seed(g,'saved.party.characters[0].statuses=["poison"]');enter(g);
 item(g,'Potion',0);assert.equal(view(g).reservedInventory.length,1);assert.equal(party(g).inventory.length,3);
 item(g,'Iron Shield');resolve(g);acknowledge(g);assert.ok(view(g).party[0].hp>8);assert.equal(view(g).equipment[1].shield,'Iron Shield');
 assert.equal(view(g).equipment[0].shield,null);assert.deepEqual(view(g).party[0].statuses,['cursed']);assert.deepEqual(view(g).party[1].statuses,['poison']);
 assert.deepEqual(party(g).inventory,['Potion','Iron Shield','Reed Remedy']);
 item(g,'Reed Remedy',1);command(g,'attack');input(g,'confirm');resolve(g);acknowledge(g);
 command(g,'run');command(g,'run');g.run('Math.random=()=>{rolls++;return 0}');input(g,'confirm');acknowledge(g);finish(g);
 assert.deepEqual(party(g).inventory,[]);assert.equal(party(g).members[1].equipment.shield,'Iron Shield');
 assert.equal(party(g).members[0].equipment.shield,null);assert.deepEqual(party(g).members[1].statuses,[]);
});
test('Lely Observe advances only the selected exact enemy instance',()=>{
 const g=fresh();enter(g,['enemy_marsh_wisp','enemy_marsh_wisp']);
 command(g,'observe');input(g,'right');input(g,'confirm');command(g,'attack');input(g,'confirm');resolve(g);
 acknowledge(g);assert.deepEqual(view(g).enemies.map(e=>e.observeCount),[0,1]);assert.deepEqual(party(g).members.map(m=>m.xp),[0,0]);
});
test('Quickbloom uses canonical Esla metadata, applies Strain once and clears after the following completed round',()=>{
 const g=fresh();g.run('stats.hp=15;stats.def=100;');enter(g);
 assert.ok(!view(g).commands.includes('resonance'));command(g,'observe');input(g,'confirm');
 assert.deepEqual(view(g).commands,['attack','resonance','item','run']);assert.ok(!view(g).commands.includes('observe'));command(g,'resonance');input(g,'confirm');input(g,'confirm');resolve(g);acknowledge(g);
 assert.equal(view(g).resonance[1].strain,1);assert.ok(view(g).party[0].hp>15);assert.equal(party(g).members[0].hp,15);
 command(g,'observe');input(g,'confirm');assert.ok(!view(g).enabledCommands.includes('resonance'));command(g,'attack');input(g,'confirm');resolve(g);acknowledge(g);
 assert.equal(view(g).resonance[1].strain,0);assert.deepEqual(J(g,'Object.keys(RESONANCE_TECHNIQUES)'),['quickbloom']);
});
test('successful Run preserves completed HP/items, no rewards; failed Run and boss/explicit locks remain in battle',()=>{
 const g=fresh();g.run('stats.hp=10;stats.items=[{...ITEM_REGISTRY.Potion}];');enter(g);
 item(g,'Potion',0);command(g,'run');resolve(g);acknowledge(g);
 // Use a guaranteed low run roll on the next round if the established speed
 // contest failed. Neither path refunds the completed potion.
 if(view(g).phase==='awaiting_action'){
  command(g,'run');command(g,'run');g.run('Math.random=()=>{rolls++;return 0};');input(g,'confirm');acknowledge(g);
 }
 assert.equal(view(g).phase,'escape');const hp=view(g).party.map(m=>m.hp);finish(g);
 assert.deepEqual(party(g).members.map(m=>m.hp),hp);assert.equal(party(g).inventory.length,0);assert.deepEqual(party(g).members.map(m=>m.xp),[0,0]);assert.equal(party(g).gold,0);
 for(const [ids,policy] of [[['enemy_marsh_wisp'],'fastest_living'],[['enemy_mulholland'],'fastest_living'],[['enemy_marsh_wisp'],'blocked']]){
  const h=fresh();enter(h,ids,policy);command(h,'run');command(h,'run');resolve(h,'enemies');acknowledge(h);assert.equal(view(h).phase,'awaiting_action');
 }
});
test('defeat requires every member Fallen, recovers the whole roster and applies world consequences exactly once',()=>{
 const g=fresh();g.run('stats.hp=1;stats.gold=20;');seed(g,'saved.party.characters[0].hp=1');enter(g,['enemy_mulholland']);
 const day=g.run('day');let rounds=0;
 while(view(g).phase==='awaiting_action'){
  assert.ok(rounds++<8);while(view(g).phase==='awaiting_action'){const actor=view(g).party.find(m=>m.instanceId===view(g).nextActorId);command(g,actor.characterId==='lely'?'observe':'attack');input(g,'confirm');}resolve(g,'enemies');acknowledge(g);
 }
 assert.equal(view(g).phase,'defeat');assert.ok(view(g).party.every(m=>m.hp===0));finish(g);
 assert.deepEqual(party(g).members.map(m=>m.hp),party(g).members.map(m=>m.maxHp));assert.equal(party(g).gold,0);assert.equal(g.run('day'),day+1);
 assert.equal(g.run('dialogue.open'),true);assert.deepEqual(party(g).members.map(m=>m.characterId),['lely','esla']);assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(g.run('day'),day+1);
});
test('unexpected resolver and reward failure retain evidence, consume RNG without retry and refuse save/load',()=>{
 for(const reward of [false,true]){
  const g=fresh();g.run('stats.atk=100');enter(g);attacks(g);
  if(reward){resolve(g);acknowledge(g);assert.throws(()=>g.run('canonicalPartyCombat.finish()'),/unexpected RNG/);}
  else assert.throws(()=>input(g,'confirm'),/unexpected RNG/);
  assert.equal(view(g).phase,'fault');assert.ok(view(g).diagnostic);const before=state(g),rolls=g.run('rolls');
  assert.equal(g.run('canonicalPartyCombat.finish()'),false);input(g,'confirm');g.run('update(0.1)');assert.equal(state(g),before);assert.equal(g.run('rolls'),rolls);
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
  assert.equal(g.run('partyCombatLab.enter("lely_esla_one")'),false);
  g.run('debugMenu.open=true');assert.equal(g.run('formationCombatLab.open()'),false);
 }
});
test('failed recovery destination retains a non-retryable diagnostic after one recovery consequence',()=>{
 const g=fresh();g.run('stats.hp=1;defeatWakeAtHome=true;');seed(g,'saved.party.characters[0].hp=0');enter(g,['enemy_mulholland']);
 command(g,'attack');input(g,'confirm');resolve(g,'enemies');acknowledge(g);assert.equal(view(g).phase,'defeat');
 const day=g.run('day');g.run('transitionToLocation=()=>false');assert.throws(()=>finish(g),/did not reach/);
 assert.equal(view(g).phase,'fault');assert.equal(view(g).diagnostic.stage,'recovery');assert.equal(g.run('day'),day+1);
 assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(g.run('day'),day+1);assert.equal(g.run('saveGame()'),false);
});
test('stale terminal enemy identities fault without writeback, rewards or retry',()=>{
 const g=fresh();g.run('stats.atk=100');enter(g);attacks(g);resolve(g);acknowledge(g);
 const before=party(g),rolls=g.run('rolls');g.run('combat.enemy=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp}');
 assert.throws(()=>g.run('canonicalPartyCombat.finish()'));assert.equal(view(g).phase,'fault');assert.equal(view(g).diagnostic.stage,'terminal_validation');
 assert.deepEqual(party(g),before);assert.equal(g.run('rolls'),rolls);assert.equal(g.run('canonicalPartyCombat.finish()'),false);
});
test('read-only shared renderer preserves Lab canvas output, positions and historical party HP',()=>{
 const g=fresh();enter(g);record(g);const before=state(g),v=view(g);g.run('paint=[];render()');const calls=J(g,'paint');assert.equal(state(g),before);assert.equal(g.run('rolls'),0);
 assert.deepEqual(J(g,'partyBattleLayout(canonicalPartyCombat.getView()).allies').map(p=>p.x),[108,256]);assert.ok(calls.length>0);
 const h=createContext();h.run('dialogue.open=false;partyCombatLab.enter("lely_esla_one")');record(h);
 h.run('paint=[];drawPartyCombatLabBattle()');const lab=J(h,'paint');h.run('paint=[];drawPartyBattle(partyCombatLab.getView())');assert.deepEqual(J(h,'paint'),lab);
});
test('one physical input latch, canonical/Lab/Receiver isolation and explicit caller authority',()=>{
 const g=fresh();enter(g);g.press('Enter');assert.equal(view(g).phase,'targeting');g.press('Enter');assert.equal(view(g).party[1].instanceId,view(g).nextActorId);
 assert.equal(g.run('partyCombatLab.enter("lely_esla_one")'),false);assert.equal(g.run('formationCombatLab.open()'),false);
 assert.throws(()=>g.run('persistentParty.joinEsla()'));assert.throws(()=>enter(g));
 const root=path.join(__dirname,'../..'),source=fs.readFileSync(path.join(root,'canonical-party-combat.js'),'utf8');
 assert.doesNotMatch(source,/partyCombatLab|PARTY_COMBAT_LAB|drawPartyCombatLab|\.emergencyAbort\(|endCombat\(|recoverCombatDefeat\(/);
 const shared=fs.readFileSync(path.join(root,'render-party-battle.js'),'utf8');assert.doesNotMatch(shared,/partyCombatLab|combatPlayerState|canonicalPartyCombat|Math\.random|\bstats\.|\bplayer\./);
 const scripts=scriptOrderFromIndexHtml();assert.ok(scripts.indexOf('persistent-party.js')<scripts.indexOf('canonical-party-combat.js'));
 assert.ok(scripts.indexOf('render-party-battle.js')<scripts.indexOf('render-party-combat-lab.js'));
});
module.exports={name:'canonical party combat integration: encounters, writeback, outcomes and isolation',checks,
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' canonical party integration checks passed');}};
