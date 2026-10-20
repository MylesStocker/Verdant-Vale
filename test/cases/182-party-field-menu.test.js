'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {createContext,scriptOrderFromIndexHtml}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,s)=>JSON.parse(g.run('JSON.stringify('+s+')'));
const view=g=>J(g,'persistentParty.getFieldView()');
const state=g=>g.run('JSON.stringify({stats,party:persistentParty.serialize(),statusEffects,slitherSpd,player,day,tick,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),seq:combatEnemyInstanceSequence})');
const frozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const d of Object.values(Object.getOwnPropertyDescriptors(v))){assert.ok('value'in d);frozen(d.value);}}};
function fresh(multi=true){const g=createContext();g.run('dialogue.open=false;Math=Object.create(Math);Math.random=()=>{throw Error("unexpected RNG")};'+(multi?'persistentParty.joinEsla();':''));return g;}
function seed(g,edit){g.run('saveGame();var payload=JSON.parse(localStorage.getItem("verdantVale_save"));'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(payload));');assert.equal(g.run('loadGame()'),true);}
function open(g){g.press('m');assert.equal(g.run('menu.open'),true);}
function extra(g,offset){g.run('menu.itemCursor=groupItems().length+'+offset);g.press('Enter');}
function item(g,id){g.run('menu.itemCursor=groupItems().findIndex(g=>g.name==='+JSON.stringify(id)+');');g.press('Enter');}
const recorded=new WeakSet();
function draw(g){if(!recorded.has(g)){record(g);recorded.add(g);}g.run('paint=[];ctx.save();drawMenu();ctx.restore()');return J(g,'paint');}
function texts(paint){return paint.filter(c=>c.type==='text').map(c=>c.args[0]);}
function bounds(paint){for(const c of paint){if(c.bounds){assert.ok(c.bounds[0]>=0&&c.bounds[1]>=0&&c.bounds[2]<=512&&c.bounds[3]<=480,JSON.stringify(c));}}}
function third(){
 const read=fs.readFileSync;let g;try{fs.readFileSync=function(file,...args){let s=read.call(this,file,...args);if(String(file).endsWith('/persistent-party.js'))s=s.replace('  lely:Object.freeze',"  fixture_third:Object.freeze({id:'fixture_third',slot:2,name:'Fixture',progression:Object.freeze({hpBase:20,hpPerLevel:2,atkBase:4,atkPerLevel:1,defBase:1,defEveryLevels:2,spdBase:5,spdEveryLevels:2})}),\n  lely:Object.freeze");return s;};g=fresh();}finally{fs.readFileSync=read;}
 seed(g,'payload.party.order.push("fixture_third");payload.party.characters.push({characterId:"fixture_third",hp:5,maxHp:20,atk:4,def:1,spd:5,level:1,xp:0,statuses:[],equipment:{weapon:null,armor:null,shield:null,accessory:null},slitherSpeed:1})');return g;
}

// Captured from checkpoint bb73177 before menu changes. No gameplay fields or
// drawing operations are filtered from these historical recordings.
const SOLO_HASHES={
  "empty": "e09438d26b5b642e61e42ae8f6cce4b761c0a8f0128f33880ddd32a35712be4d",
  "loaded": "e738eefe6f59131b55bd7e6144b041771c2a51b1c7a261d5d1fe9680be60106e",
  "scroll": "97be437da3b184bf07a283d29104b358fa88fba93b708c03d772929555e46ec4",
  "ailments": "8fae0d1ca4b8f3067e2a469e24a74413b843d4c80e1c7f201ce24ac8c4bf4343",
  "save": "1843275fc0b0399464cf96b2a9dfb67c6c474dc970d9a513b992b5eb71ef63cd",
  "load": "468027076f19c36815ea75cd47599081e9cb18a3369944f4eb2f82cd526a9910",
  "notebook": "ee4c77ee66dab5f02d6c4f4f8ebcd3ed947f0039e5ea222f09ebc08b7a54ce71",
  "fallen": "82f84803a507107b1cf371f79ce54655f61e7d59b1f6333594c1df520cc8e223"
};
const SOLO_CASES={empty:'',loaded:'stats.hp=11;stats.xp=42;stats.gold=73;stats.items=["Potion","Potion","Iron Sword","Elixir","Bait","Reed Remedy"].map(createItem);',
 scroll:'stats.items=["Potion","Elixir","Iron Sword","Bait","Reed Remedy","Amethyst Dust","Iron Shield"].map(createItem);menu.itemCursor=5;menu.scrollOffset=2;',
 ailments:'statusEffects=["cursed","muddied","slither","poison"];slitherSpd=13;stats.weapon=createItem("Iron Sword");stats.accessory=createItem("Fen Mask");',
 save:'menu.screen="saveConfirm";',load:'menu.screen="loadConfirm";',notebook:'menu.screen="notebook";',fallen:'stats.hp=0;'};
test('eight historical solo menu recordings are draw-call identical with no future-party hints',()=>{
 for(const [name,setup]of Object.entries(SOLO_CASES)){
  const g=fresh(false);g.run('menu.open=true;tick=32;'+setup);const p=draw(g);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(p)).digest('hex'),SOLO_HASHES[name],name);
  assert.doesNotMatch(texts(p).join(' '),/Esla|CHARACTERS|party|member|Resonance|Strain/i);
 }
});
test('solo navigation, direct heal/equip, save/load and Notebook remain unchanged',()=>{
 const g=fresh(false);g.run('stats.hp=1;stats.items=["Potion","Iron Sword"].map(createItem)');open(g);
 g.press('Enter');assert.equal(g.run('stats.hp'),21);assert.equal(g.run('menu.screen'),'main');
 g.press('Enter');assert.equal(g.run('stats.weapon.name'),'Iron Sword');assert.equal(g.run('stats.items.length'),0);
 g.press('n');assert.equal(g.run('menu.screen'),'notebook');g.press('b');g.press('Enter');assert.equal(g.run('menu.screen'),'saveConfirm');
 g.press('Enter');assert.equal(g.run('menu.screen'),'main');g.press('ArrowDown');g.press('Enter');assert.equal(g.run('menu.screen'),'loadConfirm');g.press('b');g.press('Escape');assert.equal(g.run('menu.open'),false);
});
test('two-member character page opens on Lely, fits the canvas and mutates nothing',()=>{
 const g=fresh();open(g);const before=state(g),nav=g.run('JSON.stringify(menu)');const p=draw(g);bounds(p);
 assert.ok(texts(p).includes('◀ LÉLY 1/2 ▶'));assert.equal(texts(p).some(t=>/ESLA/.test(t)),false);
 assert.equal(texts(p).filter(t=>/^Lv\./.test(t)).length,1);assert.equal(state(g),before);assert.equal(g.run('JSON.stringify(menu)'),nav);
 frozen(g.run('partyFieldMenu.getView()'));assert.deepEqual(draw(g),p);
});
test('item targeting preserves list cursor/scroll on cancel and consumes exactly one on success',()=>{
 const g=fresh();g.run('stats.items=["Iron Sword","Elixir","Bait","Reed Remedy","Potion","Potion"].map(createItem);stats.hp=2');seed(g,'payload.party.characters[0].hp=3');open(g);
 g.run('menu.itemCursor=4;menu.scrollOffset=2');const before=state(g);g.press('Enter');assert.equal(g.run('menu.screen'),'partyTarget');
 g.press('ArrowDown');g.press('b');assert.equal(state(g),before);assert.equal(g.run('menu.itemCursor'),4);assert.equal(g.run('menu.scrollOffset'),2);
 g.press('Enter');g.press('ArrowDown');g.press('Enter');assert.deepEqual(view(g).members.map(m=>m.hp),[2,23]);assert.equal(view(g).inventory.filter(id=>id==='Potion').length,1);
 assert.equal(g.run('menu.screen'),'main');
});
test('field cures affect only the selected member and retain existing no-effect consumption',()=>{
 const g=fresh();g.run('statusEffects=["poison","cursed"];stats.items=["Reed Remedy","Reed Remedy","Amethyst Dust"].map(createItem)');seed(g,'payload.party.characters[0].statuses=["poison","cursed"]');open(g);
 item(g,'Reed Remedy');g.press('ArrowDown');g.press('Enter');assert.deepEqual(view(g).members.map(m=>m.statuses),[['poison','cursed'],['cursed']]);
 item(g,'Reed Remedy');g.press('ArrowDown');g.press('Enter');assert.equal(view(g).inventory.includes('Reed Remedy'),false);
 item(g,'Amethyst Dust');g.press('Enter');assert.deepEqual(view(g).members.map(m=>m.statuses),[['poison'],['cursed']]);
});
test('ordinary healing rejects Fallen targets and member cycling skips them',()=>{
 const g=fresh();g.run('stats.hp=0;stats.items=[createItem("Potion")]');open(g);item(g,'Potion');assert.equal(g.run('partyFieldMenu.getView().selectedTargetId'),'esla');
 g.press('ArrowDown');assert.equal(g.run('partyFieldMenu.getView().selectedTargetId'),'esla');const before=state(g);assert.throws(()=>g.run('persistentParty.useFieldItem("lely","Potion")'));assert.equal(state(g),before);
 assert.ok(texts(draw(g)).includes('Fallen'));g.press('Enter');assert.equal(g.run('stats.hp'),0);
});
test('stale item or removed target fails without consumption; cancelling still returns safely',()=>{
 const g=fresh();g.run('stats.items=[createItem("Potion")]');open(g);item(g,'Potion');g.run('stats.items=[]');const before=state(g);g.press('Enter');assert.equal(state(g),before);assert.equal(g.run('menu.screen'),'partyTarget');g.press('b');
 g.run('stats.items=[createItem("Potion")]');item(g,'Potion');g.run('stats.hp=0');const b=state(g);g.press('Enter');assert.equal(state(g),b);g.press('ArrowDown');g.press('Enter');assert.equal(g.run('stats.hp'),0);
});
test('battle-only/key/no-effect reagent items have no field-target route',()=>{
 const g=fresh();g.run('stats.items=["Bullet Time","Bait","Henbane Sprig","Schilling"].map(createItem)');open(g);
 for(const id of ['Bullet Time','Bait','Henbane Sprig']){const b=state(g);item(g,id);assert.equal(g.run('menu.screen'),'main');assert.equal(state(g),b);}
 assert.equal(g.run('groupItems().some(g=>g.name==="Schilling")'),false);
 assert.throws(()=>g.run('persistentParty.useFieldItem("esla","Schilling")'));
});
test('Equipment member selection, Fallen inspection, exchange and independent previews',()=>{
 const g=fresh();g.run('stats.items=["Iron Sword","Steel Sword","Iron Shield","Cat Armor","Fen Mask","Amethyst Bangle"].map(createItem)');seed(g,'payload.party.characters[0].hp=0');open(g);g.press('ArrowRight');extra(g,2);
 assert.equal(g.run('menu.screen'),'partyEquipment');
 assert.equal(g.run('partyFieldMenu.getView().preview.effective.atk'),10);g.press('Enter');assert.equal(view(g).members[1].equipment.weapon,'Iron Sword');assert.equal(g.run('stats.weapon'),null);
 g.press('Enter');assert.equal(view(g).members[1].equipment.weapon,'Steel Sword');assert.ok(view(g).inventory.includes('Iron Sword'));
 assert.equal(view(g).members[1].effective.atk,13);assert.equal(view(g).members[0].effective.atk,8);bounds(draw(g));
 g.press('b');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');assert.equal(g.run('menu.screen'),'main');
 g.run('persistentParty.useFieldItem("lely","Iron Sword")');assert.equal(view(g).members[0].equipment.weapon,'Iron Sword');
 assert.equal(view(g).inventory.includes('Iron Sword'),false);const b=state(g);assert.throws(()=>g.run('persistentParty.useFieldItem("esla","Iron Sword")'));assert.equal(state(g),b);
 for(const id of ['Cat Armor','Fen Mask','Amethyst Bangle'])g.run('persistentParty.useFieldItem("esla",'+JSON.stringify(id)+')');
 assert.equal(view(g).members[1].effective.def,101);assert.ok(view(g).inventory.includes('Fen Mask'));assert.equal(view(g).members[1].hp,0);
 const snapshot=g.run('persistentParty.combatSnapshot()');assert.equal(snapshot.equipment[1].armor,'Cat Armor');
});
test('Status switches members without changing order and returns to the same member selection',()=>{
 const g=fresh();open(g);g.press('ArrowRight');extra(g,3);assert.equal(g.run('menu.screen'),'partyStatus');
 assert.ok(texts(draw(g)).includes('Esla'));g.press('ArrowRight');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'lely');
 g.press('ArrowLeft');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');bounds(draw(g));g.press('b');assert.equal(g.run('menu.screen'),'main');assert.equal(g.run('partyFieldMenu.getView().selectedId'),'esla');
});
test('equipment-aware effective stats use each member status and Slither owner',()=>{
 const g=fresh();g.run('statusEffects=["muddied","slither"];slitherSpd=17;stats.items=["Swift Bangle","Iron Shield"].map(createItem)');
 seed(g,'payload.party.characters[0].statuses=["muddied"]');g.run('persistentParty.useFieldItem("esla","Swift Bangle");persistentParty.useFieldItem("esla","Iron Shield")');
 const v=view(g);assert.equal(v.members[0].effective.spd,17);assert.equal(v.members[1].effective.spd,6);assert.equal(v.members[1].effective.def,4);
 assert.equal(v.members[0].effective.def,1);assert.equal(g.run('stats.accessory'),null);
});
test('invalid operations and arithmetic reject atomically without RNG or combat identities',()=>{
 const g=fresh();g.run('stats.items=[createItem("Potion"),createItem("Iron Sword")]');
 for(const expression of ['persistentParty.useFieldItem("unknown","Potion")','persistentParty.useFieldItem("esla","Missing")','persistentParty.useFieldItem("esla","Potion",1)']){const b=state(g);assert.throws(()=>g.run(expression));assert.equal(state(g),b);}
 g.run('stats.atk=Number.MAX_SAFE_INTEGER');const b=state(g);assert.throws(()=>g.run('persistentParty.useFieldItem("lely","Iron Sword")'));assert.equal(state(g),b);
});
test('three valid fixture members render, navigate, target and save without a fourth slot',()=>{
 const g=third();g.run('stats.items=["Potion","Iron Shield"].map(createItem)');open(g);bounds(draw(g));assert.equal(texts(draw(g)).filter(s=>/^Lv\./.test(s)).length,1);
 item(g,'Potion');g.press('ArrowDown');g.press('ArrowDown');assert.equal(g.run('partyFieldMenu.getView().selectedTargetId'),'fixture_third');bounds(draw(g));g.press('Enter');assert.equal(view(g).members[2].hp,20);
 g.press('ArrowRight');g.press('ArrowRight');extra(g,2);g.press('Enter');assert.equal(view(g).members[2].equipment.shield,'Iron Shield');bounds(draw(g));g.press('b');
 extra(g,3);assert.ok(texts(draw(g)).includes('Fixture'));bounds(draw(g));g.press('b');
 g.run('saveGame();var saved=localStorage.getItem("verdantVale_save")');const v=view(g);g.run('persistentParty.resetForNewGame()');assert.equal(g.run('loadGame()'),true);assert.deepEqual(view(g),v);
 g.run('var bad=JSON.parse(saved);bad.party.order.push("fourth");localStorage.setItem("verdantVale_save",JSON.stringify(bad))');const b=state(g);assert.equal(g.run('loadGame()'),false);assert.equal(state(g),b);
});
test('two-member save/load preserves equipment, statuses, HP and shared resources, excludes navigation',()=>{
 const g=fresh();g.run('stats.items=["Iron Sword","Potion"].map(createItem);stats.gold=31;persistentParty.useFieldItem("esla","Iron Sword");statusEffects=["cursed"]');open(g);item(g,'Potion');g.press('b');
 const before=view(g);g.run('saveGame();var saved=JSON.parse(localStorage.getItem("verdantVale_save"));persistentParty.resetForNewGame();');assert.equal(g.run('loadGame()'),true);assert.deepEqual(view(g),before);
 assert.equal(g.run('saved.version'),5);assert.doesNotMatch(g.run('JSON.stringify(saved.party)'),/selectedId|pendingItem|equipmentCursor|instanceId|playback|partyTarget/);
 for(const edit of ['d.party.order=["esla","lely"]','d.party.order=["lely","esla","esla"]','d.party.characters[0].equipment.weapon="Potion"','d.stats.weapon={name:"Potion"}','d.party.characters[0].hp=-1']){
  g.run('var d=JSON.parse(JSON.stringify(saved));'+edit+';localStorage.setItem("verdantVale_save",JSON.stringify(d))');const b=state(g);assert.equal(g.run('loadGame()'),false,edit);assert.equal(state(g),b);
 }
});
test('latch, repeat/modifier rejection and existing dialogue/cutscene/combat control locks',()=>{
 const g=fresh();g.run('stats.items=[createItem("Potion")]');open(g);
 g.keydown('Enter',{repeat:true});g.release('Enter');assert.equal(g.run('menu.screen'),'main');
 g.keydown('Enter',{ctrlKey:true});g.release('Enter');assert.equal(g.run('menu.screen'),'main');
 g.hold('Enter');assert.equal(g.run('menu.screen'),'partyTarget');g.hold('Enter');assert.equal(g.run('menu.screen'),'partyTarget');g.release('Enter');g.press('b');
 for(const [on,off]of [['dialogue.open=true','dialogue.open=false'],['choice.open=true','choice.open=false'],['shop.open=true','shop.open=false']]){
  g.run(on);const before=state(g);g.press('ArrowDown');assert.equal(state(g),before);assert.equal(g.run('menu.itemCursor'),0);g.run(off);
 }
 const old=g.run('JSON.stringify(menu)');g.run('seraLioraCutscene.active=true');g.press('ArrowDown');assert.equal(g.run('JSON.stringify(menu)'),old);g.run('seraLioraCutscene.active=false');
 g.run('menu.open=false;persistentParty.beginCombat(["enemy_marsh_wisp"])');g.press('m');assert.equal(g.run('menu.open'),false);
 assert.throws(()=>g.run('persistentParty.useFieldItem("esla","Potion")'));
});
test('XP policy is full for living members and excludes Fallen members',()=>{
 const g=fresh();seed(g,'payload.party.characters[0].hp=0');g.run('Math.random=()=>0.5;persistentParty.awardExperience("field-fixture",100)');
 assert.deepEqual(view(g).members.map(m=>[m.level,m.xp]),[[2,100],[1,0]]);assert.equal(view(g).members[1].hp,0);
});
test('Fallen cures remove only statuses without revival; healing does not replace equipped objects',()=>{
 const g=fresh();g.run('stats.hp=0;statusEffects=["cursed"];stats.items=["Amethyst Dust","Potion"].map(createItem);stats.weapon=createItem("Iron Sword");var originalWeapon=stats.weapon');
 g.run('persistentParty.useFieldItem("lely","Amethyst Dust")');assert.equal(g.run('stats.hp'),0);assert.deepEqual(view(g).members[0].statuses,[]);
 g.run('stats.hp=1;var originalStatuses=statusEffects;persistentParty.useFieldItem("lely","Potion")');
 assert.equal(g.run('stats.weapon===originalWeapon && statusEffects===originalStatuses'),true);
});
test('all party screens and overlays fit native and nearest-neighbour 2x geometry',()=>{
 for(const count of [2,3]){
  const g=count===3?third():fresh();g.run('stats.items=["Potion","Iron Sword","Steel Sword","Iron Shield","Fen Mask","Cat Armor"].map(createItem)');open(g);
  for(const phase of ['main','partyEquipment','partyStatus','saveConfirm','loadConfirm']){
   g.run('menu.screen='+JSON.stringify(phase));bounds(draw(g));
   g.run('paint=[];ctx.save();ctx.scale(2,2);drawMenu();ctx.restore()');
   for(const c of J(g,'paint'))if(c.bounds)assert.ok(c.bounds[0]>=0&&c.bounds[1]>=0&&c.bounds[2]<=1024&&c.bounds[3]<=960,phase);
  }
  g.run('menu.screen="main"');item(g,'Potion');bounds(draw(g));
 }
});
test('multi-member list navigation, empty gear, save/load and Notebook cancel paths',()=>{
 const g=fresh();open(g);g.press('ArrowDown');g.press('ArrowDown');g.press('Enter');assert.equal(g.run('menu.screen'),'partyEquipment');
 assert.ok(texts(draw(g)).includes('no equipment'));g.press('Enter');g.press('b');
 extra(g,0);g.press('b');assert.equal(g.run('menu.screen'),'main');extra(g,0);g.press('Enter');assert.equal(g.run('menu.screen'),'main');
 extra(g,1);g.press('b');assert.equal(g.run('menu.screen'),'main');extra(g,1);g.press('Enter');assert.equal(g.run('menu.screen'),'main');
 g.press('n');assert.equal(g.run('menu.screen'),'notebook');g.press('b');g.press('Escape');assert.equal(g.run('menu.open'),false);
 g.run('stats.items=["Potion","Elixir","Iron Sword","Steel Sword","Iron Shield","Fen Mask"].map(createItem)');open(g);
 for(let i=0;i<6;i++)g.press('ArrowDown');assert.equal(g.run('menu.scrollOffset'),3);g.press('ArrowUp');assert.equal(g.run('menu.itemCursor'),5);
 const qty=g.run('stats.items.length');g.press('Enter');g.press('ArrowDown');g.press('b');assert.equal(g.run('menu.scrollOffset'),3);assert.equal(g.run('menu.itemCursor'),5);assert.equal(g.run('stats.items.length'),qty);
});
test('nested executable save candidates and post-cure numeric overflow reject before mutation',()=>{
 const g=fresh();g.run('saveGame();var candidate=JSON.parse(localStorage.getItem("verdantVale_save"));candidate.stats.weapon={get name(){throw Error("getter executed")}}');
 const before=state(g);assert.throws(()=>g.run('persistentParty.prepareLoad(candidate.party,candidate.stats,candidate.statusEffects,candidate.slitherSpd)'));assert.equal(state(g),before);
 g.run('stats.atk=Number.MAX_SAFE_INTEGER;stats.weapon=createItem("Iron Sword");stats.hp=1;stats.items=[createItem("Potion")]');const b=state(g);
 assert.throws(()=>g.run('persistentParty.useFieldItem("lely","Potion")'));assert.equal(state(g),b);
});
test('no recruitment, combat route, extra listeners, Lab fixtures or save fields added by menu',()=>{
 const root=path.join(__dirname,'../..'),src=fs.readFileSync(path.join(root,'party-field-menu.js'),'utf8');
 assert.doesNotMatch(src,/addEventListener|joinEsla\(|beginCombat\(|initializeCommandParty|partyCombatLab|Math\.random|stats\./);
 for(const file of scriptOrderFromIndexHtml())assert.equal((fs.readFileSync(path.join(root,file),'utf8').match(/persistentParty\.joinEsla\s*\(/g)||[]).length,file==='quests.js'?1:0,file);
 const input=fs.readFileSync(path.join(root,'input.js'),'utf8');assert.equal((input.match(/addEventListener\('keydown'/g)||[]).length,1);assert.equal((input.match(/addEventListener\('keyup'/g)||[]).length,1);
});
module.exports={name:'Canonical field menu: solo recordings, persistent targets/equipment, three slots and saves',run(){for(const c of checks){try{c.run();}catch(e){e.message=c.name+': '+e.message;throw e;}}console.log('  '+checks.length+' canonical field-menu checks passed');}};
