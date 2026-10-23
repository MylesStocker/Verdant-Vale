'use strict';
const assert=require('assert/strict');
const {J,fresh,place}=require('./301-mornay-manifest.test');
module.exports={
 name:'Mornay room rendering: each fixture/resident/player once, actors behind/in front, HUD-only room names and unchanged ordinary-town draw dispatch',
 run(){
  const g=fresh();
  g.run(`var roomDrawLog=[],roomTextLog=[];
   var originalFixture=drawMornayFixture,originalActor=drawOneContentNPC,originalPlayer=drawPlayer,originalText=ctx.fillText;
   drawMornayFixture=function(f){roomDrawLog.push({kind:'fixture',col:f.col,row:f.row,width:f.w||1});return originalFixture(f);};
   drawOneContentNPC=function(n){roomDrawLog.push({kind:'npc',id:n.id,x:n.x,y:n.y});return originalActor(n);};
   drawPlayer=function(){roomDrawLog.push({kind:'player',x:player.x,y:player.y});return originalPlayer();};
   ctx.fillText=function(text,...args){roomTextLog.push(String(text));return originalText.call(ctx,text,...args);};`);
  const rooms=J(g,'MORNAY_BUILDINGS');let behind=0,front=0;
  for(const day of [1,5])for(const room of rooms){
   g.run(`day=${day};`);place(g,room.mapId);
   g.run('roomDrawLog=[];roomTextLog=[];');g.renderFrame();
   const log=J(g,'roomDrawLog'),fixtures=J(g,`MORNAY_ROOM_FIXTURES[${JSON.stringify(room.id)}]`);
   const actors=J(g,'MORNAY_NPCS.filter(n=>n.map===currentContentLocationKey()).map(n=>n.id)');
   assert.deepEqual(log.filter(e=>e.kind==='npc').map(e=>e.id).sort(),actors.sort(),room.id+' no doubled or omitted residents');
   assert.equal(log.filter(e=>e.kind==='player').length,1,room.id+' player drawn once');
   assert.deepEqual(log.filter(e=>e.kind==='fixture').map(e=>[e.col,e.row,e.width]).sort(),fixtures.map(f=>[f.col,f.row,f.w||1]).sort(),room.id+' every fixture drawn once');
   for(let i=0;i<log.length;i++)if(log[i].kind==='fixture')for(let j=0;j<log.length;j++)if(log[j].kind!=='fixture'){
    const f=log[i],actor=log[j];
    if(actor.x<f.col*32-12||actor.x>(f.col+f.width)*32+12)continue;
    // Compare physically separated actors, independent of renderer depth offsets.
    if(actor.y<f.row*32-8){assert.ok(j<i,room.id+' actor behind furniture draws first');behind++;}
    if(actor.y>(f.row+1)*32+8){assert.ok(j>i,room.id+' actor in front of furniture draws last');front++;}
   }
   const normalize=s=>s.toUpperCase().replace(/[^A-Z0-9]/g,'');
   const title=normalize(room.name);
   assert.ok(J(g,'roomTextLog').every(text=>!normalize(text).includes(title)),room.id+' room title is not duplicated on canvas');
   assert.equal(g.run('titleEl.textContent'),g.run('locationName()'),room.id+' existing HUD owns the title');
  }
  assert.ok(behind>0&&front>0,'both occlusion directions exercised with real authored actors');
  g.run(`drawMornayFixture=originalFixture;drawOneContentNPC=originalActor;drawPlayer=originalPlayer;ctx.fillText=originalText;
   function canvasCommands(draw){
    const commands=[],saved={},methods=['save','restore','translate','scale','fillRect','strokeRect','fillText','beginPath','closePath','moveTo','lineTo','ellipse','arc','fill','stroke'];
    ctx.fillStyle='#000';ctx.strokeStyle='#000';ctx.font='10px monospace';
    for(const method of methods){saved[method]=ctx[method];ctx[method]=function(...args){
     commands.push([method,args,...(/^(fill|stroke)/.test(method)?[ctx.fillStyle,ctx.strokeStyle,ctx.font]:[])]);
    };}
    try{draw();}finally{for(const method of methods)ctx[method]=saved[method];}return commands;
   }`);
  for(const id of ['aldric','petra','corvin','gault']){
   const key=JSON.stringify(id);
   assert.equal(g.run(`!!SIMPLE_NPCS.find(n=>n.id===${key}).authoredPose`),false);
   assert.equal(g.run(`!!NPC_ROUTES[${key}]`),false,'stationary legacy renderer reference');
   assert.deepEqual(J(g,`canvasCommands(()=>drawOneContentNPC(SIMPLE_NPCS.find(n=>n.id===${key})))`),
    J(g,`canvasCommands(()=>{const n=SIMPLE_NPCS.find(n=>n.id===${key});(NPC_DRAW_FNS[n.id]||drawGenericNPC)(n);})`),id+' exact legacy Canvas command sequence');
  }
  g.run(`drawMornayResident=()=>{throw Error('Mornay pose adapter used outside its opt-in residents');};`);
  for(const town of ['calwick','drenwick']){
   g.run(`enterTownAt('${town}','south');dialogue.open=false;`);
   assert.equal(g.run('isMornayRoomView()'),false);g.renderFrame();
  }
 }
};
