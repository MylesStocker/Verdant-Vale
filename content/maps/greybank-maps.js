'use strict';
// Six discrete rooms, one regional entrance. Collision is authored in the grids;
// all doors return beside their reciprocal trigger. No structural seam changes.
const GREYBANK_FIXTURES=Object.freeze({
 GREYBANK_TENT_MAP:[{kind:'homebed',col:2,row:3},{kind:'table',col:7,row:3},{kind:'cargo',col:12,row:5}],
 GREYBANK_MAIN_MAP:[{kind:'cargo',col:2,row:3},{kind:'cargo',col:3,row:3},{kind:'table',col:10,row:5},{kind:'bench',col:3,row:9}],
 GREYBANK_UPPER_MAP:[{kind:'table',col:4,row:4},{kind:'table',col:4,row:5},{kind:'cargo',col:11,row:9}],
 GREYBANK_STORE_MAP:[{kind:'cargo',col:2,row:2},{kind:'cargo',col:3,row:2},{kind:'cargo',col:4,row:2},{kind:'cargo',col:11,row:3},{kind:'cargo',col:12,row:3},{kind:'desk',col:3,row:9},{kind:'cargo',col:12,row:10}],
 GREYBANK_WHEEL_MAP:[{kind:'table',col:2,row:3},{kind:'cargo',col:11,row:9}],
});
const GREYBANK_MAPS=(()=>{
 const room=()=>Array.from({length:15},(_,y)=>Array.from({length:16},(_,x)=>x===0||x===15||y===0||y===14?INTERIOR_WALL:INTERIOR_FLOOR));
 const yard=Array.from({length:15},(_,y)=>Array.from({length:16},(_,x)=>x===0||y===0||y===14?TREE:x>=13-(y>9?1:0)?WATER:GRASS));
 for(let y=2;y<7;y++)for(let x=7;x<12;x++)yard[y][x]=TOWN_BUILDING;
 for(let y=3;y<6;y++)for(let x=2;x<5;x++)yard[y][x]=TOWN_BUILDING;
 for(let y=7;y<14;y++)yard[y][7]=PATH;
 for(let x=3;x<10;x++)yard[7][x]=PATH;
 const specs=[['YARD','Greybank Mill — CHAMBERI RIVER',yard],['TENT','Greybank — Riverside Tent',room()],['MAIN','Greybank — Main Mill Floor',room()],['UPPER','Greybank — Upper Machinery Floor',room()],['STORE','Greybank — Grain Store',room()],['WHEEL','Greybank — Wheelhouse',room()]];
 for(const [k,,g]of specs)for(const f of GREYBANK_FIXTURES['GREYBANK_'+k+'_MAP']||[])g[f.row][f.col]=TABLE;
 // Millstones and shaft housings: existing solid stone, with routes on both sides.
 for(const [x,y]of [[4,5],[5,5],[4,6],[5,6],[10,8],[11,8]])specs[2][2][y][x]=RUIN_WALL;
 for(let y=3;y<9;y++)specs[3][2][y][9]=RUIN_WALL;
 // Working water lies behind the wheelhouse's intact eastern wall.
 for(let y=1;y<14;y++)for(let x=13;x<15;x++)specs[5][2][y][x]=WATER;
 return Object.freeze(specs.map(([k,name,map])=>Object.freeze({id:'GREYBANK_'+k+'_MAP',name,map,contentKey:'greybank_'+k.toLowerCase()})));
})();
const GREYBANK_CONTENT_KEYS=Object.freeze(Object.fromEntries(GREYBANK_MAPS.map(m=>[m.id,m.contentKey])));
const GREYBANK_DOORS=Object.freeze([
 {source:'MAINLAND_C21R7_MAP',col:10,row:7,target:'GREYBANK_YARD_MAP',x:240,y:400,facing:'up'},
 {source:'GREYBANK_YARD_MAP',col:7,row:13,target:'MAINLAND_C21R7_MAP',x:368,y:240,facing:'right'},
 {source:'GREYBANK_YARD_MAP',col:3,row:5,target:'GREYBANK_TENT_MAP',x:240,y:400,facing:'up'},
 {source:'GREYBANK_TENT_MAP',col:7,row:13,target:'GREYBANK_YARD_MAP',x:112,y:208,facing:'down'},
 {source:'GREYBANK_YARD_MAP',col:9,row:6,target:'GREYBANK_MAIN_MAP',x:240,y:400,facing:'up',access:true},
 {source:'GREYBANK_MAIN_MAP',col:7,row:13,target:'GREYBANK_YARD_MAP',x:304,y:240,facing:'down'},
 {source:'GREYBANK_MAIN_MAP',col:12,row:2,target:'GREYBANK_UPPER_MAP',x:400,y:368,facing:'up',requires:1,stairs:'up'},
 {source:'GREYBANK_UPPER_MAP',col:12,row:12,target:'GREYBANK_MAIN_MAP',x:400,y:112,facing:'down',stairs:'down'},
 {source:'GREYBANK_UPPER_MAP',col:3,row:2,target:'GREYBANK_STORE_MAP',x:112,y:368,facing:'up',requires:3,stairs:'down'},
 {source:'GREYBANK_STORE_MAP',col:3,row:12,target:'GREYBANK_UPPER_MAP',x:112,y:112,facing:'down',stairs:'up'},
 {source:'GREYBANK_STORE_MAP',col:12,row:2,target:'GREYBANK_WHEEL_MAP',x:240,y:400,facing:'up',requires:7},
 {source:'GREYBANK_WHEEL_MAP',col:7,row:13,target:'GREYBANK_STORE_MAP',x:400,y:144,facing:'down'},
].map(Object.freeze));
for(const d of GREYBANK_DOORS){const m=GREYBANK_MAPS.find(m=>m.id===d.source);if(m)m.map[d.row][d.col]=INTERIOR_EXIT;}
