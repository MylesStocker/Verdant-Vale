/* Real Canvas/DOM smoke. Isolated test page, never loaded by index.html. */
(async()=>{
  const result={checks:[],captures:[],errors:[]},check=(ok,message)=>{if(!ok)throw Error(message);result.checks.push(message);};
  window.addEventListener('error',event=>result.errors.push(event.message));
  // Use the production update/render functions deterministically, with a real
  // browser Canvas, fonts, DOM and storage. No gameplay timer runs unattended.
  window.requestAnimationFrame=()=>1;
  try{
    const html=await (await fetch('../index.html')).text();
    const sources=[...html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g)].map(m=>m[1]);
    for(const source of sources)await new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='../'+source;script.onload=resolve;script.onerror=()=>reject(Error('Script load: '+source));document.body.append(script);
    });
    check(ctx.measureText('WWWWWW').width>ctx.measureText('i').width,'Real browser font measurements');
    check(storyCheckpointLab.apply('mq5_assignment_ready'),'Production MQ5 checkpoint loads');
    dialogue.open=false;completeMq5Assignment();dialogue.open=false;
    const persisted=()=>JSON.stringify({party:persistentParty.serialize(),stats,day,world:regionalWorldPosition()});
    for(const scale of [1,2]){
      canvas.style.width=canvas.width*scale+'px';canvas.style.height=canvas.height*scale+'px';
      check(canvas.getBoundingClientRect().width===canvas.width*scale,'Canvas CSS scale '+scale);
      for(const id of ['student_a1','apt_desca']){
        const npc=SIMPLE_NPCS.find(n=>n.id===id);check(!!npc,'Long dialogue source '+id);
        // Exercise the actual renderer/preprocessor and measure each emitted
        // glyph run in its actual font, instead of guessing widths in the VM.
        openDialogue(npc.name,npc.dialogue);const draws=[],originalText=ctx.fillText;
        ctx.fillText=function(text,x,y,...rest){
          const metrics=this.measureText(text),left=this.textAlign==='right'?x-metrics.width:this.textAlign==='center'?x-metrics.width/2:x;
          draws.push({left,right:left+metrics.width,top:y-metrics.actualBoundingBoxAscent,bottom:y+metrics.actualBoundingBoxDescent});
          return originalText.call(this,text,x,y,...rest);
        };
        try{drawDialogue();for(let page=1;page<dialogue.pages.length;page++){dialogue.page=page;drawDialogue();}}
        finally{ctx.fillText=originalText;dialogue.open=false;}
        check(draws.length>0&&draws.every(d=>d.left>=0&&d.right<=canvas.width&&d.top>=0&&d.bottom<=canvas.height),'Actual dialogue glyphs fit '+id+' @'+scale);

      }
      setSpeakerDialoguePages([{speakerId:'esla',lines:['We should take the ferry.']},{speakerId:'lely',lines:['The road continues east.']}]);dialogue.open=true;dialogue.page=0;
      render();check(dialoguePagePresentation().styleId==='esla_light_green','Esla green metadata @'+scale);
      result.captures.push({name:'esla-dialogue-'+scale+'x',png:canvas.toDataURL()});
      dialogue.page=1;render();check(dialoguePagePresentation().styleId===null,'Default speaker style restored @'+scale);dialogue.open=false;
      toggleMenu();render();result.captures.push({name:'party-sheet-'+scale+'x',png:canvas.toDataURL()});
      check(menu.open&&partyFieldMenu.getView().members.length===2,'Real party sheet renders @'+scale);toggleMenu();
      placeAtLocation('EAST_CAUSEWAY_MAP',10.5*TILE,8.5*TILE);check(crossCausewayFerry(),'Ferry starts @'+scale);
      const before=persisted(),view=JSON.stringify(waterTravelController.getView());render();render();
      check(persisted()===before&&JSON.stringify(waterTravelController.getView())===view,'Repeated renders are inert @'+scale);
      waterTravelController.update(WATER_TRAVEL_ROUTES.causeway_ferry.durationFrames*MS_PER_FRAME/2000);render();
      result.captures.push({name:'ferry-'+scale+'x',png:canvas.toDataURL()});
      waterTravelController.update(WATER_TRAVEL_ROUTES.causeway_ferry.durationFrames*MS_PER_FRAME/2000);
      check(!waterTravelController.isActive()&&mapIdForRef(activeMap)==='EASTERN_BANK_MAP','Ferry finishes @'+scale);
    }
    check(result.errors.length===0,'No browser errors');result.ok=true;
  }catch(error){result.ok=false;result.errors.push(error.stack||String(error));}
  document.getElementById('results').textContent=JSON.stringify(result);
})();
