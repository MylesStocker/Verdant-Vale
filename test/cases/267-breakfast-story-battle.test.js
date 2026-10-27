'use strict';
const assert=require('assert/strict'),fs=require('fs');
const {createContext}=require('../harness');
const {completeEnding}=require('../sera-liora-courtyard-helpers');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function context({fragile=false}={}){const read=fs.readFileSync;
 try{fs.readFileSync=function(file,...args){let source=read.call(this,file,...args);if(typeof source!=='string')return source;
  if(String(file).endsWith('/combat.js')){const marker="stage='playback';const playback=combatPlayerState.createRoundPlayback(result)";assert.equal(source.split(marker).length,2);source=source.replace(marker,'window.__breakfastResult=result;'+marker);}
  if(String(file).endsWith('/story-battle.js')){assert.equal(source.split('return token;').length,2);source=source.replace('return token;','window.__breakfastToken=token;return token;');}
  if(fragile&&String(file).endsWith('/sera-liora-battle-profiles.js'))source=source.replace('hp:220,maxHp:220','hp:1,maxHp:220').replace('hp:290,maxHp:290','hp:1,maxHp:290');
  return source;
 };return createContext();}finally{fs.readFileSync=read;}
}
function fresh(options={}){const g=context(options);g.press('Enter');g.press('Enter');g.run(`window.Image=function(){};Object.defineProperty(window.Image.prototype,'src',{set:function(value){this._src=value;const metadata=Object.values(IMAGE_ASSET_REGISTRY).find(m=>m.path===value);this.naturalWidth=metadata.width;this.naturalHeight=metadata.height;this.onload();}});
 ['sera_liora_opening','sera_liora_courtyard','sera_liora_breakfast'].forEach(preloadImageAssetBundle);
 Math=Object.create(Math);var calls=0,used=[];Math.random=()=>{calls++;throw Error('unexpected breakfast RNG');};
 var canonicalRefs={stats,items:stats.items,weapon:stats.weapon,armor:stats.armor,shield:stats.shield,accessory:stats.accessory,statuses:statusEffects,player};`);return g;}
const resources=g=>g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),day,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),save:localStorage.getItem('verdantVale_save')})`);
const view=g=>J(g,'seraLioraBreakfastBattle.getView()'),controller=g=>J(g,'seraLioraBreakfastBattle.getState()');
function refs(g){assert.equal(g.run('canonicalRefs.stats===stats&&canonicalRefs.items===stats.items&&canonicalRefs.weapon===stats.weapon&&canonicalRefs.armor===stats.armor&&canonicalRefs.shield===stats.shield&&canonicalRefs.accessory===stats.accessory&&canonicalRefs.statuses===statusEffects&&canonicalRefs.player===player'),true);}
function preview(g){assert.equal(g.run('seraLioraBreakfastBattle.preview()'),true);assert.equal(controller(g).stage,'fade_in');assert.equal(g.run('storyBattle.hasContext()'),false);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);g.frames(40);assert.equal(controller(g).stage,'battle');assert.equal(view(g).phase,'awaiting_action');}
function choose(g,command){let n=0;while(view(g).selectedCommand!==command){assert.ok(n++<6);g.press('ArrowRight');}g.press('Enter');}
function attack(g,slot=0){choose(g,'attack');const id=view(g).enemies[slot].instanceId;let n=0;while(view(g).selectedTargetInstanceId!==id){assert.ok(n++<4);g.press('ArrowRight');}g.press('Enter');}
function technique(g,id,target=0){choose(g,'resonance');let n=0;while(view(g).selectedTechniqueId!==id){assert.ok(n++<5);g.press('ArrowDown');}g.press('Enter');if(view(g).targetMode!=='all'){const targetId=view(g).enemies[target].instanceId;let k=0;while(view(g).selectedTargetInstanceId!==targetId){assert.ok(k++<4);g.press('ArrowRight');}}g.press('Enter');}
function initiative(g,{combined=false,order}={}){const v=view(g),a=combined?[{id:v.party[0].instanceId,w:Math.min(...v.party.map(m=>m.effective.spd))}]:v.party.filter(m=>m.hp>0).map(m=>({id:m.instanceId,w:m.effective.spd}));const pool=[...a,...v.enemies.filter(e=>e.hp>0).map(e=>({id:e.instanceId,w:e.spd}))],wanted=order?order.map(id=>(id[0]==='a'?v.party:v.enemies)[+id.slice(1)].instanceId):pool.map(m=>m.id),out=[];
 for(const id of wanted.slice(0,-1)){const i=pool.findIndex(m=>m.id===id);assert.ok(i>=0);out.push((pool.slice(0,i).reduce((s,m)=>s+m.w,0)+pool[i].w/2)/pool.reduce((s,m)=>s+m.w,0));pool.splice(i,1);}return out;}
function commit(g,{combined=false,order,targets,execution=[]}={}){assert.equal(view(g).phase,'ready');const v=view(g),targetTape=v.party.filter(m=>m.hp>0).length>1?(targets||v.enemies.filter(e=>e.hp>0).map(()=>0)):[],tape=[...targetTape,...initiative(g,{combined,order}),...execution];g.run('var tape='+JSON.stringify(tape)+`,used=[];Math.random=()=>{calls++;if(used.length===tape.length)throw Error('breakfast tape exhausted');const value=tape[used.length];used.push(value);return value;};`);try{g.press('Enter');assert.equal(controller(g).stage,'battle',controller(g).failure||'commit remains battle');assert.deepEqual(J(g,'used'),tape);}finally{g.run(`Math.random=()=>{calls++;throw Error('unexpected breakfast RNG');};`);}return J(g,'__breakfastResult');}
function playback(g){let n=0;while(['playback','playback_complete'].includes(view(g).phase)){assert.ok(n++<100);if(g.run('partyBattleOffensiveResonanceAnimation.blocksAdvance(seraLioraBreakfastBattle.getView())||partyBattleQuickbloomAnimation.blocksAdvance(seraLioraBreakfastBattle.getView())'))g.frames(1);else g.press('Enter');}return view(g);}
function finishVictory(g){
 assert.equal(view(g).phase,'victory');assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0);
 g.press('Enter');assert.equal(controller(g).stage,'aftermath');assert.equal(g.run('breakfastBeetleViews().length'),0);
 const stale=g.run('dialogue.callbacks[0]');let n=0;while(g.run('dialogue.open')){assert.ok(n++<12);g.press('Enter');}
 assert.equal(n,8,'keeper/crash and storeroom caution/Eclipse suggestion');assert.equal(controller(g).stage,'fade_in');g.frames(40);
 assert.equal(controller(g).fight,2);assert.equal(view(g).enemies.length,1);assert.equal(view(g).enemies[0].id,'enemy_large_buzzy_beetle');
 technique(g,'null',0);technique(g,'rainbow',0);assert.equal(commit(g).outcome,'victory');playback(g);g.press('Enter');
 assert.equal(controller(g).stage,'aftermath');n=0;while(g.run('dialogue.open')){assert.ok(n++<4);g.press('Enter');}assert.equal(n,3);
 assert.equal(controller(g).stage,'ending_fade_out');assert.equal(g.run('activeMap===BETHANY_GUEST_ROOM_MAP'),true);
 assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0);assert.equal(g.run('storyBattle.hasContext()'),true);
 completeEnding(g);const wake=J(g,'dialogue.pages');stale();g.frames(50);assert.deepEqual(J(g,'dialogue.pages'),wake);assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),1);return stale;
}
function spellVictory(g,reverse=false){technique(g,'null',reverse?1:0);technique(g,'rainbow',reverse?0:1);const r=commit(g);assert.equal(r.outcome,'victory');playback(g);return r;}
function fullRoute(g,story=false){if(story)g.run("transitionToLocation({mapId:'DREAM_MAP',x:240,y:240,facing:'down'});startSeraLioraCutaway(true);");else assert.equal(g.run('debugPlaySeraLioraCutaway()'),true);g.press(' ');g.frames(18);g.press(' ');g.frames(40);let n=0;while(g.run('seraLioraCutscene.beat')<21){assert.ok(n++<40);g.press(' ');}g.press(' ');
 for(const [key,frames]of [['s',30],['a',130],['w',120],['a',60]]){g.hold(key);g.frames(frames);g.release(key);}g.press('a');g.press('Enter');assert.equal(g.run('seraLioraCutscene.phase'),'courtyard_free');g.hold('s');g.frames(20);g.release('s');g.hold('d');g.frames(110);g.release('d');
 n=0;while(!g.run('seraLioraBreakfastBattle.isActive()')&&n++<2000){if(g.run('dialogue.open'))g.press('Enter');else if(g.run("seraLioraCutscene.phase==='breakfast_free'")){g.hold('d');g.frames(45);g.release('d');}else g.frames(1);}assert.ok(n<2000);g.frames(40);assert.equal(controller(g).stage,'battle');}
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const d of Object.values(Object.getOwnPropertyDescriptors(v))){assert.ok(Object.hasOwn(d,'value'));frozen(d.value);}}}

test('actual keyboard bedroom/courtyard route preserves both battles and naturally returns after breakfast',()=>{
 const g=fresh(),before=resources(g);fullRoute(g);const v=view(g);assert.equal(v.commandSet,'standard');assert.deepEqual(v.party.map(m=>[m.characterId,m.hp]),[['sera',220],['liora',290]]);assert.deepEqual(v.enemies.map(e=>e.id),['enemy_buzzy_beetle','enemy_buzzy_beetle']);assert.notEqual(v.enemies[0].instanceId,v.enemies[1].instanceId);assert.equal(g.run('canonicalPartyCombat.isActive()||partyCombatLab.isActive()'),false);frozen(g.run('seraLioraBreakfastBattle.getView()'));
 spellVictory(g);finishVictory(g);assert.equal(resources(g),before);refs(g);assert.equal(g.run('sera_liora_opening_complete'),false,'preview remains progression-neutral');
});

test('authored beetle bounds require two landed noncritical attacks throughout variance and allow earlier critical kills',()=>{
 const g=fresh(),template=J(g,'ENEMY_TEMPLATE_REGISTRY.enemy_buzzy_beetle');assert.deepEqual([template.hp,template.maxHp,template.atk,template.def,template.spd],[64,64,2,4,4]);assert.deepEqual([template.xp,template.goldMin,template.goldMax],[0,0,0]);assert.equal(g.run("ENEMY_TEMPLATE_POOLS.some(pool=>pool.templates.some(e=>e.id==='enemy_buzzy_beetle'))"),false);
 for(const member of J(g,'SERA_LIORA_OPENING_PROFILES')){const item=J(g,'ITEM_REGISTRY['+JSON.stringify(member.equipment.weapon)+']'),atk=member.atk+item.bonus;const damage=roll=>g.run('attackDamageNumbers('+atk+','+template.def+',ATTACK_VARIANCE_MIN+'+roll+'*ATTACK_VARIANCE_SPAN,false).dmg');const low=damage(0),high=damage(1-Number.EPSILON);assert.ok(high<template.hp);assert.ok(low*2>=template.hp);assert.ok(g.run('resonanceDamageAmount(120,'+template.def+')')>=template.hp);}
 preview(g);for(const member of view(g).party)for(const critical of [false,true])for(const roll of [0,1-Number.EPSILON]){const def=g.run('playerIncomingMitigation(2,'+member.effective.def+',false)'),damage=g.run('attackDamageNumbers(2,'+def+',ATTACK_VARIANCE_MIN+'+roll+'*ATTACK_VARIANCE_SPAN,'+critical+').dmg');assert.ok(damage>=1&&damage<=2,'incoming damage remains negligible');}
 g.run('resetSeraLioraBreakfast()');
 const h=fresh();preview(h);attack(h,0);attack(h,1);const r=commit(h,{execution:[1-Number.EPSILON,0,0.99,1-Number.EPSILON,0,0.99]});assert.equal(r.outcome,'victory');assert.ok(r.events.filter(e=>e.type==='attack'&&e.side==='ally').every(e=>e.critical));h.run('resetSeraLioraBreakfast()');
});

for(const variance of [0,1-Number.EPSILON])test('actual ordinary attacks take two rounds at variance '+variance+' and grant no canonical rewards',()=>{
 const g=fresh(),before=resources(g);preview(g);attack(g,0);attack(g,1);const one=commit(g,{targets:[0,0.75],execution:[variance,0.99,0.99,variance,0.99,0.99,0.5,0.99,0.99,0.5,0.99,0.99]});assert.equal(one.outcome,'ongoing');assert.ok(one.after.enemies.every(e=>e.hp>0));assert.equal(one.events.filter(e=>e.type==='attack'&&e.side==='ally').length,2);playback(g);attack(g,0);attack(g,1);const two=commit(g,{execution:[variance,0.99,0.99,variance,0.99,0.99]});assert.equal(two.outcome,'victory');assert.equal(two.events.filter(e=>e.type==='attack'&&e.side==='ally').length,2);playback(g);finishVictory(g);assert.equal(resources(g),before);refs(g);
});

for(const reverse of [false,true])test('real Null and Rainbow kill either actual beetle with no spell action RNG: '+reverse,()=>{
 const g=fresh();preview(g);const before=view(g),r=spellVictory(g,reverse),events=r.events.filter(e=>e.type==='resonance_damage');assert.deepEqual(events.map(e=>e.techniqueId),['null','rainbow']);assert.deepEqual(events.map(e=>e.targetId),[before.enemies[reverse?1:0].instanceId,before.enemies[reverse?0:1].instanceId]);assert.ok(events.every(e=>e.attemptedDamage===116&&e.appliedDamage===64));assert.equal(g.run('used.length'),5);g.run('resetSeraLioraBreakfast()');
});

test('keyboard Eclipse requires both explicit choices and uses one minimum-SPD simultaneous shared action',()=>{
 const g=fresh();preview(g);technique(g,'eclipse');assert.equal(view(g).phase,'awaiting_action');assert.equal(view(g).allyActions.length,1);assert.equal(view(g).nextActorId,view(g).party[1].instanceId);assert.deepEqual(view(g).enabledCommands,['resonance']);g.press('Enter');assert.equal(view(g).phase,'technique');assert.equal(view(g).selectedTechniqueId,'eclipse');g.press('Enter');assert.equal(view(g).targetMode,'all');assert.equal(view(g).allyActions.length,1);g.press('Enter');const r=commit(g,{combined:true});assert.equal(r.order.filter(a=>a.side==='ally').length,1);assert.equal(r.order.find(a=>a.side==='ally').spd,14);assert.equal(r.initiative.length,2);const event=r.events.find(e=>e.type==='resonance_damage_all');assert.deepEqual(event.elements,['void','prism']);assert.equal(event.hits.length,2);assert.ok(event.hits.every(h=>h.appliedDamage===64));assert.equal(g.run('used.length'),4);playback(g);assert.equal(controller(g).stage,'battle','terminal acknowledgement alone does not consume completion');finishVictory(g);
});

test('Run cannot escape the yard battle or open a retry, and uses no escape RNG',()=>{
 const g=fresh(),before=resources(g);preview(g);const token=g.run('__breakfastToken');assert.equal(view(g).escapePolicy,'blocked');
 choose(g,'run');choose(g,'run');const r=commit(g,{execution:[0.5,0.99,0.99,0.5,0.99,0.99]});
 assert.equal(r.outcome,'ongoing');assert.equal(r.events.filter(e=>e.type==='run').length,2);assert.ok(r.events.filter(e=>e.type==='run').every(e=>e.allowed===false&&e.success===false));
 assert.equal(playback(g).phase,'awaiting_action');assert.equal(controller(g).stage,'battle');assert.equal(controller(g).attempt,1);assert.equal(g.run('__breakfastToken'),token);
 assert.equal(g.run('dialogue.open'),false);assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0);assert.equal(resources(g),before);refs(g);g.run('resetSeraLioraBreakfast()');
});

test('ordinary defeat retries only the temporary context and never wakes or recovers Lely',()=>{
 const g=fresh({fragile:true});g.run('stats.hp=0;');const before=resources(g);preview(g);const initial=controller(g).resources;attack(g,0);attack(g,1);const r=commit(g,{order:['e1','e0','a0','a1'],targets:[0,0.75],execution:[0.5,0.99,0.99,0.5,0.99,0.99]});assert.equal(r.outcome,'defeat');playback(g);g.press('Enter');assert.equal(controller(g).stage,'retry');assert.equal(g.run('activeMap===BETHANY_GUEST_ROOM_MAP'),true);assert.equal(g.run('seraLioraGuestRoomWalk.completionCount'),0);g.press('Enter');g.frames(40);assert.equal(controller(g).attempt,2);assert.deepEqual(controller(g).resources.party,initial.party,'retry restores the immutable test build, not canonical recovery');assert.equal(resources(g),before);refs(g);g.run('resetSeraLioraBreakfast()');
});

test('fade, battle, retry and reset keep saves blocked and stale tokens cannot reopen the scene',()=>{
 const g=fresh();assert.equal(g.run('saveGame()'),true);const save=g.run("localStorage.getItem('verdantVale_save')");assert.equal(g.run('seraLioraBreakfastBattle.preview()'),true);assert.equal(g.run('saveGame()||loadGame()'),false);g.frames(40);const token=g.run('__breakfastToken');g.run('window.__oldToken=__breakfastToken;');g.press('m');g.press('`');g.hold('d');g.frames(10);g.release('d');assert.equal(g.run('menu.open||debugMenu.open'),false);assert.equal(g.run('saveGame()||loadGame()'),false);g.run('resetSeraLioraBreakfast()');assert.equal(g.run('seraLioraBreakfastBattle.isActive()||storyBattle.hasContext()'),false);assert.throws(()=>g.run('storyBattle.getState(window.__oldToken)'),/stale|unknown/);assert.equal(g.run("localStorage.getItem('verdantVale_save')"),save);assert.equal(g.run('combat.mode'),null);assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.ok(token);
});

test('generic callers cannot forge scene ownership with an extra argument or claim a second scene bridge',()=>{
 const g=fresh(),before=resources(g);g.run('seraLioraCutscene.active=true;var hooks=0;');assert.throws(()=>g.run("storyBattle.createContext({id:'forged',party:SERA_LIORA_OPENING_PROFILES,inventory:[],resonance:SERA_LIORA_OPENING_RESONANCE},()=>{hooks++;return true;})"));assert.equal(g.run('hooks'),0);assert.throws(()=>g.run('storyBattle.claimSceneBridge(()=>true)'));assert.equal(g.run('storyBattle.hasContext()'),false);assert.equal(g.run('seraLioraBreakfastBattle.start()'),false);assert.equal(resources(g),before);assert.equal(g.run('calls'),0);
});

test('authentic historical playback and shared rendering remain read-only in the playable scene',()=>{
 const g=fresh();preview(g);technique(g,'eclipse');technique(g,'eclipse');commit(g,{combined:true});const before=resources(g),scene=J(g,'seraLioraBreakfastBattle.getState()'),session=J(g,'seraLioraBreakfastBattle.getView()'),calls=g.run('calls');g.run(`resonanceDamageAmount=()=>{throw Error('live damage called');};var reel=combatPlayerState.createRoundPlayback(__breakfastResult);`);frozen(g.run('reel'));for(let i=0;i<g.run('reel.frameCount');i++)g.run('combatPlayerState.projectRoundPlaybackFrame(reel,'+i+');');g.renderFrame();assert.equal(resources(g),before);assert.deepEqual(controller(g),scene);assert.deepEqual(view(g),session);assert.equal(g.run('calls'),calls);g.run('resetSeraLioraBreakfast()');
});

test('resolver failure stays diagnostic and reset discards only transient state',()=>{
 const g=fresh(),before=resources(g);preview(g);attack(g,0);attack(g,1);g.run(`Math.random=()=>{calls++;throw Error('injected breakfast failure');};`);g.press('Enter');assert.equal(controller(g).stage,'fault');assert.match(controller(g).failure,/injected breakfast failure/);const failed=controller(g);g.press('Enter');g.frames(20);assert.deepEqual(controller(g),failed);assert.equal(g.run('saveGame()||loadGame()'),false);g.renderFrame();assert.equal(resources(g),before);g.run('resetSeraLioraBreakfast()');assert.equal(g.run('storyBattle.hasContext()||seraLioraBreakfastBattle.isActive()'),false);assert.equal(resources(g),before);refs(g);
});

test('missing assets fail closed and reset invalidates pending asset continuations',async()=>{
 const g=fresh();g.run('loadedImageAsset=()=>null;');assert.equal(g.run('seraLioraBreakfastBattle.preview()'),true);assert.equal(controller(g).stage,'assets');assert.equal(g.run('saveGame()||loadGame()'),false);for(let i=0;i<5;i++)await Promise.resolve();assert.equal(controller(g).stage,'fault');assert.equal(g.run('storyBattle.hasContext()'),false);g.run('resetSeraLioraBreakfast()');
 const h=fresh();h.run('loadedImageAsset=()=>null;seraLioraBreakfastBattle.preview();resetSeraLioraBreakfast();');for(let i=0;i<5;i++)await Promise.resolve();assert.equal(h.run('seraLioraBreakfastBattle.isActive()||storyBattle.hasContext()'),false);
});
test('the existing debug checkpoint menu directly enters the scene without replacing canonical character data',()=>{
 const g=fresh(),before=resources(g);g.press('`');g.run('debugMenu.cursor=13;');g.press('Enter');assert.equal(g.run('storyCheckpointLab.isOpen()'),true);g.press('ArrowDown');g.press('ArrowDown');assert.equal(g.run('storyCheckpointLab.getView().checkpoints[storyCheckpointLab.getView().cursor].id'),'sera_liora_battle_ready');g.press('Enter');assert.equal(g.run('storyCheckpointLab.getView().phase'),'confirm');assert.equal(g.run('storyCheckpointLab.getView().sceneOnly'),true);g.press('Enter');assert.equal(controller(g).stage,'fade_in');assert.equal(resources(g),before);assert.equal(g.run('saveGame()||loadGame()'),false);g.frames(40);assert.equal(controller(g).stage,'battle');assert.deepEqual(view(g).enemies.map(e=>e.id),['enemy_buzzy_beetle','enemy_buzzy_beetle']);assert.equal(resources(g),before);refs(g);g.run('resetSeraLioraBreakfast()');
});

test('true story entry completes only after the full breakfast ending and natural hospital return',()=>{
 const g=fresh(),before=JSON.parse(resources(g));fullRoute(g,true);spellVictory(g);finishVictory(g);before.flags=before.flags.map(([key,value])=>[key,key==='sera_liora_opening_complete'?true:value]);assert.deepEqual(JSON.parse(resources(g)),before);refs(g);assert.equal(g.run('activeMap===DRENWICK_INFIRMARY_MAP'),true);assert.equal(g.run('sera_liora_opening_complete'),true);assert.equal(controller(g),null);
});

test('an ordinary checkpoint clears the battle and invalidates previously captured aftermath callbacks',()=>{
 const g=fresh();preview(g);spellVictory(g);g.press('Enter');assert.equal(controller(g).stage,'aftermath');const stale=g.run('dialogue.callbacks[0]');g.run('window.__checkpointOldToken=__breakfastToken;');assert.equal(g.run('storyCheckpointLab.apply("mq5_assignment_ready")'),true);const after=resources(g),location=g.run('JSON.stringify(snapshotLocationState())');assert.equal(g.run('seraLioraBreakfastBattle.isActive()||storyBattle.hasContext()'),false);assert.throws(()=>g.run('storyBattle.getState(window.__checkpointOldToken)'),/stale|unknown/);stale();g.frames(50);assert.equal(resources(g),after);assert.equal(g.run('JSON.stringify(snapshotLocationState())'),location);assert.equal(g.run('seraLioraBreakfastBattle.isActive()'),false);
});

// Read alpha directly from the approved RGBA PNGs. Canvas calls below remain
// simulated; these bounds prevent transparent sheet padding from counting as a head.
function alphaBounds(assetPath,rect){
 const png=fs.readFileSync(require('path').join(__dirname,'../..',assetPath));assert.equal(png.readUInt32BE(0),0x89504e47);const width=png.readUInt32BE(16),height=png.readUInt32BE(20);assert.equal(png[24],8);assert.equal(png[25],6);assert.equal(png[28],0);
 const chunks=[];for(let offset=8;offset<png.length;){const length=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);if(type==='IDAT')chunks.push(png.subarray(offset+8,offset+8+length));offset+=length+12;}
 const data=require('zlib').inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=Buffer.alloc(stride*height);
 for(let y=0;y<height;y++){const filter=data[y*(stride+1)];assert.ok(filter>=0&&filter<=4);for(let x=0;x<stride;x++){const left=x>=4?pixels[y*stride+x-4]:0,up=y?pixels[(y-1)*stride+x]:0,corner=y&&x>=4?pixels[(y-1)*stride+x-4]:0;let prediction=0;if(filter===1)prediction=left;if(filter===2)prediction=up;if(filter===3)prediction=Math.floor((left+up)/2);if(filter===4){const p=left+up-corner,a=Math.abs(p-left),b=Math.abs(p-up),c=Math.abs(p-corner);prediction=a<=b&&a<=c?left:b<=c?up:corner;}pixels[y*stride+x]=(data[y*(stride+1)+x+1]+prediction)&255;}}
 const [sx,sy,sw,sh]=rect;let minX=sw,minY=sh,maxX=-1,maxY=-1;for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(pixels[((sy+y)*width+sx+x)*4+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}assert.ok(maxX>=0);return [minX,minY,maxX+1,maxY+1];
}

test('daylight battle presentation crops the approved plate and keeps actual sprite envelopes on clear separate floor',()=>{
 const g=fresh();preview(g);assert.equal(view(g).backgroundAssetId,'cutaway_bethany_breakfast_v1');assert.equal(view(g).stagingId,'bethany_courtyard');
 require('./149-formation-battle-rendering.test').record(g);g.run(`var imageCalls=[];ctx.drawImage=(image,...args)=>imageCalls.push({path:image._src,args,matrix:matrix.slice()});`);const before=resources(g),scene=controller(g),battle=view(g),calls=g.run('calls');g.renderFrame();assert.equal(resources(g),before);assert.deepEqual(controller(g),scene);assert.deepEqual(view(g),battle);assert.equal(g.run('calls'),calls);
 const images=J(g,'imageCalls'),background=images[0];assert.equal(background.path,g.run("IMAGE_ASSET_REGISTRY.cutaway_bethany_breakfast_v1.path"));assert.deepEqual(background.args,[0,100,512,297,0,0,512,297]);
 const sprites=images.filter(image=>image.path.includes('/sprites/')&&image.args.length===8).map(image=>{const a=image.args,b=alphaBounds(image.path,a.slice(0,4)),[sx,sy,tx,ty]=image.matrix;return {path:image.path,left:tx+sx*(a[4]+b[0]*a[6]/a[2]),top:ty+sy*(a[5]+b[1]*a[7]/a[3]),right:tx+sx*(a[4]+b[2]*a[6]/a[2]),bottom:ty+sy*(a[5]+b[3]*a[7]/a[3])};});
 const beetles=sprites.filter(s=>s.path.endsWith('/buzzy-beetle.png')),heroes=sprites.filter(s=>s.path.endsWith('/sera-walk.png')||s.path.endsWith('/liora-walk.png'));assert.equal(beetles.length,2);assert.equal(heroes.length,2);for(const s of [...beetles,...heroes]){assert.ok(s.top>=64&&s.bottom<297,'sprite stays between status and commands');assert.ok(s.left>0&&s.right<512,'sprite stays on screen');}
 for(const b of beetles)for(const h of heroes)assert.ok(b.left>h.right||b.right<h.left||b.bottom<h.top||b.top>h.bottom,'actors do not overlap');
 const layout=J(g,'partyBattleLayout(seraLioraBreakfastBattle.getView())');beetles.forEach((s,i)=>assert.ok(Math.abs(s.bottom-layout.enemies[i].anchorY)<.001,'feet meet authored ground'));g.run('resetSeraLioraBreakfast()');
});

test('generic story presentation rejects invalid asset IDs and floor bounds before RNG or identity allocation',()=>{
 const g=fresh();g.run("var presentationToken=storyBattle.createContext({id:'presentation_contract',party:SERA_LIORA_OPENING_PROFILES,inventory:[]});");const before=resources(g),state=J(g,'storyBattle.getState(presentationToken)'),sequence=g.run('combatEnemyInstanceSequence');
 for(const fields of ["backgroundAssetId:'missing_asset'","backgroundAssetId:'cutaway_sera_walk_depth_v2'","backgroundAssetId:null","enemyFloorY:139","enemyFloorY:213","enemyFloorY:156.5","enemyFloorY:NaN","enemyFloorY:'156'"]){assert.throws(()=>g.run("storyBattle.begin(presentationToken,{encounter:['enemy_buzzy_beetle','enemy_buzzy_beetle'],escape:'blocked',presentation:{label:'Invalid presentation',"+fields+"}})"));assert.equal(g.run('combatEnemyInstanceSequence'),sequence);assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.deepEqual(J(g,'storyBattle.getState(presentationToken)'),state);assert.equal(resources(g),before);assert.equal(g.run('calls'),0);}
 g.run("storyBattle.begin(presentationToken,{encounter:['enemy_buzzy_beetle','enemy_buzzy_beetle'],escape:'blocked',presentation:{label:'Default presentation'}});");const defaultView=J(g,'storyBattle.getView(presentationToken)');assert.equal(Object.hasOwn(defaultView,'backgroundAssetId'),false);assert.equal(Object.hasOwn(defaultView,'enemyFloorY'),false);const layout=J(g,'partyBattleLayout(storyBattle.getView(presentationToken))');layout.enemies.forEach(position=>assert.equal(position.anchorY,212));g.run('storyBattle.discard(presentationToken)');
 for(const floor of [140,212]){g.run("presentationToken=storyBattle.createContext({id:'valid_boundary',party:SERA_LIORA_OPENING_PROFILES,inventory:[]});storyBattle.begin(presentationToken,{encounter:['enemy_buzzy_beetle','enemy_buzzy_beetle'],escape:'blocked',presentation:{label:'Valid boundary',backgroundAssetId:'cutaway_bethany_breakfast_v1',enemyFloorY:"+floor+"}});");assert.equal(g.run('storyBattle.getView(presentationToken).enemyFloorY'),floor);g.run('storyBattle.discard(presentationToken)');}assert.equal(resources(g),before);refs(g);
});

module.exports={name:'Playable Bethany breakfast battle: actual keyboard route, Buzzy Beetles and isolated retry/return lifecycle',checks,async run(){for(const {name,run}of checks){try{await run();}catch(e){e.message=name+': '+e.message;throw e;}}}};
