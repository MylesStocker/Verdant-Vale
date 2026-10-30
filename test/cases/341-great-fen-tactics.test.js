'use strict';
const assert=require('assert/strict'),fs=require('fs');
const {createContext}=require('../harness');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')')),view=g=>J(g,'canonicalPartyCombat.getView()');
function fresh(ids,party=false,setup=''){
 const read=fs.readFileSync;let g;
 try{fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);
  if(String(file).endsWith('/combat.js'))s=s.replace("stage='playback';const playback=combatPlayerState.createRoundPlayback(result)","stage='playback';window.__fenResult=result;const playback=combatPlayerState.createRoundPlayback(result)");return s;};g=createContext();}finally{fs.readFileSync=read;}
 g.run(`dialogue.open=false;stats.hp=stats.maxHp=2000;stats.atk=42;stats.def=18;stats.spd=20;${party?'persistentParty.joinEsla({level:20});':''}Math=Object.create(Math);Math.random=()=>.5;${setup}`);
 if(ids)g.run('canonicalPartyCombat.enter('+JSON.stringify({enemies:ids.map(id=>'enemy_'+id),escape:'fastest_living'})+')');return g;
}
function input(g,key){g.run(`partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),10);canonicalPartyCombat.handleInput('${key}')`);}
function command(g,type='attack',slot=0,item){
 for(let n=0;view(g).selectedCommand!==type;n++){assert.ok(n<9,'command '+type);input(g,'right');}input(g,'confirm');
 if(item){for(let n=0;view(g).selectedItemId!==item;n++){assert.ok(n<70);input(g,'down');}input(g,'confirm');}
 if(view(g).phase==='targeting'){const v=view(g),id=(v.targetSide==='ally'?v.party:v.enemies)[slot].instanceId;
  for(let n=0;view(g).selectedTargetInstanceId!==id;n++){assert.ok(n<5);input(g,'right');}input(g,'confirm');}
}
function resolve(g){input(g,'confirm');assert.notEqual(view(g).phase,'fault',JSON.stringify(view(g)));return J(g,'__fenResult');}
function ack(g){for(let n=0;view(g).phase==='playback';n++){assert.ok(n<200);input(g,'confirm');}if(view(g).phase==='playback_complete')input(g,'confirm');}
function round(g,type='attack',slot=0,item){while(view(g).phase==='awaiting_action')command(g,view(g).commands.includes(type)?type:'attack',slot,item);return resolve(g);}
function replay(g,r){g.run('var replaySource='+JSON.stringify(r)+';Math.random=()=>{throw Error("replay RNG")};var fenReel=combatPlayerState.createRoundPlayback(copyFormationData(replaySource));for(let n=0;n<fenReel.frameCount;n++)combatPlayerState.projectRoundPlaybackFrame(fenReel,n);Math.random=()=>.5;');}
const lines=r=>r.events.filter(e=>e.type==='fen_effect').flatMap(e=>e.messages);
module.exports={name:'Great Fen tactics: telegraphs, interrupted Tech, observation, bindings, leeches and authenticated replay',fresh,round,ack,command,input,resolve,view,run(){
 // Every authored formation uses real input, several rounds and RNG-free replay.
 const catalog=fresh(null),formations=J(catalog,'GREAT_FEN_FORMATIONS');
 assert.equal(formations.length,10);assert.equal(new Set(formations.flatMap(f=>f.enemies)).size,6);
 for(const form of formations)for(const party of [false,true]){
  const g=fresh(form.enemies.map(id=>id.slice(6)),party);
  for(let i=0;i<3;i++){
   const r=round(g,'attack',view(g).enemies.find(e=>e.hp>0).slot);replay(g,r);
   g.run('drawPartyBattle(canonicalPartyCombat.getView())');ack(g);if(r.outcome!=='ongoing')break;
  }
 }
 // Charge consumes BOTH actions, fires once, and schedules at the slower speed.
 const chorus=fresh(['bell_throated_toad','drownlight']);
 let r=round(chorus,'attack');assert.ok(lines(r).some(l=>l.includes('Chorus next round')));
 assert.equal(r.order.filter(p=>p.side==='enemy').length,1);assert.equal(r.order.find(p=>p.side==='enemy').spd,8);
 assert.ok(!lines(r).some(l=>l.includes('takes')));ack(chorus);
 r=round(chorus,'attack');assert.equal(lines(r).filter(l=>l.includes('Witchlight Chorus:')).length,1);replay(chorus,r);
 for(const mutation of ['e.after.party[0].hp++','e.messages[0]="Forged"','d.events.splice(d.events.indexOf(e),1)']){
  chorus.run('var d='+JSON.stringify(r)+';var e=d.events.find(e=>e.type==="fen_effect");'+mutation+';d=copyFormationData(d)');
  assert.throws(()=>chorus.run('combatPlayerState.createRoundPlayback(d)'),/playback|authenticated/);
 }
 // Either death interrupts the committed pair. No fallback/free normal attack.
 for(const slot of [0,1]){
  const g=fresh(['bell_throated_toad','drownlight'],false,'stats.atk=500;stats.spd=1000;stats.items.push(createItem("Bait"));');
  round(g,'item',0,'Bait');ack(g);r=round(g,'attack',slot);
  assert.ok(lines(r).some(l=>l.includes('Chorus breaks')));assert.ok(!lines(r).some(l=>l.includes('takes')));replay(g,r);
 }
 // Unpaired toad charges and releases Deep Toll, never an immediate pulse.
 const toad=fresh(['bell_throated_toad']);r=round(toad,'observe');assert.ok(lines(r).some(l=>l.includes('Deep Toll next round')));ack(toad);
 r=round(toad,'observe');assert.ok(lines(r).some(l=>l.startsWith('Deep Toll:')));replay(toad,r);
 // Observe only grants exposure once; the next damaging hit doubles and XP is one-time.
 const light=fresh(['drownlight'],false,'stats.spd=1000;');
 round(light,'observe');ack(light);r=round(light,'observe');assert.ok(!lines(r).some(l=>l.includes('False Lights dazzle')));ack(light);
 r=round(light,'attack');const a=r.events.find(e=>e.type==='attack'&&e.side==='ally');
 const bonus=r.events.find(e=>e.type==='fen_effect'&&e.messages.some(l=>l.startsWith('True Light:')));
 assert.ok(bonus);assert.equal(bonus.hits[0].hpBefore-bonus.hits[0].hpAfter,Math.min(a.appliedDamage,a.hpAfter));ack(light);
 round(light,'observe');ack(light);assert.equal(view(light).enemies[0].unusual.fen.exposed,false);
 while(view(light).phase==='awaiting_action'){r=round(light,'attack');ack(light);}
 const receipt=J(light,'canonicalPartyCombat.finish()');assert.equal(receipt.rewards.xp,150);
 const paid=light.run('stats.xp');light.run('canonicalPartyCombat.finish()');assert.equal(light.run('stats.xp'),paid);
 // Mark -> lunge -> ordinary bite. The slow is combat-local and expires.
 const hound=fresh(['blackbriar_hound']);r=round(hound,'observe');assert.ok(lines(r).some(l=>l.includes('singles out')));ack(hound);
 r=round(hound,'observe');assert.ok(lines(r).some(l=>l.startsWith('Hamstring:')));assert.equal(r.after.party[0].effective.spd,16);ack(hound);
 r=round(hound,'observe');assert.ok(r.events.some(e=>e.type==='attack'&&e.side==='enemy'));assert.equal(r.after.party[0].effective.spd,20);replay(hound,r);
 // Two distinct damaging actions cut bindings before the next squeeze.
 const binder=fresh(['reedbinder'],true,'stats.atk=20;stats.spd=1000;stats.items.push(createItem("Bait"));');
 command(binder,'observe');command(binder,'item',1,'Bait');r=resolve(binder);assert.ok(lines(r).some(l=>l.includes('snares')));ack(binder);
 r=round(binder,'attack');assert.ok(lines(r).some(l=>l.includes('binding reeds are cut')));assert.ok(!lines(r).some(l=>l.includes('squeeze')));replay(binder,r);
 const expire=fresh(['reedbinder']);round(expire,'observe');ack(expire);r=round(expire,'observe');assert.ok(lines(r).some(l=>l.includes('loosen')));assert.equal(r.after.party[0].effective.spd,20);
 // Siphon leaves the player's full heal intact, then a hit ruptures for +50.
 const leech=fresh(['bladder_leech'],false,'stats.hp=1000;stats.spd=1000;stats.items.push(createItem("Potion"));');
 round(leech,'attack');ack(leech);r=round(leech,'item',0,'Potion');
 assert.ok(lines(r).some(l=>l.includes('siphons')));const heal=r.events.find(e=>e.type==='item');
 assert.equal(heal.after.party[0].hp-heal.before.party[0].hp,20);assert.equal(r.after.enemies[0].unusual.fen.mode,'swollen');replay(leech,r);ack(leech);
 r=round(leech,'attack');assert.ok(lines(r).some(l=>l.includes('ruptures')));replay(leech,r);
 // Quickbloom uses the same healing reaction, not an item-only approximation.
 const bloom=fresh(['bladder_leech'],true,`stats.hp=1000;stats.spd=1000;
  saveGame();var saved=JSON.parse(localStorage.getItem('verdantVale_save'));
  saved.party.characters.find(c=>c.characterId==='esla').hp=50;
  localStorage.setItem('verdantVale_save',JSON.stringify(saved));loadGame();dialogue.open=false;`);
 round(bloom,'attack');ack(bloom);
 command(bloom,'observe');command(bloom,'resonance');input(bloom,'confirm');
 const esla=view(bloom).party[1].instanceId;while(view(bloom).selectedTargetInstanceId!==esla)input(bloom,'right');input(bloom,'confirm');
 r=resolve(bloom);assert.ok(r.events.some(e=>e.type==='resonance'));assert.ok(lines(r).some(l=>l.includes('siphons')));replay(bloom,r);
 // Duplicate instances retain separate observation state and pay only one bonus.
 const twins=fresh(['drownlight','drownlight'],false,'stats.atk=500;stats.spd=1000;');
 round(twins,'observe',0);ack(twins);assert.equal(view(twins).enemies[1].unusual.fen.observed,false);
 round(twins,'attack',0);ack(twins);round(twins,'attack',1);ack(twins);
 assert.equal(J(twins,'canonicalPartyCombat.finish()').rewards.xp,250);
 // Retreat grants no observation XP and clears all tactical state.
 const run=fresh(['drownlight'],false,'stats.spd=1000;');round(run,'observe');ack(run);run.run('Math.random=()=>0');r=round(run,'run');assert.equal(r.outcome,'escape');replay(run,r);ack(run);
 assert.equal(J(run,'canonicalPartyCombat.finish()').rewards,null);assert.equal(run.run('saveGame()&&loadGame()'),true);assert.equal(run.run('SAVE_VERSION'),5);
 const data=J(catalog,'validateGameData()');assert.equal(data.errors,0);
 console.log('  All ten formations, solo/party input, combined interruption, Observe rewards, bindings, siphon and replay verified');
}};
