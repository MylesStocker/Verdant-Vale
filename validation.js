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

// ─── 2. Map metadata ────────────────────────────────────────────────────────
// MAP_METADATA (data.js) is the single source of truth for per-map
// bookkeeping (display name, region, type, item list, encounter pool,
// encounter/save permissions). This checks the table is internally sound
// AND agrees with MAP_REGISTRY -- kept as two independently-defined tables
// (not one derived from the other) because MAP_REGISTRY lives in maps.js,
// which loads before data.js, and MAP_METADATA needs the *_ENEMY_TEMPLATES
// pools/​*_ITEMS arrays data.js itself defines.
//
// Deliberately does NOT force every map type to look the same: a dungeon
// floor's encounterPool is expected to be non-null, a town square's is
// expected to be null -- only the FIELDS themselves (present, right shape)
// are required across all types, not particular values.
function validateMapMetadata() {
  const GROUP = 'Map metadata';
  let checked = 0;
  if (typeof MAP_METADATA === 'undefined') {
    addValidationError(GROUP, 'MAP_METADATA is undefined -- check script load order (data.js)');
    return checked;
  }

  const VALID_TYPES = new Set(['outdoor', 'town', 'interior', 'dungeon', 'bridge', 'special']);
  const registryKeys = (typeof MAP_REGISTRY !== 'undefined') ? new Set(Object.keys(MAP_REGISTRY)) : null;
  const metadataKeys = new Set(Object.keys(MAP_METADATA));

  if (registryKeys) {
    for (const key of registryKeys) {
      if (!metadataKeys.has(key)) addValidationError(GROUP, 'MAP_REGISTRY[' + key + ']: no matching MAP_METADATA entry -- locationName()/currentItemList()/encounter pool lookups will silently fall back for this map');
    }
    for (const key of metadataKeys) {
      if (!registryKeys.has(key)) addValidationWarning(GROUP, 'MAP_METADATA[' + key + ']: no matching MAP_REGISTRY entry -- registered map missing from debug/audit tooling that reads MAP_REGISTRY');
    }
  } else {
    addValidationWarning(GROUP, 'MAP_REGISTRY not available -- cross-validation with MAP_METADATA skipped');
  }

  const rows = _validationRows(), cols = _validationCols();
  for (const [key, m] of Object.entries(MAP_METADATA)) {
    const lbl = 'MAP_METADATA[' + key + ']';
    if (!m || typeof m !== 'object') { addValidationError(GROUP, lbl + ': not an object'); continue; }
    checked++;

    if (m.id !== key) addValidationWarning(GROUP, lbl + ': id "' + m.id + '" does not match its own property key (cosmetic -- nothing looks this field up, but it invites confusion)');

    if (!_isPlainArray(m.map)) {
      addValidationError(GROUP, lbl + ': map is not an array -- points to a missing/undefined constant');
    } else {
      if (m.map.length !== rows) addValidationError(GROUP, lbl + ': map has ' + m.map.length + ' rows (expected ' + rows + ')');
      m.map.forEach((row, r) => {
        if (!_isPlainArray(row) || row.length !== cols)
          addValidationError(GROUP, lbl + ' row ' + r + ': has ' + (_isPlainArray(row) ? row.length : 'non-array') + ' cols (expected ' + cols + ')');
      });
      if (registryKeys && registryKeys.has(key) && MAP_REGISTRY[key].map !== m.map)
        addValidationError(GROUP, lbl + ': map array reference does not match MAP_REGISTRY[' + key + '].map (two different arrays for the same id)');
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
// range, at least one walkable coordinate on both the source edge and the
// computed target landing row/col, a condition function that can safely be
// called without throwing, and (as a warning, not an error, since one-way
// links are a real, supported pattern) a reciprocal link back from the
// target map.
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

  // Computes the landing (row, col) tryEdgeTransition() would use for a
  // given targetEdge + along-value, WITHOUT clamping -- clamping is checked
  // separately as its own rule ("target range/clamping is valid").
  function landingCoord(targetEdge, along) {
    if (targetEdge === 'south') return { row: rows - 2, col: along };
    if (targetEdge === 'north') return { row: 1, col: along };
    if (targetEdge === 'west')  return { row: along, col: 1 };
    if (targetEdge === 'east')  return { row: along, col: cols - 2 };
    return null;
  }

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

        // At least one source-edge coordinate in range must be walkable, or
        // the transition can never actually be triggered.
        const sourceEdgeRow = (direction === 'north') ? 0 : (direction === 'south') ? rows - 1 : null;
        const sourceEdgeCol = (direction === 'west') ? 0 : (direction === 'east') ? cols - 1 : null;
        let anySourceWalkable = false;
        for (let along = Math.max(0, srcMin); along <= Math.min(srcMax, srcMaxVal); along++) {
          const r = sourceEdgeRow !== null ? sourceEdgeRow : along;
          const c = sourceEdgeCol !== null ? sourceEdgeCol : along;
          const row = sourceMeta.map[r];
          if (row && WALKABLE[row[c]]) { anySourceWalkable = true; break; }
        }
        if (!anySourceWalkable)
          addValidationError(GROUP, targetLbl + ': no walkable tile anywhere in sourceRange [' + srcMin + ', ' + srcMaxVal + '] on the ' + direction + ' edge -- this transition can never be triggered');

        // At least one target landing coordinate (across the full
        // clamp-target range) must be walkable, or every possible crossing
        // strands the player on a blocked tile.
        let anyTargetWalkable = false;
        for (let along = Math.max(0, tgtMin); along <= Math.min(tgtMax, tgtMaxVal); along++) {
          const landing = landingCoord(seg.targetEdge, along);
          if (!landing) continue;
          const row = target.map[landing.row];
          if (row && WALKABLE[row[landing.col]]) { anyTargetWalkable = true; break; }
        }
        if (!anyTargetWalkable)
          addValidationError(GROUP, targetLbl + ': no walkable landing tile anywhere in the target range -- every possible crossing would strand the player on a blocked tile');

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

  // Same string-id scheme currentMapId() returns -- the only valid values
  // for npc.map. Kept here (not derived from MAP_METADATA, which uses a
  // different, MAP_REGISTRY-style id scheme) because that's genuinely a
  // separate namespace -- see movement.js's currentMapId() and the note in
  // maps.js about mapRegistryId() being a different lookup for a different
  // purpose.
  const VALID_MAP_IDS = new Set([
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
    'drenwick_wash_house', 'drenwick_provision_store', 'drenwick_guild_hall',
    'drenwick_tavern', 'drenwick_school_ground', 'drenwick_school_upper',
    'drenwick_school_basement',
    'drenwick_west_residential', 'drenwick_canal_docks',
    'drenwick_east_outskirts', 'drenwick_market',
    'drenwick_waterfront', 'drenwick_civic',
  ]);
  const VALID_SPRITE_TYPES = new Set(['clerk', 'patron', 'child', 'worker', 'traveler']);
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
      } else if (!VALID_MAP_IDS.has(base)) {
        addValidationWarning(GROUP, lbl + ': map id "' + mapVal + '" is not in the known currentMapId() list -- confirm it\'s a real, reachable map id (this list is a maintained cross-check, not derived automatically, so a genuinely new area can trip this once until the list is updated)');
      }

      // In-bounds + walkability, only meaningful once we know which real
      // map array this resolves to.
      if (npc.x != null && npc.y != null) {
        const rows = _validationRows(), cols = _validationCols();
        const tx = npc.x / TILE, ty = npc.y / TILE;
        if (tx < 0 || tx > cols) addValidationError(GROUP, lbl + ': x=' + npc.x + ' (tile ' + tx.toFixed(2) + ') outside 0-' + cols);
        if (ty < 0 || ty > rows) addValidationError(GROUP, lbl + ': y=' + npc.y + ' (tile ' + ty.toFixed(2) + ') outside 0-' + rows);

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
    ['MIRE_VAULT_CHEST',     typeof MIRE_VAULT_CHEST     !== 'undefined' ? MIRE_VAULT_CHEST     : undefined],
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
// scripted boss templates like PALE_SENTRY_TEMPLATE), and cross-checks
// every template against render-battle.js's BATTLE_SPRITE_NAMES so a
// template with no battle sprite mapping is caught here rather than
// discovered as a blank enemy in a real fight -- see render-battle.js's
// comment on why that Set exists and how drawBattleEnemy()'s fallback
// works.
function validateEnemies() {
  const GROUP = 'Enemies';
  let checked = 0;

  const NUMERIC_FIELDS = ['hp', 'maxHp', 'atk', 'def', 'spd', 'xp', 'goldMin', 'goldMax'];
  const spriteNames = (typeof BATTLE_SPRITE_NAMES !== 'undefined') ? BATTLE_SPRITE_NAMES : null;

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

    if (t.name && spriteNames && !spriteNames.has(t.name))
      addValidationWarning(GROUP, lbl + ' (' + t.name + '): no battle sprite mapping in render-battle.js\'s drawBattleEnemy() -- falls back to the generic sprite (see drawBattleGenericEnemy()); add a dedicated one if this enemy deserves its own look');
  }

  // Same window[name]-doesn't-work caveat as validateItems() -- these are
  // top-level `const`s in data.js, not window properties, so each is
  // resolved via a real `typeof X !== 'undefined'` identifier check rather
  // than a string-keyed lookup.
  const POOLS = [
    ['ENEMY_TEMPLATES',               typeof ENEMY_TEMPLATES               !== 'undefined' ? ENEMY_TEMPLATES               : undefined],
    ['EARLY_ENEMY_TEMPLATES',         typeof EARLY_ENEMY_TEMPLATES         !== 'undefined' ? EARLY_ENEMY_TEMPLATES         : undefined],
    ['DUNGEON_ENEMY_TEMPLATES',       typeof DUNGEON_ENEMY_TEMPLATES       !== 'undefined' ? DUNGEON_ENEMY_TEMPLATES       : undefined],
    ['DUNGEON2_ENEMY_TEMPLATES',      typeof DUNGEON2_ENEMY_TEMPLATES      !== 'undefined' ? DUNGEON2_ENEMY_TEMPLATES      : undefined],
    ['DUNGEON6_ENEMY_TEMPLATES',      typeof DUNGEON6_ENEMY_TEMPLATES      !== 'undefined' ? DUNGEON6_ENEMY_TEMPLATES      : undefined],
    ['DUNGEON8_ENEMY_TEMPLATES',      typeof DUNGEON8_ENEMY_TEMPLATES      !== 'undefined' ? DUNGEON8_ENEMY_TEMPLATES      : undefined],
    ['DUNGEON_HORROR_ENEMY_TEMPLATES', typeof DUNGEON_HORROR_ENEMY_TEMPLATES !== 'undefined' ? DUNGEON_HORROR_ENEMY_TEMPLATES : undefined],
    ['FAR_ENEMY_TEMPLATES',           typeof FAR_ENEMY_TEMPLATES           !== 'undefined' ? FAR_ENEMY_TEMPLATES           : undefined],
    ['THORNMERE_ENEMY_TEMPLATES',     typeof THORNMERE_ENEMY_TEMPLATES     !== 'undefined' ? THORNMERE_ENEMY_TEMPLATES     : undefined],
    ['SLUICE_ENEMY_TEMPLATES',        typeof SLUICE_ENEMY_TEMPLATES        !== 'undefined' ? SLUICE_ENEMY_TEMPLATES        : undefined],
    ['NORTH_BASIN_ENEMY_TEMPLATES',   typeof NORTH_BASIN_ENEMY_TEMPLATES   !== 'undefined' ? NORTH_BASIN_ENEMY_TEMPLATES   : undefined],
    ['MIRE_VAULT_ENEMY_TEMPLATES',    typeof MIRE_VAULT_ENEMY_TEMPLATES    !== 'undefined' ? MIRE_VAULT_ENEMY_TEMPLATES    : undefined],
  ];
  let anyPoolFound = false;
  for (const [poolName, pool] of POOLS) {
    if (!_isPlainArray(pool)) continue;
    anyPoolFound = true;
    pool.forEach((t, i) => checkTemplate(t, poolName + '[' + i + ']'));
  }
  if (!anyPoolFound) addValidationWarning(GROUP, 'no enemy-template pools found -- check script load order (data.js)');

  // Scripted/special templates (boss-style, not part of a random pool).
  if (typeof PALE_SENTRY_TEMPLATE !== 'undefined') checkTemplate(PALE_SENTRY_TEMPLATE, 'PALE_SENTRY_TEMPLATE');

  // Cross-check MAP_METADATA.encounterPool references a real, known pool
  // (by reference, not by re-validating contents again -- that already
  // happened above).
  if (typeof MAP_METADATA !== 'undefined') {
    const knownPools = POOLS.map(([, pool]) => pool).filter(_isPlainArray);
    const poolNameList = POOLS.map(([name]) => name).join('/');
    for (const [mapKey, m] of Object.entries(MAP_METADATA)) {
      if (m.encounterPool === null) continue;
      if (!_isPlainArray(m.encounterPool)) continue; // already flagged by validateMapMetadata()
      if (!knownPools.includes(m.encounterPool))
        addValidationWarning(GROUP, 'MAP_METADATA[' + mapKey + ']: encounterPool is an array but not one of the recognised named pools (' + poolNameList + ') -- confirm it\'s intentional, e.g. a new pool not yet added to this list');
    }
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
// Extends the existing QUEST_FLAG_SCHEMA cross-check (unchanged from
// before) with a lightweight duplicate-like-typo scan across every flag
// name this file can see referenced (schema keys, NPC flag_required/
// flag_sets values). Never touches the save schema itself -- see the note
// on why the forward/reverse schema check stays a maintained cross-check
// list rather than something auto-derived.
function validateSaveFlags() {
  const GROUP = 'Save/Flags';
  let checked = 0;

  if (typeof window.QUEST_FLAG_SCHEMA !== 'undefined' && typeof syncQuestFlagsToWindow === 'function') {
    syncQuestFlagsToWindow();
    const schema = window.QUEST_FLAG_SCHEMA;
    const schemaSet = new Set(schema);

    for (const key of schema) {
      checked++;
      if (window[key] === undefined) addValidationError(GROUP, 'schema flag "' + key + '" not set by syncQuestFlagsToWindow -- saveGame() would write undefined for this flag');
    }

    // Cross-check copy of syncQuestFlagsToWindow's keys (quests.js) -- NOT a
    // second source of truth; when quests.js adds a flag there, add it to
    // QUEST_FLAG_SCHEMA first, then update this list to match.
    const syncedByQuestFlagsToWindow = [
      'cabinetCaseFlag',
      'sluice_job_started', 'sluice_fixed', 'sluice_pay_ticket_ready', 'sluice_reward_given',
      'MainQuest', 'letter_quest_stage', 'cat_quest_stage',
      'warden_quest_started', 'warden_quest_defeated', 'warden_quest_rewarded',
      'dispatch_quest_started', 'dispatch_delivered', 'dispatch_pay_ticket_ready', 'dispatch_rewarded',
      'fort_quest_started', 'fort_quest_stage', 'fort_pay_ticket_ready',
      'smugglers_dead', 'smugglers_execution_day',
      'schilling_quest_started', 'schilling_returned',
      'drama_stage', 'weight_quest_stage', 'weight_note_signed',
      'sentry_quest_started', 'sentry_quest_done', 'sentry_quest_rewarded', 'pale_sentry_hp',
      'sickle_quest_stage', 'gridd_rainfish_warned', 'rainfish_woken',
      'den_wraith_quest_started', 'den_wraith_defeated', 'den_wraith_rewarded',
      'netto_letter_received',
    ];
    for (const key of syncedByQuestFlagsToWindow) {
      checked++;
      if (!schemaSet.has(key)) addValidationError(GROUP, '"' + key + '" is synced to window by syncQuestFlagsToWindow but absent from QUEST_FLAG_SCHEMA -- would not be saved');
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
          if (feature.x < 0 || feature.x > cols || feature.y < 0 || feature.y > rows)
            addValidationError(GROUP, lbl + ': (' + feature.x + ',' + feature.y + ') is out of bounds for a ' + cols + 'x' + rows + ' grid (tile units, not pixels)');
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
function validateGameData() {
  VALIDATION_ERRORS   = [];
  VALIDATION_WARNINGS = [];

  const counts = {
    'Maps':            validateMaps(),
    'Map metadata':    validateMapMetadata(),
    'Tiles':           validateTiles(),
    'EDGE_TRANSITIONS': validateEdgeTransitions(),
    'NPCs':            validateNPCs(),
    'Items':           validateItems(),
    'Enemies':         validateEnemies(),
    'Dialogue':        validateDialogue(),
    'Save/Flags':      validateSaveFlags(),
    'Map Features':    validateMapFeatures(),
  };

  console.log('validateGameData:');
  const LABELS = {
    'Maps':             'maps checked',
    'Map metadata':     'metadata entries checked',
    'Tiles':            'tiles checked',
    'EDGE_TRANSITIONS': 'edge transitions checked',
    'NPCs':             'NPCs checked',
    'Items':            'item placements checked',
    'Enemies':          'enemy templates checked',
    'Dialogue':         'dialogue/text entries checked',
    'Save/Flags':       'save flags checked',
    'Map Features':     'map features checked',
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
window.validateTiles            = validateTiles;
window.validateEdgeTransitions  = validateEdgeTransitions;
window.validateNPCs             = validateNPCs;
window.validateItems            = validateItems;
window.validateEnemies          = validateEnemies;
window.validateDialogue         = validateDialogue;
window.validateSaveFlags        = validateSaveFlags;
window.validateMapFeatures      = validateMapFeatures;
window.validateGameData         = validateGameData;
