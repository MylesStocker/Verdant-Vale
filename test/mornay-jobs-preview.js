'use strict';
(async()=>{try{
 const html=await(await fetch('../index.html',{cache:'no-store'})).text();
 for(const [,src]of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((ok,fail)=>{const s=document.createElement('script');s.src='../'+src+'?jobs='+Date.now();s.onload=ok;s.onerror=fail;document.body.append(s);});
 storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;completeMq5Assignment();debugMode=true;
 const spots=[['Job board','MORNAY_SOUTH_UPPER_EAST_MAP',240,192],...['mornay_iset_brill','mornay_torlin_hesk','mornay_gessa_tarn','mornay_arlis_rook','mornay_maura_dell'].map(id=>{const n=MORNAY_RESIDENTS.find(n=>n.id===id);return [n.name,n.mapId,n.x*TILE+(id==='mornay_maura_dell'?24:0),n.y*TILE+(id==='mornay_maura_dell'?0:24)];}),...MORNAY_REMOVALS.map(b=>[b.title,b.mapId,b.x*TILE,b.y*TILE+24])];
 for(const [label,mapId,x,y]of spots){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{if(canonicalPartyCombat.isActive())return;dialogue.open=choice.open=false;dialogue.callbacks=null;const room=mornayRoomForMap(mapId);const town=mapId.startsWith('MORNAY_');transitionToLocation({mapId,x,y,state:town?{inTown:true,currentTownId:'mornay',townBuilding:room?.id||null}:{}});canvas.focus();};document.getElementById('places').append(b);}
 document.getElementById('scale').onclick=()=>{const large=canvas.style.width!=='1024px';canvas.style.width=large?'1024px':'512px';canvas.style.height=large?'960px':'480px';document.getElementById('scale').textContent=large?'1× scale':'2× scale';canvas.focus();};
 document.getElementById('places').firstChild.click();
 setInterval(()=>{const d=gameRuntimeFailure.getDiagnostic();if(d)document.getElementById('error').textContent=d.phase+': '+d.error.stack;},250);
}catch(e){document.getElementById('error').textContent=e.stack;}})();
