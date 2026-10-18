'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {scriptOrderFromIndexHtml}=require('../harness');
const {fresh:prepare,command,orderTape,J,ids,canonical,frozen,HIT}=require('./170-party-command-rounds.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const equal=(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
function fresh(options={},begin=true){const g=prepare(options);g.run('var controller=combatPlayerState.session;var getterCalls=0;');if(begin)g.run('controller.begin({commandSet:"standard"})');return g;}
const view=g=>g.run('controller.getView()');
function state(g){return g.run(`JSON.stringify({party:combatPlayerState.getView(),local:(()=>{try{return combatPlayerState.getCommandView();}catch(e){return e.message;}})(),
  session:(()=>{try{return controller.getView();}catch(e){return e.message;}})(),round:combatPlayerState.getRoundView(),enemies:combat.enemies,sequence:combatEnemyInstanceSequence})`);}
function reject(g,source){const before=state(g),world=canonical(g),calls=g.run('rngCalls');assert.throws(()=>g.run(source));assert.equal(state(g),before);assert.equal(canonical(g),world);assert.equal(g.run('rngCalls'),calls);assert.equal(g.run('getterCalls'),0);}
function choose(g,type){let n=0;while(view(g).selectedCommand!==type){assert.ok(n++<4);g.run('controller.moveCommand("next")');}return g.run('controller.confirmCommand()');}
function target(g,id){let n=0;while(view(g).selectedTargetInstanceId!==id){assert.ok(n++<3);g.run('controller.moveTarget("next")');}return g.run('controller.confirmTarget()');}
function item(g,id,targetId){choose(g,'item');let n=0;while(view(g).selectedItemId!==id){assert.ok(n++<50);g.run('controller.moveItem("next")');}let v=g.run('controller.confirmItem()');if(v.phase==='targeting')v=target(g,targetId||v.selectedTargetInstanceId);return v;}
function attack(g,id){choose(g,'attack');return target(g,id||view(g).selectedTargetInstanceId);}
function observe(g,id){choose(g,'observe');return target(g,id||view(g).selectedTargetInstanceId);}
function ready(g){while(view(g).phase==='awaiting_action')attack(g);assert.equal(view(g).phase,'ready');}
function tape(g,source,values,hook=''){g.run('var tape='+JSON.stringify(values)+';var used=[];Math.random=()=>{rngCalls++;'+hook+'if(used.length>=tape.length)throw Error("tape exhausted");const n=tape[used.length];used.push(n);return n;};');try{const v=g.run(source);equal(J(g,'used'),values);return v;}finally{g.run('Math.random=()=>{rngCalls++;throw Error("unexpected RNG");};');}}
function commit(g,{targets,order,execution,samples=[]}={}){
  const v=view(g),allies=v.party.filter(m=>m.hp>0),enemies=v.enemies.filter(m=>m.hp>0);
  const actions=v.allyActions;
  const c={type:'party-round',allyActions:actions,enemyActions:enemies.map(e=>({actorId:e.instanceId,targetId:allies[0].instanceId}))};
  const targetDraws=allies.length>1?(targets||enemies.map(()=>0)):[];
  const executionDraws=execution||Array.from({length:actions.filter(a=>a.type==='attack').length+enemies.length},()=>HIT).flat();
  return tape(g,'controller.commitRound()',[...targetDraws,...samples,...orderTape(g,c,order),...executionDraws]);
}
function finish(g){let v=view(g);const calls=g.run('rngCalls'),live=J(g,'combatPlayerState.getCommandView()'),count=g.run('combatPlayerState.getRoundView().completedRounds');
  while(v.phase==='playback'){const at=v.frameIndex;v=g.run('controller.advancePlayback()');assert.equal(v.frameIndex,at+1);frozen(v);assert.equal(g.run('rngCalls'),calls);equal(J(g,'combatPlayerState.getCommandView()'),live);assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),count);}
  assert.equal(v.phase,'playback_complete');assert.equal(v.awaitingAcknowledgement,true);return v;
}
function next(g){finish(g);return g.run('controller.acknowledgePlayback()');}

for(let a=1;a<=3;a++)for(let e=1;e<=3;e++)test(`${a}v${e} standard begin, Attack collection, exact draws, frame zero and separate acknowledgement`,()=>{
  const g=fresh({allies:a,enemies:e}),world=canonical(g);let v=view(g);frozen(v);assert.equal(v.commandSet,'standard');assert.equal(v.phase,'awaiting_action');equal(v.commands,['attack','item','observe','run']);
  for(let i=0;i<a;i++){assert.equal(view(g).nextActorId,ids(g)[0][i]);attack(g,ids(g)[1][i%e]);}
  assert.equal(view(g).phase,'ready');assert.equal(g.run('rngCalls'),0);assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),0);
  v=commit(g);assert.equal(v.frameIndex,0);assert.equal(v.playbackFrame.eventIndex,-1);assert.equal(v.completedRounds,0);equal(v.party.map(m=>m.hp),Array(a).fill(100));
  assert.equal(g.run('rngCalls'),(a>1?e:0)+(a+e-1)+3*(a+e));assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),1);
  reject(g,'controller.commitRound()');reject(g,'controller.acknowledgePlayback()');finish(g);reject(g,'controller.advancePlayback()');reject(g,'controller.commitRound()');
  v=g.run('controller.acknowledgePlayback()');assert.equal(v.phase,'awaiting_action');assert.equal(v.completedRounds,1);assert.equal(v.nextActorId,ids(g)[0][0]);assert.equal(v.playbackFrame,null);equal(v.allyActions,[]);equal(v.enemyActions,[]);assert.equal(canonical(g),world);
});
for(const invalid of ['undefined','null','{}','{commandSet:"all"}','{commandSet:"standard",extra:1}','Object.create({commandSet:"standard"})','{get commandSet(){getterCalls++;return "standard";}}','{commandSet:()=>"standard"}'])test('closed standard begin rejects '+invalid,()=>{const g=fresh({},false);reject(g,'controller.begin('+invalid+')');assert.equal(view(g),null);});
test('one session authority rejects mixed modes and orphaned rounds',()=>{
  const g=fresh();reject(g,'controller.begin()');reject(g,'controller.begin({commandSet:"standard"})');
  const old=fresh({legacy:true},false);old.run('controller.begin()');reject(old,'controller.begin({commandSet:"standard"})');reject(old,'controller.moveCommand("next")');
  const unowned=fresh({},false),c=command(unowned);tape(unowned,'combatPlayerState.resolveRound('+JSON.stringify(c)+')',[...orderTape(unowned,c),...HIT,...HIT,...HIT,...HIT]);reject(unowned,'controller.begin({commandSet:"standard"})');
});
test('command wrap, target wrap, cancellation, prior cursor, no RNG or mutation',()=>{
  const g=fresh({enemies:3}),before=J(g,'combatPlayerState.getCommandView()');
  assert.equal(g.run('controller.moveCommand("previous")').selectedCommand,'run');assert.equal(g.run('controller.moveCommand("next")').selectedCommand,'attack');
  choose(g,'attack');assert.equal(view(g).selectedTargetInstanceId,ids(g)[1][0]);g.run('controller.moveTarget("previous")');assert.equal(view(g).selectedTargetInstanceId,ids(g)[1][2]);
  g.run('controller.cancelTargeting()');assert.equal(view(g).phase,'awaiting_action');choose(g,'attack');assert.equal(view(g).selectedTargetInstanceId,ids(g)[1][2]);
  g.run('controller.moveTarget("next")');assert.equal(view(g).selectedTargetInstanceId,ids(g)[1][0]);g.run('controller.cancelTargeting()');
  equal(J(g,'combatPlayerState.getCommandView()'),before);assert.equal(g.run('rngCalls'),0);reject(g,'controller.backtrack()');
});
test('dead slots skip collection and targeting without compaction; duplicate enemies have exact identities',()=>{
  const g=fresh({allies:3,enemies:1,party:[{hp:0},{},{hp:0}]});
  assert.equal(view(g).nextActorId,ids(g)[0][1]);choose(g,'observe');equal(view(g).validTargetIds,[ids(g)[1][0]]);g.run('controller.moveTarget("next");controller.moveTarget("previous")');g.run('controller.confirmTarget()');
  commit(g,{execution:HIT});const v=next(g);assert.equal(v.nextActorId,ids(g)[0][1]);equal(v.party.map(m=>m.slot),[0,1,2]);equal(v.enemies.map(m=>m.observeCount),[1]);
  const dead=fresh({enemies:3,enemy:[{hp:1},{},{hp:1}]});attack(dead,ids(dead)[1][0]);attack(dead,ids(dead)[1][2]);commit(dead,{execution:[...HIT,...HIT,...HIT]});next(dead);choose(dead,'attack');equal(view(dead).validTargetIds,[ids(dead)[1][1]]);dead.run('controller.moveTarget("next");controller.moveTarget("previous")');assert.equal(view(dead).selectedTargetInstanceId,ids(dead)[1][1]);
  const d=fresh({enemies:3});observe(d,ids(d)[1][1]);observe(d,ids(d)[1][2]);commit(d);const final=finish(d);equal(final.enemies.map(e=>e.observeCount),[0,1,1]);assert.equal(new Set(final.enemies.map(e=>e.instanceId)).size,3);
});
test('submitAttack compatibility in standard mode validates exact current actor',()=>{
  const g=fresh();reject(g,'controller.submitAttack({actorId:"combat_party_2",targetId:"combat_enemy_1"})');
  g.run('controller.submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_2"})');assert.equal(view(g).nextActorId,'combat_party_2');
  choose(g,'observe');reject(g,'controller.submitAttack({actorId:"combat_party_2",targetId:"combat_enemy_1"})');g.run('controller.cancelTargeting()');attack(g);g.run('controller.backtrack()');assert.equal(view(g).phase,'targeting');assert.equal(view(g).selectedCommand,'attack');
});
test('item first-appearance grouping, key exclusion, quantities and three-row scroll preservation',()=>{
  const g=fresh({inventory:['Bomb','Potion','Iron Sword','Potion','Reed Remedy','Throwing Knife','Bait']});choose(g,'item');
  equal(view(g).items.map(x=>[x.itemId,x.total]),[['Bomb',1],['Potion',2],['Iron Sword',1],['Reed Remedy',1],['Throwing Knife',1],['Bait',1]]);
  for(let i=0;i<4;i++)g.run('controller.moveItem("next")');assert.equal(view(g).itemCursor,4);assert.equal(view(g).itemScroll,2);g.run('controller.confirmItem()');assert.equal(view(g).targetSide,'enemy');
  g.run('controller.cancelTargeting()');assert.equal(view(g).phase,'item');assert.equal(view(g).itemCursor,4);assert.equal(view(g).itemScroll,2);g.run('controller.cancelItem()');choose(g,'item');assert.equal(view(g).itemCursor,4);assert.equal(view(g).itemScroll,2);
  for(let i=0;i<8;i++)g.run('controller.moveItem("previous")');assert.equal(view(g).itemCursor,0);assert.equal(view(g).itemScroll,0);assert.equal(g.run('rngCalls'),0);
  const empty=fresh();choose(empty,'item');equal(view(empty).items,[]);reject(empty,'controller.confirmItem()');empty.run('controller.moveItem("next");controller.cancelItem()');
  // Key items fail in the shared preparation authority; no controller can expose them.
  const bad=fresh({},false);bad.run('combatPlayerState.clear();seed.inventory=[Object.keys(ITEM_REGISTRY).find(k=>ITEM_REGISTRY[k].keyItem)]');reject(bad,'combatPlayerState.initializeCommandParty(seed)');
});
test('shared reservations prevent overcommit and release on backtrack without inventory consumption',()=>{
  const g=fresh({inventory:['Potion'],party:[{hp:20},{hp:20}]});item(g,'Potion',ids(g)[0][1]);equal(view(g).reservedInventory,[{itemId:'Potion',quantity:1}]);
  choose(g,'item');assert.equal(view(g).items[0].available,0);assert.equal(view(g).items[0].usable,false);reject(g,'controller.confirmItem()');g.run('controller.cancelItem();controller.backtrack()');
  assert.equal(view(g).nextActorId,ids(g)[0][0]);equal(view(g).reservedInventory,[]);assert.equal(view(g).selectedTargetInstanceId,ids(g)[0][1]);assert.equal(view(g).items[0].available,1);
  g.run('controller.cancelTargeting();controller.cancelItem()');attack(g);item(g,'Potion',ids(g)[0][1]);assert.equal(view(g).phase,'ready');equal(view(g).inventory,['Potion']);assert.equal(g.run('rngCalls'),0);
  commit(g);equal(view(g).inventory,['Potion']);equal(J(g,'combatPlayerState.getCommandView().inventory'),[]);equal(finish(g).inventory,[]);
});
test('two copies allow two reservations and replacing a draft releases only its own quantity',()=>{
  const g=fresh({inventory:['Potion','Potion']});item(g,'Potion');item(g,'Potion');equal(view(g).reservedInventory,[{itemId:'Potion',quantity:2}]);
  g.run('controller.backtrack()');equal(view(g).reservedInventory,[{itemId:'Potion',quantity:1}]);g.run('controller.cancelTargeting();controller.cancelItem()');observe(g);equal(view(g).reservedInventory,[{itemId:'Potion',quantity:1}]);
});
for(const id of ['Potion','Reed Remedy','Amethyst Dust','Bullet Time'])test('ally-target '+id+' defaults to actor, wraps, and records historical state',()=>{
  const g=fresh({inventory:[id],party:[{hp:30},{hp:40,statuses:['poison','cursed']}]});choose(g,'item');g.run('controller.confirmItem()');assert.equal(view(g).selectedTargetInstanceId,ids(g)[0][0]);
  target(g,ids(g)[0][1]);observe(g);commit(g);const first=view(g);equal(first.inventory,[id]);assert.equal(first.party[1].hp,40);const final=finish(g);equal(final.inventory,[]);
  if(id==='Potion')assert.ok(final.party[1].hp>=60);if(id==='Reed Remedy')assert.ok(!final.party[1].statuses.includes('poison'));if(id==='Amethyst Dust')assert.ok(!final.party[1].statuses.includes('cursed'));if(id==='Bullet Time')assert.equal(final.effects[1].evadeTurns,3);
});
for(const id of ['Iron Sword','Bait','Void Shard','Throwing Knife','Bomb'])test('closed item targeting and execution: '+id,()=>{
  const g=fresh({inventory:[id]});item(g,id,id==='Throwing Knife'||id==='Bomb'?ids(g)[1][1]:undefined);observe(g);const draft=view(g).allyActions[0];
  if(id==='Void Shard')assert.equal(Object.hasOwn(draft,'targetId'),false);else assert.equal(draft.targetId,ids(g)[id==='Iron Sword'||id==='Bait'?0:1][id==='Iron Sword'||id==='Bait'?0:1]);
  commit(g);const final=finish(g);if(id==='Iron Sword')assert.equal(final.equipment[0].weapon,id);if(id==='Bait')equal(final.inventory,[id]);if(id==='Bomb')assert.equal(final.effects[0].bomb.targetId,ids(g)[1][1]);
});
test('ready backtracking restores Observe and Attack targets with no RNG',()=>{
  const g=fresh({enemies:3});attack(g,ids(g)[1][2]);observe(g,ids(g)[1][1]);g.run('controller.backtrack()');assert.equal(view(g).selectedCommand,'observe');assert.equal(view(g).selectedTargetInstanceId,ids(g)[1][1]);
  g.run('controller.backtrack()');assert.equal(view(g).phase,'awaiting_action');g.run('controller.backtrack()');assert.equal(view(g).nextActorId,ids(g)[0][0]);assert.equal(view(g).selectedCommand,'attack');assert.equal(view(g).selectedTargetInstanceId,ids(g)[1][2]);assert.equal(g.run('rngCalls'),0);
});
test('Run is an ordinary draft and backtracking preserves earlier item reservations',()=>{
  const g=fresh({inventory:['Potion']});item(g,'Potion',ids(g)[0][1]);const actions=view(g).allyActions,reservations=view(g).reservedInventory;
  choose(g,'run');assert.equal(view(g).phase,'ready');equal(view(g).allyActions,[...actions,{type:'run',actorId:ids(g)[0][1]}]);
  g.run('controller.backtrack()');equal(view(g).allyActions,actions);equal(view(g).reservedInventory,reservations);assert.equal(view(g).selectedCommand,'run');assert.equal(g.run('rngCalls'),0);
  choose(g,'run');commit(g,{execution:[0]});equal(view(g).allyActions,[...actions,{type:'run',actorId:ids(g)[0][1]}]);equal(view(g).inventory,['Potion']);assert.equal(next(g).phase,'escape');
});
for(const kind of ['success','failure','boss','policy'])test('Run '+kind+' preserves scheduled enemies and exact roll accounting',()=>{
  const g=fresh({boss:kind==='boss',escape:kind==='policy'?'blocked':'fastest_living'});choose(g,'run');observe(g);
  const success=kind==='success',blocked=kind==='boss'||kind==='policy';commit(g,{execution:success?[0]:[...(blocked?[]:[0.99]),...HIT,...HIT]});
  const v=finish(g);equal(v.allyActions.map(action=>action.type),['run','observe']);
  assert.equal(v.enemies[0].observeCount,success?0:1,'successful escape truncates; failed/blocked Run leaves the other ally action intact');
  assert.equal(v.playbackFrame.outcome,success?'escape':'ongoing');const terminal=g.run('controller.acknowledgePlayback()');assert.equal(terminal.phase,success?'escape':'awaiting_action');
  if(success){assert.equal(terminal.frameIndex,terminal.frameCount-1);reject(g,'controller.commitRound()');reject(g,'controller.backtrack()');}
});
for(const a of [1,2,3])for(const roll of [0,0.499999,0.999999])test('enemy target draws use stable living slots with '+a+' allies at '+roll,()=>{
  const g=fresh({allies:a,enemies:3});ready(g);const v=commit(g,{targets:[roll,roll,roll]});equal(v.enemyActions.map(x=>x.targetId),Array(3).fill(ids(g)[0][Math.floor(roll*a)]));assert.equal(g.run('rngCalls'),(a===1?0:3)+(a+2)+3*(a+3));
});
test('Run targets include non-runner; enemy before runner attacks first and dead runner gets no escape roll',()=>{
  const g=fresh({allies:2,enemies:1,party:[{hp:1},{}]});choose(g,'run');observe(g);commit(g,{order:['e0','a0','a1'],execution:HIT});
  const last=finish(g);assert.equal(last.party[0].hp,0);assert.equal(last.playbackFrame.outcome,'ongoing');assert.equal(g.run('rngCalls'),1+2+3);assert.equal(g.run('controller.acknowledgePlayback()').nextActorId,ids(g)[0][1]);
  const other=fresh({allies:2,enemies:1});choose(other,'run');observe(other);commit(other,{targets:[0.9],order:['e0','a0','a1'],execution:[...HIT,0]});const end=next(other);assert.equal(end.phase,'escape');assert.equal(end.party[0].hp,100);assert.equal(end.party[1].hp,93);
});
test('frozen enemy targets cancel after sole committed target dies; living allies do not retarget',()=>{
  const g=fresh({party:[{hp:1},{}]});ready(g);commit(g,{order:['e0','e1','a0','a1'],execution:[...HIT,...HIT]});
  let reasons=[];while(view(g).phase==='playback'){const v=g.run('controller.advancePlayback()');if(v.playbackFrame.currentEvent?.reason)reasons.push(v.playbackFrame.currentEvent.reason);}
  equal(reasons,['target_dead','actor_dead']);equal(view(g).enemyActions.map(x=>x.targetId),[ids(g)[0][0],ids(g)[0][0]]);assert.equal(view(g).party[1].hp,100);
});
for(const outcome of ['victory','defeat'])test(outcome+' terminal frame retention, fixed slots, no recovery and rejection',()=>{
  const g=fresh(outcome==='victory'?{enemies:1,enemy:[{hp:1}]}:{allies:1,enemies:1,party:[{hp:1}]}),world=canonical(g);ready(g);
  commit(g,{order:outcome==='victory'?['a0','a1','e0']:['e0','a0'],execution:HIT});const final=finish(g);assert.equal(final.playbackFrame.outcome,outcome);const v=g.run('controller.acknowledgePlayback()');assert.equal(v.phase,outcome);equal(v.playbackFrame,final.playbackFrame);assert.equal(canonical(g),world);
  for(const op of ['confirmCommand()','backtrack()','commitRound()','advancePlayback()','acknowledgePlayback()','begin({commandSet:"standard"})'])reject(g,'controller.'+op);
});
test('historical inventory, equipment, status, effects and observation never leak from final live state',()=>{
  const g=fresh({allies:3,inventory:['Iron Sword','Bullet Time']});item(g,'Iron Sword');item(g,'Bullet Time',ids(g)[0][0]);observe(g,ids(g)[1][1]);commit(g);
  assert.equal(view(g).equipment[0].weapon,null);equal(view(g).inventory,['Iron Sword','Bullet Time']);assert.equal(view(g).effects[0].evadeTurns,0);assert.equal(view(g).enemies[1].observeCount,0);
  while(view(g).phase==='playback'){const v=g.run('controller.advancePlayback()'),f=v.playbackFrame;for(const k of ['party','enemies','inventory','equipment','effects','bossLocked','escapePolicy'])equal(v[k],f[k]);}
  assert.equal(view(g).equipment[0].weapon,'Iron Sword');assert.equal(view(g).effects[0].evadeTurns,3);assert.equal(view(g).enemies[1].observeCount,1);
});
for(const change of ['combat.enemies[0].hp--','combat.enemies[0].spd++','combat.enemies[0].observeCount++','combat.message="queued"',
  'combat.enemies=Object.freeze(combat.enemies.map(e=>Object.defineProperties({},Object.getOwnPropertyDescriptors(e))))',
  'ITEM_REGISTRY.Potion.heals++','ITEM_REGISTRY["Iron Sword"].bonus++'])test('stale state rejects before target RNG: '+change,()=>{
  const g=fresh({inventory:['Potion','Iron Sword']});ready(g);g.run(change);reject(g,'controller.commitRound()');assert.equal(g.run('rngCalls'),0);
});
test('owned equipment/status/effects/inventory reject external writes and detached seeds cannot invalidate drafts',()=>{
  const g=fresh({inventory:['Potion']});ready(g);g.run('seed.inventory.length=0;seed.members[0].statuses.push("cursed")');assert.equal(view(g).inventory.length,1);
  for(const op of ['combatPlayerState.setHp("combat_party_1",0)','combatPlayerState.setStatuses("combat_party_1",["slither"])','combatPlayerState.resolveRound({})','combatPlayerState.resolveAttackRound({})','combat.active=true'])reject(g,op);
  const v=view(g);frozen(v);assert.throws(()=>v.inventory.pop());assert.throws(()=>{v.equipment[0].weapon='Iron Sword';});assert.throws(()=>v.party[0].statuses.push('cursed'));
});
test('stale actor IDs after cleanup/replacement reject; one authority clears both session modes',()=>{
  const g=fresh();ready(g);const old=JSON.stringify(view(g));g.run('combatPlayerState.clear();combatPlayerState.initializeCommandParty(seed);controller.begin({commandSet:"standard"})');assert.equal(view(g).nextActorId,'combat_party_3');
  reject(g,'controller.submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_1"})');assert.ok(old.includes('combat_party_1'));
});
for(const op of ['moveCommand("up")','moveCommand(()=>"next")','confirmCommand(1)','moveItem("next")','confirmItem()','cancelItem()','moveTarget("next")','confirmTarget()','cancelTargeting()','commitRound()','advancePlayback()','acknowledgePlayback()'])test('invalid operation rejects atomically: '+op,()=>{const g=fresh();reject(g,'controller.'+op);});
test('all navigation and cancellation reject during playback and final acknowledgement wait',()=>{
  const g=fresh();ready(g);commit(g);const ops=['moveCommand("next")','confirmCommand()','moveItem("next")','confirmItem()','cancelItem()','moveTarget("next")','confirmTarget()','cancelTargeting()','backtrack()','commitRound()'];
  for(const op of ops)reject(g,'controller.'+op);finish(g);for(const op of ops)reject(g,'controller.'+op);
});
for(const roll of ['NaN','Infinity','-1','1'])test('bad target RNG retains diagnostics without retry: '+roll,()=>{
  const g=fresh();ready(g);g.run('Math.random=()=>{rngCalls++;return '+roll+'}');assert.throws(()=>g.run('controller.commitRound()'));assert.equal(view(g).phase,'fault');equal(view(g).failure,{stage:'targets',targetDraws:1,completedRounds:0});reject(g,'controller.commitRound()');assert.equal(g.run('rngCalls'),1);
});
test('target-RNG reentrancy and replaced membership fail closed without resolution',()=>{
  for(const hook of ['controller.commitRound()','combatPlayerState.resolveRound({})','combat.enemy=null;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp}']){
    const g=fresh();ready(g);g.run('Math.random=()=>{rngCalls++;'+hook+';return 0}');assert.throws(()=>g.run('controller.commitRound()'));assert.equal(view(g).phase,'fault');assert.equal(view(g).failure.stage,'targets');assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),0);assert.equal(g.run('rngCalls'),1);
  }
});
test('partial resolver failure retains consumed HP and exact targets; no retry',()=>{
  const g=fresh();ready(g);assert.throws(()=>tape(g,'controller.commitRound()',[0,0,0,0,0,...HIT]),/tape exhausted/);assert.equal(view(g).phase,'fault');assert.equal(view(g).failure.stage,'resolve');assert.equal(g.run('combat.enemies[0].hp'),93);assert.equal(view(g).enemyActions.length,2);reject(g,'controller.commitRound()');
});
test('playback failure retains completed round and diagnostic lockout',()=>{
  const g=fresh();ready(g);g.run('var originalCopy=copyFormationData;copyFormationData=function(v){if(v&&v.events&&combatPlayerState.getRoundView().completedRounds===1)throw Error("injected playback failure");return originalCopy(v)}');
  assert.throws(()=>commit(g));g.run('copyFormationData=originalCopy');assert.equal(view(g).phase,'fault');equal(view(g).failure,{stage:'playback',targetDraws:2,completedRounds:1});assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),1);reject(g,'controller.commitRound()');
});
test('exactly one generalized resolver/playback call site; frozen views; explicit Lab and canonical owners',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../../combat.js'),'utf8'),start=source.indexOf('  const session=(() => {'),end=source.indexOf('    session,',start),controllerSource=source.slice(start,end);
  assert.equal((controllerSource.match(/combatPlayerState\.resolveRound\(/g)||[]).length,1);assert.equal((controllerSource.match(/combatPlayerState\.createRoundPlayback\(/g)||[]).length,1);
  for(const file of scriptOrderFromIndexHtml())if(file!=='combat.js'){
    const fileSource=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
    assert.equal((fileSource.match(/commandSet\s*:\s*['"]standard['"]/g)||[]).length,file==='party-combat-lab.js'?1:0,file);
    assert.doesNotMatch(fileSource,/combatPlayerState\.session\.(?:moveCommand|confirmCommand|moveItem|confirmItem|cancelItem|moveTarget|confirmTarget|cancelTargeting)\(/,file);
    assert.equal((fileSource.match(/combatPlayerState\.session\[method\]\s*\(/g)||[]).length,['party-combat-lab.js','canonical-party-combat.js'].includes(file)?1:0,file);
  }
  const g=fresh();ready(g);const before=state(g),world=canonical(g),old=view(g),oldText=JSON.stringify(old);frozen(old);g.press('Enter');g.press('ArrowRight');g.frames(3);assert.equal(state(g),before);assert.equal(canonical(g),world);
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);assert.equal(g.run('SAVE_VERSION'), 5);commit(g);finish(g);g.run('controller.acknowledgePlayback()');assert.equal(JSON.stringify(old),oldText);assert.equal(canonical(g),world);
});
test('resolver and playback each execute once; view reads and acknowledgement never repeat them',()=>{
  const read=fs.readFileSync;let g;
  fs.readFileSync=function(file,...args){const source=read.call(this,file,...args);if(typeof file==='string'&&file.endsWith('/combat.js')&&typeof source==='string')return source
    .replace('result=combatPlayerState.resolveRound(request);','globalThis.standardResolveCalls=(globalThis.standardResolveCalls||0)+1;result=combatPlayerState.resolveRound(request);')
    .replace('const playback=combatPlayerState.createRoundPlayback(result),after=', 'globalThis.standardPlaybackCalls=(globalThis.standardPlaybackCalls||0)+1;const playback=combatPlayerState.createRoundPlayback(result),after=');return source;};
  try{g=fresh();}finally{fs.readFileSync=read;}
  ready(g);commit(g);for(let i=0;i<3;i++)view(g);reject(g,'controller.commitRound()');next(g);equal(J(g,'[standardResolveCalls,standardPlaybackCalls]'),[1,1]);
  ready(g);commit(g);next(g);equal(J(g,'[standardResolveCalls,standardPlaybackCalls]'),[2,2]);assert.equal(view(g).completedRounds,2);
});
test('backtracking self/all-target items restores item cursor and scroll, releasing their reservation',()=>{
  const g=fresh({inventory:['Potion','Bomb','Bait','Reed Remedy','Iron Sword','Void Shard']});item(g,'Iron Sword');item(g,'Void Shard');
  g.run('controller.backtrack()');assert.equal(view(g).phase,'item');assert.equal(view(g).selectedItemId,'Void Shard');assert.equal(view(g).itemCursor,5);assert.equal(view(g).itemScroll,3);equal(view(g).reservedInventory,[{itemId:'Iron Sword',quantity:1}]);
  g.run('controller.cancelItem();controller.backtrack()');assert.equal(view(g).selectedItemId,'Iron Sword');assert.equal(view(g).itemCursor,4);assert.equal(view(g).itemScroll,2);equal(view(g).reservedInventory,[]);assert.equal(g.run('rngCalls'),0);
});
test('ally targets skip defeated slots and navigation cannot change canonical or prepared state',()=>{
  const g=fresh({allies:3,party:[{},{hp:0},{}],inventory:['Potion']}),before=J(g,'combatPlayerState.getCommandView()'),world=canonical(g);choose(g,'item');g.run('controller.confirmItem()');equal(view(g).validTargetIds,[ids(g)[0][0],ids(g)[0][2]]);
  g.run('controller.moveTarget("previous")');assert.equal(view(g).selectedTargetInstanceId,ids(g)[0][2]);g.run('controller.moveTarget("next")');assert.equal(view(g).selectedTargetInstanceId,ids(g)[0][0]);equal(J(g,'combatPlayerState.getCommandView()'),before);assert.equal(canonical(g),world);assert.equal(g.run('rngCalls'),0);
});
for(const type of ['item','observe'])test('committed '+type+' cancels when an earlier Attack kills its exact target',()=>{
  const g=fresh({enemy:[{hp:1},{}],inventory:['Throwing Knife']});attack(g);if(type==='item')item(g,'Throwing Knife',ids(g)[1][0]);else observe(g);
  commit(g,{execution:[...HIT,...HIT]});let cancelled=false;while(view(g).phase==='playback'){const v=g.run('controller.advancePlayback()');if(v.playbackFrame.currentEvent?.type==='cancel'){cancelled=true;assert.equal(v.playbackFrame.currentEvent.reason,'target_dead');}}
  assert.ok(cancelled);equal(view(g).inventory,['Throwing Knife']);equal(view(g).enemies.map(e=>e.observeCount),[0,0]);assert.equal(view(g).enemies[1].hp,100);
});
test('dead item user keeps shared inventory untouched and historical command slot intact',()=>{
  const g=fresh({party:[{hp:1},{}],inventory:['Potion']});item(g,'Potion',ids(g)[0][1]);observe(g);commit(g,{order:['e0','a0','a1','e1'],execution:HIT});equal(finish(g).inventory,['Potion']);assert.equal(view(g).allyActions[0].actorId,ids(g)[0][0]);assert.equal(view(g).party[0].slot,0);
});
test('encounter boss lock persists into a Run after its only boss dies',()=>{
  const g=fresh({boss:true,enemy:[{hp:1},{}]});attack(g);observe(g,ids(g)[1][1]);commit(g,{execution:[...HIT,...HIT]});next(g);assert.equal(view(g).bossLocked,true);choose(g,'run');observe(g,ids(g)[1][1]);commit(g,{execution:HIT});assert.equal(next(g).phase,'awaiting_action');assert.equal(view(g).bossLocked,true);
});
test('Slither retained sample, Curse cure and later duration views remain historical',()=>{
  const g=fresh({allies:2,enemies:1,inventory:['Amethyst Dust'],party:[{statuses:['slither']},{statuses:['cursed']}],slither:[{slot:0,speed:10}]});
  item(g,'Amethyst Dust',ids(g)[0][1]);attack(g);commit(g,{execution:[...HIT,...HIT]});assert.equal(view(g).effects[0].slither.speed,10);equal(view(g).party[1].statuses,['cursed']);const end=next(g);equal(end.party[1].statuses,[]);assert.equal(end.effects[0].slither.round,0);
  choose(g,'run');observe(g);commit(g,{execution:[0]});assert.equal(next(g).phase,'escape');assert.equal(view(g).effects[0].slither.speed,10);
});
test('Slither Attack samples and Bullet Time advancement come solely from authentic resolver and playback',()=>{
  const g=fresh({enemies:1,inventory:['Bullet Time'],party:[{statuses:['slither']},{}],slither:[{slot:0,speed:10}]});
  attack(g);item(g,'Bullet Time',ids(g)[0][0]);commit(g,{samples:[0.45],execution:[...HIT,...HIT]});assert.equal(view(g).effects[0].slither.round,0);next(g);assert.equal(view(g).effects[0].slither.round,1);assert.equal(view(g).effects[0].evadeTurns,3);
  attack(g);observe(g);commit(g,{samples:[0.45],execution:[...HIT,...HIT]});assert.equal(view(g).effects[0].evadeTurns,3);next(g);assert.equal(view(g).effects[0].evadeTurns,2);assert.equal(view(g).completedRounds,2);
});
test('prospective unsafe equipment rejects before draft mutation or target RNG',()=>{
  const g=fresh({inventory:['Iron Sword'],party:[{},{}]});
  // Registry edits are independently rejected by the session seal before selection.
  g.run('ITEM_REGISTRY["Iron Sword"].bonus=Number.MAX_SAFE_INTEGER');reject(g,'controller.confirmCommand()');assert.equal(g.run('rngCalls'),0);
});
module.exports={name:'Generalized party session: command navigation, reservations, Run and historical playback',checks,
  run(){for(const c of checks){try{c.run();}catch(e){console.error('Failed standard session check:',c.name);throw e;}}console.log('  '+checks.length+' generalized party session checks passed');}};
