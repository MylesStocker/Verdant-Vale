'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const {createContext}=require('../harness');
const ROOT=path.join(__dirname,'../..'),rel=p=>path.join(ROOT,p);
const asset=p=>'assets/sprites/cutaways/sera-liora/depth-v2/'+p+'.png';
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function decodeRgbaPng(relativePath) {
  const png = fs.readFileSync(rel(relativePath));
  assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
  let offset = 8;
  let channels = 4;
  let width = 0;
  let height = 0;
  const idat = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString('ascii');
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, 'rotation sources use 8-bit channels');
      assert.ok(data[9]===2||data[9]===6); channels=data[9]===2?3:4;
      assert.equal(data[12], 0, 'rotation sources are non-interlaced');
    } else if (type === 'IDAT') {
      idat.push(data);
    }
    offset += length + 12;
  }
  const packed = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  let packedOffset = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
  };
  for (let y = 0; y < height; y++) {
    const filter = packed[packedOffset++];
    for (let x = 0; x < stride; x++) {
      const raw = packed[packedOffset++];
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      let value;
      if (filter === 0) value = raw;
      else if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) value = raw + paeth(left, up, upperLeft);
      else assert.fail('unsupported PNG filter ' + filter);
      pixels[y * stride + x] = value & 255;
    }
  }
  if(channels===3){const rgba=Buffer.alloc(width*height*4);for(let i=0;i<width*height;i++){pixels.copy(rgba,i*4,i*3,i*3+3);rgba[i*4+3]=255;}return {width,height,pixels:rgba};}
  return { width, height, pixels };
}


function opaqueBounds(im,rect={x:0,y:0,w:im.width,h:im.height}) {
 let minX=rect.w,minY=rect.h,maxX=-1,maxY=-1;
 for(let y=0;y<rect.h;y++)for(let x=0;x<rect.w;x++)if(im.pixels[((y+rect.y)*im.width+x+rect.x)*4+3]>16){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
 return {minX,minY,maxX,maxY,height:maxY-minY+1};
}
function images(g){g.run(`window.Image=function(){this.onload=null;this._src='';};Object.defineProperty(window.Image.prototype,'src',{set:function(v){this._src=v;const m=Object.values(IMAGE_ASSET_REGISTRY).find(m=>m.path===v);this.naturalWidth=m.width;this.naturalHeight=m.height;this.onload();},get:function(){return this._src;}});`);}
module.exports={name:'Sera/Liora shared character metrics, real animation pixels and reusable scene depth',run(){
 const reference='Art/qa/sera-liora/Sera and Liora between twin beds.png';
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(rel(reference))).digest('hex'),'47fbf97862f2865fda59a0750970112933fe0cdbd41c49bc29b0544b27c9a025');
 const g=createContext();g.press('Enter');g.press('Enter');images(g);
 assert.ok(Object.values(J(g,'IMAGE_ASSET_REGISTRY')).every(m=>m.path!==reference));
 assert.equal(g.run('validateSeraLioraSceneMetrics()'),true);
 const m=J(g,'SERA_LIORA_SCENE_METRICS');
 assert.equal(g.run('(function check(v){return !v||typeof v!=="object"||Object.isFrozen(v)&&Object.values(v).every(check);})(SERA_LIORA_SCENE_METRICS)'),true);
 assert.ok(m.Liora.height/m.Sera.height>=1.01&&m.Liora.height/m.Sera.height<=1.02);
 const walk=decodeRgbaPng(asset('sera-walk')),standing=decodeRgbaPng(asset('liora-standing'));
 assert.deepEqual([walk.width,walk.height],[m.canvas.width*3,m.canvas.height*3]);
 const hashes=[];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const b=opaqueBounds(walk,{x:col*128,y:row*192,w:128,h:192});
  assert.ok(b.minX>0&&b.maxX<127&&b.minY>0&&b.maxY<191,'transparent canvas margin');
  assert.ok(Math.abs(b.maxY-m.foot.y)<=1,'one-pixel antialias tolerance at fixed baseline');
  const rows=[];for(let y=0;y<192;y++)rows.push(walk.pixels.subarray(((row*192+y)*walk.width+col*128)*4,((row*192+y)*walk.width+(col+1)*128)*4));
  hashes.push(crypto.createHash('sha256').update(Buffer.concat(rows)).digest('hex'));
 }
 assert.equal(new Set(hashes).size,9,'real distinct limb/hem pixels, not runtime sliding');
 const seraHeight=opaqueBounds(walk,{x:128,y:0,w:128,h:192}).height;
 assert.equal(seraHeight,m.Sera.height);assert.equal(opaqueBounds(standing).height,m.Liora.height);
 assert.equal(opaqueBounds(standing).maxY,m.foot.y);
 // Every foreground pixel is copied exactly from the unchanged room.
 const room=decodeRgbaPng('assets/backgrounds/cutaways/sera-liora/guest-room-redraw-v1-runtime.png');
 for(const name of ['left-bed','right-bed','right-cover']){
  const overlay=decodeRgbaPng(asset(name));let visible=0,clear=0;
  for(let i=0;i<overlay.pixels.length;i+=4){const a=overlay.pixels[i+3];assert.ok(a===0||a===255);if(a){visible++;assert.equal(overlay.pixels.readUInt32BE(i),room.pixels.readUInt32BE(i));}else clear++;}
  assert.ok(visible&&clear,'authored transparent furniture mask');
 }
 // Generic renderer: full validation, layer ordering, immutable input and stable ties.
 g.run(`window.__order=[];window.__entries=[{id:'ui',layer:'ui',depth:-10,draw:()=>__order.push('ui')},{id:'a',layer:'world',depth:8,draw:()=>__order.push('a')},{id:'b',layer:'world',depth:8,draw:()=>__order.push('b')},{id:'rear',layer:'rear',depth:99,draw:()=>__order.push('rear')},{id:'fx',layer:'foreground',depth:-99,draw:()=>__order.push('fx')}];Object.freeze(__entries);drawLayeredScene(__entries);`);
 assert.deepEqual(J(g,'__order'),['rear','a','b','fx','ui']);
 assert.throws(()=>g.run("drawLayeredScene([{id:'bad',layer:'world',depth:NaN,draw:()=>__order.push('bad')}])"));
 assert.throws(()=>g.run("drawLayeredScene([{id:'bad',layer:'world',get depth(){throw Error('accessor executed');},draw:()=>{}}])"),/Invalid scene entry fields/);
 assert.deepEqual(J(g,'__order'),['rear','a','b','fx','ui']);
 const collisionBefore=JSON.stringify(J(g,'SERA_LIORA_GUEST_ROOM_MOVEMENT'));
 g.run('debugPlaySeraLioraCutaway();dialogue.open=false;revealBethanyGuestRoom();');
 assert.equal(g.run('seraLioraApproachIsWalkable()'),true);
 const positions=[],frames=new Set();
 for(let n=40;n>=0;n--){g.run('seraLioraCutscene.waitFrames='+n);const view=J(g,'seraLioraSceneSeraView()');positions.push(view);frames.add(view.frame);assert.equal(g.run('seraLioraFootprintWalkable('+view.x+','+view.y+')'),true);}
 assert.deepEqual([positions[0].x,positions[0].y],[350,285]);assert.deepEqual([positions[40].x,positions[40].y],[350,345]);
 g.run('seraLioraCutscene.waitFrames=20;dialogue.open=true');
 assert.equal(g.run('seraLioraSceneSeraView().y'),315,'pausing reveal never moves the actor');
 assert.equal(g.run('seraLioraSceneSeraView().frame'),1);g.run('dialogue.open=false');
 assert.equal(frames.size,3);assert.ok(positions.slice(1).every((v,i)=>v.y-positions[i].y===1.5));
 g.run("seraLioraCutscene.phase='room_dialogue';dialogue.open=true");assert.equal(g.run('seraLioraSceneSeraView().frame'),1);
 g.run("dialogue.open=false;continueSeraLioraCutawayAfterOpening();");
 assert.equal(g.run("seraLioraGuestRoomWalk.active&&!seraLioraGuestRoomWalk.inputLocked&&seraLioraCutscene.lioraPose==='standing'"),true);
 g.run(`window.__draw=[];ctx.drawImage=function(im,...args){__draw.push([im._src,...args]);};`);
 for(const [x,y,behind] of [[155,300,true],[350,300,true],[170,400,false],[370,400,false]]){
  g.run('seraLioraGuestRoomWalk.x='+x+';seraLioraGuestRoomWalk.y='+y+';__draw=[];drawSeraLioraCutawayActors();');
  const draws=J(g,'__draw'),actor=draws.findIndex(d=>d[0]===asset('sera-walk'));
  for(const bed of ['left-bed','right-bed']){const at=draws.findIndex(d=>d[0]===asset(bed));assert.equal(actor<at,behind,bed+' painter ordering');}
  assert.equal(draws.filter(d=>d[0]===asset('sera-walk')).length,1);assert.equal(draws.filter(d=>d[0]===asset('liora-standing')).length,1);
  assert.ok(draws.every(d=>d.slice(1).every(Number.isInteger)));
 }
 g.run('seraLioraGuestRoomWalk.x=350;seraLioraGuestRoomWalk.y=345;keys.s=true;');
 const animation=new Set();for(let i=0;i<24;i++){g.run('updateSeraLioraGuestRoomFreeWalk(1/60)');animation.add(g.run('seraLioraSceneSeraView().frame'));}assert.equal(animation.size,3);
 g.run('keys.s=false;updateSeraLioraGuestRoomFreeWalk(1/60)');assert.equal(g.run('seraLioraSceneSeraView().frame'),1);
 g.run('dialogue.open=true;keys.w=true;updateSeraLioraGuestRoomFreeWalk(1/60)');assert.equal(g.run('seraLioraSceneSeraView().frame'),1);g.run('keys.w=false;dialogue.open=false');
 // Draw repeatedly with RNG replaced by a throwing function. All character,
 // progression, clock and save-owner data remain byte-identical.
 const snapshot='JSON.stringify({stats,day,statusEffects,party:persistentParty.serialize(),player,scene:seraLioraCutscene,walk:seraLioraGuestRoomWalk,flags:QUEST_FLAG_SCHEMA.map(k=>window[k]),inventory:stats.items})';
 const before=g.run(snapshot);g.run('window.__rng=Math.random;Math.random=()=>{throw Error("renderer RNG");};drawSeraLioraCutawayActors();drawSeraLioraCutawayActors();Math.random=__rng;');assert.equal(g.run(snapshot),before);
 assert.equal(JSON.stringify(J(g,'SERA_LIORA_GUEST_ROOM_MOVEMENT')),collisionBefore);
 assert.equal(g.run('SAVE_VERSION'),5);
 console.log('  Shared scale, 9 animation frames, 3 exact-pixel masks, stable layers, approach, depth, pause and purity verified');
}};
