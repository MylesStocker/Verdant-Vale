'use strict';

// encounter-geography.js — GEOGRAPHIC random-encounter authority for the placed
// regional wilderness. The pool a random encounter draws from is owned by the
// PHYSICAL CHUNK beneath the player's STANDING POINT in world space — never a
// logical content key, the shared 'overworld' key, visible/neighbour chunks, the
// 3×3 NPC simulation set, or an assumed single active screen. This is architectural
// preparation for a continuous/chunked overworld; it is BEHAVIOUR-NEUTRAL with the
// current maps (the standing point is always on the active chunk, so the resolved
// pool equals the active map's own MAP_CATALOG pool).
//
// The pure resolver composes existing authorities (REGIONAL_LAYOUT placement +
// mapIdForChunk + MAP_CATALOG via mapEntryForId); it adds no encounter table of its
// own, consumes NO randomness, and mutates NO runtime state. Only the placed
// regional outdoor path is geographic — dungeons, the sluice, Mirethyst's Vault,
// towns, interiors, bridge, meadow, and special/scripted encounters keep their
// exact legacy selection and exclusions.

// ── Pure geographic resolver (world PIXELS) ──────────────────────────────────
// Region world-pixel point -> { regionId, mapId, encounterPool } or null. The pool
// comes straight from the canonical MAP_CATALOG entry (may be null where a placed
// map legitimately has no pool — never invented). Missing chunk / documented void /
// sparse hole / off-region / negative / non-finite point -> null (fail closed).
function geographicEncounterContext(regionId, worldPxX, worldPxY) {
  if (typeof REGIONAL_LAYOUT === 'undefined' || !REGIONAL_LAYOUT[regionId]) return null;
  if (!Number.isFinite(worldPxX) || !Number.isFinite(worldPxY)) return null;
  if (worldPxX < 0 || worldPxY < 0) return null;
  const CW = COLS * TILE, CH = ROWS * TILE;
  const chunkX = Math.floor(worldPxX / CW), chunkY = Math.floor(worldPxY / CH);
  const mapId = (typeof mapIdForChunk === 'function') ? mapIdForChunk(regionId, chunkX, chunkY) : null;
  if (!mapId) return null;                                   // void / sparse hole / unplaced
  const entry = (typeof mapEntryForId === 'function') ? mapEntryForId(mapId) : null;
  if (!entry) return null;
  return { regionId, mapId, encounterPool: (entry.encounterPool !== undefined ? entry.encounterPool : null) };
}

// ── Runtime selectors (read-only; used by the roll site + currentEncounterPool) ─
// The player's STANDING POINT (centre, player.x/player.y) in region world pixels —
// NOT footprint corners, camera, visible chunks, or NPC simulation chunks. Returns
// { regionId, worldPxX, worldPxY, activeMapId } or null when the active map is not
// placed in a region. Independent of presentation mode: continuous vs legacy must NOT
// determine encounter geography.
function playerStandingWorldPoint() {
  // Consume the CANONICAL regional position (regional-position.js) — never derived
  // from activeMap + player.x/y. Independent of Continuous View (canonical is), and
  // FAIL-CLOSED: regionalPlayerWorldPoint() returns null on a discrete map OR a broken
  // invariant, so a stale/void position never reaches encounter selection.
  const p = (typeof regionalPlayerWorldPoint === 'function') ? regionalPlayerWorldPoint() : null;
  if (!p) return null;
  return { regionId: p.regionId, worldPxX: p.worldPxX, worldPxY: p.worldPxY, activeMapId: p.mapId };
}

// The geographic encounter context at the player's standing point, or null when the
// active map is nonregional / unresolved. Read-only.
function regionalStandingEncounterContext() {
  const sp = playerStandingWorldPoint();
  if (!sp) return null;
  return geographicEncounterContext(sp.regionId, sp.worldPxX, sp.worldPxY);
}

// THE shared regional standing-point resolution consulted by BOTH the roll gate
// (encounterGeographyOk) AND pool selection (currentEncounterPool), so eligibility
// and pool selection can never disagree — one authority, not two competing copies.
// Returns:
//   { regional:false, ok:true,  pool:null }              -> nonregional/unplaced (legacy)
//   { regional:true,  ok:true,  pool:<catalog pool|null> }-> placed, resolved, AGREES with activeMap
//   { regional:true,  ok:false, pool:null }              -> placed but unresolved/void/inconsistent
// `pool` is the raw canonical MAP_CATALOG pool (may be null) — callers apply their own
// empty/fallback contract. Read-only; consumes no randomness.
function regionalEncounterResolution() {
  const activeMapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  const placement = (activeMapId && typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(activeMapId) : null;
  if (!placement) return { regional: false, ok: true, pool: null };
  const geo = regionalStandingEncounterContext();
  if (geo && geo.mapId === activeMapId) return { regional: true, ok: true, pool: geo.encounterPool };
  return { regional: true, ok: false, pool: null };          // unresolved / void / disagrees -> fail closed
}

// Roll-site geography gate. Nonregional maps (dungeon, sluice, vault, town, interior,
// meadow, bridge, special) are not geographically gated (legacy roll). A PLACED
// regional outdoor map must resolve AND agree with the active map, else FAIL CLOSED
// (no random encounter). Derives from the shared regionalEncounterResolution().
function encounterGeographyOk() {
  const r = regionalEncounterResolution();
  return !r.regional || r.ok;
}

if (typeof window !== 'undefined') {
  window.geographicEncounterContext      = geographicEncounterContext;
  window.playerStandingWorldPoint        = playerStandingWorldPoint;
  window.regionalStandingEncounterContext = regionalStandingEncounterContext;
  window.regionalEncounterResolution     = regionalEncounterResolution;
  window.encounterGeographyOk            = encounterGeographyOk;
}
