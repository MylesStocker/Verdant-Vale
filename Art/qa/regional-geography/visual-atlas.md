# Mainland visual atlas — historical snapshot

[Open the zoomable atlas](visual-atlas.html) · [Full-resolution PNG](visual-atlas.png) · [Vector terrain overview](overview.svg)

The 3000×3330 atlas shows the full updated regional overworld, a coordinate grid, seven verified place/crossing markers, drainage direction, terrain legend, and enlarged starting-region and Mornay/river-valley views. North is up; coordinates refer to 16×15-tile regional chunks. Towns are shown by their overworld markers; their separate interiors are outside this atlas.

Historical source: `agent/codex` at `12c76ddcac89555bbd8fdba57485a4ef2fed4b66`. The existing `test/regional-atlas.js --write` refreshed the data inventory and vector atlas; `test/regional-geography-browser.html` produced a fresh overview using the production tile painter. At capture, all 934 live grids agreed with the inventory. The fresh tile overview matches the previously verified render exactly. Labels, grid and detail panels are atlas annotations only; no game geography or runtime code changes.

The HTML viewer embeds the complete image and works offline. Fit page/width, zoom buttons, scrolling and mouse dragging help inspect small areas. The source tile render passed the existing automated Chromium geography review (110 checks, 27 captures, zero browser errors). The labelled poster was visually inspected. The offline viewer passes seven automated Chromium checks covering image size, fit page/width, zoom, native size and synthetic pointer-drag panning. This artifact-only task does not claim a new full game regression or human playthrough.

The PNG and HTML preserve the original atlas deliverable. This snapshot predates the early-region framing and southern-barrier correction in `df88701`; consult the current runtime maps for those later changes. The original image is preserved without regeneration.

## Marker positions from live authorities

| Number | Place | Chunk-space point |
|---|---|---|
| 1 | Calwick | (0.3438, 5.1000) |
| 2 | Drenwick | (2.5312, 3.4333) |
| 3 | Mornay | (17.5000, -2.7667) |
| 4 | Causeway ferry | (5.0000, 2.5667) |
| 5 | Travellers’ Rise | (12.6562, 3.5000) |
| 6 | Lower river crossing | (22.6562, 3.3000) |
| 7 | Moraine crossing | (25.0938, 8.0333) |

PNG SHA-256: `95f308e7135a2fe75a7ee1be6eaa00e54ed7446259c1157c09abc37346a8f00b`.
