'use strict';
const assert=require('assert/strict'),crypto=require('crypto');
const {createContext}=require('../harness');
const {J,dismiss}=require('./301-mornay-manifest.test');
const {fight}=require('./333-struck-entry-expedition.test');
function setup(g){g.run("storyCheckpointLab.apply('mq5_mornay_report_ready');mq5_report_delivered=true;MainQuest=6;greybank_stage=4;greybank_wins=15;greybank_vision_seen=true;dialogue.open=false;choice.open=false;");}
function place(g,id,x,y,state={}){assert.equal(g.run(`transitionToLocation({mapId:${JSON.stringify(id)},x:${x},y:${y},state:${JSON.stringify(state)},cooldown:true})`),true);g.run('combat.cooldown=100000;dialogue.open=false');}
// Real held movement, with a tile-centre BFS that excludes all other triggers.
// Stop immediately upon a transition so held input cannot shift the landing.
function walkDoor(g,d){
 const start=J(g,'[Math.floor(player.x/TILE),Math.floor(player.y/TILE)]'),map=J(g,'activeMap'),tiles=J(g,'TILE_PROPERTIES');
 const other=new Set(J(g,`SOUTH_DEPTH_DOORS.filter(d=>d.source===${JSON.stringify(d.source)}).map(d=>d.col+','+d.row)`));other.delete(d.col+','+d.row);
 const q=[start],prev=new Map([[start.join(','),null]]),goal=d.col+','+d.row;
 for(let i=0;i<q.length&&!prev.has(goal);i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const [x,y]=q[i],xx=x+dx,yy=y+dy,k=xx+','+yy;
  if(tiles[map[yy]?.[xx]]?.walkable&&!prev.has(k)&&!other.has(k)){prev.set(k,[x,y]);q.push([xx,yy]);}
 }
 assert.ok(prev.has(goal),d.source+' reachable exit');let p=[d.col,d.row],path=[];
 while(prev.get(p.join(','))!==null){path.unshift(p);p=prev.get(p.join(','));}
 for(const [x,y]of path){
  const px=g.run('player.x'),py=g.run('player.y'),tx=(x+.5)*32,ty=(y+.5)*32;
  const key=tx<px?'ArrowLeft':tx>px?'ArrowRight':ty<py?'ArrowUp':'ArrowDown';
  g.hold(key);
  for(let n=0;n<16;n++){g.frames();if(g.run('mapIdForRef(activeMap)')!==d.source)break;}
  g.release(key);if(g.run('mapIdForRef(activeMap)')!==d.source)return;
 }
}
module.exports={name:'South Ruins post-MQ6 depths: gated controls, six floors, return paths, treasures, save and distorted enemies',run(){
 const g=createContext();setup(g);
 const maps=J(g,'SOUTH_DEPTH_MAPS'),doors=J(g,'SOUTH_DEPTH_DOORS'),tiles=J(g,'TILE_PROPERTIES');
 assert.equal(maps.length,36);assert.equal(new Set(doors.map(d=>d.source+':'+d.col+','+d.row)).size,doors.length);
 // Original geometry changes by exactly the reviewed non-chest floor cell.
 const old=J(g,'DUNGEON8_WEST_LOWER2_MAP');assert.equal(old[11][6],10);old[11][6]=62;
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(old)).digest('hex'),'204f1ea8725344b5a110e7e9fec99fac85885897326d5f3fe67bf7cd2ce4a89d');
 assert.deepEqual(J(g,'[DUNGEON8_WEST_DEEP_CHEST.x,DUNGEON8_WEST_DEEP_CHEST.y]'),[272,432]);
 const gate=doors.find(d=>d.gate);
 for(const legacy of [false,true]){
  g.run(`forceLegacyRegionalView=${legacy}`);
  for(const stage of [0,1,2,3]){
   g.run(`greybank_stage=${stage};MainQuest=${stage<2?5:6}`);place(g,gate.source,208,336,{inDungeon:true,dungeonFloor:13});
   walkDoor(g,gate);assert.equal(g.run('mapIdForRef(activeMap)'),gate.source,'blocked before completed report');
  }
  setup(g);g.run(`forceLegacyRegionalView=${legacy}`);place(g,gate.source,208,336,{inDungeon:true,dungeonFloor:13});walkDoor(g,gate);assert.equal(g.run('mapIdForRef(activeMap)'),gate.target);
  for(const d of doors){
   const rev=doors.find(r=>r.source===d.target&&r.target===d.source);assert.ok(rev,'reciprocal '+d.source);
   place(g,d.source,rev.x,rev.y,d.source===gate.source?{inDungeon:true,dungeonFloor:13}:{});
   assert.equal(g.run('saveGame()&&loadGame()'),true,d.source+' saves');g.run('dialogue.open=false;combat.cooldown=100000');
   walkDoor(g,d);assert.equal(g.run('mapIdForRef(activeMap)'),d.target,d.source+' controls');
   assert.deepEqual(J(g,'[player.x,player.y]'),[d.x,d.y],'safe exact landing');
   g.frames(3);assert.equal(g.run('mapIdForRef(activeMap)'),d.target,'no bounce');
   assert.ok(!doors.some(r=>r.source===d.target&&Math.floor(d.x/32)===r.col&&Math.floor(d.y/32)===r.row));
  }
 }
 for(const m of maps){
  assert.equal(m.map.length,15);assert.ok(m.map.every(r=>r.length===16));
  const a=doors.find(d=>d.target===m.id),q=[[Math.floor(a.x/32),Math.floor(a.y/32)]],seen=new Set([q[0].join(',')]);
  for(let i=0;i<q.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const [x,y]=q[i],xx=x+dx,yy=y+dy,k=xx+','+yy;if(tiles[m.map[yy]?.[xx]]?.walkable&&!seen.has(k)){seen.add(k);q.push([xx,yy]);}}
  for(let y=0;y<15;y++)for(let x=0;x<16;x++)if(tiles[m.map[y][x]].walkable)assert.ok(seen.has(x+','+y),'no stranded floor '+m.id);
  place(g,m.id,a.x,a.y);assert.equal(g.run('locationName()'),m.name);assert.equal(g.run('currentLocationAllowsRandomEncounters()'),!m.vault);
  assert.equal(g.run('isEncounterEligibleTile(DUNGEON3_FLOOR)'),true);
  const dest='dungeon:'+m.id;assert.equal(g.run(`debugWarpToDestination(${JSON.stringify(dest)}).success`),true);assert.equal(g.run('mapIdForRef(activeMap)'),m.id);
 }
 for(let level=1;level<=6;level++){
  const ms=maps.filter(m=>m.level===level&&!m.vault);assert.ok(ms.length>=3);
  assert.equal(doors.filter(d=>ms.some(m=>m.id===d.source)&&d.stairs==='down').length,1,'one descent per main floor');
  assert.equal(new Set(ms.map(m=>J(g,`SOUTH_DEPTH_COORDS[${m.room}][0]`))).size,3,'three rooms across');
 }
 // Measured navigation work must rise with depth, rather than merely assigning
 // higher floor numbers to the same route. The graph uses actual grids/doors.
 const distances=J(g,`SOUTH_DEPTH_FLOORS.map(f=>{
  const ds=SOUTH_DEPTH_DOORS.filter(d=>southDepthMap(d.source)?.level===f.level),goal=ds.find(d=>d.stairs==='down');
  const q=[[southDepthId(f.level,0),3,4,0]],seen=new Set();
  for(let i=0;i<q.length;i++){
   const [id,x,y,n]=q[i],k=id+':'+x+','+y;if(seen.has(k))continue;seen.add(k);
   if(id===goal.source&&x===goal.col&&y===goal.row)return n;
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
    let xx=x+dx,yy=y+dy,map=id;if(!WALKABLE[mapRefForId(id)[yy]?.[xx]])continue;
    const d=ds.find(d=>d.source===id&&d.col===xx&&d.row===yy);
    if(d&&d!==goal){if(d.stairs)continue;map=d.target;xx=Math.floor(d.x/TILE);yy=Math.floor(d.y/TILE);}
    q.push([map,xx,yy,n+1]);
   }
  }return null;
 })`);
 for(let i=0;i<distances.length;i++){assert.ok(distances[i]>0);if(i)assert.ok(distances[i]>distances[i-1],'successive descent takes more navigation: '+distances);}
 console.log('  South Ruins shortest stair routes (tile steps): '+distances.join(', '));
 for(const c of J(g,'SOUTH_DEPTH_CHESTS')){
  place(g,c.mapId,c.x,c.y-24);const before=J(g,'({gold:stats.gold,count:stats.items.length})');g.press('Enter');assert.equal(g.run(`CHEST_REGISTRY['${c.id}'].opened`),true);dismiss(g);
  assert.equal(g.run('stats.gold'),before.gold+c.gold);assert.equal(g.run('stats.items.length'),before.count+c.rewards.reduce((n,r)=>n+r[1],0));
  assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');g.press('Enter');dismiss(g);assert.equal(g.run('stats.gold'),before.gold+c.gold,'no chest replay exploit');
 }
 const oldSave=createContext();setup(oldSave);place(oldSave,'SOUTH_DEPTH_1_0_MAP',112,144);
 oldSave.run('DUNGEON8_WEST_DEEP_CHEST.opened=true');assert.equal(oldSave.run('saveGame()'),true);
 assert.equal(oldSave.run("JSON.parse(localStorage.getItem('verdantVale_save')).openedChestIds.some(id=>id.startsWith('chest_south_depth_'))"),false);
 oldSave.run('SOUTH_DEPTH_CHESTS.forEach(c=>c.opened=true)');assert.equal(oldSave.run('loadGame()'),true);
 assert.equal(oldSave.run('SOUTH_DEPTH_CHESTS.every(c=>!c.opened)&&DUNGEON8_WEST_DEEP_CHEST.opened'),true,'older v5 receipt list defaults new chests closed without resetting old loot');
 assert.deepEqual(J(g,'DUNGEON_HORROR_ENEMY_TEMPLATES.map(e=>e.hp)'),[55,120,40]);
 for(const e of J(g,'SOUTH_DEPTH_ENEMIES')){
  assert.ok(e.hp>=240&&e.hp===e.maxHp);assert.equal(g.run(`typeof ENEMY_SPRITE_DISPATCH['${e.id}'].draw`),'function');
  place(g,e.id.includes('manyfold')||e.id.includes('hollowed')||e.id.includes('lattice')?'SOUTH_DEPTH_6_0_MAP':'SOUTH_DEPTH_1_0_MAP',112,144);
  assert.ok(J(g,'currentEncounterPool().map(e=>e.id)').includes(e.id));
  const index=g.run(`currentEncounterPool().findIndex(e=>e.id==='${e.id}')`),size=g.run('currentEncounterPool().length');
  g.run(`stats.maxHp=1000;stats.hp=1000;stats.atk=1000;stats.def=40;Math=Object.create(Math);Math.random=()=>${(index+.5)/size};startCombat()`);
  assert.equal(g.run('canonicalPartyCombat.getView().active'),true,'existing party engine entry');
  assert.equal(g.run('combat.enemies[0].id'),e.id);assert.equal(g.run('combat.enemies[0].maxHp'),e.maxHp);
  fight(g);assert.equal(g.run('greybank_stage'),4,'random fight does not alter quest progress');
 }
 assert.equal(g.run('validateGameData().errors'),0);assert.equal(g.run('SAVE_VERSION'),5);
}};
module.exports.walkDoor=walkDoor;
