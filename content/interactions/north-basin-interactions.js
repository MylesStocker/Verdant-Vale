'use strict';

// North Basin interactions: Sunken Gallery, Basin Chamber, and the North Basin wilds tail.
// Interaction functions moved verbatim from interactions.js by the regional-content-split.
// Loaded BEFORE interactions.js, which keeps the generic engine, MAP_FEATURES merge,
// and the INTERACT_HANDLERS / OVERWORLD_INTERACT_HANDLERS tables that reference these.

// The Sunken Gallery's two interactive features. Everything else in the gallery
// is a MAP_FEATURES inspect (see MAP_FEATURES above): this returns false when
// the player isn't standing at one of the two, so handleInteract() falls
// through to the generic inspect pass exactly as it does elsewhere.
function interactSunkenGallery() {
  // ── Bullet Time chest (R2C4) — silt-caked strongbox, no cursed-drop gag ────
  if (activeMap === SUNKEN_GALLERY_R2C4 && !SUNKEN_GALLERY_CHEST.opened) {
    const cx = player.x - SUNKEN_GALLERY_CHEST.x;
    const cy = player.y - SUNKEN_GALLERY_CHEST.y;
    if (Math.sqrt(cx * cx + cy * cy) < TALK_RADIUS) {
      SUNKEN_GALLERY_CHEST.opened = true;
      const it = SUNKEN_GALLERY_CHEST.item;
      grantItem(it.name);
      dialogue.name  = '';
      dialogue.pages = [
        ['A silt-caked strongbox wedged against the sealed east wall, its lock rusted to nothing.',
         'The lid gives with a groan and a breath of cold, still air.'],
        [`${it.name}  ${itemStatParen(it)}  — added to items.`],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }

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

// ── NORTH_BASIN_MAP_FEATURES: region-owned MAP_FEATURES entries (merged in interactions.js) ──
const NORTH_BASIN_MAP_FEATURES = {
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

// Split out of the former interactWildsAndOutposts() by the regional-content-split;
// original branch order preserved. Reached as an OVERWORLD_INTERACT_HANDLERS entry.
function interactNorthBasinWilds() {
  interactSimpleNPCs();
  return interactionUiOpened();
}
