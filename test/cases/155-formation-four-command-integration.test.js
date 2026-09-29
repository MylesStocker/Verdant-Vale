'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'formationSessionController.getView()');
const HIT=[0.5,0.99,0.99];
function fresh(count=2) {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=()=>{throw Error('unexpected integration RNG');};
    dialogue.open=false;menu.open=false;statusEffects=[];stats.hp=100;stats.maxHp=100;
    stats.atk=8;stats.def=2;stats.spd=7;stats.items=[];
    stats.weapon=stats.armor=stats.shield=stats.accessory=null;
    resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);player.facing='left';`);
  if(count)g.run(`initializeFormationState(${JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:'enemy_marsh_wisp',slot})))},
    {escape:'fastest_living'});formationSessionController.begin();`);
  return g;
}
function state(g) {
  return g.run(`JSON.stringify({stats,statusEffects,slitherSpd,player,day,tick,
    flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),location:snapshotLocationState(),
    combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>'value' in d).map(([k,d])=>[k,d.value])),
    mode:combat.mode,active:combat.active,round:formationRounds.getView(),
    observations:combat.enemies.map(e=>[e.instanceId,e.slot,e.observeCount,e.escapeUnlocked]),
    dialogue,choice,save:localStorage.getItem('verdantVale_save')})`);
}
function world(g) {
  return g.run(`JSON.stringify({stats,statusEffects,slitherSpd,player,day,tick,
    flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),location:snapshotLocationState(),
    world:regionalWorldPosition(),map:mapIdForRef(activeMap),npcs:SIMPLE_NPCS,
    save:localStorage.getItem('verdantVale_save')})`);
}
function tape(g,values,work) {
  const original=g.run('Math.random');
  g.run(`var integrationTape=${JSON.stringify(values)},integrationUsed=0;
    Math.random=()=>{if(integrationUsed===integrationTape.length)throw Error('tape exhausted');return integrationTape[integrationUsed++];};`);
  try {work();assert.equal(g.run('integrationUsed'),values.length,'no exhausted or unused RNG');}
  finally {g.run('Math').random=original;}
}
function choose(g,type) {
  assert.equal(view(g).phase,'awaiting_action');
  for(let i=0;view(g).selectedCommand!==type;i++){assert.ok(i<4);g.press('ArrowRight');}
  g.press('Enter');
}
function item(g,name) {
  choose(g,'item');
  const index=view(g).items.findIndex(i=>i.itemId===name);assert.ok(index>=0);
  while(view(g).itemCursor<index)g.press('ArrowDown');
  while(view(g).itemCursor>index)g.press('ArrowUp');
}
function paint(g) {g.run('paint=[];drawCombat(formationSessionController.getView());');return J(g,'paint');}
function playback(g,ack=true) {
  const before=state(g),frames=[];
  while(view(g).phase==='playback') {
    frames.push(view(g).playbackFrame);g.press('Enter');assert.equal(state(g),before,'playback never reapplies effects');
  }
  assert.equal(view(g).phase,'playback_complete');frames.push(view(g).playbackFrame);
  assert.equal(frames.at(-1).complete,true);g.press('Escape');assert.equal(view(g).phase,'playback_complete');
  if(ack)g.press('Enter');
  return frames;
}
function lab(g,scenario=0) {
  g.press('`');for(let i=0;i<11;i++)g.press('ArrowDown');g.press('Enter');
  assert.equal(g.run('formationCombatLab.isMenuOpen()'),true);
  for(let i=0;i<scenario;i++)g.press('ArrowDown');g.press('Enter');
  assert.equal(g.run('formationCombatLab.isActive()'),true);
}
function receiver(g) {
  g.run(`reservoir_quest_started=true;gallery_deeper_stair_seen=true;descendSunkenGallery();
    placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,2.5*TILE);ascendSunkenGallery();`);
  for(let i=0;i<7;i++)g.press('Enter');
  assert.equal(g.run('galleryReceiverEncounter.ownsCombat()'),true);assert.equal(g.run('combat.active'),true);
}
function instrument(g) {
  g.run(`var uiResolves=0,uiCreates=0,uiResult,uiCommand;
    var uiResolve=resolveFormationRound,uiCreate=createFormationRoundPlayback;
    resolveFormationRound=command=>{uiResolves++;uiCommand=command;uiResult=uiResolve(command);return uiResult;};
    createFormationRoundPlayback=result=>{if(result!==uiResult)throw Error('not authentic');uiCreates++;return uiCreate(result);};`);
}

test('four horizontal commands use singleton wrapping and lowercase direction conventions',()=>{
  const g=fresh(),before=state(g);
  assert.deepEqual(view(g).availableActions,['attack','item','observe','run']);
  for(const key of ['ArrowUp','ArrowDown','w','s','A','D','Escape','b'])g.press(key);
  assert.equal(view(g).commandCursor,0);
  g.press('a');assert.equal(view(g).selectedCommand,'run');g.press('d');assert.equal(view(g).selectedCommand,'attack');
  for(const expected of ['item','observe','run','attack']){g.press('ArrowRight');assert.equal(view(g).selectedCommand,expected);}
  assert.equal(state(g),before);
});

test('physical press latch permits only one transition, including menu/item/playback boundaries',()=>{
  const g=fresh();instrument(g);
  g.hold('Enter');g.hold('Enter');assert.equal(view(g).phase,'targeting');assert.equal(g.run('uiResolves'),0);g.release('Enter');
  tape(g,[0,0,...HIT,...HIT,...HIT],()=>g.hold('Enter'));
  g.hold('Enter');assert.equal(view(g).playbackFrame.frameIndex,0);assert.equal(g.run('uiResolves'),1);g.release('Enter');
  assert.equal(g.run('uiCreates'),1);
  playback(g,false);g.hold('Enter');g.hold('Enter');assert.equal(view(g).phase,'awaiting_action');g.release('Enter');
  assert.equal(g.run('uiResolves'),1);
  // Native repeats without an initial keydown are also inert.
  const source=fs.readFileSync(path.join(__dirname,'../../input.js'),'utf8');
  const marker="window.addEventListener('keydown', ",start=source.indexOf(marker)+marker.length;
  const end=source.indexOf("\n});\nwindow.addEventListener('keyup'",start)+2;
  g.run('('+source.slice(start,end)+')')({key:'Enter',repeat:true,preventDefault(){}});
  assert.equal(view(g).phase,'awaiting_action');
});

for(const type of ['attack','observe'])test(type+' targets only living runtime identities and cancellation is free',()=>{
  const g=fresh(3);g.run('combat.enemies[1].hp=0;');const before=state(g);choose(g,type);
  assert.equal(view(g).selectedTargetInstanceId,view(g).enemies[0].instanceId);
  g.press('ArrowLeft');assert.equal(view(g).selectedTargetInstanceId,view(g).enemies[2].instanceId);
  g.press('d');assert.equal(view(g).selectedTargetInstanceId,view(g).enemies[0].instanceId);
  g.press('b');assert.equal(view(g).phase,'awaiting_action');assert.equal(view(g).selectedCommand,type);
  assert.equal(state(g),before);
});

test('Observe duplicate selection executes once and presents copied authored text without observing twice',()=>{
  const g=fresh();instrument(g);record(g);choose(g,'observe');g.press('ArrowRight');
  const id=view(g).selectedTargetInstanceId;
  tape(g,[0.99,0,...HIT,...HIT],()=>g.press('Enter'));
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.observeCount)'),[0,1]);assert.equal(g.run('uiCommand.targetInstanceId'),id);
  assert.equal(g.run('uiResolves'),1);assert.equal(g.run('uiCreates'),1);assert.equal(view(g).playbackFrame.player.hp,100);
  let observed=false;
  while(view(g).phase==='playback') {
    const before=state(g),v=view(g),calls=paint(g);assert.equal(state(g),before);
    if(v.playbackFrame.currentEvent?.type==='observe') {
      observed=true;
      const text=calls.filter(c=>c.type==='text').map(c=>c.args[0]).join(' ');
      assert.ok(text.includes('Marsh Wisp B'));assert.ok(text.includes(v.playbackFrame.currentEvent.lines.join(' ')));
    }
    g.press('Enter');
  }
  assert.equal(observed,true);g.press('Enter');assert.deepEqual(J(g,'combat.enemies.map(e=>e.observeCount)'),[0,1]);
  choose(g,'observe');assert.equal(view(g).selectedTargetInstanceId,view(g).enemies[0].instanceId);
});

test('combat item rows reuse registry names, grouping, filtering and stable singleton order',()=>{
  const g=fresh();g.run(`stats.items=Object.values(ITEM_REGISTRY).map(i=>createItem(i.name));stats.items.push(createItem('Potion'));`);
  const expected=J(g,'groupItems().map(({name,count})=>({name,count}))');const before=state(g);choose(g,'item');
  assert.deepEqual(view(g).items.map(({name,count})=>({name,count})),expected);
  assert.equal(view(g).items.length,38);assert.equal(view(g).items.find(i=>i.name==='Potion').count,2);
  assert.equal(state(g),before);g.press('Escape');assert.equal(view(g).phase,'awaiting_action');
});

test('long item list scrolls and clamps, Back cancels, targeting returns to exact cursor/scroll/target',()=>{
  const g=fresh(3);record(g);
  g.run(`stats.items=['Potion','Reed Remedy','Bullet Time','Bronze Knife','Bomb','Elixir','Bait'].map(createItem);`);
  const before=state(g);item(g,'Bomb');const cursor=view(g).itemCursor,start=view(g).itemWindowStart;
  assert.ok(start>0);const calls=paint(g);assert.ok(calls.some(c=>c.type==='text'&&c.args[0]==='↑'));
  assert.ok(calls.some(c=>c.type==='text'&&c.args[0]==='↓'));
  g.press('Enter');assert.equal(view(g).phase,'targeting');g.press('ArrowRight');const target=view(g).selectedTargetInstanceId;
  g.press('Escape');assert.equal(view(g).phase,'item');assert.equal(view(g).itemCursor,cursor);assert.equal(view(g).itemWindowStart,start);
  g.press('Enter');assert.equal(view(g).selectedTargetInstanceId,target);g.press('b');
  for(let i=0;i<15;i++)g.press('ArrowDown');assert.equal(view(g).itemCursor,view(g).items.length);
  g.press('Enter');assert.equal(view(g).phase,'awaiting_action');assert.equal(state(g),before);
});

test('empty item list has only a cancellable Back row and never resolves',()=>{
  const g=fresh();instrument(g);choose(g,'item');assert.deepEqual(view(g).items,[]);
  for(const key of ['ArrowDown','ArrowUp','w','s'])g.press(key);assert.equal(view(g).itemCursor,0);
  g.press('Enter');assert.equal(view(g).phase,'awaiting_action');assert.equal(g.run('uiResolves'),0);
  choose(g,'item');g.press('Escape');assert.equal(view(g).phase,'awaiting_action');
});

test('new menu operations reject invalid phases/directions atomically, including all playback operations',()=>{
  const g=fresh();g.run("stats.items=[createItem('Potion')];");
  const reject=code=>{const before=state(g),v=view(g);assert.throws(()=>g.run(code),/Invalid formation/);
    assert.equal(state(g),before);assert.deepEqual(view(g),v);};
  for(const code of ['moveCommand("up")','moveItem("next")','confirmItem()','cancelItems()'])reject('formationSessionController.'+code);
  choose(g,'item');
  for(const code of ['moveItem("left")','moveCommand("next")','confirmCommand()','confirmTarget()'])reject('formationSessionController.'+code);
  // Space is the same edge-triggered confirmation as Enter.
  tape(g,[0,0,...HIT,...HIT],()=>g.hold(' '));g.hold(' ');assert.equal(view(g).playbackFrame.frameIndex,0);g.release(' ');
  for(const code of ['moveCommand("next")','confirmCommand()','moveItem("next")','confirmItem()','cancelItems()','beginAttack()'])
    reject('formationSessionController.'+code);
  playback(g);
});

test('healing executes after a faster enemy and frame zero never leaks healed/final HP',()=>{
  const g=fresh();instrument(g);g.run("stats.hp=50;stats.items=[createItem('Potion')];");item(g,'Potion');
  tape(g,[0.99,0,...HIT,...HIT],()=>g.press('Enter'));
  assert.equal(view(g).phase,'playback');assert.equal(view(g).playbackFrame.player.hp,50);
  assert.equal(g.run('stats.hp'),64);assert.equal(g.run('stats.items.length'),0);assert.equal(g.run('uiResolves'),1);
  const frames=playback(g);assert.deepEqual(frames.map(f=>f.player.hp),[50,47,67,64,64,64]);
});

for(const id of ['Reed Remedy','Amethyst Dust','Bullet Time','Bronze Knife','Bait'])test(id+' self-target confirmation uses the existing resolver and never enters enemy targeting',()=>{
  const g=fresh();instrument(g);g.run(`stats.items=[createItem(${JSON.stringify(id)})];statusEffects=['poison','cursed'];`);
  item(g,id);tape(g,[0,0,...HIT,...HIT],()=>g.press('Enter'));
  assert.equal(view(g).phase,'playback');assert.equal(g.run('uiCommand.type'),'item');
  assert.equal(g.run('Object.hasOwn(uiCommand,"targetInstanceId")'),false);assert.equal(g.run('uiResolves'),1);
  const frames=playback(g),event=frames.find(f=>f.currentEvent?.type==='item').currentEvent;
  if(id==='Reed Remedy')assert.deepEqual(J(g,'statusEffects'),['cursed']);
  if(id==='Amethyst Dust')assert.deepEqual(J(g,'statusEffects'),['poison']);
  if(id==='Bullet Time')assert.equal(g.run('combat.evadeTurns'),3);
  if(id==='Bronze Knife')assert.equal(g.run('stats.weapon.name'),id);
  if(id==='Bait'){assert.equal(event.consumed,false);assert.equal(g.run('stats.items.length'),1);}
});

for(const id of ['Throwing Knife','Sapper Charge','Bomb','Henbane Sprig','Jackbane Vial','Trollbane'])test(id+' binds the chosen duplicate through item targeting',()=>{
  const g=fresh();instrument(g);g.run(`stats.items=[createItem(${JSON.stringify(id)})];combat.enemies.forEach(e=>{e.hp=100;e.maxHp=100;});`);
  item(g,id);g.press('Enter');assert.equal(view(g).phase,'targeting');g.press('ArrowRight');const target=view(g).selectedTargetInstanceId;
  tape(g,[0,0,...HIT,...HIT],()=>g.press('Enter'));
  assert.equal(g.run('uiCommand.targetInstanceId'),target);assert.equal(g.run('combat.enemies[0].hp'),100);
  assert.equal(g.run('stats.items.length'),0);playback(g);assert.equal(g.run('uiResolves'),1);
});

test('defeat before an Item slot leaves inventory intact and locks the terminal view',()=>{
  const g=fresh();g.run("stats.hp=1;stats.items=[createItem('Potion')];");item(g,'Potion');
  tape(g,[0.99,0.99,...HIT],()=>g.press('Enter'));playback(g);
  assert.equal(view(g).phase,'defeat');assert.equal(g.run('stats.items.length'),1);
  const before=state(g);for(const key of ['Enter',' ','ArrowLeft','ArrowRight','Escape'])g.press(key);assert.equal(state(g),before);
});

test('Bullet Time lasts three subsequent UI rounds regardless of enemies and playback length',()=>{
  const g=fresh(3);g.run("stats.items=[createItem('Bullet Time')];");item(g,'Bullet Time');
  const dodge=[0.5,0.99,0.5],values=[0,0,0,...dodge,...dodge,...dodge];
  tape(g,values,()=>g.press('Enter'));playback(g);assert.equal(g.run('combat.evadeTurns'),3);
  for(const remaining of [2,1,0]) {
    choose(g,'observe');tape(g,values,()=>g.press('Enter'));
    const finalHp=g.run('stats.hp');assert.equal(finalHp,100);playback(g);assert.equal(g.run('combat.evadeTurns'),remaining);
  }
  assert.equal(g.run('formationRounds.getView().completedRounds'),4);
});

test('Bomb item and subsequent fuse events render from immutable history without a second detonation',()=>{
  const g=fresh();record(g);g.run("stats.items=[createItem('Bomb')];combat.enemies.forEach(e=>{e.hp=100;e.maxHp=100;});");
  item(g,'Bomb');g.press('Enter');g.press('ArrowRight');
  tape(g,[0,0,...HIT,...HIT],()=>g.press('Enter'));playback(g);
  for(const remaining of [2,1,0]) {
    choose(g,'observe');tape(g,[0,0,...HIT,...HIT],()=>g.press('Enter'));
    const before=state(g);let seen=false;
    while(view(g).phase==='playback') {
      if(view(g).playbackFrame.currentEvent?.type==='bomb_tick') {
        seen=true;assert.ok(paint(g).some(c=>c.type==='text'&&c.args[0].includes('Bomb')));
      }
      g.press('Enter');assert.equal(state(g),before);
    }
    assert.equal(seen,true);g.press('Enter');assert.equal(g.run('combat.bombFuse'),remaining);
  }
  assert.equal(g.run('combat.enemies[0].hp'),100);assert.ok(g.run('combat.enemies[1].hp')<100);
});

for(const success of [true,false])test('Run commits directly from menu with exact '+(success?'success':'failure')+' RNG and separate acknowledgement',()=>{
  const g=fresh();instrument(g);g.press('ArrowLeft');
  tape(g,success?[0,0,0]:[0,0,0.99,...HIT,...HIT],()=>g.press('Enter'));
  assert.equal(view(g).phase,'playback');assert.equal(view(g).playbackFrame.frameIndex,0);assert.equal(g.run('uiResolves'),1);
  playback(g,false);assert.equal(view(g).playbackFrame.outcome,success?'escape':'ongoing');
  g.press('Enter');assert.equal(view(g).phase,success?'escape':'awaiting_action');
  if(success){const before=state(g);for(const key of ['Enter',' ','ArrowLeft','Escape'])g.press(key);assert.equal(state(g),before);}
});

test('only established boss templates carry boolean registry metadata; singleton copies remain unchanged',()=>{
  const g=fresh(0);
  assert.deepEqual(J(g,'Object.values(ENEMY_TEMPLATE_REGISTRY).filter(e=>e.isBoss===true).map(e=>e.id).sort()'),
    ['enemy_gallery_receiver','enemy_lensweb_spider','enemy_mulholland','enemy_takomo','enemy_wrongteeth']);
  assert.equal(g.run('Object.values(ENEMY_TEMPLATE_REGISTRY).filter(e=>Object.hasOwn(e,"isBoss")).length'),5);
  g.run('startBossCombat();');assert.equal(g.run('combat.mode'),'single');
  assert.equal(g.run('Object.hasOwn(combat.enemy,"isBoss")'),false);
});

test('boss lock is metadata-driven and captured even after the boss dies or classification changes',()=>{
  const g=fresh(0);
  g.run(`Object.defineProperty(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,'isBoss',{value:true,configurable:true});
    initializeFormationState([{enemyId:'enemy_marsh_wisp',slot:0},{enemyId:'enemy_briar_hound',slot:1}],{escape:'fastest_living'});
    formationSessionController.begin();delete ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.isBoss;combat.enemies[0].hp=0;`);
  assert.equal(g.run('formationRounds.getView().escapePolicy'),'blocked');instrument(g);g.press('ArrowLeft');
  tape(g,[0,...HIT],()=>g.press('Enter'));
  const event=J(g,'uiResult.events.find(e=>e.type==="run")');assert.equal(event.allowed,false);assert.equal(event.roll,null);
  assert.equal(event.success,false);playback(g);assert.equal(view(g).phase,'awaiting_action');
});

test('invalid boss metadata is rejected before identities or combat state change',()=>{
  const g=fresh(0);g.run("Object.defineProperty(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,'isBoss',{value:'yes'});");
  const before=state(g),sequence=g.run('combatEnemyInstanceSequence');
  assert.throws(()=>g.run("initializeFormationState([{enemyId:'enemy_marsh_wisp',slot:0},{enemyId:'enemy_briar_hound',slot:1}],{escape:'fastest_living'});"),/Unknown formation template field/);
  assert.equal(state(g),before);assert.equal(g.run('combatEnemyInstanceSequence'),sequence);
});

test('boss Lab scenario is inactive, quest-free and blocks Run after its boss dies',()=>{
  const g=fresh(0),before=world(g);lab(g,3);instrument(g);
  assert.equal(g.run('combat.active'),false);assert.equal(g.run('galleryReceiverEncounter.ownsCombat()'),false);
  g.run('combat.enemies[0].hp=0;');g.press('ArrowLeft');
  tape(g,[0,0,...HIT,...HIT],()=>g.press('Enter'));playback(g);
  assert.equal(g.run('uiResult.events.find(e=>e.type==="run").allowed'),false);
  g.press('Escape');assert.equal(world(g),before);assert.equal(g.run('formationCombatLab.isMenuOpen()'),true);
  g.press('Enter');assert.equal(g.run('formationCombatLab.isActive()'),true);g.press('Escape');
});

for(const exit of ['escape','cancel','abort'])test('Lab '+exit+' restores exact item objects, equipment, statuses, HP, tick and world after actual item use',()=>{
  const g=fresh(0);
  g.run(`stats.hp=55;tick=123;statusEffects=['poison','cursed'];stats.weapon=createItem('Bronze Knife');
    stats.items=['Potion','Reed Remedy','Iron Sword','Bullet Time'].map(createItem);
    var originalItems=stats.items,originalFirst=stats.items[0],originalGear=stats.weapon,originalStatuses=statusEffects;saveGame();`);
  const before=world(g);lab(g,2);
  for(const name of ['Potion','Reed Remedy','Iron Sword','Bullet Time']) {
    item(g,name);tape(g,[0,0,0,...HIT,...HIT,...HIT],()=>g.press('Enter'));playback(g);
  }
  assert.equal(g.run('stats.weapon.name'),'Iron Sword');assert.deepEqual(J(g,'statusEffects'),['cursed']);
  if(exit==='escape') {
    g.press('ArrowRight');g.press('ArrowRight'); // Item -> Observe -> Run
    tape(g,[0,0,0,0],()=>g.press('Enter'));playback(g,false);
    assert.equal(g.run('formationCombatLab.isActive()'),true);g.press('Enter');
  } else if(exit==='cancel')g.press('Escape');
  else {
    g.run('createFormationRoundPlayback=()=>{throw Error("injected after item resolution");};');
    choose(g,'observe');tape(g,[0,0,0,...HIT,...HIT,...HIT],()=>g.press('Enter'));
    assert.match(g.run('formationCombatLab.getView().error'),/aborted safely/);
  }
  assert.equal(world(g),before);assert.equal(g.run('stats.items===originalItems && stats.items[0]===originalFirst && stats.weapon===originalGear && statusEffects===originalStatuses'),true);
  assert.equal(g.run('combat.mode'),null);assert.equal(view(g),null);assert.equal(g.run('formationCombatLab.isMenuOpen()'),true);
});

test('canonical Receiver supports cures/Observe and metadata-blocked Run through the shared menu',()=>{
  const g=fresh(0);g.run("statusEffects=['poison'];stats.items=[createItem('Reed Remedy')];");receiver(g);instrument(g);
  item(g,'Reed Remedy');tape(g,[0,0,0,...HIT,...HIT,...HIT],()=>g.press('Enter'));playback(g);
  assert.deepEqual(J(g,'statusEffects'),[]);choose(g,'observe');g.press('ArrowRight');
  tape(g,[0,0,0,...HIT,...HIT,...HIT],()=>g.press('Enter'));playback(g);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.observeCount)'),[0,1,0]);
  g.press('ArrowRight');tape(g,[0,0,0,...HIT,...HIT,...HIT],()=>g.press('Enter'));playback(g);
  assert.equal(g.run('uiResult.events.find(e=>e.type==="run").allowed'),false);assert.equal(g.run('uiResolves'),3);
  assert.equal(g.run('gallery_receiver_defeated'),false);assert.equal(g.run('combat.active'),true);
});

for(const count of [2,3])test(count+'-member command/item/observation views fit native bounds and are read-only at both scales',()=>{
  const g=fresh(count);record(g);g.run("stats.items=['Potion','Potion','Bomb','Elixir','Bullet Time'].map(createItem);");
  const inspect=()=>{
    const before=state(g),v=view(g);for(const scale of [1,2]) {
      g.run(`paint=[];ctx.save();ctx.scale(${scale},${scale});drawCombat(formationSessionController.getView());ctx.restore();`);
      for(const call of J(g,'paint'))if(call.bounds){const [x,y,r,b]=call.bounds;assert.ok(x>=0&&y>=0&&r<=512*scale&&b<=480*scale,JSON.stringify(call));}
    }
    assert.equal(state(g),before);assert.deepEqual(view(g),v);
  };
  inspect();choose(g,'item');inspect();g.press('ArrowDown');g.press('ArrowDown');inspect();g.press('Escape');
  choose(g,'observe');inspect();tape(g,[...Array(count).fill(0),...Array(count).fill(HIT).flat()],()=>g.press('Enter'));
  while(view(g).phase==='playback'){inspect();g.press('Enter');}inspect();
});

test('every authentic new event has a pure message or deliberate silent bookkeeping',()=>{
  const g=fresh();const labels=J(g,'getFormationBattleLayout(formationSessionController.getView())');
  const format=e=>g.run('formatFormationBattleEvent('+JSON.stringify(e)+',"Lely",'+JSON.stringify(labels)+')');
  assert.equal(format({type:'round_end',effectsBefore:{evadeTurns:2},effectsAfter:{evadeTurns:1}}),'');
  assert.match(format({type:'round_end',effectsBefore:{evadeTurns:1},effectsAfter:{evadeTurns:0}}),/wears off/);
  assert.match(format({type:'speed',before:3,after:7}),/SPD.*7/);
  assert.match(format({type:'burn',appliedDamage:5}),/5 damage/);
  for(const [allowed,success,match] of [[false,false,/Cannot escape/],[true,false,/cannot get away/],[true,true,/escapes/]])
    assert.match(format({type:'run',actorId:'player',targetId:'player',allowed,success}),match);
  assert.equal(format({type:'outcome',outcome:'escape'}),'Escaped!');
});

test('all approved authored observations fit the message bands without losing any line',()=>{
  const g=fresh();record(g);
  // Formatter coverage across every approved template and repeated Observe tier,
  // without resolving or mutating observation progress for this read-only check.
  const ids=J(g,'FORMATION_STATE_TEMPLATE_IDS');
  for(const id of ids)for(const count of [0,1,2,3,4]) {
    const lines=J(g,`getObservationText(ENEMY_TEMPLATE_REGISTRY[${JSON.stringify(id)}],${count})`);
    const label=g.run(`ENEMY_TEMPLATE_REGISTRY[${JSON.stringify(id)}].name`);
    const event={type:'observe',actorId:'player',targetId:'enemy',lines};
    const message=g.run(`formatFormationBattleEvent(${JSON.stringify(event)},'Lely',[{instanceId:'enemy',label:${JSON.stringify(label)}}])`);
    g.run(`ctx.font='14px "Courier New", monospace';`);
    const wrapped=J(g,`wrapMonospaceText(ctx,${JSON.stringify(message)},468)`);
    assert.ok(wrapped.length<=6,label+' must fit two upper and four lower message lines');
    assert.equal(wrapped.join(' ').replace(/\s+/g,' '),message.replace(/\s+/g,' '));
  }
});

test('views stay deeply frozen, expose no templates/inventory references and never enter saves',()=>{
  const g=fresh();g.run("stats.items=[createItem('Potion')];");choose(g,'item');
  const before=state(g),v=g.run('formationSessionController.getView()');
  function frozen(o){if(o&&typeof o==='object'){assert.ok(Object.isFrozen(o));Object.values(o).forEach(frozen);}}frozen(v);
  assert.throws(()=>{v.items[0].count=999;},/read only/);assert.throws(()=>{v.items.push({});},/not extensible/);
  assert.equal(state(g),before);assert.notEqual(v.items[0],g.run('stats.items[0]'));
  g.run('setSingleCombatEnemy(null);saveGame();');const save=g.run("localStorage.getItem('verdantVale_save')");
  assert.doesNotMatch(save,/commandCursor|itemWindowStart|formationRounds|selectedCommand|playback|isBoss/);
  assert.equal(g.run('SAVE_VERSION'),4);
});

test('no new encounter, reward or save caller; input delegates and boss policy has no identity special case',()=>{
  const root=path.join(__dirname,'../..');
  for(const file of scriptOrderFromIndexHtml()) {
    const source=fs.readFileSync(path.join(root,file),'utf8');
    if(!['combat.js','gallery-receiver.js','formation-lab.js'].includes(file))assert.doesNotMatch(source,/\binitializeFormationState\s*\(/,file);
    if(file!=='combat.js')assert.doesNotMatch(source,/\bresolveFormationRound\s*\(/,file);
  }
  const g=fresh();
  for(const symbol of ['resolveFormationRound','createFormationCommandPlayback'])
    assert.doesNotMatch(g.run(symbol+'.toString()'),/enemy_gallery_|ownsCombat\(|galleryReceiverEncounter/);
  assert.doesNotMatch(g.run('handleFormationInputCommand.toString()'),/stats\.|combat\.|Math\.random|resolveFormation|catch\s*\(/);
  assert.doesNotMatch(g.run('formatFormationBattleEvent.toString()'),/stats\.|combat\.|Math\.random|applyStatusCure|equipItem\(/);
});

module.exports={name:'four-command formation integration: controller menus, exact effects, boss metadata and isolated Lab restoration',checks,
  run(){for(const c of checks){try{c.run();}catch(error){error.message=c.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' four-command integration checks passed');}};
