'use strict';

// Transient presentation owner for the MQ5 Travellers' Rise ambush. Persistent
// truth is limited to the three save-bound quest receipts in quests.js; combat
// execution and outcome authentication remain with scriptedPartyEncounters and
// canonicalPartyCombat.
const travellersRiseAmbush=(()=>{
  const MAP_ID='EASTERN_FENS_TRAVELLERS_RISE_MAP',CONTENT_KEY='eastern_fens_12';
  const TRIGGER=Object.freeze({col:10,row:7});
  const homes=Object.freeze([
    Object.freeze({x:8.5,y:4.5,facing:'down'}),
    Object.freeze({x:10.5,y:3.5,facing:'down'}),
    Object.freeze({x:14.5,y:4.5,facing:'down'}),
  ]);
  const destinations=Object.freeze([
    Object.freeze({x:8.5,y:7.5,facing:'right'}),
    Object.freeze({x:10.5,y:5.5,facing:'down'}),
    Object.freeze({x:12.5,y:7.5,facing:'left'}),
  ]);
  const actors=[
    {id:'travellers_rise_road_impostor',name:'Highwayman',map:CONTENT_KEY,physicalMapId:MAP_ID,
      x:homes[0].x*TILE,y:homes[0].y*TILE,facing:homes[0].facing,solid:true,spriteType:'worker'},
    {id:'travellers_rise_cloaked_hollow',name:'Cloaked Traveller',map:CONTENT_KEY,physicalMapId:MAP_ID,
      x:homes[1].x*TILE,y:homes[1].y*TILE,facing:homes[1].facing,solid:true,spriteType:'traveler'},
    {id:'travellers_rise_fen_handler',name:'Fen Handler',map:CONTENT_KEY,physicalMapId:MAP_ID,
      x:homes[2].x*TILE,y:homes[2].y*TILE,facing:homes[2].facing,solid:true,spriteType:'worker'},
  ];
  const routes=Object.freeze([
    Object.freeze({type:'scriptedRoute',waypoints:Object.freeze([
      Object.freeze({x:8.5,y:7.5}),
    ]),speed:1.5,pauseFrames:0,loop:false}),
    Object.freeze({type:'scriptedRoute',waypoints:Object.freeze([
      Object.freeze({x:10.5,y:5.5}),
    ]),speed:1.5,pauseFrames:0,loop:false}),
    Object.freeze({type:'scriptedRoute',waypoints:Object.freeze([
      Object.freeze({x:14.5,y:8.5}),Object.freeze({x:12.5,y:8.5}),Object.freeze({x:12.5,y:7.5}),
    ]),speed:1.5,pauseFrames:0,loop:false}),
  ]);
  let phase='idle',revealed=false,armed=false,failure=null;
  const fail=message=>{throw Error('Travellers\' Rise ambush: '+message);};
  const onMap=()=>mapIdForRef(activeMap)===MAP_ID;
  const storyEligible=()=>MainQuest>=5&&persistentParty.getMember('esla')!==null&&
    !travellers_rise_ambush_complete;
  const entryBusy=()=>combat.active||canonicalPartyCombat.isActive()||dialogue.open||choice.open||
    menu.open||shop.open||debugMenu.open||warpMenu.open||continentMap.open||accordPanel.open||
    fishing.active||seraLioraCutscene.active||formationCombatLab.isOpen()||partyCombatLab.isActive();
  const visible=()=>onMap()&&storyEligible()&&phase!=='battle'&&phase!=='fault';
  const resetActors=()=>{
    actors.forEach((actor,i)=>{stopTransientNpcRoute(actor);actor.x=homes[i].x*TILE;actor.y=homes[i].y*TILE;
      actor.facing=homes[i].facing;});revealed=false;
  };
  const closedPages=records=>Object.freeze(records.map(record=>Object.freeze({speakerId:record.speakerId,
    lines:Object.freeze(record.lines.slice())})));
  const openPages=(records,callback)=>{
    setSpeakerDialoguePages(closedPages(records));dialogue.name='';dialogue.callbacks=callback?[callback]:null;
    dialogue.open=true;dialogue.page=0;
  };
  const tileSafe=(map,col,row)=>{
    const points=[[col*TILE+7,row*TILE+7],[(col+1)*TILE-7,row*TILE+7],
      [col*TILE+7,(row+1)*TILE-7],[(col+1)*TILE-7,(row+1)*TILE-7]];
    return points.every(([x,y])=>{const t=map[Math.floor(y/TILE)]?.[Math.floor(x/TILE)];
      return Number.isSafeInteger(t)&&isTileWalkable(t)&&!TILE_PROPERTIES[t]?.isTransition;});
  };
  const validateRouteCells=(map,start,route)=>{
    const check=(x,y)=>{
      if(!tileSafe(map,Math.floor(x),Math.floor(y)))fail('route crosses an unsafe cell');
      if(Math.floor(x)===TRIGGER.col&&Math.floor(y)===TRIGGER.row)fail('route crosses the player trigger');
      if(SIMPLE_NPCS.some(npc=>npc.solid&&npc.map===CONTENT_KEY&&
        Math.abs(x*TILE-npc.x)<18&&Math.abs(y*TILE-npc.y)<18))fail('route crosses an occupied cell');
    };
    let at={x:start.x,y:start.y};check(at.x,at.y);
    for(const point of route.waypoints){
      if(point.x!==at.x&&point.y!==at.y)fail('route is not orthogonal');
      const dx=Math.sign(point.x-at.x),dy=Math.sign(point.y-at.y);
      let x=at.x,y=at.y;
      while(x!==point.x||y!==point.y){x+=dx;y+=dy;check(x,y);}
      at=point;
    }
  };
  // Dry-run the exact authored cadence before installing any route. Shared
  // terrain paths are not enough: every actor must also clear the player and
  // the other actors throughout the walk, including their homes/endpoints.
  const validateStaging=()=>{
    const poses=homes.map(p=>({x:p.x*TILE,y:p.y*TILE,next:0}));
    const check=()=>poses.forEach((p,i)=>{
      if(Math.abs(p.x-player.x)<18&&Math.abs(p.y-player.y)<18)fail('route overlaps the player');
      for(let j=0;j<i;j++)if(Math.abs(p.x-poses[j].x)<18&&Math.abs(p.y-poses[j].y)<18)
        fail('staging actors overlap');
    });
    check();
    for(let tick=0;poses.some((p,i)=>p.next<routes[i].waypoints.length);tick++){
      if(tick>=1000)fail('staging route exceeds bounded duration');
      poses.forEach((p,i)=>{
        const r=routes[i],wp=r.waypoints[p.next];if(!wp)return;
        const tx=wp.x*TILE,ty=wp.y*TILE;
        p.x+=Math.sign(tx-p.x)*Math.min(r.speed,Math.abs(tx-p.x));
        p.y+=Math.sign(ty-p.y)*Math.min(r.speed,Math.abs(ty-p.y));
        if(p.x===tx&&p.y===ty)p.next++;
      });check();
    }
    poses.forEach((p,i)=>{if(p.x!==destinations[i].x*TILE||p.y!==destinations[i].y*TILE)
      fail('route does not reach its authored destination');});
  };
  const preflight=()=>{
    if(!storyEligible()||!onMap()||entryBusy())fail('entry state is not eligible');
    if(!Number.isSafeInteger(stats.gold)||stats.gold<0)fail('invalid party gold');
    const map=mapRefForId(MAP_ID);if(!map)fail('map is not registered');
    actors.forEach((actor,i)=>{validateTransientNpcRouteDefinition(actor,routes[i]);validateRouteCells(map,homes[i],routes[i]);});
    if(!tileSafe(map,TRIGGER.col,TRIGGER.row)||!destinations.every(p=>tileSafe(map,Math.floor(p.x),Math.floor(p.y))))
      fail('trigger or destination is unsafe');
    validateStaging();
    if(!scriptedPartyEncounters.validate('startTravellersRiseAmbush'))fail('canonical formation rejected');
    return true;
  };
  const startBattle=()=>{
    try{
      const battle=scriptedPartyEncounters.startTravellersRise(false);
      if(!battle)fail('combat activation rejected');
      phase='battle';return battle;
    }catch(error){abort(error);return false;}
  };
  const reveal=()=>{
    revealed=true;phase='reveal';
    actors.forEach((actor,i)=>actor.facing=destinations[i].facing);
    openPages([
      {speakerId:'esla',lines:['“That thing is waiting for you.”']},
      {speakerId:'fen_handler',lines:['“It knows the whistle.”']},
      {speakerId:'lely',lines:['“No. It knows what comes after.”']},
      {speakerId:'road_impostor',lines:['“Packs. Now.”']},
      {speakerId:'esla',lines:['“We’re not handing over anything. Get out of our way.”']},
      {speakerId:'road_impostor',lines:['“Then we’ll take them off your bodies.”']},
    ],startBattle);
  };
  const startRoutes=()=>{
    try{
      routes.forEach((route,i)=>{if(!startTransientNpcRoute(actors[i],route))fail('route installation failed');});
      phase='walking';return true;
    }catch(error){abort(error);return false;}
  };
  const begin=()=>{
    preflight();phase='opening';
    openPages([
      {speakerId:'road_impostor',lines:['“Road’s worse east of here. We’re taking travellers through in a group before the light goes.”']},
      {speakerId:'esla',lines:['“Who sent you?”']},
      {speakerId:'road_impostor',lines:['“Mornay road office. Ask them when you arrive.”']},
      {speakerId:'fen_handler',lines:['“Stand here arguing if you like. We’re moving.”']},
    ],startRoutes);return true;
  };
  function abort(error){
    resetActors();dialogue.open=false;dialogue.callbacks=[];choice.open=false;choice.callbacks=[];
    phase='fault';failure=String(error?.message||error);console.error(failure);
  }
  const drawFieldHollow=actor=>{
    const x=Math.round(actor.x),y=Math.round(actor.y);
    ctx.fillStyle='#24282a';ctx.fillRect(x-8,y-11,16,12);ctx.fillRect(x-6,y-22,12,12);
    ctx.fillStyle='#596064';ctx.fillRect(x-5,y-20,10,7);ctx.fillRect(x-11,y-7,6,5);ctx.fillRect(x+5,y-7,6,5);
    ctx.fillStyle='#8f7442';ctx.fillRect(x-7,y-13,14,3);ctx.fillRect(x+5,y-11,3,8);
    ctx.fillStyle='#d2c69a';ctx.fillRect(x-3,y-17,2,2);ctx.fillRect(x+2,y-17,2,2);
    ctx.fillStyle='#17181a';ctx.fillRect(x-7,y,5,7);ctx.fillRect(x+2,y,5,7);
  };
  return Object.freeze({
    tryTrigger(){
      if(phase!=='idle'||!storyEligible()||!onMap()||entryBusy())return false;
      const here=Math.floor(player.x/TILE)===TRIGGER.col&&Math.floor(player.y/TILE)===TRIGGER.row;
      if(!here){armed=true;return false;}if(!armed)return false;
      armed=false;try{return begin();}catch(error){abort(error);return true;}
    },
    // Ordinary conversation is separate from the deliberate road trigger.
    // It never installs routes from an arbitrary player position.
    interact(){
      if(phase!=='idle'||!visible()||entryBusy())return false;
      const index=actors.findIndex(actor=>nearPlayer(actor.x,actor.y));if(index<0)return false;
      const pages=[
        {speakerId:'road_impostor',lines:['“Road’s worse east of here. We’re taking travellers through in a group before the light goes.”',
          '“Road office. If you want through, do as you’re told.”']},
        {speakerId:null,lines:['The cloaked traveller says nothing.']},
        {speakerId:'fen_handler',lines:['“Stand here arguing if you like. We’re moving.”']},
      ];
      openPages([pages[index]]);return true;
    },
    // Read-only story gate, independent of terrain and structural seams. The
    // movement owner checks an attempted exit, never map loading or rendering.
    blocksExit(mapId,direction){return mapId===MAP_ID&&direction==='east'&&
      (storyEligible()||travellersRiseCamp.blocksEast());},
    isExclusive(){return ['opening','walking','reveal','aftermath'].includes(phase);},
    blocksSaveLoad(){return this.isExclusive()||phase==='battle';},
    blocksPosition(x,y){return visible()&&actors.some(actor=>Math.abs(x-actor.x)<18&&Math.abs(y-actor.y)<18);},
    update(){
      if(phase!=='walking')return false;updateNpcRoutes();
      if(actors.every(actor=>transientNpcRouteView(actor.id)?.done))reveal();return true;
    },
    draw(){
      if(!visible())return;actors.forEach((actor,i)=>{
        if(i===1&&revealed){drawFieldHollow(actor);return;}
        const rt=transientNpcRouteView(actor.id);
        if(i!==1&&rt?.moving)drawWalkingWorker(actor,rt.facing,rt.step,true);
        else if(i===1&&rt?.moving)drawGenericTraveler({...actor,y:actor.y+(((rt.step>>3)&1)?1:0)});
        else drawGenericNPC(actor);
      });
    },
    finalizeAuthenticated(result){
      if(phase!=='battle'||!result||!['victory','defeat','escape'].includes(result.outcome))fail('invalid authenticated finalization');
      resetActors();
      if(result.outcome==='victory'){
        travellers_rise_ambush_complete=true;syncQuestFlagsToWindow();phase='idle';
        // Canonical combat already granted these rewards. This acknowledgement
        // only presents its authenticated receipt; it never grants a second award.
        const rewards=result.rewards;
        if(rewards)openPages([{speakerId:null,lines:[
          `Gained ${rewards.xp} XP and ${rewards.gold} gold.`,
          ...rewards.items.map(item=>'Found: '+item+'.'),
        ]}]);
        // The camp owner waits for cleanup and every reward/level-up page.
      }else{phase='idle';armed=result.outcome==='defeat';}
      return true;
    },
    resetTransient(){resetActors();phase='idle';revealed=false;armed=false;failure=null;return true;},
    getView(){return Object.freeze({phase,revealed,armed,failure,trigger:TRIGGER,
      actors:Object.freeze(actors.map((a,i)=>Object.freeze({id:a.id,x:a.x,y:a.y,facing:a.facing,
        home:homes[i],destination:destinations[i],route:transientNpcRouteView(a.id)}))),
      complete:travellers_rise_ambush_complete,paid:travellers_rise_ambush_paid,payment:travellers_rise_ambush_payment});},
  });
})();
