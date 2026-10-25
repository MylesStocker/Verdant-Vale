'use strict';
const assert=require('assert/strict');
const {J,fresh,place,talk,dismiss}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const persistent=g=>g.run('JSON.stringify({MainQuest,day,stats,party:persistentParty.getView(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');
module.exports={
 name:'Mornay dead end and South Rows: four workday-empty units per floor, retained identities, attic evidence, repeatable MQ5 refusals and unchanged saved state',
 run(){
  const g=fresh();g.run('MainQuest=5;persistentParty.joinEsla();');
  const rooms=J(g,'MORNAY_BUILDINGS'),units=rooms.filter(b=>/^south_rows_unit_/.test(b.key));
  assert.equal(units.length,24);
  const runtime=J(g,'MORNAY_NPCS.map(n=>n.id)');assert.equal(new Set(runtime).size,300);
  for(const day of [1,4,5,6,10]){
   g.run(`day=${day};`);
   for(const [floor,source]of [[1,'MORNAY_SOUTH_ROWS_MAP'],[2,'MORNAY_SOUTH_ROWS_FLOOR_2_MAP'],[3,'MORNAY_SOUTH_ROWS_FLOOR_3_MAP']]){
    const homes=units.filter(b=>b.sourceMapId===source);assert.equal(homes.length,8);
    const occupied=homes.filter(b=>g.run(`MORNAY_NPCS.some(n=>n.map===mornayContentKey('${b.mapId}'))`));
    assert.equal(occupied.length,day%5===0?8:4,'floor '+floor+' occupancy on day '+day);
   }
   const before=persistent(g);g.renderFrame();assert.equal(persistent(g),before,'schedule/render never creates save flags');
  }
  g.run('day=1;');
  const children=J(g,"MORNAY_RESIDENTS.filter(r=>r.role==='child keeping house')");assert.equal(children.length,4);
  for(const r of children){assert.match(r.mapId,/SOUTH_ROWS_UNIT_/);place(g,r.mapId);talk(g,r.id);dismiss(g);}
  // Real public conversations leave the sealed report, resources and MQ5 untouched.
  const officials=J(g,'MORNAY_RESIDENTS.filter(r=>r.reportText)');assert.equal(officials.length,14);
  for(const r of officials){
   place(g,r.mapId);const before=persistent(g);
   for(let repeat=0;repeat<2;repeat++){
    talk(g,r.id);const pages=J(g,'dialogue.pages').flat().join(' ');
    assert.ok(pages.includes(r.reportText),r.id+' report-specific response');
    dismiss(g);assert.equal(persistent(g),before,r.id+' no completed errand, fee, report consumption or MQ progression');
   }
  }
  g.run('MainQuest=4;');
  for(const r of officials){const pages=J(g,`MORNAY_NPCS.find(n=>n.id==='${r.id}').dialogue`).flat().join(' ');assert.doesNotMatch(pages,/Dreyfuss|Garrick/,'no premature report disclosure');}
  g.run('MainQuest=5;day=4;');
  // Save before and after ordinary inn rollover; schedule survives reload without new fields.
  place(g,'MORNAY_SOUTH_ROWS_UNIT_5_MAP');assert.equal(g.run('saveGame()'),true);
  const oldKeys=J(g,'Object.keys(JSON.parse(localStorage.getItem("verdantVale_save"))).sort()');
  g.run('day=5;');assert.equal(g.run('loadGame()'),true);dismiss(g);
  assert.equal(g.run('day'),4);assert.equal(g.run('MORNAY_NPCS.some(n=>n.map===currentContentLocationKey())'),false);
  g.run('day=5;');assert.equal(g.run('MORNAY_NPCS.some(n=>n.map===currentContentLocationKey())'),true);
  assert.equal(g.run('saveGame()'),true);assert.deepEqual(J(g,'Object.keys(JSON.parse(localStorage.getItem("verdantVale_save"))).sort()'),oldKeys);
  assert.equal(g.run('SAVE_VERSION'),5);
  const attic=rooms.find(b=>b.key==='south_rows_attic');assert.equal(attic.connection,'hatch');assert.equal(attic.sign,'');
  place(g,attic.mapId);const before=persistent(g);
  assert.equal(g.run('currentLocationAllowsRandomEncounters()'),false);
  const notices=J(g,`MORNAY_NOTICES.filter(n=>n.mapId==='${attic.mapId}')`);assert.equal(notices.length,3);
  assert.match(notices.flatMap(n=>n.pages).flat().join(' '),/RECLAIMERS/);
  assert.match(notices.flatMap(n=>n.pages).flat().join(' '),/No fire/);
  assert.match(notices.flatMap(n=>n.pages).flat().join(' '),/Never bring an officer/);
  assert.equal(g.run('saveGame()'),true);place(g,'MORNAY_WEST_GATE_MAP');assert.equal(g.run('loadGame()'),true);dismiss(g);
  walk(g,240,432,'attic save has an ordinary escape route');assert.equal(persistent(g),before);
  assert.ok(J(g,'MORNAY_NOTICES').filter(n=>/island_berth|story_berth|survey|back_stair/.test(n.id)).every(n=>!n.onInteract),'other reservations stay inert');
 }
};
