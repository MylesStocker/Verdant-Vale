'use strict';
// Wires test/transition-audit.js (the full map-transition/exit-tile
// integrity sweep from TRANSITION_AUDIT.md) into the regular regression
// suite. That script already runs every check as a side effect of loading
// -- both `node test/transition-audit.js` (human-readable CLI report) and
// this test case (assertions) get the exact same underlying results, just
// presented differently. Runtime is ~50ms, well under the "sub-second"
// bar for inclusion here.
//
// If this test ever fails, run `node test/transition-audit.js` directly
// for the full human-readable breakdown (source map, exact destination
// pixel, tile id, canWalk() result, escape directions) of whatever broke.

const assert = require('assert/strict');
const audit = require('../transition-audit.js');

module.exports = {
  name: 'transition audit: every map/transition/tile-constant check passes',
  run() {
    const dimFailures = audit.dimReport.filter(d => !d.ok);
    assert.deepEqual(dimFailures, [], 'every map should be 16x15 (nominal and actual array size)');

    assert.equal(
      audit.basementInRegistry, true,
      'DRENWICK_SCHOOL_BASEMENT_MAP should be registered in MAP_REGISTRY'
    );

    // resetState() must return every location flag/discriminator to neutral --
    // including inBasinChamber and inSunkenGallery. Fails if either is dropped
    // from resetState() again.
    assert.equal(
      audit.resetIsolation.passed, true,
      `resetState() left location state dirty: ${(audit.resetIsolation.failures || []).map(f => f.field).join(', ')}`
    );

    const destFailures = audit.results.filter(r => r.verdict !== 'OK');
    assert.equal(
      destFailures.length, 0,
      `${destFailures.length} transition(s) landed somewhere invalid: ${destFailures.map(r => `${r.name} (${r.verdict})`).join(', ')}`
    );

    const preservedFailures = audit.preservedResults.filter(p => !p.allOk);
    assert.equal(
      preservedFailures.length, 0,
      `${preservedFailures.length} preserved-axis transition(s) have an unwalkable candidate row/col: ${preservedFailures.map(p => p.name).join(', ')}`
    );

    const orphanedInMaps = audit.tileUsage.filter(t => t.mapsUsingIt === 0);
    assert.equal(
      orphanedInMaps.length, 0,
      `tile constant(s) unused by any map: ${orphanedInMaps.map(t => t.name).join(', ')}`
    );
    const unhandledInMovement = audit.tileUsage.filter(t => t.mapsUsingIt > 0 && !t.handledInMovement);
    assert.equal(
      unhandledInMovement.length, 0,
      `tile constant(s) placed on a map but not referenced in movement.js: ${unhandledInMovement.map(t => t.name).join(', ')}`
    );

    const badDoors = audit.houseDoorResults.filter(d => d.skipped || !d.walkableByTable);
    assert.equal(
      badDoors.length, 0,
      `HOUSE_DOORS entry/entries with an unwalkable return position: ${badDoors.map(d => d.houseId || JSON.stringify(d)).join(', ')}`
    );
  },
};
