'use strict';

// combat.js — equip helpers, enemy stat templates, choice-box/shop state,
// the combat state object, all startXCombat() encounter starters, and the
// turn-resolution logic (combatOptions, applyEnemyHitEffects, observe text,
// handleCombatAction).

// ─── Enemy templates ─────────────────────────────────────────────────────────
// ─── Removal Contract quest objects ───────────────────────────────────────────
// Briar Warden — territorial fen creature denning in the hidden spring meadow
// off the Verdant Vale's NW tree nook (MEADOW_MAP; formerly dungeon floor 1's
// east passage). Stats sit between floor-1 and floor-2 enemies; no gold
// (Mault pays the reward instead).
const BRIAR_WARDEN_TEMPLATE = {
  name: 'Briar Warden', hp: 75, maxHp: 75, atk: 18, def: 5, spd: 7,
  xp: 110, goldMin: 0, goldMax: 0,
};

// ─── Smugglers' Fort combat templates ─────────────────────────────────────────
// Intentionally hard for early-game players: fight-path is optional but punishing.
const SMUGGLER_GUARD_TEMPLATE = {
  name: 'Smuggler Guard', hp: 34, maxHp: 34, atk: 12, def: 5, spd: 7,
  xp: 40, goldMin: 12, goldMax: 22,
};
const POLWICK_TEMPLATE = {
  name: 'Polwick', hp: 42, maxHp: 42, atk: 14, def: 5, spd: 6,
  xp: 52, goldMin: 20, goldMax: 35,
};
const ESSA_TEMPLATE = {
  name: 'Essa', hp: 26, maxHp: 26, atk: 11, def: 2, spd: 12,
  xp: 36, goldMin: 10, goldMax: 18,
};

// ─── Pale Sentry — fen road contract creature ─────────────────────────────────
// Spawns on MAP_N2 once sentry_quest_started. HP persists between encounters.
const PALE_SENTRY_TEMPLATE = {
  name: 'Pale Sentry', hp: 500, maxHp: 500, atk: 20, def: 10, spd: 4,
  xp: 350, goldMin: 40, goldMax: 80,
};


// ─── Equipment helpers ────────────────────────────────────────────────────────
// Maps item type to the stats slot it occupies.
function slotForType(type) {
  if (type === 'weapon')    return 'weapon';
  if (type === 'armor')     return 'armor';
  if (type === 'shield')    return 'shield';
  if (type === 'accessory') return 'accessory';
  return null;
}

function effectiveAtk() {
  return stats.atk + (stats.weapon ? stats.weapon.bonus : 0);
}

function effectiveDef() {
  return Math.max(0,
    stats.def
    + (stats.armor  ? stats.armor.bonus  : 0)
    + (stats.shield ? stats.shield.bonus : 0)
    - (hasStatusEffect('muddied') ? 1 : 0)
  );
}

// Accessories contribute a speed bonus; callers that need effective SPD use this.
function effectiveSpd() {
  if (hasStatusEffect('slither')) return slitherSpd;
  return Math.max(1,
    stats.spd
    + (stats.accessory ? stats.accessory.bonus : 0)
    - (hasStatusEffect('muddied') ? 2 : 0)
  );
}

function equipItem(item) {
  const slot = slotForType(item.type);
  if (!slot) return;                        // non-equippable type (e.g. potion)
  if (stats[slot]) stats.items.push(stats[slot]);  // bump old item to inventory
  stats[slot] = item;
  const idx = stats.items.indexOf(item);
  if (idx !== -1) stats.items.splice(idx, 1);
}

// ─── Choice box ───────────────────────────────────────────────────────────────
// Generic two-option prompt. Open by setting title/options/callbacks, then choice.open = true.
const choice = { open: false, cursor: 0, title: '', options: [], callbacks: [] };

// ─── Shop state ───────────────────────────────────────────────────────────────
const shop = { open: false, screen: 'main', cursor: 0, title: 'MERCHANT', stock: MERCHANT_STOCK };

// Returns the short stat label shown next to an item in menus
function itemStatLabel(item) {
  if (item.curesPoison)                            return 'Cures poison';
  if (item.curesCursed)                            return 'Cures cursed';
  if (item.causesMuddied && item.type === 'potion') return `HP  +${item.heals} \u2022 muddies`;
  if (item.questItem && item.type === 'potion')    return `HP  +${item.heals} \u2022 quest`;
  if (item.type === 'weapon')    return `ATK +${item.bonus}`;
  if (item.type === 'armor')     return `DEF +${item.bonus}`;
  if (item.type === 'shield')    return `DEF +${item.bonus}`;
  if (item.type === 'accessory') return `SPD +${item.bonus}`;
  if (item.type === 'potion')    return `HP  +${item.heals}`;
  return '';
}

// ─── Combat state ─────────────────────────────────────────────────────────────
const combat = {
  active:         false,
  phase:          'choose',  // 'choose' | 'item' | 'message' | 'victory' | 'defeat'
  cursor:         0,
  itemCursor:     0,
  enemy:          null,
  messageQueue:   [],
  message:        '',
  pendingVictory: false,
  pendingDefeat:  false,
  pendingEscape:  false,
  flashTimer:     0,
  fireCastTimer:  0,         // frames remaining on Polwick's fire-cast animation
  polwickHasCast: false,     // true once Polwick has cast fire this fight (first hit always casts)
  cooldown:       0,
  isBoss:         false,
  isWarden:       false,
  isFortGuard:    false,
  isFortPolwick:  false,
  isFortEssa:     false,
  isMulholland:      false,
  isPaleSentry:      false,
  isRainfish:        false,
  rainfishRemaining: 0,     // fights left in the current rainfish chain (0 = last fight)
  isDenWraith:       false,
  isSailorBrawl:     false,
  isTakomo:          false,
  is23:              false,
  observeCount:      0,
};

// Day on which Kolm was last fought (-1 = never). Resets automatically each new Dayoff.
let sailor_brawl_fight_day = -1;

// Returns the enemy-template pool that a random encounter rolled right now
// would draw from, given the CURRENT location state (inDungeon+dungeonFloor,
// inSluice, inMireVault, or else MAP_METADATA.encounterPool for the active
// map). Extracted out of startCombat() so the debug map inspector
// (render-ui.js's drawDebugInspector()) can display "current encounter
// pool" using the exact same selection the real roll uses, rather than a
// second, driftable copy of it. Does NOT cover the Pale Sentry special case
// in startCombat() (a scripted contract fight, not a pool roll) — see the
// comment there.
function currentEncounterPool() {
  return inMireVault ? MIRE_VAULT_ENEMY_TEMPLATES
    : inSluice             ? (inSluiceSealedRoom() ? SLUICE_SECRET_ENEMY_TEMPLATES : SLUICE_ENEMY_TEMPLATES)
    : inDungeon            ? (dungeonFloor === 1                    ? DUNGEON_ENEMY_TEMPLATES :
                             dungeonFloor === 2 || dungeonFloor === 3 ? DUNGEON2_ENEMY_TEMPLATES :
                             dungeonFloor === 4 || dungeonFloor === 5 ? DUNGEON2_ENEMY_TEMPLATES :
                             dungeonFloor === 6 || dungeonFloor === 7 ? DUNGEON6_ENEMY_TEMPLATES :
                             dungeonFloor === 8                       ? DUNGEON8_ENEMY_TEMPLATES :
                             DUNGEON_HORROR_ENEMY_TEMPLATES)
    : (MAP_METADATA[mapRegistryId(activeMap)] && MAP_METADATA[mapRegistryId(activeMap)].encounterPool) || ENEMY_TEMPLATES;
}

function startCombat() {
  // Pale Sentry: appears on MAP_N2 once the contract is accepted, until it is killed.
  if (activeMap === MAP_N2 && sentry_quest_started && !sentry_quest_done) {
    combat.enemy          = { ...PALE_SENTRY_TEMPLATE, hp: pale_sentry_hp };
    combat.active         = true;
    combat.phase          = 'choose';
    combat.cursor         = 0;
    combat.messageQueue   = [];
    combat.message        = 'A pale shape rises from the fen grass. It is very large.';
    combat.pendingVictory = false;
    combat.pendingDefeat  = false;
    combat.pendingEscape  = false;
    combat.flashTimer     = 8;
    combat.isPaleSentry   = true;
    combat.observeCount   = 0;
    return;
  }
  // Dungeon floors, the sluice, and Mirethyst's Vault keep their existing
  // state-flag-driven branching (inDungeon+dungeonFloor, inSluice,
  // inMireVault) rather than reading MAP_METADATA directly here: those
  // areas are stepped through via dungeonFloor/sluiceFloor counters, not a
  // 1:1 "this activeMap always means this pool" mapping the way plain
  // overworld maps are, so changing the *selection mechanism* for them
  // risked altering behaviour for no benefit -- see MAP_METADATA's header
  // comment (data.js) for the same reasoning applied to items/locationName.
  // Every plain overworld map's pool (what used to be the
  // thornmereMap/northBasinMap/farMap/activeMap===MAP ladder below) now
  // comes from MAP_METADATA.encounterPool instead -- a new outdoor map with
  // encounters needs zero changes here, just a metadata entry.
  const pool = currentEncounterPool();
  const t = pool[Math.floor(Math.random() * pool.length)];
  combat.enemy          = { ...t };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = combat.enemy.name === 'Tallyman'
    ? 'Something unfolds from the corner of the room.'
    : `A ${combat.enemy.name} appeared!`;
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  // 1-in-256 chance: override with 23
  if (Math.random() < 1 / 256) {
    const r23 = () => 23 * Math.ceil(Math.random() * 23);
    const hp = r23();
    const gA = r23(), gB = r23();
    combat.enemy = {
      name: '23',
      hp: hp, maxHp: hp,
      atk: r23(), def: r23(), spd: r23(),
      xp: r23(),
      goldMin: Math.min(gA, gB), goldMax: Math.max(gA, gB),
    };
    combat.message = '23.';
    combat.is23    = true;
  }
  combat.observeCount = 0;
}

function startRainfishCombat(remaining) {
  // remaining: how many fights still come AFTER this one (2 = first of 3, 1 = second, 0 = last)
  const intros = [
    'The last one turns on you.',      // remaining === 0
    'A second one closes in.',         // remaining === 1
    'A rainfish erupts from beneath the bank!', // remaining === 2
  ];
  combat.enemy             = { ...RAINFISH_TEMPLATE };
  combat.active            = true;
  combat.phase             = 'choose';
  combat.cursor            = 0;
  combat.messageQueue      = [];
  combat.message           = intros[Math.min(remaining, 2)];
  combat.pendingVictory    = false;
  combat.pendingDefeat     = false;
  combat.pendingEscape     = false;
  combat.flashTimer        = 8;
  combat.isRainfish        = true;
  combat.rainfishRemaining = remaining;
  combat.observeCount      = 0;
}

function endCombat() {
  // Persist Pale Sentry HP so the player can chip it down over multiple encounters.
  if (combat.isPaleSentry && combat.enemy) {
    pale_sentry_hp = Math.max(0, combat.enemy.hp);
    syncQuestFlagsToWindow();
  }
  combat.active      = false;
  combat.enemy       = null;
  combat.cooldown    = ENCOUNTER_COOLDOWN;
  combat.fireCastTimer = 0;
  combat.polwickHasCast = false;
  removeStatusEffect('burn');   // Burn is combat-only — it wears off when the fight ends.
  combat.isBoss        = false;
  combat.isWarden      = false;
  combat.isFortGuard   = false;
  combat.isFortPolwick = false;
  combat.isFortEssa    = false;
  combat.isMulholland      = false;
  combat.isPaleSentry      = false;
  combat.isRainfish        = false;
  combat.rainfishRemaining = 0;
  combat.isDenWraith       = false;
  combat.isSailorBrawl     = false;
  combat.isTakomo          = false;
  combat.is23              = false;
  combat.observeCount      = 0;
}

function startBossCombat() {
  combat.enemy          = { ...BOSS_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'Wrongteeth lurches forward!';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isBoss         = true;
  combat.observeCount   = 0;
}

function startWardenCombat() {
  combat.enemy          = { ...BRIAR_WARDEN_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'The Briar Warden turns to face you. It does not retreat.';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isWarden       = true;
  combat.observeCount   = 0;
}

function startFortGuardCombat() {
  combat.enemy          = { ...SMUGGLER_GUARD_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'The guard draws a blade. They\u2019re not playing at soldiers.';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isFortGuard    = true;
  combat.observeCount   = 0;
}

function startFortPolwickCombat() {
  combat.enemy          = { ...POLWICK_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'Polwick lunges forward\u2014 faster than he looked.';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isFortPolwick  = true;
  combat.polwickHasCast = false;   // first hit of the fight always casts fire
  combat.observeCount   = 0;
}

function startFortEssaCombat() {
  combat.enemy          = { ...ESSA_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'Essa throws herself at you\u2014 she has nothing left to lose.';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isFortEssa     = true;
  combat.observeCount   = 0;
}

function startMulhollandCombat() {
  combat.enemy          = { ...MULHOLLAND_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'Mulholland turns. What it registers is not fear.';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isMulholland   = true;
  combat.observeCount   = 0;
}

function startDenWraithCombat() {
  combat.enemy          = { ...DEN_WRAITH_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'Something shifts in the corner. It has been waiting.';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isDenWraith    = true;
  combat.observeCount   = 0;
}

function startSailorBrawlCombat() {
  combat.enemy          = { ...SAILOR_BRAWLER_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'Kolm throws the first punch before you are ready.';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isSailorBrawl  = true;
  combat.observeCount   = 0;
}

function startTakomoCombat() {
  combat.enemy          = { ...TAKOMO_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'The heat in here is not from the walls.';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isTakomo       = true;
  combat.observeCount   = 0;
}

// Clears and re-populates JOB_BOARD_NOTICES (Calwick) and DRENWICK_JOB_BOARD_NOTICES
// based on current quest state. Call whenever a relevant quest flag changes, and once on loadGame().
function refreshJobBoard() {
  JOB_BOARD_NOTICES.length = 0;
  DRENWICK_JOB_BOARD_NOTICES.length = 0;

  // ── Calwick board ────────────────────────────────────────────────────────────
  // Schilling the Bear
  if (day >= 2 && !schilling_returned) {
    JOB_BOARD_NOTICES.push(
      schilling_quest_started
        ? 'MISSING \u2014 IN PROGRESS. Child\u2019s toy bear, Schilling. Last seen east dungeon.'
        : 'MISSING \u2014 child\u2019s toy bear, name Schilling, believed taken into the east dungeon by a large creature. Child at the schoolhouse. Please return if recovered. \u2014 Bram, Schoolhouse, Calwick.'
    );
  }
  // Briar Warden removal contract — posted a few days in (day 5+), matching
  // Overseer Mault's appearance in the square (npcs.js getter)
  if (sluice_reward_given && day >= 5 && !warden_quest_rewarded) {
    JOB_BOARD_NOTICES.push(
      warden_quest_started
        ? 'REMOVAL CONTRACT \u2014 IN PROGRESS. Briar Warden, spring meadow, northwest corner of the vale. Report to Overseer Mault on completion.'
        : 'REMOVAL CONTRACT. A Briar Warden has been confirmed denning in the overgrown spring meadow at the vale\u2019s far northwest corner (entrance grown over \u2014 push through the grass in the top-left tree nook). Fee: 120 gold, payable on confirmed removal. Report to Overseer Mault, main square. \u2014 District Infrastructure Office, Calwick.'
    );
  }
  // Den Wraith — Unoccupied Property (appears from day 11, hidden once rewarded)
  if (day >= 11 && !den_wraith_rewarded) {
    JOB_BOARD_NOTICES.push(
      den_wraith_defeated
        ? 'INFESTATION \u2014 CLEARED. Unoccupied property, 9 West Ward. Collect fee from Morden, district properties, main square.'
        : den_wraith_quest_started
          ? 'INFESTATION \u2014 IN PROGRESS. Unoccupied property, 9 West Ward. Report to Morden on completion.'
          : 'INFESTATION NOTICE \u2014 An entity has been confirmed in the unoccupied property at 9 West Ward, Calwick. Entry authorized Dayoff only. Fee: 200 gold on confirmed clearance. Report to Morden, district properties, main square.'
    );
  }

  // ── Drenwick board ───────────────────────────────────────────────────────────
  // The Weight Discrepancy — visible until completed (stage 4)
  if (weight_quest_stage < 4) {
    DRENWICK_JOB_BOARD_NOTICES.push(
      weight_quest_stage === 0
        ? 'CARGO QUERY \u2014 Harbormaster Renn, Drenwick Waterfront, requires a neutral party to resolve a weight discrepancy with the Calwick district office. Small fee on completion. Report directly to the harbormaster\u2019s office, Drenwick.'
        : 'CARGO QUERY \u2014 IN PROGRESS. Weight discrepancy between Drenwick and Calwick records. Report to Harbormaster Renn on resolution.'
    );
  }
  // The Pale Sentry — visible until quest is done
  if (!sentry_quest_done) {
    DRENWICK_JOB_BOARD_NOTICES.push(
      sentry_quest_started
        ? 'REMOVAL NOTICE \u2014 IN PROGRESS. Pale creature, fen road northeast of Drenwick. Report to Constable Tarvec, Drenwick Guard Post, on confirmed removal.'
        : 'REMOVAL NOTICE \u2014 A large pale creature has been sighted on the fen road northeast of Drenwick, near the blocked crossing. Contract fee offered for confirmed removal. Report to Constable Tarvec, Drenwick Guard Post.'
    );
  }
  // Still Water — sickle quest (stage 0: posting visible; stage 1-3: in progress; stage 4: done, hidden)
  if (sickle_quest_stage < 4) {
    DRENWICK_JOB_BOARD_NOTICES.push(
      sickle_quest_stage === 0
        ? 'LOST TOOL \u2014 A fen sickle, iron-bladed, lost two seasons ago at the north bank of the bog pond near the Northern Fen hamlet. Personal value. Fee offered for recovery. Inquire at the hamlet, north fen road. \u2014 Mabel, Northern Fen Hamlet.'
        : 'LOST TOOL \u2014 IN PROGRESS. Fen sickle, north bog pond bank.'
    );
  }
}

function advanceCombatMessage() {
  if (combat.messageQueue.length > 0) {
    const next = combat.messageQueue.shift();
    if (typeof next === 'string') {
      combat.message = next;
    } else {
      // { text, apply } — run the side-effect first, then show the text
      if (next.apply) next.apply();
      combat.message = next.text;
    }
  }
  // Resolve phase once the last message has been acknowledged
  if (combat.messageQueue.length === 0) {
    if (combat.pendingEscape)      endCombat();
    else if (combat.pendingVictory) combat.phase = 'victory';
    else if (combat.pendingDefeat) combat.phase = 'defeat';
    else                           combat.phase = 'choose';
  }
}

// ─── Observe: combat action helpers ──────────────────────────────────────────

// Returns the ordered list of action IDs for the combat choose phase.
// Navigation and draw both use this so cursor math stays consistent.
function combatOptions() {
  return ['attack', 'item', 'observe', 'run'];
}

// Status-effect side-effects applied whenever an enemy lands a hit.
// Extracted from inside handleCombatAction so the Observe path can reuse it.
function applyEnemyHitEffects() {
  if (combat.isWarden && !hasStatusEffect('muddied') && Math.random() < 0.30) {
    addStatusEffect('muddied');
    combat.messageQueue.unshift('The Warden\u2019s blow leaves you fouled with marsh muck. Muddied! (DEF\u22121, SPD\u22122)');
  }
  if (combat.enemy && combat.enemy.name === 'Corpse Slug' && !hasStatusEffect('slither') && Math.random() < 0.30) {
    triggerSlither();
    combat.messageQueue.unshift('The slug\u2019s slime soaks in. Slithered! (SPD randomized each turn)');
  }
  if (combat.enemy && combat.enemy.name === 'Shade Wraith' && !hasStatusEffect('slither') && Math.random() < 0.25) {
    triggerSlither();
    combat.messageQueue.unshift('The wraith\u2019s touch scrambles your footing. Slithered! (SPD randomized each turn)');
  }
  if (combat.enemy && combat.enemy.name === 'Fen Witch' && !hasStatusEffect('poison') && Math.random() < 0.25) {
    triggerPoison();
    combat.messageQueue.unshift('The hag\u2019s curse seeps in. Poisoned! (lose HP each rest)');
  }
  // Polwick — a firelit rareborn. When he lands a blow and the player isn't
  // already alight, he flares his hand into flame: a burst of scorch damage on
  // top of the hit, plus the Burn status (0..20 HP each following turn). His
  // FIRST hit of the fight always casts — he opens with the showpiece — and
  // later hits re-ignite at 50% once the burn has worn off. The cast kicks
  // off a short fire animation (see drawFireCast).
  if (combat.isFortPolwick && !hasStatusEffect('burn') &&
      (!combat.polwickHasCast || Math.random() < 0.5)) {
    combat.polwickHasCast = true;
    triggerBurn();
    combat.fireCastTimer = FIRE_CAST_FRAMES;
    const scorch = 4 + Math.floor(Math.random() * 5);   // 4..8 immediate fire damage
    stats.hp = Math.max(0, stats.hp - scorch);
    combat.messageQueue.unshift(
      `Polwick's hand bursts into flame— a gout of fire scorches you for ${scorch}! Burning!`
    );
    if (stats.hp <= 0 && !combat.pendingDefeat) {
      combat.messageQueue.push(`${stats.name} has fallen...`);
      combat.pendingDefeat = true;
    }
  }
  if (combat.enemy && combat.enemy.curseChance && !hasStatusEffect('cursed') && Math.random() < combat.enemy.curseChance) {
    if (stats.accessory && stats.accessory.preventsCursed) {
      combat.messageQueue.unshift('The amethyst bangle flares faintly. The curse doesn\u2019t take.');
    } else {
      triggerCursed();
      const curseMsg = combat.enemy.name === 'Den Wraith'
        ? 'The Den Wraith\u2019s wail settles into your bones. Cursed!'
        : 'Something unravels. Cursed!';
      combat.messageQueue.unshift(curseMsg);
    }
  }
}

// How long Polwick's fire-cast animation plays, in frames (~0.75s at 60fps).
const FIRE_CAST_FRAMES = 45;

// Burn — a combat-only damage-over-time. Returns a deferred message-queue entry
// (or null when the player isn't burning) to append at the END of a turn that
// consumes an action, so the sear resolves after the enemy has acted. The
// random 0..20 roll is fixed when the entry is built but only applied when its
// message is shown. Evaluated at message-build time, so on the very turn Burn
// is first inflicted (which happens later, inside the enemy hit's deferred
// apply) this returns null — the first tick lands on the following turn.
function burnTickEntry() {
  if (!hasStatusEffect('burn')) return null;
  const burnDmg = Math.floor(Math.random() * 21);   // 0..20 inclusive
  return {
    text: burnDmg > 0
      ? `The burn sears ${stats.name} for ${burnDmg}!`
      : 'The burn smoulders, but does no damage this turn.',
    apply() {
      if (stats.hp <= 0) return;   // player already fell this turn — don't double up
      if (burnDmg > 0) {
        stats.hp = Math.max(0, stats.hp - burnDmg);
        if (stats.hp <= 0 && !combat.pendingDefeat) {
          combat.messageQueue.push(`${stats.name} has fallen...`);
          combat.pendingDefeat = true;
        }
      }
    },
  };
}

// The enemy's response to a player turn that didn't itself fight the enemy
// (currently: using an item). Same damage formula and status/defeat handling
// as Attack's counter-attack — an item-using turn is still a turn, so the
// enemy still gets to act. textFn receives the rolled damage and returns the
// message line; returns a deferred { text, apply() } queue entry, the same
// shape every other enemy hit in this file uses.
function enemyTurnResponse(textFn) {
  const atkRoll = combat.enemy.atk * (0.8 + Math.random() * 0.4);
  const eDmg    = Math.max(1, Math.round(atkRoll - effectiveDef()));
  return {
    text: textFn(eDmg),
    apply() {
      stats.hp = Math.max(0, stats.hp - eDmg);
      applyEnemyHitEffects();
      if (stats.hp <= 0) {
        combat.messageQueue.push(`${stats.name} has fallen...`);
        combat.pendingDefeat = true;
      }
    },
  };
}

// Custom observation text keyed by enemy name. Each entry is an array of
// { lines: string[] } objects ordered by observation count (0 = first).
// First entry: practical tactical info. Later entries: behavior, ecology, lore.
const ENEMY_OBSERVATIONS = {
  // ── Overworld enemies ───────────────────────────────────────────────────────
  'Marsh Wisp': [
    { lines: ['It pulses between visible and not-visible.', 'Low HP. Light attack. Moderate speed.', 'Should go down quickly.'] },
    { lines: ['It doesn\u2019t breathe. It doesn\u2019t blink.', 'Something in the marsh is animating it — the wisp itself seems incidental.'] },
    { lines: ['It keeps its distance unless it senses the attack window.', 'Lore holds that marsh wisps are navigation lights gone wrong.', 'Nobody believes that anymore.'] },
  ],
  'Stone Crawler': [
    { lines: ['High defense. Low attack. Very slow.', 'It sometimes braces, halving the damage it takes.', 'Patience works. High burst less so.'] },
    { lines: ['It moves like something that has learned patience by necessity.', 'The shell is not decorative. It uses it deliberately.'] },
    { lines: ['You can see the seams in the plating now.', 'They don\u2019t look like weak points. They look like they were designed not to be.'] },
  ],
  'Briar Hound': [
    { lines: ['Fast. Hits harder than expected.', 'Light armor — won\u2019t hold together long.', 'It wants you reactive. Stay ahead of it.'] },
    { lines: ['Pack hunter, but alone right now.', 'That should bother it. It doesn\u2019t seem to.'] },
    { lines: ['The briar in its coat isn\u2019t parasitic. It grows from the hound itself.', 'Fen phenomenon. Nobody\u2019s explained it satisfactorily.'] },
  ],
  // ── Dungeon floor 1 ────────────────────────────────────────────────────────
  'Bone Guard': [
    { lines: ['Heavily armored. Slow. Occasionally braces.', 'High defense means you\u2019ll be chipping. Plan for a long fight.'] },
    { lines: ['It was stationed here. Not summoned \u2014 stationed.', 'Whatever authority put it here stopped existing centuries ago.', 'It hasn\u2019t been informed.'] },
    { lines: ['The armor is integrated. Not worn.', 'You\u2019re not sure there is anything underneath it.'] },
  ],
  'Shade Wraith': [
    { lines: ['Very fast. Hits hard. Fragile.', 'It will almost always strike first.', 'A quick kill is your best option.'] },
    { lines: ['It doesn\u2019t have a fixed form. It\u2019s using the shape because it\u2019s useful.', 'It notices you watching.'] },
    { lines: ['The slithering effect it triggers isn\u2019t a weapon in the usual sense.', 'It\u2019s closer to contamination.', 'The footing problem lingers after it\u2019s gone.'] },
  ],
  // ── Dungeon floors 2–5 ─────────────────────────────────────────────────────
  'Crypt Fiend': [
    { lines: ['Massive HP. High defense. Slow. Hits very hard.', 'It\u2019s going to outlast most approaches.', 'You\u2019ll need either strong offense or strong healing.'] },
    { lines: ['The rot isn\u2019t damage to it. It\u2019s part of the structure.', 'It is not decaying. It was built this way.'] },
    { lines: ['It swings like it\u2019s compensating for something missing.', 'A full arm, maybe. Or the understanding that you\u2019re smaller than the threat register says.'] },
  ],
  'Void Walker': [
    { lines: ['Devastating attack. Light armor.', 'Has a chance to curse you each time it lands a hit.', 'Kill it before it kills you.'] },
    { lines: ['It doesn\u2019t leave footprints.', 'You\u2019ve been watching and you can\u2019t explain why.'] },
    { lines: ['The void-touch comes from whatever passes for its hands.', 'The curse isn\u2019t hostile, exactly. It\u2019s just what it carries.'] },
  ],
  // ── Far map enemies (MAP3 / MAP_N1 / MAP_N2) ───────────────────────────────
  'Fen Lurker': [
    { lines: ['High speed. Solid attack. Moderate HP.', 'Ambush predator \u2014 it will strike first almost every time.', 'Keep your guard up early.'] },
    { lines: ['It\u2019s been watching you since you entered this tile.', 'The movement you thought was reeds was it.'] },
    { lines: ['It hunts by stillness first, then speed.', 'You interrupted the stillness phase.', 'That\u2019s why it\u2019s irritated.'] },
  ],
  'Rotwood Troll': [
    { lines: ['Very high HP. High defense. Very slow. Hits hard.', 'A war of attrition. It will win a short fight.', 'You need to outlast it \u2014 or overwhelm it fast.'] },
    { lines: ['The rot in the wood is what holds it together, not what\u2019s breaking it down.', 'Old fen biology. It\u2019s been here longer than the surveying commission.'] },
    { lines: ['It regenerates if you let it rest.', 'Not quickly. But noticeably.', 'Don\u2019t let it rest.'] },
  ],
  'Thornback': [
    { lines: ['Very high defense. Moderate attack. Slow.', 'It may brace. Your attacks are going to bounce.', 'Sustained pressure over speed.'] },
    { lines: ['The spines on the dorsal ridge are not for display.', 'They\u2019ve been used. Frequently.'] },
    { lines: ['It has no particular interest in you. This isn\u2019t personal.', 'That doesn\u2019t make it less dangerous.'] },
  ],
  'Fen Witch': [
    { lines: ['Devastating attack. Very fragile. Moderate speed.', 'She will poison you if she hits. Avoid letting her land shots.', 'Glass cannon. End it quickly.'] },
    { lines: ['The curse she carries isn\u2019t from a ritual. It\u2019s older than that.', 'The fen gave it to her. She\u2019s been augmenting it since.'] },
    { lines: ['She\u2019s been out here long enough that the boundary between her and the marsh is approximate.', 'She doesn\u2019t seem to notice.'] },
  ],
  'Bog Serpent': [
    { lines: ['High HP. Moderate attack. Good speed.', 'It can strike before you can.', 'Durable. Don\u2019t expect a quick win.'] },
    { lines: ['It surfaces specifically to attack. Between combats it stays under.', 'The mud here is warm where it\u2019s been resting.'] },
    { lines: ['Bog serpents in this range can go weeks without eating.', 'It\u2019s not hungry.', 'It\u2019s territorial.'] },
  ],
  // ── Thornmere ──────────────────────────────────────────────────────────────
  'Corpse Slug': [
    { lines: ['Massive HP. High defense. Extremely slow.', 'Its slime scrambles your footing when it hits.', 'Kill it before the movement penalty accumulates.'] },
    { lines: ['It\u2019s been here longer than the trail markers.', 'The pale colour isn\u2019t disease \u2014 nothing photosensitive survives this far into the shallows.'] },
    { lines: ['The slime it leaves is technically a byproduct, not a weapon.', 'The distinction matters less when you can\u2019t stand straight.'] },
  ],
  // ── East Sluice ────────────────────────────────────────────────────────────
  'Reed Grappler': [
    { lines: ['Armored shell. Moderate attack. Average speed.', 'It occasionally braces \u2014 don\u2019t waste a heavy hit during that.'] },
    { lines: ['Freshwater crustacean. Canal-native, not fen-native.', 'It followed the drainage channels in and hasn\u2019t left.'] },
    { lines: ['The shell is thickest on the dorsal and flank plates.', 'The joint gaps are less protected.', 'You already knew that, instinctively.'] },
  ],
  'Silt Lurker': [
    { lines: ['Very fast. High attack. Extremely fragile.', 'It erupts from canal mud \u2014 almost always strikes first.', 'Don\u2019t give it a second shot.'] },
    { lines: ['It doesn\u2019t pursue. One ambush, then it resets.', 'If you survive the first strike, the balance shifts.'] },
    { lines: ['The silt it comes from is cold.', 'It\u2019s been waiting in it for something roughly your size.', 'You qualify.'] },
  ],
  // ── The North Basin — Silt Flats ───────────────────────────────────────────
  'Silt Crab': [
    { lines: ['Slow. Shelled. Occasionally braces.', 'Not dangerous on its own \u2014 the shell just means it takes longer than it should.'] },
    { lines: ['It was probably living here when there was still enough water to hide in.', 'It didn\u2019t relocate. It just got shallower.'] },
    { lines: ['The stranding doesn\u2019t seem to bother it.', 'It\u2019s had time to get used to worse.'] },
  ],
  'Mudflat Strider': [
    { lines: ['Fast. Fragile.', 'Not much of a threat once it\u2019s hit.', 'It\u2019s not built for a fight. It\u2019s built for not needing one.'] },
    { lines: ['Long-legged, built for walking mud without sinking.', 'The exposed flats haven\u2019t hurt it. If anything, there\u2019s more ground to work now.'] },
    { lines: ['It probes for things buried just under the surface.', 'You\u2019re not what it\u2019s looking for.', 'It\u2019s still going to try.'] },
  ],
  // ── Dungeon floors 6–7 ─────────────────────────────────────────────────────
  'Hollow': [
    { lines: ['Very high defense. Heavy attack. Moderate speed.', 'It braces occasionally.', 'It will outlast a reactive strategy. You need to push first.'] },
    { lines: ['The shell is not empty. Something minimal is animating it.', 'The original occupant is not in evidence.'] },
    { lines: ['It doesn\u2019t seem to notice damage unless the threshold is significant.', 'Below that threshold, it just keeps moving.'] },
  ],
  'Fen Shade': [
    { lines: ['Very high attack. Light armor. Good speed.', 'Spectral remnant \u2014 fast and devastating.', 'First-strike risk is high. Hit hard and early.'] },
    { lines: ['It seeped down from the wetlands above through the drainage cracks.', 'The dungeon environment has not improved its temperament.'] },
    { lines: ['The form it\u2019s holding isn\u2019t its original one.', 'Whatever it looked like before is gone.', 'This is what the fen left behind.'] },
  ],
  // ── Dungeon floor 8 ────────────────────────────────────────────────────────
  'Tomb Sentry': [
    { lines: ['Enormous HP. Extreme defense. Very slow.', 'Braces frequently.', 'This is going to take a long time. Prepare for sustained attrition.'] },
    { lines: ['It was petrified and then reanimated. In that order.', 'The original internment was voluntary.', 'The reanimation was not.'] },
    { lines: ['The brace is not a response to threat assessment.', 'It\u2019s a fixed-interval behaviour. You can predict it if you pay attention.'] },
  ],
  'Crypt Revenant': [
    { lines: ['Very high attack. Moderate defense. High speed.', 'Fast and savage. It strikes first.', 'Offensive pressure is the only viable strategy.'] },
    { lines: ['Buried twice, based on the markings. The second burial didn\u2019t take either.', 'The stonework on these walls is notably recent compared to the surrounding chambers.'] },
    { lines: ['It isn\u2019t angry. It doesn\u2019t have enough coherence left for anger.', 'It\u2019s just motion and damage, continuously.'] },
  ],
  // ── Horror branches ────────────────────────────────────────────────────────
  'Wall Tendril': [
    { lines: ['Extreme attack. Very fragile. Very fast.', 'It will almost always go first and hit catastrophically.', 'You need to kill it in one or two hits, or this will go badly.'] },
    { lines: ['It grows from the wall itself. There is no discrete body to target.', 'You\u2019re damaging a part of something larger and being targeted by a different part.'] },
    { lines: ['It doesn\u2019t bleed. The fluid it exudes when struck is not blood.', 'You don\u2019t want to think too hard about what it is.'] },
  ],
  'Dripping Maw': [
    { lines: ['Massive HP. Heavy attack. Slow.', 'It forms in the ceiling and drops acid.', 'You have time between strikes. Use it.'] },
    { lines: ['It\u2019s not a separate creature. It is a feature of this branch.', 'The ceiling is part of whatever this place has become.'] },
    { lines: ['The acid isn\u2019t random. It\u2019s targeted.', 'Something with a mouth has preferences.', 'You are currently one of them.'] },
  ],
  'The Seep': [
    { lines: ['Catastrophic attack. No defense. Extreme speed.', 'No armor whatsoever.', 'It hits first. It hits very hard. Kill it before it kills you.'] },
    { lines: ['It doesn\u2019t have a fixed form. It\u2019s using mass instead of structure.', 'The floor in here is wet from something that is neither water nor blood.'] },
    { lines: ['It doesn\u2019t strategize. It maximizes contact.', 'You are currently something it wants to maximize contact with.', 'Keep moving.'] },
  ],
  // ── Mirethyst\u2019s Vault ────────────────────────────────────────────────────────
  'Pale Drowned': [
    { lines: ['Fast. Light armor. Fragile.', 'Spectral fen victim \u2014 it will strike first.', 'Should collapse quickly if you go offensive.'] },
    { lines: ['The fen took someone and left this.', 'It doesn\u2019t remember what happened. It just knows this place.'] },
    { lines: ['The pale colouring is fen-water saturation. The shape is what\u2019s left of what it was.', 'It doesn\u2019t seem to recognise what it\u2019s becoming.'] },
  ],
  'Silt Hag': [
    { lines: ['High attack. Moderate defense. Very slow.', 'Bog-curse made solid. Heavy hits but easy to dodge with speed.', 'Stay ahead of its turn order.'] },
    { lines: ['It condenses from the silt where the vault floor meets the water.', 'This is apparently where it\u2019s supposed to be.'] },
    { lines: ['It doesn\u2019t decompose between encounters.', 'It disperses into the silt and reforms.', 'You\u2019re not sure which state is the real one.'] },
  ],
  // ── Rainfish ───────────────────────────────────────────────────────────────
  'Rainfish': [
    { lines: ['Extremely fast. Fragile.', 'You can\u2019t run \u2014 the school is all around you.', 'Hit hard and fast. Every one you leave standing is another problem.'] },
    { lines: ['They\u2019re not attacking out of hunger. You\u2019re in their space.', 'The disturbance at the bank triggered this.'] },
    { lines: ['Rainfish school defensively, not offensively.', 'They\u2019ve decided you\u2019re a threat to the school and the school agrees.', 'No negotiating that.'] },
  ],
  // ── Special encounters ─────────────────────────────────────────────────────
  'Kolm': [
    { lines: ['Strong. Well-rested. He fights for fun.', 'Solid defense. Moderate speed.', 'He\u2019s not going to make a mistake. You\u2019ll have to make him.'] },
    { lines: ['He\u2019s done this enough times that he\u2019s stopped counting the fights.', 'That\u2019s either a good sign or a very bad one.'] },
    { lines: ['He adjusts between exchanges. He\u2019s watching you the same way you\u2019re watching him.', 'He nods slightly when he notices you observing.', 'Professional courtesy.'] },
  ],
  'Smuggler Guard': [
    { lines: ['Trained. Moderate attack and defense.', 'This is a job to them, not a conviction.', 'They\u2019ll fight hard but they\u2019re not going to die for Polwick.'] },
    { lines: ['They didn\u2019t choose this posting. You can see it in how they stand.', 'That doesn\u2019t change the blade in their hand.'] },
    { lines: ['They\u2019re watching for you to hesitate.', 'Don\u2019t give them the window.'] },
  ],
  'Polwick': [
    { lines: ['Fast. Strong. He\u2019s been waiting for this.', 'Better than the guard. He\u2019s fought his way into this position.', 'Firelit \u2014 he\u2019ll set you alight if he gets a hand on you. Watch for the burn.'] },
    { lines: ['He runs the fort through intimidation and performance.', 'This is both.', 'He needs you to lose visibly.'] },
    { lines: ['His form is good. He trained somewhere.', 'The fire is rareborn, not trained \u2014 firelit, like the fen brewers warn about.', 'He\u2019s also been drinking, which complicates reading him.'] },
  ],
  'Essa': [
    { lines: ['Fast. Fragile. Desperate.', 'She has nothing left to lose here.', 'Desperate fighters are unpredictable. End it cleanly.'] },
    { lines: ['Whatever she was doing at the fort, she believed in it.', 'That\u2019s enough to make someone dangerous even when they\u2019re losing.'] },
    { lines: ['She\u2019s not fighting to win. She\u2019s fighting because stopping feels worse.', 'You understand that.', 'End it before either of you has to think about it further.'] },
  ],
  'Briar Warden': [
    { lines: ['Durable. Strong. Moderate speed.', 'It will Muddy you if it connects \u2014 that penalty stacks badly.', 'Avoid taking hits. Easier said.'] },
    { lines: ['It grew out of the fen ecology, not into it.', 'The briars are structural. It doesn\u2019t stop growing.'] },
    { lines: ['It doesn\u2019t consider this a conflict.', 'You are an obstacle in its territory.', 'It is responding to an obstacle.'] },
  ],
  'Pale Sentry': [
    { lines: ['Extraordinary HP. Very high defense. Slow.', 'This fight will not end today.', 'Hit it, get out, come back. Chip it down.'] },
    { lines: ['It rose from the fen grass and has not left.', 'The contract from the board doesn\u2019t say what made it.', 'Whatever did, they were not modest about it.'] },
    { lines: ['It takes damage. You\u2019ve confirmed that.', 'It doesn\u2019t react to damage.', 'Those are different things.'] },
  ],
  'Den Wraith': [
    { lines: ['Moderate HP. High speed. Curse risk every time it hits you.', 'Do not let it land multiple hits.', 'It waits in corners. It doesn\u2019t patrol.'] },
    { lines: ['The house absorbed something and didn\u2019t let go.', 'Whatever the den wraith was before it settled here has been replaced by what the house made it into.'] },
    { lines: ['The curse it carries is not deliberate.', 'It just carries it.', 'The distinction doesn\u2019t help with the symptoms.'] },
  ],
  'Mulholland': [
    { lines: ['Wrong proportions. Heavy attack. High defense. Slow.', 'It registers you as a threat at threshold distance.', 'That threshold is shorter than expected for this size.'] },
    { lines: ['The angles on it are wrong. Not injured \u2014 wrong.', 'Assembled from several separate things. Not carefully.'] },
    { lines: ['It doesn\u2019t move the way a large creature should.', 'The joints are approximate.', 'It\u2019s compensating and you can\u2019t tell what for.'] },
  ],
  'Wrongteeth': [
    { lines: ['Boss. High HP. Heavy attack. Moderate defense and speed.', 'There are others like it ahead, according to what it said.', 'It fights seriously. So should you.'] },
    { lines: ['It\u2019s been down here a long time.', 'One eye large, one eye small.', 'Neither is entirely human.'] },
    { lines: ['It doesn\u2019t want to be here either.', 'You\u2019re both stuck in this.', 'That doesn\u2019t make it easier.'] },
  ],
  'Takomo': [
    { lines: ['High attack. Moderate defense. Moderate speed.', 'The heat in here is worse when he\u2019s focusing.', 'He\u2019s focused.'] },
    { lines: ['He came here voluntarily. That makes him different from most of what\u2019s in the dungeon.', 'Whatever he was looking for in this chamber, he found it. Then he stayed.'] },
    { lines: ['He fights like someone who has practiced this specific fight for years.', 'Possibly because he has.', 'He doesn\u2019t look like he needs to win. Just to see how far you get.'] },
  ],
};

// Returns observation text for the current enemy and observe count.
// Falls back to stat-derived traits on first look, then to a generic line.
function getObservationText(enemy, count) {
  const entries = ENEMY_OBSERVATIONS[enemy.name];
  if (entries && count < entries.length) return entries[count].lines;
  if (count === 0) {
    // Stat-derived fallback for enemies without a custom entry.
    const traits = [];
    if (enemy.spd  >= 10)                            traits.push('Fast.');
    else if (enemy.spd  <=  3)                        traits.push('Slow.');
    if (enemy.def  >=  8)                             traits.push('Armored.');
    else if (enemy.def  <=  1 && enemy.hp <= 30)      traits.push('Fragile.');
    if (enemy.atk  >= 20)                             traits.push('Hits hard.');
    if (enemy.defendChance)                           traits.push('May brace.');
    if (enemy.curseChance)                            traits.push('Curse risk.');
    const line2 = traits.length > 0 ? traits.join(' ') : 'Nothing obvious stands out.';
    return ['L\u00e9l\u00fd watches carefully.', line2];
  }
  return ['L\u00e9l\u00fd watches for another opening, but learns nothing new.'];
}

function handleCombatAction() {
  if (combat.phase === 'message') { advanceCombatMessage(); return; }
  if (combat.phase === 'victory') {
    if (combat.isRainfish) {
      if (combat.rainfishRemaining > 0) {
        // Chain the next rainfish fight after a brief interstitial.
        const nextRemaining = combat.rainfishRemaining - 1;
        endCombat();
        dialogue.name  = '';
        dialogue.pages = [[ nextRemaining === 1 ? 'Another one follows.' : 'One more.' ]];
        dialogue.callbacks = [function() { startRainfishCombat(nextRemaining); }];
        dialogue.open  = true;
        dialogue.page  = 0;
      } else {
        // All three rainfish defeated — aftermath narrative.
        endCombat();
        dialogue.name  = '';
        dialogue.pages = [
          ['The last rainfish spirals down into the silt.',
           'The water is completely opaque with mud.'],
          ['You can still make out the sickle handle jutting from the reeds.'],
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
      }
      return;
    }
    if (combat.isBoss) {
      BOSS.knockedDown = true;
      endCombat();
      dialogue.name  = 'Wrongteeth';
      dialogue.pages = [
        ['\u2026',
         'Wrongteeth has stopped moving.',
         'It is lying on the ground. Its enormous chest is heaving.'],
        ['\u201cplease.\u201d',
         '\u201ci am hurt.\u201d'],
        ['\u201ci want my mum.\u201d',
         '\u201ci want my dad.\u201d'],
        ['\u2026',
         'One huge eye. One tiny eye.',
         'Both looking at you.',
         '\u201ccan you\u2026 can you hold me.\u201d'],
      ];
      dialogue.open = true;
      dialogue.page = 0;
      return;
    }
    if (combat.isDenWraith) {
      DEN_WRAITH.defeated = true;
      den_wraith_defeated = true;
      syncQuestFlagsToWindow();
      refreshJobBoard();
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [
        ['The wraith collapses inward.', 'The room is quiet. Cold, but quiet.'],
        ['Find Morden in the Calwick main square to collect the fee.'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return;
    }
    if (combat.isSailorBrawl) {
      sailor_brawl_fight_day = day;
      stats.gold += 100; // 50g stake returned + 50g from Kolm
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [
        ['Kolm goes down hard.',
         'The inn goes quiet for a moment.',
         'Then someone starts laughing.'],
        ['He surfaces from the floor, grinning.',
         '\u201cFair enough.\u201d',
         'He counts out fifty gold and slaps it on the table. You have the fifty you staked back, too.'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return;
    }
    if (combat.is23) {
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [['23 dissolves.', 'You are not sure what happened.', 'You are not sure it was meant to be fought.']];
      dialogue.open  = true;
      dialogue.page  = 0;
      return;
    }
    if (combat.isMulholland) {
      MULHOLLAND.defeated = true;
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [
        ['Mulholland is still.',
         'It did not fall the way things fall.',
         'More like it simply stopped being upright.'],
        ['The passage to the stairs below is open.',
         'There is no ceremony to it.',
         'You step around the body.'],
      ];
      dialogue.open = true; dialogue.page = 0;
      return;
    }
    if (combat.isTakomo) {
      TAKOMO.defeated = true;
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [
        ['Takomo drops to one knee.',
         'The heat in the chamber breaks — not gone, just\u2026 less.',
         'Whatever was feeding it has gone quiet.'],
        ['He stays down.',
         'You stand in the dark for a moment, unsure what to do with that.',
         'Then you leave.'],
      ];
      dialogue.open = true; dialogue.page = 0;
      return;
    }
    if (combat.isWarden) { warden_quest_defeated = true; refreshJobBoard(); }
    if (combat.isFortGuard) {
      fort_quest_stage = 2;
      syncQuestFlagsToWindow();
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [[
        'Polwick steps over the body.',
        '\u201cYou\u2019re tougher than you look.\u201d',
        'He comes at you himself.',
      ]];
      dialogue.triggerFortPolwickCombat = true;
      dialogue.open = true; dialogue.page = 0;
      return;
    }
    if (combat.isFortPolwick) {
      fort_quest_stage = 3;
      syncQuestFlagsToWindow();
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [[
        'Essa looks toward the exit.',
        'You\u2019re between her and the door.',
        'She raises her fists.',
      ]];
      dialogue.triggerFortEssaCombat = true;
      dialogue.open = true; dialogue.page = 0;
      return;
    }
    if (combat.isFortEssa) {
      fort_quest_stage = 4;
      smugglers_dead   = true;
      syncQuestFlagsToWindow();
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [[
        'The fort is still.',
        'No one is left standing.',
        'You can report back to your supervisor.',
      ]];
      dialogue.open = true; dialogue.page = 0;
      return;
    }
    if (combat.isPaleSentry) {
      sentry_quest_done = true;
      pale_sentry_hp    = 0;
      refreshJobBoard();
      syncQuestFlagsToWindow();
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [
        ['The creature goes still.',
         'Whatever it was, it is large in death.',
         'The fen road is clear.'],
        ['Constable Tarvec at the Drenwick guard post offered a fee for this.',
         'You should collect it.'],
      ];
      dialogue.open = true; dialogue.page = 0;
      return;
    }
    endCombat();
    return;
  }
  if (combat.phase === 'defeat') {
    stats.hp   = stats.maxHp;
    stats.gold = 0;
    day++;
    ['poison', 'muddied', 'slither', 'cursed'].forEach(id => removeStatusEffect(id));
    endCombat();
    dialogue.name  = '';
    if (defeatWakeAtHome) {
      // Someone carried you home: wake beside your own bed in the Calwick
      // player house, wherever the defeat happened. Location state mirrors
      // bootstrap.js's opening block exactly, so every interior/dungeon flag
      // is cleared and exiting the house returns to west Calwick as normal.
      // Toggleable from the debug menu ("Home on Defeat").
      inDungeon = false; inSluice = false; inMireVault = false;
      inTakomo = false; inFenBrewery = false; inHamletInterior = false;
      inDungeonEntrance = false;
      inTown              = true;
      currentTownId       = 'calwick';
      townBuilding        = 'house';
      currentHouseId      = 'player_house';
      houseSourceMap      = WEST_TOWN_MAP;
      houseSourceBuilding = 'west';
      houseReturnPos      = { x: 2.5 * TILE, y: 12.5 * TILE };
      activeMap           = HOUSE_INTERIOR_MAP;
      player.x            = 9.5 * TILE;   // on the floor beside the bed
      player.y            = 3.5 * TILE;
      player.facing       = 'down';
      dialogue.pages = [['\u2026a day later, you awaken in your own bed, without your gold.',
                         'Someone must have carried you home.']];
    } else {
      dialogue.pages = [['\u2026a day later, you awaken without your gold.']];
    }
    dialogue.open  = true;
    dialogue.page  = 0;
    return;
  }
  if (combat.phase === 'item') {
    const items = inventoryItems();
    if (combat.itemCursor === items.length) {
      // "Back" entry selected \u2014 return to the action menu; no turn spent, no enemy response.
      combat.phase = 'choose';
      return;
    }
    const item = items[combat.itemCursor];
    if (!item) return;

    const msgs = [];
    if (item.type === 'potion') {
      if (item.curesPoison) {
        removeStatusEffect('poison');
        stats.items.splice(stats.items.indexOf(item), 1);
        combat.itemCursor = Math.min(combat.itemCursor, inventoryItems().length);
        msgs.push(`Used ${item.name} \u2014 poison cured!`);
      } else if (item.curesCursed) {
        removeStatusEffect('cursed');
        stats.items.splice(stats.items.indexOf(item), 1);
        combat.itemCursor = Math.min(combat.itemCursor, inventoryItems().length);
        msgs.push(`Used ${item.name} \u2014 the curse lifts!`);
      } else {
        const healed = Math.min(item.heals || 0, stats.maxHp - stats.hp);
        stats.hp += healed;
        if (item.causesMuddied) addStatusEffect('muddied');
        stats.items.splice(stats.items.indexOf(item), 1);
        combat.itemCursor = Math.min(combat.itemCursor, inventoryItems().length);
        msgs.push(item.causesMuddied
          ? `Used ${item.name} \u2014 restored ${healed} HP. Legs feel heavy.`
          : `Used ${item.name} \u2014 restored ${healed} HP!`);
      }
    } else {
      equipItem(item);
      msgs.push(`Equipped ${item.name}!`);
    }

    // Using an item consumes the turn just like Attack \u2014 the enemy still acts.
    msgs.push(enemyTurnResponse(d => `${combat.enemy.name} attacks for ${d}!`));
    // Burn ticks at the end of the turn, after the enemy's response.
    const itemBurn = burnTickEntry();
    if (itemBurn) msgs.push(itemBurn);

    const first = msgs.shift();
    if (typeof first === 'string') {
      combat.message = first;
    } else {
      first.apply();
      combat.message = first.text;
    }
    combat.messageQueue = msgs;
    combat.phase        = 'message';
    return;
  }

  // phase === 'choose'
  const action = combatOptions()[combat.cursor];
  if (action === 'run') {
    // No-escape fights. Rainfish: the school is all around you in the
    // shallows. Fort arrest sequence (guard → Polwick → Essa): each opponent
    // stands between the player and the fort's only door — and fleeing
    // mid-sequence left the quest in odd half-states (opponents vanishing at
    // off-stages, the chain resumable in the wrong order), so Run is simply
    // not available. Attempting it costs the turn: the enemy gets a free hit,
    // same as the Rainfish rule.
    if (combat.isRainfish || combat.isFortGuard || combat.isFortPolwick || combat.isFortEssa) {
      const atkRoll = combat.enemy.atk * (0.8 + Math.random() * 0.4);
      const eDmg = Math.max(1, Math.round(atkRoll - effectiveDef()));
      const newHp = Math.max(0, stats.hp - eDmg);
      stats.hp = newHp;
      const noRunText =
          combat.isRainfish     ? `Nowhere to go! Rainfish thrashes for ${eDmg}!`
        : combat.isFortGuard    ? `The guard holds the door! He strikes for ${eDmg}!`
        : combat.isFortPolwick  ? `Polwick stays between you and the door! He strikes for ${eDmg}!`
        :                         `Essa keeps herself between you and the door! She strikes for ${eDmg}!`;
      const msgs = [noRunText];
      if (newHp <= 0) { msgs.push(`${stats.name} has fallen...`); combat.pendingDefeat = true; }
      // A blocked run still spends the turn — Burn ticks, same as a failed run.
      const blockedRunBurn = burnTickEntry();
      if (blockedRunBurn) msgs.push(blockedRunBurn);
      combat.message = msgs.shift();
      combat.messageQueue = msgs;
      combat.phase = 'message';
      return;
    }
    // Run — success chance scales with speed advantage
    const escapeChance = Math.min(0.7, Math.max(0.15,
      0.35 + (effectiveSpd() - combat.enemy.spd) * 0.05
    ));
    if (Math.random() < escapeChance) {
      combat.message      = 'Got away safely!';
      combat.messageQueue = [];
      combat.pendingEscape = true;
      combat.phase        = 'message';
    } else {
      // Failed to flee — enemy gets a free hit
      const atkRoll = combat.enemy.atk * (0.8 + Math.random() * 0.4);
      const eDmg = Math.max(1, Math.round(atkRoll - effectiveDef()));
      const newHp = Math.max(0, stats.hp - eDmg);
      stats.hp = newHp;
      const msgs = [`Couldn't escape! ${combat.enemy.name} attacks for ${eDmg}!`];
      if (newHp <= 0) {
        msgs.push(`${stats.name} has fallen...`);
        combat.pendingDefeat = true;
      }
      // Burn still ticks on a failed escape — it's a turn spent in the fight.
      const runBurn = burnTickEntry();
      if (runBurn) msgs.push(runBurn);
      combat.message      = msgs.shift();
      combat.messageQueue = msgs;
      combat.phase        = 'message';
    }
    return;
  }

  const msgs = [];
  // Re-roll slither speed at the start of each combat action so the HUD is stable per-turn.
  if (hasStatusEffect('slither')) {
    slitherSpd = rollSlitherSpd();
    msgs.push(`Speed shifts to ${slitherSpd}! (Slither)`);
  }
  if (action === 'attack') {
    // Determine turn order by comparing speed; ties go to a coin flip
    const playerSpd  = effectiveSpd();
    const enemySpd   = combat.enemy.spd;
    const playerFirst = playerSpd > enemySpd ||
                        (playerSpd === enemySpd && Math.random() < 0.5);

    // Enemy defend — armoured enemies occasionally brace, halving incoming damage and skipping counter
    const enemyDefending = !!(combat.enemy.defendChance && Math.random() < combat.enemy.defendChance);
    const rawPDmg = Math.max(1, effectiveAtk() - combat.enemy.def);
    // Cursed fumble — 25% chance of a wild swing dealing only 1 damage
    const cursedFumble = !enemyDefending && hasStatusEffect('cursed') && Math.random() < 0.25;
    const pDmg = enemyDefending ? Math.max(1, Math.floor(rawPDmg / 2))
               : cursedFumble   ? 1
               : rawPDmg;
    const atkRoll = combat.enemy.atk * (0.8 + Math.random() * 0.4);
    const eDmg    = Math.max(1, Math.round(atkRoll - effectiveDef()));

    // Helper: record a kill (XP, gold, potion drop)
    function applyKillRewards() {
      msgs.push(`${combat.enemy.name} was defeated!`);
      stats.xp += combat.enemy.xp;
      msgs.push(`Gained ${combat.enemy.xp} XP!  (Total: ${stats.xp})`);
      checkLevelUp(msgs);
      const goldGain = combat.enemy.goldMin +
        Math.floor(Math.random() * (combat.enemy.goldMax - combat.enemy.goldMin + 1));
      stats.gold += goldGain;
      const droppedPotion = Math.random() < 0.12;
      if (droppedPotion) stats.items.push({ name: 'Potion', type: 'potion', heals: 20, price: 30 });
      msgs.push(`Gained ${goldGain} gold.`);
      if (droppedPotion) msgs.push(`Found a potion!`);
      combat.pendingVictory = true;
    }

    if (enemyDefending) {
      // ── Enemy bracing: player deals half damage, enemy skips counter ──────
      combat.enemy.hp = Math.max(0, combat.enemy.hp - pDmg);
      msgs.push(`${combat.enemy.name} braces! ${stats.name} deals only ${pDmg} damage.`);
      if (combat.enemy.hp <= 0) applyKillRewards();

    } else if (playerFirst) {
      // ── Player attacks first ──────────────────────────────────────────────
      combat.enemy.hp = Math.max(0, combat.enemy.hp - pDmg);
      if (cursedFumble) {
        msgs.push(`Cursed fumble! ${stats.name} swings wildly for ${pDmg} damage.`);
      } else {
        msgs.push(`${stats.name} attacks for ${pDmg} damage!`);
      }

      if (combat.enemy.hp <= 0) {
        applyKillRewards();
      } else {
        // Enemy counter-attacks — damage deferred until message is shown
        msgs.push({
          text: `${combat.enemy.name} strikes back for ${eDmg}!`,
          apply() {
            stats.hp = Math.max(0, stats.hp - eDmg);
            applyEnemyHitEffects();
            if (stats.hp <= 0) {
              combat.messageQueue.push(`${stats.name} has fallen...`);
              combat.pendingDefeat = true;
            }
          },
        });
      }
    } else {
      // ── Enemy attacks first (higher speed) ───────────────────────────────
      // Pre-calculate outcomes so the queue can be built deterministically.
      const newPlayerHp = Math.max(0, stats.hp - eDmg);
      const newEnemyHp  = Math.max(0, combat.enemy.hp - pDmg);

      msgs.push({
        text: `${combat.enemy.name} strikes first for ${eDmg}!`,
        apply() {
          stats.hp = newPlayerHp;
          applyEnemyHitEffects();
          if (newPlayerHp <= 0) {
            combat.messageQueue.push(`${stats.name} has fallen...`);
            combat.pendingDefeat = true;
          }
        },
      });

      if (newPlayerHp > 0) {
        // Player counter-attacks; enemy HP update deferred to match message
        const counterText = cursedFumble
          ? `Cursed fumble! ${stats.name} swings wildly for ${pDmg}!`
          : `${stats.name} counter-attacks for ${pDmg}!`;
        msgs.push({
          text: counterText,
          apply() { combat.enemy.hp = newEnemyHp; },
        });

        if (newEnemyHp <= 0) applyKillRewards();
      }
    }
  } else if (action === 'item') {
    // Always open the item subscreen; it shows "[ Back ]" even when empty
    combat.itemCursor = 0;
    combat.phase = 'item';
    return;
  } else if (action === 'observe') {
    // ── Observe ────────────────────────────────────────────────────────────
    combat.observeCount++;
    const obsLines = getObservationText(combat.enemy, combat.observeCount - 1);
    obsLines.forEach(l => msgs.push(l));

    // Roll whether the enemy closes in this turn.
    // Bosses/specials are more relentless: 25% skip chance vs 50% for normal.
    const isSpecial = combat.isBoss || combat.isWarden || combat.isFortGuard ||
                      combat.isFortPolwick || combat.isFortEssa || combat.isMulholland ||
                      combat.isPaleSentry || combat.isDenWraith || combat.isSailorBrawl ||
                      combat.isTakomo || combat.isRainfish || combat.is23;
    const skipChance = isSpecial ? 0.25 : 0.50;
    if (Math.random() < skipChance) {
      msgs.push('It does not close the distance.');
    } else {
      const obsAtkRoll = combat.enemy.atk * (0.8 + Math.random() * 0.4);
      const obsEDmg    = Math.max(1, Math.round(obsAtkRoll - effectiveDef()));
      const obsNewHp   = Math.max(0, stats.hp - obsEDmg);
      msgs.push({
        text: `${combat.enemy.name} strikes for ${obsEDmg}!`,
        apply() {
          stats.hp = obsNewHp;
          applyEnemyHitEffects();
          if (obsNewHp <= 0) {
            combat.messageQueue.push(`${stats.name} has fallen...`);
            combat.pendingDefeat = true;
          }
        },
      });
    }
  }

  // Burn ticks at the end of the turn (Attack / Observe), after the enemy has
  // acted — but not if the enemy just died (fight's won) or the turn produced
  // no messages at all.
  if (msgs.length > 0 && !combat.pendingVictory) {
    const turnBurn = burnTickEntry();
    if (turnBurn) msgs.push(turnBurn);
  }

  if (msgs.length > 0) {
    const first = msgs.shift();
    if (typeof first === 'string') {
      combat.message = first;
    } else {
      first.apply();
      combat.message = first.text;
    }
    combat.messageQueue = msgs;
    combat.phase        = 'message';
  }
}

