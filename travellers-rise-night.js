'use strict';

// One transient presentation under travellersRiseCamp. No saved actors, lighting,
// timer or rest receipt: quests.js owns stage, persistentParty owns recovery.
const travellersRiseNight=(()=>{
  const MAP='TRAVELLERS_RISE_CAMP_MAP',FIRE=Object.freeze({x:272,y:176});
  const lely={id:'camp_night_lely_pose',map:'travellers_rise_camp',x:0,y:0,facing:'right'};
  const esla={id:'camp_night_esla_pose',map:'travellers_rise_camp',x:336,y:240,facing:'up'};
  const ids=Object.freeze([lely.id,esla.id]);
  const route=points=>Object.freeze({type:'scriptedRoute',speed:2,pauseFrames:0,loop:false,
    waypoints:Object.freeze(points.map(([x,y])=>Object.freeze({x:x/TILE,y:y/TILE})))});
  const D=TRAVELLERS_RISE_NIGHT_DIALOGUE;
  let phase='idle',plan=null,failure=null,clock=0,elapsed=0,fire='cold',seated=false,committing=false;
  const active=()=>phase!=='idle'&&phase!=='fault';
  const storySeal=()=>JSON.stringify([MainQuest,travellers_rise_ambush_complete,travellers_rise_ambush_paid,travellers_rise_ambush_payment,travellers_rise_camp_stage,snapshotLocationState()]);
  const ownerValid=()=>plan&&regionalActiveMapId()===MAP&&storySeal()===plan.story&&
    persistentParty.getMember('lely')!==null&&persistentParty.getMember('esla')!==null;
  const clear=()=>{for(const a of [lely,esla])stopTransientNpcRoute(a);player.moving=false;};
  const clearDialogue=()=>{dialogue.open=false;dialogue.pages=[];dialogue.page=0;dialogue.callbacks=[];
    dialogue.pageSpeakers=null;dialogue._speakerPagesFor=null;dialogue.name='';};
  const fault=error=>{
    failure=Object.freeze({phase,message:String(error?.message||error),completionStarted:committing});
    console.error('[Travellers Rise night]',failure);phase='fault';plan=null;seated=false;
    try{clear();}catch(cleanupError){console.error('[Night route cleanup ownership]',cleanupError);}
    clearDialogue();
    reconcileFormationLabKeys();return false;
  };
  const validatePair=(a,ra,b,rb)=>{
    travellersRiseCamp.validateRoute(MAP,a,ra);travellersRiseCamp.validateRoute(MAP,b,rb);
    // Replay only deterministic route geometry in preparation, not gameplay.
    const actors=[{...a,i:0},{...b,i:0}],routes=[ra,rb];
    for(let t=0;t<1000;t++){
      if(Math.abs(actors[0].x-actors[1].x)<18&&Math.abs(actors[0].y-actors[1].y)<18)throw Error('night actors overlap');
      if(actors.every((p,i)=>p.i===routes[i].waypoints.length))return;
      actors.forEach((p,i)=>{const w=routes[i].waypoints[p.i];if(!w)return;
        const x=w.x*TILE,y=w.y*TILE;p.x+=Math.sign(x-p.x)*Math.min(2,Math.abs(x-p.x));p.y+=Math.sign(y-p.y)*Math.min(2,Math.abs(y-p.y));
        if(p.x===x&&p.y===y)p.i++;
      });
    }throw Error('night route is too long');
  };
  const prepare=()=>{
    if(active()||failure?.completionStarted||regionalActiveMapId()!==MAP||MainQuest!==5||
        travellers_rise_camp_stage!==1||!travellers_rise_ambush_complete||!travellersRiseCamp.canStartNight()||
        canonicalPartyCombat.hasPendingHandoff()||storyCheckpointLab.isOpen()||
        !nearPlayer(FIRE.x,FIRE.y,65)||ids.some(id=>NPC_ROUTES[id]))throw Error('campfire night is not ready');
    if(LOCATION_MAJOR_MODE_KEYS.some(key=>snapshotLocationState()[key]))throw Error('campsite requires neutral location modes');
    if(regionalInvariantErrors().length||travellersRiseAmbushInvariantErrors().length)throw Error('invalid night story/placement');
    if(!persistentParty.getMember('lely')||!persistentParty.getMember('esla'))throw Error('night requires canonical companions');
    if(!Number.isFinite(player.x)||!Number.isFinite(player.y))throw Error('invalid night start');
    for(const pages of Object.values(D))validateSpeakerDialoguePages(pages);
    const start=Object.freeze({x:player.x,y:player.y});
    const stages=Object.freeze([
      Object.freeze({a:route([[208,start.y],[208,208]]),b:route([[336,176]])}),
      Object.freeze({a:route([[240,208],[240,176]]),b:route([[336,176]])}),
      Object.freeze({a:route([[208,176]]),b:route([[336,112],[352,112],[336,112],[336,176],[304,176]])}),
      Object.freeze({a:route([[208,128],[272,128]]),b:route([[336,176],[336,224],[272,224]])}),
    ]);
    let a=start,b={x:336,y:240};
    for(const s of stages){validatePair(a,s.a,b,s.b);const end=r=>({x:r.waypoints.at(-1).x*TILE,y:r.waypoints.at(-1).y*TILE});a=end(s.a);b=end(s.b);}
    for(const p of [FIRE,{x:272,y:128},{x:272,y:224}]){
      const v=validatePlacement({mapId:MAP,x:p.x,y:p.y});if(!v.ok)throw Error(v.errors.join('; '));
    }
    return Object.freeze({start,stages,story:storySeal(),rest:persistentParty.prepareOvernightRest()});
  };
  const setPhase=value=>{phase=value;elapsed=0;};
  const open=(pages,next)=>{
    const owner=plan,expected=phase;
    dialogue.name='';setSpeakerDialoguePages(pages);dialogue.open=true;dialogue.page=0;
    dialogue.callbacks=[()=>{if(plan!==owner||phase!==expected)return;
      try{if(!ownerValid())throw Error('night dialogue lost ownership');next();}catch(error){fault(error);}
    }];
  };
  const walk=(index,nextPhase)=>{
    clear();const s=plan.stages[index];
    if(!startTransientNpcRoute(lely,s.a,true)||!startTransientNpcRoute(esla,s.b,true))throw Error('night route installation failed');
    setPhase(nextPhase);
  };
  const begin=()=>{
    let next;
    try{next=prepare();}catch(error){console.warn('[Campfire entry rejected]',error.message);return false;}
    // Nothing above changes the running session; a bad route leaves stage 1 intact.
    try{
      plan=next;failure=null;committing=false;clock=0;fire='cold';seated=false;
      Object.assign(lely,{x:next.start.x,y:next.start.y,facing:player.facing});
      Object.assign(esla,{x:336,y:240,facing:'up'});reconcileFormationLabKeys();walk(0,'gather');return true;
    }catch(error){return fault(error);}
  };
  const validateCompletion=()=>{
    if(!ownerValid()||phase!=='black'||elapsed!==49||!seated||
        lely.x!==272||lely.y!==128||esla.x!==272||esla.y!==224)throw Error('invalid night completion');
    for(const p of [lely,esla]){
      const v=validatePlacement({mapId:MAP,x:p.x,y:p.y});if(!v.ok)throw Error(v.errors.join('; '));
    }
    persistentParty.validateOvernightRest(plan.rest);
  };
  const complete=()=>{
    validateCompletion(); // all predictable failures precede the irreversible boundary
    committing=true;
    persistentParty.applyOvernightRest(plan.rest);
    // A private consumed rest receipt prevents any replay even if a later host
    // callback throws. Stage 2 remains withheld until the dawn fade finishes;
    // such faults refuse saving until load/checkpoint recovery.
    setPhase('sleep');fire='embers';
  };
  const finishMorning=()=>{
    if(!committing||phase!=='dawn'||elapsed!==72||regionalActiveMapId()!==MAP||
        MainQuest!==5||!travellers_rise_ambush_complete||travellers_rise_camp_stage!==1||
        !persistentParty.getMember('lely')||!persistentParty.getMember('esla'))
      throw Error('invalid night morning finalization');
    // This is the one persisted receipt for the whole event. The rest has
    // already succeeded, the complete morning fade has elapsed, and all
    // predictable story/placement checks precede this write.
    travellers_rise_camp_stage=2;
    try{syncQuestFlagsToWindow();}
    catch(error){travellers_rise_camp_stage=1;throw error;}
    clear();seated=false;phase='idle';plan=null;committing=false;reconcileFormationLabKeys();
  };
  const update=()=>{
    if(!active())return false;
    try{
      if(regionalActiveMapId()!==MAP||(!committing&&!ownerValid()))throw Error('night lost its owner');
      clock++;elapsed++;
      if(['gather','fuel','rebuild','seats'].includes(phase)){
        if([lely,esla].some(actor=>NPC_ROUTES[actor.id]?.npc!==actor))throw Error('night route ownership changed');
        updateNpcRoutes(ids);const a=transientNpcRouteView(lely.id),b=transientNpcRouteView(esla.id);
        if(!a||!b||elapsed>700)throw Error('night route stalled or disappeared');
        if(!placeAtLocation(MAP,lely.x,lely.y))throw Error('night player projection rejected');
        player.facing=lely.facing;player.moving=a.moving;player.step=a.step;
        if(a.done&&b.done){
          clear();
          if(phase!=='seats'){player.facing=lely.facing='right';esla.facing='left';}
          if(phase==='gather'){setPhase('opening');open(D.opening,()=>walk(1,'fuel'));}
          else if(phase==='fuel'){setPhase('damp');open(D.damp,()=>walk(2,'rebuild'));}
          else if(phase==='rebuild'){fire='kindling';setPhase('kindling');open(D.kindling,()=>setPhase('spark'));}
          else{seated=true;player.facing=lely.facing='down';esla.facing='up';setPhase('nightfall');}
        }
      }else if(phase==='spark'){
        if(elapsed===36)fire='embers';if(elapsed===72)fire='lit';if(elapsed===96)walk(3,'seats');
      }else if(phase==='nightfall'&&elapsed===60){setPhase('conversation');open(D.conversation,()=>setPhase('black'));}
      else if(phase==='black'&&elapsed===49)complete();
      else if(phase==='sleep'&&elapsed===48)setPhase('dawn');
      else if(phase==='dawn'&&elapsed===72)finishMorning();
      return true;
    }catch(error){fault(error);return true;}
  };
  const interact=()=>{
    if(regionalActiveMapId()!==MAP||!nearPlayer(FIRE.x,FIRE.y,65))return false;
    if(active())return true;
    if(travellers_rise_camp_stage===2){openDialogue('',[['Ash lies pale around the last embers. The road is waiting.']]);return true;}
    if(travellers_rise_camp_stage!==1)return false;
    begin();return true;
  };
  const light=()=>phase==='nightfall'?elapsed/60:['conversation','black','sleep'].includes(phase)?1:phase==='dawn'?1-elapsed/72:0;
  const black=()=>phase==='black'?Math.min(1,elapsed/48):phase==='sleep'?1:phase==='dawn'?1-elapsed/72:0;
  const visibleFire=()=>active()?fire:travellers_rise_camp_stage>=2?'embers':'cold';
  const drawFire=()=>{
    if(regionalActiveMapId()!==MAP)return;
    ctx.save();const f=visibleFire();
    if(['kindling','embers','lit'].includes(f)){
      ctx.fillStyle='#9e8154';ctx.fillRect(264,177,17,2);ctx.fillRect(269,171,2,12);ctx.fillRect(278,174,2,9);
    }
    if(['embers','lit'].includes(f)){
      ctx.fillStyle='#b26d3d';ctx.fillRect(269,174,4,3);ctx.fillStyle='#dca75e';ctx.fillRect(275,179,3,2);
    }
    if(f==='lit'){
      const sway=[0,2,0,-2][Math.floor(clock/8)%4],height=[14,18,16,20][Math.floor(clock/6)%4];
      ctx.fillStyle='#b95129';ctx.fillRect(265,166,16,14);
      ctx.fillStyle='#e99c42';ctx.fillRect(267+sway,180-height,10,height);
      ctx.fillStyle='#ffe2a0';ctx.fillRect(271+sway,169,4,10);
    }
    if(phase==='spark'&&elapsed<72){
      ctx.fillStyle='#b9b7a0';ctx.fillRect(292,166,4,3);ctx.fillStyle='#514b42';ctx.fillRect(296,169,3,3);
      if(elapsed%12<3){ctx.fillStyle='#ffe2a0';ctx.fillRect(283,169,2,2);ctx.fillRect(279,172,2,2);}
    }
    if(phase==='rebuild'&&(transientNpcRouteView(esla.id)?.waypointIndex||0)>=2){
      ctx.fillStyle='#b4a079';ctx.fillRect(Math.round(esla.x)-13,Math.round(esla.y)-4,12,3);
      ctx.fillStyle='#8e7951';ctx.fillRect(Math.round(esla.x)-11,Math.round(esla.y)-6,9,2);
    }
    if(['fuel','damp'].includes(phase)){
      ctx.fillStyle='#617440';ctx.fillRect(Math.round(lely.x)+8,Math.round(lely.y)-3,14,3);
      ctx.fillRect(Math.round(lely.x)+15,Math.round(lely.y)-7,2,8);
    }else if(['rebuild','kindling','spark','seats','nightfall','conversation','black'].includes(phase)){
      ctx.fillStyle='#617440';ctx.fillRect(245,191,14,3);ctx.fillRect(249,186,2,8);
    }
    ctx.restore();
  };
  // Retain each established head/torso sprite. Only this scene clips the walking
  // legs and adds bent knees/boots at the log; ordinary sprites are untouched.
  const drawSeated=(a,isLely)=>{
    const x=Math.round(a.x),y=Math.round(a.y);ctx.save();ctx.beginPath();ctx.rect(x-18,y-32,36,35);ctx.clip();
    ctx.translate(0,7);if(isLely)drawPlayer();else drawWalkingEslaFigure(a,a.facing,0);ctx.restore();
    ctx.fillStyle=isLely?'#384268':'#2a3848';ctx.fillRect(x-8,y+1,7,5);ctx.fillRect(x+1,y+1,7,5);
    ctx.fillStyle=isLely?'#28201a':'#181820';ctx.fillRect(x-9,y+5,8,3);ctx.fillRect(x+1,y+5,8,3);
  };
  const drawEsla=()=>{
    if(!active()||regionalActiveMapId()!==MAP)return;ctx.save();
    if(seated)drawSeated(esla,false);else drawWalkingEslaFigure(esla,esla.facing,transientNpcRouteView(esla.id)?.step||0);ctx.restore();
  };
  const drawPlayerPose=()=>{
    if(!active()||!seated||regionalActiveMapId()!==MAP)return false;
    ctx.save();drawSeated(lely,true);ctx.restore();return true;
  };
  const drawNight=()=>{
    if(!active()||regionalActiveMapId()!==MAP)return;ctx.save();const darkness=light();
    // Small pixel-aligned light field, local to this scene, after world sprites
    // and before UI. No global palette changes, particles, RNG or render writes.
    if(darkness>0){
      const pulse=[0,.02,0,-.02][Math.floor(clock/10)%4];
      for(let y=0;y<480;y+=16)for(let x=0;x<512;x+=16){
        const d=Math.sqrt(((x+8-FIRE.x)/104)**2+((y+8-FIRE.y)/100)**2);
        const warmth=Math.max(0,1-d),shade=darkness*(.80-.68*warmth);
        ctx.fillStyle=`rgba(7,15,38,${shade.toFixed(3)})`;ctx.fillRect(x,y,16,16);
        if(warmth>0){ctx.fillStyle=`rgba(230,153,66,${(darkness*warmth*(.16+pulse)).toFixed(3)})`;ctx.fillRect(x,y,16,16);}
      }
      drawFire();
    }
    if(black()>0){ctx.fillStyle=`rgba(0,0,0,${black().toFixed(3)})`;ctx.fillRect(0,0,512,480);}
    ctx.restore();
  };
  return Object.freeze({prepare,begin,update,interact,drawFire,drawEsla,drawPlayerPose,drawNight,isActive:active,
    blocksSave:()=>active()||failure?.completionStarted===true,
    resetTransient(){if(active())clearDialogue();
      try{clear();}catch(error){console.error('[Night reset ownership]',error);}
      phase='idle';plan=null;failure=null;committing=false;seated=false;clock=0;elapsed=0;fire='cold';},
    getView(){return Object.freeze({phase,active:active(),failure,clock,elapsed,fire:visibleFire(),seated,darkness:light(),black:black(),
      stage:travellers_rise_camp_stage,firePosition:FIRE,
      actors:Object.freeze(active()?[lely,esla].map(a=>Object.freeze({id:a.id,x:a.x,y:a.y,facing:a.facing,seated})):[])});},
  });
})();
