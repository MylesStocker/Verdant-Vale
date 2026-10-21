'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const ROOT=path.join(__dirname,'../..'),checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const ORDINARY=[
  'enemy_marsh_wisp','enemy_briar_hound','enemy_marsh_wisp_early','enemy_briar_hound_early',
  'enemy_crypt_fiend','enemy_fen_shade','enemy_crypt_revenant','enemy_wall_tendril',
  'enemy_fen_lurker','enemy_bog_serpent','enemy_marsh_rat','enemy_reed_grappler',
  'enemy_silt_lurker','enemy_marsh_wisp_sluice_top','enemy_sluice_slime','enemy_tallyman',
  'enemy_mudflat_strider','enemy_pale_drowned_gallery','enemy_silt_hag_gallery',
  'enemy_silt_hag_vault','enemy_swamp_donkey','enemy_mulholland',
  // Pass 4A adds the existing Brace mechanic; the original 22 remain covered.
  'enemy_stone_crawler','enemy_bone_guard','enemy_hollow','enemy_tomb_sentry',
  'enemy_shallows_skitter','enemy_silt_crab','enemy_silt_crab_upper','enemy_marrow_hulk',
  // Pass 4B migrates the existing landed-hit status and offensive riders.
  'enemy_shade_wraith','enemy_void_walker','enemy_dripping_maw','enemy_fen_witch',
  'enemy_corpse_slug','enemy_lantern_moth','enemy_dust_drowned',
  // Pass 4C completes mechanics; generated stats require authenticated input.
  'enemy_the_seep','enemy_rotwood_troll','enemy_thornback','enemy_mire_toad_male','enemy_mire_toad_female',
  'enemy_basin_gull','enemy_basin_gull_upper','enemy_23',
];
const SPECIAL={};
const SCRIPTED={
  enemy_briar_warden:['warden_lifecycle'],enemy_smuggler_guard:['fort_lifecycle'],
  enemy_polwick:['fort_lifecycle','firelit_attack'],enemy_essa:['fort_lifecycle'],
  enemy_pale_sentry:['persistent_hp_lifecycle'],enemy_rainfish:['rainfish_chain'],
  enemy_takomo:['takomo_lifecycle'],enemy_den_wraith:['den_wraith_lifecycle'],
  enemy_kolm:['sailor_brawl_lifecycle'],enemy_wrongteeth:['wrongteeth_lifecycle'],
  enemy_lensweb_spider:['observe_run_lock','lensweb_objective_lifecycle'],
  enemy_mimic_potion:['guaranteed_drop','mimic_trap_lifecycle'],
  enemy_gallery_receiver:['receiver_coordination'],enemy_gallery_caller:['receiver_coordination'],
  enemy_gallery_keeper:['receiver_coordination'],
  enemy_road_impostor:['travellers_rise_ambush_lifecycle'],
  enemy_bridled_hollow:['brace','travellers_rise_ambush_lifecycle'],
  enemy_fen_handler:['travellers_rise_ambush_lifecycle'],
};
const SCRIPTED_SUPPORTED=new Set(['enemy_briar_warden','enemy_pale_sentry','enemy_rainfish','enemy_takomo',
  'enemy_den_wraith','enemy_kolm','enemy_wrongteeth','enemy_lensweb_spider','enemy_mimic_potion']);
SCRIPTED_SUPPORTED.add('enemy_road_impostor');SCRIPTED_SUPPORTED.add('enemy_bridled_hollow');SCRIPTED_SUPPORTED.add('enemy_fen_handler');
const BASE=['basic_attack','standard_observe','standard_rewards'];

function fresh(n=2,capture=false){
  const read=fs.readFileSync;
  try{
    fs.readFileSync=function(file,...args){let source=read.call(this,file,...args);
      if(String(file).endsWith('/persistent-party.js')&&n===3)source=source.replace('  lely:Object.freeze',
        "  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture third',rareBorn:false,affinity:null,progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),\n  lely:Object.freeze");
      if(String(file).endsWith('/combat.js')&&capture)source=source.replace("stage='playback';const playback=combatPlayerState.createRoundPlayback(result)",
        "stage='playback';window.__capabilityResult=result;const playback=combatPlayerState.createRoundPlayback(result)");
      return source;
    };
    const g=createContext();g.run(`dialogue.open=false;${n>1?'persistentParty.joinEsla();':''}
      Math=Object.create(Math);var capabilityRolls=0;Math.random=()=>{capabilityRolls++;throw Error('unexpected RNG')};`);
    if(n===3){g.run(`saveGame();var capabilitySave=JSON.parse(localStorage.getItem('verdantVale_save'));
      capabilitySave.party.order.push('fixture_third');capabilitySave.party.characters.push({...capabilitySave.party.characters[0],characterId:'fixture_third'});
      localStorage.setItem('verdantVale_save',JSON.stringify(capabilitySave));loadGame();dialogue.open=false;`);}
    return g;
  }finally{fs.readFileSync=read;}
}
const frozen=value=>{if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozen);}};
const descriptors=ids=>ids.map((enemyId,slot)=>({enemyId,slot}));
const state=g=>g.run(`JSON.stringify({combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),
  mode:combat.mode,enemySequence:combatEnemyInstanceSequence,
  party:persistentParty.getView(),runtime:combatPlayerState.getView(),session:combatPlayerState.session.getView(),
  canonical:canonicalPartyCombat.getView(),stats,statusEffects,slitherSpd,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),
  location:snapshotLocationState(),regional:regionalWorldPosition(),day,tick,player,save:localStorage.getItem('verdantVale_save')})`);

test('the audit covers every registered production template exactly once and reconciles all four categories',()=>{
  const text=fs.readFileSync(path.join(ROOT,'ENEMY_CAPABILITY_AUDIT.md'),'utf8');
  const rows=[...text.matchAll(/^\| `(enemy_[^`]+)`[^\n]*\| (ordinary|special capability pending|scripted-only lifecycle|non-production\/debug fixture) \|/gm)]
    .map(match=>({id:match[1],category:match[2]}));
  assert.equal(rows.length,63);assert.equal(new Set(rows.map(r=>r.id)).size,63);
  const g=fresh();assert.deepEqual(rows.map(r=>r.id).sort(),J(g,'Object.keys(ENEMY_TEMPLATE_REGISTRY).sort()'));
  assert.deepEqual(rows.filter(r=>r.category==='ordinary').map(r=>r.id).sort(),ORDINARY.slice().sort());
  assert.deepEqual(rows.filter(r=>r.category==='special capability pending').map(r=>r.id).sort(),Object.keys(SPECIAL).sort());
  assert.deepEqual(rows.filter(r=>r.category==='scripted-only lifecycle').map(r=>r.id).sort(),Object.keys(SCRIPTED).sort());
  assert.equal(rows.filter(r=>r.category==='non-production/debug fixture').length,0);
});

test('all 63 deterministic metadata records are closed, deeply frozen and capability-valid',()=>{
  const g=fresh();assert.equal(g.run('validateEnemyCapabilityRegistry()'),63);
  assert.deepEqual(J(g,'Object.keys(ENEMY_CAPABILITY_REGISTRY)'),J(g,'Object.keys(ENEMY_TEMPLATE_REGISTRY)'));
  for(const id of J(g,'Object.keys(ENEMY_TEMPLATE_REGISTRY)')){
    const metadata=g.run('ENEMY_CAPABILITY_REGISTRY['+JSON.stringify(id)+']');frozen(metadata);
    assert.deepEqual(Reflect.ownKeys(metadata).sort(),['capabilities','templateId']);
    assert.equal(metadata.templateId,id);assert.equal(new Set(metadata.capabilities).size,metadata.capabilities.length);
  }
  for(const id of ORDINARY)assert.equal(g.run('!!ENEMY_SPRITE_DISPATCH['+JSON.stringify(id)+']'),true,id);
  assert.deepEqual(J(g,'CANONICAL_ENEMY_CAPABILITIES'),['basic_attack','standard_observe','standard_rewards','boss_escape_lock','brace',
    'curse_on_hit','void_shard_burst','acid_corrosion','split_followup','regeneration','melee_armor','counterattack',
    'poison_on_hit','mire_toad_reagent_observation','slither_on_hit','poison_spell','dazzle_on_hit','steal_and_flee',
    'observe_run_lock','guaranteed_drop','generated_stats','warden_lifecycle','persistent_hp_lifecycle','rainfish_chain',
    'takomo_lifecycle','den_wraith_lifecycle','sailor_brawl_lifecycle','wrongteeth_lifecycle',
    'lensweb_objective_lifecycle','mimic_trap_lifecycle','travellers_rise_ambush_lifecycle']);
});

test('every ordinary template prepares against one, two and three canonical members',()=>{
  for(const count of [1,2,3]){
    const g=fresh(count),before=state(g);
    for(const id of ORDINARY.filter(id=>id!=='enemy_23')){
      const plan=J(g,'canonicalPartyCombat.prepare({enemies:['+JSON.stringify(id)+'],escape:"fastest_living"})');
      assert.equal(plan.playerSide.members.length,count,id);assert.deepEqual(plan.enemySide.ids,[id],id);
      assert.equal(state(g),before,id);assert.equal(g.run('capabilityRolls'),0,id);
    }
  }
});

test('every ordinary template instantiates duplicate and triplicate exact identities without shared state',()=>{
  const g=fresh();
  for(const id of ORDINARY.filter(id=>id!=='enemy_23')){
    for(const count of [2,3]){
      g.run('initializeCanonicalEnemyFormationState('+JSON.stringify(descriptors(Array(count).fill(id)))+',{escape:"blocked"})');
      const members=J(g,'combat.enemies.map(e=>({id:e.id,instanceId:e.instanceId,slot:e.slot,hp:e.hp,maxHp:e.maxHp,observeCount:e.observeCount}))');
      assert.equal(members.length,count,id);assert.equal(new Set(members.map(m=>m.instanceId)).size,count,id);
      assert.deepEqual(members.map(m=>m.slot),Array.from({length:count},(_,i)=>i),id);
      g.run('combat.enemies[0].hp--;combat.enemies[0].observeCount++');
      assert.deepEqual(J(g,'combat.enemies.slice(1).map(e=>[e.hp,e.maxHp,e.observeCount])'),members.slice(1).map(m=>[m.hp,m.maxHp,0]),id);
      g.run('endCombat()');
    }
  }
  assert.equal(g.run('capabilityRolls'),0);
});

test('mixed ordinary formations prepare in authored slot order and use the renderer capacity',()=>{
  const g=fresh(3),ids=['enemy_crypt_fiend','enemy_bog_serpent','enemy_tallyman'];
  const plan=J(g,'canonicalPartyCombat.prepare({enemies:'+JSON.stringify(ids)+',escape:"fastest_living"})');
  assert.deepEqual(plan.enemySide.ids,ids);g.run('canonicalPartyCombat.enter({enemies:'+JSON.stringify(ids)+',escape:"fastest_living"})');
  const view=J(g,'canonicalPartyCombat.getView()');assert.deepEqual(view.enemies.map(e=>e.id),ids);
  assert.deepEqual(view.enemies.map(e=>e.slot),[0,1,2]);assert.equal(new Set(view.enemies.map(e=>e.instanceId)).size,3);
  const layout=J(g,'partyBattleLayout(canonicalPartyCombat.getView())');assert.deepEqual(layout.allies.map(a=>a.x),[108,256,404]);
  assert.equal(layout.enemies.length,3);assert.ok(layout.enemies.every(e=>Number.isFinite(e.scale)&&e.scale>0));
});

test('a formerly rejected pool enemy now enters through the authentic recruited-party route',()=>{
  const g=fresh();g.run(`currentEncounterPool=()=>[ENEMY_TEMPLATE_REGISTRY.enemy_crypt_fiend];
    Math.random=(()=>{const tape=[0,0.5];return ()=>{capabilityRolls++;return tape.shift();};})();startCombat();`);
  assert.equal(g.run('canonicalPartyCombat.isActive()'),true);assert.equal(g.run('combat.active'),false);
  assert.deepEqual(J(g,'canonicalPartyCombat.getView().enemies.map(e=>e.id)'),['enemy_crypt_fiend']);
  assert.equal(g.run('capabilityRolls'),2);
});

test('a future registered ordinary template is judged by capabilities rather than identity',()=>{
  const g=fresh();g.run(`var futureOrdinary={id:'enemy_future_ordinary',name:'Future Ordinary',hp:10,maxHp:10,atk:3,def:1,spd:4,xp:2,goldMin:0,goldMax:1};
    ENEMY_TEMPLATE_REGISTRY.enemy_future_ordinary=futureOrdinary;`);
  assert.equal(g.run('canonicalEnemyCompatibility(futureOrdinary).compatible'),true);
  assert.deepEqual(J(g,'canonicalPartyCombat.prepareEnemySide(["enemy_future_ordinary"]).ids'),['enemy_future_ordinary']);
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT,'combat.js'),'utf8'),/PARTY_ATTACK_TEMPLATE_IDS/);
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT,'enemy-capabilities.js'),'utf8'),/partyCompatible\s*:/);
});

test('all special and scripted templates reject with every exact unsupported capability',()=>{
  const g=fresh();
  for(const [id,expected] of Object.entries({...SPECIAL,...SCRIPTED})){
    const compatibility=J(g,'canonicalEnemyCompatibility(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'])');
    if(SCRIPTED_SUPPORTED.has(id)){
      assert.equal(compatibility.compatible,true,id);assert.deepEqual(compatibility.unsupported,[],id);
      assert.deepEqual(J(g,'canonicalPartyCombat.prepareEnemySide(['+JSON.stringify(id)+']).ids'),[id]);
      assert.throws(()=>g.run('canonicalPartyCombat.prepare({enemies:['+JSON.stringify(id)+'],escape:"blocked"})'),/scripted lifecycle owner/,id);
    }else{
      assert.equal(compatibility.compatible,false,id);assert.deepEqual(compatibility.unsupported,expected,id);
      assert.throws(()=>g.run('canonicalPartyCombat.prepareEnemySide(['+JSON.stringify(id)+'])'),
        error=>expected.every(capability=>error.message.includes(capability)),id);
    }
  }
  assert.equal(g.run('capabilityRolls'),0);
});

test('unknown, missing, mutable and malformed capability information fails closed',()=>{
  const g=fresh();
  assert.throws(()=>g.run(`validateEnemyCapabilityMetadata(Object.freeze({templateId:'enemy_future',capabilities:Object.freeze(['teleport'])}))`),/unknown capability teleport/);
  assert.throws(()=>g.run(`validateEnemyCapabilityMetadata(Object.freeze({templateId:'enemy_future',capabilities:['basic_attack']}))`),/frozen dense array/);
  assert.throws(()=>g.run(`validateEnemyCapabilityMetadata(Object.freeze({templateId:'enemy_future',capabilities:Object.freeze(['basic_attack','basic_attack'])}))`),/duplicate capability/);
  assert.throws(()=>g.run(`validateEnemyCapabilityMetadata(Object.create({templateId:'enemy_future',capabilities:Object.freeze([])}))`),/plain record/);
  g.run(`ENEMY_TEMPLATE_REGISTRY.enemy_future_unknown={id:'enemy_future_unknown',name:'Unknown',hp:10,maxHp:10,atk:1,def:1,spd:1,xp:1,goldMin:0,goldMax:0,teleportChance:1};
    ENEMY_TEMPLATE_REGISTRY.enemy_future_missing={id:'enemy_future_missing',name:'Missing'};
    ENEMY_TEMPLATE_REGISTRY.enemy_future_malformed={id:'enemy_future_malformed',name:'Malformed',hp:10,maxHp:10,atk:1,def:1,spd:1,xp:1,goldMin:0,goldMax:0,defendChance:2};`);
  assert.throws(()=>g.run('canonicalPartyCombat.prepareEnemySide(["enemy_future_unknown"])'),/unaudited template field teleportChance/);
  assert.throws(()=>g.run('canonicalPartyCombat.prepareEnemySide(["enemy_future_missing"])'),/missing ordinary template field/);
  assert.throws(()=>g.run('canonicalPartyCombat.prepareEnemySide(["enemy_future_malformed"])'),/malformed capability field defendChance/);
});

test('unsupported preparation is atomic before RNG, identities and live state',()=>{
  for(const id of Object.keys({...SPECIAL,...SCRIPTED})){
    const g=fresh(),before=state(g),rolls=g.run('capabilityRolls');
    assert.throws(()=>g.run('canonicalPartyCombat.enter({enemies:['+JSON.stringify(id)+'],escape:"fastest_living"})'),/Unsupported canonical enemy capabilities|scripted lifecycle owner/);
    assert.equal(state(g),before,id);assert.equal(g.run('capabilityRolls'),rolls,id);
  }
});

test('existing compatible IDs remain capability-identical and boss locking stays metadata-driven',()=>{
  const g=fresh(),previous=['enemy_marsh_wisp','enemy_briar_hound','enemy_marsh_wisp_early','enemy_briar_hound_early',
    'enemy_reed_grappler','enemy_silt_lurker','enemy_marsh_wisp_sluice_top','enemy_sluice_slime','enemy_mulholland'];
  for(const id of previous){const c=J(g,'canonicalEnemyCompatibility(ENEMY_TEMPLATE_REGISTRY['+JSON.stringify(id)+'])');
    assert.equal(c.compatible,true,id);assert.deepEqual(c.capabilities,id==='enemy_mulholland'?[...BASE,'boss_escape_lock']:BASE,id);}
  assert.equal(g.run('ENEMY_TEMPLATE_REGISTRY.enemy_mulholland.isBoss'),true);
  assert.equal(g.run('canonicalPartyCombat.prepare({enemies:["enemy_mulholland"],escape:"fastest_living"}).enemySide.templates[0].isBoss'),true);
});

test('ordinary one-on-one attacks retain the established production damage arithmetic',()=>{
  const g=fresh(1,true);g.run(`canonicalPartyCombat.enter({enemies:['enemy_crypt_fiend'],escape:'blocked'});
    canonicalPartyCombat.handleInput('confirm');canonicalPartyCombat.handleInput('confirm');
    var arithmeticTape=[0,0.5,0.99,0.99,0.5,0.99,0.99],arithmeticUsed=[];
    Math.random=()=>{const v=arithmeticTape[arithmeticUsed.length];arithmeticUsed.push(v);return v;};
    canonicalPartyCombat.handleInput('confirm');`);
  const event=J(g,'__capabilityResult.events.find(e=>e.type==="attack"&&e.side==="ally")');
  const expected=J(g,'attackDamageNumbers(combatPlayerState.getView().members[0].atk,combat.enemies[0].def,1,false)');
  assert.equal(event.attemptedDamage,expected.dmg);assert.equal(event.critical,false);assert.equal(event.evaded,false);
  assert.equal(event.appliedDamage,expected.dmg);assert.deepEqual(J(g,'arithmeticUsed'),[0,0.5,0.99,0.99,0.5,0.99,0.99]);
});

test('authorized Observe actors advance only selected duplicate runtime identities and labels remain stable',()=>{
  const g=fresh(3);g.run(`canonicalPartyCombat.enter({enemies:['enemy_crypt_fiend','enemy_crypt_fiend','enemy_crypt_fiend'],escape:'blocked'});`);
  function chooseObserve(){let limit=0;while(g.run('canonicalPartyCombat.getView().selectedCommand')!=='observe'){
    assert.ok(limit++<6);g.run("canonicalPartyCombat.handleInput('right')");}g.run("canonicalPartyCombat.handleInput('confirm')");}
  function chooseSlot(slot){let limit=0;while(g.run('canonicalPartyCombat.getView().selectedTargetInstanceId')!==g.run('canonicalPartyCombat.getView().enemies['+slot+'].instanceId')){
    assert.ok(limit++<4);g.run("canonicalPartyCombat.handleInput('right')");}g.run("canonicalPartyCombat.handleInput('confirm')");}
  chooseObserve();chooseSlot(1);g.run("canonicalPartyCombat.handleInput('confirm');canonicalPartyCombat.handleInput('confirm')");chooseObserve();chooseSlot(2);
  g.run(`Math.random=()=>0;canonicalPartyCombat.handleInput('confirm')`);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.observeCount)'),[0,1,1]);
  assert.deepEqual(J(g,'partyBattleLayout(canonicalPartyCombat.getView()).enemies.map(e=>e.label)'),['Crypt Fiend A','Crypt Fiend B','Crypt Fiend C']);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.slot)'),[0,1,2]);
});

test('legacy flat-pool selection, pool membership and RNG consumption remain unchanged',()=>{
  const g=fresh(),before=J(g,'ENEMY_TEMPLATE_POOLS.map(p=>p.templates.map(t=>t.id))');
  assert.equal(g.run('ENEMY_TEMPLATE_POOLS.every(p=>p.templates.every(t=>!Object.hasOwn(t,"enemies")))'),true);
  g.run(`var selectionCalls=0;Math.random=()=>{selectionCalls++;return .5};var selected=encounterFormations.select(ENEMY_TEMPLATE_POOLS[0].templates);`);
  assert.equal(g.run('selectionCalls'),1);assert.deepEqual(J(g,'ENEMY_TEMPLATE_POOLS.map(p=>p.templates.map(t=>t.id))'),before);
  assert.equal(g.run('selected.enemies.length'),1);assert.equal(g.run('encounterFormations.normalizePool(ENEMY_TEMPLATE_POOLS[0].templates).mode'),'legacy_flat');
});

test('Eastern Fens examples retain structural validity without production registration or routing',()=>{
  const g=fresh();
  for(const [id,ids] of [['formation_mire_toad_three',Array(3).fill('enemy_mire_toad_male')],
    ['formation_waspthra_one',['enemy_waspthra']],['formation_botfly_waspthra',['enemy_botfly','enemy_botfly','enemy_waspthra']]]){
    g.run('var eastern=Object.freeze({id:'+JSON.stringify(id)+',enemies:Object.freeze('+JSON.stringify(ids)+'),weight:1})');
    assert.deepEqual(J(g,'encounterFormations.validateDefinition(eastern).enemies'),ids);
  }
  assert.equal(g.run('canonicalPartyCombat.prepareEnemySide(["enemy_mire_toad_male","enemy_mire_toad_male","enemy_mire_toad_male"]).templates.length'),3);
  assert.equal(g.run('Object.hasOwn(ENEMY_TEMPLATE_REGISTRY,"enemy_waspthra")'),false);
  assert.equal(g.run('Object.hasOwn(ENEMY_TEMPLATE_REGISTRY,"enemy_botfly")'),false);
});

test('singleton routing, Pass 2 matrix, Receiver ownership and save contract remain separate',()=>{
  const solo=fresh(1);solo.run(`currentEncounterPool=()=>[ENEMY_TEMPLATE_REGISTRY.enemy_crypt_fiend];Math.random=()=>.5;startCombat();`);
  assert.equal(solo.run('combat.active'),true);assert.equal(solo.run('combat.mode'),'single');assert.equal(solo.run('canonicalPartyCombat.isActive()'),false);
  for(const allies of [1,2,3])for(const enemies of [1,2,3]){
    const g=fresh(allies),ids=Array(enemies).fill('enemy_crypt_fiend');
    assert.equal(g.run('canonicalPartyCombat.prepare({enemies:'+JSON.stringify(ids)+',escape:"blocked"}).playerSide.members.length'),allies);
    assert.equal(g.run('canonicalPartyCombat.prepare({enemies:'+JSON.stringify(ids)+',escape:"blocked"}).enemySide.ids.length'),enemies);
  }
  const receiver=fresh();assert.throws(()=>receiver.run('canonicalPartyCombat.prepareEnemySide(["enemy_gallery_receiver"])'),/receiver_coordination/);
  assert.equal(receiver.run('SAVE_VERSION'),5);assert.equal(receiver.run('saveGame()'),true);
});

test('source authority has no manually curated canonical ordinary-enemy ID set',()=>{
  const production=fs.readdirSync(ROOT).filter(file=>file.endsWith('.js')).map(file=>[file,fs.readFileSync(path.join(ROOT,file),'utf8')]);
  for(const [file,source] of production)assert.doesNotMatch(source,/PARTY_ATTACK_TEMPLATE_IDS/,file);
  const combat=fs.readFileSync(path.join(ROOT,'combat.js'),'utf8');
  assert.match(combat,/requireCanonicalEnemyCapabilities\(template\)/);
  assert.match(combat,/FORMATION_STATE_TEMPLATE_IDS/); // Legacy Formation/Receiver authority remains intentionally separate.
  const capabilitySource=fs.readFileSync(path.join(ROOT,'enemy-capabilities.js'),'utf8');
  for(const id of ORDINARY.filter(id=>!['enemy_shade_wraith','enemy_void_walker','enemy_fen_witch','enemy_corpse_slug'].includes(id)))
    assert.doesNotMatch(capabilitySource,new RegExp("['\"]"+id+"['\"]\\s*[,\]]"),id);
});

module.exports={name:'enemy capability migration: complete registry audit, ordinary formations and fail-closed specials',run(){
  for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
  console.log('  '+checks.length+' enemy capability migration checks passed');
}};
