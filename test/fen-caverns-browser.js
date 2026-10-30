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
  const route=[['FEN_CAVE_ROOTS_MAP',7,3,'ArrowUp'],['FEN_CAVE_POOL_MAP',4,11,'ArrowDown'],['FEN_CAVE_DESCENT_MAP',4,11,'ArrowDown'],['FEN_RUIN_RISE_MAP',7,11,'ArrowDown'],['FEN_CAVE_DESCENT_MAP',8,5,'ArrowUp'],['FEN_CAVE_POOL_MAP',11,3,'ArrowUp'],['FEN_CAVE_ROOTS_MAP',11,3,'ArrowUp'],['MAINLAND_CN3RN14_MAP',10,3,'ArrowUp']];
  for(const scale of [1,2]){
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'checkpoint');dialogue.open=false;debugMode=true;worldToastTimer=0;
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   for(const legacy of [false,true]){
    forceLegacyRegionalView=legacy;
    check(transitionToLocation({mapId:'MAINLAND_CN3RN14_MAP',x:240,y:112,facing:'up'}),'north approach');const seen=new Set();
    if(!legacy)capture('north-opening',scale);
    for(const [target,col,row,k]of route){
     walk(col,row);key(k,true);for(let i=0;i<40&&mapIdForRef(activeMap)!==target;i++)frames(1);key(k,false);
     check(mapIdForRef(activeMap)===target,'ordinary passage '+target+' '+legacy);
     check(canWalk(player.x,player.y)&&regionalInvariantErrors().length===0,'safe arrival');
     const state=JSON.stringify({id:mapIdForRef(activeMap),world:regionalWorldPosition(),x:player.x,y:player.y,f:player.facing});
     check(saveGame()&&loadGame(),'save/load');dialogue.open=false;
     check(state===JSON.stringify({id:mapIdForRef(activeMap),world:regionalWorldPosition(),x:player.x,y:player.y,f:player.facing}),'exact restore');frames(4);
     check(mapIdForRef(activeMap)===target,'no arrival bounce');
     if(!legacy&&!seen.has(target)&&target!=='MAINLAND_CN3RN14_MAP')capture(target,scale);seen.add(target);
    }
   }
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
