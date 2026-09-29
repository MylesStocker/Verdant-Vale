'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const {createContext} = require('../harness');
const checks = [];
const test = (name, run) => checks.push({name,run});
const J = (g, expression) => JSON.parse(g.run('JSON.stringify('+expression+')'));
const HIT = [0.5,0.99,0.99]; // variance, not critical, not evaded
const ROOT = path.join(__dirname,'../..');

function fresh(count=2, duplicate=false) {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=function(){throw new Error('RNG outside exact tape');};
    dialogue.open=false;menu.open=false;statusEffects=[];
    stats.hp=100;stats.maxHp=100;stats.atk=8;stats.def=2;stats.spd=7;
    stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
    stats.items=[];`);
  const ids=['enemy_marsh_wisp','enemy_briar_hound','enemy_sluice_slime'];
  if(count) g.run('initializeFormationState('+JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:ids[duplicate?0:slot],slot})))+');');
  return g;
}
function action(g,slot=0) {return {type:'attack',targetInstanceId:g.run('combat.enemies['+slot+'].instanceId')};}
function call(actionValue) {return 'resolveFormationBasicAttackRound('+JSON.stringify(actionValue)+')';}
function exact(g,values,expression,hook={}) {
  const previous=g.run('Math.random');
  const used=g.run(`(function(){var tape=${JSON.stringify(values)},used=[],hooks=${JSON.stringify(hook)};
    Math.random=function(){var i=used.length;if(i>=tape.length)throw new Error('RNG tape exhausted');
      used.push(tape[i]);if(hooks[i])eval(hooks[i]);return tape[i];};return used;})()`);
  try {
    const result=g.run(expression);
    assert.deepEqual(Array.from(used),values,'RNG tape must be consumed exactly, including no unused values');
    return result;
  } finally {g.run('Math').random=previous;}
}
function round(g,values,slot=0,hook={}) {return JSON.parse(JSON.stringify(exact(g,values,call(action(g,slot)),hook)));}
function snapshot(g) {
  return g.run(`JSON.stringify({mode:combat.mode,active:combat.active,sequence:combatEnemyInstanceSequence,
    combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat))
      .filter(([,d])=>Object.hasOwn(d,'value')).map(([key,d])=>[key,d.value])),
    observation:combat.enemies.map(e=>[e.observeCount,e.escapeUnlocked]),
    stats:stats,statusEffects:statusEffects,dialogue:dialogue,day:day})`);
}
function rejected(g,expression=call(action(g))) {
  const before=snapshot(g),members=g.run('combat.enemies');
  assert.throws(()=>exact(g,[],expression),/Unsupported formation basic Attack state or action/);
  assert.equal(snapshot(g),before);
  assert.equal(g.run('combat.enemies'),members);
}
const actorIds = result => result.order.map(a=>a.actorId);
const attacks = result => result.events.filter(e=>e.type==='attack');

test('valid two-member round mutates only HP and returns detached ordered records',()=>{
  const g=fresh();
  const before=J(g,'[stats.xp,stats.gold,stats.items,combat.messageQueue,combat.pendingVictory,combat.pendingDefeat,combat.pendingEscape,dialogue]');
  const members=g.run('combat.enemies');
  const r=round(g,[0,0,...HIT,...HIT,...HIT]);
  assert.equal(r.outcome,'ongoing');
  assert.deepEqual(actorIds(r),['player','combat_enemy_1','combat_enemy_2']);
  assert.deepEqual(attacks(r).map(e=>[e.actorId,e.targetId,e.hpBefore,e.hpAfter,e.attemptedDamage,e.appliedDamage]),[
    ['player','combat_enemy_1',14,7,7,7],['combat_enemy_1','player',100,97,3,3],['combat_enemy_2','player',97,89,8,8],
  ]);
  assert.equal(g.run('stats.hp'),89);assert.equal(members[0].hp,7);assert.equal(members[1].hp,25);
  assert.equal(g.run('combat.enemies'),members);assert.equal(g.run('combat.mode'),'formation');
  assert.equal(g.run('combat.active'),false);
  assert.deepEqual(J(g,'[stats.xp,stats.gold,stats.items,combat.messageQueue,combat.pendingVictory,combat.pendingDefeat,combat.pendingEscape,dialogue]'),before);
  const historical=JSON.stringify(r);members[0].hp=1;g.run('stats.hp=1;');
  assert.equal(JSON.stringify(r),historical);
});

for(const spec of [
  {name:'all before',initiative:[0.99,0.99,0.99],order:['combat_enemy_1','combat_enemy_2','combat_enemy_3','player']},
  {name:'all after',initiative:[0,0,0],order:['player','combat_enemy_1','combat_enemy_2','combat_enemy_3']},
  {name:'mixed, preserving slot order',initiative:[0.99,0,0.99],order:['combat_enemy_1','combat_enemy_3','player','combat_enemy_2']},
]) test('three-member initiative: '+spec.name,()=>{
  const g=fresh(3);
  const r=round(g,[...spec.initiative,...HIT,...HIT,...HIT,...HIT]);
  assert.deepEqual(actorIds(r),spec.order);
  assert.deepEqual(attacks(r).map(e=>e.actorId),spec.order);
  assert.equal(attacks(r).length,4);
  assert.equal(r.initiative.length,3);
});

test('duplicate templates have independent initiative, HP and target identity',()=>{
  const g=fresh(2,true),r=round(g,[0,0.99,...HIT,...HIT,...HIT],1);
  assert.deepEqual(actorIds(r),['combat_enemy_2','player','combat_enemy_1']);
  assert.deepEqual(r.initiative,[{actorId:'combat_enemy_1',playerFirst:true},{actorId:'combat_enemy_2',playerFirst:false}]);
  assert.equal(g.run('combat.enemies[0].hp'),14);assert.equal(g.run('combat.enemies[1].hp'),7);
});

test('all eleven approved basic templates resolve without unsupported behavior or extra RNG',()=>{
  const approved=J(fresh(0),'FORMATION_STATE_TEMPLATE_IDS');
  assert.equal(approved.length,11);
  for(const id of approved) {
    const g=fresh(0);
    g.run('initializeFormationState('+JSON.stringify([{enemyId:id,slot:0},{enemyId:id,slot:1}])+');');
    const r=round(g,[0,0,...HIT,...HIT,...HIT]);
    assert.equal(r.outcome,'ongoing');assert.equal(attacks(r).length,3);
  }
});

test('dead-at-start members retain slots but receive no initiative or attack RNG',()=>{
  const g=fresh(3);g.run('combat.enemies[1].hp=0;');
  const r=round(g,[0,0,...HIT,...HIT,...HIT]);
  assert.deepEqual(r.initiative.map(e=>e.actorId),['combat_enemy_1','combat_enemy_3']);
  assert.deepEqual(actorIds(r),['player','combat_enemy_1','combat_enemy_3']);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.slot)'),[0,1,2]);
});

for(const speeds of [[7,7],[0,0],[1000,1],[1,1000]]) test('initiative uses production probability and strict threshold: '+speeds,()=>{
  for(const atThreshold of [false,true]) {
    const g=fresh();g.run(`stats.spd=${speeds[0]};combat.enemies[0].spd=${speeds[1]};combat.enemies[1].hp=0;stats.atk=1;`);
    const chance=g.run('speedWinChance(effectiveSpd(),combat.enemies[0].spd)');
    const r=round(g,[chance-(atThreshold?0:0.000001),...HIT,...HIT]);
    assert.equal(r.initiative[0].playerFirst,!atThreshold);
    assert.equal(r.order[0].actorType,atThreshold?'enemy':'player');
  }
});

for(const attackTape of [[0,0.99,0.99],[0.999,0.99,0.99],[0.5,0,0.99],[0.5,0,0],[0.5,0.99,0]]) {
  for(const actorType of ['player','enemy']) test(actorType+' rolls use unchanged production primitives: '+attackTape,()=>{
    const g=fresh();g.run('stats.atk=3;');
    const oracle=exact(g,attackTape,actorType==='player'
      ? '(function(){var r=rollAttackDamage(effectiveAtk(),combat.enemies[0].def);return {...r,evaded:enemyEvades(combat.enemies[0])};})()'
      : '(function(){var e=combat.enemies[0],r=rollAttackDamage(e.atk,effectivePlayerIncomingMitigation(e.atk));return {...r,evaded:playerEvades(e)};})()');
    const r=round(g,[0,0,...(actorType==='player'?attackTape:HIT),...(actorType==='enemy'?attackTape:HIT),...HIT]);
    const e=attacks(r).find(e=>e.actorType===actorType);
    assert.equal(e.attemptedDamage,oracle.dmg);assert.equal(e.critical,oracle.crit);assert.equal(e.evaded,oracle.evaded);
    assert.equal(e.appliedDamage,oracle.evaded?0:Math.min(e.hpBefore,oracle.dmg));
  });
}

test('minimum player damage, no alternate formula',()=>{
  const g=fresh();g.run('stats.atk=1;combat.enemies[0].def=999;');
  const r=round(g,[0,0,...HIT,...HIT,...HIT]);
  assert.equal(attacks(r)[0].attemptedDamage,1);
  assert.equal(g.run('combat.enemies[0].hp'),13);
});

for(const cat of [false,true]) test('live per-attacker mitigation '+(cat?'with Cat Armor bypass':'with normal defence cap'),()=>{
  const g=fresh();g.run('stats.def=50;stats.atk=1;'+(cat?'stats.armor={...ITEM_REGISTRY["Cat Armor"]};':''));
  const mitigation=J(g,'combat.enemies.map(e=>effectivePlayerIncomingMitigation(e.atk))');
  assert.deepEqual(mitigation,cat?[149,149]:[4,8]);
  const r=round(g,[0.99,0.99,...HIT,...HIT,...HIT]);
  assert.deepEqual(attacks(r).filter(e=>e.actorType==='enemy').map(e=>e.attemptedDamage),cat?[1,1]:[1,2]);
});

test('ordinary equipment and live ATK/DEF/SPD flow through the actual helpers',()=>{
  const g=fresh();g.run(`stats.weapon={...ITEM_REGISTRY['Bronze Knife']};stats.armor={...ITEM_REGISTRY['Leather Armor']};
    stats.shield={...ITEM_REGISTRY['Iron Shield']};stats.accessory={...ITEM_REGISTRY['Swift Bangle']};
    combat.enemies[0].atk=20;combat.enemies[0].def=4;`);
  const expected=exact(g,HIT,'(function(){var r=rollAttackDamage(effectiveAtk(),combat.enemies[0].def);enemyEvades(combat.enemies[0]);return r.dmg;})()');
  const r=round(g,[0,0,...HIT,...HIT,...HIT]);assert.equal(attacks(r)[0].attemptedDamage,expected);
});

test('killed queued enemy skips its attack, keeps initiative and slot, no extra RNG',()=>{
  const g=fresh();g.run('stats.atk=20;');const members=g.run('combat.enemies');
  const r=round(g,[0,0,...HIT,...HIT]);
  assert.equal(r.outcome,'ongoing');assert.equal(r.initiative.length,2);
  assert.deepEqual(r.events.map(e=>e.type),['attack','skip','attack','outcome']);
  assert.deepEqual(r.events[1],{type:'skip',actorType:'enemy',actorId:'combat_enemy_1',targetId:'player',reason:'actor_dead'});
  assert.equal(attacks(r)[0].appliedDamage,14);assert.equal(attacks(r)[0].attemptedDamage,19);
  assert.equal(members[0].hp,0);assert.equal(g.run('combat.enemies'),members);
});

for(const playerFirst of [false,true]) test('player defeat '+(playerFirst?'after':'before')+' acting cancels every later actor',()=>{
  const g=fresh(3);g.run('stats.hp=1;');const before=J(g,'[stats.gold,stats.xp,day,combat.pendingDefeat,dialogue]');
  const r=round(g,playerFirst?[0,0,0,...HIT,...HIT]:[0.99,0.99,0.99,...HIT]);
  assert.equal(r.outcome,'defeat');assert.equal(g.run('stats.hp'),0);
  assert.equal(attacks(r).length,playerFirst?2:1);
  assert.equal(attacks(r).filter(e=>e.actorType==='player').length,playerFirst?1:0);
  assert.deepEqual(r.events.at(-1),{type:'outcome',outcome:'defeat'});
  assert.deepEqual(J(g,'[stats.gold,stats.xp,day,combat.pendingDefeat,dialogue]'),before);
  rejected(g);
});

test('last living enemy dies: victory without rewards, removal, pending outcome or later attack',()=>{
  const g=fresh(3);g.run('combat.enemies[0].hp=0;combat.enemies[2].hp=0;stats.atk=100;');
  const r=round(g,[0,...HIT],1);
  assert.equal(r.outcome,'victory');assert.equal(attacks(r).length,1);
  assert.equal(g.run('combat.enemies.length'),3);
  assert.deepEqual(J(g,'combat.enemies.map(e=>[e.hp,e.slot])'),[[0,0],[0,1],[0,2]]);
  assert.equal(g.run('combat.pendingVictory'),false);
  rejected(g,call(action(g,1)));
});

for(const removed of [false,true]) test('defensive committed-target cancellation: '+(removed?'replaced by same template':'dead'),()=>{
  const g=fresh(2,true);
  // Impossible in neutral synchronous play: mutate only in the test RNG hook
  // during the before-player enemy attack to probe identity/cancellation guards.
  const hook=removed
    ? 'combat.enemies=Object.freeze([createCombatEnemyInstance(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,0),combat.enemies[1]]);'
    : 'combat.enemies[0].hp=0;';
  const r=round(g,[0,0.99,...HIT],0,{4:hook});
  assert.equal(r.outcome,'ongoing');assert.equal(attacks(r).length,1);
  assert.deepEqual(r.events[1],{type:'cancel',actorType:'player',actorId:'player',targetId:'combat_enemy_1',reason:removed?'target_removed':'target_dead'});
  assert.equal(r.events[2].type,'skip');
  if(removed) {
    assert.equal(g.run('combat.enemies[0].instanceId'),'combat_enemy_3');
    assert.equal(g.run('combat.enemies[0].hp'),14);
  }
});

test('ongoing repeated rounds are deterministic and cleanup retains authority',()=>{
  const runs=[];
  for(let i=0;i<2;i++) {
    const g=fresh();const first=round(g,[0,0,...HIT,...HIT,...HIT]);
    g.run(`var completedReel=createFormationRoundPlayback(${JSON.stringify(first)});
      acknowledgeFormationRound(completedReel,completedReel.frameCount-1);`);
    const second=round(g,[0,0,...HIT,...HIT]);
    assert.equal(second.outcome,'ongoing');runs.push([first,second]);
    g.run('endCombat();');assert.equal(g.run('combat.mode'),null);assert.equal(g.run('combat.enemies.length'),0);
  }
  assert.deepEqual(runs[0],runs[1]);
});

// Numeric boundary oracles execute the real production roll, not a test damage
// formula. The greatest representable Math.random() result is strictly below 1.
const MAX_RANDOM = 1 - Number.EPSILON / 2;
function criticalBoundary(g,mitigation=()=>0) {
  let low=0,high=Number.MAX_SAFE_INTEGER;
  while(low<high) {
    const mid=low+Math.ceil((high-low)/2);
    const damage=exact(g,[MAX_RANDOM,0],`rollAttackDamage(${mid},${mitigation(mid)}).dmg`);
    if(Number.isSafeInteger(damage))low=mid;else high=mid-1;
  }
  return low;
}
function numericRejected(g) {
  const before=snapshot(g),members=g.run('combat.enemies'),refs=Array.from(members);
  const flags=J(g,'QUEST_FLAG_BINDINGS.map(b=>b.get())');
  const storage=g.run("localStorage.getItem('verdantVale_save')");
  const previous=g.run('Math.random');
  g.run('var numericRngCalls=0;Math.random=function(){numericRngCalls++;return 0.99;};');
  try {assert.throws(()=>g.run(call(action(g))),/Unsupported formation basic Attack state or action/);}
  finally {g.run('Math').random=previous;}
  assert.equal(g.run('numericRngCalls'),0,'numeric rejection precedes the very first RNG call');
  assert.equal(snapshot(g),before,'HP, stats, queue, outcomes, observations and sequence are unchanged');
  assert.equal(g.run('combat.enemies'),members);
  refs.forEach((member,slot)=>{assert.equal(members[slot],member);assert.equal(member.slot,slot);});
  assert.deepEqual(J(g,'QUEST_FLAG_BINDINGS.map(b=>b.get())'),flags);
  assert.equal(g.run("localStorage.getItem('verdantVale_save')"),storage);
}
function acceptedPlayback(g,tape,slot=0) {
  const result=exact(g,tape,'var numericResult='+call(action(g,slot))+';numericResult;');
  for(const event of result.events.filter(e=>e.type==='attack')) {
    for(const field of ['attemptedDamage','appliedDamage','hpBefore','hpAfter']) {
      assert.ok(Number.isSafeInteger(event[field]),field+' must be playback-safe');
    }
  }
  const before=snapshot(g);
  const reel=g.run('createFormationRoundPlayback(numericResult)');
  assert.equal(snapshot(g),before,'authentic playback creation does not alter resolved state');
  assert.equal(reel.frames.at(-1).player.hp,g.run('stats.hp'));
  assert.deepEqual(Array.from(reel.frames.at(-1).enemies,e=>e.hp),J(g,'combat.enemies.map(e=>e.hp)'));
  assert.equal(reel.frames.at(-1).outcome,result.outcome);
  return result;
}

test('reported MAX_SAFE_INTEGER player ATK reproduction rejects before RNG, effects or any mutation',()=>{
  const g=fresh();g.run(`stats.atk=Number.MAX_SAFE_INTEGER;var unexpectedEffects=0;
    applyKillRewards=endCombat=advanceCombatMessage=finalizeLenswebSpiderEvent=function(){unexpectedEffects++;throw Error('unexpected gameplay effect');};`);
  numericRejected(g);assert.equal(g.run('unexpectedEffects'),0);
});

test('a rejected numeric call leaves the exact next valid round RNG tape untouched',()=>{
  const g=fresh(),control=fresh(),tape=[0.99,0,...HIT,0.9,0,0.99,...HIT];
  g.run('stats.atk=Number.MAX_SAFE_INTEGER;');
  const result=exact(g,tape,`try {${call(action(g))};throw Error('unsafe round accepted');}
    catch(error){if(!error.message.includes('Unsupported formation basic Attack'))throw error;}
    stats.atk=8;var numericResult=${call(action(g))};numericResult;`);
  const expected=acceptedPlayback(control,tape);
  assert.deepEqual(JSON.parse(JSON.stringify(result)),JSON.parse(JSON.stringify(expected)));
  assert.deepEqual(J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]'),J(control,'[stats.hp,...combat.enemies.map(e=>e.hp)]'));
  g.run('createFormationRoundPlayback(numericResult);');
});

for(const slot of [0,1,2]) test('every living enemy attack is preflighted, including non-target slot '+slot,()=>{
  const g=fresh(3);g.run(`combat.enemies[${slot}].atk=Number.MAX_SAFE_INTEGER;stats.atk=20;`);
  numericRejected(g); // selected slot 0 might otherwise die before its attack
});

test('dead members do not need attack numeric eligibility, but remain in playback',()=>{
  const g=fresh(3);g.run('combat.enemies[2].hp=0;combat.enemies[2].atk=Number.MAX_SAFE_INTEGER;');
  acceptedPlayback(g,[0,0,...HIT,...HIT,...HIT]);
});

test('only the selected enemy DEF enters player-attack numeric preflight',()=>{
  const g=fresh();g.run('combat.enemies[1].def=Number.MAX_SAFE_INTEGER;');
  acceptedPlayback(g,[0,0,...HIT,...HIT,...HIT]);
});

test('critical boundary follows the reachable variance maximum and original rounding order',()=>{
  const g=fresh(),boundary=criticalBoundary(g);
  const maximum=g.run(`ATTACK_VARIANCE_MIN+${MAX_RANDOM}*ATTACK_VARIANCE_SPAN`);
  assert.ok(maximum<g.run('ATTACK_VARIANCE_MIN+ATTACK_VARIANCE_SPAN'),
    'blindly adding 0.8+0.4 is a different floating-point value, not a reachable roll');
  assert.equal(g.run(`formationAttackNumbersAreSafe(${boundary},0)`),true);
  assert.equal(g.run(`formationAttackNumbersAreSafe(${boundary+1},0)`),false);
  assert.ok(Number.isSafeInteger(exact(g,[MAX_RANDOM,0],`rollAttackDamage(${boundary},0).dmg`)));
  assert.ok(!Number.isSafeInteger(exact(g,[MAX_RANDOM,0],`rollAttackDamage(${boundary+1},0).dmg`)));
  g.run(`stats.atk=${boundary};combat.enemies[0].def=0;`);
  const result=acceptedPlayback(g,[0,0,MAX_RANDOM,0,0.99,...HIT]);
  assert.equal(result.events[0].critical,true);assert.equal(result.events[0].hpAfter,0);
  const outside=fresh();outside.run(`stats.atk=${boundary+1};combat.enemies[0].def=0;`);numericRejected(outside);
});

test('ordinary weapon bonus participates in numeric preflight at the exact effective-ATK boundary',()=>{
  const g=fresh(),boundary=criticalBoundary(g);
  g.run(`stats.weapon={...ITEM_REGISTRY['Bronze Knife']};stats.atk=${boundary}-stats.weapon.bonus;combat.enemies[0].def=0;`);
  assert.equal(g.run('effectiveAtk()'),boundary);
  acceptedPlayback(g,[0,0,MAX_RANDOM,0,0.99,...HIT]);
  const outside=fresh();outside.run(`stats.weapon={...ITEM_REGISTRY['Bronze Knife']};stats.atk=${boundary}+1-stats.weapon.bonus;combat.enemies[0].def=0;`);
  numericRejected(outside);
});

for(const cat of [false,true]) test('enemy critical numeric boundary uses live equipment mitigation '+(cat?'with Cat Armor':'with ordinary armor/shield'),()=>{
  const g=fresh();
  const setup=`stats.def=50;stats.armor={...ITEM_REGISTRY[${JSON.stringify(cat?'Cat Armor':'Leather Armor')}]};
    stats.shield={...ITEM_REGISTRY['Iron Shield']};combat.enemies[1].hp=0;`;
  g.run(setup);
  const boundary=criticalBoundary(g,atk=>g.run(`effectivePlayerIncomingMitigation(${atk})`));
  g.run(`combat.enemies[0].atk=${boundary};`);
  const result=acceptedPlayback(g,[0.99,MAX_RANDOM,0,0.99]);
  assert.equal(result.outcome,'defeat');assert.equal(result.events[0].actorType,'enemy');
  assert.equal(result.events[0].critical,true);
  const outside=fresh();outside.run(setup+`combat.enemies[0].atk=${boundary+1};`);numericRejected(outside);
});

test('pre-defence variance overflow cannot be concealed by high mitigation',()=>{
  const g=fresh();g.run('stats.atk=Number.MAX_SAFE_INTEGER;combat.enemies[0].def=Number.MAX_SAFE_INTEGER;');
  const hidden=exact(g,[MAX_RANDOM,0],'rollAttackDamage(effectiveAtk(),combat.enemies[0].def).dmg');
  assert.ok(Number.isSafeInteger(hidden),'final damage alone would miss the unsafe intermediate');
  numericRejected(g);
});

test('minimum-one floor cannot conceal an out-of-domain negative critical intermediate',()=>{
  const g=fresh();g.run('stats.atk=1;combat.enemies[0].def=Number.MAX_SAFE_INTEGER;');
  assert.equal(exact(g,[0,0],'rollAttackDamage(effectiveAtk(),combat.enemies[0].def).dmg'),1);
  numericRejected(g);
});

test('normal defence cap and Cat Armor preserve their different high-DEF numeric paths',()=>{
  const g=fresh();g.run('stats.def=Number.MAX_SAFE_INTEGER;');
  // Ordinary mitigation still caps each live enemy separately; large total DEF
  // alone is not rejected and does not make the attack intermediate unsafe.
  const result=acceptedPlayback(g,[0,0,...HIT,...HIT,...HIT]);
  assert.deepEqual(Array.from(result.events).filter(e=>e.actorType==='enemy').map(e=>e.attemptedDamage),[1,2]);
  const cat=fresh();cat.run(`stats.armor={...ITEM_REGISTRY['Cat Armor']};stats.def=Number.MAX_SAFE_INTEGER-stats.armor.bonus;`);
  assert.equal(cat.run('effectiveDef()'),Number.MAX_SAFE_INTEGER);
  assert.equal(cat.run('effectivePlayerIncomingMitigation(combat.enemies[0].atk)'),Number.MAX_SAFE_INTEGER);
  numericRejected(cat); // unchanged bypass exposes the unsafe negative raw critical
});

test('accepted boundary HP, minimum damage and repeated loss remain exactly representable in playback',()=>{
  const g=fresh();g.run(`stats.hp=stats.maxHp=Number.MAX_SAFE_INTEGER;
    combat.enemies[0].hp=combat.enemies[0].maxHp=Number.MAX_SAFE_INTEGER;stats.atk=1;`);
  acceptedPlayback(g,[0.99,0.99,...HIT,...HIT,...HIT]);
});

test('accepted critical-boundary rounds create playback across both endpoints, critical branches, evasion and initiative',()=>{
  const boundary=criticalBoundary(fresh());
  for(const variance of [0,0.5,MAX_RANDOM]) for(const critical of [0,0.99]) for(const evade of [0,0.99]) for(const before of [false,true]) {
    const g=fresh();g.run(`stats.atk=${boundary};combat.enemies[0].def=0;`);
    const tape=before?[0.99,0.99,...HIT,...HIT,variance,critical,evade]
      :[0,0,variance,critical,evade,...(evade===0?HIT:[]),...HIT];
    acceptedPlayback(g,tape);
  }
});

test('all eight normal templates still create authentic playback at variance/critical endpoints',()=>{
  const approved=J(fresh(0),'FORMATION_STATE_TEMPLATE_IDS');assert.equal(approved.length,11);
  for(const id of approved) for(const variance of [0,MAX_RANDOM]) for(const critical of [0,0.99]) {
    const g=fresh(0);
    g.run('initializeFormationState('+JSON.stringify([0,1,2].map(slot=>({enemyId:id,slot})))+');stats.atk=1;');
    const hit=[variance,critical,0.99];
    acceptedPlayback(g,[0,0.99,0,...hit,...hit,...hit,...hit]);
  }
});

test('formation numeric guard has only resolver and Receiver pre-entry callers; no singleton gate',()=>{
  const files=require('../harness').scriptOrderFromIndexHtml();
  const name='formationAttackNumbersAreSafe';
  for(const file of files) {
    const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.equal((source.match(new RegExp('\\b'+name+'\\b','g'))||[]).length,file==='combat.js'?3:file==='gallery-receiver.js'?2:0,file);
  }
  const g=fresh();
  assert.equal((g.run('validateFormationRoundCommand.toString()').match(/formationAttackNumbersAreSafe\(/g)||[]).length,2);
  assert.match(g.run('resolveFormationBasicAttackRound.toString()'),/return resolveFormationRound\(action\)/);
  for(const fn of ['rollAttackDamage','handleCombatAction','createFormationRoundPlayback','projectFormationPlaybackFrame']) {
    assert.doesNotMatch(g.run(fn+'.toString()'),/formationAttackNumbersAreSafe/);
  }
  assert.doesNotMatch(g.run(name+'.toString()'),/Math\.random|combat\.|stats\.|rollAttackDamage|applyKillRewards|endCombat|saveGame/);
  // Shared arithmetic has no guard: legacy callers keep even extreme results.
  assert.ok(!Number.isSafeInteger(exact(g,[MAX_RANDOM,0],'rollAttackDamage(Number.MAX_SAFE_INTEGER,0).dmg')));
});

const badActions=[null,[],{},'attack',{type:'run',targetInstanceId:'combat_enemy_1'},
  {targetInstanceId:'combat_enemy_1'},{type:'attack'},
  ...[null,0,'enemy_marsh_wisp','unknown'].map(targetInstanceId=>({type:'attack',targetInstanceId})),
  ...['slot','damage','enemyId','callback','unknown'].map(key=>({type:'attack',targetInstanceId:'combat_enemy_1',[key]:1}))];
badActions.forEach((a,i)=>test('invalid action '+i+' fails before RNG/state/identity changes',()=>rejected(fresh(),call(a))));

for(const setup of [
  'combat.enemies[0].hp=0;',
  'combat.enemies[0].hp=-1;', 'combat.enemies[0].hp=NaN;', 'combat.enemies[0].hp=Infinity;',
  'combat.enemies[0].hp=0.5;', 'combat.enemies[0].hp=15;', 'combat.enemies[0].maxHp=0;',
  'combat.enemies[0].atk=NaN;', 'combat.enemies[0].spd="9";',
  'stats.hp=0;', 'stats.hp=-1;', 'stats.hp=101;', 'stats.atk=NaN;',
  'combat.enemies=Object.freeze([combat.enemies[0]]);',
  'combat.enemies=Object.freeze([...combat.enemies,...combat.enemies]);',
  'combat.enemies=Object.freeze([combat.enemies[0],combat.enemies[0]]);',
  'combat.enemies=Object.freeze([combat.enemies[1],combat.enemies[0]]);',
  'combat.enemies=[...combat.enemies];',
  'combat.enemies[0].observeCount=1;', 'combat.enemies[0].escapeUnlocked=true;',
  'combat.enemies[0].id="enemy_polwick";', 'combat.enemies[0].futureSpecial=false;',
  'ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp.futureSpecial=false;',
  'combat.enemies[0].thornsReflect=1;', 'combat.enemies[0].regenPerTurn=1;',
  'stats.accessory={...ITEM_REGISTRY.EvadeAll};',
  'stats.weapon={name:"x",type:"weapon",bonus:1,counterChance:0.1};',
  'stats.weapon={name:"x",type:"weapon",bonus:NaN};',
  'combat.futureMechanic=true;',
]) test('unsupported state rejected atomically: '+setup,()=>{
  const g=fresh();g.run(setup);rejected(g,call({type:'attack',targetInstanceId:'combat_enemy_1'}));
});

test('distinct objects cannot reuse an instance ID, and mutable identity metadata is rejected',()=>{
  for(const duplicate of [true,false]) {
    const g=fresh();
    g.run(`var copy={...combat.enemies[1]};Object.defineProperties(copy,{
      instanceId:{value:${duplicate?'combat.enemies[0].instanceId':'combat.enemies[1].instanceId'},writable:${!duplicate},configurable:false},
      slot:{value:1,writable:false,configurable:false},observeCount:{value:0,writable:true},escapeUnlocked:{value:false,writable:true}});
      combat.enemies=Object.freeze([combat.enemies[0],copy]);`);
    rejected(g);
  }
});

test('every known unsupported capability fails closed on runtime members and registered templates',()=>{
  const fields=J(fresh(),'FORMATION_STATE_UNSUPPORTED_FIELDS');
  for(const field of fields) for(const owner of ['combat.enemies[0]','ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp']) {
    const g=fresh();g.run(owner+'['+JSON.stringify(field)+']=false;');rejected(g);
  }
});

for(const status of ['poison','burn','slither','muddied','cursed','dazzled','futureStatus']) test('status rejected: '+status,()=>{
  const g=fresh();g.run('statusEffects=['+JSON.stringify(status)+'];');rejected(g);
});

for(const [key,value] of Object.entries({
  phase:'message',message:'pending',pendingVictory:true,pendingDefeat:true,pendingEscape:true,
  messageQueue:['pending'],flashTimer:1,fireCastTimer:1,polwickHasCast:true,
  isBoss:true,isWarden:true,isFortGuard:true,isFortPolwick:true,isFortEssa:true,isMulholland:true,
  isPaleSentry:true,isRainfish:true,rainfishRemaining:1,isMireToadSpawn:true,mireToadRemaining:1,
  isDenWraith:true,isSailorBrawl:true,isTakomo:true,is23:true,isLenswebSpider:true,
  pendingLighthouseObjective:'pending',evadeTurns:1,corrosion:1,isSeepSplit:true,seepSplitRemaining:1,
  gullStole:'armed',gullStolenAmount:1,bombFuse:1,bombDamage:1,bombIgnoresDef:true,
  bombTargetInstanceId:'combat_enemy_1',bombJustArmed:true,
})) test('singleton/temporary field rejected: '+key,()=>{
  const g=fresh();g.run('combat['+JSON.stringify(key)+']='+JSON.stringify(value)+';');rejected(g);
});

test('empty and active singleton state reject without altering legacy combat',()=>{
  const g=fresh(0);const expression=call({type:'attack',targetInstanceId:'combat_enemy_1'});
  rejected(g,expression);g.run('startWardenCombat();');rejected(g,expression);
});

test('data accessor and unknown-key action injection fails without executing getters',()=>{
  const g=fresh();
  rejected(g,'resolveFormationBasicAttackRound({get type(){throw Error("getter ran");},targetInstanceId:"combat_enemy_1"})');
  rejected(g,'resolveFormationBasicAttackRound({type:"attack",targetInstanceId:"combat_enemy_1",[Symbol("x")]:1})');
});

test('malformed frozen membership cannot execute an indexed getter during validation',()=>{
  const g=fresh();
  g.run(`var getterCalls=0,malformed=[...combat.enemies];
    Object.defineProperty(malformed,'0',{get(){getterCalls++;throw Error('getter ran');}});
    combat.enemies=Object.freeze(malformed);`);
  const before=J(g,'[stats.hp,combatEnemyInstanceSequence,combat.mode]'),members=g.run('combat.enemies');
  assert.throws(()=>exact(g,[],call({type:'attack',targetInstanceId:'combat_enemy_1'})),/Unsupported formation basic Attack/);
  assert.equal(g.run('getterCalls'),0);
  assert.deepEqual(J(g,'[stats.hp,combatEnemyInstanceSequence,combat.mode]'),before);
  assert.equal(g.run('combat.enemies'),members);
});

test('schema contains only neutral value records; execution order and HP chain are exact',()=>{
  const g=fresh(3),r=round(g,[0.99,0,0.99,...HIT,...HIT,...HIT,...HIT]);
  assert.deepEqual(Object.keys(r),['initiative','order','events','outcome']);
  for(const event of attacks(r)) {
    assert.deepEqual(Object.keys(event),['type','actorType','actorId','targetId','attemptedDamage','appliedDamage','critical','evaded','hpBefore','hpAfter']);
    assert.equal(event.hpBefore-event.hpAfter,event.appliedDamage);
    assert.match(event.actorId,event.actorType==='player'?/^player$/:/^combat_enemy_\d+$/);
  }
  assert.doesNotMatch(JSON.stringify(r),/Marsh|Hound|message|dialogue|sprite|position|reward|quest|animation/);
  const playerHits=attacks(r).filter(e=>e.targetId==='player');
  playerHits.slice(1).forEach((e,i)=>assert.equal(e.hpBefore,playerHits[i].hpAfter));
});

test('no rewards, dialogue, quests or save payload changes; only HP changes',()=>{
  const g=fresh();g.run("resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);");
  const flags=J(g,'QUEST_FLAG_BINDINGS.map(b=>b.get())');
  const other=J(g,'[stats.xp,stats.gold,stats.items,day,combat.messageQueue,combat.message,dialogue]');
  assert.equal(g.run('saveGame()'),true);
  const before=JSON.parse(g.run("localStorage.getItem('verdantVale_save')"));
  round(g,[0,0,...HIT,...HIT,...HIT]);
  assert.deepEqual(JSON.parse(g.run("localStorage.getItem('verdantVale_save')")),before,'resolver never writes a save');
  assert.deepEqual(J(g,'QUEST_FLAG_BINDINGS.map(b=>b.get())'),flags);
  assert.deepEqual(J(g,'[stats.xp,stats.gold,stats.items,day,combat.messageQueue,combat.message,dialogue]'),other);
  assert.equal(g.run('saveGame()'),true);
  const after=JSON.parse(g.run("localStorage.getItem('verdantVale_save')"));
  // HP is real player state and uses the existing save binding, not a new schema.
  assert.equal(before.version,after.version);
  assert.deepEqual(Object.keys(before),Object.keys(after));
  assert.doesNotMatch(JSON.stringify(after),/instanceId|combat_enemy_|formation|targetInstanceId|initiative/);
  assert.equal(after.stats.hp,g.run('stats.hp'));
  after.stats.hp=before.stats.hp;
  assert.deepEqual(after,before,'direct diagnostic save differs only by actual player HP');
});

test('compatibility resolver has no gameplay caller; session commands share the generalized authority',()=>{
  const name='resolveFormationBasicAttackRound';
  const files=execFileSync('git',['ls-files','--','*.js'],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').filter(f=>!f.startsWith('test/'));
  for(const file of files) {
    const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.equal((source.match(new RegExp('\\b'+name+'\\b','g'))||[]).length,file==='combat.js'?1:0,file);
  }
  const g=fresh(),source=g.run(name+'.toString()');
  for(const [method,fn] of Object.entries(g.run('formationSessionController'))) {
    assert.doesNotMatch(fn.toString(),/\bresolveFormationBasicAttackRound\b/,method);
  }
  assert.doesNotMatch(source,/combat\.enemy\b|handleCombatAction|advanceCombatMessage|applyKillRewards|endCombat|grantItem|finalizeLenswebSpiderEvent|ctx\.|drawCombat|saveGame/);
  round(g,[0,0,...HIT,...HIT,...HIT]);
  g.run(`var draws=0,inputs=0;drawCombat=function(){draws++;};
    handleCombatAction=function(){inputs++;};render();`);
  g.press('ArrowLeft');assert.equal(g.run('draws+inputs'),0);
  assert.equal(g.run('combat.active'),false);
  assert.throws(()=>g.run('combat.active=true'),/cannot activate/);
  for(const key of ['enemy','observeCount','escapeUnlocked']) assert.throws(()=>g.run('combat.'+key),/no singleton/);
});

module.exports={name:'headless formation Attack rounds: strict validation, exact RNG, stable identity and no gameplay integration',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' headless formation resolver checks passed');}};
