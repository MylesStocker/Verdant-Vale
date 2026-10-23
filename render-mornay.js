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
function drawMornayFixture(f) {
  const x=f.col*TILE,y=f.row*TILE;
  ctx.fillStyle='#493d31';ctx.fillRect(x,y,TILE,TILE);
  if(f.kind==='bed'){
    ctx.fillStyle='#69533e';ctx.fillRect(x+2,y+1,28,30);
    ctx.fillStyle='#c7c3a9';ctx.fillRect(x+5,y+3,22,25);
    ctx.fillStyle='#e3ddc2';ctx.fillRect(x+6,y+4,20,6);
    ctx.fillStyle='#687d75';ctx.fillRect(x+5,y+13,22,15);
    ctx.fillStyle='#8d9c8c';ctx.fillRect(x+5,y+13,22,3);
  }else if(f.kind==='tub'){
    ctx.fillStyle='#9a8a69';ctx.fillRect(x+3,y+4,26,24);
    ctx.fillStyle='#465d62';ctx.fillRect(x+6,y+6,20,17);
    ctx.fillStyle='#d0cbbc';ctx.fillRect(x+4,y+7,9,13);
    ctx.fillStyle='#453e36';ctx.fillRect(x+3,y+25,26,3);
  }else{
    ctx.fillStyle=f.kind==='cargo'?'#705838':'#786047';ctx.fillRect(x+2,y+3,28,25);
    ctx.fillStyle='#a18a62';ctx.fillRect(x+2,y+3,28,3);
    if(['desk','supply','counter'].includes(f.kind)){
      ctx.fillStyle='#d2c6a1';ctx.fillRect(x+5,y+8,12,12);
      ctx.fillStyle='#474852';ctx.fillRect(x+21,y+8,5,9);
      ctx.fillStyle='#777255';ctx.fillRect(x+7,y+11,8,1);ctx.fillRect(x+7,y+14,6,1);
    }else if(f.kind==='cargo'){
      ctx.fillStyle='#403927';ctx.fillRect(x+6,y+4,3,23);ctx.fillRect(x+23,y+4,3,23);
      ctx.fillStyle='#c6b98e';ctx.fillRect(x+12,y+12,7,5);
    }else if(f.kind==='bench'){
      ctx.fillStyle='#b2a996';ctx.fillRect(x+5,y+14,19,3);ctx.fillRect(x+19,y+9,5,11);
      ctx.fillStyle='#3c3030';ctx.fillRect(x+5,y+20,12,3);
    }else{
      ctx.fillStyle='#b1a48a';ctx.fillRect(x+6,y+9,9,9);ctx.fillRect(x+21,y+12,5,8);
    }
  }
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
    for(const f of MORNAY_ROOM_FIXTURES[room.id])drawMornayFixture(f);
    ctx.fillStyle='#303a3d';ctx.fillRect(32,7,448,23);
    ctx.font='bold 12px "Courier New", monospace';ctx.textAlign='center';ctx.fillStyle='#ded4b7';
    ctx.fillText(room.name,256,25);
    if(room.kind==='school'){
      ctx.fillStyle='#243c36';ctx.fillRect(320,33,125,24);ctx.fillStyle='#c4c7ad';ctx.font='10px "Courier New", monospace';
      ctx.fillText('READ · COUNT · WRITE',382,49);
    }
    if(room.kind==='infirmary'){
      ctx.fillStyle='#303a3d';ctx.fillRect(48,37,416,20);
      ctx.fillStyle='#c8c0a3';ctx.font='10px "Courier New", monospace';ctx.fillText('ORDINARY CARE · REGISTERED HEALER ON STAFF',256,51);
    }
    if(MORNAY_BUILDINGS.some(b=>b.sourceMapId===id)){
      ctx.fillStyle='#ddd0a9';ctx.font='10px "Courier New", monospace';ctx.fillText('ROOMS',7.5*TILE,44);
    }
  }else{
    const dressing=MORNAY_STREET_DRESSING[id];
    if(dressing){
      // The lower east building face is outside every mandatory road/berth.
      drawMornayStreetProp(dressing[0],10*TILE+12,11*TILE+4);
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
    for(const b of MORNAY_BUILDINGS.filter(b=>b.sourceMapId===id)){
      const text=MORNAY_DOOR_LABELS[b.key],x=(b.doorCol+.5)*TILE,y=b.doorRow*TILE+(b.facing==='up'?44:-9);
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
