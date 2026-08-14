'use strict';

// world-transitions.js — all enter*/exit*/ascend*/descend* functions that move
// the player between maps: dungeon floors, floor-3 sub-rooms, guard posts,
// the bridge checkpoint, smugglers' fort, Mirethyst's Vault, the fen brewery,
// Falls hamlet, and town/building/house transitions.
//
// Every normal runtime location change goes through ONE boundary,
// transitionToLocation() (below): it validates the whole destination, resets
// all location state to neutral, applies the destination's explicit overrides,
// changes the map, places+faces the player, and applies cooldown. The wrapper
// functions keep only their story/quest/dialogue/return-context side effects.

// ─── Location-state binding registry (#5) ────────────────────────────────────
// ONE authoritative list of the mutable fields that define runtime LOCATION
// context — which area/map "mode" the player is in. Each binding owns a stable
// key, a neutral default, and get/set closures over the state.js `let` that
// holds it. resetLocationState() returns every field to neutral; the canonical
// transitionToLocation() then layers a destination's explicit non-neutral
// overrides on top. Debug warp and the transition-audit reset use THIS list, so
// there are no more hand-copied flag lists that silently forget a field (which
// is exactly how inBasinChamber / inSunkenGallery were once missed).
//
// NOT included: persistent story/quest flags that merely sit near location
// fields in save.js (e.g. dilemma_voss) — those are not location context and a
// transition must never reset them. houseReturnPos IS included (the house-exit
// return coordinate); its neutral is a fresh {x:0,y:0} (never null — saveGame()
// reads houseReturnPos.x/.y unconditionally).
const LOCATION_STATE_BINDINGS = [
  { key: 'inDungeon',           neutral: false, get: () => inDungeon,           set: (v) => { inDungeon = v; } },
  { key: 'dungeonFloor',        neutral: 1,     get: () => dungeonFloor,        set: (v) => { dungeonFloor = v; } },
  { key: 'inDungeonEntrance',   neutral: false, get: () => inDungeonEntrance,   set: (v) => { inDungeonEntrance = v; } },
  { key: 'inTown',              neutral: false, get: () => inTown,              set: (v) => { inTown = v; } },
  { key: 'currentTownId',       neutral: null,  get: () => currentTownId,       set: (v) => { currentTownId = v; } },
  { key: 'townBuilding',        neutral: null,  get: () => townBuilding,        set: (v) => { townBuilding = v; } },
  { key: 'currentHouseId',      neutral: null,  get: () => currentHouseId,      set: (v) => { currentHouseId = v; } },
  { key: 'houseSourceMap',      neutral: null,  get: () => houseSourceMap,      set: (v) => { houseSourceMap = v; }, persist: { saveKey: 'houseSourceMapId', kind: 'mapRef' } },
  { key: 'houseSourceBuilding', neutral: null,  get: () => houseSourceBuilding, set: (v) => { houseSourceBuilding = v; } },
  { key: 'houseReturnPos',      neutral: null,  get: () => houseReturnPos,      set: (v) => { houseReturnPos = v; }, isPos: true, persist: { kind: 'pos' } },
  { key: 'inSluice',            neutral: false, get: () => inSluice,            set: (v) => { inSluice = v; } },
  { key: 'sluiceFloor',         neutral: 1,     get: () => sluiceFloor,         set: (v) => { sluiceFloor = v; } },
  { key: 'inMireVault',         neutral: false, get: () => inMireVault,         set: (v) => { inMireVault = v; } },
  { key: 'inTakomo',            neutral: false, get: () => inTakomo,            set: (v) => { inTakomo = v; } },
  { key: 'inFenBrewery',        neutral: false, get: () => inFenBrewery,        set: (v) => { inFenBrewery = v; } },
  { key: 'inHamletInterior',    neutral: false, get: () => inHamletInterior,    set: (v) => { inHamletInterior = v; } },
  { key: 'inLorraHouse',        neutral: false, get: () => inLorraHouse,        set: (v) => { inLorraHouse = v; } },
  { key: 'inMarenPost',         neutral: false, get: () => inMarenPost,         set: (v) => { inMarenPost = v; } },
  { key: 'inDrenwrickPost',     neutral: false, get: () => inDrenwrickPost,     set: (v) => { inDrenwrickPost = v; } },
  { key: 'inBridgePost',        neutral: false, get: () => inBridgePost,        set: (v) => { inBridgePost = v; } },
  { key: 'inSmugglerFort',      neutral: false, get: () => inSmugglerFort,      set: (v) => { inSmugglerFort = v; } },
  { key: 'inBasinChamber',      neutral: false, get: () => inBasinChamber,      set: (v) => { inBasinChamber = v; } },
  { key: 'inSunkenGallery',     neutral: false, get: () => inSunkenGallery,     set: (v) => { inSunkenGallery = v; } },
  { key: 'bridge_entry_direction', neutral: null,  get: () => bridge_entry_direction, set: (v) => { bridge_entry_direction = v; } },
  { key: 'bridge_toll_paid',       neutral: false, get: () => bridge_toll_paid,       set: (v) => { bridge_toll_paid = v; } },
];
const LOCATION_STATE_KEY_SET = new Set(LOCATION_STATE_BINDINGS.map((b) => b.key));
// Every `in*` mode flag: at most ONE may be true at a time (a house is inTown +
// townBuilding='house', so it is the inTown mode, not a separate flag).
const LOCATION_MAJOR_MODE_KEYS = [
  'inDungeon', 'inDungeonEntrance', 'inTown', 'inSluice', 'inMireVault', 'inTakomo',
  'inFenBrewery', 'inHamletInterior', 'inLorraHouse', 'inMarenPost', 'inDrenwrickPost',
  'inBridgePost', 'inSmugglerFort', 'inBasinChamber', 'inSunkenGallery',
];

function _neutralValueFor(binding) {
  return binding.isPos ? { x: 0, y: 0 } : binding.neutral; // fresh object for position fields
}

// Snapshot every location field to a plain object (deep-copies position fields).
function snapshotLocationState() {
  const snap = {};
  for (const b of LOCATION_STATE_BINDINGS) {
    const v = b.get();
    snap[b.key] = (b.isPos && v) ? { x: v.x, y: v.y } : v;
  }
  return snap;
}

// Validate a proposed COMPLETE location state (every field present) against the
// invariants. Returns { ok, errors:[...] }; performs no mutation.
function validateLocationState(state) {
  const errors = [];
  // Unknown / missing keys.
  for (const k of Object.keys(state)) if (!LOCATION_STATE_KEY_SET.has(k)) errors.push('unknown location key "' + k + '"');
  for (const b of LOCATION_STATE_BINDINGS) if (!(b.key in state)) errors.push('missing location key "' + b.key + '"');
  if (errors.length) return { ok: false, errors };
  // At most one major area mode active.
  const active = LOCATION_MAJOR_MODE_KEYS.filter((k) => state[k] === true);
  if (active.length > 1) errors.push('multiple major location modes active at once: ' + active.join(', '));
  // Town/house context requires inTown.
  if (state.inTown !== true) {
    for (const k of ['currentTownId', 'townBuilding', 'currentHouseId', 'houseSourceMap', 'houseSourceBuilding']) {
      if (state[k] !== null) errors.push(k + ' must be neutral when inTown is false (got ' + JSON.stringify(state[k]) + ')');
    }
  }
  // A house id requires the house building.
  if (state.currentHouseId !== null && state.townBuilding !== 'house') errors.push('currentHouseId set but townBuilding is not "house"');
  // Dungeon floor validity.
  if (state.inDungeon === true) {
    if (typeof state.dungeonFloor !== 'number' || !Number.isFinite(state.dungeonFloor) || state.dungeonFloor < 1) errors.push('inDungeon requires a valid dungeonFloor >= 1');
  } else if (state.dungeonFloor !== 1) {
    errors.push('dungeonFloor must be neutral (1) when inDungeon is false (got ' + state.dungeonFloor + ')');
  }
  // Sluice floor validity.
  if (state.inSluice === true) {
    if (![1, 2, 3, 4].includes(state.sluiceFloor)) errors.push('inSluice requires sluiceFloor in {1,2,3,4}');
  } else if (state.sluiceFloor !== 1) {
    errors.push('sluiceFloor must be neutral (1) when inSluice is false (got ' + state.sluiceFloor + ')');
  }
  // Bridge state cannot leak off the bridge.
  if (state.inBridgePost !== true) {
    if (state.bridge_entry_direction !== null) errors.push('bridge_entry_direction must be null off the bridge');
    if (state.bridge_toll_paid !== false) errors.push('bridge_toll_paid must be false off the bridge');
  }
  return { ok: errors.length === 0, errors };
}

// Reset every registered location field to its neutral value. Used by the
// canonical helper, debug warp, and the transition-audit reset — the single
// source of truth for "clear all location context".
function resetLocationState() {
  for (const b of LOCATION_STATE_BINDINGS) b.set(_neutralValueFor(b));
}

// Apply a COMPLETE, already-validated location state (every field present).
function applyLocationState(state) {
  for (const b of LOCATION_STATE_BINDINGS) b.set(state[b.key]);
}

// ─── Registry-driven save serialization (#5) ─────────────────────────────────
// The binding registry — not a second hand-maintained list in save.js — is the
// sole current-schema inventory of persisted location-context fields. Each
// binding's persistence metadata (optional `persist`) says how it flattens into
// the save payload:
//   • default            → save key === binding.key, value stored verbatim
//   • persist.saveKey    → override the flat save key (e.g. houseSourceMapId)
//   • persist.kind:'mapRef' → store a map grid ref as its MAP_REGISTRY id
//   • persist.kind:'pos' (or isPos) → store a {x,y} position (deep-copied)
function _locationSaveKey(b)  { return (b.persist && b.persist.saveKey) || b.key; }
function _locationSaveKind(b) { return (b.persist && b.persist.kind) || (b.isPos ? 'pos' : 'value'); }

// Serialize the complete live location state into the existing FLAT save-payload
// shape (the exact top-level keys saveGame() has always written). Pure read.
function serializeLocationState() {
  const out = {};
  for (const b of LOCATION_STATE_BINDINGS) {
    const kind = _locationSaveKind(b);
    const v = b.get();
    if (kind === 'mapRef')   out[_locationSaveKey(b)] = (typeof mapIdForRef === 'function') ? mapIdForRef(v) : null;
    else if (kind === 'pos') out[_locationSaveKey(b)] = v ? { x: v.x, y: v.y } : { x: 0, y: 0 };
    else                     out[_locationSaveKey(b)] = v;
  }
  return out;
}

// Deserialize a migrated flat payload into a COMPLETE candidate location state
// (every binding key present) WITHOUT mutating any globals. Absent fields take
// their neutral value (current migration behavior permits this: a v3 save always
// writes them all; only genuinely partial/legacy payloads hit the neutral path).
// A 'mapRef' id that is present but non-null and unknown is a hard failure
// (errors non-empty) so restoration can fail safely rather than silently drop
// the player's house-return map. Position fields are validated and deep-copied,
// never retained by reference. Returns { ok, state, errors }.
function deserializeLocationState(data) {
  const errors = [];
  const state = {};
  const src = (data && typeof data === 'object') ? data : {};
  for (const b of LOCATION_STATE_BINDINGS) {
    const kind = _locationSaveKind(b);
    const saveKey = _locationSaveKey(b);
    if (kind === 'mapRef') {
      const id = src[saveKey];
      if (id === undefined || id === null) {
        state[b.key] = null; // neutral: not in a house
      } else {
        const ref = (typeof mapRefForId === 'function') ? mapRefForId(id) : null;
        if (!ref) { errors.push('unknown ' + saveKey + ' "' + id + '"'); state[b.key] = null; }
        else state[b.key] = ref;
      }
    } else if (kind === 'pos') {
      const v = src[saveKey];
      state[b.key] = (v && Number.isFinite(v.x) && Number.isFinite(v.y)) ? { x: v.x, y: v.y } : { x: 0, y: 0 };
    } else {
      state[b.key] = (saveKey in src) ? src[saveKey] : _neutralValueFor(b);
    }
  }
  return { ok: errors.length === 0, state, errors };
}

// ─── Pure placement preflight (#Phase 2, reused by save restore) ──────────────
// Resolves a MAP_REGISTRY id and validates a landing WITHOUT mutating anything:
// finite coordinates, in-bounds, a base-walkable destination tile, and — when a
// facing is supplied — a valid facing. Returns { ok, map, errors:[...] }. The
// "base tile" is WALKABLE[map[row][col]] — the static tile table only, ignoring
// NPCs/furniture/dynamic solids (those are runtime concerns, not placement).
function validatePlacement(spec) {
  const errors = [];
  const mapId = spec && spec.mapId;
  const map = (typeof mapRefForId === 'function') ? mapRefForId(mapId) : null;
  if (!Array.isArray(map) || !Array.isArray(map[0])) {
    return { ok: false, map: null, errors: ['unknown/invalid map id "' + mapId + '"'] };
  }
  const rows = map.length, cols = map[0].length;
  if (!Number.isFinite(spec.x) || !Number.isFinite(spec.y)) {
    errors.push('non-finite coordinates (' + spec.x + ',' + spec.y + ')');
  } else {
    const txf = spec.x / TILE, tyf = spec.y / TILE;
    if (txf < 0 || txf >= cols || tyf < 0 || tyf >= rows) {
      errors.push('coordinates out of bounds for "' + mapId + '" (' + spec.x + ',' + spec.y + ')');
    } else if (!(typeof WALKABLE !== 'undefined' && WALKABLE[map[Math.floor(tyf)][Math.floor(txf)]])) {
      errors.push('destination base tile not walkable on "' + mapId + '" (col ' + Math.floor(txf) + ', row ' + Math.floor(tyf) + ')');
    }
  }
  if (spec.facing !== undefined && !['up', 'down', 'left', 'right'].includes(spec.facing)) {
    errors.push('invalid facing "' + spec.facing + '"');
  }
  return { ok: errors.length === 0, map, errors };
}

// ─── The one canonical location-transition boundary (#5) ─────────────────────
// spec = {
//   mapId:   registered MAP_REGISTRY id (string) — preferred over raw refs;
//   x, y:    exact destination pixel coordinates (the caller computes these,
//            including any preserved coordinate like the current player.y);
//   facing:  'up'|'down'|'left'|'right';
//   state:   OPTIONAL object of non-neutral location-field overrides (unknown
//            keys rejected; every unspecified field defaults to neutral);
//   cooldown: OPTIONAL boolean — if true, set combat.cooldown to ENCOUNTER_COOLDOWN.
// }
// Validates the ENTIRE destination (map resolves, coords finite + in-bounds,
// facing valid, state keys known, invariants hold) BEFORE mutating anything. On
// any failure it warns and returns false, leaving map/position/facing/cooldown
// and every location field completely untouched. On success it resets all
// location state to neutral, applies the overrides, changes the map, places and
// faces the player, and applies cooldown. Returns true.
//
// Story/quest/dialogue/reward/NPC-reroll side effects belong in the wrapper
// functions, NOT here.
function transitionToLocation(spec) {
  if (!spec || typeof spec !== 'object') { console.warn('transitionToLocation: no spec'); return false; }
  // Resolve + validate the whole placement through the ONE shared preflight:
  // map resolves, coordinates finite + in-bounds, destination base tile
  // walkable, and facing valid. An in-bounds but BLOCKED destination fails here
  // (no auto-nudge, no temporary mutate/rollback) — nothing is touched.
  const place = validatePlacement({ mapId: spec.mapId, x: spec.x, y: spec.y, facing: spec.facing });
  if (!place.ok) { console.warn('transitionToLocation: ' + place.errors.join('; ')); return false; }
  // Build the complete proposed state = neutral defaults + explicit overrides.
  const overrides = spec.state || {};
  for (const k of Object.keys(overrides)) {
    if (!LOCATION_STATE_KEY_SET.has(k)) { console.warn('transitionToLocation: unknown state key "' + k + '"'); return false; }
  }
  const proposed = {};
  for (const b of LOCATION_STATE_BINDINGS) proposed[b.key] = (b.key in overrides) ? overrides[b.key] : _neutralValueFor(b);
  const inv = validateLocationState(proposed);
  if (!inv.ok) { console.warn('transitionToLocation: invalid destination state — ' + inv.errors.join('; ')); return false; }

  // ── All validated. Mutate atomically. ──
  applyLocationState(proposed);
  activeMap     = place.map;
  player.x      = spec.x;
  player.y      = spec.y;
  player.facing = spec.facing;
  if (spec.cooldown) combat.cooldown = ENCOUNTER_COOLDOWN;
  return true;
}

if (typeof window !== 'undefined') {
  window.LOCATION_STATE_BINDINGS = LOCATION_STATE_BINDINGS;
  window.snapshotLocationState   = snapshotLocationState;
  window.resetLocationState      = resetLocationState;
  window.applyLocationState      = applyLocationState;
  window.validateLocationState   = validateLocationState;
  window.serializeLocationState  = serializeLocationState;
  window.deserializeLocationState = deserializeLocationState;
  window.validatePlacement       = validatePlacement;
  window.transitionToLocation    = transitionToLocation;
}

// ─── Dungeon transitions ──────────────────────────────────────────────────────
// Overworld ↔ South Ruins Entrance Hall ↔ dungeon floor 1. The entrance hall
// (no encounters — see DUNGEON_ENTRANCE_MAP's header comment) sits between
// the overworld and the monster-infested floors, so entering the ruins no
// longer drops the player straight into combat territory.
function enterDungeon() {
  // Spawn just above the exit tile (row 12, col 7)
  transitionToLocation({ mapId: 'DUNGEON_ENTRANCE_MAP', x: 7.5 * TILE, y: 12.5 * TILE, facing: 'up',
    state: { inDungeonEntrance: true }, cooldown: true });
}

function exitDungeon() {
  // Place player one tile south of the entrance (row 13, col 11)
  transitionToLocation({ mapId: 'MAP', x: 11.5 * TILE, y: 13.5 * TILE, facing: 'down', cooldown: true });
}

// Entrance hall's own stairs down → the real, monster-infested floor 1.
function descendToDungeon1() {
  // Spawn just above the south exit tile (row 12, col 7)
  transitionToLocation({ mapId: 'DUNGEON_MAP', x: 7.5 * TILE, y: 12.5 * TILE, facing: 'up',
    state: { inDungeon: true, dungeonFloor: 1 }, cooldown: true });
}

// Floor 1's existing exit tile (row 13, col 7 of DUNGEON_MAP) now leads back
// up to the entrance hall rather than straight outside.
function ascendToDungeonEntrance() {
  // Spawn just south of the stairs-down tile (row 1, cols 7-8)
  transitionToLocation({ mapId: 'DUNGEON_ENTRANCE_MAP', x: 7.5 * TILE, y: 2.5 * TILE, facing: 'down',
    state: { inDungeonEntrance: true }, cooldown: true });
}

function descendToDungeon2() {
  // Spawn just south of the stairs-up tile (row 2, col 7) on floor 2
  transitionToLocation({ mapId: 'DUNGEON2_MAP', x: 7.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inDungeon: true, dungeonFloor: 2 }, cooldown: true });
}

function ascendToDungeon1() {
  // Spawn just south of the stairs-down tile (row 1, col 8) on floor 1
  transitionToLocation({ mapId: 'DUNGEON_MAP', x: 8.5 * TILE, y: 2.5 * TILE, facing: 'down',
    state: { inDungeon: true, dungeonFloor: 1 }, cooldown: true });
}

function descendToDungeon3() {
  transitionToLocation({ mapId: 'DUNGEON3_MAP', x: 7.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inDungeon: true, dungeonFloor: 3 }, cooldown: true }); // col 7 — one south of stairs-up (row 1, col 8)
}

function ascendToDungeon2() {
  transitionToLocation({ mapId: 'DUNGEON2_MAP', x: 7.5 * TILE, y: 12.5 * TILE, facing: 'up',
    state: { inDungeon: true, dungeonFloor: 2 }, cooldown: true }); // col 7 — one north of stairs-down (row 13, col 7)
}

function descendToDungeon4() {
  transitionToLocation({ mapId: 'DUNGEON4_MAP', x: 7.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inDungeon: true, dungeonFloor: 4 }, cooldown: true });
}

function ascendToDungeon3() {
  // stairs down are in BR; arriving from below, one tile above stairs at row 13
  transitionToLocation({ mapId: 'DUNGEON3_BR_MAP', x: 7.5 * TILE, y: 12.5 * TILE, facing: 'up',
    state: { inDungeon: true, dungeonFloor: 3 }, cooldown: true });
}

function descendToDungeon5() {
  transitionToLocation({ mapId: 'DUNGEON5_MAP', x: 7.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inDungeon: true, dungeonFloor: 5 }, cooldown: true });
}

function ascendToDungeon4() {
  // one north of stair tile at row 12, Mulholland defeated
  transitionToLocation({ mapId: 'DUNGEON4_MAP', x: 7.5 * TILE, y: 10.5 * TILE, facing: 'up',
    state: { inDungeon: true, dungeonFloor: 4 }, cooldown: true });
}

function descendToDungeon6() {
  transitionToLocation({ mapId: 'DUNGEON6_MAP', x: 7.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inDungeon: true, dungeonFloor: 6 }, cooldown: true });
}

function ascendToDungeon5() {
  transitionToLocation({ mapId: 'DUNGEON5_MAP', x: 7.5 * TILE, y: 11.5 * TILE, facing: 'up',
    state: { inDungeon: true, dungeonFloor: 5 }, cooldown: true });
}

function descendToDungeon7() {
  transitionToLocation({ mapId: 'DUNGEON7_MAP', x: 7.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inDungeon: true, dungeonFloor: 7 }, cooldown: true });
}

function ascendToDungeon6() {
  transitionToLocation({ mapId: 'DUNGEON6_MAP', x: 7.5 * TILE, y: 12.5 * TILE, facing: 'up',
    state: { inDungeon: true, dungeonFloor: 6 }, cooldown: true });
}

function descendToDungeon8() {
  transitionToLocation({ mapId: 'DUNGEON8_MAP', x: 7.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inDungeon: true, dungeonFloor: 8 }, cooldown: true });
}

function ascendToDungeon7() {
  transitionToLocation({ mapId: 'DUNGEON7_MAP', x: 7.5 * TILE, y: 12.5 * TILE, facing: 'up',
    state: { inDungeon: true, dungeonFloor: 7 }, cooldown: true });
}

function enterDungeon8West() {
  transitionToLocation({ mapId: 'DUNGEON8_WEST_MAP', x: 13.5 * TILE, y: 7.5 * TILE, facing: 'left',
    state: { inDungeon: true, dungeonFloor: 9 }, cooldown: true });
}

function exitDungeon8West() {
  transitionToLocation({ mapId: 'DUNGEON8_MAP', x: 1.5 * TILE, y: 7.5 * TILE, facing: 'right',
    state: { inDungeon: true, dungeonFloor: 8 }, cooldown: true });
}

function enterDungeon8East() {
  transitionToLocation({ mapId: 'DUNGEON8_EAST_MAP', x: 1.5 * TILE, y: 7.5 * TILE, facing: 'right',
    state: { inDungeon: true, dungeonFloor: 10 }, cooldown: true });
}

function exitDungeon8East() {
  transitionToLocation({ mapId: 'DUNGEON8_MAP', x: 13.5 * TILE, y: 7.5 * TILE, facing: 'left',
    state: { inDungeon: true, dungeonFloor: 8 }, cooldown: true });
}

// ─── Floor 3 — 3×3 sub-room navigation ───────────────────────────────────────
// All functions keep dungeonFloor = 3. Spawn positions place the player just
// inside the destination room, one tile away from the passage they came through.
// TC ↔ TL  (east wall of TL / west wall of TC)
// Floor-3 room-to-room move: same floor (inDungeon, dungeonFloor 3), new sub-room
// map + landing. Pure geometry, no story side effects.
function d3Move(mapId, x, y, facing) {
  transitionToLocation({ mapId, x, y, facing, state: { inDungeon: true, dungeonFloor: 3 }, cooldown: true });
}
function d3_TC_to_TL() { d3Move('DUNGEON3_TL_MAP', 14.5 * TILE, 7.5 * TILE, 'left'); }
function d3_TL_to_TC() { d3Move('DUNGEON3_MAP', 1.5 * TILE, 7.5 * TILE, 'right'); }
// TC ↔ TR  (west wall of TR / east wall of TC)
function d3_TC_to_TR() { d3Move('DUNGEON3_TR_MAP', 1.5 * TILE, 7.5 * TILE, 'right'); }
function d3_TR_to_TC() { d3Move('DUNGEON3_MAP', 14.5 * TILE, 7.5 * TILE, 'left'); }
// TC ↔ MC  (south wall of TC / north wall of MC)
function d3_TC_to_MC() { d3Move('DUNGEON3_MC_MAP', 7.5 * TILE, 1.5 * TILE, 'down'); }
function d3_MC_to_TC() { d3Move('DUNGEON3_MAP', 7.5 * TILE, 13.5 * TILE, 'up'); }
// TL ↔ ML  (south wall of TL / north wall of ML)
function d3_TL_to_ML() { d3Move('DUNGEON3_ML_MAP', 7.5 * TILE, 1.5 * TILE, 'down'); }
function d3_ML_to_TL() { d3Move('DUNGEON3_TL_MAP', 7.5 * TILE, 13.5 * TILE, 'up'); }
// TR ↔ MR  (south wall of TR / north wall of MR)
function d3_TR_to_MR() { d3Move('DUNGEON3_MR_MAP', 7.5 * TILE, 1.5 * TILE, 'down'); }
function d3_MR_to_TR() { d3Move('DUNGEON3_TR_MAP', 7.5 * TILE, 13.5 * TILE, 'up'); }
// ML ↔ MC  (east wall of ML / west wall of MC)
function d3_ML_to_MC() { d3Move('DUNGEON3_MC_MAP', 1.5 * TILE, 7.5 * TILE, 'right'); }
function d3_MC_to_ML() { d3Move('DUNGEON3_ML_MAP', 14.5 * TILE, 7.5 * TILE, 'left'); }
// MC ↔ MR  (east wall of MC / west wall of MR)
function d3_MC_to_MR() { d3Move('DUNGEON3_MR_MAP', 1.5 * TILE, 7.5 * TILE, 'right'); }
function d3_MR_to_MC() { d3Move('DUNGEON3_MC_MAP', 14.5 * TILE, 7.5 * TILE, 'left'); }
// ML ↔ BL  (south wall of ML / north wall of BL)
function d3_ML_to_BL() { d3Move('DUNGEON3_BL_MAP', 7.5 * TILE, 1.5 * TILE, 'down'); }
function d3_BL_to_ML() { d3Move('DUNGEON3_ML_MAP', 7.5 * TILE, 13.5 * TILE, 'up'); }
// MC ↔ BC  (south wall of MC / north wall of BC)
function d3_MC_to_BC() { d3Move('DUNGEON3_BC_MAP', 7.5 * TILE, 1.5 * TILE, 'down'); }
function d3_BC_to_MC() { d3Move('DUNGEON3_MC_MAP', 7.5 * TILE, 13.5 * TILE, 'up'); }
// MR ↔ BR  (south wall of MR / north wall of BR)
function d3_MR_to_BR() { d3Move('DUNGEON3_BR_MAP', 7.5 * TILE, 1.5 * TILE, 'down'); }
function d3_BR_to_MR() { d3Move('DUNGEON3_MR_MAP', 7.5 * TILE, 13.5 * TILE, 'up'); }
// BL ↔ BC  (east wall of BL / west wall of BC)
function d3_BL_to_BC() { d3Move('DUNGEON3_BC_MAP', 1.5 * TILE, 7.5 * TILE, 'right'); }
function d3_BC_to_BL() { d3Move('DUNGEON3_BL_MAP', 14.5 * TILE, 7.5 * TILE, 'left'); }
// BC ↔ BR  (east wall of BC / west wall of BR)
function d3_BC_to_BR() { d3Move('DUNGEON3_BR_MAP', 1.5 * TILE, 7.5 * TILE, 'right'); }
function d3_BR_to_BC() { d3Move('DUNGEON3_BC_MAP', 14.5 * TILE, 7.5 * TILE, 'left'); }

// ─── Lorra's Farmhouse ────────────────────────────────────────────────────────
function enterLorraHouse() {
  transitionToLocation({ mapId: 'LORRA_HOUSE_MAP', x: 7.5 * TILE, y: 11.5 * TILE, facing: 'up',
    state: { inLorraHouse: true }, cooldown: true }); // col 7 centre aisle, row 11 just inside door
}

function exitLorraHouse() {
  transitionToLocation({ mapId: 'MAP2', x: 2.5 * TILE, y: 13.5 * TILE, facing: 'down', cooldown: true }); // one step south of HOUSE_DOOR
}

function enterMarenPost() {
  transitionToLocation({ mapId: 'MAREN_POST_MAP', x: 7.5 * TILE, y: 10.5 * TILE, facing: 'up',
    state: { inMarenPost: true }, cooldown: true }); // col 7 centre aisle, just inside the post door
}

function exitMarenPost() {
  transitionToLocation({ mapId: 'MAP', x: 13.5 * TILE, y: 6.5 * TILE, facing: 'down', cooldown: true }); // back on GUARD_POST tile, one south
}

// ─── Drenwick Guard Post (MAP3_N2 row 12 col 11) ─────────────────────────────
function enterDrenwrickPost() {
  transitionToLocation({ mapId: 'DRENWICK_POST_MAP', x: 7.5 * TILE, y: 10.5 * TILE, facing: 'up',
    state: { inDrenwrickPost: true }, cooldown: true }); // col 7 centre aisle, just inside the post door
}

function exitDrenwrickPost() {
  transitionToLocation({ mapId: 'MAP3_N2', x: 11.5 * TILE, y: 13.5 * TILE, facing: 'down', cooldown: true }); // GUARD_POST tile, one south
}

// ─── Imperial Bridge Checkpoint (MAP3_N2 row 5 col 12) ───────────────────────
function enterBridgePostFromSouth() {
  transitionToLocation({ mapId: 'BRIDGE_CROSSING_MAP', x: 7.5 * TILE, y: 13.5 * TILE, facing: 'up',
    state: { inBridgePost: true, bridge_entry_direction: 'south', bridge_toll_paid: false }, cooldown: true }); // south bank entry
  // Phase 1 pilot: fresh visit -- both guards back at their blocking
  // posts, stationary, original facing; any prior route state cleared.
  resetBridgeGuards();
}

function enterBridgePostFromNorth() {
  transitionToLocation({ mapId: 'BRIDGE_CROSSING_MAP', x: 7.5 * TILE, y: 1.5 * TILE, facing: 'down',
    state: { inBridgePost: true, bridge_entry_direction: 'north', bridge_toll_paid: false }, cooldown: true }); // north bank entry
  // Phase 1 pilot: fresh visit -- both guards back at their blocking
  // posts, stationary, original facing; any prior route state cleared.
  resetBridgeGuards();
}

function exitBridgeSouth() {
  transitionToLocation({ mapId: 'MAP3_N2', x: 12.5 * TILE, y: 6.5 * TILE, facing: 'down', cooldown: true }); // approach path, one south of gate
  resetBridgeGuards(); // clear route state + restore blocking posts for the next visit
}

function exitBridgeNorth() {
  transitionToLocation({ mapId: 'MAP3_N2', x: 12.5 * TILE, y: 4.5 * TILE, facing: 'up', cooldown: true }); // north bank, one north of gate
  resetBridgeGuards(); // clear route state + restore blocking posts for the next visit
  // Record crossing north onto the basin road ahead of any assignment, so
  // the Calwick supervisor can note it next time the player reports in (see
  // interactSupervisor(), interactions.js). Monotonic — set once and left
  // set; the one-time admonishment is gated separately by north_bridge_scolded.
  if (!reservoir_quest_started && !north_bridge_crossed_early) {
    north_bridge_crossed_early = true;
    syncQuestFlagsToWindow();
  }
}

// ─── Smugglers' Fort (MAP3_N1 row 9 col 13) ──────────────────────────────────
function enterSmugglerFort() {
  transitionToLocation({ mapId: 'SMUGGLER_FORT_MAP', x: 7.5 * TILE, y: 10.5 * TILE, facing: 'up',
    state: { inSmugglerFort: true }, cooldown: true }); // col 7 centre aisle, just inside door
}

function exitSmugglerFort() {
  transitionToLocation({ mapId: 'MAP3_N1', x: 14.5 * TILE, y: 9.5 * TILE, facing: 'down', cooldown: true }); // east of the fort tile
}

// ─── Mirethyst's Vault (MAP3_N1 row 3 col 1) ─────────────────────────────────
function enterMireVault() {
  transitionToLocation({ mapId: 'MIRE_VAULT_MAP', x: 7.5 * TILE, y: 12.5 * TILE, facing: 'up',
    state: { inMireVault: true }, cooldown: true }); // entry hall, just above MIRE_EXIT
}

function exitMireVault() {
  transitionToLocation({ mapId: 'MAP3_N1', x: 1.5 * TILE, y: 4.5 * TILE, facing: 'down', cooldown: true }); // beside MIRE_ENTRANCE, one south
}

function enterTakomo() {
  transitionToLocation({ mapId: 'TAKOMO_MAP', x: 2.5 * TILE, y: 7.5 * TILE, facing: 'right',
    state: { inTakomo: true }, cooldown: true }); // just inside the passage mouth, aligned with the exit tile
}

function exitTakomo() {
  transitionToLocation({ mapId: 'DRENWICK_WATERFRONT_MAP', x: 1.5 * TILE, y: 3.5 * TILE, facing: 'right', cooldown: true }); // one east of the gate on the quay
}

// ─── Fen Brewery (MAP3_N1 row 4 col 13) ──────────────────────────────────────
function enterFenBrewery() {
  transitionToLocation({ mapId: 'FEN_BREWERY_MAP', x: 3.5 * TILE, y: 12.5 * TILE, facing: 'up',
    state: { inFenBrewery: true }, cooldown: true }); // just inside the south door, one north of INTERIOR_EXIT
}

function exitFenBrewery() {
  // Suspend Tobb's patrol cleanly and return him to his authored home (the
  // per-frame ensureAutoPatrols() also enforces this, but do it explicitly on
  // exit, mirroring resetBridgeGuards() at the bridge exits).
  if (typeof resetAllPatrols === 'function') resetAllPatrols();
  transitionToLocation({ mapId: 'MAP3_N1', x: 13.5 * TILE, y: 5.5 * TILE, facing: 'down', cooldown: true }); // just south of the FARM_HOUSE tile
}

// ─── Falls Hamlet Interior ────────────────────────────────────────────────────
// One shared 16×15 map with three side-by-side rooms (A/B/C).
// Entry positions: room A → col 2 row 12, room B → col 7 row 12, room C → col 12 row 12.
// Exit: player's x when stepping on INTERIOR_EXIT determines which house to return to.
function enterHamletInterior(room) {
  // Entry column depends on which house (A/B/C) was entered; all land row 12.
  const x = (room === 'A' ? 2.5 : room === 'B' ? 7.5 : 12.5) * TILE;
  transitionToLocation({ mapId: 'HAMLET_INTERIOR_MAP', x, y: 12.5 * TILE, facing: 'up',
    state: { inHamletInterior: true }, cooldown: true });
}

function exitHamletInterior() {
  // Return position depends on which room the exit tile was in — read the
  // CURRENT player.x before the transition moves the player.
  let rx, ry;
  if (player.x < 5 * TILE)        { rx = 1.5 * TILE; ry = 11.5 * TILE; } // Room A exit (col 2)
  else if (player.x < 11 * TILE)  { rx = 2.5 * TILE; ry = 12.5 * TILE; } // Room B exit (col 7)
  else                            { rx = 1.5 * TILE; ry = 13.5 * TILE; } // Room C exit (col 12)
  transitionToLocation({ mapId: 'MAP3_N1', x: rx, y: ry, facing: 'down', cooldown: true });
}

// ─── Town transitions ─────────────────────────────────────────────────────────
function enterMap2() {
  // player.y preserved — the crossing row stays the same.
  transitionToLocation({ mapId: 'MAP2', x: 1.5 * TILE, y: player.y, facing: 'right' });
}

function exitMap2() {
  transitionToLocation({ mapId: 'MAP', x: 14.5 * TILE, y: player.y, facing: 'left' });
}

function enterMap4() {
  transitionToLocation({ mapId: 'MAP4', x: 1.5 * TILE, y: player.y, facing: 'right', cooldown: true });
}

function exitMap4() {
  transitionToLocation({ mapId: 'MAP3', x: 14.5 * TILE, y: player.y, facing: 'left', cooldown: true });
}

function enterMap5() {
  transitionToLocation({ mapId: 'MAP5', x: 1.5 * TILE, y: player.y, facing: 'right', cooldown: true });
}

function exitMap5() {
  transitionToLocation({ mapId: 'MAP4', x: 14.5 * TILE, y: player.y, facing: 'left', cooldown: true });
}

// MAP3 <-> MAP3_N1 (Northern Fen) was a preserved-x point crossing
// (enterMap3N1/exitMap3N1 on FEN_N_EXIT/FEN_N_ENTRANCE). It is now a structural
// EDGE_TRANSITIONS seam (MAP3.north <-> MAP3_N1.south, the single col-8 PATH,
// sourceRange [8,8]); those two wrappers and their point tiles were retired.

function enterMap3N2() {
  transitionToLocation({ mapId: 'MAP3_N2', x: player.x, y: 13.5 * TILE, facing: 'up', cooldown: true });
}

function exitMap3N2() {
  transitionToLocation({ mapId: 'MAP3_N1', x: player.x, y: 1.5 * TILE, facing: 'down', cooldown: true });
}

// ─── The North Basin — south approach (skeleton) ─────────────────────────────
// MAP3_N2's NORTH_BASIN_EXIT (row 0 col 12) <-> NORTH_BASIN_S_MAP's
// NORTH_BASIN_ENTRANCE (row 14 col 12). Same preserved-x, fixed-y pattern as
// every other north/south overworld point crossing (enterMapN1/exitMapN1, etc).
function enterNorthBasinS() {
  transitionToLocation({ mapId: 'NORTH_BASIN_S_MAP', x: player.x, y: 13.5 * TILE, facing: 'up', cooldown: true }); // player.x preserved (col 12)
}

function exitNorthBasinS() {
  transitionToLocation({ mapId: 'MAP3_N2', x: player.x, y: 1.5 * TILE, facing: 'down', cooldown: true }); // player.x preserved (col 12)
}

// North Basin south approach <-> centre reservoir, and south approach <->
// Silt Flats, USED TO be point-tile transitions here (enterNorthBasinC/
// exitNorthBasinC/enterNorthBasinSW/exitNorthBasinSW). Both links have been
// converted to the generic, broad-edge EDGE_TRANSITIONS system further down
// this file, so those four functions and their dedicated tile IDs no longer
// exist — see the "Edge-based map transitions" section below.

// Hidden meadow <-> Verdant Vale (MAP). Entered by stepping on the
// MEADOW_HIDDEN_ENTRANCE tile in the vale's top-left tree nook (MAP row 1
// col 1 — drawn as plain grass, deliberately secret); exit is the gap in the
// meadow's south tree border. The exit lands one tile BELOW the hidden tile
// (row 2), not on it, so leaving the meadow doesn't immediately re-enter it.
function enterMeadow() {
  transitionToLocation({ mapId: 'MEADOW_MAP', x: 7.5 * TILE, y: 13.5 * TILE, facing: 'up', cooldown: true }); // just inside the south gap
}

function exitMeadow() {
  transitionToLocation({ mapId: 'MAP', x: 1.5 * TILE, y: 2.5 * TILE, facing: 'down', cooldown: true }); // one south of the hidden entrance
}

// Silt Flats <-> West Shore (north-south crossing).
// SUPERSEDED: this link is now an OPEN EDGE via the generic EDGE_TRANSITIONS
// system below (NORTH_BASIN_SW_MAP.north / NORTH_BASIN_W_MAP.south), the same
// way the C/SW point-tiles were converted. The NORTH_BASIN_W_EXIT/ENTRANCE
// tiles (90/91) are no longer placed on any map, so these two functions and
// their movement.js dispatch are now unreachable; they're left in place
// (not torn out) to keep this conservative pass off the movement/transition
// machinery. Safe to delete whenever tiles 90/91 are formally retired.
function enterNorthBasinW() {
  transitionToLocation({ mapId: 'NORTH_BASIN_W_MAP', x: player.x, y: 13.5 * TILE, facing: 'up', cooldown: true }); // player.x preserved (col 4)
}

function exitNorthBasinW() {
  transitionToLocation({ mapId: 'NORTH_BASIN_SW_MAP', x: player.x, y: 1.5 * TILE, facing: 'down', cooldown: true }); // player.x preserved (col 4)
}

function enterMapN1() {
  transitionToLocation({ mapId: 'MAP_N1', x: player.x, y: 13.5 * TILE, facing: 'up', cooldown: true }); // player.x preserved, aligns with NORTH_EXIT
}

function exitMapN1() {
  transitionToLocation({ mapId: 'MAP', x: player.x, y: 1.5 * TILE, facing: 'down', cooldown: true }); // player.x preserved
}

function enterMapN2() {
  transitionToLocation({ mapId: 'MAP_N2', x: player.x, y: 13.5 * TILE, facing: 'up', cooldown: true }); // player.x preserved (col 7)
}

function exitMapN2() {
  transitionToLocation({ mapId: 'MAP_N1', x: player.x, y: 1.5 * TILE, facing: 'down', cooldown: true }); // player.x preserved
}

// ─── Town entry registry ──────────────────────────────────────────────────────
// Keyed by town id, then by entry direction ('south', 'east', 'north', 'west').
// Add new towns here; enterTownAt() is generic and does not reference any town by name.
const TOWN_ENTRY_POINTS = {
  calwick: {
    south: { map: TOWN_MAP,      x: 7.5 * TILE, y: 13.5 * TILE, facing: 'up',    townBuilding: null   },
    east:  { map: EAST_TOWN_MAP, x: 1.5 * TILE, y:  9.5 * TILE, facing: 'right', townBuilding: 'east' },
    west:  { map: EAST_TOWN_MAP, x: 11.5 * TILE, y:  9.5 * TILE, facing: 'left', townBuilding: 'east' },
  },
  drenwick: {
    south: { map: DRENWICK_CIVIC_MAP,  x:  7.5 * TILE, y: 12.5 * TILE, facing: 'up',   townBuilding: null },
    west:  { map: DRENWICK_MARKET_MAP, x: 12.5 * TILE, y:  8.5 * TILE, facing: 'left', townBuilding: null },
    // The world-map gate (MAP3_N2 row 6 col 8) has open, walkable ground on
    // both sides (confirmed in TRANSITION_AUDIT.md), so an eastward approach
    // is physically real, not just a hypothetical. Reuses the exact spot/
    // facing the internal Civic->East-Outskirts transition already lands
    // players at (movement.js's DRENWICK_CIVIC_MAP MAP2_EXIT handler), so
    // arriving here feels identical to any other "just arrived at East
    // Outskirts" moment rather than introducing a new, unvalidated spot.
    east:  { map: DRENWICK_EAST_OUTSKIRTS_MAP, x: 1.5 * TILE, y: 4.5 * TILE, facing: 'right', townBuilding: null },
  },
};

function enterTownAt(townId, entryPoint) {
  const town = TOWN_ENTRY_POINTS[townId];
  if (!town) {
    console.warn('Unknown townId:', townId);
    return;
  }
  const entry = town[entryPoint] || town.south || Object.values(town)[0];
  if (!entry) {
    console.warn('No town entry configured for:', townId, entryPoint);
    return;
  }
  transitionToLocation({ mapId: mapIdForRef(entry.map), x: entry.x, y: entry.y, facing: entry.facing,
    state: { inTown: true, currentTownId: townId, townBuilding: entry.townBuilding || null }, cooldown: true });
  travellerPresent = Math.random() < 1 / 3;
}

// Backward-compatible Calwick default entry.
function enterTown() {
  enterTownAt('calwick', 'south');
}

// Returns the town entry direction that corresponds to the player's movement facing.
// Relies on player.facing reflecting the direction they moved onto the entrance tile.
function entryPointFromFacing(facing) {
  const directionMap = { up: 'south', right: 'east', down: 'north', left: 'west' };
  return directionMap[facing] || 'south';
}

function moveToDrenwichDistrict(map, x, y, facing) {
  // Intra-Drenwick district move: stays in town; townBuilding carried forward
  // (null on a district) — enumerated deliberately, not a blanket preserve-all.
  transitionToLocation({ mapId: mapIdForRef(map), x: x * TILE, y: y * TILE, facing,
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: townBuilding }, cooldown: true });
}

function exitTown() {
  // Every branch leaves town entirely (all location state → neutral); compute
  // the landing map/spot per branch, then transition once.
  if (currentTownId === 'drenwick') {
    if (activeMap === DRENWICK_MARKET_MAP) {
      // Exiting east from Market — land just east of the Drenwick gate on MAP3_N2
      transitionToLocation({ mapId: 'MAP3_N2', x: 9.5 * TILE, y: 6.5 * TILE, facing: 'right', cooldown: true });
    } else if (activeMap === DRENWICK_EAST_OUTSKIRTS_MAP) {
      if (player.facing === 'right') {
        // East exit (col 15 row 7) — land one tile east of the town gate
        transitionToLocation({ mapId: 'MAP3_N2', x: 9.5 * TILE, y: 6.5 * TILE, facing: 'right', cooldown: true });
      } else {
        // South exit (row 14 col 7) — land south-east of town
        transitionToLocation({ mapId: 'MAP3_N2', x: 9.5 * TILE, y: 7.5 * TILE, facing: 'down', cooldown: true });
      }
    } else {
      // Default Drenwick exit — Civic south to MAP3_N2
      transitionToLocation({ mapId: 'MAP3_N2', x: 8.5 * TILE, y: 7.5 * TILE, facing: 'down', cooldown: true });
    }
    return;
  }

  // Calwick (and any future non-Drenwick towns)
  transitionToLocation({ mapId: 'MAP', x: 5.5 * TILE, y: 2.5 * TILE, facing: 'down', cooldown: true });
}

function enterBuilding(building) {
  // Entering a building keeps the player in town (inTown + currentTownId carried
  // forward); only townBuilding + the interior map/landing change. No cooldown.
  let mapId, y;
  const x = 7.5 * TILE;
  // Almost every interior has its exit on the BOTTOM wall, so the player lands
  // near the bottom facing 'up' (into the room). The post office is the
  // exception: its market door is approached from the north, so its exit is on
  // the TOP wall and the player lands near the top facing 'down'.
  let facing = 'up';
  if (currentTownId === 'drenwick') {
    // Drenwick uses its own interior maps
    if (building === 'inn')                        { mapId = 'DRENWICK_INN_MAP';             y = 12.5 * TILE; }
    else if (building === 'office')                { mapId = 'DRENWICK_OFFICE_MAP';          y = 10.5 * TILE; }
    else if (building === 'harbormaster')          { mapId = 'DRENWICK_HARBORMASTER_MAP';    y = 11.5 * TILE; }
    else if (building === 'wash_house')            { mapId = 'DRENWICK_WASH_HOUSE_MAP';      y = 11.5 * TILE; }
    else if (building === 'provision_store')       { mapId = 'DRENWICK_PROVISION_STORE_MAP'; y = 11.5 * TILE; }
    else if (building === 'guild_hall')            { mapId = 'DRENWICK_GUILD_HALL_MAP';      y = 11.5 * TILE; }
    else if (building === 'post_office')           { mapId = 'DRENWICK_POST_OFFICE_MAP';     y =  2.5 * TILE; facing = 'down'; }
    else if (building === 'tavern')                { mapId = 'DRENWICK_TAVERN_MAP';          y = 12.5 * TILE; }
    else if (building === 'school')                { mapId = 'DRENWICK_SCHOOL_GROUND_MAP';   y = 11.5 * TILE; }
    else if (building.startsWith('drenwick_apt_')) { mapId = 'APARTMENT_CORRIDOR_MAP';       y =  8.5 * TILE; } // 6 corridors reuse this map; townBuilding distinguishes
    else return; // unknown Drenwick building — no-op, as before (nothing was set)
  } else {
    // Calwick interiors
    if (building === 'inn')         { mapId = 'INN_MAP';    y = 12.5 * TILE; }
    else if (building === 'school') { mapId = 'SCHOOL_MAP'; y = 11.5 * TILE; }
    else if (building === 'apt')    { mapId = 'APARTMENT_CORRIDOR_MAP'; y = 8.5 * TILE; }
    else                            { mapId = 'OFFICE_MAP'; y =  9.5 * TILE; }
  }
  transitionToLocation({ mapId, x, y, facing,
    state: { inTown: true, currentTownId: currentTownId, townBuilding: building } });
}

function enterHouse(houseId) {
  // Compute the return context from the CURRENT location (which map/building the
  // player came from, and where to land on exit) BEFORE the transition. These
  // are passed as explicit state so the helper carries them into the house.
  const _door = HOUSE_DOORS.find((d) => d.houseId === houseId);
  const returnPos = _door
    ? { x: (_door.col + 0.5) * TILE, y: (_door.row + 1.5) * TILE }
    : { x: player.x, y: player.y + TILE };
  const isApt = houseId.startsWith('apt_') || houseId.startsWith('drenwick_apt_');
  transitionToLocation({
    mapId: isApt ? 'SMALL_APARTMENT_MAP' : 'HOUSE_INTERIOR_MAP',
    x: 7.5 * TILE, y: (isApt ? 8.5 : 9.5) * TILE, facing: 'up',
    state: {
      inTown: true, currentTownId: currentTownId, townBuilding: 'house', currentHouseId: houseId,
      houseSourceMap: activeMap, houseSourceBuilding: townBuilding, houseReturnPos: returnPos,
    },
  });
}

function exitBuilding() {
  const prev = townBuilding;

  // House exits (both towns are identical): restore to the map/position the
  // player entered from. The return context (houseSourceMap/houseSourceBuilding/
  // houseReturnPos) is read here — before the helper resets those fields.
  if (prev === 'house') {
    transitionToLocation({
      mapId: mapIdForRef(houseSourceMap), x: houseReturnPos.x, y: houseReturnPos.y, facing: 'down',
      state: { inTown: true, currentTownId: currentTownId, townBuilding: houseSourceBuilding },
    });
    return;
  }

  // All remaining exits stay in town (inTown + currentTownId carried forward);
  // only townBuilding + the map/landing change. Compute per branch, then move.
  if (currentTownId === 'drenwick') {
    let mapId, x, y;
    if (prev.startsWith('drenwick_apt_')) {
      // East outskirts apartment corridor exits — return to the exterior door position
      const aptExits = {
        'drenwick_apt_a1': { x: 2, y:  4 }, 'drenwick_apt_a2': { x: 4, y:  4 },
        'drenwick_apt_b1': { x: 2, y:  8 }, 'drenwick_apt_b2': { x: 4, y:  8 },
        'drenwick_apt_c1': { x: 2, y: 12 }, 'drenwick_apt_c2': { x: 4, y: 12 },
      };
      const pos = aptExits[prev] || { x: 2, y: 4 };
      mapId = 'DRENWICK_EAST_OUTSKIRTS_MAP'; x = (pos.x + 0.5) * TILE; y = (pos.y + 0.5) * TILE;
    } else if (prev === 'harbormaster' || prev === 'wash_house' || prev === 'provision_store') {
      // Canal/Docks buildings exit to dock road (row 7), one south of their door (row 6)
      mapId = 'DRENWICK_CANAL_DOCKS_MAP'; y = 7.5 * TILE;
      x = (prev === 'harbormaster' ? 2.5 : prev === 'wash_house' ? 7.5 : 11.5) * TILE;
    } else if (prev === 'tavern') {
      mapId = 'DRENWICK_WATERFRONT_MAP'; x = 3.5 * TILE; y = 10.5 * TILE;   // one south of INN_DOOR row 9 col 3
    } else if (prev === 'infirmary') {
      mapId = 'DRENWICK_WATERFRONT_MAP'; x = 10.5 * TILE; y = 10.5 * TILE;  // one south of OFFICE_DOOR row 9 col 10
    } else if (prev === 'school') {
      mapId = 'DRENWICK_WEST_RESIDENTIAL_MAP'; x = 3.5 * TILE; y = 4.5 * TILE; // one south of SCHOOL_DOOR row 3 col 3
    } else if (prev === 'guild_hall') {
      mapId = 'DRENWICK_MARKET_MAP'; x = 5.5 * TILE; y = 3.5 * TILE;       // one south of door row 2 col 5
    } else if (prev === 'post_office') {
      mapId = 'DRENWICK_MARKET_MAP'; x = 14.5 * TILE; y = 9.5 * TILE;      // east lane, one north of the office door (row 10 col 14)
    } else {
      // Civic buildings (inn, office) return to Civic map at the correct door position
      mapId = 'DRENWICK_CIVIC_MAP'; x = (prev === 'inn' ? 3.5 : 11.5) * TILE; y = 4.5 * TILE;
    }
    transitionToLocation({ mapId, x, y, facing: 'down',
      state: { inTown: true, currentTownId: currentTownId, townBuilding: null } });
    return;
  }

  // Calwick non-house exits
  let mapId, x, y, tb;
  if (prev === 'school')   { tb = 'west'; mapId = 'WEST_TOWN_MAP'; x = 6.5 * TILE; y = 4.5 * TILE; } // school courtyard
  else if (prev === 'apt') { tb = 'east'; mapId = 'EAST_TOWN_MAP'; x = 5.5 * TILE; y = 9.5 * TILE; } // south street
  else                     { tb = null;   mapId = 'TOWN_MAP'; x = (prev === 'inn' ? 3.5 : 12.5) * TILE; y = 5.5 * TILE; } // main street south of door
  transitionToLocation({ mapId, x, y, facing: 'down',
    state: { inTown: true, currentTownId: currentTownId, townBuilding: tb } });
}

function enterEastTown() {
  // Intra-Calwick district: stays in town, player.y preserved (aligns with EAST_EXIT rows).
  transitionToLocation({ mapId: 'EAST_TOWN_MAP', x: 1.5 * TILE, y: player.y, facing: 'right',
    state: { inTown: true, currentTownId: currentTownId, townBuilding: 'east' } });
}

function exitEastTown() {
  transitionToLocation({ mapId: 'TOWN_MAP', x: 14.5 * TILE, y: player.y, facing: 'left',
    state: { inTown: true, currentTownId: currentTownId, townBuilding: null } }); // player.y preserved
}

function exitEastTownToWorld() {
  // Leaves town entirely → all location state neutral.
  transitionToLocation({ mapId: 'MAP', x: 7.5 * TILE, y: 1.5 * TILE, facing: 'right', cooldown: true }); // two tiles east of the town entrance
}

function enterWestTown() {
  // Intra-Calwick district: stays in town, player.y preserved (aligns with WEST_EXIT rows).
  transitionToLocation({ mapId: 'WEST_TOWN_MAP', x: 13.5 * TILE, y: player.y, facing: 'left',
    state: { inTown: true, currentTownId: currentTownId, townBuilding: 'west' } });
}

function exitWestTown() {
  transitionToLocation({ mapId: 'TOWN_MAP', x: 1.5 * TILE, y: player.y, facing: 'right',
    state: { inTown: true, currentTownId: currentTownId, townBuilding: null } }); // player.y preserved
}

function enterSluice() {
  transitionToLocation({ mapId: 'SLUICE_MAP', x: 7.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inSluice: true, sluiceFloor: 1 }, cooldown: true }); // top of access shaft, north corridor
}

function exitSluice() {
  // Exits back into east Calwick — restore the town context the sluice cleared.
  transitionToLocation({ mapId: 'EAST_TOWN_MAP', x: 12.5 * TILE, y: 5.5 * TILE, facing: 'down',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'east' }, cooldown: true }); // just south of the hatch
}

function descendToSluice2() {
  transitionToLocation({ mapId: 'SLUICE_LEVEL2_MAP', x: 8.5 * TILE, y: 6.5 * TILE, facing: 'down',
    state: { inSluice: true, sluiceFloor: 2 }, cooldown: true }); // one south of ladder-up tile
}

function ascendToSluice1() {
  transitionToLocation({ mapId: 'SLUICE_MAP', x: 8.5 * TILE, y: 11.5 * TILE, facing: 'up',
    state: { inSluice: true, sluiceFloor: 1 }, cooldown: true }); // inspection nook, south corridor
}

function descendToSluice3() {
  transitionToLocation({ mapId: 'SLUICE_LEVEL3_MAP', x: 7.5 * TILE, y: 4.5 * TILE, facing: 'down',
    state: { inSluice: true, sluiceFloor: 3 }, cooldown: true }); // entry shaft, one south of stairs-up
}

function ascendToSluice2() {
  transitionToLocation({ mapId: 'SLUICE_LEVEL2_MAP', x: 12.5 * TILE, y: 9.5 * TILE, facing: 'up',
    state: { inSluice: true, sluiceFloor: 2 }, cooldown: true }); // secret corridor above stairs
}

// The Deep Works sealed room (SLUICE_SECRET_MAP) — reached by stepping onto
// SLUICE_SECRET_ENTRANCE (L3 r7 c14, past the two false walls). Treated as
// "sluiceFloor 4": inSluice stays true so the sluice's encounter/interaction
// machinery keeps working, and every sluiceFloor branch elsewhere already
// checks floors 1-3 explicitly.
function enterSluiceSecret() {
  transitionToLocation({ mapId: 'SLUICE_SECRET_MAP', x: 7.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inSluice: true, sluiceFloor: 4 }, cooldown: true }); // entry corridor, one south of exit tile
}

function exitSluiceSecret() {
  transitionToLocation({ mapId: 'SLUICE_LEVEL3_MAP', x: 11.5 * TILE, y: 7.5 * TILE, facing: 'left',
    state: { inSluice: true, sluiceFloor: 3 }, cooldown: true }); // east pocket floor, just west of false walls
}

// ─── The Upper Reach: the unmarked chamber + the Sunken Gallery ──────────────
// Both areas hang off NORTH_BASIN_NW_MAP and follow the full safe-entrance-
// area pattern (own state flag each — see state.js). Entered by stepping on
// CHAMBER_DOOR (r3 c12) / SUNKEN_STAIR (r9 c4); movement.js holds the tile
// triggers.

function enterBasinChamber() {
  transitionToLocation({ mapId: 'BASIN_CHAMBER_MAP', x: 8.5 * TILE, y: 9.5 * TILE, facing: 'up',
    state: { inBasinChamber: true }, cooldown: true }); // directly inside the threshold
}

function exitBasinChamber() {
  // Once the player has walked out of the unmarked chamber at least twice AND
  // the fourth main quest — the reservoir assignment — has been given, the
  // world doesn't just let them step back onto the reach: the dream sequence
  // takes over (basinChamberDreamSequence), ending with them waking at the
  // Drenwick infirmary. It fires exactly once (basin_chamber_dream_done).
  // Gating on reservoir_quest_started means the whole sequence can't happen
  // before MQ4; using >= 2 (not === 2) means an early, pre-MQ4 second exit
  // doesn't permanently miss the trigger — it just waits for the next exit
  // after the assignment. Every other exit is the ordinary step to the Reach.
  window.basin_chamber_exits = (window.basin_chamber_exits || 0) + 1;
  if (window.basin_chamber_exits >= 2 && reservoir_quest_started && !window.basin_chamber_dream_done) {
    window.basin_chamber_dream_done = true;
    basinChamberDreamSequence();
    return;
  }
  transitionToLocation({ mapId: 'NORTH_BASIN_NW_MAP', x: 12.5 * TILE, y: 4.5 * TILE, facing: 'down', cooldown: true }); // one tile south of the doorframe
}

// ─── The chamber's second-exit dream, and waking at Drenwick ─────────────────
// The long monologue plays in the all-white DREAM_MAP (reusing enterDream's
// setup); when its last page closes, wakeAtDrenwickInfirmary() takes over.
// enterDream()'s _dreamReturn stash is deliberately discarded on waking — the
// player does NOT return to the chamber: Esla carried them out of the marshes.
const BASIN_CHAMBER_DREAM_PAGES = [
  ['I remember that night when the four of us took the backroads to the cave. I go hollow when I think about it. The way Jane stood at its mouth, she knew before the rest of us. She’d seen the maw of God. She’d heard the blaring Engine.'],
  ['We brought some beer. No cops were gonna catch us in the middle of the woods. We were fine. Tendrils of cold air coiled out of the cave; you could feel them touching you. You could hear their whispers. Something sweet was in their words. I loved them.'],
  ['It was all fun and games before we entered. We sat around the campfire for a long time just drinking and talking. I don’t remember talking to my friends. We were all alone, alone with the cosmos. Since we were far from the city, the stars were bright and you could see the Milky Way in the sky. It was beautiful.'],
  ['Sarah dared someone to go into the cave. I don’t know if she was even talking to him, but Jeffrey accepted the challenge. His dad was our boy-scout leader and the coach of our soccer team, his son wasn’t one to turn down a dare. You could see the galaxies in the depths of his eyes. The knowing of tomorrow. The Forever Dream begun in his mind. In it, he soared.'],
  ['His first steps were timid, but soon he was several yards into the cave. He shouted my name. The trees spoke it too. A yearning for belonging. I followed him between the stalactites. Sarah and Jane were quick to join us. The stars reflected off the pools of water at the mouth, and were multiplied into millions of dazzling points on the walls. They danced and laughed and drifted between among us. I think I was alive. Only truly then.'],
  ['We walked deeper and deeper. Eventually the cave stopped, and the darkness began. Our thin trail down into the depths ended. A vast expanse opened up before us. I didn’t know Jeffrey had brought a flashlight, but it did little use to illuminate the void. The chilly air ceased. We bathed in warmth. We lived in love.'],
  ['The darkness sang. I remember the words of my mother coming from the black expanse. She was so young. She sang in unearthly tones. She was beyond death. She was with me. And in the dark a shape rumbled and throbbed. It churned, the heaps of flesh writhing and quivering. In places it was torn, and the stars shined through, the universe seen through windows in its skin. Cogs and wires jutted from it. They spun faster and faster. Jane was the only one among us not to avert her eyes. She knew that we could not hide what we were going to see. There was no reason to.'],
  ['The thing bellowed and someone screamed. I faintly remember it being me.'],
  ['In that cave I was not afraid. It was beautiful. So beautiful.'],
  ['The beast spoke to me with my mother’s voice.'],
  ['“You will find the Truth.”'],
];

const ESLA_INFIRMARY_WAKE_PAGES = [
  ['A low plank ceiling. The bog-smell is back — peat, canal water, tallow smoke. You are somewhere with walls again.'],
  ['“There you are.”',
   'Esla is on a stool beside the cot. She looks like she hasn’t slept.'],
  ['“I found you out past the north bank, wandering the marshes. You didn’t answer to your name. You didn’t answer to anything.”'],
  ['“I couldn’t get any sense out of you, so I got you onto a cart and brought you back to Drenwick. The infirmary here did what they could.”'],
  ['“I don’t know what you were doing out there alone. I don’t think I want to.”',
   'She doesn’t ask.'],
  ['“Rest. You’re back now.”'],
];

function basinChamberDreamSequence() {
  inBasinChamber = false;
  enterDream();  // warp to the white space; its _dreamReturn stash is discarded on wake
  dialogue.name      = '';
  dialogue.pages     = BASIN_CHAMBER_DREAM_PAGES;
  dialogue.callbacks = [function () { wakeAtDrenwickInfirmary(); }];
  dialogue.open      = true;
  dialogue.page      = 0;
}

function wakeAtDrenwickInfirmary() {
  _dreamReturn = null;   // discard the dream stash — not returning to the chamber
  // Wake INSIDE the Drenwick infirmary interior. The canonical reset clears every
  // stray location flag (the old hand-cleared list here was the same fragility
  // this refactor removes).
  transitionToLocation({ mapId: 'DRENWICK_INFIRMARY_MAP', x: 7.5 * TILE, y: 8.5 * TILE, facing: 'up',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'infirmary' }, cooldown: true }); // ward aisle by the beds
  dialogue.name      = 'Esla';
  dialogue.pages     = ESLA_INFIRMARY_WAKE_PAGES;
  dialogue.callbacks = [];   // NOT null: handleInteract reads .length right after this returns
  dialogue.open      = true;
  dialogue.page      = 0;
}

function descendSunkenGallery() {
  transitionToLocation({ mapId: 'SUNKEN_GALLERY_MAP', x: 2.5 * TILE, y: 3.5 * TILE, facing: 'down',
    state: { inSunkenGallery: true }, cooldown: true }); // foot of the stair, one south of GALLERY_STAIR_UP
}

function ascendSunkenGallery() {
  transitionToLocation({ mapId: 'NORTH_BASIN_NW_MAP', x: 4.5 * TILE, y: 10.5 * TILE, facing: 'down', cooldown: true }); // one south of stairhead, EXPOSED_STONE apron
}

// ─── The Dream (DREAM_MAP) ────────────────────────────────────────────────────
// Entered when the weekly strange dream plays (resting in the player's own
// bed, day % 5 === 3 on the five-day week) and left when the dream dialogue closes. Unlike every
// other transition here, the return point isn't a fixed coordinate — it's
// wherever the player fell asleep — so enterDream() stashes the waking world
// (map, position, and the three flags render.js keys its house/town overlays
// on) and exitDream() restores it. The stash is transient on purpose: the
// menu (and therefore saving) can't open while the dream dialogue is up, so
// no save can ever happen mid-dream.
let _dreamReturn = null;

function enterDream() {
  // Stash the FULL waking-world location snapshot (not just the render flags),
  // then transition to the white space. exitDream restores the snapshot, so no
  // location field can be lost across the dream.
  _dreamReturn = {
    map: activeMap, x: player.x, y: player.y, facing: player.facing,
    state: snapshotLocationState(),
  };
  transitionToLocation({ mapId: 'DREAM_MAP', x: 7.5 * TILE, y: 7.5 * TILE, facing: 'down' }); // centre of the white
}

function exitDream() {
  if (!_dreamReturn) return; // defensive: never entered (e.g. audit calling order)
  // A restoration (like save/load), NOT a fresh gameplay transition: reapply the
  // stashed location state + map/position directly, with no cooldown/side effect.
  applyLocationState(_dreamReturn.state);
  activeMap       = _dreamReturn.map;
  player.x        = _dreamReturn.x;
  player.y        = _dreamReturn.y;
  player.facing   = _dreamReturn.facing;
  _dreamReturn    = null;
}

// ─── Edge-based map transitions ───────────────────────────────────────────────
// A general, reusable system for walking off an open EDGE (or a segment of
// one) of a map into an adjacent one, rather than stepping onto a single
// dedicated exit tile. This exists for open outdoor terrain and large
// dungeon/ruin chambers where a whole side of a field, shoreline, or hall
// should be crossable — not just one door. It is a SEPARATE, additive
// system: every point/special-tile transition elsewhere in this file (town
// entrances, dungeon entrances, the bridge gate, building/interior exits,
// stairs, secret passages, and the other North Basin links like
// enterNorthBasinS/exitNorthBasinS and enterNorthBasinW/exitNorthBasinW)
// is untouched and keeps working exactly as before, via its own tile ID and
// movement.js curTile check. Not "world-only" — a dungeon/ruin map can use
// this too, as long as it has a stable MAP_REGISTRY id like everything else.
//
// EDGE_TRANSITIONS[mapId][direction] is an ARRAY of segments (not a single
// object) so one edge can have more than one independent opening — e.g. a
// broad crossing plus a separate narrow gap elsewhere on the same side.
// direction is the edge of the CURRENT map being walked off: 'north',
// 'south', 'east', or 'west'.
//
// Each segment:
//   targetMap    MAP_REGISTRY id (string, preferred) or a direct map array
//                reference — either is accepted (requirement: "target map
//                or target map id").
//   targetEdge   'north' | 'south' | 'east' | 'west' — which edge of the
//                TARGET map the player arrives at. This is a separate field
//                rather than always inferred as "the opposite edge," so a
//                non-mirrored connection (an L-shaped join, say) is possible
//                later without changing the system's shape. Every case in
//                this pass uses the natural opposite edge (north<->south,
//                east<->west), matching requirement 2.
//   sourceRange  [min, max] inclusive tile range along the edge being left —
//                columns for north/south, rows for east/west. Outside this
//                range this segment doesn't apply (falls through to the
//                next segment in the array, or to "blocked" if none match).
//   targetRange  optional [min, max]; the along-edge coordinate is clamped
//                into this range on arrival. Defaults to sourceRange if
//                omitted. This is deliberately allowed to differ in size
//                from sourceRange (see the North Basin routes below), so
//                clamping is a real, exercised code path, not dead code.
//   condition    optional () => boolean. If present and returns false, the
//                transition is blocked (no map change) even within range —
//                e.g. a future `day >= 8` drought-exposure gate.
//   blockedText  optional string, shown via showWorldToast() when condition
//                fails.
//
// Coordinate preservation: the tile position running ALONG the edge (column
// for north/south, row for east/west) carries over from source to target,
// clamped into targetRange if needed. The position ACROSS the edge is
// always "one tile inside" the target map's arrival border — the same
// row 13/1 or col 14/1 convention used by every enter*/exit* function in
// this file — and facing is set to continue the direction of travel.
const EDGE_TRANSITIONS = {
  NORTH_BASIN_S_MAP: {
    // North edge: broad open ground (cols 1-14) into the Reservoir's south
    // shore. Source and target ranges match exactly (both maps' open
    // borders are the same width and the landing row is walkable across
    // all of it), so crossing anywhere along this edge preserves the
    // column exactly -- no clamping in normal play. targetRange is omitted
    // here since it defaults to sourceRange when they're identical.
    north: [
      { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'south', sourceRange: [1, 14] },
    ],
    // West edge: rows 9-11 into the Silt Flats, matching where the old
    // point-tile crossing already sat. Source and target ranges match
    // exactly here too.
    west: [
      { targetMap: 'NORTH_BASIN_SW_MAP', targetEdge: 'east', sourceRange: [9, 11] },
    ],
  },
  NORTH_BASIN_C_MAP: {
    south: [
      { targetMap: 'NORTH_BASIN_S_MAP', targetEdge: 'north', sourceRange: [1, 14] },
    ],
  },
  NORTH_BASIN_SW_MAP: {
    east: [
      { targetMap: 'NORTH_BASIN_S_MAP', targetEdge: 'west', sourceRange: [9, 11] },
    ],
    // North edge: cols 1-10 into the West Shore's south edge. The range stops
    // at col 10 (not 14) because the Silt Flats' reservoir finger (rows 1-3,
    // cols 11-13, WATER) backs onto the east end of this edge -- landing a
    // crossing there would strand the player on water. Source and target
    // ranges match exactly, so crossings within 1-10 never clamp. (Replaces
    // the old NORTH_BASIN_W_EXIT/ENTRANCE point-tile, retired like 84-87.)
    north: [
      { targetMap: 'NORTH_BASIN_W_MAP', targetEdge: 'south', sourceRange: [1, 10] },
    ],
  },
  NORTH_BASIN_W_MAP: {
    south: [
      { targetMap: 'NORTH_BASIN_SW_MAP', targetEdge: 'north', sourceRange: [1, 10] },
    ],
    // North edge: cols 1-10 into the Upper Reach (the drained NW arm). Same
    // width as the south edge and both maps' open borders match exactly, so
    // crossings never clamp. The east end (c11+) stays border on both sides:
    // the West Shore's own row-1 shoreline turns to reeds/water there.
    north: [
      { targetMap: 'NORTH_BASIN_NW_MAP', targetEdge: 'south', sourceRange: [1, 10] },
    ],
  },
  NORTH_BASIN_NW_MAP: {
    south: [
      { targetMap: 'NORTH_BASIN_W_MAP', targetEdge: 'north', sourceRange: [1, 10] },
    ],
  },
  // North edge: the single col-8 PATH up into the Northern Fen (MAP3_N1). MAP3's
  // north edge is open lake except this one road tile, so the seam is deliberately
  // ONE tile wide (sourceRange [8,8]). This is the pilot conversion of the former
  // FEN_N_EXIT/FEN_N_ENTRANCE point crossing to a structural seam; reciprocal of
  // MAP3_N1.south. The one-tile corridor is authored geography (unchanged).
  MAP3: {
    north: [
      { targetMap: 'MAP3_N1', targetEdge: 'south', sourceRange: [8, 8] },
    ],
    // West edge: the single row-11 PATH into MAP2 (Eastern Reaches). MAP3's west
    // edge is closed except this one road tile, so the seam is ONE tile wide
    // (sourceRange [11,11]) — the former MAP3_ENTRANCE/MAP3_EXIT point crossing.
    // Reciprocal of MAP2.east. Rows match exactly, so crossings never clamp.
    west: [
      { targetMap: 'MAP2', targetEdge: 'east', sourceRange: [11, 11] },
    ],
  },
  // West edge: rows 4-9 into Roddon Way's east edge -- the roddon ridge
  // crossing the map boundary. Deliberately clear of the Mire Entrance
  // (col 1, row 3) and the hamlet farmhouses (col 1, rows 10-12) on the
  // MAP3_N1 side. Source and target ranges match exactly, so crossings
  // never clamp.
  MAP3_N1: {
    west: [
      { targetMap: 'RODDON_WAY_MAP', targetEdge: 'east', sourceRange: [4, 9] },
    ],
    // North edge: cols 3-13 up into MAP3_N2 (Drenwick)'s south fen approach.
    // Was the single FEN_N2_EXIT road tile at col 8; now the whole fen edge is
    // open, with that road running through the middle of the crossing. Ranges
    // match exactly, so crossings never clamp.
    north: [
      { targetMap: 'MAP3_N2', targetEdge: 'south', sourceRange: [3, 13] },
    ],
    // South edge: the single col-8 PATH into MAP3 (Thornmere Fen). MAP3's north
    // edge is open lake except this one road tile, so the seam is deliberately
    // ONE tile wide (sourceRange [8,8]) — the first converted former point
    // crossing (was FEN_N_ENTRANCE/FEN_N_EXIT). Reciprocal of MAP3.north.
    south: [
      { targetMap: 'MAP3', targetEdge: 'north', sourceRange: [8, 8] },
    ],
  },
  // South edge: the reciprocal of MAP3_N1's north — cols 3-13 down into the
  // Northern Fen, road at col 8 through the middle. (The other MAP3_N2 edges
  // stay point-tiles/gates: the north causeway, the Drenwick gate, the bridge.)
  MAP3_N2: {
    south: [
      { targetMap: 'MAP3_N1', targetEdge: 'north', sourceRange: [3, 13] },
    ],
  },
  RODDON_WAY_MAP: {
    east: [
      { targetMap: 'MAP3_N1', targetEdge: 'west', sourceRange: [4, 9] },
    ],
    // South edge: cols 12-14 down into the Eastern Reaches (MAP2)'s north
    // edge. Deliberately roadless — you leave the ridge and cut across open
    // fen. Source and target ranges match exactly, so crossings never clamp.
    south: [
      { targetMap: 'MAP2', targetEdge: 'north', sourceRange: [12, 14] },
    ],
  },
  // North edge: cols 12-14 up into Roddon Way's south edge — the reciprocal of
  // the link above. Also roadless: reach it by leaving the MAP2 road and
  // cutting north-east across the open fen.
  MAP2: {
    north: [
      { targetMap: 'RODDON_WAY_MAP', targetEdge: 'south', sourceRange: [12, 14] },
    ],
    // East edge: the single row-11 PATH into MAP3 (Thornmere Fen). MAP2's east
    // edge is closed except this one road tile, so the seam is ONE tile wide
    // (sourceRange [11,11]) — the former MAP3_EXIT/MAP3_ENTRANCE point crossing.
    // Reciprocal of MAP3.west. Rows match exactly, so crossings never clamp.
    east: [
      { targetMap: 'MAP3', targetEdge: 'west', sourceRange: [11, 11] },
    ],
  },
};
window.EDGE_TRANSITIONS = EDGE_TRANSITIONS;

// ─── Regional single-tile ("point") world crossings — shared declarative authority ─
// The overworld's discrete point crossings (the "NEEDS_REMAP"/"INTENTIONAL_DISCRETE"
// class): each is a single EXIT tile on the source map's edge that warps to the
// physically adjacent target map. This declarative inventory is the ONE authority
// consumed by BOTH validateGameData() (the legacy/continuous boundary reciprocity
// invariant) AND test/transition-audit.js's seam-readiness classification, so the
// two never drift. It DESCRIBES the runtime dispatch (movement.js + world-transitions.js
// enter*/exit*) — it does not replace it; the four MAP transitions are unchanged.
// Every entry is reciprocal: for each { from, dir, to } there is a { to, INV(dir), from }.
const REGIONAL_POINT_CROSSINGS = [
  { from: 'MAP',   dir: 'east',  to: 'MAP2',   tile: MAP2_EXIT },
  { from: 'MAP2',  dir: 'west',  to: 'MAP',    tile: MAP2_ENTRANCE },
  { from: 'MAP3',  dir: 'east',  to: 'MAP4',   tile: MAP4_EXIT },
  { from: 'MAP4',  dir: 'west',  to: 'MAP3',   tile: MAP4_ENTRANCE },
  { from: 'MAP4',  dir: 'east',  to: 'MAP5',   tile: MAP5_EXIT },
  { from: 'MAP5',  dir: 'west',  to: 'MAP4',   tile: MAP5_ENTRANCE },
  { from: 'MAP',   dir: 'north', to: 'MAP_N1', tile: NORTH_EXIT },
  { from: 'MAP_N1', dir: 'south', to: 'MAP',    tile: NORTH_ENTRANCE },
  { from: 'MAP_N1', dir: 'north', to: 'MAP_N2', tile: NORTH2_EXIT },
  { from: 'MAP_N2', dir: 'south', to: 'MAP_N1', tile: NORTH2_ENTRANCE },
  { from: 'MAP3_N2', dir: 'north', to: 'NORTH_BASIN_S_MAP', tile: NORTH_BASIN_EXIT },
  { from: 'NORTH_BASIN_S_MAP', dir: 'south', to: 'MAP3_N2', tile: NORTH_BASIN_ENTRANCE },
];
window.REGIONAL_POINT_CROSSINGS = REGIONAL_POINT_CROSSINGS;

// ─── Sunken Gallery 5×5 grid links ────────────────────────────────────────────
// The gallery grid (maps.js) is wired here rather than as 25 more hand-written
// EDGE_TRANSITIONS literals: every interior room joins its orthogonal neighbours
// with a full-width open edge, so the join ranges are uniform and mechanical.
// The entrance room (SUNKEN_GALLERY_MAP, grid cell R4C0) is the one exception —
// it keeps the two narrower, offset doorways cut into its existing detailed
// layout (north cols 4-6 up to R3C0; east rows 3-5 across to R4C1), so those
// four segments are spelled out explicitly and the loop skips the entrance.
// The blank neighbours open their whole facing side, so the return trips clamp
// back into those narrow ranges via targetRange.
(function wireSunkenGalleryGrid() {
  const ENTRANCE = 'SUNKEN_GALLERY_MAP';
  const cellId = (r, c) => (r === 4 && c === 0) ? ENTRANCE : ('SUNKEN_GALLERY_R' + r + 'C' + c);
  const FULL_NS = [1, 14]; // full open width for a north/south join between two blank rooms
  const FULL_EW = [1, 13]; // full open height for an east/west join
  function add(mapId, dir, seg) {
    if (!EDGE_TRANSITIONS[mapId]) EDGE_TRANSITIONS[mapId] = {};
    if (!EDGE_TRANSITIONS[mapId][dir]) EDGE_TRANSITIONS[mapId][dir] = [];
    EDGE_TRANSITIONS[mapId][dir].push(seg);
  }
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const id = cellId(r, c);
      if (c < 4) { // east neighbour
        const east = cellId(r, c + 1);
        if (id !== ENTRANCE && east !== ENTRANCE) {
          add(id,   'east', { targetMap: east, targetEdge: 'west', sourceRange: FULL_EW });
          add(east, 'west', { targetMap: id,   targetEdge: 'east', sourceRange: FULL_EW });
        }
      }
      if (r < 4) { // south neighbour
        const south = cellId(r + 1, c);
        if (id !== ENTRANCE && south !== ENTRANCE) {
          add(id,    'south', { targetMap: south, targetEdge: 'north', sourceRange: FULL_NS });
          add(south, 'north', { targetMap: id,    targetEdge: 'south', sourceRange: FULL_NS });
        }
      }
    }
  }
  // The entrance's two doorways and their reciprocals.
  add(ENTRANCE, 'north', { targetMap: 'SUNKEN_GALLERY_R3C0', targetEdge: 'south', sourceRange: [4, 6] });
  add('SUNKEN_GALLERY_R3C0', 'south', { targetMap: ENTRANCE, targetEdge: 'north', sourceRange: FULL_NS, targetRange: [4, 6] });
  add(ENTRANCE, 'east', { targetMap: 'SUNKEN_GALLERY_R4C1', targetEdge: 'west', sourceRange: [3, 5] });
  add('SUNKEN_GALLERY_R4C1', 'west', { targetMap: ENTRANCE, targetEdge: 'east', sourceRange: FULL_EW, targetRange: [3, 5] });
})();

// Attempts an edge transition off activeMap in the given direction, from the
// player's current position. Returns true if a transition actually
// executed (activeMap/player position/facing were changed) — false in
// every other case (no configured link for this map+direction, the
// player's position is outside every segment's sourceRange, or a
// segment's condition blocked it). In every false case the caller should
// simply not move the player further in that direction, exactly as if a
// solid border tile had stopped them — this function never moves the
// player out of bounds and never throws.
// Pure: the destination LANDING tile + facing for an edge-transition segment
// given a source along-coordinate (column for N/S edges, row for E/W edges).
// Applies the exact clamp + edge-mapping formula tryEdgeTransition() uses at
// runtime, so save restore, edge validation, and the transition audit can all
// reason about the SAME landing a real crossing would produce — without
// duplicating the arithmetic. Every map is COLS×ROWS, so the fixed one-tile-
// inside-border rows/cols come from the global grid. Returns { col, row, facing }
// or null for an unrecognised targetEdge.
function edgeTransitionLanding(seg, along) {
  const [tgtMin, tgtMax] = seg.targetRange || seg.sourceRange;
  const clamped = Math.min(Math.max(along, tgtMin), tgtMax);
  switch (seg.targetEdge) {
    case 'south': return { col: clamped,   row: ROWS - 2, facing: 'up' };    // one tile inside south border
    case 'north': return { col: clamped,   row: 1,        facing: 'down' };  // one tile inside north border
    case 'west':  return { col: 1,         row: clamped,  facing: 'right' }; // one tile inside west border
    case 'east':  return { col: COLS - 2,  row: clamped,  facing: 'left' };  // one tile inside east border
  }
  return null;
}
if (typeof window !== 'undefined') window.edgeTransitionLanding = edgeTransitionLanding;

function tryEdgeTransition(direction) {
  const mapId = mapIdForRef(activeMap);
  if (!mapId) return false;
  const segments = EDGE_TRANSITIONS[mapId] && EDGE_TRANSITIONS[mapId][direction];
  if (!segments) return false;

  // North/south edges: position along the edge is the column. East/west
  // edges: the row.
  const along = (direction === 'north' || direction === 'south')
    ? Math.floor(player.x / TILE)
    : Math.floor(player.y / TILE);

  for (const seg of segments) {
    const [srcMin, srcMax] = seg.sourceRange;
    if (along < srcMin || along > srcMax) continue; // this segment doesn't cover this position

    if (seg.condition && !seg.condition()) {
      if (seg.blockedText) showWorldToast(seg.blockedText);
      return false;
    }

    const targetMapId = typeof seg.targetMap === 'string' ? seg.targetMap : mapIdForRef(seg.targetMap);
    if (!targetMapId || !mapRefForId(targetMapId)) return false; // misconfigured segment — fail safe, don't move

    // Landing on the destination edge (outdoor↔outdoor, so no location-state
    // overrides — the canonical reset leaves everything neutral). transitionTo-
    // Location() enforces the base-walkability of this landing before moving.
    const landing = edgeTransitionLanding(seg, along);
    if (!landing) return false;
    return transitionToLocation({
      mapId: targetMapId, x: (landing.col + 0.5) * TILE, y: (landing.row + 0.5) * TILE,
      facing: landing.facing, cooldown: true,
    });
  }
  return false; // no segment covered this position
}
window.tryEdgeTransition = tryEdgeTransition;

// ─── Debug-only: map warp tool ────────────────────────────────────────────────
// Backs the debug menu's warp screen (render-ui.js's drawWarpMenu(),
// input.js's warpMenu handling). Never called from normal gameplay code —
// only from debug-gated input, so it doesn't need (and deliberately
// doesn't do) any of the quest/dialogue side effects a real enter*()
// function might trigger.

// Finds the nearest walkable tile to (col, row) on the given map, searching
// outward ring by ring (radius 0, 1, 2, ...) up to the map's full size.
// Returns { col, row } or null if the map has no walkable tile at all
// (pathological, but this must never throw or infinite-loop if it happens).
function debugFindNearestWalkableTile(map, col, row) {
  const rows = map.length, cols = map[0].length;
  const maxRadius = rows + cols; // generous upper bound; terminates well before this in practice
  for (let radius = 0; radius <= maxRadius; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      const r = row + dr;
      if (r < 0 || r >= rows) continue;
      const dc = radius - Math.abs(dr);
      const candidates = dc === 0 ? [col] : [col - dc, col + dc];
      for (const c of candidates) {
        if (c < 0 || c >= cols) continue;
        if (WALKABLE[map[r][c]]) return { col: c, row: r };
      }
    }
  }
  return null;
}

// Map-only warp — RESTRICTED to unambiguous OUTDOOR maps, whose neutral location
// state is complete and correct. Every non-outdoor map (town/dungeon/sluice/
// house/special) needs a specific runtime mode that a bare map id can't supply,
// so this NEVER guesses that context: it fails and points the caller at the
// logical destination catalog (debug-warp.js's debugWarpToDestination(), the
// path the warp menu now uses). This removes the old "successful but incomplete"
// non-outdoor warp (which reset state, changed only the map, warned that context
// was missing, and still returned success).
//
// Returns { success, message, col, row } — never throws, never leaves the player
// out of bounds or on an unwalkable tile. On failure nothing is mutated (it only
// commits through transitionToLocation(), which is atomic).
function debugWarpToMap(mapId, col, row) {
  const meta      = (typeof mapEntryForId === 'function') ? mapEntryForId(mapId) : null;
  const targetMap = meta ? meta.map : undefined;

  if (!Array.isArray(targetMap)) {
    return { success: false, message: 'Warp failed: unknown map id "' + mapId + '"' };
  }
  if (meta.type !== 'outdoor') {
    return { success: false, message: 'Warp failed: "' + mapId + '" is a "' + meta.type + '"-type map that needs logical context (town building, dungeon floor, etc). Use the warp menu / debugWarpToDestination() instead of a map-only warp.' };
  }

  const rows = targetMap.length, cols = targetMap[0].length;
  let targetCol = Math.min(Math.max(Math.round(col), 0), cols - 1);
  let targetRow = Math.min(Math.max(Math.round(row), 0), rows - 1);
  const clamped = (targetCol !== col || targetRow !== row);

  let landing = { col: targetCol, row: targetRow };
  let nudged = false;
  if (!WALKABLE[targetMap[targetRow][targetCol]]) {
    const found = debugFindNearestWalkableTile(targetMap, targetCol, targetRow);
    if (!found) {
      return { success: false, message: 'Warp failed: "' + mapId + '" has no walkable tile at all' };
    }
    landing = found;
    nudged = true;
  }

  // Outdoor maps take neutral location state (no overrides). The canonical
  // boundary validates + applies atomically; no enter*() is called, so no
  // quest/dialogue/combat side effect can fire from a warp.
  const ok = transitionToLocation({
    mapId, x: (landing.col + 0.5) * TILE, y: (landing.row + 0.5) * TILE, facing: 'down', cooldown: true,
  });
  if (!ok) return { success: false, message: 'Warp failed: transition rejected for "' + mapId + '"' };

  let message = 'Warped to ' + meta.displayName + ' (col ' + landing.col + ', row ' + landing.row + ')';
  if (clamped) message += ' — target coordinate was out of bounds, clamped';
  if (nudged)  message += ' — nearest walkable tile used (original spot was blocked)';
  return { success: true, message, col: landing.col, row: landing.row };
}
window.debugFindNearestWalkableTile = debugFindNearestWalkableTile;
window.debugWarpToMap = debugWarpToMap;

// Returns a per-direction summary of EDGE_TRANSITIONS for the given map id:
// { north: [...], south: [...], east: [...], west: [...] }, each either
// null (no entry configured for that direction) or an array of
// { sourceRange, targetMapId, targetDisplayName, unlocked, blockedText }.
// Used by the debug map inspector (render-ui.js's drawDebugInspector()) to
// answer requirement 5 ("show edge transition data for the current map").
function debugEdgeTransitionSummary(mapId) {
  const dirs = ['north', 'south', 'east', 'west'];
  const out = {};
  const entries = (typeof EDGE_TRANSITIONS !== 'undefined') ? EDGE_TRANSITIONS[mapId] : undefined;
  for (const dir of dirs) {
    const segments = entries ? entries[dir] : undefined;
    if (!segments || segments.length === 0) { out[dir] = null; continue; }
    out[dir] = segments.map(seg => {
      const targetMapId = typeof seg.targetMap === 'string' ? seg.targetMap : mapIdForRef(seg.targetMap);
      const targetMeta = (typeof MAP_METADATA !== 'undefined' && targetMapId) ? MAP_METADATA[targetMapId] : undefined;
      return {
        sourceRange:       seg.sourceRange,
        targetMapId:       targetMapId,
        targetDisplayName: targetMeta ? targetMeta.displayName : (targetMapId || '?'),
        unlocked:          !seg.condition || !!seg.condition(),
        blockedText:       seg.blockedText || null,
      };
    });
  }
  return out;
}
window.debugEdgeTransitionSummary = debugEdgeTransitionSummary;

// Best-effort "what's right here" check for the player's CURRENT position:
// a point-transition tile (matched by name keyword — EXIT/ENTRANCE/DOOR/
// GATE/STAIRS — via tiles.js's debugTileName()), an open or blocked edge
// transition if standing within 1 tile of a configured edge, or 'none
// nearby'. This is a display heuristic only (used by drawDebugInspector()),
// never gameplay logic — the real transitions are still driven entirely by
// movement.js's curTile checks and the edge-transition interception there.
function debugNearbyTransitionInfo() {
  const mapId = mapIdForRef(activeMap);
  const col = Math.floor(player.x / TILE), row = Math.floor(player.y / TILE);
  const tile = activeMap[row] ? activeMap[row][col] : undefined;
  const tileName = (typeof debugTileName === 'function' && tile !== undefined) ? debugTileName(tile) : null;

  const POINT_TRANSITION_KEYWORDS = ['EXIT', 'ENTRANCE', 'DOOR', 'GATE', 'STAIRS'];
  if (tileName && POINT_TRANSITION_KEYWORDS.some(k => tileName.includes(k))) {
    return 'point transition tile (' + tileName + ')';
  }

  const edges = mapId ? debugEdgeTransitionSummary(mapId) : null;
  if (edges) {
    const checks = [
      ['north', row <= 1,          col],
      ['south', row >= ROWS - 2,   col],
      ['west',  col <= 1,          row],
      ['east',  col >= COLS - 2,   row],
    ];
    for (const [dir, nearEdge, along] of checks) {
      if (!nearEdge || !edges[dir]) continue;
      const match = edges[dir].find(seg => along >= seg.sourceRange[0] && along <= seg.sourceRange[1]);
      if (match) return 'edge transition (' + dir + (match.unlocked ? ', open -> ' + match.targetDisplayName : ', BLOCKED') + ')';
    }
  }
  return 'none nearby';
}
window.debugNearbyTransitionInfo = debugNearbyTransitionInfo;

