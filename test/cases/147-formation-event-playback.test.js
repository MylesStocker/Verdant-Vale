'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const {createContext}=require('../harness');
const ROOT=path.join(__dirname,'../..');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,expression)=>JSON.parse(g.run('JSON.stringify('+expression+')'));
const HIT=[0.5,0.99,0.99];

function fresh(count=2,duplicate=false) {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=function(){throw Error('RNG outside taped resolution');};
    dialogue.open=false;menu.open=false;statusEffects=[];
    stats.hp=100;stats.maxHp=100;stats.atk=8;stats.def=2;stats.spd=7;
    stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;stats.items=[];`);
  const ids=['enemy_marsh_wisp','enemy_briar_hound','enemy_sluice_slime'];
  g.run('initializeFormationState('+JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:ids[duplicate?0:slot],slot})))+');');
  return g;
}
function resolve(g,tape,slot=0,hook={}) {
  const previous=g.run('Math.random');
  const used=g.run(`(function(){var tape=${JSON.stringify(tape)},hooks=${JSON.stringify(hook)},used=[];
    Math.random=function(){var i=used.length;if(i>=tape.length)throw Error('RNG tape exhausted');
      used.push(tape[i]);if(hooks[i])eval(hooks[i]);return tape[i];};return used;})()`);
  try {
    g.run(`var roundResult=resolveFormationBasicAttackRound({type:'attack',targetInstanceId:combat.enemies[${slot}].instanceId});`);
    assert.deepEqual(Array.from(used),tape,'exact resolver RNG, no extra or unused rolls');
  } finally {g.run('Math').random=previous;}
  return g.run('roundResult');
}
function ordinary(count=2,duplicate=false) {
  const g=fresh(count,duplicate);
  resolve(g,[...Array(count).fill(0),...Array.from({length:count+1},()=>HIT).flat()]);
  return g;
}
function create(g) {return g.run('var playback=createFormationRoundPlayback(roundResult);playback;');}
function hp(g) {return J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]');}
function frameHp(frame) {return [frame.player.hp,...Array.from(frame.enemies,e=>e.hp)];}
function state(g) {
  return g.run(`JSON.stringify({mode:combat.mode,active:combat.active,
    combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),
    observation:combat.enemies.map(e=>[e.observeCount,e.escapeUnlocked]),stats:stats,status:statusEffects,
    flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),dialogue:dialogue,day:day,
    sequence:combatEnemyInstanceSequence,save:localStorage.getItem('verdantVale_save')})`);
}
function unchanged(g,work) {
  const before=state(g),members=g.run('combat.enemies');
  const result=work();
  assert.equal(state(g),before);assert.equal(g.run('combat.enemies'),members);
  return result;
}
function reject(g,expression='createFormationRoundPlayback(roundResult)') {
  unchanged(g,()=>assert.throws(()=>g.run(expression),/Invalid formation playback/));
}
function frozenTree(value) {
  if(value && typeof value==='object') {
    assert.ok(Object.isFrozen(value));for(const child of Object.values(value)) frozenTree(child);
  } else assert.notEqual(typeof value,'function');
}
function verifyFrames(g,reel,preHp) {
  const events=g.run('roundResult.events');
  assert.equal(reel.eventCount,events.length);assert.equal(reel.frameCount,events.length+1);
  assert.deepEqual(frameHp(reel.frames[0]),preHp);
  assert.equal(reel.frames[0].currentEvent,null);assert.equal(reel.frames[0].eventIndex,-1);
  for(let i=0;i<reel.frames.length;i++) {
    const frame=reel.frames[i];
    assert.equal(frame.frameIndex,i);assert.equal(frame.eventIndex,i-1);
    assert.equal(frame.complete,i===events.length);
    assert.equal(frame.outcome,i===events.length?g.run('roundResult.outcome'):'ongoing');
    if(!i)continue;
    const event=events[i-1],before=frameHp(reel.frames[i-1]),after=frameHp(frame);
    assert.notEqual(frame.currentEvent,event,'no source event reference');
    assert.deepEqual(JSON.parse(JSON.stringify(frame.currentEvent)),JSON.parse(JSON.stringify(event)));
    if(event.type==='attack') {
      const index=event.targetId==='player'?0:Array.from(frame.enemies).findIndex(e=>e.instanceId===event.targetId)+1;
      assert.equal(before[index],event.hpBefore);assert.equal(after[index],event.hpAfter);
      before[index]=event.hpAfter;assert.deepEqual(after,before,'only the recorded target changes');
    } else assert.deepEqual(after,before,'non-attack events never change HP');
  }
  assert.deepEqual(frameHp(reel.frames.at(-1)),hp(g));
  assert.equal(reel.frames.at(-1).outcome,g.run('roundResult.outcome'));
  frozenTree(reel);
}

for(const count of [2,3]) test(count+' members: exact reconstruction and every intermediate HP frame',()=>{
  const g=fresh(count),before=hp(g);
  resolve(g,[...Array(count).fill(0),...Array.from({length:count+1},()=>HIT).flat()]);
  const reel=unchanged(g,()=>create(g));verifyFrames(g,reel,before);
  for(const frame of reel.frames) {
    Array.from(frame.enemies).slice(1).forEach((enemy,i)=>assert.equal(enemy.hp,before[i+2]));
  }
});

test('duplicate template identities reconstruct only the explicitly attacked instance',()=>{
  const g=fresh(2,true),before=hp(g);resolve(g,[0.99,0,...HIT,...HIT,...HIT],1);
  const reel=create(g);verifyFrames(g,reel,before);
  assert.equal(reel.frames[0].enemies[0].id,reel.frames[0].enemies[1].id);
  assert.notEqual(reel.frames[0].enemies[0].instanceId,reel.frames[0].enemies[1].instanceId);
  for(const frame of reel.frames) assert.equal(frame.enemies[0].hp,14);
});

test('mixed initiative and repeated player HP transitions retain exact event order',()=>{
  const g=fresh(3),before=hp(g);resolve(g,[0.99,0,0.99,...HIT,...HIT,...HIT,...HIT]);
  const reel=create(g);verifyFrames(g,reel,before);
  assert.deepEqual(Array.from(reel.frames).slice(1,-1).map(f=>f.currentEvent.actorId),['combat_enemy_1','combat_enemy_3','player','combat_enemy_2']);
});

for(const actor of ['player','enemy']) for(const evaded of [false,true]) test(actor+' critical '+(evaded?'evaded':'landed')+' uses recorded HP and flags',()=>{
  const g=fresh(),before=hp(g),critical=[0.5,0,evaded?0:0.99];
  resolve(g,[0,0,...(actor==='player'?critical:HIT),...(actor==='enemy'?critical:HIT),...HIT]);
  const reel=create(g);verifyFrames(g,reel,before);
  const event=reel.frames[actor==='player'?1:2].currentEvent;
  assert.equal(event.critical,true);assert.equal(event.evaded,evaded);
  if(evaded) assert.equal(event.hpBefore,event.hpAfter);
});

test('overkill, dead-actor Skip and partial victory never remove members or reveal victory',()=>{
  const g=fresh(),before=hp(g);g.run('stats.atk=20;');resolve(g,[0,0,...HIT,...HIT]);
  const reel=create(g);verifyFrames(g,reel,before);
  assert.equal(reel.frames[1].currentEvent.attemptedDamage,19);
  assert.equal(reel.frames[1].currentEvent.appliedDamage,14);
  assert.equal(reel.frames[2].currentEvent.type,'skip');
  for(const frame of Array.from(reel.frames).slice(1)) {
    assert.equal(frame.enemies[0].hp,0);assert.equal(frame.enemies[0].slot,0);
    assert.equal(frame.enemies.length,2);assert.equal(frame.outcome,'ongoing');
  }
});

test('retained zero-HP members remain represented even when absent from initiative',()=>{
  const g=fresh(3);g.run('combat.enemies[1].hp=0;');const before=hp(g);
  resolve(g,[0,0,...HIT,...HIT,...HIT]);const reel=create(g);verifyFrames(g,reel,before);
  for(const frame of reel.frames) {assert.equal(frame.enemies[1].hp,0);assert.equal(frame.enemies[1].slot,1);}
});

for(const outcome of ['victory','defeat']) test(outcome+' is revealed only at its Outcome event',()=>{
  const g=fresh();
  if(outcome==='victory')g.run('stats.atk=100;combat.enemies[1].hp=0;');else g.run('stats.hp=1;');
  const before=hp(g);resolve(g,outcome==='victory'?[0,...HIT]:[0.99,0.99,...HIT]);
  const reel=create(g);verifyFrames(g,reel,before);
  assert.equal(reel.frames.at(-2).outcome,'ongoing');assert.equal(reel.frames.at(-1).outcome,outcome);
  assert.deepEqual(frameHp(reel.frames.at(-1)),frameHp(reel.frames.at(-2)));
  if(outcome==='victory') assert.ok(reel.frames.at(-1).enemies.every(e=>e.hp===0));
  else assert.equal(reel.frames.at(-1).player.hp,0);
});

test('player defeat after attacking retains the earlier enemy HP transition',()=>{
  const g=fresh();g.run('stats.hp=1;');const before=hp(g);
  resolve(g,[0,0,...HIT,...HIT]);const reel=create(g);verifyFrames(g,reel,before);
  assert.equal(reel.frames[1].enemies[0].hp,7);
  assert.equal(reel.frames[2].player.hp,0);
  assert.equal(reel.frames.at(-1).outcome,'defeat');
});

test('defensive Cancel event preserves projected HP and copied identity/reason',()=>{
  const g=fresh(2,true);
  // Cancel is unreachable in neutral synchronous play. This isolated test-only
  // RNG hook exercises the real resolver's defensive branch. Its unlogged HP
  // change is not a playback event: playback represents only recorded history.
  resolve(g,[0,0.99,...HIT],0,{4:'combat.enemies[0].hp=0;'});
  const reel=create(g);
  assert.equal(reel.frames[2].currentEvent.type,'cancel');
  assert.equal(reel.frames[2].currentEvent.reason,'target_dead');
  assert.equal(reel.frames[2].currentEvent.targetId,'combat_enemy_1');
  assert.deepEqual(frameHp(reel.frames[2]),frameHp(reel.frames[1]));
  assert.deepEqual(frameHp(reel.frames.at(-1)),hp(g));
});

test('random-access frames are idempotent, repeatable and independent of read order',()=>{
  const g=ordinary(),reel=create(g),before=state(g);
  for(const i of [reel.frameCount-1,0,2,1,2,0]) {
    assert.equal(g.run('projectFormationPlaybackFrame(playback,'+i+')'),reel.frames[i]);
  }
  assert.equal(state(g),before);
});

for(const index of ['-1','playback.frameCount','playback.frameCount+1','0.5','NaN','Infinity','"0"','null','undefined']) test('frame boundary rejects '+index,()=>{
  const g=ordinary();create(g);
  unchanged(g,()=>assert.throws(()=>g.run('projectFormationPlaybackFrame(playback,'+index+')'),/frame index out of bounds/));
});

for(const mutation of [
  'stats.hp=1;stats.maxHp=200;combat.enemies[0].hp=1;',
  'roundResult.events[0].hpBefore=999;roundResult.events.reverse();roundResult.events.push({type:"unknown"});',
  'roundResult.initiative.reverse();roundResult.order[0].targetId="changed";roundResult.outcome="defeat";',
  'combat.enemy=null;',
  'endCombat();initializeFormationState([{enemyId:"enemy_marsh_wisp",slot:0},{enemyId:"enemy_marsh_wisp",slot:1}]);',
]) test('historical reel survives source/live mutation: '+mutation,()=>{
  const g=ordinary(),reel=create(g),before=JSON.stringify(reel);
  g.run(mutation);
  for(let i=reel.frames.length-1;i>=0;i--) assert.equal(g.run('projectFormationPlaybackFrame(playback,'+i+')'),reel.frames[i]);
  assert.equal(JSON.stringify(reel),before);
});

test('another resolved round cannot change a previously constructed reel',()=>{
  const g=ordinary(),reel=create(g),before=JSON.stringify(reel);
  resolve(g,[0,0,...HIT,...HIT]);assert.equal(JSON.stringify(reel),before);
});

test('all returned structures are frozen and have no source participant/event references',()=>{
  const g=ordinary(),reel=create(g);frozenTree(reel);
  assert.notEqual(reel.initiative,g.run('roundResult.initiative'));
  assert.notEqual(reel.order[0],g.run('roundResult.order[0]'));
  assert.notEqual(reel.frames[0].player,g.run('stats'));
  assert.notEqual(reel.frames[0].enemies[0],g.run('combat.enemies[0]'));
  assert.throws(()=>{reel.frames[0].player.hp=999;},TypeError);
  assert.throws(()=>{reel.frames[1].currentEvent.appliedDamage=999;},TypeError);
  assert.throws(()=>{reel.frames[0].enemies[0].slot=9;},TypeError);
  assert.equal(Object.hasOwn(g.run('combat.enemies[0]'),'displayHp'),false);
});

test('creation and repeated projection call no RNG/formula/resolver/effect and change no authoritative state or save',()=>{
  const g=ordinary();g.run("resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);saveGame();");
  const forbidden=['resolveFormationBasicAttackRound','rollAttackDamage','speedWinChance','effectiveAtk','effectiveDef',
    'effectiveSpd','effectivePlayerIncomingMitigation','playerEvades','enemyEvades','findCombatEnemy',
    'applyKillRewards','applyEnemyHitEffects','handleCombatAction','advanceCombatMessage','endCombat','grantItem',
    'saveGame','checkLevelUp','finalizeLenswebSpiderEvent','drawCombat'];
  for(const name of forbidden)g.run(name+'=function(){throw Error("Forbidden playback call: '+name+'");};');
  unchanged(g,()=>{
    const reel=create(g);
    for(let repeat=0;repeat<3;repeat++)for(let i=reel.frameCount-1;i>=0;i--)g.run('projectFormationPlaybackFrame(playback,'+i+')');
  });
});

const malformed=[
  'roundResult=null;', 'roundResult=[];', 'roundResult={};', 'roundResult.extra=1;',
  'roundResult.outcome="unknown";', 'roundResult.events=[];',
  'roundResult.events[0].type="unknown";', 'roundResult.events[0].actorId="unknown";',
  'roundResult.events[0].targetId="enemy_marsh_wisp";', 'roundResult.events[0].actorType="ally";',
  'roundResult.events[0].targetId="player";', 'roundResult.events[0].callback=function(){};',
  'roundResult.events[0].hpAfter+=1;', 'roundResult.events[0].appliedDamage+=1;',
  'roundResult.events[0].hpBefore=NaN;', 'roundResult.events[0].hpBefore=Infinity;',
  'roundResult.events[0].hpBefore=999;', 'roundResult.events[0].hpAfter=-1;',
  'roundResult.events[0].hpAfter=0.5;', 'roundResult.events[0].hpAfter=15;',
  'roundResult.events[0].attemptedDamage=0;', 'roundResult.events[0].critical=1;',
  'roundResult.events[0].evaded=true;', 'roundResult.events[0].hpBefore=function(){};',
  'roundResult.events.at(-1).outcome="victory";', 'roundResult.outcome="victory";roundResult.events.at(-1).outcome="victory";',
  'roundResult.events.push(roundResult.events[0]);', 'roundResult.events.pop();',
  'roundResult.events.splice(1,1);', 'roundResult.events.reverse();',
  'roundResult.initiative[0].actorId="enemy_marsh_wisp";', 'roundResult.initiative[0].playerFirst="yes";',
  'roundResult.initiative[0].playerFirst=false;', 'roundResult.initiative.reverse();',
  'roundResult.initiative.push(roundResult.initiative[0]);', 'roundResult.initiative=[];',
  'roundResult.order[0].targetId="unknown";', 'roundResult.order[1].actorId="player";',
  'roundResult.order[0].callback=function(){};', 'roundResult.order=[];',
  'roundResult.events=new Array(4);', 'roundResult.events.extra=true;',
  'roundResult[Symbol("extra")]=1;',
  'Object.defineProperty(roundResult.events[0],"hpBefore",{get(){throw Error("getter ran");}});',
  'Object.defineProperty(roundResult.events,"0",{get(){throw Error("getter ran");}});',
  'Object.defineProperty(roundResult,"events",{get(){throw Error("getter ran");}});',
  'Object.setPrototypeOf(roundResult,{surprise:true});',
];
malformed.forEach((mutation,i)=>test('malformed history '+i+' fails atomically without RNG',()=>{
  const g=ordinary();g.run(mutation);reject(g);
}));

test('broken multi-hit player HP continuity fails even when each individual loss is coherent',()=>{
  const g=ordinary();g.run('roundResult.events[1].hpBefore+=1;roundResult.events[1].hpAfter+=1;');reject(g);
});

for(const type of ['skip','cancel']) test(type+' may not claim HP transitions or omit its reason',()=>{
  const g=fresh();g.run('stats.atk=20;');resolve(g,[0,0,...HIT,...HIT]);
  g.run('roundResult.events[1].type='+JSON.stringify(type)+';roundResult.events[1].hpAfter=0;');reject(g);
});

test('unrecognized skip reason is rejected',()=>{
  const g=fresh();g.run('stats.atk=20;');resolve(g,[0,0,...HIT,...HIT]);
  g.run('roundResult.events[1].reason="unknown";');reject(g);
});

test('an extra living participant cannot be silently added to the recorded formation',()=>{
  const g=ordinary();
  g.run('combat.enemies=Object.freeze([...combat.enemies,createCombatEnemyInstance(ENEMY_TEMPLATE_REGISTRY.enemy_sluice_slime,2)]);');
  reject(g);
});

test('a dead actor cannot claim an otherwise HP-coherent evaded Attack',()=>{
  const g=fresh();g.run('stats.atk=20;');resolve(g,[0,0,...HIT,...HIT]);
  g.run(`roundResult.events[1]={...roundResult.events[2],actorId:'combat_enemy_1',
    hpAfter:100,appliedDamage:0,evaded:true};`);reject(g);
});

test('non-outcome events cannot continue after terminal HP is reached',()=>{
  const g=fresh();g.run('stats.atk=100;combat.enemies[1].hp=0;');resolve(g,[0,...HIT]);
  g.run(`roundResult.events.splice(1,0,{type:'skip',...roundResult.order[1],reason:'actor_dead'});`);reject(g);
});

for(const mutation of ['stats.hp-=1;','combat.enemies[0].hp-=1;','stats.maxHp=0;',
  'combat.enemies[0].hp=-1;','combat.enemies[0].maxHp=0;']) test('invalid/mismatched final snapshot: '+mutation,()=>{
  const g=ordinary();g.run(mutation);reject(g);
});

test('same-template replacement and singleton/empty state cannot stand in for resolved participants',()=>{
  const g=ordinary();g.run('combat.enemy=null;initializeFormationState([{enemyId:"enemy_marsh_wisp",slot:0},{enemyId:"enemy_briar_hound",slot:1}]);');reject(g);
  g.run('combat.enemy=null;');reject(g);
  g.run('startWardenCombat();');reject(g);
});

for(const expression of ['null','{}','[]','Object.freeze({frames:[]})',
  'Object.freeze({eventCount:0,frameCount:1,initiative:[],order:[],get frames(){throw Error("getter ran");}})']) test('malformed projection request rejected: '+expression,()=>{
  const g=ordinary();unchanged(g,()=>assert.throws(()=>g.run('projectFormationPlaybackFrame('+expression+',0)'),/Invalid formation playback/));
});

test('only headless session confirmation/view calls playback; no gameplay reference or combat playback state',()=>{
  const names=['createFormationRoundPlayback','projectFormationPlaybackFrame'];
  const files=execFileSync('git',['ls-files','--','*.js'],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').filter(f=>!f.startsWith('test/'));
  for(const file of files)for(const name of names) {
    const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.equal((source.match(new RegExp('\\b'+name+'\\b','g'))||[]).length,file==='combat.js'?2:0,file);
  }
  const g=ordinary();create(g);
  for(const [method,fn] of Object.entries(g.run('formationSessionController'))) for(const name of names) {
    const owner=name==='createFormationRoundPlayback'?'confirmTarget':'getView';
    assert.equal((fn.toString().match(new RegExp('\\b'+name+'\\b','g'))||[]).length,method===owner?1:0,method+': '+name);
  }
  for(const name of names) assert.doesNotMatch(g.run(name+'.toString()'),/Math\.random|rollAttackDamage|resolveFormationBasicAttackRound\s*\(|combat\.enemy\b|applyKillRewards|handleCombatAction|advanceCombatMessage|endCombat\s*\(|saveGame|ctx\./);
  assert.doesNotMatch(g.run('Object.keys(combat).join(",")'),/playback|displayHp|frames|reel/);
  g.run(`var calls=0;createFormationRoundPlayback=function(){calls++;};projectFormationPlaybackFrame=function(){calls++;};
    drawCombat=function(){calls++;};handleCombatAction=function(){calls++;};render();`);
  g.press('ArrowLeft');assert.equal(g.run('calls'),0);assert.equal(g.run('combat.active'),false);
  assert.throws(()=>g.run('combat.active=true'),/cannot activate/);
});

module.exports={name:'immutable headless formation playback: exact historical HP, continuity, no effects or gameplay callers',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' formation playback checks passed');}};
