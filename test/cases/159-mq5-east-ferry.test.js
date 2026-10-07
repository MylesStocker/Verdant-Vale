'use strict';

// MQ5 begins only after the canonical Sera/Liora handoff returns control to
// Lely. MainQuest 5 itself authorizes the official causeway ferry; ordinary
// movement remains blocked, and both ferry destinations are safe/saveable.

const assert = require('assert/strict');
const crypto = require('crypto');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const WEST = 'EAST_CAUSEWAY_MAP';
const EAST = 'EASTERN_BANK_MAP';
const EAST_FP = '26185a50057fb3e71f94aeb970238ee8e1b99663038e3572a81e53c51358c260';
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

function currentMapId(g) {
  return g.run('mapIdForRef(activeMap)');
}

function questNotes(g) {
  return JSON.parse(g.run('JSON.stringify(getActiveQuestNotes())'));
}

function assignmentPrerequisites(g) {
  g.run(`
    fort_quest_stage=6;
    sluice_job_started=true;
    sluice_fixed=true;
    sluice_reward_given=true;
    dispatch_quest_started=true;
    dispatch_delivered=true;
    dispatch_rewarded=true;
    fort_quest_started=true;
    mq4_available_day=1;
    reservoir_quest_started=true;
    reservoir_report_filed=true;
    gallery_receiver_defeated=true;
    window.gallery_body_found=true;
    MainQuest=4;
    syncQuestFlagsToWindow();
  `);
}

module.exports = {
  name: 'MQ5: post-cutaway office assignment, official causeway ferry, return, and persistence',
  run() {
    // Even a forged development state cannot assign MQ5 without the canonical
    // body-discovery authority. Legitimate play cannot forge the earlier report
    // in the first place; this also hardens the final assignment boundary.
    const noBody = context();
    assignmentPrerequisites(noBody);
    noBody.run('window.gallery_body_found=false;sera_liora_opening_complete=true;syncQuestFlagsToWindow();supervisorDialogueBody();');
    assert.equal(noBody.run('MainQuest'), 4);
    assert.doesNotMatch(noBody.run('dialogue.pages.flat().join(" ")'), /sealed report|cable ferry/i);
    assert.equal(questNotes(noBody).some((note) => note.title === 'Beyond Local Authority'), false);
    assert.equal(noBody.run("SIMPLE_NPCS.find(function(n){return n.id==='causeway_ferry_operator';}).map"), null);

    const g = context();
    const J = (expr) => JSON.parse(g.run(expr));
    assignmentPrerequisites(g);

    // Before the canonical cutaway completes, neither the office objective nor
    // the ferry authorization exists. The old terrain block remains effective.
    assert.equal(g.run('sera_liora_opening_complete'), false);
    assert.equal(questNotes(g).some((note) => note.title === 'Beyond Local Authority'), false);
    assert.equal(g.run("crossCausewayFerry()"), false);
    assert.equal(g.run("SIMPLE_NPCS.find(function(n){return n.id==='causeway_ferry_operator';}).map"), null);
    assert.equal(g.run("(MAP_FEATURES['EAST_CAUSEWAY_MAP']||[]).filter(function(f){return /ferry/i.test(f.id||'');}).length"), 0,
      'there is no pre-MQ5 ferry hotspot');
    g.run('dialogue.open=false;choice.open=false;interactCausewayFerry();');
    assert.equal(g.run('dialogue.open||choice.open'), false, 'the ferry action is inert before MQ5');
    g.run('var preFerryPaint=0;var savedFillRect=ctx.fillRect;ctx.fillRect=function(){preFerryPaint++;};drawCausewayFerryBody("EAST_CAUSEWAY_MAP");ctx.fillRect=savedFillRect;');
    assert.equal(g.run('preFerryPaint'), 0, 'no cable or scow draws before MQ5');
    assert.equal(g.run(`placeAtLocation('${WEST}',10.5*TILE,8.5*TILE)`), true);
    g.run('dialogue.open=false;choice.open=false;handleInteract();');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /maintained road gives out|broken slabs tilting down/i,
      'the original top-right broken-causeway examination remains live before MQ5');
    g.run('finishDialogue();');
    g.run("dialogue.open=false;choice.open=false;debugMode=true;forceLegacyRegionalView=false;keys.ArrowRight=true;");
    g.frames(120);
    g.run('delete keys.ArrowRight;');
    assert.equal(currentMapId(g), WEST, 'ordinary movement cannot cross before MQ5');
    assert.ok(g.run('player.x') < 11 * g.run('TILE'), 'water stops the player before the gap');
    g.run('saveGame();');
    const preAssignmentSave = J("localStorage.getItem('verdantVale_save')");
    assert.equal(preAssignmentSave.MainQuest, 4);
    assert.equal(preAssignmentSave.sera_liora_opening_complete, false);
    g.run("MainQuest=5;sera_liora_opening_complete=true;syncQuestFlagsToWindow();placeAtLocation('MAP2',2.5*TILE,2.5*TILE);");
    assert.equal(g.run('loadGame()'), true);
    assert.equal(g.run('MainQuest'), 4);
    assert.equal(g.run('sera_liora_opening_complete'), false);
    assert.equal(currentMapId(g), WEST, 'pre-assignment west-bank save restores safely');

    // A debug preview remains progression-neutral. Only the canonical story
    // entry sets the durable post-cutaway flag and office objective.
    g.run('dialogue.open=false;startSeraLioraCutaway(false);endSeraLioraCutawayAtHospital();');
    assert.equal(g.run('sera_liora_opening_complete'), false, 'debug preview does not advance story');
    g.run('dialogue.open=false;startSeraLioraCutaway(true);endSeraLioraCutawayAtHospital();');
    assert.equal(g.run('sera_liora_opening_complete'), true);
    assert.equal(currentMapId(g), 'DRENWICK_INFIRMARY_MAP');
    const officeObjective = questNotes(g).find((note) => note.title === 'Beyond Local Authority');
    assert.ok(officeObjective);
    assert.match(officeObjective.body, /supervisor|Calwick office/i);

    // The existing supervisor authority assigns MQ5 once. Dialogue preserves
    // the bounded rationale and uses MainQuest itself as ferry authorization.
    g.run('dialogue.open=false;choice.open=false;supervisorDialogueBody();');
    const assignmentDialogue = g.run('dialogue.pages.flat().join(" ")');
    assert.match(assignmentDialogue, /Dreyfuss is dead/i);
    assert.match(assignmentDialogue, /beyond what Calwick or Drenwick can responsibly investigate/i);
    assert.match(assignmentDialogue, /sealed|district seal/i);
    assert.match(assignmentDialogue, /regional office/i);
    assert.match(assignmentDialogue, /firsthand account/i);
    assert.match(assignmentDialogue, /portion of it capable of answering questions/i);
    assert.match(assignmentDialogue, /Empire has sent a cable ferry.*while it is repaired/i);
    assert.match(assignmentDialogue, /temporary|six years/i);
    assert.equal(g.run('dialogue.callbacks.length'), 1);
    g.run('finishDialogue();');
    assert.equal(g.run('MainQuest'), 5);
    assert.equal(g.run('dialogue.callbacks'), null);
    const mq5Objective = questNotes(g).find((note) => note.title === 'Sealed Report');
    assert.ok(mq5Objective);
    assert.match(mq5Objective.body, /ferry at the broken causeway/i);

    g.run('supervisorDialogueBody();');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /sealed report.*eastern city/i);
    assert.equal(g.run('dialogue.callbacks'), null, 'repeat dialogue cannot duplicate authorization');
    g.run('finishDialogue();');
    assert.equal(g.run('MainQuest'), 5, 'repeat dialogue cannot regress MQ5');
    assert.equal(g.run("QUEST_FLAG_SCHEMA.filter(function(k){return k==='sera_liora_opening_complete';}).length"), 1);
    assert.equal(g.run("QUEST_FLAG_SCHEMA.some(function(k){return /ferry.*author/i.test(k);})"), false,
      'no competing ferry-authorization state');
    g.run('saveGame();MainQuest=4;sera_liora_opening_complete=false;syncQuestFlagsToWindow();');
    assert.equal(g.run('loadGame()'), true);
    assert.equal(g.run('MainQuest'), 5, 'post-assignment save restores MQ5');
    assert.equal(g.run('sera_liora_opening_complete'), true);

    // MQ5 exposes one operator on the active bank. Refusing passage changes no
    // position or quest state.
    assert.equal(g.run(`placeAtLocation('${WEST}',10.5*TILE,8.5*TILE)`), true);
    assert.deepEqual(J("JSON.stringify((function(){var n=SIMPLE_NPCS.find(function(x){return x.id==='causeway_ferry_operator';});return {count:SIMPLE_NPCS.filter(function(x){return x.id==='causeway_ferry_operator';}).length,map:n.map,physical:n.physicalMapId};})())"),
      { count: 1, map: 'east_causeway', physical: WEST });
    g.run('var postFerryPaint=0;savedFillRect=ctx.fillRect;ctx.fillRect=function(){postFerryPaint++;};drawCausewayFerryBody("EAST_CAUSEWAY_MAP");ctx.fillRect=savedFillRect;');
    assert.ok(g.run('postFerryPaint') > 0, 'MQ5 draws the cable and scow');
    g.run('dialogue.open=false;choice.open=false;handleInteract();');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /maintained road gives out|broken slabs tilting down/i,
      'the original causeway remains independently examinable after the ferry appears');
    assert.match(g.run('dialogue.pages.flat().join(" ")'), /cable ferry works around the break|temporary scow/i,
      'the retained causeway examination acknowledges the visible post-MQ5 ferry');
    assert.doesNotMatch(g.run('dialogue.pages.flat().join(" ")'), /No boat\. No ferry/i,
      'the post-MQ5 causeway text does not contradict the arrived ferry');
    g.run('finishDialogue();placeAtLocation("EAST_CAUSEWAY_MAP",8.5*TILE,7.5*TILE);dialogue.open=false;choice.open=false;handleInteract();');
    assert.equal(g.run('dialogue.name'), 'Ferry Operator', 'the operator owns the ferry interaction at the separate landing position');
    while (g.run('dialogue.open')) g.run('handleInteract();');
    g.run('choice.open=false;placeAtLocation("EAST_CAUSEWAY_MAP",10.5*TILE,8.5*TILE);');
    const westRenderState = J('JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,mq:MainQuest})');
    g.renderFrame();
    g.renderFrame();
    assert.deepEqual(J('JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,mq:MainQuest})'), westRenderState,
      'ferry decoration renders deterministically without mutating gameplay state');
    const beforeDecline = J('JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,mq:MainQuest,flag:sera_liora_opening_complete})');
    g.run('dialogue.open=false;choice.open=false;interactCausewayFerry();finishDialogue();');
    assert.deepEqual(J('JSON.stringify(choice.options)'), ['Cross now', 'Not yet']);
    g.press('ArrowDown');
    g.press('Enter');
    assert.equal(g.run('choice.open'), false);
    assert.deepEqual(J('JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,mq:MainQuest,flag:sera_liora_opening_complete})'), beforeDecline);

    // Crossing uses transitionToLocation and lands on a walkable eastern-bank
    // road cell. The fully flooded west edge provides no ordinary seam/bypass;
    // the east edge is the legitimate onward route added beyond the ferry gate.
    g.run('interactCausewayFerry();finishDialogue();');
    g.press('Enter');
    assert.equal(currentMapId(g), EAST);
    assert.equal(g.run('player.x'), 5.5 * g.run('TILE'));
    assert.equal(g.run('player.y'), 8.5 * g.run('TILE'));
    assert.equal(g.run("isTileWalkable(MAP_CATALOG['EASTERN_BANK_MAP'].map[8][5])"), true);
    assert.equal(g.run("typeof EDGE_TRANSITIONS['EASTERN_BANK_MAP'].west"), 'undefined');
    assert.deepEqual(J("JSON.stringify(EDGE_TRANSITIONS['EASTERN_BANK_MAP'].east)"), [
      { targetMap: 'EASTERN_FENS_EMBANKMENT_W_MAP', targetEdge: 'west', sourceRange: [7, 9] },
    ]);
    assert.equal(g.run("MAP_CATALOG['EASTERN_BANK_MAP'].map.every(function(row){return row[0]===WATER;})"), true);
    assert.deepEqual(J("JSON.stringify((function(){var n=SIMPLE_NPCS.find(function(x){return x.id==='causeway_ferry_operator';});return {map:n.map,physical:n.physicalMapId};})())"),
      { map: 'eastern_bank', physical: EAST });
    const eastRenderState = J('JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,mq:MainQuest})');
    g.renderFrame();
    assert.deepEqual(J('JSON.stringify({map:mapIdForRef(activeMap),x:player.x,y:player.y,mq:MainQuest})'), eastRenderState);

    const eastMap = g.run("JSON.stringify(MAP_CATALOG['EASTERN_BANK_MAP'].map)");
    assert.equal(sha256(eastMap), EAST_FP);
    assert.equal(GRID_FP.fingerprints[EAST], EAST_FP);
    assert.equal(g.run("MAP_CATALOG['EASTERN_BANK_MAP'].allowRandomEncounters"), false);
    assert.equal(g.run("MAP_CATALOG['EASTERN_BANK_MAP'].allowSave"), true);
    assert.equal(g.run("MAP_CATALOG['EASTERN_BANK_MAP'].items.length"), 0);

    // Save/load restores MQ5, its one completion flag, and the canonical bank.
    g.run('player.facing="right";saveGame();');
    const eastSave = J("localStorage.getItem('verdantVale_save')");
    assert.equal(eastSave.version, 4);
    assert.equal(eastSave.MainQuest, 5);
    assert.equal(eastSave.sera_liora_opening_complete, true);
    assert.equal(eastSave.location.kind, 'regional');
    g.run("MainQuest=0;sera_liora_opening_complete=false;syncQuestFlagsToWindow();placeAtLocation('MAP2',2.5*TILE,2.5*TILE);");
    assert.equal(g.run('loadGame()'), true);
    assert.equal(g.run('MainQuest'), 5);
    assert.equal(g.run('sera_liora_opening_complete'), true);
    assert.equal(currentMapId(g), EAST);

    // The same single operator offers the safe return trip and the west spawn
    // is the established walkable road-end stone.
    g.run('dialogue.open=false;choice.open=false;interactCausewayFerry();finishDialogue();');
    assert.match(g.run('dialogue.name'), /Ferry Operator/);
    g.press('Enter');
    assert.equal(currentMapId(g), WEST);
    assert.equal(g.run('player.x'), 10.5 * g.run('TILE'));
    assert.equal(g.run('player.y'), 8.5 * g.run('TILE'));
    assert.equal(g.run("isTileWalkable(MAP_CATALOG['EAST_CAUSEWAY_MAP'].map[8][10])"), true);
    g.run('saveGame();placeAtLocation("MAP2",2.5*TILE,2.5*TILE);');
    assert.equal(g.run('loadGame()'), true);
    assert.equal(currentMapId(g), WEST, 'west-bank return save restores safely');
    assert.equal(g.run('MainQuest'), 5);
    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.equal(J('JSON.stringify(validateGameData())').errors, 0);
  },
};
