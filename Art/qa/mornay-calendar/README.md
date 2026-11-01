# Mornay calendar browser review

Run with `VV_BROWSER_PAGE=mornay-calendar-browser.html
VV_BROWSER_OUTPUT=Art/qa/mornay-calendar node test/run-browser-smoke.js`.

1891 automated Chromium checks passed at 512×480 and 1024×960.
Fixtures place characters at entrances; collision-planned approaches and
conversations use keyboard events through real game handlers. Text widths use
real Canvas. This is not a human playtest.

The 36 captures show public closures, an indoor merchant refusing trade,
the Dayoff supper quest, and all five dated activities before/after collection.
Tests check unavailable dates, inclusive early deadlines, late unlocks,
reward counts and save/load without repeat claims. Results are summarized in
`results.json`; the repository-root `MORNAY_CALENDAR.md` has the walkthrough.

Visually reviewed at native and 2× scale: `dayoff-offer-1x.png`,
`mornay_school-dayoff-2x.png`, `mornay_maelin_rook-found-1x.png`, and
`mornay_enna_quist-offer-2x.png`. Dialogue stays inside its boxes and the rooms
remain readable. No game graphics were changed.
