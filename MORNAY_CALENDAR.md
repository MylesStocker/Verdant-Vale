# Mornay calendar content

This pass uses the existing global `day` and five-day week. No new NPCs, maps,
terrain types or item definitions; cameras, encounters and MainQuest are unchanged.

## Implemented

- All four public shops, South Ward School, Regional IJC Office and Harbour
  Public Room close on Dayoff. Mornay's office closure follows LORE.md's
  five-day-week rule. The Civic Collegium remains inaccessible every day.
- Nerys's sales hatch and Henric's private stock also stop trading on Dayoff.
  The Crooked Oar, both inns, infirmary and watchhouse remain available.
- A saved character inside a closed building or its upstairs home can leave.
  Merchant service checks also cover saves/debug arrival inside a closed shop
  and a greeting callback whose day or location has changed.
- Existing residents Vessa Kest, Enna Quist and Hessa Vane run **A Song the
  Floor Can Bear**. The Mornay job board points to Vessa in South Rows,
  ground floor, room 2. She offers the job only on Dayoff. Gather Enna's
  request in Dock Steps flat 1, Hessa's request in Pate House, then return to
  Vessa for 60 gold. Once accepted there is no deadline: workdays are valid.
- Esla's optional interjections retain individual green speaker pages. No
  recruitment, faction choice, combat, reputation or main-quest progression.

## Approved dated opportunities

All dates use the existing global calendar. Early deadlines are inclusive;
arriving after them permanently misses only that optional reward. Later
opportunities remain available indefinitely. The job board lists dates and
locations, crosses out expired notices, and removes collected ones. Conversations
before an unlock explain when to return. There are no arrival-relative timers.

| Availability | Existing resident and location | Activity | One-time reward |
|---|---|---|---|
| Through Day 10 | Maelin, North Upper West; Dayoff: South Rows floor 2, room 13 | Search condemned rope before the hauler takes it | Swift Bangle |
| Through Day 14 | Jessa, Middle Lower West | Search Rurik's ruined saddlebags before the rag cart comes | 2 Elixirs |
| Day 16 onward | Fennel, North Upper West; Dayoff: South Rows ground floor, room 5 | Sort dried garden seeds | 8 Dart Seeds |
| Day 21 onward | Ressa, Middle Upper Central West | Wrap smoked fish portions for neighbours | 3 Smoked Lake Fish |
| Day 26 onward | Enna, Dock Steps flat 1 | Open a cupboard after a leak is patched and the boards dry | 2 Reed Remedies |

These are NPC-guided, narrated activities using existing characters and rooms,
not new terrain pickups. Maelin brings a basket home on Dayoff. Declining leaves
an opportunity available within its date window. Rewards enter ordinary inventory
and a receipt appears in the quest notebook. Enna's active supper-request dialogue
has priority; speak again to do the cupboard activity. Names and flavour are
revisable content. No major story deadline or progression changes.

## Ownership and compatibility

`mornay-calendar.js` owns dialogue, choices, stage validation and notebook
entries. The defaulted version-5 quest binding `mornay_dayoff_music` records
0 unaccepted, 1 ask Enna, 2 ask Hessa, 3 return to Vessa, 4 paid. Existing
saves default it to zero. Invalid values fail before load mutates the running
session. Stage and gold commit together after the final page; callback replay,
leaving before acceptance, and accepting after Dayoff cannot grant progress.
`mornay_calendar_claims` is a second defaulted v5 binding: bits 1/2/4/8/16
record the five rewards above. Claim callbacks recheck the current date,
proximity and claim bit. Invalid/noninteger/out-of-range claims reject loading
atomically. Each reward is granted once and independently; missing fields in older
v5 saves default to zero. No arrival timestamp or NPC schedule state enters saves.

`state.js` derives door/service availability. `enterMornayBuilding` gates only
inbound public access; `exitMornayBuilding` is unchanged. Service callbacks
recheck proximity and day. The shared dialogue finisher now tolerates a
callback opening a fresh callback-free message (previously it dereferenced
`null.length` after the callback replaced the old queue).

## Verification and walkthrough

Focused suites 359/360 cover closures, quest progression, every cutoff/unlock,
stale callbacks, declined offers, repeat claims and old/invalid saves. Suites
311/316 cover all building chains and upstairs-home returns in both movement
modes. The save-registry snapshot includes both deliberately added bindings.

Automated Chromium: 1,891 checks at 512×480 and 1024×960, with 36 screenshots in
`Art/qa/mornay-calendar/`. Fixture placement precedes real keyboard-driven
approaches/conversations; real Canvas text widths and speaker styles are checked.
This is scripted browser evidence, not a human playtest. `validateGameData()`:
zero errors, six pre-existing warnings. Transition audit matches its existing
artifact read-only. No geographic artifacts or fingerprints need regeneration.
Final full regression: **296/296 suites passed**. All 15 changed/new JavaScript
files across the calendar work pass `node --check`. All 1,059 regional fingerprints
match; `git diff --check` passes. SAVE_VERSION remains 5. No unresolved failures.

1. On Day 5/10/15, try South Ward School and a public shop: closed message.
2. Load inside a shop or upstairs home; speak to the keeper, then walk out.
3. Check the job board on South Upper East. Visit Vessa on a workday (invitation)
   and on Dayoff (offer); decline and return to confirm it remains available.
4. Accept, then visit Enna, Hessa and Vessa, resting between steps if desired.
   Confirm 60 gold once and a completed notebook entry.
5. Check the Crooked Oar, either inn and infirmary on Dayoff.
6. Speak to Maelin on Day 10 and Jessa on Day 14; search, save/load, and talk again.
   In a separate unclaimed save, test Days 11/15 for expired notices and no reward.
7. Visit Fennel/Ressa/Enna immediately before and on Days 16/21/26. Complete each
   activity and verify the listed goods and notebook receipt. They remain available
   much later; Enna first answers any active supper request.

Work remains unstaged and uncommitted on main; pre-existing dirty work is
preserved. No geographic or transition artifacts need regeneration.

## Exact files changed across both calendar stages

Unrelated pre-existing edits in shared files were preserved. QA images are review
captures, not game assets or regenerated geographic artifacts.

- `Art/qa/mornay-calendar/README.md`
- `Art/qa/mornay-calendar/dayoff-offer-1x.png`
- `Art/qa/mornay-calendar/dayoff-offer-2x.png`
- `Art/qa/mornay-calendar/merchant-dayoff-1x.png`
- `Art/qa/mornay-calendar/merchant-dayoff-2x.png`
- `Art/qa/mornay-calendar/mornay_enna_quist-found-1x.png`
- `Art/qa/mornay-calendar/mornay_enna_quist-found-2x.png`
- `Art/qa/mornay-calendar/mornay_enna_quist-offer-1x.png`
- `Art/qa/mornay-calendar/mornay_enna_quist-offer-2x.png`
- `Art/qa/mornay-calendar/mornay_fennel_ashe-found-1x.png`
- `Art/qa/mornay-calendar/mornay_fennel_ashe-found-2x.png`
- `Art/qa/mornay-calendar/mornay_fennel_ashe-offer-1x.png`
- `Art/qa/mornay-calendar/mornay_fennel_ashe-offer-2x.png`
- `Art/qa/mornay-calendar/mornay_jessa_fallow-found-1x.png`
- `Art/qa/mornay-calendar/mornay_jessa_fallow-found-2x.png`
- `Art/qa/mornay-calendar/mornay_jessa_fallow-offer-1x.png`
- `Art/qa/mornay-calendar/mornay_jessa_fallow-offer-2x.png`
- `Art/qa/mornay-calendar/mornay_maelin_rook-found-1x.png`
- `Art/qa/mornay-calendar/mornay_maelin_rook-found-2x.png`
- `Art/qa/mornay-calendar/mornay_maelin_rook-offer-1x.png`
- `Art/qa/mornay-calendar/mornay_maelin_rook-offer-2x.png`
- `Art/qa/mornay-calendar/mornay_office-dayoff-1x.png`
- `Art/qa/mornay-calendar/mornay_office-dayoff-2x.png`
- `Art/qa/mornay-calendar/mornay_provisioner-dayoff-1x.png`
- `Art/qa/mornay-calendar/mornay_provisioner-dayoff-2x.png`
- `Art/qa/mornay-calendar/mornay_ressa_muir-found-1x.png`
- `Art/qa/mornay-calendar/mornay_ressa_muir-found-2x.png`
- `Art/qa/mornay-calendar/mornay_ressa_muir-offer-1x.png`
- `Art/qa/mornay-calendar/mornay_ressa_muir-offer-2x.png`
- `Art/qa/mornay-calendar/mornay_school-dayoff-1x.png`
- `Art/qa/mornay-calendar/mornay_school-dayoff-2x.png`
- `Art/qa/mornay-calendar/neighbour-request-1x.png`
- `Art/qa/mornay-calendar/neighbour-request-2x.png`
- `Art/qa/mornay-calendar/results.json`
- `Art/qa/mornay-calendar/supper-payment-1x.png`
- `Art/qa/mornay-calendar/supper-payment-2x.png`
- `Art/qa/mornay-calendar/supper-request-1x.png`
- `Art/qa/mornay-calendar/supper-request-2x.png`
- `MORNAY_CALENDAR.md`
- `MORNAY_TOWN_PLAN.md`
- `PROJECT_STATUS.md`
- `architecture.md`
- `content/interactions/mornay-interactions.js`
- `index.html`
- `interactions.js`
- `mornay-calendar.js`
- `mornay-jobs.js`
- `quests.js`
- `save.js`
- `state.js`
- `test/cases/311-mornay-furnished-door-walks.test.js`
- `test/cases/316-mornay-shop-homes-orientation.test.js`
- `test/cases/359-mornay-calendar.test.js`
- `test/cases/360-mornay-dated-opportunities.test.js`
- `test/cases/51-save-binding-registry-migration.test.js`
- `test/mornay-calendar-browser.html`
- `test/mornay-calendar-browser.js`
- `validation.js`
- `world-transitions.js`

## Final Git state

Main remains at `1519a92fbdd63b55241888c5917372a18351528d`. Overall checkout: 89 modified
tracked files and 282 individual untracked files, including the large
pre-existing body of work; 0 staged. This pass did not commit, push or touch
another worktree. Only the listed calendar files changed relative to its baseline.
