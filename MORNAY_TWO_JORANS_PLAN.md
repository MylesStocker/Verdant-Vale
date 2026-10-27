# Two Jorans — a jailhouse mix-up

Implemented optional local case. This is revisable town content, not a new
resolution of the Empire/Reclaimer story or permission to advance MQ5.

## Case and walkthrough

1. At South Mornay Watchhouse (immediately north of East Gate), ask Anric about
   the mixed booking sheet. Accept “Check the statements”; declining is inert.
2. Interview Joran Beck in the public booking room. He works in stone, has no
   freight payroll, and admits leaving his charge box and insulting a neighbour.
3. Visit Perris at the Old Fort repair site. The daybook establishes Beck's
   workplace and hours; a receipt establishes ownership of five spare charges.
   The neighbour complained about leftover supplies, not a warehouse threat.
4. At Fen Warehouse, Varda's original identifies freight contractor Joran Alden.
   She saw withheld wages and a struck carter, but admits her own careless
   consignment sign-off. Alden admits both acts, disputes the wage accounting,
   and admits paying for the injured man's dressing did not excuse the blow.
5. Return all four accounts to Anric. He corrects the record and releases Beck.
   Alden's own case proceeds under his name; the player does not conduct a trial.
6. Find Beck at the Old Fort. He voluntarily gives **Joran’s Supply Key**, visible
   in Notebook → Special Items. He wants no more trouble and will take hammer work.
7. Open the box against the fort's south wall, east of its opening. Receive
   **5 Sapper Charge** items (the existing registry spelling). The key stays in
   the lock. Repeated inspection, callbacks and reloads cannot restock the box.

Evidence may be collected in any order. The notebook lists remaining leads,
then directs the player to Anric, released Beck and the box. Esla enjoys the
administrative absurdity without resolving MQ5. Her pages retain her established
speaker style; she says nothing while unrecruited or temporarily absent.

## People and placement

Coordinates are tile centres; one tile is 32 pixels.

| Stable ID | Person | Location | Position |
| --- | --- | --- | --- |
| `mornay_anric_fell` | Anric, conscientious constable | Watchhouse | Existing (6.5, 5.5) |
| `two_jorans_beck` | Joran Beck, poor stoneworker | Watchhouse before release | (9.5, 4.5), facing left |
| `two_jorans_beck` | Same person, released | Old Fort | (9.5, 8.5), facing left |
| `mornay_perris_dun` | Perris, stonework supervisor | Old Fort | Existing (5.5, 10.5) |
| `mornay_varda_fen` | Varda, warehouse supervisor/witness | Fen Warehouse | Existing (12.5, 4.5) |
| `two_jorans_alden` | Joran Alden, freight contractor | Fen Warehouse | (8.5, 5.5), facing left |

New residents have ordinary programmatic sprites and stationary collision.
Beck's location is derived, not a saved sprite or duplicate scheduled identity.
Headers say “Joran”; full names occur in statements and journal instructions.
Existing 300-resident Mornay authority is unchanged; two quest NPCs join the
separate content fragment, bringing the current global SIMPLE_NPCS total to 492.

The supply box is centred at (9.5, 11.5), Old Fort wall cell (9, 11), with an
ordinary north approach at pixels (304, 336). It uses existing cargo artwork,
with a dark interior after claiming. No new tile, walkable obstruction or label.
Neither Joran blocks existing residents, required circulation or the cache.

## Save and state decision

The requested tracked quest uses two existing-style numeric save bindings:

- `two_jorans_stage`: 0 unstarted; 1 evidence; 2 released; 3 key given; 4 claimed.
- `two_jorans_evidence`: bits 1 Beck, 2 Perris, 4 Varda, 8 Alden.

Unstarted requires zero evidence; released and later require all four accounts.
Exactly one supply key must exist at stage 3, and none at every other stage.
Candidate violations reject before load writers. Older version-5 saves missing
both bindings default to unstarted. SAVE_VERSION remains **5**. Charges remain
ordinary consumables: spending them does not invalidate or reset completion.

No money, XP, party, time, MQ5, faction, cell-door, Old Fort plot or map state is
written. Existing witnesses retain ambient dialogue outside the evidence stage.
Future prison access and larger investigations remain reserved.

## Incremental file inventory

New production: `two-jorans.js`, `content/npcs/two-jorans-npcs.js`,
`content/interactions/two-jorans-dialogue.js`.

Integration: `index.html` script order; `npcs.js` registry/speakers;
`interactions.js` named participant dispatch; `items.js` special key;
`quests.js` bindings/mirrors/notebook; `save.js` bindings/invariant preflight;
`validation.js` invariant; `content/interactions/mornay-interactions.js` cache
prompt/dispatch; `render-mornay.js` room actors; `render.js` cache painting.

Tests: new `test/cases/330-two-jorans.test.js`,
`test/cases/331-two-jorans-state.test.js`, `test/two-jorans-browser.html`,
`test/two-jorans-browser.js`. Updated suites 51 (exact bindings and coherent
nondefault round trip), 58 (fragment aggregation), 171 (new key remains
unavailable to combat), 327 (decline optional case
while retaining public navigation and sealed-custody assertions).

Documentation: this file, `PROJECT_STATUS.md`, `architecture.md`,
`MORNAY_TOWN_PLAN.md`. Existing unrelated changes remain intact and uncommitted.

## Verification

Final results: **267/267 regression suites pass** (`node test/run.js`). All 19
changed/new JavaScript files pass `node --check`; `git diff --check` is clean.
`validateGameData()` reports zero errors and six unchanged baseline warnings.
NPC IDs are unique. The read-only transition audit matches its existing artifact
(1,247 maps, 448 fixed and eight preserved-coordinate transitions, 2,026 edge
segments); regional fingerprint suites pass. No artifacts were regenerated.
Automated browser: **101 checks, 18 captures, zero errors**, both display scales.
The initial full run identified the new key missing from suite 171's exhaustive
combat item matrix. Adding its explicitly unavailable classification fixed that
failure; the complete final rerun is green. No assertions were weakened.

Git: `main`, HEAD `d2861931401ccb6256137ae76646610cecb48084`, unchanged. This
increment touches the 25 files listed below. All work remains unstaged and
uncommitted; the checkout also contains prior unrelated work (62 modified tracked
files and 25 untracked files total at delivery). Nothing committed, merged or pushed.

Focused suites verify all evidence, incomplete turn-in, decline, every NPC
approach using movement/interaction controls, both regional presentation modes,
recruited/unrecruited/temporarily absent Esla, special key, five-item claim,
reloads, consumed charges, duplicate/stale callbacks and atomic invalid-save
rejection. Dialogue checks preserve every word across fitted pages. Existing
watchhouse access and all 300 resident conversations remain reachable.

Automated Chromium review uses real DOM keys and production update/render at
512×480 and 1024×960. It enters/exits watchhouse and warehouse doors, walks each
NPC/cache approach, completes the case and checks three save/load points plus
repeat claims. Between districts it uses validated fixture placement; this is
not a manually played continuous cross-town journey. Eighteen screenshots cover
both scales, including ordinary/Esla dialogue, the notebook key and the full/empty cache.

No grids, map identities, transition tables, camera settings or encounters were
changed for this quest. Geographic fingerprints and transition artifacts need
no regeneration. Existing dirty geographic artifacts belong to earlier work.

Manual follow-up: walk the complete street route between the watchhouse,
warehouse and Old Fort; try a
charge in an ordinary battle after collecting the cache.

### Exact current-task file list

- `MORNAY_TOWN_PLAN.md`
- `MORNAY_TWO_JORANS_PLAN.md`
- `PROJECT_STATUS.md`
- `architecture.md`
- `content/interactions/mornay-interactions.js`
- `content/interactions/two-jorans-dialogue.js`
- `content/npcs/two-jorans-npcs.js`
- `index.html`
- `interactions.js`
- `items.js`
- `npcs.js`
- `quests.js`
- `render-mornay.js`
- `render.js`
- `save.js`
- `test/cases/171-party-command-status-hardening.test.js`
- `test/cases/327-mornay-watchhouse.test.js`
- `test/cases/330-two-jorans.test.js`
- `test/cases/331-two-jorans-state.test.js`
- `test/cases/51-save-binding-registry-migration.test.js`
- `test/cases/58-regional-content-split.test.js`
- `test/two-jorans-browser.html`
- `test/two-jorans-browser.js`
- `two-jorans.js`
- `validation.js`
