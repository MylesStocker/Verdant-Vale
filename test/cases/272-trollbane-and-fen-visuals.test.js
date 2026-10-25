'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const FEN_IDS=['enemy_botfly','enemy_waspthra','enemy_sparkeel','enemy_mudwrack_snapper',
  'enemy_fen_rootworm','enemy_willow_veiled_stalker','enemy_hollowreed_choker','enemy_fen_zolom'];
function record(g){g.run(`var paints=[],shapePath=[],transform=[1,1,0,0],shapeStack=[];
  const shapePoint=(x,y)=>[x*transform[0]+transform[2],y*transform[1]+transform[3]];
  const emitShape=points=>paints.push({colour:ctx.fillStyle,bounds:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]});
  ctx.save=()=>shapeStack.push({transform:[...transform],fillStyle:ctx.fillStyle});
  ctx.restore=()=>{const saved=shapeStack.pop();transform=saved.transform;ctx.fillStyle=saved.fillStyle;};
  ctx.translate=(x,y)=>{transform[2]+=x*transform[0];transform[3]+=y*transform[1];};
  ctx.scale=(x,y)=>{transform[0]*=x;transform[1]*=y;};
  ctx.fillRect=(x,y,w,h)=>emitShape([shapePoint(x,y),shapePoint(x+w,y+h)]);
  ctx.beginPath=()=>{shapePath=[];};ctx.moveTo=ctx.lineTo=(x,y)=>shapePath.push(shapePoint(x,y));ctx.closePath=()=>{};
  ctx.fill=()=>emitShape(shapePath);ctx.measureText=text=>({width:String(text).length*8});
`);}
module.exports={name:'Trollbane battle lifetime, concise messages and Eastern Fens sprite coverage',run(){
  // Exercise the retained singleton owner directly, including item consumption,
  // complete message pages, indefinite suppression, and the normal cleanup path.
  const g=createContext();
  assert.equal(g.run('rehydrateItem({name:"Trollbane",type:"stun",stunTurns:3,battleOnly:true,price:15}).name'),'Trollbane','old saved Trollbane metadata still loads');
  g.run(`Math=Object.create(Math);Math.random=()=>{throw Error('unexpected RNG')};dialogue.open=false;
    combat.active=true;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_rotwood_troll,hp:40};
    combat.phase='item';combat.itemCursor=0;stats.items=[{...ITEM_REGISTRY.Trollbane}];handleCombatAction();`);
  assert.equal(g.run('stats.items.length'),0);
  const messages=J(g,'[combat.message,...combat.messageQueue.map(m=>typeof m==="string"?m:m.text)]');
  assert.ok(messages.includes('It cannot heal for the rest of this battle.'));
  assert.ok(messages.every(m=>m.length<90),'each authored message fits a complete short page');
  assert.ok(!messages.join(' ').includes('for a while'));
  for(let round=0;round<10;round++)g.run('var blockedHeal=enemyRegenEntry(combat.enemy);if(blockedHeal)blockedHeal.apply();');
  assert.equal(g.run('combat.enemy.hp'),40);
  assert.equal(g.run('combat.enemyStunTurns'),1);
  g.run('endCombat();combat.active=true;combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_rotwood_troll,hp:40};enemyRegenEntry(combat.enemy).apply();');
  assert.equal(g.run('combat.enemy.hp'),46,'a later fight heals normally');
  assert.equal(g.run('ENEMY_TEMPLATE_REGISTRY.enemy_rotwood_troll.hp'),g.run('ENEMY_TEMPLATE_REGISTRY.enemy_rotwood_troll.maxHp'));
  g.run('endCombat();');

  // Sprites must paint shaped, coloured creatures, respect their declared bounds
  // before clipping at every idle phase, and never call gameplay RNG.
  const art=createContext();record(art);art.run('Math=Object.create(Math);Math.random=()=>{throw Error("sprite RNG")};');
  const signatures=new Set();
  for(const id of FEN_IDS){
    assert.equal(art.run('ENEMY_GENERIC_SPRITE_IDS.has('+JSON.stringify(id)+')'),false,id);
    const bounds=J(art,'FORMATION_SPRITE_BOUNDS.get(ENEMY_SPRITE_DISPATCH['+JSON.stringify(id)+'].draw)');
    assert.ok(bounds,id+' has layout bounds');
    for(const tick of [0,13,39,81]){
      art.run('paints=[];tick='+tick+';ENEMY_SPRITE_DISPATCH['+JSON.stringify(id)+'].draw(0,0);');
      const paints=J(art,'paints');assert.ok(paints.length>=12,id+' has substantive sprite geometry');
      assert.ok(new Set(paints.map(p=>p.colour)).size>=6,id+' has a readable palette');
      for(const p of paints)assert.ok(p.bounds.every(Number.isFinite)&&p.bounds[0]>=bounds[0]&&p.bounds[1]>=bounds[1]&&p.bounds[2]<=bounds[2]&&p.bounds[3]<=bounds[3],id+': '+JSON.stringify(p.bounds)+' inside '+JSON.stringify(bounds));
      if(tick===0)signatures.add(JSON.stringify(paints));
    }
  }
  assert.equal(signatures.size,FEN_IDS.length,'all eight enemies retain distinguishable art');
  // Real immutable canonical views must resolve the sprite in singleton,
  // duplicate and three-enemy layouts, including existing shared Mire Toad art.
  for(const id of [...FEN_IDS,'enemy_mire_toad_male','enemy_mire_toad_female'])for(const n of [1,2,3]){
    const battle=createContext();battle.run('dialogue.open=false;Math=Object.create(Math);Math.random=()=>{throw Error("render RNG")};canonicalPartyCombat.enter({enemies:'+JSON.stringify(Array(n).fill(id))+',escape:"fastest_living"});');
    const before=battle.run('JSON.stringify({combat:canonicalPartyCombat.getView(),stats,sequence:combatEnemyInstanceSequence})');
    battle.run('drawPartyBattle(canonicalPartyCombat.getView());');
    assert.equal(battle.run('JSON.stringify({combat:canonicalPartyCombat.getView(),stats,sequence:combatEnemyInstanceSequence})'),before);
    assert.equal(battle.run('partyBattleLayout(canonicalPartyCombat.getView()).enemies.length'),n);
  }
  // Related small content fixes retain their state gates and ordinary stat label.
  const content=createContext();assert.equal(content.run('itemStatLabel(ITEM_REGISTRY["Fen Mask"])'),'SPD +5');
  assert.equal(content.run('ENEMY_TEMPLATE_REGISTRY.enemy_road_impostor.name'),'Highwayman');
  for(const [assigned,started,returned,expected]of [[false,false,false,false],[true,false,false,true],[true,true,false,false],[true,false,true,false]]){
    content.run('day=5;fort_quest_started='+assigned+';schilling_quest_started='+started+';schilling_returned='+returned+';refreshJobBoard();');
    assert.equal(content.run('JOB_BOARD_NOTICES.some(n=>n.includes("talk to Pip at the School"))'),expected);
  }
}};
