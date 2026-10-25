'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const ID='EASTERN_FENS_TRAVELLERS_RISE_MAP';
function close(g){for(let n=0;g.run('dialogue.open');n++){assert.ok(n<80);g.renderFrame();g.press('Enter');}}
function fresh(legacy=false){const g=createContext();g.run(`storyCheckpointLab.apply('mq5_assignment_ready');
 dialogue.open=false;completeMq5Assignment();dialogue.open=false;forceLegacyRegionalView=${legacy};
 Math=Object.create(Math);Math.random=()=>.5;stats.gold=200;`);return g;}
function trigger(g){
 g.run(`placeAtLocation('${ID}',9.5*TILE,7.5*TILE);travellersRiseAmbush.resetTransient()`);g.frames(1);
 g.hold('ArrowRight');for(let n=0;g.run("travellersRiseAmbush.getView().phase==='idle'");n++){assert.ok(n<40);g.frames(1);}g.release('ArrowRight');
 assert.equal(g.run('dialogue.open'),true);close(g);
 for(let n=0;g.run("travellersRiseAmbush.getView().phase==='walking'");n++){assert.ok(n<400);g.frames(1);}
 assert.match(g.run('dialogue.pages.flat().join(" ")'),/not handing over anything/);
 assert.match(g.run('dialogue.pages.flat().join(" ")'),/off your bodies/);
 assert.equal(g.run('dialogue.pageSpeakers[4]'),'esla');
 close(g);assert.equal(g.run('choice.open'),false);assert.equal(g.run('canonicalPartyCombat.isActive()'),true);
}
function battleConfirm(g){g.run('partyBattleQuickbloomAnimation.update(canonicalPartyCombat.getView(),1)');g.press('Enter');}
function win(g){for(let n=0;g.run('canonicalPartyCombat.isActive()');n++){assert.ok(n<500);battleConfirm(g);}}
function fort(){const g=createContext();g.run(`dialogue.open=false;sluice_job_started=true;sluice_fixed=true;sluice_reward_given=true;
 dispatch_quest_started=true;dispatch_delivered=true;dispatch_rewarded=true;MainQuest=2;fort_quest_started=true;enterSmugglerFort();
 placeAtLocation('SMUGGLER_FORT_MAP',7.5*TILE,4.5*TILE)`);return g;}
function leave(g){g.press('Enter');close(g);assert.equal(g.run('choice.open'),true);g.press('ArrowDown');g.press('Enter');close(g);assert.equal(g.run('fort_quest_stage'),5);}

test('spared guard stays present and normal input can reconsider until the Supervisor report',()=>{
 const g=fort();leave(g);assert.equal(g.run("NPC_REGISTRY.fort_guard.map"),'smuggler_fort');
 g.press('Enter');close(g);assert.deepEqual(J(g,'choice.options'),['Make an arrest','Leave them be']);
 g.press('Enter');close(g);assert.equal(g.run('combat.isFortGuard&&combat.active'),true);assert.equal(g.run('fort_quest_stage'),1);
 // Resolve the established denial route on a fresh spared state; reporting is final.
 const h=fort();leave(h);assert.equal(h.run('saveGame()'),true);h.run('fort_quest_stage=0');assert.equal(h.run('loadGame()'),true);
 assert.equal(h.run("NPC_REGISTRY.fort_guard.map"),'smuggler_fort');
 h.run('supervisorDialogueBody()');close(h);assert.equal(h.run('choice.open'),true);h.press('ArrowDown');h.press('Enter');close(h);
 assert.equal(h.run('fort_quest_stage'),6);assert.equal(h.run('fort_pay_ticket_reduced'),true);
 h.run("placeAtLocation('SMUGGLER_FORT_MAP',7.5*TILE,4.5*TILE)");h.press('Enter');close(h);
 assert.equal(h.run('choice.open||combat.active'),false);assert.equal(h.run('fort_quest_stage'),6);
});

test('every projected road actor responds to ordinary input in both regional presentations without staging from arbitrary positions',()=>{
 for(const legacy of [false,true])for(const [col,row,name]of [[8.5,5.25,'Highwayman'],[10.5,4.25,''],[14.5,5.25,'Fen Handler']]){
  const g=fresh(legacy);g.run(`placeAtLocation('${ID}',${col}*TILE,${row}*TILE)`);const position=J(g,'regionalWorldPosition()');
  g.press(' ');assert.equal(g.run('dialogue.open'),true);assert.equal(g.run('dialoguePagePresentation().name'),name);
  assert.doesNotMatch(g.run('JSON.stringify(dialogue.pages)'),/Road Impostor/);close(g);
  assert.equal(g.run('travellersRiseAmbush.getView().phase'),'idle');assert.deepEqual(J(g,'regionalWorldPosition()'),position);
  assert.equal(g.run('stats.gold'),200);assert.equal(g.run('canonicalPartyCombat.isActive()'),false);
 }
});

test('real trigger and battle inputs award existing XP, gold and drops once and visibly acknowledge them before camp',()=>{
 const g=fresh();g.run('stats.atk=10000;Math.random=()=>.05');const xp=g.run('stats.xp'),gold=g.run('stats.gold'),items=g.run('stats.items.length');
 const esla=g.run("persistentParty.getMember('esla').xp");trigger(g);assert.equal(g.run('stats.gold'),gold);win(g);
 const receipt=J(g,'canonicalPartyCombat.getReceipt()');assert.equal(receipt.rewards.xp,215);assert.equal(receipt.rewards.gold,22);
 assert.deepEqual(receipt.rewards.items,['Potion','Potion','Potion']);assert.equal(g.run('stats.xp'),xp+215);
 assert.equal(g.run("persistentParty.getMember('esla').xp"),esla+215);assert.equal(g.run('stats.gold'),gold+22);assert.equal(g.run('stats.items.length'),items+3);
 assert.match(g.run('dialogue.pages.flat().join(" ")'),/Gained 215 XP and 22 gold/);assert.match(g.run('dialogue.pages.flat().join(" ")'),/Found: Potion/);
 g.frames(10);assert.equal(g.run('travellersRiseCamp.getView().active'),false);const after=g.run('JSON.stringify({stats,party:persistentParty.serialize()})');
 assert.equal(g.run('canonicalPartyCombat.finish()'),false);close(g);g.frames(1);assert.equal(g.run('travellersRiseCamp.getView().phase'),'outside_dialogue');
 assert.equal(g.run('JSON.stringify({stats,party:persistentParty.serialize()})'),after);
});

test('escape gives no rewards or charge; a later victory gives only the authored single award',()=>{
 const g=fresh();g.run('Math.random=()=>0');const xp=g.run('stats.xp');trigger(g);
 for(let n=0;g.run('canonicalPartyCombat.isActive()');n++){assert.ok(n<500);
  if(g.run("canonicalPartyCombat.getView().phase==='awaiting_action'")){
   for(let k=0;g.run("canonicalPartyCombat.getView().selectedCommand!=='run'");k++){assert.ok(k<8);g.press('ArrowRight');}
  }battleConfirm(g);
 }
 assert.equal(g.run('canonicalPartyCombat.getReceipt().rewards'),null);assert.equal(g.run('stats.gold'),200);assert.equal(g.run('stats.xp'),xp);
 assert.equal(g.run('travellers_rise_ambush_complete'),false);assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);
 g.run('dialogue.open=false;stats.atk=10000;Math.random=()=>.5');trigger(g);win(g);assert.equal(g.run('stats.gold'),231);assert.equal(g.run('stats.xp'),xp+215);
 assert.deepEqual(J(g,'[travellers_rise_ambush_paid,travellers_rise_ambush_payment]'),[false,0]);
});

test('wooded camp enclosure stays impassable with the existing fire route and exit',()=>{
 const g=fresh(),grid=J(g,'TRAVELLERS_RISE_CAMP_MAP');assert.equal(grid.length,15);assert.ok(grid.every(r=>r.length===16));
 assert.ok(!grid.flat().includes(g.run('WATER')));assert.equal(g.run('isTileWalkable(TREE)'),false);
 const queue=[[7,8]],seen=new Set(['7,8']);for(let n=0;n<queue.length;n++)for(const [dc,dr]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const [c,r]=queue[n],x=c+dc,y=r+dr,key=x+','+y;if(!seen.has(key)&&g.run(`isTileWalkable(TRAVELLERS_RISE_CAMP_MAP[${y}]?.[${x}])`)){seen.add(key);queue.push([x,y]);}
 }
 assert.ok(seen.has('7,12'));assert.ok(seen.has('6,5'));assert.ok(seen.has('10,5'));
 assert.ok(queue.every(([c,r])=>c>0&&c<15&&r>0&&r<13));assert.equal(g.run('TRAVELLERS_RISE_CAMP_MAP[12][7]'),g.run('PATH'));
 assert.deepEqual(J(g,'travellersRiseCamp.getView().exit'),{col:7,row:12});assert.equal(g.run('SAVE_VERSION'),5);
});

module.exports={name:'Polwick and Travellers Rise playtest: real interaction, rewards, retries and wooded campsite',run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' Polwick/Rise playtest checks passed');}};
