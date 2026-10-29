'use strict';
const assert=require('assert/strict');
const {J,fresh,place,reachable,dismiss}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
module.exports={
 name:'Mornay streets and housing facades: ordinary controls traverse every live street arm; cosmetic doors remain solid and cannot enter rooms or change progression',
 run(){
  const g=fresh(),layout=J(g,'MORNAY_TOWN_LAYOUT');
  const arms=[[0,-1,240,48],[0,1,240,432],[-1,0,48,240],[1,0,464,240]];
  for(const day of [1,5]){
   g.run(`day=${day};`);
   for(const map of layout){
    place(g,map.id);walk(g,240,240,map.id+' central street');
    for(const [dx,dy,x,y]of arms){
     if(!layout.some(n=>n.x===map.x+dx&&n.y===map.y+dy)||(map.id==='MORNAY_OLD_FORT_MAP'&&dx===1)||(map.id==='MORNAY_FLECK_NECK_MAP'&&dx===-1))continue;
     walk(g,x,y,map.id+' complete street arm '+dx+','+dy);
     assert.equal(g.run('mapIdForRef(activeMap)'),map.id,'approaching edge does not change location prematurely');
    }
   }
   for(const home of J(g,'MORNAY_RESIDENTIAL_FACADES')){
    place(g,home.mapId);const x=(home.col+.5)*32,y=(home.row+.5)*32;
    assert.equal(g.run(`activeMap[${home.row}][${home.col}]===TOWN_BUILDING`),true,'facade retains solid building tile');
    assert.equal(g.run(`canWalk(${x},${y})`),false,'painted front door has no walkable entrance');
    assert.equal(g.run(`mornayDoorAt(${JSON.stringify(home.mapId)},${home.col},${home.row})`),null,'no room registered at cosmetic door');
    const points=reachable(g).sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y));
    assert.ok(points.length&&Math.hypot(points[0][0]-x,points[0][1]-y)<=64,'facade visible from reachable street');
    walk(g,...points[0],home.mapId+' facade approach');
    const before=J(g,'({party:persistentParty.getView(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),day})');
    const dx=x-g.run('player.x'),dy=y-g.run('player.y');
    const key=Math.abs(dx)>Math.abs(dy)?(dx<0?'ArrowLeft':'ArrowRight'):(dy<0?'ArrowUp':'ArrowDown');
    g.hold(key);try{g.frames(32);}finally{g.release(key);}
    assert.equal(g.run('canWalk(player.x,player.y)'),true,'pushing into facade preserves valid street placement');
    g.press(' '); // A nearby authored NPC/notice may answer, but the facade never becomes an entrance.
    assert.equal(g.run('mapIdForRef(activeMap)'),home.mapId);assert.equal(g.run('townBuilding'),null);
    assert.deepEqual(J(g,'({party:persistentParty.getView(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),day})'),before,'facade push/action grants no progression or persistent state');
    if(g.run('choice.open||shop.open'))g.press('Escape');dismiss(g);
   }
  }
 }
};
