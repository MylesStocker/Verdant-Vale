'use strict';

// Read-only town dressing. Every solid fixture shares its authored tile with
// MORNAY_ROOM_FIXTURES. Exterior props sit on existing building massing;
// no new collision, transition or persistent-state authority lives here.
const MORNAY_STREET_DRESSING = Object.freeze({
  MORNAY_OLD_FORT_MAP: ['stone','watch'],
  MORNAY_NORTH_UPPER_WEST_MAP: ['kept','ledger'],
  MORNAY_NORTH_UPPER_EAST_MAP: ['kept','collegium'],
  MORNAY_NORTH_LOWER_WEST_MAP: ['nets','harbour'],
  MORNAY_NORTH_LOWER_EAST_MAP: ['rope','shipping'],
  MORNAY_MIDDLE_UPPER_WEST_MAP: ['cargo','scales'],
  MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP: ['market','provisions'],
  MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP: ['paper','office'],
  MORNAY_MIDDLE_UPPER_EAST_MAP: ['repair','survey'],
  MORNAY_MIDDLE_LOWER_WEST_MAP: ['cart','fish'],
  MORNAY_MIDDLE_LOWER_CENTRAL_WEST_MAP: ['tools','gear'],
  MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP: ['tools','printing'],
  MORNAY_MIDDLE_LOWER_EAST_MAP: ['laundry','housing'],
  MORNAY_SOUTH_UPPER_WEST_MAP: ['laundry','care'],
  MORNAY_SOUTH_UPPER_EAST_MAP: ['market','school'],
  MORNAY_WEST_GATE_MAP: ['cart','lodging'],
  MORNAY_EAST_GATE_MAP: ['cart','hiring']
});
const MORNAY_DOOR_LABELS = Object.freeze({
  office:'REGIONAL IJC',infirmary:'INFIRMARY',provisioner:'PROVISIONS',apothecary:'APOTHECARY',
  workgear:'WORK GEAR',chandler:'CHANDLERY',gate_inn:"WOLD'S INN",commercial_inn:'LEDGER HOUSE',
  school:'WARD SCHOOL',harbour:'HARBOUR / CUSTOMS',warehouse:'FEN WAREHOUSE',workshop:'WORKSHOPS',
  laundry:'LAUNDRY',boarding:'BOARDING',court:'SHARED COURT'
});
// Coordinate-only adaptations of drawHouseFurniture, the Calwick office desks
// and both ward schools. Never invoke their map-gated wrappers or spoof state.
function drawMornayChair(x,y) {
  ctx.fillStyle='#4a2c18';ctx.fillRect(x-8,y-13,16,22);
  ctx.fillStyle='#95643b';ctx.fillRect(x-6,y-11,12,5);ctx.fillRect(x-7,y+1,14,5);
  ctx.fillStyle='#382416';ctx.fillRect(x-7,y+7,3,5);ctx.fillRect(x+4,y+7,3,5);
}
function drawMornayFixture(f) {
  const x=f.col*TILE,y=f.row*TILE;
  if(f.kind==='bed'){drawInfirmaryBed(x,y,f.w||2);return;}
  if(f.kind==='table'){drawTable(x,y);return;}
  if(f.kind==='homebed'){
    ctx.fillStyle='#4b301e';ctx.fillRect(x+3,y+3,26,27);
    ctx.fillStyle='#d6c9ad';ctx.fillRect(x+5,y+5,22,23);
    ctx.fillStyle='#eee2c6';ctx.fillRect(x+6,y+6,20,6);
    ctx.fillStyle='#5f7790';ctx.fillRect(x+5,y+14,22,14);
    ctx.fillStyle='#8796a3';ctx.fillRect(x+5,y+14,22,3);
  }else if(f.kind==='desk'||f.kind==='studentdesk'){
    const h=f.kind==='desk'?13:10;
    ctx.fillStyle='#4b2c15';ctx.fillRect(x+5,y+14,3,15);ctx.fillRect(x+24,y+14,3,15);
    ctx.fillStyle='#7a4a20';ctx.fillRect(x+3,y+3,26,h);
    ctx.fillStyle='#9a6830';ctx.fillRect(x+3,y+3,26,3);
    ctx.fillStyle='#3a1e08';ctx.fillRect(x+3,y+3+h,26,3);
    ctx.fillStyle='#f0ecdc';ctx.fillRect(x+6,y+7,9,6);
    ctx.fillStyle='#b3a88c';ctx.fillRect(x+8,y+9,5,1);
    ctx.fillStyle='#181018';ctx.fillRect(x+23,y+7,3,4);
  }else if(f.kind==='stove'){
    ctx.fillStyle='#303438';ctx.fillRect(x+5,y+7,22,20);ctx.fillRect(x+12,y,8,9);
    ctx.fillStyle='#161a1e';ctx.fillRect(x+8,y+10,6,3);ctx.fillRect(x+19,y+10,5,3);ctx.fillRect(x+9,y+18,14,6);
    ctx.fillStyle='#9e6942';ctx.fillRect(x+11,y+21,9,2);
    ctx.fillStyle='#202326';ctx.fillRect(x+6,y+27,3,4);ctx.fillRect(x+23,y+27,3,4);
  }else if(f.kind==='cabinet'||f.kind==='dresser'){
    ctx.fillStyle=f.kind==='cabinet'?'#555b59':'#69472c';ctx.fillRect(x+3,y+2,26,28);
    ctx.fillStyle=f.kind==='cabinet'?'#787d72':'#90693e';ctx.fillRect(x+4,y+2,24,3);
    for(let i=0;i<3;i++){
      ctx.fillStyle='#373c38';ctx.fillRect(x+5,y+11+i*7,22,1);
      ctx.fillStyle='#b4a476';ctx.fillRect(x+13,y+7+i*7,6,2);
    }
  }else if(f.kind==='supply'){
    ctx.fillStyle='#4f3422';ctx.fillRect(x+2,y+1,28,29);
    for(let i=0;i<2;i++){
      ctx.fillStyle='#a17a4c';ctx.fillRect(x+3,y+14+i*13,26,3);
      for(let j=0;j<3;j++){
        ctx.fillStyle=['#a7a88b','#777f72','#c3b493'][j];ctx.fillRect(x+5+j*8,y+5+i*13,5,9);
        ctx.fillStyle='#443d32';ctx.fillRect(x+6+j*8,y+3+i*13,3,2);
      }
    }
  }else if(f.kind==='tub'){
    ctx.fillStyle='#9a8a69';ctx.fillRect(x+3,y+4,26,24);
    ctx.fillStyle='#465d62';ctx.fillRect(x+6,y+6,20,17);
    ctx.fillStyle='#d0cbbc';ctx.fillRect(x+4,y+7,9,13);
    ctx.fillStyle='#453e36';ctx.fillRect(x+3,y+25,26,3);
  }else{
    ctx.fillStyle='#493426';ctx.fillRect(x+4,y+19,4,12);ctx.fillRect(x+24,y+19,4,12);
    ctx.fillStyle=f.kind==='cargo'?'#705838':'#786047';ctx.fillRect(x+2,y+5,28,18);
    ctx.fillStyle='#a18a62';ctx.fillRect(x+2,y+5,28,3);
    if(f.kind==='cargo'){
      ctx.fillStyle='#403927';ctx.fillRect(x+6,y+6,3,21);ctx.fillRect(x+23,y+6,3,21);
      ctx.fillStyle='#c6b98e';ctx.fillRect(x+12,y+13,7,5);
    }else if(f.kind==='bench'){
      ctx.fillStyle='#b2a996';ctx.fillRect(x+5,y+14,19,3);ctx.fillRect(x+19,y+9,5,11);
    }else{
      ctx.fillStyle='#d2c6a1';ctx.fillRect(x+6,y+10,10,8);
      ctx.fillStyle='#474852';ctx.fillRect(x+22,y+10,4,7);
    }
  }
}
// An opt-in pose adapter keeps existing town sprites unchanged. Chairs are
// occupied solid NPC anchors, not a second collision object or saved state.
function drawMornayResident(npc,rt) {
  const facing=rt?.facing||npc.facing||'down';
  const stepping=rt&&!rt.done&&!rt.frozen&&rt.moving&&rt.pauseLeft===0;
  const seated=npc.pose==='seated';
  if(seated)drawMornayChair(npc.x,npc.y);
  ctx.save();
  if(seated){ctx.translate(0,npc.y*.18);ctx.scale(1,.82);}
  if(npc.spriteType==='worker')drawWalkingWorker(npc,facing,rt?.step||0,!!stepping);
  else if(npc.spriteType==='patron')drawWalkingPatron(npc,facing,rt?.step||0,!!stepping);
  else {
    drawGenericNPC(npc);
    const child=npc.spriteType==='child',x=Math.round(npc.x),y=Math.round(npc.y);
    const ey=y-(child?11:15),skin=child?'#b88060':'#c09070';
    ctx.fillStyle=skin;ctx.fillRect(x-(child?2:3),ey,7,2);
    if(facing==='up'){
      ctx.fillStyle=npc.hairColor;ctx.fillRect(x-(child?4:5),y-(child?15:21),child?8:10,child?7:10);
    }else{
      const shift=facing==='left'?-1:facing==='right'?1:0;
      ctx.fillStyle='#181620';ctx.fillRect(x-(child?2:3)+shift,ey,2,2);ctx.fillRect(x+1+shift,ey,2,2);
    }
  }
  ctx.restore();
}
function drawMornayStreetProp(kind,x,y) {
  if(kind==='laundry'){
    ctx.fillStyle='#b2a991';ctx.fillRect(x,y,100,2);
    for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#9b9d8b':'#cdc9b0';ctx.fillRect(x+6+i*23,y+2,16,17+i%2*5);}
  }else if(kind==='nets'||kind==='rope'){
    ctx.strokeStyle='#9c8b66';ctx.lineWidth=2;
    for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(x+i*13,y);ctx.lineTo(x+i*13+16,y+26);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x,y+i*6);ctx.lineTo(x+70,y+i*6);ctx.stroke();}
  }else if(kind==='cart'){
    ctx.fillStyle='#302c28';ctx.fillRect(x+5,y+24,12,9);ctx.fillRect(x+52,y+24,12,9);
    ctx.fillStyle='#806343';ctx.fillRect(x,y,70,25);ctx.fillStyle='#ac8b59';
    for(let i=0;i<4;i++)ctx.fillRect(x+3,y+3+i*6,64,2);
    ctx.fillRect(x+69,y+9,23,4);
  }else if(kind==='market'){
    for(let i=0;i<3;i++){ctx.fillStyle='#6c5337';ctx.fillRect(x+i*27,y,23,23);
      ctx.fillStyle=['#a57a45','#74815c','#867e69'][i];ctx.fillRect(x+3+i*27,y+3,17,15);}
  }else if(kind==='tools'||kind==='repair'){
    ctx.fillStyle='#71583e';ctx.fillRect(x,y+8,86,18);ctx.fillStyle='#b3aaa0';
    ctx.fillRect(x+8,y+12,30,3);ctx.fillRect(x+33,y+7,5,13);ctx.fillRect(x+56,y+12,22,4);
  }else if(kind==='cargo'){
    for(let i=0;i<3;i++){ctx.fillStyle='#756045';ctx.fillRect(x+i*28,y,24,28);
      ctx.fillStyle='#403c33';ctx.fillRect(x+i*28,y+6,24,3);ctx.fillRect(x+i*28,y+21,24,3);}
  }else if(kind==='kept'){
    ctx.fillStyle='#71806a';ctx.fillRect(x,y,80,9);ctx.fillStyle='#9a9d83';ctx.fillRect(x+3,y+2,74,3);
  }else if(kind==='paper'){
    ctx.fillStyle='#d2c4a0';ctx.fillRect(x+8,y,26,23);ctx.fillRect(x+41,y+2,24,20);
  }else if(kind==='stone'){
    ctx.fillStyle='#444952';ctx.fillRect(x,y,80,3);ctx.fillRect(x+23,y,3,19);
  }
}
// Domestic wooden stairs use the established floor/palette and ordinary room
// transition tiles. Presentation does not introduce another movement authority.
function drawMornayStairs(col, row, up) {
  const x=col*TILE,y=row*TILE;
  drawInteriorFloor(x,y);
  ctx.fillStyle='#3c3028';ctx.fillRect(x+3,y+2,26,30);
  for(let step=0;step<5;step++){
    const inset=up?5-step:step+1,sy=y+4+step*5;
    ctx.fillStyle='#725236';ctx.fillRect(x+inset,sy,32-2*inset,5);
    ctx.fillStyle='#b29061';ctx.fillRect(x+inset,sy,32-2*inset,1);
  }
  ctx.fillStyle='#453225';ctx.fillRect(x+2,y+2,2,30);ctx.fillRect(x+28,y+2,2,30);
}

function drawMornayContent() {
  if(!inTown||currentTownId!=='mornay')return;
  const id=mapIdForRef(activeMap),room=mornayRoomForMap(id);
  ctx.save();
  if(room){
    // The existing terrain remains visible; a light floor motif gives each kind
    // its own palette without painting over doors, actors or furniture.
    const colors={infirmary:'#626b63',school:'#716a51',office:'#63616a',warehouse:'#555044',laundry:'#53636a'};
    ctx.fillStyle=colors[room.kind]||'#685b4c';
    for(let row=2;row<14;row++)for(let col=1;col<15;col++)if(activeMap[row][col]===INTERIOR_FLOOR)
      ctx.fillRect(col*TILE+2,row*TILE+27,28,2);
    // TABLE supplies collision only; remove its default table art before drawing
    // each authored object so cabinets and beds do not stand on ghost tables.
    for(const f of MORNAY_ROOM_FIXTURES[room.id]){
      for(let dx=0;dx<(f.w||1);dx++)drawInteriorFloor((f.col+dx)*TILE,f.row*TILE);
      // Furniture and actors are drawn together by depth after this floor pass.
    }
    // The HUD map title owns room names; only functional markings remain here.
    ctx.textAlign='center';
    if(room.kind==='school'){
      ctx.fillStyle='#65472e';ctx.fillRect(76,34,344,27);
      ctx.fillStyle='#243c36';ctx.fillRect(80,37,336,20);
      ctx.fillStyle='#b6bc9c';ctx.font='11px "Courier New", monospace';
      ctx.fillText('READING       7 + 8 = 15       MEASURES',248,51);
      ctx.fillStyle='#a58b63';ctx.fillRect(76,59,344,3);
    }
    if(room.kind==='infirmary'){
      ctx.fillStyle='#303a3d';ctx.fillRect(48,37,416,20);
      ctx.fillStyle='#c8c0a3';ctx.font='10px "Courier New", monospace';ctx.fillText('ORDINARY CARE · REGISTERED HEALER ON STAFF',256,51);
    }
    if(room.connection==='stairs'){
      const entrance=mornayInteriorEntrance(room);
      drawMornayStairs(entrance.col,entrance.exitRow,false);
    }
    for(const child of MORNAY_BUILDINGS.filter(b=>b.sourceMapId===id)){
      if(child.connection==='stairs')drawMornayStairs(child.doorCol,child.doorRow,true);
      const x=(child.doorCol+.5)*TILE,y=child.doorRow*TILE-5,label=child.sign||'ROOMS';
      ctx.font='10px "Courier New", monospace';const w=ctx.measureText(label).width+8;
      ctx.fillStyle='#48483e';ctx.fillRect(x-w/2,y-9,w,12);
      ctx.fillStyle='#ddd0a9';ctx.fillText(label,x,y);
    }
  }else{
    const dressing=MORNAY_STREET_DRESSING[id];
    if(dressing){
      // The lower east building face is outside every mandatory road/berth.
      const west=['laundry','nets','rope','repair'].includes(dressing[0]);
      drawMornayStreetProp(dressing[0],(west?1:10)*TILE+12,(dressing[0]==='kept'?2:11)*TILE+4);
      if(dressing[1]==='fish'){
        drawMornayStreetProp('cargo',TILE+14,11*TILE+4);
        ctx.fillStyle='#b0ab94';for(let i=0;i<5;i++)ctx.fillRect(53+i*12,10*TILE+10,8,3);
      }
      if(dressing[1]==='scales'){
        ctx.fillStyle='#a09a83';ctx.fillRect(12*TILE,10*TILE,3,29);ctx.fillRect(11*TILE+13,10*TILE+4,38,3);
      }
      if(dressing[1]==='collegium'){
        ctx.fillStyle='#8a8a80';ctx.fillRect(10*TILE+4,6*TILE-4,5*TILE-8,12);
        ctx.fillStyle='#343c43';for(let i=0;i<12;i++)ctx.fillRect(10*TILE+8+i*12,6*TILE-12,3,24);
        ctx.fillStyle='#ddd0a9';ctx.font='bold 10px "Courier New", monospace';ctx.textAlign='center';
        ctx.fillText('CIVIC COLLEGIUM',12.5*TILE,3*TILE);ctx.font='9px "Courier New", monospace';ctx.fillText('FEES · ADMISSION BY APPOINTMENT',12.5*TILE,3*TILE+13);
      }
      if(dressing[1]==='survey'){
        ctx.fillStyle='#c7b99c';ctx.font='bold 10px "Courier New", monospace';ctx.textAlign='center';ctx.fillText('HYDROGRAPHIC OFFICE',12.5*TILE,3*TILE);
      }
    }
    for(const home of MORNAY_RESIDENTIAL_FACADES.filter(f=>f.mapId===id)){
      const x=home.col*TILE,y=home.row*TILE;
      ctx.fillStyle='#463a30';ctx.fillRect(x+7,y+7,18,25);
      ctx.fillStyle='#78624b';ctx.fillRect(x+9,y+9,14,23);
      ctx.fillStyle='#bea574';ctx.fillRect(x+19,y+21,2,2);
      drawMornayResidentialWindows(home.col,home.row,home.row>=8?'up':'down',home.units>1);

    }
    for(const b of MORNAY_BUILDINGS.filter(b=>b.sourceMapId===id)){
      if(['house','corridor','boarding'].includes(b.kind))drawMornayResidentialWindows(b.doorCol,b.doorRow,b.facing,b.kind!=='house');
      const text=MORNAY_DOOR_LABELS[b.key]||b.sign,x=(b.doorCol+.5)*TILE,y=b.doorRow*TILE+(b.facing==='up'?44:-9);
      ctx.font='bold 10px "Courier New", monospace';ctx.textAlign='center';
      const width=ctx.measureText(text).width+10;ctx.fillStyle='#363c3d';ctx.fillRect(x-width/2,y-10,width,14);
      ctx.fillStyle='#e0cca2';ctx.fillText(text,x,y);
    }
    for(const n of MORNAY_NOTICES.filter(n=>n.mapId===id)){
      const x=n.x*TILE,y=n.y*TILE;ctx.fillStyle='#a59a7c';ctx.fillRect(x-6,y-9,12,14);
      ctx.fillStyle='#4f5051';ctx.fillRect(x-4,y-5,8,1);ctx.fillRect(x-4,y-2,6,1);
      if(n.id==='mornay_whitewash'||n.id==='mornay_back_stair'){
        ctx.fillStyle='#ada892';ctx.fillRect(x-18,y-7,15,10);ctx.fillStyle='#736e5e';ctx.fillRect(x-17,y-2,11,2);
      }
    }
  }
  ctx.restore();
}

function drawMornayResidentialWindows(col,row,facing,multiple) {
  const windowRow=row+(facing==='up'?2:-2);
  for(const dx of (multiple?[-1,0,1]:[-1,1])){
    const c=col+dx;
    if(activeMap[windowRow]?.[c]!==TOWN_BUILDING)continue;
    const x=c*TILE+7,y=windowRow*TILE+5;
    ctx.fillStyle='#524332';ctx.fillRect(x-2,y-2,22,25);
    ctx.fillStyle='#303d46';ctx.fillRect(x,y,18,20);
    ctx.fillStyle='#b3a278';ctx.fillRect(x+8,y,2,20);ctx.fillRect(x,y+9,18,2);
    ctx.fillStyle='#9a927c';ctx.fillRect(x,y,3,20);ctx.fillRect(x+15,y,3,20);
    ctx.fillStyle='#c0ac7b';ctx.fillRect(x-3,y+21,24,3);
  }
}
function isMornayRoomView() {
  return inTown && currentTownId==='mornay' && !!mornayRoomForMap(mapIdForRef(activeMap));
}
// A room-only painter's order: legs behind a desk disappear behind its front;
// an actor in front retains their head. Collision stays in the physical grid.
function drawMornayRoomActors() {
  const room=mornayRoomForMap(mapIdForRef(activeMap));
  if(!isMornayRoomView()||!room)return;
  const layers=MORNAY_ROOM_FIXTURES[room.id].map(f=>({depth:f.row*TILE+24,draw:()=>drawMornayFixture(f)}));
  for(const npc of MORNAY_NPCS.filter(n=>n.map===currentContentLocationKey()))
    layers.push({depth:npc.y+8,draw:()=>drawOneContentNPC(npc)});
  layers.push({depth:player.y+8,draw:()=>drawPlayer()});
  layers.sort((a,b)=>a.depth-b.depth);
  for(const layer of layers)layer.draw();
}
