'use strict';
const assert=require('assert/strict');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {fresh,J}=require('./301-mornay-manifest.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const ids=['a','b','c','d'].map(part=>'debug_pinky_promise_v2_'+part);
function images(g,status='loaded'){
 g.run(`window.Image=function(){};
 Object.defineProperty(window.Image.prototype,'src',{set(value){this.srcValue=value;this.naturalWidth=value.includes('v2-b')?1585:1586;this.naturalHeight=992;${status==='loading'?'':status==='error'?'this.onerror();':'this.onload();'}}});`);
}
function open(g){g.press('`');for(let i=0;i<14;i++)g.press('ArrowDown');g.press('Enter');assert.equal(g.run('debugPromisePreview.isOpen()'),true);}
function snapshot(g){return g.run(`JSON.stringify({stats,party:persistentParty.getView(),player,day,
 map:regionalActiveMapId(),position:regionalWorldPosition,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),
 cutaway:seraLioraCutscene,room:seraLioraGuestRoomWalk,cooldown:combat.cooldown})`);}
test('debug input opens, plays exactly three seconds, replays and returns without changing the world',()=>{
 const g=fresh();images(g);g.run('combat.cooldown=99');assert.equal(g.run('saveGame()'),true);g.run('dialogue.open=false');
 const before=snapshot(g);open(g);assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
 assert.deepEqual(J(g,'activityOwnership.active()'),['promise_preview','debug']);
 g.frames();assert.equal(g.run('debugPromisePreview.getView().elapsed'),0);
 g.run('update(0,.124)');assert.equal(g.run('debugPromisePreview.getView().frame'),0);
 g.run('update(0,.001)');assert.equal(g.run('debugPromisePreview.getView().frame'),1,'each pose lasts exactly 125ms');
 g.press('Enter');
 g.hold('ArrowRight');g.frames(60);g.release('ArrowRight');assert.equal(g.run('debugPromisePreview.getView().phase'),'playing');
 assert.equal(g.run('debugPromisePreview.getView().frame'),8);
 assert.equal(snapshot(g),before);
 g.run('update(0,1.99)');assert.equal(g.run('debugPromisePreview.getView().phase'),'playing');
 g.run('update(0,.01)');assert.deepEqual(J(g,'debugPromisePreview.getView()'),{phase:'complete',elapsed:3,duration:3,frame:23});
 const complete=J(g,'debugPromisePreview.getView()');g.frames(120);assert.deepEqual(J(g,'debugPromisePreview.getView()'),complete);
 g.press('Enter');assert.equal(g.run('debugPromisePreview.getView().elapsed'),0);g.frames(20);
 g.hold('Enter');g.frames(20);const heldTime=g.run('debugPromisePreview.getView().elapsed');
 g.hold('Enter');assert.equal(g.run('debugPromisePreview.getView().elapsed'),heldTime,'held confirm cannot restart each frame');g.release('Enter');
 g.press('Escape');assert.equal(g.run('debugPromisePreview.isOpen()'),false);assert.equal(g.run('debugMenu.open'),true);
 assert.equal(g.run('debugMenu.cursor'),14);assert.equal(snapshot(g),before);assert.equal(g.run('canSaveHere()'),true);
});
test('slow or failed images never spend playback time or trap the player; stale loads cannot reopen it',()=>{
 for(const status of ['loading','error']){
  const g=fresh();images(g,status);const before=snapshot(g);open(g);g.run('update(0,25)');
  assert.equal(g.run('debugPromisePreview.getView().phase'),status);assert.equal(g.run('debugPromisePreview.getView().elapsed'),0);
  g.press('`');assert.equal(g.run('debugPromisePreview.isOpen()'),false);
  for(const id of ids)g.run(`imageAssetRuntime('${id}').image.onload()`);
  assert.equal(g.run('debugPromisePreview.isOpen()'),false);assert.equal(snapshot(g),before);
 }
});
test('all sheets must load before playback; a later-sheet failure is cancellable',()=>{
 for(const fail of [false,true]){
  const g=fresh();images(g,'loading');open(g);
  for(const id of ids.slice(0,3))g.run(`imageAssetRuntime('${id}').image.onload()`);
  g.run('update(0,10)');assert.equal(g.run('debugPromisePreview.getView().phase'),'loading');
  assert.equal(g.run('debugPromisePreview.getView().elapsed'),0);
  g.run(`imageAssetRuntime('${ids[3]}').image.${fail?'onerror':'onload'}();update(0,10)`);
  assert.equal(g.run('debugPromisePreview.getView().phase'),fail?'error':'playing');
  assert.equal(g.run('debugPromisePreview.getView().elapsed'),0);
  g.press('Escape');assert.equal(g.run('debugPromisePreview.isOpen()'),false);
 }
});
test('24 distinct source crops play in order for 125ms each, including sheet boundaries',()=>{
 const g=fresh();images(g);assert.equal(g.run('debugPromisePreview.open()'),false,'requires the actual debug menu');open(g);g.frames();
 const before=snapshot(g);g.run('var crops=[];ctx.drawImage=(image,...args)=>crops.push([image.srcValue,...args]);');
 for(let i=0;i<24;i++){
  assert.equal(g.run('debugPromisePreview.getView().phase'),'playing');
  assert.equal(g.run('debugPromisePreview.getView().frame'),i);
  g.run('render();update(0,.124)');assert.equal(g.run('debugPromisePreview.getView().frame'),i);
  g.run('update(0,.001)');
 }
 assert.equal(g.run('debugPromisePreview.getView().phase'),'complete');
 assert.equal(g.run('debugPromisePreview.getView().elapsed'),3);
 const registry=J(g,'IMAGE_ASSET_REGISTRY'),crops=J(g,'crops');assert.equal(crops.length,24);
 assert.equal(new Set(crops.map(c=>c.slice(0,3).join(','))).size,24);
 crops.forEach(([src,x,y,w,h,dx,dy,dw,dh],i)=>{
  const meta=registry[ids[Math.floor(i/6)]];assert.equal(src,meta.path,'six consecutive poses per sheet');
  assert.ok(x>=0&&y>=0&&x+w<=meta.width&&y+h<=meta.height);assert.ok(dx>=0&&dy>=28&&dx+dw<=512&&dy+dh<=448);
 });
 assert.equal(snapshot(g),before);const view=J(g,'debugPromisePreview.getView()');g.run('render();render()');assert.deepEqual(J(g,'debugPromisePreview.getView()'),view);
 assert.equal(g.run('SAVE_VERSION'),5);
 for(const id of ids){
  assert.ok(!Object.values(J(g,'IMAGE_ASSET_BUNDLES')).flat().includes(id));
  const meta=registry[id],p=path.join(__dirname,'../..',meta.path),png=fs.readFileSync(p);
  assert.equal(png.readUInt32BE(16),meta.width);assert.equal(png.readUInt32BE(20),meta.height);
 }
 // Original production promise art is untouched by this separate study.
 const original=fs.readFileSync(path.join(__dirname,'../../assets/backgrounds/cutaways/sera-liora/breakfast-v1/pinky-promise-v1.png'));
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'387da6cd2a0d57a4ac6a908ded87ddd2489103f3c3b2708329b1457975f6580f');
});
module.exports={name:'Pinky promise debug animation: timing, input, asset failures and state isolation',checks,
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' promise preview scenarios passed');}};
