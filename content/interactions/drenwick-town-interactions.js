'use strict';

// Drenwick town interactions: north-approach gate and the Drenwick guard post.
// Interaction functions moved verbatim from interactions.js by the regional-content-split.
// Loaded BEFORE interactions.js, which keeps the generic engine, MAP_FEATURES merge,
// and the INTERACT_HANDLERS / OVERWORLD_INTERACT_HANDLERS tables that reference these.

// ── MAP_N2 — sealed Drenwick north gate (prefix check, may not consume) ──────
function interactMapN2Gate() {
  // MAP_N2 ("Blocked Path"): the northern road dead-ends at an old sealed gate.
  // This is NOT Drenwick's gate (Drenwick lies to the east) — it's just where
  // this road stops. Pressing Space near the gate explains why.
  if (activeMap === MAP_N2) {
    if (nearPlayer(7.5 * TILE, 8.5 * TILE, TALK_RADIUS * 2)) {  // row 8 — the gate/wall face
      openDialogue('', [
        ['The gate across the road is sealed.',
         'Heavy timber doors, chain threaded through the handles, padlocked.',
         'The lock is not a new one.',
         'The chain has rusted to the wood in places.'],
        ['A notice is tacked above the handles, printed on district stationery.',
         'NORTHERN ROAD \u2014 CLOSED.',
         'This passage is not in service.',
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

// ── DRENWICK_TOWN_MAP_FEATURES: region-owned MAP_FEATURES entries (merged in interactions.js) ──
const DRENWICK_TOWN_MAP_FEATURES = {
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

};

// Split out of the former interactWildsAndOutposts() by the regional-content-split;
// original branch order preserved. Reached as an OVERWORLD_INTERACT_HANDLERS entry.
function interactDrenwickApproach() {
  // Drenwick guard post — Constable Tarvec, Pale Sentry contract
  if (inDrenwrickPost) {
    const tarvec = SIMPLE_NPCS.find(n => n.id === 'tarvec');
    if (tarvec) {
      const tdx = player.x - tarvec.x;
      const tdy = player.y - tarvec.y;
      if (Math.sqrt(tdx * tdx + tdy * tdy) < TALK_RADIUS) {
        if (!sentry_quest_started && !sentry_seen_on_board) {
          // The contract is only handed out once the player has read the
          // posted removal notice on the Drenwick board.
          dialogue.name  = 'Constable Tarvec';
          dialogue.pages = [
            ['\u201cThere\u2019s a removal notice posted \u2014 the board over by the Drenwick market.\u201d',
             '\u201cRead it first. Then come to me if you want the contract.\u201d'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else if (!sentry_quest_started) {
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
                  ['\u201cHead up the north road, to the old blocked pass \u2014 where the way\u2019s grown over.\u201d',
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
  interactSimpleNPCs();
  return interactionUiOpened();
}
