(async()=>{
 const result={checks:[],captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 window.addEventListener('error',e=>result.errors.push(e.message));
 try{
  const base=document.createElement('base');base.href='/';document.head.append(base);
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
  const check=(v,message)=>{if(!v)throw Error(message);result.checks.push(message);};
  const tap=key=>{window.dispatchEvent(new KeyboardEvent('keydown',{key}));window.dispatchEvent(new KeyboardEvent('keyup',{key}));};
  const close=()=>{for(let i=0;i<100&&dialogue.open;i++)tap('Enter');check(!dialogue.open,'dialogue closes');};
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

  const until=(key,map)=>{for(let i=0;i<300;i++){move(key,1);if(mapIdForRef(activeMap)===map)return;}throw Error('transition to '+map);};
  let scale=1;
  for(scale of [1,2]){
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   check(storyCheckpointLab.apply('mq5_assignment_ready'),'checkpoint');dialogue.open=false;completeMq5Assignment();day=1;
   check(transitionToLocation({mapId:'MAINLAND_C22R3_MAP',x:112,y:304,facing:'up',cooldown:true}),'riverbank placement');
   worldToastTimer=0;snap('reedbank-overworld');until('ArrowUp','REEDBANK_VILLAGE_MAP');snap('reedbank-village');
   walk(g,272,240,'shop approach');until('ArrowUp','REEDBANK_PROVISIONS_MAP');walk(g,368,200,'shopkeeper');
   tap(' ');close();check(shop.open,'provisions shop opens');snap('reedbank-shop');tap('Escape');
   check(saveGame(),'save shop');check(loadGame(),'load shop');dialogue.open=false;
   walk(g,240,432,'shop exit');until('ArrowDown','REEDBANK_VILLAGE_MAP');
   walk(g,312,304,'referee approach');stats.gold=100;
   tap(' ');close();tap('ArrowDown');tap('Enter');check(riverWrestling.getView()?.phase==='ready','paid rules screen');snap('wrestling-rules');tap('Enter');
   let grip=false,fall=false;
   for(let i=0;i<1800;i++){
    const v=riverWrestling.getView();if(v.phase==='result')break;
    if(v.phase==='fight'){
     if(v.opponent.x-v.you.x>48)g.hold('ArrowRight');else g.release('ArrowRight');
     if(!v.you.windup&&!v.you.recovery&&v.opponent.x-v.you.x<=58){
      if(v.you.stamina<28)g.hold('ArrowDown');else{g.release('ArrowDown');tap(v.opponent.footing<=40?(v.you.grip?'c':'z'):'x');}
     }
     if(v.you.grip&&!grip){snap('wrestling-grip');grip=true;}
    }
    if(v.phase==='fall'&&v.fall>=32&&!fall){snap('wrestling-shoulder-contact');fall=true;}
    update(1/60);
   }
   g.release('ArrowRight');g.release('ArrowDown');g.frames(50);
   check(riverWrestling.getView()?.winner==='you'&&stats.gold===110,'ordinary controlled win, 10g net');snap('wrestling-win');tap('Enter');
   tap(' ');close();tap('ArrowDown');tap('Enter');tap('Enter');g.frames(700);
   check(riverWrestling.getView()?.winner==='opponent'&&stats.gold===100,'ordinary idle loss, 10g stake');snap('wrestling-loss');tap('Enter');
   walk(g,240,432,'village exit');until('ArrowDown','MAINLAND_C22R3_MAP');check(player.x===112&&player.y===304,'safe overworld return');
  }
  check(validateGameData().errors===0,'live game data validates');result.ok=true;
 }catch(e){result.errors.push(e.stack||String(e));result.ok=false;}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
