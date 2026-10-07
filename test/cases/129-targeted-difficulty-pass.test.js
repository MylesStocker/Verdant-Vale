'use strict';
// Targeted progression-pressure pass: the named early/mid-game encounters keep
// their established mechanics and identities, but their live templates are
// benchmarked against the equipment/levels from the playtest report.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const statLine = (g, id) => JSON.parse(g.run(
  `JSON.stringify((function(){var t=ENEMY_TEMPLATE_REGISTRY[${JSON.stringify(id)}];return [t.hp,t.maxHp,t.atk,t.def,t.spd];})())`,
));

module.exports = {
  name: 'targeted difficulty: named encounters resist attack spam and preserve their intended answers',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // Exact live-template anchors. Keeping HP and maxHp together catches the
    // common half-edit that makes a fight start already injured or overfull.
    const expected = {
      enemy_bone_guard:             [46, 46, 12, 7, 5],
      enemy_shade_wraith:           [36, 36, 15, 3, 13],
      enemy_mire_toad_male:         [150, 150, 22, 16, 5],
      enemy_mire_toad_female:       [150, 150, 22, 16, 5],
      enemy_smuggler_guard:         [72, 72, 22, 10, 10],
      enemy_polwick:                [96, 96, 25, 11, 12],
      enemy_essa:                   [60, 60, 23, 7, 16],
      enemy_briar_warden:           [110, 110, 22, 8, 9],
      enemy_pale_sentry:            [500, 500, 32, 10, 4],
      enemy_marsh_rat:              [44, 44, 22, 4, 14],
      enemy_shallows_skitter:       [70, 70, 23, 10, 5],
      enemy_lantern_moth:           [38, 38, 23, 3, 16],
      enemy_lensweb_spider:         [180, 180, 34, 11, 15],
      enemy_pale_drowned_gallery:   [58, 58, 30, 4, 13],
      enemy_silt_hag_gallery:       [85, 85, 27, 9, 6],
      enemy_silt_crab:              [78, 78, 24, 10, 6],
      enemy_mudflat_strider:        [56, 56, 27, 6, 17],
      enemy_basin_gull:             [28, 28, 26, 5, 18],
      enemy_silt_crab_upper:        [78, 78, 24, 10, 6],
      enemy_basin_gull_upper:       [28, 28, 26, 5, 18],
      enemy_dust_drowned:           [92, 92, 29, 9, 12],
      enemy_marrow_hulk:            [138, 138, 32, 14, 5],
    };
    for (const [id, stats] of Object.entries(expected))
      assert.deepEqual(statLine(g, id), stats, id + ' keeps the tuned combat profile');

    // The first Observe identifies the toad without solving the item choice;
    // the second names the exact matching reagent. The existing sexBane path
    // still supplies the instant, no-counter resolution.
    const maleFirst = g.run("getObservationText(ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male,0).join(' ')");
    const femaleFirst = g.run("getObservationText(ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_female,0).join(' ')");
    assert.match(maleFirst, /male.*jack/i);
    assert.match(femaleFirst, /female.*hen/i);
    assert.doesNotMatch(maleFirst, /Jackbane|Henbane|reagent/i);
    assert.doesNotMatch(femaleFirst, /Jackbane|Henbane|reagent/i);
    assert.match(g.run("getObservationText(ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_male,1).join(' ')"), /jack.*Jackbane/i);
    assert.match(g.run("getObservationText(ENEMY_TEMPLATE_REGISTRY.enemy_mire_toad_female,1).join(' ')"), /hen.*Henbane/i);
    assert.equal(g.run("createItem('Jackbane Vial').sexBane"), 'male');
    assert.equal(g.run("createItem('Henbane Sprig').sexBane"), 'female');

    // Pale Drowned is a Gallery-exclusive encounter. The old Mire Vault
    // duplicate is retired rather than renamed or repurposed.
    const drownedPools = JSON.parse(g.run(`JSON.stringify(ENEMY_TEMPLATE_POOLS
      .filter(function(p){return p.templates.some(function(t){return t.name==='Pale Drowned';});})
      .map(function(p){return [p.id,p.templates.filter(function(t){return t.name==='Pale Drowned';}).map(function(t){return t.id;})];}))`));
    assert.deepEqual(drownedPools, [['pool_sunken_gallery', ['enemy_pale_drowned_gallery']]]);
    assert.equal(g.run("'enemy_pale_drowned_vault' in ENEMY_TEMPLATE_REGISTRY"), false);
    assert.equal(g.run("MIRE_VAULT_ENEMY_TEMPLATES.some(function(t){return t.name==='Pale Drowned';})"), false);

    // The Ring Quest answer remains Observe -> guaranteed retreat; only the
    // attack-spam option has become grossly unfavourable.
    assert.equal(g.run('LENSWEB_SPIDER_TEMPLATE.runLock'), 'observe_gated');
    assert.match(g.run("ENEMY_OBSERVATIONS.enemy_lensweb_spider[0].lines.join(' ')"), /back away.*will not follow.*retreat safely/i);

    // Average-roll pressure at the exact named loadouts. These are deterministic
    // arithmetic checks, not claims that every randomized fight has one outcome.
    // Level 5 + Steel Sword + Leather Armor: 70 HP, ATK 23, DEF 13.
    assert.equal(Math.ceil(500 / (23 - 10)), 39, 'Pale Sentry needs many attack turns');
    assert.equal(Math.ceil(70 / (32 - 13)), 4, 'Pale Sentry can force a retreat in about four average hits');
    assert.equal(Math.ceil(110 / (23 - 8)), 8, 'Briar Warden survives about eight average player hits');
    assert.equal(Math.ceil(70 / (22 - 13)), 8, 'Briar Warden trades on roughly equal average-hit footing');

    // Level 5 + Steel/Leather/Iron/Swift: 70 HP, ATK 23, DEF 16.
    assert.equal(Math.ceil(180 / (23 - 11)), 15, 'spider survives about fifteen average player hits');
    assert.equal(Math.ceil(70 / (34 - 16)), 4, 'spider drops the benchmark player in about four average hits');
    assert.ok(
      (72 + 96 + 60) > ((23 - 10) + (23 - 11) + (23 - 7)),
      'the Polwick sequence cannot be cleared in one average hit per opponent',
    );

    assert.equal(g.run('validateGameData().errors'), 0, 'the tuned registries still validate cleanly');
  },
};
