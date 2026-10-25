/* Isolated native Canvas/DOM review; never loaded by index.html. */
(async()=>{
 const result={checks:[],captures:[],errors:[]};
 const check=(v,s)=>{if(!v)throw Error(s);result.checks.push(s);};
 window.addEventListener('error',e=>result.errors.push(e.message));window.requestAnimationFrame=()=>1;
 try{
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='../'+m[1];script.onload=resolve;script.onerror=reject;document.body.append(script);
  });
  const tap=key=>{for(const type of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));};
  const hold=(key,frames)=>{window.dispatchEvent(new KeyboardEvent('keydown',{key}));try{for(let i=0;i<frames;i++)update(1/60);}finally{window.dispatchEvent(new KeyboardEvent('keyup',{key}));}};
  const capture=name=>{render();const out=document.createElement('canvas'),scale=canvas.getBoundingClientRect().width/512;out.width=512*scale;out.height=480*scale;
   const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name,png:out.toDataURL()});};
  const close=()=>{dialogue.open=false;choice.open=false;menu.open=false;shop.open=false;};
  const glyphs=draw=>{const rows=[],old=ctx.fillText;ctx.fillText=function(text,x,y,...rest){const m=this.measureText(text),left=this.textAlign==='right'?x-m.width:this.textAlign==='center'?x-m.width/2:x;
   rows.push({text:String(text),left,right:left+m.width,y,color:this.fillStyle,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent});return old.call(this,text,x,y,...rest);};
   try{draw();}finally{ctx.fillText=old;}return rows;};
  const inside=(rows,label)=>check(rows.length>0&&rows.every(r=>r.left>=8&&r.right<=504&&r.top>=358&&r.bottom<=472),'Actual dialogue glyph bounds '+label);
  const fenIds=['enemy_botfly','enemy_waspthra','enemy_sparkeel','enemy_mudwrack_snapper','enemy_fen_rootworm','enemy_willow_veiled_stalker','enemy_hollowreed_choker','enemy_fen_zolom'];
  for(const scale of [1,2]){
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'Isolated fixture @'+scale);close();day=1;worldToastTimer=0;
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   check(canvas.getBoundingClientRect().width===512*scale,'Native/2x display dimensions @'+scale);
   check(transitionToLocation({mapId:'HOLLIS_FARMHOUSE_MAP',x:7.5*TILE,y:11.5*TILE,facing:'up',state:{inHollisFarmhouse:true}}),'Legal Hollis transition @'+scale);
   capture('hollis-room-'+scale+'x');
   hold('w',48);hold('d',32);hold('w',68);
   const merta=NPC_REGISTRY.merta;
   check(Math.hypot(player.x-merta.x,player.y-merta.y)<TALK_RADIUS&&canWalk(player.x,player.y),'Actual controls reach moved Merta @'+scale);
   stats.hp=8;stats.maxHp=20;tap('Enter');check(choice.open&&choice.title==='Merta','Actual soup interaction @'+scale);capture('merta-soup-choice-'+scale+'x');tap('Enter');
   check(stats.hp===13&&dialogue.open,'Soup heals5 through input @'+scale);close();
   check(transitionToLocation({mapId:'OFFICE_MAP',x:7.5*TILE,y:10.5*TILE,facing:'up',state:{inTown:true,currentTownId:'calwick',townBuilding:'office'}}),'Legal office transition @'+scale);
   setSpeakerDialoguePages([{speakerId:'esla',lines:['“It has never shown much inclination,” Esla says. “I will leave it in order. I am going with her.”']}]);dialogue.open=true;dialogue.page=0;tick=32;
   let painted=glyphs(()=>render());inside(painted.filter(r=>r.y>=358),'Esla mixed @'+scale);
   check(painted.some(r=>r.text.includes('Esla says.')&&r.color==='#ccd8cc'),'Esla narration neutral @'+scale);
   check(painted.some(r=>r.text.includes('inclination')&&r.color==='#a8e89c'),'Esla speech green @'+scale);
   check(painted.find(r=>r.text==='Esla').color==='#8ac8d8'&&painted.find(r=>r.text==='[ close ]'||r.text==='▼ more').color==='#8ac8d8','Esla chrome neutral @'+scale);capture('esla-words-'+scale+'x');
   const speech='“'+Array(95).fill('Keep walking').join(' ')+'.',ending='the road stays dry.” She folds the map.';
   setSpeakerDialoguePages([{speakerId:'esla',lines:[speech,ending]}]);dialogue.page=0;
   render();let continuation=false,narration=false;
   for(let p=0;p<dialogue.pages.length;p++){dialogue.page=p;painted=glyphs(()=>render());inside(painted.filter(r=>r.y>=358),'Esla wrapped'+p+' @'+scale);
    if(p>0&&painted.some(r=>r.y>=410&&r.y<=454&&r.color==='#a8e89c'&&!r.text.includes('“')))continuation=true;
    if(painted.some(r=>r.text.includes('She folds')&&r.color==='#ccd8cc'))narration=true;
   }
   check(continuation&&narration,'Quote colors survive native wrapping/height pagination @'+scale);close();
   // Derived keepsakes must be selectable through the actual notebook input.
   for(const [stage,title,pattern]of [[2,'Tarnished Coin',/pre-Empire/],[3,'Bent Iron Key',/fits nothing/]]){
    cat_quest_stage=stage;stats.items=[];const notes=getActiveQuestNotes(),row=notes.findIndex(n=>n.title===title);
    check(row>notes.findIndex(n=>n.header==='SPECIAL ITEMS'),'Derived Special Items '+title+' @'+scale);
    menu.open=true;menu.screen='notebook';menu.notebookOffset=0;menu.notebookCursor=row;capture('notebook-'+title.toLowerCase().replaceAll(' ','-')+'-'+scale+'x');
    tap('Enter');check(dialogue.open&&!menu.open&&dialogue.name===title&&pattern.test(dialogue.pages.flat().join(' ')),'Notebook input inspects '+title+' @'+scale);capture('inspect-'+title.toLowerCase().replaceAll(' ','-')+'-'+scale+'x');close();
   }
   drama_stage=1;menu.open=true;menu.screen='notebook';menu.notebookOffset=0;menu.notebookCursor=getActiveQuestNotes().findIndex(n=>n.title==="Sena's Letter");
   check(menu.notebookCursor>=0,'Carried Sena letter notebook @'+scale);capture('notebook-sena-letter-'+scale+'x');close();
   day=5;fort_quest_started=true;schilling_quest_started=false;schilling_returned=false;refreshJobBoard();
   check(transitionToLocation({mapId:'TOWN_MAP',x:NOTICE_BOARD_X,y:NOTICE_BOARD_Y,facing:'up',state:{inTown:true,currentTownId:'calwick',townBuilding:null}}),'Legal board transition @'+scale);tap('Enter');
   check(dialogue.open&&dialogue.name==='Notice Board','Actual board interaction @'+scale);render();
   const hint=dialogue.pages.findIndex(p=>p.join(' ').includes('talk to Pip at the School'));check(hint>=0,'MQ3 child notice present @'+scale);dialogue.page=hint;capture('board-pip-hint-'+scale+'x');close();
   shop.open=true;shop.screen='buy';shop.stock=TRAVELLER_STOCK;shop.cursor=shop.stock.findIndex(i=>i.name==='Fen Mask');shop.title='Travelling Salesman';stats.gold=2000;
   painted=glyphs(()=>render());const mask=painted.find(r=>r.text.includes('Fen Mask')),price=painted.find(r=>r.y===mask.y&&r.text==='1600 g'),stat=painted.find(r=>r.y===mask.y&&r.text==='SPD +5');
   check(mask&&price&&stat&&mask.right<stat.left&&stat.right<price.left&&price.right<=400,'Fen Mask name/stat/price do not overlap @'+scale);capture('fen-mask-shop-'+scale+'x');close();
   for(const id of fenIds)for(const n of [1,2,3]){
    stats.spd=1000;stats.atk=1000000;stats.hp=stats.maxHp=1000000;check(canonicalPartyCombat.enter({enemies:Array(n).fill(id),escape:'fastest_living'}),'Real battle fixture '+id+'x'+n+' @'+scale);
    const view=canonicalPartyCombat.getView(),before=JSON.stringify({view,party:persistentParty.getView(),stats});render();
    check(JSON.stringify({view:canonicalPartyCombat.getView(),party:persistentParty.getView(),stats})===before,'Read-only battle render '+id+'x'+n+' @'+scale);
    const positions=partyBattleLayout(view).enemies;check(positions.length===n,'Real layout '+id+'x'+n+' @'+scale);
    for(const pos of positions){const x=Math.max(0,Math.floor(pos.spriteX)),y=Math.max(0,Math.floor(pos.spriteY)),w=Math.min(512-x,Math.ceil(pos.spriteWidth)),h=Math.min(480-y,Math.ceil(pos.spriteHeight));
     const data=ctx.getImageData(x,y,w,h).data,colors=new Set();let bright=0;for(let i=0;i<data.length;i+=4){if(Math.max(data[i],data[i+1],data[i+2])>65){bright++;colors.add(data[i]+','+data[i+1]+','+data[i+2]);}}
     check(bright>80&&colors.size>=6,'Visible colored sprite pixels '+id+'x'+n+' slot'+pos.slot+' @'+scale);
    }
    if(n===3||id==='enemy_botfly'||id==='enemy_fen_zolom')capture(id.replace('enemy_','')+'-'+n+'enemies-'+scale+'x');
    // Finish the actual session through its existing Run command so every
    // private combat lifecycle owner releases normally before the next fixture.
    const random=Math.random;Math.random=()=>0;
    try{for(let move=0;move<3;move++)canonicalPartyCombat.handleInput('right');canonicalPartyCombat.handleInput('confirm');canonicalPartyCombat.handleInput('confirm');
     let steps=0;while(canonicalPartyCombat.isActive()&&steps++<100)canonicalPartyCombat.handleInput('confirm');
     // Boss-marked Zolom blocks Run; finish with the isolated fixture's
     // high attack through the ordinary command/target/playback lifecycle.
     Math.random=()=>.5;
     for(let step=0;canonicalPartyCombat.isActive()&&step<300;step++){
      const v=canonicalPartyCombat.getView();
      if(v.phase==='awaiting_action'&&v.selectedCommand!=='attack')canonicalPartyCombat.handleInput('left');
      else canonicalPartyCombat.handleInput('confirm');
     }
     check(!canonicalPartyCombat.isActive(),'Normal terminal lifecycle releases fixture '+id+'x'+n+' @'+scale);
    }finally{Math.random=random;}
   }
   canonicalPartyCombat.resetForStoryCheckpoint();resetCombatForStoryCheckpoint();persistentParty.resetForStoryCheckpoint();close();
   check(transitionToLocation({mapId:'TRAVELLERS_RISE_CAMP_MAP',x:7.5*TILE,y:8.5*TILE,facing:'up'}),'Legal campsite transition @'+scale);
   check(TRAVELLERS_RISE_CAMP_MAP[0].every(t=>t===TREE)&&TRAVELLERS_RISE_CAMP_MAP[12][7]===PATH,'Wooded clearing keeps intended exit @'+scale);capture('wooded-campsite-'+scale+'x');
  }
  check(result.errors.length===0,'No browser errors');result.ok=true;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
