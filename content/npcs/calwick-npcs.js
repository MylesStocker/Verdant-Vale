'use strict';

// Calwick NPCs: exterior districts, inn, office, school, Marens post.
// NPC objects moved verbatim from npcs.js SIMPLE_NPCS by the regional-content-split.
// Loaded BEFORE npcs.js, which spreads these arrays (plus SHARED_NPCS) into SIMPLE_NPCS.
const CALWICK_NPCS = [
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
        ['\u201cThe monsters in the wilderness carry gold. Sorted. Minted.', 'No record of where it comes from.\u201d'],
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
      // The basin chamber: once the player has stood inside the unmarked, odourless
      // chamber on the reach (basin_chamber_seen), the office's exacting archivist
      // alone notices, and files it with the other no-record places. Read via
      // window.* — it is a window-only flag, with no lexical binding to read bare.
      if (window.basin_chamber_seen) pages.push(
        ['“You’ve been in that chamber out on the basin — the one the mud won’t cross into.”',
         '“I can tell. A season on the reach and a coat never stops stinking of peat; yours has gone clean in patches. That room takes the smell off a person. Nothing natural does that.”'],
        ['“I keep a folio for such places. No builder on record, no levy ever raised, no note of the ground ever being broken.”',
         '“I’ll add the basin chamber to it. Then I’ll file it, and it won’t be acknowledged — they never are. But it will be written down. That is my part.”']
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
      pages.unshift(day % 5 === 0
        ? ['\u201cMorning, ' + stats.name + '.\u201d', '\u201cOff the clock, for once. Pull up a chair.\u201d']
        : ['\u201cMorning, ' + stats.name + '.\u201d', '\u201cMind the wet ink.\u201d']);
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
      // The Struck Entry (side quest). Once he's asked the player to recover his
      // father's canal tally, he checks for it every time -- the required
      // work-day change -- until it's done; nothing sets corvin_favor_done yet,
      // so the resolved line is dormant until that quest is built (quests.js).
      if (corvin_favor_started && !corvin_favor_done) pages.push(
        ['\u201cYou\u2019ve been out to Drenwick since.\u201d',
         'He doesn\u2019t look up, but he asks it every time now.',
         '\u201cThe old canal office. My father\u2019s tally. Anything?\u201d']
      );
      if (corvin_favor_done) pages.push(
        ['\u201cHis name\u2019s back on the keeper\u2019s roll.\u201d',
         '\u201cThirty years struck, and a stranger set it right in a season.\u201d'],
        ['\u201cI\u2019ve countersigned a great many corrections.\u201d',
         '\u201cThat\u2019s the only one that was ever mine.\u201d']
      );
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
        ['\u201cHeard they cleared that warden out of the old spring meadow, far northwest corner of the vale.\u201d',
         '\u201cOne of the infrastructure men was in here saying that ground\u2019s safe to walk again.\u201d'],
        ['\u201cI always gave that overgrown corner a wide berth myself.\u201d', '\u201cWarden or no warden.\u201d']
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
        : [['\u201cI drew the map on the wall. The big one, with all the sea.\u201d',
            '\u201cWell \u2014 Ms. Vale did the outlines. But I coloured it, and I made sure none of the little towns got left off.\u201d',
            '\u201cEveryone should be somewhere on the map.\u201d']];
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
];
