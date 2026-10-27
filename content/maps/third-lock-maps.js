'use strict';

// A discrete optional branch off existing post-ferry fen country. No new
// regional chunk or structural seam; every outward route returns to its source.
// THIRD_LOCK IDs remain stable for saves; the destination is Sedge Hollow,
// a fen hamlet, not an extension of the Drenwick canal.
const THIRD_LOCK_FIXTURES=Object.freeze({
 THIRD_LOCK_SHELTER_MAP:[{kind:'bed',col:10,row:3,w:2},{kind:'dresser',col:2,row:2},{kind:'supply',col:3,row:2},{kind:'table',col:5,row:9},{kind:'stove',col:12,row:10},{kind:'cargo',col:4,row:10}],
 THIRD_LOCK_COMMON_MAP:[{kind:'homebed',col:3,row:3},{kind:'dresser',col:2,row:2},{kind:'stove',col:12,row:10},{kind:'table',col:7,row:5},{kind:'table',col:4,row:9},{kind:'bench',col:11,row:5},{kind:'cargo',col:12,row:2}],
});
const THIRD_LOCK_MAPS = (()=>{
 const outdoor=()=>Array.from({length:15},(_,y)=>Array.from({length:16},(_,x)=>
  x===0||x===15||y===0||y===14?TREE:GRASS));
 const room=()=>Array.from({length:15},(_,y)=>Array.from({length:16},(_,x)=>
  x===0||x===15||y===0||y===14?INTERIOR_WALL:INTERIOR_FLOOR));
 const rect=(g,x,y,w,h,t)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)g[j][i]=t;};
 const approach=outdoor();rect(approach,10,1,5,13,WATER);rect(approach,8,3,2,8,REEDS);
 rect(approach,2,3,3,3,TREE);rect(approach,2,10,3,3,REEDS);rect(approach,6,1,2,13,PATH);
 const cottages=outdoor();rect(cottages,1,11,5,3,WATER);rect(cottages,6,11,2,3,REEDS);
 for(const [x,y]of [[2,2],[10,2],[2,7],[10,11]])rect(cottages,x,y,4,3,TOWN_BUILDING);
 rect(cottages,6,2,2,11,PATH);rect(cottages,2,5,12,2,PATH);rect(cottages,9,8,5,2,REEDS);
 // Working reed racks sit beside the surviving cottages.
 cottages[3][8]=REED_RACK;cottages[7][13]=REED_RACK;
 rect(cottages,10,10,3,1,TABLE); // handcart: solid, beside the abandoned cottage
 const shelter=room(),common=room();
 const cut=outdoor();rect(cut,1,1,4,13,WATER);rect(cut,5,2,2,10,REEDS);
 rect(cut,10,1,5,6,TREE);rect(cut,9,9,5,4,REEDS);rect(cut,7,1,2,13,PATH);
 const crossing=outdoor();rect(crossing,1,6,14,4,WATER);rect(crossing,7,6,2,4,PATH);
 rect(crossing,1,2,4,3,REEDS);rect(crossing,11,11,4,3,REEDS);rect(crossing,6,1,4,3,PATH);
 const landing=outdoor();rect(landing,1,1,4,13,WATER);rect(landing,5,1,2,10,REEDS);
 rect(landing,9,2,5,3,TREE);rect(landing,7,1,2,12,PATH);rect(landing,11,10,3,3,TOWN_BUILDING);landing[2][8]=TABLE;
 // Irregular natural banks; keep the central dry routes and all arrivals clear.
 for(const [y,x]of [[1,11],[2,11],[5,10],[6,10],[7,11],[8,11],[11,10],[12,11],[13,11]])for(let bank=10;bank<=x;bank++)approach[y][bank]=REEDS;
 for(const [y,x]of [[1,4],[2,4],[3,3],[6,4],[7,4],[8,3],[11,4],[12,4],[13,3]])for(let bank=x;bank<=4;bank++)cut[y][bank]=REEDS;
 for(const [y,x]of [[1,4],[2,3],[3,4],[6,4],[7,3],[8,3],[11,4],[12,4],[13,3]])for(let bank=x;bank<=4;bank++)landing[y][bank]=REEDS;
 // A natural stream bends past the hamlet; the two-tile timber crossing stays dry.
 for(const x of [1,2,3,4]){crossing[5][x]=WATER;crossing[9][x]=REEDS;}
 for(const x of [11,12,13,14]){crossing[6][x]=REEDS;crossing[10][x]=WATER;}
 cottages[10][1]=WATER;cottages[10][2]=REEDS;cottages[11][5]=REEDS;cottages[13][4]=REEDS;cottages[13][5]=REEDS;
 const specs=[['APPROACH','Sedge Hollow — Fen Footpath',approach],['COTTAGES','Sedge Hollow',cottages],
  ['SHELTER','Sedge Hollow — Belric’s Cottage',shelter],['COMMON','Sedge Hollow — Elset’s Cottage',common],
  ['REED_CUT','Sedge Hollow — Reed Cut',cut],['CROSSING','Sedge Hollow — Footbridge',crossing],
  ['LANDING','Sedge Hollow — Abandoned Landing',landing]];
 for(const [key,,grid]of specs)for(const f of THIRD_LOCK_FIXTURES['THIRD_LOCK_'+key+'_MAP']||[])rect(grid,f.col,f.row,f.w||1,1,TABLE);
 return Object.freeze(specs.map(([key,name,map])=>Object.freeze({id:'THIRD_LOCK_'+key+'_MAP',name,map,
  contentKey:'third_lock_'+key.toLowerCase(),interior:['SHELTER','COMMON'].includes(key)})));
})();
const THIRD_LOCK_CONTENT_KEYS=Object.freeze(Object.fromEntries(THIRD_LOCK_MAPS.map(m=>[m.id,m.contentKey])));
const THIRD_LOCK_ENTRY=Object.freeze({mapId:'GREAT_FEN_C8RN3_MAP',x:7.5,y:4.5});
const THIRD_LOCK_DOORS=Object.freeze([
 {source:'THIRD_LOCK_APPROACH_MAP',col:7,row:13,target:'GREAT_FEN_C8RN3_MAP',x:240,y:176,facing:'down'},
 {source:'THIRD_LOCK_APPROACH_MAP',col:7,row:1,target:'THIRD_LOCK_COTTAGES_MAP',x:240,y:400,facing:'up',requires:1},
 {source:'THIRD_LOCK_COTTAGES_MAP',col:7,row:13,target:'THIRD_LOCK_APPROACH_MAP',x:240,y:80,facing:'down'},
 {source:'THIRD_LOCK_COTTAGES_MAP',col:12,row:4,target:'THIRD_LOCK_SHELTER_MAP',x:240,y:400,facing:'up',requires:3},
 {source:'THIRD_LOCK_SHELTER_MAP',col:7,row:13,target:'THIRD_LOCK_COTTAGES_MAP',x:400,y:176,facing:'down'},
 {source:'THIRD_LOCK_COTTAGES_MAP',col:3,row:4,target:'THIRD_LOCK_COMMON_MAP',x:240,y:400,facing:'up'},
 {source:'THIRD_LOCK_COMMON_MAP',col:7,row:13,target:'THIRD_LOCK_COTTAGES_MAP',x:112,y:176,facing:'down'},
 {source:'THIRD_LOCK_COTTAGES_MAP',col:1,row:6,target:'THIRD_LOCK_REED_CUT_MAP',x:240,y:400,facing:'up',requires:3},
 {source:'THIRD_LOCK_REED_CUT_MAP',col:7,row:13,target:'THIRD_LOCK_COTTAGES_MAP',x:80,y:208,facing:'right'},
 {source:'THIRD_LOCK_REED_CUT_MAP',col:7,row:1,target:'THIRD_LOCK_CROSSING_MAP',x:240,y:400,facing:'up',requires:7},
 {source:'THIRD_LOCK_CROSSING_MAP',col:7,row:13,target:'THIRD_LOCK_REED_CUT_MAP',x:240,y:80,facing:'down'},
 {source:'THIRD_LOCK_COTTAGES_MAP',col:14,row:9,target:'THIRD_LOCK_LANDING_MAP',x:240,y:400,facing:'up'},
 {source:'THIRD_LOCK_LANDING_MAP',col:7,row:13,target:'THIRD_LOCK_COTTAGES_MAP',x:432,y:304,facing:'left'},
].map(Object.freeze));
for(const d of THIRD_LOCK_DOORS) THIRD_LOCK_MAPS.find(m=>m.id===d.source).map[d.row][d.col]=INTERIOR_EXIT;
