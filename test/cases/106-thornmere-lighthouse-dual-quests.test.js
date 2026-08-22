'use strict';
// Mutually exclusive Thornmere lighthouse quest routes. Interior behavior is
// covered separately by case 107; this case remains the giver/journal/reward
// authority test and continues to pin the unchanged regional grids.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run('Math.random = function(){ return 0.9; }; debugMode = true;');
  return g;
}

function dismiss(g) {
  for (let i = 0; i < 30 && g.run('dialogue.open'); i++) g.press(' ');
}

function text(g) {
  return g.run("dialogue.pages ? dialogue.pages.flat().join(' ') : ''");
}

function setOutcome(g, outcome, mainQuest) {
  const mq = mainQuest === undefined ? 'true' : String(mainQuest);
  const setup = {
    unresolved: 'fort_quest_stage=0;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;',
    killed: 'fort_quest_stage=6;smugglers_dead=true;fort_report_filed=false;smugglers_execution_day=0;',
    killedReported: 'fort_quest_stage=6;smugglers_dead=true;fort_report_filed=true;smugglers_execution_day=0;',
    reported: 'fort_quest_stage=6;smugglers_dead=false;fort_report_filed=true;smugglers_execution_day=25;',
    allied: 'fort_quest_stage=6;smugglers_dead=false;fort_report_filed=false;smugglers_execution_day=0;',
  }[outcome];
  g.run(`${setup}
    sluice_job_started=true;sluice_fixed=true;sluice_reward_given=true;
    dispatch_quest_started=true;dispatch_delivered=true;dispatch_rewarded=true;
    fort_quest_started=true;fort_pay_ticket_ready=false;mq4_available_day=11;
    MainQuest=4;reservoir_quest_started=${mq};lighthouse_quest_stage=0;syncQuestFlagsToWindow();`);
}

function atSupervisorInn(g, day) {
  g.run(`resetLocationState();clearRegionalPosition();activeMap=INN_MAP;inTown=true;currentTownId='calwick';
    townBuilding='inn';day=${day};player.x=SUPERVISOR_DAYOFF.x;player.y=SUPERVISOR_DAYOFF.y;
    dialogue.open=false;dialogue.callbacks=null;choice.open=false;shop.open=false;menu.open=false;`);
}

function atSupervisorOffice(g) {
  g.run(`resetLocationState();clearRegionalPosition();activeMap=OFFICE_MAP;inTown=true;currentTownId='calwick';
    townBuilding='office';day=11;player.x=SUPERVISOR.x;player.y=SUPERVISOR.y;
    netto_letter_received=true;supervisor_greet_day=day;supervisor_said_flood=true;
    dialogue.open=false;dialogue.callbacks=null;choice.open=false;shop.open=false;menu.open=false;`);
}

function atPolwick(g, day) {
  g.run(`resetLocationState();clearRegionalPosition();activeMap=SMUGGLER_FORT_MAP;inSmugglerFort=true;day=${day};
    player.x=7.5*TILE;player.y=4.5*TILE;dialogue.open=false;dialogue.callbacks=null;
    choice.open=false;shop.open=false;menu.open=false;`);
}

function acceptSupervisor(g) {
  atSupervisorInn(g, 10);
  g.run('handleInteract();');
  assert.match(text(g), /engagement ring/i);
  assert.equal(g.run('lighthouse_quest_stage'), 0, 'viewing the Supervisor offer does not lock a route');
  dismiss(g);
  assert.equal(g.run('choice.open'), true);
  g.run('choice.cursor=0;'); g.press(' ');
  assert.equal(g.run('lighthouse_quest_stage'), 1);
  dismiss(g);
}

function acceptPolwick(g, day) {
  atPolwick(g, day === undefined ? 7 : day);
  g.run('handleInteract();');
  assert.match(text(g), /gem.*smuggling|smuggling.*gem/i);
  assert.equal(g.run('lighthouse_quest_stage'), 0, 'viewing Polwick\'s offer does not lock a route');
  dismiss(g);
  assert.equal(g.run('choice.open'), true);
  g.run('choice.cursor=0;'); g.press(' ');
  assert.equal(g.run('lighthouse_quest_stage'), 3);
  dismiss(g);
}

function questNote(g, title) {
  return JSON.parse(g.run(`JSON.stringify(getActiveQuestNotes().find(function(n){return n.title===${JSON.stringify(title)};})||null)`));
}

module.exports = {
  name: 'Thornmere lighthouse dual quests: exclusive offers, objectives, journal, turn-ins, save and validation',
  run() {
    // ── 1. MQ4 milestone and shared route gate ─────────────────────────────
    let g = fresh();
    const supervisorScene = "({giver:'supervisor',supervisorDrinkingAtDayoffInn:true})";
    const polwickScene = "({giver:'polwick',polwickAlliedAvailable:true})";

    setOutcome(g, 'killed', false);
    assert.equal(g.run(`getLighthouseQuestOfferRoute(${supervisorScene})`), null, 'before MQ4 assignment: no Supervisor offer');
    setOutcome(g, 'allied', false);
    assert.equal(g.run(`getLighthouseQuestOfferRoute(${polwickScene})`), null, 'before MQ4 assignment: no Polwick offer');

    setOutcome(g, 'killed', true);
    g.run('MainQuest=3;');
    assert.equal(g.run(`getLighthouseQuestOfferRoute(${supervisorScene})`), 'supervisor', 'MQ4 assigned via reservoir_quest_started');
    g.run('MainQuest=5;');
    assert.equal(g.run(`getLighthouseQuestOfferRoute(${supervisorScene})`), 'supervisor', 'later MainQuest stage does not close eligibility');
    assert.equal(g.run('MainQuest'), 5);
    setOutcome(g, 'unresolved', true);
    assert.equal(g.run(`getLighthouseQuestOfferRoute(${supervisorScene})`), null, 'no Polwick resolution: no Supervisor route');
    assert.equal(g.run(`getLighthouseQuestOfferRoute(${polwickScene})`), null, 'no Polwick resolution: no Polwick route');

    // ── 2. Supervisor eligibility matrix and real drinking scene ───────────
    for (const outcome of ['killed', 'killedReported', 'reported']) {
      const c = fresh(); setOutcome(c, outcome, true);
      assert.equal(c.run(`getLighthouseQuestOfferRoute(${supervisorScene})`), 'supervisor', outcome + ': Supervisor eligible');
    }
    setOutcome(g, 'killed', true);
    assert.equal(g.run("getLighthouseQuestOfferRoute({giver:'supervisor',supervisorDrinkingAtDayoffInn:false})"), null, 'non-drinking interaction: no offer');
    assert.equal(g.run("getLighthouseQuestOfferRoute({giver:'supervisor'})"), null, 'missing Dayoff scene fact fails closed');
    assert.equal(g.run("getLighthouseQuestOfferRoute({giver:'polwick',polwickAlliedAvailable:true})"), null, 'killed: no Polwick offer');
    atSupervisorInn(g, 11); g.run('handleInteract();');
    assert.doesNotMatch(text(g), /engagement ring|A Ring in the Shallows/i, 'workday inn: Supervisor is not offering'); dismiss(g);
    atSupervisorOffice(g); g.run('handleInteract();');
    assert.doesNotMatch(text(g), /engagement ring|own money/i, 'office interaction cannot receive the offer'); dismiss(g);
    setOutcome(g, 'allied', true);
    assert.equal(g.run(`getLighthouseQuestOfferRoute(${supervisorScene})`), null, 'allied: no Supervisor offer');

    const sr = fresh(); setOutcome(sr, 'reported', true); acceptSupervisor(sr);
    assert.equal(sr.run('MainQuest'), 4, 'acceptance does not touch MainQuest');
    assert.equal(sr.run("stats.items.some(function(i){return i.name==='Old Engagement Ring'||i.name==='Stashed Gem';})"), false, 'acceptance grants no objective');

    // The Dayoff/inn restriction belongs only to the initial offer. Once the
    // route is accepted, the ordinary workday office interaction owns both
    // the reminder and the future-safe turn-in.
    const officeRoute = fresh(); setOutcome(officeRoute, 'reported', true); acceptSupervisor(officeRoute);
    atSupervisorOffice(officeRoute); officeRoute.run('handleInteract();');
    assert.match(text(officeRoute), /old lighthouse.*engagement ring|engagement ring.*inside/i, 'accepted route receives its reminder at the office');
    assert.doesNotMatch(text(officeRoute), /my own money|I can offer/i, 'office reminder is not a fresh offer');
    assert.equal(officeRoute.run('lighthouse_quest_stage'), 1);
    dismiss(officeRoute);

    officeRoute.run("stats.gold=10;grantItem('Old Engagement Ring');");
    atSupervisorOffice(officeRoute); officeRoute.run('handleInteract();');
    assert.match(text(officeRoute), /one hundred and fifty gold|Mine, as promised/i, 'ring can be returned through the office interaction');
    dismiss(officeRoute);
    assert.equal(officeRoute.run('lighthouse_quest_stage'), 2, 'office turn-in completes the Supervisor route');
    assert.equal(officeRoute.run('stats.gold'), 160, 'office turn-in pays exactly 150g');
    assert.equal(officeRoute.run("stats.items.filter(function(i){return i.name==='Old Engagement Ring';}).length"), 0, 'office turn-in removes exactly one ring');

    atSupervisorOffice(officeRoute); officeRoute.run('handleInteract();'); dismiss(officeRoute);
    assert.equal(officeRoute.run('stats.gold'), 160, 'repeat office interaction pays nothing');
    officeRoute.run('saveGame();stats.gold=0;loadGame();');
    assert.equal(officeRoute.run('stats.gold'), 160, 'completed office turn-in survives save/load');
    atSupervisorOffice(officeRoute); officeRoute.run('handleInteract();'); dismiss(officeRoute);
    assert.equal(officeRoute.run('stats.gold'), 160, 'post-load office interaction pays nothing');
    assert.equal(officeRoute.run("stats.items.filter(function(i){return i.name==='Old Engagement Ring';}).length"), 0, 'repeat and post-load interactions remove no further item');

    const sd = fresh(); setOutcome(sd, 'killed', true); atSupervisorInn(sd, 10); sd.run('handleInteract();'); dismiss(sd);
    sd.run('choice.cursor=1;'); sd.press(' ');
    assert.equal(sd.run('lighthouse_quest_stage'), 0, 'declining the Supervisor offer does not lock a route');
    assert.equal(sd.run(`getLighthouseQuestOfferRoute(${supervisorScene})`), 'supervisor', 'declined route remains eligible');

    // ── 3. Polwick eligibility and established allied fort path ────────────
    g = fresh(); setOutcome(g, 'allied', true);
    assert.equal(g.run(`getLighthouseQuestOfferRoute(${polwickScene})`), 'polwick');
    g.run('day=1;'); assert.equal(g.run(`getLighthouseQuestOfferRoute(${polwickScene})`), 'polwick', 'workday allowed');
    g.run('day=10;'); assert.equal(g.run(`getLighthouseQuestOfferRoute(${polwickScene})`), 'polwick', 'Dayoff allowed');
    assert.equal(g.run("getLighthouseQuestOfferRoute({giver:'polwick',polwickAlliedAvailable:false})"), null, 'unavailable Polwick path fails closed');
    const pr = fresh(); setOutcome(pr, 'allied', true); acceptPolwick(pr, 7);
    assert.equal(pr.run('MainQuest'), 4, 'Polwick acceptance does not touch MainQuest');
    assert.equal(pr.run("stats.items.some(function(i){return i.name==='Old Engagement Ring'||i.name==='Stashed Gem';})"), false);
    const pd = fresh(); setOutcome(pd, 'allied', true); atPolwick(pd, 6); pd.run('handleInteract();'); dismiss(pd);
    pd.run('choice.cursor=1;'); pd.press(' ');
    assert.equal(pd.run('lighthouse_quest_stage'), 0, 'declining Polwick\'s offer does not lock a route');
    assert.equal(pd.run(`getLighthouseQuestOfferRoute(${polwickScene})`), 'polwick', 'declined route remains eligible');
    for (const outcome of ['killed', 'reported']) {
      const c = fresh(); setOutcome(c, outcome, true);
      assert.equal(c.run(`getLighthouseQuestOfferRoute(${polwickScene})`), null, outcome + ': no Polwick offer');
    }

    // ── 4. Mutual exclusion, old-save default, and malformed-state rejection ─
    assert.equal(sr.run(`getLighthouseQuestOfferRoute(${polwickScene})`), null, 'Supervisor acceptance locks Polwick');
    sr.run('saveGame();lighthouse_quest_stage=0;syncQuestFlagsToWindow();');
    assert.equal(sr.run('loadGame()'), true);
    assert.equal(sr.run('lighthouse_quest_stage'), 1, 'Supervisor route lock survives load');
    assert.equal(sr.run(`getLighthouseQuestOfferRoute(${polwickScene})`), null);

    assert.equal(pr.run(`getLighthouseQuestOfferRoute(${supervisorScene})`), null, 'Polwick acceptance locks Supervisor');
    pr.run('saveGame();lighthouse_quest_stage=0;syncQuestFlagsToWindow();');
    assert.equal(pr.run('loadGame()'), true);
    assert.equal(pr.run('lighthouse_quest_stage'), 3, 'Polwick route lock survives load');

    const held = fresh(); setOutcome(held, 'killed', true);
    held.run("lighthouse_quest_stage=1;grantItem('Old Engagement Ring');saveGame();stats.items=[];lighthouse_quest_stage=0;");
    assert.equal(held.run('loadGame()'), true);
    assert.equal(held.run('lighthouse_quest_stage'), 1, 'accepted route with objective survives load');
    assert.equal(held.run("stats.items.filter(function(i){return i.name==='Old Engagement Ring';}).length"), 1, 'held objective survives load exactly once');

    const old = fresh(); setOutcome(old, 'killed', true); old.run('lighthouse_quest_stage=1;saveGame();');
    old.run(`(function(){var d=JSON.parse(localStorage.getItem('verdantVale_save'));delete d.lighthouse_quest_stage;localStorage.setItem('verdantVale_save',JSON.stringify(d));})();`);
    old.run('lighthouse_quest_stage=2;');
    assert.equal(old.run('loadGame()'), true, 'pre-field current-version save loads');
    assert.equal(old.run('lighthouse_quest_stage'), 0, 'missing route defaults safely to none');

    const bad = fresh(); setOutcome(bad, 'killed', true);
    bad.run('lighthouse_quest_stage=3;syncQuestFlagsToWindow();');
    assert.ok(JSON.parse(bad.run('JSON.stringify(lighthouseQuestInvariantErrors())')).length > 0);
    assert.equal(bad.run('getActiveLighthouseObjective()'), null, 'contradictory route has no objective');
    assert.equal(bad.run(`getLighthouseQuestOfferRoute(${supervisorScene})`), null, 'contradictory route has no offer');
    assert.equal(bad.run("completeLighthouseQuest('polwick')"), null, 'contradictory route has no reward');
    const invalidValidation = JSON.parse(bad.run('JSON.stringify(validateGameData())'));
    assert.ok(invalidValidation.errorList.some((e) => /lighthouse quest/.test(e.message)), 'validator surfaces contradiction');
    assert.equal(bad.run('saveGame()'), false, 'invalid live state is not saved');

    const malformed = fresh(); setOutcome(malformed, 'killed', true);
    malformed.run('lighthouse_quest_stage=1;saveGame();');
    malformed.run(`(function(){var d=JSON.parse(localStorage.getItem('verdantVale_save'));d.lighthouse_quest_stage=3;localStorage.setItem('verdantVale_save',JSON.stringify(d));})();`);
    const malformedRaw = malformed.run("localStorage.getItem('verdantVale_save')");
    malformed.run('lighthouse_quest_stage=1;stats.gold=77;');
    assert.equal(malformed.run('loadGame()'), false, 'malformed saved route rejects atomically');
    assert.equal(malformed.run('lighthouse_quest_stage'), 1); assert.equal(malformed.run('stats.gold'), 77);
    assert.equal(malformed.run("localStorage.getItem('verdantVale_save')"), malformedRaw, 'rejected save remains untouched');
    malformed.run('lighthouse_quest_stage=99;');
    assert.equal(malformed.run('getActiveLighthouseObjective()'), null, 'unrepresentable both/unknown stage fails closed');

    // ── 5. Pure objective contract and journal isolation ────────────────────
    g = fresh(); setOutcome(g, 'killed', true);
    assert.equal(g.run('getActiveLighthouseObjective()'), null, 'none selected: no objective');
    assert.equal(questNote(g, 'A Ring in the Shallows'), null, 'unaccepted offer is not journaled');
    g.run('lighthouse_quest_stage=1;syncQuestFlagsToWindow();');
    assert.equal(g.run('getActiveLighthouseObjective()'), 'Old Engagement Ring');
    let note = questNote(g, 'A Ring in the Shallows');
    assert.match(note.body, /Old Engagement Ring.*abandoned lighthouse.*Thornmere Shallows.*Creatures/i);
    assert.equal(questNote(g, "The Smuggler's Share"), null, 'excluded route never journaled');
    g.run("grantItem('Stashed Gem');");
    note = questNote(g, 'A Ring in the Shallows');
    assert.match(note.body, /^Recover /, 'wrong-route item does not advance journal');
    assert.doesNotMatch(g.run("getActiveQuestNotes().map(function(n){return (n.title||'')+' '+(n.body||'');}).join(' ')"), /Stashed Gem/, 'wrong objective is not revealed');
    g.run("grantItem('Old Engagement Ring');");
    assert.match(questNote(g, 'A Ring in the Shallows').body, /Return.*Supervisor/i);
    g.run('stats.items=[];lighthouse_quest_stage=2;syncQuestFlagsToWindow();');
    assert.equal(g.run('getActiveLighthouseObjective()'), null, 'completed Supervisor route: no objective');
    assert.equal(questNote(g, 'A Ring in the Shallows'), null, 'completed quest leaves no stale note');

    g = fresh(); setOutcome(g, 'allied', true); g.run('lighthouse_quest_stage=3;syncQuestFlagsToWindow();');
    assert.equal(g.run('getActiveLighthouseObjective()'), 'Stashed Gem');
    note = questNote(g, "The Smuggler's Share");
    assert.match(note.body, /Stashed Gem.*abandoned lighthouse.*Creatures/i);
    assert.equal(questNote(g, 'A Ring in the Shallows'), null);
    g.run("grantItem('Old Engagement Ring');");
    assert.match(questNote(g, "The Smuggler's Share").body, /^Recover /);
    g.run("grantItem('Stashed Gem');");
    assert.match(questNote(g, "The Smuggler's Share").body, /Return.*Polwick/i);
    g.run('stats.items=[];lighthouse_quest_stage=4;syncQuestFlagsToWindow();');
    assert.equal(g.run('getActiveLighthouseObjective()'), null);
    assert.equal(questNote(g, "The Smuggler's Share"), null);

    // ── 6. Registry-only items: no placement, grant, stock, loot, or start ──
    g = fresh();
    for (const name of ['Old Engagement Ring', 'Stashed Gem']) {
      assert.deepEqual(JSON.parse(g.run(`JSON.stringify(ITEM_REGISTRY[${JSON.stringify(name)}])`)),
        { name, type:'accessory', bonus:0, price:0, questItem:true, keyItem:true });
    }
    assert.equal(g.run("stats.items.some(function(i){return i.name==='Old Engagement Ring'||i.name==='Stashed Gem';})"), false, 'not in starting inventory');
    assert.equal(g.run("Object.values(MAP_CATALOG).some(function(m){return m.items.some(function(i){return i.name==='Old Engagement Ring'||i.name==='Stashed Gem';});})"), false, 'not in map pickups');
    assert.equal(g.run("JSON.stringify(SHOP_REGISTRY).includes('Old Engagement Ring')||JSON.stringify(SHOP_REGISTRY).includes('Stashed Gem')"), false, 'not in shops');
    assert.equal(g.run("JSON.stringify(ENEMY_TEMPLATE_REGISTRY).includes('Old Engagement Ring')||JSON.stringify(ENEMY_TEMPLATE_REGISTRY).includes('Stashed Gem')"), false, 'not in encounter loot');
    assert.equal(g.run("JSON.stringify(CHEST_REGISTRY).includes('Old Engagement Ring')||JSON.stringify(CHEST_REGISTRY).includes('Stashed Gem')"), false, 'not in chests');

    // ── 7. Supervisor turn-in: exact one-item removal, 150g, idempotence ────
    g = fresh(); setOutcome(g, 'killed', true);
    g.run("lighthouse_quest_stage=1;reservoir_report_filed=true;stats.gold=10;grantItem('Old Engagement Ring');grantItem('Old Engagement Ring');grantItem('Stashed Gem');syncQuestFlagsToWindow();");
    atSupervisorOffice(g); g.run('handleInteract();');
    assert.match(text(g), /one hundred and fifty|own|Mine/i); dismiss(g);
    assert.equal(g.run('lighthouse_quest_stage'), 2);
    assert.equal(g.run('stats.gold'), 160, 'exactly 150g paid');
    assert.equal(g.run("polwickLighthouseOutcome()"), 'killed', 'turn-in does not alter Polwick outcome');
    assert.equal(g.run('MainQuest'), 4, 'turn-in does not alter MainQuest');
    assert.equal(g.run("stats.items.filter(function(i){return i.name==='Old Engagement Ring';}).length"), 1, 'exactly one ring removed');
    assert.equal(g.run("stats.items.filter(function(i){return i.name==='Stashed Gem';}).length"), 1, 'wrong item untouched');
    const supervisorGold = g.run('stats.gold');
    atSupervisorOffice(g); g.run('handleInteract();'); dismiss(g);
    assert.equal(g.run('stats.gold'), supervisorGold, 'repeated interaction pays zero');
    g.run('saveGame();stats.gold=0;loadGame();');
    assert.equal(g.run('stats.gold'), supervisorGold, 'completed reward state survives load');
    atSupervisorOffice(g); g.run('handleInteract();'); dismiss(g);
    assert.equal(g.run('stats.gold'), supervisorGold, 'post-load interaction cannot duplicate reward');

    // Wrong giver/item/missing route paths are inert.
    const wrong = fresh(); setOutcome(wrong, 'killed', true);
    wrong.run("lighthouse_quest_stage=1;stats.gold=0;grantItem('Stashed Gem');syncQuestFlagsToWindow();");
    assert.equal(wrong.run("completeLighthouseQuest('supervisor')"), null);
    assert.equal(wrong.run("completeLighthouseQuest('polwick')"), null);
    assert.equal(wrong.run('stats.gold'), 0); assert.equal(wrong.run('stats.items.length'), 1);
    wrong.run("stats.items=[];grantItem('Old Engagement Ring');lighthouse_quest_stage=0;");
    assert.equal(wrong.run("completeLighthouseQuest('supervisor')"), null, 'unaccepted route cannot pay');

    // ── 8. Polwick turn-in: exact one-item removal, 400g, idempotence ───────
    g = fresh(); setOutcome(g, 'allied', true);
    g.run("lighthouse_quest_stage=3;stats.gold=20;grantItem('Stashed Gem');grantItem('Stashed Gem');grantItem('Old Engagement Ring');syncQuestFlagsToWindow();");
    atPolwick(g, 8); g.run('handleInteract();');
    assert.match(text(g), /four hundred|share of the proceeds/i); dismiss(g);
    assert.equal(g.run('lighthouse_quest_stage'), 4);
    assert.equal(g.run('stats.gold'), 420, 'exactly 400g paid');
    assert.equal(g.run("polwickLighthouseOutcome()"), 'allied', 'turn-in does not alter Polwick outcome');
    assert.equal(g.run('MainQuest'), 4, 'turn-in does not alter MainQuest');
    assert.equal(g.run("stats.items.filter(function(i){return i.name==='Stashed Gem';}).length"), 1, 'exactly one gem removed');
    assert.equal(g.run("stats.items.filter(function(i){return i.name==='Old Engagement Ring';}).length"), 1, 'wrong item untouched');
    const polwickGold = g.run('stats.gold');
    atPolwick(g, 9); g.run('handleInteract();'); dismiss(g);
    assert.equal(g.run('stats.gold'), polwickGold, 'second copy cannot trigger second payout');
    g.run('saveGame();stats.gold=0;loadGame();');
    assert.equal(g.run('stats.gold'), polwickGold);
    atPolwick(g, 10); g.run('handleInteract();'); dismiss(g);
    assert.equal(g.run('stats.gold'), polwickGold, 'post-load payout remains idempotent');

    // ── 9. Existing interaction priority and outcome behavior remain intact ─
    const main = fresh(); setOutcome(main, 'killed', true);
    main.run("lighthouse_quest_stage=1;grantItem('Old Engagement Ring');window.sunken_gallery_seen=true;reservoir_report_filed=false;syncQuestFlagsToWindow();");
    atSupervisorOffice(main); main.run('handleInteract();');
    assert.match(text(main), /reservoir bed|Tell me what you found/i, 'ready MQ4 report retains priority');
    assert.doesNotMatch(text(main), /recognizes the ring|one hundred and fifty/i);
    assert.equal(main.run("stats.items.some(function(i){return i.name==='Old Engagement Ring';})"), true);
    assert.equal(main.run('lighthouse_quest_stage'), 1);

    const ordinarySupervisor = fresh(); setOutcome(ordinarySupervisor, 'unresolved', false);
    atSupervisorInn(ordinarySupervisor, 10); ordinarySupervisor.run('handleInteract();');
    assert.match(text(ordinarySupervisor), /Fourteen years|leave it at the door/i, 'ordinary drinking dialogue intact');

    const ordinaryPolwick = fresh(); setOutcome(ordinaryPolwick, 'allied', false);
    atPolwick(ordinaryPolwick, 3); ordinaryPolwick.run('handleInteract();');
    assert.match(text(ordinaryPolwick), /You again|We had a deal/i, 'allied fallback intact before MQ4');
    const deadPolwick = fresh(); setOutcome(deadPolwick, 'killed', true); atPolwick(deadPolwick, 7);
    assert.equal(deadPolwick.run("SIMPLE_NPCS.find(function(n){return n.id==='polwick';}).map"), null, 'killed Polwick remains unavailable');
    const reportedPolwick = fresh(); setOutcome(reportedPolwick, 'reported', true); reportedPolwick.run('day=30;'); atPolwick(reportedPolwick, 30);
    assert.equal(reportedPolwick.run("SIMPLE_NPCS.find(function(n){return n.id==='polwick';}).map"), null, 'reported Polwick remains unavailable after execution day');

    // ── 10. Quest authority remains singular; regional grids stay unchanged ──
    assert.equal(g.run('SAVE_VERSION'), 4, 'save version unchanged');
    assert.equal(g.run("QUEST_FLAG_SCHEMA.filter(function(k){return k==='lighthouse_quest_stage';}).length"), 1, 'one persisted lighthouse authority');
    const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG[${JSON.stringify(id)}].map)`)), fp, id + ': fingerprint unchanged');
    }
    const root = path.join(__dirname, '..', '..');
    const productionFiles = fs.readdirSync(root).filter((name) => name.endsWith('.js'))
      .concat(['content/interactions/calwick-interactions.js', 'content/interactions/thornmere-wilds-interactions.js'])
      .map((name) => fs.readFileSync(path.join(root, name), 'utf8')).join('\n');
    assert.doesNotMatch(productionFiles, /lighthouseInteriorReady|lighthouse_interior_ready/i, 'no readiness flag');
    assert.equal(g.run("Object.keys(MAP_CATALOG).filter(function(k){return /^LIGHTHOUSE_/.test(k);}).length"), 5, 'five discrete lighthouse maps are registered');

    g.run('day=1;'); // validation's NPC-overlap sweep has one documented Dayoff-only warning
    const validation = JSON.parse(g.run('JSON.stringify(validateGameData())'));
    assert.equal(validation.errors, 0); assert.equal(validation.warnings, 4);
  },
};
