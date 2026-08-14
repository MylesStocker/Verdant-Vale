'use strict';

// continuous-seams.js — DEBUG-ONLY generalized seamless movement across every
// currently-SAFE reciprocal ALIGNS outdoor seam, active only while Continuous
// View is on.
//
// Canonical gameplay model is UNCHANGED: activeMap is the physical-map authority,
// player.x/.y are LOCAL pixels, saves store the active map + local placement,
// SAVE_VERSION stays 3. World-PIXEL coordinates are computed TRANSIENTLY here for
// cross-seam collision and the atomic map handoff — never persisted.
//
// ── DERIVED ELIGIBLE-SEAM AUTHORITY (no hand-maintained seam list) ──────────
// The eligible seam set is DERIVED at runtime from production authorities:
// REGIONAL_LAYOUT + placement (adjacency), EDGE_TRANSITIONS (the crossing),
// and the map-identity helpers. A directed edge mapId|dir is eligible iff:
//   • from & to are both placed in the same regionId;
//   • they are physically adjacent in `dir` (chunk delta matches);
//   • the segment's targetEdge is the inverse of `dir`;
//   • it is the ONLY segment on that edge (a single broad crossing);
//   • it has no condition / blockedText (no toll/cutscene/state gate);
//   • it has no targetRange (no clamping/remap);
//   • the reciprocal directed edge exists with an IDENTICAL range.
// Results are stored in a deterministic Map indexed by 'mapId|dir' (O(1) lookup;
// the frame path never scans all seams). validateContinuousSeams() (validation.js)
// cross-checks this derived index; nothing here depends on test/transition-audit.js.

const _CS_DELTA = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const _CS_INV   = { north: 'south', south: 'north', east: 'west', west: 'east' };

let _CS_INDEX = null;   // Map 'mapId|dir' -> { regionId, from, to, dir, axis:'ns'|'ew', range:[min,max] }
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
  if (typeof seg.targetRange !== 'undefined') {
    if (!Array.isArray(seg.targetRange) || seg.targetRange.length !== 2 ||
        seg.targetRange[0] !== seg.sourceRange[0] || seg.targetRange[1] !== seg.sourceRange[1]) {
      return { ok: false, reason: 'targetRange remaps (not identical to sourceRange)' };
    }
  }
  return { ok: true, reason: null };
}

function _buildContinuousSeamIndex() {
  const index = new Map(), maps = new Set();
  _CS_INDEX = index; _CS_MAPS = maps;
  if (typeof REGIONAL_LAYOUT === 'undefined' || typeof EDGE_TRANSITIONS === 'undefined') return;

  const directed = []; // candidate eligible directed edges (pre-reciprocal-check)
  for (const regionId of Object.keys(REGIONAL_LAYOUT)) {
    const region = REGIONAL_LAYOUT[regionId];
    if (!region || !Array.isArray(region.placements)) continue;
    const placed = new Map(region.placements.map((p) => [p.mapId, p]));
    for (const srcId of Object.keys(EDGE_TRANSITIONS)) {
      if (!placed.has(srcId)) continue;
      const dirs = EDGE_TRANSITIONS[srcId];
      for (const dir of ['north', 'south', 'east', 'west']) {
        const segs = dirs[dir];
        if (!Array.isArray(segs) || segs.length !== 1) continue; // single broad crossing only
        const s = segs[0];
        if (!classifyContinuousSegment(s).ok) continue;          // FAIL CLOSED on any non-structural property
        const tid = (typeof s.targetMap === 'string') ? s.targetMap
                  : (typeof mapIdForRef === 'function' ? mapIdForRef(s.targetMap) : null);
        if (!tid || !placed.has(tid)) continue;
        if (s.targetEdge !== _CS_INV[dir]) continue;
        const ps = placed.get(srcId), pt = placed.get(tid), d = _CS_DELTA[dir];
        if (ps.chunkX + d[0] !== pt.chunkX || ps.chunkY + d[1] !== pt.chunkY) continue; // not adjacent in dir
        directed.push({ regionId, from: srcId, to: tid, dir, axis: (dir === 'north' || dir === 'south') ? 'ns' : 'ew', range: [s.sourceRange[0], s.sourceRange[1]] });
      }
    }
  }
  for (const e of directed) {
    const recip = directed.find((x) => x.from === e.to && x.to === e.from && x.dir === _CS_INV[e.dir]);
    if (!recip) continue;                                             // one-way -> exclude
    if (e.range[0] !== recip.range[0] || e.range[1] !== recip.range[1]) continue; // range mismatch -> exclude
    index.set(e.from + '|' + e.dir, e);
    maps.add(e.from);
  }
}
function _csIndex() { if (!_CS_INDEX) _buildContinuousSeamIndex(); return _CS_INDEX; }

// Public derived-authority accessors (also used by validation).
function eligibleContinuousSeam(mapId, dir) { const i = _csIndex(); return i.has(mapId + '|' + dir) ? i.get(mapId + '|' + dir) : null; }
function continuousSeamMapEligible(mapId) { _csIndex(); return _CS_MAPS.has(mapId); }
function continuousSeamEntries() { return Array.from(_csIndex().values()); }

// PURE read-only diagnostic: the structural classification of EVERY single-segment
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
      if (segs.length !== 1) { out.push({ from: srcId, dir, structural: false, reason: 'multiple segments on one edge' }); continue; }
      const c = classifyContinuousSegment(segs[0]);
      out.push({ from: srcId, dir, structural: c.ok, reason: c.reason });
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
  const seam = eligibleContinuousSeam(standChunk.mapId, dir);
  if (!seam || seam.to !== c.mapId) return null;              // ineligible neighbour
  const along = (seam.axis === 'ns') ? (Math.floor(worldPxX / TILE) - standChunk.chunkX * COLS)
                                     : (Math.floor(worldPxY / TILE) - standChunk.chunkY * ROWS);
  if (along < seam.range[0] || along > seam.range[1]) return null; // outside the approved range
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
  const regionId = p.regionId, CW = COLS * TILE, CH = ROWS * TILE;
  const stand = { chunkX: p.chunkX, chunkY: p.chunkY, mapId };
  const wx = p.chunkX * CW + player.x, wy = p.chunkY * CH + player.y;
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
  const regionId = p.regionId, CW = COLS * TILE, CH = ROWS * TILE;
  const stand = { chunkX: p.chunkX, chunkY: p.chunkY, mapId };
  const nwx = p.chunkX * CW + player.x + dx;
  const nwy = p.chunkY * CH + player.y + dy;
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
  const seam = mapId ? eligibleContinuousSeam(mapId, dir) : null;
  if (!seam) return false;
  const along = (seam.axis === 'ns') ? Math.floor(player.x / TILE) : Math.floor(player.y / TILE);
  return along >= seam.range[0] && along <= seam.range[1];
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
  const regionId = p.regionId, CW = COLS * TILE, CH = ROWS * TILE;
  const stand = { chunkX: p.chunkX, chunkY: p.chunkY, mapId };
  const wx = p.chunkX * CW + player.x, wy = p.chunkY * CH + player.y;
  let engaged = null;
  for (const [ox, oy] of footprintCorners(wx, wy)) {
    const c = _csChunkAt(regionId, ox, oy);
    if (c.chunkX === stand.chunkX && c.chunkY === stand.chunkY) continue;
    const seam = _csCrossingSeam(regionId, stand, ox, oy);
    if (seam) { engaged = seam.from + '->' + seam.to + ' (' + seam.dir + ')'; break; }
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
