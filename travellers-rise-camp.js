'use strict';

// Presentation poses only: no HP, equipment, membership or other character data.
// Persistent truth is the save-bound stage in quests.js; the ambush lifecycle
// alone authenticates victory. The night owner advances stage 1 to 2 after rest.
const travellersRiseCamp=(()=>{
  const RISE='EASTERN_FENS_TRAVELLERS_RISE_MAP',CAMP='TRAVELLERS_RISE_CAMP_MAP';
  const entrance=Object.freeze({col:6,row:4}),exit=Object.freeze({col:7,row:12});
  const pages=lines=>Object.freeze(lines.map(([speakerId,line])=>Object.freeze({speakerId,lines:Object.freeze([line])})));
  const outside=pages([
    ['esla','“They were using the clearing off the rise.”'],
    ['lely','“We should check it. Make sure there isn’t anyone else.”'],
    ['esla','“Agreed.”'],
  ]);
  const inside=pages([
    ['esla','“It’s clear. We stop here.”'],
    ['lely','“We can still put some road behind us.”'],
    ['esla','“In the dark? If we keep going, we do it through the night without sleep—after walking since the ferry and fighting that lot.”'],
    ['lely','“Every hour we lose is another hour before Mornay sees the report.”'],
    ['esla','“A report delivered tomorrow is more useful than one lost in the fen tonight.”'],
    ['lely','“If they had friends, staying here gives them time to find us.”'],
    ['esla','“And walking exhausted gives them the dark as well. I came because this road was unsafe. I’m not making that choice pointless by letting us walk it blind.”'],
    ['lely','“You’re not going to let this go.”'],
    ['esla','“No.”'],
    ['lely','“Fine. At first light, we move.”'],
    ['esla','“At first light.”'],
  ]);
  const lely={id:'camp_lely_pose',map:'eastern_fens_12',x:0,y:0,facing:'up'};
  const esla={id:'camp_esla_pose',map:'eastern_fens_12',x:0,y:0,facing:'right'};
  const ids=Object.freeze([lely.id,esla.id]);
  const route=points=>Object.freeze({type:'scriptedRoute',speed:2,pauseFrames:0,loop:false,
    waypoints:Object.freeze(points.map(([x,y])=>Object.freeze({x,y})))});
  // Main's scrub at (7,7) remains intact; Esla takes the open row above.
  const riseEsla=route([[8.5,6.5],[6.5,6.5],[6.5,5.5]]);
  const campLely=route([[6.5,8.5],[6.5,5.5]]),campEsla=route([[10.5,8.5],[10.5,5.5]]);
  let phase='idle',failure=null,plan=null,ticks=0;
  const active=()=>['outside_dialogue','rise_walk','camp_walk','inside_dialogue'].includes(phase);
  const eligible=()=>MainQuest>=5&&persistentParty.getActiveMember('esla')!==null&&travellers_rise_ambush_complete;
  const pendingHere=()=>phase==='idle'&&eligible()&&travellers_rise_camp_stage===0&&regionalActiveMapId()===RISE;
  const busy=()=>combat.active||canonicalPartyCombat.isActive()||combatPlayerState.hasParty()||
    dialogue.open||choice.open||menu.open||shop.open||debugMenu.open||warpMenu.open||continentMap.open||
    accordPanel.open||fishing.active||seraLioraCutscene.active||mq5AssignmentCutscene.isActive()||
    formationCombatLab.isOpen()||partyCombatLab.isActive()||travellersRiseAmbush.blocksSaveLoad();
  const clearRoutes=()=>{
    for(const actor of [lely,esla]){
      try{stopTransientNpcRoute(actor);}catch(error){console.error('[Camp route cleanup ownership]',error);}
    }
    player.moving=false;
  };
  const clearOwnedDialogue=()=>{
    dialogue.open=false;dialogue.pages=[];dialogue.page=0;dialogue.callbacks=[];
    dialogue.pageSpeakers=null;dialogue._speakerPagesFor=null;dialogue.name='';
  };
  const fault=error=>{
    failure=Object.freeze({phase,message:String(error&&error.message||error)});
    console.error('[Travellers Rise camp]',error);clearRoutes();clearOwnedDialogue();phase='fault';plan=null;
    reconcileFormationLabKeys();return true;
  };
  const validateRoute=(mapId,start,movement)=>{
    const grid=mapRefForId(mapId);if(!grid||grid.length!==15||grid.some(row=>row.length!==16))throw Error('invalid campsite map envelope');
    validateTransientNpcRouteDefinition(esla,movement);
    let x=start.x,y=start.y;
    const check=(px,py)=>{
      for(const [dx,dy]of [[-9,-9],[-9,9],[9,-9],[9,9]]){
        const tile=grid[Math.floor((py+dy)/TILE)]?.[Math.floor((px+dx)/TILE)];
        if(!isTileWalkable(tile)||TILE_PROPERTIES[tile]?.isTransition)throw Error('camp route crosses blocked terrain');
      }
      for(const npc of SIMPLE_NPCS)if(npc.solid&&npc.map===(mapId===RISE?'eastern_fens_12':'travellers_rise_camp')&&
          Math.abs(px-npc.x)<18&&Math.abs(py-npc.y)<18)throw Error('camp route crosses an occupied tile');
    };
    check(x,y);
    for(const wp of movement.waypoints){
      const tx=wp.x*TILE,ty=wp.y*TILE;
      if(x!==tx&&y!==ty)throw Error('camp route must be orthogonal');
      while(x!==tx||y!==ty){x+=Math.sign(tx-x)*Math.min(1,Math.abs(tx-x));y+=Math.sign(ty-y)*Math.min(1,Math.abs(ty-y));check(x,y);}
    }
  };
  const prepare=()=>{
    if(!pendingHere()||busy()||travellersRiseAmbushInvariantErrors().length)throw Error('camp introduction is not ready');
    if(regionalInvariantErrors().length)throw Error('camp position authority is inconsistent');
    if(ids.some(id=>NPC_ROUTES[id]))throw Error('camp route ownership is occupied');
    // The first two short segments centre the actual victory position visibly,
    // rather than teleporting a player who triggered the fight between pixels.
    const context=regionalContext();
    const start=Object.freeze({x:context.localPxX,y:context.localPxY});
    const riseLely=route([[10.5,start.y/TILE],[10.5,4.5],[6.5,4.5]]);
    validateSpeakerDialoguePages(outside);validateSpeakerDialoguePages(inside);
    validateRoute(RISE,start,riseLely);
    validateRoute(RISE,{x:8.5*TILE,y:7.5*TILE},riseEsla);
    validateRoute(CAMP,{x:7.5*TILE,y:8.5*TILE},campLely);
    validateRoute(CAMP,{x:8.5*TILE,y:8.5*TILE},campEsla);
    for(const spec of [{mapId:CAMP,x:7.5*TILE,y:8.5*TILE,facing:'up'},
      {mapId:RISE,x:6.5*TILE,y:5.5*TILE,facing:'down'}]){
      const result=validatePlacement(spec);if(!result.ok)throw Error(result.errors.join('; '));
    }
    return Object.freeze({riseLely,start});
  };
  const open=(authored,callback)=>{
    dialogue.name='';setSpeakerDialoguePages(authored);dialogue.open=true;dialogue.page=0;
    // Exact prepared-session ownership and phase checks reject stale callbacks.
    const owner=plan;
    dialogue.callbacks=[()=>{if(plan===owner)callback();}];
  };
  const startRoutes=(first,second)=>{
    clearRoutes();
    if(!startTransientNpcRoute(lely,first,true)||!startTransientNpcRoute(esla,second,true))throw Error('camp route installation failed');
    ticks=0;
  };
  const begin=()=>{
    try{
      const prepared=prepare(); // all route and destination checks precede mutation
      plan=prepared;failure=null;
      Object.assign(lely,{map:'eastern_fens_12',x:prepared.start.x,y:prepared.start.y,facing:'left'});
      Object.assign(esla,{map:'eastern_fens_12',x:8.5*TILE,y:7.5*TILE,facing:'right'});
      player.facing='left';player.moving=false;phase='outside_dialogue';reconcileFormationLabKeys();
      open(outside,()=>{
        if(phase!=='outside_dialogue')return;
        try{startRoutes(plan.riseLely,riseEsla);phase='rise_walk';}catch(error){fault(error);}
      });return true;
    }catch(error){return fault(error);}
  };
  const finish=()=>{
    if(phase!=='inside_dialogue')return false;
    try{
      if(!eligible()||travellers_rise_camp_stage!==0||activeMap!==TRAVELLERS_RISE_CAMP_MAP)throw Error('camp completion lost its owner');
      clearRoutes();travellers_rise_camp_stage=1;syncQuestFlagsToWindow();phase='idle';plan=null;reconcileFormationLabKeys();return true;
    }catch(error){return fault(error);}
  };
  const update=()=>{
    if(travellersRiseNight.update())return true;
    if(!active()){if(pendingHere()&&!busy())return begin();return false;}
    if(!['rise_walk','camp_walk'].includes(phase))return true;
    try{
      const id=phase==='rise_walk'?RISE:CAMP;
      if(!eligible()||travellers_rise_camp_stage!==0||regionalActiveMapId()!==id)throw Error('camp walk lost its owner');
      updateNpcRoutes(ids);ticks++;
      const lr=transientNpcRouteView(lely.id),er=transientNpcRouteView(esla.id);
      if(!lr||!er||ticks>600)throw Error('camp route stalled or disappeared');
      if(!placeAtLocation(id,lely.x,lely.y))throw Error('camp player projection rejected');
      player.facing=lely.facing;player.moving=lr.moving;player.step=lr.step;
      if(lr.done&&er.done){
        clearRoutes();
        if(phase==='rise_walk'){
          if(!enterTravellersRiseCamp())throw Error('camp arrival rejected');
          Object.assign(lely,{map:'travellers_rise_camp',x:player.x,y:player.y,facing:'up'});
          Object.assign(esla,{map:'travellers_rise_camp',x:8.5*TILE,y:8.5*TILE,facing:'up'});
          startRoutes(campLely,campEsla);phase='camp_walk';
        }else{
          player.facing='right';lely.facing='right';esla.facing='left';phase='inside_dialogue';open(inside,finish);
        }
      }
      return true;
    }catch(error){return fault(error);}
  };
  const canEnter=()=>eligible()&&regionalActiveMapId()===RISE&&
    (phase==='rise_walk'&&lely.x===6.5*TILE&&lely.y===4.5*TILE&&esla.x===6.5*TILE&&esla.y===5.5*TILE||
      phase==='idle'&&travellers_rise_camp_stage>=1);
  const interact=()=>{
    if(active())return !dialogue.open;
    if(travellersRiseNight.interact())return true;
    const id=regionalActiveMapId(),point=id===RISE?entrance:id===CAMP?exit:null;
    if(!point||!nearPlayer((point.col+.5)*TILE,(point.row+.5)*TILE,TILE+1))return false;
    if(id===CAMP){exitTravellersRiseCamp();return true;}
    if(!eligible())openDialogue('',[['A narrow track leads into a screened clearing. The travellers have occupied it.']]);
    else if(travellers_rise_camp_stage===0)begin();
    else enterTravellersRiseCamp();
    return true;
  };
  const draw=()=>{
    const id=regionalActiveMapId();
    if(id!==RISE&&id!==CAMP)return;
    ctx.save();
    if(id===RISE){
      // Exactly one tile: a worn track, low reed screen and rolled blanket.
      const x=entrance.col*TILE,y=entrance.row*TILE;
      ctx.fillStyle='#827a52';ctx.fillRect(x+11,y+8,10,24);
      ctx.fillStyle='#706344';ctx.fillRect(x+2,y+3,5,23);ctx.fillRect(x+25,y+3,5,23);
      ctx.fillStyle='#aaa275';ctx.fillRect(x+3,y+5,3,19);ctx.fillRect(x+26,y+5,3,19);
      ctx.fillStyle='#586557';ctx.fillRect(x+9,y+2,14,6);ctx.fillStyle='#b0a17a';ctx.fillRect(x+14,y+2,2,6);
    }else if(id===CAMP){
      // Ordinary abandoned gear is decoration, never a pickup or reward.
      for(const [c,r]of [[4,3],[10,3],[11,9]]){
        const x=c*TILE,y=r*TILE;ctx.fillStyle='#625a44';ctx.fillRect(x+2,y+4,25,17);
        ctx.fillStyle='#8d8a69';ctx.fillRect(x+4,y+6,21,13);ctx.fillStyle='#b4ac87';ctx.fillRect(x+5,y+7,5,11);
      }
      // Decorative log seats north/south of the fire, clear of both actor routes.
      // Bark edges, split grain and pale cut ends distinguish them from bedrolls.
      for(const y of [4*TILE-6,7*TILE-10]){
        const x=8*TILE-12;
        ctx.fillStyle='#493b2a';ctx.fillRect(x,y,48,13);
        ctx.fillStyle='#756044';ctx.fillRect(x+4,y+2,40,8);
        ctx.fillStyle='#9b8056';ctx.fillRect(x+7,y+3,32,2);
        ctx.fillStyle='#493b2a';ctx.fillRect(x+14,y+7,23,1);ctx.fillRect(x+28,y+5,2,4);
        ctx.fillStyle='#b4a079';ctx.fillRect(x,y+2,5,9);ctx.fillRect(x+43,y+2,5,9);
        ctx.fillStyle='#756044';ctx.fillRect(x+2,y+4,1,5);ctx.fillRect(x+45,y+4,1,5);
      }
      const x=8*TILE,y=5*TILE;
      ctx.fillStyle='#514d43';ctx.fillRect(x+3,y+7,27,19);
      ctx.fillStyle='#999782';for(const [dx,dy]of [[3,7],[13,3],[23,7],[3,21],[13,25],[23,21]])ctx.fillRect(x+dx,y+dy,6,4);
      ctx.fillStyle='#342d25';ctx.fillRect(x+9,y+11,15,10);
      travellersRiseNight.drawFire();
      const ex=exit.col*TILE,ey=exit.row*TILE;ctx.fillStyle='#b0a17a';ctx.fillRect(ex+6,ey+4,3,21);ctx.fillRect(ex+6,ey+4,18,4);
    }
    travellersRiseNight.drawEsla();
    if(active()){
      const rt=transientNpcRouteView(esla.id);
      drawWalkingEslaFigure(esla,esla.facing,rt?.moving?rt.step:0);
    }
    ctx.restore();
  };
  return Object.freeze({prepare,update,interact,draw,canEnter,validateRoute,
    canStartNight:()=>phase==='idle'&&eligible()&&!busy(),
    isActive:()=>active()||travellersRiseNight.isActive(),
    blocksSave:()=>active()||travellersRiseNight.blocksSave(),
    blocksInput:()=>active()||travellersRiseNight.isActive()||pendingHere()&&!busy(),
    blocksEast:()=>eligible()&&!travellersRiseSequenceComplete(),
    remind(){if(dialogue.open)return;open(pages([['esla','“We agreed to stop. The road can wait until first light.”']]),()=>{});},
    resetTransient(){travellersRiseNight.resetTransient();if(active())clearOwnedDialogue();clearRoutes();phase='idle';failure=null;plan=null;ticks=0;return true;},
    getView(){return Object.freeze({phase,active:active(),failure,stage:travellers_rise_camp_stage,entrance,exit,
      actors:Object.freeze(active()?[lely,esla].map(a=>Object.freeze({id:a.id,x:a.x,y:a.y,facing:a.facing,route:transientNpcRouteView(a.id)})):[])});},
    dialogue:Object.freeze({outside,inside}),
  });
})();
