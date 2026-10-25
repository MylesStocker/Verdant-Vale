'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {createContext} = require('../harness');
const J = (g, expression) => JSON.parse(g.run('JSON.stringify('+expression+')'));
function fresh(legacy=false) {
  const g=createContext();g.press('Enter');g.press('Enter');
  g.run(`forceLegacyRegionalView=${legacy};dialogue.open=false;`);return g;
}
function place(g,mapId,x=240,y=432) {
  const building=g.run(`mornayRoomForMap(${JSON.stringify(mapId)})?.id||null`);
  assert.equal(g.run(`transitionToLocation({mapId:${JSON.stringify(mapId)},x:${x},y:${y},state:{inTown:true,currentTownId:'mornay',townBuilding:${JSON.stringify(building)}}})`),true,mapId+' fixture placement');
  g.run('dialogue.open=false;');return g;
}
function until(g,key,predicate,max=300) {
  g.hold(key);try {for(let n=0;n<max;n++){g.frames();if(predicate())return;}}
  finally {g.release(key);}assert.fail('Held '+key+' did not reach expected destination');
}
function dismiss(g) {
  let n=0;while(g.run('dialogue.open')){assert.ok(n++<100,'dialogue terminates');g.press(' ');}
}
// Eight-pixel graph uses production player collision, checks the swept segment,
// excludes trigger tiles and records the first NPC the real interaction selects.
function reachable(g) {
  return J(g,`(()=>{
    const start=[player.x,player.y],queue=[start],seen=new Set([start.join(',')]),out=[];
    for(let i=0;i<queue.length;i++){
      const p=queue[i];out.push(p);
      for(const d of [[8,0],[-8,0],[0,8],[0,-8]]){
        const x=p[0]+d[0],y=p[1]+d[1],k=x+','+y;
        if(x<9||x>503||y<9||y>471||seen.has(k))continue;
        if(TILE_PROPERTIES[tileAt(x,y)]?.isTransition)continue;
        if(![.25,.5,.75,1].every(t=>canWalk(p[0]+d[0]*t,p[1]+d[1]*t)))continue;
        seen.add(k);queue.push([x,y]);
      }
    }return out;
  })()`);
}
function talk(g,id,points) {
  const npc=J(g,`MORNAY_NPCS.find(n=>n.id===${JSON.stringify(id)})`);
  points=points||reachable(g);
  const point=points.find(([x,y])=>{
    if(Math.hypot(x-npc.x,y-npc.y)>=g.run('TALK_RADIUS'))return false;
    return g.run(`SIMPLE_NPCS.find(n=>n.map===currentContentLocationKey()&&Math.hypot(${x}-n.x,${y}-n.y)<TALK_RADIUS)?.id`)===id;
  });
  assert.ok(point,id+' has a reachable, unshadowed interaction position');
  const map=g.run('mapIdForRef(activeMap)');place(g,map,...point);
  assert.equal(g.run('canWalk(player.x,player.y)'),true,id+' collision');
  g.press(' ');assert.equal(g.run('dialogue.open'),true,id+' opens through input');
  assert.equal(g.run('dialogue.name'),npc.name,id+' selected by real dispatcher');return npc;
}
function openService(g,service) {
  const r=J(g,`MORNAY_RESIDENTS.find(n=>n.service===${JSON.stringify(service)})`);
  place(g,r.mapId);talk(g,r.id);dismiss(g);
}
function seed(g,edit) {
  assert.equal(g.run('saveGame()'),true);
  g.run('var mornayFixture=JSON.parse(localStorage.getItem("verdantVale_save"));'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(mornayFixture));');
  assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false;');
}
module.exports={
  name:'Mornay manifest: distinct authored residents, stable room identities and registry ownership',
  J,fresh,place,until,dismiss,reachable,talk,openService,seed,
  run(){
    const g=fresh(),residents=J(g,'MORNAY_RESIDENTS'),npcs=J(g,'MORNAY_NPCS'),rooms=J(g,'MORNAY_BUILDINGS');
    const plan=fs.readFileSync(path.join(__dirname,'../../MORNAY_TOWN_PLAN.md'),'utf8').split('## Complete roster')[1].split('\n## ')[0];
    const planIds=Array.from(plan.matchAll(/^\| `(mornay_[a-z_]+)` \|/gm),m=>m[1]);
    assert.equal(planIds.length,300);assert.deepEqual(residents.map(n=>n.id).sort(),planIds.sort());
    assert.equal(new Set(residents.map(n=>n.id)).size,300);assert.equal(new Set(residents.map(n=>n.name)).size,300);
    const exteriors=new Set(J(g,'MORNAY_TOWN_MAP_IDS'));
    assert.equal(residents.filter(n=>exteriors.has(n.mapId)).length,101);
    assert.equal(residents.filter(n=>!exteriors.has(n.mapId)).length,199);
    assert.equal(rooms.length,44);assert.equal(new Set(rooms.map(b=>b.id)).size,44);assert.equal(new Set(rooms.map(b=>b.mapId)).size,44);
    assert.equal(new Set(rooms.filter(b=>exteriors.has(b.sourceMapId)).map(b=>b.id)).size,23);
    assert.equal(g.run('Object.keys(MAP_REGISTRY).length'),1107);
    for(const r of residents){
      const runtime=npcs.filter(n=>n.id===r.id);assert.equal(runtime.length,1,r.id);
      assert.equal(g.run(`SIMPLE_NPCS.filter(n=>n.id===${JSON.stringify(r.id)}).length`),1,r.id+' no registry overwrite');
      const n=runtime[0];assert.equal(n.map,'mornay:'+r.mapId.toLowerCase());assert.equal(n.x,r.x*32);assert.equal(n.y,r.y*32);
      assert.ok(n.solid);assert.equal(n.flag_required,null);assert.equal(n.flag_sets,null);assert.ok(r.text.trim().length>15);
      assert.ok(!['esla','lely'].includes(r.id));
    }
    const ties=residents.filter(n=>n.network);assert.equal(ties.length,9);
    assert.deepEqual(ties.filter(n=>n.network==='confirmed member').map(n=>n.id).sort(),['mornay_bram_fen','mornay_nessa_quill','mornay_tavi_rusk']);
    assert.ok(npcs.every(n=>!Object.hasOwn(n,'network')),'author classifications never enter runtime NPCs');
    for(const b of rooms){assert.equal(g.run(`mapIdForRef(MAP_REGISTRY[${JSON.stringify(b.mapId)}].map)`),b.mapId);assert.ok(residents.some(n=>n.mapId===b.mapId||n.dayOff?.mapId===b.mapId));}
  }
};
