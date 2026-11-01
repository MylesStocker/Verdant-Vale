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
  for(const scale of [1,2])for(const solo of [false,true]){
   check(storyCheckpointLab.apply('mq5_mornay_report_ready'),'coherent report checkpoint');worldToastTimer=0;
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   if(solo){
    check(transitionToLocation({mapId:'MORNAY_GATE_INN_MAP',x:240,y:432,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_gate_inn'}}),'Needlework fixture');check(fineNeedlework.accept(),'real absence transaction');
    check(transitionToLocation({mapId:'MORNAY_OFFICE_MAP',x:144,y:144,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_office'}}),'office approach');
   }
   check(saveGame()&&loadGame(),'pre-delivery save/load');hold('ArrowUp',32);hold('ArrowLeft',4);
   check(player.x===136&&player.y===80,'ordinary approach to Voss');press('Enter');check(mornayReport.isActive(),'audience starts');
   check(!!mornayReport.companion()===!solo,'correct companion projection');
   const before=JSON.stringify({stats,party:persistentParty.serialize(),day,statusEffects,MainQuest});
   let green=false,witness=false;
   for(let n=0;dialogue.open;n++){
    check(n<80,'dialogue finishes');render();const p=dialoguePagePresentation();check(!mq5_report_delivered,'completion waits for final dismissal');
    check(dialogue.pages[dialogue.page].length<=3,'bounded visual page');
    ctx.save();ctx.font='14px "Courier New", monospace';check(dialogue.pages[dialogue.page].every(line=>ctx.measureText(line).width<=464),'real Canvas text fits');ctx.restore();
    if(p.speakerId==='lely'&&!witness){witness=true;if(!solo)capture('lely-account',scale);}
    if(p.speakerId==='esla'){check(!solo&&p.styleId==='esla_light_green','Esla owns green page');if(!green)capture('esla-audience',scale);green=true;}
    else check(p.styleId===null,'default style does not inherit green');
    if(n===0&&solo)capture('solo-audience',scale);
    press('Enter');
   }
   check(witness&&green===!solo,'right speakers heard');check(mq5_report_delivered&&MainQuest===5,'MQ5 complete without next mission');
   check(before===JSON.stringify({stats,party:persistentParty.serialize(),day,statusEffects,MainQuest}),'resources and party unchanged');
   check(saveGame()&&loadGame()&&mq5_report_delivered,'post-delivery save/load');
   press('Enter');check(!mornayReport.isActive(),'repeat does not repeat MQ5');while(dialogue.open)press('Enter');check(greybank_stage===1,'next deliberate talk offers MQ6');press('ArrowDown');press('Enter');check(MainQuest===5,'declining keeps MQ6 inactive');
   walk(240,432);hold('ArrowDown',10);check(mapIdForRef(activeMap)==='MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP','walk back into Mornay');
   check(saveGame()&&loadGame(),'free exploration remains saveable');
  }
  check(result.errors.length===0,'no browser errors');result.ok=true;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
