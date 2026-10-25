'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const J=(g,e)=>JSON.parse(g.run('JSON.stringify('+e+')'));
module.exports={
 name:'Hollis farmhouse: hearth soup pot, nearby Merta and open doorway interaction route',
 run(){
  const g=createContext();g.press('Enter');g.press('Enter');
  g.run('dialogue.open=false;choice.open=false;day=1;enterHollisFarmhouse();var soupMerta=NPC_REGISTRY.merta;');
  assert.deepEqual(J(g,'[soupMerta.x/TILE,soupMerta.y/TILE,soupMerta.facing]'),[9.5,3.5,'right']);
  assert.equal(g.run('soupMerta.solid'),true);
  assert.equal(g.run('canWalk(soupMerta.x,soupMerta.y)'),false,'Merta keeps normal NPC collision');
  // Walk a real traversable aisle from the unchanged doorway to a talkable
  // point below Merta. Sample every pixel, so a tile-centre-only check cannot
  // miss an NPC body blocking a segment.
  for(const [dx,dy,count]of [[0,-1,96],[1,0,64],[0,-1,136]]){
    for(let i=0;i<count;i++){
      assert.equal(g.run('canWalk(player.x+'+dx+',player.y+'+dy+')'),true,'door-to-Merta route remains open');
      g.run('player.x+='+dx+';player.y+='+dy+';');
    }
  }
  assert.equal(g.run('Math.hypot(player.x-soupMerta.x,player.y-soupMerta.y)<TALK_RADIUS'),true);
  g.run('stats.hp=8;stats.maxHp=20;statusEffects=["poison","muddied"];');
  g.press('Enter');
  assert.equal(g.run('choice.open'),true,'ordinary Enter reaches Merta in new position');
  assert.match(g.run('choice.options[0]'),/Sour Mushroom Soup/);
  g.press('Enter');
  assert.equal(g.run('stats.hp'),13);
  assert.deepEqual(J(g,'statusEffects'),[],'existing soup cure preserved');
  // Capture the existing Canvas renderer rather than introducing an asset or
  // a second furniture authority. The pot stays on the original NE hearth.
  const capture=()=>J(g,`(function(){
    var calls=[],old=ctx.fillRect;
    ctx.fillRect=function(x,y,w,h){calls.push([ctx.fillStyle,x,y,w,h]);};
    try{tick=32;drawHollisFarmhouseFurniture();}finally{ctx.fillRect=old;}
    return calls;
  })()`);
  const calls=capture();
  assert.ok(calls.some(c=>JSON.stringify(c)===JSON.stringify(['#b06a3a',328,74,16,9])),'copper pot sits at existing hearth tile10,2');
  assert.ok(calls.some(c=>c[0]==='#d7c08b'),'open soup surface is visible');
  assert.deepEqual(capture(),calls,'same tick renders deterministic furniture');
  g.run('inHollisFarmhouse=false;');
  assert.deepEqual(capture(),[],'farmhouse renderer remains location gated');
  assert.equal(g.run('SAVE_VERSION'),5);
 }
};
