'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const checks=[];
const test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'formationSessionController.getView()');
function fresh() {
  const g=createContext();
  g.run(`dialogue.open=false;dialogue.callbacks=null;statusEffects=[];
    stats.hp=100;stats.maxHp=100;stats.atk=100;stats.def=10;stats.spd=10;
    stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
    Math=Object.create(Math);var receiverRolls=0;Math.random=()=>{throw Error('unexpected RNG');};`);
  return g;
}
function warning(g) {
  g.run(`reservoir_quest_started=true;gallery_deeper_stair_seen=true;
    descendSunkenGallery();placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,2.5*TILE);ascendSunkenGallery();`);
  assert.equal(g.run('galleryReceiverEncounter.isLocked()'),true);
  g.press('Enter');g.press('Enter');assert.equal(g.run('choice.open'),true);
}
function enter(g) {
  warning(g);g.press('Enter');
  assert.equal(g.run('galleryReceiverEncounter.getView().phase'),'staging');
  for(let i=0;i<4;i++)g.press('Enter');
  assert.equal(view(g).phase,'awaiting_action');assert.equal(g.run('combat.active'),true);
}
function rng(g,seed=1) {
  g.run(`var receiverSeed=${seed};Math.random=()=>{receiverRolls++;receiverSeed=(Math.imul(receiverSeed,1664525)+1013904223)>>>0;return receiverSeed/4294967296;};`);
}
function round(g,slot) {
  g.press('Enter');
  const target=g.run('combat.enemies['+slot+'].instanceId');
  for(let i=0;view(g).selectedTargetInstanceId!==target;i++){assert.ok(i<3);g.press('ArrowRight');}
  g.press('Enter');assert.equal(view(g).phase,'playback');
  assert.equal(view(g).playbackFrame.currentEvent,null);
  const finalHP=J(g,'[stats.hp,combat.enemies.map(e=>e.hp)]'),rolls=g.run('receiverRolls');
  while(view(g).phase==='playback') {
    g.renderFrame();g.press('Enter');
    assert.deepEqual(J(g,'[stats.hp,combat.enemies.map(e=>e.hp)]'),finalHP);
    assert.equal(g.run('receiverRolls'),rolls);
  }
  assert.equal(view(g).phase,'playback_complete');
  assert.equal(g.run('gallery_receiver_defeated'),false);
  g.press('Enter');
}
function win(g) {
  rng(g);for(let i=0;g.run('combat.active');i++) {
    assert.ok(i<50);const slot=g.run('combat.enemies.find(e=>e.hp>0).slot');round(g,slot);
  }
  assert.equal(g.run('gallery_receiver_defeated'),true);
}
function closeDialogue(g) {for(let i=0;g.run('dialogue.open');i++){assert.ok(i<60);g.press('Enter');}}
function flags(g) {return J(g,'QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()])');}
function preserved(g) {return g.run(`JSON.stringify({hp:stats.hp,items:stats.items,xp:stats.xp,gold:stats.gold,
  statusEffects,day,flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),sequence:combatEnemyInstanceSequence,
  location:snapshotLocationState(),map:mapIdForRef(activeMap),player})`);}

test('defaults and exactly two new save bindings, with independent inspected clue',()=>{
  const g=fresh();assert.deepEqual(J(g,'[gallery_deeper_stair_seen,gallery_receiver_defeated,!!window.gallery_clue_stair]'),[false,false,false]);
  for(const key of ['gallery_deeper_stair_seen','gallery_receiver_defeated']) {
    assert.equal(g.run(`QUEST_FLAG_BINDINGS.filter(b=>b.key==='${key}').length`),1);
    assert.equal(g.run(`QUEST_FLAG_BINDINGS.find(b=>b.key==='${key}').default`),false);
  }
  g.run('gallery_deeper_stair_seen=true;gallery_receiver_defeated=true;saveGame();gallery_deeper_stair_seen=false;gallery_receiver_defeated=false;');
  assert.equal(g.run('loadGame()'),true);
  assert.deepEqual(J(g,'[gallery_deeper_stair_seen,gallery_receiver_defeated,!!window.gallery_clue_stair]'),[true,true,false]);
});

test('real successful R0C3 to R0C4 crossing discovers the room synchronously, once',()=>{
  const g=fresh();g.run(`transitionToLocation({mapId:'SUNKEN_GALLERY_R0C3',x:14.5*TILE,y:7.5*TILE,facing:'right',state:{inSunkenGallery:true}});`);
  g.renderFrame();assert.equal(g.run('gallery_deeper_stair_seen'),false);
  assert.equal(g.run("tryEdgeTransition('east')"),true);
  assert.equal(g.run('mapIdForRef(activeMap)'),'SUNKEN_GALLERY_R0C4');
  assert.deepEqual(J(g,'[gallery_deeper_stair_seen,!!window.gallery_clue_stair]'),[true,false]);
  const before=flags(g);g.run("tryEdgeTransition('west');tryEdgeTransition('east');");assert.deepEqual(flags(g),before);
  assert.equal(g.run('combat.mode'),null);
});

test('validation, rendering, failed transition and development placement do not mark discovery',()=>{
  const g=fresh();g.run(`validatePlacement({mapId:'SUNKEN_GALLERY_R0C4',x:1.5*TILE,y:7.5*TILE,facing:'up'});
    transitionToLocation({mapId:'SUNKEN_GALLERY_R0C4',x:1.5*TILE,y:7.5*TILE,facing:'up',state:{inSunkenGallery:true}});`);
  assert.equal(g.run('mapIdForRef(activeMap)'),'SUNKEN_GALLERY_R0C4');
  g.renderFrame();assert.equal(g.run('gallery_deeper_stair_seen'),false);
  assert.equal(g.run("transitionToLocation({mapId:'unknown',x:0,y:0,facing:'up'})"),false);
  assert.equal(g.run('gallery_deeper_stair_seen'),false);
});

for(const [assigned,seen] of [[false,false],[false,true],[true,false]]) test('normal stair exit before armed: '+assigned+'/'+seen,()=>{
  const g=fresh();g.run(`reservoir_quest_started=${assigned};gallery_deeper_stair_seen=${seen};descendSunkenGallery();
    placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,2.5*TILE);ascendSunkenGallery();`);
  assert.equal(g.run('mapIdForRef(activeMap)'),'NORTH_BASIN_NW_MAP');assert.equal(g.run('galleryReceiverEncounter.isLocked()'),false);
});

test('armed automatic exit cannot bypass the warning; cancellation changes no gameplay values',()=>{
  const g=fresh();warning(g);const before=preserved(g);
  assert.deepEqual(J(g,'choice.options'),['Go to the stair.','Back away.']);
  g.press('ArrowDown');g.press('Enter');assert.equal(preserved(g),before);
  assert.equal(g.run('galleryReceiverEncounter.isLocked()'),false);assert.equal(g.run('combat.mode'),null);
  g.run('ascendSunkenGallery();');assert.equal(g.run('inSunkenGallery'),true);
  assert.equal(g.run('dialogue.open'),false,'can walk off the auto-trigger without another warning');
  g.run("placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,3.5*TILE);galleryReceiverEncounter.updateStairLatch();placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,2.5*TILE);ascendSunkenGallery();");
  assert.equal(g.run('dialogue.open'),true);
});

test('Escape cancels the warning choice and staging locks all ordinary operations',()=>{
  const g=fresh();warning(g);g.press('Escape');assert.equal(g.run('galleryReceiverEncounter.isLocked()'),false);
  g.run("placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,3.5*TILE);galleryReceiverEncounter.updateStairLatch();");
  warning(g);g.press('Enter');const before=preserved(g);
  for(const key of ['Escape','b','i','m','`','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'])g.press(key);
  g.run('toggleMenu();toggleDebugMenu();update(0.016);');
  assert.equal(g.run('canSaveHere()'),false);assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
  assert.equal(g.run("transitionToLocation({mapId:'MAP',x:7.5*TILE,y:9.5*TILE,facing:'up'})"),false);
  assert.equal(preserved(g),before);assert.equal(g.run('menu.open||debugMenu.open'),false);
});

test('three staging actors are safe, visible, separated and transient',()=>{
  const g=fresh();warning(g);g.press('Enter');const v=J(g,'galleryReceiverEncounter.getView()');
  assert.equal(v.actors.length,3);assert.deepEqual(v.actors.map(a=>[a.x,a.y]),[[112,112],[80,176],[144,176]]);
  for(const a of v.actors) {
    assert.equal(g.run(`validatePlacement({mapId:'SUNKEN_GALLERY_MAP',x:${a.x},y:${a.y},facing:'up'}).ok`),true);
    assert.ok(a.x>=16&&a.x<=496&&a.y>=32&&a.y<300);
    assert.notDeepEqual([a.x,a.y],J(g,'[player.x,player.y]'));
  }
  const before=preserved(g);g.renderFrame();assert.equal(preserved(g),before);
  assert.equal(g.run('gallery_receiver_defeated'),false);
});

for(const state of ["statusEffects=['unknown']", "stats.weapon={name:'Trollbane',type:'weapon',bonus:1,stunChance:1}",
  'stats.atk=Number.MAX_SAFE_INTEGER','combat.pendingVictory=true','combat.bombFuse=1',
  'GALLERY_RECEIVER_TEMPLATES[0].hp=-1','GALLERY_RECEIVER_TEMPLATES[1].spd=0.5',
  'GALLERY_RECEIVER_TEMPLATES[2].counterChance=0.1']) {
  test('unsupported entry rejects before HP, flags, identity or RNG changes: '+state,()=>{
    const g=fresh();warning(g);g.run(state);const before=preserved(g);g.press('Enter');
    assert.equal(preserved(g),before);assert.equal(g.run('galleryReceiverEncounter.isLocked()'),false);
    assert.equal(g.run('combat.mode'),null);assert.equal(g.run('combat.active'),false);
    assert.equal(g.run('galleryReceiverEncounter.getView()'),null);
  });
}

test('staging revalidates before allocation and safely restores the approach if entry became invalid',()=>{
  const g=fresh();warning(g);const origin=J(g,'[player.x,player.y,player.facing]');g.press('Enter');
  g.run('stats.atk=Number.MAX_SAFE_INTEGER;');const id=g.run('combatEnemyInstanceSequence');
  for(let i=0;i<4;i++)g.press('Enter');
  assert.equal(g.run('combatEnemyInstanceSequence'),id);assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),origin);
  assert.equal(g.run('galleryReceiverEncounter.isLocked()'),false);assert.equal(g.run('combat.mode'),null);
});

test('only the exact canonical owner may activate a formation; entry is once-only with ordinary commands',()=>{
  const g=fresh();g.run(`grantItem('Bullet Time');var inventoryBefore=JSON.stringify(stats.items);`);enter(g);
  assert.equal(g.run('JSON.stringify(stats.items)===inventoryBefore'),true);
  assert.deepEqual(view(g).availableActions,['attack','item','observe','run']);
  assert.deepEqual(J(g,'combat.enemies.map(e=>[e.id,e.slot,e.hp])'),[
    ['enemy_gallery_receiver',0,54],['enemy_gallery_caller',1,20],['enemy_gallery_keeper',2,32]]);
  assert.equal(new Set(J(g,'combat.enemies.map(e=>e.instanceId)')).size,3);
  const ids=J(g,'combat.enemies.map(e=>e.instanceId)');g.run('ENCOUNTER_HANDLERS.gallery_receiver();');
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.instanceId)'),ids);
  assert.throws(()=>g.run('combat.enemy'),/no singleton/);
  const other=fresh();other.run(`initializeFormationState([{enemyId:'enemy_marsh_wisp',slot:0},{enemyId:'enemy_marsh_wisp',slot:1}]);formationSessionController.begin();`);
  assert.throws(()=>other.run('combat.active=true'),/cannot activate/);
});

test('canonical render/input reuse the immutable session and one resolution per confirm',()=>{
  const g=fresh();enter(g);rng(g);g.run(`var resolutions=0,realResolve=resolveFormationRound;
    resolveFormationRound=a=>{resolutions++;return realResolve(a);};var drawnView=null;drawCombat=v=>{drawnView=v;};`);
  g.press('Enter');assert.equal(g.run('resolutions'),0);g.press('ArrowRight');const target=view(g).selectedTargetInstanceId;
  g.press('Enter');assert.equal(g.run('resolutions'),1);assert.equal(view(g).playbackFrame.player.hp,100);
  assert.equal(view(g).playbackFrame.currentEvent,null);g.renderFrame();assert.equal(g.run('Object.isFrozen(drawnView)'),true);
  assert.equal(g.run('drawnView.playbackFrame.player.hp'),100);
  assert.equal(g.run('combat.enemies.find(e=>e.instanceId==='+JSON.stringify(target)+').hp'),0);
  const state=J(g,'[stats.hp,combat.enemies.map(e=>e.hp)]'),rolls=g.run('receiverRolls');
  g.press('Escape');assert.equal(view(g).phase,'playback');
  while(view(g).phase==='playback')g.press('Enter');
  assert.equal(g.run('resolutions'),1);assert.deepEqual(J(g,'[stats.hp,combat.enemies.map(e=>e.hp)]'),state);
  assert.equal(g.run('receiverRolls'),rolls);g.press('Enter');assert.equal(view(g).phase,'awaiting_action');
  assert.equal(g.run('gallery_receiver_defeated'),false);g.press('Enter');
  for(let i=0;i<5;i++){assert.notEqual(view(g).selectedTargetInstanceId,target);g.press('ArrowRight');}
  g.press('Escape');assert.equal(view(g).phase,'awaiting_action');
});

test('victory/reveal finalize once, grant no reward, retain HP and allow exploration and exit',()=>{
  const g=fresh();enter(g);const xp=g.run('stats.xp'),gold=g.run('stats.gold'),items=J(g,'stats.items');
  g.run(`applyKillRewards=()=>{throw Error('no formation reward');};`);win(g);
  assert.equal(g.run('galleryReceiverEncounter.getView().collapsed'),true);
  assert.equal(g.run('combat.mode'),null);assert.equal(view(g),null);assert.equal(g.run('combat.active'),false);
  assert.equal(g.run('stats.xp'),xp);assert.equal(g.run('stats.gold'),gold);assert.deepEqual(J(g,'stats.items'),items);
  assert.match(g.run('dialogue.pages.flat().join(" ")'),/bronze bridle.*matching thorns.*guarding the way out/s);
  const hp=g.run('stats.hp');closeDialogue(g);assert.equal(g.run('galleryReceiverEncounter.isLocked()'),false);
  assert.equal(g.run('stats.hp'),hp);assert.equal(g.run('galleryReceiverEncounter.getView()'),null);
  g.run("placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,2.5*TILE);ascendSunkenGallery();");
  assert.equal(g.run('inSunkenGallery'),false);g.run("descendSunkenGallery();placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,2.5*TILE);ascendSunkenGallery();");
  assert.equal(g.run('inSunkenGallery'),false);assert.equal(g.run('dialogue.open'),false);
});

test('acknowledged defeat uses ordinary recovery, preserves seen flag and retries with fresh full members',()=>{
  const g=fresh();g.run('stats.hp=1;stats.gold=37;stats.atk=1;stats.spd=0;');enter(g);
  const day=g.run('day'),ids=J(g,'combat.enemies.map(e=>e.instanceId)');rng(g);round(g,1);
  assert.equal(g.run('gallery_receiver_defeated'),false);assert.equal(g.run('gallery_deeper_stair_seen'),true);
  assert.equal(g.run('mapIdForRef(activeMap)'),'HOUSE_INTERIOR_MAP');assert.equal(g.run('stats.gold'),0);
  assert.equal(g.run('stats.hp'),100);assert.equal(g.run('day'),day+1);assert.equal(view(g),null);
  assert.equal(g.run('galleryReceiverEncounter.isLocked()'),false);assert.equal(g.run('combat.enemies.length'),0);
  closeDialogue(g);g.run("Math.random=()=>{throw Error('retry initialization RNG');};");enter(g);
  assert.deepEqual(J(g,'combat.enemies.map(e=>e.hp)'),[54,20,32]);
  for(const id of J(g,'combat.enemies.map(e=>e.instanceId)'))assert.ok(!ids.includes(id));
});

test('post-resolution fault never refunds, retries or completes; reload last save is the recovery authority',()=>{
  const g=fresh();g.run('saveGame();');const saved=g.run("localStorage.getItem('verdantVale_save')");enter(g);rng(g);
  g.run(`var resolutions=0,realResolve=resolveFormationRound;
    resolveFormationRound=a=>{resolutions++;return realResolve(a);};
    createFormationRoundPlayback=()=>{throw Error('injected after authoritative damage');};`);
  g.press('Enter');g.press('ArrowRight');g.press('Enter');
  assert.equal(g.run('resolutions'),1);assert.equal(g.run('combat.enemies[1].hp'),0);
  assert.equal(g.run('galleryReceiverEncounter.getView().phase'),'fault');
  const before=preserved(g),rolls=g.run('receiverRolls');
  for(const key of ['Enter','Escape','`','ArrowRight'])g.press(key);
  g.renderFrame();assert.equal(preserved(g),before);assert.equal(g.run('receiverRolls'),rolls);
  assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
  assert.equal(g.run('gallery_receiver_defeated'),false);
  const reloaded=fresh();reloaded.run('localStorage.setItem("verdantVale_save",'+JSON.stringify(saved)+');');
  assert.equal(reloaded.run('loadGame()'),true);assert.equal(reloaded.run('stats.hp'),100);
  assert.equal(reloaded.run('combat.mode'),null);assert.equal(reloaded.run('galleryReceiverEncounter.isLocked()'),false);
  assert.equal(view(reloaded),null);assert.doesNotMatch(saved,/instanceId|playback|galleryReceiverEncounter|combat_enemy_/);
});

test('report cannot complete without victory, including supervisor and direct callback paths',()=>{
  const g=fresh();g.run(`sluice_job_started=sluice_fixed=sluice_reward_given=true;
    dispatch_quest_started=dispatch_delivered=dispatch_rewarded=true;fort_quest_started=true;
    fort_quest_stage=6;mq4_available_day=1;reservoir_quest_started=true;window.sunken_gallery_seen=true;MainQuest=3;`);
  const gold=g.run('stats.gold');g.run('reportBasinFindings();');closeDialogue(g);
  assert.equal(g.run('reservoir_report_filed'),false);assert.equal(g.run('MainQuest'),3);assert.equal(g.run('stats.gold'),gold);
  g.run('supervisorDialogueBody();');assert.match(g.run('dialogue.pages.flat().join(" ")'),/Finish investigating/);
  assert.equal(g.run('choice.open'),false);
});

for(const [clues,gold,item] of [[0,20,null],[1,75,null],[3,150,'Elixir'],[6,250,'Warp Stone']]) {
  test('post-victory report tier unchanged and exactly once: '+clues+' clues',()=>{
    const g=fresh();g.run(`gallery_receiver_defeated=true;MainQuest=3;stats.items=[];stats.gold=0;
      ['satchel','notebook','visitor','survey','silt','gauge','reliefs','stair'].forEach((s,i)=>window['gallery_clue_'+s]=i<${clues});reportBasinFindings();var rewardCallback=dialogue.callbacks[0];`);
    closeDialogue(g);g.run('rewardCallback();reportBasinFindings();');
    assert.equal(g.run('stats.gold'),gold);assert.equal(g.run('MainQuest'),4);assert.equal(g.run('reservoir_report_filed'),true);
    if(item)assert.equal(g.run('stats.items.filter(i=>i.name==='+JSON.stringify(item)+').length'),1);
  });
}

test('armed player Warp Stone cannot bypass the ambush; debug warp remains available',()=>{
  const g=fresh();g.run(`reservoir_quest_started=true;gallery_deeper_stair_seen=true;descendSunkenGallery();
    warpMenu.open=true;warpMenu.mode='list';warpMenu.playerMode=true;warpMenu.destinations=getPlayerWarpDestinations();warpMenu.cursor=0;`);
  const map=g.run('activeMap');g.press('Enter');assert.equal(g.run('activeMap'),map);assert.equal(g.run('warpMenu.open'),true);
  g.run('warpMenu.open=false;');assert.equal(g.run('debugWarpToDestination(getPlayerWarpDestinations()[0].id).success'),true);
});

test('only Lab and Receiver initialize formations; templates never enter a random pool',()=>{
  const g=fresh();assert.equal(g.run('FORMATION_STATE_TEMPLATE_IDS.length'),11);
  assert.equal(g.run('ENEMY_TEMPLATE_POOLS.some(p=>p.templates.some(e=>GALLERY_RECEIVER_TEMPLATES.includes(e)))'),false);
  for(const file of scriptOrderFromIndexHtml()) {
    const source=fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
    assert.equal((source.match(/\binitializeFormationState\(/g)||[]).length,
      ['combat.js','formation-lab.js','gallery-receiver.js'].includes(file)?1:0,file);
  }
  const source=fs.readFileSync(path.join(__dirname,'../../gallery-receiver.js'),'utf8');
  assert.doesNotMatch(source,/Math\.random|applyKillRewards\(|stats\.hp\s*=|\.xp\s*\+=|\.gold\s*\+=|formationCombatLab\.(start|runOperation|exit)/);
});

test('ordinary singleton victory hands off without duplicate rewards or altered residue rules',()=>{
  const g=fresh();g.run(`stats.level=MAX_LEVEL;var rewardCalls=0,realReward=applyKillRewards;
    applyKillRewards=(enemy,queue)=>{rewardCalls++;return realReward(enemy,queue);};
    placeAtLocation('MAP',7.5*TILE,9.5*TILE);Math.random=()=>0.5;startCombat();combat.flashTimer=0;`);
  g.press('Enter');while(g.run("combat.phase==='message'"))g.press('Enter');
  assert.equal(g.run('combat.phase'),'victory');g.press('Enter');
  assert.equal(g.run('rewardCalls'),1);const rewards=J(g,'[stats.xp,stats.gold]');
  g.run("Math.random=()=>{throw Error('entry RNG');};");enter(g);
  assert.equal(g.run('rewardCalls'),1);assert.deepEqual(J(g,'[stats.xp,stats.gold]'),rewards);
});

test('real ordinary escape is prepared, but forged or still-pending escape work rejects unchanged',()=>{
  const g=fresh();g.run(`Math.random=()=>0.5;startCombat();combat.flashTimer=0;
    stats.spd=100;combat.cursor=combatOptions().indexOf('run');Math.random=()=>0;`);
  g.press('Enter');assert.throws(()=>g.run('prepareFormationEntry()'),/Unsupported formation entry/);
  g.press('Enter');assert.equal(g.run('combat.active'),false);assert.equal(g.run('combat.pendingEscape'),true);
  g.run("Math.random=()=>{throw Error('entry RNG');};");enter(g);assert.equal(g.run('combat.pendingEscape'),false);
  const forged=fresh();forged.run('combat.phase="message";combat.message="Got away safely!";combat.pendingEscape=true;');
  assert.throws(()=>forged.run('prepareFormationEntry()'),/Unsupported formation entry/);
});

test('real ordinary defeat hands off only after home-recovery dialogue is acknowledged',()=>{
  const g=fresh();g.run(`Math.random=()=>0.5;startCombat();combat.flashTimer=0;stats.hp=1;stats.atk=1;stats.spd=0;`);
  g.press('Enter');while(g.run("combat.phase==='message'"))g.press('Enter');
  assert.equal(g.run('combat.phase'),'defeat');g.press('Enter');
  assert.throws(()=>g.run('prepareFormationEntry()'),/Unsupported formation entry/);
  closeDialogue(g);g.run("Math.random=()=>{throw Error('entry RNG');};");enter(g);
  assert.equal(g.run('combat.pendingDefeat'),false);
});

test('entrance to deeper room and back uses connected walkable tiles and real successful arrivals',()=>{
  const g=fresh();g.run(`descendSunkenGallery();
    function walkGalleryRoute(goal) {
      const first={map:mapIdForRef(activeMap),col:Math.floor(player.x/TILE),row:Math.floor(player.y/TILE),prior:null};
      const queue=[first],seen=new Set([first.map+':'+first.col+':'+first.row]);let end=null;
      for(let i=0;i<queue.length;i++) {
        const node=queue[i];if(node.map===goal){end=node;break;}
        for(const [dir,dx,dy] of [['west',-1,0],['east',1,0],['north',0,-1],['south',0,1]]) {
          let col=node.col+dx,row=node.row+dy,map=node.map,cross=null;
          if(col<0||col>=COLS||row<0||row>=ROWS) {
            const along=dx?node.row:node.col;
            const seg=(EDGE_TRANSITIONS[map]?.[dir]||[]).find(s=>along>=s.sourceRange[0]&&along<=s.sourceRange[1]);
            if(!seg)continue;const landing=edgeTransitionLanding(seg,along);if(!landing)continue;
            map=typeof seg.targetMap==='string'?seg.targetMap:mapIdForRef(seg.targetMap);
            col=landing.col;row=landing.row;cross=dir;
          }
          if(!map.startsWith('SUNKEN_GALLERY')||!WALKABLE[mapRefForId(map)[row][col]])continue;
          const key=map+':'+col+':'+row;if(seen.has(key))continue;seen.add(key);
          queue.push({map,col,row,prior:node,cross});
        }
      }
      if(!end)throw Error('Gallery route missing: '+goal);
      const route=[];for(let n=end;n.prior;n=n.prior)route.unshift(n);
      for(const node of route) {
        if(node.cross){if(!tryEdgeTransition(node.cross))throw Error('Actual seam rejected');}
        else placeAtLocation(node.map,(node.col+0.5)*TILE,(node.row+0.5)*TILE);
      }
      return route.length;
    }
    var outwardSteps=walkGalleryRoute('SUNKEN_GALLERY_R0C4'),returnSteps=walkGalleryRoute('SUNKEN_GALLERY_MAP');`);
  assert.ok(g.run('outwardSteps')>0);assert.ok(g.run('returnSteps')>0);
  assert.equal(g.run('gallery_deeper_stair_seen'),true);assert.equal(g.run('!!window.gallery_clue_stair'),false);
  assert.equal(g.run('combat.mode'),null);
  g.run("placeAtLocation('SUNKEN_GALLERY_MAP',2.5*TILE,2.5*TILE);ascendSunkenGallery();");
  assert.equal(g.run('inSunkenGallery'),false,'pre-assignment route remains freely escapable');
});

for(const level of [4,5]) test('provisional L'+level+' ordinary gear wins without critical luck, items or exceptional equipment',()=>{
  const remaining=[];
  for(const order of [[1,2,0],[0,2,1]]) {
    const g=fresh();g.run(`stats.level=${level};stats.maxHp=${20+level*10};stats.hp=${15+level*10};
      stats.atk=${6+level*2};stats.def=${level*2};stats.spd=${7+Math.floor(level/2)};
      stats.weapon=createItem('Steel Sword');stats.armor=createItem('Leather Armor');`);
    enter(g);g.run(`Math.random=()=>{receiverRolls++;return 0.5;};`);
    for(let i=0;g.run('combat.active');i++) {
      assert.ok(i<25);const slot=g.run(JSON.stringify(order)+'.find(s=>combat.enemies[s].hp>0)');
      round(g,slot);
    }
    assert.equal(g.run('gallery_receiver_defeated'),true);remaining.push(g.run('stats.hp'));
  }
  assert.ok(remaining[0]>remaining[1],'Caller first avoids sustained extra damage');
});

test('canonical ownership clears through the shared collection cleanup; Lab remains inactive',()=>{
  const g=fresh();enter(g);g.run('endCombat();');
  assert.equal(g.run('galleryReceiverEncounter.isLocked()'),false);assert.equal(view(g),null);
  assert.equal(g.run('galleryReceiverEncounter.getView()'),null);assert.equal(g.run('gallery_receiver_defeated'),false);
  g.run('resetLocationState();placeAtLocation("MAP",7.5*TILE,9.5*TILE);');
  g.press('`');for(let i=0;i<11;i++)g.press('ArrowDown');g.press('Enter');g.press('Enter');
  assert.equal(g.run('formationCombatLab.isActive()'),true);assert.equal(g.run('combat.active'),false);
  g.press('Escape');assert.equal(g.run('formationCombatLab.isActive()'),false);
});

test('shared cleanup also clears interrupted staging actors and the queued encounter',()=>{
  const g=fresh();warning(g);const origin=J(g,'[player.x,player.y,player.facing]');g.press('Enter');
  g.run('endCombat();');assert.equal(g.run('galleryReceiverEncounter.isLocked()'),false);
  assert.equal(g.run('dialogue.triggerEncounterId'),null);assert.equal(g.run('dialogue.open'),false);
  assert.equal(g.run('galleryReceiverEncounter.getView()'),null);assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),origin);
  assert.equal(g.run('gallery_receiver_defeated'),false);
});

test('map silhouettes stay on walkable floor, inside the canvas and clear of one another',()=>{
  const g=fresh();warning(g);g.press('Enter');
  require('./149-formation-battle-rendering.test').record(g);
  const actors=J(g,'galleryReceiverEncounter.getView().actors'),boxes=[];
  for(const actor of actors) {
    g.run(`paint=[];drawGalleryCreature('${actor.kind}',${actor.x},${actor.y});`);
    const calls=J(g,'paint');
    // Recording-canvas transform-aware bounds, not a second sprite model.
    const bounds=calls.filter(c=>c.bounds).map(c=>c.bounds);
    assert.ok(bounds.length>0);
    const box=[Math.min(...bounds.map(b=>b[0])),Math.min(...bounds.map(b=>b[1])),
      Math.max(...bounds.map(b=>b[2])),Math.max(...bounds.map(b=>b[3]))];
    assert.ok(box[0]>=0&&box[1]>=0&&box[2]<=512&&box[3]<300);boxes.push(box);
    for(let y=Math.floor(box[1]/32);y<=Math.floor((box[3]-0.001)/32);y++)
      for(let x=Math.floor(box[0]/32);x<=Math.floor((box[2]-0.001)/32);x++)
        assert.equal(g.run('!!WALKABLE[SUNKEN_GALLERY_MAP['+y+']['+x+']]'),true);
  }
  for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++)
    assert.ok(boxes[a][2]<=boxes[b][0]||boxes[b][2]<=boxes[a][0]||boxes[a][3]<=boxes[b][1]||boxes[b][3]<=boxes[a][1]);
});

module.exports={name:'Receiver vertical slice: arrival, mandatory report, staging, canonical formation, victory and home retry',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' Receiver encounter checks passed');}};
