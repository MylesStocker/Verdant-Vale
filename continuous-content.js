'use strict';

// continuous-content.js — READ-ONLY neighbouring outdoor-content rendering for
// Continuous View. When enabled, every VISIBLE placed outdoor chunk renders its
// authored world content (items, NPCs, procedural landmarks) at that chunk's
// stable world origin — not just terrain. This is purely visual: neighbouring
// content never updates, interacts, is collected, triggers, or controls
// encounters. `activeMap` remains the sole BEHAVIOUR authority; only the active
// chunk gets the player and active-only prompts/hints.
//
// This module is the ONE authority for deciding which procedural decorations
// belong to which physical map, and for deriving content-key AMBIGUITY. It NEVER
// assigns/spoofs/mutates activeMap, player, location flags, NPC state, or item
// state — for anything, including resolving keys.

// ── Content-key AMBIGUITY, derived PURELY from the declarative authority ──────
// The physical-map -> logical-content-key mapping is the single OUTDOOR_CONTENT_KEYS
// authority (data.js), which currentContentLocationKey() also consumes. Ambiguity
// is derived here by GROUPING that plain object (no runtime probing, no state
// mutation): a key owned by exactly one placed outdoor map is UNAMBIGUOUS (its
// neighbouring NPC content can be attributed to that chunk); a key SHARED by
// several maps (e.g. 'overworld' -> MAP/MAP5/RODDON_WAY_MAP) is ambiguous, so
// neighbouring NPC content is skipped for those maps (items + decorations are
// unaffected). Built once, lazily, from the static object — cached.
let _CC_AMBIG = null; // Map mapId -> { key, unambiguous }
function _ccAmbiguity() {
  if (_CC_AMBIG) return _CC_AMBIG;
  _CC_AMBIG = new Map();
  if (typeof OUTDOOR_CONTENT_KEYS === 'undefined') return _CC_AMBIG;
  const count = Object.create(null);
  for (const id of Object.keys(OUTDOOR_CONTENT_KEYS)) {
    const k = OUTDOOR_CONTENT_KEYS[id];
    count[k] = (count[k] || 0) + 1;
  }
  for (const id of Object.keys(OUTDOOR_CONTENT_KEYS)) {
    const k = OUTDOOR_CONTENT_KEYS[id];
    _CC_AMBIG.set(id, { key: k, unambiguous: count[k] === 1 });
  }
  return _CC_AMBIG;
}
// { mapId, key, unambiguous } for every bound placed outdoor map.
function outdoorContentKeyEntries() {
  return Array.from(_ccAmbiguity().entries()).map(([mapId, v]) => ({ mapId, key: v.key, unambiguous: v.unambiguous }));
}
// { key, unambiguous } for a bound outdoor map, or null otherwise. (The plain
// key is outdoorContentKeyForMapId() in data.js — the single authority.)
function outdoorContentKeyInfo(mapId) {
  const m = _ccAmbiguity();
  return m.has(mapId) ? m.get(mapId) : null;
}

// ── The sole authority for physical-map -> outdoor procedural decorations ────
// Each entry draws that map's STATIC decoration body at LOCAL coordinates (the
// caller has already translated to the chunk's world origin). Player-relative
// hints/prompts are NOT here — they stay in the active-only draw functions.
const OUTDOOR_MAP_DECOR = {
  MAP4:   function () { if (typeof drawThornmereStoneBody === 'function')  drawThornmereStoneBody(); },
  MAP_N2: function () { if (typeof drawDrenwichNorthGateBody === 'function') drawDrenwichNorthGateBody(); },
};

// Explicit render context for a chunk's outdoor content. contentLocationKey comes
// straight from the pure OUTDOOR_CONTENT_KEYS authority (data.js) — no probing.
function outdoorChunkContentContext(mapId, isActiveChunk) {
  return {
    mapId,
    map: (typeof mapRefForId === 'function') ? mapRefForId(mapId) : null,
    contentLocationKey: (typeof outdoorContentKeyForMapId === 'function') ? outdoorContentKeyForMapId(mapId) : null,
    isActiveChunk: !!isActiveChunk,
  };
}

// Draws a NEIGHBOURING outdoor chunk's content, READ-ONLY. The canvas is already
// translated to the chunk's stable world origin. Renders: canonical world items
// (respecting each item's collected `.picked` state), NPCs owned by an UNAMBIGUOUS
// content key (existing runtime/schedule positions; no advance, no dialogue, no
// player-relative prompts), and static procedural decorations. It never draws the
// player, active-only hints, or interaction prompts, and mutates nothing.
function drawNeighbourOutdoorContent(cx) {
  if (!cx || cx.isActiveChunk) return; // active chunk uses the full active path (with player + hints)
  const entry = (typeof mapEntryForId === 'function') ? mapEntryForId(cx.mapId) : null;
  if (entry && Array.isArray(entry.items) && entry.items.length && typeof drawMapWorldItems === 'function') {
    drawMapWorldItems(entry.items);                         // respects wi.picked (collected state)
  }
  const info = (typeof outdoorContentKeyInfo === 'function') ? outdoorContentKeyInfo(cx.mapId) : null;
  if (info && info.unambiguous && info.key && typeof drawContentNPCs === 'function') {
    drawContentNPCs(info.key);                              // read-only; no advance/dialogue/prompt
  }
  const decor = OUTDOOR_MAP_DECOR[cx.mapId];
  if (typeof decor === 'function') decor();                 // static landmark body (no active hint)
}

if (typeof window !== 'undefined') {
  // outdoorContentKeyForMapId lives in data.js (the single authority); here we
  // expose only the derived ambiguity views.
  window.outdoorContentKeyEntries    = outdoorContentKeyEntries;
  window.outdoorContentKeyInfo       = outdoorContentKeyInfo;
  window.OUTDOOR_MAP_DECOR           = OUTDOOR_MAP_DECOR;
  window.outdoorChunkContentContext  = outdoorChunkContentContext;
  window.drawNeighbourOutdoorContent = drawNeighbourOutdoorContent;
}
