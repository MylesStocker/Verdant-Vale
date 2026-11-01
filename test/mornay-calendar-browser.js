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

  const place=(mapId,x,y)=>{
   const b=mornayRoomForMap(mapId),entrance=b?mornayInteriorEntrance(b):null;
   check(transitionToLocation({mapId,x:x??240,y:y??(entrance?(entrance.arrivalRow+.5)*32:432),state:{inTown:true,currentTownId:'mornay',townBuilding:b?b.id:null}}),'fixture placement');
   dialogue.open=false;
  };
  const dismiss=(captureName,scale)=>{
   for(let n=0;dialogue.open;n++){
    check(n<90,'bounded conversation');render();
    ctx.save();ctx.font='14px "Courier New", monospace';
    check(dialogue.pages[dialogue.page].every(line=>ctx.measureText(line).width<=464),'text fits real Canvas');ctx.restore();
    const p=dialoguePagePresentation();check(p.styleId===(p.speakerId==='esla'?'esla_light_green':null),'speaker-specific styling');
    if(n===0&&captureName)capture(captureName,scale);press('Enter');
   }
  };
  const talk=id=>{
   const n=MORNAY_NPCS.find(n=>n.id===id),r=MORNAY_RESIDENTS.find(n=>n.id===id);
   place(isDayOff()&&r.dayOff?r.dayOff.mapId:r.mapId);
   const start=[player.x,player.y],queue=[start],seen=new Set([start.join(',')]);let target=null;
   for(let i=0;i<queue.length&&!target;i++){
    const p=queue[i];if(SIMPLE_NPCS.find(q=>q.map===currentContentLocationKey()&&Math.hypot(p[0]-q.x,p[1]-q.y)<TALK_RADIUS)?.id===id){target=p;break;}
    for(const [dx,dy]of [[8,0],[-8,0],[0,8],[0,-8]]){
     const x=p[0]+dx,y=p[1]+dy,k=x+','+y;if(x<9||x>503||y<9||y>471||seen.has(k)||TILE_PROPERTIES[tileAt(x,y)]?.isTransition)continue;
     if(![.25,.5,.75,1].every(t=>canWalk(p[0]+dx*t,p[1]+dy*t)))continue;
     seen.add(k);queue.push([x,y]);
    }
   }
   check(!!target,'reachable '+id);walk(...target);press('Enter');check(dialogue.open&&dialogue.name===n.name,'keyboard conversation '+id);
  };
  for(const scale of [1,2]){
   check(storyCheckpointLab.apply('mq5_mornay_report_ready'),'coherent party fixture');day=5;worldToastTimer=0;
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   for(const id of ['mornay_provisioner','mornay_school','mornay_office']){
    const b=mornayBuilding(id);place(b.sourceMapId,(b.returnCol+.5)*32,(b.returnRow+.5)*32);hold('ArrowUp',18);
    check(mapIdForRef(activeMap)===b.sourceMapId&&dialogue.open,'closed '+id);dismiss(id+'-dayoff',scale);
   }
   talk('mornay_neris_kelm');dismiss('merchant-dayoff',scale);check(!shop.open,'loaded merchant refuses Dayoff trade');
   talk('mornay_vessa_kest');dismiss('dayoff-offer',scale);check(choice.open,'Dayoff offer');press('Enter');dismiss();check(mornay_dayoff_music===1,'accepted');
   check(saveGame()&&loadGame(),'accepted job save/load');dismiss();day=6;
   talk('mornay_enna_quist');dismiss('neighbour-request',scale);check(mornay_dayoff_music===2,'Enna heard');
   talk('mornay_hessa_vane');dismiss('supper-request',scale);check(mornay_dayoff_music===3,'Hessa heard');
   const gold=stats.gold;talk('mornay_vessa_kest');dismiss('supper-payment',scale);check(mornay_dayoff_music===4&&stats.gold===gold+60,'paid once on workday');
   talk('mornay_vessa_kest');dismiss();check(stats.gold===gold+60,'repeat cannot pay again');
   check(saveGame()&&loadGame(),'completed job save/load');dismiss();check(mornay_dayoff_music===4,'completion persisted');
   for(const o of [
    {id:'mornay_maelin_rook',day:10,early:true,count:1,bit:1},
    {id:'mornay_jessa_fallow',day:14,early:true,count:2,bit:2},
    {id:'mornay_fennel_ashe',day:16,count:8,bit:4},
    {id:'mornay_ressa_muir',day:21,count:3,bit:8},
    {id:'mornay_enna_quist',day:26,count:2,bit:16}
   ]){
    day=o.early?o.day+1:o.day-1;talk(o.id);dismiss();check(!choice.open,'unavailable outside window '+o.id);
    day=o.day;talk(o.id);dismiss(o.id+'-offer',scale);check(choice.open,'date-bound offer '+o.id);
    const count=stats.items.length;press('Enter');dismiss(o.id+'-found',scale);
    check(stats.items.length===count+o.count&&(mornay_calendar_claims&o.bit),'correct one-time reward '+o.id);
    check(saveGame()&&loadGame(),'dated reward save/load');dismiss();talk(o.id);dismiss();
    check(!choice.open&&stats.items.length===count+o.count,'no repeat reward '+o.id);
   }
   check(mornay_calendar_claims===31,'all five claims persist independently');

  }
  check(result.errors.length===0,'no browser errors');result.ok=true;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
