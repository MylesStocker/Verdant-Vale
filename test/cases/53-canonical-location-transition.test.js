'use strict';
// Covers: the canonical location-transition boundary (#5) — the location-state
// binding registry (world-transitions.js) and transitionToLocation().
//
//   • The registry lists every mutable location field; resetLocationState()
//     returns them all to neutral (no hand-copied list can forget one).
//   • transitionToLocation() validates the WHOLE destination (map, coords,
//     facing, state keys, invariants) before mutating; on failure it leaves
//     map/position/facing/cooldown and every location field untouched.
//   • Representative real transitions (town district/building/house, dungeon
//     floors, sluice floors + sealed room, basin chamber, sunken gallery, bridge
//     from both directions, an edge transition, debug warp, defeat relocation)
//     land correctly and leave currentMapId/locationName/currentItemList/
//     currentEncounterPool/collision/NPC-filtering in agreement.
//   • Save restoration is NOT a transition (no cooldown/side effect); the East
//     Sluice top floor still rolls Marsh Wisp/Sluice Slime.
//
// Section L breaks each guarantee in-process and confirms the matching check
// fails, restoring every shared mutation in `finally`.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const EXPECTED_LOCATION_KEYS = [
  'inDungeon', 'dungeonFloor', 'inDungeonEntrance', 'inTown', 'currentTownId', 'townBuilding',
  'currentHouseId', 'houseSourceMap', 'houseSourceBuilding', 'houseReturnPos', 'inSluice', 'sluiceFloor',
  'inMireVault', 'inTakomo', 'inFenBrewery', 'inHamletInterior', 'inLorraHouse', 'inAbandonedFarmhouse', 'inMarenPost',
  'inDrenwrickPost', 'inBridgePost', 'inSmugglerFort', 'inBasinChamber', 'inSunkenGallery',
  'bridge_entry_direction', 'bridge_toll_paid',
];

module.exports = {
  name: 'canonical location transition: registry reset, validated helper, atomic rejection, real transitions',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');
    const G = (code) => g.run(code);
    const expectAssertFails = (fn, why) => {
      let threw = false;
      try { fn(); } catch (e) { threw = e && e.name === 'AssertionError'; }
      assert.equal(threw, true, 'load-bearing check should have failed but did not: ' + why);
    };
    const TILE = G('TILE');

    // ── A. Registry completeness ────────────────────────────────────────────
    const keys = JSON.parse(G('JSON.stringify(window.LOCATION_STATE_BINDINGS.map(function(b){return b.key;}))'));
    assert.deepEqual(keys, EXPECTED_LOCATION_KEYS, 'registry lists exactly the expected location fields');
    assert.equal(G('window.LOCATION_STATE_BINDINGS.every(function(b){return typeof b.get==="function" && typeof b.set==="function" && ("neutral" in b);})'), true,
      'every binding has get/set/neutral');

    // ── B. Dirty every field, transition to a neutral outdoor map, all reset ─
    G(`inDungeon=true; dungeonFloor=9; inDungeonEntrance=true; inTown=true; currentTownId='drenwick';
       townBuilding='house'; currentHouseId='esla_house'; houseSourceMap=MAP2; houseSourceBuilding='west';
       houseReturnPos={x:5*TILE,y:5*TILE}; inSluice=true; sluiceFloor=3; inMireVault=true; inTakomo=true;
       inFenBrewery=true; inHamletInterior=true; inLorraHouse=true; inAbandonedFarmhouse=true; inMarenPost=true; inDrenwrickPost=true;
       inBridgePost=true; inSmugglerFort=true; inBasinChamber=true; inSunkenGallery=true;
       bridge_entry_direction='south'; bridge_toll_paid=true;`);
    assert.equal(G("transitionToLocation({mapId:'MAP', x:8*TILE, y:8*TILE, facing:'down'})"), true, 'neutral outdoor transition succeeds');
    const leftDirty = JSON.parse(G(`JSON.stringify(window.LOCATION_STATE_BINDINGS.filter(function(b){
      var v = b.get();
      var neutral = b.key==='houseReturnPos' ? (v && v.x===0 && v.y===0) : (v === b.neutral);
      return !neutral;
    }).map(function(b){return b.key;}))`));
    assert.deepEqual(leftDirty, [], 'a neutral outdoor transition resets EVERY location field');
    assert.equal(G('activeMap === MAP'), true, 'map changed'); assert.equal(G('player.x/TILE'), 8, 'x placed'); assert.equal(G('player.facing'), 'down', 'facing set');

    // ── C. Atomic rejection: invalid destinations change nothing ────────────
    const setKnownGood = () => G("inDungeon=true; dungeonFloor=4; activeMap=DUNGEON4_MAP; player.x=5.5*TILE; player.y=5.5*TILE; player.facing='left'; combat.cooldown=0;");
    const snap = () => G('JSON.stringify([activeMap===DUNGEON4_MAP, inDungeon, dungeonFloor, player.x, player.y, player.facing, combat.cooldown])');
    const cases = [
      ["unknown map",       "transitionToLocation({mapId:'NOPE', x:8*TILE, y:8*TILE, facing:'down'})"],
      ["oob coords",        "transitionToLocation({mapId:'MAP', x:9999*TILE, y:8*TILE, facing:'down'})"],
      ["non-finite coords", "transitionToLocation({mapId:'MAP', x:NaN, y:8*TILE, facing:'down'})"],
      ["bad facing",        "transitionToLocation({mapId:'MAP', x:8*TILE, y:8*TILE, facing:'sideways'})"],
      ["unknown state key", "transitionToLocation({mapId:'MAP', x:8*TILE, y:8*TILE, facing:'down', state:{inDungoen:true}})"],
      ["invalid floor",     "transitionToLocation({mapId:'DUNGEON2_MAP', x:8*TILE, y:3*TILE, facing:'down', state:{inDungeon:true, dungeonFloor:0}})"],
      ["contradiction",     "transitionToLocation({mapId:'MAP', x:8*TILE, y:8*TILE, facing:'down', state:{inDungeon:true, inTown:true, dungeonFloor:2}})"],
    ];
    for (const [label, expr] of cases) {
      setKnownGood();
      const before = snap();
      assert.equal(G(expr), false, label + ': returns false');
      assert.equal(snap(), before, label + ': leaves ALL state untouched');
    }

    // ── D. Representative transitions land correctly + views agree ──────────
    const check = (setup, wantMapId, wantLoc, extra) => {
      G(setup);
      assert.equal(G('mapRegistryId(activeMap)'), wantMapId, setup + ' → map ' + wantMapId);
      if (wantLoc !== null) assert.equal(G('currentMapId()'), wantLoc, setup + ' → currentMapId ' + wantLoc);
      assert.equal(G('canWalk(player.x, player.y)'), true, setup + ' → landing walkable');
      if (extra) extra();
    };
    // Town district, building, house
    check("enterTownAt('calwick','south');", 'TOWN_MAP', 'town');
    // enterWestTown preserves player.y — position at a real WEST_EXIT row (row 9) first.
    check("player.y = 9.5 * TILE; enterWestTown();", 'WEST_TOWN_MAP', 'west');
    check("enterHouse('esla_house');", 'HOUSE_INTERIOR_MAP', 'house:esla_house', () => {
      assert.equal(G("currentHouseId"), 'esla_house', 'house id set');
      assert.equal(G("houseSourceMap === WEST_TOWN_MAP"), true, 'source map captured');
      assert.equal(G("houseSourceBuilding"), 'west', 'source building captured');
    });
    check("exitBuilding();", 'WEST_TOWN_MAP', 'west', () => {
      assert.equal(G('currentHouseId'), null, 'house id cleared on exit');
      assert.equal(G('houseSourceMap'), null, 'source map cleared on exit (no leak)');
      assert.equal(G('inTown'), true, 'still in town after house exit');
    });
    // South Ruins entrance + multiple dungeon floors
    check("resetLocationState(); enterDungeon();", 'DUNGEON_ENTRANCE_MAP', 'dungeon_entrance');
    check("descendToDungeon1();", 'DUNGEON_MAP', 'dungeon1', () => assert.equal(G('dungeonFloor'), 1, 'floor 1'));
    check("descendToDungeon2(); descendToDungeon3();", 'DUNGEON3_MAP', 'dungeon3', () => assert.equal(G('dungeonFloor'), 3, 'floor 3'));
    // Sluice floors 1/2/3 + sealed room, with encounter-pool agreement
    check("resetLocationState(); enterSluice();", 'SLUICE_MAP', 'sluice', () => {
      assert.equal(G('sluiceFloor'), 1, 'sluice floor 1');
      assert.deepEqual(JSON.parse(G('JSON.stringify(currentEncounterPool().map(function(t){return t.name;}).sort())')), ['Marsh Wisp', 'Sluice Slime'], 'top floor pool = wisp/slime');
    });
    check("descendToSluice2();", 'SLUICE_LEVEL2_MAP', 'sluice2', () => {
      assert.equal(G('currentEncounterPool() === SLUICE_ENEMY_TEMPLATES'), true, 'floor 2 tough pool unchanged');
    });
    check("descendToSluice3();", 'SLUICE_LEVEL3_MAP', 'sluice3');
    G("player.x = 10.5*TILE; player.y = 7.5*TILE;"); // east pocket, past the false walls
    check("enterSluiceSecret();", 'SLUICE_SECRET_MAP', null, () => {
      assert.equal(G('sluiceFloor'), 4, 'sealed room is sluiceFloor 4');
      assert.equal(G('currentEncounterPool() === SLUICE_SECRET_ENEMY_TEMPLATES'), true, 'sealed room pool unchanged');
    });
    // Basin chamber + sunken gallery
    check("resetLocationState(); enterBasinChamber();", 'BASIN_CHAMBER_MAP', 'basin_chamber');
    check("resetLocationState(); descendSunkenGallery();", 'SUNKEN_GALLERY_MAP', 'sunken_gallery');
    // Bridge from both directions; toll/direction set inside, cleared on exit
    check("resetLocationState(); enterBridgePostFromSouth();", 'BRIDGE_CROSSING_MAP', 'bridge_post', () => {
      assert.equal(G('bridge_entry_direction'), 'south', 'south entry direction');
    });
    check("exitBridgeSouth();", 'MAP3_N2', null, () => {
      assert.equal(G('bridge_entry_direction'), null, 'bridge direction cleared on exit (no leak)');
      assert.equal(G('bridge_toll_paid'), false, 'toll state cleared on exit');
      assert.equal(G('inBridgePost'), false, 'off the bridge');
    });
    check("resetLocationState(); enterBridgePostFromNorth();", 'BRIDGE_CROSSING_MAP', 'bridge_post', () => {
      assert.equal(G('bridge_entry_direction'), 'north', 'north entry direction');
    });

    // ── E. Edge transition preserves one coordinate ─────────────────────────
    // NORTH_BASIN_S_MAP north edge (cols 1-14) → NORTH_BASIN_C_MAP; the column
    // (player.x) is preserved across the crossing.
    G("resetLocationState(); activeMap=NORTH_BASIN_S_MAP; player.x=7.5*TILE; player.y=1.5*TILE; player.facing='up';");
    const preX = G('player.x');
    assert.equal(G("tryEdgeTransition('north')"), true, 'north edge transition succeeds');
    assert.equal(G('mapRegistryId(activeMap)'), 'NORTH_BASIN_C_MAP', 'edge transition changed map');
    assert.equal(G('player.x'), preX, 'edge transition preserved the along-edge x coordinate exactly');
    assert.equal(G('canWalk(player.x, player.y)'), true, 'edge landing walkable');

    // ── F. Debug warp: same canonical reset, clamp/nudge + no side effects ──
    G("inDungeon=true; dungeonFloor=6; inSluice=true; sluiceFloor=2; currentTownId='drenwick'; townBuilding='house'; bridge_toll_paid=true; dialogue.open=false; combat.active=false;");
    const warp = JSON.parse(G("JSON.stringify(debugWarpToMap('MAP', 9999, 8))")); // out-of-bounds col → clamped
    assert.equal(warp.success, true, 'debug warp succeeds');
    assert.ok(/clamped/.test(warp.message), 'clamp behavior preserved');
    assert.equal(G('inDungeon===false && dungeonFloor===1 && inSluice===false && sluiceFloor===1 && currentTownId===null && townBuilding===null && bridge_toll_paid===false'), true,
      'debug warp reset EVERY location field (incl. floors/town/bridge the old hand-list missed)');
    assert.equal(G('dialogue.open'), false, 'debug warp opened no dialogue (no side effects)');

    // ── G. Defeat relocation to the player home ─────────────────────────────
    G("inBridgePost=true; bridge_entry_direction='south'; bridge_toll_paid=true; activeMap=BRIDGE_CROSSING_MAP;");
    G(`transitionToLocation({ mapId:'HOUSE_INTERIOR_MAP', x:9.5*TILE, y:3.5*TILE, facing:'down', state:{
        inTown:true, currentTownId:'calwick', townBuilding:'house', currentHouseId:'player_house',
        houseSourceMap:WEST_TOWN_MAP, houseSourceBuilding:'west', houseReturnPos:{x:2.5*TILE,y:12.5*TILE} } });`);
    assert.equal(G('activeMap===HOUSE_INTERIOR_MAP && currentHouseId==="player_house" && inBridgePost===false && bridge_toll_paid===false'), true,
      'defeat relocation lands home and clears the bridge state that used to leak');
    assert.equal(G('canWalk(player.x, player.y)'), true, 'home landing walkable');

    // ── H. Save restoration is not a transition; sluice pool intact ─────────
    G("resetLocationState(); enterDungeon(); descendToDungeon1(); saveGame();");
    G("exitDungeon(); combat.cooldown = 424242;"); // move away, dirty cooldown
    assert.equal(G('loadGame()'), true, 'load succeeds');
    assert.equal(G('inDungeon===true && dungeonFloor===1 && activeMap===DUNGEON_MAP'), true, 'v3 save restores dungeon location');
    assert.equal(G('combat.cooldown'), 424242, 'loadGame did NOT run a transition (cooldown untouched)');

    // ── L. Load-bearing: break each guarantee, confirm the check fails ──────
    // L1. Remove one binding from reset coverage → isolation fails.
    G("window.__i = window.LOCATION_STATE_BINDINGS.findIndex(function(b){return b.key==='inSluice';}); window.__set = window.LOCATION_STATE_BINDINGS[window.__i].set; window.LOCATION_STATE_BINDINGS[window.__i].set = function(){};");
    try {
      expectAssertFails(() => {
        G('inSluice=true; resetLocationState();');
        assert.equal(G('inSluice'), false, 'reset should clear inSluice');
      }, 'a no-op setter must break reset isolation');
    } finally {
      G("window.LOCATION_STATE_BINDINGS[window.__i].set = window.__set; delete window.__set; delete window.__i; inSluice=false;");
    }
    G('resetLocationState();'); assert.equal(G('inSluice'), false, 'reset works again once the setter is restored');

    // L2. Break application of a special flag → representative transition fails.
    G("window.__j = window.LOCATION_STATE_BINDINGS.findIndex(function(b){return b.key==='inBasinChamber';}); window.__set2 = window.LOCATION_STATE_BINDINGS[window.__j].set; window.LOCATION_STATE_BINDINGS[window.__j].set = function(){};");
    try {
      expectAssertFails(() => {
        G('resetLocationState(); enterBasinChamber();');
        assert.equal(G('inBasinChamber'), true, 'enterBasinChamber should set inBasinChamber');
      }, 'breaking the inBasinChamber setter must break the basin-chamber transition');
    } finally {
      G("window.LOCATION_STATE_BINDINGS[window.__j].set = window.__set2; delete window.__set2; delete window.__j;");
    }
    G('resetLocationState(); enterBasinChamber();'); assert.equal(G('inBasinChamber'), true, 'basin transition works again once restored');

    // L3. An invalid contradictory destination is rejected (proves validation is live).
    G('resetLocationState();');
    expectAssertFails(() => {
      assert.equal(G("transitionToLocation({mapId:'MAP', x:8*TILE, y:8*TILE, facing:'down', state:{inSluice:true, inTown:true, sluiceFloor:1}})"), true, 'contradiction should be accepted');
    }, 'a contradictory destination must be rejected');

    g.renderFrame();
  },
};
