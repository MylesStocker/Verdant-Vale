'use strict';

const assert=require('assert/strict');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const ROOT=path.join(__dirname,'../..'),checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));

function freshLab(id='lely_esla_one') {
  const g=createContext();
  g.run(`resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);
    dialogue.open=false;menu.open=false;debugMenu.open=false;statusEffects=[];
    Math=Object.create(Math);var layoutRng=0;Math.random=()=>{layoutRng++;throw Error('renderer consumed RNG');};
    if(!partyCombatLab.enter(${JSON.stringify(id)}))throw Error('lab entry failed');`);
  record(g);return g;
}
function freshCanonical() {
  const g=createContext();
  g.run(`dialogue.open=false;persistentParty.joinEsla();
    Math=Object.create(Math);var layoutRng=0;Math.random=()=>{layoutRng++;throw Error('unexpected RNG');};
    canonicalPartyCombat.enter({enemies:['enemy_marsh_wisp'],escape:'fastest_living'});`);
  record(g);return g;
}
function draw(g,expression='partyCombatLab.getView()',scale=1) {
  g.run(`paint=[];ctx.save();ctx.scale(${scale},${scale});drawPartyBattle(${expression});ctx.restore();`);
  return J(g,'paint');
}
function snapshot(g) {return g.run(`JSON.stringify({stats,statusEffects,player,day,tick,dialogue,menu,debugMenu,
  combat:Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(combat)).filter(([,d])=>Object.hasOwn(d,'value')).map(([k,d])=>[k,d.value])),
  party:combatPlayerState.getView(),session:combatPlayerState.session.getView(),lab:partyCombatLab.getView(),
  canonical:canonicalPartyCombat.getView(),save:localStorage.getItem('verdantVale_save')})`);}
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const texts=calls=>calls.filter(c=>c.type==='text').map(c=>c.args);

test('one-enemy Lab and canonical views reuse the exact Chapter One singleton composition',()=>{
  const expected={anchorX:358,anchorY:168,nameX:16,nameY:22,hpX:16,hpY:26,hpWidth:130,hpHeight:7,
    hpTextX:152,hpTextY:33,targetCursorX:358,targetCursorY:63};
  const lab=freshLab(),canonical=freshCanonical();
  assert.deepEqual(J(lab,'SINGLETON_ENEMY_BATTLE_LAYOUT'),expected);
  for(const [g,expression] of [[lab,'partyCombatLab.getView()'],[canonical,'canonicalPartyCombat.getView()']]) {
    const layout=J(g,`partyBattleLayout(${expression}).enemies[0]`);
    assert.equal(layout.composition,'singleton');assert.equal(layout.anchorX,358);assert.equal(layout.anchorY,168);
    assert.equal(layout.x,16);assert.equal(layout.width,130);assert.equal(layout.label,'Marsh Wisp');
    const calls=draw(g,expression),labels=texts(calls);
    assert.ok(labels.some(([s,x,y])=>s==='Marsh Wisp'&&x===16&&y===22));
    assert.ok(calls.some(c=>c.type==='fillRect'&&c.args.join(',')==='16,26,130,7'&&c.style.fillStyle==='#0a1e18'));
    const enemy=J(g,`${expression}.enemies[0]`);
    assert.ok(labels.some(([s,x,y])=>s===`${enemy.hp} / ${enemy.maxHp}`&&x===152&&y===33));
  }
});

test('ordinary, boss, duplicate-capable and special enemies select by count without identity dispatch',()=>{
  const cases=[['enemy_marsh_wisp','Marsh Wisp'],['enemy_mulholland','Mulholland'],
    ['enemy_stone_crawler','Stone Crawler'],['enemy_basin_gull','Basin Gull']];
  for(const [id,name] of cases) {
    const g=freshLab();
    g.run(`var v=partyCombatLab.getView(),e=Object.freeze({...v.enemies[0],id:${JSON.stringify(id)},name:${JSON.stringify(name)}});
      window.__layoutView=Object.freeze({...v,enemies:Object.freeze([e])});`);
    const layout=J(g,'partyBattleLayout(__layoutView).enemies[0]');
    assert.equal(layout.composition,'singleton',id);assert.equal(layout.label,name,id);assert.ok(!layout.label.endsWith(' A'),id);
    assert.ok(texts(draw(g,'__layoutView')).some(([s])=>s===name),id);
  }
  const source=fs.readFileSync(path.join(ROOT,'render-party-battle.js'),'utf8');
  assert.match(source,/if\(count===1\)/);assert.doesNotMatch(source,/SINGLETON.*(?:IDS|TEMPLATES)|member\.id\s*===\s*['"]enemy_|switch\s*\(member\.id/);
});

test('target cursor is anchored above the classic right-side sprite',()=>{
  const g=freshLab();assert.ok(g.run('partyCombatLab.confirmCommand()'));
  const layout=J(g,'partyBattleLayout(partyCombatLab.getView())');
  assert.equal(layout.target.x,358);assert.equal(layout.target.y,63);assert.equal(layout.target.instanceId,layout.enemies[0].instanceId);
  const cursor=draw(g).filter(c=>c.type==='fill'&&c.style.fillStyle==='#f0e8b8');assert.equal(cursor.length,1);
  assert.equal((cursor[0].bounds[0]+cursor[0].bounds[2])/2,358);assert.equal(cursor[0].bounds[1],65);
});

test('historical HP, defeat dimming, Brace and departure remain instance-local in the singleton composition',()=>{
  const g=freshLab();
  for(const change of [
    'Object.freeze({...v.enemies[0],hp:9})',
    'Object.freeze({...v.enemies[0],hp:9,braced:true})',
    'Object.freeze({...v.enemies[0],hp:0})',
    'Object.freeze({...v.enemies[0],unusual:Object.freeze({...v.enemies[0].unusual,departed:true})})',
  ]) {
    g.run(`var v=partyCombatLab.getView(),e=${change};window.__historyView=Object.freeze({...v,enemies:Object.freeze([e])});`);
    const before=snapshot(g),calls=draw(g,'__historyView');assert.equal(snapshot(g),before);assert.equal(g.run('layoutRng'),0);
    assert.equal(J(g,'partyBattleLayout(__historyView).enemies[0].composition'),'singleton');
    if(g.run('__historyView.enemies[0].hp===9'))assert.ok(texts(calls).some(([s,x,y])=>s==='9 / 14'&&x===152&&y===33));
    if(g.run('__historyView.enemies[0].braced'))assert.ok(texts(calls).some(([s])=>s==='BRACE'));
    if(g.run('__historyView.enemies[0].hp===0'))assert.ok(calls.some(c=>c.style.globalAlpha===0.25));
    if(g.run('__historyView.enemies[0].unusual?.departed'))assert.ok(texts(calls).some(([s])=>s==='FLED'));
  }
});

test('one, two and three allies retain fixed lower slots beneath the upper-right enemy at both scales',()=>{
  for(const count of [1,2,3]) {
    const g=freshLab();
    g.run(`var v=partyCombatLab.getView(),members=v.party.slice(0,${Math.min(count,2)});
      if(${count}===3)members.push(Object.freeze({...v.party[0],characterId:'lely_lab',instanceId:'fixture_third',slot:2,name:'Third'}));
      window.__partySizeView=Object.freeze({...v,party:Object.freeze(members),effects:Object.freeze(members.map((m,i)=>v.effects[i]||Object.freeze({})))});`);
    const layout=J(g,'partyBattleLayout(__partySizeView)');assert.deepEqual(layout.allies.map(a=>a.x),[108,256,404].slice(0,count));
    assert.equal(layout.enemies[0].anchorY,168);assert.ok(layout.allies.every(a=>a.anchorY>=254));
    assert.ok([layout.enemies[0].anchorX,layout.enemies[0].anchorY,...layout.allies.flatMap(a=>[a.x,a.anchorY])].every(Number.isInteger));
    for(const scale of [1,2])for(const call of draw(g,'__partySizeView',scale).filter(c=>c.bounds)) {
      assert.ok(call.bounds[0]>=0&&call.bounds[1]>=0&&call.bounds[2]<=512*scale&&call.bounds[3]<=480*scale,JSON.stringify(call));
    }
  }
});

test('two- and three-enemy formation recordings remain byte-identical',()=>{
  const expected={lely_esla_two:'69ead4df925c0e8812d6b9d0afb6f6f7ba402a1ada07ee085a35d55311e41ca9',
    lely_esla_three:'5c775499555bb8beed6379299dab9d0019e3bb763d55670d0451f1ebf86e1bbb'};
  for(const [scenario,hash] of Object.entries(expected)) {
    const g=freshLab(scenario),layout=J(g,'partyBattleLayout(partyCombatLab.getView())');
    assert.ok(layout.enemies.every(e=>e.composition==='formation'));assert.equal(digest(draw(g)),hash,scenario);
  }
});

test('legacy Chapter One singleton draw calls remain byte-identical',()=>{
  const g=createContext();g.run(`resetLocationState();placeAtLocation('MAP',7.5*TILE,9.5*TILE);dialogue.open=false;menu.open=false;statusEffects=[];
    combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_marsh_wisp,hp:17,maxHp:30};combat.active=true;combat.flashTimer=0;combat.message='Legacy snapshot';`);
  record(g);g.run('paint=[];drawCombat();');
  assert.equal(digest(J(g,'paint')),'05e7b60931d628288c21dda9eb5e09a3de12ad21ca374dc83618e6d853c1b909');
});

test('layout, playback presentation and rendering remain read-only and RNG-free',()=>{
  const g=freshLab(),before=snapshot(g);for(let i=0;i<3;i++){assert.ok(J(g,'partyBattleLayout(partyCombatLab.getView())'));draw(g);}
  assert.equal(snapshot(g),before);assert.equal(g.run('layoutRng'),0);
  const source=fs.readFileSync(path.join(ROOT,'render-party-battle.js'),'utf8');
  assert.doesNotMatch(source,/Math\.random|combat\.enemy\s*=|stats\.[a-zA-Z]+\s*=|applyKillRewards|saveGame\(|loadGame\(/);
});

module.exports={name:'canonical one-enemy party battles reuse the classic singleton composition',checks,
  run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}
    console.log('  '+checks.length+' singleton-enemy party layout checks passed');}};
