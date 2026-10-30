/* Isolated real Canvas and keyboard review; never loaded by the game. */
(async()=>{
 const result={checks:[],captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 const check=(ok,name)=>{if(!ok)throw Error(name);result.checks.push(name);};
 window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1]+'?rocky-review=1';s.onload=resolve;s.onerror=reject;document.body.append(s);});
  const key=(key,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));
  const tap=k=>{key(k,true);key(k,false);};const frames=n=>{for(let i=0;i<n;i++)update(1/60);};
  const place=(id,x,y)=>{check(transitionToLocation({mapId:id,x,y,state:{}}),'placement '+id);dialogue.open=false;};
  const capture=(name,scale)=>{render();const out=document.createElement('canvas');out.width=512*scale;out.height=480*scale;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name:name+'-'+scale+'x',png:out.toDataURL()});};
  for(const scale of [1,2]){
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'MQ5 checkpoint');dialogue.open=false;debugMode=true;worldToastTimer=0;persistentParty.joinEsla({level:20});stats.hp=stats.maxHp=2000;stats.atk=90;stats.def=25;stats.spd=30;
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   for(const legacy of [false,true]){
    forceLegacyRegionalView=legacy;place('VALMERE_EXPANSE_C14RN3_MAP',240,176);
    check(currentEncounterPool()!==ROCKY_BEACH_ENEMY_TEMPLATES,'grass pool');
    key('ArrowRight',true);try{for(let i=0;i<45&&tileAt(player.x,player.y)!==ROCKY_BEACH;i++)frames(1);}finally{key('ArrowRight',false);}
    check(currentEncounterPool()===ROCKY_BEACH_ENEMY_TEMPLATES,'keyboard beach entry '+legacy);
    const p=JSON.stringify(regionalWorldPosition());check(saveGame()&&loadGame(),'beach save/load');dialogue.open=false;check(JSON.stringify(regionalWorldPosition())===p,'same canonical position');
    key('ArrowLeft',true);try{for(let i=0;i<30&&tileAt(player.x,player.y)===ROCKY_BEACH;i++)frames(1);}finally{key('ArrowLeft',false);}
    check(currentEncounterPool()!==ROCKY_BEACH_ENEMY_TEMPLATES,'keyboard beach return '+legacy);
   }
   forceLegacyRegionalView=false;
   for(const id of ['VALMERE_EXPANSE_C14RN3_MAP','MAINLAND_C20RN1_MAP','MAINLAND_C10RN12_MAP']){
    const map=mapRefForId(id),i=map.flat().findIndex(t=>t===ROCKY_BEACH);check(i>=0,'beach view');place(id,(i%16+.5)*32,(Math.floor(i/16)+.5)*32);capture(id,scale);
   }
   for(const [id,selection]of [['enemy_shingleback_crab',.25],['enemy_storm_gull',.75]]){
    place('VALMERE_EXPANSE_C14RN3_MAP',304,176);debugMode=false;combat.cooldown=0;player.step=15;
    const tape=[0,selection,.5];Math.random=()=>tape.length?tape.shift():.5;
    key('ArrowDown',true);try{for(let i=0;i<8&&!canonicalPartyCombat.getView().active;i++)frames(1);}finally{key('ArrowDown',false);}
    check(canonicalPartyCombat.getView().active,'walking triggers encounter');
    check(canonicalPartyCombat.getView().enemies[0].id===id,'correct terrain enemy '+id);capture(id,scale);
    // Play ordinary Attack commands through to victory (high-level QA party).
    for(let i=0;i<600&&canonicalPartyCombat.getView().active;i++){frames(10);tap('Enter');}
    check(!canonicalPartyCombat.getView().active,'ordinary battle completion '+id);
    check(stats.hp>0,'party survives QA battle');debugMode=true;dialogue.open=false;
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
