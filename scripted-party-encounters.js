'use strict';

// Authenticated story owner for scripted encounters that remain reachable after
// canonical recruitment. Combat mechanics stay in canonicalPartyCombat; this
// authority only validates entry prerequisites and commits encounter outcomes.
const scriptedPartyEncounters=(()=>{
  let issued=new WeakMap();
  const scriptedEnemy=canonicalEnemyRecords.claimScriptedFactory();
  let pending=null;
  const fail=message=>{throw Error('Scripted party encounter: '+message);};
  const origin=()=>JSON.stringify({location:snapshotLocationState(),regional:regionalWorldPosition(),
    mapId:mapIdForRef(activeMap),x:player.x,y:player.y,day,defeatWakeAtHome});
  const definitions=Object.freeze({
    mornay_removal:Object.freeze({formation:id=>[MORNAY_REMOVAL_TEMPLATES[id]],escape:'fastest_living',lifecycle:[]}),
    struck_entry:Object.freeze({formation:id=>STRUCK_ENTRY_BATTLES[id].enemies.map(key=>ENEMY_TEMPLATE_REGISTRY[key]),escape:'fastest_living',lifecycle:[]}),
    pale_sentry:Object.freeze({template:()=>PALE_SENTRY_TEMPLATE,escape:'fastest_living',lifecycle:['persistent_hp_lifecycle']}),
    startWardenCombat:Object.freeze({template:()=>BRIAR_WARDEN_TEMPLATE,escape:'fastest_living',lifecycle:['warden_lifecycle']}),
    startRainfishCombat:Object.freeze({template:()=>RAINFISH_TEMPLATE,escape:'blocked',lifecycle:['rainfish_chain'],chain:true}),
    startBossCombat:Object.freeze({template:()=>BOSS_TEMPLATE,escape:'ignore_boss',lifecycle:['wrongteeth_lifecycle']}),
    startMulhollandCombat:Object.freeze({template:()=>MULHOLLAND_TEMPLATE,escape:'ignore_boss',lifecycle:[]}),
    startDenWraithCombat:Object.freeze({template:()=>DEN_WRAITH_TEMPLATE,escape:'fastest_living',lifecycle:['den_wraith_lifecycle']}),
    startSailorBrawlCombat:Object.freeze({template:()=>SAILOR_BRAWLER_TEMPLATE,escape:'fastest_living',lifecycle:['sailor_brawl_lifecycle']}),
    startTakomoCombat:Object.freeze({template:()=>TAKOMO_TEMPLATE,escape:'ignore_boss',lifecycle:['takomo_lifecycle']}),
    startMimicPotionCombat:Object.freeze({template:()=>MIMIC_POTION_TEMPLATE,escape:'fastest_living',lifecycle:['mimic_trap_lifecycle']}),
    startLenswebSpiderCombat:Object.freeze({template:()=>LENSWEB_SPIDER_TEMPLATE,escape:'observe_gated',lifecycle:['lensweb_objective_lifecycle']}),
    startTrappedDrownedCombat:Object.freeze({template:()=>SUNKEN_GALLERY_ENEMY_TEMPLATES[0],escape:'fastest_living',lifecycle:[]}),
    startMireToadSpawnCombat:Object.freeze({templates:()=>[ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male,
      ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_female],escape:'blocked',lifecycle:[],chain:true}),
    startTravellersRiseAmbush:Object.freeze({formation:()=>[ROAD_IMPOSTOR_TEMPLATE,BRIDLED_HOLLOW_TEMPLATE,
      FEN_HANDLER_TEMPLATE],escape:'fastest_living',lifecycle:['travellers_rise_ambush_lifecycle']}),
  });
  const eligible=(name,remaining)=>{
    if(name==='mornay_removal')return mornayJobs.eligible(remaining);
    if(name==='struck_entry')return struckEntry.eligible(remaining);
    if(name==='pale_sentry')return sentry_quest_started&&!sentry_quest_done&&Number.isSafeInteger(pale_sentry_hp)&&
      pale_sentry_hp>0&&pale_sentry_hp<=PALE_SENTRY_TEMPLATE.maxHp;
    if(name==='startWardenCombat')return warden_quest_started&&!warden_quest_defeated;
    if(name==='startRainfishCombat')return Number.isInteger(remaining)&&remaining>=0&&remaining<=2&&
      sickle_quest_stage===1&&(rainfish_woken||remaining===2||pending?.name===name&&pending.remaining===remaining);
    if(name==='startBossCombat')return !BOSS.defeated&&!BOSS.knockedDown;
    if(name==='startMulhollandCombat')return !MULHOLLAND.defeated;
    if(name==='startDenWraithCombat')return den_wraith_quest_started&&!DEN_WRAITH.defeated&&!den_wraith_defeated;
    if(name==='startSailorBrawlCombat')return sailor_brawl_fight_day!==day&&Number.isSafeInteger(stats.gold)&&stats.gold>=50;
    if(name==='startTakomoCombat')return !TAKOMO.defeated;
    if(name==='startMimicPotionCombat')return !!PICKUP_REGISTRY.pickup_sunken_gallery_mimic&&
      !PICKUP_REGISTRY.pickup_sunken_gallery_mimic.picked;
    if(name==='startLenswebSpiderCombat')return !lighthouse_spider_resolved&&!!getActiveLighthouseObjective();
    if(name==='startTrappedDrownedCombat')return !window.sunken_gallery_drowned_slain&&!window.sunken_gallery_drowned_freed;
    if(name==='startMireToadSpawnCombat')return Number.isInteger(remaining)&&remaining>=0&&remaining<=2&&
      !!PICKUP_REGISTRY.pickup_map3n1_mire_toad_spawn&&!PICKUP_REGISTRY.pickup_map3n1_mire_toad_spawn.picked;
    if(name==='startTravellersRiseAmbush')return remaining===undefined&&MainQuest>=5&&
      persistentParty.getActiveMember('esla')!==null&&!travellers_rise_ambush_complete&&
      mapIdForRef(activeMap)==='EASTERN_FENS_TRAVELLERS_RISE_MAP';
    return false;
  };
  const templatesFor=(name,remaining,select=false)=>{
    const definition=definitions[name];if(!definition)throw Error('Canonical party encounter: unsupported scripted encounter '+name);
    if(!eligible(name,remaining))return null;
    if(definition.formation){const formation=definition.formation(remaining);return formation.length>=1&&formation.length<=3&&formation.every(Boolean)?formation:null;}
    if(definition.templates){
      const candidates=definition.templates();
      if(candidates.length!==2||candidates.some(t=>!t))return null;
      if(!select)return candidates;
      const roll=Math.random();if(!Number.isFinite(roll)||roll<0||roll>=1)fail('invalid Mire Toad selection RNG');
      return [candidates[Math.floor(roll*candidates.length)]];
    }
    return [definition.template()];
  };
  const createToken=(name,remaining,templates,permit=null)=>{
    const definition=definitions[name],token=Object.freeze({});
    const ids=Object.freeze(templates.map(t=>t.id));
    issued.set(token,{name,remaining,ids,lifecycle:definition.lifecycle,escape:definition.escape,
      phase:'prepared',permit,instanceIds:null,origin:origin(),objective:name==='startLenswebSpiderCombat'?getActiveLighthouseObjective():null,
      ui:{dialogueOpen:dialogue.open,dialogueCallbacks:dialogue.callbacks,trigger:dialogue.triggerEncounterId,
        choiceOpen:choice.open,choiceCallbacks:choice.callbacks}});
    return token;
  };
  const request=(templates,escape)=>({enemies:templates,escape});
  const validate=(name,remaining)=>{
    if(name!=='struck_entry'&&name!=='mornay_removal'&&!canonicalPartyCombat.hasMultipleMembers())return scriptedCombatEntry.preflight(name,remaining);
    const candidates=templatesFor(name,remaining,false);if(!candidates)return false;
    const definition=definitions[name],permit=pending&&pending.name===name&&pending.remaining===remaining?pending:null;
    // Mire Toad selection is the sole authored pre-entry selection draw. Both
    // candidates must pass the complete canonical preflight before that draw.
    if(definition.formation){
      const token=createToken(name,remaining,candidates,permit);
      canonicalPartyCombat.validateScripted(request(candidates,definition.escape),token);
      return true;
    }
    for(const template of candidates){
      const token=createToken(name,remaining,[template],permit);
      canonicalPartyCombat.validateScripted(request([template],definition.escape),token);
    }
    return true;
  };
  const start=(name,remaining,activation=null)=>{
    if(name!=='struck_entry'&&name!=='mornay_removal'&&!canonicalPartyCombat.hasMultipleMembers())return false;
    if(!validate(name,remaining))return false;
    const definition=definitions[name],permit=pending&&pending.name===name&&pending.remaining===remaining?pending:null;
    let templates=templatesFor(name,remaining,!!definition.templates);
    if(name==='pale_sentry')templates=[scriptedEnemy(PALE_SENTRY_TEMPLATE,pale_sentry_hp)];
    const token=createToken(name,remaining,templates,permit);
    canonicalPartyCombat.validateScripted(request(templates,definition.escape),token);
    // These are the established activation-time consequences. They occur only
    // after a complete dry preflight and are deliberately not rolled back after
    // an unexpected installation fault.
    if(name==='startSailorBrawlCombat')stats.gold-=50;
    if(name==='startLenswebSpiderCombat')triggerPoison();
    let payment=null;
    if(name==='startTravellersRiseAmbush'){
      if(!activation||typeof activation!=='object'||Array.isArray(activation)||
          Reflect.ownKeys(activation).length!==1||typeof activation.pay!=='boolean')fail('invalid ambush activation');
      if(activation.pay&&!travellers_rise_ambush_paid){
        const amount=Math.min(100,stats.gold);payment={gold:stats.gold,paid:travellers_rise_ambush_paid,
          amount:travellers_rise_ambush_payment};stats.gold-=amount;travellers_rise_ambush_paid=true;
        travellers_rise_ambush_payment=amount;syncQuestFlagsToWindow();
      }
    }
    let result;
    try{result=canonicalPartyCombat.enterScripted(request(templates,definition.escape),token);}
    catch(error){
      if(payment&&!canonicalPartyCombat.isActive()){
        stats.gold=payment.gold;travellers_rise_ambush_paid=payment.paid;
        travellers_rise_ambush_payment=payment.amount;syncQuestFlagsToWindow();
      }
      throw error;
    }
    const record=issued.get(token);record.instanceIds=Object.freeze(result.enemies.map(enemy=>enemy.instanceId));record.phase='active';
    if(permit===pending)pending=null;
    if(name==='startRainfishCombat'&&remaining===2){rainfish_woken=true;syncQuestFlagsToWindow();}
    if(name==='startMimicPotionCombat')PICKUP_REGISTRY.pickup_sunken_gallery_mimic.picked=true;
    return result;
  };
  const show=(name,pages,callback=null)=>{
    dialogue.name=name;dialogue.pages=pages;dialogue.callbacks=callback?[callback]:null;
    dialogue.open=true;dialogue.page=0;
  };
  const chain=(record,pages)=>{
    const next=record.remaining-1,token={name:record.name,remaining:next,origin:record.origin,callback:null};
    pending=token;
    token.callback=scriptedCombatEntry.callback(record.name,()=>{
      if(pending!==token||origin()!==token.origin)fail('stale scripted follow-up');
      return start(record.name,next);
    },next);
    show('',pages,token.callback);
  };
  const finalize=(token,result)=>{
    const record=issued.get(token);if(!record||record.phase!=='active')fail('stale or repeated finalizer');
    if(!result||!['victory','defeat','escape'].includes(result.outcome)||!Array.isArray(result.enemies)||
        result.enemies.length!==record.ids.length||result.enemies.some((enemy,i)=>enemy.id!==record.ids[i]||
          enemy.instanceId!==record.instanceIds[i]))fail('forged outcome');
    // Canonical defeat recovery legitimately moves the party before story
    // finalization. Victory and escape must still finish at their exact origin.
    if(result.outcome!=='defeat'&&record.origin!==origin())fail('encounter origin changed');
    record.phase='complete';
    const victory=result.outcome==='victory';
    if(record.name==='mornay_removal'){
      if(victory){
        if(!mornayJobs.eligible(record.remaining))fail('stale Mornay removal victory');
        if(record.remaining===0)mornay_peat_hunt=2;else mornay_ridge_hunt=2;
        syncQuestFlagsToWindow();
      }
      return true;
    }
    if(record.name==='struck_entry'){
      if(victory){
        if(!struckEntry.eligible(record.remaining))fail('stale Third Lock victory');
        struck_entry_wins|=1<<record.remaining;syncQuestFlagsToWindow();
      }
      return true;
    }
    if(record.name==='pale_sentry'){
      pale_sentry_hp=Math.max(0,result.enemies[0].hp);
      if(victory){sentry_quest_done=true;pale_sentry_hp=0;refreshJobBoard();syncQuestFlagsToWindow();
        show('',[['The creature goes still.','Whatever it was, it is large in death.','The fen road is clear.'],
          ['Constable Tarvec at the Drenwick guard post offered a fee for this.','You should collect it.']]);}
      else syncQuestFlagsToWindow();
      return true;
    }
    if(record.name==='startTravellersRiseAmbush')return travellersRiseAmbush.finalizeAuthenticated(result);
    if(!victory&&!(record.name==='startLenswebSpiderCombat'&&result.outcome==='escape'))return true;
    if(record.name==='startWardenCombat'){warden_quest_defeated=true;refreshJobBoard();return true;}
    if(record.name==='startRainfishCombat'){
      if(record.remaining>0){chain(record,[[record.remaining-1===1?'Another one follows.':'One more.']]);}
      else show('',[['The last rainfish spirals down into the silt.','The water is completely opaque with mud.'],
        ['You can still make out the sickle handle jutting from the reeds.']]);
      return true;
    }
    if(record.name==='startMireToadSpawnCombat'){
      if(record.remaining>0)chain(record,[[record.remaining-1===1
        ?'The first toad sinks into the mud. The spawning bed convulses again.'
        :'The second toad falls. One last shape churns through the reeds.']]);
      else {const site=PICKUP_REGISTRY.pickup_map3n1_mire_toad_spawn;
        if(site&&!site.picked){grantItem('Reed Remedy');site.picked=true;}
        show('',[['The last Mire Toad slumps into the shallow water. The spawning bed is still.'],
          ['Among the torn reeds, a tightly bound twist of medicinal stalks has washed free of the mud.'],['Found: Reed Remedy.']]);}
      return true;
    }
    if(record.name==='startBossCombat'){BOSS.knockedDown=true;show('Wrongteeth',[[
      '…','Wrongteeth has stopped moving.','It is lying on the ground. Its enormous chest is heaving.'],
      ['“please.”','“i am hurt.”'],['“i want my mum.”','“i want my dad.”'],
      ['…','One huge eye. One tiny eye.','Both looking at you.','“can you… can you let me hold you.”']]);return true;}
    if(record.name==='startMulhollandCombat'){MULHOLLAND.defeated=true;show('',[
      ['Mulholland is still.','It did not fall the way things fall.','More like it simply stopped being upright.'],
      ['The passage to the stairs below is open.','There is no ceremony to it.','You step around the body.']]);return true;}
    if(record.name==='startDenWraithCombat'){DEN_WRAITH.defeated=true;den_wraith_defeated=true;syncQuestFlagsToWindow();refreshJobBoard();
      show('',[['The wraith collapses inward.','The room is quiet. Cold, but quiet.'],
        ['Find Morden in the Calwick main square to collect the fee.']]);return true;}
    if(record.name==='startSailorBrawlCombat'){sailor_brawl_fight_day=day;stats.gold+=100;
      show('',[['Kolm goes down hard.','The inn goes quiet for a moment.','Then someone starts laughing.'],
        ['He surfaces from the floor, grinning.','“Fair enough.”','He counts out fifty gold and slaps it on the table. You have the fifty you staked back, too.']]);return true;}
    if(record.name==='startTakomoCombat'){TAKOMO.defeated=true;show('',[
      ['Takomo drops to one knee.','The heat in the chamber breaks — not gone, just… less.','Whatever was feeding it has gone quiet.'],
      ['He stays down.','You stand in the dark for a moment, unsure what to do with that.','Then you leave.']]);return true;}
    if(record.name==='startLenswebSpiderCombat'){
      if(!lighthouse_spider_resolved){const objective=record.objective;
        if(!objective||objective!==getActiveLighthouseObjective())fail('lighthouse objective changed');
        grantItem(objective);lighthouse_spider_resolved=true;syncQuestFlagsToWindow();
        show('',victory?[[ 'The spider shudders and folds its legs beneath it.','It sinks back into the felted web over the dead lens and goes still.'],
          [`The ${objective} is yours, freed from the web at last.`,'The lantern room is quiet again.']]
          :[[`You pull your hand back through the web, the ${objective} closed in your fist.`,
            'The spider retreats back behind the frame of the old lens and refuses to pursue.',
            'It settles over the ruined mechanism and holds there, past the reach of the web.']]);}
      return true;
    }
    if(record.name==='startTrappedDrownedCombat'){window.sunken_gallery_drowned_slain=true;return true;}
    // Mimic victory needs no extra callback: its authenticated guaranteed drop
    // is part of the canonical reward receipt. Activation already sprung it.
    return true;
  };
  return Object.freeze({
    validate,start,finalize,
    startTravellersRise(pay){if(arguments.length!==1||typeof pay!=='boolean')fail('invalid ambush activation');
      return start('startTravellersRiseAmbush',undefined,Object.freeze({pay}));},
    resetForStoryCheckpoint(){pending=null;issued=new WeakMap();return true;},
    authorize(token,ids,lifecycle,escape){
      const record=issued.get(token);return !!record&&record.phase!=='complete'&&escape===record.escape&&
        JSON.stringify(ids)===JSON.stringify(record.ids)&&JSON.stringify(lifecycle)===JSON.stringify(record.lifecycle);
    },
    hasPending(){return pending!==null;},
    permitsPending(token){const record=issued.get(token);return !!pending&&record?.permit===pending;},
    permitsPreparation(token){const record=issued.get(token),ui=record?.ui;return !!record&&record.phase!=='complete'&&!!ui&&
      dialogue.open===ui.dialogueOpen&&dialogue.callbacks===ui.dialogueCallbacks&&dialogue.triggerEncounterId===ui.trigger&&
      choice.open===ui.choiceOpen&&choice.callbacks===ui.choiceCallbacks;},
  });
})();
