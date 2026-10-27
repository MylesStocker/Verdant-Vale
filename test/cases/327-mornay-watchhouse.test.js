'use strict';
const assert=require('assert/strict');
const {J,fresh,place,until,reachable,dismiss}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const room='MORNAY_WATCHHOUSE_MAP';
const persistent=g=>g.run('JSON.stringify({party:persistentParty.serialize(),stats,MainQuest,day,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');
module.exports={
 name:'Mornay jail: East Gate approach, public booking access, sealed rear, inert enquiries and save/load departure in both movement modes',
 run(){
  for(const legacy of [false,true])for(const day of [1,5]){
   const g=fresh(legacy);g.run(`day=${day};MainQuest=5;`);
   // Begin on the established East Gate street; every later placement is input.
   place(g,'MORNAY_EAST_GATE_MAP',240,240);
   until(g,'ArrowUp',()=>g.run('mapIdForRef(activeMap)')==='MORNAY_SOUTH_UPPER_EAST_MAP');
   walk(g,400,304,'watchhouse street approach');
   until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')===room);
   assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),[240,48,'down']);
   const points=reachable(g);
   assert.ok(points.length>150,'substantial usable public area');
   assert.ok(points.every(p=>p[1]<192),'no public path into cells, staff corridor or yard');
   const before=persistent(g);
   const staff=J(g,'MORNAY_NPCS.filter(n=>n.map===currentContentLocationKey())');
   assert.deepEqual(staff.map(n=>n.id).sort(),(day===5?['mornay_hadrin_moss','mornay_anric_fell']:['mornay_hadrin_moss','mornay_anric_fell','mornay_vannic_nair']).sort());
   for(const n of staff){
    const p=points.find(([x,y])=>Math.hypot(x-n.x,y-n.y)<g.run('TALK_RADIUS')&&g.run(`SIMPLE_NPCS.find(n=>n.map===currentContentLocationKey()&&Math.hypot(${x}-n.x,${y}-n.y)<TALK_RADIUS)?.id`)===n.id);
    assert.ok(p,n.id+' public talk position');walk(g,...p,n.id);g.press(' ');
    assert.equal(g.run('dialogue.name'),n.name);dismiss(g);if(g.run('choice.open')){g.press('ArrowDown');g.press('Enter');}
    assert.equal(persistent(g),before,'declining the optional case changes no fees, custody or report state');
   }
   for(const notice of J(g,`MORNAY_NOTICES.filter(n=>n.mapId==='${room}')`)){
    const p=points.find(([x,y])=>Math.hypot(x-notice.x*32,y-notice.y*32)<notice.radius&&!g.run(`SIMPLE_NPCS.some(n=>n.map===currentContentLocationKey()&&Math.hypot(n.x-${x},n.y-${y})<TALK_RADIUS)`));
    assert.ok(p,notice.id+' public inspect position');walk(g,...p,notice.id);g.press(' ');
    assert.deepEqual(J(g,'dialogue.pages'),notice.pages);dismiss(g);assert.equal(persistent(g),before);
   }
   // Push along the actual barred screen, including the guarded door. Neither
   // movement mode nor repeated interaction opens any part of the rear.
   for(const x of [176,240,304,368,432]){
    walk(g,x,176,'security screen');g.hold('ArrowDown');g.frames(80);g.release('ArrowDown');
    assert.ok(g.run('player.y')<192);assert.equal(g.run('mapIdForRef(activeMap)'),room);
   }
   assert.equal(g.run('saveGame()'),true);
   walk(g,240,48,'return to public entrance');until(g,'ArrowUp',()=>g.run('mapIdForRef(activeMap)')!==room);
   assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false;');
   assert.equal(g.run('mapIdForRef(activeMap)'),room);assert.ok(g.run('player.y')<192);
   walk(g,240,48,'loaded public room exit');until(g,'ArrowUp',()=>g.run('mapIdForRef(activeMap)')!==room);
   assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),[400,304,'up']);
   walk(g,240,432,'return to East Gate');until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')==='MORNAY_EAST_GATE_MAP');
   until(g,'ArrowDown',()=>!g.run('inTown'));
   assert.equal(g.run('canWalk(player.x,player.y)'),true,'safe ordinary overworld departure');
   assert.equal(g.run('SAVE_VERSION'),5);
  }
 }
};
