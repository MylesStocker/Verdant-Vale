'use strict';
const fs=require('fs'),http=require('http'),path=require('path'),os=require('os'),{spawn}=require('child_process');
// Usage: node test/profile-overworld.js <main checkout> <output prefix> [--smoke-only]
// Uses existing checkouts read-only, built-in CDP/WebSocket and installed Chromium.
if(!process.argv[2]||!process.argv[3])throw Error('Provide comparison checkout and output prefix');
if(typeof WebSocket!=='function')throw Error('Use Node with built-in WebSocket support');
const smokeOnly=process.argv.includes('--smoke-only'),phase=smokeOnly?'functional-smoke':'measurement';
const roots={main:path.resolve(process.argv[2]),codex:path.resolve(__dirname,'..')};
const output=path.resolve(process.argv[3]);
const browser=[process.env.VV_BROWSER,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].find(p=>p&&fs.existsSync(p));
if(!browser)throw Error('Installed Chromium not found; set VV_BROWSER');
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),parts=u.pathname.split('/').filter(Boolean),root=roots[parts.shift()];if(!root){res.writeHead(404);res.end();return;}const file=path.resolve(root,parts.join('/')||'index.html');if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':'application/octet-stream');res.end(data);});});
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
class CDP{constructor(ws){this.ws=ws;this.next=0;this.pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});}call(method,params={}){return new Promise((resolve,reject)=>{const id=++this.next;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}async eval(expression){const r=await this.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}}
function profileSummary(p){const nodes=new Map(p.nodes.map(n=>[n.id,n])),hits=new Map(),inc=new Map();const parent=new Map();for(const n of p.nodes)for(const child of n.children||[])parent.set(child,n.id);for(const id of p.samples||[]){hits.set(id,(hits.get(id)||0)+1);for(let cur=id;cur!==undefined;cur=parent.get(cur))inc.set(cur,(inc.get(cur)||0)+1);}const aggregate=map=>{const by=new Map();for(const [id,count]of map){const n=nodes.get(id),k=n.callFrame.functionName+' @ '+n.callFrame.url.split('/').pop();by.set(k,(by.get(k)||0)+count);}return [...by].sort((a,b)=>b[1]-a[1]).slice(0,22).map(([functionName,samples])=>({functionName,samples,percent:Math.round(samples/p.samples.length*1000)/10}));};return {samples:p.samples.length,self:aggregate(hits),inclusive:aggregate(inc)};}
const instrumentation=String.raw`(()=>{
 if(!storyCheckpointLab.apply('mq5_assignment_ready'))throw Error('Checkpoint failed');
 window.__perf={samples:null,events:[],phase:null};
 const updateOriginal=update,renderOriginal=render;
 const key=(k,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key:k,bubbles:true}));
 function clearKeys(){for(const k of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'])key(k,false);}
 function blocked(){return dialogue.open||menu.open||choice.open||combat.active||canonicalPartyCombat.isActive()||shop.open;}
 update=function(...args){const p=window.__perf;let s=p.samples;if(s&&s.walk&&!blocked()){if(player.x>=s.right&&s.dir!=='ArrowLeft'){clearKeys();s.dir='ArrowLeft';key(s.dir,true);}else if(player.x<=s.left&&s.dir!=='ArrowRight'){clearKeys();s.dir='ArrowRight';key(s.dir,true);}}const x=player.x,y=player.y,b=blocked(),start=performance.now();const r=updateOriginal(...args);if(s){if(b||blocked())s.excluded++;else{s.update.push(performance.now()-start);s.distance+=Math.hypot(player.x-x,player.y-y);s.steps++;}}return r;};
 render=function(...args){const s=window.__perf.samples,start=performance.now();const r=renderOriginal(...args);if(s&&!blocked()){s.render.push(performance.now()-start);s.times.push(start);}return r;};
 function stats(a){const b=a.slice().sort((x,y)=>x-y);return {meanMs:a.reduce((x,y)=>x+y,0)/a.length,p50Ms:b[Math.floor(b.length*.5)],p95Ms:b[Math.floor(b.length*.95)],maxMs:b[b.length-1]};}
 window.__perf.setup=async(kind,scale)=>{clearKeys();debugMode=true;forceLegacyRegionalView=false;canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
 if(kind==='outdoor'){if(!transitionToLocation({mapId:'MAP3',x:352,y:240,facing:'right'}))throw Error('Grass placement');}
 else{enterTownAt('calwick','south');enterHouse('player_house');placeAtLocation('HOUSE_INTERIOR_MAP',208,272);}
 dialogue.open=false;menu.open=false;choice.open=false;shop.open=false;debugMenu.open=false;warpMenu.open=false;worldToastTimer=0;
 const left=kind==='outdoor'?336:176,right=kind==='outdoor'?432:304;for(let x=left;x<=right;x+=2)if(!canWalk(x,player.y))throw Error('Benchmark lane blocked '+kind+' '+x);
 window.__perf.lane={left,right};await new Promise(r=>setTimeout(r,1000));return {mapId:mapIdForRef(activeMap),x:player.x,y:player.y,SPEED,slitherSpd,statusEffects,canvas:[canvas.width,canvas.height],css:[canvas.style.width,canvas.style.height],dpr:devicePixelRatio,quest:MainQuest,day,chunks:_REGIONAL_CHUNK_DEFINITIONS.length,party:persistentParty.getView().members.map(m=>m.characterId)};};
 window.__perf.run=async(walk,ms)=>{clearKeys();const lane=window.__perf.lane,s={walk,...lane,dir:'ArrowRight',update:[],render:[],times:[],distance:0,steps:0,excluded:0};if(walk)key(s.dir,true);window.__perf.samples=s;const start=performance.now();await new Promise(r=>setTimeout(r,ms));const end=performance.now();window.__perf.samples=null;clearKeys();const gaps=s.times.slice(1).map((v,i)=>v-s.times[i]);return {walk,seconds:(end-start)/1000,updates:s.steps,excludedUpdates:s.excluded,distancePx:s.distance,pxPerUpdate:s.distance/s.steps,pxPerSecond:s.distance/((end-start)/1000),framesPerSecond:s.times.length/((end-start)/1000),update:stats(s.update),render:stats(s.render),frame:stats(gaps),runtimeFailure:gameRuntimeFailure.isActive()};};
 return true;
})()`;
const smokeExpression=String.raw`(()=>{
 const checks=[],locations=[];const check=(v,s)=>{if(!v)throw Error(s);checks.push(s);};
 const key=(k,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key:k,bubbles:true}));
 const close=()=>{dialogue.open=menu.open=choice.open=shop.open=debugMenu.open=warpMenu.open=false;};
 const clear=()=>{for(const k of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'])key(k,false);};
 const walk=(k,n,goal)=>{key(k,true);try{for(let i=0;i<n;i++){update();if(goal?.())return;}}finally{key(k,false);}};
 const place=(id,x,y)=>{check(transitionToLocation({mapId:id,x,y,facing:'right'}),'Placement '+id);close();};
 function camera(label){render();check(regionalInvariantErrors().length===0,label+' canonical state');const p=regionalWorldPosition(),v=buildContinuousWorldPlanFromWorld(p.regionId,p.worldPxX,p.worldPxY,512,480);let area=0;for(const c of v.visibleChunks){area+=Math.max(0,Math.min(v.camPxX+512,c.worldPxX+512)-Math.max(v.camPxX,c.worldPxX))*Math.max(0,Math.min(v.camPxY+480,c.worldPxY+480)-Math.max(v.camPxY,c.worldPxY));}check(area===512*480,label+' camera framing');}
 check(storyCheckpointLab.apply('mq5_assignment_ready'),'Matching checkpoint');debugMode=true;forceLegacyRegionalView=false;close();
 for(const scale of [1,2]){
  canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
  for(const legacy of [false,true]){
   forceLegacyRegionalView=legacy;const a=mapIdForChunk('overworld',-1,-8),b=mapIdForChunk('overworld',0,-8),s=EDGE_TRANSITIONS[a].east.find(s=>s.targetMap===b),row=Math.floor((s.sourceRange[0]+s.sourceRange[1])/2);
   check(debugWarpToDestination('outdoor:'+a).success,'Negative debug warp');close();place(a,464,row*32+16);check(regionalWorldPosition().worldPxX<0,'Negative world X');check(saveGame()&&loadGame(),'Negative save/load');close();
   walk('ArrowRight',60,()=>mapIdForRef(activeMap)===b);check(mapIdForRef(activeMap)===b,'Held seam crossing legacy='+legacy+' scale='+scale);if(!legacy)camera('Seam');
  }
  forceLegacyRegionalView=false;
  const accessible=_REGIONAL_CHUNK_DEFINITIONS.filter(c=>c.playerAccessible!==false);
  for(const [axis,fn]of [['chunkX',Math.min],['chunkX',Math.max],['chunkY',Math.min],['chunkY',Math.max]]){
   const edge=fn(...accessible.map(c=>c[axis]));let lane=null;
   for(const c of accessible.filter(c=>c[axis]===edge)){
    for(let y=1;y<14&&!lane;y++)for(let x=1;x<13&&!lane;x++){
     const px=(x+.5)*32,py=(y+.5)*32;
     if(Array.from({length:17},(_,i)=>i*2).every(dx=>validatePlacement({mapId:c.mapId,x:px+dx,y:py,facing:'right'}).ok))lane={c,x:px,y:py};
    }if(lane)break;
   }
   check(!!lane,'Walkable bound lane '+axis+'='+edge);place(lane.c.mapId,lane.x,lane.y);const before=regionalWorldPosition();walk('ArrowRight',16);check(regionalWorldPosition().worldPxX-before.worldPxX===32,'Bound walking '+axis+'='+edge);camera('Bound '+axis+'='+edge);locations.push({mapId:lane.c.mapId,x:lane.x,y:lane.y,scale});
  }
  const c=REGIONAL_CHUNK_CATALOG.MAINLAND_C22R0_MAP;let bank=null;
  for(let y=1;y<14&&!bank;y++)for(let x=1;x<15&&!bank;x++)for(const [dx,dy,k,back]of [[1,0,'ArrowRight','ArrowLeft'],[-1,0,'ArrowLeft','ArrowRight'],[0,1,'ArrowDown','ArrowUp'],[0,-1,'ArrowUp','ArrowDown']]){
   const px=(x+.5)*32,py=(y+.5)*32;if(c.map[y+dy]?.[x+dx]===WATER&&validatePlacement({mapId:c.mapId,x:px,y:py,facing:'right'}).ok){bank={x:px,y:py,k,back};break;}
  }
  check(!!bank,'River-mouth bank');place(c.mapId,bank.x,bank.y);walk(bank.k,32);check(Math.hypot(player.x-bank.x,player.y-bank.y)>0&&Math.hypot(player.x-bank.x,player.y-bank.y)<16,'Water collision blocks passage');walk(bank.back,12,()=>player.x===bank.x&&player.y===bank.y);check(player.x===bank.x&&player.y===bank.y,'Shoreline retreat');camera('Shoreline');
  enterTownAt('calwick','south');enterHouse('player_house');placeAtLocation('HOUSE_INTERIOR_MAP',208,272);close();walk('ArrowRight',12);check(player.x===232&&player.y===272,'Indoor walking scale='+scale);render();
 }
 clear();place('MAP3',352,240);debugMode=false;player.step=15;combat.cooldown=0;const random=Math.random;Math.random=()=>0;
 try{walk('ArrowRight',1);}finally{Math.random=random;}
 check(combat.active||canonicalPartyCombat.isActive(),'Ordinary movement-triggered grass encounter');render();check(!gameRuntimeFailure.isActive(),'No runtime failure');
 return {ok:true,checks,locations,method:'Automated Chromium DOM held-key events with synchronous production update/render; not timed gameplay or a human playthrough.'};
})()`;

(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const dir=fs.mkdtempSync(path.join(os.tmpdir(),'verdant-perf-')),chrome=spawn(browser,['--headless','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+dir,'--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--window-size=1280,1100','about:blank']);chrome.stderr.on('data',()=>{});let cdp;
 try{for(let i=0;i<100&&!fs.existsSync(path.join(dir,'DevToolsActivePort'));i++)await wait(100);const port=fs.readFileSync(path.join(dir,'DevToolsActivePort'),'utf8').split('\n')[0],targets=await(await fetch('http://127.0.0.1:'+port+'/json')).json(),target=targets.find(t=>t.type==='page');const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});cdp=new CDP(ws);await cdp.call('Page.enable');await cdp.call('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});
 const all={phase,browser:await cdp.call('Browser.getVersion'),host:{platform:process.platform,arch:process.arch,node:process.version,cpu:os.cpus()[0]?.model},method:'Unthrottled real-time Chromium requestAnimationFrame production game loop. Headless, GPU disabled, one foreground page; native 512x480 Canvas at CSS 1x/2x; matching MQ5 solo fixture; ordinary grass MAP3 x336..432,y240. Debug suppresses encounters; blocked updates counted and excluded. Timings are browser measurements, not VM estimates.',branches:{}};
 for(const branch of (smokeOnly?['codex']:['main','codex'])){await cdp.call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/'+branch+'/index.html'});for(let i=0;i<200;i++){try{if(await cdp.eval('typeof storyCheckpointLab!=="undefined" && typeof loop==="function"'))break;}catch{}await wait(100);}await cdp.eval(instrumentation);if(smokeOnly){all.method='Automated Chromium input/collision/placement smoke checks; no timing measurements in this mode.';all.branches[branch]=await cdp.eval(smokeExpression);fs.writeFileSync(output+'.json',JSON.stringify(all,null,2)+'\n');console.log(JSON.stringify(all.branches[branch]));continue;}const results=[];
 for(const scale of [1,2])for(const kind of ['outdoor','indoor']){console.log(branch,scale,kind,'setup');const state=await cdp.eval('__perf.setup('+JSON.stringify(kind)+','+scale+')');console.log(JSON.stringify(state));for(const walk of [false,true]){const sample=await cdp.eval('__perf.run('+walk+','+(kind==='outdoor'?5000:3000)+')');results.push({scale,kind,state,...sample});console.log(branch,scale,kind,walk?'walk':'idle',JSON.stringify(sample));}all.branches[branch]=results;fs.writeFileSync(output+'.json',JSON.stringify(all,null,2)+'\n');}
 await cdp.eval('__perf.setup("outdoor",1)');await cdp.call('Profiler.enable');await cdp.call('Profiler.setSamplingInterval',{interval:1000});await cdp.call('Profiler.start');await cdp.eval('__perf.run(true,3000)');const {profile}=await cdp.call('Profiler.stop');await cdp.call('Profiler.disable');fs.writeFileSync(output+'-'+branch+'.cpuprofile',JSON.stringify(profile));all.branches[branch+'Profile']=profileSummary(profile);fs.writeFileSync(output+'.json',JSON.stringify(all,null,2)+'\n');console.log(branch,'profile',JSON.stringify(all.branches[branch+'Profile'].inclusive.slice(0,10)));}
 }finally{cdp?.ws.close();chrome.kill();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
