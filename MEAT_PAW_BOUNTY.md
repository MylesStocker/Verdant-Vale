# Meat Paw — post-MQ7 bounty

Meat Paw is an optional, exceptionally dangerous giant bear at CHAMBERI RIVER —
Lowlands, overworld square **(27,3)**. The Mornay Job Board in South Upper East
posts the **5000g** contract only after MQ7's completed report (`lantern_stage === 8`).
It offers acceptance directly; no new NPC or main-quest stage is added.

## Player route and battle

Read the board and accept. Prepare before entering the narrow southwest grass
passage: local column **1**, rows **10–12**, approached from the southern clearing
or the western opening. Bark scars and crushed grass mark the approach. The bear
emerges from the eastern trees over 1.1 seconds, corners the party, then forces
canonical combat after the warning dialogue. No terrain, seams, camera settings
or permanent collision barriers change. Before accepting, the passage is safe
from this scripted boss; ordinary wilderness encounters remain unchanged.

The bear has **1200 HP, 18 Defence, 18 Speed and 1200 XP**. It takes one action per
round, selecting equally among three attacks. Each targets one randomly selected
living party member using the shared targeting authority:

| Attack | On a hit |
|---|---|
| Paw | `max(50, floor(target maximum HP / 3))` damage |
| Claw | `max(100, floor(target maximum HP / 2))` damage |
| Pounce | Target becomes Fallen (0 HP) |

These amounts ignore armour and have no critical multiplier. Normal speed-based
evasion, Bullet Time and EvadeAll apply; a miss has no effect. Fallen members are
not selected. Running is blocked; Serpentsmoke remains specific to the Fen Zolom.
Observe explains the attacks without unlocking escape. This is a demanding
optional fight, not an expectation that the immediate MQ7 loadout can win without
further preparation. HP, XP and flavour remain revisable balance/content choices.

Defeat uses ordinary recovery and leaves the contract accepted. Victory clears
the ambush; return to the board to collect 5000g once. No random-pool entry or new
combat mode is introduced. The existing Peat-Bed Maw remains unchanged.

## Ownership and persistence

- `meat-paw.js`: board extension, notebook, location gate and exclusive emergence.
- `scripted-party-encounters.js`: authenticated victory receipt, blocked escape.
- `enemy-catalog.js` / `enemy-capabilities.js`: registered identity and the narrow
  `vital_strikes` capability; boss metadata follows the existing non-enumerable convention.
- `combat.js`: canonical solo/party execution and independent replay validation.
- `render-battle.js` / `render-party-battle.js`: programmatic bear and named attacks.
- Existing input, movement, save and activity owners prevent movement, menus,
  saving or competing scenes during emergence. Origin changes invalidate it.

One defaulted v5 quest binding, `meat_paw_stage`: 0 unaccepted, 1 accepted,
2 authenticated victory, 3 paid. Nonzero stages require completed MQ7. Invalid
saves fail atomically; older v5 saves default to 0. The animation is session-only.
**SAVE_VERSION remains 5.** Geographic grids, fingerprints and transition artifacts
are unchanged by this pass.

## Verification and walkthrough

Focused suite **355** checks the board gate, stale callbacks, acceptance,
movement in continuous and legacy views, exclusivity, save/load, exact damage,
misses, living-target selection, Fallen/absent Esla, replay tampering, no escape,
defeat recovery and once-only payment. Registry and historical boss inventories
retain explicit assertions updated for the one legitimate new identity.

`test/meat-paw-browser.html` runs real keyboard/Canvas checks at 512×480 and
1024×960 with isolated checkpoint fixtures. It captures the board, passage,
emergence, Esla warning, combat, Pounce, victory and payment. Victory uses boosted
fixture stats to verify lifecycle; it is **not** a balance playthrough. Screenshots
were visually inspected. Full results and the exact incremental file list are in
`Art/qa/meat-paw/verification.json`.

For human playtesting:

1. Finish MQ7's report, then accept Meat Paw at Mornay's South Upper East board.
2. Travel to (27,3); save before entering the southwest narrow grass strip.
3. Walk north into it. Confirm the bear comes out of the trees and corners you.
4. Test prepared equipment, healing and Bullet Time against Paw, Claw and Pounce.
5. After victory, collect 5000g at the board, save/reload and check it cannot pay again.
6. Reload the pre-fight save to check defeat recovery and retry with different preparations.

No commits or pushes are part of this implementation. Earlier MQ5/MQ6/MQ7 and
South Ruins work remains intact and uncommitted.
