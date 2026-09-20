'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createCombatTrace } = require('../combat-trace');
const checks = [];
const test = (name, run) => checks.push({ name, run });
const PF = [0.2,0.5,0.9,0.5,0.9,0.9,0.9];
const EF = [0.9,0.5,0.9,0.5,0.9,0.9,0.9];
const KILL = [0.2,0.5,0.9,0.5,0.9,0.9,0.3,0.99];
const RING_ROUTE = `fort_quest_stage=6;smugglers_dead=true;fort_report_filed=false;smugglers_execution_day=0;
  reservoir_quest_started=true;MainQuest=4;lighthouse_quest_stage=1;lighthouse_spider_resolved=false;`;
const GEM_ROUTE = RING_ROUTE.replace('smugglers_dead=true','smugglers_dead=false').replace('lighthouse_quest_stage=1','lighthouse_quest_stage=3');
const J = (t, expr) => JSON.parse(t.g.run('JSON.stringify('+expr+')'));

function fresh(setup = '') {
  const t = createCombatTrace();
  t.step('setup', [], `dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMode=false;
    stats.hp=1000;stats.maxHp=1000;stats.atk=20;stats.def=3;stats.spd=10;
    stats.level=MAX_LEVEL;stats.xp=0;stats.gold=0;stats.items=[];
    stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;statusEffects=[];
    resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);${setup}`);
  return t;
}

function dummy(setup = '') {
  return fresh(`combat.active=true;combat.phase='choose';combat.flashTimer=0;
    combat.enemy={id:'enemy_marsh_wisp_early',name:'Dummy',hp:100,maxHp:100,atk:10,def:2,spd:5,xp:25,goldMin:5,goldMax:5};${setup}`);
}

function owned(t, expected = [0,false]) {
  const e = t.g.run('combat.enemy');
  assert.equal(t.g.run('combat.enemies.length'), 1);
  assert.equal(e, t.g.run('combat.enemies[0]'));
  assert.deepEqual([e.observeCount,e.escapeUnlocked], expected);
  for (const key of ['observeCount','escapeUnlocked']) {
    const d = Object.getOwnPropertyDescriptor(e,key);
    assert.equal(Object.hasOwn(d,'value'), true, key+' is instance-owned stored state');
    assert.equal(d.writable, true, key+' is mutable');
    assert.equal(d.enumerable, false, key+' does not change legacy template-shaped copies');
  }
  return e;
}

function choose(t, action, tape = []) {
  t.step('choose '+action, [], `combat.cursor=combatOptions().indexOf('${action}');combat.flashTimer=0;`);
  return t.press(action, tape);
}

function observe(t, tape = [0.1]) {
  const first = choose(t,'observe',tape);
  t.drainMessages();
  return first;
}

// Traps are isolated to this VM and restored before the trace projection runs.
// Input must reach the explicit enemy fields, not either compatibility property.
function withoutLegacy(t, label, tape, action) {
  return t.step(label,tape,g=>{
    const descriptors = g.run("['observeCount','escapeUnlocked'].map(k=>[k,Object.getOwnPropertyDescriptor(combat,k)])");
    const combat = g.run('combat');
    for (const [key,d] of descriptors) Object.defineProperty(combat,key,{...d,
      get(){throw new Error('Implicit legacy read: '+key);},set(){throw new Error('Implicit legacy write: '+key);}});
    try { action(g); } finally {
      for (const [key,d] of descriptors) Object.defineProperty(combat,key,d);
    }
  });
}

test('empty projections store nothing; normalization creates mutable private fields without RNG', () => {
  const t = fresh();
  assert.deepEqual([t.g.run('combat.observeCount'),t.g.run('combat.escapeUnlocked')],[0,false]);
  for (const key of ['observeCount','escapeUnlocked']) {
    const d=t.g.run('Object.getOwnPropertyDescriptor(combat,'+JSON.stringify(key)+')');
    assert.equal(Object.hasOwn(d,'value'), false);
    assert.equal(typeof d.get, 'function');assert.equal(typeof d.set, 'function');
  }
  t.step('empty writes cannot create future state', [], 'combat.observeCount=9;combat.escapeUnlocked=true;');
  assert.deepEqual([t.g.run('combat.observeCount'),t.g.run('combat.escapeUnlocked')],[0,false]);
  t.step('normalize', [], 'startWardenCombat();');
  const e=owned(t);
  t.step('write only through instance', [], 'combat.enemies[0].observeCount=3;combat.enemies[0].escapeUnlocked=true;');
  assert.deepEqual([t.g.run('combat.observeCount'),t.g.run('combat.escapeUnlocked')],[3,true]);
  t.step('legacy setter projects into the same object', [], 'combat.observeCount=4;combat.escapeUnlocked=false;');
  assert.equal(owned(t,[4,false]),e);
  t.step('cleanup', [], 'endCombat();');
  assert.equal(t.g.run('combat.enemy'),null);
  assert.deepEqual([t.g.run('combat.observeCount'),t.g.run('combat.escapeUnlocked')],[0,false]);
  assert.equal(t.rng.length,0);
});

test('all registered templates are untouched and every normalized record starts fresh', () => {
  const t=fresh(), before=J(t,'ENEMY_TEMPLATE_REGISTRY');
  for(const [id,template] of Object.entries(before)) {
    for(const key of ['observeCount','escapeUnlocked']) assert.equal(Object.hasOwn(template,key),false,id);
    t.step('instantiate '+id, [], `combat.active=true;combat.enemy=ENEMY_TEMPLATE_REGISTRY[${JSON.stringify(id)}];`);
    owned(t);
    t.step('mutate runtime fields', [], 'combat.enemy.observeCount=8;combat.enemy.escapeUnlocked=true;');
    owned(t,[8,true]);
  }
  assert.deepEqual(J(t,'ENEMY_TEMPLATE_REGISTRY'),before);
  assert.equal(t.rng.length,0);
});

test('reserved authored observation fields reject atomically, including inherited fields', () => {
  const t=fresh('startWardenCombat();'), e=owned(t);
  for(const expr of ["{id:'conflict',observeCount:0}","{id:'conflict',escapeUnlocked:false}",
    "Object.assign(Object.create({observeCount:0}),{id:'inherited'})"]) {
    t.step('reject conflict', [], g=>assert.throws(()=>g.run('combat.enemy='+expr),/reserved observation state/));
    assert.equal(t.g.run('combat.enemy'),e);
  }
  t.step('next identity', [], 'startBossCombat();');
  assert.equal(owned(t).instanceId,'combat_enemy_2');
});

const starters = [
  ['ordinary pool','startCombat();',[0,0.99]],
  ['Pale Sentry',"resetLocationState();placeAtLocation('MAP_N2',1.5*TILE,9.5*TILE);sentry_quest_started=true;sentry_quest_done=false;pale_sentry_hp=177;startCombat();",[]],
  ['Donkey override',"resetLocationState();placeAtLocation('NORTH_BASIN_S_MAP',8.5*TILE,7.5*TILE);startCombat();",[0,0,0.99]],
  ['generated 23','startCombat();',[0,0.001,0.1,0.9,0.2,0.3,0.4,0.5,0.6]],
  ['parent Seep','enterDungeon8West();startCombat();',[0.99,0.99]],
  ['smaller Seep','startSeepSplitCombat(0);',[]],
  ['Rainfish','startRainfishCombat(2);',[]],
  ['male spawning-site toad','startMireToadSpawnCombat(2);',[0]],
  ['female spawning-site toad','startMireToadSpawnCombat(2);',[0.99]],
  ...['startBossCombat','startWardenCombat','startFortGuardCombat','startFortPolwickCombat',
    'startFortEssaCombat','startMulhollandCombat','startDenWraithCombat','startSailorBrawlCombat',
    'startTakomoCombat','startMimicPotionCombat','startTrappedDrownedCombat'].map(fn=>[fn,fn+'();',[]]),
  ['Lensweb Spider',RING_ROUTE+'startLenswebSpiderCombat();',[]],
];
for(const [name,start,tape] of starters) test('fresh ownership through production initializer: '+name,()=>{
  const t=fresh();
  t.step('actual initializer',tape,start);
  owned(t);
  assert.equal(t.g.run('combat.active'),true);
});

test('Observe uses explicit ownership, the same text indices, and the same response boundary',()=>{
  const t=dummy();
  for(const [index,roll] of [[0,0.499],[1,0.5],[2,0.1],[3,0.1]]) {
    const lines=J(t,`getObservationText(combat.enemy,${index})`);
    t.step('select Observe', [], 'combat.cursor=2;');
    const start=withoutLegacy(t,'Observe explicit',roll===0.5?[roll,0.5,0.9,0.9]:[roll],g=>g.press('Enter'));
    assert.deepEqual([start.message,...start.queue.map(e=>e.text)].slice(0,lines.length),lines);
    assert.equal(start.local.observeCount,index+1);
    owned(t,[index+1,false]);
    t.drainMessages();
  }
  assert.equal(t.g.run('stats.hp'),993,'only the response at the 50% boundary lands');
  assert.equal(t.rng.length,7);
});

test('Lensweb first Observe unlocks immediately; repeat lore and 25% response boundary stay exact',()=>{
  const t=fresh(RING_ROUTE+'startLenswebSpiderCombat();');
  owned(t);
  const first=choose(t,'observe',[0.249]);
  owned(t,[1,true]); // unlocked during construction, before lore acknowledgement
  assert.deepEqual([first.message,...first.queue.map(e=>e.text)], [
    'It guards the lens fiercely, but it makes no move to leave the web.',
    'It is territorial, not a hunter — back away and it will not follow.',
    'You could retreat safely now, objective in hand.',
    'It does not close the distance.',
  ]);
  t.drainMessages();
  for(let count=2;count<=4;count++) {
    const expected=J(t,`getObservationText(combat.enemy,${count-1})`);
    const s=choose(t,'observe',count===2?[0.25,0.5,0.9,0.9]:[0.1]);
    assert.deepEqual([s.message,...s.queue.map(e=>e.text)].slice(0,expected.length),expected);
    owned(t,[count,true]);t.drainMessages();
  }
  assert.ok(t.g.run('stats.hp')<1000);
  assert.equal(t.rng.length,7);
});

for(const [name,setup,tape,text,hp,pending] of [
  ['ordinary success','',[0],'Got away safely!',1000,true],
  ['ordinary failure','',[0.99,0.5,0.9,0.9],"Couldn't escape! Dummy attacks for 7!",993,false],
  ['blocked',"combat.enemy.runLock='observe_gated';",[0.5,0.9,0.9],"You can't tell where its web ends! The Dummy bites for 7!",993,false],
]) test('Run unchanged: '+name,()=>{
  const t=dummy(setup+'combat.cursor=3;combat.enemy.poisonChance=1;');
  const s=withoutLegacy(t,'Run explicit',tape,g=>g.press('Enter'));
  assert.equal(s.message,text);assert.equal(s.player.hp,hp);assert.equal(s.pending.escape,pending);
  assert.deepEqual(s.statuses,[],'Run retains its existing omission of on-hit effects');
  t.drainMessages();
  if(pending) assert.equal(t.g.run('combat.enemy'),null);
  else owned(t);
});

for(const [route,item] of [[RING_ROUTE,'Old Engagement Ring'],[GEM_ROUTE,'Stashed Gem']]) {
  test('Lensweb Observe-unlocked escape grants exactly one '+item,()=>{
    const t=fresh(route+'startLenswebSpiderCombat();');
    observe(t);owned(t,[1,true]);
    t.step('select Run', [], 'combat.cursor=3;');
    const s=withoutLegacy(t,'zero RNG unlocked Run',[],g=>g.press('Enter'));
    assert.equal(s.pending.escape,true);assert.equal(s.local.escapeUnlocked,true);
    assert.equal(t.g.run('stats.items.length'),0,'objective remains pending until escape settles');
    t.press('finalize escape');
    assert.equal(t.g.run('combat.active'),false);
    assert.equal(t.g.run('lighthouse_spider_resolved'),true);
    assert.deepEqual(J(t,'stats.items.map(i=>i.name)'),[item]);
    assert.equal(t.g.run('finalizeLenswebSpiderEvent()'),null);
    assert.equal(t.g.run('stats.items.length'),1);
    assert.equal(t.rng.length,1);
  });
  test('Lensweb victory retains rewards and exact-once '+item,()=>{
    const t=fresh(route+'startLenswebSpiderCombat();');
    observe(t);owned(t,[1,true]);
    t.step('lethal fixture', [], 'combat.enemy.hp=1;');
    choose(t,'attack',KILL);t.drainMessages();t.press('victory');
    assert.equal(t.g.run('combat.enemy'),null);
    assert.equal(t.g.run('lighthouse_spider_resolved'),true);
    assert.equal(t.g.run(`stats.items.filter(i=>i.name===${JSON.stringify(item)}).length`),1);
    const rewards=J(t,'[stats.xp,stats.gold,stats.items]');
    assert.equal(t.g.run('finalizeLenswebSpiderEvent()'),null);
    assert.deepEqual(J(t,'[stats.xp,stats.gold,stats.items]'),rewards);
  });
}

test('Lensweb defeat removes state, grants nothing, and retry starts locked again',()=>{
  const t=fresh(GEM_ROUTE+'startLenswebSpiderCombat();defeatWakeAtHome=false;');
  observe(t);const old=owned(t,[1,true]);
  t.step('loss setup', [], 'stats.hp=1;');
  choose(t,'attack',EF);t.drainMessages();t.press('recover');
  assert.equal(t.g.run('combat.enemy'),null);
  assert.equal(t.g.run('lighthouse_spider_resolved'),false);
  assert.equal(t.g.run('stats.items.length'),0);
  assert.equal(t.g.run('combat.escapeUnlocked'),false);
  t.step('retry actual starter', [], 'dialogue.open=false;startLenswebSpiderCombat();');
  assert.notEqual(owned(t).instanceId,old.instanceId);
  observe(t);choose(t,'run');t.press('settle retry escape');
  assert.deepEqual(J(t,'stats.items.map(i=>i.name)'),['Stashed Gem']);
});

for(const same of [true,false]) test('replacement does not inherit state: '+(same?'same template':'different template'),()=>{
  const t=fresh(RING_ROUTE+'startLenswebSpiderCombat();');
  observe(t);const old=owned(t,[1,true]);
  t.step('replace using actual starter', [], same?'startLenswebSpiderCombat();':'startWardenCombat();');
  const next=owned(t);
  assert.notEqual(next.instanceId,old.instanceId);
  old.observeCount=50;old.escapeUnlocked=true;
  owned(t);
});

test('stale Observe response cannot affect replacement player or observation state',()=>{
  const t=fresh(RING_ROUTE+'startLenswebSpiderCombat();');
  choose(t,'observe',[0.9,0.5,0.9,0.9]);
  t.g.run("var oldResponse=combat.messageQueue.find(e=>typeof e==='object').apply;");
  t.step('replace after cleanup', [], 'endCombat();startLenswebSpiderCombat();');
  const e=owned(t), before=J(t,'[stats.hp,combat.message,combat.messageQueue,lighthouse_spider_resolved]');
  withoutLegacy(t,'stale Observe callback',[],g=>g.run('oldResponse();'));
  assert.equal(owned(t),e);
  assert.deepEqual(J(t,'[stats.hp,combat.message,combat.messageQueue,lighthouse_spider_resolved]'),before);
});

for(const [name,setup,tape,nextTape] of [
  ['Guard to Polwick','fort_quest_started=true;fort_quest_stage=1;startFortGuardCombat();',[],[]],
  ['Polwick to Essa','fort_quest_started=true;fort_quest_stage=2;startFortPolwickCombat();',[],[]],
  ['Rainfish','startRainfishCombat(2);',[],[]],
  ['Mire Toad spawning site','startMireToadSpawnCombat(2);',[0],[0.99]],
  ['Seep follow-up','enterDungeon8West();startCombat();',[0.99,0.99],[]],
]) test('fresh ownership across actual sequential handoff: '+name,()=>{
  const t=fresh();t.step('start sequence',tape,setup);
  observe(t);const old=owned(t,[1,false]);
  // Test-only unlock probe checks that BOTH fields are discarded by handoff;
  // this does not give any existing authored sequence a new escape mechanic.
  t.step('prepare lethal turn', [], 'combat.enemy.escapeUnlocked=true;combat.enemy.hp=1;');
  choose(t,'attack',KILL);t.drainMessages();t.press('handoff');
  assert.equal(t.g.run('combat.enemies.length'),0);
  assert.deepEqual([t.g.run('combat.observeCount'),t.g.run('combat.escapeUnlocked')],[0,false]);
  t.press('next sequential opponent',nextTape);
  assert.notEqual(owned(t).instanceId,old.instanceId);
});

test('ordinary escape/re-entry and defeat/retry begin fresh',()=>{
  const t=dummy();observe(t);const first=owned(t,[1,false]);
  choose(t,'run',[0]);t.press('finish escape');
  t.step('re-entry', [], 'startWardenCombat();');
  assert.notEqual(owned(t).instanceId,first.instanceId);
  observe(t);const second=owned(t,[1,false]);
  t.step('defeat fixture', [], 'stats.hp=1;defeatWakeAtHome=false;');
  choose(t,'attack',EF);t.drainMessages();t.press('recover');
  t.step('retry', [], 'dialogue.open=false;startWardenCombat();');
  assert.notEqual(owned(t).instanceId,second.instanceId);
});

test('Pale Sentry saves HP, never observations; new-session load re-entry is fresh',()=>{
  const place="resetLocationState();placeAtLocation('MAP_N2',1.5*TILE,9.5*TILE);";
  const t=fresh(place+'sentry_quest_started=true;sentry_quest_done=false;pale_sentry_hp=177;startCombat();');
  observe(t);choose(t,'attack',PF);t.drainMessages();
  const hp=t.g.run('combat.enemy.hp');
  choose(t,'run',[0]);t.press('persist escape');
  assert.equal(t.g.run('pale_sentry_hp'),hp);
  t.step('save between battles', [], g=>assert.equal(g.run('saveGame()'),true));
  const raw=t.g.run("localStorage.getItem('verdantVale_save')");
  assert.doesNotMatch(raw,/observeCount|escapeUnlocked/);
  const loaded=fresh();
  loaded.step('load in fresh session', [], g=>{
    g.run('localStorage.setItem("verdantVale_save",'+JSON.stringify(raw)+');');
    assert.equal(g.run('loadGame()'),true);
    g.run('menu.open=false;dialogue.open=false;startCombat();');
  });
  owned(loaded);assert.equal(loaded.g.run('combat.enemy.hp'),hp);
});

test('live observation fields never enter a save payload',()=>{
  const t=fresh(RING_ROUTE+'startLenswebSpiderCombat();');observe(t);
  // Diagnostic direct API, not a supported save-during-battle input path.
  t.step('direct save API', [], g=>assert.equal(g.run('saveGame()'),true));
  const raw=t.g.run("localStorage.getItem('verdantVale_save')");
  assert.doesNotMatch(raw,/observeCount|escapeUnlocked|bombTargetInstanceId/);
  assert.equal(Object.hasOwn(JSON.parse(raw),'combat'),false);
  assert.equal(JSON.parse(raw).version,4);
});

test('logical traces read instance values even if legacy projections lie',()=>{
  const t=dummy('combat.enemy.observeCount=3;combat.enemy.escapeUnlocked=true;');
  const combat=t.g.run('combat'), descriptors=['observeCount','escapeUnlocked'].map(k=>[k,Object.getOwnPropertyDescriptor(combat,k)]);
  try {
    Object.defineProperty(combat,'observeCount',{get:()=>999,configurable:true,enumerable:true});
    Object.defineProperty(combat,'escapeUnlocked',{get:()=>false,configurable:true,enumerable:true});
    const c=t.checkpoint('instance authority');
    assert.equal(c.local.observeCount,3);assert.equal(c.local.escapeUnlocked,true);
  } finally {for(const [key,d] of descriptors)Object.defineProperty(combat,key,d);}
  t.step('cleanup', [], 'endCombat();');
  const c=t.checkpoint('empty logical defaults');
  assert.equal(c.local.observeCount,0);assert.equal(c.local.escapeUnlocked,false);
});

test('legacy access fails closed on impossible membership and gated formation state',()=>{
  const t=dummy(), original=t.g.run('combat.enemies');
  for(const key of ['observeCount','escapeUnlocked']) {
    try {
      t.g.run('combat.enemies=[combat.enemies[0],combat.enemies[0]];');
      assert.throws(()=>t.g.run('combat.'+key),/Singleton combat requires zero or one enemy/);
      assert.throws(()=>t.g.run('combat.'+key+'=0'),/Singleton combat requires zero or one enemy/);
    } finally {t.g.run('combat').enemies=original;}
  }
  assert.throws(()=>t.g.run('combat.enemy=[{}];'),/Singleton combat enemy/);
  owned(t);
  const source=fs.readFileSync(path.join(__dirname,'../../combat.js'),'utf8');
  assert.doesNotMatch(source,/combat\.(observeCount|escapeUnlocked)\s*(?:=|\+\+)/);
  assert.doesNotMatch(t.g.run('handleCombatAction.toString()'),/combat\.(observeCount|escapeUnlocked)/);
  assert.equal(t.g.run('combat.mode'),'single');
  for(const key of ['selectedTargetId','currentActorId','currentTargetId','actionQueue','intent']) {
    assert.equal(t.g.run('Object.hasOwn(combat,'+JSON.stringify(key)+')'),false,key);
  }
  t.g.run(`endCombat();initializeFormationState([
    {enemyId:'enemy_marsh_wisp',slot:0},{enemyId:'enemy_marsh_wisp',slot:1}]);`);
  assert.equal(t.g.run('combat.active'),false);
  assert.throws(()=>t.g.run('combat.active=true'),/Formation state cannot activate/);
  assert.throws(()=>t.g.run('handleCombatAction()'),/Formation state cannot process/);
  for(const key of ['observeCount','escapeUnlocked']) {
    assert.throws(()=>t.g.run('combat.'+key),/Formation state has no singleton/);
    assert.throws(()=>t.g.run('combat.'+key+'=0'),/Formation state has no singleton/);
  }
});

module.exports = {
  name:'enemy observation ownership: explicit Observe/Run, Lensweb outcomes, fresh instances and persistence',
  checks,
  run(){
    for(const check of checks){
      try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}
    }
    console.log('  '+checks.length+' observation-ownership checks passed ('+starters.length+' starter scenarios)');
  },
};
