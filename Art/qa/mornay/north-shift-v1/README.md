# Mornay northward marker correction — 2026-10-28

The complete two-by-three overworld marker moves one row north, to rows 0–2 and columns 7–8 of `EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP`. A shift alone would still permit sideways entry: two formerly grassy cells beside the new gates therefore become water. Players approach from the two-tile southern road.

Nine cell values change (zero-based column,row):

| Cell | Before | After |
|---|---|---|
| 7,0 | water | fort |
| 8,0 | water | roofs |
| 7,1 | fort | harbour |
| 6,2 | grass | water |
| 7,2 | harbour | West Gate |
| 8,2 | roofs | East Gate |
| 9,2 | grass | water |
| 7,3 | West Gate | road |
| 8,3 | East Gate | road |

The roof at 8,1 already has the correct tile and does not change. Machine-readable deltas and the descriptive-note change are in `test/fixtures/mornay-north-shift.json`. All other 1,057 regional grids are unchanged. Return landings remain (240,144)/(272,144), facing down; they are now two rows south of the gates. Old gate cells are safe road. The two flank grass cells intentionally become impassable; ordinary placement/save validation remains authoritative. No save migration or movement exception is introduced.

No camera, town interior, NPC, encounter-pool, combat, structural seam or save-schema change. SAVE_VERSION remains 5. Earlier dirty work is preserved. `pass-files.json` lists this correction's changed/added files.

## Verification

Final full regression: **274/274 passed, zero failures**. All 59 changed/new JavaScript syntax checks pass; `git diff --check` passes.

- Focused suites 215, 218, 300, 317, 322, 323, 337 and 338 pass.
- New suite 338 tests held sideways input against both water flanks, ordinary southern entry at both gates, save/load inside and safe exit, in continuous and Legacy modes. It also checks the two-tile road and that every walkable crown cell connects to the approach.
- Historical road/geography evidence retains its original hashes. Detached test projections reverse only the explicitly recorded later north-shift cells/notes before checking older baselines. Actual current-grid collision and access are covered separately.
- All 1,058 regional fingerprints match; only the crown fingerprint changes in this follow-up.
- Validation: zero errors, six existing warnings. Transition audit matches and its generated artifact is byte-identical to the pre-correction version.
- Browser review: ordinary left/right movement stops at the western/eastern water flanks; ordinary up/down movement enters and exits both gates. Inspected native 512×480 and doubled 1024×960 presentation. No console errors. Save/load and Legacy variants are input-harness evidence, not claimed as manual browser actions in this correction.
- The existing regional browser fixture completed 163 automated checks, zero errors, and refreshed the production atlas PNG. Atlas inventory/SVG and the crown fingerprint were regenerated using `test/regional-atlas.js`; other fingerprints and structural transitions were preserved.

Screenshots: `town-1x.png`, `town-2x.png`, `west-flank-blocked.png`, `east-flank-blocked.png`. The 2× screenshot captures the visible viewport of the enlarged canvas.

## Walkthrough

Approach Mornay from the south. Enter and leave each gate. Walk around to either grassy flank and try to move sideways toward its gate: water should stop you. Check the shifted fort/roofs/harbour at both scales. Save/load inside a gate and leave normally.

Work remains unstaged and uncommitted on `main`, HEAD `4f45e8a608775cabaff6c25e25dd071b2f73eab4`; nothing merged or pushed.
