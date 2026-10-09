'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const ROOT=path.join(__dirname,'../..'),checks=[],test=(name,run)=>checks.push({name,run}),HIT=[0.5,0.99,0.99];
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')')),view=g=>J(g,'partyCombatLab.getView()');
function record(g){g.run(`var partyPaint=[],partyPaintStack=[];
  const partyProps=['fillStyle','strokeStyle','font','lineWidth','globalAlpha','textAlign','textBaseline'];
  const partyEmit=(type,args)=>partyPaint.push({type,args,style:Object.fromEntries(partyProps.map(k=>[k,ctx[k]]))});
  ctx.save=()=>partyPaintStack.push(partyProps.map(k=>ctx[k]));ctx.restore=()=>{const s=partyPaintStack.pop();partyProps.forEach((k,i)=>ctx[k]=s[i]);};
  ctx.fillRect=(...a)=>partyEmit('fillRect',a);ctx.strokeRect=(...a)=>partyEmit('strokeRect',a);
  ctx.fillText=(...a)=>partyEmit('text',a);`);}
function fresh(id='lely_esla_one'){
  const g=createContext();g.run(`resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);player.facing='left';
    dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMenu.open=false;statusEffects=[];
    Math=Object.create(Math);var renderRng=0;Math.random=()=>{renderRng++;throw Error('renderer consumed RNG');};`);
  assert.ok(g.run('partyCombatLab.enter('+JSON.stringify(id)+')'));record(g);return g;
}
function snapshot(g){return g.run(`JSON.stringify({stats,statusEffects,player,day,tick,dialogue,choice,menu,debugMenu,
  combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),
  party:combatPlayerState.getView(),session:combatPlayerState.session.getView(),lab:partyCombatLab.getView(),
  flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),save:localStorage.getItem('verdantVale_save')})`);}
function draw(g){g.run('partyPaint=[];drawPartyCombatLabBattle();');return J(g,'partyPaint');}
const texts=calls=>calls.filter(call=>call.type==='text').map(call=>call.args[0]);
function commandAll(g,target=null){while(view(g).phase==='collecting'){const v=view(g);assert.ok(g.run('partyCombatLab.submitAttack('+JSON.stringify({actorId:v.nextActorId,targetId:target||v.livingTargetIds[0]})+')'));}}
function commit(g,tape){g.run(`var renderTape=${JSON.stringify(tape)},renderUsed=0;Math.random=()=>{renderRng++;if(renderUsed===renderTape.length)throw Error('tape exhausted');return renderTape[renderUsed++];};`);
  assert.ok(g.run('partyCombatLab.commitRound()'));assert.equal(g.run('renderUsed'),tape.length);
  g.run("Math.random=()=>{renderRng++;throw Error('renderer consumed RNG');};");}
function complete(g){while(view(g).phase==='playback')assert.ok(g.run('partyCombatLab.advancePlayback()'));assert.equal(view(g).phase,'playback_complete');}

test('inactive Lab draws nothing and active rendering consumes one immutable Lab view',()=>{
  const g=createContext();record(g);const before=snapshot(g);assert.equal(g.run('drawPartyCombatLabBattle()'),false);assert.equal(g.run('partyPaint.length'),0);assert.equal(snapshot(g),before);
  const source=fs.readFileSync(path.join(ROOT,'render-party-combat-lab.js'),'utf8');
  assert.equal((source.match(/partyCombatLab\.getView\(\)/g)||[]).length,1);
  assert.doesNotMatch(source,/combatPlayerState|formationSessionController|formationRounds|\bcombat\.|\bstats\.|\bplayer\.|Math\.random|\btick\b/);
  assert.doesNotMatch(source,/partyCombatLab\.(enter|submitAttack|backtrack|commitRound|advancePlayback|acknowledgePlayback|exit|emergencyAbort)\s*\(/);
});

test('one to three enemies occupy deterministic stable slots and all records stay on canvas',()=>{
  const expected={lely_esla_one:[[156,200]],lely_esla_two:[[24,224],[264,224]],lely_esla_three:[[8,160],[176,160],[344,160]]};
  for(const [id,slots] of Object.entries(expected)){const g=fresh(id),layout=J(g,'partyCombatLabBattleLayout(partyCombatLab.getView())');
    assert.deepEqual(layout.enemies.map(p=>[p.x,p.width]),slots);assert.deepEqual(layout.enemies.map(p=>p.slot),slots.map((_,i)=>i));
    assert.deepEqual(layout.allies.map(p=>[p.x,p.width]),[[20,226],[266,226]]);
    for(const p of [...layout.allies,...layout.enemies])assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=512&&p.y+p.height<=480);
    const labels=texts(draw(g));for(const member of [...view(g).party,...view(g).enemies])assert.ok(labels.includes(member.name));}
});

test('current ally and submitted exact targets are presentation-only',()=>{
  const g=fresh('lely_esla_two'),first=view(g),enemy=first.enemies[1];let labels=texts(draw(g));
  assert.ok(labels.includes('CHOOSING'));assert.ok(labels.includes('Lély: not submitted'));assert.ok(labels.includes('Esla: not submitted'));
  assert.ok(labels.includes('Choose a target — Lély is choosing.'));assert.equal(labels.filter(label=>label==='▼').length,1);
  assert.ok(g.run('partyCombatLab.submitAttack('+JSON.stringify({actorId:first.nextActorId,targetId:enemy.instanceId})+')'));
  const second=view(g);labels=texts(draw(g));assert.equal(second.nextActorId,second.party[1].instanceId);
  assert.ok(labels.includes('Choose a target — Esla is choosing.'));assert.ok(labels.includes('Lély: Attack → '+enemy.name));
  assert.equal(g.run('partyPaint.filter(c=>c.type==="text"&&c.args[0]==="CHOOSING").length'),1);
});

test('one cursor follows the exact selected living runtime identity and disappears outside selection',()=>{
  const g=fresh('lely_esla_three');let v=view(g),layout=J(g,'partyCombatLabBattleLayout(partyCombatLab.getView())');
  assert.equal(layout.target.instanceId,v.selectedTargetInstanceId);assert.equal(layout.target.slot,0);
  assert.equal(texts(draw(g)).filter(label=>label==='▼').length,1);
  assert.ok(g.run('partyCombatLab.moveTarget("next")'));v=view(g);layout=J(g,'partyCombatLabBattleLayout(partyCombatLab.getView())');
  assert.equal(layout.target.instanceId,v.enemies[1].instanceId);assert.equal(layout.target.slot,1);
  commandAll(g);assert.equal(J(g,'partyCombatLabBattleLayout(partyCombatLab.getView()).target'),null);
  assert.equal(texts(draw(g)).filter(label=>label==='▼').length,0);
});

test('playback draws recorded events and frame HP instead of already-resolved live HP',()=>{
  const g=fresh('lely_esla_two');commandAll(g,view(g).enemies[1].instanceId);
  commit(g,[0,0,0,0,0,...Array.from({length:4},()=>HIT).flat()]);
  const live=J(g,'[...combatPlayerState.getView().members,...combat.enemies].map(m=>m.hp)'),frame0=view(g);
  assert.notDeepEqual([...frame0.party,...frame0.enemies].map(m=>m.hp),live);
  let before=snapshot(g),calls=draw(g);assert.equal(snapshot(g),before);assert.ok(texts(calls).includes('Round 1: ready.'));
  for(const member of [...frame0.party,...frame0.enemies])assert.ok(texts(calls).includes(`${member.hp} / ${member.maxHp}`));
  assert.ok(g.run('partyCombatLab.advancePlayback()'));const frame1=view(g);before=snapshot(g);calls=draw(g);assert.equal(snapshot(g),before);
  assert.ok(texts(calls).some(line=>/attacks|evades/.test(line)));for(const member of [...frame1.party,...frame1.enemies])assert.ok(texts(calls).includes(`${member.hp} / ${member.maxHp}`));
});

test('playback-complete and terminal victory preserve the same final historical frame',()=>{
  const g=fresh();g.run('partyCombatLab.exit();stats.atk=100;');assert.ok(g.run('partyCombatLab.enter("lely_esla_one")'));commandAll(g);
  commit(g,[0,0,0,...HIT]);complete(g);const completeView=view(g),completeCalls=draw(g);
  assert.ok(texts(completeCalls).includes('FINAL FRAME — ACKNOWLEDGEMENT PENDING'));
  assert.ok(texts(completeCalls).includes('DEFEATED'));assert.equal(completeView.playbackFrame.complete,true);
  assert.ok(g.run('partyCombatLab.acknowledgePlayback()'));const terminal=view(g),terminalCalls=draw(g);
  assert.equal(terminal.phase,'victory');assert.deepEqual(terminal.playbackFrame,completeView.playbackFrame);
  assert.ok(texts(terminalCalls).includes('VICTORY — FINAL FRAME'));assert.ok(texts(terminalCalls).includes('Victory.'));
  assert.deepEqual(terminalCalls,draw(g),'terminal draws remain deterministic');
});

test('defeat marks both Lely and Esla defeated without recovery or slot compaction',()=>{
  const g=fresh();g.run('partyCombatLab.exit();stats.hp=1;ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,hp:1000,maxHp:1000,atk:100,def:100};');
  assert.ok(g.run('partyCombatLab.enter("lely_esla_one")'));commandAll(g);
  commit(g,[0,0.999,0.999,0.99,0,0.99,0.5,0.99,0]);complete(g);assert.ok(g.run('partyCombatLab.acknowledgePlayback()'));commandAll(g);
  commit(g,[0.999,0.99,0,0.99]);complete(g);assert.ok(g.run('partyCombatLab.acknowledgePlayback()'));
  const v=view(g),calls=draw(g),labels=texts(calls);assert.equal(v.phase,'defeat');assert.deepEqual(v.party.map(m=>[m.slot,m.hp]),[[0,0],[1,0]]);
  assert.equal(labels.filter(label=>label==='DEFEATED').length,2);assert.ok(labels.includes('DEFEAT — FINAL FRAME'));assert.ok(labels.includes('Defeat.'));
});

test('every phase draw consumes zero RNG and mutates no Lab, combat or world state',()=>{
  const g=fresh('lely_esla_three');for(const stage of ['collecting','ready','playback','playback_complete']){
    if(stage==='ready')commandAll(g);else if(stage==='playback')commit(g,[0,0.5,0.999,0,0,0,0,...Array.from({length:5},()=>HIT).flat()]);else if(stage==='playback_complete')complete(g);
    const before=snapshot(g),rng=g.run('renderRng'),first=draw(g);assert.equal(snapshot(g),before);assert.equal(g.run('renderRng'),rng);assert.deepEqual(draw(g),first);assert.equal(snapshot(g),before);
  }
});

test('malformed projections fail before canvas output',()=>{
  const g=fresh(),v='partyCombatLab.getView()';
  for(const value of ['null','Object.freeze({...'+v+',phase:"bad"})','Object.freeze({...'+v+',nextActorId:"stale"})',
    'Object.freeze({...'+v+',enemies:Object.freeze([])})']){
    g.run('partyPaint=[];');assert.throws(()=>g.run('partyCombatLabBattleLayout('+value+')'),/Invalid Party Combat Lab presentation/);assert.equal(g.run('partyPaint.length'),0);}
});

test('renderer has one exclusive main-render route and no mutation or content route',()=>{
  for(const file of scriptOrderFromIndexHtml()){
    const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    if(!['render-party-combat-lab.js','render.js'].includes(file))assert.doesNotMatch(source,/drawPartyCombatLabBattle\s*\(/,file);
    if(/content|interaction|quest|encounter/.test(file))assert.doesNotMatch(source,/PartyCombatLabBattle|partyCombatLabBattleLayout/,file);
  }
  const route=fs.readFileSync(path.join(ROOT,'render.js'),'utf8');assert.equal((route.match(/drawPartyCombatLabBattle\(\)/g)||[]).length,1);
  const source=fs.readFileSync(path.join(ROOT,'render-party-combat-lab.js'),'utf8');
  assert.doesNotMatch(source,/addEventListener|pressedKeys|debugMenu|warpMenu|render\s*\(|drawCombat\s*\(/);
});

module.exports={name:'read-only Party Combat Lab renderer: stable slots, historical HP and isolated route',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}console.log('  '+checks.length+' Party Combat Lab renderer checks passed');}};
