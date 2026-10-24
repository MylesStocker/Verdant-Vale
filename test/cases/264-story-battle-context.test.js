'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const tests=[],test=(name,run)=>tests.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(){const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMenu.open=false;
 Math=Object.create(Math);var draws=[];Math.random=()=>{throw Error('unexpected RNG');};
 var profiles=SERA_LIORA_OPENING_PROFILES.map(m=>({...m,statuses:[...m.statuses],equipment:{...m.equipment}})),inventory=[...SERA_LIORA_OPENING_INVENTORY];
 var refs={stats,items:stats.items,weapon:stats.weapon,armor:stats.armor,shield:stats.shield,accessory:stats.accessory,statuses:statusEffects,player};`);return g;}
function canonical(g){return g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),player,day,tick,
 location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save')})`);}
function refs(g){assert.equal(g.run(`refs.stats===stats&&refs.items===stats.items&&refs.weapon===stats.weapon&&refs.armor===stats.armor&&refs.shield===stats.shield&&refs.accessory===stats.accessory&&refs.statuses===statusEffects&&refs.player===player`),true);}
function create(g){g.run(`var token=storyBattle.createContext({id:'fixture_story',party:profiles,inventory});`);}
function begin(g,extra=''){g.run(`storyBattle.begin(token,{encounter:['enemy_marsh_wisp'],escape:'blocked',presentation:{label:'Fixture story'}${extra}});`);}
const view=g=>J(g,'storyBattle.getView(token)');
function act(g,method,...args){return g.run('storyBattle.act(token,'+JSON.stringify(method)+args.map(a=>','+JSON.stringify(a)).join('')+')');}
function attacks(g){let n=0;while(view(g).phase==='awaiting_action'){assert.ok(n++<4);const v=view(g);act(g,'submitAttack',{actorId:v.nextActorId,targetId:v.enemies.find(e=>e.hp>0).instanceId});}}
function round(g){g.run(`Math.random=()=>{draws.push(0.5);return 0.5;};`);try{act(g,'commitRound');}finally{g.run(`Math.random=()=>{throw Error('unexpected RNG');};`);}const events=[];while(view(g).phase==='playback'){const v=act(g,'advancePlayback');if(v.playbackFrame.currentEvent)events.push(JSON.parse(JSON.stringify(v.playbackFrame.currentEvent)));}assert.equal(view(g).phase,'playback_complete');act(g,'acknowledgePlayback');return events;}
function win(g){let n=0;while(view(g).phase==='awaiting_action'){assert.ok(n++<100);attacks(g);round(g);}assert.equal(view(g).phase,'victory');return g.run('storyBattle.complete(token)');}
function choose(g,command){let n=0;while(view(g).selectedCommand!==command){assert.ok(n++<6);act(g,'moveCommand','next');}act(g,'confirmCommand');}
function item(g,id,slot){choose(g,'item');let n=0;while(view(g).items[view(g).itemCursor].itemId!==id){assert.ok(n++<30);act(g,'moveItem','next');}act(g,'confirmItem');if(view(g).phase==='targeting'){const target=view(g).party[slot].instanceId;let k=0;while(view(g).selectedTargetInstanceId!==target){assert.ok(k++<4);act(g,'moveTarget','next');}act(g,'confirmTarget');}}
function enemy(g,values){g.run('Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,'+JSON.stringify(values)+');');}
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const d of Object.values(Object.getOwnPropertyDescriptors(v))){assert.ok(Object.hasOwn(d,'value'));frozen(d.value);}}}

test('both independent actors use ordinary Attack and registered gear under the same tape',()=>{
 const results=[];
 for(const equipped of [true,false]){
  const g=fresh();enemy(g,{hp:1000,maxHp:1000,atk:100,def:0,spd:1});
  g.run(`profiles.forEach((m,i)=>{m.characterId='independent_'+i;if(!${equipped})m.equipment={weapon:null,armor:null,shield:null,accessory:null};});stats.hp=0;`);
  const before=canonical(g);create(g);begin(g);const initial=view(g);frozen(g.run('storyBattle.getView(token)'));
  attacks(g);const hits=round(g).filter(e=>e.type==='attack');
  for(const ally of initial.party)assert.ok(hits.some(e=>e.actorId===ally.instanceId),'both attacks resolve');
  assert.equal(canonical(g),before);refs(g);results.push({hits,party:initial.party,draws:J(g,'draws')});g.run('storyBattle.discard(token)');assert.equal(canonical(g),before);refs(g);
 }
 assert.deepEqual(results[0].draws,results[1].draws);
 for(let slot=0;slot<2;slot++){
  const damage=r=>r.hits.find(e=>e.actorId===r.party[slot].instanceId).appliedDamage;
  assert.ok(damage(results[0])>damage(results[1]),'weapon changes shared damage');
 }
 const incoming=r=>r.hits.find(e=>e.actorId.startsWith('combat_enemy_')).appliedDamage;
 assert.ok(incoming(results[0])<incoming(results[1]),'armor changes shared incoming damage');
});

test('acknowledged resources carry inventory, equipment, HP, statuses and Slither to the next battle',()=>{
 const g=fresh();enemy(g,{hp:160,maxHp:160,atk:1,def:0,spd:1});
 g.run(`profiles[0].hp=80;profiles[0].statuses=['slither'];profiles[0].slitherSpeed=5;profiles[1].statuses=['cursed'];inventory=['Potion','Iron Sword','Reed Remedy'];`);
 const before=canonical(g);create(g);const initial=J(g,'storyBattle.getState(token)');begin(g);
 item(g,'Potion',0);item(g,'Iron Sword',1);round(g);
 const during=J(g,'storyBattle.getState(token)');assert.deepEqual(during.party,initial.party);assert.deepEqual(during.inventory,initial.inventory);
 assert.equal(view(g).equipment[1].weapon,'Iron Sword');assert.ok(view(g).party[0].hp>80);assert.equal(g.run('storyBattle.complete(token)'),false);
 win(g);const state=J(g,'storyBattle.getState(token)');assert.equal(state.phase,'idle');assert.ok(!state.inventory.includes('Potion'));assert.ok(!state.inventory.includes('Iron Sword'));assert.ok(state.inventory.includes('Balanced Staff'));
 assert.equal(state.party[1].equipment.weapon,'Iron Sword');assert.ok(state.party[1].statuses.includes('cursed'));assert.ok(state.party[0].statuses.includes('slither'));assert.equal(state.party[0].slitherSpeed,11);
 begin(g);assert.deepEqual(view(g).party.map(m=>m.hp),state.party.map(m=>m.hp));assert.equal(view(g).effects[0].slither.speed,11);assert.equal(view(g).equipment[1].weapon,'Iron Sword');g.run('storyBattle.reset()');assert.equal(canonical(g),before);refs(g);
});

test('completion commits once before reentrant and throwing callbacks',()=>{
 const g=fresh();enemy(g,{hp:1,maxHp:1,atk:1,def:0,spd:1});create(g);g.run('var callbacks=0,insideState=null,repeated=null;');
 begin(g,`,outcomes:{victory:function(){callbacks++;insideState=storyBattle.getState(token);repeated=storyBattle.complete(token);storyBattle.begin(token,{encounter:['enemy_marsh_wisp'],escape:'blocked',presentation:{label:'Next'}});throw Error('continuation failure');}}`);
 win(g);assert.equal(g.run('callbacks'),1);assert.equal(g.run('repeated'),false);assert.equal(g.run('insideState.phase'),'idle');assert.equal(view(g).label,'Next');assert.match(g.run('storyBattle.getState(token).callbackError'),/continuation failure/);assert.equal(g.run('storyBattle.complete(token)'),false);win(g);assert.equal(g.run('callbacks'),1);assert.equal(g.run('storyBattle.complete(token)'),false);g.run('storyBattle.reset()');
});

test('bad profiles and encounters reject atomically without RNG or identity allocation',()=>{
 for(const edit of ["profiles[0].hp=-1","profiles[1].characterId=profiles[0].characterId","profiles[0].equipment.weapon='missing'","profiles[0].equipment.weapon='Potion'","profiles[0].statuses=['unknown']","profiles[0].atk=Number.MAX_SAFE_INTEGER"]){
  const g=fresh(),before=canonical(g),seq=g.run('combatEnemyInstanceSequence');g.run(edit);assert.throws(()=>create(g));assert.equal(g.run('storyBattle.hasContext()'),false);assert.equal(g.run('combatEnemyInstanceSequence'),seq);assert.equal(canonical(g),before);refs(g);
 }
 const g=fresh();create(g);const before=J(g,'storyBattle.getState(token)'),seq=g.run('combatEnemyInstanceSequence');
 for(const options of ["{encounter:['missing'],escape:'blocked',presentation:{label:'Bad'}}","{encounter:['enemy_marsh_wisp'],escape:'ignore_boss',presentation:{label:'Bad'}}","{encounter:['enemy_marsh_wisp'],escape:'blocked',presentation:{label:''}}","{encounter:['enemy_marsh_wisp'],escape:'blocked',presentation:{label:'Bad'},outcomes:{victory:7}}"]){assert.throws(()=>g.run('storyBattle.begin(token,'+options+')'));assert.deepEqual(J(g,'storyBattle.getState(token)'),before);assert.equal(g.run('combatEnemyInstanceSequence'),seq);assert.equal(g.run('combatPlayerState.hasParty()'),false);}
 begin(g);assert.equal(view(g).party[0].instanceId,'combat_party_1');g.run('storyBattle.reset()');
});

test('resolver fault locks until reset and stale tokens cannot affect replacement contexts',()=>{
 const g=fresh();create(g);begin(g);attacks(g);g.run(`Math.random=()=>{throw Error('injected resolver failure');};`);assert.throws(()=>act(g,'commitRound'),/injected resolver failure/);assert.equal(g.run('storyBattle.getState(token).phase'),'fault');assert.equal(g.run('storyBattle.getView(token)'),null);assert.equal(act(g,'advancePlayback'),false);assert.equal(g.run('storyBattle.complete(token)'),false);assert.throws(()=>begin(g));
 g.run('var stale=token;storyBattle.reset();');assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('combat.mode'),null);create(g);assert.throws(()=>g.run('storyBattle.getState(stale)'),/stale/);assert.equal(g.run('storyBattle.discard(stale)'),false);assert.equal(g.run('storyBattle.hasContext()'),true);g.run('storyBattle.reset()');
});

test('idle context blocks save/load, keyboard input and simulation; checkpoint clears it',()=>{
 const g=fresh();assert.equal(g.run('saveGame()'),true);const save=g.run("localStorage.getItem('verdantVale_save')");create(g);const before=canonical(g);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);assert.equal(g.run("localStorage.getItem('verdantVale_save')"),save);
 g.press('ArrowRight');g.press('Enter');g.press('m');g.press('`');g.frames(10);assert.equal(canonical(g),before);assert.equal(g.run('menu.open||debugMenu.open||dialogue.open'),false);assert.throws(()=>g.run("storyBattle.createContext({id:'other',party:profiles,inventory})"));
 assert.equal(g.run('storyCheckpointLab.apply("mq5_assignment_ready")'),true);assert.equal(g.run('storyBattle.hasContext()'),false);assert.throws(()=>g.run('storyBattle.getState(token)'),/stale/);assert.equal(g.run('combat.mode'),null);assert.equal(g.run('combatPlayerState.hasParty()'),false);
});

test('Fallen temporary actors and canonical HP zero remain independent on defeat',()=>{
 const g=fresh();enemy(g,{hp:1000,maxHp:1000,atk:100,def:100,spd:100});g.run('stats.hp=0;profiles[0].hp=0;profiles[1].hp=1;');const before=canonical(g);create(g);begin(g);assert.equal(view(g).nextActorId,view(g).party[1].instanceId);attacks(g);round(g);assert.equal(view(g).phase,'defeat');const receipt=g.run('storyBattle.complete(token)');assert.equal(receipt.outcome,'defeat');assert.deepEqual(Array.from(receipt.party,m=>m.hp),[0,0]);assert.equal(canonical(g),before);refs(g);assert.throws(()=>begin(g));g.run('storyBattle.reset()');
});

test('Reusable definitions do not start a battle; only the authorized breakfast adapter is a playable caller',()=>{
 const scripts=scriptOrderFromIndexHtml();assert.ok(scripts.includes('story-battle.js'));assert.ok(scripts.includes('sera-liora-battle-profiles.js'));
 for(const file of scripts){if(['story-battle.js','sera-liora-breakfast-battle.js'].includes(file))continue;assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),/storyBattle\.(createContext|begin|act|complete)\s*\(/,file);}
 assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'../../sera-liora-breakfast.js'),'utf8'),/storyBattle/);const g=fresh();assert.equal(g.run('storyBattle.hasContext()'),false);assert.equal(g.run('combat.mode'),null);assert.equal(g.run('SAVE_VERSION'),5);
});
test('Run uses the shared escape policy and completes only after terminal acknowledgement',()=>{
 const g=fresh();enemy(g,{hp:1000,maxHp:1000,atk:1,def:0,spd:1});create(g);begin(g);choose(g,'run');attacks(g);
 const blocked=round(g);assert.ok(blocked.some(e=>e.type==='run'&&e.allowed===false));assert.equal(view(g).phase,'awaiting_action');g.run('storyBattle.discard(token)');
 create(g);g.run(`var escaped=0;storyBattle.begin(token,{encounter:['enemy_marsh_wisp'],escape:'fastest_living',presentation:{label:'Escape'},outcomes:{escape:function(){escaped++;}}});`);
 choose(g,'run');attacks(g);g.run('Math.random=()=>{draws.push(0.5);return 0.5;};');act(g,'commitRound');g.run(`Math.random=()=>{throw Error('unexpected RNG');};`);
 assert.equal(g.run('storyBattle.complete(token)'),false);
 while(view(g).phase==='playback')act(g,'advancePlayback');
 assert.equal(g.run('storyBattle.complete(token)'),false,'historical terminal frame still needs acknowledgement');assert.equal(g.run('escaped'),0);
 act(g,'acknowledgePlayback');assert.equal(view(g).phase,'escape');const receipt=g.run('storyBattle.complete(token)');frozen(receipt);assert.equal(receipt.outcome,'escape');assert.equal(g.run('escaped'),1);assert.equal(g.run('storyBattle.complete(token)'),false);assert.equal(g.run('escaped'),1);g.run('storyBattle.reset()');
});

test('sealed-state corruption faults complete and explicit reset abandons the lease',()=>{
 const g=fresh();create(g);begin(g);g.run('combat.enemies[0].hp--;');assert.throws(()=>g.run('storyBattle.complete(token)'));
 assert.equal(g.run('storyBattle.getState(token).phase'),'fault');assert.equal(g.run('storyBattle.complete(token)'),false);assert.equal(g.run('storyBattle.reset()'),true);assert.equal(g.run('storyBattle.hasContext()'),false);assert.equal(g.run('combat.mode'),null);
});

test('existing enemy preparation and modal owners prevent a context without allocation',()=>{
 for(const setup of ["combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp};","menu.open=true;","seraLioraCutscene.active=true;"]){
  const g=fresh();g.run(setup);const before=canonical(g),seq=g.run('combatEnemyInstanceSequence');assert.throws(()=>create(g));assert.equal(g.run('storyBattle.hasContext()'),false);assert.equal(g.run('combatEnemyInstanceSequence'),seq);assert.equal(canonical(g),before);
 }
});

test('held keys are masked and both cutaway start and completion invalidate story tokens',()=>{
 const g=fresh();g.run('keys.d=true;');create(g);assert.equal(g.run('keys.d'),false);const before=canonical(g);g.frames(3);assert.equal(canonical(g),before);
 g.run('startSeraLioraCutaway(false);');assert.equal(g.run('storyBattle.hasContext()'),false);assert.throws(()=>g.run('storyBattle.getState(token)'),/stale/);
 const h=fresh();create(h);begin(h);h.run('seraLioraCutscene.active=true;seraLioraCutscene.storyEntry=false;endSeraLioraCutawayAtHospital();');assert.equal(h.run('storyBattle.hasContext()'),false);assert.equal(h.run('combat.mode'),null);assert.equal(h.run('combatPlayerState.hasParty()'),false);assert.throws(()=>h.run('storyBattle.getState(token)'),/stale/);
});

test('authored Sera/Liora profiles render approved sprites through shared presentation without state or RNG writes',()=>{
 const g=fresh();create(g);begin(g);
 assert.deepEqual(view(g).party.map(m=>[m.characterId,m.hp,m.maxHp]),[['sera',220,220],['liora',290,290]]);
 assert.deepEqual(view(g).party.map(m=>[m.effective.atk,m.effective.def]),[[50,34],[46,38]]);
 // Simulated Canvas records transforms and source frames; it is not browser or raster evidence.
 g.run(`var images=[],requested=[],matrix=[1,1,0,0],matrixStack=[];
 loadedImageAsset=id=>{requested.push(id);return {id};};
 ctx.save=()=>matrixStack.push(matrix.slice());ctx.restore=()=>{matrix=matrixStack.pop();};
 ctx.translate=(x,y)=>{matrix[2]+=matrix[0]*x;matrix[3]+=matrix[1]*y;};
 ctx.scale=(x,y)=>{matrix[0]*=x;matrix[1]*=y;};
 ctx.drawImage=(image,...args)=>images.push({id:image.id,args,matrix:matrix.slice()});
 var renderSnapshot=()=>JSON.stringify({canonical:{stats,statusEffects,slitherSpd,party:persistentParty.serialize(),player,day,tick,location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get())},
 scene:seraLioraCutscene,walk:seraLioraGuestRoomWalk,courtyard:seraLioraCourtyard,breakfast:seraLioraBreakfast,
 story:storyBattle.getState(token),view:storyBattle.getView(token),save:localStorage.getItem('verdantVale_save')});
 var renderBefore=renderSnapshot();drawPartyBattle(storyBattle.getView(token));`);
 assert.equal(g.run('renderSnapshot()'),g.run('renderBefore'));refs(g);assert.equal(g.run('matrixStack.length'),0);
 const imageIds=['cutaway_sera_walk_depth_v2','cutaway_liora_walk_courtyard_v1'];
 assert.deepEqual(J(g,'requested'),imageIds);const images=J(g,'images');assert.deepEqual(images.map(i=>i.id),imageIds);
 const slots=J(g,'partyBattleLayout(storyBattle.getView(token)).allies');
 images.forEach((image,i)=>{
  const [sx,sy,dx,dy]=image.matrix;assert.equal(sx,sy);assert.equal(sx,0.62,'both reuse one battle scale');
  const a=image.args,footX=i===0?a[4]+64:a[4]+a[6]/2,footY=i===0?a[5]+184:a[5]+a[7];
  assert.equal(dx+sx*footX,slots[i].x);assert.equal(dy+sy*footY,g.run('PARTY_COMBAT_ALLY_SPRITES.'+(i===0?'sera':'liora')+'.anchorY'));
  assert.ok(g.run('Object.hasOwn(IMAGE_ASSET_REGISTRY,'+JSON.stringify(image.id)+')'));assert.ok(fs.existsSync(path.join(__dirname,'../..',g.run('IMAGE_ASSET_REGISTRY['+JSON.stringify(image.id)+'].path'))));
 });
 g.run('storyBattle.reset()');
 const idle=fresh();create(idle);const before=canonical(idle),state=J(idle,'storyBattle.getState(token)'),seq=idle.run('combatEnemyInstanceSequence');
 assert.throws(()=>idle.run("canonicalPartyCombat.enter({enemies:['enemy_marsh_wisp'],escape:'blocked'})"),/story_battle/);
 assert.throws(()=>idle.run('startWardenCombat()'),/story_battle/);
 for(const source of ["persistentParty.useFieldItem('lely','Potion')","persistentParty.unequipFieldEquipment('lely','weapon')","persistentParty.recover()","persistentParty.awardRewards({id:'story_ownership_probe',xp:0,gold:1,items:[]})"])assert.throws(()=>idle.run(source),/Invalid persistent party/);assert.equal(idle.run("partyCombatLab.enter('lely_esla_one')"),false);
 assert.equal(idle.run('combatEnemyInstanceSequence'),seq);assert.equal(idle.run('combat.mode'),null);assert.equal(idle.run('combatPlayerState.hasParty()'),false);assert.deepEqual(J(idle,'storyBattle.getState(token)'),state);assert.equal(canonical(idle),before);refs(idle);idle.run('storyBattle.reset()');
});

test('late resolver failure retains consumed temporary resources and cannot retry or refund',()=>{
 const g=fresh();enemy(g,{hp:1000,maxHp:1000,atk:1,def:0,spd:1});g.run("profiles[0].hp=80;inventory=['Potion'];");
 const before=canonical(g);create(g);const committed=J(g,'storyBattle.getState(token)');begin(g);item(g,'Potion',0);attacks(g);
 g.run(`var lateDraws=0;Math.random=()=>{if(++lateDraws>6)throw Error('late resolver failure');return 0.5;};`);
 assert.throws(()=>act(g,'commitRound'),/late resolver failure/);assert.equal(g.run('lateDraws'),7);
 const partial=J(g,'combatPlayerState.getCommandView()');assert.ok(!partial.inventory.includes('Potion'),'item consumption remains applied');assert.ok(partial.party[0].hp>80,'healing remains applied');assert.ok(partial.enemies[0].hp<1000,'ordinary attack already changed HP');
 assert.equal(g.run('storyBattle.getState(token).phase'),'fault');assert.deepEqual(J(g,'storyBattle.getState(token).party'),committed.party,'uncommitted context snapshot is not a runtime refund');
 assert.equal(act(g,'commitRound'),false);assert.equal(g.run('storyBattle.complete(token)'),false);assert.throws(()=>begin(g));assert.equal(g.run('lateDraws'),7);assert.deepEqual(J(g,'combatPlayerState.getCommandView()'),partial);
 assert.equal(canonical(g),before);refs(g);assert.equal(g.run('storyBattle.reset()'),true);assert.equal(g.run('combatPlayerState.getCommandView()'),null);assert.equal(g.run('combat.mode'),null);assert.equal(canonical(g),before);refs(g);
});

module.exports={name:'Story battle context: shared attacks, temporary resources and lifecycle isolation',run(){for(const {name,run}of tests){try{run();}catch(e){e.message=name+': '+e.message;throw e;}}}};
