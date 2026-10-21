'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'canonicalPartyCombat.getView()');
const party=g=>J(g,'persistentParty.getView()');
const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}};
// Authored third member exists only inside this isolated VM. No production
// membership, save schema, sprite, progression or registry extension is added.
function fresh(n=2){
 const read=fs.readFileSync;let g;
 try{
  fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);
   if(String(file).endsWith('/persistent-party.js')&&n===3)s=s.replace('  lely:Object.freeze',
    "  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture third',rareBorn:false,affinity:null,progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),\n  lely:Object.freeze");
   // Observe the authentic controller result without replacing its execution,
   // validation or playback. This test-only reference never writes game state.
   if(String(file).endsWith('/combat.js'))s=s.replace("stage='playback';const playback=combatPlayerState.createRoundPlayback(result)",
    "stage='playback';window.__envelopeResult=result;const playback=combatPlayerState.createRoundPlayback(result)");
   return s;
  };
  g=createContext();
 }finally{fs.readFileSync=read;}
 g.run(`dialogue.open=false;${n>1?'persistentParty.joinEsla();':''}
  Math=Object.create(Math);var rolls=0;Math.random=()=>{rolls++;throw Error('unexpected RNG')};`);
 if(n===3)seed(g,'saved.party.order.push("fixture_third");saved.party.characters.push({...saved.party.characters[0],characterId:"fixture_third"})');
 g.run('stats.def=100;');return g;
}
function seed(g,changes){g.run('saveGame();var saved=JSON.parse(localStorage.getItem("verdantVale_save"));'+changes+
 ';localStorage.setItem("verdantVale_save",JSON.stringify(saved));');assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');}
const state=g=>g.run('JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.getView(),runtime:combatPlayerState.getView(),round:combatPlayerState.getRoundView(),session:combatPlayerState.session.getView(),canonical:canonicalPartyCombat.getView(),combat:{data:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([k,d])=>Object.hasOwn(d,"value")).map(([k,d])=>[k,d.value])),mode:combat.mode,active:combat.active,enemies:combat.enemies},seq:combatEnemyInstanceSequence,location:snapshotLocationState(),regional:regionalWorldPosition(),player,day,tick,dialogue,choice,flags:Object.fromEntries(QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])),save:localStorage.getItem("verdantVale_save")})');
function reject(g,source){const before=state(g),rolls=g.run('rolls');assert.throws(()=>g.run(source));assert.equal(state(g),before);assert.equal(g.run('rolls'),rolls);}
const enemies=n=>Array(n).fill('enemy_marsh_wisp');
function enter(g,n=1,escape='fastest_living'){return J(g,'canonicalPartyCombat.enter('+JSON.stringify({enemies:enemies(n),escape})+')');}
const input=(g,key)=>g.run('canonicalPartyCombat.handleInput('+JSON.stringify(key)+')');
function command(g,name){let limit=0;while(view(g).selectedCommand!==name){assert.ok(limit++<6,name+' must be enabled');input(g,'right');}input(g,'confirm');}
function target(g,slot=0){const v=view(g),id=(v.targetSide==='ally'?v.party:v.enemies)[slot].instanceId;let limit=0;
 while(view(g).selectedTargetInstanceId!==id){assert.ok(limit++<4);input(g,'right');}input(g,'confirm');}
function draft(g,name='observe',slot){command(g,name);if(view(g).phase==='targeting')target(g,slot??view(g).enemies.find(m=>m.hp>0).slot);}
function fill(g,name='observe'){let limit=0;while(view(g).phase==='awaiting_action'){assert.ok(limit++<4);draft(g,name);}}
function item(g,id,slot=0){command(g,'item');let limit=0;while(view(g).selectedItemId!==id){assert.ok(limit++<60);input(g,'down');}input(g,'confirm');if(view(g).phase==='targeting')target(g,slot);}
function resolve(g,{targetRoll=0,order='allies',runRoll=.5}={}){
 const v=view(g),allies=v.party.filter(m=>m.hp>0),enemy=v.enemies.filter(m=>m.hp>0),draws=allies.length+enemy.length-1;
 const targets=allies.length>1?enemy.length:0;
 g.run(`var used=[];Math.random=()=>{const i=used.length,r=i<${targets}?${targetRoll}:i<${targets+draws}?${order==='enemies'?'.999999':'0'}:${runRoll};used.push(r);rolls++;return r;};`);
 input(g,'confirm');g.run('Math.random=()=>{rolls++;throw Error("unexpected RNG")};');
 const r=J(g,'__envelopeResult');frozen(g.run('__envelopeResult'));assert.equal(r.initiative.length,draws);
 assert.deepEqual(r.initiative.map(d=>d.roll),Array(draws).fill(order==='enemies'?.999999:0));
 return r;
}
function acknowledge(g){const frames=[];let limit=0;while(view(g).phase==='playback'){
 assert.ok(limit++<180);frames.push(g.run('combatPlayerState.session.getView().playbackFrame'));input(g,'confirm');}
 assert.equal(view(g).phase,'playback_complete');frames.push(g.run('combatPlayerState.session.getView().playbackFrame'));input(g,'confirm');return frames;
}
function finish(g){g.run('Math.random=()=>{rolls++;return .5};');return g.run('canonicalPartyCombat.finish()');}
const formation=(id,ids,weight=1)=>'Object.freeze({id:'+JSON.stringify(id)+',enemies:Object.freeze('+JSON.stringify(ids)+'),weight:'+weight+'})';


// Exhaust the actual static ordinary-template envelope, not a hand-maintained
// compatibility sample. Generated records and lifecycle owners have separate
// authentication tests; they are deliberately not forged into this enumeration.
test('every static ordinary formation up to three slots prepares for every party size without RNG, IDs or mutation',()=>{
 let total=0;
 for(const count of [1,2,3]){
  const g=fresh(count),before=state(g);
  const report=J(g,`(()=>{const ids=Object.values(ENEMY_TEMPLATE_REGISTRY).filter(t=>!t.inline&&canonicalEnemyIsCompatible(t)&&
   !enemyCapabilityMetadata(t).capabilities.some(c=>CANONICAL_SCRIPTED_LIFECYCLE_CAPABILITIES.includes(c))).map(t=>t.id);
   let cases=0;const verify=ids=>{try{const p=canonicalPartyCombat.prepare({enemies:ids,escape:'fastest_living'});
    if(p.playerSide.members.length!==${count}||p.enemySide.ids.join()!==ids.join())throw Error('side mismatch');cases++;
   }catch(e){throw Error(ids.join(',')+': '+e.message);}};
   for(let a=0;a<ids.length;a++){verify([ids[a]]);for(let b=a;b<ids.length;b++){verify([ids[a],ids[b]]);
    for(let c=b;c<ids.length;c++)verify([ids[a],ids[b],ids[c]]);}}
   return {templates:ids.length,cases};})()`);
  assert.equal(report.templates,51);assert.equal(report.cases,24803);total+=report.cases;
  assert.equal(state(g),before);assert.equal(g.run('rolls'),0);assert.equal(g.run('combatEnemyInstanceSequence'),0);
 }
 assert.equal(total,74409);console.log('  74,409 complete immutable ordinary-formation preparations');
});
test('all registered pools normalize unchanged and contain only ordinary supported templates; no Eastern Fens pool',()=>{
 const g=fresh();assert.equal(g.run('Object.keys(ENEMY_TEMPLATE_REGISTRY).length'),70);
 const report=J(g,`ENEMY_TEMPLATE_POOLS.map(p=>({name:p.name,ids:p.templates.map(t=>t.id),ok:p.templates.every(t=>canonicalEnemyIsCompatible(t)&&
 !enemyCapabilityMetadata(t).capabilities.some(c=>CANONICAL_SCRIPTED_LIFECYCLE_CAPABILITIES.includes(c)))}))`);
 assert.ok(report.length>0);assert.ok(report.every(p=>p.ok));
 g.run('for(const p of ENEMY_TEMPLATE_POOLS)encounterFormations.normalizePool(p.templates)');assert.equal(g.run('rolls'),0);
 const fens=J(g,`Object.entries(MAP_METADATA).filter(([id])=>id.startsWith('EASTERN_')).map(([id,m])=>({id,enabled:m.allowRandomEncounters}))`);
 assert.ok(fens.length>0);assert.ok(fens.every(m=>m.enabled===false));
});
for(const count of [1,2,3])for(const fallen of [-1,...Array.from({length:count},(_,i)=>i)]){
 if(count===1&&fallen===0)continue;
 test(`${count} members, Fallen slot ${fallen}: authenticated terminal HP controls full XP and one shared award`,()=>{
  const g=fresh(count);g.run('stats.atk=1000;stats.def=1000;stats.level=1;');
  if(fallen>0)seed(g,`saved.party.characters[${fallen-1}].hp=0`);
  if(fallen===0)g.run('stats.hp=0');
  const initial=party(g),first=enter(g,1);let rounds=0;
  while(view(g).phase==='awaiting_action'){assert.ok(rounds++<20);fill(g,'attack');resolve(g);acknowledge(g);}
  assert.equal(view(g).phase,'victory');assert.deepEqual(party(g),initial);
  const end=view(g).party,receipt=finish(g),after=party(g);assert.equal(receipt.rewards.xp,12);
  assert.deepEqual(after.members.map(m=>m.xp),end.map(m=>m.hp>0?12:0));assert.equal(after.gold,2);
  assert.deepEqual(after.members.map(m=>m.hp),end.map(m=>m.hp));assert.equal(g.run('persistentParty.serialize().rewards.length'),1);
  const unchanged=state(g);assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(state(g),unchanged);
  assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);const next=enter(g);
  assert.ok(next.party.every(m=>!first.party.some(old=>old.instanceId===m.instanceId)));
  assert.deepEqual(next.party.map(m=>m.slot),Array.from({length:count},(_,i)=>i));
 });
}
test('three duplicate defeated enemies give full aggregate XP per survivor, shared rewards and exactly six reward draws',()=>{
 const g=fresh(3);g.run('stats.atk=1000');enter(g,3);
 while(view(g).phase==='awaiting_action'){fill(g,'attack');resolve(g);acknowledge(g);}
 const before=g.run('rolls');finish(g);assert.equal(g.run('rolls')-before,6);
 assert.deepEqual(party(g).members.map(m=>m.xp),[36,36,36]);assert.equal(party(g).gold,6);
});
test('voluntary Run after a kill gives no partial rewards and does not refund consumed inventory',()=>{
 const g=fresh();g.run('stats.atk=1000;stats.items=[{...ITEM_REGISTRY.Potion}];stats.hp=5');enter(g,2);
 item(g,'Potion',0);draft(g,'attack');resolve(g);acknowledge(g);
 fill(g,'attack');resolve(g);acknowledge(g);assert.equal(view(g).enemies[0].hp,0);assert.ok(view(g).enemies[1].hp>0);
 fill(g,'run');resolve(g,{runRoll:0});acknowledge(g);assert.equal(view(g).phase,'escape');const before=g.run('rolls');finish(g);
 assert.equal(g.run('rolls'),before);assert.deepEqual(party(g).members.map(m=>m.xp),[0,0]);assert.equal(party(g).gold,0);
 assert.deepEqual(party(g).inventory,[]);assert.equal(g.run('persistentParty.serialize().rewards.length'),0);
});
test('all-Fallen field saves reject before writers; living companion permits saving Fallen Lely',()=>{
 const g=fresh();g.run('stats.hp=0');assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
 g.run('var valid=localStorage.getItem("verdantVale_save");var invalid=JSON.parse(valid);invalid.party.characters[0].hp=0;localStorage.setItem("verdantVale_save",JSON.stringify(invalid))');
 const before=state(g);assert.equal(g.run('loadGame()'),false);assert.equal(state(g),before);assert.equal(g.run('stats.hp'),0);
 assert.equal(g.run('persistentParty.hasLivingMember()'),true);g.run('localStorage.setItem("verdantVale_save",valid)');
 assert.equal(g.run('loadGame()'),true);assert.equal(g.run('SAVE_VERSION'),5);
});
test('one terminal authority gives all-Fallen defeat precedence over dead or departed enemies',()=>{
 const g=fresh();for(const enemies of ['[{hp:0}]','[{hp:3,unusual:{departed:true}}]']){
  assert.equal(g.run(`partyTerminalOutcome([{hp:0},{hp:0}],${enemies})`),'defeat');
 }
 assert.equal(g.run('partyTerminalOutcome([{hp:0},{hp:1}],[{hp:0}])'),'victory');
 assert.equal(g.run('partyTerminalOutcome([{hp:1}],[{hp:4,unusual:{departed:true}}])'),'escape');
 assert.equal(g.run('partyTerminalOutcome([{hp:0},{hp:1}],[{hp:1}])'),'ongoing');
});
for(const who of ['lely','esla','both'])test(who+' independent multi-level progression uses existing owners and stable slot presentation',()=>{
 const g=fresh();if(who==='esla')g.run('stats.hp=0');if(who==='lely')seed(g,'saved.party.characters[0].hp=0');
 g.run('Math.random=()=>{rolls++;return .5};var award=persistentParty.awardRewards({id:"progression",xp:800,gold:9,items:["Potion"]})');
 const receipt=J(g,'award'),members=party(g).members,eligible=members.filter(m=>m.hp>0);
 assert.ok(eligible.every(m=>m.level===5&&m.xp===800));assert.ok(members.filter(m=>m.hp===0).every(m=>m.level===1&&m.xp===0));
 assert.equal(g.run('rolls'),who==='esla'?0:12);assert.equal(party(g).gold,9);assert.deepEqual(party(g).inventory,['Potion']);
 assert.deepEqual(receipt.pages.map(p=>p[0].split(/[ :]/)[0]),eligible.flatMap(m=>Array(4).fill(m.name)));frozen(g.run('award'));
 const before=state(g);assert.equal(g.run('persistentParty.awardRewards({id:"progression",xp:800,gold:9,items:["Potion"]}).applied'),false);
 assert.equal(state(g),before);assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);assert.deepEqual(party(g).members,members);
});
test('unexpected level-up RNG failure retains evidence and shared award, and cannot repeat any part',()=>{
 const g=fresh();g.run('Math.random=()=>{rolls++;throw Error("growth failure")};');
 assert.throws(()=>g.run('persistentParty.awardRewards({id:"fault",xp:100,gold:7,items:["Potion"]})'),/growth failure/);
 assert.equal(g.run('stats.gold'),7);assert.equal(g.run('stats.items.length'),1);const before=state(g),calls=g.run('rolls');
 assert.throws(()=>g.run('persistentParty.awardRewards({id:"fault",xp:100,gold:7,items:["Potion"]})'));
 assert.equal(state(g),before);assert.equal(g.run('rolls'),calls);assert.equal(g.run('saveGame()'),false);
});
test('all reachable registered enemy presentations include the existing generic Takomo sprite without rendering RNG',()=>{
 const g=fresh();assert.equal(g.run('partyBattleEnemySprite("enemy_takomo").draw===drawBattleGenericEnemy'),true);
 const missing=J(g,'Object.values(ENEMY_TEMPLATE_REGISTRY).filter(canonicalEnemyIsCompatible).filter(t=>!partyBattleEnemySprite(t.id)).map(t=>t.id)');
 assert.deepEqual(missing,[]);assert.equal(g.run('rolls'),0);
});

test('Fallen field poison and Curse never revive or consume a Curse roll; existing rest restores Lely',()=>{
 const g=fresh();g.run('stats.hp=0;statusEffects=["poison","cursed"];player.step=239;keys.ArrowLeft=true');
 const x=g.run('player.x');g.frames(1);g.run('keys.ArrowLeft=false');assert.notEqual(g.run('player.x'),x);
 assert.equal(g.run('stats.hp'),0);assert.equal(g.run('rolls'),0);g.press('m');assert.equal(g.run('menu.open'),true);g.press('Escape');
 g.run('enterHouse("player_house");player.x=HOUSE_DATA.player_house.bed.x;player.y=HOUSE_DATA.player_house.bed.y;interactHouseInterior()');
 assert.equal(g.run('choice.open'),true);g.press('Enter');assert.equal(g.run('stats.hp'),30);
 assert.deepEqual(J(g,'statusEffects'),[]);assert.equal(party(g).members[1].hp,30);
});
test('final acknowledgement resolves simultaneous levels once, then member-specific pages consume no RNG or mutations',()=>{
 const g=fresh();g.run('stats.xp=90;stats.atk=1000');seed(g,'saved.party.characters[0].xp=90');enter(g);
 fill(g,'attack');resolve(g);acknowledge(g);assert.deepEqual(party(g).members.map(m=>m.level),[1,1]);
 const start=g.run('rolls');finish(g);assert.equal(g.run('rolls')-start,5);
 assert.deepEqual(party(g).members.map(m=>[m.level,m.xp]),[[2,102],[2,102]]);
 const after=party(g),rolls=g.run('rolls');assert.deepEqual(J(g,'dialogue.pages.map(p=>p[0].split(" ")[0])'),['Lély','Esla']);
 g.run('Math.random=()=>{throw Error("presentation RNG")};while(dialogue.open)handleInteract()');assert.deepEqual(party(g),after);assert.equal(g.run('rolls'),rolls);
 assert.equal(g.run('canonicalPartyCombat.finish()'),false);
});
test('authenticated generated records compose with mixed ordinary groups for every party size without rerolls',()=>{
 for(const n of [1,2,3]){const g=fresh(n);g.run('Math.random=()=>{rolls++;return .5};var generated=canonicalEnemyRecords.generated()');assert.equal(g.run('rolls'),7);
  const before=state(g);g.run('Math.random=()=>{throw Error("preparation RNG")};for(const enemies of [[generated],[generated,"enemy_thornback"],["enemy_basin_gull",generated,"enemy_mire_toad_female"]])canonicalPartyCombat.prepare({enemies,escape:"fastest_living"})');
  assert.equal(state(g),before);assert.equal(g.run('rolls'),7);assert.equal(g.run('combatEnemyInstanceSequence'),0);
 }
});

// Simulated travel uses validated placements; all quest flags, equipment, XP,
// levels, recruitment and combat outcomes come from production actions.
// The long training loop is deterministic earned XP, not a seeded character.
test('production progression from first assignment through Receiver, MQ5, backtracking, Fallen ferry and recovery',()=>{
const g=createContext();
const run=s=>g.run(s),J=s=>JSON.parse(run('JSON.stringify('+s+')'));
function close(){run(`var closeGuard=0;while(dialogue.open||mq5AssignmentCutscene.getView().phase==='walking'){
 if(closeGuard++>600)throw Error('dialogue loop');if(dialogue.open)handleInteract();else update();
}`);}
function choose(index){run('choice.cursor='+index);g.press('Enter');close();}
function supervisor(){if(run('mq5AssignmentReady()'))run(`transitionToLocation({mapId:'OFFICE_MAP',x:384,y:104,facing:'up',state:{inTown:true,currentTownId:'calwick',townBuilding:'office'}})`);run('supervisorDialogueBody()');close();}
function rest(){run('enterHouse("player_house");player.x=HOUSE_DATA.player_house.bed.x;player.y=HOUSE_DATA.player_house.bed.y;interactHouseInterior()');choose(0);close();}
function pay(){run('enterTown("calwick");enterBuilding("office");player.x=SIMPLE_NPCS.find(n=>n.id==="petra").x;player.y=SIMPLE_NPCS.find(n=>n.id==="petra").y;interactCalwickOffice()');close();}
close();run('console=Object.create(console);console.log=()=>{};Math=Object.create(Math);Math.random=()=>.5');
supervisor();assert.equal(run('sluice_job_started'),true);
run('enterSluice();player.x=SLUICE_GATE.x;player.y=SLUICE_GATE.y;interactSluiceInterior()');close();assert.equal(run('sluice_fixed'),true);
supervisor();pay();assert.equal(run('MainQuest'),1);
supervisor();run('enterTown("drenwick");enterBuilding("office");player.x=SIMPLE_NPCS.find(n=>n.id==="district_officer").x;player.y=SIMPLE_NPCS.find(n=>n.id==="district_officer").y;interactDrenwickOffice()');close();assert.equal(run('dispatch_delivered'),true);
supervisor();pay();assert.equal(run('MainQuest'),2);
supervisor();run('enterSmugglerFort();player.x=7.5*TILE;player.y=4.5*TILE;interactSmugglerFort()');close();choose(1);assert.equal(run('fort_quest_stage'),5);
supervisor();choose(0);supervisor();pay();assert.equal(run('MainQuest'),3);
supervisor();while(run('day<mq4_available_day'))rest();supervisor();if(!run('reservoir_quest_started'))supervisor();assert.equal(run('reservoir_quest_started'),true);

// Gain levels through real singleton battles and the existing bed. No XP,
// stats, quest, recruitment or combat results are injected.
let battles=0;
while(run('stats.level<12')){
 rest();run('placeAtLocation("MAP",8.5*TILE,8.5*TILE);var selection=[0,.5];Math.random=()=>selection.shift()??.5;startCombat()');assert.equal(run('combat.mode'),'single');g.frames(12);
 run('var battleGuard=0;while(combat.active){if(battleGuard++>300)throw Error("singleton loop");combat.cursor=0;handleCombatAction()}');close();battles++;
 if(battles>20000)throw Error('training did not progress '+JSON.stringify(J('[stats.level,stats.xp,stats.hp,combat.phase]')));
}
rest();run('placeAtLocation("DUNGEON8_EAST_SECRET_MAP",8.5*TILE,7.5*TILE);interactDungeon8EastSecret()');close();g.press('m');run('menu.itemCursor=groupItems().findIndex(i=>i.name==="EvadeAll")');g.press('Enter');g.press('Escape');assert.equal(battles,7500);
run('descendSunkenGallery();placeAtLocation("SUNKEN_GALLERY_R1C4",7.5*TILE,7.5*TILE);tryMapFeatures()');close();assert.equal(run('!!window.gallery_body_found'),true);
run('placeAtLocation("SUNKEN_GALLERY_R0C3",14.5*TILE,7.5*TILE);tryEdgeTransition("east");placeAtLocation("SUNKEN_GALLERY_MAP",2.5*TILE,2.5*TILE);ascendSunkenGallery()');close();choose(0);
assert.equal(run('combat.mode'),'formation');
let turns=0;while(run('combat.active')){assert.ok(turns++<1500);const phase=run('formationSessionController.getView().phase');
 if(phase==='awaiting_action'){g.press('Enter');const target=run('combat.enemies.find(e=>e.hp>0).instanceId');let n=0;while(run('formationSessionController.getView().selectedTargetInstanceId')!==target){assert.ok(n++<4);g.press('ArrowRight');}}
 g.press('Enter');
}close();assert.equal(run('gallery_receiver_defeated'),true);

run('reportBasinFindings()');close();assert.equal(run('reservoir_report_filed'),true);

run('startSeraLioraCutaway(true);endSeraLioraCutawayAtHospital()');close();supervisor();if(run('MainQuest')!==5)supervisor();assert.equal(run('MainQuest'),5);
assert.deepEqual(J('persistentParty.getView().members.map(m=>m.characterId)'),['lely','esla']);
g.press('m');assert.equal(run('menu.open'),true);g.press('Escape');assert.equal(run('saveGame()'),true);assert.equal(run('loadGame()'),true);close();
// Buy and equip the authored non-invulnerable accessory using earned gold.
run('enterTown();player.x=MERCHANT.x;player.y=MERCHANT.y;handleInteract()');assert.equal(run('shop.open'),true);g.press('Enter');run('shop.cursor=shop.stock.findIndex(i=>i.name==="Swift Bangle")');g.press('Enter');g.press('Escape');g.press('Escape');run('persistentParty.useFieldItem("lely","Swift Bangle")');
const cv=()=>J('canonicalPartyCombat.getView()'),key=k=>run('canonicalPartyCombat.handleInput('+JSON.stringify(k)+')');
function cmd(name,slot=0){let n=0;while(cv().selectedCommand!==name){assert.ok(n++<6,name);key('right');}key('confirm');
 if(cv().phase==='technique')key('confirm');if(cv().phase==='targeting'){const v=cv(),id=(v.targetSide==='ally'?v.party:v.enemies)[slot].instanceId;let n=0;while(cv().selectedTargetInstanceId!==id){assert.ok(n++<4);key('right');}key('confirm');}}
function round(runRoll=.5,orderRoll=0){let healed=false,lastHp=cv().party[0].hp;run('var live=canonicalPartyCombat.getView();var draws=live.party.filter(m=>m.hp>0).length>1?live.enemies.filter(m=>m.hp>0).length:0;var ordered=live.party.filter(m=>m.hp>0).length+live.enemies.filter(m=>m.hp>0).length-1;var battleTape=[...Array(draws).fill(0),...Array(ordered).fill('+orderRoll+')];Math.random=()=>battleTape.shift()??'+runRoll);key('confirm');let n=0;while(cv().phase==='playback'){assert.ok(n++<200);key('confirm');const hp=run('combatPlayerState.session.getView().playbackFrame.party[0].hp');if(hp>lastHp)healed=true;lastHp=hp;}key('confirm');return healed;}
function geographic(id){run('placeAtLocation("MAP2",8.5*TILE,8.5*TILE)');run('var p=currentEncounterPool();var selection=[(p.findIndex(t=>t.id==='+JSON.stringify(id)+')+.5)/p.length,.5];Math.random=()=>selection.shift()??.5;startCombat()');assert.equal(cv().active,true);assert.equal(cv().enemies[0].id,id);}
geographic('enemy_stone_crawler');cmd('observe');cmd('run');round(.999);const hurt=cv().party[0].hp;cmd('observe');cmd('resonance',0);assert.equal(round(),true);assert.ok(cv().resonance[1].strain);cmd('observe');cmd('run');round(.999);
while(cv().phase==='awaiting_action'){while(cv().phase==='awaiting_action')cmd('attack');round();}
assert.equal(cv().phase,'victory');const eligible=cv().party.map(m=>m.hp>0);key('confirm');close();assert.equal(run('persistentParty.serialize().rewards.length'),1);
console.log('canonical recruitment, field save/load, geographic Brace battle, Quickbloom and victory');
geographic('enemy_stone_crawler');let n=0;while(cv().party[0].hp>0){assert.ok(n++<100);while(cv().phase==='awaiting_action'){const v=cv(),actor=v.party.find(m=>m.instanceId===v.nextActorId);cmd(actor.characterId==='lely'?'observe':'run');}round(.999);}
assert.ok(cv().party[1].hp>0);cmd('run');run('Math.random=()=>0');key('confirm');while(cv().phase==='playback')key('confirm');key('confirm');assert.equal(cv().phase,'escape');key('confirm');assert.equal(run('stats.hp'),0);
run('placeAtLocation("EAST_CAUSEWAY_MAP",10.5*TILE,8.5*TILE)');const x=run('player.x');run('keys.ArrowLeft=true');g.frames(8);run('keys.ArrowLeft=false');assert.notEqual(run('player.x'),x);assert.equal(run('stats.hp'),0);
g.press('m');assert.equal(run('menu.open'),true);g.renderFrame();g.press('Escape');assert.equal(run('saveGame()'),true);assert.equal(run('loadGame()'),true);close();assert.equal(run('stats.hp'),0);
assert.equal(run('crossCausewayFerry()'),true);assert.equal(run('mapIdForRef(activeMap)'),'EASTERN_BANK_MAP');assert.equal(run('stats.hp'),0);
const east=run('player.x');run('keys.ArrowRight=true');g.frames(20);run('keys.ArrowRight=false');assert.notEqual(run('player.x'),east);assert.equal(run('combat.active||canonicalPartyCombat.isActive()'),false);
run('canonicalPartyCombat.enter({enemies:["enemy_stone_crawler"],escape:"blocked"})');assert.equal(cv().party[0].hp,0);assert.equal(cv().party[1].hp>0,true);
const defeatDay=run('day');n=0;while(cv().phase==='awaiting_action'){assert.ok(n++<100);cmd('run');round(.999,.999);}
assert.equal(cv().phase,'defeat');key('confirm');assert.equal(run('day'),defeatDay+1);assert.equal(run('stats.gold'),0);assert.ok(J('persistentParty.getView().members').every(m=>m.hp===m.maxHp));assert.equal(run('canonicalPartyCombat.finish()'),false);assert.equal(run('day'),defeatDay+1);close();
assert.equal(run('saveGame()'),true);assert.equal(run('loadGame()'),true);
console.log('Fallen field movement/menu/save/load/ferry, fresh canonical battle, whole-party recovery exactly once');

});

test('partial kills followed by all-Fallen defeat recover every owner once without rewards or completion',()=>{
 const g=fresh(3);g.run('stats.hp=1;stats.atk=1000;stats.gold=91;statusEffects=["poison","cursed"];');seed(g,'saved.party.characters.forEach(m=>{m.hp=1;m.statuses=["poison","cursed"]})');
 // Remove Curse through the existing field cure so the killing Attack has no
 // fixture-only exception to its ordinary fumble draw.
 g.run('stats.items=[{...ITEM_REGISTRY["Amethyst Dust"]}];persistentParty.useFieldItem("lely","Amethyst Dust")');
 const day=g.run('day');enter(g,2,'blocked');draft(g,'attack');draft(g,'run');draft(g,'observe');resolve(g);acknowledge(g);
 assert.equal(view(g).enemies[0].hp,0);assert.equal(view(g).party[0].hp,0);
 let guard=0;while(view(g).phase==='awaiting_action'){assert.ok(guard++<5);while(view(g).phase==='awaiting_action'){
  const v=view(g),actor=v.party.find(m=>m.instanceId===v.nextActorId);draft(g,actor.characterId==='esla'?'run':'observe');
 }resolve(g);acknowledge(g);}
 assert.equal(view(g).phase,'defeat');const calls=g.run('rolls');finish(g);assert.equal(g.run('rolls'),calls);
 assert.equal(g.run('day'),day+1);assert.equal(party(g).gold,0);assert.deepEqual(party(g).members.map(m=>m.xp),[0,0,0]);
 assert.ok(party(g).members.every(m=>m.hp===m.maxHp&&m.statuses.length===0&&m.slitherSpeed===1));
 assert.deepEqual(party(g).inventory,[]);assert.equal(g.run('persistentParty.serialize().rewards.length'),0);
 assert.equal(g.run('mapIdForRef(activeMap)'),'HOUSE_INTERIOR_MAP');const after=state(g);
 assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.equal(state(g),after);
});
test('each static ordinary template installs for 1–3 members; recruited membership remains canonical with Fallen Esla',()=>{
 const ids=J(fresh(),'Object.values(ENEMY_TEMPLATE_REGISTRY).filter(t=>!t.inline&&canonicalEnemyIsCompatible(t)&&!enemyCapabilityMetadata(t).capabilities.some(c=>CANONICAL_SCRIPTED_LIFECYCLE_CAPABILITIES.includes(c))).map(t=>t.id)');
 for(const n of [1,2,3])for(const id of ids){const g=fresh(n);if(n>1)seed(g,'saved.party.characters[0].hp=0');
  g.run('canonicalPartyCombat.enter({enemies:['+JSON.stringify(id)+'],escape:"fastest_living"})');
  assert.equal(view(g).party.length,n,id);assert.equal(view(g).enemies[0].id,id);assert.equal(g.run('rolls'),0,id);
  if(n>1)assert.equal(view(g).party[1].hp,0,id);
  assert.equal(g.run('canonicalPartyCombat.isActive()'),true);assert.equal(view(g).commandSet,'standard');
 }
});

module.exports={name:'universal canonical party compatibility, living rewards and Fallen state',run(){for(const check of checks){try{check.run();}catch(e){e.message=check.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Pass 6 compatibility checks passed');}};
