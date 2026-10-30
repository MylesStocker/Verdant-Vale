'use strict';

// Bounded, active-physical-map point dispatch. No new modes, flags, quest
// callbacks or terrain mutations; neutral locations use the shared gateway.
const fenCaverns=(()=>{
  const byMap=new Map();
  for(const door of FEN_CAVE_DOORS){
    if(!byMap.has(door.source))byMap.set(door.source,[]);
    byMap.get(door.source).push(door);
  }
  function tryDoor(){
    const doors=byMap.get(regionalActiveMapId());
    if(!doors)return false;
    const point=regionalPlayerWorldPoint();
    const local=point?regionWorldPxToLocal(point.regionId,point.worldPxX,point.worldPxY):null;
    const col=Math.floor((local?local.localPxX:player.x)/TILE);
    const row=Math.floor((local?local.localPxY:player.y)/TILE);
    const door=doors.find(d=>d.col===col&&d.row===row);
    return !!door && transitionToLocation({mapId:door.target,x:door.x,y:door.y,facing:door.facing,cooldown:true});
  }
  return Object.freeze({tryDoor});
})();
