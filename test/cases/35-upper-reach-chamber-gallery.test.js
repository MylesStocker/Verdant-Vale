'use strict';
// Covers: the Upper Reach pass -- NORTH_BASIN_NW_MAP (the drained NW arm of
// the reservoir, north of the West Shore), the unmarked chamber behind the
// freestanding doorframe (BASIN_CHAMBER_MAP, inBasinChamber), and the
// drought-exposed Sunken Gallery (SUNKEN_GALLERY_MAP, inSunkenGallery).
//
//   1.  Real-movement open-edge crossing West Shore -> Upper Reach (cols
//       1-10, x preserved) and back.
//   2.  The Upper Reach is silent: no tile anywhere on it is
//       encounter-eligible (the liminal no-encounters guarantee, checked
//       tile-by-tile, not by RNG luck).
//   3.  The first-entry trigger narration fires once (onceFlag
//       upper_reach_seen -- the first persisted MAP_FEATURES flag), and
//       does not re-fire after leaving and re-entering the zone.
//   4.  Stepping onto the doorframe (CHAMBER_DOOR) enters the chamber:
//       inBasinChamber, locationName 'No Recorded Location', no vignette
//       assumption tested indirectly by a full render frame not throwing.
//   5.  The chamber is encounter-free even with Math.random forced to 0
//       (worst case), and its own arrival trigger fires.
//   6.  Stepping onto the threshold (CHAMBER_EXIT) returns to the reach one
//       tile south of the doorframe.
//   7.  Stepping onto the stairhead (SUNKEN_STAIR) descends to the gallery:
//       inSunkenGallery, locationName, currentEncounterPool() resolves to
//       SUNKEN_GALLERY_ENEMY_TEMPLATES via MAP_METADATA (zero combat.js
//       wiring), GALLERY_FLOOR is encounter-eligible, and a forced
//       startCombat() draws Pale Drowned or Silt Hag (both have dedicated
//       sprites; a combat render frame must not throw).
//   8.  GALLERY_STAIR_UP climbs back out beside the stairhead.
//   9.  "No safe haven" means no town/bed/healing/shelter, not "the whole
//       outdoor region refuses to save": the chamber and the gallery both
//       refuse (MAP_METADATA allowSave: false), proven at BOTH the menu
//       level (banner, no write) and via a direct saveGame() call (the
//       authoritative canSaveHere() guard inside saveGame() itself, not
//       just the menu's own pre-check) -- and a refusal never touches the
//       stored save. The Upper Reach itself (outdoor, allowSave: true) and
//       an unrelated ordinary map both still save successfully via the menu.
//   10. A save/load round trip on the Upper Reach (a real saveGame() call,
//       which now succeeds there) restores activeMap, position, and the
//       persisted narration flags.
//   11. Pre-MQ4 flexibility: reservoir_quest_started is false for the
//       ENTIRE walkthrough (checked before it starts and again after the
//       round trip) -- the area, its transitions, and its discovery flags
//       are all reachable/persistent independent of the reservoir quest
//       chapter, which does not exist yet. All three discovery flags are
//       confirmed present in QUEST_FLAG_SCHEMA so a future MQ4
//       implementation can read them back.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'Upper Reach: open edge, exposed-bed encounters (map-local), the unmarked chamber, the Sunken Gallery (save refusal + round trip)',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 0. Pre-MQ4 accessibility: nothing here gates on reservoir_quest_started ─
    // The whole walkthrough below (edge crossing, the chamber, the gallery,
    // the save round trip) runs with this flag never set — proving the area
    // is reachable and its discovery flags persist BEFORE the reservoir
    // quest chapter exists. A future MQ4 implementation must be free to key
    // off upper_reach_seen/basin_chamber_seen/sunken_gallery_seen to
    // recognize a player who explored early, not assume first entry always
    // coincides with the quest being active.
    assert.equal(g.run('reservoir_quest_started'), false,
      'precondition: reservoir_quest_started must be false — this whole test explores the area pre-MQ4');

    // ── 1. Real movement north across the West Shore's open north edge ──────
    g.run(`
      inDungeon = false; inTown = false; inSluice = false; activeMap = NORTH_BASIN_W_MAP;
      player.x = 3.5*TILE; player.y = 1.5*TILE; player.facing = 'up';
      combat.cooldown = 0; debugMode = true;
    `);
    g.hold('ArrowUp');
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      g.frames(1);
      crossed = g.run('activeMap === NORTH_BASIN_NW_MAP');
    }
    g.release('ArrowUp');
    assert.ok(crossed, 'walking north off the West Shore should enter the Upper Reach within 40 frames');
    assert.equal(g.run('player.y'), 13.5 * 32, 'should land one tile inside the Upper Reach\'s south border');
    assert.equal(g.run('player.x'), 3.5 * 32, 'x should be preserved exactly across the edge');
    assert.equal(g.run('canWalk(player.x, player.y)'), true);
    assert.equal(g.run('locationName()'), 'North Basin — Upper Reach', 'outdoor locationName comes from MAP_METADATA');

    // ── 3. First-entry narration fired via the trigger zone, once ───────────
    // The crossing frame's update() returns early after the transition; the
    // trigger-zone check runs on the next frame.
    g.frames(2);
    assert.equal(g.run('dialogue.open'), true, 'the arrival trigger should have fired on landing inside its zone');
    assert.ok(g.run('dialogue.pages.flat().join(" ")').includes('didn’t recede'),
      'the arrival narration should be the authored liminal text');
    assert.equal(g.run('window.upper_reach_seen'), true, 'onceFlag should be set');
    g.run('dialogue.open = false;');

    // ── 2. The exposed bed now rolls its own encounters — but only BASIN_MUD,
    //       and only on THIS map (other basin maps keep their mud safe). ────────
    assert.equal(g.run('isEncounterEligibleTile(BASIN_MUD)'), true,
      'the Upper Reach BASIN_MUD is now encounter-eligible (the drought-exposed arm has its own dangers)');
    assert.equal(g.run('isEncounterEligibleTile(EXPOSED_STONE)'), false,
      'only BASIN_MUD rolls on the Upper Reach; the stonework apron stays quiet');
    // The override is map-local: the same tile stays safe elsewhere in the basin.
    g.run('activeMap = NORTH_BASIN_SW_MAP;');
    assert.equal(g.run('isEncounterEligibleTile(BASIN_MUD)'), false,
      'BASIN_MUD must stay safe on the Silt Flats — the Upper Reach override is map-local');
    g.run('activeMap = NORTH_BASIN_NW_MAP;');
    // Its pool: two creatures shared with the Silt Flats + two new tough ones.
    assert.equal(
      g.run('JSON.stringify(currentEncounterPool().map(t => t.name).sort())'),
      JSON.stringify(['Basin Gull', 'Dust-Drowned', 'Marrow Hulk', 'Silt Crab']),
      'Upper Reach pool = 2 shared basin creatures (Silt Crab, Basin Gull) + 2 new tough ones (Dust-Drowned, Marrow Hulk)'
    );

    // Leaving and re-entering the trigger zone must NOT re-fire (onceFlag).
    g.run('player.x = 3.5*TILE; player.y = 10.5*TILE;'); // outside the zone (rows 12-13)
    g.frames(2);
    g.run('player.x = 3.5*TILE; player.y = 12.5*TILE;'); // back inside
    g.frames(2);
    assert.equal(g.run('dialogue.open'), false, 'the once-flagged arrival narration must not re-fire');

    // ── 4. Through the doorframe ────────────────────────────────────────────
    g.run('debugMode = false;'); // chamber must be safe WITHOUT debug suppression
    g.run('player.x = 12.5*TILE; player.y = 4.5*TILE; player.facing = "up";'); // one south of the door
    g.hold('ArrowUp');
    let entered = false;
    for (let i = 0; i < 40 && !entered; i++) {
      g.frames(1);
      entered = g.run('inBasinChamber');
    }
    g.release('ArrowUp');
    assert.ok(entered, 'stepping onto the doorframe should enter the chamber');
    assert.equal(g.run('activeMap === BASIN_CHAMBER_MAP'), true);
    assert.equal(g.run('locationName()'), 'No Recorded Location');
    assert.equal(g.run('currentMapId()'), 'basin_chamber');

    // ── 5. Chamber arrival trigger + worst-case no-encounter guarantee ──────
    g.frames(2);
    assert.equal(g.run('dialogue.open'), true, 'the chamber arrival trigger should fire');
    assert.equal(g.run('window.basin_chamber_seen'), true);
    g.run('dialogue.open = false;');
    // Force the RNG to always roll an encounter and walk; nothing may start.
    g.run(`
      window.__realRandom = Math.random; Math.random = () => 0;
      combat.cooldown = 0; player.x = 8.5*TILE; player.y = 6.5*TILE;
    `);
    g.hold('ArrowLeft');
    g.frames(30);
    g.release('ArrowLeft');
    g.run('Math.random = window.__realRandom;');
    assert.equal(g.run('combat.active'), false, 'the chamber must be encounter-free even at worst-case RNG');
    assert.doesNotThrow(() => g.renderFrame(), 'a full render frame inside the chamber must not throw');

    // ── 6. Back out through the threshold ───────────────────────────────────
    g.run('player.x = 8.5*TILE; player.y = 9.5*TILE; player.facing = "down";');
    g.hold('ArrowDown');
    let left = false;
    for (let i = 0; i < 40 && !left; i++) {
      g.frames(1);
      left = g.run('!inBasinChamber');
    }
    g.release('ArrowDown');
    assert.ok(left, 'stepping onto the threshold should exit the chamber');
    assert.equal(g.run('activeMap === NORTH_BASIN_NW_MAP'), true);
    assert.equal(g.run('player.x'), 12.5 * 32, 'should return one tile south of the doorframe');
    assert.equal(g.run('player.y'), 4.5 * 32);

    // ── 7. Down the drought-exposed stair ───────────────────────────────────
    g.run('dialogue.open = false; player.x = 4.5*TILE; player.y = 8.5*TILE; player.facing = "down"; combat.cooldown = 999;');
    g.hold('ArrowDown');
    let descended = false;
    for (let i = 0; i < 40 && !descended; i++) {
      g.frames(1);
      descended = g.run('inSunkenGallery');
    }
    g.release('ArrowDown');
    assert.ok(descended, 'stepping onto the stairhead should descend to the Sunken Gallery');
    assert.equal(g.run('activeMap === SUNKEN_GALLERY_MAP'), true);
    assert.equal(g.run('locationName()'), 'Sunken Gallery');
    g.frames(2);
    assert.equal(g.run('window.sunken_gallery_seen'), true, 'the gallery arrival trigger should fire');
    g.run('dialogue.open = false;');

    // Pool wiring: MAP_METADATA fall-through, no combat.js special case.
    assert.equal(g.run('currentEncounterPool() === SUNKEN_GALLERY_ENEMY_TEMPLATES'), true,
      'the gallery pool must resolve via MAP_METADATA.encounterPool');
    assert.equal(g.run('isEncounterEligibleTile(GALLERY_FLOOR)'), true,
      'GALLERY_FLOOR must be encounter-eligible (TILE_PROPERTIES path)');
    assert.equal(g.run('isEncounterEligibleTile(BASIN_MUD)'), false,
      'the silt drifts must not be eligible');
    g.run('startCombat();');
    const enemyName = g.run('combat.enemy.name');
    assert.ok(['Pale Drowned', 'Silt Hag'].includes(enemyName),
      `a gallery encounter must draw from the gallery pool, got ${enemyName}`);
    assert.equal(g.run(`BATTLE_SPRITE_NAMES.has('${enemyName}')`), true);
    assert.doesNotThrow(() => g.renderFrame(), 'a combat render frame in the gallery must not throw');
    g.run('endCombat(); combat.active = false; dialogue.open = false;');

    // ── 8. Back up the stair ────────────────────────────────────────────────
    g.run('player.x = 2.5*TILE; player.y = 3.5*TILE; player.facing = "up"; combat.cooldown = 999; dialogue.open = false;');
    g.hold('ArrowUp');
    let ascended = false;
    for (let i = 0; i < 40 && !ascended; i++) {
      g.frames(1);
      ascended = g.run('!inSunkenGallery');
    }
    g.release('ArrowUp');
    assert.ok(ascended, 'the stair up should return to the Upper Reach');
    assert.equal(g.run('activeMap === NORTH_BASIN_NW_MAP'), true);
    assert.equal(g.run('canWalk(player.x, player.y)'), true);

    // ── 10. Save/load round trip on the Upper Reach (allowSave: true) ───────
    // "No safe haven" means no town/bed/healing/shelter, not "the outdoors
    // itself refuses to save" -- the Reach allows it like any ordinary
    // outdoor map (see MAP_METADATA/canSaveHere(), save.js). This is a real
    // saveGame() call, not routed through the menu, proving the function
    // itself succeeds here (contrasted with section 9 below, where the same
    // direct call is proven to refuse in the two interiors).
    g.run(`
      dialogue.open = false;
      player.x = 4.5*TILE; player.y = 13.5*TILE;
    `);
    const saveOk = g.run('saveGame()');
    assert.equal(saveOk, true, 'saveGame() must succeed on the Upper Reach');
    g.run(`
      // Scramble state, then restore.
      activeMap = MAP; player.x = 1.5*TILE; player.y = 1.5*TILE;
      window.upper_reach_seen = false; window.basin_chamber_seen = false; window.sunken_gallery_seen = false;
      loadGame();
    `);
    assert.equal(g.run('activeMap === NORTH_BASIN_NW_MAP'), true, 'activeMap should restore to the Upper Reach');
    assert.equal(g.run('player.x'), 4.5 * 32);
    assert.equal(g.run('player.y'), 13.5 * 32);
    assert.equal(g.run('window.upper_reach_seen'), true, 'persisted narration flags should survive the round trip');
    assert.equal(g.run('window.basin_chamber_seen'), true);
    assert.equal(g.run('window.sunken_gallery_seen'), true);
    // Independence from MQ4: the exploration flags persisted above with
    // reservoir_quest_started never having been set. A future reservoir
    // quest can check upper_reach_seen/basin_chamber_seen/sunken_gallery_seen
    // (all in QUEST_FLAG_SCHEMA, save.js) to recognize prior exploration --
    // that data is already there waiting, independent of quest state.
    assert.equal(g.run('reservoir_quest_started'), false,
      'the full walkthrough and save/load round trip must not have touched reservoir_quest_started');
    assert.ok(g.run(`QUEST_FLAG_SCHEMA.includes('upper_reach_seen') && QUEST_FLAG_SCHEMA.includes('basin_chamber_seen') && QUEST_FLAG_SCHEMA.includes('sunken_gallery_seen')`),
      'all three discovery flags must be in QUEST_FLAG_SCHEMA for a future quest to read them back');

    // ── 9. "No safe haven" means the two interiors, not the outdoor Reach ───
    // Menu-level refusal (banner, no write) in the chamber and the gallery;
    // direct saveGame() refusal too (the authoritative guard, not just the
    // menu's pre-check); and the Reach itself succeeds via the menu.
    const savedBlob = g.run(`localStorage.getItem('verdantVale_save')`);
    for (const [mapGlobal, setup] of [
      ['BASIN_CHAMBER_MAP',  'inBasinChamber = true;  inSunkenGallery = false;'],
      ['SUNKEN_GALLERY_MAP', 'inBasinChamber = false; inSunkenGallery = true;'],
    ]) {
      // Direct saveGame() call: must refuse and leave the stored save untouched.
      g.run(`${setup} activeMap = ${mapGlobal}; dialogue.open = false;`);
      assert.equal(g.run('canSaveHere()'), false, `canSaveHere() should be false on ${mapGlobal}`);
      const directResult = g.run('saveGame()');
      assert.equal(directResult, false, `a direct saveGame() call must refuse on ${mapGlobal}`);
      assert.equal(g.run(`localStorage.getItem('verdantVale_save')`), savedBlob,
        `a direct saveGame() refusal must leave the stored save untouched on ${mapGlobal}`);

      // Menu-level refusal: banner, no write, dialog closes.
      g.run(`
        menu.open = true; menu.screen = 'saveConfirm'; menu.saveCursor = 0;
        menu.saveMessage = 0; menu.saveBlockedMessage = 0;
      `);
      g.press('Enter'); // confirm "Yes"
      assert.equal(g.run('menu.saveBlockedMessage > 0'), true,
        `saving on ${mapGlobal} should be refused with the blocked banner`);
      assert.equal(g.run('menu.saveMessage'), 0,
        `no "Game Saved" banner may appear on ${mapGlobal}`);
      assert.equal(g.run(`localStorage.getItem('verdantVale_save')`), savedBlob,
        `the stored save must be untouched after the menu refusal on ${mapGlobal}`);
      assert.equal(g.run('menu.screen'), 'main', 'the confirm dialog should close back to the main menu');
    }

    // The Reach itself: canSaveHere() true, menu succeeds.
    g.run(`
      inBasinChamber = false; inSunkenGallery = false; activeMap = NORTH_BASIN_NW_MAP;
      menu.screen = 'saveConfirm'; menu.saveCursor = 0; menu.saveMessage = 0; menu.saveBlockedMessage = 0;
    `);
    assert.equal(g.run('canSaveHere()'), true, 'canSaveHere() should be true on the outdoor Upper Reach');
    g.press('Enter');
    assert.equal(g.run('menu.saveMessage > 0'), true, 'saving on the Upper Reach must succeed via the menu');
    assert.equal(g.run('menu.saveBlockedMessage'), 0, 'no blocked banner on the Reach');
    g.run('menu.open = false;');

    // ...and saving still works somewhere ordinary, unrelated to this area.
    g.run(`
      activeMap = MAP;
      menu.open = true; menu.screen = 'saveConfirm'; menu.saveCursor = 0; menu.saveMessage = 0; menu.saveBlockedMessage = 0;
    `);
    g.press('Enter');
    assert.equal(g.run('menu.saveMessage > 0'), true, 'saving on an ordinary map must still work');
    g.run('menu.open = false;');
  },
};
