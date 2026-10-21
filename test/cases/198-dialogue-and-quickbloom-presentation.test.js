'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {createContext}=require('../harness');
const {record}=require('./149-formation-battle-rendering.test');
const ROOT=path.join(__dirname,'../..'),checks=[],test=(name,run)=>checks.push({name,run});
const J=(g,source)=>JSON.parse(g.run('JSON.stringify('+source+')'));
function fresh(){const g=createContext();g.run(`dialogue.open=false;dialogue.callbacks=null;menu.open=false;debugMenu.open=false;
  Math=Object.create(Math);var presentationRng=0;Math.random=()=>{presentationRng++;throw Error('unexpected presentation RNG')}`);return g;}
function tomas(g){return J(g,`SIMPLE_NPCS.find(n=>n.id==='tomas').dialogue`);}
function effectFixture(g,slot,type='resonance',appliedHealing=1){
  g.run(`var quickbloomFixture=copyFormationData({label:'Fixture',frameIndex:3,playbackFrame:{completedRounds:0,currentEvent:{
    type:${JSON.stringify(type)},techniqueId:'quickbloom',actorId:'esla_fixture',targetId:'ally_fixture',appliedHealing:${appliedHealing}}},
    party:[{instanceId:'ally_fixture',slot:${slot}}]})`);
}
function recordRects(g,source){g.run(`var effectPaint=[];ctx.fillRect=function(x,y,w,h){effectPaint.push({x,y,w,h,color:ctx.fillStyle})};${source}`);return J(g,'effectPaint');}
function reachLabQuickbloom(g){
  assert.equal(g.run(`partyCombatLab.enter('command_showcase').active`),true);
  g.run(`var labEnemy=partyCombatLab.getView().enemies[0].instanceId;
    partyCombatLab.submitAttack({actorId:partyCombatLab.getView().nextActorId,targetId:labEnemy});
    partyCombatLab.moveCommand('next');partyCombatLab.confirmCommand();partyCombatLab.confirmTechnique();partyCombatLab.confirmTarget();
    Math.random=()=>{presentationRng++;return .99};partyCombatLab.commitRound();
    Math.random=()=>{presentationRng++;throw Error('unexpected presentation RNG')};
    while(partyCombatLab.getView().phase==='playback'&&partyCombatLab.getView().playbackFrame.currentEvent?.type!=='resonance')partyCombatLab.advancePlayback();`);
  const event=J(g,'partyCombatLab.getView().playbackFrame.currentEvent');assert.equal(event.type,'resonance');assert.equal(event.techniqueId,'quickbloom');return event;
}

test('MQ5 uses the exact corrected Dreyfuss line on an Esla-coloured page',()=>{
  const g=fresh(),expected='“I don’t know what happened to Dreyfuss, but I’m not going to let it happen to anyone in this office.”';
  const pages=J(g,'MQ5_ASSIGNMENT_AFTER_WALK_PAGES'),page=pages.find(row=>row.lines.includes(expected));
  assert.ok(page);assert.equal(page.speakerId,'esla');assert.equal(page.lines.length,1);
  const all=J(g,'[...MQ5_ASSIGNMENT_OPENING_PAGES,...MQ5_ASSIGNMENT_AFTER_WALK_PAGES].flatMap(p=>p.lines).join(" ")');
  assert.doesNotMatch(all,/I know what happened to Dreyfuss|Sending Lely alone would be irresponsible/);
  g.run(`setSpeakerDialoguePages([${JSON.stringify(page)}]);dialogue.open=true;dialogue.page=0;var styled=dialoguePagePresentation()`);
  assert.deepEqual(J(g,'styled'),{name:'Esla',styleId:'esla_light_green',speakerId:'esla'});
});

test('Tomas preserves every existing page before recruitment and appends one membership-owned acknowledgement after it',()=>{
  const g=fresh();g.run('day=1;dispatch_delivered=false');const before=tomas(g);
  assert.deepEqual(before,[
    ['“Today’s page: wind out of the southwest, reeds leaning hard, three herons on the near bank.”','“The herons aren’t important. I write them down anyway. That’s the whole trick of it.”'],
    ['“Esla files things because the Empire tells her to. I file things because I want to. We understand each other completely and not at all.”'],
  ]);
  assert.equal(g.run(`persistentParty.joinEsla({level:11}).members.length`),2);let after=tomas(g);
  assert.deepEqual(after.slice(0,-1),before);assert.deepEqual(after.at(-1),['“Lely — and Esla with you. That saves me writing down two separate arrivals.”']);
  g.run('dispatch_delivered=true');after=tomas(g);
  assert.match(after.at(-2).join(' '),/out to Drenwick|wrote the date down/);assert.match(after.at(-1)[0],/Lely — and Esla with you/);
});

test('Tomas membership branch survives save/load, includes Fallen Esla, and checkpoint reset removes it',()=>{
  const g=fresh();g.run(`persistentParty.joinEsla({level:11});saveGame();var saved=JSON.parse(localStorage.getItem('verdantVale_save'));
    saved.party.characters[0].hp=0;localStorage.setItem('verdantVale_save',JSON.stringify(saved));persistentParty.resetForNewGame();loadGame()`);
  assert.equal(g.run(`persistentParty.getMember('esla').hp`),0);assert.match(tomas(g).at(-1)[0],/Lely — and Esla with you/);
  assert.equal(g.run(`storyCheckpointLab.apply('mq5_assignment_ready')`),true);assert.equal(g.run(`persistentParty.getMember('esla')`),null);
  assert.doesNotMatch(tomas(g).flat().join(' '),/Lely — and Esla with you/);
});

test('Quickbloom motes anchor deterministically to all three authored ally slots, including zero healing',()=>{
  const g=fresh(),anchors=[108,256,404];
  for(let slot=0;slot<3;slot++){
    g.run('partyBattleQuickbloomAnimation.reset()');effectFixture(g,slot,'resonance',slot===2?0:1);
    const before=g.run('JSON.stringify(quickbloomFixture)'),rng=g.run('presentationRng'),rects=recordRects(g,'partyBattleQuickbloomAnimation.draw(quickbloomFixture)');
    assert.equal(g.run('JSON.stringify(quickbloomFixture)'),before);assert.equal(g.run('presentationRng'),rng);assert.ok(rects.length>0);
    assert.equal(g.run('partyBattleQuickbloomAnimation.getView().targetId'),'ally_fixture');
    assert.ok(rects.every(r=>Math.abs((r.x+r.w/2)-anchors[slot])<=32),JSON.stringify({slot,rects}));
    assert.ok(rects.every(r=>['#3f8f52','#78c86f','#a8e89c'].includes(r.color)));
  }
});

test('wait, cancellation, Strain and unrelated events never start the Quickbloom effect',()=>{
  const g=fresh();
  for(const type of ['resonance_wait','resonance_cancel','strain','attack']){
    g.run('partyBattleQuickbloomAnimation.reset()');effectFixture(g,0,type,0);const rects=recordRects(g,'partyBattleQuickbloomAnimation.draw(quickbloomFixture)');
    assert.deepEqual(rects,[]);assert.equal(g.run('partyBattleQuickbloomAnimation.getView().active'),false);
  }
  effectFixture(g,0,'resonance',0);g.run(`quickbloomFixture=copyFormationData({...quickbloomFixture,playbackFrame:{...quickbloomFixture.playbackFrame,currentEvent:{...quickbloomFixture.playbackFrame.currentEvent,techniqueId:'fixture_shared'}}})`);
  assert.deepEqual(recordRects(g,'partyBattleQuickbloomAnimation.draw(quickbloomFixture)'),[]);
});

test('actual Lab Quickbloom uses the shared renderer, gates input for 24 ticks, then clears exactly once',()=>{
  const g=fresh(),event=reachLabQuickbloom(g),target=J(g,'partyCombatLab.getView().party.find(m=>m.instanceId==='+JSON.stringify(event.targetId)+')');
  record(g);const gameplay=g.run(`JSON.stringify({view:partyCombatLab.getView(),party:combatPlayerState.getView(),rng:presentationRng})`);
  g.run('paint=[];drawPartyCombatLabBattle()');let paint=J(g,"paint.filter(c=>c.type==='fillRect'&&['#3f8f52','#78c86f','#a8e89c'].includes(c.style.fillStyle))");
  assert.ok(paint.length>0);assert.ok(paint.every(c=>Math.abs((c.args[0]+c.args[2]/2)-[108,256,404][target.slot])<=32));
  assert.equal(g.run(`JSON.stringify({view:partyCombatLab.getView(),party:combatPlayerState.getView(),rng:presentationRng})`),gameplay);
  const at=g.run('partyCombatLab.getView().frameIndex');assert.equal(g.run(`handlePartyCombatLabInput('confirm')`),true);assert.equal(g.run('partyCombatLab.getView().frameIndex'),at);
  g.run('for(let i=1;i<QUICKBLOOM_ANIMATION_FRAMES;i++)drawPartyCombatLabBattle()');
  assert.deepEqual(J(g,'partyBattleQuickbloomAnimation.getView()'),{active:false,frame:24,duration:24,targetId:event.targetId});
  assert.equal(g.run(`handlePartyCombatLabInput('confirm')`),true);assert.equal(g.run('partyCombatLab.getView().frameIndex'),at+1);
  assert.deepEqual(J(g,'partyBattleQuickbloomAnimation.getView()'),{active:false,frame:0,duration:24,targetId:null});
});

test('canonical and Lab routes share one effect authority; cleanup and later frames cannot replay it',()=>{
  const g=fresh();reachLabQuickbloom(g);record(g);
  g.run('paint=[];partyBattleQuickbloomAnimation.reset();drawPartyBattle(partyCombatLab.getView())');const shared=J(g,"paint.filter(c=>c.type==='fillRect'&&['#3f8f52','#78c86f','#a8e89c'].includes(c.style.fillStyle))");
  g.run('paint=[];partyBattleQuickbloomAnimation.reset();drawPartyCombatLabBattle()');const wrapped=J(g,"paint.filter(c=>c.type==='fillRect'&&['#3f8f52','#78c86f','#a8e89c'].includes(c.style.fillStyle))");
  assert.deepEqual(wrapped,shared);assert.match(fs.readFileSync(path.join(ROOT,'render.js'),'utf8'),/canonicalPartyCombat\.getView\(\)[\s\S]*drawPartyBattle\(view\)/);
  g.run('partyCombatLab.exit()');assert.equal(g.run('partyBattleQuickbloomAnimation.getView().active'),false);
  effectFixture(g,1,'resonance',1);recordRects(g,'partyBattleQuickbloomAnimation.draw(quickbloomFixture)');
  effectFixture(g,1,'attack',0);assert.deepEqual(recordRects(g,'partyBattleQuickbloomAnimation.draw(quickbloomFixture)'),[]);
  assert.equal(g.run('partyBattleQuickbloomAnimation.getView().targetId'),null);
});

test('ordinary default dialogue styling remains independent of Esla speaker green',()=>{
  const g=fresh();g.run(`openDialogue('Tomas',SIMPLE_NPCS.find(n=>n.id==='tomas').dialogue);var ordinaryStyle=dialoguePagePresentation()`);
  assert.deepEqual(J(g,'ordinaryStyle'),{name:'Tomas',styleId:null,speakerId:null});
  assert.equal(g.run('presentationRng'),0);
});

module.exports={name:'MQ5/Tomas dialogue and deterministic Quickbloom presentation',run(){for(const check of checks){try{check.run();}catch(error){error.message=check.name+': '+error.message;throw error;}}console.log('  '+checks.length+' dialogue/Quickbloom presentation checks passed');}};
