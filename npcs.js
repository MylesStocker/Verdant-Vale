'use strict';

// ─── Simple NPC data ──────────────────────────────────────────────────────────
// Pure dialogue NPCs driven entirely from this array.
// Custom-interaction NPCs (innkeeper, boss, chest, notice board) stay as code.
// Shared / cross-region NPCs: generic house & apartment residents (shared house/
// apartment map objects) and any NPC whose schedule crosses a prescribed region.
// Regional NPCs live in content/npcs/*-npcs.js (loaded before this file).
const SHARED_NPCS = [
  // ── West Calwick house residents ──────────────────────────────────────────
  {
    id:            'eldric',
    name:          'Eldric',
    get map()      { return day % 5 === 0 ? 'house:eldric_house' : null; },
    x:              6.5 * TILE,
    y:              5.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    dialogue: [
      ['\u201cDayoff. I tend to stay in rather than go to the inn.\u201d'],
      ['\u201cI don\u2019t drink, so there\u2019s not much pull for me there.',
       'The others seem to enjoy it. Good for them.\u201d'],
      ['\u201cIt\u2019s a perfectly reasonable way to spend a day off.',
       'Quiet. Nobody moving the filing cabinet.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'oswin',
    name:          'Oswin',
    map:           'house:west_b',
    x:              5.5 * TILE,
    y:              4.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    get dialogue() {
      const pages = [
        ['\u201cOh, hello. Come in, come in.\u201d',
         '\u201cNo need to knock around here.\u201d'],
        ['\u201cIn this part of the world it\u2019s considered perfectly polite to just walk into someone\u2019s house and start talking to them.\u201d'],
        ['\u201cBeen that way as long as I can remember.',
         'Doors are more of a suggestion, really.\u201d'],
      ];
      if (cat_quest_stage >= 1) {
        pages.push([
          '\u201cYour cat has been getting into the garden again. Nights, mostly.\u201d',
          '\u201cI\u2019ve taken to calling it Pell. Hope you don\u2019t mind.\u201d',
          '\u201cIt doesn\u2019t seem to object.\u201d',
        ]);
      }
      if (MainQuest >= 1) {
        pages.push([
          '\u201cSo they had you down for the sluice job.\u201d',
          '\u201cI heard you sorted it.\u201d',
          '\u201cNot bad for someone who\u2019s barely been here a season.\u201d',
        ]);
      }
      if (MainQuest >= 2) {
        pages.push([
          '\u201cDrenwick.\u201d',
          '\u201cThat\u2019s four hours on the road? Maybe more if the east cut is still soft.\u201d',
          '\u201cI went once. Years ago now. The canal system there is something else.\u201d',
          '\u201cYou\u2019ll have noticed.\u201d',
        ]);
      }
      if (fort_quest_stage >= 6) {
        pages.push([
          '\u201cI heard there was a post on the fen road that turned out to be something other than a post.\u201d',
          '\u201cNobody official has said much. But word gets around out here.\u201d',
        ], [
          '\u201cI passed that road once.\u201d',
          '\u201cThe guards weren\u2019t right. Something off about it.\u201d',
          '\u201cI\u2019m glad someone looked.\u201d',
        ]);
      }
      if (warden_quest_rewarded) {
        pages.push([
          '\u201cThat spring meadow up in the northwest corner has gone quiet again.\u201d',
          '\u201cThe reed crews went back last week. First time in a season.\u201d',
          '\u201cNobody\u2019s saying thank you, but everyone means it.\u201d',
        ]);
      }
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'tomas',
    name:          'Tomas',
    map:           'house:esla_house',
    x:              8.5 * TILE,
    y:              5.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    // Phase 1 bounded-wander pilot: Tomas potters around his own house — waits
    // a beat, takes a short orthogonal step to a neighbouring tile, waits again.
    // bounds are the safe interior floor of HOUSE_INTERIOR_MAP (cols 4-11, rows
    // 2-9); the exit doorway (col 7, row 10) is outside them, and live collision
    // (walls, the hearth/bed/table furniture, the player, Esla, transitions)
    // is the real authority — see movement.js's boundedWander runtime. Home is
    // derived from the authored x/y/facing above (no hardcoded home table).
    movement: {
      type: 'boundedWander',
      bounds: { minCol: 4, maxCol: 11, minRow: 2, maxRow: 9 },
      speed: 0.5,               // the shared NPC walking speed
      minPauseFrames: 60,       // ~1s at 60fps
      maxPauseFrames: 180,      // ~3s
    },
    get dialogue() {
      // Tomas — Esla's husband; a lifelong Calwick man who has never left the
      // fen and keeps an obsessive home-made almanac of everything in it. Warm,
      // chatty, and entirely content with a small, thoroughly documented world.
      // Home every day; Esla is out at the office (or the inn on Dayoff).
      const away = day % 5 === 0 ? 'at the inn, defending that soup slander' : 'down at the office';
      const cycle = day % 5;
      let pages;
      if (cycle === 0) {
        pages = [
          ['“Esla’s ' + away + '. I’m the fixture — born in this house, likely to go out of it the same way.”',
           '“Tomas. I keep the almanac. Weather, water, birds, the price of eels. Somebody has to.”'],
          ['“People think a record only counts if it’s official. I disagree. I’ve forty years of the date the first frog sang. Nobody can take that off me.”'],
        ];
      } else if (cycle === 1) {
        pages = [
          ['“Today’s page: wind out of the southwest, reeds leaning hard, three herons on the near bank.”',
           '“The herons aren’t important. I write them down anyway. That’s the whole trick of it.”'],
          ['“Esla files things because the Empire tells her to. I file things because I want to. We understand each other completely and not at all.”'],
        ];
      } else if (cycle === 2) {
        pages = [
          ['“She grew up in a city you could lose a town inside. I’ve never once left the fen.”',
           '“She finds that restful, or alarming. She won’t say which, and I’ve stopped guessing.”'],
          ['“My whole world’s about a mile across. I know every soul and every ditch in it.”',
           '“That’s not a small life. It’s a thoroughly documented one.”'],
        ];
      } else if (cycle === 3) {
        pages = [
          ['“The soup — yes. There are opinions about my soup at the inn. The opinions are wrong.”',
           '“I keep a log of every batch. Eel, stock, timing. The good ones are reproducible. That’s not luck, it’s method.”'],
          ['“She’s always home by dark, and the pot’s always ready. I timed it once, to the minute. Don’t tell her I wrote it down.”'],
        ];
      } else {
        pages = [
          ['“Want to know something my ledgers know that the district’s don’t?”',
           '“The water’s been dropping for years. A little every season. I’ve the lines to prove it, from back before anyone called it a drought.”'],
          ['“I’m not clever about what it means. I only write down what’s there.”',
           '“That’s the difference between me and Esla’s office. They decide first. I count first.”'],
        ];
      }
      if (dispatch_delivered) pages.push(
        ['“Esla said you’d been out to Drenwick. She went quiet about it — she does that with things that matter.”',
         '“I wrote the date down. It’s all I know how to do with a thing I can’t help.”']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  // ── West Calwick unoccupied houses ───────────────────────────────────────────
  // Home H (west_h) — school caretaker, home on dayoff
  {
    id:            'bram',
    name:          'Bram',
    get map()      { return day % 5 === 0 ? 'house:west_h' : null; },
    x:              8.5 * TILE,
    y:              6.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'worker',
    get dialogue() {
      const pages = [
        ['\u201cI do the maintenance on the schoolhouse.',
         'Floors, glass, guttering. When something breaks I fix it.',
         'When nothing breaks I check that it won\u2019t.\u201d'],
        ['\u201cThe children leave things behind.',
         'Shoes, mostly. You\u2019d think shoes would be hard to misplace.\u201d',
         '\u201cThey manage it.\u201d'],
        ['\u201cMs. Vale leaves a list on Fridays.',
         'I work through it over the weekend and leave a note on what I found.',
         'We\u2019ve never actually spoken.\u201d'],
      ];
      if (schilling_returned) pages.push(
        ['\u201cThe small one \u2014 Pip \u2014 came in carrying a stuffed bear.\u201d',
         '\u201cWouldn\u2019t put it down all morning. I mentioned it to Ms. Vale.\u201d'],
        ['\u201cShe said let him keep it at his desk.\u201d',
         '\u201cSo I did. Some things aren\u2019t worth straightening.\u201d']
      );
      if (drama_stage >= 5) pages.push(
        ['\u201cThe child two seats from the window has been in better spirits lately.\u201d',
         '\u201cMentioned something about a parent coming.\u201d'],
        ['\u201cIt\u2019s not my business.\u201d',
         '\u201cJust \u2014 you notice, when something shifts like that.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  // Home E (west_e) — recent arrival, not quite settled
  {
    id:            'farida',
    name:          'Farida',
    get map()      { return day % 5 === 0 ? 'house:west_e' : null; },
    x:              7.5 * TILE,
    y:              5.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    get dialogue() {
      const pages = [
        ['\u201cI came for a transfer post at the registry.',
         'The position was already filled by the time I arrived.',
         'Two weeks in transit for a position that was already filled.\u201d'],
        ['\u201cI\u2019m deciding whether to go back.',
         'There\u2019s less to go back to than there used to be.\u201d'],
        ['\u201cThe light here is different than where I grew up.',
         'I keep waking up thinking I\u2019m somewhere else.',
         'I\u2019m not sure yet if that\u2019s good or bad.\u201d'],
      ];
      if (sluice_reward_given) {
        pages.push([
          '\u201cI put in an enquiry at the canal office.',
          'They\u2019re short on inspection staff after all the sluice work.',
          'Nothing confirmed yet.\u201d',
          '\u201cBut I haven\u2019t bought a return ticket.\u201d',
        ]);
      }
      if (fort_quest_stage >= 6) {
        pages.push([
          '\u201cI\u2019ve decided to stay.\u201d',
        ], [
          '\u201cThe canal office has a part-time inspection post that opened up.',
          'Small hours. Seasonal.\u201d',
          '\u201cBut something.\u201d',
          '\u201cI stopped looking at return tickets.\u201d',
        ]);
      }
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  // Home I (west_i) — Pek, visits a neighbour on dayoff
  {
    id:            'pek',
    name:          'Pek',
    get map()      { return day % 5 === 0 && !(den_wraith_quest_started && !den_wraith_defeated) ? 'house:west_i' : null; },
    x:              6.5 * TILE,
    y:              6.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    dialogue: [
      ['\u201cI\u2019m just here for the soup.\u201d'],
      ['\u201cWe grew up on the same street. Two streets over.',
       'Back before they rezoned the whole eastern quarter.\u201d',
       '\u201cNow that street is a loading dock.\u201d'],
      ['\u201cI don\u2019t think about it.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Apt 1 — empty during the work week; fish shed worker + her child on Dayoff
  {
    id:   'apt1_maret', name: 'Maret',
    get map() { return day % 5 === 0 ? 'house:apt_1' : null; },
    x: 6.5 * TILE, y: 7.5 * TILE,
    solid: true, facing: 'down', spriteType: 'worker',
    dialogue: [
      ['\u201cClean hands. That\u2019s the one thing I look forward to on Dayoff.\u201d'],
      ['\u201cThe smell doesn\u2019t come out of the clothes even after washing.', 'You get used to it. Or you stop noticing.\u201d'],
      ['\u201cShe\u2019s been up since before me.\u201d', '\u201cDon\u2019t know where she gets it from.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Apt 2 — sluice worker (Dayoff); partner (every other Dayoff); occasional
  // child; Fenna (always — the one resident actually home during the work week)
  {
    id:   'apt2_donn', name: 'Donn',
    get map() { return day % 5 === 0 ? 'house:apt_2' : null; },
    x: 6.5 * TILE, y: 6.5 * TILE,
    solid: true, facing: 'down', spriteType: 'worker',
    dialogue: [
      ['\u201cRiver wrestling. They\u2019re running it again at the bend past the south reeds.', 'I\u2019ve been looking forward to it for weeks.\u201d'],
      ['\u201cTwo people on a log in the river, each trying to stay up while the other shoves.', 'Sounds simple. It isn\u2019t.\u201d'],
      ['\u201cMy hands are already wrecked from the sluice gates.', 'But that\u2019s tomorrow\u2019s problem.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id:   'apt2_lira', name: 'Lira',
    get map() { return day % 10 === 0 ? 'house:apt_2' : null; },
    x: 8.5 * TILE, y: 6.5 * TILE,
    solid: true, facing: 'down', spriteType: 'patron',
    dialogue: [
      ['\u201cWe\u2019re\u2014 it\u2019s complicated.', 'It\u2019s been complicated for a while.\u201d'],
      ['\u201cI didn\u2019t come for the wrestling.\u201d'],
      ['\u201cI just had some things to drop off.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id:   'apt2_child', name: 'The Child',
    get map() { return day % 15 === 0 ? 'house:apt_2' : null; },
    x: 8.5 * TILE, y: 7.5 * TILE,
    solid: true, facing: 'down', spriteType: 'child',
    dialogue: [
      ['\u201cAre we going to the wrestling?\u201d'],
      ['\u201cDonn said maybe.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Fenna — Apt 2, always home. Sael's daughter (Drenwick, corridor B2 unit 1).
  // Quest: A Bottle for Her Father. Full branching logic lives in
  // interactions.js's currentHouseId === 'apt_2' block; the getter below is a
  // plain fallback, mirroring the Orwen/Voss pattern elsewhere in this file.
  {
    id:         'fenna',
    name:       'Fenna',
    map:        'house:apt_2',
    x:           7.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      if (wine_quest_rewarded) return [['\u201cThank you again for that.\u201d', '\u201cReally.\u201d']];
      if (wine_quest_delivered) return [['\u201cDid he send anything back with you?\u201d']];
      if (wine_quest_started)   return [['\u201cNo rush. Just \u2014 whenever you can.\u201d']];
      return [['\u201cSorry \u2014 I don\u2019t get many visitors during the week.\u201d']];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Apt 3 — elderly woman (always); reed worker visits on Dayoff
  {
    id:   'apt3_hilde', name: 'Hilde',
    map:   'house:apt_3',
    x: 6.5 * TILE, y: 6.5 * TILE,
    solid: true, facing: 'down', spriteType: 'patron',
    get dialogue() {
      const pages = [
        ['\u201cI\u2019ve been in this building longer than anyone.\u201d', '\u201cThe walls are thin. I know more about my neighbours than I\u2019d like to.\u201d'],
        ['\u201cYou don\u2019t need to speak up. My hearing is fine.\u201d'],
        ['\u201cSit down if you\u2019re going to stand there.\u201d', '\u201cThere isn\u2019t a chair, but that\u2019s the spirit of the thing.\u201d'],
      ];
      if (warden_quest_rewarded) pages.push(
        ['\u201cSomeone cleared that creature from the dungeon passage.\u201d',
         '\u201cI heard about it from Senne.\u201d'],
        ['\u201cThese buildings have thin walls.\u201d', '\u201cBut my hearing is fine.\u201d']
      );
      return pages;
    },
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id:   'apt3_senne', name: 'Senne',
    get map() { return day % 5 === 0 ? 'house:apt_3' : null; },
    x: 8.5 * TILE, y: 6.5 * TILE,
    solid: true, facing: 'down', spriteType: 'worker',
    get dialogue() {
      const pages = [
        ['\u201cI come by on Dayoffs. She likes company.\u201d', '\u201cWe mostly don\u2019t even talk. That\u2019s fine by me.\u201d'],
        ['\u201cReed work. Cuts your hands all winter.', 'Doesn\u2019t pay like you\u2019d hope.\u201d'],
        ['\u201cShe\u2019s sharper than me. Always has been.\u201d'],
      ];
      if (sluice_reward_given) pages.push(
        ['\u201cI heard someone cleared the east sluice blockage.\u201d',
         '\u201cReed debris in the frame, they said.',
         'A whole season\u2019s worth of it.\u201d'],
        ['\u201cThe dock crews noticed the flow change before the report came through.\u201d',
         '\u201cThat\u2019s always how it goes.\u201d']
      );
      return pages;
    },
    flag_required: null, flag_sets: null, action: null,
  },

  // Apt 4 — young mother and baby (always); husband home only on Dayoff
  {
    id:   'apt4_cenna', name: 'Cenna',
    map:   'house:apt_4',
    x: 6.5 * TILE, y: 6.5 * TILE,
    solid: true, facing: 'down', spriteType: 'patron',
    get dialogue() {
      const pages = [
        ['\u201cHe\u2019s just started sleeping longer stretches.', 'Two hours at a go. I feel almost like a person.\u201d'],
        ['\u201cDon\u2019t wake him.\u201d'],
        ['\u201cI thought it would be different than this.', 'Not worse. Just\u2014 different.\u201d'],
      ];
      if (drama_stage >= 5) pages.push(
        ['\u201cThe child downstairs has been different this week.\u201d',
         '\u201cMore settled, maybe.\u201d'],
        ['\u201cI notice those things from up here.\u201d',
         '\u201cNothing else to do while he\u2019s sleeping.\u201d']
      );
      return pages;
    },
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id:   'apt4_baby', name: 'The Baby',
    map:   'house:apt_4',
    x: 8.5 * TILE, y: 7.5 * TILE,
    solid: false, facing: 'down', spriteType: 'child',
    dialogue: [['\u201cThe baby stares at you with large, unfocused eyes.', 'One of its socks is missing.\u201d']],
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id:   'apt4_jann', name: 'Jann',
    get map() { return day % 5 === 0 ? 'house:apt_4' : null; },
    x: 8.5 * TILE, y: 6.5 * TILE,
    solid: true, facing: 'down', spriteType: 'worker',
    get dialogue() {
      const pages = [
        ['\u201cShe doesn\u2019t sleep. I don\u2019t know how she manages.\u201d', '\u201cI\u2019m away five days and I\u2019m half-dead. She doesn\u2019t even complain.\u201d'],
        ['\u201cI work the sluice. When I\u2019m away she\u2019s here alone with him.', 'I think about that.\u201d'],
        ['\u201cI brought back a good reed mat. She seemed pleased.', 'More than I expected.\u201d'],
      ];
      if (sluice_reward_given) pages.push(
        ['\u201cThe flow at the sluice gates improved a few days back.\u201d',
         '\u201cYou notice it when the draw pressure normalises.',
         'The gate starts responding properly again.\u201d'],
        ['\u201cShould have been caught months ago.',
         'But these things sit until someone\u2019s specifically sent to look.\u201d']
      );
      return pages;
    },
    flag_required: null, flag_sets: null, action: null,
  },

  // ── Drenwick Civic NPCs ───────────────────────────────────────────────────────
  // Drenwick inn name: The Reed and Rope
  // (Named for caulking reed and mooring rope — the two things a working canal
  //  could not go without. Made sense when the town was smaller. Nobody changed it.)

  // Drenwick East Apartments, Corridor B2 Unit 3 — Sera (waiting for a visitor)
  // Relocated out of the civic square into the formerly-vacant B2/U3 apartment
  // (see HOUSE_DATA drenwick_apt_b2_u3). Present every day; on Dayoff she is
  // indoors and still waiting, not "just out". Stable id kept (drenwick_market_2).
  {
    id:         'drenwick_market_2',
    name:       'Sera',
    map:        'house:drenwick_apt_b2_u3',
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      return day % 5 === 0
        ? [
            ['\u201cStill no sign of him \u2014 and on the day off, of all days.\u201d',
             '\u201cHe said he\u2019d come before midday. I\u2019ll wait in where it\u2019s warm and pretend that isn\u2019t what I\u2019m doing.\u201d'],
          ]
        : [
            ['\u201cHe said he\u2019d be here before midday.\u201d', '\u201cThat was yesterday.\u201d'],
            ['\u201cWhen the Registry started keeping Civic-level records, they had to decide who counted as a resident.\u201d',
             '\u201cMy grandmother\u2019s name is in there. Her thread classification. It\u2019s just in the books. I don\u2019t know how I feel about that.\u201d'],
          ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Corridor A1, Unit 1 — Maret (canal lock tender, ~40)
  {
    id:         'apt_maret',
    name:       'Maret',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_a1_u1' : null; },
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    dialogue: [
      ['\u201cThird gate\u2019s been sticking since the rains. I\u2019ve logged it twice.\u201d',
       '\u201cThe district office sends someone eventually. Usually after the third complaint, sometimes after the fifth. Never the first.\u201d'],
      ['\u201cMy boy started at the Imperial school last cycle.\u201d',
       '\u201cHe\u2019s doing arithmetic now. Came home the other day and told me my lock-timing estimates were wrong.\u201d',
       '\u201cHe was right, too. Little brat.\u201d'],
      ['\u201cHave you seen the river wrestling down at the south bank?\u201d',
       '\u201cMullen fought last week. Keeps his footing better than anyone I\u2019ve seen. He\u2019ll go under eventually \u2014 they all do \u2014 but he\u2019s good.\u201d'],
      ['\u201cI\u2019ve got mushroom wine if you want some.\u201d',
       '\u201cI know it sounds like a bad idea. It usually is. That\u2019s sort of the point.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A1, Unit 2 — Clodagh (reed cutter, ~30)
  {
    id:         'apt_clodagh',
    name:       'Clodagh',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_a1_u2' : null; },
    x:           8.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'worker',
    dialogue: [
      ['\u201cThe south fen\u2019s getting shallower.\u201d',
       '\u201cUsed to cut three bales before noon. Now I\u2019m lucky to get two. The canal expansion redirected the water flow, and the beds haven\u2019t recovered.\u201d'],
      ['\u201cReeds are strange things. They don\u2019t belong to anyone, officially. Imperial land survey classifies them as civic growth.\u201d',
       '\u201cWhich means anyone can cut them, but the district gets a levy on anything sold through the market.\u201d',
       '\u201cEverything\u2019s taxable if you look at it correctly.\u201d'],
      ['\u201cMy hands are always cold.\u201d',
       '\u201cYou\u2019d think you\u2019d get used to it. You don\u2019t.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A1, Unit 3 — Voss (provision store worker, ~32; moral dilemma NPC)
  // Interaction driven by interactions.js currentHouseId block; SIMPLE_NPC entry for rendering.
  {
    id:         'apt_voss',
    name:       'Voss',
    map:        'house:drenwick_apt_a1_u3',
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      if (dilemma_voss === null) return [['Voss.', 'Provision store.', 'Can I ask you something?']];
      return [['Still thinking about it.']];
    },
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A1, Unit 4 — Yssa (district records clerk, civic aspirant)
  {
    id:         'apt_yssa',
    name:       'Yssa',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_a1_u4' : null; },
    x:           6.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cI passed the Civic Registration exam on my second attempt.\u201d',
       '\u201cFirst time I failed the arithmetic section by three marks. Three marks.\u201d',
       '\u201cI\u2019ve never been more motivated in my life than in the six months after that.\u201d'],
      ['\u201cThe Civic Class isn\u2019t a title or a rank, people get that wrong.\u201d',
       '\u201cIt\u2019s a designation. If you pass the registration exams and secure a qualifying post, you\u2019re on the register. That\u2019s it. No ceremony.\u201d',
       '\u201cMy mother cried anyway.\u201d'],
      ['\u201cI\u2019d like to transfer to Halcyra eventually.\u201d',
       '\u201cThe district offices there handle a full tier of administrative complexity above what we have here. The work is harder. The pay is better. The mud is less.\u201d'],
      ['\u201cHave you ever seen a Halcyra civil document? Perfect binding. Waterproof ink. They\u2019ve been doing it for eight hundred years.\u201d',
       '\u201cWe use whatever we can get. My requisition for decent vellum has been pending since spring.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A2, Unit 1 — Fenwick (retired Halcyra administrator)
  {
    id:         'apt_fenwick',
    name:       'Fenwick',
    map:        'house:drenwick_apt_a2_u1',
    x:           7.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['\u201cI served thirty-one years in the Halcyra provincial administration. Taxation records, mostly. Now I am here.\u201d',
       '\u201cThe archive there has documents going back to the fourth century of the Empire. You can trace the same canal levy through nine hundred years of budget cycles.\u201d',
       '\u201cThat\u2019s either impressive or horrifying, depending on your temperament.\u201d'],
      ['\u201cPeople romanticise Halcyra. The grandeur is real \u2014 the avenues, the record halls, the twin statues at the Twin Capitals Gate.\u201d',
       '\u201cBut it is also a city where everything takes three forms in triplicate and nothing moves quickly.\u201d',
       '\u201cI retired here for the quiet. Save well and one can retire off of thirty-one years of work....as long as they are willing to live somewhere like here. I got mud instead of quiet. Close enough.\u201d'],
      ['\u201cThe Civic Class is the best thing the Empire has done in three hundred years. I am proof. Look at me here, retired and content.\u201d',
       '\u201cOpening the administrative register to qualifying individuals regardless of birth \u2014 commonborn and rareborn alike \u2014 was overdue.\u201d',
       '\u201cThe Returners still grumble. They always will. The Empire doesn\u2019t care.\u201d'],
      ['\u201cLumina is the other capital. Most people in Drenwick have never been.\u201d',
       '\u201cI went twice on official business. The registry\u2019s main tower catches the light at sunset and the whole thing goes amber.\u201d',
       '\u201cThey study rareborn gifts there. Keep them structured, sanctioned, recorded. Eleven centuries of method.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A2, Unit 2 — Nessa (fish-smoker)
  {
    id:         'apt_nessa',
    name:       'Nessa',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_a2_u2' : null; },
    x:           8.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'patron',
    dialogue: [
      ['\u201cI know I smell. I\u2019ve made my peace with it.\u201d',
       '\u201cSeven years at the smoke house does something to you that soap can\u2019t fully fix.\u201d',
       '\u201cKern tries her best, I\u2019ll give her that.\u201d'],
      ['\u201cWe smoked fourteen hundred units last cycle. Record.\u201d',
       '\u201cThere\u2019s a formula they use in the Imperial register for what constitutes a \u2018unit\u2019 of smoked fish.\u201d',
       '\u201cSomebody in Halcyra decided that four hundred years ago and we\u2019re still using it.\u201d'],
      ['\u201cI grew up in the fens. My grandmother cut reeds. Her grandmother cut reeds.\u201d',
       '\u201cI was going to cut reeds too, until I discovered that smoking pays better and you stay drier.\u201d',
       '\u201cOnly slightly drier. But it counts.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A2, Unit 3 — Tombers (river wrestling aspirant, 20s)
  {
    id:         'apt_tombers',
    name:       'Tombers',
    map:        'house:drenwick_apt_a2_u3',
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    dialogue: [
      ['\u201cI\u2019m in training when the canal and mill work quiets down. It keeps me in shape for my passion.\u201d',
       '\u201cRiver wrestling. District qualifier is in eight days.\u201d',
       '\u201cI\u2019ve been doing grip exercises and cold-water immersions. Preparing for the hold.\u201d'],
      ['\u201cPeople think it\u2019s just dunking each other.\u201d',
       '\u201cThere\u2019s a whole system. Three holds, two breaks, the water has to be moving. You can\u2019t fight in still water or they disqualify both wrestlers.\u201d',
       '\u201cThe current has to be at least knee-depth. That\u2019s the only rule they really enforce.\u201d'],
      ['\u201cHolt in C1 was district champion fifteen years back.\u201d',
       '\u201cHe says I have good instincts but poor footing.\u201d',
       '\u201cI think he\u2019s jealous of my potential. I think about this a lot.\u201d'],
      ['\u201cThe gambling on these bouts is illegal, technically.\u201d',
       '\u201cTechnically. The district office has a standing policy of not looking at the river bank on match days.\u201d',
       '\u201cI\u2019m not complaining. The purse gets bigger when people are betting.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A2, Unit 4 — Orla (widow, building elder)
  {
    id:         'apt_orla',
    name:       'Orla',
    map:        'house:drenwick_apt_a2_u4',
    x:           6.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'right',
    spriteType: 'patron',
    dialogue: [
      ['\u201cI\u2019ve been in this building twenty-two years.\u201d',
       '\u201cI was here when they built the east canal extension. I was here when they repaved the civic square twice.\u201d',
       '\u201cThe square is still uneven. I know which cobbles to avoid.\u201d'],
      ['\u201cMy husband worked the lock gates. He died the winter after the third gate failed \u2014 got soaked through three days running fixing the housing, and the cold took hold.\u201d',
       '\u201cThe district paid out a maintenance worker\u2019s pension. A year\u2019s wages. That\u2019s the rule.\u201d',
       '\u201cIt\u2019s not enough, but it\u2019s something. Most places in the world, you get nothing.\u201d'],
      ['\u201cThe Empire is not kind.\u201d',
       '\u201cBut it is consistent. In eleven hundred years it hasn\u2019t collapsed or fractured or been overthrown. There\u2019s something to be said for that, even if the thing to be said isn\u2019t entirely flattering.\u201d'],
      ['\u201cI don\u2019t go down to the river wrestling. Too loud, and the crowd gets a certain kind of excited that I don\u2019t like.\u201d',
       '\u201cBut Tombers will ask me to cheer for him, and I\u2019ll feel bad, and I\u2019ll go.\u201d',
       '\u201cThis is how it always works.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B1, Unit 1 — Hazel (private tutor, furious about Education Act)
  {
    id:         'apt_hazel',
    name:       'Hazel',
    map:        'house:drenwick_apt_b1_u1',
    x:           8.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cThe Education Act of 871 gives every parent the right',
       'to enroll a child in an Imperial school through age twelve.\u201d',
       '\u201cThe parent has the right. The Empire does not, technically.\u201d'],
      ['\u201cThe schooling is free. Attendance is not.\u201d',
       '\u201cA reed-cutter may enroll her son, provided she can afford',
       'to lose the work of his hands.\u201d',
       '\u201cThe Act guarantees a desk. It does not replace his wages.\u201d'],
      ['\u201cThe Imperial schools are not bad. I will admit that.\u201d',
       '\u201cArithmetic, letters, Empire history, basic civic law.\u201d',
       '\u201cBut they teach to the level of the group.\u201d'],
      ['\u201cThe wealthy still hire tutors. The poor never could.\u201d',
       '\u201cThe families between them choose the Imperial school.\u201d',
       '\u201cThey used to be most of my pupils.\u201d',
       '\u201cI had six students. Now I have two.\u201d'],
      ['\u201cThe Act was meant to answer illiteracy in the outer provinces.\u201d',
       '\u201cIt helped. The figures are quite clear about that.\u201d',
       '\u201cThe same figures count every eligible child,',
       'including the ones whose families cannot spare them.\u201d'],
      ['\u201cBrennan\u2019s mother is happy with the Imperial school.\u201d',
       '\u201cIt covers the Civic Registration exam material.\u201d',
       '\u201cI was teaching him advanced geometry at nine.\u201d',
       '\u201cShe is still right. I hate that she is right.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B1, Unit 2 — Druck (canal dredger, wrestling gambler)
  {
    id:         'apt_druck',
    name:       'Druck',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_b1_u2' : null; },
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    dialogue: [
      ['\u201cTen to one on Mullen in the district qualifier.\u201d',
       '\u201cI know that looks like good odds. It\u2019s not good odds. Mullen\u2019s been losing his grip since last autumn.\u201d',
       '\u201cBut the crowd\u2019s memory is short and I intend to benefit from that.\u201d'],
      ['\u201cDredging\u2019s honest work.\u201d',
       '\u201cYou go in, you pull the silt, you leave. The canal runs better. Simple.\u201d',
       '\u201cI just also enjoy gambling. These are separate things that happen to coexist.\u201d'],
      ['\u201cI\u2019m behind on rent.\u201d',
       '\u201cMaret keeps telling me to sort it out. He\u2019s right. I\u2019m going to sort it out after the qualifier.\u201d',
       '\u201cEither I win the bet or I lose the bet, and in both cases I\u2019ll have to sort it out.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B1, Unit 3 — Maeve (young mother; drought hardship, money worries)
  {
    id:         'apt_maeve',
    name:       'Maeve',
    map:        'house:drenwick_apt_b1_u3',
    x:           8.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'patron',
    dialogue: [
      ['“Sorry. She’s sleeping.”',
       '“She’s two. She sleeps badly — it’s the heat. No rain in months and the room won’t cool.”',
       '“We’re managing.”'],
      ['“It’s the money I lie awake over, not her.”',
       '“My husband cut reeds on the south beds. The drought took the beds, and the wage with them.”',
       '“The rent falls due the same as ever. The landlord doesn’t care that the sky’s forgotten how to rain.”'],
      ['“Everything’s dearer now.”',
       '“A measure of grain costs half again what it did in spring. Eggs when there are eggs.”',
       '“I’ve taken in mending to bring a little in. It’s not enough, but it’s something.”'],
      ['“People are kind, mostly. Orla upstairs brought food.”',
       '“I keep telling myself the rains always come back. They have to.”',
       '“When the canal’s full again there’ll be work. We just have to last until then.”'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B1, Unit 4 — Corra (market broker, civic class sharp)
  {
    id:         'apt_corra',
    name:       'Corra',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_b1_u4' : null; },
    x:           6.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'right',
    spriteType: 'patron',
    dialogue: [
      ['\u201cI buy reed product from the cutters and resell it to the barge merchants.\u201d',
       '\u201cYes, the margin is small. Everything\u2019s in volume. You\u2019re not the first person to ask.\u201d'],
      ['\u201cThe Civic Class is real, but people misunderstand what it does.\u201d',
       '\u201cIt doesn\u2019t remove the old hierarchies. It creates a parallel track. You can get on the track through work and exams.\u201d',
       '\u201cThe old families are still rich. They\u2019re just less exclusively so.\u201d'],
      ['\u201cI\u2019m on the register. Qualified in trade administration three years ago.\u201d',
       '\u201cDoes it change much, day to day? Marginally. It changes which doors are open.\u201d',
       '\u201cThat\u2019s actually significant, when you list the doors.\u201d'],
      ['\u201cRareborn have their own track, the Lumina register. It\u2019s separate from the Civic register but they interact.\u201d',
       '\u201cA rareborn individual who also holds Civic registration gets priority consideration in certain administrative postings.\u201d',
       '\u201cThe Empire is very systematic about who gets what advantage under what conditions.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B2, Unit 1 — Sael (mushroom wine philosopher; Fenna's father)
  // Quest: A Bottle for Her Father. Full branching logic (receiving the wine,
  // handing over the Thank-You Note) lives in interactions.js's
  // currentHouseId === 'drenwick_apt_b2_u1' block; the getter below is a
  // plain fallback plus his ambient reaction once the quest has moved on.
  {
    id:         'apt_sael',
    name:       'Sael',
    map:        'house:drenwick_apt_b2_u1',
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      if (wine_quest_delivered) {
        return wine_quest_gift === 'case'
          ? [['\u201cStill working through that case, if you can believe it.\u201d',
              '\u201cTell her I said she didn\u2019t need to send quite so much.\u201d',
              '\u201cI\u2019m glad she did, though.\u201d']]
          : [['\u201cThat bottle didn\u2019t last the week.\u201d',
              '\u201cTell her thank you again.\u201d']];
      }
      if (wine_quest_started) {
        return [
          ['\u201cHave some.\u201d',
           '\u201cNo, I\u2019m serious. It\u2019s different from regular wine.\u201d',
           '\u201cRegular wine makes the world smaller. Mushroom wine makes it\u2026 textured.\u201d'],
          ['\u201cFenna sent you, did she.\u201d',
           '\u201cTold her I didn\u2019t need anyone walking the fen road on my account.\u201d',
           '\u201cShe worries anyway. Always has.\u201d'],
        ];
      }
      return [
        ['\u201cHave some.\u201d',
         '\u201cNo, I\u2019m serious. It\u2019s different from regular wine.\u201d',
         '\u201cRegular wine makes the world smaller. Mushroom wine makes it\u2026 textured.\u201d'],
        ['\u201cThe fen mushrooms grow where the reed beds meet the peat layer.\u201d',
         '\u201cYou can only pick them in the two weeks after the first frost. Miss the window and they\u2019re gone until next year.\u201d',
         '\u201cSomebody discovered you could ferment them. I would very much like to shake that person\u2019s hand.\u201d'],
        ['\u201cThe Empire has lasted a thousand years.\u201d',
         '\u201cDo you know what that means? It means it outlasted every single idea people had for doing it differently.\u201d',
         '\u201cThe fen didn\u2019t care either way. The fen was here before the Empire and will be here after.\u201d'],
        ['\u201cThe interesting question isn\u2019t who built the Empire. It\u2019s what they decided to do with the people they beat.\u201d',
         '\u201cThey didn\u2019t eliminate them. They built a system instead.\u201d',
         '\u201cA cage made of paperwork. Quite elegant, if you think about it at the right angle.\u201d'],
      ];
    },
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B2, Unit 2 — Pip (district messenger)
  {
    id:         'apt_pip',
    name:       'Pip',
    map:        'house:drenwick_apt_b2_u2',
    x:           6.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'right',
    spriteType: 'worker',
    dialogue: [
      ['\u201cI carry messages for the district office. Can\u2019t read them. That\u2019s in the contract.\u201d',
       '\u201cDoesn\u2019t stop me knowing who sends what to whom.\u201d',
       '\u201cPeople forget that delivery implies knowledge of both ends.\u201d'],
      ['\u201cSomething\u2019s happening with the south post. I\u2019ve taken three sealed messages there in the last cycle.\u201d',
       '\u201cUsed to be maybe one a month.\u201d',
       '\u201cI don\u2019t ask questions. That\u2019s also in the contract.\u201d'],
      ['\u201cBest run of my week is the civic quarter at dawn.\u201d',
       '\u201cEverything\u2019s quiet. The canal\u2019s still. The fen birds are calling.\u201d',
       '\u201cFor about twenty minutes Drenwick is actually quite a nice place to be.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B2, Unit 4 — Aldren (elderly, remembers Millennial Accord celebrations)
  {
    id:         'apt_aldren',
    name:       'Aldren',
    map:        'house:drenwick_apt_b2_u4',
    x:           6.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'right',
    spriteType: 'patron',
    dialogue: [
      ['\u201cI was nine years old when the Millennial Accord was signed.\u201d',
       '\u201cOne thousand years of the Empire. The celebrations lasted three days in Drenwick.\u201d',
       '\u201cThey brought barrels of wine to the civic square and let people have as much as they wanted. My father got very sick.\u201d'],
      ['\u201cPeople ask what the Empire was like fifty years ago.\u201d',
       '\u201cMostly the same. Slightly fewer forms. The roads were the same roads.\u201d',
       '\u201cThe mud was exactly the same mud.\u201d'],
      ['\u201cThe rareborn have always been here.\u201d',
       '\u201cWhen I was small, my grandmother warned me about them.\u201d',
       '\u201cNot cruelly \u2014 she just said: if you see something strange from a child, don\u2019t be afraid, but do tell someone.\u201d',
       '\u201cI never did see anything. One in three hundred is actually quite rare, when you live a life.\u201d'],
      ['\u201cI\u2019m eighty-one years old.\u201d',
       '\u201cI\u2019ve outlived three district administrators, two canal supervisors, and everyone who was unkind to me before my fortieth birthday.\u201d',
       '\u201cPatience is underrated as a strategy.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor C1, Unit 1 — Bren (failed canal engineering apprentice)
  {
    id:         'apt_bren_c1',
    name:       'Bren',
    map:        'house:drenwick_apt_c1_u1',
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    dialogue: [
      ['\u201cI failed the gate certification exam.\u201d',
       '\u201cTwice.\u201d',
       '\u201cThe second time by a wider margin, which is genuinely impressive in the wrong direction.\u201d'],
      ['\u201cI understand the theory. The theory makes sense.\u201d',
       '\u201cThe exam has this section about flow variance under dual-gate load conditions that I simply \u2014 I don\u2019t know.\u201d',
       '\u201cI passed every other section. It\u2019s just the one.\u201d'],
      ['\u201cMaret says I should try again.\u201d',
       '\u201cOrla says failure teaches more than success and I should be very well-taught by now.\u201d',
       '\u201cHolt said something about the river wrestling, which I think was a metaphor, but I\u2019m not sure.\u201d'],
      ['\u201cThird attempt is in two months.\u201d',
       '\u201cIf I fail again the guild considers the certification path closed. I\u2019d have to reapply in five years.\u201d',
       '\u201cI am going to understand dual-gate flow variance if it kills me.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor C1, Unit 2 — Sova (Halcyra transfer, hates mud)
  {
    id:         'apt_sova',
    name:       'Sova',
    map:        'house:drenwick_apt_c1_u2',
    x:           8.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cI was transferred here from the Halcyra district office fourteen years ago.\u201d',
       '\u201cI was told it was a lateral move with regional experience benefits. They lied to me. I got hurt. Now here I am.\u201d',
       '\u201cI have since learned what a lateral move with regional experience benefits means in practice.\u201d'],
      ['\u201cHalcyra has stone streets.\u201d',
       '\u201cCobblestone, cut granite, proper laid roads.\u201d',
       '\u201cI wore out a pair of boots I\u2019d owned for six years in three months here.\u201d',
       '\u201cThe mud is structural. It is part of the landscape. It has opinions.\u201d'],
      ['\u201cThe people are actually fine.\u201d',
       '\u201cOrla brought food when I moved in. Maret explained which gate to complain about. The children who play in the lane are loud but not malicious.\u201d',
       '\u201cI don\u2019t hate it here. I just miss being dry.\u201d'],
      ['\u201cHalcyra is extraordinary if you haven\u2019t been.\u201d',
       '\u201cThe administrative quarter has a tower you can climb for a view of the whole district. On clear days you can see the road to Lumina \u2014 it\u2019s paved all the way, both capitals connected.\u201d',
       '\u201cThe most impressive bit of infrastructure the Empire ever built, and it mostly carries official correspondence.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor C1, Unit 3 — Holt (former river wrestling champion)
  {
    id:         'apt_holt',
    name:       'Holt',
    map:        'house:drenwick_apt_c1_u3',
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    dialogue: [
      ['\u201cDistrict champion. Three years running, \u201855 through \u201857.\u201d',
       '\u201cI was taken under by Carris in the \u201858 final.\u201d',
       '\u201cTo this day I maintain the current was abnormal. The referees disagreed.\u201d'],
      ['\u201cRiver wrestling isn\u2019t just strength.\u201d',
       '\u201cYou have to read the water. Where it\u2019s pulling, where the bed dips, where you can plant your foot.\u201d',
       '\u201cThe hold is almost secondary. Win the ground first.\u201d'],
      ['\u201cTombers has good instincts.\u201d',
       '\u201cHis footing\u2019s wrong, I\u2019ve told him that. He plants too wide when the current shifts.\u201d',
       '\u201cHe\u2019ll learn or he\u2019ll lose. That\u2019s how the river teaches.\u201d'],
      ['\u201cThe crowds that come for the wrestling \u2014 they love the violence of it. The possible drowning.\u201d',
       '\u201cI understand that. It\u2019s honest. You know what you\u2019re watching and why.\u201d',
       '\u201cBetter than pretending a thing is only a sport when everyone knows it\u2019s also a statement.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor C2, Unit 1 — Desca (letter-writer, connects to Dessa / letter quest)
  {
    id:         'apt_desca',
    name:       'Desca',
    map:        'house:drenwick_apt_c2_u1',
    x:           8.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cI write letters for people who struggle with the formal style.\u201d',
       '\u201cPetitions, family correspondence, official complaints. A small fee per page.\u201d',
       '\u201cThere was a time this trade fed a whole family. Each generation reads a little more of its own post and needs me a little less. It\u2019ll die with me, I think.\u201d'],
      ['\u201cI wrote a letter for a woman in the west houses recently.\u201d',
       '\u201cSearching for a sister, transferred away young \u2014 the family lost track.\u201d',
       '\u201cFamilies lose children to the system all the time. They have faith and they trust the bureaucracy, and away they go. Rareborn, commbonborn, stillborn, it is all the same. If they need to have you then they take you. Or your kids. They act nice. The transfer records exist somewhere, but finding them requires knowing which office received them.\u201d'],
      ['\u201cThe Lumina register is comprehensive but not public.\u201d',
       '\u201cYou can petition for family record access, but the form requires documentation most people don\u2019t have.\u201d',
       '\u201cI\u2019ve helped with three of those petitions. One succeeded. One was denied. One is still pending from four years ago.\u201d'],
      ['\u201cA city lives and dies by its letters, I think.\u201d',
       '\u201cHalcyra runs on official correspondence. But the real news \u2014 who\u2019s struggling, who\u2019s well, who has gone and not come back \u2014 that travels in private hands.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor C2, Unit 2 — Tern (14, refused Imperial school enrollment)
  {
    id:         'apt_tern',
    name:       'Tern',
    map:        'house:drenwick_apt_c2_u2',
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'child',
    dialogue: [
      ['\u201cMy dad says the Imperial school teaches you to think like a clerk.\u201d',
       '\u201cI don\u2019t want to think like a clerk.\u201d',
       '\u201cHe says that\u2019s fine but I\u2019m not allowed to complain when clerks have better jobs than me.\u201d'],
      ['\u201cI know all the good fishing spots on the south bank.\u201d',
       '\u201cThat\u2019s worth something.\u201d',
       '\u201cNot on the Civic Register, but still. Worth something.\u201d'],
      ['\u201cDruck down the corridor teaches me odds calculation.\u201d',
       '\u201cFor the wrestling bets. He says it\u2019s applied arithmetic.\u201d',
       '\u201cI asked Hazel down the corridor if that counts as school and she said no and looked tired.\u201d'],
      ['\u201cI\u2019m fourteen.\u201d',
       '\u201cThe enrollment window closes at twelve so they can\u2019t make me go anymore.\u201d',
       '\u201cI should feel like I won something. I mostly feel like I\u2019ve put off a problem.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor C2, Unit 3 — Mulla (claims rareborn grandmother, social ambiguity)
  {
    id:         'apt_mulla',
    name:       'Mulla',
    map:        'house:drenwick_apt_c2_u3',
    x:           8.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'patron',
    dialogue: [
      ['\u201cMy family\u2019s been in this fen longer than the canal has. Longer than Drenwick, if you believe my grandmother \u2014 and I did.\u201d',
       '\u201cShe read the water the way a clerk reads a ledger.\u201d'],
      ['\u201cThe blanket on the bed was hers. That pattern\u2019s from the old settlements, out past where the canal cut through.\u201d',
       '\u201cThose villages are gone now. They widened the works, the water table shifted, and the fen took them back.\u201d'],
      ['\u201cIn a dry season like this one you can see them again \u2014 a wall, a well-mouth, a doorstep with nothing behind it.\u201d',
       '\u201cThe fens are full of that. People lived and lost out here long before the Empire drew a line round it.\u201d'],
      ['\u201cShe used to say the land remembers even when the people don\u2019t.\u201d',
       '\u201cSo I keep the blanket. Somebody should remember the remembering.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor C2, Unit 4 — Josse (canal maintenance, cheerful)
  {
    id:         'apt_josse',
    name:       'Josse',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_c2_u4' : null; },
    x:           8.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'worker',
    dialogue: [
      ['\u201cGreat day.\u201d',
       '\u201cI mean, it\u2019s muddy, the north channel has a housing problem, and I\u2019ve got water in my left boot.\u201d',
       '\u201cBut I\u2019m employed, I\u2019m dry enough, and the stove works. Great day.\u201d'],
      ['\u201cI do canal maintenance. Anything below the waterline is mine.\u201d',
       '\u201cPeople ask if it\u2019s unpleasant.\u201d',
       '\u201cYes. It smells bad. The silt is very cold. You find things in there that you wish you hadn\u2019t.\u201d',
       '\u201cI still like the job. The canal is alive. It\u2019s always doing something.\u201d'],
      ['\u201cI went to the river wrestling last match day.\u201d',
       '\u201cBrilliant. Absolutely brilliant. Two wrestlers in the current, completely focused, crowd going mad.\u201d',
       '\u201cOne of them got taken under for almost ten seconds. Came up laughing.\u201d',
       '\u201cI can\u2019t explain why that made me so happy.\u201d'],
      ['\u201cI\u2019m not on the Civic Register.\u201d',
       '\u201cI thought about it. The exams look like hard work.\u201d',
       '\u201cMaybe next cycle. Or the one after.\u201d',
       '\u201cI\u2019m in no rush. The canal will still need maintaining.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // ─── Drenwick East Apartments — additional residents ─────────────────────────

  // Corridor A1, Unit 1 — Sona (grain allocation clerk; Maret's partner)
  {
    id:         'apt_sona',
    name:       'Sona',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_a1_u1' : null; },
    x:           9.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cMaret does the lock. I do grain records at the district allocation office.\u201d',
       '\u201cBetween us we keep the canal moving and things fed.\u201d',
       '\u201cSomebody in Halcyra gets cited for that.\u201d'],
      ['\u201cThe new fen-grain strains have been in rotation for eight years now.\u201d',
       '\u201cThirty percent better yield in wet soil. The Quiet paid for that \u2014',
       'thirty years of Imperial agronomists with nothing better to do than breed grain.\u201d',
       '\u201cThe yield improved. The barge allocation schedule did not.\u201d'],
      ['\u201cPeople talk about the Quiet like it was a gift.\u201d',
       '\u201cIt was. But gifts go somewhere.\u201d',
       '\u201cYou can see where the three hundred years went if you look at the aetherrail terminus,',
       'and where it didn\u2019t go if you look at the Drenwick grain depot.\u201d'],
      ['\u201cMy grandmother used to say: every war ends eventually,',
       'and the peace is always more complicated than the war was.\u201d',
       '\u201cShe meant it as a complaint. I think she was right.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A2, Unit 2 — Theis (fish-smoker colleague; shares a shift with Nessa)
  {
    id:         'apt_theis',
    name:       'Theis',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_a2_u2' : null; },
    x:           6.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'right',
    spriteType: 'worker',
    dialogue: [
      ['\u201cNessa and I work the same shed. Different shifts, same smell.\u201d',
       '\u201cWe don\u2019t socialise much outside of it.\u201d',
       '\u201cYou can only talk about fish for so many hours before you\u2019ve said everything.\u201d'],
      ['\u201cI go to the wrestling when I can.\u201d',
       '\u201cThere\u2019s something about watching two people fight the river in front of you that clears your head.\u201d',
       '\u201cNo paperwork. No district allocation. Just the water and whoever\u2019s still standing.\u201d'],
      ['\u201cHad mushroom wine for the first time last autumn.\u201d',
       '\u201cSael from down the hall gave me a cup. Said it was different from regular wine.\u201d',
       '\u201cHe was right. I spent two hours convinced the canal was breathing.',
       'It might have been. I\u2019m not completely ruling it out.\u201d'],
      ['\u201cThe Quiet is real. I believe it.\u201d',
       '\u201cThree hundred years since a proper war. The Empire is proud of that.\u201d',
       '\u201cBut there\u2019s a kind of quiet that\u2019s just everyone too tired to fight anymore.',
       'I don\u2019t know which one this is.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A2, Unit 1 — Petra (Fenwick's neighbour; drops in sometimes)
  // Visits Fenwick on dayoff only. Young, works the district record office.
  {
    id:         'apt_petra_a2',
    name:       'Petra',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_a2_u1' : null; },
    x:           9.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'clerk',
    get dialogue() {
      return [
        ['\u201cI come by on Dayoffs. He has better tea than I do and he doesn\u2019t mind talking.\u201d',
         '\u201cMost people I know would rather not think about work on a Dayoff.\u201d',
         '\u201cFenwick spent thirty years in Halcyra. He has context I\u2019ll never get from a textbook.\u201d'],
        ['\u201cHe told me once that in Halcyra, the administrative quarter has its own canal.\u201d',
         '\u201cInternal. Just for moving official materials between offices.\u201d',
         '\u201cA whole canal. For documents.\u201d',
         '\u201cI didn\u2019t know whether to be impressed or furious.\u201d'],
        ['\u201cI\u2019m studying for the Civic Class exam.\u201d',
         '\u201cFenwick says the trick is the phrasing \u2014 not knowing the law, but writing it back in the right register.\u201d',
         '\u201cHe\u2019s been helping me with the format. I think I have a chance this cycle.\u201d'],
      ];
    },
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B1, Unit 4 — Lior (lodging with Corra; working toward Civic exam)
  // Recent arrival from a smaller settlement. Sleeping on Corra's floor while he finds work.
  {
    id:         'apt_lior',
    name:       'Lior',
    map:        'house:drenwick_apt_b1_u4',
    x:           8.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    dialogue: [
      ['\u201cI came from Ashford. Corra is my cousin. I\u2019m here until I find a post.\u201d',
       '\u201cShe\u2019s been patient about it.\u201d',
       '\u201cI have been here three months. Patient has limits.\u201d'],
      ['\u201cI\u2019m going to take the Civic exam.\u201d',
       '\u201cCorra passed it. She says the trick is the administrative law section.\u201d',
       '\u201cI don\u2019t know administrative law. I know how to move reed product.',
       'These are apparently different skills.\u201d'],
      ['\u201cIn Ashford, the aetherrail passes within two miles of town.\u201d',
       '\u201cYou can hear it on still nights. A low hum, more felt than heard.\u201d',
       '\u201cEverybody knows what it is and nobody in Ashford can use it for anything.',
       'The terminus is still two hours by road. Just close enough to remind you.\u201d'],
      ['\u201cThe old families in Ashford still run the trade boards.\u201d',
       '\u201cNot officially. But you go through them anyway because they control the warehouse access.',
       'The Civic Class is supposed to change that.\u201d',
       '\u201cMaybe it will. Corra says it\u2019s complicated. Most things are.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B2, Unit 3 — Wren (26; coach staging post clerk — books aetherrail
  // through-passage; the nearest railhead is two towns northeast of Drenwick,
  // i.e. three towns east of Calwick. Neither Calwick nor Drenwick has a line.)
  {
    id:         'apt_wren',
    name:       'Wren',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_b2_u3' : null; },
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cI work the booking counter at the coach staging post northeast of town.',
       'Through-passage \u2014 coach to the railhead, two towns on, then the aetherrail.\u201d',
       '\u201cThe rail goes northeast. It has never gone in any other direction.\u201d',
       '\u201cThree years I\u2019ve booked other people\u2019s journeys. I have never been on it.\u201d'],
      ['\u201cThree hundred years without a major war.\u201d',
       '\u201cDo you know what that means? It means the Imperial engineers got to stay put.\u201d',
       '\u201cThe aetherrail is what happens when nobody is conscripting your surveyors for fifty years.\u201d'],
      ['\u201cThe resonance work behind the rail came out of Lumina.\u201d',
       '\u201cCapital research, Imperial funding, and \u2014 you can work out where the terminus ended up.\u201d',
       '\u201cThe Calwick sluice is two hundred years old. The aetherrail is fifty-two.\u201d',
       '\u201cSomeone decided which one got the investment. That was a decision a person made.\u201d'],
      ['\u201cI\u2019m not against the rail. I think it\u2019s remarkable.\u201d',
       '\u201cI just notice that remarkable things keep ending up northeast of me.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B2, Unit 4 — Essa (Aldren's granddaughter; visits on dayoff)
  // Twenty-two. Works at the market. Has a very different relationship to the Empire than her grandfather.
  {
    id:         'apt_essa_b2',
    name:       'Essa',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_b2_u4' : null; },
    x:           8.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'patron',
    dialogue: [
      ['\u201cI visit on Dayoffs. He likes company and I like his cooking.\u201d',
       '\u201cWe don\u2019t always agree on things. That\u2019s fine.\u201d',
       '\u201cHe\u2019s eighty-one. He\u2019s earned his opinions.\u201d'],
      ['\u201cHe talks about the Millennial Accord like it settled everything.\u201d',
       '\u201cI understand why. For his generation, a thousand years of stability is the whole story.\u201d',
       '\u201cI keep thinking about what the thousand years was stable for, and who had to hold still for it.\u201d'],
      ['\u201cThe Quiet is real. The last three hundred years have been better than the three hundred before.\u201d',
       '\u201cWe have the aetherrail. We have the new grain strains. We have the Civic Class.\u201d',
       '\u201cGrandfather says: look how far we\u2019ve come. I say: look at how far, and then ask who paid the fare.\u201d'],
      ['\u201cI go to the wrestling sometimes.\u201d',
       '\u201cHe disapproves. Says the crowd gets a certain kind of excited.\u201d',
       '\u201cHe\u2019s not wrong. But it\u2019s the most honest thing in Drenwick.\u201d',
       '\u201cEveryone in the water on exactly the same terms. I find that restful.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor C1, Unit 4 — abandoned (no resident). This unit was always the
  // block’s odd one out (originally sketched as storage) and is now dressed as
  // a moved-out apartment: a searchable dresser and a glint on the floor that
  // yields the Old Fishing Rod. See HOUSE_DATA.drenwick_apt_c1_u4 for the
  // furniture and interactions.js for the dresser / sparkle handlers.

  // Corridor C2, Unit 4 — Yoren (with Josse; opposite temperament)
  // Canal maintenance like Josse, but a full decade older and considerably less cheerful about it.
  {
    id:         'apt_yoren',
    name:       'Yoren',
    map:        'house:drenwick_apt_c2_u4',
    x:           6.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'right',
    spriteType: 'worker',
    dialogue: [
      ['\u201cAlso canal maintenance.\u201d',
       '\u201cYes, both of us. The canal is large.\u201d'],
      ['\u201cJosse is relentlessly positive about the work.\u201d',
       '\u201cI don\u2019t know how he does it.\u201d',
       '\u201cI\u2019ve been under the waterline for eighteen years.',
       'It gets into you. Not the smell \u2014 the patience it requires.\u201d'],
      ['\u201cThey\u2019re bringing in a new dredge head from the Halcyra engineering depot.\u201d',
       '\u201cDesigned during the Quiet, apparently. Better clearance on the silt layer.\u201d',
       '\u201cThey said that about the last one too. The silt does not read the equipment specifications.\u201d'],
      ['\u201cThe Civic Register doesn\u2019t mean much down here.\u201d',
       '\u201cThe canal doesn\u2019t care if you passed an exam.\u201d',
       '\u201cBut the allocation meetings, the equipment requests, the depot priority queue \u2014',
       'all of that runs on register status. So it matters. I just resent that it does.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A1, Unit 4 — Sethe (ledger clerk; shares the flat and the civic
  // track with Yssa). References the Bracelet as a class marker (see LORE.md,
  // Economics). Distinct tile from Yssa (6.5,7.5).
  {
    id:         'apt_sethe',
    name:       'Sethe',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_a1_u4' : null; },
    x:           8.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    dialogue: [
      ['“Yssa and I are both on the civic track. Two clerks’ wages, one flat.”',
       '“The future is a thing we have to plan, not just fall into. So we plan it.”'],
      ['“You know what a Bracelet costs at our level? Months of pay, for the real article.”',
       '“The Academy hands them to its students for nothing. Nobles never once look at the price.”',
       '“An administrator saves for one. A reed-cutter never sees a true one at all — just the bootleg imitations that half-work, if that.”'],
      ['“So the people who can afford to be careless get called libertines for it.”',
       '“Being careless is a luxury good. It’s money wearing a moral costume.”',
       '“Down here, courtship still costs you something. Strip it all back and that’s the whole difference.”'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor A2, Unit 3 — Wisa (Tombers’s younger sister). Carries Academy
  // youth culture out to the fens: the “Shut Up and Kiss Me” dance (see
  // LORE.md, The Academy System). Distinct tile from Tombers (7.5,6.5).
  {
    id:         'apt_wisa',
    name:       'Wisa',
    map:        'house:drenwick_apt_a2_u3',
    x:           9.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'child',
    dialogue: [
      ['“Tombers is my brother. He does the wrestling. I do not care about the wrestling.”',
       '“I love the dance. Everyone knows it now — the Shut Up and Kiss Me. It came down out of the Academy.”'],
      ['“It’s set to the very start of Erik Jontek’s Resonant Symphony No. 2.”',
       '“Nobody cares about the rest of it. Just the opening, for the dance. The rest may as well not exist.”',
       '“The Academy students started it, up between Lumina and Halcyra, and now it’s everywhere. Even here. Even Drenwick. Even Calwick and beyond I bet.”'],
      ['“I’ll never see the Academy myself. There’s nothing in my hair — no thread, nothing to register.”',
       '“But the dance got out. I like the dance. I will find a boy who loves it too.”'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Corridor B2, Unit 2 — Vesk (small-goods peddler; shares the room with Pip,
  // the messenger). References the sugar economy and the far cities (see
  // LORE.md, The World). Distinct tile from Pip (6.5,7.5).
  {
    id:         'apt_vesk',
    name:       'Vesk',
    get map()   { return day % 5 === 0 ? 'house:drenwick_apt_b2_u2' : null; },
    x:           8.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'traveler',
    dialogue: [
      ['“I share the room with Pip. He carries the district’s letters; I carry small goods.”',
       '“We’re both always half-packed. Honey, mostly, and dried fruit. The cheap sweet — what people can actually afford.”'],
      ['“Real sugar? Cane grows on just two islands in the whole world, away up north past the storm.”',
       '“By the time the fine refined grades reach a Drenwick counter, they can cost more than their weight in gold.”',
       '“So a fen family sweetens with honey and calls it plenty. They’re right to.”'],
      ['“I ran a load up to Calivar City once. A proper northern port — grows its own grain, so it haggles like it owns you. Never again at those prices.”',
       '“Merovar, though — out on the island chains — that’s a city worth the trip. Older than the Empire, they say, and it carries on like it knows it.”'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Drenwick West B — canal inspector, home when not on rounds
  {
    id:            'nara',
    name:          'Nara',
    get map()      { return day % 5 !== 2 && day % 5 !== 3 ? 'house:drenwick_west_b' : null; },
    x:              8.5 * TILE,
    y:              6.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'worker',
    dialogue: [
      ['\u201cI walk the canal twice a week. Log the levels, check the gate housings.',
       'It\u2019s quieter work than it sounds.\u201d'],
      ['\u201cDrenwick gets the brunt of it when the water\u2019s high.',
       'People forget the town only exists because the drainage does.\u201d'],
      ['\u201cI\u2019ve been doing this route for eight years.',
       'I could walk it in the dark.',
       'On the bad nights, I do.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Drenwick West A — Dessa (letter quest) ───────────────────────────────────
  // Former canal trader. Her rareborn sister Yael was transferred north fifteen years ago.
  // Dialogue driven entirely by interactions.js; SIMPLE_NPCS entry for rendering and collision.
  {
    id:         'dessa',
    name:       'Dessa',
    map:        'house:drenwick_west_a',
    x:           8.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      if (letter_quest_stage === 0) return [['Dessa.', 'Canal trade for most of my working life.']];
      if (letter_quest_stage >= 7)  return [['I wrote last night.', 'Took an hour.', 'Fifteen years of drafts, and it came out in an hour.']];
      return [['Come back when you have something.']];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Drenwick North A — Marla, the guildmaster's wife (flavour) ───────────────
  // Wife of the Canal Engineers' Guild master. Packing to leave for the capital,
  // cheerfully oblivious to the fen town's water-worries that rule everyone
  // else's life. Warm and not unkind — just self-absorbed and a little naive.
  {
    id:         'marla',
    name:       'Marla',
    map:        'house:drenwick_north_a',
    x:           8.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['“Oh — a visitor! Mind the boxes, dear, half the house is packed already.”',
       '“We’re for the capital, you know. My husband runs the Guild here — the Canal Engineers’ — and a man of his standing is simply wasted on a fen town. Everyone says so.”'],
      ['“The very first thing I shall do is buy a proper dress. One with some swoosh to it — the kind that go whum when you turn on your heel.”',
       '“You can’t buy swoosh here. You can buy sensible. I have had quite enough of sensible.”'],
      ['“They say the capital keeps gardens green the whole year round. Imagine! Here it’s forever the water — too much, too little, the levels, the levels.”',
       '“I’ve never once looked at that canal and thought about levels. I look at it and think: well, that’s grey, isn’t it.”'],
      ['“I mean to enjoy myself, and I can’t think why anyone should mind. Life’s short and the fen is damp.”',
       '“You must come and visit us, once we’re settled! Bring — oh, whatever it is you do. It’ll be perfectly lovely.”'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Calwick Apt 1 — Orwen (letter quest) ─────────────────────────────────────
  // Former imperial records clerk. Left service four years ago.
  // Processed rareborn transfers for eighteen years, including Yael's.
  // Dialogue driven entirely by interactions.js; SIMPLE_NPCS entry for rendering and collision.
  {
    id:         'orwen',
    name:       'Orwen',
    map:        'house:apt_1',
    x:           7.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      if (letter_quest_stage === 0) return [['Quiet building.', 'If you need something, there\u2019s not much I can offer.']];
      if (letter_quest_stage >= 7)  return [['I hope the letter reaches her.', 'This relay is still running. It should.']];
      return [['Come back when you\u2019re ready.']];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Calwick — Overseer Mault (side quest giver) ──────────────────────────────
  // Appears on the main square after sluice_reward_given; interaction handled in interactions.js.
  // Uses clerk sprite. Stands col 11 row 7, east of the notice board.
  {
    id:         'overseer_mault',
    name:       'Overseer Mault',
    // Appears a few days into the game (day 5+), once the sluice is cleared —
    // the Warden "came up through the flood channel three weeks ago," but the
    // district takes a while to post the contract and send Mault out.
    get map()   { return sluice_reward_given && day >= 5 ? 'town' : null; },
    x:          11.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      // Full interaction handled in interactions.js; this is a fallback only.
      if (!warden_quest_started) return [['Mault. District Infrastructure.']];
      if (warden_quest_rewarded) return [['\u201cPassage is clear. Appreciate the work.\u201d']];
      if (warden_quest_defeated) return [['\u201cGood. Report back and we\u2019ll settle up.\u201d']];
      return [['\u201cIt\u2019s in the spring meadow \u2014 northwest corner of the vale. Come back when it\u2019s done.\u201d']];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Smugglers' fort — Smuggler Guard (door sentry) ────────────────────────
  // Visible in stage 0 (unconfronted) and stage 1 (his own fight is pending
  // or was fled/lost — stays put and re-engages on approach, same
  // retry-safe pattern as the Briar Warden / Den Wraith).
  {
    id:            'fort_guard',
    name:          'Guard',
    get map()      {
      if (!inSmugglerFort || (fort_quest_stage !== 0 && fort_quest_stage !== 1)) return null;
      if (smugglers_dead || (smugglers_execution_day > 0 && day >= smugglers_execution_day)) return null;
      return 'smuggler_fort';
    },
    x:              6.5 * TILE,
    y:              9.5 * TILE,
    solid:         true,
    facing:        'up',
    dialogue: [
      ['\u2018Keep back.\u2019', 'He doesn\u2019t meet your eyes.'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        'fortGuardBlock',
  },

  // ── Smugglers' fort — Polwick (ringleader) ────────────────────────────────
  {
    id:            'polwick',
    name:          'Polwick',
    // Visible in stage 0 (unconfronted), stage 2 (his own fight is pending
    // or was fled/lost — re-engages on approach), and stages 5/6 (spared —
    // still here), but hidden once smugglers_dead or the Empire's execution
    // day arrives.
    get map()      {
      if (!inSmugglerFort) return null;
      if (smugglers_dead || (smugglers_execution_day > 0 && day >= smugglers_execution_day)) return null;
      if (fort_quest_stage === 0 || fort_quest_stage === 2 || fort_quest_stage >= 5) return 'smuggler_fort';
      return null;
    },
    x:              7.5 * TILE,
    y:              4.5 * TILE,
    solid:         true,
    facing:        'down',
    get dialogue() {
      if (fort_quest_stage >= 5) {
        // Spared — minimal, wary
        return [
          ['\u201cYou again.\u201d', 'He doesn\u2019t move from his spot.'],
          ['\u201cWe had a deal.\u201d'],
        ];
      }
      return []; // stage 0 dialogue is handled by interactSmugglerFort()
    },
    flag_required: null,
    flag_sets:     null,
    action:        'polwickConfront',
  },

  // ── Smugglers' fort — Essa ────────────────────────────────────────────────
  // Visible in stage 0 (unconfronted), stage 3 (her own fight is pending or
  // was fled/lost — re-engages on approach), and stages 5/6 (spared).
  {
    id:            'essa',
    name:          'Essa',
    get map()      {
      if (!inSmugglerFort) return null;
      if (smugglers_dead || (smugglers_execution_day > 0 && day >= smugglers_execution_day)) return null;
      if (fort_quest_stage === 0 || fort_quest_stage === 3 || fort_quest_stage >= 5) return 'smuggler_fort';
      return null;
    },
    x:              9.5 * TILE,
    y:              6.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    get dialogue() {
      if (fort_quest_stage >= 5) {
        return [
          ['\u201cI just move things.\u201d', '\u201cI don\u2019t ask what they are.\u201d'],
          ['\u201cPol handles the talking.\u201d', 'She looks away.'],
        ];
      }
      // Stage 0 — deflects and points the player at Polwick. Her scripted
      // stage-3 re-engage lives in interactSmugglerFort(), which runs before
      // this fallback ever can. (This used to `return []` on the assumption
      // interactSmugglerFort() covered every press — it doesn't cover stage-0
      // presses at HER position, and interactSimpleNPCs() opening a dialogue
      // with zero pages hard-froze the renderer. Never return [] from a
      // dialogue getter.)
      return [
        ['She doesn’t stop counting crates.',
         '“Pol does the talking. Table with the ledgers.”'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── Morden — district properties inspector (Calwick main square) ─────────────
  // Posts the Den Wraith removal job. Present during work days after day 11,
  // not on Dayoff, and leaves once the reward has been paid.
  {
    id:         'morden',
    name:       'Morden',
    get map()   { return day >= 11 && day % 5 !== 0 && !den_wraith_rewarded ? 'town' : null; },
    x:           9.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    dialogue:   [],   // handled entirely by NPC_ACTIONS.mordenDenWraith
    flag_required: null,
    flag_sets:     null,
    action:        'mordenDenWraith',
  },

  // ─── Drenwick West B — retired canal pilot (Veran) ───────────────────────────
  // Piloted the upper fen run for twenty-two years. Retired two years ago.
  // Spends most days in the house, occasionally walks to the quay to look.
  {
    id:         'veran_retired',
    name:       'Veran',
    // Quay spot moved from col 4.5 to col 13.5 (day % 5 === 2) -- the old
    // spot crowded Pell (dock_worker_2), who stands at the west end of the
    // same quay row (col 2.5, row 3.5). The far east end of the quay is
    // clear of every other Canal Docks NPC.
    get map()   { return day % 5 === 2 ? 'drenwick_canal_docks' : 'house:drenwick_west_b'; },
    get x()     { return day % 5 === 2 ? 13.5 * TILE : 7.5 * TILE; },
    get y()     { return day % 5 === 2 ?  3.5 * TILE : 5.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      if (day % 5 === 2) return [
        ['\u201cI come down to look.\u201d',
         '\u201cI don\u2019t have a reason. I just do.\u201d'],
      ];
      const pages = [
        ['\u201cTwenty-two years on the upper run.\u201d',
         '\u201cI knew the channel by feel in the dark.\u201d',
         '\u201cNow I know the ceiling of this room the same way. That\u2019s not nothing, I tell myself.\u201d'],
        ['\u201cA pilot reads the water. The colour, the surface break, where it goes quiet.\u201d',
         '\u201cYou stop being able to turn it off, even on land.\u201d',
         '\u201cI look at a puddle and I can tell you which way it drains.\u201d'],
        ['\u201cRetirement was the right choice.\u201d',
         '\u201cMy hands were going. You can\u2019t hold the line well when your grip isn\u2019t what it was.\u201d',
         '\u201cBetter to stop early and let someone sharper take the run. I believe that. Most days I believe it.\u201d'],
        ['\u201cThe canal will outlast all of us.\u201d',
         '\u201cThe Empire built it to last and then made sure someone was always patching it.\u201d',
         '\u201cThat\u2019s the only real trick to keeping anything running. Someone has to care enough to keep patching.\u201d'],
      ];
      // Occasional: a comfortable retiree who could pay for real care — a quiet
      // reminder that in the Empire good treatment is a thing you buy.
      if (Math.floor(day / 5) % 2 === 0) pages.push(
        ['\u201cThe hands \u2014 I had them seen to over the winter. A proper physician up the district, not the door-front infirmary.\u201d',
         '\u201cCost what a reed-cutter makes in a season. I could pay it.\u201d'],
        ['\u201cThat\u2019s the whole of it, in the end. Not whether a body can be mended.\u201d',
         '\u201cWhether you can pay to be.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

];

// Authoritative runtime NPC list. Order: the five regional arrays (in the fixed
// load order) followed by the shared entries. No source-order tags, no sorting.
const SIMPLE_NPCS = [
  ...CALWICK_NPCS,
  ...THORNMERE_WILDS_NPCS,
  ...DRENWICK_TOWN_NPCS,
  ...DRENWICK_INTERIOR_NPCS,
  ...SOUTH_RUINS_NPCS,
  ...SHARED_NPCS,
];

// Named functions for NPCs with extra behaviour beyond dialogue.
// Referenced by the action field. Populated as needed.
const NPC_ACTIONS = {};

// ─── Bridge toll interaction (shared by both Phase 1 pilot guards) ───────────
// The nearer guard is whichever one the player can reach (they're six rows
// apart, so only one is ever in TALK_RADIUS). Paying EITHER guard authorizes
// the entire crossing and moves BOTH guards — otherwise the far guard would
// still block the path. `proceedLine` keeps each guard's original direction
// line (the south guard sends you north, the north guard south).
// After payment: a short acknowledgement, no second charge, and no restart
// of the (completed or running) sidestep routes — startNpcRoute() itself
// also refuses to restart a running/completed route, belt and braces.
function bridgeTollInteraction(proceedLine) {
  dialogue.name = 'Imperial Soldier';
  if (bridge_toll_paid) {
    dialogue.pages = [['\u201cYou\u2019re marked through. Proceed.\u201d']];
    dialogue.callbacks = null;
  } else if (stats.gold >= 1) {
    // Ask first: the toll is only charged if the player chooses to pay.
    dialogue.pages = [
      ['\u201cOne gold. Canal bridge toll.\u201d'],
    ];
    dialogue.callbacks = [function() {
      choice.title   = 'Imperial Soldier';
      choice.options = ['Pay the toll  (1g)', 'Not now'];
      choice.cursor  = 0;
      choice.callbacks = [
        function pay() {
          stats.gold -= 1;
          dialogue.name  = 'Imperial Soldier';
          dialogue.pages = [
            ['He takes the coin and marks his ledger.'],
            [proceedLine],
          ];
          // Movement begins only after the successful dialogue completes:
          // the callback fires when the last page is dismissed.
          dialogue.callbacks = [function() {
            bridge_toll_paid = true;
            startNpcRoute('bridge_soldier_north');
            startNpcRoute('bridge_soldier_south');
          }];
          dialogue.open = true;
          dialogue.page = 0;
        },
        function decline() {
          dialogue.name  = 'Imperial Soldier';
          dialogue.pages = [['\u201cThen the bridge stays shut to you.\u201d', 'He does not move.']];
          dialogue.callbacks = null;
          dialogue.open = true;
          dialogue.page = 0;
        },
      ];
      choice.open = true;
    }];
  } else {
    dialogue.pages = [
      ['\u201cOne gold to cross.\u201d', '\u201cImperial canal toll. No exceptions.\u201d'],
      ['\u201cCome back when you have the coin.\u201d'],
    ];
    dialogue.callbacks = null;
  }
  dialogue.open = true;
  dialogue.page = 0;
}
window.bridgeTollInteraction = bridgeTollInteraction;

NPC_ACTIONS.lorraShop = function(npc) {
  const isPoisoned = hasStatusEffect('poison');
  dialogue.name  = npc.name;
  dialogue.pages = isPoisoned
    ? [
        ['\u201cYou\u2019ve been in the reed beds.\u201d', '\u201cI can see it. Come here.\u201d'],
        ['\u201cReed Remedy. Fifty gold.\u201d', '\u201cTakes the poison right out.\u201d'],
      ]
    : [
        ['\u201cRemedies, mostly. Wetland complaints.\u201d', '\u201cThe reeds out here will get into you if you\u2019re not careful.\u201d'],
        ['\u201cReed Remedy, if you need it. Fifty gold.\u201d', '\u201cWorth having before you need it.\u201d'],
      ];
  dialogue.callbacks = [function() {
    choice.title   = npc.name;
    choice.options = ['Buy Reed Remedy  (50g)', 'No thank you'];
    choice.cursor  = 0;
    choice.callbacks = [
      function buy() {
        if (stats.gold >= 50) {
          stats.gold -= 50;
          grantItem('Reed Remedy');
          dialogue.name  = npc.name;
          dialogue.pages = [['\u201cUse it before it uses you.\u201d']];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else {
          dialogue.name  = npc.name;
          dialogue.pages = [['\u201cNot enough.\u201d', '\u201cThe marsh doesn\u2019t haggle.\u201d']];
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
};

// Nora — Drenwick market fen-goods seller. Sells the two cheap sex-specific
// toad-banes (Henbane Sprig / Jackbane Vial, 8g each) that instantly drop a
// matched Mire Toad in combat. Same dialogue→choice→buy shape as lorraShop.
NPC_ACTIONS.noraReagentShop = function(npc) {
  dialogue.name  = npc.name;
  dialogue.pages = [
    ['“Fen remedies, love! Dried marsh herb, pickled root — and the two you’ll really want out in the reeds.”',
     '“Toad-bane. There’s jack-toads and hen-toads, see — same to the eye as two peas in a pod. But a Jackbane drops the one, a Henbane the other. Eight gold each, cheap at twice it.”'],
    ['“Use the wrong one and you’ve wasted your hand and only made the toad cross. Use the right one and it’s over before it’s begun.”',
     '“Can’t tell jack from hen by looking? No one can, pet. You look close — really close — before you throw. That’s the whole trick, and the only bit I give free.”'],
  ];
  dialogue.callbacks = [function() {
    choice.title   = npc.name;
    choice.options = ['Henbane Sprig  (8g)', 'Jackbane Vial  (8g)', 'No thank you'];
    choice.cursor  = 0;
    choice.callbacks = [
      function buyHen() {
        dialogue.name = npc.name;
        if (stats.gold >= 8) { stats.gold -= 8; grantItem('Henbane Sprig');
          dialogue.pages = [['“There you are. For the hen, mind — look close before you throw.”']]; }
        else { dialogue.pages = [['“Eight gold, love. Come back when you’ve got it.”']]; }
        dialogue.open = true; dialogue.page = 0;
      },
      function buyJack() {
        dialogue.name = npc.name;
        if (stats.gold >= 8) { stats.gold -= 8; grantItem('Jackbane Vial');
          dialogue.pages = [['“Good pick. For the jack — and match it to the toad, or you’ve thrown coin in the reeds.”']]; }
        else { dialogue.pages = [['“Eight gold, love. Come back when you’ve got it.”']]; }
        dialogue.open = true; dialogue.page = 0;
      },
      function leave() {},
    ];
    choice.open = true;
  }];
  dialogue.open = true;
  dialogue.page = 0;
};

// ─── Still Water quest handlers ───────────────────────────────────────────────

// Gridd — eel fisher at The Falls hamlet. Gives the rainfish warning if Mabel has
// sent the player to retrieve her sickle and Gridd hasn't warned them yet.
NPC_ACTIONS.griddRainfishWarn = function(npc) {
  dialogue.name = npc.name;
  if (sickle_quest_stage === 1 && !gridd_rainfish_warned) {
    gridd_rainfish_warned = true;
    syncQuestFlagsToWindow();
    dialogue.pages = [
      ['\u201cHeard Mabel\u2019s sending you to the north bank.\u201d',
       '\u201cMind you don\u2019t wake the rainfish.\u201d',
       '\u201cThey school up under the overhang there this time of year \u2014 whole cluster of them, just sitting in the dark.\u201d'],
      ['\u201cDon\u2019t come at it from the west side. Come at it from the path, then cut west along the top bank.\u201d',
       '\u201cThe low reeds on the south and west of the pond \u2014 that\u2019s where they surface. You wade in there and they\u2019ll be on you.\u201d',
       '\u201cNot dangerous on their own. Three of them at once in the shallows is a different matter.\u201d'],
    ];
  } else if (sickle_quest_stage >= 2 && sickle_quest_stage < 4) {
    dialogue.pages = [
      ['\u201cBack already.\u201d',
       gridd_rainfish_warned
         ? '\u201cRainfish give you any trouble?\u201d'
         : '\u201cThose rainfish wake up on you?\u201d'],
      ['\u201cEel run\u2019s been good this week.\u201d',
       '\u201cYou want to go out at dawn, before the heron gets there first.\u201d',
       '\u201cTwo of us, one heron. The heron is better at it than we are, but we have more time.\u201d'],
    ];
  } else if (sickle_quest_stage === 4) {
    dialogue.pages = [
      ['\u201cMabel looked glad this morning.\u201d',
       '\u201cGood work done.\u201d'],
      ['\u201cEel run\u2019s been good this week.\u201d',
       '\u201cYou want to go out at dawn, before the heron gets there first.\u201d',
       '\u201cTwo of us, one heron. The heron is better at it than we are, but we have more time.\u201d'],
      ['\u201cThe falls are south of here, where the fen drops off.\u201d',
       '\u201cYou can hear them at night when the wind is right. Good sleeping sound.\u201d',
       '\u201cThe pool at the base is cold enough to cure a headache. Nothing else works on me anymore.\u201d'],
    ];
  } else {
    dialogue.pages = [
      ['\u201cEel run\u2019s been good this week.\u201d',
       '\u201cYou want to go out at dawn, before the heron gets there first.\u201d',
       '\u201cTwo of us, one heron. The heron is better at it than we are, but we have more time.\u201d'],
      ['\u201cThe falls are south of here, where the fen drops off.\u201d',
       '\u201cYou can hear them at night when the wind is right. Good sleeping sound.\u201d',
       '\u201cThe pool at the base is cold enough to cure a headache. Nothing else works on me anymore.\u201d'],
      ['\u201cDrenwick sends a tax counter every other year or so.\u201d',
       '\u201cWe show him three eels and some reeds. He writes something down and goes back.\u201d',
       '\u201cI think he\u2019s frightened of the fen. Most of them are.\u201d'],
    ];
  }
  dialogue.open = true;
  dialogue.page = 0;
};

// Mabel — hamlet elder. Gives the Still Water quest and handles completion/reward.
NPC_ACTIONS.mabelSickleQuest = function(npc) {
  dialogue.name = npc.name;
  if (sickle_quest_stage === 0) {
    dialogue.pages = [
      ['\u201cI lost my sickle at the north bank of the bog pond, two seasons past.\u201d',
       '\u201cI put a notice at the Drenwick market board. If you\u2019re heading that way.\u201d'],
    ];
  } else if (sickle_quest_stage === 1) {
    dialogue.pages = [
      ['\u201cYou saw the posting. Good.\u201d',
       '\u201cNorth bank \u2014 watch the reeds. Don\u2019t come in from the west side.\u201d'],
    ];
  } else if (sickle_quest_stage === 2) {
    sickle_quest_stage = 4;
    stats.gold += 300;
    syncQuestFlagsToWindow();
    dialogue.pages = [
      ['\u201cOh.\u201d',
       '\u201cYou brought it back without a mark on it.\u201d',
       '\u201cI wasn\u2019t sure that could be done cleanly, that close to the bank.\u201d'],
      ['\u201cThe rainfish didn\u2019t stir?\u201d',
       '\u201cGood. They\u2019re not dangerous \u2014 just messy. They cloud the shallows for a whole day if something startles them.\u201d'],
      ['\u201cHere.\u201d',
       '\u201cI\u2019ve been setting this aside for something worth doing.\u201d',
       '\u201cYou\u2019ve given me back something I thought I\u2019d let go of.\u201d'],
    ];
  } else if (sickle_quest_stage === 3) {
    sickle_quest_stage = 4;
    stats.gold += 80;
    syncQuestFlagsToWindow();
    dialogue.pages = [
      ['\u201cYou found it.\u201d',
       '\u201cA bit muddy, but that\u2019s the pond for you.\u201d',
       '\u201cI can clean it.\u201d'],
      ['\u201cDid the rainfish scatter on you?\u201d',
       '\u201cThey do that if you disturb the bank. Not dangerous, just messy.\u201d',
       '\u201cThey\u2019ll settle by morning.\u201d'],
      ['\u201cHere \u2014 for your trouble.\u201d',
       '\u201cThe sickle is what matters. Thank you.\u201d'],
    ];
  } else {
    // Stage 4 complete — normal Mabel dialogue
    dialogue.pages = [
      ['\u201cI was born here. My mother was born here.\u201d',
       '\u201cBefore the path was built, you could only get here by fen-boat.\u201d',
       '\u201cNow there\u2019s a road. People use it to leave.\u201d'],
      ['\u201cThe eels keep the cold off in winter, properly smoked.\u201d',
       '\u201cReeds for thatch, reeds for basket, reeds for when you\u2019ve nothing else to do with your hands.\u201d',
       '\u201cEveryone here knows how to weave. You learn it before you learn to swim.\u201d'],
      ['\u201cI went to Drenwick once, when I was young.\u201d',
       '\u201cToo loud. Too much stone. The mud was the wrong colour.\u201d',
       '\u201cCame back in two days and have not felt the need since.\u201d'],
    ];
  }
  dialogue.open = true;
  dialogue.page = 0;
};

// Fort guard — just blocks without engaging in conversation.
NPC_ACTIONS.fortGuardBlock = function() {
  dialogue.name  = '';
  dialogue.pages = [['\u2018Keep back.\u2019', 'He doesn\u2019t meet your eyes.']];
  dialogue.open  = true;
  dialogue.page  = 0;
};

// Polwick — full confrontation handled by interactSmugglerFort() in interactions.js.
// This action fires for spared-state dialogue (stage >= 5) which is handled by
// the generic dialogue path after the action check; so we need no action for that.
// For stage 0, interactSmugglerFort() intercepts before interactSimpleNPCs().
NPC_ACTIONS.polwickConfront = function(npc) {
  // Fallback: show whatever dialogue the getter returns (spared state).
  dialogue.name  = npc.name;
  dialogue.pages = npc.dialogue;
  dialogue.open  = true;
  dialogue.page  = 0;
};

NPC_ACTIONS.mordenDenWraith = function(npc) {
  dialogue.name = npc.name;
  if (!den_wraith_quest_started) {
    dialogue.pages = [
      ['\u2018I posted a notice on the board.\u2019',
       '\u2018There\u2019s a manifestation in a property on the west side.\u2019',
       '\u2018Ask me when you\u2019ve taken the job.\u2019'],
    ];
  } else if (den_wraith_quest_started && !den_wraith_defeated) {
    dialogue.pages = [
      ['\u2018Still active?\u2019',
       '\u2018It only manifests fully on Dayoff.\u2019',
       '\u2018You\u2019ll need to go in then.\u2019'],
    ];
  } else if (den_wraith_defeated && !den_wraith_rewarded) {
    stats.gold += 200;
    den_wraith_rewarded = true;
    syncQuestFlagsToWindow();
    refreshJobBoard();
    dialogue.pages = [
      ['\u2018It\u2019s gone? Good.\u2019',
       '\u2018Here \u2014 the district rate for a confirmed clearance. 200 gold.\u2019'],
    ];
  } else {
    dialogue.pages = [
      ['\u2018Property\u2019s been cleared. Pek\u2019s moved back in. Thanks.\u2019'],
    ];
  }
  dialogue.open = true;
  dialogue.page = 0;
};

NPC_ACTIONS.kolmBrawler = function(npc) {
  dialogue.name = npc.name;
  if (sailor_brawl_fight_day === day) {
    // Already fought today
    dialogue.pages = [
      ['\u201cYou got lucky,\u201d he says, grinning through a bruise.',
       '\u201cCome back next Dayoff if you want another go.\u201d'],
    ];
    dialogue.open = true;
    dialogue.page = 0;
    return;
  }
  dialogue.pages = [
    ['\u201cYou look like you can handle yourself.\u201d',
     'He tilts his head. He is extremely large.',
     '\u201cPut up fifty gold. I\u2019ll match it. Winner takes all.\u201d'],
  ];
  dialogue.callbacks = [function() {
    choice.title   = 'Kolm';
    choice.options = ['Fight (50g stake)', 'Decline'];
    choice.cursor  = 0;
    choice.callbacks = [
      function accept() {
        if (stats.gold < 50) {
          dialogue.name  = 'Kolm';
          dialogue.pages = [
            ['\u201cFifty gold or nothing.\u201d',
             'He goes back to his drink.',
             '\u201cCome back when you have it.\u201d'],
          ];
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
        stats.gold -= 50;
        dialogue.name  = 'Kolm';
        dialogue.pages = [
          ['He rolls his neck and pushes back from the table.',
           '\u201cRight then.\u201d',
           'The other sailors clear some space without being asked.'],
        ];
        dialogue.triggerEncounter = { id: 'kolm_brawler' };
        dialogue.open = true;
        dialogue.page = 0;
      },
      function decline() {
        dialogue.name  = 'Kolm';
        dialogue.pages = [
          ['\u201cSmart.\u201d',
           'He turns back to his drink.',
           '\u201cOffer stands.\u201d'],
        ];
        dialogue.open = true;
        dialogue.page = 0;
      },
    ];
    choice.open = true;
  }];
  dialogue.open = true;
  dialogue.page = 0;
};

const TALK_RADIUS = 28; // px; must be within this to open dialogue (~0.9 tiles)

// ─── Merchant ─────────────────────────────────────────────────────────────────
const MERCHANT = { x: 9.5 * TILE, y: 7.5 * TILE }; // col 9, row 7 in TOWN_MAP

// ─── Travelling Salesman ───────────────────────────────────────────────────────
// Present 1-in-3 town visits (decided in enterTown). col 5, row 7 in TOWN_MAP.
const TRAVELLER = { x: 5.5 * TILE, y: 7.5 * TILE };

// ─── Job Board ────────────────────────────────────────────────────────────────
// Populate JOB_BOARD_NOTICES with strings to add postings.
// Empty array = "The job board is empty."
const JOB_BOARD_NOTICES = [];

// Drenwick market notice board — separate array, populated by refreshJobBoard().
const DRENWICK_JOB_BOARD_NOTICES = [];
window.DRENWICK_JOB_BOARD_NOTICES = DRENWICK_JOB_BOARD_NOTICES;

const NOTICE_BOARD_X = 7.5 * TILE;  // col 7, row 7 in TOWN_MAP
const NOTICE_BOARD_Y = 7.5 * TILE;

const DRENWICK_MARKET_NOTICE_BOARD_X = 7.5 * TILE;  // col 7, row 6 in DRENWICK_MARKET_MAP
const DRENWICK_MARKET_NOTICE_BOARD_Y = 6.5 * TILE;

// ─── Guild Hall Posting Board ─────────────────────────────────────────────────
// Northeast corner of DRENWICK_GUILD_HALL_MAP, col 13 row 3.
const GUILD_HALL_BOARD = { x: 13.5 * TILE, y: 3.5 * TILE };

// ─── Wash House Basin ─────────────────────────────────────────────────────────
// Center-south of DRENWICK_WASH_HOUSE_MAP — the communal wash basins.
// Private bath stalls, walled off in the east corner of the wash house (see
// DRENWICK_WASH_HOUSE_MAP). Each is a tub tile the bather stands in, enclosed by
// INTERIOR_WALL partitions on three sides and open only to the west aisle.
const WASH_BASIN   = { x: 12.5 * TILE, y: 6.5 * TILE }; // bath stall A (col 12 row 6)
const WASH_BASIN_2 = { x: 12.5 * TILE, y: 8.5 * TILE }; // bath stall B (col 12 row 8)

// ─── Innkeeper ────────────────────────────────────────────────────────────────
const INNKEEPER = { x: 7.5 * TILE, y: 3.5 * TILE }; // col 7, row 3 in INN_MAP

// ─── Drenwick Innkeeper ───────────────────────────────────────────────────────
const DRENWICK_INNKEEPER = { x: 7.5 * TILE, y: 2.5 * TILE }; // col 7 row 2 in DRENWICK_INN_MAP
// Authoritative price of a night at the Drenwick inn (The Reed and Rope).
// interactDrenwickInn() uses this for the spoken price, the choice-menu label,
// the affordability check, and the gold deduction — one source of truth so they
// can't drift. Calwick's inn is separately a flat 20g (interactCalwickInn).
const DRENWICK_INN_PRICE = 30;

// ─── Supervisor ───────────────────────────────────────────────────────────────
// Seated behind the wider desk (cols 11–12, row 2) in the office interior.
const SUPERVISOR = { x: 12 * TILE, y: 2.5 * TILE };

// ─── Filing Cabinets ──────────────────────────────────────────────────────────
// Matches the drawn cabinet position: drawOfficeFurniture uses fx = col*TILE+4,
// fy = row*TILE+2, body 23×27 px — centre is approx ((col+0.5)*T, (row+0.5)*T).
const FILING_CABINET  = { x: 12.5 * TILE, y: 6.5 * TILE };
// Corvin's section — the cabinet by the north-wall window (col 4, row 2). This
// is where the Weight Discrepancy note is actually filed; FILING_CABINET and
// ESLA_CABINET both just redirect here during that step. Drawn identically to
// the others by drawOfficeFurniture().
const CORVIN_CABINET  = { x: 4.5 * TILE, y: 2.5 * TILE };

// ─── Esla (office NPC) ────────────────────────────────────────────────────────
// Second filing cabinet (lower-left area, col 3, row 9); Esla stands beside it.
const ESLA_CABINET = { x: 3.5 * TILE, y: 9.5 * TILE };
const ESLA         = { x: 4.5 * TILE, y: 9.5 * TILE };

// ─── Sluice Gate (interactable object, East Sluice) ──────────────────────────
// West gate alcove (cols 2–3, rows 4–6); interaction point at col 2, row 5.
const SLUICE_GATE      = { x: 2.5 * TILE, y: 5.5 * TILE };
const THORNMERE_STONE  = { x: 7.5 * TILE, y: 6.5 * TILE };  // MAP4 lake centre island (cols 7-8, rows 6-7) — inaccessible without boat

// ─── Dayoff NPC positions (inn, around RESERVED_TABLE at 8.5T, 7.5T) ─────────
const SUPERVISOR_DAYOFF = { x: 8.5 * TILE, y: 6.5 * TILE };  // above table
const ESLA_DAYOFF       = { x: 8.5 * TILE, y: 8.5 * TILE };  // below table
// Petra dayoff: 7.5T, 7.5T (left of table)  — defined via getter in SIMPLE_NPCS
// Corvin dayoff: 9.5T, 7.5T (right of table) — defined via getter in SIMPLE_NPCS

// ─── Inn Tables ───────────────────────────────────────────────────────────────
// Overlay objects drawn on top of floor tiles; solid via canWalk() checks.
// Positions derived from NPC facing ('down' → y + 1 tile) plus one reserved table.
const INN_TABLES = [
  { x:  3.5 * TILE, y:  7.5 * TILE },  // gault
  { x: 13.5 * TILE, y:  6.5 * TILE },  // vann
  { x: 10.5 * TILE, y: 10.5 * TILE },  // rhen
  { x:  2.5 * TILE, y: 11.5 * TILE },  // tern
  { x: 11.5 * TILE, y:  3.5 * TILE },  // cres
  { x:  5.5 * TILE, y: 11.5 * TILE },  // edda
  { x:  8.5 * TILE, y:  7.5 * TILE },  // reserved (see RESERVED_TABLE below)
];

// Separate handle for the reserved table so handleInteract can reference it.
const RESERVED_TABLE  = { x: 8.5 * TILE, y: 7.5 * TILE };

// ─── House Doors ──────────────────────────────────────────────────────────────
// Each entry maps a HOUSE_DOOR tile on a specific map to a unique house ID.
// map: value from currentMapId() ('town', 'west', 'east', etc.)
// col/row: tile coordinates of the door in that map.
// houseId: key into HOUSE_DATA and prefix for SIMPLE_NPCS map field ('house:west_a').
const HOUSE_DOORS = [
  { map: 'west', col:  2, row:  3, houseId: 'eldric_house'  },  // home A, bottom-left tile
  { map: 'west', col:  2, row:  7, houseId: 'esla_house'    },  // home D, bottom-left tile
  { map: 'west', col:  2, row: 11, houseId: 'player_house'  },  // home G, bottom-left tile
  // west_b <-> west_i door positions swapped so Oswin (west_b's resident,
  // home at all hours) lives directly across the street from the player's
  // front door — likely the first NPC a new player talks to. The wraith
  // house (west_i, "9 West Ward") moves to the far NE corner; nothing keys
  // on its exterior position (quest logic uses currentHouseId).
  { map: 'west', col: 10, row:  3, houseId: 'west_i'        },  // home B position, bottom-left tile
  { map: 'west', col:  6, row:  7, houseId: 'west_h'        },  // home H, bottom-left tile
  { map: 'west', col: 10, row:  7, houseId: 'west_e'        },  // home E, bottom-left tile
  { map: 'west', col: 10, row: 11, houseId: 'west_b'        },  // home I position (Oswin), bottom-left tile
  // Drenwick West Residential — north block houses (row 3, north E-W street)
  { map: 'drenwick_west_residential', col: 11, row:  3, houseId: 'drenwick_north_a' },
  { map: 'drenwick_west_residential', col: 13, row:  3, houseId: 'drenwick_north_b' },
  // Drenwick West Residential — mid block houses (row 7, mid E-W street)
  { map: 'drenwick_west_residential', col:  3, row:  7, houseId: 'drenwick_west_a' },  // west house south face
  { map: 'drenwick_west_residential', col: 11, row:  7, houseId: 'drenwick_west_b' },  // east house south face
  // Drenwick West Residential — south block houses (row 11, south E-W street)
  { map: 'drenwick_west_residential', col:  3, row: 11, houseId: 'drenwick_south_a' },
  { map: 'drenwick_west_residential', col: 11, row: 11, houseId: 'drenwick_south_b' },
  { map: 'drenwick_west_residential', col: 13, row: 11, houseId: 'drenwick_south_c' },
  // Drenwick East Outskirts — Block A corridors (exterior APT_DOOR at col 2 & col 4, row 3)
  { map: 'drenwick_apt_a1', col:  3, row: 5, houseId: 'drenwick_apt_a1_u1' },
  { map: 'drenwick_apt_a1', col:  6, row: 5, houseId: 'drenwick_apt_a1_u2' },
  { map: 'drenwick_apt_a1', col:  9, row: 5, houseId: 'drenwick_apt_a1_u3' },
  { map: 'drenwick_apt_a1', col: 12, row: 5, houseId: 'drenwick_apt_a1_u4' },
  { map: 'drenwick_apt_a2', col:  3, row: 5, houseId: 'drenwick_apt_a2_u1' },
  { map: 'drenwick_apt_a2', col:  6, row: 5, houseId: 'drenwick_apt_a2_u2' },
  { map: 'drenwick_apt_a2', col:  9, row: 5, houseId: 'drenwick_apt_a2_u3' },
  { map: 'drenwick_apt_a2', col: 12, row: 5, houseId: 'drenwick_apt_a2_u4' },
  // Drenwick East Outskirts — Block B corridors (exterior APT_DOOR at col 2 & col 4, row 7)
  { map: 'drenwick_apt_b1', col:  3, row: 5, houseId: 'drenwick_apt_b1_u1' },
  { map: 'drenwick_apt_b1', col:  6, row: 5, houseId: 'drenwick_apt_b1_u2' },
  { map: 'drenwick_apt_b1', col:  9, row: 5, houseId: 'drenwick_apt_b1_u3' },
  { map: 'drenwick_apt_b1', col: 12, row: 5, houseId: 'drenwick_apt_b1_u4' },
  { map: 'drenwick_apt_b2', col:  3, row: 5, houseId: 'drenwick_apt_b2_u1' },
  { map: 'drenwick_apt_b2', col:  6, row: 5, houseId: 'drenwick_apt_b2_u2' },
  { map: 'drenwick_apt_b2', col:  9, row: 5, houseId: 'drenwick_apt_b2_u3' },
  { map: 'drenwick_apt_b2', col: 12, row: 5, houseId: 'drenwick_apt_b2_u4' },
  // Drenwick East Outskirts — Block C corridors (exterior APT_DOOR at col 2 & col 4, row 11)
  { map: 'drenwick_apt_c1', col:  3, row: 5, houseId: 'drenwick_apt_c1_u1' },
  { map: 'drenwick_apt_c1', col:  6, row: 5, houseId: 'drenwick_apt_c1_u2' },
  { map: 'drenwick_apt_c1', col:  9, row: 5, houseId: 'drenwick_apt_c1_u3' },
  { map: 'drenwick_apt_c1', col: 12, row: 5, houseId: 'drenwick_apt_c1_u4' },
  { map: 'drenwick_apt_c2', col:  3, row: 5, houseId: 'drenwick_apt_c2_u1' },
  { map: 'drenwick_apt_c2', col:  6, row: 5, houseId: 'drenwick_apt_c2_u2' },
  { map: 'drenwick_apt_c2', col:  9, row: 5, houseId: 'drenwick_apt_c2_u3' },
  { map: 'drenwick_apt_c2', col: 12, row: 5, houseId: 'drenwick_apt_c2_u4' },
  // Apartment corridor doors (apt_interior_door tiles in APARTMENT_CORRIDOR_MAP)
  { map: 'apt',  col:  3, row:  5, houseId: 'apt_1'         },
  { map: 'apt',  col:  6, row:  5, houseId: 'apt_2'         },
  { map: 'apt',  col:  9, row:  5, houseId: 'apt_3'         },
  { map: 'apt',  col: 12, row:  5, houseId: 'apt_4'         },
];

// ─── House Data ───────────────────────────────────────────────────────────────
// Per-house configuration keyed by houseId.
// NPCs for a house use map: 'house:<houseId>' in SIMPLE_NPCS.
// tables: overlay objects drawn by drawHouseFurniture(); positions are tile centres.
// bed shape: { x, y, canRest, inspect }
//   canRest  — true only for beds the player may use to rest (restores HP, advances day)
//   inspect  — short dialogue shown when canRest is false
const HOUSE_DATA = {
  eldric_house: {
    hearth: { x:  4.5 * TILE, y: 2.5 * TILE },
    bed:    { x: 10.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables: [{ x:  8.5 * TILE, y: 7.5 * TILE }],
    chair:  { x:  8.5 * TILE, y: 6.5 * TILE },
  },
  esla_house: {
    hearth: { x: 11.5 * TILE, y: 2.5 * TILE },
    bed:    { x:  5.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables: [{ x:  7.5 * TILE, y: 7.5 * TILE }],
    chair:  { x:  8.5 * TILE, y: 7.5 * TILE },
  },
  player_house: {
    hearth:     { x:  4.5 * TILE, y: 2.5 * TILE },
    bed:        { x: 10.5 * TILE, y: 3.5 * TILE, canRest: true },
    cat:        { x:  5.5 * TILE, y: 7.5 * TILE },
    tables:     [{ x:  8.5 * TILE, y: 6.5 * TILE }],
    chair:      { x:  7.5 * TILE, y: 6.5 * TILE },
    chest:      { x: 11.5 * TILE, y: 7.5 * TILE, gold: 91 },  // life savings — bank chest
    northWindow: { x:  7.5 * TILE, y: 2.5 * TILE },  // north wall — the morning light the intro describes
  },
  west_b: {
    hearth: { x: 11.5 * TILE, y: 2.5 * TILE },
    bed:    { x:  5.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables: [{ x:  7.5 * TILE, y: 6.5 * TILE }],
    chair:  { x:  7.5 * TILE, y: 7.5 * TILE },
  },
  west_h: {
    hearth: { x:  4.5 * TILE, y: 2.5 * TILE },
    bed:    { x: 10.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables: [{ x:  6.5 * TILE, y: 6.5 * TILE }],
    chair:  { x:  6.5 * TILE, y: 7.5 * TILE },
  },
  west_e: {
    hearth: { x: 11.5 * TILE, y: 2.5 * TILE },
    bed:    { x:  5.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables: [{ x:  9.5 * TILE, y: 6.5 * TILE }],
    chair:  { x:  9.5 * TILE, y: 7.5 * TILE },
  },
  west_i: {
    hearth: { x:  4.5 * TILE, y: 2.5 * TILE },
    bed:    { x: 10.5 * TILE, y: 4.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables: [{ x:  6.5 * TILE, y: 7.5 * TILE }],
    chair:  { x:  7.5 * TILE, y: 7.5 * TILE },
  },
  // Drenwick West Residential — nicer houses, slightly more space implied than Calwick working-class homes
  drenwick_west_a: {
    hearth:    { x: 11.5 * TILE, y: 2.5 * TILE },  // east wall, north corner
    bed:       { x:  5.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables:    [{ x:  8.5 * TILE, y: 6.5 * TILE }],
    chair:     { x:  7.5 * TILE, y: 6.5 * TILE },
    window:    { x:  7.5 * TILE, y: 2.5 * TILE },   // north wall centre — Dessa can see the fen road south
    bookshelf: { x:  4.5 * TILE, y: 5.5 * TILE },   // west wall — research materials, registry volumes
    rug:       { x:  8.5 * TILE, y: 7.5 * TILE },   // beneath the table
  },
  drenwick_west_b: {
    hearth:    { x:  4.5 * TILE, y: 2.5 * TILE },   // west wall, north corner
    bed:       { x: 10.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables:    [{ x:  7.5 * TILE, y: 7.5 * TILE }],
    chair:     { x:  8.5 * TILE, y: 7.5 * TILE },
    window:    { x:  8.5 * TILE, y: 2.5 * TILE },   // north wall, right of centre (hearth is left)
    bookshelf: { x: 11.5 * TILE, y: 5.5 * TILE },   // east wall, south of bed
    rug:       { x:  7.5 * TILE, y: 6.5 * TILE },   // centre of room, between hearth and table
  },
  // Drenwick West Residential — north block (row 3), side-by-side pair at cols 11 & 13
  drenwick_north_a: {
    hearth:    { x:  4.5 * TILE, y: 2.5 * TILE },
    bed:       { x: 10.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables:    [{ x:  7.5 * TILE, y: 6.5 * TILE }],
    chair:     { x:  8.5 * TILE, y: 6.5 * TILE },
    window:    { x:  8.5 * TILE, y: 2.5 * TILE },
    bookshelf: { x: 11.5 * TILE, y: 5.5 * TILE },
    rug:       { x:  7.5 * TILE, y: 7.5 * TILE },
  },
  drenwick_north_b: {
    hearth:    { x: 11.5 * TILE, y: 2.5 * TILE },
    bed:       { x:  5.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables:    [{ x:  8.5 * TILE, y: 7.5 * TILE }],
    chair:     { x:  7.5 * TILE, y: 7.5 * TILE },
    window:    { x:  7.5 * TILE, y: 2.5 * TILE },
    bookshelf: { x:  4.5 * TILE, y: 5.5 * TILE },
    rug:       { x:  8.5 * TILE, y: 6.5 * TILE },
  },
  // Drenwick West Residential — south block (row 11)
  drenwick_south_a: {
    hearth:    { x: 11.5 * TILE, y: 2.5 * TILE },
    bed:       { x:  5.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables:    [{ x:  8.5 * TILE, y: 6.5 * TILE }],
    chair:     { x:  8.5 * TILE, y: 7.5 * TILE },
    window:    { x:  7.5 * TILE, y: 2.5 * TILE },
    bookshelf: { x:  4.5 * TILE, y: 5.5 * TILE },
    rug:       { x:  8.5 * TILE, y: 7.5 * TILE },
  },
  drenwick_south_b: {
    hearth:    { x:  4.5 * TILE, y: 2.5 * TILE },
    bed:       { x: 10.5 * TILE, y: 3.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables:    [{ x:  7.5 * TILE, y: 7.5 * TILE }],
    chair:     { x:  6.5 * TILE, y: 7.5 * TILE },
    window:    { x:  8.5 * TILE, y: 2.5 * TILE },
    bookshelf: { x: 11.5 * TILE, y: 5.5 * TILE },
    rug:       { x:  7.5 * TILE, y: 6.5 * TILE },
  },
  drenwick_south_c: {
    hearth:    { x: 11.5 * TILE, y: 2.5 * TILE },
    bed:       { x:  5.5 * TILE, y: 4.5 * TILE, canRest: false, inspect: 'Not your bed.' },
    tables:    [{ x:  9.5 * TILE, y: 7.5 * TILE }],
    chair:     { x:  8.5 * TILE, y: 7.5 * TILE },
    window:    { x:  7.5 * TILE, y: 2.5 * TILE },
    bookshelf: { x:  4.5 * TILE, y: 5.5 * TILE },
    rug:       { x:  9.5 * TILE, y: 7.5 * TILE },
  },
  // ── Drenwick East Apartments — Corridor A1 ─────────────────────────────────
  // u1: Maret (canal lock tender), u2: Clodagh (reed cutter),
  // u3: vacant, u4: Yssa (district records clerk)
  drenwick_apt_a1_u1: {
    bed:    { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A heavy wool blanket, still damp at one corner. Smells of the canal.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 7.5 * TILE, y: 7.5 * TILE }],
  },
  drenwick_apt_a1_u2: {
    bed:    { x: 5.5 * TILE, y: 8.5 * TILE, canRest: false, inspect: 'Thin mattress, reeds poking through the seam.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 6.5 * TILE, y: 7.5 * TILE }],
    chair:  { x: 7.5 * TILE, y: 7.5 * TILE },
  },
  drenwick_apt_a1_u3: {
    bed:    { x: 9.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A narrow bed, neatly made. A worn jacket folded at the foot.' },
    stove:  { x: 5.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 6.5 * TILE, y: 7.5 * TILE }],
    chair:  { x: 7.5 * TILE, y: 7.5 * TILE },
  },
  drenwick_apt_a1_u4: {
    bed:    { x: 9.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Neatly made. A folded document rests on the pillow \u2014 some kind of form.' },
    stove:  { x: 5.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 7.5 * TILE, y: 6.5 * TILE }],
    chair:  { x: 8.5 * TILE, y: 6.5 * TILE },
  },
  // ── Drenwick East Apartments — Corridor A2 ─────────────────────────────────
  // u1: Fenwick (ret. Halcyra administrator), u2: Nessa (fish-smoker),
  // u3: Tombers (river wrestling aspirant), u4: Orla (widow, building elder)
  drenwick_apt_a2_u1: {
    bed:    { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Old but well-kept. A folded Halcyra Province seal rests beside it \u2014 framed, faded.' },
    stove:  { x: 9.5 * TILE, y: 8.5 * TILE },
    tables: [{ x: 8.5 * TILE, y: 6.5 * TILE }],
    chair:  { x: 7.5 * TILE, y: 6.5 * TILE },
  },
  drenwick_apt_a2_u2: {
    bed:    { x: 9.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A solid bed. The room smells deeply, persistently of smoked fish.' },
    stove:  { x: 5.5 * TILE, y: 5.5 * TILE },
    chair:  { x: 6.5 * TILE, y: 7.5 * TILE },
  },
  drenwick_apt_a2_u3: {
    bed:    { x: 5.5 * TILE, y: 8.5 * TILE, canRest: false, inspect: 'Rumpled. A damp towel hangs from the headboard. River wrestling training, presumably.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
  },
  drenwick_apt_a2_u4: {
    bed:    { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A carefully arranged bed with an embroidered pillow cover \u2014 the only decoration in the room.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 7.5 * TILE, y: 7.5 * TILE }],
    chair:  { x: 8.5 * TILE, y: 7.5 * TILE },
  },
  // ── Drenwick East Apartments — Corridor B1 ─────────────────────────────────
  // u1: Hazel (private tutor), u2: Druck (dredger, wrestling gambler),
  // u3: Maeve (young mother, drought/money worries), u4: Corra (market broker)
  drenwick_apt_b1_u1: {
    bed:    { x: 9.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A writing slope rests on the corner of the bed. Ink stains on the blanket.' },
    stove:  { x: 5.5 * TILE, y: 8.5 * TILE },
    tables: [{ x: 7.5 * TILE, y: 6.5 * TILE }],
    chair:  { x: 6.5 * TILE, y: 6.5 * TILE },
  },
  drenwick_apt_b1_u2: {
    bed:    { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A betting slip folded inside the pillow cover. Someone\u2019s optimistic.' },
    stove:  { x: 9.5 * TILE, y: 8.5 * TILE },
  },
  drenwick_apt_b1_u3: {
    bed:    { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Two pillows. A child\u2019s blanket at the foot \u2014 something woven into it glows faintly, then stops.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 6.5 * TILE, y: 7.5 * TILE }],
    chair:  { x: 7.5 * TILE, y: 7.5 * TILE },
  },
  drenwick_apt_b1_u4: {
    bed:    { x: 9.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Sharp and functional. A ledger shoved under the mattress edge.' },
    stove:  { x: 5.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 8.5 * TILE, y: 7.5 * TILE }],
    chair:  { x: 7.5 * TILE, y: 7.5 * TILE },
  },
  // ── Drenwick East Apartments — Corridor B2 ─────────────────────────────────
  // u1: Sael (mushroom wine philosopher), u2: Pip (district messenger),
  // u3: Sera (relocated here from the civic square; waiting for a visitor),
  // u4: Aldren (elderly, remembers Millennial Accord)
  drenwick_apt_b2_u1: {
    bed:    { x: 5.5 * TILE, y: 8.5 * TILE, canRest: false, inspect: 'Unmade. A mushroom wine bottle on its side at the foot, empty.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
  },
  drenwick_apt_b2_u2: {
    bed:    { x: 9.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Barely slept in. Messengers keep odd hours.' },
    stove:  { x: 5.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 7.5 * TILE, y: 7.5 * TILE }],
    chair:  { x: 8.5 * TILE, y: 7.5 * TILE },
  },
  drenwick_apt_b2_u3: {
    bed:    { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Plainly made up, and recently. Whoever moved in has not brought much with them yet.' },
    stove:  { x: 9.5 * TILE, y: 8.5 * TILE },
  },
  drenwick_apt_b2_u4: {
    bed:    { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Old, solid, well-worn. A notch carved in the headboard for each year in the building \u2014 you count over forty.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 7.5 * TILE, y: 7.5 * TILE }],
    chair:  { x: 8.5 * TILE, y: 7.5 * TILE },
  },
  // ── Drenwick East Apartments — Corridor C1 ─────────────────────────────────
  // u1: Bren (failed engineering apprentice), u2: Sova (reluctant Halcyra transfer),
  // u3: Holt (former river wrestling champion), u4: abandoned (moved-out; searchable)
  drenwick_apt_c1_u1: {
    bed:    { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Folded exam papers tucked under the mattress. Fail marks in red.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
    chair:  { x: 7.5 * TILE, y: 7.5 * TILE },
  },
  drenwick_apt_c1_u2: {
    bed:    { x: 9.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Made with military precision. A dried flower arrangement in a tin cup \u2014 clearly from somewhere that has flowers.' },
    stove:  { x: 5.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 7.5 * TILE, y: 7.5 * TILE }],
    chair:  { x: 6.5 * TILE, y: 7.5 * TILE },
  },
  drenwick_apt_c1_u3: {
    bed:    { x: 5.5 * TILE, y: 8.5 * TILE, canRest: false, inspect: 'Wide and sagging from years of use. The sheets are faded river-grey.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
  },
  // Abandoned unit — the tenant moved out and little was left behind: a stripped
  // cot, a cold stove, a dresser still worth searching, and a glint on the boards
  // (the Old Fishing Rod). looted/taken are one-shot flags, persisted in save.js.
  drenwick_apt_c1_u4: {
    bed:     { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A stripped cot — no bedding left. A pale rectangle on the wall above it, where a picture used to hang.' },
    stove:   { x: 9.5 * TILE, y: 8.5 * TILE },
    dresser: { x: 9.5 * TILE, y: 5.5 * TILE, looted: false },
    sparkle: { x: 6.5 * TILE, y: 7.5 * TILE, taken: false },
  },
  // ── Drenwick East Apartments — Corridor C2 ─────────────────────────────────
  // u1: Desca (letter-writer), u2: Tern (boy, refused Imperial school),
  // u3: Mulla (claims rareborn ancestry), u4: Josse (canal maintenance, cheerful)
  drenwick_apt_c2_u1: {
    bed:    { x: 9.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'Neatly made. Several sheets of paper stacked on the corner, half-covered in a neat hand.' },
    stove:  { x: 5.5 * TILE, y: 8.5 * TILE },
    tables: [{ x: 7.5 * TILE, y: 6.5 * TILE }],
    chair:  { x: 6.5 * TILE, y: 6.5 * TILE },
  },
  drenwick_apt_c2_u2: {
    bed:    { x: 5.5 * TILE, y: 8.5 * TILE, canRest: false, inspect: 'Unmade, chaotic. A fishing rod leans against the wall, and a half-eaten piece of bread sits on the floor.' },
    stove:  { x: 9.5 * TILE, y: 5.5 * TILE },
  },
  drenwick_apt_c2_u3: {
    bed:    { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A worn blanket with a geometric pattern \u2014 very old, very faded. Could be anything. Could be nothing.' },
    stove:  { x: 9.5 * TILE, y: 8.5 * TILE },
    tables: [{ x: 7.5 * TILE, y: 7.5 * TILE }],
  },
  drenwick_apt_c2_u4: {
    bed:    { x: 9.5 * TILE, y: 8.5 * TILE, canRest: false, inspect: 'Big, comfortable, cheerfully unmade. A pair of muddy boots beside it.' },
    stove:  { x: 5.5 * TILE, y: 5.5 * TILE },
    tables: [{ x: 6.5 * TILE, y: 7.5 * TILE }],
    chair:  { x: 7.5 * TILE, y: 7.5 * TILE },
  },
  apt_1:        { bed: { x: 5.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A neatly made bed.' }, stove: { x: 9.5 * TILE, y: 5.5 * TILE } },
  apt_2:        { bed: { x: 7.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A neatly made bed.' }, tables: [{ x: 6.5 * TILE, y: 7.5 * TILE }], stove: { x: 9.5 * TILE, y: 5.5 * TILE } },
  apt_3:        { bed: { x: 5.5 * TILE, y: 7.5 * TILE, canRest: false, inspect: 'A neatly made bed.' }, stove: { x: 9.5 * TILE, y: 5.5 * TILE } },
  apt_4:        { bed: { x: 6.5 * TILE, y: 5.5 * TILE, canRest: false, inspect: 'A neatly made bed.' }, stove: { x: 9.5 * TILE, y: 5.5 * TILE } },

  // ── Fen brewery (MAP3_N1 row 4 col 13) ─────────────────────────────────────
  // Left half = living quarters, right half = brewery. Exit col 3 row 13.
  fen_brewery: {
    hearth: { x: 1.5 * TILE, y: 1.5 * TILE },
    bed:    { x: 4.5 * TILE, y: 1.5 * TILE, canRest: false, inspect: 'A straw pallet shared by the whole family. It smells of damp and mushroom must.' },
    tables: [{ x: 2.5 * TILE, y: 9.5 * TILE }],  // living-side table
    chair:  { x: 1.5 * TILE, y: 9.5 * TILE },
  },
};

// ─── NPC registry ─────────────────────────────────────────────────────────────
// Additive/reference-only: gameplay code has not yet been migrated to use this.
// SIMPLE_NPCS keyed by id, plus named NPC position objects.
// Excludes props/furniture (FILING_CABINET, ESLA_CABINET, SLUICE_GATE, tables, etc.).
const NPC_REGISTRY = (() => {
  const registry = {};
  // Index every SIMPLE_NPC by its id
  for (const npc of SIMPLE_NPCS) {
    if (npc.id) registry[npc.id] = npc;
  }
  // Named custom NPCs (position-only objects without an id in SIMPLE_NPCS)
  registry['merchant']            = MERCHANT;
  registry['traveller']           = TRAVELLER;
  registry['innkeeper']           = INNKEEPER;
  registry['drenwick_innkeeper']  = DRENWICK_INNKEEPER;
  registry['supervisor']          = SUPERVISOR;
  registry['esla']                = ESLA;
  return registry;
})();

window.NPC_REGISTRY = NPC_REGISTRY;

// ─── Expose to global scope ─────────────────────────────────────────────────────────────────────
window.SIMPLE_NPCS        = SIMPLE_NPCS;
window.NPC_ACTIONS        = NPC_ACTIONS;
window.TALK_RADIUS        = TALK_RADIUS;
window.MERCHANT           = MERCHANT;
window.TRAVELLER          = TRAVELLER;
window.JOB_BOARD_NOTICES  = JOB_BOARD_NOTICES;
window.NOTICE_BOARD_X     = NOTICE_BOARD_X;
window.NOTICE_BOARD_Y     = NOTICE_BOARD_Y;
window.DRENWICK_MARKET_NOTICE_BOARD_X = DRENWICK_MARKET_NOTICE_BOARD_X;
window.DRENWICK_MARKET_NOTICE_BOARD_Y = DRENWICK_MARKET_NOTICE_BOARD_Y;
window.GUILD_HALL_BOARD   = GUILD_HALL_BOARD;
window.WASH_BASIN         = WASH_BASIN;
window.WASH_BASIN_2       = WASH_BASIN_2;
window.INNKEEPER          = INNKEEPER;
window.DRENWICK_INNKEEPER = DRENWICK_INNKEEPER;
window.DRENWICK_INN_PRICE = DRENWICK_INN_PRICE;
window.SUPERVISOR         = SUPERVISOR;
window.FILING_CABINET     = FILING_CABINET;
window.CORVIN_CABINET     = CORVIN_CABINET;
window.ESLA_CABINET       = ESLA_CABINET;
window.ESLA               = ESLA;
window.SLUICE_GATE        = SLUICE_GATE;
window.THORNMERE_STONE    = THORNMERE_STONE;
window.SUPERVISOR_DAYOFF  = SUPERVISOR_DAYOFF;
window.ESLA_DAYOFF        = ESLA_DAYOFF;
window.INN_TABLES         = INN_TABLES;
window.RESERVED_TABLE     = RESERVED_TABLE;
window.HOUSE_DOORS        = HOUSE_DOORS;
window.HOUSE_DATA         = HOUSE_DATA;
