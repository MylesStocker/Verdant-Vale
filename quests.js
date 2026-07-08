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
let warden_quest_defeated = false; // Briar Warden defeated in dungeon floor 1
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
// A large pale creature has been reported on the fen road northeast of Drenwick.
// Constable Tarvec offers a contract. The creature appears on MAP_N2 once accepted,
// with 500 HP that persists across encounters until it is killed.
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

// ─── Side quest: A Bottle for Her Father ──────────────────────────────────────
// Fenna (Calwick, apt_2) asks the player to carry mushroom wine from the Wend
// family's fen brewery to her father Sael, who lives alone in a Drenwick
// apartment (corridor B2, unit 1) — she's too scared of the road to go herself.
// wine_quest_gift records which tier Sael actually received ('bottle'/'case'),
// since Fenna's reward later depends on it.
let wine_quest_started   = false; // accepted from Fenna
let wine_quest_gift      = null;  // 'bottle' | 'case' — set once Sael receives the wine
let wine_quest_delivered = false; // Sael has the wine and gave the player a note for Fenna
let wine_quest_rewarded  = false; // Fenna has paid out for the returned note

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
  window.schilling_quest_started = schilling_quest_started;
  window.schilling_returned      = schilling_returned;
  window.drama_stage             = drama_stage;
  window.weight_quest_stage      = weight_quest_stage;
  window.weight_note_signed      = weight_note_signed;
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
  window.wine_quest_started   = wine_quest_started;
  window.wine_quest_gift      = wine_quest_gift;
  window.wine_quest_delivered = wine_quest_delivered;
  window.wine_quest_rewarded  = wine_quest_rewarded;
}
window.syncQuestFlagsToWindow = syncQuestFlagsToWindow;

syncQuestFlagsToWindow();
