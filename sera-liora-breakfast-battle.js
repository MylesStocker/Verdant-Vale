'use strict';

const SERA_LIORA_CHAPTER_CARD_SECONDS = 3;

// Scene ownership only. Every action, resource, initiative draw and historical
// frame belongs to storyBattle and the ordinary party command engine.
const seraLioraBreakfastBattle=(()=>{
  let state=null;
  const ownsScene=()=>!!state&&state.epoch===seraLioraBreakfast.epoch&&
    seraLioraCutscene.active&&activeMap===BETHANY_GUEST_ROOM_MAP&&
    ['breakfast_battle_fade','breakfast_battle','breakfast_retry','breakfast_aftermath',
      'breakfast_storeroom_assets','breakfast_storeroom_intro','breakfast_storeroom_aftermath',
      'breakfast_ending_return','breakfast_ending_arrival','breakfast_ending_dialogue','breakfast_ending_promise',
      'breakfast_ending_promise_hold','breakfast_ending_departure','breakfast_ending_chapter','breakfast_ending_complete'].includes(seraLioraCutscene.phase);
  const bridge=storyBattle.claimSceneBridge(ownsScene);
  const current=s=>state===s&&s.epoch===seraLioraBreakfast.epoch&&seraLioraCutscene.active;
  const clearInput=()=>clearSeraLioraMovementKeys();
  const storeroomAssetsReady=()=>IMAGE_ASSET_BUNDLES.sera_liora_storeroom.every(id=>!!loadedImageAsset(id));
  const fault=error=>{
    if(state){state.stage='fault';state.failure=String(error?.message||error).slice(0,180);}
    console.error('[Breakfast battle]',error);
  };
  const enterStoreroom=()=>{
    const s=state;if(!current(s)||s.stage!=='aftermath'||s.fight!==1)return;
    s.stage='assets';seraLioraCutscene.phase='breakfast_storeroom_assets';
    const ready=()=>{
      if(!current(s)||s.stage!=='assets')return;
      if(!storeroomAssetsReady()){fault(Error('Storeroom assets unavailable'));return;}
      s.scene='storeroom';s.stage='intro';
      setBreakfastActor('sera',{x:160,y:350,facing:'up',moving:false,animationTime:0,animationFrame:1});
      setBreakfastActor('liora',{x:365,y:350,facing:'up',moving:false,animationTime:0,animationFrame:1});
      setBreakfastActor('keeper',{x:65,y:275,facing:'right',moving:false,animationTime:0,animationFrame:1});
      openBreakfastPages([
        {speakerId:null,lines:['A larger Buzzy Beetle is wedged between the flour bins.']},
        {speakerId:'bethany_keeper',lines:['Careful, please. The breakfast supplies are right behind it.']},
        {speakerId:'sera',lines:['Eclipse? Together, before it knocks anything else over.']},
        {speakerId:'liora',lines:['All right. Let’s be careful.']},
      ],'breakfast_storeroom_intro',()=>{
        if(!current(s)||s.stage!=='intro')return;
        s.fight=2;s.attempt=0;s.retryPending=false;s.stage='fade_in';
        seraLioraBreakfast.fade=0;seraLioraCutscene.phase='breakfast_battle_fade';
      });
    };
    const loading=preloadImageAssetBundle('sera_liora_storeroom');
    if(storeroomAssetsReady())ready();
    else loading.then(ready,()=>{if(current(s)&&s.stage==='assets')fault(Error('Storeroom assets unavailable'));});
  };
  const beginPromise=s=>{
    if(!current(s)||s.stage!=='ending_dialogue')return;
    s.stage='promise';
    setBreakfastActor('sera',{x:128});
    setBreakfastActor('liora',{x:186});
    openBreakfastPages([
      {speakerId:'liora',lines:['Whatever comes after this trip… we’ll still do things together, won’t we?']},
      {speakerId:'sera',lines:['Of course we will. Together, as always. Pinky promise?']},
      {speakerId:null,lines:['Sera holds out a little finger. Liora hooks hers around it.']},
      {speakerId:'liora',lines:['Pinky promise.']},
      {speakerId:'sera',lines:['Together, as always.']},
    ],'breakfast_ending_promise',()=>{
      if(!current(s)||s.stage!=='promise')return;
      setBreakfastActor('sera',{x:110});
      setBreakfastActor('liora',{x:200});
      s.stage='promise_hold';s.endingElapsed=0;seraLioraCutscene.phase='breakfast_ending_promise_hold';clearInput();
    });
  };
  const beginEndingDialogue=s=>{
    if(!current(s)||s.stage!=='ending_fade_in')return;
    s.stage='ending_dialogue';
    openBreakfastPages([
      {speakerId:'bethany_server',lines:['Bread, fruit and tea. It isn’t quite the breakfast we meant to serve.']},
      {speakerId:'sera',lines:['It’s breakfast. That will do nicely. Thank you.']},
      {speakerId:'liora',lines:['Can we have a quiet morning now?']},
      {speakerId:'sera',lines:['A slow walk through Bethany. No appointments.']},
      {speakerId:'liora',lines:['Up through the gardens? We can see where the little stairs go.']},
      {speakerId:'sera',lines:['Provided they bring us back before Skybloom.']},
      {speakerId:'liora',lines:['They will. I want to see the starflowers open from the upper terraces.']},
      {speakerId:'sera',lines:['Then we’ll be back in good time. We leave tomorrow; today can be ours.']},
      {speakerId:'liora',lines:['I like that.']},
    ],'breakfast_ending_dialogue',()=>beginPromise(s));
  };
  const updateEnding=(s,dt)=>{
    if(s.stage==='ending_fade_out'){
      seraLioraBreakfast.fade=Math.min(1,seraLioraBreakfast.fade+dt/SERA_LIORA_BREAKFAST.fadeSeconds);
      if(seraLioraBreakfast.fade===1){
        if(!seraLioraBreakfastAssetsReady())throw Error('Breakfast return assets unavailable');
        s.scene='terrace';s.stage='ending_fade_in';seraLioraCutscene.phase='breakfast_ending_arrival';
        setBreakfastActor('sera',{x:110,y:270,facing:'right',moving:false,animationTime:0,animationFrame:1});
        setBreakfastActor('liora',{x:200,y:270,facing:'left',moving:false,animationTime:0,animationFrame:1});
      }
    }else if(s.stage==='ending_fade_in'){
      seraLioraBreakfast.fade=Math.max(0,seraLioraBreakfast.fade-dt/SERA_LIORA_BREAKFAST.fadeSeconds);
      if(seraLioraBreakfast.fade===0)beginEndingDialogue(s);
    }else if(s.stage==='promise_hold'){
      s.endingElapsed=Math.min(2,s.endingElapsed+dt);
      if(s.endingElapsed>=2-1e-9){
        s.stage='ending_departure_fade';seraLioraBreakfast.fade=0;seraLioraCutscene.phase='breakfast_ending_departure';
      }
    }else if(s.stage==='ending_departure_fade'){
      seraLioraBreakfast.fade=Math.min(1,seraLioraBreakfast.fade+dt/SERA_LIORA_BREAKFAST.fadeSeconds);
      if(seraLioraBreakfast.fade===1){
        s.stage='chapter_card';s.endingElapsed=0;
        seraLioraCutscene.phase='breakfast_ending_chapter';clearInput();
      }
    }else if(s.stage==='chapter_card'){
      s.endingElapsed=Math.min(SERA_LIORA_CHAPTER_CARD_SECONDS,s.endingElapsed+dt);
      if(s.endingElapsed>=SERA_LIORA_CHAPTER_CARD_SECONDS-1e-9){
        s.stage='completing';seraLioraCutscene.phase='breakfast_ending_complete';
        if(!endSeraLioraCutawayAtHospital())throw Error('Breakfast completion rejected');
        return; // hospital cleanup owns every subsequent state write
      }
    }
  };
  const beginAttempt=()=>{
    const s=state;if(!current(s))return false;
    s.stage='battle';seraLioraCutscene.phase='breakfast_battle';
    seraLioraBreakfast.fade=0;clearInput();
    try{
      if(!s.token)s.token=bridge.createContext({id:'bethany_breakfast',party:SERA_LIORA_OPENING_PROFILES,
        inventory:SERA_LIORA_OPENING_INVENTORY,resonance:SERA_LIORA_OPENING_RESONANCE});
      if(s.retryPending){
        if(!storyBattle.retry(s.token))throw Error('Current fight cannot retry');
        s.retryPending=false;s.attempt++;return true;
      }
      const fight=s.fight;
      const outcome=receipt=>{
        if(!current(s)||s.fight!==fight||s.stage!=='battle'||receipt.battleId<=s.lastCommitted)return;
        s.lastCommitted=receipt.battleId;
        clearInput();
        if(receipt.outcome==='victory'){
          s.stage='aftermath';
          if(fight===1){
            s.firstCleared=true;
            openBreakfastPages([
              {speakerId:'bethany_keeper',lines:['Thank you. Are you both quite all right?']},
              {speakerId:'sera',lines:['Quite. Though I’d still like that coffee.']},
              {speakerId:null,lines:['A crash comes from the storeroom. Something heavy scrapes across the floor.']},
              {speakerId:'bethany_keeper',lines:['Oh, no. There’s another one in with the flour.']},
            ],'breakfast_aftermath',enterStoreroom);
          }else{
            s.secondCleared=true;
            openBreakfastPages([
              {speakerId:null,lines:['The beetle falls away from the bins. Bread, fruit and the breakfast trays lie under a fine coating of flour.']},
              {speakerId:'liora',lines:['I think we’ve saved the supplies. Most of them.']},
              {speakerId:'bethany_server',lines:['Are you two done in here?']},
            ],'breakfast_storeroom_aftermath',()=>{
              if(!current(s)||s.fight!==fight||s.stage!=='aftermath')return;
              s.stage='ending_fade_out';s.endingElapsed=0;seraLioraBreakfast.fade=0;
              seraLioraCutscene.phase='breakfast_ending_return';clearInput();
            });
          }
        }else{
          s.stage='retry';s.retryPending=true;
          openBreakfastPages([{speakerId:null,lines:['Retry this encounter?']}],'breakfast_retry',()=>{
            if(current(s)&&s.fight===fight&&s.lastCommitted===receipt.battleId&&s.stage==='retry'){
              s.stage='fade_in';seraLioraBreakfast.fade=0;seraLioraCutscene.phase='breakfast_battle_fade';
            }
          });
        }
      };
      const storeroom=fight===2;
      storyBattle.begin(s.token,{encounter:storeroom?['enemy_large_buzzy_beetle']:['enemy_buzzy_beetle','enemy_buzzy_beetle'],escape:'blocked',
        presentation:{label:storeroom?'Bethany — The flour bins':'Bethany — Rescue breakfast',
          backgroundAssetId:storeroom?'cutaway_bethany_storeroom_v1':'cutaway_bethany_breakfast_v1',enemyFloorY:156},
        outcomes:{victory:outcome,defeat:outcome,escape:outcome}});
      s.attempt++;return true;
    }catch(error){fault(error);return false;}
  };
  return Object.freeze({
    isActive(){return state!==null;},
    hasWon(){return !!state?.firstCleared;},
    isStoreroom(){return state?.scene==='storeroom';},
    isEndingTerrace(){return state?.scene==='terrace';},
    endingBackgroundId(){
      return ['promise','promise_hold','ending_departure_fade'].includes(state?.stage)
        ? 'cutaway_bethany_breakfast_promise_v1' : 'cutaway_bethany_breakfast_meal_v1';
    },
    getState(){return state?copyFormationData({stage:state.stage,fight:state.fight,attempt:state.attempt,failure:state.failure,
      firstCleared:state.firstCleared,secondCleared:state.secondCleared,endingElapsed:state.endingElapsed||0,
      resources:state.token?storyBattle.getState(state.token):null}):null;},
    getView(){return state?.stage==='battle'?storyBattle.getView(state.token):null;},
    start(){
      if(state||!isSeraLioraBreakfastSequence()||seraLioraCutscene.phase!=='breakfast_final'||dialogue.open)return false;
      state={epoch:seraLioraBreakfast.epoch,stage:'fade_in',scene:'yard',fight:1,attempt:0,token:null,
        failure:null,retryPending:false,firstCleared:false,secondCleared:false,lastCommitted:0};
      seraLioraBreakfast.fade=0;seraLioraCutscene.phase='breakfast_battle_fade';clearInput();return true;
    },
    reset(){
      if(state?.token)storyBattle.discard(state.token);
      state=null;partyBattleQuickbloomAnimation.reset();partyBattleOffensiveResonanceAnimation.reset();return true;
    },
    update(seconds){
      const s=state;if(!s)return;
      if(!current(s)){this.reset();return;}
      const dt=Number.isFinite(seconds)?Math.max(0,Math.min(seconds,0.05)):MS_PER_FRAME/1000;
      if(s.stage==='battle'){
        try{partyBattleQuickbloomAnimation.update(this.getView(),dt);partyBattleOffensiveResonanceAnimation.update(this.getView(),dt);}catch(error){fault(error);}return;
      }
      try{updateEnding(s,dt);}catch(error){fault(error);}
      if(!current(s))return;
      if(s.stage==='fade_in'){
        seraLioraBreakfast.fade=Math.min(1,seraLioraBreakfast.fade+dt/SERA_LIORA_BREAKFAST.fadeSeconds);
        if(seraLioraBreakfast.fade===1)beginAttempt();
      }
    },
    handleInput(command){
      const s=state;if(!s)return false;
      try{
        if(dialogue.open){if(command==='confirm')handleInteract();return true;}
        if(s.stage!=='battle')return true;
        const v=this.getView(),phase=v.phase;
        if(['victory','defeat','escape'].includes(phase)){
          if(command==='confirm'){
            storyBattle.complete(s.token);
            const callbackError=storyBattle.getState(s.token).callbackError;
            if(callbackError)throw Error(callbackError);
          }return true;
        }
        const dispatch={
          awaiting_action:{left:['moveCommand','previous'],right:['moveCommand','next'],confirm:['confirmCommand'],
            ...(v.allyActions.length?{cancel:['backtrack']}:{})},
          technique:{up:['moveTechnique','previous'],down:['moveTechnique','next'],confirm:['confirmTechnique'],cancel:['cancelTechnique']},
          item:{up:['moveItem','previous'],down:['moveItem','next'],confirm:['confirmItem'],cancel:['cancelItem']},
          targeting:{left:['moveTarget','previous'],right:['moveTarget','next'],confirm:['confirmTarget'],cancel:['cancelTargeting']},
          ready:{confirm:['commitRound'],cancel:['backtrack']},playback:{confirm:['advancePlayback']},
          playback_complete:{confirm:['acknowledgePlayback']},
        };
        if(phase==='playback'&&(partyBattleQuickbloomAnimation.blocksAdvance(v)||partyBattleOffensiveResonanceAnimation.blocksAdvance(v)))return true;
        const action=dispatch[phase]?.[command];if(action)storyBattle.act(s.token,...action);
      }catch(error){fault(error);}
      return true;
    },
    drawStoreroomBackground(){
      const id=state?.secondCleared?'cutaway_bethany_storeroom_flour_v1':'cutaway_bethany_storeroom_v1';
      ctx.drawImage(loadedImageAsset(id),0,0);
    },
    drawStoreroomActors(){
      drawLayeredScene([
        ...(!state?.secondCleared?[{id:'large-beetle',layer:'world',depth:190,draw:()=>{
          ctx.save();ctx.translate(270,190);ctx.scale(1.5,1.5);drawBreakfastBeetle({x:0,y:0,frame:1,facing:'left'});ctx.restore();
        }}]:[]),
        {id:'keeper-server',layer:'world',depth:275,draw:drawBreakfastKeeper},
        {id:'sera',layer:'world',depth:350,draw:()=>drawSeraLioraSceneSera(seraLioraSceneSeraView())},
        {id:'liora',layer:'world',depth:350,draw:()=>drawSeraLioraCourtyardLiora({x:365,y:350,facing:'up',frame:1})},
      ]);
    },
    draw(){
      if(!state)return false;
      if(state.stage==='battle')return drawPartyBattle(this.getView());
      if(state.stage==='chapter_card'){
        ctx.save();ctx.fillStyle='#08121e';ctx.fillRect(0,0,512,480);
        ctx.globalAlpha=Math.max(0,Math.min(1,state.endingElapsed/.4,
          (SERA_LIORA_CHAPTER_CARD_SECONDS-state.endingElapsed)/.4));
        ctx.fillStyle='#e8d9aa';ctx.font='bold 28px "Courier New", monospace';
        ctx.textAlign='center';ctx.fillText('Chapter 2',256,248);ctx.restore();
        return true;
      }
      if(['fault','assets'].includes(state.stage)){
        ctx.fillStyle='#0c121c';ctx.fillRect(0,0,512,480);ctx.fillStyle='#e0d0c0';ctx.font='13px "Courier New", monospace';
        ctx.fillText(state.stage==='assets'?'Loading breakfast scene…':'Battle stopped. Reload or apply a story checkpoint.',16,220,480);
        return true;
      }
      return false;
    },
    preview(){
      if(state||storyBattle.hasContext()||seraLioraCutscene.active||combat.mode!==null||combat.active||
          activityOwnership.conflicts(['debug','checkpoint']).length)return false;
      if(!debugPlaySeraLioraCutaway())return false;
      // Use the same approved preview placement and existing scene assets.
      dialogue.open=false;dialogue.callbacks=null;dialogue.triggerEncounterId=null;
      revealBethanyGuestRoom();if(!seraLioraCutscene.active)return false;
      seraLioraCutscene.assetLoadToken++;seraLioraCutscene.phase='breakfast_battle_assets';
      seraLioraCutscene.revealAlpha=0;seraLioraGuestRoomWalk.active=true;seraLioraGuestRoomWalk.inputLocked=true;
      const pending={epoch:seraLioraBreakfast.epoch,stage:'assets',scene:'yard',fight:1,attempt:0,token:null,
        failure:null,firstCleared:false,secondCleared:false};state=pending;
      const ready=()=>{
        if(!current(pending)||pending.stage!=='assets')return;
        if(!seraLioraFreeWalkAssetsReady()||!seraLioraCourtyardAssetsReady()||!seraLioraBreakfastAssetsReady()){
          fault(Error('Breakfast battle assets unavailable'));return;
        }
        Object.assign(seraLioraBreakfast,{visible:true,triggered:true,gateOpen:true,fade:0});
        Object.assign(seraLioraCourtyard,{lioraVisible:true});
        setBreakfastActor('sera',{x:345,y:290,facing:'up',moving:false,animationTime:0,animationFrame:1});
        setBreakfastActor('liora',{x:435,y:290,facing:'up',moving:false,animationTime:0,animationFrame:1});
        state=null;seraLioraCutscene.phase='breakfast_final';this.start();
      };
      if(seraLioraFreeWalkAssetsReady()&&seraLioraCourtyardAssetsReady()&&seraLioraBreakfastAssetsReady())ready();
      else Promise.all(['sera_liora_opening','sera_liora_courtyard','sera_liora_breakfast'].map(id=>preloadImageAssetBundle(id))).then(ready,()=>{if(current(pending)&&pending.stage==='assets')fault(Error('Breakfast battle assets unavailable'));});
      return true;
    },
  });
})();
