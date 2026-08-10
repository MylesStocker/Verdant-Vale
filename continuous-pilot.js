'use strict';

// continuous-pilot.js — DEBUG-ONLY seamless-movement pilot for exactly ONE
// reciprocal ALIGNS outdoor seam, active only while Continuous View is on.
//
// Canonical gameplay model is UNCHANGED: activeMap is the current physical map,
// player.x/.y are LOCAL pixels, saves store the active map + local placement,
// SAVE_VERSION stays 3. World-PIXEL coordinates are computed TRANSIENTLY here
// (from the regional-layout helpers) only for cross-seam collision and the atomic
// map handoff — never persisted.
//
// The pilot lets the player walk smoothly across the NORTH_BASIN_S_MAP (south
// chunk) <-> NORTH_BASIN_C_MAP (north chunk) seam as though the two 16×15 maps
// were one. Chosen because it is the simplest, safest reciprocal ALIGNS seam:
//   • broad EDGE_TRANSITIONS both ways, identical ranges [1,14], NO targetRange
//     remap (no clamping), NO condition/blockedText/callback;
//   • matching walkable terrain along the ENTIRE useful edge (both sides: cols
//     1-14 walkable at the seam row) — verified by the transition audit;
//   • ZERO NPCs on either map — a clear boundary safety band, so nothing can be
//     walked through at the crossing (validated in test 72);
//   • no quest/day/toll/cutscene/story/special-state gate.
//
// ── SEAM-OVERLAP MODEL (the fix for the arrival-side soft-lock) ──────────────
// Eligibility is NOT gated on the player being at a map's outward border. That
// left the player stuck right after a handoff: on the ARRIVAL side the radius-9
// footprint still straddles the seam (its far corner sits in the OTHER map, out
// of THIS map's bounds), and the legacy map-local canWalk() — which can't see
// across the seam — rejects every move, while the old border-only gate no longer
// engaged. Instead, the world-aware path engages whenever the player's collision
// footprint OVERLAPS the approved seam (within one tile of the shared seam line),
// from EITHER map and for ANY direction — toward it, across it, away from it
// after the handoff, sideways while straddling, or immediately reversing. Once
// the footprint is a full tile clear of the seam, ordinary legacy movement
// resumes (so every other edge, point transition, and the flag-off case are
// untouched). One tile (TILE=32px) comfortably exceeds r(9)+SPEED(2), so both the
// current AND the candidate footprint are covered.

// The one approved reciprocal pair. `a` is the SOUTH chunk, `b` the NORTH chunk
// (a's north edge <-> b's south edge). `key` is each map's content-location key
// (for the NPC safety-band check). Exactly one entry: this is a deliberately
// narrow pilot, NOT "all ALIGNS seams".
const CONTINUOUS_PILOT_SEAMS = [
  {
    regionId: 'overworld',
    axis: 'ns',
    a: { mapId: 'NORTH_BASIN_S_MAP', key: 'north_basin_s' }, // south chunk
    b: { mapId: 'NORTH_BASIN_C_MAP', key: 'north_basin_c' }, // north chunk
    sourceRange: [1, 14], // matches the reciprocal EDGE_TRANSITIONS on both sides
  },
];

// Returns the pilot seam whose shared boundary the player's collision footprint
// currently OVERLAPS (within TILE of the seam line), while Continuous View is
// active and the active map is one of that seam's two maps. Direction-agnostic —
// this is the single gate for the world-aware movement path. Returns
// { seam, regionId, boundaryPxY? } or null.
function pilotSeamEngaged() {
  if (typeof continuousWorldViewActive !== 'function' || !continuousWorldViewActive()) return null;
  const id = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  if (!id) return null;
  const CW = COLS * TILE, CH = ROWS * TILE;
  for (const seam of CONTINUOUS_PILOT_SEAMS) {
    if (id !== seam.a.mapId && id !== seam.b.mapId) continue;
    const p = regionPlacementForMapId(id);
    if (!p) continue;
    if (seam.axis === 'ns') {
      const worldPxY = p.chunkY * CH + player.y;
      const boundaryPxY = regionPlacementForMapId(seam.a.mapId).chunkY * CH; // south chunk top = north chunk bottom
      if (Math.abs(worldPxY - boundaryPxY) <= TILE) return { seam, regionId: seam.regionId, boundaryPxY };
    }
    // (An E/W pilot seam would compare worldPxX to the shared column boundary here.)
  }
  return null;
}

// True iff the current activeMap is one of the pilot maps and the pilot is armed
// (Continuous View active). Used only for the debug inspector diagnostic.
function pilotSeamMapActive() {
  if (typeof continuousWorldViewActive !== 'function' || !continuousWorldViewActive()) return false;
  const id = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  return CONTINUOUS_PILOT_SEAMS.some((s) => s.a.mapId === id || s.b.mapId === id);
}

// World-coordinate collision, preserving canWalk()'s exact footprint: the same
// four radius-9 hitbox corners, read across the seam via the regional-layout
// helpers. A corner that resolves to a missing chunk / REGION_VOID_TILE / out-of-
// region / blocked tile is non-walkable. Also honours pilot-map solid NPCs
// (converted to world pixels) so a crossing can never walk through one — the
// pilot maps have none today (safety band), but this stays correct if that
// changes. worldPxX/worldPxY are region-world PIXELS.
function pilotWorldWalkable(regionId, worldPxX, worldPxY) {
  const r = 9;
  const corners = [[-r, -r], [r, -r], [-r, r], [r, r]];
  for (const [ox, oy] of corners) {
    const t = tileAtWorld(regionId, Math.floor((worldPxX + ox) / TILE), Math.floor((worldPxY + oy) / TILE));
    if (!isTileWalkable(t)) return false;
  }
  // Solid NPC bodies on the pilot maps, converted local->world (same |Δ|<18 as canWalk()).
  const CW = COLS * TILE, CH = ROWS * TILE;
  for (const seam of CONTINUOUS_PILOT_SEAMS) {
    for (const m of [seam.a, seam.b]) {
      const p = regionPlacementForMapId(m.mapId);
      if (!p) continue;
      const offX = p.chunkX * CW, offY = p.chunkY * CH;
      for (const npc of SIMPLE_NPCS) {
        if (npc.map !== m.key || !npc.solid) continue;
        if (Math.abs(worldPxX - (offX + npc.x)) < 18 && Math.abs(worldPxY - (offY + npc.y)) < 18) return false;
      }
    }
  }
  return true;
}

// Is the standing point (world px) inside one of the seam's two approved chunks?
// Guards against a diagonal/corner attempt drifting into any other (unapproved)
// neighbour or into the void.
function pilotInApprovedChunk(regionId, worldPxX, worldPxY, approvedMapIds) {
  const CW = COLS * TILE, CH = ROWS * TILE;
  const id = mapIdForChunk(regionId, Math.floor(worldPxX / CW), Math.floor(worldPxY / CH));
  return approvedMapIds.indexOf(id) !== -1;
}

// Performs one frame of seamless walking near an approved seam. Mirrors update()'s
// axis-separated X-then-Y movement and canWalk() footprint, but in world PIXELS,
// and hands the active map over atomically when the STANDING POINT crosses into
// the other approved chunk. Preserves fractional/sub-tile progress and facing
// (facing was already set by update() from dx/dy; step/animation run after).
// Applies each axis exactly once. Does NOT: inset/nudge/clamp-to-centre, show a
// toast, touch cooldown, reset location state, or call transitionToLocation().
// At most ONE handoff per frame.
function pilotSeamStep(engaged, dx, dy) {
  const regionId = engaged.regionId;
  const seam = engaged.seam;
  const approved = [seam.a.mapId, seam.b.mapId];
  const CW = COLS * TILE, CH = ROWS * TILE;
  const from = regionPlacementForMapId(mapIdForRef(activeMap));
  let worldPxX = from.chunkX * CW + player.x;
  let worldPxY = from.chunkY * CH + player.y;

  // Axis-separated (wall-sliding preserved); each axis moves only if the new
  // world footprint is walkable AND the standing point stays within the two
  // approved chunks. Each axis is applied exactly once.
  if (dx !== 0) {
    const nx = worldPxX + dx;
    if (pilotWorldWalkable(regionId, nx, worldPxY) && pilotInApprovedChunk(regionId, nx, worldPxY, approved)) worldPxX = nx;
  }
  if (dy !== 0) {
    const ny = worldPxY + dy;
    if (pilotWorldWalkable(regionId, worldPxX, ny) && pilotInApprovedChunk(regionId, worldPxX, ny, approved)) worldPxY = ny;
  }

  // Atomic handoff: the standing point's chunk (always one of the two approved
  // chunks, per the guard above) is the authoritative map.
  const standId = mapIdForChunk(regionId, Math.floor(worldPxX / CW), Math.floor(worldPxY / CH));
  const destId = (approved.indexOf(standId) !== -1) ? standId : mapIdForRef(activeMap);
  const dp = regionPlacementForMapId(destId);
  activeMap = mapRefForId(destId);            // no-op when the standing point stayed in the current chunk
  player.x = worldPxX - dp.chunkX * CW;       // world -> destination-local, fractional progress intact
  player.y = worldPxY - dp.chunkY * CH;
}

if (typeof window !== 'undefined') {
  window.CONTINUOUS_PILOT_SEAMS = CONTINUOUS_PILOT_SEAMS;
  window.pilotSeamEngaged    = pilotSeamEngaged;
  window.pilotSeamMapActive  = pilotSeamMapActive;
  window.pilotWorldWalkable  = pilotWorldWalkable;
  window.pilotInApprovedChunk = pilotInApprovedChunk;
  window.pilotSeamStep       = pilotSeamStep;
}
