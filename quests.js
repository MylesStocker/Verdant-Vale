'use strict';

// ─── Quest flags ──────────────────────────────────────────────────────────────
// Mutable quest-progress state shared across main.js and interactions.js.
// Loaded after data.js and before main.js so all scripts see the same bindings.

// Set true when the Weight Discrepancy quest's countersigned note actually
// gets filed in the Calwick office cabinet (see weight_note_signed below and
// the Filing Cabinet interaction in interactions.js). Gates the "files have
// been disturbed" line on the cabinet itself, plus small reactive lines from
// Esla and the Supervisor once it's set.
let cabinetCaseFlag      = false;
let sluice_job_started      = false;
let sluice_fixed            = false;
let sluice_pay_ticket_ready = false;
let sluice_reward_given     = false;
let MainQuest            = 0;    // tracks player progress through the main story

// ─── Starting kit requisition ──────────────────────────────────────────────────
// The player no longer starts with equipment already in their pack. The
// Supervisor issues a requisition slip alongside the sluice job (the first
// assignment); Aldric (Calwick office) exchanges it for the starting kit
// (Iron Sword + Leather Armor) on next visit, then reverts to his normal
// dialogue for all later visits.
let equipment_ticket_ready = false;
// ─── Side quest: The Long Way Round ──────────────────────────────────────────
// Dessa (drenwick_west_a) searches for her rareborn sister Yael.
// Orwen (apt_1, Calwick) is a former transfer clerk who remembers the file.
// 0=unstarted, 1=met Dessa, 2=met Orwen, 3=Dessa gave letters,
// 4=letters with Orwen, 5=Dessa got emotional reveal, 6=Orwen gave address, 7=complete
let letter_quest_stage = 0;

// ─── Side quest: Pell's Secret ────────────────────────────────────────────────
// The player's cat (named Pell by neighbour Oswin) has been going out at night
// and dragging things home. The player discovers the stash in stages.
// 0=normal, 1=first rest done (cat will drop a coin next visit),
// 2=coin seen (cat will show the stash corner next visit), 3=stash found (done)
let cat_quest_stage = 0;

// ─── Side quest: Removal Contract (Briar Warden) ─────────────────────────────
let warden_quest_started  = false; // player accepted contract from Mault
let warden_quest_defeated = false; // Briar Warden defeated in the hidden spring meadow (NW corner of the vale)
let warden_quest_rewarded = false; // Mault has paid the 120g reward

// ─── Quest: Dispatch Letter ────────────────────────────────────────────────────
// Supervisor asks player to carry a letter to the Drenwick district office.
// dispatch_quest_started → letter given; dispatch_delivered → Drenwick received it;
// dispatch_rewarded → Calwick paid return reward (MainQuest → 2)
let dispatch_quest_started    = false;
let dispatch_delivered        = false;
let dispatch_pay_ticket_ready = false;
let dispatch_rewarded         = false;

// ─── Side quest: Schilling the Bear ──────────────────────────────────────────
// Pip (Calwick school, appears day 2+) lost his teddy bear Schilling to Wrongteeth.
// Player recovers Schilling by defeating or hugging Wrongteeth (dungeon floor 2).
// Returning Schilling rewards the cat-shaped key, used later in the cat-quest arc.
let schilling_quest_started = false;
let schilling_returned      = false;

// ─── Quest: The Unmarked Post ─────────────────────────────────────────────────
// Supervisor sends player to investigate an unregistered guard post south of
// Drenwick (MAP3_N1). The post is a smuggler's front.
// fort_quest_stage: 0=unconfonted, 1=guard fight, 2=polwick fight, 3=essa fight,
//   4=all defeated, 5=spared, 6=reported/denied to supervisor
let fort_quest_started       = false; // supervisor gave the investigation assignment
let fort_quest_stage         = 0;     // tracks fight/spare/report progress
let fort_pay_ticket_ready    = false; // supervisor issued pay ticket after report
let fort_pay_ticket_reduced  = false; // true if the ready ticket is the reduced "Found nothing" rate (15g) rather than the full 200g
let smugglers_dead           = false; // true once smugglers are eliminated (fought or Imperial follow-up)
let smugglers_execution_day  = 0;     // >0: the day Empire arrives (day reported + 5); 0 = not scheduled
// True if the player told the supervisor the truth about the fen post
// ("Report what I found", killed or spared); false if they claimed to have
// found nothing. Distinguishes what the SUPERVISOR knows from what actually
// happened (smugglers_dead) — a player who killed everyone and then claimed
// "found nothing" gets neutral wording later, not killed-aware wording.
let fort_report_filed        = false;

// ─── Main story: rest week + reservoir bed assignment (post-MainQuest 3) ──────
// After the fen post pay ticket is processed (MainQuest = 3), the supervisor
// closes out the Polwick matter and stands the player down for the rest of the
// week. The next main assignment (the exposed reservoir bed north of Drenwick,
// the MainQuest-4 arc) is only offered from the first workday after the next
// Dayoff. mq4_available_day is that workday's day number, computed when the
// rest order is given (0 = rest order not yet given). The assignment itself
// only sets reservoir_quest_started; MainQuest stays 3 until the reservoir
// quest is actually completed (same pattern as every earlier main step).
let mq4_available_day        = 0;     // day the reservoir assignment unlocks; 0 = rest order not yet given
let reservoir_quest_started  = false; // supervisor gave the reservoir bed assignment
let reservoir_report_filed   = false; // player has reported the Sunken Gallery findings back to the supervisor

// ─── Side quest: The Weight Discrepancy ───────────────────────────────────────
// A cargo weight mismatch between Drenwick harbormaster records and Calwick
// district ledgers requires a neutral party to carry paperwork between offices.
// 0=unstarted, 1=Renn briefed (go to Aldric in Calwick),
// 2=Aldric done (go to Corvin), 3=Corvin signed (return to Renn), 4=paid/done
let weight_quest_stage = 0;
// True once Corvin countersigns the correction (still within stage 2) — the
// note then has to actually be filed before the quest can advance to stage 3.
// Aldric asks the player to file it themselves (he's backlogged); the real
// choice, and where cabinetCaseFlag flips, happens at the filing cabinet
// itself. Refusing at the cabinet just leaves the note unfiled — the quest
// cannot reach stage 3 (and Renn's payoff) until cabinetCaseFlag is set.
let weight_note_signed = false;

// ─── Side quest: Between Posts ────────────────────────────────────────────────
// Sena (Calwick) and Davan (Drenwick) are separated. They send notes through
// the player across four exchanges — the tone shifts from clipped and defensive
// to something softer. Tev, their kid, is at school on work days and with Sena
// on Dayoff.
// 0=unstarted, 1=carrying note 1 to Davan, 2=carrying reply to Sena,
// 3=carrying note 3 to Davan, 4=carrying final note to Sena, 5=complete
let drama_stage = 0;

// ─── Side quest: The Pale Sentry ──────────────────────────────────────────────
// A large pale creature has been reported at the old blocked pass north of
// Drenwick. Constable Tarvec only hands out the contract once the player has
// seen the removal notice on the Drenwick board (sentry_seen_on_board). The
// creature appears on MAP_N2 once accepted, with 500 HP that persists across
// encounters until it is killed.
let sentry_seen_on_board  = false;
let sentry_quest_started  = false;
let sentry_quest_done     = false;
let sentry_quest_rewarded = false;
let pale_sentry_hp        = 500;

// ─── Side quest: Still Water ──────────────────────────────────────────────────
// Mabel (hamlet elder, MAP3_N1) lost her fen sickle at the north bank of the bog
// pond two seasons ago. She puts a notice on the Drenwick market board; the player
// picks it up there. Gridd (eel fisher, nearby) warns the player not to wake the
// rainfish nesting under the north bank overhang. Heeding this advice (talking to
// Gridd before retrieving the sickle) produces a cleaner recovery and a better reward.
// The quest is not about rainfish — it's about recovering a treasured personal tool.
// 0=unstarted, 1=quest given (sickle at pond), 2=retrieved clean, 3=retrieved churned, 4=complete
let sickle_quest_stage    = 0;
let gridd_rainfish_warned = false; // true after Gridd gives the "don't wake the rainfish" warning
let rainfish_woken        = false; // true once the player steps in the bog-edge danger zone and fights begin

// ─── Side quest: The Unoccupied Property (Den Wraith) ─────────────────────────
// A creature has manifested in the empty house west_i (west Calwick residential).
// Pek (the resident) has vacated. District inspector Morden posted the job on the
// Calwick board. The wraith only manifests fully on Dayoff.
// den_wraith_quest_started → player accepted the job
// den_wraith_defeated      → wraith eliminated in west_i
// den_wraith_rewarded      → Morden paid the 200g fee
let den_wraith_quest_started = false;
let den_wraith_defeated      = false;
let den_wraith_rewarded      = false;

// ─── Letter: Netto ────────────────────────────────────────────────────────────
// Player's older brother Netto sends a letter from Halcyra (imperial capital).
// Arrives via district post after day 6; supervisor holds it and hands it over
// on the player's next visit. Entirely non-quest: family news, capital weather,
// book recommendations, jokes.
let netto_letter_received = false;

// ─── Dessa rapport flag ───────────────────────────────────────────────────────
// True after the player has had an introductory conversation with Dessa.
// Dessa will not offer her quest on first contact — she needs one visit first.
let dessa_met = false;

// ─── Rareborn spotting-rhyme flag ─────────────────────────────────────────────
// True once the player has heard the schoolyard rhyme about telling rareborn by
// hair colour (from the Calwick school child). A Drenwick school child checks
// this: if the player already knows the rhyme, that child starts it, realises
// the player has heard it, and trails off instead of reciting the whole thing.
let rareborn_rhyme_heard = false;

// ─── Esla one-shot commentary flags ───────────────────────────────────────────
// Esla (Calwick office) reacts to fresh developments exactly once each; these
// record that the reaction has been shown so it never repeats on later visits
// (her old dialogue appended event commentary to every conversation forever).
// Set via dialogue callbacks in interactions.js's Esla block.
let esla_said_sluice          = false; // commented on the cleared sluice (MainQuest >= 1)
let esla_said_dispatch        = false; // commented on the same-day Drenwick dispatch (MainQuest >= 2)
let esla_said_cabinet         = false; // noticed Aldric's cabinet was disturbed (cabinetCaseFlag)
let esla_said_polwick_pending = false; // spoke about Polwick awaiting the district's decision
let esla_said_polwick_dead    = false; // grieved Polwick's death (killed or executed)
let esla_said_basin           = false; // opened up about the drying basin + her Bloommarked affinity (reservoir_quest_started)

// ─── Daily office greetings ───────────────────────────────────────────────────
// The Supervisor and Esla open the player's FIRST conversation of each day in
// the Calwick office with a "good morning" page. These record the last day
// each greeted, so it happens once per day (0 = never greeted yet).
let supervisor_greet_day = 0;
let esla_greet_day       = 0;

// ─── North-bridge early crossing (pre-MQ4 admonishment) ───────────────────────
// The Imperial toll bridge north of Drenwick (MAP3_N2) is the only crossing of
// the canal, and the North Basin beyond it is deliberately reachable before the
// reservoir assignment exists. If the player crosses north before
// reservoir_quest_started is set, the Calwick supervisor lightly admonishes them
// the next time they report in (that ground isn't on any assignment yet).
// crossed_early records the fact (set in exitBridgeNorth(), world-transitions.js);
// scolded gates the one-time line (set in interactSupervisor(), interactions.js).
// Both are monotonic — once true, they stay true, so re-crossing never re-scolds.
let north_bridge_crossed_early = false;
let north_bridge_scolded       = false;

// One-time: the supervisor's flood-evacuation backstory, offered once after the
// reservoir assignment exists (reservoir_quest_started). Set synchronously in
// interactSupervisor() like north_bridge_scolded, so it can't collide with a
// branch's own dialogue callback.
let supervisor_said_flood      = false;

// ─── Side quest: The Fourteenth File ──────────────────────────────────────────
// Offered by the Supervisor at the Calwick inn on a Dayoff, at a 1/3 chance each
// Dayoff (rolled once per Dayoff and remembered, so re-talking the same day is
// stable). The drought has exposed a foundered patrol skiff; reconstructing it
// reopens the first unresolved case of his Calwick posting — a patrolman filed
// "presumed lost" who was in fact silenced by the revered, now-dead drainage
// Warden Callis to bury his skimming. The player searches three far-flung but
// accessible areas (the exposed skiff, a drainage-fund ledger, Callis's
// dedication plaque), then reports; if the implicating clues were found, the
// player chooses whether to file the truth or seal it to spare Callis's family.
//   stage: 0 not offered/started, 1 assigned/investigating, 2 filed (done)
//   offer_day / offered: the once-per-Dayoff 1/3 availability roll (persisted so
//     save/load and re-talking within a Dayoff are stable)
//   outcome: 0 none, 1 filed accurately (truth on record), 2 sealed (family spared)
// The three clue flags (ff_clue_*) are window-native MAP_FEATURES `flag` fields,
// like the gallery_clue_* set — normalized below, in QUEST_FLAG_SCHEMA, and
// restored via window.* in loadGame().
let fourteenth_file_stage     = 0;
let fourteenth_file_offer_day = 0;
let fourteenth_file_offered   = false;
let fourteenth_file_outcome   = 0;

// ─── Side quest: A Bottle for Her Father ──────────────────────────────────────
// Offered only once MainQuest >= 2 (the Drenwick dispatch done); before that
// Fenna only frets about the drought reaching the fen mushroom beds.
// Fenna (Calwick, apt_2) asks the player to carry mushroom wine from the Wend
// family's fen brewery to her father Sael, who lives alone in a Drenwick
// apartment (corridor B2, unit 1) — she's too scared of the road to go herself.
// wine_quest_gift records which tier Sael actually received ('bottle'/'case'),
// since Fenna's reward later depends on it.
let wine_quest_started   = false; // accepted from Fenna
let wine_quest_gift      = null;  // 'bottle' | 'case' — set once Sael receives the wine
let wine_quest_delivered = false; // Sael has the wine and gave the player a note for Fenna
let wine_quest_rewarded  = false; // Fenna has paid out for the returned note

// ─── Side quest: The Struck Entry ─────────────────────────────────────────────
// Corvin — district ledger clerk, canal family from past Drenwick — carries one
// record he is forbidden to fix: his father kept the third lock on the old
// Drenwick canal, and a clerk struck the name from the keeper's roll when the
// canals were wound down. Corvin reconciles the district's numbers for a living
// but cannot touch this one (his hand on it voids the correction — the same
// neutral-party principle the Weight Discrepancy runs on), so he asks the player
// to recover the original towpath tally that still carries his father's mark.
// Offered off the clock at the Calwick inn on a Dayoff, at a 1/3 chance each
// Dayoff (rolled once per Dayoff and remembered, so re-talking the same day — or
// a save/load — is stable), mirroring the Fourteenth File's availability roll.
//
// NOTE: the resolution (where the tally is, retrieving it, the payoff) is NOT
// built yet — nothing currently sets corvin_favor_done. That is deliberate: it
// also means the Weight Discrepancy cannot yet reach its clean finish, because
// Corvin will only countersign Aldric's correction once this favour is done
// (see interactCalwickOffice). Both resolutions are future work.
let corvin_favor_started   = false; // Corvin asked the player, off the clock at the inn
let corvin_favor_done      = false; // player restored the struck entry (no path sets this yet)
let corvin_favor_offer_day = 0;     // day the once-per-Dayoff 1/3 availability roll last ran
let corvin_favor_offered   = false; // result of that roll (persisted so re-talk/save-load is stable)

// ─── Window sync ─────────────────────────────────────────────────────────────
// window.* values are for debugging and console inspection only — gameplay code
// uses the let bindings directly. Call syncQuestFlagsToWindow() after any
// gameplay change to keep the window properties current.
function syncQuestFlagsToWindow() {
  window.cabinetCaseFlag      = cabinetCaseFlag;
  window.sluice_job_started      = sluice_job_started;
  window.sluice_fixed            = sluice_fixed;
  window.sluice_pay_ticket_ready = sluice_pay_ticket_ready;
  window.sluice_reward_given     = sluice_reward_given;
  window.MainQuest            = MainQuest;
  window.equipment_ticket_ready = equipment_ticket_ready;
  window.letter_quest_stage    = letter_quest_stage;
  window.cat_quest_stage       = cat_quest_stage;
  window.warden_quest_started  = warden_quest_started;
  window.warden_quest_defeated = warden_quest_defeated;
  window.warden_quest_rewarded = warden_quest_rewarded;
  window.dispatch_quest_started    = dispatch_quest_started;
  window.dispatch_delivered        = dispatch_delivered;
  window.dispatch_pay_ticket_ready = dispatch_pay_ticket_ready;
  window.dispatch_rewarded         = dispatch_rewarded;
  window.fort_quest_started      = fort_quest_started;
  window.fort_quest_stage        = fort_quest_stage;
  window.fort_pay_ticket_ready   = fort_pay_ticket_ready;
  window.fort_pay_ticket_reduced = fort_pay_ticket_reduced;
  window.smugglers_dead          = smugglers_dead;
  window.smugglers_execution_day = smugglers_execution_day;
  window.fort_report_filed       = fort_report_filed;
  window.mq4_available_day       = mq4_available_day;
  window.reservoir_quest_started = reservoir_quest_started;
  window.reservoir_report_filed  = reservoir_report_filed;
  window.schilling_quest_started = schilling_quest_started;
  window.schilling_returned      = schilling_returned;
  window.drama_stage             = drama_stage;
  window.weight_quest_stage      = weight_quest_stage;
  window.weight_note_signed      = weight_note_signed;
  window.sentry_seen_on_board    = sentry_seen_on_board;
  window.sentry_quest_started    = sentry_quest_started;
  window.sentry_quest_done       = sentry_quest_done;
  window.sentry_quest_rewarded   = sentry_quest_rewarded;
  window.pale_sentry_hp          = pale_sentry_hp;
  window.sickle_quest_stage      = sickle_quest_stage;
  window.gridd_rainfish_warned   = gridd_rainfish_warned;
  window.rainfish_woken          = rainfish_woken;
  window.den_wraith_quest_started = den_wraith_quest_started;
  window.den_wraith_defeated      = den_wraith_defeated;
  window.den_wraith_rewarded      = den_wraith_rewarded;
  window.netto_letter_received    = netto_letter_received;
  window.dessa_met                = dessa_met;
  window.rareborn_rhyme_heard     = rareborn_rhyme_heard;
  window.esla_said_sluice          = esla_said_sluice;
  window.esla_said_dispatch        = esla_said_dispatch;
  window.esla_said_cabinet         = esla_said_cabinet;
  window.esla_said_polwick_pending = esla_said_polwick_pending;
  window.esla_said_polwick_dead    = esla_said_polwick_dead;
  window.esla_said_basin           = esla_said_basin;
  window.supervisor_greet_day      = supervisor_greet_day;
  window.esla_greet_day            = esla_greet_day;
  window.north_bridge_crossed_early = north_bridge_crossed_early;
  window.north_bridge_scolded       = north_bridge_scolded;
  window.supervisor_said_flood      = supervisor_said_flood;
  window.fourteenth_file_stage      = fourteenth_file_stage;
  window.fourteenth_file_offer_day  = fourteenth_file_offer_day;
  window.fourteenth_file_offered    = fourteenth_file_offered;
  window.fourteenth_file_outcome    = fourteenth_file_outcome;
  window.wine_quest_started   = wine_quest_started;
  window.wine_quest_gift      = wine_quest_gift;
  window.wine_quest_delivered = wine_quest_delivered;
  window.wine_quest_rewarded  = wine_quest_rewarded;
  window.corvin_favor_started   = corvin_favor_started;
  window.corvin_favor_done      = corvin_favor_done;
  window.corvin_favor_offer_day = corvin_favor_offer_day;
  window.corvin_favor_offered   = corvin_favor_offered;
  // Window-native MAP_FEATURES onceFlags (Upper Reach pass) -- window[name]
  // is the source of truth (interactions.js sets it directly), so these
  // lines only normalize undefined -> false. They must NEVER assign from a
  // let-binding: that would clobber a flag the player just earned before
  // saveGame() reads it.
  window.vale_tutorial_seen   = !!window.vale_tutorial_seen;
  window.tev_elixir_given     = !!window.tev_elixir_given;
  window.upper_reach_seen     = !!window.upper_reach_seen;
  window.basin_chamber_seen   = !!window.basin_chamber_seen;
  window.sunken_gallery_seen  = !!window.sunken_gallery_seen;
  // Count of times the player has walked OUT of the unmarked chamber; the
  // second exit triggers the one-time dream sequence. Window-native counter
  // (not a boolean), normalized undefined -> 0 so saveGame() never writes undefined.
  window.basin_chamber_exits  = window.basin_chamber_exits || 0;
  window.basin_chamber_dream_done = !!window.basin_chamber_dream_done;
  // Sunken Gallery investigation flags -- window-native, set directly by the
  // gallery interaction handlers; only normalized undefined -> false here.
  window.sunken_gallery_recess_opened = !!window.sunken_gallery_recess_opened;
  window.sunken_gallery_drowned_freed = !!window.sunken_gallery_drowned_freed;
  window.sunken_gallery_drowned_slain = !!window.sunken_gallery_drowned_slain;
  window.sunken_gallery_gift_taken    = !!window.sunken_gallery_gift_taken;
  // Observer-clue investigation flags (set by MAP_FEATURES `flag`) -- window is
  // the source of truth; only normalize undefined -> false so saveGame() never
  // writes undefined for a clue the player hasn't reached yet.
  window.gallery_clue_silt     = !!window.gallery_clue_silt;
  window.gallery_clue_satchel  = !!window.gallery_clue_satchel;
  window.gallery_clue_survey   = !!window.gallery_clue_survey;
  window.gallery_clue_gauge    = !!window.gallery_clue_gauge;
  window.gallery_clue_reliefs  = !!window.gallery_clue_reliefs;
  window.gallery_clue_visitor  = !!window.gallery_clue_visitor;
  window.gallery_clue_notebook = !!window.gallery_clue_notebook;
  window.gallery_clue_stair    = !!window.gallery_clue_stair;
  window.gallery_body_found    = !!window.gallery_body_found;
  window.ff_clue_skiff         = !!window.ff_clue_skiff;
  window.ff_clue_ledger        = !!window.ff_clue_ledger;
  window.ff_clue_dedication    = !!window.ff_clue_dedication;
}
window.syncQuestFlagsToWindow = syncQuestFlagsToWindow;

// ── Notebook content ─────────────────────────────────────────────────────────
// Read-only source of truth for the quest journal. Returns a fresh array of
// notebook entries in display order:
//   { title, body }  — a quest note
//   { header }       — a section divider
// The renderer (drawMenu(), render-ui.js) owns only layout/scrolling; all
// quest-state conditions, objective text, and the special-item description
// table live here so rendering doesn't reach into quest-domain logic.
// Pure: reads quest flags / stats.items / day but mutates nothing.
function getActiveQuestNotes() {
  const notes = [];
  // Dispatch quest
  if (dispatch_quest_started && !dispatch_delivered) {
    notes.push({ title: "Supervisor's Errand", body: "Deliver the Dispatch Letter to Officer Veth at the Drenwick district office." });
  } else if (dispatch_delivered && !dispatch_pay_ticket_ready && !dispatch_rewarded) {
    notes.push({ title: "Supervisor's Errand", body: "Return to your supervisor in Calwick — the letter reached Drenwick." });
  } else if (dispatch_pay_ticket_ready && !dispatch_rewarded) {
    notes.push({ title: "Supervisor's Errand", body: "Take the pay chit to Petra at the Calwick market." });
  }
  // Sluice job
  if (sluice_job_started && !sluice_fixed) {
    notes.push({ title: 'Sluice Repair', body: "Fix the flow valve in the East Sluice beneath Calwick." });
  } else if (sluice_fixed && !sluice_pay_ticket_ready && !sluice_reward_given) {
    notes.push({ title: 'Sluice Repair', body: "Report back — the East Sluice valve is repaired." });
  } else if (sluice_pay_ticket_ready && !sluice_reward_given) {
    notes.push({ title: 'Sluice Repair', body: "Take the work chit to Petra at the Calwick market." });
  }
  // Briar Warden contract
  if (warden_quest_started && !warden_quest_defeated) {
    notes.push({ title: 'Warden Contract', body: "Defeat the Briar Warden. It dens in the hidden spring meadow at the vale's far northwest corner — push through the overgrown tree/grass nook to reach it." });
  } else if (warden_quest_defeated && !warden_quest_rewarded) {
    notes.push({ title: 'Warden Contract', body: "Return to Mault — the Briar Warden is dead." });
  }
  // Fort investigation
  if (fort_quest_started && fort_quest_stage < 4 && fort_quest_stage !== 5) {
    notes.push({ title: 'Fort Investigation', body: "Investigate the old fort south of Drenwick in the western fen." });
  } else if (fort_quest_stage === 4 || fort_quest_stage === 5) {
    notes.push({ title: 'Fort Investigation', body: "Report your findings to your supervisor in Calwick." });
  } else if (fort_quest_stage === 6 && fort_pay_ticket_ready) {
    notes.push({ title: 'Fort Investigation', body: "Take the pay ticket to Petra at the Calwick market." });
  }
  // Rest week after the fen post case, then the reservoir bed assignment
  if (mq4_available_day > 0 && day < mq4_available_day) {
    notes.push({ title: 'Stood Down', body: "The fen post matter is closed. The supervisor has taken you off the roster — rest until after Dayoff." });
  } else if (mq4_available_day > 0 && !reservoir_quest_started) {
    notes.push({ title: 'Stood Down', body: "The rest week is over. Report to the supervisor at the Calwick office for the next assignment." });
  }
  if (reservoir_quest_started) {
    notes.push({ title: 'Reservoir Bed', body: "The drought has uncovered old stonework in the reservoir bed north of Drenwick. Investigate it — in daylight. A basin observer already went out and did not come back." });
  }
  // Schilling
  if (schilling_quest_started && !schilling_returned) {
    notes.push({ title: 'Missing Person', body: "Find Schilling and bring him back." });
  }
  // Pale Sentry
  if (sentry_quest_started && !sentry_quest_done) {
    notes.push({ title: 'Pale Sentry', body: "Defeat the Pale Sentry blocking the fen road near Drenwick." });
  } else if (sentry_quest_done && !sentry_quest_rewarded) {
    notes.push({ title: 'Pale Sentry', body: "Collect the bounty from Constable Tarvec at the Drenwick guard post." });
  }
  // Mabel's sickle
  if (sickle_quest_stage === 1) {
    notes.push({ title: "Mabel's Sickle", body: "Find the lost fen sickle near the north bank of the bog." });
  }
  // Den Wraith
  if (den_wraith_quest_started && !den_wraith_defeated) {
    notes.push({ title: 'Den Wraith', body: "Defeat the Den Wraith." });
  } else if (den_wraith_defeated && !den_wraith_rewarded) {
    notes.push({ title: 'Den Wraith', body: "Return to claim the wraith bounty." });
  }
  // A Bottle for Her Father
  if (wine_quest_started && !wine_quest_delivered) {
    notes.push({ title: "Fenna's Father", body: "Buy mushroom wine at Wend's brewery in the fen and bring it to Sael, Fenna's father, in Drenwick." });
  } else if (wine_quest_delivered && !wine_quest_rewarded) {
    notes.push({ title: "Fenna's Father", body: "Bring Sael's note back to Fenna in Calwick." });
  }

  // Special Items — quest-flagged items (stats.items with questItem: true)
  // get their own section here so they don't just blend into the regular
  // ITEMS list above with everything else being carried.
  const specialItemNotes = {
    'Letter from Netto':  'A letter from home.',
    'Dispatch Letter':    "Routine correspondence for the Drenwick district office.",
    'Sealed Letter':      'A redacted transit authorization, fished from the canal. Sender unknown.',
    'Mushroom Wine':      "Wend's brew, from the fen settlements.",
    'Schilling':          "Pip's teddy bear. He's waiting for it back.",
    'Cat-Shaped Key':     "Doesn't fit anything you own. Yet.",
    'Old Fishing Rod':    'A battered rod found in an abandoned Drenwick apartment. The worst rod there is — but it casts. Needed to fish the Drenwick waterfront.',
    'Bottle of Mushroom Wine': "Fresh from Wend's brewery. Meant for Sael, not for drinking on the road.",
    'Case of Mushroom Wine':   "A full case from Wend's brewery. Heavy, but Sael will appreciate it.",
    'Thank-You Note':          "From Sael. Fenna will want to see this.",
  };
  const seenSpecial = new Set();
  const specialItems = stats.items.filter(it => it.questItem && !seenSpecial.has(it.name) && seenSpecial.add(it.name));
  if (specialItems.length > 0) {
    notes.push({ header: 'SPECIAL ITEMS' });
    specialItems.forEach(it => {
      notes.push({ title: it.name, body: specialItemNotes[it.name] || 'A quest item.' });
    });
  }

  return notes;
}
window.getActiveQuestNotes = getActiveQuestNotes;

syncQuestFlagsToWindow();
