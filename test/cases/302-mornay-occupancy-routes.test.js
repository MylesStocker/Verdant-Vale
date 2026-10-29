'use strict';
const assert=require('assert/strict');
const {J,fresh,place,reachable,talk,dismiss}=require('./301-mornay-manifest.test');
module.exports={
 name:'Mornay occupancy: all 311 conversations reachable on workday and Dayoff; patrols sweep safely, pause and resume',
 run(){
  for(const day of [1,5]){
   const g=fresh();g.run(`day=${day};`);
   const maps=J(g,'[...MORNAY_TOWN_MAP_IDS,...MORNAY_BUILDINGS.map(b=>b.mapId)]');
   let spoken=0;
   for(const map of maps){
    place(g,map);const points=reachable(g);assert.ok(points.length>20,map+' usable floor');
    const residents=J(g,`MORNAY_NPCS.filter(n=>n.map===mornayContentKey(${JSON.stringify(map)}))`);
    for(const r of residents){talk(g,r.id,points);dismiss(g);if(g.run('choice.open'))g.press('Escape');if(g.run('shop.open'))g.press('Escape');spoken++;}
    // Mandatory routes must remain in the same collision-reachable component.
    const required=map==='MORNAY_WATCHHOUSE_MAP'?[[240,80],[272,144]]:map.includes('GATE_BEDS')||map.includes('COMMERCIAL_BEDS')||g.run(`!!mornayRoomForMap(${JSON.stringify(map)})`)
      ? [[240,416],[240,400]] : [[240,240],[272,240]];
    for(const [x,y]of required)assert.ok(points.some(p=>p[0]===x&&p[1]===y),map+' clear central circulation '+x+','+y);
   }
   assert.equal(spoken,311);
  }
  const g=fresh(),patrols=J(g,'MORNAY_RESIDENTS.filter(n=>n.patrol)');assert.equal(patrols.length,12);
  for(const r of patrols){
   place(g,r.mapId);g.frames();
   const id=JSON.stringify(r.id),samples=new Set();
   for(let i=0;i<900;i++){
    const p=J(g,`(()=>{const n=MORNAY_NPCS.find(n=>n.id===${id});return [n.x,n.y]})()`);samples.add(p.join(','));
    assert.equal(g.run(`(()=>{const n=MORNAY_NPCS.find(n=>n.id===${id});return npcRouteCanOccupy(n,n.x,n.y,true)})()`),true,r.id+' live route pose');
    assert.ok(r.route.some((a,j)=>{const b=r.route[(j+1)%r.route.length],x=p[0]/32,y=p[1]/32;return x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)&&y>=Math.min(a.y,b.y)&&y<=Math.max(a.y,b.y)&&Math.abs((x-a.x)*(b.y-a.y)-(y-a.y)*(b.x-a.x))<.001;}),r.id+' confined to authored route');g.frames();
   }
   assert.ok(samples.size>30,r.id+' actually traverses route');
   for(let j=0;j<r.route.length;j++){
    const a=r.route[j],b=r.route[(j+1)%r.route.length],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*64);
    assert.equal(g.run(`(()=>{const n=MORNAY_NPCS.find(n=>n.id===${id});return Array.from({length:${steps+1}},(_,i)=>npcRouteCanOccupy(n,${a.x*32}+i*${(b.x-a.x)*32/steps||0},${a.y*32}+i*${(b.y-a.y)*32/steps||0},true)).every(Boolean)})()`),true,r.id+' half-pixel swept segment '+j);
   }
   talk(g,r.id);const frozen=J(g,`MORNAY_NPCS.find(n=>n.id===${id})`);g.frames(100);
   assert.deepEqual(J(g,`[MORNAY_NPCS.find(n=>n.id===${id}).x,MORNAY_NPCS.find(n=>n.id===${id}).y]`),[frozen.x,frozen.y]);dismiss(g);g.frames(800);
   assert.equal(g.run(`NPC_ROUTES[${id}].frozen`),false,r.id+' resumes after conversation');
  }
 }
};
