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
      // Paid return: real browser key events, dialogue pagination and reverse tableau.
      {
        const tap=key=>{window.dispatchEvent(new KeyboardEvent('keydown',{key}));window.dispatchEvent(new KeyboardEvent('keyup',{key}));};
        const finish=()=>{let n=0;while(dialogue.open&&n++<30){render();tap('Enter');}check(!dialogue.open,'Return dialogue closes @'+scale);};
        const capture=name=>{
          render();const image=document.createElement('canvas');image.width=512*scale;image.height=480*scale;
          const output=image.getContext('2d');output.imageSmoothingEnabled=false;output.drawImage(canvas,0,0,image.width,image.height);
          result.captures.push({name:name+'-'+scale+'x',png:image.toDataURL()});
        };
        stats.gold=9;
        window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp'}));for(let n=0;n<6;n++)update();
        window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowUp'}));tap('Enter');
        check(dialogue.open&&dialogue.name==='Imperial Guard','Eastern guard reachable through input @'+scale);
        render();let foundEsla=false,steps=0;
        while(dialogue.open&&steps++<30){
          const presentation=dialoguePagePresentation();
          if(presentation.speakerId==='esla'){
            check(presentation.styleId==='esla_light_green','Ferry objection uses Esla green @'+scale);
            if(!foundEsla)capture('ferry-return-esla');foundEsla=true;
          }
          const text=[],originalText=ctx.fillText;
          ctx.fillText=function(value,x,y,...rest){const w=this.measureText(value).width;const left=this.textAlign==='center'?x-w/2:this.textAlign==='right'?x-w:x;text.push({left,right:left+w});return originalText.call(this,value,x,y,...rest);};
          try{drawDialogue();}finally{ctx.fillText=originalText;}
          check(text.every(t=>t.left>=0&&t.right<=512),'Return dialogue fits width @'+scale+' page '+steps);
          tap('Enter');render();
        }
        check(foundEsla&&choice.options[0]==='Pay 10g and cross','Explicit return fare choice @'+scale);
        tap('Enter');check(!waterTravelController.isActive()&&stats.gold===9&&dialogue.open,'Insufficient gold refuses boarding @'+scale);
        finish();stats.gold=20;tap('Enter');finish();tap('Enter');
        check(waterTravelController.getView()?.direction==='west','Paid return starts reverse animation @'+scale);
        const reverseStart=waterTravelController.getView().x;
        waterTravelController.update(WATER_TRAVEL_ROUTES.causeway_ferry.durationFrames*MS_PER_FRAME/2000);
        check(waterTravelController.getView().x<reverseStart,'Reverse animation moves west @'+scale);capture('ferry-return-crossing');
        waterTravelController.update(WATER_TRAVEL_ROUTES.causeway_ferry.durationFrames*MS_PER_FRAME/2000);
        check(regionalActiveMapId()==='EAST_CAUSEWAY_MAP'&&stats.gold===10,'Return lands west and charges exactly 10g @'+scale);
        capture('ferry-return-arrival');
      }
    }
    // Mornay population review uses real browser input listeners and Canvas.
    // This is automated browser evidence, not a claim of a manual playthrough.
    const press=key=>{window.dispatchEvent(new KeyboardEvent('keydown',{key}));window.dispatchEvent(new KeyboardEvent('keyup',{key}));};
    const walkUntil=(key,test,label)=>{
      window.dispatchEvent(new KeyboardEvent('keydown',{key}));let count=0;
      try{while(!test()&&count++<240)update();}finally{window.dispatchEvent(new KeyboardEvent('keyup',{key}));}
      check(test(),label);
    };
    const closeDialogue=()=>{let count=0;while(dialogue.open&&count++<60){render();press('Enter');}check(!dialogue.open,'Dialogue closes through input');};
    const townState=id=>({inTown:true,currentTownId:'mornay',townBuilding:mornayRoomForMap(id)?.id||null});
    const capture=name=>{
      render();const pixels=document.createElement('canvas'),scale=canvas.getBoundingClientRect().width/canvas.width;
      pixels.width=canvas.width*scale;pixels.height=canvas.height*scale;
      const c=pixels.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,pixels.width,pixels.height);
      result.captures.push({name,png:pixels.toDataURL()});
    };
    // Walk a collision-tested path with the browser's ordinary held-key listeners.
    const walkTo=(accept,label)=>{
      const q=[[player.x,player.y,-1,null]],seen=new Set([player.x+','+player.y]);let end=-1;
      for(let i=0;i<q.length;i++){
        const [x,y]=q[i];if(accept(x,y)){end=i;break;}
        for(const [dx,dy,key]of [[8,0,'ArrowRight'],[-8,0,'ArrowLeft'],[0,8,'ArrowDown'],[0,-8,'ArrowUp']]){
          const nx=x+dx,ny=y+dy,k=nx+','+ny;
          if(seen.has(k)||nx<9||nx>503||ny<9||ny>471||TILE_PROPERTIES[tileAt(nx,ny)]?.isTransition)continue;
          if(![.25,.5,.75,1].every(t=>canWalk(x+dx*t,y+dy*t)))continue;
          seen.add(k);q.push([nx,ny,i,key]);
        }
      }
      check(end>=0,'Reachable walking route '+label);const path=[];
      for(let i=end;q[i][2]>=0;i=q[i][2])path.push(q[i]);
      for(const [x,y,,key]of path.reverse())walkUntil(key,()=>Math.abs(player.x-x)<2&&Math.abs(player.y-y)<2,'Walk '+label);
    };
    const talk=id=>{
      const n=MORNAY_NPCS.find(n=>n.id===id),mapId=[...MORNAY_TOWN_MAP_IDS,...MORNAY_BUILDINGS.map(b=>b.mapId)].find(id=>mornayContentKey(id)===n.map);
      check(transitionToLocation({mapId,x:240,y:432,facing:'up',state:townState(mapId)}),'Reach '+id);
      walkTo((x,y)=>SIMPLE_NPCS.find(n=>n.map===currentContentLocationKey()&&Math.hypot(x-n.x,y-n.y)<TALK_RADIUS)?.id===id,'conversation '+id);
      press(' ');check(dialogue.open&&dialogue.name===n.name,'Input conversation '+id);
    };
    const inert=()=>JSON.stringify({quest:MainQuest,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),stats,party:persistentParty.serialize(),day});
    for(const scale of [1,2]){
      canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
      check(canvas.getBoundingClientRect().width===512*scale,'Mornay browser size '+512*scale+'x'+480*scale);
      for(const legacy of [false,true])for(const [gate,x]of [['WEST',240],['EAST',272]]){
        forceLegacyRegionalView=legacy;
        check(transitionToLocation({mapId:'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP',x,y:144,facing:'up'}),'Gate approach '+gate);
        walkUntil('ArrowUp',()=>inTown,'Input entry '+gate+' legacy='+legacy+' @'+scale);
        check(mapIdForRef(activeMap)==='MORNAY_'+gate+'_GATE_MAP','Correct gate '+gate);
        check(saveGame()&&loadGame(),'Gate save/load '+gate);closeDialogue();
        capture('mornay-'+gate.toLowerCase()+'-gate-'+(legacy?'fallback-':'')+scale+'x');
        walkUntil('ArrowDown',()=>!inTown,'Input exit '+gate+' legacy='+legacy+' @'+scale);
        check(player.x===x&&player.y===144&&player.facing==='down'&&canWalk(player.x,player.y,9),'Safe gate landing '+gate);
        for(let i=0;i<30;i++)update();check(!inTown,'No automatic reentry '+gate);
      }
      forceLegacyRegionalView=false;
      check(debugWarpToDestination('town:mornay_west_gate').success,'Debug Mornay arrival');closeDialogue();
      walkUntil('ArrowDown',()=>!inTown,'Ordinary exit after debug warp @'+scale);
      for(const id of MORNAY_TOWN_MAP_IDS){
        check(transitionToLocation({mapId:id,x:240,y:432,facing:'up',state:townState(id)}),'Exterior '+id);
        for(let i=0;i<120;i++)update();check(!combat.active,'No random town battle '+id);
        capture(id.toLowerCase()+'-'+scale+'x');
      }
      for(const b of MORNAY_BUILDINGS){
        check(transitionToLocation({mapId:b.sourceMapId,x:240,y:432,facing:'up',state:townState(b.sourceMapId)}),'Door approach '+b.id);
        walkTo((x,y)=>x===(b.returnCol+.5)*TILE&&y===(b.returnRow+.5)*TILE,'entrance '+b.id);
        walkUntil(b.facing==='up'?'ArrowDown':'ArrowUp',()=>mapIdForRef(activeMap)===b.mapId,'Input door entry '+b.id);
        check(player.y===(b.returnRow<b.doorRow?48:432)&&player.facing===(b.returnRow<b.doorRow?'down':'up'),'Door orientation '+b.id);
        check(saveGame()&&loadGame(),'Interior save/load '+b.id);closeDialogue();capture(b.id+'-'+scale+'x');
        walkUntil(b.returnRow<b.doorRow?'ArrowUp':'ArrowDown',()=>mapIdForRef(activeMap)===b.sourceMapId,'Input door exit '+b.id);
      }
      stats.gold=1000;
      for(const id of ['mornay_neris_kelm','mornay_melva_stern','mornay_hesta_sorn','mornay_hal_venn']){
        talk(id);closeDialogue();check(shop.open,'Operational shop '+id);capture(id+'-shop-'+scale+'x');
        const before=stats.gold,stock=shop.stock[0],owned=stats.items.filter(i=>i.name===stock.name).length;
        press('Enter');press('Enter');check(stats.gold===before-stock.price&&stats.items.filter(i=>i.name===stock.name).length===owned+1,'Real purchase '+id);
        press('Escape');press('Escape');
      }
      for(const [id,fee]of [['mornay_rella_wold',30],['mornay_gerta_vell',40]]){
        stats.hp=Math.max(1,stats.maxHp-4);const before=day,gold=stats.gold;
        talk(id);closeDialogue();check(choice.open,'Inn offer '+id);press('Enter');
        check(day===before+1&&stats.gold===gold-fee&&stats.hp===stats.maxHp,'Operational rest '+id);closeDialogue();
      }
      stats.hp=stats.maxHp-7;const hp=stats.hp,gold=stats.gold;
      talk('mornay_selven_orr');closeDialogue();check(choice.open,'Treatment target chooser');press('Enter');
      check(stats.hp===hp+7&&stats.gold===gold-7,'Operational infirmary treatment');closeDialogue();
      // All new lines are measured in the real font after the production
      // pagination/speaker preprocessing; no fixed-width harness approximation.
      const before=inert();let measured=0;
      for(const npc of MORNAY_NPCS){
        if(npc.service)continue;
        dialogue.name=npc.name;setNpcDialoguePages(npc);dialogue.open=true;dialogue.page=0;
        const draws=[],original=ctx.fillText;
        ctx.fillText=function(text,x,y,...rest){const m=this.measureText(text),left=this.textAlign==='right'?x-m.width:this.textAlign==='center'?x-m.width/2:x;draws.push({left,right:left+m.width,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent});return original.call(this,text,x,y,...rest);};
        try{drawDialogue();for(let page=1;page<dialogue.pages.length;page++){dialogue.page=page;drawDialogue();}}
        finally{ctx.fillText=original;dialogue.open=false;}
        check(draws.length>0&&draws.every(d=>d.left>=0&&d.right<=512&&d.top>=0&&d.bottom<=480),'Mornay dialogue fits '+npc.id+' @'+scale);measured++;
      }
      check(measured===293&&inert()===before,'Ambient dialogue and presentation mutate no game state @'+scale);
      for(const id of ['mornay_bram_fen','mornay_tavi_rusk','mornay_nessa_quill','mornay_yara_kelm','mornay_jessa_nair','mornay_marit_voss','mornay_edrin_saye','mornay_oren_teal','mornay_benna_lark','mornay_nevin_brack','mornay_otrin_wren']){
        talk(id);capture(id+'-dialogue-'+scale+'x');
        if(id==='mornay_yara_kelm'){
          while(dialogue.open&&dialoguePagePresentation().speakerId!=='esla'){render();press('Enter');}
          check(dialogue.open&&dialoguePagePresentation().styleId==='esla_light_green','Mornay Esla interjection stays green');capture('mornay-esla-green-'+scale+'x');
        }
        closeDialogue();
      }
      for(const town of ['calwick','drenwick']){enterTownAt(town,'south');capture('compatibility-'+town+'-'+scale+'x');check(canWalk(player.x,player.y,9),'Earlier town arrival remains walkable '+town);}
    }
    check(result.errors.length===0,'No browser errors');result.ok=true;
  }catch(error){result.ok=false;result.errors.push(error.stack||String(error));}
  document.getElementById('results').textContent=JSON.stringify(result);
})();
