'use strict';

// Thornmere Wilds NPCs: Lorra, Mire Vault, Takomo, Falls hamlet, Fen Brewery.
// NPC objects moved verbatim from npcs.js SIMPLE_NPCS by the regional-content-split.
// Loaded BEFORE npcs.js, which spreads these arrays (plus SHARED_NPCS) into SIMPLE_NPCS.
const THORNMERE_WILDS_NPCS = [
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
];
