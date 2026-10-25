'use strict';
const assert = require('assert/strict');
const {createContext} = require('../harness');
const J = (g,s) => JSON.parse(g.run('JSON.stringify('+s+')'));
function fresh(esla=true) {
  const g=createContext();
  g.run(`storyCheckpointLab.apply('mq5_assignment_ready'); dialogue.open=false;
    ${esla ? 'completeMq5Assignment();' : ''}
    fort_quest_stage=6;smugglers_dead=false;smugglers_execution_day=0;fort_report_filed=false;
    dialogue.open=false;dialogue.callbacks=null;debugMode=true;enterSmugglerFort();`);
  return g;
}
function close(g) { for(let i=0;i<100&&g.run('dialogue.open');i++)g.press(' ');assert.equal(g.run('dialogue.open'),false); }
function talk(g) {g.run('player.x=7.5*TILE+24;player.y=4.5*TILE;');g.press(' ');assert.equal(g.run('dialogue.open'),true);return g.run("dialogue.pages.flat().join(' ')");}
function move(g,key,condition) {g.hold(key);try{for(let i=0;i<220&&!g.run(condition);i++)g.frames();}finally{g.release(key);}assert.ok(g.run(condition),key+' reaches '+condition);}

module.exports={name:'Polwick: navigable cargo room, relocated Flame tract and three saved Esla exchanges without changing fort/lighthouse outcomes',run(){
  // Real input around the living occupants, through the rear doorway, and out.
  for(const legacy of [false,true]) {
    const g=fresh();g.run('forceLegacyRegionalView='+legacy);
    move(g,'ArrowRight','player.x>=8.5*TILE');
    move(g,'ArrowUp','player.y<=3.5*TILE');
    move(g,'ArrowLeft','player.x<=2.5*TILE');
    assert.equal(g.run('canWalk(player.x,player.y)'),true);
    assert.ok(g.run('saveGame() && loadGame()'),'rear room saves restore normally');
    move(g,'ArrowDown','player.y>=4.5*TILE');g.press(' ');
    assert.equal(g.run('choice.title'),'Something in the crate');g.press(' ');
    assert.equal(g.run('accordPanel.title'),'THE WRONG SIDE WON');
    assert.equal(g.run('accordPanel.open'),true);g.run('accordPanel.open=false;');
    move(g,'ArrowUp','player.y<=2.5*TILE');
    move(g,'ArrowRight','player.x>=4.5*TILE');g.press(' ');
    assert.match(g.run("dialogue.pages.flat().join(' ')"),/untaxed spirits.*wrapped blades/);close(g);
    move(g,'ArrowDown','player.y>=3.5*TILE');
    move(g,'ArrowRight','player.x>=8.5*TILE');
    move(g,'ArrowDown','player.y>=10.5*TILE');
    move(g,'ArrowLeft','player.x<=7.5*TILE');
    move(g,'ArrowDown','!inSmugglerFort');
    assert.equal(g.run('mapIdForRef(activeMap)'),'MAP3_N1');
    assert.equal(g.run('polwick_esla_visit_stage'),0,'inspections do not consume conversations');
  }
  const g=fresh();
  const outcome=()=>J(g,'({MainQuest,fort_quest_stage,fort_report_filed,smugglers_dead,smugglers_execution_day,lighthouse_quest_stage,gold:stats.gold,inventory:stats.items.map(i=>i.name)})');
  const before=outcome();
  assert.match(talk(g),/For his sake, I’ll leave this alone/);
  assert.equal(g.run('polwick_esla_visit_stage'),0,'opening does not consume unread dialogue');
  const pages=J(g,'dialogue.pageSpeakers');
  for(let i=0;i<pages.length;i++){
    g.run('dialogue.page='+i);const view=J(g,'dialoguePagePresentation()');
    assert.equal(view.styleId,pages[i]==='esla'?'esla_light_green':null,'only Esla is green');
  }
  g.run('dialogue.page=0');close(g);
  assert.equal(g.run('polwick_esla_visit_stage'),1);
  assert.ok(g.run('saveGame()'));g.run('polwick_esla_visit_stage=0');assert.ok(g.run('loadGame()'));
  assert.equal(g.run('polwick_esla_visit_stage'),1);
  assert.match(talk(g),/follow the Flame/);assert.match(g.run("dialogue.pages.flat().join(' ')"),/doesn’t make me better than Lély/);close(g);
  assert.match(talk(g),/Still no rain/);close(g);
  assert.equal(g.run('polwick_esla_visit_stage'),3);
  assert.deepEqual(outcome(),before,'no quest, reward, gold or inventory effects');
  assert.match(talk(g),/gem.*smuggling|smuggling.*gem/,'existing lighthouse offer resumes after the exchanges');
  close(g);assert.deepEqual(J(g,'choice.options'),['Recover the gem','Leave it buried']);
  g.run('choice.cursor=1');g.press(' ');
  g.run(`var oldSave=JSON.parse(localStorage.getItem('verdantVale_save'));delete oldSave.polwick_esla_visit_stage;
    localStorage.setItem('verdantVale_save',JSON.stringify(oldSave));`);
  assert.ok(g.run('loadGame()'));assert.equal(g.run('polwick_esla_visit_stage'),0,'older v5 saves default safely');
  g.run(`var badSave=JSON.parse(localStorage.getItem('verdantVale_save'));badSave.polwick_esla_visit_stage=-1;
    localStorage.setItem('verdantVale_save',JSON.stringify(badSave));`);
  assert.equal(g.run('loadGame()'),false,'malformed progress rejected atomically');
  assert.equal(g.run('polwick_esla_visit_stage'),0);
  for(const setup of ['smugglers_dead=true','smugglers_execution_day=day','fort_quest_stage=5','fort_quest_stage=2']){
    const other=fresh();other.run(setup);
    assert.equal(other.run("polwickEslaDialogue(SIMPLE_NPCS.find(n=>n.id==='polwick'))"),false,setup);
  }
  const alone=fresh(false);
  assert.equal(alone.run("polwickEslaDialogue(SIMPLE_NPCS.find(n=>n.id==='polwick'))"),false,'actual membership required');
  assert.equal(g.run('SAVE_VERSION'),5);
  assert.equal(g.run('validateGameData().errors'),0);
}};
