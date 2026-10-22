'use strict';
const assert = require('assert/strict');
const { createContext } = require('../harness');
const checks = [];
const test = (name, run) => checks.push({ name, run });
const J = (g, source) => JSON.parse(g.run('JSON.stringify(' + source + ')'));
function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run(`MainQuest=5;persistentParty.joinEsla();syncQuestFlagsToWindow();
    var warnings=[];console=Object.create(console);console.warn=(...args)=>warnings.push(args);
    Math=Object.create(Math);var rolls=0;Math.random=()=>{rolls++;throw Error('unexpected RNG')};`);
  assert.equal(g.run('saveGame()'), true);
  return g;
}
function snapshot(g) {
  return g.run(`JSON.stringify({stats,party:persistentParty.serialize(),statusEffects,slitherSpd,
    flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get(),window[b.key]]),day,travellerPresent,
    homeGold:HOUSE_DATA.player_house.chest.gold,player,location:snapshotLocationState(),regional:regionalWorldPosition(),
    pickups:collectedPickupIdsForSave(),chests:openedChestIdsForSave(),
    dialogue,choice,menu,identities:combatEnemyInstanceSequence,rolls})`);
}
function reject(g, mutate) {
  g.run(`var candidate=JSON.parse(localStorage.getItem('verdantVale_save'));${mutate}
    localStorage.setItem('verdantVale_save',JSON.stringify(candidate));`);
  const before = snapshot(g), bytes = g.run("localStorage.getItem('verdantVale_save')");
  assert.equal(g.run('loadGame()'), false, mutate);
  assert.equal(snapshot(g), before, 'all running authorities unchanged: ' + mutate);
  assert.equal(g.run("localStorage.getItem('verdantVale_save')"), bytes, 'saved bytes unchanged');
}

test('every bound value is checked without limiting quest stages or counters', () => {
  const g = fresh(), original = g.run("localStorage.getItem('verdantVale_save')");
  for (const binding of J(g, 'QUEST_FLAG_BINDINGS.map(b=>({key:b.key,default:b.default}))')) {
    g.run(`localStorage.setItem('verdantVale_save',${JSON.stringify(original)})`);
    const value = binding.default === null ? [] : null;
    reject(g, `candidate[${JSON.stringify(binding.key)}]=${JSON.stringify(value)};`);
  }
  for (const value of [-1, 1.25, 'broken', Number.MAX_SAFE_INTEGER + 1]) {
    g.run(`localStorage.setItem('verdantVale_save',${JSON.stringify(original)})`);
    reject(g, `candidate.letter_quest_stage=${JSON.stringify(value)};`);
  }
  // A future counter works through the same binding contract, with no second
  // name list or maximum derived from today's story/content count.
  g.run(`QUEST_FLAG_BINDINGS.push(win('test_future_counter',0));
    window.test_future_counter=Number.MAX_SAFE_INTEGER-1;`);
  assert.equal(g.run('saveGame()'), true);
  g.run('window.test_future_counter=0');
  assert.equal(g.run('loadGame()'), true);
  assert.equal(g.run('window.test_future_counter'), Number.MAX_SAFE_INTEGER-1);
  assert.equal(g.run('rolls'), 0);
});

test('world fields reject malformed input before flags, party or location change', () => {
  const g = fresh(), original = g.run("localStorage.getItem('verdantVale_save')");
  const cases = {
    day: ['broken', null, 0, -1, 1.5, Number.MAX_SAFE_INTEGER],
    travellerPresent: ['true', 1, null], homeChestGold: [-1, '10', 0.5],
    sailorBrawlFightDay: [-2, 'yesterday'], bossKnockedDown: [1],
    abandonedAptDresserLooted: ['false'], mirethystRewarded: [1],
    dilemma_voss: [{}, 3], collectedPickupIds: [true, [123]], openedChestIds: ['all'],
  };
  for (const [key, values] of Object.entries(cases)) for (const value of values) {
    g.run(`localStorage.setItem('verdantVale_save',${JSON.stringify(original)})`);
    reject(g, `candidate[${JSON.stringify(key)}]=${JSON.stringify(value)};`);
  }
  g.run(`localStorage.setItem('verdantVale_save',${JSON.stringify(original)});day=-1;`);
  assert.equal(g.run('saveGame()'), false, 'bad live world state cannot overwrite a good save');
  assert.equal(g.run("localStorage.getItem('verdantVale_save')"), original);
});

test('missing bindings and unknown stable pickup IDs keep their existing contracts', () => {
  const g = fresh();
  g.run(`var candidate=JSON.parse(localStorage.getItem('verdantVale_save'));
    delete candidate.letter_quest_stage;delete candidate.wine_quest_gift;
    candidate.collectedPickupIds.push('retired_pickup');candidate.openedChestIds.push('retired_chest');
    localStorage.setItem('verdantVale_save',JSON.stringify(candidate));letter_quest_stage=99;wine_quest_gift='case';`);
  assert.equal(g.run('loadGame()'), true);
  assert.equal(g.run('letter_quest_stage'), 0); assert.equal(g.run('wine_quest_gift'), null);
  assert.equal(g.run('saveGame()'), true);
  const saved = J(g, "JSON.parse(localStorage.getItem('verdantVale_save'))");
  assert.ok(saved.collectedPickupIds.includes('retired_pickup'));
  assert.ok(saved.openedChestIds.includes('retired_chest'));
});

test('unknown inventory/equipment and extra metadata reject atomically', () => {
  const g = fresh(), original = g.run("localStorage.getItem('verdantVale_save')");
  for (const mutate of [
    "candidate.stats.items.push({name:'not registered'})",
    "candidate.stats.items.push({...ITEM_REGISTRY.Potion,customNote:'retained'})",
    "candidate.stats.weapon={name:'not registered'}",
    "candidate.stats.weapon={...ITEM_REGISTRY['Iron Sword'],customNote:'retained'}",
  ]) {
    g.run(`localStorage.setItem('verdantVale_save',${JSON.stringify(original)})`);
    reject(g, mutate);
  }
  g.run('var getterReads=0;var itemWithGetter={name:"Potion"};Object.defineProperty(itemWithGetter,"heals",{get(){getterReads++;return 20}});');
  assert.throws(() => g.run('rehydrateItem(itemWithGetter)'), /Unsupported/);
  assert.equal(g.run('getterReads'), 0);
});

test('accepted items normalize to registry definitions and immediately prepare combat', () => {
  const g = fresh();
  g.run(`var candidate=JSON.parse(localStorage.getItem('verdantVale_save'));
    candidate.stats.weapon={name:'Iron Sword',bonus:999};
    candidate.stats.shield={name:'Schilling',type:'accessory'};
    candidate.stats.accessory={name:'Void Shard',type:'accessory',bonus:999};
    candidate.stats.items.push({name:'Potion',heals:1},{name:'Void Shard',bonus:999});
    localStorage.setItem('verdantVale_save',JSON.stringify(candidate));`);
  assert.equal(g.run('loadGame()'), true);
  assert.deepEqual(J(g, 'stats.weapon'), J(g, "ITEM_REGISTRY['Iron Sword']"));
  assert.equal(g.run('stats.shield'), null); assert.equal(g.run('stats.accessory'), null);
  assert.equal(g.run("stats.items.filter(i=>i.name==='Void Shard').length"), 2);
  assert.equal(g.run("stats.items.every(i=>JSON.stringify(i)===JSON.stringify(ITEM_REGISTRY[i.name]))"), true);
  assert.doesNotThrow(() => g.run("canonicalPartyCombat.prepare({enemies:['enemy_stone_crawler'],escape:'fastest_living'})"));
  assert.equal(g.run('combatEnemyInstanceSequence'), 0); assert.equal(g.run('rolls'), 0);
});

test('inventory quantity and registry growth do not require validator changes', () => {
  const g = fresh();
  g.run(`ITEM_REGISTRY.Potion.questItem=true;
    ITEM_REGISTRY['Future registered gear']={name:'Future registered gear',type:'weapon',bonus:1,price:1};
    stats.items=Array.from({length:Object.keys(ITEM_REGISTRY).length*4},()=>createItem('Potion'));
    stats.weapon=createItem('Future registered gear');`);
  const count = g.run('stats.items.length');
  assert.equal(g.run('saveGame()'), true); assert.equal(g.run('loadGame()'), true);
  assert.equal(g.run('stats.items.length'), count);
  assert.equal(g.run('stats.items.every(i=>i.questItem===true)'), true);
  assert.doesNotThrow(() => g.run("canonicalPartyCombat.prepare({enemies:['enemy_stone_crawler'],escape:'fastest_living'})"));
});

test('storage write failure retains bytes and reports failure, then permits retry', () => {
  const g = fresh(), original = g.run("localStorage.getItem('verdantVale_save')");
  const before = J(g, '{stats,party:persistentParty.serialize(),day}');
  g.run('var realWrite=localStorage.setItem;localStorage.setItem=()=>{throw Error("QuotaExceededError")};');
  assert.equal(g.run('saveGame()'), false);
  assert.equal(g.run("localStorage.getItem('verdantVale_save')"), original);
  assert.deepEqual(J(g, '{stats,party:persistentParty.serialize(),day}'), before);
  assert.equal(g.run('menu.saveStatus'), 'failed');
  g.run('menu.open=true;var labels=[];ctx.fillText=(text)=>labels.push(text);render();');
  assert.ok(J(g, 'labels').some(text=>text.includes('Save failed')));
  assert.equal(g.run('gameRuntimeFailure.isActive()'), false);
  g.run('localStorage.setItem=realWrite');
  assert.equal(g.run('saveGame()'), true); assert.equal(g.run('menu.saveStatus'), 'saved');
});

test('storage read failures cannot crash Load or rendering, including denied storage getter', () => {
  const g = fresh(), before = J(g, '{stats,party:persistentParty.serialize(),day}');
  g.run('var realStorage=localStorage;Object.defineProperty(window,"localStorage",{configurable:true,get(){throw Error("SecurityError")}});');
  assert.equal(g.run('loadGame()'), false);
  assert.equal(g.run('menu.loadStatus'), 'unavailable');
  assert.deepEqual(J(g, '{stats,party:persistentParty.serialize(),day}'), before);
  g.run('menu.open=true;menu.screen="loadConfirm";menu.loadCursor=0;');
  assert.doesNotThrow(() => g.press('Enter'));
  assert.equal(g.run('menu.loadStatus'), 'unavailable');
  g.run('var labels=[];ctx.fillText=(text)=>labels.push(text);render();');
  assert.ok(J(g, 'labels').includes('Save storage unavailable'));
  assert.equal(g.run('gameRuntimeFailure.isActive()'), false);
  g.run('Object.defineProperty(window,"localStorage",{configurable:true,writable:true,value:realStorage})');
  assert.equal(g.run('loadGame()'), true);
});

for (const phase of ['update','render']) test(phase + ' failure freezes gameplay, preserves diagnostics and keeps RAF alive', () => {
  const g = fresh(), original = g.run("localStorage.getItem('verdantVale_save')");
  g.run(`var failures=[];console.error=(...args)=>failures.push(args);
    var originalUpdate=update,originalRender=render,calls=0,scheduled=0;
    requestAnimationFrame=()=>scheduled++;
    ${phase}=()=>{calls++;throw Error('injected ${phase} fault')};loop(MS_PER_FRAME*2);`);
  assert.equal(g.run('gameRuntimeFailure.isActive()'), true);
  assert.equal(g.run('gameRuntimeFailure.getDiagnostic().phase'), phase);
  assert.equal(g.run('scheduled'), 1);
  const before = snapshot(g);
  g.run('loop(MS_PER_FRAME*4);loop(MS_PER_FRAME*6);');
  assert.equal(g.run('calls'), 1, 'never retry partially applied operation');
  assert.equal(g.run('scheduled'), 3); assert.equal(g.run('failures.length'), 1);
  assert.equal(snapshot(g), before);
  for (const key of ['ArrowRight','Enter','m','`']) g.press(key);
  let reloadBlocked = false;
  g.keydown('r', { ctrlKey: true, preventDefault: () => { reloadBlocked = true; } });
  g.keydown('r', { metaKey: true, preventDefault: () => { reloadBlocked = true; } });
  g.keydown('F5', { preventDefault: () => { reloadBlocked = true; } });
  assert.equal(reloadBlocked, false, 'browser reload remains the available recovery route');
  g.run('originalUpdate();');
  assert.equal(snapshot(g), before);
  assert.equal(g.run('canSaveHere()'), false); assert.equal(g.run('saveGame()'), false);
  assert.equal(g.run('loadGame()'), false);
  assert.equal(g.run("localStorage.getItem('verdantVale_save')"), original);
  // A broken Canvas fallback must not replace the first error or stop RAF.
  g.run('ctx.fillRect=()=>{throw Error("context lost")};loop(MS_PER_FRAME*8);');
  assert.equal(g.run('scheduled'), 4);
  assert.equal(g.run('gameRuntimeFailure.getDiagnostic().error.message'), 'injected ' + phase + ' fault');
  assert.ok(g.run('titleEl.textContent').includes('Reload'));
});

test('normal loop and fault screen use current canvas geometry; no new save fields', () => {
  const g = fresh(), keys = J(g, "Object.keys(JSON.parse(localStorage.getItem('verdantVale_save'))).sort()");
  g.run('var updateCalls=0,renderCalls=0,scheduled=0;update=()=>updateCalls++;render=()=>renderCalls++;requestAnimationFrame=()=>scheduled++;loop(MS_PER_FRAME*2);');
  assert.equal(g.run('updateCalls'), 1); assert.equal(g.run('renderCalls'), 1); assert.equal(g.run('scheduled'), 1);
  for (const [width,height] of [[512,480],[1024,960],[768,600]]) {
    g.run(`canvas.width=${width};canvas.height=${height};var rects=[],texts=[];
      ctx.fillRect=(...args)=>rects.push(args);ctx.fillText=(...args)=>texts.push(args);gameRuntimeFailure.draw();`);
    assert.deepEqual(J(g, 'rects[0]'), [0,0,width,height]);
    assert.ok(J(g, 'texts').every(([,x,y,max])=>x===width/2&&y>0&&y<height&&max<width));
  }
  assert.equal(g.run('saveGame()'), true);
  assert.deepEqual(J(g, "Object.keys(JSON.parse(localStorage.getItem('verdantVale_save'))).sort()"), keys);
  assert.equal(g.run('SAVE_VERSION'), 5);
  assert.equal(g.run('rolls'), 0);
});

module.exports = { name: 'Save boundary validation, registry inventory, storage failures and runtime fail-stop', run() {
  for (const check of checks) { try { check.run(); } catch (error) { error.message=check.name+': '+error.message;throw error; } }
  console.log('  '+checks.length+' save/runtime boundary checks passed');
}};
