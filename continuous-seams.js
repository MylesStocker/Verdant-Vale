'use strict';

// continuous-seams.js — production generalized seamless movement across every
// currently-safe reciprocal ALIGNS outdoor seam, active only while Continuous
// View is on.
//
// Canonical gameplay model is UNCHANGED: activeMap is the physical-map authority,
// player.x/.y are LOCAL pixels, saves store the active map + local placement,
// SAVE_VERSION stays 4. World-PIXEL coordinates are computed TRANSIENTLY here for
// cross-seam collision and the atomic map handoff — never persisted.
//
// ── DERIVED ELIGIBLE-SEAM AUTHORITY (no hand-maintained seam list) ──────────
// The eligible seam set is DERIVED at runtime from production authorities:
// REGIONAL_LAYOUT + placement (adjacency), EDGE_TRANSITIONS (the crossing),
// and the map-identity helpers. A directed edge mapId|dir is eligible iff:
//   • from & to are both placed in the same regionId;
//   • they are physically adjacent in `dir` (chunk delta matches);
//   • the segment's targetEdge is the inverse of `dir`;
//   • every segment on the edge is structural-only and has an ordered integer range;
//   • ranges are deterministically sorted, unique, and non-overlapping;
//   • every source + reciprocal landing cell is base-walkable;
//   • the reciprocal directed edge has the exact same complete range set.
// Results are stored in a deterministic Map indexed by 'mapId|dir' (O(1) edge
// lookup) whose value holds a small sorted segment list. The frame path only scans
// that one list. If ANY segment on an edge is malformed, ambiguous, behavior-
// bearing, nonreciprocal, or nonwalkable, the WHOLE edge fails closed.

const _CS_DELTA = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const _CS_INV   = { north: 'south', south: 'north', east: 'west', west: 'east' };

let _CS_INDEX = null;   // Map 'mapId|dir' -> { regionId, from, to, dir, axis, segments:[entry,...] }
let _CS_MAPS  = null;   // Set of mapIds participating in >= 1 eligible seam

// The ONLY EDGE_TRANSITIONS segment properties a seamless crossing understands.
// Everything else -- the known behavior-bearing `condition`/`blockedText`, AND any
// future/unknown property (`callback`, `onTransition`, `onEnter`, `effect`,
// `stateChange`, `message`, `cost`, …) -- makes the segment ineligible. This is an
// ALLOWLIST, so the classifier FAILS CLOSED: an unrecognized own property can
// never be silently accepted as seamless.
const CONTINUOUS_STRUCTURAL_PROPS = new Set(['targetMap', 'targetEdge', 'sourceRange', 'targetRange']);

// PURE structural classifier for a single EDGE_TRANSITIONS segment. Returns
// { ok, reason }. Checks ONLY the segment's own shape (not adjacency/reciprocity/
// walkability -- those are layered on in the index build). A seamless-eligible
// segment must: carry EXCLUSIVELY recognized structural properties (fail closed on
// anything else); have targetMap + a string targetEdge + an array sourceRange; and
// either omit targetRange OR carry a targetRange IDENTICAL to sourceRange (the
// documented contract: an identical targetRange is non-remapping, so it is treated
// exactly as if omitted; any DIFFERING targetRange is a remap and is ineligible).
function classifyContinuousSegment(seg) {
  if (!seg || typeof seg !== 'object') return { ok: false, reason: 'segment is not an object' };
  for (const k of Object.keys(seg)) {
    if (!CONTINUOUS_STRUCTURAL_PROPS.has(k)) return { ok: false, reason: 'unrecognized property "' + k + '" (fail closed)' };
  }
  if (typeof seg.targetMap === 'undefined' || seg.targetMap === null) return { ok: false, reason: 'missing targetMap' };
  if (typeof seg.targetEdge !== 'string') return { ok: false, reason: 'missing/invalid targetEdge' };
  if (!Array.isArray(seg.sourceRange) || seg.sourceRange.length !== 2) return { ok: false, reason: 'missing/invalid sourceRange' };
  if (!Number.isInteger(seg.sourceRange[0]) || !Number.isInteger(seg.sourceRange[1]) || seg.sourceRange[0] > seg.sourceRange[1]) {
    return { ok: false, reason: 'sourceRange must be ordered integers' };
  }
  if (typeof seg.targetRange !== 'undefined') {
    if (!Array.isArray(seg.targetRange) || seg.targetRange.length !== 2 ||
        seg.targetRange[0] !== seg.sourceRange[0] || seg.targetRange[1] !== seg.sourceRange[1]) {
      return { ok: false, reason: 'targetRange remaps (not identical to sourceRange)' };
    }
  }
  return { ok: true, reason: null };
}

function _csTargetMapId(targetMap) {
  return (typeof targetMap === 'string') ? targetMap
       : (typeof mapIdForRef === 'function' ? mapIdForRef(targetMap) : null);
}

// Structural edge-set classifier. Sorting a copy makes lookup deterministic
// without mutating EDGE_TRANSITIONS authoring order. Duplicate or overlapping
// ranges invalidate the whole edge; no convenient subset is ever returned.
function _classifyContinuousEdgeSegments(segs) {
  if (!Array.isArray(segs) || segs.length === 0) return { ok: false, reason: 'missing/empty segment list' };
  const parsed = [];
  for (let i = 0; i < segs.length; i++) {
    const c = classifyContinuousSegment(segs[i]);
    if (!c.ok) return { ok: false, reason: 'segment ' + i + ': ' + c.reason };
    const targetMapId = _csTargetMapId(segs[i].targetMap);
    if (!targetMapId) return { ok: false, reason: 'segment ' + i + ': unresolved targetMap' };
    parsed.push({ source: segs[i], targetMapId, targetEdge: segs[i].targetEdge, range: [segs[i].sourceRange[0], segs[i].sourceRange[1]] });
  }
  parsed.sort((a, b) => a.range[0] - b.range[0] || a.range[1] - b.range[1]);
  const targetMapId = parsed[0].targetMapId, targetEdge = parsed[0].targetEdge;
  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    if (p.targetMapId !== targetMapId || p.targetEdge !== targetEdge) {
      return { ok: false, reason: 'segments on one edge must share one target map and target edge' };
    }
    if (i > 0 && p.range[0] <= parsed[i - 1].range[1]) {
      return { ok: false, reason: 'duplicate/overlapping sourceRange values' };
    }
  }
  return { ok: true, reason: null, targetMapId, targetEdge, segments: parsed };
}

function _csEdgeCell(map, edge, along) {
  if (!Array.isArray(map)) return undefined;
  if (edge === 'north') return map[0] ? map[0][along] : undefined;
  if (edge === 'south') return map[ROWS - 1] ? map[ROWS - 1][along] : undefined;
  if (edge === 'west') return map[along] ? map[along][0] : undefined;
  if (edge === 'east') return map[along] ? map[along][COLS - 1] : undefined;
  return undefined;
}

function _csRangeBaseWalkable(fromMap, fromEdge, toMap, toEdge, range) {
  if (typeof isTileWalkable !== 'function') return false;
  const limit = (fromEdge === 'north' || fromEdge === 'south') ? COLS : ROWS;
  if (range[0] < 0 || range[1] >= limit) return false;
  for (let along = range[0]; along <= range[1]; along++) {
    if (!isTileWalkable(_csEdgeCell(fromMap, fromEdge, along)) ||
        !isTileWalkable(_csEdgeCell(toMap, toEdge, along))) return false;
  }
  return true;
}

function _csSameRanges(a, b) {
  if (!a || !b || a.parsedSegments.length !== b.parsedSegments.length) return false;
  for (let i = 0; i < a.parsedSegments.length; i++) {
    if (a.parsedSegments[i].range[0] !== b.parsedSegments[i].range[0] ||
        a.parsedSegments[i].range[1] !== b.parsedSegments[i].range[1]) return false;
  }
  return true;
}

function _buildContinuousSeamIndex() {
  const index = new Map(), maps = new Set();
  _CS_INDEX = index; _CS_MAPS = maps;
  if (typeof REGIONAL_LAYOUT === 'undefined' || typeof EDGE_TRANSITIONS === 'undefined') return;

  const directed = new Map(); // structurally complete directed edge groups, pre-reciprocal-check
  for (const regionId of Object.keys(REGIONAL_LAYOUT)) {
    const region = REGIONAL_LAYOUT[regionId];
    if (!region || !Array.isArray(region.placements)) continue;
    const placed = new Map(region.placements.map((p) => [p.mapId, p]));
    for (const srcId of Object.keys(EDGE_TRANSITIONS)) {
      if (!placed.has(srcId)) continue;
      const dirs = EDGE_TRANSITIONS[srcId];
      for (const dir of ['north', 'south', 'east', 'west']) {
        const segs = dirs[dir];
        const c = _classifyContinuousEdgeSegments(segs);
        if (!c.ok) continue;
        const tid = c.targetMapId;
        if (!tid || !placed.has(tid)) continue;
        if (c.targetEdge !== _CS_INV[dir]) continue;
        const ps = placed.get(srcId), pt = placed.get(tid), d = _CS_DELTA[dir];
        if (ps.chunkX + d[0] !== pt.chunkX || ps.chunkY + d[1] !== pt.chunkY) continue; // not adjacent in dir
        const fromMap = (typeof mapRefForId === 'function') ? mapRefForId(srcId) : null;
        const toMap = (typeof mapRefForId === 'function') ? mapRefForId(tid) : null;
        if (!c.segments.every((s) => _csRangeBaseWalkable(fromMap, dir, toMap, c.targetEdge, s.range))) continue;
        directed.set(srcId + '|' + dir, {
          regionId, from: srcId, to: tid, dir,
          axis: (dir === 'north' || dir === 'south') ? 'ns' : 'ew',
          parsedSegments: c.segments,
        });
      }
    }
  }
  for (const e of directed.values()) {
    const recip = directed.get(e.to + '|' + _CS_INV[e.dir]);
    if (!recip || recip.to !== e.from || !_csSameRanges(e, recip)) continue; // whole edge fails closed
    const segments = e.parsedSegments.map((s) => ({
      regionId: e.regionId, from: e.from, to: e.to, dir: e.dir, axis: e.axis,
      range: [s.range[0], s.range[1]],
    }));
    index.set(e.from + '|' + e.dir, {
      regionId: e.regionId, from: e.from, to: e.to, dir: e.dir, axis: e.axis,
      range: segments.length === 1 ? segments[0].range : undefined,
      segments,
    });
    maps.add(e.from);
  }
}
function _csIndex() { if (!_CS_INDEX) _buildContinuousSeamIndex(); return _CS_INDEX; }

// Public derived-authority accessors (also used by validation).
function eligibleContinuousSeam(mapId, dir, along) {
  const group = _csIndex().get(mapId + '|' + dir) || null;
  if (!group || typeof along === 'undefined') return group;
  if (!Number.isFinite(along)) return null;
  for (const segment of group.segments) {
    if (along >= segment.range[0] && along <= segment.range[1]) return segment;
    if (along < segment.range[0]) break;
  }
  return null;
}
function continuousSeamMapEligible(mapId) { _csIndex(); return _CS_MAPS.has(mapId); }
function continuousSeamEntries() {
  const out = [];
  for (const group of _csIndex().values()) out.push(...group.segments);
  return out;
}

// PURE read-only diagnostic: the structural classification of EVERY segmented
// EDGE_TRANSITIONS edge on a region-placed map. Surfaces WHY each edge is or isn't
// structurally seamless-eligible (the fail-closed reason), so validation/audit and
// the console can explain exclusions. Does not touch runtime state.
function continuousSegmentDiagnostics() {
  const out = [];
  if (typeof REGIONAL_LAYOUT === 'undefined' || typeof EDGE_TRANSITIONS === 'undefined') return out;
  const placed = new Set();
  for (const regionId of Object.keys(REGIONAL_LAYOUT)) {
    const region = REGIONAL_LAYOUT[regionId];
    if (region && Array.isArray(region.placements)) region.placements.forEach((p) => placed.add(p.mapId));
  }
  for (const srcId of Object.keys(EDGE_TRANSITIONS)) {
    if (!placed.has(srcId)) continue;
    const dirs = EDGE_TRANSITIONS[srcId];
    for (const dir of ['north', 'south', 'east', 'west']) {
      const segs = dirs[dir];
      if (!Array.isArray(segs) || segs.length === 0) continue;
      const c = _classifyContinuousEdgeSegments(segs);
      out.push({
        from: srcId, dir, structural: c.ok, reason: c.reason,
        segmentCount: segs.length,
        ranges: c.ok ? c.segments.map((s) => s.range.slice()) : [],
      });
    }
  }
  return out;
}

// (Solid-NPC world placement for player collision now comes from the shared
// read-only regionalNpcPose() authority — see continuousFootprintWalkable(). The
// former content-key→offset probe was removed with it.)

// ── Geometry helpers (world PIXELS) ─────────────────────────────────────────
function _csChunkAt(regionId, worldPxX, worldPxY) {
  const CW = COLS * TILE, CH = ROWS * TILE;
  const chunkX = Math.floor(worldPxX / CW), chunkY = Math.floor(worldPxY / CH);
  return { chunkX, chunkY, mapId: mapIdForChunk(regionId, chunkX, chunkY) };
}
// Direction from chunk `a` to ORTHOGONALLY adjacent chunk `b`; null for same
// chunk OR diagonal (diagonally-touching chunks are never treated as adjacent).
function _csDir(a, b) {
  const dx = b.chunkX - a.chunkX, dy = b.chunkY - a.chunkY;
  if (dx === 0 && dy === -1) return 'north';
  if (dx === 0 && dy === 1)  return 'south';
  if (dx === 1 && dy === 0)  return 'east';
  if (dx === -1 && dy === 0) return 'west';
  return null;
}
// The eligible seam a footprint sample may cross from `standChunk` to reach the
// chunk containing (worldPxX,worldPxY), or null if that crossing is not allowed
// (same chunk handled by caller; diagonal / non-adjacent / ineligible / out-of-
// range all -> null).
function _csCrossingSeam(regionId, standChunk, worldPxX, worldPxY) {
  const c = _csChunkAt(regionId, worldPxX, worldPxY);
  if (!c.mapId) return null;                                  // void / out-of-region / missing chunk
  const dir = _csDir(standChunk, c);
  if (!dir) return null;                                      // diagonal or non-adjacent
  const axis = (dir === 'north' || dir === 'south') ? 'ns' : 'ew';
  const along = (axis === 'ns') ? (Math.floor(worldPxX / TILE) - standChunk.chunkX * COLS)
                                : (Math.floor(worldPxY / TILE) - standChunk.chunkY * ROWS);
  const seam = eligibleContinuousSeam(standChunk.mapId, dir, along);
  if (!seam || seam.to !== c.mapId) return null;              // ineligible neighbour
  return seam;
}

// World-aware collision, preserving canWalk()'s exact footprint (shared
// footprintCorners) and NPC semantics. Each of the four corners must be walkable
// on its chunk; a corner in a DIFFERENT chunk than the standing point is allowed
// ONLY across an eligible seam, in range, direction matching, with a walkable
// destination tile (missing chunk / void / out-of-range / ineligible neighbour /
// blocked tile / diagonal are impassable). Solid NPCs on any eligible seam map
// block, center-based, exactly like canWalk().
function continuousFootprintWalkable(regionId, standChunk, worldPxX, worldPxY) {
  for (const [wx, wy] of footprintCorners(worldPxX, worldPxY)) {
    const c = _csChunkAt(regionId, wx, wy);
    const sameChunk = (c.chunkX === standChunk.chunkX && c.chunkY === standChunk.chunkY);
    if (!sameChunk && !_csCrossingSeam(regionId, standChunk, wx, wy)) return false;
    const t = tileAtWorld(regionId, Math.floor(wx / TILE), Math.floor(wy / TILE));
    if (!isTileWalkable(t)) return false;
  }
  // Solid regional NPCs block the player, center-based, exactly like canWalk() —
  // compared in regional WORLD pixels via the shared read-only pose authority
  // (regional-npc-runtime.js), so a solid neighbour NPC across an eligible seam is
  // honoured and ambiguous/explicit ownership resolves correctly. No probe, no
  // transient activeMap assignment.
  if (typeof regionalNpcPose === 'function') {
    for (const npc of SIMPLE_NPCS) {
      if (!npc.solid) continue;
      const op = regionalNpcPose(npc);
      if (!op) continue;
      if (Math.abs(worldPxX - op.worldPxX) < 18 && Math.abs(worldPxY - op.worldPxY) < 18) return false;
    }
  }
  return true;
}

// ── Engagement (exact current/candidate footprint contact; NO fixed corridor) ─
// Returns true iff Continuous View is on, the active map participates in an
// eligible seam, and the CURRENT footprint already touches an eligible seam, OR
// the CANDIDATE footprint (after this frame's dx,dy) would, OR the candidate
// standing point would cross one. Being merely near a seam without footprint
// contact (footprint fully inside one map) does NOT engage — the old one-tile
// corridor is gone.
function _csFootprintTouches(regionId, standChunk, worldPxX, worldPxY) {
  for (const [wx, wy] of footprintCorners(worldPxX, worldPxY)) {
    const c = _csChunkAt(regionId, wx, wy);
    if (c.chunkX === standChunk.chunkX && c.chunkY === standChunk.chunkY) continue;
    if (_csCrossingSeam(regionId, standChunk, wx, wy)) return true;
  }
  return false;
}
function continuousSeamEngaged(dx, dy) {
  if (typeof continuousWorldViewActive !== 'function' || !continuousWorldViewActive()) return false;
  const mapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  if (!mapId || !continuousSeamMapEligible(mapId)) return false;
  const p = regionPlacementForMapId(mapId);
  if (!p) return false;
  const regionId = p.regionId;
  const stand = { chunkX: p.chunkX, chunkY: p.chunkY, mapId };
  // Player world point from the CANONICAL authority (continuousWorldViewActive() has
  // already established we are on a placed regional map, so this is non-null).
  const c = (typeof regionalWorldPosition === 'function') ? regionalWorldPosition() : null;
  if (!c) return false;
  const wx = c.worldPxX, wy = c.worldPxY;
  if (_csFootprintTouches(regionId, stand, wx, wy)) return true;          // current footprint straddles
  if (_csFootprintTouches(regionId, stand, wx + dx, wy + dy)) return true; // candidate footprint straddles
  const cc = _csChunkAt(regionId, wx + dx, wy + dy);                       // candidate standing crossing
  if (cc.mapId && (cc.chunkX !== stand.chunkX || cc.chunkY !== stand.chunkY)) {
    if (_csCrossingSeam(regionId, stand, wx + dx, wy + dy)) return true;
  }
  return false;
}

// ── World-aware movement + atomic handoff ───────────────────────────────────
// One axis, in world pixels: move only if the resulting footprint is walkable;
// then, if the STANDING POINT crossed into an eligible neighbour chunk, switch
// activeMap atomically and convert the (unchanged) world position to destination-
// local pixels — preserving sub-tile progress and facing, without inset/nudge/
// clamp/toast/cooldown/transitionToLocation. At most one handoff per axis; a
// blocked axis simply doesn't move (wall sliding preserved).
function _csMoveAxis(dx, dy) {
  if (dx === 0 && dy === 0) return;
  const mapId = mapIdForRef(activeMap);
  const p = regionPlacementForMapId(mapId);
  const regionId = p.regionId;
  const stand = { chunkX: p.chunkX, chunkY: p.chunkY, mapId };
  // The candidate world point is CALCULATED from the canonical world position (not
  // chunkX*CW + player.x). After an X-axis handoff the Y call re-reads the updated
  // canonical, so the second axis sees the first axis's commit.
  const c = (typeof regionalWorldPosition === 'function') ? regionalWorldPosition() : null;
  if (!c) return;
  const nwx = c.worldPxX + dx;
  const nwy = c.worldPxY + dy;
  if (!continuousFootprintWalkable(regionId, stand, nwx, nwy)) return; // blocked this axis
  const nc = _csChunkAt(regionId, nwx, nwy);
  if (nc.chunkX !== stand.chunkX || nc.chunkY !== stand.chunkY) {
    // Standing point crossed — allow ONLY across an eligible seam (never guess).
    if (!_csCrossingSeam(regionId, stand, nwx, nwy)) return; // ambiguous/ineligible: block, don't move
  }
  // ONE canonical commit of the (validated) world-pixel point: it derives the
  // destination map + local projection (a handoff when the standing point crossed,
  // otherwise the same chunk), preserving sub-tile progress. The next axis re-reads
  // activeMap, so an X handoff is visible to the Y step.
  commitRegionalWorldPosition(regionId, nwx, nwy);
}
// X before Y (Y resolved from the possibly-handed-off map/position). Each axis
// applied at most once; two handoffs in one diagonal frame only if each axis
// independently crosses a real eligible seam.
function continuousSeamMove(dx, dy) {
  if (dx !== 0) _csMoveAxis(dx, 0);
  if (dy !== 0) _csMoveAxis(0, dy);
}

// Should update() SUPPRESS its legacy inset edge transition on `dir` this frame?
// True only when Continuous View is on, the active map has an eligible seam on
// `dir`, and the player's current along-edge coordinate is inside that seam's
// range. Suppressing lets ordinary canWalk() walk the player up to the seam edge
// (no inset), where exact footprint-contact engagement then takes over — so the
// approach is seamless WITHOUT a fixed engagement corridor. For a non-eligible
// edge or an out-of-range position this returns false and the legacy transition
// runs exactly as before.
function continuousSeamSuppressLegacyEdge(dir) {
  if (typeof continuousWorldViewActive !== 'function' || !continuousWorldViewActive()) return false;
  const mapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  const group = mapId ? eligibleContinuousSeam(mapId, dir) : null;
  if (!group) return false;
  const along = (group.axis === 'ns') ? Math.floor(player.x / TILE) : Math.floor(player.y / TILE);
  return !!eligibleContinuousSeam(mapId, dir, along);
}

// PUBLIC cross-seam authorization primitive (world PIXELS). Given the active
// physical map id and a TARGET world-pixel point, returns the single eligible
// seam that a standing observer on the active chunk would cross to REACH that
// point — or null when the crossing is not authorized. This is the exact same
// fail-closed gate the movement collision path uses (_csCrossingSeam): the
// target must lie in a chunk that is DIRECTLY CARDINALLY adjacent to the active
// chunk, reached via a reciprocal eligible seam, with the crossing coordinate
// inside that seam's approved range; diagonal / non-adjacent / ineligible /
// out-of-range / void / off-region all return null. It is READ-ONLY: it never
// assigns activeMap, player, coordinates, content keys, or NPC state, so static
// cross-seam content (item pickups, safe stationary NPC dialogue) can authorize
// a neighbouring target without any transient context impersonation.
function continuousSeamCrossingAt(activeMapId, targetWorldPxX, targetWorldPxY) {
  if (typeof continuousWorldViewActive !== 'function' || !continuousWorldViewActive()) return null;
  const p = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(activeMapId) : null;
  if (!p) return null;
  const stand = { chunkX: p.chunkX, chunkY: p.chunkY, mapId: activeMapId };
  return _csCrossingSeam(p.regionId, stand, targetWorldPxX, targetWorldPxY);
}

// Debug-inspector diagnostic: does the active map participate in an eligible
// seam, and (if engaged) which pair/direction is currently engaged?
function continuousSeamDiagnostic() {
  const mapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  if (!mapId || !continuousSeamMapEligible(mapId)) return null;
  const p = regionPlacementForMapId(mapId);
  const regionId = p.regionId;
  const stand = { chunkX: p.chunkX, chunkY: p.chunkY, mapId };
  // Player world point from the canonical authority (fail-closed on a broken invariant).
  const cp = (typeof regionalWorldPosition === 'function') ? regionalWorldPosition() : null;
  if (!cp) return null;
  const wx = cp.worldPxX, wy = cp.worldPxY;
  let engaged = null;
  for (const [ox, oy] of footprintCorners(wx, wy)) {
    const c = _csChunkAt(regionId, ox, oy);
    if (c.chunkX === stand.chunkX && c.chunkY === stand.chunkY) continue;
    const seam = _csCrossingSeam(regionId, stand, ox, oy);
    if (seam) { engaged = seam.from + '->' + seam.to + ' (' + seam.dir + ' ' + seam.range[0] + '-' + seam.range[1] + ')'; break; }
  }
  return { participates: true, engaged };
}

if (typeof window !== 'undefined') {
  window.classifyContinuousSegment   = classifyContinuousSegment;
  window.continuousSegmentDiagnostics = continuousSegmentDiagnostics;
  window.eligibleContinuousSeam      = eligibleContinuousSeam;
  window.continuousSeamMapEligible   = continuousSeamMapEligible;
  window.continuousSeamEntries       = continuousSeamEntries;
  window.continuousFootprintWalkable = continuousFootprintWalkable;
  window.continuousSeamEngaged       = continuousSeamEngaged;
  window.continuousSeamMove          = continuousSeamMove;
  window.continuousSeamSuppressLegacyEdge = continuousSeamSuppressLegacyEdge;
  window.continuousSeamCrossingAt    = continuousSeamCrossingAt;
  window.continuousSeamDiagnostic    = continuousSeamDiagnostic;
}
