# Optional wilderness dreams — review

Five repeatable-in-new-games, once-per-save waking visions. Writing follows the
brief second-person dislocations of `interactions.js` DREAMS and respects the
unresolved knowledge boundary of `BASIN_CHAMBER_DREAM_PAGES`. Nothing explains
the dreams, their source, or a connection to Sera/Liora. Names and prose remain
revisable content. LORE’s “final dream” reference now says “chamber dream” to
identify the existing pre-cutaway scene without excluding these later visions.

## Sites

Chunk coordinates are overworld atlas coordinates. Local tiles are zero-based.
All five are reachable from the later mainland; Pasture Hollows uses its
accessible eastern bank, without reopening the sealed southern approach.

| Area | Chunk | Map ID | Local tile | Seen flag |
|---|---|---|---|---|
| Shingle Shore | (14, -3) | `VALMERE_EXPANSE_C14RN3_MAP` | (10, 9) | `wilderness_dream_shingle_seen` |
| Great Fen | (3, -3) | `GREAT_FEN_C3RN3_MAP` | (8, 5) | `wilderness_dream_fen_seen` |
| River Lowlands | (25, 2) | `MAINLAND_C25R2_MAP` | (5, 8) | `wilderness_dream_river_seen` |
| Southern Mixed Woods | (6, 11) | `MAINLAND_C6R11_MAP` | (5, 9) | `wilderness_dream_woods_seen` |
| Pasture Hollows | (5, 8) | `MAINLAND_C5R8_MAP` | (13, 8) | `wilderness_dream_pasture_seen` |

## Authored sequences

### The weight of water

A stone turns under your boot. The sound of the lake stops before the stone does.

There is no shore. Only white, and a wet stone resting in your palm. It is warm.

You put it down. Somewhere very far below you, a door closes.

You pick it up again. Someone on the other side begins to knock.

You are still holding nothing when the water starts making noise again.

**If Esla is available afterward:** A wave breaks over the stones. Esla puts a hand against your shoulder.

**Esla:** Lély? Are you all right? You stopped in the middle of a step. Come back from the water a little.

### The missing footstep

Something walks through the reeds beside you. It stops when you stop.

The reeds are gone. The ground is white. You can still hear them brushing against a coat.

You take three steps. Beside you, four.

You wait for the extra footstep to go away. Instead, you remember taking it.

The smell of peat returns. You cannot remember which way you were looking.

**If Esla is available afterward:** Esla waits on the firmer ground, watching your face.

**Esla:** Are you all right, Lély? You were listening to something. We can stop here if you need a moment.

### The other bank

A river crosses a room you almost recognise. The walls are white. There is no ceiling.

On the other bank, an open cabinet stands knee-deep in the current. Its drawers are full of dry paper.

You can read the writing from here. Every page is an account of your crossing.

You have not crossed. You turn a page anyway.

Mud pulls at your boot. You are standing on the same bank as before.

**If Esla is available afterward:** Esla crouches beside you, then stands when you look at her.

**Esla:** Lély, are you all right? You went very pale. Tell me if it happens again; you do not have to walk it off.

### A light between the trees

Between the trunks, a square of yellow light. You know the window. You do not know the house.

You reach it. The trees have become white. The window is the only thing with an edge.

Inside, someone is setting a table. They pause with a plate in each hand.

You wait for them to turn. They wait for you to leave. Neither of you moves. The plates grow heavier.

A branch taps against another branch. There is no light between them now.

**If Esla is available afterward:** Esla has stopped a few paces ahead. She comes back rather than calling across the trees.

**Esla:** Are you all right? You looked as though you recognised someone. Stay beside me for a bit, Lély.

### Counted twice

A bell rings in the hollow. There are no animals in the grass.

A fence runs through the white. You count its posts so you will know how far you have come.

At the seventh, someone begins counting with you. Their voice is very patient. They start at one.

You reach the gate together. There is only room for one of you to pass. The counting continues on the other side.

Wind moves over the hollow. Your mouth is open, but you have not been speaking.

**If Esla is available afterward:** Esla looks back across the hollow, then at you.

**Esla:** Lély? Are you all right? Take a breath. Whatever you were looking at, you are here with me now.

## State and verification

- Uses the existing white DREAM_MAP and return gateway; restores position and facing.
- Five independent booleans persist through the existing version-5 bindings. Old saves default them false; invalid values fail atomically.
- No inventory, HP, status, reward, day, MainQuest or other quest mutation.
- Saving/loading during the white scene is blocked; ordinary aftermath is saveable.
- Suite 347 drives real movement keys in continuous and legacy modes, with and without Esla, covers all sites, graph reachability, encounter preemption, input lock, exact return, persistence, old saves and inert spawns.
- Automated Chromium: 103 checks at native and doubled scale. Keyboard entry, white pixels, all page advancement, Esla-only green style, waking return and save/reload/no repeat. This is automated browser testing, not a human playthrough.
- Representative screenshots visually inspected for wrapping, white presentation and green dialogue.
- Transition audit matches without regeneration. No grids, seams, cameras or geographic fingerprints changed by this task.

## Manual walkthrough

1. Approach each listed local tile by walking; the first entry should interrupt into white.
2. Advance every page and confirm the same waking location/facing. Try both solo and with Esla.
3. With Esla, narration remains neutral and her follow-up words are green.
4. Save, reload, leave and revisit: the same vision must not repeat; another site must still trigger.
5. Check that exploration and ordinary encounters resume afterward. Loading or debug-warping onto an unseen tile alone should not trigger; leave and walk back onto it.

Screenshots and `browser-results.json` are generated only by the isolated local
`test/wilderness-dreams-browser.html` page via `test/run-browser-smoke.js`.

## Files in this task

- `LORE.md`
- `PROJECT_STATUS.md`
- `architecture.md`
- `index.html`
- `movement.js`
- `quests.js`
- `save.js`
- `test/cases/51-save-binding-registry-migration.test.js`
- `test/cases/347-wilderness-dreams.test.js`
- `test/wilderness-dreams-browser.html`
- `test/wilderness-dreams-browser.js`
- `validation.js`
- `wilderness-dreams.js`

Plus this QA directory: the review, browser results, validation report and 22 captured PNGs.
The existing Rocky Beach edits are retained. Only `architecture.md`,
`PROJECT_STATUS.md` and `validation.js` overlap those earlier dirty files;
their existing work is preserved. All other pre-existing dirty-file hashes
remain unchanged. No gameplay grids or geographic artifacts were regenerated.

The first full run exposed an explicit save-binding snapshot (updated by exactly
five named fields / five window bindings) and the required final position of
`interactions.js` in script loading. The new module now loads immediately before
it. Suites 51, 58 and 347 pass together after those corrections; their substantive
assertions are retained.

## Final verification

- Final `node test/run.js`: **283 tests, 283 passed, 0 failed**.
- Eight changed/new JavaScript files pass `node --check`.
- `validateGameData()`: zero errors, six pre-existing warnings (see validation.json).
- All 1058 regional grid fingerprints verify in the regression suite; unchanged by this task.
- Transition audit: read-only match, 1263 maps, 479 fixed destinations,
  8 preserved-coordinate transitions, 2072 edge segments and 42 house doors.
- Diff whitespace/conflict checks pass. SAVE_VERSION remains 5.
- Main HEAD remains `286911fc92405fadf9fec2c8c9c99db8667122e6`.
  Work is unstaged/uncommitted; no branch, merge, commit or push operations performed.
