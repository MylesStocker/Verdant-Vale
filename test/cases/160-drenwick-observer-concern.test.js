'use strict';

// Drenwick's three office staff track the same missing-observer case in their
// own voices. Their concern follows the existing saved calendar and reacts to
// Dreyfuss's authoritative body-discovery flag without adding dialogue state.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function context() {
  const g = createContext();
  g.press('Enter');
  g.press('Enter');
  return g;
}

function dialogue(g, id, day, bodyFound = false) {
  g.run(`day=${day};reservoir_quest_started=true;window.gallery_body_found=${bodyFound};`);
  return g.run(`SIMPLE_NPCS.find(function(n){return n.id===${JSON.stringify(id)};}).dialogue.flat().join(' ')`);
}

module.exports = {
  name: 'Drenwick office: Veth, Holt, and Sable grow worried about Garrick and Dreyfuss through day twenty',
  run() {
    const g = context();
    const ids = ['district_officer', 'drenwick_clerk', 'thread_officer'];

    g.run('day=9;reservoir_quest_started=false;window.gallery_body_found=false;');
    for (const id of ids) {
      const ordinary = g.run(`SIMPLE_NPCS.find(function(n){return n.id===${JSON.stringify(id)};}).dialogue.flat().join(' ')`);
      assert.doesNotMatch(ordinary, /Garrick|Dreyfuss/, id + ' does not announce the missing-observer case before MQ4');
    }

    for (const id of ids) {
      const early = dialogue(g, id, 9);
      const worried = dialogue(g, id, 11);
      const grim = dialogue(g, id, 16);
      const fatalistic = dialogue(g, id, 21);
      for (const text of [early, worried, grim, fatalistic]) {
        assert.match(text, /Garrick/);
        assert.match(text, /Dreyfuss/);
      }
      assert.notEqual(early, worried, id + ' changes after day 10');
      assert.notEqual(worried, grim, id + ' changes after day 15');
      assert.notEqual(grim, fatalistic, id + ' changes after day 20');
      assert.match(fatalistic, /day twenty|After day twenty/i, id + ' becomes explicitly fatalistic after day 20');

      const afterBody = dialogue(g, id, 21, true);
      assert.match(afterBody, /Dreyfuss/);
      assert.match(afterBody, /Garrick/);
      assert.match(afterBody, /dead|body|ending/i);
      assert.doesNotMatch(afterBody, /Garrick and Dreyfuss.*still coming back/i);
    }

    assert.equal(g.run('reservoir_quest_started'), true);
    assert.equal(g.run('window.gallery_body_found'), true);
    assert.equal(g.run('day'), 21);
  },
};
