'use strict';
const assert=require('assert/strict');
const T=require('./341-great-fen-tactics.test');
const {createContext}=require('../harness');
const {fresh,openService,dismiss,J}=require('./301-mornay-manifest.test');
module.exports={name:'Serpentsmoke: Zolom-only escape, authenticated replay, ordinary locks, hidden shop and MQ5 lead',run(){
 for(const party of [false,true]){
  const g=T.fresh(['fen_zolom'],party,'stats.spd=1000;stats.items.push(createItem("Serpentsmoke"),createItem("Serpentsmoke"));');
  const before=J(g,'({gold:stats.gold,xp:stats.xp,quest:MainQuest})');
  // Ordinary Run remains boss-locked, even while carrying smoke.
  T.round(g,'run');assert.equal(J(g,'__fenResult.events.find(e=>e.type==="run").allowed'),false);T.ack(g);
  T.command(g,'item',0,'Serpentsmoke');if(party)T.command(g,'attack');const r=T.resolve(g);
  assert.equal(r.outcome,'escape');assert.equal(r.events.filter(e=>e.type==='item').length,1);
  assert.equal(r.after.enemies[0].hp,400);assert.equal(r.after.inventory.filter(i=>i==='Serpentsmoke').length,1);
  g.run('var smokeResult=copyFormationData('+JSON.stringify(r)+');Math.random=()=>{throw Error("replay must not roll")};var smokeReel=combatPlayerState.createRoundPlayback(smokeResult);for(let i=0;i<smokeReel.frameCount;i++)combatPlayerState.projectRoundPlaybackFrame(smokeReel,i);Math.random=()=>.5');
  g.run('var bad=fenCombat.clone(smokeResult);bad.events.find(e=>e.type==="item").itemId="Trollbane"');
  assert.throws(()=>g.run('combatPlayerState.createRoundPlayback(bad)'),/playback|authenticated/);
  T.ack(g);assert.equal(J(g,'canonicalPartyCombat.finish().rewards'),null);g.run('canonicalPartyCombat.finish()');
  assert.deepEqual(J(g,'({gold:stats.gold,xp:stats.xp,quest:MainQuest})'),before);
  assert.equal(g.run('stats.items.filter(i=>i.name==="Serpentsmoke").length'),1);
 }
 for(const ids of [['peatback'],['fen_zolom','peatback'],['peat_bed_maw']]){
  const g=T.fresh(ids,false,'stats.spd=1000;stats.items.push(createItem("Serpentsmoke"));');
  const r=T.round(g,'item',0,'Serpentsmoke');assert.equal(r.outcome,'ongoing');assert.ok(!r.after.inventory.includes('Serpentsmoke'));
 }
 // Legacy solo random dispatch: the same consumable, ordinary escape receipt.
 const solo=createContext();solo.press('Enter');solo.press('Enter');solo.run('dialogue.open=false;stats.hp=stats.maxHp=1000;stats.items=[createItem("Serpentsmoke")];Math=Object.create(Math);Math.random=()=>.5;transitionToLocation({mapId:"EASTERN_FENS_ENVELOPE_C7R0_MAP",x:240,y:336,state:{}});startCombat();');
 assert.equal(solo.run('combat.enemy.id'),'enemy_fen_zolom');const baseline=J(solo,'({gold:stats.gold,xp:stats.xp})');
 solo.frames(9);solo.press('ArrowRight');solo.press('Enter');assert.equal(solo.run('combat.phase'),'item');solo.press('Enter');assert.equal(solo.run('combat.pendingEscape'),true);solo.press('Enter');
 assert.equal(solo.run('combat.active'),false);assert.equal(solo.run('stats.items.length'),0);assert.deepEqual(J(solo,'({gold:stats.gold,xp:stats.xp})'),baseline);
 // Legacy Formation rejects Zolom templates; smoke must remain a consumed no-op
 // in its approved encounters and replay must preserve that result.
 const formation=createContext();formation.run('dialogue.open=false;menu.open=false;stats.hp=stats.maxHp=1000;stats.spd=1000;stats.items=[createItem("Serpentsmoke")];initializeFormationState([{enemyId:"enemy_marsh_wisp",slot:0},{enemyId:"enemy_marsh_wisp",slot:1}],{escape:"fastest_living"});var smoke=resolveFormationRound({type:"item",itemId:"Serpentsmoke",targetInstanceId:combat.enemies[0].instanceId});Math=Object.create(Math);Math.random=()=>{throw Error("replay RNG")};var reel=createFormationRoundPlayback(smoke);');
 assert.equal(formation.run('smoke.outcome'),'ongoing');assert.equal(formation.run('stats.items.length'),0);
 // Hidden stock uses the ordinary keeper, payment, inventory and save authorities.
 const shop=fresh();shop.run('MainQuest=5;stats.gold=60;');
 const pages=J(shop,'MORNAY_NPCS.find(n=>n.id==="mornay_messa_yule").dialogue').flat().join(' ');
 assert.match(pages,/Henric.*upstairs.*Sorn Work Gear.*Central West.*Serpentsmoke/);
 const flags=shop.run('JSON.stringify(Object.fromEntries(QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])))');
 openService(shop,'hidden_supplies');assert.equal(shop.run('shop.open'),true);shop.press('Enter');shop.press('Enter');
 assert.equal(shop.run('stats.gold'),0);assert.equal(shop.run('stats.items.filter(i=>i.name==="Serpentsmoke").length'),1);shop.press('Enter');assert.equal(shop.run('stats.items.length'),1);
 shop.press('Escape');shop.press('Escape');assert.equal(shop.run('saveGame()&&loadGame()'),true);dismiss(shop);
 assert.equal(shop.run('stats.items[0].escapeEnemyId'),'enemy_fen_zolom');assert.equal(shop.run('JSON.stringify(Object.fromEntries(QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])))'),flags);assert.equal(shop.run('SAVE_VERSION'),5);
}};
