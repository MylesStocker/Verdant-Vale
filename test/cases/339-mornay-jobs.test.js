'use strict';
const assert=require('assert/strict');
const {fresh,place,dismiss,J}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
const {local,speak,fight}=require('./333-struck-entry-expedition.test');
const {graph}=require('./317-mainland-navigation.test');
function setup(party=false){const g=fresh();g.run('MainQuest=5;debugMode=true;');if(party)g.run('persistentParty.joinEsla()');return g;}
function visit(g,id){const map=g.run(`MORNAY_RESIDENTS.find(n=>n.id==='${id}').mapId`);place(g,map);const text=speak(g,id);for(const page of J(g,'dialogue.pages'))for(const line of page){const wrapped=g.run('paginateDialoguePages')([[line]],468,3,s=>s.length*8.4);assert.ok(wrapped.every(p=>p.length<=3&&p.every(s=>s.length*8.4<=468)));assert.equal(wrapped.flat().join(' '),line);}return text;}
function accept(g,id){visit(g,id);dismiss(g);assert.equal(g.run('choice.open'),true);g.press('Enter');dismiss(g);}
function encounter(g,i){const b=J(g,`MORNAY_REMOVALS[${i}]`);local(g,b.mapId,b.x*32,b.y*32+24);g.press(' ');dismiss(g);assert.equal(g.run('choice.open'),true);g.press('Enter');assert.equal(g.run('canonicalPartyCombat.isActive()'),true);assert.equal(g.run('canonicalPartyCombat.getView().enemies[0].id'),b.enemy,'site starts its advertised creature');}
const snapshot=g=>g.run('JSON.stringify({stats,party:persistentParty.serialize(),location:snapshotLocationState(),player,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');
module.exports={name:'Mornay jobs: board leads, deep optional bosses, authenticated rewards, paper deliveries and atomic saves',run(){
 const g=setup();place(g,'MORNAY_SOUTH_UPPER_EAST_MAP');walk(g,240,192,'job board');
 const before=snapshot(g);g.renderFrame();assert.equal(snapshot(g),before,'board rendering is read-only');g.press(' ');const text=J(g,'dialogue.pages').flat().join(' ');assert.match(text,/Iset/);assert.match(text,/Torlin/);assert.match(text,/Gessa/);dismiss(g);assert.equal(snapshot(g),before,'reading notices creates no quest state');
 const d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})'),net=graph(d),seen=net.flood('EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP',7,4);
 for(const b of J(g,'MORNAY_REMOVALS')){
  const c=d.chunks.find(c=>c.mapId===b.mapId);assert.ok(c.playerAccessible!==false);assert.ok(seen[net.key(b.mapId,Math.floor(b.x),Math.floor(b.y))],'ordinary wilderness access');
  assert.ok(Math.abs(c.chunkX-17)+Math.abs(c.chunkY+3)>=15,'deep wilderness, not beside town');
  assert.equal(g.run(`MORNAY_RESIDENTS.filter(n=>n.id==='${b.giver}').length`),1);
  assert.ok(g.run(`ENEMY_SPRITE_DISPATCH['${b.enemy}']`));
 }
 // Both contracts use authenticated canonical combat with either solo Lely or a party.
 for(const party of [false,true])for(const i of [0,1]){
  const v=setup(party),b=J(v,`MORNAY_REMOVALS[${i}]`);accept(v,b.giver);assert.equal(v.run(b.key),1);
  assert.equal(v.run('saveGame()&&loadGame()'),true);v.run('dialogue.open=false');
  assert.equal(v.run(`scriptedPartyEncounters.start('mornay_removal',${i})`),false,'remote launch rejected');
  v.run('stats.hp=stats.maxHp=500;stats.atk=1000;stats.def=50;stats.spd=80');
  const gold=v.run('stats.gold');encounter(v,i);assert.throws(()=>v.run("scriptedPartyEncounters.finalize({}, {outcome:'victory',enemies:[]})"));fight(v);
  assert.equal(v.run(b.key),2);assert.equal(v.run('stats.gold'),gold,'fee is paid by giver, not battle');
  assert.ok(v.run('stats.xp')>0);assert.equal(v.run(`scriptedPartyEncounters.start('mornay_removal',${i})`),false);
  visit(v,b.giver);const pay=v.run('dialogue.callbacks[0]');dismiss(v);pay();assert.equal(v.run('stats.gold'),gold+b.reward);assert.equal(v.run(b.key),3);
  assert.equal(v.run('saveGame()&&loadGame()'),true);v.run('dialogue.open=false');visit(v,b.giver);dismiss(v);pay();assert.equal(v.run('stats.gold'),gold+b.reward);
  assert.equal(v.run('MainQuest'),5);
 }
 // Escape and defeat leave the accepted contract retryable, never cleared.
 for(const outcome of ['escape','defeat']){
  const v=setup();accept(v,'mornay_iset_brill');v.run(outcome==='escape'?'stats.spd=100':'stats.hp=1;stats.def=0');encounter(v,0);fight(v,outcome);assert.equal(v.run('mornay_peat_hunt'),1);
 }
 const e=setup(true),gold=e.run('stats.gold');accept(e,'mornay_gessa_tarn');
 assert.equal(e.run("getActiveQuestNotes().some(n=>n.title==='Hoist Inspection Packet')"),true,'paper is a notebook special item');
 for(const [id,stage]of [['mornay_arlis_rook',2],['mornay_gessa_tarn',3],['mornay_maura_dell',4],['mornay_gessa_tarn',5]]){
  visit(e,id);const cb=e.run('dialogue.callbacks[0]');if(stage===2)assert.ok(J(e,'dialogue.pageSpeakers').includes('esla'));
  dismiss(e);cb();assert.equal(e.run('mornay_hoist_errand'),stage);assert.equal(e.run('saveGame()&&loadGame()'),true);e.run('dialogue.open=false');
 }
 assert.equal(e.run('stats.gold'),gold+35);assert.equal(e.run("stats.items.some(i=>i.name==='Hoist Inspection Packet')"),false);assert.equal(e.run('MainQuest'),5);
 // Stale delivery callback cannot advance from a different room.
 const s=setup();accept(s,'mornay_gessa_tarn');visit(s,'mornay_arlis_rook');const stale=s.run('dialogue.callbacks[0]');place(s,'MORNAY_WEST_GATE_MAP');stale();assert.equal(s.run('mornay_hoist_errand'),1);
 assert.equal(s.run('saveGame()'),true);const raw=s.run('localStorage.getItem("verdantVale_save")');
 for(const edit of ['d.mornay_peat_hunt=4','d.mornay_ridge_hunt=1.5','d.mornay_hoist_errand=6',"d.stats.items=d.stats.items.filter(i=>i.name!=='Hoist Inspection Packet')"]){
  s.run('var d='+raw+';'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');const snap=snapshot(s);assert.equal(s.run('loadGame()'),false);assert.equal(snapshot(s),snap);
 }
 const old=fresh();assert.equal(old.run('saveGame()'),true);old.run("var d=JSON.parse(localStorage.getItem('verdantVale_save'));delete d.mornay_peat_hunt;delete d.mornay_ridge_hunt;delete d.mornay_hoist_errand;localStorage.setItem('verdantVale_save',JSON.stringify(d))");assert.equal(old.run('loadGame()'),true);assert.deepEqual(J(old,'[mornay_peat_hunt,mornay_ridge_hunt,mornay_hoist_errand]'),[0,0,0]);assert.equal(old.run('SAVE_VERSION'),5);
 console.log('  Board, two solo/party bosses, escape/defeat, one-time payments, five errand stages and save rejection passed');
}};
