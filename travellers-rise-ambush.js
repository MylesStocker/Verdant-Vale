'use strict';

// Transient presentation owner for the MQ5 Travellers' Rise ambush. Persistent
// truth is limited to the three save-bound quest receipts in quests.js; combat
// execution and outcome authentication remain with scriptedPartyEncounters and
// canonicalPartyCombat.
const travellersRiseAmbush=(()=>{
  const MAP_ID='EASTERN_FENS_TRAVELLERS_RISE_MAP',CONTENT_KEY='eastern_fens_12';
  const TRIGGER=Object.freeze({col:10,row:7});
  const homes=Object.freeze([
    Object.freeze({x:12.5,y:4.5,facing:'down'}),
    Object.freeze({x:13.5,y:4.5,facing:'down'}),
    Object.freeze({x:14.5,y:4.5,facing:'down'}),
  ]);
  const destinations=Object.freeze([
    Object.freeze({x:8.5,y:7.5,facing:'right'}),
    Object.freeze({x:10.5,y:5.5,facing:'down'}),
    Object.freeze({x:12.5,y:7.5,facing:'left'}),
  ]);
  const actors=[
    {id:'travellers_rise_road_impostor',name:'Road Impostor',map:CONTENT_KEY,physicalMapId:MAP_ID,
      x:homes[0].x*TILE,y:homes[0].y*TILE,facing:homes[0].facing,solid:true,spriteType:'worker'},
    {id:'travellers_rise_cloaked_hollow',name:'Cloaked Traveller',map:CONTENT_KEY,physicalMapId:MAP_ID,
      x:homes[1].x*TILE,y:homes[1].y*TILE,facing:homes[1].facing,solid:true,spriteType:'traveler'},
    {id:'travellers_rise_fen_handler',name:'Fen Handler',map:CONTENT_KEY,physicalMapId:MAP_ID,
      x:homes[2].x*TILE,y:homes[2].y*TILE,facing:homes[2].facing,solid:true,spriteType:'worker'},
  ];
  const routes=Object.freeze([
    Object.freeze({type:'scriptedRoute',waypoints:Object.freeze([
      Object.freeze({x:12.5,y:6.5}),Object.freeze({x:8.5,y:6.5}),Object.freeze({x:8.5,y:7.5}),
    ]),speed:1.5,pauseFrames:0,loop:false}),
    Object.freeze({type:'scriptedRoute',waypoints:Object.freeze([
      Object.freeze({x:10.5,y:4.5}),Object.freeze({x:10.5,y:5.5}),
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
    let at={x:start.x,y:start.y};
    for(const point of route.waypoints){
      if(point.x!==at.x&&point.y!==at.y)fail('route is not orthogonal');
      const dx=Math.sign(point.x-at.x),dy=Math.sign(point.y-at.y);
      let x=at.x,y=at.y;
      while(x!==point.x||y!==point.y){x+=dx;y+=dy;if(!tileSafe(map,Math.floor(x),Math.floor(y)))fail('route crosses an unsafe cell');}
      at=point;
    }
  };
  const preflight=()=>{
    if(!storyEligible()||!onMap()||entryBusy())fail('entry state is not eligible');
    if(!Number.isSafeInteger(stats.gold)||stats.gold<0)fail('invalid party gold');
    const map=mapRefForId(MAP_ID);if(!map)fail('map is not registered');
    actors.forEach((actor,i)=>{validateTransientNpcRouteDefinition(actor,routes[i]);validateRouteCells(map,homes[i],routes[i]);});
    if(!tileSafe(map,TRIGGER.col,TRIGGER.row)||!destinations.every(p=>tileSafe(map,Math.floor(p.x),Math.floor(p.y))))
      fail('trigger or destination is unsafe');
    if(!scriptedPartyEncounters.validate('startTravellersRiseAmbush'))fail('canonical formation rejected');
    return true;
  };
  const startBattle=pay=>{
    const begin=()=>{
      try{
        const battle=scriptedPartyEncounters.startTravellersRise(pay&&!travellers_rise_ambush_paid);
        if(!battle)fail('combat activation rejected');
        phase='battle';return battle;
      }catch(error){abort(error);return false;}
    };
    try{
      const amount=pay&&!travellers_rise_ambush_paid?Math.min(100,stats.gold):0;
      if(pay&&!travellers_rise_ambush_paid){
        phase='payment';openPages([{speakerId:null,lines:[amount===100
          ?'You hand over 100 gold.'
          :'You hand over the '+amount+' gold you have.']}],begin);return true;
      }
      return begin();
    }catch(error){abort(error);return false;}
  };
  const openDemand=()=>{
    phase='choice';choice.title='The ambushers demand your packs.';
    choice.options=['Refuse','Hand over 100 gold'];choice.cursor=0;
    choice.callbacks=[()=>startBattle(false),()=>startBattle(true)];choice.open=true;
  };
  const reveal=()=>{
    revealed=true;phase='reveal';
    actors.forEach((actor,i)=>actor.facing=destinations[i].facing);
    const retry=travellers_rise_ambush_paid;
    openPages(retry?[
      {speakerId:'esla',lines:['“They’re closing in again.”']},
      {speakerId:'fen_handler',lines:['“It knows the whistle.”']},
    ]:[
      {speakerId:'esla',lines:['“That thing is waiting for you.”']},
      {speakerId:'fen_handler',lines:['“It knows the whistle.”']},
      {speakerId:'lely',lines:['“No. It knows what comes after.”']},
      {speakerId:'road_impostor',lines:['“Packs. Now.”']},
    ],retry?()=>startBattle(false):openDemand);
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
    // Read-only story gate, independent of terrain and structural seams. The
    // movement owner checks an attempted exit, never map loading or rendering.
    blocksExit(mapId,direction){return storyEligible()&&mapId===MAP_ID&&direction==='east';},
    isExclusive(){return ['opening','walking','reveal','choice','payment','aftermath'].includes(phase);},
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
        travellers_rise_ambush_complete=true;syncQuestFlagsToWindow();phase='aftermath';
        openPages([
          {speakerId:'esla',lines:['“The light’s going. We should use the rise and stop for the night.”']},
          {speakerId:'lely',lines:['“Here?”']},
          {speakerId:'esla',lines:['“Dry ground. A clear view of the road. Better than choosing in the dark.”']},
        ],()=>{phase='idle';});
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
