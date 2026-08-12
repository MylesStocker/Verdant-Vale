'use strict';

// world-point-content.js — WORLD-AWARE STATIC CONTENT ACROSS SEAMS.
//
// When Continuous View is on, this module lets a narrow, explicitly-safe set of
// nearby STATIC outdoor content resolve across an eligible seam into ONE directly
// adjacent chunk: automatic item pickups, and safe stationary simple-dialogue NPC
// interaction targets. It NEVER touches neighbouring NPC movement/schedules/AI or
// encounters — those remain owned solely by the active map.
//
// Design contract (enforced throughout):
//   • PURE RESOLUTION. worldPointContentContext() and crossSeamNeighbourFor() map
//     a region world-pixel point to a physical map + local pixel coordinate using
//     only the declarative authorities (REGIONAL_LAYOUT placement + the fail-closed
//     seam classifier + OUTDOOR_CONTENT_KEYS). They assign NOTHING — not activeMap,
//     player, coordinates, content keys, or NPC state. There is no probe, no
//     snapshot/restore, no transient context impersonation.
//   • CANONICAL EFFECTS ONLY. The only mutations performed for a neighbouring
//     target are the intended ones (marking an item picked / granting it / opening
//     its dialogue), applied to the SAME shared content object the map owns, so a
//     later handoff sees the change (an item stays picked; it cannot re-grant).
//   • FAIL CLOSED. Cross-seam authorization requires ALL of: Continuous View on;
//     active + target maps placed in the same region; the target chunk directly
//     cardinally adjacent to the active chunk; a reciprocal eligible seam between
//     them; the crossing coordinate inside that seam's approved range; the target
//     within the existing reach radius. Ambiguous content keys forfeit NPC
//     ownership. Any handler that cannot consume an explicit neighbour context is
//     not cross-seam-capable and is never dispatched across a seam.

// ── Pure world-point content resolver ───────────────────────────────────────
// Region world-pixel point -> { regionId, mapId, map, localPxX, localPxY,
// contentKey, contentKeyUnambiguous } or null. Units are PIXELS. A missing chunk
// / documented void / off-region / negative point returns null. contentKey comes
// straight from the OUTDOOR_CONTENT_KEYS authority (data.js); it is null for a
// placed non-outdoor map. contentKeyUnambiguous is true only when that key is
// owned by exactly one placed outdoor map (derived in continuous-content.js) —
// the fail-closed gate for attributing NPC ownership to a chunk. PURE: no state
// read that can change, no state written.
function worldPointContentContext(regionId, worldPxX, worldPxY) {
  if (typeof REGIONAL_LAYOUT === 'undefined' || !REGIONAL_LAYOUT[regionId]) return null;
  if (!Number.isFinite(worldPxX) || !Number.isFinite(worldPxY)) return null;
  if (worldPxX < 0 || worldPxY < 0) return null;                 // negatives fall onto no chunk
  const CW = COLS * TILE, CH = ROWS * TILE;
  const chunkX = Math.floor(worldPxX / CW), chunkY = Math.floor(worldPxY / CH);
  const mapId = (typeof mapIdForChunk === 'function') ? mapIdForChunk(regionId, chunkX, chunkY) : null;
  if (!mapId) return null;                                        // void / gap / unplaced
  const info = (typeof outdoorContentKeyInfo === 'function') ? outdoorContentKeyInfo(mapId) : null;
  return {
    regionId, mapId,
    map: (typeof mapRefForId === 'function') ? mapRefForId(mapId) : null,
    localPxX: worldPxX - chunkX * CW,
    localPxY: worldPxY - chunkY * CH,
    contentKey: (typeof outdoorContentKeyForMapId === 'function') ? outdoorContentKeyForMapId(mapId) : null,
    contentKeyUnambiguous: !!(info && info.unambiguous),
  };
}

// The player's position in region-world pixels, or null when the active map is
// not placed / Continuous View is off. READ-ONLY.
function activePlayerWorldPoint() {
  if (typeof continuousWorldViewActive !== 'function' || !continuousWorldViewActive()) return null;
  const activeMapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  if (!activeMapId) return null;
  const pw = (typeof mapLocalPxToWorldPx === 'function') ? mapLocalPxToWorldPx(activeMapId, player.x, player.y) : null;
  if (!pw) return null;
  return { activeMapId, regionId: pw.regionId, worldPxX: pw.worldPxX, worldPxY: pw.worldPxY };
}

// Given the active physical map id and a TARGET world-pixel point, return
// { seam, ctx } when the target is owned by a single directly-adjacent
// eligible-seam neighbour reachable across the seam, else null. `ctx` is the
// pure worldPointContentContext() for the target; `seam` is the crossed eligible
// seam. Composes the fail-closed geometry gate (continuousSeamCrossingAt) with
// the pure resolver, and cross-checks that the seam's declared neighbour matches
// the map the point physically lands on. READ-ONLY.
function crossSeamNeighbourFor(activeMapId, targetWorldPxX, targetWorldPxY) {
  if (typeof continuousSeamCrossingAt !== 'function') return null;
  const seam = continuousSeamCrossingAt(activeMapId, targetWorldPxX, targetWorldPxY);
  if (!seam) return null;                                         // diagonal/non-adjacent/ineligible/out-of-range/void
  const p = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(activeMapId) : null;
  if (!p) return null;
  const ctx = worldPointContentContext(p.regionId, targetWorldPxX, targetWorldPxY);
  if (!ctx || ctx.mapId !== seam.to) return null;                // resolver + seam must agree on the neighbour
  return { seam, ctx };
}

// ── EXPLICIT capability contracts (fail closed; no absence-based eligibility) ─
// A neighbour becomes cross-seam-eligible only by OPTING IN through a recognized
// capability — never merely because it happens to lack action/route metadata
// today (that would silently accept future behaviour). Unknown capability values
// fail closed.
//
// NPCs: `npc.crossSeamInteraction` must equal a recognized capability. The only
// one supported is 'simple_dialogue' (open the NPC's authored dialogue + apply
// its authored flag_sets). validateGameData() additionally errors if an opted-in
// NPC also carries incompatible behaviour (action / route / scripted combat /
// cutscene / transition) or lacks unambiguous content ownership — so an opt-in
// can never coexist with active-map-only machinery.
const CROSS_SEAM_NPC_CAPABILITIES = Object.freeze({ simple_dialogue: true });
function crossSeamNpcCapabilityRecognized(cap) {
  return typeof cap === 'string' && Object.prototype.hasOwnProperty.call(CROSS_SEAM_NPC_CAPABILITIES, cap);
}

// World-item pickups: EXPLICIT per-pickup capability, ALLOWLIST-based, fail closed.
// A placed pickup crosses a seam ONLY by opting in with `crossSeamPickup` set to a
// recognized capability. The one capability today is 'registry_grant': the item
// takes the ORDINARY grantItem() branch and nothing more. Eligibility is never
// inferred from "not quest_item/inscription" (a denylist) — an unopted pickup, an
// unknown capability, an unrecognized type, a quest/key item, or any unfamiliar
// behaviour-bearing property all fail closed.
const CROSS_SEAM_ITEM_CAPABILITIES = Object.freeze({ registry_grant: true });
function crossSeamItemCapabilityRecognized(cap) {
  return typeof cap === 'string' && Object.prototype.hasOwnProperty.call(CROSS_SEAM_ITEM_CAPABILITIES, cap);
}
// The ordinary inventory item TYPES the 'registry_grant' capability allows — the
// plain equip/consumable types that grantItem() adds to stats.items with no
// contextual behaviour. rod (key item), buff (battleOnly), reagent (combat-only),
// and any future/unknown type are NOT ordinary and fail closed.
const CROSS_SEAM_ORDINARY_ITEM_TYPES = Object.freeze({ potion: true, weapon: true, armor: true, shield: true, accessory: true });
// The structural fields a cross-seam pickup object may carry. Any OTHER field must
// also be an ordinary item-value field mirrored on the ITEM_REGISTRY definition
// (e.g. heals/price/bonus); anything else is an unknown behaviour-bearing property
// (scriptedPickup/onCollect/callback/…) and fails closed.
const CROSS_SEAM_PICKUP_STRUCTURAL_KEYS = Object.freeze(['id', 'name', 'type', 'x', 'y', 'picked', 'crossSeamPickup']);
// Contextual markers that DISQUALIFY an item even if its type is ordinary — on the
// pickup object OR its registry definition.
const CROSS_SEAM_ITEM_DISQUALIFYING_MARKERS = Object.freeze(['questItem', 'keyItem']);

// Returns { ok, reason }: whether a placed pickup object satisfies the ordinary
// 'registry_grant' cross-seam capability, and if not, why. The single authority
// shared by the runtime choke point (collectWorldItemNear) and validateGameData().
function crossSeamItemCapability(wi) {
  if (!wi || typeof wi !== 'object') return { ok: false, reason: 'not a pickup object' };
  if (!crossSeamItemCapabilityRecognized(wi.crossSeamPickup))
    return { ok: false, reason: wi.crossSeamPickup === undefined || wi.crossSeamPickup === null
      ? 'no crossSeamPickup capability (fail closed by default)'
      : 'unrecognized crossSeamPickup capability "' + wi.crossSeamPickup + '"' };
  // registry_grant contract:
  if (typeof wi.id !== 'string' || !wi.id) return { ok: false, reason: 'missing stable pickup id' };
  if (typeof ITEM_REGISTRY === 'undefined') return { ok: false, reason: 'ITEM_REGISTRY unavailable' };
  const def = Object.prototype.hasOwnProperty.call(ITEM_REGISTRY, wi.name) ? ITEM_REGISTRY[wi.name] : null;
  if (!def) return { ok: false, reason: 'name "' + wi.name + '" not in ITEM_REGISTRY' };
  if (!CROSS_SEAM_ORDINARY_ITEM_TYPES[def.type]) return { ok: false, reason: 'registry type "' + def.type + '" is not an ordinary grant type' };
  if (!CROSS_SEAM_ORDINARY_ITEM_TYPES[wi.type]) return { ok: false, reason: 'pickup type "' + wi.type + '" is not an ordinary grant type' };
  for (const m of CROSS_SEAM_ITEM_DISQUALIFYING_MARKERS) {
    if (wi[m]) return { ok: false, reason: 'pickup marks ' + m };
    if (def[m]) return { ok: false, reason: 'registry definition marks ' + m };
  }
  // No unknown behaviour-bearing pickup property: every key is either structural or
  // an ordinary item-value field mirrored on the registry definition.
  for (const k of Object.keys(wi)) {
    if (CROSS_SEAM_PICKUP_STRUCTURAL_KEYS.indexOf(k) !== -1) continue;
    if (Object.prototype.hasOwnProperty.call(def, k)) continue;
    return { ok: false, reason: 'unknown behaviour-bearing pickup property "' + k + '"' };
  }
  return { ok: true, reason: null };
}
// Boolean form for the runtime choke point.
function crossSeamCollectibleItem(wi) {
  return crossSeamItemCapability(wi).ok;
}

// ── Cross-seam automatic item pickup ────────────────────────────────────────
// Runs once per update() frame, AFTER the active map's own pickup loop (so the
// active map keeps deterministic priority). For each eligible-seam neighbour of
// the active map, any not-yet-collected world item whose CENTER lies within the
// normal pickup radius of the player — measured in region-world pixels — and is
// authorized across the seam, is collected via the SAME collectWorldItemNear()
// used for the active map, but flagged crossSeam so contextual quest_item pickups
// fail closed (they depend on active-map-only state and are never granted across
// a seam). The item's shared object is mutated in place: .picked persists, so it
// disappears immediately and can never re-grant on a later handoff. No activeMap,
// player, coordinate, or NPC mutation occurs.
function crossSeamStaticPickup() {
  const pw = activePlayerWorldPoint();
  if (!pw) return;
  if (typeof continuousSeamEntries !== 'function' || typeof collectWorldItemNear !== 'function') return;
  const CW = COLS * TILE, CH = ROWS * TILE;
  const seen = new Set();
  for (const seam of continuousSeamEntries()) {
    if (seam.from !== pw.activeMapId) continue;
    const neighbourId = seam.to;
    if (seen.has(neighbourId)) continue;                          // one map is one owner regardless of seam count
    seen.add(neighbourId);
    const entry = (typeof mapEntryForId === 'function') ? mapEntryForId(neighbourId) : null;
    if (!entry || !Array.isArray(entry.items) || !entry.items.length) continue;
    const np = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(neighbourId) : null;
    if (!np || np.regionId !== pw.regionId) continue;
    const originX = np.chunkX * CW, originY = np.chunkY * CH;
    // The player's position expressed in the NEIGHBOUR's local pixel frame, so
    // collectWorldItemNear() measures the exact same world distance the active
    // path would, against the item's authored local coordinates.
    const neighbourLocalX = pw.worldPxX - originX;
    const neighbourLocalY = pw.worldPxY - originY;
    for (const wi of entry.items) {
      if (wi.picked) continue;
      const auth = crossSeamNeighbourFor(pw.activeMapId, originX + wi.x, originY + wi.y);
      if (!auth || auth.ctx.mapId !== neighbourId) continue;      // fail closed: not reachable across the seam
      collectWorldItemNear(wi, neighbourLocalX, neighbourLocalY, { crossSeam: true });
    }
  }
}

// ── Cross-seam interaction: safe stationary simple-dialogue NPC targets ──────
// A neighbouring NPC is cross-seam-INTERACTABLE only if it EXPLICITLY OPTS IN with
// a recognized capability (`crossSeamInteraction: 'simple_dialogue'`). Absence, or
// any unknown value, fails closed — eligibility is never inferred from missing
// action/route metadata. As defence-in-depth (validateGameData() is the primary
// guard), an opted-in NPC is still runtime-rejected unless it is structurally a
// plain stationary dialogue NPC: authored `dialogue`, and none of the active-map-
// only machinery (no action / NPC_ACTIONS key / movement route / NPC_ROUTES). This
// mirrors the plain-dialogue branch of interactSimpleNPCs() — no clone/move/advance.
function _crossSeamSimpleDialogueNpc(npc) {
  if (!npc) return false;
  if (!crossSeamNpcCapabilityRecognized(npc.crossSeamInteraction)) return false; // explicit opt-in only; unknown -> closed
  if (npc.crossSeamInteraction !== 'simple_dialogue') return false;              // only capability supported today
  if (!Array.isArray(npc.dialogue) || !npc.dialogue.length) return false;
  if (typeof npc.action === 'function') return false;
  if (npc.action && typeof NPC_ACTIONS !== 'undefined' && NPC_ACTIONS[npc.action]) return false;
  if (npc.action) return false;                                   // unknown action string -> fail closed
  if (npc.movement) return false;                                 // authored mover -> not stationary
  if (typeof NPC_ROUTES !== 'undefined' && NPC_ROUTES[npc.id]) return false; // live route -> not stationary
  return true;
}

// Reverse the OUTDOOR_CONTENT_KEYS authority to the single physical map that owns
// an UNAMBIGUOUS content key. Ambiguous keys (shared by several maps) return null:
// their NPC content cannot be attributed to a chunk, so it forfeits cross-seam
// ownership. Built lazily from the pure entries; cached.
let _WPC_KEY_TO_MAP = null;
function _unambiguousMapForContentKey(key) {
  if (!_WPC_KEY_TO_MAP) {
    _WPC_KEY_TO_MAP = new Map();
    if (typeof outdoorContentKeyEntries === 'function') {
      for (const e of outdoorContentKeyEntries()) {
        if (e.unambiguous && e.key) _WPC_KEY_TO_MAP.set(e.key, e.mapId);
      }
    }
  }
  return _WPC_KEY_TO_MAP.has(key) ? _WPC_KEY_TO_MAP.get(key) : null;
}

// Resolve the safe stationary neighbour NPC the player's interaction press should
// target across a seam, or null. It considers ONLY the eligible-seam neighbours of
// the active map, ONLY NPCs owned by that neighbour's UNAMBIGUOUS content key,
// ONLY simple-dialogue NPCs (fail closed otherwise), whose flag_required (a pure
// read) is satisfied, whose CENTER is within TALK_RADIUS of the player in world
// pixels, and whose position is authorized across the seam. Returns the live NPC
// object (canonical runtime position — never cloned or moved). READ-ONLY: selects
// but does not open; the caller performs the canonical dialogue open.
function resolveCrossSeamInteractTarget() {
  const pw = activePlayerWorldPoint();
  if (!pw) return null;
  if (typeof SIMPLE_NPCS === 'undefined' || typeof continuousSeamEntries !== 'function') return null;
  const CW = COLS * TILE, CH = ROWS * TILE;
  const radius = (typeof TALK_RADIUS !== 'undefined') ? TALK_RADIUS : 20;
  const seen = new Set();
  for (const seam of continuousSeamEntries()) {
    if (seam.from !== pw.activeMapId) continue;
    const neighbourId = seam.to;
    if (seen.has(neighbourId)) continue;
    seen.add(neighbourId);
    const key = (typeof outdoorContentKeyForMapId === 'function') ? outdoorContentKeyForMapId(neighbourId) : null;
    if (!key) continue;
    if (_unambiguousMapForContentKey(key) !== neighbourId) continue; // ambiguous key -> forfeit NPC ownership
    const np = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(neighbourId) : null;
    if (!np || np.regionId !== pw.regionId) continue;
    const originX = np.chunkX * CW, originY = np.chunkY * CH;
    for (const npc of SIMPLE_NPCS) {
      if (npc.map !== key) continue;
      if (!_crossSeamSimpleDialogueNpc(npc)) continue;
      if (npc.flag_required !== null && npc.flag_required !== undefined) {
        if (window[npc.flag_required.flag] !== npc.flag_required.value) continue;
      }
      const npcWorldPxX = originX + npc.x, npcWorldPxY = originY + npc.y;
      const dPxX = pw.worldPxX - npcWorldPxX, dPxY = pw.worldPxY - npcWorldPxY;
      if (Math.sqrt(dPxX * dPxX + dPxY * dPxY) >= radius) continue;
      const auth = crossSeamNeighbourFor(pw.activeMapId, npcWorldPxX, npcWorldPxY);
      if (!auth || auth.ctx.mapId !== neighbourId) continue;      // fail closed: not reachable across the seam
      return npc;
    }
  }
  return null;
}

// Consume an interact press against a safe stationary neighbour NPC, if one is
// the resolved cross-seam target. Opens ONLY simple dialogue (canonical open,
// identical to interactSimpleNPCs()'s plain-dialogue branch), applies the NPC's
// authored flag_sets (a canonical on-talk flag write), and returns true iff a
// dialogue was opened. Never advances a schedule, moves/clones the NPC, changes
// activeMap, or starts a scripted fight/cutscene. Only ever called as a lowest-
// priority fallback AFTER active-map interaction resolved nothing, so it can
// never duplicate an active-map prompt or fire beneath open UI.
function tryCrossSeamNeighbourInteract() {
  const npc = resolveCrossSeamInteractTarget();
  if (!npc) return false;
  dialogue.name  = npc.name;
  dialogue.pages = npc.dialogue;
  dialogue.open  = true;
  dialogue.page  = 0;
  if (npc.flag_sets !== null && npc.flag_sets !== undefined) window[npc.flag_sets.flag] = npc.flag_sets.value;
  return true;
}

// ── Prompt selection (drives BOTH pressing interact AND rendering the prompt) ─
// READ-ONLY mirror of interactSimpleNPCs()'s selection: is an ACTIVE-map simple
// NPC (current content key, flag_required satisfied) within TALK_RADIUS of the
// player right now? An active target has priority at press time (handleInteract
// runs active handlers first), so its presence must also SUPPRESS the neighbour
// prompt. No side effects: it never opens dialogue, sets flag_sets, or mutates.
function _activeSimpleNpcTargetPresent() {
  if (typeof SIMPLE_NPCS === 'undefined' || typeof currentContentLocationKey !== 'function') return false;
  const key = currentContentLocationKey();
  const radius = (typeof TALK_RADIUS !== 'undefined') ? TALK_RADIUS : 20;
  for (const npc of SIMPLE_NPCS) {
    if (npc.map !== key) continue;
    if (npc.flag_required !== null && npc.flag_required !== undefined) {
      if (window[npc.flag_required.flag] !== npc.flag_required.value) continue;
    }
    const dPxX = player.x - npc.x, dPxY = player.y - npc.y;
    if (Math.sqrt(dPxX * dPxX + dPxY * dPxY) < radius) return true;
  }
  return false;
}

// The single authority for WHETHER a cross-seam interaction prompt should show and
// FOR WHICH neighbour NPC — the SAME selection that a press dispatches to. Returns
// the neighbour NPC to prompt for, or null. Null when: no reachable/authorized
// safe neighbour target (resolveCrossSeamInteractTarget), OR a higher-priority
// active-map target is present (it would win the press, so no neighbour prompt).
// After a handoff the former neighbour is the ACTIVE map, so it is no longer a
// cross-seam neighbour and this returns null for it — the prompt cannot duplicate.
// PURE / READ-ONLY: selecting a prompt target mutates nothing.
function crossSeamInteractPromptTarget() {
  if (_activeSimpleNpcTargetPresent()) return null;   // active target has priority -> suppress neighbour prompt
  return resolveCrossSeamInteractTarget();
}

if (typeof window !== 'undefined') {
  window.worldPointContentContext     = worldPointContentContext;
  window.activePlayerWorldPoint       = activePlayerWorldPoint;
  window.crossSeamNeighbourFor        = crossSeamNeighbourFor;
  window.crossSeamStaticPickup        = crossSeamStaticPickup;
  window.resolveCrossSeamInteractTarget = resolveCrossSeamInteractTarget;
  window.tryCrossSeamNeighbourInteract = tryCrossSeamNeighbourInteract;
  window.crossSeamInteractPromptTarget = crossSeamInteractPromptTarget;
  window.crossSeamCollectibleItem     = crossSeamCollectibleItem;
  window.crossSeamItemCapability      = crossSeamItemCapability;
  window.crossSeamItemCapabilityRecognized = crossSeamItemCapabilityRecognized;
  window.crossSeamNpcCapabilityRecognized = crossSeamNpcCapabilityRecognized;
  window.CROSS_SEAM_NPC_CAPABILITIES  = CROSS_SEAM_NPC_CAPABILITIES;
  window.CROSS_SEAM_ITEM_CAPABILITIES = CROSS_SEAM_ITEM_CAPABILITIES;
}
