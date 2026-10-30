/* Isolated real Canvas/keyboard review; never loaded by production. */
(async()=>{
 const result={checks:[],captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 const check=(ok,name)=>{if(!ok)throw Error(name);result.checks.push(name);};
 window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1]+'?cave-review=1';s.onload=resolve;s.onerror=reject;document.body.append(s);});
  const key=(key,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));
  const frames=n=>{for(let i=0;i<n;i++)update(1/60);};
  const capture=(name,scale)=>{render();const out=document.createElement('canvas');out.width=512*scale;out.height=480*scale;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name:name+'-'+scale+'x',png:out.toDataURL()});};
  const walk=(gx,gy)=>{
   const start=[Math.floor(player.x/32),Math.floor(player.y/32)],queue=[start],prev=new Map([[start.join(','),null]]);
   for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
    const x=queue[i][0]+dx,y=queue[i][1]+dy,k=x+','+y,t=activeMap[y]?.[x];
    if(!prev.has(k)&&TILE_PROPERTIES[t]?.walkable&&!TILE_PROPERTIES[t]?.isTransition&&canWalk(x*32+16,y*32+16)){prev.set(k,queue[i]);queue.push([x,y]);}
   }
   const end=gx+','+gy;check(prev.has(end),'walkable route '+end);
   const route=[[gx,gy]];let p=prev.get(end);while(p){route.push(p);p=prev.get(p.join(','));}route.reverse();
   for(const [x,y]of route.slice(1)){
    const dx=x*32+16-player.x,dy=y*32+16-player.y,k=dx<0?'ArrowLeft':dx>0?'ArrowRight':dy<0?'ArrowUp':'ArrowDown';
    key(k,true);frames((Math.abs(dx)+Math.abs(dy))/SPEED);key(k,false);
    check(player.x===x*32+16&&player.y===y*32+16,'collision-safe ordinary step');
   }
  };
  const press=k=>{key(k,true);key(k,false);};
  const dismiss=()=>{for(let i=0;dialogue.open;i++){check(i<35,'dialogue completes');press(' ');}};
  const place=d=>{check(transitionToLocation({mapId:d.mapId,x:d.col*32+16,y:d.row*32+16}),'site placement');dialogue.open=false;};
  const view=()=>canonicalPartyCombat.getView();
  const input=k=>{partyBattleQuickbloomAnimation.update(view(),10);canonicalPartyCombat.handleInput(k);};
  const win=()=>{
   for(let r=0;view().active;r++){
    check(r<25,'battle resolves');
    while(view().phase==='awaiting_action'){
     for(let n=0;view().selectedCommand!=='attack';n++){check(n<8,'attack available');input('right');}
     input('confirm');if(view().phase==='targeting')input('confirm');
    }
    if(view().phase==='ready')input('confirm');
    for(let n=0;view().phase==='playback';n++){check(n<160,'playback resolves');input('confirm');}
    if(view().phase==='playback_complete')input('confirm');
    if(view().phase==='victory')input('confirm');
    check(view().phase!=='fault','no combat fault');
   }dismiss();
  };
  for(const scale of [1,2])for(const legacy of [false,true]){
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'checkpoint');dialogue.open=false;debugMode=true;worldToastTimer=0;forceLegacyRegionalView=legacy;
   stats.hp=stats.maxHp=600;stats.atk=1000;stats.def=60;stats.spd=100;
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   for(const d of WILDERNESS_DISCOVERIES){
    place(d);check(!PICKUP_REGISTRY[d.id].picked,'site starts available');
    if(!d.enemies){
     if(d.col===10&&d.row===9&&!legacy){walk(10,10);capture('grass-supply',scale);walk(10,9);}
     press(' ');dismiss();check(PICKUP_REGISTRY[d.id].picked,'examine collects '+d.id);
    }else{
     press(' ');dismiss();check(choice.open,'choice opens');if(!legacy)capture(d.id+'-choice',scale);
     for(let n=0;n<choice.options.length-1;n++)press('ArrowDown');press('Enter');
     check(!PICKUP_REGISTRY[d.id].picked&&!view().active,'leave is harmless');
     press(' ');dismiss();press('Enter');check(view().active,'fight starts');
     if(!legacy)capture(d.id+'-battle',scale);win();check(PICKUP_REGISTRY[d.id].picked,'victory collects once');
    }
    check(saveGame()&&loadGame(),'save/load discovery');dialogue.open=false;press(' ');dismiss();check(!choice.open&&!view().active,'resolved site inert');
   }
   const d=WILDERNESS_DISCOVERIES[9];PICKUP_REGISTRY[d.id].picked=false;
   check(transitionToLocation({mapId:d.mapId,x:176,y:272}),'hidden approach');
   check(activeMap[6][5]===WORLD_HOLLOW&&activeMap[7][5]===WORLD_HOLLOW,'concealed passage retains tree terrain');
   render();
   const point=regionalWorldPosition(),plan=buildContinuousWorldPlanFromWorld(point.regionId,point.worldPxX,point.worldPxY,512,480);
   const sx=legacy?176:24*512+176-plan.camPxX,sy=legacy?208:2*480+208-plan.camPxY;
   const pixel=Array.from(ctx.getImageData(sx,sy,1,1).data);
   const adjacent=Array.from(ctx.getImageData(sx+32,sy,1,1).data);
   check(pixel.join(',')===adjacent.join(','),'hidden entrance visibly uses normal tree foliage: '+pixel+' / '+adjacent);
   if(!legacy)capture('hidden-approach',scale);
   press(' ');check(dialogue.open,'bootmark clue');dismiss();
   walk(5,5);walk(5,4);if(!legacy)capture('hidden-cache',scale);walk(4,4);
   press(' ');dismiss();check(PICKUP_REGISTRY[d.id].picked,'hidden cache taken');
   check(saveGame()&&loadGame(),'save inside hidden pocket');dialogue.open=false;walk(5,8);check(regionalInvariantErrors().length===0,'walk back through trees');
  }
  const bounds=regionPixelBounds('overworld'),scale=4/32;
  canvas.width=Math.round(bounds.widthPx*scale);canvas.height=Math.round(bounds.heightPx*scale);
  ctx.fillStyle='#162630';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(scale,0,0,scale,-bounds.leftPx*scale,-bounds.topPx*scale);
  for(const c of Object.values(REGIONAL_CHUNK_CATALOG))drawMapTiles(c.map,c.chunkX*512,c.chunkY*480);
  ctx.setTransform(1,0,0,1,0,0);result.captures.push({name:'production-overview',png:canvas.toDataURL()});
  check(result.errors.length===0,'no browser errors');result.ok=true;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
