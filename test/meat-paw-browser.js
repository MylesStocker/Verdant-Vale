/* Isolated real Canvas/keyboard check, never loaded by production. */
(async()=>{
 const result={checks:[],captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 const check=(ok,name)=>{if(!ok)throw Error(name);result.checks.push(name);};
 window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
  const key=(key,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));
  const press=k=>{key(k,true);key(k,false);};
  const frames=n=>{for(let i=0;i<n;i++)update(1/60);};
  const hold=(k,n)=>{key(k,true);frames(n);key(k,false);};
  const capture=(name,scale)=>{render();const out=document.createElement('canvas');out.width=512*scale;out.height=480*scale;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name:name+'-'+scale+'x',png:out.toDataURL()});};
  const close=()=>{for(let n=0;dialogue.open;n++){check(n<100,'dialogue terminates');render();ctx.save();ctx.font='14px "Courier New", monospace';check(dialogue.pages[dialogue.page].every(s=>ctx.measureText(s).width<=464),'dialogue fits Canvas');ctx.restore();press('Enter');}};
  const place=(id,x,y)=>{const b=mornayRoomForMap(id);check(transitionToLocation({mapId:id,x,y,state:id.startsWith('MORNAY_')?{inTown:true,currentTownId:'mornay',townBuilding:b?.id||null}:{}}),'fixture placement');dialogue.open=false;};
  const fresh=()=>{check(storyCheckpointLab.apply('mq7_lantern_house_ready'),'MQ7 fixture');MainQuest=7;lantern_stage=8;lantern_wins=15;debugMode=true;worldToastTimer=0;};
  const board=()=>{place('MORNAY_SOUTH_UPPER_EAST_MAP',240,192);press('Enter');check(dialogue.open,'board interaction');};
  const v=()=>canonicalPartyCombat.getView();
  const cmd=type=>{let n=0;while(v().selectedCommand!==type){check(n++<8,'command reachable');press('ArrowRight');}press('Enter');if(v().phase==='targeting')press('Enter');};
  const round=(type,scale)=>{
   while(v().phase==='awaiting_action')cmd(type);check(v().phase==='ready','ready');press('Enter');
   for(let n=0;v().phase==='playback';n++){
    check(n<80,'finite playback');const e=v().playbackFrame.currentEvent;
    if(e?.type==='vital_strike'){check(['Paw','Claw','Pounce'].includes(e.attackName),'named strike');capture(e.attackName.toLowerCase(),scale);}
    if(e?.type==='run')check(!e.allowed&&!e.success,'Run blocked');
    press('Enter');
   }
   if(v().phase==='playback_complete')press('Enter');
  };
  for(const scale of [1,2]){
   fresh();forceLegacyRegionalView=scale===2;board();while(dialogue.page<dialogue.pages.length-1)press('Enter');capture('bounty-notice',scale);close();check(choice.open,'accept option');press('Enter');close();check(meat_paw_stage===1,'bounty accepted');
   place('MAINLAND_C27R3_MAP',48,432);capture('passage-before',scale);check(saveGame()&&loadGame(),'save before ambush');dialogue.open=false;
   hold('ArrowUp',15);frames(30);check(meatPaw.isActive(),'ordinary walking triggers emergence');capture('bear-emerges',scale);const at=[player.x,player.y];hold('ArrowDown',80);check(player.x===at[0]&&player.y===at[1],'trapped during emergence');press('m');check(!menu.open&&!saveGame(),'no menu or save during scene');
   capture('cornered',scale);while(dialogue.open&&dialogue.pageSpeakers[dialogue.page]!=='esla')press('Enter');check(dialoguePagePresentation().styleId==='esla_light_green','Esla style');capture('esla-warning',scale);close();check(canonicalPartyCombat.isActive(),'forced battle');capture('battle',scale);
   Math.random=()=>.9;for(let r=0;r<4&&v().phase!=='defeat';r++)round('run',scale);check(v().phase==='defeat','Pounce can defeat party');press('Enter');close();check(meat_paw_stage===1,'defeat leaves bounty retryable');check(saveGame()&&loadGame(),'defeat recovery saves');dialogue.open=false;
   // Strong fixture verifies victory/payment; this is not a balance playthrough.
   fresh();meat_paw_stage=1;stats.hp=stats.maxHp=1000;stats.atk=9999;stats.spd=100;Math.random=()=>.5;
   place('MAINLAND_C27R3_MAP',48,432);hold('ArrowUp',90);frames(90);close();round('attack',scale);check(v().phase==='victory','victory receipt');capture('victory',scale);press('Enter');close();check(meat_paw_stage===2,'cleared');check(saveGame()&&loadGame(),'clearance saved');dialogue.open=false;
   const gold=stats.gold;board();while(dialogue.page<dialogue.pages.length-1)press('Enter');capture('payment',scale);close();check(meat_paw_stage===3&&stats.gold===gold+5000,'5000 paid once');board();close();check(stats.gold===gold+5000,'no duplicate fee');
   place('MAINLAND_C27R3_MAP',48,432);hold('ArrowUp',60);check(!meatPaw.isActive()&&!canonicalPartyCombat.isActive(),'cleared passage safe');capture('passage-cleared',scale);
  }
  result.ok=!result.errors.length;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
