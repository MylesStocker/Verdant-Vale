'use strict';

// Quest owner: synchronous cargo/stage/party transactions. No duplicate actor
// record, gold ledger, alliance flag, or saved presentation state lives here.
const fineNeedlework = (() => {
  const parcel='Embroideries Parcel',reason='fine_needlework',returnMapId='MORNAY_COMMERCIAL_INN_MAP';
  const waiting=Object.freeze({x:13.5*TILE,y:9.5*TILE,facing:'left'});
  let phase='idle',pose={...waiting},walk=null,stalled=0;
  const esla=()=>FINE_NEEDLEWORK_NPCS[1];
  const here=id=>activeMap===mapRefForId(id);
  const carrying=()=>fine_needlework_stage===1;
  const count=items=>items.filter(i=>i.name===parcel).length;
  const absent=()=>persistentParty.getAbsence('esla');
  const invariantErrors=source=>{
    const stage=source?(source.fine_needlework_stage??0):fine_needlework_stage;
    const party=source?source.party:persistentParty.serialize();
    const items=source?source.stats?.items:stats.items;
    const errors=[];
    if(!Number.isInteger(stage)||stage<0||stage>5)return ['invalid Fine Needlework stage'];
    if(!Array.isArray(items)||count(items)!==(stage===1?1:0))errors.push('parcel does not match Fine Needlework stage');
    const absences=party?.absences||[],entry=absences.find(a=>a.characterId==='esla');
    const needsAbsent=stage>=1&&stage<=3;
    if(needsAbsent&&(!party?.order?.includes('esla')||!entry||entry.reason!==reason||entry.returnMapId!==returnMapId))
      errors.push('Fine Needlework requires Esla waiting at Ledger House');
    if(!needsAbsent&&absences.some(a=>a.reason===reason))errors.push('orphaned Fine Needlework absence');
    if(absences.some(a=>a.reason===reason&&a.characterId!=='esla'))errors.push('wrong Fine Needlework companion');
    if(stage>0&&!party?.order?.includes('esla'))errors.push('Fine Needlework requires recruited Esla');
    if(stage>0&&(source?source.MainQuest:MainQuest)<5)errors.push('Fine Needlework precedes recruitment');
    return errors;
  };
  const valid=()=>invariantErrors().length===0;
  const changed=()=>{syncQuestFlagsToWindow();partyFieldMenu.reset();};
  const availability=available=>persistentParty.prepareAvailabilityChange({characterId:'esla',available,reason,returnMapId});
  const accept=()=>{
    if(!here('MORNAY_GATE_INN_MAP')||![0,5].includes(fine_needlework_stage)||!valid()||MainQuest<5||
        polwickLighthouseOutcome()!=='allied'||!persistentParty.isAvailable('esla')||stats.hp<=0)return false;
    let token;try{token=availability(false);persistentParty.validateAvailabilityChange(token);}catch(_){return false;}
    const item={...ITEM_REGISTRY[parcel]};
    persistentParty.applyAvailabilityChange(token);
    stats.items.push(item);fine_needlework_stage=1;changed();return true;
  };
  const returnParcel=()=>{
    if(!here('MORNAY_GATE_INN_MAP')||!carrying()||!valid())return false;
    stats.items.splice(stats.items.findIndex(i=>i.name===parcel),1);fine_needlework_stage=3;changed();return true;
  };
  const deliver=()=>{
    const polwick=SIMPLE_NPCS.find(n=>n.id==='polwick');
    if(!inSmugglerFort||!here('SMUGGLER_FORT_MAP')||polwick?.map!=='smuggler_fort'||
        !carrying()||!valid()||!Number.isSafeInteger(stats.gold)||stats.gold<0||!Number.isSafeInteger(stats.gold+1500))return false;
    stats.items.splice(stats.items.findIndex(i=>i.name===parcel),1);stats.gold+=1500;fine_needlework_stage=2;changed();return true;
  };
  const reunite=()=>{
    if(!here(returnMapId)||![2,3].includes(fine_needlework_stage)||!valid())return false;
    let token;try{token=availability(true);persistentParty.validateAvailabilityChange(token);}catch(_){return false;}
    persistentParty.applyAvailabilityChange(token);
    fine_needlework_stage=fine_needlework_stage===2?4:5;changed();return true;
  };
  const say=(key,callback)=>{
    dialogue.name='';setSpeakerDialoguePages(FINE_NEEDLEWORK_CONTENT.pages[key]);
    dialogue.page=0;dialogue.callbacks=callback?[callback]:null;dialogue.open=true;
  };
  const reset=()=>{delete NPC_ROUTES[esla().id];phase='idle';pose={...waiting};walk=null;stalled=0;};
  // Bounded room search against the existing NPC collision authority. Routes
  // stop just inside the exit; only presentation disappears at that doorway.
  // Other routes are paused during the exchange/departure, so the preflight
  // stays valid. Never move Lely to a convenient cutscene coordinate.
  const prepareStaging=()=>{
    const candidates=[];
    for(let row=1;row<14;row++)for(let col=1;col<15;col++){
      const x=(col+.5)*TILE,y=(row+.5)*TILE;
      if(Math.hypot(x-player.x,y-player.y)<=72&&npcRouteCanOccupy(esla(),x,y))candidates.push({x,y});
    }
    candidates.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
    const target=[7.5,6.5,8.5].map(x=>({x:x*TILE,y:13.5*TILE})).find(p=>npcRouteCanOccupy(esla(),p.x,p.y));
    if(!target)return false;
    const key=p=>p.x+','+p.y;
    for(const start of candidates){
      const queue=[start],previous=new Map([[key(start),null]]);
      let found=false;
      for(let i=0;i<queue.length;i++){
        const p=queue[i];if(key(p)===key(target)){found=true;break;}
        for(const [dx,dy]of [[0,TILE],[-TILE,0],[TILE,0],[0,-TILE]]){
          const next={x:p.x+dx,y:p.y+dy};if(previous.has(key(next)))continue;
          let clear=true;
          for(let step=4;step<=TILE;step+=4)if(!npcRouteCanOccupy(esla(),p.x+dx*step/TILE,p.y+dy*step/TILE)){clear=false;break;}
          if(clear){previous.set(key(next),p);queue.push(next);}
        }
      }
      if(!found)continue;
      const path=[];let p=target;while(previous.get(key(p))){path.unshift({x:p.x/TILE,y:p.y/TILE});p=previous.get(key(p));}
      if(!path.length)continue;
      pose={...start,facing:player.x<start.x?'left':'right'};phase='offer';
      walk=validateTransientNpcRouteDefinition(esla(),{type:'scriptedRoute',waypoints:path,speed:2,pauseFrames:0,loop:false});
      return true;
    }
    return false;
  };
  const startDeparture=()=>{
    if(phase!=='offer'||!walk||!absent()){reset();return;}
    startTransientNpcRoute(esla(),walk,false);phase='walking';stalled=0;
  };
  const interactChuggie=npc=>{
    if(!npc||npc.id!=='mornay_chuggie'||!here('MORNAY_GATE_INN_MAP')||phase!=='idle')return false;
    if(carrying()){
      say('carrying',()=>{choice.title='Fine Needlework';choice.options=[...FINE_NEEDLEWORK_CONTENT.choices.cargo];choice.cursor=0;
        choice.callbacks=[()=>{if(returnParcel())say('returned');},()=>{}];choice.open=true;});return true;
    }
    if([2,3].includes(fine_needlework_stage)){say('awaitReunion');return true;}
    if(fine_needlework_stage===4){say('completed');return true;}
    const outcome=polwickLighthouseOutcome();
    if(outcome!=='allied'){say(smugglers_dead||fort_report_filed?'dismissed':'unallied');return true;}
    if(MainQuest<5||!persistentParty.isAvailable('esla')){say('noEsla');return true;}
    if(!prepareStaging())return false;
    say(fine_needlework_stage===5?'reoffer':'offer',()=>{
      choice.title='Fine Needlework — Esla will wait at Ledger House';choice.options=[...FINE_NEEDLEWORK_CONTENT.choices.offer];choice.cursor=0;
      choice.callbacks=[()=>{
        if(accept())say('accepted',startDeparture);else say('acceptanceUnavailable',reset);
      },()=>say('declined',reset)];choice.open=true;
    });return true;
  };
  const interactEsla=npc=>{
    if(!npc||npc.id!==esla().id||!here(returnMapId)||!absent())return false;
    if(carrying()){say('earlyReunion');return true;}
    // Keep her visible for her last words; the callback restores availability.
    if([2,3].includes(fine_needlework_stage)){say('reunion',()=>reunite());return true;}
    return false;
  };
  const interactPolwick=npc=>{
    if(!npc||npc.id!=='polwick'||!carrying())return false;
    if(!deliver())return false;say('delivery');return true;
  };
  const update=()=>{
    if(phase==='idle')return false;
    if(phase==='walking'){
      const before=pose.x+','+pose.y;updateNpcRoutes([esla().id]);
      stalled=before===pose.x+','+pose.y?stalled+1:0;
      if(NPC_ROUTES[esla().id]?.done)reset();
      else if(stalled>180){reset();console.warn('[Fine Needlework] departure interrupted; Esla is waiting at Ledger House');}
    }
    return true;
  };
  return Object.freeze({accept,returnParcel,deliver,reunite,invariantErrors,interactChuggie,interactEsla,interactPolwick,
    update,reset,isActive:()=>phase!=='idle',
    eslaMap:()=>phase!=='idle'?mornayContentKey('MORNAY_GATE_INN_MAP'):absent()?.reason===reason?mornayContentKey(returnMapId):null,
    eslaPose:()=>phase!=='idle'?{...pose}:waiting,
    setEslaCoordinate:(key,value)=>{if(phase!=='idle'&&['x','y','facing'].includes(key))pose[key]=value;},
    getView:()=>({phase,pose:{...pose},stage:fine_needlework_stage}),
  });
})();
NPC_ACTIONS.fineNeedleworkChuggie=npc=>fineNeedlework.interactChuggie(npc);
NPC_ACTIONS.fineNeedleworkEsla=npc=>fineNeedlework.interactEsla(npc);
