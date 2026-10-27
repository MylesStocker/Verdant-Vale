(async()=>{
 const result={checks:[],captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
  const check=(v,message)=>{if(!v)throw Error(message);result.checks.push(message);};
  const tap=key=>{window.dispatchEvent(new KeyboardEvent('keydown',{key}));window.dispatchEvent(new KeyboardEvent('keyup',{key}));};
  const close=()=>{for(let i=0;i<100&&dialogue.open;i++){render();tap('Enter');}check(!dialogue.open,'dialogue closes');};
  const move=(key,frames)=>{window.dispatchEvent(new KeyboardEvent('keydown',{key}));for(let i=0;i<frames;i++)update(1/60);window.dispatchEvent(new KeyboardEvent('keyup',{key}));};
  const snap=name=>{render();const c=document.createElement('canvas');c.width=512*scale;c.height=480*scale;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(canvas,0,0,c.width,c.height);result.captures.push({name:name+'-'+scale+'x',png:c.toDataURL()});};
  const assert={deepEqual:(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(m);},ok:(v,m)=>{if(!v)throw Error(m);},equal:(a,b,m)=>{if(a!==b)throw Error(m+': '+a+' != '+b);},fail:m=>{throw Error(m);}};
  const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
  const g={run:s=>window.eval(s),hold:key=>window.dispatchEvent(new KeyboardEvent('keydown',{key})),release:key=>window.dispatchEvent(new KeyboardEvent('keyup',{key})),frames:n=>{for(let i=0;i<(n||1);i++)update(1/60);}};
function pathTo(g,x,y){
 return J(g,`(()=>{
  const goal=[${x},${y}],start=[player.x,player.y],queue=[start],prev=new Map([[start.join(','),null]]);
  const clear=(a,b)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2);return Array.from({length:n+1},(_,i)=>{
   const t=n?i/n:0,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
   return !TILE_PROPERTIES[tileAt(x,y)]?.isTransition&&canWalk(x,y);
  }).every(Boolean);};
  for(let i=0;i<queue.length;i++){
   const p=queue[i],corner=[goal[0],p[1]];
   if(Math.abs(p[0]-goal[0])<8&&Math.abs(p[1]-goal[1])<8&&clear(p,corner)&&clear(corner,goal)){
    const out=[p];let k=p.join(',');while(prev.get(k)!==null){const q=prev.get(k);out.push(q);k=q.join(',');}
    return out.reverse().concat([corner,goal]);
   }
   for(const d of [[8,0],[-8,0],[0,8],[0,-8]]){
    const q=[p[0]+d[0],p[1]+d[1]],k=q.join(',');
    if(q[0]<9||q[0]>503||q[1]<9||q[1]>471||prev.has(k)||!clear(p,q))continue;
    prev.set(k,p);queue.push(q);
   }
  }return null;
 })()`);
}
function walk(g,x,y,label){
 const map=g.run('mapIdForRef(activeMap)');
 for(let attempt=0;attempt<6;attempt++){
  const points=pathTo(g,x,y);assert.ok(points,label+' has a collision-safe path from the actual entrance');
  let interrupted=false;
  for(let i=1;i<points.length;){
   const a=points[i-1],b=points[i],dx=Math.sign(b[0]-a[0]),dy=Math.sign(b[1]-a[1]);
   if(!dx&&!dy){i++;continue;}
   let j=i;
   while(j+1<points.length&&Math.sign(points[j+1][0]-points[j][0])===dx&&Math.sign(points[j+1][1]-points[j][1])===dy)j++;
   const end=points[j],distance=Math.abs(end[0]-a[0])+Math.abs(end[1]-a[1]);
   assert.equal(distance%g.run('SPEED'),0,'path uses ordinary movement increments');
   const key=dx<0?'ArrowLeft':dx>0?'ArrowRight':dy<0?'ArrowUp':'ArrowDown';
   g.hold(key);try{g.frames(distance/g.run('SPEED'));}finally{g.release(key);}
   assert.equal(g.run('mapIdForRef(activeMap)'),map,label+' cannot accidentally enter another door');
   if(g.run('player.x')!==end[0]||g.run('player.y')!==end[1]){interrupted=true;break;}
   i=j+1;
  }
  if(!interrupted){assert.deepEqual(J(g,'[player.x,player.y]'),[x,y],label);return;}
 }
 assert.fail(label+' remained blocked after live patrol replanning');
}

function reachable(g) {
  return J(g,`(()=>{
    const start=[player.x,player.y],queue=[start],seen=new Set([start.join(',')]),out=[];
    for(let i=0;i<queue.length;i++){
      const p=queue[i];out.push(p);
      for(const d of [[8,0],[-8,0],[0,8],[0,-8]]){
        const x=p[0]+d[0],y=p[1]+d[1],k=x+','+y;
        if(x<9||x>503||y<9||y>471||seen.has(k))continue;
        if(TILE_PROPERTIES[tileAt(x,y)]?.isTransition)continue;
        if(![.25,.5,.75,1].every(t=>canWalk(p[0]+d[0]*t,p[1]+d[1]*t)))continue;
        seen.add(k);queue.push([x,y]);
      }
    }return out;
  })()`);
}
  const until=(key,map)=>{for(let i=0;i<300;i++){move(key,1);if(mapIdForRef(activeMap)===map)return;}throw Error('transition to '+map);};
  const place=(map,x,y)=>{const b=mornayRoomForMap(map);const entrance=b?mornayInteriorEntrance(b):null;
   check(transitionToLocation({mapId:map,x:x??240,y:y??(entrance?(entrance.arrivalRow+.5)*32:432),state:{inTown:true,currentTownId:'mornay',townBuilding:b?.id||null}}),'place '+map);
   dialogue.open=false;worldToastTimer=0;};
  const enterRoom=map=>{const b=mornayRoomForMap(map);place(b.sourceMapId);
   walk(g,(b.returnCol+.5)*32,(b.returnRow+.5)*32,'street door approach');until(b.returnRow>b.doorRow?'ArrowUp':'ArrowDown',map);};
  const talk=id=>{const n=SIMPLE_NPCS.find(n=>n.id===id),map=n.map.slice(7).toUpperCase();
   if(mapIdForRef(activeMap)!==map){if(mornayRoomForMap(map))enterRoom(map);else place(map);}
   const p=reachable(g).find(([x,y])=>Math.hypot(x-n.x,y-n.y)<TALK_RADIUS&&SIMPLE_NPCS.find(q=>q.map===currentContentLocationKey()&&Math.hypot(q.x-x,q.y-y)<TALK_RADIUS)?.id===id);
   check(!!p,'unshadowed approach '+id);walk(g,...p,'talk '+id);tap(' ');check(dialogue.open&&dialogue.name===n.name,'input conversation '+id);render();};
  let scale=1;
  for(scale of [1,2]){
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'checkpoint');dialogue.open=false;completeMq5Assignment();day=1;
   two_jorans_stage=0;two_jorans_evidence=0;stats.items=stats.items.filter(i=>i.name!=='Joran’s Supply Key'&&i.name!=='Sapper Charge');syncQuestFlagsToWindow();
   const baseline=JSON.stringify({MainQuest,party:persistentParty.serialize(),gold:stats.gold});
   place('MORNAY_EAST_GATE_MAP',240,240);until('ArrowUp','MORNAY_SOUTH_UPPER_EAST_MAP');
   walk(g,400,304,'watchhouse approach');until('ArrowDown','MORNAY_WATCHHOUSE_MAP');snap('booking-room');
   talk('mornay_anric_fell');snap('anrics-mixup');close();tap('Enter');close();check(two_jorans_stage===1,'case accepted');
   talk('two_jorans_beck');snap('beck-statement');close();check(two_jorans_evidence===1,'Beck recorded');
   check(saveGame()&&loadGame(),'booking save/load');dialogue.open=false;
   walk(g,240,48,'watchhouse exit');until('ArrowUp','MORNAY_SOUTH_UPPER_EAST_MAP');
   talk('mornay_perris_dun');close();
   talk('mornay_varda_fen');close();talk('two_jorans_alden');snap('alden-statement');close();check(two_jorans_evidence===15,'four independent statements');
   check(saveGame()&&loadGame(),'warehouse save/load');dialogue.open=false;
   walk(g,240,432,'warehouse exit');until('ArrowDown',mornayRoomForMap('MORNAY_WAREHOUSE_MAP').sourceMapId);
   talk('mornay_anric_fell');
   while(dialoguePagePresentation().styleId!=='esla_light_green'){tap('Enter');render();check(dialogue.open,'Esla correction reached');}
   check(dialoguePagePresentation().styleId==='esla_light_green','Esla uses green, other speakers stay ordinary');snap('esla-correction');close();check(two_jorans_stage===2,'record corrected');
   talk('two_jorans_beck');close();check(two_jorans_stage===3,'Beck grants key at repair site');
   check(stats.items.some(i=>i.name==='Joran’s Supply Key'),'special key held');
   const notes=getActiveQuestNotes(),keyIndex=notes.findIndex(n=>n.title==='Joran’s Supply Key');
   check(keyIndex>notes.findIndex(n=>n.header==='SPECIAL ITEMS'),'key listed under Special Items');
   tap('m');tap('n');for(let i=0;i<keyIndex;i++)tap('ArrowDown');snap('notebook-key');tap('Enter');
   check(dialogue.name==='Joran’s Supply Key','key inspection opens from notebook');close();
   check(saveGame()&&loadGame(),'key save/load');dialogue.open=false;
   walk(g,304,336,'supply-box approach');snap('locked-supply-box');tap(' ');snap('five-charge-reward');close();
   check(two_jorans_stage===4&&stats.items.filter(i=>i.name==='Sapper Charge').length===5,'five registered charges awarded');
   check(!stats.items.some(i=>i.name==='Joran’s Supply Key'),'key consumed');snap('empty-supply-box');
   check(saveGame()&&loadGame(),'completed save/load');dialogue.open=false;tap(' ');close();check(stats.items.filter(i=>i.name==='Sapper Charge').length===5,'reload cannot repeat reward');
   check(JSON.stringify({MainQuest,party:persistentParty.serialize(),gold:stats.gold})===baseline,'MQ5 party and money isolated');
  }
  check(validateGameData().errors===0,'live game data validates');result.ok=true;
 }catch(e){result.errors.push(e.stack||String(e));result.ok=false;}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
