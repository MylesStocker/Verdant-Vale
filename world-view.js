'use strict';

// world-view.js — PURE camera / chunk-visibility calculations for the continuous
// overworld. Nothing here touches the DOM/canvas or mutates gameplay state; every
// function is a side-effect-free calculation. The runtime camera consumes
// buildContinuousWorldPlanFromWorld() — fed the CANONICAL regional world position
// (regional-position.js) — so the plan is keyed on the world-pixel point, never
// re-derived from activeMap + local.
//
// It derives all layout from REGIONAL_LAYOUT and its existing indexes/helpers
// (mapIdForChunk) in data.js — it does NOT duplicate placement data — and reads
// the tile grid constants COLS/ROWS (state.js) and TILE (tiles.js) at call time.
//
// COORDINATE VOCABULARY (kept strictly distinct in names + docs):
//   • local TILE coords   — a tile (col,row) WITHIN one map: 0..COLS-1, 0..ROWS-1.
//   • chunk coords        — a map's integer (chunkX,chunkY) slot in a region.
//   • region-world PIXEL  — a pixel in a region's continuous space:
//                           worldPxX = chunkX*COLS*TILE + localCol*TILE, etc.
//   • camera / viewport   — a rectangle in region-world pixels; the visible slice.
// Fields carrying pixels are suffixed `Px`; tile/chunk fields are `Col`/`Row`/
// `ChunkX`/`ChunkY`. Rectangles are HALF-OPEN [start,end) so a chunk/tile exactly
// on a boundary is counted once, never twice.

// One chunk's pixel size = one map. COLS*TILE wide, ROWS*TILE tall (512×480 today).
function _chunkWidthPx()  { return COLS * TILE; }
function _chunkHeightPx() { return ROWS * TILE; }

// 1. Region rectangular PIXEL bounds, derived from its REGIONAL_LAYOUT placements
//    + chunk dimensions + TILE. `regionId` is the string region key (e.g.
//    'overworld'). Chunk extents are inclusive; pixel right/bottom are EXCLUSIVE
//    (half-open). Unknown regionId -> null. Empty region -> null.
function regionPixelBounds(regionId) {
  const entry = (typeof REGIONAL_LAYOUT !== 'undefined') ? REGIONAL_LAYOUT[regionId] : undefined;
  if (!entry || !Array.isArray(entry.placements) || entry.placements.length === 0) return null;
  let minChunkX = Infinity, minChunkY = Infinity, maxChunkX = -Infinity, maxChunkY = -Infinity;
  for (const p of entry.placements) {
    if (p.chunkX < minChunkX) minChunkX = p.chunkX;
    if (p.chunkY < minChunkY) minChunkY = p.chunkY;
    if (p.chunkX > maxChunkX) maxChunkX = p.chunkX;
    if (p.chunkY > maxChunkY) maxChunkY = p.chunkY;
  }
  const cw = _chunkWidthPx(), ch = _chunkHeightPx();
  const leftPx = minChunkX * cw, topPx = minChunkY * ch;
  const rightPx = (maxChunkX + 1) * cw, bottomPx = (maxChunkY + 1) * ch; // exclusive
  return {
    regionId,
    minChunkX, minChunkY, maxChunkX, maxChunkY,
    chunkWidthPx: cw, chunkHeightPx: ch,
    leftPx, topPx, rightPx, bottomPx,
    widthPx: rightPx - leftPx, heightPx: bottomPx - topPx,
  };
}

// 2. Integer, pixel-aligned camera ORIGIN (viewport top-left, region-world pixels)
//    for a world-pixel target, centred on that target and clamped so the viewport
//    stays inside the region's pixel bounds. If the region is narrower/shorter
//    than the viewport the camera is pinned to the region's left/top edge.
//    `regionId` is the string region key. Unknown/empty regionId -> null.
function cameraOriginForTarget(regionId, targetWorldPxX, targetWorldPxY, viewportPxW, viewportPxH) {
  const b = regionPixelBounds(regionId);
  if (!b) return null;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const maxCamX = b.rightPx - viewportPxW;   // may be < leftPx if region < viewport
  const maxCamY = b.bottomPx - viewportPxH;
  const rawX = targetWorldPxX - viewportPxW / 2;
  const rawY = targetWorldPxY - viewportPxH / 2;
  return {
    camPxX: Math.round(clamp(rawX, b.leftPx, maxCamX)),
    camPxY: Math.round(clamp(rawY, b.topPx, maxCamY)),
  };
}

// 2b. The pixel rectangles of every placed 'legacy_screen' chunk in a region —
//     the presentation-excluded rectangles the continuous camera must never reveal.
//     Derived purely from REGIONAL_LAYOUT placement + the catalog presentation
//     authority (isLegacyScreenMap). Half-open [left,right)×[top,bottom).
function legacyScreenChunkRects(regionId) {
  const entry = (typeof REGIONAL_LAYOUT !== 'undefined') ? REGIONAL_LAYOUT[regionId] : undefined;
  if (!entry || !Array.isArray(entry.placements) || typeof isLegacyScreenMap !== 'function') return [];
  const cw = _chunkWidthPx(), ch = _chunkHeightPx();
  const out = [];
  for (const p of entry.placements) {
    if (!isLegacyScreenMap(p.mapId)) continue;
    out.push({ mapId: p.mapId, leftPx: p.chunkX * cw, topPx: p.chunkY * ch, rightPx: (p.chunkX + 1) * cw, bottomPx: (p.chunkY + 1) * ch });
  }
  return out;
}

// 2c. Camera origin that keeps the viewport on the AUTHORED SIDE of a single excluded
//     (legacy_screen) chunk — a pure, monotone, single-axis presentation constraint.
//     `exclusion` is { rect:{leftPx,topPx,rightPx,bottomPx}, side:'north'|'south'|
//     'east'|'west' } (from the active map's declarative legacyCameraExclusion policy)
//     or null/absent for no constraint. Starts from the region-clamped player-centred
//     camera, then clamps ONE axis so the whole viewport stays on `side` of the rect:
//       east  -> camX >= rect.right     west  -> camX <= rect.left - viewportW
//       south -> camY >= rect.bottom    north -> camY <= rect.top  - viewportH
//     The clamp is monotone in the player's world position and never compares the
//     horizontal vs vertical correction magnitudes, so — unlike the old least-
//     correction rule — it CANNOT switch axes at a diagonal legacy-screen corner
//     (the cause of the Roddon Way camera jump). Because the policy names the side on
//     which the source chunk actually lies (validated), the clamp keeps the target/
//     player visible. Deterministic and pure.
function continuousCameraOrigin(regionId, targetWorldPxX, targetWorldPxY, viewportPxW, viewportPxH, exclusion) {
  const base = cameraOriginForTarget(regionId, targetWorldPxX, targetWorldPxY, viewportPxW, viewportPxH);
  if (!base) return base;
  let camPxX = base.camPxX, camPxY = base.camPxY;
  if (exclusion && exclusion.rect && exclusion.side) {
    const E = exclusion.rect;
    switch (exclusion.side) {
      case 'east':  camPxX = Math.max(camPxX, E.rightPx); break;
      case 'west':  camPxX = Math.min(camPxX, E.leftPx - viewportPxW); break;
      case 'south': camPxY = Math.max(camPxY, E.bottomPx); break;
      case 'north': camPxY = Math.min(camPxY, E.topPx - viewportPxH); break;
    }
  }
  return { camPxX: Math.round(camPxX), camPxY: Math.round(camPxY) };
}

// Resolve the active map's declarative camera-exclusion policy into the concrete
// { rect, side } the pure camera consumes: look up its legacyCameraExclusion policy
// and pair the named legacy_screen chunk with its region-world pixel rect. Returns
// null when the active map has no policy. The ONE place policy meets geometry.
function resolveLegacyCameraExclusion(regionId, activeMapId) {
  const policy = (typeof legacyCameraExclusionForMapId === 'function') ? legacyCameraExclusionForMapId(activeMapId) : null;
  if (!policy) return null;
  const rects = (typeof legacyScreenChunkRects === 'function') ? legacyScreenChunkRects(regionId) : [];
  const rect = rects.find((r) => r.mapId === policy.mapId);
  return rect ? { rect, side: policy.side } : null;
}

// 4. The half-open LOCAL TILE range of one chunk that intersects a camera
//    viewport, or null if the chunk does not intersect at all. Pure geometry —
//    it needs no layout lookup, only the chunk's coordinate. A tile straddling
//    the viewport edge is included (partial tiles are visible). Ranges are
//    guaranteed non-empty (startCol < endCol, startRow < endRow) when non-null,
//    and bounded to 0..COLS / 0..ROWS.
function chunkVisibleTileRange(camPxX, camPxY, viewportPxW, viewportPxH, chunkX, chunkY) {
  const cw = _chunkWidthPx(), ch = _chunkHeightPx();
  const chunkLeftPx = chunkX * cw, chunkTopPx = chunkY * ch;
  // Intersection of viewport [cam, cam+size) with chunk [chunkPx, chunkPx+size).
  const ix0 = Math.max(camPxX, chunkLeftPx);
  const ix1 = Math.min(camPxX + viewportPxW, chunkLeftPx + cw);
  const iy0 = Math.max(camPxY, chunkTopPx);
  const iy1 = Math.min(camPxY + viewportPxH, chunkTopPx + ch);
  if (ix0 >= ix1 || iy0 >= iy1) return null; // no (or zero-width) overlap
  const startCol = Math.floor((ix0 - chunkLeftPx) / TILE);
  const endCol   = Math.ceil((ix1 - chunkLeftPx) / TILE);   // exclusive
  const startRow = Math.floor((iy0 - chunkTopPx) / TILE);
  const endRow   = Math.ceil((iy1 - chunkTopPx) / TILE);    // exclusive
  return { startCol, endCol, startRow, endRow };
}

// 3. The PLACED chunks that intersect a camera viewport, in deterministic
//    row-major order (chunkY ascending, then chunkX ascending). `regionId` is the
//    string region key. Each entry carries enough to render ONLY its intersecting
//    local tile slice at the chunk's stable region-world pixel origin:
//      { regionId, mapId, chunkX, chunkY, worldPxX, worldPxY,
//        startCol, endCol, startRow, endRow }
//    worldPxX/worldPxY are the region-world pixel position of the chunk's LOCAL
//    (0,0) tile — a STABLE origin; a renderer applies the camera separately
//    (screenX = worldPxX - camPxX). Missing sparse-grid chunks are OMITTED (no
//    map is invented) — so the caller must clear/fill the viewport itself before
//    drawing the returned chunks; gaps and out-of-region areas simply have no
//    entry. Unknown/empty regionId -> [].
function visibleChunks(regionId, camPxX, camPxY, viewportPxW, viewportPxH) {
  const entry = (typeof REGIONAL_LAYOUT !== 'undefined') ? REGIONAL_LAYOUT[regionId] : undefined;
  if (!entry) return [];
  const cw = _chunkWidthPx(), ch = _chunkHeightPx();
  // Candidate chunk index ranges the viewport can touch (half-open on the far edge).
  const firstChunkX = Math.floor(camPxX / cw);
  const lastChunkX  = Math.ceil((camPxX + viewportPxW) / cw) - 1;
  const firstChunkY = Math.floor(camPxY / ch);
  const lastChunkY  = Math.ceil((camPxY + viewportPxH) / ch) - 1;
  const out = [];
  for (let cy = firstChunkY; cy <= lastChunkY; cy++) {        // row-major: rows outer
    for (let cx = firstChunkX; cx <= lastChunkX; cx++) {      // cols inner
      const range = chunkVisibleTileRange(camPxX, camPxY, viewportPxW, viewportPxH, cx, cy);
      if (!range) continue;                                    // no real overlap
      const mapId = (typeof mapIdForChunk === 'function') ? mapIdForChunk(regionId, cx, cy) : null;
      if (!mapId) continue;                                    // sparse hole: omit, never invent
      out.push({
        regionId, mapId, chunkX: cx, chunkY: cy,
        worldPxX: cx * cw, worldPxY: cy * ch,
        startCol: range.startCol, endCol: range.endCol,
        startRow: range.startRow, endRow: range.endRow,
      });
    }
  }
  return out;
}

// Converts a map-LOCAL pixel coordinate (a pixel WITHIN one map, e.g. player.x)
// to a region-WORLD pixel coordinate, using the authoritative regional placement
// (regionPlacementForMapId) + chunk pixel dimensions. Returns { regionId,

// Builds the complete, side-effect-free render plan for ONE continuous-view frame.
// Inputs are all PIXELS except regionId/activeMapId:
//   regionId        the region key (e.g. 'overworld')
//   activeMapId     the current physical map id (mapIdForRef(activeMap))
//   playerLocalPxX/Y the player's pixel position WITHIN the active map (player.x/.y)
//   viewportPxW/H   the on-screen viewport size in pixels (512×480 today)
// Returns null when the active map is not placed in `regionId` (caller must then
// use the legacy renderer). Otherwise:
//   { regionId, activeMapId, activePlacement,
//     playerWorldPxX, playerWorldPxY,   // player position in region-world pixels
//     camPxX, camPxY,                   // integer, pixel-aligned camera origin
//     visibleChunks }                   // placed chunks intersecting the viewport
// Pure: reads REGIONAL_LAYOUT / helpers only; mutates nothing (no player,
// activeMap, regional data, or camera state).
// Shared plan core, keyed on the region-world PIXEL target (the canonical unit).
function _continuousPlanCore(regionId, activeMapId, placement, worldPxX, worldPxY, viewportPxW, viewportPxH) {
  // Camera keeps MAP (the legacy_screen home) off-screen by the active map's declarative
  // side policy (legacyCameraExclusion, resolved from REGIONAL_CHUNK_CATALOG) — a stable
  // single-axis constraint, never a MAP-specific render patch and never an axis-switching
  // least-correction. A map with no policy is unconstrained. The belt-and-suspenders
  // chunk filter below still drops any stray legacy chunk so no void hole can appear.
  const exclusion = resolveLegacyCameraExclusion(regionId, activeMapId);
  const cam = continuousCameraOrigin(regionId, worldPxX, worldPxY, viewportPxW, viewportPxH, exclusion);
  if (!cam) return null;
  let chunks = visibleChunks(regionId, cam.camPxX, cam.camPxY, viewportPxW, viewportPxH);
  // Belt-and-suspenders: a legacy_screen chunk other than the active map is never a
  // continuous neighbour (the camera already avoids its area; this guarantees it).
  if (typeof isLegacyScreenMap === 'function') chunks = chunks.filter((c) => c.mapId === activeMapId || !isLegacyScreenMap(c.mapId));
  return {
    regionId, activeMapId, activePlacement: placement,
    playerWorldPxX: worldPxX, playerWorldPxY: worldPxY,
    camPxX: cam.camPxX, camPxY: cam.camPxY,
    visibleChunks: chunks,
  };
}

// CANONICAL entry point: build the plan straight from a region-world pixel
// position (the runtime camera consumes this so targeting never independently
// re-derives world position from activeMap + local). Derives the active chunk /
// local projection FROM the canonical point; they must agree with it.
function buildContinuousWorldPlanFromWorld(regionId, worldPxX, worldPxY, viewportPxW, viewportPxH) {
  const loc = (typeof regionWorldPxToLocal === 'function') ? regionWorldPxToLocal(regionId, worldPxX, worldPxY) : null;
  if (!loc) return null;
  const placement = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(loc.mapId) : null;
  if (!placement || placement.regionId !== regionId) return null;
  return _continuousPlanCore(regionId, loc.mapId, placement, worldPxX, worldPxY, viewportPxW, viewportPxH);
}


if (typeof window !== 'undefined') {
  window.regionPixelBounds       = regionPixelBounds;
  window.cameraOriginForTarget   = cameraOriginForTarget;
  window.legacyScreenChunkRects  = legacyScreenChunkRects;
  window.continuousCameraOrigin  = continuousCameraOrigin;
  window.resolveLegacyCameraExclusion = resolveLegacyCameraExclusion;
  window.chunkVisibleTileRange   = chunkVisibleTileRange;
  window.visibleChunks           = visibleChunks;
  window.buildContinuousWorldPlanFromWorld = buildContinuousWorldPlanFromWorld;
}
