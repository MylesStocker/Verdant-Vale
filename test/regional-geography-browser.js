/* Production Canvas/input review; never loaded by index.html. */
(async()=>{
 const result={checks:[],captures:[],errors:[]},check=(v,s)=>{if(!v)throw Error(s);result.checks.push(s);};
 window.addEventListener('error',e=>result.errors.push(e.message));window.requestAnimationFrame=()=>1;
 try{
  const html=await(await fetch('../index.html')).text();
  for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
  check(storyCheckpointLab.apply('mq5_assignment_ready'),'MQ5 test fixture');dialogue.open=false;debugMode=true;worldToastTimer=0;
  const press=(key,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));
  function walk(key,goal,label){press(key,true);try{let n=0;while(!goal()&&n++<500)update();check(goal(),label);}finally{press(key,false);}}
  function place(id,x,y){check(transitionToLocation({mapId:id,x,y,facing:'right'}),'Placement '+id);dialogue.open=false;}
  function safe(id){const c=mapRefForId(id),points=[];for(let y=1;y<14;y++)for(let x=1;x<15;x++)points.push([x*32+16,y*32+16]);points.sort((a,b)=>Math.hypot(a[0]-240,a[1]-240)-Math.hypot(b[0]-240,b[1]-240));const p=points.find(p=>validatePlacement({mapId:id,x:p[0],y:p[1],facing:'up'}).ok);check(!!p,'Safe view '+id);place(id,...p);}
  const capture=name=>{render();const out=document.createElement('canvas'),scale=parseInt(canvas.style.width)/512||1;out.width=512*scale;out.height=480*scale;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,out.width,out.height);result.captures.push({name,png:out.toDataURL()});};
  for(const legacy of [false,true]){
   forceLegacyRegionalView=legacy;
   const a=mapIdForChunk('overworld',-1,-8),b=mapIdForChunk('overworld',0,-8),seg=(EDGE_TRANSITIONS[a]?.east||[]).find(s=>s.targetMap===b);check(!!seg,'Negative-to-zero seam exists');const i=Math.floor((seg.sourceRange[0]+seg.sourceRange[1])/2);place(a,464,i*32+16);
   check(regionalWorldPosition().worldPxX<0,'Negative canonical X');check(saveGame()&&loadGame(),'Negative coordinate save/load');dialogue.open=false;
   walk('ArrowRight',()=>mapIdForRef(activeMap)===b,'Held negative-to-zero crossing '+legacy);check(regionalInvariantErrors().length===0,'Canonical invariants after crossing');
  }
  for(const legacy of [false,true])for(const row of [49,120]){
   forceLegacyRegionalView=legacy;const cells=[];
   for(const c of Object.values(REGIONAL_CHUNK_CATALOG))if(c.chunkY===Math.floor(row/15)&&c.chunkX>=21&&c.chunkX<=27)for(let col=0;col<16;col++)if(c.map[row%15][col]===BRIDGE_DECK)cells.push(c.chunkX*16+col);
   const left=Math.min(...cells),right=Math.max(...cells),start=left-1,end=right+1,id=mapIdForChunk('overworld',Math.floor(start/16),Math.floor(row/15));
   check(Number.isFinite(left),'River bridge '+row);place(id,(start-Math.floor(start/16)*16+.5)*32,(row%15+.5)*32);
   walk('ArrowRight',()=>regionalWorldPosition().worldPxX>=(end+.5)*32,'Complete river crossing '+row+' legacy='+legacy);
  }
  forceLegacyRegionalView=false;
  const views=[[-6,-10,'western-willow-fen'],[4,-12,'northern-peat-fans'],[-1,-8,'negative-column-fen'],[4,8,'thornmere-east-bank'],[0,8,'thornmere-west-bank'],[2,10,'thornmere-south-shore'],[9,8,'southern-woodland'],[22,0,'river-mouth'],[22,3,'lower-river-crossing'],[25,8,'moraine-river-gap'],[28,10,'upper-river-country'],[24,0,'lake-headland']];
  for(const scale of [1,2]){
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   for(const [x,y,label]of views){const id=mapIdForChunk('overworld',x,y);check(mapPlayerAccessible(id),'Accessible view '+label);safe(id);capture(label+'-'+scale+'x');check(saveGame()&&loadGame(),'View save/load '+label);dialogue.open=false;}
   place('EASTERN_FENS_REEDBELT_N_MAP',240,144);capture('zolom-southern-warning-'+scale+'x');check(!isEncounterEligibleTile(tileAt(player.x,player.y)),'Safe Zolom observation bar');
   for(const town of ['calwick','drenwick']){enterTownAt(town,'south');dialogue.open=false;capture(town+'-'+scale+'x');}
  }
  // The early region keeps its original closed-edge framing inside the larger world.
  for(const scale of [1,2]){
   canvas.style.width=512*scale+'px';canvas.style.height=480*scale+'px';
   for(const [id,x,y,edge,name]of [['MAP_N1',48,144,'west','northern-road-west'],['MAP_N2',48,336,'west','blocked-path-west'],['MAP2',176,432,'south','eastern-reaches-south'],['MAP3',432,432,'south','thornmere-fen-south']]){
    place(id,x,y);const p=regionalWorldPosition(),v=buildContinuousWorldPlanFromWorld(p.regionId,p.worldPxX,p.worldPxY,512,480);
    check(edge==='west'?v.camPxX===0:v.camPxY===2400,'Original camera edge '+id+' scale='+scale);capture(name+'-'+scale+'x');
   }
   place('MAP3',336,400);press('ArrowDown',true);try{for(let i=0;i<100;i++)update();}finally{press('ArrowDown',false);}
   check(mapIdForRef(activeMap)==='MAP3'&&player.y<=407,'Water closes southern route scale='+scale);capture('thornmere-water-barrier-'+scale+'x');
  }
  // Read-only cartographic views of scenery which cannot be entered by players.
  // These deliberately bypass neither placement nor camera rules: only tile art
  // is painted into the QA canvas, with canonical gameplay state held unchanged.
  const beforeScenery=JSON.stringify({position:regionalWorldPosition(),map:mapIdForRef(activeMap),x:player.x,y:player.y});
  for(const scale of [1,2])for(const [cx,cy,label]of [[-3,5,'wetwoods-stream'],[-5,5,'wetwoods-clearing'],[-7,9,'wetwoods-southern-woods'],[2,8,'thornmere-open-water'],[10,-11,'valmere-fen-bank'],[12,-4,'valmere-western-cove'],[13,-7,'valmere-spit-tip'],[27,-2,'valmere-eastern-headland']]){
   const id=mapIdForChunk('overworld',cx,cy);check(!mapPlayerAccessible(id),'Scenery stays inaccessible '+label);
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#162630';ctx.fillRect(0,0,512,480);
   ctx.setTransform(1,0,0,1,-cx*512,-cy*480);
   drawMapTiles(mapRefForId(id),cx*512,cy*480);ctx.setTransform(1,0,0,1,0,0);
   const out=document.createElement('canvas');out.width=512*scale;out.height=480*scale;const art=out.getContext('2d');art.imageSmoothingEnabled=false;art.drawImage(canvas,0,0,out.width,out.height);
   result.captures.push({name:label+'-'+scale+'x',png:out.toDataURL()});
  }
  check(JSON.stringify({position:regionalWorldPosition(),map:mapIdForRef(activeMap),x:player.x,y:player.y})===beforeScenery,'Scenery review never changes gameplay placement');
  // The overview uses the game's own tile painter at stable world coordinates.
  const bounds=regionPixelBounds('overworld'),scale=4/32;
  canvas.width=Math.round(bounds.widthPx*scale);canvas.height=Math.round(bounds.heightPx*scale);
  ctx.fillStyle='#162630';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(scale,0,0,scale,-bounds.leftPx*scale,-bounds.topPx*scale);
  for(const c of Object.values(REGIONAL_CHUNK_CATALOG))drawMapTiles(c.map,c.chunkX*512,c.chunkY*480);
  ctx.setTransform(1,0,0,1,0,0);result.captures.push({name:'production-overview',png:canvas.toDataURL()});
  check(result.errors.length===0,'No browser errors');result.ok=true;
 }catch(e){result.ok=false;result.errors.push(e.stack||String(e));}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
