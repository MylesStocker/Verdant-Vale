'use strict';
const assert=require('assert/strict'),crypto=require('crypto');
const {createContext}=require('../harness');
const invariant=require('../fixtures/regional-geography-invariants.json');
const markerDeltas=require('../../Art/qa/mornay/overworld-marker-v1/grid-deltas.json');
const {beforeNorthShift}=require('../fixtures/mornay-north-history');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function graph(d){
 const chunks=d.chunks,idx=new Map(chunks.map((c,i)=>[c.mapId,i])),key=(id,x,y)=>idx.get(id)*240+y*16+x;
 function flood(id,x,y,cut=-1){const seen=new Uint8Array(chunks.length*240),q=[key(id,x,y)];seen[q[0]]=1;
  for(let n=0;n<q.length;n++){const p=q[n],ci=Math.floor(p/240),cell=p%240,y=Math.floor(cell/16),x=cell%16,c=chunks[ci];
   function add(id,x,y){const i=idx.get(id),v=i*240+y*16+x,t=chunks[i];if(v===cut||seen[v]||t.playerAccessible===false||!d.tiles[t.map[y][x]].walkable)return;seen[v]=1;q.push(v);}
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<16&&yy>=0&&yy<15)add(c.mapId,xx,yy);else{const edge=xx<0?'west':xx>15?'east':yy<0?'north':'south',i=dx?y:x;for(const s of d.edges[c.mapId]?.[edge]||[])if(i>=s.sourceRange[0]&&i<=s.sourceRange[1])add(s.targetMap,xx<0?15:xx>15?0:x,yy<0?14:yy>14?0:y);}}
  }return seen;
 }
 return {chunks,idx,key,flood};
}
function held(g,key,goal){g.hold(key);try{for(let i=0;i<300;i++){g.frames();if(goal())return;}}finally{g.release(key);}assert.fail('Control route failed: '+key);}
module.exports={name:'Mainland navigation: connected playable/reserved components, ferry/Rise cut sets, protected geography and negative-coordinate input/save lifecycle',graph,J,held,
 run(){
  const g=createContext(),d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})'),net=graph(d),cut=net.key('EASTERN_FENS_TRAVELLERS_RISE_MAP',10,7);
  const west=net.flood('MAP3',8,11,cut),middle=net.flood('EASTERN_BANK_MAP',5,8,cut),east=net.flood('EASTERN_FENS_WIDE_WATER_MAP',1,8,cut);
  assert.equal(west[net.key('EASTERN_BANK_MAP',5,8)],0,'new southern/western terrain cannot bypass the ferry');
  assert.equal(middle[net.key('EASTERN_FENS_WIDE_WATER_MAP',1,8)],0,'new loops cannot bypass the Rise ambush trigger');
  assert.equal(middle[net.key('EASTERN_FENS_MORNAY_THRESHOLD_MAP',8,10)],0,'Mornay remains on the far side of the Rise');
  assert.equal(net.flood('EASTERN_BANK_MAP',5,8)[net.key('EASTERN_FENS_MORNAY_THRESHOLD_MAP',8,10)],1,'ordinary route remains connected when the trigger is retained');
  const sealed=net.flood('MAINLAND_C2R6_MAP',10,0);
  assert.equal(west[net.key('MAINLAND_C2R6_MAP',10,0)],0,'southern countryside stays sealed from early travel');
  assert.equal(middle[net.key('MAINLAND_C2R6_MAP',10,0)],0,'the sealed bank has no new ferry-side entrance');
  assert.equal(east[net.key('MAINLAND_C2R6_MAP',10,0)],0,'the sealed bank has no invented later entrance');
  const oldIslands=new Set(invariant.originalUnreachableCells.map(([id,x,y])=>id+':'+x+','+y));
  for(const c of d.chunks){if(c.playerAccessible===false||(!c.mapId.startsWith('MAINLAND_')&&!invariant.reauthoredIds.includes(c.mapId)))continue;
   for(let y=0;y<15;y++)for(let x=0;x<16;x++)if(d.tiles[c.map[y][x]].walkable){const p=net.key(c.mapId,x,y);assert.ok(west[p]||middle[p]||east[p]||sealed[p]||oldIslands.has(c.mapId+':'+x+','+y),c.mapId+' return path '+x+','+y);}
  }
  for(const [id,fp]of Object.entries(invariant.protectedGrids)){
   const c=beforeNorthShift(d.chunks).find(c=>c.mapId===id),original=c.map.map(r=>r.slice());
   // Reverse only the explicitly reviewed later road/marker cells. Preserve the
   // original geography baseline and its assertions everywhere else.
   for(const delta of markerDeltas.filter(v=>v.mapId===id)){
    assert.equal(original[delta.row][delta.col],delta.toTile,id+' reviewed marker/road delta');
    original[delta.row][delta.col]=delta.fromTile;
   }
   assert.equal(crypto.createHash('sha256').update(JSON.stringify(original)).digest('hex'),fp,id+' protected terrain outside reviewed marker/road delta');
  }
  for(const id of invariant.originalAccessibleIds)assert.equal(g.run(`mapPlayerAccessible('${id}')`),true,id+' retains access');
  for(const [id,original]of Object.entries(invariant.approachGrids)){
   const c=d.chunks.find(c=>c.mapId===id);
   for(let y=0;y<15;y++)for(let x=0;x<16;x++){
    let allowed=id==='MAP3'?(y===14&&x>=10&&x<=12)||(y===13&&x>=9&&x<=12):id==='EASTERN_FENS_ENVELOPE_C9R4_MAP'?y>=7&&x>=7&&x<=9:id==='EASTERN_FENS_REEDBELT_N_MAP'?y<7&&x===7||y===1&&x===5||y===3&&x===9:id==='EASTERN_FENS_REEDBELT_E_MAP'?y<7&&x===8||y===1&&x===6||y===3&&x===10:y>=10&&y<=12&&x>=5&&x<=10;
    if(!allowed)assert.equal(c.map[y][x],original[y][x],id+' preserves original route/boardwalk '+x+','+y);
   }
  }
  for(const [id,point]of Object.entries(invariant.originalPlacements)){const c=d.chunks.find(c=>c.mapId===id);assert.deepEqual([c.chunkX,c.chunkY],point,id+' stable coordinate');}
  for(const legacy of [false,true]){
   const v=createContext();v.press('Enter');v.press('Enter');v.run(`debugMode=true;forceLegacyRegionalView=${legacy};`);
   const id=v.run("mapIdForChunk('overworld',-1,-8)"),target=v.run("mapIdForChunk('overworld',0,-8)"),s=J(v,`EDGE_TRANSITIONS[${JSON.stringify(id)}].east.find(s=>s.targetMap===${JSON.stringify(target)})`),row=Math.floor((s.sourceRange[0]+s.sourceRange[1])/2);
   assert.equal(v.run(`transitionToLocation({mapId:${JSON.stringify(id)},x:464,y:${row*32+16},facing:'right'})`),true);v.run('dialogue.open=false');
   const before=J(v,'regionalWorldPosition()');assert.ok(before.worldPxX<0);assert.equal(v.run('saveGame()&&loadGame()'),true);v.run('dialogue.open=false');assert.deepEqual(J(v,'regionalWorldPosition()'),before);
   held(v,'ArrowRight',()=>v.run('mapIdForRef(activeMap)')===target);assert.ok(v.run('regionalWorldPosition().worldPxX')>=0);assert.deepEqual(J(v,'regionalInvariantErrors()'),[]);
   assert.equal(v.run('SAVE_VERSION'),5);v.renderFrame();
  }
 }
};
