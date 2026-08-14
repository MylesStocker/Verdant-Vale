'use strict';

// regional-position.js — Canonical Regional World Position (Part 1 of 2).
//
// THE authority for a placed wilderness map's runtime position. For every map
// placed in REGIONAL_LAYOUT (including Verdant Vale's legacy_screen MAP), the
// canonical position is a region-world PIXEL point:
//
//     { regionId, worldPxX, worldPxY }
//
// `activeMap`, `player.x`, `player.y` are TEMPORARY compatibility PROJECTIONS
// derived from that canonical point — never a second authority. Discrete
// locations (towns, interiors, dungeons, houses, bridges, dream, special maps)
// have NO canonical regional position (it is null) and keep the physical
// `activeMap` + local `player.x/player.y` model unchanged.
//
// Units are explicit: worldPx* / localPx* are PIXELS; chunk math uses the pixel
// chunk size (COLS*TILE by ROWS*TILE). Tile-granularity region helpers already
// live in data.js (worldToLocal/localToWorld); the ONE pixel-canonical helper
// (region world pixels -> map + local pixels) lives here.
//
// Load order: after data.js (REGIONAL_LAYOUT + reverse indexes) and state.js
// (COLS/ROWS/activeMap). Everything it touches is resolved at CALL time, so its
// callers earlier in the file list (world-transitions.js, save.js) are fine.
//
// Part 2 will move regional CONSUMERS (encounters, NPC sim, items, interactions,
// neighbour rendering, debug reads) onto this canonical context and delete their
// redundant activeMap+local derivations. Part 1 only introduces the authority
// and routes the WRITERS (movement, entry/exit, warp, camera, save/load).

// ── Private canonical state (not externally mutable) ─────────────────────────
let _regionalPosition = null; // { regionId, worldPxX, worldPxY } | null (discrete)

function _rpChunkW() { return COLS * TILE; }
function _rpChunkH() { return ROWS * TILE; }

// ── Pure conversions ─────────────────────────────────────────────────────────
// map-local pixels -> region-world pixels: { regionId, worldPxX, worldPxY } | null.
// (Thin wrapper over the shared placement index; kept here so the module is the
// single canonical-pixel entry point. world-view.js's mapLocalPxToWorldPx is the
// same math and stays for its camera callers.)
function mapLocalPxToRegionWorldPx(mapId, localPxX, localPxY) {
  const p = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(mapId) : null;
  if (!p) return null;
  if (!Number.isFinite(localPxX) || !Number.isFinite(localPxY)) return null;
  return { regionId: p.regionId, worldPxX: p.chunkX * _rpChunkW() + localPxX, worldPxY: p.chunkY * _rpChunkH() + localPxY };
}

// region-world pixels -> { regionId, mapId, map, localPxX, localPxY } | null.
// Fails (null) on non-finite input, an unknown region, a negative coordinate, or
// a void chunk (no map placed there). Pure — never mutates or throws.
function regionWorldPxToLocal(regionId, worldPxX, worldPxY) {
  if (typeof REGIONAL_LAYOUT === 'undefined' || !REGIONAL_LAYOUT[regionId]) return null;
  if (!Number.isFinite(worldPxX) || !Number.isFinite(worldPxY)) return null;
  if (worldPxX < 0 || worldPxY < 0) return null;
  const CW = _rpChunkW(), CH = _rpChunkH();
  const chunkX = Math.floor(worldPxX / CW), chunkY = Math.floor(worldPxY / CH);
  const mapId = (typeof mapIdForChunk === 'function') ? mapIdForChunk(regionId, chunkX, chunkY) : null;
  if (!mapId) return null; // void chunk / out of region
  const map = (typeof mapRefForId === 'function') ? mapRefForId(mapId) : null;
  if (!map) return null;
  return { regionId, mapId, map, localPxX: worldPxX - chunkX * CW, localPxY: worldPxY - chunkY * CH };
}

// ── Read-only accessors (fresh objects; never expose the private ref) ────────
// Current canonical regional position, or null on a discrete location.
function regionalWorldPosition() {
  return _regionalPosition ? { regionId: _regionalPosition.regionId, worldPxX: _regionalPosition.worldPxX, worldPxY: _regionalPosition.worldPxY } : null;
}
// Current canonical position projected to { regionId, mapId, map, localPxX, localPxY },
// or null on a discrete location. Read-only; does not touch runtime globals.
function regionalDerivedLocation() {
  if (!_regionalPosition) return null;
  return regionWorldPxToLocal(_regionalPosition.regionId, _regionalPosition.worldPxX, _regionalPosition.worldPxY);
}
// True iff the given (or active) map id is a placed regional map.
function isRegionalMapId(mapId) {
  return !!(typeof regionPlacementForMapId === 'function' && regionPlacementForMapId(mapId));
}

// ── Atomic writers (the ONLY sanctioned canonical mutations) ─────────────────
// Commit a region-world pixel point as the canonical position, then derive the
// compatibility projections (activeMap, player.x, player.y). Fails atomically
// (returns false, touches nothing) on a non-finite / out-of-region / void point.
// player.facing is deliberately NOT part of the position and is left untouched.
function commitRegionalWorldPosition(regionId, worldPxX, worldPxY) {
  const loc = regionWorldPxToLocal(regionId, worldPxX, worldPxY);
  if (!loc) return false; // invalid — leave canonical + projections untouched
  _regionalPosition = { regionId, worldPxX, worldPxY };
  activeMap = loc.map;         // derived projection — callers do NOT assign these
  player.x  = loc.localPxX;
  player.y  = loc.localPxY;
  return true;
}
// Enter a regional map from a validated map-local placement: derive the canonical
// world point and commit it. Fails atomically if the map is not placed regionally.
function enterRegionalMapFromLocal(mapId, localPxX, localPxY) {
  const w = mapLocalPxToRegionWorldPx(mapId, localPxX, localPxY);
  if (!w) return false;
  return commitRegionalWorldPosition(w.regionId, w.worldPxX, w.worldPxY);
}
// Clear canonical regional state — used on entry to a discrete location. Does not
// touch activeMap/player (the discrete path owns those).
function clearRegionalPosition() {
  _regionalPosition = null;
}
// The single position applier for location gateways (transitionToLocation, dream
// restore, save-load). Placement validity (bounds/walkable/facing) is the
// CALLER's preflight; this only routes regional vs discrete and keeps canonical
// state coherent: a regional destination commits canonical (+ derives
// activeMap/player); a discrete destination sets the physical map/local and
// clears canonical. Returns false only if the map id doesn't resolve.
function placeAtLocation(mapId, localPxX, localPxY) {
  if (isRegionalMapId(mapId)) return enterRegionalMapFromLocal(mapId, localPxX, localPxY);
  const map = (typeof mapRefForId === 'function') ? mapRefForId(mapId) : null;
  if (!map) return false;
  activeMap = map;
  player.x  = localPxX;
  player.y  = localPxY;
  clearRegionalPosition();
  return true;
}
// The regional MOVEMENT step's canonical write: after an accepted in-chunk
// regional step has updated the local projection, record it into canonical. Only
// acts while the active map is a placed regional map (so discrete movement is
// untouched and never gains a canonical position). This is a move-frame write,
// NOT a per-frame reconciler: it runs solely on the frame a regional step was
// applied. Returns true if it committed. Seamless handoffs already commit inside
// continuousSeamMove(); calling this afterwards is exact and idempotent.
function regionalCommitFromActiveLocal() {
  const mapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  const p = mapId && (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(mapId) : null;
  if (!p) return false;
  return commitRegionalWorldPosition(p.regionId, p.chunkX * _rpChunkW() + player.x, p.chunkY * _rpChunkH() + player.y);
}

// ── Invariant reporting (read-only; NEVER repairs) ───────────────────────────
// Returns a (possibly empty) array of human-readable disagreements between the
// canonical position and its compatibility projections. Never mutates or repairs
// — callers decide what to do (saveGame refuses to write; tests assert on it).
function regionalInvariantErrors() {
  const errs = [];
  const activeMapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  if (_regionalPosition === null) {
    // Discrete: the active map must NOT be a placed regional map (a placed map
    // with a null canonical position is a missing projection).
    if (activeMapId && isRegionalMapId(activeMapId)) {
      errs.push('regional map "' + activeMapId + '" is active but canonical regional position is null (missing projection)');
    }
    return errs;
  }
  const loc = regionWorldPxToLocal(_regionalPosition.regionId, _regionalPosition.worldPxX, _regionalPosition.worldPxY);
  if (!loc) {
    errs.push('canonical regional position ' + _regionalPosition.worldPxX + ',' + _regionalPosition.worldPxY + ' in region "' + _regionalPosition.regionId + '" resolves to no placed chunk (void)');
    return errs;
  }
  if (activeMapId !== loc.mapId) {
    errs.push('activeMap projection "' + activeMapId + '" disagrees with canonical-derived map "' + loc.mapId + '"');
  }
  if (player.x !== loc.localPxX) errs.push('player.x projection ' + player.x + ' disagrees with canonical-derived localPxX ' + loc.localPxX);
  if (player.y !== loc.localPxY) errs.push('player.y projection ' + player.y + ' disagrees with canonical-derived localPxY ' + loc.localPxY);
  return errs;
}

// ── Test-only fixture gateway ────────────────────────────────────────────────
// Tests that historically poked activeMap/player.x/player.y directly must go
// through here (or a location gateway) so canonical state stays coherent. This
// is NOT a production reconciler — it exists only for deterministic test setup.
function __setRegionalPositionForTest(regionId, worldPxX, worldPxY) {
  return commitRegionalWorldPosition(regionId, worldPxX, worldPxY);
}
function __clearRegionalPositionForTest() { clearRegionalPosition(); }
// Reconcile canonical state to match a fixture that assigned activeMap/player.x/y
// directly (bypassing the gateways): commit canonical on a regional map, clear it
// on a discrete one. This is the sanctioned way to prepare a hand-built location
// fixture for save/render — NOT a production reconciler.
function __reconcileCanonicalForTest() {
  const mapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  if (mapId) placeAtLocation(mapId, player.x, player.y);
}

if (typeof window !== 'undefined') {
  window.mapLocalPxToRegionWorldPx   = mapLocalPxToRegionWorldPx;
  window.regionWorldPxToLocal        = regionWorldPxToLocal;
  window.regionalWorldPosition       = regionalWorldPosition;
  window.regionalDerivedLocation     = regionalDerivedLocation;
  window.isRegionalMapId             = isRegionalMapId;
  window.commitRegionalWorldPosition = commitRegionalWorldPosition;
  window.enterRegionalMapFromLocal   = enterRegionalMapFromLocal;
  window.clearRegionalPosition       = clearRegionalPosition;
  window.placeAtLocation             = placeAtLocation;
  window.regionalCommitFromActiveLocal = regionalCommitFromActiveLocal;
  window.regionalInvariantErrors     = regionalInvariantErrors;
  window.__setRegionalPositionForTest = __setRegionalPositionForTest;
  window.__clearRegionalPositionForTest = __clearRegionalPositionForTest;
  window.__reconcileCanonicalForTest = __reconcileCanonicalForTest;
}
