'use strict';

function requireSingletonEncounter(name, remaining) {
  if(canonicalPartyCombat.hasMultipleMembers())
    throw Error('Canonical party encounter: unsupported scripted encounter '+name);
  return scriptedCombatEntry.preflight(name, remaining);
}

// World encounter ownership. Resolver/session state is transient; canonical
// resource ownership and the authenticated writeback remain in persistentParty.
const canonicalPartyCombat = (() => {
  let battle=null,lastReceipt=null,pendingHandoff=null;
  const splitFactory=canonicalEnemyRecords.claimSplitFactory();
  const copy=copyFormationData;
  const fail=message=>{throw Error('Canonical party encounter: '+message);};
  const multiple=()=>persistentParty.getView().members.length>1;
  const safe=n=>Number.isSafeInteger(n)&&n>=0;
  const data=(value,keys)=>{
    if(!value||typeof value!=='object'||Array.isArray(value)||
        ![Object.prototype,Object.getPrototypeOf({})].includes(Object.getPrototypeOf(value)))fail('expected plain encounter data');
    const fields=Object.getOwnPropertyDescriptors(value);
    if(Reflect.ownKeys(fields).length!==keys.length||keys.some(k=>!Object.hasOwn(fields[k]||{},'value')))
      fail('unknown field or accessor');
    return Object.fromEntries(keys.map(k=>[k,fields[k].value]));
  };
  const location=()=>JSON.stringify({location:snapshotLocationState(),regional:regionalWorldPosition(),
    mapId:mapIdForRef(activeMap),x:player.x,y:player.y,day,defeatWakeAtHome});
  const preflight=(request,permit=null)=>{
    if(pendingHandoff&&permit!==pendingHandoff)fail('pending authenticated follow-up');
    if(battle)fail('requires an idle canonical party');
    const spec=data(request,['enemies','escape']);
    if(!['blocked','fastest_living'].includes(spec.escape))fail('unsupported escape policy');
    const enemySide=preparePartyEnemyFormation(spec.enemies),{templates,ids}=enemySide;
    if(regionalInvariantErrors().length||!safe(day)||!safe(day+1))fail('world cleanup is not ready');
    for(const [owner,keys]of [[combat,['cooldown','enemies']], [dialogue,['name','pages','open','page','callbacks']]])
      for(const key of keys){const field=Object.getOwnPropertyDescriptor(owner,key);
        if(!Object.hasOwn(field||{},'value')||field.writable!==true)fail('cleanup field is not writable: '+key);}
    if(defeatWakeAtHome&&!validatePlacement({mapId:'HOUSE_INTERIOR_MAP',x:9.5*TILE,y:3.5*TILE,facing:'down'}).ok)
      fail('defeat destination is not ready');
    const party=persistentParty.getView(),xp=templates.reduce((n,e)=>n+e.xp,0),gold=templates.reduce((n,e)=>n+e.goldMax,0);
    if(!safe(xp)||!safe(gold)||!safe(party.gold+gold)||!safe(stats.items.length+templates.length)||
        party.members.some(m=>![m.xp+xp,m.maxHp+MAX_LEVEL*10,m.hp+MAX_LEVEL*10,
          m.atk+MAX_LEVEL*3,m.def+MAX_LEVEL*3,m.spd+MAX_LEVEL].every(safe)))fail('reward arithmetic overflow');
    const composed=persistentParty.validateCombat(templates,{escape:spec.escape},permit);
    const ledger=persistentParty.serialize().rewards;let ordinal=ledger.length+1;
    while(ledger.some(r=>r.id==='canonical_encounter_'+ordinal))ordinal++;
    if(!safe(ordinal))fail('reward receipt capacity exhausted');
    return Object.freeze({...copy({ids,playerSide:composed.player,enemySide,escape:spec.escape,origin:location(),xp,
      rewardId:'canonical_encounter_'+ordinal,memberIds:party.members.map(m=>m.characterId)}),templates});
  };
  const view=()=>{
    if(!battle)return copy({active:false,phase:null,receipt:lastReceipt});
    if(battle.failure)return copy({active:true,phase:'fault',error:battle.failure.message,diagnostic:battle.failure});
    return copy({...combatPlayerState.session.getView(),active:true,label:'Battle'});
  };
  const fault=(error,stage)=>{
    let session=null;try{session=combatPlayerState.session.getView();}catch(_){}
    if(!battle)battle={rewardId:lastReceipt?.rewards?.id||null};
    battle.failure=copy({stage,message:String(error?.message||error),rewardId:battle.rewardId,
      session,writeback:battle.writeback||null});
    console.error('[Canonical party encounter]',battle.failure);
  };
  const finish=()=>{
    if(!battle||battle.failure||battle.completing)return false;
    let session;
    try{session=combatPlayerState.session.getView();}catch(error){fault(error,'terminal_validation');throw error;}
    if(!['victory','defeat','escape'].includes(session?.phase))return false;
    battle.completing=true;let stage='writeback';
    try{
      if(location()!==battle.origin)fail('origin changed during battle');
      battle.writeback=persistentParty.commitCombat();
      // Flight is not victory. The explicitly approved mixed-formation
      // exception rewards only defeated slots once every enemy is resolved.
      const cleared=session.enemies.every(e=>e.hp===0||e.unusual?.departed),
        rewardSlots=session.phase==='victory'||session.phase==='escape'&&cleared?session.enemies.filter(e=>e.hp===0).map(e=>e.slot):[];
      let rewards=null;
      if(rewardSlots.length){
        stage='rewards';let gold=0;const items=[];
        const roll=()=>{const n=Math.random();if(!Number.isFinite(n)||n<0||n>=1)fail('invalid reward RNG');return n;};
        for(const slot of rewardSlots){const enemy=battle.templates[slot];
          gold+=enemy.goldMin+Math.floor(roll()*(enemy.goldMax-enemy.goldMin+1));
          if(roll()<0.12)items.push('Potion');
        }
        rewards={id:battle.rewardId,xp:rewardSlots.reduce((sum,slot)=>sum+battle.templates[slot].xp,0),gold,items};
        persistentParty.awardRewards(rewards);
      }else if(session.phase==='defeat'){
        stage='recovery';persistentParty.recover();
        if(!applyCombatDefeatWorldRecovery())fail('defeat recovery did not reach its destination');
      }
      stage='cleanup';combat.cooldown=ENCOUNTER_COOLDOWN;
      lastReceipt=copy({outcome:session.phase,members:battle.memberIds,writeback:battle.writeback,rewards});
      const successors=session.phase!=='defeat'&&cleared?[...(battle.tail||[]),...rewardSlots.map(slot=>battle.templates[slot])
        .filter(t=>canonicalEnemyMechanicProfile(ENEMY_TEMPLATE_REGISTRY[t.id]).split_followup&&!canonicalEnemyRecords.origin(t))
        .map(splitFactory)]:[];
      const wasSplit=battle.templates.some(t=>canonicalEnemyRecords.origin(t)?.kind==='split');
      const policy=battle.escape;battle=null;reconcileFormationLabKeys();
      if(successors.length){
        const token={enemies:[successors[0]],tail:successors.slice(1),escape:policy,origin:location()};pendingHandoff=token;
        dialogue.name='';dialogue.pages=[['The Seep bursts apart — but the pieces are still moving.']];
        token.callback=()=>{
          if(pendingHandoff!==token)return false;
          if(location()!==token.origin)fail('follow-up origin changed');
          const prepared=preflight({enemies:token.enemies,escape:token.escape},token);
          if(dialogue.open||dialogue.callbacks?.length!==0)fail('follow-up callback is not being acknowledged');
          const result=install(prepared,token.tail,token);pendingHandoff=null;return result;
        };dialogue.callbacks=[token.callback];dialogue.open=true;dialogue.page=0;
      }else if(wasSplit&&session.phase==='victory'){
        dialogue.name='';dialogue.pages=[['The last of the Seep slumps and stops moving.']];dialogue.callbacks=null;dialogue.open=true;dialogue.page=0;
      }
      return lastReceipt;
    }catch(error){fault(error,stage);throw error;}
  };
  const operate=(method,...args)=>{
    if(!battle||battle.failure||battle.completing)return false;
    try{
      const result=combatPlayerState.session[method](...args);
      return result;
    }catch(error){fault(error,method);throw error;}
  };
  const install=(prepared,tail,handoff=null)=>{
    battle={...prepared,tail};lastReceipt=null;
    try{persistentParty.beginCombat(prepared.templates,{escape:prepared.escape},handoff);reconcileFormationLabKeys();return view();}
    catch(error){fault(error,'entry');throw error;}
  };
  return Object.freeze({
    hasPendingHandoff(){return pendingHandoff!==null;},
    permitsHandoff(token){
      return token===pendingHandoff&&token!==null&&Array.isArray(dialogue.callbacks)&&
        (dialogue.callbacks.length===1&&dialogue.callbacks[0]===token.callback||dialogue.callbacks.length===0&&!dialogue.open);
    },
    checkHandoffCallback(callback){
      const token=pendingHandoff;if(!token||callback!==token.callback)return true;
      if(location()!==token.origin)fail('follow-up origin changed');
      preflight({enemies:token.enemies,escape:token.escape},token);return true;
    },
    hasMultipleMembers:multiple,
    isActive(){return battle!==null;},
    getView:view,
    getReceipt(){return lastReceipt;},
    preparePlayerSide(policy){if(arguments.length!==1)fail('requires one player policy');return persistentParty.prepareCombat(policy);},
    prepareEnemySide(value){if(arguments.length!==1)fail('requires one enemy descriptor');return preparePartyEnemyFormation(value);},
    prepare(request){if(arguments.length!==1)fail('requires one encounter descriptor');return preflight(request);},
    validate(request){if(arguments.length!==1)fail('requires one encounter descriptor');preflight(request);return true;},
    enter(request){
      if(arguments.length!==1)fail('requires one encounter descriptor');
      return install(preflight(request),[]);
    },
    finish,
    handleInput(command){
      if(!battle||battle.failure||battle.completing)return false;
      let v;try{v=view();}catch(error){fault(error,'input_validation');throw error;}
      if(['victory','defeat','escape'].includes(v.phase))return command==='confirm'?finish():false;
      const direction=command==='left'||command==='up'?'previous':'next';
      if(v.phase==='awaiting_action'){
        if(['left','right'].includes(command))return operate('moveCommand',direction);
        if(command==='confirm')return operate('confirmCommand');
        if(command==='cancel'&&v.allyActions.length)return operate('backtrack');
      }
      for(const [phase,move,confirm,cancel,arrows] of [
        ['technique','moveTechnique','confirmTechnique','cancelTechnique',['up','down']],
        ['item','moveItem','confirmItem','cancelItem',['up','down']],
        ['targeting','moveTarget','confirmTarget','cancelTargeting',['left','right']],
      ])if(v.phase===phase){
        if(arrows.includes(command))return operate(move,direction);
        if(command==='confirm')return operate(confirm);
        if(command==='cancel')return operate(cancel);
      }
      if(v.phase==='ready'){
        if(command==='confirm')return operate('commitRound');
        if(command==='cancel')return operate('backtrack');
      }
      if(v.phase==='playback'&&command==='confirm')return operate('advancePlayback');
      if(v.phase==='playback_complete'&&command==='confirm')return operate('acknowledgePlayback');
      return false;
    },
  });
})();
