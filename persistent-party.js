'use strict';

// Canonical roster, not a second player record. Only non-Lely state lives here.
// Esla's linear progression is provisional: level 5 anchors the approved Lab
// scale (50 HP / 10 ATK / 4 DEF / 8 SPD). MQ5 recruits through this authority.
const PERSISTENT_CHARACTER_DEFINITIONS = Object.freeze({
  lely:Object.freeze({id:'lely',slot:0,name:'Lély',rareBorn:false,affinity:null}),
  esla:Object.freeze({id:'esla',slot:1,name:'Esla',rareBorn:true,affinity:'bloommarked',provisional:true,
    progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,
      defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),
});

const persistentParty = (() => {
  const bridge=combatPlayerState.claimPersistentBridge();
  const slots=['weapon','armor','shield','accessory'];
  const scalarKeys=['hp','maxHp','atk','def','spd','level','xp'];
  let order=['lely'], characters=[], rewards=[], revision=0, battle=null, rewardFailure=null;
  const loads=new WeakMap();
  const fail=()=>{throw new Error('Invalid persistent party state or lifecycle operation');};
  // JSON.parse/Object helpers may belong to the harness host realm. Accept
  // only either ordinary Object/Array prototype; still reject custom classes.
  const plain=v=>[Object.prototype,Object.getPrototypeOf({})].includes(Object.getPrototypeOf(v));
  const listProto=v=>[Array.prototype,Object.getPrototypeOf([])].includes(Object.getPrototypeOf(v));
  const from=pairs=>{const out={};for(const [k,v]of pairs)out[k]=v;return out;};
  const copy=value=>{
    if(value===null||['string','boolean'].includes(typeof value)||typeof value==='number'&&Number.isFinite(value))return value;
    if(!value||typeof value!=='object')fail();
    if(Array.isArray(value))return Object.freeze(array(value).map(copy));
    if(!plain(value))fail();
    const out={};for(const [key,d]of Object.entries(Object.getOwnPropertyDescriptors(value))){
      if(!Object.hasOwn(d,'value'))fail();out[key]=copy(d.value);
    }return Object.freeze(out);
  };
  const safe=n=>Number.isSafeInteger(n)&&n>=0;
  const record=(v,keys)=>{
    if(!v||typeof v!=='object'||Array.isArray(v)||!plain(v))fail();
    const d=Object.getOwnPropertyDescriptors(v);
    if(Reflect.ownKeys(d).length!==keys.length||keys.some(k=>!d[k]||!Object.hasOwn(d[k],'value')))fail();
    return from(keys.map(k=>[k,d[k].value]));
  };
  const array=v=>{
    if(!Array.isArray(v)||!listProto(v))fail();
    const d=Object.getOwnPropertyDescriptors(v),n=d.length.value;
    if(Reflect.ownKeys(d).length!==n+1)fail();
    const out=[];for(let i=0;i<n;i++){if(!d[i]||!Object.hasOwn(d[i],'value'))fail();out.push(d[i].value);}return out;
  };
  const statusList=v=>{
    const a=array(v);if(new Set(a).size!==a.length||a.some(x=>!FORMATION_PLAYER_STATUSES.includes(x)))fail();return a;
  };
  const item=id=>{
    if(typeof id!=='string'||!Object.hasOwn(ITEM_REGISTRY,id))fail();return ITEM_REGISTRY[id];
  };
  const equipment=v=>{
    const gear=record(v,slots);
    for(const slot of slots)if(gear[slot]!==null){const def=item(gear[slot]);if(def.keyItem||def.type!==slot)fail();}
    return gear;
  };
  const validateStats=m=>{
    if(!scalarKeys.every(k=>safe(m[k]))||m.level<1||m.level>MAX_LEVEL||!m.maxHp||m.hp>m.maxHp)fail();
  };
  const speed=value=>{
    if(!Number.isSafeInteger(value)||value<1||value>20)fail();
    return value;
  };
  const progression=(level,id='esla')=>{
    if(!Number.isSafeInteger(level)||level<1||level>MAX_LEVEL)fail();
    const p=PERSISTENT_CHARACTER_DEFINITIONS[id]?.progression,n=level-1;
    if(!p)fail();
    return {maxHp:p.hpBase+n*p.hpPerLevel,atk:p.atkBase+n*p.atkPerLevel,
      def:p.defBase+Math.floor(n/p.defEveryLevels),spd:p.spdBase+Math.floor(n/p.spdEveryLevels)};
  };
  const lely=()=>({characterId:'lely',slot:0,name:stats.name,
    ...from(scalarKeys.map(k=>[k,stats[k]])),statuses:statusEffects.slice(),
    equipment:from(slots.map(k=>[k,stats[k]?.name||null])),slitherSpeed:slitherSpd});
  const memberView=(m,slot)=>({...m,slot,name:PERSISTENT_CHARACTER_DEFINITIONS[m.characterId].name});
  const snapshot=()=>copy({members:[lely(),...characters.map((m,i)=>memberView(m,i+1))],
    inventory:stats.items.map(i=>i.name),gold:stats.gold,defeated:[stats,...characters].every(m=>m.hp===0)});
  const idle=()=>{
    if(rewardFailure||battle||combat.active||combat.mode!==null||combatPlayerState.hasParty()||
        combatPlayerState.session.getView()||formationCombatLab.isOpen()||partyCombatLab.isActive()||
        galleryReceiverEncounter.isLocked())fail();
  };
  const validateCharacter=v=>{
    const m=record(v,['characterId',...scalarKeys,'statuses','equipment','slitherSpeed']);
    if(m.characterId==='lely'||!Object.hasOwn(PERSISTENT_CHARACTER_DEFINITIONS,m.characterId))fail();validateStats(m);
    const authored=progression(m.level,m.characterId);
    if(Object.keys(authored).some(k=>m[k]!==authored[k]))fail();
    m.statuses=statusList(m.statuses);m.equipment=equipment(m.equipment);speed(m.slitherSpeed,m.statuses);
    return m;
  };
  const validateReward=v=>{
    const r=record(v,['id','xp','gold','items']);
    if(typeof r.id!=='string'||!r.id.trim()||r.id.length>160||!safe(r.xp)||!safe(r.gold))fail();
    r.items=array(r.items);r.items.forEach(item);return r;
  };
  const payload=()=>copy({order,characters,rewards});
  const validatePayload=v=>{
    const p=record(v,['order','characters','rewards']);
    p.order=array(p.order);p.characters=array(p.characters).map(validateCharacter);p.rewards=array(p.rewards).map(validateReward);
    if(p.order.length<1||p.order.length>3||p.order[0]!=='lely'||new Set(p.order).size!==p.order.length||
        p.characters.length!==p.order.length-1||p.order.some((id,slot)=>
          !Object.hasOwn(PERSISTENT_CHARACTER_DEFINITIONS,id)||PERSISTENT_CHARACTER_DEFINITIONS[id].slot!==slot)||
        p.characters.some((m,i)=>m.characterId!==p.order[i+1])||new Set(p.rewards.map(r=>r.id)).size!==p.rewards.length)fail();
    return p;
  };
  const canonicalValid=()=>{
    for(const key of [...scalarKeys,'gold','items',...slots]) {
      const d=Object.getOwnPropertyDescriptor(stats,key);
      if(!d||!Object.hasOwn(d,'value')||d.writable!==true)fail();
    }
    validateStats(stats);statusList(statusEffects);speed(slitherSpd,statusEffects);
    if(!safe(stats.gold))fail();array(stats.items).forEach(i=>{if(!i||typeof i!=='object'||typeof i.name!=='string')fail();item(i.name);});
    equipment(from(slots.map(k=>[k,stats[k]?.name||null])));
    validatePayload(payload());
  };
  // Includes all canonical resource metadata, not just names/quantities.
  const seal=()=>JSON.stringify({revision,party:payload(),stats,statusEffects,slitherSpd});
  const prepare=()=>{
    canonicalValid();
    const view=snapshot();
    if(view.defeated)fail();
    for(const slot of slots){const gear=stats[slot];if(gear&&JSON.stringify(Object.entries(gear).sort())!==JSON.stringify(Object.entries(item(gear.name)).sort()))fail();}
    for(const gear of stats.items)if(JSON.stringify(Object.entries(gear).sort())!==JSON.stringify(Object.entries(item(gear.name)).sort()))fail();
    const request={members:view.members.map(m=>({characterId:m.characterId,slot:m.slot,name:m.name,
      hp:m.hp,maxHp:m.maxHp,atk:m.atk,def:m.def,spd:m.spd,statuses:m.statuses})),
      inventory:view.inventory.filter(id=>!item(id).keyItem),equipment:view.members.map(m=>m.equipment),escape:'fastest_living'};
    const slither=view.members.filter(m=>m.statuses.includes('slither')).map(m=>({slot:m.slot,speed:m.slitherSpeed}));
    if(slither.length)request.slither=slither;
    return copy(request);
  };
  const writeMember=(member,data)=>{
    member.hp=data.hp;
    if(member===stats){statusEffects=data.statuses;slitherSpd=data.slitherSpeed;for(const k of slots)stats[k]=data.equipment[k]===null?null:{...item(data.equipment[k])};}
    else {member.statuses=data.statuses;member.slitherSpeed=data.slitherSpeed;member.equipment=data.equipment;}
  };
  const encounterRequest=policy=>{
    const request=prepare(),p=record(policy,['escape']);
    if(!['blocked','fastest_living'].includes(p.escape))fail();
    return copy({...request,escape:p.escape,resonance:order.map((characterId,slot)=>({characterId,slot}))});
  };
  // Field views adapt the same persistent members. Only IDs/cursors belong to
  // the menu; canonical item exchanges and HP/status writes stay in this closure.
  const fieldMember = m => {
    const equipped={...m,...from(slots.map(k=>[k,m.equipment[k]===null?null:item(m.equipment[k])]))};
    const effective={atk:effectiveAtk(equipped),def:effectiveDef(equipped,m.statuses,0),
      spd:effectiveSpd(equipped,m.statuses,m.slitherSpeed)};
    if(!Object.values(effective).every(safe))fail();
    return {...m,effective};
  };
  const fieldTargets = id => {
    const def=item(id),members=snapshot().members;
    if(def.keyItem||def.battleOnly)return [];
    if(slots.includes(def.type))return members.map(m=>m.characterId);
    if(isStatusCureItem(def))return members.map(m=>m.characterId);
    if(def.type==='potion')return members.filter(m=>m.hp>0).map(m=>m.characterId);
    return [];
  };
  return Object.freeze({
    getFieldView(){if(arguments.length)fail();const v=snapshot();return copy({...v,members:v.members.map(fieldMember)});},
    fieldItemTargets(id){if(arguments.length!==1)fail();return copy(fieldTargets(id));},
    previewEquipment(characterId,itemId){
      if(arguments.length!==2)fail();const m=snapshot().members.find(m=>m.characterId===characterId),def=item(itemId);
      if(!m||def.keyItem||def.battleOnly||!slots.includes(def.type))fail();
      return copy(fieldMember({...m,equipment:{...m.equipment,[def.type]:itemId}}));
    },
    useFieldItem(characterId,itemId){
      if(arguments.length!==2)fail();idle();canonicalValid();
      if(dialogue.open||choice.open||shop.open||seraLioraCutscene.active||fishing.active||
          continentMap.open||accordPanel.open)fail();
      const def=item(itemId),index=stats.items.findIndex(i=>i.name===itemId),slot=order.indexOf(characterId);
      if(index<0||slot<0||!fieldTargets(itemId).includes(characterId))fail();
      const m=snapshot().members[slot],inventory=stats.items.slice();
      const next={hp:m.hp,statuses:m.statuses.slice(),equipment:{...m.equipment},slitherSpeed:m.slitherSpeed};
      if(slots.includes(def.type)){
        next.equipment[def.type]=itemId;fieldMember({...m,equipment:next.equipment});
        if(m.equipment[def.type]!==null)inventory.push(slot===0?stats[def.type]:createItem(m.equipment[def.type]));
      }else if(isStatusCureItem(def)){
        // Preserve the field cure contract: no matching status still consumes.
        const cured=itemCuredStatuses(def);next.statuses=next.statuses.filter(s=>!cured.includes(s));
        if(cured.includes('slither'))next.slitherSpeed=1;
      }else{
        const amount=healingItemAmount(def,m.hp,m.maxHp);
        if(!safe(amount)||!safe(m.hp+amount))fail();next.hp+=amount;
        // Field Ember Root historically heals only; its battle-only side effect
        // is not imported into the field menu.
      }
      const result=copy(fieldMember({...m,...next}));
      const equippedInstance=inventory[index];inventory.splice(index,1);
      // All rejection precedes mutation. Only the intended fields change; a
      // potion must not replace unrelated equipped objects or status containers.
      const owner=slot===0?stats:characters[slot-1];
      if(slots.includes(def.type)){
        if(slot===0)stats[def.type]=equippedInstance;
        else owner.equipment=next.equipment;
      }else if(isStatusCureItem(def)){
        if(slot===0){statusEffects=next.statuses;slitherSpd=next.slitherSpeed;}
        else{owner.statuses=next.statuses;owner.slitherSpeed=next.slitherSpeed;}
      }else owner.hp=next.hp;
      stats.items=inventory;revision++;
      return result;
    },
    getView(){if(arguments.length)fail();return snapshot();},
    getMember(id){if(arguments.length!==1||typeof id!=='string')fail();return snapshot().members.find(m=>m.characterId===id)||null;},
    joinEsla(options){
      if(arguments.length>1)fail();
      const level=arguments.length?record(options,['level']).level:stats.level;
      const base=progression(level);
      idle();canonicalValid();
      if(order.includes('esla'))return snapshot();
      if(order.length!==1)fail();
      characters=[{characterId:'esla',level,xp:XP_THRESHOLDS[level-1],hp:base.maxHp,...base,statuses:[],
        equipment:from(slots.map(k=>[k,null])),slitherSpeed:1}];order=['lely','esla'];revision++;
      return snapshot();
    },
    resetForNewGame(){if(arguments.length)fail();idle();order=['lely'];characters=[];rewards=[];revision++;return snapshot();},
    awardExperience(id,xp){if(arguments.length!==2)fail();return this.awardRewards({id,xp,gold:0,items:[]});},
    awardRewards(value){
      if(arguments.length!==1)fail();idle();canonicalValid();const r=validateReward(value),previous=rewards.find(x=>x.id===r.id);
      if(previous){if(JSON.stringify(previous)!==JSON.stringify(r))fail();return copy({applied:false,members:[]});}
      if(!safe(stats.gold+r.gold)||!safe(stats.items.length+r.items.length))fail();
      const before=snapshot(),next=characters.map(m=>({...m,statuses:m.statuses.slice(),equipment:{...m.equipment}}));
      for(const m of [stats,...next]){
        if(!safe(m.xp+r.xp)||!safe(m.maxHp+MAX_LEVEL*10)||!safe(m.hp+MAX_LEVEL*10)||
            !safe(m.atk+MAX_LEVEL*3)||!safe(m.def+MAX_LEVEL*3)||!safe(m.spd+MAX_LEVEL))fail();
      }
      for(const m of next){m.xp+=r.xp;while(m.level<MAX_LEVEL&&m.xp>=XP_THRESHOLDS[m.level]){
        const hp=m.hp,oldMax=m.maxHp;m.level++;Object.assign(m,progression(m.level,m.characterId));m.hp=hp===0?0:Math.min(m.maxHp,hp+m.maxHp-oldMax);
      }}
      // The original Lely level-up authority keeps its exact three-roll growth.
      // All input/overflow rejection occurs above. No presentation is queued.
      const knockedOut=stats.hp===0;
      // A failed host RNG must not make an uncertain reward retryable.
      // Retain evidence and the original authority's partial changes; no rollback.
      try { stats.xp+=r.xp;checkLevelUp([]);if(knockedOut)stats.hp=0; }
      catch(error){rewardFailure=copy({id:r.id,stage:'lely_level_up'});throw error;}
      characters=next;stats.gold+=r.gold;stats.items.push(...r.items.map(id=>({...item(id)})));rewards.push(r);revision++;
      const after=snapshot();return copy({applied:true,members:after.members.map((m,i)=>({characterId:m.characterId,before:before.members[i],after:m}))});
    },
    recover(){
      if(arguments.length)fail();idle();canonicalValid();
      const removable=['poison','muddied','slither','cursed','burn','dazzled'];
      for(const m of [stats,...characters]){m.hp=m.maxHp;if(m!==stats){m.statuses=m.statuses.filter(s=>!removable.includes(s));m.slitherSpeed=1;}}
      statusEffects=statusEffects.filter(s=>!removable.includes(s));slitherSpd=1;revision++;return snapshot();
    },
    combatSnapshot(){if(arguments.length)fail();idle();return prepare();},
    prepareCombat(policy){
      if(arguments.length!==1)fail();idle();return bridge.preparePlayer(encounterRequest(policy));
    },
    validateCombat(enemyIds,policy){
      if(arguments.length!==2)fail();idle();return bridge.begin(encounterRequest(policy),array(enemyIds),true);
    },
    beginCombat(enemyIds,policy){
      if(arguments.length<1||arguments.length>2)fail();idle();let request=prepare();const before=seal();
      if(policy!==undefined){
        request=encounterRequest(policy);
      }
      const ids=array(enemyIds),ticket=bridge.begin(request,ids);
      battle={ticket,before,memberIds:combatPlayerState.getView().members.map(m=>m.instanceId)};
      return combatPlayerState.session.getView();
    },
    commitCombat(){
      if(arguments.length||!battle)fail();
      canonicalValid();if(seal()!==battle.before)fail();
      const result=bridge.completed(battle.ticket),end=result.snapshot;
      if(end.party.length!==order.length||end.party.some((m,i)=>m.characterId!==order[i]||m.slot!==i||m.instanceId!==battle.memberIds[i]))fail();
      const updates=end.party.map((m,i)=>{
        const gear=end.equipment[i],effect=end.effects[i];
        if(gear.actorId!==m.instanceId||effect.actorId!==m.instanceId)fail();
        const hp=result.outcome==='victory'&&m.hp===0?1:m.hp;
        return {hp,statuses:statusList(m.statuses).filter(s=>!['burn','dazzled'].includes(s)),
          equipment:equipment(from(slots.map(k=>[k,gear[k]]))),slitherSpeed:effect.slither?.speed||1};
      });
      const remaining=array(end.inventory);remaining.forEach(item);
      // Keep unselectable quest items, including their exact canonical objects.
      let cursor=0;const inventory=[];
      for(const old of stats.items){if(old.keyItem)inventory.push(old);else if(cursor<remaining.length)inventory.push({...item(remaining[cursor++])});}
      while(cursor<remaining.length)inventory.push({...item(remaining[cursor++])});
      const receipt=copy({outcome:result.outcome,completedRounds:result.completedRounds,
        members:updates.map((m,i)=>({characterId:order[i],...m})),inventory:inventory.map(i=>i.name)});
      // No supplied result is trusted: the private owner verifies the exact
      // session, membership, acknowledged reel and live final snapshot again.
      bridge.finish(battle.ticket);
      updates.forEach((m,i)=>writeMember(i===0?stats:characters[i-1],m));stats.items=inventory;
      battle=null;revision++;return receipt;
    },
    isCombatPending(){return battle!==null;},
    getCombatDiagnostic(){return rewardFailure|| (battle?copy({pending:true,round:combatPlayerState.getRoundView()}):null);},
    serialize(){if(arguments.length||battle||rewardFailure)fail();return payload();},
    prepareLoad(value,lelyState,lelyStatuses,sampledSpeed){
      if(arguments.length!==4||battle)fail();
      const p=validatePayload(value);
      // Candidate validation precedes all existing load writers, even flag mirrors.
      lelyState=record(lelyState,[...scalarKeys,'gold',...slots,'items']);
      copy(lelyState); // Reject nested getters/callbacks/prototypes before any writer.
      validateStats(lelyState);if(!safe(lelyState.gold))fail();statusList(lelyStatuses);speed(sampledSpeed,lelyStatuses);
      array(lelyState.items).forEach(i=>{if(!i||typeof i!=='object'||typeof i.name!=='string')fail();});
      for(const slot of slots)if(lelyState[slot]!==null){
        const saved=lelyState[slot];if(!saved||typeof saved.name!=='string')fail();
        const definition=item(saved.name);
        if(savedEquipmentDisposition(definition)==='equipped'&&definition.type!==slot)fail();
      }
      const token=Object.freeze({});loads.set(token,{p,sampledSpeed,revision});return token;
    },
    commitLoad(token){
      const data=loads.get(token);if(!data||battle||data.revision!==revision)fail();loads.delete(token);
      order=data.p.order;characters=data.p.characters;rewards=data.p.rewards;rewardFailure=null;slitherSpd=data.sampledSpeed;revision++;
    },
  });
})();
