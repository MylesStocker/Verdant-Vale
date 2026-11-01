'use strict';
const LANTERN_FEE=175;
const LANTERN_BATTLES=Object.freeze([
 {id:0,map:'TRACK',x:3.5,y:7.5,requires:0,stage:2,label:'The fallen guest road',enemies:['enemy_hollowreed_choker','enemy_botfly'],text:'A Hollowreed Choker grips the broken handrail. A Botfly circles the only dry bend. The old guest road continues uphill beyond them.'},
 {id:1,map:'GULLY',x:7.5,y:6.5,requires:1,stage:2,label:'Timber in the gully',enemies:['enemy_fen_rootworm','enemy_lantern_moth','enemy_marsh_rat'],text:'A rootworm has undermined the fallen timber. Moths and rats crowd the gap. Beyond it, an orchard lantern is still lit.'},
 {id:2,map:'CHANNEL',x:3.5,y:5.5,requires:3,stage:5,label:'The water steps',enemies:['enemy_mudwrack_snapper','enemy_sparkeel'],text:'A Snapper has claimed the intake path; a Sparkeel flashes in the wet roots beside it. Neris’s float marks the treacherous pull. There is safe ground behind you.'},
 {id:3,map:'INTAKE',x:6.5,y:5.5,requires:7,stage:5,label:'The jammed screen',enemies:['enemy_waspthra','enemy_fen_rootworm','enemy_mire_toad_female'],text:'A Waspthra circles the jammed screen. A rootworm and Mire Toad move beneath it. Clear them before anyone tries to shift the branches. The bank offers a way back.'},
 {id:4,map:'COPSE',x:11.5,y:5.5,requires:7,stage:5,label:'The abandoned store',enemies:['enemy_willow_veiled_stalker','enemy_lantern_moth'],text:'A Stalker and Lantern Moth guard an old carrier’s cache. Its dense bark turns blades; thrown supplies can break through. This detour is optional. Leave it if you need your strength for the intake.'},
].map(b=>Object.freeze({...b,mapId:'LANTERN_'+b.map+'_MAP',enemies:Object.freeze(b.enemies)})));
const lanternHouse=(()=>{
 let scene=null,generation=0;
 const here=()=>regionalActiveMapId();
 const near=(x,y,r=44)=>Math.hypot(player.x-x*TILE,player.y-y*TILE)<r;
 const won=i=>!!(lantern_wins&(1<<i));
 const ready=b=>!!b&&lantern_stage>=b.stage&&!won(b.id)&&(lantern_wins&b.requires)===b.requires&&here()===b.mapId&&near(b.x,b.y,54);
 function invariantErrors(s){
  const v=s||{lantern_stage,lantern_wins,lantern_cache_taken,greybank_stage,MainQuest};
  const st=v.lantern_stage??0,w=v.lantern_wins??0,c=v.lantern_cache_taken??false,e=[];
  if(!Number.isInteger(st)||st<0||st>8||!Number.isInteger(w)||w<0||w>31||typeof c!=='boolean')e.push('Lantern House: malformed progress');
  if(st>0&&v.greybank_stage!==4||st>=2&&v.MainQuest<7||st<2&&v.MainQuest===7)e.push('Lantern House: assignment prerequisite');
  if(st<2&&w||(w&2)&&!(w&1)||(w&4)&&((w&3)!==3||st<5)||(w&8)&&(w&7)!==7||(w&16)&&(w&7)!==7||c&&!(w&16)||st>=3&&(w&3)!==3||st>=6&&(w&15)!==15)e.push('Lantern House: inconsistent progress');
  return e;
 }
 function companionPosition(){
  for(const [dx,dy]of [[32,0],[-32,0],[0,32],[32,32],[-32,32],[0,-32]]){
   const x=player.x+dx,y=player.y+dy;
   if([[-9,-9],[9,-9],[-9,9],[9,9]].every(([a,b])=>isTileWalkable(tileAt(x+a,y+b))&&!TILE_PROPERTIES[tileAt(x+a,y+b)]?.isTransition)&&!npcRouteCustomSolidBlocks(x,y)&&!SIMPLE_NPCS.some(n=>n.map===currentContentLocationKey()&&n.solid&&Math.abs(n.x-x)<22&&Math.abs(n.y-y)<22))return {x,y,facing:player.facing};
  }
  return null;
 }
 function begin(kind){
  if(scene||activityOwnership.conflicts([]).length)return false;
  const withEsla=persistentParty.isAvailable('esla'),companion=withEsla?companionPosition():null;
  if(withEsla&&!companion)return false;
  scene={kind,token:++generation,map:here(),x:player.x,y:player.y,withEsla,companion,stage:lantern_stage,wins:lantern_wins};return true;
 }
 const valid=t=>scene&&scene.token===t&&scene.map===here()&&scene.x===player.x&&scene.y===player.y&&scene.withEsla===persistentParty.isAvailable('esla')&&scene.stage===lantern_stage&&scene.wins===lantern_wins;
 function say(lines,done=()=>{}){
  const t=scene.token;dialogue.name='';setSpeakerDialoguePages(lines.map(([speakerId,text])=>({speakerId,lines:[typeof text==='function'?text():text]})));dialogue.page=0;dialogue.open=true;
  dialogue.callbacks=[()=>{if(!valid(t)){if(scene?.token===t)scene=null;return;}scene=null;done();}];
 }
 function choose(title,options,callbacks){
  if(!begin('choice'))return;
  const t=scene.token;choice.title=title;choice.options=options;choice.cursor=0;choice.open=true;
  choice.callbacks=callbacks.map(cb=>()=>{if(!valid(t)){if(scene?.token===t)scene=null;return;}scene=null;cb();});
 }
 function speech(lines,done=()=>{}){if(begin('conversation'))say(lines,done);}
 function keyScene(lines,done=()=>{}){
  if(!begin('conversation'))return;
  if(!scene.withEsla){say([[null,'Esla needs to be here for this conversation. If she is away for Fine Needlework, finish that errand and reunite at the commercial inn. You can still explore and return later.']]);return;}
  say(lines,done);
 }
 function reply(title,options,after,done){
  choose(title,options,options.map((line,i)=>()=>keyScene([...(i===options.length-1?[[null,'You let the silence remain.']]:[['lely',line]]),...after],done)));
 }
 function interact(n){
  if(n.map!==currentContentLocationKey()||!near(n.x/TILE,n.y/TILE,TALK_RADIUS)||invariantErrors().length)return false;
  if(n.id==='mornay_marit_voss'){
   if(greybank_stage!==4)return false;
   if(lantern_stage<2){
    if(!persistentParty.isAvailable('esla')){keyScene([]);return true;}
    if(!begin('briefing'))return false;
    lantern_stage=1;scene.stage=1;
    say(LANTERN_DIALOGUE.offer,()=>choose('MQ7 — The Missing Practitioner',['Accept — locate Neris','Not yet'],[()=>{if(lantern_stage===1&&greybank_stage===4&&persistentParty.isAvailable('esla')){lantern_stage=2;MainQuest=7;syncQuestFlagsToWindow();}},()=>{}]));
   }else if(lantern_stage===7)keyScene(LANTERN_DIALOGUE.report,()=>{if(lantern_stage===7){lantern_stage=8;stats.gold+=LANTERN_FEE;}});
   else keyScene([['mornay_marit_voss',lantern_stage===8?'Your report is filed and your fee paid. There is no further assignment yet.':'Find Neris at the Lantern House, off the Shingle Headlands at (20,0). Establish what happened, then report.']]);
   return true;
  }
  if(!n.id.startsWith('lantern_'))return false;
  if(n.id==='lantern_neris'){
   if(lantern_stage===2&&(lantern_wins&3)===3)keyScene(LANTERN_DIALOGUE.welcome,()=>reply('Overlooked at the table',['You can ask me.','I am here on assignment too.','Say nothing'],LANTERN_DIALOGUE.welcomeAfter,()=>{lantern_stage=3;}));
   else if(lantern_stage===4)keyScene(LANTERN_DIALOGUE.water,()=>{lantern_stage=5;});
   else if(lantern_stage===5&&(lantern_wins&15)===15)keyScene(LANTERN_DIALOGUE.resolution,()=>reply('Beside the water steps',['I am still here.','We both cleared it.','Say nothing'],LANTERN_DIALOGUE.politics,()=>{lantern_stage=6;}));
   else speech([[n.id,lantern_stage<2?'I am Neris. The road is dangerous. You should speak to the regional office before taking its business into your own hands.':lantern_stage===3?'Speak to Orren in the orchard. I will meet you at the water steps, along the east path.':lantern_stage===5?'Clear the steps, follow the reed cut north, then clear the upper intake. Come back to me when the screen is safe.': 'I meant what I said. I am staying. And I still put too much pepper in the soup.']]);
  }else if(n.id==='lantern_orren'&&lantern_stage===3)keyScene(LANTERN_DIALOGUE.history,()=>{lantern_stage=4;});
  else {
   const lines={
    lantern_orren:'Dry socks and an address to write to. That is what I offer here. Neris wants the Flame to rule; I want no child to have to earn safety by agreeing with her.',
    lantern_vena:'They broke my window after I came home. Neris gave me a bed, but shelter is not a signature under her politics. I do not know where to go next. Have you eaten?',
    lantern_mara:'I mend nets. Nothing rare about me. Ilan is rareborn; neither parent is. Neris forgets my cup too. I remind her. A room where my child can sleep safely is worth a little reminding.',
    lantern_ilan:'Orren says the Junior Academy is in the Bowl. I have never seen a crater! Mum is worried. I mostly worry about finding the right dormitory. This is only a guesthouse until we can travel.',
   };speech([[n.id,lines[n.id]]]);
  }
  return true;
 }
 function inspect(){
  if(invariantErrors().length)return false;
  if(here()==='LANTERN_ORCHARD_MAP'&&near(3.5,9.5)&&lantern_stage===6){
   keyScene(LANTERN_DIALOGUE.private,()=>choose('A quiet moment',['Did the Academy feel like home?','I felt invisible in there.'],[
    ()=>keyScene([['lely','Did the Academy feel like home?'],['esla','Sometimes. It was a gift and it watched us. I told you at the campfire what protection meant to me. That history is mine to tell, not somebody else’s argument.'],...LANTERN_DIALOGUE.privateAfter],()=>{lantern_stage=7;}),
    ()=>keyScene([['lely','I felt invisible in there.'],['esla','You were not imagining it. I enjoyed being recognised and was slow to notice who was being ignored.'],...LANTERN_DIALOGUE.privateAfter],()=>{lantern_stage=7;}),
   ]));return true;
  }
  const b=LANTERN_BATTLES.find(ready);
  if(b){speech([[null,b.text]],()=>choose(b.label,['Clear the creatures','Retreat for now'],[()=>{if(ready(b))scriptedPartyEncounters.start('lantern_house',b.id);},()=>{}]));return true;}
  if(here()==='LANTERN_COPSE_MAP'&&near(12.5,3.5)){
   speech([[null,!won(4)?'Creatures guard the carrier’s cache.':lantern_cache_taken?'The carrier’s chest is empty.':'Found 3 Elixirs and 2 Reed Remedies in the abandoned carrier’s chest.']],()=>{
    if(won(4)&&!lantern_cache_taken){stats.items.push(...['Elixir','Elixir','Elixir','Reed Remedy','Reed Remedy'].map(createItem));lantern_cache_taken=true;}
   });return true;
  }
  const r=LANTERN_READINGS.find(r=>here()==='LANTERN_'+r.map+'_MAP'&&near(r.x,r.y));
  if(r){speech([[null,r.text]]);return true;}
  return false;
 }
 const doorsByMap=Object.freeze(Object.fromEntries([...new Set(LANTERN_DOORS.map(d=>d.source))].map(id=>[id,LANTERN_DOORS.filter(d=>d.source===id)])));
 function tryDoor(){
  const doors=doorsByMap[here()];if(!doors)return false;
  const p=regionalPlayerWorldPoint(),local=p?regionWorldPxToLocal(p.regionId,p.worldPxX,p.worldPxY):null;
  const col=Math.floor((local?local.localPxX:player.x)/TILE),row=Math.floor((local?local.localPxY:player.y)/TILE);
  const d=doors.find(d=>d.col===col&&d.row===row);if(!d)return false;
  if(d.stage&&lantern_stage<d.stage){showWorldToast('Speak to Neris at the water steps before entering the cut.');return true;}
  if(d.wins&&(lantern_wins&d.wins)!==d.wins){showWorldToast('The creatures must be cleared before the route is safe.');return true;}
  return transitionToLocation({mapId:d.target,x:d.x,y:d.y,facing:d.facing,cooldown:true});
 }
 function note(){
  if(!lantern_stage)return null;
  const body=[null,'Offered MQ7: Voss offers 175 gold to locate Neris. Reunite with Esla, then accept at the regional office.',
   'Active MQ7: follow the lantern sign in the Shingle Headlands (20,0). Clear the old guest road and timber gully; speak to Neris in the common room with Esla.',
   'Active MQ7: Neris is alive and left voluntarily. Speak with Orren in the orchard about the house and its blocked water route.',
   'Active MQ7: meet Neris with Esla at the water steps, east of the orchard.',
   (lantern_wins&15)===15?'Active MQ7: the intake is safe. Return to Neris at the water steps with Esla.':'Active MQ7: clear the water steps and upper intake through the reed cut. The old store across the bridge is optional. Return to Neris afterward.',
   'Active MQ7: speak privately with Esla at the orchard bench before writing your report.',
   'Active MQ7: report to Voss with Esla. Neris left voluntarily and is Flame-aligned; the house’s residents hold different views. No capture was authorised.',
   'Completed MQ7: Neris located alive; voluntary departure and Flame allegiance reported truthfully. Received 175 gold. No raid, arrest or onward assignment issued.'][lantern_stage];
  return {title:'MQ7 — The Missing Practitioner',body};
 }
 function drawEntry(){
  const x=7*TILE,y=3*TILE;drawPath(x,y);ctx.fillStyle='#766047';ctx.fillRect(x+5,y+6,3,25);ctx.fillRect(x+3,y+6,22,11);ctx.fillStyle='#efd390';ctx.fillRect(x+12,y+8,7,7);
 }
 function draw(){
  const id=here(),m=LANTERN_MAPS.find(m=>m.id===id);if(!m)return;
  for(const [kind,col,row]of LANTERN_FIXTURES[m.key]||[]){drawInteriorFloor(col*TILE,row*TILE);drawMornayFixture({kind,col,row});}
  for(const d of doorsByMap[id]||[]){if(m.indoor||m.key==='ORCHARD'&&d.target==='LANTERN_HALL_MAP')drawInteriorExit(d.col*TILE,d.row*TILE,false);else drawPath(d.col*TILE,d.row*TILE);}
  if(m.key==='ORCHARD'){
   ctx.fillStyle='#b0a082';ctx.fillRect(4*TILE,2*TILE,8*TILE,3*TILE);
   ctx.fillStyle='#4b4a48';ctx.fillRect(4*TILE-4,TILE,8*TILE+8,2*TILE);
   for(let y=TILE+4;y<3*TILE;y+=7){ctx.fillStyle='#6d6a60';ctx.fillRect(4*TILE-2,y,8*TILE+4,2);}
   for(const x of [4,8,11]){ctx.fillStyle='#5a4937';ctx.fillRect(x*TILE,3*TILE,5,2*TILE);}
   for(const x of [5,9]){ctx.fillStyle='#4b4a3b';ctx.fillRect(x*TILE-3,3*TILE+5,28,30);ctx.fillStyle='#d0bc83';ctx.fillRect(x*TILE,3*TILE+8,22,24);ctx.fillStyle='#6b5c46';ctx.fillRect(x*TILE+10,3*TILE+8,2,24);ctx.fillRect(x*TILE,3*TILE+19,22,2);}
   drawInteriorExit(7*TILE,5*TILE,false);
  }
  if(m.key==='CHANNEL'){
   // Tidebound demonstration uses the actual channel: a bright guided current
   // and a tethered float, shown only after the completed conversation.
   if(lantern_stage>=5){ctx.strokeStyle='#a5c9cf';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(12*TILE,9*TILE);ctx.lineTo(11*TILE,8*TILE);ctx.lineTo(12*TILE,6*TILE);ctx.stroke();ctx.fillStyle='#d6ad62';ctx.fillRect(11*TILE-4,8*TILE-3,8,6);}
  }
  for(const b of LANTERN_BATTLES)if(b.mapId===id&&!won(b.id)){
   ctx.save();ctx.translate(b.x*TILE,b.y*TILE);ctx.scale(.38,.38);ENEMY_SPRITE_DISPATCH[b.enemies[0]].draw(0,0);ctx.restore();drawNPCSpaceHint({x:b.x*TILE,y:b.y*TILE},b.x*TILE,b.y*TILE);
  }
  for(const r of LANTERN_READINGS)if(r.map===m.key)drawNPCSpaceHint({x:r.x*TILE,y:r.y*TILE},r.x*TILE,r.y*TILE);
  if(m.key==='COPSE')drawNPCSpaceHint({x:400,y:112},400,112);
  const c=companion();if(c)drawWalkingEslaFigure(c,c.facing,0);
 }
 function companion(){return scene&&scene.map===here()?scene.companion:null;}
 return Object.freeze({interact,inspect,tryDoor,note,draw,drawEntry,companion,invariantErrors,
  eligible:id=>Number.isInteger(id)&&id>=0&&id<5&&ready(LANTERN_BATTLES[id])&&!invariantErrors().length,
  isActive:()=>scene!==null,phase:()=>scene?.kind||null,reset(){scene=null;generation++;},
 });
})();
