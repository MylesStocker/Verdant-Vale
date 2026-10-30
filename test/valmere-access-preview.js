'use strict';
(async()=>{
 window.requestAnimationFrame=()=>1;
 try{
  const html=await(await fetch('../index.html',{cache:'no-store'})).text();
  for(const[,src]of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((ok,fail)=>{const s=document.createElement('script');s.src='../'+src+'?review='+Date.now();s.onload=ok;s.onerror=fail;document.body.append(s);});
  storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();dialogue.open=false;debugMode=true;worldToastTimer=0;
  const mode=new URLSearchParams(location.search).get('view')||'shore';
  const place=(mapId,x,y,state={})=>{if(!transitionToLocation({mapId,x,y,facing:'up',state}))throw Error('Invalid fixture '+mapId);};
  if(mode==='shop'||mode==='lead'){
   const id=mode==='shop'?'mornay_henric_sorn':'mornay_messa_yule',r=MORNAY_RESIDENTS.find(n=>n.id===id),b=mornayRoomForMap(r.mapId);
   let point;for(const[dx,dy]of [[0,24],[24,0],[-24,0],[0,-24]]){const x=r.x*32+dx,y=r.y*32+dy;if(validatePlacement({mapId:r.mapId,x,y,facing:'up',state:{inTown:true,currentTownId:'mornay',townBuilding:b.id}}).ok){point=[x,y];break;}}
   if(!point)throw Error('No talk position');place(r.mapId,...point,{inTown:true,currentTownId:'mornay',townBuilding:b.id});
  }else if(mode==='warning')place('EASTERN_FENS_REEDBELT_N_MAP',240,80);
  else if(mode==='north')place('MAINLAND_C9RN12_MAP',15.5*32,10.5*32);
  else if(mode==='battle'){
   place('EASTERN_FENS_ENVELOPE_C7R0_MAP',240,336);stats.hp=stats.maxHp=300;stats.items=[createItem('Serpentsmoke')];canonicalPartyCombat.enter({enemies:['enemy_fen_zolom'],escape:'fastest_living'});
  }else place('MAINLAND_C10RN11_MAP',10.5*32,10.5*32);
  document.getElementById('scale').onclick=()=>{const big=canvas.style.width!=='1024px';canvas.style.width=big?'1024px':'512px';canvas.style.height=big?'960px':'480px';};
  setInterval(()=>{update(1/60);render();document.getElementById('result').textContent=regionalActiveMapId()+' — '+(canonicalPartyCombat.isActive()?canonicalPartyCombat.getView().phase:dialogue.open?'dialogue':shop.open?'shop':'field')+' — gold '+stats.gold+' — local '+player.x+','+player.y;},1000/60);
  for(const [label,key]of [['Walk north','ArrowUp'],['Walk east','ArrowRight'],['Walk south','ArrowDown'],['Walk west','ArrowLeft']]){
   const b=document.createElement('button');b.textContent=label;b.onclick=()=>{canvas.focus();window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));for(let frame=0;frame<45;frame++)update(1/60);window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));render();};document.getElementById('scale').parentElement.append(b);
  }
  canvas.focus();
 }catch(e){document.getElementById('result').textContent=e.stack;}
})();
