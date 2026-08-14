'use strict';

// regional-npc-runtime.js — CHUNK-AWARE ownership + pose + simulation authority
// for regional outdoor NPCs under Continuous View. It lets a regional NPC on a
// NEARBY chunk keep updating, rendering, colliding, prompting and interacting
// consistently while visible from another chunk, WITHOUT the player's active-map
// boundary resetting / duplicating / freezing / teleporting it.
//
// Contract split (compatibility preserved):
//   • `npc.map` stays the LOGICAL content-location key (currentContentLocationKey).
//   • PHYSICAL ownership is DISTINCT and explicit: physicalMapIdForNpc(npc) is the
//     one placed outdoor map a regional NPC belongs to — derived from an
//     UNAMBIGUOUS logical key, or declared with `npc.physicalMapId` when the key is
//     ambiguous (`'overworld'` → MAP / MAP5 / RODDON_WAY_MAP). Unknown, missing,
//     inconsistent, or ambiguous-without-declaration ownership FAILS CLOSED (null).
//   • Towns/interiors/dungeons/bridge/meadow/houses/special maps are NONregional:
//     physicalMapIdForNpc → null, and they keep their exact legacy lifecycle.
//
// PURE / READ-ONLY: nothing here assigns activeMap, player, location flags, or NPC
// ownership. The pose reads the NPC's LIVE runtime position (which its own route
// writes); it never copies or relocates the NPC object.
//
// LIMITATION (this increment): a regional NPC is confined to its ONE owner chunk.
// There is no NPC chunk-to-chunk route handoff yet — occupancy blocks any step
// that would leave the owner chunk, land on a transition tile, or leave the map.
// Cross-chunk NPC movement is future work (needs an explicit movement capability
// and a world-space route schema).

// ── Physical ownership authority ─────────────────────────────────────────────
// The single placed outdoor physical map id a regional NPC belongs to, or null.
// Fail-closed. `npc.map` (logical key) is unchanged and is NOT a physical id.
function physicalMapIdForNpc(npc) {
  if (!npc || typeof npc.map !== 'string') return null;
  const key = npc.map;
  // Explicit declaration (required whenever the logical key is ambiguous).
  if (npc.physicalMapId !== undefined && npc.physicalMapId !== null) {
    const mid = npc.physicalMapId;
    if (typeof mid !== 'string') return null;
    if (typeof regionPlacementForMapId !== 'function' || !regionPlacementForMapId(mid)) return null; // not a placed map
    const ck = (typeof outdoorContentKeyForMapId === 'function') ? outdoorContentKeyForMapId(mid) : null;
    if (!ck) return null;               // not a placed OUTDOOR content map
    if (ck !== key) return null;        // explicit physical map must AGREE with the logical key
    return mid;
  }
  // Derived: an UNAMBIGUOUS outdoor content key resolves to exactly one placed map.
  if (typeof outdoorContentKeyEntries !== 'function') return null;
  for (const e of outdoorContentKeyEntries()) if (e.key === key && e.unambiguous) return e.mapId;
  return null;                          // ambiguous / unknown / nonregional -> fail closed
}

// ── Runtime pose authority (read-only) ───────────────────────────────────────
// The shared pose every consumer (rendering, collision, prompt, interaction) reads.
// { npc, mapId, contentKey, localPxX, localPxY, worldPxX, worldPxY, facing, route }
// or null. Pixel units explicit. World position = the owner chunk's placement
// origin + the NPC's CURRENT LIVE local position (its route writes npc.x/npc.y);
// stationary NPCs report their authored npc.x/npc.y. Never mutates.
function regionalNpcPose(npc) {
  const mapId = physicalMapIdForNpc(npc);
  if (!mapId) return null;
  const placement = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(mapId) : null;
  if (!placement) return null;
  const CW = COLS * TILE, CH = ROWS * TILE;
  const route = (typeof NPC_ROUTES !== 'undefined') ? (NPC_ROUTES[npc.id] || null) : null;
  const localPxX = npc.x, localPxY = npc.y;      // live position — route writes these
  return {
    npc, mapId, contentKey: npc.map,
    localPxX, localPxY,
    worldPxX: placement.chunkX * CW + localPxX,
    worldPxY: placement.chunkY * CH + localPxY,
    facing: npc.facing,                          // updateNpcRoutes keeps npc.facing live
    route,
  };
}

// ── Nearby simulation set (physical proximity, NOT camera draw calls) ─────────
// The deterministic set of placed physical maps that should keep simulating: the
// active chunk plus every placed chunk within one chunk on either axis (a max 3×3
// neighbourhood). Row-major order (top row first, left-to-right). Sparse/unplaced
// chunks are omitted, and so is every 'legacy_screen' chunk — a fixed-screen home
// (e.g. Verdant Vale / MAP) is deliberately hidden behind its presentation border,
// so its NPCs must not keep simulating while a nearby continuous map is active.
// The exclusion uses the declarative presentation resolver (isLegacyScreenMap), not
// a hardcoded id, and lives HERE (the one shared simulation-scope authority) so
// every consumer (npcShouldSimulate, regionalNpcInSimulationScope and thus route
// start/update, occupancy) inherits it without a second presentation check.
// Returns { regionId, activeMapId, mapIds:[…], has(id) } or null when Continuous
// View is off or the active map is NONregional (legacy mode). Based on physical
// proximity so simulation never fluctuates with a one-pixel visibility change.
function nearbySimulationMapSet() {
  if (typeof continuousWorldViewActive !== 'function' || !continuousWorldViewActive()) return null;
  const activeMapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  const p = (activeMapId && typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(activeMapId) : null;
  if (!p) return null;
  const ids = [];
  for (let dr = -1; dr <= 1; dr++) {             // row-major: rows outer
    for (let dc = -1; dc <= 1; dc++) {           // cols inner (left -> right)
      const mid = (typeof mapIdForChunk === 'function') ? mapIdForChunk(p.regionId, p.chunkX + dc, p.chunkY + dr) : null;
      if (!mid) continue;                        // omit sparse/unplaced chunks
      if (typeof isLegacyScreenMap === 'function' && isLegacyScreenMap(mid)) continue; // omit legacy_screen homes (hidden behind their border)
      ids.push(mid);
    }
  }
  return { regionId: p.regionId, activeMapId, mapIds: ids, has: (id) => ids.indexOf(id) !== -1 };
}

// Is this NPC a regional NPC whose owner chunk is currently in the nearby
// simulation set? False for nonregional NPCs and whenever the set is null (legacy).
function regionalNpcInSimulationScope(npc) {
  const set = nearbySimulationMapSet();
  if (!set) return false;
  const mapId = physicalMapIdForNpc(npc);
  return !!(mapId && set.has(mapId));
}

// The unified "should this NPC's route simulate this frame?" predicate used by
// ensureAutoMovers() and updateNpcRoutes(). Regional NPCs under Continuous View +
// regional active map use nearby-set membership; nonregional NPCs (bridge guards,
// house wanderer, brewery patrol) and legacy mode (Continuous View off / nonregional
// active) use the exact legacy active-content-key gate.
function npcShouldSimulate(npc) {
  const mapId = physicalMapIdForNpc(npc);
  if (mapId) {
    // REGIONAL NPC: PHYSICAL map identity decides — never logical-key equality, so
    // an explicit-physicalMapId NPC on the shared 'overworld' key is owned by its
    // OWN chunk, not any other chunk that merely shares the key.
    const set = nearbySimulationMapSet();
    if (set) return set.has(mapId);                                  // continuous + regional: nearby set
    return mapId === (typeof mapIdForRef === 'function' ? mapIdForRef(activeMap) : null); // legacy: only its OWN active chunk
  }
  // Nonregional NPC (bridge guards, house wanderer, brewery patrol): exact legacy gate.
  return typeof currentContentLocationKey === 'function' && npc.map === currentContentLocationKey();
}

// Guard for the LEGACY active-map NPC filters (rendering / interaction / collision)
// that select by logical key: an NPC with EXPLICIT physical ownership must ALSO be
// owned by the active physical map, or it is excluded — so an explicit-physicalMapId
// NPC on the ambiguous 'overworld' key never leaks into a different physical map
// (MAP/MAP5/RODDON_WAY_MAP) that only shares its logical key. Returns true = EXCLUDE.
// NPCs without an explicit physicalMapId are never excluded (legacy behaviour intact).
function npcExplicitOwnershipMismatchesActive(npc) {
  if (!npc || npc.physicalMapId === undefined || npc.physicalMapId === null) return false;
  const owner = physicalMapIdForNpc(npc);
  const active = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  return owner !== active;
}

// ── World-aware route occupancy for a regional NPC ───────────────────────────
// Parameterized on the NPC's OWN physical map (not activeMap). A candidate LOCAL
// step (px, owner-chunk frame) is walkable only if its full COLLISION_RADIUS
// footprint stays inside the owner chunk, on walkable non-transition tiles read
// from the NPC's physical map, clear of the player (regional world pixels) and of
// every other solid regional NPC's world pose. Confinement to the owner chunk is
// how "an NPC cannot leave its map" is enforced this increment.
function regionalNpcRouteCanOccupy(npc, localNx, localNy) {
  const mapId = physicalMapIdForNpc(npc);
  if (!mapId) return false;
  const placement = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(mapId) : null;
  if (!placement) return false;
  const regionId = placement.regionId;
  const CW = COLS * TILE, CH = ROWS * TILE;
  const worldNx = placement.chunkX * CW + localNx, worldNy = placement.chunkY * CH + localNy;
  for (const [wx, wy] of footprintCorners(worldNx, worldNy)) {
    const wtx = Math.floor(wx / TILE), wty = Math.floor(wy / TILE);
    if (Math.floor(wtx / COLS) !== placement.chunkX || Math.floor(wty / ROWS) !== placement.chunkY) return false; // leaving owner chunk
    const t = tileAtWorld(regionId, wtx, wty);
    if (t === REGION_VOID_TILE || !isTileWalkable(t)) return false;                       // void / missing / solid tile
    const props = (typeof TILE_PROPERTIES !== 'undefined') ? TILE_PROPERTIES[t] : null;
    if (props && props.isTransition) return false;                                        // never enter exits/doorways
  }
  // Never push/trap the player (measured in regional world pixels).
  const pw = (typeof mapLocalPxToWorldPx === 'function') ? mapLocalPxToWorldPx(mapIdForRef(activeMap), player.x, player.y) : null;
  if (pw && Math.abs(worldNx - pw.worldPxX) < 18 && Math.abs(worldNy - pw.worldPxY) < 18) return false;
  // Never overlap another SOLID regional NPC — compared in world pixels, so two
  // NPCs in different local frames can't overlap and distant NPCs never collide.
  for (const other of SIMPLE_NPCS) {
    if (other === npc || !other.solid) continue;
    const op = regionalNpcPose(other);
    if (!op) continue;
    if (Math.abs(worldNx - op.worldPxX) < 18 && Math.abs(worldNy - op.worldPxY) < 18) return false;
  }
  return true;
}

if (typeof window !== 'undefined') {
  window.physicalMapIdForNpc        = physicalMapIdForNpc;
  window.regionalNpcPose            = regionalNpcPose;
  window.nearbySimulationMapSet     = nearbySimulationMapSet;
  window.regionalNpcInSimulationScope = regionalNpcInSimulationScope;
  window.npcShouldSimulate          = npcShouldSimulate;
  window.npcExplicitOwnershipMismatchesActive = npcExplicitOwnershipMismatchesActive;
  window.regionalNpcRouteCanOccupy  = regionalNpcRouteCanOccupy;
}
