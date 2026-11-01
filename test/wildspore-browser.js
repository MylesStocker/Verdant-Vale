/* Real Canvas and keyboard integration with explicit isolated combat fixtures. */
(async()=>{
 const result={checks:[],captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 const check=(ok,name)=>{if(!ok)throw Error(name);result.checks.push(name);};
 window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
  const press=key=>{for(const type of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));};
  const frames=n=>{for(let i=0;i<n;i++)update(1/60);};
  const capture=(name,scale)=>{render();const out=document.createElement('canvas');out.width=512*scale;out.height=480*scale;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name:name+'-'+scale+'x',png:out.toDataURL()});};

  const v=()=>canonicalPartyCombat.getView();
  const choose=type=>{let n=0;while(v().selectedCommand!==type){check(n++<6,'command reachable');press('ArrowRight');}press('Enter');};
  const ordinary=type=>{choose(type);if(v().phase==='targeting')press('Enter');};
  const spell=()=>{choose('resonance');let n=0;while(v().selectedTechniqueId!=='wildspore'){check(n++<5,'technique reachable');press('ArrowDown');}press('Enter');press('Enter');};
  const play=scale=>{check(v().phase==='ready','round ready');press('Enter');for(let n=0;v().phase==='playback';n++){
   check(n<80,'finite playback');const e=v().playbackFrame.currentEvent;
   if(e?.type==='resonance_accuracy')capture('wildspore-cast',scale);
   if(e?.type==='resonance_accuracy_end')capture('spores-clear',scale);
   if(e?.type==='attack'&&e.side==='enemy'&&e.accuracy)check(e.evaded&&e.appliedDamage===0,'spores turn attack into miss');
   render();frames(30);press('Enter');
  }check(v().phase==='playback_complete','playback complete');press('Enter');};
  for(const scale of [1,2]){
   check(storyCheckpointLab.apply('mq7_lantern_house_ready'),'checkpoint');debugMode=true;dialogue.open=false;worldToastTimer=0;
   stats.items=[];stats.hp=50;Math.random=()=>.5;
   Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,{hp:1000,maxHp:1000,atk:1,def:12,spd:1});
   canonicalPartyCombat.enter({enemies:['enemy_marsh_wisp'],escape:'fastest_living'});
   ordinary('observe');choose('resonance');check(v().techniques.some(t=>t.techniqueId==='wildspore'),'starting spell without seeds');capture('technique-list',scale);press('Escape');spell();
   press('Escape');check(v().phase==='targeting','backtrack safe');press('Escape');press('Escape');spell();play(scale);
   check(v().resonance[1].strain===3,'three Strain');check(!!v().enemies[0].accuracyEffect,'enemy has spores');check(v().inventory.length===0,'no reagent cost');capture('three-strain',scale);
   for(let turn=2;turn<=4;turn++){
    ordinary('observe');check(!v().enabledCommands.includes('resonance'),'Strain blocks spell');ordinary('attack');play(scale);
    check(v().resonance[1].strain===4-turn,'Strain recovery');check(!!v().enemies[0].accuracyEffect===(turn<2),'two enemy action rounds only');
   }
   ordinary('observe');choose('resonance');check(v().techniques.some(t=>t.techniqueId==='wildspore'),'available after recovery');press('Escape');ordinary('run');
   // Backtrack Lely's draft to choose a safe two-person escape round.
   for(let i=0;i<3;i++)press('Escape');
   check(v().phase==='awaiting_action'&&v().nextActorId===v().party[0].instanceId,'drafts cancelled');
   ordinary('run');ordinary('run');Math.random=()=>0;play(scale);check(v().phase==='escape','escape');press('Enter');while(dialogue.open)press('Enter');
   check(!canonicalPartyCombat.isActive(),'canonical cleanup');check(saveGame()&&loadGame(),'save load after fight');dialogue.open=false;
   check(!/accuracyEffect|wildspore/.test(localStorage.getItem('verdantVale_save')),'no spell state in save');
  }
  result.ok=!result.errors.length;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
