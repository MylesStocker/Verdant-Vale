'use strict';

// Isolated developer-Lab lifecycle. The standard combatPlayerState session owns
// every command, item, target, reservation and playback choice. This adapter
// owns only scenario selection and temporary Lab entry/cleanup.
const PARTY_COMBAT_LAB_ESLA_PROFILE = Object.freeze({
  characterId:'esla_lab', name:'Esla', hp:50, maxHp:50, atk:10, def:4, spd:8,
});

// Explicit authored capability bindings; temporary Lab actors remain detached.
const PARTY_COMBAT_LAB_RESONANCE = Object.freeze([
  Object.freeze({slot:0,characterId:'lely'}),Object.freeze({slot:1,characterId:'esla'}),
]);

const PARTY_COMBAT_LAB_INVENTORY = Object.freeze([
  'Potion','Potion','Potion','Elixir','Elixir','Reed Remedy','Reed Remedy',
  'Amethyst Dust','Amethyst Dust','Bullet Time','Bullet Time','Throwing Knife',
  'Throwing Knife','Sapper Charge','Bomb','Bomb','Void Shard','Bait','Iron Sword','Iron Shield',
]);

const PARTY_COMBAT_LAB_SCENARIOS = Object.freeze([
  {id:'lely_esla_one',label:'Lely and Esla — one enemy',enemyIds:['enemy_marsh_wisp']},
  {id:'lely_esla_two',label:'Lely and Esla — two enemies',enemyIds:['enemy_marsh_wisp','enemy_briar_hound']},
  {id:'lely_esla_three',label:'Lely and Esla — three enemies',enemyIds:['enemy_reed_grappler','enemy_silt_lurker','enemy_sluice_slime']},
  {id:'command_showcase',label:'Command and status showcase',enemyIds:['enemy_reed_grappler','enemy_reed_grappler'],showcase:true},
  {id:'boss_escape_lock',label:'Boss escape lock',enemyIds:['enemy_mulholland'],escape:'fastest_living'},
].map(s=>Object.freeze({id:s.id,label:s.label,enemyIds:Object.freeze(s.enemyIds),
  showcase:s.showcase===true,escape:s.escape||'fastest_living'})));

const partyCombatLab = (() => {
  let lab=null;
  let submenu=null;
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
    const descriptor=Object.getOwnPropertyDescriptor(ENEMY_TEMPLATE_REGISTRY,id),template=descriptor?.value;
    if(!canonicalEnemyIsCompatible(template))fail('Party Combat Lab scenario uses unsupported enemy capabilities');
    if(!descriptor || !Object.hasOwn(descriptor,'value') || !template ||
        Object.getPrototypeOf(template)!==Object.getPrototypeOf({}))fail('Party Combat Lab scenario has invalid enemy data');
    const fields=Object.getOwnPropertyDescriptors(template),keys=[...FORMATION_STATE_DATA_FIELDS];
    if(Object.hasOwn(template,'isBoss'))keys.push('isBoss');
    if(Reflect.ownKeys(fields).length!==keys.length || keys.some(key=>!fields[key]||!Object.hasOwn(fields[key],'value')) ||
        !formationBasicStatsValid(template) || typeof template.name!=='string' || template.id!==id ||
        ['xp','goldMin','goldMax'].some(key=>!Number.isSafeInteger(template[key])||template[key]<0) ||
        (Object.hasOwn(template,'isBoss')&&typeof template.isBoss!=='boolean'))
      fail('Party Combat Lab scenario has invalid enemy data');
    return Object.fromEntries(keys.map(key=>[key,fields[key].value]));
  });
  const partyData=scenario=>{
    validateFormationPlayerBasicState(false);
    if(statusEffects.length || !['weapon','armor','shield','accessory'].every(slot=>ordinaryGear(stats[slot])) ||
        typeof stats.name!=='string' || !stats.name.trim())fail('Party Combat Lab requires ordinary supported Lely state');
    const lely={characterId:'lely_lab',slot:0,name:stats.name,
      hp:scenario.showcase?Math.max(1,Math.floor(stats.maxHp*0.55)):stats.hp,maxHp:stats.maxHp,
      atk:effectiveAtk(),def:effectiveDef(),spd:effectiveSpd(),statuses:scenario.showcase?['cursed']:[]};
    const esla={...PARTY_COMBAT_LAB_ESLA_PROFILE,slot:1,
      hp:scenario.showcase?30:PARTY_COMBAT_LAB_ESLA_PROFILE.hp,statuses:scenario.showcase?['slither']:[]};
    return [lely,esla];
  };
  const preflight=(scenario,fromSubmenu=false)=>{
    if(canonicalPartyCombat.isActive())fail('Canonical encounter owns combat');
    if(lab || !scenario || combatPlayerState.hasParty() || combat.active || combat.mode!==null ||
        !Object.isFrozen(combat.enemies) || combat.enemies.length ||
        formationCombatLab.isOpen() || galleryReceiverEncounter.isLocked() ||
        (fromSubmenu ? (!submenu || !debugMenu.open) : (submenu || debugMenu.open)) ||
        regionalInvariantErrors().length)fail();
    validateInactiveCombatPreparation();
    if(completedSingleVictoryReceipt!==null)fail();
    const combatFields=Object.getOwnPropertyDescriptors(combat);
    if(Object.entries(FORMATION_NEUTRAL_COMBAT_STATE).some(([key,value])=>combatFields[key]?.value!==value) ||
        !Array.isArray(combat.messageQueue) || combat.messageQueue.length)fail();
    const party=partyData(scenario),enemies=enemyData(scenario);
    party.forEach((member,slot)=>resonanceCapabilityBinding(member,PARTY_COMBAT_LAB_RESONANCE[slot],slot));
    if(scenario.enemyIds.length>1)validateFormationDescriptors(
      scenario.enemyIds.map((enemyId,slot)=>({enemyId,slot})));
    for(const ally of party)for(const enemy of enemies) {
      if(!attackNumbersAreSafe(ally.atk,enemy.def) ||
          !attackNumbersAreSafe(enemy.atk,playerIncomingMitigation(enemy.atk,ally.def,false)))fail();
    }
    partyInitiativeWeights([...party,...enemies]);
    for(const itemId of PARTY_COMBAT_LAB_INVENTORY)formationItemDefinition(itemId);
    return {party,enemies};
  };
  const sessionView=()=>combatPlayerState.session.getView();
  const buildView=()=>{
    if(!lab)return copy({active:false,scenarioId:lastScenarioId,label:null,party:[],enemies:[],phase:null,
      nextActorId:null,allyActions:[],enemyActions:[],commands:[],selectedCommand:null,selectedTargetInstanceId:null,
      validTargetIds:[],items:[],playbackFrame:null,terminalOutcome:null,error:lastError});
    const session=sessionView();
    if(!session || session.commandSet!=='standard')fail('Party Combat Lab lost its standard session');
    return copy({...session,active:true,scenarioId:lab.scenario.id,label:lab.scenario.label,
      party:session.party.map(member=>({...member,
        profile:member.characterId==='lely_lab'?'canonical_snapshot':'lab_provisional'})),error:lastError});
  };
  const restoreSubmenu=()=>{
    if(!submenu)return;
    debugMenu.open=true;debugMenu.cursor=submenu.debugCursor;reconcileFormationLabKeys();
  };
  const cleanup=error=>{
    const scenarioId=lab?.scenario.id||lastScenarioId;
    if(error)lastError=String(error?.message||error).slice(0,160);
    if(combatPlayerState.hasParty())combatPlayerState.clear();
    if(combat.mode!==null)combat.enemy=null;
    lab=null;lastScenarioId=scenarioId;
  };
  const abort=error=>{
    cleanup(error);restoreSubmenu();
    console.error('[Party Combat Lab] Emergency abort:',error);
  };
  const operate=(allowed,operation)=>{
    if(!lab)return false;
    let session;
    try {session=sessionView();} catch(error) {abort(error);return false;}
    if(!session || !allowed.includes(session.phase))return false;
    try {operation();return buildView();}
    catch(error) {abort(error);return false;}
  };
  const beginScenario=(scenario,fromSubmenu)=>{
    let prepared;
    try {prepared=preflight(scenario,fromSubmenu);} catch(error) {
      lastError=String(error?.message||error).slice(0,160);return false;
    }
    lastError='';lastScenarioId=scenario.id;
    if(fromSubmenu)debugMenu.open=false;
    try {
      if(scenario.enemyIds.length===1)combat.enemy=prepared.enemies[0];
      else initializeFormationState(scenario.enemyIds.map((enemyId,slot)=>({enemyId,slot})),{escape:scenario.escape});
      const request={members:prepared.party,inventory:[...PARTY_COMBAT_LAB_INVENTORY],escape:scenario.escape,
        resonance:PARTY_COMBAT_LAB_RESONANCE.map(c=>({...c}))};
      if(scenario.showcase)request.slither=[{slot:1,speed:PARTY_COMBAT_LAB_ESLA_PROFILE.spd}];
      combatPlayerState.initializeCommandParty(request);
      combatPlayerState.session.begin({commandSet:'standard'});
      lab={scenario};
      reconcileFormationLabKeys();
      return buildView();
    } catch(error) {abort(error);return false;}
  };
  const forward=(method,allowed,args=[])=>operate(allowed,()=>combatPlayerState.session[method](...args));
  return Object.freeze({
    isActive() {if(arguments.length)fail();return lab!==null;},
    isMenuOpen() {if(arguments.length)fail();return submenu!==null&&lab===null;},
    listScenarios() {if(arguments.length)fail();return PARTY_COMBAT_LAB_SCENARIOS;},
    getMenuView() {if(arguments.length)fail();return submenu&&lab===null?copy({cursor:submenu.cursor,error:lastError}):null;},
    getView() {if(arguments.length)fail();return buildView();},
    openMenu() {
      if(canonicalPartyCombat.isActive())return false;
      if(arguments.length || submenu || lab || !debugMenu.open || combat.active || combat.mode!==null ||
          combatPlayerState.hasParty() || formationCombatLab.isOpen() || galleryReceiverEncounter.isLocked())return false;
      submenu={cursor:0,debugCursor:debugMenu.cursor};lastError='';reconcileFormationLabKeys();return true;
    },
    moveScenario(direction) {
      if(arguments.length!==1 || !submenu || lab || !['previous','next'].includes(direction))return false;
      submenu.cursor=(submenu.cursor+(direction==='next'?1:PARTY_COMBAT_LAB_SCENARIOS.length-1))%PARTY_COMBAT_LAB_SCENARIOS.length;
      lastError='';return true;
    },
    closeMenu() {
      if(arguments.length || !submenu || lab)return false;
      debugMenu.cursor=submenu.debugCursor;submenu=null;lastError='';reconcileFormationLabKeys();return true;
    },
    startScenario() {if(arguments.length || !submenu || lab)return false;return beginScenario(PARTY_COMBAT_LAB_SCENARIOS[submenu.cursor],true);},
    enter(scenarioId) {if(arguments.length!==1 || typeof scenarioId!=='string')return false;return beginScenario(scenarioById(scenarioId),false);},
    moveCommand(direction) {if(arguments.length!==1)return false;return forward('moveCommand',['awaiting_action'],[direction]);},
    confirmCommand() {if(arguments.length)return false;return forward('confirmCommand',['awaiting_action']);},
    moveTechnique(direction) {if(arguments.length!==1)return false;return forward('moveTechnique',['technique'],[direction]);},
    confirmTechnique() {if(arguments.length)return false;return forward('confirmTechnique',['technique']);},
    cancelTechnique() {if(arguments.length)return false;return forward('cancelTechnique',['technique']);},
    moveItem(direction) {if(arguments.length!==1)return false;return forward('moveItem',['item'],[direction]);},
    confirmItem() {if(arguments.length)return false;return forward('confirmItem',['item']);},
    cancelItem() {if(arguments.length)return false;return forward('cancelItem',['item']);},
    moveTarget(direction) {if(arguments.length!==1)return false;return forward('moveTarget',['targeting'],[direction]);},
    confirmTarget() {if(arguments.length)return false;return forward('confirmTarget',['targeting']);},
    cancelTargeting() {if(arguments.length)return false;return forward('cancelTargeting',['targeting']);},
    submitAttack(request) {if(arguments.length!==1)return false;return forward('submitAttack',['awaiting_action','targeting'],[request]);},
    backtrack() {if(arguments.length)return false;return forward('backtrack',['awaiting_action','item','technique','targeting','ready']);},
    commitRound() {if(arguments.length)return false;return forward('commitRound',['ready']);},
    advancePlayback() {if(arguments.length)return false;return forward('advancePlayback',['playback']);},
    acknowledgePlayback() {if(arguments.length)return false;return forward('acknowledgePlayback',['playback_complete']);},
    exit() {if(arguments.length||!lab)return false;cleanup(null);lastError='';restoreSubmenu();return true;},
    emergencyAbort(message) {
      if(arguments.length>1 || !lab || (message!==undefined&&typeof message!=='string'))return false;
      cleanup(message||'Party Combat Lab aborted safely.');restoreSubmenu();return true;
    },
    resetForStoryCheckpoint() {lab=null;submenu=null;lastError='';lastScenarioId=null;return true;},
  });
})();
