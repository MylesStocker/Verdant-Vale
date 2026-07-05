'use strict';
// Covers: the new MAP_FEATURES content-authoring system (interactions.js) --
// a generalized registry for simple 'inspect' (signs/plaques/gauges/
// notices) and 'trigger' (rectangular area discovery text) map features,
// replacing the earlier INTERACTION_REGISTRY pilot (all 9 of its entries
// are migrated, not kept alongside this as a second system), plus its
// debug-inspector field and its "Map Features" validateGameData() group.
//
// Interaction priority (handleInteract(), interactions.js) is unchanged in
// spirit but the MAP_FEATURES check moved from *before* the entire NPC/
// chest/quest-object/point-transition cascade to *after* it: tryMapFeatures()
// is now called only if `!dialogue.open` at the very end of
// handleInteract(), which is reliable because every existing higher-
// priority path already sets dialogue.open = true as part of showing
// feedback (verified by reading every custom NPC .action callback). Trigger
// zones are checked once per frame from the tail of movement.js's update()
// (alongside the item-pickup loop, both unconditional once update() gets
// past its early-return guards -- not nested inside `if (player.moving)`,
// since the rising-edge check inside checkMapFeatureTriggers() itself is
// what prevents repeat-firing, not gating on movement), and only if
// nothing already opened dialogue/started combat/opened a menu this frame.
//
//   1.  An existing NPC interaction (Maren) still works.
//   2.  An existing chest interaction (DUNGEON_CHEST) still works.
//   3.  An existing migrated environmental interaction (the North Basin
//       road sign) still works and shows the exact original text.
//   4.  A simple 'inspect' feature displays text when interacted with.
//   5.  A generic inspectable co-located with an NPC does not override it --
//       the NPC's dialogue wins.
//   6.  Interacting where no NPC/chest/feature exists does not crash and
//       leaves dialogue closed.
//   7.  A simple 'trigger' zone fires when the player walks into it.
//   8.  The same trigger zone does not re-fire every frame while the
//       player keeps moving/standing inside it.
//   9.  A trigger zone with onceFlag shows repeatPages (not pages again) on
//       a second entry. onceFlag is session-only unless the flag name is
//       also added to QUEST_FLAG_SCHEMA (save.js persists an explicit list,
//       not a blanket dump) -- deferred rather than risking a schema
//       change, and validation warns when a used onceFlag isn't registered.
//   10. Conditional inspect text: condition true shows `pages`, condition
//       false shows `fallbackPages`.
//   11. An inspect/trigger feature pointing at a nonexistent map fails
//       validation.
//   12. An inspect feature with an out-of-bounds coordinate fails validation.
//   13. A trigger feature with an invalid rectangle (min > max, or out of
//       bounds) fails validation.
//   14. Duplicate feature ids fail validation.
//   15. The debug inspector can display current-map feature info (count,
//       nearby inspect, active trigger) without crashing.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function runValidation(g) {
  g.run(`
    window.__origLog   = console.log;
    window.__origWarn  = console.warn;
    window.__origError = console.error;
    console.log = console.warn = console.error = function() {};
  `);
  const result = g.run('validateGameData()');
  g.run(`
    console.log   = window.__origLog;
    console.warn  = window.__origWarn;
    console.error = window.__origError;
  `);
  return result;
}

module.exports = {
  name: 'Map Features: inspect/trigger content system, priority, debug inspector, validation',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 1. Existing NPC interaction still works ─────────────────────────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; inMarenPost=true;
      activeMap = MAREN_POST_MAP;
      player.x = 7.5*TILE; player.y = 4.5*TILE; player.facing = 'down';
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'Maren\'s dialogue should open');
    assert.equal(g.run('dialogue.name'), 'Maren');
    g.run('dialogue.open = false; inMarenPost = false;');

    // ── 2. Existing chest interaction still works ───────────────────────────
    g.run(`
      inDungeon=true; dungeonFloor=1; inTown=false; inSluice=false;
      activeMap = DUNGEON_MAP;
      DUNGEON_CHEST.opened = false;
      player.x = DUNGEON_CHEST.x; player.y = DUNGEON_CHEST.y;
    `);
    g.press('Enter');
    assert.equal(g.run('DUNGEON_CHEST.opened'), true, 'the dungeon chest should open');
    assert.equal(g.run('dialogue.open'), true, 'opening the chest should show feedback dialogue');
    g.run('dialogue.open = false; DUNGEON_CHEST.opened = false; inDungeon = false;');

    // ── 3. Existing migrated environmental interaction still works ─────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false;
      activeMap = NORTH_BASIN_S_MAP;
      player.x = 13.5*TILE; player.y = 12.5*TILE; player.facing = 'down';
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'the migrated road sign should still open dialogue');
    assert.equal(g.run('dialogue.pages[1][0]'), 'NORTH BASIN ROAD', 'exact original sign text should be preserved after migration');
    g.run('dialogue.open = false;');

    // ── 4. A simple inspect feature displays text when interacted with ─────
    g.run(`
      window.__savedFeatures = MAP_FEATURES.MAP2;
      MAP_FEATURES.MAP2 = [{
        id: '_test_inspect', type: 'inspect', x: 5.5, y: 5.5,
        label: 'Test sign', pages: [['A test sign.', 'Nothing more.']],
      }];
      inDungeon=false; inTown=false; inSluice=false; activeMap = MAP2;
      player.x = 5.5*TILE; player.y = 5.5*TILE; player.facing = 'down';
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.open'), true, 'a simple inspect feature should open dialogue when interacted with');
    assert.equal(g.run('dialogue.pages[0][0]'), 'A test sign.');
    g.run('dialogue.open = false;');

    // ── 5. Generic inspectable does not override NPC/chest/special interactions ─
    g.run(`
      MAP_FEATURES.MAREN_POST_MAP = [{
        id: '_test_steal_attempt', type: 'inspect', x: 7.5, y: 4.5,
        pages: [['This should never be shown -- Maren must win.']],
      }];
      inDungeon=false; inTown=false; inSluice=false; inMarenPost=true;
      activeMap = MAREN_POST_MAP;
      player.x = 7.5*TILE; player.y = 4.5*TILE; player.facing = 'down';
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Maren', 'the co-located NPC must win over a generic inspectable at the same spot');
    assert.notEqual(g.run('dialogue.pages[0][0]'), 'This should never be shown -- Maren must win.');
    g.run('dialogue.open = false; inMarenPost = false; delete MAP_FEATURES.MAREN_POST_MAP;');

    // ── 6. Nonexistent feature interaction does not crash ──────────────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap = MAP2;
      player.x = 1.5*TILE; player.y = 1.5*TILE; player.facing = 'down';
    `);
    assert.doesNotThrow(() => g.press('Enter'), 'interacting where nothing exists must not throw');
    assert.equal(g.run('dialogue.open'), false, 'nothing should happen when no NPC/chest/feature is present');

    // ── 7 & 8. Trigger zone fires on entry, not repeatedly every frame ─────
    g.run(`
      MAP_FEATURES.MAP2 = [{
        id: '_test_trigger', type: 'trigger',
        rect: { x1: 3, y1: 3, x2: 6, y2: 6 },
        pages: [['You notice something.']],
      }];
      inDungeon=false; inTown=false; inSluice=false; activeMap = MAP2;
      player.x = 1.5*TILE; player.y = 4.5*TILE; player.facing = 'right';
      combat.cooldown = 999999; debugMode = true;
    `);
    g.hold('ArrowRight');
    let fired = false;
    for (let i = 0; i < 150 && !fired; i++) { g.frames(1); fired = g.run('dialogue.open'); }
    g.release('ArrowRight');
    assert.equal(fired, true, 'the trigger zone should fire when the player walks into it');
    assert.equal(g.run('dialogue.pages[0][0]'), 'You notice something.');

    g.run('dialogue.open = false;');
    g.hold('ArrowRight');
    g.frames(10); // keep moving/standing inside the same zone
    g.release('ArrowRight');
    assert.equal(g.run('dialogue.open'), false, 'the trigger must not re-fire every frame while the player remains inside the zone');

    // Leaving and re-entering should fire again (no onceFlag on this one).
    g.run('player.x = 1.5*TILE;');
    g.frames(1);
    g.hold('ArrowRight');
    fired = false;
    for (let i = 0; i < 150 && !fired; i++) { g.frames(1); fired = g.run('dialogue.open'); }
    g.release('ArrowRight');
    assert.equal(fired, true, 'leaving and re-entering a no-onceFlag trigger should fire it again');
    g.run('dialogue.open = false;');

    // ── 9. onceFlag: repeatPages on second entry, persists across save/load ─
    g.run(`
      MAP_FEATURES.MAP2 = [{
        id: '_test_once_trigger', type: 'trigger',
        rect: { x1: 3, y1: 3, x2: 6, y2: 6 },
        onceFlag: '_test_once_seen',
        pages:       [['First time seeing this.']],
        repeatPages: [['Seen this before.']],
      }];
      player.x = 1.5*TILE; player.y = 4.5*TILE;
    `);
    g.frames(1);
    g.hold('ArrowRight');
    fired = false;
    for (let i = 0; i < 150 && !fired; i++) { g.frames(1); fired = g.run('dialogue.open'); }
    g.release('ArrowRight');
    assert.equal(g.run('dialogue.pages[0][0]'), 'First time seeing this.');
    assert.equal(g.run('_test_once_seen'), true, 'onceFlag should be set after the first showing');

    g.run('dialogue.open = false; player.x = 1.5*TILE;');
    g.frames(1);
    g.hold('ArrowRight');
    fired = false;
    for (let i = 0; i < 150 && !fired; i++) { g.frames(1); fired = g.run('dialogue.open'); }
    g.release('ArrowRight');
    assert.equal(g.run('dialogue.pages[0][0]'), 'Seen this before.', 'a repeat entry after onceFlag is set should show repeatPages');

    // Persistence: onceFlag is a plain window[name] boolean, the same
    // mechanism every quest flag uses, so it works within the current
    // session (already proven above: the second entry showed repeatPages).
    // But saveGame() persists only flags explicitly listed in
    // QUEST_FLAG_SCHEMA (save.js) -- not a blanket key-value dump -- so an
    // ad-hoc flag name invented by a new feature will NOT survive a save/
    // load round-trip unless the author also adds it to that schema. This
    // is deferred rather than risking a schema change (per the brief); the
    // "onceFlag not persisted" case is instead surfaced as a validation
    // warning (see #10 below) so it's never a silent surprise.
    g.run('saveGame(); _test_once_seen = false; loadGame();');
    assert.equal(g.run('_test_once_seen'), false, 'an onceFlag not registered in QUEST_FLAG_SCHEMA does not persist across save/load -- session-only, by design, and flagged by validation instead');

    const unpersistedFlagCheck = runValidation(g);
    assert.ok(
      unpersistedFlagCheck.warningList.some(w => w.group === 'Map Features' && w.message.includes('_test_once_seen') && w.message.includes('not in QUEST_FLAG_SCHEMA')),
      'validation should warn that this onceFlag will not persist: ' + JSON.stringify(unpersistedFlagCheck.warningList.filter(w => w.group === 'Map Features'))
    );

    g.run('dialogue.open = false;');

    // ── 10. Conditional inspect text: condition true -> pages, false -> fallbackPages ─
    g.run(`
      window.__testCondFlag = true;
      MAP_FEATURES.MAP2 = [{
        id: '_test_conditional', type: 'inspect', x: 5.5, y: 5.5,
        condition: () => window.__testCondFlag === true,
        pages:         [['Condition was true.']],
        fallbackPages: [['Condition was false.']],
      }];
      inDungeon=false; inTown=false; inSluice=false; activeMap = MAP2;
      player.x = 5.5*TILE; player.y = 5.5*TILE; player.facing = 'down';
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.pages[0][0]'), 'Condition was true.');
    g.run('dialogue.open = false; window.__testCondFlag = false;');
    g.press('Enter');
    assert.equal(g.run('dialogue.pages[0][0]'), 'Condition was false.', 'a false condition should show fallbackPages, not silently do nothing, when fallbackPages is provided');
    g.run('dialogue.open = false;');

    g.run('MAP_FEATURES.MAP2 = window.__savedFeatures; delete window.__savedFeatures; delete window.__testCondFlag;');

    // ── 11. Feature pointing at a nonexistent map fails validation ─────────
    g.run(`MAP_FEATURES._TEST_GHOST_MAP = [{ id: '_test_ghost', type: 'inspect', x: 1, y: 1, pages: [['x']] }];`);
    const ghostMap = runValidation(g);
    assert.ok(
      ghostMap.errorList.some(e => e.group === 'Map Features' && e.message.includes('_TEST_GHOST_MAP') && e.message.includes('does not exist')),
      'a feature list keyed by a nonexistent map id should fail validation: ' + JSON.stringify(ghostMap.errorList.filter(e => e.group === 'Map Features'))
    );
    g.run('delete MAP_FEATURES._TEST_GHOST_MAP;');

    // ── 12. Out-of-bounds inspect coordinate fails validation ───────────────
    g.run(`MAP_FEATURES.MAP2 = [{ id: '_test_oob', type: 'inspect', x: 9999, y: 1, pages: [['x']] }];`);
    const oobCoord = runValidation(g);
    assert.ok(
      oobCoord.errorList.some(e => e.group === 'Map Features' && e.message.includes('_test_oob') && e.message.includes('out of bounds')),
      'an out-of-bounds inspect coordinate should fail validation: ' + JSON.stringify(oobCoord.errorList.filter(e => e.group === 'Map Features'))
    );

    // ── 13. Invalid trigger rectangle fails validation ──────────────────────
    g.run(`MAP_FEATURES.MAP2 = [{ id: '_test_bad_rect', type: 'trigger', rect: { x1: 10, y1: 2, x2: 2, y2: 5 }, pages: [['x']] }];`);
    const badRect = runValidation(g);
    assert.ok(
      badRect.errorList.some(e => e.group === 'Map Features' && e.message.includes('_test_bad_rect') && e.message.includes('greater than')),
      'a trigger rect with x1 > x2 should fail validation: ' + JSON.stringify(badRect.errorList.filter(e => e.group === 'Map Features'))
    );

    // ── 14. Duplicate feature ids fail validation ───────────────────────────
    g.run(`
      MAP_FEATURES.MAP2 = [
        { id: '_test_dupe', type: 'inspect', x: 2, y: 2, pages: [['a']] },
        { id: '_test_dupe', type: 'inspect', x: 3, y: 3, pages: [['b']] },
      ];
    `);
    const dupeIds = runValidation(g);
    assert.ok(
      dupeIds.errorList.some(e => e.group === 'Map Features' && e.message.includes('duplicate id') && e.message.includes('_test_dupe')),
      'duplicate feature ids should fail validation: ' + JSON.stringify(dupeIds.errorList.filter(e => e.group === 'Map Features'))
    );
    g.run('delete MAP_FEATURES.MAP2;');

    const finalCheck = runValidation(g);
    assert.equal(finalCheck.errors, 0, 'validation should be fully clean again after every temporary breakage above was restored: ' + JSON.stringify(finalCheck.errorList));

    // ── 15. Debug inspector displays feature info without crashing ─────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap = NORTH_BASIN_S_MAP;
      player.x = 13.5*TILE; player.y = 12.5*TILE;
      debugInspector.open = true;
    `);
    assert.doesNotThrow(() => g.renderFrame(), 'a full render() with the inspector open on a map with MAP_FEATURES must not throw');
    const info = g.run('debugMapFeatureInfo()');
    assert.equal(info.count, 5, 'NORTH_BASIN_S_MAP should report its 5 real MAP_FEATURES entries');
    assert.ok(info.nearbyInspect && info.nearbyInspect.id === 'north_basin_road_sign', 'standing on the road sign should report it as the nearby inspect feature');
    g.run('debugInspector.open = false;');

    g.renderFrame();
  },
};
