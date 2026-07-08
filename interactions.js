'use strict';

// ─── Cat pet responses ────────────────────────────────────────────────────────
const CAT_PET_RESPONSES = [
  ['...', 'purrrrr~'],
  ['It bumps its head against your hand.', 'Twice.', 'Then walks away.'],
  ['It rolls onto its back,', 'looks at you upside-down,', 'and immediately rolls back.'],
  ['It narrows its eyes slowly.', 'You narrow yours back.', 'This continues for a moment.', 'You both stop at the same time.'],
  ['It chirps \u2014 one short sound \u2014', 'and then acts like it didn\u2019t.'],
  ['It leans into your hand with its full weight,', 'then steps off your lap and sits slightly out of reach.'],
  ['It starts purring before you\u2019ve finished reaching for it.', 'It does not acknowledge this.'],
  ['It bites you. Gently.', 'Then purrs.'],
  ['It kneads the air briefly,', 'remembers you\u2019re watching,', 'and stops.'],
  ['It tucks its paws under itself and becomes', 'a perfectly spherical object.'],
];
function catPetResponse() {
  return CAT_PET_RESPONSES[Math.floor(Math.random() * CAT_PET_RESPONSES.length)];
}

// ─── Interaction ──────────────────────────────────────────────────────────────
// Checks SIMPLE_NPCS on the current map; opens dialogue (or calls action) for
// the first one within TALK_RADIUS. Returns true if an NPC was triggered.
function interactSimpleNPCs() {
  const mapId = currentMapId();
  for (const npc of SIMPLE_NPCS) {
    if (npc.map !== mapId) continue;
    if (npc.flag_required !== null) {
      if (window[npc.flag_required.flag] !== npc.flag_required.value) continue;
    }
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS) {
      if (typeof npc.action === 'function') {
        npc.action(npc);
      } else if (npc.action && NPC_ACTIONS[npc.action]) {
        NPC_ACTIONS[npc.action](npc);
      } else {
        dialogue.name  = npc.name;
        dialogue.pages = npc.dialogue;
        dialogue.open  = true;
        dialogue.page  = 0;
      }
      if (npc.flag_sets !== null) window[npc.flag_sets.flag] = npc.flag_sets.value;
      return true;
    }
  }
  return false;
}

// ─── Interaction helpers ──────────────────────────────────────────────────────
// Returns true if player is within `radius` px of world position (x, y).
function nearPlayer(x, y, radius) {
  if (radius === undefined) radius = TALK_RADIUS;
  const dx = player.x - x;
  const dy = player.y - y;
  return Math.sqrt(dx * dx + dy * dy) < radius;
}

// Opens a dialogue panel with the given name, pages, and optional callbacks.
function openDialogue(name, pages, callbacks) {
  dialogue.name      = name;
  dialogue.pages     = pages;
  dialogue.callbacks = callbacks !== undefined ? callbacks : null;
  dialogue.open      = true;
  dialogue.page      = 0;
}

// ─── MAP_FEATURES ───────────────────────────────────────────────────────────────────
// General, game-wide registry for simple map-based content: inspectable
// signs/plaques/gauges/notices ('inspect') and one-shot-or-repeatable area
// discovery text ('trigger'). Not North Basin-specific and not a quest
// scripting engine -- no rewards, no combat starts, no map transitions, no
// branching logic live here. Keyed by MAP_REGISTRY/MAP_METADATA id (the
// same id mapRegistryId() returns), so it works unchanged for any future
// town/interior/dungeon/ruin/wilderness/special map wired into that
// registry the normal way -- nothing below reads a map name directly.
//
// This supersedes INTERACTION_REGISTRY (the earlier pilot, formerly in this
// same spot): every one of its 9 entries is migrated below as a `type:
// 'inspect'` feature with identical trigger radius, identical text, and
// (via `condition`) identical map/town scoping -- see each entry's comment
// for the one-to-one mapping from its old `when()` check. No environmental
// dialogue behavior changes; this is a data-shape migration, not a content
// change. INTERACTION_REGISTRY itself, tryInteractionRegistry(), and its
// call site in handleInteract() are removed, not kept alongside this --
// keeping two parallel systems for the same job would just invite the
// migrated entries to drift out of sync with any new pilot-only additions.
//
// Feature shape:
//   id           unique string, required.
//   type         'inspect' | 'trigger', required.
//   x, y         (inspect) tile-unit coordinates, e.g. 13.5 -- NOT pixels.
//   rect         (trigger) { x1, y1, x2, y2 } tile-unit bounds, inclusive.
//   radius       (inspect, optional) proximity radius in px; defaults to
//                TALK_RADIUS, matching every existing NPC/interaction check.
//   facing       (inspect, optional) requires player.facing === this value.
//   condition    (optional) () => boolean; evaluated fresh every check, and
//                wrapped in a try/catch (see evaluateMapFeatureCondition())
//                so a throwing condition can never crash movement/interact.
//   pages        array of pages (same shape as dialogue.pages), OR a
//                () => pages function for dynamic text -- see
//                resolveMapFeaturePages(). Required unless the feature is
//                unreachable when condition is false (fallbackPages covers
//                that case instead).
//   fallbackPages  (inspect, optional) shown instead of `pages` when
//                `condition` is present and returns false, rather than
//                silently doing nothing. Optional -- if absent and the
//                condition fails, interacting with the feature does nothing.
//   onceFlag     (optional) a plain string; the SAME persistent-global-flag
//                pattern quest code already uses (a bare `window[name]`
//                boolean, restored by save/load's blanket key-value
//                iteration -- see save.js -- with no schema list to update,
//                exactly like `mirethyst_rewarded` above). Not a new
//                mechanism. If set and window[onceFlag] is already true,
//                `pages` is skipped in favor of `repeatPages`.
//   repeatPages  (optional) shown instead of `pages`/`fallbackPages` once
//                onceFlag has already been set true. If onceFlag is set but
//                repeatPages isn't, interacting/entering again does nothing.
//   name         (optional) shown as the dialogue box's name-plate; empty
//                by default, matching every migrated sign/plaque (no NPC
//                name to show).
//   label        (optional) debug/validation-only identifier, e.g. "Road
//                sign" -- never shown to the player, never used to decide
//                behavior. Distinct from `name` on purpose (see requirement
//                1's own wording: label is "for debug and validation").
const MAP_FEATURES = {
  // ── West Calwick survey marker ────────────────────────────────────────
  // Was: when: () => currentTownId === 'calwick' && activeMap === WEST_TOWN_MAP.
  // WEST_TOWN_MAP is Calwick-only (no other town reuses it -- see
  // MAP_METADATA['WEST_TOWN_MAP']), so the condition is redundant with the
  // map key alone, but kept anyway for exact behavioral parity with the
  // original rather than assuming that's safe to drop.
  WEST_TOWN_MAP: [
    {
      id:        'survey_marker_west_calwick',
      type:      'inspect',
      x:         1.5, y: 10.5,
      condition: () => currentTownId === 'calwick',
      label:     'Survey marker',
      pages: [
        ['A short wooden post set into the path.',
         'Brass plate, tarnished but legible.'],
        ['CALWICK WEST \u2014 PARCEL 7G',
         'Classification: Residential.',
         'Status: Pending final registration.',
         'Allocated to: [BLANK]'],
        ['Below the plate, smaller text:',
         'Reference incomplete \u2014 household name absent at time of survey.',
         'See district file.'],
        ['There\u2019s a date.',
         'Sixteen years ago.',
         'You\u2019ve lived here long enough that this should bother you more than it does.'],
      ],
    },
  ],

  // ── The North Basin \u2014 South Approach signage (skeleton pass) ─────────
  // Five inspectable signs. No NPCs/quests on this map yet -- see maps.js's
  // header comment on NORTH_BASIN_S_MAP for the full layout.
  NORTH_BASIN_S_MAP: [
    {
      id: 'north_basin_road_sign', type: 'inspect', x: 13.5, y: 12.5, label: 'Road sign',
      pages: [
        ['A weathered post at the road\u2019s edge.', 'District stencil, faded but legible.'],
        ['NORTH BASIN ROAD', 'Maintained only to Marker 4.'],
        ['Below, smaller print:',
         'Beyond Marker 4, road condition is unsurveyed.',
         'Proceed at own risk. District assumes no liability.'],
      ],
    },
    {
      id: 'north_basin_drought_notice', type: 'inspect', x: 10.5, y: 13.5, label: 'Drought notice',
      pages: [
        ['A notice board under a lean-to roof, most of the shingles missing.'],
        ['WATER LEVEL ADVISORY \u2014 REGIONAL',
         'Basin levels remain below seasonal average for the third consecutive year.'],
        ['Canal traffic through Drenwick continues on reduced schedule.',
         'Further reductions possible pending Authority review.'],
        ['Someone has written underneath, in pencil:',
         '\u201cThird year in a row isn\u2019t weather. Somebody should say that out loud.\u201d'],
      ],
    },
    {
      id: 'north_basin_survey_stakes', type: 'inspect', x: 10.5, y: 5.5, label: 'Survey stakes',
      pages: [
        ['A row of iron stakes driven into the mud, evenly spaced, each stamped with a number.'],
        ['WATER AUTHORITY SURVEY MARKER',
         'Do not remove, adjust, contradict, or reinterpret.'],
        ['A tag hangs from the nearest one:',
         'Reading logged. Next inspection: unscheduled.'],
      ],
    },
    {
      id: 'north_basin_tidegate_closure', type: 'inspect', x: 14.5, y: 8.5, label: 'Tidegate closure notice',
      pages: [
        ['A barred gate section blocks the path east, chained rather than locked \u2014 meant to be noticed, not necessarily to hold.'],
        ['TIDEGATE ROAD CLOSED TO PRIVATE PASSAGE',
         'Authorised personnel only. Sea-lock maintenance corridor.'],
        ['Smaller text beneath:',
         'Inquiries: District Waterworks, Drenwick.',
         'Do not request exceptions at this posting. None will be granted here.'],
      ],
    },
    {
      id: 'north_basin_unsafe_ground', type: 'inspect', x: 3.5, y: 9.5, label: 'Unsafe ground sign',
      pages: [
        ['A hand-lettered board, newer than the others, nailed to a stake at an angle.'],
        ['DRY GROUND IS NOT STABLE GROUND.',
         'Basin floor beyond the marked road has not been surveyed for load-bearing capacity.'],
        ['District Waterworks accepts no responsibility for parties proceeding past this point.'],
      ],
    },
  ],

  // ── The North Basin \u2014 Centre Reservoir signage (skeleton pass) ─────────
  NORTH_BASIN_C_MAP: [
    {
      id: 'north_basin_gauge_station', type: 'inspect', x: 4.5, y: 7.5, label: 'Gauge station',
      pages: [
        ['A graduated iron gauge post, sunk into the mud at the water\u2019s edge.'],
        ['WATER AUTHORITY GAUGE STATION 14',
         'Historical high-water line marked in red, well above the current surface.'],
        ['A logbook page is bolted to the post under glass, entries running back years.',
         'The most recent few are the only ones in a different, more recent hand.'],
      ],
    },
    {
      id: 'north_basin_mooring_post', type: 'inspect', x: 10.5, y: 10.5, label: 'Mooring post',
      pages: [
        ['A wooden mooring post, still upright, standing in dry cracked mud that was reservoir floor within living memory.'],
        ['The rope is still tied to it. Bleached pale. Frayed at the end that used to reach the water.'],
        ['Whoever tied it off did not plan on this being permanent.'],
      ],
    },
  ],

  // ── The North Basin \u2014 Badlands ───────────────────────────────────
  NORTH_BASIN_W_MAP: [
    {
      id: 'north_basin_fisher_hut', type: 'inspect', x: 10.5, y: 7.5, label: 'Fisher\u2019s hut',
      pages: [
        ['A fisher\u2019s hut leans toward the water, as if it expected the basin to come back for it.'],
        ['The door is shut but not locked. No smoke, no nets drying. Whoever worked this shore stopped coming a while ago.'],
      ],
    },
    {
      id: 'north_basin_reservoir_shore', type: 'inspect', x: 11.5, y: 11.5, label: 'Reservoir shore',
      pages: [
        ['The shore breaks unevenly here: mud, reeds, and dark reservoir water where the ground gives up.'],
        ['This is still the reservoir, not a canal \u2014 no dressed edge, no maintained bank. Just the basin, lower than it should be.'],
      ],
    },
    {
      id: 'north_basin_waterline_posts', type: 'inspect', x: 9.5, y: 4.5, label: 'Waterline posts',
      pages: [
        ['The old waterline is still visible on the posts. The basin has fallen far enough to make the hut look stranded.'],
        ['Someone notched the drop by hand, season after season. The last notch is well below your knee.'],
      ],
    },
    {
      id: 'north_basin_west_stakes', type: 'inspect', x: 1.5, y: 7.5, label: 'Warning stakes',
      pages: [
        ['The west road is choked off for now. Someone has made the old warning stakes very hard to ignore.'],
        ['UNSTABLE GROUND BEYOND. Below, in a steadier hand: \u201cThe mud looks solid. It isn\u2019t. Wait for the survey.\u201d'],
      ],
    },
  ],

  // \u2500\u2500 Drenwick \u2014 West Residential (quiet street, no NPCs yet) \u2500\u2500\u2500\u2500\u2500\u2500
  DRENWICK_WEST_RESIDENTIAL_MAP: [
    {
      id: 'drenwick_west_notice_board', type: 'inspect', x: 8.5, y: 4.5, label: 'Ward notice board',
      pages: [
        ['A district notice board, freshly repainted, fixed to a post at the corner.'],
        ['DRENWICK WEST RESIDENTIAL WARD',
         'Refuse collection: second and fourth day of each week.',
         'Structural concerns should be reported to the Civic Office promptly \u2014 do not wait for visible damage.'],
        ['Underneath, in a different hand:',
         '\u201cThey mean it about not waiting. Learned that one the hard way.\u201d'],
      ],
    },
    {
      id: 'drenwick_west_lost_cat', type: 'inspect', x: 7.5, y: 8.5, label: 'Lost cat notice',
      pages: [
        ['A smaller card pinned below the main board, hand-lettered.'],
        ['LOST: ONE GREY CAT, ANSWERS TO NOTHING IN PARTICULAR',
         'Answers to food, if you have it.',
         'Please knock at any door on this street. Someone here will know.'],
      ],
    },
  ],

  // \u2500\u2500 Drenwick \u2014 East Outskirts (edge of town, reeds creeping in) \u2500\u2500\u2500\u2500
  DRENWICK_EAST_OUTSKIRTS_MAP: [
    {
      id: 'drenwick_east_boundary_marker', type: 'inspect', x: 6.5, y: 2.5, label: 'Boundary marker',
      pages: [
        ['A stone boundary marker, half-sunk at the edge of the road.'],
        ['DRENWICK \u2014 CIVIC BOUNDARY',
         'Beyond this point: unincorporated ward land.',
         'Maintenance and lighting are not guaranteed past the marker.'],
        ['Faint tool-marks below the lettering \u2014 someone tried to move it once and gave up partway through.'],
      ],
    },
    {
      id: 'drenwick_east_drainage_notice', type: 'inspect', x: 10.5, y: 9.5, label: 'Drainage advisory',
      pages: [
        ['A weathered notice, half-swallowed by encroaching reeds.'],
        ['DRAINAGE ADVISORY \u2014 EASTERN WARD',
         'Water table irregular this season, consistent with reports from the northern basin district.',
         'Residents are asked to log any new standing water near foundations.'],
        ['Someone has underlined \u201cconsistent with reports from the northern basin district\u201d twice.'],
      ],
    },
  ],

  // \u2500\u2500 Drenwick \u2014 Waterfront (docks, no NPCs yet) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  DRENWICK_WATERFRONT_MAP: [
    {
      id: 'drenwick_waterfront_canal_notice', type: 'inspect', x: 7.5, y: 4.5, label: 'Canal schedule notice',
      pages: [
        ['A canal traffic notice, posted at the water\u2019s edge, ink starting to run in the damp.'],
        ['CANAL SCHEDULE \u2014 REDUCED SERVICE',
         'Basin water levels remain below seasonal average.',
         'Barge traffic continues on alternate days until further notice.'],
        ['A harbormaster\u2019s stamp at the bottom, half-legible:',
         '\u201cReviewed quarterly. Last review: unclear.\u201d'],
      ],
    },
    {
      id: 'drenwick_waterfront_drying_nets', type: 'inspect', x: 7.5, y: 11.5, label: 'Drying nets',
      pages: [
        ['A line strung between two posts, hung with drying nets.'],
        ['Whoever strung this expects to be back today.',
         'The nets are dry enough that they weren\u2019t.'],
      ],
    },
  ],

  // \u2500\u2500 South Ruins \u2014 floor 1 (no inscription content yet) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Marker placed near where descendToDungeon1() (world-transitions.js)
  // lands the player (7.5, 12.5) -- "near the entrance" from the player's
  // actual point of view on this floor, not the stairs-down tile at the
  // opposite end that leads further in.
  DUNGEON_MAP: [
    {
      id: 'south_ruins_floor1_marker', type: 'inspect', x: 5.5, y: 12.5, label: 'First-threshold carving',
      pages: [
        ['A shallow carving near the entrance, easy to miss in the dark.'],
        ['FIRST THRESHOLD',
         'Those who mapped this level numbered the floors as they went.',
         'The numbering does not continue past what they found on the third.'],
      ],
    },
  ],

  // \u2500\u2500 South Ruins \u2014 floor 6 (ties into Fen Shade's own observed lore: it
  // "seeped down from the wetlands above through the drainage cracks") \u2500\u2500
  DUNGEON6_MAP: [
    {
      id: 'south_ruins_floor6_seep_mark', type: 'inspect', x: 3.5, y: 6.5, label: 'Damp stain',
      pages: [
        ['A dark stain runs down the wall here, following a crack toward the floor.'],
        ['The stone is damp to the touch, though nothing overhead should be able to reach this deep.'],
        ['Whatever seeped down through here did not come from a normal source of water.'],
      ],
    },
  ],
};

// Evaluates a feature's `condition`, safely -- a throwing condition is
// treated as "not met" (never crashes movement/interact) and reported once
// per feature via console.warn so it's visible during development without
// spamming every frame a trigger zone is re-checked.
const _mapFeatureConditionWarned = new Set();
function evaluateMapFeatureCondition(feature) {
  if (!feature.condition) return true;
  try {
    return !!feature.condition();
  } catch (e) {
    if (!_mapFeatureConditionWarned.has(feature.id)) {
      console.warn('[MAP_FEATURES] condition() threw for feature "' + feature.id + '":', e);
      _mapFeatureConditionWarned.add(feature.id);
    }
    return false;
  }
}

// Resolves a feature's displayable pages, safely -- `pages` may be a plain
// array or a () => array function (for dynamic text); a throwing function
// is treated the same as "no pages" rather than crashing.
function resolveMapFeaturePages(pages, featureId) {
  if (typeof pages !== 'function') return pages || null;
  try {
    return pages() || null;
  } catch (e) {
    console.warn('[MAP_FEATURES] pages() threw for feature "' + featureId + '":', e);
    return null;
  }
}

// Looks up the current map's feature list via mapRegistryId() (the same id
// MAP_METADATA/MAP_REGISTRY/the debug inspector already use), not a raw map
// name -- this is what makes MAP_FEATURES work unchanged for any future
// map wired into that registry, not just the maps it happens to list today.
function currentMapFeatures() {
  if (typeof MAP_FEATURES === 'undefined' || typeof mapRegistryId !== 'function') return null;
  const mapId = mapRegistryId(activeMap);
  return mapId ? (MAP_FEATURES[mapId] || null) : null;
}

// Checks 'inspect' features on the current map; returns true and opens
// dialogue if one is near the player (and facing-matched, if required) and
// its condition (if any) passes. Called from the tail of handleInteract(),
// after every higher-priority interaction (NPCs, chests, quest objects,
// point transitions, other scripted content) has already had a chance to
// consume the press -- see handleInteract()'s own comment on why a plain
// `!dialogue.open` check there is sufficient to guarantee that ordering
// without restructuring the rest of that function.
function tryMapFeatures() {
  const features = currentMapFeatures();
  if (!features) return false;

  for (const feature of features) {
    if (feature.type !== 'inspect') continue;

    const conditionMet = evaluateMapFeatureCondition(feature);
    if (!conditionMet && !feature.fallbackPages) continue;

    const radius = feature.radius !== undefined ? feature.radius : TALK_RADIUS;
    if (!nearPlayer(feature.x * TILE, feature.y * TILE, radius)) continue;
    if (feature.facing && player.facing !== feature.facing) continue;

    const seen = feature.onceFlag ? !!window[feature.onceFlag] : false;
    let pages;
    if (seen) {
      pages = feature.repeatPages ? resolveMapFeaturePages(feature.repeatPages, feature.id) : null;
    } else if (!conditionMet) {
      pages = resolveMapFeaturePages(feature.fallbackPages, feature.id);
    } else {
      pages = resolveMapFeaturePages(feature.pages, feature.id);
      if (pages && feature.onceFlag) window[feature.onceFlag] = true;
    }

    // This IS the matching feature for the player's position (map + coords
    // + facing all satisfied) -- consume the interact press either way, so
    // a second, overlapping feature can't also fire from the same press,
    // even on a "seen, no repeatPages" or "condition false, no fallback"
    // no-op outcome.
    if (pages) openDialogue(feature.name || '', pages);
    return true;
  }
  return false;
}

// Checks 'trigger' zones on the current map; opens dialogue on the frame
// the player's tile position transitions from outside a zone to inside it
// (not every frame spent standing inside one -- see the `_wasInside`
// per-feature runtime flag below, which is transient/unsaved state, not
// part of the save schema). Called from the tail of movement.js's update(),
// inside the same `if (player.moving)` block the encounter roll and item-
// pickup checks already live in, and gated the same way tryMapFeatures()
// is: only when nothing else already opened dialogue this frame.
function checkMapFeatureTriggers() {
  const features = currentMapFeatures();
  if (!features) return;

  const tx = player.x / TILE, ty = player.y / TILE;
  for (const feature of features) {
    if (feature.type !== 'trigger') continue;
    const r = feature.rect;
    if (!r) continue;

    const inside = tx >= r.x1 && tx <= r.x2 && ty >= r.y1 && ty <= r.y2;
    const wasInside = !!feature._wasInside;
    feature._wasInside = inside;
    if (!inside || wasInside) continue; // only fire on the outside -> inside transition

    if (!evaluateMapFeatureCondition(feature)) continue;

    const seen = feature.onceFlag ? !!window[feature.onceFlag] : false;
    if (seen && !feature.repeatPages) continue;

    const pages = resolveMapFeaturePages(seen ? feature.repeatPages : feature.pages, feature.id);
    if (!pages) continue;

    if (!seen && feature.onceFlag) window[feature.onceFlag] = true;
    openDialogue(feature.name || '', pages);
    if (dialogue.open) return; // don't let a second overlapping zone fire the same frame
  }
}

// Debug-only summary for the debug map inspector (render-ui.js's
// drawDebugInspector()): how many MAP_FEATURES exist on the current map,
// the nearest in-range 'inspect' feature (if any), and the 'trigger' zone
// the player is currently standing inside (if any). Read-only -- never
// mutates _wasInside or onceFlag state, so opening the inspector overlay
// can't itself affect trigger-zone firing.
function debugMapFeatureInfo() {
  const features = currentMapFeatures();
  if (!features) return { count: 0, nearbyInspect: null, activeTrigger: null };

  const tx = player.x / TILE, ty = player.y / TILE;
  let nearbyInspect = null;
  let activeTrigger = null;

  for (const feature of features) {
    if (feature.type === 'inspect' && !nearbyInspect) {
      const radius = feature.radius !== undefined ? feature.radius : TALK_RADIUS;
      if (nearPlayer(feature.x * TILE, feature.y * TILE, radius)) {
        nearbyInspect = {
          id: feature.id,
          label: feature.label || feature.id,
          onceFlag: feature.onceFlag || null,
          seen: feature.onceFlag ? !!window[feature.onceFlag] : null,
        };
      }
    } else if (feature.type === 'trigger' && !activeTrigger && feature.rect) {
      const r = feature.rect;
      if (tx >= r.x1 && tx <= r.x2 && ty >= r.y1 && ty <= r.y2) {
        activeTrigger = {
          id: feature.id,
          label: feature.label || feature.id,
          onceFlag: feature.onceFlag || null,
          seen: feature.onceFlag ? !!window[feature.onceFlag] : null,
        };
      }
    }
  }

  return { count: features.length, nearbyInspect, activeTrigger };
}


// ─── Dreams ───────────────────────────────────────────────────────────────────
// Shown after resting in the player's own bed when day % 7 === 3.
// Rotates by Math.floor(day / 7) % DREAMS.length — one new dream per week.
const DREAMS = [
  [
    ['You are standing in a field.', 'The grass is very tall.'],
    ['Someone is walking away from you across it.',
     'You call out.', 'No sound comes.'],
    ['You wake.'],
  ],
  [
    ['The office.', 'Empty.', 'Every cabinet open.'],
    ['Someone has already taken everything.'],
    ['You are not sure how long ago.'],
    ['You wake.'],
  ],
  [
    ['A canal.', 'The water runs the wrong direction.'],
    ['You stand on the bank and watch it for a long time.'],
    ['Partway through, you notice you are not alone.'],
    ['You look.', 'You wake before you see.'],
  ],
  [
    ['You are at your own door.', 'The light is on inside.'],
    ['You don\u2019t remember leaving it on.'],
    ['You stand on the step for a long time.', 'Eventually you go in.'],
    ['Nothing is wrong.', 'Nothing is out of place.'],
    ['That doesn\u2019t help.'],
    ['You wake.'],
  ],
  [
    ['The cat is sitting in the middle of the room,', 'looking at a wall.'],
    ['You follow its gaze.', 'There is nothing there.'],
    ['You look back.', 'The cat is gone.'],
    ['You wake.'],
  ],
  [
    ['You are standing below the waterline.', 'Looking up through the gate.'],
    ['The water is perfectly still.',
     'You cannot tell which side of it you are on.'],
    ['You wake.'],
  ],
];

// ─── Supervisor interaction ───────────────────────────────────────────────────
function interactSupervisor() {
  dialogue.name = 'Supervisor';
  dialogue.open = true;
  dialogue.page = 0;

  // ── Letter from Netto (one-time delivery, day > 6) ──────────────────────────
  if (day > 6 && !netto_letter_received) {
    dialogue.pages = [
      // Supervisor's introduction
      ['He holds up a folded envelope without looking away from his ledger.',
       '\u201cCame through district post three days ago.',
       'Your name on it.',
       'Halcyra stamp.\u201d',
       'He sets it on the edge of the desk.',
       '\u201cPersonal correspondence. Not my department.\u201d'],

      // Letter — salutation + postal complaint
      [stats.name + ' \u2014',
       'Hope this reaches you. Post from the capital',
       'has been slow \u2014 they\u2019ve reorganised the',
       'sorting office again. Third time this fiscal',
       'year. Someone on the floor calls it an',
       'efficiency measure. I don\u2019t question those.'],

      // Letter — Netto himself
      ['I\u2019m doing well enough. Work is fine.',
       'They moved me to correspondence review',
       'last month, which means I now spend the',
       'day reading other people\u2019s letters and',
       'deciding whether to forward them.',
       'I\u2019m aware of the irony in writing to you',
       'to tell you this.'],

      // Letter — stepdad's knees
      ['Stepdad\u2019s knees are the same.',
       'He says \u201cmanaging.\u201d',
       'He has been saying \u201cmanaging\u201d since at',
       'least the year you left, possibly longer.',
       'I\u2019ve started to think \u201cmanaging\u201d is just',
       'the word knees use for themselves now.'],

      // Letter — stepdad's depot + the eat properly clause
      ['He\u2019s still going in to the depot three',
       'days a week. They don\u2019t technically need',
       'him anymore but no one has said so to',
       'his face, and he seems content.',
       'He sends his regards. He also asks you',
       'to eat properly. He said to include that',
       'twice. I\u2019ve included it once and will',
       'exercise my editorial discretion on the second.'],

      // Letter — weather
      ['The weather here has been mild.',
       'We had four consecutive days of light rain',
       'last week, which people in the capital',
       'discussed with the energy usually reserved',
       'for festivals. I attended a gathering where',
       'the main topic was whether this year\u2019s rain',
       'was heavier than last year\u2019s rain.',
       'No consensus was reached. We stayed anyway.'],

      // Letter — grain accounting book
      ['I\u2019m about three quarters of the way through',
       'The Practical Administrator\u2019s Guide to',
       'Maritime Grain Accounting, which I know',
       'sounds tedious and mostly is, but chapter',
       'four \u2014 moisture variance in coastal storage',
       '\u2014 kept me reading past the second bell.',
       'Twice. Chapter five is about forms.',
       'There are eight forms.',
       'I have not forgiven chapter five.'],

      // Letter — A Season in the Provinces
      ['The other book everyone here is reading is',
       'A Season in the Provinces.',
       'It\u2019s a novel about a man from Halcyra who',
       'takes an administrative posting in a quiet',
       'rural town and finds it peaceful and slightly',
       'dull. It was a bestseller last spring.',
       'I cannot explain why it appealed to people',
       'in the capital. No one I\u2019ve asked can either.'],

      // Letter — jokes + Henris
      ['Joke from the office: why did the census',
       'clerk sit outside? He wanted to count',
       'fresh air. I told this to Henris from',
       'Processing. He nodded once.',
       'I\u2019m choosing to interpret that as laughter.',
       'Another one: what do you call a grain',
       'inspector who also reads poetry?',
       'Optimistic. Henris nodded at that one too.',
       'He is a man of measured enthusiasm.'],

      // Letter — sign-off
      ['Write when you get a chance. Or don\u2019t \u2014',
       'I know how postings go. Things get busy,',
       'then they get quiet, and sometimes you',
       'forget what day it is.',
       'That\u2019s fine.',
       'Stay warm. Eat properly.',
       '(That one\u2019s from me, not stepdad.',
       'I\u2019ve absorbed it by now.)',
       '\u2014 Netto'],
    ];
    dialogue.callbacks = [function () {
      netto_letter_received = true;
      stats.items.push({ name: 'Letter from Netto', type: 'accessory', bonus: 0, price: 0, questItem: true });
      syncQuestFlagsToWindow();
    }];
    return;
  }

  if (!sluice_job_started) {
    dialogue.pages = [
      ['\u201cInvestigator ' + stats.name + '.', 'There\u2019s a discrepancy in the East Sluice.'],
      ['Flow readings are off at the west gate.', 'Go and have a look. Routine inspection.\u201d'],
      ['\u201cBefore you head out \u2014 you\u2019ll need a kit.\u201d',
       'He writes something on a chit and holds it out.',
       '\u201cRequisition slip. Aldric handles issue. Get it from him before you go.\u201d'],
    ];
    dialogue.callbacks = [function() {
      sluice_job_started      = true;
      equipment_ticket_ready  = true;
      syncQuestFlagsToWindow();
    }];
  } else if (sluice_job_started && !sluice_fixed) {
    dialogue.pages = [
      ['\u201cWest gate, East Sluice.', 'Report back once you\u2019ve had a look.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (sluice_fixed && !sluice_pay_ticket_ready && !sluice_reward_given) {
    dialogue.pages = [
      ['\u201cDebris blockage. Noted.\u201d'],
      ['\u201cStandard clearance rate applies.', 'I\u2019ve issued a pay ticket.\u201d'],
      ['\u201cSpeak to Petra.', 'She\u2019ll process it.\u201d'],
    ];
    dialogue.callbacks = [function() { sluice_pay_ticket_ready = true; }];
  } else if (sluice_pay_ticket_ready && !sluice_reward_given) {
    dialogue.pages = [
      ['\u201cTicket\u2019s with Petra.', 'She\u2019ll sort you out.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (sluice_reward_given && !dispatch_quest_started) {
    dialogue.pages = [
      ['\u201cInvestigator ' + stats.name + '.',
       'The sluice report came back clean.',
       'Blockage, no structural fault.',
       'You handled it correctly.\u201d'],
      ['\u201cI have a letter for the district office in Drenwick.',
       'Routine correspondence \u2014 but it needs to be hand-delivered.\u201d'],
      ['\u201cTake the road east. Stay on the road.\u201d',
       '\u201cThere are ruins south of the path.',
       'Bandit activity, and something else besides.',
       'The kind of something you don\u2019t walk away from.\u201d'],
      ['\u201cFind the district office.',
       'Ask for Officer Veth.',
       'Hand it to him directly.',
       'Come back when it\u2019s done.\u201d'],
    ];
    dialogue.callbacks = [function() {
      dispatch_quest_started = true;
      stats.items.push({ name: 'Dispatch Letter', type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true });
      syncQuestFlagsToWindow();
      refreshJobBoard();
    }];
  } else if (dispatch_quest_started && !dispatch_delivered) {
    dialogue.pages = [
      ['\u201cDrenwick district office. Officer Veth.',
       'You have the letter. Get it there.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (dispatch_delivered && !dispatch_pay_ticket_ready && !dispatch_rewarded) {
    dialogue.pages = [
      ['\u201cDelivered.\u201d',
       'He makes a note without looking up.'],
      ['\u201cSeventy-five gold, official transit rate.',
       'I\u2019ve issued a pay ticket.',
       'Speak to Petra.\u201d'],
    ];
    dialogue.callbacks = [function() {
      dispatch_pay_ticket_ready = true;
      syncQuestFlagsToWindow();
      refreshJobBoard();
    }];
  } else if (dispatch_pay_ticket_ready && !dispatch_rewarded) {
    dialogue.pages = [
      ['\u201cTicket\u2019s with Petra.', 'She\u2019ll sort you out.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (dispatch_rewarded && !fort_quest_started) {
    dialogue.pages = [
      ['\u201cDrenwick confirmed receipt.\u201d',
       '\u201cHarrow\u2019s office processed it the same day.',
       'That\u2019s faster than the last three dispatches combined.\u201d'],
      ['\u201cInvestigator ' + stats.name + '.', 'There\u2019s a post on the fen road I can\u2019t account for.'],
      ['South of Drenwick. Off the main approach.', 'No station number in the ledgers. No patrol roster on record.\u201d'],
      ['\u201cGo and have a look.', 'Don\u2019t announce yourself ahead of time.'],
      ['\u201cIf it turns out to be a clerical error, fine.', 'If it doesn\u2019t\u2014 report what you find.\u201d'],
    ];
    dialogue.callbacks = [function() { fort_quest_started = true; syncQuestFlagsToWindow(); }];
  } else if (fort_quest_stage >= 4 && fort_quest_stage < 6) {
    // Player has resolved the fort — offer reporting choice
    dialogue.pages = [
      ['\u201cInvestigator.\u201d',
       'He closes the ledger.'],
      ['\u201cThe fen post.',
       'What did you find?\u201d'],
    ];
    dialogue.callbacks = [function() {
      choice.title = 'Supervisor';
      choice.options = ['Report what I found', 'Found nothing'];
      choice.cursor = 0;
      choice.callbacks = [
        function report() {
          const fought = fort_quest_stage === 4;
          dialogue.name = 'Supervisor';
          dialogue.pages = fought
            ? [
                ['\u201cA smuggling front.\u201d',
                 'He writes something brief in the ledger without looking up.'],
                ['\u201cThree operatives.\u201d',
                 '\u201cYou handled it yourself.\u201d'],
                ['\u201cI won\u2019t ask how.',
                 'The post will be flagged for district review.',
                 'It\u2019s not your concern anymore.\u201d'],
                ['\u201cPolwick, though \u2014 that\u2019s a name I recognize.\u201d',
                 'He sets down his pen.',
                 '\u201cRegistered rareborn. Empire employed, same as half the edge posts out this way.\u201d'],
                ['\u201cMust have been running the smuggling on the side.',
                 'Or the drought\u2019s made the honest pay not worth the trouble.\u201d',
                 'A dry look.',
                 '\u201cEither way \u2014 inefficiency\u2019s no excuse for self-dealing.\u201d'],
                ['\u201cTwo hundred gold.',
                 'I\u2019ve issued a pay ticket.',
                 'Speak to Petra.\u201d'],
              ]
            : [
                ['\u201cA smuggling front.\u201d',
                 'He makes a note.'],
                ['\u201cYou let them go.\u201d',
                 'He doesn\u2019t look up.',
                 '\u201cUnregistered. Operating under Imperial cover.\u201d'],
                ['\u201cPolwick, though \u2014 that\u2019s a name I recognize.\u201d',
                 'He sets down his pen.',
                 '\u201cRegistered rareborn. Empire employed, same as half the edge posts out this way.\u201d'],
                ['\u201cMust have been running the smuggling on the side.',
                 'Or the drought\u2019s made the honest pay not worth the trouble.\u201d',
                 'A dry look.',
                 '\u201cInefficiency\u2019s no excuse for self-dealing.',
                 'District will sort out which it was.\u201d'],
                ['\u201cI\u2019ll forward it to the district office.',
                 'That\u2019s above my authority now.',
                 'Above yours too.\u201d'],
                ['\u201cTwo hundred gold for the report.',
                 'I\u2019ve issued a pay ticket.',
                 'Speak to Petra.\u201d'],
              ];
          dialogue.callbacks = [function() {
            fort_quest_stage = 6;
            fort_pay_ticket_ready = true;
            if (!smugglers_dead) smugglers_execution_day = day + 5;
            syncQuestFlagsToWindow();
            refreshJobBoard();
          }];
          dialogue.open = true;
          dialogue.page = 0;
        },
        function foundNothing() {
          fort_quest_stage        = 6;
          fort_pay_ticket_ready   = true;
          fort_pay_ticket_reduced = true;
          syncQuestFlagsToWindow();
          refreshJobBoard();
          dialogue.name = 'Supervisor';
          dialogue.pages = [
            ['\u201cNothing.\u201d',
             'He holds your gaze for a moment.'],
            ['\u201cClerical error, then.',
             'I\u2019ll mark it resolved.\u201d',
             'He doesn\u2019t sound convinced.'],
            ['He goes back to the ledger without looking up.',
             '\u201cFifteen gold for the trip.',
             'I\u2019ve issued a pay ticket.',
             'Speak to Petra.\u201d'],
          ];
          dialogue.open = true;
          dialogue.page = 0;
        },
      ];
      choice.open = true;
    }];
  } else if (fort_quest_stage === 6) {
    dialogue.pages = [
      ['\u201cThe fen post is logged.',
       'District\u2019s handling it from here.\u201d'],
    ];
    dialogue.callbacks = null;
  } else {
    dialogue.pages = [
      ['\u201cThat post south of Drenwick.', 'Have you looked into it yet?\u201d'],
    ];
    dialogue.callbacks = null;
  }
}

// ─── Smuggler fort interaction ────────────────────────────────────────────────
function interactSmugglerFort() {
  if (fort_quest_stage === 0) {
    // Polwick confrontation — triggers when near his position (col 7 row 4)
    const px = player.x - 7.5 * TILE;
    const py = player.y - 4.5 * TILE;
    if (Math.sqrt(px * px + py * py) < TALK_RADIUS) {
      dialogue.name = 'Polwick';
      dialogue.pages = [
        ['A broad man in a grey coat looks up from a table spread with ledgers.'],
        ['\u201cYou\u2019re not one of mine.\u201d',
         'He doesn\u2019t move. His voice is flat and careful.'],
        ['\u201cSo either you\u2019re lost,\u201d he says,',
         '\u201cor you came looking for something.',
         'Which is it?\u201d'],
      ];
      dialogue.callbacks = [function() {
        choice.title   = 'Polwick';
        choice.options = ['Make an arrest', 'Leave them be'];
        choice.cursor  = 0;
        choice.callbacks = [
          function arrest() {
            fort_quest_stage = 1;
            syncQuestFlagsToWindow();
            dialogue.name  = 'Polwick';
            dialogue.pages = [
              ['\u201cAn investigator.\u201d',
               'He sets down the ledger slowly.',
               '\u201cI thought you might be.\u201d'],
              ['\u201cGuard.\u201d'],
            ];
            dialogue.triggerFortGuardCombat = true;
            dialogue.open = true;
            dialogue.page = 0;
          },
          function leave() {
            fort_quest_stage = 5;
            syncQuestFlagsToWindow();
            dialogue.name  = 'Polwick';
            dialogue.pages = [
              ['\u201cSmart.\u201d',
               'He goes back to his ledger.',
               '\u201cWe were never here.\u201d'],
            ];
            dialogue.open = true;
            dialogue.page = 0;
          },
        ];
        choice.open = true;
      }];
      dialogue.open = true;
      dialogue.page = 0;
      return;
    }
  }
  // Retry — fleeing or losing a fight leaves fort_quest_stage stuck mid-
  // sequence (1: guard, 2: Polwick, 3: Essa). The relevant opponent stays
  // put and re-engages on approach, same proximity-retrigger pattern as the
  // Briar Warden / Den Wraith fights.
  if (fort_quest_stage === 1) {
    const gx = player.x - 6.5 * TILE;
    const gy = player.y - 9.5 * TILE;
    if (Math.sqrt(gx * gx + gy * gy) < TALK_RADIUS) {
      dialogue.name  = '';
      dialogue.pages = [['The guard hasn\u2019t moved from the door.', 'He doesn\u2019t look inclined to let this go.']];
      dialogue.triggerFortGuardCombat = true;
      dialogue.open  = true;
      dialogue.page  = 0;
      return;
    }
  } else if (fort_quest_stage === 2) {
    const px = player.x - 7.5 * TILE;
    const py = player.y - 4.5 * TILE;
    if (Math.sqrt(px * px + py * py) < TALK_RADIUS) {
      dialogue.name  = '';
      dialogue.pages = [['Polwick is still on his feet.', 'He doesn\u2019t look like a man who considers this settled.']];
      dialogue.triggerFortPolwickCombat = true;
      dialogue.open  = true;
      dialogue.page  = 0;
      return;
    }
  } else if (fort_quest_stage === 3) {
    const ex = player.x - 9.5 * TILE;
    const ey = player.y - 6.5 * TILE;
    if (Math.sqrt(ex * ex + ey * ey) < TALK_RADIUS) {
      dialogue.name  = '';
      dialogue.pages = [['Essa is still between you and the door.', 'She\u2019s not going to ask twice.']];
      dialogue.triggerFortEssaCombat = true;
      dialogue.open  = true;
      dialogue.page  = 0;
      return;
    }
  }
  interactSimpleNPCs();
}

// ─── Encounter handlers (pilot) ───────────────────────────────────────────────
// Maps dialogue.triggerEncounter.id → the function that starts that combat.
// Each handler must call the same start* function used by the legacy trigger path.
// Add entries here as fights are migrated away from individual trigger flags.
const ENCOUNTER_HANDLERS = {
  kolm_brawler: function() { startSailorBrawlCombat(); },
};

// ─── Main interaction handler ─────────────────────────────────────────────────
function handleInteract() {
  if (menu.open || shop.open) return;
  if (dialogue.open) {
    dialogue.page++;
    if (dialogue.page >= dialogue.pages.length) {
      dialogue.open = false;
      dialogue.page = 0;
      if (dialogue.callbacks) {
        const cb = dialogue.callbacks.shift();
        if (cb) cb();
        if (dialogue.callbacks.length === 0) dialogue.callbacks = null;
      }
      if (dialogue.triggerBossCombat) {
        dialogue.triggerBossCombat = false;
        startBossCombat();
      }
      if (dialogue.triggerWardenCombat) {
        dialogue.triggerWardenCombat = false;
        startWardenCombat();
      }
      if (dialogue.triggerFortGuardCombat) {
        dialogue.triggerFortGuardCombat = false;
        startFortGuardCombat();
      }
      if (dialogue.triggerFortPolwickCombat) {
        dialogue.triggerFortPolwickCombat = false;
        startFortPolwickCombat();
      }
      if (dialogue.triggerFortEssaCombat) {
        dialogue.triggerFortEssaCombat = false;
        startFortEssaCombat();
      }
      if (dialogue.triggerMulhollandCombat) {
        dialogue.triggerMulhollandCombat = false;
        startMulhollandCombat();
      }
      if (dialogue.triggerDenWraithCombat) {
        dialogue.triggerDenWraithCombat = false;
        startDenWraithCombat();
      }
      if (dialogue.triggerEncounter) {
        const enc = dialogue.triggerEncounter;
        dialogue.triggerEncounter = null;
        if (ENCOUNTER_HANDLERS[enc.id]) {
          ENCOUNTER_HANDLERS[enc.id]();
        } else {
          console.warn('[triggerEncounter] no handler for id "' + enc.id + '"');
        }
      }
      if (dialogue.triggerTakomoCombat) {
        dialogue.triggerTakomoCombat = false;
        startTakomoCombat();
      }
    }
    return;
  }

  if (inDungeon && dungeonFloor === 1) {
    // Chest: open it if adjacent and not yet opened
    if (!DUNGEON_CHEST.opened) {
      const cx = player.x - DUNGEON_CHEST.x;
      const cy = player.y - DUNGEON_CHEST.y;
      if (Math.sqrt(cx * cx + cy * cy) < TALK_RADIUS) {
        DUNGEON_CHEST.opened = true;
        const it = DUNGEON_CHEST.item;
        if (hasStatusEffect('cursed')) {
          dialogue.name  = '';
          dialogue.pages = [['You yank the latch too hard.', `The ${it.name} flies out and shatters on the stone floor.`, 'Pieces everywhere. It\u2019s ruined.']];
        } else {
          stats.items.push({ name: it.name, type: it.type, bonus: it.bonus, price: it.price });
          dialogue.name  = '';
          dialogue.pages = [['Chest opened.', `${it.name}  (${itemStatLabel(it)})  \u2014 added to items.`]];
        }
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
    }
    // Alcove chest: hidden behind the false wall on the left side of the main hall
    if (!DUNGEON_ALCOVE_CHEST.opened) {
      const acx = player.x - DUNGEON_ALCOVE_CHEST.x;
      const acy = player.y - DUNGEON_ALCOVE_CHEST.y;
      if (Math.sqrt(acx * acx + acy * acy) < TALK_RADIUS) {
        DUNGEON_ALCOVE_CHEST.opened = true;
        const it = DUNGEON_ALCOVE_CHEST.item;
        if (hasStatusEffect('cursed')) {
          dialogue.name  = '';
          dialogue.pages = [['You yank the latch too hard.', `The ${it.name} flies out and shatters on the stone floor.`, 'Pieces everywhere. It\u2019s ruined.']];
        } else {
          stats.items.push({ name: it.name, type: it.type, bonus: it.bonus, price: it.price });
          dialogue.name  = '';
          dialogue.pages = [['Chest opened.', `${it.name}  (${itemStatLabel(it)})  \u2014 added to items.`]];
        }
        dialogue.open = true;
        dialogue.page = 0;
        return;
      }
    }
    // Briar Warden encounter — side quest, triggered on proximity
    if (warden_quest_started && !warden_quest_defeated) {
      const wx = player.x - BRIAR_WARDEN_SPAWN.x;
      const wy = player.y - BRIAR_WARDEN_SPAWN.y;
      if (Math.sqrt(wx * wx + wy * wy) < TALK_RADIUS) {
        dialogue.name  = '';
        dialogue.pages = [
          ['The Briar Warden turns toward you.', 'It does not back down.'],
        ];
        dialogue.triggerWardenCombat = true;
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
    }
    interactSimpleNPCs();
  } else if (!inDungeon) {
    // ── MAP_N2: north approach to Drenwick — gate sealed, road a dead end ───
    // The bridge crosses from MAP_N1 into MAP_N2, but there is no gate into
    // Drenwick from this side yet. Pressing Space near the wall explains why.
    if (activeMap === MAP_N2) {
      if (nearPlayer(7.5 * TILE, 8.5 * TILE, TALK_RADIUS * 2)) {  // row 8 — the city wall face
        openDialogue('', [
          ['The north gate of Drenwick is sealed.',
           'Heavy timber doors, chain threaded through the handles, padlocked.',
           'The lock is not a new one.',
           'The chain has rusted to the wood in places.'],
          ['A notice is tacked above the handles, printed on district stationery.',
           'NORTH GATE \u2014 SUSPENDED.',
           'This approach is not in service.',
           'For transit enquiries, see the district office.'],
          ['Underneath, in cramped handwriting:',
           '\u201cRoad runs north from the bridge for about two miles then stops.',
           'Not a wall, not a cliff. Just stops.',
           'I don\u2019t know why either. \u2014 W.\u201d'],
        ]);
        return;
      }
    }
    // ── Thornmere Standing Stone (MAP4 — Thornmere) ─────────────────────────
    if (activeMap === MAP4) {
      const sdx = player.x - THORNMERE_STONE.x;
      const sdy = player.y - THORNMERE_STONE.y;
      if (Math.sqrt(sdx * sdx + sdy * sdy) < TALK_RADIUS) {
        choice.title   = 'Standing Stone';
        choice.options = ['Read the inscription', 'Leave it'];
        choice.cursor  = 0;
        choice.callbacks = [
          function readStone() {
            dialogue.name  = '';
            dialogue.pages = [
              [
                'Upon the final shore, where the black sea gnawed at the bones of the world,',
                'the last champions of mankind gathered beneath a sky that no longer belonged',
                'to them — for the Sky Dynasties had come, and they did not come in peace.'
              ],
              [
                'For long years humanity had raised armies and sent them screaming into the',
                'dark. For long years the Sky Dynasties had laughed. The earth itself grew',
                'tired of burying the dead.'
              ],
              [
                'There was a warrior among men called DeRozan who had carried the burden',
                'longer than most could bear. He had bled for his people, and they had loved',
                'him, and still the darkness had not retreated. It was time for another way.'
              ],
              [
                'The elders of the great city of Toronto — golden city on the inland sea,',
                'whose towers caught the light of a sun they feared they might lose — convened',
                'in the high chamber and spoke of desperate measures.'
              ],
              [
                '"We cannot win this war with those who love us,"',
                'said the eldest, her voice worn smooth as river stone.',
                '"We must find one who does not need to."'
              ],
              [
                'And so they sent out the call across every road and sea-lane, into the',
                'wilderness beyond maps, and in time there came to them a figure who walked',
                'out of the western mist as though he had always been there.'
              ],
              [
                'He was called Leonard of the Mercenary Path. He did not smile. His eyes were',
                'deep-space mirrors — they reflected everything and revealed nothing. His hands',
                'were forged in dead stellar furnaces.'
              ],
              [
                'He was the largest thing in any room that had ever contained him,',
                'and yet he moved without sound, without ceremony, without the slightest',
                'acknowledgment that the world found him remarkable.'
              ],
              [
                'The covenant: One year. One campaign. One chance for mankind.',
                'Leonard would lead the Last Company into battle against the Sky Dynasties.',
                'He asked for nothing. He promised nothing. He simply nodded, and it was done.'
              ],
              [
                'The Last Company assembled around him — Lowry the Indomitable, who had',
                'fought in every hall; Siakam the Risen, who had come from nothing and become',
                'terrible; Gasol the Anchor, whose wisdom held the line when all else failed.'
              ],
              [
                'And with them: Ibaka the Immovable, who had turned back armies at the gate;',
                'VanVleet who had never been chosen and had chosen himself instead;',
                'and Green, who was chaos made purposeful and fury made precise.'
              ],
              [
                'Their first great trial came in Philadelphia, city of brotherly pride,',
                'where the Embiid-clan and their kin believed themselves the destined inheritors',
                'of the age. They were large and righteous and very sure of themselves.'
              ],
              [
                'There came a moment — the moment the songs remember most — when the battle',
                'hung suspended between one world and the next. The Holy Sphere, launched by',
                'Leonard himself from the furthest reach of his mortal arm, struck the iron',
                'rim of fate once.'
              ],
              [
                'Then again. Then again. Then a fourth time.',
                'And on the fourth strike it fell through, and Philadelphia fell with it,',
                'and the crowd stood in silence for the first time in their lives.',
                'Even time itself seemed to pause to consider what had just occurred.'
              ],
              [
                'Then came Milwaukee, where the Antlered Titan stood — Giannis, monster of',
                'the northern marches, who had never known defeat and could not conceive of it.',
                'He was singular and enormous and the world bent slightly in his direction.'
              ],
              [
                'But Leonard had not come to be impressed. He had come to win.',
                'And behind him, the Wall formed — Lowry and Ibaka and Gasol standing',
                'shoulder to shoulder, refusing every inch, grinding the Titan\'s advances',
                'to powder until at last Milwaukee fell silent.'
              ],
              [
                'The final trial: the Alien Hordes from the western coast — the Golden State',
                'Warriors, who had unmade three generations of challengers. They arrived',
                'trailing glory and assumption, certain that history belonged to them.',
                'They were not entirely wrong. They had Durant, who was a force of nature.',
              ],
              [
                'They had Curry, whose gifts were inexplicable and possibly divine.',
                'They had Thompson, who could vanish for an hour and then destroy everything',
                'in thirty seconds. They had Green, whose mouth was a weapon they had perhaps',
                'never learned to fully control.'
              ],
              [
                'The series was long and it was brutal and there were moments when humanity\'s',
                'candle guttered. Durant fell in battle. Thompson fell. And still the Hordes',
                'pushed forward, because they had not lost in so long they had forgotten how.'
              ],
              [
                'But Toronto did not break. VanVleet, who had never been chosen, chose himself',
                'so loudly the rafters shook. Siakam was relentless. Lowry bled for every inch.',
                'And Leonard — Leonard simply continued to do what Leonard did,',
                'which was everything, and all of it with that same terrible calm.'
              ],
              [
                'On the final night, in the house of their enemies, with the whole of mankind',
                'watching from a thousand years of exhaustion, the Last Company prevailed.',
                'The Sky Dynasties did not kneel — they did not know how — but they retreated.',
                'And that was enough.'
              ],
              [
                'Humanity survived. The stars themselves seemed to exhale.',
                'The golden city on the inland sea erupted into a joy so vast it became',
                'indistinguishable from disbelief. People wept in the streets, not because',
                'they were sad, but because they had forgotten what it felt like to win.'
              ],
              [
                'They offered Leonard everything: feasts, titles, lands, a seat among the',
                'council of elders, a statue in the grand plaza, whatever form of permanence',
                'he desired. He declined it all. No feast could bind him.',
                'No city could hold him. The covenant had been fulfilled.'
              ],
              [
                'He walked back into the western mist from which he had come,',
                'and was not seen again in Toronto.',
                '',
                '"Ha. Ha. Ha. Ha."',
                '',
                'Thus mankind was granted another million years.'
              ],
            ];
            dialogue.open  = true;
            dialogue.page  = 0;
          },
          function leave() {},
        ];
        choice.open = true;
        return;
      }
    }
    if (inSluice) {
      const sluiceChests = sluiceFloor === 1 ? [SLUICE_CHEST]
                         : sluiceFloor === 2 ? [SLUICE_LEVEL2_CHEST, SLUICE_SECRET_CHEST]
                         :                     [SLUICE_LEVEL3_CHEST, SLUICE_DEEP_CHEST];
      for (const chest of sluiceChests) {
        if (!chest.opened) {
          const cx = player.x - chest.x;
          const cy = player.y - chest.y;
          if (Math.sqrt(cx * cx + cy * cy) < TALK_RADIUS) {
            chest.opened = true;
            const it = chest.item;
            if (hasStatusEffect('cursed')) {
              dialogue.name  = '';
              dialogue.pages = [['You trip on the latch mechanism.', `The ${it.name} tumbles into the channel water below.`, 'A soft glug. It\u2019s gone.']];
            } else {
              stats.items.push({ name: it.name, type: it.type, bonus: it.bonus, heals: it.heals, price: it.price });
              dialogue.name  = '';
              dialogue.pages = [['Chest opened.', `${it.name}  (${itemStatLabel(it)})  \u2014 added to items.`]];
            }
            dialogue.open  = true;
            dialogue.page  = 0;
            return;
          }
        }
      }
      if (sluice_job_started && !sluice_fixed) {
        const gx = player.x - SLUICE_GATE.x;
        const gy = player.y - SLUICE_GATE.y;
        if (Math.sqrt(gx * gx + gy * gy) < TALK_RADIUS) {
          dialogue.name  = 'West Gate';
          dialogue.pages = [
            ['The sluice gate is partially blocked.', 'Compacted reed debris, wedged in the frame.'],
            ['You clear it out.', 'Flow should normalise.'],
          ];
          dialogue.callbacks = [function() { sluice_fixed = true; }];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // ── Environmental notes — floor 2: old work order ──────────────────────
      if (sluiceFloor === 2) {
        if (nearPlayer(7.5 * TILE, 3.5 * TILE)) {
          openDialogue('Work Order', [
            ['A folded paper pinned to a support beam.',
             'Ink run in places. Most of it is still legible.'],
            ['EAST SLUICE \u2014 LOWER WORKS',
             'Task list, inspection cycle [date illegible]:',
             '1. Clear silt from south intake. \u2714',
             '2. Re-seal north gate housing. \u2714',
             '3. Inspect deep-works junction. \u2014 NOT DONE.'],
            ['Below task 3, in different handwriting:',
             'Do not proceed past the lower level.',
             'Chamber pressure unread since fen expansion.',
             'Work suspended pending survey. Survey not yet scheduled.'],
            ['No date on the addendum.',
             'The paper is brittle.'],
          ]);
          return;
        }
      }
      // ── Environmental notes — floor 3: carved initials ──────────────────────
      if (sluiceFloor === 3) {
        if (nearPlayer(3.5 * TILE, 5.5 * TILE)) {
          openDialogue('', [
            ['Names carved into the stone at shoulder height.',
             'Not placed with any ceremony.',
             'Just a habit people get into when they spend time somewhere.'],
            ['Three sets of initials, and a date',
             'that could be anywhere in the last forty years.'],
            ['Below them, newer and cut deeper,',
             'as though whoever did it wanted to be certain it would last:',
             'IT HELD.'],
          ]);
          return;
        }
      }
      interactSimpleNPCs();
    } else if (inMireVault) {
      // ── Mirethyst's Vault chest ────────────────────────────────────────────
      if (!MIRE_VAULT_CHEST.opened) {
        const cx = player.x - MIRE_VAULT_CHEST.x;
        const cy = player.y - MIRE_VAULT_CHEST.y;
        if (Math.sqrt(cx * cx + cy * cy) < TALK_RADIUS) {
          MIRE_VAULT_CHEST.opened = true;
          const it = MIRE_VAULT_CHEST.item;
          if (hasStatusEffect('cursed')) {
            dialogue.name  = '';
            dialogue.pages = [['The chest lid snaps up and hits you in the face.', `The ${it.name} clatters across the flagstones and falls into the vault\u2019s central pool.`, 'You watch the ripples. The vault watches too.']];
          } else {
            stats.items.push({ name: it.name, type: it.type, bonus: it.bonus, price: it.price });
            dialogue.name  = '';
            dialogue.pages = [['Ancient chest opened.', `${it.name}  (${itemStatLabel(it)})  \u2014 added to items.`]];
          }
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // ── Environmental: inscribed stone wall (row 1, col 4 area) ───────────
      if (nearPlayer(4.5 * TILE, 1.5 * TILE)) {
        openDialogue('', [
          ['A smooth section of wall, different from the surrounding stone.',
           'Deliberately shaped. Older than the rest.'],
          ['Glyphs run in a horizontal band at chest height.',
           'The script is pre-Imperial. Not decorative \u2014 administrative.',
           'A list of names, or decisions.'],
          ['At the end of the band, cut shallower, a later addition:',
           '\u2018We came to this place to be heard equally.\u2019',
           '\u2018We were not.\u2019',
           '\u2018We came anyway.\u2019'],
        ]);
        return;
      }
      // ── Mirethyst NPC ──────────────────────────────────────────────────────
      interactSimpleNPCs();
    } else if (inTakomo) {
      // ── Takomo encounter — check cultists first, then Takomo ─────────────────
      // interactSimpleNPCs handles Preth and Rena; priority goes to whichever is
      // closer. If a cultist dialogue fires, we return so Takomo isn't also triggered.
      if (interactSimpleNPCs()) return;
      if (!TAKOMO.defeated) {
        const tx = player.x - TAKOMO.x;
        const ty = player.y - TAKOMO.y;
        if (Math.sqrt(tx * tx + ty * ty) < TALK_RADIUS) {
          dialogue.name  = '';
          dialogue.pages = [
            ['The figure at the centre of the chamber does not turn around.',
             'You can feel the heat from here.',
             'It\u2019s coming from him.'],
            ['He turns.',
             'Whatever expression he is wearing, it is not surprise.',
             '\u201cI wondered when someone would find this place.\u201d'],
            ['\u201cYou shouldn\u2019t be here.\u201d',
             'He rolls his neck once, slowly.',
             '\u201cBut here we are.\u201d'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
          dialogue.triggerTakomoCombat = true;
        }
      } else {
        // Post-defeat: the chamber is quiet except for the two remaining cultists
        const tx = player.x - TAKOMO.x;
        const ty = player.y - TAKOMO.y;
        if (Math.sqrt(tx * tx + ty * ty) < TALK_RADIUS) {
          dialogue.name  = '';
          dialogue.pages = [['The chamber is still.',
                             'The warmth that was here before is gone.']];
          dialogue.open  = true;
          dialogue.page  = 0;
        }
      }
    } else if (inHamletInterior) {
      // ── Falls hamlet interior — NPCs in their three rooms ───────────────────
      interactSimpleNPCs();
    } else if (inDungeonEntrance) {
      // ── South Ruins Entrance Hall — lore NPCs only, no chests/quests here ───
      interactSimpleNPCs();
    } else if (inTown && !townBuilding) {
      // Notice board — Calwick (TOWN_MAP) and Drenwick Market use separate arrays and positions
      const isDrenwichMarket = currentTownId === 'drenwick' && activeMap === DRENWICK_MARKET_MAP;
      if (currentTownId !== 'drenwick' || isDrenwichMarket) {
        const boardX = isDrenwichMarket ? DRENWICK_MARKET_NOTICE_BOARD_X : NOTICE_BOARD_X;
        const boardY = isDrenwichMarket ? DRENWICK_MARKET_NOTICE_BOARD_Y : NOTICE_BOARD_Y;
        const bx = player.x - boardX;
        const by = player.y - boardY;
        if (Math.sqrt(bx * bx + by * by) < TALK_RADIUS) {
          const notices = isDrenwichMarket ? DRENWICK_JOB_BOARD_NOTICES : JOB_BOARD_NOTICES;
          const pages = notices.length > 0
            ? notices.map(n => [n])
            : [['The job board is empty.']];
          dialogue.name  = 'Notice Board';
          dialogue.pages = pages;
          // If Drenwick board and sickle quest not yet started, start it on close
          if (isDrenwichMarket && sickle_quest_stage === 0) {
            dialogue.callbacks = [function() {
              sickle_quest_stage = 1;
              syncQuestFlagsToWindow();
              refreshJobBoard();
            }];
          }
          // If Calwick board and Den Wraith quest not yet started (posting is visible), start it on close
          if (!isDrenwichMarket && day >= 11 && !den_wraith_quest_started && !den_wraith_rewarded) {
            dialogue.callbacks = [function() {
              den_wraith_quest_started = true;
              syncQuestFlagsToWindow();
              refreshJobBoard();
            }];
          }
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // Permanent merchant (not present in Drenwick)
      if (currentTownId !== 'drenwick') {
        const mx = player.x - MERCHANT.x;
        const my = player.y - MERCHANT.y;
        if (Math.sqrt(mx * mx + my * my) < TALK_RADIUS) {
          shop.title  = 'MERCHANT';
          shop.stock  = MERCHANT_STOCK;
          shop.screen = 'main';
          shop.cursor = 0;
          shop.open   = true;
          return;
        }
      }
      // Travelling salesman (only when present, not in Drenwick)
      if (travellerPresent && currentTownId !== 'drenwick') {
        const tx = player.x - TRAVELLER.x;
        const ty = player.y - TRAVELLER.y;
        if (Math.sqrt(tx * tx + ty * ty) < TALK_RADIUS) {
          shop.title  = 'TRAVELLER';
          shop.stock  = TRAVELLER_STOCK;
          shop.screen = 'main';
          shop.cursor = 0;
          shop.open   = true;
          return;
        }
      }
      // Overseer Mault — removal contract quest (Calwick, post-sluice)
      if (currentTownId === 'calwick' && sluice_reward_given) {
        const mault = SIMPLE_NPCS.find(n => n.id === 'overseer_mault');
        if (mault) {
          const mdx = player.x - mault.x;
          const mdy = player.y - mault.y;
          if (Math.sqrt(mdx * mdx + mdy * mdy) < TALK_RADIUS) {
            if (!warden_quest_started) {
              dialogue.name  = 'Overseer Mault';
              dialogue.pages = [
                ['Mault. District Infrastructure.',
                 'You\u2019re the one who cleared the east sluice. I read the report.'],
                ['There\u2019s a Briar Warden denning in the east dungeon passage.',
                 'Came up through the flood channel. Three weeks ago now.',
                 'Won\u2019t leave on its own.'],
                ['We\u2019ve posted a removal contract.',
                 'A hundred and twenty gold, paid on confirmed removal.',
                 'The passage can\u2019t be re-opened until it\u2019s done.'],
              ];
              dialogue.callbacks = [function() {
                choice.title     = 'Overseer Mault';
                choice.options   = ['Accept contract', 'Not yet'];
                choice.cursor    = 0;
                choice.callbacks = [
                  function accept() {
                    warden_quest_started = true;
                    refreshJobBoard();
                    dialogue.name  = 'Overseer Mault';
                    dialogue.pages = [
                      ['\u201cGood.\u201d',
                       'He notes it in his ledger without looking up.',
                       '\u201cEast passage. Come back when it\u2019s done.\u201d'],
                    ];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                  function notYet() {
                    dialogue.name  = 'Overseer Mault';
                    dialogue.pages = [['\u201cThe notice stays on the board.\u201d']];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                ];
                choice.open = true;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (warden_quest_defeated && !warden_quest_rewarded) {
              dialogue.name  = 'Overseer Mault';
              dialogue.pages = [
                ['\u201cDone?\u201d',
                 'He looks at you steadily for a moment.',
                 '\u201cGood.\u201d'],
                ['\u201cA hundred and twenty gold.',
                 'The district will log the removal.',
                 'You won\u2019t need to sign anything.\u201d'],
              ];
              dialogue.callbacks = [function() {
                stats.gold += 120;
                warden_quest_rewarded = true;
                refreshJobBoard();
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (warden_quest_started && !warden_quest_defeated) {
              dialogue.name  = 'Overseer Mault';
              dialogue.pages = [['\u201cEast passage. Come back when it\u2019s done.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else {
              dialogue.name  = 'Overseer Mault';
              dialogue.pages = [['\u201cPassage is clear. Maintenance crew goes back in next cycle.\u201d',
                                  '\u201cAppreciate the work.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
      }
      // Fishing spot — Drenwick Waterfront, dock edge col 3 row 3
      if (currentTownId === 'drenwick' && activeMap === DRENWICK_WATERFRONT_MAP) {
        const fsx = player.x - DRENWICK_FISHING_SPOT.x;
        const fsy = player.y - DRENWICK_FISHING_SPOT.y;
        if (Math.sqrt(fsx * fsx + fsy * fsy) < TALK_RADIUS) {
          choice.title     = '';
          choice.options   = ['Cast line', 'Leave'];
          choice.cursor    = 0;
          choice.callbacks = [
            function cast() {
              const roll = Math.random();
              dialogue.name = '';
              dialogue.open = true;
              dialogue.page = 0;
              if (roll < 0.40) {
                dialogue.pages = [['You cast the line.', 'The water sits still.', 'Nothing bites.']];
              } else if (roll < 0.65) {
                stats.items.push({ name: 'River Smelt', type: 'potion', heals: 8, price: 4 });
                dialogue.pages = [['Something on the line.', 'River Smelt. Small, cold, indignant.', 'Added to items.']];
              } else if (roll < 0.85) {
                stats.items.push({ name: 'Canal Eel', type: 'potion', heals: 20, price: 12 });
                dialogue.pages = [['Heavy on the line.', 'Canal Eel. Long, dark, unhappy about it.', 'Added to items.']];
              } else if (roll < 0.97) {
                stats.items.push({ name: 'Old Boot', type: 'accessory', bonus: 0, price: 0 });
                dialogue.pages = [['Heavy on the line.', 'You pull it up.', 'Old Boot. Added to items.']];
              } else {
                stats.items.push({ name: 'Sealed Letter', type: 'accessory', bonus: 0, price: 0, questItem: true });
                dialogue.pages = [
                  ['Something catches on the line.', 'You pull it up carefully.'],
                  ['A sealed letter. Still mostly dry.', 'The seal is already broken.', 'You unfold it.'],
                  ['TRANSIT AUTHORIZATION \u2014 VOID',
                   'Bearer: [name removed].',
                   'Route: Drenwick to [destination removed].',
                   'Note: Do not proceed. Return to sender.'],
                  ['The sender\u2019s address has been cut away.', 'Added to items.'],
                ];
              }
            },
            function leave() {},
          ];
          choice.open = true;
          return;
        }
      }
      // ── Between Posts quest ────────────────────────────────────────────────
      // Sena (Calwick town square) — all stages except complete
      if (currentTownId === 'calwick' && drama_stage < 5) {
        const sena = SIMPLE_NPCS.find(n => n.id === 'sena');
        if (sena && sena.map === 'town') {
          const snx = player.x - sena.x;
          const sny = player.y - sena.y;
          if (Math.sqrt(snx * snx + sny * sny) < TALK_RADIUS) {
            if (drama_stage === 0) {
              if (!dispatch_rewarded) {
                // Player hasn't yet carried the dispatch letter to Drenwick and back.
                // Sena recognises them as a neighbour but doesn't yet ask for a favour.
                dialogue.name  = 'Sena';
                dialogue.pages = [
                  ['\u201cOh \u2014 sorry. I was miles away.\u201d',
                   'She tucks something into her coat pocket.',
                   '\u201cYou\u2019re from the office, aren\u2019t you. I\u2019ve seen you on the square.\u201d'],
                  ['\u201cI\u2019m Sena.\u201d',
                   '\u201cThat\u2019s my son over there.\u201d',
                   '\u201cTev. He won\u2019t bite.\u201d'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              } else {
                // Player has been to Drenwick and back — Sena recognises them as
                // someone who travels that route and trusts them with a letter.
                dialogue.name  = 'Sena';
                dialogue.pages = [
                  ['\u201cYou go to Drenwick sometimes, don\u2019t you.\u201d',
                   'She\u2019s holding a folded piece of paper.',
                   '\u201cI have a letter. For someone at the market there.\u201d'],
                  ['\u201cThe post has been\u2014 it\u2019s complicated. It\u2019s complicated between us.\u201d',
                   '\u201cHis name\u2019s Davan. He\u2019s usually by the east stalls.\u201d',
                   '\u201cWould you mind? You don\u2019t have to.\u201d'],
                ];
                dialogue.callbacks = [function() {
                  choice.title     = 'Sena';
                  choice.options   = ['Take the letter', 'Not right now'];
                  choice.cursor    = 0;
                  choice.callbacks = [
                    function take() {
                      drama_stage = 1;
                      syncQuestFlagsToWindow();
                      dialogue.name  = 'Sena';
                      dialogue.pages = [
                        ['\u201cThank you.\u201d',
                         '\u201cDavan. East stalls. He\u2019ll know what it is.\u201d'],
                      ];
                      dialogue.open  = true;
                      dialogue.page  = 0;
                    },
                    function notNow() {
                      dialogue.name  = 'Sena';
                      dialogue.pages = [['\u201cOf course. No trouble.\u201d']];
                      dialogue.open  = true;
                      dialogue.page  = 0;
                    },
                  ];
                  choice.open = true;
                }];
                dialogue.open  = true;
                dialogue.page  = 0;
              }
            } else if (drama_stage === 1) {
              dialogue.name  = 'Sena';
              dialogue.pages = [['\u201cHave you been to Drenwick yet?\u201d',
                                  '\u201cDavan. East stalls at the market. He\u2019ll be there.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (drama_stage === 2) {
              // Player returns with Davan's reply
              dialogue.name  = 'Sena';
              dialogue.pages = [
                ['\u201cDavan sent something back?\u201d',
                 'She takes it. Opens it slowly.'],
                ['\u201cHe\u2019s hurt.\u201d',
                 'She says it like she\u2019s noticing something rather than feeling it.',
                 '\u201cHe always writes short when he\u2019s hurt.\u201d'],
                ['\u201cI didn\u2019t mean it as a complaint. I just wanted him to know about the assessment.\u201d',
                 '\u201cHe thinks I\u2019m keeping things from him. I\u2019m not.\u201d',
                 '\u201cI\u2019m just\u2014\u201d',
                 'She stops. Writes something down on a folded slip.',
                 '\u201cCould you take this back? I know that\u2019s a lot to ask.\u201d'],
              ];
              dialogue.callbacks = [function() {
                choice.title     = 'Sena';
                choice.options   = ['Take it back to him', 'I can\u2019t right now'];
                choice.cursor    = 0;
                choice.callbacks = [
                  function take() {
                    drama_stage = 3;
                    syncQuestFlagsToWindow();
                    dialogue.name  = 'Sena';
                    dialogue.pages = [['\u201cThank you.\u201d', '\u201cI know this isn\u2019t your errand.\u201d']];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                  function notNow() {
                    dialogue.name  = 'Sena';
                    dialogue.pages = [['\u201cNo, it\u2019s fine. I can find another way.\u201d',
                                        '\u201cThank you for bringing his.\u201d']];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                ];
                choice.open = true;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (drama_stage === 3) {
              dialogue.name  = 'Sena';
              dialogue.pages = [['\u201cStill going back to Drenwick?\u201d',
                                  '\u201cDavan. East stalls. Same as before.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (drama_stage === 4) {
              // Final note from Davan — completion
              dialogue.name  = 'Sena';
              dialogue.pages = [
                ['\u201cFrom Davan?\u201d',
                 'She opens it.'],
                ['She doesn\u2019t speak for a moment.'],
                ['\u201cHe used to do that.\u201d',
                 'Very quiet. Not quite to the player.',
                 '\u201cWhen things got difficult. He\u2019d stop arguing and just\u2026 say the plain thing.\u201d'],
                ['\u201cI always forgot he could do that.\u201d',
                 'She looks up.',
                 '\u201cThank you. For carrying these. You didn\u2019t have to.\u201d'],
              ];
              dialogue.callbacks = [function() {
                stats.gold += 25;
                drama_stage = 5;
                syncQuestFlagsToWindow();
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
      }
      // Davan (Drenwick market) — all stages except complete
      if (currentTownId === 'drenwick' && activeMap === DRENWICK_MARKET_MAP && drama_stage < 5) {
        const davan = SIMPLE_NPCS.find(n => n.id === 'davan');
        if (davan) {
          const dvx = player.x - davan.x;
          const dvy = player.y - davan.y;
          if (Math.sqrt(dvx * dvx + dvy * dvy) < TALK_RADIUS) {
            if (drama_stage === 0) {
              // Not yet carrying a letter
              dialogue.name  = 'Davan';
              dialogue.pages = [['\u201cYeah?\u201d',
                                  '\u201cSorry. Not a good moment.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (drama_stage === 1) {
              // Delivering note 1 from Sena
              dialogue.name  = 'Davan';
              dialogue.pages = [
                ['\u201cFrom Sena?\u201d',
                 'He takes it. Reads it once. Sets it on the crate beside him.',
                 '\u201cShe\u2019s telling me the assessment is the seventeenth.\u201d'],
                ['\u201cI already knew that. She sent me the school schedule in the second month.',
                 'I wrote it down.\u201d',
                 'A pause.',
                 '\u201cShe thinks I don\u2019t write things down.\u201d'],
                ['\u201cTell her I said\u2026\u201d',
                 'He stops. Gets out a pen.',
                 '\u201cActually. Here. If you\u2019re going back.\u201d',
                 'He writes something short, folds it.'],
              ];
              dialogue.callbacks = [function() {
                drama_stage = 2;
                syncQuestFlagsToWindow();
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (drama_stage === 2) {
              dialogue.name  = 'Davan';
              dialogue.pages = [['\u201cYou\u2019re going back to Calwick?\u201d',
                                  '\u201cYou\u2019ve got the reply I gave you.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (drama_stage === 3) {
              // Delivering note 3 from Sena
              dialogue.name  = 'Davan';
              dialogue.pages = [
                ['He opens it. Reads it slower this time.'],
                ['\u201cShe\u2019s not wrong.\u201d',
                 'Quietly. Not to the player \u2014 just out loud.',
                 '\u201cShe\u2019s never wrong about the thing she\u2019s saying. It\u2019s just the way she\u2014\u201d',
                 'He stops himself.'],
                ['\u201cI\u2019ll come for the assessment. That\u2019s all.\u201d',
                 'He writes something. Short.',
                 '\u201cThat\u2019s the whole note. That\u2019s everything I\u2019m saying.\u201d'],
              ];
              dialogue.callbacks = [function() {
                drama_stage = 4;
                syncQuestFlagsToWindow();
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (drama_stage === 4) {
              dialogue.name  = 'Davan';
              dialogue.pages = [['\u201cYou\u2019re going back?\u201d',
                                  '\u201cYou have the note. Pass it on.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
      }
      // Outdoor NPCs (Drenwick civic, market, waterfront, etc.)
      interactSimpleNPCs();
    } else if (inTown && townBuilding === 'office' && currentTownId === 'drenwick') {
      // District Supervisor Harrow — col 7 row 4; no longer receives the letter directly
      {
        const hx = player.x - 7.5 * TILE;
        const hy = player.y - 4.5 * TILE;
        if (Math.sqrt(hx * hx + hy * hy) < TALK_RADIUS) {
          dialogue.name  = 'Supervisor Harrow';
          dialogue.pages = dispatch_delivered
            ? [
                ['\u201cLetter\u2019s been filed.',
                 'Anything else?\u201d'],
              ]
            : [
                ['\u201cDrenwick district office.',
                 'If you have business here, state it.\u201d'],
                ['\u201cCorrespondence from Calwick goes to Officer Veth.',
                 'That\u2019s his desk in the corner.\u201d'],
              ];
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
      }
      // Officer Veth — receives the Dispatch Letter when the player has it
      const veth = SIMPLE_NPCS.find(n => n.id === 'district_officer');
      if (veth) {
        const vx = player.x - veth.x;
        const vy = player.y - veth.y;
        if (Math.sqrt(vx * vx + vy * vy) < TALK_RADIUS) {
          const hasLetter = stats.items.some(i => i.name === 'Dispatch Letter');
          if (dispatch_quest_started && !dispatch_delivered && hasLetter) {
            dialogue.name  = 'Officer Veth';
            dialogue.pages = [
              ['He notices the letter before you say anything.',
               '\u201cCalwick.\u201d',
               'He holds out his hand.'],
              ['\u201cI handle their correspondence.',
               'Harrow doesn\u2019t like paperwork from the western postings.',
               'Something about the formatting.\u201d'],
              ['He checks the seal, opens it, reads it quickly.',
               '\u201cRoutine.\u201d',
               'He sets it in a tray beside his elbow.'],
              ['\u201cTell your supervisor it\u2019s received and logged.',
               'He\u2019ll get the countersignature through the weekly packet.\u201d'],
            ];
            dialogue.callbacks = [function() {
              stats.items = stats.items.filter(i => i.name !== 'Dispatch Letter');
              dispatch_delivered = true;
              syncQuestFlagsToWindow();
            }];
            dialogue.open = true;
            dialogue.page = 0;
            return;
          }
          if (dispatch_delivered) {
            dialogue.name  = 'Officer Veth';
            dialogue.pages = [
              ['\u201cCalwick posting.\u201d',
               '\u201cLetter\u2019s been logged.',
               'Anything further?\u201d'],
              ...veth.dialogue.slice(1),
            ];
            dialogue.open  = true;
            dialogue.page  = 0;
            return;
          }
          dialogue.name  = veth.name;
          dialogue.pages = veth.dialogue;
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // Officer Sable (thread officer)
      const sable = SIMPLE_NPCS.find(n => n.id === 'thread_officer');
      if (sable) {
        const sx = player.x - sable.x;
        const sy = player.y - sable.y;
        if (Math.sqrt(sx * sx + sy * sy) < TALK_RADIUS) {
          dialogue.name  = sable.name;
          dialogue.pages = sable.dialogue;
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // Holt and any other office NPCs caught by interactSimpleNPCs
      interactSimpleNPCs();
      return;
    } else if (inTown && townBuilding === 'office') {
      if (currentTownId === 'calwick') {
        // Wall map — inspectable continent map on north wall (row 1, cols 6-9)
        const wmx = player.x - CALWICK_OFFICE_WALL_MAP.x;
        const wmy = player.y - CALWICK_OFFICE_WALL_MAP.y;
        if (Math.sqrt(wmx * wmx + wmy * wmy) < TALK_RADIUS * 1.5) {
          continentMap.open = true;
          return;
        }
        const sx = player.x - SUPERVISOR.x;
        const sy = player.y - SUPERVISOR.y;
        if (Math.sqrt(sx * sx + sy * sy) < TALK_RADIUS) {
          interactSupervisor();
          return;
        }
        const fx = player.x - FILING_CABINET.x;
        const fy = player.y - FILING_CABINET.y;
        if (Math.sqrt(fx * fx + fy * fy) < TALK_RADIUS) {
          // Weight Discrepancy quest: once Corvin has countersigned but the
          // note isn't filed yet, this cabinet is the actual decision point —
          // not Aldric's desk. See quests.js's weight_note_signed comment.
          if (weight_note_signed && !cabinetCaseFlag) {
            dialogue.name = 'Filing Cabinet';
            dialogue.pages = [
              ['Corvin\u2019s countersigned note, still folded in your pocket.'],
              ['The drawer marked for his section is unlocked.', 'It would take a second to slide the note in and no one would ever ask.'],
            ];
            dialogue.callbacks = [function() {
              choice.title     = 'Filing Cabinet';
              choice.options   = ['File it with Corvin\u2019s other notes', 'Leave it on top of the stack', 'This isn\u2019t your job — find Aldric instead'];
              choice.cursor    = 0;
              choice.callbacks = [
                function fileProper() {
                  cabinetCaseFlag    = true;
                  weight_quest_stage = 3;
                  syncQuestFlagsToWindow();
                  refreshJobBoard();
                  dialogue.name  = '';
                  dialogue.pages = [
                    ['You find the gap where his monthly summaries collect and slide the note in.',
                     'It disappears into the stack like it was always there.'],
                  ];
                  dialogue.open  = true;
                  dialogue.page  = 0;
                },
                function leaveOnTop() {
                  cabinetCaseFlag    = true;
                  weight_quest_stage = 3;
                  syncQuestFlagsToWindow();
                  refreshJobBoard();
                  dialogue.name  = '';
                  dialogue.pages = [
                    ['You set it on top of the stack instead.',
                     'Someone will notice it wasn\u2019t there yesterday. That\u2019s not really your problem.'],
                  ];
                  dialogue.open  = true;
                  dialogue.page  = 0;
                },
                function declineForNow() {
                  dialogue.name  = '';
                  dialogue.pages = [
                    ['You put the note away instead.',
                     'Whatever Aldric wants done with it, it\u2019s still sitting in your pocket, unfiled.'],
                  ];
                  dialogue.open  = true;
                  dialogue.page  = 0;
                },
              ];
              choice.open = true;
            }];
            dialogue.open = true;
            dialogue.page = 0;
            return;
          }
          dialogue.name = 'Filing Cabinet';
          dialogue.pages = cabinetCaseFlag
            ? [['The files have been disturbed.', 'Someone was looking for something.']]
            : [['You look through the files,', 'but find nothing of interest.']];
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
        const ex = player.x - ESLA_CABINET.x;
        const ey = player.y - ESLA_CABINET.y;
        if (Math.sqrt(ex * ex + ey * ey) < TALK_RADIUS) {
          dialogue.name = 'Filing Cabinet';
          dialogue.pages = weight_note_signed && !cabinetCaseFlag
            ? [['Not this drawer.', 'Corvin\u2019s section is the other cabinet, past the window.']]
            : [['You look through the files,', 'but find nothing of interest.']];
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
        const elx = player.x - ESLA.x;
        const ely = player.y - ESLA.y;
        if (Math.sqrt(elx * elx + ely * ely) < TALK_RADIUS) {
          const dayBeforeAccord = day % 5 === 4;
          dialogue.name = 'Esla';
          const eslaVariants = [
            // 0 — rareborn privilege / parents unknown
            [
              ['\u201cI got this posting because I\u2019m rareborn.\u201d',
               '\u201cCivic priority. It\u2019s in the Accords.\u201d',
               'She says it plainly, not proudly.'],
              ['\u201cMy parents weren\u2019t.\u201d',
               'A pause.',
               '\u201cI don\u2019t know what happened to them.\u201d',
               '\u201cI got the posting. So.\u201d'],
            ],
            // 1 — flirty/helpful: she reads you specifically
            [
              ['She doesn\u2019t look up when you come in.',
               '\u201cYou again.\u201d',
               'She\u2019s smiling slightly at the page.'],
              ['\u201cIf you\u2019re here about something official,',
               'the morning window is better.\u201d',
               '\u201cIf you\u2019re not\u2014\u201d',
               'She looks up.',
               '\u201cI\u2019m on lunch at the second bell.\u201d'],
            ],
            // 2 — empire/watched: she doesn't remember before
            [
              ['\u201cSomeone asked me once what it was like',
               'before the empire.\u201d',
               '\u201cI didn\u2019t know what to say.\u201d'],
              ['\u201cI don\u2019t remember a before.\u201d',
               'She taps her pen on the desk, once.',
               '\u201cI\u2019m not sure anyone my age does.\u201d',
               '\u201cThat\u2019s probably the point.\u201d'],
            ],
            // 3 — quietly flirty: her sensitivity notices *you*
            [
              ['\u201cThe sensitivity thing\u2014\u201d',
               'She makes a small gesture with one hand.',
               '\u201cIt\u2019s not all the time.\u201d'],
              ['\u201cBut some people walk in and something\u2026 shifts.\u201d',
               'She glances up at you for just a moment.',
               '\u201cYou do that.\u201d',
               '\u201cJust so you know.\u201d'],
            ],
            // 4 — wistful: the empire watches, she doesn't mind, mostly
            [
              ['\u201cThere\u2019s a census update form every three years.\u201d',
               '\u201cRareborn-specific. Different questions.\u201d'],
              ['\u201cI used to think that was strange.\u201d',
               'She shrugs, just barely.',
               '\u201cNow I just fill it in.\u201d',
               '\u201cIt\u2019s fine. I think it\u2019s fine.\u201d'],
            ],
            // 5 — helpful/flirty: ask her directly
            [
              ['\u201cYou have a very obvious \u2018I need something\u2019 face,\u201d she says.',
               'She doesn\u2019t look up.',
               '\u201cYou\u2019re making it right now.\u201d'],
              ['\u201cJust ask me directly.\u201d',
               '\u201cI process things faster for people',
               'who don\u2019t make me guess.\u201d',
               'A small smile.',
               '\u201cIt\u2019s a personal policy.\u201d'],
            ],
            // 6 — rareborn privilege, complicated
            [
              ['\u201cI\u2019ve had opportunities I didn\u2019t earn.\u201d',
               '\u201cThe register, the posting priority,',
               'the housing supplement\u2014\u201d',
               'She stops herself.'],
              ['\u201cI use them. I\u2019m not going to pretend I don\u2019t.\u201d',
               'She looks at you steadily.',
               '\u201cBut I know what they are.\u201d'],
            ],
            // 7 — parents: doesn't know, won't perform grief
            [
              ['\u201cI was registered at six.\u201d',
               '\u201cThe sensitivity showed early, apparently.\u201d',
               '\u201cThey flagged it at school.\u201d'],
              ['\u201cAfter that\u2014\u201d',
               'She considers the sentence.',
               '\u201cThe empire was very thorough about my education.\u201d',
               '\u201cMy parents weren\u2019t rareborn.',
               'We didn\u2019t have a lot in common after a while.\u201d'],
            ],
            // 8 — helpful/warm: she'd remember your file anyway
            [
              ['\u201cYou don\u2019t need to introduce yourself.\u201d',
               '\u201cI know your file.\u201d'],
              ['\u201cI know everyone\u2019s file.\u201d',
               'She pauses.',
               '\u201cYours I looked up twice.\u201d',
               '\u201cKeep that in mind, if it helps.\u201d'],
            ],
            // 9 — warm/playful: she's made peace with Drenwick, mostly
            [
              ['\u201cThis isn\u2019t where I planned to be.\u201d',
               '\u201cBut then\u2014 I\u2019m not sure I planned anything.\u201d',
               'She tilts her head slightly.',
               '\u201cDid you?\u201d'],
              ['\u201cI only ask because most people here didn\u2019t plan it either.\u201d',
               '\u201cAnd yet.\u201d',
               'She gestures vaguely at the office, the town, everything.',
               '\u201cHere we all are.\u201d'],
            ],
          ];
          const eslaPages = dayBeforeAccord
            ? [
                ['\u201cToday\u2019s the day,\u201d she says quietly.'],
                ['\u201cAsk for that promotion', 'before you leave tonight.'],
                ['\u201cThey\u2019re always most receptive', 'on the eve of Accord Day.\u201d'],
              ]
            : eslaVariants[day % 10].slice();
          if (MainQuest === 1) {
            eslaPages.push(
              ['\u201cThe sluice assignment came across my desk first.\u201d',
               'She doesn\u2019t look up.',
               '\u201cI filed it. Didn\u2019t think about it.\u201d'],
              ['\u201cThen I looked up your name in the register.\u201d',
               '\u201cI\u2019m not sure why I did that.\u201d',
               '\u201cOld habit, maybe. I check more than I\u2019m supposed to.\u201d'],
              ['\u201cYou came back without incident.\u201d',
               '\u201cI noticed that too.\u201d',
               'A pause.',
               '\u201cI notice more than I say. Most people don\u2019t know that.\u201d'],
            );
          }
          if (MainQuest >= 2) {
            eslaPages.push(
              ['\u201cDrenwick.\u201d',
               '\u201cHand-delivered. Harrow\u2019s office, same day.\u201d',
               '\u201cDo you know how rarely that happens?\u201d'],
              ['\u201cSix years I\u2019ve been sitting at this desk.\u201d',
               '\u201cI have never once seen a dispatch processed same-day by Harrow\u2019s office.\u201d',
               '\u201cNot once.\u201d'],
              ['\u201cIt won\u2019t show on your record the way you think it will.\u201d',
               '\u201cIt never does.\u201d',
               '\u201cBut I wrote it in the internal log anyway.\u201d',
               'She turns a page.',
               '\u201cSomebody should.\u201d'],
            );
          }
          if (cabinetCaseFlag) {
            // Reactive flavor \u2014 ties back to her established trait ("I notice
            // more than I say") from the MainQuest === 1 lines above. Purely
            // reactive; doesn't gate or change anything.
            eslaPages.push(
              ['\u201cSomeone\u2019s been in Aldric\u2019s cabinet.\u201d',
               'She doesn\u2019t look up from her own drawer.',
               '\u201cHe hasn\u2019t noticed yet. Or he has, and he\u2019s decided not to say.\u201d'],
              ['\u201cI\u2019m not asking.\u201d',
               '\u201cI notice more than I say. This is one of those times.\u201d'],
            );
          }
          if (fort_quest_stage >= 6 && smugglers_dead && smugglers_execution_day === 0) {
            eslaPages.push(
              ['\u201cPolwick.\u201d',
               'She doesn\u2019t look up right away.',
               '\u201cI only met him twice. Registry business, mostly.\u201d'],
              ['\u201cThere aren\u2019t many of us posted this far out.',
               'You notice the other ones. Even if you don\u2019t know them.\u201d',
               'She sets her pen down.'],
              ['\u201cI don\u2019t know what he was doing with that post.',
               'I don\u2019t think I want to.\u201d',
               '\u201cBut I keep thinking about the drought, and what people do when the ledger stops adding up.\u201d'],
            );
          } else if (fort_quest_stage >= 6 && smugglers_execution_day > 0 && day < smugglers_execution_day) {
            eslaPages.push(
              ['\u201cI heard about the fen post.\u201d',
               'She doesn\u2019t look up right away.',
               '\u201cPolwick. I only met him twice, registry business.\u201d'],
              ['\u201cThere aren\u2019t many of us posted this far out.',
               'You notice the other ones, even the ones you don\u2019t know well.\u201d'],
              ['\u201cI don\u2019t know yet what the district will do with him.\u201d',
               'A pause.',
               '\u201cI try not to guess. It doesn\u2019t usually help.\u201d'],
            );
          } else if (fort_quest_stage >= 6 && smugglers_execution_day > 0 && day >= smugglers_execution_day) {
            eslaPages.push(
              ['\u201cI heard the district closed the fen post matter.\u201d',
               'She doesn\u2019t look up right away.',
               '\u201cPolwick. I only met him twice, registry business.\u201d'],
              ['\u201cThere aren\u2019t many of us posted this far out.',
               'You notice the other ones, even the ones you don\u2019t know well.\u201d'],
              ['\u201cRegistered rareborn, same as me. Employed, same as me.\u201d',
               'A pause.',
               '\u201cI keep thinking about the drought, and what people do when the ledger stops adding up. It doesn\u2019t excuse it.\u201d'],
              ['\u201cIt just makes it less simple than the report will say.\u201d'],
            );
          }
          dialogue.pages = eslaPages;
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
      }
      if (sluice_pay_ticket_ready && !sluice_reward_given) {
        const petra = SIMPLE_NPCS.find(n => n.id === 'petra');
        if (petra) {
          const pdx = player.x - petra.x;
          const pdy = player.y - petra.y;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < TALK_RADIUS) {
            dialogue.name  = 'Petra';
            dialogue.pages = [
              ['\u201cPay ticket, East Sluice clearance.\u201d', 'She checks the register.'],
              ['\u201cFifty gold. Sign here.\u201d'],
            ];
            dialogue.callbacks = [function() {
              stats.gold += 50;
              sluice_reward_given = true;
              sluice_pay_ticket_ready = false;
              MainQuest = 1;
              syncQuestFlagsToWindow();
              refreshJobBoard();
            }];
            dialogue.open = true;
            dialogue.page = 0;
            return;
          }
        }
      }
      if (dispatch_pay_ticket_ready && !dispatch_rewarded) {
        const petra = SIMPLE_NPCS.find(n => n.id === 'petra');
        if (petra) {
          const pdx = player.x - petra.x;
          const pdy = player.y - petra.y;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < TALK_RADIUS) {
            dialogue.name  = 'Petra';
            dialogue.pages = [
              ['\u201cPay ticket, Drenwick dispatch.\u201d', 'She checks the register.'],
              ['\u201cSeventy-five gold. Sign here.\u201d'],
            ];
            dialogue.callbacks = [function() {
              stats.gold += 75;
              dispatch_rewarded = true;
              dispatch_pay_ticket_ready = false;
              MainQuest = 2;
              syncQuestFlagsToWindow();
              refreshJobBoard();
            }];
            dialogue.open = true;
            dialogue.page = 0;
            return;
          }
        }
      }
      if (fort_pay_ticket_ready) {
        const petra = SIMPLE_NPCS.find(n => n.id === 'petra');
        if (petra) {
          const pdx = player.x - petra.x;
          const pdy = player.y - petra.y;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < TALK_RADIUS) {
            dialogue.name  = 'Petra';
            dialogue.pages = fort_pay_ticket_reduced
              ? [
                  ['\u201cPay ticket, fen post investigation.\u201d', 'She checks the register.'],
                  ['\u201cFifteen gold. Sign here.\u201d'],
                ]
              : [
                  ['\u201cPay ticket, fen post investigation.\u201d', 'She checks the register.'],
                  ['\u201cTwo hundred gold. Sign here.\u201d'],
                ];
            dialogue.callbacks = [function() {
              stats.gold += fort_pay_ticket_reduced ? 15 : 200;
              fort_pay_ticket_ready   = false;
              fort_pay_ticket_reduced = false;
              MainQuest = 3;
              syncQuestFlagsToWindow();
              refreshJobBoard();
            }];
            dialogue.open = true;
            dialogue.page = 0;
            return;
          }
        }
      }
      // Starting kit requisition — Aldric exchanges the Supervisor's ticket
      // for the player's kit, once, then reverts to his normal dialogue
      // (including the weight-quest branch below) on every later visit.
      if (equipment_ticket_ready) {
        const aldricGear = SIMPLE_NPCS.find(n => n.id === 'aldric');
        if (aldricGear && aldricGear.map === currentMapId()) {
          const agx = player.x - aldricGear.x;
          const agy = player.y - aldricGear.y;
          if (Math.sqrt(agx * agx + agy * agy) < TALK_RADIUS) {
            dialogue.name  = 'Aldric';
            dialogue.pages = [
              ['\u201cRequisition slip.\u201d', 'He glances at it, then at you.', '\u201cNew posting?\u201d'],
              ['He doesn\u2019t wait for an answer.', 'Pulls a bundle from under the counter.', '\u201cSword, armor. Standard issue. Sign here.\u201d'],
              ['\u201cOpen the menu with Escape, go to Items, and choose Equip.\u201d',
               'He\u2019s already looking back down at his ledger.'],
            ];
            dialogue.callbacks = [function() {
              equipment_ticket_ready = false;
              stats.items.push({ name: 'Iron Sword', type: 'weapon', bonus: 4, price: 80 });
              stats.items.push({ name: 'Leather Armor', type: 'armor', bonus: 3, price: 60 });
              syncQuestFlagsToWindow();
            }];
            dialogue.open = true;
            dialogue.page = 0;
            return;
          }
        }
      }
      // Weight Discrepancy quest — Aldric (stage 1 → 2) and Corvin (stage 2 → 3)
      if (weight_quest_stage === 1 || weight_quest_stage === 2) {
        const aldric = SIMPLE_NPCS.find(n => n.id === 'aldric');
        if (aldric && aldric.map === currentMapId()) {
          const adx = player.x - aldric.x;
          const ady = player.y - aldric.y;
          if (Math.sqrt(adx * adx + ady * ady) < TALK_RADIUS) {
            if (weight_quest_stage === 1) {
              dialogue.name  = 'Aldric';
              dialogue.pages = [
                ['\u201cRenn\u2019s query note.\u201d',
                 'He takes it, reads it once, sets it on the desk.',
                 '\u201cI know the entry. Grain barge, third cycle.\u201d'],
                ['\u201cOur ledger shows 304 stone. He\u2019s certified 312.\u201d',
                 '\u201cThat\u2019s Corvin\u2019s period. He kept the weight log that cycle.\u201d',
                 '\u201cI can\u2019t authorise the correction without his countersignature.\u201d'],
                ['\u201cCorvin\u2019s at the far desk on work days.\u201d',
                 '\u201cInn on the fifth. Try him when he\u2019s in.\u201d'],
              ];
              dialogue.callbacks = [function() {
                weight_quest_stage = 2;
                syncQuestFlagsToWindow();
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (!weight_note_signed) {
              dialogue.name  = 'Aldric';
              dialogue.pages = [['\u201cCorvin\u2019s signature — then it\u2019s done.\u201d',
                                  '\u201cHe\u2019s at the far desk.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else {
              // Corvin has signed, but the note still has to be filed before
              // Renn can be paid — Aldric would rather not do it himself.
              // (cabinetCaseFlag is necessarily still false here: it's only
              // ever set together with weight_quest_stage advancing past 2,
              // in the Filing Cabinet's callbacks below, which closes off
              // this whole outer block's gate before that state is reachable.)
              dialogue.name  = 'Aldric';
              dialogue.pages = [
                ['\u201cSigned already?\u201d',
                 'He doesn\u2019t reach for it.',
                 '\u201cThen it just needs to go back into the record. Corvin\u2019s section, the cabinet by the window.\u201d'],
                ['\u201cI\u2019d walk it over myself, but I\u2019m elbow-deep in the quarterly intake.\u201d',
                 'He nods at the cabinet without quite looking up from his stack.'],
              ];
              dialogue.callbacks = [function() {
                choice.title     = 'Aldric';
                choice.options   = ['I can do that.', 'Shouldn\u2019t this go through you?', 'I\u2019d rather not touch the district files.'];
                choice.cursor    = 0;
                choice.callbacks = [
                  function agree() {
                    dialogue.name  = 'Aldric';
                    dialogue.pages = [['\u201cAppreciated.\u201d', 'He\u2019s already back in his own ledger.']];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                  function pushBack() {
                    dialogue.name  = 'Aldric';
                    dialogue.pages = [
                      ['\u201cTechnically, yes.\u201d',
                       '\u201cTechnically you\u2019re already the one carrying it.\u201d',
                       'He says it without any particular guilt.'],
                      ['\u201cIt\u2019s not complicated. Corvin\u2019s section, the cabinet by the window.\u201d'],
                    ];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                  function decline() {
                    dialogue.name  = 'Aldric';
                    dialogue.pages = [
                      ['He glances up, briefly.',
                       '\u201cIt\u2019s one drawer.\u201d',
                       'He goes back to his own stack without pressing further.'],
                    ];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                ];
                choice.open = true;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
        if (weight_quest_stage === 2) {
          const corvin = SIMPLE_NPCS.find(n => n.id === 'corvin');
          if (corvin && corvin.map === currentMapId()) {
            const cdx = player.x - corvin.x;
            const cdy = player.y - corvin.y;
            if (Math.sqrt(cdx * cdx + cdy * cdy) < TALK_RADIUS) {
              if (!weight_note_signed) {
                dialogue.name  = 'Corvin';
                dialogue.pages = [
                  ['\u201cRenn\u2019s weight discrepancy.\u201d',
                   'He doesn\u2019t look up from the ledger.',
                   '\u201cI\u2019ve been expecting this query for two months.\u201d'],
                  ['\u201cThe 304 figure was a copy error on my part.\u201d',
                   '\u201cI transposed two digits. 304 should read 340, and the declared weight is 312.\u201d',
                   '\u201cStill a variance, but within acceptable tolerance.\u201d'],
                  ['\u201cI\u2019ll countersign the correction.\u201d',
                   'He signs the note without further comment and slides it back.',
                   '\u201cTell Renn I\u2019ve filed a correction notice on my side as well.\u201d',
                   '\u201cAldric can point you to where the note itself goes.\u201d'],
                ];
                dialogue.callbacks = [function() {
                  weight_note_signed = true;
                  syncQuestFlagsToWindow();
                }];
                dialogue.open  = true;
                dialogue.page  = 0;
              } else {
                dialogue.name  = 'Corvin';
                dialogue.pages = [['\u201cIt\u2019s signed.\u201d', 'He doesn\u2019t look up.', '\u201cAldric\u2019s cabinet, not mine.\u201d']];
                dialogue.open  = true;
                dialogue.page  = 0;
              }
              return;
            }
          }
        }
      }
      interactSimpleNPCs();
    } else if (inTown && townBuilding === 'inn' && currentTownId === 'drenwick') {
      const ix = player.x - DRENWICK_INNKEEPER.x;
      const iy = player.y - DRENWICK_INNKEEPER.y;
      if (Math.sqrt(ix * ix + iy * iy) < TALK_RADIUS) {
        dialogue.name  = 'Innkeeper';
        dialogue.pages = [
          ['\u201cRoom for the night?\u201d',
           '\u201cTwenty gold. Same as always.\u201d'],
        ];
        dialogue.callbacks = [function() {
          choice.title     = 'Innkeeper';
          choice.options   = ['Rest  (20g)', 'Leave'];
          choice.cursor    = 0;
          choice.callbacks = [
            function rest() {
              if (stats.gold >= 20) {
                stats.gold -= 20;
                stats.hp    = stats.maxHp;
                if (hasStatusEffect('poison'))  removeStatusEffect('poison');
                if (hasStatusEffect('muddied')) removeStatusEffect('muddied');
                if (hasStatusEffect('slither')) removeStatusEffect('slither');
                if (hasStatusEffect('cursed'))  removeStatusEffect('cursed');
                day++;
                dialogue.name  = 'Innkeeper';
                dialogue.pages = [['You sleep soundly.', 'HP fully restored.']];
                dialogue.open  = true;
                dialogue.page  = 0;
              } else {
                dialogue.name  = 'Innkeeper';
                dialogue.pages = [['\u201cNot enough gold.\u201d']];
                dialogue.open  = true;
                dialogue.page  = 0;
              }
            },
            function leave() {},
          ];
          choice.open = true;
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return;
      }
      interactSimpleNPCs();
      return;
    } else if (inTown && townBuilding === 'inn') {
      // Innkeeper
      const ix = player.x - INNKEEPER.x;
      const iy = player.y - INNKEEPER.y;
      if (Math.sqrt(ix * ix + iy * iy) < TALK_RADIUS) {
        dialogue.name  = 'Innkeeper';
        dialogue.pages = [
          ['\u201cA room? Of course.\u201d',
           '\u201cThough \u2014 you do have a house on the west side, if I\u2019m not mistaken.\u201d'],
          ['\u201cIt\u2019s your coin. I won\u2019t argue with it.\u201d'],
        ];
        dialogue.callbacks = [function() {
          choice.title     = 'Innkeeper';
          choice.options   = ['Rest  (20g)', 'Leave'];
          choice.cursor    = 0;
          choice.callbacks = [
            function rest() {
              if (stats.gold >= 20) {
                stats.gold -= 20;
                stats.hp    = stats.maxHp;
                if (hasStatusEffect('poison'))  removeStatusEffect('poison');
                if (hasStatusEffect('muddied')) removeStatusEffect('muddied');
                if (hasStatusEffect('slither')) removeStatusEffect('slither');
                if (hasStatusEffect('cursed'))  removeStatusEffect('cursed');
                day++;
                console.log(`Day ${day} \u2014 day off: ${isDayOff()}`);
                dialogue.name  = 'Innkeeper';
                dialogue.pages = [['You rest well.', 'HP fully restored.']];
                dialogue.open  = true;
                dialogue.page  = 0;
              } else {
                dialogue.name  = 'Innkeeper';
                dialogue.pages = [['Not enough gold.']];
                dialogue.open  = true;
                dialogue.page  = 0;
              }
            },
            function leave() {},
          ];
          choice.open = true;
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return;
      }
      if (currentTownId === 'calwick' && isDayOff()) {
        // Supervisor at dayoff position
        const sdx = player.x - SUPERVISOR_DAYOFF.x, sdy = player.y - SUPERVISOR_DAYOFF.y;
        if (Math.sqrt(sdx * sdx + sdy * sdy) < TALK_RADIUS) {
          dialogue.name  = 'Supervisor';
          dialogue.pages = [
            ['\u201cFourteen years.\u201d'],
            ['\u201cYou learn to leave it at the door.\u201d', 'He takes a slow sip of his drink.'],
          ];
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
        // Esla at dayoff position
        const edx = player.x - ESLA_DAYOFF.x, edy = player.y - ESLA_DAYOFF.y;
        if (Math.sqrt(edx * edx + edy * edy) < TALK_RADIUS) {
          dialogue.name  = 'Esla';
          // Rotate through 22 states across successive dayoffs.
          const eslaInnState = Math.floor(day / 5) % 22;
          if (eslaInnState === 0) {
            dialogue.pages = [
              ['\u201cI always forget how loud it is in here.\u201d'],
              ['\u201cNicer than the office on a slow day, though.\u201d'],
            ];
          } else if (eslaInnState === 1) {
            dialogue.pages = [
              ['\u201cYou live on the west side, don\u2019t you.\u201d'],
              ['\u201cI pass that way to the office.',
               'I\u2019ve been doing that longer than I\u2019ve been at the filing desk.\u201d'],
              ['\u201cI\u2019m not sure why I\u2019m telling you that.\u201d'],
            ];
          } else if (eslaInnState === 2) {
            dialogue.pages = [
              ['\u201cDon\u2019t tell me anything about work tonight.\u201d'],
              ['\u201cWe can talk about anything else.',
               'Anything at all.\u201d'],
              ['\u201cSurprise me.\u201d'],
            ];
          } else if (eslaInnState === 3) {
            dialogue.pages = [
              ['\u201cI was going to leave an hour ago.\u201d'],
              ['She picks up her drink without looking away.',
               '\u201cObviously I didn\u2019t.\u201d'],
              ['\u201cI\u2019m not complaining about it.\u201d'],
            ];
          } else if (eslaInnState === 4) {
            dialogue.pages = [
              ['\u201cI grew up in Alecton.\u201d',
               '\u201cThe Academy, specifically.',
               'Most people here don\u2019t know what that means.\u201d'],
              ['\u201cIt\u2019s where they send rareborn children.',
               'Not all of them. But the ones whose families sign the forms.\u201d'],
              ['\u201cMy mother signed them before I was two.',
               '\u201cShe was proud. I think she was proud.\u201d',
               'She looks at her glass.',
               '\u201cI never actually asked her.\u201d'],
            ];
          } else if (eslaInnState === 5) {
            dialogue.pages = [
              ['\u201cThey test you at five.\u201d',
               '\u201cTo measure it. The rareborn trait. What it is, how strong.\u201d',
               '\u201cI already knew what mine was.\u201d'],
              ['\u201cI could always tell when something was being left unsaid.',
               'In a room. Between people.',
               'You feel it like a draft under a door.\u201d'],
              ['\u201cThe examiner asked me three questions',
               'and I answered the one she hadn\u2019t asked yet.\u201d',
               'A small smile.',
               '\u201cShe wrote something down. I could feel that too.\u201d'],
            ];
          } else if (eslaInnState === 6) {
            dialogue.pages = [
              ['\u201cThere were twelve of us, my year.\u201d',
               '\u201cYou don\u2019t make friends at the Academy the way you do here.',
               'It\u2019s different when everyone knows what everyone else is.\u201d'],
              ['\u201cThere was a boy \u2014 Pell, we called him \u2014',
               'who could read water. Current, pressure, what was upstream.\u201d',
               '\u201cHe\u2019d hold a cup and tell you where the river had been.\u201d'],
              ['\u201cI wonder where he ended up.\u201d',
               'She says it like she probably already knows',
               'and doesn\u2019t want to say.'],
            ];
          } else if (eslaInnState === 7) {
            dialogue.pages = [
              ['\u201cWhen you graduate, they place you.\u201d',
               '\u201cNot always where you ask.',
               'But they ask. That much is true.\u201d'],
              ['\u201cI asked for somewhere quiet.\u201d',
               'She turns her cup in her hands.',
               '\u201cI thought that meant something specific.',
               'I\u2019m not sure I knew what I wanted.\u201d'],
              ['\u201cThey sent me here.\u201d',
               '\u201cI\u2019ve been trying to decide, for six years,',
               'whether that was an answer or a question.\u201d'],
            ];
          } else if (eslaInnState === 8) {
            dialogue.pages = [
              ['\u201cThe fens were strange to me at first.',
               'Everything close together and damp.',
               'The light doing something wrong in the afternoons.\u201d'],
              ['\u201cNow I\u2019d miss it.\u201d',
               'She says this like it surprises her.',
               '\u201cThe smell of it after rain.',
               'I\u2019d miss that specifically.\u201d'],
              ['\u201cI didn\u2019t expect to have a here.\u201d',
               '\u201cSomewhere that feels like it knows me back.\u201d',
               'She\u2019s quiet for a moment.',
               '\u201cI didn\u2019t expect that.\u201d'],
            ];
          } else if (eslaInnState === 9) {
            dialogue.pages = [
              ['\u201cTomas has been in this town his whole life.\u201d',
               '\u201cHe knows every name. Every family, three generations back.\u201d',
               '\u201cI find that remarkable. I think it\u2019s remarkable.\u201d'],
              ['\u201cHe doesn\u2019t understand the Academy.',
               'Not really.',
               'I\u2019ve tried to explain it and the words come out wrong.\u201d'],
              ['\u201cBut he makes good soup.\u201d',
               'A pause.',
               '\u201cThat sounds diminishing. I don\u2019t mean it that way.',
               'The soup is genuinely excellent.\u201d'],
            ];
          } else if (eslaInnState === 10) {
            dialogue.pages = [
              ['\u201cSix years.\u201d',
               '\u201cIt used to feel like a posting.',
               'Something I was doing until something else started.\u201d'],
              ['\u201cNow it just feels like where I live.\u201d',
               'She looks around the inn like she\u2019s seeing it for the first time.',
               '\u201cI\u2019m not sure when that changed.\u201d'],
            ];
          } else if (eslaInnState === 11) {
            dialogue.pages = [
              ['\u201cI\u2019ve thought about putting in for a transfer.\u201d',
               '\u201cTwice. Once in the second year, once in the fourth.\u201d'],
              ['\u201cBoth times I started the form and then didn\u2019t finish it.\u201d',
               'She tilts her head slightly.',
               '\u201cI tell myself it was inertia.',
               'I\u2019m not sure I believe me.\u201d'],
            ];
          } else if (eslaInnState === 12) {
            dialogue.pages = [
              ['\u201cYou look at me differently than the others do.\u201d'],
              ['She doesn\u2019t look away.',
               '\u201cI notice things. You know that by now.',
               'I noticed that.\u201d'],
              ['\u201cI\u2019m not sure what to do with it.',
               'I just wanted to say it out loud.',
               'To someone.\u201d'],
            ];
          } else if (eslaInnState === 13) {
            dialogue.pages = [
              ['\u201cThis is the part where I\u2019d usually say goodnight.\u201d'],
              ['She doesn\u2019t move.',
               '\u201cI\u2019m saying it now so I don\u2019t have to mean it.\u201d'],
            ];
          } else if (eslaInnState === 14) {
            dialogue.pages = [
              ['\u201cYou could ask me something.',
               'I\u2019d probably answer it.\u201d'],
              ['\u201cI don\u2019t say that often.',
               'To anyone.',
               'So.\u201d'],
              ['She looks away first.',
               '\u201cJust noting.\u201d'],
            ];
          } else if (eslaInnState === 15) {
            dialogue.pages = [
              ['\u201cI had a version of this conversation once.',
               'In Alecton, before placement.\u201d',
               '\u201cSomeone sitting where you are. Same kind of quiet.\u201d'],
              ['\u201cI didn\u2019t know what to do with it then either.\u201d',
               'She finishes her drink.',
               '\u201cI\u2019m better at noticing than I am at deciding.\u201d'],
            ];
          } else if (eslaInnState === 16) {
            dialogue.pages = [
              ['\u201cThere was a posting in the northeast.',
               'Registry central, Harrow\u2019s main office.',
               'Good work. Real work.\u201d'],
              ['\u201cI was offered it at the end of my first year here.',
               'I turned it down.\u201d'],
              ['\u201cI\u2019ve never been sure why.',
               'Something about the way the fens were that morning.',
               'That\u2019s not a real reason.',
               'I know it\u2019s not a real reason.\u201d'],
            ];
          } else if (eslaInnState === 17) {
            dialogue.pages = [
              ['\u201cSometimes I think about who I\u2019d be if I\u2019d gone east.\u201d'],
              ['\u201cSomeone efficient.',
               'Probably.',
               'Good at the large version of the same things I\u2019m good at here.\u201d'],
              ['\u201cI\u2019m not sure I\u2019d like her very much.\u201d',
               'A pause.',
               '\u201cOr maybe I would.',
               'That\u2019s the part I can\u2019t figure out.\u201d'],
            ];
          } else if (eslaInnState === 18) {
            dialogue.pages = [
              ['\u201cIt\u2019s not that I\u2019m unhappy.\u201d',
               '\u201cThat\u2019s not the word for it.\u201d'],
              ['\u201cIt\u2019s more like \u2014 I had the sense, when I was younger,',
               'that being rareborn meant the path would be clear.',
               'That you\u2019d know where you were going.\u201d'],
              ['\u201cInstead it just means you feel the fog more precisely.\u201d',
               'She almost smiles.',
               '\u201cVery precise fog. That\u2019s my gift.\u201d'],
            ];
          } else if (eslaInnState === 19) {
            dialogue.pages = [
              ['\u201cMy mother used to say the fen is honest land.\u201d',
               '\u201cIt shows you exactly what it is.',
               'No pretense.\u201d'],
              ['\u201cI thought she was being poetic.',
               'She wasn\u2019t.',
               'She\u2019d never been here.\u201d'],
              ['\u201cBut she was right.\u201d',
               '\u201cI\u2019ve been here six years and it still doesn\u2019t soften.',
               'I\u2019ve started to respect that.\u201d'],
            ];
          } else if (eslaInnState === 20) {
            dialogue.pages = [
              ['\u201cThere\u2019s a part of the roof you can get to from the upper window.\u201d',
               '\u201cThe supervisor doesn\u2019t know about it.',
               'Or if he does, he\u2019s pretending.\u201d'],
              ['\u201cOn clear nights you can see all the way to the north ridge.\u201d',
               '\u201cI go up sometimes.',
               'Alone.',
               'It\u2019s \u2014 I don\u2019t have a good word for what it is.\u201d'],
              ['\u201cClear.\u201d',
               'She settles on it.',
               '\u201cIt\u2019s clear up there.\u201d'],
            ];
          } else {
            dialogue.pages = [
              ['\u201cI see things I\u2019m not supposed to.',
               'At work.',
               'In rooms.',
               'Between people.\u201d'],
              ['\u201cI\u2019ve learned to mostly not say them out loud.\u201d',
               'She looks at you steadily.',
               '\u201cWith you, I keep having to remind myself.\u201d'],
            ];
          }
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
        // Petra and Corvin caught by interactSimpleNPCs (their map getter returns 'inn')
        interactSimpleNPCs();
        return;
      }
      const rtx = player.x - RESERVED_TABLE.x;
      const rty = player.y - RESERVED_TABLE.y;
      if (Math.sqrt(rtx * rtx + rty * rty) < TALK_RADIUS) {
        dialogue.name  = 'Reserved Table';
        dialogue.pages = [['Reserved for Imperial office staff.']];
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      interactSimpleNPCs();
    } else if (inTown && townBuilding === 'school' && currentTownId === 'drenwick') {
      // Ground floor: student desk with ancient textbook
      if (activeMap === DRENWICK_SCHOOL_GROUND_MAP) {
        const dkx = player.x - DRENWICK_SCHOOL_DESK.x;
        const dky = player.y - DRENWICK_SCHOOL_DESK.y;
        if (Math.sqrt(dkx * dkx + dky * dky) < TALK_RADIUS) {
          dialogue.name  = 'Ancient Textbook';
          dialogue.pages = [
            ['A heavy volume sits open on the desk, its pages darkened at the edges.',
             'The chapter heading reads:',
             '\u2018THE TWIN VICTORIES OF THE BLUE JAY EMPIRE:\nA History of Humanity\u2019s Last Stands\u2019'],
            ['\u2018In the age before the great reckoning, when the southern kingdoms had driven',
             'humanity to the edge of extinction, there rose from the city of the great inland',
             'lake a company of twenty-five. They were called the Blue Jays.\u2019'],
            ['\u2018In the First Last Stand, the Blue Jays faced the Atlanta Horde and did not',
             'break. The battle was long and the cost was great, but humanity held.',
             'The right to exist was purchased for one more age.\u2019'],
            ['\u2018Yet the dark forces returned. In the Second Last Stand, the Horde of',
             'Philadelphia came with redoubled fury, certain that what had been won could',
             'be taken back. They were mistaken.\u2019'],
            ['\u2018At the final gate, as the light failed and all seemed lost, it was Carter',
             'who stepped forward. Carter the Great. Carter the Unyielding.',
             'The sphere rose from his hand into the last of the evening sky.',
             'It did not come back down. It never came back down.\u2019'],
            ['\u2018But the ancient texts are clear on this: Carter did not stand alone.',
             'White was at his side. Alomar, who some say was the greatest of the age.',
             'Molitor, whose precision never wavered. Borders, the keeper of the gate.',
             'Olerud, steady as the ground itself.\u2019'],
            ['\u2018Henderson, who had seen wars older than memory.',
             'Ward, who held the line when all else gave way.',
             'Guzman, whose arm had become the thing the enemy feared most.',
             'And the rest of the twenty-five, whose names the text demands you learn.\u2019'],
            ['\u2018Those who stood in the First Last Stand shall not be forgotten either.',
             'Their names are recorded in the appendix, as the law requires.',
             'A student who cannot name them has not yet read this chapter.',
             'This chapter is not optional.\u2019'],
            ['A handwritten note in the margin reads:',
             '\u2018Examination question: List all 25 heroes of the Second Last Stand.',
             'Name at least 12 of the First.\u2019',
             'Someone has written below it, in smaller script:',
             '\u2018Why do we keep fighting the same enemies.\u2019'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // Upper floor only: locked document cabinet and apprenticeship posting board
      if (activeMap === DRENWICK_SCHOOL_UPPER_MAP) {
        const cabx = player.x - DRENWICK_SCHOOL_CABINET.x;
        const caby = player.y - DRENWICK_SCHOOL_CABINET.y;
        if (Math.sqrt(cabx * cabx + caby * caby) < TALK_RADIUS) {
          dialogue.name  = 'Document Cabinet';
          dialogue.pages = [
            ['Locked.',
             'Accord filing for students approaching completion of schooling.'],
            ['Pre-departure registration forms are prepared here and forwarded to the district registry before the student leaves the school system.'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
        const brdx = player.x - DRENWICK_SCHOOL_BOARD.x;
        const brdy = player.y - DRENWICK_SCHOOL_BOARD.y;
        if (Math.sqrt(brdx * brdx + brdy * brdy) < TALK_RADIUS) {
          dialogue.name  = 'Placements Board';
          dialogue.pages = [
            ['GUILD APPRENTICESHIPS \u2014 CURRENT CYCLE',
             'Canal Engineers\u2019 Guild: one position, second apprentice. Preference for candidates with arithmetic certification. Apply in person to the guild office.'],
            ['Imperial Grain Office, Drenwick: one clerk intake position.',
             'Shortlist reviewed by district registry. No direct applications \u2014 refer to Ms. Farne.',
             '\u2014',
             'Further positions will be posted as confirmed. Write directly to the relevant office for unlisted enquiries.'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // Basement archive
      if (activeMap === DRENWICK_SCHOOL_BASEMENT_MAP) {
        // ── Wall display: mounted copy of the Accord of Threads ──────────────
        // Moved from the lower bookshelf to a proper framed display on the north wall.
        const wdx = player.x - DRENWICK_SCHOOL_ACCORD_DISPLAY.x;
        const wdy = player.y - DRENWICK_SCHOOL_ACCORD_DISPLAY.y;
        if (Math.sqrt(wdx * wdx + wdy * wdy) < TALK_RADIUS * 1.6) {
          dialogue.name  = 'Wall Display';
          dialogue.pages = [
            ['A framed document mounted under glass.',
             'The title plate reads: \u2018ACCORD OF THREADS\u2019.',
             '\u2018Imperial Instrument No. 7 of Year 700 \u2014 in full.\u2019'],
          ];
          dialogue.callbacks = [function() {
            choice.title   = 'Accord of Threads';
            choice.options = ['Read the full instrument', 'Leave it'];
            choice.cursor  = 0;
            choice.callbacks = [
              function readAccord() {
                // Open the dedicated accord panel rather than the dialogue box.
                // Text is unchanged — just displayed in a wider, paginated reader.
                accordPanel.pages = [
                  // Title page
                  ['IMPERIAL INSTRUMENT NO. 7 OF YEAR 700',
                   'On the Harmonisation of Enforcement Standards in Respect of Persistent Heritable Conditions Among the Imperial Subject Population, Together with Provisions for Registry, Oversight, and the Revision of Prior Death Warrants Issued Under Statutes of the Third Year After Century and Thereafter.',
                   'Known commonly as: The Accord of Threads.'],
                  // Preamble pt 1
                  ['PREAMBLE',
                   'In recognition of existing realities, and in furtherance of the Empire\u2019s enduring charge to preserve order, continuity, and the common peace of the realm, let it be declared and set forth as follows.',
                   'From the founding of unified time and law, the Empire has borne responsibility for the safety of its subjects and the integrity of its dominion. In the discharge of that responsibility, prior statutes were enacted to address certain conditions observed among the population, deemed at the time to pose grave and immediate risk to public order.'],
                  // Preamble pt 2
                  ['In the long years since, the realm has changed. The reach of law has extended. Knowledge has advanced. Conditions once addressed solely by exclusion and final remedy are now more fully understood in their persistence and effect.',
                   'It is neither just nor practicable that governance remain bound to instruments no longer suited to the realities they were meant to contain.'],
                  // Preamble pt 3
                  ['Accordingly, and without prejudice to the authority of the Empire to act in defense of the realm, this Accord is issued to bring existing law into alignment with present necessity; to replace inconsistent application with uniform governance; and to establish a durable framework by which certain inherent conditions, observable among a minority of subjects, may be addressed without recourse to disorder, concealment, or unchecked harm.',
                   'This Accord does not diminish the sovereignty of the Empire, nor does it excuse noncompliance with lawful authority. Rather, it affirms that stability is best preserved where law is made explicit, oversight is continuous, and responsibility is shared.',
                   'Let it therefore be known that the provisions herein are declared binding throughout the realm and its dominions, subject to lawful administration by the Empire and its duly constituted authorities, from this day forward and without term. So ordered.'],
                  // Article I
                  ['ARTICLE I \u2014 ON THE RESCISSION OF PRIOR DEATH WARRANTS',
                   'All warrants, statutes, proclamations, and delegated authorities enacted under Imperial Law in the Third Year After Century and thereafter, insofar as they prescribe death, immediate execution, or irreversible penalty solely on the basis of the condition herein addressed, are hereby rescinded.',
                   'No person shall, from the issuance of this Accord forward, be subject to summary execution, extrajudicial killing, or standing death warrant by reason of such condition alone.'],
                  // Article I cont.
                  ['This rescission shall apply notwithstanding the date of issuance of any prior order, decree, or local judgment, whether dormant or active, and such instruments shall be held invalid where they conflict with the provisions herein.',
                   'Nothing in this Article shall be construed to limit the authority of the Empire or its duly empowered agents to impose penalties, including death, for acts of violence, sedition, concealment, or refusal of lawful compliance, where such acts are established under prevailing law.',
                   'The withdrawal of prior death warrants shall not be interpreted as absolution for past acts, nor as immunity from future judgment, but as a correction of method in the maintenance of order.'],
                  // Article II
                  ['ARTICLE II \u2014 ON THE RECOGNITION OF A PERSISTENT CONDITION',
                   'It is acknowledged that a persistent and inhering condition exists among a minority of subjects of the Empire, observable through outward and measurable signs, and known to manifest without regard to lineage, inheritance, or intent.',
                   'Such condition shall be understood to arise at birth, to endure through life, and to be neither voluntarily assumed nor divested by the person so affected.'],
                  // Article II cont.
                  ['The presence of this condition shall not, in itself, constitute guilt, criminality, or intent to harm; however, where its manifestation bears upon public safety, civic order, or the integrity of law, it shall be subject to regulation as herein provided.',
                   'Determination of the presence of the condition shall rest with duly appointed authorities of the Empire, acting in accordance with uniform standards and established notice. No private judgment, customary practice, or local belief shall supersede such determination once made.'],
                  // Article III
                  ['ARTICLE III \u2014 ON NOTICE, REGISTRY, AND OBLIGATION TO REPORT',
                   'In order that the provisions of this Accord may be administered with consistency and restraint, the Empire shall maintain a Registry of persons determined to bear the condition described herein.',
                   'Notice of the presence or reasonable suspicion of such condition shall be made without delay to imperial or delegated authority by: parents or guardians; those attending birth or early care; and any magistrate, healer, or officer acting in an official capacity.'],
                  // Article III cont.
                  ['Where notice is willfully withheld, obscured, or delayed, liability shall extend not only to the individual so withholding, but to any person or body acting in concert to effect such concealment, as shall be determined under law.',
                   'Failure of notice shall constitute a material breach of civic obligation and may give rise to penalties upon individuals, households, or communities, according to statute.',
                   'Registration shall not be optional, nor shall concealment be excused by custom, fear, or private judgment.'],
                  // Article IV
                  ['ARTICLE IV \u2014 ON EVALUATION, INSTRUCTION, AND COMPULSORY ATTENDANCE',
                   'Where a person is determined to bear the condition described herein, the Empire may require evaluation, instruction, or supervised containment, as necessary to preserve public order and prevent harm.',
                   'For this purpose, an Academy shall be established under imperial authority, empowered to assess, instruct, and certify such persons according to standards set forth by the Council of Thirty-Three.',
                   'Attendance, when directed, shall be mandatory. Refusal, evasion, or resistance shall constitute noncompliance with lawful authority and shall be punishable by penalties up to and including death, as determined by competent judgment.',
                   'Completion of instruction shall not, in itself, extinguish oversight, nor shall it confer immunity from further regulation.'],
                  // Article V
                  ['ARTICLE V \u2014 ON PROPERTY AND CIVIC BALANCE',
                   'Persons recognized under this Accord may hold property, enter contracts, and conduct lawful enterprise as subjects of the Empire, and shall not be dispossessed by reason of condition alone.',
                   'However, where the exercise of such condition may reasonably be expected to influence value, outcome, safety, or public confidence, the Empire reserves the right to regulate, limit, license, or sequester such property or enterprise in the interest of civic balance.'],
                  // Article V cont.
                  ['No accumulation of land, capital, labor, or obligation shall be permitted where the stability of the realm may become contingent upon the restraint, presence, or favor of any such person.',
                   'Distinct obligations of disclosure, inspection, levy, or limitation may be imposed by statute where required for public order.',
                   'Nothing in this Article shall be construed to grant immunity from future regulation, nor to deny the ordinary use of property consistent with law.'],
                  // Article VI
                  ['ARTICLE VI \u2014 ON LICENSE, STANDING, AND CONTINUED COMPLIANCE',
                   'Where instruction or evaluation has been completed in accordance with this Accord, the Empire may grant certification permitting the lawful exercise of ordinary civic life under continued oversight.',
                   'Such certification shall constitute a license of standing, contingent upon ongoing compliance with imperial law and regulation.',
                   'Certification may be suspended, restricted, or revoked where conduct, concealment, instability, or refusal of lawful directive is established, and such revocation shall restore the Empire\u2019s full authority to act in defense of the realm.',
                   'No person shall claim entitlement to standing by reason of prior compliance alone.'],
                  // Article VII
                  ['ARTICLE VII \u2014 ON DEFERENCE, DELEGATION, AND LOCAL ADMINISTRATION',
                   'The provisions of this Accord shall apply throughout the realm and its dominions. Administration thereof may be delegated to provincial, municipal, or customary authorities, provided such administration does not contravene the substance of this Accord.',
                   'Where local law is silent, inconsistent, or inadequate, imperial authority shall prevail.',
                   'Nothing herein shall be interpreted to require uniform method where uniform outcome is achieved.'],
                  // Article VIII
                  ['ARTICLE VIII \u2014 ON INTERPRETATION AND AUTHORITY',
                   'Interpretation of this Accord, and of statutes arising therefrom, shall rest with the Council of Thirty-Three, acting in concert with duly constituted imperial courts.',
                   'No local decree, customary judgment, or private interpretation shall supersede the determinations so made.',
                   'Where ambiguity arises, such ambiguity shall be resolved in favor of public order and continuity of governance.'],
                  // Article IX
                  ['ARTICLE IX \u2014 ON CONTINUITY AND SUPREMACY',
                   'This Accord shall stand as binding law from the date of its issuance. All statutes, customs, or instruments inconsistent herewith are superseded to the extent of such inconsistency.',
                   'Amendments, where permitted, shall be enacted only by lawful authority and shall not impair the central provisions herein without express declaration.'],
                  // Seal
                  ['SEAL AND DATING',
                   'Issued under the Seal of the Empire, in the presence of the Council of Thirty-Three, in the Seven Hundredth Year After Century, and entered into force forthwith.'],
                ];
                accordPanel.page = 0;
                accordPanel.open = true;
              },
              function leave() {
                // do nothing
              },
            ];
            choice.open = true;
          }];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
        // ── Lower bookshelf: general archive material (no longer holds the Accord) ──
        const bsx = player.x - DRENWICK_SCHOOL_BOOKSHELF.x;
        const bsy = player.y - DRENWICK_SCHOOL_BOOKSHELF.y;
        if (Math.sqrt(bsx * bsx + bsy * bsy) < TALK_RADIUS) {
          dialogue.name  = 'Archive Bookshelf';
          dialogue.pages = [
            ['Bound ledgers, most unlabelled.',
             'Canal traffic records from decades back. Inspection logs.',
             'One volume is catalogued: \u2018Classification Registers, Drenwick District, Years 680-695.\u2019',
             'It\u2019s been checked out and never returned. The slip inside says the borrower was Orwen.'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      interactSimpleNPCs();
    } else if (inTown && townBuilding === 'harbormaster') {
      // Weighmaster counter — the balance scale and cargo log
      const wmx = player.x - DRENWICK_WEIGHMASTER_COUNTER.x;
      const wmy = player.y - DRENWICK_WEIGHMASTER_COUNTER.y;
      if (Math.sqrt(wmx * wmx + wmy * wmy) < TALK_RADIUS) {
        dialogue.name  = 'Weighmaster Counter';
        dialogue.pages = [
          ['A balance scale sits at one end, calibration weights in a rack beside it.',
           'The day\u2019s log is open to a half-filled page. Each entry records cargo type, declared weight, certified weight, and the certifying officer.'],
          ['The most recent entry: \u2018Reed bales, 14 units. Declared 420 stone. Certified 418 stone. Variance within tolerance.\u2019'],
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      // Navigation charts — rolled and stacked on the north shelf
      const chx = player.x - HARBOR_CHARTS.x;
      const chy = player.y - HARBOR_CHARTS.y;
      if (Math.sqrt(chx * chx + chy * chy) < TALK_RADIUS) {
        dialogue.name  = 'Navigation Charts';
        dialogue.pages = [
          ['A row of rolled charts, each tied with a red cord and labelled in a cramped hand.',
           'One is unrolled partially — a survey of the main channel and its tributary sluice gates, with depth markings at each lock point.'],
          ['A notation at the bottom corner: \u2018Section B-7 shoaling. Reported to district. No action taken. — R.\u2019',
           'Below that, in different ink: \u2018Reported again. Still no action. — R.\u2019'],
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      // Mooring log — the traffic and berth record on the east counter
      const mlx = player.x - HARBOR_MOORING_LOG.x;
      const mly = player.y - HARBOR_MOORING_LOG.y;
      if (Math.sqrt(mlx * mlx + mly * mly) < TALK_RADIUS) {
        dialogue.name  = 'Mooring Log';
        dialogue.pages = [
          ['A bound ledger lying open on the counter. Each entry records vessel name, origin, cargo, berth number, and days moored.',
           'Recent arrivals: the \u2018Needham Stout\u2019 (grain, three days), the \u2018Fen Runner\u2019 (pressed reed, one day), and an unnamed flatboat noted only as \u2018unladen, private.\u2019'],
          ['A note in red ink at the bottom of the page: \u2018Unladen vessels using berth without cargo declaration to be reported to the district officer on third occurrence.\u2019',
           'The tally mark beside it shows: two.'],
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      // Harbormaster Renn — Weight Discrepancy quest (interior, work days only)
      if (day % 5 !== 0) {
        const rennInt = SIMPLE_NPCS.find(n => n.id === 'harbormaster_interior');
        if (rennInt) {
          const rdx = player.x - rennInt.x;
          const rdy = player.y - rennInt.y;
          if (Math.sqrt(rdx * rdx + rdy * rdy) < TALK_RADIUS) {
            if (weight_quest_stage === 0) {
              // First approach — Renn explains the problem; player can accept or decline
              dialogue.name  = 'Harbormaster Renn';
              dialogue.pages = [
                ['\u201cYou saw the notice?\u201d',
                 '\u201cGood. I\u2019ve had a certificate sitting on this desk for three weeks that doesn\u2019t match what the Calwick office has on record.\u201d'],
                ['\u201cA barge came through — standard grain load, properly declared.\u201d',
                 '\u201cMy certified weight is 312 stone. The Calwick ledger entry, copied here, says 304.\u201d',
                 '\u201cEight stone. That\u2019s not a transcription error.\u201d'],
                ['\u201cI need someone to carry this query note to the district records clerk in Calwick.',
                 '\u2018Aldric\u2019 — he\u2019ll know the entry I mean.\u201d',
                 '\u201cThere may be a countersignature required. Corvin keeps the ledger for that period.\u201d'],
              ];
              dialogue.callbacks = [function() {
                choice.title     = 'Harbormaster Renn';
                choice.options   = ['Take the query', 'Not now'];
                choice.cursor    = 0;
                choice.callbacks = [
                  function take() {
                    weight_quest_stage = 1;
                    refreshJobBoard();
                    syncQuestFlagsToWindow();
                    dialogue.name  = 'Harbormaster Renn';
                    dialogue.pages = [
                      ['\u201cAldric. District records, Calwick office.\u201d',
                       '\u201cHe\u2019ll understand the note.\u201d',
                       '\u201cCome back once it\u2019s resolved.\u201d'],
                    ];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                  function notNow() {
                    dialogue.name  = 'Harbormaster Renn';
                    dialogue.pages = [['\u201cThe query will still be here.\u201d']];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                ];
                choice.open = true;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (weight_quest_stage === 1) {
              dialogue.name  = 'Harbormaster Renn';
              dialogue.pages = [['\u201cAldric. District records, Calwick.\u201d',
                                  '\u201cBring the countersigned note back when you have it.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (weight_quest_stage === 2) {
              dialogue.name  = 'Harbormaster Renn';
              dialogue.pages = [['\u201cCorvin\u2019s countersignature — that\u2019s what Aldric needs?\u201d',
                                  '\u201cCorvin\u2019s in the office most days. Inn on the fifth.\u201d',
                                  '\u201cBring it back once he\u2019s signed.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (weight_quest_stage === 3) {
              // Player returns with Corvin's note — Renn pays
              dialogue.name  = 'Harbormaster Renn';
              dialogue.pages = [
                ['\u201cBoth signatures.\u201d',
                 'He checks the note against the original entry.',
                 '\u201cTranscription error on the Calwick side. Corvin\u2019s figure matches mine.\u201d'],
                ['\u201cI\u2019ll file the correction with the district.\u201d',
                 '\u201cIt\u2019s a small thing. But these things add up over a season.\u201d'],
                ['\u201cSixty gold for your time.\u201d',
                 '\u201cThe district would take a month to process this. You did it in a day.\u201d'],
              ];
              dialogue.callbacks = [function() {
                stats.gold += 60;
                weight_quest_stage = 4;
                refreshJobBoard();
                syncQuestFlagsToWindow();
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else {
              dialogue.name  = 'Harbormaster Renn';
              dialogue.pages = [['\u201cVariance note\u2019s filed. District will process it in its own time.\u201d',
                                  '\u201cThank you for that.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
      }
      interactSimpleNPCs();
    } else if (inTown && townBuilding === 'guild_hall' && currentTownId === 'drenwick') {
      // Posting board — northeast corner of the hall
      const gbx = player.x - GUILD_HALL_BOARD.x;
      const gby = player.y - GUILD_HALL_BOARD.y;
      if (Math.sqrt(gbx * gbx + gby * gby) < TALK_RADIUS) {
        dialogue.name  = 'Posting Board';
        dialogue.pages = [
          ['CANAL ENGINEERS\u2019 GUILD \u2014 CURRENT NOTICES'],
          ['APPRENTICE POST (2nd, east line)\n'
           + 'Arithmetic certification required. Apply in person to the registrar.',
           'Shortlist reviewed fourth day of each cycle.'],
          ['DUES REMINDER: All members, cycle 4.',
           'Late dues carry a standard surcharge.',
           'Queries to Foss.'],
          ['TENDERS \u2014 East sluice remediation, phase 2.',
           'Guild members holding level 3 gate certification may apply.',
           'Work commences subject to district approval.'],
          ['Members\u2019 Notice (handwritten, pinned at an angle):',
           '\u201cWhoever has been borrowing the survey rod from the equipment room \u2014',
           'please sign it out. That is all.\u201d'],
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      interactSimpleNPCs();
    } else if (inTown && townBuilding === 'wash_house') {
      // Posted notice — hours and rules on the east wall of the basin row
      const wnx = player.x - WASH_NOTICE.x;
      const wny = player.y - WASH_NOTICE.y;
      if (Math.sqrt(wnx * wnx + wny * wny) < TALK_RADIUS) {
        dialogue.name  = 'Posted Notice';
        dialogue.pages = [
          ['DRENWICK CIVIC WASH HOUSE',
           'Hot water: first bell to third bell. Cold basin available all hours.',
           'Rate: two coins. Includes soap and towel hire.',
           'Return towels before leaving. Lost towels billed to the household register.'],
          ['No more than three persons to a basin at one time.',
           'Children under ten must be accompanied.',
           'The management reserves the right to refuse service to those causing a disturbance.',
           '\u2014 District Civic Office, Drenwick'],
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      // Communal wash basins — wash area center of the room
      const wbx = player.x - WASH_BASIN.x;
      const wby = player.y - WASH_BASIN.y;
      if (Math.sqrt(wbx * wbx + wby * wby) < TALK_RADIUS) {
        choice.title     = 'Wash House';
        choice.options   = ['Wash  (2g)', 'Leave'];
        choice.cursor    = 0;
        choice.callbacks = [
          function wash() {
            if (stats.gold >= 2) {
              const wasMuddied = hasStatusEffect('muddied');
              stats.gold -= 2;
              if (wasMuddied) removeStatusEffect('muddied');
              const midLine = wasMuddied
                ? 'The mud loosens. It takes a few changes before the water runs clear.'
                : 'You spend longer than you meant to.';
              dialogue.name  = '';
              dialogue.pages = [
                ['The water is warm.', midLine],
                ['You feel considerably more human.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else {
              dialogue.name  = '';
              dialogue.pages = [['Kern\u2019s rate is two coins.', 'You\u2019re short.']];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
          },
          function leave() {},
        ];
        choice.open = true;
        return;
      }
      interactSimpleNPCs();
    } else if (inTown && townBuilding === 'provision_store') {
      // Allocation manifest on east shelving
      const mnx = player.x - DRENWICK_PROVISION_MANIFEST.x;
      const mny = player.y - DRENWICK_PROVISION_MANIFEST.y;
      if (Math.sqrt(mnx * mnx + mny * mny) < TALK_RADIUS) {
        dialogue.name  = 'Allocation Manifest';
        dialogue.pages = [
          ['IMPERIAL CIVIC PROVISIONS \u2014 CURRENT CYCLE',
           'Dry rations: allocated. Salted catch: allocated. Preserved roots: partial allocation, next delivery cycle 4.',
           'Reed oil: awaiting delivery. Preserved fruit: out of stock.'],
          ['At the bottom, a handwritten amendment: \u2018Reed oil delivery delayed pending route inspection north of Thornmere. No revised date confirmed.\u2019',
           'The amendment is signed with an initial and an official stamp \u2014 the ink slightly smeared.'],
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      // Central stock crates — inspect the stamped imperial goods
      const scx = player.x - PROVISION_STOCK_CRATE.x;
      const scy = player.y - PROVISION_STOCK_CRATE.y;
      if (Math.sqrt(scx * scx + scy * scy) < TALK_RADIUS) {
        dialogue.name  = 'Stock Crates';
        dialogue.pages = [
          ['Heavy wooden crates stamped with the imperial supply mark \u2014 a red cross on a field of ochre.',
           'The stencil is slightly off-centre on two of them, as if applied in haste or by someone unfamiliar with the stamp.'],
          ['The nearest crate is stencilled: \u2018SALTED CATCH \u2014 CYCLE 4 \u2014 DRENWICK CIVIC\u2019.',
           'A smaller mark below reads \u2018INSPECT BEFORE WEEK 2.\u2019',
           'It is currently week three.'],
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      interactSimpleNPCs();
    } else if (inTown && townBuilding === 'tavern' && currentTownId === 'drenwick') {
      // Brenn the keeper \u2014 sells Mushroom Wine
      const tkx = player.x - DRENWICK_TAVERN_KEEPER.x;
      const tky = player.y - DRENWICK_TAVERN_KEEPER.y;
      if (Math.sqrt(tkx * tkx + tky * tky) < TALK_RADIUS) {
        dialogue.name  = 'Brenn';
        dialogue.pages = [
          ['\u201cQuiet night.\u201d',
           'He wipes down the counter without looking up.',
           '\u201cFunny how the waterfront gets loud and then\u2014 nothing.\u201d'],
          ['\u201cGot mushroom wine in, if you want it.',
           'Comes up from the fen settlements. Eight gold a cup.',
           'It\u2019s\u2026 something.\u201d'],
        ];
        dialogue.callbacks = [function() {
          choice.title     = 'Brenn';
          choice.options   = ['Buy Mushroom Wine  (8g)', 'Leave'];
          choice.cursor    = 0;
          choice.callbacks = [
            function buy() {
              if (stats.gold >= 8) {
                stats.gold -= 8;
                stats.items.push({ name: 'Mushroom Wine', type: 'potion', heals: 5, questItem: true, price: 8 });
                dialogue.name  = 'Brenn';
                dialogue.pages = [
                  ['\u201cThere you go.\u201d',
                   'He sets the cup on the counter and slides it across with two fingers.',
                   '\u201cDon\u2019t think about it too hard.\u201d'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              } else {
                dialogue.name  = 'Brenn';
                dialogue.pages = [['\u201cNot quite enough.\u201d']];
                dialogue.open  = true;
                dialogue.page  = 0;
              }
            },
            function leave() {},
          ];
          choice.open = true;
        }];
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      interactSimpleNPCs();
      return;
    } else if (inTown && townBuilding === 'house') {
      // ── Den Wraith encounter (west_i, Dayoff only, quest active) ─────────────
      if (currentHouseId === 'west_i' && den_wraith_quest_started && !den_wraith_defeated) {
        const dwx = player.x - DEN_WRAITH.x;
        const dwy = player.y - DEN_WRAITH.y;
        if (Math.sqrt(dwx * dwx + dwy * dwy) < TALK_RADIUS) {
          dialogue.name  = '';
          dialogue.pages = [
            ['Something shifts in the corner.', 'It turns toward you.'],
          ];
          dialogue.triggerDenWraithCombat = true;
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // ── Cat Armor chest (player_house secret pocket, Day 2+) ─────────────
      if (currentHouseId === 'player_house' && day >= 2 && !CAT_ARMOR_CHEST.opened) {
        const cax = player.x - CAT_ARMOR_CHEST.x;
        const cay = player.y - CAT_ARMOR_CHEST.y;
        if (Math.sqrt(cax * cax + cay * cay) < TALK_RADIUS) {
          CAT_ARMOR_CHEST.opened = true;
          const it = CAT_ARMOR_CHEST.item;
          stats.items.push({ name: it.name, type: it.type, bonus: it.bonus, price: it.price });
          dialogue.name  = '';
          dialogue.pages = [['There is something here after all.',
                             `\u2014 ${it.name} found.`,
                             `(${itemStatLabel(it)})  \u2014 added to items.`]];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      const hd = HOUSE_DATA[currentHouseId];
      if (hd && hd.hearth) {
        const hdx = player.x - hd.hearth.x;
        const hdy = player.y - hd.hearth.y;
        if (Math.sqrt(hdx * hdx + hdy * hdy) < TALK_RADIUS) {
          dialogue.name  = 'Hearth';
          dialogue.pages = [['The fire gives off a steady, even warmth.']];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      if (hd && hd.cat) {
        const cdx = player.x - hd.cat.x;
        const cdy = player.y - hd.cat.y;
        if (Math.sqrt(cdx * cdx + cdy * cdy) < TALK_RADIUS) {
          // ── Stage 1: cat drops a coin (first visit after first rest) ────────
          if (cat_quest_stage === 1) {
            dialogue.name  = '';
            dialogue.pages = [
              ['The cat sets something at your feet and backs away, watching.'],
              ['A small tarnished disc.',
               'Old currency \u2014 pre-Empire, from the markings.',
               'Worn smooth. Not worth anything now.'],
              ['You have no idea where it found this.'],
            ];
            dialogue.callbacks = [function() {
              cat_quest_stage = 2;
              syncQuestFlagsToWindow();
            }];
            dialogue.open  = true;
            dialogue.page  = 0;
            return;
          }
          // ── Stage 2: player can look in the corner ──────────────────────────
          if (cat_quest_stage === 2) {
            choice.title     = '';
            choice.options   = ['Look in the corner', 'Pet', 'Leave'];
            choice.cursor    = 0;
            choice.callbacks = [
              function look() {
                dialogue.name  = '';
                dialogue.pages = [
                  ['Under the table, in the far corner.'],
                  ['Three more coins. A glass button.',
                   'A folded scrap of paper, water-damaged, unreadable.',
                   'A small iron key \u2014 slightly bent \u2014 that fits nothing you own.'],
                  ['The cat watches you from the doorway.',
                   'It doesn\u2019t seem concerned.'],
                  ['You scratch it behind the ears on your way past.',
                   'It tolerates this.'],
                ];
                dialogue.callbacks = [function() {
                  cat_quest_stage = 3;
                  syncQuestFlagsToWindow();
                }];
                dialogue.open  = true;
                dialogue.page  = 0;
              },
              function pet() {
                dialogue.name  = '';
                dialogue.pages = [catPetResponse()];
                dialogue.open  = true;
                dialogue.page  = 0;
              },
              function leave() {},
            ];
            choice.open = true;
            return;
          }
          // ── Default: normal pet interaction ─────────────────────────────────
          choice.title     = '';
          choice.options   = ['Pet', 'Leave'];
          choice.cursor    = 0;
          choice.callbacks = [
            function pet() {
              dialogue.name  = '';
              dialogue.pages = [catPetResponse()];
              dialogue.open  = true;
              dialogue.page  = 0;
            },
            function leave() {},
          ];
          choice.open = true;
          return;
        }
      }
      if (hd && hd.stove) {
        const sdx = player.x - hd.stove.x;
        const sdy = player.y - hd.stove.y;
        if (Math.sqrt(sdx * sdx + sdy * sdy) < TALK_RADIUS) {
          dialogue.name  = 'Stove';
          dialogue.pages = [['slightly rusting from humidity']];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      if (hd && hd.bed) {
        const bdx = player.x - hd.bed.x;
        const bdy = player.y - hd.bed.y;
        if (Math.sqrt(bdx * bdx + bdy * bdy) < TALK_RADIUS) {
          if (hd.bed.canRest) {
            choice.title     = 'Bed';
            choice.options   = ['Rest', 'Leave'];
            choice.cursor    = 0;
            choice.callbacks = [
              function rest() {
                stats.hp = stats.maxHp;
                if (hasStatusEffect('poison'))  removeStatusEffect('poison');
                if (hasStatusEffect('muddied')) removeStatusEffect('muddied');
                if (hasStatusEffect('slither')) removeStatusEffect('slither');
                if (hasStatusEffect('cursed'))  removeStatusEffect('cursed');
                day++;
                console.log('[day] now day', day, '\u2014 isDayOff:', isDayOff());
                if (cat_quest_stage === 0) { cat_quest_stage = 1; syncQuestFlagsToWindow(); }
                if (day % 7 === 3) {
                  const dreamIdx = Math.floor(day / 7) % DREAMS.length;
                  dialogue.name  = '';
                  dialogue.pages = DREAMS[dreamIdx];
                  dialogue.open  = true;
                  dialogue.page  = 0;
                }
              },
              function leave() {},
            ];
            choice.open = true;
          } else {
            dialogue.name  = 'Bed';
            dialogue.pages = [[hd.bed.inspect || 'Better not.']];
            dialogue.open  = true;
            dialogue.page  = 0;
          }
          return;
        }
      }
      // ── Home chest (player_house only) — bank-style deposit/withdraw ──────
      if (hd && hd.chest) {
        const chx = player.x - hd.chest.x;
        const chy = player.y - hd.chest.y;
        if (Math.sqrt(chx * chx + chy * chy) < TALK_RADIUS) {
          const inChest = hd.chest.gold;
          const inPocket = stats.gold;
          const opts = [];
          const cbs  = [];
          if (inChest > 0) {
            opts.push('Take all  (' + inChest + 'g)');
            cbs.push(function takeAll() {
              const taken = hd.chest.gold;
              stats.gold     += taken;
              hd.chest.gold   = 0;
              dialogue.name   = 'Chest';
              dialogue.pages  = [['You take ' + taken + 'g from the chest.', 'Pocket: ' + stats.gold + 'g.  Chest: 0g.']];
              dialogue.open   = true;
              dialogue.page   = 0;
            });
          }
          if (inPocket > 0) {
            opts.push('Deposit amount\u2026');
            cbs.push(function depositAmount() {
              const raw = window.prompt('Deposit how much? (carrying ' + inPocket + 'g)');
              if (raw === null) return;
              const amount = Math.floor(Number(raw));
              if (!amount || amount <= 0) {
                dialogue.name  = 'Chest';
                dialogue.pages = [['Not a valid amount.']];
                dialogue.open  = true;
                dialogue.page  = 0;
                return;
              }
              const deposited = Math.min(amount, stats.gold);
              hd.chest.gold  += deposited;
              stats.gold     -= deposited;
              dialogue.name   = 'Chest';
              dialogue.pages  = [['You deposit ' + deposited + 'g.', 'Pocket: ' + stats.gold + 'g.  Chest: ' + hd.chest.gold + 'g.']];
              dialogue.open   = true;
              dialogue.page   = 0;
            });
            opts.push('Deposit all  (' + inPocket + 'g)');
            cbs.push(function depositAll() {
              const deposited = stats.gold;
              hd.chest.gold  += deposited;
              stats.gold      = 0;
              dialogue.name   = 'Chest';
              dialogue.pages  = [['You deposit ' + deposited + 'g.', 'Pocket: 0g.  Chest: ' + hd.chest.gold + 'g.']];
              dialogue.open   = true;
              dialogue.page   = 0;
            });
          }
          if (opts.length === 0) {
            dialogue.name  = 'Chest';
            dialogue.pages = [['This is where you keep your life savings.', 'Right now there\u2019s nothing in it \u2014 and nothing in your pockets either.']];
            dialogue.open  = true;
            dialogue.page  = 0;
            return;
          }
          opts.push('Close');
          cbs.push(function close() {});
          choice.title     = 'Chest \u2014 Life Savings';
          choice.options   = opts;
          choice.cursor    = 0;
          choice.callbacks = cbs;
          choice.open      = true;
          return;
        }
      }
      // ── Bookshelf ──────────────────────────────────────────────────────────
      if (hd && hd.bookshelf) {
        const bsx = player.x - hd.bookshelf.x;
        const bsy = player.y - hd.bookshelf.y;
        if (Math.sqrt(bsx * bsx + bsy * bsy) < TALK_RADIUS) {
          dialogue.name  = 'Bookshelf';
          dialogue.pages = currentHouseId === 'drenwick_west_a'
            ? [
                ['A shelf of books organised by size rather than subject.',
                 'District registries. Transfer records. A catalogue of eastern wetland settlements.',
                 'A page has been folded down in the catalogue. Someone was looking for something.'],
                ['At the end of the row, a small volume of handwritten notes.',
                 'The entries are dated. The most recent is recent.'],
              ]
            : [
                ['Trade almanacs. A volume on canal engineering. A register of tariffs.',
                 'The practical library of someone who works with numbers.'],
                ['At the far end, a slim book of fen songs.',
                 'Its spine is the most worn of any of them.'],
              ];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // ── Dresser — searchable furniture, yields a couple items once ─────────
      if (hd && hd.dresser) {
        const ddx = player.x - hd.dresser.x;
        const ddy = player.y - hd.dresser.y;
        if (Math.sqrt(ddx * ddx + ddy * ddy) < TALK_RADIUS) {
          dialogue.name = 'Dresser';
          if (!hd.dresser.looted) {
            hd.dresser.looted = true;
            stats.items.push({ name: 'Potion',      type: 'potion', heals: 20, price: 30 });
            stats.items.push({ name: 'Reed Remedy', type: 'potion', heals: 0, curesPoison: true, price: 50 });
            dialogue.pages = [
              ['You work the swollen drawers open. Most are empty.',
               'In the bottom one, wrapped in a rag: a stoppered potion and a twist of reed remedy.'],
              ['Found: Potion, Reed Remedy.'],
            ];
          } else {
            dialogue.pages = [['The drawers hang open now. Nothing left but dust and a lost button.']];
          }
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
      }
      // ── Floor sparkle — one-time Tweezers pickup ───────────────────────────
      if (hd && hd.sparkle && !hd.sparkle.taken) {
        const spdx = player.x - hd.sparkle.x;
        const spdy = player.y - hd.sparkle.y;
        if (Math.sqrt(spdx * spdx + spdy * spdy) < TALK_RADIUS) {
          hd.sparkle.taken = true;
          stats.items.push({ name: 'Tweezers', type: 'accessory', bonus: 0, price: 0, questItem: true, keyItem: true });
          dialogue.name  = '';
          dialogue.pages = [
            ['Something glints between the floorboards.',
             'You work it loose — a small pair of steel tweezers, still bright.'],
            ['Got Tweezers.'],
          ];
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
      }
      // ── Window ─────────────────────────────────────────────────────────────
      if (hd && hd.window) {
        const wdx = player.x - hd.window.x;
        const wdy = player.y - hd.window.y;
        if (Math.sqrt(wdx * wdx + wdy * wdy) < TALK_RADIUS) {
          const windowViews = {
            drenwick_west_a: [
              ['The fen road runs south past the canal edge.',
               'The reed beds begin where the paving ends.',
               'On a clear day you can see the old footbridge from here.'],
            ],
            drenwick_west_b: [
              ['A narrow gap between the rooftops of the neighbouring houses.',
               'The canal surface is visible — catching the light this morning.',
               'A flatboat moving north. Loaded low in the water.'],
            ],
            drenwick_north_a: [
              ['The north lane below.',
               'Two carts parked side by side, not yet moving.',
               'Chimney smoke from the house opposite. The air looks cold.'],
            ],
            drenwick_north_b: [
              ['Rooftops and an open sky.',
               'Someone has hung washing between the buildings.',
               'It is not dry yet. It may not be dry later, either.'],
            ],
            drenwick_south_a: [
              ['The south road narrows before the gatehouse.',
               'A dog is sitting in the middle of it.',
               'This appears to be deliberate.'],
            ],
            drenwick_south_b: [
              ['Three houses, then the canal.',
               'Grey water \u2014 not dark, just the ordinary grey of a fen morning.',
               'A heron on the far bank. Unmoving.'],
            ],
            drenwick_south_c: [
              ['The alley between the south block and the canal wall.',
               'A stack of reed bundles that has been there for some time.',
               'A bird is sitting on them. It seems settled.'],
            ],
          };
          dialogue.name  = '';
          dialogue.pages = windowViews[currentHouseId] || [['The view is obscured.']];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // ── North window (player's house) ──────────────────────────────────────
      if (hd && hd.northWindow) {
        const nwdx = player.x - hd.northWindow.x;
        const nwdy = player.y - hd.northWindow.y;
        if (Math.sqrt(nwdx * nwdx + nwdy * nwdy) < TALK_RADIUS) {
          dialogue.name  = '';
          dialogue.pages = [
            ['The north window. The morning sun comes in low over the rooftops opposite.',
             'Light falls across the boards in a long, warm slant — the same as every morning.'],
            ['The square is quiet below. Dry. It has been dry for a long time now.',
             'No cloud to speak of. There won’t be rain today either.'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      // ── Letter Quest: Dessa (Drenwick west_a) ──────────────────────────────
      if (currentHouseId === 'drenwick_west_a') {
        const dessa = SIMPLE_NPCS.find(n => n.id === 'dessa');
        if (dessa) {
          const ddx = player.x - dessa.x;
          const ddy = player.y - dessa.y;
          if (Math.sqrt(ddx * ddx + ddy * ddy) < TALK_RADIUS) {

            if (letter_quest_stage === 0) {
              if (!dessa_met) {
                // ── First contact: brief introduction, no quest yet ─────────
                // Dessa is cautious — she doesn't unburden herself to strangers.
                dialogue.name  = 'Dessa';
                dialogue.pages = [
                  ['Dessa.',
                   'Canal trade for most of my working life.',
                   'You\u2019re not from this stretch, are you.'],
                  ['You work for the Empire office.',
                   'I\u2019ve seen the uniform.',
                   'No offence meant.'],
                  ['Come back another time.',
                   'I might have a question for you.'],
                ];
                dialogue.callbacks = [function() {
                  dessa_met = true;
                  syncQuestFlagsToWindow();
                }];
                dialogue.open  = true;
                dialogue.page  = 0;
              } else {
                // ── Trip 1: quest offer (second visit onward) ───────────────
                dialogue.name  = 'Dessa';
                dialogue.pages = [
                  ['I\u2019ve been trying to reach my sister.',
                   'Her name is Yael.',
                   'She was classified rareborn when she was eleven \u2014 green thread.',
                   'They sent her north for schooling. That was fifteen years ago.'],
                  ['We wrote for the first year or two.',
                   'Then her letters stopped coming.',
                   'Then mine started being returned.',
                   'I\u2019ve been through the district registry. The relay clerk. Every office I could reach.',
                   'They say the records transferred with her.',
                   'They say the forwarding address isn\u2019t theirs to give.'],
                  ['I\u2019m not asking for much.',
                   'I just want to know she\u2019s all right.',
                   'Do you know anyone who worked in the old filing system?',
                   'Someone with memory of how rareborn transfers worked?'],
                ];
                dialogue.callbacks = [function() {
                  choice.title     = 'Dessa';
                  choice.options   = ['I\u2019ll ask around', 'I\u2019m sorry, I can\u2019t help'];
                  choice.cursor    = 0;
                  choice.callbacks = [
                    function accept() {
                      letter_quest_stage = 1;
                      dialogue.name  = 'Dessa';
                      dialogue.pages = [
                        ['Good.',
                         'Her name is Yael.',
                         'Classification year \u2014 Drenwick district, fifteen years back.',
                         'That\u2019s all I know to give you.'],
                      ];
                      dialogue.open  = true;
                      dialogue.page  = 0;
                    },
                    function decline() {
                      dialogue.name  = 'Dessa';
                      dialogue.pages = [
                        ['I understand.',
                         'If you change your mind, I\u2019m here.'],
                      ];
                      dialogue.open  = true;
                      dialogue.page  = 0;
                    },
                  ];
                  choice.open = true;
                }];
                dialogue.open  = true;
                dialogue.page  = 0;
              }

            } else if (letter_quest_stage === 1) {
              // Waiting — player hasn't visited Orwen yet
              dialogue.name  = 'Dessa';
              dialogue.pages = [
                ['You\u2019re still looking.',
                 'Take whatever time you need.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 2) {
              // ── Trip 3: return from Orwen, he remembers, needs letters ──
              dialogue.name  = 'Dessa';
              dialogue.pages = [
                ['You found someone.',
                 'He remembers the name.',
                 'He\u2019s going to look.'],
                ['He remembers her name.'],
                ['That \u2014',
                 'That means something.'],
                ['He\u2019ll need more to trace her.',
                 'Do you have anything with a transit stamp?',
                 'Letters. A transfer number. Anything official.'],
                ['I kept everything.',
                 'Three letters. Two from her, one that came back undelivered.',
                 'The returned one has a stamp I could never read.',
                 'Take them.'],
              ];
              dialogue.callbacks = [function() {
                letter_quest_stage = 3;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 3) {
              // Waiting — letters with Orwen
              dialogue.name  = 'Dessa';
              dialogue.pages = [
                ['The letters are with him now.',
                 'I keep thinking about that stamp.',
                 'I never knew what it meant.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 4) {
              // ── Trip 5: emotional reveal — Yael was writing ─────────────
              dialogue.name  = 'Dessa';
              dialogue.pages = [
                ['She was writing back.',
                 'The letters weren\u2019t getting through \u2014 the relay hub moved, the address in the system went out of date.',
                 'Her letters were going back to an empty building.'],
                ['She kept writing anyway.'],
                ['Dessa is quiet for a moment.'],
                ['Fifteen years.',
                 'I thought \u2014 eventually \u2014 she must have decided not to.',
                 'That she\u2019d built a life up there and we were the part that was done.'],
                ['That\u2019s not what happened.',
                 'That\u2019s not what happened at all.'],
                ['He remembered something else.',
                 'When she left \u2014 she was eleven \u2014 she asked him to pass a message.',
                 'She asked him to tell you she\u2019d write.',
                 'He did.',
                 'It just \u2014 never arrived.'],
                ['Is he still looking?',
                 'Can he find an address?'],
              ];
              dialogue.callbacks = [function() {
                letter_quest_stage = 5;
                dialogue.name  = 'Dessa';
                dialogue.pages = [
                  ['Tell him I want to write to her.',
                   'Whatever it takes.',
                   'Tell him I said that.'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 5) {
              // Waiting — player taking message to Orwen
              dialogue.name  = 'Dessa';
              dialogue.pages = [
                ['I\u2019ve been writing drafts.',
                 'In my head.',
                 'For fifteen years.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 6) {
              // ── Trip 7: final return — the forwarding contact ───────────
              dialogue.name  = 'Dessa';
              dialogue.pages = [
                ['There\u2019s a forwarding contact.',
                 'Her name is Hanna Veil.',
                 'Registry clerk, northern Ardwick district.',
                 'Write to her with Yael\u2019s full name and classification year \u2014 she can forward the letter.'],
                ['It\u2019s not a direct address.',
                 'But it\u2019s a real path.',
                 'It\u2019s more than I\u2019ve had in fifteen years.'],
                ['I\u2019m going to write tonight.',
                 'I\u2019ve been composing it in my head for fifteen years.',
                 'Shouldn\u2019t take long.'],
                ['Orwen.',
                 'How did he know all this?',
                 'How much did he know?'],
                ['He worked records.',
                 'He processed her transfer \u2014 he was there the day she left.',
                 'When she left, she asked him to tell you she\u2019d write.',
                 'He passed the message.',
                 'It just never reached you.'],
                ['Tell him thank you.',
                 'For both things.',
                 'For remembering, and for looking.'],
                ['You didn\u2019t have to do any of this.',
                 'Neither of you.',
                 'I won\u2019t forget it.'],
              ];
              dialogue.callbacks = [function() {
                letter_quest_stage = 7;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else {
              // Stage 7+ — quest complete
              dialogue.name  = 'Dessa';
              dialogue.pages = [
                ['I wrote last night.',
                 'Took an hour.',
                 'Fifteen years of drafts, and it came out in an hour.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
      }

      // ── Letter Quest: Orwen (Calwick apt_1) ────────────────────────────────
      if (currentHouseId === 'apt_1') {
        const orwen = SIMPLE_NPCS.find(n => n.id === 'orwen');
        if (orwen) {
          const odx = player.x - orwen.x;
          const ody = player.y - orwen.y;
          if (Math.sqrt(odx * odx + ody * ody) < TALK_RADIUS) {

            if (letter_quest_stage === 0) {
              // Ambient — quest not started
              dialogue.name  = 'Orwen';
              dialogue.pages = [
                ['Quiet building.',
                 'Not much to offer if you\u2019re looking for company.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 1) {
              // ── Trip 2: first visit, player asks for help ───────────────
              dialogue.name  = 'Orwen';
              dialogue.pages = [
                ['Yes?',
                 'You\u2019re not from this building.'],
                ['I worked in imperial records for eighteen years.',
                 'Rareborn transfers, mostly.',
                 'Classification filing, forwarding logs.',
                 'I left four years ago.'],
                ['You\u2019re asking about a specific case.',
                 'What name?'],
                ['Yael.',
                 'He\u2019s quiet for a moment.',
                 'I remember that name.'],
                ['I can\u2019t promise anything.',
                 'The centralisation destroyed half the early records.',
                 'But I\u2019ll look.'],
              ];
              dialogue.callbacks = [function() {
                letter_quest_stage = 2;
                dialogue.name  = 'Orwen';
                dialogue.pages = [
                  ['Tell her \u2014 tell whoever\u2019s looking for her \u2014 that I\u2019m looking.',
                   'Come back.'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 2) {
              // Waiting — player going to Dessa for letters
              dialogue.name  = 'Orwen';
              dialogue.pages = [
                ['I\u2019m still pulling records.',
                 'The early files are in bad shape.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 3) {
              // ── Trip 4: player brings Dessa's letters ───────────────────
              dialogue.name  = 'Orwen';
              dialogue.pages = [
                ['You have letters.',
                 'Let me look at the stamps.'],
                ['This one. The returned letter.',
                 'That\u2019s the western relay hub.',
                 'Decommissioned eight years ago.',
                 'When the school moved, the forwarding address in the system wasn\u2019t updated.',
                 'Her letters were going back to an empty building.'],
                ['She was writing back.',
                 'She was writing back the whole time.'],
                ['I should tell you something I didn\u2019t say before.',
                 'When she left \u2014 she was eleven \u2014 she asked me to pass a message.',
                 'To tell her sister she\u2019d write.',
                 'I did. I had no way to make sure it landed.',
                 'I\u2019ve thought about that.'],
                ['I\u2019m going to trace the forwarding log.',
                 'If there\u2019s a current posting for her anywhere, I\u2019ll find it.',
                 'Come back in a few days.'],
              ];
              dialogue.callbacks = [function() {
                letter_quest_stage = 4;
                dialogue.name  = 'Orwen';
                dialogue.pages = [
                  ['She kept writing.',
                   'Remember that when you tell her.'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 4) {
              // Waiting — working on trace
              dialogue.name  = 'Orwen';
              dialogue.pages = [
                ['Still working on it.',
                 'I\u2019ve found part of the trail.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (letter_quest_stage === 5) {
              // ── Trip 6: player brings Dessa's wish; Orwen gives contact ─
              dialogue.name  = 'Orwen';
              dialogue.pages = [
                ['She wants to write to her.',
                 'Good.'],
                ['She\u2019s alive.',
                 'I found a forwarding contact in the northern Ardwick district registry.',
                 'Not a direct address \u2014 the registry doesn\u2019t hold those for transferred rareborn.',
                 'But a contact.'],
                ['Hanna Veil. Registry clerk.',
                 'If Dessa writes to her with Yael\u2019s full name and classification year, she\u2019ll forward it.',
                 'The northern postal relay is slow.',
                 'But it gets there.'],
                ['Tell her \u2014 if she needs anything else, she knows where I am.',
                 'I\u2019m not going anywhere.'],
              ];
              dialogue.callbacks = [function() {
                letter_quest_stage = 6;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else {
              // Stage 6+ — quest near-complete or complete
              dialogue.name  = 'Orwen';
              dialogue.pages = [
                ['I hope the letter reaches her.',
                 'This relay is still running.',
                 'It should.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
      }

      // \u2500\u2500 Fenna (Calwick apt_2) \u2014 A Bottle for Her Father \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      if (currentHouseId === 'apt_2') {
        const fenna = SIMPLE_NPCS.find(n => n.id === 'fenna');
        if (fenna) {
          const fdx = player.x - fenna.x;
          const fdy = player.y - fenna.y;
          if (Math.sqrt(fdx * fdx + fdy * fdy) < TALK_RADIUS) {

            if (!wine_quest_started) {
              dialogue.name  = 'Fenna';
              dialogue.pages = [
                ['\u201cOh \u2014 hello.\u201d',
                 'She looks relieved to have someone to talk to.'],
                ['\u201cIt\u2019s my dad\u2019s birthday in a few days.\u201d',
                 '\u201cHe lives out in Drenwick. He loves mushroom wine \u2014 the fresh kind, from the fen brewery.\u201d'],
                ['\u201cI\u2019d take it myself, but\u2014\u201d',
                 'She glances toward the door.',
                 '\u201cThere are things on that road. I\u2019m not going out there.\u201d'],
                ['\u201cWould you carry some to him? A bottle, whatever you think.\u201d',
                 '\u201cI\u2019ll pay you back for it. I just want him to have it.\u201d'],
              ];
              dialogue.callbacks = [function() {
                choice.title   = 'Fenna';
                choice.options = ['Agree to carry the wine', 'Not right now'];
                choice.cursor  = 0;
                choice.callbacks = [
                  function agree() {
                    wine_quest_started = true;
                    syncQuestFlagsToWindow();
                    dialogue.name  = 'Fenna';
                    dialogue.pages = [
                      ['\u201cThank you.\u201d',
                       'She looks like a weight just came off her.'],
                      ['\u201cWend\u2019s brewery, out in the fen. Just tell him it\u2019s from me \u2014 he\u2019s Sael, corridor B2 in Drenwick.\u201d'],
                    ];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                  function decline() {
                    dialogue.name  = 'Fenna';
                    dialogue.pages = [['\u201cOh. Okay.\u201d', '\u201cIf you change your mind.\u201d']];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                ];
                choice.open = true;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (wine_quest_started && !wine_quest_delivered) {
              dialogue.name  = 'Fenna';
              dialogue.pages = [
                ['\u201cWend\u2019s brewery, in the fen, if you haven\u2019t been yet.\u201d',
                 '\u201cSael \u2014 that\u2019s my dad. Drenwick, corridor B2.\u201d'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;

            } else if (wine_quest_delivered && !wine_quest_rewarded) {
              const hasNote = stats.items.some(i => i.name === 'Thank-You Note');
              if (hasNote) {
                const gaveCase = wine_quest_gift === 'case';
                dialogue.name  = 'Fenna';
                dialogue.pages = gaveCase
                  ? [
                      ['She reads the note twice before she says anything.'],
                      ['\u201cA whole case. You didn\u2019t have to do that.\u201d',
                       '\u201cHe must have been so pleased.\u201d'],
                      ['\u201cI don\u2019t have much, but \u2014 I want you to have this.\u201d',
                       'She presses a small amethyst bangle into your hand.',
                       '\u201cIt was my mother\u2019s. I think she\u2019d rather it went somewhere it\u2019d actually be used.\u201d'],
                    ]
                  : [
                      ['She reads the note twice before she says anything.'],
                      ['\u201cHe got it. He\u2019s happy.\u201d',
                       '\u201cThat\u2019s the whole thing, really.\u201d'],
                      ['\u201cHere. For the trouble.\u201d',
                       'She counts out fifty gold.'],
                    ];
                dialogue.callbacks = [function() {
                  stats.items = stats.items.filter(i => i.name !== 'Thank-You Note');
                  if (gaveCase) {
                    stats.items.push({ name: 'Amethyst Bangle', type: 'accessory', bonus: 3, price: 400, preventsCursed: true });
                  } else {
                    stats.gold += 50;
                  }
                  wine_quest_rewarded = true;
                  syncQuestFlagsToWindow();
                }];
                dialogue.open  = true;
                dialogue.page  = 0;
              } else {
                dialogue.name  = 'Fenna';
                dialogue.pages = [['\u201cDid he send anything back with you?\u201d']];
                dialogue.open  = true;
                dialogue.page  = 0;
              }

            } else {
              dialogue.name  = 'Fenna';
              dialogue.pages = [
                ['\u201cThank you again for that.\u201d',
                 '\u201cReally.\u201d'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
      }

      // ── Voss (Drenwick apt_a1_u3) — moral dilemma ─────────────────────────
      if (currentHouseId === 'drenwick_apt_a1_u3') {
        const voss = SIMPLE_NPCS.find(n => n.id === 'apt_voss');
        if (voss) {
          const vx = player.x - voss.x;
          const vy = player.y - voss.y;
          if (Math.sqrt(vx * vx + vy * vy) < TALK_RADIUS) {
            if (dilemma_voss === null) {
              dialogue.name  = 'Voss';
              dialogue.pages = [
                ['\u201cVoss.\u201d',
                 '\u201cProvision store, down by the civic quarter.\u201d',
                 '\u201cI\u2019ve been in this building three years.\u201d'],
                ['\u201cCan I ask you something?\u201d',
                 '\u201cSomething I can\u2019t ask anyone who lives here.\u201d'],
                ['\u201cMy neighbor \u2014 the one next door, unit two \u2014 she\u2019s been sheltering someone.\u201d',
                 '\u201cHer mother. Came up from the fen country a few months back.\u201d',
                 '\u201cThe woman\u2019s old. Been sick since she arrived.\u201d'],
                ['\u201cShe\u2019s not registered.\u201d',
                 '\u201cNo Imperial papers. Nothing.\u201d',
                 '\u201cShe was born before the Integration Accords.\u201d',
                 '\u201cLived off-grid her whole life.\u201d',
                 '\u201cShe doesn\u2019t know what a registration office is.\u201d'],
                ['\u201cI know because I can hear her coughing through the wall at night.\u201d',
                 '\u201cMy neighbor told me, and asked me to keep quiet.\u201d',
                 '\u201cI have. But it\u2019s been three months.\u201d'],
                ['\u201cI work in the provision store.\u201d',
                 '\u201cI process allocations. I know what the Imperial register does.\u201d',
                 '\u201cIf she\u2019s not in the system, she\u2019s not counted.\u201d',
                 '\u201cIf she\u2019s not counted, she doesn\u2019t officially exist.\u201d'],
                ['\u201cReporting it means the district office gets involved.\u201d',
                 '\u201cNot reporting it means I\u2019m part of something I didn\u2019t choose.\u201d',
                 '\u201cI\u2019ve been sitting with that for three months.\u201d'],
                ['\u201cWhat would you do?\u201d'],
              ];
              dialogue.callbacks = [function() {
                choice.title     = 'Voss';
                choice.options   = [
                  'Report it. The system is how she gets help.',
                  'Don\u2019t report it. Let the woman live.',
                  'It\u2019s not your decision to make.',
                ];
                choice.cursor    = 0;
                choice.callbacks = [
                  function report() {
                    dilemma_voss = 'report';
                    dialogue.name  = 'Voss';
                    dialogue.pages = [
                      ['\u201cThe system.\u201d',
                       '\u201cYeah. I keep telling myself the same thing.\u201d',
                       '\u201cIf she\u2019s registered, she\u2019s real to them. They\u2019d have to account for her.\u201d'],
                      ['\u201cI\u2019ll think about it.\u201d'],
                    ];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                  function protect() {
                    dilemma_voss = 'protect';
                    dialogue.name  = 'Voss';
                    dialogue.pages = [
                      ['\u201cShe\u2019s not hurting anyone.\u201d',
                       '\u201cShe\u2019s just old and sick and here.\u201d'],
                      ['\u201cI\u2019ll think about it.\u201d'],
                    ];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                  function abstain() {
                    dilemma_voss = 'abstain';
                    dialogue.name  = 'Voss';
                    dialogue.pages = [
                      ['\u201cNot my decision.\u201d',
                       '\u201cBut I found out. That makes it something, even if not a decision.\u201d'],
                      ['\u201cI\u2019ll think about it.\u201d'],
                    ];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                ];
                choice.open = true;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (dilemma_voss === 'report') {
              dialogue.name  = 'Voss';
              dialogue.pages = [
                ['\u201cI left a note at the district office.\u201d',
                 '\u201cAnonymous. Just enough for them to find her.\u201d',
                 '\u201cTwo weeks ago. They haven\u2019t come yet.\u201d'],
                ['\u201cClodagh hasn\u2019t spoken to me since.\u201d',
                 '\u201cI don\u2019t know how she found out it was me.\u201d',
                 '\u201cMaybe she just assumed.\u201d'],
                ['\u201cI thought the answer would come once I\u2019d done it.\u201d',
                 '\u201cIt hasn\u2019t.\u201d'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (dilemma_voss === 'protect') {
              dialogue.name  = 'Voss';
              dialogue.pages = [
                ['\u201cI\u2019ve been leaving bread outside their door.\u201d',
                 '\u201cExtra from the store that was going to be logged out anyway.\u201d',
                 '\u201cI tell myself it\u2019s just being neighborly.\u201d'],
                ['\u201cI haven\u2019t told anyone.\u201d',
                 '\u201cThe old woman seems a little better. Less coughing at night.\u201d'],
                ['\u201cI try not to think past that.\u201d'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (dilemma_voss === 'abstain') {
              dialogue.name  = 'Voss';
              dialogue.pages = [
                ['\u201cI\u2019ve been turning it over.\u201d',
                 '\u201cYou said it\u2019s not my decision.\u201d',
                 '\u201cYou\u2019re probably right.\u201d'],
                ['\u201cBut not deciding is still a kind of deciding.\u201d',
                 '\u201cEvery day I don\u2019t say anything is a day I choose not to.\u201d'],
                ['\u201cI haven\u2019t done anything yet.\u201d',
                 '\u201cI just needed someone else to know that I know.\u201d'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
      }

      // \u2500\u2500 Sael (Drenwick apt_b2_u1) \u2014 receives the wine, gives the note \u2500\u2500\u2500\u2500
      if (currentHouseId === 'drenwick_apt_b2_u1') {
        const sael = SIMPLE_NPCS.find(n => n.id === 'apt_sael');
        if (sael) {
          const slx = player.x - sael.x;
          const sly = player.y - sael.y;
          if (Math.sqrt(slx * slx + sly * sly) < TALK_RADIUS) {
            const hasCase   = stats.items.some(i => i.name === 'Case of Mushroom Wine');
            const hasBottle = stats.items.some(i => i.name === 'Bottle of Mushroom Wine');
            if (wine_quest_started && !wine_quest_delivered && (hasCase || hasBottle)) {
              const gift = hasCase ? 'case' : 'bottle';
              dialogue.name  = 'Sael';
              dialogue.pages = gift === 'case'
                ? [
                    ['He sees what you\u2019re carrying before you say anything.'],
                    ['\u201cA whole case.\u201d',
                     'For a moment he doesn\u2019t say anything else.',
                     '\u201cShe didn\u2019t have to do that.\u201d'],
                    ['\u201cTell Fenna \u2014 tell her thank you. Really.\u201d',
                     'He scribbles a short note and presses it into your hand.',
                     '\u201cTake this back to her, would you? She\u2019ll want to know it arrived.\u201d'],
                  ]
                : [
                    ['He sees the bottle before you say anything.'],
                    ['\u201cShe sent you all this way for one bottle?\u201d',
                     'He\u2019s smiling despite himself.',
                     '\u201cThat\u2019s Fenna.\u201d'],
                    ['He scribbles a short note and presses it into your hand.',
                     '\u201cTake this back to her. Tell her thank you.\u201d'],
                  ];
              dialogue.callbacks = [function() {
                const giftItemName = gift === 'case' ? 'Case of Mushroom Wine' : 'Bottle of Mushroom Wine';
                stats.items = stats.items.filter(i => i.name !== giftItemName);
                stats.items.push({ name: 'Thank-You Note', type: 'accessory', bonus: 0, price: 0, questItem: true });
                wine_quest_delivered = true;
                wine_quest_gift      = gift;
                syncQuestFlagsToWindow();
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
              return;
            }
          }
        }
      }

      interactSimpleNPCs();
    } else {
      // Smuggler fort — all interaction routed through interactSmugglerFort
      if (activeMap === SMUGGLER_FORT_MAP) { interactSmugglerFort(); return; }
      // Fen Brewery \u2014 Gorrit sells freshly made mushroom wine by the bottle or case
      if (inFenBrewery) {
        const gorrit = SIMPLE_NPCS.find(n => n.id === 'gorrit_wend');
        if (gorrit) {
          const gwx = player.x - gorrit.x;
          const gwy = player.y - gorrit.y;
          if (Math.sqrt(gwx * gwx + gwy * gwy) < TALK_RADIUS) {
            dialogue.name  = 'Gorrit';
            dialogue.pages = [
              ['\u201cFresh batch, just strained.\u201d',
               'He nods at the row of corked bottles beside the vats.'],
              ['\u201cBottle\u2019s twelve gold.\u201d',
               '\u201cCase of twelve\u2019s a hundred thirty-two \u2014 buy eleven, twelfth\u2019s on the house.\u201d'],
            ];
            dialogue.callbacks = [function() {
              choice.title     = 'Gorrit';
              choice.options   = ['Buy a Bottle (12g)', 'Buy a Case of 12 (132g)', 'Leave'];
              choice.cursor    = 0;
              choice.callbacks = [
                function buyBottle() {
                  if (stats.gold >= 12) {
                    stats.gold -= 12;
                    stats.items.push({ name: 'Bottle of Mushroom Wine', type: 'accessory', bonus: 0, price: 12, questItem: true });
                    dialogue.name  = 'Gorrit';
                    dialogue.pages = [
                      ['\u201cThere you go.\u201d',
                       'He corks it and sets it down carefully.',
                       '\u201cMind the road on the way back.\u201d'],
                    ];
                  } else {
                    dialogue.name  = 'Gorrit';
                    dialogue.pages = [['\u201cTwelve gold.\u201d', '\u201cYou\u2019re short.\u201d']];
                  }
                  dialogue.open  = true;
                  dialogue.page  = 0;
                },
                function buyCase() {
                  if (stats.gold >= 132) {
                    stats.gold -= 132;
                    stats.items.push({ name: 'Case of Mushroom Wine', type: 'accessory', bonus: 0, price: 132, questItem: true });
                    dialogue.name  = 'Gorrit';
                    dialogue.pages = [
                      ['\u201cA whole case.\u201d',
                       'He looks briefly, genuinely pleased.',
                       '\u201cDon\u2019t see that order much. Careful carrying it \u2014 heavier than it looks.\u201d'],
                    ];
                  } else {
                    dialogue.name  = 'Gorrit';
                    dialogue.pages = [['\u201cHundred thirty-two.\u201d', '\u201cNot today, looks like.\u201d']];
                  }
                  dialogue.open  = true;
                  dialogue.page  = 0;
                },
                function leave() {},
              ];
              choice.open = true;
            }];
            dialogue.open  = true;
            dialogue.page  = 0;
            return;
          }
        }
        interactSimpleNPCs();
        return;
      }
      // Drenwick guard post — Constable Tarvec, Pale Sentry contract
      if (inDrenwrickPost) {
        const tarvec = SIMPLE_NPCS.find(n => n.id === 'tarvec');
        if (tarvec) {
          const tdx = player.x - tarvec.x;
          const tdy = player.y - tarvec.y;
          if (Math.sqrt(tdx * tdx + tdy * tdy) < TALK_RADIUS) {
            if (!sentry_quest_started) {
              dialogue.name  = 'Constable Tarvec';
              dialogue.pages = [
                ['\u201cSomething\u2019s been moving on the fen road.\u201d',
                 '\u201cLarge. Pale. Came in off the wetland north of the blocked crossing.\u201d',
                 '\u201cThree separate reports in the last two weeks. None of them agree on what it is.\u201d'],
                ['\u201cI\u2019ve posted a removal notice.\u201d',
                 '\u201cA hundred gold, paid here, for confirmed removal.\u201d',
                 '\u201cThe road needs to be usable again.\u201d'],
              ];
              dialogue.callbacks = [function() {
                choice.title     = 'Constable Tarvec';
                choice.options   = ['Accept contract', 'Not yet'];
                choice.cursor    = 0;
                choice.callbacks = [
                  function accept() {
                    sentry_quest_started = true;
                    pale_sentry_hp       = 500;
                    refreshJobBoard();
                    syncQuestFlagsToWindow();
                    dialogue.name  = 'Constable Tarvec';
                    dialogue.pages = [
                      ['\u201cThe road northeast, past the old crossing marker.\u201d',
                       '\u201cThat\u2019s where they\u2019ve all seen it.\u201d',
                       '\u201cCome back when it\u2019s done.\u201d'],
                    ];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                  function notYet() {
                    dialogue.name  = 'Constable Tarvec';
                    dialogue.pages = [['\u201cNotice stays on the board.\u201d']];
                    dialogue.open  = true;
                    dialogue.page  = 0;
                  },
                ];
                choice.open = true;
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (sentry_quest_done && !sentry_quest_rewarded) {
              dialogue.name  = 'Constable Tarvec';
              dialogue.pages = [
                ['\u201cYou found it.\u201d',
                 'He looks at you a moment.',
                 '\u201cI don\u2019t know what it was either. But it\u2019s gone, and that\u2019s what matters.\u201d'],
                ['\u201cA hundred gold.\u201d',
                 '\u201cI\u2019ll file the removal report with the district.\u201d',
                 '\u201cYou won\u2019t need to put your name to anything.\u201d'],
              ];
              dialogue.callbacks = [function() {
                stats.gold += 100;
                sentry_quest_rewarded = true;
                syncQuestFlagsToWindow();
              }];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else if (sentry_quest_started && !sentry_quest_done) {
              dialogue.name  = 'Constable Tarvec';
              dialogue.pages = [['\u201cStill out there?\u201d',
                                  '\u201cTake your time. Just come back when it\u2019s done.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            } else {
              dialogue.name  = 'Constable Tarvec';
              dialogue.pages = [['\u201cFen road\u2019s clear now.\u201d',
                                  '\u201cAppreciate it.\u201d']];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
            return;
          }
        }
        interactSimpleNPCs();
        return;
      }
      // Route board — Maren's waykeeper post (east interior wall, col 9 row 4)
      if (activeMap === MAREN_POST_MAP) {
        const rbx = player.x - 9.5 * TILE;
        const rby = player.y - 4.5 * TILE;
        if (Math.sqrt(rbx * rbx + rby * rby) < TALK_RADIUS) {
          dialogue.name  = 'Route Board';
          dialogue.pages = [
            ['WAYKEEPER POST \u2014 CALWICK WEST',
             'East: Calwick, 2 leagues.',
             'West: Drenwick canal road, 11 leagues.',
             'North: fen access track \u2014 seasonal, use with caution.',
             'Aetherrail: Calwick East Station, road east.'],
            ['Conditions (last updated by waykeeper):',
             'Canal road: maintained. Night travel not advised \u2014 canal edge unmarked in parts.',
             'Fen track: passable. Soft margins after rain.',
             'Unmarked beyond the second post. Proceed with a guide if unfamiliar.'],
            ['This post is staffed.',
             'Enquiries to the waykeeper on duty.'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
      }
      interactSimpleNPCs();
    }
  } else if (inDungeon && dungeonFloor === 4) {
    if (!MULHOLLAND.defeated) {
      const mx = player.x - MULHOLLAND.x;
      const my = player.y - MULHOLLAND.y;
      if (Math.sqrt(mx * mx + my * my) < TALK_RADIUS) {
        dialogue.name  = '';
        dialogue.pages = MULHOLLAND_DIALOGUE;
        dialogue.open  = true;
        dialogue.page  = 0;
        dialogue.triggerMulhollandCombat = true;
      }
    }
  } else if (inDungeon && dungeonFloor === 5) {
    if (BOSS.knockedDown && !BOSS.defeated) {
      const bx = player.x - BOSS.x;
      const by = player.y - BOSS.y;
      if (Math.sqrt(bx * bx + by * by) < TALK_RADIUS) {
        choice.title   = 'Wrongteeth';
        choice.options = ['Kill it', 'Let it hold you'];
        choice.cursor  = 0;
        choice.callbacks = [
          function killWrongteeth() {
            BOSS.defeated    = true;
            BOSS.knockedDown = false;
            const kPages = [
              ['You raise your weapon.',
               'It doesn\u2019t flinch. It keeps looking at you.',
               'Then it\u2019s over.'],
            ];
            if (schilling_quest_started && !schilling_returned) {
              kPages.push([
                'On the ground beside it, half-buried in the mud,',
                'is a small cloth bear.',
                'Damp. One ear bent.',
                'You pick it up.',
              ]);
              dialogue.callbacks = [function() {
                stats.items.push({ name: 'Schilling', type: 'accessory', bonus: 0, price: 0, questItem: true });
              }];
            } else {
              dialogue.callbacks = null;
            }
            dialogue.name  = '';
            dialogue.pages = kPages;
            dialogue.open  = true;
            dialogue.page  = 0;
          },
          function hugWrongteeth() {
            BOSS.defeated    = true;
            BOSS.knockedDown = false;
            const hPages = [
              ['The claws come up slowly.',
               'They wrap around your shoulders.',
               'You are very aware of how large they are. Of what they could do.',
               'They don\u2019t.'],
              ['It is warm.',
               'That surprises you more than anything else.',
               'The body pressed against you is warm, and it trembles slightly, and the sound it makes is very small for something so large.'],
              ['You think: this is a child.',
               'Not a human child. But something young, and frightened, and lost somewhere it has no language for.',
               'You think about what it must be like to be hungry and enormous and unable to explain yourself to anything.'],
              ['You think about the claw marks on the dungeon walls.',
               'Deep ones. Spaced wrong for any person.',
               'You think about what happened to the people who came here before you.',
               'The ones who didn\u2019t come back.'],
              ['The claws tighten very slightly.',
               'You stay still.',
               'After a while, it lets go.',
               'The big eye finds yours. The tiny eye finds yours.',
               'Then it curls smaller, and is quiet.'],
            ];
            if (schilling_quest_started && !schilling_returned) {
              hPages.push([
                'When it lets go, something drops from the tangle of its arms.',
                'A small cloth bear.',
                'It lands in the mud between you.',
                'It looks at the bear. It looks at you.',
                'You pick it up.',
              ]);
              dialogue.callbacks = [function() {
                stats.items.push({ name: 'Schilling', type: 'accessory', bonus: 0, price: 0, questItem: true });
              }];
            } else {
              dialogue.callbacks = null;
            }
            dialogue.name  = 'Wrongteeth';
            dialogue.pages = hPages;
            dialogue.open  = true;
            dialogue.page  = 0;
          },
        ];
        choice.open = true;
      }
    } else if (!BOSS.defeated) {
      const bx = player.x - BOSS.x;
      const by = player.y - BOSS.y;
      if (Math.sqrt(bx * bx + by * by) < TALK_RADIUS) {
        dialogue.name              = 'Wrongteeth';
        dialogue.pages             = BOSS_DIALOGUE;
        dialogue.open              = true;
        dialogue.page              = 0;
        dialogue.triggerBossCombat = true;
      }
    }
  }

  // Generic MAP_FEATURES inspectables -- lowest priority, checked only if
  // nothing above (NPCs, chests, quest objects, point transitions, other
  // scripted content, all of which are woven through the if/else-if chain
  // just above) already opened dialogue this frame. That guard is
  // deliberately just `!dialogue.open` rather than a restructuring of the
  // ~3000-line chain above: every path through it that "handles" the press
  // sets dialogue.open = true as part of showing feedback (confirmed by
  // reading every custom NPC .action callback and every chest/quest-object
  // branch), and dialogue.open is guaranteed false on entry here (the
  // dialogue-continuation branch at the top of this function already
  // returned early otherwise) -- so if it's true now, something above this
  // point set it during this same call, and MAP_FEATURES correctly steps
  // aside instead of opening a second, competing dialogue over it.
  if (!dialogue.open) tryMapFeatures();
}
