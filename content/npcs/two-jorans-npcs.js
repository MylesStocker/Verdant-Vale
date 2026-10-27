'use strict';

// Booking interview in the public room; release is derived from quest state.
// No new cell access, saved sprite position or duplicate version of either man.
const TWO_JORANS_NPCS = [
 {id:'two_jorans_beck',name:'Joran',speakerId:'two_jorans_beck',
  get map(){return mornayContentKey(two_jorans_stage>=2?'MORNAY_OLD_FORT_MAP':'MORNAY_WATCHHOUSE_MAP');},
  get x(){return 9.5*TILE;},
  get y(){return (two_jorans_stage>=2?8.5:4.5)*TILE;},
  facing:'left',spriteType:'worker',hairColor:'#514638',coatColor:'#76644d',
  solid:true,dialogue:[['Joran Beck. Stonework. They have my name and somebody else’s life.']],
  action:'twoJorans',flag_required:null,flag_sets:null},
 {id:'two_jorans_alden',name:'Joran',speakerId:'two_jorans_alden',
  map:mornayContentKey('MORNAY_WAREHOUSE_MAP'),x:8.5*TILE,y:5.5*TILE,
  facing:'left',spriteType:'clerk',hairColor:'#4c342d',coatColor:'#506580',
  solid:true,dialogue:[['Joran Alden. Freight accounts. If this concerns the wages, I have already explained my position.']],
  action:'twoJorans',flag_required:null,flag_sets:null},
];
