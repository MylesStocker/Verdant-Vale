'use strict';
const REEDBANK_MAP_FEATURES = {
 REEDBANK_VILLAGE_MAP:[
  {id:'reedbank_mushroom_logs',type:'inspect',x:5.5,y:8.5,radius:42,allowUnwalkable:true,label:'Mushroom beds',pages:[['Damp logs lie under reed screens. Clusters of pale mushrooms push out of the bark; a bucket catches the precious runoff.']]},
 ],
 MAINLAND_C22R3_MAP:[
  {id:'reedbank_village_sign',type:'inspect',x:3.5,y:8.5,radius:46,label:'Reedbank',pages:[['REEDBANK. Provisions and river wrestling. Follow the path between the homesteads.']]},
 ],
};
function reedbankTryDoor() {
 const id=regionalActiveMapId(),col=Math.floor(player.x/TILE),row=Math.floor(player.y/TILE);
 const d=REEDBANK_DOORS.find(d=>d.source===id&&d.col===col&&d.row===row);
 return !!d&&transitionToLocation({mapId:d.target,x:d.x,y:d.y,facing:d.facing,cooldown:true});
}
function reedbankOpenShop() {
 if(activeMap!==REEDBANK_PROVISIONS_MAP)return false;
 openDialogue('Nella',REEDBANK_NPCS.find(n=>n.id==='reedbank_nella').dialogue,[()=>{
  const s=SHOP_REGISTRY.reedbank_provisions;
  shop.title=s.label;shop.stock=s.stock;shop.screen='main';shop.cursor=0;shop.open=true;
 }]);return true;
}
