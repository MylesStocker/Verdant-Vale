'use strict';
// Debug warp repair (debug-warp.js): every menu destination is a coherent
// LOGICAL location, not a bare map id. Covers the catalog's shape + deterministic
// outdoor-first ordering, that every enabled destination resolves to a valid map
// and a complete/invariant-valid location-state candidate with a walkable
// landing, representative warps (town/interior/dungeon/sluice/gallery/special),
// reused physical maps producing distinct context, normal exits, no cross-warp
// flag leakage, coordinate clamping + blocked nudging, atomic failure, and the
// absence of any quest/inventory/gold/day side effect.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'debug warp: logical destination catalog — coherent, outdoor-first, atomic, side-effect-free',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    const J = (expr) => JSON.parse(g.run(expr));
    const warp = (id, col, row) => J(`JSON.stringify(debugWarpToDestination(${JSON.stringify(id)}${col === undefined ? '' : ', ' + col + ', ' + row}))`);
    const ctx = () => ({ name: g.run('locationName()'), key: g.run('currentContentLocationKey()') });

    const dests = J('JSON.stringify(getDebugWarpDestinations())');
    const CATS = J('JSON.stringify(DEBUG_WARP_CATEGORY_ORDER)');
    assert.ok(dests.length > 40, 'catalog is populated');

    // ── 1. Unique ids; valid map ids; valid categories ──────────────────────
    const ids = dests.map(d => d.id);
    assert.equal(new Set(ids).size, ids.length, 'destination ids are unique');
    for (const d of dests) {
      assert.ok(g.run(`mapEntryForId(${JSON.stringify(d.mapId)}) !== null`), `${d.id} -> valid MAP_CATALOG map ${d.mapId}`);
      assert.ok(CATS.includes(d.category), `${d.id} has a valid category (${d.category})`);
    }

    // ── 2. Deterministic outdoor-first ordering ─────────────────────────────
    const firstNonOutdoor = dests.findIndex(d => d.category !== 'outdoor');
    const lastOutdoor = dests.map(d => d.category).lastIndexOf('outdoor');
    assert.ok(firstNonOutdoor === -1 || lastOutdoor < firstNonOutdoor,
      'no non-outdoor entry appears before an outdoor entry');
    for (let i = 1; i < dests.length; i++) {
      const a = dests[i - 1], b = dests[i];
      const ca = CATS.indexOf(a.category), cb = CATS.indexOf(b.category);
      const ordered = ca < cb || (ca === cb && (a.label < b.label || (a.label === b.label && a.id <= b.id)));
      assert.ok(ordered, `deterministic order at ${a.id} -> ${b.id}`);
    }

    // ── 3. Every enabled destination: valid map + complete valid state + a
    //       walkable landing ─────────────────────────────────────────────────
    for (const d of dests) {
      if (d.disabled) continue;
      // walkable landing exists on its own map
      const hasLanding = g.run(`(function(){
        var m = mapRefForId(${JSON.stringify(d.mapId)});
        return !!debugFindNearestWalkableTile(m, ${d.defaultCol}, ${d.defaultRow});
      })()`);
      assert.ok(hasLanding, `${d.id} has at least one walkable landing`);
      // warping produces an invariant-valid complete location state
      const r = warp(d.id);
      assert.ok(r.success, `${d.id} warps successfully: ${r.message}`);
      const inv = J('JSON.stringify(validateLocationState(snapshotLocationState()))');
      assert.ok(inv.ok, `${d.id} yields a valid location state (${inv.errors.join('; ')})`);
      assert.ok(g.run('canWalk(player.x, player.y)'), `${d.id} lands on a walkable tile`);
      // resolution helpers never throw / never empty
      assert.ok(g.run('locationName()').length > 0, `${d.id} has a location name`);
      assert.ok(g.run('currentContentLocationKey()').length > 0, `${d.id} has a content-location key`);
      assert.ok(Array.isArray(g.run('currentItemList()')), `${d.id} item list resolves`);
      assert.doesNotThrow(() => g.run('isEncounterEligibleTile(Math.floor(player.x/TILE), Math.floor(player.y/TILE))'),
        `${d.id} encounter eligibility resolves`);
    }

    // ── 4. Outdoor warp => neutral location state ───────────────────────────
    warp('outdoor:MAP2');
    for (const flag of ['inDungeon', 'inTown', 'inSluice', 'inMireVault', 'inBridgePost',
                        'inSunkenGallery', 'inBasinChamber', 'inDungeonEntrance', 'inHamletInterior']) {
      assert.equal(g.run(flag), false, `outdoor warp leaves ${flag} neutral`);
    }
    assert.equal(g.run('currentTownId'), null, 'outdoor warp: currentTownId neutral');
    assert.equal(g.run('townBuilding'), null, 'outdoor warp: townBuilding neutral');
    assert.equal(g.run('dungeonFloor'), 1, 'outdoor warp: dungeonFloor neutral');
    assert.deepEqual(ctx(), { name: 'Eastern Reaches', key: 'map2' }, 'outdoor MAP2 name/key');

    // ── 5. Representative town exteriors (Calwick + Drenwick) ────────────────
    warp('town:calwick_south');
    assert.equal(g.run('inTown'), true); assert.equal(g.run('currentTownId'), 'calwick');
    assert.equal(ctx().name, 'Calwick');
    warp('town:drenwick_market');
    assert.equal(g.run('currentTownId'), 'drenwick');
    assert.deepEqual(ctx(), { name: 'Drenwick — Market Quarter', key: 'drenwick_market' });
    // NPC filtering context: at least one SIMPLE_NPC is scoped to this content key
    assert.ok(g.run("SIMPLE_NPCS.some(n => n.map === currentContentLocationKey())"),
      'a town-exterior warp exposes NPCs scoped to its content-location key');

    // ── 6. Representative inn / office / interior ────────────────────────────
    warp('interior:drenwick_inn');
    assert.deepEqual(ctx(), { name: 'Drenwick — Inn', key: 'drenwick_inn' });
    assert.equal(g.run('townBuilding'), 'inn');
    warp('interior:calwick_office');
    assert.equal(g.run('currentContentLocationKey()'), 'office');
    // Tavern: name/key key off activeMap, but its furniture needs townBuilding='tavern'.
    warp('interior:drenwick_tavern');
    assert.equal(g.run('townBuilding'), 'tavern', 'tavern context sets townBuilding for its furniture gate');
    assert.equal(ctx().key, 'drenwick_tavern');

    // ── 7. Two destinations sharing one house/apartment map, distinct context ─
    warp('apt:calwick_1');
    const apt1 = { map: g.run('mapIdForRef(activeMap)'), house: g.run('currentHouseId'), key: g.run('currentContentLocationKey()') };
    warp('apt:calwick_2');
    const apt2 = { map: g.run('mapIdForRef(activeMap)'), house: g.run('currentHouseId'), key: g.run('currentContentLocationKey()') };
    assert.equal(apt1.map, 'SMALL_APARTMENT_MAP');
    assert.equal(apt2.map, 'SMALL_APARTMENT_MAP');
    assert.notEqual(apt1.house, apt2.house, 'shared apartment map, distinct currentHouseId');
    assert.notEqual(apt1.key, apt2.key, 'shared apartment map, distinct content-location key');
    // Houses share HOUSE_INTERIOR_MAP with distinct context + return too.
    warp('house:calwick_player');
    const hp = { map: g.run('mapIdForRef(activeMap)'), house: g.run('currentHouseId'), src: g.run('mapIdForRef(houseSourceMap)') };
    warp('house:calwick_esla');
    const he = { map: g.run('mapIdForRef(activeMap)'), house: g.run('currentHouseId'), ret: J('JSON.stringify(houseReturnPos)') };
    assert.equal(hp.map, 'HOUSE_INTERIOR_MAP');
    assert.equal(he.map, 'HOUSE_INTERIOR_MAP');
    assert.notEqual(hp.house, he.house, 'shared house map, distinct currentHouseId');
    assert.equal(hp.src, 'WEST_TOWN_MAP', 'house carries a resolved source map for its exit');

    // ── 8. South Ruins floors, incl floor-dependent render/exit context ──────
    warp('dungeon:f1');
    assert.equal(g.run('inDungeon'), true); assert.equal(g.run('dungeonFloor'), 1);
    assert.equal(ctx().name, 'South Ruins');
    warp('dungeon:f2'); // floor 2 => DUNGEON_EXIT renders via drawDungeon2Exit (floor-dependent render)
    assert.equal(g.run('dungeonFloor'), 2);
    assert.equal(ctx().name, 'South Ruins — Lower');
    warp('dungeon:f3_tl'); // floor-3 sub-room => distinct locationName (floor-dependent context)
    assert.equal(g.run('dungeonFloor'), 3);
    assert.equal(ctx().name, 'South Ruins — Deep, West Wing');

    // ── 9. East Sluice floor state ──────────────────────────────────────────
    warp('special:sluice_l2');
    assert.equal(g.run('inSluice'), true); assert.equal(g.run('sluiceFloor'), 2);
    assert.equal(ctx().name, 'East Sluice — Lower Works');

    // ── 10. Sunken Gallery room state + one more special ────────────────────
    warp('special:sunken_gallery_room');
    assert.equal(g.run('inSunkenGallery'), true);
    assert.equal(ctx().key, 'sunken_gallery');
    warp('special:bridge');
    assert.equal(g.run('inBridgePost'), true);
    assert.equal(g.run('bridge_entry_direction'), 'south');
    assert.equal(ctx().name, 'Imperial Bridge — Toll Gate');

    // ── 11. Normal exits after building / house / dungeon warps ──────────────
    warp('interior:drenwick_inn'); g.run('exitBuilding()');
    assert.equal(g.run('mapIdForRef(activeMap)'), 'DRENWICK_CIVIC_MAP', 'inn exit returns to civic');
    assert.equal(g.run('townBuilding'), null);
    warp('house:calwick_player'); g.run('exitBuilding()');
    assert.equal(g.run('mapIdForRef(activeMap)'), 'WEST_TOWN_MAP', 'house exit returns to its source map');
    assert.equal(g.run('inTown'), true); assert.equal(g.run('townBuilding'), 'west');
    warp('dungeon:f1'); g.run('ascendToDungeonEntrance()');
    assert.equal(g.run('inDungeonEntrance'), true, 'dungeon ascend produces a coherent location');
    assert.equal(g.run('inDungeon'), false);

    // ── 12. Repeated cross-category warps do not leak old flags ──────────────
    for (const id of ['dungeon:f5', 'town:drenwick_civic', 'special:sluice_l3', 'outdoor:MAP', 'special:bridge', 'interior:calwick_inn']) {
      warp(id);
      const inv = J('JSON.stringify(validateLocationState(snapshotLocationState()))');
      assert.ok(inv.ok, `${id} state stays valid across category switches (${inv.errors.join('; ')})`);
    }
    // after the last (calwick inn) nothing dungeon/sluice/bridge leaks
    assert.equal(g.run('inDungeon'), false); assert.equal(g.run('inSluice'), false);
    assert.equal(g.run('inBridgePost'), false); assert.equal(g.run('bridge_entry_direction'), null);
    assert.equal(g.run('sluiceFloor'), 1); assert.equal(g.run('dungeonFloor'), 1);

    // ── 13. Coordinate clamping + blocked-tile nudging ──────────────────────
    const clampRes = warp('outdoor:MAP', 9999, 9999);
    assert.ok(clampRes.success);
    assert.ok(clampRes.col < g.run('COLS') && clampRes.row < g.run('ROWS'), 'out-of-range coord clamped in bounds');
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'clamped landing is walkable');
    const nudgeRes = warp('outdoor:MAP', 0, 0); // (0,0) is TREE border on overworld
    assert.ok(nudgeRes.success);
    assert.equal(g.run('canWalk(player.x, player.y)'), true, 'blocked pick nudged to a walkable tile');

    // ── 14. Unknown / malformed destinations fail atomically ─────────────────
    warp('outdoor:MAP'); g.run('combat.cooldown = 0;');
    const before = { map: g.run('mapIdForRef(activeMap)'), x: g.run('player.x'), y: g.run('player.y'), face: g.run('player.facing'), cd: g.run('combat.cooldown') };
    for (const bad of ['nonexistent:zzz', 'outdoor:NOT_A_MAP', '']) {
      const r = warp(bad);
      assert.equal(r.success, false, `"${bad}" fails`);
      assert.ok(r.message && r.message.length > 0, `"${bad}" gives a failure message`);
    }
    assert.equal(g.run('mapIdForRef(activeMap)'), before.map, 'failed warp leaves activeMap untouched');
    assert.equal(g.run('player.x'), before.x, 'failed warp leaves player.x untouched');
    assert.equal(g.run('player.y'), before.y, 'failed warp leaves player.y untouched');
    assert.equal(g.run('player.facing'), before.face, 'failed warp leaves facing untouched');
    assert.equal(g.run('combat.cooldown'), before.cd, 'failed warp leaves encounter cooldown untouched');

    // ── 15. No persistent quest/inventory/gold/day side effects ─────────────
    const snap0 = J('JSON.stringify({ day: day, gold: stats.gold, items: stats.items.length, hp: stats.hp })');
    for (const id of ['special:bridge', 'interior:drenwick_inn', 'dungeon:f5', 'apt:drenwick_a1_u1', 'special:takomo', 'special:mire_vault']) warp(id);
    const snap1 = J('JSON.stringify({ day: day, gold: stats.gold, items: stats.items.length, hp: stats.hp })');
    assert.deepEqual(snap0, snap1, 'warping performs no quest/inventory/gold/day/hp side effect');

    // ── 15b. Disabled destination (Dream): visible, unselectable, atomic ─────
    // DREAM_MAP is cutscene-only — its exit (exitDream) needs the transient
    // _dreamReturn stash (outside LOCATION_STATE_BINDINGS), so a direct warp
    // would strand the player. It stays in the catalog but disabled.
    const dream = dests.find(d => d.id === 'special:dream');
    assert.ok(dream, 'the Dream destination is still listed');
    assert.equal(dream.disabled, true, 'the Dream destination is disabled');
    assert.ok(dream.disabledReason && dream.disabledReason.length > 0, 'the Dream destination has a disabled reason');
    // API: fails atomically, nothing mutated.
    warp('outdoor:MAP'); g.run('combat.cooldown = 0;');
    const dBefore = { map: g.run('mapIdForRef(activeMap)'), x: g.run('player.x'), y: g.run('player.y'), face: g.run('player.facing'), cd: g.run('combat.cooldown') };
    const dr = warp('special:dream');
    assert.equal(dr.success, false, 'a direct warp to the Dream fails');
    assert.match(dr.message, /disabled|dream return context/i, 'failure message explains why');
    assert.equal(g.run('mapIdForRef(activeMap)'), dBefore.map, 'disabled warp leaves activeMap untouched');
    assert.equal(g.run('player.x'), dBefore.x, 'disabled warp leaves player.x untouched');
    assert.equal(g.run('player.y'), dBefore.y, 'disabled warp leaves player.y untouched');
    assert.equal(g.run('player.facing'), dBefore.face, 'disabled warp leaves facing untouched');
    assert.equal(g.run('combat.cooldown'), dBefore.cd, 'disabled warp leaves cooldown untouched');
    // UI: pressing Enter on the disabled row does NOT open coordinate mode.
    const dreamIdx = dests.findIndex(d => d.id === 'special:dream');
    g.run(`
      dialogue.open = false; menu.open = false; choice.open = false; shop.open = false; debugMenu.open = false;
      warpMenu.open = true; warpMenu.mode = 'list'; warpMenu.destinations = getDebugWarpDestinations();
      warpMenu.cursor = ${dreamIdx}; warpMenu.scrollOffset = 0; warpMenu.targetDestId = null;
    `);
    g.press('Enter');
    assert.equal(g.run('warpMenu.mode'), 'list', 'Enter on a disabled row stays in list mode (no coordinate mode)');
    assert.equal(g.run('warpMenu.targetDestId'), null, 'Enter on a disabled row selects nothing');
    assert.equal(g.run('warpMenu.open'), true, 'the warp menu stays open/usable');

    // ── 16. Map-only debugWarpToMap is now outdoor-only-safe ─────────────────
    assert.equal(J("JSON.stringify(debugWarpToMap('MAP', 7, 7))").success, true, 'outdoor map-only warp still works');
    const nonOutdoor = J("JSON.stringify(debugWarpToMap('DRENWICK_INN_MAP', 7, 12))");
    assert.equal(nonOutdoor.success, false, 'map-only warp refuses non-outdoor maps (no incomplete warp)');
    assert.match(nonOutdoor.message, /logical context|debugWarpToDestination/, 'refusal points to the logical catalog');
  },
};
