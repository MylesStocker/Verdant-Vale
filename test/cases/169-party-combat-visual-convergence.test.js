'use strict';

const assert=require('assert/strict');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const ROOT=path.join(__dirname,'../..'),checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const texts=calls=>calls.filter(call=>call.type==='text').map(call=>call.args[0]);

function fresh(id='lely_esla_three') {
  const g=createContext();
  g.run(`resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);
    dialogue.open=false;menu.open=false;debugMenu.open=false;statusEffects=[];
    Math=Object.create(Math);var visualRng=0;Math.random=()=>{visualRng++;throw Error('visual renderer consumed RNG');};
    if(!partyCombatLab.enter(${JSON.stringify(id)}))throw Error('lab entry failed');`);
  record(g);return g;
}
function draw(g){g.run('paint=[];drawPartyCombatLabBattle();');return J(g,'paint');}
function snapshot(g){return g.run(`JSON.stringify({stats,player,tick,day,statusEffects,dialogue,menu,debugMenu,
  party:combatPlayerState.getView(),session:partyCombatLab.isActive()?combatPlayerState.session.getView():null,lab:partyCombatLab.getView(),
  enemies:combat.enemies.map(e=>[e.instanceId,e.slot,e.hp]),save:localStorage.getItem('verdantVale_save')})`);}
function commandAll(g){g.run(`while(['awaiting_action','targeting'].includes(partyCombatLab.getView().phase)){
  const v=partyCombatLab.getView();partyCombatLab.submitAttack({actorId:v.nextActorId,targetId:v.enemies.find(e=>e.hp>0).instanceId});}`);}

test('inactive renderer is inert and normal render sources remain byte-stable',()=>{
  const g=createContext();record(g);const before=snapshot(g);g.run('paint=[];');
  assert.equal(g.run('drawPartyCombatLabBattle()'),false);assert.equal(g.run('paint.length'),0);assert.equal(snapshot(g),before);
  const expected={
    drawCombat:'64ffcee796621e740fd847f5b965c81a1efb4e3d229ad88c45ab6036a3a16972',
    drawFormationCombat:'ea398ca0ab06c9bf77f17e356785a74930d55edd976273938b3de6249841f98e',
    getFormationBattleLayout:'dd7334797064bb42ce840b1ebfca0a1ffd856f3ba9c1a181d0295ba005cbc8e3',
    drawBattleReceiver:'26993968664a9d93fadfa1da82051655abbc95c0d20fac0113d53f959e600b14',
    drawGalleryBattleCreature:'b67a00a63bbb24770dea20941d2b6c22f08b2b9f62bd1811e46a922c0d80e57a',
  };
  for(const [name,digest] of Object.entries(expected))assert.equal(
    crypto.createHash('sha256').update(g.run(name+'.toString()')).digest('hex'),digest,name);
});

test('party battle reuses the ordinary background, frame, typography and real sprite dispatch',()=>{
  const g=fresh('lely_esla_one'),before=snapshot(g);g.run('var realPartyBackground=drawBattleBackground,partyBackgroundCalls=0;drawBattleBackground=()=>{partyBackgroundCalls++;realPartyBackground();};');
  const calls=draw(g);assert.equal(g.run('partyBackgroundCalls'),1);assert.equal(snapshot(g),before);assert.equal(g.run('visualRng'),0);
  assert.ok(calls.some(call=>call.type==='fillRect'&&call.args.join(',')==='8,297,496,175'&&call.style.fillStyle==='#08121e'));
  assert.ok(calls.some(call=>call.type==='strokeRect'&&call.args.join(',')==='9,298,494,173'&&call.style.strokeStyle==='#5a8a9a'));
  assert.ok(calls.some(call=>call.style.fillStyle==='#98eef8'),'Marsh Wisp authored sprite');
  const source=fs.readFileSync(path.join(ROOT,'render-party-combat-lab.js'),'utf8');
  assert.match(source,/ENEMY_SPRITE_DISPATCH\[member\.id\]/);assert.match(source,/draw:drawBattlePlayer/);assert.match(source,/draw:drawBattleEsla/);
  assert.doesNotMatch(source,/PARTY_COMBAT_LAB_ENEMY_COLORS|DEV LAB/);
});

test('allies use stable three-capacity slots with one shared audited foot baseline',()=>{
  const g=fresh(),base='partyCombatLab.getView()';
  const two=J(g,'partyCombatLabBattleLayout('+base+').allies');
  assert.deepEqual(two.map(p=>[p.slot,p.x,p.anchorY,p.feetY]),[[0,108,254,277],[1,256,263,277]]);
  const one=J(g,`(()=>{const v=${base};return partyCombatLabBattleLayout(Object.freeze({...v,party:Object.freeze([v.party[0]])})).allies;})()`);
  assert.deepEqual(one.map(p=>[p.slot,p.x,p.feetY]),[[0,108,277]]);
  const defeated=J(g,`(()=>{const v=${base};return partyCombatLabBattleLayout(Object.freeze({...v,nextActorId:v.party[1].instanceId,party:Object.freeze(v.party.map((m,i)=>Object.freeze({...m,hp:i?m.hp:0})))})).allies;})()`);
  assert.deepEqual(defeated.map(p=>[p.slot,p.x,p.feetY]),[[0,108,277],[1,256,277]],'defeated slots do not move or compact');
  const three=J(g,`(function(){const v=${base};const third=Object.freeze({characterId:'future_lab',instanceId:'party_future_3',slot:2,name:'Future',hp:40,maxHp:40});
    const structural=Object.freeze({...v,party:Object.freeze([...v.party,third])});return partyCombatLabBattleLayout(structural).allies;})()`);
  assert.deepEqual(three.map(p=>[p.slot,p.x,p.feetY]),[[0,108,277],[1,256,277],[2,404,277]]);
  assert.ok(three.every((p,index)=>index===0||three[index-1].x<p.x));
});

test('established Esla identity is reused at battle scale without an image placeholder',()=>{
  const g=fresh('lely_esla_one');g.run('paint=[];drawBattleEsla(256,263);');const calls=J(g,'paint');
  for(const color of ['#3a6868','#2a9a28','#1e7820','#c09878'])assert.ok(calls.some(call=>call.style.fillStyle===color),color);
  const source=fs.readFileSync(path.join(ROOT,'render-entities.js'),'utf8');
  assert.match(source,/function drawEslaFigureBody\(/);assert.match(source,/drawEslaFigureBody\(px, py\)/);
});

test('enemy slots, exact target cursor and defeated retention match Formation vocabulary',()=>{
  const g=fresh();g.run('partyCombatLab.confirmCommand()');const layout=J(g,'partyCombatLabBattleLayout(partyCombatLab.getView())'),calls=draw(g);
  assert.deepEqual(layout.enemies.map(p=>[p.slot,p.x,p.width]),[[0,16,144],[1,184,144],[2,352,144]]);
  const target=calls.filter(call=>call.type==='fill'&&call.style.fillStyle==='#f0e8b8'&&call.bounds&&call.bounds[1]===65);
  assert.equal(target.length,1);assert.equal((target[0].bounds[0]+target[0].bounds[2])/2,layout.target.x);
  commandAll(g);assert.equal(draw(g).filter(call=>call.type==='fill'&&call.style.fillStyle==='#f0e8b8'&&call.bounds?.[1]===65).length,0);
  g.run('paint=[];var retainedEnemy=Object.freeze({...partyCombatLab.getView().enemies[0],hp:0});drawPartyCombatEnemy(retainedEnemy,partyCombatLabBattleLayout(partyCombatLab.getView()).enemies[0],false);');
  assert.ok(J(g,'paint').some(call=>call.style.globalAlpha===0.25));assert.equal(layout.enemies[0].slot,0);
});

test('three compact party rows and familiar command boxes fit the ordinary panel',()=>{
  const g=fresh(),calls=draw(g),labels=texts(calls);
  for(const name of ['Lély','Esla','Attack','Item','Observe','Run'])assert.ok(labels.some(label=>String(label).replace(/^▶ /,'')===name),name);
  assert.ok(calls.filter(call=>call.type==='fillRect'&&call.args[1]===414).every(call=>call.args[1]+call.args[3]<=472));
  const attacks=calls.filter(call=>call.type==='text'&&call.args[0]==='▶ Attack');
  assert.equal(attacks.length,1);assert.equal(attacks[0].style.fillStyle,'#e0f0e8');
  for(const label of ['Item','Observe','Run'])assert.equal(calls.find(call=>call.type==='text'&&call.args[0]===label).style.fillStyle,'#6b8890');
  g.run(`paint=[];drawPartyCombatStatusRow(Object.freeze({name:'Third',hp:30,maxHp:40}),2);`);
  for(const call of J(g,'paint').filter(entry=>entry.bounds))assert.ok(call.bounds[1]>=334&&call.bounds[3]<=404,JSON.stringify(call));
});

test('the choosing ally is highlighted in the status row without a battlefield box',()=>{
  const g=fresh('lely_esla_one'),calls=draw(g);
  assert.equal(calls.some(call=>call.type==='strokeRect'&&call.args.join(',')==='81,220,54,59'),false);
  assert.equal(calls.find(call=>call.type==='text'&&call.args[0]==='Lély').style.fillStyle,'#e0f0e8');
  assert.equal(calls.find(call=>call.type==='text'&&call.args[0]==='Esla').style.fillStyle,'#d0e0d0');
  assert.ok(calls.some(call=>call.type==='fillRect'&&call.args[1]===348&&call.style.fillStyle==='#78c88a'));
  assert.ok(calls.some(call=>call.type==='fillRect'&&call.args[1]===366&&call.style.fillStyle==='#4a9a62'));
  assert.equal(calls.some(call=>call.type==='fillRect'&&[346,364].includes(call.args[1])&&call.args[2]===10&&call.args[3]===8),false,
    'HP segments use the lowered text-aligned y position');
  g.run(`partyCombatLab.confirmCommand();partyCombatLab.confirmTarget();`);
  const eslaCalls=draw(g);
  assert.equal(eslaCalls.some(call=>call.type==='strokeRect'&&call.args.join(',')==='229,220,54,59'),false);
  assert.equal(eslaCalls.find(call=>call.type==='text'&&call.args[0]==='Lély').style.fillStyle,'#d0e0d0');
  assert.equal(eslaCalls.find(call=>call.type==='text'&&call.args[0]==='Esla').style.fillStyle,'#e0f0e8');
});

test('playback uses historical HP and defeated allies remain dimmed in fixed slots',()=>{
  const g=fresh('lely_esla_one');commandAll(g);
  g.run(`var tape=[0,0,0,...Array.from({length:3},()=>[0.5,0.99,0.99]).flat()],used=0;Math.random=()=>tape[used++];partyCombatLab.commitRound();
    Math.random=()=>{visualRng++;throw Error('visual renderer consumed RNG');};`);
  const view=J(g,'partyCombatLab.getView()'),live=J(g,'[...combatPlayerState.getView().members,...combat.enemies].map(m=>m.hp)');
  assert.notDeepEqual([...view.party,...view.enemies].map(m=>m.hp),live);
  const calls=draw(g);for(const member of [...view.party,...view.enemies])assert.ok(texts(calls).includes(`${member.hp} / ${member.maxHp}`));
  g.run(`paint=[];drawPartyCombatAlly(Object.freeze({...partyCombatLab.getView().party[0],hp:0}),
    partyCombatLabBattleLayout(partyCombatLab.getView()).allies[0],false);`);
  assert.ok(J(g,'paint').some(call=>call.style.globalAlpha===0.25));
});

test('screen omits diagnostics and remains a render-only debug route',()=>{
  const g=fresh(),before=snapshot(g),calls=draw(g);assert.equal(snapshot(g),before);assert.equal(g.run('visualRng'),0);
  const banned=/CHOOSING|DEV LAB|submitted|not submitted|FRAME|EVENT|ROUNDS|combat_(?:party|enemy)_|collecting|playback_complete/i;
  assert.ok(texts(calls).every(text=>!banned.test(String(text))),texts(calls).join(' | '));
  const source=fs.readFileSync(path.join(ROOT,'render-party-combat-lab.js'),'utf8');
  assert.equal((source.match(/partyCombatLab\.getView\(\)/g)||[]).length,1);
  assert.doesNotMatch(source,/Math\.random|setTimeout|requestAnimationFrame|addEventListener|saveGame|loadGame/);
  for(const file of scriptOrderFromIndexHtml()){
    const text=fs.readFileSync(path.join(ROOT,file),'utf8');
    if(/content\/|interaction|quest|encounter|maps|npcs/.test(file))assert.doesNotMatch(text,/drawPartyCombatLabBattle|PARTY_COMBAT_ALLY_SLOTS/,file);
  }
});

module.exports={name:'Party Combat Lab visual convergence: authentic battle sprites, panel and isolation',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' Party Combat Lab visual convergence checks passed');}};
