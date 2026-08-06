'use strict';

// Drenwick town NPCs: approach, bridge, civic, market, canal/docks exteriors.
// NPC objects moved verbatim from npcs.js SIMPLE_NPCS by the regional-content-split.
// Loaded BEFORE npcs.js, which spreads these arrays (plus SHARED_NPCS) into SIMPLE_NPCS.
const DRENWICK_TOWN_NPCS = [
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
];
