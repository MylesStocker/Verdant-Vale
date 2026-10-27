/* Isolated real Canvas and keyboard review; not loaded by the game. */
(async()=>{
 const result={checks:[],captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 const check=(ok,name)=>{if(!ok)throw Error(name);result.checks.push(name);};
 window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
  await Promise.all(['sera_liora_opening','sera_liora_courtyard','sera_liora_breakfast','sera_liora_storeroom'].map(preloadImageAssetBundle));
  const tap=key=>{for(const type of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));};
  const frames=n=>{for(let i=0;i<n;i++)update(1/60);};
  const view=()=>seraLioraBreakfastBattle.getView();
  const state=()=>JSON.stringify({stats,party:persistentParty.serialize(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),day});
  const snap=name=>{render();const c=document.createElement('canvas');c.width=512*scale;c.height=480*scale;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(canvas,0,0,c.width,c.height);result.captures.push({name:name+'-'+scale+'x',png:c.toDataURL()});};
  const close=()=>{for(let i=0;i<100&&dialogue.open;i++){render();tap('Enter');}check(!dialogue.open,'dialogue closed');};
  const spell=(id,target)=>{
   let n=0;while(view().selectedCommand!=='resonance'){check(n++<5,'command navigation bounded');tap('ArrowRight');}tap('Enter');
   n=0;while(view().selectedTechniqueId!==id){check(n++<5,'technique navigation bounded');tap('ArrowDown');}tap('Enter');
   if(target!==undefined){n=0;while(view().selectedTargetInstanceId!==view().enemies[target].instanceId){check(n++<4,'target navigation bounded');tap('ArrowRight');}}
   snap('target-'+id);tap('Enter');
  };
  const playback=()=>{let n=0;while(['playback','playback_complete'].includes(view().phase)){check(n++<300,'playback bounded');
   if(partyBattleOffensiveResonanceAnimation.blocksAdvance(view())||partyBattleQuickbloomAnimation.blocksAdvance(view()))frames(1);else tap('Enter');
  }check(view().phase==='victory','ordinary shared victory');};
  let scale=1;Math.random=()=>.5;
  for(scale of [1,2]){
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'baseline checkpoint');dialogue.open=false;const before=state();
   check(seraLioraBreakfastBattle.preview(),'first fight preview');frames(40);check(view()?.phase==='awaiting_action','fight loaded');
   for(const fight of [1,2]){
    const label=fight===1?'courtyard':'storeroom',observed=view().enemies.map(()=>new Set());
    const read=JSON.stringify(seraLioraBreakfastBattle.getState());
    for(let i=0;i<4;i++){
     const layout=partyBattleLayout(view());layout.enemies.forEach((p,j)=>observed[j].add(p.frame));
     snap(label+'-pose-'+i);frames(13);
    }
    check(observed.every(s=>s.size===3),label+' all existing animation frames used');
    check(JSON.stringify(seraLioraBreakfastBattle.getState())===read,label+' idle animation does not mutate resources');
    if(fight===1){spell('null',0);spell('rainbow',1);}else{spell('eclipse');spell('eclipse');}
    check(view().phase==='ready','both actions explicitly selected');tap('Enter');
    for(let i=0;i<20&&view().playbackFrame?.currentEvent?.type==='round_start';i++)tap('Enter');
    frames(10);snap(label+'-resonance');playback();snap(label+'-victory');
    const still=partyBattleLayout(view()).enemies.map(p=>p.frame);frames(25);check(JSON.stringify(partyBattleLayout(view()).enemies.map(p=>p.frame))===JSON.stringify(still),'defeated beetles stop moving');
    tap('Enter');close();if(fight===1){close();frames(40);check(seraLioraBreakfastBattle.getState().fight===2,'natural storeroom entry');}
   }
   check(state()===before,'canonical party and quest state unchanged');
   for(let i=0;i<1600&&seraLioraCutscene.active;i++){if(dialogue.open){render();tap('Enter');}else frames(1);}
   check(!seraLioraCutscene.active,'normal preview ending returns to the game');
   check(state()===before,'full preview leaves canonical resources unchanged');
  }
  result.ok=true;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
