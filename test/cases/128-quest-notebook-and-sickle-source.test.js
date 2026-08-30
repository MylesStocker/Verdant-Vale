'use strict';
// Three small quest/notebook corrections: Weight Discrepancy tracks every
// active stage, Still Water begins only with Mabel and keeps its sickle hidden
// beforehand, and the Doctor's Letter can be read in full from Special Items.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Quest notebook/source polish: Weight Discrepancy, Mabel, and Doctor\'s Letter',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    const weightNote = () => JSON.parse(g.run(`JSON.stringify(
      getActiveQuestNotes().find(function(note){return note.title==='The Weight Discrepancy';}) || null
    )`));

    // The Weight Discrepancy has one accurate note throughout its active route.
    g.run('weight_quest_stage=0;weight_note_signed=false;');
    assert.equal(weightNote(), null, 'unaccepted quest has no notebook entry');
    g.run('weight_quest_stage=1;');
    assert.match(weightNote().body, /Aldric.*Calwick district office/i);
    g.run('weight_quest_stage=2;weight_note_signed=false;');
    assert.match(weightNote().body, /Corvin.*countersign/i);
    g.run('weight_note_signed=true;');
    assert.match(weightNote().body, /File.*cabinet by the window/i);
    g.run('weight_quest_stage=3;');
    assert.match(weightNote().body, /Harbormaster Renn.*Drenwick waterfront office/i);
    g.run('weight_quest_stage=4;');
    assert.equal(weightNote(), null, 'completed quest leaves no active entry');

    // Drenwick's board neither advertises nor starts Still Water.
    g.run(`
      day=1;sickle_quest_stage=0;sentry_quest_done=false;sentry_seen_on_board=false;
      inTown=true;townBuilding=null;currentTownId='drenwick';activeMap=DRENWICK_MARKET_MAP;
      player.x=DRENWICK_MARKET_NOTICE_BOARD_X;player.y=DRENWICK_MARKET_NOTICE_BOARD_Y;
      dialogue.open=false;choice.open=false;refreshJobBoard();
    `);
    assert.doesNotMatch(
      g.run("DRENWICK_JOB_BOARD_NOTICES.join(' ')"),
      /sickle|lost tool|Mabel/i,
      'Still Water has no Drenwick-board posting'
    );
    g.run('interactTownOutdoor();dialogue.callbacks[0]();');
    assert.equal(g.run('sickle_quest_stage'), 0, 'reading the board cannot start Still Water');
    assert.equal(g.run('sentry_seen_on_board'), true, 'the remaining Pale Sentry board callback still works');

    // Before Mabel gives the quest, the Fen Sickle neither draws nor collects.
    g.run(`
      var testSickle=MAP3_N1_ITEMS.find(function(item){return item.name==='Fen Sickle';});
      testSickle.picked=false;sickle_quest_stage=0;dialogue.open=false;
    `);
    assert.equal(g.run(`(function(){
      var calls=0,old=ctx.fillRect;ctx.fillRect=function(){calls++;};
      try{drawMapWorldItems([testSickle]);}finally{ctx.fillRect=old;}
      return calls;
    })()`), 0, 'Fen Sickle has no pre-quest rendering');
    g.run('collectWorldItemNear(testSickle,testSickle.x,testSickle.y);');
    assert.equal(g.run('testSickle.picked'), false, 'Fen Sickle cannot be collected before speaking to Mabel');
    assert.equal(g.run('dialogue.open'), false, 'the hidden sickle gives no pre-quest description');

    // Mabel herself starts Still Water; that same existing stage gate reveals it.
    g.run(`
      var testMabel=SIMPLE_NPCS.find(function(npc){return npc.id==='hamlet_mabel';});
      NPC_ACTIONS.mabelSickleQuest(testMabel);
    `);
    assert.equal(g.run('sickle_quest_stage'), 1, 'Mabel starts the quest on first conversation');
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /I lost my sickle/i);
    assert.equal(g.run(`(function(){
      var calls=0,old=ctx.fillRect;ctx.fillRect=function(){calls++;};
      try{drawMapWorldItems([testSickle]);}finally{ctx.fillRect=old;}
      return calls>0;
    })()`), true, 'Fen Sickle renders once Mabel has given the quest');
    assert.match(
      g.run("getActiveQuestNotes().find(function(note){return note.title===\"Mabel's Sickle\";}).body"),
      /north bank/i,
      'Mabel conversation activates the established quest note'
    );

    // The Doctor's Letter has a specific notebook summary and a full read,
    // then ENTER on its Special Items row opens those pages through the menu.
    g.run(`stats.items=[];grantItem("Doctor's Letter");dialogue.open=false;`);
    const doctorNote = JSON.parse(g.run(`JSON.stringify(
      getActiveQuestNotes().find(function(note){return note.title==="Doctor's Letter";})
    )`));
    assert.match(doctorNote.body, /former Drenwick doctor/i);
    assert.match(doctorNote.body, /Inspect it to read it/i);
    assert.notEqual(doctorNote.body, 'A quest item.');
    const doctorPages = JSON.parse(g.run(`JSON.stringify(getSpecialItemInspectPages("Doctor's Letter"))`));
    assert.equal(doctorPages.length, 5, 'the complete letter is available as a multi-page read');
    assert.match(JSON.stringify(doctorPages), /cases I cannot hand over/i);
    assert.match(JSON.stringify(doctorPages), /Yeddin/i);

    const doctorRow = g.run(`getActiveQuestNotes().findIndex(function(note){return note.title==="Doctor's Letter";})`);
    g.run(`menu.open=true;menu.screen='notebook';menu.notebookCursor=${doctorRow};dialogue.open=false;`);
    g.press('Enter');
    assert.equal(g.run('menu.open'), false);
    assert.equal(g.run('dialogue.open'), true);
    assert.equal(g.run('dialogue.name'), "Doctor's Letter");
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /one prescription I am sure of/i);

    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.equal(JSON.parse(g.run('JSON.stringify(validateGameData())')).errors, 0);
  },
};
