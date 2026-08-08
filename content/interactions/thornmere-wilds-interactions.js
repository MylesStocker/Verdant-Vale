'use strict';

// Thornmere Wilds interactions: smuggler fort, Thornmere stone, East Sluice, Mire Vault, Takomo, Falls hamlet, Fen Brewery.
// Interaction functions moved verbatim from interactions.js by the regional-content-split.
// Loaded BEFORE interactions.js, which keeps the generic engine, MAP_FEATURES merge,
// and the INTERACT_HANDLERS / OVERWORLD_INTERACT_HANDLERS tables that reference these.

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
            queueDialogueEncounter('fort_guard');
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
      queueDialogueEncounter('fort_guard');
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
      queueDialogueEncounter('fort_polwick');
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
      queueDialogueEncounter('fort_essa');
      dialogue.open  = true;
      dialogue.page  = 0;
      return;
    }
  }
  interactSimpleNPCs();
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
          dialogue.pages = [['Chest opened.', `${it.name}  ${itemStatParen(it)}  \u2014 added to items.`]];
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
      queueDialogueEncounter('takomo');
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

// ── THORNMERE_WILDS_MAP_FEATURES: region-owned MAP_FEATURES entries (merged in interactions.js) ──
const THORNMERE_WILDS_MAP_FEATURES = {
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

};

// Split out of the former interactWildsAndOutposts() by the regional-content-split;
// original branch order preserved. Reached as an OVERWORLD_INTERACT_HANDLERS entry.
function interactThornmereWilds() {
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
  interactSimpleNPCs();
  return interactionUiOpened();
}
