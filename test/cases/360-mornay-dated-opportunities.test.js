'use strict';
const assert=require('assert/strict');
const {J,fresh,dismiss,place}=require('./301-mornay-manifest.test');
const {go}=require('./359-mornay-calendar.test');
// Expectations are the approved calendar/content contract, not read from the registry.
const opportunities=[
 {id:'mornay_maelin_rook',day:10,early:true,items:['Swift Bangle'],bit:1},
 {id:'mornay_jessa_fallow',day:14,early:true,items:['Elixir','Elixir'],bit:2},
 {id:'mornay_fennel_ashe',day:16,items:Array(8).fill('Dart Seed'),bit:4},
 {id:'mornay_ressa_muir',day:21,items:Array(3).fill('Smoked Lake Fish'),bit:8},
 {id:'mornay_enna_quist',day:26,items:['Reed Remedy','Reed Remedy'],bit:16}
];
const bag=g=>J(g,'stats.items.map(i=>i.name)');
const world=g=>g.run('JSON.stringify({day,stats,MainQuest,party:persistentParty.serialize(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');
function offer(g,o){go(g,o.id);dismiss(g);assert.equal(g.run('choice.open'),true,o.id+' offers at eligible date');}
module.exports={name:'Mornay dated opportunities: inclusive deadlines, later unlocks, one-time claims, schedule-aware input, save atomicity and quest priority',run(){
 for(const o of opportunities){
  const g=fresh();g.run(`day=${o.early?o.day+1:o.day-1}`);const before=world(g);
  go(g,o.id);dismiss(g);assert.equal(g.run('choice.open'),false,o.id+' unavailable outside window');assert.equal(world(g),before,'hint/expiry is read-only');
  g.run(`day=${o.day}`);const items=bag(g),main=g.run('MainQuest');offer(g,o);
  g.press('ArrowDown');g.press('Enter');assert.deepEqual(bag(g),items);assert.equal(g.run('mornay_calendar_claims'),0,'decline does not consume');
  offer(g,o);g.run('var oldClaim=choice.callbacks[0]');g.press('Enter');dismiss(g);
  assert.deepEqual(bag(g),items.concat(o.items));assert.equal(g.run('mornay_calendar_claims'),o.bit);assert.equal(g.run('MainQuest'),main);
  g.run('oldClaim()');assert.deepEqual(bag(g),items.concat(o.items),'replayed callback does not duplicate');
  assert.equal(g.run('saveGame()&&loadGame()'),true);dismiss(g);go(g,o.id);dismiss(g);
  assert.equal(g.run('choice.open'),false);assert.deepEqual(bag(g),items.concat(o.items),'repeat/load cannot reclaim');
  assert.equal(g.run('mornayCalendar.notes().length'),1,'claim in notebook');
  if(o.early){
   const expired=fresh();expired.run(`day=${o.day}`);offer(expired,o);expired.run(`day=${o.day+1}`);expired.press('Enter');
   assert.equal(expired.run('mornay_calendar_claims'),0,'choice cannot outlive deadline');
  }else{
   const late=fresh();late.run('day=100');offer(late,o);late.press('Enter');dismiss(late);assert.equal(late.run('mornay_calendar_claims'),o.bit,'later reward has no expiry, including Dayoff');
  }
 }
 const g=fresh();const roster=g.run('MORNAY_NPCS.length');
 for(const o of opportunities){g.run(`day=${o.day}`);offer(g,o);g.press('Enter');dismiss(g);}
 assert.equal(g.run('mornay_calendar_claims'),31);assert.equal(g.run('MORNAY_NPCS.length'),roster);assert.equal(roster,311,'no new NPCs');
 assert.equal(g.run('SAVE_VERSION'),5);assert.equal(g.run('saveGame()'),true);
 const saved=g.run("localStorage.getItem('verdantVale_save')"),live=world(g);
 for(const bad of [-1,32,1.5,'1',null]){
  g.run(`var badSave=JSON.parse(${JSON.stringify(saved)});badSave.mornay_calendar_claims=${JSON.stringify(bad)};localStorage.setItem('verdantVale_save',JSON.stringify(badSave));`);
  assert.equal(g.run('loadGame()'),false,'invalid claim bits rejected');assert.equal(world(g),live,'invalid load is atomic');
 }
 g.run(`var oldSave=JSON.parse(${JSON.stringify(saved)});delete oldSave.mornay_calendar_claims;delete oldSave.mornay_dayoff_music;localStorage.setItem('verdantVale_save',JSON.stringify(oldSave));`);
 assert.equal(g.run('loadGame()'),true);dismiss(g);assert.equal(g.run('mornay_calendar_claims'),0,'old v5 defaults');
 g.run('day=26;mornay_dayoff_music=1');go(g,'mornay_enna_quist');dismiss(g);
 assert.equal(g.run('mornay_dayoff_music'),2,'active supper quest keeps priority');assert.equal(g.run('mornay_calendar_claims'),0);
 offer(g,opportunities[4]);g.press('Enter');dismiss(g);assert.equal(g.run('mornay_calendar_claims'),16,'optional cupboard remains available after quest dialogue');
 const moved=fresh();moved.run('day=14');offer(moved,opportunities[1]);place(moved,'MORNAY_WEST_GATE_MAP');moved.press('Enter');
 assert.equal(moved.run('mornay_calendar_claims'),0,'remote callback cannot grant reward');
 const before=world(moved);for(let n=0;n<4;n++)moved.run('mornayCalendar.boardPages();mornayCalendar.notes()');assert.equal(world(moved),before,'notices and notebook are read-only');
 for(const o of opportunities){assert.equal(g.run(`MORNAY_RESIDENTS.filter(n=>n.id==='${o.id}').length`),1);for(const item of o.items)assert.ok(g.run(`ITEM_REGISTRY[${JSON.stringify(item)}]`));}
}};
