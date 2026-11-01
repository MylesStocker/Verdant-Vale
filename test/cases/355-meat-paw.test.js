'use strict';
const assert=require('assert/strict'),fs=require('fs');
const {createContext}=require('../harness');
const {local,fight}=require('./333-struck-entry-expedition.test');
const {J,dismiss,place}=require('./301-mornay-manifest.test');
const {command,input,view,acknowledge}=require('./340-peat-maw-swallow.test');
const {graph}=require('./317-mainland-navigation.test');
function fresh(){
 const read=fs.readFileSync;let g;
 try{fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);if(String(file).endsWith('/combat.js'))s=s.replace("stage='playback';const playback=combatPlayerState.createRoundPlayback(result)","stage='playback';window.__bearResult=result;const playback=combatPlayerState.createRoundPlayback(result)");return s;};g=createContext();}finally{fs.readFileSync=read;}
 g.run("storyCheckpointLab.apply('mq7_lantern_house_ready');MainQuest=7;lantern_stage=8;lantern_wins=15;debugMode=true;Math=Object.create(Math);Math.random=()=>.5");return g;
}
function board(g){place(g,'MORNAY_SOUTH_UPPER_EAST_MAP',240,192);g.press('Enter');assert.equal(g.run('dialogue.open'),true);}
function round(g,type='attack'){while(view(g).phase==='awaiting_action')command(g,type);input(g,'confirm');return J(g,'__bearResult');}
function start(g){g.run('meat_paw_stage=1');local(g,'MAINLAND_C27R3_MAP',48,368);assert.ok(g.run("scriptedPartyEncounters.start('meat_paw')"));}
function save(g){assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');}
const checks=[],test=(name,run)=>checks.push({name,run});
test('board unlocks only after completed MQ7; decline, accept, stale callbacks and save defaults',()=>{
 const g=fresh();for(const stage of [0,2,7]){g.run(`lantern_stage=${stage}`);board(g);assert.doesNotMatch(J(g,'dialogue.pages').flat().join(' '),/Meat Paw/);dismiss(g);assert.equal(g.run('choice.open'),false);}
 g.run('lantern_stage=8');board(g);assert.match(J(g,'dialogue.pages').flat().join(' '),/5000 gold/);dismiss(g);g.press('ArrowDown');g.press('Enter');assert.equal(g.run('meat_paw_stage'),0);
 board(g);dismiss(g);const stale=g.run('choice.callbacks[0]');place(g,'MORNAY_WEST_GATE_MAP');stale();assert.equal(g.run('meat_paw_stage'),0);g.run('choice.open=false');
 board(g);dismiss(g);g.press('Enter');dismiss(g);assert.equal(g.run('meat_paw_stage'),1);save(g);assert.equal(g.run('meat_paw_stage'),1);
 const raw=g.run('localStorage.getItem("verdantVale_save")');for(const change of ['d.meat_paw_stage=4','d.meat_paw_stage=1.5','d.lantern_stage=7']){g.run('var d='+raw+';'+change+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');const before=g.run('JSON.stringify([stats,persistentParty.getView(),meat_paw_stage,lantern_stage])');assert.equal(g.run('loadGame()'),false);assert.equal(g.run('JSON.stringify([stats,persistentParty.getView(),meat_paw_stage,lantern_stage])'),before);}
 g.run('var d='+raw+';delete d.meat_paw_stage;localStorage.setItem("verdantVale_save",JSON.stringify(d))');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('meat_paw_stage'),0);assert.equal(g.run('SAVE_VERSION'),5);
});
test('existing grass is reachable; both movement modes ambush, block menus/save/motion, then fight; unaccepted visits safe',()=>{
 const g=fresh(),data=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})'),net=graph(data),seen=net.flood('EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP',7,4);
 assert.ok(seen[net.key('MAINLAND_C27R3_MAP',1,12)],'ordinary route to ambush');
 for(const legacy of [false,true])for(const accepted of [false,true]){
  const v=fresh();v.run(`forceLegacyRegionalView=${legacy};meat_paw_stage=${accepted?1:0}`);local(v,'MAINLAND_C27R3_MAP',48,432);v.hold('ArrowUp');v.frames(45);v.release('ArrowUp');
  assert.equal(v.run('meatPaw.isActive()'),accepted);if(!accepted)continue;
  const pos=J(v,'[player.x,player.y]');v.press('m');assert.equal(v.run('menu.open'),false);assert.equal(v.run('saveGame()'),false);v.hold('ArrowDown');v.frames(90);v.release('ArrowDown');assert.deepEqual(J(v,'[player.x,player.y]'),pos);assert.ok(J(v,'dialogue.pageSpeakers').includes('esla'));dismiss(v);assert.equal(v.run('canonicalPartyCombat.isActive()'),true);assert.equal(view(v).escapePolicy,'blocked');
 }
 const projected=fresh();projected.run('meat_paw_stage=1');local(projected,'MAINLAND_C27R3_MAP',48,432);projected.run('player.y=368');assert.equal(projected.run('meatPaw.eligible()'),false,'stale local projection cannot trigger a regional ambush');
 const load=fresh();load.run('meat_paw_stage=1');local(load,'MAINLAND_C27R3_MAP',48,368);save(load);load.frames(1);assert.equal(load.run('meatPaw.isActive()'),true,'load inside corridor triggers rather than bypasses ambush');
});
test('Paw and Claw use maximum HP and floors, Pounce fells one random living target, misses do nothing; replay rejects forgery',()=>{
 for(const [roll,name,maxHp,expected]of [[.15,'Paw',601,200],[.15,'Paw',120,50],[.5,'Claw',600,300],[.5,'Claw',120,100],[.9,'Pounce',600,400]]){
  const g=fresh();g.run(`stats.maxHp=${maxHp};stats.hp=${Math.min(400,maxHp)};stats.spd=1;stats.atk=1;Math.random=()=>${roll}`);
  // A real Fine Needlework absence makes this a canonical solo battle.
  place(g,'MORNAY_GATE_INN_MAP',240,432);g.run('fineNeedlework.accept()');dismiss(g);start(g);
  const r=round(g,'observe'),e=r.events.find(e=>e.type==='vital_strike');assert.equal(e.attackName,name);assert.equal(e.attemptedDamage,expected);assert.equal(e.evaded,false);assert.equal(e.hpAfter,Math.max(0,e.hpBefore-expected));
  g.run('var replay=combatPlayerState.createRoundPlayback(__bearResult);Math.random=()=>{throw Error("replay RNG")};');
  const before=g.run('JSON.stringify([stats,persistentParty.getView(),meat_paw_stage])');for(let i=0;i<g.run('replay.frameCount');i++)g.run(`combatPlayerState.projectRoundPlaybackFrame(replay,${i})`);assert.equal(g.run('JSON.stringify([stats,persistentParty.getView(),meat_paw_stage])'),before);
  for(const mutation of ['e.attemptedDamage=1','e.attackName="Bite"','e.evaded=!e.evaded','e.targetId="forged"','d.events.splice(d.events.indexOf(e),1)']){g.run('var d='+JSON.stringify(r)+';var e=d.events.find(e=>e.type==="vital_strike");'+mutation+';d=copyFormationData(d)');assert.throws(()=>g.run('combatPlayerState.createRoundPlayback(d)'));}
 }
 for(const rng of [.15,.9]){
  const g=fresh();g.run(`Math.random=()=>${rng};stats.atk=1;stats.hp=stats.maxHp=600`);start(g);const r=round(g),e=r.events.find(e=>e.type==='vital_strike');assert.equal(e.targetId,r.before.party[rng<.5?0:1].instanceId,'ordinary uniform target selection');assert.equal(r.events.filter(e=>e.type==='vital_strike').length,1);
 }
 for(const [rng,name]of [[.15,'Paw'],[.5,'Claw'],[.9,'Pounce']]){
  const g=fresh();place(g,'MORNAY_GATE_INN_MAP',240,432);g.run('fineNeedlework.accept()');dismiss(g);g.run(`stats.accessory=createItem('EvadeAll');Math.random=()=>${rng}`);start(g);const e=round(g,'observe').events.find(e=>e.type==='vital_strike');assert.equal(e.attackName,name);assert.equal(e.evaded,true);assert.equal(e.hpAfter,e.hpBefore);
 }
 const fallen=fresh();save(fallen);fallen.run('var saved=JSON.parse(localStorage.getItem("verdantVale_save"));saved.party.characters[0].hp=0;localStorage.setItem("verdantVale_save",JSON.stringify(saved));');assert.equal(fallen.run('loadGame()'),true);fallen.run('dialogue.open=false;Math.random=()=>.9');start(fallen);const strike=round(fallen).events.find(e=>e.type==='vital_strike');assert.equal(strike.targetId,view(fallen).party[0].instanceId,'Fallen partner never targeted');
 const miss=fresh();miss.run('Math.random=()=>0;stats.atk=1');start(miss);const e=round(miss).events.find(e=>e.type==='vital_strike');assert.equal(e.evaded,true);assert.equal(e.hpAfter,e.hpBefore);assert.equal(e.appliedDamage,0);
});
test('Run and Serpentsmoke cannot escape; defeat remains retryable, victory authenticates, board pays exactly once',()=>{
 const g=fresh();start(g);const r=round(g,'run');assert.equal(r.outcome,'ongoing');assert.ok(r.events.filter(e=>e.type==='run').every(e=>!e.allowed&&!e.success));assert.equal(g.run("itemAllowsEncounterEscape('Serpentsmoke',canonicalPartyCombat.getView().enemies)"),false);acknowledge(g);
 for(let i=0;i<5&&view(g).phase!=='defeat';i++){round(g,'run');acknowledge(g);}assert.equal(view(g).phase,'defeat');input(g,'confirm');assert.equal(g.run('meat_paw_stage'),1);dismiss(g);save(g);
 const v=fresh();v.run('stats.hp=stats.maxHp=1000;stats.atk=9999;stats.spd=100');const gold=v.run('stats.gold');start(v);assert.throws(()=>v.run("scriptedPartyEncounters.finalize({}, {outcome:'victory',enemies:[]})"));fight(v);assert.equal(v.run('meat_paw_stage'),2);assert.equal(v.run('stats.gold'),gold);save(v);v.frames(1);assert.equal(v.run('meatPaw.isActive()'),false);
 board(v);const callback=v.run('dialogue.callbacks[0]');dismiss(v);callback();callback();assert.equal(v.run('stats.gold'),gold+5000);assert.equal(v.run('meat_paw_stage'),3);save(v);board(v);dismiss(v);assert.equal(v.run('stats.gold'),gold+5000);assert.equal(v.run('MainQuest'),7);assert.equal(v.run('lantern_stage'),8);
});
module.exports={name:'Meat Paw: post-MQ7 bounty, movement ambush, exact lethal attacks, immutable replay and once-only payment',fresh,board,round,start,run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Meat Paw lifecycle/mechanics groups passed');}};
