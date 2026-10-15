'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const ROOT=path.join(__dirname,'../..'),checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,source)=>JSON.parse(g.run('JSON.stringify('+source+')'));
const view=g=>J(g,'partyCombatLab.getView()');

function fresh() {
  const g=createContext();
  g.run(`resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);player.facing='left';
    dialogue.open=false;dialogue.callbacks=null;dialogue.triggerEncounterId=null;menu.open=false;debugMenu.open=false;statusEffects=[];
    stats.hp=40;stats.maxHp=40;stats.atk=12;stats.def=5;stats.spd=9;stats.gold=73;stats.xp=21;
    stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
    Math=Object.create(Math);var labRng=0;Math.random=()=>{labRng++;throw Error('unexpected visible Lab RNG');};`);
  return g;
}
function canonical(g){return g.run(`JSON.stringify({stats,statusEffects,slitherSpd,player,day,tick,worldToast,worldToastTimer,
  location:regionalWorldPosition(),locationState:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),
  npcs:SIMPLE_NPCS.map(n=>[n.id,n.x,n.y,n.facing]),save:localStorage.getItem('verdantVale_save')})`);}
function enter(g,id='lely_esla_one'){assert.ok(g.run('partyCombatLab.enter('+JSON.stringify(id)+')'));return view(g);}
function command(g,index){let v=view(g);assert.equal(v.phase,'awaiting_action');let turns=0;while(v.selectedCommand!==['attack','item','observe','run'][index]){assert.ok(turns++<5);g.press('ArrowRight');v=view(g);}g.press('Enter');return view(g);}
function item(g,id){let v=view(g);assert.equal(v.phase,'item');const targetIndex=v.items.findIndex(row=>row.itemId===id);assert.ok(targetIndex>=0);
  let guard=0;while(v.itemCursor!==targetIndex&&guard++<40){g.press(v.itemCursor<targetIndex?'ArrowDown':'ArrowUp');v=view(g);}assert.equal(v.selectedItemId,id);g.press('Enter');return view(g);}
function target(g,index=0){let v=view(g);assert.equal(v.phase,'targeting');const rows=v.validTargetIds;while(rows.indexOf(v.selectedTargetInstanceId)!==index){g.press('ArrowRight');v=view(g);}g.press('Enter');return view(g);}
function attack(g,index=0){command(g,0);return target(g,index);}
function arm(g,value=0){g.run(`var visibleLabValue=${value},visibleLabUses=0;Math.random=()=>{labRng++;visibleLabUses++;return visibleLabValue;};`);}
function finish(g){let guard=0;while(view(g).phase==='playback'&&guard++<100)g.press('Enter');assert.equal(view(g).phase,'playback_complete');}
function playRound(g,value=0.5){arm(g,value);g.press('Enter');assert.equal(view(g).phase,'playback');assert.equal(view(g).playbackFrame.frameIndex,0);
  const events=[],messages=[];let guard=0;while(view(g).phase==='playback'&&guard++<100){g.press('Enter');const v=view(g);events.push(v.playbackFrame.currentEvent);messages.push(g.run('formatPartyCombatLabEvent(partyCombatLab.getView())'));}
  assert.equal(view(g).phase,'playback_complete');return {events,messages,final:view(g)};}
function record(g){g.run(`var labPaint=[],labStack=[];const labProps=['fillStyle','strokeStyle','font','lineWidth','globalAlpha'];
  const emit=(type,args)=>labPaint.push({type,args,style:Object.fromEntries(labProps.map(k=>[k,ctx[k]]))});
  ctx.save=()=>labStack.push(labProps.map(k=>ctx[k]));ctx.restore=()=>{const s=labStack.pop();labProps.forEach((k,i)=>ctx[k]=s[i]);};
  ctx.fillRect=(...a)=>emit('fillRect',a);ctx.strokeRect=(...a)=>emit('strokeRect',a);ctx.fillText=(...a)=>emit('text',a);ctx.fill=()=>emit('fill',[]);`);}
const texts=calls=>calls.filter(c=>c.type==='text').map(c=>String(c.args[0]));

test('debug submenu exposes retained and showcase scenarios without entering combat',()=>{
  const g=fresh();g.press('`');for(let i=0;i<12;i++)g.press('ArrowDown');g.press('Enter');
  assert.equal(g.run('partyCombatLab.isMenuOpen()'),true);
  assert.deepEqual(J(g,'partyCombatLab.listScenarios().map(s=>s.id)'),
    ['lely_esla_one','lely_esla_two','lely_esla_three','command_showcase','boss_escape_lock']);
  for(let i=0;i<5;i++){assert.equal(g.run('partyCombatLab.getMenuView().cursor'),i);if(i<4)g.press('ArrowDown');}
  g.press('Escape');assert.equal(g.run('partyCombatLab.isMenuOpen()'),false);assert.equal(g.run('debugMenu.open'),true);
});

test('every scenario enters standard mode with fresh fixed membership and Lab-only state',()=>{
  const expected={lely_esla_one:1,lely_esla_two:2,lely_esla_three:3,command_showcase:2,boss_escape_lock:1};
  for(const [id,count] of Object.entries(expected)){const g=fresh(),v=enter(g,id);assert.equal(v.commandSet,'standard');assert.equal(v.phase,'awaiting_action');
    assert.equal(v.party.length,2);assert.equal(v.enemies.length,count);assert.deepEqual(v.party.map(m=>m.slot),[0,1]);assert.deepEqual(v.enemies.map(m=>m.slot),Array.from({length:count},(_,i)=>i));
    assert.deepEqual(v.commands,['attack','item','observe','run']);assert.equal(v.selectedCommand,'attack');assert.equal(g.run('labRng'),0);}
});

test('boss escape-lock scenario reaches its first rendered battle frame',()=>{
  const g=fresh();g.press('`');for(let i=0;i<12;i++)g.press('ArrowDown');g.press('Enter');
  for(let i=0;i<4;i++)g.press('ArrowDown');g.press('Enter');
  const v=view(g);assert.equal(v.scenarioId,'boss_escape_lock');assert.equal(v.phase,'awaiting_action');
  record(g);const before=canonical(g),rng=g.run('labRng');
  g.run('FORMATION_SPRITE_BOUNDS.delete(drawBattleMulholland);');
  const layout=J(g,'partyCombatLabBattleLayout(partyCombatLab.getView())');
  assert.equal(layout.enemies.length,1);assert.equal(layout.enemies[0].instanceId,v.enemies[0].instanceId);
  assert.doesNotThrow(()=>g.run('drawPartyCombatLabBattle()'));
  assert.doesNotThrow(()=>g.renderFrame());g.frames(120);assert.doesNotThrow(()=>g.renderFrame());
  g.press('ArrowRight');assert.equal(view(g).selectedCommand,'item');g.press('ArrowLeft');
  assert.ok(texts(J(g,'labPaint')).includes('Mulholland'));
  assert.equal(canonical(g),before);assert.equal(g.run('labRng'),rng);
});

test('Lab inventory uses registry IDs, restrained quantities, and every targeting category',()=>{
  const g=fresh();enter(g,'command_showcase');command(g,1);const rows=view(g).items;
  const quantities=Object.fromEntries(rows.map(r=>[r.itemId,r.total]));
  assert.deepEqual(quantities,{Potion:3,Elixir:2,'Reed Remedy':2,'Amethyst Dust':2,'Bullet Time':2,'Throwing Knife':2,'Sapper Charge':1,Bomb:2,'Void Shard':1,Bait:1,'Iron Sword':1,'Iron Shield':1});
  assert.deepEqual([...new Set(rows.map(r=>r.targeting))].sort(),['all_enemies','ally','enemy','self']);
  assert.equal(g.run('stats.items.length'),0);assert.equal(g.run('SAVE_VERSION'), 5);
});

test('command movement wraps with zero RNG and Attack/Observe use exact enemy targets',()=>{
  const g=fresh(),start=enter(g,'lely_esla_three'),rng=g.run('labRng');g.press('ArrowLeft');assert.equal(view(g).selectedCommand,'run');
  g.press('ArrowRight');assert.equal(view(g).selectedCommand,'attack');command(g,0);assert.equal(view(g).selectedTargetInstanceId,start.enemies[0].instanceId);
  g.press('ArrowLeft');assert.equal(view(g).selectedTargetInstanceId,start.enemies[2].instanceId);g.press('Enter');
  let v=view(g);assert.equal(v.allyActions[0].type,'attack');assert.equal(v.allyActions[0].targetId,start.enemies[2].instanceId);
  command(g,2);g.press('ArrowRight');g.press('Enter');v=view(g);assert.equal(v.phase,'ready');assert.equal(v.allyActions[1].type,'observe');assert.equal(v.allyActions[1].targetId,start.enemies[1].instanceId);assert.equal(g.run('labRng'),rng);
});

test('item scrolling, ally targeting, reservations, cancellation, and backtracking are controller-owned',()=>{
  const g=fresh();enter(g,'command_showcase');command(g,1);for(let i=0;i<4;i++)g.press('ArrowDown');let v=view(g);
  assert.equal(v.selectedItemId,'Bullet Time');assert.equal(v.itemCursor,4);assert.equal(v.itemScroll,2);g.press('Escape');v=view(g);assert.equal(v.phase,'awaiting_action');assert.equal(v.commandCursor,1);
  g.press('Enter');item(g,'Potion');v=view(g);assert.equal(v.targetSide,'ally');assert.equal(v.selectedTargetInstanceId,v.party[0].instanceId);g.press('ArrowRight');g.press('Escape');
  v=view(g);assert.equal(v.phase,'item');assert.equal(v.selectedItemId,'Potion');assert.equal(v.itemScroll,0);g.press('Enter');g.press('Enter');v=view(g);
  assert.equal(v.phase,'awaiting_action');assert.deepEqual(v.reservedInventory,[{itemId:'Potion',quantity:1}]);command(g,1);
  assert.equal(view(g).items.find(r=>r.itemId==='Potion').available,2);g.press('Escape');g.press('Escape');v=view(g);
  assert.equal(v.phase,'targeting');assert.equal(v.selectedItemId,'Potion');assert.deepEqual(v.reservedInventory,[]);g.press('Escape');assert.equal(view(g).phase,'item');assert.equal(view(g).items[0].available,3);
});

test('healing, cure, offensive, all-enemy, self-only, and equipment drafts use authentic controller flows',()=>{
  const cases=[
    ['Potion','ally',true],['Amethyst Dust','ally',true],['Throwing Knife','enemy',true],['Void Shard',null,false],['Bait',null,false],['Iron Shield',null,false],
  ];
  for(const [itemId,side,needsTarget] of cases){const g=fresh();enter(g,'command_showcase');command(g,1);let v=item(g,itemId);
    if(needsTarget){assert.equal(v.phase,'targeting');assert.equal(v.targetSide,side);v=target(g,side==='enemy'?1:0);}
    assert.equal(v.phase,'awaiting_action');assert.equal(v.allyActions[0].type,'item');assert.equal(v.allyActions[0].itemId,itemId);
    if(side==='enemy')assert.equal(v.allyActions[0].targetId,v.enemies[1].instanceId);
    if(['Bait','Iron Shield'].includes(itemId))assert.equal(v.allyActions[0].targetId,v.party[0].instanceId);
  }
});

test('Run drafts like other actions and ready retains separate confirmation',()=>{
  const g=fresh();enter(g,'lely_esla_two');attack(g,1);attack(g,0);let v=view(g);assert.equal(v.phase,'ready');assert.equal(g.run('labRng'),0);
  g.press('Escape');v=view(g);assert.equal(v.phase,'targeting');assert.equal(v.nextActorId,v.party[1].instanceId);assert.equal(v.selectedTargetInstanceId,v.enemies[0].instanceId);
  g.press('Escape');g.press('Escape');v=view(g);assert.equal(v.phase,'targeting');assert.equal(v.nextActorId,v.party[0].instanceId);assert.equal(v.selectedTargetInstanceId,v.enemies[1].instanceId);
  g.press('Enter');v=view(g);command(g,3);v=view(g);assert.equal(v.phase,'ready');assert.equal(v.allyActions.length,2);g.press('Escape');v=view(g);
  assert.equal(v.phase,'awaiting_action');assert.equal(v.nextActorId,v.party[1].instanceId);assert.equal(v.allyActions.length,1);assert.equal(v.selectedCommand,'run');assert.equal(g.run('labRng'),0);
});

test('successful, failed, and boss-blocked Run use the real resolver and retain final playback',()=>{
  {const g=fresh();enter(g);command(g,3);command(g,2);target(g);arm(g,0);g.press('Enter');assert.equal(view(g).phase,'playback');assert.equal(view(g).playbackFrame.frameIndex,0);finish(g);
    assert.equal(view(g).playbackFrame.outcome,'escape');g.press('Enter');assert.equal(view(g).phase,'escape');}
  {const g=fresh();enter(g);command(g,3);command(g,2);target(g);arm(g,0.999);g.press('Enter');finish(g);const events=view(g).playbackFrame.currentEvent;assert.equal(events.type,'round_end');
    g.press('Enter');assert.equal(view(g).phase,'awaiting_action');}
  {const g=fresh();const v=enter(g,'boss_escape_lock');assert.equal(v.bossLocked,true);command(g,3);command(g,2);target(g);arm(g,0);g.press('Enter');finish(g);
    const reel=J(g,'combatPlayerState.session.getView().playbackFrame');assert.equal(reel.outcome,'ongoing');assert.ok(g.run('combatPlayerState.session.getView().playbackFrame.complete'));g.press('Enter');assert.equal(view(g).phase,'awaiting_action');}
});

test('standard commitment generates enemy targets once and exposes frame zero before effects',()=>{
  const g=fresh();enter(g,'lely_esla_three');attack(g);attack(g);assert.equal(view(g).phase,'ready');arm(g,0);g.press('Enter');const v=view(g);
  assert.equal(v.phase,'playback');assert.equal(v.playbackFrame.frameIndex,0);assert.equal(v.enemyActions.length,3);assert.equal(g.run('visibleLabUses'),3+4+5*3);
  assert.equal(v.playbackFrame.currentEvent,null);const used=g.run('visibleLabUses');g.press('Escape');g.press('ArrowRight');assert.equal(g.run('visibleLabUses'),used);
});

test('showcase playback preserves Cursed and Slither evidence and displays recorded events',()=>{
  const g=fresh();enter(g,'command_showcase');attack(g);command(g,2);target(g,1);arm(g,0);g.press('Enter');let v=view(g);assert.equal(v.playbackFrame.frameIndex,0);
  record(g);const seen=[];while(view(g).phase==='playback'){g.run('labPaint=[];drawPartyCombatLabBattle()');seen.push(...texts(J(g,'labPaint')));g.press('Enter');}
  assert.ok(seen.some(line=>/speed shifts/.test(line)));assert.ok(seen.some(line=>/curse twists/.test(line)));assert.ok(seen.some(line=>/observes/.test(line)));
  assert.equal(view(g).playbackFrame.complete,true);
});

test('authentic item histories render healing, cure, Bullet Time, equipment, damage and established no-effect behavior',()=>{
  {const g=fresh();enter(g,'command_showcase');command(g,1);item(g,'Potion');target(g,0);command(g,1);item(g,'Iron Shield');const round=playRound(g);
    assert.ok(round.events.some(e=>e.type==='item'&&e.effect==='heal'));assert.ok(round.events.some(e=>e.type==='equipment'&&e.itemId==='Iron Shield'));
    assert.ok(round.messages.some(line=>/recovers \d+ HP/.test(line)));assert.ok(round.messages.includes('Esla equips Iron Shield.'));
    assert.equal(round.final.inventory.filter(id=>id==='Potion').length,2);assert.equal(round.final.equipment[1].shield,'Iron Shield');}
  {const g=fresh();enter(g,'command_showcase');command(g,1);item(g,'Amethyst Dust');target(g,0);command(g,1);item(g,'Bullet Time');target(g,1);const round=playRound(g);
    assert.ok(round.events.some(e=>e.type==='status'&&!e.statusesAfter.includes('cursed')));assert.ok(round.events.some(e=>e.type==='effect'&&e.itemId==='Bullet Time'));
    assert.ok(round.messages.some(line=>/cured of cursed/.test(line)));assert.ok(round.messages.some(line=>/Bullet Time surrounds Esla/.test(line)));}
  {const g=fresh();g.run(`ENEMY_TEMPLATE_REGISTRY.enemy_reed_grappler={...ENEMY_TEMPLATE_REGISTRY.enemy_reed_grappler,hp:1000,maxHp:1000};`);enter(g,'command_showcase');command(g,1);item(g,'Throwing Knife');target(g,0);command(g,1);item(g,'Void Shard');const round=playRound(g);
    assert.ok(round.events.some(e=>e.type==='item'&&e.effect==='damage'));assert.ok(round.events.some(e=>e.type==='item'&&e.effect==='damage_all'));
    assert.ok(round.messages.some(line=>/takes \d+ damage/.test(line)));assert.ok(round.messages.some(line=>/Every enemy takes/.test(line)));}
  {const g=fresh();enter(g,'command_showcase');command(g,1);item(g,'Bait');command(g,2);target(g,0);const round=playRound(g);
    assert.ok(round.events.some(e=>e.type==='item'&&e.effect==='nothing'));assert.ok(round.events.some(e=>e.type==='observe'));
    assert.ok(round.messages.some(line=>/Bait.*No effect/.test(line)));assert.ok(round.messages.some(line=>/observes Reed Grappler/.test(line)));}
});

test('Bomb placement and later ticks remain historical, round-based, and visibly formatted',()=>{
  const g=fresh();g.run(`ENEMY_TEMPLATE_REGISTRY.enemy_reed_grappler={...ENEMY_TEMPLATE_REGISTRY.enemy_reed_grappler,hp:1000,maxHp:1000,atk:0};`);enter(g,'command_showcase');
  command(g,1);item(g,'Bomb');target(g,0);command(g,2);target(g,1);let round=playRound(g);
  assert.ok(round.events.some(e=>e.type==='effect'&&e.itemId==='Bomb'));assert.ok(round.messages.some(line=>/bomb is armed/.test(line)));
  const ticks=[];for(let i=0;i<3;i++){g.press('Enter');command(g,2);target(g,0);command(g,2);target(g,1);round=playRound(g);ticks.push(...round.events.filter(e=>e.type==='delayed_effect_tick'));}
  assert.equal(ticks.length,3);assert.equal(ticks.at(-1).effect,'bomb');assert.ok(ticks.at(-1).appliedDamage>0);
  assert.ok(round.messages.some(line=>/bomb ticks for \d+ damage/.test(line)));
});

test('renderer presents enemy and ally targets, item rows, commands, and no diagnostics',()=>{
  const g=fresh();enter(g,'command_showcase');record(g);g.press('Enter');g.run('labPaint=[];drawPartyCombatLabBattle()');let calls=J(g,'labPaint');
  assert.equal(calls.filter(c=>c.type==='fill'&&c.style.fillStyle==='#f0e8b8').length,1);g.press('Escape');command(g,1);item(g,'Potion');
  g.run('labPaint=[];drawPartyCombatLabBattle()');calls=J(g,'labPaint');assert.equal(calls.filter(c=>c.type==='fill'&&c.style.fillStyle==='#f0e8b8').length,1);
  g.press('Escape');g.run('labPaint=[];drawPartyCombatLabBattle()');calls=J(g,'labPaint');assert.ok(texts(calls).some(t=>/Potion ×3/.test(t)));
  const all=texts(calls).join(' | ');assert.doesNotMatch(all,/combat_(?:party|enemy)_|CHOOSING|awaiting_action|targeting|DEV LAB|submitted/i);
  const layout=J(g,'partyCombatLabBattleLayout(partyCombatLab.getView())');assert.deepEqual(layout.allies.map(p=>[p.x,p.feetY]),[[108,277],[256,277]]);
  assert.ok(layout.enemies.every(p=>p.x>=0&&p.x+p.width<=512));
});

test('rendering reads one immutable view and consumes no RNG or state',()=>{
  const g=fresh();enter(g,'lely_esla_three');record(g);const before=canonical(g),lab=JSON.stringify(view(g)),rng=g.run('labRng');g.run('drawPartyCombatLabBattle()');
  assert.equal(canonical(g),before);assert.equal(JSON.stringify(view(g)),lab);assert.equal(g.run('labRng'),rng);
  const source=fs.readFileSync(path.join(ROOT,'render-party-combat-lab.js'),'utf8');assert.equal((source.match(/partyCombatLab\.getView\(\)/g)||[]).length,1);
  assert.doesNotMatch(source,/Math\.random|setTimeout|requestAnimationFrame|combatPlayerState|\bcombat\.|\bstats\.|\bplayer\./);
});

test('exit, terminal exit, and re-entry discard Lab state and preserve canonical state exactly',()=>{
  const g=fresh(),before=canonical(g),first=enter(g,'command_showcase').party.map(m=>m.instanceId);command(g,1);item(g,'Potion');target(g,1);
  assert.equal(g.run('partyCombatLab.exit()'),true);assert.equal(canonical(g),before);const second=enter(g,'command_showcase').party.map(m=>m.instanceId);assert.notDeepEqual(second,first);
  assert.equal(g.run('partyCombatLab.exit()'),true);assert.equal(canonical(g),before);assert.equal(g.run('stats.gold'),73);assert.equal(g.run('stats.xp'),21);
});

test('input remains one listener pair and no canonical gameplay or save route is introduced',()=>{
  const input=fs.readFileSync(path.join(ROOT,'input.js'),'utf8');assert.equal((input.match(/addEventListener\('keydown'/g)||[]).length,1);assert.equal((input.match(/addEventListener\('keyup'/g)||[]).length,1);
  assert.match(input,/!wasHeld && !e\.repeat/);const adapter=fs.readFileSync(path.join(ROOT,'party-combat-lab.js'),'utf8');
  assert.doesNotMatch(adapter,/applyKillRewards|endCombat\(|recoverCombatDefeat|transitionToLocation|saveGame\(|loadGame\(|stats\.(hp|xp|gold)\s*=/);
  for(const file of scriptOrderFromIndexHtml()){if(!/content\/|interaction|quest|encounter|maps|npcs/.test(file))continue;
    assert.doesNotMatch(fs.readFileSync(path.join(ROOT,file),'utf8'),/partyCombatLab|PARTY_COMBAT_LAB_/,file);}
  const g=fresh();assert.equal(g.run('SAVE_VERSION'), 5);assert.equal(g.run('saveGame()'),true);assert.deepEqual(JSON.parse(g.run("localStorage.getItem('verdantVale_save')")).party,{order:['lely'],characters:[],rewards:[]});assert.doesNotMatch(g.run("localStorage.getItem('verdantVale_save')"),/esla_lab|combat_party|instanceId/);
});

test('the animation loop starts only after every runtime authority is loaded',()=>{
  const scripts=scriptOrderFromIndexHtml(),loop=scripts.indexOf('game-loop.js');
  assert.equal(loop,scripts.length-1);
  for(const dependency of ['movement.js','render.js','combat.js','formation-lab.js','party-combat-lab.js','render-party-combat-lab.js','interactions.js'])
    assert.ok(scripts.indexOf(dependency)>=0&&scripts.indexOf(dependency)<loop,dependency);
});

module.exports={name:'visible four-command Party Combat Lab: controller-owned commands, history and isolation',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' four-command Party Combat Lab checks passed');}};
