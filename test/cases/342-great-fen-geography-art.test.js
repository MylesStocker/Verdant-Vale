'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const T=require('./341-great-fen-tactics.test');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
module.exports={name:'Great Fen: physical encounter routing, unchanged road/Zolom, six animated sprites and safe rendering',run(){
 const g=createContext(),defs=J(g,'_REGIONAL_CHUNK_DEFINITIONS');
 const fen=defs.filter(d=>d.encounterProfileId==='great_fen');assert.equal(fen.length,174);
 assert.ok(fen.every(d=>d.region==='Great Fen'&&d.allowRandomEncounters&&d.playerAccessible!==false));
 for(const legacy of [false,true]){
  g.run('dialogue.open=false;forceLegacyRegionalView='+legacy);
  for(const d of fen){
   const row=d.map.findIndex(r=>r.some(t=>g.run('WALKABLE['+t+']'))),col=d.map[row].findIndex(t=>g.run('WALKABLE['+t+']'));
   assert.equal(g.run('transitionToLocation('+JSON.stringify({mapId:d.mapId,x:col*32+16,y:row*32+16,state:{}})+')'),true,d.mapId);
   assert.equal(g.run('currentEncounterPool()===GREAT_FEN_FORMATIONS'),true,d.mapId);
  }
 }
 for(const id of ['EASTERN_FENS_ENVELOPE_C7R0_MAP'])assert.equal(g.run('MAP_METADATA["'+id+'"].encounterPool===FEN_ZOLOM_ENEMY_TEMPLATES'),true);
 assert.equal(g.run('MAP_METADATA.EASTERN_FENS_MORNAY_THRESHOLD_MAP.encounterPool===EASTERN_FENS_MORNAY_HARD_FORMATIONS'),true);
 // Normal random dispatch also uses the shared engine for solo visitors.
 for(const party of [false,true]){
  const battle=T.fresh(null,party);battle.run('transitionToLocation({mapId:"GREAT_FEN_C3RN3_MAP",x:272,y:272,state:{}});startCombat();');
  assert.equal(T.view(battle).active,true);assert.ok(T.view(battle).enemies.every(e=>e.id==='enemy_peatback'||e.fenTactic));
 }
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
 const ids=J(g,'GREAT_FEN_ENEMY_TEMPLATES.map(e=>e.id)'),signatures=new Set();
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
 assert.equal(signatures.size,6);assert.equal(g.run('SAVE_VERSION'),5);
 console.log('  174 physical chunks in both movement modes; six distinct animated, bounded sprites; solo and party random entry');
}};
