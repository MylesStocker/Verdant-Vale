'use strict';
// Discrete guesthouse expedition. Physical walls/water own collision; one
// regional entrance, no new seam, camera policy or regional travel connection.
const LANTERN_FIXTURES={
 HALL:[['table',7,6],['bench',5,6],['cabinet',13,3],['desk',3,3],['stove',12,9]],
 BUNKS:[['homebed',2,2],['homebed',5,2],['homebed',10,2],['homebed',12,6],['table',5,8],['cabinet',2,10]],
 ORCHARD:[['bench',3,9],['cargo',12,9]],
 INTAKE:[['cargo',3,9],['table',11,10]],
 COPSE:[['cargo',12,3]],
};
const LANTERN_MAPS=(()=>{
 const room=()=>Array.from({length:15},(_,y)=>Array.from({length:16},(_,x)=>x===0||x===15||y===0||y===14?INTERIOR_WALL:INTERIOR_FLOOR));
 const outside=()=>Array.from({length:15},(_,y)=>Array.from({length:16},(_,x)=>x===0||x===15||y===0||y===14?TREE:GRASS));
 const specs=[['TRACK','Lantern House — Old Guest Road'],['GULLY','Lantern House — Fallen Timber'],['ORCHARD','Lantern House — Orchard'],['HALL','Lantern House — Common Room'],['BUNKS','Lantern House — Guest Rooms'],['CHANNEL','Lantern House — Water Steps'],['BEND','Lantern House — Reed Cut'],['INTAKE','Lantern House — Upper Intake'],['COPSE','Lantern House — Old Store']];
 const defs=specs.map(([key,name])=>({key,id:'LANTERN_'+key+'_MAP',name,contentKey:'lantern_'+key.toLowerCase(),indoor:['HALL','BUNKS'].includes(key),map:['HALL','BUNKS'].includes(key)?room():outside()}));
 const get=k=>defs.find(d=>d.key===k).map;
 // A winding climb around two long wooded shelves, with generous turning bays.
 for(let y=3;y<=5;y++)for(let x=1;x<=10;x++)get('TRACK')[y][x]=TREE;
 for(let y=9;y<=10;y++)for(let x=5;x<=14;x++)get('TRACK')[y][x]=TREE;
 for(let y=1;y<14;y++){get('GULLY')[y][5]=RUIN_WALL;get('GULLY')[y][10]=TREE;}
 for(const y of [9,10,11])get('GULLY')[y][5]=GRASS;
 for(const y of [3,4,5])get('GULLY')[y][10]=GRASS;
 // Guesthouse occupies the north side; its service path skirts the east wall.
 for(let y=1;y<=5;y++)for(let x=4;x<=11;x++)get('ORCHARD')[y][x]=TOWN_BUILDING;
 for(const [x,y]of [[2,3],[2,5],[13,3],[13,6],[2,11]])get('ORCHARD')[y][x]=TREE;
 // The little feeder is existing water, not water summoned by Neris. Each room
 // has a continuous winding bank; the cut's narrow crossing is ordinary bridge.
 for(const key of ['CHANNEL','BEND','INTAKE']){
  const g=get(key);for(let y=1;y<14;y++){const bank=key==='BEND'?5+Math.floor(y/4):10+Math.floor(y/5);for(let x=bank;x<15;x++)g[y][x]=WATER;}
 }
 for(let x=5;x<14;x++)get('BEND')[7][x]=BRIDGE_DECK;
 for(let y=1;y<=5;y++)for(let x=2;x<=5;x++)get('COPSE')[y][x]=TREE;
 for(let y=8;y<14;y++)for(let x=7;x<11;x++)get('COPSE')[y][x]=TREE;
 // Worn trails make the safe bends legible; only already-walkable grass changes.
 const trails={TRACK:[[2,13],[2,7],[12,7],[12,1]],GULLY:[[2,13],[2,10],[7,10],[7,4],[12,4],[12,1]],ORCHARD:[[7,13],[7,6],[13,6],[13,1]],CHANNEL:[[3,13],[3,1]],BEND:[[2,13],[2,7],[3,7],[3,1]],INTAKE:[[3,13],[3,6],[6,6],[6,4]],COPSE:[[3,13],[3,7],[12,7],[12,3]]};
 for(const [key,points]of Object.entries(trails))for(let i=1;i<points.length;i++){
  let [x,y]=points[i-1];const [tx,ty]=points[i];
  while(x!==tx||y!==ty){if(get(key)[y][x]===GRASS)get(key)[y][x]=PATH;x+=Math.sign(tx-x);y+=Math.sign(ty-y);}
  if(get(key)[y][x]===GRASS)get(key)[y][x]=PATH;
 }
 // Bedrooms open onto a common passage, rather than one empty dormitory box.
 for(let y=1;y<=5;y++)for(const x of [4,8,11])get('BUNKS')[y][x]=INTERIOR_WALL;
 for(const d of defs)for(const [kind,col,row]of LANTERN_FIXTURES[d.key]||[])d.map[row][col]=TABLE;
 return Object.freeze(defs.map(Object.freeze));
})();
const LANTERN_CONTENT_KEYS=Object.freeze(Object.fromEntries(LANTERN_MAPS.map(m=>[m.id,m.contentKey])));
const LANTERN_DOORS=(()=>{
 const doors=[];
 // South exits and north entrances, with landings off all trigger cells.
 doors.push({source:'MAINLAND_C20R0_MAP',col:7,row:3,target:'LANTERN_TRACK_MAP',x:80,y:400,facing:'up'});
 doors.push({source:'LANTERN_TRACK_MAP',col:2,row:13,target:'MAINLAND_C20R0_MAP',x:240,y:144,facing:'down'});
 // Handwritten arrival orientation for the south-to-north outdoor progression.
 const forward=(a,ac,ar,b,bc,br,gate={})=>{
  doors.push({source:'LANTERN_'+a+'_MAP',col:ac,row:ar,target:'LANTERN_'+b+'_MAP',x:(bc+.5)*32,y:(br-.5)*32,facing:'up',...gate});
  doors.push({source:'LANTERN_'+b+'_MAP',col:bc,row:br,target:'LANTERN_'+a+'_MAP',x:(ac+.5)*32,y:(ar+1.5)*32,facing:'down'});
 };
 forward('TRACK',12,1,'GULLY',2,13,{wins:1});
 forward('GULLY',12,1,'ORCHARD',7,13,{wins:3});
 forward('ORCHARD',7,5,'HALL',7,13);
 forward('HALL',12,1,'BUNKS',7,13);
 forward('ORCHARD',13,1,'CHANNEL',3,13);
 forward('CHANNEL',3,1,'BEND',2,13,{stage:5,wins:7});
 forward('BEND',3,1,'INTAKE',3,13,{wins:7});
 forward('BEND',13,7,'COPSE',3,13,{wins:7});
 const storeReturn=doors.find(d=>d.source==='LANTERN_COPSE_MAP');Object.assign(storeReturn,{x:400,y:240,facing:'left'});
 for(const d of doors){const m=LANTERN_MAPS.find(m=>m.id===d.source);if(m)m.map[d.row][d.col]=INTERIOR_EXIT;}
 return Object.freeze(doors.map(Object.freeze));
})();
