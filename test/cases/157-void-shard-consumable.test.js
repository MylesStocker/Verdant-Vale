'use strict';

const assert=require('assert/strict');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const HIT=[0.5,0.99,0.99];
const command={type:'item',itemId:'Void Shard'};
function fresh(count=2) {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=()=>{throw Error('unexpected shard RNG');};
    dialogue.open=false;dialogue.callbacks=null;menu.open=false;statusEffects=[];
    stats.hp=500;stats.maxHp=500;stats.atk=8;stats.def=2;stats.spd=7;
    stats.items=[createItem('Void Shard')];stats.weapon=stats.armor=stats.shield=stats.accessory=null;
    resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);`);
  if(count)g.run(`initializeFormationState(${JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:'enemy_marsh_wisp',slot})))},
    {escape:'fastest_living'});combat.enemies.forEach(e=>{e.hp=100;e.maxHp=100;});`);
  return g;
}
function tape(g,values,work) {
  g.run(`var shardTape=${JSON.stringify(values)},shardUsed=0;
    Math.random=()=>{if(shardUsed===shardTape.length)throw Error('tape exhausted');return shardTape[shardUsed++];};`);
  try {if(typeof work==='string')g.run(work);else work();assert.equal(g.run('shardUsed'),values.length,'exact RNG tape');}
  finally {g.run(`Math.random=()=>{throw Error('unexpected shard RNG');};`);}
}
function state(g) {
  return g.run(`JSON.stringify({stats,statusEffects,slitherSpd,day,tick,player,
    location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),
    members:combat.enemies,observations:combat.enemies.map(e=>[e.instanceId,e.slot,e.observeCount,e.escapeUnlocked]),
    mode:combat.mode,active:combat.active,message:combat.message,queue:combat.messageQueue,
    pending:[combat.pendingVictory,combat.pendingDefeat,combat.pendingEscape],
    rounds:formationRounds.getView(),coordination:formationRounds.coordination(),
    effects:formationEffectSnapshot(),sequence:combatEnemyInstanceSequence,dialogue,choice,
    save:localStorage.getItem('verdantVale_save')})`);
}
function round(g,values,cmd=command) {
  tape(g,values,'var shardResult=resolveFormationRound('+JSON.stringify(cmd)+');');
  const after=state(g);
  g.run('var shardReel=createFormationRoundPlayback(shardResult);');
  const r=J(g,'shardResult'),p=J(g,'shardReel');
  for(let i=p.frameCount-1;i>=0;i--)g.run('projectFormationPlaybackFrame(shardReel,'+i+');');
  assert.equal(state(g),after,'playback never reapplies HP, inventory, or other effects');
  assert.deepEqual(p.frames.at(-1).enemies.map(e=>e.hp),J(g,'combat.enemies.map(e=>e.hp)'));
  assert.equal(p.frames.at(-1).player.hp,g.run('stats.hp'));
  return {r,p,event:r.events.find(e=>e.type==='item')};
}
function trio(order=[0,1,2]) {
  const g=fresh(0);
  g.run(`initializeFormationState(${JSON.stringify(order)}.map((i,slot)=>({enemyId:GALLERY_RECEIVER_TEMPLATES[i].id,slot})));`);
  return g;
}
function loss(event) {return event.before.enemies.map((e,i)=>e.hp-event.after.enemies[i].hp);}

test('registry and chest agree: combat-only, all-enemy consumable, unchanged price and Fen Mask',()=>{
  const g=fresh(0),def=J(g,"ITEM_REGISTRY['Void Shard']");
  assert.deepEqual(def,{name:'Void Shard',type:'throwable',damage:60,minDamage:50,targetsAll:true,battleOnly:true,price:360});
  assert.deepEqual(J(g,'SLUICE_LEVEL3_CHEST.item'),def);
  assert.equal(g.run("slotForType(ITEM_REGISTRY['Void Shard'].type)"),null);
  assert.equal(g.run("itemStatLabel(ITEM_REGISTRY['Void Shard'])"),'DMG 50-60 · all');
  assert.deepEqual(J(g,"ITEM_REGISTRY['Fen Mask']"),{name:'Fen Mask',type:'accessory',bonus:5,price:400});
});
for(const [def,damage] of [[0,60],[1,59],[4,56],[9,51],[10,50],[50,50],[Number.MAX_SAFE_INTEGER,50]])
test('deterministic damage at DEF '+def+' is '+damage,()=>{
  const g=fresh(0);
  tape(g,[],()=>assert.equal(g.run("offensiveItemDamage(ITEM_REGISTRY['Void Shard'],{def:"+def+'})'),damage));
});
for(const count of [2,3])test(count+' duplicates take independent defence-based damage in one action',()=>{
  const g=fresh(count);g.run('combat.enemies.forEach((e,i)=>e.def=i*5);');
  const members=g.run('combat.enemies'),ids=J(g,'combat.enemies.map(e=>e.instanceId)');
  const {r,p,event}=round(g,[...Array(count).fill(0),...Array(count).fill(HIT).flat()]);
  assert.deepEqual(loss(event),[60,55,50].slice(0,count));assert.equal(event.effect,'damage_all');
  assert.equal(r.events.filter(e=>e.type==='item').length,1);assert.equal(g.run('stats.items.length'),0);
  assert.equal(g.run('combat.enemies'),members);assert.deepEqual(J(g,'combat.enemies.map(e=>e.instanceId)'),ids);
  assert.equal(new Set(ids).size,count);assert.deepEqual(p.frames[0].enemies.map(e=>e.hp),Array(count).fill(100));
  assert.equal(g.run('formationRounds.getView().completedRounds'),1);
});
test('all-target damage executes after faster damage, and consumes just one duplicate item',()=>{
  const g=fresh();g.run("stats.items.push(createItem('Void Shard'));combat.enemies.forEach(e=>e.def=0);");
  const {r,event}=round(g,[0.99,0,...HIT,...HIT]);
  assert.deepEqual(r.events.map(e=>e.type),['attack','item','attack','round_end','outcome']);
  assert.equal(event.before.player.hp,497);assert.deepEqual(loss(event),[60,60]);
  assert.equal(g.run('stats.items.length'),1);
});
test('a defeated player never consumes the Shard or damages any enemy',()=>{
  const g=fresh();g.run('stats.hp=1;');const {r}=round(g,[0.99,0.99,...HIT]);
  assert.equal(r.outcome,'defeat');assert.equal(r.events.some(e=>e.type==='item'),false);
  assert.equal(g.run('stats.items.length'),1);assert.deepEqual(J(g,'combat.enemies.map(e=>e.hp)'),[100,100]);
});
test('retained dead members are not hit and consume neither initiative nor attack RNG',()=>{
  const g=fresh(3);g.run('combat.enemies[1].hp=0;combat.enemies.forEach(e=>e.def=0);');
  const {event}=round(g,[0,0,...HIT,...HIT]);assert.deepEqual(loss(event),[60,0,60]);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.slot)'),[0,1,2]);
});
test('killing every living member ends the round before any response or reward',()=>{
  const g=fresh(3);g.run('combat.enemies.forEach(e=>e.hp=1);');
  const gold=g.run('stats.gold'),xp=g.run('stats.xp'),flags=J(g,'QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])');
  const {r,event}=round(g,[0,0,0]);assert.equal(r.outcome,'victory');assert.deepEqual(loss(event),[1,1,1]);
  assert.deepEqual(r.events.map(e=>e.type),['item','round_end','outcome']);
  assert.equal(g.run('stats.gold'),gold);assert.equal(g.run('stats.xp'),xp);
  assert.deepEqual(J(g,'QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])'),flags);
  assert.equal(g.run('combat.pendingVictory'),false);assert.equal(g.run('combat.messageQueue.length'),0);
});
for(const order of [[0,1,2],[2,1,0],[1,0,2]])test('Keeper protects the entire blast even when killed: slots '+order,()=>{
  const g=trio(order),{r,event}=round(g,[0,0,0,...HIT]);
  const hp=Object.fromEntries(event.after.enemies.map(e=>[e.id,e.hp]));
  assert.deepEqual(hp,{enemy_gallery_receiver:26,enemy_gallery_caller:0,enemy_gallery_keeper:0});
  assert.equal(r.outcome,'ongoing');assert.equal(r.events.filter(e=>e.type==='skip').length,2);
  assert.equal(r.events.filter(e=>e.actorType==='enemy'&&e.type==='attack').length,1);
});
test('a previously defeated Keeper provides no protection',()=>{
  const g=trio();g.run('combat.enemies[2].hp=0;');
  const {r}=round(g,[0,0]);assert.equal(r.outcome,'victory');
});
test('Keeper retains its existing round-up rule for odd damage',()=>{
  const g=trio();g.run('combat.enemies[0].def=3;combat.enemies[0].hp=100;combat.enemies[0].maxHp=100;');
  const {event}=round(g,[0,0,0,...HIT]);assert.equal(loss(event)[0],29,'57 damage halves to 29');
});
test('killing Caller in the blast breaks its already-prepared heavy strike',()=>{
  const g=trio();
  round(g,[0,0,0,...HIT,...HIT],{type:'run'});
  g.run('acknowledgeFormationRound(shardReel,shardReel.frameCount-1);');
  const {r}=round(g,[0,0,0,...HIT]);
  assert.equal(r.events.filter(e=>e.type==='signal_broken').length,1);
  assert.equal(r.events.some(e=>e.type==='heavy_attack'),false);
  assert.equal(g.run('formationRounds.coordination().strikeRound'),0);
});
for(const setup of ['stats.items=[];', '', "ITEM_REGISTRY['Void Shard'].minDamage=61;"])
test('invalid item ownership/target/numeric command rejects before mutation: '+setup,()=>{
  const g=fresh();g.run(setup);const before=state(g),members=g.run('combat.enemies');
  const cmd=setup?command:{...command,targetInstanceId:g.run('combat.enemies[0].instanceId')};
  tape(g,[],()=>assert.throws(()=>g.run('resolveFormationRound('+JSON.stringify(cmd)+');'),/Invalid|Unsupported|Unsafe/));
  assert.equal(state(g),before);assert.equal(g.run('combat.enemies'),members);
});
test('playback rejects false damage or consumption and preserves authoritative state',()=>{
  const g=fresh();round(g,[0,0,...HIT,...HIT]);const before=state(g);
  for(const mutation of ['bad.events[0].after.enemies[1].hp++;','bad.events[0].consumed=false;']) {
    g.run('var bad=JSON.parse(JSON.stringify(shardResult));'+mutation);
    assert.throws(()=>g.run('createFormationRoundPlayback(bad);'));
    assert.equal(state(g),before);
  }
});
test('item confirmation needs no target, resolves once, and renders historical duplicate damage',()=>{
  const g=fresh(3);record(g);g.run(`formationSessionController.begin();
    var shardResolves=0,shardResolve=resolveFormationRound;
    resolveFormationRound=c=>{shardResolves++;return shardResolve(c);};`);
  g.press('ArrowRight');g.press('Enter');assert.equal(g.run('formationSessionController.getView().phase'),'item');
  g.run('paint=[];drawCombat(formationSessionController.getView());');
  assert.ok(J(g,'paint').some(c=>c.type==='text'&&String(c.args[0]).includes('50-60')));
  const before=state(g);g.press('Escape');assert.equal(state(g),before,'cancel consumes nothing');
  g.press('Enter');tape(g,[0,0,0,...HIT,...HIT,...HIT],()=>g.hold('Enter'));
  g.hold('Enter');g.release('Enter');assert.equal(g.run('shardResolves'),1);
  assert.equal(g.run('formationSessionController.getView().playbackFrame.frameIndex'),0);
  assert.deepEqual(J(g,'formationSessionController.getView().enemies.map(e=>e.hp)'),[100,100,100]);
  const after=state(g);g.press('Enter');
  const v=J(g,'formationSessionController.getView()');
  assert.deepEqual(v.enemies.map(e=>e.hp),J(g,'combat.enemies.map(e=>e.hp)'));
  const message=g.run('formatFormationBattleEvent(formationSessionController.getView().playbackFrame.currentEvent,stats.name,getFormationBattleLayout(formationSessionController.getView()))');
  for(const suffix of ['A','B','C'])assert.ok(message.includes('Marsh Wisp '+suffix));
  g.run('paint=[];drawCombat(formationSessionController.getView());');assert.equal(state(g),after);
  assert.ok(J(g,'paint').filter(c=>c.type==='text').every(c=>c.args[2]>=0&&c.args[2]<480));
});
test('field use neither equips nor consumes the shard',()=>{
  const g=fresh(0);g.run("menu.open=true;menu.screen='main';menu.itemCursor=0;");
  const before=state(g);g.press('Enter');assert.equal(state(g),before);assert.equal(g.run('stats.accessory'),null);
});
test('singleton immediate throwable path deals DEF-based damage and consumes once',()=>{
  const g=fresh(0);
  tape(g,[0,0.99],'startCombat();');
  g.run("combat.enemy.hp=100;combat.enemy.maxHp=100;combat.enemy.def=7;combat.phase='item';combat.itemCursor=0;");
  tape(g,HIT,'handleCombatAction();');
  assert.equal(g.run('combat.enemy.hp'),47);assert.equal(g.run('stats.items.length'),0);
  assert.match(g.run('combat.message'),/Void Shard.*53 damage/);
  tape(g,[],'advanceCombatMessage();');
  assert.equal(g.run('combat.enemy.hp'),47,'deferred response does not repeat item damage');
});
test('old inventory and equipped Shards load as consumables without lost quantity or bonus',()=>{
  const g=fresh(0);assert.equal(g.run('saveGame()'),true);
  g.run(`var oldSave=JSON.parse(localStorage.getItem('verdantVale_save'));
    oldSave.stats.items=[{name:'Void Shard',type:'accessory',bonus:5,price:360}];
    oldSave.stats.accessory={name:'Void Shard',type:'accessory',bonus:5,price:360};
    localStorage.setItem('verdantVale_save',JSON.stringify(oldSave));`);
  tape(g,[],()=>assert.equal(g.run('loadGame()'),true));
  assert.equal(g.run('stats.accessory'),null);assert.equal(g.run('effectiveSpd()'),7);
  assert.deepEqual(J(g,'stats.items'),[J(g,"ITEM_REGISTRY['Void Shard']"),J(g,"ITEM_REGISTRY['Void Shard']")]);
  assert.equal(g.run('SAVE_VERSION'),4);assert.equal(g.run('saveGame()'),true);
  assert.equal(g.run('loadGame()'),true);assert.equal(g.run('stats.items.length'),2);
  // The harness injects the host JSON object: load-created arrays have a host
  // prototype, unlike browser JSON arrays. Keep actual rehydrated item objects;
  // recreate only those arrays in the game's realm for the strict data gate.
  g.run('stats.items=[...stats.items];statusEffects=[...statusEffects];');
  g.run("initializeFormationState([0,1].map(slot=>({enemyId:'enemy_marsh_wisp',slot})));");
  assert.equal(round(g,[0,0]).r.outcome,'victory','rehydrated consumable passes exact ownership validation');
});
test('Fen Mask remains equipped through save/load and still supplies five speed',()=>{
  const g=fresh(0);g.run("stats.accessory=createItem('Fen Mask');saveGame();stats.accessory=null;loadGame();");
  assert.equal(g.run('stats.accessory.name'),'Fen Mask');assert.equal(g.run('effectiveSpd()'),12);
});
test('Lab victory and exit restore the consumed Shard and all original player state',()=>{
  const g=fresh(0),before=J(g,'({stats,statusEffects,slitherSpd,player,day,tick,location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])})');
  g.press('`');for(let i=0;i<11;i++)g.press('ArrowDown');g.press('Enter');g.press('Enter');
  assert.equal(g.run('formationCombatLab.isActive()'),true);
  g.press('ArrowRight');g.press('Enter');tape(g,[0,0],()=>g.press('Enter'));
  assert.equal(g.run('stats.items.length'),0);
  while(g.run('formationSessionController.getView().phase')==='playback')g.press('Enter');
  g.press('Enter');assert.equal(g.run('formationSessionController.getView().phase'),'victory');g.press('Escape');
  assert.equal(g.run('combat.mode'),null);assert.equal(g.run('formationSessionController.getView()'),null);
  assert.deepEqual(J(g,'({stats,statusEffects,slitherSpd,player,day,tick,location:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])})'),before);
});

module.exports={name:'Void Shard consumable: defence-based area damage, simultaneous protection and immutable playback',checks,
  run(){for(const {name,run} of checks){try{run();}catch(e){e.message=name+': '+e.message;throw e;}}}};
