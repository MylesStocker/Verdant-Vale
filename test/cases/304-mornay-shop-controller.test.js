'use strict';
const assert=require('assert/strict');
const {J,fresh,openService,dismiss}=require('./301-mornay-manifest.test');
const STOCK={provisioner:[['Potion',30],['Bait',6]],apothecary:[['Potion',30],['Elixir',80],['Reed Remedy',50],['Amethyst Dust',60]],workgear:[['Bronze Knife',80],['Leather Armor',120],['Iron Shield',140],['Iron Sword',160],['Fen Cowl',240]],chandler:[['Bait',6],['Throwing Knife',35],['Leather Armor',120],['Swift Bangle',180]]};
module.exports={
 name:'Mornay commerce: four real keeper offers, complete stock, buy/sell accounting, insufficient gold, cancellation and save continuity',
 run(){
  for(const [service,stock]of Object.entries(STOCK)){
   const g=fresh();g.run('stats.gold=3000;');openService(g,service);assert.equal(g.run('shop.open'),true);
   assert.deepEqual(J(g,'shop.stock.map(i=>[i.name,i.price])'),stock);
   assert.equal(g.run('shop.stock.every(i=>i.type!=="quest")'),true);
   const original=J(g,'persistentParty.getView()');g.press('Enter');assert.equal(g.run('shop.screen'),'buy');
   for(let i=0;i<stock.length;i++){if(i)g.press('ArrowDown');g.press('Enter');assert.equal(g.run('stats.items.length'),i+1);}
   const spent=stock.reduce((n,[,p])=>n+p,0);
   assert.equal(g.run('stats.gold'),3000-spent);assert.deepEqual(J(g,'stats.items.map(i=>i.name)'),stock.map(([id])=>id));
   g.press('Escape');g.press('Escape');assert.equal(g.run('shop.open'),false);
   assert.equal(g.run('saveGame()'),true);g.run('stats.gold=1;stats.items=[];');assert.equal(g.run('loadGame()'),true);dismiss(g);
   assert.equal(g.run('stats.gold'),3000-spent);assert.deepEqual(J(g,'stats.items.map(i=>i.name)'),stock.map(([id])=>id));
   openService(g,service);g.press('ArrowDown');g.press('Enter');assert.equal(g.run('shop.screen'),'sell');
   for(let i=0;i<stock.length;i++)g.press('Enter');
   assert.equal(g.run('stats.items.length'),0);assert.equal(g.run('stats.gold'),3000-spent+stock.reduce((n,[,p])=>n+Math.floor(p/2),0));
   g.press('Escape');g.press('Escape');
   openService(g,service);const before=J(g,'persistentParty.getView()');g.press('Enter');g.press('Escape');g.press('Escape');assert.deepEqual(J(g,'persistentParty.getView()'),before,'cancel moves no resources');
   g.run('stats.gold=0;');openService(g,service);g.press('Enter');const zero=J(g,'persistentParty.getView()');
   for(let i=0;i<stock.length;i++){if(i)g.press('ArrowDown');g.press('Enter');assert.deepEqual(J(g,'persistentParty.getView()'),zero,stock[i][0]+' blocked without money');}
   assert.deepEqual(J(g,'persistentParty.getView().members'),original.members,'commerce cannot alter health/equipment/progression');
  }
 }
};
