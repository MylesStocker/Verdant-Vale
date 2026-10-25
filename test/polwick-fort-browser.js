/* Standalone browser QA, loaded by the browser-smoke HTML only. */
(async()=>{
 const result={checks:[],captures:[],errors:[]};
 const check=(ok,label)=>{if(!ok)throw Error(label);result.checks.push(label);};
 window.requestAnimationFrame=()=>1;window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
  const press=(key,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));
  const tap=key=>{press(key,true);press(key,false);};
  const walk=(key,goal,label)=>{press(key,true);try{for(let i=0;i<500&&!goal();i++)update();check(goal(),label);}finally{press(key,false);}};
  const dismiss=()=>{for(let i=0;i<100&&dialogue.open;i++)tap(' ');check(!dialogue.open,'Dialogue closes');};
  const capture=(label,scale)=>{canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';render();const out=document.createElement('canvas');out.width=512*scale;out.height=480*scale;const art=out.getContext('2d');art.imageSmoothingEnabled=false;art.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name:label+'-'+scale+'x',png:out.toDataURL()});};
  for(const legacy of [false,true]){
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'Checkpoint');dialogue.open=false;completeMq5Assignment();
   fort_quest_stage=6;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;
   dialogue.open=false;dialogue.callbacks=null;forceLegacyRegionalView=legacy;debugMode=true;
   check(transitionToLocation({mapId:'MAP3_N1',x:14.5*TILE,y:9.5*TILE,facing:'left'}),'Fort exterior');
   walk('ArrowLeft',()=>inSmugglerFort,'Ordinary fort entrance '+legacy);
   walk('ArrowRight',()=>player.x>=8.5*TILE,'East aisle');
   walk('ArrowUp',()=>player.y<=3.5*TILE,'Behind Polwick');
   walk('ArrowLeft',()=>player.x<=2.5*TILE,'Rear doorway');
   check(saveGame()&&loadGame(),'Rear-room save/load '+legacy);
   for(const scale of [1,2])capture('cargo-room-'+legacy,scale);
   walk('ArrowDown',()=>player.y>=4.5*TILE,'Tract crate');tap(' ');
   check(choice.open&&choice.title==='Something in the crate','Tract located in cargo room');tap(' ');
   check(accordPanel.open&&accordPanel.theme==='flame','Original Flame reader');
   if(!legacy)capture('flame-tract',1);tap('Escape');
   check(!accordPanel.open,'Reader dismisses');
   walk('ArrowUp',()=>player.y<=2.5*TILE,'Rear aisle');walk('ArrowRight',()=>player.x>=4.5*TILE,'Ledger approach');tap(' ');
   check(dialogue.pages.flat().join(' ').includes('untaxed spirits'),'Smuggling evidence');if(!legacy)capture('freight-records',1);dismiss();
   walk('ArrowDown',()=>player.y>=3.5*TILE,'Door return');walk('ArrowRight',()=>player.x>=8.5*TILE,'Front room');
   walk('ArrowDown',()=>player.y>=4.5*TILE,'Polwick row');walk('ArrowLeft',()=>player.x<=7.5*TILE+24,'Polwick talk range');
   for(let stage=0;stage<3;stage++){
    tap(' ');check(dialogue.open,'Companion exchange '+stage);
    const text=dialogue.pages.flat().join(' ');check(text.includes(['For his sake','follow the Flame','Still no rain'][stage]),'Expected exchange '+stage);
    if(stage===0||stage===1){for(let i=0;i<30&&dialoguePagePresentation().speakerId!=='esla';i++)tap(' ');
     check(dialoguePagePresentation().styleId==='esla_light_green','Esla green '+stage);
     for(const scale of [1,2])capture(stage===0?'esla-tolerates':'esla-rebuffs',scale);
    }else capture('drought-small-talk',1);
    dismiss();check(polwick_esla_visit_stage===stage+1,'Completed exchange persisted '+stage);
    check(saveGame()&&loadGame(),'Conversation progress save/load '+stage);
   }
   walk('ArrowRight',()=>player.x>=8.5*TILE,'Clear Polwick');walk('ArrowDown',()=>player.y>=10.5*TILE,'Exit aisle');
   walk('ArrowLeft',()=>player.x<=7.5*TILE,'Exit alignment');walk('ArrowDown',()=>!inSmugglerFort,'Ordinary fort exit '+legacy);
   check(mapIdForRef(activeMap)==='MAP3_N1','Exterior return');
  }
  check(result.errors.length===0,'No browser errors');result.ok=true;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
