'use strict';

const STRUCK_ENTRY_BATTLES=Object.freeze([
 {id:0,mapId:'THIRD_LOCK_APPROACH_MAP',x:7.5,y:5.5,requires:0,label:'The fen footpath',enemies:['enemy_fen_lurker','enemy_fen_lurker'],text:'Two Fen Lurkers have torn up the fen footpath. Beyond them lie the cottages.'},
 {id:1,mapId:'THIRD_LOCK_COTTAGES_MAP',x:10.5,y:6.5,requires:1,label:'The shelter lane',enemies:['enemy_hollowreed_choker','enemy_bog_serpent'],text:'A choker and a serpent prowl the eastern cottage. Someone inside taps twice against a shutter.'},
 {id:2,mapId:'THIRD_LOCK_REED_CUT_MAP',x:7.5,y:5.5,requires:3,label:'The reed cut',enemies:['enemy_fen_witch','enemy_reed_grappler','enemy_reed_grappler'],text:'A Fen Witch and two Reed Grapplers crowd the cut. The cart cannot pass them.'},
 {id:3,mapId:'THIRD_LOCK_CROSSING_MAP',x:7.5,y:5.5,requires:7,label:'The footbridge',enemies:['enemy_fen_rootworm','enemy_fen_lurker'],text:'A great Fen Rootworm has knotted itself around the crossing. A lurker prowls beneath its roots.'},
 {id:4,mapId:'THIRD_LOCK_LANDING_MAP',x:8.5,y:5.5,requires:1,label:'The abandoned landing',enemies:['enemy_willow_veiled_stalker','enemy_fen_witch','enemy_bog_serpent'],text:'A stalker, a Fen Witch and a serpent surround a sealed supply box. This landing is not needed for the rescue. The stalker’s dense bark turns blades; thrown supplies can break through.'},
].map(b=>Object.freeze({...b,enemies:Object.freeze(b.enemies)})));
const struckEntry=(()=>{
 const tally='Third Lock Towpath Tally',boat='Carved Canal Boat';
 const here=()=>regionalActiveMapId();
 const near=(x,y,r=44)=>Math.hypot(player.x-x*TILE,player.y-y*TILE)<r;
 const nearby=n=>n&&n.map===currentContentLocationKey()&&near(n.x/TILE,n.y/TILE,TALK_RADIUS);
 const changed=()=>syncQuestFlagsToWindow();
 const won=i=>!!(struck_entry_wins&(1<<i));
 const ready=b=>b&&!won(b.id)&&(struck_entry_wins&b.requires)===b.requires&&here()===b.mapId&&near(b.x,b.y,56);
 function say(name,entries,callback){
  dialogue.name=name;setSpeakerDialoguePages(entries.filter(([id])=>id!=='esla'||persistentParty.isAvailable('esla'))
   .map(([speakerId,line])=>({speakerId,lines:[line]})));
  dialogue.page=0;dialogue.callbacks=callback?[callback]:null;dialogue.open=true;
 }
 function invariantErrors(source){
  const get=(key,fallback)=>source?(source[key]??fallback):({struck_entry_stage,struck_entry_wins,struck_entry_cache,struck_entry_supplies,corvin_favor_done,corvin_favor_started})[key];
  const s=get('struck_entry_stage',0),w=get('struck_entry_wins',0),c=get('struck_entry_cache',false),p=get('struck_entry_supplies',false),done=get('corvin_favor_done',false),started=get('corvin_favor_started',false),errors=[];
  if(!Number.isInteger(s)||s<0||s>4)errors.push('Struck Entry: invalid stage');
  if(!Number.isInteger(w)||w<0||w>31)errors.push('Struck Entry: invalid victories');
  if(typeof c!=='boolean'||typeof p!=='boolean')errors.push('Struck Entry: invalid loot receipt');
  if((w&2)&&!(w&1)||(w&4)&&(w&3)!==3||(w&8)&&(w&7)!==7||(w&16)&&!(w&1))errors.push('Struck Entry: clearance order');
  if(s===0&&(w||c||p)||s>=2&&(w&3)!==3||s>=3&&(w&15)!==15||s===4&&(!done||!started)||c&&!(w&16))errors.push('Struck Entry: inconsistent progress');
  const items=source?source.stats?.items:stats.items;
  for(const name of [tally,boat])if(!Array.isArray(items)||items.filter(i=>i.name===name).length!==(s===3&&!done?1:0))errors.push('Struck Entry: delivery item mismatch '+name);
  return errors;
 }
 function enter(){
  if(here()!==THIRD_LOCK_ENTRY.mapId||!near(7.5,4.5)||invariantErrors().length)return false;
  const ok=transitionToLocation({mapId:'THIRD_LOCK_APPROACH_MAP',x:240,y:400,facing:'up',cooldown:true});
  if(ok&&struck_entry_stage===0){struck_entry_stage=1;changed();}return ok;
 }
 function tryDoor(){
  const d=THIRD_LOCK_DOORS.find(d=>d.source===here()&&d.col===Math.floor(player.x/TILE)&&d.row===Math.floor(player.y/TILE));
  if(!d)return false;
  if(d.requires&&(struck_entry_wins&d.requires)!==d.requires){
   showWorldToast('Creatures still hold this route. Clear them before going on.');return true;
  }
  return transitionToLocation({mapId:d.target,x:d.x,y:d.y,facing:d.facing,cooldown:true});
 }
 function rescue(n){
  if(!nearby(n)||struck_entry_stage!==2||(struck_entry_wins&15)!==15||invariantErrors().length)return false;
  const gifts=corvin_favor_done?[]:[createItem(tally),createItem(boat)];
  // The cleared walk is compressed to a short transition; no civilians enter
  // the combat roster and this scow never transports the player to Mornay.
  if(!transitionToLocation({mapId:'THIRD_LOCK_COTTAGES_MAP',x:240,y:272,facing:'down',cooldown:true}))return false;
  stats.items.push(...gifts);struck_entry_stage=3;changed();
  openDialogue('',[[gifts.length?'Received: Third Lock Towpath Tally and Carved Canal Boat.':'Heddra keeps the family papers safe. Corvin’s record has already been restored.',
   'Heddra will stay at Wold’s Gate Inn in Mornay. Belric is bound for Mornay Infirmary. The scow leaves with them; you remain at Sedge Hollow.']],[]);return true;
 }
 function interact(n){
  if(!nearby(n)||invariantErrors().length)return false;
  if(THIRD_LOCK_CONTENT_KEYS[here()]&&struck_entry_stage===0){struck_entry_stage=1;changed();}
  if(n.id==='corvin'){
   if(!corvin_favor_started||corvin_favor_done)return false;
   if(struck_entry_stage===3){say('Corvin',STRUCK_ENTRY_DIALOGUE.resolution,()=>{
    if(!nearby(n)||struck_entry_stage!==3||corvin_favor_done||invariantErrors().length)return;
    for(const name of [tally,boat])stats.items.splice(stats.items.findIndex(i=>i.name===name),1);
    corvin_favor_done=true;struck_entry_stage=4;changed();refreshJobBoard();
   });return true;}
   if(struck_entry_stage>0){say('Corvin',[[n.id,'Heddra kept the papers? That sounds like her. Find out whether she is safe. My entry can wait another day.']]);return true;}
   return false;
  }
  if(n.id==='struck_iswen'){
   if(struck_entry_stage>=3){say(n.name,[[n.id,'Mother is at Wold’s Gate Inn. I have brought her clean things. Belric is at the infirmary, explaining why roofs ought to mend themselves.'],[n.id,'Thank you. There was a point when every footstep coming down the quay sounded like bad news.']]);return true;}
   if(!corvin_favor_started&&struck_entry_stage===0){say(n.name,[[n.id,'No word from my mother at Sedge Hollow. She stayed with an injured neighbour when the creatures came. I keep listening for the supply scow.'],[n.id,'The hamlet footpath leaves the gravel spur north in the Great Fen. If you go there, ask for Heddra.']]);return true;}
   say(n.name,STRUCK_ENTRY_DIALOGUE.lead,()=>{if(nearby(n)&&struck_entry_stage===0){struck_entry_stage=1;changed();}});return true;
  }
  if(n.id==='struck_heddra'){
   if(struck_entry_stage>=3){say(n.name,[[n.id,'Iswen comes after her shift. She brings enough supper for three, though she claims she has already eaten.'],[n.id,corvin_favor_done?(struck_entry_stage===4?'He remembered the boat? Good. It was never meant to carry a stone.':'His father’s name is back in the roll? Good. Tell Corvin where I am staying.'):'Take Corvin the tally and the boat when he has asked you about his father. He will know them.']]);return true;}
   if(struck_entry_stage<2){say(n.name,STRUCK_ENTRY_DIALOGUE.shelter,()=>{if(nearby(n)&&struck_entry_stage===1&&(struck_entry_wins&3)===3){struck_entry_stage=2;changed();}});return true;}
   if((struck_entry_wins&15)===15){say(n.name,corvin_favor_done?STRUCK_ENTRY_DIALOGUE.ready.slice(0,5):STRUCK_ENTRY_DIALOGUE.ready,()=>rescue(n));return true;}
   say(n.name,[[n.id,'The western reed cut, then the wooden footbridge. Clear both before we move Belric. The handcart cannot outrun anything.']]);return true;
  }
  if(n.id==='struck_belric'){
   say(n.name,struck_entry_stage>=3?[[n.id,'The nurse says no ladders. Heddra says no roofs. Between them I may have to sit down for the rest of my life.']]:[[n.id,'Back in Drenwick, Corvin’s father would count the last rope twice before he let a barge go. Not because he doubted you. Because he wanted you to get home.'],[n.id,'I mind eel traps here now. Usually less trouble than barges. Do not let Heddra lift the cart alone. She will try.']]);return true;
  }
  if(['struck_elset','struck_tam'].includes(n.id)){say(n.name,n.dialogue.map(p=>[n.id,p[0]]));return true;}
  return false;
 }
 function corvin(){return interact(SIMPLE_NPCS.find(n=>n.id==='corvin'));}
 function oldOffice(){
  if(here()!=='DRENWICK_OFFICE_MAP'||!corvin_favor_started||corvin_favor_done||!near(12.5,2.5))return false;
  say('Old canal-office papers',[[null,'A small bundle is labelled “Old Canal Office — closure”. The space for the towpath tallies is empty.'],[null,'A loose note reads: “Crew names and kitchen accounts saved by Heddra Dorr, former cook. Forwarding address: Sedge Hollow. Daughter Iswen now mends nets on Mornay’s lower western waterfront.”'],[null,'A later note records Heddra’s move to the fen hamlet after the crew kitchens closed. Its footpath leaves the Great Fen’s eastern gravel spur. Iswen may know how she is faring.']],()=>{if(here()==='DRENWICK_OFFICE_MAP'&&near(12.5,2.5)&&struck_entry_stage===0){struck_entry_stage=1;changed();}});return true;
 }
 function inspect(){
  if(invariantErrors().length)return false;
  if(THIRD_LOCK_CONTENT_KEYS[here()]&&struck_entry_stage===0){struck_entry_stage=1;changed();}
  if(here()===THIRD_LOCK_ENTRY.mapId&&near(7.5,4.5)){
   say('Hamlet footpath',[[null,'A weathered board points along a raised footpath: SEDGE HOLLOW. Reed bundles dry beside a winding fen channel. Cottage smoke hangs beyond the willows.']],()=>{
    if(here()!==THIRD_LOCK_ENTRY.mapId||!near(7.5,4.5))return;
    choice.title='Sedge Hollow';choice.options=['Follow the footpath','Stay here'];choice.cursor=0;choice.callbacks=[enter,()=>{}];choice.open=true;
   });return true;
  }
  const b=STRUCK_ENTRY_BATTLES.find(b=>ready(b));
  if(b){say(b.label,[[null,b.text]],()=>{
   if(!ready(b))return;
   choice.title=b.label;choice.options=['Clear the route','Withdraw'];choice.cursor=0;
   choice.callbacks=[()=>{if(ready(b))scriptedPartyEncounters.start('struck_entry',b.id);},()=>{}];choice.open=true;
  });return true;}
  if(here()==='THIRD_LOCK_COMMON_MAP'&&near(12.5,2.5)){
   if(!struck_entry_supplies){stats.items.push(...['Potion','Potion','Potion','Trollbane','Sapper Charge','Sapper Charge'].map(createItem));struck_entry_supplies=true;changed();openDialogue('Relief chest',[['Elset has left these for anyone trying to reach her neighbours. Received: 3 Potions, 1 Trollbane and 2 Sapper Charges.']]);}
   else openDialogue('Relief chest',[['The relief chest is empty.']]);return true;
  }
  if(here()==='THIRD_LOCK_LANDING_MAP'&&near(8.5,2.5)){
   if(!won(4)){openDialogue('Supply box',[['The creatures are too close to open it safely.']]);return true;}
   if(!struck_entry_cache){stats.items.push(...['Reinforced Travel Coat','Elixir','Elixir','Reed Remedy','Reed Remedy'].map(createItem));struck_entry_cache=true;changed();
    openDialogue('Supply box',[['Received: Reinforced Travel Coat, 2 Elixirs and 2 Reed Remedies. The coat was wrapped in oiled cloth; the supplies are still sealed.']]);}
   else openDialogue('Supply box',[['Only the oiled wrapping remains.']]);return true;
  }
  return false;
 }
 function note(){
  if(!struck_entry_stage)return null;
  let body;
  if(struck_entry_stage===3&&corvin_favor_done)body='Heddra is safe at Wold’s Gate Inn; Belric is recovering at Mornay Infirmary. Corvin’s father’s record was already restored; no further delivery is needed.';
  else if(struck_entry_stage===4)body='Heddra and Belric reached Mornay safely. Delivered the original tally and toy boat; restored Corvin’s father’s name. Corvin can now countersign Renn’s correction. Filing it remains your choice.';
  else if(struck_entry_stage===3)body='Heddra is at Wold’s Gate Inn; Belric is at Mornay Infirmary. Bring the tally and carved boat to Corvin at Calwick (office on workdays, inn on Dayoff). If he has not asked about his father yet, speak to him at the inn on Dayoff.';
  else if(struck_entry_stage===2)body=(struck_entry_wins&15)===15?'The reed cut and crossing are clear. Return to Heddra in the eastern cottage to move both survivors to safety.':'Clear the western reed cut and the footbridge, then return to Heddra in the eastern cottage. The abandoned landing is optional.';
  else body='Find Sedge Hollow at the footpath sign on the Great Fen’s eastern Gravel Spur (north of North Fen). Heddra moved there after cooking for Drenwick’s canal crews, taking their saved papers. Clear the fen approach and the eastern cottage lane; find Heddra and Belric. Iswen mends nets on Mornay’s Middle Lower West waterfront.';
  return {title:'The Struck Entry — Sedge Hollow',body};
 }
 return Object.freeze({interact,corvin,oldOffice,inspect,tryDoor,note,invariantErrors,
  eligible(id){return Number.isInteger(id)&&id>=0&&id<5&&struck_entry_stage>=1&&ready(STRUCK_ENTRY_BATTLES[id])&&!invariantErrors().length;},
  draw(){
   const map=here();
   for(const b of STRUCK_ENTRY_BATTLES)if(b.mapId===map&&!won(b.id)){
    ctx.save();ctx.translate(b.x*TILE,b.y*TILE);ctx.scale(.38,.38);
    const entry=ENEMY_SPRITE_DISPATCH[b.enemies[0]];entry.draw(0,0);ctx.restore();
    drawNPCSpaceHint({x:b.x*TILE,y:b.y*TILE},b.x*TILE,b.y*TILE);
   }
   if(map==='THIRD_LOCK_COTTAGES_MAP'){
    // Same timber/roof vocabulary as Reedbank, clipped to authored solid mass.
    for(const [i,[col,row]]of [[2,2],[10,2],[2,7],[10,11]].entries()){
     const x=col*TILE,y=row*TILE;
     ctx.fillStyle=i<2?'#79664c':'#575343';ctx.fillRect(x,y,128,96);
     ctx.fillStyle='#414537';ctx.fillRect(x,y,128,29);
     ctx.fillStyle='#777953';for(let r=4;r<27;r+=7)ctx.fillRect(x+3,y+r,122,3);
     ctx.fillStyle='#362d25';for(let r=35;r<96;r+=14)ctx.fillRect(x,y+r,128,2);
     for(const dx of [14,94]){ctx.fillStyle=i<2?'#bfab6e':'#292e26';ctx.fillRect(x+dx,y+42,18,20);
      ctx.fillStyle='#453a29';ctx.fillRect(x+dx+8,y+42,2,20);ctx.fillRect(x+dx,y+51,18,2);}
     if(i>=2){ctx.strokeStyle='#786952';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+10,y+43);ctx.lineTo(x+36,y+64);ctx.stroke();}
    }
    // Roofless shells are overgrown but their rubble remains solid.
    for(const [col,row]of [[3,8],[4,8],[10,12],[11,12]])drawReeds(col*TILE,row*TILE);
    drawMornayStreetProp('cart',10*TILE,10*TILE);
    // Low kitchen beds are ground decoration, clear of doors and the cart route.
    for(const [col,row,w]of [[9,7,4],[3,10,2]]){
     const x=col*TILE,y=row*TILE;ctx.fillStyle='#60513b';ctx.fillRect(x+2,y+4,w*TILE-4,24);
     for(let dy=8;dy<26;dy+=8){ctx.fillStyle='#3e3d2b';ctx.fillRect(x+4,y+dy,w*TILE-8,2);
      ctx.fillStyle='#788154';for(let dx=10;dx<w*TILE-6;dx+=16){ctx.fillRect(x+dx,y+dy-3,5,3);ctx.fillRect(x+dx+2,y+dy-5,2,6);}}
    }
    // Peat drying on the abandoned cottage's solid rubble, not in the lane.
    for(let r=0;r<3;r++)for(let c=0;c<5;c++){
     ctx.fillStyle=r%2?'#494333':'#554b36';ctx.fillRect(2*TILE+10+c*18,7*TILE+64+r*8,15,6);
    }
   }
   if(map==='THIRD_LOCK_CROSSING_MAP'){
    // The existing dry PATH cells carry a plain timber footbridge, without masonry.
    const x=7*TILE,y=6*TILE;ctx.fillStyle='#7a6040';ctx.fillRect(x,y,2*TILE,4*TILE);
    ctx.fillStyle='#4c3c2c';for(let dy=5;dy<4*TILE;dy+=8)ctx.fillRect(x,y+dy,2*TILE,2);
    ctx.fillStyle='#a18a60';for(const dx of [2,2*TILE-5]){
     ctx.fillRect(x+dx,y,3,4*TILE);for(let dy=0;dy<4*TILE;dy+=32)ctx.fillRect(x+dx-1,y+dy,5,7);
    }
   }
   if(map==='THIRD_LOCK_LANDING_MAP'){
    // Nets spread on the old fishing shed: ordinary lake/fen work, not a depot.
    drawMornayStreetProp('nets',11*TILE+8,10*TILE+6);
   }
   for(const d of THIRD_LOCK_DOORS.filter(d=>d.source===map)){
    const interior=THIRD_LOCK_MAPS.find(m=>m.id===map)?.interior;
    if(interior||map==='THIRD_LOCK_COTTAGES_MAP'&&d.row===4)drawInteriorExit(d.col*TILE,d.row*TILE,false);
    else {drawPath(d.col*TILE,d.row*TILE);ctx.fillStyle='#afa58c';ctx.fillRect(d.col*TILE+13,d.row*TILE+8,6,16);}
   }
   for(const f of THIRD_LOCK_FIXTURES[map]||[]){
    for(let x=0;x<(f.w||1);x++)drawInteriorFloor((f.col+x)*TILE,f.row*TILE);
    drawMornayFixture(f);
   }
   if(map==='THIRD_LOCK_LANDING_MAP')drawMornayFixture({kind:'cargo',col:8,row:2});
  },
  drawEntry(){
   ctx.fillStyle='#63513a';ctx.fillRect(7*TILE+8,4*TILE+4,4,27);ctx.fillRect(8*TILE+5,4*TILE+11,4,20);
   ctx.fillStyle='#a3926e';ctx.fillRect(7*TILE,4*TILE+13,30,11);
   ctx.fillStyle='#493d2d';ctx.font='7px monospace';ctx.textAlign='left';ctx.fillText('HOMES',7*TILE+3,4*TILE+21);
  },
 });
})();
NPC_ACTIONS.struckEntry=n=>struckEntry.interact(n);
