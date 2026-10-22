'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run}),J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(){const g=createContext();g.run("dialogue.open=false;dialogue.callbacks=null;choice.open=false;Math=Object.create(Math);var ambushRolls=0;Math.random=()=>{ambushRolls++;throw Error('unexpected RNG')}");return g;}
function recruit(g,real=false){
  g.run("storyCheckpointLab.apply('mq5_assignment_ready');dialogue.open=false");
  if(!real){g.run('completeMq5Assignment();dialogue.open=false');return;}
  g.run('supervisorDialogueBody();finishDialogue()');let guard=0;
  while(g.run("mq5AssignmentCutscene.getView().phase==='walking'")){g.frames(1);assert.ok(guard++<500);}
  g.run('finishDialogue();dialogue.open=false');
}
function place(g,gold=1000){g.run(`stats.gold=${gold};placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',9.5*TILE,7.5*TILE);
  travellersRiseAmbush.tryTrigger();placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',10.5*TILE,7.5*TILE);`);}
function reachChoice(g){
  g.frames(1);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'opening');g.run('finishDialogue()');
  let guard=0;while(g.run("travellersRiseAmbush.getView().phase==='walking'")){g.frames(1);assert.ok(guard++<1000);}
  assert.equal(g.run('travellersRiseAmbush.getView().phase'),'reveal');g.run('finishDialogue()');
  assert.equal(g.run('choice.open'),true);
}
function choose(g,index){g.run(`choice.cursor=${index};choice.open=false;choice.callbacks[${index}]()`);if(g.run('dialogue.open'))g.run('finishDialogue()');}
const view=g=>J(g,'canonicalPartyCombat.getView()'),input=(g,c)=>g.run('partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),QUICKBLOOM_ANIMATION_FRAMES*MS_PER_FRAME/1000);canonicalPartyCombat.handleInput('+JSON.stringify(c)+')');
function acknowledge(g){let guard=0;while(view(g).phase==='playback'){input(g,'confirm');assert.ok(guard++<500);}if(view(g).phase==='playback_complete')input(g,'confirm');}
function escape(g){g.run('Math.random=()=>{ambushRolls++;return 0}');while(view(g).phase==='awaiting_action'){
  let guard=0;while(view(g).selectedCommand!=='run'){input(g,'right');assert.ok(guard++<8);}input(g,'confirm');}
  input(g,'confirm');acknowledge(g);assert.equal(view(g).phase,'escape');input(g,'confirm');}
function victory(g){g.run('Math.random=()=>{ambushRolls++;return .5}');let rounds=0;
  while(!['victory','defeat','escape'].includes(view(g).phase)){
    while(view(g).phase==='awaiting_action'){input(g,'confirm');if(view(g).phase==='targeting')input(g,'confirm');}
    if(view(g).phase==='ready')input(g,'confirm');acknowledge(g);assert.ok(rounds++<6);
  }
  assert.equal(view(g).phase,'victory');input(g,'confirm');return J(g,'canonicalPartyCombat.getReceipt()');
}

test('story gate requires assigned MQ5, canonical Esla membership and the deliberate Rise tile',()=>{
  const g=fresh();place(g);g.frames(2);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');
  g.run('MainQuest=5;syncQuestFlagsToWindow()');g.frames(2);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');
  g.run("persistentParty.joinEsla({level:11});placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',9.5*TILE,7.5*TILE)");g.frames(2);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');
  g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',10.5*TILE,7.5*TILE)");g.frames(1);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'opening');assert.equal(g.run('ambushRolls'),0);
});

test('walkable off-road routes cannot bypass the unresolved ambush on the way to Mornay',()=>{
  const g=fresh();recruit(g);
  // Search the entire registered regional tile graph, not only the authored
  // road. Remove the trigger to prove the natural choke, without relying on the exit guard.
  g.run(`function ambushReachability(gated,removeTrigger=true){
    const start={id:'EASTERN_BANK_MAP',c:5,r:8},queue=[start],seen=new Set();
    const key=n=>n.id+':'+n.c+':'+n.r;
    seen.add(key(start));let local=0,reeds=0;
    for(let head=0;head<queue.length;head++){
      const n=queue[head],map=mapRefForId(n.id);
      if(n.id==='EASTERN_FENS_TRAVELLERS_RISE_MAP'){local++;if(map[n.r][n.c]===DEEP_REEDS)reeds++;}
      const push=v=>{const grid=mapRefForId(v.id);
        if(!grid||!isTileWalkable(grid[v.r]?.[v.c])||
          removeTrigger&&v.id==='EASTERN_FENS_TRAVELLERS_RISE_MAP'&&v.c===10&&v.r===7||seen.has(key(v)))return;
        seen.add(key(v));queue.push(v);
      };
      for(const [dc,dr]of [[1,0],[-1,0],[0,1],[0,-1]]){
        const c=n.c+dc,r=n.r+dr;
        if(c>=0&&c<COLS&&r>=0&&r<ROWS)push({id:n.id,c,r});
      }
      for(const [direction,at,index]of [['west',n.c===0,n.r],['east',n.c===COLS-1,n.r],
        ['north',n.r===0,n.c],['south',n.r===ROWS-1,n.c]]){
        if(!at||gated&&travellersRiseAmbush.blocksExit(n.id,direction))continue;
        for(const edge of EDGE_TRANSITIONS[n.id]?.[direction]||[]){
          if(index<edge.sourceRange[0]||index>edge.sourceRange[1])continue;
          push({id:edge.targetMap,c:edge.targetEdge==='west'?0:edge.targetEdge==='east'?COLS-1:n.c,
            r:edge.targetEdge==='north'?0:edge.targetEdge==='south'?ROWS-1:n.r});
        }
      }
    }
    return {maps:[...new Set(queue.map(n=>n.id))],local,reeds};
  }`);
  const old=J(g,'ambushReachability(false)'),guarded=J(g,'ambushReachability(true)');
  assert.ok(!old.maps.includes('EASTERN_FENS_WIDE_WATER_MAP'),'the natural choke alone prevents bypass');
  assert.ok(guarded.local>100&&guarded.reeds>0,'local exploration and Deep Reeds remain accessible');
  for(const id of ['EASTERN_FENS_WIDE_WATER_MAP','EASTERN_FENS_MORNAY_THRESHOLD_MAP',
    'EASTERN_FENS_MORNAY_APPROACH_E_MAP'])assert.ok(!guarded.maps.includes(id),id+' cannot be reached unresolved');
  // Exercise actual input in both presentation modes, at every eastward seam
  // cell. Loading/placement itself never starts a scene or blocks retreat.
  for(const continuous of [false,true])for(const row of [7,8,9]){
    g.run(`forceLegacyRegionalView=${!continuous};
      placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',15.5*TILE,${row+.5}*TILE);
      travellersRiseAmbush.resetTransient();`);
    g.frames(1);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');
    const before=J(g,'regionalWorldPosition()');g.run("pressedKeys.ArrowRight=true");g.frames(40);g.run("pressedKeys.ArrowRight=false");
    assert.deepEqual(J(g,'regionalWorldPosition()'),before);
    assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');
    g.run("pressedKeys.ArrowLeft=true");g.frames(5);g.run("pressedKeys.ArrowLeft=false");
    assert.ok(g.run('player.x')<15.5*32,'retreat remains available');
  }
  g.run('travellers_rise_ambush_complete=true');
  assert.ok(!J(g,'ambushReachability(true,false)').maps.includes('EASTERN_FENS_MORNAY_THRESHOLD_MAP'),'night remains mandatory');
  g.run('travellers_rise_camp_stage=2'); // isolated future-night gate fixture
  assert.ok(J(g,'ambushReachability(true,false)').maps.includes('EASTERN_FENS_MORNAY_THRESHOLD_MAP'));
  assert.equal(g.run('ambushRolls'),0);
});

test('loading directly on the trigger never starts the event until the player leaves and deliberately re-enters',()=>{
  const g=fresh();recruit(g);place(g);assert.equal(g.run('saveGame()'),true);g.run('travellersRiseAmbush.resetTransient()');g.frames(2);
  assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',9.5*TILE,7.5*TILE)");g.frames(1);g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',10.5*TILE,7.5*TILE)");g.frames(1);
  assert.equal(g.run('travellersRiseAmbush.getView().phase'),'opening');
});

test('real checkpoint, Supervisor assignment and staged walking reveal the fixed formation without RNG',()=>{
  const g=fresh();recruit(g,true);place(g);g.frames(1);
  assert.deepEqual(J(g,'dialogue.pageSpeakers'),['road_impostor','esla','road_impostor','fen_handler']);
  const homes=J(g,'travellersRiseAmbush.getView().actors.map(a=>[a.x,a.y])');g.run('finishDialogue()');
  const paths=[homes];let guard=0;while(g.run("travellersRiseAmbush.getView().phase==='walking'")){
    g.frames(1);paths.push(J(g,'travellersRiseAmbush.getView().actors.map(a=>[a.x,a.y])'));assert.ok(guard++<1000);
  }
  assert.ok(paths.some(frame=>frame.some((p,i)=>p[0]!==homes[i][0]||p[1]!==homes[i][1])));
  for(let f=1;f<paths.length;f++)for(let i=0;i<3;i++){
    const dx=Math.abs(paths[f][i][0]-paths[f-1][i][0]),dy=Math.abs(paths[f][i][1]-paths[f-1][i][1]);
    assert.ok((dx===0||dy===0)&&dx+dy<=1.5);
  }
  assert.deepEqual(paths.at(-1),[[272,240],[336,176],[400,240]]);assert.equal(g.run('travellersRiseAmbush.getView().revealed'),true);
  for(const actor of paths.at(-1))for(const x of [10*32+7,11*32-7])for(const y of [7*32+7,8*32-7])
    assert.ok(Math.abs(actor[0]-x)>=18||Math.abs(actor[1]-y)>=18,'staged actor never overlaps a legal trigger-tile player position');
  g.run('finishDialogue()');choose(g,0);assert.deepEqual(view(g).enemies.map(e=>e.id),
    ['enemy_road_impostor','enemy_bridled_hollow','enemy_fen_handler']);assert.deepEqual(view(g).enemies.map(e=>e.slot),[0,1,2]);
  assert.equal(new Set(view(g).enemies.map(e=>e.instanceId)).size,3);
  assert.deepEqual(view(g).commands,['attack','item','observe','run']);input(g,'confirm');input(g,'confirm');
  assert.deepEqual(view(g).commands,['attack','resonance','item','run']);assert.equal(g.run('ambushRolls'),0);
});

test('templates are capability-driven, independently prepared and balanced below healthy-member one-hit thresholds',()=>{
  const g=fresh(),ids=['enemy_road_impostor','enemy_bridled_hollow','enemy_fen_handler'];
  assert.deepEqual(J(g,'canonicalPartyCombat.prepareEnemySide('+JSON.stringify(ids)+').ids'),ids);
  for(const id of ids){assert.equal(g.run(`canonicalEnemyIsCompatible(ENEMY_TEMPLATE_REGISTRY.${id})`),true,id);
    assert.ok(J(g,`enemyCapabilityMetadata(ENEMY_TEMPLATE_REGISTRY.${id}).capabilities`).includes('travellers_rise_ambush_lifecycle'));}
  assert.deepEqual(J(g,'canonicalEnemyMechanicProfile(BRIDLED_HOLLOW_TEMPLATE).brace'),{chance:.2});
  assert.equal(g.run("canonicalEnemyMechanicProfile(ROAD_IMPOSTOR_TEMPLATE).brace"),undefined);
  assert.equal(g.run("canonicalEnemyMechanicProfile(FEN_HANDLER_TEMPLATE).brace"),undefined);
  recruit(g);const members=J(g,'persistentParty.getFieldView().members');for(const enemy of J(g,'[ROAD_IMPOSTOR_TEMPLATE,BRIDLED_HOLLOW_TEMPLATE,FEN_HANDLER_TEMPLATE]'))
    for(const member of members){const worst=g.run(`attackDamageNumbers(${enemy.atk},playerIncomingMitigation(${enemy.atk},${member.effective.def},false),1.2,true).dmg`);
      assert.ok(worst<member.maxHp,enemy.id+' versus '+member.characterId);}
  assert.deepEqual(J(g,'[ROAD_IMPOSTOR_TEMPLATE.hp,BRIDLED_HOLLOW_TEMPLATE.hp,FEN_HANDLER_TEMPLATE.hp]'),[58,120,62]);
});

test('refusal loses no gold; Handler defeat cannot alter the exact Hollow instance or Brace profile',()=>{
  const g=fresh();recruit(g);place(g,222);reachChoice(g);choose(g,0);assert.equal(g.run('stats.gold'),222);
  const before=J(g,'canonicalPartyCombat.getView().enemies[1]');
  assert.equal(g.run("canonicalEnemyMechanicProfile(FEN_HANDLER_TEMPLATE).brace"),undefined);
  assert.deepEqual(J(g,'canonicalPartyCombat.getView().enemies[1]'),before);
  assert.deepEqual(J(g,'canonicalEnemyMechanicProfile(BRIDLED_HOLLOW_TEMPLATE).brace'),{chance:.2});
});

test('payment clamps to available gold, installs atomically and records one persistent receipt',()=>{
  for(const [gold,amount]of [[250,100],[37,37],[0,0]]){const g=fresh();recruit(g);place(g,gold);reachChoice(g);choose(g,1);
    assert.equal(g.run('stats.gold'),gold-amount);assert.deepEqual(J(g,'[travellers_rise_ambush_paid,travellers_rise_ambush_payment]'),[true,amount]);
    assert.equal(g.run('canonicalPartyCombat.isActive()'),true);}
});

test('predictable activation rejection charges nothing and leaves no battle or completion',()=>{
  const g=fresh();recruit(g);place(g,91);reachChoice(g);g.run('MainQuest=4;choice.open=false;choice.callbacks[1]();finishDialogue()');
  assert.deepEqual(J(g,'[stats.gold,travellers_rise_ambush_paid,travellers_rise_ambush_payment,travellers_rise_ambush_complete]'),[91,false,0,false]);
  assert.equal(g.run('canonicalPartyCombat.isActive()'),false);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'fault');
});

test('escape retains payment, permits a no-demand retry and survives save/load',()=>{
  const g=fresh();recruit(g);place(g,150);reachChoice(g);choose(g,1);escape(g);
  assert.deepEqual(J(g,'[travellersRiseAmbush.getView().phase,travellers_rise_ambush_complete,stats.gold,travellers_rise_ambush_payment]'),['idle',false,50,100]);
  assert.equal(g.run('saveGame()'),true);g.run('travellers_rise_ambush_paid=false;travellers_rise_ambush_payment=0;stats.gold=999');assert.equal(g.run('loadGame()'),true);
  assert.deepEqual(J(g,'[travellers_rise_ambush_paid,travellers_rise_ambush_payment,stats.gold]'),[true,100,50]);
  g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',9.5*TILE,7.5*TILE)");g.frames(1);g.run("placeAtLocation('EASTERN_FENS_TRAVELLERS_RISE_MAP',10.5*TILE,7.5*TILE)");g.frames(1);g.run('finishDialogue()');let guard=0;
  while(g.run("travellersRiseAmbush.getView().phase==='walking'")){g.frames(1);assert.ok(guard++<1000);}g.run('finishDialogue()');
  assert.equal(g.run('choice.open'),false);assert.equal(g.run('canonicalPartyCombat.isActive()'),true);assert.equal(g.run('stats.gold'),50);
});

test('defeat recovers once, retains the event and permits a fresh-identity retry',()=>{
  const g=fresh();recruit(g);place(g);g.run(`saveGame();var s=JSON.parse(localStorage.getItem('verdantVale_save'));
    s.stats.hp=1;s.party.characters[0].hp=0;localStorage.setItem('verdantVale_save',JSON.stringify(s));loadGame();dialogue.open=false;`);
  place(g);reachChoice(g);choose(g,0);const first=view(g).enemies.map(e=>e.instanceId);g.run('Math.random=()=>{ambushRolls++;return .5}');
  input(g,'confirm');input(g,'confirm');input(g,'confirm');acknowledge(g);assert.equal(view(g).phase,'defeat');input(g,'confirm');
  assert.equal(g.run('travellers_rise_ambush_complete'),false);assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');
  g.run('dialogue.open=false;dialogue.callbacks=null');place(g);g.frames(1);g.run('finishDialogue()');let guard=0;while(g.run("travellersRiseAmbush.getView().phase==='walking'")){g.frames(1);assert.ok(guard++<1000);}g.run('finishDialogue()');choose(g,0);
  assert.ok(view(g).enemies.every(e=>!first.includes(e.instanceId)));
});

test('victory completes and rewards once, removes actors and advances only the camp handoff objective',()=>{
  const g=fresh();recruit(g);g.run('stats.atk=10000');place(g);const day=g.run('day');reachChoice(g);choose(g,0);const receipt=victory(g);
  assert.equal(receipt.rewards.xp,215);assert.equal(receipt.rewards.gold,31);assert.deepEqual(receipt.rewards.items,[]);
  assert.equal(g.run('travellers_rise_ambush_complete'),true);assert.equal(g.run('day'),day);
  if(g.run('dialogue.open'))g.run('finishDialogue()'); // reward pages precede the camp introduction
  g.frames(1);assert.deepEqual(J(g,'dialogue.pageSpeakers'),['esla','lely','esla']);g.run('dialogue.page=0');
  assert.deepEqual(J(g,'dialoguePagePresentation()'),{name:'Esla',styleId:'esla_light_green',speakerId:'esla'});
  assert.equal(J(g,'getActiveQuestNotes()').find(n=>n.title==='Sealed Report').body,
    'Inspect the ambushers’ campsite at Travellers’ Rise.');
  assert.equal(g.run("typeof window.travellers_rise_camp_started"),'undefined');assert.equal(g.run('canonicalPartyCombat.finish()'),false);
  g.run('finishDialogue()');g.frames(300);assert.equal(g.run('travellersRiseCamp.getView().phase'),'inside_dialogue');g.run('finishDialogue()');
  assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');assert.equal(g.run('dialogue.open'),false);
});

test('save refusal, completion reload and story-checkpoint reset keep receipts and transients coherent',()=>{
  const g=fresh();recruit(g);place(g);reachChoice(g);choose(g,0);assert.equal(g.run('saveGame()'),false);escape(g);
  assert.equal(g.run('saveGame()'),true);const valid=g.run("localStorage.getItem('verdantVale_save')");
  g.run(`var broken=JSON.parse(localStorage.getItem('verdantVale_save'));broken.travellers_rise_ambush_paid=false;
    broken.travellers_rise_ambush_payment=50;localStorage.setItem('verdantVale_save',JSON.stringify(broken));stats.gold=777`);
  assert.equal(g.run('loadGame()'),false);assert.equal(g.run('stats.gold'),777);g.run(`localStorage.setItem('verdantVale_save',${JSON.stringify(valid)})`);
  g.run('travellers_rise_ambush_complete=true;syncQuestFlagsToWindow()');assert.equal(g.run('saveGame()'),true);
  g.run('travellers_rise_ambush_complete=false;syncQuestFlagsToWindow()');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('travellers_rise_ambush_complete'),true);
  g.run("storyCheckpointLab.apply('mq5_assignment_ready')");assert.deepEqual(J(g,'[travellers_rise_ambush_complete,travellers_rise_ambush_paid,travellers_rise_ambush_payment,travellersRiseAmbush.getView().phase]'),[false,false,0,'idle']);
});

test('new enemies remain scripted-only and production pools contain none of them',()=>{
  const g=fresh(),ids=['enemy_road_impostor','enemy_bridled_hollow','enemy_fen_handler'];
  assert.equal(g.run(`ENEMY_TEMPLATE_POOLS.some(p=>p.templates.some(t=>${JSON.stringify(ids)}.includes(t.id)))`),false);
  assert.equal(g.run("MAP_CATALOG.EASTERN_FENS_TRAVELLERS_RISE_MAP.allowRandomEncounters"),false);
  const source=fs.readFileSync(path.join(__dirname,'../../enemy-capabilities.js'),'utf8');
  assert.doesNotMatch(source,/BRIDLED_HOLLOW_TEMPLATE_IDS|ROAD_IMPOSTOR_TEMPLATE_IDS|partyCompatible/);
});

test('enemy-side formation preparation is immutable and independent of one-, two-, or three-member player preparation',()=>{
  const ids=['enemy_road_impostor','enemy_bridled_hollow','enemy_fen_handler'];
  for(const count of [1,2]){const g=fresh();if(count===2)g.run('persistentParty.joinEsla({level:11})');
    assert.equal(J(g,"canonicalPartyCombat.preparePlayerSide({escape:'fastest_living'})").members.length,count);
    assert.deepEqual(J(g,'canonicalPartyCombat.prepareEnemySide('+JSON.stringify(ids)+').ids'),ids);assert.equal(g.run('ambushRolls'),0);}
  const read=fs.readFileSync;try{fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);if(String(file).endsWith('/persistent-party.js'))
    s=s.replace('  lely:Object.freeze',"  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture third',rareBorn:false,affinity:null,progression:Object.freeze({hpBase:30,hpPerLevel:5,atkBase:6,atkPerLevel:1,defBase:2,defEveryLevels:2,spdBase:6,spdEveryLevels:2})}),\n  lely:Object.freeze");return s;};
    const g=fresh();g.run(`persistentParty.joinEsla({level:11});saveGame();var s=JSON.parse(localStorage.getItem('verdantVale_save'));
      s.party.order.push('fixture_third');s.party.characters.push({...s.party.characters[0],characterId:'fixture_third'});
      localStorage.setItem('verdantVale_save',JSON.stringify(s));loadGame();dialogue.open=false;`);
    assert.equal(J(g,"canonicalPartyCombat.preparePlayerSide({escape:'fastest_living'})").members.length,3);
    assert.deepEqual(J(g,'canonicalPartyCombat.prepareEnemySide('+JSON.stringify(ids)+').ids'),ids);
  }finally{fs.readFileSync=read;}
});

module.exports={name:"MQ5 Travellers' Rise ambush: staged formation, payment receipts, retries and authenticated victory",run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Travellers\' Rise ambush checks passed');}};
