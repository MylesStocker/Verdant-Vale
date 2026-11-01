# MQ7 review evidence

Run in the assigned `empire-game` checkout on `main`. Starting and ending commit
remain `1519a92fbdd63b55241888c5917372a18351528d`. Existing MQ5, MQ6 and South
Ruins changes are retained; nothing is staged or committed.

See [complete design, cast, state and walkthrough](../../../MQ7_MISSING_PRACTITIONER.md).
`verification.json` records final checks and the exact MQ7 increment file list;
`final-status.txt` records the entire dirty checkout, including pre-existing work.

## Browser evidence

`browser-results.json` is the completed real Chromium run of
`test/lantern-house-browser.html`, driven by actual keyboard events at 512×480
and 1024×960. It visits all nine local maps, conversations, readings, five
encounters and return doors, saves/loads, and completes the report. It verifies
real Canvas text widths and per-speaker styling. Screenshots are actual canvas
captures, scaled without smoothing for 2×.

This is automated browser gameplay with visual inspection of representative
captures. It is not a claim of human manual playtesting. The long existing
regional walks between Voss and Shingle Headlands are skipped by fixture
placement; the local approach, passages and return are walked through controls.

Combat uses ordinary level-10/11 checkpoint characters, existing gear and supplies.
No stats are inflated in this browser run. Healing consumes inventory between
fights. The optional Stalker is handled with Sapper Charges. Round counts under
fixed RNG are evidence of this strategy, not a comprehensive balance assessment.
The headless correctness tests separately accelerate combat where only receipt
and retry behavior is under test.

Representative captures:

- [Voss and Esla's green speech](voss-assignment-1x.png)
- [Regional lantern sign](lantern-sign-1x.png)
- [Winding guest road](guest-road-1x.png)
- [Timber gully](gully-1x.png)
- [Guesthouse exterior](guesthouse-1x.png)
- [Common room](common-room-1x.png)
- [Guest rooms](guest-rooms-1x.png)
- [Controlled current](guided-current-1x.png)
- [Intake encounter](fight-3-1x.png)
- [Private response, 2×](private-response-2x.png)
- [Truthful report](truthful-report-1x.png)

## Artifact changes

- One regional fingerprint changes: `MAINLAND_C20R0_MAP` for local (7,3),
  GRASS → INTERIOR_EXIT. Every other regional fingerprint remains matched.
- `node test/transition-audit.js --write` adds 18 local door results. The MQ7
  increment is 571 → 589 fixed transitions; earlier uncommitted MQ5/MQ6 and
  South Ruins additions already existed before this pass and are preserved.
- `node test/regional-atlas.js --write` refreshes the inventory hash, one marker
  in the overview and a concise atlas location note. Regional totals do not change.
- No new sprite sheet, bitmap background, tile, encounter table or save version.

## Remaining human walkthrough

Use **Story Checkpoint Lab → MQ7 — Missing Practitioner Ready**. Accept, take the
old guest road at Shingle Headlands (20,0), clear road/gully, meet Neris, talk to
Orren, then follow the east orchard path. Clear steps and intake, optionally raid
the old store, return to Neris, talk privately at the orchard bench, report to Voss.

Evaluate reading pace, the warmth/exclusion contrast, Esla's agency, organic-party
combat attrition and the optional cache's value. Try saving halfway through and
returning with Esla absent for Fine Needlework; the guidance should lead to her
real reunion at Ledger House, without changing the absence itself. No choice
should recruit anyone, issue a warrant or unlock MQ8.
