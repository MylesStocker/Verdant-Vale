'use strict';

// Headless lifecycle adapter only. It has no debug-menu, input, rendering,
// encounter, quest or save caller. A later visible Lab may call this authority.
const PARTY_COMBAT_LAB_ESLA_PROFILE = Object.freeze({
  characterId:'esla_lab', name:'Esla', hp:50, maxHp:50, atk:10, def:4, spd:8,
});

const PARTY_COMBAT_LAB_SCENARIOS = Object.freeze([
  {id:'lely_esla_one',label:'Lely and Esla — one enemy',enemyIds:['enemy_marsh_wisp']},
  {id:'lely_esla_two',label:'Lely and Esla — two enemies',enemyIds:['enemy_marsh_wisp','enemy_briar_hound']},
  {id:'lely_esla_three',label:'Lely and Esla — three enemies',enemyIds:['enemy_reed_grappler','enemy_silt_lurker','enemy_sluice_slime']},
].map(s=>Object.freeze({id:s.id,label:s.label,enemyIds:Object.freeze(s.enemyIds)})));

const partyCombatLab = (() => {
  let lab=null;
  let lastError='';
  let lastScenarioId=null;
  const fail=message=>{throw new Error(message || 'Party Combat Lab entry rejected');};
  const copy=value=>copyFormationData(value);
  const scenarioById=id=>PARTY_COMBAT_LAB_SCENARIOS.find(s=>s.id===id)||null;
  const ordinaryGear=gear=>{
    if(gear===null)return true;
    const fields=Object.getOwnPropertyDescriptors(gear);
    return Reflect.ownKeys(fields).every(key=>typeof key==='string' &&
      ['name','type','bonus','price'].includes(key) && Object.hasOwn(fields[key],'value'));
  };
  const enemyData=scenario=>scenario.enemyIds.map(id=>{
    if(!PARTY_ATTACK_TEMPLATE_IDS.includes(id))fail('Party Combat Lab scenario uses an unsupported enemy');
    const descriptor=Object.getOwnPropertyDescriptor(ENEMY_TEMPLATE_REGISTRY,id);
    const template=descriptor&&descriptor.value;
    if(!descriptor || !Object.hasOwn(descriptor,'value') || !template ||
        Object.getPrototypeOf(template)!==Object.getPrototypeOf({}))fail('Party Combat Lab scenario has invalid enemy data');
    const fields=Object.getOwnPropertyDescriptors(template);
    if(Reflect.ownKeys(fields).length!==FORMATION_STATE_DATA_FIELDS.length ||
        FORMATION_STATE_DATA_FIELDS.some(key=>!fields[key]||!Object.hasOwn(fields[key],'value')) ||
        !formationBasicStatsValid(template) || typeof template.name!=='string' || template.id!==id ||
        ['xp','goldMin','goldMax'].some(key=>!Number.isSafeInteger(template[key])||template[key]<0))
      fail('Party Combat Lab scenario has invalid enemy data');
    return Object.fromEntries(FORMATION_STATE_DATA_FIELDS.map(key=>[key,fields[key].value]));
  });
  const partyData=()=>{
    validateFormationPlayerBasicState(false);
    if(statusEffects.length || !['weapon','armor','shield','accessory'].every(slot=>ordinaryGear(stats[slot])) ||
        typeof stats.name!=='string' || !stats.name.trim())fail('Party Combat Lab requires ordinary supported Lely state');
    const lely={characterId:'lely_lab',slot:0,name:stats.name,hp:stats.hp,maxHp:stats.maxHp,
      atk:effectiveAtk(),def:effectiveDef(),spd:effectiveSpd(),statuses:[]};
    const esla={...PARTY_COMBAT_LAB_ESLA_PROFILE,slot:1,statuses:[]};
    return [lely,esla];
  };
  const preflight=scenario=>{
    if(lab || !scenario || combatPlayerState.hasParty() || combat.active || combat.mode!==null ||
        !Object.isFrozen(combat.enemies) || combat.enemies.length ||
        formationCombatLab.isOpen() || galleryReceiverEncounter.isLocked() || debugMenu.open ||
        regionalInvariantErrors().length)fail();
    validateInactiveCombatPreparation();
    if(completedSingleVictoryReceipt!==null)fail();
    const combatFields=Object.getOwnPropertyDescriptors(combat);
    if(Object.entries(FORMATION_NEUTRAL_COMBAT_STATE).some(([key,value])=>combatFields[key]?.value!==value) ||
        !Array.isArray(combat.messageQueue) || combat.messageQueue.length)fail();
    const party=partyData(),enemies=enemyData(scenario);
    if(scenario.enemyIds.length>1)validateFormationDescriptors(
      scenario.enemyIds.map((enemyId,slot)=>({enemyId,slot})));
    for(const ally of party)for(const enemy of enemies) {
      if(!attackNumbersAreSafe(ally.atk,enemy.def) ||
          !attackNumbersAreSafe(enemy.atk,playerIncomingMitigation(enemy.atk,ally.def,false)))fail();
    }
    partyInitiativeWeights([...party,...enemies]);
    return {party,enemies};
  };
  const sessionView=()=>combatPlayerState.session.getView();
  const buildView=()=>{
    if(!lab)return copy({active:false,scenarioId:lastScenarioId,label:null,party:[],enemies:[],
      phase:null,nextActorId:null,allyActions:[],livingTargetIds:[],playbackFrame:null,
      terminalOutcome:null,error:lastError});
    const session=sessionView();
    if(!session)fail('Party Combat Lab lost its session');
    return copy({active:true,scenarioId:lab.scenario.id,label:lab.scenario.label,
      party:session.party.map(member=>({characterId:member.characterId,instanceId:member.instanceId,
        slot:member.slot,name:member.name,hp:member.hp,maxHp:member.maxHp,
        profile:member.characterId==='lely_lab'?'canonical_snapshot':'lab_provisional'})),
      enemies:session.enemies.map(enemy=>({id:enemy.id,instanceId:enemy.instanceId,slot:enemy.slot,
        name:enemy.name,hp:enemy.hp,maxHp:enemy.maxHp})),phase:session.phase,
      nextActorId:session.nextActorId,allyActions:session.allyActions,
      livingTargetIds:session.enemies.filter(enemy=>enemy.hp>0).map(enemy=>enemy.instanceId),
      playbackFrame:session.playbackFrame,terminalOutcome:session.terminalOutcome,error:lastError});
  };
  const cleanup=error=>{
    const scenarioId=lab?.scenario.id||lastScenarioId;
    if(error)lastError=String(error?.message||error).slice(0,160);
    if(combatPlayerState.hasParty())combatPlayerState.clear();
    if(combat.mode!==null)combat.enemy=null;
    lab=null;lastScenarioId=scenarioId;
  };
  const operate=(allowed,operation)=>{
    if(!lab)return false;
    let session;
    try {session=sessionView();} catch(error) {cleanup(error);return false;}
    if(!session || !allowed.includes(session.phase))return false;
    try {operation(session);return buildView();}
    catch(error) {cleanup(error);return false;}
  };
  const exactAction=(request,session)=>{
    if(!request || typeof request!=='object' || Array.isArray(request) ||
        ![Object.getPrototypeOf({}),null].includes(Object.getPrototypeOf(request)))return null;
    const fields=Object.getOwnPropertyDescriptors(request);
    if(Reflect.ownKeys(fields).length!==2 || !['actorId','targetId'].every(key=>fields[key]&&Object.hasOwn(fields[key],'value')))return null;
    const action={actorId:fields.actorId.value,targetId:fields.targetId.value};
    if(action.actorId!==session.nextActorId || typeof action.targetId!=='string' ||
        !session.enemies.some(enemy=>enemy.hp>0&&enemy.instanceId===action.targetId))return null;
    return action;
  };
  return Object.freeze({
    isActive() {if(arguments.length)fail();return lab!==null;},
    listScenarios() {if(arguments.length)fail();return PARTY_COMBAT_LAB_SCENARIOS;},
    getView() {if(arguments.length)fail();return buildView();},
    enter(scenarioId) {
      if(arguments.length!==1 || typeof scenarioId!=='string')return false;
      const scenario=scenarioById(scenarioId);
      let prepared;
      try {prepared=preflight(scenario);} catch(error) {lastError=String(error?.message||error).slice(0,160);return false;}
      lastError='';lastScenarioId=scenario.id;lab={scenario};
      try {
        if(scenario.enemyIds.length===1)combat.enemy=prepared.enemies[0];
        else initializeFormationState(scenario.enemyIds.map((enemyId,slot)=>({enemyId,slot})));
        combatPlayerState.initialize(prepared.party);
        combatPlayerState.session.begin();
        return buildView();
      } catch(error) {cleanup(error);return false;}
    },
    submitAttack(request) {
      if(arguments.length!==1 || !lab)return false;
      let session;try {session=sessionView();}catch(error){cleanup(error);return false;}
      if(session?.phase!=='collecting')return false;
      const action=exactAction(request,session);if(!action)return false;
      return operate(['collecting'],()=>combatPlayerState.session.submitAttack(action));
    },
    backtrack() {if(arguments.length)return false;return operate(['collecting','ready'],session=>{
      if(!session.allyActions.length)fail('Party Combat Lab has no command to cancel');
      combatPlayerState.session.backtrack();
    });},
    commitRound() {if(arguments.length)return false;return operate(['ready'],()=>combatPlayerState.session.commitRound());},
    advancePlayback() {if(arguments.length)return false;return operate(['playback'],()=>combatPlayerState.session.advancePlayback());},
    acknowledgePlayback() {if(arguments.length)return false;return operate(['playback_complete'],()=>combatPlayerState.session.acknowledgePlayback());},
    exit() {if(arguments.length||!lab)return false;cleanup(null);lastError='';return true;},
    emergencyAbort(message) {
      if(arguments.length>1 || !lab || (message!==undefined&&typeof message!=='string'))return false;
      cleanup(message||'Party Combat Lab aborted safely.');return true;
    },
  });
})();
