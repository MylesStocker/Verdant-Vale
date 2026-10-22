'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run}),J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const RING='fort_quest_stage=6;smugglers_dead=true;fort_report_filed=false;smugglers_execution_day=0;reservoir_quest_started=true;MainQuest=4;lighthouse_quest_stage=1;lighthouse_spider_resolved=false;';
const ROUTES=[
 ['Briar Warden','startWardenCombat()',"warden_quest_started=true;warden_quest_defeated=false;",'enemy_briar_warden'],
 ['Pale Sentry','startCombat()',"resetLocationState();placeAtLocation('MAP_N2',1.5*TILE,9.5*TILE);sentry_quest_started=true;sentry_quest_done=false;pale_sentry_hp=177;",'enemy_pale_sentry'],
 ['Rainfish','startRainfishCombat(0)',"sickle_quest_stage=1;rainfish_woken=true;",'enemy_rainfish'],
 ['Takomo','startTakomoCombat()',"TAKOMO.defeated=false;",'enemy_takomo'],
 ['Den Wraith','startDenWraithCombat()',"den_wraith_quest_started=true;den_wraith_defeated=false;DEN_WRAITH.defeated=false;",'enemy_den_wraith'],
 ['Kolm','startSailorBrawlCombat()',"stats.gold=100;sailor_brawl_fight_day=-1;",'enemy_kolm'],
 ['Wrongteeth','startBossCombat()',"BOSS.defeated=false;BOSS.knockedDown=false;",'enemy_wrongteeth'],
 ['Lensweb Spider','startLenswebSpiderCombat()',RING,'enemy_lensweb_spider'],
 ['Mimic Potion','startMimicPotionCombat()',"PICKUP_REGISTRY.pickup_sunken_gallery_mimic.picked=false;",'enemy_mimic_potion'],
 ['Mulholland','startMulhollandCombat()',"MULHOLLAND.defeated=false;",'enemy_mulholland'],
 ['Mire Toad spawning site','startMireToadSpawnCombat(0)',"PICKUP_REGISTRY.pickup_map3n1_mire_toad_spawn.picked=false;",'enemy_mire_toad_male'],
 ['trapped Drowned','startTrappedDrownedCombat()',"window.sunken_gallery_drowned_freed=false;window.sunken_gallery_drowned_slain=false;",'enemy_pale_drowned_gallery'],
];
function fresh(setup='',members=2){
 const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;stats.hp=stats.maxHp=2000;stats.atk=10000;stats.def=100;${setup}
  ${members>1?'persistentParty.joinEsla({level:11});':''}Math=Object.create(Math);var calls=0;Math.random=()=>{calls++;return .25};`);return g;
}
const view=g=>J(g,'canonicalPartyCombat.getView()'),input=(g,key)=>g.run('partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),QUICKBLOOM_ANIMATION_FRAMES*MS_PER_FRAME/1000);canonicalPartyCombat.handleInput('+JSON.stringify(key)+')');
function draftAttacks(g){let guard=0;while(view(g).phase==='awaiting_action'){assert.ok(guard++<4);input(g,'confirm');input(g,'confirm');}}
function resolve(g){const v=view(g),living=v.party.filter(m=>m.hp>0).length+v.enemies.filter(m=>m.hp>0).length,
 targetDraws=v.party.filter(m=>m.hp>0).length>1?v.enemies.filter(m=>m.hp>0).length:0;
 g.run('var tape='+JSON.stringify([...Array(targetDraws+living-1).fill(0),...Array(30).fill(.5)])+',ti=0;Math.random=()=>{calls++;return tape[ti++]??.5};');input(g,'confirm');}
function acknowledge(g){let n=0;while(view(g).phase==='playback'){assert.ok(n++<300);input(g,'confirm');}if(view(g).phase==='playback_complete')input(g,'confirm');}
function victory(g){draftAttacks(g);resolve(g);acknowledge(g);assert.equal(view(g).phase,'victory');g.run('Math.random=()=>{calls++;return .5}');input(g,'confirm');assert.equal(view(g).active,false);}

test('the 15 guarded templates have one reconciled A/B classification and Receiver remains Formation-owned',()=>{
 const text=fs.readFileSync(path.join(__dirname,'../../SCRIPTED_COMBAT_ENTRY_AUDIT.md'),'utf8');
 const rows=[...text.matchAll(/^\| `(enemy_[^`]+)` \| ([ABC]) \|/gm)].map(m=>[m[1],m[2]]);
 assert.equal(rows.length,15);assert.equal(new Set(rows.map(r=>r[0])).size,15);
 assert.deepEqual(rows.filter(r=>r[1]==='A').map(r=>r[0]).sort(),[
  'enemy_briar_warden','enemy_den_wraith','enemy_kolm','enemy_lensweb_spider','enemy_mimic_potion',
  'enemy_pale_sentry','enemy_rainfish','enemy_takomo','enemy_wrongteeth'].sort());
 assert.deepEqual(rows.filter(r=>r[1]==='B').map(r=>r[0]).sort(),[
  'enemy_smuggler_guard','enemy_polwick','enemy_essa','enemy_gallery_receiver','enemy_gallery_caller','enemy_gallery_keeper'].sort());
});

for(const [label,start,setup,id]of ROUTES)test(label+' enters the authenticated canonical route after recruitment',()=>{
 const g=fresh(setup);const before=g.run('combatEnemyInstanceSequence');g.run(start);
 assert.equal(g.run('canonicalPartyCombat.isActive()'),true,label);assert.equal(g.run('combat.active'),false,label);
 assert.deepEqual(view(g).party.map(m=>m.characterId),['lely','esla']);assert.equal(view(g).enemies[0].id,id);
 assert.equal(g.run('combatEnemyInstanceSequence'),before+1);assert.equal(g.run('saveGame()'),false);
});

test('the shared scripted route supports one, two and three fixed canonical member slots',()=>{
 for(const count of [1,2]){const g=fresh('warden_quest_started=true;warden_quest_defeated=false;',count);g.run('startWardenCombat()');
  if(count===1){assert.equal(g.run('canonicalPartyCombat.isActive()'),false);assert.equal(g.run('combat.mode'),'single');}
  else assert.deepEqual(view(g).party.map(m=>m.slot),[0,1]);}
 const read=fs.readFileSync;try{fs.readFileSync=function(file,...args){let source=read.call(this,file,...args);
  if(String(file).endsWith('/persistent-party.js'))source=source.replace('  lely:Object.freeze',
   "  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture third',rareBorn:false,affinity:null,progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),\n  lely:Object.freeze");return source;};
  const g=fresh('warden_quest_started=true;warden_quest_defeated=false;');g.run(`saveGame();var s=JSON.parse(localStorage.getItem('verdantVale_save'));
   s.party.order.push('fixture_third');s.party.characters.push({...s.party.characters[0],characterId:'fixture_third'});
   localStorage.setItem('verdantVale_save',JSON.stringify(s));loadGame();dialogue.open=false;startWardenCombat();`);
  assert.deepEqual(view(g).party.map(m=>m.slot),[0,1,2]);
 }finally{fs.readFileSync=read;}
});

test('victory authenticates and finalizes every reachable story route once',()=>{
 const assertions={
  'Briar Warden':g=>g.run('warden_quest_defeated'), 'Pale Sentry':g=>g.run('sentry_quest_done&&pale_sentry_hp===0'),
  Takomo:g=>g.run('TAKOMO.defeated'), 'Den Wraith':g=>g.run('DEN_WRAITH.defeated&&den_wraith_defeated'),
  Kolm:g=>g.run('sailor_brawl_fight_day===day&&stats.gold>=100'), Wrongteeth:g=>g.run('BOSS.knockedDown'),
  'Lensweb Spider':g=>g.run('lighthouse_spider_resolved'), 'Mimic Potion':g=>g.run("stats.items.some(i=>i.name==='Potion')"),
  Mulholland:g=>g.run('MULHOLLAND.defeated'), 'Mire Toad spawning site':g=>g.run('PICKUP_REGISTRY.pickup_map3n1_mire_toad_spawn.picked'),
  'trapped Drowned':g=>g.run('window.sunken_gallery_drowned_slain'),
 };
 for(const [label,start,setup]of ROUTES){const g=fresh(setup);g.run(start);victory(g);
  if(assertions[label])assert.equal(assertions[label](g),true,label);const after=J(g,'persistentParty.getView()');
  assert.equal(g.run('canonicalPartyCombat.finish()'),false);assert.deepEqual(J(g,'persistentParty.getView()'),after,label);
 }
});

test('Rainfish and Mire Toad retain authenticated chained battles and block saving between stages',()=>{
 for(const [name,start,setup,id]of [
  ['Rainfish','startRainfishCombat(1)','sickle_quest_stage=1;rainfish_woken=true;','enemy_rainfish'],
  ['Mire','startMireToadSpawnCombat(1)','PICKUP_REGISTRY.pickup_map3n1_mire_toad_spawn.picked=false;','enemy_mire_toad_male']]){
  const g=fresh(setup);g.run(start);victory(g);assert.equal(g.run('scriptedPartyEncounters.hasPending()'),true,name);
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('dialogue.callbacks.length'),1);g.run('dialogue.open=false;var cb=dialogue.callbacks.shift();dialogue.callbacks=[];cb()');
  assert.equal(g.run('canonicalPartyCombat.isActive()'),true);assert.equal(name==='Mire'?view(g).enemies[0].id.startsWith('enemy_mire_toad_'):view(g).enemies[0].id===id,true);
  assert.equal(g.run('scriptedPartyEncounters.hasPending()'),false);
 }
});

test('entry rejection is atomic and unauthenticated scripted templates cannot bypass their owner',()=>{
 const g=fresh('warden_quest_started=false;warden_quest_defeated=false;'),before=g.run('JSON.stringify({party:persistentParty.getView(),stats,combat,seq:combatEnemyInstanceSequence,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})'),calls=g.run('calls');
 assert.equal(g.run('startWardenCombat()'),false);assert.equal(g.run('JSON.stringify({party:persistentParty.getView(),stats,combat,seq:combatEnemyInstanceSequence,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})'),before);assert.equal(g.run('calls'),calls);
 assert.throws(()=>g.run('canonicalPartyCombat.enter({enemies:["enemy_briar_warden"],escape:"fastest_living"})'),/scripted lifecycle owner/);
});

test('Kolm stake, Mimic trap and Lensweb poison occur only after complete preparation',()=>{
 const k=fresh('stats.gold=100;sailor_brawl_fight_day=-1;');k.run('startSailorBrawlCombat()');assert.equal(k.run('stats.gold'),50);
 const m=fresh('PICKUP_REGISTRY.pickup_sunken_gallery_mimic.picked=false;');m.run('startMimicPotionCombat()');assert.equal(m.run('PICKUP_REGISTRY.pickup_sunken_gallery_mimic.picked'),true);
 const l=fresh(RING);l.run('startLenswebSpiderCombat()');assert.equal(l.run("statusEffects.includes('poison')"),true);
 for(const [g,flag]of [[k,'stats.gold'],[m,'PICKUP_REGISTRY.pickup_sunken_gallery_mimic.picked']])assert.equal(g.run('canonicalPartyCombat.isActive()'),true,String(flag));
});

test('escape preserves retryable story state; Lensweb Observe escape alone resolves its objective',()=>{
 const g=fresh('warden_quest_started=true;warden_quest_defeated=false;'),xp=J(g,'persistentParty.getView().members.map(m=>m.xp)');g.run('startWardenCombat()');
 for(let i=0;i<2;i++){while(view(g).selectedCommand!=='run')input(g,'right');input(g,'confirm');}
 g.run('Math.random=()=>{calls++;return 0}');input(g,'confirm');acknowledge(g);assert.equal(view(g).phase,'escape');input(g,'confirm');
 assert.equal(g.run('warden_quest_defeated'),false);assert.deepEqual(J(g,'persistentParty.getView().members.map(m=>m.xp)'),xp);
 const l=fresh(RING+'stats.items=[{...ITEM_REGISTRY.Bait},{...ITEM_REGISTRY.Bait}];');l.run('startLenswebSpiderCombat()');
 for(let round=0;round<2;round++){
  while(view(l).selectedCommand!=='observe')input(l,'right');input(l,'confirm');input(l,'confirm');
  while(view(l).phase==='awaiting_action'){while(view(l).selectedCommand!=='item')input(l,'right');input(l,'confirm');input(l,'confirm');}
  resolve(l);acknowledge(l);
 }
 for(let i=0;i<2;i++){while(view(l).selectedCommand!=='run')input(l,'right');input(l,'confirm');}
 resolve(l);acknowledge(l);assert.equal(view(l).phase,'escape');input(l,'confirm');assert.equal(l.run('lighthouse_spider_resolved'),true);
});

test('defeat authenticates after canonical recovery without completing the story encounter',()=>{
 const g=fresh('warden_quest_started=true;warden_quest_defeated=false;');
 g.run(`stats.hp=1;stats.items=[{...ITEM_REGISTRY.Bait},{...ITEM_REGISTRY.Bait}];saveGame();var defeatedSave=JSON.parse(localStorage.getItem('verdantVale_save'));
  defeatedSave.party.characters[0].hp=1;localStorage.setItem('verdantVale_save',JSON.stringify(defeatedSave));loadGame();dialogue.open=false;
  resetLocationState();placeAtLocation('MAP_3N1',5*TILE,5*TILE);startWardenCombat();`);
 const startDay=g.run('day');
 for(let round=0;round<2&&view(g).phase==='awaiting_action';round++){
  while(view(g).phase==='awaiting_action'){
   const command=view(g).commands.includes('observe')?'observe':'item';while(view(g).selectedCommand!==command)input(g,'right');input(g,'confirm');input(g,'confirm');
  }
  resolve(g);acknowledge(g);
 }
 assert.equal(view(g).phase,'defeat');input(g,'confirm');
 assert.equal(g.run('canonicalPartyCombat.isActive()'),false);assert.equal(g.run('warden_quest_defeated'),false);
 assert.equal(g.run('day'),startDay+1);assert.equal(g.run('currentHouseId'),'player_house');
 assert.ok(J(g,'persistentParty.getView().members').every(member=>member.hp===member.maxHp));
});

test('fort trio and Receiver trio remain pre-recruitment-only and keep their legacy owners',()=>{
 const g=fresh('fort_quest_started=true;fort_quest_stage=1;');for(const call of ['startFortGuardCombat()','startFortPolwickCombat()','startFortEssaCombat()'])
  assert.throws(()=>g.run(call),/unsupported scripted encounter/);
 assert.equal(g.run('MainQuest<5'),true);assert.equal(g.run('galleryReceiverEncounter.getView()'),null);
 assert.match(fs.readFileSync(path.join(__dirname,'../../gallery-receiver.js'),'utf8'),/formationRounds|galleryReceiverEncounter/);
});

test('source authority contains no scripted enemy-ID combat dispatch or replacement compatibility allowlist',()=>{
 const root=path.join(__dirname,'../..'),owner=fs.readFileSync(path.join(root,'scripted-party-encounters.js'),'utf8'),resolver=fs.readFileSync(path.join(root,'combat.js'),'utf8');
 assert.doesNotMatch(resolver,/SCRIPTED.*TEMPLATE_IDS|PARTY_ATTACK_TEMPLATE_IDS/);assert.doesNotMatch(owner,/switch\s*\([^)]*enemy|if\s*\([^)]*enemy\.id/);
 assert.ok(owner.includes('canonicalPartyCombat.enterScripted'));
});

module.exports={name:'scripted canonical party encounters: routing, authenticated outcomes and legacy isolation',checks,
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' scripted party lifecycle checks passed');}};
