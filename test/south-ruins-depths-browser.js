'use strict';
(async()=>{
 const result={ok:false,checks:[],captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 const check=(v,n)=>{if(!v)throw Error(n);result.checks.push(n);};
 window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
  const key=(k,on)=>window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{key:k,bubbles:true}));
  const press=k=>{key(k,true);key(k,false);};
  const capture=(name,scale,paint=true)=>{if(paint)render();const out=document.createElement('canvas');out.width=512*scale;out.height=480*scale;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name:name+'-'+scale+'x',png:out.toDataURL()});};
  const init=()=>{storyCheckpointLab.apply('mq5_mornay_report_ready');mq5_report_delivered=true;MainQuest=6;greybank_stage=4;greybank_wins=15;greybank_vision_seen=true;dialogue.open=false;choice.open=false;};
  const place=(id,x,y)=>{check(transitionToLocation({mapId:id,x,y,state:id==='DUNGEON8_WEST_LOWER2_MAP'?{inDungeon:true,dungeonFloor:13}:{}}),'fixture '+id);dialogue.open=false;combat.cooldown=100000;};
  function walk(d){
   const start=[Math.floor(player.x/TILE),Math.floor(player.y/TILE)],q=[start],prev=new Map([[start.join(','),null]]),goal=d.col+','+d.row;
   const blocked=new Set(SOUTH_DEPTH_DOORS.filter(p=>p.source===d.source&&p!==d).map(p=>p.col+','+p.row));
   for(let i=0;i<q.length&&!prev.has(goal);i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
    const [x,y]=q[i],xx=x+dx,yy=y+dy,k=xx+','+yy;
    if(WALKABLE[activeMap[yy]?.[xx]]&&!prev.has(k)&&!blocked.has(k)){prev.set(k,[x,y]);q.push([xx,yy]);}
   }
   check(prev.has(goal),'path '+d.source+' -> '+d.target);let p=[d.col,d.row],path=[];
   while(prev.get(p.join(','))!==null){path.unshift(p);p=prev.get(p.join(','));}
   for(const [x,y]of path){
    const k=(x+.5)*32<player.x?'ArrowLeft':(x+.5)*32>player.x?'ArrowRight':(y+.5)*32<player.y?'ArrowUp':'ArrowDown';key(k,true);
    for(let n=0;n<16;n++){update(1/60);if(mapIdForRef(activeMap)!==d.source)break;}key(k,false);
    if(mapIdForRef(activeMap)!==d.source)return;
   }
  }
  init();const gate=SOUTH_DEPTH_DOORS.find(d=>d.gate);
  for(const scale of [1,2]){
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   greybank_stage=3;place(gate.source,208,336);walk(gate);check(mapIdForRef(activeMap)===gate.source,'blocked before MQ6 '+scale);capture('sealed-descent',scale);
   greybank_stage=4;place(gate.source,208,336);capture('open-descent',scale);walk(gate);check(mapIdForRef(activeMap)===gate.target,'open after MQ6 '+scale);
   for(const d of SOUTH_DEPTH_DOORS){
    const back=SOUTH_DEPTH_DOORS.find(r=>r.source===d.target&&r.target===d.source);place(d.source,back.x,back.y);
    check(saveGame()&&loadGame(),'save/load '+d.source);dialogue.open=false;combat.cooldown=100000;walk(d);
    check(mapIdForRef(activeMap)===d.target&&player.x===d.x&&player.y===d.y,'controls and landing '+d.source+' -> '+d.target);
   }
   for(const f of SOUTH_DEPTH_FLOORS){
    const id=southDepthId(f.level,f.descent),d=SOUTH_DEPTH_DOORS.find(d=>d.source===id&&d.stairs==='down');
    place(id,(d.col+.5)*32,(d.row===3?5.5:9.5)*32);capture('floor-'+f.level,scale);
   }
   for(const c of SOUTH_DEPTH_CHESTS){
    place(c.mapId,c.x,c.y-24);capture(c.id,scale);const gold=stats.gold;
    press('Enter');check(c.opened,'chest opens '+c.id);while(dialogue.open)press('Enter');
    check(stats.gold===gold+(scale===1?c.gold:0),'chest once '+c.id);check(saveGame()&&loadGame(),'chest reload '+c.id);dialogue.open=false;
   }
  }
  // Canvas evidence for palette, silhouette, retained motion and read-only paint.
  const snapshot=()=>JSON.stringify({stats,party:persistentParty.serialize(),greybank_stage,greybank_wins,player});
  for(const e of SOUTH_DEPTH_ENEMIES){
   const entry=ENEMY_SPRITE_DISPATCH[e.id],before=snapshot(),pixels=[];
   for(const t of [0,13]){
    tick=t;ctx.fillStyle='#17101e';ctx.fillRect(0,0,512,480);ctx.fillStyle='#e7d9bb';ctx.font='16px monospace';ctx.textAlign='left';ctx.fillText(e.name+' — '+e.hp+' HP',24,35);
    entry.draw(256,230);pixels.push(canvas.toDataURL());if(t===13)for(const s of [1,2])capture(e.id,s,false);
   }
   check(pixels[0]!==pixels[1],'animated '+e.id);check(before===snapshot(),'read-only sprite '+e.id);
  }
  init();place('SOUTH_DEPTH_6_0_MAP',112,144);Math.random=()=>.5;startCombat();check(canonicalPartyCombat.getView().active,'actual random party combat');for(const s of [1,2])capture('deep-battle',s);
  check(result.errors.length===0,'no browser errors');result.ok=true;
 }catch(error){result.errors.push(error.stack||String(error));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
