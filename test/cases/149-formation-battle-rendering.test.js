'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {scriptOrderFromIndexHtml,createContext}=require('../harness');
const ROOT=path.join(__dirname,'../..');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const HIT=[0.5,0.99,0.99];

// Existing mocked canvas, with draw-call recording and a small affine stack.
// Geometry is checked BEFORE clipping, so clipped-off sprites cannot pass fit
// checks. This is not a rasterizer and does not claim visual/browser inspection.
function record(g) {
  g.run(`var paint=[],matrix=[1,1,0,0],paintStack=[],paintPath=[],clipBox=null;
    ctx.globalAlpha=1;ctx.lineWidth=1;ctx.textAlign='left';ctx.textBaseline='alphabetic';
    const paintProps=['fillStyle','strokeStyle','font','lineWidth','globalAlpha','textAlign','textBaseline'];
    const point=(x,y)=>[matrix[0]*x+matrix[2],matrix[1]*y+matrix[3]];
    const box=(x,y,w,h)=>{const a=point(x,y),b=point(x+w,y+h);return [a[0],a[1],b[0],b[1]];};
    const emit=(type,args,bounds=null)=>paint.push({type,args,style:Object.fromEntries(paintProps.map(k=>[k,ctx[k]])),bounds,clip:clipBox});
    ctx.save=()=>paintStack.push({matrix:matrix.slice(),style:paintProps.map(k=>ctx[k]),clip:clipBox});
    ctx.restore=()=>{const s=paintStack.pop();matrix=s.matrix;clipBox=s.clip;paintProps.forEach((k,i)=>ctx[k]=s.style[i]);};
    ctx.translate=(x,y)=>{matrix[2]+=x*matrix[0];matrix[3]+=y*matrix[1];};
    ctx.scale=(x,y)=>{matrix[0]*=x;matrix[1]*=y;};
    ctx.fillRect=(x,y,w,h)=>emit('fillRect',[x,y,w,h],box(x,y,w,h));
    ctx.strokeRect=(x,y,w,h)=>emit('strokeRect',[x,y,w,h],box(x,y,w,h));
    ctx.beginPath=()=>{paintPath=[];};
    ctx.rect=(x,y,w,h)=>{const b=box(x,y,w,h);paintPath.push([b[0],b[1]],[b[2],b[3]]);};
    ctx.moveTo=ctx.lineTo=(x,y)=>paintPath.push(point(x,y));ctx.closePath=()=>{};
    ctx.ellipse=(x,y,rx,ry)=>{const b=box(x-rx,y-ry,rx*2,ry*2);paintPath.push([b[0],b[1]],[b[2],b[3]]);};
    const pathBounds=()=>[Math.min(...paintPath.map(p=>p[0])),Math.min(...paintPath.map(p=>p[1])),
      Math.max(...paintPath.map(p=>p[0])),Math.max(...paintPath.map(p=>p[1]))];
    ctx.clip=()=>{clipBox=pathBounds();};ctx.fill=()=>emit('fill',[],pathBounds());
    ctx.stroke=()=>emit('stroke',[],pathBounds());
    ctx.measureText=text=>({width:String(text).length*(parseInt(String(ctx.font).match(/\\d+/)?.[0])||12)*0.6});
    ctx.fillText=(text,x,y,maxWidth)=>{const size=parseInt(String(ctx.font).match(/\\d+/)?.[0])||12;
      const w=Math.min(ctx.measureText(text).width,maxWidth===undefined?Infinity:maxWidth);
      emit('text',[text,x,y,maxWidth],box(x,y-size,w,size+2));};`);
}
function fresh(count=2,ids=null) {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=()=>{throw Error('render must consume no RNG');};
    dialogue.open=false;menu.open=false;statusEffects=[];stats.hp=100;stats.maxHp=100;
    stats.atk=8;stats.def=2;stats.spd=7;stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;stats.items=[];`);
  const defaults=['enemy_marsh_wisp','enemy_briar_hound','enemy_sluice_slime'];
  g.run('initializeFormationState('+JSON.stringify(Array.from({length:count},(_,slot)=>({enemyId:(ids||defaults)[slot],slot})))+');');
  g.run('formationSessionController.begin();');record(g);return g;
}
function view(g) {return g.run('formationSessionController.getView()');}
function draw(g,expression='formationSessionController.getView()') {
  g.run('paint=[];drawCombat('+expression+');');return J(g,'paint');
}
function layout(g) {return J(g,'getFormationBattleLayout(formationSessionController.getView())');}
function snapshot(g) {
  return g.run(`JSON.stringify({stats,statusEffects,tick,day,dialogue,menu,
    combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>'value' in d).map(([k,d])=>[k,d.value])),
    mode:combat.mode,active:combat.active,observations:combat.enemies.map(e=>[e.observeCount,e.escapeUnlocked]),
    flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),sequence:combatEnemyInstanceSequence,
    session:formationSessionController.getView(),save:localStorage.getItem('verdantVale_save')})`);
}
function confirm(g,tape) {
  g.run(`var renderTape=${JSON.stringify(tape)},renderUsed=0;
    Math.random=()=>{if(renderUsed===renderTape.length)throw Error('tape exhausted');return renderTape[renderUsed++];};
    formationSessionController.confirmTarget();
    Math.random=()=>{throw Error('render must consume no RNG');};`);
  assert.equal(g.run('renderUsed'),tape.length);
}
function playback(g) {
  g.run('formationSessionController.beginAttack();');
  const n=g.run('combat.enemies.length');confirm(g,[...Array(n).fill(0),...Array(n+1).fill(HIT).flat()]);
}
const texts=calls=>calls.filter(c=>c.type==='text').map(c=>c.args[0]);
const cursors=calls=>calls.filter(c=>c.type==='fill'&&c.style.fillStyle==='#f0e8b8');
function verifyHP(g,calls,v=view(g)) {
  const recorded=calls.filter(c=>c.type==='text');
  assert.equal(recorded.find(c=>c.args[1]===251&&c.args[2]===369).args[0],`${v.player.hp} / ${v.player.maxHp}`);
  v.enemies.forEach((e,i)=>{
    const pos=layout(g)[i];
    assert.equal(recorded.find(c=>c.args[1]===pos.x+4&&c.args[2]===57).args[0],`${e.hp} / ${e.maxHp}`);
    const bar=calls.find(c=>c.type==='fillRect'&&c.style.fillStyle==='#3a8a5a'&&c.args[0]===pos.x+4&&c.args[1]===36);
    assert.equal(bar.args[2],Math.round((pos.width-8)*e.hp/e.maxHp));
  });
}
function within(inner,outer) {
  assert.ok(inner.every(Number.isFinite),JSON.stringify(inner));
  assert.ok(inner[0]>=outer[0]-1e-8&&inner[1]>=outer[1]-1e-8&&inner[2]<=outer[2]+1e-8&&inner[3]<=outer[3]+1e-8,
    JSON.stringify({inner,outer}));
}

for(const count of [2,3]) test(count+' stable non-overlapping slots, canvas bounds and only Attack',()=>{
  const g=fresh(count),positions=layout(g),calls=draw(g);
  assert.deepEqual(positions.map(p=>[p.x,p.width]),count===2?[[16,232],[264,232]]:[[16,144],[184,144],[352,144]]);
  positions.forEach((p,i)=>{if(i)assert.ok(positions[i-1].x+positions[i-1].width<p.x);});
  calls.forEach(c=>{if(c.bounds)within(c.bounds,[0,0,512,480]);});
  assert.equal(texts(calls).filter(t=>t==='Attack').length,1);
  for(const name of ['Item','Observe','Run','Magic','Skill'])assert.ok(!texts(calls).includes(name));
  assert.equal(cursors(calls).length,0);verifyHP(g,calls);
});

test('duplicate suffixes bind to fixed slots after death; unique names remain authored',()=>{
  const g=fresh(3,['enemy_marsh_wisp','enemy_marsh_wisp_early','enemy_briar_hound']);
  const before=layout(g);assert.deepEqual(before.map(e=>e.label),['Marsh Wisp A','Marsh Wisp B','Briar Hound']);
  g.run('combat.enemies[0].hp=0;');assert.deepEqual(layout(g),before);
  const calls=draw(g);assert.ok(calls.some(c=>c.clip&&c.style.globalAlpha===0.25));
  assert.equal(view(g).enemies.length,3);assert.equal(view(g).livingTargetInstanceIds.length,2);
});

test('exactly one high-contrast target indicator follows identity, wraps and skips dead slots',()=>{
  const g=fresh(3,['enemy_marsh_wisp','enemy_marsh_wisp','enemy_marsh_wisp']);
  g.run('combat.enemies[1].hp=0;formationSessionController.beginAttack();');
  for(const slot of [0,2,0]) {
    const p=layout(g)[slot],cursor=cursors(draw(g));assert.equal(cursor.length,1);
    assert.equal((cursor[0].bounds[0]+cursor[0].bounds[2])/2,p.x+p.width/2);
    assert.equal(view(g).selectedTargetInstanceId,view(g).enemies[slot].instanceId);
    g.run('formationSessionController.moveTarget("next");');
  }
  g.run('formationSessionController.cancelTargeting();');assert.equal(cursors(draw(g)).length,0);
});

test('awaiting and targeting views are frozen detached primitive roster snapshots',()=>{
  const g=fresh(),v=view(g),before=JSON.stringify(v);
  assert.ok(Object.isFrozen(v.player)&&Object.isFrozen(v.enemies));
  v.enemies.forEach((e,i)=>{assert.ok(Object.isFrozen(e));assert.notEqual(e,g.run('combat.enemies')[i]);});
  assert.throws(()=>{v.enemies[0].hp=0;},TypeError);assert.throws(()=>{v.player.hp=0;},TypeError);
  g.run('var historicalView=formationSessionController.getView();stats.hp=1;combat.enemies[0].hp=0;');
  assert.equal(JSON.stringify(v),before);
  const calls=draw(g,'historicalView');assert.ok(texts(calls).includes('100 / 100'));
  g.run('combat.enemy=null;');assert.deepEqual(draw(g,'historicalView'),calls,'cleanup cannot invalidate detached rendering');
});

for(const count of [2,3]) test(count+' members: every playback frame uses historical HP and drawing is inert',()=>{
  const g=fresh(count),pre=J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]');playback(g);
  assert.deepEqual([view(g).player.hp,...Array.from(view(g).enemies,e=>e.hp)],pre);
  assert.notDeepEqual(J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]'),pre);
  const live=J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]');
  do {
    const before=snapshot(g),calls=draw(g),v=view(g);verifyHP(g,calls,v);
    assert.equal(cursors(calls).length,0);assert.equal(snapshot(g),before);
    assert.deepEqual(J(g,'[stats.hp,...combat.enemies.map(e=>e.hp)]'),live);
    assert.equal(v.player.hp,v.playbackFrame.player.hp);
    v.enemies.forEach((e,i)=>assert.equal(e.hp,v.playbackFrame.enemies[i].hp));
    if(v.phase==='playback_complete')break;
    g.run('formationSessionController.advancePlayback();');
  } while(true);
  const final=draw(g);assert.deepEqual(draw(g),final);assert.ok(texts(final).includes('Round complete.'));
});

for(const outcome of ['victory','defeat']) test(outcome+' retains final history without rewards/recovery/cleanup',()=>{
  const g=fresh();
  g.run(outcome==='victory'?'stats.atk=100;combat.enemies[1].hp=0;':'stats.hp=1;');
  g.run('formationSessionController.beginAttack();');
  confirm(g,outcome==='victory'?[0,...HIT]:[0.99,0.99,...HIT]);
  while(view(g).phase==='playback')g.run('formationSessionController.advancePlayback();');
  const complete=view(g),before=snapshot(g);verifyHP(g,draw(g));assert.equal(snapshot(g),before);
  g.run('formationSessionController.acknowledgePlayback();');
  assert.equal(view(g).phase,outcome);assert.deepEqual(view(g).playbackFrame,complete.playbackFrame);
  const terminal=snapshot(g),calls=draw(g);assert.equal(snapshot(g),terminal);verifyHP(g,calls);
  assert.ok(texts(calls).includes(outcome==='victory'?'VICTORY':'DEFEATED'));
  assert.equal(cursors(calls).length,0);assert.equal(g.run('combat.active'),false);
});

test('pure formatter covers attacks, criticals, evasion, skips, cancellations and outcomes without reason codes',()=>{
  const g=fresh();playback(g);
  const e=J(g,'formationSessionController.getView().playbackFrame');assert.equal(e.currentEvent,null);
  const labels=layout(g),base={type:'attack',actorId:'player',targetId:labels[0].instanceId,appliedDamage:7,critical:false,evaded:false};
  const format=event=>g.run('formatFormationBattleEvent('+JSON.stringify(event)+',"Player",'+JSON.stringify(labels)+')');
  assert.equal(format(base),'Player attacks Marsh Wisp for 7 damage.');
  assert.match(format({...base,critical:true}),/^Critical!/);
  assert.match(format({...base,evaded:true}),/evades/);
  assert.equal(format({...base,type:'skip',reason:'actor_dead'}),'Player cannot act.');
  assert.equal(format({...base,type:'cancel',reason:'target_unavailable'}),"Player's attack is cancelled.");
  for(const outcome of ['ongoing','victory','defeat'])assert.ok(format({type:'outcome',outcome}));
  assert.throws(()=>format({...base,targetId:'enemy_marsh_wisp'}),/identity/);
});

test('all eight registered sprite silhouettes fit before clipping across idle animation extrema',()=>{
  const initial=fresh(),ids=J(initial,'FORMATION_STATE_TEMPLATE_IDS');assert.equal(ids.length,8);
  for(const id of ids) {
    const g=fresh(3,[id,id,id]);
    for(let tick=0;tick<320;tick+=7) {
      g.run('tick='+tick+';');const calls=draw(g),positions=layout(g);
      const spriteCalls=calls.filter(c=>c.clip);assert.ok(spriteCalls.length>0);
      spriteCalls.forEach(c=>within(c.bounds,c.clip));
      positions.forEach(p=>within([p.spriteX,p.spriteY,p.spriteX+p.spriteWidth,p.spriteY+p.spriteHeight],[0,76,512,212]));
      assert.ok(positions.every(p=>p.scale<=1));
    }
  }
});

test('invalid views and dead-target indicators fail before drawing, never fall back to singleton',()=>{
  const g=fresh();
  for(const source of ['null','{}','Object.freeze({...formationSessionController.getView(),phase:"bad"})',
    'Object.freeze({...formationSessionController.getView(),phase:"targeting",selectedTargetInstanceId:"unknown"})']) {
    const before=snapshot(g);g.run('paint=[];');assert.throws(()=>g.run('drawCombat('+source+')'),/Invalid formation presentation/);
    assert.equal(g.run('paint.length'),0);assert.equal(snapshot(g),before);
  }
  g.run('combat.enemies[0].hp=0;');
  assert.throws(()=>g.run('drawCombat(Object.freeze({...formationSessionController.getView(),phase:"targeting",selectedTargetInstanceId:combat.enemies[0].instanceId}))'),/Invalid formation presentation/);
  assert.throws(()=>g.run('drawCombat()'),/no singleton/);
});

test('renderer has no controller/gameplay side effects or live HP reads, and no supported route',()=>{
  const g=fresh();playback(g);g.run('var frozenView=formationSessionController.getView();');
  const before=snapshot(g);
  g.run(`var originalProjection=projectFormationPlaybackFrame;
    resolveFormationBasicAttackRound=createFormationRoundPlayback=projectFormationPlaybackFrame=
    handleCombatAction=advanceCombatMessage=applyKillRewards=endCombat=saveGame=function(){throw Error('renderer called gameplay');};`);
  draw(g,'frozenView'); // getView also calls projection; use the previously supplied view.
  g.run('projectFormationPlaybackFrame=originalProjection;');assert.equal(snapshot(g),before);
  const source=fs.readFileSync(path.join(ROOT,'render-battle.js'),'utf8');
  const formation=source.slice(source.indexOf('const FORMATION_SPRITE_BOUNDS'),source.indexOf('// ─── Combat Screen'));
  assert.doesNotMatch(formation,/combat\.|stats\.|Math\.random|formationSessionController|projectFormationPlaybackFrame|resolveFormation|applyKillRewards|saveGame|endCombat|hasStatusEffect/);
  for(const file of scriptOrderFromIndexHtml()) {
    const s=fs.readFileSync(path.join(ROOT,file),'utf8');
    if(file!=='render-battle.js')assert.doesNotMatch(s,/drawFormationCombat|getFormationBattleLayout|formatFormationBattleEvent/,file);
    if(!['combat.js','formation-lab.js'].includes(file))assert.doesNotMatch(s,/initializeFormationState/,file);
    if(!['combat.js','input.js','render.js','formation-lab.js'].includes(file))assert.doesNotMatch(s,/formationSessionController/,file);
    if(file==='render.js')assert.match(s,/formationCombatLab\.isActive\(\)/);
    if(file==='input.js') {
      assert.match(s,/combat\.mode === 'formation' && formationSessionController\.getView\(\)/);
      assert.doesNotMatch(s,/formationSessionController\.(begin|clearAfterCombatCleanup)\(/);
    }
  }
  const route=fresh();route.run('var formationDrawCalls=0;drawFormationCombat=()=>{formationDrawCalls++;};render();');
  route.press('ArrowLeft');route.press('Enter');assert.equal(route.run('formationDrawCalls'),0);
  assert.equal(route.run('combat.active'),false);assert.equal(view(route).phase,'targeting');
  assert.equal(view(route).playbackFrame,null); // one accept selects, never resolves or renders
});

test('evaded and critical actual resolver events render their recorded HP, not recalculated damage',()=>{
  for(const roll of [0,0.99]) {
    const g=fresh();g.run('formationSessionController.beginAttack();');
    // Variance, critical, evasion; roll zero exercises evasion and critical,
    // while .99 exercises a critical that lands. Other attacks are ordinary.
    confirm(g,[0,0,0.5,0,roll,...HIT,...HIT]);
    g.run('formationSessionController.advancePlayback();');
    const v=view(g),event=v.playbackFrame.currentEvent;
    assert.equal(event.type,'attack');assert.equal(event.critical,true);
    const before=snapshot(g),calls=draw(g);assert.equal(snapshot(g),before);verifyHP(g,calls);
    const message=texts(calls).filter(t=>/evades|Critical!/.test(t)).join(' ');
    assert.match(message,event.evaded?/evades/:/Critical!/);
  }
});

test('zero-HP actor skip event retains the same dead slot without showing a target cursor',()=>{
  const g=fresh();g.run('stats.atk=100;formationSessionController.beginAttack();');
  confirm(g,[0,0,...HIT,...HIT]); // killed target skips its attack RNG
  let found=false;
  while(view(g).phase==='playback') {
    g.run('formationSessionController.advancePlayback();');
    const v=view(g),before=snapshot(g),calls=draw(g);assert.equal(snapshot(g),before);verifyHP(g,calls);
    if(v.playbackFrame.currentEvent?.type==='skip') {
      found=true;assert.equal(v.enemies[0].hp,0);assert.equal(v.enemies[0].slot,0);
      assert.equal(cursors(calls).length,0);assert.ok(texts(calls).some(t=>t.includes('cannot act.')));
    }
  }
  assert.equal(found,true);assert.equal(view(g).playbackFrame.outcome,'ongoing');
});

test('presentation roster is unsaved and rendering never writes the current save payload',()=>{
  const g=fresh();g.run("resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);saveGame();");
  const saved=g.run("localStorage.getItem('verdantVale_save')");
  const before=snapshot(g);draw(g);assert.equal(snapshot(g),before);
  assert.equal(g.run("localStorage.getItem('verdantVale_save')"),saved);
  assert.doesNotMatch(saved,/formationSession|playback|templateId|combat_enemy_|selectedTargetInstanceId/);
});

test('singleton rendering source is unchanged after inlining the exact extracted background',()=>{
  const s=fs.readFileSync(path.join(ROOT,'render-battle.js'),'utf8');
  const background=s.slice(s.indexOf('function drawBattleBackground() {'),s.indexOf('\nfunction drawCombat(formationView)'));
  const body=background.slice(background.indexOf('  // ── Battle field'),background.lastIndexOf('\n}'));
  const reconstructed=s.slice(s.indexOf('function drawCombat(formationView)'))
    .replace('function drawCombat(formationView)', 'function drawCombat()')
    .replace('  // Explicit presentation-only entry. Normal render() still calls with no\n  // arguments; this does not activate combat or acquire a session implicitly.\n  if (arguments.length) return drawFormationCombat(formationView);\n','')
    .replace('  drawBattleBackground();',body);
  const normalized=reconstructed.split('\n').map(line=>line.trim()).filter(Boolean).join('\n');
  // Pre-increment drawCombat source: no existing singleton statement changed.
  assert.equal(crypto.createHash('sha256').update(normalized).digest('hex'),'5948dec2907864c7efe4d862eca1fcb1833eed52236f084f5a9d0352399e35e0');
});

module.exports={name:'read-only formation presentation: stable slots, historical HP and no gameplay routing',checks,record,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' formation rendering checks passed');}};
