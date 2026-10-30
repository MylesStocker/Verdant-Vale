'use strict';
const assert=require('assert/strict'),fs=require('fs');
const {createContext}=require('../harness');
const {local}=require('./333-struck-entry-expedition.test');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')')),view=g=>J(g,'canonicalPartyCombat.getView()');
function fresh(party=true,setup=''){
 const read=fs.readFileSync;let g;
 try{fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);
  if(String(file).endsWith('/combat.js'))s=s.replace("stage='playback';const playback=combatPlayerState.createRoundPlayback(result)","stage='playback';window.__mawResult=result;const playback=combatPlayerState.createRoundPlayback(result)");return s;};g=createContext();}finally{fs.readFileSync=read;}
 g.run(`dialogue.open=false;MainQuest=5;mornay_peat_hunt=1;stats.hp=stats.maxHp=2000;stats.def=100;stats.atk=1000;${party?'persistentParty.joinEsla({level:20});':''}Math=Object.create(Math);var mawRolls=0;Math.random=()=>{mawRolls++;return .5};${setup}`);
 local(g,'MAINLAND_CN3RN8_MAP',272,232);
 assert.ok(g.run("scriptedPartyEncounters.start('mornay_removal',0)"));return g;
}
function input(g,key){g.run(`partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),10);partyBattleSwallowAnimation.update(canonicalPartyCombat.getView(),10);canonicalPartyCombat.handleInput('${key}')`);}
function command(g,type,item){for(let n=0;view(g).selectedCommand!==type;n++){assert.ok(n<8);input(g,'right');}input(g,'confirm');
 if(item){for(let n=0;view(g).selectedItemId!==item;n++){assert.ok(n<60);input(g,'down');}input(g,'confirm');}if(view(g).phase==='targeting')input(g,'confirm');}
function round(g,type='observe',item){while(view(g).phase==='awaiting_action')command(g,type==='observe'&&!view(g).commands.includes('observe')?'attack':type,item);input(g,'confirm');return J(g,'__mawResult');}
function acknowledge(g){for(let n=0;view(g).phase==='playback';n++){assert.ok(n<200);input(g,'confirm');}if(view(g).phase==='playback_complete')input(g,'confirm');}
const state=g=>g.run('JSON.stringify({stats,party:persistentParty.getView(),session:combatPlayerState.session.getView(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),location:snapshotLocationState(),regional:regionalWorldPosition()})');
module.exports={name:'Peat-Bed Maw: six full rounds, authenticated Swallow, final-round victory, escape and isolated animation/replay',fresh,round,acknowledge,input,command,view,run(){
 for(const party of [false,true]){
  const g=fresh(party),gold=g.run('stats.gold'),xp=g.run('stats.xp');
  for(let i=1;i<=5;i++){const r=round(g);assert.equal(r.outcome,'ongoing');assert.ok(!r.events.some(e=>e.type==='swallow'));acknowledge(g);assert.equal(view(g).completedRounds,i);}
  const r=round(g),e=r.events.find(e=>e.type==='swallow');assert.equal(r.outcome,'defeat');assert.equal(e.round,6);assert.equal(e.hits.length,party?2:1);assert.ok(e.hits.every(h=>h.hpBefore>0&&h.hpAfter===0&&h.appliedDamage===h.hpBefore));
  const lastAction=Math.max(...r.events.map((e,i)=>['attack','observe'].includes(e.type)?i:-1));assert.ok(r.events.indexOf(e)>lastAction,'all sixth-round actions precede Swallow');
  // Replay the recorded round with RNG forbidden; rendering and timing cannot mutate state.
  g.run('var mawReplay=combatPlayerState.createRoundPlayback(__mawResult);Math.random=()=>{throw Error("unexpected playback RNG")};');
  const before=state(g);for(let i=0;i<g.run('mawReplay.frameCount');i++)g.run(`combatPlayerState.projectRoundPlaybackFrame(mawReplay,${i})`);assert.equal(state(g),before);
  for(const change of ['e.deadline=5','e.hits.pop()','e.hits[0].hpAfter=1','d.events.splice(d.events.indexOf(e),1)']){
   g.run('var d='+JSON.stringify(r)+';var e=d.events.find(e=>e.type==="swallow");'+change+';d=copyFormationData(d)');assert.throws(()=>g.run('combatPlayerState.createRoundPlayback(d)'),/playback|authenticated/);
  }
  while(view(g).playbackFrame?.currentEvent?.type!=='swallow')input(g,'confirm');
  g.run('partyBattleSwallowAnimation.reset()');const f=view(g).frameIndex;g.run("canonicalPartyCombat.handleInput('confirm')");assert.equal(view(g).frameIndex,f,'cannot skip emergence');
  const safe=state(g);for(const dt of [0,.2,.5,.7,.6])g.run(`partyBattleSwallowAnimation.update(canonicalPartyCombat.getView(),${dt});drawPartyBattle(canonicalPartyCombat.getView())`);assert.equal(state(g),safe);
  assert.equal(g.run('partyBattleSwallowAnimation.blocksAdvance(canonicalPartyCombat.getView())'),false);acknowledge(g);assert.equal(view(g).phase,'defeat');input(g,'confirm');
  assert.equal(g.run('mornay_peat_hunt'),1);assert.equal(g.run('stats.xp'),xp);assert.ok(g.run('stats.gold')<=gold);assert.equal(view(g).active,false);
  g.run('dialogue.open=false;dialogue.callbacks=null');assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false;');local(g,'MAINLAND_CN3RN8_MAP',272,232);assert.ok(g.run("scriptedPartyEncounters.start('mornay_removal',0)"));assert.equal(view(g).completedRounds,0);
 }
 const win=fresh(false);for(let i=0;i<5;i++){round(win);acknowledge(win);}const kill=round(win,'attack');assert.equal(kill.outcome,'victory');assert.ok(!kill.events.some(e=>e.type==='swallow'));acknowledge(win);input(win,'confirm');assert.equal(win.run('mornay_peat_hunt'),2);
 // Bomb expires at the same boundary as the deadline: its kill wins first.
 const bomb=fresh(false,"ENEMY_TEMPLATE_REGISTRY.enemy_peat_bed_maw.hp=80;stats.items.push(createItem('Bomb'));");
 for(let i=1;i<=6;i++){const r=round(bomb,i===3?'item':'observe',i===3?'Bomb':undefined);if(i===6){assert.equal(r.outcome,'victory');assert.ok(r.events.some(e=>e.type==='delayed_effect_tick'&&e.effect==='bomb'));assert.ok(!r.events.some(e=>e.type==='swallow'));}acknowledge(bomb);}
 const escape=fresh(false,'stats.spd=100;');for(let i=0;i<5;i++){round(escape);acknowledge(escape);}escape.run('Math.random=()=>0');const flight=round(escape,'run');assert.equal(flight.outcome,'escape');assert.ok(!flight.events.some(e=>e.type==='swallow'));
 // Real MQ5 loadout: leisurely basic attacks lose; prepared damage items win.
 for(const prepared of [false,true]){
  const q=fresh(false,`storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();mornay_peat_hunt=1;${prepared?"stats.items.push(createItem('Bomb'));for(let i=0;i<4;i++)stats.items.push(createItem('Sapper Charge'));":''}`);
  let result;
  for(let n=1;n<=6;n++){
   while(view(q).phase==='awaiting_action'){
    const esla=view(q).currentAlly.characterId==='esla';
    command(q,prepared&&esla&&n<=5?'item':'attack',prepared&&esla&&n<=5?(n===1?'Bomb':'Sapper Charge'):undefined);
   }
   input(q,'confirm');result=J(q,'__mawResult');acknowledge(q);if(result.outcome!=='ongoing')break;
  }
  assert.equal(result.outcome,prepared?'victory':'defeat');assert.equal(result.round,6);
 }
 const invalid=createContext();invalid.run('ENEMY_TEMPLATE_REGISTRY.enemy_peat_bed_maw.swallowAfterRounds=0');assert.throws(()=>invalid.run('canonicalEnemyMechanicProfile(ENEMY_TEMPLATE_REGISTRY.enemy_peat_bed_maw)'),/capability/);
 assert.equal(gVersion(),5);
 console.log('  Six-round deadline, final-action/Bomb wins, retreat, retry, forged-history rejection and read-only animation passed');
}};
function gVersion(){return createContext().run('SAVE_VERSION');}
