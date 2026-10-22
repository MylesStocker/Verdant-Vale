(async()=>{
 const result={captures:[],errors:[]};window.requestAnimationFrame=()=>1;
 try{const base=document.createElement("base");base.href="/";document.head.append(base);
 const html=await(await fetch('../index.html')).text();
 for(const m of html.matchAll(/<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g))await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../'+m[1];s.onload=resolve;s.onerror=reject;document.body.append(s);});
 await preloadImageAssetBundle('sera_liora_opening');
 debugPlaySeraLioraCutaway();revealBethanyGuestRoom();dialogue.open=false;
 const snap=name=>{render();for(const scale of [1,2]){const c=document.createElement('canvas');c.width=512*scale;c.height=480*scale;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(canvas,0,0,c.width,c.height);result.captures.push({name:name+'-'+scale+'x',png:c.toDataURL()});}};
 seraLioraCutscene.phase='room_reveal';seraLioraCutscene.waitFrames=16;seraLioraCutscene.revealAlpha=0;snap('approach');
 seraLioraCutscene.phase='room_dialogue';seraLioraCutscene.lioraPose='sitting';snap('waking');
 continueSeraLioraCutawayAfterOpening();snap('takeover');
 seraLioraGuestRoomWalk.x=320;seraLioraGuestRoomWalk.lioraX=235;snap('standing');
 seraLioraGuestRoomWalk.x=155;seraLioraGuestRoomWalk.y=300;seraLioraGuestRoomWalk.moving=true;seraLioraGuestRoomWalk.facing='left';seraLioraGuestRoomWalk.animationFrame=0;snap('behind-bed');
 seraLioraGuestRoomWalk.x=170;seraLioraGuestRoomWalk.y=400;seraLioraGuestRoomWalk.facing='up';snap('front-bed');
 result.ok=true;
 }catch(e){result.errors.push(e.stack||String(e));result.ok=false;}
 document.getElementById('results').textContent=JSON.stringify(result);
})();
