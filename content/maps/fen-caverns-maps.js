'use strict';

// The isolated rise fills the unplaced (3,-1) cell above the reservoir. Its
// blocked perimeter preserves neighbouring scenery and early progression gates.
const FEN_RUIN_REGIONAL_CHUNK_DEFINITIONS = [{
  mapId:'FEN_RUIN_RISE_MAP', regionId:'overworld', chunkX:3, chunkY:-1,
  displayName:'Great Fen — The Broken Rise', region:'Great Fen',
  contentKey:'fen_ruin_rise', presentation:'continuous',
  encounterProfileId:'great_fen', allowRandomEncounters:false, allowSave:true,
  playerAccessible:true, notes:'Secluded ruined rise; reached through the northern fen caverns. All surface edges remain closed.',
  map:[
    [119,3,3,119,119,119,119,3,119,119,119,3,3,3,119,119],
    [1,3,119,119,119,0,0,119,119,119,0,0,0,3,119,119],
    [1,1,119,0,0,0,0,88,88,88,88,0,0,0,3,119],
    [1,1,119,0,0,78,78,78,77,78,78,78,0,0,3,119],
    [1,1,119,0,0,78,77,77,79,77,77,78,0,0,3,119],
    [1,119,0,0,0,78,77,77,77,77,77,78,0,0,0,3],
    [1,119,0,0,0,77,77,77,0,77,77,77,0,0,0,3],
    [1,119,0,0,0,78,77,77,77,77,77,78,0,0,0,3],
    [1,1,0,0,0,78,78,77,0,77,78,78,0,0,0,3],
    [1,1,23,0,0,0,88,0,0,0,88,0,0,0,3,3],
    [1,1,1,23,23,0,0,88,0,0,0,23,23,0,3,3],
    [1,1,1,1,23,23,0,0,0,23,23,23,1,1,3,3],
    [1,1,1,1,1,23,23,23,23,23,1,1,1,1,1,3],
    [1,1,1,1,1,1,1,23,23,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
}];

// Three compact, connected chambers. Existing rock, water, mud and masonry
// assets provide the vocabulary; irregular floor plans carry the cave shape.
const FEN_CAVE_MAPS = (()=>{
  const key={'#':DUNGEON_WALL,'.':DUNGEON_FLOOR,'~':WATER,',':BASIN_MUD,'R':RUIN_WALL,'u':DUNGEON_EXIT,'v':RUIN_STAIRS_DOWN,'d':DRIFTWOOD};
  const rooms=[
    ['FEN_CAVE_DESCENT_MAP','Fen Caverns — Broken Descent',[
      '################',
      '##########...###',
      '##########.v.###',
      '########....####',
      '######......####',
      '###.......######',
      '##...R....######',
      '##......########',
      '###...##########',
      '###......#######',
      '####..R....#####',
      '#####.......####',
      '######.u..,,####',
      '#######..,,#####',
      '################',
    ]],
    ['FEN_CAVE_POOL_MAP','Fen Caverns — Still Water',[
      '################',
      '##########...###',
      '#########..v.###',
      '#######......###',
      '####........####',
      '###...~~~....###',
      '###...~~~~...###',
      '###...~~~~...###',
      '###....~~....###',
      '###.........####',
      '##....,,...#####',
      '##....,,########',
      '###.u..#########',
      '####..##########',
      '################',
    ]],
    ['FEN_CAVE_ROOTS_MAP','Fen Caverns — Root Cleft',[
      '################',
      '#########....###',
      '#########.u..###',
      '#######.....####',
      '######...d.#####',
      '######....######',
      '####......######',
      '###....#########',
      '###...##########',
      '##.....#########',
      '##..d...########',
      '###.....########',
      '###.u...########',
      '####...#########',
      '################',
    ]],
  ];
  return Object.freeze(rooms.map(([id,name,rows])=>Object.freeze({id,name,map:rows.map(r=>[...r].map(c=>key[c]))})));
})();
const FEN_CAVE_CONTENT_KEYS=Object.freeze(Object.fromEntries(FEN_CAVE_MAPS.map(m=>[m.id,m.id.toLowerCase()])));
// Point passages, not overworld seams. Every arrival is beside its reciprocal
// trigger and faces away, so holding the arrival direction cannot bounce back.
const FEN_CAVE_DOORS=Object.freeze([
  {source:'FEN_RUIN_RISE_MAP',col:8,row:4,target:'FEN_CAVE_DESCENT_MAP',x:240,y:368,facing:'up'},
  {source:'FEN_CAVE_DESCENT_MAP',col:7,row:12,target:'FEN_RUIN_RISE_MAP',x:272,y:176,facing:'down'},
  {source:'FEN_CAVE_DESCENT_MAP',col:11,row:2,target:'FEN_CAVE_POOL_MAP',x:144,y:368,facing:'up'},
  {source:'FEN_CAVE_POOL_MAP',col:4,row:12,target:'FEN_CAVE_DESCENT_MAP',x:368,y:112,facing:'down'},
  {source:'FEN_CAVE_POOL_MAP',col:11,row:2,target:'FEN_CAVE_ROOTS_MAP',x:144,y:368,facing:'up'},
  {source:'FEN_CAVE_ROOTS_MAP',col:4,row:12,target:'FEN_CAVE_POOL_MAP',x:368,y:112,facing:'down'},
  {source:'FEN_CAVE_ROOTS_MAP',col:10,row:2,target:'MAINLAND_CN3RN14_MAP',x:240,y:112,facing:'down'},
  {source:'MAINLAND_CN3RN14_MAP',col:7,row:2,target:'FEN_CAVE_ROOTS_MAP',x:336,y:112,facing:'down'},
].map(Object.freeze));
