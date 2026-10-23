'use strict';
const assert=require('assert/strict');
const {J,fresh,place,until}=require('./301-mornay-manifest.test');
// Plan against live player collision, then execute exclusively with real held
// controls. Interior placement is never used to bypass a furnished parent room.
function pathTo(g,x,y){
 return J(g,`(()=>{
  const goal=[${x},${y}],start=[player.x,player.y],queue=[start],prev=new Map([[start.join(','),null]]);
  const clear=(a,b)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2);return Array.from({length:n+1},(_,i)=>{
   const t=n?i/n:0,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
   return !TILE_PROPERTIES[tileAt(x,y)]?.isTransition&&canWalk(x,y);
  }).every(Boolean);};
  for(let i=0;i<queue.length;i++){
   const p=queue[i],corner=[goal[0],p[1]];
   if(Math.abs(p[0]-goal[0])<8&&Math.abs(p[1]-goal[1])<8&&clear(p,corner)&&clear(corner,goal)){
    const out=[p];let k=p.join(',');while(prev.get(k)!==null){const q=prev.get(k);out.push(q);k=q.join(',');}
    return out.reverse().concat([corner,goal]);
   }
   for(const d of [[8,0],[-8,0],[0,8],[0,-8]]){
    const q=[p[0]+d[0],p[1]+d[1]],k=q.join(',');
    if(q[0]<9||q[0]>503||q[1]<9||q[1]>471||prev.has(k)||!clear(p,q))continue;
    prev.set(k,p);queue.push(q);
   }
  }return null;
 })()`);
}
function walk(g,x,y,label){
 const map=g.run('mapIdForRef(activeMap)');
 for(let attempt=0;attempt<6;attempt++){
  const points=pathTo(g,x,y);assert.ok(points,label+' has a collision-safe path from the actual entrance');
  let interrupted=false;
  for(let i=1;i<points.length;){
   const a=points[i-1],b=points[i],dx=Math.sign(b[0]-a[0]),dy=Math.sign(b[1]-a[1]);
   if(!dx&&!dy){i++;continue;}
   let j=i;
   while(j+1<points.length&&Math.sign(points[j+1][0]-points[j][0])===dx&&Math.sign(points[j+1][1]-points[j][1])===dy)j++;
   const end=points[j],distance=Math.abs(end[0]-a[0])+Math.abs(end[1]-a[1]);
   assert.equal(distance%g.run('SPEED'),0,'path uses ordinary movement increments');
   const key=dx<0?'ArrowLeft':dx>0?'ArrowRight':dy<0?'ArrowUp':'ArrowDown';
   g.hold(key);try{g.frames(distance/g.run('SPEED'));}finally{g.release(key);}
   assert.equal(g.run('mapIdForRef(activeMap)'),map,label+' cannot accidentally enter another door');
   if(g.run('player.x')!==end[0]||g.run('player.y')!==end[1]){interrupted=true;break;}
   i=j+1;
  }
  if(!interrupted){assert.deepEqual(J(g,'[player.x,player.y]'),[x,y],label);return;}
 }
 assert.fail(label+' remained blocked after live patrol replanning');
}
function enter(g,b){
 walk(g,(b.returnCol+.5)*32,(b.returnRow+.5)*32,b.id+' approach');
 until(g,b.returnRow>b.doorRow?'ArrowUp':'ArrowDown',()=>g.run('mapIdForRef(activeMap)')===b.mapId);
 assert.equal(g.run('townBuilding'),b.id);
 assert.deepEqual(J(g,'[player.x,player.y]'),[240,b.returnRow<b.doorRow?48:432],b.id+' actual arrival');
}
function leave(g,b,rooms){
 walk(g,240,b.returnRow<b.doorRow?48:432,b.id+' exit approach');
 until(g,b.returnRow<b.doorRow?'ArrowUp':'ArrowDown',()=>g.run('mapIdForRef(activeMap)')===b.sourceMapId);
 assert.equal(g.run('townBuilding'),rooms.find(p=>p.mapId===b.sourceMapId)?.id||null,b.id+' correct parent context');
 assert.equal(g.run('canWalk(player.x,player.y)'),true,b.id+' walkable return');
}
module.exports={
 name:'Mornay furnished circulation: walk every door from street/parent entrance, save nested rooms and walk fully outside on workday/Dayoff in both views',
 pathTo,walk,
 run(){
  for(const legacy of [false,true])for(const day of [1,5]){
   const g=fresh(legacy),rooms=J(g,'MORNAY_BUILDINGS');g.run(`day=${day};`);
   for(const b of rooms){
    const chain=[b];let parent=rooms.find(p=>p.mapId===b.sourceMapId);
    while(parent){chain.unshift(parent);parent=rooms.find(p=>p.mapId===parent.sourceMapId);}
    place(g,chain[0].sourceMapId);assert.equal(g.run('canWalk(player.x,player.y)'),true,'street arrival');
    for(const room of chain)enter(g,room);
    if(chain.length>1){
     assert.equal(g.run('saveGame()'),true,b.id+' nested save');
     place(g,'MORNAY_WEST_GATE_MAP');assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false;');
     assert.equal(g.run('mapIdForRef(activeMap)'),b.mapId);assert.equal(g.run('townBuilding'),b.id);
    }
    for(const room of chain.slice().reverse())leave(g,room,rooms);
    assert.equal(g.run('townBuilding'),null,b.id+' complete return to exterior');
   }
  }
 }
};
