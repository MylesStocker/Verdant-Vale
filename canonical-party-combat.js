'use strict';

function requireSingletonEncounter(name) {
  if(canonicalPartyCombat.hasMultipleMembers())
    throw Error('Canonical party encounter: unsupported scripted encounter '+name);
}

// World encounter ownership. Resolver/session state is transient; canonical
// resource ownership and the authenticated writeback remain in persistentParty.
const canonicalPartyCombat = (() => {
  let battle=null,lastReceipt=null;
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
  const enemies=value=>{
    if(!Array.isArray(value)||![Array.prototype,Object.getPrototypeOf([])].includes(Object.getPrototypeOf(value)))fail('enemy group must be a dense array');
    const fields=Object.getOwnPropertyDescriptors(value),n=fields.length.value;
    if(n<1||n>3||Reflect.ownKeys(fields).length!==n+1)fail('requires one to three enemies');
    return Array.from({length:n},(_,i)=>{
      if(!Object.hasOwn(fields[i]||{},'value'))fail('enemy group contains an accessor or hole');
      const supplied=fields[i].value,id=typeof supplied==='string'?supplied:Object.getOwnPropertyDescriptor(supplied||{},'id')?.value;
      if(typeof id!=='string'||!PARTY_ATTACK_TEMPLATE_IDS.includes(id)){
        const known=typeof id==='string'?Object.getOwnPropertyDescriptor(ENEMY_TEMPLATE_REGISTRY,id)?.value:null;
        const capabilities=known?Object.keys(known).filter(k=>![...FORMATION_STATE_DATA_FIELDS,'isBoss'].includes(k)):[];
        fail('unsupported enemy '+String(id)+(capabilities.length?' ('+capabilities.join(', ')+')':' (unapproved encounter or presentation)'));
      }
      const template=Object.getOwnPropertyDescriptor(ENEMY_TEMPLATE_REGISTRY,id)?.value;
      const keys=[...FORMATION_STATE_DATA_FIELDS,...(Object.hasOwn(template||{},'isBoss')?['isBoss']:[])];
      const exact=data(template,keys);
      if(typeof supplied!=='string'){
        const input=data(supplied,keys);
        if(keys.some(k=>input[k]!==exact[k]))fail('enemy instance differs from its approved template: '+id);
      }
      if(exact.id!==id||!formationBasicStatsValid(exact)||!exact.hp||
          !['xp','goldMin','goldMax'].every(k=>safe(exact[k]))||exact.goldMax<exact.goldMin||
          !safe(exact.goldMax-exact.goldMin+1))
        fail('invalid enemy arithmetic: '+id);
      return exact;
    });
  };
  const location=()=>JSON.stringify({location:snapshotLocationState(),regional:regionalWorldPosition(),
    mapId:mapIdForRef(activeMap),x:player.x,y:player.y,day,defeatWakeAtHome});
  const preflight=request=>{
    if(battle||!multiple())fail('requires an idle canonical multi-member party');
    const spec=data(request,['enemies','escape']);
    if(!['blocked','fastest_living'].includes(spec.escape))fail('unsupported escape policy');
    const templates=enemies(spec.enemies),ids=templates.map(t=>t.id);
    if(regionalInvariantErrors().length||!safe(day)||!safe(day+1))fail('world cleanup is not ready');
    for(const [owner,keys]of [[combat,['cooldown','enemies']], [dialogue,['name','pages','open','page']]])
      for(const key of keys){const field=Object.getOwnPropertyDescriptor(owner,key);
        if(!Object.hasOwn(field||{},'value')||field.writable!==true)fail('cleanup field is not writable: '+key);}
    if(defeatWakeAtHome&&!validatePlacement({mapId:'HOUSE_INTERIOR_MAP',x:9.5*TILE,y:3.5*TILE,facing:'down'}).ok)
      fail('defeat destination is not ready');
    const party=persistentParty.getView(),xp=templates.reduce((n,e)=>n+e.xp,0),gold=templates.reduce((n,e)=>n+e.goldMax,0);
    if(!safe(xp)||!safe(gold)||!safe(party.gold+gold)||!safe(stats.items.length+templates.length)||
        party.members.some(m=>![m.xp+xp,m.maxHp+MAX_LEVEL*10,m.hp+MAX_LEVEL*10,
          m.atk+MAX_LEVEL*3,m.def+MAX_LEVEL*3,m.spd+MAX_LEVEL].every(safe)))fail('reward arithmetic overflow');
    persistentParty.validateCombat(ids,{escape:spec.escape});
    const ledger=persistentParty.serialize().rewards;let ordinal=ledger.length+1;
    while(ledger.some(r=>r.id==='canonical_encounter_'+ordinal))ordinal++;
    if(!safe(ordinal))fail('reward receipt capacity exhausted');
    return {templates,ids,escape:spec.escape,origin:location(),xp,
      rewardId:'canonical_encounter_'+ordinal,memberIds:party.members.map(m=>m.characterId)};
  };
  const view=()=>{
    if(!battle)return copy({active:false,phase:null,receipt:lastReceipt});
    if(battle.failure)return copy({active:true,phase:'fault',error:battle.failure.message,diagnostic:battle.failure});
    return copy({...combatPlayerState.session.getView(),active:true,label:'Battle'});
  };
  const fault=(error,stage)=>{
    let session=null;try{session=combatPlayerState.session.getView();}catch(_){}
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
      let rewards=null;
      if(session.phase==='victory'){
        stage='rewards';let gold=0;const items=[];
        const roll=()=>{const n=Math.random();if(!Number.isFinite(n)||n<0||n>=1)fail('invalid reward RNG');return n;};
        for(const enemy of battle.templates){
          gold+=enemy.goldMin+Math.floor(roll()*(enemy.goldMax-enemy.goldMin+1));
          if(roll()<0.12)items.push('Potion');
        }
        rewards={id:battle.rewardId,xp:battle.xp,gold,items};
        persistentParty.awardRewards(rewards);
      }else if(session.phase==='defeat'){
        stage='recovery';persistentParty.recover();
        if(!applyCombatDefeatWorldRecovery())fail('defeat recovery did not reach its destination');
      }
      stage='cleanup';combat.cooldown=ENCOUNTER_COOLDOWN;
      lastReceipt=copy({outcome:session.phase,members:battle.memberIds,writeback:battle.writeback,rewards});
      battle=null;reconcileFormationLabKeys();return lastReceipt;
    }catch(error){fault(error,stage);throw error;}
  };
  const operate=(method,...args)=>{
    if(!battle||battle.failure||battle.completing)return false;
    try{
      const result=combatPlayerState.session[method](...args);
      return result;
    }catch(error){fault(error,method);throw error;}
  };
  return Object.freeze({
    hasMultipleMembers:multiple,
    isActive(){return battle!==null;},
    getView:view,
    getReceipt(){return lastReceipt;},
    validate(request){if(arguments.length!==1)fail('requires one encounter descriptor');preflight(request);return true;},
    enter(request){
      if(arguments.length!==1)fail('requires one encounter descriptor');
      const prepared=preflight(request);
      battle=prepared;lastReceipt=null;
      try{
        persistentParty.beginCombat(prepared.ids,{escape:prepared.escape});
        reconcileFormationLabKeys();return view();
      }catch(error){fault(error,'entry');throw error;}
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
