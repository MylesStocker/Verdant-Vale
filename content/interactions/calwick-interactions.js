'use strict';

// Calwick interactions: Supervisor/office, Calwick inn, Calwick vale (meadow + Maren post).
// Interaction functions moved verbatim from interactions.js by the regional-content-split.
// Loaded BEFORE interactions.js, which keeps the generic engine, MAP_FEATURES merge,
// and the INTERACT_HANDLERS / OVERWORLD_INTERACT_HANDLERS tables that reference these.

// ─── Supervisor interaction ───────────────────────────────────────────────────
// Thin wrapper: whatever branch supervisorDialogueBody() picks, the player's
// FIRST conversation with him each day opens with a good-morning page
// (supervisor_greet_day tracks the last day he greeted). Prepending after the
// body runs is safe: dialogue.callbacks fire when the LAST page closes, so an
// extra page up front never disturbs a branch's callback.
function interactSupervisor() {
  supervisorDialogueBody();
  // One-time light admonishment: if the player crossed the bridge north of
  // Drenwick before the reservoir assignment existed (recorded in
  // exitBridgeNorth(), world-transitions.js), the supervisor notes it the next
  // time they report in. Prepended like the greeting below, and the scolded
  // flag is set synchronously HERE rather than through dialogue.callbacks —
  // callbacks fire only on the LAST page and would collide with a branch's own
  // callback (e.g. the MQ4 assignment). Gated on !reservoir_quest_started so it
  // never fires once the basin actually IS the assignment; if the crossing and
  // the assignment land in the same conversation, the scold reads first (this
  // check runs before the assignment callback flips the flag), which is fine.
  if (north_bridge_crossed_early && !north_bridge_scolded && !reservoir_quest_started) {
    north_bridge_scolded = true;
    syncQuestFlagsToWindow();
    dialogue.pages = [
      ['He sets the pen down before you’ve finished crossing the room.',
       '“You went over the bridge north of Drenwick. Past the canal, onto the basin road.”',
       '“What took you up there?”'],
      ['He doesn’t wait for the answer, which tells you he has already decided it wasn’t a good one.',
       '“There is no posting north of the canal. Nothing this office has asked you to look at.”',
       '“The toll buys you across a bridge. It does not hand you a reason to be on the far side of it.”'],
      ['“I won’t write it up. Consider that the whole of my generosity on the subject.”',
       '“When the north is yours to walk, you will hear it from me. Not from your own boots.”'],
      ...dialogue.pages,
    ];
  }
  // One-time backstory: once the reservoir assignment exists, the supervisor
  // (economical with words and alarm) explains, once, where his caution comes
  // from — a flood evacuation he coordinated as a young works clerk — and that
  // signing an order into danger never makes it weigh less. Prepended and its
  // flag set synchronously (like the north-bridge scold) so it can't collide
  // with any branch's dialogue callback. Fires the visit AFTER the assignment
  // (reservoir_quest_started is set by that branch's own close callback).
  if (reservoir_quest_started && !supervisor_said_flood) {
    supervisor_said_flood = true;
    syncQuestFlagsToWindow();
    dialogue.pages = [
      ['He doesn’t hand the basin file straight over.',
       '“Before this desk I was a field officer. Before that I wrote flood summaries for a works office, twenty years old, no business being listened to.”'],
      ['“One spring I read four reports that disagreed about which embankment would fail first. I picked one and sent the villages the other way.”',
       '“I was right. That is the whole of the story people tell. They leave out that I could have been wrong, and that I’d have signed the same order either way.”'],
      ['He turns the file around for you to take.',
       '“I send you north because it’s your work, not because it’s safe. Signing the paper doesn’t make it lighter. Go carefully.”'],
      ...dialogue.pages,
    ];
  }
  if (supervisor_greet_day !== day) {
    supervisor_greet_day = day;
    syncQuestFlagsToWindow();
    dialogue.pages = [
      ['“Good morning, Investigator.”',
       'He says it to the ledger first, then looks up.'],
      ...dialogue.pages,
    ];
  }
}

function supervisorDialogueBody() {
  dialogue.name = 'Supervisor';
  dialogue.open = true;
  dialogue.page = 0;

  // ── Letter from Netto (one-time delivery, day > 6) ──────────────────────────
  if (day > 6 && !netto_letter_received) {
    dialogue.pages = [
      // Supervisor's introduction
      ['He holds up a folded envelope without looking away from his ledger.',
       '\u201cCame through district post three days ago.',
       'Your name on it.',
       'Halcyra stamp.\u201d',
       'He sets it on the edge of the desk.',
       '\u201cPersonal correspondence. Not my department.\u201d'],

      // Letter — salutation + postal complaint
      [stats.name + ' \u2014',
       'Hope this reaches you. Post from the capital',
       'has been slow \u2014 they\u2019ve reorganised the',
       'sorting office again. Third time this fiscal',
       'year. Someone on the floor calls it an',
       'efficiency measure. I don\u2019t question those.'],

      // Letter — Netto himself
      ['I\u2019m doing well enough. Work is fine.',
       'They moved me to correspondence review',
       'last month, which means I now spend the',
       'day reading other people\u2019s letters and',
       'deciding whether to forward them.',
       'I\u2019m aware of the irony in writing to you',
       'to tell you this.'],

      // Letter — stepdad's knees
      ['Stepdad\u2019s knees are the same.',
       'He says \u201cmanaging.\u201d',
       'He has been saying \u201cmanaging\u201d since at',
       'least the year you left, possibly longer.',
       'I\u2019ve started to think \u201cmanaging\u201d is just',
       'the word knees use for themselves now.'],

      // Letter — stepdad's depot + the eat properly clause
      ['He\u2019s still going in to the depot three',
       'days a week. They don\u2019t technically need',
       'him anymore but no one has said so to',
       'his face, and he seems content.',
       'He sends his regards. He also asks you',
       'to eat properly. He said to include that',
       'twice. I\u2019ve included it once and will',
       'exercise my editorial discretion on the second.'],

      // Letter — weather
      ['The weather here has been mild.',
       'We had four consecutive days of light rain',
       'last week, which people in the capital',
       'discussed with the energy usually reserved',
       'for festivals. I attended a gathering where',
       'the main topic was whether this year\u2019s rain',
       'was heavier than last year\u2019s rain.',
       'No consensus was reached. We stayed anyway.'],

      // Letter — grain accounting book
      ['I\u2019m about three quarters of the way through',
       'The Practical Administrator\u2019s Guide to',
       'Maritime Grain Accounting, which I know',
       'sounds tedious and mostly is, but chapter',
       'four \u2014 moisture variance in coastal storage',
       '\u2014 kept me reading past the second bell.',
       'Twice. Chapter five is about forms.',
       'There are eight forms.',
       'I have not forgiven chapter five.'],

      // Letter — A Season in the Provinces
      ['The other book everyone here is reading is',
       'A Season in the Provinces.',
       'It\u2019s a novel about a man from Halcyra who',
       'takes an administrative posting in a quiet',
       'rural town and finds it peaceful and slightly',
       'dull. It was a bestseller last spring.',
       'I cannot explain why it appealed to people',
       'in the capital. No one I\u2019ve asked can either.'],

      // Letter — jokes + Henris
      ['Joke from the office: why did the census',
       'clerk sit outside? He wanted to count',
       'fresh air. I told this to Henris from',
       'Processing. He nodded once.',
       'I\u2019m choosing to interpret that as laughter.',
       'Another one: what do you call a grain',
       'inspector who also reads poetry?',
       'Optimistic. Henris nodded at that one too.',
       'He is a man of measured enthusiasm.'],

      // Letter — sign-off
      ['Write when you get a chance. Or don\u2019t \u2014',
       'I know how postings go. Things get busy,',
       'then they get quiet, and sometimes you',
       'forget what day it is.',
       'That\u2019s fine.',
       'Stay warm. Eat properly.',
       '(That one\u2019s from me, not stepdad.',
       'I\u2019ve absorbed it by now.)',
       '\u2014 Netto'],
    ];
    dialogue.callbacks = [function () {
      netto_letter_received = true;
      grantItem('Letter from Netto');
      syncQuestFlagsToWindow();
    }];
    return;
  }

  if (!sluice_job_started) {
    dialogue.pages = [
      ['\u201cInvestigator ' + stats.name + '.', 'There\u2019s a discrepancy in the East Sluice.'],
      ['Flow readings are off at the west gate.', 'Go and have a look. Routine inspection.\u201d'],
      ['\u201cBefore you head out \u2014 you\u2019ll need a kit.\u201d',
       'He writes something on a chit and holds it out.',
       '\u201cRequisition slip. Aldric handles issue. Get it from him before you go.\u201d'],
    ];
    dialogue.callbacks = [function() {
      sluice_job_started      = true;
      equipment_ticket_ready  = true;
      syncQuestFlagsToWindow();
    }];
  } else if (sluice_job_started && !sluice_fixed) {
    dialogue.pages = [
      ['\u201cWest gate, East Sluice.', 'Report back once you\u2019ve had a look.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (sluice_fixed && !sluice_pay_ticket_ready && !sluice_reward_given) {
    dialogue.pages = [
      ['\u201cDebris blockage. Noted.\u201d'],
      ['\u201cStandard clearance rate applies.', 'I\u2019ve issued a pay ticket.\u201d'],
      ['\u201cSpeak to Petra.', 'She\u2019ll process it.\u201d'],
    ];
    dialogue.callbacks = [function() { sluice_pay_ticket_ready = true; }];
  } else if (sluice_pay_ticket_ready && !sluice_reward_given) {
    dialogue.pages = [
      ['\u201cTicket\u2019s with Petra.', 'She\u2019ll sort you out.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (sluice_reward_given && !dispatch_quest_started) {
    dialogue.pages = [
      ['\u201cInvestigator ' + stats.name + '.',
       'The sluice report came back clean.',
       'Blockage, no structural fault.',
       'You handled it correctly.\u201d'],
      ['\u201cI have a letter for the district office in Drenwick.',
       'Routine correspondence \u2014 but it needs to be hand-delivered.\u201d'],
      ['\u201cTake the road east. Stay on the road.\u201d',
       '\u201cThere are ruins south of the path.',
       'Bandit activity, and something else besides.',
       'The kind of something you don\u2019t walk away from.\u201d'],
      ['\u201cFind the district office.',
       'Ask for Officer Veth.',
       'Hand it to him directly.',
       'Come back when it\u2019s done.\u201d'],
    ];
    dialogue.callbacks = [function() {
      dispatch_quest_started = true;
      grantItem('Dispatch Letter');
      syncQuestFlagsToWindow();
      refreshJobBoard();
    }];
  } else if (dispatch_quest_started && !dispatch_delivered) {
    dialogue.pages = [
      ['\u201cDrenwick district office. Officer Veth.',
       'You have the letter. Get it there.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (dispatch_delivered && !dispatch_pay_ticket_ready && !dispatch_rewarded) {
    dialogue.pages = [
      ['\u201cDelivered.\u201d',
       'He makes a note without looking up.'],
      ['\u201cSeventy-five gold, official transit rate.',
       'I\u2019ve issued a pay ticket.',
       'Speak to Petra.\u201d'],
    ];
    dialogue.callbacks = [function() {
      dispatch_pay_ticket_ready = true;
      syncQuestFlagsToWindow();
      refreshJobBoard();
    }];
  } else if (dispatch_pay_ticket_ready && !dispatch_rewarded) {
    dialogue.pages = [
      ['\u201cTicket\u2019s with Petra.', 'She\u2019ll sort you out.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (dispatch_rewarded && !fort_quest_started) {
    dialogue.pages = [
      ['\u201cDrenwick confirmed receipt.\u201d',
       '\u201cHarrow\u2019s office processed it the same day.',
       'That\u2019s faster than the last three dispatches combined.\u201d'],
      // Escalation beat \u2014 the sluice and the dispatch were routine; this one
      // is the step up in danger, and he says so plainly.
      ['\u201cThe sluice was maintenance. The letter was an errand.\u201d',
       '\u201cNow something more serious.\u201d'],
      ['\u201cInvestigator ' + stats.name + '.', 'There\u2019s a post on the fen road I can\u2019t account for.'],
      ['South of Drenwick. Off the main approach.', 'No station number in the ledgers. No patrol roster on record.\u201d'],
      ['\u201cGo and have a look.', 'Don\u2019t announce yourself ahead of time.'],
      ['\u201cIf it turns out to be a clerical error, fine.', 'If it doesn\u2019t\u2014 report what you find.\u201d'],
      ['\u201cAnd go carefully.',
       'A post that isn\u2019t in the ledgers is a post somebody built not to be seen.\u201d'],
    ];
    dialogue.callbacks = [function() { fort_quest_started = true; syncQuestFlagsToWindow(); }];
  } else if (fort_quest_stage >= 4 && fort_quest_stage < 6) {
    // Player has resolved the fort — offer reporting choice
    dialogue.pages = [
      ['\u201cInvestigator.\u201d',
       'He closes the ledger.'],
      ['\u201cThe fen post.',
       'What did you find?\u201d'],
    ];
    dialogue.callbacks = [function() {
      choice.title = 'Supervisor';
      choice.options = ['Report what I found', 'Found nothing'];
      choice.cursor = 0;
      choice.callbacks = [
        function report() {
          const fought = fort_quest_stage === 4;
          dialogue.name = 'Supervisor';
          dialogue.pages = fought
            ? [
                ['\u201cA smuggling front.\u201d',
                 'He writes something brief in the ledger without looking up.'],
                ['\u201cThree operatives.\u201d',
                 '\u201cYou handled it yourself.\u201d'],
                ['\u201cI won\u2019t ask how.',
                 'The post will be flagged for district review.',
                 'It\u2019s not your concern anymore.\u201d'],
                ['\u201cPolwick, though \u2014 that\u2019s a name I recognize.\u201d',
                 'He sets down his pen.',
                 '\u201cRegistered rareborn. Empire employed, same as half the edge posts out this way.\u201d'],
                ['\u201cMust have been running the smuggling on the side.',
                 'Or the drought\u2019s made the honest pay not worth the trouble.\u201d',
                 'A dry look.',
                 '\u201cEither way \u2014 inefficiency\u2019s no excuse for self-dealing.\u201d'],
                ['\u201cTwo hundred gold.',
                 'I\u2019ve issued a pay ticket.',
                 'Speak to Petra.\u201d'],
              ]
            : [
                ['\u201cA smuggling front.\u201d',
                 'He makes a note.'],
                ['\u201cYou let them go.\u201d',
                 'He doesn\u2019t look up.',
                 '\u201cUnregistered. Operating under Imperial cover.\u201d'],
                ['\u201cPolwick, though \u2014 that\u2019s a name I recognize.\u201d',
                 'He sets down his pen.',
                 '\u201cRegistered rareborn. Empire employed, same as half the edge posts out this way.\u201d'],
                ['\u201cMust have been running the smuggling on the side.',
                 'Or the drought\u2019s made the honest pay not worth the trouble.\u201d',
                 'A dry look.',
                 '\u201cInefficiency\u2019s no excuse for self-dealing.',
                 'District will sort out which it was.\u201d'],
                ['\u201cI\u2019ll forward it to the district office.',
                 'That\u2019s above my authority now.',
                 'Above yours too.\u201d'],
                ['\u201cTwo hundred gold for the report.',
                 'I\u2019ve issued a pay ticket.',
                 'Speak to Petra.\u201d'],
              ];
          dialogue.callbacks = [function() {
            fort_quest_stage = 6;
            fort_pay_ticket_ready = true;
            fort_report_filed = true;
            if (!smugglers_dead) smugglers_execution_day = day + 5;
            syncQuestFlagsToWindow();
            refreshJobBoard();
          }];
          dialogue.open = true;
          dialogue.page = 0;
        },
        function foundNothing() {
          fort_quest_stage        = 6;
          fort_pay_ticket_ready   = true;
          fort_pay_ticket_reduced = true;
          syncQuestFlagsToWindow();
          refreshJobBoard();
          dialogue.name = 'Supervisor';
          dialogue.pages = [
            ['\u201cNothing.\u201d',
             'He holds your gaze for a moment.'],
            ['\u201cClerical error, then.',
             'I\u2019ll mark it resolved.\u201d',
             'He doesn\u2019t sound convinced.'],
            ['He goes back to the ledger without looking up.',
             '\u201cFifteen gold for the trip.',
             'I\u2019ve issued a pay ticket.',
             'Speak to Petra.\u201d'],
          ];
          dialogue.open = true;
          dialogue.page = 0;
        },
      ];
      choice.open = true;
    }];
  } else if (fort_quest_stage === 6 && MainQuest < 3) {
    // Reported/denied but the pay ticket hasn't been processed by Petra yet
    // (MainQuest only reaches 3 in her fort-ticket callback).
    dialogue.pages = [
      ['\u201cThe fen post is logged.',
       'District\u2019s handling it from here.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (fort_quest_stage === 6 && mq4_available_day === 0) {
    // MainQuest 3 closed out \u2014 the supervisor shuts the Polwick/Essa file
    // (wording varies by what he was actually TOLD, not by what happened:
    // fort_report_filed distinguishes an honest report from "found nothing")
    // and stands the player down for the rest of the week. The next main
    // assignment unlocks on the first workday after the next Dayoff; the
    // office is closed on Dayoff itself, so day % 5 is 1..4 here and the
    // formula in the callback lands exactly on next-Dayoff + 1.
    const closeOut = (smugglers_dead && fort_report_filed)
      ? [
          ['\u201cThe fen post file went up to district and came back stamped.\u201d',
           '\u201cClosed. Confirmed. Three names, struck through.\u201d'],
          ['\u201cIt reads very tidy on paper.\u201d',
           'He looks at you for a moment.',
           '\u201cPaper is like that.\u201d'],
        ]
      : fort_report_filed
        ? [
            ['\u201cThe fen post file went up to district.\u201d',
             '\u201cPolwick went with it.',
             'The inquiry is Drenwick\u2019s arithmetic now, not ours.\u201d'],
            ['\u201cYou did the job as written.',
             'Whatever the district writes next is not yours to carry.\u201d'],
          ]
        : [
            ['\u201cThe fen post is marked resolved. Clerical error.\u201d',
             'He taps the ledger once.',
             '\u201cThe tidiest kind of file. Nothing in it.\u201d'],
            ['\u201cI\u2019ve stopped being surprised by what the fens don\u2019t contain.\u201d'],
          ];
    dialogue.pages = closeOut.concat([
      ['\u201cYou have done enough for one week.',
       'More than enough, depending who writes the summary.\u201d',
       '\u201cTake the rest of it off.\u201d'],
      ['\u201cThe office will still be here after Dayoff.',
       'So will I. Go.\u201d'],
    ]);
    dialogue.callbacks = [function() {
      mq4_available_day = day + (5 - day % 5) + 1;
      syncQuestFlagsToWindow();
    }];
  } else if (fort_quest_stage === 6 && day < mq4_available_day && !reservoir_quest_started) {
    // Still on ordered rest \u2014 no assignment until after the next Dayoff.
    dialogue.pages = [
      ['\u201cYou\u2019re off the roster until after Dayoff.\u201d',
       '\u201cIf you\u2019re here out of habit, that\u2019s a condition.',
       'I\u2019d have it looked at.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (fort_quest_stage === 6 && !reservoir_quest_started) {
    // First workday after the rest week \u2014 the MainQuest-4 assignment.
    // One main-story path in all cases; only the "why not Drenwick" beat
    // varies with the Polwick/Essa outcome as the supervisor knows it.
    const drenwickLine = (smugglers_dead && fort_report_filed)
      ? ['\u201cOrdinarily I would send this to Drenwick.\u201d',
         '\u201cDrenwick also had Polwick, until the matter became rather final.\u201d']
      : fort_report_filed
        ? ['\u201cDrenwick has investigators.\u201d',
           '\u201cDrenwick also has Polwick sitting in the middle of its paperwork like a knife in a ledger.\u201d']
        : ['\u201cOrdinarily I would send this to Drenwick.\u201d',
           '\u201cOrdinarily Drenwick would send back something I trusted.\u201d'];
    dialogue.pages = [
      ['\u201cInvestigator ' + stats.name + '. Rested, or near enough.\u201d',
       '\u201cSomething\u2019s come in.\u201d'],
      ['\u201cThe reservoir bed north of Drenwick has given up something it was not supposed to have.\u201d',
       '\u201cSurveyors found it after the waterline dropped again.\u201d'],
      ['\u201cThe basin has been declining for years, pulling back further every season.',
       'Three rainless months have turned that decline into a drought.',
       'Ground nobody has stood on in living memory is open sky now.\u201d',
       '\u201cOld stonework. Old waterlines. Things the district maps do not have,',
       'because when the maps were drawn, all of it was underwater.\u201d'],
      drenwickLine,
      ['\u201cSo it comes to this office. Which means it comes to you.\u201d',
       '\u201cNorth of Drenwick, past the basin flats.',
       'Go and look at what the water left behind.\u201d'],
      ['\u201cOne more thing, and I will say it plainly.\u201d',
       '\u201cTwo basin observers went out ahead of you to inspect the exposed stonework \u2014 Garrick and Dreyfuss, the pair the Drenwick office keeps on its books.',
       'Garrick\u2019s reports came back a while, then stopped. Dreyfuss sent nothing at all. Neither of them came back.\u201d'],
      ['\u201cI won\u2019t dress this up as routine. It isn\u2019t the sluice, and it isn\u2019t a ledger error.\u201d',
       '\u201cIf you find yourself uneasy walking out there \u2014 good.',
       'Uneasy is the correct reading of the file.\u201d'],
      ['\u201cGo in daylight. Note what you see. Don\u2019t stay out there to be thorough.\u201d',
       '\u201cAnd come back. That instruction is part of the assignment.\u201d'],
    ];
    dialogue.callbacks = [function() {
      reservoir_quest_started = true;
      syncQuestFlagsToWindow();
    }];
  } else if (fort_quest_stage === 6 && reservoir_quest_started && reservoir_report_filed) {
    // The findings have been reported and logged \u2014 closing acknowledgment, with
    // a lasting line on the two observers' standing outcome.
    dialogue.pages = [
      ['\u201cThe basin report is logged. District has it now.\u201d',
       '\u201cWhat becomes of it is above this office, and for once I am glad of that.\u201d'],
      window.gallery_body_found
        ? ['\u201cDreyfuss\u2019s file I can close, in the way you close a file with a body under it. Garrick\u2019s I cannot.\u201d',
           '\u201cOne found, one still a question. If you go back down and the basin has given up more of him, you tell me first.\u201d']
        : ['\u201cGarrick and Dreyfuss stay open on the ledger. Two lines with no last entry.\u201d',
           '\u201cThe basin has not finished answering. It rarely has.\u201d'],
      ['\u201cYou went down there, and you came back up. Note the order.\u201d',
       'He almost smiles. He doesn\u2019t quite.'],
    ];
    dialogue.callbacks = null;
  } else if (fort_quest_stage === 6 && reservoir_quest_started && !window.sunken_gallery_seen) {
    // Assigned, but the player hasn't descended into the gallery yet.
    dialogue.pages = [
      ['\u201cThe reservoir bed. North of Drenwick.\u201d',
       '\u201cThe surveyors won\u2019t go back out until somebody tells them what\u2019s there.',
       'Somebody is you.\u201d'],
      ['\u201cDaylight. Notes.',
       'And back \u2014 the last part is still part of the job.\u201d'],
    ];
    dialogue.callbacks = null;
  } else if (fort_quest_stage === 6 && reservoir_quest_started) {
    // Been down into the gallery and returned \u2014 offer to make the report.
    dialogue.pages = [
      ['\u201cInvestigator.\u201d',
       'He closes the ledger.'],
      ['\u201cYou went down into the reservoir bed. Into whatever the water uncovered.\u201d',
       '\u201cTell me what you found.\u201d'],
    ];
    dialogue.callbacks = [function () {
      choice.title   = 'Supervisor';
      choice.options = ['Report what I found', 'Not finished down there'];
      choice.cursor  = 0;
      choice.callbacks = [reportBasinFindings, function notYet() {}];
      choice.open = true;
    }];
  } else {
    dialogue.pages = [
      ['\u201cThat post south of Drenwick.', 'Have you looked into it yet?\u201d'],
    ];
    dialogue.callbacks = null;
  }
}

// The Sunken Gallery report. Assembled from the observer-clue investigation
// flags (gallery_clue_*, set by the MAP_FEATURES `flag` field) plus the two
// interactive-beat flags, so the supervisor's reply reflects exactly which
// clues the player actually investigated. Called from the "Report what I found"
// choice in supervisorDialogueBody once the player has descended and returned.
// Sets reservoir_report_filed so the report is one-time; no reward/quest-stage
// side effects (this closes the observer thread narratively, not the main quest).
function reportBasinFindings() {
  const f = (k) => !!window[k];
  const satchel  = f('gallery_clue_satchel');
  const notebook = f('gallery_clue_notebook');
  const visitor  = f('gallery_clue_visitor');
  const survey   = f('gallery_clue_survey');
  const silt     = f('gallery_clue_silt');
  const gauge    = f('gallery_clue_gauge');
  const reliefs  = f('gallery_clue_reliefs');
  const stair    = f('gallery_clue_stair');
  const body     = f('gallery_body_found'); // Dreyfuss's body \u2014 not a reward-tier clue, but the supervisor reacts to it
  const clueCount = [satchel, notebook, visitor, survey, silt, gauge, reliefs, stair].filter(Boolean).length;

  const pages = [];
  pages.push(['He listens without writing anything down.',
              'With him that is not inattention. It is the opposite.']);

  // 1. The two observers \u2014 Dreyfuss (the body) and Garrick (the notebook/kit
  //    trail) \u2014 what the supervisor cares about first.
  if (body) {
    pages.push(['You tell him about Dreyfuss first. You do not soften it and he does not ask you to.',
                '\u201cPulled under and held. His coat raked open, the silt round him clawed wide.\u201d He lets it sit. \u201cThen that is one of the two found, and found the worst way there is.\u201d']);
  } else {
    pages.push(['\u201cNeither man did you find laid to rest, then. Not Garrick, not Dreyfuss.\u201d',
                'He does not make it an accusation. \u201cTwo went north and the basin kept both. Note only that I asked after them.\u201d']);
  }
  if (notebook) {
    pages.push(['You set Garrick\u2019s notebook on the desk. He does not pick it up at once.',
                '\u201cSo Garrick kept writing. Right to the end of it.\u201d']);
    pages.push(['He reads the last full entry twice \u2014 the water loss that heat and drainage do not account for \u2014 then the torn edge after it.',
                '\u201cThe conclusion is here. The reason he reached it is on the page he tore out and carried off \u2014 and he is past giving it back.\u201d']);
    pages.push(['\u201cHe was a careful man. Careful men do not tear out their own last page for nothing.\u201d',
                'He closes the book. \u201cThat part will not go in the summary. Not because it isn\u2019t true.\u201d']);
  } else if (satchel) {
    pages.push(['\u201cGarrick\u2019s kit, at least, and where it snagged going by.\u201d He nods, slowly.',
                '\u201cThen he reached it too. His notebook you did not find \u2014 so it is still down there, or it is not, and I dislike both.\u201d']);
  } else if (silt) {
    pages.push(['\u201cA place in the silt where a man went down, you say \u2014 and you could not tell me which of them.\u201d',
                '\u201cNo. Down there I don\u2019t suppose you could.\u201d']);
  } else if (!body) {
    pages.push(['\u201cAnd of either of them, nothing at all \u2014 no kit, no line, no body.\u201d',
                'He is quiet a moment. \u201cThen the stair is real, and both my observers are still a question.\u201d']);
  } else {
    pages.push(['\u201cOf Garrick, though \u2014 nothing. Not his kit, not a line he wrote.\u201d',
                '\u201cOne found, one a question. It is not the halves I would have chosen.\u201d']);
  }

  // 2. The water itself \u2014 the local strangeness, no global cause.
  if (survey || gauge) {
    const bits = [];
    if (survey) bits.push('water that fell in steps \u2014 fast, then held for days, then most of it gone in a single night');
    if (gauge)  bits.push('Garrick’s own field gauge, its last reading below the lowest mark it was built to carry');
    pages.push(['You describe ' + bits.join(', and ') + '.',
                '\u201cThat is not a drought behaving. That is a drought being made to.\u201d']);
    pages.push(['\u201cI will write \u2018cause undetermined,\u2019 because it is the honest phrase.',
                'On the file it will read as though we simply did not try.\u201d']);
  }

  // 3. The structure \u2014 old, built dry, and it keeps going down.
  if (reliefs || stair) {
    const bits = [];
    if (reliefs) bits.push('carvings of a dry hall, older than any map the district holds');
    if (stair)   bits.push('a worked stair running on down, well below the standing water');
    pages.push(['You tell him about ' + bits.join(', and ') + '.',
                '\u201cSo it was built. Deliberately. Before the water, or in spite of it.\u201d']);
    if (stair) {
      pages.push(['\u201cAnd it continues below the line you could reach.\u201d',
                  '\u201cWhen the water gives up more of it, this office will be interested again. Note that it will not be your choice when.\u201d']);
    }
  }

  // 4. What killed them \u2014 the thing in the water, not a person.
  if (visitor) {
    pages.push(['\u201cOne more thing,\u201d you say, and describe the trail \u2014 no boot, but a broad drag out of the flooded end and clawed gouges to either side, up out of the water and back down into it.',
                'The pen stops.']);
    pages.push(['\u201cYou are certain it was no man.\u201d',
                'You say you are. You have stood in that water and seen what stands in it with you. You are certain.']);
    pages.push(['He is quiet a moment. \u201cThen that is what took them. Not the cold, not a fall, not each other \u2014 a thing that lives down there and came up hunting.\u201d',
                '\u201cNobody has walked that hall in centuries but my two men. And something in the water saw to it they did not walk out.\u201d']);
  }

  // 5. Close and pay, weighted by how much the player actually turned up.
  // Four tiers, four different rewards, on the same clue-count thresholds the
  // closing assessment uses: nothing (0), thin (1-2), serviceable (3-5), and
  // thorough (6-8). The district pays field rate directly on a report this size;
  // the top tier also carries a piece of commendation gear off the hazard line.
  let rewardGold, rewardItem;
  if (clueCount >= 6) {
    rewardGold = 250; rewardItem = 'Swift Bangle';
    pages.push(['He looks at you a moment longer than is comfortable.',
                '\u201cYou were thorough. I asked for that and still did not quite expect it.\u201d',
                '\u201cA good report. I only wish it frightened me less.\u201d']);
    pages.push(['\u201cTwo hundred and fifty gold \u2014 full field rate, and the hazard line on top of it.\u201d',
                'He sets a small polished stone beside the coin. \u201cAnd this. Commendation issue, not requisition. It answers to your name now.\u201d',
                'Swift Bangle \u2014 added to items.']);
  } else if (clueCount >= 3) {
    rewardGold = 150; rewardItem = 'Elixir';
    pages.push(['\u201cA serviceable report,\u201d he says. \u201cThere is more down there than you brought me \u2014 there always is \u2014 but it holds together.\u201d']);
    pages.push(['\u201cOne hundred and fifty gold, standard field rate.\u201d',
                'He takes a stoppered flask from the office cabinet and sets it on the coin. \u201cAnd that. For next time. Out here there is usually a next time.\u201d',
                'Elixir \u2014 added to items.']);
  } else if (clueCount >= 1) {
    rewardGold = 75; rewardItem = null;
    pages.push(['\u201cThin,\u201d he says, not unkindly. \u201cYou did not linger. Given where you were standing, I will not fault you for it.\u201d']);
    pages.push(['\u201cSeventy-five gold. Field rate, no bonus.\u201d',
                'He counts it out without comment.']);
  } else {
    rewardGold = 20; rewardItem = null;
    pages.push(['\u201cYou went down, and came up with almost nothing.\u201d He sets the pen down.',
                '\u201cI would still rather have you back than the notes. But the notes would have helped.\u201d']);
    pages.push(['\u201cTwenty gold. For the walk.\u201d',
                'He does not pretend it is more than that.']);
  }
  pages.push(['\u201cIt is logged. District will do with it what district does.\u201d',
              '\u201cYou came back. On this assignment I am counting that as the objective met.\u201d']);

  dialogue.name = 'Supervisor';
  dialogue.pages = pages;
  dialogue.callbacks = [function () {
    reservoir_report_filed = true;
    stats.gold += rewardGold;
    if (rewardItem) grantItem(rewardItem);
    // Filing the basin report IS the completion of the reservoir arc — the
    // main-story step advances here (MainQuest 3 -> 4), the same way each
    // earlier arc closed on its reward callback (see the fen-post pay ticket).
    if (MainQuest < 4) MainQuest = 4;
    syncQuestFlagsToWindow();
    refreshJobBoard();
  }];
  dialogue.open = true;
  dialogue.page = 0;
}

// ─── The Fourteenth File report ───────────────────────────────────────────────
// Called from the "Report what I found" choice at the Supervisor's Dayoff inn
// table once the drought-exposed skiff (ff_clue_skiff) has been found. Reads the
// three window-native clue flags (set by the MAP_FEATURES `flag` field), builds
// the reconstruction, and — only when BOTH implicating clues were found (the
// drainage ledger and Callis's dedication) — hands the moral choice to the
// player: file the truth, or seal the dead Warden's part to spare his daughter.
// A partial investigation (skiff only, or skiff + one) corrects the file but
// resolves without the dilemma. Tiered field-rate pay either way.
function reportFourteenthFile() {
  const skiff  = !!window.ff_clue_skiff;
  const ledger = !!window.ff_clue_ledger;
  const ded    = !!window.ff_clue_dedication;
  const clueCount = [skiff, ledger, ded].filter(Boolean).length;
  const implicated = ledger && ded; // both threads → the cover-up is provable
  const rewardGold = clueCount >= 3 ? 150 : clueCount === 2 ? 90 : 50;

  if (!implicated) {
    // The patrolman, but not the why — no one to indict, so no dilemma.
    const pages = [
      ['He listens the way he listens — without writing, which with him is the opposite of not attending.'],
      ['You give him Marsh: the skiff in the dried shallows, the swollen tally-book, the torn-out last page.',
       '“So he’s found. Fourteen years, and the water hands him back inside a week.”'],
    ];
    if (ledger || ded) {
      pages.push(['You lay out the rest of it — ' + (ledger ? 'a works ledger that never balanced' : 'a warden’s dedication cut with a wrong date') + ' — and where the thread stops.',
                  '“A thread, then. Not a knot. It points somewhere and doesn’t arrive.”']);
    } else {
      pages.push(['“And why he went into the water — that’s the page he tore out and took with him.”',
                  '“The boat corrects the file. ‘Presumed lost’ becomes ‘lost on patrol, recovered.’ It doesn’t tell me who to be angry at.”']);
    }
    pages.push(['“I’ll amend it to what you can stand up: Marsh died on the water, on duty. His people can bury a fact instead of a maybe.”',
                '“The rest stays open. It usually does.”']);
    pages.push(['“' + rewardGold + ' gold, field rate. For giving a dead man his last page back, even torn.”']);
    dialogue.name = 'Supervisor';
    dialogue.pages = pages;
    dialogue.callbacks = [function () {
      fourteenth_file_stage   = 2;
      fourteenth_file_outcome = 0;
      stats.gold += rewardGold;
      syncQuestFlagsToWindow();
    }];
    dialogue.open = true;
    dialogue.page = 0;
    return;
  }

  // The full reconstruction, then the choice.
  dialogue.name = 'Supervisor';
  dialogue.pages = [
    ['He listens without writing. You lay it out in order.'],
    ['Marsh, in the shallows — the tally-book, a works barge logged where no barge was scheduled, a note to raise it with the Warden direct, the torn last page.',
     'The drainage fund, in the drained creek beds — a clerk’s honest columns, and Warden Callis’s totals that never matched them, gold drawn for stone the works never got.'],
    ['And Callis’s own dedication stone at the sluice: his great works “completed” the very season the fund closed short — the same season Marsh went into the water.',
     'The pen stays down. He is not surprised, and he does not pretend it fails to land.'],
    ['“So. Reeve Callis skimmed the fund for years, and when a fen constable followed the numbers to his door, the constable became ‘presumed lost.’”',
     '“And I signed that file closed, fourteen years ago, because I was new and it was tidy.”'],
    ['“Callis is dead. Died decorated. There’s a stone with his name cut deep, fresh reeds at the foot of it, and a daughter who lays them.”',
     '“She knows him as the man who kept the fen from drowning the road. That is the man I’d be taking from her.”'],
    ['He looks at you.',
     '“I asked for an accurate report and I meant it. But I won’t pretend I don’t understand what filing it does. So I’ll let you write the last line, and I’ll sign what you write.”'],
  ];
  dialogue.callbacks = [function () {
    choice.title   = 'The Fourteenth File';
    choice.options = ['File it accurately', 'Seal the Warden’s part'];
    choice.cursor  = 0;
    choice.callbacks = [
      function fileTrue() { finishFourteenthFile(1, rewardGold); },
      function sealIt()   { finishFourteenthFile(2, rewardGold); },
    ];
    choice.open = true;
  }];
  dialogue.open = true;
  dialogue.page = 0;
}

// Resolves the implicated-case choice: outcome 1 = filed accurately (truth on
// record, Callis named, the family will learn), outcome 2 = sealed (Marsh gets
// an honourable correction, Callis's part sealed-not-erased, his daughter keeps
// her father). Same field-rate pay + an Elixir either way — the pay is for the
// investigation, not the verdict.
function finishFourteenthFile(outcome, rewardGold) {
  const pages = outcome === 1
    ? [
        ['“Then it goes on the record true.” He writes now, finally, and it takes him a while.',
         '“Marsh’s death is a killing, reclassified. Callis’s name goes in the finding beside it.”'],
        ['“The daughter will hear it from the district, not from me — a small cowardice I’ll own.”',
         '“A true file costs someone who didn’t earn the cost. It’s still the one I asked you for. I won’t insult it by calling it easy.”'],
      ]
    : [
        ['“Then the Warden keeps his stone.” He writes it the quiet way.',
         '“Marsh: died on patrol, in the line, recovered with honour. True as far as it goes — and it goes far enough for a headstone.”'],
        ['“Callis’s part I seal under my own hand — not erased, sealed. If a day comes it must be opened, it can be. Today is not that day, and his daughter keeps her father.”',
         '“Some would call that a lie by tidy filing. I’ve signed worse for worse reasons. This one I can carry.”'],
      ];
  pages.push(['“' + rewardGold + ' gold, and this.” He sets a stoppered flask on the coin.',
              '“Field rate and the hazard line. You reopened fourteen years and closed them clean. That’s the work.”',
              'Elixir — added to items.']);
  pages.push(['“It’s logged. It’s mine now, not yours.”',
              'He picks up the drink he hasn’t been drinking, and for once he drinks it.']);
  dialogue.name = 'Supervisor';
  dialogue.pages = pages;
  dialogue.callbacks = [function () {
    fourteenth_file_stage   = 2;
    fourteenth_file_outcome = outcome;
    stats.gold += rewardGold;
    grantItem('Elixir');
    syncQuestFlagsToWindow();
  }];
  dialogue.open = true;
  dialogue.page = 0;
}

function interactCalwickOffice() {
  if (currentTownId === 'calwick') {
    // Wall primer — a framed service manual on the north wall (row 1, cols 6-9)
    // explaining how an agent's stats work. (The continent map lives in the
    // school now, on the calwick_school_map wall fixture.)
    const wmx = player.x - CALWICK_OFFICE_WALL_MAP.x;
    const wmy = player.y - CALWICK_OFFICE_WALL_MAP.y;
    if (Math.sqrt(wmx * wmx + wmy * wmy) < TALK_RADIUS * 1.5) {
      dialogue.name  = 'Field Manual';
      dialogue.pages = [
        ['A framed service primer, the kind pinned up in every district office.',
         'HP is what keeps you standing. Reach zero in the field and you are carried home, lighter a purse.'],
        ['ATK is how hard you hit; DEF, how much you shrug off; SPD, who strikes first.',
         'A weapon raises ATK, armour raises DEF. Keep both equipped before leaving the civic district.'],
        ['Win fights and you earn experience. Enough of it and your Level rises on its own —',
         'more HP, sharper stats, no paperwork required.'],
        ['Rest at an inn, or in your own bed, to restore HP.',
         'An unequipped agent is a dead agent. — District Investigative Corps'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
    const sx = player.x - SUPERVISOR.x;
    const sy = player.y - SUPERVISOR.y;
    if (Math.sqrt(sx * sx + sy * sy) < TALK_RADIUS) {
      interactSupervisor();
      return true;
    }
    const kx = player.x - CORVIN_CABINET.x;
    const ky = player.y - CORVIN_CABINET.y;
    if (Math.sqrt(kx * kx + ky * ky) < TALK_RADIUS) {
      // Corvin's section — the cabinet by the north-wall window. Weight
      // Discrepancy quest: once Corvin has countersigned but the note isn't
      // filed yet, THIS cabinet is the actual decision point (FILING_CABINET and
      // ESLA_CABINET just redirect here). See quests.js's weight_note_signed comment.
      if (weight_note_signed && !cabinetCaseFlag) {
        dialogue.name = 'Filing Cabinet';
        dialogue.pages = [
          ['Corvin’s countersigned note, still folded in your pocket.'],
          ['The drawer marked for his section is unlocked.', 'It would take a second to slide the note in and no one would ever ask.'],
        ];
        dialogue.callbacks = [function() {
          choice.title     = 'Filing Cabinet';
          choice.options   = ['File it with Corvin’s other notes', 'Leave it on top of the stack', 'This isn’t your job — find Aldric instead'];
          choice.cursor    = 0;
          choice.callbacks = [
            function fileProper() {
              cabinetCaseFlag    = true;
              weight_quest_stage = 3;
              syncQuestFlagsToWindow();
              refreshJobBoard();
              dialogue.name  = '';
              dialogue.pages = [
                ['You find the gap where his monthly summaries collect and slide the note in.',
                 'It disappears into the stack like it was always there.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            },
            function leaveOnTop() {
              cabinetCaseFlag    = true;
              weight_quest_stage = 3;
              syncQuestFlagsToWindow();
              refreshJobBoard();
              dialogue.name  = '';
              dialogue.pages = [
                ['You set it on top of the stack instead.',
                 'Someone will notice it wasn’t there yesterday. That’s not really your problem.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            },
            function declineForNow() {
              dialogue.name  = '';
              dialogue.pages = [
                ['You put the note away instead.',
                 'Whatever Aldric wants done with it, it’s still sitting in your pocket, unfiled.'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            },
          ];
          choice.open = true;
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
      dialogue.name = 'Filing Cabinet';
      dialogue.pages = cabinetCaseFlag
        ? [['The files have been disturbed.', 'Someone was looking for something.']]
        : randomCabinetPages();
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
    const fx = player.x - FILING_CABINET.x;
    const fy = player.y - FILING_CABINET.y;
    if (Math.sqrt(fx * fx + fy * fy) < TALK_RADIUS) {
      // Not the quest cabinet — during the filing step, point the player at
      // Corvin’s section by the window (CORVIN_CABINET). Otherwise flavour.
      dialogue.name = 'Filing Cabinet';
      dialogue.pages = weight_note_signed && !cabinetCaseFlag
        ? [['Not this drawer.', 'Corvin’s section is the cabinet by the window.']]
        : randomCabinetPages();
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
    const ex = player.x - ESLA_CABINET.x;
    const ey = player.y - ESLA_CABINET.y;
    if (Math.sqrt(ex * ex + ey * ey) < TALK_RADIUS) {
      dialogue.name = 'Filing Cabinet';
      dialogue.pages = weight_note_signed && !cabinetCaseFlag
        ? [['Not this drawer.', 'Corvin\u2019s section is the other cabinet, past the window.']]
        : randomCabinetPages();
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
    const elx = player.x - ESLA.x;
    const ely = player.y - ESLA.y;
    if (Math.sqrt(elx * elx + ely * ely) < TALK_RADIUS) {
      const dayBeforeAccord = day % 5 === 4;
      dialogue.name = 'Esla';
      dialogue.callbacks = null;

      // ── One-shot event commentary ─────────────────────────────────────────
      // Esla reacts to fresh developments exactly ONCE each (esla_said_*
      // flags, set on dialogue close and persisted via save.js), shown
      // INSTEAD of her daily rotation so the reaction reads as "she has
      // something to say today." The old code appended these to every
      // conversation forever (and the sluice comment used MainQuest === 1,
      // so it vanished unseen if the player outpaced it). Priority: deaths
      // before gossip before work commentary.
      const polwickDead = fort_quest_stage >= 6 &&
        (smugglers_dead || (smugglers_execution_day > 0 && day >= smugglers_execution_day));
      const polwickPending = fort_quest_stage >= 6 && !smugglers_dead &&
        smugglers_execution_day > 0 && day < smugglers_execution_day;

      if (polwickDead && !esla_said_polwick_dead) {
        dialogue.pages = (smugglers_dead && smugglers_execution_day === 0)
          ? [
              ['“Polwick.”',
               'She doesn’t look up right away.',
               '“I only met him twice. Registry business, mostly.”',
               '“I keep saying that like it settles something. It doesn’t.”'],
              ['“There aren’t many of us posted this far out.',
               'You notice the other ones. You keep a kind of count, without ever deciding to.”',
               'She sets her pen down.',
               '“The count is smaller now. I keep arriving at that.”'],
              ['“I closed his registry file this morning. It’s a short form.',
               'Date of determination. Date of death. Nothing in between that the Empire wanted written down.”'],
              ['“I don’t know what he was doing with that post.',
               'I don’t think I want to.”',
               '“I keep thinking about the drought, and what people do when the ledger stops adding up.',
               'And then I stop thinking, and I’m just sad. That’s all that’s left of it. I’m sad.”'],
            ]
          : [
              ['“I heard the district closed the fen post matter.”',
               'She doesn’t look up right away.',
               '“Polwick. I only met him twice, registry business.”',
               '“Twice turns out to be enough to grieve. Nobody warns you about that.”'],
              ['“There aren’t many of us posted this far out.',
               'You notice the other ones, even the ones you don’t know well.”',
               '“I took his name off the three-year cycle list this morning.',
               'It was a short list. It’s shorter.”'],
              ['“Registered rareborn, same as me. Employed, same as me.”',
               'A pause.',
               '“I keep thinking about the drought, and what people do when the ledger stops adding up. It doesn’t excuse it.”'],
              ['“It just makes it less simple than the report will say.”',
               'She looks at her hands.',
               '“I filed that report. I read every line.',
               'There’s no line where you’re allowed to say you’re sorry.”'],
            ];
        dialogue.callbacks = [function() { esla_said_polwick_dead = true; syncQuestFlagsToWindow(); }];
      } else if (polwickPending && !esla_said_polwick_pending) {
        dialogue.pages = [
          ['“I heard about the fen post.”',
           'She doesn’t look up right away.',
           '“Polwick. I only met him twice, registry business.”'],
          ['“There aren’t many of us posted this far out.',
           'You notice the other ones, even the ones you don’t know well.”'],
          ['“I don’t know yet what the district will do with him.”',
           'A pause.',
           '“I try not to guess. It doesn’t usually help.”'],
        ];
        dialogue.callbacks = [function() { esla_said_polwick_pending = true; syncQuestFlagsToWindow(); }];
      } else if (reservoir_quest_started && !esla_said_basin) {
        // The basin assignment routes an ecological problem across a Bloommarked
        // officer's desk. She reads a drying landscape more easily than people,
        // and — guardedly — the fen is why she asked to be sent somewhere quiet.
        dialogue.pages = [
          ['“They routed the basin file through me before it reached you.',
           'Water tables, silt cores, a die-off count off the exposed bed.”',
           '“I read a drying landscape more easily than I read most people. That isn’t a boast. It’s nearly a complaint.”'],
          ['“When the Academy asked where I wanted posting, I said somewhere quiet.',
           'They heard modest. I meant it as a request.”',
           '“The fen answered in fungi and beetles and reed-rot, none of which have ever lied to me. Whatever’s wrong up there, it is telling the truth about it. Go and read it back.”'],
        ];
        dialogue.callbacks = [function() { esla_said_basin = true; syncQuestFlagsToWindow(); }];
      } else if (cabinetCaseFlag && !esla_said_cabinet) {
        dialogue.pages = [
          ['“Someone’s been in Aldric’s cabinet.”',
           'She doesn’t look up from her own drawer.',
           '“He hasn’t noticed yet. Or he has, and he’s decided not to say.”'],
          ['“I’m not asking.”',
           '“I notice more than I say. This is one of those times.”'],
        ];
        dialogue.callbacks = [function() { esla_said_cabinet = true; syncQuestFlagsToWindow(); }];
      } else if (MainQuest >= 2 && !esla_said_dispatch) {
        dialogue.pages = [
          ['“Drenwick processed your dispatch the same day. Harrow’s office.”',
           '“I’ve seen that happen twice in six years. Both times it was a filing error.”'],
          ['“I’ve logged yours as intentional. That took a separate form.”',
           '“Don’t let it go to your head. The form was going spare.”'],
        ];
        dialogue.callbacks = [function() {
          esla_said_dispatch = true;
          esla_said_sluice   = true;  // superseded — no stale sluice follow-up next visit
          syncQuestFlagsToWindow();
        }];
      } else if (MainQuest >= 1 && !esla_said_sluice) {
        dialogue.pages = [
          ['“The sluice assignment crossed my desk before it reached you.',
           'I filed it under routine.”'],
          ['“You came back dry, on schedule, with legible paperwork.”',
           '“I’ve re-filed it under routine, underlined.',
           'That is as impressed as this office gets. Spend it wisely.”'],
        ];
        dialogue.callbacks = [function() { esla_said_sluice = true; syncQuestFlagsToWindow(); }];
      } else if (dayBeforeAccord) {
        dialogue.pages = [
          ['“Today’s the day,” she says quietly.'],
          ['“Ask for that promotion', 'before you leave tonight.'],
          ['“They’re always most receptive', 'on the eve of Accord Day.”'],
        ];
      } else {
        // ── Daily rotation (day % 10) ────────────────────────────────────────
        // Helpful, dry, and hard to impress. Practical hints (rest, the job
        // board, road danger, potions, Dayoff) mixed with the quiet absurdity
        // of registry work. Kept consistent with her canon: Bloommarked
        // (green thread — the clover), registered at birth, Alecton prep
        // school then the Academy, placed here six years ago, inn on Dayoff.
        const eslaVariants = [
          // 0 — helpful: sleep before travel
          [
            ['“You have the look of someone planning to walk somewhere far on no sleep.”',
             '“Don’t. Sleep first. Your bed restores you completely, and the roads will still be there.”'],
            ['“I can’t believe that’s a thing I have to tell a licensed investigator.”',
             'She stamps a form with unnecessary force.'],
          ],
          // 1 — silly: the forms
          [
            ['“Today I processed forty-one forms.',
             'Nine were requests for other forms.”',
             '“One was a request for the form you use to request forms.”'],
            ['“The system works.”',
             'She says it the way people say things that aren’t true.'],
          ],
          // 2 — helpful: job board + Petra
          [
            ['“If you’re between assignments, the notice board on the square posts contract work.”',
             '“Pay tickets go through Petra. Not me.”'],
            ['“People keep bringing me their tickets anyway, because my desk is nearer the door.”',
             '“I’ve started scoring their innocent expressions. Best this week was a seven.”'],
          ],
          // 3 — silly: the clover (Bloommarked, deflected)
          [
            ['There’s a small pot of clover on her desk. It is doing suspiciously well.',
             '“Don’t compliment the clover. It gets smug.”'],
            ['“And before you ask — that’s not a thread thing. That’s a clover thing.”',
             'The clover leans toward you slightly.'],
          ],
          // 4 — helpful, darkly: stay on the road
          [
            ['“Going east, stay on the road. The ruins south of it are not a shortcut.”',
             '“I file the incident reports of people who thought otherwise.”'],
            ['“The paperwork outlives them.',
             'I find that motivating.”'],
          ],
          // 5 — unimpressed: exciting registry work
          [
            ['“Someone asked me today whether registry work is exciting.”',
             '“This week I renumbered six hundred pages because a Drenwick clerk invented his own alphabet.”'],
            ['“So yes.”', '“Constantly.”'],
          ],
          // 6 — helpful: potions, with a statistic
          [
            ['“Buy more potions than you think you need. The traveller stocks them.”',
             '“Every incident report I file contains the phrase ‘had one potion.’',
             'Every single one.”'],
            ['“Be a statistical outlier.',
             'It’s an attractive quality in an investigator.”'],
          ],
          // 7 — helpful/silly: Dayoff (and where to find her)
          [
            ['“Every fifth day is Dayoff. The office shuts, and I go to the inn',
             'to watch Tomas defend his soup from public opinion.”'],
            ['“It’s the best entertainment in Calwick.”',
             '“Which tells you a great deal about Calwick.”'],
          ],
          // 8 — knowing, deflating: your file
          [
            ['“You don’t need to introduce yourself. I know your file.”',
             '“I know everyone’s file.”'],
            ['“Yours is not the thickest, before you look flattered.',
             'The thickest belongs to a man who reports his neighbour’s fence weekly.”',
             '“I have, however, read yours twice. Filing purposes.”'],
          ],
          // 9 — registry deadpan: the census cycle
          [
            ['“Census update cycle this year. Registered folk get different questions.”',
             '“This one asks whether my abilities have ‘materially changed.’”'],
            ['“The clover flowered early, and I have developed opinions about the drainage ditch.',
             'I left it blank. The Empire can subpoena the clover.”'],
          ],
        ];
        // Index by WORKDAY, not by raw day % 10: days where day % 5 is 0
        // (Dayoff, office closed) or 4 (Accord-eve override above) never
        // reach this branch, so a plain day-mod rotation would leave four
        // variants permanently unreachable. Each 5-day week contributes its
        // three plain office days (day % 5 = 1..3), walking the whole list
        // in ~3⅓ weeks with no repeats inside a cycle.
        const weekSlot = (day % 5 >= 1 && day % 5 <= 3) ? (day % 5) - 1 : 0;
        dialogue.pages = eslaVariants[(Math.floor(day / 5) * 3 + weekSlot) % 10];
      }
      // First conversation of the day: she greets before whatever the
      // branches above chose. Spread, don't unshift — eslaVariants pages
      // are shared array literals and must not be mutated.
      if (esla_greet_day !== day) {
        esla_greet_day = day;
        syncQuestFlagsToWindow();
        dialogue.pages = [
          ['“Good morning, ' + stats.name + '.”',
           'She says it without looking up, before you’re fully through the door.'],
          ...dialogue.pages,
        ];
      }
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
  }
  if (sluice_pay_ticket_ready && !sluice_reward_given) {
    const petra = SIMPLE_NPCS.find(n => n.id === 'petra');
    if (petra) {
      const pdx = player.x - petra.x;
      const pdy = player.y - petra.y;
      if (Math.sqrt(pdx * pdx + pdy * pdy) < TALK_RADIUS) {
        dialogue.name  = 'Petra';
        dialogue.pages = [
          ['\u201cPay ticket, East Sluice clearance.\u201d', 'She checks the register.'],
          ['\u201cFifty gold. Sign here.\u201d'],
        ];
        dialogue.callbacks = [function() {
          stats.gold += 50;
          sluice_reward_given = true;
          sluice_pay_ticket_ready = false;
          MainQuest = 1;
          syncQuestFlagsToWindow();
          refreshJobBoard();
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
    }
  }
  if (dispatch_pay_ticket_ready && !dispatch_rewarded) {
    const petra = SIMPLE_NPCS.find(n => n.id === 'petra');
    if (petra) {
      const pdx = player.x - petra.x;
      const pdy = player.y - petra.y;
      if (Math.sqrt(pdx * pdx + pdy * pdy) < TALK_RADIUS) {
        dialogue.name  = 'Petra';
        dialogue.pages = [
          ['\u201cPay ticket, Drenwick dispatch.\u201d', 'She checks the register.'],
          ['\u201cSeventy-five gold. Sign here.\u201d'],
        ];
        dialogue.callbacks = [function() {
          stats.gold += 75;
          dispatch_rewarded = true;
          dispatch_pay_ticket_ready = false;
          MainQuest = 2;
          syncQuestFlagsToWindow();
          refreshJobBoard();
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
    }
  }
  if (fort_pay_ticket_ready) {
    const petra = SIMPLE_NPCS.find(n => n.id === 'petra');
    if (petra) {
      const pdx = player.x - petra.x;
      const pdy = player.y - petra.y;
      if (Math.sqrt(pdx * pdx + pdy * pdy) < TALK_RADIUS) {
        dialogue.name  = 'Petra';
        dialogue.pages = fort_pay_ticket_reduced
          ? [
              ['\u201cPay ticket, fen post investigation.\u201d', 'She checks the register.'],
              ['\u201cFifteen gold. Sign here.\u201d'],
            ]
          : [
              ['\u201cPay ticket, fen post investigation.\u201d', 'She checks the register.'],
              ['\u201cTwo hundred gold. Sign here.\u201d'],
            ];
        dialogue.callbacks = [function() {
          stats.gold += fort_pay_ticket_reduced ? 15 : 200;
          fort_pay_ticket_ready   = false;
          fort_pay_ticket_reduced = false;
          MainQuest = 3;
          syncQuestFlagsToWindow();
          refreshJobBoard();
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
    }
  }
  // Starting kit requisition — Aldric exchanges the Supervisor's ticket
  // for the player's kit, once, then reverts to his normal dialogue
  // (including the weight-quest branch below) on every later visit.
  if (equipment_ticket_ready) {
    const aldricGear = SIMPLE_NPCS.find(n => n.id === 'aldric');
    if (aldricGear && aldricGear.map === currentContentLocationKey()) {
      const agx = player.x - aldricGear.x;
      const agy = player.y - aldricGear.y;
      if (Math.sqrt(agx * agx + agy * agy) < TALK_RADIUS) {
        dialogue.name  = 'Aldric';
        dialogue.pages = [
          ['\u201cRequisition slip for our Junior Investigator.\u201d', 'He glances at it, then at you.', '\u201cRisky assignment?\u201d'],
          ['He doesn\u2019t wait for an answer.', 'Pulls a bundle from under the counter.', '\u201cSword, armor. Standard issue. Sign here.\u201d'],
          ['\u201cOpen the menu with Esc or M, go to Items, and choose Equip.\u201d',
           'He\u2019s already looking back down at his ledger.'],
        ];
        dialogue.callbacks = [function() {
          equipment_ticket_ready = false;
          grantItem('Iron Sword');
          grantItem('Leather Armor');
          syncQuestFlagsToWindow();
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
    }
  }
  // Weight Discrepancy quest — Aldric (stage 1 → 2) and Corvin (stage 2 → 3)
  if (weight_quest_stage === 1 || weight_quest_stage === 2) {
    const aldric = SIMPLE_NPCS.find(n => n.id === 'aldric');
    if (aldric && aldric.map === currentContentLocationKey()) {
      const adx = player.x - aldric.x;
      const ady = player.y - aldric.y;
      if (Math.sqrt(adx * adx + ady * ady) < TALK_RADIUS) {
        if (weight_quest_stage === 1) {
          dialogue.name  = 'Aldric';
          dialogue.pages = [
            ['\u201cRenn\u2019s query note.\u201d',
             'He takes it, reads it once, sets it on the desk.',
             '\u201cI know the entry. Grain barge, third cycle.\u201d'],
            ['\u201cOur ledger shows 304 stone. He\u2019s certified 312.\u201d',
             '\u201cThat\u2019s Corvin\u2019s period. He kept the weight log that cycle.\u201d',
             '\u201cI can\u2019t authorise the correction without his countersignature.\u201d'],
            ['\u201cCorvin\u2019s at the far desk on work days.\u201d',
             '\u201cInn on the fifth. Try him when he\u2019s in.\u201d'],
          ];
          dialogue.callbacks = [function() {
            weight_quest_stage = 2;
            syncQuestFlagsToWindow();
          }];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else if (!weight_note_signed) {
          dialogue.name  = 'Aldric';
          dialogue.pages = [['\u201cCorvin\u2019s signature — then it\u2019s done.\u201d',
                              '\u201cHe\u2019s at the far desk.\u201d']];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else {
          // Corvin has signed, but the note still has to be filed before
          // Renn can be paid — Aldric would rather not do it himself.
          // (cabinetCaseFlag is necessarily still false here: it's only
          // ever set together with weight_quest_stage advancing past 2,
          // in the Filing Cabinet's callbacks below, which closes off
          // this whole outer block's gate before that state is reachable.)
          dialogue.name  = 'Aldric';
          dialogue.pages = [
            ['\u201cSigned already?\u201d',
             'He doesn\u2019t reach for it.',
             '\u201cThen it just needs to go back into the record. Corvin\u2019s section, the cabinet by the window.\u201d'],
            ['\u201cI\u2019d walk it over myself, but I\u2019m elbow-deep in the quarterly intake.\u201d',
             'He nods at the cabinet without quite looking up from his stack.'],
          ];
          dialogue.callbacks = [function() {
            choice.title     = 'Aldric';
            choice.options   = ['I can do that.', 'Shouldn\u2019t this go through you?', 'I\u2019d rather not touch the district files.'];
            choice.cursor    = 0;
            choice.callbacks = [
              function agree() {
                dialogue.name  = 'Aldric';
                dialogue.pages = [['\u201cAppreciated.\u201d', 'He\u2019s already back in his own ledger.']];
                dialogue.open  = true;
                dialogue.page  = 0;
              },
              function pushBack() {
                dialogue.name  = 'Aldric';
                dialogue.pages = [
                  ['\u201cTechnically, yes.\u201d',
                   '\u201cTechnically you\u2019re already the one carrying it.\u201d',
                   'He says it without any particular guilt.'],
                  ['\u201cIt\u2019s not complicated. Corvin\u2019s section, the cabinet by the window.\u201d'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              },
              function decline() {
                dialogue.name  = 'Aldric';
                dialogue.pages = [
                  ['He glances up, briefly.',
                   '\u201cIt\u2019s one drawer.\u201d',
                   'He goes back to his own stack without pressing further.'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              },
            ];
            choice.open = true;
          }];
          dialogue.open  = true;
          dialogue.page  = 0;
        }
        return true;
      }
    }
    if (weight_quest_stage === 2) {
      const corvin = SIMPLE_NPCS.find(n => n.id === 'corvin');
      if (corvin && corvin.map === currentContentLocationKey()) {
        const cdx = player.x - corvin.x;
        const cdy = player.y - corvin.y;
        if (Math.sqrt(cdx * cdx + cdy * cdy) < TALK_RADIUS) {
          if (!weight_note_signed && corvin_favor_done) {
            // Favour repaid \u2014 he countersigns readily, and says why.
            dialogue.name  = 'Corvin';
            dialogue.pages = [
              ['\u201cYou put my father\u2019s name back on the keeper\u2019s roll.\u201d',
               'He sets the ledger aside \u2014 something you have not once seen him do.',
               '\u201cI don\u2019t leave accounts open. Renn\u2019s discrepancy. Give it here.\u201d'],
              ['\u201cThe 304 figure was a copy error on my part.\u201d',
               '\u201cI transposed two digits. 304 should read 340, and the declared weight is 312.\u201d',
               '\u201cStill a variance, but within acceptable tolerance.\u201d'],
              ['\u201cThere. Countersigned.\u201d',
               'He signs the note and slides it back.',
               '\u201cTell Renn I\u2019ve filed a correction notice on my side as well.\u201d',
               '\u201cAldric can point you to where the note itself goes.\u201d'],
            ];
            dialogue.callbacks = [function() {
              weight_note_signed = true;
              syncQuestFlagsToWindow();
            }];
            dialogue.open  = true;
            dialogue.page  = 0;
          } else if (!weight_note_signed && corvin_favor_started) {
            // Favour under way but unfinished \u2014 he won't sign until it's settled.
            dialogue.name  = 'Corvin';
            dialogue.pages = [
              ['\u201cMy father\u2019s roll.\u201d',
               'He looks up from the ledger, briefly.',
               '\u201cYou\u2019ve not found the tally yet \u2014 I\u2019d know it from your face. I read ledgers for a living.\u201d'],
              ['\u201cSettle that, and Renn\u2019s correction signs itself the same afternoon. You have my word, and my word is a matter of record.\u201d',
               '\u201cNot before.\u201d'],
            ];
            dialogue.open  = true;
            dialogue.page  = 0;
          } else if (!weight_note_signed) {
            // Not yet asked / hasn't taken it on \u2014 he acknowledges the query but
            // is in no hurry to do the district a courtesy, and points the player
            // to where he can be asked why.
            dialogue.name  = 'Corvin';
            dialogue.pages = [
              ['\u201cRenn\u2019s weight discrepancy. I know the entry.\u201d',
               'He doesn\u2019t look up from the ledger.',
               '\u201cI\u2019ll countersign it. When I\u2019ve a reason to hurry \u2014 and just now I haven\u2019t.\u201d'],
              ['\u201cI keep my own reckoning before the district\u2019s.\u201d',
               'A pause, the pen still moving.',
               '\u201cIf you want to know what I mean by that, I\u2019m at the inn on the Dayoff. Ask me there. Not here.\u201d'],
            ];
            dialogue.open  = true;
            dialogue.page  = 0;
          } else {
            dialogue.name  = 'Corvin';
            dialogue.pages = [['\u201cIt\u2019s signed.\u201d', 'He doesn\u2019t look up.', '\u201cAldric\u2019s cabinet, not mine.\u201d']];
            dialogue.open  = true;
            dialogue.page  = 0;
          }
          return true;
        }
      }
    }
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactCalwickInn() {
  // Innkeeper
  const ix = player.x - INNKEEPER.x;
  const iy = player.y - INNKEEPER.y;
  if (Math.sqrt(ix * ix + iy * iy) < TALK_RADIUS) {
    dialogue.name  = 'Innkeeper';
    dialogue.pages = [
      ['\u201c' + stats.name + '! A room? For you, of course.\u201d',
       '\u201cThough you\u2019ve a perfectly good house on the west side, and we both know it.\u201d'],
      ['\u201cIt\u2019s your coin. I won\u2019t argue with it.\u201d'],
    ];
    dialogue.callbacks = [function() {
      choice.title     = 'Innkeeper';
      choice.options   = ['Rest  (20g)', 'Leave'];
      choice.cursor    = 0;
      choice.callbacks = [
        function rest() {
          if (stats.gold >= 20) {
            stats.gold -= 20;
            stats.hp    = stats.maxHp;
            if (hasStatusEffect('poison'))  removeStatusEffect('poison');
            if (hasStatusEffect('muddied')) removeStatusEffect('muddied');
            if (hasStatusEffect('slither')) removeStatusEffect('slither');
            if (hasStatusEffect('cursed'))  removeStatusEffect('cursed');
            day++;
            console.log(`Day ${day} \u2014 day off: ${isDayOff()}`);
            dialogue.name  = 'Innkeeper';
            dialogue.pages = [['You rest well.', 'HP fully restored.']];
            dialogue.open  = true;
            dialogue.page  = 0;
          } else {
            dialogue.name  = 'Innkeeper';
            dialogue.pages = [['Not enough gold.']];
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
    return true;
  }
  if (currentTownId === 'calwick' && isDayOff()) {
    // Supervisor at dayoff position. During the ordered rest week after the
    // fen post case (mq4_available_day set, reservoir assignment not yet
    // given), he reacts to how the Polwick matter ended \u2014 but only to what
    // he was actually TOLD (fort_report_filed): a player who killed everyone
    // and claimed nothing gets his ordinary Dayoff lines.
    const sdx = player.x - SUPERVISOR_DAYOFF.x, sdy = player.y - SUPERVISOR_DAYOFF.y;
    if (Math.sqrt(sdx * sdx + sdy * sdy) < TALK_RADIUS) {
      dialogue.name  = 'Supervisor';
      // ── The Fourteenth File (side quest) ─────────────────────────────────
      // Assigned and reported here, at his off-the-clock Dayoff table. Offered
      // at a 1/3 chance each Dayoff once the player is an established
      // investigator and not during the fen-post rest week; the roll is stored
      // per Dayoff (fourteenth_file_offer_day/offered) so re-talking — or a
      // save/load — the same day is stable. See quests.js for the flags and
      // reportFourteenthFile() below for the report + moral choice.
      if (fourteenth_file_stage === 1) {
        if (window.ff_clue_skiff) {
          dialogue.pages = [
            ['He sees the look on you and closes the folder he keeps for this.',
             '“You’ve been out to the boat. Tell me what the water gave up.”'],
          ];
          dialogue.callbacks = [function () {
            choice.title   = 'The Fourteenth File';
            choice.options = ['Report what I found', 'Still working it'];
            choice.cursor  = 0;
            choice.callbacks = [reportFourteenthFile, function notYet() {}];
            choice.open = true;
          }];
        } else {
          dialogue.pages = [
            ['“The Marsh business.” He doesn’t look up from his untouched drink.',
             '“The skiff’s out in the Thornmere shallows — the dried mud where open water used to be. Start there. The rest follows the boat.”'],
            ['“This low water’s baring more than one thing. The old drainage works. The drained creek beds up past the fen.”',
             '“Bring me what’s actually there.”'],
          ];
          dialogue.callbacks = null;
        }
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
      if (fourteenth_file_stage === 0 && MainQuest >= 1 && !(mq4_available_day > 0 && !reservoir_quest_started)) {
        if (fourteenth_file_offer_day !== day) {
          fourteenth_file_offer_day = day;
          fourteenth_file_offered   = Math.random() < (1 / 3);
          syncQuestFlagsToWindow();
        }
        if (fourteenth_file_offered) {
          dialogue.pages = [
            ['He’s at his usual Dayoff table, but he isn’t drinking. A thin, water-stained folder sits closed under his hand.',
             '“Sit a moment. This is off the clock — you can say no, and it stays said.”'],
            ['“The drought’s handing things back. A boat came up out of the Thornmere shallows this week that’s been down fourteen years.”',
             '“It was a fen constable’s. Halden Marsh. His is the first file I inherited when I came to Calwick, and the only line in it reads ‘presumed lost.’ I signed it closed. I was new. I trusted the record.”'],
            ['“I never liked it and never had a reason I could write down. The water’s given me one.”',
             '“I want an accurate account of what happened to that man. That’s all. It may come to nothing.”',
             'The way he says “nothing” is not the way a man says it when he believes it.'],
          ];
          dialogue.callbacks = [function () {
            choice.title   = 'Supervisor';
            choice.options = ['Take the case', 'Not tonight'];
            choice.cursor  = 0;
            choice.callbacks = [
              function take() {
                fourteenth_file_stage = 1;
                syncQuestFlagsToWindow();
                dialogue.name  = 'Supervisor';
                dialogue.pages = [
                  ['He slides the folder across. It’s almost empty, which is the point.',
                   '“Start with the boat, in the shallows. Then wherever the boat sends you — the drainage works, the drained creek beds. The same low water is showing all of it.”'],
                  ['“Bring me what you actually find. Not what tidies the file.”',
                   '“I’m here every Dayoff. This one doesn’t touch your regular work — it’s mine, and now a little of it is yours.”'],
                ];
                dialogue.callbacks = null;
                dialogue.open  = true;
                dialogue.page  = 0;
              },
              function notNow() {
                dialogue.name  = 'Supervisor';
                dialogue.pages = [['“No shame in it.” He puts the folder back under his hand.',
                                   '“It’s waited fourteen years. It can wait for a Dayoff you’ve the stomach for.”']];
                dialogue.callbacks = null;
                dialogue.open  = true;
                dialogue.page  = 0;
              },
            ];
            choice.open = true;
          }];
          dialogue.open = true;
          dialogue.page = 0;
          return true;
        }
      }
      const restWeekDayoff = mq4_available_day > 0 && !reservoir_quest_started;
      if (restWeekDayoff && fort_report_filed && smugglers_dead) {
        dialogue.pages = [
          ['He\u2019s at his usual table.',
           'The drink in front of him is untouched.'],
          ['\u201cFourteen years, I told you once. You learn to leave it at the door.\u201d',
           '\u201cSome weeks the door doesn\u2019t hold.\u201d'],
          ['\u201cI sent you out to that post. That\u2019s the job, and I\u2019d send you again.\u201d',
           '\u201cBut I sign the file. So I buy the drink I\u2019m not drinking.',
           'That\u2019s the arrangement I\u2019ve come to.\u201d'],
          ['\u201cEnjoy your Dayoff, Investigator.',
           'That\u2019s an instruction.\u201d'],
        ];
      } else if (restWeekDayoff && fort_report_filed) {
        dialogue.pages = [
          ['\u201cThe district has Polwick now.\u201d',
           '\u201cPaper moves slower than a verdict. But it arrives.\u201d'],
          ['\u201cNothing about that matter is ours anymore.',
           'I keep telling the ledger that. The ledger is unconvinced.\u201d'],
          ['\u201cEnjoy your Dayoff. We\u2019re back at it after.\u201d'],
        ];
      } else {
        dialogue.pages = [
          ['\u201cFourteen years.\u201d'],
          ['\u201cYou learn to leave it at the door.\u201d', 'He takes a slow sip of his drink.'],
        ];
      }
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
    // Esla at dayoff position. Same rest-week override as the Supervisor
    // above — but Esla's condition keys on smugglers_dead itself, not on
    // what the player reported: she closes registry files, so she knows
    // Polwick died whether or not the report said "found nothing" (exactly
    // like her established office dialogue for the same event).
    const edx = player.x - ESLA_DAYOFF.x, edy = player.y - ESLA_DAYOFF.y;
    if (Math.sqrt(edx * edx + edy * edy) < TALK_RADIUS) {
      dialogue.name  = 'Esla';
      const eslaRestDayoff = mq4_available_day > 0 && !reservoir_quest_started;
      if (eslaRestDayoff && smugglers_dead) {
        dialogue.pages = [
          ['She’s at the bar tonight, not her usual table.',
           '“Don’t ask me how I am.',
           'Everyone keeps deciding not to ask. I watch them decide.”'],
          ['“I closed his registry file this week. Polwick’s.”',
           '“Tonight I’m going to finish this drink and not be a registry clerk until tomorrow.”'],
          ['“You can stand here, though.',
           'You don’t have to say anything.”'],
        ];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      } else if (eslaRestDayoff && smugglers_execution_day > 0) {
        dialogue.pages = [
          ['“Registry work follows you to the inn. Did you know that?”',
           '“Someone asked me tonight what happens to him now. Polwick.”'],
          ['“I said: I don’t decide that. Which is true.”',
           'She turns her glass a quarter-turn.',
           '“It didn’t feel true when I said it.”'],
        ];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
      // Rotate through 22 states across successive dayoffs.
      const eslaInnState = Math.floor(day / 5) % 22;
      if (eslaInnState === 0) {
        dialogue.pages = [
          ['\u201cI always forget how loud it is in here.\u201d'],
          ['\u201cNicer than the office on a slow day, though.\u201d'],
        ];
      } else if (eslaInnState === 1) {
        dialogue.pages = [
          ['\u201cI pass your place on the west side most mornings. Have for years.\u201d'],
          ['\u201cLights on early, more often than not.',
           'I never say anything about it. But I notice.\u201d'],
          ['\u201cI\u2019m not sure why I\u2019m telling you that.\u201d'],
        ];
      } else if (eslaInnState === 2) {
        dialogue.pages = [
          ['\u201cDon\u2019t tell me anything about work tonight.\u201d'],
          ['\u201cWe can talk about anything else.',
           'Anything at all.\u201d'],
          ['\u201cSurprise me.\u201d'],
        ];
      } else if (eslaInnState === 3) {
        dialogue.pages = [
          ['\u201cI was going to leave an hour ago.\u201d'],
          ['She picks up her drink without looking away.',
           '\u201cObviously I didn\u2019t.\u201d'],
          ['\u201cI\u2019m not complaining about it.\u201d'],
        ];
      } else if (eslaInnState === 4) {
        dialogue.pages = [
          ['\u201cI grew up in Alecton.\u201d',
           '\u201cThe prep school, specifically.',
           'Most people here don\u2019t know what that means.\u201d'],
          ['\u201cIt\u2019s a private school. Rareborn children only \u2014 the early kind of early.',
           'Years before the Academy takes everyone at twelve.\u201d',
           '\u201cThe sort of place a family pays for, and then mentions.\u201d'],
          ['\u201cMy mother signed the forms before I was two.',
           '\u201cShe was proud. I think she was proud.\u201d',
           'She looks at her glass.',
           '\u201cI never actually asked her.\u201d'],
        ];
      } else if (eslaInnState === 5) {
        dialogue.pages = [
          ['\u201cThey test you at five. At Alecton, anyway.\u201d',
           '\u201cNot the thread \u2014 anyone can read a thread. It\u2019s the hair.\u201d',
           '\u201cControl. Temperament. How much teaching you\u2019ll take.\u201d'],
          ['\u201cMine was green things.',
           'Anything growing.',
           'I could feel what a plant was about to do,',
           'the way you feel a room about to go quiet.\u201d'],
          ['\u201cThe examiner kept a pot of clover on her desk.',
           'By her third question it had leaned toward me and flowered.\u201d',
           'A small smile.',
           '\u201cShe wrote something down. The clover and I watched her do it.\u201d'],
        ];
      } else if (eslaInnState === 6) {
        dialogue.pages = [
          ['\u201cThere were twelve of us in my year. At Alecton, I mean.',
           'The Academy proper takes everyone at twelve \u2014 that\u2019s hundreds.\u201d',
           '\u201cYou don\u2019t make friends in those places the way you do here.',
           'It\u2019s different when everyone knows what everyone else is.\u201d'],
          ['\u201cThere was a boy \u2014 Pell, we called him \u2014',
           'who could read water. Current, pressure, what was upstream.\u201d',
           '\u201cHe\u2019d hold a cup and tell you where the river had been.\u201d'],
          ['\u201cI wonder where he ended up.\u201d',
           'She says it like she probably already knows',
           'and doesn\u2019t want to say.'],
        ];
      } else if (eslaInnState === 7) {
        dialogue.pages = [
          ['\u201cWhen you graduate, they place you.\u201d',
           '\u201cNot always where you ask.',
           'But they ask. That much is true.\u201d'],
          ['\u201cI asked for somewhere quiet.\u201d',
           'She turns her cup in her hands.',
           '\u201cI thought that meant something specific.',
           'I\u2019m not sure I knew what I wanted.\u201d'],
          ['\u201cThey sent me here.\u201d',
           '\u201cI\u2019ve been trying to decide, for six years,',
           'whether that was an answer or a question.\u201d'],
        ];
      } else if (eslaInnState === 8) {
        dialogue.pages = [
          ['\u201cThe fens were strange to me at first.',
           'Everything close together and damp.',
           'The light doing something wrong in the afternoons.\u201d'],
          ['\u201cNow I\u2019d miss it.\u201d',
           'She says this like it surprises her.',
           '\u201cThe smell of it after rain.',
           'I\u2019d miss that specifically.\u201d'],
          ['\u201cI didn\u2019t expect to have a here.\u201d',
           '\u201cSomewhere that feels like it knows me back.\u201d',
           'She\u2019s quiet for a moment.',
           '\u201cI didn\u2019t expect that.\u201d'],
        ];
      } else if (eslaInnState === 9) {
        dialogue.pages = [
          ['\u201cTomas has been in this town his whole life.\u201d',
           '\u201cHe knows every name. Every family, three generations back.\u201d',
           '\u201cI find that remarkable. I think it\u2019s remarkable.\u201d'],
          ['\u201cHe doesn\u2019t understand the Academy.',
           'Not really.',
           'I\u2019ve tried to explain it and the words come out wrong.\u201d'],
          ['\u201cBut he makes good soup.\u201d',
           'A pause.',
           '\u201cThat sounds diminishing. I don\u2019t mean it that way.',
           'The soup is genuinely excellent.\u201d'],
        ];
      } else if (eslaInnState === 10) {
        dialogue.pages = [
          ['\u201cSix years.\u201d',
           '\u201cIt used to feel like a posting.',
           'Something I was doing until something else started.\u201d'],
          ['\u201cNow it just feels like where I live.\u201d',
           'She looks around the inn like she\u2019s seeing it for the first time.',
           '\u201cI\u2019m not sure when that changed.\u201d'],
        ];
      } else if (eslaInnState === 11) {
        dialogue.pages = [
          ['\u201cI\u2019ve thought about putting in for a transfer.\u201d',
           '\u201cTwice. Once in the second year, once in the fourth.\u201d'],
          ['\u201cBoth times I started the form and then didn\u2019t finish it.\u201d',
           'She tilts her head slightly.',
           '\u201cI tell myself it was inertia.',
           'I\u2019m not sure I believe me.\u201d'],
        ];
      } else if (eslaInnState === 12) {
        dialogue.pages = [
          ['\u201cYou look at me differently than the others do.\u201d'],
          ['She doesn\u2019t look away.',
           '\u201cI notice things. You know that by now.',
           'I noticed that.\u201d'],
          ['\u201cI\u2019m not sure what to do with it.',
           'I just wanted to say it out loud.',
           'To someone.\u201d'],
        ];
      } else if (eslaInnState === 13) {
        dialogue.pages = [
          ['\u201cThis is the part where I\u2019d usually say goodnight.\u201d'],
          ['She doesn\u2019t move.',
           '\u201cI\u2019m saying it now so I don\u2019t have to mean it.\u201d'],
        ];
      } else if (eslaInnState === 14) {
        dialogue.pages = [
          ['\u201cYou could ask me something.',
           'I\u2019d probably answer it.\u201d'],
          ['\u201cI don\u2019t say that often.',
           'To anyone.',
           'So.\u201d'],
          ['She looks away first.',
           '\u201cJust noting.\u201d'],
        ];
      } else if (eslaInnState === 15) {
        dialogue.pages = [
          ['\u201cI had a version of this conversation once.',
           'In Alecton, before placement.\u201d',
           '\u201cSomeone sitting where you are. Same kind of quiet.\u201d'],
          ['\u201cI didn\u2019t know what to do with it then either.\u201d',
           'She finishes her drink.',
           '\u201cI\u2019m better at noticing than I am at deciding.\u201d'],
        ];
      } else if (eslaInnState === 16) {
        dialogue.pages = [
          ['\u201cThere was a posting in the northeast.',
           'Registry central, Harrow\u2019s main office.',
           'Good work. Real work.\u201d'],
          ['\u201cI was offered it at the end of my first year here.',
           'I turned it down.\u201d'],
          ['\u201cI\u2019ve never been sure why.',
           'Something about the way the fens were that morning.',
           'That\u2019s not a real reason.',
           'I know it\u2019s not a real reason.\u201d'],
        ];
      } else if (eslaInnState === 17) {
        dialogue.pages = [
          ['\u201cSometimes I think about who I\u2019d be if I\u2019d gone east.\u201d'],
          ['\u201cSomeone efficient.',
           'Probably.',
           'Good at the large version of the same things I\u2019m good at here.\u201d'],
          ['\u201cI\u2019m not sure I\u2019d like her very much.\u201d',
           'A pause.',
           '\u201cOr maybe I would.',
           'That\u2019s the part I can\u2019t figure out.\u201d'],
        ];
      } else if (eslaInnState === 18) {
        dialogue.pages = [
          ['\u201cIt\u2019s not that I\u2019m unhappy.\u201d',
           '\u201cThat\u2019s not the word for it.\u201d'],
          ['\u201cIt\u2019s more like \u2014 I had the sense, when I was younger,',
           'that being rareborn meant the path would be clear.',
           'That you\u2019d know where you were going.\u201d'],
          ['\u201cInstead it just means you feel the fog more precisely.\u201d',
           'She almost smiles.',
           '\u201cVery precise fog. That\u2019s my gift.\u201d'],
        ];
      } else if (eslaInnState === 19) {
        dialogue.pages = [
          ['\u201cMy mother used to say the fen is honest land.\u201d',
           '\u201cIt shows you exactly what it is.',
           'No pretense.\u201d'],
          ['\u201cI thought she was being poetic.',
           'She wasn\u2019t.',
           'She\u2019d never been here.\u201d'],
          ['\u201cBut she was right.\u201d',
           '\u201cI\u2019ve been here six years and it still doesn\u2019t soften.',
           'I\u2019ve started to respect that.\u201d'],
        ];
      } else if (eslaInnState === 20) {
        dialogue.pages = [
          ['\u201cThere\u2019s a part of the roof you can get to from the upper window.\u201d',
           '\u201cThe supervisor doesn\u2019t know about it.',
           'Or if he does, he\u2019s pretending.\u201d'],
          ['\u201cOn clear nights you can see all the way to the north ridge.\u201d',
           '\u201cI go up sometimes.',
           'Alone.',
           'It\u2019s \u2014 I don\u2019t have a good word for what it is.\u201d'],
          ['\u201cClear.\u201d',
           'She settles on it.',
           '\u201cIt\u2019s clear up there.\u201d'],
        ];
      } else {
        dialogue.pages = [
          ['\u201cI see things I\u2019m not supposed to.',
           'At work.',
           'In rooms.',
           'Between people.\u201d'],
          ['\u201cI\u2019ve learned to mostly not say them out loud.\u201d',
           'She looks at you steadily.',
           '\u201cWith you, I keep having to remind myself.\u201d'],
        ];
      }
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
    // ── The Struck Entry (side quest) — offered by Corvin, off the clock ─────
    // Corvin only asks at the inn, on a Dayoff, and only for one thing: the
    // canal record he's barred from fixing himself (see quests.js). Offered at a
    // 1/3 chance each Dayoff once the player is established and not during the
    // fen-post rest week; the roll is stored per Dayoff (corvin_favor_offer_day/
    // offered) so re-talking — or a save/load — the same day is stable. Once he's
    // asked (corvin_favor_started) or it's done, this steps aside and his normal
    // SIMPLE_NPCS dialogue plays. The resolution isn't built yet — accepting only
    // records that he asked; nothing sets corvin_favor_done.
    {
      const corvin = SIMPLE_NPCS.find(n => n.id === 'corvin');
      if (corvin && corvin.map === currentContentLocationKey() &&
          !corvin_favor_started && !corvin_favor_done &&
          MainQuest >= 1 && !(mq4_available_day > 0 && !reservoir_quest_started)) {
        const cdx = player.x - corvin.x, cdy = player.y - corvin.y;
        if (Math.sqrt(cdx * cdx + cdy * cdy) < TALK_RADIUS) {
          if (corvin_favor_offer_day !== day) {
            corvin_favor_offer_day = day;
            corvin_favor_offered   = Math.random() < (1 / 3);
            syncQuestFlagsToWindow();
          }
          if (corvin_favor_offered) {
            dialogue.name  = 'Corvin';
            dialogue.pages = [
              ['He’s turned his chair a little away from the room. The cup in front of him is untouched.',
               '“You go to Drenwick and back, and nobody signs you in or out. I’ve been watching you do it for weeks.”'],
              ['“I have a thing I can’t do myself. Not won’t — can’t.”',
               '“My father kept the third lock on the old Drenwick canal. Thirty years, in weather that’d take the paint off you.”'],
              ['“When they wound the canals down, a clerk struck his name from the keeper’s roll. One pen stroke. As though the lock had kept itself.”',
               'He says it flat, the way he says everything, which is how you know it isn’t flat at all.'],
              ['“I reconcile records for the district. His is the one I’m barred from touching — my hand on it and the correction’s void. I taught that rule. I won’t be the man who breaks it.”',
               '“But the original towpath tally still carries his mark, if it survived. It’d be in Drenwick — the old canal office, or whatever swallowed its papers when it shut.”'],
            ];
            dialogue.callbacks = [function () {
              choice.title   = 'Corvin';
              choice.options = ['Find the tally', 'Not now'];
              choice.cursor  = 0;
              choice.callbacks = [
                function take() {
                  corvin_favor_started = true;
                  syncQuestFlagsToWindow();
                  dialogue.name  = 'Corvin';
                  dialogue.pages = [
                    ['He nods once, and turns his chair back to the table.',
                     '“Good. His name goes back where it was, and that’s the whole of it.”'],
                    ['“I keep accounts better than anyone in this district.”',
                     'He picks up the cup at last.',
                     '“Do this, and I’ll not have yours standing open.”'],
                  ];
                  dialogue.callbacks = null;
                  dialogue.open  = true;
                  dialogue.page  = 0;
                },
                function notNow() {
                  dialogue.name  = 'Corvin';
                  dialogue.pages = [['“No.” He turns the cup a quarter-turn and lets it sit.',
                                     '“It’s waited thirty years. It’ll keep. Ask me again if the mood takes you.”']];
                  dialogue.callbacks = null;
                  dialogue.open  = true;
                  dialogue.page  = 0;
                },
              ];
              choice.open = true;
            }];
            dialogue.open = true;
            dialogue.page = 0;
            return true;
          }
        }
      }
    }
    // Petra and Corvin caught by interactSimpleNPCs (their map getter returns 'inn')
    interactSimpleNPCs();
    return true;
  }
  const rtx = player.x - RESERVED_TABLE.x;
  const rty = player.y - RESERVED_TABLE.y;
  if (Math.sqrt(rtx * rtx + rty * rty) < TALK_RADIUS) {
    dialogue.name  = 'Reserved Table';
    dialogue.pages = [['Reserved for Imperial office staff.']];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

// ── CALWICK_MAP_FEATURES: region-owned MAP_FEATURES entries (merged in interactions.js) ──
const CALWICK_MAP_FEATURES = {
  // ── West Calwick survey marker ────────────────────────────────────────
  // Was: when: () => currentTownId === 'calwick' && activeMap === WEST_TOWN_MAP.
  // WEST_TOWN_MAP is Calwick-only (no other town reuses it -- see
  // MAP_METADATA['WEST_TOWN_MAP']), so the condition is redundant with the
  // map key alone, but kept anyway for exact behavioral parity with the
  // original rather than assuming that's safe to drop.
  WEST_TOWN_MAP: [
    {
      id:        'survey_marker_west_calwick',
      type:      'inspect',
      x:         1.5, y: 10.5,
      condition: () => currentTownId === 'calwick',
      label:     'Survey marker',
      pages: [
        ['A short wooden post set into the path.',
         'Brass plate, tarnished but legible.'],
        ['CALWICK WEST \u2014 PARCEL 7G',
         'Classification: Residential.',
         'Status: Pending final registration.',
         'Allocated to: [BLANK]'],
        ['Below the plate, smaller text:',
         'Reference incomplete \u2014 household name absent at time of survey.',
         'See district file.'],
        ['There\u2019s a date.',
         'Sixteen years ago.',
         'You\u2019ve lived here long enough that this should bother you more than it does.'],
      ],
    },
  ],

  // \u2500\u2500 Calwick main square & lanes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // First environmental flavor for the starting town itself (it had none).
  // Same currentTownId condition convention as the west survey marker
  // above. Both sit on plain street tiles, well clear of the market rows
  // (6-8) and every SIMPLE_NPCS position, so nothing higher-priority can
  // shadow them.
  TOWN_MAP: [
    {
      id:        'calwick_charter_stone',
      type:      'inspect',
      x:         1.5, y: 5.5,
      condition: () => currentTownId === 'calwick',
      label:     'Charter stone',
      pages: [
        ['A waist-high boundary stone where the west road enters town.',
         'The face has been re-cut at least twice.'],
        ['CALWICK \u2014 INCORPORATED TOWN',
         'Thornmere Drainage District.',
         'Re-dedicated in the Millennial year, 1000 AC.'],
        ['Under the newer lettering, an older line survives in shallower strokes:',
         '\u201c\u2026raised from the reeds, and holds while the water lets it.\u201d'],
      ],
    },
    {
      id:        'calwick_town_cistern',
      type:      'inspect',
      x:         11.5, y: 12.5,
      condition: () => currentTownId === 'calwick',
      label:     'Public cistern',
      pages: [
        ['The town cistern \u2014 a broad stone-lipped tank at the end of the south lane.',
         'Depth marks are painted down the inside wall.'],
        ['The water stands a full hand below the lowest painted mark.',
         'Someone has chalked a new line under it rather than repainting properly.'],
        ['A damp office notice is tacked to the lip:',
         'DRAW FOR HOUSEHOLD USE ONLY UNTIL FURTHER NOTICE.',
         'Third month without rain. The word \u201cdrought\u201d is official now.'],
      ],
    },
  ],

  // \u2500\u2500 Calwick east side \u2014 the wetland margin \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // The working edge of town: reed harvest and the office's water-level
  // bookkeeping. The gauge deliberately reads like a small local echo of
  // the North Basin story (old high marks stranded above the water).
  EAST_TOWN_MAP: [
    {
      id:        'calwick_wetland_gauge',
      type:      'inspect',
      x:         13.5, y: 5.5,
      condition: () => currentTownId === 'calwick',
      label:     'Water gauge',
      pages: [
        ['A numbered measuring stave driven into the reed bed where the wetland meets the road.',
         'The paint is freshest near the bottom.'],
        ['The wet line sits well below the old high-water stains.',
         'A weathered tin plate: READINGS TAKEN FIRST WORKDAY. FORWARD TO OFFICE.'],
        ['Someone has scratched beside the lowest number:',
         '\u201csame story up north.\u201d'],
      ],
    },
    {
      id:        'calwick_reed_racks',
      type:      'inspect',
      x:         7.5, y: 10.5,
      condition: () => currentTownId === 'calwick',
      label:     'Reed-drying racks',
      pages: [
        ['Reed-cutters\u2019 drying racks \u2014 long horizontal poles hung with bound bundles.',
         'Half the pegs are empty.'],
        ['Tally marks are cut into the end post, one row per season.',
         'This season\u2019s row is the shortest by some way.'],
        ['The bundles that are here are thin.',
         'Good reed wants standing water, and the beds have been drying back all year.'],
      ],
    },
  ],

};

// Split out of the former interactWildsAndOutposts() by the regional-content-split;
// original branch order preserved. Reached as an OVERWORLD_INTERACT_HANDLERS entry.
function interactCalwickVale() {
  // Hidden meadow — the amethyst chest, and the Briar Warden waiting by the
  // pool (quest active only; prompted with Space, same as its old dungeon den)
  if (activeMap === MEADOW_MAP) {
    if (!MEADOW_CHEST.opened) {
      const mcx = player.x - MEADOW_CHEST.x;
      const mcy = player.y - MEADOW_CHEST.y;
      if (Math.sqrt(mcx * mcx + mcy * mcy) < TALK_RADIUS) {
        MEADOW_CHEST.opened = true;
        const it = MEADOW_CHEST.item;
        grantItem(it.name);
        dialogue.name  = '';
        dialogue.pages = [['Chest opened.', `${it.name}  ${itemStatParen(it)}  — added to items.`]];
        dialogue.open  = true;
        dialogue.page  = 0;
        return true;
      }
    }
    if (warden_quest_started && !warden_quest_defeated) {
      const wx = player.x - BRIAR_WARDEN_SPAWN.x;
      const wy = player.y - BRIAR_WARDEN_SPAWN.y;
      if (Math.sqrt(wx * wx + wy * wy) < TALK_RADIUS) {
        dialogue.name  = '';
        dialogue.pages = [
          ['The Briar Warden turns toward you.', 'It does not back down.'],
        ];
        queueDialogueEncounter('warden');
        dialogue.open  = true;
        dialogue.page  = 0;
        return true;
      }
    }
  }
  // Route board — Maren's waykeeper post (east interior wall, col 9 row 4)
  if (activeMap === MAREN_POST_MAP) {
    const rbx = player.x - 9.5 * TILE;
    const rby = player.y - 4.5 * TILE;
    if (Math.sqrt(rbx * rbx + rby * rby) < TALK_RADIUS) {
      dialogue.name  = 'Route Board';
      dialogue.pages = [
        ['WAYKEEPER POST \u2014 CALWICK WEST',
         'East: Calwick, 2 leagues.',
         'West: Drenwick canal road, 11 leagues.',
         'North: fen access track \u2014 seasonal, use with caution.',
         'Aetherrail: nearest railhead three towns east. Road east, coach from Drenwick.'],
        ['Conditions (last updated by waykeeper):',
         'Canal road: maintained. Night travel not advised \u2014 canal edge unmarked in parts.',
         'Fen track: passable. Soft margins after rain.',
         'Unmarked beyond the second post. Proceed with a guide if unfamiliar.'],
        ['This post is staffed.',
         'Enquiries to the waykeeper on duty.'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}
