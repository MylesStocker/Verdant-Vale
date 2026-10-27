'use strict';
const assert=require('assert/strict');
const {fresh,J,until,reachable,dismiss}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
module.exports={
 name:'Reedbank village: ordinary entrance/return in both movement modes, all residents reachable, shop and save/load lifecycle',
 run(){
  for(const legacy of [false,true]){
   const g=fresh(legacy);
   assert.equal(g.run("transitionToLocation({mapId:'MAINLAND_C22R3_MAP',x:112,y:304,facing:'up',cooldown:true})"),true);
   until(g,'ArrowUp',()=>g.run('mapIdForRef(activeMap)')==='REEDBANK_VILLAGE_MAP');
   assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),[240,432,'up']);
   assert.equal(g.run('locationName()'),'Reedbank');assert.equal(g.run('REEDBANK_HOMESTEADS.length'),7);
   const points=reachable(g);
   for(const n of J(g,"REEDBANK_NPCS.filter(n=>n.map==='reedbank_village')")){
    const p=points.find(([x,y])=>Math.hypot(x-n.x,y-n.y)<32&&g.run(`SIMPLE_NPCS.find(n=>n.map===currentContentLocationKey()&&Math.hypot(n.x-${x},n.y-${y})<TALK_RADIUS)?.id`)===n.id);
    assert.ok(p,n.id+' reachable from entrance');walk(g,...p,n.id);g.press(' ');assert.equal(g.run('dialogue.name'),n.name);dismiss(g);
    if(n.id==='reedbank_tavin'){g.press('ArrowDown');g.press('ArrowDown');g.press('Enter');}
   }
   g.run('stats.gold=100');assert.equal(g.run('saveGame()'),true);g.frames(300);
   assert.equal(g.run('combat.active'),false);assert.equal(g.run('MAP_METADATA.REEDBANK_VILLAGE_MAP.allowRandomEncounters'),false);
   walk(g,272,240,'shop entrance');until(g,'ArrowUp',()=>g.run('mapIdForRef(activeMap)')==='REEDBANK_PROVISIONS_MAP');
   const shopPoints=reachable(g),n=J(g,"REEDBANK_NPCS.find(n=>n.id==='reedbank_nella')");
   const p=shopPoints.find(([x,y])=>Math.hypot(x-n.x,y-n.y)<32);assert.ok(p,'keeper is accessible beside counter');walk(g,...p,'Nella');
   g.press(' ');dismiss(g);assert.equal(g.run('shop.open'),true);
   assert.deepEqual(J(g,'shop.stock.map(i=>i.name)'),['Potion','Bait','Reed Remedy']);
   const gold=g.run('stats.gold'),price=g.run('shop.stock[0].price'),potions=g.run("stats.items.filter(i=>i.name==='Potion').length");
   g.press('Enter');g.press('Enter');
   assert.equal(g.run('stats.gold'),gold-price);assert.equal(g.run("stats.items.filter(i=>i.name==='Potion').length"),potions+1);
   g.press('Escape');g.press('Escape');assert.equal(g.run('shop.open'),false);
   assert.equal(g.run('saveGame()'),true);
   walk(g,240,432,'shop exit');until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')==='REEDBANK_VILLAGE_MAP');
   assert.deepEqual(J(g,'[player.x,player.y]'),[272,240]);
   assert.equal(g.run('loadGame()'),true);g.run('dialogue.open=false');assert.equal(g.run('mapIdForRef(activeMap)'),'REEDBANK_PROVISIONS_MAP');
   assert.equal(g.run('stats.gold'),gold-price);
   walk(g,240,432,'loaded shop exit');until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')==='REEDBANK_VILLAGE_MAP');
   walk(g,240,432,'village exit');until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')==='MAINLAND_C22R3_MAP');
   assert.deepEqual(J(g,'[player.x,player.y,player.facing]'),[112,304,'down']);assert.equal(g.run('canWalk(player.x,player.y)'),true);
   g.frames(30);assert.equal(g.run('mapIdForRef(activeMap)'),'MAINLAND_C22R3_MAP','no automatic reentry');
  }
 }
};
