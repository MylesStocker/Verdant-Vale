'use strict';
const assert=require('assert/strict'),{createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(){const g=createContext();g.press('Enter');g.press('Enter');g.run(`MainQuest=5;persistentParty.joinEsla();dialogue.open=false;choice.open=false;
 Math=Object.create(Math);var rolls=0;Math.random=()=>{rolls++;throw Error('unexpected RNG')};`);return g;}
function state(g){return g.run(`JSON.stringify({stats,party:persistentParty.serialize(),player,day,tick,location:snapshotLocationState(),regional:regionalWorldPosition(),
 combat:combatPlayerState.getView(),canonical:canonicalPartyCombat.getView(),water:waterTravelController.getView(),identities:combatEnemyInstanceSequence,rolls})`);}

test('public combat preparation cannot steal an active ferry owner',()=>{
 const g=fresh();g.run(`placeAtLocation('EAST_CAUSEWAY_MAP',10.5*TILE,8.5*TILE)`);assert.equal(g.run('crossCausewayFerry()'),true);
 for(const call of [`canonicalPartyCombat.enter({enemies:['enemy_marsh_wisp'],escape:'fastest_living'})`,
   `canonicalPartyCombat.prepare({enemies:['enemy_marsh_wisp'],escape:'fastest_living'})`,`startCombat()`]){
   const before=state(g);assert.throws(()=>g.run(call));assert.equal(state(g),before,call);
 }
 const before=state(g);g.run('toggleMenu();toggleDebugMenu()');assert.equal(g.run('menu.open||debugMenu.open'),false);assert.equal(state(g),before);assert.equal(g.run('partyCombatLab.openMenu()'),false);assert.equal(state(g),before);
 assert.equal(g.run('startFishing(1)'),false);assert.equal(state(g),before);
 assert.throws(()=>g.run(`persistentParty.awardRewards({id:'during_travel',xp:0,gold:1,items:[]})`));assert.equal(state(g),before);
 g.run('debugMenu.open=true');assert.equal(g.run('formationCombatLab.open()'),false);g.run('debugMenu.open=false');assert.equal(state(g),before);
 assert.equal(g.run('rolls'),0);
});

test('ordinary receipts stay bounded, reject stale callbacks and preserve named receipts',()=>{
 const g=fresh();g.run(`persistentParty.awardRewards({id:'story_test_receipt',xp:0,gold:0,items:[]});
 for(let i=0;i<1000;i++)persistentParty.awardRewards({id:persistentParty.nextCanonicalRewardId(),xp:0,gold:1,items:[]})`);
 const receipts=J(g,'persistentParty.serialize().rewards');assert.equal(receipts.length,2);assert.equal(receipts[1].id,'canonical_encounter_1000');
 assert.equal(g.run('persistentParty.nextCanonicalRewardId()'),'canonical_encounter_1001');
 const before=state(g);assert.equal(g.run(`persistentParty.awardRewards({id:'canonical_encounter_1000',xp:0,gold:1,items:[]}).applied`),false);
 for(const id of ['canonical_encounter_1','canonical_encounter_999'])assert.throws(()=>g.run(`persistentParty.awardRewards({id:'${id}',xp:0,gold:1,items:[]})`));
 assert.equal(state(g),before);assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
 assert.deepEqual(J(g,'persistentParty.serialize().rewards'),receipts);assert.equal(g.run('SAVE_VERSION'),5);
});

test('existing version-5 receipt histories load compactly without replaying awards',()=>{
 const g=fresh();assert.equal(g.run('saveGame()'),true);
 g.run(`var oldSave=JSON.parse(localStorage.getItem('verdantVale_save'));oldSave.party.rewards=
 Array.from({length:150},(_,i)=>({id:'canonical_encounter_'+(i+1),xp:0,gold:0,items:[]}));
 oldSave.party.rewards.push({id:'story_old',xp:0,gold:0,items:[]});localStorage.setItem('verdantVale_save',JSON.stringify(oldSave));`);
 const gold=g.run('stats.gold');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('stats.gold'),gold);
 assert.deepEqual(J(g,'persistentParty.serialize().rewards.map(r=>r.id)'),['canonical_encounter_150','story_old']);
 assert.equal(g.run('persistentParty.nextCanonicalRewardId()'),'canonical_encounter_151');
 g.run(`oldSave.party.rewards[0].id='canonical_encounter_9007199254740992';localStorage.setItem('verdantVale_save',JSON.stringify(oldSave))`);
 const before=state(g);assert.equal(g.run('loadGame()'),false);assert.equal(state(g),before);
});

test('ferry duration uses elapsed presentation time at multiple update rates',()=>{
 for(const hz of [20,30,60,120]){
  const g=fresh();g.run(`placeAtLocation('EAST_CAUSEWAY_MAP',10.5*TILE,8.5*TILE);crossCausewayFerry()`);
  const seconds=g.run('WATER_TRAVEL_ROUTES.causeway_ferry.durationFrames*MS_PER_FRAME/1000');
  const steps=Math.ceil(seconds*hz-1e-8);for(let i=1;i<steps;i++){g.run('update(1/'+hz+')');assert.equal(g.run('mapIdForRef(activeMap)'),'EAST_CAUSEWAY_MAP');}
  g.run('update(1/'+hz+')');assert.equal(g.run('mapIdForRef(activeMap)'),'EASTERN_BANK_MAP');assert.equal(g.run('rolls'),0);
 }
});

test('Quickbloom rendering never ticks or unlocks animation; updates use elapsed time',()=>{
 for(const hz of [30,60,120]){
  const g=fresh();g.run(`var v={label:'test',frameIndex:1,playbackFrame:{completedRounds:0,currentEvent:{type:'resonance',techniqueId:'quickbloom',actorId:'esla',targetId:'lely'}},party:[{instanceId:'lely',slot:0}]};
 partyBattleQuickbloomAnimation.update(v,0);`);
  const before=state(g),visual=g.run('JSON.stringify(partyBattleQuickbloomAnimation.getView())');
  g.run('for(let i=0;i<100;i++)partyBattleQuickbloomAnimation.draw(v)');assert.equal(state(g),before);assert.equal(g.run('JSON.stringify(partyBattleQuickbloomAnimation.getView())'),visual);
  const duration=g.run('QUICKBLOOM_ANIMATION_FRAMES*MS_PER_FRAME/1000');
  g.run('for(let i=0;i<'+Math.round(duration*hz)+';i++)partyBattleQuickbloomAnimation.update(v,1/'+hz+')');
  assert.equal(g.run('partyBattleQuickbloomAnimation.blocksAdvance(v)'),false);assert.equal(g.run('rolls'),0);
 }
});

test('the real frame loop does not double-count its cap remainder as presentation time',()=>{
 const g=fresh();g.run(`var presentationElapsed=0,simulationElapsed=0;update=(dt,pdt)=>{presentationElapsed+=pdt;simulationElapsed+=dt};render=()=>{};
 lastTime=0;lastPresentationTime=0;for(let t=10;t<=1000;t+=10)loop(t);`);
 assert.ok(Math.abs(g.run('presentationElapsed')-1)<1e-8);
 assert.ok(g.run('simulationElapsed')>=g.run('presentationElapsed'));
});

test('headless Canvas fails on unknown APIs instead of silently swallowing them',()=>{
 const g=fresh();assert.throws(()=>g.run('ctx.notARealCanvasMethod()'),/not a function/);
});

test('a no-op ferry and a corrupt placement cannot pass the transition audit',()=>{
 const harness=require('../harness'),original=harness.createContext,auditFile=require.resolve('../transition-audit');
 const previous=require.cache[auditFile];
 try{
  for(const mutation of ['crossCausewayFerry=()=>false;',`var realPlace=placeAtLocation;placeAtLocation=function(id,x,y){return realPlace('MAP',8*TILE,8*TILE)};`]){
   harness.createContext=()=>{const g=original();g.run(mutation);return g;};delete require.cache[auditFile];
   const audit=require('../transition-audit');assert.ok(audit.results.some(r=>r.verdict==='NO_COMMITTED_TRANSITION'||r.verdict==='PLACEMENT_MISMATCH'));
  }
 }finally{harness.createContext=original;delete require.cache[auditFile];if(previous)require.cache[auditFile]=previous;}
});

test('validation has no errors or unreviewed warning debt',()=>{
 const g=createContext();g.run('console={...console,log:()=>{},warn:()=>{}}');const result=J(g,'validateGameData()');
 const baseline=require('../validation-warning-baseline.json');assert.equal(result.errors,0);
 for(const warning of result.warningList)assert.ok(baseline.some(w=>w.group===warning.group&&w.message===warning.message&&w.reason),JSON.stringify(warning));
});

module.exports={name:'Shared runtime ownership, bounded receipts, elapsed animations and effective audit probes',run(){for(const t of checks){try{t.run();}catch(e){e.message=t.name+': '+e.message;throw e;}}console.log('  '+checks.length+' runtime maintenance checks passed');}};
