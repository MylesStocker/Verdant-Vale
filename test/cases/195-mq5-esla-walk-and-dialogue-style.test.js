'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,source)=>JSON.parse(g.run('JSON.stringify('+source+')'));
function fresh(){const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;var mq5RngCalls=0;
 Math=Object.create(Math);Math.random=()=>{mq5RngCalls++;throw Error('MQ5 presentation used RNG')}`);return g;}
function checkpoint(g){assert.equal(g.run(`storyCheckpointLab.apply('mq5_assignment_ready')`),true);assert.equal(g.run('mq5AssignmentReady()'),true);}
function drawText(g){g.run(`var mq5Paint=[];ctx.fillText=function(text,x,y){mq5Paint.push({text:String(text),fill:ctx.fillStyle,font:ctx.font,x,y})};drawDialogue()`);return J(g,'mq5Paint');}
function closeOpening(g){let guard=0;while(g.run('dialogue.open')){assert.ok(guard++<100);g.press('Enter');}}
function walk(g){const trace=[];let guard=0;while(g.run(`mq5AssignmentCutscene.getView().phase==='walking'`)){
  assert.ok(guard++<400);g.frames(1);trace.push(J(g,'({x:ESLA.x,y:ESLA.y,facing:ESLA.facing,phase:mq5AssignmentCutscene.getView().phase})'));
 }return trace;}
function finishFinal(g){assert.equal(g.run('mq5AssignmentCutscene.getView().phase'),'dialogue');g.run('finishDialogue()');}

// Speaker records are an explicit, immutable presentation authority. Content
// cannot smuggle a style through prose, accessors, inherited fields or unknown keys.
test('Esla has one stable validated light-green speaker style',()=>{
 const g=fresh(),speaker=J(g,'DIALOGUE_SPEAKER_DEFINITIONS.esla');
 assert.deepEqual(speaker,{speakerId:'esla',name:'Esla',dialogueStyleId:'esla_light_green'});
 assert.equal(g.run('PERSISTENT_CHARACTER_DEFINITIONS.esla.speakerId'),'esla');
 assert.equal(g.run('ESLA.speakerId'),'esla');
 assert.equal(g.run(`DIALOGUE_TEXT_STYLES.esla_light_green.bodyColor`),'#a8e89c');
 assert.equal(g.run(`DIALOGUE_TEXT_STYLES.esla_light_green.nameColor`),'#8fda86');
 assert.equal(g.run('Object.isFrozen(DIALOGUE_SPEAKER_DEFINITIONS.esla)&&Object.isFrozen(DIALOGUE_TEXT_STYLES.esla_light_green)'),true);
});

test('legacy, Supervisor, Esla and narration pages select their own style without leakage',()=>{
 const g=fresh();
 g.run(`openDialogue('Clerk',[['Legacy words']]);tick=0`);let paint=drawText(g);
 assert.equal(paint.find(row=>row.text==='Legacy words').fill,'#ccd8cc');
 assert.equal(g.run('dialoguePagePresentation().styleId'),null);
 g.run(`setSpeakerDialoguePages([{speakerId:'esla',lines:['Green words']}]);dialogue.open=true;dialogue.page=0;dialogue.name='stale'`);
 paint=drawText(g);assert.equal(paint.find(row=>row.text==='Green words').fill,'#a8e89c');
 assert.equal(paint.find(row=>row.text==='Esla').fill,'#8fda86');
 g.run(`setSpeakerDialoguePages([{speakerId:'supervisor',lines:['Default words']},{speakerId:null,lines:['Narration words']}]);dialogue.open=true;dialogue.page=0`);
 paint=drawText(g);assert.equal(paint.find(row=>row.text==='Default words').fill,'#ccd8cc');
 g.run('dialogue.page=1');paint=drawText(g);assert.equal(paint.find(row=>row.text==='Narration words').fill,'#ccd8cc');
 assert.equal(paint.some(row=>row.text==='Esla'),false);
 g.run(`openDialogue('Other',[['Later words']]);dialogue.open=true`);paint=drawText(g);
 assert.equal(paint.find(row=>row.text==='Later words').fill,'#ccd8cc');
});

test('ordinary Esla NPC dialogue resolves through stable metadata',()=>{
 const g=fresh();
 assert.equal(g.run(`transitionToLocation({mapId:'DRENWICK_INFIRMARY_MAP',x:9*TILE,y:7.5*TILE,facing:'left',state:{inTown:true,currentTownId:'drenwick',townBuilding:'infirmary'}})`),true);
 assert.equal(g.run('interactSimpleNPCs()'),true);assert.equal(g.run('dialoguePagePresentation().speakerId'),'esla');
 const line=g.run('dialogue.pages[0][0]'),paint=drawText(g);
 assert.equal(paint.find(row=>row.text===line).fill,'#a8e89c');assert.equal(g.run('mq5RngCalls'),0);
});

test('malformed speaker and page metadata reject atomically before presentation',()=>{
 const g=fresh();g.run(`openDialogue('Safe',[['unchanged']])`);const before=g.run('JSON.stringify(dialogue)');
 for(const expression of [
  `setSpeakerDialoguePages([{speakerId:'unknown',lines:['x']}])`,
  `setSpeakerDialoguePages([{speakerId:'esla',lines:['x'],extra:true}])`,
  `setSpeakerDialoguePages([{speakerId:'esla',get lines(){throw Error('getter')}}])`,
  `setSpeakerDialoguePages([Object.assign(Object.create({}),{speakerId:'esla',lines:['x']})])`,
  `validateDialogueSpeakerDefinition({speakerId:'future',name:'Future',dialogueStyleId:'missing'})`,
  `validateDialogueSpeakerDefinition({speakerId:'future',name:'Future',dialogueStyleId:null,extra:true})`,
 ]) assert.throws(()=>g.run(expression),/Invalid dialogue/);
 assert.equal(g.run('JSON.stringify(dialogue)'),before);assert.equal(g.run('mq5RngCalls'),0);
});

test('the real Supervisor interaction alternates explicit styles and preserves authored agency',()=>{
 const g=fresh();checkpoint(g);g.run('handleInteract()');assert.equal(g.run('dialogue.open'),true);
 const all=J(g,'[...MQ5_ASSIGNMENT_OPENING_PAGES,...MQ5_ASSIGNMENT_AFTER_WALK_PAGES]');
 assert.ok(all.filter(page=>page.speakerId==='esla').length>=3);
 assert.ok(all.some(page=>page.speakerId===null));
 for(const page of all){g.run(`setSpeakerDialoguePages([${JSON.stringify(page)}]);dialogue.open=true;dialogue.page=0`);const p=drawText(g),body=p.find(row=>row.text===page.lines[0]);
  assert.equal(body.fill,page.speakerId==='esla'?'#a8e89c':'#ccd8cc');}
 const text=all.flatMap(page=>page.lines).join(' ');
 assert.match(text,/I don’t know what happened to Dreyfuss, but I’m not going to let it happen to anyone in this office\./);
 assert.doesNotMatch(text,/I know what happened to Dreyfuss|Sending Lely alone would be irresponsible/);
 assert.match(text,/I am going with her/);
 assert.doesNotMatch(text,/closes the file.*comes to the desk/);assert.equal(g.run('mq5RngCalls'),0);
});

test('the real scene walks Esla over the authored orthogonal route before recruitment',()=>{
 const g=fresh();checkpoint(g);const start=J(g,'({x:ESLA.x,y:ESLA.y,facing:ESLA.facing})');
 assert.deepEqual(start,{x:144,y:304,facing:'up'});g.run('handleInteract()');closeOpening(g);
 assert.equal(g.run('mq5AssignmentCutscene.getView().phase'),'walking');assert.equal(g.run('MainQuest'),4);
 assert.equal(g.run('persistentParty.getMember("esla")'),null);assert.equal(g.run('Object.keys(NPC_ROUTES).filter(id=>id===ESLA.id).length'),1);
 const trace=walk(g);assert.ok(trace.length>2);assert.deepEqual(trace[0],{x:146,y:304,facing:'right',phase:'walking'});
 assert.ok(trace.some(p=>p.x===432&&p.y===304));assert.ok(trace.some(p=>p.x===432&&p.y<304));
 let prev=start;for(const point of trace){const dx=Math.abs(point.x-prev.x),dy=Math.abs(point.y-prev.y);assert.ok(dx+dy<=2&&!(dx&&dy),JSON.stringify({prev,point}));prev=point;}
 assert.deepEqual(J(g,'({x:ESLA.x,y:ESLA.y,facing:ESLA.facing})'),{x:432,y:112,facing:'left'});
 assert.equal(g.run('mq5AssignmentCutscene.getView().phase'),'dialogue');assert.equal(g.run('MainQuest'),4);
 assert.equal(g.run('persistentParty.getMember("esla")'),null);assert.equal(g.run('mq5RngCalls'),0);
});

test('every route position is walkable, clear of authored solids and safe from all legal Supervisor interaction poses',()=>{
 const g=fresh();checkpoint(g);g.run('supervisorDialogueBody();finishDialogue()');const trace=walk(g);
 const points=[{x:144,y:304},...trace.map(({x,y})=>({x,y}))];g.run('var __mq5RoutePoints='+JSON.stringify(points));
 assert.equal(g.run(`__mq5RoutePoints.every(p=>{const t=tileAt(p.x,p.y),props=TILE_PROPERTIES[t];return isTileWalkable(t)&&!(props&&props.isTransition)&&!npcRouteCustomSolidBlocks(p.x,p.y)})`),true);
 assert.equal(g.run(`(()=>{for(let x=0;x<COLS*TILE;x++)for(let y=0;y<ROWS*TILE;y++)if(Math.hypot(x-SUPERVISOR.x,y-SUPERVISOR.y)<TALK_RADIUS&&canWalk(x,y))
  for(const p of __mq5RoutePoints)if(Math.abs(x-p.x)<18&&Math.abs(y-p.y)<18)return false;return true})()`),true);
});

test('walking owns input and blocks save/load without advancing time or world state',()=>{
 const g=fresh();checkpoint(g);assert.equal(g.run('saveGame()'),true);g.run('handleInteract()');closeOpening(g);
 const before=J(g,'({player,day,tick,MainQuest,gold:stats.gold,inventory:stats.items.length,debug:debugMenu.open,menu:menu.open})');
 g.press('m');g.press('`');g.press('ArrowLeft');g.press('Enter');assert.equal(g.run('saveGame()'),false);assert.equal(g.run('loadGame()'),false);
 const after=J(g,'({player,day,tick,MainQuest,gold:stats.gold,inventory:stats.items.length,debug:debugMenu.open,menu:menu.open})');
 assert.deepEqual(after,before);assert.equal(g.run('dialogue.open'),false);assert.equal(g.run('mq5RngCalls'),0);
 g.frames(1);assert.equal(g.run('tick'),before.tick);assert.equal(g.run('day'),before.day);
});

test('arrival finalizes the existing MQ5 authority exactly once and removes Esla projection',()=>{
 const g=fresh();checkpoint(g);g.run('handleInteract()');closeOpening(g);walk(g);
 assert.equal(g.run('dialoguePagePresentation().speakerId'),'supervisor');finishFinal(g);
 assert.equal(g.run('MainQuest'),5);assert.deepEqual(J(g,'persistentParty.serialize().order'),['lely','esla']);
 assert.equal(g.run('persistentParty.getView().members.filter(m=>m.characterId==="esla").length'),1);
 assert.notEqual(g.run('SIMPLE_NPCS.find(n=>n.id==="causeway_ferry_operator").map'),null);
 assert.equal(g.run('eslaAvailableAsNpc()'),false);assert.equal(g.run('NPC_ROUTES[ESLA.id]'),undefined);
 const party=g.run('JSON.stringify(persistentParty.serialize())'),view=J(g,'mq5AssignmentCutscene.getView()');
 assert.deepEqual([view.phase,view.startCount,view.completionCount],['idle',1,1]);
 g.run('supervisorDialogueBody();finishDialogue();completeMq5Assignment()');
 assert.equal(g.run('JSON.stringify(persistentParty.serialize())'),party);assert.equal(g.run('mq5AssignmentCutscene.getView().startCount'),1);
 assert.equal(g.run('mq5RngCalls'),0);
});

test('Story Checkpoint reset restores the sequence and save/load works after completion',()=>{
 const g=fresh();checkpoint(g);g.run('supervisorDialogueBody();finishDialogue()');g.frames(10);
 assert.notDeepEqual(J(g,'[ESLA.x,ESLA.y]'),[144,304]);checkpoint(g);
 assert.deepEqual(J(g,'[ESLA.x,ESLA.y,ESLA.facing,mq5AssignmentCutscene.getView().phase]'),[144,304,'up','idle']);
 assert.deepEqual(J(g,'persistentParty.serialize().order'),['lely']);
 g.run('handleInteract()');closeOpening(g);walk(g);finishFinal(g);assert.equal(g.run('saveGame()'),true);
 g.run('MainQuest=4;persistentParty.resetForNewGame()');assert.equal(g.run('loadGame()'),true);
 assert.equal(g.run('MainQuest'),5);assert.deepEqual(J(g,'persistentParty.serialize().order'),['lely','esla']);
 g.press('`');assert.equal(g.run('debugMenu.open'),true);g.press('Escape');
});

test('renderer projection is historical-only: walking animation and dialogue draw consume no RNG or story mutation',()=>{
 const g=fresh();checkpoint(g);g.run('supervisorDialogueBody();drawDialogue()');const before=J(g,'({MainQuest,party:persistentParty.serialize(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),pos:[ESLA.x,ESLA.y]})');
 drawText(g);g.run('finishDialogue();var route=NPC_ROUTES[ESLA.id];drawEslaSprite();drawEslaSprite()');
 const after=J(g,'({MainQuest,party:persistentParty.serialize(),flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),pos:[MQ5_ESLA_OFFICE_HOME.x,MQ5_ESLA_OFFICE_HOME.y]})');
 assert.deepEqual(after,before);assert.equal(g.run('mq5RngCalls'),0);assert.equal(g.run('mq5AssignmentCutscene.getView().phase'),'walking');
});

module.exports={name:'MQ5 Esla speaker styling and scripted office walk',run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}console.log('  '+checks.length+' MQ5 Esla walk/style checks passed');}};
