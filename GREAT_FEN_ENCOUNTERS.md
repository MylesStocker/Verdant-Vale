# Great Fen encounter tier

Names, figures and flavour are revisable content. This pass adds six random
creatures and ten authored formations. It changes encounter ownership on 174
already accessible, encounter-enabled Great Fen chunks: 37 Great Fen definitions,
133 mainland definitions and four southern entry definitions. No terrain cells,
seams, access permissions, cameras, town content or story gates change.

## Creatures

| Enemy | HP | ATK | DEF | SPD | XP | Gold | Behaviour |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Peatback | 280 | 34 | 14 | 6 | 130 | 28–42 | Plain durable tank; ordinary attacks |
| Drownlight | 110 | 29 | 5 | 23 | 100 | 22–34 | False Lights on odd rounds; Observe disables it, exposes the next damaging hit for double damage, and grants +50% of this enemy's XP on victory |
| Blackbriar Hound | 150 | 38 | 8 | 22 | 120 | 25–40 | Mark, next-round Hamstring, ordinary bite, repeat |
| Bell-Throated Toad | 180 | 33 | 12 | 8 | 125 | 27–40 | Charge, next-round Deep Toll, ordinary bite; can pair with a Drownlight for Witchlight Chorus |
| Reedbinder | 165 | 31 | 7 | 15 | 115 | 25–38 | Bind one ally, slow by six, squeeze for eight at round end; two damaging hits or two round ends break the grip |
| Bladder Leech | 125 | 33 | 5 | 17 | 110 | 24–36 | Watch healing through the following round; heal itself by half the ally's actual restored HP, then become vulnerable to a +50 damage rupture |

The Hound's Hamstring uses 1.6× ATK and slows its victim by four through the next
round. Deep Toll uses 1.1× ATK; Chorus uses 1.45× and dazzles survivors. These
telegraphed special hits use the shared damage and incoming-defence arithmetic
at neutral variance, without critical rolls. Ordinary bites use the ordinary
Attack resolver, including evasion, variance and critical hits. Binding and slow
penalties do not stack beyond the strongest active penalty. Snared allies can
still act, including attacking the Reedbinder themselves.

A toad and one unobserved Drownlight reserve both actions at round entry. Their
joint action uses the slower participant's Speed. The charge is announced for a
full round; either participant's death interrupts the release and spends the
survivor's reserved action. There is no extra ordinary attack or substitute
partner during that committed round. Already-observed Drownlights will not begin
new combinations; observing one does not cancel a combination already charged.

Observe bonuses are per enemy instance and cannot be renewed by repeating
Observe. Exposure applies to the next damaging attack, item, delayed Bomb or
Resonance hit. The XP bonus is paid only through the existing victory reward
receipt. Retreat pays no observation bonus. No new persistent flags or save
fields are introduced; SAVE_VERSION remains 5.

## Formations

Weights sum to 100; the existing geographic encounter frequency is unchanged.

| Formation | Weight |
| --- | ---: |
| Peatback + Drownlight | 16 |
| Blackbriar Hound ×2 | 8 |
| Blackbriar Hound + Bladder Leech | 16 |
| Bell-Throated Toad + Drownlight | 16 |
| Reedbinder + Blackbriar Hound | 8 |
| Reedbinder + Bladder Leech | 16 |
| Peatback + Bell-Throated Toad | 8 |
| Drownlight ×2 + Blackbriar Hound | 4 |
| Peatback + Reedbinder + Bladder Leech | 4 |
| Bell-Throated Toad + Drownlight + Blackbriar Hound | 4 |

All formations retain ordinary escape. Earlier road pools, Zolom territory and
both Mornay removal bosses retain their authored assignments and mechanics.
The shared canonical engine handles these encounters even for a solo visitor;
older solo encounters keep their established execution owner.

## Ownership and graphics

- `data.js`: templates, weights and profile; `enemy-catalog.js`: stable identities.
- `fen-combat.js`: pure battle-local tactical reducer and observation text.
- `enemy-capabilities.js`: closed role metadata and state seeds.
- `combat.js`: initiative reservation, action/reaction/boundary hooks and
  replay verification; playback recomputes effects, never trusts supplied deltas.
- `canonical-party-combat.js`: overflow preflight and authenticated XP bonus.
- `render-battle.js`: all six sprites, conservative layout bounds and idle motion.
  Drownlight and Blackbriar Hound reuse early silhouettes with changed palettes;
  the other four use new code-drawn shapes. No image or dependency download.
- `render-party-battle.js`: visible charge/mark/binding/watch labels, binding
  coils and hit pulses, using the detached battle view and presentation clock.

## Review evidence and walkthrough

Suites 341/342 cover all ten formations through real controller input, both
party sizes, combined interruption, per-instance observation and rewards,
bindings, item/Quickbloom healing reactions, replay tampering, retreat, save/load,
physical encounter routing in continuous/legacy mode, and all six animated
sprite bounds and read-only rendering. Existing suites retain their substantive
checks, with registry totals and explicitly changed encounter assignments updated.

Browser review uses `test/great-fen-preview.html`: a disposable MQ5 fixture,
not a loaded save. The gallery shows all six real sprites. Combat buttons emit
keyboard events into the ordinary controller. Screenshots in
`Art/qa/great-fen/encounters-v1/` show native and 2× art and combat presentation.
This is visual/input-fixture evidence, not an unassisted wilderness playthrough.

For playtesting:

1. Enter the Great Fen beyond the southern warning ground. Check that ordinary
   road fights remain unchanged. The subsequent Valmere access pass keeps Zolom at (7,0), changes (8,0) to ordinary hard encounters, and adds Serpentsmoke; see Art/qa/valmere-access/README.md.
2. Observe a Drownlight; hit its exposed core and check the victory XP.
3. Let Chorus charge, then kill either partner during the response round.
4. Let a Hound mark someone; compare its lunge and following ordinary bite.
5. Cut a Reedbinder's grip with two hits, and separately let it expire.
6. Heal the ally watched by a Leech; hit it once swollen.
7. Retreat, save/load on the field and start another encounter: no tactical
   marks or bindings should carry over.

Balance still merits ordinary playtesting with the player's actual equipment
and supplies, particularly the rare three-enemy groups. No universal 3–5-round
completion guarantee is claimed for these stronger encounters.

## Current-pass file inventory

Production: `data.js`, `enemy-catalog.js`, `enemy-capabilities.js`,
`fen-combat.js` (new), `combat.js`, `canonical-party-combat.js`,
`render-battle.js`, `render-party-battle.js`, `index.html`, and
`content/maps/eastern-fens-maps.js`, `content/maps/great-fen-maps.js`,
`content/maps/mainland-maps.js`. The three map files change encounter profiles
only (plus an explanatory comment); no grid cells change.

Documentation: this new report, `ENEMY_CAPABILITY_AUDIT.md`,
`PROJECT_STATUS.md`, `architecture.md`.

Tests: new `test/cases/341-great-fen-tactics.test.js` and
`test/cases/342-great-fen-geography-art.test.js`; existing cases 52, 186, 187,
188, 189, 191, 200, 315, 318 and 323 update explicit registry/combination totals
or encounter assignments. Case 323 proves the new assignments before projecting
detached metadata back to its historical shoreline snapshot; its terrain, access,
water continuity and seam assertions remain intact.

Visual review: new `test/great-fen-preview.html`, `test/great-fen-preview.js`,
and seven browser screenshots under `Art/qa/great-fen/encounters-v1/`:
`six-enemies-native.png`, `six-enemies-2x-upper.png`, `six-enemies-2x-lower.png`,
`chorus-warning-native.png`, `chorus-release-native.png`,
`chorus-release-2x.png`, `binding-and-scent-native.png`.

Earlier uncommitted Mornay jobs and Peat-Bed Maw work is retained, including
overlapping combat/documentation edits. This pass leaves all changes unstaged
and uncommitted on `main`, starting HEAD `dc425d2`; no merge or push.

## Final verification

- Full `node test/run.js`: **278/278 passed**, including the new tactical/art
  suites, historical combat, story fights, geographic fingerprints, saved
  identities, town services and quest lifecycles.
- Ordinary compatibility sweep: **131,037** immutable formation preparations.
- `node --check`: all **41** changed/new JavaScript files in the worktree pass,
  including preserved earlier work.
- `validateGameData()`: **0 errors, 6 existing warnings** (notice-board tile,
  Zolom ATK, Takomo's generic sprite, the historical unrouted raw Eastern Fens
  pool, and two older long NPC dialogue entries).
- Transition audit: **1,263 maps**, **479 fixed destinations**, **2,026 edge
  segments** checked; tracked artifact matches. No artifact regeneration.
- **1,058 regional grids** remain unchanged by this pass; no fingerprints were
  regenerated. Encounter metadata changes are explicitly covered separately.
- `git diff --check` and targeted conflict-marker search pass. SAVE_VERSION is
  **5**. Browser evidence is the isolated native/2× fixture review described
  above, not a claim of a normal-equipment balance playthrough.
