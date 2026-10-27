'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(){
 const g=createContext();g.press('Enter');g.press('Enter');
 g.run(`window.Image=function(){};Object.defineProperty(window.Image.prototype,'src',{set:function(value){this._src=value;const a=Object.values(IMAGE_ASSET_REGISTRY).find(a=>a.path===value);this.naturalWidth=a.width;this.naturalHeight=a.height;this.onload();}});
 ['sera_liora_opening','sera_liora_courtyard','sera_liora_breakfast','sera_liora_storeroom'].forEach(preloadImageAssetBundle);`);
 assert.equal(g.run('seraLioraBreakfastBattle.preview()'),true);g.frames(40);return g;
}
const view=g=>J(g,'seraLioraBreakfastBattle.getView()');
function win(g){g.run('Math=Object.create(Math);Math.random=()=>.5');
 for(let i=0;i<150;i++){
  const v=view(g);if(v.phase==='victory')return;
  if(v.phase==='awaiting_action'&&v.selectedCommand!=='attack')g.press('ArrowRight');else g.press('Enter');
 }
 assert.fail('ordinary attacks must win');
}
module.exports={name:'Bethany grounded battles: planted animated feet, separate floor space, targeting and read-only presentation',run(){
 const g=fresh();record(g);g.run(`var spriteCalls=[],oldBeetleDraw=drawBreakfastBeetle;
 drawBreakfastBeetle=p=>{spriteCalls.push({...p,matrix:matrix.slice()});oldBeetleDraw(p);};`);
 for(const fight of [1,2]){
  const before=g.run('JSON.stringify({resources:seraLioraBreakfastBattle.getState(),stats,party:persistentParty.serialize(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),day})');
  const frames=view(g).enemies.map(()=>new Set()),feet=view(g).enemies.map(()=>new Set());
  g.run('Math=Object.create(Math);Math.random=()=>{throw Error("presentation consumed combat RNG")};');
  for(let i=0;i<50;i++){
   const v=g.run('seraLioraBreakfastBattle.getView()'),snapshot=JSON.stringify(v);
   assert.ok(Object.isFrozen(v));g.run('spriteCalls=[];paint=[]');g.renderFrame();
   assert.ok(J(g,'paint').some(p=>p.type==='fillRect'&&JSON.stringify(p.bounds)==='[0,0,512,480]'),'crop clears the whole prior scene, including UI margins');
   assert.equal(JSON.stringify(v),snapshot,'draw cannot mutate supplied immutable view');
   const calls=J(g,'spriteCalls'),layout=J(g,'partyBattleLayout(seraLioraBreakfastBattle.getView())');
   assert.equal(calls.length,fight===1?2:1);
   calls.forEach((p,j)=>{
    frames[j].add(p.frame);feet[j].add(p.matrix[3]);
    assert.equal(p.matrix[3],layout.enemies[j].anchorY,'sprite feet use layout ground');
    const bounds=J(g,`SERA_LIORA_BEETLE_BOUNDS[${p.frame}]`),h=32*p.matrix[1],w=(bounds[2]-bounds[0])*h/(bounds[3]-bounds[1]);
    assert.ok(p.matrix[3]-h>64&&p.matrix[3]+5<297,'whole body and shadow clear both UI panels');
    assert.ok(p.matrix[2]-w/2>0&&p.matrix[2]+w/2<512,'whole frame remains on screen');
    assert.ok(layout.allies.every(a=>a.x+32<p.matrix[2]-w/2),'enemies stay separate from hero silhouettes');
    if(j){const q=calls[j-1];assert.ok(q.matrix[2]+w/2<p.matrix[2]-w/2,'beetles do not overlap each other');}
   });
   g.run('seraLioraBreakfastBattle.update(1/60)');
  }
  frames.forEach(s=>assert.deepEqual([...s].sort(),[0,1,2],'all existing frames cycle'));feet.forEach(s=>assert.equal(s.size,1,'no vertical hovering'));
  assert.equal(g.run('JSON.stringify({resources:seraLioraBreakfastBattle.getState(),stats,party:persistentParty.serialize(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),day})'),before,'animation changes no gameplay state');
  if(fight===1)assert.notEqual(g.run('partyBattleLayout(seraLioraBreakfastBattle.getView()).enemies[0].frame'),g.run('partyBattleLayout(seraLioraBreakfastBattle.getView()).enemies[1].frame'),'pair has independent phases');
  g.press('Enter');assert.equal(view(g).phase,'targeting');
  const target=J(g,'partyBattleLayout(seraLioraBreakfastBattle.getView()).target'),position=J(g,'partyBattleLayout(seraLioraBreakfastBattle.getView()).enemies[0]');
  assert.equal(target.x,position.anchorX);assert.ok(target.y<position.anchorY-position.height,'cursor above the actual beetle');g.press('Escape');
  win(g);const dead=J(g,'partyBattleLayout(seraLioraBreakfastBattle.getView()).enemies.map(p=>p.frame)');g.frames(25);assert.deepEqual(J(g,'partyBattleLayout(seraLioraBreakfastBattle.getView()).enemies.map(p=>p.frame)'),dead,'dead poses stop');assert.ok(dead.every(p=>p===1));
  if(fight===1){g.press('Enter');for(let i=0;i<100&&g.run('dialogue.open');i++)g.press('Enter');g.frames(40);assert.equal(g.run('seraLioraBreakfastBattle.getState().fight'),2);}
 }
 // Unknown/mismatched staging fails closed, without altering the core session.
 for(const edit of ["stagingId:'missing'","stagingId:'bethany_courtyard'","presentationSeconds:NaN","presentationSeconds:-1"]){
  assert.throws(()=>g.run('partyBattleLayout(copyFormationData({...seraLioraBreakfastBattle.getView(),'+edit+'}))'));
 }
 assert.equal(g.run('SAVE_VERSION'),5);
}};
