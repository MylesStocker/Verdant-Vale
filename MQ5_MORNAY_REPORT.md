# MQ5 — Request for Assistance

Implemented in the assigned `empire-game` checkout, branch `main`, starting
clean at `1519a92fbdd63b55241888c5917372a18351528d`. This increment is uncommitted.
Other worktrees are untouched. Names and dialogue remain editable game content.

## Result and authority

The existing **Marit Voss**, Regional Magistrate (`mornay_marit_voss`), receives
Calwick’s Supervisor’s signed request in `MORNAY_OFFICE_MAP`. The sealed report
was always narrative-owned by assignment, so no item is granted, required or
removed. The seal authenticates the sender and intact arrival; it does not
make the crisis secret.

`mornayReport` owns only the transient audience. Its final dialogue callback sets
one registered lexical save flag, `mq5_report_delivered`, after authenticating
its session and eligibility. It does not increment `MainQuest` beyond 5. No
payment, XP, rest, clock advancement, party mutation or next mission occurs.
The registered save getter/setter and default handle version-5 persistence;
older version-5 saves without the flag remain undelivered. Save/load cannot
interrupt the temporary audience. Invalid completion/prerequisite combinations
fail save/load preflight. There is no parallel window mirror for the new flag.

Lély stays at the actual interaction approach. A stationary Esla projection
uses an available floor position beside her, checked against terrain, furniture
and NPCs, with the ordinary room depth ordering. No character is walked or
teleported to a scripted mark. This uses the same canonical field availability
rule as other companion content, with no new HP restriction. Fine Needlework
absence suppresses her speech and sprite and preserves cargo and return location.

The journal title is **Request for Assistance**. Its completed entry reads:

> Completed: Magistrate Voss received the Supervisor’s signed request and heard your account. Dreyfuss’s death and Garrick’s disappearance are acknowledged; no assistance or timetable was promised.

Before delivery, the absent-Esla entry explicitly permits a solo report and
reminds the player that she is at the Ledger House. Other travel/camp guidance
remains. Calwick’s Supervisor and Drenwick’s Officer Veth acknowledge delivery on later visits. Reception,
Records and related Mornay officials no longer send the player through the
obsolete certificate/copy loop. Messa’s existing Henric/Serpentsmoke tip survives.
Existing sidequests and access stay available. The original MQ5 increment added no MQ6–MQ8, future introductions,
hydrographer, timer, ship departure or restriction is added.

## Final audience dialogue

Speaker records retain their individual styles through ordinary word wrapping
and pagination. Only Esla’s spoken pages use her green style. Solo reporting
omits her two pages; the remaining audience has the same outcome.

1. **Marit:** “Calwick’s request for assistance. Please, I’m Marit Voss. Your Supervisor’s signature, and the seal intact. Thank you for bringing it.”
2. **Narration:** Lély hands over the report. Voss breaks the seal and reads the covering account.
3. **Marit:** “Dreyfuss dead. Garrick still missing. I’m sorry. You were in the Gallery yourself?”
4. **Lély:** “I found Dreyfuss below the reservoir. There were marks in the silt around him. I didn’t find Garrick.”
5. **Lély:** “There are rooms beneath the Gallery. Something attacked me there. I survived it. I can’t tell you what the whole place was built to do.”
6. **Optional Lély, `gallery_clue_notebook`:** “I found Garrick’s notebook. He wrote that heat and drainage couldn’t account for the water loss. His last page was torn out.”
   **Otherwise, only with `gallery_clue_satchel`:** “I found Garrick’s kit caught below. That tells us he reached the place. It doesn’t tell us where he is now.”
7. **Optional Lély, `gallery_clue_survey`:** “The survey marks showed the water falling in steps, with pauses between them. Then a much larger fall.”
8. **Marit:** “Quite right to bring this to us. Calwick and Drenwick cannot be expected to supply specialists they don’t have.”
9. **Esla, if available:** “No. We’re short of people at home too. We need someone qualified to judge what it is safe to do.”
10. **Marit:** “Naturally. Unfortunately, the relevant specialists are away, and our investigators have existing commitments. I cannot responsibly promise their time.”
11. **Lély:** “Can someone at least look for Garrick?”
12. **Marit:** “I shall record the urgency. We also have harbour claims and appointments with the district’s principal employers. Those obligations cannot simply be set aside.”
13. **Lély:** “When should the Supervisor expect an answer?”
14. **Marit:** “I would rather give him a dependable answer than an encouraging date. You understand.”
15. **Esla, if available:** “Then I’ll be careful not to mistake an acknowledgement for an answer.”
16. **Marit:** “Very sensible. The request is received, and your firsthand account is on record. No personnel have been assigned. Keep yourselves available.”

**Repeat Marit:** Your request and account are recorded. The staffing position has not changed. I would be doing you no service by suggesting otherwise.

The authored optional pages never disclose Lély’s dreams. No new clue or
private knowledge is invented. The assignment’s earlier line now calls the
packet the Supervisor’s signed request, accompanied by the account of findings.

## Walkthrough

1. Open the debug menu, choose **Story Checkpoint Lab**, then **MQ5 — Mornay Report Ready** and Apply. This replaces the live session using existing profiles, without writing stored saves.
2. You start at `(144,144)` in the office. Walk straight north two floor tiles, then slightly left toward Voss at the northwest desk. Press Space/Enter.
3. Read the audience at native and 2× scale. Check Lély and Esla remain visible, speaker names/pagination are clear, and green text belongs only to Esla.
4. Dismiss the final acknowledgement. Check the completed journal entry, repeat Voss’s interaction, save/load, then walk out through the southern door.
5. On a separate run, accept Fine Needlework at the cheap inn so Esla waits at Ledger House. Visit Voss alone, deliver, save/load, and check the absence/cargo remain intact.
6. Optional: discover the Gallery notebook/satchel and survey marks before reporting; only those recorded discoveries should appear in Lély’s account.

Screenshots are automated Chromium Canvas captures, visually inspected by the
implementer, not a claim of human playtesting:

- [Lély’s account, 2×](Art/qa/mornay-report/lely-account-2x.png)
- [Esla’s green page, native](Art/qa/mornay-report/esla-audience-1x.png)
- [Solo audience, native](Art/qa/mornay-report/solo-audience-1x.png)

## Verification and file inventory

- Full regression: **286/286 suites passed**, including the transition audit and existing town/combat compatibility suites.
- New focused suite 350: **12 grouped checks passed**, including 74 collision-valid interaction approaches, held input, optional evidence, solo reporting, resource isolation, old-save defaults and invalid-save rejection.
- Automated Chromium: **567 checks passed**, no browser errors, six captures at 512×480 and 1024×960. Real keyboard events drive approach, dialogue and office exit. The implementer visually inspected representative captures at both scales. No human playtest is claimed.
- **26 JavaScript syntax checks passed**. `validateGameData()` reports **0 errors and 6 existing warnings** (notice-board walkability, Zolom attack strength, Takomo generic sprite, unused Eastern Fens pool, and two older dialogue lengths).
- Exact title assertions, checkpoint menu wrap and the save-registry snapshot were updated without weakening the underlying contracts. The registry gains one lexical flag: 91 lexical and 28 window-native flags.
- `git diff --check`, changed-file conflict-marker scan and stale quest-title search pass. SAVE_VERSION remains **5**.
- No map grids, transitions, camera rules or regional fingerprints changed; no geographic artifacts were regenerated. The six PNGs are new QA captures only.
- Final Git state: `main` at the unchanged starting HEAD, **27 modified tracked files and 11 new files**, all unstaged. No commit, merge, rebase or push.

Remaining review is editorial/player-facing: the conversation uses minimal stationary companion staging rather than a new entrance walk. The standard full-screen office geometry is unchanged. Use the walkthrough above to judge the pacing and evasive tone.

Changed production ownership: `mornay-report.js` contains audience content and
its transient lifecycle; `quests.js` and `save.js` contain the one receipt and
journal; interaction, input, rendering, simulation and activity ownership reuse
existing authorities. The checkpoint adds only one approved fixture. Dialogue
changes in Calwick, Drenwick and Mornay remove contradictory report reminders.
Validation now reads lexical bindings directly. Existing tests update the exact
quest title, deliberate save-key snapshot, checkpoint menu and revised ambient
speaker roster. Suite 350 and the browser harness cover the new lifecycle.
Documentation and six QA captures describe this increment. No geographic
artifacts were regenerated and there are no existing-grid deltas.

Exact changed/new file list (all unstaged):

- `Art/qa/mornay-report/esla-audience-1x.png`
- `Art/qa/mornay-report/esla-audience-2x.png`
- `Art/qa/mornay-report/lely-account-1x.png`
- `Art/qa/mornay-report/lely-account-2x.png`
- `Art/qa/mornay-report/solo-audience-1x.png`
- `Art/qa/mornay-report/solo-audience-2x.png`
- `MORNAY_TOWN_PLAN.md`
- `MQ5_MORNAY_REPORT.md`
- `PROJECT_STATUS.md`
- `activity-ownership.js`
- `architecture.md`
- `content/interactions/calwick-interactions.js`
- `content/npcs/drenwick-interior-npcs.js`
- `content/npcs/mornay-npcs.js`
- `index.html`
- `input.js`
- `interactions.js`
- `mornay-report.js`
- `movement.js`
- `mq5-assignment-cutscene.js`
- `quests.js`
- `render-mornay.js`
- `save.js`
- `state.js`
- `story-checkpoint-lab.js`
- `test/cases/159-mq5-east-ferry.test.js`
- `test/cases/179-mq5-esla-recruitment.test.js`
- `test/cases/192-story-checkpoint-lab.test.js`
- `test/cases/199-travellers-rise-ambush.test.js`
- `test/cases/201-travellers-rise-campsite.test.js`
- `test/cases/207-travellers-rise-campfire-night.test.js`
- `test/cases/308-mornay-dialogue-reservations.test.js`
- `test/cases/321-mornay-office-tenement.test.js`
- `test/cases/350-mornay-report.test.js`
- `test/cases/51-save-binding-registry-migration.test.js`
- `test/mornay-report-browser.html`
- `test/mornay-report-browser.js`
- `validation.js`

## Subsequent MQ6 integration

MQ5 completion still starts no new mission. A separate deliberate conversation
with Voss now offers **The Greybank Mill**; acceptance activates MQ6. Its own
completion pays 150g and does not start MQ7. The repeat-interaction tests now
decline this offer when checking free exploration after MQ5. See
MQ6_GREYBANK_MILL.md for that increment.
