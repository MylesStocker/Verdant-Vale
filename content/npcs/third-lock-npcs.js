'use strict';
const THIRD_LOCK_NPCS = [
 {id:'struck_iswen',name:'Iswen',map:mornayContentKey('MORNAY_MIDDLE_LOWER_WEST_MAP'),x:7.5*TILE,y:8.5*TILE,
  facing:'left',spriteType:'worker',dialogue:[['The net can wait. I am listening for the scow.']]},
 {id:'struck_heddra',name:'Heddra',
  get map(){return struck_entry_stage>=3?mornayContentKey('MORNAY_GATE_INN_MAP'):'third_lock_shelter';},
  get x(){return (struck_entry_stage>=3?11.5:5.5)*TILE;},
  get y(){return (struck_entry_stage>=3?11.5:5.5)*TILE;},
  facing:'right',spriteType:'patron',dialogue:[['He could not walk. I could not leave him.']]},
 {id:'struck_belric',name:'Belric',
  get map(){return struck_entry_stage>=3?mornayContentKey('MORNAY_INFIRMARY_MAP'):'third_lock_shelter';},
  get x(){return (struck_entry_stage>=3?6.5:10.5)*TILE;},
  get y(){return (struck_entry_stage>=3?11.5:4.5)*TILE;},
  facing:'left',spriteType:'worker',dialogue:[['The leg needs rest. Unfortunately the roof needed mending first.']]},
 {id:'struck_elset',name:'Elset',map:'third_lock_common',x:8.5*TILE,y:5.5*TILE,facing:'left',spriteType:'patron',
  dialogue:[['Back in Drenwick, Corvin’s mother washed for the crews. She knew whose shirt it was by the elbows. Here I cut reeds. They all wear through my sleeves the same way.'],['Heddra is with Belric in the eastern cottage. She took soup over when the attacks started and never came back.']]},
 {id:'struck_tam',name:'Tam',map:'third_lock_cottages',x:5.5*TILE,y:10.5*TILE,facing:'right',spriteType:'worker',
  dialogue:[['Peat is slow to dry this week. Three families left here. Five if you count people who still send word. I keep their kitchen gardens from swallowing the doors.'],['The western reed cut reaches the wooden footbridge. A scow can come in there once the creatures are gone.']]},
].map(n=>({...Object.getOwnPropertyDescriptors(n)})).map(descriptors=>Object.defineProperties({
 solid:true,flag_required:null,flag_sets:null,action:'struckEntry'},descriptors));
