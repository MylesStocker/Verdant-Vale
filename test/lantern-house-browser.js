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
  // Plan against the live collision geometry, then walk every step via keys.
  const walk=(x,y)=>{
   const start=[player.x,player.y],queue=[start],prev=new Map([[start.join(','),null]]),goal=[x,y];
   const clear=(a,b)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2);for(let i=0;i<=n;i++){const t=n?i/n:0,px=a[0]+(b[0]-a[0])*t,py=a[1]+(b[1]-a[1])*t;if(TILE_PROPERTIES[tileAt(px,py)]?.isTransition||!canWalk(px,py))return false;}return true;};
   let path=null;
   for(let i=0;i<queue.length;i++){
    const p=queue[i],corner=[goal[0],p[1]];
    if(Math.abs(p[0]-x)<8&&Math.abs(p[1]-y)<8&&clear(p,corner)&&clear(corner,goal)){
     path=[p];let k=p.join(',');while(prev.get(k)!==null){const q=prev.get(k);path.push(q);k=q.join(',');}path=path.reverse().concat([corner,goal]);break;
    }
    for(const [dx,dy]of [[8,0],[-8,0],[0,8],[0,-8]]){
     const q=[p[0]+dx,p[1]+dy],k=q.join(',');if(q[0]<9||q[0]>503||q[1]<9||q[1]>471||prev.has(k)||!clear(p,q))continue;prev.set(k,p);queue.push(q);
    }
   }
   check(!!path,'collision-safe exit route');
   for(const [x,y]of path.slice(1)){
    const dx=x-player.x,dy=y-player.y;if(!dx&&!dy)continue;hold(dx<0?'ArrowLeft':dx>0?'ArrowRight':dy<0?'ArrowUp':'ArrowDown',(Math.abs(dx)+Math.abs(dy))/SPEED);
    check(player.x===x&&player.y===y,'ordinary exit walking');
   }
  };

  const close=(captureName,scale)=>{
   let captured=false;
   for(let n=0;dialogue.open;n++){
    check(n<120,'dialogue finishes');render();const p=dialoguePagePresentation();
    check(dialogue.pages[dialogue.page].length<=3,'bounded visual page');ctx.save();ctx.font='14px "Courier New", monospace';check(dialogue.pages[dialogue.page].every(line=>ctx.measureText(line).width<=464),'real Canvas text fits');ctx.restore();
    check(p.speakerId==='esla'?p.styleId==='esla_light_green':p.styleId===null,'speaker styling isolated');
    if(captureName&&!captured&&(p.speakerId==='esla'||lanternHouse.phase()==='conversation')){capture(captureName,scale);captured=true;}
    press('Enter');
   }
  };
  const door=(col,row,key,target)=>{
   walk(col*32+16,row*32+16);for(let n=0;mapIdForRef(activeMap)!==target;n++){check(n<35,'door transition '+target);hold(key,1);}
   check(canWalk(player.x,player.y),'safe arrival '+target);check(saveGame()&&loadGame(),'save/load '+target);
  };
  const battle=(id,scale)=>{
   const b=LANTERN_BATTLES[id];walk(b.x*32,b.y*32+32);press('Enter');close(null,scale);press('Enter');check(canonicalPartyCombat.isActive(),'shared encounter starts '+id);capture('fight-'+id,scale);
   const v=()=>canonicalPartyCombat.getView();let rounds=0;
   for(let n=0;canonicalPartyCombat.isActive();n++){
    check(n<800,'combat terminates');partyBattleQuickbloomAnimation.update(v(),10);
    if(v().phase==='awaiting_action'){
     const stalker=id===4&&v().enemies[0].hp>0;
     const cmd=stalker?'item':'attack';
     for(let j=0;v().selectedCommand!==cmd;j++){check(j<8,'tactical command available');press('ArrowRight');}
     press('Enter');
     if(stalker){for(let j=0;v().selectedItemId!=='Sapper Charge';j++){check(j<50,'existing thrown supplies available');press('ArrowDown');}press('Enter');}
     if(v().phase==='targeting')press('Enter');
    }else if(v().phase==='ready'){rounds++;press('Enter');}
    else if(v().phase==='defeat'||v().phase==='escape')throw Error('Unexpected '+v().phase+' fight '+id);
    else {check(v().phase!=='fault','no combat fault');press('Enter');}
   }
   close(null,scale);check(!!(lantern_wins&(1<<id)),'authenticated win '+id);result.battles.push({scale,id,rounds,hp:stats.hp,esla:persistentParty.getMember('esla')?.hp});
   // Spend the checkpoint's ordinary healing inventory through the actual menu.
   for(const who of ['lely','esla']){
    const member=()=>persistentParty.getFieldView().members.find(m=>m.characterId===who);
    for(let n=0;member().hp>0&&member().hp<member().maxHp;n++){
     check(n<12,'bounded healing');press('m');const index=groupItems().findIndex(i=>i.name==='Elixir');check(index>=0,'existing healing supplies');
     for(let j=0;menu.itemCursor!==index;j++){check(j<50,'item reachable');press(menu.itemCursor<index?'ArrowDown':'ArrowUp');}
     press('Enter');for(let j=0;partyFieldMenu.getView().selectedTargetId!==who;j++){check(j<4,'healing target');press('ArrowDown');}press('Enter');press('m');
    }
   }

  };
  result.battles=[];
  const talk=(id,scale,label)=>{const n=NPC_REGISTRY[id];check(n.map===currentContentLocationKey(),'NPC physically present '+id);walk(n.x,n.y+24);press('Enter');check(dialogue.open,'talk '+id);close(label,scale);};
  const visit=(id,scale)=>{const n=NPC_REGISTRY[id];talk(id,scale,id);};
  for(const scale of [1,2]){
   check(storyCheckpointLab.apply('mq7_lantern_house_ready'),'coherent MQ7-ready checkpoint');worldToastTimer=0;Math.random=()=>.5;
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';walk(136,80);press('Enter');close('voss-assignment',scale);press('Enter');check(MainQuest===7&&lantern_stage===2,'accept MQ7');
   check(transitionToLocation({mapId:'MAINLAND_C20R0_MAP',x:240,y:144,facing:'up'}),'world fixture approach');capture('lantern-sign',scale);
   door(7,4,'ArrowUp','LANTERN_TRACK_MAP');capture('guest-road',scale);battle(0,scale);
   door(12,2,'ArrowUp','LANTERN_GULLY_MAP');capture('gully',scale);battle(1,scale);
   door(12,2,'ArrowUp','LANTERN_ORCHARD_MAP');capture('guesthouse',scale);
   door(7,6,'ArrowUp','LANTERN_HALL_MAP');capture('common-room',scale);talk('lantern_neris',scale,'welcome');check(choice.open,'Lely can answer exclusion');press('Enter');close('named-equal',scale);check(lantern_stage===3,'welcome receipt');
   visit('lantern_vena',scale);walk(112,144);press('Enter');close('letters',scale);
   door(12,2,'ArrowUp','LANTERN_BUNKS_MAP');capture('guest-rooms',scale);visit('lantern_mara',scale);visit('lantern_ilan',scale);walk(80,368);press('Enter');close('accord-extract',scale);
   door(7,12,'ArrowDown','LANTERN_HALL_MAP');door(7,12,'ArrowDown','LANTERN_ORCHARD_MAP');talk('lantern_orren',scale,'history');check(lantern_stage===4,'mandatory history');
   door(13,2,'ArrowUp','LANTERN_CHANNEL_MAP');talk('lantern_neris',scale,'tidebound');check(lantern_stage===5,'water route understood');capture('guided-current',scale);battle(2,scale);
   door(3,2,'ArrowUp','LANTERN_BEND_MAP');capture('reed-cut',scale);door(3,2,'ArrowUp','LANTERN_INTAKE_MAP');capture('intake',scale);battle(3,scale);
   door(3,12,'ArrowDown','LANTERN_BEND_MAP');door(12,7,'ArrowRight','LANTERN_COPSE_MAP');capture('old-store',scale);battle(4,scale);walk(400,144);press('Enter');close('supply-cache',scale);check(lantern_cache_taken,'cache collected');
   door(3,12,'ArrowDown','LANTERN_BEND_MAP');door(2,12,'ArrowDown','LANTERN_CHANNEL_MAP');talk('lantern_neris',scale,'after-intake');check(choice.open,'second Lely response');press('ArrowDown');press('Enter');close('politics',scale);check(lantern_stage===6,'political conversation complete');
   door(3,12,'ArrowDown','LANTERN_ORCHARD_MAP');walk(112,336);press('Enter');close('private-bench',scale);press('ArrowDown');press('Enter');close('private-response',scale);check(lantern_stage===7,'private conversation complete');
   check(saveGame()&&loadGame(),'save after mandatory scenes');
   door(7,12,'ArrowDown','LANTERN_GULLY_MAP');door(2,12,'ArrowDown','LANTERN_TRACK_MAP');door(2,12,'ArrowDown','MAINLAND_C20R0_MAP');check(player.x===240&&player.y===144,'safe regional return');
   // Skip only the already-authored overworld hike back to town, not local doors.
   check(transitionToLocation({mapId:'MORNAY_OFFICE_MAP',x:144,y:144,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_office'}}),'office return fixture');walk(136,80);const gold=stats.gold;press('Enter');close('truthful-report',scale);check(lantern_stage===8&&MainQuest===7&&stats.gold===gold+175,'MQ7 completes once without MQ8');check(saveGame()&&loadGame(),'completed save');
   check(persistentParty.serialize().order.join(',')==='lely,esla','residents never recruited');
  }
  result.ok=!result.errors.length;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
