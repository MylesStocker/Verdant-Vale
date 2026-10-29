'use strict';
(async()=>{
 try{
  const html=await(await fetch('../index.html')).text();
  for(const [,source]of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{
   const s=document.createElement('script');s.src='../'+source;s.onload=resolve;s.onerror=()=>reject(Error(source));document.body.append(s);
  });
  const places=[['North Mornay','MORNAY_NORTH_UPPER_EAST_MAP'],['Net Lane','MORNAY_FLECK_NECK_MAP'],['Water Steps','MORNAY_FLECK_POINT_MAP'],['Crooked Oar','MORNAY_FLECK_TAVERN_MAP'],['Main Floor','MORNAY_FLECK_HOUSE_MAP'],['Lower Landing','MORNAY_FLECK_CELLAR_MAP'],['Main Room','MORNAY_FLECK_FLAT_1_MAP'],['Lower Room','MORNAY_FLECK_FLAT_3_MAP']];
  for(const [name,mapId]of places){
   const button=document.createElement('button');button.textContent=name;button.onclick=()=>{
    if(fishing.active)endFishing();dialogue.open=choice.open=shop.open=false;
    const room=mornayRoomForMap(mapId),arrival=room?mornayInteriorEntrance(room):null;
    transitionToLocation({mapId,x:240,y:arrival?(arrival.arrivalRow+.5)*32:mapId==='MORNAY_FLECK_POINT_MAP'?240:432,state:{inTown:true,currentTownId:'mornay',townBuilding:room?.id||null}});canvas.focus();
   };document.getElementById('places').append(button);
  }
  document.getElementById('scale').onclick=()=>{const doubled=canvas.style.width!=='1024px';canvas.style.width=doubled?'1024px':'512px';canvas.style.height=doubled?'960px':'480px';document.getElementById('scale').textContent=doubled?'1× scale':'2× scale';canvas.focus();};
  grantItem('Old Fishing Rod');for(let i=0;i<8;i++)grantItem('Bait');stats.gold=100;
  document.getElementById('places').firstChild.click();
 }catch(e){document.getElementById('error').textContent=e.stack;}
})();
