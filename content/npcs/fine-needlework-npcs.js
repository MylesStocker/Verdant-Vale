'use strict';

// Quest visitor and a projection of the existing recruited companion. Neither
// duplicates a Mornay resident or owns character stats/saved sprite positions.
const FINE_NEEDLEWORK_NPCS = [
  {id:'mornay_chuggie',name:'Chuggie',map:mornayContentKey('MORNAY_GATE_INN_MAP'),x:9.5*TILE,y:7.5*TILE,
    solid:true,facing:'left',spriteType:'worker',dialogue:[],action:'fineNeedleworkChuggie',flag_required:null,flag_sets:null},
  {id:'fine_needlework_esla',name:'Esla',
    get map(){return fineNeedlework.eslaMap();},
    get x(){return fineNeedlework.eslaPose().x;},set x(value){fineNeedlework.setEslaCoordinate('x',value);},
    get y(){return fineNeedlework.eslaPose().y;},set y(value){fineNeedlework.setEslaCoordinate('y',value);},
    get facing(){return fineNeedlework.eslaPose().facing;},set facing(value){fineNeedlework.setEslaCoordinate('facing',value);},
    solid:false,spriteType:'infirmary_esla',dialogue:[],action:'fineNeedleworkEsla',flag_required:null,flag_sets:null},
];
