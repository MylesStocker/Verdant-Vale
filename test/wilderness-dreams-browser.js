/* Isolated keyboard/Canvas review, never loaded in the game. */
(async()=>{
 const result={checks:[],captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 const check=(ok,name)=>{if(!ok)throw Error(name);result.checks.push(name);};
 window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1]+'?dream-review=1';s.onload=resolve;s.onerror=reject;document.body.append(s);});
  const key=(key,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));
  const tap=k=>{key(k,true);key(k,false);};
  const capture=(name,scale)=>{render();const out=document.createElement('canvas');out.width=512*scale;out.height=480*scale;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name:name+'-'+scale+'x',png:out.toDataURL()});};
  for(const scale of [1,2]){
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'checkpoint '+scale);dialogue.open=false;debugMode=true;worldToastTimer=0;persistentParty.joinEsla();
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   for(const d of WILDERNESS_DREAMS){
    window[d.flag]=false;
    const place=()=>transitionToLocation({mapId:d.mapId,x:d.col*32-1,y:d.row*32+16,state:{},facing:'right'});
    check(place(),'site placement '+d.id);dialogue.open=false;
    key('ArrowRight',true);update(1/60);key('ArrowRight',false);
    check(wildernessDreams.isActive()&&activeMap===DREAM_MAP,'walking entry '+d.id);capture(d.id+'-dream',scale);
    const pixel=ctx.getImageData(8,8,1,1).data;check(pixel[0]===255&&pixel[1]===255&&pixel[2]===255,'white background '+d.id);
    check(!saveGame()&&!loadGame(),'white scene save guard '+d.id);
    let pages=0;while(wildernessDreams.isActive()&&pages++<20){render();tap('Enter');}
    check(!wildernessDreams.isActive()&&mapIdForRef(activeMap)===d.mapId,'waking return '+d.id);
    check(dialoguePagePresentation().styleId===null,'uncoloured narration '+d.id);
    if(d.id==='shingle')capture('shingle-aftermath',scale);
    tap('Enter');check(dialoguePagePresentation().styleId==='esla_light_green','Esla green words '+d.id);
    capture(d.id+'-esla',scale);tap('Enter');
    check(!dialogue.open&&saveGame()&&loadGame(),'waking save/load '+d.id);
    for(let i=0;i<10&&dialogue.open;i++)tap('Enter');
    check(place(),'repeat placement '+d.id);key('ArrowRight',true);update(1/60);key('ArrowRight',false);
    check(!wildernessDreams.isActive()&&window[d.flag],'no repeat '+d.id);
   }
  }
  check(result.errors.length===0,'no browser errors');result.ok=true;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
