'use strict';

// Transient presentation around the existing MQ5 assignment authority. Story
// completion still belongs to completeMq5Assignment(); this owner only divides
// the authored conversation around Esla's visible office walk.
const MQ5_ESLA_OFFICE_HOME = Object.freeze({x:4.5*TILE,y:9.5*TILE,facing:'up'});
const MQ5_ESLA_OFFICE_DESTINATION = Object.freeze({x:11.5*TILE,y:3.5*TILE,facing:'right'});
const MQ5_ESLA_OFFICE_ROUTE = Object.freeze({
  type:'scriptedRoute',
  waypoints:Object.freeze([
    Object.freeze({x:11.5,y:9.5}),
    Object.freeze({x:11.5,y:3.5}),
  ]),
  speed:2,pauseFrames:0,loop:false,
});

const MQ5_ASSIGNMENT_OPENING_PAGES = Object.freeze([
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“Dreyfuss is dead. Garrick is still missing. The ruins below the basin have already cost more than one life.”',
  ])}),
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“The death, the casualties in those ruins, and the structure itself are beyond what Calwick or Drenwick can responsibly investigate alone.”',
    '“We do not have the expertise here, and I will not manufacture it by giving you a longer title.”',
  ])}),
  Object.freeze({speakerId:null,lines:Object.freeze([
    'He places a thick envelope on the desk. The district seal crosses the flap.',
  ])}),
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“This is the report. You will carry it east to the regional office in Mornay and request qualified assistance.”',
  ])}),
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“They will want your firsthand account. You saw the Gallery, the body, and what came out of the lower rooms.”',
    '“Principally, I am sending the report. You are the portion of it capable of answering questions.”',
  ])}),
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“The causeway is still broken. The Empire has sent a cable ferry to move people across while it is repaired.”',
    '“Temporary, according to the same works notice they have renewed for six years.”',
    '“Your assignment is the authorization. The operator has the office seal list.”',
  ])}),
]);

const MQ5_ASSIGNMENT_AFTER_WALK_PAGES = Object.freeze([
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“The road to Mornay is long, and growing less safe. I can scarcely spare you. We are short of staff already.”',
  ])}),
  Object.freeze({speakerId:'esla',lines:Object.freeze([
    '“I don’t know what happened to Dreyfuss, but I’m not going to let it happen to anyone in this office.”',
  ])}),
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“Your work here will not do itself,” the Supervisor says.',
  ])}),
  Object.freeze({speakerId:'esla',lines:Object.freeze([
    '“It has never shown much inclination,” Esla says. “I will leave it in order. I am going with her.”',
  ])}),
  Object.freeze({speakerId:null,lines:Object.freeze([
    'The Supervisor folds his hands.',
  ])}),
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“I had meant to ask.”',
  ])}),
  Object.freeze({speakerId:'esla',lines:Object.freeze([
    '“Then you have my answer.” Esla looks at Lely. “You know the Gallery. I know the road. We should make this journey together.”',
  ])}),
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“Very well,” the Supervisor says. “I will cover your files. Lely, you still carry the report.”',
  ])}),
  Object.freeze({speakerId:'supervisor',lines:Object.freeze([
    '“Deliver the report. Answer what they ask. Bring back people qualified to decide what happens next.”',
    '“Do not decide it for them on the road.”',
  ])}),
]);

const mq5AssignmentCutscene=(()=>{
  let phase='idle',lastError='',lastX=MQ5_ESLA_OFFICE_HOME.x,lastY=MQ5_ESLA_OFFICE_HOME.y;
  let stalledFrames=0,startCount=0,completionCount=0;
  const routeId=ESLA.id;
  const active=()=>phase==='walking'||phase==='dialogue';
  const inOffice=()=>inTown&&currentTownId==='calwick'&&townBuilding==='office'&&activeMap===OFFICE_MAP;
  const clearDialogue=()=>{
    dialogue.open=false;dialogue.page=0;dialogue.pages=[];dialogue.name='';dialogue.callbacks=[];
    dialogue.styleId=null;dialogue.presentation='box';dialogue.portraitId=null;dialogue.portraitSide=null;
    dialogue.pageSpeakers=null;dialogue._speakerPagesFor=null;
  };
  const restoreHome=()=>{
    delete NPC_ROUTES[routeId];
    ESLA.x=MQ5_ESLA_OFFICE_HOME.x;ESLA.y=MQ5_ESLA_OFFICE_HOME.y;ESLA.facing=MQ5_ESLA_OFFICE_HOME.facing;
  };
  const fail=error=>{
    lastError=String(error&&error.message||error||'unknown MQ5 assignment cutscene failure');
    console.error('[MQ5 assignment cutscene]',error);
    clearDialogue();restoreHome();phase='fault';stalledFrames=0;
    return false;
  };
  const staticOccupancy=(x,y)=>{
    const r=9,corners=[[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]];
    for(const [px,py] of corners){const tile=tileAt(px,py),props=TILE_PROPERTIES[tile];
      if(!isTileWalkable(tile)||(props&&props.isTransition))return false;}
    if(npcRouteCustomSolidBlocks(x,y))return false;
    for(const other of SIMPLE_NPCS){if(other.map!=='office'||!other.solid)continue;
      if(Math.abs(x-other.x)<18&&Math.abs(y-other.y)<18)return false;}
    return true;
  };
  const validatePath=()=>{
    let x=MQ5_ESLA_OFFICE_HOME.x,y=MQ5_ESLA_OFFICE_HOME.y;
    for(const waypoint of MQ5_ESLA_OFFICE_ROUTE.waypoints){
      const tx=waypoint.x*TILE,ty=waypoint.y*TILE;
      if(x!==tx&&y!==ty)throw Error('MQ5 Esla route must remain orthogonal');
      const dx=Math.sign(tx-x),dy=Math.sign(ty-y),distance=Math.max(Math.abs(tx-x),Math.abs(ty-y));
      for(let step=1;step<=distance;step++){
        const px=step===distance?tx:x+dx*step,py=step===distance?ty:y+dy*step;
        if(!staticOccupancy(px,py))throw Error('MQ5 Esla route crosses blocked office space');
      }
      x=tx;y=ty;
    }
    if(x!==MQ5_ESLA_OFFICE_DESTINATION.x||y!==MQ5_ESLA_OFFICE_DESTINATION.y)
      throw Error('MQ5 Esla route has the wrong destination');
  };
  const prepare=()=>{
    if(!mq5AssignmentReady()||!inOffice()||!eslaAvailableAsNpc()||active()||NPC_ROUTES[routeId]||
        ESLA.x!==MQ5_ESLA_OFFICE_HOME.x||ESLA.y!==MQ5_ESLA_OFFICE_HOME.y)
      throw Error('MQ5 assignment cutscene is not ready');
    validateSpeakerDialoguePages(MQ5_ASSIGNMENT_OPENING_PAGES);
    validateSpeakerDialoguePages(MQ5_ASSIGNMENT_AFTER_WALK_PAGES);
    validateTransientNpcRouteDefinition(ESLA,MQ5_ESLA_OFFICE_ROUTE);
    validatePath();
    return true;
  };
  const open=()=>{
    prepare();
    dialogue.name='Supervisor';setSpeakerDialoguePages(MQ5_ASSIGNMENT_OPENING_PAGES);
    dialogue.callbacks=[()=>mq5AssignmentCutscene.startWalk()];dialogue.open=true;dialogue.page=0;
    return true;
  };
  const startWalk=()=>{
    if(phase!=='idle'||!mq5AssignmentReady()||!inOffice()||!eslaAvailableAsNpc())return false;
    try{
      validatePath();
      // This exclusive cutscene intentionally brings Esla beside Lely. Player
      // input is locked, so only this transient route ignores the ordinary
      // moving-NPC player buffer; terrain, furniture and NPC solids still bind.
      if(!startTransientNpcRoute(ESLA,MQ5_ESLA_OFFICE_ROUTE,true))throw Error('Esla route is already installed');
      phase='walking';lastError='';lastX=ESLA.x;lastY=ESLA.y;stalledFrames=0;startCount++;
      return true;
    }catch(error){return fail(error);}
  };
  const resumeDialogue=()=>{
    delete NPC_ROUTES[routeId];ESLA.facing=MQ5_ESLA_OFFICE_DESTINATION.facing;
    phase='dialogue';dialogue.name='Supervisor';setSpeakerDialoguePages(MQ5_ASSIGNMENT_AFTER_WALK_PAGES);
    dialogue.callbacks=[()=>mq5AssignmentCutscene.finish()];dialogue.open=true;dialogue.page=0;
  };
  const update=()=>{
    if(phase!=='walking')return false;
    try{
      if(!inOffice()||!mq5AssignmentReady()||!eslaAvailableAsNpc())throw Error('MQ5 assignment cutscene lost its owner');
      updateNpcRoutes();
      const route=NPC_ROUTES[routeId];
      if(!route)throw Error('MQ5 Esla route disappeared');
      if(ESLA.x===lastX&&ESLA.y===lastY)stalledFrames++;else stalledFrames=0;
      lastX=ESLA.x;lastY=ESLA.y;
      if(stalledFrames>180)throw Error('MQ5 Esla route stalled');
      if(route.done){
        if(ESLA.x!==MQ5_ESLA_OFFICE_DESTINATION.x||ESLA.y!==MQ5_ESLA_OFFICE_DESTINATION.y)
          throw Error('MQ5 Esla route ended at the wrong position');
        resumeDialogue();
      }
      return true;
    }catch(error){return fail(error);}
  };
  const finish=()=>{
    if(phase!=='dialogue')return false;
    try{
      if(!completeMq5Assignment())throw Error('MQ5 assignment finalization rejected');
      delete NPC_ROUTES[routeId];phase='idle';completionCount++;lastError='';
      return true;
    }catch(error){return fail(error);}
  };
  const reset=()=>{clearDialogue();restoreHome();phase='idle';lastError='';stalledFrames=0;startCount=0;completionCount=0;return true;};
  return Object.freeze({
    open,startWalk,update,finish,reset,isActive:active,
    getView(){const route=NPC_ROUTES[routeId];return Object.freeze({phase,active:active(),lastError,
      startCount,completionCount,x:ESLA.x,y:ESLA.y,facing:ESLA.facing,
      route:route?Object.freeze({idx:route.idx,step:route.step,moving:route.moving,done:route.done}):null});},
    route:Object.freeze({home:MQ5_ESLA_OFFICE_HOME,destination:MQ5_ESLA_OFFICE_DESTINATION,
      waypoints:MQ5_ESLA_OFFICE_ROUTE.waypoints}),
    prepare,
  });
})();
