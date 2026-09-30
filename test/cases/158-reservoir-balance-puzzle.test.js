'use strict';

const assert=require('assert/strict');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(legacy=false) {
  const g=createContext();
  g.run(`Math=Object.create(Math);Math.random=()=>{throw Error('puzzle consumed RNG');};
    dialogue.open=false;dialogue.callbacks=null;statusEffects=[];
    resetLocationState();placeAtLocation('NORTH_BASIN_C_MAP',13.5*TILE,7*TILE);
    forceLegacyRegionalView=${legacy};stats.items=[];stats.gold=9;`);
  return g;
}
function unchanged(g) {
  return g.run(`JSON.stringify({stats,statusEffects,day,player:{x:player.x,y:player.y,facing:player.facing},
    location:snapshotLocationState(),world:regionalWorldPosition(),
    flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),combat:combat.active,
    save:localStorage.getItem('verdantVale_save')})`);
}
function closeDialogue(g) {
  for(let i=0;g.run('dialogue.open');i++){assert.ok(i<10);g.press('Enter');}
}
function begin(g) {g.press('Enter');assert.equal(g.run('dialogue.open'),true);closeDialogue(g);assert.equal(g.run('choice.open'),true);}
function select(g,index) {
  assert.equal(g.run('choice.open'),true);
  while(g.run('choice.cursor')<index)g.press('ArrowDown');
  while(g.run('choice.cursor')>index)g.press('ArrowUp');
  g.press('Enter');
}
function levels(g) {return J(g,'choice.options.slice(0,3)').map(s=>Number(s.match(/: (\d+) \/ /)[1]));}
function pour(g,from,to) {
  select(g,from);
  const index=J(g,'choice.options').findIndex(s=>s.startsWith('Into '+[12,7,5][to]+'-mark'));
  assert.ok(index>=0);select(g,index);
}
function solution(g) {
  return J(g,`(function(){
    const queue=[{levels:[12,0,0],path:[]}],seen=new Set(['12,0,0']);
    for(let i=0;i<queue.length;i++) {
      const node=queue[i];if(node.levels.join(',')==='6,6,0')return node.path;
      for(let from=0;from<3;from++)for(let to=0;to<3;to++)if(from!==to){
        const next=transferReservoirBalanceWater(node.levels,from,to),key=next.join(',');
        if(!seen.has(key)){seen.add(key);queue.push({levels:next,path:[...node.path,[from,to]]});}
      }
    }
    return null;
  })()`);
}
function solve(g) {for(const [from,to] of solution(g))pour(g,from,to);}
function atOldChest(g) {
  g.run(`resetLocationState();inSluice=true;sluiceFloor=2;
    placeAtLocation('SLUICE_LEVEL2_MAP',SLUICE_SECRET_CHEST.x-TILE/2,SLUICE_SECRET_CHEST.y);`);
}

test('old chest keeps its stable identity but holds 55 gold; only the puzzle awards the blade',()=>{
  const g=fresh();assert.equal(g.run('SLUICE_SECRET_CHEST.id'),'chest_sluice_secret');
  assert.equal(g.run('SLUICE_SECRET_CHEST.gold'),55);assert.equal(g.run('SLUICE_SECRET_CHEST.item'),undefined);
  assert.deepEqual(J(g,"OPENABLE_CHESTS.filter(c=>c.item?.name==='Warden Blade').map(c=>c.id)"),['chest_reservoir_balance']);
  assert.deepEqual(J(g,"ITEM_REGISTRY['Warden Blade']"),{name:'Warden Blade',type:'weapon',bonus:10,price:440});
  assert.deepEqual(J(g,'RESERVOIR_BALANCE_CACHE.item'),J(g,"ITEM_REGISTRY['Warden Blade']"));
});
test('ordinary Sluice interaction gives exactly 55 gold once, without equipment',()=>{
  const g=fresh();atOldChest(g);g.press('Enter');assert.equal(g.run('stats.gold'),64);
  assert.equal(g.run('SLUICE_SECRET_CHEST.opened'),true);assert.equal(g.run('stats.items.length'),0);
  assert.match(g.run('dialogue.pages.flat().join(" ")'),/55 gold/);closeDialogue(g);g.press('Enter');
  assert.equal(g.run('stats.gold'),64);
});
test('the Sluice chest retains cursed-loot loss without subtracting owned gold',()=>{
  const g=fresh();atOldChest(g);g.run("statusEffects=['cursed'];");g.press('Enter');
  assert.equal(g.run('stats.gold'),9);assert.equal(g.run('SLUICE_SECRET_CHEST.opened'),true);
  assert.match(g.run('dialogue.pages.flat().join(" ")'),/Cursed!.*coins/s);
  assert.deepEqual(J(g,'statusEffects'),['cursed']);assert.equal(g.run('stats.items.length'),0);
});
test('new compartment is registered once and its site is reachable from the reservoir entrance',()=>{
  const g=fresh();assert.equal(g.run("CHEST_REGISTRY_IDS.filter(id=>id==='chest_reservoir_balance').length"),1);
  assert.equal(g.run("CHEST_REGISTRY['chest_reservoir_balance']===RESERVOIR_BALANCE_CACHE"),true);
  assert.equal(g.run(`(function(){
    const map=mapRefForId(RESERVOIR_BALANCE_CACHE.mapId),queue=[[7,13]],seen=new Set(['7,13']);
    const tx=Math.floor(RESERVOIR_BALANCE_CACHE.x/TILE),ty=Math.floor(RESERVOIR_BALANCE_CACHE.y/TILE);
    for(let i=0;i<queue.length;i++){
      const [x,y]=queue[i];if(x===tx&&y===ty)return true;
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy,key=nx+','+ny;
        if(ny>=0&&ny<15&&nx>=0&&nx<16&&WALKABLE[map[ny][nx]]&&!seen.has(key)){seen.add(key);queue.push([nx,ny]);}
      }
    }return false;
  })()`),true);
});
for(const legacy of [false,true])test('real input opens readable puzzle in '+(legacy?'legacy':'continuous')+' presentation',()=>{
  const g=fresh(legacy),before=unchanged(g);g.press('Enter');
  const text=g.run('dialogue.pages.flat().join(" ")');
  for(const pattern of [/12, 7 and 5/,/equally/,/narrow chamber dry/,/twelve measures/,/cannot stop it halfway/])assert.match(text,pattern);
  closeDialogue(g);assert.deepEqual(levels(g),[12,0,0]);assert.equal(unchanged(g),before);
});
test('transfer arithmetic is full-pour, water-conserving, deterministic and non-mutating',()=>{
  const g=fresh();g.run('var source=[12,0,0];var poured=transferReservoirBalanceWater(source,0,1);');
  assert.deepEqual(J(g,'source'),[12,0,0]);assert.deepEqual(J(g,'poured'),[5,7,0]);
  assert.deepEqual(J(g,'transferReservoirBalanceWater(poured,1,2)'),[5,2,5]);
  assert.deepEqual(J(g,'transferReservoirBalanceWater([5,2,5],2,0)'),[10,2,0]);
  assert.deepEqual(J(g,'transferReservoirBalanceWater([5,7,0],0,1)'),[5,7,0]);
});
test('the shortest possible solution really needs eleven transfers',()=>{
  const g=fresh();assert.equal(solution(g).length,11);
});
test('malformed transfers reject without changing the source or game',()=>{
  const g=fresh(),before=unchanged(g);
  for(const expression of ['[12,0,0],0,0','[12,0,0],-1,1','[12,0,0],0,3','[12,0,0],"0",1',
    '[11,0,0],0,1','[12,1,0],0,1','[7,0,5.5],0,1','[5,,7],0,1','[12,0,0,0],0,1'])
    assert.throws(()=>g.run('transferReservoirBalanceWater('+expression+')'),/Invalid reservoir/);
  assert.equal(unchanged(g),before);
});
test('empty source and full destination are harmless no-ops, never penalties',()=>{
  const g=fresh(),before=unchanged(g);begin(g);select(g,1);assert.deepEqual(levels(g),[12,0,0]);
  assert.match(g.run('choice.title'),/empty/);pour(g,0,1);pour(g,0,1);
  assert.match(g.run('choice.title'),/full/);assert.deepEqual(levels(g),[5,7,0]);assert.equal(unchanged(g),before);
});
test('Back, re-reading the plate and Reset do not cost HP, gold, items or RNG',()=>{
  const g=fresh(),before=unchanged(g);begin(g);pour(g,0,1);select(g,1);select(g,2);
  assert.deepEqual(levels(g),[5,7,0]);select(g,3);closeDialogue(g);assert.deepEqual(levels(g),[5,7,0]);
  select(g,4);assert.deepEqual(levels(g),[12,0,0]);assert.equal(unchanged(g),before);
});
for(const targetMenu of [false,true])test('Escape discards an unfinished '+(targetMenu?'destination':'source')+' menu',()=>{
  const g=fresh(),before=unchanged(g);begin(g);pour(g,0,1);if(targetMenu)select(g,1);
  g.press('Escape');assert.equal(g.run('choice.open'),false);begin(g);
  assert.deepEqual(levels(g),[12,0,0]);assert.equal(unchanged(g),before);
});
test('explicit Leave resets, and stale callbacks cannot act on a new attempt',()=>{
  const g=fresh();begin(g);pour(g,0,1);g.run('var stale=choice.callbacks[4];');select(g,5);begin(g);
  pour(g,0,2);g.run('stale();');assert.deepEqual(levels(g),[7,0,5]);
});
test('held confirm enters one submenu, not an unintended water transfer',()=>{
  const g=fresh();begin(g);g.hold('Enter');g.hold('Enter');g.release('Enter');
  assert.equal(g.run('choice.options.length'),3);assert.match(g.run('choice.options[0]'),/0 \/ 7/);
});
test('movement, interactions, random encounters and menus remain frozen during the puzzle',()=>{
  const g=fresh();begin(g);const before=unchanged(g);
  for(const key of ['ArrowLeft','ArrowRight','m','`'])g.press(key);
  g.hold('ArrowRight');g.frames(40);g.release('ArrowRight');
  assert.equal(unchanged(g),before);assert.equal(g.run('menu.open'),false);assert.equal(g.run('debugMenu.open'),false);
});
test('wrong map, distant position and broken canonical context cannot start the puzzle',()=>{
  const g=fresh();g.run("placeAtLocation('MAP',7.5*TILE,9.5*TILE);");
  const before=unchanged(g);assert.equal(g.run('interactReservoirBalanceLock()'),false);assert.equal(unchanged(g),before);
  g.run("placeAtLocation('NORTH_BASIN_C_MAP',7.5*TILE,13.5*TILE);");assert.equal(g.run('interactReservoirBalanceLock()'),false);
  g.run('activeMap=MAP;');assert.equal(g.run('interactReservoirBalanceLock()'),false);
});
test('old callbacks reject after relocation and cannot grant a reward remotely',()=>{
  const g=fresh();begin(g);g.run('var oldSource=choice.callbacks[0];');
  g.run("placeAtLocation('MAP',7.5*TILE,9.5*TILE);");g.run('oldSource();');
  assert.equal(g.run('RESERVOIR_BALANCE_CACHE.opened'),false);assert.equal(g.run('stats.items.length'),0);
});
for(const legacy of [false,true])test('eleven real UI transfers grant one unequipped blade in '+(legacy?'legacy':'continuous')+' mode',()=>{
  const g=fresh(legacy),stats=J(g,'stats'),flags=J(g,'QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])');
  begin(g);const path=solution(g);
  for(const [i,[from,to]] of path.entries()){
    pour(g,from,to);assert.equal(g.run('RESERVOIR_BALANCE_CACHE.opened'),i===path.length-1);
    assert.equal(g.run('stats.items.length'),i===path.length-1?1:0);
  }
  assert.equal(g.run('choice.open'),false);assert.equal(g.run('dialogue.open'),true);
  assert.match(g.run('dialogue.pages.flat().join(" ")'),/Warden Blade/);
  assert.deepEqual(J(g,'stats'),{...stats,items:[J(g,"ITEM_REGISTRY['Warden Blade']")]});
  assert.deepEqual(J(g,'QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])'),flags);
  closeDialogue(g);g.press('Enter');assert.match(g.run('dialogue.pages.flat().join(" ")'),/empty/);
  closeDialogue(g);assert.equal(g.run('choice.open'),false);assert.equal(g.run('stats.items.length'),1);
});
test('save/load persists the claim by chest id, never the intermediate water or callback state',()=>{
  const g=fresh();begin(g);pour(g,0,1);g.press('Escape');assert.equal(g.run('saveGame()'),true);
  const before=J(g,"JSON.parse(localStorage.getItem('verdantVale_save'))");
  assert.ok(!JSON.stringify(before).includes('chest_reservoir_balance'));
  assert.equal(g.run('loadGame()'),true);begin(g);assert.deepEqual(levels(g),[12,0,0]);solve(g);closeDialogue(g);
  assert.equal(g.run('saveGame()'),true);
  const after=J(g,"JSON.parse(localStorage.getItem('verdantVale_save'))");assert.deepEqual(Object.keys(after),Object.keys(before));
  assert.ok(JSON.stringify(after).includes('chest_reservoir_balance'));
  for(const key of ['levels','capacities','balancePuzzle','choice','callbacks'])assert.equal(Object.hasOwn(after,key),false);
  g.run('stats.items=[];RESERVOIR_BALANCE_CACHE.opened=false;');assert.equal(g.run('loadGame()'),true);
  assert.equal(g.run('RESERVOIR_BALANCE_CACHE.opened'),true);assert.equal(g.run('stats.items.length'),1);
  g.press('Enter');closeDialogue(g);assert.equal(g.run('stats.items.length'),1);assert.equal(g.run('SAVE_VERSION'),4);
});
test('an opened old Sluice chest stays opened through load; no retroactive gold or blade removal',()=>{
  const g=fresh();g.run("SLUICE_SECRET_CHEST.opened=true;grantItem('Warden Blade');saveGame();");
  assert.equal(g.run('loadGame()'),true);atOldChest(g);g.press('Enter');
  assert.equal(g.run('stats.gold'),9);assert.equal(g.run('stats.items.length'),1);
  assert.equal(g.run('RESERVOIR_BALANCE_CACHE.opened'),false);
});
test('reward remains claimed even if the blade is later sold or discarded',()=>{
  const g=fresh();begin(g);solve(g);closeDialogue(g);g.run('stats.items=[];saveGame();loadGame();');
  g.press('Enter');closeDialogue(g);assert.equal(g.run('stats.items.length'),0);assert.equal(g.run('choice.open'),false);
});
test('rendering and all menu depths stay read-only and within native/scaled bounds',()=>{
  const g=fresh();record(g);
  function paint(code){const before=unchanged(g);g.run('paint=[];'+code);assert.equal(unchanged(g),before);return J(g,'paint');}
  let calls=paint('drawReservoirBalanceLock();');assert.ok(calls.some(c=>c.type==='text'&&c.args[0]==='SPACE'));
  for(const scale of [1,2]) {
    calls=paint(`ctx.save();ctx.scale(${scale},${scale});drawReservoirBalanceLock();ctx.restore();`);
    for(const c of calls.filter(c=>c.bounds))assert.ok(c.bounds[0]>=0&&c.bounds[1]>=0&&c.bounds[2]<=512*scale&&c.bounds[3]<=480*scale);
  }
  begin(g);
  for(const level of ['source','destination','plate','reset']) {
    if(level==='destination')select(g,0);
    if(level==='plate'){select(g,2);select(g,3);closeDialogue(g);}
    if(level==='reset')select(g,4);
    calls=paint('drawChoice();');
    for(const c of calls.filter(c=>c.type==='fillRect'||c.type==='strokeRect'))assert.ok(c.bounds[0]>=0&&c.bounds[1]>=0&&c.bounds[2]<=512&&c.bounds[3]<=480);
    assert.ok(calls.filter(c=>c.type==='text').every(c=>c.args[1]>=0&&c.args[1]<512&&c.args[2]>=0&&c.args[2]<480));
  }
  g.press('Escape');g.run("placeAtLocation('MAP',7.5*TILE,9.5*TILE);");assert.equal(paint('drawReservoirBalanceLock();').length,0);
});

module.exports={name:'Reservoir balance puzzle: eleven-transfer Warden Blade reward and 55-gold Sluice chest',checks,
  run(){for(const {name,run} of checks){try{run();}catch(e){e.message=name+': '+e.message;throw e;}}}};
