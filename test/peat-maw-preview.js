'use strict';
(async()=>{window.requestAnimationFrame=()=>1;
 try{
  const html=await(await fetch('../index.html',{cache:'no-store'})).text();
  for(const [,src]of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((ok,fail)=>{const s=document.createElement('script');s.src='../'+src+'?maw='+Date.now();s.onload=ok;s.onerror=fail;document.body.append(s);});
  const status=document.getElementById('result'),v=()=>canonicalPartyCombat.getView();let savedView=null;
  const tap=key=>{for(const type of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));};
  const button=(name,fn)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{try{fn();}catch(e){status.textContent=e.stack;}};document.getElementById('buttons').append(b);};
  const show=()=>{render();status.textContent=v().active?`${v().phase}: ${v().completedRounds} full rounds completed`:'Field view';};
  storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();mornay_peat_hunt=1;
  transitionToLocation({mapId:'MAINLAND_CN3RN8_MAP',x:272,y:232,state:{}});Math.random=()=>.5;for(let i=0;i<240;i++)update(1/60);show();
  button('Enter battle',()=>{tap(' ');for(let i=0;dialogue.open&&i<10;i++){render();tap('Enter');}tap('Enter');show();});
  button('Resolve next round',()=>{
   while(v().phase==='awaiting_action'){
    const cmd=v().commands.includes('observe')?'observe':'attack';let n=0;
    while(v().selectedCommand!==cmd){if(n++>8)throw Error('command navigation');tap('ArrowRight');}tap('Enter');if(v().phase==='targeting')tap('Enter');
   }
   if(v().phase==='ready')tap('Enter');
   for(let n=0;v().phase==='playback';n++){
    if(n>200)throw Error('playback bound');
    if(v().playbackFrame?.currentEvent?.type==='swallow'){savedView=v();partyBattleSwallowAnimation.reset();partyBattleSwallowAnimation.update(savedView,0);show();return;}
    update(1);tap('Enter');
   }
   if(v().phase==='playback_complete')tap('Enter');show();
  });
  for(const [name,seconds]of [['Emergence',.35],['Swallowing',1.05],['Closed jaws',1.95]])button(name,()=>{
   if(!savedView)throw Error('Resolve six rounds first');partyBattleSwallowAnimation.reset();partyBattleSwallowAnimation.update(savedView,seconds);drawPartyBattle(savedView);status.textContent=`Swallow: ${name} (${seconds}s of 2s)`;
  });
  button('Play Swallow',()=>{if(!savedView)return;partyBattleSwallowAnimation.reset();let elapsed=0;const timer=setInterval(()=>{elapsed+=1/60;partyBattleSwallowAnimation.update(savedView,1/60);drawPartyBattle(savedView);if(elapsed>=2)clearInterval(timer);},1000/60);});
  button('2× / 1×',()=>{const big=canvas.style.width!=='1024px';canvas.style.width=big?'1024px':'512px';canvas.style.height=big?'960px':'480px';});
 }catch(e){document.getElementById('result').textContent=e.stack;}
})();
