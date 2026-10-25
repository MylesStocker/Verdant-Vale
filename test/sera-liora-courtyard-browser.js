/* Automated DOM-keyboard/production Canvas review; not shipped in index.html. */
(async()=>{
 const result={checks:[],captures:[],errors:[]};
 const check=(v,s)=>{if(!v)throw Error(s);result.checks.push(s);};
 window.addEventListener('error',e=>result.errors.push(e.message));window.requestAnimationFrame=()=>1;
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{
   const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);
  });
  await preloadImageAssetBundle('sera_liora_opening');await preloadImageAssetBundle('sera_liora_courtyard');await preloadImageAssetBundle('sera_liora_breakfast');await preloadImageAssetBundle('sera_liora_storeroom');
  check(seraLioraCourtyardAssetsReady()&&seraLioraBreakfastAssetsReady(),'Real PNG assets decode');
  result.combatStarts=0;startCombat=function(){result.combatStarts++;throw Error('Premature cutaway combat');};
  const press=(key,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));
  const tap=key=>{press(key,true);press(key,false);};
  const hold=(key,frames)=>{press(key,true);try{for(let i=0;i<frames;i++)update(1/60);}finally{press(key,false);}};
  const capture=name=>{render();const out=document.createElement('canvas'),scale=parseInt(canvas.style.width)/512||1;
   out.width=512*scale;out.height=480*scale;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name,png:out.toDataURL()});};
  function checkStoreroomPlate(id,label){
   const prior=JSON.stringify(seraLioraBreakfastBattle.getState()),canonical=resources(),drawImage=ctx.drawImage,paths=[];
   ctx.drawImage=function(image,...args){paths.push(image);return drawImage.call(this,image,...args);};
   try{render();}finally{ctx.drawImage=drawImage;}
   check(paths[0]===loadedImageAsset(id),'Actual storeroom plate '+label);
   check(JSON.stringify(seraLioraBreakfastBattle.getState())===prior&&resources()===canonical,'Reveal rendering is read-only '+label);
  }
  function tryBlockedRun(label){
   check(seraLioraBreakfastBattle.getView().escapePolicy==='blocked','Blocked escape policy '+label);
   const prior=seraLioraBreakfastBattle.getState();
   for(let actor=0;actor<2;actor++){
    let moves=0;while(seraLioraBreakfastBattle.getView().selectedCommand!=='run'&&moves++<6)tap('ArrowRight');
    check(moves<6,'Reach Run through ordinary commands '+label+':'+actor);tap('Enter');
   }
   check(seraLioraBreakfastBattle.getView().phase==='ready','Run draft ready '+label);tap('Enter');
   let playback=0;while(['playback','playback_complete'].includes(seraLioraBreakfastBattle.getView().phase)&&playback++<100)tap('Enter');
   check(playback<100&&seraLioraBreakfastBattle.getView().phase==='awaiting_action','Run returns to active combat '+label);
   const after=seraLioraBreakfastBattle.getState();
   check(after.stage==='battle'&&after.fight===prior.fight&&after.attempt===prior.attempt&&!dialogue.open,'Run cannot leave or retry '+label);
  }
  const resources=()=>JSON.stringify({party:persistentParty.serialize(),stats,statusEffects,day});
  function paintDialogue(label){
   const glyphs=[],originalText=ctx.fillText;
   ctx.fillText=function(text,x,y,...args){
    const m=this.measureText(text),left=this.textAlign==='right'?x-m.width:this.textAlign==='center'?x-m.width/2:x;
    if(y>=358&&y<=472)glyphs.push({text,left,right:left+m.width,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent,font:this.font});
    return originalText.call(this,text,x,y,...args);
   };
   try{render();}finally{ctx.fillText=originalText;}
   const overflow=glyphs.filter(d=>d.left<8||d.right>504||d.top<358||d.bottom>472);
   if(overflow.length)result.overflow=overflow;
   check(glyphs.length>0&&overflow.length===0,'Actual painted glyphs fit '+label);
  }
  for(const scale of [1,2]){
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'Starting fixture '+scale);dialogue.open=false;worldToastTimer=0;
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   const before=resources(),beforeOpening=sera_liora_opening_complete;
   check(debugPlaySeraLioraCutaway(),'Preview entry '+scale);
   tap('Enter');for(let n=0;n<18;n++)update(1/60);tap('Enter');for(let n=0;n<40;n++)update(1/60);
   while(seraLioraCutscene.beat<21)tap('Enter');tap('Enter');
   check(seraLioraCutscene.phase==='free_walk','Bedroom remains playable '+scale);
   hold('s',30);hold('a',130);hold('w',120);hold('a',60);tap('a');
   check(seraLioraDoorInteractionAvailable(),'Reach bedroom door through controls '+scale);tap('Enter');
   check(seraLioraCutscene.phase==='courtyard_free'&&!seraLioraCourtyard.lioraVisible,'Solo courtyard arrival '+scale);
   check(seraLioraGuestRoomWalk.completionCount===0,'Door does not complete '+scale);capture('arrival-'+scale+'x');
   check(!canSaveHere()&&!saveGame(),'Courtyard uses existing unsaved cutaway policy '+scale);
   hold('s',20);hold('d',110);
   check(seraLioraCutscene.phase==='courtyard_call','Unavoidable call '+scale);
   const stop=[seraLioraGuestRoomWalk.x,seraLioraGuestRoomWalk.y,seraLioraGuestRoomWalk.facing];
   check(stop[2]==='left'&&!seraLioraGuestRoomWalk.moving,'Sera stops and turns '+scale);capture('call-'+scale+'x');
   tap('Enter');
   let n=0;
   while(seraLioraCutscene.phase==='courtyard_approach'&&n++<400){
    const x=seraLioraCourtyard.lioraX,y=seraLioraCourtyard.lioraY;update(1/60);
    check(Math.hypot(seraLioraCourtyard.lioraX-x,seraLioraCourtyard.lioraY-y)<=1.50001,'Animated bounded step '+scale+':'+n);
    if(n===24)capture('approach-'+scale+'x');
   }
   check(n<400&&seraLioraCutscene.phase==='courtyard_dialogue','Liora finishes walking '+scale);
   check(seraLioraCourtyard.lioraVisible&&!seraLioraCourtyard.moving,'Liora remains visible and still '+scale);
   check(Math.abs(seraLioraCourtyard.lioraX-seraLioraGuestRoomWalk.x)===86&&seraLioraCourtyard.lioraY===seraLioraGuestRoomWalk.y,'Peer spacing '+scale);
   capture('conversation-'+scale+'x');
   const finish=dialogue.callbacks[0];let pages=0;
   while(seraLioraCutscene.phase==='courtyard_dialogue'&&pages++<20){
    check(seraLioraCourtyard.lioraVisible,'Both actors remain present on page '+pages+' scale '+scale);
    paintDialogue(scale+':'+pages);
    if(dialogue.pages[dialogue.page].join(' ').startsWith('Then let’s eat'))capture('liora-breakfast-'+scale+'x');
    if(dialogue.page===1)check(dialoguePagePresentation().speakerId==='liora','Mixed Liora metadata '+scale);
    tap('Enter');
   }
   check(seraLioraGuestRoomWalk.completionCount===0,'Courtyard continues instead of returning '+scale);
   let travel=0;
   while(seraLioraCutscene.phase!=='breakfast_free'&&travel++<700){
    update(1/60);
    const a=breakfastActor('sera'),b=breakfastActor('liora');
    check(Math.abs(a.x-b.x)>=30||Math.abs(a.y-b.y)>=22,'Travel spacing '+scale+':'+travel);
    if(travel===45)capture('courtyard-departure-'+scale+'x');
   }
   check(travel<700&&seraLioraBreakfast.visible,'Breakfast arrival '+scale);
   capture('breakfast-arrival-'+scale+'x');
   check(!seraLioraBreakfast.gateOpen&&!breakfastFloorWalkable(345,303),'Inner barrier contains the yard '+scale);
   check(breakfastBeetleViews().length===2&&new Set(breakfastBeetleViews().map(b=>b.id)).size===2,'Two separate beetles '+scale);
   hold('w',33);tap('Enter');check(dialogue.open&&dialogue.pages[0][0]==='Two places are set. Neither has breakfast.','Unserved table inspection '+scale);tap('Enter');hold('s',33);
   hold('d',45);check(seraLioraCutscene.phase==='breakfast_problem','Keeper interruption '+scale);
   let spoken=0;
   while(seraLioraCutscene.phase==='breakfast_problem'&&spoken++<12){paintDialogue('Keeper '+scale+':'+spoken);tap('Enter');}
   let staged=0,openCapture=false;
   while(seraLioraCutscene.phase!=='breakfast_final'&&staged++<1300){
    const old=['sera','liora','keeper'].map(breakfastActor);update(1/60);
    const actors=['sera','liora','keeper'].map(breakfastActor);
    check(actors.every((a,i)=>Math.hypot(a.x-old[i].x,a.y-old[i].y)<=1.50001),'Staging bounded steps '+scale+':'+staged);
    check(actors.every(a=>breakfastFloorWalkable(a.x,a.y)),'Staging legal floor '+scale+':'+staged);
    if(seraLioraBreakfast.gateOpen&&!openCapture){capture('keeper-opens-gate-'+scale+'x');openCapture=true;}
   }
   check(staged<1300&&openCapture,'Access and confrontation reached '+scale);
   const monsterDraw=ctx.drawImage;let drawnBeetles=0;
   ctx.drawImage=function(im,...args){if(im===loadedImageAsset('cutaway_buzzy_beetle_scene_v1'))drawnBeetles++;return monsterDraw.call(this,im,...args);};
   try{render();}finally{ctx.drawImage=monsterDraw;}
   check(drawnBeetles===2,'Exactly two visible beetle draws '+scale);capture('confrontation-'+scale+'x');
   const preBattle=dialogue.callbacks[0];
   for(let final=0;seraLioraCutscene.phase==='breakfast_final'&&final<6;final++){paintDialogue('Confrontation '+scale+':'+final);tap('Enter');}
   check(seraLioraCutscene.phase==='breakfast_battle_fade'&&!combat.active,'First battle fade '+scale);
   let fade=0;while(seraLioraBreakfastBattle.getState()?.stage==='fade_in'&&fade++<50){update(1/60);if(fade===20){check(seraLioraBreakfast.fade>0&&seraLioraBreakfast.fade<1,'Visible battle fade '+scale);capture('pre-battle-fade-'+scale+'x');}}
   check(fade<50&&seraLioraBreakfastBattle.getView()?.enemies.length===2,'Two shared-engine beetles '+scale);
   tryBlockedRun('yard '+scale);
   capture('first-battle-'+scale+'x');preBattle();check(seraLioraGuestRoomWalk.completionCount===0,'Stale handoff cannot complete battle '+scale);
   let battleGuard=0,damageCaptured=false,selectionCaptured=false;const spellCaptures=new Set();
   while(seraLioraBreakfastBattle.getState()?.stage==='battle'&&battleGuard++<250){
    const v=seraLioraBreakfastBattle.getView();update(1/60);
    if(v.phase==='awaiting_action'){
      const wanted=v.enabledCommands.includes('resonance')?'resonance':'attack';
      if(v.selectedCommand!==wanted)tap('ArrowRight');else tap('Enter');
    }else if(v.phase==='technique'){
      const desired=scale===2?'eclipse':v.party.find(m=>m.instanceId===v.nextActorId).slot===0?'null':'rainbow';
      if(v.selectedTechniqueId!==desired)tap('ArrowDown');else{capture('resonance-list-'+scale+'x');tap('Enter');}
    }else if(v.phase==='targeting'){
      if(!selectionCaptured){capture('battle-targets-'+scale+'x');selectionCaptured=true;}
      if(v.targetMode==='all')tap('Enter');
      else{const living=v.enemies.filter(e=>e.hp>0),slot=v.party.find(m=>m.instanceId===v.nextActorId).slot,desired=living[Math.min(slot,living.length-1)].instanceId;
        if(v.selectedTargetInstanceId!==desired)tap('ArrowRight');else tap('Enter');}
    }else{
      const spellEvent=v.playbackFrame?.currentEvent;
      if(['resonance_damage','resonance_damage_all'].includes(spellEvent?.type)&&!spellCaptures.has(spellEvent.techniqueId)){
        for(let n=0;n<10;n++)update(1/60);
        check(partyBattleOffensiveResonanceAnimation.blocksAdvance(v),'Spell effect remains visible '+spellEvent.techniqueId+' '+scale);
        capture('spell-'+spellEvent.techniqueId+'-'+scale+'x');spellCaptures.add(spellEvent.techniqueId);
      }
      if(!damageCaptured&&['resonance_damage','resonance_damage_all'].includes(v.playbackFrame?.currentEvent?.type)){capture('battle-damage-'+scale+'x');damageCaptured=true;}
      tap('Enter');
    }
   }
   check(battleGuard<250&&seraLioraBreakfastBattle.getState()?.stage==='aftermath','Acknowledged shared victory '+scale);
   check(damageCaptured,'Historical spell damage rendered '+scale);check(breakfastBeetleViews().length===0,'Victory removes scene beetles '+scale);capture('breakfast-aftermath-'+scale+'x');
   const firstContext=seraLioraBreakfastBattle.getState().resources;
   for(let n=0;dialogue.open&&n<12;n++){paintDialogue('Keeper/crash/storeroom '+scale+':'+n);if(seraLioraBreakfastBattle.isStoreroom()){checkStoreroomPlate('cutaway_bethany_storeroom_v1','before victory '+scale);capture('storeroom-intro-'+scale+'x');}tap('Enter');}
   let nextFade=0;while(seraLioraBreakfastBattle.getState()?.stage==='fade_in'&&nextFade++<50)update(1/60);
   check(nextFade<50&&seraLioraBreakfastBattle.getState().fight===2,'Storeroom battle entered '+scale);
   check(seraLioraBreakfastBattle.getState().resources.id===firstContext.id,'Same story context '+scale);
   check(seraLioraBreakfastBattle.getView().enemies[0].id==='enemy_large_buzzy_beetle','Larger easy beetle '+scale);
   check(breakfastBeetleViews().length===0,'Yard beetles stay cleared '+scale);capture('storeroom-battle-'+scale+'x');
   tryBlockedRun('storeroom '+scale);
   let secondGuard=0;
   while(seraLioraBreakfastBattle.getState()?.stage==='battle'&&secondGuard++<500){
    const v=seraLioraBreakfastBattle.getView();update(1/60);
    if(v.phase==='awaiting_action'){
      const wanted=scale===2?'resonance':'attack';
      check(v.enabledCommands.includes(wanted),'Ordinary actions and explicit Eclipse stay available '+scale);
      if(v.selectedCommand!==wanted)tap('ArrowRight');else tap('Enter');
    }else if(v.phase==='technique'){
      if(v.selectedTechniqueId!=='eclipse')tap('ArrowDown');else tap('Enter');
    }else if(v.phase==='targeting')tap('Enter');
    else{if(['attack','resonance_damage_all'].includes(v.playbackFrame?.currentEvent?.type))capture('storeroom-damage-'+scale+'x');tap('Enter');}
   }
   check(secondGuard<500&&seraLioraBreakfastBattle.getState().secondCleared,'Storeroom victory '+scale);
   checkStoreroomPlate('cutaway_bethany_storeroom_flour_v1','after victory '+scale);capture('storeroom-flour-reveal-'+scale+'x');
   const lastCallback=dialogue.callbacks[0];
   while(dialogue.open){paintDialogue('Flour supplies/server '+scale+':'+dialogue.page);capture('storeroom-aftermath-'+scale+'x');tap('Enter');}
   check(seraLioraBreakfastBattle.getState().stage==='ending_fade_out','Natural courtyard return begins '+scale);
   checkStoreroomPlate('cutaway_bethany_storeroom_flour_v1','before courtyard return '+scale);
   const stopped=JSON.stringify(seraLioraBreakfastBattle.getState());preBattle();finish();lastCallback();
   check(JSON.stringify(seraLioraBreakfastBattle.getState())===stopped,'Stale callbacks cannot advance ending '+scale);
   check(seraLioraGuestRoomWalk.completionCount===0&&sera_liora_opening_complete===beforeOpening,'No premature completion '+scale);
   check(!canSaveHere()&&!saveGame()&&!loadGame(),'Return fade retains temporary context '+scale);
   let returnFrames=0;while(['ending_fade_out','ending_fade_in'].includes(seraLioraBreakfastBattle.getState()?.stage)&&returnFrames++<100)update(1/60);
   check(returnFrames<100&&seraLioraBreakfastBattle.getState().stage==='ending_dialogue','Breakfast courtyard reached '+scale);
   check(seraLioraBreakfastBattle.isEndingTerrace(),'Approved terrace presentation '+scale);
   check(dialogue.pages.flat().join(' ').includes('Skybloom')&&dialogue.pages.flat().join(' ').includes('Bethany'),'Quiet Bethany/Skybloom plans '+scale);
   checkStoreroomPlate('cutaway_bethany_breakfast_meal_v1','seated courtyard breakfast '+scale);capture('improvised-breakfast-'+scale+'x');
   while(seraLioraBreakfastBattle.getState().stage==='ending_dialogue'){
    paintDialogue('Breakfast conversation '+scale+':'+dialogue.page);
    if(dialoguePagePresentation().speakerId==='sera')check(dialoguePagePresentation().styleId==='sera_elegant','Sera ending typography '+scale);
    tap('Enter');
   }
   check(seraLioraBreakfastBattle.getState().stage==='promise'&&dialogue.page===0,'Promise conversation starts unskipped '+scale);
   const promiseCallback=dialogue.callbacks[0];
   while(seraLioraBreakfastBattle.getState().stage==='promise'){
    paintDialogue('Pinky promise '+scale+':'+dialogue.page);
    if(dialogue.page===2){checkStoreroomPlate('cutaway_bethany_breakfast_promise_v1','pinky promise '+scale);capture('pinky-promise-'+scale+'x');}tap('Enter');
   }
   check(seraLioraBreakfastBattle.getState().stage==='promise_hold'&&!dialogue.open,'Promise hold begins '+scale);
   check(seraLioraBreakfastBattle.getState().endingElapsed===0,'Promise hold starts at zero '+scale);
   tap('Enter');tap('Escape');check(seraLioraBreakfastBattle.getState().stage==='promise_hold','Confirm/cancel cannot skip promise hold '+scale);
   for(let n=0;n<119;n++)update(1/60);
   check(seraLioraBreakfastBattle.getState().stage==='promise_hold','Two-second hold has not ended early '+scale);capture('pinky-promise-hold-'+scale+'x');
   check(!canSaveHere()&&!saveGame()&&!loadGame(),'Promise resources cannot enter saves '+scale);update(1/60);
   check(seraLioraBreakfastBattle.getState().stage==='ending_departure_fade','Promise hold completes on time '+scale);
   for(let n=0;n<20;n++)update(1/60);capture('breakfast-final-fade-'+scale+'x');
   let finalFrames=0;while(seraLioraCutscene.active&&finalFrames++<40)update(1/60);
   check(finalFrames<40&&!seraLioraBreakfastBattle.isActive()&&!storyBattle.hasContext(),'Ending releases story context '+scale);
   check(activeMap===DRENWICK_INFIRMARY_MAP&&!seraLioraCutscene.active,'Natural return to Lely '+scale);
   check(seraLioraGuestRoomWalk.completionCount===1&&sera_liora_opening_complete===beforeOpening,'Preview completes once without story flag '+scale);
   check(dialogue.page===0&&dialogue.pages[0][0]===ESLA_INFIRMARY_WAKE_PAGES[0][0],'Hospital wake starts unskipped '+scale);
   const wakePages=dialogue.pages;preBattle();finish();lastCallback();promiseCallback();for(let n=0;n<60;n++)update(1/60);
   check(dialogue.pages===wakePages&&seraLioraGuestRoomWalk.completionCount===1,'Stale callbacks cannot repeat final completion '+scale);
   check(!seraLioraBreakfast.visible&&!seraLioraCourtyard.lioraVisible,'Temporary actors cleaned '+scale);
   check(before===resources(),'Canonical party/resources unchanged '+scale);capture('infirmary-return-'+scale+'x');
  }
  check(result.combatStarts===0,'No legacy singleton starter called; breakfast uses the shared story bridge');
  check(result.errors.length===0,'No browser errors');result.ok=true;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
