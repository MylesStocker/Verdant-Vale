'use strict';
// Brenna is this expedition's organiser, not Brenna Kett of the Crooked Oar.
const GREYBANK_NPCS=[
 {id:'greybank_brenna',name:'Brenna',x:7.5*TILE,y:8.5*TILE,facing:'up',spriteType:'worker'},
 {id:'greybank_ovan',name:'Ovan',x:5.5*TILE,y:10.5*TILE,facing:'up',spriteType:'worker'},
 {id:'greybank_teri',name:'Teri',x:10.5*TILE,y:10.5*TILE,facing:'up',spriteType:'patron'},
].map(n=>({...n,solid:true,flag_required:null,flag_sets:null,action:null,
 get map(){return greybank_stage>=3||typeof greybank!=='undefined'&&greybank.phase()==='intro'?'greybank_tent':null;},
 dialogue:[['The mill still needs clearing.']]}));
GREYBANK_NPCS.push({id:'greybank_dessa',name:'Dessa',map:'greybank_yard',x:5.5*TILE,y:8.5*TILE,facing:'right',spriteType:'worker',solid:true,
 flag_required:null,flag_sets:null,action:null,dialogue:[['Three weeks without wages. I swept the meal off my coat into a bowl last night. Tell that to whoever sent you.']]});
