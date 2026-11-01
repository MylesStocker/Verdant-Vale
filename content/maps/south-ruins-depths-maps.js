'use strict';

// Authored room order follows a three-column folded gallery. Missing links
// remain solid walls, not accidental shortcuts between neighbouring rooms.
// These are discrete interiors: no regional position, camera or seam changes.
const SOUTH_DEPTH_FLOORS = Object.freeze([
 {level:1,name:'The Fold',count:3,descent:2,stair:[12,11]},
 {level:2,name:'Blind Galleries',count:4,descent:3,stair:[12,3]},
 {level:3,name:'The Knotted Halls',count:5,descent:4,stair:[3,11]},
 {level:4,name:'The Inward Rooms',count:6,descent:5,stair:[3,11]},
 {level:5,name:'The Long Contraction',count:8,descent:6,stair:[3,3]},
 {level:6,name:'The Unquiet Bed',count:9,descent:7,stair:[12,3]},
].map(Object.freeze));
const SOUTH_DEPTH_COORDS=Object.freeze([[0,0],[1,0],[2,0],[2,1],[1,1],[0,1],[0,2],[1,2],[2,2]].map(Object.freeze));
const SOUTH_DEPTH_MAPS=[];
const SOUTH_DEPTH_DOORS=[];
const southDepthId=(level,room)=>'SOUTH_DEPTH_'+level+'_'+room+'_MAP';
function makeSouthDepthRoom(level,room){
 const g=Array.from({length:15},(_,y)=>Array.from({length:16},(_,x)=>x===0||x===15||y===0||y===14?DUNGEON3_WALL:DUNGEON3_FLOOR));
 // Increasingly indirect sightlines. Two-tile openings accommodate the player
 // body; none of the walls are fake or require guessing an invisible passage.
 for(let i=0;i<Math.min(2,level);i++){
  const x=i===0?5:10,gap=((room+i+level)%2)?3:10;
  for(let y=1;y<14;y++)if(y!==gap&&y!==gap+1)g[y][x]=DUNGEON3_WALL;
 }
 if(level>=3){
  // A third baffle makes the central bay double back on the lower floors.
  const gap=(room+level)%2?6:8;
  for(let x=6;x<10;x++)if(x!==gap&&x!==gap+1)g[7][x]=DUNGEON3_WALL;
 }
 // Port approaches are always connected to their own bay. The bay baffles
 // still govern travel across the room; only actual authored links are opened.
 return g;
}
for(const f of SOUTH_DEPTH_FLOORS)for(let r=0;r<f.count;r++){
 SOUTH_DEPTH_MAPS.push({id:southDepthId(f.level,r),level:f.level,room:r,
  name:'South Ruins — '+f.name+' / '+(r+1),map:makeSouthDepthRoom(f.level,r)});
}
SOUTH_DEPTH_MAPS.push({id:'SOUTH_DEPTH_VAULT_MAP',level:6,room:9,name:'South Ruins — The Last Coffer',vault:true,map:makeSouthDepthRoom(1,0)});
const southDepthMap=id=>SOUTH_DEPTH_MAPS.find(m=>m.id===id);
function southDepthDoor(source,col,row,target,x,y,facing,extra={}){
 SOUTH_DEPTH_DOORS.push(Object.freeze({source,col,row,target,x:(x+.5)*TILE,y:(y+.5)*TILE,facing,...extra}));
 const m=southDepthMap(source);if(m)m.map[row][col]=extra.stairs==='down'?DUNGEON_STAIRS_DOWN:extra.stairs==='up'?DUNGEON2_STAIRS_UP:HORROR_SECRET_EXIT;
}
for(const f of SOUTH_DEPTH_FLOORS){
 for(let r=1;r<f.count;r++){
  const a=SOUTH_DEPTH_COORDS[r-1],b=SOUTH_DEPTH_COORDS[r],from=southDepthId(f.level,r-1),to=southDepthId(f.level,r);
  if(b[0]>a[0]){southDepthDoor(from,14,7,to,2,7,'right');southDepthDoor(to,1,7,from,13,7,'left');}
  else if(b[0]<a[0]){southDepthDoor(from,1,7,to,13,7,'left');southDepthDoor(to,14,7,from,2,7,'right');}
  else {southDepthDoor(from,8,13,to,8,2,'down');southDepthDoor(to,8,1,from,8,12,'up');}
 }
 const [x,y]=f.stair,from=southDepthId(f.level,f.descent),to=f.level===6?'SOUTH_DEPTH_VAULT_MAP':southDepthId(f.level+1,0);
 southDepthDoor(from,x,y,to,3,4,'down',{stairs:'down'});
 southDepthDoor(to,3,3,from,x,y===3?4:10,y===3?'down':'up',{stairs:'up'});
}
// One reviewed cell in the old West Deeper Chamber; its existing 1000g chest
// at (8,13), tendon ascent and every previous route are preserved.
southDepthDoor('DUNGEON8_WEST_LOWER2_MAP',6,11,southDepthId(1,0),3,4,'down',{stairs:'down',gate:true});
southDepthDoor(southDepthId(1,0),3,3,'DUNGEON8_WEST_LOWER2_MAP',6,10,'up',{stairs:'up',state:{inDungeon:true,dungeonFloor:13}});
Object.freeze(SOUTH_DEPTH_MAPS);Object.freeze(SOUTH_DEPTH_DOORS);
