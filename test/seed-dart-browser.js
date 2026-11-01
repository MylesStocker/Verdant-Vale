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
  const v=()=>canonicalPartyCombat.getView(),count=()=>stats.items.filter(i=>i.name==='Dart Seed').length;
  const choose=type=>{let n=0;while(v().selectedCommand!==type){check(n++<6,'command reachable');press('ArrowRight');}press('Enter');};
  const ordinary=type=>{choose(type);if(v().phase==='targeting')press('Enter');};
  const spell=id=>{choose('resonance');let n=0;while(v().selectedTechniqueId!==id){check(n++<5,'technique reachable');press('ArrowDown');}press('Enter');if(id==='quickbloom'){let t=0;while(v().selectedTargetInstanceId!==v().party[0].instanceId){check(t++<3,'healing target reachable');press('ArrowRight');}}press('Enter');};
  const play=(scale)=>{check(v().phase==='ready','round ready');press('Enter');for(let n=0;v().phase==='playback';n++){
   check(n<80,'finite playback');const e=v().playbackFrame.currentEvent;if(e?.type==='resonance_damage'){check(e.reagent.quantity===1,'one seed witness');capture('seed-dart-impact',scale);}if(e?.type==='resonance'){capture('quickbloom',scale);}render();frames(30);press('Enter');
  }check(v().phase==='playback_complete','playback complete');press('Enter');};
  for(const scale of [1,2]){
   check(storyCheckpointLab.apply('mq7_lantern_house_ready'),'checkpoint');debugMode=true;dialogue.open=false;worldToastTimer=0;
   stats.items=[createItem('Dart Seed'),createItem('Potion')];stats.hp=50;Math.random=()=>.5;
   Object.assign(ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,{hp:1000,maxHp:1000,atk:1,def:12,spd:1});
   canonicalPartyCombat.enter({enemies:['enemy_marsh_wisp'],escape:'fastest_living'});
   ordinary('observe');choose('resonance');check(v().techniques.some(t=>t.techniqueId==='seed_dart'),'level 11 technique available');capture('technique-list',scale);
   press('ArrowDown');check(v().selectedTechniqueId==='seed_dart','Seed Dart selected');press('Enter');press('Enter');check(v().reservedInventory[0]?.quantity===1&&count()===1,'draft reserves without consumption');
   press('Escape');check(v().reservedInventory.length===0,'backtrack releases');press('Escape');press('Escape');spell('seed_dart');play(scale);
   check(v().inventory.every(id=>id!=='Dart Seed')&&count()===1,'private consumption before writeback');check(v().resonance[1].strain===1,'Strain applied');
   ordinary('observe');ordinary('attack');play(scale);check(v().resonance[1].strain===0,'one recovery round');
   ordinary('observe');choose('resonance');check(!v().techniques.some(t=>t.techniqueId==='seed_dart'),'last seed prevents further cast');capture('last-seed-spent',scale);press('Escape');spell('quickbloom');play(scale);check(v().party[0].hp>50&&v().resonance[1].strain===1,'Quickbloom healing and Strain unchanged');
   ordinary('run');ordinary('run');Math.random=()=>0;play(scale);check(v().phase==='escape','escape');press('Enter');check(!canonicalPartyCombat.isActive()&&count()===0,'authenticated inventory writeback');while(dialogue.open)press('Enter');check(saveGame()&&loadGame(),'spent inventory saves');dialogue.open=false;
   // Ordinary merchant keyboard purchases, two transactions at the registered price.
   const room=mornayRoomForMap('MORNAY_APOTHECARY_MAP');check(transitionToLocation({mapId:'MORNAY_APOTHECARY_MAP',x:344,y:112,facing:'up',state:{inTown:true,currentTownId:'mornay',townBuilding:room.id}}),'apothecary fixture');
   press('Enter');check(dialogue.open,'keeper interaction');while(dialogue.open)press('Enter');check(shop.open,'shop opens');press('Enter');while(shop.stock[shop.cursor]?.name!=='Dart Seed')press('ArrowDown');capture('apothecary-stock',scale);const gold=stats.gold;press('Enter');press('Enter');check(count()===2&&stats.gold===gold-8,'repeatable seeds 4g each');press('Escape');press('Escape');
  }
  result.ok=!result.errors.length;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
