'use strict';
const assert=require('assert/strict');
const {J,fresh,place,talk,dismiss,openService}=require('./301-mornay-manifest.test');
function go(g,id){
 const r=J(g,`MORNAY_RESIDENTS.find(n=>n.id===${JSON.stringify(id)})`);
 place(g,g.run('isDayOff()')&&r.dayOff?r.dayOff.mapId:r.mapId);talk(g,id);
}
const vessa='mornay_vessa_kest',enna='mornay_enna_quist',hessa='mornay_hessa_vane';
module.exports={
 name:'Mornay calendar: recurring Dayoff closures, paid neighbourhood requests, stale callbacks and v5 continuity',
 go,
 run(){
  const g=fresh();
  for(const day of [4,5,6,9,10,11]){
   g.run(`day=${day};choice.open=false;shop.open=false;`);
   for(const service of ['provisioner','apothecary','workgear','chandler','hidden_supplies','fleck_smoker','fleck_tavern']){
    openService(g,service);
    assert.equal(g.run('shop.open'),day%5!==0||service==='fleck_tavern',service+' calendar '+day);
    g.run('shop.open=false');
   }
  }
  g.run('day=4');const r=J(g,"MORNAY_RESIDENTS.find(n=>n.service==='provisioner')");place(g,r.mapId);talk(g,r.id);
  g.run('day=5');dismiss(g);assert.equal(g.run('shop.open'),false,'stale greeting cannot open closed shop');
  g.run('day=4');go(g,vessa);dismiss(g);assert.equal(g.run('choice.open'),false,'weekday has invitation, not offer');
  g.run('day=5');go(g,vessa);dismiss(g);assert.equal(g.run('choice.open'),true);g.press('ArrowDown');g.press('Enter');assert.equal(g.run('mornay_dayoff_music'),0,'decline unchanged');
  go(g,vessa);dismiss(g);g.run('day=6');g.press('Enter');assert.equal(g.run('mornay_dayoff_music'),0,'stale Dayoff choice rejected');
  g.run('day=10');go(g,vessa);dismiss(g);g.press('Enter');dismiss(g);assert.equal(g.run('mornay_dayoff_music'),1,'next Dayoff can accept');
  const main=g.run('MainQuest'),gold=g.run('stats.gold');
  assert.equal(g.run('saveGame()&&loadGame()'),true);dismiss(g);
  g.run('day=11');go(g,hessa);dismiss(g);assert.equal(g.run('mornay_dayoff_music'),1,'out of order does not progress');
  go(g,enna);g.run('var oldCalendarCallback=dialogue.callbacks[0]');dismiss(g);assert.equal(g.run('mornay_dayoff_music'),2);
  g.run('oldCalendarCallback()');assert.equal(g.run('mornay_dayoff_music'),2,'callback replay rejected');
  assert.equal(g.run('saveGame()&&loadGame()'),true);dismiss(g);
  go(g,hessa);dismiss(g);assert.equal(g.run('mornay_dayoff_music'),3);
  go(g,vessa);g.run('var payCalendarCallback=dialogue.callbacks[0]');dismiss(g);assert.equal(g.run('mornay_dayoff_music'),4);assert.equal(g.run('stats.gold'),gold+60);
  g.run('payCalendarCallback()');go(g,vessa);dismiss(g);assert.equal(g.run('stats.gold'),gold+60,'one payment');assert.equal(g.run('MainQuest'),main);
  assert.equal(g.run('saveGame()&&loadGame()'),true);dismiss(g);assert.equal(g.run('mornay_dayoff_music'),4);
  for(const bad of [-1,5,1.5,'1',null]){
   g.run(`var good=localStorage.getItem('verdantVale_save');var bad=JSON.parse(good);bad.mornay_dayoff_music=${JSON.stringify(bad)};localStorage.setItem('verdantVale_save',JSON.stringify(bad));`);
   assert.equal(g.run('loadGame()'),false,'invalid stage rejected atomically');assert.equal(g.run('mornay_dayoff_music'),4);
   g.run("localStorage.setItem('verdantVale_save',good)");
  }
  g.run("var old=JSON.parse(localStorage.getItem('verdantVale_save'));delete old.mornay_dayoff_music;localStorage.setItem('verdantVale_save',JSON.stringify(old))");
  assert.equal(g.run('loadGame()'),true);dismiss(g);assert.equal(g.run('mornay_dayoff_music'),0);assert.equal(g.run('SAVE_VERSION'),5);
  g.run('day=15;stats.gold=200');openService(g,'gate_inn');assert.equal(g.run('choice.open'),true);g.press('Enter');dismiss(g);assert.equal(g.run('day'),16);
  // The notice is a discoverable invitation, never an acceptance or reward.
  const before=g.run('JSON.stringify({day,stats,MainQuest,mornay_dayoff_music})');
  for(let n=0;n<3;n++)assert.match(g.run('JSON.stringify(mornayCalendar.boardPages())'),/South Rows/);
  assert.equal(g.run('JSON.stringify({day,stats,MainQuest,mornay_dayoff_music})'),before);
  g.run('day=20;mornay_dayoff_music=0');go(g,vessa);dismiss(g);
  place(g,'MORNAY_WEST_GATE_MAP');g.press('Enter');
  assert.equal(g.run('mornay_dayoff_music'),0,'leaving before accepting invalidates the offer');
  g.run('day=15');openService(g,'treatment');assert.equal(g.run('choice.open'),true,'infirmary operates on Dayoff');g.run('choice.open=false');
 }
};
