# AGENTS.md — Verdant Vale

## Project purpose

Verdant Vale is a browser-based, retro-style JRPG built with plain JavaScript,
HTML, Canvas rendering, and data-driven content.

Preserve the established game identity, canon, visual style, architecture,
playable routes, and deliberately limited scope.

Myles is the final authority on:

- Game design and player experience
- Canon and worldbuilding
- Map appearance and geography
- Whether a change should be committed or published

When a consequential design choice is unresolved, stop and ask a concise
question. Do not silently invent canon, topology, mechanics, or content.

## Task modes

Follow the mode requested by the user:

- Report, audit, explain, or review: inspect and report only. Do not edit.
- Diagnose: identify the cause and evidence. Do not implement unless asked.
- Implement or fix: make the smallest coherent authorized change.
- Verify: test and inspect without opportunistic cleanup.
- Commit or push: perform Git operations only when explicitly requested.

Do not turn a bounded task into a refactor, redesign, balance pass, content
expansion, or architecture migration.

## Start every task

Before editing:

1. Run `git branch --show-current` and `git status -sb`.
2. Inspect all existing staged, unstaged, and untracked changes.
3. Preserve work already present unless explicitly told to remove it.
4. Identify the exact requested scope and explicit non-goals.
5. Read only the relevant sections of:
   - `PROJECT_STATUS.md` for current project state
   - `architecture.md` for system ownership and contracts
   - `LORE.md` when canon or player-facing writing is involved
6. Use `rg` to trace relevant symbols, writers, readers, registries, tests,
   and stale assumptions before editing.

Do not reread the entire repository when targeted inspection is sufficient.

## Sources of truth

Treat these authorities distinctly:

- `LORE.md`: canonical worldbuilding
- Current authored dialogue/content: player-facing implementation, but not
  automatically the authority for unresolved canon
- `architecture.md`: architectural contracts and file ownership
- `PROJECT_STATUS.md`: current implementation status and deferred work
- Production registries/catalogs: runtime data authority
- Tests and generated reports: evidence, not independent design authority
- Physical map grids: authority for current playable geography

When asked to “canonize” an established in-game fact, update `LORE.md` unless
the user specifically asks to rewrite dialogue.

## Regional overworld architecture

Preserve these established contracts:

- Regional world position is canonical. Do not reconstruct geography from
  `activeMap` plus local player coordinates.
- `activeMap`, `player.x`, and `player.y` are compatibility projections, not
  independent regional authorities.
- New regional chunks are authored through the established regional chunk
  definition/catalog workflow.
- Do not create standalone map variables, compatibility aliases, or
  `window.*` exports for new regional chunks.
- Regional grids are exactly 15 rows × 16 columns.
- Map IDs, content IDs, pickup IDs, tile IDs, and save-facing IDs are stable.
- Never renumber existing tile IDs.
- Update regional fingerprints only for grids intentionally changed.
- Continuous regional presentation is the production default.
- Verdant Vale’s home map retains its authored `legacy_screen` presentation.
- Legacy Regional Fallback remains a coherent session-only fallback.
- Geographic encounter ownership comes from the physical canonical chunk.
- Rendering, validation, diagnostics, and geographic resolution must remain
  read-only and must not spoof or transiently mutate gameplay state.

## Seams and transitions

For continuous regional seams:

- Author reciprocal structural `EDGE_TRANSITIONS`.
- Allowed structural properties are `targetMap`, `targetEdge`, and
  `sourceRange`, plus `targetRange` only where the existing contract expressly
  permits an identical non-remapping range.
- Do not attach callbacks, conditions, messages, cooldowns, flag effects, or
  unknown behavior-bearing properties to continuous seams.
- Multi-segment physical edges are supported.
- Ranges must be non-overlapping, reciprocal, base-walkable, and
  geometrically aligned.
- Malformed or ambiguous definitions must fail closed for the entire physical
  edge.
- Do not introduce point-transition wrappers or map-ID-specific movement
  exceptions when an ordinary structural seam is appropriate.
- Preserve blocked boundaries and regional borders unless changing them is
  explicitly part of the task.

Test continuous and Legacy Regional Fallback behavior independently.

## Map and terrain changes

For terrain work:

- Change only the authorized grids and cells.
- Report exact existing-grid deltas.
- Preserve paths, landmarks, entrances, content coordinates, and topology
  outside scope.
- Use existing terrain types unless a new type is explicitly authorized.
- A new terrain type requires a stable ID, tile properties, deterministic
  rendering, validation, and focused tests.
- Do not add runtime randomness to terrain or decoration rendering.
- Preserve the established retro/NES-like visual language.
- Avoid adding image assets or dependencies unless explicitly requested.
- Cosmetic edits must not accidentally create new crossings, encounter-safe
  terrain, isolated walkable components, or invalid spawn points.
- Browser appearance is not proven by automated tests; provide a manual visual
  checklist.

## Content and interaction rules

- Do not add NPCs, items, quests, dialogue, landmarks, interactions, or
  encounters unless requested.
- Preserve stable IDs and save/load behavior.
- Cross-seam content behavior must use explicit allowlisted capabilities and
  fail closed.
- Do not replace allowlists with denylists for behavior-bearing content.
- Active-map-only prompts, interactions, scripted fights, and special
  encounters must remain active-map-only unless explicitly generalized.
- Encounter terrain eligibility comes from tile properties combined with
  location permission and geographic pool ownership.
- Do not add map-specific encounter exceptions without explicit approval.

## Save and state safety

- Do not change `SAVE_VERSION` or the save payload unless explicitly
  authorized.
- New persistent mutable state requires a deliberate save/load decision and
  deterministic tests.
- Session-only debug, rendering, camera, and NPC-route state must not enter
  saves.
- Invalid placement and malformed save data must fail atomically.
- Never “repair” broken canonical state by silently copying from compatibility
  projections.

## Git safety

- Preserve dirty worktrees and unrelated user changes.
- Never use destructive commands such as `git reset --hard` or broad
  `git checkout --`.
- Never discard, overwrite, or delete untracked work without explicit
  permission.
- Do not switch branches, merge, rebase, amend, tag, commit, push, or open a
  PR unless explicitly requested.
- Never force-push.
- Before a requested push, fetch and prove the remote branch is an ancestor of
  the local branch. Stop if branches diverged.
- Do not commit secrets, credentials, machine-specific paths, temporary files,
  editor state, or agent worktree directories.

## Implementation discipline

- Prefer existing patterns and single authorities.
- Make the smallest coherent change that fixes the underlying issue.
- Avoid duplicated sources of truth.
- Avoid speculative abstractions and compatibility layers.
- Do not add dependencies or introduce a build system without approval.
- Preserve behavior outside the explicitly authorized scope.
- If the requested change conflicts with an established contract, explain the
  conflict before broadening the work.

## Verification

Use layered verification appropriate to the change:

1. `node --check` for every changed or new JavaScript file.
2. Focused tests for the affected system.
3. Full regression suite with `node test/run.js`.
4. `validateGameData()` using the established project workflow.
5. Transition audit with `node test/transition-audit.js` when maps,
   transitions, terrain edges, or regional totals change.
6. Regional fingerprint verification when any regional grid changes.
7. Targeted searches for stale symbols, unauthorized writers, aliases,
   callbacks, special cases, or save changes.
8. `git diff --check`.
9. Final diff and exact file-list review.

Do not hardcode expected test, map, seam, or audit totals in this file. Derive
them from the current repository and explain legitimate changes.

Regenerate tracked audit artifacts only through their established generator.
If an artifact contains catch-up changes from earlier commits, distinguish
those from the current increment.

Never claim browser or manual gameplay testing that was not performed. Report
automated, static, simulated, and manual evidence separately.

## Completion report

Lead with the outcome, then report:

1. Player-visible behavior
2. Exact implementation or findings
3. Existing data or grids changed
4. Tests, validation, audit, fingerprints, and save-version result
5. Exact changed/uncommitted files
6. Known limitations or judgment calls
7. Short browser/manual checklist
8. Git state, including whether anything was committed or pushed

Leave work unstaged and uncommitted unless the task explicitly says otherwise.
