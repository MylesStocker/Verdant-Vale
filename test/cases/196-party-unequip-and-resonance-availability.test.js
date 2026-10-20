'use strict';
const assert=require('assert/strict'),crypto=require('crypto');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const snapshot=g=>g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),
  menu,player,day,tick,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),sequence:combatEnemyInstanceSequence})`);
const gameplay=g=>g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),
  player,day,tick,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),sequence:combatEnemyInstanceSequence})`);
function fresh(){const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;Math=Object.create(Math);
  var auditRng=0;Math.random=()=>{auditRng++;throw Error('unexpected RNG')};persistentParty.joinEsla({level:11})`);return g;}
function open(g){g.press('m');assert.equal(g.run('menu.open'),true);}
function extra(g,index){g.run('menu.itemCursor=groupItems().length+'+index);g.press('Enter');}
function recruitFromCheckpoint(g){
 assert.equal(g.run(`storyCheckpointLab.apply('mq5_assignment_ready')`),true);
 g.run('supervisorDialogueBody();finishDialogue()');let guard=0;
 while(g.run(`mq5AssignmentCutscene.getView().phase==='walking'`)){g.frames(1);assert.ok(guard++<400);}
 g.run('finishDialogue()');assert.equal(g.run('MainQuest'),5);
}
function geographicBattle(g){
 g.run(`placeAtLocation('MAP2',8.5*TILE,8.5*TILE);var pool=currentEncounterPool(),at=pool.findIndex(t=>t.id==='enemy_marsh_wisp');
   var selection=[(at+.5)/pool.length,.5];Math.random=()=>{auditRng++;return selection.shift()??.5};startCombat();
   Math.random=()=>{auditRng++;throw Error('unexpected combat RNG')}`);
 assert.equal(g.run('canonicalPartyCombat.isActive()'),true);
}
function draftLelyObserve(g){
 const input=k=>g.run('canonicalPartyCombat.handleInput('+JSON.stringify(k)+')');
 assert.equal(g.run('canonicalPartyCombat.getView().currentAlly.characterId'),'lely');
 input('right');input('right');assert.equal(g.run('canonicalPartyCombat.getView().selectedCommand'),'observe');input('confirm');input('confirm');
 assert.equal(g.run('canonicalPartyCombat.getView().currentAlly.characterId'),'esla');
}

test('multi-member menu replaces Equipment with Unequip while the solo recording remains exact',()=>{
 const solo=createContext();solo.run('dialogue.open=false;menu.open=true;tick=32');record(solo);solo.run('paint=[];ctx.save();drawMenu();ctx.restore()');
 assert.equal(crypto.createHash('sha256').update(solo.run('JSON.stringify(paint)')).digest('hex'),'e09438d26b5b642e61e42ae8f6cce4b761c0a8f0128f33880ddd32a35712be4d');
 const g=fresh();open(g);record(g);g.run('paint=[];drawMenu()');const labels=J(g,'paint.filter(c=>c.type==="text").map(c=>c.args[0])');
 assert.ok(labels.includes('[ Unequip ]'));assert.equal(labels.includes('[ Equipment ]'),false);extra(g,2);assert.equal(g.run('menu.screen'),'partyUnequip');
 assert.deepEqual(J(g,'partyFieldMenu.getView().unequipSlots.map(s=>[s.id,s.label,s.enabled])'),[
  ['weapon','Weapon',false],['armor','Armor',false],['shield','Shield',false],['accessory','Accessory',false]]);
});

test('all four Esla slots unequip independently, refresh stats, and return exactly one shared copy',()=>{
 const g=fresh();open(g);g.press('ArrowRight');extra(g,2);const before=J(g,'persistentParty.getFieldView().members');
 const ids=['Dragon Blade','Shadow Cloak','Mithril Shield','Fen Mask'];
 for(let i=0;i<4;i++){
  const count=g.run('stats.items.filter(item=>item.name==='+JSON.stringify(ids[i])+').length');g.press('Enter');
  assert.equal(g.run('persistentParty.getFieldView().members[1].equipment.'+['weapon','armor','shield','accessory'][i]),null);
  assert.equal(g.run('stats.items.filter(item=>item.name==='+JSON.stringify(ids[i])+').length'),count+1);
  const once=snapshot(g);g.press('Enter');assert.equal(snapshot(g),once);if(i<3)g.press('ArrowDown');
 }
 const after=J(g,'persistentParty.getFieldView().members');assert.deepEqual(after[0],before[0]);
 assert.ok(after[1].effective.atk<before[1].effective.atk);assert.ok(after[1].effective.def<before[1].effective.def);assert.ok(after[1].effective.spd<before[1].effective.spd);
 assert.equal(g.run('auditRng'),0);assert.equal(g.run('combatEnemyInstanceSequence'),0);
});

test('Lely and Esla ownership, Fallen access, cancel and malformed-state rejection are atomic',()=>{
 const g=fresh();g.run(`stats.weapon=createItem('Iron Sword');stats.armor=createItem('Leather Armor');stats.shield=createItem('Iron Shield');stats.accessory=createItem('Swift Bangle');stats.hp=0`);
 open(g);extra(g,2);const beforeEsla=J(g,'persistentParty.getFieldView().members[1]');g.press('Enter');
 assert.equal(g.run('stats.weapon'),null);assert.deepEqual(J(g,'persistentParty.getFieldView().members[1]'),beforeEsla);assert.equal(g.run('stats.hp'),0);
 g.press('b');assert.equal(g.run('menu.screen'),'main');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');
 g.press('ArrowRight');extra(g,2);const cancelled=gameplay(g);g.press('b');assert.equal(gameplay(g),cancelled);
 const stable=snapshot(g);assert.throws(()=>g.run(`persistentParty.unequipFieldEquipment('esla','missing')`));assert.equal(snapshot(g),stable);
 g.run(`stats.weapon={name:'Iron Sword'}`);const malformed=snapshot(g);assert.throws(()=>g.run(`persistentParty.unequipFieldEquipment('esla','weapon')`));assert.equal(snapshot(g),malformed);
});

test('equipment items still install through explicit Items targeting and save/load preserves exchanges',()=>{
 const g=fresh();g.run(`stats.items=[createItem('Iron Sword')]`);open(g);g.press('ArrowRight');
 g.run(`menu.itemCursor=groupItems().findIndex(row=>row.name==='Iron Sword')`);g.press('Enter');assert.equal(g.run('menu.screen'),'partyTarget');
 assert.equal(g.run('partyFieldMenu.getView().selectedTargetId'),'lely');g.press('ArrowDown');g.press('Enter');assert.equal(g.run('persistentParty.getMember("esla").equipment.weapon'),'Iron Sword');
 extra(g,2);g.press('Enter');assert.equal(g.run('persistentParty.getMember("esla").equipment.weapon'),null);g.press('b');g.press('Escape');
 assert.equal(g.run('saveGame()'),true);const expected=J(g,'persistentParty.getFieldView()');g.run('persistentParty.resetForNewGame()');assert.equal(g.run('loadGame()'),true);assert.deepEqual(J(g,'persistentParty.getFieldView()'),expected);assert.equal(g.run('SAVE_VERSION'),5);
});

test('real checkpoint recruitment and first battle authenticate No wounded ally without changing Quickbloom',()=>{
 const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;Math=Object.create(Math);var auditRng=0;Math.random=()=>{auditRng++;throw Error('unexpected RNG')}`);
 recruitFromCheckpoint(g);assert.deepEqual(J(g,'persistentParty.getFieldView().members.map(m=>[m.characterId,m.hp,m.maxHp])'),[['lely',120,120],['esla',80,80]]);
 geographicBattle(g);let availability=J(g,'canonicalPartyCombat.getView().resonanceAvailability');assert.equal(availability[0].disabledReason,'No wounded ally');
 draftLelyObserve(g);const command=J(g,'canonicalPartyCombat.getView().commandAvailability.find(row=>row.command==="resonance")');
 assert.deepEqual(command,{command:'resonance',enabled:false,disabledReason:'No wounded ally'});assert.deepEqual(J(g,'canonicalPartyCombat.getView().techniques'),[]);
});

test('wounded ally targeting is exact and stable; Fallen targets are excluded',()=>{
 for(const scenario of [{lely:20,esla:80,targets:['lely']},{lely:30,esla:70,targets:['esla']},{lely:20,esla:70,targets:['lely','esla']},{lely:0,esla:70,targets:['esla']}]){
  const g=fresh();g.run(`stats.hp=${scenario.lely};saveGame();var payload=JSON.parse(localStorage.getItem('verdantVale_save'));payload.party.characters[0].hp=${scenario.esla};localStorage.setItem('verdantVale_save',JSON.stringify(payload));loadGame();dialogue.open=false`);
  geographicBattle(g);if(scenario.lely>0)draftLelyObserve(g);
  assert.equal(g.run('canonicalPartyCombat.getView().currentAlly.characterId'),'esla');
  const row=J(g,'canonicalPartyCombat.getView().commandAvailability.find(row=>row.command==="resonance")');assert.deepEqual(row,{command:'resonance',enabled:true,disabledReason:null});
  const input=k=>g.run('canonicalPartyCombat.handleInput('+JSON.stringify(k)+')');input('right');input('confirm');input('confirm');
  assert.deepEqual(J(g,'canonicalPartyCombat.getView().validTargetIds.map(id=>canonicalPartyCombat.getView().party.find(m=>m.instanceId===id).characterId)'),scenario.targets);
 }
 const fallen=fresh();fallen.run(`saveGame();var payload=JSON.parse(localStorage.getItem('verdantVale_save'));payload.party.characters[0].hp=0;localStorage.setItem('verdantVale_save',JSON.stringify(payload));loadGame();dialogue.open=false`);
 geographicBattle(fallen);assert.equal(J(fallen,'canonicalPartyCombat.getView().resonanceAvailability')[0].disabledReason,'Esla is Fallen');
});

test('availability reason is controller-owned and the renderer retains its established dim-only behavior',()=>{
 const g=fresh();g.run(`partyCombatLab.enter('command_showcase');partyCombatLab.submitAttack({actorId:partyCombatLab.getView().nextActorId,targetId:partyCombatLab.getView().enemies[0].instanceId})`);
 assert.equal(g.run('partyCombatLab.getView().commandAvailability.find(row=>row.command==="resonance").disabledReason'),null);
 const before=snapshot(g);record(g);g.run('paint=[];drawPartyCombatLabBattle()');assert.equal(snapshot(g),before);
 assert.equal(J(g,'paint.filter(c=>c.type==="text").map(c=>c.args[0])').includes('No wounded ally'),false);
});

module.exports={name:'Party field Unequip and authenticated Resonance availability',run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}console.log('  '+checks.length+' party Unequip/Resonance availability checks passed');}};
