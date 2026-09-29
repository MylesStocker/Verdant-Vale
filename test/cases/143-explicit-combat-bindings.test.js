'use strict';

// Production handlers and finite RNG tapes, not a second combat implementation.
// Retained callbacks / replacement fixtures below deliberately exercise states
// normal input cannot create. Each check owns a fresh VM; no files are written.
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createCombatTrace } = require('../combat-trace');

const checks = [];
const test = (name, run) => checks.push({ name, run });
const PLAYER_FIRST = [0.2,0.5,0.9,0.5,0.9,0.9,0.9];
const ENEMY_FIRST = [0.9,0.5,0.9,0.5,0.9,0.9,0.9];
const LETHAL = [0.2,0.5,0.9,0.5,0.9,0.9,0.3,0.99];

function fresh(setup = '') {
  const t = createCombatTrace();
  t.step('fixture', [], `
    dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMode=false;
    stats.hp=100;stats.maxHp=100;stats.atk=20;stats.def=3;stats.spd=10;
    stats.level=MAX_LEVEL;stats.xp=0;stats.gold=0;stats.items=[];
    stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
    statusEffects=[];
    combat.active=true;combat.phase='choose';combat.cursor=0;combat.flashTimer=0;
    combat.enemy={id:'enemy_marsh_wisp_early',name:'Dummy',hp:100,maxHp:100,
      atk:10,def:2,spd:5,xp:25,goldMin:5,goldMax:5};
    ${setup}
    var actor=combat.enemy,saved,rewardMessages;
  `);
  return t;
}

// Temporarily forbid implicit reads, restoring the descriptor BEFORE the trace
// projection reads it. Action entries get exactly one automatic singleton read;
// low-level helpers and retained callbacks get none. No production stubs/formulas.
function explicitStep(t, label, tape, body, entry = false) {
  return t.step(label, tape, `(function(){
    var descriptor=Object.getOwnPropertyDescriptor(combat,'enemy'), reads=0;
    Object.defineProperty(combat,'enemy',{...descriptor,get:function(){
      if (++reads > ${entry ? 1 : 0}) throw new Error('Implicit enemy read: '+${JSON.stringify(label)});
      return descriptor.get.call(combat);
    }});
    try { ${body}
      if (reads !== ${entry ? 1 : 0}) throw new Error('Wrong singleton entry count');
    } finally { Object.defineProperty(combat,'enemy',descriptor); }
  })();`);
}

function material(t) {
  // Includes internal identity/bomb metadata as well as player, queue, pending
  // outcomes, and singleton encounter flags. Callback function objects are not
  // serialized, so their original references are checked separately below.
  return t.g.run('JSON.stringify({combat:combat,stats:stats,statuses:statusEffects,slitherSpd:slitherSpd})');
}

function replaceSameTemplate(t) {
  t.step('replace with another instance of the SAME template', [], `
    var removedEnemy=actor;
    combat.enemy=Object.fromEntries(Object.entries(actor).filter(function(p){
      return !['instanceId','slot'].includes(p[0]);
    }));
    combat.enemy.hp=40;combat.enemy.maxHp=100; // wounded: a misdirected regen must be observable
    stats.hp=99;stats.gold=77;
    combat.pendingVictory=false;combat.pendingDefeat=false;combat.pendingEscape=false;
    combat.message='Replacement battle';combat.messageQueue=['Replacement queue'];
    combat.bombFuse=2;combat.bombDamage=11;combat.bombJustArmed=true;
    combat.bombTargetInstanceId=combat.enemy.instanceId;
  `);
  assert.equal(t.g.run('removedEnemy.id === combat.enemy.id'), true);
  assert.equal(t.g.run('removedEnemy.instanceId === combat.enemy.instanceId'), false);
}

test('resolver requires active membership and exact instance identity, with zero RNG', () => {
  const t = fresh();
  explicitStep(t, 'resolve / reject', [], `
    if(findCombatEnemy(actor.instanceId)!==actor || !isActiveCombatEnemy(actor)) throw new Error('missing member');
    for(var id of [null,undefined,actor.id,actor.name,actor.slot,'unknown']) {
      if(findCombatEnemy(id)!==null) throw new Error('identity fallback');
    }
    if(isActiveCombatEnemy({...actor})) throw new Error('copied object accepted');
    actor.hp=0;
    if(findCombatEnemy(actor.instanceId)!==actor) throw new Error('death is not removal');
    combat.active=false;
    if(findCombatEnemy(actor.instanceId)!==null) throw new Error('inactive member');
    combat.active=true;
    var members=combat.enemies;
    try {
      combat.enemies=Object.freeze([actor,actor]); // impossible test-only corruption
      if(findCombatEnemy(actor.instanceId)!==null) throw new Error('multiple members accepted');
    } finally { combat.enemies=members; }
  `);
  assert.equal(t.rng.length, 0);
});

test('player/enemy evasion and names use the explicit stats, not the singleton', () => {
  const t = fresh();
  explicitStep(t, 'passed speeds / names', [0.15,0.15,0.15,0.15], `
    var slow={spd:0,name:'Slow probe'},fast={spd:100,name:'Fast probe'};
    if(!playerEvades(slow) || playerEvades(fast)) throw new Error('wrong attacker speed');
    if(enemyEvades(slow) || !enemyEvades(fast)) throw new Error('wrong defender speed');
    if(evadeText(false,fast)!=='The Fast probe evades!') throw new Error('wrong name');
  `);
});

test('Attack forwards the same enemy through evasion helpers without extra RNG', () => {
  const t = fresh();
  t.g.run(`var calls=[];var oldPlayerEvades=playerEvades,oldEnemyEvades=enemyEvades;
    playerEvades=function(e){if(e!==actor)throw new Error('wrong actor');calls.push('player');return oldPlayerEvades(e);};
    enemyEvades=function(e){if(e!==actor)throw new Error('wrong target');calls.push('enemy');return oldEnemyEvades(e);};`);
  try { explicitStep(t, 'Attack capture', PLAYER_FIRST, 'handleCombatAction();', true); }
  finally { t.g.run('playerEvades=oldPlayerEvades;enemyEvades=oldEnemyEvades;'); }
  assert.deepEqual(JSON.parse(t.g.run('JSON.stringify(calls)')), ['enemy','player']);
  assert.equal(t.g.run('actor.hp'), 82);
});

test('enemy response uses passed ATK/name and defers on-hit effects to that actor', () => {
  const t = fresh('combat.enemy.atk=13;combat.enemy.poisonChance=1;');
  explicitStep(t, 'construct response', [0.5,0.9,0.9],
    "saved=enemyTurnResponse(actor,function(d){return actor.name+' hit '+d;});");
  assert.equal(t.g.run('saved.text'), 'Dummy hit 10');
  explicitStep(t, 'land response', [0], 'saved.apply();');
  assert.equal(t.g.run('stats.hp'), 90);
  assert.equal(t.g.run("hasStatusEffect('poison')"), true);
});

// All eleven deferred sites are exercised live, after same-template replacement,
// and after cleanup. Capturing the immediately applied enemy-first entry requires
// a transparent test-only observer around the production binding factory.
const effects = [
  {name:'player-first enemy response',setup:'',tape:PLAYER_FIRST,
    build:'handleCombatAction();var saved=combat.messageQueue[0];', hp:93,enemyHp:82},
  {name:'enemy-first enemy strike',setup:'',tape:ENEMY_FIRST,
    build:`var collected=[],oldBind=bindCombatEnemyEffect;
      bindCombatEnemyEffect=function(id,fn){var cb=oldBind(id,fn);collected.push(cb);return cb;};
      try{handleCombatAction();}finally{bindCombatEnemyEffect=oldBind;}
      var saved={apply:collected[0]};`, hp:93,enemyHp:100},
  {name:'enemy-first player reply',setup:'',tape:ENEMY_FIRST,
    build:'handleCombatAction();var saved=combat.messageQueue[0];', hp:93,enemyHp:82},
  {name:'reflection',setup:'combat.enemy.thornsReflect=0.5;',tape:PLAYER_FIRST,
    build:'handleCombatAction();var saved=combat.messageQueue[1];', hp:91,enemyHp:82},
  {name:'counter',setup:'combat.enemy.counterChance=1;',tape:[...PLAYER_FIRST,0,0.5,0.9,0.9],
    build:'handleCombatAction();var saved=combat.messageQueue[1];', hp:93,enemyHp:82},
  {name:'Observe response',setup:'combat.cursor=2;',tape:[0.9,0.5,0.9,0.9],
    build:"handleCombatAction();var saved=combat.messageQueue.find(function(e){return typeof e==='object';});",hp:93,enemyHp:100},
  {name:'item response',setup:"stats.items=[createItem('Potion')];combat.phase='item';",tape:[0.5,0.9,0.9],
    build:'handleCombatAction();var saved=combat.messageQueue[0];',hp:93,enemyHp:100},
  {name:'regeneration',setup:'combat.enemy.hp=60;combat.enemy.regenPerTurn=7;',tape:[],
    build:'var saved=enemyRegenEntry(actor);',hp:100,enemyHp:67},
  {name:'Burn tick',setup:"statusEffects=['burn'];",tape:[0.5],
    build:'var saved=burnTickEntry(actor);',hp:90,enemyHp:100},
  {name:'bomb countdown',setup:'combat.bombFuse=2;combat.bombTargetInstanceId=combat.enemy.instanceId;',tape:[],
    build:'var saved=bombFuseEntry();',hp:100,enemyHp:100,fuse:1},
  {name:'bomb detonation and rewards',setup:'combat.enemy.hp=20;combat.bombFuse=1;combat.bombDamage=80;combat.bombIgnoresDef=true;combat.bombTargetInstanceId=combat.enemy.instanceId;',tape:[],
    build:'var saved=bombFuseEntry();',applyTape:[0.3,0.99],hp:100,enemyHp:0,fuse:0},
];

for (const spec of effects) {
  test(spec.name+': live callback resolves its captured instance', () => {
    const t = fresh(spec.setup);
    t.step('build '+spec.name, spec.tape, spec.build);
    assert.equal(t.g.run('typeof saved.apply'), 'function');
    const id = t.g.run('actor.instanceId');
    explicitStep(t, 'apply '+spec.name, spec.applyTape || [], 'saved.apply();');
    assert.equal(t.g.run('stats.hp'), spec.hp);
    assert.equal(t.g.run('actor.hp'), spec.enemyHp);
    assert.equal(t.g.run('combat.enemies[0].instanceId'), id);
    if (spec.fuse !== undefined) assert.equal(t.g.run('combat.bombFuse'), spec.fuse);
    if (spec.applyTape) {
      assert.deepEqual([t.g.run('stats.xp'),t.g.run('stats.gold'),t.g.run('combat.pendingVictory')], [25,5,true]);
      assert.equal(t.g.run('combat.bombTargetInstanceId'), null);
    }
  });
  for (const ended of [false,true]) test(spec.name+(ended?': stale after cleanup':': stale after same-template replacement'), () => {
    const t = fresh(spec.setup);
    t.step('build retained effect', spec.tape, spec.build);
    const callback = t.g.run('saved.apply'), oldHp = t.g.run('actor.hp');
    if (ended) t.step('cleanup', [], 'endCombat();');
    else replaceSameTemplate(t);
    const before = material(t), queue = t.g.run('combat.messageQueue');
    explicitStep(t, 'invoke stale callback with NO RNG', [], 'saved.apply();');
    assert.equal(material(t), before, 'no player, enemy, reward, message, status or bomb mutation');
    assert.equal(t.g.run('combat.messageQueue'), queue);
    assert.equal(t.g.run('saved.apply'), callback);
    assert.equal(t.g.run('actor.hp'), oldHp, 'removed object itself is not mutated either');
  });
}

for (const spec of [
  {name:'Fen Witch poison',setup:"combat.enemy.id='enemy_fen_witch';",tape:[0],status:'poison'},
  {name:'generic poison',setup:'combat.enemy.poisonChance=1;',tape:[0],status:'poison'},
  {name:'Den Wraith curse',setup:"combat.enemy.id='enemy_den_wraith';combat.enemy.curseChance=1;",tape:[0],status:'cursed'},
  {name:'dazzle',setup:'combat.enemy.dazzleChance=1;',tape:[0],status:'dazzled'},
  {name:'corrosion',setup:'combat.enemy.acidChance=1;',tape:[0],field:'combat.corrosion',value:1},
  {name:'Gull theft',setup:'combat.enemy.stealAndFlee=true;stats.gold=100;',tape:[0.5],field:'combat.gullStolenAmount',value:35},
  {name:'Polwick fire special',setup:'startFortPolwickCombat();',tape:[0.5],status:'burn',field:'stats.hp',value:94},
]) test(spec.name+': explicit on-hit actor and stale-source rejection', () => {
  const t = fresh(spec.setup);
  explicitStep(t, 'apply on-hit', spec.tape, 'applyEnemyHitEffects(actor);');
  if (spec.status) assert.equal(t.g.run('hasStatusEffect('+JSON.stringify(spec.status)+')'), true);
  if (spec.field) assert.equal(t.g.run(spec.field), spec.value);
  replaceSameTemplate(t);
  t.step('clear status for stale probe', [], "statusEffects=[];combat.polwickHasCast=false;combat.gullStole=false;combat.corrosion=0;");
  const before = material(t);
  explicitStep(t, 'reject removed on-hit source', [], 'applyEnemyHitEffects(actor);');
  assert.equal(material(t), before);
});

test('brace special still uses the captured defender and suppresses its ordinary action', () => {
  const t = fresh('combat.enemy.defendChance=1;');
  explicitStep(t, 'brace', [0.2,0,0.5,0.9,0.5,0.9], 'handleCombatAction();', true);
  assert.equal(t.g.run('actor.hp'), 91);
  assert.equal(t.g.run('stats.hp'), 100);
  assert.equal(t.g.run('combat.message'), 'Dummy braces! Lély deals only 9 damage.');
});

test('Observe passes its observed object and keeps the existing singleton unlock', () => {
  const t = fresh("combat.enemy.runLock='observe_gated';combat.cursor=2;");
  t.g.run(`var oldObservation=getObservationText,observed=null;
    getObservationText=function(e,n){observed=e;return oldObservation(e,n);};`);
  try { explicitStep(t, 'Observe capture', [0.1], 'handleCombatAction();', true); }
  finally { t.g.run('getObservationText=oldObservation;'); }
  assert.equal(t.g.run('observed===actor'), true);
  assert.equal(t.g.run('combat.observeCount'), 1);
  assert.equal(t.g.run('combat.escapeUnlocked'), true);
});

test('immediate throwable uses its explicit target DEF, not melee armor', () => {
  const t = fresh(`combat.enemy.def=10;combat.enemy.meleeArmor=90;
    stats.items=[{name:'Test throwable',type:'throwable',damage:30}];combat.phase='item';`);
  explicitStep(t, 'throw', [0.5,0.9,0.9], 'handleCombatAction();', true);
  assert.equal(t.g.run('actor.hp'), 80);
  assert.equal(t.g.run('stats.items.length'), 0);
  assert.match(t.g.run('combat.message'), /Dummy for 20 damage/);
});

for (const sex of ['female','male',null]) test('sex reagent inspects explicit target: '+sex, () => {
  const t = fresh(`combat.enemy.sex=${JSON.stringify(sex)};stats.items=[createItem('Henbane Sprig')];combat.phase='item';`);
  explicitStep(t, 'reagent', sex==='female'?[0.3,0.99]:[0.5,0.9,0.9], 'handleCombatAction();', true);
  assert.equal(t.g.run('actor.hp'), sex==='female'?0:100);
  assert.equal(t.g.run('stats.items.length'), 0);
  assert.equal(t.g.run('combat.pendingVictory'), sex==='female');
});

test('rewards use the explicit source, including guaranteed drop and stolen gold', () => {
  const t = fresh("combat.enemy.guaranteedDrop='Potion';combat.enemy.stealAndFlee=true;combat.gullStolenAmount=13;");
  explicitStep(t, 'explicit rewards before HP subtraction (compatibility)', [0.3], 'rewardMessages=[];applyKillRewards(actor,rewardMessages);');
  assert.deepEqual([t.g.run('stats.xp'),t.g.run('stats.gold'),t.g.run('actor.hp')], [25,18,100]);
  assert.equal(t.g.run('stats.items[0].name'), 'Potion');
  assert.equal(t.g.run('rewardMessages[0]'), 'Dummy was defeated!');
  assert.equal(t.g.run('combat.gullStolenAmount'), 0);
  replaceSameTemplate(t);
  const before = material(t), messages = t.g.run('JSON.stringify(rewardMessages)');
  explicitStep(t, 'stale rewards are inert', [], 'applyKillRewards(actor,rewardMessages);');
  assert.equal(material(t), before);
  assert.equal(t.g.run('JSON.stringify(rewardMessages)'), messages);
});

test('ordinary kill rewards remain once-only through message and victory finalization', () => {
  const t = fresh('combat.enemy.hp=1;');
  explicitStep(t, 'lethal Attack', LETHAL, 'handleCombatAction();', true);
  const reward = [t.g.run('stats.xp'),t.g.run('stats.gold'),t.g.run('stats.items.length')];
  t.drainMessages();t.press('victory');t.press('later exploration input', [], 'ArrowLeft');
  assert.deepEqual([t.g.run('stats.xp'),t.g.run('stats.gold'),t.g.run('stats.items.length')], reward);
  assert.equal(t.g.run('combat.active'), false);
});

test('Bomb arming, three-turn fuse, target detonation and cleanup retain one bomb', () => {
  const t = fresh("stats.items=[createItem('Bomb')];combat.phase='item';");
  explicitStep(t, 'arm Bomb', [0.5,0.9,0.9], 'handleCombatAction();', true);
  assert.equal(t.g.run('combat.bombTargetInstanceId'), t.g.run('actor.instanceId'));
  assert.equal(t.g.run('combat.bombFuse'), 3);
  assert.equal(t.g.run('combat.bombJustArmed'), false);
  assert.equal(t.g.run('stats.items.length'), 0);
  t.drainMessages();
  for (const remaining of [2,1,0]) {
    t.step('choose Observe', [], 'combat.cursor=2;');
    explicitStep(t, 'spend fuse turn', [0.1], 'handleCombatAction();', true);
    t.drainMessages();
    assert.equal(t.g.run('combat.bombFuse'), remaining);
    assert.equal(t.g.run('actor.hp'), remaining?100:20);
    assert.equal(t.g.run('combat.bombTargetInstanceId'), remaining?t.g.run('actor.instanceId'):null);
  }
  t.step('rearm fixture', [], "stats.items=[createItem('Bomb'),createItem('Bomb')];combat.phase='item';combat.itemCursor=0;");
  for (let i=0;i<2;i++) {
    explicitStep(t, 'replace the one armed Bomb', [0.5,0.9,0.9], "combat.phase='item';handleCombatAction();", true);
    t.drainMessages();
    assert.equal(t.g.run('combat.bombFuse'), 3);
    assert.equal(t.g.run('combat.bombTargetInstanceId'), t.g.run('actor.instanceId'));
  }
  t.step('clear armed Bomb with battle', [], 'endCombat();');
  assert.equal(t.g.run('combat.bombTargetInstanceId'), null);
  assert.equal(t.g.run('combat.bombFuse'), 0);
});

test('stored stale Bomb target never falls back to the new sole enemy', () => {
  const t = fresh("stats.items=[createItem('Bomb')];combat.phase='item';");
  t.press('arm', [0.5,0.9,0.9]);
  t.g.run('var originalBombTarget=combat.bombTargetInstanceId;');
  replaceSameTemplate(t);
  t.step('retain removed Bomb target', [], 'combat.bombTargetInstanceId=originalBombTarget;');
  const before = material(t);
  explicitStep(t, 'no retarget at fuse construction', [], "if(bombFuseEntry()!==null)throw new Error('retargeted bomb');");
  assert.equal(material(t), before);
});

test('removed actor cannot construct a new response, regen, or Burn entry', () => {
  const t = fresh("combat.enemy.regenPerTurn=7;combat.enemy.hp=60;statusEffects=['burn'];");
  replaceSameTemplate(t);
  const before = material(t);
  explicitStep(t, 'reject stale factories before RNG', [], `
    if(enemyTurnResponse(actor,function(){throw new Error('stale message');})!==null ||
       enemyRegenEntry(actor)!==null || burnTickEntry(actor)!==null) throw new Error('stale factory');
  `);
  assert.equal(material(t), before);
});

test('Guard to Polwick to Essa: actual sequential handoffs invalidate retained actions', () => {
  const t = fresh('fort_quest_started=true;fort_quest_stage=1;startFortGuardCombat();combat.flashTimer=0;');
  t.g.run('var previousCallbacks=[];');
  const ids = [];
  for (const expected of ['enemy_smuggler_guard','enemy_polwick']) {
    assert.equal(t.g.run('combat.enemy.id'), expected);
    ids.push(t.g.run('combat.enemy.instanceId'));
    t.step('retain current response', [0.5,0.9,0.9], "actor=combat.enemy;previousCallbacks.push(enemyTurnResponse(actor,function(d){return actor.name+' '+d;}).apply);");
    t.step('lethal fixture', [], 'combat.enemy.hp=1;combat.cursor=0;combat.flashTimer=0;');
    t.press('kill', LETHAL);t.drainMessages();t.press('finalize');
    assert.equal(t.g.run('combat.enemies.length'), 0);
    t.press('next singleton');
    assert.equal(t.g.run('combat.enemies.length'), 1);
    const before = material(t);
    explicitStep(t, 'all preceding callbacks are stale', [], 'previousCallbacks.forEach(function(cb){cb();});');
    assert.equal(material(t), before);
  }
  assert.equal(t.g.run('combat.enemy.id'), 'enemy_essa');
  ids.push(t.g.run('combat.enemy.instanceId'));
  assert.equal(new Set(ids).size, 3);
});

for (const spec of [
  {name:'successful Run',setup:'combat.cursor=3;',tape:[0]},
  {name:'failed Run',setup:'combat.cursor=3;',tape:[0.99,0.5,0.9,0.9]},
  {name:'blocked Run',setup:"combat.cursor=3;combat.enemy.runLock='observe_gated';",tape:[0.5,0.9,0.9]},
  {name:'open Item',setup:'combat.cursor=1;',tape:[]},
  {name:'cancel Item',setup:"combat.phase='item';",tape:[]},
  {name:'heal',setup:"stats.hp=50;stats.items=[createItem('Potion')];combat.phase='item';",tape:[0.5,0.9,0.9]},
  {name:'cure',setup:"statusEffects=['poison'];stats.items=[createItem('Reed Remedy')];combat.phase='item';",tape:[0.5,0.9,0.9]},
  {name:'Bullet Time',setup:"stats.items=[createItem('Bullet Time')];combat.phase='item';",tape:[0.5,0.9,0.5]},
  {name:'equipment',setup:"stats.items=[createItem('Iron Sword')];combat.phase='item';",tape:[0.5,0.9,0.9]},
]) test(spec.name+': only the action entry reads the singleton', () => {
  const t = fresh(spec.setup);
  explicitStep(t, spec.name, spec.tape, 'handleCombatAction();', true);
  assert.equal(t.g.run('combat.enemies.length'), 1);
  assert.equal(t.g.run('combat.enemies[0]===actor'), true);
});

test('formation state is gated; no target state or unsanctioned collection writer is introduced', () => {
  const t = fresh();
  assert.equal(t.g.run('combat.mode'), 'single');
  for (const key of ['currentActorId','currentTargetId','selectedTargetId','intent','actionQueue']) {
    assert.equal(t.g.run('Object.hasOwn(combat,'+JSON.stringify(key)+')'), false, key);
  }
  const source = fs.readFileSync(path.join(__dirname,'../../combat.js'),'utf8');
  const authority = source.slice(source.indexOf('function setSingleCombatEnemy('),source.indexOf('function findCombatEnemy('));
  const rest = source.replace(authority,'');
  assert.doesNotMatch(rest, /combat\.enemies\s*=|combat\.enemies\.(?:push|splice|unshift)\s*\(/);
  // Only the authorized developer lab may call the inactive constructor.
  // Preserve every actor/target and stale-effect assertion around this block.
  assert.equal((source.match(/\binitializeFormationState\b/g)||[]).length, 1);
  for (const file of fs.readdirSync(path.join(__dirname,'../..')).filter(f=>f.endsWith('.js') && f!=='combat.js')) {
    const text = fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
    assert.equal((text.match(/\binitializeFormationState\b/g)||[]).length, ['formation-lab.js','gallery-receiver.js'].includes(file) ? 1 : 0, file);
  }
  t.g.run(`endCombat(); initializeFormationState([
    {enemyId:'enemy_marsh_wisp',slot:0},{enemyId:'enemy_marsh_wisp',slot:1}]);`);
  assert.equal(t.g.run('combat.active'), false);
  assert.throws(()=>t.g.run('combat.active=true'), /Formation state cannot activate/);
  assert.throws(()=>t.g.run('handleCombatAction()'), /Formation state cannot process/);
  assert.throws(()=>t.g.run('advanceCombatMessage()'), /Formation state cannot process/);
  for (const key of ['enemy','observeCount','escapeUnlocked']) {
    assert.throws(()=>t.g.run('combat.'+key), /Formation state has no singleton/);
  }
  for (const name of ['applyEnemyHitEffects','burnTickEntry','enemyRegenEntry','bombFuseEntry',
    'playerEvades','enemyEvades','evadeText','enemyTurnResponse','applyKillRewards']) {
    assert.doesNotMatch(t.g.run(name+'.toString()'), /combat\.enemy\b/, name);
  }
  // Every deferred producer is exercised above; pin the remaining implicit-read
  // boundary in the action handler as well, without removing any gameplay checks.
  assert.equal((t.g.run('handleCombatAction.toString()').match(/combat\.enemy\b/g)||[]).length, 1);
});

module.exports = {
  name: 'explicit combat bindings: actor/target context, stale effects, bombs and singleton handoffs',
  checks,
  run() {
    for (const check of checks) {
      try { check.run(); }
      catch (error) { error.message=check.name+': '+error.message;throw error; }
    }
    console.log('  '+checks.length+' explicit-binding checks passed');
  },
};
