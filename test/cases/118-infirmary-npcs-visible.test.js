'use strict';
// The Drenwick infirmary furniture opens by painting an opaque full-floor palette
// overlay across the whole ward. It was being drawn AFTER drawSimpleNPCs(), so it
// painted right over Merrin (infirmarer), Fisk (orderly), Odger (patient) and
// Esla — the ward read as empty. The furniture must draw BEFORE the NPCs, like the
// office/school interiors that also recolour their floors.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Drenwick infirmary: staff/patient/Esla draw on top of the furniture (not hidden by it)',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    g.run("inTown=true; currentTownId='drenwick'; townBuilding='infirmary'; activeMap=DRENWICK_INFIRMARY_MAP; player.x=7.5*TILE; player.y=8.5*TILE; dialogue.open=false;");

    // The interior resolves to the infirmary content key, and the four NPCs live there.
    assert.equal(g.run('currentContentLocationKey()'), 'drenwick_infirmary', 'the ward is the current content location');
    const staff = JSON.parse(g.run("JSON.stringify(SIMPLE_NPCS.filter(function(n){return n.map==='drenwick_infirmary';}).map(function(n){return n.name;}))"));
    for (const who of ['Merrin', 'Fisk', 'Odger', 'Esla']) {
      assert.ok(staff.includes(who), `${who} is present in the infirmary`);
    }

    // Render order: the opaque-floor furniture must run BEFORE the NPCs, or it
    // paints over them. Instrument both and confirm the sequence within a frame.
    g.run("__seq=[]; __f=drawInfirmaryFurniture; drawInfirmaryFurniture=function(){__seq.push('furniture'); return __f.apply(this,arguments);};");
    g.run("__n=drawSimpleNPCs; drawSimpleNPCs=function(){__seq.push('npcs'); return __n.apply(this,arguments);};");
    try {
      assert.doesNotThrow(() => g.renderFrame(), 'rendering the ward does not throw');
      const seq = JSON.parse(g.run('JSON.stringify(__seq)'));
      assert.ok(seq.indexOf('furniture') !== -1, 'the infirmary furniture is drawn');
      assert.ok(seq.indexOf('npcs') !== -1, 'the NPCs are drawn');
      assert.ok(seq.indexOf('furniture') < seq.indexOf('npcs'),
        'furniture draws BEFORE the NPCs, so they are not painted over');
    } finally {
      g.run("drawInfirmaryFurniture=__f; drawSimpleNPCs=__n;");
    }

    // Interacting beside the infirmarer opens her dialogue (proves she's a live NPC here).
    g.run("player.x=3.5*TILE; player.y=9.5*TILE; dialogue.open=false; handleInteract();");
    assert.equal(g.run('dialogue.open'), true, 'the infirmarer is interactable in the ward');
    assert.equal(g.run('dialogue.name'), 'Merrin', 'it is the infirmarer, Merrin');
  },
};
