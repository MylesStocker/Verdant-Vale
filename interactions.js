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
  ['It tucks its paws under itself and becomes', 'a perfectly bread-shaped object.'],
];
function catPetResponse() {
  return CAT_PET_RESPONSES[Math.floor(Math.random() * CAT_PET_RESPONSES.length)];
}

// ─── Interaction ──────────────────────────────────────────────────────────────
// Checks SIMPLE_NPCS on the current map; opens dialogue (or calls action) for
// the first one within TALK_RADIUS. Returns true if an NPC was triggered.
function interactSimpleNPCs() {
  const mapId = currentContentLocationKey();
  for (const npc of SIMPLE_NPCS) {
    if (npc.map !== mapId) continue;
    // An explicit-physicalMapId NPC on the shared 'overworld' key belongs to its own
    // physical chunk — never a different active chunk that merely shares the key.
    if (typeof npcExplicitOwnershipMismatchesActive === 'function' && npcExplicitOwnershipMismatchesActive(npc)) continue;
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
      } else if (typeof NPC_ROUTES !== 'undefined' && NPC_ROUTES[npc.id]) {
        // A moving NPC with no custom action (Toby's patrol, Tomas's wander):
        // freeze it at its live position, face the player, open its dialogue,
        // and resume a beat after it closes. Generic — no per-NPC branch.
        patrolNpcTalk(npc);
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

// ─── MAP_FEATURES: the one authoritative inspectable/trigger registry ────────
// Region-owned fragments live in content/interactions/*-interactions.js (loaded
// before this file). They are merged here — a map key owned by two fragments is
// a developer error and throws, rather than being silently overwritten.
function mergeMapFeatureFragments(fragments) {
  const merged = {};
  for (const frag of fragments) {
    for (const key of Object.keys(frag)) {
      if (Object.prototype.hasOwnProperty.call(merged, key)) {
        throw new Error('mergeMapFeatureFragments: duplicate MAP_FEATURES map key "' + key + '" — a map may belong to only one regional fragment');
      }
      merged[key] = frag[key];
    }
  }
  return merged;
}

// Genuinely shared / special MAP_FEATURES entries: the generic apartment-corridor
// signage, shared between Calwick and Drenwick apartment blocks.
const SHARED_MAP_FEATURES = {
  // \u2500\u2500 Calwick apartment building \u2014 lobby corridor notice \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // The corridor was a bare placeholder with nothing to read. Placed at
  // the west end of the corridor, two tiles clear of the nearest apt door
  // (c3, r5), so the door interact can't contest the press.
  APARTMENT_CORRIDOR_MAP: [
    {
      id:        'calwick_apt_notice',
      type:      'inspect',
      x:         2.5, y: 7.5,
      condition: () => currentTownId === 'calwick',
      label:     'Building notice',
      pages: [
        ['A framed notice by the entrance, glass fogged with age.',
         'The paper inside has been replaced recently.'],
        ['TO ALL TENANTS:',
         'Cistern drawing hours are posted at the square.',
         'Do not wash stairs, stoops, or windows until the notice lifts.'],
        ['Below, in a tighter hand:',
         'The rain is not the building warden\u2019s doing either. Kindly stop asking.'],
      ],
    },
  ],

};

const MAP_FEATURES = mergeMapFeatureFragments([
  CALWICK_MAP_FEATURES,
  THORNMERE_WILDS_MAP_FEATURES,
  DRENWICK_TOWN_MAP_FEATURES,
  DRENWICK_INTERIOR_MAP_FEATURES,
  SOUTH_RUINS_MAP_FEATURES,
  NORTH_BASIN_MAP_FEATURES,
  SHARED_MAP_FEATURES,
]);

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
  // Map identity from the CANONICAL context (regional) / active map (discrete), so
  // map-feature (inspect/trigger) selection follows the canonical current chunk.
  const mapId = (typeof regionalActiveMapId === 'function') ? regionalActiveMapId() : mapRegistryId(activeMap);
  return mapId ? (MAP_FEATURES[mapId] || null) : null;
}

// Checks 'inspect' features on the current map; returns true and opens
// dialogue if one is near the player (and facing-matched, if required) and
// its condition (if any) passes. Called from the tail of handleInteract(),
// strictly as the lowest-priority fallback: it runs only when no location
// handler consumed the press (explicit `return true` from a handler) AND
// no interaction UI is open (interactionUiOpened() -- dialogue, choice,
// shop, or a reading panel). See the orchestration comment above
// interactionUiOpened() for the full priority contract.
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

    // `flag` (optional): a persistent window flag set to true whenever this
    // feature's pages are actually shown -- UNLIKE onceFlag it does NOT gate
    // repeats (the clue stays re-readable), it just records "the player has
    // investigated this". Used by the Sunken Gallery clue-reporting: each
    // observer clue sets its gallery_clue_* flag, which the Supervisor reads
    // back when the player reports in (interactSupervisor).
    if (pages && feature.flag) window[feature.flag] = true;

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
// Shown after resting in the player's own bed on the recurring dream night of
// the five-day week (day % 5 === 3 — a mid-week eve, never Dayoff at day % 5 === 0).
// Rotates by Math.floor(day / 5) % DREAMS.length — one new dream per five-day week.
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

// ─── Encounter dispatch ───────────────────────────────────────────────────────
// Single mapping from an encounter id → the function that starts that combat.
// A dialogue that should end in a fight calls queueDialogueEncounter(id); when
// its final page closes, finishDialogue() dispatches exactly one handler here.
// Handlers wrap the start* calls so the lookup happens at dispatch time (no
// load-order dependency on combat.js).
const ENCOUNTER_HANDLERS = {
  boss:         function() { startBossCombat(); },
  warden:       function() { startWardenCombat(); },
  fort_guard:   function() { startFortGuardCombat(); },
  fort_polwick: function() { startFortPolwickCombat(); },
  fort_essa:    function() { startFortEssaCombat(); },
  mulholland:   function() { startMulhollandCombat(); },
  den_wraith:   function() { startDenWraithCombat(); },
  takomo:       function() { startTakomoCombat(); },
  kolm_brawler: function() { startSailorBrawlCombat(); },
};

// Queue an encounter to begin when the current dialogue's last page closes.
// Replaces the former per-fight trigger* booleans on `dialogue`.
function queueDialogueEncounter(id) {
  dialogue.triggerEncounterId = id;
}

// ─── Main interaction handler ─────────────────────────────────────────────────
// ─── Interact-press orchestration ────────────────────────────────────────────
// handleInteract() used to be one ~3,600-line if/else-if chain. It is now a
// priority orchestrator over named location handlers:
//
//   - INTERACT_HANDLERS is the top-level priority list. The FIRST entry whose
//     match() returns true gets to run() — and no other entry runs afterwards,
//     preserving the old else-if dispatch exactly (locations are mutually
//     exclusive; first match wins).
//   - A handler's run() returns true when it CONSUMED the interact press
//     (opened dialogue/choice/shop/a reading panel, or otherwise handled it).
//     Consumption is explicit: a scripted interaction that wants to swallow
//     the press without opening any UI can simply `return true`.
//   - If no handler matched, or the matching handler did not consume the
//     press, the generic MAP_FEATURES inspectables run as the lowest-priority
//     fallback (tryMapFeatures()).
//
// Adding new scripted content: find the location handler for the map/building
// (or add a new entry to the right table, keeping more-specific conditions
// before more-generic ones, e.g. Drenwick office before generic office), do
// your proximity check inside it, and `return true` once handled. Inside a
// handler body, `return true` == the old chain's bare `return`.
//
// interactionUiOpened() is the shared "did this press open feedback?" check —
// intentionally broader than the old `dialogue.open`-only guard, so choice
// menus, shops, and reading panels also count as consumption and MAP_FEATURES
// can never open a second, competing dialogue underneath one of them.
function interactionUiOpened() {
  return dialogue.open || choice.open || shop.open || accordPanel.open || continentMap.open;
}

function interactTownOutdoor() {
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
      // Reading the Drenwick board is how the player learns of its posted
      // notices: it marks the Pale Sentry notice as seen (so Constable Tarvec
      // will hand out that contract — see drenwick-town-interactions.js) and,
      // if the sickle posting is up, starts that quest on close.
      if (isDrenwichMarket) {
        dialogue.callbacks = [function() {
          if (!sentry_quest_done) sentry_seen_on_board = true;
          if (sickle_quest_stage === 0) sickle_quest_stage = 1;
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
      return true;
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
      return true;
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
      return true;
    }
  }
  // Overseer Mault — removal contract quest (Calwick, post-sluice, day 5+).
  // The map check mirrors his npcs.js getter gating: without it, standing on
  // his spot before he appears would still trigger this block.
  if (currentTownId === 'calwick' && sluice_reward_given) {
    const mault = SIMPLE_NPCS.find(n => n.id === 'overseer_mault');
    if (mault && mault.map === 'town') {
      const mdx = player.x - mault.x;
      const mdy = player.y - mault.y;
      if (Math.sqrt(mdx * mdx + mdy * mdy) < TALK_RADIUS) {
        if (!warden_quest_started) {
          dialogue.name  = 'Overseer Mault';
          dialogue.pages = [
            ['Mault. District Infrastructure.',
             'You\u2019re the one who cleared the east sluice. I read the report.'],
            ['There\u2019s a Briar Warden denning in the old spring meadow, the far northwest corner of the vale. Three weeks now.',
             'Won\u2019t leave on its own.'],
            ['The way in is grown over \u2014 so you will have to fit the way in yourself west of the town road. You\u2019ll find the clearing.'],
            ['We\u2019ve posted a removal contract.',
             'A hundred and twenty gold, paid on confirmed removal.',
             'The reed crews won\u2019t go near that corner until it\u2019s done.'],
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
                   '\u201cThe meadow, northwest corner. Come back when it\u2019s done.\u201d'],
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
          dialogue.pages = [['\u201cThe meadow, northwest corner. Come back when it\u2019s done.\u201d']];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else {
          dialogue.name  = 'Overseer Mault';
          dialogue.pages = [['\u201cPassage is clear. Maintenance crew goes back in next cycle.\u201d',
                              '\u201cAppreciate the work.\u201d']];
          dialogue.open  = true;
          dialogue.page  = 0;
        }
        return true;
      }
    }
  }
  // Fishing spot — Drenwick Waterfront, dock edge col 3 row 3
  if (currentTownId === 'drenwick' && activeMap === DRENWICK_WATERFRONT_MAP) {
    const fsx = player.x - DRENWICK_FISHING_SPOT.x;
    const fsy = player.y - DRENWICK_FISHING_SPOT.y;
    if (Math.sqrt(fsx * fsx + fsy * fsy) < TALK_RADIUS) {
      const rodPower = bestFishingPower();
      if (rodPower === 0) {
        // No rod — you cannot fish here at all.
        dialogue.name  = '';
        dialogue.pages = [
          ['The water here looks fishable — smelt in the shallows, eel deeper down.',
           'But your hands are empty. You would need a fishing rod.'],
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
        return true;
      }
      choice.title     = '';
      choice.options   = ['Cast line', 'Leave'];
      choice.cursor    = 0;
      choice.callbacks = [
        function cast() {
          // Catch odds scale with the rod's power (Old Fishing Rod = 1). The rare
          // Sealed Letter is a one-time flavour catch — if it is already in the
          // bag, that roll comes up empty rather than handing out a duplicate.
          let outcome = rollFishingOutcome(rodPower);
          if (outcome === 'letter' && stats.items.some(i => i.name === 'Sealed Letter')) outcome = 'nothing';
          dialogue.name = '';
          dialogue.open = true;
          dialogue.page = 0;
          if (outcome === 'nothing') {
            dialogue.pages = [['You cast the line.', 'The water sits still.', 'Nothing bites.']];
          } else if (outcome === 'smelt') {
            grantItem('River Smelt');
            dialogue.pages = [['Something on the line.', 'River Smelt. Small, cold, indignant.', 'Added to items.']];
          } else if (outcome === 'eel') {
            grantItem('Canal Eel');
            dialogue.pages = [['Heavy on the line.', 'Canal Eel. Long, dark, unhappy about it.', 'Added to items.']];
          } else if (outcome === 'boot') {
            grantItem('Old Boot');
            dialogue.pages = [['Heavy on the line.', 'You pull it up.', 'Old Boot. Added to items.']];
          } else { // 'letter'
            grantItem('Sealed Letter');
            dialogue.pages = [
              ['Something catches on the line.', 'You pull it up carefully.'],
              ['A sealed letter. Still mostly dry.', 'The seal is already broken.', 'You unfold it.'],
              ['TRANSIT AUTHORIZATION — VOID',
               'Bearer: [name removed].',
               'Route: Drenwick to [destination removed].',
               'Note: Do not proceed. Return to sender.'],
              ['The sender’s address has been cut away.', 'Added to items.'],
            ];
          }
        },
        function leave() {},
      ];
      choice.open = true;
      return true;
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
            // Second page is day-aware: Tev stands beside her in the square on
            // Dayoff, but he's at the schoolhouse on work days \u2014 "over there"
            // was wrong five days out of five... four out of five.
            dialogue.pages = [
              ['\u201cOh \u2014 sorry. I was miles away.\u201d',
               'She tucks something into her coat pocket.',
               '\u201cYou\u2019re from the office, aren\u2019t you. I\u2019ve seen you on the square.\u201d'],
              day % 5 === 0
                ? ['\u201cI\u2019m Sena.\u201d',
                   '\u201cThat\u2019s my son over there.\u201d',
                   '\u201cTev. He won\u2019t bite.\u201d']
                : ['\u201cI\u2019m Sena.\u201d',
                   '\u201cMy son Tev\u2019s at the schoolhouse just now.\u201d',
                   '\u201cYou\u2019ll know him if you meet him. He talks.\u201d'],
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
        return true;
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
        return true;
      }
    }
  }
  // Outdoor NPCs (Drenwick civic, market, waterfront, etc.)
  interactSimpleNPCs();
  return interactionUiOpened();
}

// ─── Office cabinet rummage flavor ───────────────────────────────────────────
// Shared by both offices' filing cabinets (Drenwick FILING_CABINET and Calwick
// ESLA_CABINET) as their default, non-quest response — quest branches (the
// Weight Discrepancy note, the disturbed-files aftermath) take priority and
// are unchanged. One entry is picked fresh on every press. Strictly mundane
// administrative texture: no plot, no secrets, just the machinery of district
// paperwork and its occasional quiet absurdity.
const OFFICE_CABINET_FLAVOR = [
  [['Requisition forms. Form R-11: Request for Additional Forms.',
    'The stack is nearly out.',
    'Someone will need to file an R-11 to order more R-11s. A note in the drawer acknowledges this.']],
  [['A folder labelled MISCELLANEOUS — DO NOT MISFILE.',
    'It is empty, and filed under P.']],
  [['Thirty years of sluice inspection logs. Every entry reads “no change.”',
    'Except the year the log itself was water-damaged.',
    'That entry reads “some change.”']],
  [['Ink requisitions, quarterly, in triplicate.',
    'By the office’s own records, roughly a fifth of its ink is spent ordering ink.']],
  [['A drawer of worn pen nibs, sorted into labelled trays:',
    'NEW. SERVICEABLE. QUESTIONABLE. CEREMONIAL.',
    'The ceremonial tray is the fullest.']],
  [['A complaint about the draught under the north window, filed in 1043.',
    'It has been re-stamped PENDING SITE VISIT every year since. Twenty-nine stamps.',
    'The window is four steps from the cabinet.']],
  [['Correspondence regarding a missing ledger.',
    'It is filed inside the ledger it reports missing.',
    'Nobody has annotated this.']],
  [['The rainfall observation ledger.',
    'The last dozen entries read “nothing to report,” then “nothing,” then just a date.',
    'Somebody kept showing up to write it, though. Every single day.']],
  [['A boundary memorandum settling which files belong in which cabinet.',
    'It cites an earlier memorandum, which cites a hearing, which was adjourned.',
    'The files in question have been in a box on the floor since before the hearing.']],
  [['Someone’s lunch order, filed under URGENT.',
    'It is nine years old.',
    'Eel, bread, no pickle. Underlined twice.']],
];
function randomCabinetPages() {
  return OFFICE_CABINET_FLAVOR[Math.floor(Math.random() * OFFICE_CABINET_FLAVOR.length)];
}

// The player's house cat interaction (the fixed hd.cat furniture in
// player_house): the cat_quest coin/corner stages, and a plain pet otherwise.
// Called from interactHouseInterior()'s hd.cat proximity check.
function interactPlayerCat() {
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
    return true;
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
    return true;
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
  return true;
}

function interactHouseInterior() {
  // ── Den Wraith encounter (west_i, Dayoff only, quest active) ─────────────
  if (currentHouseId === 'west_i' && den_wraith_quest_started && !den_wraith_defeated) {
    const dwx = player.x - DEN_WRAITH.x;
    const dwy = player.y - DEN_WRAITH.y;
    if (Math.sqrt(dwx * dwx + dwy * dwy) < TALK_RADIUS) {
      dialogue.name  = '';
      dialogue.pages = [
        ['Something shifts in the corner.', 'It turns toward you.'],
      ];
      queueDialogueEncounter('den_wraith');
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }
  // ── Cat Armor chest (player_house secret pocket, Day 2+) ─────────────
  if (currentHouseId === 'player_house' && day >= 2 && !CAT_ARMOR_CHEST.opened) {
    const cax = player.x - CAT_ARMOR_CHEST.x;
    const cay = player.y - CAT_ARMOR_CHEST.y;
    if (Math.sqrt(cax * cax + cay * cay) < TALK_RADIUS) {
      CAT_ARMOR_CHEST.opened = true;
      const it = CAT_ARMOR_CHEST.item;
      grantItem(it.name);
      dialogue.name  = '';
      dialogue.pages = [['There is something here after all.',
                         `\u2014 ${it.name} found.`,
                         `${itemStatParen(it)}  \u2014 added to items.`]];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
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
      return true;
    }
  }
  if (hd && hd.cat) {
    const cdx = player.x - hd.cat.x;
    const cdy = player.y - hd.cat.y;
    if (Math.sqrt(cdx * cdx + cdy * cdy) < TALK_RADIUS) return interactPlayerCat();
  }
  if (hd && hd.stove) {
    const sdx = player.x - hd.stove.x;
    const sdy = player.y - hd.stove.y;
    if (Math.sqrt(sdx * sdx + sdy * sdy) < TALK_RADIUS) {
      dialogue.name  = 'Stove';
      dialogue.pages = [['slightly rusting from humidity']];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
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
            if (day % 5 === 3) {
              // The strange dream plays with the player standing in the
              // all-white DREAM_MAP; the waking world (bed, house, town
              // flags) is stashed by enterDream() and restored when the
              // last dream page closes.
              const dreamIdx = Math.floor(day / 5) % DREAMS.length;
              enterDream();
              dialogue.name      = '';
              dialogue.pages     = DREAMS[dreamIdx];
              dialogue.callbacks = [function() { exitDream(); }];
              dialogue.open      = true;
              dialogue.page      = 0;
            } else {
              // Ordinary night — no vivid dream. A quick line so resting always
              // acknowledges itself rather than closing the menu in silence.
              dialogue.name  = '';
              dialogue.pages = [['You sleep through the night. No dreams you can hold onto — just the plain dark, and morning.']];
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
      return true;
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
          if (raw === null) return true;
          const amount = Math.floor(Number(raw));
          if (!amount || amount <= 0) {
            dialogue.name  = 'Chest';
            dialogue.pages = [['Not a valid amount.']];
            dialogue.open  = true;
            dialogue.page  = 0;
            return true;
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
        return true;
      }
      opts.push('Close');
      cbs.push(function close() {});
      choice.title     = 'Chest \u2014 Life Savings';
      choice.options   = opts;
      choice.cursor    = 0;
      choice.callbacks = cbs;
      choice.open      = true;
      return true;
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
      return true;
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
        grantItem('Potion');
        grantItem('Reed Remedy');
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
      return true;
    }
  }
  // ── Floor sparkle — one-time Old Fishing Rod pickup ────────────────────
  if (hd && hd.sparkle && !hd.sparkle.taken) {
    const spdx = player.x - hd.sparkle.x;
    const spdy = player.y - hd.sparkle.y;
    if (Math.sqrt(spdx * spdx + spdy * spdy) < TALK_RADIUS) {
      hd.sparkle.taken = true;
      grantItem('Old Fishing Rod');
      dialogue.name  = '';
      dialogue.pages = [
        ['Something juts out from behind the skirting board.',
         'You work it free — a battered old fishing rod, its line frayed but whole.'],
        ['Got Old Fishing Rod. Worn out, but it will still cast.'],
      ];
      dialogue.open = true;
      dialogue.page = 0;
      return true;
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
      return true;
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
      return true;
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
        return true;
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
        return true;
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

        if (!wine_quest_started && MainQuest < 2) {
          // Quest gate: Fenna doesn't ask until the player is established
          // (MainQuest >= 2, i.e. the Drenwick dispatch is done). Before
          // that she just frets about the drought \u2014 which quietly seeds the
          // quest's ingredients: the fen mushrooms, the wine, her dad.
          dialogue.name  = 'Fenna';
          dialogue.pages = [
            ['\u201cOh \u2014 hello.\u201d',
             'She looks relieved to have someone to talk to.'],
            ['\u201cIt hasn\u2019t rained in three months. You\u2019ve noticed, obviously.',
             'Everyone\u2019s noticed. Everyone talks about the canal.\u201d'],
            ['\u201cNobody talks about the mushroom beds.',
             'The fen mushrooms need the wet \u2014 if the beds dry out, that\u2019s the wine gone too.\u201d'],
            ['\u201cMy dad practically lives on the stuff.\u201d',
             'She shakes her head.',
             '\u201cListen to me. There are people losing barges, and I\u2019m worrying about wine.\u201d'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;

        } else if (!wine_quest_started) {
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
                grantItem('Amethyst Bangle');
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
        return true;
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
            ['“Voss.”',
             '“I work the provision store, down by the civic quarter.”',
             '“I keep the stock. I know to the loaf what should be on those shelves.”'],
            ['“Can I ask you something?”',
             '“Something I can’t ask anyone who lives here.”'],
            ['“My neighbor — the one next door, unit two — Clodagh.”',
             '“She cut reeds on the south beds. The drought killed the beds. No reeds, no wage — same as half this building.”',
             (day % 5 === 0)
               ? '“She’s home today — it’s the dayoff. Which is the only reason I can say this without her hearing it through the wall.”'
               : '“She’s out looking for work right now, so I can say this without her hearing it through the wall.”'],
            ['“Food’s dear now. Dearer every week the rains don’t come.”',
             '“And the shelves have been coming up short. A little at a time — bread, mostly. Dried fish.”',
             '“It’s her. I’ve seen it. Something under the shawl, and out the door without stopping at the counter.”'],
            ['“I know why. I’m not stupid.”',
             '“Her man’s had no work since the beds went dry. They’re behind on the rent, hungry with it.”',
             '“But it’s the store’s loss, and the store’s barely holding on either. The owner’s already talking about letting someone go.”'],
            ['“If I tell the owner, she’s barred — maybe handed to the constable. Theft’s theft.”',
             '“If I don’t, and he works it out himself, it’s my job. I’m the one who keeps the count.”',
             '“I’ve been sitting on it three weeks.”'],
            ['“What would you do?”'],
          ];
          dialogue.callbacks = [function() {
            choice.title     = 'Voss';
            choice.options   = [
              'Tell the owner. Theft’s theft, hard times or not.',
              'Say nothing. She’s hungry, not greedy.',
              'It’s not your decision to make.',
            ];
            choice.cursor    = 0;
            choice.callbacks = [
              function report() {
                dilemma_voss = 'report';
                dialogue.name  = 'Voss';
                dialogue.pages = [
                  ['“Theft’s theft. Yeah.”',
                   '“The store’s hungry too, in its way. Every loaf that walks out is one the owner paid for.”'],
                  ['“I’ll tell him.”'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              },
              function protect() {
                dilemma_voss = 'protect';
                dialogue.name  = 'Voss';
                dialogue.pages = [
                  ['“She’s taking bread, not silver. She’s feeding two people through a drought.”',
                   '“A few loaves won’t sink the store.”'],
                  ['“I’ll leave it be.”'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              },
              function abstain() {
                dilemma_voss = 'abstain';
                dialogue.name  = 'Voss';
                dialogue.pages = [
                  ['“Not my decision.”',
                   '“Except it’s my count, and my name on the stock book. So it’s half mine whether I want it or not.”'],
                  ['“I’ll think about it.”'],
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
            ['“I told the owner.”',
             '“He’s barred her from the store. Said he’d have called the constable if it had been any more than it was.”',
             '“Two weeks ago now.”'],
            ['“Clodagh hasn’t spoken to me since.”',
             '“I don’t know how she found out it was me. Maybe she just assumed.”',
             '“Everyone knows who keeps the count.”'],
            ['“I thought I’d feel settled once it was done.”',
             '“I don’t.”'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else if (dilemma_voss === 'protect') {
          dialogue.name  = 'Voss';
          dialogue.pages = [
            ['“I’ve been covering the shortfall myself.”',
             '“A few coppers a week out of my own pocket to make the count come out right.”',
             '“Cheaper than what it’d cost her if I didn’t. I tell myself it’s just being neighborly.”'],
            ['“Her man found a half-week’s work on the locks.”',
             '“Might be it’s starting to ease. Might not.”'],
            ['“I try not to think past that.”'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else if (dilemma_voss === 'abstain') {
          dialogue.name  = 'Voss';
          dialogue.pages = [
            ['“I’ve been turning it over.”',
             '“You said it’s not my decision. You’re probably right.”'],
            ['“But it’s my count, my stock book. Saying nothing is still saying something.”',
             '“Every week the shelves come up short and I write it off, I’ve made a choice.”'],
            ['“I haven’t done anything yet.”',
             '“I just needed someone else to know that I know.”'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
        }
        return true;
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
            grantItem('Thank-You Note');
            wine_quest_delivered = true;
            wine_quest_gift      = gift;
            syncQuestFlagsToWindow();
          }];
          dialogue.open  = true;
          dialogue.page  = 0;
          return true;
        }
      }
    }
  }

  interactSimpleNPCs();
  return interactionUiOpened();
}

// Overworld/town location handlers, in priority order. Mirrors the old inner
// else-if chain exactly: conditions are unchanged and more-specific entries
// (Drenwick variants) stay above their generic counterparts.
const OVERWORLD_INTERACT_HANDLERS = [
  { name: "sluice"              , match: () => inSluice                                                              , run: interactSluiceInterior },
  { name: "mire-vault"          , match: () => inMireVault                                                           , run: interactMireVault },
  { name: "takomo-chamber"      , match: () => inTakomo                                                              , run: interactTakomoChamber },
  { name: "falls-hamlet"        , match: () => inHamletInterior                                                      , run: interactHamletInterior },
  { name: "ruins-entrance"      , match: () => inDungeonEntrance                                                     , run: interactRuinsEntranceHall },
  { name: "town-outdoor"        , match: () => inTown && !townBuilding                                               , run: interactTownOutdoor },
  { name: "office-drenwick"     , match: () => inTown && townBuilding === 'office' && currentTownId === 'drenwick'   , run: interactDrenwickOffice },
  { name: "office"              , match: () => inTown && townBuilding === 'office'                                   , run: interactCalwickOffice },
  { name: "inn-drenwick"        , match: () => inTown && townBuilding === 'inn' && currentTownId === 'drenwick'      , run: interactDrenwickInn },
  { name: "inn"                 , match: () => inTown && townBuilding === 'inn'                                      , run: interactCalwickInn },
  { name: "school-drenwick"     , match: () => inTown && townBuilding === 'school' && currentTownId === 'drenwick'   , run: interactDrenwickSchool },
  { name: "harbormaster"        , match: () => inTown && townBuilding === 'harbormaster'                             , run: interactHarbormaster },
  { name: "guild-hall-drenwick" , match: () => inTown && townBuilding === 'guild_hall' && currentTownId === 'drenwick', run: interactDrenwickGuildHall },
  { name: "wash-house"          , match: () => inTown && townBuilding === 'wash_house'                               , run: interactWashHouse },
  { name: "infirmary-drenwick"  , match: () => inTown && townBuilding === 'infirmary' && currentTownId === 'drenwick', run: interactDrenwickInfirmary },
  { name: "provision-store"     , match: () => inTown && townBuilding === 'provision_store'                          , run: interactProvisionStore },
  { name: "tavern-drenwick"     , match: () => inTown && townBuilding === 'tavern' && currentTownId === 'drenwick'   , run: interactDrenwickTavern },
  { name: "house-interior"      , match: () => inTown && townBuilding === 'house'                                    , run: interactHouseInterior },
  { name: "sunken-gallery"      , match: () => inSunkenGallery                                                       , run: interactSunkenGallery },
  { name: "calwick-vale"        , match: () => activeMap === MEADOW_MAP || activeMap === MAREN_POST_MAP               , run: interactCalwickVale },
  { name: "thornmere-wilds"     , match: () => activeMap === SMUGGLER_FORT_MAP || inFenBrewery                        , run: interactThornmereWilds },
  { name: "drenwick-approach"   , match: () => inDrenwrickPost                                                        , run: interactDrenwickApproach },
  { name: "north-basin-wilds"   , match: () => true                                                                  , run: interactNorthBasinWilds },
];

function interactOverworld() {
  // Map-specific prefix checks (may consume the press, else fall through).
  if (interactMapN2Gate()) return true;
  if (interactThornmereStone()) return true;
  for (const h of OVERWORLD_INTERACT_HANDLERS) {
    if (h.match()) return h.run();   // first matching location wins (else-if semantics)
  }
  return false;
}

// Top-level interact priority list — first match wins, exactly one runs.
const INTERACT_HANDLERS = [
  { name: 'dungeon-floor-1', match: () => inDungeon && dungeonFloor === 1, run: interactDungeonFloor1 },
  { name: 'overworld-town',  match: () => !inDungeon,                      run: interactOverworld },
  { name: 'dungeon-floor-4', match: () => inDungeon && dungeonFloor === 4, run: interactMulhollandFloor },
  { name: 'dungeon-floor-5', match: () => inDungeon && dungeonFloor === 5, run: interactWrongteethFloor },
];

// Finalize a dialogue when its last page closes. Order matters and is preserved
// from the old inline logic:
//   1. Close the dialogue and reset its page.
//   2. Run the next queued callback (it may reopen dialogue / requeue itself).
//   3. Dispatch at most one queued encounter — clearing the id BEFORE starting
//      combat so a repeated interact press can't launch the same fight twice.
function finishDialogue() {
  dialogue.open = false;
  dialogue.page = 0;
  if (dialogue.callbacks) {
    const cb = dialogue.callbacks.shift();
    if (cb) cb();
    if (dialogue.callbacks.length === 0) dialogue.callbacks = null;
  }
  if (dialogue.triggerEncounterId) {
    const id = dialogue.triggerEncounterId;
    dialogue.triggerEncounterId = null;
    const handler = ENCOUNTER_HANDLERS[id];
    if (handler) handler();
    else console.warn('[encounter] no handler for id "' + id + '"');
  }
}

function handleInteract() {
  if (menu.open || shop.open) return;
  if (dialogue.open) {
    dialogue.page++;
    if (dialogue.page >= dialogue.pages.length) {
      finishDialogue();
    }
    return;
  }

  for (const h of INTERACT_HANDLERS) {
    if (!h.match()) continue;
    if (h.run()) return;   // handler consumed the press
    break;                 // location matched but didn't consume — no other
                           // location handler may run (old else-if semantics);
                           // fall through to the MAP_FEATURES fallback.
  }

  // Generic MAP_FEATURES inspectables — lowest priority. Runs only when no
  // handler consumed the press. The interactionUiOpened() guard is belt and
  // suspenders on top of the explicit consumption returns above: even if a
  // future handler opens UI but forgets to return true, MAP_FEATURES still
  // steps aside instead of opening a second, competing dialogue over it —
  // and unlike the old `!dialogue.open` check, choice menus / shops /
  // reading panels count too.
  if (!interactionUiOpened()) tryMapFeatures();

  // Cross-seam neighbour interaction — the LOWEST priority, tried only when the
  // active map (handlers + MAP_FEATURES) resolved nothing this press. In
  // Continuous View, a safe stationary simple-dialogue NPC on a directly
  // adjacent eligible-seam neighbour, within reach and authorized, may be talked
  // to; everything else fails closed. Active-map behaviour is unchanged, and this
  // can never fire beneath already-open UI or duplicate an active-map prompt.
  if (!interactionUiOpened() && typeof tryCrossSeamNeighbourInteract === 'function') tryCrossSeamNeighbourInteract();
}
