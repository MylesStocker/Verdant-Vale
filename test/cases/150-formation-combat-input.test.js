'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const ROOT=path.join(__dirname,'../..');
const INPUT=fs.readFileSync(path.join(ROOT,'input.js'),'utf8');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'formationSessionController.getView()');
const hp=g=>J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]');
const HIT=[0.5,0.99,0.99];
const ROUND=[0,0,...HIT,...HIT,...HIT];

function fresh(count=2,begin=true) {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=()=>{throw Error('RNG outside exact input tape');};
    dialogue.open=false;menu.open=false;statusEffects=[];stats.hp=100;stats.maxHp=100;
    stats.atk=8;stats.def=2;stats.spd=7;stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;stats.items=[];
    resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);`);
  if(count) {
    g.run('initializeFormationState('+JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:'enemy_marsh_wisp',slot})))+');');
    if(begin)g.run('formationSessionController.begin();');
  }
  return g;
}
function state(g) {
  return g.run(`JSON.stringify({stats,statusEffects,player,day,dialogue,menu,choice,shop,debugMenu,warpMenu,
    accordPanel,continentMap,debugInspector,seraLioraCutscene,fishing,
    flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),mode:combat.mode,active:combat.active,
    combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>'value' in d).map(([k,d])=>[k,d.value])),
    observation:combat.enemies.map(e=>[e.observeCount,e.escapeUnlocked]),sequence:combatEnemyInstanceSequence,
    location:regionalWorldPosition(),save:localStorage.getItem('verdantVale_save')})`);
}
function inert(g,work,sessionUnchanged=false) {
  const before=state(g),v=view(g),members=g.run('combat.enemies');const result=work();
  assert.equal(state(g),before);assert.equal(g.run('combat.enemies'),members);
  if(sessionUnchanged)assert.deepEqual(view(g),v);return result;
}
function taped(g,tape,work) {
  g.run('var inputTape='+JSON.stringify(tape)+', inputRng=[];Math.random=()=>{if(inputRng.length===inputTape.length)throw Error("tape exhausted");const v=inputTape[inputRng.length];inputRng.push(v);return v;};');
  try {work();assert.deepEqual(J(g,'inputRng'),tape,'no extra or unused RNG');}
  finally {g.run('Math.random=()=>{throw Error("RNG outside exact input tape");};');}
}
function finish(g) {
  while(view(g).phase==='playback')inert(g,()=>g.press('Enter'));
  assert.equal(view(g).phase,'playback_complete');
}
function beginPlayback(g,tape=ROUND) {
  g.press('Enter');assert.equal(view(g).phase,'targeting');
  taped(g,tape,()=>g.press('Enter'));assert.equal(view(g).phase,'playback');
}
function atPhase(phase) {
  const g=fresh();if(phase==='awaiting_action')return g;
  if(phase==='victory')g.run('combat.enemies[1].hp=0;stats.atk=100;');
  if(phase==='defeat')g.run('stats.hp=1;');
  g.press('Enter');if(phase==='targeting')return g;
  taped(g,phase==='victory'?[0,...HIT]:phase==='defeat'?[0.99,0.99,...HIT]:ROUND,()=>g.press('Enter'));
  if(phase==='playback')return g;
  finish(g);if(phase==='playback_complete')return g;
  g.press('Enter');assert.equal(view(g).phase,phase);return g;
}
// hold()/press() drive the registered production listener. For native event
// flags missing in the harness API, evaluate that SAME listener callback in its
// real VM scope, without registering another listener or copying input logic.
function nativeEvent(g,key,flags={}) {
  const marker="window.addEventListener('keydown', ";
  const start=INPUT.indexOf(marker)+marker.length;
  const end=INPUT.indexOf("\n});\nwindow.addEventListener('keyup'",start)+2;
  const handler=g.run('('+INPUT.slice(start,end)+')');
  let prevented=0;handler({key,...flags,preventDefault(){prevented++;}});return prevented;
}

test('no session: movement, menu, dialogue and debug use the established router',()=>{
  const g=fresh(0);assert.equal(view(g),null);
  assert.equal(g.run('handleFormationInputCommand("confirm")'),false);
  const x=g.run('player.x');g.hold('d');g.frames(1);g.release('d');assert.ok(g.run('player.x')>x);
  for(const key of ['m','Escape']){g.press(key);assert.equal(g.run('menu.open'),true);g.press(key);assert.equal(g.run('menu.open'),false);}
  g.press('`');assert.equal(g.run('debugMenu.open'),true);g.press('`');assert.equal(g.run('debugMenu.open'),false);
  g.run('dialogue.open=true;var ordinaryInteractions=0;handleInteract=()=>{ordinaryInteractions++;};');
  g.hold('Enter');g.hold('Enter');assert.equal(g.run('ordinaryInteractions'),1);
  g.release('Enter');g.press(' ');assert.equal(g.run('ordinaryInteractions'),2);
});

test('singleton action/item/message handling and repeat latch remain the existing paths',()=>{
  const g=fresh(0);g.run('startWardenCombat();combat.flashTimer=0;var ordinaryActions=0;handleCombatAction=()=>{ordinaryActions++;};');
  assert.equal(view(g),null);const before=g.run('combat.cursor');
  g.press('d');assert.equal(g.run('combat.cursor'),before+1);g.press('ArrowLeft');assert.equal(g.run('combat.cursor'),before);
  g.hold('Enter');g.hold('Enter');assert.equal(g.run('ordinaryActions'),1);g.release('Enter');
  g.run('combat.phase="item";');g.press('b');assert.equal(g.run('combat.phase'),'choose');
  g.run('combat.phase="message";');g.press(' ');assert.equal(g.run('ordinaryActions'),2);
  assert.equal(g.run('combat.mode'),'single');
});

test('formation state alone has no input authority until a session exists',()=>{
  const g=fresh(2,false);assert.equal(view(g),null);
  g.press('m');assert.equal(g.run('menu.open'),true);g.press('m');
  assert.equal(g.run('handleFormationInputCommand("confirm")'),false);
  assert.equal(g.run('combat.active'),false);
});

for(const key of ['Enter',' ']) test(key+' starts targeting once without resolution or RNG',()=>{
  const g=fresh();g.run('resolveFormationBasicAttackRound=()=>{throw Error("premature resolution");};');
  inert(g,()=>g.hold(key));assert.equal(view(g).phase,'targeting');
  assert.equal(view(g).selectedTargetInstanceId,view(g).enemies[0].instanceId);
  inert(g,()=>{g.hold(key);g.hold(key);},true);assert.equal(view(g).playbackFrame,null);g.release(key);
});

for(const pair of [['ArrowLeft','ArrowRight'],['a','d']]) test(pair.join('/')+' uses one-step wrapping stable living-instance order',()=>{
  const g=fresh(3);g.run('combat.enemies[1].hp=0;');g.press('Enter');
  const ids=view(g).enemies.map(e=>e.instanceId);
  for(const [key,id] of [[pair[0],ids[2]],[pair[1],ids[0]],[pair[1],ids[2]],[pair[1],ids[0]]]) {
    inert(g,()=>g.hold(key));assert.equal(view(g).selectedTargetInstanceId,id);
    inert(g,()=>g.hold(key),true);g.release(key);
  }
  assert.deepEqual(view(g).enemies.map(e=>e.slot),[0,1,2]);
  assert.equal(new Set(view(g).enemies.map(e=>e.templateId)).size,1);
  g.run('combat.enemies[2].hp=0;');inert(g,()=>g.press(pair[0]));assert.equal(view(g).selectedTargetInstanceId,ids[0]);
});

for(const key of ['Escape','b','B']) test(key+' cancels targeting without spending a turn',()=>{
  const g=fresh();const before=view(g);g.press('Enter');
  inert(g,()=>g.press(key));assert.deepEqual(view(g),before);
});

test('selected duplicate resolves exactly once with exact RNG, immediately retaining playback frame zero',()=>{
  const g=fresh(),before=hp(g);g.press('Enter');g.press('d');const target=view(g).selectedTargetInstanceId;
  g.run(`var resolutionCalls=0,seenTarget=null,originalResolver=resolveFormationBasicAttackRound;
    resolveFormationBasicAttackRound=action=>{resolutionCalls++;seenTarget=action.targetInstanceId;return originalResolver(action);};`);
  taped(g,ROUND,()=>g.hold('Enter'));
  assert.equal(g.run('resolutionCalls'),1);assert.equal(g.run('seenTarget'),target);
  assert.equal(view(g).phase,'playback');assert.equal(view(g).playbackFrame.frameIndex,0);
  assert.deepEqual([view(g).player.hp,...view(g).enemies.map(e=>e.hp)],before);
  assert.notDeepEqual(hp(g),before);assert.equal(g.run('combat.enemies[0].hp'),before[1]);
  inert(g,()=>{g.hold('Enter');g.hold('Enter');},true);assert.equal(g.run('resolutionCalls'),1);g.release('Enter');
});

test('each playback press advances one frame; final frame requires a distinct acknowledgement press',()=>{
  const g=fresh();beginPlayback(g);const finalHP=hp(g);
  while(view(g).phase==='playback') {
    const previous=view(g).playbackFrame.frameIndex;
    inert(g,()=>g.hold('Enter'));assert.equal(view(g).playbackFrame.frameIndex,previous+1);
    inert(g,()=>{g.hold('Enter');g.hold('Enter');},true);assert.deepEqual(hp(g),finalHP);g.release('Enter');
  }
  assert.equal(view(g).phase,'playback_complete');const final=view(g).playbackFrame;
  assert.equal(final.complete,true);assert.equal(view(g).awaitingAcknowledgement,true);
  inert(g,()=>g.hold('Enter'));assert.equal(view(g).phase,'awaiting_action');assert.equal(view(g).playbackFrame,null);
  inert(g,()=>g.hold('Enter'),true);g.release('Enter');
  assert.deepEqual(hp(g),finalHP);assert.equal(final.outcome,'ongoing');
  // The next Attack kills this Wisp; its skipped response spends no attack RNG.
  beginPlayback(g,[0,0,...HIT,...HIT]);assert.equal(view(g).playbackFrame.frameIndex,0);
});

test('killed members stay in slots and are excluded when a subsequent Attack is selected',()=>{
  const g=fresh();g.run('stats.atk=100;');beginPlayback(g,[0,0,...HIT,...HIT]);
  finish(g);g.press('Enter');g.press('Enter');
  assert.equal(view(g).phase,'targeting');assert.equal(view(g).selectedTargetInstanceId,view(g).enemies[1].instanceId);
  assert.equal(view(g).enemies[0].hp,0);assert.equal(view(g).enemies.length,2);
});

for(const phase of ['awaiting_action','targeting','playback','playback_complete','victory','defeat']) {
  test(phase+': unsupported commands cannot affect other screens, combat or held movement',()=>{
    const g=atPhase(phase);
    g.run(`var forbiddenInput=0;handleInteract=handleCombatAction=endCombat=applyKillRewards=saveGame=loadGame=
      toggleMenu=toggleDebugMenu=toggleDebugInspector=handleFishingKey=trySeraLioraGuestRoomDoor=
      function(){forbiddenInput++;throw Error('formation input leaked');};`);
    const inertKeys=['ArrowUp','ArrowDown','w','s','m','M','i','I','`','Tab','F5','r','x','A','D'];
    if(phase!=='targeting')inertKeys.push('ArrowLeft','ArrowRight','a','d','Escape','b','B');
    if(phase==='victory'||phase==='defeat')inertKeys.push('Enter',' ');
    for(const key of inertKeys)inert(g,()=>g.press(key),true);
    assert.equal(g.run('forbiddenInput'),0);assert.equal(g.run('combat.active'),false);
    const pos=J(g,'[player.x,player.y,player.facing]');
    for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s']) {
      g.hold(key);g.frames(2);g.release(key);assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),pos);
    }
  });
}

test('a movement key held before session creation is masked, but remains latched until keyup',()=>{
  const g=fresh(2,false);g.hold('d');assert.equal(g.run('keys.d'),true);
  g.run('formationSessionController.begin();');assert.equal(g.run('keys.d'),false);assert.equal(g.run('pressedKeys.d'),true);
  const before=J(g,'[player.x,player.y,player.facing]');g.frames(2);assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),before);
  g.press('Enter');inert(g,()=>g.hold('d'),true);g.release('d');g.press('d');
  assert.equal(view(g).selectedTargetInstanceId,view(g).enemies[1].instanceId);
});

for(const screen of ['menu.open=true;','dialogue.open=true;','choice.open=true;','shop.open=true;',
  'debugMenu.open=true;','warpMenu.open=true;','accordPanel.open=true;','continentMap.open=true;',
  'fishing.active=true;','seraLioraCutscene.active=true;seraLioraCutscene.phase="free_walk";']) {
  test('session input precedes an otherwise active subsystem: '+screen,()=>{
    const g=fresh();g.run(screen);
    // Controller beginAttack correctly rejects conflicting modal state if its
    // preflight does so; probe unsupported commands, which must always be inert.
    for(const key of ['m','i','`','w','s','Escape'])inert(g,()=>g.press(key),true);
  });
}

test('native repeat events never transition, even if no preceding keydown reached the listener',()=>{
  for(const phase of ['awaiting_action','targeting','playback','playback_complete']) {
    const g=atPhase(phase);inert(g,()=>nativeEvent(g,'Enter',{repeat:true}),true);
    inert(g,()=>g.hold('Enter'),true);g.release('Enter');
  }
});

test('browser shortcuts, focus keys and IME commands stay inert without new default suppression',()=>{
  const g=fresh();
  for(const [key,flags] of [['Tab',{}],['F5',{}],['r',{ctrlKey:true}],['Enter',{metaKey:true}],
    [' ',{altKey:true}],['Enter',{isComposing:true}]]) {
    inert(g,()=>assert.equal(nativeEvent(g,key,flags),0),true);g.release(key);
  }
  assert.equal(nativeEvent(g,'Enter'),1);g.release('Enter');assert.equal(view(g).phase,'targeting');
  for(const key of ['Escape','b','B']) {if(view(g).phase!=='targeting')g.press('Enter');assert.equal(nativeEvent(g,key),1);g.release(key);}
});

test('stale target failure surfaces without fallback, retry, RNG or phase advancement',()=>{
  const g=fresh();g.press('Enter');g.run('combat.enemies[0].hp=0;');const v=view(g),before=state(g);
  assert.throws(()=>g.hold('Enter'),/Unsupported formation basic Attack/);
  assert.equal(state(g),before);assert.deepEqual(view(g),v);
  inert(g,()=>g.hold('Enter'),true); // failed press is latched, not retried
  g.release('Enter');
});

test('normalization preserves existing lower-case direction aliases and explicit cancel bindings',()=>{
  const g=fresh();
  for(const [key,command] of [['ArrowLeft','left'],['a','left'],['ArrowRight','right'],['d','right'],
    ['ArrowUp','up'],['w','up'],['ArrowDown','down'],['s','down'],['Enter','confirm'],[' ','confirm'],
    ['Escape','cancel'],['b','cancel'],['B','cancel'],['A',null],['D',null],['toString',null],['unknown',null]])
    assert.equal(g.run('formationInputCommand('+JSON.stringify(key)+')'),command);
});

test('input delegates only to the controller, creates no sessions or rendering routes, and adds no listener',()=>{
  const adapter=INPUT.slice(INPUT.indexOf('function handleFormationInputCommand'),INPUT.indexOf("window.addEventListener('keydown'"));
  assert.doesNotMatch(adapter,/Math\.random|\.hp\s*=|combat\.|stats\.|selectedTargetInstanceId\s*=|frameIndex|resolveFormation|createFormationRoundPlayback|applyKillRewards|endCombat|saveGame|drawCombat|catch\s*\(/);
  assert.equal((INPUT.match(/addEventListener\('keydown'/g)||[]).length,1);
  assert.equal((INPUT.match(/addEventListener\('keyup'/g)||[]).length,1);
  assert.doesNotMatch(INPUT,/formationSessionController\.(begin|clearAfterCombatCleanup)\(|initializeFormationState|drawFormationCombat|drawCombat\(/);
  for(const file of scriptOrderFromIndexHtml()) {
    const s=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.equal((s.match(/\binitializeFormationState\b/g)||[]).length,['combat.js','formation-lab.js'].includes(file)?1:0,file);
    if(file!=='input.js')assert.doesNotMatch(s,/handleFormationInputCommand|formationInputCommand|pressedKeys/,file);
    if(!['combat.js','input.js','render.js','formation-lab.js'].includes(file))assert.doesNotMatch(s,/formationSessionController/,file);
    if(file==='render.js')assert.match(s,/formationCombatLab\.isActive\(\)/);
  }
  const g=fresh();g.run('var drawCalls=0;drawFormationCombat=()=>{drawCalls++;};');
  g.press('Enter');g.renderFrame();assert.equal(g.run('drawCalls'),0);
  assert.equal(g.run('combat.active'),false);assert.throws(()=>g.run('combat.active=true'),/cannot activate/);
});

test('input-driven completion changes only resolver HP, with no messages, outcomes, flags, rewards or saves',()=>{
  const g=fresh();g.run('saveGame();');const before=JSON.parse(state(g));
  beginPlayback(g);finish(g);g.press('Enter');const after=JSON.parse(state(g));
  after.stats.hp=before.stats.hp;after.combat.enemies.forEach((e,i)=>e.hp=before.combat.enemies[i].hp);
  assert.deepEqual(after,before);assert.equal(view(g).phase,'awaiting_action');
  assert.doesNotMatch(g.run("localStorage.getItem('verdantVale_save')"),/formation|playback|combat_enemy_/);
});

module.exports={name:'gated formation input: normalized commands, exclusive routing and physical-press playback edges',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' formation input checks passed');}};
