'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const ROOT=path.join(__dirname,'../..'),checks=[],test=(name,run)=>checks.push({name,run}),HIT=[0.5,0.99,0.99];
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')')),view=g=>J(g,'partyCombatLab.getView()');
function fresh(){const g=createContext();g.run(`resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);
  dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMenu.open=false;statusEffects=[];
  stats.hp=100;stats.maxHp=100;stats.atk=8;stats.def=2;stats.spd=7;
  stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
  Math=Object.create(Math);var labRngCalls=0;Math.random=()=>{labRngCalls++;throw Error('unexpected party lab RNG');};`);return g;}
function open(g){g.press('`');for(let i=0;i<12;i++)g.press('ArrowDown');g.press('Enter');assert.equal(g.run('partyCombatLab.isMenuOpen()'),true);}
function start(g,index=0){open(g);for(let i=0;i<index;i++)g.press('ArrowDown');g.press('Enter');assert.equal(g.run('partyCombatLab.isActive()'),true);return view(g);}
function tape(g,values,work){g.run(`var partyTape=${JSON.stringify(values)},partyUsed=0;Math.random=()=>{labRngCalls++;if(partyUsed===partyTape.length)throw Error('tape exhausted');return partyTape[partyUsed++];};`);
  try{work();assert.equal(g.run('partyUsed'),values.length);}finally{g.run("Math.random=()=>{labRngCalls++;throw Error('unexpected party lab RNG');};");}}
function submitBoth(g,first=0,second=0){let v=view(g);while(v.phase==='collecting'){const index=v.allyActions.length?second:first;
  for(let moves=0;v.enemies.findIndex(e=>e.instanceId===v.selectedTargetInstanceId)!==index&&moves<10;moves++){g.press('ArrowRight');v=view(g);}
  assert.equal(v.enemies.findIndex(e=>e.instanceId===v.selectedTargetInstanceId),index);g.press('Enter');v=view(g);}assert.equal(v.phase,'ready');return v;}
function ordinaryRoundTape(enemyCount){const actors=2+enemyCount;return [...Array(enemyCount).fill(0),...Array(actors-1).fill(0),...Array.from({length:actors},()=>HIT).flat()];}
function finishPlayback(g){let v=view(g),steps=0;while(v.phase==='playback'&&steps<30){const index=v.playbackFrame.frameIndex;g.press('Enter');v=view(g);assert.equal(v.playbackFrame.frameIndex,index+1);steps++;}assert.equal(v.phase,'playback_complete');return steps;}
function canonical(g){return g.run(`JSON.stringify({stats,player,day,tick,statusEffects,location:regionalWorldPosition(),state:snapshotLocationState(),
  flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),npcs:SIMPLE_NPCS.map(n=>[n.id,n.x,n.y,n.facing]),save:localStorage.getItem('verdantVale_save')})`);}

test('debug row opens the scenario menu, supports navigation and cancels without entry',()=>{const g=fresh();g.press('`');
  assert.equal(g.run('DEBUG_MENU_ROW_COUNT'),13);for(let i=0;i<30;i++)g.press('ArrowDown');assert.equal(g.run('debugMenu.cursor'),12);
  g.press('Enter');assert.equal(g.run('partyCombatLab.isMenuOpen()'),true);assert.equal(g.run('partyCombatLab.getMenuView().cursor'),0);
  g.press('ArrowDown');assert.equal(g.run('partyCombatLab.getMenuView().cursor'),1);g.press('ArrowUp');assert.equal(g.run('partyCombatLab.getMenuView().cursor'),0);
  g.press('Escape');assert.equal(g.run('partyCombatLab.isMenuOpen()'),false);assert.equal(g.run('debugMenu.open'),true);assert.equal(g.run('debugMenu.cursor'),12);
});

test('scenario entry rejection stays recoverable in the submenu and is atomic',()=>{const g=fresh();open(g);g.run('statusEffects=["poison"];');
  const before=canonical(g),enemySequence=g.run('combatEnemyInstanceSequence'),calls=g.run('labRngCalls');g.press('Enter');
  assert.equal(g.run('partyCombatLab.isMenuOpen()'),true);assert.equal(g.run('partyCombatLab.isActive()'),false);
  assert.match(g.run('partyCombatLab.getMenuView().error'),/Unsupported formation|supported Lely state|entry rejected/);assert.equal(g.run('combatEnemyInstanceSequence'),enemySequence);
  assert.equal(g.run('labRngCalls'),calls);assert.equal(canonical(g),before);g.press('Escape');assert.equal(g.run('debugMenu.open'),true);
});

for(const index of [0,1,2])test('scenario '+index+' enters the authentic 2v'+(index+1)+' session',()=>{const g=fresh(),v=start(g,index);
  assert.equal(v.party.length,2);assert.equal(v.enemies.length,index+1);assert.equal(v.phase,'collecting');assert.equal(v.nextActorId,v.party[0].instanceId);
  assert.equal(v.selectedTargetInstanceId,v.enemies[0].instanceId);assert.equal(g.run('debugMenu.open'),false);assert.equal(g.run('labRngCalls'),0);
});

test('target selection wraps by living stable slot with zero RNG',()=>{const g=fresh(),first=start(g,2),calls=g.run('labRngCalls');
  g.press('ArrowLeft');assert.equal(view(g).selectedTargetInstanceId,first.enemies[2].instanceId);g.press('d');assert.equal(view(g).selectedTargetInstanceId,first.enemies[0].instanceId);
  g.press('ArrowRight');assert.equal(view(g).selectedTargetInstanceId,first.enemies[1].instanceId);assert.equal(g.run('labRngCalls'),calls);
  g.keydown('ArrowRight',{repeat:true});g.release('ArrowRight');assert.equal(view(g).selectedTargetInstanceId,first.enemies[1].instanceId);
});

test('commands advance Lely to Esla, stop ready, and backtrack with exact target restoration',()=>{const g=fresh(),first=start(g,2);
  g.press('ArrowRight');g.press('Enter');let v=view(g);assert.equal(v.nextActorId,v.party[1].instanceId);assert.equal(v.allyActions[0].targetId,first.enemies[1].instanceId);
  assert.equal(v.selectedTargetInstanceId,first.enemies[0].instanceId);g.press('ArrowRight');g.press('ArrowRight');g.press('Enter');v=view(g);
  assert.equal(v.phase,'ready');assert.equal(v.selectedTargetInstanceId,null);assert.equal(v.allyActions[1].targetId,first.enemies[2].instanceId);assert.equal(g.run('labRngCalls'),0);
  g.press('Escape');v=view(g);assert.equal(v.phase,'collecting');assert.equal(v.nextActorId,v.party[1].instanceId);assert.equal(v.selectedTargetInstanceId,first.enemies[2].instanceId);
  g.press('Escape');v=view(g);assert.equal(v.nextActorId,v.party[0].instanceId);assert.equal(v.selectedTargetInstanceId,first.enemies[1].instanceId);assert.equal(v.allyActions.length,0);
});

test('ready confirmation resolves once, begins at frame zero, and advances one frame per press',()=>{const g=fresh();start(g,1);submitBoth(g,0,1);
  tape(g,ordinaryRoundTape(2),()=>{g.hold('Enter');g.hold('Enter');g.release('Enter');});let v=view(g);
  assert.equal(v.phase,'playback');assert.equal(v.playbackFrame.frameIndex,0);assert.equal(g.run('combatPlayerState.getRoundView().completedRounds'),1);
  const live=J(g,'[...combatPlayerState.getView().members,...combat.enemies].map(m=>m.hp)');g.press('Escape');assert.equal(view(g).playbackFrame.frameIndex,0);
  for(let steps=0;view(g).phase==='playback'&&steps<30;steps++){const before=view(g).playbackFrame.frameIndex;g.hold('Enter');g.hold('Enter');g.release('Enter');
    assert.equal(view(g).playbackFrame.frameIndex,before+1);assert.deepEqual(J(g,'[...combatPlayerState.getView().members,...combat.enemies].map(m=>m.hp)'),live);}
  assert.equal(view(g).phase,'playback_complete');g.press('Escape');assert.equal(view(g).phase,'playback_complete');g.press('Enter');
  v=view(g);assert.equal(v.phase,'collecting');assert.equal(v.selectedTargetInstanceId,v.enemies.find(e=>e.hp>0).instanceId);
});

test('target RNG and scheduler RNG remain exact for one to three enemies',()=>{for(const enemies of [1,2,3]){const g=fresh();start(g,enemies-1);submitBoth(g);
  g.run('var partyTape=Array(40).fill(0),partyUsed=0;Math.random=()=>{labRngCalls++;return partyTape[partyUsed++];};');g.press('Enter');
  assert.equal(view(g).playbackFrame.frameIndex,0);let attacks=0;while(view(g).phase==='playback'){g.press('Enter');if(view(g).playbackFrame.currentEvent?.type==='attack')attacks++;}
  assert.equal(g.run('partyUsed'),enemies+(enemies+1)+3*attacks,'enemy target draws + N-1 initiative draws + three rolls per executed attack');}}
);

test('a killed enemy retains its slot, is skipped, and the next round selects the lowest survivor',()=>{const g=fresh();g.run('stats.atk=100;');const initial=start(g,1);
  submitBoth(g,0,0);tape(g,[0,0,0,0,0,...HIT,...HIT],()=>g.press('Enter'));finishPlayback(g);g.press('Enter');const next=view(g);
  assert.equal(next.phase,'collecting');assert.deepEqual(next.enemies.map(e=>e.slot),[0,1]);assert.equal(next.enemies[0].hp,0);
  assert.equal(next.selectedTargetInstanceId,next.enemies[1].instanceId);const calls=g.run('labRngCalls');g.press('ArrowRight');assert.equal(view(g).selectedTargetInstanceId,next.enemies[1].instanceId);assert.equal(g.run('labRngCalls'),calls);
  assert.notEqual(initial.enemies[0].instanceId,initial.enemies[1].instanceId);
});

test('victory retains the final frame and exits rewardlessly to the scenario menu',()=>{const g=fresh();g.run('stats.atk=100;stats.gold=71;stats.xp=19;');const before=canonical(g);start(g);submitBoth(g);
  tape(g,[0,0,0,...HIT],()=>g.press('Enter'));finishPlayback(g);const final=JSON.stringify(view(g).playbackFrame);g.press('Enter');
  assert.equal(view(g).phase,'victory');assert.equal(JSON.stringify(view(g).playbackFrame),final);g.press('Enter');assert.equal(view(g).phase,'victory');g.press('Escape');
  assert.equal(g.run('partyCombatLab.isActive()'),false);assert.equal(g.run('partyCombatLab.isMenuOpen()'),true);assert.equal(canonical(g),before);assert.equal(g.run('stats.gold'),71);assert.equal(g.run('stats.xp'),19);
});

test('defeat retains the final frame and exits without recovery',()=>{const g=fresh();g.run('stats.hp=1;ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,hp:1000,maxHp:1000,atk:100,def:100};');const before=canonical(g);start(g);submitBoth(g);
  tape(g,[0,0.999,0.999,0.99,0,0.99,0.5,0.99,0],()=>g.press('Enter'));finishPlayback(g);g.press('Enter');submitBoth(g);
  tape(g,[0.999,0.99,0,0.99],()=>g.press('Enter'));finishPlayback(g);g.press('Enter');assert.equal(view(g).phase,'defeat');g.press('Escape');
  assert.equal(g.run('partyCombatLab.isMenuOpen()'),true);assert.equal(canonical(g),before);assert.equal(g.run('stats.hp'),1);
});

test('entry cancel, held movement masking, render routing and re-entry preserve world state',()=>{const g=fresh(),before=canonical(g);start(g,2);
  const first=view(g).party.map(m=>m.instanceId);g.hold('d');g.frames(20);g.release('d');assert.equal(canonical(g),before);
  g.run('var partyDraws=0,worldDraws=0;var realPartyDraw=drawPartyCombatLabBattle;drawPartyCombatLabBattle=()=>{partyDraws++;return realPartyDraw();};drawMapTiles=()=>{worldDraws++;};');
  const tick=g.run('tick');g.renderFrame();assert.equal(g.run('partyDraws'),1);assert.equal(g.run('worldDraws'),0);assert.equal(g.run('tick'),tick);
  g.press('Escape');assert.equal(g.run('partyCombatLab.isMenuOpen()'),true);g.press('Enter');const second=view(g).party.map(m=>m.instanceId);assert.notDeepEqual(second,first);
});

test('unexpected controller failure restores canonical state, reports it, and returns to submenu without retry',()=>{const g=fresh(),before=canonical(g);start(g,1);submitBoth(g);
  g.run(`Math.random=()=>{labRngCalls++;throw Error('injected playable failure');};`);g.press('Enter');assert.equal(g.run('labRngCalls'),1);
  assert.equal(g.run('partyCombatLab.isActive()'),false);assert.equal(g.run('partyCombatLab.isMenuOpen()'),true);assert.match(g.run('partyCombatLab.getMenuView().error'),/injected playable failure/);assert.equal(canonical(g),before);
});

test('renderer cursor and routing are exact, bounded, deterministic and mutation-free',()=>{for(let i=0;i<3;i++){const g=fresh();start(g,i);
  g.run(`var partyPaint=[];ctx.fillRect=(...a)=>partyPaint.push({type:'fillRect',args:a,fill:ctx.fillStyle});ctx.strokeRect=(...a)=>partyPaint.push({type:'strokeRect',args:a});ctx.fillText=(...a)=>partyPaint.push({type:'text',args:a,fill:ctx.fillStyle});ctx.fill=()=>partyPaint.push({type:'fill',fill:ctx.fillStyle});`);
  const before=canonical(g),lab=JSON.stringify(view(g));g.run('drawPartyCombatLabBattle()');const paint=J(g,'partyPaint');assert.equal(canonical(g),before);assert.equal(JSON.stringify(view(g)),lab);
  assert.equal(paint.filter(p=>p.type==='fill'&&p.fill==='#f0e8b8').length,2,'enemy target and choosing-ally arrows');
  const layout=J(g,'partyCombatLabBattleLayout(partyCombatLab.getView())');for(const p of layout.enemies)assert.ok(p.x>=0&&p.spriteY>=0&&p.x+p.width<=512&&p.spriteY+p.spriteHeight<=480);
  assert.ok(layout.allies.every(p=>p.x>=0&&p.x<=512&&p.feetY===277));
  submitBoth(g);g.run('partyPaint=[];drawPartyCombatLabBattle()');assert.equal(J(g,"partyPaint.filter(p=>p.type==='fill'&&p.fill==='#f0e8b8').length"),0);}}
);

test('input owns one listener pair, rejects repeat, and no canonical route or save field is added',()=>{const input=fs.readFileSync(path.join(ROOT,'input.js'),'utf8');
  assert.equal((input.match(/addEventListener\('keydown'/g)||[]).length,1);assert.equal((input.match(/addEventListener\('keyup'/g)||[]).length,1);assert.match(input,/!wasHeld && !e\.repeat/);
  const render=fs.readFileSync(path.join(ROOT,'render.js'),'utf8');assert.equal((render.match(/drawPartyCombatLabBattle\(\)/g)||[]).length,1);
  for(const file of scriptOrderFromIndexHtml()){const source=fs.readFileSync(path.join(ROOT,file),'utf8');if(/content\/|interaction|quest|encounter|maps|npcs/.test(file))assert.doesNotMatch(source,/partyCombatLab|PARTY_COMBAT_LAB_/,file);}
  const g=fresh();assert.equal(g.run('SAVE_VERSION'),4);assert.equal(g.run('saveGame()'),true);assert.doesNotMatch(g.run("localStorage.getItem('verdantVale_save')"),/party|esla_lab|combat_party/);
});

module.exports={name:'playable Party Combat Lab: target authority, input, debug menu and render routing',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}console.log('  '+checks.length+' playable Party Combat Lab checks passed');}};
