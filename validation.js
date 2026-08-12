'use strict';

// ─── Game data validation / content linter ───────────────────────────────────
// A general, game-wide content linter -- not built only for North Basin, and
// not tied to any one region. It should work unchanged for future towns,
// dungeons, interiors, ruins, wilderness regions, and one-off maps, as long
// as they're wired into the same registries every other map already uses
// (MAP_REGISTRY/MAP_METADATA, SIMPLE_NPCS, EDGE_TRANSITIONS, etc).
//
// Purely observational: nothing here mutates game state, throws, or changes
// gameplay behaviour. Call validateGameData() from the browser console (or
// via the debug menu's "Validate Data" row) at any time; it always collects
// every issue it finds rather than stopping at the first one, then prints a
// grouped, readable report.
//
// Severity:
//   ERROR   -- definitely wrong / likely to break the game (a map that will
//              render blank, a transition that can strand the player in a
//              wall, a save flag that will silently not persist, ...).
//   WARNING -- suspicious, possibly intentional (an empty-but-declared
//              encounter pool, a long dialogue line, a missing reciprocal
//              edge-transition link, a cosmetic id mismatch, ...).
// Individual check severities are called out in the comment above each one;
// as a rule, anything that can make the game crash, soft-lock, or render
// nothing is an error, and anything that's just unusual-looking is a
// warning.
//
// addValidationError(group, message) / addValidationWarning(group, message)
// are the two primitives every check below is built from -- collected into
// module-level arrays, reset at the start of each validateGameData() run,
// and printed together at the end. Each individual validateX() function can
// also be called on its own (e.g. from a focused test), and returns the
// number of items it checked for the summary report.

let VALIDATION_ERRORS   = [];
let VALIDATION_WARNINGS = [];

function addValidationError(group, message) {
  VALIDATION_ERRORS.push({ group: group, message: message });
}
function addValidationWarning(group, message) {
  VALIDATION_WARNINGS.push({ group: group, message: message });
}
window.addValidationError   = addValidationError;
window.addValidationWarning = addValidationWarning;

// Small shared helpers -----------------------------------------------------

// True display-grid size for every registered map (see state.js). Used
// throughout instead of hardcoded literals so this stays correct if the
// grid size is ever revisited, and so "how many rows/cols" is answered in
// exactly one place.
function _validationRows() { return typeof ROWS !== 'undefined' ? ROWS : 15; }
function _validationCols() { return typeof COLS !== 'undefined' ? COLS : 16; }

function _isPlainArray(v) { return Array.isArray(v); }
function _isFiniteNumber(v) { return typeof v === 'number' && isFinite(v); }

// ─── 1. Maps ────────────────────────────────────────────────────────────────
// Structural correctness of MAP_REGISTRY itself: every entry is a real,
// correctly-shaped 16-wide grid of the expected height, ids are unique.
// Does NOT check individual tile validity (see validateTiles()) or
// MAP_METADATA agreement (see validateMapMetadata()) -- kept separate so
// each function answers one question.
function validateMaps() {
  const GROUP = 'Maps';
  let checked = 0;
  if (typeof MAP_REGISTRY === 'undefined') {
    addValidationError(GROUP, 'MAP_REGISTRY is undefined -- check script load order (maps.js)');
    return checked;
  }

  const seenIds = new Set();
  for (const [key, entry] of Object.entries(MAP_REGISTRY)) {
    const lbl = 'MAP_REGISTRY[' + key + ']';
    if (!entry || typeof entry !== 'object') {
      addValidationError(GROUP, lbl + ': not an object');
      continue;
    }

    if (!entry.id) addValidationWarning(GROUP, lbl + ': missing id');
    if (!entry.label) addValidationWarning(GROUP, lbl + ': missing label');
    if (entry.id) {
      if (seenIds.has(entry.id)) addValidationError(GROUP, lbl + ': duplicate id "' + entry.id + '" -- would break save/load map resolution (mapToId()/mapFromId())');
      else seenIds.add(entry.id);
    }

    if (!_isPlainArray(entry.map)) {
      addValidationError(GROUP, lbl + ': map is not an array');
      checked++;
      continue;
    }

    const rows = _validationRows(), cols = _validationCols();
    if (entry.map.length !== rows)
      addValidationError(GROUP, lbl + ': has ' + entry.map.length + ' rows (expected ' + rows + ') -- will break rendering/collision');

    entry.map.forEach((row, r) => {
      if (!_isPlainArray(row)) { addValidationError(GROUP, lbl + ' row ' + r + ': not an array'); return; }
      if (row.length !== cols)
        addValidationError(GROUP, lbl + ' row ' + r + ': has ' + row.length + ' cols (expected ' + cols + ') -- will break rendering/collision');
    });

    checked++;
  }
  return checked;
}

// ─── 2. Map catalog ─────────────────────────────────────────────────────────
// MAP_CATALOG (data.js) is the ONE authoritative catalog of every physical map:
// canonical id (=== its property key), map-array reference, display name, region,
// type, item list, encounter pool, and encounter/save permissions. MAP_METADATA
// is an alias of it and MAP_REGISTRY is derived from it, so the old
// "do the two independently-authored tables agree?" cross-checks are gone --
// there is only one table to keep sound now. This validates it directly:
// id===key (mandatory), valid map dimensions, no map array shared by two ids
// (a duplicate canonical identity), and the required metadata fields.
//
// Deliberately does NOT force every map type to look the same: a dungeon
// floor's encounterPool is expected to be non-null, a town square's is
// expected to be null -- only the FIELDS themselves (present, right shape)
// are required across all types, not particular values.
function validateMapMetadata() {
  const GROUP = 'Map metadata';
  let checked = 0;
  const catalog = (typeof MAP_CATALOG !== 'undefined') ? MAP_CATALOG
                : (typeof MAP_METADATA !== 'undefined') ? MAP_METADATA : undefined;
  if (typeof catalog === 'undefined') {
    addValidationError(GROUP, 'MAP_CATALOG is undefined -- check script load order (data.js)');
    return checked;
  }

  const VALID_TYPES = new Set(['outdoor', 'town', 'interior', 'dungeon', 'bridge', 'special']);
  const rows = _validationRows(), cols = _validationCols();
  const seenRefs = new Map(); // map array reference -> first id that used it
  for (const [key, m] of Object.entries(catalog)) {
    const lbl = 'MAP_CATALOG[' + key + ']';
    if (!m || typeof m !== 'object') { addValidationError(GROUP, lbl + ': not an object'); continue; }
    checked++;

    if (m.id !== key) addValidationError(GROUP, lbl + ': id "' + m.id + '" does not equal its property key -- the canonical id MUST be the key (no competing id namespace)');

    if (!_isPlainArray(m.map)) {
      addValidationError(GROUP, lbl + ': map is not an array -- points to a missing/undefined constant');
    } else {
      if (m.map.length !== rows) addValidationError(GROUP, lbl + ': map has ' + m.map.length + ' rows (expected ' + rows + ')');
      m.map.forEach((row, r) => {
        if (!_isPlainArray(row) || row.length !== cols)
          addValidationError(GROUP, lbl + ' row ' + r + ': has ' + (_isPlainArray(row) ? row.length : 'non-array') + ' cols (expected ' + cols + ')');
      });
      if (seenRefs.has(m.map))
        addValidationError(GROUP, lbl + ': map array is already registered under id "' + seenRefs.get(m.map) + '" -- one physical map must not have two canonical ids');
      else seenRefs.set(m.map, key);
    }

    if (typeof m.displayName !== 'string' || !m.displayName) addValidationError(GROUP, lbl + ': missing displayName -- breaks the on-screen location banner for this map');

    if (m.region === undefined) addValidationWarning(GROUP, lbl + ': region is undefined (use null explicitly for "no region" rather than omitting the field)');
    else if (m.region !== null && typeof m.region !== 'string') addValidationWarning(GROUP, lbl + ': region is neither a string nor null');

    if (!m.type || !VALID_TYPES.has(m.type)) addValidationError(GROUP, lbl + ': type "' + m.type + '" is not one of ' + [...VALID_TYPES].join('/') + ' -- breaks locationName()\'s outdoor-map fast path');

    if (!_isPlainArray(m.items)) addValidationError(GROUP, lbl + ': items is missing or not an array (use [] explicitly if the map has no pickups) -- breaks currentItemList()');

    if (m.encounterPool !== null && !_isPlainArray(m.encounterPool))
      addValidationError(GROUP, lbl + ': encounterPool is neither null nor an array');
    else if (_isPlainArray(m.encounterPool) && m.encounterPool.length === 0)
      addValidationWarning(GROUP, lbl + ': encounterPool is an empty array (use null for "no pool" by convention, not [])');

    if (typeof m.allowRandomEncounters !== 'boolean') addValidationError(GROUP, lbl + ': allowRandomEncounters is not a boolean');
    else if (m.allowRandomEncounters && m.encounterPool === null) addValidationWarning(GROUP, lbl + ': allowRandomEncounters is true but encounterPool is null (falls back to the generic ENEMY_TEMPLATES pool at runtime -- confirm that\'s intended)');

    if (typeof m.allowSave !== 'boolean') addValidationError(GROUP, lbl + ': allowSave is not a boolean');
  }
  return checked;
}

// ─── 2b. Regional layout (continuous-overworld chunk placement) ─────────────
// REGIONAL_LAYOUT (data.js) is the additive authority for map GEOMETRY on the
// future continuous overworld -- separate from MAP_CATALOG's map IDENTITY. This
// validates that authority and its DERIVED indexes (the same soundness checks
// the layout test asserts, but reachable from the browser console):
//   • every placed map id is a real, OUTDOOR MAP_CATALOG map of the right dims
//     (COLS×ROWS -- verified, not assumed);
//   • integer chunk coordinates; no two maps on the same chunk within a region;
//     no map placed twice across regions;
//   • the derived reverse indexes (regionPlacementForMapId / mapIdForChunk) agree
//     with the authored placements, in both directions (cannot have drifted).
function validateRegionalLayout() {
  const GROUP = 'Regional layout';
  let checked = 0;
  if (typeof REGIONAL_LAYOUT === 'undefined') {
    addValidationError(GROUP, 'REGIONAL_LAYOUT is undefined -- check script load order (data.js)');
    return checked;
  }
  const catalog = (typeof MAP_CATALOG !== 'undefined') ? MAP_CATALOG : {};
  const rows = _validationRows(), cols = _validationCols();
  const seenMapIds = new Map(); // mapId -> regionId it was first placed in (no map placed twice)

  for (const regionId of Object.keys(REGIONAL_LAYOUT)) {
    const region = REGIONAL_LAYOUT[regionId];
    const rlbl = 'REGIONAL_LAYOUT[' + regionId + ']';
    if (!region || !_isPlainArray(region.placements)) {
      addValidationError(GROUP, rlbl + ': missing placements array');
      continue;
    }
    const seenChunks = new Map(); // 'cx,cy' -> mapId (unique chunk positions per region)
    for (const p of region.placements) {
      const plbl = rlbl + ' placement "' + (p && p.mapId) + '"';
      if (!p || typeof p.mapId !== 'string') { addValidationError(GROUP, rlbl + ': a placement has no string mapId'); continue; }
      checked++;

      const entry = catalog[p.mapId];
      if (!entry) {
        addValidationError(GROUP, plbl + ': not a known MAP_CATALOG map id');
      } else {
        if (entry.type !== 'outdoor') addValidationError(GROUP, plbl + ': type "' + entry.type + '" is not outdoor -- the continuous grid holds wilderness maps only');
        if (_isPlainArray(entry.map)) {
          if (entry.map.length !== rows || !_isPlainArray(entry.map[0]) || entry.map[0].length !== cols)
            addValidationError(GROUP, plbl + ': map is ' + entry.map.length + '×' + (_isPlainArray(entry.map[0]) ? entry.map[0].length : '?') + ', expected ' + rows + '×' + cols + ' -- chunks must be uniform');
        }
      }

      if (!Number.isInteger(p.chunkX) || !Number.isInteger(p.chunkY))
        addValidationError(GROUP, plbl + ': chunkX/chunkY must be integers (got ' + p.chunkX + ',' + p.chunkY + ')');

      const ckey = p.chunkX + ',' + p.chunkY;
      if (seenChunks.has(ckey)) addValidationError(GROUP, plbl + ': chunk (' + ckey + ') already occupied by "' + seenChunks.get(ckey) + '" -- two maps cannot share a chunk');
      else seenChunks.set(ckey, p.mapId);

      if (seenMapIds.has(p.mapId)) addValidationError(GROUP, plbl + ': also placed in region "' + seenMapIds.get(p.mapId) + '" -- a map must be placed at most once');
      else seenMapIds.set(p.mapId, regionId);

      // Derived-index consistency (both directions).
      if (typeof regionPlacementForMapId === 'function') {
        const back = regionPlacementForMapId(p.mapId);
        if (!back || back.regionId !== regionId || back.chunkX !== p.chunkX || back.chunkY !== p.chunkY)
          addValidationError(GROUP, plbl + ': regionPlacementForMapId() disagrees with the authored placement (derived index drift)');
      }
      if (typeof mapIdForChunk === 'function' && mapIdForChunk(regionId, p.chunkX, p.chunkY) !== p.mapId)
        addValidationError(GROUP, plbl + ': mapIdForChunk(' + regionId + ',' + ckey + ') does not resolve back to this map (derived index drift)');
    }
  }
  return checked;
}

// ─── 2c. Continuous seams (DEBUG seamless-movement eligible ALIGNS seams) ───
// Cross-checks the DERIVED eligible-seam index (continuous-seams.js) against the
// authoritative REGIONAL_LAYOUT / EDGE_TRANSITIONS / placement + collision data.
// Any discrepancy is an ERROR (do not change authored data to silence it). This
// validation lives in production and does NOT depend on test/transition-audit.js.
function validateContinuousSeams() {
  const GROUP = 'Continuous seams';
  let checked = 0;
  if (typeof continuousSeamEntries !== 'function') { return checked; } // module absent -> nothing to check
  const entries = continuousSeamEntries();
  const INV = { north: 'south', south: 'north', east: 'west', west: 'east' };
  const DELTA = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  const seenDirected = new Set();
  const catalog = (typeof MAP_CATALOG !== 'undefined') ? MAP_CATALOG : {};

  for (const e of entries) {
    checked++;
    const lbl = 'seam ' + e.from + '|' + e.dir + '->' + e.to;
    // known map ids, outdoor
    for (const id of [e.from, e.to]) {
      if (!catalog[id]) addValidationError(GROUP, lbl + ': "' + id + '" is not a MAP_CATALOG map');
      else if (catalog[id].type !== 'outdoor') addValidationError(GROUP, lbl + ': "' + id + '" is not outdoor');
    }
    // no duplicate directed entry
    const dk = e.from + '|' + e.dir;
    if (seenDirected.has(dk)) addValidationError(GROUP, lbl + ': duplicate directed entry');
    seenDirected.add(dk);
    // matching regionId + physical adjacency
    const pf = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(e.from) : null;
    const pt = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(e.to) : null;
    if (!pf || !pt) { addValidationError(GROUP, lbl + ': placement missing'); continue; }
    if (pf.regionId !== e.regionId || pt.regionId !== e.regionId) addValidationError(GROUP, lbl + ': regionId mismatch');
    const d = DELTA[e.dir];
    if (!d || pf.chunkX + d[0] !== pt.chunkX || pf.chunkY + d[1] !== pt.chunkY) addValidationError(GROUP, lbl + ': not physically adjacent in "' + e.dir + '"');
    // reciprocal exists with inverse direction + identical range; agreement with lookup
    const recip = (typeof eligibleContinuousSeam === 'function') ? eligibleContinuousSeam(e.to, INV[e.dir]) : null;
    if (!recip || recip.to !== e.from) addValidationError(GROUP, lbl + ': missing reciprocal ' + e.to + '|' + INV[e.dir]);
    else if (recip.range[0] !== e.range[0] || recip.range[1] !== e.range[1]) addValidationError(GROUP, lbl + ': reciprocal range differs (remap/clamp) ' + JSON.stringify(e.range) + ' vs ' + JSON.stringify(recip.range));
    // indexed lookup agreement
    const looked = (typeof eligibleContinuousSeam === 'function') ? eligibleContinuousSeam(e.from, e.dir) : null;
    if (looked !== e) addValidationError(GROUP, lbl + ': indexed lookup does not return this entry');
    // The underlying EDGE_TRANSITIONS segment must pass the FAIL-CLOSED structural
    // classifier (only recognized structural properties; no condition/blockedText/
    // callback/effect/unknown; targetRange absent or identical to sourceRange).
    const segs = (typeof EDGE_TRANSITIONS !== 'undefined' && EDGE_TRANSITIONS[e.from]) ? EDGE_TRANSITIONS[e.from][e.dir] : null;
    if (!Array.isArray(segs) || segs.length !== 1) addValidationError(GROUP, lbl + ': underlying edge is not a single broad segment');
    else {
      const s = segs[0];
      if (typeof classifyContinuousSegment === 'function') {
        const c = classifyContinuousSegment(s);
        if (!c.ok) addValidationError(GROUP, lbl + ': underlying segment is not structurally seamless-eligible -- ' + c.reason);
      }
      if (s.targetEdge !== INV[e.dir]) addValidationError(GROUP, lbl + ': targetEdge is not the inverse of the direction');
      if (!Array.isArray(s.sourceRange) || s.sourceRange[0] !== e.range[0] || s.sourceRange[1] !== e.range[1]) addValidationError(GROUP, lbl + ': derived range disagrees with EDGE_TRANSITIONS sourceRange');
    }
    // base-walkable source + landing coordinates across the whole range, both edges
    if (typeof mapRefForId === 'function' && typeof isTileWalkable === 'function') {
      const fromRef = mapRefForId(e.from), toRef = mapRefForId(e.to);
      const rows = _validationRows(), cols = _validationCols();
      const edgeTile = (ref, edge, along) => {
        if (!Array.isArray(ref)) return undefined;
        if (edge === 'north') return ref[0] ? ref[0][along] : undefined;
        if (edge === 'south') return ref[rows - 1] ? ref[rows - 1][along] : undefined;
        if (edge === 'west')  return ref[along] ? ref[along][0] : undefined;
        return ref[along] ? ref[along][cols - 1] : undefined; // east
      };
      for (let along = e.range[0]; along <= e.range[1]; along++) {
        if (!isTileWalkable(edgeTile(fromRef, e.dir, along))) { addValidationError(GROUP, lbl + ': source edge not walkable at ' + along); break; }
        if (!isTileWalkable(edgeTile(toRef, INV[e.dir], along))) { addValidationError(GROUP, lbl + ': landing edge not walkable at ' + along); break; }
      }
    }
    // no solid NPC on an eligible seam map (the safety band the cross-seam
    // collision relies on) -- if this ever fires, reconsider the seam's eligibility.
    // Uses the PURE outdoorContentKeyForMapId() authority (no activeMap probe).
    if (typeof SIMPLE_NPCS !== 'undefined' && typeof outdoorContentKeyForMapId === 'function') {
      const key = outdoorContentKeyForMapId(e.from);
      if (key && SIMPLE_NPCS.some((n) => n.map === key && n.solid))
        addValidationWarning(GROUP, lbl + ': "' + e.from + '" has a solid NPC on it -- cross-seam NPC collision applies, but confirm the seam is still safe to make seamless');
    }
  }
  return checked;
}

// ─── 2d. Continuous outdoor content-key authority (neighbouring-content render) ─
// Validates the declarative OUTDOOR_CONTENT_KEYS authority (data.js), which
// currentContentLocationKey() also consumes: it must bind EXACTLY the region-placed
// outdoor maps (no missing, no stray non-outdoor id), and any map that actually
// OWNS NPC content must have an UNAMBIGUOUS key (one placed outdoor map per key) so
// neighbouring NPCs can be attributed to the right chunk. A shared/fallback key
// (e.g. 'overworld') with no NPCs is fine (NPC rendering is simply skipped for it);
// a shared key WITH NPCs is an error. Pure — no runtime probing.
function validateContinuousContent() {
  const GROUP = 'Continuous content';
  let checked = 0;
  if (typeof outdoorContentKeyEntries !== 'function' || typeof OUTDOOR_CONTENT_KEYS === 'undefined') return checked;
  const entries = outdoorContentKeyEntries();
  const boundIds = new Set(entries.map((e) => e.mapId));
  const hasNpcs = (key) => (typeof SIMPLE_NPCS !== 'undefined') && SIMPLE_NPCS.some((n) => n.map === key);

  // Coverage: every region-placed OUTDOOR map is bound exactly once.
  if (typeof REGIONAL_LAYOUT !== 'undefined' && typeof mapEntryForId === 'function') {
    for (const regionId of Object.keys(REGIONAL_LAYOUT)) {
      const region = REGIONAL_LAYOUT[regionId];
      if (!region || !_isPlainArray(region.placements)) continue;
      for (const p of region.placements) {
        const e = mapEntryForId(p.mapId);
        if (e && e.type === 'outdoor' && !boundIds.has(p.mapId))
          addValidationError(GROUP, 'placed outdoor map "' + p.mapId + '" is missing from OUTDOOR_CONTENT_KEYS');
      }
    }
  }
  for (const e of entries) {
    checked++;
    if (!e.key) { addValidationError(GROUP, 'outdoor map "' + e.mapId + '" has no content-location key'); continue; }
    // No stray bindings for non-placed-outdoor maps.
    const cat = (typeof mapEntryForId === 'function') ? mapEntryForId(e.mapId) : null;
    if (!cat || cat.type !== 'outdoor') addValidationError(GROUP, 'OUTDOOR_CONTENT_KEYS binds "' + e.mapId + '" which is not a placed outdoor map');
    else if (typeof regionPlacementForMapId === 'function' && !regionPlacementForMapId(e.mapId))
      addValidationError(GROUP, 'OUTDOOR_CONTENT_KEYS binds "' + e.mapId + '" which is not region-placed');
    if (!e.unambiguous && hasNpcs(e.key))
      addValidationError(GROUP, 'placed outdoor map "' + e.mapId + '" owns NPC content under an AMBIGUOUS content key "' + e.key + '" (shared by multiple outdoor maps) -- cannot attribute neighbouring NPCs unambiguously');
  }
  // Decoration-registry keys must be real placed outdoor maps.
  if (typeof OUTDOOR_MAP_DECOR !== 'undefined') {
    for (const id of Object.keys(OUTDOOR_MAP_DECOR)) {
      if (!boundIds.has(id)) addValidationError(GROUP, 'OUTDOOR_MAP_DECOR key "' + id + '" is not a region-placed outdoor map');
    }
  }
  return checked;
}

// ─── 3. Tiles (and point/special transition tiles) ─────────────────────────
// Scans every tile actually used across every MAP_METADATA-registered map.
// "Known tile" is decided via tiles.js's DEBUG_TILE_NAMES list (the same
// list the debug map inspector uses for its "tile name" display) rather
// than re-deriving a second registry here -- see tiles.js's comment on why
// that list is a curated allowlist, not a `window` scan.
//
// Point/special transition tiles (town/dungeon entrances, stairs, bridge
// gates, doors, world-map exits) are identified the same way the debug
// inspector's "nearby transition" heuristic does: by name keyword
// (EXIT/ENTRANCE/DOOR/GATE/STAIRS). This is deliberately lighter-weight than
// test/transition-audit.js's exhaustive per-function landing-position audit
// (which actually calls every enter*/exit*() and checks the real landing
// tile) -- that audit already covers correctness exhaustively in the test
// suite; this is the browser-console-reachable structural sanity check:
// every such tile must at least be walkable (so it can be reached), and
// shouldn't appear in implausible bulk on a single map (a common
// copy-paste-into-too-many-cells mistake).
// Two groups come out of this one function: 'Tiles' for the pre-existing
// checks (unknown tile ids via WALKABLE[]/DEBUG_TILE_NAMES, transition-tile
// walkability/bulk-usage), and 'Tile Properties' for everything driven by
// the newer TILE_PROPERTIES registry (tiles.js) -- kept as two labels
// rather than a second function, per the brief ("integrate into the
// existing validation system, don't create a separate validation path"),
// since it's still one pass over the same map data either way.
function validateTiles() {
  const GROUP = 'Tiles';
  const PROPS_GROUP = 'Tile Properties';
  let checked = 0;
  if (typeof MAP_METADATA === 'undefined' || typeof WALKABLE === 'undefined') {
    addValidationWarning(GROUP, 'MAP_METADATA or WALKABLE unavailable -- tile validation skipped');
    return checked;
  }

  const knownNames = (typeof DEBUG_TILE_NAMES !== 'undefined') ? DEBUG_TILE_NAMES : [];
  const nameById = new Map();
  for (const name of knownNames) {
    const val = window[name];
    if (typeof val === 'number' && !nameById.has(val)) nameById.set(val, name);
  }
  const TRANSITION_KEYWORDS = ['EXIT', 'ENTRANCE', 'DOOR', 'GATE', 'STAIRS'];
  const seenUnknownTiles   = new Set(); // avoid repeating the same message per identical (map, tile) pair
  const seenNoPropsTiles   = new Set();
  const seenDeprecatedUsed = new Set();
  const seenNotRenderable  = new Set();

  const hasTileProperties = typeof TILE_PROPERTIES !== 'undefined';
  const hasRenderable     = typeof RENDERABLE_TILE_IDS !== 'undefined';

  // ── TILE_PROPERTIES registry shape -- every entry, used in a map or not ──
  // (a future tile added to the registry before any map uses it yet should
  // still be validated, not skipped until it's placed somewhere).
  if (hasTileProperties) {
    for (const [key, props] of Object.entries(TILE_PROPERTIES)) {
      const tileId = Number(key);
      const lbl = 'TILE_PROPERTIES[' + tileId + ']' + (props && props.debugName ? ' (' + props.debugName + ')' : '');
      if (!props || typeof props !== 'object') { addValidationError(PROPS_GROUP, lbl + ': not an object'); continue; }

      if (props.id !== tileId) addValidationError(PROPS_GROUP, lbl + ': id ' + props.id + ' does not match its own property key');
      if (!props.name) addValidationError(PROPS_GROUP, lbl + ': missing name');
      if (typeof props.walkable !== 'boolean') addValidationError(PROPS_GROUP, lbl + ': walkable is not a boolean');
      if (typeof props.encounterEligible !== 'boolean') addValidationError(PROPS_GROUP, lbl + ': encounterEligible is not a boolean (use false explicitly, not undefined/omitted, for "never eligible")');
      if (!props.category) addValidationWarning(PROPS_GROUP, lbl + ': missing/vague category');
      if (!props.debugName && !props.deprecated) addValidationWarning(PROPS_GROUP, lbl + ': no debugName -- debug inspector/validation messages for this tile will be harder to identify');
      // Note: isSecret tiles deliberately render as some OTHER tile's art
      // (drawTile() gives them the disguise's case, not their own look):
      // FALSE_WALL 38, DUNGEON_FALSE_WALL 72, WORLD_HOLLOW 73,
      // INTERIOR_FALSE_WALL 74, TAKOMO_GATE 75, MEADOW_HIDDEN_ENTRANCE 93,
      // SLUICE_SECRET_ENTRANCE 99 (plain SLUICE_WALL). Partner return tiles (e.g.
      // SLUICE_SECRET_EXIT 100, drawn as ordinary floor + shadow) are NOT
      // isSecret. Nothing here can catch a disguised tile whose drawTile()
      // case drifts to look distinctive -- that stays a by-hand check.
      if (props.isSecret && props.walkable === false) addValidationWarning(PROPS_GROUP, lbl + ': marked isSecret but not walkable -- a secret passage that can\'t be walked on isn\'t much of a passage; confirm intentional');
      if (props.isDecorative && props.walkable === true) addValidationWarning(PROPS_GROUP, lbl + ': marked isDecorative and also walkable -- confirm intentional (most decorative tiles are meant to block; NOTICE_BOARD is a deliberate, documented exception)');

      if (typeof WALKABLE !== 'undefined' && WALKABLE[tileId] !== undefined && typeof props.walkable === 'boolean' && WALKABLE[tileId] !== props.walkable)
        addValidationError(PROPS_GROUP, lbl + ': WALKABLE[' + tileId + ']=' + WALKABLE[tileId] + ' disagrees with TILE_PROPERTIES.walkable=' + props.walkable);
    }
  } else {
    addValidationWarning(PROPS_GROUP, 'TILE_PROPERTIES is undefined -- check script load order (tiles.js)');
  }

  // ── Every tile actually used across every registered map ────────────────
  for (const [mapKey, m] of Object.entries(MAP_METADATA)) {
    if (!_isPlainArray(m.map)) continue;
    const lbl = 'MAP_METADATA[' + mapKey + ']';
    const transitionTileCounts = new Map(); // tileId -> count, this map only

    m.map.forEach((row, r) => {
      if (!_isPlainArray(row)) return;
      row.forEach((tile, c) => {
        checked++;
        const known = nameById.has(tile);
        const hasWalkable = WALKABLE[tile] !== undefined;

        if (!hasWalkable) {
          addValidationError(GROUP, lbl + ' [r' + r + ',c' + c + ']: tile ' + tile + ' has no WALKABLE entry -- collision for this tile is undefined');
        } else if (!known && !seenUnknownTiles.has(mapKey + ':' + tile)) {
          // Has a WALKABLE entry but isn't in the curated name list -- not
          // necessarily broken (it renders/collides fine), but likely means
          // DEBUG_TILE_NAMES (tiles.js) needs updating for a newly-added tile.
          addValidationWarning(GROUP, lbl + ': tile ' + tile + ' is not in DEBUG_TILE_NAMES (tiles.js) -- debug inspector will show it as unnamed; likely just needs adding there');
          seenUnknownTiles.add(mapKey + ':' + tile);
        }

        if (hasTileProperties) {
          const props = TILE_PROPERTIES[tile];
          if (!props && !seenNoPropsTiles.has(mapKey + ':' + tile)) {
            addValidationError(PROPS_GROUP, lbl + ' [r' + r + ',c' + c + ']: tile ' + tile + ' used in this map has no TILE_PROPERTIES entry');
            seenNoPropsTiles.add(mapKey + ':' + tile);
          } else if (props && props.deprecated && !seenDeprecatedUsed.has(mapKey + ':' + tile)) {
            addValidationError(PROPS_GROUP, lbl + ': deprecated tile ' + tile + ' (' + (props.name || '?') + ') is used in this map -- retired tiles should not appear in any registered map');
            seenDeprecatedUsed.add(mapKey + ':' + tile);
          }
        }
        if (hasRenderable && !RENDERABLE_TILE_IDS.has(tile) && !seenNotRenderable.has(mapKey + ':' + tile)) {
          addValidationError(PROPS_GROUP, lbl + ' [r' + r + ',c' + c + ']: tile ' + tile + ' used in this map has no case in drawTile() (render-tiles.js) -- will render as nothing');
          seenNotRenderable.add(mapKey + ':' + tile);
        }

        const name = nameById.get(tile);
        if (name && TRANSITION_KEYWORDS.some(k => name.includes(k))) {
          if (!WALKABLE[tile])
            addValidationError(GROUP, lbl + ' [r' + r + ',c' + c + ']: transition tile ' + name + ' (' + tile + ') is not walkable -- it can never be reached to trigger its transition');
          if (hasTileProperties && TILE_PROPERTIES[tile] && !TILE_PROPERTIES[tile].isTransition)
            addValidationWarning(PROPS_GROUP, lbl + ': tile ' + tile + ' (' + name + ') looks like a transition tile by name but TILE_PROPERTIES doesn\'t mark it isTransition: true');
          transitionTileCounts.set(tile, (transitionTileCounts.get(tile) || 0) + 1);
        }
      });
    });

    for (const [tileId, count] of transitionTileCounts) {
      if (count > 10) {
        const name = nameById.get(tileId) || tileId;
        addValidationWarning(GROUP, lbl + ': transition tile ' + name + ' appears ' + count + ' times -- unusually large for a single-purpose transition tile, confirm this is intentional (e.g. a broad open edge rather than a copy-paste mistake)');
      }
    }
  }
  return checked;
}

// ─── 4. Edge transitions ────────────────────────────────────────────────────
// If EDGE_TRANSITIONS (world-transitions.js) exists, validates every segment
// against the same rules tryEdgeTransition() relies on at runtime: real
// source/target maps, a real direction/edge, a well-formed and in-bounds
// range, and — for EVERY walkable source-edge coordinate — that its exact
// clamped landing (via the shared edgeTransitionLanding() helper) is in-bounds
// and base-walkable, so no reachable crossing can strand the player on a
// blocked tile. Also: a condition function that can safely be called without
// throwing, and (as a warning, not an error, since one-way links are a real,
// supported pattern) a reciprocal link back from the target map.
function validateEdgeTransitions() {
  const GROUP = 'EDGE_TRANSITIONS';
  let checked = 0;
  if (typeof EDGE_TRANSITIONS === 'undefined') {
    addValidationWarning(GROUP, 'EDGE_TRANSITIONS is undefined -- skipped (fine if this codebase doesn\'t use it yet)');
    return checked;
  }
  if (typeof MAP_METADATA === 'undefined' || typeof WALKABLE === 'undefined') {
    addValidationWarning(GROUP, 'MAP_METADATA or WALKABLE unavailable -- edge transition validation skipped');
    return checked;
  }

  const VALID_DIRECTIONS = new Set(['north', 'south', 'east', 'west']);
  const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' };
  const rows = _validationRows(), cols = _validationCols();

  // Resolves a target (map array or MAP_REGISTRY/MAP_METADATA id string) to
  // { mapId, map } or null.
  function resolveTarget(targetMap) {
    if (typeof targetMap === 'string') {
      const meta = MAP_METADATA[targetMap];
      if (meta) return { mapId: targetMap, map: meta.map };
      if (typeof MAP_REGISTRY !== 'undefined' && MAP_REGISTRY[targetMap]) return { mapId: targetMap, map: MAP_REGISTRY[targetMap].map };
      return null;
    }
    if (_isPlainArray(targetMap)) {
      const mapId = (typeof mapRegistryId === 'function') ? mapRegistryId(targetMap) : null;
      return { mapId: mapId, map: targetMap };
    }
    return null;
  }

  // Landing coordinates are computed by the shared edgeTransitionLanding()
  // helper (world-transitions.js) — the SAME clamp + edge-mapping tryEdge-
  // Transition() applies at runtime — so validation can't drift from behavior.

  // A reverse index of every segment seen, for the reciprocal-link check
  // below: key = sourceMapId + '|' + targetMapId, value = set of
  // (targetEdge) values used from source -> target.
  const linksSeen = new Map();

  for (const [sourceMapId, directions] of Object.entries(EDGE_TRANSITIONS)) {
    const sourceMeta = MAP_METADATA[sourceMapId];
    const sourceLbl = sourceMapId;
    if (!sourceMeta || !_isPlainArray(sourceMeta.map)) {
      addValidationError(GROUP, sourceLbl + ': source map does not exist in MAP_METADATA');
      continue;
    }

    for (const [direction, segments] of Object.entries(directions)) {
      if (!VALID_DIRECTIONS.has(direction)) {
        addValidationError(GROUP, sourceLbl + ' "' + direction + '": not a valid direction (must be north/south/east/west)');
        continue;
      }
      if (!_isPlainArray(segments)) {
        addValidationError(GROUP, sourceLbl + ' ' + direction + ': segments is not an array');
        continue;
      }

      segments.forEach((seg, i) => {
        const segLbl = sourceLbl + ' ' + direction + ' [' + i + ']';
        checked++;

        const target = resolveTarget(seg.targetMap);
        if (!target || !_isPlainArray(target.map)) {
          addValidationError(GROUP, segLbl + ': target map "' + seg.targetMap + '" does not exist');
          return;
        }
        const targetLbl = sourceLbl + ' ' + direction + ' → ' + (target.mapId || '?');

        if (!VALID_DIRECTIONS.has(seg.targetEdge)) {
          addValidationError(GROUP, targetLbl + ': targetEdge "' + seg.targetEdge + '" is not a valid edge');
          return;
        }
        if (seg.targetEdge !== OPPOSITE[direction] && !seg.allowNonOppositeEdge) {
          addValidationWarning(GROUP, targetLbl + ': targetEdge "' + seg.targetEdge + '" is not the opposite of "' + direction + '" (expected "' + OPPOSITE[direction] + '") -- set allowNonOppositeEdge: true if this L-shaped join is intentional');
        }

        // Source range: valid shape, in bounds.
        const srcMax = (direction === 'north' || direction === 'south') ? cols - 1 : rows - 1;
        if (!_isPlainArray(seg.sourceRange) || seg.sourceRange.length !== 2 ||
            !_isFiniteNumber(seg.sourceRange[0]) || !_isFiniteNumber(seg.sourceRange[1])) {
          addValidationError(GROUP, targetLbl + ': sourceRange is missing or malformed (expected [min, max])');
          return;
        }
        const [srcMin, srcMaxVal] = seg.sourceRange;
        if (srcMin > srcMaxVal) addValidationError(GROUP, targetLbl + ': sourceRange min (' + srcMin + ') is greater than max (' + srcMaxVal + ')');
        if (srcMin < 0 || srcMaxVal > srcMax) addValidationError(GROUP, targetLbl + ': sourceRange [' + srcMin + ', ' + srcMaxVal + '] is out of bounds (0-' + srcMax + ')');

        // Target range (optional; defaults to sourceRange -- same shape rules).
        let tgtMin = srcMin, tgtMaxVal = srcMaxVal;
        const tgtMax = (seg.targetEdge === 'north' || seg.targetEdge === 'south') ? cols - 1 : rows - 1;
        if (seg.targetRange !== undefined) {
          if (!_isPlainArray(seg.targetRange) || seg.targetRange.length !== 2 ||
              !_isFiniteNumber(seg.targetRange[0]) || !_isFiniteNumber(seg.targetRange[1])) {
            addValidationError(GROUP, targetLbl + ': targetRange is present but malformed (expected [min, max])');
          } else {
            [tgtMin, tgtMaxVal] = seg.targetRange;
            if (tgtMin > tgtMaxVal) addValidationError(GROUP, targetLbl + ': targetRange min (' + tgtMin + ') is greater than max (' + tgtMaxVal + ')');
            if (tgtMin < 0 || tgtMaxVal > tgtMax) addValidationError(GROUP, targetLbl + ': targetRange [' + tgtMin + ', ' + tgtMaxVal + '] is out of bounds (0-' + tgtMax + ')');
          }
        }

        // Per-source-coordinate landing check (strengthened). For EVERY walkable
        // source-edge coordinate the transition can actually be triggered from,
        // apply the exact clamp + edge-mapping formula tryEdgeTransition() uses
        // (via the shared edgeTransitionLanding() helper) and require the SPECIFIC
        // computed landing to be in-bounds and base-walkable. The old aggregate
        // "at least one walkable source and at least one walkable target" check
        // could pass a segment where some walkable source coordinates still
        // clamp onto a blocked landing; this catches each such coordinate.
        const sourceEdgeRow = (direction === 'north') ? 0 : (direction === 'south') ? rows - 1 : null;
        const sourceEdgeCol = (direction === 'west') ? 0 : (direction === 'east') ? cols - 1 : null;
        const tRows = target.map.length, tCols = target.map[0] ? target.map[0].length : 0;
        let walkableSourceCount = 0;
        for (let along = Math.max(0, srcMin); along <= Math.min(srcMax, srcMaxVal); along++) {
          const r = sourceEdgeRow !== null ? sourceEdgeRow : along;
          const c = sourceEdgeCol !== null ? sourceEdgeCol : along;
          const srow = sourceMeta.map[r];
          if (!srow || !WALKABLE[srow[c]]) continue; // blocked source tile: can't stand there, can't trigger
          walkableSourceCount++;

          const landing = (typeof edgeTransitionLanding === 'function')
            ? edgeTransitionLanding(seg, along)
            : null;
          if (!landing) {
            addValidationError(GROUP, targetLbl + ': cannot compute a landing for source ' + (sourceEdgeRow !== null ? 'col' : 'row') + ' ' + along + ' (targetEdge "' + seg.targetEdge + '")');
            continue;
          }
          const detail = ' [' + i + '] src ' + (sourceEdgeRow !== null ? 'col' : 'row') + ' ' + along
            + ' → ' + (target.mapId || '?') + ' landing (col ' + landing.col + ', row ' + landing.row + ')';
          if (landing.row < 0 || landing.row >= tRows || landing.col < 0 || landing.col >= tCols) {
            addValidationError(GROUP, targetLbl + detail + ': computed landing is OUT OF BOUNDS on the target map');
            continue;
          }
          const trow = target.map[landing.row];
          if (!trow || !WALKABLE[trow[landing.col]]) {
            addValidationError(GROUP, targetLbl + detail + ': computed landing is NOT base-walkable -- a crossing from this source coordinate would strand the player on a blocked tile');
          }
        }
        if (walkableSourceCount === 0)
          addValidationError(GROUP, targetLbl + ': no walkable tile anywhere in sourceRange [' + srcMin + ', ' + srcMaxVal + '] on the ' + direction + ' edge -- this transition can never be triggered');

        // Condition function safety: must be callable without throwing.
        if (seg.condition !== undefined) {
          if (typeof seg.condition !== 'function') {
            addValidationError(GROUP, targetLbl + ': condition is present but not a function');
          } else {
            try { seg.condition(); }
            catch (e) { addValidationError(GROUP, targetLbl + ': condition() threw when called (' + (e && e.message || e) + ') -- would break tryEdgeTransition() at runtime'); }
          }
        }

        if (seg.blockedText !== undefined && (typeof seg.blockedText !== 'string' || !seg.blockedText))
          addValidationWarning(GROUP, targetLbl + ': blockedText is present but not a non-empty string');

        if (target.mapId) {
          const key = sourceMapId + '|' + target.mapId;
          if (!linksSeen.has(key)) linksSeen.set(key, new Set());
          linksSeen.get(key).add(direction);
        }
      });
    }
  }

  // Reciprocal link check: for every A -> B segment, is there a B -> A
  // segment back (any direction, since the exact opposite-edge check above
  // already flags direction/edge mismatches on its own)? Skipped entirely
  // for segments explicitly marked oneWay: true.
  for (const [sourceMapId, directions] of Object.entries(EDGE_TRANSITIONS)) {
    for (const [direction, segments] of Object.entries(directions)) {
      if (!_isPlainArray(segments)) continue;
      for (const seg of segments) {
        if (seg.oneWay) continue;
        const target = resolveTarget(seg.targetMap);
        if (!target || !target.mapId) continue;
        const backKey = target.mapId + '|' + sourceMapId;
        if (!linksSeen.has(backKey)) {
          addValidationWarning(GROUP, sourceMapId + ' ' + direction + ' → ' + target.mapId + ': no reciprocal EDGE_TRANSITIONS link found back from ' + target.mapId + ' -- likely fine if this is a one-way link (set oneWay: true to silence), otherwise the return trip may be missing');
        }
      }
    }
  }

  return checked;
}

// ─── 5. NPCs ────────────────────────────────────────────────────────────────
// Validates SIMPLE_NPCS (npcs.js) and NPC_REGISTRY (the same objects,
// re-keyed) together, plus the two smaller cross-checks that used to be
// their own numbered sections: action strings resolve in NPC_ACTIONS, and
// house: map references resolve in HOUSE_DATA.
function validateNPCs() {
  const GROUP = 'NPCs';
  let checked = 0;
  if (typeof SIMPLE_NPCS === 'undefined') {
    addValidationWarning(GROUP, 'SIMPLE_NPCS is undefined -- NPC validation skipped');
    return checked;
  }

  // The logical content-location keys currentContentLocationKey() returns --
  // the only valid values for npc.map. Kept here (not derived from MAP_CATALOG,
  // whose keys are canonical PHYSICAL map ids) because this is a genuinely
  // separate namespace -- see movement.js's currentContentLocationKey().
  const VALID_CONTENT_LOCATION_KEYS = new Set([
    'overworld',
    'map2', 'map3', 'map_n1', 'map_n2', 'map4', 'map3_n1', 'map3_n2',
    'north_basin_s', 'north_basin_c', 'north_basin_sw', 'north_basin_w',
    'dungeon1', 'dungeon2', 'dungeon3', 'dungeon4', 'dungeon5',
    'dungeon_entrance',
    'sluice', 'sluice2', 'sluice3',
    'town', 'inn', 'office', 'school', 'apt', 'east', 'west',
    'lorra_house', 'maren_post', 'drenwick_post', 'bridge_post',
    'smuggler_fort', 'takomo_chamber', 'mire_vault', 'hamlet_interior',
    'fen_brewery',
    'drenwick_inn', 'drenwick_office', 'drenwick_harbormaster',
    'drenwick_wash_house', 'drenwick_provision_store', 'drenwick_guild_hall', 'drenwick_infirmary',
    'drenwick_tavern', 'drenwick_school_ground', 'drenwick_school_upper',
    'drenwick_school_basement',
    'drenwick_west_residential', 'drenwick_canal_docks',
    'drenwick_east_outskirts', 'drenwick_market', 'drenwick_post_office',
    'drenwick_waterfront', 'drenwick_civic',
  ]);
  const VALID_SPRITE_TYPES = new Set(['clerk', 'patron', 'child', 'worker', 'traveler', 'cat']);
  const houseIds = (typeof HOUSE_DATA !== 'undefined') ? new Set(Object.keys(HOUSE_DATA)) : null;
  const actionsKnown = (typeof NPC_ACTIONS !== 'undefined');

  const seenIds = new Set();
  // Solid-NPC overlap detection groups by (resolved map string, day) since
  // that's the actual runtime key drawSimpleNPCs()/canWalk() filter on;
  // NPCs with a dynamic .map getter are grouped under whatever they
  // currently resolve to (see the getter note below).
  const solidByMapDay = new Map();

  for (const npc of SIMPLE_NPCS) {
    checked++;
    const lbl = 'SIMPLE_NPCS[' + (npc.id || '?') + ']';

    if (!npc.id) addValidationError(GROUP, lbl + ': missing id');
    else if (seenIds.has(npc.id)) addValidationError(GROUP, lbl + ': duplicate id "' + npc.id + '"');
    else seenIds.add(npc.id);

    if (npc.x == null || npc.y == null) addValidationError(GROUP, lbl + ': missing x/y');

    // npc.map can be a getter (dynamic, e.g. day-off house assignments) --
    // evaluating it here just reads whatever it currently resolves to. That
    // covers "the state the game is in right now" safely (no different from
    // rendering reading it every frame); it does NOT enumerate every
    // possible day/flag combination a getter might branch on, which would
    // require unsafely guessing at internal quest state. Per the brief:
    // validate the obvious current state, warn rather than error on
    // anything a getter-based map can't be fully checked for.
    let mapVal;
    try { mapVal = npc.map; }
    catch (e) { addValidationWarning(GROUP, lbl + ': npc.map getter threw when evaluated (' + (e && e.message || e) + ')'); mapVal = undefined; }

    if (mapVal === undefined) {
      addValidationError(GROUP, lbl + ': map is undefined (use null explicitly for "no current map", e.g. a day-off NPC)');
    } else if (mapVal !== null && typeof mapVal === 'string') {
      const base = mapVal.startsWith('house:') ? 'house' : mapVal;
      if (base === 'house') {
        const houseId = mapVal.slice(6);
        if (houseIds && !houseIds.has(houseId)) addValidationError(GROUP, lbl + ': map "' + mapVal + '" -- house id "' + houseId + '" not in HOUSE_DATA');
      } else if (!VALID_CONTENT_LOCATION_KEYS.has(base)) {
        addValidationWarning(GROUP, lbl + ': content-location key "' + mapVal + '" is not in the known currentContentLocationKey() list -- confirm it\'s a real, reachable location key (this list is a maintained cross-check, not derived automatically, so a genuinely new area can trip this once until the list is updated)');
      }

      // In-bounds + walkability, only meaningful once we know which real
      // map array this resolves to.
      if (npc.x != null && npc.y != null) {
        const rows = _validationRows(), cols = _validationCols();
        const tx = npc.x / TILE, ty = npc.y / TILE;
        if (tx < 0 || tx >= cols) addValidationError(GROUP, lbl + ': x=' + npc.x + ' (tile ' + tx.toFixed(2) + ') outside valid tile columns 0-' + (cols - 1));
        if (ty < 0 || ty >= rows) addValidationError(GROUP, lbl + ': y=' + npc.y + ' (tile ' + ty.toFixed(2) + ') outside valid tile rows 0-' + (rows - 1));

        if (npc.solid) {
          // Group by the FULL resolved map value (e.g. "house:apt_maret"),
          // not the collapsed "house" bucket used for the id-validity check
          // above -- collapsing every house into one bucket would treat
          // every solid NPC in every different house as if they shared a
          // room, producing overlap warnings between NPCs that are nowhere
          // near each other.
          const dayKey = mapVal + '|' + (typeof day !== 'undefined' ? day : '?');
          if (!solidByMapDay.has(dayKey)) solidByMapDay.set(dayKey, []);
          solidByMapDay.get(dayKey).push({ id: npc.id, x: npc.x, y: npc.y });
        }
      }
    }
    // mapVal === null is valid (no current map, e.g. a day-off NPC) -- no check needed.

    // null is a legitimate, established value here (e.g. pip, mirethyst) --
    // "no static dialogue, the action callback sets dialogue.pages itself at
    // runtime", same intent as the `dialogue: []` convention used elsewhere.
    if (npc.dialogue !== undefined && npc.dialogue !== null) {
      if (!_isPlainArray(npc.dialogue)) {
        addValidationError(GROUP, lbl + ': dialogue is neither an array nor null');
      } else {
        npc.dialogue.forEach((page, i) => {
          if (!_isPlainArray(page)) addValidationError(GROUP, lbl + ': dialogue page ' + i + ' is not an array of lines');
          else page.forEach((line, j) => {
            if (typeof line !== 'string') addValidationError(GROUP, lbl + ': dialogue page ' + i + ' line ' + j + ' is not a string');
          });
        });
      }
    }

    if (npc.flag_required !== undefined && npc.flag_required !== null && typeof npc.flag_required !== 'string')
      addValidationWarning(GROUP, lbl + ': flag_required is set but is not a string or null');
    if (npc.flag_sets !== undefined && npc.flag_sets !== null && typeof npc.flag_sets !== 'string')
      addValidationWarning(GROUP, lbl + ': flag_sets is set but is not a string or null');

    if (npc.spriteType !== undefined && !VALID_SPRITE_TYPES.has(npc.spriteType))
      addValidationWarning(GROUP, lbl + ': spriteType "' + npc.spriteType + '" is not a known type (falls back to \'clerk\' at runtime, so not fatal -- likely a typo)');

    if (npc.action !== undefined && npc.action !== null) {
      const t = typeof npc.action;
      if (t === 'string') {
        if (actionsKnown && NPC_ACTIONS[npc.action] === undefined) addValidationError(GROUP, lbl + ': action "' + npc.action + '" not found in NPC_ACTIONS');
      } else if (t !== 'function') {
        addValidationError(GROUP, lbl + ': action has unexpected type "' + t + '" (expected function, string, null, or undefined)');
      }
    }

    // ── Optional future `movement` property (Phase 0 contract) ─────────────
    // Purely additive: no current NPC has `movement`, so this block does
    // nothing for the present game. See architecture.md's "Future NPC
    // movement contract" for the schema. Waypoints are authored in TILE
    // units (4.5 = centre of column 4), unlike npc.x/npc.y which are pixels.
    // Full route WALKABILITY validation is deliberately deferred to Phase 1:
    // checking segments against WALKABLE/solids here would duplicate
    // canWalk()'s runtime collision logic and create a second source of
    // truth — Phase 1 must expose a route check that calls the real path.
    if (npc.movement !== undefined) {
      const mv = npc.movement;
      // All three types are implemented in Phase 1 (movement.js's
      // startNpcRoute()/updateNpcRoutes()/ensureAutoMovers()): 'scriptedRoute'
      // is the one-way route used by the two bridge-guard pilots; 'patrol' is
      // the looping waypoint route (optionally autoStart, per-waypoint dwell)
      // used by Tobb Wend; 'boundedWander' is the intermittent random wander
      // within an authored tile region used by Tomas.
      const MOVEMENT_TYPES = new Set(['patrol', 'scriptedRoute', 'boundedWander', 'flee']);
      if (mv === null || typeof mv !== 'object' || Array.isArray(mv)) {
        addValidationError(GROUP, lbl + ': movement must be a plain object (see architecture.md movement contract)');
      } else {
        const rows = _validationRows(), cols = _validationCols();
        if (!MOVEMENT_TYPES.has(mv.type))
          addValidationError(GROUP, lbl + ': movement.type "' + mv.type + '" is not a recognized movement type (' + [...MOVEMENT_TYPES].join(', ') + ')');
        if (mv.type === 'scriptedRoute' && mv.loop === true)
          addValidationError(GROUP, lbl + ': movement.loop must be false for a scriptedRoute (one-way, plays once when explicitly started)');
        // autoStart (auto-initialise on map presence) is patrol-only, boolean.
        if (mv.autoStart !== undefined && typeof mv.autoStart !== 'boolean')
          addValidationError(GROUP, lbl + ': movement.autoStart must be a boolean');
        if (mv.autoStart === true && mv.type !== 'patrol')
          addValidationError(GROUP, lbl + ': movement.autoStart is only meaningful for a patrol (scriptedRoutes start explicitly)');

        if (mv.type === 'boundedWander' || mv.type === 'flee') {
          // Region-bounded movers (a wanderer, or the feral cat's flee) roam a
          // region, not a route: waypoints are incompatible; bounds are required.
          if (mv.waypoints !== undefined)
            addValidationError(GROUP, lbl + ': a ' + mv.type + ' must not have waypoints (it moves within bounds, not along a route)');
          const b = mv.bounds;
          if (b === null || typeof b !== 'object' || Array.isArray(b)) {
            addValidationError(GROUP, lbl + ': ' + mv.type + ' requires a bounds object { minCol, maxCol, minRow, maxRow } (tile units)');
          } else {
            const bkeys = ['minCol', 'maxCol', 'minRow', 'maxRow'];
            bkeys.forEach(k => { if (!_isFiniteNumber(b[k])) addValidationError(GROUP, lbl + ': movement.bounds.' + k + ' must be a finite number (tile units)'); });
            if (bkeys.every(k => _isFiniteNumber(b[k]))) {
              if (b.minCol > b.maxCol) addValidationError(GROUP, lbl + ': movement.bounds.minCol must be <= maxCol');
              if (b.minRow > b.maxRow) addValidationError(GROUP, lbl + ': movement.bounds.minRow must be <= maxRow');
              if (b.minCol < 0 || b.maxCol >= cols || b.minRow < 0 || b.maxRow >= rows)
                addValidationError(GROUP, lbl + ': movement.bounds must be inside the map (col 0-' + (cols - 1) + ', row 0-' + (rows - 1) + '); bounds are tile indices');
            }
          }
          // Pauses: optional, nonnegative finite, min <= max.
          const mn = mv.minPauseFrames, mx = mv.maxPauseFrames;
          if (mn !== undefined && (!_isFiniteNumber(mn) || mn < 0))
            addValidationError(GROUP, lbl + ': movement.minPauseFrames must be a nonnegative finite number of frames');
          if (mx !== undefined && (!_isFiniteNumber(mx) || mx < 0))
            addValidationError(GROUP, lbl + ': movement.maxPauseFrames must be a nonnegative finite number of frames');
          if (_isFiniteNumber(mn) && _isFiniteNumber(mx) && mn > mx)
            addValidationError(GROUP, lbl + ': movement.minPauseFrames must be <= maxPauseFrames');
        } else {
          // Waypoint routes (scriptedRoute / patrol): bounds are incompatible.
          if (mv.bounds !== undefined)
            addValidationError(GROUP, lbl + ': movement.bounds applies only to a boundedWander (waypoint routes use waypoints)');
          if (!_isPlainArray(mv.waypoints) || mv.waypoints.length === 0) {
            addValidationError(GROUP, lbl + ': movement.waypoints must be a nonempty array');
          } else {
            mv.waypoints.forEach((wp, i) => {
              if (wp === null || typeof wp !== 'object' || !_isFiniteNumber(wp.x) || !_isFiniteNumber(wp.y)) {
                addValidationError(GROUP, lbl + ': movement.waypoints[' + i + '] must be { x, y } with finite numbers (tile units)');
              } else if (wp.x < 0 || wp.x >= cols || wp.y < 0 || wp.y >= rows) {
                addValidationError(GROUP, lbl + ': movement.waypoints[' + i + '] (' + wp.x + ', ' + wp.y + ') outside map bounds 0-' + (cols - 1) + ' x 0-' + (rows - 1) + ' (waypoints are TILE units, not pixels)');
              }
              // Per-waypoint dwell (patrol form): optional, nonnegative finite.
              if (wp && typeof wp === 'object' && wp.pauseFrames !== undefined && (!_isFiniteNumber(wp.pauseFrames) || wp.pauseFrames < 0))
                addValidationError(GROUP, lbl + ': movement.waypoints[' + i + '].pauseFrames must be a nonnegative finite number of frames');
            });
            // Orthogonal-segment check: the runtime resolves one axis per frame,
            // so every segment the NPC walks — each consecutive waypoint pair,
            // and (for a looping patrol) the last waypoint back to the first —
            // must be axis-aligned (share an x or a y). Diagonal segments would
            // move along one axis only, missing the destination. Only run when
            // every waypoint is a finite {x,y} (avoids cascading on bad data).
            if (mv.waypoints.every(wp => wp && typeof wp === 'object' && _isFiniteNumber(wp.x) && _isFiniteNumber(wp.y))) {
              const pts = mv.waypoints.slice();
              if (mv.type === 'patrol' && mv.loop !== false && pts.length > 1) pts.push(pts[0]); // loop closure
              for (let i = 1; i < pts.length; i++) {
                const a = pts[i - 1], b = pts[i];
                if (a.x !== b.x && a.y !== b.y)
                  addValidationError(GROUP, lbl + ': movement.waypoints segment ' + (i - 1) + '->' + (i % mv.waypoints.length) + ' is diagonal; routes must be orthogonal (each segment shares an x or a y)');
              }
            }
          }
        }
        if (!_isFiniteNumber(mv.speed) || mv.speed <= 0)
          addValidationError(GROUP, lbl + ': movement.speed must be a positive finite number (px per frame)');
        if (mv.pauseFrames !== undefined && (!_isFiniteNumber(mv.pauseFrames) || mv.pauseFrames < 0))
          addValidationError(GROUP, lbl + ': movement.pauseFrames must be a nonnegative finite number of frames');
        if (mv.loop !== undefined && typeof mv.loop !== 'boolean')
          addValidationError(GROUP, lbl + ': movement.loop must be a boolean');
        // Runtime motion state is keyed by id — movement without a unique id
        // can never be tracked. (Duplicate-id errors are reported above.)
        if (!npc.id)
          addValidationError(GROUP, lbl + ': movement requires the NPC to have an id (runtime motion state is keyed by id)');
        // Rendering classification: only the generic sprite bodies can gain
        // directional/walk variants in Phase 1. Bespoke NPC_DRAW_FNS entries
        // (including the two props) have no movement-capable rendering path.
        if (npc.id && typeof NPC_DRAW_FNS !== 'undefined' && NPC_DRAW_FNS[npc.id])
          addValidationError(GROUP, lbl + ': movement on a bespoke-rendered NPC (NPC_DRAW_FNS) — bespoke sprites/props have no directional rendering and must remain stationary until given one');
        // Authored x/y getters are schedules; runtime motion would fight
        // them. Phase 1 must resolve such NPCs differently, so flag it now.
        const xDesc = Object.getOwnPropertyDescriptor(npc, 'x');
        const yDesc = Object.getOwnPropertyDescriptor(npc, 'y');
        if ((xDesc && xDesc.get) || (yDesc && yDesc.get))
          addValidationError(GROUP, lbl + ': movement on an NPC with a dynamic x/y getter — the authored schedule would fight runtime motion (see architecture.md Phase 1 inventory)');
        const mapDesc = Object.getOwnPropertyDescriptor(npc, 'map');
        if (mapDesc && mapDesc.get)
          addValidationWarning(GROUP, lbl + ': movement on an NPC with a dynamic map getter — needs Phase 1 "route only while resolved to this map" handling; confirm intentional');
      }
    }

    // ── Cross-seam interaction capability (EXPLICIT, fail-closed opt-in) ────
    // A neighbour NPC may be talked to across an eligible seam ONLY if it opts in
    // with `crossSeamInteraction`. Eligibility is never inferred from absent
    // action/route metadata. No authored NPC opts in today; this guards future
    // content so an opt-in can never silently coexist with active-map-only
    // behaviour or ambiguous ownership. See world-point-content.js.
    if (npc.crossSeamInteraction !== undefined && npc.crossSeamInteraction !== null) {
      const cap = npc.crossSeamInteraction;
      const recognized = (typeof CROSS_SEAM_NPC_CAPABILITIES !== 'undefined' && CROSS_SEAM_NPC_CAPABILITIES)
        ? Object.prototype.hasOwnProperty.call(CROSS_SEAM_NPC_CAPABILITIES, cap)
        : (cap === 'simple_dialogue');
      if (!recognized) {
        addValidationError(GROUP, lbl + ': crossSeamInteraction "' + cap + '" is not a recognized capability (only \'simple_dialogue\' is supported) — unknown capabilities fail closed');
      } else {
        // simple_dialogue contract: unambiguous outdoor content ownership, a
        // nonempty authored dialogue, and NONE of the active-map-only machinery.
        let owned = false;
        if (typeof outdoorContentKeyEntries === 'function') {
          for (const e of outdoorContentKeyEntries()) if (e.unambiguous && e.key === mapVal) { owned = true; break; }
        }
        if (!owned)
          addValidationError(GROUP, lbl + ': crossSeamInteraction requires UNAMBIGUOUS outdoor content ownership — map "' + mapVal + '" is not a single placed outdoor map\'s content key');
        if (!_isPlainArray(npc.dialogue) || npc.dialogue.length === 0)
          addValidationError(GROUP, lbl + ': crossSeamInteraction \'simple_dialogue\' requires a nonempty authored dialogue array');
        if (npc.action !== undefined && npc.action !== null)
          addValidationError(GROUP, lbl + ': crossSeamInteraction is incompatible with an action (scripted combat/cutscene/transition behaviour is active-map-only)');
        if (npc.movement !== undefined)
          addValidationError(GROUP, lbl + ': crossSeamInteraction is incompatible with movement (a mover is not a stationary simple-dialogue NPC)');
      }
    }
  }

  // Overlap detection: two solid NPCs within canWalk()'s own 18px collision
  // radius on the same resolved map+day would make one of them permanently
  // unreachable/stuck. Practical, not exhaustive -- see the getter note
  // above for why this only checks the current resolved state.
  for (const [dayKey, list] of solidByMapDay) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (Math.abs(a.x - b.x) < 18 && Math.abs(a.y - b.y) < 18) {
          addValidationWarning(GROUP, 'solid NPCs "' + a.id + '" and "' + b.id + '" overlap on ' + dayKey.split('|')[0] + ' (day ' + dayKey.split('|')[1] + ') -- within canWalk()\'s collision radius of each other');
        }
      }
    }
  }

  return checked;
}

// ─── 6. Items, chests, and placed objects ──────────────────────────────────
// Validates ITEM_REGISTRY/SHOP_REGISTRY shape, every per-map item list
// referenced from MAP_METADATA (so a new map's items automatically get
// checked -- no hardcoded list of "which arrays exist" to keep in sync),
// the handful of item arrays/chests that aren't map-scoped (dungeon floor
// pickups, sluice/vault/mire chests), and cross-references every placed
// item/chest .item field against ITEM_REGISTRY.
function validateItems() {
  const GROUP = 'Items';
  let checked = 0;

  const itemRegistryPopulated = typeof ITEM_REGISTRY !== 'undefined' && Object.keys(ITEM_REGISTRY).length > 0;
  const SKIP_TYPES = new Set(['inscription', 'quest_item']); // intentionally unregistered
  const seenQuestItemNames = new Set();

  function checkItemRef(item, lbl) {
    if (!item || !item.name) return;
    if (!SKIP_TYPES.has(item.type || '') && itemRegistryPopulated && !ITEM_REGISTRY[item.name])
      addValidationError(GROUP, lbl + ': "' + item.name + '" (type: ' + (item.type || '?') + ') not in ITEM_REGISTRY');
    if (item.type === 'quest_item') {
      if (seenQuestItemNames.has(item.name)) {
        // Duplicate quest-item names across different placements are only
        // suspicious, not necessarily wrong (a quest could legitimately
        // place the "same" narrative item in two spots as alternatives) --
        // warning, not error.
        addValidationWarning(GROUP, lbl + ': quest item "' + item.name + '" name also used elsewhere -- confirm that\'s intentional, not a copy-paste duplicate');
      }
      seenQuestItemNames.add(item.name);
    }
  }

  function checkPlacedItem(item, lbl, mapArr) {
    checked++;
    if (!item || typeof item !== 'object') { addValidationError(GROUP, lbl + ': not an object'); return; }
    if (item.x == null || item.y == null) { addValidationError(GROUP, lbl + ': missing x/y'); return; }
    if (!item.name) addValidationError(GROUP, lbl + ': missing name');

    const rows = _validationRows(), cols = _validationCols();
    const tx = item.x / TILE, ty = item.y / TILE;
    if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) {
      addValidationError(GROUP, lbl + ': (' + item.x + ',' + item.y + ') is out of bounds for a ' + cols + 'x' + rows + ' grid');
    } else if (mapArr && typeof WALKABLE !== 'undefined') {
      const tile = mapArr[Math.floor(ty)] ? mapArr[Math.floor(ty)][Math.floor(tx)] : undefined;
      if (tile !== undefined && !WALKABLE[tile] && !item.allowUnwalkable)
        addValidationWarning(GROUP, lbl + ': sits on a non-walkable tile (' + tile + ') -- may be unreachable (set allowUnwalkable: true if intentional, e.g. a chest behind a counter)');
    }
    checkItemRef(item, lbl);
  }

  // ITEM_REGISTRY / SHOP_REGISTRY -----------------------------------------
  if (typeof ITEM_REGISTRY !== 'undefined') {
    const seenKeys = new Set();
    for (const [key, item] of Object.entries(ITEM_REGISTRY)) {
      checked++;
      const lbl = 'ITEM_REGISTRY[' + key + ']';
      if (seenKeys.has(key)) addValidationError(GROUP, lbl + ': duplicate key');
      else seenKeys.add(key);
      if (!item.name) addValidationError(GROUP, lbl + ': missing name');
      if (!item.type) addValidationError(GROUP, lbl + ': missing type');
      for (const field of ['price', 'bonus', 'heals']) {
        if (field in item && !_isFiniteNumber(item[field]))
          addValidationError(GROUP, lbl + ': ' + field + ' is not a valid number (' + item[field] + ')');
      }
      // Every status-cure property (curesX) must be registered in the shared
      // STATUS_CURE_PROPERTIES contract (combat.js), so it routes through the one
      // status-cure resolution path and never leaks the cured status into item
      // displays. An unregistered curesX is a silent one-off waiting to happen.
      const cureContract = (typeof window !== 'undefined') ? window.STATUS_CURE_PROPERTIES : null;
      for (const prop of Object.keys(item)) {
        if (!/^cures[A-Z]/.test(prop) || !item[prop]) continue;
        if (!cureContract) addValidationWarning(GROUP, lbl + ': has "' + prop + '" but STATUS_CURE_PROPERTIES is unavailable to verify registration');
        else if (!(prop in cureContract)) addValidationError(GROUP, lbl + ': status-cure property "' + prop + '" is not registered in STATUS_CURE_PROPERTIES (combat.js) -- register it so it uses the shared cure path and stays out of item displays');
      }
    }
  } else {
    addValidationWarning(GROUP, 'ITEM_REGISTRY not available -- item registry checks skipped');
  }

  if (typeof SHOP_REGISTRY !== 'undefined') {
    for (const [key, shop] of Object.entries(SHOP_REGISTRY)) {
      checked++;
      const lbl = 'SHOP_REGISTRY[' + key + ']';
      if (!shop.id) addValidationError(GROUP, lbl + ': missing id');
      if (!_isPlainArray(shop.stock)) { addValidationError(GROUP, lbl + ': stock is not an array'); continue; }
      shop.stock.forEach((item, i) => {
        const ilbl = lbl + '.stock[' + i + '] (' + (item.name || '?') + ')';
        if (!item.name) addValidationError(GROUP, ilbl + ': missing name');
        if (!item.type) addValidationError(GROUP, ilbl + ': missing type');
        if (item.price == null) addValidationError(GROUP, ilbl + ': missing price');
        checkItemRef(item, ilbl);
      });
    }
  }

  // Per-map item lists, driven entirely by MAP_METADATA -- a new map's
  // items array is picked up automatically, no separate list to maintain.
  if (typeof MAP_METADATA !== 'undefined') {
    for (const [mapKey, m] of Object.entries(MAP_METADATA)) {
      if (!_isPlainArray(m.items)) continue;
      m.items.forEach((item, i) => checkPlacedItem(item, 'MAP_METADATA[' + mapKey + '].items[' + i + ']', m.map));
    }
  }

  // Item arrays that aren't map-scoped the same way (dungeon sub-floors,
  // sluice/vault floors) -- these still exist as their own named globals
  // even though their owning map's metadata.items already points at the
  // same array for the maps that have one (DUNGEON2_MAP etc); listing them
  // here too is harmless (checkPlacedItem re-checks the same objects, not a
  // second source of truth) and catches the handful of pickups that live
  // outside any single MAP_METADATA-owned array (WORLD_ITEMS).
  // NOTE: these constants are declared with top-level `const` (data.js) and,
  // per ES module/script semantics, `const`/`let` at the top level do NOT
  // become properties of `window`/globalThis -- only `var`, function
  // declarations, and explicit `window.X = X` assignments do. So each is
  // looked up here as a real identifier via `typeof X !== 'undefined' ? X :
  // undefined` (same convention the rest of this file already uses for
  // MAP_METADATA/WALKABLE/etc), NOT via a `window[name]` string lookup --
  // that would silently resolve to undefined for every one of these and
  // skip the check entirely.
  const EXTRA_ITEM_ARRAYS = [
    ['WORLD_ITEMS',       typeof WORLD_ITEMS       !== 'undefined' ? WORLD_ITEMS       : undefined],
    ['DUNGEON3_TC_ITEMS', typeof DUNGEON3_TC_ITEMS !== 'undefined' ? DUNGEON3_TC_ITEMS : undefined],
    ['DUNGEON3_TL_ITEMS', typeof DUNGEON3_TL_ITEMS !== 'undefined' ? DUNGEON3_TL_ITEMS : undefined],
    ['DUNGEON3_TR_ITEMS', typeof DUNGEON3_TR_ITEMS !== 'undefined' ? DUNGEON3_TR_ITEMS : undefined],
    ['DUNGEON3_ML_ITEMS', typeof DUNGEON3_ML_ITEMS !== 'undefined' ? DUNGEON3_ML_ITEMS : undefined],
    ['DUNGEON3_MC_ITEMS', typeof DUNGEON3_MC_ITEMS !== 'undefined' ? DUNGEON3_MC_ITEMS : undefined],
    ['DUNGEON3_MR_ITEMS', typeof DUNGEON3_MR_ITEMS !== 'undefined' ? DUNGEON3_MR_ITEMS : undefined],
    ['DUNGEON3_BL_ITEMS', typeof DUNGEON3_BL_ITEMS !== 'undefined' ? DUNGEON3_BL_ITEMS : undefined],
    ['DUNGEON3_BC_ITEMS', typeof DUNGEON3_BC_ITEMS !== 'undefined' ? DUNGEON3_BC_ITEMS : undefined],
    ['DUNGEON3_BR_ITEMS', typeof DUNGEON3_BR_ITEMS !== 'undefined' ? DUNGEON3_BR_ITEMS : undefined],
  ];
  for (const [name, arr] of EXTRA_ITEM_ARRAYS) {
    if (!_isPlainArray(arr)) continue;
    arr.forEach((item, i) => checkPlacedItem(item, name + '[' + i + ']', null));
  }

  // Chests -------------------------------------------------------------
  const CHEST_NAMES = [
    ['DUNGEON_CHEST',        typeof DUNGEON_CHEST        !== 'undefined' ? DUNGEON_CHEST        : undefined],
    ['DUNGEON_ALCOVE_CHEST', typeof DUNGEON_ALCOVE_CHEST !== 'undefined' ? DUNGEON_ALCOVE_CHEST : undefined],
    ['SLUICE_CHEST',         typeof SLUICE_CHEST         !== 'undefined' ? SLUICE_CHEST         : undefined],
    ['SLUICE_LEVEL2_CHEST',  typeof SLUICE_LEVEL2_CHEST  !== 'undefined' ? SLUICE_LEVEL2_CHEST  : undefined],
    ['SLUICE_SECRET_CHEST',  typeof SLUICE_SECRET_CHEST  !== 'undefined' ? SLUICE_SECRET_CHEST  : undefined],
    ['SLUICE_LEVEL3_CHEST',  typeof SLUICE_LEVEL3_CHEST  !== 'undefined' ? SLUICE_LEVEL3_CHEST  : undefined],
    ['SLUICE_DEEP_CHEST',    typeof SLUICE_DEEP_CHEST    !== 'undefined' ? SLUICE_DEEP_CHEST    : undefined],
    ['CAT_ARMOR_CHEST',      typeof CAT_ARMOR_CHEST      !== 'undefined' ? CAT_ARMOR_CHEST      : undefined],
  ];
  const seenChestSpots = new Map(); // "x,y" -> chest name, duplicate-coordinate check
  for (const [name, chest] of CHEST_NAMES) {
    if (!chest || typeof chest !== 'object') continue;
    checked++;
    if (chest.opened === undefined) addValidationError(GROUP, name + ': missing opened flag');
    if (chest.x == null || chest.y == null) addValidationError(GROUP, name + ': missing x/y');
    else {
      const rows = _validationRows(), cols = _validationCols();
      const tx = chest.x / TILE, ty = chest.y / TILE;
      if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) addValidationError(GROUP, name + ': (' + chest.x + ',' + chest.y + ') is out of bounds');
      const spotKey = chest.x + ',' + chest.y;
      if (seenChestSpots.has(spotKey)) addValidationWarning(GROUP, name + ': same coordinate as ' + seenChestSpots.get(spotKey) + ' (' + spotKey + ')');
      else seenChestSpots.set(spotKey, name);
    }
    if (chest.item) checkItemRef(chest.item, name + '.item');
  }

  return checked;
}

// ─── 7. Enemies / combat data ───────────────────────────────────────────────
// Validates every enemy-template pool (the random-encounter pools plus the
// scripted boss templates like PALE_SENTRY_TEMPLATE), the id-keyed enemy
// registry, and the id-keyed presentation dispatch: every registered template
// must resolve to a battle sprite by STABLE ID (render-battle.js's
// ENEMY_SPRITE_DISPATCH) -- or be explicitly opted into the generic silhouette
// (ENEMY_GENERIC_SPRITE_IDS) -- so a template with no art is caught here
// rather than discovered as a blank enemy in a real fight, and Observe/lore
// (ENEMY_OBSERVATIONS) must likewise be keyed by id, not display name. See
// render-battle.js's dispatch comment for how drawBattleEnemy() resolves and
// falls back.
function validateEnemies() {
  const GROUP = 'Enemies';
  let checked = 0;

  const NUMERIC_FIELDS = ['hp', 'maxHp', 'atk', 'def', 'spd', 'xp', 'goldMin', 'goldMax'];

  function checkTemplate(t, lbl) {
    checked++;
    if (!t || typeof t !== 'object') { addValidationError(GROUP, lbl + ': not an object'); return; }
    if (!t.name) addValidationError(GROUP, lbl + ': missing name');

    for (const field of NUMERIC_FIELDS) {
      if (!(field in t)) addValidationError(GROUP, lbl + ' (' + (t.name || '?') + '): missing ' + field);
      else if (!_isFiniteNumber(t[field])) addValidationError(GROUP, lbl + ' (' + (t.name || '?') + '): ' + field + ' is not a valid number (' + t[field] + ')');
    }

    if (_isFiniteNumber(t.hp) && t.hp <= 0) addValidationError(GROUP, lbl + ' (' + t.name + '): hp must be positive, got ' + t.hp);
    if (_isFiniteNumber(t.maxHp) && t.maxHp <= 0) addValidationError(GROUP, lbl + ' (' + t.name + '): maxHp must be positive, got ' + t.maxHp);
    if (_isFiniteNumber(t.hp) && _isFiniteNumber(t.maxHp) && t.maxHp < t.hp)
      addValidationError(GROUP, lbl + ' (' + t.name + '): maxHp (' + t.maxHp + ') is less than hp (' + t.hp + ')');
    if (_isFiniteNumber(t.goldMin) && _isFiniteNumber(t.goldMax) && t.goldMin > t.goldMax)
      addValidationError(GROUP, lbl + ' (' + t.name + '): goldMin (' + t.goldMin + ') is greater than goldMax (' + t.goldMax + ')');

    if ('defendChance' in t && (!_isFiniteNumber(t.defendChance) || t.defendChance < 0 || t.defendChance > 1))
      addValidationError(GROUP, lbl + ' (' + t.name + '): defendChance should be a number between 0 and 1, got ' + t.defendChance);

    // Suspicious-but-not-structurally-invalid stat shapes are warnings only
    // (per the brief: don't change balance, just flag it).
    if (_isFiniteNumber(t.atk) && t.atk > 60) addValidationWarning(GROUP, lbl + ' (' + t.name + '): atk=' + t.atk + ' is unusually high -- confirm this isn\'t a typo (see BALANCE_REPORT.md for the game\'s existing tier ranges)');
    if (_isFiniteNumber(t.spd) && t.spd > 30) addValidationWarning(GROUP, lbl + ' (' + t.name + '): spd=' + t.spd + ' is unusually high');
    // Battle-sprite coverage is validated by STABLE ID against
    // ENEMY_SPRITE_DISPATCH in the registry section below, not by name here --
    // that's the whole point of the id-authority refactor. (A pooled template
    // is reached via its registry entry, so per-template name checks would
    // also double-warn on the several ids that share one display name.)
  }

  // Same window[name]-doesn't-work caveat as validateItems() -- these are
  // top-level `const`s in data.js, not window properties, so each is
  // resolved via a real `typeof X !== 'undefined'` identifier check rather
  // than a string-keyed lookup.
  //
  // ── Enemy-pool registry: the SOLE inventory of random encounter pools ──────
  // combat.js owns ENEMY_TEMPLATE_POOLS as an array of { id, label, templates }.
  // There is no second hand-maintained pool list here anymore -- this iterates
  // the live registry directly, so a pool added in combat.js is validated
  // automatically. Each entry's `id` is a stable authored `pool_<snake>` handle
  // (the same handle test/balance-report.js references pools by); the checks
  // below guarantee those ids are well-formed, unique, one-array-per-id, and
  // structurally sound before anything downstream trusts them.
  const POOL_ID_RE = /^pool_[a-z0-9_]+$/;
  const poolRegistry = window.ENEMY_TEMPLATE_POOLS;
  // reference identity -> id, so we can (a) reject the same array registered
  // under two ids and (b) map a MAP_METADATA/runtime pool back to its id below.
  const poolIdByArray = new Map();
  const registeredPoolIds = new Set();
  let anyPoolFound = false;
  if (_isPlainArray(poolRegistry)) {
    const poolIdCounts = {};
    poolRegistry.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object' || _isPlainArray(entry)) {
        addValidationError(GROUP, 'ENEMY_TEMPLATE_POOLS[' + idx + '] is not a { id, label, templates } object');
        return;
      }
      const id = entry.id;
      if (typeof id !== 'string' || !id) {
        addValidationError(GROUP, 'ENEMY_TEMPLATE_POOLS[' + idx + '] has a missing/blank pool id');
      } else {
        if (!POOL_ID_RE.test(id)) addValidationError(GROUP, 'enemy pool id "' + id + '" is not lowercase pool_<snake> format');
        poolIdCounts[id] = (poolIdCounts[id] || 0) + 1;
        registeredPoolIds.add(id);
      }
      if (typeof entry.label !== 'string' || !entry.label)
        addValidationError(GROUP, 'enemy pool "' + (id || '[' + idx + ']') + '" has no developer-readable label');
      if (!_isPlainArray(entry.templates)) {
        addValidationError(GROUP, 'enemy pool "' + (id || '[' + idx + ']') + '" has no templates array');
        return;
      }
      // Empty pool: currentEncounterPool() would pick from nothing. There is no
      // documented intentional-empty pool in this game, so flag it.
      if (entry.templates.length === 0)
        addValidationError(GROUP, 'enemy pool "' + (id || '[' + idx + ']') + '" is empty -- an encounter pool must contain at least one template (remove it or add members)');
      // Same array object registered under two different ids -> ambiguous identity.
      if (poolIdByArray.has(entry.templates)) {
        addValidationError(GROUP, 'enemy pool array is registered under two ids: "' + poolIdByArray.get(entry.templates) + '" and "' + (id || '[' + idx + ']') + '" -- one distinct pool array must map to exactly one id');
      } else if (typeof id === 'string' && id) {
        poolIdByArray.set(entry.templates, id);
      }
      anyPoolFound = true;
      // Repetition inside a pool (a template listed twice for higher spawn
      // weight) is intentional and NOT flagged -- checkTemplate just re-checks it.
      entry.templates.forEach((t, i) => checkTemplate(t, (id || 'pool[' + idx + ']') + '[' + i + ']'));
    });
    for (const id of Object.keys(poolIdCounts))
      if (poolIdCounts[id] > 1) addValidationError(GROUP, 'duplicate enemy pool id "' + id + '" (registered ' + poolIdCounts[id] + ' times) -- pool ids must be unique');
  } else {
    addValidationError(GROUP, 'ENEMY_TEMPLATE_POOLS is missing or not an array -- the enemy-pool registry is the sole inventory of encounter pools');
  }
  if (!anyPoolFound) addValidationWarning(GROUP, 'no enemy-template pools found -- check script load order (data.js / combat.js)');

  // Scripted/special templates (boss-style, not part of a random pool).
  if (typeof PALE_SENTRY_TEMPLATE !== 'undefined') checkTemplate(PALE_SENTRY_TEMPLATE, 'PALE_SENTRY_TEMPLATE');

  // ── #4: enemy-template identity registry (removes the special-enemy blind spot)
  // Previously only pooled templates + PALE_SENTRY were structurally checked;
  // every OTHER scripted template (Wrongteeth, Kolm, Takomo, ...) went unchecked.
  // Now structurally check every scripted template, and validate the id-keyed
  // registry: unique lowercase `enemy_<snake>` ids, key === template.id, and that
  // every pooled + scripted template is registered. The runtime-inline "23" has a
  // stable id but no static stat block, so it is checked for identity only.
  const ENEMY_ID_RE = /^enemy_[a-z0-9_]+$/;
  const scripted = window.ENEMY_SCRIPTED_TEMPLATES;
  if (_isPlainArray(scripted)) {
    for (const t of scripted) {
      if (t && t !== (typeof PALE_SENTRY_TEMPLATE !== 'undefined' ? PALE_SENTRY_TEMPLATE : null)) checkTemplate(t, 'scripted:' + (t && t.name));
    }
  }
  const enemyReg = window.ENEMY_TEMPLATE_REGISTRY;
  if (enemyReg && typeof enemyReg === 'object') {
    for (const id of Object.keys(enemyReg)) {
      checked++;
      const t = enemyReg[id];
      if (!ENEMY_ID_RE.test(id)) addValidationError(GROUP, 'enemy template id "' + id + '" is not lowercase enemy_<snake> format');
      if (!t || typeof t !== 'object') { addValidationError(GROUP, 'enemy registry entry "' + id + '" is not an object'); continue; }
      if (t.id !== id) addValidationError(GROUP, 'enemy registry key "' + id + '" != template id "' + t.id + '"');
      if (typeof t.name !== 'string' || !t.name) addValidationError(GROUP, 'enemy template "' + id + '" has no display name');
    }
    // Completeness + duplicate-id across every static template (pooled + scripted
    // + the inline "23"): each must be present in the registry under its own id.
    const statics = [];
    if (_isPlainArray(window.ENEMY_TEMPLATE_POOLS)) window.ENEMY_TEMPLATE_POOLS.forEach((p) => { if (p && _isPlainArray(p.templates)) p.templates.forEach((t) => statics.push(t)); });
    if (_isPlainArray(scripted)) scripted.forEach((t) => statics.push(t));
    if (window.SECRET_23_TEMPLATE) statics.push(window.SECRET_23_TEMPLATE);
    // A duplicate id means two DISTINCT template records claim the same id --
    // an identity collision. The SAME record appearing more than once is fine
    // and intentional: a template can be listed twice in a pool for higher spawn
    // weight, or shared across pools. So track the set of distinct objects per
    // id and only flag when one id owns more than one of them.
    const idObjects = new Map();
    for (const t of statics) {
      if (!t || typeof t.id !== 'string' || !t.id) { addValidationError(GROUP, 'an enemy template has a missing/invalid id'); continue; }
      if (enemyReg[t.id] !== t) addValidationError(GROUP, 'enemy template "' + t.name + '" (' + t.id + ') is not registered in ENEMY_TEMPLATE_REGISTRY');
      if (!idObjects.has(t.id)) idObjects.set(t.id, new Set());
      idObjects.get(t.id).add(t);
    }
    for (const [id, objs] of idObjects) if (objs.size > 1) addValidationError(GROUP, 'duplicate enemy template id "' + id + '" (two distinct template records)');

    // ── Id-keyed presentation dispatch: battle sprite + Observe/lore ─────────
    // Enemy identity is the stable template id (enemy.id), so both the battle
    // sprite and the Observe/lore text are dispatched by id -- never by the
    // player-facing name. These checks are the structural guarantee behind
    // that: (a) every registered template resolves to a sprite by id (or is
    // explicitly opted into the generic silhouette), and (b) every id-keyed
    // sprite/generic/Observe entry points at a real registered template. This
    // catches a new template shipped with no art, a dispatch entry with a
    // typo'd/renamed id, and Observe text keyed by name creeping back in.
    const spriteDispatch = (typeof ENEMY_SPRITE_DISPATCH !== 'undefined') ? ENEMY_SPRITE_DISPATCH : (window && window.ENEMY_SPRITE_DISPATCH);
    const genericIds     = (typeof ENEMY_GENERIC_SPRITE_IDS !== 'undefined') ? ENEMY_GENERIC_SPRITE_IDS : (window && window.ENEMY_GENERIC_SPRITE_IDS);
    if (spriteDispatch && typeof spriteDispatch === 'object') {
      for (const id of Object.keys(enemyReg)) {
        const inSprite  = Object.prototype.hasOwnProperty.call(spriteDispatch, id);
        const inGeneric = !!(genericIds && typeof genericIds.has === 'function' && genericIds.has(id));
        const nm = (enemyReg[id] && enemyReg[id].name) || '?';
        if (inSprite && inGeneric)
          addValidationError(GROUP, 'enemy "' + id + '" (' + nm + ') is in BOTH ENEMY_SPRITE_DISPATCH and ENEMY_GENERIC_SPRITE_IDS -- an id must be in exactly one');
        else if (!inSprite && inGeneric)
          // Intentional generic-art enemy (e.g. Takomo): still WARN so the
          // standing "deserves its own look" note is preserved, but don't error.
          addValidationWarning(GROUP, id + ' (' + nm + '): no dedicated battle sprite -- registered in ENEMY_GENERIC_SPRITE_IDS, so it renders the generic silhouette (drawBattleGenericEnemy()); add an ENEMY_SPRITE_DISPATCH entry if this enemy deserves its own look');
        else if (!inSprite && !inGeneric)
          addValidationError(GROUP, 'enemy "' + id + '" (' + nm + ') has no ENEMY_SPRITE_DISPATCH entry and is not in ENEMY_GENERIC_SPRITE_IDS -- it would render an unmarked/blank enemy; give it a sprite or opt it into the generic silhouette');
      }
      // Reverse direction: no sprite/generic entry may reference a dead id.
      for (const id of Object.keys(spriteDispatch))
        if (!enemyReg[id]) addValidationError(GROUP, 'ENEMY_SPRITE_DISPATCH entry "' + id + '" does not resolve to a registered enemy template');
      if (genericIds && typeof genericIds.forEach === 'function')
        genericIds.forEach((id) => { if (!enemyReg[id]) addValidationError(GROUP, 'ENEMY_GENERIC_SPRITE_IDS entry "' + id + '" does not resolve to a registered enemy template'); });
    } else {
      addValidationWarning(GROUP, 'ENEMY_SPRITE_DISPATCH unavailable — id-keyed battle-sprite checks skipped (script load order)');
    }

    // Observe/lore must be keyed by stable id, not name: every ENEMY_OBSERVATIONS
    // key has to resolve to a registered template.
    const observeById = (typeof ENEMY_OBSERVATIONS !== 'undefined') ? ENEMY_OBSERVATIONS : (window && window.ENEMY_OBSERVATIONS);
    if (observeById && typeof observeById === 'object') {
      for (const id of Object.keys(observeById))
        if (!enemyReg[id]) addValidationError(GROUP, 'ENEMY_OBSERVATIONS key "' + id + '" is not a registered enemy template id -- Observe/lore must be keyed by stable enemy id, not display name');
    }

    // Guard against name-based battle-sprite dispatch being reintroduced: the
    // name-keyed BATTLE_SPRITE_NAMES Set was replaced by id-keyed dispatch.
    if (typeof window !== 'undefined' && window.BATTLE_SPRITE_NAMES)
      addValidationError(GROUP, 'BATTLE_SPRITE_NAMES is defined again -- battle-sprite dispatch must be id-keyed (ENEMY_SPRITE_DISPATCH), not name-keyed');
  } else {
    addValidationWarning(GROUP, 'ENEMY_TEMPLATE_REGISTRY unavailable — enemy identity checks skipped (script load order)');
  }

  // ── Reachability cross-check: pool registry <-> live encounter routing ─────
  // MAP_METADATA.encounterPool is the declarative routing table -- every
  // location/floor that spawns random encounters names its pool array here (the
  // floor-based dispatch in currentEncounterPool() returns these same array
  // objects). So it is the authority on which registered pools are actually
  // reachable. Two directions are checked:
  //   (a) a live map that spawns encounters from an array NOT in the registry
  //       -- that pool would be invisible to validation and the balance report;
  //   (b) a registered pool that no live map ever routes to -- a dead pool that
  //       silently ships and drifts out of sync.
  if (typeof MAP_METADATA !== 'undefined' && _isPlainArray(poolRegistry)) {
    const reachablePoolIds = new Set();
    for (const [mapKey, m] of Object.entries(MAP_METADATA)) {
      if (m.encounterPool === null) continue;
      if (!_isPlainArray(m.encounterPool)) continue; // already flagged by validateMapMetadata()
      const id = poolIdByArray.get(m.encounterPool);
      if (!id)
        addValidationError(GROUP, 'MAP_METADATA[' + mapKey + ']: encounterPool array is not a registered pool in ENEMY_TEMPLATE_POOLS -- a live map is spawning encounters from a pool that validation and the balance report cannot see; register it (with a stable pool_<snake> id) in combat.js');
      else
        reachablePoolIds.add(id);
    }
    for (const id of registeredPoolIds)
      if (!reachablePoolIds.has(id))
        addValidationWarning(GROUP, 'enemy pool "' + id + '" is registered but no MAP_METADATA.encounterPool routes to it -- it is currently unreachable; wire it into a map/floor or remove it (if it is intentional future content, note that where the pool is registered)');
  }

  return checked;
}

// ─── 8. Dialogue / UI text ──────────────────────────────────────────────────
// Lightweight, warning-only text-shape checks -- never errors, never
// rewrites anything. The dialogue box (render-ui.js's drawDialogue()) word-
// wraps and auto-repaginates at render time, so an overly long authored
// line or page won't actually crash or visually truncate; this just flags
// genuinely extreme outliers, not routine long sentences -- this game's
// existing dialogue deliberately leans on the auto-wrapper, with authored
// single lines commonly 100-160 characters (median line length across
// SIMPLE_NPCS is ~57 chars, p99 is ~163, one legitimate existing line runs
// to 549) and pages topping out at 4 authored lines. Thresholds below are
// calibrated well above that real distribution specifically so this check
// flags true one-off mistakes (e.g. an accidentally unbroken paragraph)
// rather than the game's normal writing style.
function validateDialogue() {
  const GROUP = 'Dialogue';
  let checked = 0;
  const MAX_LINE_CHARS = 260;
  const MAX_LINES_PER_PAGE = 8;
  const MAX_NAME_CHARS = 40;

  function checkPages(pages, lbl) {
    if (!_isPlainArray(pages)) return;
    pages.forEach((page, pi) => {
      checked++;
      if (!_isPlainArray(page)) { addValidationWarning(GROUP, lbl + ' page ' + pi + ': not an array of lines'); return; }
      if (page.length > MAX_LINES_PER_PAGE)
        addValidationWarning(GROUP, lbl + ' page ' + pi + ': ' + page.length + ' lines (recommended max ~' + MAX_LINES_PER_PAGE + ') -- will auto-repaginate, but may read as choppy');
      page.forEach((line, li) => {
        if (typeof line !== 'string') return; // already an error from validateNPCs() if applicable
        if (line.length > MAX_LINE_CHARS)
          addValidationWarning(GROUP, lbl + ' page ' + pi + ' line ' + li + ' may exceed dialogue width (' + line.length + ' chars, recommended max ~' + MAX_LINE_CHARS + ') -- will word-wrap, confirm it still reads well split');
      });
    });
  }

  if (typeof SIMPLE_NPCS !== 'undefined') {
    for (const npc of SIMPLE_NPCS) {
      checkPages(npc.dialogue, 'npc.' + (npc.id || '?'));
      if (npc.name && npc.name.length > MAX_NAME_CHARS) {
        checked++;
        addValidationWarning(GROUP, 'npc.' + (npc.id || '?') + ': name "' + npc.name + '" is ' + npc.name.length + ' chars (recommended max ~' + MAX_NAME_CHARS + ') -- may crowd the dialogue name plate');
      }
    }
  }

  if (typeof MAP_FEATURES !== 'undefined') {
    for (const features of Object.values(MAP_FEATURES)) {
      if (!_isPlainArray(features)) continue;
      for (const feature of features) {
        checkPages(feature.pages, 'feature.' + (feature.id || '?'));
        checkPages(feature.fallbackPages, 'feature.' + (feature.id || '?') + '.fallbackPages');
        checkPages(feature.repeatPages, 'feature.' + (feature.id || '?') + '.repeatPages');
      }
    }
  }

  if (typeof ITEM_REGISTRY !== 'undefined') {
    for (const [key, item] of Object.entries(ITEM_REGISTRY)) {
      if (item.name && item.name.length > MAX_NAME_CHARS) {
        checked++;
        addValidationWarning(GROUP, 'ITEM_REGISTRY[' + key + ']: name "' + item.name + '" is ' + item.name.length + ' chars (recommended max ~' + MAX_NAME_CHARS + ') -- may crowd inventory/shop lists');
      }
    }
  }

  return checked;
}

// ─── 9. Save/flag references ────────────────────────────────────────────────
// Validates the quest-flag binding registry (save.js's QUEST_FLAG_BINDINGS,
// the single source of truth): unique keys, callable getters/setters, declared
// defaults, and that QUEST_FLAG_SCHEMA is derived from it. Also checks the save
// migration registry has no gaps up to SAVE_VERSION, and runs a lightweight
// duplicate-like-typo scan across flag names (schema keys + NPC flag_required/
// flag_sets). Never mutates the save schema or writes storage.
function validateSaveFlags() {
  const GROUP = 'Save/Flags';
  let checked = 0;

  if (typeof window.QUEST_FLAG_SCHEMA !== 'undefined' && typeof syncQuestFlagsToWindow === 'function') {
    syncQuestFlagsToWindow();
    const schema = window.QUEST_FLAG_SCHEMA;

    for (const key of schema) {
      checked++;
      if (window[key] === undefined) addValidationError(GROUP, 'schema flag "' + key + '" not set by syncQuestFlagsToWindow -- saveGame() would write undefined for this flag');
    }

    // The quest-flag binding registry (save.js) is the single source of truth
    // for persistent flags; validate its structure and that QUEST_FLAG_SCHEMA is
    // derived from it -- rather than cross-checking a second hand-maintained key
    // list (that list has been removed).
    const bindings = (typeof window.QUEST_FLAG_BINDINGS !== 'undefined') ? window.QUEST_FLAG_BINDINGS : null;
    if (!Array.isArray(bindings)) {
      addValidationError(GROUP, 'QUEST_FLAG_BINDINGS registry is missing -- QUEST_FLAG_SCHEMA can no longer be derived (check save.js load order)');
    } else {
      const seenKeys = new Set();
      for (const b of bindings) {
        checked++;
        if (!b || typeof b.key !== 'string' || !b.key) { addValidationError(GROUP, 'a quest-flag binding has a missing/invalid key'); continue; }
        if (seenKeys.has(b.key)) addValidationError(GROUP, 'duplicate quest-flag binding key "' + b.key + '"'); else seenKeys.add(b.key);
        if (!('default' in b)) addValidationError(GROUP, 'quest-flag binding "' + b.key + '" declares no default');
        if (typeof b.get !== 'function') addValidationError(GROUP, 'quest-flag binding "' + b.key + '" has no callable getter');
        else { try { b.get(); } catch (e) { addValidationError(GROUP, 'quest-flag binding "' + b.key + '" getter threw: ' + (e && e.message || e)); } }
        if (typeof b.set !== 'function') addValidationError(GROUP, 'quest-flag binding "' + b.key + '" has no callable setter');
      }
      // QUEST_FLAG_SCHEMA must be exactly the binding-key list, in order.
      const bindingKeys = bindings.map((b) => b && b.key);
      if (schema.length !== bindingKeys.length || schema.some((k, i) => k !== bindingKeys[i])) {
        addValidationError(GROUP, 'QUEST_FLAG_SCHEMA does not match the binding-registry key list -- it must be derived from QUEST_FLAG_BINDINGS');
      }
    }
    // The migration registry must cover every step from version 1 up to
    // SAVE_VERSION (no gap that would make an old save unmigratable).
    if (typeof window.SAVE_VERSION === 'number' && window.SAVE_MIGRATIONS) {
      for (let v = 1; v < window.SAVE_VERSION; v++) {
        checked++;
        if (typeof window.SAVE_MIGRATIONS[v] !== 'function')
          addValidationError(GROUP, 'no save migration registered for version ' + v + ' -> ' + (v + 1) + ' (gap up to SAVE_VERSION ' + window.SAVE_VERSION + ')');
      }
    }

    // Case-insensitive near-duplicate scan across every flag name visible
    // here (schema + NPC flag_required/flag_sets) -- cheap, catches the
    // "MainQuest" vs "mainquest" class of copy-paste typo without any fuzzy
    // string matching.
    const allFlagNames = new Set(schema);
    if (typeof SIMPLE_NPCS !== 'undefined') {
      for (const npc of SIMPLE_NPCS) {
        if (typeof npc.flag_required === 'string') allFlagNames.add(npc.flag_required);
        if (typeof npc.flag_sets === 'string') allFlagNames.add(npc.flag_sets);
      }
    }
    const byLower = new Map();
    for (const name of allFlagNames) {
      const lower = name.toLowerCase();
      if (byLower.has(lower) && byLower.get(lower) !== name)
        addValidationWarning(GROUP, 'flags "' + byLower.get(lower) + '" and "' + name + '" differ only by case -- confirm these are meant to be different flags');
      else byLower.set(lower, name);
    }
  } else {
    addValidationWarning(GROUP, 'QUEST_FLAG_SCHEMA or syncQuestFlagsToWindow not available -- schema check skipped (check script load order)');
  }

  return checked;
}

// ─── 10. Map features ───────────────────────────────────────────────────────
// MAP_FEATURES (interactions.js) -- the generalized 'inspect'/'trigger'
// content-authoring registry that superseded the INTERACTION_REGISTRY
// pilot (every migrated entry goes through these same checks now, nothing
// special-cased). Keyed by map id the same way MAP_METADATA is, so this
// walks Object.entries(MAP_FEATURES) rather than a flat array.
function validateMapFeatures() {
  const GROUP = 'Map Features';
  let checked = 0;
  if (typeof MAP_FEATURES === 'undefined') {
    addValidationWarning(GROUP, 'MAP_FEATURES is undefined -- skipped (fine if this codebase doesn\'t use it yet)');
    return checked;
  }

  const VALID_TYPES = new Set(['inspect', 'trigger']);
  const seenIds = new Set();
  const seenCoords = new Map(); // "mapId,x,y" -> id, duplicate-coordinate check (inspect only)
  const rows = _validationRows(), cols = _validationCols();
  const registryKeys = (typeof MAP_REGISTRY !== 'undefined') ? new Set(Object.keys(MAP_REGISTRY)) : null;
  const metadataKeys = (typeof MAP_METADATA !== 'undefined') ? new Set(Object.keys(MAP_METADATA)) : null;

  function checkPages(pages, lbl, fieldName) {
    if (pages === undefined) return;
    if (typeof pages === 'function') {
      try {
        const resolved = pages();
        if (resolved !== null && resolved !== undefined && !_isPlainArray(resolved))
          addValidationError(GROUP, lbl + ': ' + fieldName + '() returned something other than an array or null/undefined');
      } catch (e) {
        addValidationWarning(GROUP, lbl + ': ' + fieldName + '() threw when called during validation (' + (e && e.message || e) + ')');
      }
      return;
    }
    if (!_isPlainArray(pages)) { addValidationError(GROUP, lbl + ': ' + fieldName + ' is neither an array nor a function'); return; }
    pages.forEach((page, pi) => {
      if (!_isPlainArray(page)) addValidationError(GROUP, lbl + ': ' + fieldName + ' page ' + pi + ' is not an array of lines');
      else page.forEach((line, li) => {
        if (typeof line !== 'string') addValidationError(GROUP, lbl + ': ' + fieldName + ' page ' + pi + ' line ' + li + ' is not a string');
      });
    });
  }

  for (const [mapId, features] of Object.entries(MAP_FEATURES)) {
    const mapKnown = (registryKeys && registryKeys.has(mapId)) || (metadataKeys && metadataKeys.has(mapId));
    if (!mapKnown) addValidationError(GROUP, 'MAP_FEATURES[' + mapId + ']: map id does not exist in MAP_REGISTRY/MAP_METADATA');

    if (!_isPlainArray(features)) { addValidationError(GROUP, 'MAP_FEATURES[' + mapId + ']: value is not an array'); continue; }
    const mapArr = (metadataKeys && metadataKeys.has(mapId)) ? MAP_METADATA[mapId].map : null;

    features.forEach((feature, i) => {
      checked++;
      const lbl = 'MAP_FEATURES[' + mapId + '][' + i + '] (' + (feature.id || '?') + ')';

      if (!feature.id) addValidationError(GROUP, lbl + ': missing id');
      else if (seenIds.has(feature.id)) addValidationError(GROUP, lbl + ': duplicate id "' + feature.id + '"');
      else seenIds.add(feature.id);

      if (!VALID_TYPES.has(feature.type)) {
        addValidationError(GROUP, lbl + ': type "' + feature.type + '" is not one of ' + [...VALID_TYPES].join('/'));
        return; // can't meaningfully check type-specific fields below
      }

      if (feature.condition !== undefined) {
        if (typeof feature.condition !== 'function') {
          addValidationError(GROUP, lbl + ': condition is present but not a function');
        } else {
          try { feature.condition(); }
          catch (e) { addValidationWarning(GROUP, lbl + ': condition() threw when called during validation (' + (e && e.message || e) + ') -- runtime treats this as "not met", never crashes, but confirm that\'s intended'); }
        }
      }

      if (feature.onceFlag !== undefined && (typeof feature.onceFlag !== 'string' || !feature.onceFlag)) {
        addValidationError(GROUP, lbl + ': onceFlag is present but not a non-empty string');
      } else if (feature.onceFlag && typeof window.QUEST_FLAG_SCHEMA !== 'undefined' && !window.QUEST_FLAG_SCHEMA.includes(feature.onceFlag)) {
        // onceFlag works within the current session either way (it's a
        // plain window[name] boolean, same mechanism every quest flag
        // uses) -- but saveGame() only persists flags listed in
        // QUEST_FLAG_SCHEMA (see save.js), so a flag not in that list will
        // silently reset to "unseen" after a save/load round-trip. This is
        // exactly the scenario the brief anticipated deferring rather than
        // risking a schema change for -- reported here as a warning, not
        // an error, since session-only once-only behavior is still valid
        // and may be exactly what a given feature wants.
        addValidationWarning(GROUP, lbl + ': onceFlag "' + feature.onceFlag + '" is not in QUEST_FLAG_SCHEMA (save.js) -- it will work for the current session but will NOT persist across save/load; add it to QUEST_FLAG_SCHEMA if persistence is intended');
      }

      if (feature.type === 'inspect') {
        if (feature.x == null || feature.y == null) {
          addValidationError(GROUP, lbl + ': missing x/y');
        } else {
          if (feature.x < 0 || feature.x >= cols || feature.y < 0 || feature.y >= rows)
            addValidationError(GROUP, lbl + ': (' + feature.x + ',' + feature.y + ') is out of bounds (valid tile indices 0-' + (cols - 1) + ' by 0-' + (rows - 1) + ', tile units not pixels)');
          else if (mapArr && typeof WALKABLE !== 'undefined' && !feature.allowUnwalkable) {
            const tile = mapArr[Math.floor(feature.y)] ? mapArr[Math.floor(feature.y)][Math.floor(feature.x)] : undefined;
            if (tile !== undefined && !WALKABLE[tile])
              addValidationWarning(GROUP, lbl + ': sits on a non-walkable tile (' + tile + ') -- the player may never be able to get within interact radius; set allowUnwalkable: true if intentional (e.g. inspecting a wall-mounted sign from an adjacent tile\'s radius, or a deliberately unreachable easter egg)');
          }
          const key = mapId + ',' + feature.x + ',' + feature.y;
          if (seenCoords.has(key)) addValidationWarning(GROUP, lbl + ': same coordinate as ' + seenCoords.get(key) + ' -- confirm intentional, not a copy-paste duplicate');
          else seenCoords.set(key, feature.id || i);
        }

        if (feature.radius !== undefined && (!_isFiniteNumber(feature.radius) || feature.radius <= 0 || feature.radius > 200))
          addValidationWarning(GROUP, lbl + ': radius=' + feature.radius + ' looks out of the sane range (expected roughly 1-200px)');

        if (feature.facing !== undefined && !['up', 'down', 'left', 'right'].includes(feature.facing))
          addValidationError(GROUP, lbl + ': facing "' + feature.facing + '" is not one of up/down/left/right');

        if (!feature.pages && !feature.fallbackPages)
          addValidationError(GROUP, lbl + ': has neither pages nor fallbackPages -- nothing would ever display');
        checkPages(feature.pages, lbl, 'pages');
        checkPages(feature.fallbackPages, lbl, 'fallbackPages');
        checkPages(feature.repeatPages, lbl, 'repeatPages');
      } else if (feature.type === 'trigger') {
        const r = feature.rect;
        if (!r || typeof r !== 'object') {
          addValidationError(GROUP, lbl + ': missing rect');
        } else {
          if (![r.x1, r.y1, r.x2, r.y2].every(_isFiniteNumber))
            addValidationError(GROUP, lbl + ': rect has a missing/non-numeric x1/y1/x2/y2');
          else {
            if (r.x1 > r.x2) addValidationError(GROUP, lbl + ': rect.x1 (' + r.x1 + ') is greater than rect.x2 (' + r.x2 + ')');
            if (r.y1 > r.y2) addValidationError(GROUP, lbl + ': rect.y1 (' + r.y1 + ') is greater than rect.y2 (' + r.y2 + ')');
            if (r.x1 < 0 || r.x2 > cols || r.y1 < 0 || r.y2 > rows)
              addValidationError(GROUP, lbl + ': rect [' + r.x1 + ',' + r.y1 + ' - ' + r.x2 + ',' + r.y2 + '] is out of bounds for a ' + cols + 'x' + rows + ' grid');
          }
        }

        if (!feature.pages)
          addValidationError(GROUP, lbl + ': missing pages -- a trigger with nothing to show is likely a mistake');
        checkPages(feature.pages, lbl, 'pages');
        checkPages(feature.repeatPages, lbl, 'repeatPages');
      }

      if (feature.name !== undefined && typeof feature.name !== 'string')
        addValidationWarning(GROUP, lbl + ': name is present but not a string');
      if (feature.label !== undefined && typeof feature.label !== 'string')
        addValidationWarning(GROUP, lbl + ': label is present but not a string');
    });
  }

  return checked;
}

// ─── Orchestrator + report ──────────────────────────────────────────────────
// Resets the shared issue arrays, runs every category above (collecting
// everything rather than stopping at the first problem), then prints a
// grouped, readable report: one checkmark line per category with its
// checked-item count, then every collected error/warning grouped by
// category. Returns a plain summary object so callers that aren't just
// reading the console (tests, the debug menu's "Validate Data" row) can act
// on the result without re-parsing console output.
// ─── 11. Stable-ID pickups (#4) ──────────────────────────────────────────────
// Registry-driven: every persistent placed pickup carries an authored, unique,
// lowercase `pickup_<snake>` id, is registered, and every id in the frozen
// v2→v3 migration snapshot resolves to a real current pickup. Discovery source
// is MAP_METADATA.items (the authoritative content list), so a placed pickup
// that lacks an id — and would therefore silently fail to persist — is flagged.
function validatePickups() {
  const GROUP = 'Pickups';
  let checked = 0;
  const ID_RE = /^pickup_[a-z0-9_]+$/;
  const reg = window.PICKUP_REGISTRY;
  if (!reg || typeof MAP_METADATA === 'undefined') {
    addValidationWarning(GROUP, 'PICKUP_REGISTRY or MAP_METADATA unavailable — pickup checks skipped (script load order)');
    return checked;
  }
  if (_isPlainArray(window.PICKUP_REGISTRY_DUP_IDS)) {
    for (const id of window.PICKUP_REGISTRY_DUP_IDS)
      addValidationError(GROUP, 'duplicate pickup id "' + id + '" — two different pickup objects share it');
  }
  for (const id of Object.keys(reg)) {
    checked++;
    const p = reg[id];
    if (!ID_RE.test(id)) addValidationError(GROUP, 'pickup id "' + id + '" is not lowercase pickup_<snake> format');
    if (!p || typeof p !== 'object') { addValidationError(GROUP, 'pickup "' + id + '" does not reference a real object'); continue; }
    if (p.id !== id) addValidationError(GROUP, 'pickup registry key "' + id + '" != object id "' + p.id + '"');
    if (!('picked' in p)) addValidationError(GROUP, 'pickup "' + id + '" has no boolean `picked` — likely an accidental non-placement registration');
    if (typeof p.name !== 'string') addValidationError(GROUP, 'pickup "' + id + '" has no name — likely not a placed pickup');

    // Cross-seam pickup CAPABILITY (EXPLICIT, allowlist, fail-closed). A pickup
    // that opts into crossing an eligible seam must satisfy the ordinary
    // 'registry_grant' contract exactly (recognized capability, registered
    // ordinary-type name, no quest/key marker, no unknown behaviour-bearing
    // property). No authored pickup opts in today; this guards future content so a
    // special/quest/key item, an unknown type/capability, or a callback-bearing
    // pickup can never silently become cross-seam collectible. See
    // world-point-content.js's crossSeamItemCapability().
    if (p && p.crossSeamPickup !== undefined && typeof crossSeamItemCapability === 'function') {
      const cap = crossSeamItemCapability(p);
      if (!cap.ok)
        addValidationError(GROUP, 'pickup "' + id + '" declares crossSeamPickup but is not a valid cross-seam item: ' + cap.reason);
    }
  }
  // Every placed pickup reachable via MAP_METADATA.items must be registered.
  for (const key of Object.keys(MAP_METADATA)) {
    const items = MAP_METADATA[key].items;
    if (!_isPlainArray(items)) continue;
    for (const p of items) {
      if (!p || typeof p !== 'object') continue;
      if (typeof p.id !== 'string' || !reg[p.id])
        addValidationError(GROUP, 'MAP_METADATA[' + key + '] has a placed pickup (' + (p.name || '?') + ') with no id in PICKUP_REGISTRY — it would not persist');
    }
  }
  // Frozen v2→v3 migration snapshot: every mapped id must be a real current pickup.
  const snap = window.LEGACY_V2_PICKUP_FIELDS;
  if (snap && typeof snap === 'object') {
    for (const field of Object.keys(snap)) {
      checked++;
      const ids = snap[field];
      if (!_isPlainArray(ids)) { addValidationError(GROUP, 'v2→v3 pickup snapshot field "' + field + '" is not an array'); continue; }
      for (const id of ids) if (!reg[id]) addValidationError(GROUP, 'v2→v3 pickup snapshot field "' + field + '" maps to unknown id "' + id + '"');
    }
  }
  return checked;
}

// ─── 12. Stable-ID openable chests (#4) ──────────────────────────────────────
// Every ordinary openable chest (boolean `.opened`) carries a unique, lowercase
// `chest_<snake>` id, is registered, and every OPENABLE_CHESTS entry + every
// frozen v2→v3 chest-field mapping resolves to a real registered chest.
function validateChests() {
  const GROUP = 'Chests';
  let checked = 0;
  const ID_RE = /^chest_[a-z0-9_]+$/;
  const reg = window.CHEST_REGISTRY;
  if (!reg) { addValidationWarning(GROUP, 'CHEST_REGISTRY unavailable — chest checks skipped (script load order)'); return checked; }
  if (_isPlainArray(window.CHEST_REGISTRY_DUP_IDS)) {
    for (const id of window.CHEST_REGISTRY_DUP_IDS) addValidationError(GROUP, 'duplicate chest id "' + id + '"');
  }
  for (const id of Object.keys(reg)) {
    checked++;
    const c = reg[id];
    if (!ID_RE.test(id)) addValidationError(GROUP, 'chest id "' + id + '" is not lowercase chest_<snake> format');
    if (!c || typeof c !== 'object') { addValidationError(GROUP, 'chest "' + id + '" does not reference a real object'); continue; }
    if (c.id !== id) addValidationError(GROUP, 'chest registry key "' + id + '" != object id "' + c.id + '"');
    if (typeof c.opened !== 'boolean') addValidationError(GROUP, 'chest "' + id + '" has no boolean `opened` field');
  }
  // Every authoritative openable chest must be registered (one registration path).
  if (_isPlainArray(window.OPENABLE_CHESTS)) {
    for (const c of window.OPENABLE_CHESTS) {
      if (!c || typeof c !== 'object') continue;
      if (typeof c.id !== 'string' || !reg[c.id]) addValidationError(GROUP, 'an OPENABLE_CHESTS entry (' + (c.id || '?') + ') is not in CHEST_REGISTRY');
    }
  }
  const snap = window.LEGACY_V2_CHEST_FIELDS;
  if (snap && typeof snap === 'object') {
    for (const field of Object.keys(snap)) {
      checked++;
      if (!reg[snap[field]]) addValidationError(GROUP, 'v2→v3 chest snapshot field "' + field + '" maps to unknown id "' + snap[field] + '"');
    }
  }
  return checked;
}

function validateGameData() {
  VALIDATION_ERRORS   = [];
  VALIDATION_WARNINGS = [];

  const counts = {
    'Maps':            validateMaps(),
    'Map metadata':    validateMapMetadata(),
    'Regional layout': validateRegionalLayout(),
    'Continuous seams': validateContinuousSeams(),
    'Continuous content': validateContinuousContent(),
    'Tiles':           validateTiles(),
    'EDGE_TRANSITIONS': validateEdgeTransitions(),
    'NPCs':            validateNPCs(),
    'Items':           validateItems(),
    'Enemies':         validateEnemies(),
    'Dialogue':        validateDialogue(),
    'Save/Flags':      validateSaveFlags(),
    'Map Features':    validateMapFeatures(),
    'Pickups':         validatePickups(),
    'Chests':          validateChests(),
  };

  console.log('validateGameData:');
  const LABELS = {
    'Maps':             'maps checked',
    'Map metadata':     'metadata entries checked',
    'Regional layout':  'layout placements checked',
    'Continuous seams': 'eligible seams checked',
    'Continuous content': 'outdoor content maps checked',
    'Tiles':            'tiles checked',
    'EDGE_TRANSITIONS': 'edge transitions checked',
    'NPCs':             'NPCs checked',
    'Items':            'item placements checked',
    'Enemies':          'enemy templates checked',
    'Dialogue':         'dialogue/text entries checked',
    'Save/Flags':       'save flags checked',
    'Map Features':     'map features checked',
    'Pickups':          'pickup ids checked',
    'Chests':           'chest ids checked',
  };
  for (const [group, count] of Object.entries(counts)) {
    console.log('✓ ' + count + ' ' + LABELS[group]);
  }
  console.log((VALIDATION_WARNINGS.length ? '⚠' : '✓') + ' ' + VALIDATION_WARNINGS.length + ' warning' + (VALIDATION_WARNINGS.length === 1 ? '' : 's'));
  console.log((VALIDATION_ERRORS.length ? '✗' : '✓') + ' ' + VALIDATION_ERRORS.length + ' error' + (VALIDATION_ERRORS.length === 1 ? '' : 's'));

  // Errors go through console.error, warnings through console.warn (not
  // console.log) so they're visually distinguished and filterable in the
  // browser devtools console, matching how the rest of this codebase
  // already treats the two levels.
  function printGrouped(list, tag, logFn) {
    const byGroup = new Map();
    for (const issue of list) {
      if (!byGroup.has(issue.group)) byGroup.set(issue.group, []);
      byGroup.get(issue.group).push(issue.message);
    }
    for (const [group, messages] of byGroup) {
      for (const message of messages) {
        logFn('');
        logFn(tag + ' [' + group + ']:');
        logFn(message);
      }
    }
  }
  if (VALIDATION_ERRORS.length)   printGrouped(VALIDATION_ERRORS, 'ERROR', console.error);
  if (VALIDATION_WARNINGS.length) printGrouped(VALIDATION_WARNINGS, 'WARNING', console.warn);

  return {
    errors:   VALIDATION_ERRORS.length,
    warnings: VALIDATION_WARNINGS.length,
    counts:   counts,
    errorList:   VALIDATION_ERRORS.slice(),
    warningList: VALIDATION_WARNINGS.slice(),
  };
}

window.validateMaps             = validateMaps;
window.validateMapMetadata      = validateMapMetadata;
window.validateRegionalLayout   = validateRegionalLayout;
window.validateContinuousSeams  = validateContinuousSeams;
window.validateTiles            = validateTiles;
window.validateEdgeTransitions  = validateEdgeTransitions;
window.validateNPCs             = validateNPCs;
window.validateItems            = validateItems;
window.validateEnemies          = validateEnemies;
window.validateDialogue         = validateDialogue;
window.validateSaveFlags        = validateSaveFlags;
window.validateMapFeatures      = validateMapFeatures;
window.validateGameData         = validateGameData;
