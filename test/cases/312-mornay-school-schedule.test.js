'use strict';
const assert=require('assert/strict');
const {J,fresh,place,talk,dismiss,openService}=require('./301-mornay-manifest.test');
module.exports={
 name:'Mornay school schedules: same resident identities across overnight Dayoff boundaries, home conversations and save/load without schedule payload',
 run(){
  const g=fresh(),ids=['mornay_maris_glyn','mornay_ferin_wold'];
  const homes=['MORNAY_GLYN_HOME_MAP','MORNAY_DOCK_STEPS_UNIT_4_MAP'];
  g.run(`var scheduleOriginals=${JSON.stringify(ids)}.map(id=>MORNAY_NPCS.find(n=>n.id===id));day=4;stats.gold=1000;`);
  assert.equal(g.run('saveGame()'),true);
  const keys=J(g,'Object.keys(JSON.parse(localStorage.getItem("verdantVale_save"))).sort()');
  const facingMismatches=[];
  for(const expectedDay of [4,5,6,9,10,11]){
   if(expectedDay===9)g.run('day=9;'); // A second five-day cycle guards against a one-off day-5 condition.
   assert.equal(g.run('day'),expectedDay);
   const off=expectedDay%5===0;assert.equal(g.run('isDayOff()'),off);
   for(let i=0;i<ids.length;i++){
    const id=JSON.stringify(ids[i]),map=off?homes[i]:'MORNAY_SCHOOL_MAP';
    assert.equal(g.run(`MORNAY_NPCS.filter(n=>n.id===${id}).length`),1);
    assert.equal(g.run(`SIMPLE_NPCS.filter(n=>n.id===${id}).length`),1);
    assert.equal(g.run(`scheduleOriginals[${i}]===MORNAY_NPCS.find(n=>n.id===${id})&&scheduleOriginals[${i}]===SIMPLE_NPCS.find(n=>n.id===${id})`),true,'same object survives rollover');
    const r=J(g,`MORNAY_RESIDENTS.find(n=>n.id===${id})`),expected=off?r.dayOff:r;
    const npc=J(g,`MORNAY_NPCS.find(n=>n.id===${id})`);
    assert.equal(npc.map,'mornay:'+map.toLowerCase(),ids[i]+' correct school/home location');
    assert.deepEqual([npc.x,npc.y],[expected.x*32,expected.y*32],ids[i]+' scheduled collision position');
    if(npc.facing!==expected.facing)facingMismatches.push(ids[i]+' day '+expectedDay+': expected '+expected.facing+', got '+npc.facing);
    place(g,map);talk(g,ids[i]);dismiss(g);
    assert.equal(g.run('saveGame()'),true);const payload=J(g,'JSON.parse(localStorage.getItem("verdantVale_save"))');
    assert.deepEqual(Object.keys(payload).sort(),keys,'no new save fields');
    assert.equal(payload.version,g.run('SAVE_VERSION'));
    const serialized=JSON.stringify(payload);
    for(const symbol of [...ids,'MORNAY_NPCS','NPC_ROUTES','authoredPose','dayOff'])assert.equal(serialized.includes(symbol),false,symbol+' is derived/session-only');
    place(g,'MORNAY_WEST_GATE_MAP');g.run('day=2;');assert.equal(g.run('loadGame()'),true);dismiss(g);
    assert.equal(g.run('day'),expectedDay);assert.equal(g.run('mapIdForRef(activeMap)'),map);
    assert.equal(g.run(`MORNAY_NPCS.find(n=>n.id===${id})===scheduleOriginals[${i}]`),true,'load retains identity');
    assert.equal(g.run(`MORNAY_NPCS.find(n=>n.id===${id}).map`),npc.map,'load immediately derives correct schedule');
    assert.deepEqual(J(g,`[scheduleOriginals[${i}].x,scheduleOriginals[${i}].y]`),[npc.x,npc.y]);
   }
   if([4,5,9,10].includes(expectedDay)){
    openService(g,'gate_inn');assert.equal(g.run('choice.open'),true);g.press('Enter');dismiss(g);
    assert.equal(g.run('day'),expectedDay+1,'real inn overnight crosses schedule boundary');
   }
  }
  assert.deepEqual(facingMismatches,[],'scheduled facing must match the active school/home pose');
 }
};
