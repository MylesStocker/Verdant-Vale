'use strict';
const assert=require('assert/strict'),crypto=require('crypto');
const {createContext}=require('../harness');
const ID='EASTERN_FENS_TRAVELLERS_RISE_MAP';
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const checks=[],test=(name,run)=>checks.push({name,run});
function fresh(legacy=false){const g=createContext();g.run(`storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false;
 completeMq5Assignment();dialogue.open=false;forceLegacyRegionalView=${legacy};
 placeAtLocation('${ID}',10.5*TILE,.5*TILE);travellersRiseAmbush.resetTransient();
 Math=Object.create(Math);var chokeRolls=0;Math.random=()=>{chokeRolls++;throw Error('choke RNG')}`);return g;}
const state=g=>g.run('JSON.stringify({stats,party:persistentParty.serialize(),day,MainQuest,quests:QUEST_FLAG_BINDINGS.map(b=>b.get()),identities:combatEnemyInstanceSequence})');
function graph(grid,walk,removeTrigger){const q=[[10,0]],seen=new Set(['10,0']);for(let i=0;i<q.length;i++){
 const [c,r]=q[i];for(const [dc,dr]of [[1,0],[-1,0],[0,1],[0,-1]]){
 const x=c+dc,y=r+dr,k=x+','+y;if(!walk[grid[y]?.[x]]||seen.has(k)||removeTrigger&&x===10&&y===7)continue;
 seen.add(k);q.push([x,y]);}}
 return seen;
}
test('exact three-cell delta preserves the west pocket, retreat, camp feature and every other terrain cell',()=>{
 const g=fresh(),grid=J(g,`mapRefForId('${ID}')`),walk=J(g,'WALKABLE');
 const prior=grid.map(r=>r.slice());for(const [r,old,current]of [[4,0,119],[5,89,3],[6,0,119]]){
 assert.equal(grid[r][11],current);prior[r][11]=old;}
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(prior)).digest('hex'),
 '7eec6d896a56cb5f1fba1fde6f3af3aa6ddac2f5c137b045d8c66ae95f4ec203','exact integrated-main grid before the three-cell fix');
 assert.ok(graph(prior,walk,true).has('15,7'),'prior row-4 route bypassed the trigger');
 const cut=graph(grid,walk,true),open=graph(grid,walk,false);
 assert.equal(cut.size,121);assert.equal(open.size,163);
 for(const p of ['6,4','6,5','4,8','9,0','10,0','11,0'])assert.ok(cut.has(p),'west/camp/retreat '+p);
 for(const p of ['12,7','15,7','15,8','15,9']){assert.ok(!cut.has(p),'no bypass '+p);assert.ok(open.has(p),'open route '+p);}
 assert.deepEqual(J(g,'travellersRiseAmbush.getView().trigger'),{col:10,row:7});
 assert.deepEqual(J(g,'travellersRiseCamp.getView().entrance'),{col:6,row:4});
});
test('actual footprint graphs in continuous and legacy modes cannot slip between the natural blockers',()=>{
 for(const legacy of [false,true]){
 const g=fresh(legacy),before=state(g);
 g.run(`function footprintGraph(){
  const q=[[336,16]],seen=new Set(['336,16']);let east=false,camp=false,west=false;
  for(let i=0;i<q.length;i++){
   const [x,y]=q[i];if(x>=400)east=true;if(x===208&&y===144)camp=true;if(x===144&&y===272)west=true;
   for(const [dx,dy]of [[2,0],[-2,0],[0,2],[0,-2]]){
    const nx=x+dx,ny=y+dy,k=nx+','+ny;
    if(nx<10||ny<10||nx>502||ny>470||seen.has(k)||Math.floor(nx/32)===10&&Math.floor(ny/32)===7||!canWalk(nx,ny))continue;
    seen.add(k);q.push([nx,ny]);
   }
  }return {east,camp,west,count:seen.size};
 }`);
 const result=J(g,'footprintGraph()');assert.equal(result.east,false);assert.equal(result.camp,true);assert.equal(result.west,true);
 assert.ok(result.count>10000);assert.equal(state(g),before);assert.equal(g.run('chokeRolls'),0);
 }
});
test('deliberate west-to-east input starts the scene before the backup gate and all three actors walk without overlaps',()=>{
 for(const legacy of [false,true]){
 const g=fresh(legacy);g.run(`placeAtLocation('${ID}',9.5*TILE,7.5*TILE)`);g.frames(1);
 const before=state(g);g.hold('ArrowRight');g.frames(24);g.release('ArrowRight');
 assert.equal(g.run('travellersRiseAmbush.getView().phase'),'opening');assert.equal(g.run('Math.floor(player.x/TILE)'),10);
 const start=J(g,'travellersRiseAmbush.getView().actors');
 assert.deepEqual(start.map(a=>[a.x,a.y]),[[272,144],[336,112],[464,144]]);
 g.run('finishDialogue()');let previous=start,moved=[false,false,false],ticks=0;
 while(g.run("travellersRiseAmbush.getView().phase==='walking'")){
  assert.ok(ticks++<250);g.frames(1);const actors=J(g,'travellersRiseAmbush.getView().actors'),player=J(g,'({x:player.x,y:player.y})');
  for(let i=0;i<3;i++){
   const a=actors[i],p=previous[i],distance=Math.abs(a.x-p.x)+Math.abs(a.y-p.y);
   assert.ok(distance<=1.5&&(a.x===p.x||a.y===p.y));if(distance)moved[i]=true;
   assert.ok(Math.abs(a.x-player.x)>=18||Math.abs(a.y-player.y)>=18);
   assert.notDeepEqual([Math.floor(a.x/32),Math.floor(a.y/32)],[10,7]);
   for(const dx of [-9,9])for(const dy of [-9,9])assert.equal(g.run(`isTileWalkable(mapRefForId('${ID}')[${Math.floor((a.y+dy)/32)}][${Math.floor((a.x+dx)/32)}])`),true);
   for(let j=0;j<i;j++)assert.ok(Math.abs(a.x-actors[j].x)>=18||Math.abs(a.y-actors[j].y)>=18);
  }previous=actors;
 }
 assert.deepEqual(moved,[true,true,true]);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'reveal');
 assert.deepEqual(previous.map(a=>[a.x,a.y,a.facing]),[[272,240,'right'],[336,176,'down'],[400,240,'left']]);
 assert.equal(state(g),before);assert.equal(g.run('chokeRolls'),0);
 }
});
test('blocked home or route rejects before dialogue, combat identities, payment or story changes',()=>{
 for(const [c,r]of [[8,4],[8,5],[10,3],[10,4],[14,6]]){
 const g=fresh();g.run(`placeAtLocation('${ID}',9.5*TILE,7.5*TILE);travellersRiseAmbush.tryTrigger();
 mapRefForId('${ID}')[${r}][${c}]=1;placeAtLocation('${ID}',10.5*TILE,7.5*TILE)`);
 const before=state(g);g.frames(1);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'fault');
 assert.match(g.run('travellersRiseAmbush.getView().failure'),/unsafe cell/);assert.equal(state(g),before);
 assert.equal(g.run('dialogue.open||choice.open||canonicalPartyCombat.isActive()'),false);assert.equal(g.run('chokeRolls'),0);
 }
});
test('load on trigger stays inert; leaving and re-entering arms it in both movement modes',()=>{
 for(const legacy of [false,true]){
 const g=fresh(legacy);g.run(`placeAtLocation('${ID}',10.5*TILE,7.5*TILE)`);assert.equal(g.run('saveGame()'),true);
 assert.equal(g.run('loadGame()'),true);g.frames(8);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');
 g.hold('ArrowLeft');g.frames(14);g.release('ArrowLeft');assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');
 g.hold('ArrowRight');g.frames(18);g.release('ArrowRight');assert.equal(g.run('travellersRiseAmbush.getView().phase'),'opening');
 assert.equal(g.run('chokeRolls'),0);
 }
});
test('defensive east gate preserves pending camp, opens at completed night, and loaded completion cannot replay',()=>{
 for(const legacy of [false,true]){
 const g=fresh(legacy);for(const stage of [-1,1,2])for(const row of [7,8,9]){
 g.run(`travellers_rise_ambush_complete=${stage>=0};travellers_rise_camp_stage=${Math.max(0,stage)};syncQuestFlagsToWindow();
 dialogue.open=false;travellersRiseAmbush.resetTransient();placeAtLocation('${ID}',15.5*TILE,${row+.5}*TILE)`);
 const pos=J(g,'regionalWorldPosition()');g.hold('ArrowRight');g.frames(18);g.release('ArrowRight');
 if(stage===2)assert.equal(g.run('regionalActiveMapId()'),'EASTERN_FENS_WIDE_WATER_MAP');
 else{assert.deepEqual(J(g,'regionalWorldPosition()'),pos);g.run('dialogue.open=false');g.hold('ArrowLeft');g.frames(4);g.release('ArrowLeft');assert.ok(g.run('player.x')<15.5*32);}
 }
 g.run(`placeAtLocation('${ID}',6.5*TILE,5.5*TILE);dialogue.open=false`);
 assert.equal(g.run('enterTravellersRiseCamp()'),true);assert.equal(g.run('exitTravellersRiseCamp()'),true);
 assert.deepEqual(J(g,'[player.x,player.y]'),[208,176]);
 assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
 const before=state(g);g.run(`placeAtLocation('${ID}',9.5*TILE,7.5*TILE)`);g.frames(1);
 g.hold('ArrowRight');g.frames(24);g.release('ArrowRight');
 assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');assert.equal(g.run('travellersRiseCamp.getView().phase'),'idle');
 assert.equal(state(g),before);assert.equal(g.run('chokeRolls'),0);
 }
});
module.exports={name:'Travellers Rise: natural cut-vertex, preserved camp, safe staging and continuous/legacy input',run(){
 for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}
 console.log('  '+checks.length+' natural-choke checks passed (121 western / 163 connected tiles)');
}};
