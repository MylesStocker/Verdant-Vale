'use strict';
const assert=require('assert/strict');
const {J,fresh,place,until,dismiss,reachable}=require('./301-mornay-manifest.test');
const {walk}=require('./311-mornay-furnished-door-walks.test');
function enterByWalking(g,b){
 walk(g,(b.returnCol+.5)*32,(b.returnRow+.5)*32,b.id+' doorway approach');
 until(g,b.returnRow>b.doorRow?'ArrowUp':'ArrowDown',()=>g.run('mapIdForRef(activeMap)')===b.mapId);
 assert.equal(g.run('townBuilding'),b.id);
}
function descend(g,home){
 walk(g,240,432,home.id+' downstairs approach');
 until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')===home.sourceMapId);
}
function exitShop(g,shop){
 walk(g,240,432,shop.id+' street exit approach');
 until(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')===shop.sourceMapId);
 assert.equal(g.run('townBuilding'),null);assert.equal(g.run('canWalk(player.x,player.y)'),true);
}
// Unlike the manifest helper, this walks to the unshadowed talk position.
function converseByWalking(g,id){
 const npc=J(g,`MORNAY_NPCS.find(n=>n.id===${JSON.stringify(id)})`);
 assert.equal(npc.map,g.run('currentContentLocationKey()'),id+' belongs to this room');
 const radius=g.run('TALK_RADIUS');
 const point=reachable(g).find(([x,y])=>Math.hypot(x-npc.x,y-npc.y)<radius&&
  g.run(`SIMPLE_NPCS.find(n=>n.map===currentContentLocationKey()&&Math.hypot(${x}-n.x,${y}-n.y)<TALK_RADIUS)?.id`)===id);
 assert.ok(point,id+' has an unshadowed talk position reachable from the entrance');
 walk(g,...point,id+' conversation approach');
 g.press(' ');assert.equal(g.run('dialogue.open'),true);assert.equal(g.run('dialogue.name'),npc.name);
 dismiss(g);
}
function assertVisibleStair(g,up,home){
 g.run('stairProbe=[];');g.renderFrame();
 const stairs=J(g,'stairProbe');assert.equal(stairs.length,1,home.id+' one visible connection on this floor');
 const stair=stairs[0];assert.equal(stair.up,up,home.id+' appropriate stair direction');
 // Bind art to the actual traversable connection, without duplicating its art coordinates.
 assert.equal(g.run(`activeMap[${stair.row}][${stair.col}]===${up?'HOUSE_DOOR':'INTERIOR_EXIT'}`),true);
 if(up)assert.equal(g.run(`mornayDoorAt(mapIdForRef(activeMap),${stair.col},${stair.row})?.id`),home.id);
}
module.exports={
 name:'Mornay entrance compatibility and shop homes: old southern saves walk north out; real stairs, upstairs conversations, one purchase and save/load preserve the complete street journey',
 run(){
  const flipped=['boarding','court','reed_home','pate_home','vale_home','dane_home','dock_steps','south_rows'];
  const families=[['kelm_home','provisioner',['mornay_adra_kelm']],['stern_home','apothecary',['mornay_ilda_stern']],['sorn_home','workgear',['mornay_henric_sorn','mornay_berren_sorn']]];
  for(const legacy of [false,true])for(const day of [1,5]){
   const g=fresh(legacy);g.run(`day=${day};stats.gold=1000;`);
   const rooms=J(g,'MORNAY_BUILDINGS');
   for(const key of flipped){
    const b=rooms.find(r=>r.key===key);assert.ok(b,key+' established room');
    place(g,b.sourceMapId);assert.equal(g.run('saveGame()'),true);
    // Historical v5 payload: these rooms formerly arrived at the southern stem.
    // Loading, rather than placing directly inside, exercises save preflight too.
    g.run(`var oldEntranceSave=JSON.parse(localStorage.getItem('verdantVale_save'));
     oldEntranceSave.location={kind:'discrete',mapId:${JSON.stringify(b.mapId)},localPxX:240,localPxY:432};
     oldEntranceSave.townBuilding=${JSON.stringify(b.id)};oldEntranceSave.player.facing='up';
     localStorage.setItem('verdantVale_save',JSON.stringify(oldEntranceSave));`);
    const before=J(g,'({party:persistentParty.getView(),day,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})');
    assert.equal(g.run('loadGame()'),true,b.id+' accepts the historical arrival');dismiss(g);
    assert.equal(g.run('townBuilding'),b.id);assert.deepEqual(J(g,'[player.x,player.y]'),[240,432]);
    assert.equal(g.run('canWalk(player.x,player.y)'),true,b.id+' old placement stays valid');
    walk(g,240,48,b.id+' old southern save traverses the whole furnished room');
    until(g,'ArrowUp',()=>g.run('mapIdForRef(activeMap)')===b.sourceMapId);
    assert.equal(g.run('townBuilding'),null,b.id+' north exit returns outside');
    assert.deepEqual(J(g,'[player.x,player.y]'),[(b.returnCol+.5)*32,(b.returnRow+.5)*32]);
    assert.deepEqual(J(g,'({party:persistentParty.getView(),day,flags:QUEST_FLAG_BINDINGS.map(b=>b.get())})'),before,'old-save escape changes no progression');
   }
   g.run(`var stairProbe=[],drawStairsOriginal=drawMornayStairs;
    drawMornayStairs=function(col,row,up){stairProbe.push({col,row,up});return drawStairsOriginal(col,row,up);};`);
   for(const [homeKey,service,residents]of families){
    const home=rooms.find(r=>r.key===homeKey),shop=rooms.find(r=>r.mapId===home?.sourceMapId);
    assert.ok(home&&shop,homeKey+' registered above its shop');
    const keeper=J(g,`MORNAY_NPCS.find(n=>n.service===${JSON.stringify(service)})`);
    place(g,shop.sourceMapId);enterByWalking(g,shop);
    assertVisibleStair(g,true,home);enterByWalking(g,home);assertVisibleStair(g,false,home);
    for(const id of residents){
     converseByWalking(g,id);
     // Henric now offers private stock upstairs; leave it before visiting family.
     if(id==='mornay_henric_sorn'){
      assert.equal(g.run('shop.open'),true);g.press('Escape');assert.equal(g.run('shop.open'),false);
     }
    }
    assert.equal(g.run('saveGame()'),true);
    const upstairs=J(g,'[player.x,player.y]'),partyBefore=J(g,'persistentParty.getView()');
    descend(g,home);assert.equal(g.run('townBuilding'),shop.id);
    assert.equal(g.run('loadGame()'),true);dismiss(g);
    assert.equal(g.run('mapIdForRef(activeMap)'),home.mapId);assert.equal(g.run('townBuilding'),home.id);
    assert.deepEqual(J(g,'[player.x,player.y]'),upstairs);assert.deepEqual(J(g,'persistentParty.getView()'),partyBefore);
    descend(g,home);assert.equal(g.run('townBuilding'),shop.id);
    converseByWalking(g,keeper.id);assert.equal(g.run('shop.open'),true,service+' keeper still serves after returning downstairs');
    assert.equal(g.run('MORNAY_NPCS.find(n=>n.id==='+JSON.stringify(keeper.id)+').map'),keeper.map,'keeper stays at the counter');
    const gold=g.run('stats.gold'),items=J(g,'stats.items.map(i=>i.name)'),item=J(g,'shop.stock[0]');
    g.press('Enter');assert.equal(g.run('shop.screen'),'buy');g.press('Enter');
    assert.equal(g.run('stats.gold'),gold-item.price);assert.deepEqual(J(g,'stats.items.map(i=>i.name)'),items.concat(item.name));
    g.press('Escape');g.press('Escape');assert.equal(g.run('shop.open'),false);g.frames(2);
    assert.equal(g.run('stats.gold'),gold-item.price,'one input purchase debits exactly once');
    assert.deepEqual(J(g,'stats.items.map(i=>i.name)'),items.concat(item.name),'one input purchase adds exactly one item');
    const bought=J(g,'persistentParty.getView()'),savedPosition=J(g,'[player.x,player.y]');
    assert.equal(g.run('saveGame()'),true);exitShop(g,shop);
    assert.equal(g.run('loadGame()'),true);dismiss(g);
    assert.equal(g.run('mapIdForRef(activeMap)'),shop.mapId);assert.equal(g.run('townBuilding'),shop.id);
    assert.deepEqual(J(g,'[player.x,player.y]'),savedPosition);assert.deepEqual(J(g,'persistentParty.getView()'),bought,'shop purchase survives reload');
    exitShop(g,shop);assert.deepEqual(J(g,'persistentParty.getView()'),bought,'walking outside cannot repeat the purchase');
   }
  }
 }
};
