'use strict';

const assert=require('assert/strict');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const HIT=[0.5,0.99,0.99];
function fresh() {
  const g=createContext();
  g.run(`dialogue.open=false;dialogue.callbacks=null;statusEffects=[];
    stats.hp=500;stats.maxHp=500;stats.atk=8;stats.def=2;stats.spd=7;stats.items=[];
    stats.weapon=stats.armor=stats.shield=stats.accessory=null;
    Math=Object.create(Math);Math.random=()=>{throw Error('unexpected RNG');};
    initializeFormationState(GALLERY_RECEIVER_TEMPLATES.map((e,slot)=>({enemyId:e.id,slot})),{escape:'fastest_living'});`);
  return g;
}
const target=(g,slot)=>g.run(`combat.enemies[${slot}].instanceId`);
const attack=(g,slot)=>({type:'attack',targetInstanceId:target(g,slot)});
const observe=(g,slot)=>({type:'observe',targetInstanceId:target(g,slot)});
function snapshot(g) {
  return g.run(`JSON.stringify({stats,statusEffects,day,tick,player,location:snapshotLocationState(),
    flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),dialogue,choice,
    members:combat.enemies,observations:combat.enemies.map(e=>e.observeCount),
    round:formationRounds.getView(),coordination:formationRounds.coordination(),
    effects:formationEffectSnapshot(),sequence:combatEnemyInstanceSequence})`);
}
function tape(g,values,expression) {
  g.run(`var receiverTape=${JSON.stringify(values)},receiverUsed=0;
    Math.random=()=>{if(receiverUsed===receiverTape.length)throw Error('tape exhausted');return receiverTape[receiverUsed++];};`);
  try {g.run(expression);assert.equal(g.run('receiverUsed'),values.length,'no unused RNG');}
  finally {g.run(`Math.random=()=>{throw Error('unexpected RNG');};`);}
}
function round(g,command,values,ack=true) {
  tape(g,values,'var result=resolveFormationRound('+JSON.stringify(command)+');');
  const after=snapshot(g);
  g.run('var reel=createFormationRoundPlayback(result);');
  const r=J(g,'result'),p=J(g,'reel');
  for(let i=p.frameCount-1;i>=0;i--)g.run('projectFormationPlaybackFrame(reel,'+i+');');
  assert.equal(snapshot(g),after,'projection has no effects');
  assert.equal(p.frames.at(-1).player.hp,g.run('stats.hp'));
  assert.deepEqual(p.frames.at(-1).enemies.map(e=>e.hp),J(g,'combat.enemies.map(e=>e.hp)'));
  assert.deepEqual(p.frames.at(-1).coordination,J(g,'formationRounds.coordination()'));
  if(ack)g.run('acknowledgeFormationRound(reel,reel.frameCount-1);');
  return {r,p};
}
function prime(g) {return round(g,{type:'run'},[0,0,0,...HIT,...HIT]);}
function addItem(g,id,slot=null) {
  g.run('stats.items.push(createItem('+JSON.stringify(id)+'));');
  return {type:'item',itemId:id,...(slot===null?{}:{targetInstanceId:target(g,slot)})};
}
const actorEvents=r=>r.events.filter(e=>e.actorType==='enemy');

test('trio binds three exact identities once; duplicate/mixed subsets gain no coordination',()=>{
  const g=fresh(),c=J(g,'formationRounds.coordination()');
  assert.deepEqual([c.receiverId,c.callerId,c.keeperId],J(g,'combat.enemies.map(e=>e.instanceId)'));
  assert.equal(c.strikeRound,0);assert.equal(c.nextSignalRound,1);
  g.run(`endCombat();initializeFormationState([{enemyId:'enemy_gallery_receiver',slot:0},{enemyId:'enemy_gallery_caller',slot:1}]);`);
  assert.equal(g.run('formationRounds.coordination()'),null);
  g.run(`endCombat();initializeFormationState([0,1,2].map(slot=>({enemyId:'enemy_gallery_caller',slot})));`);
  assert.equal(g.run('formationRounds.coordination()'),null);
});

test('Caller signals instead of attacking: one slot, no attack RNG, next-round warning',()=>{
  const g=fresh(),{r,p}=prime(g);
  assert.deepEqual(actorEvents(r).map(e=>e.type),['attack','signal','attack']);
  assert.equal(r.events.find(e=>e.type==='signal').strikeRound,2);
  assert.equal(p.frames[0].coordination.strikeRound,0);
  const i=r.events.findIndex(e=>e.type==='signal');
  assert.equal(p.frames[i+1].coordination.strikeRound,2);
  assert.equal(p.frames[i].player.hp,p.frames[i+1].player.hp);
  assert.equal(g.run('formationRounds.getView().completedRounds'),1);
});

test('a same-round signal never becomes a heavy attack even when Caller acts first',()=>{
  const g=fresh(),{r}=round(g,{type:'run'},[0,0.99,0,...HIT,...HIT]);
  assert.equal(actorEvents(r)[0].type,'signal');
  assert.equal(r.events.some(e=>e.type==='heavy_attack'),false);
});

test('next round replaces Receiver attack with exactly one doubled heavy strike',()=>{
  const g=fresh();prime(g);
  const {r}=round(g,{type:'run'},[0,0,0,...HIT,...HIT,...HIT]);
  const heavy=r.events.find(e=>e.type==='heavy_attack');
  assert.equal(heavy.actorId,target(g,0));assert.equal(heavy.attemptedDamage,16);
  assert.equal(actorEvents(r).length,3);assert.equal(r.events.some(e=>e.type==='signal'),false);
  assert.equal(g.run('formationRounds.coordination().strikeRound'),0);
  assert.equal(prime(g).r.events.find(e=>e.type==='signal').strikeRound,4);
});

test('a later-acting Caller cannot re-prime in the release round',()=>{
  const g=fresh();prime(g);
  const {r}=round(g,{type:'run'},[0.99,0,0,...HIT,...HIT,...HIT]);
  assert.equal(actorEvents(r)[0].type,'heavy_attack');
  assert.equal(actorEvents(r).find(e=>e.actorId===target(g,1)).type,'attack');
});

for(const critical of [false,true]) test('heavy strike preserves crit/evade order; critical='+critical,()=>{
  const g=fresh();prime(g);
  const {r}=round(g,{type:'run'},[0,0,0,0.5,critical?0:0.99,0.99,...HIT,...HIT]);
  const event=r.events.find(e=>e.type==='heavy_attack');
  assert.equal(event.critical,critical);
  assert.equal(event.attemptedDamage,g.run(`attackDamageNumbers(10,effectivePlayerIncomingMitigation(10),1,${critical}).dmg*2`));
});

test('Bullet Time can evade a heavy strike and it still consumes the charge once',()=>{
  const g=fresh();prime(g);
  const command=addItem(g,'Bullet Time');
  const {r}=round(g,command,[0,0,0,...[0.5,0.99,0.5],...HIT,...HIT]);
  const heavy=r.events.find(e=>e.type==='heavy_attack');
  assert.equal(heavy.evaded,true);assert.equal(heavy.appliedDamage,0);
  assert.equal(g.run('combat.evadeTurns'),3);assert.equal(g.run('formationRounds.coordination().strikeRound'),0);
});

test('killing Caller before the warned strike breaks it immediately and skips its slot',()=>{
  const g=fresh();prime(g);g.run('stats.atk=30;');
  const {r,p}=round(g,attack(g,1),[0,0,0,...HIT,...HIT,...HIT]);
  assert.equal(r.events[0].targetId,target(g,1));assert.equal(r.events[1].type,'signal_broken');
  assert.equal(r.events[1].reason,'caller_dead');assert.equal(p.frames[1].coordination.strikeRound,2);
  assert.equal(p.frames[2].coordination.strikeRound,0);
  assert.equal(r.events.some(e=>e.type==='heavy_attack'),false);
  assert.equal(r.events.find(e=>e.type==='skip').actorId,target(g,1));
});

test('a faster Caller can signal and be interrupted in the same round',()=>{
  const g=fresh();g.run('stats.atk=30;');
  const {r}=round(g,attack(g,1),[0,0.99,0,...HIT,...HIT,...HIT]);
  assert.equal(r.events[0].type,'signal');assert.equal(r.events[2].type,'signal_broken');
  assert.equal(g.run('formationRounds.coordination().strikeRound'),0);
});

test('the warning disappears on the historical Caller death frame, not ahead of it',()=>{
  const g=fresh();prime(g);g.run('stats.atk=30;formationSessionController.begin();formationSessionController.beginAttack();formationSessionController.moveTarget("next");');
  record(g);tape(g,[0,0,0,...HIT,...HIT,...HIT],'formationSessionController.confirmTarget();');
  g.run('paint=[];drawCombat(formationSessionController.getView());');
  assert.ok(J(g,'paint').some(c=>c.type==='text'&&c.args[0]==='A heavy strike is prepared.'));
  g.run('formationSessionController.advancePlayback();paint=[];drawCombat(formationSessionController.getView());');
  assert.equal(g.run('formationSessionController.getView().enemies[1].hp'),0);
  assert.equal(J(g,'paint').some(c=>c.type==='text'&&c.args[0]==='A heavy strike is prepared.'),false);
});

test('coordination follows exact identity with roles in a different stable slot order',()=>{
  const g=fresh();g.run(`endCombat();initializeFormationState([GALLERY_RECEIVER_TEMPLATES[2],GALLERY_RECEIVER_TEMPLATES[0],GALLERY_RECEIVER_TEMPLATES[1]].map((e,slot)=>({enemyId:e.id,slot})));`);
  const {r}=round(g,attack(g,1),[0,0,0,...HIT,...HIT,...HIT]);
  assert.equal(r.events[0].keeperId,target(g,0));assert.equal(r.events[0].targetId,target(g,1));
  const signal=r.events.find(e=>e.type==='signal');assert.equal(signal.actorId,target(g,2));assert.equal(signal.receiverId,target(g,1));
});

test('killing Receiver breaks its pending signal; living helpers still fight',()=>{
  const g=fresh();prime(g);g.run('stats.atk=200;');
  const {r}=round(g,attack(g,0),[0,0,0,...HIT,...HIT,...HIT]);
  assert.equal(r.events[0].type,'guarded_attack');assert.equal(r.events[1].reason,'receiver_dead');
  assert.equal(r.outcome,'ongoing');assert.equal(r.events.filter(e=>e.type==='attack').length,2);
});

test('Keeper halves Receiver damage after the normal roll, rounding up; minimum is one',()=>{
  for(const atk of [4,9,10]) {
    const g=fresh();g.run('stats.atk='+atk+';');
    const {r}=round(g,attack(g,0),[0,0,0,...HIT,...HIT,...HIT]);
    const e=r.events[0];assert.equal(e.type,'guarded_attack');
    assert.equal(e.unprotectedDamage,g.run(`attackDamageNumbers(${atk},4,1,false).dmg`));
    assert.equal(e.attemptedDamage,Math.ceil(e.unprotectedDamage/2));assert.ok(e.attemptedDamage>=1);
    assert.equal(e.keeperId,target(g,2));
  }
});

test('Keeper does not shield itself or Caller',()=>{
  for(const slot of [1,2]) {
    const g=fresh(),{r}=round(g,attack(g,slot),[0,0,0,...HIT,...HIT,...HIT]);
    assert.equal(r.events[0].type,'attack');assert.equal(r.events[0].targetId,target(g,slot));
  }
});

test('killing Keeper removes protection for the next action without moving a slot',()=>{
  const g=fresh(),ids=J(g,'combat.enemies.map(e=>e.instanceId)');g.run('stats.atk=40;');
  round(g,attack(g,2),[0,0,0,...HIT,...HIT]);
  assert.equal(g.run('combat.enemies[2].hp'),0);
  const {r}=round(g,attack(g,0),[0,0,...HIT,...HIT,...HIT]);
  assert.equal(r.events[0].type,'attack');assert.equal(r.events[0].attemptedDamage,36);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.instanceId)'),ids);
});

for(const id of ['Throwing Knife','Sapper Charge'])test(id+' respects protection with one consumption and historical item HP',()=>{
  const g=fresh(),command=addItem(g,id,0);
  const raw=g.run(`offensiveItemDamage(ITEM_REGISTRY[${JSON.stringify(id)}],combat.enemies[0])`);
  const {r,p}=round(g,command,[0,0,0,...HIT,...HIT]);
  assert.equal(r.events[0].type,'item');assert.equal(g.run('stats.items.length'),0);
  assert.equal(p.frames[0].enemies[0].hp,54);assert.equal(p.frames[1].enemies[0].hp,54-Math.ceil(raw/2));
});

test('Bomb detonation obeys living Keeper protection and can break a Caller signal',()=>{
  for(const slot of [0,1]) {
    const g=fresh();round(g,addItem(g,'Bomb',slot),[0,0,0,...HIT,...HIT]);
    round(g,{type:'run'},[0,0,0,...HIT,...HIT,...HIT]);
    prime(g);
    const {r}=round(g,{type:'run'},[0,0,0,...HIT,...HIT,...HIT]);
    const bomb=r.events.find(e=>e.type==='bomb_tick');assert.equal(bomb.attemptedDamage,slot===0?40:80);
    assert.equal(g.run('combat.bombFuse'),0);
    if(slot===0)assert.equal(g.run('combat.enemies[0].hp'),14);
    else assert.equal(g.run('combat.enemies[1].hp'),0);
  }
});

test('a Bomb killing Caller on a signalling round breaks the pending strike',()=>{
  const g=fresh();prime(g);
  round(g,addItem(g,'Bomb',1),[0,0,0,...HIT,...HIT,...HIT]);
  prime(g);round(g,{type:'run'},[0,0,0,...HIT,...HIT,...HIT]);
  const {r}=prime(g);
  const bombIndex=r.events.findIndex(e=>e.type==='bomb_tick');
  assert.equal(r.events[bombIndex].hpAfter,0);assert.equal(r.events[bombIndex+1].type,'signal_broken');
  assert.equal(g.run('formationRounds.coordination().strikeRound'),0);
});

test('Bomb protection is evaluated at detonation, not at planting',()=>{
  const g=fresh();round(g,addItem(g,'Bomb',0),[0,0,0,...HIT,...HIT]);
  round(g,addItem(g,'Sapper Charge',2),[0,0,0,...HIT,...HIT]);
  round(g,{type:'run'},[0,0,...HIT]);
  const {r}=round(g,{type:'run'},[0,0,...HIT,...HIT]);
  assert.equal(r.events.find(e=>e.type==='bomb_tick').attemptedDamage,80);
  assert.equal(g.run('combat.enemies[0].hp'),0);assert.equal(r.outcome,'ongoing');
});

for(let mask=0;mask<8;mask++) test('authentic playback accepts initiative grouping '+mask,()=>{
  const g=fresh(),initiative=[0,1,2].map(i=>mask&(1<<i)?0.99:0);
  const first=round(g,observe(g,0),[...initiative,...HIT,...HIT]);
  assert.equal(actorEvents(first.r).length,3);
  const second=round(g,observe(g,0),[...initiative,...HIT,...HIT,...HIT]);
  assert.equal(actorEvents(second.r).length,3);
  assert.equal(second.r.events.filter(e=>e.type==='heavy_attack').length,1);
});

test('Cat Armor cap bypass remains applicable to the heavy strike',()=>{
  const g=fresh();g.run("stats.armor=createItem('Cat Armor');stats.def=100;");prime(g);
  const {r}=round(g,{type:'run'},[0,0,0,...HIT,...HIT,...HIT]);
  assert.equal(r.events.find(e=>e.type==='heavy_attack').attemptedDamage,2);
});

test('healing during the warning round and the heavy round is represented once',()=>{
  const g=fresh();g.run('stats.hp=200;');prime(g);
  const command=addItem(g,'Potion');
  const {r,p}=round(g,command,[0.99,0,0,...HIT,...HIT,...HIT]);
  assert.equal(r.events[0].type,'heavy_attack');assert.equal(r.events[1].type,'item');
  assert.equal(p.frames[2].player.hp,r.events[1].after.player.hp);
  assert.equal(g.run('stats.items.length'),0);
});

test('the real Lab Receiver scenario uses the same mechanic and restores on exit',()=>{
  const g=fresh();g.run('endCombat();');const hp=g.run('stats.hp'),tick=g.run('tick');
  g.press('`');for(let i=0;i<11;i++)g.press('ArrowDown');g.press('Enter');
  for(let i=0;i<3;i++)g.press('ArrowDown');g.press('Enter');
  assert.equal(g.run('formationCombatLab.isActive()'),true);assert.equal(g.run('combat.active'),false);
  g.press('ArrowLeft');tape(g,[0,0,0,...HIT,...HIT],"formationCombatLab.runOperation(()=>formationSessionController.confirmCommand());");
  while(g.run('formationSessionController.getView().phase')==='playback')g.press('Enter');
  g.press('Enter');assert.equal(g.run('formationRounds.coordination().strikeRound'),2);
  g.press('Escape');assert.equal(g.run('stats.hp'),hp);assert.equal(g.run('tick'),tick);
  assert.equal(g.run('formationRounds.coordination()'),null);assert.equal(g.run('gallery_receiver_defeated'),false);
});

test('Observe teaches all three roles without disclosing the aftermath',()=>{
  for(const slot of [0,1,2]) {
    const g=fresh(),{r}=round(g,observe(g,slot),[0,0,0,...HIT,...HIT]);
    const e=r.events[0];assert.equal(e.type,'observe');assert.equal(e.targetId,target(g,slot));
    assert.match(e.lines.join(' '),/Caller|Keeper/);assert.doesNotMatch(e.lines.join(' '),/bridle|filament|mechanism|skull/);
    assert.deepEqual(J(g,'combat.enemies.map(e=>e.observeCount)'),[0,1,2].map(i=>i===slot?1:0));
  }
});

test('heavy numeric overflow is rejected with zero RNG and no mutation',()=>{
  const g=fresh();g.run('combat.enemies[0].atk=Math.floor(Number.MAX_SAFE_INTEGER/2);');
  assert.equal(g.run('formationAttackNumbersAreSafe(combat.enemies[0].atk,1)'),true);
  const before=snapshot(g);assert.throws(()=>tape(g,[],`resolveFormationRound({type:'run'});`),/Unsupported/);
  assert.equal(snapshot(g),before);assert.equal(g.run('receiverUsed'),0);
});

test('death cancels remaining enemy actions and does not refund a heavy hit',()=>{
  const g=fresh();prime(g);g.run('stats.hp=1;');
  const {r}=round(g,{type:'run'},[0.99,0,0,...HIT]);
  assert.equal(r.outcome,'defeat');assert.equal(actorEvents(r).length,1);assert.equal(g.run('stats.hp'),0);
});

for(const expression of [
  "result.events.find(e=>e.type==='signal').strikeRound++",
  "result.events.find(e=>e.type==='signal').receiverId=result.before.coordination.keeperId",
  "result.after.coordination.strikeRound=0",
  "result.events.find(e=>e.type==='signal').type='attack'",
]) test('tampered signal history rejects: '+expression,()=>{
  const g=fresh();prime(g);const before=snapshot(g);
  g.run('result=JSON.parse(JSON.stringify(result));'+expression+';');
  assert.throws(()=>g.run('createFormationRoundPlayback(result);'),/Invalid/);assert.equal(snapshot(g),before);
});

test('cleanup/retry binds fresh identities and clears every signal',()=>{
  const g=fresh();prime(g);const old=J(g,'formationRounds.coordination()');
  g.run('endCombat();');assert.equal(g.run('formationRounds.coordination()'),null);
  g.run('initializeFormationState(GALLERY_RECEIVER_TEMPLATES.map((e,slot)=>({enemyId:e.id,slot})));');
  const next=J(g,'formationRounds.coordination()');assert.notEqual(next.receiverId,old.receiverId);
  assert.equal(next.strikeRound,0);assert.equal(next.nextSignalRound,1);
});

test('session view and art use projected warning and HP, never final live state',()=>{
  const g=fresh();record(g);g.run('formationSessionController.begin();formationSessionController.moveCommand("previous");');
  tape(g,[0,0,0,...HIT,...HIT],'formationSessionController.confirmCommand();');
  const after=snapshot(g);assert.equal(g.run('formationRounds.coordination().strikeRound'),2);
  assert.equal(g.run('formationSessionController.getView().coordination.strikeRound'),0);
  let sawSignal=false;
  while(g.run('formationSessionController.getView().phase')==='playback') {
    g.run('paint=[];drawCombat(formationSessionController.getView());');
    const v=J(g,'formationSessionController.getView()');
    const texts=J(g,'paint').filter(c=>c.type==='text').map(c=>c.args[0]);
    assert.equal(texts.includes('A heavy strike is prepared.'),v.coordination.strikeRound>0);
    if(v.playbackFrame.currentEvent?.type==='signal')sawSignal=true;
    assert.equal(snapshot(g),after);g.run('formationSessionController.advancePlayback();');
  }
  assert.equal(sawSignal,true);assert.equal(snapshot(g),after);
  g.run('formationSessionController.acknowledgePlayback();');
  assert.equal(g.run('formationSessionController.getView().coordination.strikeRound'),2);
});

test('separate map and battle pixel drawings fit native bounds for all poses',()=>{
  const g=fresh();record(g);
  for(const [name,bounds] of [['Receiver',[-52,-112,54,4]],['Caller',[-31,-113,47,4]],['Keeper',[-49,-79,48,4]]]) {
    for(const pose of ['idle','charged','strike','signal','guard']) {
      g.run(`paint=[];drawBattle${name}(0,0,'${pose}');`);
      const calls=J(g,'paint').filter(c=>c.bounds);
      assert.ok(calls.length>0);
      for(const {bounds:b} of calls)assert.ok(b[0]>=bounds[0]&&b[1]>=bounds[1]&&b[2]<=bounds[2]&&b[3]<=bounds[3],name+': '+b);
    }
  }
  g.run('formationSessionController.begin();paint=[];drawCombat(formationSessionController.getView());');
  for(const call of J(g,'paint').filter(c=>c.clip&&c.bounds)) {
    const b=call.bounds,c=call.clip;assert.ok(b[0]>=c[0]&&b[1]>=c[1]&&b[2]<=c[2]&&b[3]<=c[3]);
  }
});

test('intro reveals Receiver first, then both helpers; input never unlocks between pages',()=>{
  const g=fresh();g.run(`endCombat();reservoir_quest_started=true;gallery_deeper_stair_seen=true;
    descendSunkenGallery();placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,2.5*TILE);ascendSunkenGallery();`);
  g.press('Enter');g.press('Enter');g.press('Enter');
  assert.deepEqual(J(g,'galleryReceiverEncounter.getView().actors.map(a=>a.kind)'),['receiver']);
  assert.match(g.run('dialogue.pages[0].join(" ")'),/Something rises/);
  for(let i=0;i<3;i++) {
    g.press('Enter');assert.equal(g.run('galleryReceiverEncounter.blocksWorldInput()'),true);
    assert.deepEqual(J(g,'galleryReceiverEncounter.getView().actors.map(a=>a.kind)'),['receiver','caller','keeper']);
    assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('combat.mode'),null);
  }
  g.press('Enter');assert.equal(g.run('combat.active'),true);assert.equal(g.run('combat.mode'),'formation');
});

test('snapshot stays historical after live mutation and cleanup; no save bindings for coordination',()=>{
  const g=fresh(),{p}=prime(g),before=JSON.stringify(p);
  g.run('stats.hp=20;combat.enemies[2].hp=0;endCombat();');
  assert.equal(g.run('JSON.stringify(reel)'),before);
  g.run('saveGame();');assert.doesNotMatch(g.run('localStorage.getItem("verdantVale_save")'),/strikeRound|nextSignalRound|coordination|combat_enemy_/);
  assert.equal(g.run('SAVE_VERSION'),4);
});

module.exports={name:'Receiver coordinated signal, protection, heavy strike and staged pixel art',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' Receiver coordination/art checks passed');}};
