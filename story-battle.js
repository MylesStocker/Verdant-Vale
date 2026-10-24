'use strict';

// Session-only resources for authored battles. This is a lifecycle adapter, not
// another combat resolver. The private bridge leases resources to the ordinary
// command session, then authenticates its acknowledged terminal snapshot.
const storyBattle = (() => {
  const bridge=combatPlayerState.claimStoryBridge(()=>
    (preparingSceneOwner||context?.sceneOwner)?.()===true);
  const gearSlots=['weapon','armor','shield','accessory'];
  const memberKeys=['characterId','name','hp','maxHp','atk','def','spd','statuses','equipment','slitherSpeed'];
  const methods=Object.freeze({
    submitAttack:['awaiting_action','targeting'],moveCommand:['awaiting_action'],confirmCommand:['awaiting_action'],
    moveTechnique:['technique'],confirmTechnique:['technique'],cancelTechnique:['technique'],
    moveItem:['item'],confirmItem:['item'],cancelItem:['item'],moveTarget:['targeting'],
    confirmTarget:['targeting'],cancelTargeting:['targeting'],
    backtrack:['awaiting_action','item','technique','targeting','ready'],commitRound:['ready'],
    advancePlayback:['playback'],acknowledgePlayback:['playback_complete'],
  });
  let context=null,preparingSceneOwner=null,sceneClaimed=false;
  const fail=message=>{throw new Error('Story battle: '+message);};
  const copy=value=>copyFormationData(value);
  const safe=n=>Number.isSafeInteger(n)&&n>=0;
  const from=pairs=>{const out={};for(const [key,value]of pairs)out[key]=value;return out;};
  const record=(value,required,optional=[])=>{
    if(!value||typeof value!=='object'||Array.isArray(value)||
        ![Object.prototype,Object.getPrototypeOf({})].includes(Object.getPrototypeOf(value)))fail('invalid record');
    const fields=Object.getOwnPropertyDescriptors(value);
    if(Reflect.ownKeys(fields).some(k=>typeof k!=='string'||!required.concat(optional).includes(k)||!Object.hasOwn(fields[k],'value'))||
        required.some(k=>!fields[k]))fail('invalid record fields');
    return from(Object.keys(fields).map(k=>[k,fields[k].value]));
  };
  const resources=value=>{
    const data=record(copy(value),['party','inventory']);
    if(!Array.isArray(data.party)||data.party.length<1||data.party.length>3||!Array.isArray(data.inventory))fail('invalid resources');
    const party=data.party.map(value=>{
      const m=record(value,memberKeys);
      if(typeof m.characterId!=='string'||!/^[a-z][a-z0-9_]*$/.test(m.characterId)||m.characterId==='player'||
          typeof m.name!=='string'||!m.name.trim()||!['hp','maxHp','atk','def','spd'].every(k=>safe(m[k]))||
          !m.maxHp||m.hp>m.maxHp||!Array.isArray(m.statuses)||new Set(m.statuses).size!==m.statuses.length||
          m.statuses.some(id=>!FORMATION_PLAYER_STATUSES.includes(id))||
          !Number.isSafeInteger(m.slitherSpeed)||m.slitherSpeed<1||m.slitherSpeed>20)fail('invalid party profile');
      const equipment=record(m.equipment,gearSlots);
      for(const slot of gearSlots)if(equipment[slot]!==null){
        const spec=formationItemDefinition(equipment[slot]);
        if(spec.effect!=='equip'||spec.item.type!==slot)fail('invalid loadout');
      }
      return {...m,equipment};
    });
    if(new Set(party.map(m=>m.characterId)).size!==party.length)fail('duplicate character');
    data.inventory.forEach(id=>formationItemDefinition(id));
    return copy({party,inventory:data.inventory});
  };
  const requestFor=(data,escape,bindings=null)=>{
    const request={members:data.party.map((m,slot)=>({characterId:m.characterId,slot,name:m.name,
      hp:m.hp,maxHp:m.maxHp,atk:m.atk,def:m.def,spd:m.spd,statuses:m.statuses})),
      inventory:data.inventory,equipment:data.party.map(m=>m.equipment),escape};
    const slither=data.party.flatMap((m,slot)=>m.statuses.includes('slither')?[{slot,speed:m.slitherSpeed}]:[]);
    if(slither.length)request.slither=slither;
    if(bindings!==null)request.resonance=bindings;
    return copy(request);
  };
  const owns=token=>context!==null&&token===context.token;
  const requireContext=token=>{if(!owns(token))fail('unknown or stale context');return context;};
  const noteFault=(ctx,error)=>{
    let fault=false;
    try{fault=combatPlayerState.session.getView()?.phase==='fault';}catch(_){fault=true;}
    if(fault)ctx.fault=String(error?.message||error).slice(0,180);
  };
  const createContext=(options,sceneOwner=null)=>{
      if(context||combat.mode!==null||combat.enemies.length||activityOwnership.conflicts(sceneOwner?.()===true?['cutaway']:[]).length)fail('another activity owns the session');
      const input=record(options,['id','party','inventory'],['resonance']);
      if(typeof input.id!=='string'||!input.id.trim()||input.id.length>120)fail('invalid context id');
      const data=resources({party:input.party,inventory:input.inventory});
      // Pure shared preparation: no identities, RNG, rewards, or canonical copy.
      const bindings=Object.hasOwn(input,'resonance')?copy(input.resonance):null;
      preparingSceneOwner=sceneOwner;
      try{bridge.preparePlayer(requestFor(data,'blocked',bindings));}finally{preparingSceneOwner=null;}
      const token=Object.freeze({});
      context={token,id:input.id,data,bindings,sceneOwner,battle:null,sequence:0,lastOutcome:null,fault:null,callbackError:null,entry:null};
      return token;
    };
  const beginContext=(token,options,entryData=null)=>{
      const ctx=requireContext(token);
      if(ctx.battle||ctx.fault)fail('battle already owned or faulted');
      const input=record(options,['encounter','escape','presentation'],['outcomes']);
      const presentation=record(copy(input.presentation),['label'],['backgroundAssetId','enemyFloorY']);
      if(typeof presentation.label!=='string'||!presentation.label.trim())fail('invalid presentation');
      if(Object.hasOwn(presentation,'backgroundAssetId')){
        const asset=typeof presentation.backgroundAssetId==='string'?IMAGE_ASSET_REGISTRY[presentation.backgroundAssetId]:null;
        if(!asset||asset.use!=='cutaway_background'||asset.width!==512||asset.height!==480)fail('invalid background asset');
      }
      if(Object.hasOwn(presentation,'enemyFloorY')&&(!Number.isSafeInteger(presentation.enemyFloorY)||presentation.enemyFloorY<140||presentation.enemyFloorY>212))fail('invalid enemy floor');
      const outcomes=record(input.outcomes||{},[],['victory','defeat','escape']);
      if(Object.values(outcomes).some(callback=>typeof callback!=='function'))fail('invalid outcome handler');
      if(!['blocked','fastest_living'].includes(input.escape))fail('unsupported escape policy');
      const encounter=copy(input.encounter),request=requestFor(entryData||ctx.data,input.escape,ctx.bindings);
      if(!safe(ctx.sequence+1))fail('battle sequence exhausted');
      const entry={data:copy(entryData||ctx.data),options:{encounter,escape:input.escape,presentation,outcomes}};
      bridge.begin(request,encounter,true); // complete shared preflight before allocators
      const ticket=bridge.begin(request,encounter);
      ctx.data=entry.data;ctx.entry=entry;ctx.sequence++;ctx.callbackError=null;
      ctx.battle={ticket,id:ctx.sequence,presentation:copy(presentation),outcomes,
        members:combatPlayerState.getView().members.map(m=>m.instanceId)};
      return storyBattle.getView(token);
  };
  return Object.freeze({
    hasContext(){return context!==null;},
    isActive(){return context!==null&&context.battle!==null;},
    createContext(options){return createContext(options);},
    // Claimed once by the authored scene controller. Generic/headless callers
    // retain strict modal exclusion; no caller-supplied boolean grants entry.
    claimSceneBridge(ownsScene){
      if(sceneClaimed||context||typeof ownsScene!=='function')fail('invalid scene bridge claim');
      sceneClaimed=true;
      return Object.freeze({createContext(options){
        if(ownsScene()!==true)fail('scene does not own entry');return createContext(options,ownsScene);
      }});
    },
    getState(token){
      const ctx=requireContext(token);
      // During combat, getView() owns current/historical presentation. These are
      // the last acknowledged resources, never a rollback/refund snapshot.
      return copy({id:ctx.id,...ctx.data,phase:ctx.fault?'fault':ctx.battle?'battle':'idle',
        lastOutcome:ctx.lastOutcome,fault:ctx.fault,callbackError:ctx.callbackError,
        ...(ctx.bindings!==null?{resonanceBindings:ctx.bindings}:{})});
    },
    begin(token,options){return beginContext(token,options);},
    retry(token){
      const ctx=requireContext(token);
      if(ctx.battle||ctx.fault||!ctx.entry||ctx.lastOutcome?.battleId!==ctx.sequence||
          !['defeat','escape'].includes(ctx.lastOutcome.outcome))return false;
      return beginContext(token,ctx.entry.options,ctx.entry.data);
    },
    getView(token){
      const ctx=requireContext(token);
      if(!ctx.battle||ctx.fault)return null;
      return copy({...combatPlayerState.session.getView(),active:true,...ctx.battle.presentation});
    },
    act(token,method,...args){
      const ctx=requireContext(token);
      if(!ctx.battle||ctx.fault||!Object.hasOwn(methods,method))return false;
      try{
        const view=combatPlayerState.session.getView();
        if(!methods[method].includes(view.phase))return false;
        combatPlayerState.session[method](...args);
        return this.getView(token);
      }catch(error){noteFault(ctx,error);throw error;}
    },
    complete(token){
      const ctx=requireContext(token),battle=ctx.battle;
      if(!battle||ctx.fault)return false;
      try{
        const view=combatPlayerState.session.getView();
        if(!['victory','defeat','escape'].includes(view.phase)||view.awaitingAcknowledgement)return false;
        const result=bridge.completed(battle.ticket),end=result.snapshot;
        if(end.party.length!==ctx.data.party.length)fail('terminal party changed');
        const party=end.party.map((m,i)=>{
          const before=ctx.data.party[i],gear=end.equipment[i],effect=end.effects[i];
          if(m.instanceId!==battle.members[i]||m.characterId!==before.characterId||m.slot!==i||
              gear.actorId!==m.instanceId||effect.actorId!==m.instanceId)fail('terminal identity changed');
          return {...before,hp:m.hp,statuses:m.statuses.filter(id=>!['burn','dazzled'].includes(id)),
            equipment:from(gearSlots.map(slot=>[slot,gear[slot]])),
            slitherSpeed:m.statuses.includes('slither')?effect.slither.speed:1};
        });
        const next=resources({party,inventory:end.inventory});
        const receipt=copy({contextId:ctx.id,battleId:battle.id,outcome:result.outcome,
          completedRounds:result.completedRounds,...next});
        bridge.finish(battle.ticket);
        ctx.data=next;ctx.lastOutcome=receipt;ctx.battle=null;
        // Consume before calling trusted authored continuation. A thrown or
        // reentrant callback cannot repeat commitment or erase a newer battle.
        const callback=battle.outcomes[result.outcome];
        if(callback)try{callback(receipt);}catch(error){ctx.callbackError=String(error?.message||error).slice(0,180);}
        return receipt;
      }catch(error){ctx.fault=String(error?.message||error).slice(0,180);throw error;}
    },
    discard(token){
      if(!owns(token))return false;
      if(context.battle)bridge.abandon(context.battle.ticket);
      context=null;return true;
    },
    reset(){
      if(!context)return true;
      return this.discard(context.token);
    },
  });
})();
