'use strict';
const assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const texts=p=>p.filter(c=>c.type==='text').map(c=>c.args[0]);
const state=g=>g.run(`JSON.stringify({stats,statusEffects,slitherSpd,party:persistentParty.serialize(),
  flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),player,day,tick,inventory:stats.items,sequence:combatEnemyInstanceSequence,
  combat:[combat.active,combat.mode,combatPlayerState.hasParty(),canonicalPartyCombat.isActive()]})`);
const expectedGear={weapon:'Dragon Blade',armor:'Shadow Cloak',shield:'Mithril Shield',accessory:'Fen Mask'};
function fresh(multi=true){const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;Math=Object.create(Math);
  var fieldMenuRng=0;Math.random=()=>{fieldMenuRng++;throw Error('field menu used RNG')};${multi?'persistentParty.joinEsla();':''}`);return g;}
function open(g){g.press('m');assert.equal(g.run('menu.open'),true);}
function extra(g,index){g.run('menu.itemCursor=groupItems().length+'+index);g.press('Enter');}
const recorded=new WeakSet();
function paint(g,scale=1){if(!recorded.has(g)){record(g);recorded.add(g);}g.run(`paint=[];ctx.save();ctx.scale(${scale},${scale});drawMenu();ctx.restore()`);return J(g,'paint');}
function bounds(calls,limit){for(const c of calls)if(c.bounds)assert.ok(c.bounds[0]>=0&&c.bounds[1]>=0&&c.bounds[2]<=limit[0]&&c.bounds[3]<=limit[1],JSON.stringify(c));}
function third(){
 const read=fs.readFileSync;let g;try{fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);if(String(file).endsWith('/persistent-party.js'))s=s.replace('  lely:Object.freeze',"  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture',progression:Object.freeze({hpBase:20,hpPerLevel:2,atkBase:4,atkPerLevel:1,defBase:1,defEveryLevels:2,spdBase:5,spdEveryLevels:2})}),\n  lely:Object.freeze");return s;};g=fresh();}finally{fs.readFileSync=read;}
 g.run(`saveGame();var payload=JSON.parse(localStorage.getItem('verdantVale_save'));
  payload.party.order.push('fixture_third');payload.party.characters.push({characterId:'fixture_third',hp:5,maxHp:20,atk:4,def:1,spd:5,level:1,xp:0,statuses:[],equipment:{weapon:null,armor:null,shield:null,accessory:null},slitherSpeed:1});
  localStorage.setItem('verdantVale_save',JSON.stringify(payload));loadGame()`);return g;
}
function checkpointParty(){const g=fresh(false);g.run(`storyCheckpointLab.apply('mq5_assignment_ready');supervisorDialogueBody();finishDialogue();
 var guard=0;while(mq5AssignmentCutscene.getView().phase==='walking'){if(guard++>400)throw Error('MQ5 walk stalled');update()}finishDialogue()`);return g;}

test('solo menu recording, controls and absence of party hints remain exact',()=>{
 const g=fresh(false);g.run('menu.open=true;tick=32');const p=paint(g);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(p)).digest('hex'),'e09438d26b5b642e61e42ae8f6cce4b761c0a8f0128f33880ddd32a35712be4d');
 assert.doesNotMatch(texts(p).join(' '),/Member|1\/2|Esla|←\/→|◀/);g.press('ArrowRight');assert.equal(g.run('menu.itemCursor'),0);
 g.press('ArrowDown');assert.equal(g.run('menu.itemCursor'),1);g.press('Escape');assert.equal(g.run('menu.open'),false);
});

test('two-member pages open on Lely, wrap with arrows and A/D, reject repeats, and preserve command cursor',()=>{
 const g=fresh();open(g);g.run('menu.itemCursor=2');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');assert.ok(texts(paint(g)).includes('◀ LÉLY 1/2 ▶'));
 g.press('ArrowLeft');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');assert.equal(g.run('menu.itemCursor'),2);assert.ok(texts(paint(g)).includes('◀ ESLA 2/2 ▶'));
 g.press('ArrowRight');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');g.press('d');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');g.press('a');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');
 g.keydown('ArrowRight',{repeat:true});g.release('ArrowRight');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');
});

test('both pages expose the same complete character-sheet geometry from immutable canonical views',()=>{
 const g=checkpointParty();open(g);const v=J(g,'persistentParty.getFieldView()'),lely=paint(g),lt=texts(lely);
 for(const value of ['◀ LÉLY 1/2 ▶','Lv. 10','HP','120 / 120','XP','ATK '+v.members[0].effective.atk,'DEF '+v.members[0].effective.def,'SPD '+v.members[0].effective.spd,'Status  Normal','Weapon','Armor','Shield','Accessory','Dragon Blade','Shadow Cloak','Mithril Shield','Fen Mask'])assert.ok(lt.includes(value),value);
 assert.ok(lt.some(s=>s.startsWith('XP 25600 · NEXT ')));g.press('ArrowRight');const esla=paint(g),et=texts(esla);
 for(const value of ['◀ ESLA 2/2 ▶','Lv. 11','HP','80 / 80','XP','ATK '+v.members[1].effective.atk,'DEF '+v.members[1].effective.def,'SPD '+v.members[1].effective.spd,'Status  Normal',...Object.values(expectedGear)])assert.ok(et.includes(value),value);
 const positions=(calls,labels)=>Object.fromEntries(labels.map(label=>{const c=calls.find(c=>c.type==='text'&&c.args[0]===label);return[label,c&&c.args.slice(1,3)]}));
 const labels=['HP','XP','Weapon','Armor','Shield','Accessory'];assert.deepEqual(positions(lely,labels),positions(esla,labels));
 assert.equal(g.run('Object.isFrozen(persistentParty.getFieldView())&&Object.isFrozen(persistentParty.getFieldView().members[0].progression)'),true);
});

test('Unequip and Status open for the displayed member, return to it, and refresh exact owner data',()=>{
 const g=fresh();g.run(`stats.items=['Iron Sword','Iron Shield'].map(createItem);persistentParty.useFieldItem('esla','Iron Sword')`);open(g);g.press('ArrowRight');extra(g,2);
 assert.equal(g.run('menu.screen'),'partyUnequip');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');const before=J(g,'persistentParty.getFieldView().members');
 g.press('Enter');let after=J(g,'persistentParty.getFieldView().members');assert.deepEqual(after[0],before[0]);assert.equal(after[1].equipment.weapon,null);assert.notEqual(after[1].effective.atk,before[1].effective.atk);
 assert.ok(texts(paint(g)).includes('Empty'));g.press('b');assert.equal(g.run('menu.screen'),'main');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');
 extra(g,3);assert.equal(g.run('menu.screen'),'partyStatus');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');g.press('ArrowLeft');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');g.press('ArrowRight');g.press('b');assert.equal(g.run('menu.screen'),'main');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');
});

test('item targeting remains explicit and independent of the displayed page',()=>{
 const g=fresh();g.run(`stats.hp=1;stats.items=[createItem('Potion')]`);open(g);g.press('ArrowRight');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');g.press('Enter');
 let v=J(g,'partyFieldMenu.getView()');assert.equal(v.screen,'partyTarget');assert.equal(v.selectedId,'esla');assert.equal(v.selectedTargetId,'lely');g.press('b');
 assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');assert.equal(g.run('stats.hp'),1);assert.equal(g.run('stats.items.length'),1);
});

test('Fallen members retain fixed pages, status labels and equipment access without revival',()=>{
 const g=fresh();g.run(`stats.hp=0;statusEffects=['poison'];stats.shield=createItem('Iron Shield')`);open(g);const p=paint(g);assert.ok(texts(p).includes('Status  Fallen · Poison'));
 extra(g,2);g.press('ArrowDown');g.press('ArrowDown');g.press('Enter');assert.equal(g.run('stats.hp'),0);assert.equal(g.run('stats.shield'),null);assert.equal(g.run('stats.items.filter(i=>i.name==="Iron Shield").length'),1);g.press('b');g.press('ArrowRight');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');
});

test('three-member fixture pages stable authored slots without compaction',()=>{
 const g=third();open(g);const seen=[];for(let i=0;i<3;i++){const v=J(g,'partyFieldMenu.getView()');seen.push([v.selectedId,v.members.find(m=>m.characterId===v.selectedId).slot]);assert.ok(texts(paint(g)).some(s=>s.includes((i+1)+'/3')));g.press('ArrowRight');}
 assert.deepEqual(seen,[['lely',0],['esla',1],['fixture_third',2]]);assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');
 g.run(`stats.hp=0`);assert.equal(J(g,'persistentParty.getFieldView().members.map(m=>m.slot)').join(','),'0,1,2');
});

test('closing resets to Lely while save/load omits transient selection',()=>{
 const g=fresh();open(g);g.press('ArrowRight');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');g.press('Escape');open(g);assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');
 g.press('ArrowRight');g.run('saveGame();var saved=JSON.parse(localStorage.getItem("verdantVale_save"))');assert.doesNotMatch(g.run('JSON.stringify(saved)'),/selectedId|selectedTargetId|unequipCursor|partyStatus|partyUnequip/);
 g.press('Escape');g.run('loadGame()');open(g);assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');assert.equal(g.run('saved.version'),5);
});

test('page switching is read-only and consumes no RNG, identities, inventory, time or world state',()=>{
 const g=fresh(),before=state(g);open(g);const openState=state(g);for(let i=0;i<20;i++)g.press(i%2?'ArrowLeft':'ArrowRight');assert.equal(state(g),openState);
 assert.equal(g.run('fieldMenuRng'),0);assert.equal(g.run('combatEnemyInstanceSequence'),0);g.press('Escape');assert.equal(state(g),before);
});

test('all page and submenu geometry fits native and 2x canvases with correct cancel paths',()=>{
 const g=fresh();g.run(`stats.items=['Potion','Iron Sword','Steel Sword','Iron Shield','Fen Mask','Cat Armor'].map(createItem)`);open(g);
 for(const scale of [1,2]){bounds(paint(g,scale),[512*scale,480*scale]);g.press('ArrowRight');bounds(paint(g,scale),[512*scale,480*scale]);g.press('ArrowLeft');}
 extra(g,2);bounds(paint(g),[512,480]);g.press('b');assert.equal(g.run('menu.screen'),'main');extra(g,3);bounds(paint(g),[512,480]);g.press('b');
 g.run('menu.itemCursor=0');g.press('Enter');assert.equal(g.run('menu.screen'),'partyTarget');g.press('b');assert.equal(g.run('menu.screen'),'main');g.press('Escape');assert.equal(g.run('menu.open'),false);
});

test('controller owns selection and renderer/input add no competing member cursor or listener',()=>{
 const src=fs.readFileSync(require('path').join(__dirname,'../../party-field-menu.js'),'utf8'),render=fs.readFileSync(require('path').join(__dirname,'../../render-ui.js'),'utf8'),input=fs.readFileSync(require('path').join(__dirname,'../../input.js'),'utf8');
 assert.match(src,/let selectedId='lely'/);assert.match(src,/characterId===selectedId/);assert.doesNotMatch(render,/selected(Member|Character|Party)/);assert.equal((input.match(/addEventListener\('keydown'/g)||[]).length,1);
 assert.doesNotMatch(src,/Math\.random|combatEnemyInstanceSequence|joinEsla\(|SAVE_VERSION/);
});

module.exports={name:'Paged canonical party field menu: complete character sheets and transient member selection',run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}console.log('  '+checks.length+' paged field-menu checks passed');}};
