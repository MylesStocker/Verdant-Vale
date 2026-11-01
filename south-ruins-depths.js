'use strict';

// No new quest progress or save payload. Access derives from MQ6 completion;
// only the three existing-registry chest receipts are mutable persistent state.
const southRuinsDepths=(()=>{
 const byMap=new Map();
 for(const d of SOUTH_DEPTH_DOORS){if(!byMap.has(d.source))byMap.set(d.source,[]);byMap.get(d.source).push(d);}
 const here=()=>mapIdForRef(activeMap);
 const gate=()=>SOUTH_DEPTH_DOORS.find(d=>d.gate);
 function tryDoor(){
  const d=byMap.get(here())?.find(d=>d.col===Math.floor(player.x/TILE)&&d.row===Math.floor(player.y/TILE));
  if(!d)return false;
  if(d.gate&&greybank_stage!==4){showWorldToast('The stair is choked shut. There is no way down yet.');return true;}
  return transitionToLocation({mapId:d.target,x:d.x,y:d.y,facing:d.facing,state:d.state||{},cooldown:true});
 }
 function inspect(){
  const c=SOUTH_DEPTH_CHESTS.find(c=>c.mapId===here()&&Math.hypot(player.x-c.x,player.y-c.y)<TALK_RADIUS);
  if(!c)return false;
  if(c.opened){openDialogue('',['The coffer is empty.'].map(s=>[s]));return true;}
  // Grant immediately once, before opening repeatable presentation. Re-entering
  // or replaying dialogue cannot grant a second reward.
  c.opened=true;stats.gold+=c.gold;
  for(const [name,count]of c.rewards)for(let i=0;i<count;i++)grantItem(name);
  openDialogue('',[['The dry lining has kept the contents intact.',c.gold+' gold.'],...c.rewards.map(([name,n])=>[name+' × '+n+'.'])]);
  return true;
 }
 function draw(){
  const id=here(),d=gate();
  if(id===d.source&&greybank_stage!==4){
   const x=d.col*TILE,y=d.row*TILE;ctx.fillStyle='#30232d';ctx.fillRect(x+2,y+2,28,28);
   ctx.fillStyle='#79636d';for(let i=0;i<4;i++)ctx.fillRect(x+3+i*7,y+3,3,26);
  }
  for(const c of SOUTH_DEPTH_CHESTS)if(c.mapId===id){
   if(!c.opened)drawChest(c);
   else {ctx.fillStyle='#30252c';ctx.fillRect(c.x-10,c.y-7,20,13);ctx.strokeStyle='#937954';ctx.strokeRect(c.x-10,c.y-7,20,13);}
   if(Math.hypot(player.x-c.x,player.y-c.y)<TALK_RADIUS){ctx.save();ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillStyle='#fff2bf';ctx.fillText('SPACE',c.x,c.y-18);ctx.restore();}
  }
 }
 return Object.freeze({tryDoor,inspect,draw});
})();
