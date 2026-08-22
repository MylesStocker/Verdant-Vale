'use strict';
// Phase 1 guard: LOCATION_STATE_BINDINGS (world-transitions.js) is the sole
// current-schema inventory of persisted location-context fields. saveGame()
// serializes through serializeLocationState(); loadGame() preflights the whole
// location restore (deserializeLocationState + validatePlacement +
// validateLocationState) BEFORE mutating any runtime state, and commits the
// location atomically via applyLocationState(). These tests pin: registry
// round-trips, houseSourceMap id conversion + houseReturnPos deep-copy, the flat
// payload shape + save version, current + migrated loads, and that every reject
// path (unknown map, unknown houseSourceMapId, bad invariants, bad coords,
// blocked placement) returns false, mutates nothing, and preserves the save.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'save location registry: registry-driven serialize + preflighted, atomic restore',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const TILE = g.run('TILE');
    const SAVE_VERSION = g.run('SAVE_VERSION');
    const snapLoc = () => g.run('JSON.stringify(snapshotLocationState())');

    // ── Registry is the inventory; dilemma_voss is NOT in it ─────────────────
    const keys = JSON.parse(g.run('JSON.stringify(LOCATION_STATE_BINDINGS.map(b => b.key))'));
    assert.ok(!keys.includes('dilemma_voss'), 'dilemma_voss is not a location-state binding');

    // ── Flat payload shape + save version + houseSourceMap id conversion ──────
    g.run(`
      resetLocationState();
      applyLocationState(Object.assign(snapshotLocationState(), {
        inTown: true, currentTownId: 'calwick', townBuilding: 'house', currentHouseId: 'player_house',
        houseSourceMap: WEST_TOWN_MAP, houseSourceBuilding: 'west', houseReturnPos: { x: 80, y: 272 },
      }));
      activeMap = HOUSE_INTERIOR_MAP; player.x = 7.5 * TILE; player.y = 9.5 * TILE; player.facing = 'up';
      dilemma_voss = 3;
      saveGame();
    `);
    const saved = JSON.parse(g.run("localStorage.getItem('verdantVale_save')"));
    assert.equal(saved.version, SAVE_VERSION, 'save version unchanged');
    assert.equal(saved.location.kind, 'discrete', 'a house interior save is a discrete location');
    assert.equal(saved.location.mapId, 'HOUSE_INTERIOR_MAP', 'discrete location.mapId serialized via mapRegistryId');
    assert.ok(!('activeMapId' in saved), 'v4 no longer stores a separate activeMapId (superseded by the location discriminator)');
    assert.equal(saved.houseSourceMapId, 'WEST_TOWN_MAP', 'houseSourceMap serialized as flat houseSourceMapId (registry id)');
    assert.ok(!('houseSourceMap' in saved), 'the raw map-ref key is never written to the save');
    assert.deepEqual(saved.houseReturnPos, { x: 80, y: 272 }, 'houseReturnPos serialized as a flat {x,y}');
    assert.equal(saved.dilemma_voss, 3, 'dilemma_voss lives at the top level, outside the location block');
    // Every binding contributes its flat save key to the payload.
    for (const b of JSON.parse(g.run('JSON.stringify(LOCATION_STATE_BINDINGS.map(b => ({ key: b.key, saveKey: (b.persist && b.persist.saveKey) || b.key })))'))) {
      assert.ok(b.saveKey in saved, 'flat payload includes location field "' + b.saveKey + '"');
    }

    // ── houseReturnPos is deep-copied on deserialize (never by reference) ─────
    const posCopy = g.run(`(function(){
      var data = { houseReturnPos: { x: 5, y: 9 } };
      var des = deserializeLocationState(data);
      return des.state.houseReturnPos !== data.houseReturnPos && des.state.houseReturnPos.x === 5 && des.state.houseReturnPos.y === 9;
    })()`);
    assert.equal(posCopy, true, 'deserialize copies houseReturnPos into a fresh object');

    // ── Unknown houseSourceMapId fails safely in deserialize ─────────────────
    const badHouseSrc = g.run("deserializeLocationState({ houseSourceMapId: 'NO_SUCH_MAP' }).ok");
    assert.equal(badHouseSrc, false, 'a non-null unknown houseSourceMapId makes deserialize fail');

    // ── Round-trip every binding across representative valid states ───────────
    // Each state exercises a different subset of the bindings; snapshotLocation
    // must survive a save → scramble → load cycle byte-for-byte.
    const states = [
      // house (town/house/houseSource*/houseReturnPos)
      `resetLocationState(); applyLocationState(Object.assign(snapshotLocationState(), { inTown:true, currentTownId:'calwick', townBuilding:'house', currentHouseId:'player_house', houseSourceMap:WEST_TOWN_MAP, houseSourceBuilding:'west', houseReturnPos:{x:80,y:272} })); activeMap=HOUSE_INTERIOR_MAP; player.x=7.5*TILE; player.y=9.5*TILE; player.facing='up';`,
      // dungeon floor 1 (inDungeon/dungeonFloor)
      `resetLocationState(); inDungeon=true; dungeonFloor=1; activeMap=DUNGEON_MAP; player.x=7.5*TILE; player.y=9.5*TILE; player.facing='down';`,
      // sluice floor 2 (inSluice/sluiceFloor)
      `resetLocationState(); inSluice=true; sluiceFloor=2; activeMap=SLUICE_LEVEL2_MAP; player.x=7.5*TILE; player.y=7.5*TILE; player.facing='down';`,
      // bridge (inBridgePost/bridge_entry_direction/bridge_toll_paid)
      `resetLocationState(); inBridgePost=true; bridge_entry_direction='south'; bridge_toll_paid=true; activeMap=BRIDGE_CROSSING_MAP; player.x=7.5*TILE; player.y=7.5*TILE; player.facing='up';`,
    ];
    for (const setup of states) {
      g.run(setup + ' var _w = debugFindNearestWalkableTile(activeMap, Math.floor(player.x/TILE), Math.floor(player.y/TILE)); player.x=(_w.col+0.5)*TILE; player.y=(_w.row+0.5)*TILE;');
      const before = snapLoc();
      g.run('saveGame();');
      g.run('resetLocationState(); activeMap = MAP; player.x = 7.5*TILE; player.y = 9.5*TILE;');
      assert.equal(g.run('loadGame()'), true, 'valid location loads: ' + setup.slice(0, 40));
      assert.equal(snapLoc(), before, 'location snapshot round-trips exactly: ' + setup.slice(0, 40));
    }

    // Every remaining single-flag mode round-trips through serialize↔deserialize
    // directly (some of these maps — e.g. the Sunken Gallery — are deliberately
    // save-blocked, so this exercises the registry without saveGame()). This is
    // the guard that caught inBasinChamber/inSunkenGallery being dropped from the
    // old hand-copied flag list.
    const singleModes = ['inMireVault', 'inTakomo', 'inFenBrewery', 'inHamletInterior', 'inLighthouse',
      'inLorraHouse', 'inAbandonedFarmhouse', 'inMarenPost', 'inDrenwrickPost', 'inSmugglerFort',
      'inBasinChamber', 'inSunkenGallery', 'inDungeonEntrance'];
    for (const mode of singleModes) {
      const okRoundTrip = g.run(`(function(){
        resetLocationState(); ${mode} = true;
        var payload = serializeLocationState();
        var round = deserializeLocationState(payload);
        return round.ok && round.state.${mode} === true && validateLocationState(round.state).ok;
      })()`);
      assert.equal(okRoundTrip, true, 'mode "' + mode + '" round-trips through the location registry');
    }

    // ── Current save loads; any OTHER version is rejected (v4 clean break) ────
    g.run(`resetLocationState(); inDungeon=true; dungeonFloor=1; activeMap=DUNGEON_MAP; player.x=7.5*TILE; player.y=9.5*TILE; player.facing='down'; day=4; stats.gold=42; saveGame();`);
    const cur = JSON.parse(g.run("localStorage.getItem('verdantVale_save')"));
    assert.equal(cur.version, SAVE_VERSION, 'a fresh save is the current version');
    assert.equal(g.run('loadGame()'), true, 'current-version save loads');
    // A downgraded (older-version) payload is rejected cleanly — there is NO migration.
    const older = Object.assign({}, cur, { version: 3 });
    g.run(`resetLocationState(); activeMap=MAP; player.x=7.5*TILE; player.y=9.5*TILE; inDungeon=false; dungeonFloor=1; day=1; stats.gold=0; __reconcileCanonicalForTest();`);
    g.run("localStorage.setItem('verdantVale_save', " + JSON.stringify(JSON.stringify(older)) + ");");
    assert.equal(g.run('loadGame()'), false, 'a version-3 (or any non-current) save is rejected — no migration path');
    assert.equal(g.run("JSON.parse(localStorage.getItem('verdantVale_save')).version"), 3, 'the rejected older save is left untouched on disk');

    // ── Every reject path: false + no mutation + save preserved ──────────────
    // Baseline valid save to tweak one field at a time.
    g.run(`resetLocationState(); activeMap=MAP; inTown=false; player.x=7.5*TILE; player.y=9.5*TILE; player.facing='down'; day=9; stats.gold=500; __reconcileCanonicalForTest(); saveGame();`);
    const base = JSON.parse(g.run("localStorage.getItem('verdantVale_save')"));

    function reject(name, overrides) {
      const badJson = JSON.stringify(Object.assign({}, base, overrides));
      // Distinct running state so any mutation is detectable.
      g.run(`resetLocationState(); activeMap=MAP2; inTown=false; player.x=4.5*TILE; player.y=6.5*TILE; player.facing='left'; day=3; stats.gold=111; MainQuest=1;`);
      g.run("localStorage.setItem('verdantVale_save', " + JSON.stringify(badJson) + ");");
      const before = g.run('JSON.stringify({ gold: stats.gold, day: day, mq: MainQuest, px: player.x, py: player.y, pf: player.facing, map: mapRegistryId(activeMap), loc: snapshotLocationState() })');
      const ok = g.run('loadGame()');
      assert.equal(ok, false, name + ': load must be rejected');
      const after = g.run('JSON.stringify({ gold: stats.gold, day: day, mq: MainQuest, px: player.x, py: player.y, pf: player.facing, map: mapRegistryId(activeMap), loc: snapshotLocationState() })');
      assert.equal(after, before, name + ': runtime state must be completely unmutated after a rejected load');
      assert.equal(g.run("localStorage.getItem('verdantVale_save')"), badJson, name + ': the stored (invalid) save must be preserved intact');
    }

    reject('unknown discrete map',       { location: { kind: 'discrete', mapId: 'NO_SUCH_MAP', localPxX: 7.5 * TILE, localPxY: 7.5 * TILE } });
    reject('unknown houseSourceMapId',   { houseSourceMapId: 'NO_SUCH_MAP' });
    reject('invalid invariant',          { inTown: false, currentHouseId: 'player_house' });
    reject('non-finite coordinates',     { location: { kind: 'discrete', mapId: 'MAP', localPxX: null, localPxY: 100 } });
    reject('out-of-bounds placement',    { location: { kind: 'discrete', mapId: 'MAP', localPxX: 100000, localPxY: 100 } });
    reject('blocked base placement',     { location: { kind: 'discrete', mapId: 'SLUICE_MAP', localPxX: 7.5 * TILE, localPxY: 7.5 * TILE } });
    reject('void regional point',        { location: { kind: 'regional', regionId: 'overworld', worldPxX: 99 * 512, worldPxY: 99 * 480 } });
    reject('unknown location kind',      { location: { kind: 'nonsense' } });
  },
};
