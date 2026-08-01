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
//   flag         (optional) a persistent window-flag name set true whenever
//                this feature's pages are shown. UNLIKE onceFlag it does not
//                gate repeats -- the feature stays re-readable; the flag just
//                records that the player has seen it, for later logic to read
//                (e.g. the Sunken Gallery clue report to the Supervisor).
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

  // \u2500\u2500 Calwick main square & lanes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // First environmental flavor for the starting town itself (it had none).
  // Same currentTownId condition convention as the west survey marker
  // above. Both sit on plain street tiles, well clear of the market rows
  // (6-8) and every SIMPLE_NPCS position, so nothing higher-priority can
  // shadow them.
  TOWN_MAP: [
    {
      id:        'calwick_charter_stone',
      type:      'inspect',
      x:         1.5, y: 5.5,
      condition: () => currentTownId === 'calwick',
      label:     'Charter stone',
      pages: [
        ['A waist-high boundary stone where the west road enters town.',
         'The face has been re-cut at least twice.'],
        ['CALWICK \u2014 INCORPORATED TOWN',
         'Thornmere Drainage District.',
         'Re-dedicated in the Millennial year, 1000 AC.'],
        ['Under the newer lettering, an older line survives in shallower strokes:',
         '\u201c\u2026raised from the reeds, and holds while the water lets it.\u201d'],
      ],
    },
    {
      id:        'calwick_town_cistern',
      type:      'inspect',
      x:         11.5, y: 12.5,
      condition: () => currentTownId === 'calwick',
      label:     'Public cistern',
      pages: [
        ['The town cistern \u2014 a broad stone-lipped tank at the end of the south lane.',
         'Depth marks are painted down the inside wall.'],
        ['The water stands a full hand below the lowest painted mark.',
         'Someone has chalked a new line under it rather than repainting properly.'],
        ['A damp office notice is tacked to the lip:',
         'DRAW FOR HOUSEHOLD USE ONLY UNTIL FURTHER NOTICE.',
         'Third month without rain. The word \u201cdrought\u201d is official now.'],
      ],
    },
  ],

  // \u2500\u2500 Calwick east side \u2014 the wetland margin \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // The working edge of town: reed harvest and the office's water-level
  // bookkeeping. The gauge deliberately reads like a small local echo of
  // the North Basin story (old high marks stranded above the water).
  EAST_TOWN_MAP: [
    {
      id:        'calwick_wetland_gauge',
      type:      'inspect',
      x:         13.5, y: 5.5,
      condition: () => currentTownId === 'calwick',
      label:     'Water gauge',
      pages: [
        ['A numbered measuring stave driven into the reed bed where the wetland meets the road.',
         'The paint is freshest near the bottom.'],
        ['The wet line sits well below the old high-water stains.',
         'A weathered tin plate: READINGS TAKEN FIRST WORKDAY. FORWARD TO OFFICE.'],
        ['Someone has scratched beside the lowest number:',
         '\u201csame story up north.\u201d'],
      ],
    },
    {
      id:        'calwick_reed_racks',
      type:      'inspect',
      x:         7.5, y: 10.5,
      condition: () => currentTownId === 'calwick',
      label:     'Reed-drying racks',
      pages: [
        ['Reed-cutters\u2019 drying racks \u2014 long horizontal poles hung with bound bundles.',
         'Half the pegs are empty.'],
        ['Tally marks are cut into the end post, one row per season.',
         'This season\u2019s row is the shortest by some way.'],
        ['The bundles that are here are thin.',
         'Good reed wants standing water, and the beds have been drying back all year.'],
      ],
    },
  ],

  // ── The Fourteenth File (side quest) clues ─────────────────────────────────
  // Three drought-exposed clues on far-flung but accessible maps, each gated to
  // while the case is being worked (fourteenth_file_stage === 1) and each
  // recording a window-native `flag` the Supervisor reads back at report time
  // (reportFourteenthFile). Coordinates verified walkable / non-transition /
  // clear of NPCs on the live maps. Same clue-report pattern as the Sunken
  // Gallery observer clues above.
  MAP5: [
    {
      id: 'ff_skiff', type: 'inspect', x: 8.5, y: 7.5, label: 'A foundered skiff', flag: 'ff_clue_skiff',
      condition: () => fourteenth_file_stage === 1,
      pages: [
        ['The drought has walked the shallows back and left a boat sitting on cracked mud where open water used to be.',
         'A patrol skiff — flat-bottomed, iron-shod, the kind the district issued its fen constables. It has been under a long time.'],
        ['Silt fills the hull to the thwarts. Wedged beneath the bench, a tin patrol tally-book, swollen shut; you work a few pages open.',
         'A constable’s hand, dutiful and dull: reed counts, toll checks, a name at the head of each page. HALDEN MARSH.'],
        ['The last legible entries stop being about reeds. A works barge logged where no barge was scheduled. A night count that doesn’t match the day’s. A line: “raise it with the Warden direct.”',
         'The final page is torn out at the spine. Whatever Marsh meant to raise, he carried it into the water with him — fourteen years ago, by the dates.'],
      ],
      repeatPages: [
        ['The skiff sits in the dried mud. Marsh’s tally-book is back under the bench where you found it — its last page still gone.'],
      ],
    },
  ],
  MAP3: [
    {
      id: 'ff_dedication', type: 'inspect', x: 8.5, y: 12.5, label: 'A dedication stone', flag: 'ff_clue_dedication',
      condition: () => fourteenth_file_stage === 1,
      pages: [
        ['A dedication stone set into the bank where the fen road meets the old sluice — the works that keep the south marsh from taking the road each wet season.',
         'Someone keeps it clean. Fresh reeds are laid at its foot, the way they’re laid for the respected dead.'],
        ['RAISED FOR THE SAFETY OF THE DISTRICT — BY REEVE CALLIS, WARDEN — AND COMPLETED IN HIS OWN HAND.',
         '“That the fen may hold while the water lets it,” the old town blessing, cut deep. Below it, smaller and newer: “In memory. — his daughter.”'],
        ['A good man’s monument, tended by a daughter with no reason to doubt it: the Warden who saved the fen from the flood.',
         'Only the completion date sits wrong now. It’s the season the drainage fund closed short — and the season a fen constable went into the water with a torn-out page.'],
      ],
      repeatPages: [
        ['Callis’s dedication stone stands clean at the sluice, fresh reeds at its foot. His daughter still tends it.'],
      ],
    },
  ],

  // \u2500\u2500 The Upper Reach (North Basin NW) \u2014 liminal wrongness pass \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // No NPCs, no encounters, no saving up here (see MAP_METADATA). All the
  // area's wrongness is carried by this text: everything is described
  // plainly and nothing is explained. Same lore boundary as the Deep Works
  // sealed room \u2014 do not extend LORE.md for any of it.
  // The three onceFlag'd triggers below ARE persisted (first MAP_FEATURES
  // flags in QUEST_FLAG_SCHEMA \u2014 see save.js/quests.js).
  NORTH_BASIN_NW_MAP: [
    {
      id:       'upper_reach_arrival',
      type:     'trigger',
      rect:     { x1: 1, y1: 12, x2: 11, y2: 14 },  // tile rows 12-13, cols 1-10 (player-center coords are fractional: row 13's center is 13.5, so the bounds are exclusive-feeling +1s)
      onceFlag: 'upper_reach_seen',
      label:    'Upper Reach first entry',
      pages: [
        ['The ground changes under your boots \u2014 the crack pattern here is old, set hard.',
         'This arm of the reservoir didn\u2019t recede. It finished.'],
        ['No birds. No wind you can hear, though you can watch it move the dead reeds.',
         'The office has no readings from up here.',
         'Nobody sends readings from up here.'],
      ],
    },
    {
      id: 'upper_reach_fence', type: 'inspect', x: 5.5, y: 6.5, radius: 40, allowUnwalkable: true,
      label: 'Fence line',
      pages: [
        ['A fence line. Eight posts, dead straight, the wire long gone.',
         'It runs across what was open water.'],
        ['The posts are old \u2014 older than the drought by decades at least.',
         'Whoever set them, set them on the lake bottom. In a line.'],
        ['There is no gate.'],
      ],
    },
    {
      id: 'upper_reach_highwater', type: 'inspect', x: 2.5, y: 2.5,
      label: 'High-water stone',
      pages: [
        ['A shoulder of bare rock, silt-scoured.',
         'The old waterline stains ring it like growth rings.'],
        ['You put your hand up to the highest stain.',
         'You cannot reach it.'],
      ],
    },
    {
      id: 'upper_reach_doorframe', type: 'inspect', x: 11.5, y: 3.5,
      label: 'Standing doorframe',
      pages: [
        ['A stone doorframe, standing. No wall on either side of it. No building behind it.',
         'The frame is clean. Everything else out here wears the silt.'],
        ['The opening inside it is black. Not shadowed \u2014 black, the same flat black head-on as from an angle.',
         'No far wall. No light. Nothing catches on it at all.'],
        ['You lean in for a better look.',
         'There is no better look to get.'],
      ],
    },
    {
      id: 'upper_reach_stairhead', type: 'inspect', x: 3.5, y: 9.5,
      label: 'Exposed stairhead',
      pages: [
        ['Cut stone, fresh out of the silt: an apron of flagging, and a stairhead going down.',
         'The reservoir was built over this. Or around it. Or without knowing it was there.'],
        ['The steps are still wet below the third one.',
         'Water under the ground has nowhere to be but level. These steps go below it.'],
      ],
    },
    {
      id: 'upper_reach_pool', type: 'inspect', x: 10.5, y: 10.5, radius: 40, allowUnwalkable: true,
      label: 'Residual pool',
      pages: [
        ['One of the last pools the drought has left up here.',
         'It does not ripple. Not while you watch it.'],
        ['You can hear the wind cross the flat.',
         'The pool holds still.'],
      ],
    },
  ],

  // \u2500\u2500 The unmarked chamber \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  BASIN_CHAMBER_MAP: [
    {
      id:       'basin_chamber_arrival',
      type:     'trigger',
      rect:     { x1: 5, y1: 3, x2: 12, y2: 10 },  // the whole interior (rows 3-9, cols 5-11, center coords)
      onceFlag: 'basin_chamber_seen',
      label:    'Chamber first entry',
      pages: [
        ['The mud stops at the threshold. Inside, the floor is clean.',
         'Not swept-clean. Never-needed-sweeping clean.'],
        ['The room is lit evenly, from nowhere in particular.',
         'It is exactly as bright behind you as ahead of you.'],
        ['Then you notice the smell — or rather, that there isn’t one.',
         'Out on the reach it is all peat-rot and standing water, always. Here there is nothing to smell at all. The air is completely odourless.'],
        ['It is quiet in a way that has weight.'],
      ],
    },
    {
      id: 'basin_chamber_wall', type: 'inspect', x: 8.5, y: 2.5, radius: 40, allowUnwalkable: true,
      label: 'The wall',
      pages: [
        ['The wall is one surface. No blocks, no seams, no tool marks.',
         'It is very slightly warm.'],
        ['Every wall in the Empire says who made it, if you know how to read it.',
         'This one says nothing, fluently.'],
      ],
    },
    {
      id: 'basin_chamber_floor', type: 'inspect', x: 8.5, y: 6.5,
      label: 'The floor',
      pages: [
        ['No dust. No silt \u2014 and the reach outside is nothing but silt.',
         'Your boots have left prints as far as the middle of the room.'],
        ['After that the prints stop.',
         'You are standing past where they stop.'],
      ],
    },
    {
      id: 'basin_chamber_threshold', type: 'inspect', x: 7.5, y: 9.5,
      label: 'The threshold',
      pages: [
        ['From this side, the doorway is the same flat black rectangle it was from outside.',
         'No reach. No silt. No light.'],
        ['You know which way you walked in from.',
         'That is not the same as being able to see it.',
         'You have been here a while.'],
      ],
    },
  ],

  // \u2500\u2500 The Sunken Gallery \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  SUNKEN_GALLERY_MAP: [
    {
      id:       'sunken_gallery_arrival',
      type:     'trigger',
      rect:     { x1: 2, y1: 2, x2: 9, y2: 5 },  // the foot of the stair (rows 2-4, cols 2-8, center coords)
      onceFlag: 'sunken_gallery_seen',
      label:    'Gallery first descent',
      pages: [
        ['The air is cold and closed, like the inside of a bell.',
         'Everything smells of river bottom \u2014 silt, iron, the underside of a long time.'],
        ['This hall was full of water until this season.',
         'The drought did not build the stair behind you. It only stopped hiding it.'],
      ],
    },
    {
      id: 'sunken_gallery_waterline', type: 'inspect', x: 7.5, y: 1.5, radius: 40, allowUnwalkable: true,
      label: 'Waterline band',
      pages: [
        ['A chalky mineral band runs the walls at head height, dead level, all the way around.',
         'The hall was full to here. For longer than anyone has been counting anything.'],
      ],
    },
    {
      id: 'sunken_gallery_footprints', type: 'inspect', x: 7.5, y: 8.5,
      label: 'Footprints in the silt',
      pages: [
        ['The silt lies over the floor like a dropped cloth.',
         'There is a line of footprints in it.'],
        ['They come up out of the standing water, cross the hall, and end at the stair.',
         'They are not yours. They are not wearing boots.'],
        ['The silt was underwater until this season.',
         'Recently, then.'],
      ],
    },
    {
      id: 'sunken_gallery_water', type: 'inspect', x: 6.5, y: 9.5,
      label: 'The flooded hall',
      pages: [
        ['The south half of the hall is still drowned. The water is perfectly clear and perfectly dark at once.',
         'Rows of columns continue down into it, then stop being visible, without getting smaller.'],
        ['Nothing in it moves.',
         'You notice you have been holding your breath, and stop, and the sound is enormous.'],
      ],
    },
  ],

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

  // \u2500\u2500 East Sluice \u2014 Sealed Room (SLUICE_SECRET_MAP, behind the L3 false
  // walls) \u2500\u2500 Four inspectables, all anchored to their own visible tiles
  // (95-98). Floor features use radius 24 (fire only while standing on the
  // tile); wall features use radius 40 (fire from the adjacent floor tile).
  // The geometry was chosen so no two features are in range at once \u2014
  // nothing here relies on array order to disambiguate. Deliberately no
  // feature, no hint, and no changed tile at the L3 false walls or the
  // hidden entrance: the passage is findable only by walking into it.
  SLUICE_SECRET_MAP: [
    {
      id: 'sluice_sealed_bloodstain', type: 'inspect', x: 7.5, y: 9.5, radius: 24, label: 'Old stain',
      pages: [
        ['A stain, soaked deep into the slab and the joints around it.',
         'Old enough to have gone black. Wide enough that you stop trying to think of it as anything but what it is.'],
        ['Someone scrubbed at the edges once. Only the edges.',
         'Either they gave up, or they only ever meant to make room to kneel.'],
      ],
    },
    {
      id: 'sluice_sealed_journal', type: 'inspect', x: 5.5, y: 10.5, radius: 24, label: 'Abandoned journal',
      pages: [
        ['A journal lies against the wall, cover warped with damp, strap still buckled.',
         'The hand inside is neat, provincial \u2014 a works clerk\u2019s hand.'],
        ['\u201cThe survey says this level is thirty-one years old. The survey is correct about the level.',
         'It is not correct about this room. The brick courses do not meet ours. Ours were laid around these.\u201d'],
        ['\u201cNo drain serves it. No conduit passes through it. It holds nothing, feeds nothing, drains nothing.',
         'A room with no purpose, sealed on every side, under twenty feet of working stone.',
         'Except nobody seals a room that has no purpose.\u201d'],
        ['\u201cI have asked the district for the pre-works plans. The district says there are no pre-works plans.',
         'Not lost. Says there never were any. A thing was built here and there was never a plan for it.\u201d'],
        ['\u201cI keep coming back to the marks on the east wall. I have stopped showing them to people.',
         'The foreman looked at them and put me on the north gates for a month.\u201d'],
        ['\u201cEleven cuts in the south wall. Made with a blade, patient, all the same depth.',
         'Eleven of what? I have counted everything I can think to count down here.',
         'Nothing in the Deep Works comes to eleven.\u201d'],
        ['\u201cWhat was any of it for? That is the whole of what I want to know.',
         'What was this for, and why did whoever knew make so certain the knowing would not keep?\u201d'],
        ['The remaining pages are blank.',
         'The last entry is not signed. None of them are.'],
      ],
    },
    {
      id: 'sluice_sealed_markings', type: 'inspect', x: 10.5, y: 9.5, radius: 40, allowUnwalkable: true, label: 'Carved markings',
      pages: [
        ['The east wall is carved, shoulder to waist height, with lines of short strokes.',
         'Deliberate. Spaced like writing. Not the Empire\u2019s script, and not anything the Empire replaced.'],
        ['The cuts are older than the mortar around them \u2014 the brick was trimmed to fit the carving, not the other way round.',
         'Whoever built the sluice found this wall already here, and chose to keep it.'],
        ['Near the floor, one line has been struck through with a single deeper cut.',
         'It is impossible to know whether that was the carver, or a reader.'],
      ],
    },
    {
      id: 'sluice_sealed_notches', type: 'inspect', x: 7.5, y: 11.5, radius: 40, allowUnwalkable: true, label: 'Eleven notches',
      pages: [
        ['A row of notches, cut into the brick at shoulder height.',
         'Even spacing. Even depth. A patient blade.'],
        ['You count them twice.',
         'Eleven, both times.'],
        ['Not a tally that trails off \u2014 a tally that stopped.',
         'There is room on the wall for a twelfth.'],
      ],
    },
  ],

  // ── Roddon Way — the old creek-bed ridge ─────────────────────────────
  // Ordinary regional geography, not a mystery: every entry here describes
  // something the player can see from where they're standing. No onceFlag
  // on any of these -- plain repeatable inspect text, not a discovery worth
  // a persistent flag. Only 'roddon_way_viewpoint' explains the word
  // itself; the rest just describe what's in front of the player.
  RODDON_WAY_MAP: [
    {
      id: 'roddon_way_viewpoint', type: 'inspect', x: 6.5, y: 2.5, label: 'Viewpoint',
      pages: [
        ['A slight rise in the ridge here, just enough to see over the reeds.',
         'Below, a shallow hollow of standing water and sedge — and around you, the ground you’re standing on, paler and firmer than anywhere near it.'],
        ['“Roddon” is the old word for it: the silt bed of a creek that used to run here, packed firm while it flowed.',
         'The creek is long gone. The peat around it has been sinking for longer than anyone’s kept a record. The silt never did.'],
        ['The ridge you’re walking is what’s left standing.'],
      ],
    },
    {
      id: 'roddon_way_bank', type: 'inspect', x: 8.5, y: 3.5, label: 'Exposed bank',
      pages: [
        ['Where the ridge drops away toward the hollow, the cut edge is bare.',
         'A band of grey-brown silt sits cleanly over black peat beneath it — two different grounds, stacked.'],
        ['The silt band doesn’t waver. It holds the same width the whole visible length of the bank.',
         'Whatever laid it down did the same work, the same way, for a long time.'],
      ],
    },
    {
      id: 'roddon_way_channel_curve', type: 'inspect', x: 3.5, y: 2.5, label: 'Old channel bend',
      pages: [
        ['The ridge bends here — not at an angle, but in a long, easy curve, the way water turns rather than the way a road does.',
         'Nothing was built to make it do that. It simply never straightened out.'],
        ['Following the curve with your eye, it’s not hard to see the creek that used to fill it.'],
      ],
    },
    {
      id: 'roddon_way_survey_post', type: 'inspect', x: 3.5, y: 1.5, label: 'Leaning post',
      pages: [
        ['A wooden marker post, driven in at the ridge’s high point. It leans hard, though nothing looks to have pushed it.',
         'A District Drainage stamp is still legible near the base, and a scored line above it, roughly waist height.'],
        ['The line likely marked the ground level once.',
         'The ground it marked is a long way below it now — not from this year’s dry spell. Settling like this takes decades, not a season.'],
      ],
    },
    {
      id: 'roddon_way_eel_stakes', type: 'inspect', x: 6.5, y: 11.5, label: 'Old eel stakes',
      pages: [
        ['A row of split stakes stands along the bank, evenly spaced, backed with old cord.',
         'An eel run, set to funnel a catch along the bank — into water that no longer reaches them.'],
        ['The pool has drawn back a stake’s width, maybe two.',
         'Whoever set these expected the water to stay put.'],
      ],
    },
    {
      id: 'roddon_way_cracked_peat', type: 'inspect', x: 6.5, y: 8.5, label: 'Cracked peat',
      pages: [
        ['Below the ridge, the low ground is duller and softer underfoot — proper peat, not silt.',
         'It’s cracked into loose plates here, the pattern of ground that’s been wet longer than it’s been dry.'],
        ['Three rainless months will do that to the topmost inch.',
         'The ridge above it hasn’t changed at all.'],
      ],
    },
    {
      // The Fourteenth File — the drainage-fund ledger (implicating clue).
      id: 'ff_ledger', type: 'inspect', x: 13.5, y: 13.5, label: 'A works coffer', flag: 'ff_clue_ledger',
      condition: () => fourteenth_file_stage === 1,
      pages: [
        ['Half-sunk in the peat where the old crossing runs down to the reaches: a district works coffer, iron-banded, its lock long rusted through.',
         'The subsidence that bared the roddon bared this with it. It hasn’t been opened in a very long time.'],
        ['Inside, dry enough to have survived: a drainage-fund ledger — the improvement account for the fen works. Two hands keep it.',
         'One is a clerk’s, even and honest. The other signs off the totals in a broad, confident stroke: R. CALLIS, District Warden.'],
        ['The clerk’s columns and the Warden’s totals disagree, and they disagree the same way every season — gold drawn for stone and labour the works never received.',
         'Skimmed steadily, signed clean, for years. The account was closed the season the Warden’s great sluice was “completed.” The same season, by the dates, a fen constable was logged presumed lost.'],
      ],
      repeatPages: [
        ['The works coffer stands open in the peat. Callis’s totals still don’t add up to the clerk’s columns, and never will now.'],
      ],
    },
  ],

  // ── The Sunken Gallery — the observers' trail (Garrick & Dreyfuss) ────────
  // Investigative set-dressing across the 5×5 grid, one feature per room (the
  // two interactive beats — the maintenance recess and the trapped Pale
  // Drowned — live in interactSunkenGallery(), not here). Plainly described,
  // nothing explained: neither the drought's real cause nor who built the
  // Gallery. Same lore boundary as the Upper Reach and the Deep Works — do not
  // extend LORE.md for any of it. Coordinates match the tiles placed in maps.js.
  SUNKEN_GALLERY_R4C1: [
    {
      id: 'gallery_silt_patch', type: 'inspect', x: 8.5, y: 8.5, label: 'Disturbed silt', flag: 'gallery_clue_silt',
      pages: [
        ['The silt here is churned and torn — the shape of someone who went down hard, and did not go down by choice.',
         'It hasn’t re-settled. Days old at most. Everything else in this hall wears centuries of silt undisturbed; nothing living has walked here in longer than the district has kept books.'],
        ['One handprint, splayed and clawed — and from it a long drag, heels first, toward the drowned end of the hall. Toward the water.',
         'Not the track of a man walking deeper in. The track of a man hauled somewhere he dug in against, and lost.'],
        ['To either side of the drag, in the churned silt, are other marks. Wide. Clawed. Nothing a boot ever made.',
         'Whatever came up out of the flood for him left its own prints going back down.'],
      ],
    },
  ],
  SUNKEN_GALLERY_R3C0: [
    {
      id: 'gallery_satchel', type: 'inspect', x: 8.5, y: 8.5, facing: 'up', label: "Observer's satchel", flag: 'gallery_clue_satchel',
      pages: [
        ['A field satchel, wedged behind the column ahead — not dropped in the open but caught, as if it slipped off a shoulder in a hurry and snagged there.',
         'The strap is still buckled.'],
        ['Inside: a coil of measuring cord, a nub of chalk, a meal gone to grey pulp in its cloth.',
         'The notebook pocket is empty. Empty, not lost — the flap was unbuttoned and left that way.'],
        ['Tucked in the seam, a stamped brass tag: NORTH BASIN SURVEY — and a name struck into it below the seal. G. GARRICK.',
         'So one of the two men the office sent got at least this far. The satchel says so even if nothing else does.'],
      ],
    },
  ],
  SUNKEN_GALLERY_R4C2: [
    {
      id: 'gallery_survey_marks', type: 'inspect', x: 8.5, y: 7.5, label: 'Fresh survey marks', flag: 'gallery_clue_survey',
      pages: [
        ['Chalk and scratched dates climb these columns — a survey done fast, mark against falling water.',
         'One hand throughout, careful and even — Garrick’s, the same as the satchel’s tag. He measured as the level dropped.'],
        ['Read in order, the marks tell it plainly: a rapid fall, then a long pause where the water held for days —',
         'then a second drop, most of it in a single night. There’s a date underlined twice for that one.'],
        ['Water doesn’t leave in steps like that. Not from heat, not from a leak.',
         'It doesn’t tell you why. It only makes the how stranger the longer you look.'],
      ],
    },
  ],
  SUNKEN_GALLERY_R3C1: [
    {
      id: 'gallery_depth_gauge', type: 'inspect', x: 8.5, y: 8.5, label: 'Broken depth gauge', flag: 'gallery_clue_gauge',
      pages: [
        ['A water-depth gauge, wedged upright into a gap in the old stone — not fixed there, just jammed to stand while it was read. A field instrument, the kind one man carries in on his back.',
         'Garrick’s, by the same careful hand as the marks and the notebook. Nobody built this into the wall. Nobody built anything into this wall. He set it down where he could read it and moved on.'],
        ['The float is snapped clean off. The last mark it held sits far down the scale —',
         'below the lowest line the maker thought worth printing. Below any water this basin should have been able to lose.'],
        ['He came down here to measure a drought and found something a gauge has no numbers for.',
         'He wrote as much, in the book. He did not get the chance to write the rest of it.'],
      ],
    },
  ],
  SUNKEN_GALLERY_R2C1: [
    {
      id: 'gallery_relief_panels', type: 'inspect', x: 8.5, y: 8.5, label: 'Ruined reliefs', flag: 'gallery_clue_reliefs',
      pages: [
        ['A run of carved relief panels, most of it eaten to blur by long immersion.',
         'What survives shows figures moving through a hall like this one — upright, unhurried, on dry footing.'],
        ['Around them the carver cut open ground and low horizon. No water over any of it.',
         'Either the basin stood dry when this was made, or it was made before there was a reservoir to fill it.'],
        ['The figures give you nothing else. No faces left, no marks you can read, no name.',
         'Only this: the hall was not built to be underwater. It was underwater later.'],
      ],
    },
  ],
  SUNKEN_GALLERY_R1C3: [
    {
      id: 'gallery_second_visitor', type: 'inspect', x: 8.5, y: 8.5, label: 'A trail from the water', flag: 'gallery_clue_visitor',
      pages: [
        ['A trail crosses the silt here, apart from the rest — and no boot made it.',
         'A broad wet drag, and to either side deep gouges, the marks of something that hauls itself along by the fingers. It comes up out of the flooded end, crosses, and goes back into the water.'],
        ['It didn’t walk. It dragged — the way the pale things in the deep water drag when they come up hunting, and lie still again after.',
         'The silt is torn where it turned. It was in no hurry either time. It had no reason to be. There is nothing else living down here, and nothing living has come down here in a very long time.'],
        ['You’ve seen what stands in this water. You don’t have to guess hard at what left this.',
         'It came up for the men the office sent, and it went back down heavier than it came.'],
      ],
    },
  ],
  SUNKEN_GALLERY_R0C2: [
    {
      id: 'gallery_notebook', type: 'inspect', x: 8.5, y: 7.5, facing: 'up', label: "Observer's notebook", flag: 'gallery_clue_notebook',
      pages: [
        ['The notebook — here, of all places. Not dropped in flight but wrapped in oilcloth and set on the ledge, deliberately, above the old waterline.',
         'The cover is inked in the same hand as the survey marks: G. GARRICK. He wanted it kept — took a steady minute to see it kept — which fits nothing else down here.'],
        ['The measurements run for pages, careful and ordinary, until the last complete entry:',
         '“The rate of loss cannot be accounted for by heat or by any ordinary drainage. I have stopped pretending otherwise.”'],
        ['The next page — the last one written — has been torn out. Cleanly, close to the spine, by his own careful hand: the stub matches the man who wrapped the book to keep it.',
         'He tore out his own last conclusion and took it with him. Whatever it said went wherever he did — and he is not on this ledge, nor anywhere in this hall you can reach.'],
      ],
    },
  ],
  SUNKEN_GALLERY_R0C4: [
    {
      id: 'gallery_submerged_stair', type: 'inspect', x: 7.5, y: 9.5, facing: 'up', label: 'Submerged staircase', flag: 'gallery_clue_stair',
      pages: [
        ['The floor gives way to standing black water, and through it — worked steps.',
         'A staircase, wide and deliberate, descending straight down past where the light quits.'],
        ['You crouch at the edge. The water is dead still and colder than the air.',
         'The steps go well below anything you could reach without the level falling much further, or a way you don’t have yet.'],
        ['Wherever this hall truly goes, it goes down there.',
         'Not today. You mark the spot and leave it for the water to give up on its own.'],
      ],
    },
  ],
  // The body of the second observer, Dreyfuss, washed up on a silt bar in a
  // flooded hall. `flag: gallery_body_found` feeds the Supervisor's report
  // (reportBasinFindings) but is NOT one of the eight reward-tier clues.
  SUNKEN_GALLERY_R1C4: [
    {
      id: 'gallery_dreyfuss_body', type: 'inspect', x: 7.5, y: 7.5, label: 'A body in the silt', flag: 'gallery_body_found',
      pages: [
        ['A shape on the silt bar that your eye keeps refusing, until it won’t any longer.',
         'A man. Face down where the shallows meet a silt bank, one arm folded under him, the other flung out and clawed deep into the silt.'],
        ['District greatcoat, sodden black, and raked open across the back. A surveyor’s satchel-strap, empty, torn through. The cold water has kept him better than the months should have.',
         'You turn back the collar. A laundry-tag, a name inked by someone who once did his washing at home: DREYFUSS.'],
        ['The silt around him is churned wide and dragged, and printed on both sides with something clawed that no boot ever made.',
         'He didn’t lie down here. He was pulled down, and held under, and the water did the rest. One of them answered, and answered the worst way there is.'],
        ['You cannot carry him out, not through what’s between here and the stair. You note the place, and how he lies, and you say the one useful thing there is to say to a man in the dark.',
         'Then you leave him to the cold that kept him, and go on.'],
      ],
    },
  ],
  // ── Ancient-society flavour: this people were violent and religious ─────────
  // Two finds about the builders themselves, exempt from the "nobody modern has
  // been here" framing (they are supposed to be centuries dead). No flags — pure
  // re-readable environmental flavour, not part of the observer report.
  SUNKEN_GALLERY_R3C3: [
    {
      id: 'gallery_altar', type: 'inspect', x: 7.5, y: 8.5, label: 'Bloodstone altar',
      pages: [
        ['A low block of black stone stands clear of the walls, its top dished and worn glass-smooth — not by water, by hands, and by whatever was laid on it, again and again.',
         'Shallow channels are cut from the hollow to the floor, angled with care to carry something away. They run to a drain the silt has never quite filled.'],
        ['The grain under the channels is stained a deeper black than the stone around it, soaked in the way water does not soak.',
         'Whatever these people were, they killed here — not once, and not in a rage. Carefully. With a place built for it, and a groove cut to keep the floor clean after.'],
        ['Around the base runs the same worshipful carving as the rest of the hall: bowed heads, upraised hands, an offering made and taken.',
         'The offering was the thing on the stone. To them, killing and worship were one word, and this was where they said it.'],
      ],
    },
  ],
  SUNKEN_GALLERY_R1C1: [
    {
      id: 'gallery_idol', type: 'inspect', x: 7.5, y: 5.5, facing: 'up', label: 'Drowned idol',
      pages: [
        ['Set in a niche in the wall, an idol — squat, broad, faceless now, its features worn to blur under long water. A figure seated, arms open, palms turned up to take what was brought.',
         'Small stone cups are ranked on the ledge before it, tipped and silted, whatever they held long since dissolved.'],
        ['It is water these people worshipped. Everything in the hall bends toward it — the channels, the stair going down, the open hands of this thing in its niche.',
         'They did not pray to be spared the flood. They prayed to the flood. They fed it, and begged it to rise for them and fall on their enemies.'],
        ['Someone, at the very end, took a hammer to its face. Once, hard, and no more — as if there was no time for a second blow.',
         'Fury or apology, the water has had the centuries to wear the difference away.'],
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
// Thin wrapper: whatever branch supervisorDialogueBody() picks, the player's
// FIRST conversation with him each day opens with a good-morning page
// (supervisor_greet_day tracks the last day he greeted). Prepending after the
// body runs is safe: dialogue.callbacks fire when the LAST page closes, so an
// extra page up front never disturbs a branch's callback.
function interactSupervisor() {
  supervisorDialogueBody();
  // One-time light admonishment: if the player crossed the bridge north of
  // Drenwick before the reservoir assignment existed (recorded in
  // exitBridgeNorth(), world-transitions.js), the supervisor notes it the next
  // time they report in. Prepended like the greeting below, and the scolded
  // flag is set synchronously HERE rather than through dialogue.callbacks —
  // callbacks fire only on the LAST page and would collide with a branch's own
  // callback (e.g. the MQ4 assignment). Gated on !reservoir_quest_started so it
  // never fires once the basin actually IS the assignment; if the crossing and
  // the assignment land in the same conversation, the scold reads first (this
  // check runs before the assignment callback flips the flag), which is fine.
  if (north_bridge_crossed_early && !north_bridge_scolded && !reservoir_quest_started) {
    north_bridge_scolded = true;
    syncQuestFlagsToWindow();
    dialogue.pages = [
      ['He sets the pen down before you’ve finished crossing the room.',
       '“You went over the bridge north of Drenwick. Past the canal, onto the basin road.”',
       '“What took you up there?”'],
      ['He doesn’t wait for the answer, which tells you he has already decided it wasn’t a good one.',
       '“There is no posting north of the canal. Nothing this office has asked you to look at.”',
       '“The toll buys you across a bridge. It does not hand you a reason to be on the far side of it.”'],
      ['“I won’t write it up. Consider that the whole of my generosity on the subject.”',
       '“When the north is yours to walk, you will hear it from me. Not from your own boots.”'],
      ...dialogue.pages,
    ];
  }
  // One-time backstory: once the reservoir assignment exists, the supervisor
  // (economical with words and alarm) explains, once, where his caution comes
  // from — a flood evacuation he coordinated as a young works clerk — and that
  // signing an order into danger never makes it weigh less. Prepended and its
  // flag set synchronously (like the north-bridge scold) so it can't collide
  // with any branch's dialogue callback. Fires the visit AFTER the assignment
  // (reservoir_quest_started is set by that branch's own close callback).
  if (reservoir_quest_started && !supervisor_said_flood) {
    supervisor_said_flood = true;
    syncQuestFlagsToWindow();
    dialogue.pages = [
      ['He doesn’t hand the basin file straight over.',
       '“Before this desk I was a field officer. Before that I wrote flood summaries for a works office, twenty years old, no business being listened to.”'],
      ['“One spring I read four reports that disagreed about which embankment would fail first. I picked one and sent the villages the other way.”',
       '“I was right. That is the whole of the story people tell. They leave out that I could have been wrong, and that I’d have signed the same order either way.”'],
      ['He turns the file around for you to take.',
       '“I send you north because it’s your work, not because it’s safe. Signing the paper doesn’t make it lighter. Go carefully.”'],
      ...dialogue.pages,
    ];
  }
  if (supervisor_greet_day !== day) {
    supervisor_greet_day = day;
    syncQuestFlagsToWindow();
    dialogue.pages = [
      ['“Good morning, Investigator.”',
       'He says it to the ledger first, then looks up.'],
      ...dialogue.pages,
    ];
  }
}

function supervisorDialogueBody() {
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
      grantItem('Letter from Netto');
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
      grantItem('Dispatch Letter');
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
      // Escalation beat \u2014 the sluice and the dispatch were routine; this one
      // is the step up in danger, and he says so plainly.
      ['\u201cThe sluice was maintenance. The letter was an errand.\u201d',
       '\u201cNow something more serious.\u201d'],
      ['\u201cInvestigator ' + stats.name + '.', 'There\u2019s a post on the fen road I can\u2019t account for.'],
      ['South of Drenwick. Off the main approach.', 'No station number in the ledgers. No patrol roster on record.\u201d'],
      ['\u201cGo and have a look.', 'Don\u2019t announce yourself ahead of time.'],
      ['\u201cIf it turns out to be a clerical error, fine.', 'If it doesn\u2019t\u2014 report what you find.\u201d'],
      ['\u201cAnd go carefully.',
       'A post that isn\u2019t in the ledgers is a post somebody built not to be seen.\u201d'],
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
            fort_report_filed = true;
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
  } else if (fort_quest_stage === 6 && MainQuest < 3) {
    // Reported/denied but the pay ticket hasn't been processed by Petra yet
    // (MainQuest only reaches 3 in her fort-ticket callback).
    dialogue.pages = [
      ['\u201cThe fen post is logged.',
       'District\u2019s handling it from here.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (fort_quest_stage === 6 && mq4_available_day === 0) {
    // MainQuest 3 closed out \u2014 the supervisor shuts the Polwick/Essa file
    // (wording varies by what he was actually TOLD, not by what happened:
    // fort_report_filed distinguishes an honest report from "found nothing")
    // and stands the player down for the rest of the week. The next main
    // assignment unlocks on the first workday after the next Dayoff; the
    // office is closed on Dayoff itself, so day % 5 is 1..4 here and the
    // formula in the callback lands exactly on next-Dayoff + 1.
    const closeOut = (smugglers_dead && fort_report_filed)
      ? [
          ['\u201cThe fen post file went up to district and came back stamped.\u201d',
           '\u201cClosed. Confirmed. Three names, struck through.\u201d'],
          ['\u201cIt reads very tidy on paper.\u201d',
           'He looks at you for a moment.',
           '\u201cPaper is like that.\u201d'],
        ]
      : fort_report_filed
        ? [
            ['\u201cThe fen post file went up to district.\u201d',
             '\u201cPolwick went with it.',
             'The inquiry is Drenwick\u2019s arithmetic now, not ours.\u201d'],
            ['\u201cYou did the job as written.',
             'Whatever the district writes next is not yours to carry.\u201d'],
          ]
        : [
            ['\u201cThe fen post is marked resolved. Clerical error.\u201d',
             'He taps the ledger once.',
             '\u201cThe tidiest kind of file. Nothing in it.\u201d'],
            ['\u201cI\u2019ve stopped being surprised by what the fens don\u2019t contain.\u201d'],
          ];
    dialogue.pages = closeOut.concat([
      ['\u201cYou have done enough for one week.',
       'More than enough, depending who writes the summary.\u201d',
       '\u201cTake the rest of it off.\u201d'],
      ['\u201cThe office will still be here after Dayoff.',
       'So will I. Go.\u201d'],
    ]);
    dialogue.callbacks = [function() {
      mq4_available_day = day + (5 - day % 5) + 1;
      syncQuestFlagsToWindow();
    }];
  } else if (fort_quest_stage === 6 && day < mq4_available_day && !reservoir_quest_started) {
    // Still on ordered rest \u2014 no assignment until after the next Dayoff.
    dialogue.pages = [
      ['\u201cYou\u2019re off the roster until after Dayoff.\u201d',
       '\u201cIf you\u2019re here out of habit, that\u2019s a condition.',
       'I\u2019d have it looked at.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (fort_quest_stage === 6 && !reservoir_quest_started) {
    // First workday after the rest week \u2014 the MainQuest-4 assignment.
    // One main-story path in all cases; only the "why not Drenwick" beat
    // varies with the Polwick/Essa outcome as the supervisor knows it.
    const drenwickLine = (smugglers_dead && fort_report_filed)
      ? ['\u201cOrdinarily I would send this to Drenwick.\u201d',
         '\u201cDrenwick also had Polwick, until the matter became rather final.\u201d']
      : fort_report_filed
        ? ['\u201cDrenwick has investigators.\u201d',
           '\u201cDrenwick also has Polwick sitting in the middle of its paperwork like a knife in a ledger.\u201d']
        : ['\u201cOrdinarily I would send this to Drenwick.\u201d',
           '\u201cOrdinarily Drenwick would send back something I trusted.\u201d'];
    dialogue.pages = [
      ['\u201cInvestigator ' + stats.name + '. Rested, or near enough.\u201d',
       '\u201cSomething\u2019s come in.\u201d'],
      ['\u201cThe reservoir bed north of Drenwick has given up something it was not supposed to have.\u201d',
       '\u201cSurveyors found it after the waterline dropped again.\u201d'],
      ['\u201cThe basin has been declining for years, pulling back further every season.',
       'Three rainless months have turned that decline into a drought.',
       'Ground nobody has stood on in living memory is open sky now.\u201d',
       '\u201cOld stonework. Old waterlines. Things the district maps do not have,',
       'because when the maps were drawn, all of it was underwater.\u201d'],
      drenwickLine,
      ['\u201cSo it comes to this office. Which means it comes to you.\u201d',
       '\u201cNorth of Drenwick, past the basin flats.',
       'Go and look at what the water left behind.\u201d'],
      ['\u201cOne more thing, and I will say it plainly.\u201d',
       '\u201cTwo basin observers went out ahead of you to inspect the exposed stonework \u2014 Garrick and Dreyfuss, the pair the Drenwick office keeps on its books.',
       'Garrick\u2019s reports came back a while, then stopped. Dreyfuss sent nothing at all. Neither of them came back.\u201d'],
      ['\u201cI won\u2019t dress this up as routine. It isn\u2019t the sluice, and it isn\u2019t a ledger error.\u201d',
       '\u201cIf you find yourself uneasy walking out there \u2014 good.',
       'Uneasy is the correct reading of the file.\u201d'],
      ['\u201cGo in daylight. Note what you see. Don\u2019t stay out there to be thorough.\u201d',
       '\u201cAnd come back. That instruction is part of the assignment.\u201d'],
    ];
    dialogue.callbacks = [function() {
      reservoir_quest_started = true;
      syncQuestFlagsToWindow();
    }];
  } else if (fort_quest_stage === 6 && reservoir_quest_started && reservoir_report_filed) {
    // The findings have been reported and logged \u2014 closing acknowledgment, with
    // a lasting line on the two observers' standing outcome.
    dialogue.pages = [
      ['\u201cThe basin report is logged. District has it now.\u201d',
       '\u201cWhat becomes of it is above this office, and for once I am glad of that.\u201d'],
      window.gallery_body_found
        ? ['\u201cDreyfuss\u2019s file I can close, in the way you close a file with a body under it. Garrick\u2019s I cannot.\u201d',
           '\u201cOne found, one still a question. If you go back down and the basin has given up more of him, you tell me first.\u201d']
        : ['\u201cGarrick and Dreyfuss stay open on the ledger. Two lines with no last entry.\u201d',
           '\u201cThe basin has not finished answering. It rarely has.\u201d'],
      ['\u201cYou went down there, and you came back up. Note the order.\u201d',
       'He almost smiles. He doesn\u2019t quite.'],
    ];
    dialogue.callbacks = null;
  } else if (fort_quest_stage === 6 && reservoir_quest_started && !window.sunken_gallery_seen) {
    // Assigned, but the player hasn't descended into the gallery yet.
    dialogue.pages = [
      ['\u201cThe reservoir bed. North of Drenwick.\u201d',
       '\u201cThe surveyors won\u2019t go back out until somebody tells them what\u2019s there.',
       'Somebody is you.\u201d'],
      ['\u201cDaylight. Notes.',
       'And back \u2014 the last part is still part of the job.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (fort_quest_stage === 6 && reservoir_quest_started) {
    // Been down into the gallery and returned \u2014 offer to make the report.
    dialogue.pages = [
      ['\u201cInvestigator.\u201d',
       'He closes the ledger.'],
      ['\u201cYou went down into the reservoir bed. Into whatever the water uncovered.\u201d',
       '\u201cTell me what you found.\u201d'],
    ];
    dialogue.callbacks = [function () {
      choice.title   = 'Supervisor';
      choice.options = ['Report what I found', 'Not finished down there'];
      choice.cursor  = 0;
      choice.callbacks = [reportBasinFindings, function notYet() {}];
      choice.open = true;
    }];
  } else {
    dialogue.pages = [
      ['\u201cThat post south of Drenwick.', 'Have you looked into it yet?\u201d'],
    ];
    dialogue.callbacks = null;
  }
}

// The Sunken Gallery report. Assembled from the observer-clue investigation
// flags (gallery_clue_*, set by the MAP_FEATURES `flag` field) plus the two
// interactive-beat flags, so the supervisor's reply reflects exactly which
// clues the player actually investigated. Called from the "Report what I found"
// choice in supervisorDialogueBody once the player has descended and returned.
// Sets reservoir_report_filed so the report is one-time; no reward/quest-stage
// side effects (this closes the observer thread narratively, not the main quest).
function reportBasinFindings() {
  const f = (k) => !!window[k];
  const satchel  = f('gallery_clue_satchel');
  const notebook = f('gallery_clue_notebook');
  const visitor  = f('gallery_clue_visitor');
  const survey   = f('gallery_clue_survey');
  const silt     = f('gallery_clue_silt');
  const gauge    = f('gallery_clue_gauge');
  const reliefs  = f('gallery_clue_reliefs');
  const stair    = f('gallery_clue_stair');
  const body     = f('gallery_body_found'); // Dreyfuss's body \u2014 not a reward-tier clue, but the supervisor reacts to it
  const clueCount = [satchel, notebook, visitor, survey, silt, gauge, reliefs, stair].filter(Boolean).length;

  const pages = [];
  pages.push(['He listens without writing anything down.',
              'With him that is not inattention. It is the opposite.']);

  // 1. The two observers \u2014 Dreyfuss (the body) and Garrick (the notebook/kit
  //    trail) \u2014 what the supervisor cares about first.
  if (body) {
    pages.push(['You tell him about Dreyfuss first. You do not soften it and he does not ask you to.',
                '\u201cPulled under and held. His coat raked open, the silt round him clawed wide.\u201d He lets it sit. \u201cThen that is one of the two found, and found the worst way there is.\u201d']);
  } else {
    pages.push(['\u201cNeither man did you find laid to rest, then. Not Garrick, not Dreyfuss.\u201d',
                'He does not make it an accusation. \u201cTwo went north and the basin kept both. Note only that I asked after them.\u201d']);
  }
  if (notebook) {
    pages.push(['You set Garrick\u2019s notebook on the desk. He does not pick it up at once.',
                '\u201cSo Garrick kept writing. Right to the end of it.\u201d']);
    pages.push(['He reads the last full entry twice \u2014 the water loss that heat and drainage do not account for \u2014 then the torn edge after it.',
                '\u201cThe conclusion is here. The reason he reached it is on the page he tore out and carried off \u2014 and he is past giving it back.\u201d']);
    pages.push(['\u201cHe was a careful man. Careful men do not tear out their own last page for nothing.\u201d',
                'He closes the book. \u201cThat part will not go in the summary. Not because it isn\u2019t true.\u201d']);
  } else if (satchel) {
    pages.push(['\u201cGarrick\u2019s kit, at least, and where it snagged going by.\u201d He nods, slowly.',
                '\u201cThen he reached it too. His notebook you did not find \u2014 so it is still down there, or it is not, and I dislike both.\u201d']);
  } else if (silt) {
    pages.push(['\u201cA place in the silt where a man went down, you say \u2014 and you could not tell me which of them.\u201d',
                '\u201cNo. Down there I don\u2019t suppose you could.\u201d']);
  } else if (!body) {
    pages.push(['\u201cAnd of either of them, nothing at all \u2014 no kit, no line, no body.\u201d',
                'He is quiet a moment. \u201cThen the stair is real, and both my observers are still a question.\u201d']);
  } else {
    pages.push(['\u201cOf Garrick, though \u2014 nothing. Not his kit, not a line he wrote.\u201d',
                '\u201cOne found, one a question. It is not the halves I would have chosen.\u201d']);
  }

  // 2. The water itself \u2014 the local strangeness, no global cause.
  if (survey || gauge) {
    const bits = [];
    if (survey) bits.push('water that fell in steps \u2014 fast, then held for days, then most of it gone in a single night');
    if (gauge)  bits.push('Garrick’s own field gauge, its last reading below the lowest mark it was built to carry');
    pages.push(['You describe ' + bits.join(', and ') + '.',
                '\u201cThat is not a drought behaving. That is a drought being made to.\u201d']);
    pages.push(['\u201cI will write \u2018cause undetermined,\u2019 because it is the honest phrase.',
                'On the file it will read as though we simply did not try.\u201d']);
  }

  // 3. The structure \u2014 old, built dry, and it keeps going down.
  if (reliefs || stair) {
    const bits = [];
    if (reliefs) bits.push('carvings of a dry hall, older than any map the district holds');
    if (stair)   bits.push('a worked stair running on down, well below the standing water');
    pages.push(['You tell him about ' + bits.join(', and ') + '.',
                '\u201cSo it was built. Deliberately. Before the water, or in spite of it.\u201d']);
    if (stair) {
      pages.push(['\u201cAnd it continues below the line you could reach.\u201d',
                  '\u201cWhen the water gives up more of it, this office will be interested again. Note that it will not be your choice when.\u201d']);
    }
  }

  // 4. What killed them \u2014 the thing in the water, not a person.
  if (visitor) {
    pages.push(['\u201cOne more thing,\u201d you say, and describe the trail \u2014 no boot, but a broad drag out of the flooded end and clawed gouges to either side, up out of the water and back down into it.',
                'The pen stops.']);
    pages.push(['\u201cYou are certain it was no man.\u201d',
                'You say you are. You have stood in that water and seen what stands in it with you. You are certain.']);
    pages.push(['He is quiet a moment. \u201cThen that is what took them. Not the cold, not a fall, not each other \u2014 a thing that lives down there and came up hunting.\u201d',
                '\u201cNobody has walked that hall in centuries but my two men. And something in the water saw to it they did not walk out.\u201d']);
  }

  // 5. Close and pay, weighted by how much the player actually turned up.
  // Four tiers, four different rewards, on the same clue-count thresholds the
  // closing assessment uses: nothing (0), thin (1-2), serviceable (3-5), and
  // thorough (6-8). The district pays field rate directly on a report this size;
  // the top tier also carries a piece of commendation gear off the hazard line.
  let rewardGold, rewardItem;
  if (clueCount >= 6) {
    rewardGold = 250; rewardItem = 'Swiftstone';
    pages.push(['He looks at you a moment longer than is comfortable.',
                '\u201cYou were thorough. I asked for that and still did not quite expect it.\u201d',
                '\u201cA good report. I only wish it frightened me less.\u201d']);
    pages.push(['\u201cTwo hundred and fifty gold \u2014 full field rate, and the hazard line on top of it.\u201d',
                'He sets a small polished stone beside the coin. \u201cAnd this. Commendation issue, not requisition. It answers to your name now.\u201d',
                'Swiftstone \u2014 added to items.']);
  } else if (clueCount >= 3) {
    rewardGold = 150; rewardItem = 'Elixir';
    pages.push(['\u201cA serviceable report,\u201d he says. \u201cThere is more down there than you brought me \u2014 there always is \u2014 but it holds together.\u201d']);
    pages.push(['\u201cOne hundred and fifty gold, standard field rate.\u201d',
                'He takes a stoppered flask from the office cabinet and sets it on the coin. \u201cAnd that. For next time. Out here there is usually a next time.\u201d',
                'Elixir \u2014 added to items.']);
  } else if (clueCount >= 1) {
    rewardGold = 75; rewardItem = null;
    pages.push(['\u201cThin,\u201d he says, not unkindly. \u201cYou did not linger. Given where you were standing, I will not fault you for it.\u201d']);
    pages.push(['\u201cSeventy-five gold. Field rate, no bonus.\u201d',
                'He counts it out without comment.']);
  } else {
    rewardGold = 20; rewardItem = null;
    pages.push(['\u201cYou went down, and came up with almost nothing.\u201d He sets the pen down.',
                '\u201cI would still rather have you back than the notes. But the notes would have helped.\u201d']);
    pages.push(['\u201cTwenty gold. For the walk.\u201d',
                'He does not pretend it is more than that.']);
  }
  pages.push(['\u201cIt is logged. District will do with it what district does.\u201d',
              '\u201cYou came back. On this assignment I am counting that as the objective met.\u201d']);

  dialogue.name = 'Supervisor';
  dialogue.pages = pages;
  dialogue.callbacks = [function () {
    reservoir_report_filed = true;
    stats.gold += rewardGold;
    if (rewardItem) grantItem(rewardItem);
    // Filing the basin report IS the completion of the reservoir arc — the
    // main-story step advances here (MainQuest 3 -> 4), the same way each
    // earlier arc closed on its reward callback (see the fen-post pay ticket).
    if (MainQuest < 4) MainQuest = 4;
    syncQuestFlagsToWindow();
    refreshJobBoard();
  }];
  dialogue.open = true;
  dialogue.page = 0;
}

// ─── The Fourteenth File report ───────────────────────────────────────────────
// Called from the "Report what I found" choice at the Supervisor's Dayoff inn
// table once the drought-exposed skiff (ff_clue_skiff) has been found. Reads the
// three window-native clue flags (set by the MAP_FEATURES `flag` field), builds
// the reconstruction, and — only when BOTH implicating clues were found (the
// drainage ledger and Callis's dedication) — hands the moral choice to the
// player: file the truth, or seal the dead Warden's part to spare his daughter.
// A partial investigation (skiff only, or skiff + one) corrects the file but
// resolves without the dilemma. Tiered field-rate pay either way.
function reportFourteenthFile() {
  const skiff  = !!window.ff_clue_skiff;
  const ledger = !!window.ff_clue_ledger;
  const ded    = !!window.ff_clue_dedication;
  const clueCount = [skiff, ledger, ded].filter(Boolean).length;
  const implicated = ledger && ded; // both threads → the cover-up is provable
  const rewardGold = clueCount >= 3 ? 150 : clueCount === 2 ? 90 : 50;

  if (!implicated) {
    // The patrolman, but not the why — no one to indict, so no dilemma.
    const pages = [
      ['He listens the way he listens — without writing, which with him is the opposite of not attending.'],
      ['You give him Marsh: the skiff in the dried shallows, the swollen tally-book, the torn-out last page.',
       '“So he’s found. Fourteen years, and the water hands him back inside a week.”'],
    ];
    if (ledger || ded) {
      pages.push(['You lay out the rest of it — ' + (ledger ? 'a works ledger that never balanced' : 'a warden’s dedication cut with a wrong date') + ' — and where the thread stops.',
                  '“A thread, then. Not a knot. It points somewhere and doesn’t arrive.”']);
    } else {
      pages.push(['“And why he went into the water — that’s the page he tore out and took with him.”',
                  '“The boat corrects the file. ‘Presumed lost’ becomes ‘lost on patrol, recovered.’ It doesn’t tell me who to be angry at.”']);
    }
    pages.push(['“I’ll amend it to what you can stand up: Marsh died on the water, on duty. His people can bury a fact instead of a maybe.”',
                '“The rest stays open. It usually does.”']);
    pages.push(['“' + rewardGold + ' gold, field rate. For giving a dead man his last page back, even torn.”']);
    dialogue.name = 'Supervisor';
    dialogue.pages = pages;
    dialogue.callbacks = [function () {
      fourteenth_file_stage   = 2;
      fourteenth_file_outcome = 0;
      stats.gold += rewardGold;
      syncQuestFlagsToWindow();
    }];
    dialogue.open = true;
    dialogue.page = 0;
    return;
  }

  // The full reconstruction, then the choice.
  dialogue.name = 'Supervisor';
  dialogue.pages = [
    ['He listens without writing. You lay it out in order.'],
    ['Marsh, in the shallows — the tally-book, a works barge logged where no barge was scheduled, a note to raise it with the Warden direct, the torn last page.',
     'The drainage fund, in the drained creek beds — a clerk’s honest columns, and Warden Callis’s totals that never matched them, gold drawn for stone the works never got.'],
    ['And Callis’s own dedication stone at the sluice: his great works “completed” the very season the fund closed short — the same season Marsh went into the water.',
     'The pen stays down. He is not surprised, and he does not pretend it fails to land.'],
    ['“So. Reeve Callis skimmed the fund for years, and when a fen constable followed the numbers to his door, the constable became ‘presumed lost.’”',
     '“And I signed that file closed, fourteen years ago, because I was new and it was tidy.”'],
    ['“Callis is dead. Died decorated. There’s a stone with his name cut deep, fresh reeds at the foot of it, and a daughter who lays them.”',
     '“She knows him as the man who kept the fen from drowning the road. That is the man I’d be taking from her.”'],
    ['He looks at you.',
     '“I asked for an accurate report and I meant it. But I won’t pretend I don’t understand what filing it does. So I’ll let you write the last line, and I’ll sign what you write.”'],
  ];
  dialogue.callbacks = [function () {
    choice.title   = 'The Fourteenth File';
    choice.options = ['File it accurately', 'Seal the Warden’s part'];
    choice.cursor  = 0;
    choice.callbacks = [
      function fileTrue() { finishFourteenthFile(1, rewardGold); },
      function sealIt()   { finishFourteenthFile(2, rewardGold); },
    ];
    choice.open = true;
  }];
  dialogue.open = true;
  dialogue.page = 0;
}

// Resolves the implicated-case choice: outcome 1 = filed accurately (truth on
// record, Callis named, the family will learn), outcome 2 = sealed (Marsh gets
// an honourable correction, Callis's part sealed-not-erased, his daughter keeps
// her father). Same field-rate pay + an Elixir either way — the pay is for the
// investigation, not the verdict.
function finishFourteenthFile(outcome, rewardGold) {
  const pages = outcome === 1
    ? [
        ['“Then it goes on the record true.” He writes now, finally, and it takes him a while.',
         '“Marsh’s death is a killing, reclassified. Callis’s name goes in the finding beside it.”'],
        ['“The daughter will hear it from the district, not from me — a small cowardice I’ll own.”',
         '“A true file costs someone who didn’t earn the cost. It’s still the one I asked you for. I won’t insult it by calling it easy.”'],
      ]
    : [
        ['“Then the Warden keeps his stone.” He writes it the quiet way.',
         '“Marsh: died on patrol, in the line, recovered with honour. True as far as it goes — and it goes far enough for a headstone.”'],
        ['“Callis’s part I seal under my own hand — not erased, sealed. If a day comes it must be opened, it can be. Today is not that day, and his daughter keeps her father.”',
         '“Some would call that a lie by tidy filing. I’ve signed worse for worse reasons. This one I can carry.”'],
      ];
  pages.push(['“' + rewardGold + ' gold, and this.” He sets a stoppered flask on the coin.',
              '“Field rate and the hazard line. You reopened fourteen years and closed them clean. That’s the work.”',
              'Elixir — added to items.']);
  pages.push(['“It’s logged. It’s mine now, not yours.”',
              'He picks up the drink he hasn’t been drinking, and for once he drinks it.']);
  dialogue.name = 'Supervisor';
  dialogue.pages = pages;
  dialogue.callbacks = [function () {
    fourteenth_file_stage   = 2;
    fourteenth_file_outcome = outcome;
    stats.gold += rewardGold;
    grantItem('Elixir');
    syncQuestFlagsToWindow();
  }];
  dialogue.open = true;
  dialogue.page = 0;
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

// ── Dungeon floor 1 — chests, Briar Warden, floor NPCs ───────────────────────
function interactDungeonFloor1() {
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
        grantItem(it.name);
        dialogue.name  = '';
        dialogue.pages = [['Chest opened.', `${it.name}  (${itemStatLabel(it)})  \u2014 added to items.`]];
      }
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
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
        grantItem(it.name);
        dialogue.name  = '';
        dialogue.pages = [['Chest opened.', `${it.name}  (${itemStatLabel(it)})  \u2014 added to items.`]];
      }
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
  }
  // (The Briar Warden used to den here; it now waits in the hidden meadow —
  // see interactWildsAndOutposts.)
  interactSimpleNPCs();
  return interactionUiOpened();
}

// ── MAP_N2 — sealed Drenwick north gate (prefix check, may not consume) ──────
function interactMapN2Gate() {
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
      return true;
    }
  }
  return interactionUiOpened();
}

// ── MAP4 — Thornmere standing stone (prefix check, may not consume) ──────────
function interactThornmereStone() {
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
      return true;
    }
  }
  return interactionUiOpened();
}

function interactSluiceInterior() {
  const sluiceChests = sluiceFloor === 1 ? [SLUICE_CHEST]
                     : sluiceFloor === 2 ? [SLUICE_LEVEL2_CHEST, SLUICE_SECRET_CHEST]
                     : sluiceFloor === 3 ? [SLUICE_LEVEL3_CHEST, SLUICE_DEEP_CHEST]
                     :                     []; // sluiceFloor 4 (Sealed Room) has no chests
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
          grantItem(it.name);
          dialogue.name  = '';
          dialogue.pages = [['Chest opened.', `${it.name}  (${itemStatLabel(it)})  \u2014 added to items.`]];
        }
        dialogue.open  = true;
        dialogue.page  = 0;
        return true;
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
      return true;
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
      return true;
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
      return true;
    }
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactMireVault() {
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
    return true;
  }
  // ── Mirethyst NPC ──────────────────────────────────────────────────────
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactTakomoChamber() {
  // ── Takomo encounter — check cultists first, then Takomo ─────────────────
  // interactSimpleNPCs handles Preth and Rena; priority goes to whichever is
  // closer. If a cultist dialogue fires, we return so Takomo isn't also triggered.
  if (interactSimpleNPCs()) return true;
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
  return interactionUiOpened();
}

function interactHamletInterior() {
  // ── Falls hamlet interior — NPCs in their three rooms ───────────────────
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactRuinsEntranceHall() {
  // ── South Ruins Entrance Hall — lore NPCs only, no chests/quests here ───
  interactSimpleNPCs();
  return interactionUiOpened();
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
            grantItem('River Smelt');
            dialogue.pages = [['Something on the line.', 'River Smelt. Small, cold, indignant.', 'Added to items.']];
          } else if (roll < 0.85) {
            grantItem('Canal Eel');
            dialogue.pages = [['Heavy on the line.', 'Canal Eel. Long, dark, unhappy about it.', 'Added to items.']];
          } else if (roll < 0.97) {
            grantItem('Old Boot');
            dialogue.pages = [['Heavy on the line.', 'You pull it up.', 'Old Boot. Added to items.']];
          } else {
            grantItem('Sealed Letter');
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

function interactDrenwickOffice() {
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
      return true;
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
        return true;
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
        return true;
      }
      dialogue.name  = veth.name;
      dialogue.pages = veth.dialogue;
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
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
      return true;
    }
  }
  // Records shelving (east wall, col 13 rows 6-10) — randomized rummage
  // flavor from the same pool as the Calwick office cabinets. Wider radius
  // (like the school wall display) since the unit spans several rows.
  const rsx = player.x - 13.5 * TILE;
  const rsy = player.y -  8.5 * TILE;
  if (Math.sqrt(rsx * rsx + rsy * rsy) < TALK_RADIUS * 1.5) {
    dialogue.name  = 'Records Shelf';
    dialogue.pages = randomCabinetPages();
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  // Holt and any other office NPCs caught by interactSimpleNPCs
  interactSimpleNPCs();
  return true;
}

function interactCalwickOffice() {
  if (currentTownId === 'calwick') {
    // Wall primer — a framed service manual on the north wall (row 1, cols 6-9)
    // explaining how an agent's stats work. (The continent map lives in the
    // school now, on the calwick_school_map wall fixture.)
    const wmx = player.x - CALWICK_OFFICE_WALL_MAP.x;
    const wmy = player.y - CALWICK_OFFICE_WALL_MAP.y;
    if (Math.sqrt(wmx * wmx + wmy * wmy) < TALK_RADIUS * 1.5) {
      dialogue.name  = 'Field Manual';
      dialogue.pages = [
        ['A framed service primer, the kind pinned up in every district office.',
         'HP is what keeps you standing. Reach zero in the field and you are carried home, lighter a purse.'],
        ['ATK is how hard you hit; DEF, how much you shrug off; SPD, who strikes first.',
         'A weapon raises ATK, armour raises DEF. Keep both equipped before leaving the civic district.'],
        ['Win fights and you earn experience. Enough of it and your Level rises on its own —',
         'more HP, sharper stats, no paperwork required.'],
        ['Rest at an inn, or in your own bed, to restore HP.',
         'An unequipped agent is a dead agent. — District Investigative Corps'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
    const sx = player.x - SUPERVISOR.x;
    const sy = player.y - SUPERVISOR.y;
    if (Math.sqrt(sx * sx + sy * sy) < TALK_RADIUS) {
      interactSupervisor();
      return true;
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
        return true;
      }
      dialogue.name = 'Filing Cabinet';
      dialogue.pages = cabinetCaseFlag
        ? [['The files have been disturbed.', 'Someone was looking for something.']]
        : randomCabinetPages();
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
    const ex = player.x - ESLA_CABINET.x;
    const ey = player.y - ESLA_CABINET.y;
    if (Math.sqrt(ex * ex + ey * ey) < TALK_RADIUS) {
      dialogue.name = 'Filing Cabinet';
      dialogue.pages = weight_note_signed && !cabinetCaseFlag
        ? [['Not this drawer.', 'Corvin\u2019s section is the other cabinet, past the window.']]
        : randomCabinetPages();
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
    const elx = player.x - ESLA.x;
    const ely = player.y - ESLA.y;
    if (Math.sqrt(elx * elx + ely * ely) < TALK_RADIUS) {
      const dayBeforeAccord = day % 5 === 4;
      dialogue.name = 'Esla';
      dialogue.callbacks = null;

      // ── One-shot event commentary ─────────────────────────────────────────
      // Esla reacts to fresh developments exactly ONCE each (esla_said_*
      // flags, set on dialogue close and persisted via save.js), shown
      // INSTEAD of her daily rotation so the reaction reads as "she has
      // something to say today." The old code appended these to every
      // conversation forever (and the sluice comment used MainQuest === 1,
      // so it vanished unseen if the player outpaced it). Priority: deaths
      // before gossip before work commentary.
      const polwickDead = fort_quest_stage >= 6 &&
        (smugglers_dead || (smugglers_execution_day > 0 && day >= smugglers_execution_day));
      const polwickPending = fort_quest_stage >= 6 && !smugglers_dead &&
        smugglers_execution_day > 0 && day < smugglers_execution_day;

      if (polwickDead && !esla_said_polwick_dead) {
        dialogue.pages = (smugglers_dead && smugglers_execution_day === 0)
          ? [
              ['“Polwick.”',
               'She doesn’t look up right away.',
               '“I only met him twice. Registry business, mostly.”',
               '“I keep saying that like it settles something. It doesn’t.”'],
              ['“There aren’t many of us posted this far out.',
               'You notice the other ones. You keep a kind of count, without ever deciding to.”',
               'She sets her pen down.',
               '“The count is smaller now. I keep arriving at that.”'],
              ['“I closed his registry file this morning. It’s a short form.',
               'Date of determination. Date of death. Nothing in between that the Empire wanted written down.”'],
              ['“I don’t know what he was doing with that post.',
               'I don’t think I want to.”',
               '“I keep thinking about the drought, and what people do when the ledger stops adding up.',
               'And then I stop thinking, and I’m just sad. That’s all that’s left of it. I’m sad.”'],
            ]
          : [
              ['“I heard the district closed the fen post matter.”',
               'She doesn’t look up right away.',
               '“Polwick. I only met him twice, registry business.”',
               '“Twice turns out to be enough to grieve. Nobody warns you about that.”'],
              ['“There aren’t many of us posted this far out.',
               'You notice the other ones, even the ones you don’t know well.”',
               '“I took his name off the three-year cycle list this morning.',
               'It was a short list. It’s shorter.”'],
              ['“Registered rareborn, same as me. Employed, same as me.”',
               'A pause.',
               '“I keep thinking about the drought, and what people do when the ledger stops adding up. It doesn’t excuse it.”'],
              ['“It just makes it less simple than the report will say.”',
               'She looks at her hands.',
               '“I filed that report. I read every line.',
               'There’s no line where you’re allowed to say you’re sorry.”'],
            ];
        dialogue.callbacks = [function() { esla_said_polwick_dead = true; syncQuestFlagsToWindow(); }];
      } else if (polwickPending && !esla_said_polwick_pending) {
        dialogue.pages = [
          ['“I heard about the fen post.”',
           'She doesn’t look up right away.',
           '“Polwick. I only met him twice, registry business.”'],
          ['“There aren’t many of us posted this far out.',
           'You notice the other ones, even the ones you don’t know well.”'],
          ['“I don’t know yet what the district will do with him.”',
           'A pause.',
           '“I try not to guess. It doesn’t usually help.”'],
        ];
        dialogue.callbacks = [function() { esla_said_polwick_pending = true; syncQuestFlagsToWindow(); }];
      } else if (reservoir_quest_started && !esla_said_basin) {
        // The basin assignment routes an ecological problem across a Bloommarked
        // officer's desk. She reads a drying landscape more easily than people,
        // and — guardedly — the fen is why she asked to be sent somewhere quiet.
        dialogue.pages = [
          ['“They routed the basin file through me before it reached you.',
           'Water tables, silt cores, a die-off count off the exposed bed.”',
           '“I read a drying landscape more easily than I read most people. That isn’t a boast. It’s nearly a complaint.”'],
          ['“When the Academy asked where I wanted posting, I said somewhere quiet.',
           'They heard modest. I meant it as a request.”',
           '“The fen answered in fungi and beetles and reed-rot, none of which have ever lied to me. Whatever’s wrong up there, it is telling the truth about it. Go and read it back.”'],
        ];
        dialogue.callbacks = [function() { esla_said_basin = true; syncQuestFlagsToWindow(); }];
      } else if (cabinetCaseFlag && !esla_said_cabinet) {
        dialogue.pages = [
          ['“Someone’s been in Aldric’s cabinet.”',
           'She doesn’t look up from her own drawer.',
           '“He hasn’t noticed yet. Or he has, and he’s decided not to say.”'],
          ['“I’m not asking.”',
           '“I notice more than I say. This is one of those times.”'],
        ];
        dialogue.callbacks = [function() { esla_said_cabinet = true; syncQuestFlagsToWindow(); }];
      } else if (MainQuest >= 2 && !esla_said_dispatch) {
        dialogue.pages = [
          ['“Drenwick processed your dispatch the same day. Harrow’s office.”',
           '“I’ve seen that happen twice in six years. Both times it was a filing error.”'],
          ['“I’ve logged yours as intentional. That took a separate form.”',
           '“Don’t let it go to your head. The form was going spare.”'],
        ];
        dialogue.callbacks = [function() {
          esla_said_dispatch = true;
          esla_said_sluice   = true;  // superseded — no stale sluice follow-up next visit
          syncQuestFlagsToWindow();
        }];
      } else if (MainQuest >= 1 && !esla_said_sluice) {
        dialogue.pages = [
          ['“The sluice assignment crossed my desk before it reached you.',
           'I filed it under routine.”'],
          ['“You came back dry, on schedule, with legible paperwork.”',
           '“I’ve re-filed it under routine, underlined.',
           'That is as impressed as this office gets. Spend it wisely.”'],
        ];
        dialogue.callbacks = [function() { esla_said_sluice = true; syncQuestFlagsToWindow(); }];
      } else if (dayBeforeAccord) {
        dialogue.pages = [
          ['“Today’s the day,” she says quietly.'],
          ['“Ask for that promotion', 'before you leave tonight.'],
          ['“They’re always most receptive', 'on the eve of Accord Day.”'],
        ];
      } else {
        // ── Daily rotation (day % 10) ────────────────────────────────────────
        // Helpful, dry, and hard to impress. Practical hints (rest, the job
        // board, road danger, potions, Dayoff) mixed with the quiet absurdity
        // of registry work. Kept consistent with her canon: Bloommarked
        // (green thread — the clover), registered at birth, Alecton prep
        // school then the Academy, placed here six years ago, inn on Dayoff.
        const eslaVariants = [
          // 0 — helpful: sleep before travel
          [
            ['“You have the look of someone planning to walk somewhere far on no sleep.”',
             '“Don’t. Sleep first. Your bed restores you completely, and the roads will still be there.”'],
            ['“I can’t believe that’s a thing I have to tell a licensed investigator.”',
             'She stamps a form with unnecessary force.'],
          ],
          // 1 — silly: the forms
          [
            ['“Today I processed forty-one forms.',
             'Nine were requests for other forms.”',
             '“One was a request for the form you use to request forms.”'],
            ['“The system works.”',
             'She says it the way people say things that aren’t true.'],
          ],
          // 2 — helpful: job board + Petra
          [
            ['“If you’re between assignments, the notice board on the square posts contract work.”',
             '“Pay tickets go through Petra. Not me.”'],
            ['“People keep bringing me their tickets anyway, because my desk is nearer the door.”',
             '“I’ve started scoring their innocent expressions. Best this week was a seven.”'],
          ],
          // 3 — silly: the clover (Bloommarked, deflected)
          [
            ['There’s a small pot of clover on her desk. It is doing suspiciously well.',
             '“Don’t compliment the clover. It gets smug.”'],
            ['“And before you ask — that’s not a thread thing. That’s a clover thing.”',
             'The clover leans toward you slightly.'],
          ],
          // 4 — helpful, darkly: stay on the road
          [
            ['“Going east, stay on the road. The ruins south of it are not a shortcut.”',
             '“I file the incident reports of people who thought otherwise.”'],
            ['“The paperwork outlives them.',
             'I find that motivating.”'],
          ],
          // 5 — unimpressed: exciting registry work
          [
            ['“Someone asked me today whether registry work is exciting.”',
             '“This week I renumbered six hundred pages because a Drenwick clerk invented his own alphabet.”'],
            ['“So yes.”', '“Constantly.”'],
          ],
          // 6 — helpful: potions, with a statistic
          [
            ['“Buy more potions than you think you need. The traveller stocks them.”',
             '“Every incident report I file contains the phrase ‘had one potion.’',
             'Every single one.”'],
            ['“Be a statistical outlier.',
             'It’s an attractive quality in an investigator.”'],
          ],
          // 7 — helpful/silly: Dayoff (and where to find her)
          [
            ['“Every fifth day is Dayoff. The office shuts, and I go to the inn',
             'to watch Tomas defend his soup from public opinion.”'],
            ['“It’s the best entertainment in Calwick.”',
             '“Which tells you a great deal about Calwick.”'],
          ],
          // 8 — knowing, deflating: your file
          [
            ['“You don’t need to introduce yourself. I know your file.”',
             '“I know everyone’s file.”'],
            ['“Yours is not the thickest, before you look flattered.',
             'The thickest belongs to a man who reports his neighbour’s fence weekly.”',
             '“I have, however, read yours twice. Filing purposes.”'],
          ],
          // 9 — registry deadpan: the census cycle
          [
            ['“Census update cycle this year. Registered folk get different questions.”',
             '“This one asks whether my abilities have ‘materially changed.’”'],
            ['“The clover flowered early, and I have developed opinions about the drainage ditch.',
             'I left it blank. The Empire can subpoena the clover.”'],
          ],
        ];
        // Index by WORKDAY, not by raw day % 10: days where day % 5 is 0
        // (Dayoff, office closed) or 4 (Accord-eve override above) never
        // reach this branch, so a plain day-mod rotation would leave four
        // variants permanently unreachable. Each 5-day week contributes its
        // three plain office days (day % 5 = 1..3), walking the whole list
        // in ~3⅓ weeks with no repeats inside a cycle.
        const weekSlot = (day % 5 >= 1 && day % 5 <= 3) ? (day % 5) - 1 : 0;
        dialogue.pages = eslaVariants[(Math.floor(day / 5) * 3 + weekSlot) % 10];
      }
      // First conversation of the day: she greets before whatever the
      // branches above chose. Spread, don't unshift — eslaVariants pages
      // are shared array literals and must not be mutated.
      if (esla_greet_day !== day) {
        esla_greet_day = day;
        syncQuestFlagsToWindow();
        dialogue.pages = [
          ['“Good morning, ' + stats.name + '.”',
           'She says it without looking up, before you’re fully through the door.'],
          ...dialogue.pages,
        ];
      }
      dialogue.open = true;
      dialogue.page = 0;
      return true;
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
        return true;
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
        return true;
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
        return true;
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
          ['\u201cRequisition slip for our Junior Investigator.\u201d', 'He glances at it, then at you.', '\u201cRisky assignment?\u201d'],
          ['He doesn\u2019t wait for an answer.', 'Pulls a bundle from under the counter.', '\u201cSword, armor. Standard issue. Sign here.\u201d'],
          ['\u201cOpen the menu with Esc or M, go to Items, and choose Equip.\u201d',
           'He\u2019s already looking back down at his ledger.'],
        ];
        dialogue.callbacks = [function() {
          equipment_ticket_ready = false;
          grantItem('Iron Sword');
          grantItem('Leather Armor');
          syncQuestFlagsToWindow();
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
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
        return true;
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
          return true;
        }
      }
    }
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactDrenwickInn() {
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
    return true;
  }
  interactSimpleNPCs();
  return true;
  return interactionUiOpened();
}

function interactCalwickInn() {
  // Innkeeper
  const ix = player.x - INNKEEPER.x;
  const iy = player.y - INNKEEPER.y;
  if (Math.sqrt(ix * ix + iy * iy) < TALK_RADIUS) {
    dialogue.name  = 'Innkeeper';
    dialogue.pages = [
      ['\u201c' + stats.name + '! A room? For you, of course.\u201d',
       '\u201cThough you\u2019ve a perfectly good house on the west side, and we both know it.\u201d'],
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
    return true;
  }
  if (currentTownId === 'calwick' && isDayOff()) {
    // Supervisor at dayoff position. During the ordered rest week after the
    // fen post case (mq4_available_day set, reservoir assignment not yet
    // given), he reacts to how the Polwick matter ended \u2014 but only to what
    // he was actually TOLD (fort_report_filed): a player who killed everyone
    // and claimed nothing gets his ordinary Dayoff lines.
    const sdx = player.x - SUPERVISOR_DAYOFF.x, sdy = player.y - SUPERVISOR_DAYOFF.y;
    if (Math.sqrt(sdx * sdx + sdy * sdy) < TALK_RADIUS) {
      dialogue.name  = 'Supervisor';
      // ── The Fourteenth File (side quest) ─────────────────────────────────
      // Assigned and reported here, at his off-the-clock Dayoff table. Offered
      // at a 1/3 chance each Dayoff once the player is an established
      // investigator and not during the fen-post rest week; the roll is stored
      // per Dayoff (fourteenth_file_offer_day/offered) so re-talking — or a
      // save/load — the same day is stable. See quests.js for the flags and
      // reportFourteenthFile() below for the report + moral choice.
      if (fourteenth_file_stage === 1) {
        if (window.ff_clue_skiff) {
          dialogue.pages = [
            ['He sees the look on you and closes the folder he keeps for this.',
             '“You’ve been out to the boat. Tell me what the water gave up.”'],
          ];
          dialogue.callbacks = [function () {
            choice.title   = 'The Fourteenth File';
            choice.options = ['Report what I found', 'Still working it'];
            choice.cursor  = 0;
            choice.callbacks = [reportFourteenthFile, function notYet() {}];
            choice.open = true;
          }];
        } else {
          dialogue.pages = [
            ['“The Marsh business.” He doesn’t look up from his untouched drink.',
             '“The skiff’s out in the Thornmere shallows — the dried mud where open water used to be. Start there. The rest follows the boat.”'],
            ['“This low water’s baring more than one thing. The old drainage works. The drained creek beds up past the fen.”',
             '“Bring me what’s actually there.”'],
          ];
          dialogue.callbacks = null;
        }
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
      if (fourteenth_file_stage === 0 && MainQuest >= 1 && !(mq4_available_day > 0 && !reservoir_quest_started)) {
        if (fourteenth_file_offer_day !== day) {
          fourteenth_file_offer_day = day;
          fourteenth_file_offered   = Math.random() < (1 / 3);
          syncQuestFlagsToWindow();
        }
        if (fourteenth_file_offered) {
          dialogue.pages = [
            ['He’s at his usual Dayoff table, but he isn’t drinking. A thin, water-stained folder sits closed under his hand.',
             '“Sit a moment. This is off the clock — you can say no, and it stays said.”'],
            ['“The drought’s handing things back. A boat came up out of the Thornmere shallows this week that’s been down fourteen years.”',
             '“It was a fen constable’s. Halden Marsh. His is the first file I inherited when I came to Calwick, and the only line in it reads ‘presumed lost.’ I signed it closed. I was new. I trusted the record.”'],
            ['“I never liked it and never had a reason I could write down. The water’s given me one.”',
             '“I want an accurate account of what happened to that man. That’s all. It may come to nothing.”',
             'The way he says “nothing” is not the way a man says it when he believes it.'],
          ];
          dialogue.callbacks = [function () {
            choice.title   = 'Supervisor';
            choice.options = ['Take the case', 'Not tonight'];
            choice.cursor  = 0;
            choice.callbacks = [
              function take() {
                fourteenth_file_stage = 1;
                syncQuestFlagsToWindow();
                dialogue.name  = 'Supervisor';
                dialogue.pages = [
                  ['He slides the folder across. It’s almost empty, which is the point.',
                   '“Start with the boat, in the shallows. Then wherever the boat sends you — the drainage works, the drained creek beds. The same low water is showing all of it.”'],
                  ['“Bring me what you actually find. Not what tidies the file.”',
                   '“I’m here every Dayoff. This one doesn’t touch your regular work — it’s mine, and now a little of it is yours.”'],
                ];
                dialogue.callbacks = null;
                dialogue.open  = true;
                dialogue.page  = 0;
              },
              function notNow() {
                dialogue.name  = 'Supervisor';
                dialogue.pages = [['“No shame in it.” He puts the folder back under his hand.',
                                   '“It’s waited fourteen years. It can wait for a Dayoff you’ve the stomach for.”']];
                dialogue.callbacks = null;
                dialogue.open  = true;
                dialogue.page  = 0;
              },
            ];
            choice.open = true;
          }];
          dialogue.open = true;
          dialogue.page = 0;
          return true;
        }
      }
      const restWeekDayoff = mq4_available_day > 0 && !reservoir_quest_started;
      if (restWeekDayoff && fort_report_filed && smugglers_dead) {
        dialogue.pages = [
          ['He\u2019s at his usual table.',
           'The drink in front of him is untouched.'],
          ['\u201cFourteen years, I told you once. You learn to leave it at the door.\u201d',
           '\u201cSome weeks the door doesn\u2019t hold.\u201d'],
          ['\u201cI sent you out to that post. That\u2019s the job, and I\u2019d send you again.\u201d',
           '\u201cBut I sign the file. So I buy the drink I\u2019m not drinking.',
           'That\u2019s the arrangement I\u2019ve come to.\u201d'],
          ['\u201cEnjoy your Dayoff, Investigator.',
           'That\u2019s an instruction.\u201d'],
        ];
      } else if (restWeekDayoff && fort_report_filed) {
        dialogue.pages = [
          ['\u201cThe district has Polwick now.\u201d',
           '\u201cPaper moves slower than a verdict. But it arrives.\u201d'],
          ['\u201cNothing about that matter is ours anymore.',
           'I keep telling the ledger that. The ledger is unconvinced.\u201d'],
          ['\u201cEnjoy your Dayoff. We\u2019re back at it after.\u201d'],
        ];
      } else {
        dialogue.pages = [
          ['\u201cFourteen years.\u201d'],
          ['\u201cYou learn to leave it at the door.\u201d', 'He takes a slow sip of his drink.'],
        ];
      }
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
    // Esla at dayoff position. Same rest-week override as the Supervisor
    // above — but Esla's condition keys on smugglers_dead itself, not on
    // what the player reported: she closes registry files, so she knows
    // Polwick died whether or not the report said "found nothing" (exactly
    // like her established office dialogue for the same event).
    const edx = player.x - ESLA_DAYOFF.x, edy = player.y - ESLA_DAYOFF.y;
    if (Math.sqrt(edx * edx + edy * edy) < TALK_RADIUS) {
      dialogue.name  = 'Esla';
      const eslaRestDayoff = mq4_available_day > 0 && !reservoir_quest_started;
      if (eslaRestDayoff && smugglers_dead) {
        dialogue.pages = [
          ['She’s at the bar tonight, not her usual table.',
           '“Don’t ask me how I am.',
           'Everyone keeps deciding not to ask. I watch them decide.”'],
          ['“I closed his registry file this week. Polwick’s.”',
           '“Tonight I’m going to finish this drink and not be a registry clerk until tomorrow.”'],
          ['“You can stand here, though.',
           'You don’t have to say anything.”'],
        ];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      } else if (eslaRestDayoff && smugglers_execution_day > 0) {
        dialogue.pages = [
          ['“Registry work follows you to the inn. Did you know that?”',
           '“Someone asked me tonight what happens to him now. Polwick.”'],
          ['“I said: I don’t decide that. Which is true.”',
           'She turns her glass a quarter-turn.',
           '“It didn’t feel true when I said it.”'],
        ];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
      // Rotate through 22 states across successive dayoffs.
      const eslaInnState = Math.floor(day / 5) % 22;
      if (eslaInnState === 0) {
        dialogue.pages = [
          ['\u201cI always forget how loud it is in here.\u201d'],
          ['\u201cNicer than the office on a slow day, though.\u201d'],
        ];
      } else if (eslaInnState === 1) {
        dialogue.pages = [
          ['\u201cI pass your place on the west side most mornings. Have for years.\u201d'],
          ['\u201cLights on early, more often than not.',
           'I never say anything about it. But I notice.\u201d'],
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
           '\u201cThe prep school, specifically.',
           'Most people here don\u2019t know what that means.\u201d'],
          ['\u201cIt\u2019s a private school. Rareborn children only \u2014 the early kind of early.',
           'Years before the Academy takes everyone at twelve.\u201d',
           '\u201cThe sort of place a family pays for, and then mentions.\u201d'],
          ['\u201cMy mother signed the forms before I was two.',
           '\u201cShe was proud. I think she was proud.\u201d',
           'She looks at her glass.',
           '\u201cI never actually asked her.\u201d'],
        ];
      } else if (eslaInnState === 5) {
        dialogue.pages = [
          ['\u201cThey test you at five. At Alecton, anyway.\u201d',
           '\u201cNot the thread \u2014 anyone can read a thread. It\u2019s the hair.\u201d',
           '\u201cControl. Temperament. How much teaching you\u2019ll take.\u201d'],
          ['\u201cMine was green things.',
           'Anything growing.',
           'I could feel what a plant was about to do,',
           'the way you feel a room about to go quiet.\u201d'],
          ['\u201cThe examiner kept a pot of clover on her desk.',
           'By her third question it had leaned toward me and flowered.\u201d',
           'A small smile.',
           '\u201cShe wrote something down. The clover and I watched her do it.\u201d'],
        ];
      } else if (eslaInnState === 6) {
        dialogue.pages = [
          ['\u201cThere were twelve of us in my year. At Alecton, I mean.',
           'The Academy proper takes everyone at twelve \u2014 that\u2019s hundreds.\u201d',
           '\u201cYou don\u2019t make friends in those places the way you do here.',
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
      return true;
    }
    // Petra and Corvin caught by interactSimpleNPCs (their map getter returns 'inn')
    interactSimpleNPCs();
    return true;
  }
  const rtx = player.x - RESERVED_TABLE.x;
  const rty = player.y - RESERVED_TABLE.y;
  if (Math.sqrt(rtx * rtx + rty * rty) < TALK_RADIUS) {
    dialogue.name  = 'Reserved Table';
    dialogue.pages = [['Reserved for Imperial office staff.']];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactDrenwickSchool() {
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
      return true;
    }
  }
  // Upper floor only: locked document cabinet and apprenticeship posting board
  if (activeMap === DRENWICK_SCHOOL_UPPER_MAP) {
    const cabx = player.x - DRENWICK_SCHOOL_CABINET.x;
    const caby = player.y - DRENWICK_SCHOOL_CABINET.y;
    if (Math.sqrt(cabx * cabx + caby * caby) < TALK_RADIUS) {
      dialogue.name  = 'Document Cabinet';
      dialogue.pages = [
        ['Rows of student report cards, one folder to a child, sorted by year.',
         'Marks, attendance, and a line or two in the teacher’s hand at the end of each term.'],
        ['One folder is tabbed for a parent meeting. Another has a gold star stuck slightly crooked to the cover.',
         'The drawer smells of chalk and old paper.'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
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
      return true;
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
            accordPanel.title = 'IMPERIAL INSTRUMENT NO. 7 OF YEAR 700 — ACCORD OF THREADS';
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
      return true;
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
      return true;
    }
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactHarbormaster() {
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
    return true;
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
    return true;
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
    return true;
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
        return true;
      }
    }
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactDrenwickGuildHall() {
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
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactWashHouse() {
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
    return true;
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
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactDrenwickInfirmary() {
  // The Doctor's Letter, left on the dispensary counter (row 10, cols 11-12).
  // Picked up once; after that it's a Special Item and the drawn letter is gone.
  const lx = 11.5 * TILE, ly = 10.5 * TILE;
  const ldx = player.x - lx, ldy = player.y - ly;
  if (Math.sqrt(ldx * ldx + ldy * ldy) < TALK_RADIUS * 1.3 &&
      !stats.items.some(it => it.name === "Doctor's Letter")) {
    grantItem("Doctor's Letter");
    dialogue.name  = "Doctor's Letter";
    dialogue.pages = [
      ['A letter on the counter, its wax seal already broken. The hand is old and careful.', 'Doctor\'s Letter \u2014 added to items.'],
      ['\u201cTo whoever keeps this room after me \u2014\u201d',
       '\u201cYou will manage the cuts and the fevers and the drownings well enough. Those are honest work, and I have taught Fisk what I can.\u201d'],
      ['\u201cIt is the other cases I cannot hand over. The ones the fen sends back wrong. A cold no stove will touch. A sleep that is not sleep. People who have been somewhere and cannot say where.\u201d'],
      ['\u201cI mended what bodies I could. I never learned to mend what they had heard out there, and I am too old now to keep listening for it.\u201d'],
      ['\u201cDo not go looking for the source of it. That is the one prescription I am sure of.\u201d',
       '\u201c\u2014 Yeddin\u201d'],
    ];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactProvisionStore() {
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
    return true;
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
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactDrenwickTavern() {
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
            grantItem('Mushroom Wine');
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
    return true;
  }
  interactSimpleNPCs();
  return true;
  return interactionUiOpened();
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
      dialogue.triggerDenWraithCombat = true;
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
                         `(${itemStatLabel(it)})  \u2014 added to items.`]];
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
            if (day % 7 === 3) {
              // The strange dream plays with the player standing in the
              // all-white DREAM_MAP; the waking world (bed, house, town
              // flags) is stashed by enterDream() and restored when the
              // last dream page closes.
              const dreamIdx = Math.floor(day / 7) % DREAMS.length;
              enterDream();
              dialogue.name      = '';
              dialogue.pages     = DREAMS[dreamIdx];
              dialogue.callbacks = [function() { exitDream(); }];
              dialogue.open      = true;
              dialogue.page      = 0;
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
  // ── Floor sparkle — one-time Tweezers pickup ───────────────────────────
  if (hd && hd.sparkle && !hd.sparkle.taken) {
    const spdx = player.x - hd.sparkle.x;
    const spdy = player.y - hd.sparkle.y;
    if (Math.sqrt(spdx * spdx + spdy * spdy) < TALK_RADIUS) {
      hd.sparkle.taken = true;
      grantItem('Tweezers');
      dialogue.name  = '';
      dialogue.pages = [
        ['Something glints between the floorboards.',
         'You work it loose — a small pair of steel tweezers, still bright.'],
        ['Got Tweezers.'],
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

function interactWildsAndOutposts() {
  // Hidden meadow — the amethyst chest, and the Briar Warden waiting by the
  // pool (quest active only; prompted with Space, same as its old dungeon den)
  if (activeMap === MEADOW_MAP) {
    if (!MEADOW_CHEST.opened) {
      const mcx = player.x - MEADOW_CHEST.x;
      const mcy = player.y - MEADOW_CHEST.y;
      if (Math.sqrt(mcx * mcx + mcy * mcy) < TALK_RADIUS) {
        MEADOW_CHEST.opened = true;
        const it = MEADOW_CHEST.item;
        grantItem(it.name);
        dialogue.name  = '';
        dialogue.pages = [['Chest opened.', `${it.name}  (${itemStatLabel(it)})  — added to items.`]];
        dialogue.open  = true;
        dialogue.page  = 0;
        return true;
      }
    }
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
        return true;
      }
    }
  }
  // Smuggler fort — all interaction routed through interactSmugglerFort
  if (activeMap === SMUGGLER_FORT_MAP) { interactSmugglerFort(); return true; }
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
                grantItem('Bottle of Mushroom Wine');
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
                grantItem('Case of Mushroom Wine');
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
        return true;
      }
    }
    // Toby patrols the eastern workspace; talking to him at his live position
    // (freeze/face/resume) is handled generically by interactSimpleNPCs() now
    // that it routes any moving NPC through patrolNpcTalk().
    interactSimpleNPCs();
    return true;
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
        return true;
      }
    }
    interactSimpleNPCs();
    return true;
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
         'Aetherrail: nearest railhead three towns east. Road east, coach from Drenwick.'],
        ['Conditions (last updated by waykeeper):',
         'Canal road: maintained. Night travel not advised \u2014 canal edge unmarked in parts.',
         'Fen track: passable. Soft margins after rain.',
         'Unmarked beyond the second post. Proceed with a guide if unfamiliar.'],
        ['This post is staffed.',
         'Enquiries to the waykeeper on duty.'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

// ── Dungeon floor 4 — Mulholland ─────────────────────────────────────────────
function interactMulhollandFloor() {
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
  return interactionUiOpened();
}

// ── Dungeon floor 5 — Wrongteeth (the boss) ──────────────────────────────────
function interactWrongteethFloor() {
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
          // Award the bear even if the player never met Pip — resolving
          // Wrongteeth first must not lock the Schilling quest.
          if (!schilling_returned) {
            kPages.push([
              'On the ground beside it, half-buried in the mud,',
              'is a small cloth bear.',
              'Damp. One ear bent.',
              'You pick it up.',
            ]);
            dialogue.callbacks = [function() {
              grantItem('Schilling');
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
          // Same as the kill branch: award the bear regardless of whether the
          // player has met Pip yet.
          if (!schilling_returned) {
            hPages.push([
              'When it lets go, something drops from the tangle of its arms.',
              'A small cloth bear.',
              'It lands in the mud between you.',
              'It looks at the bear. It looks at you.',
              'You pick it up.',
            ]);
            dialogue.callbacks = [function() {
              grantItem('Schilling');
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
  return interactionUiOpened();
}

// The Sunken Gallery's two interactive features. Everything else in the gallery
// is a MAP_FEATURES inspect (see MAP_FEATURES above): this returns false when
// the player isn't standing at one of the two, so handleInteract() falls
// through to the generic inspect pass exactly as it does elsewhere.
function interactSunkenGallery() {
  // ── Maintenance recess (R2C2) — a small environmental action, not a fight ──
  if (activeMap === SUNKEN_GALLERY_R2C2 && nearPlayer(8.5 * TILE, 8.5 * TILE, TALK_RADIUS * 1.5)) {
    if (window.sunken_gallery_recess_opened) {
      dialogue.name  = '';
      dialogue.pages = [['The recess stands open, its fallen fragment shoved aside.',
                         'Empty now but for grit and the smell of old oil.']];
      dialogue.open  = true; dialogue.page = 0;
      return true;
    }
    dialogue.name  = '';
    dialogue.pages = [
      ['Set into the masonry, a maintenance recess — its cover seated but not sealed, a fallen column fragment leaning across it.',
       'No lock. Only weight, and a steady thread of cool air drawn in through the gap. Something behind it still draws breath.'],
    ];
    dialogue.callbacks = [function () {
      choice.title     = 'Maintenance recess';
      choice.cursor    = 0;
      choice.options   = ['Shift the fallen fragment aside', 'Leave it'];
      choice.callbacks = [
        function openIt() {
          window.sunken_gallery_recess_opened = true;
          grantItem('Potion');
          dialogue.name  = '';
          dialogue.pages = [
            ['The fragment grinds aside. Behind it a maintenance cache, kept bone-dry by its own draught of air:',
             'a sealed flask of lamp oil, and an old ceramic water-filter, finely made, one edge chipped away.'],
            ['Wedged behind them, a stoppered flask that has kept its contents clean all this time.',
             'Potion — added to items.'],
          ];
          dialogue.open  = true; dialogue.page = 0;
        },
        function leaveIt() {},
      ];
      choice.open = true;
    }];
    dialogue.open = true; dialogue.page = 0;
    return true;
  }

  // ── Trapped Pale Drowned (R1C2) — free it, put it down, or leave it ────────
  if (activeMap === SUNKEN_GALLERY_R1C2 && nearPlayer(8.5 * TILE, 8.5 * TILE, TALK_RADIUS * 1.6)) {
    if (window.sunken_gallery_drowned_slain) {
      dialogue.name  = '';
      dialogue.pages = [['Churned silt and flat water where the Pale Drowned was pinned.',
                         'Whatever it had snagged on came apart in the fight — threads and nothing legible.']];
      dialogue.open  = true; dialogue.page = 0;
      return true;
    }
    if (window.sunken_gallery_drowned_freed) {
      // Once the reservoir arc is finished (MainQuest 4) the Drowned you spared
      // leaves a gift at the pool where you freed it — a one-time discovery.
      if (MainQuest >= 4 && !window.sunken_gallery_gift_taken) {
        dialogue.name  = '';
        dialogue.pages = [
          ['The pool lies still — but something waits at its edge that was not here before, set out with care on the dry stone above the waterline.',
           'It has not been dropped. It has been placed. It has been left for you.'],
          ['It is a made thing, a gift, and it is hideous: a lump of stretched pale skin bound over a knot of small bones, studded with teeth set in no order at all, blind chips of green river-glass pressed in where eyes would go.',
           'Cold water still beads along it. Something worked at this a long while — with enormous care, and no idea in the world what a kind thing is shaped like.'],
          ['Propped against it, a slab of damp wood. Letters have been dug deep into the grain by something with hard, sharp nails, pressed slow:',
           '“GIANT THANK.”'],
          ['You could leave it here in the dark that made it.',
           'You take it. Of course you take it.',
           'The Drowned’s Gift — added to items.'],
        ];
        dialogue.callbacks = [function () {
          window.sunken_gallery_gift_taken = true;
          grantItem("The Drowned's Gift");
          syncQuestFlagsToWindow();
        }];
        dialogue.open  = true; dialogue.page = 0;
        return true;
      }
      if (window.sunken_gallery_gift_taken) {
        dialogue.name  = '';
        dialogue.pages = [['The pool lies still. The stone above the waterline is bare now, where the gift had been set out for you.',
                           'Somewhere under the black water, you hope, something is quietly pleased with itself.']];
        dialogue.open  = true; dialogue.page = 0;
        return true;
      }
      dialogue.name  = '';
      dialogue.pages = [['The pool lies still. The Pale Drowned is somewhere under it now, or deeper than that.',
                         'You let a dangerous thing go free. It knew what you did. So do you.']];
      dialogue.open  = true; dialogue.page = 0;
      return true;
    }
    dialogue.name  = '';
    dialogue.pages = [
      ['A Pale Drowned is caught here — not lying in wait but snagged, one arm hooked to the shoulder under something in the pool, wrenching against it slow and tireless.',
       'It caught itself. No trap, no cord — its own hand run under a snag of drowned stone as it moved through the black water, and now it cannot pull loose.'],
      ['You know what this is. You read the silt in the halls behind you; you know what its kind did to the men the office sent. It could do the same to you in a breath, if it were free.',
       'And yet its eyes, when they find yours, are not a hunter’s. They are wide and white and full of a plain animal terror — held fast in the one place a drowned thing cannot bear to be held.'],
    ];
    dialogue.callbacks = [function () {
      choice.title     = 'The trapped Pale Drowned';
      choice.cursor    = 0;
      choice.options   = ['Work it free', 'Put it down', 'Back away'];
      choice.callbacks = [
        function freeIt() {
          window.sunken_gallery_drowned_freed = true;
          dialogue.name  = '';
          dialogue.pages = [
            ['You brace against the snag and lever it up. The Drowned’s arm comes free all at once — and it does not turn on you.',
             'It folds backward into the black water without a ripple, and is simply gone, deeper in.'],
            ['You set loose a thing that would have killed you, and you both knew it, and it went anyway.',
             'The pool closes over where it hung, and the terror goes out of the room with it.'],
          ];
          dialogue.open  = true; dialogue.page = 0;
        },
        function killIt() {
          window.sunken_gallery_drowned_slain = true; // clue destroyed the moment you choose the fight
          startTrappedDrownedCombat();
        },
        function backAway() {},
      ];
      choice.open = true;
    }];
    dialogue.open = true; dialogue.page = 0;
    return true;
  }

  return false; // not at either feature — let the MAP_FEATURES inspects run
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
  { name: "wilds-and-outposts"  , match: () => true                                                                  , run: interactWildsAndOutposts },
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
}
