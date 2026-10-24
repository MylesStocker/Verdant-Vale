# Sera/Liora final courtyard breakfast — stage 2 review packet

Dot approved stage 1. The completed scene now proceeds naturally from the
flour-covered breakfast-supplies reveal and server's question to the sunny
courtyard terrace, improvised breakfast, quiet plans, pinky promise, eating hold
and Lely's existing Drenwick infirmary awakening. Work is left unstaged and
uncommitted on `agent/codex` for final review.

## Player-visible sequence

The storeroom fades to white, then reveals the approved breakfast terrace/table.
Sera and Liora face one another. They move closer for the little-finger promise
and return beside the table for three presentation seconds of eating. Existing
standing sprites and small deterministic Canvas hand/cup gestures provide the
minimal MVP; bespoke seated/hand/eating raster poses remain a later cosmetic pass.
The final white fade returns to Lely, with Esla's original waking dialogue starting
at its first page. No art assets were generated or changed in this pass.

The two approved battles, blocked Run policy, shared-context resource carryover,
current-fight defeat retries and flour reveal are preserved. The same idle story
context remains owned until hospital cleanup. Lely's resources, party, day and
stored save are unchanged. True story entry sets only the existing opening-complete
flag; debug preview/replay preserves the prior flag value. SAVE_VERSION remains 5.
No map/grid/edge/random-pool changes or geographic artifact regeneration.

## Final dialogue

1. Server: “Bread, fruit and tea. It isn’t quite the breakfast we meant to serve.”
2. Sera: “It’s breakfast. That will do nicely. Thank you.”
3. Liora: “Can we have a quiet morning now?”
4. Sera: “A slow walk through Bethany. No appointments.”
5. Liora: “Up through the gardens? We can see where the little stairs go.”
6. Sera: “Provided they bring us back before Skybloom.”
7. Liora: “They will. I want to see the starflowers open from the upper terraces.”
8. Sera: “Then we’ll be back in good time. We leave tomorrow; today can be ours.”
9. Liora: “I like that.”
10. Liora: “Whatever comes after this trip… we’ll still do things together, won’t we?”
11. Sera: “Of course we will. Together, as always. Pinky promise?”
12. Narration: “Sera holds out a little finger. Liora hooks hers around it.”
13. Liora: “Pinky promise.”
14. Sera: “Now eat, before we have to rescue it again.”

The writing follows LORE.md's last-full-Bethany-day, evening Skybloom and
next-morning departure boundaries. Their relationship remains unlabelled and
no future outcome or connection to Lely/dreams is revealed.

## Verification and implementation

Exact results, hashes, changed-file inventory and initial/final Git status are in
`verification.json`. New suite 269 covers natural keyboard/battle completion,
three-second hold, held confirm/cancel, presentation deltas, preview/story flags,
replay, reset/checkpoint at five ending stages, stale callbacks, retained resources,
read-only rendering and diagnostic faults. Suites 267/268 retain accepted combat,
retry, blocked Run and clean-to-flour visual checks. Shared completion helpers now
follow dialogue/update normally; the former direct hospital test bypass is removed.

Astra's correctness audit identified dialogue dispatch outside the exception guard:
a failed promise continuation could otherwise leave an unreported lock. The narrow
repair routes it through the existing fault handler. Astra independently reran all
12 new groups and reported no remaining defects. Sol researched reusable staging
and authored only the new test file; the coordinator reviewed every test and
integrated all production and existing-test edits. No nested delegation or Git
operations were used by agents.

The existing hospital authority is unchanged. The controller marks completing
before calling it, then performs no old-state writes after cleanup. Every authored
continuation checks its current state/epoch and stage. Confirm-key latches remain
held across fades so neither the eating hold nor hospital page can be skipped.

The browser evidence uses automated Chromium DOM keyboard input, production Canvas
and real PNGs at 512×480 and 1024×960, with coordinator screenshot inspection.
This is not a human playtest claim. All final conversation glyphs fit; the original
Sera dialogue styling remains intact. Captures include the accepted flour reveal,
terrace return, pinky promise, eating hold, final fade and infirmary awakening at
both scales. Rendering tests warm the existing derived text-layout cache before
checking repeat-draw purity; no claim is made that initial line-wrap caching is
immutable gameplay data.

## Short walkthrough

1. Start Debug → Story Checkpoint Lab → Sera/Liora — Breakfast Battle, or follow
   the entire bedroom/courtyard route.
2. Win both fights, optionally taking damage/consuming an item to inspect carryover.
   Run must continue to fail; defeat retry must retain only the current entry.
3. Inspect the flour reveal, then close the server's question. Verify the white
   fade returns to the sunny table without unlocking free walking.
4. Read the quiet Bethany/Skybloom plans and pinky promise. Check the small visible
   hand gesture and Sera's established dialogue style.
5. Hold or repeatedly press confirm/cancel during eating. The full three-second
   pause should remain, followed by the final fade.
6. Verify Lely wakes in the infirmary exactly once, with the first waking page
   unskipped and ordinary control restored after dialogue.
7. Replay through the debug preview after closing the wake dialogue. The session
   should reset cleanly and preserve canonical resources/completion flags.

Nothing was staged, committed, merged or pushed. Existing unrelated work and all
other worktrees remain untouched. Stopped for the user's final review.
