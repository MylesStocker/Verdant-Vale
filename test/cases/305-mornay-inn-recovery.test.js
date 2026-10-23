'use strict';
const assert=require('assert/strict');
const {J,fresh,openService,dismiss,seed}=require('./301-mornay-manifest.test');
module.exports={
 name:'Mornay inns: exact fees and one morning, solo/companion/Fallen recovery, existing condition retention, cancel and insufficient funds',
 run(){
  for(const [service,fee]of [['gate_inn',30],['commercial_inn',40]])for(const mode of ['solo','both','lely_fallen','esla_fallen']){
   const g=fresh();if(mode!=='solo')g.run('persistentParty.joinEsla();');
   g.run('stats.gold=200;');
   seed(g,`mornayFixture.day=5;mornayFixture.stats.hp=${mode==='lely_fallen'?0:7};mornayFixture.statusEffects=['poison','muddied','slither','cursed','burn','dazzled'];mornayFixture.slitherSpd=11;`+(mode==='solo'?'':`mornayFixture.party.characters[0].hp=${mode==='esla_fallen'?0:9};mornayFixture.party.characters[0].statuses=['poison','muddied','slither','cursed','burn','dazzled'];mornayFixture.party.characters[0].slitherSpeed=13;`));
   const before=J(g,'persistentParty.getView()');openService(g,service);
   assert.equal(g.run('choice.open'),true);assert.deepEqual(J(g,'choice.options'),['Rest ('+fee+'g)','Leave']);g.press('Enter');dismiss(g);
   const after=J(g,'persistentParty.getView()');assert.equal(after.gold,200-fee);assert.equal(g.run('day'),6);
   for(let i=0;i<after.members.length;i++){
    const member=after.members[i],prior=before.members[i];assert.equal(member.hp,member.maxHp);assert.deepEqual(member.statuses,['burn','dazzled']);assert.equal(member.slitherSpeed,prior.slitherSpeed);
    assert.deepEqual({...member,hp:prior.hp,statuses:prior.statuses},prior,'only intended personal recovery changes');
   }
   assert.deepEqual(after.inventory,before.inventory);
   assert.equal(g.run('saveGame()'),true);g.run('stats.hp=1;day=2;');assert.equal(g.run('loadGame()'),true);dismiss(g);assert.equal(g.run('day'),6);assert.deepEqual(J(g,'persistentParty.getView()'),after);
   openService(g,service);g.press('ArrowDown');g.press('Enter');assert.deepEqual(J(g,'persistentParty.getView()'),after);assert.equal(g.run('day'),6);
   openService(g,service);g.press('Escape');assert.deepEqual(J(g,'persistentParty.getView()'),after);assert.equal(g.run('day'),6);
   g.run(`stats.gold=${fee-1};stats.hp=1;`);const poor=J(g,'persistentParty.getView()');openService(g,service);g.press('Enter');dismiss(g);assert.deepEqual(J(g,'persistentParty.getView()'),poor);assert.equal(g.run('day'),6);
  }
 }
};
