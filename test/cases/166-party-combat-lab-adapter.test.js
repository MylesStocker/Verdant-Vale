'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const ROOT=path.join(__dirname,'../..'),checks=[],test=(name,run)=>checks.push({name,run}),HIT=[0.5,0.99,0.99];
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'partyCombatLab.getView()');
function frozen(value){if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));for(const d of Object.values(Object.getOwnPropertyDescriptors(value))){assert.ok(Object.hasOwn(d,'value'));frozen(d.value);}}else assert.notEqual(typeof value,'function');}
function fresh(){const g=createContext();g.run(`resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);player.facing='left';
  dialogue.open=false;dialogue.callbacks=null;dialogue.triggerEncounterId=null;menu.open=false;debugMenu.open=false;
  Math=Object.create(Math);var rngCalls=0;Math.random=()=>{rngCalls++;throw Error('unexpected lab RNG');};`);return g;}
function canonical(g){return g.run(`JSON.stringify({stats,statusEffects,slitherSpd,player,day,tick,worldToast,worldToastTimer,
  location:regionalWorldPosition(),locationState:snapshotLocationState(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),
  npcs:SIMPLE_NPCS.map(n=>[n.id,n.x,n.y,n.facing]),dialogue,choice,menu,debugMenu,warpMenu,accordPanel,continentMap,
  combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([k,d])=>k!=='enemies'&&Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),
  enemies:combat.enemies,formation:formationRounds.getView(),formationSession:formationSessionController.getView(),
  save:localStorage.getItem('verdantVale_save')})`);}
function enter(g,id='lely_esla_one'){const before=g.run('rngCalls'),v=g.run('partyCombatLab.enter('+JSON.stringify(id)+')');assert.ok(v);assert.equal(g.run('rngCalls'),before);frozen(v);return J(g,'partyCombatLab.getView()');}
function commandAll(g,target=null){while(view(g).phase==='collecting'){const v=view(g),id=target||v.livingTargetIds[0];assert.ok(g.run('partyCombatLab.submitAttack('+JSON.stringify({actorId:v.nextActorId,targetId:id})+')'));}assert.equal(view(g).phase,'ready');}
function taped(g,values,source){g.run('var labTape='+JSON.stringify(values)+',labUsed=0;Math.random=()=>{rngCalls++;if(labUsed>=labTape.length)throw Error("tape exhausted");return labTape[labUsed++];};');const out=g.run(source);assert.equal(g.run('labUsed'),values.length);g.run("Math.random=()=>{rngCalls++;throw Error('unexpected lab RNG');};");return out;}
function finish(g){while(view(g).phase==='playback')assert.ok(g.run('partyCombatLab.advancePlayback()'));assert.equal(view(g).phase,'playback_complete');return g.run('partyCombatLab.acknowledgePlayback()');}

test('three frozen scenarios prepare authentic 2v1, 2v2 and 2v3 membership without entry RNG',()=>{
  const expected=[['lely_esla_one',['enemy_marsh_wisp']],['lely_esla_two',['enemy_marsh_wisp','enemy_briar_hound']],
    ['lely_esla_three',['enemy_reed_grappler','enemy_silt_lurker','enemy_sluice_slime']]];
  const g0=fresh(),scenarios=g0.run('partyCombatLab.listScenarios()');frozen(scenarios);assert.deepEqual(Array.from(scenarios,s=>s.id),expected.map(x=>x[0]));
  for(const [id,ids] of expected){const g=fresh(),v=enter(g,id);assert.equal(v.party.length,2);assert.deepEqual(v.enemies.map(e=>e.id),ids);
    assert.deepEqual(v.enemies.map(e=>e.slot),ids.map((_,i)=>i));assert.equal(new Set(v.enemies.map(e=>e.instanceId)).size,ids.length);
    assert.equal(v.phase,'collecting');assert.equal(g.run('combat.active'),false);assert.ok(['single','formation'].includes(g.run('combat.mode')));}
});

test('Lely snapshots canonical HP and existing effective ordinary stats without transferring ownership',()=>{
  const g=fresh();g.run(`stats.hp=37;stats.maxHp=60;stats.atk=12;stats.def=5;stats.spd=9;
    stats.weapon=createItem('Bronze Knife');stats.armor=createItem('Leather Armor');stats.shield=createItem('Iron Shield');stats.accessory=createItem('Swift Bangle');`);
  const expected=J(g,'({hp:stats.hp,maxHp:stats.maxHp,atk:effectiveAtk(),def:effectiveDef(),spd:effectiveSpd()})'),canonicalStats=g.run('stats');
  const v=enter(g),lely=v.party[0];assert.deepEqual({hp:lely.hp,maxHp:lely.maxHp,
    atk:g.run('combatPlayerState.getMemberByCharacterId("lely_lab").atk'),
    def:g.run('combatPlayerState.getMemberByCharacterId("lely_lab").def'),
    spd:g.run('combatPlayerState.getMemberByCharacterId("lely_lab").spd')},expected);
  assert.equal(lely.name,'Lély');assert.equal(lely.profile,'canonical_snapshot');assert.equal(g.run('stats'),canonicalStats);
  g.run('combatPlayerState.session.submitAttack({actorId:"combat_party_1",targetId:"combat_enemy_1"})');assert.equal(g.run('stats.hp'),37);
});

test('Esla uses only the documented full-HP provisional neutral Lab profile',()=>{
  const g=fresh(),v=enter(g),esla=v.party[1];assert.deepEqual(esla,{characterId:'esla_lab',instanceId:'combat_party_2',slot:1,name:'Esla',hp:50,maxHp:50,profile:'lab_provisional'});
  assert.deepEqual(J(g,'combatPlayerState.getMemberByCharacterId("esla_lab")'),{characterId:'esla_lab',slot:1,name:'Esla',maxHp:50,atk:10,def:4,spd:8,instanceId:'combat_party_2',hp:50,statuses:[]});
});

test('commands, target planning, weighted scheduling, resolution and playback use real authorities',()=>{
  const g=fresh(),v=enter(g,'lely_esla_three');commandAll(g,v.enemies[0].instanceId);
  const result=taped(g,[0,0.5,0.999,0,0,0,0,...Array.from({length:5},()=>HIT).flat()],'partyCombatLab.commitRound()');
  assert.ok(result);assert.equal(view(g).phase,'playback');assert.equal(view(g).playbackFrame.frameIndex,0);
  assert.deepEqual(view(g).allyActions.map(a=>a.actorId),['combat_party_1','combat_party_2']);
  assert.deepEqual(J(g,'combatPlayerState.session.getView().enemyActions'),view(g).enemies.map((e,i)=>({actorId:e.instanceId,targetId:i===0?'combat_party_1':'combat_party_2'})));
  const live=J(g,'[...combatPlayerState.getView().members,...combat.enemies].map(m=>m.hp)');const first=JSON.stringify(view(g));
  assert.equal(JSON.stringify(view(g)),first);finish(g);assert.deepEqual(J(g,'[...combatPlayerState.getView().members,...combat.enemies].map(m=>m.hp)'),live);
});

test('victory remains rewardless and normal exit restores the exact canonical pre-Lab state',()=>{
  const g=fresh();g.run('stats.hp=23;stats.atk=100;stats.gold=71;stats.xp=19;');const before=canonical(g),items=g.run('stats.items'),statsRef=g.run('stats');
  const v=enter(g);commandAll(g,v.enemies[0].instanceId);taped(g,[0,0,0,...HIT],'partyCombatLab.commitRound()');finish(g);
  assert.equal(view(g).phase,'victory');assert.equal(view(g).terminalOutcome,'victory');assert.equal(g.run('partyCombatLab.exit()'),true);
  assert.equal(canonical(g),before);assert.equal(g.run('stats'),statsRef);assert.equal(g.run('stats.items'),items);assert.equal(g.run('stats.gold'),71);assert.equal(g.run('stats.xp'),19);
});

test('defeat remains recovery-free and exit restores canonical HP and world state',()=>{
  const g=fresh();g.run(`stats.hp=1;ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,hp:1000,maxHp:1000,atk:100,def:100};`);
  const before=canonical(g),v=enter(g);commandAll(g,v.enemies[0].instanceId);
  taped(g,[0,0.999,0.999,0.99,0,0.99,0.5,0.99,0],'partyCombatLab.commitRound()');finish(g);
  assert.equal(view(g).phase,'collecting');commandAll(g,v.enemies[0].instanceId);
  taped(g,[0.999,0.99,0,0.99],'partyCombatLab.commitRound()');finish(g);assert.equal(view(g).phase,'defeat');
  assert.equal(g.run('partyCombatLab.exit()'),true);assert.equal(canonical(g),before);assert.equal(g.run('stats.hp'),1);
});

test('mid-command exit and mid-playback emergency abort clear only temporary authorities',()=>{
  {const g=fresh(),before=canonical(g),v=enter(g,'lely_esla_two');assert.ok(g.run('partyCombatLab.submitAttack('+JSON.stringify({actorId:v.nextActorId,targetId:v.livingTargetIds[0]})+')'));
    const calls=g.run('rngCalls');assert.equal(g.run('partyCombatLab.exit()'),true);assert.equal(g.run('rngCalls'),calls);assert.equal(canonical(g),before);}
  {const g=fresh(),before=canonical(g),v=enter(g,'lely_esla_two');commandAll(g);taped(g,[0,0,0,0,0,...Array.from({length:3},()=>HIT).flat()],'partyCombatLab.commitRound()');
    const calls=g.run('rngCalls');assert.equal(g.run('partyCombatLab.emergencyAbort("manual test abort")'),true);assert.equal(g.run('rngCalls'),calls);assert.equal(canonical(g),before);
    assert.equal(view(g).active,false);assert.match(view(g).error,/manual test abort/);}
});

test('unexpected controller failure reports the error, cleans up and never retries',()=>{
  const g=fresh(),before=canonical(g);enter(g,'lely_esla_two');commandAll(g);g.run('Math.random=()=>{rngCalls++;throw Error("injected controller failure");};');
  assert.equal(g.run('partyCombatLab.commitRound()'),false);assert.equal(g.run('rngCalls'),1);assert.equal(canonical(g),before);
  assert.equal(view(g).active,false);assert.match(view(g).error,/injected controller failure/);assert.equal(g.run('combatPlayerState.hasParty()'),false);assert.equal(g.run('combat.mode'),null);
});

test('world state, timers, NPCs, progression, inventory, equipment and saves remain isolated',()=>{
  const g=fresh();g.run("stats.items=[createItem('Potion')];stats.weapon=createItem('Bronze Knife');combat.cooldown=33;worldToast='hold';worldToastTimer=44;saveGame();");
  const before=canonical(g),saved=g.run("localStorage.getItem('verdantVale_save')"),items=g.run('stats.items'),weapon=g.run('stats.weapon');enter(g,'lely_esla_three');
  g.frames(120);assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);assert.equal(g.run("localStorage.getItem('verdantVale_save')"),saved);
  assert.equal(g.run('partyCombatLab.exit()'),true);assert.equal(canonical(g),before);assert.equal(g.run('stats.items'),items);assert.equal(g.run('stats.weapon'),weapon);assert.equal(g.run('tick'),0);
});

test('immediate re-entry uses fresh identities; duplicate lifecycle calls fail safely',()=>{
  const g=fresh(),first=enter(g,'lely_esla_two');assert.equal(g.run('partyCombatLab.enter("lely_esla_one")'),false);assert.equal(view(g).scenarioId,'lely_esla_two');
  assert.equal(g.run('partyCombatLab.exit()'),true);assert.equal(g.run('partyCombatLab.exit()'),false);const second=enter(g,'lely_esla_two');
  assert.notDeepEqual(second.party.map(m=>m.instanceId),first.party.map(m=>m.instanceId));assert.notDeepEqual(second.enemies.map(m=>m.instanceId),first.enemies.map(m=>m.instanceId));
});

test('an unknown scenario consumes no identity and the next valid entry starts both sequences at one',()=>{
  const g=fresh();assert.equal(g.run('partyCombatLab.enter("missing_scenario")'),false);assert.equal(g.run('rngCalls'),0);
  const v=enter(g);assert.deepEqual(v.party.map(m=>m.instanceId),['combat_party_1','combat_party_2']);assert.deepEqual(v.enemies.map(e=>e.instanceId),['combat_enemy_1']);
});

for(const invalid of ['statusEffects=["poison"]','stats.accessory={name:"EvadeAll",type:"accessory",bonus:0,price:0,evadeAll:true}',
  'combat.message="pending"','combat.pendingVictory=true','debugMenu.open=true','startWardenCombat()',
  'ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,regenPerTurn:1}'])
  test('invalid entry is atomic with zero RNG and identities: '+invalid,()=>{const g=fresh();g.run(invalid);const before=canonical(g),enemySeq=g.run('combatEnemyInstanceSequence');
    assert.equal(g.run('partyCombatLab.enter("lely_esla_one")'),false);assert.equal(g.run('rngCalls'),0);assert.equal(g.run('combatEnemyInstanceSequence'),enemySeq);assert.equal(canonical(g),before);assert.equal(g.run('combatPlayerState.hasParty()'),false);});

test('other Lab and ordinary combat remain isolated',()=>{
  const g=fresh();g.run('debugMenu.open=true;');assert.equal(g.run('formationCombatLab.open()'),true);assert.equal(g.run('partyCombatLab.enter("lely_esla_one")'),false);
  g.run('formationCombatLab.closeMenu();debugMenu.open=false;');enter(g);assert.equal(g.run('formationCombatLab.open()'),false);
  assert.throws(()=>g.run('startWardenCombat()'),/Prepared player party/);assert.equal(g.run('combat.active'),false);g.run('partyCombatLab.exit()');g.run('startWardenCombat()');assert.equal(g.run('combat.mode'),'single');
});

test('views are detached and frozen; only the isolated input, renderer and debug menu call the Lab',()=>{
  const g=fresh(),v=enter(g),liveView=g.run('partyCombatLab.getView()');frozen(liveView);const serial=JSON.stringify(liveView);assert.throws(()=>{liveView.party[0].hp=0;});assert.equal(JSON.stringify(liveView),serial);
  const files=scriptOrderFromIndexHtml();for(const file of files){const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    if(!['party-combat-lab.js','input.js'].includes(file))assert.doesNotMatch(source,/partyCombatLab\.(enter|submitAttack|backtrack|commitRound|advancePlayback|acknowledgePlayback|exit|emergencyAbort|moveTarget|confirmTarget|startScenario)\s*\(/,file);
    if(file==='render-party-combat-lab.js')assert.equal((source.match(/partyCombatLab\.getView\(\)/g)||[]).length,1,'renderer has one read-only Lab view call');
    else if(/content|interaction|quest|encounter/.test(file))assert.doesNotMatch(source,/partyCombatLab|PARTY_COMBAT_LAB_/,file);
    if(file==='save.js')assert.equal((source.match(/partyCombatLab\.isActive\(\)/g)||[]).length,1,'one load refusal guard');}
  const input=fs.readFileSync(path.join(ROOT,'input.js'),'utf8'),render=fs.readFileSync(path.join(ROOT,'render.js'),'utf8');
  assert.equal((input.match(/partyCombatLab\.confirmTarget\(\)/g)||[]).length,1);
  assert.equal((render.match(/drawPartyCombatLabBattle\(\)/g)||[]).length,1);
  const source=fs.readFileSync(path.join(ROOT,'party-combat-lab.js'),'utf8');assert.doesNotMatch(source,/applyKillRewards|endCombat\(|recoverCombatDefeat|transitionToLocation|saveGame\(|loadGame\(|combat\.active\s*=|stats\.(hp|xp|gold)\s*=/);
  assert.equal(g.run('SAVE_VERSION'),4);
});

module.exports={name:'isolated Lely/Esla Party Combat Lab: authentic lifecycle, restoration and isolation',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}console.log('  '+checks.length+' party combat lab checks passed');}};
