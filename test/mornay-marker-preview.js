'use strict';
(async()=>{
 try{
  const html=await(await fetch('../index.html',{cache:'no-store'})).text();
  for(const [,source]of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{
   const s=document.createElement('script');s.src='../'+source+'?marker-review='+Date.now();s.onload=resolve;s.onerror=()=>reject(Error(source));document.body.append(s);
  });
  for(const [name,part,x,y]of [['West approach','MORNAY_TOWN_APPROACH',240,208],['East approach','MORNAY_TOWN_APPROACH',272,208],['West flank','MORNAY_TOWN_APPROACH',176,80],['East flank','MORNAY_TOWN_APPROACH',336,80],['Neck Road','MORNAY_NECK_ROAD',240,240],['Road bend','MORNAY_APPROACH_E',240,304],['Shore road','VALMERE_SHORE_W',240,336]]){
   const b=document.createElement('button');b.textContent=name;b.onclick=()=>{dialogue.open=choice.open=shop.open=false;transitionToLocation({mapId:'EASTERN_FENS_'+part+'_MAP',x,y,facing:'up'});canvas.focus();};document.getElementById('places').append(b);
  }
  document.getElementById('scale').onclick=()=>{const large=canvas.style.width!=='1024px';canvas.style.width=large?'1024px':'512px';canvas.style.height=large?'960px':'480px';document.getElementById('scale').textContent=large?'1× scale':'2× scale';canvas.focus();};
  document.getElementById('legacy').onclick=()=>{forceLegacyRegionalView=!forceLegacyRegionalView;document.getElementById('legacy').textContent=forceLegacyRegionalView?'Continuous view':'Legacy view';canvas.focus();};
  document.getElementById('places').firstChild.click();
 }catch(e){document.getElementById('error').textContent=e.stack;}
})();
