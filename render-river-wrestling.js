'use strict';

function drawReedbankContent(){
 if(REEDBANK_CONTENT_KEYS[mapIdForRef(activeMap)])drawInteriorExit(7*TILE,14*TILE,false);
 if(activeMap===REEDBANK_VILLAGE_MAP){
  // Replace the blocking building tiles with continuous, modest timber facades.
  for(const [i,[x,y]] of REEDBANK_HOMESTEADS.entries()){
   const px=x*TILE,py=y*TILE;
   ctx.fillStyle=i%2?'#66553e':'#745f44';ctx.fillRect(px,py+17,64,47);
   ctx.fillStyle='#34352d';ctx.fillRect(px,py,64,20);
   ctx.fillStyle='#6b7151';ctx.fillRect(px+3,py+4,58,4);ctx.fillRect(px+1,py+12,62,3);
   ctx.fillStyle='#302b24';ctx.fillRect(px+26,py+36,15,28);
   ctx.fillStyle='#b7ad70';ctx.fillRect(px+7,py+30,12,12);ctx.fillRect(px+48,py+30,10,12);
   ctx.fillStyle='#403a2b';ctx.fillRect(px+12,py+30,2,12);ctx.fillRect(px+7,py+35,12,2);
  }
  for(const [x,y] of REEDBANK_MUSHROOM_PLOTS){
   const px=x*TILE,py=y*TILE;
   ctx.fillStyle='#423c29';ctx.fillRect(px,py,32,64);
   for(let i=0;i<4;i++){
    ctx.fillStyle='#756044';ctx.fillRect(px+3,py+6+i*14,26,9);
    for(const [dx,dy] of [[6,0],[20,4]]){
     ctx.fillStyle='#c5baa0';ctx.fillRect(px+dx,py+5+i*14+dy,3,6);
     ctx.fillStyle='#e2d6b7';ctx.fillRect(px+dx-3,py+3+i*14+dy,9,3);
     ctx.fillRect(px+dx-1,py+1+i*14+dy,5,2);
    }
   }
   ctx.fillStyle='#89916a';ctx.fillRect(px,py,3,64);ctx.fillRect(px+29,py,3,64);
   ctx.fillRect(px,py,32,3);
  }
  ctx.fillStyle='#302b24';ctx.fillRect(224,160,96,27);
  ctx.fillStyle='#d2c49d';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('PROVISIONS',272,177);ctx.textAlign='left';
  // Clothes left on a stump, and ropes marking the supervised shallow bank.
  ctx.fillStyle='#6d583c';ctx.fillRect(350,329,15,13);
  ctx.fillStyle='#426b81';ctx.fillRect(348,324,19,6);
  ctx.fillStyle='#b39e6b';for(const y of [255,353]){ctx.fillRect(377,y,4,20);ctx.fillRect(379,y+6,90,2);}
 } else if(activeMap===REEDBANK_PROVISIONS_MAP){
  for(const [x,y] of [[2,2],[3,2],[12,2],[13,2],[12,10],[13,10]]){
   ctx.fillStyle='#695738';ctx.fillRect(x*32+2,y*32+2,28,28);
   ctx.fillStyle='#b8a679';ctx.fillRect(x*32+6,y*32+5,20,3);ctx.fillRect(x*32+6,y*32+23,20,3);
  }
  // Counter goods use existing small bottle/sack vocabulary, away from aisles.
  for(let x=4;x<=10;x++){
   ctx.fillStyle=x%2?'#6e8f86':'#b79d70';ctx.fillRect(x*32+8,168,14,12);
   ctx.fillStyle='#d2c08b';ctx.fillRect(x*32+12,164,6,4);
  }
 }
}
function drawRiverWrestling(v){
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
 const text=(s,x,y,c='#e6dfbd',size=12)=>{ctx.fillStyle=c;ctx.font=size+'px monospace';ctx.fillText(s,x,y);};
 ctx.save();ctx.textAlign='left';
 rect(0,0,512,480,'#182b2e');rect(0,80,512,120,'#718b83');
 for(let i=0;i<14;i++){
  const x=i*42-20,y=110+(i*19%27);
  rect(x,y,33,90,'#334f40');rect(x+8,y-17,19,24,'#455d43');
 }
 rect(0,183,512,50,'#6a7350');rect(0,219,512,32,'#9a9168');
 // Spectators remain behind the ropes, using the same low-resolution vocabulary.
 for(let i=0;i<8;i++){
  const x=28+i*63,y=196+(i%2)*7;
  rect(x,y,10,10,i%3?'#c4a17a':'#986f52');rect(x-3,y+10,16,18,i%2?'#6f6763':'#526b78');
  rect(x-2,y+28,5,9,'#343f36');rect(x+6,y+28,5,9,'#343f36');
 }
 for(const x of [15,493])rect(x,216,4,44,'#625038');rect(16,232,480,3,'#c0b283');
 rect(0,251,512,140,'#426f76');rect(0,251,512,8,'#789387');
 for(let j=0;j<6;j++)for(let i=0;i<9;i++){
  const x=(i*67+j*29+Math.floor(v.frame/5))%550-30;
  rect(x,269+j*19,22,2,j%2?'#5d8b8b':'#6c9692');
 }
 const falling=v.phase==='fall'||v.phase==='result';
 function wrestler(f,isYou){
  const loses=falling&&v.winner!==(isYou?'you':'opponent');
  const turn=loses?Math.min(1,v.fall/36):0,dir=isYou?1:-1;
  ctx.save();ctx.translate(Math.round(f.x),334);ctx.scale(dir,1);
  if(loses)ctx.rotate(-turn*Math.PI/2);
  const crouch=f.brace?10:0,skin=isYou?'#d4b18b':'#b68561';
  rect(-12,-32+crouch,24,20,isYou?'#466986':'#a26e48');
  rect(-10,-60+crouch,20,29,skin);rect(-9,-78+crouch,18,18,skin);
  rect(-9,-80+crouch,18,5,isYou?'#4e443a':'#5e392c');
  rect(4,-71+crouch,3,3,'#2f3433');
  rect(-11,-12,8,18,skin);rect(4,-12,8,18,skin);
  const reach=f.windup||f.grip?24:12;
  rect(9,-55+crouch,reach,7,skin);rect(reach+3,-61+crouch,7,9,skin);
  rect(-17,-52+crouch,8,21,skin);rect(-16,-38+crouch,18,6,skin);
  ctx.restore();
  if(f.flash)rect(f.x-20,342,40,3,'#d3d8b7');
  if(f.windup)text(f.action.toUpperCase(),f.x-22,231,isYou?'#b6d5e6':'#ffd99b',10);
  if(f.brace)text('BRACE',f.x-18,247,'#d7d5ad',10);
  if(f.grip)text('GRIP',f.x-16,261,'#e6c988',10);
  if(loses&&v.fall>=30)for(let i=0;i<7;i++)rect(f.x-35+i*10,332-(i%3)*9,7,4,'#c3d7ce');
 }
 wrestler(v.opponent,false);wrestler(v.you,true);
 // The near water occludes the lower legs: the wrestlers stand knee-deep, and
 // a fallen shoulder visibly breaks this surface instead of lying on blue ground.
 rect(0,334,512,57,'#426f76');
 for(let i=0;i<9;i++)rect((i*67+Math.floor(v.frame/5))%550-20,348+(i%3)*16,26,2,'#6c9692');
 for(const f of [v.you,v.opponent]){
  rect(f.x-18,334,36,2,'#8cb1ab');
  if(falling&&v.fall>=30&&f===(v.winner==='you'?v.opponent:v.you)){
   for(let i=0;i<8;i++)rect(f.x-42+i*12,326-(i%3)*5,7,3,'#c3d7ce');
  }
 }
 for(let i=0;i<2;i++){
  const f=i?v.opponent:v.you,x=i?290:22;
  text(i?'ORREN':'LÉLY',x,25);text('Footing',x,43,'#b6c4b7',10);
  rect(x+49,34,143,9,'#243b40');rect(x+49,34,Math.round(f.footing*1.43),9,f.footing<=40?'#d6a46f':'#8eaf83');
  rect(x+49,34,57,9,'#654a36');rect(x+49,34,Math.round(Math.min(40,f.footing)*1.43),9,'#d6a46f');
  text('Stamina',x,61,'#b6c4b7',10);rect(x+49,52,143,7,'#243b40');rect(x+49,52,Math.round(f.stamina*1.43),7,'#729ab6');
 }
 text(v.stake?'10g stake · 20g purse':'Free practice',177,78,'#c5bb91',10);
 rect(0,391,512,89,'#17282c');text(v.message,16,410,'#eee0b7',11);
 text('← → / A D: move    ↓ / S: brace',16,433,'#c1d0c3',11);
 text('Z: grip   X: shove   C: throw   Space: break',16,451,'#c1d0c3',11);
 text('Orange footing + grip = throw.  Esc: give in',16,469,'#b2baa9',11);
 if(v.phase==='ready'){
  rect(37,112,438,230,'#192d31');ctx.strokeStyle='#b4a574';ctx.strokeRect(37,112,438,230);
  text('REEDBANK RIVER WRESTLING',70,141,'#e9cf91',16);
  for(const [i,line] of [
   'First shoulders to the water wins.',
   'No punches, kicks or gouging. Release at once.',
   'Shove to lower footing; grip, then throw',
   'when the other wrestler reaches orange (40).',
   'Brace against shoves. Space breaks a grip.',
   v.stake?'Enter: pay 10g and wrestle. Win: 20g purse.':'Enter: start free practice. No gold at risk.',
   'Escape: leave. During a bout: give in.',
  ].entries())text(line,52,171+i*23,'#d6dbca',11);
 } else if(v.phase==='result'){
  rect(68,118,376,108,'#192d31');
  text(v.winner==='you'?'YOUR WIN!':'ORREN WINS',166,146,'#ead497',20);
  text(!v.stake?'Practice finished. No gold changed.':v.winner==='you'?'20g paid out. Net winnings: 10g.':'Your 10g stake goes to the winner.',100,174,'#d6dbca',12);
  if(v.resultAge>=45)text('Enter / Space: return to the bank',111,204,'#aec7c0',12);
 }
 ctx.restore();
}
