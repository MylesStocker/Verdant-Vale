# Sera/Liora depth repair — QA/reference material

These captures and sources are review evidence, not gameplay room art. The supplied
`../Sera and Liora between twin beds.png` is never loaded by production.
The room background, approved original masters, collision, dialogue and save
bindings remain unchanged.

## Artwork and measured contract

The built-in imagegen tool produced two versioned source sheets:
- `Art/generated/sera-liora/peer-walk-poses-v2-source.png`: Sera's nine down/up/right
  walk/idle poses plus standing Liora. Left movement mirrors the right row.
- `Art/generated/sera-liora/liora-waking-poses-v2-source.png`: lying and seated Liora.

References supplied: the user twin-bed reference, `Art/Sera1.png`, `Art/Liora1.png`,
and (for direction/pose organization only) the old `sera-walk-cycle-3x3-v1.png`.
Four ImageGen calls: generate waking poses; clean their transparent surroundings;
generate peer/walking sheet; correct Liora's head size in that sheet. The rejected
intermediate variants remain outside the repository. No room was generated.

Requests locked nineteen-year-old adult identities, black updo/navy/gold Sera,
full-spectrum rainbow/sage/cream Liora, warm illustrated cutaway style, transparent
backgrounds, no furniture, and stable anatomy. The targeted second walking-sheet
request enlarged only Liora's head/face to match Sera, preserving body and feet.

`derive-assets.py` reproduces normalized runtime PNGs with Pillow (development
utility only). Uniform scale is shared across all nine Sera frames; only cropping
and anchor translations vary. Liora's standing and wake sheets use uniform
anatomy-preserving source-to-scene scales. Runtime never fits an image to a shot.
Canvas 128×192; foot anchor (64,184). Measured alpha>16 neutral standing heights:
Sera 146 px, Liora 148 px (1.37% taller). Authored facial landmark measurements are
approximately 20 px in both dimensions, within 5% across standing/waking poses;
they describe reviewed artwork, not automated facial recognition. The focused
suite verifies actual alpha heights, baseline, distinct frame pixels and margins.

The 0.14-second gait cycle [0,1,2,1] is driven by movement. Dialogue/idle selects
frame 1. The opening's existing 40-frame silent reveal now projects Sera from
(350,285) to the unchanged bedside (350,345), 1.5 pixels per update; every position
passes the unchanged footprint authority. There was no moving approach in the
checked-in opening. No dialogue beat, duration, trigger, control handoff or room
collision was changed.

Furniture masks contain exact background RGB pixels under binary alpha polygons.
The two bed ground-depth anchors are y=350. Their pixels cover an actor behind
that depth; an actor at or in front of it draws afterward. Liora's waking pose is
clipped to the existing right-bed interior and covered by its original blanket.
The generic `scene-depth.js` primitive has no bed, room or character dispatch.

## Browser evidence

Captures use the production scripts, real Chrome Canvas and loaded images in an
isolated headless session. Native images are 512×480; 2× images are exact nearest-
neighbour 1024×960 presentations of the same Canvas. Baseline captures load the
committed HEAD scripts. This is automated visual capture, not a manual playtest.

Manual review at both sizes: run the debug cutaway and canonical entry; watch the
approach/gait and waking pages; inspect peer faces at takeover; walk all four
directions behind/in front of each bed; pause at dialogue; approach the exit and
confirm the unchanged hospital return. Check furniture clipping, no duplicated
actors, portrait/UI layering and ordinary-game rendering afterward.

## Capture index

[Compact comparison sheet](comparison-sheet.png). Each row compares committed
baseline with corrected production Canvas output.

- standing: [native](after/standing-1x.png), [2×](after/standing-2x.png); [baseline](before/standing-1x.png).
- approach: [native](after/approach-1x.png), [2×](after/approach-2x.png); [baseline](before/approach-1x.png).
- waking: [native](after/waking-1x.png), [2×](after/waking-2x.png); [baseline](before/waking-1x.png).
- takeover: [native](after/takeover-1x.png), [2×](after/takeover-2x.png); [baseline](before/takeover-1x.png).
- behind-bed: [native](after/behind-bed-1x.png), [2×](after/behind-bed-2x.png); [baseline](before/behind-bed-1x.png).
- front-bed: [native](after/front-bed-1x.png), [2×](after/front-bed-2x.png); [baseline](before/front-bed-1x.png).

Regenerate captures with `VV_BROWSER_OUTPUT=<directory> node
Art/qa/sera-liora/depth-v2/capture-runner.js`; set `SERA_BASELINE=1` to serve the
immutable pre-repair commit instead. This starts only an isolated loopback server
and temporary headless Chrome profile.
