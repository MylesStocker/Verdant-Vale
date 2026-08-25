'use strict';
// Every inspectable point in the Sunken Gallery renders a floor sparkle so the
// player knows to examine it. The markers are driven by the same MAP_FEATURES
// 'inspect' entries the interaction reads (drawSunkenGalleryFeatures →
// drawExamineSparkle), so the sparkle set can never drift from what's actually
// examinable — including the entrance hall's inspects, which have no found-object
// overlay of their own.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Sunken Gallery: every inspectable point has a sparkle (data-driven)',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // Spy on the shared sparkle helper: count calls and capture their coords.
    g.run('__origSparkle = drawExamineSparkle;');
    g.run('__sparkles = [];');
    g.run('drawExamineSparkle = function(sx, sy){ __sparkles.push([sx, sy]); };');

    // Which examinable 'inspect' features does the interaction see on a map?
    // (condition met, or a fallback exists — mirrors tryMapFeatures gating.)
    function expectedInspects(mapId) {
      return JSON.parse(g.run(`JSON.stringify((function(){
        const feats = MAP_FEATURES[${JSON.stringify(mapId)}] || [];
        return feats
          .filter(f => f.type === 'inspect')
          .filter(f => (typeof evaluateMapFeatureCondition !== 'function') || evaluateMapFeatureCondition(f) || f.fallbackPages)
          .map(f => [Math.round(f.x * TILE), Math.round(f.y * TILE)]);
      })())`));
    }

    const galleryIds = JSON.parse(g.run(
      "JSON.stringify(Object.keys(MAP_FEATURES).filter(id => id.indexOf('SUNKEN_GALLERY') === 0))"));
    assert.ok(galleryIds.length >= 10, 'the gallery spans many rooms with inspect points');

    let totalPoints = 0;
    for (const id of galleryIds) {
      const expected = expectedInspects(id);
      if (expected.length === 0) continue;   // a gallery room with no inspect point
      totalPoints += expected.length;

      // Render this room's overlays and collect the sparkle coords drawn.
      g.run(`inSunkenGallery = true; activeMap = ${id}; __sparkles = [];`);
      assert.doesNotThrow(() => g.run('drawSunkenGalleryFeatures();'), `${id}: draw does not throw`);
      const drawn = JSON.parse(g.run('JSON.stringify(__sparkles)'));

      // One sparkle per examinable inspect point, at exactly the inspect coords.
      assert.equal(drawn.length, expected.length,
        `${id}: one sparkle per inspect point (expected ${expected.length}, drew ${drawn.length})`);
      const key = a => a.map(p => p.join(',')).sort().join(' ');
      assert.equal(key(drawn), key(expected), `${id}: sparkles sit on the inspect coordinates`);
    }

    // The entrance hall's three inspects (waterline / footprints / flooded hall)
    // are the ones with no object overlay — make sure they're covered.
    assert.deepEqual(
      expectedInspects('SUNKEN_GALLERY_MAP').sort(),
      [[Math.round(7.5 * 32), Math.round(1.5 * 32)], [Math.round(7.5 * 32), Math.round(8.5 * 32)], [Math.round(6.5 * 32), Math.round(9.5 * 32)]].sort(),
      'entrance-hall inspects are marked');

    assert.ok(totalPoints >= 12, `sanity: many inspect points marked across the gallery (got ${totalPoints})`);

    // Restore the real helper so later tests/renders are unaffected.
    g.run('drawExamineSparkle = __origSparkle;');
  },
};
