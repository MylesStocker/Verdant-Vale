'use strict';
const assert=require('assert/strict');
const {J,fresh,openService,dismiss,seed}=require('./301-mornay-manifest.test');
function state(g){return g.run('JSON.stringify({party:persistentParty.getView(),stats,statusEffects,slitherSpd,day,location:snapshotLocationState(),player,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');}
function choose(g,slot){openService(g,'treatment');assert.equal(g.run('choice.options.length'),g.run('persistentParty.getView().members.length')+1);for(let n=0;n<slot;n++)g.press('ArrowDown');g.press('Enter');dismiss(g);}
module.exports={
 name:'Mornay physician: selected member full/partial/zero funds, full health, Fallen, cancellation/retry and atomic owner rejection',
 run(){
  for(const companion of [false,true])for(const [hp,gold,restored]of [[7,100,23],[7,4,4],[7,0,0],[30,100,0],[0,100,30]]){
   if(!companion&&hp===0)continue; // A wholly Fallen party cannot load a field-service fixture.
   const g=fresh();if(companion)g.run('persistentParty.joinEsla();');g.run(`stats.gold=${gold};`);
   seed(g,`mornayFixture.day=9;mornayFixture.statusEffects=['poison','burn','slither'];mornayFixture.slitherSpd=11;mornayFixture.stats.hp=${companion?17:hp};`+(companion?`mornayFixture.party.characters[0].hp=${hp};mornayFixture.party.characters[0].statuses=['muddied','cursed','dazzled','slither'];mornayFixture.party.characters[0].slitherSpeed=13;`:''));
   const before=J(g,'persistentParty.getView()');choose(g,companion?1:0);const after=J(g,'persistentParty.getView()');
   const expected=JSON.parse(JSON.stringify(before));expected.gold-=restored;expected.members[companion?1:0].hp+=restored;expected.defeated=expected.members.every(m=>m.hp===0);
   assert.deepEqual(after,expected);assert.equal(g.run('day'),9,'treatment never advances day');
   assert.equal(g.run('saveGame()'),true);assert.equal(g.run('loadGame()'),true);dismiss(g);assert.deepEqual(J(g,'persistentParty.getView()'),after);
   openService(g,'treatment');g.press('Escape');assert.deepEqual(J(g,'persistentParty.getView()'),after);
   openService(g,'treatment');for(let n=0;n<before.members.length;n++)g.press('ArrowDown');g.press('Enter');assert.deepEqual(J(g,'persistentParty.getView()'),after,'Leave is inert');
   if(gold===4){g.run('stats.gold=3;');choose(g,companion?1:0);assert.equal(g.run(`persistentParty.getView().members[${companion?1:0}].hp`),14);assert.equal(g.run('stats.gold'),0,'retry purchases only three additional HP');}
  }
  const g=fresh();g.run('persistentParty.joinEsla();stats.gold=100;stats.hp=5;');
  for(const expression of ['persistentParty.treatMember()','persistentParty.treatMember("missing")','persistentParty.treatMember("esla",1)','persistentParty.treatMember({characterId:"lely"})']){const before=state(g);assert.throws(()=>g.run(expression));assert.equal(state(g),before,expression);}
  g.run('stats.gold=-1;');const invalid=state(g);assert.throws(()=>g.run('persistentParty.treatMember("esla")'));assert.equal(state(g),invalid,'invalid canonical funds reject before any owner write');g.run('stats.gold=100;');
  g.run('persistentParty.beginCombat(["enemy_marsh_wisp"]);');const combat=state(g);assert.throws(()=>g.run('persistentParty.treatMember("lely")'));assert.equal(state(g),combat,'treatment cannot mutate an active combat owner');
 }
};
