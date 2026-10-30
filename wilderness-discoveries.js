'use strict';

// Active-map-only inspect choices. Rendering/persistence remain owned by normal
// map items; battle receipts alone award the risky branch's one-time cache.
const wildernessDiscoveries=(()=>{
 const here=()=>regionalActiveMapId();
 const local=()=>{const p=regionalPlayerWorldPoint();return p?regionWorldPxToLocal(p.regionId,p.worldPxX,p.worldPxY):null;};
 function eligible(i){
  const d=Number.isInteger(i)&&WILDERNESS_DISCOVERIES[i],p=local();
  return !!d&&!!d.enemies&&here()===d.mapId&&!!p&&
   !PICKUP_REGISTRY[d.id].picked&&Math.hypot(p.localPxX-(d.col*32+16),p.localPxY-(d.row*32+16))<TALK_RADIUS;
 }
 function start(i){
  if(!eligible(i)||canonicalPartyCombat.isActive()||combat.active)return false;
  return scriptedPartyEncounters.start('wilderness_discovery',i);
 }
 function inspect(){
  const i=WILDERNESS_DISCOVERIES.findIndex((d,i)=>eligible(i));if(i<0)return false;
  const d=WILDERNESS_DISCOVERIES[i];
  openDialogue(d.title,[[d.text]],[()=>{
   if(!eligible(i))return;
   let used=false;
   const once=fn=>()=>{if(used||!eligible(i)||canonicalPartyCombat.isActive()||combat.active)return;used=true;fn();};
   choice.title=d.title;
   choice.options=[d.risk,...(d.safe?[d.safe]:[]),'Leave it alone'];
   choice.callbacks=[once(()=>start(i)),...(d.safe?[once(()=>{
    grantItem(d.safeItem);PICKUP_REGISTRY[d.id].picked=true;openDialogue('',[[d.safeText]]);
   })]:[]),once(()=>{})];
   choice.cursor=0;choice.open=true;
  }]);
  return true;
 }
 return Object.freeze({eligible,inspect,startNearby(){const i=WILDERNESS_DISCOVERIES.findIndex((d,i)=>eligible(i));return i>=0?start(i):false;}});
})();
