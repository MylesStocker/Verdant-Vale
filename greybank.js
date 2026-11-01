'use strict';

const GREYBANK_FEE=150;
const GREYBANK_BATTLES=Object.freeze([
 {id:0,mapId:'GREYBANK_MAIN_MAP',x:7.5,y:7.5,requires:0,label:'Meal-spattered floor',enemies:['enemy_marsh_rat','enemy_marsh_rat','enemy_marsh_rat'],text:'Rats swarm the meal chute. On a waiting cart: PUBLIC RELIEF GRAIN. Dessa’s unpaid wage slips are pinned beside it.'},
 {id:1,mapId:'GREYBANK_UPPER_MAP',x:6.5,y:6.5,requires:1,label:'Stopped machinery',enemies:['enemy_lantern_moth','enemy_lantern_moth','enemy_marsh_rat'],text:'Lantern Moths have nested in the dry drive belts. The stairs beyond lead down to the locked private store.'},
 {id:2,mapId:'GREYBANK_STORE_MAP',x:8.5,y:6.5,requires:3,label:'Private relief stock',enemies:['enemy_fen_rootworm','enemy_marsh_rat','enemy_marsh_rat'],text:'A rootworm burrows through sealed relief sacks. A short instruction hangs above them: HOLD FOR HIGHER DROUGHT PRICE. Distribution proceeds: Marit Voss, one quarter; operating partners, three quarters. Workers’ wages: deferred.'},
 {id:3,mapId:'GREYBANK_WHEEL_MAP',x:7.5,y:6.5,requires:7,label:'The wheel pit',enemies:['enemy_mudwrack_snapper','enemy_fen_rootworm','enemy_lantern_moth'],text:'A Mudwrack Snapper holds the wheel pit. Roots foul the axle and a moth flickers above it. Clear them and the workers can reach the whole mill again.'},
 {id:4,mapId:'GREYBANK_STORE_MAP',x:11.5,y:10.5,requires:7,label:'The supply recess',enemies:['enemy_lantern_moth','enemy_fen_rootworm'],text:'A moth and a rootworm crowd an abandoned repair chest. This recess is not needed to clear the mill.'},
].map(b=>Object.freeze({...b,enemies:Object.freeze(b.enemies)})));
const greybank=(()=>{
 let scene=null,generation=0;
 const here=()=>regionalActiveMapId();
 const near=(x,y,r=44)=>Math.hypot(player.x-x*TILE,player.y-y*TILE)<r;
 const won=i=>!!(greybank_wins&(1<<i));
 const ready=b=>!!b&&greybank_stage>=3&&!won(b.id)&&(greybank_wins&b.requires)===b.requires&&here()===b.mapId&&near(b.x,b.y,54);
 const finished=()=>greybank_vision_seen&&(greybank_wins&15)===15;
 function invariantErrors(s){
  const v=s||{greybank_stage,greybank_wins,greybank_vision_seen,greybank_cache_taken,MainQuest,mq5_report_delivered};
  const stage=v.greybank_stage??0,w=v.greybank_wins??0,vision=v.greybank_vision_seen??false,cache=v.greybank_cache_taken??false,e=[];
  if(!Number.isInteger(stage)||stage<0||stage>4||!Number.isInteger(w)||w<0||w>31||typeof vision!=='boolean'||typeof cache!=='boolean')e.push('Greybank: malformed progress');
  if(stage>0&&!v.mq5_report_delivered||stage>=2&&v.MainQuest<6||stage<2&&v.MainQuest===6)e.push('Greybank: assignment prerequisite');
  if(stage<3&&(w||vision||cache)||(w&2)&&!(w&1)||(w&4)&&(w&3)!==3||(w&8)&&(w&7)!==7||(w&16)&&(w&7)!==7||cache&&!(w&16)||stage===4&&((w&15)!==15||!vision))e.push('Greybank: inconsistent clearance');
  return e;
 }
 // Dialogue takes transient ownership, including its choice. No relocation or
 // party edits. A generation and origin check make abandoned callbacks inert.
 function companionPosition(){
  for(const [dx,dy]of [[32,32],[-32,32],[0,32],[32,0],[-32,0],[0,-32]]){
   const x=player.x+dx,y=player.y+dy;
   if([[-9,-9],[9,-9],[-9,9],[9,9]].every(([a,b])=>isTileWalkable(tileAt(x+a,y+b))&&!TILE_PROPERTIES[tileAt(x+a,y+b)]?.isTransition)&&
    !npcRouteCustomSolidBlocks(x,y)&&!SIMPLE_NPCS.some(n=>n.map===currentContentLocationKey()&&n.solid&&Math.abs(n.x-x)<22&&Math.abs(n.y-y)<22))return {x,y,facing:'left'};
  }
  return null;
 }
 function begin(kind){
  if(scene||activityOwnership.conflicts([]).length)return false;
  const withEsla=persistentParty.isAvailable('esla'),companion=withEsla?companionPosition():null;
  if(withEsla&&!companion&&kind!=='vision')return false;
  scene={kind,token:++generation,map:here(),x:player.x,y:player.y,withEsla,companion:kind==='vision'?null:companion};return true;
 }
 const valid=token=>scene&&scene.token===token&&here()===scene.map&&player.x===scene.x&&player.y===scene.y&&persistentParty.isAvailable('esla')===scene.withEsla;
 function say(lines,done=()=>{}){
  const token=scene.token;
  dialogue.name='';setSpeakerDialoguePages(lines.filter(([id])=>id!=='esla'||scene.withEsla).map(([speakerId,text])=>({speakerId,lines:[text]})));
  dialogue.page=0;dialogue.open=true;dialogue.callbacks=[()=>{if(!valid(token)){if(scene?.token===token)scene=null;return;}scene=null;done();}];
 }
 function choose(title,options,callbacks){
  if(!begin('choice'))return;
  const token=scene.token;choice.title=title;choice.options=options;choice.cursor=0;choice.open=true;
  choice.callbacks=callbacks.map(cb=>()=>{if(!valid(token))return;scene=null;cb();});
 }
 const offer=[
  ['mornay_marit_voss','“Greybank Mill has stopped. Creatures in the works. We need it cleared to protect Mornay’s food supply. The commission pays 150 gold on completion.”'],
  ['esla','“We came for assistance with Calwick and Drenwick. A man is dead. Another is missing.”'],
  ['mornay_marit_voss','“I remember your report. Freeing resources begins with dealing with immediate priorities. Hungry people cannot wait for specialists.”'],
  ['mornay_marit_voss','“Greybank stands beside the CHAMBERI RIVER valley waterway, southwest of the lowland crossing. Take the southern valley to the mill marker. Speak to the workers.”'],
  ['esla','“Then we will clear it. But this is not an answer to the Supervisor’s request.”'],
 ];
 const intro=[
  [null,'The canvas door opens. A woman steps inside. Two people follow her and stop on either side of the entrance.'],
  ['greybank_brenna','“Hands where I can see them. That is my table.”'],
  ['lely','“The mill is locked.”'],
  ['esla','“Stay behind me, Lély. We have not taken anything.”'],
  ['greybank_ovan','“Uniforms. Of course.”'],
  ['greybank_teri','“Let her speak, Ovan.”'],
  ['greybank_brenna','“Brenna. Voss sent you to save the food supply? There is food inside. It has owners now. Somehow the people who paid for it are not among them.”'],
  ['esla','“If you have an accusation, make it plainly.”'],
  ['greybank_brenna','“Relief grain, private locks. People working without pay. I organise the people your office leaves hungry. Call us Reclaimers if you need a heading.”'],
  ['esla','“You will find no sympathy from me for the Flame, either.”'],
  ['greybank_brenna','“The Unshackled Flame would put a rareborn boot on the same necks. They are our enemies. Do not confuse us.”'],
  ['greybank_brenna','“The creatures are real. We cannot reach the works. You can clear them, and you can read a sack label. Here is the key. Go and see whose interests you are protecting.”'],
  ['esla','“Getting the workers back safely is worth doing. It does not mean I agree with you about the Empire.”'],
  ['greybank_brenna','“I asked you to open your eyes, not change your coat.”'],
 ];
 const report=[
  ['lely','“The mill is clear. The relief grain is locked in private storage. The workers have not been paid.”'],
  ['mornay_marit_voss','“Then deliveries can resume. An excellent result.”'],
  ['lely','“The instructions say to hold it for a higher drought price. A quarter of the proceeds goes to you.”'],
  ['mornay_marit_voss','“My distribution interest is properly recorded. Grain must be stored, transported and sold by someone. Ownership is not part of your commission.”'],
  ['esla','“And the unpaid wages? Does their work count as part of somebody’s commission?”'],
  ['mornay_marit_voss','“An operating matter for the partners. You were retained to remove creatures. You have done so. Your fee is 150 gold.”'],
  ['esla','“We have restored your business. We still need help for Calwick and Drenwick.”'],
  ['mornay_marit_voss','“Your request remains on record. I have no deployment to offer you.”'],
  ['esla','“Then our purpose here has not changed.”'],
  [null,'Commission complete: Greybank Mill. Received 150 gold. No assistance has been assigned.'],
 ];
 function interact(n){
  if(n.map!==currentContentLocationKey()||!near(n.x/TILE,n.y/TILE,TALK_RADIUS)||invariantErrors().length)return false;
  if(n.id==='mornay_marit_voss'){
   if(!mq5_report_delivered||!begin('audience'))return false;
   if(greybank_stage<=1){greybank_stage=1;say(offer,()=>choose('Greybank Mill — 150 gold',['Accept the commission','Not yet'],[()=>{if(greybank_stage===1&&mq5_report_delivered){greybank_stage=2;MainQuest=6;syncQuestFlagsToWindow();}},()=>{}]));}
   else if(greybank_stage===3&&finished())say(report,()=>{if(greybank_stage===3&&finished()){stats.gold+=GREYBANK_FEE;greybank_stage=4;}});
   else say([['mornay_marit_voss',greybank_stage===4?'“Your fee has been paid. The request from Calwick remains on record. I have no further answer.”':'“Greybank Mill, in the southern CHAMBERI RIVER valley. Clear the whole works, then report here for your 150 gold.”']]);
   return true;
  }
  if(!n.id.startsWith('greybank_')||!begin('conversation'))return false;
  const lines={
   greybank_brenna:won(3)?'“You made it safe. Good. Now watch who gets paid. We will keep feeding the families while they argue about accounts.”':'“Through the main floor, up to the machinery, down into the store. The wheelhouse is beyond it. Do not mistake our key for an invitation to join us.”',
   greybank_ovan:'“I used to turn that wheel. Three weeks owed. They can afford a lock, but not my wages.”',
   greybank_teri:'“We share food. We move it without asking permission, too. Brenna and I disagree about how far that should go. Today there are children waiting for supper.”',
   greybank_dessa:won(3)?'“I can reach the chute again. Thank you. Now I only have to persuade the owners that work ought to be paid.”':'“Three weeks without wages. I swept the meal off my coat into a bowl last night. Tell that to whoever sent you.”',
  };say([[n.id,lines[n.id]]]);return true;
 }
 function tryDoor(){
  const point=regionalPlayerWorldPoint(),local=point?regionWorldPxToLocal(point.regionId,point.worldPxX,point.worldPxY):null;
  const col=Math.floor((local?local.localPxX:player.x)/TILE),row=Math.floor((local?local.localPxY:player.y)/TILE);
  const d=GREYBANK_DOORS.find(d=>d.source===here()&&d.col===col&&d.row===row);if(!d)return false;
  if(d.access&&greybank_stage<3){showWorldToast('Locked. The workers point towards the riverside tent.');return true;}
  if(d.requires&&(greybank_wins&d.requires)!==d.requires){showWorldToast('Clear the creatures here before going farther.');return true;}
  return transitionToLocation({mapId:d.target,x:d.x,y:d.y,facing:d.facing,cooldown:true});
 }
 function tryVision(){
  if(here()!=='GREYBANK_MAIN_MAP'||greybank_stage<3||greybank_vision_seen||!begin('vision'))return false;
  const token=scene.token;enterDream();dialogue.name='';setSpeakerDialoguePages([
   {speakerId:null,lines:['The cursor is still blinking.']},
   {speakerId:null,lines:['There is no one left to answer.']},
  ]);dialogue.page=0;dialogue.open=true;
  dialogue.callbacks=[()=>{if(scene?.token!==token||scene.kind!=='vision')return;exitDream();greybank_vision_seen=true;scene=null;}];return true;
 }
 function inspect(){
  if(invariantErrors().length)return false;
  if(here()==='GREYBANK_TENT_MAP'&&near(7.5,3.5)){
   if(greybank_stage===2){if(!begin('intro'))return false;say(intro,()=>{if(greybank_stage===2)greybank_stage=3;});}
   else {if(!begin('inspection'))return false;say([[null,greybank_stage<2?'A table holds bowls, a list of unpaid workers and a folded blanket. You leave the papers where they are. Whoever lives here is out.':'Food shares and unpaid wages, written beside the same family names. The key has already been handed over.']]);}return true;
  }
  const b=GREYBANK_BATTLES.find(ready);
  if(b){if(!begin('inspection'))return false;say([[null,b.text]],()=>choose(b.label,['Clear the creatures','Leave them for now'],[()=>{if(ready(b))scriptedPartyEncounters.start('greybank',b.id);},()=>{}]));return true;}
  if(here()==='GREYBANK_STORE_MAP'&&near(12.5,10.5)){
   if(!begin('inspection'))return false;
   if(!won(4))say([[null,'Creatures still guard the repair chest.']]);
   else if(greybank_cache_taken)say([[null,'Only the oiled wrapping remains.']]);
   else say([[null,'A sealed repair chest contains 2 Elixirs and 2 Sapper Charges.']],()=>{if(!greybank_cache_taken&&won(4)){stats.items.push(...['Elixir','Elixir','Sapper Charge','Sapper Charge'].map(createItem));greybank_cache_taken=true;}});
   return true;
  }
  const details={GREYBANK_MAIN_MAP:[2.5,3.5,'The loaded cart carries sacks stamped PUBLIC RELIEF. A fresh private tally is nailed over the delivery list.'],GREYBANK_UPPER_MAP:[4.5,4.5,'Meal dust on the belts. The worn bearings need grease. Someone has left a tin ready for the next shift.'],GREYBANK_STORE_MAP:[3.5,9.5,'Distribution proceeds: Marit Voss, one quarter; operating partners, three quarters. Hold stock for higher drought price. Workers’ wages: deferred.'],GREYBANK_WHEEL_MAP:[2.5,3.5,'A worker’s tools, neatly wrapped against spray. The pit opens onto the valley waterway feeding the CHAMBERI RIVER.']};
  const d=details[here()];if(d&&near(d[0],d[1])&&begin('inspection')){say([[null,d[2]]]);return true;}return false;
 }
 function note(){
  if(!greybank_stage)return null;
  const body=greybank_stage===1?'Offered: Voss proposes 150 gold to clear Greybank Mill in the southern CHAMBERI RIVER valley. Speak to her to accept.':greybank_stage===4?'Completed: cleared Greybank Mill and received 150 gold. Voss defended her share of the withheld relief grain. Workers remain unpaid; no help was promised for Calwick or Drenwick.':greybank_stage===2?'Active MQ6: find Greybank Mill at the southern valley approach (21,7). Its entrance is locked. Search the nearby tent for its occupant.':finished()?'Active MQ6: the mill is clear. Report the withheld relief grain, Voss’s financial interest and the unpaid workers to Voss in Mornay.':'Active MQ6: clear the main floor, upper machinery, grain store and wheelhouse. Brenna has given access. The repair-chest recess is optional.';
  return {title:'MQ6 — The Greybank Mill',body};
 }
 function drawEntry(){
   // Single existing entrance tile, painted as a small timber mill and wheel.
   const x=10*TILE,y=7*TILE;drawInteriorFloor(x,y);ctx.fillStyle='#74583c';ctx.fillRect(x+5,y+12,20,19);ctx.fillStyle='#45463c';ctx.beginPath();ctx.moveTo(x+1,y+14);ctx.lineTo(x+15,y+3);ctx.lineTo(x+28,y+14);ctx.fill();ctx.fillStyle='#b4a078';ctx.fillRect(x+24,y+19,6,10);
  }
 function draw(){
  const id=here();
  if(!GREYBANK_CONTENT_KEYS[id])return;
  if(id==='GREYBANK_YARD_MAP'){
   ctx.fillStyle='#5b5445';ctx.fillRect(7*TILE,2*TILE,5*TILE,2*TILE);for(let y=2*TILE+5;y<4*TILE;y+=8){ctx.fillStyle='#82745b';ctx.fillRect(7*TILE+3,y,5*TILE-6,2);}ctx.fillStyle='#9a8866';ctx.beginPath();ctx.moveTo(2*TILE,5*TILE);ctx.lineTo(3.5*TILE,2.5*TILE);ctx.lineTo(5*TILE,5*TILE);ctx.fill();
   drawMornayStreetProp('cart',9*TILE,9*TILE);drawMornayStreetProp('nets',12*TILE,4*TILE);
  }
  for(const f of GREYBANK_FIXTURES[id]||[]){drawInteriorFloor(f.col*TILE,f.row*TILE);drawMornayFixture(f);}
  for(const d of GREYBANK_DOORS.filter(d=>d.source===id)){
   if(d.stairs)drawMornayStairs(d.col,d.row,d.stairs==='up');
   else if(id==='GREYBANK_YARD_MAP'&&d.row===13)drawPath(d.col*TILE,d.row*TILE);
   else drawInteriorExit(d.col*TILE,d.row*TILE,false);
  }
  // Static timber wheel sits entirely over the solid water pit. No animation,
  // new tile type or collision override; its shaft ends at the existing wall.
  if(id==='GREYBANK_WHEEL_MAP'){
   const x=14*TILE,y=6*TILE;ctx.strokeStyle='#473b2c';ctx.lineWidth=9;
   ctx.beginPath();ctx.ellipse(x,y,26,56,0,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#a28657';ctx.lineWidth=4;
   for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*26,y+Math.sin(a)*56);ctx.stroke();}
   ctx.fillStyle='#5b4932';ctx.fillRect(13*TILE,y-5,TILE,10);ctx.fillStyle='#ad9c78';ctx.fillRect(x-5,y-6,10,12);
  }

  if(id==='GREYBANK_MAIN_MAP'||id==='GREYBANK_UPPER_MAP'){
   const x=4*TILE,y=5*TILE;ctx.fillStyle='#6c7069';ctx.beginPath();ctx.ellipse(x+32,y+24,29,18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#323c36';ctx.fillRect(x+29,y+11,6,24);
  }
  if(id==='GREYBANK_STORE_MAP'){ctx.font='8px monospace';ctx.textAlign='left';ctx.fillStyle='#efe0ae';ctx.fillText('RELIEF',2*TILE,2*TILE+20);}
  for(const b of GREYBANK_BATTLES)if(b.mapId===id&&!won(b.id)){
   ctx.save();ctx.translate(b.x*TILE,b.y*TILE);ctx.scale(.38,.38);ENEMY_SPRITE_DISPATCH[b.enemies[0]].draw(0,0);ctx.restore();drawNPCSpaceHint({x:b.x*TILE,y:b.y*TILE},b.x*TILE,b.y*TILE);
  }
  if(id==='GREYBANK_TENT_MAP')drawNPCSpaceHint({x:240,y:112},240,112);
  const c=companion();if(c)drawWalkingEslaFigure(c,c.facing,0);
 }
 function companion(){return scene&&scene.map===here()?scene.companion:null;}
 return Object.freeze({interact,inspect,tryDoor,tryVision,note,draw,drawEntry,companion,invariantErrors,
  eligible:id=>Number.isInteger(id)&&id>=0&&id<5&&ready(GREYBANK_BATTLES[id])&&!invariantErrors().length,
  isActive:()=>scene!==null,phase:()=>scene?.kind||null,
  reset(){if(scene?.kind==='vision')exitDream();scene=null;generation++;},
 });
})();
