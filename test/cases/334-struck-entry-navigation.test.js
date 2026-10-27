'use strict';
const assert=require('assert/strict');
const {fresh,J,place,dismiss,reachable,until}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const {setup,local,speak,victories}=require('./333-struck-entry-expedition.test');
const checks=[],test=(name,run)=>checks.push({name,run});

test('the real regional marker enters a single-return optional branch in both presentation modes',()=>{
 for(const legacy of [false,true]){
  const g=fresh(legacy);local(g,'GREAT_FEN_C8RN3_MAP',240,176);g.run('combat.cooldown=100000;');
  g.press(' ');dismiss(g);assert.deepEqual(J(g,'choice.options'),['Follow the footpath','Stay here']);g.press('Enter');
  assert.equal(g.run('mapIdForRef(activeMap)'),'THIRD_LOCK_APPROACH_MAP');assert.equal(g.run('struck_entry_stage'),1);
  until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')==='GREAT_FEN_C8RN3_MAP');
  assert.deepEqual(J(g,'[player.x,player.y]'),[240,176]);g.frames(20);assert.equal(g.run('mapIdForRef(activeMap)'),'GREAT_FEN_C8RN3_MAP');
  assert.equal(g.run('canWalk(player.x,player.y)'),true);
  const outbound=J(g,'THIRD_LOCK_DOORS.filter(d=>!THIRD_LOCK_CONTENT_KEYS[d.target])');
  assert.equal(outbound.length,1);assert.equal(outbound[0].target,'GREAT_FEN_C8RN3_MAP');
  assert.ok(g.run("!Object.keys(EDGE_TRANSITIONS).some(id=>id.startsWith('THIRD_LOCK_'))"));
  assert.ok(g.run("!REGIONAL_CHUNK_CATALOG.THIRD_LOCK_APPROACH_MAP"));
 }
});
test('every door is reached and crossed by held controls, with save/load, without a wall or NPC trapping the return',()=>{
 for(const legacy of [false,true]){
  const g=fresh(legacy);g.run('struck_entry_stage=2;struck_entry_wins=31;');
  for(const d of J(g,'THIRD_LOCK_DOORS')){
   // Start at the ordinary local arrival. Move to the adjacent approach cell,
   // then hold a key across the actual point-transition trigger.
   local(g,d.source);
   const col=d.col,row=d.row,dy=row<=4?-1:row>=13?1:0,dx=dy?0:col<7?-1:1;
   const x=(col+.5-dx)*32,y=(row+.5-dy)*32;
   walk(g,x,y,d.source+' door approach');assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false;');
   until(g,dy<0?'ArrowUp':dy>0?'ArrowDown':dx<0?'ArrowLeft':'ArrowRight',()=>g.run('mapIdForRef(activeMap)')===d.target);
   assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),[d.x,d.y,d.facing]);assert.equal(g.run('canWalk(player.x,player.y)'),true);
   g.frames(20);assert.equal(g.run('mapIdForRef(activeMap)'),d.target,'no immediate reentry');
  }
 }
});
test('forward gates fail closed until their own victories, while backward exits remain usable',()=>{
 const g=setup();
 for(const d of J(g,'THIRD_LOCK_DOORS.filter(d=>d.requires)')){
  g.run(`struck_entry_wins=${d.requires===1?0:d.requires===3?1:3}`);local(g,d.source,(d.col+.5)*32,(d.row+.5)*32+16);
  g.hold('ArrowUp');g.frames(15);g.release('ArrowUp');assert.equal(g.run('mapIdForRef(activeMap)'),d.source);
 }
 // Debug entry can walk out even before a lead. Interacting locally starts
 // exploration, and a fresh gate still requires combat rather than a flag hop.
 g.run('struck_entry_stage=0;struck_entry_wins=0');local(g,'THIRD_LOCK_APPROACH_MAP');
 until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')==='GREAT_FEN_C8RN3_MAP');
 assert.equal(g.run('struck_entry_stage'),0);
});
test('all residents and supplies are reachable; post-rescue Mornay bodies are unique and accessible on workday/Dayoff',()=>{
 const g=setup();g.run('struck_entry_wins=3;');
 for(const [id,map]of [['struck_heddra','THIRD_LOCK_SHELTER_MAP'],['struck_belric','THIRD_LOCK_SHELTER_MAP'],['struck_elset','THIRD_LOCK_COMMON_MAP'],['struck_tam','THIRD_LOCK_COTTAGES_MAP']]){
  local(g,map);speak(g,id);dismiss(g);
 }
 local(g,'THIRD_LOCK_COMMON_MAP');const p=reachable(g).find(([x,y])=>Math.hypot(x-400,y-80)<44);assert.ok(p);walk(g,...p,'relief chest');g.press(' ');dismiss(g);
 assert.equal(g.run('struck_entry_supplies'),true);const items=g.run('stats.items.length');g.press(' ');dismiss(g);assert.equal(g.run('stats.items.length'),items);
 g.run('struck_entry_wins=15;struck_entry_stage=2');local(g,'THIRD_LOCK_SHELTER_MAP');speak(g,'struck_heddra');dismiss(g);
 for(const day of [1,5]){
  g.run(`day=${day}`);
  for(const [id,map]of [['struck_iswen','MORNAY_MIDDLE_LOWER_WEST_MAP'],['struck_heddra','MORNAY_GATE_INN_MAP'],['struck_belric','MORNAY_INFIRMARY_MAP']]){
   place(g,map);speak(g,id);dismiss(g);assert.equal(g.run(`SIMPLE_NPCS.filter(n=>n.id==='${id}').length`),1);
  }
 }
});
test('the settlement contains no random encounters or isolated walkable terrain pockets',()=>{
 const g=setup();
 for(const map of J(g,'THIRD_LOCK_MAPS')){
  assert.equal(g.run(`MAP_CATALOG['${map.id}'].allowRandomEncounters`),false);
  const points=[];for(let y=0;y<15;y++)for(let x=0;x<16;x++)if(g.run(`WALKABLE[${map.map[y][x]}]`))points.push([x,y]);
  const allowed=new Set(points.map(p=>p.join(','))),seen=new Set(),queue=[points[0]];
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i],key=x+','+y;if(seen.has(key))continue;seen.add(key);
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(allowed.has((x+dx)+','+(y+dy))&&!seen.has((x+dx)+','+(y+dy)))queue.push([x+dx,y+dy]);
  }
  assert.equal(seen.size,allowed.size,map.id+' has one contiguous base-walkable component');
 }
});
test('Renn still needs the player’s filing choice and pays exactly 60 gold once',()=>{
 const g=fresh();g.run('day=1;weight_quest_stage=2;weight_note_signed=true;corvin_favor_done=true;');
 assert.ok(g.run("transitionToLocation({mapId:'OFFICE_MAP',x:144,y:100,state:{inTown:true,currentTownId:'calwick',townBuilding:'office'}})"));
 g.press(' ');dismiss(g);assert.equal(g.run('choice.options.length'),3);g.press('ArrowDown');g.press('ArrowDown');g.press('Enter');dismiss(g);
 assert.equal(g.run('weight_quest_stage'),2);assert.equal(g.run('cabinetCaseFlag'),false);
 g.press(' ');dismiss(g);g.press('Enter');dismiss(g);assert.equal(g.run('cabinetCaseFlag'),true);assert.equal(g.run('weight_quest_stage'),3);
 assert.ok(g.run("transitionToLocation({mapId:'DRENWICK_HARBORMASTER_MAP',x:240,y:300,state:{inTown:true,currentTownId:'drenwick',townBuilding:'harbormaster'}})"));
 g.run("var renn=SIMPLE_NPCS.find(n=>n.id==='harbormaster_interior');player.x=renn.x;player.y=renn.y+20;");
 const gold=g.run('stats.gold');g.press(' ');const pay=g.run('dialogue.callbacks[0]');dismiss(g);pay();
 assert.equal(g.run('stats.gold'),gold+60);assert.equal(g.run('weight_quest_stage'),4);assert.equal(g.run('saveGame()&&loadGame()'),true);pay();assert.equal(g.run('stats.gold'),gold+60);
});
test('the lead follows Heddra from Drenwick to a fen hamlet, while the tally keeps its historical origin',()=>{
 const g=setup(true);place(g,'MORNAY_MIDDLE_LOWER_WEST_MAP');
 const lead=speak(g,'struck_iswen');assert.match(lead,/cooked for the Drenwick canal crews/);
 assert.match(lead,/moved to Sedge Hollow/);assert.match(lead,/pots, blankets and those papers/);
 assert.match(lead,/Peat cutters, reed harvesters, eel fishers/);dismiss(g);
 assert.ok(g.run("transitionToLocation({mapId:'DRENWICK_OFFICE_MAP',x:400,y:100,state:{inTown:true,currentTownId:'drenwick',townBuilding:'office'}})"));
 g.press(' ');const office=J(g,'dialogue.pages').flat().join(' ');
 assert.match(office,/Forwarding address: Sedge Hollow/);assert.match(office,/move to the fen hamlet/);dismiss(g);
 for(const m of J(g,'THIRD_LOCK_MAPS')){assert.match(m.name,/^Sedge Hollow/);assert.doesNotMatch(m.name,/Lock|Depot|Canal/);}
 assert.match(g.run('struckEntry.note().body'),/Heddra moved there/);
 assert.match(g.run("SPECIAL_ITEM_NOTES['Third Lock Towpath Tally']"),/third lock on the Drenwick canal/);
 assert.match(g.run("SPECIAL_ITEM_NOTES['Third Lock Towpath Tally']"),/brought it to Sedge Hollow/);
});
test('the natural stream stays impassable beside its usable timber footbridge in both movement modes',()=>{
 for(const legacy of [false,true]){
  const g=fresh(legacy);g.run('struck_entry_stage=2;struck_entry_wins=15');local(g,'THIRD_LOCK_CROSSING_MAP');
  walk(g,240,144,'cross footbridge north');assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');
  walk(g,240,336,'return across footbridge');
  for(const x of [208,304])assert.equal(g.run(`canWalk(${x},240)`),false,'water beside the deck is not a crossing');
 }
});
test('authored dialogue wraps without loss and Esla keeps explicit green speaker metadata',()=>{
 const g=setup(true);for(const pages of Object.values(J(g,'STRUCK_ENTRY_DIALOGUE')))for(const [speaker,line]of pages){
  if(speaker!==null)assert.ok(g.run(`DIALOGUE_SPEAKER_DEFINITIONS[${JSON.stringify(speaker)}]`));
  const wrapped=g.run('paginateDialoguePages')([[line]],468,3,s=>s.length*8.4);
  assert.ok(wrapped.every(p=>p.length<=3&&p.every(s=>s.length*8.4<=468)));
  assert.equal(wrapped.flat().join(' ').replace(/\s+/g,' ').trim(),line.replace(/\s+/g,' ').trim());
 }
 assert.equal(g.run('DIALOGUE_SPEAKER_DEFINITIONS.esla.dialogueStyleId'),g.run('ESLA_DIALOGUE_STYLE_ID'));
});
module.exports={name:'Sedge Hollow navigation, return paths, survivor reachability, filing choice and dialogue',checks,
 run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Sedge Hollow navigation scenarios passed');}};
