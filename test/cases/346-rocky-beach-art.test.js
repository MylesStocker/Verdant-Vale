'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const T=require('./341-great-fen-tactics.test');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
module.exports={name:'Rocky Beach: distinct deterministic terrain, animated bounded fauna and constant-work live geography',run(){
 const g=createContext();
 const art=createContext();art.run(`var paints=[],path=[],stack=[],tr=[1,1,0,0];
  var point=(x,y)=>[x*tr[0]+tr[2],y*tr[1]+tr[3]];
  var paint=(ps,pad=0)=>{if(ps.length)paints.push({colour:ctx.fillStyle,bounds:[Math.min(...ps.map(p=>p[0]))-pad,Math.min(...ps.map(p=>p[1]))-pad,Math.max(...ps.map(p=>p[0]))+pad,Math.max(...ps.map(p=>p[1]))+pad]});};
  ctx.save=()=>stack.push({tr:[...tr],c:ctx.fillStyle});ctx.restore=()=>{const s=stack.pop();tr=s.tr;ctx.fillStyle=s.c;};
  ctx.translate=(x,y)=>{tr[2]+=x*tr[0];tr[3]+=y*tr[1];};ctx.scale=(x,y)=>{tr[0]*=x;tr[1]*=y;};
  ctx.fillRect=(x,y,w,h)=>paint([point(x,y),point(x+w,y+h)]);
  ctx.beginPath=()=>{path=[];};ctx.moveTo=ctx.lineTo=(x,y)=>path.push(point(x,y));ctx.closePath=()=>{};
  ctx.ellipse=(x,y,rx,ry)=>path.push(point(x-rx,y-ry),point(x+rx,y+ry));
  ctx.fill=()=>paint(path);ctx.stroke=()=>paint(path,(ctx.lineWidth||1)/2);
  Math=Object.create(Math);Math.random=()=>{throw Error('Rendering RNG')};`);
 const ids=J(g,'ROCKY_BEACH_ENEMY_TEMPLATES.map(e=>e.id)'),signatures=new Set();
 for(const id of ids){
  const bounds=J(art,'FORMATION_SPRITE_BOUNDS.get(ENEMY_SPRITE_DISPATCH["'+id+'"].draw)');assert.ok(bounds);
  const phases=new Set();
  for(const tick of [0,13,39,81]){
   art.run('paints=[];tick='+tick+';ENEMY_SPRITE_DISPATCH["'+id+'"].draw(0,0)');const paints=J(art,'paints');
   assert.ok(paints.length>10);for(const p of paints)assert.ok(p.bounds.every(Number.isFinite)&&p.bounds[0]>=bounds[0]&&p.bounds[1]>=bounds[1]&&p.bounds[2]<=bounds[2]&&p.bounds[3]<=bounds[3],id+' '+JSON.stringify(p.bounds)+' exceeds '+JSON.stringify(bounds));
   phases.add(JSON.stringify(paints));if(!tick)signatures.add(JSON.stringify(paints));
  }
  assert.ok(phases.size>1,id+' has idle motion');
  for(const n of [1,2,3]){
   const b=T.fresh(Array(n).fill(id.slice(6))),before=b.run('JSON.stringify({stats,combat:canonicalPartyCombat.getView()})');
   b.run('Math.random=()=>{throw Error("render RNG")};drawPartyBattle(canonicalPartyCombat.getView())');assert.equal(b.run('JSON.stringify({stats,combat:canonicalPartyCombat.getView()})'),before);
  }
 }
 assert.equal(signatures.size,2);
 // Tile art remains stable, inside its own cell, and distinct from inland gravel.
 art.run('paints=[];tr=[1,1,0,0];drawTile(ROCKY_BEACH,0,0)');const beach=J(art,'paints');
 assert.ok(beach.length>20);for(const p of beach)assert.ok(p.bounds[0]>=0&&p.bounds[1]>=0&&p.bounds[2]<=32&&p.bounds[3]<=32);
 art.run('paints=[];tick=999;drawTile(ROCKY_BEACH,0,0)');assert.deepEqual(J(art,'paints'),beach);
 art.run('paints=[];drawTile(GRAVEL_BAR,0,0)');assert.notDeepEqual(J(art,'paints'),beach);
 // Bounded live lookup, no scan/cache, no RNG or state writes.
 g.run(`transitionToLocation({mapId:'VALMERE_EXPANSE_C14RN3_MAP',x:304,y:176,state:{}});
  var entry=mapEntryForId('VALMERE_EXPANSE_C14RN3_MAP'),original=entry.map[5],reads=0;
  entry.map[5]=new Proxy(original,{get(target,key){if(/^\\d+$/.test(String(key)))reads++;return target[key]}});
  Math=Object.create(Math);Math.random=()=>{throw Error('geography RNG')};`);
 const before=g.run('JSON.stringify({stats,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),world:regionalWorldPosition()})');
 for(let i=0;i<50;i++)assert.equal(g.run('currentEncounterPool()===ROCKY_BEACH_ENEMY_TEMPLATES'),true);
 assert.equal(g.run('reads'),50,'one canonical tile read per lookup');
 assert.equal(g.run('JSON.stringify({stats,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),world:regionalWorldPosition()})'),before);
 g.run('original[9]=GRASS');assert.equal(g.run('currentEncounterPool()===entry.encounterPool'),true,'underlying live grid change is immediately reflected');
 g.run('original[9]=ROCKY_BEACH;entry.map[5]=original');
}};
