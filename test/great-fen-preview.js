'use strict';
(async()=>{window.requestAnimationFrame=()=>1;
 try{
  const html=await(await fetch('../index.html',{cache:'no-store'})).text();
  for(const [,src]of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((ok,fail)=>{const s=document.createElement('script');s.src='../'+src;s.onload=ok;s.onerror=fail;document.body.append(s);});
  const status=document.getElementById('result'),params=new URLSearchParams(location.search),v=()=>canonicalPartyCombat.getView();
  const tap=key=>{for(const type of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));};
  const button=(name,fn)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{try{fn();}catch(e){status.textContent=e.stack;}};document.getElementById('buttons').append(b);};
  storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();dialogue.open=false;
  transitionToLocation({mapId:'GREAT_FEN_C3RN3_MAP',x:272,y:272,state:{}});
  if(params.has('gallery')){
   const show=()=>{ctx.fillStyle='#172b27';ctx.fillRect(0,0,512,480);GREAT_FEN_ENEMY_TEMPLATES.forEach((e,i)=>{
    const x=128+(i%2)*256,y=126+Math.floor(i/2)*153,sp=ENEMY_SPRITE_DISPATCH[e.id],b=FORMATION_SPRITE_BOUNDS.get(sp.draw),scale=Math.min(1,100/(b[3]-b[1]));
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);sp.draw(-(b[0]+b[2])/2,-b[3]);ctx.restore();ctx.fillStyle='#d8ddc1';ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText(e.name,x,y+19);ctx.textAlign='left';
   });};setInterval(()=>{tick++;show();},1000/60);status.textContent='All six live sprites; 1× native canvas';show();
  }else{
   const n=Math.max(0,Math.min(9,Number(params.get('formation')||3))),form=GREAT_FEN_FORMATIONS[n];
   stats.hp=stats.maxHp=1000;stats.items.push(createItem('Potion'),createItem('Sapper Charge'));Math.random=()=>.5;
   canonicalPartyCombat.enter({enemies:form.enemies,escape:'fastest_living'});
   button('Next event / confirm',()=>tap('Enter'));
   button('Resolve attack round',()=>{
    let guard=0;while(v().phase==='awaiting_action'){
     while(v().selectedCommand!=='attack'){if(++guard>20)throw Error('Navigation');tap('ArrowRight');}tap('Enter');if(v().phase==='targeting')tap('Enter');
    }if(v().phase==='ready')tap('Enter');
   });
   button('Acknowledge round',()=>{for(let n=0;v().phase==='playback';n++){if(n>200)throw Error('Playback');update(1);tap('Enter');}if(v().phase==='playback_complete')tap('Enter');});
   setInterval(()=>{update(1/60);render();status.textContent=form.id+' — '+v().phase+' — completed rounds '+v().completedRounds;},1000/60);
  }
  button('2× / 1×',()=>{const big=canvas.style.width!=='1024px';canvas.style.width=big?'1024px':'512px';canvas.style.height=big?'960px':'480px';});
  for(const [name,query]of [['All creatures','gallery=1'],['Chorus','formation=3'],['Binding','formation=8'],['Hounds','formation=1']]){
   const a=document.createElement('a');a.textContent=name;a.href='?'+query;document.getElementById('buttons').append(a);
  }
 }catch(e){document.getElementById('result').textContent=e.stack;}
})();
