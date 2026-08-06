'use strict';

// Drenwick interior NPCs: inn, office, harbormaster, wash house, infirmary, store, guild, tavern, school, post office.
// NPC objects moved verbatim from npcs.js SIMPLE_NPCS by the regional-content-split.
// Loaded BEFORE npcs.js, which spreads these arrays (plus SHARED_NPCS) into SIMPLE_NPCS.
const DRENWICK_INTERIOR_NPCS = [
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

  // Fenmark Post Company office (drenwick_post_office) — the relay clerk, now
  // indoors behind the parcels desk instead of standing in the market lane.
  {
    id:         'post_relay_clerk',
    name:       'Relay Clerk',
    map:        'drenwick_post_office',
    x:          10.5 * TILE,   // behind the east (parcels) desk, staff row 7
    y:           7.5 * TILE,
    solid:      true,
    facing:     'up',          // faces the customers who enter from the top
    spriteType: 'clerk',
    dialogue: [
      ['“Post Relay counter. Parcels, sealed letters, priority packet.”',
       '“Standard transit is three to four days east. Faster if you pay the courier rate.”'],
      ['“Anything going north clears our own staging post first — not the Imperial one.”',
       '“It comes back through here on return. If it hasn’t arrived, it hasn’t left our staging post yet.”'],
    ],
    flag_required: null,
    flag_sets:     null,
    action:        null,
  },

  // Fenmark Post Company office — the proprietor who runs the private house.
  // Her lines make plain this is a licensed private carrier, not Empire dispatch.
  {
    id:         'post_office_proprietor',
    name:       'Merrin',
    map:        'drenwick_post_office',
    x:           4.5 * TILE,   // behind the west (dispatch) desk, staff row 7
    y:           7.5 * TILE,
    solid:      true,
    facing:     'up',          // faces the customers who enter from the top
    spriteType: 'clerk',
    dialogue: [
      ['“Fenmark Post Company. We’re a private house — not the Empire’s dispatch.”',
       '“The district office runs Imperial mail through official channels. We run everything else, faster, and to places the sanctioned routes don’t bother with.”'],
      ['“We’re licensed to carry, not to inspect. What you seal, we don’t open.”',
       '“That’s most of the appeal, if you ask the people who use us.”'],
      ['“The couriers are our own — bonded, paid by the run. The Empire has no hand in them.”',
       '“Which is exactly why the district office would rather you forgot we were here.”'],
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
];
