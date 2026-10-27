'use strict';

// Two ordinary quest bindings, using the existing version-5 missing-field
// defaults. The key is a special item; charges are ordinary registered items.
const twoJorans = (() => {
 const key='Joran’s Supply Key',cache=MORNAY_TWO_JORANS_SUPPLY;
 const ids={officer:'mornay_anric_fell',beck:'two_jorans_beck',alden:'two_jorans_alden',perris:'mornay_perris_dun',varda:'mornay_varda_fen'};
 const evidence={two_jorans_beck:1,mornay_perris_dun:2,mornay_varda_fen:4,two_jorans_alden:8};
 const nearby=n=>n&&n.map===currentContentLocationKey()&&Math.hypot(player.x-n.x,player.y-n.y)<TALK_RADIUS;
 function invariantErrors(source){
  const stage=source?(source.two_jorans_stage??0):two_jorans_stage;
  const facts=source?(source.two_jorans_evidence??0):two_jorans_evidence;
  const items=source?source.stats?.items:stats.items,errors=[];
  if(!Number.isInteger(stage)||stage<0||stage>4)errors.push('Two Jorans: invalid stage');
  if(!Number.isInteger(facts)||facts<0||facts>15)errors.push('Two Jorans: invalid evidence');
  if((stage===0&&facts!==0)||(stage>=2&&facts!==15))errors.push('Two Jorans: evidence does not match stage');
  if(!Array.isArray(items)||items.filter(i=>i.name===key).length!==(stage===3?1:0))errors.push('Two Jorans: key does not match stage');
  return errors;
 }
 const valid=()=>invariantErrors().length===0;
 const changed=()=>syncQuestFlagsToWindow();
 function say(n,entries,callback){
  const pages=entries.filter(([id])=>id!=='esla'||persistentParty.isAvailable('esla'))
   .map(([speakerId,line])=>({speakerId,lines:[line]}));
  dialogue.name=n.name;setSpeakerDialoguePages(pages);dialogue.page=0;
  dialogue.callbacks=callback?[callback]:null;dialogue.open=true;
 }
 function interact(n){
  if(!Object.values(ids).includes(n.id)||!nearby(n)||!valid())return false;
  if(n.id===ids.officer){
   if(two_jorans_stage===0){
    say(n,TWO_JORANS_CONTENT.offer,()=>{
     if(!nearby(n)||two_jorans_stage!==0)return;
     choice.title='Two Jorans';choice.options=['Check the statements','Not now'];choice.cursor=0;
     choice.callbacks=[()=>{if(!nearby(n)||two_jorans_stage!==0||!valid())return;
      two_jorans_stage=1;changed();say(n,TWO_JORANS_CONTENT.accepted);},()=>{}];choice.open=true;
    });return true;
   }
   if(two_jorans_stage===1&&two_jorans_evidence===15){
    say(n,TWO_JORANS_CONTENT.correction,()=>{
     if(!nearby(n)||two_jorans_stage!==1||two_jorans_evidence!==15||!valid())return;
     two_jorans_stage=2;changed();
    });return true;
   }
   say(n,two_jorans_stage===1?[[ids.officer,'I need both men’s accounts, Perris’s work record at the Old Fort, and Varda’s original warehouse statement. Your notebook lists what is still missing.']]:TWO_JORANS_CONTENT.officerDone);return true;
  }
  if(two_jorans_stage===0){
   if(n.id===ids.beck||n.id===ids.alden){say(n,[[n.id,n.dialogue[0][0]]]);return true;}
   return false; // preserve ordinary witness dialogue before the quest
  }
  if(two_jorans_stage===1){
   const name=Object.keys(ids).find(k=>ids[k]===n.id);
   say(n,TWO_JORANS_CONTENT[name],()=>{
    if(!nearby(n)||two_jorans_stage!==1||!valid())return;
    two_jorans_evidence|=evidence[n.id];changed();
   });return true;
  }
  if(n.id===ids.beck){
   if(two_jorans_stage===2){
    say(n,TWO_JORANS_CONTENT.released,()=>{
     if(!nearby(n)||two_jorans_stage!==2||!valid())return;
     const item=createItem(key);stats.items.push(item);two_jorans_stage=3;changed();
    });
   }else say(n,TWO_JORANS_CONTENT[two_jorans_stage===3?'thanks':'finished']);
   return true;
  }
  if(n.id===ids.alden){say(n,TWO_JORANS_CONTENT.aldenDone);return true;}
  return false;
 }
 function tryCache(){
  if(mapIdForRef(activeMap)!==cache.mapId||Math.hypot(player.x-cache.x*TILE,player.y-cache.y*TILE)>=cache.radius)return false;
  if(two_jorans_stage!==3||!valid()){
   openDialogue('Supply box',two_jorans_stage===4?[['The box is empty. You took the five Sapper Charges.']]:cache.pages);return true;
  }
  // Prepare every item before touching the key or claim stage. Repeat presses,
  // duplicate callbacks and reloads cannot grant a second batch.
  const items=Array.from({length:5},()=>createItem('Sapper Charge'));
  const index=stats.items.findIndex(i=>i.name===key);
  if(index<0)return false;
  stats.items.splice(index,1);stats.items.push(...items);two_jorans_stage=4;changed();
  openDialogue('Supply box',[["Joran’s key opens the box. You take 5 Sapper Charges. The key stays in the empty lock."]]);return true;
 }
 function note(){
  if(!two_jorans_stage)return null;
  let body;
  if(two_jorans_stage===1){
   const leads=[[1,'Speak to Joran Beck in the watchhouse public room.'],[2,'Visit Perris at the Old Fort repair site for Beck’s work record and supply receipt.'],[4,'Ask Varda at Fen Warehouse for the original wage complaint.'],[8,'Speak to Joran Alden, the freight contractor inside Fen Warehouse.']];
   body=leads.filter(([bit])=>!(two_jorans_evidence&bit)).map(([,s])=>s).join(' ');
   if(!body)body='All four accounts are recorded. Return to Anric at the South Mornay Watchhouse to separate the cases.';
  }else if(two_jorans_stage===2)body='Beck has been cleared and released. Speak to him at the Old Fort repair site.';
  else if(two_jorans_stage===3)body='Joran Beck gave you his supply key. Open the box against the Old Fort’s south wall, east of the opening: five Sapper Charges.';
  else body='Two records corrected. Beck is free; Alden must answer for his own conduct. Collected five Sapper Charges from Beck’s supply box.';
  return {title:'Two Jorans — a jailhouse mix-up',body};
 }
 return Object.freeze({interact,tryCache,note,invariantErrors,
  draw(){
   if(mapIdForRef(activeMap)!==cache.mapId)return;
   const col=Math.floor(cache.x),row=Math.floor(cache.y);
   ctx.save();drawMornayFixture({kind:'cargo',col,row});
   if(two_jorans_stage===4){ctx.fillStyle='#262b29';ctx.fillRect(col*TILE+8,row*TILE+9,15,9);}
   ctx.restore();
  },
 });
})();
NPC_ACTIONS.twoJorans=n=>twoJorans.interact(n);
