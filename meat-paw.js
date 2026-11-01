'use strict';

// A single repeatable-until-cleared ambush. Only the bounty stage persists;
// the emergence is an exclusive, origin-bound presentation, never a map edit.
const MEAT_PAW_SITE=Object.freeze({mapId:'MAINLAND_C27R3_MAP',col:1,minRow:10,maxRow:12});
const meatPaw=(()=>{
 let scene=null;
 const here=()=>mapIdForRef(activeMap);
 const origin=()=>JSON.stringify([regionalWorldPosition(),here(),player.x,player.y]);
 const unlocked=()=>lantern_stage===8;
 const inside=()=>{
  const world=regionalPlayerWorldPoint();
  if(!world||world.mapId!==MEAT_PAW_SITE.mapId||here()!==world.mapId)return false;
  const p=regionWorldPxToLocal(world.regionId,world.worldPxX,world.worldPxY);
  return !!p&&Math.floor(p.localPxX/TILE)===MEAT_PAW_SITE.col&&
   Math.floor(p.localPxY/TILE)>=MEAT_PAW_SITE.minRow&&Math.floor(p.localPxY/TILE)<=MEAT_PAW_SITE.maxRow;
 };
 const atBoard=()=>here()===MORNAY_JOB_BOARD.mapId&&
   Math.hypot(player.x-MORNAY_JOB_BOARD.x*TILE,player.y-MORNAY_JOB_BOARD.y*TILE)<TALK_RADIUS;
 function invariantErrors(source){
  const s=source?(source.meat_paw_stage??0):meat_paw_stage,mq=source?(source.lantern_stage??0):lantern_stage;
  return !Number.isInteger(s)||s<0||s>3||s>0&&mq!==8?['Meat Paw: invalid bounty stage or MQ7 prerequisite']:[];
 }
 function boardPage(){
  return unlocked()?[null,meat_paw_stage===2?'Meat Paw — clearance verified. The posted removal fund pays 5000 gold.':meat_paw_stage===3?'Meat Paw — cleared. 5000 gold paid.':
   'Meat Paw. 5000 gold. An enormous, ill-tempered bear in CHAMBERI RIVER — Lowlands, survey square (27,3). The narrow grass passage on the southwest side is its ambush ground. Once it emerges, there is no escape.']:null;
 }
 function boardAction(){
  if(!unlocked()||!atBoard()||invariantErrors().length)return;
  if(meat_paw_stage===0){
   choice.title='Meat Paw — 5000 gold';choice.options=['Accept the bounty','Not now'];choice.cursor=0;
   choice.callbacks=[()=>{if(!unlocked()||!atBoard()||meat_paw_stage!==0)return;meat_paw_stage=1;
    openDialogue('Mornay Job Board',[['Bounty accepted. Prepare before entering the narrow grass at (27,3). Return to this board to collect 5000 gold after defeating Meat Paw.']]);},()=>{}];choice.open=true;
  }else if(meat_paw_stage===2){
   // Consume the authenticated clearance before displaying the receipt.
   meat_paw_stage=3;stats.gold+=5000;
  }
 }
 function eligible(){return unlocked()&&meat_paw_stage===1&&inside()&&!invariantErrors().length;}
 function tryTrigger(){
  if(scene||!eligible()||activityOwnership.active().length)return false;
  scene={origin:origin(),elapsed:0,phase:'emerge',x:player.x,y:player.y};
  player.moving=false;return true;
 }
 function update(dt){
  if(!scene)return;
  if(scene.origin!==origin()||!eligible()){scene=null;return;}
  if(scene.phase!=='emerge')return;
  scene.elapsed+=Math.max(0,Math.min(dt,.1));
  if(scene.elapsed<1.1)return;
  const token=scene;scene.phase='warning';
  dialogue.name='';
  setSpeakerDialoguePages([{speakerId:null,lines:['Branches snap. A gigantic bear shoulders out of the trees and fills the narrow passage. Meat Paw. There is no room to get past.']},
   ...(persistentParty.isAvailable('esla')?[{speakerId:'esla',lines:['That is far too much bear. No running now—keep each other standing!']}]:[])]);
  dialogue.page=0;dialogue.open=true;dialogue.callbacks=[()=>{
   if(scene!==token||origin()!==token.origin||!eligible()){scene=null;return;}
   scene=null;scriptedPartyEncounters.start('meat_paw');
  }];
 }
 function draw(){
  if(here()!==MEAT_PAW_SITE.mapId||meat_paw_stage>=2)return;
  // Bark scars and a crushed patch mark the passage without obstructing it.
  ctx.fillStyle='#ad8d64';for(let i=0;i<3;i++)ctx.fillRect(70+i*4,367,2,14);
  ctx.fillStyle='#796a3d';for(const [x,y]of [[42,407],[53,403],[38,398]])ctx.fillRect(x,y,8,2);
  if(!scene)return;
  const t=Math.min(1,scene.elapsed/1.1);
  ctx.save();ctx.translate(scene.x+72*(1-t),scene.y-30);ctx.scale(.68,.68);drawBattleMeatPaw(0,0);ctx.restore();
 }
 function note(){return meat_paw_stage?{title:'Meat Paw',body:meat_paw_stage===3?'Defeated Meat Paw. Collected 5000 gold.':meat_paw_stage===2?
  'Meat Paw is defeated. Return to the Mornay Job Board, South Upper East, for 5000 gold.':
  '5000 gold bounty: CHAMBERI RIVER — Lowlands (27,3). Enter the narrow southwest grass passage between the woods. Meat Paw will corner you; running is impossible. Prepare for a lethal fight.'}:null;}
 return Object.freeze({unlocked,boardPage,boardAction,eligible,tryTrigger,update,draw,note,invariantErrors,isActive:()=>!!scene,reset:()=>{scene=null;}});
})();
