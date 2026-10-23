'use strict';
const assert=require('assert/strict');
const {J,fresh,place,until}=require('./301-mornay-manifest.test');
module.exports={
 name:'Mornay doors and districts: all 44 reciprocal rooms and 46 directed streets through held controls in both views',
 run(){
  for(const legacy of [false,true]){
   const g=fresh(legacy),rooms=J(g,'MORNAY_BUILDINGS');
   for(const b of rooms){
    place(g,b.sourceMapId,(b.returnCol+.5)*32,(b.returnRow+.5)*32);
    const into=b.returnRow>b.doorRow?'ArrowUp':'ArrowDown';
    until(g,into,()=>g.run('mapIdForRef(activeMap)')===b.mapId);
    assert.equal(g.run('townBuilding'),b.id);assert.equal(g.run('currentTownId'),'mornay');
    assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),b.returnRow<b.doorRow?[240,48,'down']:[240,432,'up']);assert.equal(g.run('canWalk(player.x,player.y)'),true);
    assert.equal(g.run('saveGame()'),true);place(g,'MORNAY_WEST_GATE_MAP');assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false;');
    assert.equal(g.run('mapIdForRef(activeMap)'),b.mapId);assert.equal(g.run('townBuilding'),b.id);
    until(g,b.returnRow<b.doorRow?'ArrowUp':'ArrowDown',()=>g.run('mapIdForRef(activeMap)')===b.sourceMapId);
    assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),[(b.returnCol+.5)*32,(b.returnRow+.5)*32,b.facing]);
    assert.equal(g.run('townBuilding'),rooms.find(p=>p.mapId===b.sourceMapId)?.id||null);
    const away=b.facing==='up'?'ArrowUp':'ArrowDown';g.hold(away);g.frames(14);g.release(away);
    assert.equal(g.run('mapIdForRef(activeMap)'),b.sourceMapId,b.id+' continued departure cannot bounce indoors');
    assert.equal(g.run('canWalk(player.x,player.y)'),true);
   }
   const layout=J(g,'MORNAY_TOWN_LAYOUT');let count=0;
   const directions=[['north',0,-1,'ArrowUp',240,48,240,432],['south',0,1,'ArrowDown',240,432,240,48],['west',-1,0,'ArrowLeft',48,240,464,240],['east',1,0,'ArrowRight',464,240,48,240]];
   for(const source of layout)for(const [direction,dx,dy,key,x,y,lx,ly]of directions){
    const target=layout.find(d=>d.x===source.x+dx&&d.y===source.y+dy);if(!target)continue;
    place(g,source.id,x,y);until(g,key,()=>g.run('mapIdForRef(activeMap)')===target.id);
    assert.deepEqual(J(g,'[player.x,player.y]'),[lx,ly],source.id+' '+direction);assert.equal(g.run('canWalk(player.x,player.y)'),true);
    g.hold(key);g.frames(14);g.release(key);assert.equal(g.run('mapIdForRef(activeMap)'),target.id,'continued inward movement');
    assert.equal(g.run('regionalPlayerWorldPoint()'),null);assert.equal(g.run('townBuilding'),null);count++;
   }
   assert.equal(count,46);
  }
 }
};
