'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {J,dismiss,until}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const {fight,local}=require('./333-struck-entry-expedition.test');
const {office,talkVoss}=require('./351-greybank-mill.test');
const checks=[],test=(name,run)=>checks.push({name,run});
function fresh(){const g=createContext();assert.equal(g.run("storyCheckpointLab.apply('mq7_lantern_house_ready')"),true);return g;}
function save(g){assert.equal(g.run('saveGame()&&loadGame()'),true);g.run('dialogue.open=false');}
function accept(g){office(g);talkVoss(g);dismiss(g);assert.equal(g.run('choice.open'),true);g.press('Enter');assert.deepEqual(J(g,'[MainQuest,lantern_stage]'),[7,2]);}
function talk(g,id){const n=J(g,`(()=>{const n=NPC_REGISTRY['${id}'];return {x:n.x,y:n.y,map:n.map};})()`);const map=g.run(`LANTERN_MAPS.find(m=>m.contentKey==='${n.map}').id`);local(g,map,n.x,n.y+24);g.press('Enter');assert.equal(g.run('dialogue.open'),true,id);}
function battle(g,id,outcome='victory'){
 const b=J(g,`LANTERN_BATTLES[${id}]`);local(g,b.mapId,b.x*32,b.y*32+32);g.press('Enter');dismiss(g);assert.equal(g.run('choice.open'),true);g.press('Enter');assert.equal(g.run('canonicalPartyCombat.isActive()'),true);fight(g,outcome);
}
function fallen(g){assert.equal(g.run('saveGame()'),true);g.run('var payload=JSON.parse(localStorage.getItem("verdantVale_save"));payload.party.characters[0].hp=0;localStorage.setItem("verdantVale_save",JSON.stringify(payload));');assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');assert.equal(g.run("persistentParty.getActiveMember('esla').hp"),0);}
function strong(g){g.run('stats.maxHp=400;stats.hp=400;stats.atk=1000;stats.def=80;stats.spd=50');}
function firstHalf(g,reply=0){strong(g);battle(g,0);save(g);battle(g,1);talk(g,'lantern_neris');dismiss(g);for(let i=0;i<reply;i++)g.press('ArrowDown');g.press('Enter');dismiss(g);assert.equal(g.run('lantern_stage'),3);save(g);talk(g,'lantern_orren');dismiss(g);assert.equal(g.run('lantern_stage'),4);talk(g,'lantern_neris');dismiss(g);assert.equal(g.run('lantern_stage'),5);save(g);}
function lastHalf(g,reply=0){battle(g,2);battle(g,3);talk(g,'lantern_neris');dismiss(g);for(let i=0;i<reply;i++)g.press('ArrowDown');g.press('Enter');dismiss(g);assert.equal(g.run('lantern_stage'),6);save(g);local(g,'LANTERN_ORCHARD_MAP',112,336);g.press('Enter');dismiss(g);g.press(reply===0?'ArrowUp':'ArrowDown');g.press('Enter');dismiss(g);assert.equal(g.run('lantern_stage'),7);save(g);}
function absent(g){g.run("transitionToLocation({mapId:'MORNAY_GATE_INN_MAP',x:240,y:432,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_gate_inn'}});fineNeedlework.accept()");dismiss(g);assert.equal(g.run("persistentParty.isAvailable('esla')"),false);}

test('MQ6 prerequisite, offer/decline/accept, mandatory stages, truthful report and exactly one payment',()=>{
 const g=fresh();g.run('greybank_stage=3');talkVoss(g);dismiss(g);assert.equal(g.run('greybank_stage'),4);assert.equal(g.run('lantern_stage'),0,'MQ6 completion does not auto-offer MQ7');
 talkVoss(g);const cb=g.run('dialogue.callbacks[0]');dismiss(g);cb();g.press('ArrowDown');g.press('Enter');assert.deepEqual(J(g,'[MainQuest,lantern_stage]'),[6,1]);save(g);
 accept(g);firstHalf(g);lastHalf(g);const gold=g.run('stats.gold');office(g);talkVoss(g);const text=J(g,'dialogue.pages').flat().join(' ');assert.match(text,/left voluntarily/);assert.match(text,/do not all share/);assert.match(text,/not intend to return/);const paid=g.run('dialogue.callbacks[0]');dismiss(g);paid();paid();assert.equal(g.run('stats.gold'),gold+175);assert.deepEqual(J(g,'[MainQuest,lantern_stage]'),[7,8]);save(g);g.press('Enter');dismiss(g);assert.equal(g.run('stats.gold'),gold+175);assert.match(g.run('lanternHouse.note().body'),/^Completed MQ7/);assert.equal(g.run('lanternHouse.invariantErrors().length'),0);
});
test('all Lely replies, both private branches, customized name, no party/faction/resource mutation in conversation',()=>{
 for(const reply of [0,1,2]){
  const g=fresh();accept(g);g.run("player.name='Mira';lantern_wins=3");const before=g.run('JSON.stringify({stats,party:persistentParty.serialize(),day})');talk(g,'lantern_neris');dismiss(g);for(let i=0;i<reply;i++)g.press('ArrowDown');g.press('Enter');assert.match(J(g,'dialogue.pages').flat().join(' '),/Her name is Mira/);dismiss(g);assert.equal(g.run('JSON.stringify({stats,party:persistentParty.serialize(),day})'),before);assert.deepEqual(J(g,'persistentParty.serialize().order'),['lely','esla']);talk(g,'lantern_orren');dismiss(g);talk(g,'lantern_neris');dismiss(g);strong(g);lastHalf(g,reply);
 }
});
test('real Fine Needlework absence blocks briefing and key scenes, preserves exploration/receipts, Fallen presence never heals',()=>{
 for(const stage of [0,2,3,4,5,6,7]){
  const g=fresh();if(stage){accept(g);g.run(`lantern_stage=${stage};lantern_wins=${stage>=5?15:3}`);}absent(g);const before=g.run('JSON.stringify(persistentParty.serialize())');
  if(stage===0||stage===7){office(g);talkVoss(g);}else if(stage===3)talk(g,'lantern_orren');else if(stage===6){local(g,'LANTERN_ORCHARD_MAP',112,336);g.press('Enter');}else talk(g,'lantern_neris');
  assert.match(J(g,'dialogue.pages').flat().join(' '),/Fine Needlework/);dismiss(g);assert.equal(g.run('lantern_stage'),stage);assert.equal(g.run('JSON.stringify(persistentParty.serialize())'),before);assert.equal(g.run('fine_needlework_stage'),1);save(g);
  local(g,'LANTERN_TRACK_MAP',80,400);until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')==='MAINLAND_C20R0_MAP');assert.equal(g.run('canWalk(player.x,player.y)'),true);
 }
 const resumed=fresh();accept(resumed);resumed.run('lantern_stage=4;lantern_wins=3');absent(resumed);talk(resumed,'lantern_neris');dismiss(resumed);
 const resources=resumed.run('JSON.stringify(persistentParty.serialize().characters)');
 resumed.run("transitionToLocation({mapId:'MORNAY_GATE_INN_MAP',x:240,y:432,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_gate_inn'}})");assert.equal(resumed.run('fineNeedlework.returnParcel()'),true);
 resumed.run("transitionToLocation({mapId:'MORNAY_COMMERCIAL_INN_MAP',x:240,y:432,state:{inTown:true,currentTownId:'mornay',townBuilding:'mornay_commercial_inn'}})");assert.equal(resumed.run('fineNeedlework.reunite()'),true);save(resumed);
 talk(resumed,'lantern_neris');dismiss(resumed);assert.equal(resumed.run('lantern_stage'),5);assert.equal(resumed.run('JSON.stringify(persistentParty.serialize().characters)'),resources,'reunion and conversation never heal or replace character state');
 const g=fresh();fallen(g);const hp=g.run("persistentParty.getActiveMember('esla').hp");accept(g);assert.equal(g.run("persistentParty.getActiveMember('esla').hp"),hp);
});
test('canonical encounter receipts: retreat/defeat permit retry, fake wins rejected, optional cache persists once',()=>{
 for(const outcome of ['escape','defeat'])for(let id=0;id<5;id++){
  const g=fresh();accept(g);g.run(`lantern_stage=${id>=2?5:2};lantern_wins=${[0,1,3,7,7][id]}`);strong(g);
  // Combat defeat is allowed to recover through the ordinary party authority.
  if(outcome==='defeat'){g.run("stats.hp=1;stats.def=0;stats.spd=1;stats.armor=null;stats.shield=null;");fallen(g);}
  assert.throws(()=>g.run("scriptedPartyEncounters.finalize({}, {outcome:'victory',enemies:[]})"));const prior=g.run('lantern_wins');battle(g,id,outcome);assert.equal(g.run('lantern_wins'),prior);save(g);strong(g);battle(g,id);assert.equal(g.run('lantern_wins'),prior|(1<<id));assert.equal(g.run(`scriptedPartyEncounters.start('lantern_house',${id})`),false);
 }
 const g=fresh();accept(g);g.run('lantern_stage=5;lantern_wins=7');strong(g);battle(g,4);local(g,'LANTERN_COPSE_MAP',400,144);const n=g.run('stats.items.length');g.press('Enter');const cb=g.run('dialogue.callbacks[0]');dismiss(g);cb();save(g);g.press('Enter');dismiss(g);assert.equal(g.run('stats.items.length'),n+5);assert.equal(g.run('lantern_cache_taken'),true);
});
test('all doors walk from reciprocal arrival, save/load and safe returns in both movement modes',()=>{
 for(const legacy of [false,true]){
  const g=fresh();accept(g);g.run(`lantern_stage=7;lantern_wins=31;forceLegacyRegionalView=${legacy}`);
  for(const d of J(g,'LANTERN_DOORS')){
   const reverse=J(g,`LANTERN_DOORS.find(d=>d.source===${JSON.stringify(d.target)}&&d.target===${JSON.stringify(d.source)})`);
   local(g,d.source,reverse.x,reverse.y);save(g);const x=(d.col+.5)*32,y=(d.row+.5)*32;
   const candidates=[[x,y+32,'ArrowUp'],[x,y-32,'ArrowDown'],[x+32,y,'ArrowLeft'],[x-32,y,'ArrowRight']];
   const approach=candidates.find(([xx,yy])=>g.run(`canWalk(${xx},${yy})&&!TILE_PROPERTIES[tileAt(${xx},${yy})]?.isTransition`));assert.ok(approach,d.source);
   walk(g,approach[0],approach[1],d.source);until(g,approach[2],()=>g.run('mapIdForRef(activeMap)')===d.target);assert.equal(g.run('canWalk(player.x,player.y)'),true,d.target);assert.deepEqual(J(g,'[player.x,player.y]'),[d.x,d.y]);save(g);g.frames(8);assert.equal(g.run('mapIdForRef(activeMap)'),d.target);
  }
 }
});
test('danger gates cannot be walked through or started out of order; all local floor is connected',()=>{
 const g=fresh();accept(g);local(g,'LANTERN_TRACK_MAP',400,80);g.hold('ArrowUp');g.frames(18);g.release('ArrowUp');assert.equal(g.run('mapIdForRef(activeMap)'),'LANTERN_TRACK_MAP');assert.equal(g.run("scriptedPartyEncounters.start('lantern_house',1)"),false);
 const tiles=J(g,'TILE_PROPERTIES');for(const m of J(g,'LANTERN_MAPS')){
  const d=J(g,`LANTERN_DOORS.find(d=>d.target==='${m.id}')`),q=[[Math.floor(d.x/32),Math.floor(d.y/32)]],seen=new Set([q[0].join(',')]);for(let i=0;i<q.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const [x,y]=q[i],xx=x+dx,yy=y+dy,k=xx+','+yy;if(tiles[m.map[yy]?.[xx]]?.walkable&&!seen.has(k)){seen.add(k);q.push([xx,yy]);}}
  for(let y=0;y<15;y++)for(let x=0;x<16;x++)if(tiles[m.map[y][x]].walkable)assert.ok(seen.has(x+','+y),m.id+' disconnected floor '+x+','+y);
  assert.equal(g.run(`MAP_METADATA['${m.id}'].allowRandomEncounters`),false);
 }
});
test('held input, competing activity, stale callbacks and invalid save receipts fail closed',()=>{
 const g=fresh();talkVoss(g);const page=g.run('dialogue.page');g.hold('Enter');g.frames(12);g.release('Enter');assert.ok(g.run('dialogue.page')<=page+1);const pos=J(g,'[player.x,player.y]');g.hold('ArrowDown');g.frames(12);g.release('ArrowDown');assert.deepEqual(J(g,'[player.x,player.y]'),pos);assert.equal(g.run('saveGame()||loadGame()'),false);assert.ok(J(g,'activityOwnership.combatPreparationConflicts(true)').includes('lantern_house_scene'));const cb=g.run('dialogue.callbacks[0]');g.run("storyCheckpointLab.apply('mq7_lantern_house_ready')");cb();assert.equal(g.run('choice.open'),false);save(g);
 const raw=g.run('localStorage.getItem("verdantVale_save")');for(const patch of ['d.lantern_stage=8','d.lantern_wins=8','d.lantern_cache_taken=true','d.lantern_stage=2;d.greybank_stage=3;d.MainQuest=7','d.MainQuest=7']){g.run('var d='+raw+';'+patch+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');const before=g.run('JSON.stringify({stats,player,lantern_stage,lantern_wins})');assert.equal(g.run('loadGame()'),false,patch);assert.equal(g.run('JSON.stringify({stats,player,lantern_stage,lantern_wins})'),before);}
 g.run('var d='+raw+';delete d.lantern_stage;delete d.lantern_wins;delete d.lantern_cache_taken;localStorage.setItem("verdantVale_save",JSON.stringify(d))');assert.equal(g.run('loadGame()'),true);assert.equal(g.run('lantern_stage'),0);
});
test('mandatory history and politics remain separate from optional readings; Esla style and state isolation',()=>{
 const g=fresh();accept(g);g.run('lantern_wins=3');talk(g,'lantern_neris');dismiss(g);g.press('Enter');const before=g.run('JSON.stringify({stats,party:persistentParty.serialize(),day})');
 while(g.run('dialogue.open')){const p=J(g,'dialoguePagePresentation()');assert.equal(p.styleId,p.speakerId==='esla'?'esla_light_green':null);g.press('Enter');}assert.equal(g.run('JSON.stringify({stats,party:persistentParty.serialize(),day})'),before);
 const text=J(g,'Object.values(LANTERN_DIALOGUE).flat().map(p=>typeof p[1]==="string"?p[1]:p[1]())').join(' ');
 for(const phrase of ['Year 0','3 AC','700 AC','701 AC','random, not hereditary','not predictably','automatic warrants','cannot inherit','gifts','love Tomas','reject the Flame','Reclaimers','not our ally'])assert.ok(text.includes(phrase),phrase);
 assert.ok(!/tried to drown|father|power passes through blood/i.test(text),'no involuntary personal disclosure or magical ancestry');
 for(const r of J(g,'LANTERN_READINGS')){local(g,'LANTERN_'+r.map+'_MAP',r.x*32,r.y*32+32);const before=g.run('JSON.stringify({stats,party:persistentParty.serialize(),day,lantern_stage,lantern_wins})');g.press('Enter');dismiss(g);assert.equal(g.run('JSON.stringify({stats,party:persistentParty.serialize(),day,lantern_stage,lantern_wins})'),before);}
 assert.equal(g.run('validateGameData().errors'),0);assert.equal(g.run('SAVE_VERSION'),5);
});
test('regional approach stays post-ferry/post-ambush; sole doorway cannot create a shortcut',()=>{
 const g=fresh(),{graph}=require('./317-mainland-navigation.test');
 const d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})'),net=graph(d),p=net.key('MAINLAND_C20R0_MAP',7,3),cut=net.key('EASTERN_FENS_TRAVELLERS_RISE_MAP',10,7);
 assert.equal(net.flood('EASTERN_FENS_WIDE_WATER_MAP',1,8)[p],1,'reachable from post-Rise mainland');
 assert.equal(net.flood('MAP3',8,11)[p],0,'cannot bypass ferry');
 assert.equal(net.flood('EASTERN_BANK_MAP',5,8,cut)[p],0,'cannot bypass ambush');
 assert.equal(J(g,'LANTERN_DOORS.filter(d=>!LANTERN_CONTENT_KEYS[d.target])').length,1,'one external return only');
 assert.equal(g.run('new Set(LANTERN_NPCS.map(n=>n.id)).size'),5);
 for(const stage of [2,3,4,5,6,7,8]){
  g.run(`lantern_stage=${stage};lantern_wins=${stage>=5?31:3}`);
  for(const n of J(g,'LANTERN_NPCS')){
   const m=J(g,`LANTERN_MAPS.find(m=>m.contentKey==='${n.map}')`);
   assert.ok(m,n.id+' has real map');assert.equal(d.tiles[m.map[Math.floor(n.y/32)][Math.floor(n.x/32)]].walkable,true,n.id+' stands on floor');
   assert.equal(J(g,`LANTERN_DOORS.filter(d=>d.source==='${m.id}'&&d.col===${Math.floor(n.x/32)}&&d.row===${Math.floor(n.y/32)})`).length,0,n.id+' clear of doors');
  }
 }
});
module.exports={name:'MQ7 Lantern House: history, agency, presence, authenticated expedition and truthful completion',checks,fresh,accept,firstHalf,lastHalf,talk,battle,save,
 run(){for(const c of checks){try{c.run();console.log('  '+c.name);}catch(e){e.message=c.name+': '+e.message;throw e;}}}};
