'use strict';

// Standalone art study. The real cutaway never requests this asset or controller.
// All state is session-only; the debug menu remains the return destination.
const debugPromisePreview=(()=>{
 const assetIds=['a','b','c','d'].map(part=>'debug_pinky_promise_v2_'+part),frameSeconds=1/8;
 const frames=assetIds.flatMap(assetId=>IMAGE_ASSET_REGISTRY[assetId].frames.map(origin=>({assetId,origin})));
 const duration=frames.length*frameSeconds;
 let phase='closed',elapsed=0;
 const isOpen=()=>phase!=='closed';
 function open(){
  if(isOpen()||!debugMenu.open||activityOwnership.conflicts(['debug']).length)return false;
  phase='loading';elapsed=0;reconcileFormationLabKeys();assetIds.forEach(loadImageAsset);return true;
 }
 function close(){phase='closed';elapsed=0;reconcileFormationLabKeys();}
 function keyDown(key){
  if(key==='Escape'||key==='`'){close();return;}
  if((key==='Enter'||key===' ')&&['playing','complete'].includes(phase)){
   elapsed=0;phase='playing';
  }
 }
 function update(dt=1/60){
  if(phase==='loading'){
   const statuses=assetIds.map(id=>imageAssetRuntime(id).status);
   if(statuses.includes('error'))phase='error';
   else if(statuses.every(status=>status==='loaded')){phase='playing';elapsed=0;}
   return;
  }
  if(phase!=='playing'||!Number.isFinite(dt)||dt<0)return;
  elapsed=Math.min(duration,elapsed+dt);
  if(duration-elapsed<1e-9){elapsed=duration;phase='complete';}
 }
 function getView(){return Object.freeze({phase,elapsed,duration,frame:Math.min(frames.length-1,Math.floor((elapsed+1e-9)/frameSeconds))});}
 function draw(){
  if(!isOpen())return false;
  const view=getView(),{assetId,origin}=frames[view.frame],meta=IMAGE_ASSET_REGISTRY[assetId],image=loadedImageAsset(assetId);
  ctx.save();
  try{
   ctx.fillStyle='#08121e';ctx.fillRect(0,0,512,480);
   if(image&&['playing','complete'].includes(phase)){
    const w=meta.frameWidth,h=meta.frameHeight,scale=Math.min(512/w,420/h),dw=w*scale,dh=h*scale;
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(image,origin.x,origin.y,w,h,(512-dw)/2,28+(420-dh)/2,dw,dh);
   }
   ctx.textAlign='center';ctx.font='12px "Courier New", monospace';ctx.fillStyle='#e1d5ba';
   ctx.fillText('Sera & Liora — Pinky Promise',256,18);
   if(phase==='loading'||phase==='error'){
    ctx.fillText(phase==='loading'?'Loading animation…':'Image unavailable. Reload to try again.',256,235);
   }
   ctx.fillStyle='#9fc9c5';ctx.font='11px "Courier New", monospace';
   ctx.fillText(phase==='loading'||phase==='error'?'ESC: back to debug menu':'ENTER: replay 3s  ·  ESC: back',256,469);
   ctx.fillStyle='#a68a54';ctx.fillRect(16,450,480*(elapsed/duration),2);
  }finally{ctx.restore();}
  return true;
 }
 return Object.freeze({isOpen,open,close,keyDown,update,getView,draw});
})();
