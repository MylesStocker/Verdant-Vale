(async()=>{
 const output=document.getElementById('results'),captures=document.getElementById('captures');
 const nativeRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>1;
 const base=document.createElement('base');base.href='/';document.head.append(base);
 const html=await(await fetch('../index.html')).text();
 for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
 let result={checks:[],battles:[],errors:[]},scale=1,live=false;
 window.addEventListener('error',e=>{result.errors.push(e.message);output.textContent=JSON.stringify(result,null,2);});
 const check=(v,m)=>{if(!v)throw Error(m);result.checks.push(m);};
 const assert={ok:check,equal:(a,b,m)=>check(a===b,m+': '+a+' = '+b),deepEqual:(a,b,m)=>check(JSON.stringify(a)===JSON.stringify(b),m),fail:m=>{throw Error(m);}};
 const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
 const tap=key=>{window.dispatchEvent(new KeyboardEvent('keydown',{key}));window.dispatchEvent(new KeyboardEvent('keyup',{key}));};
 const frames=n=>{for(let i=0;i<(n||1);i++)update(1/60);};
 const g={run:s=>window.eval(s),hold:key=>window.dispatchEvent(new KeyboardEvent('keydown',{key})),release:key=>window.dispatchEvent(new KeyboardEvent('keyup',{key})),frames};
 const close=()=>{for(let i=0;i<100&&dialogue.open;i++){render();tap('Enter');}check(!dialogue.open,'dialogue terminates');};
 const snap=name=>{render();const f=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=canvas.toDataURL();img.width=512*scale;img.height=480*scale;img.alt=name+' '+scale+'x';caption.textContent=img.alt;f.append(img,caption);captures.append(f);};
 const size=n=>{scale=n;canvas.style.width=512*n+'px';canvas.style.height=480*n+'px';};
 const local=(id,x=240,y=400)=>{check(transitionToLocation({mapId:id,x,y,cooldown:true}),'place '+id);dialogue.open=false;dialogue.callbacks=null;choice.open=false;};
 const town=id=>{const b=mornayRoomForMap(id);check(transitionToLocation({mapId:id,x:240,y:b?(mornayInteriorEntrance(b).arrivalRow+.5)*32:432,state:{inTown:true,currentTownId:'mornay',townBuilding:b?.id||null}}),'town placement '+id);dialogue.open=false;};
 const setup=mode=>{check(storyCheckpointLab.apply('mq5_assignment_ready'),'checkpoint');dialogue.open=false;
  if(mode!=='solo')completeMq5Assignment();MainQuest=5;day=1;corvin_favor_started=true;weight_quest_stage=2;
  if(mode==='absent'){town('MORNAY_GATE_INN_MAP');fort_quest_stage=6;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;syncQuestFlagsToWindow();check(fineNeedlework.accept(),'temporary Esla absence');close();}
  stats.hp=stats.maxHp; // Keep the approved MQ5 checkpoint build for pacing review.
  stats.items=['Potion','Potion','Potion','Elixir','Elixir'].map(createItem);
  stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
  Math.random=()=>.5;local('GREAT_FEN_C8RN3_MAP',240,176);combat.cooldown=100000;
 };
function pathTo(g,x,y){
 return J(g,`(()=>{
  const goal=[${x},${y}],start=[player.x,player.y],queue=[start],prev=new Map([[start.join(','),null]]);
  const clear=(a,b)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2);return Array.from({length:n+1},(_,i)=>{
   const t=n?i/n:0,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
   return !TILE_PROPERTIES[tileAt(x,y)]?.isTransition&&canWalk(x,y);
  }).every(Boolean);};
  for(let i=0;i<queue.length;i++){
   const p=queue[i],corner=[goal[0],p[1]];
   if(Math.abs(p[0]-goal[0])<8&&Math.abs(p[1]-goal[1])<8&&clear(p,corner)&&clear(corner,goal)){
    const out=[p];let k=p.join(',');while(prev.get(k)!==null){const q=prev.get(k);out.push(q);k=q.join(',');}
    return out.reverse().concat([corner,goal]);
   }
   for(const d of [[8,0],[-8,0],[0,8],[0,-8]]){
    const q=[p[0]+d[0],p[1]+d[1]],k=q.join(',');
    if(q[0]<9||q[0]>503||q[1]<9||q[1]>471||prev.has(k)||!clear(p,q))continue;
    prev.set(k,p);queue.push(q);
   }
  }return null;
 })()`);
}
function walk(g,x,y,label){
 const map=g.run('mapIdForRef(activeMap)');
 for(let attempt=0;attempt<6;attempt++){
  const points=pathTo(g,x,y);assert.ok(points,label+' has a collision-safe path from the actual entrance');
  let interrupted=false;
  for(let i=1;i<points.length;){
   const a=points[i-1],b=points[i],dx=Math.sign(b[0]-a[0]),dy=Math.sign(b[1]-a[1]);
   if(!dx&&!dy){i++;continue;}
   let j=i;
   while(j+1<points.length&&Math.sign(points[j+1][0]-points[j][0])===dx&&Math.sign(points[j+1][1]-points[j][1])===dy)j++;
   const end=points[j],distance=Math.abs(end[0]-a[0])+Math.abs(end[1]-a[1]);
   assert.equal(distance%g.run('SPEED'),0,'path uses ordinary movement increments');
   const key=dx<0?'ArrowLeft':dx>0?'ArrowRight':dy<0?'ArrowUp':'ArrowDown';
   g.hold(key);try{g.frames(distance/g.run('SPEED'));}finally{g.release(key);}
   assert.equal(g.run('mapIdForRef(activeMap)'),map,label+' cannot accidentally enter another door');
   if(g.run('player.x')!==end[0]||g.run('player.y')!==end[1]){interrupted=true;break;}
   i=j+1;
  }
  if(!interrupted){assert.deepEqual(J(g,'[player.x,player.y]'),[x,y],label);return;}
 }
 assert.fail(label+' remained blocked after live patrol replanning');
}
function reachable(g) {
  return J(g,`(()=>{
    const start=[player.x,player.y],queue=[start],seen=new Set([start.join(',')]),out=[];
    for(let i=0;i<queue.length;i++){
      const p=queue[i];out.push(p);
      for(const d of [[8,0],[-8,0],[0,8],[0,-8]]){
        const x=p[0]+d[0],y=p[1]+d[1],k=x+','+y;
        if(x<9||x>503||y<9||y>471||seen.has(k))continue;
        if(TILE_PROPERTIES[tileAt(x,y)]?.isTransition)continue;
        if(![.25,.5,.75,1].every(t=>canWalk(p[0]+d[0]*t,p[1]+d[1]*t)))continue;
        seen.add(k);queue.push([x,y]);
      }
    }return out;
  })()`);
}

 const talk=id=>{const n=SIMPLE_NPCS.find(n=>n.id===id),p=reachable(g).find(([x,y])=>Math.hypot(x-n.x,y-n.y)<28&&SIMPLE_NPCS.find(q=>q.map===currentContentLocationKey()&&Math.hypot(q.x-x,q.y-y)<28)?.id===id);check(!!p,'reachable '+id);walk(g,...p,id);tap(' ');check(dialogue.open,'talk '+id);};
 const door=(col,row)=>{const d=THIRD_LOCK_DOORS.find(d=>d.source===mapIdForRef(activeMap)&&d.col===col&&d.row===row);check(!!d,'authored door');const dy=row<=4?-1:row>=13?1:0,dx=dy?0:col<7?-1:1;walk(g,(col+.5-dx)*32,(row+.5-dy)*32,'door approach');const key=dy<0?'ArrowUp':dy>0?'ArrowDown':dx<0?'ArrowLeft':'ArrowRight';g.hold(key);for(let i=0;i<90&&mapIdForRef(activeMap)===d.source;i++)frames(1);g.release(key);check(mapIdForRef(activeMap)===d.target,'door '+d.target);};
 const view=()=>canonicalPartyCombat.getView();
 const choose=name=>{let n=0;while(view().selectedCommand!==name){check(n++<6,'command selection bounded');tap('ArrowRight');}tap('Enter');};
 const target=id=>{let n=0;while(id&&view().selectedTargetInstanceId!==id){check(n++<6,'target selection bounded');tap('ArrowRight');}tap('Enter');};
 const item=(id,to)=>{choose('item');let n=0;while(view().selectedItemId!==id){check(n++<60,'item selection bounded');tap('ArrowDown');}tap('Enter');if(view().phase==='targeting')target(to);};
 const fight=id=>{const b=STRUCK_ENTRY_BATTLES[id];walk(g,b.x*32,b.y*32+32,'encounter approach');snap('encounter-'+id);tap(' ');close();tap('Enter');check(view().active,'ordinary encounter input');snap('battle-'+id);
  const startHp=view().party.map(m=>m.hp);let turns=0,baned=false;
  while(view().active){check(turns++<80,'battle terminates');
   while(view().phase==='awaiting_action'){
    const v=view(),actor=v.party.find(m=>m.instanceId===v.currentAlly?.instanceId)||v.party.find(m=>m.characterId===v.currentAlly?.characterId)||v.party.find(m=>m.instanceId===v.nextActorId);
    const hurt=v.party.filter(m=>m.hp>0&&m.hp<m.maxHp/2).sort((a,b)=>a.hp-b.hp)[0];
    const available=id=>v.inventory.filter(x=>x===id).length>(v.reservedInventory.find(x=>x.itemId===id)?.quantity||0);
    const enemy=v.enemies.filter(m=>m.hp>0).sort((a,b)=>a.hp-b.hp)[0];
    if(hurt&&available('Elixir'))item('Elixir',hurt.instanceId);
    else if(hurt&&available('Potion'))item('Potion',hurt.instanceId);
    else if(id===3&&!baned&&available('Trollbane')){item('Trollbane',v.enemies[0].instanceId);baned=true;}
    else if(id===4&&v.enemies[0].hp>0&&available('Sapper Charge'))item('Sapper Charge',v.enemies[0].instanceId);
    else {choose('attack');target(enemy.instanceId);}
   }
   if(view().phase==='ready')tap('Enter');
   for(let i=0;['playback','playback_complete'].includes(view().phase);i++){check(i<300,'playback bounded');if(partyBattleQuickbloomAnimation.blocksAdvance(view())||partyBattleOffensiveResonanceAnimation.blocksAdvance(view()))frames(1);else tap('Enter');}
   if(['victory','defeat','escape'].includes(view().phase)){check(view().phase==='victory','real victory '+id+' '+JSON.stringify({party:view().party,enemies:view().enemies,inventory:view().inventory}));result.battles.push({scale,id,turns,startHp,endHp:view().party.map(m=>m.hp)});tap('Enter');}
  }close();check(!!(struck_entry_wins&(1<<id)),'victory receipt '+id);
 };
 document.getElementById('run').onclick=async()=>{live=false;result={checks:[],battles:[],errors:[]};captures.replaceChildren();output.textContent='RUNNING';
 try{for(const n of [1,2]){size(n);setup(n===1?'solo':'party');
  snap('fen-marker');tap(' ');close();tap('Enter');check(mapIdForRef(activeMap)==='THIRD_LOCK_APPROACH_MAP','marker entry');
  fight(0);door(7,1);snap('cottages');door(3,4);talk('struck_elset');close();walk(g,432,80,'relief chest');tap(' ');close();door(7,13);
  fight(1);door(12,4);talk('struck_heddra');snap('survivors');if(n===2){while(dialogue.open&&dialoguePagePresentation().styleId!=='esla_light_green')tap('Enter');check(dialoguePagePresentation().styleId==='esla_light_green','Esla green');snap('esla-care');}close();check(struck_entry_stage===2,'survivors contacted');
  check(saveGame()&&loadGame(),'shelter save/load');dialogue.open=false;door(7,13);door(1,6);fight(2);door(7,1);fight(3);snap('cleared-crossing');door(7,13);door(7,13);
  door(14,9);fight(4);walk(g,272,112,'optional cache');tap(' ');snap('cache-reward');close();door(7,13);
  door(12,4);talk('struck_heddra');close();check(struck_entry_stage===3,'rescued');check(mapIdForRef(activeMap)==='THIRD_LOCK_COTTAGES_MAP','player not ferried');snap('rescued-settlement');
  town('MORNAY_GATE_INN_MAP');talk('struck_heddra');snap('mornay-heddra');close();town('MORNAY_INFIRMARY_MAP');talk('struck_belric');snap('mornay-belric');close();
  check(transitionToLocation({mapId:'OFFICE_MAP',x:240,y:304,state:{inTown:true,currentTownId:'calwick',townBuilding:'office'}}),'Calwick office return fixture');dialogue.open=false;
  talk('corvin');snap('corvin-resolution');close();check(corvin_favor_done&&struck_entry_stage===4&&!weight_note_signed,'favour complete without automatic countersignature');
  talk('corvin');close();check(weight_note_signed&&weight_quest_stage===2&&!cabinetCaseFlag,'countersigned, filing still separate');
  walk(g,144,100,'cabinet approach');tap(' ');close();check(choice.open&&choice.options.length===3,'filing choice');snap('filing-choice');tap('Enter');close();check(weight_quest_stage===3&&cabinetCaseFlag,'player files correction');
  check(transitionToLocation({mapId:'DRENWICK_HARBORMASTER_MAP',x:240,y:368,state:{inTown:true,currentTownId:'drenwick',townBuilding:'harbormaster'}}),'Renn return fixture');dialogue.open=false;
  const gold=stats.gold;talk('harbormaster_interior');snap('renn-resolution');close();check(weight_quest_stage===4&&stats.gold===gold+60,'Renn pays existing 60g');

 }
 size(1);setup('absent');struck_entry_stage=1;struck_entry_wins=3;local('THIRD_LOCK_SHELTER_MAP');talk('struck_heddra');check(!dialogue.pageSpeakers.includes('esla'),'absent Esla suppressed');snap('solo-care');close();
 output.textContent=JSON.stringify({status:'PASS',checks:result.checks.length,battles:result.battles,errors:result.errors},null,2);
 }catch(e){result.errors.push(e.stack);output.textContent=JSON.stringify({status:'FAIL',...result},null,2);} };
 const play=mode=>{live=false;setup(mode);live=true;const loop=()=>{if(!live)return;update(1/60);render();nativeRAF(loop);};nativeRAF(loop);output.textContent='Manual fixture: '+mode+'. Ordinary controls; start at the Great Fen marker. Test resources: approved MQ5 checkpoint build, unequipped, 3 Potions, 2 Elixirs.';canvas.focus();};
 document.getElementById('solo').onclick=()=>play('solo');document.getElementById('party').onclick=()=>play('party');document.getElementById('absent').onclick=()=>play('absent');
 document.getElementById('native').onclick=()=>size(1);document.getElementById('double').onclick=()=>size(2);
 output.textContent='READY — run automated ordinary-input route at both scales, or choose a manual fixture.';
})().catch(e=>{document.getElementById('results').textContent=e.stack;});
