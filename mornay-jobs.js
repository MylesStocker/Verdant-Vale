'use strict';

// Optional local contracts. Progress uses three defaulted v5 quest bindings;
// combat outcomes are committed only by scriptedPartyEncounters' receipt owner.
const MORNAY_REMOVALS=Object.freeze([
 Object.freeze({key:'mornay_peat_hunt',title:'The Peat-Bed Maw',giver:'mornay_iset_brill',name:'Iset',
  giverPlace:'Middle Lower West, at the peat stall',mapId:'MAINLAND_CN3RN8_MAP',x:8.5,y:6.5,enemy:'enemy_peat_bed_maw',reward:250,
  directions:'Deep in the western Great Fen: the Willow Basin west of Calwick, far north of the southern fen approaches. Look for torn peat beside the gravel shelf. Survey square (-3,-8), centre clearing.',
  offer:'The western cutters have stopped going to their peat beds. There is a mouth in the peat, wide enough to take a cart. The ground around it is part of the jaw. Their fuel pays our winter rent. We have put together 250 gold to clear it.',
  warning:'The pale ridges are teeth. A giant mouth opens in the peat, and the whole clearing heaves. Defeat it within six full rounds or Swallow takes the entire party. Prepare your hardest attacks; you can still retreat.',
  thanks:'The cutters can use the beds again. That is what we paid for. Here: 250 gold, counted twice by people who could ill afford it.'}),
 Object.freeze({key:'mornay_ridge_hunt',title:'The Ridgeback Snapper',giver:'mornay_torlin_hesk',name:'Torlin',
  giverPlace:'Rusk Workshop Court, on Middle Lower Central East',mapId:'MAINLAND_C28R6_MAP',x:11.5,y:6.5,enemy:'enemy_ridgeback_snapper',reward:300,
  directions:'Deep in the eastern mainland: leave Mornay by its southern road, follow the lakeshore east toward the river mouth, cross at Reedbank, then head southeast into the upper river country. Upper River Valley, survey square (28,6), eastern gravel shelf.',
  offer:'The eastern timber crews have abandoned their stacking ground. A great snapper is breaking axles and dragging the wood into the shallows. Clear it and I can pay 300 gold from the crews’ removal fund.',
  warning:'Splintered axle ends lie on the gravel. A broad-backed snapper waits among them. There is room to retreat; it has not cornered you.',
  thanks:'Good. Sound timber, sound wheels, fewer men trying to carry a cart home. Your 300 gold is here. The crews can judge the ground before they return.'}),
]);
const MORNAY_JOB_BOARD=Object.freeze({mapId:'MORNAY_SOUTH_UPPER_EAST_MAP',x:7.5,y:5.5});
const mornayJobs=(()=>{
 const packet='Hoist Inspection Packet';
 const progress=i=>i===0?mornay_peat_hunt:mornay_ridge_hunt;
 const setProgress=(i,s)=>{if(i===0)mornay_peat_hunt=s;else mornay_ridge_hunt=s;syncQuestFlagsToWindow();};
 const here=()=>mapIdForRef(activeMap);
 const near=(x,y,r=TALK_RADIUS)=>Math.hypot(player.x-x*TILE,player.y-y*TILE)<r;
 const nearby=n=>n&&n.map===currentContentLocationKey()&&near(n.x/TILE,n.y/TILE);
 function invariantErrors(source){
  const a=source?(source.mornay_peat_hunt??0):mornay_peat_hunt,b=source?(source.mornay_ridge_hunt??0):mornay_ridge_hunt,e=source?(source.mornay_hoist_errand??0):mornay_hoist_errand;
  const errors=[];
  if(!Number.isInteger(a)||a<0||a>3||!Number.isInteger(b)||b<0||b>3)errors.push('Mornay removal: invalid stage');
  if(!Number.isInteger(e)||e<0||e>5)errors.push('Mornay errand: invalid stage');
  const items=source?source.stats?.items:stats.items;
  if(!Array.isArray(items)||items.filter(i=>i.name===packet).length!==(e>0&&e<5?1:0))errors.push('Mornay errand: packet does not match stage');
  return errors;
 }
 const valid=()=>!invariantErrors().length;
 function say(name,entries,callback){
  dialogue.name=name;setSpeakerDialoguePages(entries.filter(([id])=>id!=='esla'||persistentParty.isAvailable('esla')).map(([speakerId,line])=>({speakerId,lines:[line]})));
  dialogue.page=0;dialogue.callbacks=callback?[callback]:null;dialogue.open=true;
 }
 function choose(title,accept,callback){choice.title=title;choice.options=[accept,'Not now'];choice.cursor=0;choice.callbacks=[callback,()=>{}];choice.open=true;}
 const available=()=>MainQuest>=5&&valid();
 function offer(n,title,entries,callback){say(n.name,entries,()=>{if(nearby(n)&&available())choose(title,'Accept the job',callback);});}
 function interact(n){
  if(!nearby(n)||!available())return false;
  const i=MORNAY_REMOVALS.findIndex(b=>b.giver===n.id);
  if(i>=0){
   const b=MORNAY_REMOVALS[i],s=progress(i);
   if(s===0){offer(n,b.title,[[n.id,b.offer],[n.id,b.directions],['esla',i===0?'That whole clearing is a jaw. Once we engage, we have six rounds before it swallows us. Both of us. Bring damage items and your best weapons; this is no time to save supplies.':'A removal contract, not a race. Take supplies, leave yourself a route out, and come back if it is too much.']],()=>{
    if(!nearby(n)||!available()||progress(i)!==0)return;setProgress(i,1);say(n.name,[[n.id,'Agreed. I have marked the location and fee in your notebook. Come back to me when the ground is clear.']]);
   });return true;}
   if(s===1){say(n.name,[[n.id,b.directions],[n.id,'The fee is for clearing that particular ground. Ordinary creatures along the way do not count.']]);return true;}
   if(s===2){say(n.name,[[n.id,b.thanks]],()=>{if(!nearby(n)||!available()||progress(i)!==2)return;stats.gold+=b.reward;setProgress(i,3);});return true;}
   return false;
  }
  const gessa='mornay_gessa_tarn',arlis='mornay_arlis_rook',maura='mornay_maura_dell',s=mornay_hoist_errand;
  if(n.id===gessa&&s===0){offer(n,'A Copy of a Copy',[[gessa,'Arlis wants the hoist inspection copied before he will acknowledge the original. Bring it back with his mark and I will pay you 35 gold. The rope is still condemned. Nobody is to lift a load on a promise.']],()=>{
    if(!nearby(n)||!available()||mornay_hoist_errand!==0)return;
    const item=createItem(packet);stats.items.push(item);mornay_hoist_errand=1;syncQuestFlagsToWindow();say(n.name,[[gessa,'Received: Hoist Inspection Packet. Take it to Arlis in the Regional IJC Office.']]);
   });return true;}
  const turns={
   1:{id:arlis,next:2,lines:[[arlis,'This is the inspection. I asked for the covering request. Take it back to Gessa for a statement that she wants me to read it.'],['esla','She paid someone to carry it here. Consider that a clue.']]},
   2:{id:gessa,next:3,lines:[[gessa,'There. “Please read the attached inspection.” I have signed it. Now Maura at the harbour public room must acknowledge that the hoist stands on a quay.'],['esla','We should charge the paper rent. It has visited half the town.']]},
   3:{id:maura,next:4,lines:[[maura,'It does stand on a quay. I can confirm that much. This stamp accepts no responsibility for ropes, loads or Imperial contractors. Return the packet to Gessa.']]},
   4:{id:gessa,next:5,lines:[[gessa,'A marked copy, at last. I will keep it with the condemned rope so nobody can say they never saw either. Received: 35 gold.'],['esla','We have proved that a quay is a quay. A productive afternoon by regional standards.']]},
  };
  const t=turns[s];
  if(t&&n.id===t.id){say(n.name,t.lines,()=>{
    if(!nearby(n)||!available()||mornay_hoist_errand!==s)return;
    if(t.next===5){stats.items.splice(stats.items.findIndex(i=>i.name===packet),1);stats.gold+=35;}
    mornay_hoist_errand=t.next;syncQuestFlagsToWindow();
   });return true;}
  if(n.id===gessa&&s>0&&s<5){say(n.name,[[gessa,errandNote()]]);return true;}
  return false;
 }
 function eligible(i){const b=MORNAY_REMOVALS[i];return Number.isInteger(i)&&!!b&&available()&&progress(i)===1&&here()===b.mapId&&near(b.x,b.y,56);}
 function inspect(){
  const board=MORNAY_JOB_BOARD;
  if(here()===board.mapId&&near(board.x,board.y)){
   const pages=MORNAY_REMOVALS.map((b,i)=>[null,`${b.title}${progress(i)===3?' — paid':''}. ${b.reward} gold. Ask ${b.name} at ${b.giverPlace}. Dangerous removal work deep in the wilderness.`]);
   pages.push([null,'A Copy of a Copy. 35 gold for carrying inspection papers. Ask Gessa, the unloading forewoman on Middle Upper West. No wilderness travel required.']);
   say('Mornay Job Board',pages);return true;
  }
  const i=MORNAY_REMOVALS.findIndex(b=>here()===b.mapId&&near(b.x,b.y,56));
  if(i<0||progress(i)>=2)return false;
  const b=MORNAY_REMOVALS[i];
  say(b.title,[[null,b.warning]],()=>{
   if(eligible(i))choose(b.title,'Confront the creature',()=>{if(eligible(i))scriptedPartyEncounters.start('mornay_removal',i);});
   else if(here()===b.mapId&&near(b.x,b.y,56))say(b.title,[[null,`A removal notice in Mornay names ${b.name}, at ${b.giverPlace}, as the contact. Agree the job before tackling this creature.`]]);
  });return true;
 }
 function errandNote(){return [null,'Take the Hoist Inspection Packet to Arlis in Mornay Regional IJC Office.','Return to Gessa on Middle Upper West for the covering request.','Take the signed packet to Maura in the Harbour Office public room.','Return the stamped packet to Gessa on Middle Upper West. Fee: 35 gold.','Delivered the marked inspection packet to Gessa. Paid 35 gold. The hoist remains condemned pending proper repairs.'][mornay_hoist_errand];}
 function notes(){
  const result=MORNAY_REMOVALS.flatMap((b,i)=>{const s=progress(i);return s?[{title:b.title,body:s===3?`Removal complete. ${b.name} paid ${b.reward} gold.`:s===2?`Ground cleared. Return to ${b.name} at ${b.giverPlace} for ${b.reward} gold.`:b.directions+` Return to ${b.name} for ${b.reward} gold. ${i===0?'Six full rounds before Swallow defeats the entire party. Bring strong damage options. ':''}Prepare for a boss-level fight; retreat is allowed.`}]:[];});
  if(mornay_hoist_errand)result.push({title:'A Copy of a Copy',body:errandNote()});return result;
 }
 function draw(){
  const board=MORNAY_JOB_BOARD;
  if(here()===board.mapId){drawNoticeBoardTile((board.x-.5)*TILE,(board.y-.5)*TILE);drawNPCSpaceHint({x:board.x*TILE,y:board.y*TILE},board.x*TILE,board.y*TILE);}
  for(let i=0;i<MORNAY_REMOVALS.length;i++){
   const b=MORNAY_REMOVALS[i];if(here()!==b.mapId||progress(i)>=2)continue;
   ctx.save();ctx.translate(b.x*TILE,b.y*TILE);
   ctx.fillStyle='#75604b';for(const [x,y,w]of [[-34,17,20],[-10,23,26],[22,8,17]])ctx.fillRect(x,y,w,4);
   ctx.scale(.5,.5);ENEMY_SPRITE_DISPATCH[b.enemy].draw(0,0);ctx.restore();
   drawNPCSpaceHint({x:b.x*TILE,y:b.y*TILE},b.x*TILE,b.y*TILE);
  }
 }
 return Object.freeze({interact,inspect,eligible,notes,invariantErrors,draw});
})();
