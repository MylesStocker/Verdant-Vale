'use strict';

// ─── Simple NPC data ──────────────────────────────────────────────────────────
// Pure dialogue NPCs driven entirely from this array.
// Custom-interaction NPCs (innkeeper, boss, chest, notice board) stay as code.
const SIMPLE_NPCS = [
  {
    id:            'maren',
    name:          'Maren',
    map:           'maren_post',
    x:              7.5 * TILE,
    y:              4.5 * TILE,
    solid:         true,
    facing:        'down',
    get dialogue() {
      const pages = [
        ['\u201cThe aetherrail stops three towns', 'east of here.\u201d'],
        ['\u201cIt will never come out this far.\u201d'],
      ];
      // Keys on what was FILED (fort_report_filed), never on an unreported
      // kill -- same convention as the rest-week inn reactions.
      if (fort_report_filed) pages.push(
        ['\u201cWord came down the post line about the fen business.\u201d',
         '\u201cYou did the part that goes in a report. That\u2019s the part that counts out here.\u201d']
      );
      if (reservoir_quest_started) pages.push(
        ['\u201cThey\u2019ve given you the basin road, then.\u201d',
         '\u201cPast Marker 4 nobody maintains anything. Including the maps.\u201d'],
        ['\u201cWalk it in daylight.\u201d', '\u201cThat\u2019s not a regulation. It\u2019s advice.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  // ── Imperial Bridge Toll Gate (MAP3_N2, bridge_post interior) ────────────────────
  // Phase 1 NPC-movement pilots (the ONLY two NPCs with a `movement` config).
  // Each stands on his bank's one-tile bridge approach (the canal blocks every
  // other column), physically blocking the crossing.
  // Paying EITHER guard authorizes the whole crossing: the payment dialogue's
  // callback sets bridge_toll_paid and starts BOTH guards' scriptedRoutes, so
  // each sidesteps off the approach (north: right to col 8; south: left to
  // col 6) and the player crosses manually. No auto-exit is called — the
  // BRIDGE_EXIT payment-direction check (movement.js) remains only as a
  // defensive fallback against corrupted state. Waypoints are TILE units
  // (architecture.md movement contract); see bridgeTollInteraction() below
  // NPC_ACTIONS for the shared toll logic.
  // South bank soldier (col 7 row 7) — faces up, tolls northbound travellers
  {
    id:            'bridge_soldier_south',
    name:          'Imperial Soldier',
    map:           'bridge_post',
    x:              7.5 * TILE,
    y:              7.5 * TILE,
    solid:         true,
    facing:        'up',
    dialogue:      [], // unused — action handles interaction
    flag_required: null,
    flag_sets:     null,
    movement: { type: 'scriptedRoute', waypoints: [{ x: 6.5, y: 7.5 }], speed: 0.5, pauseFrames: 0, loop: false },
    action: function() { bridgeTollInteraction('\u201cProceed north.\u201d'); },
  },
  // North bank soldier (col 7 row 4) — faces down, tolls southbound travellers
  {
    id:            'bridge_soldier_north',
    name:          'Imperial Soldier',
    map:           'bridge_post',
    x:              7.5 * TILE,
    y:              4.5 * TILE,
    solid:         true,
    facing:        'down',
    dialogue:      [], // unused — action handles interaction
    flag_required: null,
    flag_sets:     null,
    movement: { type: 'scriptedRoute', waypoints: [{ x: 8.5, y: 4.5 }], speed: 0.5, pauseFrames: 0, loop: false },
    action: function() { bridgeTollInteraction('\u201cProceed south.\u201d'); },
  },
  {
    id:            'wen',
    name:          'Wen',
    get map()      { return BOSS.defeated ? null : 'dungeon1'; },
    x:              3.5 * TILE,
    y:              7.5 * TILE,
    solid:         true,
    facing:        'down',
    get dialogue() {
      if (BOSS.defeated) return [];
      return [
        ['\u201cThree days now. Came for the garrison cache.', 'Found more than old grain down here.\u201d'],
        ['\u201cThing in the lower vault went quiet yesterday.', 'Might be clear now.  Might just be waiting.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'aldric',
    name:          'Aldric',
    map:           'office',
    x:              3.5 * TILE,
    y:              3.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'clerk',
    get dialogue() {
      const pages = [
        ['\u201cThe creatures carry gold. Sorted. Minted.', 'No record of where it comes from.\u201d'],
        ['\u201cI have filed three reports on the matter.', 'None has been acknowledged.\u201d'],
      ];
      if (weight_quest_stage >= 4) pages.push(
        ['\u201cRenn\u2019s discrepancy is closed.\u201d',
         '\u201cI received the reconciled note this morning.',
         'Corvin filed a correction on his end as well.\u201d'],
        ['\u201cIt\u2019s a small thing.\u201d',
         '\u201cBut it\u2019s been open for two months. Clean finish.\u201d']
      );
      if (dispatch_delivered) pages.push(
        ['\u201cHarrow\u2019s office acknowledged the Calwick dispatch.\u201d',
         '\u201cI saw it in the regional cross-filing. Same-day receipt.\u201d'],
        ['\u201cYour supervisor will see the confirmation.\u201d',
         '\u201cThat\u2019s faster than most.\u201d']
      );
      // Basin assignment: the office's longest-serving hand, on his trade and
      // where his exactness comes from.
      if (reservoir_quest_started) pages.push(
        ['\u201cTwenty-two years I\u2019ve kept this office\u2019s stores and its archive.',
         'Four supervisors have sat that desk. I\u2019ve outlasted every one, and never once wanted it.\u201d'],
        ['\u201cMy father ran the equipment stores at a road post. He taught me a wrong inventory kills as sure as a wrong blade.\u201d',
         '\u201cYou\u2019re going up to the basin. Check your kit before you do. That isn\u2019t clerk\u2019s fuss \u2014 it\u2019s the one thing I\u2019m certain of.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'petra',
    name:          'Petra',
    get map()      { return day % 5 === 0 ? 'inn' : 'office'; },
    get x()        { return day % 5 === 0 ? 7.5 * TILE : 6.5 * TILE; },
    get y()        { return day % 5 === 0 ? 7.5 * TILE : 3.5 * TILE; },
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    get dialogue() {
      // Rest-week Dayoff (after the fen post close-out, before the reservoir
      // assignment): the office is at the inn and the Polwick matter is the
      // thing nobody is officially talking about. Petra only knows what went
      // through her register, so her lines key on the honest report.
      if (day % 5 === 0 && mq4_available_day > 0 && !reservoir_quest_started && fort_report_filed) {
        return smugglers_dead
          ? [['\u201cI processed your ticket this week. Two hundred gold.\u201d',
              '\u201cBiggest single entry of the season. I keep thinking about which column it belongs in.\u201d'],
             ['\u201cThat\u2019s not a complaint about you.\u201d',
              '\u201cThe register doesn\u2019t have a column for what that entry was for. That\u2019s all.\u201d']]
          : [['\u201cThe fen post ticket cleared my register this week.\u201d',
              '\u201cThe rest of it went up to district. Polwick with it.\u201d'],
             ['\u201cI balance what reaches my desk.\u201d',
              '\u201cI\u2019m glad the rest doesn\u2019t.\u201d']];
      }
      const pages = day % 5 === 0
        ? [['\u201cI told myself I wouldn\u2019t think about the ledger.\u201d',
            '\u201cI thought about the ledger.\u201d']]
        : [['\u201cToday I am updating the ledger.', 'Yesterday I was also updating the ledger.\u201d']];
      pages.unshift(['\u201cMorning, ' + stats.name + '.\u201d', '\u201cMind the wet ink.\u201d']);
      if (sluice_reward_given && dispatch_rewarded && MainQuest >= 3) pages.push(
        ['\u201cYou\u2019ve been bringing in a lot of pay tickets.\u201d',
         '\u201cNot complaining.',
         'It keeps the register interesting.\u201d'],
        ['\u201cThree in one season.\u201d',
         '\u201cThat\u2019s more than most post an entire year.\u201d']
      );
      // Once she trusts you a little, why a market-stall girl chose a ledger.
      if (MainQuest >= 2) pages.push(
        ['\u201cMy people kept a market stall. Preserved fish, grain, whatever kept.',
         'I was counting coin before I could read a word of it.\u201d'],
        ['\u201cThe Empire pays the same whether the fish run or not. Whether it floods, whether it doesn\u2019t.',
         'That steadiness is the whole reason I\u2019m on this side of a counter and not behind a stall.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'corvin',
    name:          'Corvin',
    get map()      { return day % 5 === 0 ? 'inn' : 'office'; },
    get x()        { return day % 5 === 0 ? 9.5 * TILE : 9.5 * TILE; },
    get y()        { return day % 5 === 0 ? 7.5 * TILE : 3.5 * TILE; },
    solid:         true,
    facing:        'down',
    spriteType:    'worker',
    get dialogue() {
      // Rest-week Dayoff override, same gate as Petra's above. Corvin heard
      // it the way clerks hear everything \u2014 secondhand, and keyed on the
      // filed report rather than the truth.
      if (day % 5 === 0 && mq4_available_day > 0 && !reservoir_quest_started && fort_report_filed) {
        return smugglers_dead
          ? [['\u201cWord gets around an office fast. Word gets around an inn faster.\u201d',
              '\u201cThe fen post. Three entries, closed in one week.\u201d'],
             ['\u201cI reconcile ledgers. When a number\u2019s wrong, I fix the number.\u201d',
              '\u201cNo idea what you do when it isn\u2019t a number.\u201d',
              'He lifts his cup slightly.',
              '\u201cThis, I suppose.\u201d']]
          : [['\u201cI heard the fen post matter went up to district.\u201d',
              '\u201cAn inquiry means forms. Forms mean somebody has to countersign.\u201d'],
             ['\u201cI\u2019m very glad it isn\u2019t me.\u201d']];
      }
      const pages = day % 5 === 0
        ? [['\u201cYou know what I\u2019m not thinking about today?', 'The form.\u201d'],
           ['\u201cI\u2019m thinking about it anyway.\u201d']]
        : [['\u201cThe form requires a countersignature.', 'The countersignatory requires the form.\u201d']];
      if (weight_quest_stage >= 4) pages.push(
        ['\u201cThe batch is closed.\u201d',
         '\u201cThree-month variance. I\u2019ve been staring at that entry every week.\u201d'],
        ['\u201cI put it in the addendum: Copy error, corrected.',
         'Aldric countersigned.\u201d',
         '\u201cDone.\u201d']
      );
      // Basin assignment: the docks man on why he gets the number right.
      if (reservoir_quest_started) pages.push(
        ['\u201cI loaded barges before I ever sat an examination. Canal family, out past Drenwick.\u201d',
         'He says it without apology, the way he says everything.'],
        ['\u201cA record\u2019s the only proof a canal man has that a thing happened at all.',
         'That\u2019s why I get the number right. It\u2019s somebody\u2019s word, after everyone\u2019s stopped listening to them.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  // ── Inn patrons ────────────────────────────────────────────────────────────
  {
    id:            'gault',
    name:          'Gault',
    map:           'inn',
    x:              3.5 * TILE,
    y:              6.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'worker',
    get dialogue() {
      const pages = [
        ['\u201cCut my quota again this week.', 'They say yields are down. They always say that.\u201d'],
        ['\u201cThree years on the cut and I still can\u2019t get my hands properly dry.', 'Foreman says it passes.\u201d'],
      ];
      if (dispatch_rewarded) pages.push(
        ['\u201cWord gets around when someone makes the Drenwick run.\u201d',
         '\u201cFour hours on the road there, four back, plus whatever you had to do when you got there.',
         'That\u2019s not nothing.\u201d'],
        ['\u201cThey should log it properly.\u201d', '\u201cThey usually don\u2019t.\u201d']
      );
      if (warden_quest_rewarded) pages.push(
        ['\u201cHeard they cleared that warden from the dungeon passage east of town.\u201d',
         '\u201cOne of the infrastructure men was in here talking about getting back in.\u201d'],
        ['\u201cI always give those passages a wide berth myself.\u201d', '\u201cWarden or no warden.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'vann',
    name:          'Vann',
    map:           'inn',
    x:             13.5 * TILE,
    y:              5.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    get dialogue() {
      const pages = [
        ['\u201cEast channel\u2019s running shallow.', 'Don\u2019t know if it\u2019s the sluice or something further in.\u201d'],
        ['\u201cUsed to get twice the catch this time of year.', 'Reeds have shifted. Changes the run.\u201d'],
        ['\u201cWater\u2019s lower than I\u2019ve ever worked it. You can see old stonework off the east bank now \u2014 walls, a doorway.\u201d',
         '\u201cSome say there were whole towns out here before the Empire. Whoever they were, the water had them long before we did.\u201d'],
      ];
      pages.unshift(['\u201c' + stats.name + '. Sit \u2014 you\u2019re in my light.\u201d']);
      if (sluice_reward_given) pages.push(
        ['\u201cEast channel\u2019s running better these days.\u201d',
         '\u201cFlow\u2019s more consistent. You notice it in the catch \u2014 more even across the week than it was in spring.\u201d'],
        ['\u201cSomebody cleared the sluice. You notice it more than you\u2019d expect from one blockage.\u201d']
      );
      if (sentry_quest_done) pages.push(
        ['\u201cHeard the pale thing on the fen road\u2019s been dealt with.\u201d',
         '\u201cI didn\u2019t see it myself. But I know people who take that road. They were going around it.\u201d',
         '\u201cNot anymore, apparently.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'rhen',
    name:          'Rhen',
    map:           'inn',
    x:             10.5 * TILE,
    y:              9.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'traveler',
    get dialogue() {
      const pages = [
        ['\u201cCame through expecting something larger.', 'The maps are generous to Calwick.\u201d'],
        ['\u201cMet three people who work in the same office.', 'They didn\u2019t seem to know each other.\u201d'],
      ];
      // Visible evidence, not omniscience -- and evidence on your boots,
      // not a fact he somehow always knows: only while it's still there.
      // window.upper_reach_visit_day is a same-day marker (movement.js),
      // not the permanent upper_reach_seen discovery flag -- it expires the
      // moment `day` advances (any rest) and never survives a load (see
      // save.js's loadGame()), so this can't fire forever once true.
      if (window.upper_reach_visit_day === day) pages.push(
        ['He glances down, then back up.',
         '\u201cThat pale mud on your boots. I\u2019ve only seen that colour once, from a coach window, north of the reservoir.\u201d'],
        ['\u201cThe driver wouldn\u2019t stop there.\u201d', '\u201cHe didn\u2019t give a reason, and nobody asked twice.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'tern',
    name:          'Tern',
    map:           'inn',
    x:              2.5 * TILE,
    y:             10.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    // Kept as a plain (assignable) dialogue array, not a getter \u2014 test 24's
    // dialogue-overflow check swaps this in and out. Was pure filler ("No
    // particular reason." / "Whatever it was."); now the same contented,
    // never-travelled regular, but his idle talk drifts to the wider world he
    // will never see (aetherrail, the twin capitals, the Valmere \u2014 see LORE.md).
    dialogue: [
      ['\u201cI like it here in the evenings.',
       'The mushroom wine\u2019s cheap and nobody\u2019s in a hurry.\u201d'],
      ['\u201cSince I was a kid there\u2019s been an aetherrail, three towns east of here.',
       'And up in the capital regions you can go from Halcyra to Lumina in an afternoon, on rails the Stonewrought laid.\u201d',
       '\u201cFifty years it\u2019s run, and I\u2019ve never once seen it.\u201d'],
      ['\u201cAll this canal water goes east in the end \u2014 out to the Valmere, the big sea the province is named for.\u201d',
       '\u201cNever seen that either.\u201d'],
      ['\u201cThe Thornmere\u2019s sea enough for me.',
       'It\u2019s shallow, and it\u2019s here, and so am I.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'cres',
    name:          'Cres',
    map:           'inn',
    x:             11.5 * TILE,
    y:              2.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'clerk',
    get dialogue() {
      const pages = [
        ['\u201cThe cross-referencing is the satisfying part.',
         'Most people find that strange.\u201d'],
        ['\u201cWe notice things in records.',
         'Usually where two records refuse to agree.\u201d'],
        ['\u201cBefore the Empire, there was magic that could revive the dead.\u201d',
         '\u201cNot extend a life. Restore one after it had ended.\u201d'],
        ['\u201cSo how did the death penalty work?\u201d',
         '\u201cExecute someone, restore them, and then what?\u201d',
         '\u201cWas the sentence complete, or did they execute them again?\u201d'],
        ['\u201cPerhaps the body was destroyed. Perhaps restoration was forbidden.\u201d',
         '\u201cPerhaps they simply kept executing the same person.\u201d',
         '\u201cThe records do not say.\u201d'],
        ['\u201cLife imprisonment may have been the harsher sentence.\u201d',
         '\u201cA dead prisoner might return. A living one remained in the cell.\u201d'],
        ['\u201cUnless death meant less to them because it was reversible.\u201d',
         '\u201cThen perhaps execution was the lesser sentence.\u201d'],
        ['\u201cThe surviving laws prescribe death.\u201d',
         '\u201cThe surviving magical accounts describe people returning from it.\u201d',
         '\u201cNothing surviving explains how those facts fit together.\u201d'],
        ['\u201cWe notice things in records.\u201d',
         'She picks up her drink.',
         '\u201cMostly the places where the records stop.\u201d'],
      ];
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'edda',
    name:          'Edda',
    map:           'inn',
    x:              5.5 * TILE,
    y:             10.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    get dialogue() {
      const pages = [
        ['\u201cWent to check the board earlier.', 'Same listings as last week. And the week before.\u201d'],
        ['\u201cI\u2019m sure something will come up.', 'That\u2019s what people keep saying, anyway.\u201d'],
      ];
      if (reservoir_quest_started) pages.push(
        ['\u201cFirst new posting in a month, and it\u2019s the north basin.\u201d',
         '\u201cAnd it went straight to the office. Never even reached the board.\u201d'],
        ['\u201cThat\u2019s you, isn\u2019t it.\u201d', 'She doesn\u2019t say it unkindly.']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
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
  // Harlan — night-shift sluice worker, on the west residential street just
  // east of the player's front door on WORK days only (his "evening" is
  // everyone else's morning). Explains why the west-side houses stand empty
  // during the working day. Gone on Dayoff — the street is full then, and
  // he sleeps through it.
  {
    id:            'harlan',
    name:          'Harlan',
    get map()      { return day % 5 === 0 ? null : 'west'; },
    x:              4.5 * TILE,
    y:             10.5 * TILE,
    solid:         true,
    facing:        'left',
    spriteType:    'worker',
    dialogue: [
      ['“Quiet, isn’t it. Most of these houses are empty this time of day.”',
       '“Everyone’s at work. Sluice, office, reed crews.”'],
      ['“Me? Nights at the sluice. This is my evening.”',
       '“Give the street until dusk — or catch a Dayoff.',
       'Then you can’t move for neighbours.”'],
    ],
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

  // ── School NPCs ───────────────────────────────────────────────────────────
  // Ms. Vale, the Calwick teacher. On a Dayoff she is off-duty at the inn and
  // gives the whole cynical confession at once. On a school day she says ONE
  // thing per talk: the very first time she is ever spoken to she runs the
  // field-kit tutorial (persisted via vale_tutorial_seen); after that she
  // rotates through her four civics topics -- water management, the sluice,
  // Mera Dren, thread type -- one per interaction, with the Pip/assessment
  // reactions folded into the rotation when their flags are set.
  // dialogue:null + action, same pattern as pip/mirethyst.
  {
    id:            'ms_vale',
    name:          'Ms. Vale',
    get map()      { return day % 5 === 0 ? 'inn' : 'school'; },
    get x()        { return day % 5 === 0 ? 2.5 * TILE : 7.5 * TILE; },
    get y()        { return day % 5 === 0 ? 2.5 * TILE : 3.5 * TILE; },
    solid:         true,
    facing:        'down',
    spriteType:    'clerk',
    dialogue:      null,
    flag_required: null,
    flag_sets:     null,
    action:        function() {
      dialogue.name = 'Ms. Vale';
      dialogue.page = 0;
      dialogue.open = true;
      // Dayoff: off-duty at the inn, the whole cynical half at once.
      if (day % 5 === 0) {
        dialogue.pages = [
          ['She has a cup in front of her and no chalk in her hand.',
           '“In the classroom I tell them to be a Mera. In here I can tell you the rest of it.”'],
          ['“Mera’s road got moved by the very same Empire that planned it through her village’s well to begin with. And for every petition that works, a hundred correct ones die unanswered in a drawer.”',
           '“I don’t teach that half. The pamphlet is cheerier, and the children are young.”'],
          ['“It isn’t only Mera. The Accord that spared the rareborn wasn’t mercy — it was arithmetic. The old killing stopped controlling anything, so they stopped paying for it.”',
           '“At the front of the room I call it a gift, to be born into a system with a plan for you. The plan is a register, and an Academy you don’t get to refuse.”'],
          ['“Don’t mistake me. The lesson is still worth teaching — a clean petition is real power, and the Empire mostly works.”',
           '“But in here I don’t have to leave the hard half out. That’s worth a bad glass of wine.”'],
        ];
        return;
      }
      // School day, first-ever talk: the field-kit tutorial, once only.
      if (!window.vale_tutorial_seen) {
        window.vale_tutorial_seen = true;
        dialogue.pages = [
          ['“This is an RPG. Standard RPG rules apply.”',
           '“There are enemy encounters on the overworld roads.”',
           '“Unequipped, your attack and defend will be tragically weak. An unequipped agent is a dead agent.”'],
          ['“Open your menu with Esc or M.”',
           '“Go to Items, select a weapon or piece of armour, and choose Equip.”',
           '“Equip both a weapon and armour before leaving the civic district.”'],
          ['“Your level increases automatically as you earn experience from fights.”',
           '“Each level raises your stats. You do not need to do anything to trigger this.”'],
          ['“That is all.”',
           '“You may now proceed to have adventures or whatever it is you are here for.”'],
        ];
        return;
      }
      // Otherwise: one civics topic per talk, rotating. The Pip and assessment
      // reactions join the rotation as extra segments when their flags are set.
      const segments = [
        [['“Water management is the foundation of settled life — and the Empire is why we have it. Never forget that.”',
          '“Three months without rain, and are we frightened? We are not. We are prepared. That is what the Empire buys you.”']],
        [['“Our sluice predates the charter by three hundred years, and the Empire has kept it running every day of them.”',
          '“Name me another power in history that lasted long enough to bother. You cannot. Only this one.”']],
        [['“And Mera Dren — we did her petition this week!”',
          '“One girl, one clause, good manners, and the district moved an Imperial road for her. That is the Empire at its finest: ask the right office the right way, and it listens. Be a Mera, all of you.”']],
        [['“Thread type shows in the hair at birth, and the Empire records every rareborn child and keeps them safe — registration, schooling, a place at the Academy already waiting.”',
          '“What a thing, to be born into a system with a plan for you. Now — good questions only. That is the one rule in this room.”']],
      ];
      if (schilling_returned) segments.push([
        ['“Pip has been considerably more settled this week.”',
         '“He brought something in on the second day. Wouldn’t let go of it during the lesson.”',
         '“I decided it wasn’t worth the argument.”'],
        ['“I don’t know what changed.”', '“I’m glad for it.”'],
      ]);
      if (drama_stage >= 5) segments.push([
        ['“One of my students mentioned a parent was coming for the assessment.”',
         '“They said it quietly. Like it mattered very much and they didn’t want to show how much.”'],
        ['“I keep those things to myself.”', '“But I noticed.”'],
      ]);
      const i = (window._valeTopic || 0) % segments.length;
      window._valeTopic = i + 1;
      dialogue.pages = segments[i];
    },
  },
  // Student row 1 (y = 6.5T)
  {
    id: 'student_a1', name: 'The Precocious Analyst Child',
    map: 'school', x: 3.5 * TILE, y: 6.5 * TILE,
    solid: true, facing: 'down', spriteType: 'child',
    dialogue: [['\u201cI copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram.  copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram.copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram. copied the wrong diagram.\u201d', '\u201cAgain. Hey mister or lady, have you ever wondered what your life would be like if you only existed to test overflow text parameters?\u201d']],
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id: 'student_a2', name: 'The War Obsessed Child',
    get map() { return day % 5 === 0 ? 'west' : 'school'; },
    get x()   { return day % 5 === 0 ? 5.5 * TILE : 5.5 * TILE; },
    get y()   { return day % 5 === 0 ? 11.5 * TILE : 6.5 * TILE; },
    solid: true, facing: 'down', spriteType: 'child',
    get dialogue() {
      return day % 5 === 0
        ? [['\u201cWe\u2019re not allowed in the school yard on Dayoff.\u201d',
            '\u201cMr. Bram locks the gate.\u201d',
            '\u201cSo we found somewhere else to stand.\u201d',
            '\u201cIt\u2019s better anyway. Nobody tells you to go inside.\u201d']]
        : [['\u201cThey say the Empire won the war, but my uncle says winning just means you\u2019re the one who gets to write down what happened after.\u201d',
            '\u201cIf rareborn could control monsters back then, you could already see who they were from the hair. Which means whoever was hurting them knew exactly who they were hurting. You can\u2019t say it was a mistake.\u201d']];
    },
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id: 'student_a3', name: 'The Gentle Caretaker Child',
    get map() { return day % 5 === 0 ? 'west' : 'school'; },
    get x()   { return day % 5 === 0 ? 8.5 * TILE : 8.5 * TILE; },
    get y()   { return day % 5 === 0 ? 11.5 * TILE : 6.5 * TILE; },
    solid: true, facing: 'down', spriteType: 'child',
    get dialogue() {
      return day % 5 === 0
        ? [['\u201cWe\u2019re allowed to stay out until the fifth bell.\u201d',
            '\u201cThen I have to go home for supper.\u201d',
            '\u201cMy mother will be there.\u201d',
            '\u201cShe doesn\u2019t say come home but she means it.\u201d']]
        : [['\u201cMy grandmother says before the Accord, they didn\u2019t even let some children grow up if they were born with the wrong hair colour.\u201d',
            '\u201cYou could see it. They could see it. And they still chose to.\u201d']];
    },
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id: 'student_a4', name: 'The Chaotic Tinkerer Child',
    get map() { return day % 5 === 0 ? 'west' : 'school'; },
    get x()   { return day % 5 === 0 ? 7.5 * TILE : 10.5 * TILE; },
    get y()   { return day % 5 === 0 ? 10.5 * TILE :  6.5 * TILE; },
    solid: true, facing: 'down', spriteType: 'child',
    get dialogue() {
      return day % 5 === 0
        ? [['\u201cI found a thing.\u201d',
            '\u201cIt\u2019s probably a seed pod.\u201d',
            '\u201cBut it opened when I looked at it and I don\u2019t think seed pods are supposed to do that.\u201d']]
        : [['\u201cI understand all of it.\u201d'],
           ['\u201cIf you combine bloommarked growth with a little firelit heat, you get things growing faster, but sometimes they grow\u2026 fiery.\u201d',
            '\u201cWhich is still growing. Bloommarked is the green hair. I\u2019ve done the observation part.\u201d']];
    },
    flag_required: null, flag_sets: null, action: null,
  },
  // Student row 2 (y = 9.5T)
  {
    id: 'student_b1', name: 'The Quiet Observer Child',
    map: 'school', x: 3.5 * TILE, y: 9.5 * TILE,
    solid: true, facing: 'down', spriteType: 'child',
    dialogue: [['\u201cMy uncle works at the sluice.\u201d', '\u201cHis friends told me the swamp used to be smaller before the drainage systems. But the water didn’t leave—it just went somewhere else.”\u201d']],
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id: 'student_b2', name: 'The Imaginative Escapist Child',
    map: 'school', x: 5.5 * TILE, y: 9.5 * TILE,
    solid: true, facing: 'down', spriteType: 'child',
    // A schoolyard rhyme for telling rareborn \u2014 and it's canonically accurate.
    // In this world a rareborn "thread" (ability) is signalled by HAIR colour
    // and registered at birth (cf. Ms. Vale: "Thread type is identifiable by
    // hair colour at birth"): red = Firelit (Polwick), blue = Tidebound,
    // green = Bloommarked (cf. the Tinkerer Child: "Bloommarked is the green
    // hair"), silver = Galeheart, rosy/pink = Rosebound \u2014 all eight are hair
    // markers; violet is deliberately NOT used (no violet thread exists).
    // EYE colour (gold, pink, purple) is
    // purely cosmetic \u2014 pretty, but it carries no thread and no power. The
    // verse's second stanza states exactly that, so it's true, not folk fancy.
    // Couplets are split one-per-page so the dialogue box doesn't reflow them.
    dialogue: [
      ['\u201cWe learned a rhyme for spotting rareborn.',
       'Ms. Vale says the true part is really true.\u201d'],
      ['\u201cIf hair burns red, or blooms in blue or green,',
       'A thread may stir where rareborn signs are seen.\u201d'],
      ['\u201cIf silver curls or rosy locks arise,',
       'Then folk may look for power in disguise.\u201d'],
      ['\u201cBut golden eyes, or pink, or purple-bright,',
       'Hold not a thread, nor whisper any might.\u201d'],
      ['\u201cBright eyes are pretty eyes, and nothing more;',
       'The power\u2019s in the hair, as said before.\u201d'],
      ['\u201cThe eyes are only pretty \u2014 the hair\u2019s what tells.',
       'Ms. Vale says that part\u2019s really true.\u201d'],
    ],
    flag_required: null, flag_sets: null,
    // Opens the rhyme dialogue and records that the player has now heard it, so
    // the Drenwick school child (drenwick_gs_7) can react to a player who
    // already knows it. Reuses this.dialogue rather than duplicating the pages.
    action: function(npc) {
      dialogue.name  = npc.name;
      dialogue.pages = npc.dialogue;
      dialogue.open  = true;
      dialogue.page  = 0;
      rareborn_rhyme_heard = true;
      syncQuestFlagsToWindow();
    },
  },
  {
    id: 'student_b3', name: 'The Defiant Contrarian Child',
    map: 'school', x: 8.5 * TILE, y: 9.5 * TILE,
    solid: true, facing: 'down', spriteType: 'child',
    dialogue: [['\u201cRissa Haldenbur says she saw Lior’s brother sneaking out past the reed line at night, but she also said she saw a ghost last winter, so I don’t think she’s a reliable source.”\u201d', '\u201cAnd anyway, even if he was sneaking out, it’s not like that means anything. People always act like everything means something.\u201d', '\u201cNobody will tell me.\u201d']],
    flag_required: null, flag_sets: null, action: null,
  },
  {
    id: 'student_b4', name: 'The Social Diplomat Child',
    get map() { return day % 5 === 0 ? 'house:apt_1' : 'school'; },
    get x()   { return day % 5 === 0 ?  8.5 * TILE : 10.5 * TILE; },
    get y()   { return day % 5 === 0 ?  7.5 * TILE :  9.5 * TILE; },
    solid: true, facing: 'down', spriteType: 'child',
    dialogue: [
      ['\u201cWe learned about Mera Dren today. The petition girl.\u201d',
       '\u201cHer village\u2019s road was going to block the way to their water, so she found the right rule \u2014 the Water Access Clause \u2014 and asked properly, and they moved the road. Thirty paces.\u201d',
       '\u201cMs. Vale says: if you ever have a problem, be a Mera. Find the right office, ask the right way.\u201d'],
      ['\u201cI think that\u2019s good. Everyone\u2019s always shouting. Mera didn\u2019t shout.\u201d',
       '\u201cMy sister says it doesn\u2019t always work like that. But it worked for Mera, so.\u201d'],
      ['\u201cPress M for your menu, by the way. Inventory, notebook, all of it.\u201d',
       '\u201cI like knowing where things are kept.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // ── Schoolhouse bookshelf ──────────────────────────────────────────────────
  // Not a person: solid classroom furniture registered as a SIMPLE_NPC so it
  // reuses the standard proximity interaction and solid-body collision. Its
  // action opens a reading menu — five imperial school-primer topics in a
  // formal, glorifying textbook register, plus one plainer scholarly note (on
  // Fort Ariel), each shown in the accordPanel parchment reader (content drawn
  // from LORE.md). The Ariel note is deliberately in a different, sceptical
  // voice from the primers — a corrective gloss, not Imperial celebration.
  // Drawn by NPC_DRAW_FNS['calwick_school_bookshelf'] (render-entities.js).
  {
    id: 'calwick_school_bookshelf', name: 'Bookshelf',
    map: 'school', x: 13.5 * TILE, y: 2.5 * TILE,
    solid: true, facing: 'down', spriteType: 'clerk',
    dialogue: null,
    flag_required: null, flag_sets: null,
    action: function() {
      const TOPICS = [
        {
          label: 'The Century War',
          title: 'IMPERIAL SCHOOL PRIMER — THE CENTURY WAR',
          pages: [
            ['The Century War stands at the threshold of unified time: a conflict of one hundred years between the commonborn multitude and the rareborn few, from which the Empire itself was born. Against arts of great and terrible power, the commonborn prevailed by those virtues the Empire honours still — patience, discipline, and the refusal to yield.',
             'At Year Zero the two surviving city-states, Lumina and Halcyra, set aside a century of grief and signed the compact of unification: an act of statesmanship from which all subsequent peace descends.'],
            ['In the settlement that followed, the young Empire acted to secure the realm by measures deemed needful in that stern age. A gentler century may weigh those judgments differently; the student should recall that the founders governed amid ruin, and chose order first, so that their descendants might one day afford mercy — as, by the Accord of Threads, they did.',
             'Of the age before the war, little survives; the fighting consumed the archives of a thousand years. Where other peoples might have mourned, the founders built. The Empire’s history begins in light, at Year Zero, with law — and it has not been interrupted since.'],
          ],
        },
        {
          label: 'The Accord of Threads',
          title: 'IMPERIAL SCHOOL PRIMER — THE ACCORD OF THREADS',
          pages: [
            ['Ratified in the seven hundredth year After Century, the Accord of Threads is justly accounted the most far-sighted instrument of governance the Empire has issued. In recognition of existing realities, and in furtherance of the Empire’s enduring charge to preserve order, continuity, and the common peace, it set aside the final remedy of an earlier and sterner age, and established in its place a durable framework of registry, instruction, and licensed standing.',
             'The drafting itself is a model of delicacy and precision: the instrument addresses “the condition” through outward and measurable signs alone, and thereby spares a whole class of subjects the weight of harsher language.'],
            ['By its provisions, those who might once have lived in concealment and fear were brought instead into partnership with the realm — counted, educated, certified, and set to honourable service. Article VIII, providing that ambiguity resolves in favour of public order, ensures that no quarrel of interpretation can ever unsettle the peace the Accord secured.',
             'Three hundred and seventy years of unbroken quiet stand as its vindication. It is difficult, from the vantage of the present age, to name another act of state that has purchased so much peace at so modest a price.'],
          ],
        },
        {
          label: 'The Eight Threads',
          title: 'IMPERIAL SCHOOL PRIMER — THE EIGHT THREADS',
          pages: [
            ['Among the many fortunes of the realm, none is greater than this: resonant ability, arising in roughly one subject in three hundred, follows no line of descent. What fortune distributes freely, no dynasty may hoard; no house may breed itself into mastery; and every rareborn child, whether of manor or fen, comes equally into the care and instruction of the Empire. Upon this providence the whole equity of imperial governance rests.',
             'Ability declares itself honestly, from birth, in the colour of the hair — nature’s own registry, wanting only the Empire’s diligence to complete it.'],
            ['The eight threads, each a gift in the service of the realm, are conventionally listed thus: Voidborn (black), the calming of forces; Bloommarked (green), the increase of harvests; Tidebound (blue), the mastery of waters; Firelit (red), heat and forge-craft; Galeheart (silver), the winds; Stonewrought (brown or grey), the raising of works; Starlit (gold), light; and Rosebound (pink), the mending of body and spirit. Rarest of all is the prismborn, one in a million, in whom every gift is amplified together.',
             'The student should note that vivid colour of the eye, however striking, signifies nothing: it is an ornament of nature, and no thread attends it.'],
          ],
        },
        {
          label: 'The Council of 33',
          title: 'IMPERIAL SCHOOL PRIMER — THE COUNCIL OF THIRTY-THREE',
          pages: [
            ['The Empire is governed by the Council of Thirty-Three, whose design — the Three Elevens — is justly admired as the most balanced constitution yet devised. Eleven hereditary seats preserve the continuity of the eight kingdoms and the memory of their great houses; eleven elected seats, one to each region for a term of five years, carry the voice of the people to the capital; and eleven seats of the Wisdom Council, filled from those who have given thirty-three years of service to the Empire, supply the judgment that only long labour teaches.',
             'Above them presides the Concordant, whose office is itself a lesson in imperial modesty: the highest chair in the realm votes only to break a tie.'],
            ['Visitors sometimes observe that the elected eleven, who speak for the greatest number, carry but a third of the Council’s votes. The design is deliberate. The passions of a season are weighed against the continuity of centuries, and the realm is thereby spared the fevers that unsettle less considered constitutions.',
             'Three hundred and seventy years of peace are the arrangement’s answer to its critics.'],
          ],
        },
        {
          label: 'The Quiet',
          title: 'IMPERIAL SCHOOL PRIMER — THE QUIET',
          pages: [
            ['The age from the Accord’s ratification to the present day — some three hundred and seventy years — is named the Quiet, and history records no fuller demonstration of what wise governance may accomplish. The population of the Continent has tripled, from some three millions to nine and a half. By the Instruction to Twelve Act, the Empire opened free schooling to every child in the realm, and seven subjects in ten now read — a plenty of letters no earlier age approached.'],
            ['The crown of the age is the aetherrail: the resonance-driven railway in which Stonewrought, Galeheart, and Voidborn practitioners labour in concert — the Accord’s wisdom made visible, gifts once feared now bearing the traveller between Lumina and Halcyra in a single day. From the first line in the year one thousand and twenty, the network has grown in a bare half-century to eleven lines and forty-seven stations, and grows still.',
             'The concerns of the present day — schooling, harvests, the careful husbanding of water — are the concerns of a civilisation that has prospered beyond the difficulties of survival, and will meet the difficulties of plenty as it has met all difficulties before them.'],
          ],
        },
        {
          // A plainer, sceptical scholarly note bound in among the primers —
          // deliberately NOT in the Imperial glorifying voice. Content per the
          // Fort Ariel / Warm Circle facts (see LORE.md).
          label: 'Fort Ariel',
          title: 'FORT ARIEL AND THE WARM CIRCLE — A SCHOLAR’S NOTE',
          pages: [
            ['Modern Prismborn are extraordinarily rare, and potentially versatile, but they are not routinely capable of reshaping regional climates. Ariel was unimaginably powerful even by Prismborn standards — and, it appears, possessed knowledge no living practitioner can reproduce. What follows sets down only what may be defended.',
             'The known and defensible facts are these. She was born at Fort Arrhall around fifty years Before Century, and was recognised as Prismborn. Over several decades she transformed the surrounding polar landscape.'],
            ['The resulting warmth forms a precise circle, approximately six kilometres in radius. The inner four kilometres remain warm and fertile enough for strawberries; the outer two cool progressively, but remain suitable for cereal agriculture.',
             'The effect persisted after Ariel disappeared during the Century War, and has continued for more than eleven centuries. No measurable weakening has ever been detected.'],
            ['No modern examination has identified its power source or its operating mechanism, and attempts to reproduce even a tiny equivalent have failed.',
             'The warmth is unquestionably Ariel’s work. It is not a naturally occurring geothermal feature subsequently attributed to her. Something she created is still, today, actively maintaining an environment that should not exist.'],
          ],
        },
      ];
      function openTopics() {
        choice.title     = 'The history shelf';
        choice.options   = TOPICS.map(function(t) { return t.label; }).concat(['Put it back']);
        choice.cursor    = 0;
        choice.callbacks = TOPICS.map(function(t) {
          return function() {
            accordPanel.title = t.title;
            accordPanel.pages = t.pages;
            accordPanel.page  = 0;
            accordPanel.open  = true;
          };
        }).concat([function putBack() {}]);
        choice.open = true;
      }
      choice.title     = 'Schoolhouse bookshelf';
      choice.options   = ['Read a history book', 'Leave it'];
      choice.cursor    = 0;
      choice.callbacks = [openTopics, function leave() {}];
      choice.open      = true;
    },
  },

  // ── Schoolhouse world map ──────────────────────────────────────────────────
  // A classroom fixture, like the bookshelf: registered as a SIMPLE_NPC so it
  // reuses proximity interaction + solid-body collision, but drawn as a framed
  // wall map rather than a person. Examining it opens the continent-map overlay
  // (render-ui.js's drawContinentMapPanel) — the same world map the Calwick
  // office wall shows. Drawn by NPC_DRAW_FNS['calwick_school_map']
  // (render-entities.js).
  {
    id: 'calwick_school_map', name: 'World Map',
    map: 'school', x: 2.5 * TILE, y: 2.5 * TILE,
    solid: true, facing: 'down', spriteType: 'clerk',
    dialogue: null,
    flag_required: null, flag_sets: null,
    action: function() {
      continentMap.open = true;
    },
  },

  // ── Pip — Schilling quest ─────────────────────────────────────────────────
  // Appears day 2+ in the southeast corner of the school (not at a desk).
  // Lost his teddy bear Schilling to Wrongteeth; rewards the cat-shaped key.
  {
    id: 'pip', name: 'Pip',
    get map() { return day >= 2 && !schilling_returned ? 'school' : null; },
    x: 11.5 * TILE, y: 10.5 * TILE,
    solid: true, facing: 'down', spriteType: 'child',
    dialogue: null,
    flag_required: null, flag_sets: null,
    action: function() {
      const hasSchilling = stats.items.some(i => i.name === 'Schilling');
      if (hasSchilling) {
        dialogue.name  = 'Pip';
        dialogue.pages = [
          ['His eyes go wide.',
           '\u201cIs that \u2014\u201d',
           'He stops. Starts again.',
           '\u201cIs that Schilling?\u201d'],
          ['You hold out the bear.',
           'He takes it very carefully. Like it might not be real.',
           'He holds it against his chest and doesn\u2019t say anything for a moment.'],
          ['\u201cI have something for you.\u201d',
           '\u201cI found it ages ago. I don\u2019t know what it opens.\u201d',
           '\u201cBut you got Schilling back.\u201d',
           '\u201cSo it\u2019s yours.\u201d'],
        ];
        dialogue.callbacks = [function() {
          stats.items = stats.items.filter(i => i.name !== 'Schilling');
          grantItem('Cat-Shaped Key');
          schilling_returned = true;
          syncQuestFlagsToWindow();
          refreshJobBoard();
          dialogue.name  = 'Pip';
          dialogue.pages = [['He is already talking to Schilling.', 'You let yourself out.']];
          dialogue.open  = true;
          dialogue.page  = 0;
        }];
      } else if (schilling_quest_started) {
        dialogue.name  = 'Pip';
        dialogue.pages = [
          ['\u201cHe\u2019s still in there.\u201d',
           'He says it quietly, without looking up.',
           '\u201cThe east dungeon. Bram told me that\u2019s where it went.\u201d'],
        ];
      } else {
        dialogue.name  = 'Pip';
        dialogue.pages = [
          ['\u201cYou\u2019re an investigator.\u201d',
           'He says it as a statement, not a question.',
           '\u201cI know because of the badge.\u201d'],
          ['\u201cMy bear is missing. His name is Schilling.\u201d',
           '\u201cSomething took him. Something large.\u201d',
           '\u201cIt went into the dungeon east of here.\u201d'],
          ['\u201cHe\u2019s a toy. He can\u2019t do anything.\u201d',
           '\u201cBut he\u2019s mine.\u201d'],
        ];
        dialogue.callbacks = [function() {
          schilling_quest_started = true;
          syncQuestFlagsToWindow();
          refreshJobBoard();
        }];
      }
      dialogue.open = true;
      dialogue.page = 0;
    },
  },

  // ── Apartment residents ───────────────────────────────────────────────────

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

  // Drenwick Inn — innkeeper (Nast)
  {
    id:         'drenwick_innkeeper',
    name:       'Nast',
    map:        'drenwick_inn',
    get x()     { return day % 5 === 0 ? 5.5 * TILE : 7.5 * TILE; },
    get y()     { return day % 5 === 0 ? 7.5 * TILE : 2.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      const pages = day % 5 === 0
        ? [
            ['\u201cI\u2019m not working today.\u201d',
             '\u201cI mean, I\u2019m here. The inn is here. But officially I am sitting down.\u201d'],
          ]
        : [
            ['\u201cThe beds are clean. Meals are adequate. The common room stays warm until the second bell.\u201d',
             '\u201cIf you need something after that, knock at the back.\u201d'],
            ['\u201cDistrict office is east end of the square. Canal path runs north of the market.\u201d',
             '\u201cDon\u2019t walk the canal edge after dark. The footing\u2019s not reliable.\u201d'],
          ];
      if (dispatch_delivered) pages.push(
        ['\u201cA Calwick officer stayed here, couple of nights back.\u201d',
         '\u201cDidn\u2019t linger. Just the one night, then back on the road.\u201d'],
        ['\u201cQuiet sort. Nothing wrong with that.\u201d']
      );
      if (sentry_quest_done) pages.push(
        ['\u201cNorth road\u2019s open again.\u201d',
         '\u201cHad a group come through yesterday \u2014',
         'first travellers I\u2019d seen from that direction in nearly a week.\u201d'],
        ['\u201cGood for trade, when people actually use the roads.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Office — district officer (Officer Veth)
  // Dayoff: at the Drenwick inn, off duty (back-corner table near the
  // crescent booth), with his own out-of-uniform lines.
  {
    id:         'district_officer',
    name:       'Officer Veth',
    get map()   { return day % 5 === 0 ? 'drenwick_inn' : 'drenwick_office'; },
    x:          12.5 * TILE,
    get y()     { return day % 5 === 0 ? 4.5 * TILE : 3.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      if (day % 5 === 0) return [
        ['He’s out of uniform, which takes a moment to register.',
         '“Investigator. Sit if you like.',
         'The district can’t object — it’s shut.”'],
        ['“The office closes one day in five.',
         'Which means one day in five, the district is officially incapable of emergencies.”',
         '“It’s the only regulation I have never once argued with.”'],
        ['“Tomorrow the ledgers reopen and I go back to being careful about what I say.”',
         '“Today I’m only careful about the ale.',
         'Moderately careful.”'],
      ];
      const pages = [
        ['\u201cCalwick posting. I heard about it.\u201d',
         '\u201cSmall station. That\u2019s not a comment on the work.\u201d'],
        ['\u201cAs many employees as we have despite being in a town a third the size. Lucky you.\u201d',
         '\u201cCalwick sees the edge of it. This office sees the rest.\u201d'],
        ['\u201cYour supervisor files clean reports.\u201d',
         '\u201cI don\u2019t read them closely, but they\u2019re clean.\u201d'],
      ];
      if (fort_quest_stage >= 6 && smugglers_dead && smugglers_execution_day === 0) pages.push(
        ['\u201cThe district received a report on the fen post south of town.\u201d',
         '\u201cTwo dead. You handled it before it reached us.\u201d'],
        ['\u201cPolwick was on our books. Registered rareborn, Empire employed \u2014 not many of those out this far.\u201d',
         'He checks something against a ledger without elaborating.'],
        ['\u201cWhatever he was running out of that post, it wasn\u2019t sanctioned.',
         'The drought\u2019s hard on everyone. That\u2019s not a license.\u201d'],
        ['\u201cI won\u2019t comment further.\u201d',
         '\u201cBut I appreciate that it came through the correct channel.\u201d']
      );
      else if (fort_quest_stage >= 6 && smugglers_execution_day > 0 && day < smugglers_execution_day) pages.push(
        ['\u201cThe district received a report on the fen post south of town.\u201d',
         '\u201cIt\u2019s been flagged for priority review.\u201d'],
        ['\u201cPolwick, if it\u2019s the name I\u2019m thinking of \u2014 registered rareborn, Empire employed.',
         'Not many of those out this far.\u201d',
         'He doesn\u2019t say more than that.'],
        ['\u201cI won\u2019t comment further.\u201d',
         '\u201cBut I appreciate that it came through the correct channel.\u201d']
      );
      else if (fort_quest_stage >= 6 && smugglers_execution_day > 0 && day >= smugglers_execution_day) pages.push(
        ['\u201cThe fen post matter is closed.\u201d',
         '\u201cThe district doesn\u2019t send people out for a clerical error.\u201d'],
        ['\u201cPolwick was registered rareborn, Empire employed.',
         'Whatever he thought the smuggling covered \u2014 the drought, the pay, whatever it was \u2014 it didn\u2019t.\u201d'],
        ['\u201cInefficiency we work around out here.',
         'Helping yourself to the ledger isn\u2019t inefficiency.\u201d'],
        ['\u201cI won\u2019t comment further.\u201d',
         '\u201cBut I appreciate that it came through the correct channel.\u201d']
      );
      if (sentry_quest_done) pages.push(
        ['\u201cConstable Tarvec closed the watch order on the north road.\u201d',
         '\u201cThe contract was fulfilled.\u201d'],
        ['\u201cThat road is properly open again.',
         'We had patrol requests backed up.\u201d']
      );
      if (reservoir_quest_started && window.gallery_body_found) pages.push(
        ['\u201cYou found Dreyfuss.\u201d He does not make it a question. Word comes down the canal faster than any report.',
         '\u201cPulled under in the flooded end and held there. Something in that water killed him \u2014 a man does not claw the silt like that going quietly.\u201d'],
        ['\u201cThat is one of my two accounted for \u2014 and the worse of the two accounts to have to write.\u201d',
         '\u201cGarrick is still out there. Or still down there, in whatever took Dreyfuss. No body is not the same as alive. It is not the same as Dreyfuss either.\u201d'],
        ['\u201cIf you go back, keep your eyes open for him. A man, or the place a man stopped.\u201d',
         '\u201cI would close his file the honest way. I am not sure the basin means to let me.\u201d']
      );
      else if (reservoir_quest_started) pages.push(
        ['\u201cThe basin observers \u2014 Garrick and Dreyfuss.\u201d',
         'He says the names off a list he has read too many times.',
         '\u201cThey worked out of this office. My signatures on their postings.\u201d'],
        ['\u201cGarrick was the careful one \u2014 measured everything twice, wrote it all down. Dreyfuss went where Garrick pointed and didn\u2019t ask why.',
         'A good pair for dull work. This stopped being dull.\u201d'],
        ['\u201cGarrick\u2019s reports came thinner, then stranger, then not at all. From Dreyfuss, nothing once they passed the flats.\u201d',
         '\u201cIf you find either of them out there, word comes back to this office as well as yours. They were mine before they were a file.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Office — junior clerk (Holt)
  {
    id:         'drenwick_clerk',
    name:       'Holt',
    // Dayoff: at the Drenwick inn, drinking on a schedule.
    get map()   { return day % 5 === 0 ? 'drenwick_inn' : 'drenwick_office'; },
    x:           4.5 * TILE,
    get y()     { return day % 5 === 0 ? 9.5 * TILE : 5.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      if (day % 5 === 0) return [
        ['\u201cThe batch is still open. The countersignature still hasn\u2019t come.\u201d',
         '\u201cBut it is Dayoff.',
         'So today, that is somebody else\u2019s tragedy.\u201d'],
        ['\u201cTomorrow at first bell it resumes being mine.\u201d',
         'He drinks with the focus of a man keeping to a schedule.'],
      ];
      const pages = [
        ['\u201cThe third-quarter variance cross-references against the interim schedule before I can close the batch.\u201d',
         '\u201cIt has been this way for six weeks.\u201d'],
        ['\u201cIf the countersignature arrives after the period closes, it doesn\u2019t retroactively close the period.\u201d',
         '\u201cI\u2019ve explained this. I\u2019ll explain it again.\u201d'],
      ];
      // Ordinary office context before the reservoir assignment: both of the
      // district office's field investigators happen to be away at the same
      // time. Deliberately ambient -- no quest flag, and no foreshadowing of
      // what actually became of Garrick and Dreyfuss (that is the later,
      // reservoir_quest_started-gated material below).
      if (!reservoir_quest_started) pages.push(
        ['\u201cBoth our field investigators are out at once this week \u2014 field assignments, the far side of the district.\u201d',
         '\u201cSo it\u2019s the officer and me minding the desks. Come to see a field man and you\u2019ve come on the wrong week.\u201d']
      );
      if (reservoir_quest_started && window.gallery_body_found) pages.push(
        ['\u201cDreyfuss I can nearly close now. Cause of cessation: deceased, recovered \u2014 the register keeps a box for it. A small box, for a whole man.\u201d',
         '\u201cGarrick stays open. Overdue past any schedule I could defend, and I have defended schedules no reasonable person would.\u201d'],
        ['\u201cOne found, one not. The office prefers its pairs to resolve together. It is tidier.\u201d',
         'He does not look tidy.',
         '\u201cI did their postings. I initialed the line that sent the two of them up the flats. I remember doing it. It took me under a minute.\u201d']
      );
      else if (reservoir_quest_started) pages.push(
        ['\u201cThere are two field files I cannot close. Garrick, G. \u2014 basin survey. Dreyfuss, no initial recorded, which is its own small crime against the register.\u201d',
         '\u201cReports overdue eleven weeks and nine. A file stays open until its holder files or is filed. Neither man has done either.\u201d'],
        ['\u201cPeople take me for callous about it. I am being accurate. The two are often confused.\u201d',
         'He squares a corner of paper that was already square.',
         '\u201cI would rather close them the ordinary way \u2014 sign-off, archive, done. I have started to doubt I will be given the ordinary way.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Civic — market square NPC 1 (Brice, canal worker on break)
  {
    id:         'drenwick_market_1',
    name:       'Brice',
    map:        'drenwick_civic',
    x:           5.5 * TILE,
    get y()     { return day % 5 === 0 ? 6.5 * TILE : 4.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      return day % 5 === 0
        ? [
            ['\u201cForty-one barges since the morning bell. Nine riding low \u2014 laden. Four riding high \u2014 empty, returning.\u201d',
             '\u201cI don\u2019t decide to count. It counts itself. Once you know what to look at, you can\u2019t stop looking. You won\u2019t either, now. Sorry.\u201d'],
          ]
        : [
            ['\u201cEast lock\u2019s at half-draw this month. You can see it in the wake \u2014 the water sets wrong off the second gate. Wrong, wrong, every cycle, wrong.\u201d',
             '\u201cFlow\u2019s been off since the sediment survey. Watch the weir. It\u2019ll correct, and I\u2019ll know the very hour it does.\u201d'],
            ['\u201cThey dredged the west channel last season. First time in forty years \u2014 forty exactly, I checked twice.\u201d',
             '\u201cSilt at the bottom older than the town. I think about that more than is healthy. I think about most things more than is healthy.\u201d'],
          ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

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

  // Drenwick Inn — traveller passing through (Orren)
  {
    id:         'drenwick_inn_1',
    name:       'Orren',
    map:        'drenwick_inn',
    x:           3.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'traveler',
    get dialogue() {
      const pages = [
        ['\u201cCame from Ashford. Three days east, past the rail terminus.\u201d',
         '\u201cLarger than here. Louder. I\u2019m not sure I prefer it.\u201d'],
        ['\u201cFirst impression of Drenwick: the canal is bigger than the maps suggest.\u201d',
         '\u201cThe streets are quieter than the canal. I\u2019d stay another day to see if it opens up.\u201d'],
      ];
      // Inn-rumor seeding for the MQ4 assignment -- travellers carry talk.
      if (reservoir_quest_started) pages.push(
        ['\u201cCoachman on the east road had a story. The basin office north of here keeps two observers on the books \u2014 Garrick and Dreyfuss, he named them.\u201d',
         '\u201cKept, maybe. Apparently the reports stopped coming and nobody wants the walk up to find out why.\u201d'],
        ['\u201cIt\u2019s always \u2018nobody wants the walk.\u2019\u201d',
         '\u201cIt\u2019s never \u2018nobody wants to know.\u2019 People always want to know.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Inn — local in the evenings (Mallow)
  {
    id:         'drenwick_inn_2',
    name:       'Mallow',
    map:        'drenwick_inn',
    x:          11.5 * TILE,
    get y()     { return day % 5 === 0 ? 7.5 * TILE : 9.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      const pages = day % 5 === 0
        ? [
            ['\u201cSou\u2019re youA boy or a girl? I can\u2019t tell. Duzzent matter though you\u2019re pretty cute. But I do want to know just to know, you know? What\u2019s your name again?\u201d',
             '\u201cThat doesn\u2019t help me; I still dont know what you are. But you are kind of cute eitherway. I love mushroom wine.\u201d'],
          ]
        : [
            ['\u201cMy father used to say the canal is why we have a town.\u201d',
             '\u201cHe was right. But you can\u2019t live in a canal.\u201d'],
            ['\u201cWhen the water\u2019s low, people get short-tempered. Not because of the canal.\u201d',
             '\u201cJust \u2014 they do. Been that way long as I\u2019ve been here.\u201d'],
          ];
      if (sentry_quest_done) pages.push(
        ['\u201cYou hear about the pale creature on the north road?\u201d',
         '\u201cSomeone went out and dealt with it. Routes are clear again.\u201d'],
        ['\u201cI had three separate people ask me in one week if it was safe to travel north.\u201d',
         '\u201cNot anymore, apparently.\u201d']
      );
      if (drama_stage >= 5) pages.push(
        ['\u201cDavan\u2019s been different lately. Less wound up.\u201d',
         '\u201cHe came into the inn last week, which he almost never does.\u201d'],
        ['\u201cDidn\u2019t say anything about it.',
         'But he looked easier than he has in a while.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Drenwick Canal/Docks and Waterfront NPCs ─────────────────────────────────

  // Drenwick Canal/Docks — Harbormaster Renn (exterior post, Dayoff only)
  // Workdays he is inside the harbormaster's office (see harbormaster_interior),
  // which is where the whole Weight Discrepancy quest is handled — so on work
  // days this exterior post is empty (map null). On Dayoff the office is shut,
  // and he stands on the quay (center, col 7) checking the water levels.
  // The two Renn NPCs are mutually exclusive: exactly one is active on any day.
  {
    id:         'harbormaster',
    name:       'Harbormaster Renn',
    get map()   { return day % 5 === 0 ? 'drenwick_canal_docks' : null; },
    x:           7.5 * TILE,
    y:           3.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      const pages = day % 5 === 0
        ? [
            ['\u201cSomeone still has to watch the water levels.\u201d',
             '\u201cI\u2019m not here officially.\u201d'],
          ]
        : [
            ['\u201cWest channel is silting again at the third weir.\u201d',
             '\u201cI\u2019ve had a survey crew out twice this month. The dredge needs to go back in before autumn.\u201d'],
            ['\u201cThe aetherrail is good for letters and passengers.\u201d',
             '\u201cFor a full hold of cut timber or a barge of peat blocks, the canal is still the only way it moves. That hasn\u2019t changed.\u201d'],
            ['\u201cThe Thread Registry was in Drenwick before the rail came. Registered rareborn in the district checked in at this office.\u201d',
             '\u201cNow they travel northeast. That\u2019s just where it is. A lot of things moved when the rail did.\u201d'],
          ];
      if (weight_quest_stage >= 4) pages.push(
        ['\u201cAldric sent the reconciliation note this morning.\u201d',
         '\u201cThat cargo weight has been flagging on our channel report for two months.\u201d'],
        ['\u201cYou carried the paperwork both ways.',
         'That\u2019s the job nobody wants.\u201d',
         '\u201cI appreciate it.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Canal/Docks — Kest, Harbormaster Renn's assistant
  // Regular post: quay, one tile east of Renn's usual spot (cols 10-11).
  // Present every day, including Dayoff -- unlike Renn, who at least gets to
  // claim he's "not here officially." Kest doesn't get that excuse.
  {
    id:         'harbormaster_assistant',
    name:       'Kest',
    map:        'drenwick_canal_docks',
    x:          11.5 * TILE,
    y:           3.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      const pages = [
        ['\u201cSomeone has to actually walk the channel readings twice a day.\u201d',
         '\u201cThat\u2019s not in anyone\u2019s job title. It\u2019s just become mine.\u201d'],
        ['\u201cRenn gets the title. I get the wet boots.\u201d',
         '\u201cHe\u2019s not a bad sort, really. He just forgets I\u2019m not also the harbormaster.\u201d'],
        ['\u201cThird year the water table\u2019s been low. Third year running.\u201d',
         '\u201cThere\u2019s a word for it now. \u2018Drought.\u2019 Official, apparently. Someone in Halcyra signed a form.\u201d'],
        ['\u201cSigning a form doesn\u2019t refill the channel.\u201d',
         '\u201cBut at least now I get to write \u2018drought conditions\u2019 on the survey instead of making something up.\u201d'],
      ];
      // Smellable evidence, not omniscience -- and a smell fades. Same-day
      // marker (window.sunken_gallery_visit_day, movement.js), not the
      // permanent sunken_gallery_seen discovery flag: expires the moment
      // `day` advances and never survives a load (save.js's loadGame()).
      if (window.sunken_gallery_visit_day === day) pages.push(
        ['He stops writing mid-reading and looks at you properly.',
         '\u201cYou smell like the bottom of a channel. Not the top of one. The bottom.\u201d'],
        ['\u201cThere\u2019s exactly one place the water\u2019s low enough to walk a bottom that old.\u201d',
         '\u201cI\u2019m not going to ask. Write your reading down somewhere, though. Whatever it was.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Office — Thread Officer Sable
  // Corner desk lower-right (col 11, row 8) — distinct from Veth (col 12, row 3)
  // and Holt (col 4, row 5).
  {
    id:         'thread_officer',
    name:       'Officer Sable',
    // Dayoff: at the wash house (bench by the east wall) \u2014 even the thread
    // desk takes the fifth day; the northeast Registry doesn't answer on
    // Dayoff either, as the dialogue notes.
    get map()   { return day % 5 === 0 ? 'drenwick_wash_house' : 'drenwick_office'; },
    get x()     { return day % 5 === 0 ? 10.5 * TILE : 11.5 * TILE; },
    get y()     { return day % 5 === 0 ?  9.5 * TILE :  8.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      if (day % 5 === 0) return [
        ['\u201cYes. Even this desk takes the fifth day.\u201d',
         '\u201cThe Registry\u2019s northeast office doesn\u2019t answer on Dayoff either.',
         'I checked once, early in the posting. Only once.\u201d'],
        ['\u201cThe steam is good for the joints.\u201d',
         '\u201cFiling is harder on the body than anyone admits.\u201d'],
        ['\u201cCompliance visits resume tomorrow.',
         'The mud will still be there. The mud is very reliable.\u201d'],
      ];
      return [
        ['\u201cThread registration for this district runs through this office.\u201d',
         '\u201cIf a classification requires full Registry processing, I refer it northeast. Most things can be handled here.\u201d'],
        ['\u201cRareborn dispersal in the wetland settlements is difficult to reach.\u201d',
         '\u201cWe have outstanding compliance checks in four outlying sites. Getting there is the issue, not the filing.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Canal/Docks — Dock Worker 1 (Faren)
  // Regular: service road south of warehouses (col 5, row 8).
  // Dayoff: same map, resting one row further south (row 9).
  {
    id:         'dock_worker_1',
    name:       'Faren',
    map:        'drenwick_canal_docks',
    x:           5.5 * TILE,
    get y()     { return day % 5 === 0 ?  9.5 * TILE :  8.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      return day % 5 === 0
        ? [
            ['\u201cEn\u2019t loadin\u2019 naught today.\u201d',
             '\u201cWaitin\u2019 on the afternoon. Wife\u2019s sister, passin\u2019 through. Aye.\u201d'],
          ]
        : [
            ['\u201cReeds this mornin\u2019. Salted fish come the afternoon barge.\u201d',
             '\u201cUp the line they sort what goes where. Down here? Ye move the load. That\u2019s the whole of it.\u201d'],
            ['\u201cNever been on that aetherrail, me. Reckon I never will.\u201d',
             '\u201cNaught I carry goes near the terminus. Peat blocks, reed bundles \u2014 they en\u2019t puttin\u2019 that on the resonance cars.\u201d'],
          ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Canal/Docks — Dock Worker 2 (Pell)
  // West end of quay (col 2, row 3), near Warehouse A.
  // Absent on dayoff: visiting family in a smaller settlement.
  {
    id:         'dock_worker_2',
    name:       'Pell',
    get map()   { return day % 5 === 0 ? null : 'drenwick_canal_docks'; },
    x:           2.5 * TILE,
    y:           3.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    dialogue: [
      ['\u201cReeds grow back every season.\u201d',
       '\u201cWe clear the margins in spring, they\u2019re back by autumn. The silt is worse \u2014 you can\u2019t see it building, but the depth logs don\u2019t lie.\u201d'],
      ['\u201cThis is as far as scheduled traffic reaches.\u201d',
       '\u201cEverything past here is private charter or the small workboats going into the fen. The main barge route ends here.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Drenwick Waterfront Tavern Interior NPCs ─────────────────────────────────
  // Map: 'drenwick_tavern'. All solid: true.
  // Tone: blue collar, end-of-shift, slightly hard-done-by, low-level amusement.

  // Tavern keeper — Brenn, 24-25, inherited from father two years ago.
  // Slightly out of his depth but trying. Sells mushroom wine.
  // Custom interaction (purchase) wired in interactions.js; SIMPLE_NPCS entry for sprite rendering.
  {
    id:         'drenwick_tavern_keeper',
    name:       'Tavern Keeper',
    get map()   { return 'drenwick_tavern'; },
    x:           7.5 * TILE,
    y:           2.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      // Purchase interaction handled by interactions.js; this is a fallback only.
      return day % 5 === 0
        ? [['\u201cStill here. Someone has to be.\u201d',
            '\u201cThe dock trade doesn\u2019t observe dayoffs, mostly.\u201d']]
        : [['\u201cEvening.\u201d']];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Barge crew member 1 — Nara. Just finished a run. Tired, not unfriendly.
  // Workday: col 7, row 9 (center-mid table). Dayoff: col 5, row 9 (same table, more relaxed).
  {
    id:         'barge_crew_1',
    name:       'Nara',
    get map()   { return 'drenwick_tavern'; },
    get x()     { return day % 5 === 0 ?  5.5 * TILE :  7.5 * TILE; },
    y:           9.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      return day % 5 === 0
        ? [
            ['\u201cNot running today.\u201d',
             '\u201cFirst time I\u2019ve sat down properly in a week.\u201d'],
          ]
        : [
            ['\u201cPeat run from the upper fen. Seven days both ways.\u201d',
             '\u201cThe channel\u2019s silting at the third weir worse than last season. We were running light on the southern approach or we\u2019d have grounded.\u201d'],
            ['\u201cLooking forward to sleeping somewhere that isn\u2019t moving.\u201d'],
          ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Barge crew member 2 — Doss. Talkative, opinionated about freight regulations.
  // Workday: col 8, row 9 (same table as Nara). Dayoff: absent (visiting someone).
  {
    id:         'barge_crew_2',
    name:       'Doss',
    get map()   { return day % 5 === 0 ? null : 'drenwick_tavern'; },
    x:           8.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      const pages = [
        ['\u201cImperial freight classification has us carrying \u201cundifferentiated organic bulk\u201d on the peat runs.\u201d',
         '\u201cUndifferentiated organic bulk. It\u2019s peat. It\u2019s been peat for sixty years.\u201d'],
        ['\u201cThe channel maintenance rota hasn\u2019t been updated since last district review.\u201d',
         '\u201cThree weirs in our regular run are flagged for dredging from two cycles ago. Still flagged. Still waiting.\u201d'],
      ];
      if (weight_quest_stage >= 4) pages.push(
        ['\u201cHeard they sorted the weight certification backlog at Renn\u2019s office.\u201d',
         '\u201cThat grain barge variance had been holding up filings downstream.\u201d'],
        ['\u201cShould have been caught before it sat two months.',
         'But at least it\u2019s done.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Dock labourer — Fen. Local, not transient. Knows this tavern well.
  // Workday: col 3, row 5 (west table near bar). Dayoff: col 3, row 11 (south, resting).
  {
    id:         'dock_labourer',
    name:       'Fen',
    get map()   { return 'drenwick_tavern'; },
    get x()     { return 3.5 * TILE; },
    get y()     { return day % 5 === 0 ? 11.5 * TILE : 5.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      const pages = day % 5 === 0
        ? [
            ['\u201cDay off.\u201d',
             '\u201cNot going anywhere, though.\u201d'],
          ]
        : [
            ['\u201cUsed to be the old man ran this place like it was a tight ship.\u201d',
             '\u201cTables got cleared without asking. You knew where things were.\u201d',
             '\u201cStill standing, though.\u201d'],
            ['\u201cEight gold a day.\u201d',
             '\u201cWhich is what it was four years ago. Everything else has gone up.\u201d'],
          ];
      if (sentry_quest_done) pages.push(
        ['\u201cNorth road\u2019s open.\u201d',
         '\u201cWatchers were on it for over a week.',
         'Cost someone a contract to clear whatever was out there.\u201d'],
        ['\u201cI don\u2019t take that road myself.',
         'But I know people who do.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Local regular — Mira. Not a dock worker, does something else nearby.
  // Comes here because it\u2019s cheap and close. Same position workday and dayoff.
  {
    id:         'tavern_local',
    name:       'Mira',
    get map()   { return 'drenwick_tavern'; },
    x:           4.5 * TILE,
    y:          11.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      return day % 5 === 0
        ? [
            ['\u201cStill cheap. Still close. Still here.\u201d',
             '\u201cThat\u2019s the review. Quote me.\u201d'],
          ]
        : [
            ['\u201cCheap and close. The wine\u2019s bad. I stay anyway.\u201d',
             '\u201cDraw your own conclusions about me. I have.\u201d'],
            ['\u201cThose two in the far corner have been here two nights running.\u201d',
             '\u201cNot dock workers. Not traders. Not talking, either \u2014 which is the tell.\u201d',
             '\u201cNothing to do with me. I\u2019m very good at things being nothing to do with me.\u201d'],
          ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Off-note figure 1 — dark coat, too clean for dock work, not worn enough for a traveller.
  // Watching rather than talking. Absent on dayoff.
  {
    id:         'corner_figure_1',
    name:       '',
    get map()   { return day % 5 === 0 ? null : 'drenwick_tavern'; },
    x:          12.5 * TILE,
    y:          10.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'traveler',
    dialogue: [
      ['\u201cWe\u2019re done here.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Off-note figure 2 — leaner, same wrong-for-the-room quality as figure 1.
  // Redirects rather than closes. Assessing rather than chatting. Absent on dayoff.
  {
    id:         'corner_figure_2',
    name:       '',
    get map()   { return day % 5 === 0 ? null : 'drenwick_tavern'; },
    x:          13.5 * TILE,
    y:          10.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'traveler',
    dialogue: [
      ['\u201cWhat are you carrying?\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Stretchy — a regular with no further explanation offered.
  {
    id:         'stretchy',
    name:       'Stretchy',
    get map()   { return 'drenwick_tavern'; },
    x:           9.5 * TILE,
    y:          11.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['You can call me Stretchy.'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Drenwick Canal/Docks Building Interiors ──────────────────────────────────

  // Harbormaster office — Renn (interior presence, col 7 row 5)
  // Absent on dayoff: office formally closed, though Renn checks water levels outside.
  // Weighmaster function folded in: single post now certifies cargo weights and
  // logs channel traffic. Used to be a separate office; consolidated when traffic declined.
  {
    id:         'harbormaster_interior',
    name:       'Harbormaster Renn',
    get map()   { return day % 5 === 0 ? null : 'drenwick_harbormaster'; },
    x:           7.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      const pages = [
        ['\u201cEvery cargo that moves through the lock gets a weight certificate from this counter.\u201d',
         '\u201cIf it isn\u2019t logged here, it doesn\u2019t move through. That\u2019s been the rule since before my posting.\u201d'],
        ['\u201cThe weighmaster post used to be separate. Different office, different reporting chain, two sets of ledgers.\u201d',
         '\u201cWhen the traffic fell off, the district rolled it into this posting. Saves a salary. The workload supports it \u2014 just barely.\u201d'],
        ['\u201cLast barge came in three units light on the scheduled load.\u201d',
         '\u201cThe captain logged a weir delay at the upper channel. I\u2019ve filed it. It goes on the monthly channel report to the district.\u201d'],
      ];
      if (weight_quest_stage >= 4) pages.push(
        ['\u201cThe weight discrepancy is filed and cross-referenced.\u201d',
         '\u201cBoth offices now agree on the load figure.',
         'Variance is within tolerance once the copy error\u2019s corrected.\u201d'],
        ['\u201cFirst clean cycle-close in three months.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Wash house — Kern, attendant (col 7 row 4)
  // Civic facility: always open, including dayoff. Small coin charge for soap and towels.
  {
    id:         'wash_attendant',
    name:       'Kern',
    map:        'drenwick_wash_house',
    x:           7.5 * TILE,
    y:           4.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cWater\u2019s heated from six to three.\u201d',
       '\u201cSoap\u2019s a coin. Towel hire\u2019s a coin \u2014 return it before you leave.\u201d'],
      ['\u201cMostly canal workers.\u201d',
       '\u201cMs. Farne brings the upper school twice a cycle before their end-of-term filings.\u201d',
       '\u201cShe books it in advance. Keeps things orderly.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Drenwick Infirmary staff & occupants (map 'drenwick_infirmary') ────────
  // Only ever met via the chamber dream sequence, when the player wakes here.
  // Senior commonborn infirmarer — competent, overworked, relieved you're up.
  {
    id:         'infirmarer',
    name:       'Merrin',
    map:        'drenwick_infirmary',
    x:           3.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cAwake, and on your feet. Good. You had us guessing for a day and a night.\u201d',
       '\u201cDrink when you\u2019re thirsty, eat when you can keep it down, and don\u2019t go far yet.\u201d'],
      ['\u201cI set a reed-cutter\u2019s arm this morning and stitched a barge-hand before noon. You\u2019re the third thing the fen sent me this week that couldn\u2019t explain itself.\u201d',
       '\u201cI don\u2019t ask what people were doing out there. I put them back together and let them work it out after.\u201d'],
      ['\u201cNo miracles here. Clean water, boiled linen, splints, and patience. It\u2019s enough, most days.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },
  // Orderly / apprentice — near the stove and the clean-water supply.
  {
    id:         'infirmary_orderly',
    name:       'Fisk',
    map:        'drenwick_infirmary',
    x:          12.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'worker',
    dialogue: [
      ['\u201cKeep the pot on the boil \u2014 that\u2019s half my day. Boiled linen, or you may as well not bandage at all.\u201d'],
      ['\u201cWe get the cold-water ones off the canal all winter. You don\u2019t rub them warm, you warm them slow, by the stove. Rub them and the heart can stop. Nobody believes that till they\u2019ve seen it.\u201d'],
      ['\u201cAnd never let canal water near an open wound. I don\u2019t care how clean it looks \u2014 I\u2019ve watched a nick on a thumb turn a whole hand black.\u201d'],
      ['\u201cWhat we haven\u2019t got is a rareborn healer. Old Master Yeddin retired north five years back, and no one\u2019s been sent since.\u201d',
       '\u201cHalcyra keeps two to a ward. Drenwick\u2019s a district seat and it makes do with me and a copper pot. We\u2019re owed one. We\u2019re owed a lot of things.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },
  // A patient — occupies the ward; a short, understated line, no quest.
  {
    id:         'infirmary_patient',
    name:       'Odger',
    map:        'drenwick_infirmary',
    x:           7.5 * TILE,
    y:           4.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'patron',
    dialogue: [
      ['He is propped up in the near bed, one leg splinted straight out.',
       '\u201cSlipped on the lock stair. Three weeks, they tell me.\u201d'],
      ['\u201cCould be worse. The bed\u2019s warm, and every one of them faces the stove.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },
  // Esla — the colleague who found the player in the marshes and brought them
  // back. Physically present at the bedside; the scripted wake dialogue plays
  // on arrival, this is her follow-up if spoken to again.
  {
    id:         'infirmary_esla',
    name:       'Esla',
    map:        'drenwick_infirmary',
    x:           8.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cDon\u2019t thank me. Just don\u2019t make me do it twice.\u201d'],
      ['\u201cWhen they say you\u2019re fit to travel, I\u2019ll see you as far as the coach road. Not before.\u201d'],
      ['\u201cI still don\u2019t know what took you out into that fen. You can keep it to yourself.\u201d',
       '\u201cBut I saw the state you came back in. I won\u2019t forget that soon.\u201d'],
    ],
    flag_required: null, flag_sets: null, action: null,
  },

  // Provision store — Oda, store clerk (col 7 row 5)
  // Imperial civic provisions: dry goods, salted catch, preserved roots.
  // Absent on dayoff: store formally closed, the accounts reconciled overnight.
  {
    id:         'provision_clerk',
    name:       'Oda',
    get map()   { return day % 5 === 0 ? null : 'drenwick_provision_store'; },
    x:           7.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cDry rations, salted catch, preserved roots. All priced on the board.\u201d',
       '\u201cPay cash at the counter and it\u2019s yours. Simple as that.\u201d'],
      ['\u201cA registered household can run a larger order on account instead of settling coin every visit.\u201d',
       '\u201cYour district registry card just tells me which household and which billing address. That\u2019s all it does \u2014 it\u2019s not a claim on free goods.\u201d'],
      ['\u201cBarge delivery is the second and fourth day of each cycle.\u201d',
       '\u201cIf something\u2019s out of stock, I\u2019ll put it on the order for the next run. Cash or account, your choice when it lands.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Harbormaster office — Sela, junior records clerk (col 5 row 8)
  // Present most days; absent on dayoff (office closed) and occasionally on rounds (day%5===2).
  {
    id:         'harbor_clerk',
    name:       'Sela',
    get map()   { return (day % 5 === 0 || day % 5 === 2) ? null : 'drenwick_harbormaster'; },
    x:           5.5 * TILE,
    y:           8.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['\u201cI\u2019m copying the channel transit records into the quarterly ledger.\u201d',
       '\u201cIt sounds tedious. It is.\u201d'],
      ['\u201cEvery barge gets logged twice \u2014 once at the lock gate and once at the weighmaster\u2019s counter.\u201d',
       '\u201cIf the two entries don\u2019t match, Renn has to write a variance note. He hates variance notes.\u201d'],
      ['\u201cWe had a captain last cycle try to argue his cargo weight in court.\u201d',
       '\u201cBrought his own scales. The judge asked if he\u2019d certified those scales.\u201d',
       '\u201cHe hadn\u2019t.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Wash house — Wynn, canal worker (col 10 row 6)
  // Present on working days but not dayoff or the day after.
  {
    id:         'wash_regular',
    name:       'Wynn',
    get map()   { return (day % 5 === 0 || day % 5 === 1) ? null : 'drenwick_wash_house'; },
    x:          10.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'worker',
    dialogue: [
      ['\u201cKern runs a tight ship. Water\u2019s always hot.\u201d',
       '\u201cThat matters more than you\u2019d think when you\u2019ve been at the gate all morning.\u201d'],
      ['\u201cI come in three times a cycle or so.\u201d',
       '\u201cThe gate work gets into your hands.\u201d',
       '\u201cMud and grease and lock oil. Kern\u2019s soap shifts it.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Provision store — Tallin, district provisioning inspector (col 8 row 5)
  // Visits on inspection days only (day%5 === 3), absent otherwise.
  {
    id:         'provision_inspector',
    name:       'Tallin',
    get map()   { return day % 5 === 3 ? 'drenwick_provision_store' : null; },
    x:           8.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cTallin. District Provisioning Inspector, Provisioning Subdirectorate, Drenwick seat.\u201d',
       '\u201cMy office is the reconciliation of the order ledgers against the district household registry \u2014 which households owe, which have settled. Precise work. Not, I am given to understand, interesting work. I reject the premise entirely.\u201d'],
      ['\u201cThe clerk Oda maintains records of a commendable cleanliness. My own function is chiefly one of ratification \u2014 the affixing of the seal, the conferral of official countenance.\u201d',
       '\u201c\u2018A stamp,\u2019 says the layman. A stamp. As though the sun merely rises.\u201d'],
      ['\u201cI will note, for the record, that the reed-oil order stands delayed three cycles consecutive.\u201d',
       '\u201cI have filed the requisite memorandum. In the fullness of bureaucratic time, a superior office shall deign to act upon it. Or shall not. Both outcomes are, procedurally, complete.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Drenwick East Apartment Residents ────────────────────────────────────────

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

  // Corridor B1, Unit 3 — Maeve (young mother, child identified as rareborn)
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
      ['\u201cSorry. She\u2019s sleeping.\u201d',
       '\u201cShe\u2019s two. She sleeps badly.\u201d',
       '\u201cWe\u2019re managing.\u201d'],
      ['\u201cThe registrar came last week.\u201d',
       '\u201cWhen a child is identified, they send a registrar. It\u2019s standard Imperial procedure. There\u2019s a form.\u201d',
       '\u201cShe\u2019s on the Lumina register now. That\u2019s not \u2014 it doesn\u2019t mean anything changes right away. But it\u2019s a record.\u201d'],
      ['\u201cOne in three hundred.\u201d',
       '\u201cThat\u2019s the rate. It doesn\u2019t run in families. There\u2019s no reason it was her.\u201d',
       '\u201cShe didn\u2019t know. She knocked over a cup and it just \u2014 stayed where it was, in the air, for a moment. And then it fell.\u201d',
       '\u201cShe laughed. She thought it was funny.\u201d'],
      ['\u201cPeople are kind, mostly. Orla upstairs brought food.\u201d',
       '\u201cSome people get strange. Like she\u2019s different now. She\u2019s the same child she was a month ago.\u201d',
       '\u201cThe Empire has a process. Lumina has a process. I keep telling myself that\u2019s a good thing.\u201d'],
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
  // yields the Tweezers key item. See HOUSE_DATA.drenwick_apt_c1_u4 for the
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

  // Drenwick Guild Hall — Canal Engineers' Guild
  // Foss: registrar, always present; Cae: senior member, dayoff only
  {
    id:            'guild_registrar',
    name:          'Foss',
    map:           'drenwick_guild_hall',
    x:              3.5 * TILE,
    y:              4.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'clerk',
    get dialogue() {
      const pages = [
        ['\u201cCanal Engineers\u2019 Guild.',
         'If you\u2019re here about the apprentice post, bring your arithmetic certification.',
         'We don\u2019t make exceptions on that.\u201d'],
        ['\u201cDues are paid by the fifth of each cycle.',
         'Late dues carry a surcharge. The surcharge is not waived.\u201d',
         '\u201cThis is not a policy I invented. It predates me by fifty years.\u201d'],
        ['\u201cThe posting board is on the far wall.',
         'Members\u2019 notices go on the left. Guild business on the right.',
         'If you can\u2019t tell the difference, the board will teach you.\u201d'],
      ];
      // Ruins documentation is this region's trade (see LORE.md: structures
      // emerge from the mud in dry years). The guild hears about uncovered
      // masonry the way guilds hear about everything.
      if (reservoir_quest_started) pages.push(
        ['\u201cIf your basin assignment turns up masonry, and in a dry year it will:\u201d',
         '\u201cSubmerged works predating the guild\u2019s charter are documentation class three.\u201d'],
        ['\u201cThat means drawings, dimensions, and no opinions.\u201d',
         '\u201cThe opinions come later, from people with worse handwriting.\u201d']
      );
      return pages;
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  // Hopeful apprentice-post applicant — workdays only, planted in front of
  // the posting board (r2 c13; she stands one tile west of the reading spot).
  // Ties into Ms. Farne's placement-board lore: two notices this cycle where
  // there used to be nine.
  {
    id:            'guild_applicant',
    name:          'Senna',
    get map()      { return day % 5 === 0 ? null : 'drenwick_guild_hall'; },
    x:             12.5 * TILE,
    y:              2.5 * TILE,
    solid:         true,
    facing:        'right',
    spriteType:    'child',
    dialogue: [
      ['“I’m not in the queue. There isn’t a queue.',
       'I’m just reading the notice again.”'],
      ['“One apprentice post. My teacher says the board used to carry nine notices a cycle.”',
       '“Everyone’s waiting to see if the canal keeps its depth before they take anyone on.”'],
      ['“I have the arithmetic certification. I sat it twice to get the mark I wanted.”',
       '“Now I mostly stand here and re-read the word ‘shortlist.’”'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:            'guild_senior',
    name:          'Cae',
    get map()      { return day % 5 === 0 ? 'drenwick_guild_hall' : null; },
    x:              8.5 * TILE,
    y:              7.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    dialogue: [
      ['\u201cThirty-one years.',
       'I know every gate on the Drenwick line by its sound.\u201d',
       '\u201cYou get to know a gate. What it takes. When it\u2019s struggling.\u201d'],
      ['\u201cThe guild used to set rates.',
       'Now we advise on rates.',
       '\u201cWhich means the rates are what they would\u2019ve been anyway, just slower.\u201d'],
      ['\u201cYoung people come in asking about the apprentice post.',
       'I tell them: the canal doesn\u2019t care how good your certification is.',
       'It only cares whether the gate opens.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Waterfront — Retired Dockworker (Ossel)
  // Far-right back corner of the tavern (col 13, row 4) — a claimed regular seat.
  // Always present; no dayoff variation.
  {
    id:         'retired_dockworker',
    name:       'Ossel',
    map:        'drenwick_inn',
    x:          13.5 * TILE,
    y:           4.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['\u201cI tell ya, When the aetherrail opened, the Registry followed it northeast.\u201d',
       '\u201cThe officials went first. Then the clerks who served them.\u201d',
       '\u201cAfter that, the inns stopped keeping rooms ready.\u201d'],
      ['\u201cA full quay had a sound to it.\u201d',
       '\u201cRopes under strain. Tallymen shouting. Hulls against the pilings all night.\u201d',
       '\u201cYou could lie awake and know the town was earning its keep.\u201d'],
      ['\u201cMy daughter left for the rail line when she was nineteen.\u201d',
       '\u201cShe wrote that the station lamps stayed lit all night, bright as a second noon.\u201d',
       '\u201cI was proud of her. I still am.\u201d',
       '\u201cPride does not make a house less quiet.\u201d'],
      ['\u201cThe Empire never closed the canal.\u201d',
       '\u201cIt simply built something faster somewhere else.\u201d',
       '\u201cThat is how a town is left behind now.\u201d',
       '\u201cNot by decree. One route, one office, one family at a time.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Waterfront — Tavern Regular (Bette)
  // Center of the common room (col 7, row 5) — separate from Ossel and Mallow.
  // Present on dayoffs too, same seat, shorter dialogue.
  {
    id:         'tavern_regular',
    name:       'Bette',
    map:        'drenwick_inn',
    x:           7.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      return day % 5 === 0
        ? [
            ['\u201cSame seat. Same drink.\u201d',
             '\u201cI could go somewhere else on Dayoff, but this one\u2019s got a good window.\u201d'],
          ]
        : [
            ['\u201cLong day.\u201d',
             '\u201cNothing went wrong. It just kept going.\u201d'],
            ['\u201cCanal\u2019s down a hand this month. You feel it in the trade \u2014 fewer boats, longer faces.\u201d',
             '\u201cDrenwick lives on that water moving. Nobody says it out loud, but everyone\u2019s counting the same barges.\u201d'],
          ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Drenwick Market — Post Relay counter clerk (col 14, row 8, east lane)
  // Not present on dayoff (null map). No interior — counter only.
  {
    id:         'post_relay_clerk',
    name:       'Relay Clerk',
    get map()   { return day % 5 === 0 ? null : 'drenwick_market'; },
    x:          14.5 * TILE,
    y:           8.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    dialogue: [
      ['\u201cPost Relay. Parcels, sealed letters, priority packet.\u201d',
       '\u201cStandard transit is three to four days east. Faster if you pay the courier rate.\u201d'],
      ['\u201cAnything going north needs to clear the Drenwick staging post first.\u201d',
       '\u201cIt comes back through here on return. If it hasn\u2019t arrived, it hasn\u2019t left the staging post yet.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Drenwick School NPCs ─────────────────────────────────────────────────────

  // Ground floor teacher — younger cohort (ages 6-9)
  {
    id:         'drenwick_teacher_ground',
    name:       'Mr. Oben',
    // Dayoff: at the wash house (bench by the west wall), gloriously unasked.
    get map()   { return day % 5 === 0 ? 'drenwick_wash_house' : 'drenwick_school_ground'; },
    get x()     { return day % 5 === 0 ? 4.5 * TILE : 7.5 * TILE; },
    get y()     { return day % 5 === 0 ? 9.5 * TILE : 3.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      if (day % 5 === 0) return [
        ['\u201cEight-year-olds, five days out of five, would be the end of me.\u201d',
         '\u201cWhoever wrote the fifth day into the school code understood teaching.\u201d'],
        ['\u201cOn Dayoff I come here, I sit in the steam, and nobody asks me a single question.\u201d',
         '\u201cIt\u2019s the questions, you understand. Not the children.',
         'The questions.\u201d'],
        ['\u201cA boy asked me yesterday where the canal water has gone.\u201d',
         '\u201cI told him: downhill, same as ever. Just less of it.\u201d',
         '\u201cHe wrote it down. I rather wish I hadn\u2019t watched him write it down.\u201d'],
      ];
      return [
      ['\u201cAgain, please. Water flows from higher ground to lower ground.\u201d',
       '\u201cIf you can remember that, the rest of the canal lesson makes itself.\u201d'],
      ['\u201cThe Accord is the simplest thing to explain to a young child.\u201d',
       '\u201cYou look at the colour of someone\u2019s hair. If it isn\u2019t the usual colours, that person is rareborn, and there are rules that apply.\u201d',
       '\u201cSix-year-olds understand this immediately. It\u2019s a visible fact. They can see it.\u201d'],
      ['\u201cOne of them asked me this morning whether rain is made of the same water as the canal.\u201d',
       '\u201cIt is, in a way. I wasn\u2019t expecting to spend half the lesson on the water cycle, but here we are.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Ground floor students (ages 6-9) — two rows of four, cols 3/5/8/10
  {
    id:         'drenwick_gs_1',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_ground'; },
    x:           3.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cMr. Oben says water always goes downhill.\u201d',
       '\u201cSo how does a canal lock lift a barge?\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_gs_2',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_ground'; },
    x:           5.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI lost my lunch somewhere between the path and the canal.\u201d',
       '\u201cI think Edric took it. He always acts like he didn\u2019t.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_gs_3',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_ground'; },
    x:           8.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI know all my numbers up to a hundred.\u201d',
       '\u201cMr. Oben says that\u2019s very good for my age.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_gs_4',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_ground'; },
    x:          10.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI don\u2019t understand why the Accord matters.\u201d',
       '\u201cMr. Oben says I\u2019ll understand when I\u2019m older, but he says that about everything.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_gs_5',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_ground'; },
    x:           3.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cThe canal is very long.\u201d',
       '\u201cMr. Oben showed us on the map. It goes all the way to the coast, he said.\u201d'],
      ['\u201cAnd the water ends up in the Valmere eventually. That\u2019s the really big sea, way out east.\u201d',
       '\u201cMr. Oben says our Thornmere would fit inside it forty times.',
       'I counted the map squares. It\u2019s more like fifty.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_gs_6',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_ground'; },
    x:           5.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI want to be a boatman when I grow up.\u201d',
       '\u201cMy da says there isn\u2019t much work in it anymore, but I still want to.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_gs_7',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_ground'; },
    x:           8.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    // The same rareborn spotting-rhyme is known in Drenwick too. If the player
    // has already heard it (from the Calwick school child \u2014 rareborn_rhyme_heard),
    // this child begins reciting, then clocks the recognition on the player's
    // face and trails off. Otherwise it's just an ordinary schoolyard remark.
    get dialogue() {
      if (rareborn_rhyme_heard) {
        return [
          ['\u201cIf hair burns red, or blooms in blue or gre\u2014\u201d'],
          ['The child stops, looking at your face.',
           '\u201cOh. You already know it.\u201d',
           '\u201cEveryone always already knows it.\u201d'],
        ];
      }
      return [
        ['\u201cWe had porridge again this morning.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_gs_8',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_ground'; },
    x:          10.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI already know what the Accord is.\u201d',
       '\u201cMy mum explained it. She said it\u2019s the law about rareborn people and how they have to be counted.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Upper floor teacher — older cohort (ages 9-12)
  {
    id:         'drenwick_teacher_upper',
    name:       'Ms. Farne',
    // Dayoff: at the Drenwick inn (south end, past the rhen table).
    get map()   { return day % 5 === 0 ? 'drenwick_inn' : 'drenwick_school_upper'; },
    get x()     { return day % 5 === 0 ? 12.5 * TILE : 7.5 * TILE; },
    get y()     { return day % 5 === 0 ? 11.5 * TILE : 3.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      if (day % 5 === 0) return [
        ['\u201cThe Calwick investigator. Off the clock, then \u2014 so am I.\u201d',
         '\u201cIn the classroom I\u2019m a great believer. In here I keep the receipts.\u201d'],
        ['\u201cTake Mera Dren, since I taught her again this week. True story, every word.\u201d',
         '\u201cAlso true: the Empire\u2019s own road planners put the problem through her village to begin with, and for every petition that moves a road, a stack of correct ones rots unanswered in a district drawer.\u201d',
         '\u201cI don\u2019t say that part at the front of the room. The pamphlet is cheerier, and the children are twelve.\u201d'],
        ['\u201cAnd the Accord I praise so warmly? It wasn\u2019t mercy. It was arithmetic \u2014 the old killing stopped controlling anything, so the Council stopped paying for it.\u201d',
         '\u201c\u2018A structured, permanent framework,\u2019 I tell them. I make it sound like grace. It was a ledger.\u201d'],
        ['\u201cDon\u2019t mistake me \u2014 I mean every cheerful word I give them. The system mostly works, and a child who can file a clean petition is better armed than one who can\u2019t.\u201d',
         'She lifts her cup very slightly.',
         '\u201cBut one day in five, I get to teach the whole of it. To the fifth day.\u201d'],
      ];
      return [
        ['\u201cDistrict tier this week \u2014 my favourite unit!\u201d',
         '\u201cFive clean levels: Imperial, Regional, District, Municipal, Local. Everything reporting neatly upward. Isn\u2019t that marvellous?\u201d'],
        ['\u201cDrenwick is a district seat, which means there\u2019s a whole ladder above you.\u201d',
         '\u201cThe Empire built it on purpose, for people exactly like you. Chin up and climb.\u201d'],
        ['\u201cThe cabinet behind me holds the final-year files, and I do love a file that ends happily.\u201d',
         '\u201cReport cards, placements, a tidy record for every child who passes through.\u201d'],
        ['\u201cWhen in doubt, write straight to the guild offices. A polite letter opens more doors than a sulk ever will!\u201d'],
        ['\u201cAnd the Petition of Mera Dren \u2014 every schoolroom does it, and rightly!\u201d',
         '\u201cA fen girl filed a clean petition, and the district moved an Imperial road clear of her well.\u201d'],
        ['\u201c\u2018Be a Mera,\u2019 the pamphlets say \u2014 and so do I.\u201d',
         '\u201cA child who can write a proper petition holds real power. That is the Empire keeping its promises.\u201d'],
        ['\u201cYou want the hard history? The Accord wasn\u2019t passed easily. Centuries of resistance came first.\u201d'],
        ['\u201cThe hardliners said any concession would unravel control \u2014 that the old execution law kept a useful fear in place.\u201d'],
        ['\u201cIt only changed when the cruelty stopped working. Hidden networks grew too large; the purges kept failing.\u201d'],
        ['\u201cSo the Empire looked at centuries of its own failure and, in the end, chose a better way.\u201d',
         '\u201cNot every power in history managed that. Ours did.\u201d'],
        ['\u201cThe basement archive has the full instrument, if you\u2019d like the legal language.\u201d',
         '\u201cIt\u2019s \u2014 thorough. Gloriously thorough.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Upper floor students (ages 9-12) — two rows of four, cols 3/5/8/10
  {
    id:         'drenwick_us_1',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_upper'; },
    x:           3.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI\u2019ve already written to the district registry office.\u201d',
       '\u201cI want to work for the empire just like my dad. Ms. Farne says I have to wait until I\u2019m twelve to apply formally, but there\u2019s no harm in writing first.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_us_2',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_upper'; },
    x:           5.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI don\u2019t know what I\u2019m going to do yet. Everyone else knows. How does everyone else know?\u201d',
       '\u201cMarn wants the canal guild. Pel wants the registry. I asked Pel how she knew and she looked at me like the knowing came free with breakfast and I\u2019d missed mine.\u201d'],
      ['\u201cWhat if I choose wrong? You only get the one Placement. What if I pick the canal guild and I\u2019m secretly a registry person and I don\u2019t find out until I\u2019m forty and it\u2019s too late and \u2014\u201d',
       '\u201c\u2014 sorry. Ms. Farne says I do this. I\u2019m doing it right now, aren\u2019t I. I can hear that I\u2019m doing it.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_us_3',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_upper'; },
    x:           8.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI\u2019m going back to help my parents after this year.\u201d',
       '\u201cThey have a cooperage out on the west side. It\u2019s fine. Someone has to do it.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_us_4',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_upper'; },
    x:          10.5 * TILE,
    y:           6.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cThe chart says the Regional Administrator outranks the District Prefect.\u201d',
       '\u201cBut Ms. Farne said the District Prefect controls the local garrison. So who actually has authority in an emergency?\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_us_5',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_upper'; },
    x:           3.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI opened my fridge and found a single cucumber wrapped in tinfoil.\u201d',
       '\u201cThere was a note attached that said: NEVER LET HIM OUT AGAIN.\u201d',
       '\u201cI don\u2019t even remember buying a cucumber.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_us_6',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_upper'; },
    x:           5.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    hairColor:  '#e88ab0',
    dialogue: [
      ['\u201cI\u2019m rosebound \u2014 the pink. It\u2019s a thread, for mending: bodies, and the parts of people that come loose.\u201d',
       '\u201cI can tell when someone in the room is about to cry before they can. It isn\u2019t a trick. It\u2019s just what I am.\u201d'],
      ['\u201cAfter this year I have to go \u2014 the Academy, up north. My friends get to stay here with their parents.\u201d',
       '\u201cI know why I can\u2019t. Knowing why doesn\u2019t make it feel fair.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_us_7',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_upper'; },
    x:           8.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    // Was a one-line placeholder ("I'm very tired."). Kept the weary opener,
    // then a tired kid half-reciting a geography lesson \u2014 the two canon facts
    // no other NPC mentions (LORE.md, "The World"): the Continent sits in the
    // southern hemisphere (so north is warm, south is cold), and a permanent
    // resonance storm at the equator seals off the world's northern half, and
    // is pointedly never explained.
    dialogue: [
      ['\u201cI\u2019m very tired.\u201d'],
      ['\u201cWe had to copy the whole big map. North is the warm way, Ms. Farne says, and south is the cold way, right down to the ice.\u201d',
       '\u201cAnd there\u2019s a storm all round the middle of the world that never stops, so no ship can get past it to the top half.\u201d'],
      ['\u201cI asked her why the storm is there.',
       'She said nobody knows. Nobody has ever known.\u201d',
       '\u201cThat\u2019s the part I keep thinking about instead of sleeping.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'drenwick_us_8',
    name:       'Student',
    get map()   { return day % 5 === 0 ? null : 'drenwick_school_upper'; },
    x:          10.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI heard there\u2019s a placement at the grain weighing office.\u201d',
       '\u201cIt\u2019s not on the board yet. Maybe it\u2019ll go up before end of term.\u201d'],
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

  // ── MAP2 herbalist — lives in her farmhouse (cols 1-3 row 11-12 on MAP2) ──
  {
    id:            'lorra',
    name:          'Lorra',
    map:           'lorra_house',
    x:              7.5 * TILE,
    y:              4.5 * TILE,
    solid:         true,
    facing:        'down',
    spriteType:    'patron',
    flag_required: null,
    flag_sets:     null,
    action:        'lorraShop',
  },

  // ── Drenwick guard post (MAP3_N2 approach, row 12 col 11) ─────────────────
  {
    id:            'tarvec',
    name:          'Constable Tarvec',
    map:           'drenwick_post',
    x:              7.5 * TILE,
    y:              4.5 * TILE,
    solid:         true,
    facing:        'down',
    dialogue: [
      ['\u201cYou\u2019re on the fen approach.\u201d', '\u201cDrenwick gate is north — straight up the road.\u201d'],
      ['\u201cBe aware the canal bridge narrows at the middle.\u201d',
       '\u201cDon\u2019t try to pass a loaded cart there.\u201d'],
      ['\u201cAnything else, speak to the duty officer in town.\u201d'],
    ],
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

  // ─── The Falls hamlet — MAP3_N1 SW corner (rows 10-13, cols 1-4) ─────────────
  // A handful of households living off the fen between Drenwick and the open marsh.
  // No Imperial registration. They fish eels from the cold spring and cut reeds.
  // Named after the low cascade at the fen's south edge — the "Falls" locals call it.
  // Gridd — Room B (cols 6-9) of HAMLET_INTERIOR_MAP
  {
    id:         'hamlet_gridd',
    name:       'Gridd',
    map:        'hamlet_interior',
    x:           8.5 * TILE,
    y:           8.5 * TILE,
    solid:       true,
    facing:     'left',
    spriteType: 'worker',
    dialogue:   [],  // all dialogue routed through action
    flag_required: null,
    flag_sets:     null,
    action:        'griddRainfishWarn',
  },
  // Mabel — Room C (cols 11-14) of HAMLET_INTERIOR_MAP
  {
    id:         'hamlet_mabel',
    name:       'Mabel',
    map:        'hamlet_interior',
    x:          12.5 * TILE,
    y:           8.5 * TILE,
    solid:       true,
    facing:     'right',
    spriteType: 'patron',
    dialogue:   [],  // all dialogue routed through action
    flag_required: null,
    flag_sets:     null,
    action:        'mabelSickleQuest',
  },
  // Corvel — Room A (cols 1-4) of HAMLET_INTERIOR_MAP
  {
    id:         'hamlet_corvel',
    name:       'Corvel',
    map:        'hamlet_interior',
    x:           2.5 * TILE,
    y:           8.5 * TILE,
    solid:       true,
    facing:     'right',
    spriteType: 'worker',
    dialogue: [
      ['\u201cI\u2019m thinking about going to Drenwick.\u201d',
       '\u201cNot permanently. Just to look around. See if there\u2019s work.\u201d',
       '\u201cMabel says I\u2019ll come back. She\u2019s usually right.\u201d'],
      ['\u201cGridd says the eel prices are going up in Drenwick because the canal trade is changing.\u201d',
       '\u201cIf we smoked them ourselves and brought them in, we\u2019d get twice the price.\u201d',
       '\u201cWe\u2019d need a boat. And a smoker. And someone willing to pole a boat to Drenwick once a week.\u201d'],
      ['\u201cThe falls are at their loudest after rain.\u201d',
       '\u201cIt\u2019s not a dramatic waterfall. More of a long step down.\u201d',
       '\u201cBut the sound carries, and after a while it gets inside you and you stop noticing it,',
       'and then when you\u2019re away for a while, you miss it.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  // Imber — Room C (with Mabel) of HAMLET_INTERIOR_MAP
  {
    id:         'hamlet_imber',
    name:       'Imber',
    map:        'hamlet_interior',
    x:          13.5 * TILE,
    y:          11.5 * TILE,
    solid:       false,
    facing:     'up',
    spriteType: 'child',
    dialogue: [
      ['\u201cI found a bone near the falls.\u201d',
       '\u201cGridd says it\u2019s from a large eel. Mabel says it\u2019s too big for an eel.\u201d',
       '\u201cI\u2019ve decided not to ask anyone else in case they also disagree.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── Calwick town square — produce stall (Rand) ──────────────────────────────
  {
    id:         'rand_vendor',
    name:       'Rand',
    map:        'town',
    x:           6.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      return day % 5 === 0
        ? [
            ['\u201cClosed, technically. Dayoff. Though here I am, stall and all \u2014 which reminds me of my uncle, who also couldn\u2019t sit still, terrible man, lovely singing voice \u2014\u201d',
             '\u201c\u2014 where was I. Dayoff. Yes. That.\u201d'],
          ]
        : [
            ['\u201cRoot turnips, smoked eel, preserved canal rye. All out the fen. Now the canal rye, there\u2019s a story behind that \u2014 well, not a story exactly, more of a\u2026\u201d',
             '\u201c\u2026and I\u2019ve lost it. It\u2019ll come back. They always come back. Buy the turnips while we wait.\u201d'],
            ['\u201cSmoked eel keeps three weeks if you wrap it right. My mother wrapped it right. My mother wrapped everything right, rest her \u2014 including, once, memorably, a cat \u2014\u201d',
             '\u201c\u2014 no. Different thing entirely. The point, and I do have one: most folk don\u2019t wrap it right.\u201d'],
            ['\u201cSixteen years at this stall. There\u2019s a worn patch in the paving, just there, shaped like my own two feet, and some mornings I stand in it and think \u2014\u201d',
             '\u201c\u2014 and then a customer comes and I never do finish the thought. Which is likely for the best. Now. What was it you wanted?\u201d'],
          ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── Calwick town — road maintenance worker (Lev) ────────────────────────────
  // Patches the square paving and the north approach road. On dayoff, at the inn.
  {
    id:         'lev_maintenance',
    name:       'Lev',
    get map()   { return day % 5 === 0 ? 'inn' : 'town'; },
    get x()     { return day % 5 === 0 ? 8.5 * TILE : 3.5 * TILE; },
    get y()     { return day % 5 === 0 ? 4.5 * TILE : 6.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      return day % 5 === 0
        ? [
            ['\u201cI\u2019m not looking at the road today.\u201d',
             '\u201cIf I look at it I\u2019ll see what needs doing.\u201d'],
          ]
        : [
            ['\u201cNorth approach has a heave near the third post.\u201d',
             '\u201cFreezing and thawing. Happens every year. Every year I write it up, every year it heaves.\u201d'],
            ['\u201cI patch and it comes back.\u201d',
             '\u201cBram does the school, I do the square and the roads.\u201d',
             '\u201cWe\u2019ve never actually spoken, but I know his work. He patches the same way I do.\u201d'],
            ['\u201cThe stone here is older than the current charter.\u201d',
             '\u201cI\u2019ve pulled up sections with imperial stamps from four hundred years back.\u201d',
             '\u201cThey used better mortar then. I don\u2019t know why we stopped.\u201d'],
          ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── Between Posts quest characters ──────────────────────────────────────────

  // Sena — Calwick main square, east side. On work days and dayoff.
  // Separated from Davan ~two years ago. Tev lives with her in Calwick.
  {
    id:         'sena',
    name:       'Sena',
    map:        'town',
    x:          10.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      if (drama_stage >= 5) return [
        ['\u201cHe\u2019s coming for the assessment.\u201d',
         '\u201cI don\u2019t know what happens after that.\u201d',
         '\u201cBut it\u2019s better than it was.\u201d'],
      ];
      return [['\u201cExcuse me. Sorry \u2014 I thought you were someone else.\u201d']];
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

  // Davan — Drenwick market, east stalls.
  // Works canal contracts; moved to Drenwick after the separation.
  {
    id:         'davan',
    name:       'Davan',
    map:        'drenwick_market',
    x:           9.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      if (drama_stage >= 5) return [
        ['\u201cI\u2019m heading up to Calwick next week.\u201d',
         '\u201cTev\u2019s assessment day.\u201d',
         '\u201cI wasn\u2019t going to miss it.\u201d'],
      ];
      return [['\u201cSorry. Not a good moment.\u201d']];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Tev — Sena and Davan's child, age ~9. At school on work days; in the main
  // Calwick square with Sena on Dayoff. Dialogue shifts with drama_stage.
  {
    id:         'tev',
    name:       'Tev',
    get map()   { return day % 5 === 0 ? 'town' : 'school'; },
    get x()     { return day % 5 === 0 ? 11.5 * TILE : 12.5 * TILE; },
    get y()     { return day % 5 === 0 ?  8.5 * TILE :  9.5 * TILE; },
    solid:      true,
    facing:     'down',
    spriteType: 'child',
    get dialogue() {
      if (drama_stage >= 5) return [
        ['\u201cDad\u2019s coming for my test.\u201d',
         '\u201cMum said maybe we can all have lunch after.\u201d',
         '\u201cI don\u2019t know what the maybe means.\u201d',
         '\u201cBut I think it\u2019s good.\u201d'],
      ];
      if (drama_stage >= 1) return [
        ['\u201cMum\u2019s been writing letters.\u201d',
         '\u201cShe said they\u2019re for a friend.\u201d',
         '\u201cShe always goes quiet after.\u201d'],
      ];
      return [
        ['\u201cI found a toad this morning.\u201d',
         '\u201cIt didn\u2019t want to be found.\u201d',
         '\u201cI found it anyway.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── Calwick inn — barge crew passing through (Stet) ─────────────────────────
  // One night in Calwick, moving on tomorrow. Has opinions about every stretch of canal.
  {
    id:         'stet_bargeman',
    name:       'Stet',
    map:        'inn',
    x:           6.5 * TILE,
    y:           4.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'traveler',
    dialogue: [
      ['\u201cOne night.\u201d',
       '\u201cThe barge is moored at the road landing east of here. Calwick cargo comes the rest of the way by cart.\u201d',
       '\u201cI came with the tally. Back aboard before dawn.\u201d'],
      ['\u201cCalwick isn\u2019t a canal town, whatever the merchants like to call it.\u201d',
       '\u201cA canal town smells of rope, wet timber, and dredge mud.\u201d',
       '\u201cThis place still smells of peat. I notice the difference.\u201d'],
      ['\u201cFurther east, the third weir\u2019s been at half-draw for months.\u201d',
       '\u201cYou feel it before you see it \u2014 the current bunches up against the gate.\u201d',
       '\u201cSomeone will call that a delay. Water doesn\u2019t care what the ledger calls it.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── Drenwick market — preserved goods vendor (Nora) ─────────────────────────
  // Corner of the east lane. Sells pickled roots, dried herbs, sealed reed-jars.
  // Always present; shorter dayoff dialogue.
  {
    id:         'nora_market',
    name:       'Nora',
    map:        'drenwick_market',
    x:           4.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue:   [],   // handled by NPC_ACTIONS.noraReagentShop (fen-goods vendor)
    flag_required: null,
    flag_sets:     null,
    action:        'noraReagentShop',
  },

  // ─── Drenwick canal docks — canal-margin fisher (Jost) ───────────────────────
  // Not a dock worker. Fishes the canal edge on a folding stool. Present most days.
  // Absent on dayoff (visiting family upstream) and inspection days.
  {
    id:         'jost_fisher',
    name:       'Jost',
    get map()   { return (day % 5 === 0 || day % 5 === 3) ? null : 'drenwick_canal_docks'; },
    x:           9.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'right',
    spriteType: 'patron',
    dialogue: [
      ['\u201cI\u2019m not dock crew. I just fish here.\u201d',
       '\u201cHarbormaster Renn looked at me for two weeks and then stopped.\u201d',
       '\u201cI think he decided it wasn\u2019t worth the form.\u201d'],
      ['\u201cCanal fish taste different from river fish.\u201d',
       '\u201cFlatter. More mineral.\u201d',
       '\u201cYou get used to it and then river fish starts tasting wrong instead.\u201d'],
      ['\u201cThe barge crew don\u2019t like me fishing this close to the lock.\u201d',
       '\u201cI understand their concern. I just don\u2019t agree with it.\u201d'],
      ['\u201cI\u2019ve never caught anything rare in this canal.\u201d',
       '\u201cSmelt, the occasional small eel. Once a very large boot.\u201d',
       '\u201cI keep coming back anyway. That\u2019s probably something.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
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

  // ─── Calwick school, exterior — parent waiting (Dula) ────────────────────────
  // Comes to collect a younger child most afternoons. On dayoff, not here.
  {
    id:         'dula_parent',
    name:       'Dula',
    get map()   { return day % 5 === 0 ? null : 'west'; },
    x:           5.5 * TILE,
    y:           4.5 * TILE,
    solid:      true,
    facing:     'up',
    spriteType: 'patron',
    get dialogue() {
      return [
        ['\u201cWaiting for the bell.\u201d'],
        ['\u201cShe comes out and immediately starts explaining something she learned.\u201d',
         '\u201cI rarely follow all of it.\u201d',
         '\u201cI\u2019ve stopped pretending I do. She\u2019s started explaining it better instead.\u201d'],
        ['\u201cMs. Vale sent a note home last week about the chalk.\u201d',
         '\u201cApparently my daughter broke three pieces in one afternoon.\u201d',
         '\u201cShe doesn\u2019t think chalk should be treated gently. She may have a point.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── Calwick inn — retired garrison soldier (Aldiss) ─────────────────────────
  // Left service twelve years ago. Lives in Calwick now. At the inn most evenings.
  {
    id:         'aldiss_soldier',
    name:       'Aldiss',
    map:        'inn',
    x:           4.5 * TILE,
    y:           8.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    dialogue: [
      ['\u201cTwelve years in the eastern garrison.\u201d',
       '\u201cNothing dramatic. Mostly I checked papers and watched roads.\u201d'],
      ['\u201cPeople imagine soldiering is different from what it is.\u201d',
       '\u201cIt\u2019s mostly being present. Being visibly present so nothing happens.\u201d',
       '\u201cWhen nothing happens, nobody thanks you for it. That\u2019s fine. That\u2019s the job.\u201d'],
      ['\u201cI heard about the post south of town.\u201d',
       '\u201cYou pick things up in here.\u201d',
       '\u201cA post with no flag and no log is not a post. That\u2019s just a building.\u201d'],
      ['\u201cThe fen looks quiet until it isn\u2019t.\u201d',
       '\u201cI don\u2019t mean anything specific by that.\u201d',
       '\u201cJust \u2014 it\u2019s a thing you learn to notice.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── Drenwick Inn — canal engineer waiting on a delayed part (Emse) ───────────
  // Stuck in Drenwick three days longer than expected. Has filled the time thoroughly.
  {
    id:         'emse_engineer',
    name:       'Emse',
    map:        'drenwick_inn',
    x:           5.5 * TILE,
    y:           4.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      return day % 5 === 0
        ? [
            ['\u201cStill waiting.\u201d',
             '\u201cOn my ninth day. The part left Halcyra twelve days ago.\u201d',
             '\u201cI\u2019ve started to find this funny. I think that\u2019s healthy.\u201d'],
          ]
        : [
            ['\u201cI\u2019m waiting on a gate casting from the supply depot north of here.\u201d',
             '\u201cIt was logged as dispatched six days ago.\u201d',
             '\u201cI\u2019ve spoken to the post relay. They have no record. This is also logged.\u201d'],
            ['\u201cI\u2019ve been drawing up every gate diagram I can remember while I wait.\u201d',
             '\u201cI have now run out of gates I can accurately remember.\u201d',
             '\u201cI\u2019ve started doing the ones I\u2019m less sure about. It keeps my hands busy.\u201d'],
            ['\u201cNast is decent company.\u201d',
             '\u201cDoesn\u2019t ask too many questions. Keeps the fire banked.\u201d',
             '\u201cAt this point I\u2019m considering adding him to my professional contacts.\u201d'],
          ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── Drenwick Inn — sailors (Dayoff only) ────────────────────────────────────
  // A crew off a canal barge, spending their day off at the inn.
  // Loud, unhurried, occupying more space than is strictly necessary.

  // Trinn — can't stop talking about the last run
  {
    id:         'sailor_trinn',
    name:       'Trinn',
    get map()   { return day % 5 === 0 ? 'drenwick_inn' : null; },
    x:           2.5 * TILE,
    y:           3.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['\u201cFour locks in two days. Upstream the whole way.\u201d',
       '\u201cThe second lock jammed. Took us three hours.\u201d',
       '\u201cThree. Hours.\u201d'],
      ['\u201cThe cargo was fine. Everything was fine.\u201d',
       '\u201cI\u2019m just saying, three hours is a long time to wait on a lock.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Wex — arguing with his drink
  {
    id:         'sailor_wex',
    name:       'Wex',
    get map()   { return day % 5 === 0 ? 'drenwick_inn' : null; },
    x:           9.5 * TILE,
    y:           8.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['\u201cNo.\u201d',
       'He shakes his head at his cup.',
       '\u201cNo.\u201d'],
      ['\u201cThat\u2019s not what happened.\u201d',
       '\u201cI was there. I know what happened.\u201d',
       '\u201cAsk anyone.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Loda — singing softly, slightly off-key
  {
    id:         'sailor_loda',
    name:       'Loda',
    get map()   { return day % 5 === 0 ? 'drenwick_inn' : null; },
    x:           2.5 * TILE,
    y:          10.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['\u201c\u2014 and the water takes what the water wants, hm-hm-hm\u2014\u201d',
       'She trails off.',
       '\u201cSorry. Didn\u2019t see you there.\u201d'],
      ['\u201cOld lock-song. You learn them if you do the upper run long enough.\u201d',
       '\u201cI can\u2019t remember if the words are right anymore.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Cabb — throwing dice against the wall, grumbling
  {
    id:         'sailor_cabb',
    name:       'Cabb',
    get map()   { return day % 5 === 0 ? 'drenwick_inn' : null; },
    x:          12.5 * TILE,
    y:           3.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['\u201cSixteen crates of salt biscuit.\u201d',
       '\u201cSixteen.\u201d',
       '\u201cWhy would anyone order that much salt biscuit.\u201d'],
      ['\u201cWe\u2019ll eat some of it. You have to. There\u2019s no room to be precious about cargo.\u201d',
       '\u201cStill. Sixteen crates.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Dorse — back against the wall, watching everything
  {
    id:         'sailor_dorse',
    name:       'Dorse',
    get map()   { return day % 5 === 0 ? 'drenwick_inn' : null; },
    x:           4.5 * TILE,
    y:          10.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue: [
      ['\u201cHm.\u201d'],
      ['\u201cYou\u2019re not a canal worker.\u201d',
       'He looks you over.',
       '\u201cNot a problem. Just noting.\u201d'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Kolm — the brawler; offers to fight the player for 50g
  {
    id:         'sailor_kolm',
    name:       'Kolm',
    get map()   { return day % 5 === 0 ? 'drenwick_inn' : null; },
    x:          10.5 * TILE,
    y:           3.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    dialogue:   [],   // handled entirely by NPC_ACTIONS.kolmBrawler
    flag_required: null,
    flag_sets:     null,
    action:        'kolmBrawler',
  },

  // ─── Mirethyst's Vault ────────────────────────────────────────────────────────
  // Old woman, commonborn, has lived in this sunken ruin for over twenty years.
  // Lonely and delighted by any visitor -- rambly, occasionally strange, forever
  // circling back to offering tea. She gives the Fen Cowl (which she made herself
  // years ago) only after the player accepts her tea and hears her out, as thanks
  // for the company -- not a reward for "finding" her (the vault isn't hidden).
  // Flow: intro ramble -> tea choice -> on accept, more ramble + the cowl grant;
  // on decline, a wistful line and no cowl (re-offered on the next visit).
  {
    id:         'mirethyst',
    name:       'Mirethyst',
    map:        'mire_vault',
    x:           7.5 * TILE,
    y:           2.5 * TILE,
    solid:       true,
    facing:     'down',
    spriteType: 'patron',
    dialogue:    null,   // handled entirely by action
    flag_required: null,
    flag_sets:     null,
    action: function() {
      if (window.mirethyst_rewarded) {
        // Return visits: still delighted, still rambling.
        dialogue.name  = 'Mirethyst';
        dialogue.pages = [
          ['She lights up when you duck in \u2014 no less of it than the first time.',
           '\u2018You came back! You came back. Sit, the left crate\u2019s still the dry one.\u2019',
           '\u2018Heron was early this morning. Doesn\u2019t mean anything. It just was. I tell you because there\u2019s no one else to tell, and now there\u2019s you.\u2019'],
          ['\u2018The kettle remembers you, I think. Ticks friendlier.\u2019',
           '\u2018Stay as long as you like. Longer. The eels won\u2019t mind, and neither will I.\u2019'],
        ];
        dialogue.callbacks = null;
        dialogue.open  = true;
        dialogue.page  = 0;
        return;
      }
      // First visit: glad of the company, rambling and a touch odd, and forever
      // circling back to tea. The cowl comes only if she is accepted and heard.
      dialogue.name  = 'Mirethyst';
      dialogue.pages = [
        ['The chamber is low and damp \u2014 dried reeds bundled by the wall, a small iron stove, two stacked crates.',
         'An old woman looks up, and her whole face opens like a window thrown wide.',
         '\u2018Oh \u2014 oh, a person! A whole person, come all this way down. Sit, sit, mind the wet patch, the left crate\u2019s the dry one.\u2019'],
        ['\u2018I don\u2019t get many. The drainage crew now and then, Corvel with the eel, but they never stay \u2014 always somewhere to be, everyone\u2019s always got a somewhere, except me. I\u2019ve the one place, and here it is.\u2019',
         '\u2018You\u2019ll have tea. You will, I\u2019ll not hear otherwise \u2014 but let me get the water on, and let me look at you. It\u2019s been\u2026 goodness. It\u2019s been a while.\u2019'],
        ['She sets a battered kettle on the stove.',
         '\u2018This was a grain store once. Imperial coursing, four hundred years if it\u2019s a day. Better built than half of Drenwick, which tells you something, though I\u2019ve never settled on what.\u2019',
         '\u2018The walls hum on the cold nights. Not words \u2014 I checked. Listened three winters running. It is not words. Probably.\u2019'],
        ['\u2018Twenty-three years I\u2019ve been down here. A house in town before that, the east reed beds before that, with my husband \u2014 he died, and the house got too loud with all its quiet, if you follow me. You don\u2019t. That\u2019s all right, nobody does the first time.\u2019',
         '\u2018I named a heron once. Bram. Then a different heron came and I called that one Bram as well, for how was I to know? They don\u2019t sign anything.\u2019'],
        ['The kettle begins to tick.',
         '\u2018There now \u2014 tea. Fen mushroom and a little dried marsh mint. It\u2019s better than it sounds, and it sounds dreadful.\u2019',
         '\u2018Will you? It\u2019s no trouble. It\u2019s the very opposite of trouble. Say yes.\u2019'],
      ];
      dialogue.callbacks = [function() {
        choice.title   = 'Mirethyst';
        choice.options = ['Accept the tea', 'Not just now'];
        choice.cursor  = 0;
        choice.callbacks = [
          function acceptTea() {
            dialogue.name  = 'Mirethyst';
            dialogue.pages = [
              ['\u2018Ha! Good. Good. Two cups, then \u2014 the chipped one\u2019s mine, I\u2019ve grown fond of the chip.\u2019',
               'She pours. The tea is grey-green and smells of pondweed and, faintly, of mint. Against the odds, it is not bad.',
               '\u2018Blow on it. No rush down here. There\u2019s never any rush \u2014 that\u2019s the good part and the bad part, and they are the same part.\u2019'],
              ['\u2018You know what I\u2019ve worked out, all these years alone with the eels? People think the fen is dramatic. Fog, spirits, something with teeth in the dark.\u2019',
               '\u2018It is mud and heron and the same eel run every dawn. It asks attention, not courage. Courage is for people with somewhere to be.\u2019',
               '\u2018I did see a light in the water once that had no business being there. But I\u2019d had the mushroom tea, so.\u2019'],
              ['She drains her cup and sits a moment, just glad of you.',
               '\u2018That\u2019s the first cup I\u2019ve poured for anyone in \u2014 no. I\u2019ll not count it. Counting it makes it sad.\u2019',
               'She rises, stiffly, and takes a folded garment from the shelf beside the stove.'],
              ['\u2018I made this back when my knees still carried me past the deep reeds. Oiled reed-cloth, dark as fen-weed, light as nothing at all.\u2019',
               '\u2018Take it. Not for anything you did \u2014 for the company. For sitting, and drinking my dreadful tea, and letting an old woman talk.\u2019',
               '\u2018That\u2019s worth more than a cowl. But the cowl is what I have to give.\u2019'],
            ];
            dialogue.callbacks = [function() {
              window.mirethyst_rewarded = true;
              grantItem('Fen Cowl');
              dialogue.name  = 'Mirethyst';
              dialogue.pages = [['\u2018Fen Cowl\u2019  (DEF +4)  \u2014 added to items.']];
              dialogue.open  = true;
              dialogue.page  = 0;
            }];
            dialogue.open  = true;
            dialogue.page  = 0;
          },
          function declineTea() {
            dialogue.name  = 'Mirethyst';
            dialogue.pages = [
              ['Something in her face folds back down, just a little. She rallies.',
               '\u2018No \u2014 no, of course, you\u2019ll be wanting on. Everyone\u2019s wanting on.\u2019',
               '\u2018The stove\u2019s usually going, if you pass this way again. The tea another time, perhaps. I\u2019ll keep the water near.\u2019'],
            ];
            dialogue.callbacks = null;
            dialogue.open  = true;
            dialogue.page  = 0;
          },
        ];
        choice.open = true;
      }];
      dialogue.open  = true;
      dialogue.page  = 0;
    },
  },

  // ── Takomo's Chamber — cult attendants ───────────────────────────────────────
  // Two devotees who maintain the chamber and attend Takomo. Neither is armed.
  // The chamber map is 16×15; Takomo stands at col 8 row 7. The cultists occupy
  // the near-side open floor: Preth left (col 4 row 5), Rena right (col 12 row 9).
  //
  // Preth: the older and truer believer. Has been here years. Speaks of Takomo
  // as a form of necessary heat — not a god exactly, but something that the world
  // requires and that requires tending. Fanatical in the particular way of people
  // who have organised their entire life around a single conviction.
  {
    id:         'preth',
    name:       'Preth',
    map:        'takomo_chamber',
    x:           4.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'right',
    spriteType: 'clerk',
    get dialogue() {
      if (TAKOMO.defeated) {
        return [
          ['\u2014'],
          ['He stares at the place where Takomo stood.',
           'He doesn\u2019t look at you.'],
        ];
      }
      return [
        ['\u201cYou shouldn\u2019t be here.\u201d',
         '\u201cNobody should be here who wasn\u2019t brought.\u201d'],
        ['\u201cThe heat doesn\u2019t care what you want.\u201d',
         '\u201cIt just is. It\u2019s always been here. We keep it company.\u201d'],
        ['\u201cHe won\u2019t speak to you. He speaks to no one new.\u201d',
         '\u201cBut he\u2019ll decide what happens to you.\u201d',
         '\u201cHe always does.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Rena: the newer convert, drawn to Takomo through a different channel —
  // not faith but fascination. Younger, quieter, more self-aware than Preth
  // but unable to leave. After Takomo's defeat she seems almost unburdened,
  // though she won't frame it that way.
  {
    id:         'rena_cultist',
    name:       'Rena',
    map:        'takomo_chamber',
    x:          12.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'patron',
    get dialogue() {
      if (TAKOMO.defeated) {
        return [
          ['\u201cI\u2019ve been here three years.\u201d',
           '\u201cI thought it would feel different. When it ended.\u201d',
           '\u201cIt mostly just feels quiet.\u201d'],
        ];
      }
      return [
        ['\u201cHow did you find this place?\u201d',
         'She doesn\u2019t sound alarmed. Only curious.',
         '\u201cMost people see the wall and turn around.\u201d'],
        ['\u201cYou\u2019re going to try to fight him, aren\u2019t you.\u201d',
         '\u201cPeople do. Sometimes.\u201d',
         '\u201cPreth thinks it\u2019s an honour. I think it\u2019s a waste.\u201d'],
        ['\u201cFor what it\u2019s worth \u2014 he\u2019s slower when you come at him low.\u201d',
         '\u201cI don\u2019t know why I\u2019m telling you that.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ── Fen Brewery — the Wend family (MAP3_N1 row 4 col 13) ────────────────────
  // Gorrit Wend, ~40, brewmaster. Defensive pride in his trade, suspicious of
  // outsiders who might look down on mushroom wine.
  {
    id:         'gorrit_wend',
    name:       'Gorrit',
    map:        'fen_brewery',
    x:           9.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'left',
    spriteType: 'worker',
    get dialogue() {
      return [
        ['\u201cYou after wine?\u201d',
         '\u201cBog-cap. We brew from bog-cap. Don\u2019t make that face.\u201d'],
        ['\u201cEvery dockhand in Drenwick drinks it. Every reed-cutter, every canal man.\u201d',
         '\u201cIt keeps the damp out. That\u2019s what wine\u2019s for out here.\u201d'],
        ['\u201cI don\u2019t need a licence from some Drenwick clerk. Never have.\u201d',
         '\u201cMy father brewed. His mother before him. It\u2019s our work.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Nael Wend, ~38, Gorrit's wife. Sharp, pragmatic, no illusions about their
  // life. Less proud, more tired — but not beaten.
  {
    id:         'nael_wend',
    name:       'Nael',
    map:        'fen_brewery',
    x:           2.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'right',
    spriteType: 'patron',
    get dialogue() {
      return [
        ['\u201cYou\u2019re not from here.\u201d',
         '\u201cI can always tell. You\u2019re not wet enough.\u201d'],
        ['\u201cWe make do. There\u2019s no shame in it.\u201d',
         '\u201cBog-cap grows whether you want it to or not. Might as well put it to use.\u201d'],
        ['\u201cToby\u2019s good with the vats. Better than Gorrit was at his age.\u201d',
         '\u201cLiss reads whenever she can find something. I don\u2019t stop her.\u201d',
         '\u201cBut the work has to get done. School\u2019s in Drenwick. That\u2019s half a day each way.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Toby Wend, ~15, their son. Sullen, resentful — knows he\u2019s missing something
  // but doesn\u2019t quite have the words for it. Takes it out on small things.
  {
    id:         'tobb_wend',
    name:       'Toby',
    map:        'fen_brewery',
    x:          13.5 * TILE,
    y:           3.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    // Phase 1 auto-patrol pilot: a small looping route through the eastern
    // brewery workspace (cols 11-13 / rows 3-6), among the vats and straining
    // positions and clear of the exit, partition, Gorrit and furniture.
    // Waypoints are TILE units with per-waypoint dwell (frames). See
    // movement.js (startNpcRoute/updateNpcRoutes/ensureAutoPatrols/PATROL_HOMES).
    movement: {
      type: 'patrol',
      autoStart: true,
      speed: 0.5,
      loop: true,
      waypoints: [
        { x: 13.5, y: 3.5, pauseFrames: 180 },
        { x: 13.5, y: 4.5, pauseFrames: 120 },
        { x: 11.5, y: 4.5, pauseFrames: 240 },
        { x: 11.5, y: 6.5, pauseFrames: 150 },
        { x: 13.5, y: 6.5, pauseFrames: 210 },
        { x: 13.5, y: 4.5, pauseFrames: 120 },
      ],
    },
    get dialogue() {
      return [
        ['\u201cWhat.\u201d'],
        ['\u201cI rack the vats. Turn the caps. Help with the straining.\u201d',
         '\u201cAll day. Every day.\u201d',
         '\u201cThere isn\u2019t anything else.\u201d'],
        ['\u201cI was in Drenwick once. Saw a boy my age reading outside the school.\u201d',
         '\u201cHe had a coat that wasn\u2019t patched.\u201d',
         '\u201cForget it.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Liss Wend, ~11, their daughter. Curious, quick, reads anything she can
  // get her hands on. Not angry yet, just hungry for more than the fen offers.
  {
    id:         'liss_wend',
    name:       'Liss',
    map:        'fen_brewery',
    x:           2.5 * TILE,
    y:           4.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'child',
    get dialogue() {
      return [
        ['\u201cHello.\u201d',
         '\u201cI\u2019m reading this.\u201d',
         '\u201cIt\u2019s a bill of carriage from Drenwick. I found it in the reeds.\u201d',
         '\u201cI\u2019ve read it eleven times. The handwriting changes halfway through.\u201d'],
        ['\u201cBog-cap has two kinds of sugar. Papa says only one matters for the wine.\u201d',
         '\u201cBut why? There\u2019s two, and you only use one.\u201d',
         '\u201cI asked Papa and he said to mind the straining cloth.\u201d'],
        ['\u201cAre there schools where you\u2019re from?\u201d',
         '\u201cWe\u2019re not going to go. It\u2019s too far and there\u2019s the work.\u201d',
         '\u201cI know.\u201d',
         '\u201cI just wanted to know if they have them.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // ─── South Ruins — Entrance Hall NPCs ──────────────────────────────────────
  // Lore-only, no quests, no combat. Four people who each know a different
  // piece of why this hall is here, why it's dry right now, and what's below.
  {
    id:         'rovan_ruins',
    name:       'Rovan',
    map:        'dungeon_entrance',
    x:           5.5 * TILE,
    y:          10.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'traveler',
    get dialogue() {
      return [
        ['\u201c' + stats.name + ', isn\u2019t it?\u201d',
         'He looks you over once, like he\u2019s confirming something he already suspected.',
         '\u201cSeen you around the square in Calwick. Didn\u2019t expect to see you all the way out here.\u201d'],
        ['\u201cWhatever brought you down here, have a look around first. Don\u2019t just walk in.\u201d',
         '\u201cThis floor\u2019s fine. Empty, mostly dry, nothing living in the walls.\u201d'],
        ['\u201cBelow that, it\u2019s not fine.\u201d',
         '\u201cI\u2019ve seen what comes up those stairs when something disturbs it. Big, some of it. Fast, some of it. All of it hungry.\u201d',
         '\u201cIf you\u2019re going down there, go in ready. Don\u2019t go in curious.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'perrin_ruins',
    name:       'Perrin',
    map:        'dungeon_entrance',
    x:          12.5 * TILE,
    y:           7.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'worker',
    get dialogue() {
      return [
        ['\u201c' + stats.name + '. Small world.\u201d',
         'She doesn\u2019t look up from a brass gauge wedged into a crack in the floor.',
         '\u201cI\u2019ve seen you around the district office. Word travels fast for a district investigator.\u201d',
         '\u201cI\u2019m here for the same reason you can walk on this floor at all.\u201d'],
        ['\u201cThis whole level is normally underwater. Not deep — waist height, maybe more. It floods from below, not above — fen water finds its way up through the old stone.\u201d',
         '\u201cPeople call it a drought. That\u2019s not quite right. It barely rains here in any season — it never has. This was never about rain.\u201d'],
        ['\u201cIt\u2019s the fen table. It\u2019s been dropping for two years. Nobody\u2019s explained why, and the district office isn\u2019t in a hurry to.\u201d',
         '\u201cFor now, that means this floor is dry enough to stand on.\u201d',
         '\u201cIt won\u2019t stay that way forever. Neither will I, probably.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'costin_ruins',
    name:       'Costin',
    map:        'dungeon_entrance',
    x:           6.5 * TILE,
    y:           9.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'clerk',
    get dialogue() {
      return [
        ['\u201cThird company, eight-forty-seven.\u201d',
         'He says it like he expects you to already know what that means.',
         '\u201cGarrison log. Dispatched to clear these ruins. They didn\u2019t.\u201d'],
        ['\u201cLost contact at the third level. Commander Vesthall sealed the passage rather than send a fourth company after the first three.\u201d',
         '\u201cNo further expeditions authorised. That order\u2019s still technically in effect, as far as I can tell.\u201d'],
        ['\u201cI\u2019m not garrison. I just read what they left behind.\u201d',
         '\u201cSomeone finally came back up from the third level, once, years after. They didn\u2019t say much about it.\u201d',
         '\u201cThey didn\u2019t go back down, either.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
  {
    id:         'ilsa_ruins',
    name:       'Ilsa',
    map:        'dungeon_entrance',
    x:          10.5 * TILE,
    y:           5.5 * TILE,
    solid:      true,
    facing:     'down',
    spriteType: 'patron',
    get dialogue() {
      return [
        ['\u201cGoing down, then.\u201d',
         'She doesn\u2019t ask if you\u2019re sure.'],
        ['\u201cThey say the ruins were a keep once. Built to flood on purpose — fill the lower halls, drown out anything that tried to take it from below.\u201d',
         '\u201cA castle that\u2019s also a moat. Whoever built it wasn\u2019t interested in a fair fight.\u201d'],
        ['\u201cIt worked, near as anyone can tell. Nothing\u2019s taken it since.\u201d',
         '\u2026',
         '\u201cThat\u2019s not the same as saying nothing\u2019s down there.\u201d'],
      ];
    },
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },
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

// ─── Filing Cabinet ───────────────────────────────────────────────────────────
// Matches the drawn cabinet position: drawOfficeFurniture uses fx = 12*TILE+4,
// fy = 6*TILE+2, body 23×27 px — centre is approx (12.5*T, 6.5*T).
const FILING_CABINET  = { x: 12.5 * TILE, y: 6.5 * TILE };

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
  // u3: Maeve (young mother, rareborn child), u4: Corra (market broker)
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
  // (the Tweezers key item). looted/taken are one-shot flags, persisted in save.js.
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
