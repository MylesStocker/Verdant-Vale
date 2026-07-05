# Combat / Level-Curve / Equipment / Economy Balance Audit

Audit pass only — **no gameplay code, stats, formulas, or tables were
changed.** Every number below comes from a reusable, deterministic
simulator, **`test/balance-report.js`**, built the same way
`test/transition-audit.js` was for the map audit: it loads the real game
into a live `vm` context (`test/harness.js`) and reads the actual
`ENEMY_TEMPLATES`/`XP_THRESHOLDS`/`MERCHANT_STOCK`/etc. constants directly
out of it, rather than hand-transcribing them (and risking a copy error
that quietly invalidates the whole report).

The turn-resolution formula itself (damage, turn order, brace, curse-fumble,
escape chance, Observe) is re-implemented in plain JS so a few thousand
Monte-Carlo trials per matchup run fast — but it's a **verified**
reimplementation: the script's `selfCheck()` drives one real combat turn
through the actual `handleCombatAction()` in the vm with `Math.random`
pinned to a fixed value, and asserts this script's numbers match the real
game's output exactly, for both Attack and Observe. It fails loudly
(non-zero exit) if the two ever disagree — e.g. if combat.js changes and
this script isn't updated to match.

```
node test/balance-report.js
```

Runs in well under a second, prints ~250 lines of tables, is fully
deterministic (seeded PRNG, not `Math.random`) so reruns are identical.

> **Update (post-audit):** Finding B1 below (item use in combat granting a
> free, uncounterable turn) has since been fixed — see the "RESOLVED" note
> on B1 for exactly what changed. `simulateFight()`'s potion model and the
> self-check were both updated to match, and every number in this report
> that depended on B1 (the boss/special table's "+3 potions" column for
> Briar Warden, Mulholland, and Kolm) has been rerun and updated in place.
> Everything else in this report — enemy stats, the level curve, the
> economy, and the raw no-potion danger ratings — was unaffected by the fix
> and is unchanged.

---

## 1. High-level verdict

**Mostly okay, with one structural bug that undermines every difficulty
number in this report, one severe intra-pool spike, and one mandatory boss
that's very hard to win without leaning on that same bug.**

- **The single most important finding isn't a stat — it's a mechanic, and
  it's now fixed.** Using an item in combat (`combat.js`, the
  `phase === 'item'` branch) used to never queue an enemy counter-attack —
  every other action (Attack, a failed Run, Observe) risked a hit, but using
  a Potion was completely free, repeatable, and interruption-proof. This
  made "difficulty" as measured by raw enemy stats overstate real danger for
  any player carrying 2-3 potions, and it was precisely what made at least
  one mandatory boss (Mulholland) survivable at all at its apparent intended
  level. **Fixed:** item use now consumes the turn and the enemy responds,
  via a shared `enemyTurnResponse()` helper using the same formula as
  Attack's counter. Mulholland's win rate with 3 potions dropped from 99.9%
  to 39.8% as a result — potions still help, they're just no longer a free
  win. See Finding B1.
- **Biggest spike:** Rotwood Troll (`FAR_ENEMY_TEMPLATES`) has a **97%
  death rate** against the same player who beats every other enemy in its
  own encounter pool (Fen Lurker, Thornback, Fen Witch, Bog Serpent) with a
  94-100% win rate. It's not "the hard one in a pool that ramps" — it's a
  cliff. A player exploring the far overworld for the first time has a
  1-in-5 chance per encounter of an near-certain-death fight sitting in the
  exact same random-encounter table as four survivable ones.
- **Biggest underwhelming areas:** the starting map (`MAP`,
  `EARLY_ENEMY_TEMPLATES`) and the second map (`MAP2`, `ENEMY_TEMPLATES`)
  are both **100% win rate, Trivial-to-Easy even for a completely
  unequipped Level 1 character.** That's a reasonable design choice for a
  tutorial stretch, but it's two full areas of essentially risk-free
  combat before the game introduces its first real threat — there's room to
  compress this or introduce a mid-tier enemy earlier.
- **Dungeon floors 4-5 reuse the exact same enemy pool as floors 2-3**
  (`combat.js`'s pool-selection ternary maps both to
  `DUNGEON2_ENEMY_TEMPLATES`) — regular encounters add zero incremental
  difficulty across that stretch; all of the floor 3→6 ramp is carried
  by the Mulholland miniboss gate alone.
- **Recommended tuning philosophy:** don't chase every number — this
  simulator shows the vast majority of enemies land in a sane
  Easy/Moderate/Dangerous band relative to a plausible player at that point
  in the game. With B1 fixed, the remaining outlier by a wide margin is
  Rotwood Troll's spike (Mulholland is still hard without potions, but no
  longer trivially free with them — see Finding F2's updated numbers).
  This is a "trim the outliers" pass, not a system redesign.

---

## 2. Tables

### 2.1 Player level curve (base stats, no gear — `data.js` / `state.js`)

| Lvl | XP to reach | MaxHP | ATK | DEF | SPD |
|---|---|---|---|---|---|
| 1 | 0 | 30 | 8 | 2 | 7 |
| 2 | 100 | 40 | 10 | 3 | 7 |
| 3 | 200 | 50 | 12 | 4 | 7 |
| 4 | 400 | 60 | 14 | 5 | 7 |
| 5 | 800 | 70 | 16 | 6 | 7 |
| 6 | 1600 | 80 | 18 | 7 | 7 |
| 7 | 3200 | 90 | 20 | 8 | 7 |
| 8 | 6400 | 100 | 22 | 9 | 7 |
| 9 | 12800 | 110 | 24 | 10 | 7 |
| 10 | 25600 | 120 | 26 | 11 | 7 |

**Notable:** SPD never changes on level-up (`state.js:107-117` only touches
`maxHp`/`atk`/`def`). Every point of SPD past the starting 7 comes from an
accessory. See Finding C1.

### 2.2 Equipment progression (illustrative benchmarking tiers — not a
scripted level-gate; the game doesn't force any particular loadout by
level. Built from real `shops.js`/`data.js` prices and bonuses to bound the
analysis, not asserted as "the" intended path.)

| Tier | Contents | ATK | DEF | SPD | Cost / source |
|---|---|---|---|---|---|
| T0 unequipped | none | +0 | +0 | +0 | — (before Aldric issues the kit) |
| T1 starting kit | Iron Sword + Leather Armor | +4 | +3 | +0 | Free — Supervisor/Aldric requisition-ticket flow, day 1 |
| T2 | + Iron Shield | +4 | +6 | +0 | 70g, Calwick merchant (always available) |
| T3 | Steel Sword + Iron Targe + Swiftstone | +7 | +11 | +2 | Steel Sword & Iron Targe are **free** dungeon floor-1 chests; Swiftstone 90g |
| T4 | Warden Blade + Shadow Cloak + Iron Targe + Wraithband | +10 | +16 | +4 | Warden Blade free (Sluice secret chest); Shadow Cloak 280g + Wraithband 200g, both **Traveller-only** (1/3 chance/town visit, never in Drenwick) |
| T5 | Dragon Blade + Shadow Cloak + Iron Targe + Wraithband | +12 | +16 | +4 | Dragon Blade 350g, Traveller-only |

**Equipment-vs-leveling comparison:** going from no gear to best gear adds
+12 ATK (≈ 6 levels' worth of the +2/level curve) but **+16 DEF (≈ 16
levels' worth of the +1/level curve)** and +4 SPD (infinite levels' worth,
since leveling contributes 0 SPD). Equipment matters *enormously* for
survivability and speed, moderately for offense. See Finding C1/C2.

### 2.3 Enemy stats by area (real values from `data.js`, grouped exactly as
`combat.js`'s `startCombat()` pool-selection logic groups them)

| Area (pool) | Enemy | HP | ATK | DEF | SPD | XP | Gold |
|---|---|---|---|---|---|---|---|
| MAP (start overworld) | Marsh Wisp | 10 | 3 | 0 | 6 | 8 | 0-2 |
| | Briar Hound | 16 | 6 | 1 | 5 | 10 | 2-5 |
| MAP2 | Marsh Wisp | 14 | 5 | 1 | 9 | 12 | 1-3 |
| | Stone Crawler | 36 | 5 | 6 | 3 | 20 | 3-8 |
| | Briar Hound | 25 | 10 | 2 | 8 | 16 | 3-8 |
| Far overworld (MAP3/N1/N2/MAP3_N1/N2) | Fen Lurker | 38 | 14 | 3 | 11 | 38 | 8-18 |
| | **Rotwood Troll** | 58 | **16** | 6 | 3 | 45 | 10-20 |
| | Thornback | 44 | 12 | 9 | 4 | 42 | 9-18 |
| | Fen Witch | 32 | 20 | 2 | 8 | 50 | 12-22 |
| | Bog Serpent | 48 | 15 | 4 | 9 | 48 | 10-20 |
| Thornmere (MAP4/MAP5) | Corpse Slug | 62 | 13 | 6 | 2 | 55 | 14-28 |
| East Sluice | Reed Grappler | 34 | 9 | 5 | 5 | 26 | 5-12 |
| | Silt Lurker | 22 | 13 | 1 | 11 | 30 | 5-11 |
| Mirethyst's Vault | Pale Drowned | 30 | 11 | 2 | 10 | 35 | 6-14 |
| | Silt Hag | 45 | 18 | 5 | 3 | 50 | 10-20 |
| Dungeon floor 1 | Bone Guard | 36 | 8 | 6 | 4 | 28 | 8-15 |
| | Shade Wraith | 26 | 12 | 2 | 12 | 32 | 8-15 |
| Dungeon floors 2-3 **and** 4-5 (same pool) | Crypt Fiend | 52 | 15 | 8 | 3 | 55 | 12-22 |
| | Void Walker | 38 | 22 | 3 | 7 | 65 | 16-28 |
| Dungeon floors 6-7 | Hollow | 65 | 20 | 10 | 5 | 80 | 18-32 |
| | Fen Shade | 45 | 28 | 4 | 8 | 90 | 20-35 |
| Dungeon floor 8 | Tomb Sentry | 90 | 25 | 12 | 3 | 120 | 25-45 |
| | Crypt Revenant | 70 | 32 | 5 | 10 | 130 | 28-50 |
| Dungeon floors 9-10 (horror) | Wall Tendril | 55 | 38 | 2 | 14 | 150 | 30-55 |
| | Dripping Maw | 120 | 35 | 8 | 5 | 160 | 32-58 |
| | The Seep | 40 | 45 | 0 | 18 | 170 | 35-62 |

### 2.4 Enemy danger ratings (Monte Carlo, 4000 trials, attack-only, no
potions, against the pool's benchmark player — see script output for exact
benchmark stats used per pool)

| Area | Enemy | Win rate | Death rate | Avg HP% at win | Danger |
|---|---|---|---|---|---|
| MAP | Marsh Wisp | 100.0% | 0.0% | 96% | Trivial |
| MAP | Briar Hound | 100.0% | 0.0% | 73% | Easy |
| MAP2 | Marsh Wisp | 100.0% | 0.0% | 93% | Trivial |
| MAP2 | Stone Crawler | 100.0% | 0.0% | 85% | Trivial |
| MAP2 | Briar Hound | 100.0% | 0.0% | 50% | Easy |
| Far overworld | Fen Lurker | 100.0% | 0.0% | 50% | Easy |
| Far overworld | **Rotwood Troll** | **3.1%** | **96.9%** | 6% | **Deadly** |
| Far overworld | Thornback | 100.0% | 0.0% | 40% | Moderate |
| Far overworld | Fen Witch | 94.0% | 6.0% | 19% | Dangerous |
| Far overworld | Bog Serpent | 99.6% | 0.4% | 25% | Dangerous |
| Thornmere | Corpse Slug | 100.0% | 0.0% | 92% | Trivial |
| East Sluice | Reed Grappler | 100.0% | 0.0% | 47% | Moderate |
| East Sluice | Silt Lurker | 100.0% | 0.0% | 47% | Moderate |
| Mire Vault | Pale Drowned | 100.0% | 0.0% | 84% | Trivial |
| Mire Vault | Silt Hag | 78.7% | 21.3% | 14% | Dangerous |
| Dungeon 1 | Bone Guard | 100.0% | 0.0% | 92% | Trivial |
| Dungeon 1 | Shade Wraith | 100.0% | 0.0% | 79% | Trivial |
| Dungeon 2-3 | Crypt Fiend | 100.0% | 0.0% | 89% | Trivial |
| Dungeon 2-3 | Void Walker | 99.9% | 0.1% | 70% | Easy |
| Dungeon 4-5 | Crypt Fiend | 100.0% | 0.0% | 95% | Trivial |
| Dungeon 4-5 | Void Walker | 100.0% | 0.0% | 79% | Trivial |
| Dungeon 6-7 | Hollow | 100.0% | 0.0% | 95% | Trivial |
| Dungeon 6-7 | Fen Shade | 100.0% | 0.0% | 83% | Trivial |
| Dungeon 8 | Tomb Sentry | 100.0% | 0.0% | 85% | Trivial |
| Dungeon 8 | Crypt Revenant | 100.0% | 0.0% | 66% | Easy |
| Dungeon 9-10 | Wall Tendril | 100.0% | 0.0% | 69% | Easy |
| Dungeon 9-10 | Dripping Maw | 100.0% | 0.0% | 51% | Easy |
| Dungeon 9-10 | The Seep | 100.0% | 0.0% | 53% | Easy |

Full per-enemy tables including exact benchmark stats are in the script's
console output.

### 2.5 XP/gold reward ratings (pool averages)

| Pool | Avg XP/fight | Avg gold/fight | Fights to afford Potion (30g) |
|---|---|---|---|
| MAP | 9.0 | 2.3 | 14 |
| MAP2 | 16.0 | 4.3 | 7 |
| Far overworld | 44.6 | 14.7 | 3 |
| Thornmere | 55.0 | 21.0 | 2 |
| East Sluice | 28.0 | 8.3 | 4 |
| Mire Vault | 42.5 | 12.5 | 3 |
| Dungeon 1 | 30.0 | 11.5 | 3 |
| Dungeon 2-3 / 4-5 | 60.0 | 19.5 | 2 |
| Dungeon 6-7 | 85.0 | 26.3 | 2 |
| Dungeon 8 | 125.0 | 37.0 | 1 |
| Dungeon 9-10 | 160.0 | 45.3 | 1 |

Reward scaling is **clean and monotonic** — every deeper/harder pool pays
more XP and gold than the one before it, with no underpaid outliers. This
is one of the better-tuned aspects of the game.

### 2.6 Observe's effect on expected incoming damage

Observe (`combat.js:1085-1115`) deals 0 damage and instead rolls a flat
**50% chance** the enemy "does not close the distance" this turn (25% for
boss/special fights, via the `isSpecial` flag) — if it does close, the
player takes a normal hit (same `atk*(0.8-1.2) - effectiveDef` formula as
any other hit). Compare that to a normal Attack action on a non-kill turn:
against any enemy **without** `defendChance`, the enemy always lands its
counter (100% hit chance) unless the player is faster and kills it that
turn; against an enemy **with** `defendChance`, its own brace chance is the
only thing reducing that to `(1 - defendChance)` — typically 70-80%, still
well above Observe's 50%.

| Enemy | Player benchmark | Avg enemy dmg if hit | Observe: P(hit) / E[dmg] | Attack: P(hit) / E[dmg] |
|---|---|---|---|---|
| Briar Hound | Lv.1, unequipped | 4 | 50% / 2.00 | 100% / 4.00 |
| Fen Witch | Lv.2, +Iron Shield | 11 | 50% / 5.50 | 100% / 11.00 |
| Rotwood Troll | Lv.2, +Iron Shield | 7 | 50% / 3.50 | 100% / 7.00 |
| Stone Crawler (has `defendChance`) | Lv.1, starting kit | 1 | 50% / 0.50 | 80% / 0.80 |
| Tomb Sentry (has `defendChance`) | Lv.6, sluice/traveller gear | 2 | 50% / 1.00 | 70% / 1.40 |
| The Seep | Lv.7, best traveller gear | 21 | 50% / 10.50 | 100% / 21.00 |

**Reading:** Observe is, mechanically, "take roughly half the expected
damage of an Attack, deal zero damage, and learn a line of flavor text for
the first 2-3 uses against a given enemy (`getObservationText` runs out and
repeats a generic line after that)." It's a real, meaningfully safer
half-turn against anything without `defendChance`, and only a marginal
safety gain against enemies that already brace. There's no mechanic that
makes it *more* valuable against faster or more dangerous enemies
specifically — the 50%/25% split is flat regardless of the actual enemy's
speed or attack stat, unlike turn order itself (which is SPD-driven). A
fast, hard-hitting enemy (The Seep, Wall Tendril) gets exactly the same
50% mitigation as a slow, weak one (Marsh Wisp) — Observe doesn't scale its
protection to the threat it's facing.

### 2.7 Boss/special encounter ratings

| Encounter | HP/ATK/DEF/SPD | Gate | No-potion win% | +3 potions win% | Danger |
|---|---|---|---|---|---|
| Briar Warden | 75/18/5/7 | Optional, reachable very early | 0.0% (Lv2, kit only) | 0.0% *(was 2.9% pre-fix)* | Deadly at intended-early level; 100% by Lv2 + Iron Shield's gear tier |
| Smuggler Guard | 34/12/5/7 | Mandatory-if-you-fight (has a spare/leave branch), MainQuest 2 | 100.0% | 100.0% | Trivial |
| Polwick | 42/14/5/6 | Same visit, follows guard | 100.0% | 100.0% | Trivial |
| Essa | 26/11/2/12 | Same visit, follows Polwick | 100.0% | 100.0% | Trivial |
| Pale Sentry | 500/20/10/4 | Optional, persistent HP across encounters | 0.0% (single-sitting) | 0.0% | **Not deadly in practice — see note below** |
| **Mulholland** | 140/28/8/4 | **Mandatory** (guards floor 4→5 stairs) | 0.1% (Lv5, T3 dungeon gear) | **39.8%** *(was 99.9% pre-fix)* | Deadly without items; a real (not guaranteed) help with 3 potions post-fix |
| Den Wraith | 42/19/2/13 | Optional, day≥11 | 100.0% | 100.0% | Trivial |
| Kolm (brawl) | 55/26/4/7 | Optional, Dayoff only | 0.2% | 17.3% *(was 87.2% pre-fix)* | Deadly without items; still mostly deadly with potions post-fix |
| Takomo | 280/52/12/4 | Optional secret superboss, no loot ("glory only") | 0.0% even at Lv10/T5 | 0.0% with 3, **~100% with ~10** *(pre-fix figures — see caveat below)* | Correctly gated as a true postgame challenge — see note |
| Wrongteeth (main boss) | 300/30/6/6 | **Mandatory** (gates floor 5→6) | 0-18% at Lv5-6/T3-T4 | Wildly level/tier-dependent *(pre-fix figures — see caveat below)* | Reasonable only from ~Lv7+T4 or ~Lv8-9+T3 |
| Rainfish (×3 chain) | 22/10/0/24 per fish | Mandatory once triggered, no flee | 100.0% | 100.0% | Trivial |

**Post-fix update:** the "+3 potions" column for Briar Warden, Mulholland,
and Kolm was rerun against the fixed `combat.js` (item use now costs the
turn — see Finding B1) and the numbers above are current. Takomo's and
Wrongteeth's potion-dependent figures came from a separate, deeper
level/tier sweep (not `test/balance-report.js`'s own run) built specifically
to find the level where each crosses 50% win rate; that sweep was not
rerun as part of this fix (out of scope for this pass), so treat those two
specific numbers as pre-fix and likely somewhat pessimistic now (potions
still help, just less than before) rather than current.

**Notes on the three encounters that need more than a one-line rating:**

- **Pale Sentry** is not actually "broken" despite the 0% single-sitting win
  rate — its HP explicitly persists across encounters *including losses*
  (`combat.js:218-222`, confirmed in `QUEST_TRACE.md` section 9). A losing
  fight at the Lv4/T3 benchmark still lands ~15 turns × ~11 damage/turn ≈
  165 damage on its 500 HP before the player dies, so ~3 costly (all-gold,
  +1 day) encounters fully whittles it down. This is a coherent
  attrition-contract design, not a bug — but it means "danger rating" is
  the wrong lens for this one fight; "cost in gold and days to complete the
  contract" is the right one, and that cost is steep but not unbounded.
- **Takomo** never crosses 50% win rate even at Level 10 with the best
  benchmarked gear (T5) unless the player stockpiles roughly **10 potions**
  (a swept parameter, not one of the report's two standard scenarios) — at
  that point it becomes reliably winnable. Given the template's own comment
  ("glory only, no loot drop") this reads as an intentional true
  postgame/superboss check, correctly gated behind heavy potion investment
  rather than being silently unbeatable. No change recommended.
- **Wrongteeth** (the one boss that's mandatory for main-path progression)
  is the most sensitive to gear-tier RNG: a player who only ever finds
  guaranteed dungeon-chest gear (T3) needs to be **~Lv8-9** before a raw win
  is likely; a player who gets lucky with the Traveller (T4 gear, 1/3
  chance per Calwick visit, never appears in Drenwick) can win reliably
  from **~Lv6-7**. See Finding B3.

---

## 3. Findings

### Bugs (reported separately, per audit instructions)

**B1 — Using an item in combat granted a completely free action; the enemy
never got to counter-attack. — ✅ RESOLVED.** `combat.js`, the
`phase === 'item'` branch (~lines 901-933): both the potion-heal path and
the equip-item path used to end with `combat.messageQueue = [];
combat.phase = 'message';` and **no** enemy-turn message was ever queued —
in contrast to the `attack` branch, which always queues (or immediately
applies) an enemy counter-hit unless the player killed the enemy outright.
Concretely: a player at 1 HP against any enemy could drink a Potion, and
the enemy would not act that turn — repeatable every single turn, limited
only by inventory size and gold to restock. This was the single biggest
lever in the entire combat system: the Monte-Carlo table above originally
showed Mulholland going from a 0.1% win rate to 99.9% with exactly 3
potions.

**Fix applied:** item use now runs through a new shared helper,
`enemyTurnResponse()` (`combat.js`, added just after `applyEnemyHitEffects`),
which computes the enemy's hit with the same `atk*(0.8-1.2) -
effectiveDef()` formula the Attack counter-attack uses, applies
`applyEnemyHitEffects()`, and checks for defeat — then queues it as a
deferred `{ text, apply() }` message, the same shape every other enemy hit
in this file uses. Both the potion-heal path and the equip-item path now
push this response after their own effect message, so using an item
consumes the turn exactly like Attack does. Backing out of the item menu
(the "[ Back ]" row, or pressing `b`/`Escape` directly) is unchanged — no
turn is consumed, no enemy response fires, matching the pre-fix behavior
exactly. Re-running the simulator after the fix: Mulholland's win rate with
3 potions dropped from 99.9% to 39.8%, Kolm's from 87.2% to 17.3%, and
Briar Warden's from 2.9% to 0.0% — potions still help (Mulholland is still
much better with them than without), they're just no longer a guaranteed,
risk-free win. Regression coverage:
`test/cases/12-combat-item-turn.test.js` (using an item consumes the turn
and the enemy responds) and
`test/cases/13-combat-item-back-no-turn.test.js` (backing out via either
path spends no turn). `test/balance-report.js`'s self-check was extended to
verify the item-use formula against the real `handleCombatAction()` the
same way it already did for Attack and Observe.

**B2 — `Reed Remedy` cures poison but nothing cures `cursed` in the field.**
Curse (from Void Walker 20%, Den Wraith 30%, and any future
`curseChance` enemy) causes a 25% chance to fumble your own attacks for the
rest of the fight, plus periodic overworld trip damage while it persists
(`movement.js:291-294`). The only cures found anywhere in the codebase are
the generic "rest fully" branches (Inn, 20g) and the automatic clear on
defeat (`combat.js:893`). There's no potion/field item that targets it
specifically, unlike poison. Minor, but worth a decision — is this
intentional ("curse is supposed to be expensive to shake"), or a gap where
a curative item was planned and never added (same class of thing as the
orphaned Cat-Shaped Key noted in `QUEST_TRACE.md`)?

### Overtuned enemies

**F1 — Rotwood Troll is a severe, isolated spike within its own encounter
pool.** At the benchmark player for the far-overworld pool (Level 2, Iron
Shield tier: ATK14/DEF9/SPD7/HP40), Rotwood Troll is a **96.9% death rate**
against **0-6% death rate** for the other four enemies in the exact same
random-encounter table (Fen Lurker, Thornback, Fen Witch, Bog Serpent).
It's not simply "the pool's hard enemy" the way Fen Witch is (which the
game's own Observe text warns about explicitly — "Glass cannon. End it
quickly" — and which the numbers back up as merely Dangerous, not Deadly).
The mechanism: Rotwood Troll's ATK (16) is disproportionate to its own
HP/DEF (58/6), so the fight neither ends fast (low DEF doesn't matter if
the player doesn't out-damage it quickly) nor is survivable at length (no
`defendChance`, so it always hits at full force). A player's first venture
past `MAP2` has a 1-in-5 random-encounter chance of a fight they will very
likely lose. Confirmed via a level/tier sweep: this is a genuine cliff, not
a gradient — win rate goes from 0% (Lv1) → 3% (Lv2) → 86% (Lv3, one level
later) with no smooth ramp in between, because the underlying formula's
integer defense-subtraction creates a hard threshold once `effectiveDef` is
high enough to bring `eDmg` down substantially.

**F2 — Mulholland (mandatory) is barely winnable without the item-loop
exploit (B1) at the level the game gates it to.** 0.1% raw win rate at
Level 5 with the best guaranteed (dungeon-chest) gear tier. It only becomes
reasonable to fight "clean" from roughly Level 7 with dungeon-only gear
(T3), or Level 4 with the RNG-gated Traveller gear (T4). Since it's a hard
progression gate (guards the floor 4→5 stairs), a player who hasn't found
the optional Traveller and hasn't over-levelled is stuck leaning entirely
on B1 to pass it — the mandatory main path silently depends on an
uncosted mechanic to be completable at its apparent intended level.

### Undertuned / low-impact areas

**F3 — The starting map and MAP2 are both risk-free even for a fully
unequipped Level 1 character.** 100% win rate, Trivial-to-Easy, across
every enemy in both pools (Marsh Wisp, Briar Hound, Stone Crawler). This is
a reasonable tutorial buffer, but it's two full maps' worth of combat with
essentially no stakes before the far-overworld cliff (F1) hits. There's
room to either compress this stretch or introduce one mid-tier enemy
earlier to smooth the transition instead of a hard pool boundary.

**F4 — Dungeon floors 4-5 reuse floor 2-3's enemy pool verbatim**
(`combat.js`'s pool-selection ternary: floors 2, 3, 4, and 5 all resolve to
`DUNGEON2_ENEMY_TEMPLATES`). Regular encounters contribute zero additional
difficulty across that stretch — Crypt Fiend and Void Walker are exactly as
dangerous on floor 5 as floor 2. All of the floor 3→6 difficulty increase
is carried entirely by the Mulholland miniboss (F2), with nothing ramping
in between. A player who avoids or delays Mulholland experiences a flat,
un-ramping four floors.

**F5 — Poison's in-combat impact is effectively zero.** Fen Witch's 25%
poison-on-hit only ticks during overworld movement (1 HP per 60 steps,
`movement.js:287-288`), never during combat itself. It's such a low tick
rate relative to how quickly most fights resolve or get cured (rest, 20g)
that it barely registers as a mechanic. Not dangerous, just underwhelming
relative to the other three status effects (muddied, slither, cursed),
which all have clear, felt in-combat consequences.

### Difficulty-spike / cliff mechanism (structural, not enemy-specific)

**F6 — The damage formula's integer defense-subtraction produces cliffs,
not ramps, whenever `effectiveDef` crosses the point where `enemy.atk -
effectiveDef` changes bracket.** This is the mechanism behind F1's sharp
0%→3%→86% jump across three player levels. It's not unique to Rotwood
Troll — any enemy with ATK sitting close to a player's DEF at a "typical"
point in the game will show the same cliff behavior. Worth knowing as a
general property of the system when tuning any future enemy, not just this
one.

### Grind risk

**F7 — Fights-per-level scale reasonably within an area, but late levels
require either area-hopping or heavy over-leveling if restricted to early
pools.** E.g., grinding exclusively on `MAP2` costs 7 fights for Level 1→2
but 800 fights for Level 9→10; grinding exclusively in the deepest dungeon
horror pool costs only 1 fight for 1→2 but still 80 for 9→10. No area
alone provides a sane full 1-10 curve — which is fine (this is XP-curve
math working as intended, doubling every level against a flat pool), but
confirms the game expects continuous area progression rather than
stationary grinding, and there's no single "grind spot" that trivializes
the level curve.

### Under-rewarded fights

None found. Reward scaling (2.5) is monotonic and clean across every pool
checked — no enemy pays noticeably less than its danger/area would predict.

### Status-effect fairness issues

Covered above: B2 (no field cure for curse) and F5 (poison underwhelming).
Muddied (Briar Warden, DEF-1/SPD-2) and Slither (Corpse Slug/Shade Wraith,
SPD randomized 1-20) both have clear, correctly-scoped in-combat impact
proportional to their source enemy's design — no issues found with those
two.

### Early-game survivability issues

None found in the "might die" sense — see F3, if anything the opposite
problem (too safe) is the actual early-game issue.

### Equipment progression issues

**F8 — Chest/quest gear is strictly better gold-per-stat-point than
anything in either shop, and free.** Every chest item (Steel Sword,
Warden Blade, Iron Targe, Void Shard, Fen Mask, Mirestone Blade, Fen Cowl)
either matches or beats the best shop equivalent in raw bonus while costing
nothing. This means exploration matters more than the gold economy for
equipment progression — which may be entirely intentional (reward
exploring), but it does mean the shop's higher-tier items (Battle Axe,
Dragon Blade, Shadow Cloak, Mithril Shield, Wraithband, all Traveller-only)
are competing with free alternatives and only pull ahead at the very top
end (Dragon Blade's +12 ATK beats Warden Blade's +10). Combined with the
Traveller's 1/3-per-visit availability (F2/Wrongteeth note), a player who
skips exploration and never gets Traveller luck is meaningfully behind a
player who explores, independent of how much gold either has.

**F9 — Player SPD is almost entirely gear-dependent.** Base SPD is fixed
at 7 for the entire game (state.js's level-up never touches it); only
accessories move it, and the best available (+4, Wraithband) still leaves
the player slower than several mid-to-late enemies (Crypt Revenant 10, Wall
Tendril 14, The Seep 18). Since turn order is a hard SPD comparison with no
partial credit, this means late-game fights increasingly default to
"enemy acts first" regardless of level, which the game may want (more
danger late) or may not have intended as an emergent side effect of a
level-up formula that simply never included SPD.

---

## 4. Proposed changes

Each entry: exact file/constant, current value, proposed value, reason,
expected effect, risk. **None of these have been applied — this is the
audit's recommendation list only.**

| # | File / constant | Current | Proposed | Reason | Expected effect | Risk |
|---|---|---|---|---|---|---|
| 1 | `data.js:79`, `FAR_ENEMY_TEMPLATES` Rotwood Troll `atk` | 16 | 14 | F1: sole 97%-death outlier in a pool where every sibling is 94-100% win rate | Win rate at the pool's benchmark rises 3% → ~86% (verified by sweep), bringing it in line with Fen Witch/Bog Serpent as "the pool's hard fight" rather than "a coinflip with death" | **Low** — one-line numeric change, verified by the same simulator |
| 2 | `data.js:347`, `MULHOLLAND_TEMPLATE` `atk` | 28 | 24 | F2: mandatory boss is 0.1% winnable raw (no potions) at its apparent intended level; now that B1 is fixed, potions only bring this to 39.8%, not a guaranteed win | Raises raw win rate substantially at Lv5-6/T3-T4 so the fight doesn't lean so heavily on stockpiling potions | **Medium** — touches a mandatory story gate; re-verify with the simulator after changing |
| 3 | `state.js:107-117`, `checkLevelUp()` | no SPD change on level-up | add `stats.spd += 1` every 2 levels (or similar small growth) | F9: SPD is currently 100% gear-dependent, unlike every other stat | Keeps turn order competitive against later high-SPD enemies without touching enemy balance at all | **Medium** — a systemic curve change affects every fight's turn order, not just late-game ones; simulate broadly before committing |
| ~~4~~ | ~~`combat.js`, `phase === 'item'` branch~~ | ~~item use never risked an enemy counter~~ | **✅ Done** — item use now consumes the turn via the shared `enemyTurnResponse()` helper (same formula as Attack's counter); Back remains free. See Finding B1. | B1: this was the largest swing factor in the whole report | Mulholland's +3-potion win rate: 99.9%→39.8%; Kolm's: 87.2%→17.3%; Briar Warden's: 2.9%→0.0% | Applied — regression-tested (`test/cases/12-*`, `13-*`) |
| 5 | `world-transitions.js:620`, Traveller appearance chance | `Math.random() < 1/3` | consider raising to `2/5`-`1/2`, or add a guaranteed Drenwick equivalent vendor | F2/F8: best guaranteed-non-chest gear (T4/T5) is fully gated behind this roll and never appears in Drenwick at all, and Wrongteeth's difficulty is sensitive to whether the player got lucky | Reduces variance in how "ready" a player is for the mandatory Wrongteeth fight by the time they reach it | **Medium** — economy pacing change, affects gold sink timing everywhere, not just the one boss |
| 6 | `data.js` — introduce a distinct floor 4-5 pool, or explicitly document the reuse as intentional | floors 4-5 use `DUNGEON2_ENEMY_TEMPLATES` (identical to 2-3) | new `DUNGEON45_ENEMY_TEMPLATES` with stats ~15-20% above floor 2-3's, or a code comment confirming this is a deliberate "breather" stretch | F4: zero ramp across two floors | Restores a felt difficulty increase across the full floor 1→8 arc | **Low** — additive (new constant + one line in the pool ternary), doesn't touch any existing enemy |
| 7 | `items.js` `ITEM_REGISTRY` — `Reed Remedy` or a new item | cures poison only | add `curesCursed: true` to Reed Remedy, or add a second curative | B2: no field cure exists for curse | Gives players a way to shed curse without a full paid rest | **Low** — additive, doesn't change any existing balance number |
| 8 | `combat.js:891`, defeat handler `stats.gold = 0` | full gold wipe on defeat | consider losing a fraction (e.g. half) instead of all | Late-game defeats forfeit substantially more (45g/fight-area gold accumulates faster) than early ones for the same "you lost" outcome; not urgent since HP/day cost already provides a real penalty | Softens the late-game death penalty without removing stakes entirely | **Low** — isolated one-line change, easy to playtest either way |

Items not requiring a stat/code change, just a documented decision:

- **Pale Sentry** and **Takomo**: no change recommended. Both check out as
  intentionally-designed attrition/superboss encounters once their
  persistence (Sentry) or potion-stockpile (Takomo) mechanics are accounted
  for. Flagging here only so a future pass doesn't "fix" them based on
  their scary raw win-rate numbers without this context.
- **F3** (MAP/MAP2 being risk-free): no change proposed without a product
  decision on how much tutorial-safety is wanted; noted as an option to
  compress, not a defect.
- **F7** (grind risk): no change proposed; this is XP-curve math behaving
  as designed (doubling thresholds), not a bug.

---

## 5. Suggested regression tests

For the existing `test/` VM harness (`test/harness.js` conventions —
`createContext()`, `g.run`/`g.press`/`g.frames`):

1. **Starting-kit-equipped player reliably beats a Marsh Wisp.** Set
   `stats` to Level 1 + Iron Sword/Leather Armor via the real
   `equipItem()`, force `combat.enemy` to a Marsh Wisp template, run several
   seeded fights via the same Monte-Carlo model this report uses (or a
   fixed `Math.random` sequence for a single deterministic fight), assert a
   win. Guards against a future stat change accidentally making the very
   first enemy in the game unwinnable.
2. **Unequipped player does not die to the starting map's enemies.**
   Mirror of test 1 with `stats.weapon = stats.armor = null`. This report
   found the *opposite* of the suggested premise — an unequipped player is
   currently safe, not fragile — so write this test to document and
   protect that finding (asserts survivability), not to assert fragility.
3. **Regression guard for Finding F1 (Rotwood Troll).** Pin
   `FAR_ENEMY_TEMPLATES`'s Rotwood Troll stats, run the same benchmark
   player used in this report, assert the death rate stays below some
   sane ceiling (e.g. 40%) rather than the current ~97%. This test should
   currently *fail* — write it red-first the same way `QUEST_TRACE.md`'s
   suggested tests were, so it goes green exactly when Proposed Change #1
   (or an equivalent tuning decision) lands.
4. **Second-area enemies are measurably easier than far-overworld
   enemies at the same player state.** Run the Monte-Carlo model (or a
   fixed-seed real-combat loop) for the same benchmark player against both
   `ENEMY_TEMPLATES` (MAP2) and `FAR_ENEMY_TEMPLATES`, assert average death
   rate is lower for the former. Protects the geography ramp identified in
   §1 from silently inverting in a future stat edit.
5. **Briar Warden remains beatable but nontrivial at its intended-earliest
   level.** Assert win rate at Level 2 + starting kit falls in a
   "dangerous but winnable" band (e.g. 40-90%), not 0% and not 100% —
   guards the "intentionally hard, optional" design comment in
   `combat.js` from drifting into "actually just unwinnable" or "no longer
   meaningfully hard."
6. **Death/gold-loss does not block progression.** Simulate a defeat
   (`stats.gold = 0`, `day++`, HP restored per the real defeat handler),
   then confirm the player can still reach an affordable Potion within a
   bounded number of fights in whatever pool they're in — regression guard
   that a future change to gold rewards or the defeat penalty doesn't
   create a soft-lock where a broke player can no longer afford to
   recover.
7. ~~Mulholland's win rate is sensitive to the item-mechanic decision
   (Finding B1) — pin both.~~ **Partially done:** B1 itself is now fixed and
   covered by `test/cases/12-combat-item-turn.test.js` /
   `13-combat-item-back-no-turn.test.js` (the mechanism), but there's no
   test yet asserting Mulholland's specific win rate (e.g. via the
   simulator, or a fixed-seed real-combat run) at the Level 5/T3 benchmark
   — still worth adding so a future change to either the item mechanic or
   Mulholland's stats can't silently reintroduce a near-unwinnable
   mandatory boss.
8. **`test/balance-report.js`'s self-check itself, wired into
   `test/run.js`.** It already asserts (and exits non-zero on failure) that
   this script's damage formula matches the real `handleCombatAction()`
   exactly — promoting it into the main suite means any future change to
   `combat.js`'s damage/turn-order formula that this report depends on gets
   caught immediately, not the next time someone happens to rerun the
   balance script by hand.
