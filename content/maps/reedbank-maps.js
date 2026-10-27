'use strict';

// Seven homestead facades; the provisions shop and wrestling bank are public.
// All doors use the ordinary point-transition path, with neutral location state.
const REEDBANK_HOMESTEADS = Object.freeze([[1,1],[4,1],[7,1],[10,1],[1,5],[1,11],[4,11]].map(Object.freeze));
const REEDBANK_MUSHROOM_PLOTS = Object.freeze([[1,8],[3,8],[5,8]].map(Object.freeze));
const REEDBANK_VILLAGE_MAP = (() => {
  const grid=Array.from({length:15},(_,y)=>Array.from({length:16},(_,x)=>
    x>=12 ? WATER : x===0||y===0||y===14 ? TREE : GRASS));
  for(let y=3;y<15;y++)grid[y][7]=PATH;
  for(let x=2;x<12;x++)grid[4][x]=PATH;
  for(const [x,y] of REEDBANK_HOMESTEADS)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)grid[y+dy][x+dx]=TOWN_BUILDING;
  for(let x=7;x<=9;x++)for(let y=5;y<=6;y++)grid[y][x]=TOWN_BUILDING;
  grid[6][8]=HOUSE_DOOR;
  for(const [x,y] of REEDBANK_MUSHROOM_PLOTS) {grid[y][x]=TABLE;grid[y+1][x]=TABLE;}
  grid[14][7]=INTERIOR_EXIT;
  return grid;
})();
const REEDBANK_PROVISIONS_MAP = (() => {
  const grid=Array.from({length:15},(_,y)=>Array.from({length:16},(_,x)=>
    x===0||x===15||y===0||y===14 ? INTERIOR_WALL : INTERIOR_FLOOR));
  for(let x=4;x<=10;x++)grid[5][x]=TABLE;
  for(const [x,y] of [[2,2],[3,2],[12,2],[13,2],[12,10],[13,10]])grid[y][x]=TABLE;
  grid[14][7]=INTERIOR_EXIT;
  return grid;
})();
const REEDBANK_DOORS = Object.freeze([
  {source:'MAINLAND_C22R3_MAP',col:3,row:8,target:'REEDBANK_VILLAGE_MAP',x:240,y:432,facing:'up'},
  {source:'REEDBANK_VILLAGE_MAP',col:7,row:14,target:'MAINLAND_C22R3_MAP',x:112,y:304,facing:'down'},
  {source:'REEDBANK_VILLAGE_MAP',col:8,row:6,target:'REEDBANK_PROVISIONS_MAP',x:240,y:432,facing:'up'},
  {source:'REEDBANK_PROVISIONS_MAP',col:7,row:14,target:'REEDBANK_VILLAGE_MAP',x:272,y:240,facing:'down'},
].map(Object.freeze));
const REEDBANK_CONTENT_KEYS = Object.freeze({REEDBANK_VILLAGE_MAP:'reedbank_village',REEDBANK_PROVISIONS_MAP:'reedbank_provisions'});
window.REEDBANK_VILLAGE_MAP=REEDBANK_VILLAGE_MAP;
window.REEDBANK_PROVISIONS_MAP=REEDBANK_PROVISIONS_MAP;
