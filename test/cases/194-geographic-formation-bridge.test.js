'use strict';
const assert=require('assert/strict'),fs=require('fs');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,source)=>JSON.parse(g.run('JSON.stringify('+source+')'));
const view=g=>J(g,'canonicalPartyCombat.getView()');
const formation=(id,ids,weight=1)=>`Object.freeze({id:${JSON.stringify(id)},enemies:Object.freeze(${JSON.stringify(ids)}),weight:${weight}})`;
const W='enemy_marsh_wisp',H='enemy_briar_hound',S='enemy_sluice_slime';
function fresh(count=2,basin=false){
  // Spies observe the real frozen authorities, without replacing validation or
  // installation. The third member is authored only inside this isolated VM.
  const read=fs.readFileSync;let g;
  try{
    fs.readFileSync=function(file,...args){let source=read.call(this,file,...args);
      if(String(file).endsWith('/encounter-formations.js'))source=source.replace('    select(pool){',
        '    select(pool){window.bridgeSelectCalls=(window.bridgeSelectCalls||0)+1;');
      if(String(file).endsWith('/canonical-party-combat.js'))source=source.replace('    enter(request){',
        '    enter(request){window.bridgeEnterCalls=(window.bridgeEnterCalls||0)+1;window.bridgeEntered=request.enemies;');
      if(String(file).endsWith('/persistent-party.js')&&count===3)source=source.replace('  lely:Object.freeze',
        "  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture third',rareBorn:false,affinity:null,progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),\n  lely:Object.freeze");
      return source;
    };
    g=createContext();
  }finally{fs.readFileSync=read;}
  g.run(`dialogue.open=false;dialogue.callbacks=null;${count>1?'persistentParty.joinEsla({level:11});':''}
    Math=Object.create(Math);var bridgeRolls=[];Math.random=()=>{throw Error('unexpected RNG')};`);
  if(count===3){g.run(`saveGame();var fixture=JSON.parse(localStorage.getItem('verdantVale_save'));
    fixture.party.order.push('fixture_third');fixture.party.characters.push({...fixture.party.characters[0],characterId:'fixture_third'});
    localStorage.setItem('verdantVale_save',JSON.stringify(fixture));loadGame();dialogue.open=false;`);}
  g.run(`placeAtLocation(${JSON.stringify(basin?'NORTH_BASIN_S_MAP':'MAP2')},8.5*TILE,8.5*TILE);combat.cooldown=37;`);
  return g;
}
function pool(g,source){g.run('var bridgePool='+source+';currentEncounterPool=()=>bridgePool');}
function tape(g,rolls){g.run(`var bridgeTape=${JSON.stringify(rolls)};bridgeRolls=[];Math.random=()=>{
  if(!bridgeTape.length)throw Error('extra geographic RNG');const n=bridgeTape.shift();bridgeRolls.push(n);return n;};`);}
function start(g,rolls){tape(g,rolls);g.run('startCanonicalPartyEncounter()');
  assert.deepEqual(J(g,'bridgeRolls'),rolls);assert.equal(g.run('bridgeTape.length'),0);
  assert.equal(g.run('window.bridgeSelectCalls'),1);assert.equal(g.run('window.bridgeEnterCalls'),1);
  assert.equal(g.run('combat.cooldown'),37);assert.equal(g.run('combat.active'),false);
  const v=view(g);assert.equal(v.active,true);assert.equal(new Set(v.enemies.map(e=>e.instanceId)).size,v.enemies.length);
  assert.deepEqual(v.enemies.map(e=>e.slot),v.enemies.map((_,i)=>i));return v;
}
const state=g=>g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.getView(),
  runtime:combatPlayerState.getView(),round:combatPlayerState.getRoundView(),session:combatPlayerState.session.getView(),
  canonical:canonicalPartyCombat.getView(),combat:{data:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat))
    .filter(([,d])=>Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),mode:combat.mode,active:combat.active,enemies:combat.enemies},
  sequence:combatEnemyInstanceSequence,location:snapshotLocationState(),regional:regionalWorldPosition(),player,day,tick,
  dialogue,choice,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save')})`);
function reject(g,pattern){const before=state(g);assert.throws(()=>g.run('startCanonicalPartyEncounter()'),pattern);
  assert.equal(state(g),before,'rejection preserves all gameplay, runtime identity and saved state');
  assert.deepEqual(J(g,'bridgeRolls'),[]);assert.equal(g.run('window.bridgeSelectCalls||0'),0);assert.equal(g.run('window.bridgeEnterCalls||0'),0);}

test('legacy flat selection retains uniform indices, repetitions, exact registered inputs and one selection draw',()=>{
  for(const [roll,id]of [[0,W],[.2499,W],[.25,H],[.5,W],[.999999,S]]){
    const g=fresh();pool(g,`[ENEMY_TEMPLATE_REGISTRY.${W},ENEMY_TEMPLATE_REGISTRY.${H},ENEMY_TEMPLATE_REGISTRY.${W},ENEMY_TEMPLATE_REGISTRY.${S}]`);
    const v=start(g,[roll,.5]);assert.deepEqual(v.enemies.map(e=>e.id),[id]);
    assert.equal(g.run('window.bridgeEntered[0]===ENEMY_TEMPLATE_REGISTRY.'+id),true);
  }
});

test('weighted selection resolves the whole ordered record once, with exact cumulative boundaries',()=>{
  const entries=[formation('formation_single',[W],1),formation('formation_pair',[H,W],2),formation('formation_triple',[S,H,W],1)];
  for(const [roll,ids]of [[0,[W]],[.25,[H,W]],[.74999,[H,W]],[.75,[S,H,W]],[.99999,[S,H,W]]]){
    const g=fresh();pool(g,'Object.freeze(['+entries.join(',')+'])');assert.deepEqual(start(g,[roll,.5]).enemies.map(e=>e.id),ids);
    assert.equal(g.run('window.bridgeEntered.every(t=>t===ENEMY_TEMPLATE_REGISTRY[t.id])'),true);
  }
});

test('duplicate templates install distinct exact identities, fixed slots and stable A/B/C labels',()=>{
  const g=fresh();pool(g,'['+formation('formation_duplicates',[W,W,W])+']');const v=start(g,[.5,.5]);
  assert.deepEqual(v.enemies.map(e=>e.id),[W,W,W]);assert.equal(g.run('combatEnemyInstanceSequence'),3);
  assert.deepEqual(J(g,'partyBattleLayout(canonicalPartyCombat.getView()).enemies.map(e=>e.label)'),['Marsh Wisp A','Marsh Wisp B','Marsh Wisp C']);
  assert.equal(g.run('combat.enemies[0]===combat.enemies[1]'),false);
});

for(const allies of [1,2,3])for(const enemies of [1,2,3])test(`${allies} canonical allies by ${enemies} selected enemies installs once`,()=>{
  const g=fresh(allies),ids=[W,H,S].slice(0,enemies);pool(g,'['+formation('formation_matrix',ids)+']');
  const v=start(g,[.5,.5]);assert.equal(v.party.length,allies);assert.deepEqual(v.enemies.map(e=>e.id),ids);
  assert.equal(new Set([...v.party,...v.enemies].map(e=>e.instanceId)).size,allies+enemies);
});

test('North Basin success replaces the entire pair/triple; strict 1/16 boundary and failed checks preserve order',()=>{
  for(const ids of [[W,H],[W,H,S]])for(const donkeyRoll of [0,1/16-Number.EPSILON,1/16,.99]){
    const g=fresh(2,true);pool(g,'['+formation('formation_basin',ids)+']');
    assert.deepEqual(start(g,[.5,donkeyRoll,.5]).enemies.map(e=>e.id),donkeyRoll<1/16?['enemy_swamp_donkey']:ids);
  }
});

test('generated 23 replaces an entire formation only below 1/256 and draws its seven values once in legacy order',()=>{
  const generation=[.1,.2,.3,.4,.5,.6,.7];
  for(const ids of [[W,H],[S,W,H]])for(const rare of [0,1/256-Number.EPSILON,1/256,.99]){
    const g=fresh();pool(g,'['+formation('formation_generated',ids)+']');
    const success=rare<1/256,v=start(g,[.5,rare,...(success?generation:[])]);
    assert.deepEqual(v.enemies.map(e=>e.id),success?['enemy_23']:ids);
    if(success){const enemy=v.enemies[0];assert.deepEqual([enemy.hp,enemy.maxHp,enemy.atk,enemy.def,enemy.spd], [69,69,230,276,322]);
      const origin=J(g,'canonicalEnemyRecords.origin(window.bridgeEntered[0])');assert.equal(origin.kind,'generated');
      assert.deepEqual(origin.rolls,generation);assert.deepEqual([origin.template.xp,origin.template.goldMin,origin.template.goldMax],[391,115,161]);
      const before=state(g);g.run('drawPartyBattle(canonicalPartyCombat.getView())');assert.equal(state(g),before);
    }
  }
});

test('simultaneous overrides preserve source precedence: 23 wins after Swamp Donkey, with no discarded identities',()=>{
  for(const weighted of [false,true]){
    const g=fresh(2,true);pool(g,weighted?'['+formation('formation_both',[W,H,S])+']':`[ENEMY_TEMPLATE_REGISTRY.${W}]`);
    assert.deepEqual(start(g,[.5,0,0,...Array(7).fill(.5)]).enemies.map(e=>e.id),['enemy_23']);
    assert.equal(g.run('combatEnemyInstanceSequence'),1);
  }
});

test('override eligibility remains North Basin outdoor only, irrespective of flat or weighted input',()=>{
  for(const weighted of [false,true]){
    const g=fresh();pool(g,weighted?'['+formation('formation_outside',[W,H])+']':`[ENEMY_TEMPLATE_REGISTRY.${W}]`);
    assert.deepEqual(start(g,[0,.5]).enemies.map(e=>e.id),weighted?[W,H]:[W]);
    const h=fresh(2,true);pool(h,weighted?'['+formation('formation_inside',[W,H])+']':`[ENEMY_TEMPLATE_REGISTRY.${W}]`);
    assert.deepEqual(start(h,[0,0,.5]).enemies.map(e=>e.id),['enemy_swamp_donkey']);
  }
});

test('every record validates before selection: unknown IDs and raw-template impersonation cannot hide in unselected rows',()=>{
  for(const invalid of [formation('formation_unknown',['enemy_missing']),
    `{...ENEMY_TEMPLATE_REGISTRY.${W}}`,"'enemy_marsh_wisp'",formation('formation_scripted',['enemy_road_impostor']),
    formation('formation_bespoke',['enemy_gallery_receiver']),formation('formation_unauthenticated',['enemy_23'])]){
    const g=fresh();pool(g,`[ENEMY_TEMPLATE_REGISTRY.${W},${invalid}]`);reject(g,/Encounter formation|Canonical party|canonical|generated/);
  }
});

test('malformed tables, weights, counts, accessors, prototypes and mutable definitions reject without evaluating getters',()=>{
  const bad=[null,'null','{}','[]','new Array(2)',
    'Object.assign([],{extra:true})',
    `Object.assign([ENEMY_TEMPLATE_REGISTRY.${W}],{extra:true})`,
    `[Object.freeze({id:'formation_bad',enemies:Object.freeze([]),weight:1})]`,
    '['+formation('formation_bad',[W,W,W,W])+']',
    `[Object.freeze({id:'formation_bad',enemies:['${W}'],weight:1})]`,
    `[{id:'formation_bad',enemies:Object.freeze(['${W}']),weight:1}]`,
    `[Object.freeze({id:'formation_bad',enemies:Object.freeze(['${W}']),weight:1,extra:true})]`,
    `[Object.freeze(Object.assign(Object.create({}),{id:'formation_bad',enemies:Object.freeze(['${W}']),weight:1}))]`,
    `[Object.freeze({id:'formation_bad',get enemies(){window.bridgeGetters++;return ['${W}']},weight:1})]`,
    `[Object.freeze({id:'formation_bad',enemies:Object.freeze(['${W}']),get weight(){window.bridgeGetters++;return 1}})]`,
    `[Object.defineProperty([],0,{get(){window.bridgeGetters++;return ENEMY_TEMPLATE_REGISTRY.${W}}})]`,
    ...[0,-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1].map(weight=>'['+formation('formation_bad',[W],String(weight))+']'),
    '['+formation('formation_first',[W],Number.MAX_SAFE_INTEGER)+','+formation('formation_second',[H])+']',
    '['+formation('formation_same',[W])+','+formation('formation_same',[H])+']'];
  for(const source of bad.filter(Boolean)){
    const g=fresh(2,true);g.run('window.bridgeGetters=0');pool(g,source);reject(g,/Encounter formation/);assert.equal(g.run('window.bridgeGetters'),0,source);
  }
});

test('actual party arithmetic, encounter ownership and identity capacity reject before any selection draw',()=>{
  for(const setup of ['stats.gold=Number.MAX_SAFE_INTEGER','stats.atk=Number.MAX_SAFE_INTEGER',
    'combatEnemyInstanceSequence=Number.MAX_SAFE_INTEGER','dialogue.open=true']){
    const g=fresh();pool(g,'['+formation('formation_safety',[W,H,S])+']');g.run(setup);reject(g,/./);
  }
  const g=fresh();pool(g,'['+formation('formation_busy',[W])+']');start(g,[.5,.5]);g.run('bridgeRolls=[];window.bridgeSelectCalls=0;window.bridgeEnterCalls=0');reject(g,/./);
});

test('invalid generated actual state rejects after conditional draws without installation, cooldown or identity mutation',()=>{
  const g=fresh();pool(g,'['+formation('formation_zero_generated',[W,H,S])+']');
  const before=state(g);tape(g,[.5,0,0,...Array(6).fill(.5)]);
  assert.throws(()=>g.run('startCanonicalPartyEncounter()'),/invalid enemy arithmetic/);
  assert.equal(state(g),before);assert.equal(g.run('bridgeRolls.length'),9);assert.equal(g.run('combatEnemyInstanceSequence'),0);
  assert.equal(g.run('window.bridgeEnterCalls'),1);assert.equal(g.run('window.bridgeSelectCalls'),1);
});

test('geographic no-pool sentinel is inert, including no selection or rare-override RNG',()=>{
  const g=fresh();pool(g,'EMPTY_ENCOUNTER_POOL');const before=state(g);g.run('startCanonicalPartyEncounter()');
  assert.equal(state(g),before);assert.equal(g.run('window.bridgeSelectCalls||0'),0);assert.deepEqual(J(g,'bridgeRolls'),[]);
});

test('normal routing still chooses singleton before recruitment and canonical after recruitment, including Fallen Esla',()=>{
  const solo=fresh(1);pool(solo,`[ENEMY_TEMPLATE_REGISTRY.${W}]`);tape(solo,[.5,.5]);solo.run('startCombat()');
  assert.equal(solo.run('combat.active'),true);assert.equal(solo.run('canonicalPartyCombat.isActive()'),false);
  assert.deepEqual(J(solo,'bridgeRolls'),[.5,.5]);assert.equal(solo.run('window.bridgeSelectCalls||0'),0);
  for(const fallen of [false,true]){
    const g=fresh();if(fallen)g.run(`saveGame();var s=JSON.parse(localStorage.getItem('verdantVale_save'));
      s.party.characters[0].hp=0;localStorage.setItem('verdantVale_save',JSON.stringify(s));loadGame();dialogue.open=false;`);
    pool(g,`[ENEMY_TEMPLATE_REGISTRY.${W}]`);tape(g,[.5,.5]);g.run('startCombat()');
    assert.equal(view(g).active,true);assert.equal(view(g).party.length,2);assert.equal(view(g).party[1].hp===0,fallen);
    assert.equal(g.run('window.bridgeEnterCalls'),1);assert.deepEqual(J(g,'bridgeRolls'),[.5,.5]);
  }
});

test('successful formation entry retains save refusal and Run cleanup/cooldown authority',()=>{
  const g=fresh();pool(g,'['+formation('formation_escape',[W,H,S])+']');start(g,[.5,.5]);assert.equal(g.run('saveGame()'),false);
  g.run('Math.random=()=>0');let guard=0;
  while(view(g).phase==='awaiting_action'){
    while(view(g).selectedCommand!=='run'){g.run("canonicalPartyCombat.handleInput('right')");assert.ok(guard++<20);}
    g.run("canonicalPartyCombat.handleInput('confirm')");
  }
  g.run("canonicalPartyCombat.handleInput('confirm')");guard=0;
  while(['playback','playback_complete'].includes(view(g).phase)){g.run("canonicalPartyCombat.handleInput('confirm')");assert.ok(guard++<100);}
  assert.equal(view(g).phase,'escape');g.run("canonicalPartyCombat.handleInput('confirm')");assert.equal(view(g).active,false);
  assert.equal(g.run('combat.cooldown===ENCOUNTER_COOLDOWN'),true);assert.equal(g.run('saveGame()'),true);
  assert.equal(g.run('loadGame()'),true);assert.equal(g.run('SAVE_VERSION'),5);
});

module.exports={name:'geographic formation bridge: complete-table preflight, ordered installation and whole-encounter overrides',run(){
  for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}
  console.log('  '+checks.length+' geographic formation bridge checks passed');
}};
