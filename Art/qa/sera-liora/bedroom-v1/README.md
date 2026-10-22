# Sera/Liora playable-bedroom QA

These are automated real-Canvas captures from the production renderer after the
playable-room interaction pass. They are review evidence, not runtime assets.
The paired files show the same 512×480 Canvas at native size and at an exact,
nearest-neighbour 1024×960 presentation.

- `takeover-*`: control handoff with both women present and Liora's bed unmade.
- `desk-behind-bed-*`: Sera at the upper-right writing desk, depth-sorted behind
  Liora's bed.
- `unmade-bed-front-*`: Sera back on the near floor, in front of the bed.
- `flowers-space-prompt-*`: the familiar blinking `SPACE` interaction indicator
  at a legal flowers approach; the prompt uses the same validated availability
  record as interaction input.
- `door-space-prompt-*`: the same indicator at the legal bedroom exit position;
  its visibility uses the existing door-availability authority.

The isolated capture runner reported no browser/Canvas errors. This is automated
visual evidence; the full keyboard interaction flow still requires manual play.
