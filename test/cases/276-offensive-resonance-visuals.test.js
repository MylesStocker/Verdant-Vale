'use strict';
const assert=require('assert/strict'),fs=require('fs'),Module=require('module');
const {record}=require('./149-formation-battle-rendering.test');
function fixture(file,exports){const path=require.resolve(file),mod=new Module(path,module);mod.filename=path;mod.paths=module.paths;mod._compile(fs.readFileSync(path,'utf8')+'\nmodule.exports={'+exports+'};',path);return mod.exports;}
const {fresh,preview,view,room,resources,refs,spell,attack,commit,playback,firstSceneVictory,enterRoom,HIT}=fixture('./268-storeroom-story-battle.test','fresh,preview,view,room,resources,refs,spell,attack,commit,playback,firstSceneVictory,enterRoom,HIT');
const quick=fixture('./198-dialogue-and-quickbloom-presentation.test','fresh,reachLabQuickbloom');
const checks=[],test=(name,run)=>checks.push({name,run}),J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const source='seraLioraBreakfastBattle.getView()',animation='partyBattleOffensiveResonanceAnimation';
const blocks=g=>g.run(animation+'.blocksAdvance('+source+')');
function start(fight=1){const g=fresh({scene:true});preview(g);if(fight===2){firstSceneVictory(g);enterRoom(g);}return g;}
function seek(g,id){for(let n=0;view(g).playbackFrame?.currentEvent?.techniqueId!==id;n++){
 assert.ok(n<150,'expected real '+id+' event');assert.equal(view(g).phase,'playback');if(blocks(g))g.frames(1);else g.press('Enter');
 }assert.equal(view(g).phase,'playback');return view(g).playbackFrame.currentEvent;}
function state(g){return g.run('JSON.stringify({view:'+source+',scene:seraLioraBreakfastBattle.getState(),vfx:'+animation+'.getView(),quick:partyBattleQuickbloomAnimation.getView(),tick,day,calls})')+resources(g);}
function recording(g){if(g.offensivePaintRecording)return;g.offensivePaintRecording=true;record(g);g.run('ctx.arc=(x,y,r,start,end)=>ctx.ellipse(x,y,r,r);');}
function draw(g){g.run('paint=[];'+animation+'.draw('+source+')');return J(g,'paint');}
function centers(paint){return [...new Set(paint.filter(p=>p.type==='stroke').map(p=>JSON.stringify([
 Number(((p.bounds[0]+p.bounds[2])/2).toFixed(8)),Number(((p.bounds[1]+p.bounds[3])/2).toFixed(8)),
 ])))].map(s=>JSON.parse(s)).sort((a,b)=>a[0]-b[0]);}
function expectedCenters(g,event){const ids=event.hits?event.hits.map(hit=>hit.targetId):[event.targetId];
 return J(g,'partyBattleLayout('+source+').enemies').filter(e=>ids.includes(e.instanceId)).map(e=>[e.anchorX,e.anchorY-36]).sort((a,b)=>a[0]-b[0]);}
function hold(g,duration){
 // The ambient sprite clock may advance while the authenticated battle event is
 // held. Everything else in the view, including damage/history, must stay exact.
 const heldView=()=>{const {presentationSeconds,...battle}=view(g);return battle;};
 const initial=heldView(),initialSeconds=view(g).presentationSeconds,calls=g.run('calls'),before=room(g).resources,initialPaint=draw(g);
 assert.equal(blocks(g),true);g.press('Enter');assert.deepEqual(heldView(),initial,'confirm cannot skip an unstarted effect');
 g.frames(duration-1);assert.equal(blocks(g),true);assert.ok(Math.abs(g.run(animation+'.getView().frame')-(duration-1))<1e-8);g.press('Enter');assert.deepEqual(heldView(),initial,'confirm cannot skip the last visible frame');assert.notDeepEqual(draw(g),initialPaint,'effect geometry advances with presentation time');assert.ok(view(g).presentationSeconds>initialSeconds,'ambient animation continues during the held effect');
 assert.deepEqual(room(g).resources,before);assert.equal(g.run('calls'),calls);g.frames(1);assert.equal(blocks(g),false);assert.ok(Math.abs(g.run(animation+'.getView().frame')-duration)<1e-8);assert.deepEqual(draw(g),[],'completed effects disappear before playback continues');
 g.press('Enter');assert.ok(view(g).frameIndex>initial.frameIndex);assert.equal(g.run('calls'),calls);
}

test('real Null and Rainbow selections hold exact target events for 24/30 frames without advancing damage or Strain twice',()=>{
 const g=start(),before=resources(g);spell(g,'null',1);spell(g,'rainbow',0);const result=commit(g);
 assert.equal(result.outcome,'victory');const events=result.events.filter(e=>e.type==='resonance_damage');assert.deepEqual(events.map(e=>e.techniqueId),['null','rainbow']);
 const paints=[];
 for(const [id,duration]of [['null',24],['rainbow',30]]){
  const event=seek(g,id);assert.equal(event.targetId,result.before.enemies[id==='null'?1:0].instanceId);assert.ok(Object.isFrozen(g.run(source+'.playbackFrame.currentEvent')));
  g.run(animation+'.update('+source+',0)');recording(g);const beforeDraw=state(g),first=draw(g);assert.ok(first.length>0);assert.deepEqual(draw(g),first);assert.equal(state(g),beforeDraw);
  assert.deepEqual(centers(first),expectedCenters(g,event));assert.ok(first.every(p=>JSON.stringify(p.clip)==='[0,0,512,297]'));
  const strokes=first.filter(p=>p.type==='stroke'),strokeColors=[...new Set(strokes.map(p=>p.style.strokeStyle))];
  g.run('paint=[];drawPartyBattle('+source+')');const geometry=rows=>rows.map(p=>({bounds:p.bounds,clip:p.clip,color:p.style.strokeStyle,width:p.style.lineWidth,alpha:p.style.globalAlpha}));assert.deepEqual(geometry(J(g,'paint').filter(p=>p.type==='stroke'&&strokeColors.includes(p.style.strokeStyle))),geometry(strokes),'shared renderer includes the same effect geometry');
  assert.equal(state(g),beforeDraw);paints.push(first);hold(g,duration);
 }
 assert.notDeepEqual(paints[0],paints[1]);assert.ok(paints[0].some(p=>p.style.fillStyle==='#151124'));assert.ok(paints[1].filter(p=>p.type==='stroke').length>1);
 assert.equal(playback(g),'victory');assert.equal(resources(g),before);refs(g);g.run('resetSeraLioraBreakfast()');
});

for(const fight of [1,2])test('real Eclipse in fight '+fight+' animates every captured enemy for 42 frames and keeps shared resources isolated',()=>{
 const g=start(fight),before=resources(g);spell(g,'eclipse');spell(g,'eclipse');const result=commit(g,{combined:true});
 const event=seek(g,'eclipse');assert.equal(event.type,'resonance_damage_all');assert.deepEqual(event.hits.map(hit=>hit.targetId),result.before.enemies.map(e=>e.instanceId));assert.equal(event.hits.length,fight===1?2:1);
 g.run(animation+'.update('+source+',0)');recording(g);const beforeDraw=state(g),paint=draw(g);assert.deepEqual(centers(paint),expectedCenters(g,event));assert.ok(paint.some(p=>p.style.fillStyle==='#1b142c'));
 assert.deepEqual(draw(g),paint);assert.equal(state(g),beforeDraw);hold(g,42);assert.equal(playback(g),'victory');assert.equal(resources(g),before);refs(g);g.run('resetSeraLioraBreakfast()');
});

for(const [id,duration]of [['null',24],['rainbow',30]])test('storeroom '+id+' retains the exact single target and presentation duration after the first fight',()=>{
 const g=start(2),before=resources(g);if(id==='null'){spell(g,id);attack(g);}else{attack(g);spell(g,id);}
 const result=commit(g,id==='null'?{}:{execution:HIT});const event=seek(g,id);assert.equal(event.targetId,result.before.enemies[0].instanceId);
 g.run(animation+'.update('+source+',0)');recording(g);const beforeDraw=state(g),paint=draw(g);assert.deepEqual(centers(paint),expectedCenters(g,event));assert.equal(state(g),beforeDraw);
 hold(g,duration);assert.equal(playback(g),'victory');assert.equal(resources(g),before);refs(g);g.run('resetSeraLioraBreakfast()');
});

test('same-target cancellation never retargets or manufactures a Rainbow visual after Null kills that exact enemy',()=>{
 const g=start();spell(g,'null',0);spell(g,'rainbow',0);
 // The surviving beetle takes its ordinary turn; use the existing authored tape helper's fixed attack draw sequence.
 const result=commit(g,{execution:HIT});
 assert.equal(result.events.filter(e=>e.type==='resonance_damage').length,1);assert.ok(result.events.some(e=>e.type==='cancel'&&e.reason==='target_dead'));
 seek(g,'null');g.frames(24);g.press('Enter');let cancelled=false;
 for(let n=0;view(g).phase==='playback';n++){
  assert.ok(n<30);const event=view(g).playbackFrame.currentEvent;if(event?.type==='cancel'){cancelled=true;assert.equal(event.targetId,result.before.enemies[0].instanceId);}
  g.run(animation+'.update('+source+',0)');assert.equal(blocks(g),false);assert.equal(g.run(animation+'.draw('+source+')'),false);g.press('Enter');
 }
 assert.equal(cancelled,true);assert.equal(view(g).enemies[1].hp,result.before.enemies[1].hp);g.run('resetSeraLioraBreakfast()');
});

test('effect identity changes reset its clock; unrelated frames and scene reset retire it without altering either frozen event',()=>{
 const g=start();spell(g,'null',0);spell(g,'rainbow',1);commit(g);seek(g,'null');g.run('var firstOffenseView='+source+';'+animation+'.update(firstOffenseView,0)');g.frames(24);g.press('Enter');seek(g,'rainbow');g.run('var secondOffenseView='+source+';'+animation+'.update(secondOffenseView,0)');
 assert.equal(g.run(animation+'.getView().frame'),0);const history=g.run('JSON.stringify([firstOffenseView,secondOffenseView])');
 g.run(animation+'.update(secondOffenseView,0.05)');assert.equal(g.run(animation+'.getView().frame'),3);
 g.run(animation+'.update(firstOffenseView,0)');assert.equal(g.run(animation+'.getView().frame'),0);assert.equal(g.run('JSON.stringify([firstOffenseView,secondOffenseView])'),history);
 g.run(animation+'.reset()');assert.equal(g.run(animation+'.draw(secondOffenseView)'),false);assert.equal(g.run(animation+'.getView().active'),false);
 g.run(animation+'.update(secondOffenseView,0)');assert.equal(blocks(g),true);g.run('resetSeraLioraBreakfast()');assert.equal(g.run(animation+'.getView().active'),false);assert.equal(g.run('storyBattle.hasContext()'),false);
});

test('the established actual Quickbloom event stays on its independent clock and is ignored by offensive effects',()=>{
 const g=quick.fresh(),event=quick.reachLabQuickbloom(g);assert.equal(event.techniqueId,'quickbloom');g.run('var healingView=partyCombatLab.getView();partyBattleQuickbloomAnimation.update(healingView,0)');
 const before=g.run('JSON.stringify({view:healingView,quick:partyBattleQuickbloomAnimation.getView(),rng:presentationRng})');
 assert.equal(g.run(animation+'.update(healingView,0)'),false);assert.equal(g.run(animation+'.blocksAdvance(healingView)'),false);assert.equal(g.run(animation+'.draw(healingView)'),false);
 assert.equal(g.run('JSON.stringify({view:healingView,quick:partyBattleQuickbloomAnimation.getView(),rng:presentationRng})'),before);
 assert.equal(g.run('partyBattleQuickbloomAnimation.blocksAdvance(healingView)'),true);g.run('partyBattleQuickbloomAnimation.update(healingView,QUICKBLOOM_ANIMATION_FRAMES/60)');assert.equal(g.run('partyBattleQuickbloomAnimation.blocksAdvance(healingView)'),false);g.run('partyCombatLab.exit()');
});

module.exports={name:'Offensive Resonance presentation: real scene targets, exact holds and read-only deterministic effects',checks,run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' offensive Resonance visual checks passed');}};
