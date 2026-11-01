'use strict';
// Neris is not Mornay provisioner Neris Kelm. Identity, profession and placement
// are explicit; she never appears twice or enters a combat-party slot.
const LANTERN_NPCS=[
 {id:'lantern_neris',name:'Neris',role:'registered adult Tidebound; former Academy acquaintance of Esla',spriteType:'patron',hairColor:'#548ec8',facing:'down',
  get map(){return lantern_stage===4||lantern_stage===5?'lantern_channel':'lantern_hall';},get x(){return (lantern_stage===4||lantern_stage===5?6.5:8.5)*TILE;},get y(){return (lantern_stage===4||lantern_stage===5?10.5:4.5)*TILE;}},
 {id:'lantern_orren',name:'Orren',role:'older Galeheart graduate; prepares travellers, rejects Flame politics',map:'lantern_orchard',x:10.5*TILE,y:8.5*TILE,facing:'left',spriteType:'clerk',hairColor:'#c5cbd2'},
 {id:'lantern_vena',name:'Vena',role:'young adult Rosebound, unable to return safely to her village',map:'lantern_hall',x:4.5*TILE,y:8.5*TILE,facing:'right',spriteType:'patron',hairColor:'#ce84a9'},
 {id:'lantern_mara',name:'Mara',role:'commonborn mother accompanying her child',map:'lantern_bunks',x:6.5*TILE,y:8.5*TILE,facing:'left',spriteType:'patron',hairColor:'#765536'},
 {id:'lantern_ilan',name:'Ilan',role:'twelve-year-old Stonewrought; Mara’s child, preparing for Junior Academy',map:'lantern_bunks',x:9.5*TILE,y:8.5*TILE,facing:'left',spriteType:'child',hairColor:'#929087'},
].map(n=>Object.assign(n,{solid:true,flag_required:null,flag_sets:null,action:null,dialogue:[['The guesthouse is quieter than the road.']]}));
