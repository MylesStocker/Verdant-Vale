'use strict';

// Developer-only deterministic story fixtures. The registry owns authored
// checkpoint data; this module owns preview, validation and whole-session
// replacement. It never reads or writes localStorage.
const STORY_CHECKPOINT_EQUIPMENT = Object.freeze({
  weapon:'Dragon Blade',armor:'Shadow Cloak',shield:'Mithril Shield',accessory:'Fen Mask',
});
const STORY_CHECKPOINT_INVENTORY = Object.freeze([
  ['Potion',20],['Elixir',10],['Reed Remedy',10],['Amethyst Dust',10],['Bullet Time',5],
  ['Throwing Knife',10],['Bomb',5],['Sapper Charge',5],['Henbane Sprig',5],
  ['Jackbane Vial',5],['Trollbane',5],
].map(entry=>Object.freeze(entry)));

const STORY_CHECKPOINTS = Object.freeze([Object.freeze({
  id:'mq5_assignment_ready',label:'MQ5 — Assignment Ready',level:10,xp:XP_THRESHOLDS[9],
  stats:Object.freeze({maxHp:120,atk:35,def:29,spd:16}),
  equipment:STORY_CHECKPOINT_EQUIPMENT,inventory:STORY_CHECKPOINT_INVENTORY,gold:1000,day:6,
  flags:Object.freeze({
    sluice_job_started:true,sluice_fixed:true,sluice_pay_ticket_ready:false,sluice_reward_given:true,
    equipment_ticket_ready:false,MainQuest:4,
    dispatch_quest_started:true,dispatch_delivered:true,dispatch_pay_ticket_ready:false,dispatch_rewarded:true,
    fort_quest_started:true,fort_quest_stage:6,fort_pay_ticket_ready:false,fort_pay_ticket_reduced:false,
    smugglers_dead:false,smugglers_execution_day:0,fort_report_filed:false,
    mq4_available_day:6,reservoir_quest_started:true,reservoir_report_filed:true,
    upper_reach_seen:true,basin_chamber_seen:true,sunken_gallery_seen:true,basin_chamber_exits:2,
    basin_chamber_dream_done:true,gallery_body_found:true,gallery_deeper_stair_seen:true,
    gallery_receiver_defeated:true,sera_liora_opening_complete:true,
  }),
  location:Object.freeze({mapId:'OFFICE_MAP',x:12*TILE,y:3.25*TILE,facing:'up',
    state:Object.freeze({inTown:true,currentTownId:'calwick',townBuilding:'office'})}),
})]);

const storyCheckpointLab=(()=>{
  let menuState=null,lastError='';
  const fail=message=>{throw Error('Story checkpoint: '+message);};
  const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&
    [Object.prototype,Object.getPrototypeOf({})].includes(Object.getPrototypeOf(value));
  const closed=(value,keys)=>{
    if(!plain(value))fail('expected a plain record');
    const fields=Object.getOwnPropertyDescriptors(value);
    if(Reflect.ownKeys(fields).length!==keys.length||keys.some(key=>!fields[key]||!Object.hasOwn(fields[key],'value')))
      fail('unknown, missing or accessor field');
    return Object.fromEntries(keys.map(key=>[key,fields[key].value]));
  };
  const frozen=value=>{
    if(value&&typeof value==='object'){
      if(!Object.isFrozen(value))fail('checkpoint records must be immutable');
      for(const child of Object.values(value))frozen(child);
    }
  };
  const safe=value=>Number.isSafeInteger(value)&&value>=0;
  const gearSlots=['weapon','armor','shield','accessory'];
  const makeLocation=spec=>{
    const state={};for(const binding of LOCATION_STATE_BINDINGS)state[binding.key]=_neutralValueFor(binding);
    for(const [key,value] of Object.entries(spec.state)){
      if(!LOCATION_STATE_KEY_SET.has(key))fail('unknown location-state field '+key);state[key]=value;
    }
    const locationValidation=validateLocationState(state),placement=validatePlacement(spec);
    if(!locationValidation.ok||!placement.ok)fail('invalid office placement');
    return {state,placement};
  };
  const prepare=definition=>{
    frozen(definition);
    const value=closed(definition,['id','label','level','xp','stats','equipment','inventory','gold','day','flags','location']);
    if(typeof value.id!=='string'||!value.id||typeof value.label!=='string'||!value.label)fail('invalid identity');
    if(!Number.isSafeInteger(value.level)||value.level<1||value.level>MAX_LEVEL||value.xp!==XP_THRESHOLDS[value.level-1]||
        (value.level<MAX_LEVEL&&value.xp>=XP_THRESHOLDS[value.level]))fail('invalid level or XP');
    const growth=closed(value.stats,['maxHp','atk','def','spd']),levels=value.level-1;
    if(growth.maxHp!==30+levels*10||growth.atk<8+levels||growth.atk>8+levels*3||
        growth.def<2+levels||growth.def>2+levels*3||growth.spd<7||growth.spd>7+levels)fail('invalid Lely growth');
    const equipment=closed(value.equipment,gearSlots),shopIds=new Set([...MERCHANT_STOCK,...TRAVELLER_STOCK].map(i=>i.name));
    for(const slot of gearSlots){const item=ITEM_REGISTRY[equipment[slot]];
      if(!item||item.type!==slot||item.keyItem||!shopIds.has(item.name))fail('illegal checkpoint equipment');}
    if(!Array.isArray(value.inventory)||!Object.isFrozen(value.inventory))fail('invalid inventory');
    const inventory=[];for(const entry of value.inventory){
      if(!Array.isArray(entry)||entry.length!==2||!Object.isFrozen(entry))fail('invalid inventory entry');
      const [id,count]=entry,item=ITEM_REGISTRY[id];if(!item||item.keyItem||!safe(count)||count===0)fail('invalid inventory item');
      for(let n=0;n<count;n++)inventory.push(id);
    }
    if(!safe(value.gold)||!safe(value.day)||value.day===0)fail('invalid resources');
    const flags=Object.fromEntries(QUEST_FLAG_BINDINGS.map(binding=>[binding.key,cloneDefaultValue(binding.default)]));
    for(const [key,flag] of Object.entries(value.flags)){
      if(!QUEST_FLAG_SCHEMA.includes(key))fail('unknown quest flag '+key);flags[key]=flag;
    }
    if(flags.MainQuest!==4||flags.sera_liora_opening_complete!==true||flags.gallery_receiver_defeated!==true||
        flags.reservoir_report_filed!==true||flags.gallery_body_found!==true)fail('contradictory MQ5 checkpoint');
    if(lighthouseQuestInvariantErrors(flags).length)fail('invalid lighthouse route');
    const location=closed(value.location,['mapId','x','y','facing','state']);
    if(mapIdForRef(mapRefForId(location.mapId))!==location.mapId)fail('unknown map');
    const proposed=makeLocation(location);
    return Object.freeze({definition,value,growth,equipment,inventory:Object.freeze(inventory),flags,
      location:Object.freeze({...location,state:Object.freeze(proposed.state)})});
  };
  const resetTransient=()=>{
    if(typeof mq5AssignmentCutscene!=='undefined')mq5AssignmentCutscene.reset();
    if(typeof travellersRiseAmbush!=='undefined')travellersRiseAmbush.resetTransient();
    if(typeof travellersRiseCamp!=='undefined')travellersRiseCamp.resetTransient();
    canonicalPartyCombat.resetForStoryCheckpoint();scriptedPartyEncounters.resetForStoryCheckpoint();
    formationCombatLab.resetForStoryCheckpoint();partyCombatLab.resetForStoryCheckpoint();
    galleryReceiverEncounter.resetForStoryCheckpoint();resetCombatForStoryCheckpoint();
    persistentParty.resetForStoryCheckpoint();resetFishingForStoryCheckpoint();
    dialogue.open=false;dialogue.page=0;dialogue.pages=[];dialogue.name='';dialogue.triggerEncounterId=null;
    dialogue.callbacks=null;dialogue.styleId=null;dialogue.presentation='box';dialogue.portraitId=null;dialogue.portraitSide=null;
    dialogue.pageSpeakers=null;dialogue._speakerPagesFor=null;
    choice.open=false;choice.cursor=0;choice.title='';choice.options=[];choice.callbacks=[];
    shop.open=false;shop.screen='main';shop.cursor=0;menu.open=false;menu.screen='main';menu.itemCursor=0;menu.scrollOffset=0;
    menu.saveCursor=0;menu.saveMessage=0;menu.saveBlockedMessage=0;menu.loadCursor=0;menu.loadMessage=0;menu.loadStatus=null;
    menu.notebookOffset=0;menu.notebookCursor=0;partyFieldMenu.reset();
    warpMenu.open=false;warpMenu.mode='list';warpMenu.cursor=0;warpMenu.scrollOffset=0;warpMenu.destinations=[];
    warpMenu.targetDestId=null;warpMenu.targetCol=8;warpMenu.targetRow=7;warpMenu.playerMode=false;continentMap.open=false;
    accordPanel.open=false;accordPanel.page=0;accordPanel.pages=[];accordPanel.title='';accordPanel.theme='imperial';
    Object.assign(seraLioraCutscene,{active:false,phase:'idle',beat:-1,waitFrames:0,revealAlpha:0,
      lioraPose:'sleeping',storyEntry:false,startCount:0,assetLoadToken:0});
    Object.assign(seraLioraGuestRoomWalk,{active:false,inputLocked:true,x:350,y:345,facing:'down',moving:false,
      animationTime:0,animationFrame:1,lioraX:270,lioraY:345,completionCount:0});
    if(typeof _dreamReturn!=='undefined')_dreamReturn=null;
    debugMenu.cursor=0;debugInspector.open=false;debugMode=false;forceLegacyRegionalView=false;defeatWakeAtHome=true;
    resetInputForStoryCheckpoint();resetAllMovers();
  };
  const commit=plan=>{
    resetTransient();
    for(const binding of QUEST_FLAG_BINDINGS)binding.set(plan.flags[binding.key]);syncQuestFlagsToWindow();
    stats.level=plan.value.level;stats.xp=plan.value.xp;stats.maxHp=plan.growth.maxHp;stats.hp=plan.growth.maxHp;
    stats.atk=plan.growth.atk;stats.def=plan.growth.def;stats.spd=plan.growth.spd;stats.gold=plan.value.gold;
    for(const slot of gearSlots)stats[slot]=createItem(plan.equipment[slot]);
    stats.items=plan.inventory.map(createItem);statusEffects=[];slitherSpd=1;
    day=plan.value.day;travellerPresent=false;dilemma_voss=null;
    applyCollectedPickupIds([]);applyOpenedChestIds([]);HOUSE_DATA.player_house.chest.gold=0;
    HOUSE_DATA.drenwick_apt_c1_u4.dresser.looted=false;HOUSE_DATA.drenwick_apt_c1_u4.sparkle.taken=false;
    BOSS.defeated=false;BOSS.knockedDown=false;MULHOLLAND.defeated=false;TAKOMO.defeated=false;DEN_WRAITH.defeated=false;
    sailor_brawl_fight_day=-1;window.mirethyst_rewarded=false;
    window.upper_reach_visit_day=undefined;window.sunken_gallery_visit_day=undefined;
    applyLocationState(plan.location.state);placeAtLocation(plan.location.mapId,plan.location.x,plan.location.y);
    player.facing=plan.location.facing;
    player.step=0;player.moving=false;tick=0;refreshJobBoard();debugMenu.open=false;menuState=null;lastError='';
    showWorldToast('DEV CHECKPOINT LOADED: MQ5 — ASSIGNMENT READY');
    return true;
  };
  const apply=id=>{
    const definition=STORY_CHECKPOINTS.find(entry=>entry.id===id);if(!definition)fail('unknown checkpoint');
    const plan=prepare(definition);return commit(plan);
  };
  return Object.freeze({
    list(){return Object.freeze(STORY_CHECKPOINTS.map(({id,label})=>Object.freeze({id,label})));},
    isOpen(){return menuState!==null;},
    getView(){return menuState&&Object.freeze({phase:menuState.phase,cursor:menuState.cursor,
      confirmCursor:menuState.confirmCursor,checkpoints:this.list(),choices:Object.freeze(['Apply','Cancel']),error:lastError});},
    validateDefinition(definition){prepare(definition);return true;},
    apply,
    open(){if(menuState||!debugMenu.open||combat.active||canonicalPartyCombat.isActive())return false;
      menuState={phase:'list',cursor:0,confirmCursor:0,debugCursor:debugMenu.cursor};lastError='';return true;},
    handleInput(command,key){if(!menuState)return false;
      if(menuState.phase==='list'){
        if(command==='confirm'){menuState.phase='confirm';menuState.confirmCursor=0;return true;}
        if(command==='cancel'||key==='`'){debugMenu.cursor=menuState.debugCursor;menuState=null;lastError='';return true;}
        return false;
      }
      if(['left','right','up','down'].includes(command)){menuState.confirmCursor=menuState.confirmCursor?0:1;return true;}
      if(command==='cancel'||key==='`'){menuState.phase='list';menuState.confirmCursor=0;return true;}
      if(command==='confirm'){
        if(menuState.confirmCursor===1){menuState.phase='list';menuState.confirmCursor=0;return true;}
        try{return apply(STORY_CHECKPOINTS[menuState.cursor].id);}catch(error){lastError=String(error.message||error).slice(0,120);return false;}
      }
      return false;
    },
  });
})();
