'use strict';

// South Ruins NPCs: entrance and dungeon floors.
// NPC objects moved verbatim from npcs.js SIMPLE_NPCS by the regional-content-split.
// Loaded BEFORE npcs.js, which spreads these arrays (plus SHARED_NPCS) into SIMPLE_NPCS.
const SOUTH_RUINS_NPCS = [
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
        ['“Three days I’ve been down here. Came for the garrison cache — this was a Calwick outpost once. A frontier post, back when the border still ran south of the fens.”',
         '“They kept a paychest and a supply store. Coin that was never spent, if the old logs run honest.”'],
        ['“The garrison went quiet centuries ago. A company was sent down to clear the place and not all of them came back up.”',
         '“The prefect had the passage sealed and struck it off the maps. There’s a garrison log still down here that says as much, if you get that deep.”'],
        ['“So why’s it open now? The drought. The water’s dropped, the old drains ran dry — and a sealed door stops being sealed once the floor under it cracks.”',
         '“Half the fen is giving up what it swallowed. This one just happens to have a strongroom at the bottom of it.”'],
        ['“I’ve found more than old grain, mind. Marks on the walls that aren’t Imperial. Doors that were bricked over from the inside.”',
         '“Somebody down here didn’t want out. Or didn’t want what was behind them getting out.”'],
        ['“The thing in the lower vault went quiet yesterday. Might be it’s moved on. Might be it’s just learned to wait.”',
         '“I’m not the one going down to find out. You look like you might be. Rather you than me.”'],
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
