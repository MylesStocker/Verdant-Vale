'use strict';

// combat.js — equip helpers, enemy stat templates, choice-box/shop state,
// the combat state object, all startXCombat() encounter starters, and the
// turn-resolution logic (combatOptions, applyEnemyHitEffects, observe text,
// handleCombatAction).

// ─── Enemy templates ─────────────────────────────────────────────────────────
// ─── Removal Contract quest objects ───────────────────────────────────────────
// Briar Warden — territorial fen creature denning in the hidden spring meadow
// off the Verdant Vale's NW tree nook (MEADOW_MAP; formerly dungeon floor 1's
// east passage). A level-5 player in the Steel Sword and issued armor can win,
// but cannot safely flatten it by repeating Attack; no gold (Mault pays instead).
const BRIAR_WARDEN_TEMPLATE = {
  id: 'enemy_briar_warden',
  name: 'Briar Warden', hp: 110, maxHp: 110, atk: 22, def: 8, spd: 9,
  xp: 110, goldMin: 0, goldMax: 0,
};

// ─── Smugglers' Fort combat templates ─────────────────────────────────────────
// Intentionally hard for early-game players: fight-path is optional but punishing.
const SMUGGLER_GUARD_TEMPLATE = {
  id: 'enemy_smuggler_guard',
  name: 'Smuggler Guard', hp: 46, maxHp: 46, atk: 17, def: 7, spd: 8,
  xp: 40, goldMin: 12, goldMax: 22,
};
const POLWICK_TEMPLATE = {
  id: 'enemy_polwick',
  name: 'Polwick', hp: 64, maxHp: 64, atk: 19, def: 7, spd: 9,
  xp: 52, goldMin: 20, goldMax: 35,
};
const ESSA_TEMPLATE = {
  id: 'enemy_essa',
  name: 'Essa', hp: 36, maxHp: 36, atk: 17, def: 4, spd: 14,
  xp: 36, goldMin: 10, goldMax: 18,
};

// ─── Pale Sentry — fen road contract creature ─────────────────────────────────
// Spawns on MAP_N2 once sentry_quest_started. HP persists between encounters.
const PALE_SENTRY_TEMPLATE = {
  id: 'enemy_pale_sentry',
  name: 'Pale Sentry', hp: 500, maxHp: 500, atk: 32, def: 10, spd: 4,
  xp: 350, goldMin: 40, goldMax: 80,
};

// Gallery formation base stats remain provisional. Coordination is owned by
// formationRounds below. No per-member awards: the report remains the reward.
const GALLERY_RECEIVER_TEMPLATES = [
  {id:'enemy_gallery_receiver', name:'The Receiver', hp:54, maxHp:54, atk:10, def:4, spd:4, xp:0, goldMin:0, goldMax:0},
  {id:'enemy_gallery_caller', name:'The Caller', hp:20, maxHp:20, atk:14, def:0, spd:12, xp:0, goldMin:0, goldMax:0},
  {id:'enemy_gallery_keeper', name:'The Keeper', hp:32, maxHp:32, atk:9, def:2, spd:7, xp:0, goldMin:0, goldMax:0},
];
Object.defineProperty(GALLERY_RECEIVER_TEMPLATES[0], 'isBoss', {value:true});

// ─── Enemy-template identity registry (stable IDs, #4) ───────────────────────
// One authoritative, id-keyed registry of every enemy TEMPLATE. Combat clones a
// template into combat.enemy with `{ ...t }`, which carries the `id` through, so
// a generated enemy always knows which template it came from — independent of
// its display `name` (two Mire Toads and several cross-pool duplicates share a
// name but have distinct ids). This pass provides durable identity + complete
// validation ONLY: nothing in combat/render/observe dispatch reads `id` yet.
//
// Built here (combat.js, loaded after data.js) because the scripted templates
// above live in this file while the random pools live in data.js — both are in
// scope by now. IDs are authored, immutable, and lowercase `enemy_<snake>`; once
// shipped, an id must never be renamed or reused for a different creature.
//
// ENEMY_TEMPLATE_POOLS is the SOLE authoritative inventory of every random
// encounter pool. Each entry is { id, label, templates }:
//   • `id`    — a stable, authored `pool_<snake_case>` handle. It is written by
//               hand here and never derived at runtime from the label, the
//               source variable name, MAP_METADATA, array order, or the enemies
//               inside. Once shipped it must never be renamed or reused for a
//               different pool. It is the handle that validation.js and
//               test/balance-report.js reference a pool by.
//   • `label` — a developer-readable name; free to reword, purely descriptive.
//   • `templates` — the ACTUAL pool array (same object reference used by
//               currentEncounterPool() / MAP_METADATA.encounterPool). Order and
//               repetition are preserved exactly; a template repeated for higher
//               spawn weight stays repeated. One distinct array == one entry
//               (pools sharing an array would share a single id).
// To add a pool: register its array here with a new immutable id. It is then
// automatically picked up by validateEnemies() and the balance report — no
// second list to maintain anywhere.
const ENEMY_TEMPLATE_POOLS = [
  { id: 'pool_overworld_core',    label: 'Overworld — post-start (MAP2)',      templates: ENEMY_TEMPLATES },
  { id: 'pool_overworld_early',   label: 'Overworld — starting area (MAP)',    templates: EARLY_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_f1',        label: 'Dungeon — floor 1',                  templates: DUNGEON_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_f2_5',      label: 'Dungeon — floors 2–5',               templates: DUNGEON2_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_f6_7',      label: 'Dungeon — floors 6–7',               templates: DUNGEON6_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_f8',        label: 'Dungeon — floor 8',                  templates: DUNGEON8_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_horror',    label: 'Dungeon — floors 9–10 (horror)',     templates: DUNGEON_HORROR_ENEMY_TEMPLATES },
  { id: 'pool_far_overworld',     label: 'Far overworld (MAP3 / N-tier)',      templates: FAR_ENEMY_TEMPLATES },
  { id: 'pool_thornmere',         label: 'Thornmere (MAP4)',                   templates: THORNMERE_ENEMY_TEMPLATES },
  { id: 'pool_lighthouse',        label: 'Abandoned Lighthouse — lower floors', templates: LIGHTHOUSE_ENEMY_TEMPLATES },
  { id: 'pool_lighthouse_top',    label: 'Abandoned Lighthouse — lantern room', templates: LIGHTHOUSE_TOP_ENEMY_TEMPLATES },
  { id: 'pool_thornmere_shore',   label: 'Thornmere shore (Shallows / N. Fen)', templates: THORNMERE_SHORE_ENEMY_TEMPLATES },
  { id: 'pool_canal_banks',       label: 'Eastern Canal Banks',                templates: CANAL_BANKS_ENEMY_TEMPLATES },
  { id: 'pool_east_sluice',       label: 'East Sluice — main floors',          templates: SLUICE_ENEMY_TEMPLATES },
  { id: 'pool_east_sluice_top',   label: 'East Sluice — top floor',            templates: SLUICE_TOP_ENEMY_TEMPLATES },
  { id: 'pool_east_sluice_secret', label: 'East Sluice — sealed room',         templates: SLUICE_SECRET_ENEMY_TEMPLATES },
  { id: 'pool_north_basin',       label: 'North Basin',                        templates: NORTH_BASIN_ENEMY_TEMPLATES },
  { id: 'pool_sunken_gallery',    label: 'Sunken Gallery',                     templates: SUNKEN_GALLERY_ENEMY_TEMPLATES },
  { id: 'pool_upper_reach',       label: 'Upper Reach',                        templates: UPPER_REACH_ENEMY_TEMPLATES },
  { id: 'pool_mire_vault',        label: "Mirethyst's Vault",                  templates: MIRE_VAULT_ENEMY_TEMPLATES },
];
const ENEMY_SCRIPTED_TEMPLATES = [
  BRIAR_WARDEN_TEMPLATE, SMUGGLER_GUARD_TEMPLATE, POLWICK_TEMPLATE, ESSA_TEMPLATE,
  PALE_SENTRY_TEMPLATE, RAINFISH_TEMPLATE, SWAMP_DONKEY_TEMPLATE, TAKOMO_TEMPLATE,
  MULHOLLAND_TEMPLATE, DEN_WRAITH_TEMPLATE, SAILOR_BRAWLER_TEMPLATE, BOSS_TEMPLATE,
  LENSWEB_SPIDER_TEMPLATE, MIMIC_POTION_TEMPLATE,
  ...GALLERY_RECEIVER_TEMPLATES,
];
// The 1/256 secret "23" enemy is generated fresh each encounter with random
// stats (startCombat, below), so it has no static stat block — only a stable id.
// Registered as an inline descriptor so validation knows the id without
// demanding combat stats it deliberately doesn't have.
const SECRET_23_TEMPLATE = { id: 'enemy_23', name: '23', inline: true };
const ENEMY_TEMPLATE_REGISTRY = {};
(function buildEnemyTemplateRegistry() {
  const add = (t) => { if (t && typeof t.id === 'string') ENEMY_TEMPLATE_REGISTRY[t.id] = t; };
  ENEMY_TEMPLATE_POOLS.forEach((pool) => pool.templates.forEach(add));
  ENEMY_SCRIPTED_TEMPLATES.forEach(add);
  add(SECRET_23_TEMPLATE);
})();
window.ENEMY_TEMPLATE_REGISTRY  = ENEMY_TEMPLATE_REGISTRY;
window.ENEMY_TEMPLATE_POOLS     = ENEMY_TEMPLATE_POOLS;
window.ENEMY_SCRIPTED_TEMPLATES = ENEMY_SCRIPTED_TEMPLATES;
window.SECRET_23_TEMPLATE       = SECRET_23_TEMPLATE;


// ─── Equipment helpers ────────────────────────────────────────────────────────
// Maps item type to the stats slot it occupies.
function slotForType(type) {
  if (type === 'weapon')    return 'weapon';
  if (type === 'armor')     return 'armor';
  if (type === 'shield')    return 'shield';
  if (type === 'accessory') return 'accessory';
  return null;
}

function effectiveAtk(playerStats = stats) {
  return playerStats.atk + (playerStats.weapon ? playerStats.weapon.bonus : 0);
}

function effectiveDef(playerStats = stats) {
  return Math.max(0,
    playerStats.def
    + (playerStats.armor  ? playerStats.armor.bonus  : 0)
    + (playerStats.shield ? playerStats.shield.bonus : 0)
    - (hasStatusEffect('muddied') ? 1 : 0)
    - (combat.corrosion || 0)   // Dripping Maw acid — combat-only, cleared on endCombat
  );
}

// Pure mitigation rule: ordinary effective DEF stops at 80% of the enemy's
// live combat ATK. A validated armor capability may opt into legacy uncapped
// behavior; Cat Armor is the sole authored user of that secret exception.
function playerIncomingMitigation(enemyAtk, effectivePlayerDef, defenseCapBypass) {
  if (defenseCapBypass === true) return effectivePlayerDef;
  return Math.min(effectivePlayerDef, Math.floor(enemyAtk * 0.80));
}

// One runtime adapter supplies the current effective DEF and equipped-armor
// capability to the pure rule. Every enemy-to-player attack path calls this.
function effectivePlayerIncomingMitigation(enemyAtk) {
  return playerIncomingMitigation(
    enemyAtk,
    effectiveDef(),
    !!(stats.armor && stats.armor.defenseCapBypass === true)
  );
}

// Accessories contribute a speed bonus; callers that need effective SPD use this.
function effectiveSpd(playerStats = stats) {
  if (hasStatusEffect('slither')) return slitherSpd;
  return Math.max(1,
    playerStats.spd
    + (playerStats.accessory ? playerStats.accessory.bonus : 0)
    - (hasStatusEffect('muddied') ? 2 : 0)
  );
}

// Probability that a combatant with speed `own` beats one with speed `other`
// in a speed contest. Used for BOTH turn order and flee attempts, so neither
// is deterministic: equal speed is a coin flip, the faster side is favoured,
// and the outcome is never guaranteed either way (clamped to [0.1, 0.9] so
// even a large speed gap leaves a real chance of the slower side winning).
function speedWinChance(own, other) {
  const a = Math.max(1, own), b = Math.max(1, other);
  return Math.min(0.9, Math.max(0.1, a / (a + b)));
}

// Shared damage roll for EVERY attack in combat, player and enemy alike, so no
// hit lands the same flat number twice. Base is (atk - def); the attack takes a
// ±20% variance swing, and there's a CRIT_CHANCE for a harder CRIT_MULT hit.
// Never below 1. Returns { dmg, crit } so callers can flag a critical.
const CRIT_CHANCE = 0.10;
const CRIT_MULT   = 1.5;
const ATTACK_VARIANCE_MIN = 0.8;
const ATTACK_VARIANCE_SPAN = 0.4;

// Pure arithmetic shared by real rolls and formation numeric preflight. Keep
// each operation (including critical-before-rounding) in its original order.
// Fractional intermediates are intentional; the recorded damage is an integer.
function attackDamageNumbers(atk, def, variance, crit) {
  const variedAtk = atk * variance;
  const mitigated = variedAtk - def;
  let unroundedDamage = mitigated;
  if (crit) unroundedDamage *= CRIT_MULT;
  return { variedAtk, mitigated, unroundedDamage,
    dmg: Math.max(1, Math.round(unroundedDamage)) };
}

function rollAttackDamage(atk, def) {
  const variance = ATTACK_VARIANCE_MIN + Math.random() * ATTACK_VARIANCE_SPAN;
  const crit = Math.random() < CRIT_CHANCE;
  return { dmg: attackDamageNumbers(atk, def, variance, crit).dmg, crit };
}

function equipItem(item) {
  const slot = slotForType(item.type);
  if (!slot) return;                        // non-equippable type (e.g. potion)
  if (stats[slot]) stats.items.push(stats[slot]);  // bump old item to inventory
  stats[slot] = item;
  const idx = stats.items.indexOf(item);
  if (idx !== -1) stats.items.splice(idx, 1);
}

// Arithmetic shared by singleton use and formation use. Timing/consumption is
// owned by the caller, not by an item name or a second set of item definitions.
function healingItemAmount(item, hp, maxHp) {
  return Math.min(item.heals || 0, maxHp - hp);
}
function offensiveItemDamage(item, enemy) {
  if (item.minDamage !== undefined) return Math.max(item.minDamage, Math.min(item.damage, item.damage - enemy.def));
  return item.ignoresDef ? item.damage : Math.max(1, item.damage - enemy.def);
}

// ─── Choice box ───────────────────────────────────────────────────────────────
// Generic two-option prompt. Open by setting title/options/callbacks, then choice.open = true.
const choice = { open: false, cursor: 0, title: '', options: [], callbacks: [] };

// ─── Shop state ───────────────────────────────────────────────────────────────
const shop = { open: false, screen: 'main', cursor: 0, title: 'MERCHANT', stock: MERCHANT_STOCK };

// \u2500\u2500\u2500 Status-cure contract (one authoritative path) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Maps each status-cure item PROPERTY to the runtime status id it clears and its
// existing successful-use confirmation. Every status-restoring item MUST have its
// `curesX` property registered here \u2014 validateGameData() (validation.js) flags an
// unregistered one, and any future cure item routes through this shared path
// automatically (no per-item combat/menu branch). Item DISPLAYS never surface the
// cured status (itemStatLabel returns '' for these); only this contract knows the
// mapping. Characters/authored dialogue may still hint at an item's purpose.
const STATUS_CURE_PROPERTIES = {
  curesPoison: { status: 'poison', success: (name) => `Used ${name} \u2014 poison cured!` },
  curesCursed: { status: 'cursed', success: (name) => `Used ${name} \u2014 the curse lifts!` },
};
if (typeof window !== 'undefined') window.STATUS_CURE_PROPERTIES = STATUS_CURE_PROPERTIES;

// The status ids this item can cure (from its registered curesX properties).
function itemCuredStatuses(item) {
  const out = [];
  if (item) for (const prop of Object.keys(STATUS_CURE_PROPERTIES)) {
    if (item[prop]) out.push(STATUS_CURE_PROPERTIES[prop].status);
  }
  return out;
}
// True if the item cures any status at all.
function isStatusCureItem(item) { return itemCuredStatuses(item).length > 0; }

// The one place a status-cure item is resolved when USED. Removes any currently
// active statuses the item cures; if at least one was active, reports success
// with the item's existing confirmation message, otherwise returns the generic
// "nothing happens" result. Never touches HP, the item stack, the turn, or any
// unrelated status \u2014 the caller consumes the item and spends the turn as usual.
function applyStatusCure(item) {
  let successMessage = null;
  for (const prop of Object.keys(STATUS_CURE_PROPERTIES)) {
    if (!item[prop]) continue;
    const spec = STATUS_CURE_PROPERTIES[prop];
    if (hasStatusEffect(spec.status)) {
      removeStatusEffect(spec.status);
      if (!successMessage) successMessage = spec.success(item.name);
    }
  }
  return successMessage
    ? { cured: true, message: successMessage }
    : { cured: false, message: `Used ${item.name} \u2014 nothing happens.` };
}
if (typeof window !== 'undefined') {
  window.itemCuredStatuses = itemCuredStatuses;
  window.isStatusCureItem  = isStatusCureItem;
  window.applyStatusCure   = applyStatusCure;
}

// Returns the short stat label shown next to an item in menus
function itemStatLabel(item) {
  // Sex-bane reagents (the toad-banes) deliberately show NO stat label \u2014 the
  // display must never reveal what the item does. The knowledge (which bane
  // matches which toad, and to run otherwise) comes from an NPC, not the UI.
  if (item.sexBane)                                return '';
  // Status-cure items deliberately show NO stat label \u2014 a display must never
  // reveal which status an item cures (a character can mention it instead).
  if (isStatusCureItem(item))                      return '';
  if (item.type === 'buff' && item.evadeRate)      return `Evade ${Math.round(item.evadeRate * 100)}% \u00b7 ${item.evadeTurns}t`;
  if (item.type === 'throwable') {
    const damage = item.minDamage !== undefined ? `${item.minDamage}-${item.damage}` : item.damage;
    return item.fuse ? `DMG ${damage} · ${item.fuse}t fuse` : `DMG ${damage}${item.targetsAll ? ' · all' : ''}`;
  }
  if (MUDSLITHER_INFLICTABLE && item.causesMuddied && item.type === 'potion') return `HP  +${item.heals} \u2022 muddies`;
  if (item.questItem && item.type === 'potion')    return `HP  +${item.heals} \u2022 quest`;
  if (item.type === 'weapon')    return `ATK +${item.bonus}`;
  if (item.type === 'armor')     return `DEF +${item.bonus}`;
  if (item.type === 'shield')    return `DEF +${item.bonus}`;
  if (item.type === 'accessory' && item.evadeAll) return 'Evade 100%';
  if (item.type === 'accessory') return `SPD +${item.bonus}`;
  if (item.type === 'potion')    return `HP  +${item.heals}`;
  return '';
}

// itemStatLabel wrapped in parentheses, or '' when there is no label (so an
// item with no displayed stat — e.g. Amethyst Dust — doesn't render empty "()").
function itemStatParen(item) {
  const label = itemStatLabel(item);
  return label ? '(' + label + ')' : '';
}

// ─── Combat state ─────────────────────────────────────────────────────────────
// Session-only identity; template ids still own all data/sprite/behavior dispatch.
let combatEnemyInstanceSequence = 0;
let combatMode = null;
let combatActive = false;
// Provenance only, not another outcome authority. Issued after the ordinary
// victory acknowledgement has finished all its work; never issued by an abort,
// defeat, escape, or a scripted victory that still owns dialogue/handoffs.
let completedSingleVictoryReceipt = null;

const combat = {
  get mode() { return combatMode; },
  get active() { return combatActive; },
  set active(value) {
    if (value && combatMode === 'formation' && !galleryReceiverEncounter.ownsCombat()) {
      throw new Error('Formation state cannot activate combat');
    }
    combatActive = value;
  },
  phase:          'choose',  // 'choose' | 'item' | 'message' | 'victory' | 'defeat'
  cursor:         0,
  itemCursor:     0,
  enemies:        Object.freeze([]), // sole enemy storage; fixed initialized membership
  get enemy() {
    if (combatMode === 'formation') throw new Error('Formation state has no singleton enemy');
    if (!Array.isArray(combat.enemies) || combat.enemies.length > 1) {
      throw new Error('Singleton combat requires zero or one enemy');
    }
    return combat.enemies.length === 0 ? null : combat.enemies[0];
  },
  set enemy(value) { setSingleCombatEnemy(value); },
  messageQueue:   [],
  message:        '',
  pendingVictory: false,
  pendingDefeat:  false,
  pendingEscape:  false,
  flashTimer:     0,
  fireCastTimer:  0,         // frames remaining on Polwick's fire-cast animation
  polwickHasCast: false,     // true once Polwick has cast fire this fight (first hit always casts)
  cooldown:       0,
  isBoss:         false, // legacy Wrongteeth lifecycle, not registry boss classification
  isWarden:       false,
  isFortGuard:    false,
  isFortPolwick:  false,
  isFortEssa:     false,
  isMulholland:      false,
  isPaleSentry:      false,
  isRainfish:        false,
  rainfishRemaining: 0,     // fights left in the current rainfish chain (0 = last fight)
  isMireToadSpawn:   false,
  mireToadRemaining: 0,     // fights left in the spawning-site chain (0 = last fight)
  isDenWraith:       false,
  isSailorBrawl:     false,
  isTakomo:          false,
  is23:              false,
  isLenswebSpider:   false, // the Abandoned Lighthouse lens boss (scripted event)
  // Battle/event-local ONLY — never serialized (the combat object is not part of
  // the save payload). The route quest item the player grabbed through the web,
  // held pending until victory or a successful Observe-gated escape finalizes it.
  pendingLighthouseObjective: null,
  // Legacy test/smoke-fixture projections only; Observe and Run use their
  // explicit enemy. No value is stored here, including while combat is empty.
  get escapeUnlocked() {
    const enemy = combat.enemy;
    return enemy ? enemy.escapeUnlocked : false;
  },
  set escapeUnlocked(value) {
    const enemy = combat.enemy;
    if (enemy) enemy.escapeUnlocked = value;
  },
  get observeCount() {
    const enemy = combat.enemy;
    return enemy ? enemy.observeCount : 0;
  },
  set observeCount(value) {
    const enemy = combat.enemy;
    if (enemy) enemy.observeCount = value;
  },
  evadeTurns:        0,     // remaining turns of Bullet Time's heightened evade (0 = none)
  // ── Per-fight enemy-mechanic state (battle-local ONLY; reset by endCombat) ──
  enemyStunTurns:    0,     // Trollbane: turns the enemy's self-heal (regenPerTurn) stays suppressed (0 = none)
  corrosion:         0,     // Dripping Maw acid: accumulated combat-only DEF loss (0 = none)
  isSeepSplit:       false, // The Seep divides on defeat into a sequential follow-up
  seepSplitRemaining: 0,    // Seep follow-up fights still to come (0 = last/only)
  gullStole:         false, // Basin Gull grace-flee state: false | 'armed' | 'flee' | 'gone'
  gullStolenAmount:  0,     // gold the gull snatched (returned if it is killed in time)
  bombFuse:          0,     // Bomb: player-turns left until it detonates (0 = none armed)
  bombDamage:        0,     // damage the armed Bomb will deal when it goes off
  bombIgnoresDef:    false, // whether that detonation ignores the target's DEF
  bombTargetInstanceId: null, // session-only identity of the single armed Bomb's target
  bombJustArmed:     false, // true only on the turn a Bomb is primed (that turn doesn't count)
};

// Collection-writing authority: the singleton setter and the gated state-only
// initializer below. No encounter calls the latter. Cleanup assigns null.
function setSingleCombatEnemy(enemy) {
  if (enemy === null) {
    if (combatMode === 'formation') formationRounds.clear();
    completedSingleVictoryReceipt = null;
    combat.enemies = Object.freeze([]);
    combatMode = null;
    formationSessionController.clearAfterCombatCleanup();
    galleryReceiverEncounter.combatCleared();
    return;
  }
  if (combatMode === 'formation') throw new Error('Clear formation state before initializing a singleton');
  const instance = createCombatEnemyInstance(enemy, 0);
  completedSingleVictoryReceipt = null;
  combat.enemies = Object.freeze([instance]);
  combatMode = 'single';
}

// Shared runtime construction. Singleton inputs preserve their existing flat
// authored/overridden fields; formation inputs are fully validated flat records.
function createCombatEnemyInstance(enemy, slot) {
  if (typeof enemy !== 'object' || Array.isArray(enemy)) {
    throw new Error('Singleton combat enemy must be an object or null, not an array');
  }
  if ('instanceId' in enemy || 'slot' in enemy) {
    throw new Error('Combat enemy input contains reserved instanceId or slot metadata');
  }
  if ('observeCount' in enemy || 'escapeUnlocked' in enemy) {
    throw new Error('Combat enemy input contains reserved observation state');
  }
  const instance = { ...enemy };
  Object.defineProperties(instance, {
    // Mutable runtime-only ownership. Non-enumerable so legacy template-shaped
    // record copies/comparisons stay unchanged; every new instance starts fresh.
    observeCount: { value: 0, writable: true },
    escapeUnlocked: { value: false, writable: true },
    instanceId: { value: 'combat_enemy_' + (++combatEnemyInstanceSequence), enumerable: true },
    slot: { value: slot, enumerable: true },
  });
  return instance;
}

// State-construction approval, NOT permission to run these encounters together.
// Keep this deliberately small: new identities require an explicit contract
// review even when their stats look ordinary (some behavior is keyed by id).
const FORMATION_STATE_TEMPLATE_IDS = Object.freeze([
  'enemy_marsh_wisp', 'enemy_briar_hound',
  'enemy_marsh_wisp_early', 'enemy_briar_hound_early',
  'enemy_reed_grappler', 'enemy_silt_lurker',
  'enemy_marsh_wisp_sluice_top', 'enemy_sluice_slime',
  'enemy_gallery_receiver', 'enemy_gallery_caller', 'enemy_gallery_keeper',
]);
const FORMATION_STATE_DATA_FIELDS = Object.freeze([
  'id', 'name', 'hp', 'maxHp', 'atk', 'def', 'spd', 'xp', 'goldMin', 'goldMax',
]);
// All current behavior-bearing template fields, plus reflection supported by
// singleton combat. None has formation execution semantics yet.
const FORMATION_STATE_UNSUPPORTED_FIELDS = Object.freeze([
  'defendChance', 'curseChance', 'acidChance', 'splits', 'regenPerTurn',
  'meleeArmor', 'counterChance', 'poisonChance', 'sex', 'dazzleChance',
  'stealAndFlee', 'runLock', 'guaranteedDrop', 'inline', 'thornsReflect',
]);

// State construction stays inactive. Lab and Receiver lifecycle owners call it.
// Requires an empty, inactive state; does not clear a battle,
// set flags, queue messages, calculate sprites, or grant any rewards.
function initializeFormationState(descriptors, policy = {escape:'blocked'}) {
  if (combat.active || combatMode !== null || combat.enemies.length !== 0) {
    throw new Error('Formation state requires empty inactive combat');
  }
  const templates = validateFormationDescriptors(descriptors);
  formationRounds.validatePolicy(policy);
  const members = templates.map((template, slot) => createCombatEnemyInstance(template, slot));
  completedSingleVictoryReceipt = null;
  combat.enemies = Object.freeze(members);
  combatMode = 'formation';
  formationRounds.initialize(members, policy, templates.some(template => template.isBoss === true));
}

// Pure construction preflight, also used before committing encounter staging.
function validateFormationDescriptors(descriptors) {
  if (!Array.isArray(descriptors) || descriptors.length < 2 || descriptors.length > 3 ||
      Reflect.ownKeys(descriptors).length !== descriptors.length + 1) {
    throw new Error('Formation state requires exactly two or three descriptors');
  }
  // Validate ALL descriptors/templates before allocating identities or touching
  // state. Read data descriptors, never invoke authored getters. Exact slot order
  // rejects gaps, ambiguity and reorderings rather than silently sorting them.
  const templates = [];
  for (let slot = 0; slot < descriptors.length; slot++) {
    const entry = Object.getOwnPropertyDescriptor(descriptors, String(slot));
    const descriptor = entry && entry.value;
    if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor) ||
        ![Object.getPrototypeOf({}), null].includes(Object.getPrototypeOf(descriptor))) {
      throw new Error('Formation member must be a plain enemyId/slot descriptor');
    }
    const fields = Object.getOwnPropertyDescriptors(descriptor);
    if (Reflect.ownKeys(fields).length !== 2 || !fields.enemyId || !fields.slot ||
        !Object.hasOwn(fields.enemyId, 'value') || !Object.hasOwn(fields.slot, 'value') ||
        fields.slot.value !== slot || typeof fields.enemyId.value !== 'string') {
      throw new Error('Formation descriptor requires only enemyId and ordered integer slot');
    }
    const id = fields.enemyId.value;
    const registered = Object.getOwnPropertyDescriptor(ENEMY_TEMPLATE_REGISTRY, id);
    if (!registered || !Object.hasOwn(registered, 'value')) {
      throw new Error('Unknown formation template: ' + id);
    }
    const template = registered.value;
    if (!template || Object.getPrototypeOf(template) !== Object.getPrototypeOf({})) {
      throw new Error('Formation template must be plain data: ' + id);
    }
    const data = Object.getOwnPropertyDescriptors(template);
    const copy = {};
    for (const key of Reflect.ownKeys(data)) {
      if (key === 'isBoss' && Object.hasOwn(data[key], 'value') && typeof data[key].value === 'boolean') {
        Object.defineProperty(copy, key, {value:data[key].value});
        continue;
      }
      if (FORMATION_STATE_UNSUPPORTED_FIELDS.includes(key)) {
        throw new Error('Unsupported formation capability: ' + String(key));
      }
      if (!FORMATION_STATE_DATA_FIELDS.includes(key) || !Object.hasOwn(data[key], 'value')) {
        throw new Error('Unknown formation template field: ' + String(key));
      }
      copy[key] = data[key].value;
    }
    if (!FORMATION_STATE_TEMPLATE_IDS.includes(id)) {
      throw new Error('Template is not approved for formation state (singleton contract or unreviewed): ' + id);
    }
    if (copy.id !== id || typeof copy.name !== 'string' ||
        FORMATION_STATE_DATA_FIELDS.slice(2).some(key => !Number.isFinite(copy[key]))) {
      throw new Error('Invalid formation template data: ' + id);
    }
    templates.push(copy);
  }
  return templates;
}

// Resolve membership, not life: legacy deferred trades/rewards can still use a
// zero-HP member. Never substitute a replacement, even with the same template id.
function findCombatEnemy(instanceId) {
  if (typeof instanceId !== 'string' || !Array.isArray(combat.enemies)) return null;
  if (combatMode === 'formation') {
    return combat.enemies.find(enemy => enemy.instanceId === instanceId) || null;
  }
  if (!combat.active || combatMode !== 'single' || combat.enemies.length !== 1) return null;
  const enemy = combat.enemies[0];
  return enemy && enemy.instanceId === instanceId ? enemy : null;
}

function isActiveCombatEnemy(enemy) {
  return combat.active && combatMode === 'single' && !!enemy && findCombatEnemy(enemy.instanceId) === enemy;
}

// Keep the existing { text, apply } queue and its timing. Only the instance id
// crosses the deferred boundary; stale callbacks do nothing (including no RNG).
function bindCombatEnemyEffect(instanceId, effect) {
  return function() {
    const enemy = findCombatEnemy(instanceId);
    if (isActiveCombatEnemy(enemy)) effect(enemy);
  };
}

// Formation-only guard, never called by singleton combat. IEEE-754 operations
// here are monotone in variance, so both endpoints cover every possible roll,
// for both critical branches. Use the greatest representable random value < 1:
// simply adding MIN + SPAN would round to a different upper bound in JS.
function formationAttackNumbersAreSafe(atk, def, damageMultiplier = 1) {
  const maxRandom = 1 - Number.EPSILON / 2;
  const variances = [ATTACK_VARIANCE_MIN,
    ATTACK_VARIANCE_MIN + maxRandom * ATTACK_VARIANCE_SPAN];
  return variances.every(variance => [false, true].every(crit => {
    const numbers = attackDamageNumbers(atk, def, variance, crit);
    // Do not let defence subtraction or the minimum-one floor conceal an
    // out-of-domain intermediate. Raw fractions need bounded magnitude, not
    // integerness; the final recorded attemptedDamage must be a safe integer.
    return Object.values(numbers).every(value => Number.isFinite(value) &&
      Math.abs(value) <= Number.MAX_SAFE_INTEGER) && Number.isSafeInteger(numbers.dmg) &&
      Number.isSafeInteger(numbers.dmg * damageMultiplier);
  }));
}

// Read-only structural/capability validation shared with the headless session.
// Omit the action only before targeting; a supplied action must be a valid
// basic Attack. Target-dependent numeric safety remains in resolver preflight.
// Shared strict neutral-bookkeeping contract. Entry preparation may normalize
// only the three receipted terminal fields, never relax this execution gate.
const FORMATION_NEUTRAL_COMBAT_STATE = Object.freeze({
  phase:'choose', message:'', pendingVictory:false, pendingDefeat:false, pendingEscape:false,
  flashTimer:0, fireCastTimer:0, polwickHasCast:false,
  isBoss:false, isWarden:false, isFortGuard:false, isFortPolwick:false, isFortEssa:false,
  isMulholland:false, isPaleSentry:false, isRainfish:false, rainfishRemaining:0,
  isMireToadSpawn:false, mireToadRemaining:0, isDenWraith:false, isSailorBrawl:false,
  isTakomo:false, is23:false, isLenswebSpider:false, pendingLighthouseObjective:null,
  evadeTurns:0, enemyStunTurns:0, corrosion:0, isSeepSplit:false, seepSplitRemaining:0,
  gullStole:false, gullStolenAmount:0, bombFuse:0, bombDamage:0, bombIgnoresDef:false,
  bombTargetInstanceId:null, bombJustArmed:false,
});

function completedSingleVictoryCandidate() {
  const enemy = combat.enemy; // acknowledged singleton lifecycle boundary
  return isActiveCombatEnemy(enemy) && enemy.hp === 0 && stats.hp > 0 &&
    combat.pendingVictory === true && combat.pendingDefeat === false && combat.pendingEscape === false &&
    Array.isArray(combat.messageQueue) && combat.messageQueue.length === 0 && typeof combat.message === 'string' &&
    combat.rainfishRemaining === 0 && combat.mireToadRemaining === 0 && combat.seepSplitRemaining === 0 &&
    combat.pendingLighthouseObjective === null && !dialogue.open && dialogue.callbacks === null &&
    dialogue.triggerEncounterId === null
    ? Object.freeze({message:combat.message, queue:combat.messageQueue}) : null;
}

// Fully processed ordinary escape/recovery also leaves benign bookkeeping.
// Do not authorize scripted exits, fleeing Gulls, pending rewards or callbacks.
// This receipt changes no singleton state or timing; only explicit later entry
// preparation may consume it, after endCombat has removed the living opponent.
function completedSingleExitCandidate(defeated = false) {
  if (combat.mode !== 'single' || !combat.active || !combat.enemy || combat.enemy.hp <= 0 ||
      (defeated ? stats.hp !== 0 : stats.hp <= 0) || combat.pendingVictory ||
      combat.phase !== (defeated ? 'defeat' : 'message') ||
      combat.pendingEscape !== !defeated || combat.pendingDefeat !== defeated ||
      combat.messageQueue.length || typeof combat.message !== 'string' ||
      Object.keys(FORMATION_NEUTRAL_COMBAT_STATE).some(key => key.startsWith('is') && combat[key]) ||
      combat.rainfishRemaining || combat.mireToadRemaining || combat.seepSplitRemaining || combat.gullStole ||
      combat.pendingLighthouseObjective !== null || dialogue.open || dialogue.callbacks !== null ||
      dialogue.triggerEncounterId !== null) return null;
  return Object.freeze({escape:!defeated,defeat:defeated,message:combat.message,queue:combat.messageQueue});
}

// Explicit handoff, not ordinary cleanup and not an initializer side effect.
// An empty queue and pendingVictory alone cannot prove finalization: require
// the receipt issued by real ordinary victory, escape or completed recovery.
// Bespoke after-dialogue/sequence exits remain unsupported rather than guessed.
function validateFormationEntry() {
  const fail = () => { throw new Error('Unsupported formation entry: combat is not safely finalized'); };
  const emptyArray = value => Array.isArray(value) && value.length === 0 &&
    Object.getPrototypeOf(value) === Object.getPrototypeOf([]) && Reflect.ownKeys(value).length === 1;
  if (combat.mode !== null || combat.active !== false || !emptyArray(combat.enemies) ||
      !Object.isFrozen(combat.enemies) ||
      formationSessionController.getView() !== null || dialogue.open !== false ||
      dialogue.callbacks !== null || dialogue.triggerEncounterId !== null ||
      seraLioraCutscene.active || fishing.active || menu.open || choice.open || shop.open ||
      warpMenu.open || accordPanel.open || continentMap.open || !Number.isFinite(stats.hp) || stats.hp <= 0) fail();
  const fields = Object.getOwnPropertyDescriptors(combat);
  const neutral = FORMATION_NEUTRAL_COMBAT_STATE;
  const receipt = completedSingleVictoryReceipt;
  const terminal = fields.phase?.value === 'victory';
  const escaped = receipt?.escape === true && fields.phase?.value === 'message';
  const recovered = receipt?.defeat === true && fields.phase?.value === 'defeat';
  if (terminal && (!receipt || fields.message?.value !== receipt.message ||
      receipt.escape || receipt.defeat || fields.messageQueue?.value !== receipt.queue || fields.pendingVictory?.value !== true)) fail();
  if (escaped && (fields.message?.value !== receipt.message || fields.messageQueue?.value !== receipt.queue ||
      fields.pendingEscape?.value !== true)) fail();
  if (recovered && (fields.message?.value !== receipt.message || fields.messageQueue?.value !== receipt.queue ||
      fields.pendingDefeat?.value !== true)) fail();
  const expected = terminal ? {...neutral, phase:'victory', message:receipt.message, pendingVictory:true}
    : escaped ? {...neutral,phase:'message',message:receipt.message,pendingEscape:true}
    : recovered ? {...neutral,phase:'defeat',message:receipt.message,pendingDefeat:true} : neutral;
  if (Object.entries(expected).some(([key,value]) => fields[key]?.value !== value || fields[key].writable !== true) ||
      Reflect.ownKeys(fields).some(key => ![...Object.keys(neutral), 'mode','active','enemy','enemies',
        'observeCount','escapeUnlocked','messageQueue','cursor','itemCursor','cooldown'].includes(key)) ||
      !emptyArray(fields.messageQueue?.value) ||
      ['cursor','itemCursor','cooldown'].some(key => !Number.isSafeInteger(fields[key]?.value) || fields[key].value < 0)) fail();
}

function prepareFormationEntry() {
  validateFormationEntry();
  // Every rejection is above the write boundary. Preserve queue identity,
  // cooldown, cursors, player state, flags, and the historical singleton path.
  combat.phase = 'choose';
  combat.message = '';
  combat.pendingVictory = false;
  combat.pendingEscape = false;
  combat.pendingDefeat = false;
  completedSingleVictoryReceipt = null;
}

// The only active formation owner is the Receiver. Headless/Lab sessions keep
// their original inactive contract; an arbitrary active formation still fails.
function formationExecutionStateAllowed() {
  return combat.active === false || (combat.active === true && galleryReceiverEncounter.ownsCombat());
}

function validateFormationPlayerBasicState(extended = false) {
  const fail = () => { throw new Error('Unsupported formation basic Attack state or action'); };
  if (!Array.isArray(statusEffects) || new Set(statusEffects).size !== statusEffects.length ||
      statusEffects.some(id => !extended || !FORMATION_PLAYER_STATUSES.includes(id))) fail();
  if (extended && hasStatusEffect('slither') && (!Number.isSafeInteger(slitherSpd) || slitherSpd < 1 || slitherSpd > 20)) fail();
  const fields = Object.getOwnPropertyDescriptors(stats);
  for (const key of ['hp','maxHp','atk','def','spd']) {
    if (!fields[key] || !Object.hasOwn(fields[key], 'value') || !Number.isSafeInteger(fields[key].value) || fields[key].value < 0) fail();
  }
  if (stats.hp <= 0 || stats.hp > stats.maxHp || fields.hp.writable !== true) fail();
  for (const slot of ['weapon','armor','shield','accessory']) {
    if (!fields[slot] || !Object.hasOwn(fields[slot], 'value')) fail();
    const gear = fields[slot].value;
    if (gear === null) continue;
    if (!gear || typeof gear !== 'object' || Array.isArray(gear) ||
        ![Object.getPrototypeOf({}),null].includes(Object.getPrototypeOf(gear))) fail();
    const props = Object.getOwnPropertyDescriptors(gear);
    const allowed = ['name','type','bonus','price', ...(slot === 'armor' ? ['defenseCapBypass'] : []),
      ...(extended ? ['evadeAll','preventsCursed','questItem'] : [])];
    if (Reflect.ownKeys(props).some(key => !allowed.includes(key) || !Object.hasOwn(props[key], 'value')) ||
        props.type?.value !== slot || typeof props.name?.value !== 'string' || !Number.isSafeInteger(props.bonus?.value) ||
        ['defenseCapBypass','evadeAll','preventsCursed','questItem'].some(key => props[key] && typeof props[key].value !== 'boolean')) fail();
  }
  if (![effectiveAtk(),effectiveDef(),effectiveSpd()].every(Number.isSafeInteger)) fail();
}

function formationBasicStatsValid(value) {
  return ['hp','maxHp','atk','def','spd'].every(key => Number.isSafeInteger(value[key]) && value[key] >= 0) &&
    value.maxHp > 0 && value.hp <= value.maxHp;
}

function validateFormationBasicAttackState(action, extended = false) {
  const fail = () => { throw new Error('Unsupported formation basic Attack state or action'); };
  // Reject getters/prototype behavior before reading supplied/runtime records.
  const dataRecord = (value, allowed) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.getPrototypeOf({}), null].includes(Object.getPrototypeOf(value))) fail();
    const fields = Object.getOwnPropertyDescriptors(value);
    if (Reflect.ownKeys(fields).some(key => !allowed.includes(key) || !Object.hasOwn(fields[key], 'value'))) fail();
    return fields;
  };
  let targetInstanceId = null;
  if (action !== undefined || (arguments.length && !extended)) {
    const actionFields = dataRecord(action, ['type', 'targetInstanceId']);
    if (actionFields.type?.value !== 'attack' || typeof actionFields.targetInstanceId?.value !== 'string') fail();
    targetInstanceId = actionFields.targetInstanceId.value;
  }
  const members = combat.enemies;
  if (combat.mode !== 'formation' || !formationExecutionStateAllowed() || !Array.isArray(members) ||
      !Object.isFrozen(members) || members.length < 2 || members.length > 3 ||
      Reflect.ownKeys(members).length !== members.length + 1 ||
      Object.getPrototypeOf(members) !== Object.getPrototypeOf([])) fail();
  for (let slot = 0; slot < members.length; slot++) {
    if (!Object.hasOwn(Object.getOwnPropertyDescriptor(members, String(slot)) || {}, 'value')) fail();
  }

  // An idle cursor/cooldown is presentation/exploration state, not a mechanic.
  // Everything else must be neutral, including stale pending singleton work.
  const neutral = FORMATION_NEUTRAL_COMBAT_STATE;
  const battleFields = Object.getOwnPropertyDescriptors(combat);
  if (Object.entries(neutral).some(([key,value]) => !(extended && FORMATION_EFFECT_FIELDS.includes(key)) && battleFields[key]?.value !== value) ||
      !Array.isArray(battleFields.messageQueue?.value) || battleFields.messageQueue.value.length !== 0 ||
      Reflect.ownKeys(battleFields).some(key => ![...Object.keys(neutral), 'mode', 'active', 'enemies',
        'enemy', 'observeCount', 'escapeUnlocked', 'messageQueue', 'cursor', 'itemCursor', 'cooldown'].includes(key)) ||
      !Array.isArray(statusEffects) || (!extended && statusEffects.length !== 0)) fail();

  validateFormationPlayerBasicState(extended);

  const ids = new Set();
  members.forEach((member, slot) => {
    const fields = dataRecord(member, [...FORMATION_STATE_DATA_FIELDS,
      'instanceId', 'slot', 'observeCount', 'escapeUnlocked']);
    const template = Object.getOwnPropertyDescriptor(ENEMY_TEMPLATE_REGISTRY, fields.id?.value)?.value;
    dataRecord(template, [...FORMATION_STATE_DATA_FIELDS, 'isBoss']);
    if (Object.hasOwn(template,'isBoss') && typeof template.isBoss !== 'boolean') fail();
    if (!FORMATION_STATE_TEMPLATE_IDS.includes(member.id) || template.id !== member.id ||
        !formationBasicStatsValid(member) || !formationBasicStatsValid(template) || typeof member.name !== 'string' ||
        ['xp','goldMin','goldMax'].some(key => !Number.isFinite(member[key]) || !Number.isFinite(template[key])) ||
        fields.hp?.writable !== true || fields.observeCount?.writable !== true || fields.escapeUnlocked?.writable !== true ||
        (!extended ? member.observeCount !== 0 : !Number.isSafeInteger(member.observeCount) || member.observeCount < 0) ||
        member.escapeUnlocked !== false || member.slot !== slot ||
        typeof member.instanceId !== 'string' || !/^combat_enemy_[1-9]\d*$/.test(member.instanceId) ||
        fields.slot?.writable !== false || fields.slot?.configurable !== false ||
        fields.instanceId?.writable !== false || fields.instanceId?.configurable !== false ||
        ids.has(member.instanceId) || findCombatEnemy(member.instanceId) !== member) fail();
    ids.add(member.instanceId);
  });
  const target = targetInstanceId === null ? null : findCombatEnemy(targetInstanceId);
  if (targetInstanceId !== null ? !target || target.hp === 0 : !members.some(member => member.hp > 0)) fail();
  return {members, target};
}

const FORMATION_PLAYER_STATUSES = Object.freeze(['poison','cursed','muddied','slither','burn','dazzled']);
const FORMATION_EFFECT_FIELDS = Object.freeze(['evadeTurns','bombFuse','bombDamage','bombIgnoresDef','bombTargetInstanceId','bombJustArmed']);

// One authored three-member relationship, not a general enemy-special system.
// Bind once to exact runtime identities; never infer a replacement by slot/name.
const RECEIVER_HEAVY_MULTIPLIER = 2;
function createReceiverCoordination(members) {
  const ids = ['enemy_gallery_receiver','enemy_gallery_caller','enemy_gallery_keeper'];
  if (members.length !== 3 || !ids.every(id => members.filter(e=>e.id===id).length === 1)) return null;
  const [receiverId,callerId,keeperId] = ids.map(id=>members.find(e=>e.id===id).instanceId);
  return {receiverId,callerId,keeperId,strikeRound:0,nextSignalRound:1};
}
function receiverGuardActive(coordination, members, targetId) {
  return !!coordination && targetId === coordination.receiverId &&
    members.some(e=>e.instanceId===coordination.keeperId && e.hp>0);
}
function receiverGuardedDamage(damage) { return Math.ceil(damage / 2); }

// Closed data copying for commands/history. Reject accessors, functions, sparse
// arrays and non-data objects instead of normalizing them through JSON.
function copyFormationData(value) {
  if (value === null || ['string','boolean'].includes(typeof value)) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value || typeof value !== 'object' ||
      ![Object.getPrototypeOf({}),Object.getPrototypeOf([]),null].includes(Object.getPrototypeOf(value)))
    throw new Error('Invalid formation data');
  const fields = Object.getOwnPropertyDescriptors(value);
  if (Array.isArray(value)) {
    if (Reflect.ownKeys(fields).length !== value.length + 1) throw new Error('Invalid formation data');
    const out=[];
    for (let i=0;i<value.length;i++) {
      if (!Object.hasOwn(fields[i] || {},'value')) throw new Error('Invalid formation data');
      out.push(copyFormationData(fields[i].value));
    }
    return Object.freeze(out);
  }
  const out = {};
  for (const key of Reflect.ownKeys(fields)) {
    if (typeof key !== 'string' || !Object.hasOwn(fields[key],'value')) throw new Error('Invalid formation data');
    Object.defineProperty(out,key,{value:copyFormationData(fields[key].value),enumerable:true});
  }
  return Object.freeze(out);
}
function formationRecord(value, keys) {
  if (!value || Array.isArray(value) || typeof value !== 'object' ||
      ![Object.getPrototypeOf({}),null].includes(Object.getPrototypeOf(value))) throw new Error('Invalid formation command');
  const fields = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(fields).length !== keys.length ||
      keys.some(key => !Object.hasOwn(fields[key] || {},'value'))) throw new Error('Invalid formation command');
  return copyFormationData(value);
}

// One transient round authority. This is accounting/provenance, not another HP,
// target or presentation authority. The session still owns its phase/cursor.
const formationRounds = (() => {
  let state = null;
  const requireState = () => {
    if (!state || combat.mode !== 'formation' || combat.enemies !== state.members)
      throw new Error('Invalid formation round state');
    return state;
  };
  const validatePolicy = policy => {
    const p = formationRecord(policy,['escape']);
    if (!['blocked','fastest_living'].includes(p.escape)) throw new Error('Invalid formation escape policy');
    return p;
  };
  return Object.freeze({
    validatePolicy,
    initialize(members, policy, bossLocked) {
      state = {members, policy:validatePolicy(policy), completed:0, pending:null, outcome:'ongoing',
        bossLocked, coordination:createReceiverCoordination(members), evadeAppliedRound:0, bombAppliedRound:0};
    },
    clear() {
      state = null;
      combat.evadeTurns=0; combat.bombFuse=0; combat.bombDamage=0;
      combat.bombIgnoresDef=false; combat.bombTargetInstanceId=null; combat.bombJustArmed=false;
    },
    prepare() {
      const s = requireState();
      const view = formationSessionController.getView();
      if (s.pending || s.outcome !== 'ongoing' || s.completed >= Number.MAX_SAFE_INTEGER ||
          (view && !['awaiting_action','targeting','item'].includes(view.phase)))
        throw new Error('Formation round requires completed and acknowledged playback');
      return Object.freeze({round:s.completed+1, escape:s.bossLocked ? 'blocked' : s.policy.escape});
    },
    applied(effect, round) { requireState()[effect === 'evade' ? 'evadeAppliedRound' : 'bombAppliedRound'] = round; },
    wasApplied(effect, round) { return requireState()[effect === 'evade' ? 'evadeAppliedRound' : 'bombAppliedRound'] === round; },
    coordination() { return state?.coordination ? copyFormationData(state.coordination) : null; },
    signal(round) {
      const c=requireState().coordination;
      c.strikeRound=round+1; c.nextSignalRound=round+2;
    },
    releaseSignal() { requireState().coordination.strikeRound=0; },
    finish(result, members) {
      // Defensive synchronous test hooks may remove an actor. Never attach an
      // old round to a newly initialized battle; its cancellations still return.
      if (!state || state.members !== members) return;
      const s = state;
      s.completed++;
      s.pending = copyFormationData(result);
      s.outcome = result.outcome;
    },
    isPending(result) {
      return !!state && state.members === combat.enemies &&
        JSON.stringify(state.pending) === JSON.stringify(result);
    },
    acknowledge(playback, frameIndex) {
      const s = requireState(), frame = projectFormationPlaybackFrame(playback,frameIndex);
      const view = formationSessionController.getView();
      if (!s.pending || frameIndex !== playback.frameCount-1 || frame.frameIndex !== frameIndex ||
          !frame.complete || (view && view.phase !== 'playback_complete') ||
          JSON.stringify(playback.frames.slice(1).map(f=>f.currentEvent)) !== JSON.stringify(s.pending.events) ||
          frame.outcome !== s.outcome) throw new Error('Invalid formation round acknowledgement');
      s.pending = null;
    },
    getView() {
      return state ? Object.freeze({completedRounds:state.completed, awaitingPlayback:!!state.pending,
        outcome:state.outcome, escapePolicy:state.bossLocked ? 'blocked' : state.policy.escape}) : null;
    },
  });
})();

// Headless callers explicitly present the reel's final frame before releasing
// the next round. The session calls this only from playback_complete.
function acknowledgeFormationRound(playback, frameIndex) { formationRounds.acknowledge(playback, frameIndex); }

function formationItemDefinition(itemId) {
  if (typeof itemId !== 'string' || !Object.hasOwn(ITEM_REGISTRY,itemId)) throw new Error('Invalid formation item');
  const item = copyFormationData(ITEM_REGISTRY[itemId]);
  const allowed=['name','type','price','bonus','heals','curesPoison','curesCursed','evadeTurns','evadeRate',
    'damage','minDamage','targetsAll','fuse','ignoresDef','impactVerb','stunTurns','sexBane','battleOnly','questItem','keyItem',
    'causesMuddied','defenseCapBypass','evadeAll','preventsCursed'];
  if (Object.keys(item).some(k=>!allowed.includes(k))) throw new Error('Unsupported formation item capability');
  if (item.keyItem || item.name !== itemId) throw new Error('Invalid formation item');
  if ((Object.hasOwn(item,'targetsAll') && (item.targetsAll !== true || item.type !== 'throwable' || item.fuse)) ||
      (Object.hasOwn(item,'minDamage') && (item.type !== 'throwable' || item.fuse || item.ignoresDef ||
        !Number.isSafeInteger(item.minDamage) || item.minDamage < 0 || item.minDamage > item.damage)))
    throw new Error('Unsupported formation item capability');
  const effect = item.sexBane ? 'reagent' : item.type === 'potion' ? (isStatusCureItem(item) ? 'cure' : 'heal') :
    item.type === 'buff' ? 'evade' : item.type === 'throwable' ? (item.fuse ? 'bomb' : item.targetsAll ? 'damage_all' : 'damage') :
    item.type === 'stun' ? 'stun' : slotForType(item.type) ? 'equip' : item.type === 'bait' ? 'nothing' : null;
  if (!effect) throw new Error('Unsupported formation item');
  return {item,effect,targeted:['reagent','bomb','damage','stun'].includes(effect)};
}

function formationEffectSnapshot() {
  return {evadeTurns:combat.evadeTurns, bombFuse:combat.bombFuse, bombDamage:combat.bombDamage,
    bombIgnoresDef:combat.bombIgnoresDef, bombTargetInstanceId:combat.bombTargetInstanceId,
    bombJustArmed:combat.bombJustArmed};
}
function formationCommandSnapshot() {
  const equipment={};
  for (const slot of ['weapon','armor','shield','accessory']) equipment[slot]=stats[slot] ? stats[slot].name : null;
  return copyFormationData({player:{id:'player',hp:stats.hp,maxHp:stats.maxHp,
      inventory:stats.items.map(item=>item.name),statuses:statusEffects.slice(),
      equipment,
      slitherSpd},
    enemies:combat.enemies.map(e=>({id:e.id,instanceId:e.instanceId,slot:e.slot,hp:e.hp,maxHp:e.maxHp,
      observeCount:e.observeCount,escapeUnlocked:e.escapeUnlocked})), effects:formationEffectSnapshot(),
    ...(formationRounds.coordination() ? {coordination:formationRounds.coordination()} : {})});
}

function validateFormationRoundCommand(action) {
  const type = Object.getOwnPropertyDescriptor(action || {},'type')?.value;
  let spec = null;
  if (type === 'item') spec = formationItemDefinition(Object.getOwnPropertyDescriptor(action,'itemId')?.value);
  const targeted = ['attack','observe'].includes(type) || spec?.targeted;
  const keys = type === 'item' ? ['type','itemId',...(targeted ? ['targetInstanceId'] : [])] :
    ['attack','observe'].includes(type) ? ['type','targetInstanceId'] : type === 'run' ? ['type'] : null;
  if (!keys) throw new Error('Invalid formation command');
  const command = formationRecord(action,keys);
  const {members,target} = validateFormationBasicAttackState(targeted ? {type:'attack',targetInstanceId:command.targetInstanceId} : undefined,true);
  const round = formationRounds.prepare();
  const inventoryFields = Object.getOwnPropertyDescriptors(stats.items || {});
  if (!Array.isArray(stats.items) || !Object.isExtensible(stats.items) ||
      inventoryFields.length?.writable !== true || Reflect.ownKeys(inventoryFields).length !== stats.items.length+1 ||
      Object.keys(inventoryFields).some(k=>k!=='length' &&
        (!Object.hasOwn(inventoryFields[k],'value') || !inventoryFields[k].writable || !inventoryFields[k].configurable)) || stats.items.some(item => {
    const fields=Object.getOwnPropertyDescriptors(item || {});
    return typeof fields.name?.value !== 'string' || !Object.hasOwn(ITEM_REGISTRY,fields.name.value);
  })) throw new Error('Invalid formation inventory');
  const item = spec ? stats.items.find(item=>item.name === command.itemId) : null;
  if (spec && (!item || JSON.stringify(copyFormationData(item)) !== JSON.stringify(spec.item))) throw new Error('Invalid formation item ownership');
  const effects = formationEffectSnapshot();
  if (!['evadeTurns','bombFuse','bombDamage'].every(k=>Number.isSafeInteger(effects[k]) && effects[k]>=0) ||
      typeof effects.bombIgnoresDef !== 'boolean' || typeof effects.bombJustArmed !== 'boolean' ||
      effects.bombJustArmed || FORMATION_EFFECT_FIELDS.some(k=>Object.getOwnPropertyDescriptor(combat,k)?.writable!==true) ||
      (effects.bombFuse > 0 ? !findCombatEnemy(effects.bombTargetInstanceId) :
        effects.bombTargetInstanceId !== null || effects.bombDamage!==0 || effects.bombIgnoresDef))
    throw new Error('Invalid formation duration state');
  // Extended histories name registry equipment, not arbitrary live objects.
  // Establish their representability before any initiative or effect RNG.
  const coordination=formationRounds.coordination();
  if (coordination && round.round > Number.MAX_SAFE_INTEGER-2) throw new Error('Unsafe formation signal round');
  const extended = !!coordination || type !== 'attack' || statusEffects.length > 0 || effects.evadeTurns > 0 || effects.bombFuse > 0;
  if (extended) {
    if (!Number.isSafeInteger(slitherSpd) || slitherSpd < 1 || slitherSpd > 20) throw new Error('Invalid formation speed state');
    for (const slot of ['weapon','armor','shield','accessory']) {
      const gear=stats[slot];
      if (gear && (!Object.hasOwn(ITEM_REGISTRY,gear.name) ||
          JSON.stringify(copyFormationData(gear)) !== JSON.stringify(copyFormationData(ITEM_REGISTRY[gear.name]))))
        throw new Error('Unsupported formation equipment');
    }
    formationCommandSnapshot();
  }
  // Validate possible incoming damage both before and after an equipment change.
  const candidates=[stats];
  if (spec?.effect === 'equip') {
    const candidate={...stats,[slotForType(item.type)]:item};
    if (!Number.isSafeInteger(item.bonus) || ![effectiveAtk(candidate),effectiveDef(candidate),effectiveSpd(candidate)].every(Number.isSafeInteger))
      throw new Error('Unsafe formation equipment');
    if (Object.getOwnPropertyDescriptor(stats,slotForType(item.type))?.writable!==true) throw new Error('Invalid formation equipment slot');
    candidates.push(candidate);
  }
  if ((type === 'attack' && !formationAttackNumbersAreSafe(effectiveAtk(),target.def)) ||
      members.some(e=>e.hp>0 && candidates.some(p=>!formationAttackNumbersAreSafe(e.atk,
        playerIncomingMitigation(e.atk,effectiveDef(p),p.armor?.defenseCapBypass === true),
        e.instanceId===coordination?.receiverId ? RECEIVER_HEAVY_MULTIPLIER : 1))))
    throw new Error('Unsupported formation basic Attack state or action');
  if (type === 'observe' && target.observeCount >= Number.MAX_SAFE_INTEGER) throw new Error('Invalid formation observation progress');
  if (spec) {
    for (const key of ['heals','damage','minDamage','fuse','evadeTurns','stunTurns']) {
      if (Object.hasOwn(item,key) && (!Number.isSafeInteger(item[key]) || item[key]<0)) throw new Error('Unsafe formation item numbers');
    }
    if (['damage','bomb'].includes(spec.effect) && !Number.isSafeInteger(offensiveItemDamage(item,target)))
      throw new Error('Unsafe formation item damage');
    if (spec.effect === 'damage_all' && members.some(e=>e.hp>0 && !Number.isSafeInteger(offensiveItemDamage(item,e))))
      throw new Error('Unsafe formation item damage');
    if (spec.effect === 'evade' && (item.evadeRate !== BULLET_TIME_EVADE_RATE || !item.evadeTurns)) throw new Error('Unsupported formation buff');
  }
  return {command,members,target,item,spec,...round};
}

// Compatibility API: retain its closed Attack-only schema and capability gate.
// All execution is delegated to the single generalized round below.
function resolveFormationBasicAttackRound(action) {
  validateFormationBasicAttackState(action);
  return resolveFormationRound(action);
}

// One committed player action, one initiative contest per living enemy, and
// one completion boundary even for early victory/defeat/escape. No presentation.
// Closed records: attack/observe + targetInstanceId; item + registry itemId
// (and targetInstanceId only for offensive items); run with no target/policy.
// Headless callers resolve -> create playback -> project the final frame ->
// acknowledgeFormationRound. The session supplies one confirmed menu command.
function resolveFormationRound(action) {
  const {command,members,target,item,spec,round,escape} = validateFormationRoundCommand(action);
  const targetInstanceId = target ? target.instanceId : 'player';
  const extended = !!formationRounds.coordination() || command.type !== 'attack' || statusEffects.length > 0 || combat.evadeTurns > 0 || combat.bombFuse > 0;
  const before = extended ? formationCommandSnapshot() : null;
  const events = [];
  // Retain the existing command-specific Slither contract: Attack/Observe
  // reroll before initiative, Item/Run use the current effective speed.
  if (['attack','observe'].includes(command.type) && hasStatusEffect('slither')) {
    const before = slitherSpd;
    slitherSpd = rollSlitherSpd();
    events.push({type:'speed',before,after:slitherSpd});
  }
  const playerId = 'player';
  const initiative = members.filter(member => member.hp > 0).map(member => ({
    actorId: member.instanceId,
    playerFirst: Math.random() < speedWinChance(effectiveSpd(), member.spd),
  }));
  const enemyAction = contest => ({actorType:'enemy', actorId:contest.actorId, targetId:playerId});
  const order = [
    ...initiative.filter(contest => !contest.playerFirst).map(enemyAction),
    {actorType:'player', actorId:playerId, targetId:targetInstanceId},
    ...initiative.filter(contest => contest.playerFirst).map(enemyAction),
  ];
  const finish = outcome => {
    // End effects occur once, never once per opponent or playback frame. An
    // application round is exempt; Bullet Time covers all 3 subsequent rounds.
    if (extended) {
      const effectsBefore = formationEffectSnapshot();
      if (combat.evadeTurns > 0 && !formationRounds.wasApplied('evade',round)) combat.evadeTurns--;
      events.push({type:'round_end',roundBefore:round-1,roundAfter:round,
        effectsBefore,effectsAfter:formationEffectSnapshot()});
    }
    events.push({type:'outcome', outcome});
    const result = extended ? {initiative,order,events,outcome,command,roundBefore:round-1,roundAfter:round,
      before,after:formationCommandSnapshot()} : {initiative, order, events, outcome};
    formationRounds.finish(result,members);
    return extended ? copyFormationData(result) : result;
  };
  // Re-resolve exact identity at execution, never template/name/slot fallback.
  // Membership cannot normally change during this synchronous basic-only round.
  const resolveMember = id => {
    const member = findCombatEnemy(id);
    return members.includes(member) ? member : null;
  };
  const breakSignal = () => {
    const c=formationRounds.coordination();
    if (c?.strikeRound && [c.callerId,c.receiverId].some(id=>resolveMember(id)?.hp===0)) {
      formationRounds.releaseSignal();
      events.push({type:'signal_broken',callerId:c.callerId,receiverId:c.receiverId,
        strikeRound:c.strikeRound,reason:resolveMember(c.callerId)?.hp===0 ? 'caller_dead' : 'receiver_dead'});
    }
  };
  const protect = (damage, recipient) => receiverGuardActive(formationRounds.coordination(),members,recipient.instanceId)
    ? receiverGuardedDamage(damage) : damage;
  for (const planned of order) {
    if (stats.hp <= 0) return finish('defeat');
    const actor = planned.actorType === 'enemy' ? resolveMember(planned.actorId) : stats;
    if (!actor || actor.hp <= 0) {
      events.push({type:'skip', ...planned, reason:actor ? 'actor_dead' : 'actor_removed'});
      continue;
    }
    const recipient = planned.actorType === 'player' && targetInstanceId !== playerId ? resolveMember(targetInstanceId) : stats;
    if (!recipient || recipient.hp <= 0) {
      events.push({type:'cancel', ...planned, reason:recipient ? 'target_dead' : 'target_removed'});
      continue;
    }
    if (planned.actorType === 'player' && command.type !== 'attack') {
      if (command.type === 'item') {
        if (!stats.items.includes(item)) {
          events.push({type:'cancel',...planned,reason:'item_removed'});
          continue;
        }
        const before = formationCommandSnapshot();
        const consumes = !['equip','nothing'].includes(spec.effect);
        if (spec.effect === 'heal') {
          stats.hp += healingItemAmount(item,stats.hp,stats.maxHp);
          if (MUDSLITHER_INFLICTABLE && item.causesMuddied) addStatusEffect('muddied');
        } else if (spec.effect === 'cure') applyStatusCure(item);
        else if (spec.effect === 'evade') {
          combat.evadeTurns=item.evadeTurns; formationRounds.applied('evade',round);
        } else if (spec.effect === 'damage') recipient.hp=Math.max(0,recipient.hp-protect(offensiveItemDamage(item,recipient),recipient));
        else if (spec.effect === 'damage_all') {
          // One simultaneous impact: determine protection before changing ANY
          // member's HP. Killing Keeper in this blast cannot expose Receiver
          // mid-blast or make damage depend on descriptor/slot order.
          const impacts=members.filter(e=>resolveMember(e.instanceId)===e && e.hp>0)
            .map(e=>({enemy:e,damage:protect(offensiveItemDamage(item,e),e)}));
          for (const {enemy,damage} of impacts) enemy.hp=Math.max(0,enemy.hp-damage);
        } else if (spec.effect === 'bomb') {
          combat.bombTargetInstanceId=recipient.instanceId; combat.bombFuse=item.fuse;
          combat.bombDamage=item.damage; combat.bombIgnoresDef=!!item.ignoresDef;
          combat.bombJustArmed=false; formationRounds.applied('bomb',round);
        } else if (spec.effect === 'reagent') {
          if (recipient.sex === item.sexBane) recipient.hp=0;
        } else if (spec.effect === 'equip') equipItem(item);
        // Trollbane's authored non-regenerator result and Bait's existing
        // non-equippable no-op are retained. No enemy capabilities are added.
        if (consumes) stats.items.splice(stats.items.indexOf(item),1);
        events.push({type:'item',...planned,itemId:command.itemId,effect:spec.effect,consumed:consumes,
          before,after:formationCommandSnapshot()});
      } else if (command.type === 'observe') {
        const count = recipient.observeCount++;
        events.push({type:'observe',...planned,countBefore:count,countAfter:recipient.observeCount,
          escapeBefore:recipient.escapeUnlocked,escapeAfter:recipient.escapeUnlocked,
          lines:[...getObservationText(recipient,count)]});
        // No member in the approved subset has observe-gated escape. Never
        // infer a group unlock from one member's observation progress.
      } else {
        const fastest = members.filter(e=>e.hp>0).reduce((a,b)=>b.spd>a.spd?b:a);
        const allowed = escape === 'fastest_living';
        const chance = allowed ? speedWinChance(effectiveSpd(),fastest.spd) : 0;
        const roll = allowed ? Math.random() : null;
        const success = allowed && roll < chance;
        events.push({type:'run',...planned,allowed,opponentId:fastest.instanceId,chance,roll,success});
        if (success) return finish('escape');
      }
      breakSignal();
      if (members.every(member=>member.hp===0)) return finish('victory');
      continue;
    }
    const coordination=formationRounds.coordination();
    if (planned.actorType==='enemy' && actor.instanceId===coordination?.callerId &&
        resolveMember(coordination.receiverId)?.hp>0 && !coordination.strikeRound && round>=coordination.nextSignalRound) {
      formationRounds.signal(round);
      events.push({type:'signal',...planned,receiverId:coordination.receiverId,
        strikeRound:round+1,nextSignalRound:round+2});
      continue; // Signalling replaces the attack and consumes no attack RNG.
    }
    const heavy=planned.actorType==='enemy' && actor.instanceId===coordination?.receiverId &&
      coordination.strikeRound>0 && coordination.strikeRound<=round && resolveMember(coordination.callerId)?.hp>0;
    // Existing production primitives; variance -> critical -> evasion, three
    // RNG calls only for an executing attack. No pre-rolled damage or effects.
    const roll = planned.actorType === 'player'
      ? rollAttackDamage(effectiveAtk(), recipient.def)
      : rollAttackDamage(actor.atk, effectivePlayerIncomingMitigation(actor.atk));
    // Existing curse rule, reached only for newly supported Cursed state.
    const fumbled = planned.actorType === 'player' && hasStatusEffect('cursed') && Math.random() < 0.25;
    if (fumbled) { roll.dmg=1; roll.crit=false; }
    if (heavy) { roll.dmg*=RECEIVER_HEAVY_MULTIPLIER; formationRounds.releaseSignal(); }
    const unprotectedDamage=roll.dmg;
    const guarded=planned.actorType==='player' && receiverGuardActive(coordination,members,recipient.instanceId);
    if (guarded) roll.dmg=receiverGuardedDamage(roll.dmg);
    const evaded = planned.actorType === 'player' ? enemyEvades(recipient) : playerEvades(actor);
    const hpBefore = recipient.hp;
    recipient.hp = Math.max(0, hpBefore - (evaded ? 0 : roll.dmg));
    events.push({type:heavy ? 'heavy_attack' : guarded ? 'guarded_attack' : 'attack', ...planned, attemptedDamage:roll.dmg,
      ...(guarded ? {unprotectedDamage,keeperId:coordination.keeperId} : {}),
      appliedDamage:hpBefore - recipient.hp, critical:roll.crit, evaded,
      hpBefore, hpAfter:recipient.hp});
    breakSignal();
    if (stats.hp <= 0) return finish('defeat');
    if (members.every(member => member.hp === 0)) return finish('victory');
  }
  if (hasStatusEffect('burn')) {
    const damage = Math.floor(Math.random()*21), hpBefore = stats.hp;
    stats.hp=Math.max(0,stats.hp-damage);
    events.push({type:'burn',targetId:'player',attemptedDamage:damage,appliedDamage:hpBefore-stats.hp,hpBefore,hpAfter:stats.hp});
    if (stats.hp===0) return finish('defeat');
  }
  if (combat.bombFuse > 0 && !formationRounds.wasApplied('bomb',round)) {
    const before = formationEffectSnapshot();
    combat.bombFuse--;
    const recipient = resolveMember(combat.bombTargetInstanceId);
    const hpBefore = recipient ? recipient.hp : null;
    const damage = recipient && recipient.hp > 0 && combat.bombFuse===0 ? protect(offensiveItemDamage(
      {damage:combat.bombDamage,ignoresDef:combat.bombIgnoresDef},recipient),recipient) : 0;
    if (recipient && damage) recipient.hp=Math.max(0,recipient.hp-damage);
    if (combat.bombFuse===0 || !recipient || recipient.hp===0) {
      combat.bombFuse=0;combat.bombTargetInstanceId=null;combat.bombDamage=0;combat.bombIgnoresDef=false;
    }
    events.push({type:'bomb_tick',targetId:before.bombTargetInstanceId,before,after:formationEffectSnapshot(),
      attemptedDamage:damage,appliedDamage:recipient ? hpBefore-recipient.hp : 0,hpBefore,hpAfter:recipient ? recipient.hp : null});
    breakSignal();
    if (members.every(member=>member.hp===0)) return finish('victory');
  }
  return finish('ongoing');
}

// HEADLESS historical projection only. Create immediately after resolution,
// before another round or external HP/membership changes. No live references,
// gameplay helpers, RNG, queues, or writes cross into this detached film reel.
function createFormationRoundPlayback(roundResult) {
  if (Object.hasOwn(roundResult || {},'command')) return createFormationCommandPlayback(roundResult);
  const fail = () => { throw new Error('Invalid formation playback history or final snapshot'); };
  const plain = value => value && typeof value === 'object' && !Array.isArray(value) &&
    [Object.getPrototypeOf({}), null].includes(Object.getPrototypeOf(value));
  const record = (value, keys) => {
    if (!plain(value)) fail();
    const fields = Object.getOwnPropertyDescriptors(value);
    if (Reflect.ownKeys(fields).length !== keys.length ||
        keys.some(key => !fields[key] || !Object.hasOwn(fields[key], 'value'))) fail();
    return Object.fromEntries(keys.map(key => [key, fields[key].value]));
  };
  const array = value => {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Object.getPrototypeOf([]) ||
        Reflect.ownKeys(value).length !== value.length + 1) fail();
    const copy = [];
    for (let i = 0; i < value.length; i++) {
      const field = Object.getOwnPropertyDescriptor(value, String(i));
      if (!field || !Object.hasOwn(field, 'value')) fail();
      copy.push(field.value);
    }
    return copy;
  };
  const snapshot = (value, keys) => {
    if (!plain(value)) fail();
    const fields = Object.getOwnPropertyDescriptors(value);
    if (keys.some(key => !fields[key] || !Object.hasOwn(fields[key], 'value'))) fail();
    return Object.fromEntries(keys.map(key => [key, fields[key].value]));
  };
  const validHp = (hp, maxHp) => Number.isSafeInteger(hp) && hp >= 0 && hp <= maxHp;
  if (combat.mode !== 'formation' || !formationExecutionStateAllowed() || !Object.isFrozen(combat.enemies)) fail();
  const player = snapshot(stats, ['hp', 'maxHp']);
  const enemies = array(combat.enemies).map(member => snapshot(member, ['id', 'instanceId', 'slot', 'hp', 'maxHp']));
  if (enemies.length < 2 || enemies.length > 3) fail();
  const participants = new Map([['player', player]]);
  enemies.forEach((enemy, slot) => {
    if (typeof enemy.id !== 'string' || typeof enemy.instanceId !== 'string' ||
        !/^combat_enemy_[1-9]\d*$/.test(enemy.instanceId) || enemy.slot !== slot ||
        participants.has(enemy.instanceId)) fail();
    participants.set(enemy.instanceId, enemy);
  });
  for (const participant of participants.values()) {
    if (!Number.isSafeInteger(participant.maxHp) || participant.maxHp <= 0 || !validHp(participant.hp, participant.maxHp)) fail();
  }
  const result = record(roundResult, ['initiative', 'order', 'events', 'outcome']);
  if (!['ongoing', 'victory', 'defeat'].includes(result.outcome)) fail();
  const initiative = array(result.initiative).map(value => Object.freeze(record(value, ['actorId', 'playerFirst'])));
  let previousSlot = -1;
  for (const contest of initiative) {
    const member = participants.get(contest.actorId);
    if (!member || contest.actorId === 'player' || member.slot <= previousSlot || typeof contest.playerFirst !== 'boolean') fail();
    previousSlot = member.slot;
  }
  if (initiative.length < 1 || initiative.length > enemies.length) fail();
  const actionKeys = ['actorType', 'actorId', 'targetId'];
  const checkAction = action => {
    if (action.actorType === 'player') {
      if (action.actorId !== 'player' || action.targetId === 'player' || !participants.has(action.targetId)) fail();
    } else if (action.actorType === 'enemy') {
      if (action.actorId === 'player' || !participants.has(action.actorId) || action.targetId !== 'player') fail();
    } else fail();
  };
  const order = array(result.order).map(value => {
    const action = record(value, actionKeys); checkAction(action); return Object.freeze(action);
  });
  // Check recorded grouping, never recalculate initiative or combat decisions.
  const expectedIds = [...initiative.filter(c => !c.playerFirst).map(c => c.actorId),
    'player', ...initiative.filter(c => c.playerFirst).map(c => c.actorId)];
  if (order.length !== expectedIds.length || order.some((action,i) => action.actorId !== expectedIds[i])) fail();
  const preparedIds = new Set(initiative.map(contest => contest.actorId));
  if (enemies.some(enemy => enemy.hp > 0 && !preparedIds.has(enemy.instanceId)) ||
      !preparedIds.has(order.find(action => action.actorId === 'player').targetId)) fail();
  const sourceEvents = array(result.events);
  if (sourceEvents.length < 2 || sourceEvents.length > order.length + 1) fail();
  const events = sourceEvents.map((value, index) => {
    if (!plain(value)) fail();
    const type = Object.getOwnPropertyDescriptor(value, 'type')?.value;
    if (type === 'outcome') {
      const event = record(value, ['type', 'outcome']);
      if (index !== sourceEvents.length - 1 || event.outcome !== result.outcome) fail();
      return Object.freeze(event);
    }
    const keys = type === 'attack'
      ? ['attemptedDamage', 'appliedDamage', 'critical', 'evaded', 'hpBefore', 'hpAfter']
      : (type === 'skip' || type === 'cancel') ? ['reason'] : null;
    if (!keys || index >= order.length) fail();
    const event = record(value, ['type', ...actionKeys, ...keys]);
    checkAction(event);
    if (actionKeys.some(key => event[key] !== order[index][key])) fail();
    if (type === 'attack') {
      const target = participants.get(event.targetId);
      if (!validHp(event.hpBefore, target.maxHp) || event.hpBefore === 0 ||
          !validHp(event.hpAfter, target.maxHp) || event.hpAfter > event.hpBefore ||
          !Number.isSafeInteger(event.attemptedDamage) || event.attemptedDamage < 1 ||
          !Number.isSafeInteger(event.appliedDamage) || event.appliedDamage !== event.hpBefore - event.hpAfter ||
          typeof event.critical !== 'boolean' || typeof event.evaded !== 'boolean' ||
          event.appliedDamage !== (event.evaded ? 0 : Math.min(event.hpBefore, event.attemptedDamage))) fail();
    } else {
      const reasons = type === 'skip' ? ['actor_dead', 'actor_removed'] : ['target_dead', 'target_removed'];
      if (!reasons.includes(event.reason)) fail();
    }
    return Object.freeze(event);
  });
  if (events.at(-1).type !== 'outcome' ||
      (result.outcome === 'ongoing' && events.length !== order.length + 1)) fail();
  const actualOutcome = player.hp === 0 ? 'defeat' : enemies.every(enemy => enemy.hp === 0) ? 'victory' : 'ongoing';
  if (result.outcome !== actualOutcome) fail();

  const finalHp = new Map([...participants].map(([id,participant]) => [id, participant.hp]));
  const projectedHp = new Map(finalHp);
  // Reverse only recorded HP transitions in detached numeric storage. Members
  // never targeted use their final snapshot unchanged throughout the reel.
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.type !== 'attack') continue;
    if (projectedHp.get(event.targetId) !== event.hpAfter) fail();
    projectedHp.set(event.targetId, event.hpBefore);
  }
  let visibleOutcome = 'ongoing';
  const frames = [];
  const frame = (frameIndex, currentEvent) => Object.freeze({
    frameIndex, eventIndex:frameIndex - 1, currentEvent,
    player:Object.freeze({id:'player', hp:projectedHp.get('player'), maxHp:player.maxHp}),
    enemies:Object.freeze(enemies.map(enemy => Object.freeze({...enemy, hp:projectedHp.get(enemy.instanceId)}))),
    complete:frameIndex === events.length, outcome:visibleOutcome,
  });
  frames.push(frame(0, null));
  events.forEach((event, index) => {
    const terminalHp = projectedHp.get('player') === 0 || enemies.every(enemy => projectedHp.get(enemy.instanceId) === 0);
    if (event.type !== 'outcome' && terminalHp) fail();
    if (event.type === 'attack') {
      if (projectedHp.get(event.actorId) === 0 || projectedHp.get(event.targetId) !== event.hpBefore) fail();
      projectedHp.set(event.targetId, event.hpAfter);
    } else if (event.type === 'skip') {
      // Removed identities cannot be historical participants in this retained,
      // fixed-membership contract. A live actor cannot claim a dead-actor skip.
      if (event.reason !== 'actor_dead' || projectedHp.get(event.actorId) !== 0) fail();
    } else if (event.type === 'cancel') {
      // A dead actor would have been skipped first. Missing-target claims are
      // likewise impossible for the queued, retained target already validated.
      if (event.reason !== 'target_dead' || projectedHp.get(event.actorId) === 0 ||
          projectedHp.get(event.targetId) !== 0) fail();
    } else if (event.type === 'outcome') visibleOutcome = event.outcome;
    frames.push(frame(index + 1, event));
  });
  if ([...finalHp].some(([id,hp]) => projectedHp.get(id) !== hp) || visibleOutcome !== result.outcome) fail();
  return Object.freeze({eventCount:events.length, frameCount:frames.length,
    initiative:Object.freeze(initiative), order:Object.freeze(order), frames:Object.freeze(frames)});
}

// New command histories extend the same immutable frame contract. Validation
// uses detached values exclusively; it never calls an effect, combat roll,
// duration tick, inventory writer, observation writer or finalizer.
function createFormationCommandPlayback(source) {
  const fail = () => { throw new Error('Invalid formation playback history or final snapshot'); };
  let result;
  try { result = formationRecord(source,['initiative','order','events','outcome','command','roundBefore','roundAfter','before','after']); }
  catch (_) { fail(); }
  // The pending round is an immutable receipt, not a second state authority.
  // In particular, authored observation text and random escape results cannot
  // be substituted with plausible but unauthentic history.
  if (!formationRounds.isPending(result)) fail();
  const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const record = (v,keys) => { try { return formationRecord(v,keys); } catch (_) { fail(); } };
  const safe = n => Number.isSafeInteger(n) && n >= 0;
  const hp = (n,max) => safe(n) && n <= max;
  if (combat.mode !== 'formation' || !formationExecutionStateAllowed() ||
      !safe(result.roundBefore) || result.roundAfter !== result.roundBefore+1 ||
      !Number.isSafeInteger(result.roundAfter) || !['ongoing','victory','defeat','escape'].includes(result.outcome) ||
      !Array.isArray(result.events) || !Array.isArray(result.order) || !Array.isArray(result.initiative)) fail();
  const members = combat.enemies;
  const effects = value => {
    record(value,FORMATION_EFFECT_FIELDS);
    if (!['evadeTurns','bombFuse','bombDamage'].every(k=>safe(value[k])) ||
        typeof value.bombIgnoresDef !== 'boolean' || typeof value.bombJustArmed !== 'boolean' ||
        (value.bombFuse > 0 ? !members.some(e=>e.instanceId===value.bombTargetInstanceId) : value.bombTargetInstanceId !== null)) fail();
  };
  const binding=createReceiverCoordination(members);
  const coordination = value => {
    record(value,['receiverId','callerId','keeperId','strikeRound','nextSignalRound']);
    if (!binding || ['receiverId','callerId','keeperId'].some(k=>value[k]!==binding[k]) ||
        !safe(value.strikeRound) || !safe(value.nextSignalRound) || value.nextSignalRound<1 ||
        (value.strikeRound>0 && value.nextSignalRound!==value.strikeRound+1)) fail();
  };
  const snapshot = value => {
    record(value,['player','enemies','effects',...(binding ? ['coordination'] : [])]);
    if (binding) coordination(value.coordination);
    const p=record(value.player,['id','hp','maxHp','inventory','statuses','equipment','slitherSpd']);
    if (p.id !== 'player' || !safe(p.maxHp) || p.maxHp===0 || !hp(p.hp,p.maxHp) ||
        !Array.isArray(p.inventory) || p.inventory.some(id=>typeof id!=='string' || !Object.hasOwn(ITEM_REGISTRY,id)) ||
        !Array.isArray(p.statuses) || new Set(p.statuses).size!==p.statuses.length || p.statuses.some(s=>!FORMATION_PLAYER_STATUSES.includes(s)) ||
        !safe(p.slitherSpd) || p.slitherSpd<1 || p.slitherSpd>20) fail();
    record(p.equipment,['weapon','armor','shield','accessory']);
    for (const [slot,id] of Object.entries(p.equipment)) if (id!==null &&
        (typeof id!=='string' || !Object.hasOwn(ITEM_REGISTRY,id) || ITEM_REGISTRY[id].type!==slot)) fail();
    if (!Array.isArray(value.enemies) || value.enemies.length!==members.length) fail();
    value.enemies.forEach((e,i)=>{
      record(e,['id','instanceId','slot','hp','maxHp','observeCount','escapeUnlocked']);
      if (e.id!==members[i].id || e.instanceId!==members[i].instanceId || e.slot!==i ||
          !safe(e.maxHp) || e.maxHp===0 || !hp(e.hp,e.maxHp) || !safe(e.observeCount) || e.escapeUnlocked!==false) fail();
    });
    effects(value.effects);
  };
  snapshot(result.before); snapshot(result.after);
  if (!equal(result.after,formationCommandSnapshot()) || result.before.player.maxHp!==result.after.player.maxHp ||
      result.before.enemies.some((e,i)=>e.maxHp!==result.after.enemies[i].maxHp)) fail();
  const command=result.command;
  let spec=null;
  try { if (command.type==='item') spec=formationItemDefinition(command.itemId); } catch (_) { fail(); }
  const targeted=['attack','observe'].includes(command.type) || !!spec?.targeted;
  const keys=command.type==='item' ? ['type','itemId',...(targeted?['targetInstanceId']:[])] :
    ['attack','observe'].includes(command.type) ? ['type','targetInstanceId'] : command.type==='run' ? ['type'] : null;
  if (!keys) fail(); record(command,keys);
  const targetId=targeted ? command.targetInstanceId : 'player';
  if (targeted && !result.before.enemies.some(e=>e.instanceId===targetId && e.hp>0)) fail();
  const initialLiving=result.before.enemies.filter(e=>e.hp>0);
  if (result.initiative.length!==initialLiving.length) fail();
  result.initiative.forEach((c,i)=>{
    record(c,['actorId','playerFirst']);
    if (c.actorId!==initialLiving[i].instanceId || typeof c.playerFirst!=='boolean') fail();
  });
  const expected=[...result.initiative.filter(c=>!c.playerFirst).map(c=>({actorType:'enemy',actorId:c.actorId,targetId:'player'})),
    {actorType:'player',actorId:'player',targetId},
    ...result.initiative.filter(c=>c.playerFirst).map(c=>({actorType:'enemy',actorId:c.actorId,targetId:'player'}))];
  if (!equal(expected,result.order)) fail();
  const clone = v => ({player:{...v.player,inventory:[...v.player.inventory],statuses:[...v.player.statuses],equipment:{...v.player.equipment}},
    enemies:v.enemies.map(e=>({...e})),effects:{...v.effects},...(binding ? {coordination:{...v.coordination}} : {})});
  let state=clone(result.before), orderIndex=0, escaped=false, ended=false, outcome='ongoing';
  let appliedEvade=false, appliedBomb=false, sawBomb=false, sawBurn=false, sawSpeed=false;
  const frames=[];
  const entity=id=>id==='player' ? state.player : state.enemies.find(e=>e.instanceId===id);
  const terminal=()=>state.player.hp===0 ? 'defeat' : state.enemies.every(e=>e.hp===0) ? 'victory' : escaped ? 'escape' : 'ongoing';
  const frame=(index,event)=>copyFormationData({frameIndex:index,eventIndex:index-1,currentEvent:event,
    player:state.player,enemies:state.enemies,effects:state.effects,
    completedRounds:ended ? result.roundAfter : result.roundBefore,
    complete:index===result.events.length,outcome,...(binding ? {coordination:state.coordination} : {})});
  frames.push(frame(0,null));
  const checkAction=(event,extra)=>{
    record(event,['type','actorType','actorId','targetId',...extra]);
    const planned=expected[orderIndex++];
    if (!planned || ['actorType','actorId','targetId'].some(k=>event[k]!==planned[k])) fail();
  };
  const damage=(event,allowZero=false)=>{
    const target=entity(event.targetId);
    if (!target || !hp(event.hpBefore,target.maxHp) || target.hp!==event.hpBefore ||
        !hp(event.hpAfter,target.maxHp) || event.hpAfter>event.hpBefore ||
        !safe(event.attemptedDamage) || (!allowZero && event.attemptedDamage===0) ||
        !safe(event.appliedDamage) || event.appliedDamage!==event.hpBefore-event.hpAfter ||
        event.appliedDamage!==(event.evaded ? 0 : Math.min(event.hpBefore,event.attemptedDamage))) fail();
    target.hp=event.hpAfter;
  };
  result.events.forEach((event,index)=>{
    if (!event || typeof event.type!=='string' || (ended && event.type!=='outcome')) fail();
    if (!['round_end','outcome','signal_broken'].includes(event.type) && terminal()!=='ongoing') fail();
    if (event.type==='speed') {
      record(event,['type','before','after']);
      if (index!==0 || sawSpeed || !state.player.statuses.includes('slither') || event.before!==state.player.slitherSpd ||
          !safe(event.after) || event.after<1 || event.after>20) fail();
      state.player.slitherSpd=event.after;sawSpeed=true;
    } else if (['attack','heavy_attack','guarded_attack'].includes(event.type)) {
      checkAction(event,['attemptedDamage','appliedDamage','critical','evaded','hpBefore','hpAfter',
        ...(event.type==='guarded_attack' ? ['unprotectedDamage','keeperId'] : [])]);
      if (entity(event.actorId)?.hp<=0 || entity(event.targetId)?.hp<=0 ||
          (event.actorId==='player' && command.type!=='attack') || typeof event.critical!=='boolean' || typeof event.evaded!=='boolean') fail();
      const c=state.coordination;
      const heavy=!!c && event.actorId===c.receiverId && c.strikeRound>0 && c.strikeRound<=result.roundAfter && entity(c.callerId)?.hp>0;
      const guarded=event.actorId==='player' && receiverGuardActive(c,state.enemies,event.targetId);
      if (event.type!==(heavy ? 'heavy_attack' : guarded ? 'guarded_attack' : 'attack')) fail();
      if (guarded && (event.keeperId!==c.keeperId || !safe(event.unprotectedDamage) || event.unprotectedDamage===0 ||
          event.attemptedDamage!==receiverGuardedDamage(event.unprotectedDamage))) fail();
      if (heavy) {
        if (event.attemptedDamage%RECEIVER_HEAVY_MULTIPLIER!==0) fail();
        c.strikeRound=0;
      }
      damage(event);
    } else if (event.type==='signal') {
      checkAction(event,['receiverId','strikeRound','nextSignalRound']);
      const c=state.coordination;
      if (!c || event.actorId!==c.callerId || event.receiverId!==c.receiverId ||
          entity(c.callerId)?.hp<=0 || entity(c.receiverId)?.hp<=0 || c.strikeRound!==0 ||
          result.roundAfter<c.nextSignalRound || event.strikeRound!==result.roundAfter+1 ||
          event.nextSignalRound!==result.roundAfter+2) fail();
      c.strikeRound=event.strikeRound;c.nextSignalRound=event.nextSignalRound;
    } else if (event.type==='signal_broken') {
      record(event,['type','callerId','receiverId','strikeRound','reason']);
      const c=state.coordination;
      if (!c || !c.strikeRound || event.strikeRound!==c.strikeRound ||
          event.callerId!==c.callerId || event.receiverId!==c.receiverId ||
          event.reason!==(entity(c.callerId)?.hp===0 ? 'caller_dead' : entity(c.receiverId)?.hp===0 ? 'receiver_dead' : null)) fail();
      c.strikeRound=0;
    } else if (event.type==='skip' || event.type==='cancel') {
      checkAction(event,['reason']);
      if (event.type==='skip' ? event.reason!=='actor_dead' || entity(event.actorId)?.hp!==0 :
          event.reason!=='target_dead' || entity(event.actorId)?.hp<=0 || entity(event.targetId)?.hp!==0) fail();
    } else if (event.type==='item') {
      checkAction(event,['itemId','effect','consumed','before','after']);
      if (command.type!=='item' || event.actorId!=='player' || state.player.hp<=0 || entity(targetId)?.hp<=0 ||
          event.itemId!==command.itemId || event.effect!==spec.effect || !equal(event.before,state)) fail();
      snapshot(event.after);
      const next=clone(state), p=next.player, target=targetId==='player'?p:next.enemies.find(e=>e.instanceId===targetId), item=spec.item;
      const index=p.inventory.indexOf(command.itemId), consumes=!['equip','nothing'].includes(spec.effect);
      if (index<0 || event.consumed!==consumes) fail();
      if (consumes) p.inventory.splice(index,1);
      if (spec.effect==='heal') {
        const restored=event.after.player.hp-p.hp;
        if (!safe(restored) || restored!==Math.min(item.heals || 0,p.maxHp-p.hp)) fail();
        p.hp=event.after.player.hp;
        if (MUDSLITHER_INFLICTABLE && item.causesMuddied && !p.statuses.includes('muddied')) p.statuses.push('muddied');
      } else if (spec.effect==='cure') {
        p.statuses=p.statuses.filter(status=>!itemCuredStatuses(item).includes(status));
      } else if (spec.effect==='evade') {next.effects.evadeTurns=item.evadeTurns;appliedEvade=true;}
      else if (spec.effect==='damage') {
        const after=event.after.enemies.find(e=>e.instanceId===targetId).hp;
        let attempted=offensiveItemDamage(item,members.find(e=>e.instanceId===targetId));
        if (receiverGuardActive(state.coordination,state.enemies,targetId)) attempted=receiverGuardedDamage(attempted);
        if (after!==Math.max(0,target.hp-attempted)) fail();
        target.hp=after;
      } else if (spec.effect==='damage_all') {
        // Validate the copied history against pre-impact protection. Only the
        // detached next snapshot is changed, never a live combatant.
        for (const member of next.enemies.filter(e=>e.hp>0)) {
          let attempted=offensiveItemDamage(item,members.find(e=>e.instanceId===member.instanceId));
          if (receiverGuardActive(state.coordination,state.enemies,member.instanceId)) attempted=receiverGuardedDamage(attempted);
          member.hp=Math.max(0,member.hp-attempted);
        }
      } else if (spec.effect==='bomb') {
        Object.assign(next.effects,{bombFuse:item.fuse,bombDamage:item.damage,bombIgnoresDef:!!item.ignoresDef,
          bombTargetInstanceId:targetId,bombJustArmed:false});appliedBomb=true;
      } else if (spec.effect==='equip') {
        const slot=item.type;
        if (p.equipment[slot]) p.inventory.push(p.equipment[slot]);
        p.equipment[slot]=item.name;p.inventory.splice(index,1);
      }
      // Approved enemies have neither sex nor regeneration. Their authored
      // mismatch result is a consumed, spent action with no enemy-state change.
      if (!equal(next,event.after)) fail();state=next;
    } else if (event.type==='observe') {
      checkAction(event,['countBefore','countAfter','escapeBefore','escapeAfter','lines']);
      const target=entity(event.targetId);
      if (command.type!=='observe' || event.actorId!=='player' || state.player.hp<=0 || !target || target.hp<=0 ||
          event.countBefore!==target.observeCount || event.countAfter!==event.countBefore+1 || !safe(event.countAfter) ||
          event.escapeBefore!==target.escapeUnlocked || event.escapeAfter!==event.escapeBefore ||
          !Array.isArray(event.lines) || !event.lines.length || event.lines.some(s=>typeof s!=='string')) fail();
      target.observeCount=event.countAfter;
    } else if (event.type==='run') {
      checkAction(event,['allowed','opponentId','chance','roll','success']);
      const living=state.enemies.filter(e=>e.hp>0);
      const fastest=living.reduce((a,b)=>members[b.slot].spd>members[a.slot].spd?b:a);
      const allowed=formationRounds.getView()?.escapePolicy==='fastest_living';
      if (command.type!=='run' || event.actorId!=='player' || state.player.hp<=0 || event.allowed!==allowed ||
          event.opponentId!==fastest.instanceId || typeof event.success!=='boolean' ||
          (allowed ? event.chance<0.1 || event.chance>0.9 || typeof event.roll!=='number' || event.roll<0 || event.roll>=1 ||
             event.success!==(event.roll<event.chance) : event.chance!==0 || event.roll!==null || event.success!==false)) fail();
      escaped=event.success;
    } else if (event.type==='burn') {
      record(event,['type','targetId','attemptedDamage','appliedDamage','hpBefore','hpAfter']);
      if (orderIndex!==expected.length || sawBurn || sawBomb || !state.player.statuses.includes('burn') ||
          event.targetId!=='player' || event.attemptedDamage>20) fail();
      damage(event,true);sawBurn=true;
    } else if (event.type==='bomb_tick') {
      record(event,['type','targetId','before','after','attemptedDamage','appliedDamage','hpBefore','hpAfter']);
      if (orderIndex!==expected.length || sawBomb || appliedBomb || state.effects.bombFuse<=0 ||
          !equal(event.before,state.effects) || event.targetId!==state.effects.bombTargetInstanceId) fail();
      const target=entity(event.targetId);if (!target) fail();
      const remaining=state.effects.bombFuse-1;
      let expectedDamage=remaining===0 && target.hp>0 ? (state.effects.bombIgnoresDef ? state.effects.bombDamage :
        Math.max(1,state.effects.bombDamage-members.find(e=>e.instanceId===target.instanceId).def)) : 0;
      if (receiverGuardActive(state.coordination,state.enemies,event.targetId)) expectedDamage=receiverGuardedDamage(expectedDamage);
      if (event.attemptedDamage!==expectedDamage) fail();damage(event,true);
      state.effects.bombFuse=remaining;
      if (remaining===0 || target.hp===0) Object.assign(state.effects,{bombFuse:0,bombDamage:0,bombTargetInstanceId:null,bombIgnoresDef:false});
      if (!equal(event.after,state.effects)) fail();sawBomb=true;
    } else if (event.type==='round_end') {
      record(event,['type','roundBefore','roundAfter','effectsBefore','effectsAfter']);
      if (ended || index!==result.events.length-2 || event.roundBefore!==result.roundBefore || event.roundAfter!==result.roundAfter ||
          !equal(event.effectsBefore,state.effects) || (terminal()==='ongoing' && orderIndex!==expected.length) ||
          (terminal()==='ongoing' && state.player.statuses.includes('burn') && !sawBurn) ||
          (terminal()==='ongoing' && state.effects.bombFuse>0 && !appliedBomb && !sawBomb)) fail();
      if (state.effects.evadeTurns>0 && !appliedEvade) state.effects.evadeTurns--;
      if (!equal(event.effectsAfter,state.effects)) fail();ended=true;
    } else if (event.type==='outcome') {
      record(event,['type','outcome']);
      if (!ended || index!==result.events.length-1 || event.outcome!==result.outcome || event.outcome!==terminal()) fail();
      outcome=event.outcome;
    } else fail();
    frames.push(frame(index+1,event));
  });
  if (!ended || outcome!==result.outcome || result.events.at(-1)?.type!=='outcome' ||
      (result.before.player.statuses.includes('slither') && ['attack','observe'].includes(command.type))!==sawSpeed ||
      !equal(state,result.after)) fail();
  return Object.freeze({eventCount:result.events.length,frameCount:frames.length,
    initiative:result.initiative,order:result.order,frames:Object.freeze(frames)});
}

// Stateless random access. All frames already contain immutable value snapshots;
// repeated/out-of-order reads never advance a cursor or consult live combat.
function projectFormationPlaybackFrame(playback, frameIndex) {
  const fields = playback && typeof playback === 'object' ? Object.getOwnPropertyDescriptors(playback) : {};
  const keys = ['eventCount', 'frameCount', 'initiative', 'order', 'frames'];
  if (!Object.isFrozen(playback) || Reflect.ownKeys(fields).length !== keys.length ||
      keys.some(key => !fields[key] || !Object.hasOwn(fields[key], 'value'))) throw new Error('Invalid formation playback reel');
  const frames = fields.frames.value, frameCount = fields.frameCount.value;
  if (!Array.isArray(frames) || !Object.isFrozen(frames) || frameCount !== frames.length ||
      frameCount !== fields.eventCount.value + 1) throw new Error('Invalid formation playback reel');
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= frameCount) {
    throw new RangeError('Formation playback frame index out of bounds');
  }
  const frame = Object.getOwnPropertyDescriptor(frames, String(frameIndex));
  if (!frame || !Object.hasOwn(frame, 'value') || !Object.isFrozen(frame.value)) throw new Error('Invalid formation playback frame');
  return frame.value;
}

// No save binding. The closure is the sole
// session authority; members is only a membership-identity binding, never an HP
// copy. Public views contain primitive data and immutable historical frames.
const formationSessionController = (() => {
  let session = null;
  const fail = () => { throw new Error('Invalid formation session operation or stale state'); };
  const requirePhase = phases => {
    if (!session || !phases.includes(session.phase) || combat.mode !== 'formation' ||
        !formationExecutionStateAllowed() || combat.enemies !== session.members) fail();
    return session;
  };
  const selectedAction = state => ({...state.command, targetInstanceId:state.selectedTargetInstanceId});
  const validateSelection = state => validateFormationBasicAttackState({type:'attack',targetInstanceId:state.selectedTargetInstanceId},true);
  const itemRows = () => groupItems().map(({name,item,count}) => Object.freeze({itemId:name,name,count,
    detail:itemStatParen(item), targetsEnemy:formationItemDefinition(name).targeted}));
  const itemWindow = (cursor,total) => Math.max(0,Math.min(cursor-1,Math.max(0,total-3)));
  const resolve = (state, command) => {
    if (state.playback !== null || state.frameIndex !== null) fail();
    const result = resolveFormationRound(command);
    const playback = createFormationRoundPlayback(result);
    state.playback = playback;
    state.frameIndex = 0;
    state.selectedTargetInstanceId = null;
    state.command = null;
    state.phase = 'playback';
    return getView();
  };
  const targetCommand = (state, command) => {
    const {members} = validateFormationBasicAttackState(undefined,true);
    state.command = Object.freeze(command);
    state.selectedTargetInstanceId = (command.type === 'item' &&
      members.find(member=>member.hp>0 && member.instanceId===state.itemTargetInstanceId) ||
      members.find(member=>member.hp>0)).instanceId;
    state.phase = 'targeting';
    return getView();
  };
  const chooseCommand = (state, type) => {
    validateFormationBasicAttackState(undefined,true);
    if (type === 'run') return resolve(state,{type});
    if (type === 'item') {
      const rows = itemRows();
      state.itemCursor = Math.min(state.itemCursor,rows.length);
      state.phase = 'item';
      return getView();
    }
    return targetCommand(state,{type});
  };
  const getView = function() {
    if (arguments.length) fail();
    if (!session) return null;
    const state = requirePhase(['awaiting_action', 'targeting', 'item', 'playback', 'playback_complete', 'victory', 'defeat', 'escape']);
    const frame = state.playback ? projectFormationPlaybackFrame(state.playback, state.frameIndex) : null;
    // During playback even living-target information follows historical HP,
    // not the resolver's already-final live HP. Targeting is unavailable then.
    const members = frame ? frame.enemies : state.members;
    const items = state.phase === 'item' || state.command?.type === 'item' ? itemRows() : [];
    return Object.freeze({
      phase:state.phase,
      // Detached presentation roster. Playback must never reveal resolved live
      // HP ahead of its historical frame; non-playback phases snapshot live HP.
      player:Object.freeze({id:'player', name:stats.name,
        hp:frame ? frame.player.hp : stats.hp, maxHp:frame ? frame.player.maxHp : stats.maxHp}),
      playerStatuses:Object.freeze(frame ? [...(frame.player.statuses || [])] : [...statusEffects]),
      evadeTurns:frame ? (frame.effects?.evadeTurns || 0) : combat.evadeTurns,
      // The warning and guard follow the same historical frame as HP.
      ...((frame ? frame.coordination : formationRounds.coordination())
        ? {coordination:frame ? frame.coordination : formationRounds.coordination()} : {}),
      enemies:Object.freeze(members.map(member => Object.freeze({
        instanceId:member.instanceId, templateId:member.id, slot:member.slot,
        hp:member.hp, maxHp:member.maxHp,
      }))),
      availableActions:Object.freeze(state.phase === 'awaiting_action' ? combatOptions() : []),
      commandCursor:state.commandCursor,
      selectedCommand:state.command?.type || combatOptions()[state.commandCursor],
      selectedItemId:state.command?.itemId || null,
      items:Object.freeze(items), itemCursor:state.itemCursor,
      itemWindowStart:itemWindow(state.itemCursor,items.length+1), itemVisibleRows:3,
      livingTargetInstanceIds:Object.freeze(members.filter(member => member.hp > 0).map(member => member.instanceId)),
      selectedTargetInstanceId:state.selectedTargetInstanceId,
      playbackFrame:frame,
      awaitingAcknowledgement:state.phase === 'playback_complete',
      terminalOutcome:['victory', 'defeat', 'escape'].includes(state.phase) ? state.phase : null,
    });
  };
  return Object.freeze({
    begin() {
      if (arguments.length || session) fail();
      // Pure generalized preflight, not a speculative resolution. Also rejects
      // malformed inventory/equipment and dangling duration state at entry.
      const {members} = validateFormationRoundCommand({type:'run'});
      session = {phase:'awaiting_action', members, selectedTargetInstanceId:null, playback:null, frameIndex:null,
        commandCursor:0,itemCursor:0,itemTargetInstanceId:null,command:null};
      return getView();
    },
    moveCommand(direction) {
      if (arguments.length!==1 || !['previous','next'].includes(direction)) fail();
      const state=requirePhase(['awaiting_action']), count=combatOptions().length;
      state.commandCursor=(state.commandCursor+(direction==='next'?1:count-1))%count;
      return getView();
    },
    confirmCommand() {
      if (arguments.length) fail();
      const state=requirePhase(['awaiting_action']);
      return chooseCommand(state,combatOptions()[state.commandCursor]);
    },
    beginAttack() {
      if (arguments.length) fail();
      const state = requirePhase(['awaiting_action']);
      return chooseCommand(state,'attack');
    },
    moveItem(direction) {
      if (arguments.length!==1 || !['previous','next'].includes(direction)) fail();
      const state=requirePhase(['item']), rows=itemRows();
      state.itemCursor=Math.max(0,Math.min(rows.length,state.itemCursor+(direction==='next'?1:-1)));
      return getView();
    },
    cancelItems() {
      if (arguments.length) fail();
      const state=requirePhase(['item']);
      state.command=null;state.phase='awaiting_action';
      return getView();
    },
    confirmItem() {
      if (arguments.length) fail();
      const state=requirePhase(['item']), rows=itemRows();
      if (state.itemCursor===rows.length) {state.phase='awaiting_action';return getView();}
      const row=rows[state.itemCursor];if (!row || row.count<=0) fail();
      const command={type:'item',itemId:row.itemId};
      return row.targetsEnemy ? targetCommand(state,command) : resolve(state,command);
    },
    moveTarget(direction) {
      if (arguments.length !== 1 || !['previous', 'next'].includes(direction)) fail();
      const state = requirePhase(['targeting']);
      const {members, target} = validateSelection(state);
      const living = members.filter(member => member.hp > 0);
      const next = (living.indexOf(target) + (direction === 'next' ? 1 : -1) + living.length) % living.length;
      state.selectedTargetInstanceId = living[next].instanceId;
      return getView();
    },
    cancelTargeting() {
      if (arguments.length) fail();
      const state = requirePhase(['targeting']);
      validateSelection(state);
      if (state.command.type === 'item') state.itemTargetInstanceId = state.selectedTargetInstanceId;
      state.selectedTargetInstanceId = null;
      state.phase = state.command.type === 'item' ? 'item' : 'awaiting_action';
      state.command = null;
      return getView();
    },
    confirmTarget() {
      if (arguments.length) fail();
      const state = requirePhase(['targeting']);
      return resolve(state,selectedAction(state));
    },
    advancePlayback() {
      if (arguments.length) fail();
      const state = requirePhase(['playback']);
      state.frameIndex++;
      if (state.frameIndex === state.playback.frameCount - 1) state.phase = 'playback_complete';
      return getView();
    },
    acknowledgePlayback() {
      if (arguments.length) fail();
      const state = requirePhase(['playback_complete']);
      const outcome = state.playback.frames[state.frameIndex].outcome;
      acknowledgeFormationRound(state.playback,state.frameIndex);
      if (outcome === 'ongoing') {
        state.playback = null;
        state.frameIndex = null;
        state.phase = 'awaiting_action';
      } else state.phase = outcome; // retain the final immutable terminal frame
      return getView();
    },
    getView,
    // Lifecycle hook only. It cannot clear a battle or discard a live session;
    // setSingleCombatEnemy(null) must have already cleared the sole authority.
    clearAfterCombatCleanup() {
      if (arguments.length || combat.mode !== null || combat.enemies.length !== 0) fail();
      session = null;
    },
  });
})();

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
//
// East Sluice difficulty curve: the TOP floor (sluiceFloor 1) is as gentle as
// the Verdant Vale overworld (SLUICE_TOP_ENEMY_TEMPLATES — Marsh Wisp / Sluice
// Slime), because it's likely where the player takes their very first fights.
// Descending is the difficulty spike: floors 2–3 jump to the tougher
// SLUICE_ENEMY_TEMPLATES (Reed Grappler / Silt Lurker) to discourage wandering
// deeper before the player is ready, and the Sealed Room keeps its own
// SLUICE_SECRET pool.
function currentEncounterPool() {
  // Special, floor-stepped, non-geographic areas keep their exact legacy selection.
  if (inMireVault) return MIRE_VAULT_ENEMY_TEMPLATES;
  if (inSluice) return inSluiceSealedRoom() ? SLUICE_SECRET_ENEMY_TEMPLATES
              : sluiceFloor === 1           ? SLUICE_TOP_ENEMY_TEMPLATES
              :                               SLUICE_ENEMY_TEMPLATES;
  if (inDungeon) return dungeonFloor === 1                    ? DUNGEON_ENEMY_TEMPLATES
               : dungeonFloor === 2 || dungeonFloor === 3     ? DUNGEON2_ENEMY_TEMPLATES
               : dungeonFloor === 4 || dungeonFloor === 5     ? DUNGEON2_ENEMY_TEMPLATES
               : dungeonFloor === 6 || dungeonFloor === 7     ? DUNGEON6_ENEMY_TEMPLATES
               : dungeonFloor === 8                           ? DUNGEON8_ENEMY_TEMPLATES
               :                                                DUNGEON_HORROR_ENEMY_TEMPLATES;
  // Placed regional overworld: the pool is owned by the physical chunk beneath the
  // player's STANDING POINT in world space — the SAME shared authority the roll gate
  // (encounterGeographyOk) uses, so eligibility and pool selection can never
  // disagree. FAIL CLOSED: on a placed regional map with unresolved / void /
  // inconsistent geography, return the empty no-pool result (EMPTY_ENCOUNTER_POOL) —
  // NEVER the stale activeMap pool. Behaviour-neutral: when the standing point is on
  // the active chunk (always, today) this is exactly the active map's catalog pool
  // (with the legacy null -> ENEMY_TEMPLATES fallback for a placed pool-less map).
  const activeMapId = mapRegistryId(activeMap);
  if (typeof regionalEncounterResolution === 'function') {
    const r = regionalEncounterResolution();
    if (r.regional) return r.ok ? (r.pool || ENEMY_TEMPLATES) : EMPTY_ENCOUNTER_POOL;
  }
  // Nonregional / unplaced -> the unchanged legacy MAP_METADATA fall-through.
  return (MAP_METADATA[activeMapId] && MAP_METADATA[activeMapId].encounterPool) || ENEMY_TEMPLATES;
}
// The established empty / no-pool result: a frozen empty pool. currentEncounterPool()
// returns it when placed-regional geography fails closed; startCombat() treats an
// empty pool as "no encounter" (returns without activating combat or rolling).
const EMPTY_ENCOUNTER_POOL = Object.freeze([]);
if (typeof window !== 'undefined') window.EMPTY_ENCOUNTER_POOL = EMPTY_ENCOUNTER_POOL;

function startCombat() {
  // Pale Sentry: appears on MAP_N2 once the contract is accepted, until it is killed.
  // Keyed off the CANONICAL physical-map id (the regional authority), not the
  // `activeMap` compatibility projection — a placed regional chunk's identity comes
  // from the canonical world point, and reading it off `activeMap` is exactly the
  // anti-pattern AGENTS.md warns against. On a broken/void canonical invariant this
  // fails closed (no id, no Sentry), the same way the encounter-geography gate that
  // reaches this call already does.
  const _sentryMapId = (typeof regionalActiveMapId === 'function') ? regionalActiveMapId() : mapIdForRef(activeMap);
  if (_sentryMapId === 'MAP_N2' && sentry_quest_started && !sentry_quest_done) {
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
  // Empty / no-pool contract (e.g. placed-regional geography failed closed): no
  // encounter. Return BEFORE selecting an enemy, so combat never activates and no
  // enemy-selection randomness is consumed. Unreachable via the normal roll (the
  // encounterGeographyOk() gate already prevents the roll), but this makes a direct
  // startCombat() caller fail closed too.
  if (!Array.isArray(pool) || pool.length === 0) return;
  let t = pool[Math.floor(Math.random() * pool.length)];
  // North Basin outdoor squares: ~1 fight in 16 is a Swamp Donkey instead of a
  // normal pool draw — uncommon, and a real spike (mostly its attack). Keyed
  // on MAP_METADATA region/type so it covers all five squares (South Approach,
  // Reservoir, Silt Flats, West Shore, Upper Reach) and nothing else.
  const _nbMeta = (typeof MAP_METADATA !== 'undefined') ? MAP_METADATA[mapRegistryId(activeMap)] : null;
  if (_nbMeta && _nbMeta.region === 'North Basin' && _nbMeta.type === 'outdoor' && Math.random() < 1 / 16) {
    t = SWAMP_DONKEY_TEMPLATE;
  }
  combat.enemy          = { ...t };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = combat.enemy.id === 'enemy_tallyman'
    ? 'Something unfolds from the corner of the room.'
    : combat.enemy.id === 'enemy_swamp_donkey'
    ? 'The reeds crash apart — a Swamp Donkey barrels out, all muscle and bad temper.'
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
      id: 'enemy_23',
      name: '23',
      hp: hp, maxHp: hp,
      atk: r23(), def: r23(), spd: r23(),
      xp: r23(),
      goldMin: Math.min(gA, gB), goldMax: Math.max(gA, gB),
    };
    combat.message = '23.';
    combat.is23    = true;
  }
  // The Seep (template `splits`): the formless mass divides once when defeated —
  // a smaller Seep is fought immediately after (handled in the victory phase, via
  // startSeepSplitCombat). Not armed if the 23 override replaced the enemy above.
  if (combat.enemy && combat.enemy.splits) {
    combat.isSeepSplit        = true;
    combat.seepSplitRemaining = 1;   // one follow-up (the smaller half)
  }
}

// The Seep's second half — a smaller mass that pulls itself together after the
// parent is struck down. Reduced HP and only token rewards (the parent already
// paid out); its danger is the extra round of atk-45 swings, not more loot.
function startSeepSplitCombat(remaining) {
  const t = ENEMY_TEMPLATE_REGISTRY.enemy_the_seep;
  if (!t) return; // Registry corruption: fail closed without creating combat.
  combat.enemy = { ...t, hp: 20, maxHp: 20, xp: 20, goldMin: 0, goldMax: 3 };
  combat.active            = true;
  combat.phase             = 'choose';
  combat.cursor            = 0;
  combat.messageQueue      = [];
  combat.message           = 'The severed mass gathers itself into a smaller Seep!';
  combat.pendingVictory    = false;
  combat.pendingDefeat     = false;
  combat.pendingEscape     = false;
  combat.flashTimer        = 8;
  combat.isSeepSplit       = true;
  combat.seepSplitRemaining = remaining;
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
}

// Northern Fen spawning-site event. Each fight independently chooses one of
// the two otherwise-identical Mire Toad templates, so the jack/hen sequence is
// freshly randomized for every investigation rather than authored or saved.
function startMireToadSpawnCombat(remaining) {
  const ids = ['enemy_mire_toad_male', 'enemy_mire_toad_female'];
  const t = ENEMY_TEMPLATE_REGISTRY[ids[Math.floor(Math.random() * ids.length)]];
  if (!t) return; // Registry corruption: fail closed without creating combat.

  const intros = [
    'The last Mire Toad surges out of the churned reeds!',
    'A second Mire Toad heaves itself from the spawning bed!',
    'A Mire Toad bursts through the reed mat!',
  ];
  combat.enemy             = { ...t };
  combat.active            = true;
  combat.phase             = 'choose';
  combat.cursor            = 0;
  combat.messageQueue      = [];
  combat.message           = intros[Math.min(remaining, 2)];
  combat.pendingVictory    = false;
  combat.pendingDefeat     = false;
  combat.pendingEscape     = false;
  combat.flashTimer        = 8;
  combat.isMireToadSpawn   = true;
  combat.mireToadRemaining = remaining;
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
  removeStatusEffect('burn');     // Burn is combat-only — it wears off when the fight ends.
  removeStatusEffect('dazzled');  // Dazzled (dust) is likewise combat-only — the eyes clear when the fight ends.
  combat.isBoss        = false;
  combat.isWarden      = false;
  combat.isFortGuard   = false;
  combat.isFortPolwick = false;
  combat.isFortEssa    = false;
  combat.isMulholland      = false;
  combat.isPaleSentry      = false;
  combat.isRainfish        = false;
  combat.rainfishRemaining = 0;
  combat.isMireToadSpawn   = false;
  combat.mireToadRemaining = 0;
  combat.isDenWraith       = false;
  combat.isSailorBrawl     = false;
  combat.isTakomo          = false;
  combat.is23              = false;
  // Discard any pending lighthouse boss-event state on EVERY combat exit
  // (victory finalizes and grants BEFORE reaching here; defeat, flight without
  // the Observe unlock, and any abnormal cancellation all reach here having
  // granted nothing and left lighthouse_spider_resolved untouched).
  combat.isLenswebSpider           = false;
  combat.pendingLighthouseObjective = null;
  combat.evadeTurns        = 0;
  combat.enemyStunTurns    = 0;     // Trollbane's heal-lock is battle-local — it never carries between fights
  combat.corrosion         = 0;     // acid armor-melt is combat-only — cleared with the fight
  combat.isSeepSplit       = false;
  combat.seepSplitRemaining = 0;
  combat.gullStole         = false;
  combat.gullStolenAmount  = 0;
  combat.bombFuse          = 0;     // a primed Bomb is battle-local — it does not carry between fights
  combat.bombTargetInstanceId = null;
  combat.bombDamage        = 0;
  combat.bombIgnoresDef    = false;
  combat.bombJustArmed     = false;
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
}

// Sunken Gallery trap. Dispatched from the far-corner "dropped potion" sparkle
// (interactions.js ENCOUNTER_HANDLERS['mimic_potion']) once its two-page "It
// attacks you!" dialogue closes. An ordinary scripted enemy — no special flag,
// so victory/defeat/flee all resolve generically; its guaranteed Potion drop is
// handled by applyKillRewards' `guaranteedDrop` path.
function startMimicPotionCombat() {
  combat.enemy          = { ...MIMIC_POTION_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'The potion rears up on a glistening foot — it was never a potion at all!';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
}

// Abandoned Lighthouse lens event. Dispatched from the reach-through-the-web
// dialogue (interactions.js ENCOUNTER_HANDLERS['lensweb_spider']) once its last
// page closes. Snapshots the validated route objective from the SINGLE quest
// authority at start time and holds it as battle-local pending reward — the item
// is NOT in inventory yet, so a defeat here can't become an item exploit. Poison
// (from the bite) is applied AFTER the combat fields are set up, so nothing in the
// normal battle setup erases it; addStatusEffect is idempotent and applies no
// immediate damage tick. Fails atomically: if the objective is missing/malformed
// or the spider is already resolved, no combat starts and nothing is left pending.
function startLenswebSpiderCombat() {
  if (lighthouse_spider_resolved) return;             // never re-run the event
  const objective = getActiveLighthouseObjective();   // the one route/item authority
  if (!objective) return;                             // malformed/none: fail closed, no combat

  combat.enemy          = { ...LENSWEB_SPIDER_TEMPLATE };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'The web shudders. The spider rushes down its threads at you!';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
  combat.isLenswebSpider = true;
  combat.pendingLighthouseObjective = objective;

  // Poison from the bite — applied only now, after setup. Existing status; no
  // lighthouse-specific variant, and no extra out-of-cadence damage tick.
  addStatusEffect('poison');
}

// The ONE idempotent finalization authority for the lens event, shared by victory
// and successful Observe-gated escape. Grants exactly one pending route item and
// flips the persistent resolved flag, at most once. Returns the granted objective
// name (for aftermath text), or null if there was nothing to finalize (already
// resolved, or no pending objective — e.g. a repeat outcome callback). It does NOT
// touch XP/gold (victory's applyKillRewards owns those) and does NOT clear the
// pending state — endCombat() does that on the way out.
function finalizeLenswebSpiderEvent() {
  if (lighthouse_spider_resolved) return null;
  const objective = combat.pendingLighthouseObjective;
  if (!objective) return null;
  grantItem(objective);
  lighthouse_spider_resolved = true;
  syncQuestFlagsToWindow();
  return objective;
}

// The Sunken Gallery's trapped Pale Drowned, when the player chooses to put it
// down rather than free it (interactions.js). An ordinary Pale Drowned fight
// (SUNKEN_GALLERY_ENEMY_TEMPLATES[0]) with its own opening line — victory,
// defeat, and flight are all handled by the generic combat resolution. The
// clue it was snagged on is destroyed at the moment of the choice, not here,
// so fleeing the fight doesn't get the clue back.
function startTrappedDrownedCombat() {
  combat.enemy          = { ...SUNKEN_GALLERY_ENEMY_TEMPLATES[0] };
  combat.active         = true;
  combat.phase          = 'choose';
  combat.cursor         = 0;
  combat.messageQueue   = [];
  combat.message        = 'The Pale Drowned wrenches free of the silt and turns on you.';
  combat.pendingVictory = false;
  combat.pendingDefeat  = false;
  combat.pendingEscape  = false;
  combat.flashTimer     = 8;
}
window.startTrappedDrownedCombat = startTrappedDrownedCombat;

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
        ? 'MISSING \u2014 IN PROGRESS. Child\u2019s toy bear, Schilling. Last seen in the South Ruins.'
        : 'MISSING \u2014 child\u2019s toy bear, name Schilling, believed taken into the South Ruins by a large creature. Child at the schoolhouse. Please return if recovered. \u2014 Bram, Schoolhouse, Calwick.'
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
        ? 'REMOVAL NOTICE \u2014 IN PROGRESS. Pale creature, the old blocked pass north of Drenwick. Report to Constable Tarvec, Drenwick Guard Post, on confirmed removal.'
        : 'REMOVAL NOTICE \u2014 A large pale creature has been sighted at the old blocked pass, up the north road from Drenwick, where the way is grown over. Contract fee offered for confirmed removal. Report to Constable Tarvec, Drenwick Guard Post.'
    );
  }
}

function advanceCombatMessage() {
  if (combat.mode === 'formation') throw new Error('Formation state cannot process singleton messages');
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
    const enemy = combat.enemy; // singleton encounter-lifecycle boundary (Gull flight)
    if (combat.pendingEscape) {
      // A successful Observe-gated escape from the lens spider is a real event
      // outcome, not an ordinary flight: finalize (grant item + resolve) through
      // the shared idempotent authority, then show the aftermath. All other
      // escapes end combat exactly as before.
      if (combat.isLenswebSpider) resolveLenswebSpiderEscape();
      else {
        const completedEscape = completedSingleExitCandidate();
        endCombat();
        completedSingleVictoryReceipt = completedEscape;
      }
    }
    else if (combat.pendingVictory) combat.phase = 'victory';
    else if (combat.pendingDefeat) combat.phase = 'defeat';
    else if (isActiveCombatEnemy(enemy) && enemy.stealAndFlee && combat.gullStole === 'flee' && enemy.hp > 0) {
      // Basin Gull: the player's one grace turn elapsed without a kill — it bolts
      // with the gold. Show the escape line, then pendingEscape ends combat (no
      // rewards) when it's acknowledged. 'gone' prevents any re-trigger.
      combat.gullStole    = 'gone';
      combat.message      = 'The Basin Gull beats its wings and vanishes over the flats with your gold!';
      combat.messageQueue = [];
      combat.pendingEscape = true;
      combat.phase        = 'message';
    }
    else {
      // Basin Gull: the turn it stole ends here — arm the single grace turn so the
      // player's NEXT turn is their one chance before the flee check above fires.
      if (isActiveCombatEnemy(enemy) && enemy.stealAndFlee && combat.gullStole === 'armed') combat.gullStole = 'flee';
      combat.phase = 'choose';
    }
  }
}

// Successful escape from the Lensweb Spider after Observe. Grants the pending
// route item and flips the resolved flag once (shared finalizer), ends combat
// (which clears the transient event state), then plays the aftermath: the player
// pulls free with the item and the territorial spider withdraws into the lens.
function resolveLenswebSpiderEscape() {
  const objective = finalizeLenswebSpiderEvent();
  endCombat();
  dialogue.name  = '';
  dialogue.pages = [
    objective
      ? [`You pull your hand back through the web, the ${objective} closed in your fist.`,
         'The spider retreats back behind the frame of the old lens and refuses to pursue.',
         'It settles over the ruined mechanism and holds there, past the reach of the web.']
      : ['You pull back through the web.',
         'The spider retreats back behind the frame of the old lens and refuses to pursue.',
         'It settles over the ruined mechanism and holds there, past the reach of the web.'],
  ];
  dialogue.open  = true;
  dialogue.page  = 0;
}

// ─── Observe: combat action helpers ──────────────────────────────────────────

// Returns the ordered list of action IDs for the combat choose phase.
// Navigation and draw both use this so cursor math stays consistent.
function combatOptions() {
  return ['attack', 'item', 'observe', 'run'];
}

// Status-effect side-effects applied whenever an enemy lands a hit.
// Extracted from inside handleCombatAction so the Observe path can reuse it.
function applyEnemyHitEffects(enemy) {
  if (!isActiveCombatEnemy(enemy)) return;
  if (MUDSLITHER_INFLICTABLE && combat.isWarden && !hasStatusEffect('muddied') && Math.random() < 0.30) {
    addStatusEffect('muddied');
    combat.messageQueue.unshift('The Warden\u2019s blow leaves you fouled with marsh muck. Muddied! (DEF\u22121, SPD\u22122)');
  }
  if (MUDSLITHER_INFLICTABLE && enemy && enemy.id === 'enemy_corpse_slug' && !hasStatusEffect('slither') && Math.random() < 0.30) {
    triggerSlither();
    combat.messageQueue.unshift('The slug\u2019s slime soaks in. Slithered! (SPD randomized each turn)');
  }
  if (MUDSLITHER_INFLICTABLE && enemy && enemy.id === 'enemy_shade_wraith' && !hasStatusEffect('slither') && Math.random() < 0.25) {
    triggerSlither();
    combat.messageQueue.unshift('The wraith\u2019s touch scrambles your footing. Slithered! (SPD randomized each turn)');
  }
  if (enemy && enemy.id === 'enemy_fen_witch' && !hasStatusEffect('poison') && Math.random() < 0.25) {
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
  // Generic poison-on-hit (template `poisonChance`) — currently the poison-
  // skinned Mire Toad. The Fen Witch keeps its own by-name poison above.
  if (enemy && enemy.poisonChance && !hasStatusEffect('poison') && Math.random() < enemy.poisonChance) {
    triggerPoison();
    const pMsg = (enemy.id === 'enemy_mire_toad_male' || enemy.id === 'enemy_mire_toad_female')
      ? 'The toad’s skin weeps a bitter slime where it struck. Poisoned! (lose HP each rest)'
      : 'Venom works into the wound. Poisoned! (lose HP each rest)';
    combat.messageQueue.unshift(pMsg);
  }
  if (enemy && enemy.curseChance && !hasStatusEffect('cursed') && Math.random() < enemy.curseChance) {
    if (stats.accessory && stats.accessory.preventsCursed) {
      combat.messageQueue.unshift('The amethyst bangle flares faintly. The curse doesn\u2019t take.');
    } else {
      triggerCursed();
      const curseMsg = enemy.id === 'enemy_den_wraith'
        ? 'The Den Wraith\u2019s wail settles into your bones. Cursed!'
        : 'Something unravels. Cursed!';
      combat.messageQueue.unshift(curseMsg);
    }
  }
  // Void Walker \u2014 a void-touched entity that flings splinters of raw void. On a
  // landed hit it has a chance to also hurl a Void Shard: a burst of extra damage
  // on top of the blow. A player carrying a Void Shard of their own is warded \u2014
  // the two resonate and the splinter is turned aside (no extra damage). The
  // player's shard is NOT consumed; holding one is a passive ward.
  if (enemy && enemy.id === 'enemy_void_walker' && Math.random() < 0.35) {
    const warded = stats.items.some(it => it && it.name === 'Void Shard');
    if (warded) {
      combat.messageQueue.unshift('The Void Walker hurls a splinter of void \u2014 your own Void Shard flares and turns it aside. No damage.');
    } else {
      const shardDmg = 8 + Math.floor(Math.random() * 7);   // 8..14 bonus void damage
      stats.hp = Math.max(0, stats.hp - shardDmg);
      combat.messageQueue.unshift(`The Void Walker hurls a Void Shard \u2014 it bursts against you for ${shardDmg}!`);
      if (stats.hp <= 0 && !combat.pendingDefeat) {
        combat.messageQueue.push(`${stats.name} has fallen...`);
        combat.pendingDefeat = true;
      }
    }
  }
  // Generic dust/dazzle-on-hit (template `dazzleChance`) \u2014 currently the Lantern
  // Moth. Dazzled is a combat-only accuracy debuff: while it lasts, the player's
  // OWN attacks are more likely to miss (enemyEvades() docks the swing's effective
  // speed by DAZZLE_ACC_PENALTY). It touches nothing else \u2014 not turn order, not the
  // player's own evasion, not defense \u2014 and clears when the fight ends (endCombat).
  if (enemy && enemy.dazzleChance && !hasStatusEffect('dazzled') && Math.random() < enemy.dazzleChance) {
    addStatusEffect('dazzled');
    combat.messageQueue.unshift('A burst of glittering scale-dust stings your eyes. Dazzled! (your attacks go wide)');
  }
  // Generic acid-on-hit (template `acidChance`) — the Dripping Maw. Each landed hit
  // eats into the player's armor: a combat-only, STACKING DEF loss (Corroded), capped
  // so it can't drive effective DEF absurdly negative. effectiveDef() subtracts it;
  // endCombat() clears it. Distinct from muddied's flat, single −1.
  if (enemy && enemy.acidChance && combat.corrosion < ACID_CORROSION_CAP && Math.random() < enemy.acidChance) {
    combat.corrosion = Math.min(ACID_CORROSION_CAP, combat.corrosion + 1);
    combat.messageQueue.unshift(`Acid sizzles across your gear. Corroded! (DEF −${combat.corrosion})`);
  }
  // Basin Gull theft-and-flee (template `stealAndFlee`) — on its FIRST landed hit it
  // snatches gold and arms its escape. The player then gets exactly one turn to kill
  // it (which recovers the gold, see applyKillRewards) before it flies off with the
  // loot (resolved in advanceCombatMessage). 'armed' grants that one grace turn.
  if (enemy && enemy.stealAndFlee && !combat.gullStole) {
    const grab  = 20 + Math.floor(Math.random() * 31);   // 20..50
    const taken = Math.min(grab, stats.gold);
    stats.gold -= taken;
    combat.gullStole        = 'armed';
    combat.gullStolenAmount = taken;
    combat.messageQueue.unshift(taken > 0
      ? `The Basin Gull snatches ${taken} gold and beats upward out of reach! One shot to bring it down before it's gone!`
      : `The Basin Gull lunges for your purse — nothing to take — and beats upward out of reach!`);
  }
}

// Cap on the Dripping Maw's cumulative acid DEF loss within one fight.
const ACID_CORROSION_CAP = 6;

// How long Polwick's fire-cast animation plays, in frames (~0.75s at 60fps).
const FIRE_CAST_FRAMES = 45;

// Burn — a combat-only damage-over-time. Returns a deferred message-queue entry
// (or null when the player isn't burning) to append at the END of a turn that
// consumes an action, so the sear resolves after the enemy has acted. The
// random 0..20 roll is fixed when the entry is built but only applied when its
// message is shown. Evaluated at message-build time, so on the very turn Burn
// is first inflicted (which happens later, inside the enemy hit's deferred
// apply) this returns null — the first tick lands on the following turn.
function burnTickEntry(enemy) {
  // Burn is player-owned; the member identity scopes this tick to its battle.
  if (!isActiveCombatEnemy(enemy)) return null;
  if (!hasStatusEffect('burn')) return null;
  const burnDmg = Math.floor(Math.random() * 21);   // 0..20 inclusive
  return {
    text: burnDmg > 0
      ? `The burn sears ${stats.name} for ${burnDmg}!`
      : 'The burn smoulders, but does no damage this turn.',
    apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) {
      if (stats.hp <= 0) return;   // player already fell this turn — don't double up
      if (burnDmg > 0) {
        stats.hp = Math.max(0, stats.hp - burnDmg);
        if (stats.hp <= 0 && !combat.pendingDefeat) {
          combat.messageQueue.push(`${stats.name} has fallen...`);
          combat.pendingDefeat = true;
        }
      }
    }),
  };
}

// Enemy self-heal (template `regenPerTurn`) — the Rotwood Troll. Like burnTickEntry,
// this returns a deferred entry appended at the END of a turn the enemy survives, so
// it knits HP back after the trade resolves. Returns null when there's nothing to heal
// (no regen field, the enemy is already dead / at full, or the player's hit this turn
// already won — pendingVictory). The heal is capped at maxHp when applied.
function enemyRegenEntry(enemy) {
  if (!isActiveCombatEnemy(enemy)) return null;
  const e = enemy;
  if (!e || !e.regenPerTurn || combat.pendingVictory) return null;
  const heal = Math.min(e.regenPerTurn, e.maxHp - e.hp);
  // Trollbane stun: while it holds, the enemy can't knit its rot back. Each
  // regen-eligible turn (Attack / Observe / item — the only turns that reach
  // here) burns one turn off the stun, whether or not it had HP to recover.
  if (combat.enemyStunTurns > 0) {
    combat.enemyStunTurns--;
    if (heal <= 0) return null;
    return {
      text: `The ${e.name} strains to close its wounds — the Trollbane holds its rot slack.`,
      apply: function() {},
    };
  }
  if (heal <= 0) return null;
  return {
    text: `The ${e.name} knits its rot back together (+${heal} HP).`,
    apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) {
      if (enemy && enemy.hp > 0) {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
      }
    }),
  };
}

// Bomb fuse tick — like burnTickEntry, a deferred entry appended at the end of a
// spent player turn. The turn the Bomb is armed doesn't count (bombJustArmed); each
// following turn burns the fuse down, and on the third it detonates for bombDamage
// (ignoring DEF unless the item said otherwise). Returns null when no Bomb is armed.
function bombFuseEntry() {
  if (combat.bombFuse <= 0) return null;
  const enemy = findCombatEnemy(combat.bombTargetInstanceId);
  if (!isActiveCombatEnemy(enemy)) return null;
  if (combat.bombJustArmed) { combat.bombJustArmed = false; return null; } // the "use" turn
  const remaining = combat.bombFuse - 1;
  if (remaining > 0) {
    return {
      text: `The Bomb's fuse hisses down… (${remaining} turn${remaining === 1 ? '' : 's'} to go)`,
      apply: bindCombatEnemyEffect(enemy.instanceId, function() { combat.bombFuse = remaining; }),
    };
  }
  // Detonation this turn. Damage is fixed at build time; only the HP subtraction
  // (and any resulting kill) is deferred to apply, matching burnTickEntry.
  const dmg = combat.bombIgnoresDef
    ? combat.bombDamage
    : Math.max(1, combat.bombDamage - (enemy ? enemy.def : 0));
  const targetName = enemy ? enemy.name : 'enemy';
  return {
    text: `The Bomb goes off! The blast tears into the ${targetName} for ${dmg} damage!`,
    apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) {
      combat.bombFuse = 0;
      combat.bombTargetInstanceId = null;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      if (enemy.hp <= 0 && !combat.pendingVictory && !combat.pendingDefeat) {
        applyKillRewards(enemy, combat.messageQueue);
      }
    }),
  };
}

// ─── Speed-based evasion (the single hit-or-evade decision) ──────────────────
// EVERY attack in combat is an ATTEMPT: the DEFENDER may evade it. The chance is
// derived from the speed gap between defender and attacker, clamped so nobody is
// un-hittable and even a slow fighter occasionally slips a blow:
//     clamp(EVADE_BASE + EVADE_PER_SPD * (defenderSpd - attackerSpd), MIN, MAX)
// Bullet Time (the player-only evade buff item — combat.evadeTurns) takes
// precedence while active (its rate is higher than any speed roll). This is the
// ONE place the decision is made; every combat branch (Attack trade, item-turn
// response, blocked/failed Run, Observe) routes through it, player and enemy
// alike — no divergent per-branch rolls. A dodged hit deals no damage and lands
// no on-hit status effect: the deferred apply()s below skip both when `dodged`,
// so evading also prevents Polwick's fire, poison, curse, etc.
const BULLET_TIME_EVADE_RATE = 0.90;
const EVADE_BASE = 0.08, EVADE_PER_SPD = 0.015, EVADE_MIN = 0.02, EVADE_MAX = 0.30;
function evadeChance(attackerSpd, defenderSpd, defenderIsPlayer) {
  // EvadeAll (secret accessory) — while the player holds it in the accessory
  // slot, every incoming attack is evaded. Deliberately broken; a dev/secret
  // reward, not balanced content.
  if (defenderIsPlayer && stats.accessory && stats.accessory.evadeAll) return 1;
  let c = Math.min(EVADE_MAX, Math.max(EVADE_MIN, EVADE_BASE + EVADE_PER_SPD * (defenderSpd - attackerSpd)));
  if (defenderIsPlayer && combat.evadeTurns > 0) c = Math.max(c, BULLET_TIME_EVADE_RATE);
  return c;
}
function attackEvaded(attackerSpd, defenderSpd, defenderIsPlayer) {
  return Math.random() < evadeChance(attackerSpd, defenderSpd, defenderIsPlayer);
}
// Direction wrappers: the player defends an enemy blow / the enemy defends the
// player's blow. Speeds go through effectiveSpd() so slither etc. are respected.
function playerEvades(enemy) { return attackEvaded(enemy.spd, effectiveSpd(), true); }
// Dazzled (dust in the eyes) reduces ONLY the player's accuracy: it docks the
// effective speed of the player's own swing here, so the enemy evades it more
// often (a higher speed gap in the defender's favour). effectiveSpd() itself is
// untouched, so turn order and the player's own evasion (playerEvades) stay put.
const DAZZLE_ACC_PENALTY = 8;
function enemyEvades(enemy)  {
  const atkSpd = effectiveSpd() - (hasStatusEffect('dazzled') ? DAZZLE_ACC_PENALTY : 0);
  return attackEvaded(atkSpd, enemy.spd, false);
}
// Ticks the Bullet Time buff down by one player turn. Called once per turn spent.
function tickEvadeBuff() {
  if (combat.evadeTurns > 0) combat.evadeTurns--;
}
// Generic evade line: "Lély evades!" / "The Marsh Wisp evades!"
function evadeText(defenderIsPlayer, enemy) {
  return defenderIsPlayer ? `${stats.name} evades!` : `The ${enemy.name} evades!`;
}

// The enemy's response to a player turn that didn't itself fight the enemy
// (currently: using an item). Same damage formula and status/defeat handling
// as the enemy's blow in an Attack trade — an item-using turn is still a turn,
// so the enemy still gets to act. textFn receives the rolled damage and returns the
// message line; returns a deferred { text, apply() } queue entry, the same
// shape every other enemy hit in this file uses.
function enemyTurnResponse(enemy, textFn) {
  if (!isActiveCombatEnemy(enemy)) return null;
  const { dmg: eDmg, crit } = rollAttackDamage(enemy.atk, effectivePlayerIncomingMitigation(enemy.atk));
  const dodged = playerEvades(enemy);
  return {
    text: dodged ? evadeText(true, enemy) : (crit ? 'Critical! ' : '') + textFn(eDmg),
    apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) {
      if (dodged) return;   // Bullet Time: no damage, no on-hit effects
      stats.hp = Math.max(0, stats.hp - eDmg);
      applyEnemyHitEffects(enemy);
      if (stats.hp <= 0) {
        combat.messageQueue.push(`${stats.name} has fallen...`);
        combat.pendingDefeat = true;
      }
    }),
  };
}

// Records a kill: pushes the defeat/XP/gold messages onto the given queue,
// awards XP (with level-up), rolls gold and a 12% potion drop, and flags the
// pending victory. Module-level so both the Attack branch and the sex-reagent
// item branch (handleCombatAction) grant kills identically.
function applyKillRewards(enemy, msgs) {
  if (!isActiveCombatEnemy(enemy)) return;
  msgs.push(`${enemy.name} was defeated!`);
  stats.xp += enemy.xp;
  msgs.push(`Gained ${enemy.xp} XP!  (Total: ${stats.xp})`);
  checkLevelUp(msgs);
  const goldGain = enemy.goldMin +
    Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1));
  stats.gold += goldGain;
  // Guaranteed drop (data-driven `guaranteedDrop`, e.g. the Mimic Potion): granted
  // 100% of the time and REPLACES the usual 12% bonus-potion roll so it can never
  // double up. Ordinary enemies (no guaranteedDrop) keep the exact 12% roll, so
  // their behaviour and randomness cadence are unchanged.
  const guaranteed = enemy.guaranteedDrop;
  const droppedPotion = guaranteed ? false : Math.random() < 0.12;
  if (guaranteed) grantItem(guaranteed);
  else if (droppedPotion) grantItem('Potion');
  msgs.push(`Gained ${goldGain} gold.`);
  if (guaranteed) msgs.push(`It leaves a real ${guaranteed} behind!`);
  else if (droppedPotion) msgs.push(`Found a potion!`);
  // Basin Gull: cut down before it could escape — its snatched gold falls back to you.
  if (enemy && enemy.stealAndFlee && combat.gullStolenAmount > 0) {
    stats.gold += combat.gullStolenAmount;
    msgs.push(`It drops from the air — you recover the ${combat.gullStolenAmount} gold it snatched!`);
    combat.gullStolenAmount = 0;
  }
  combat.pendingVictory = true;
}

// Custom observation text keyed by STABLE ENEMY TEMPLATE ID (enemy.id), not
// by display name -- Observe/lore is identity-dispatched, so renaming an
// enemy's player-facing `name` never changes its lore. Each entry is an array
// of { lines: string[] } objects ordered by observation count (0 = first).
// First entry: practical tactical info. Later entries: behavior, ecology, lore.
// Templates that share one display identity (e.g. the three Marsh Wisp variant
// ids) share a single entry via the alias block below the literal.
const ENEMY_OBSERVATIONS = {
  enemy_gallery_caller: [
    {lines:['Its broken call draws the Receiver upright. The heavy blow follows next round.',
      'Bring the Caller down before that blow and the signal breaks.']},
    {lines:['Calling takes its whole action. Between signals, it attacks.',
      'The warning gives you time to choose: interrupt it, or prepare for the blow.']},
  ],
  enemy_gallery_keeper: [
    {lines:['It braces beside the Receiver, turning blows aside.',
      'While the Keeper lives, the Receiver takes only half damage. The Keeper itself is exposed.']},
    {lines:['Its protection does not extend to the Caller.',
      'Bring the Keeper down and the Receiver loses that protection.']},
  ],
  enemy_gallery_receiver: [
    {lines:['It gathers itself when the Caller signals. Its next-round strike will hit twice as hard.',
      'The Keeper shelters it. The two smaller creatures make the larger one dangerous.']},
    {lines:['Without the signal it uses ordinary attacks. Without the Keeper, its bulk is no shield.',
      'It can still be hurt while protected.']},
  ],
  // ── Overworld enemies ───────────────────────────────────────────────────────
  enemy_marsh_wisp: [
    { lines: ['It pulses between visible and not-visible.', 'Low HP. Light attack. Moderate speed.', 'Should go down quickly.'] },
    { lines: ['It doesn\u2019t breathe. It doesn\u2019t blink.', 'Something in the marsh is animating it — the wisp itself seems incidental.'] },
    { lines: ['It keeps its distance unless it senses the attack window.', 'Lore holds that marsh wisps are navigation lights gone wrong.', 'Nobody believes that anymore.'] },
  ],
  enemy_stone_crawler: [
    { lines: ['High defense. Low attack. Very slow.', 'It sometimes braces, halving the damage it takes.', 'Patience works. High burst less so.'] },
    { lines: ['It moves like something that has learned patience by necessity.', 'The shell is not decorative. It uses it deliberately.'] },
    { lines: ['You can see the seams in the plating now.', 'They don\u2019t look like weak points. They look like they were designed not to be.'] },
  ],
  enemy_briar_hound: [
    { lines: ['Fast. Hits harder than expected.', 'Light armor — won\u2019t hold together long.', 'It wants you reactive. Stay ahead of it.'] },
    { lines: ['Pack hunter, but alone right now.', 'That should bother it. It doesn\u2019t seem to.'] },
    { lines: ['The briar in its coat isn\u2019t parasitic. It grows from the hound itself.', 'Fen phenomenon. Nobody\u2019s explained it satisfactorily.'] },
  ],
  // ── Dungeon floor 1 ────────────────────────────────────────────────────────
  enemy_bone_guard: [
    { lines: ['Heavily armored. Slow. Occasionally braces.', 'High defense means you\u2019ll be chipping. Plan for a long fight.'] },
    { lines: ['It was stationed here. Not summoned \u2014 stationed.', 'Whatever authority put it here stopped existing centuries ago.', 'It hasn\u2019t been informed.'] },
    { lines: ['The armor is integrated. Not worn.', 'You\u2019re not sure there is anything underneath it.'] },
  ],
  enemy_shade_wraith: [
    { lines: ['Very fast. Hits hard. Fragile.', 'It will almost always strike first.', 'A quick kill is your best option.'] },
    { lines: ['It doesn\u2019t have a fixed form. It\u2019s using the shape because it\u2019s useful.', 'It notices you watching.'] },
    { lines: MUDSLITHER_INFLICTABLE ? ['The slithering effect it triggers isn’t a weapon in the usual sense.', 'It’s closer to contamination.', 'The footing problem lingers after it’s gone.'] : ['Whatever it’s made of doesn’t hold still, even when it isn’t moving.', 'Look at it too long and your eyes want to slide off it.', 'It is easier to fight than to keep watching.'] },
  ],
  // ── Dungeon floors 2–5 ─────────────────────────────────────────────────────
  enemy_crypt_fiend: [
    { lines: ['Massive HP. High defense. Slow. Hits very hard.', 'It\u2019s going to outlast most approaches.', 'You\u2019ll need either strong offense or strong healing.'] },
    { lines: ['The rot isn\u2019t damage to it. It\u2019s part of the structure.', 'It is not decaying. It was built this way.'] },
    { lines: ['It swings like it\u2019s compensating for something missing.', 'A full arm, maybe. Or the understanding that you\u2019re smaller than the threat register says.'] },
  ],
  enemy_void_walker: [
    { lines: ['Devastating attack. Light armor.', 'It hurls shards of void on top of its blows, and may curse you when it lands a hit.', 'A Void Shard of your own wards off the splinters. Kill it before it kills you.'] },
    { lines: ['It doesn\u2019t leave footprints.', 'You\u2019ve been watching and you can\u2019t explain why.'] },
    { lines: ['The void-touch comes from whatever passes for its hands.', 'The curse isn\u2019t hostile, exactly. It\u2019s just what it carries.'] },
  ],
  // ── Far map enemies (MAP3 / MAP_N1 / MAP_N2) ───────────────────────────────
  enemy_fen_lurker: [
    { lines: ['High speed. Solid attack. Moderate HP.', 'Ambush predator \u2014 it will strike first almost every time.', 'Keep your guard up early.'] },
    { lines: ['It\u2019s been watching you since you entered this tile.', 'The movement you thought was reeds was it.'] },
    { lines: ['It hunts by stillness first, then speed.', 'You interrupted the stillness phase.', 'That\u2019s why it\u2019s irritated.'] },
  ],
  enemy_rotwood_troll: [
    { lines: ['Very high HP. High defense. Very slow. Hits hard.', 'A war of attrition. It will win a short fight.', 'You need to outlast it \u2014 or overwhelm it fast.'] },
    { lines: ['The rot in the wood is what holds it together, not what\u2019s breaking it down.', 'Old fen biology. It\u2019s been here longer than the surveying commission.'] },
    { lines: ['It regenerates if you let it rest.', 'Not quickly. But noticeably.', 'Don\u2019t let it rest.'] },
  ],
  enemy_thornback: [
    { lines: ['The moment you close in, it curls behind its spines \u2014 your melee just glances off, and it lashes straight back.', 'Don\u2019t trade blows with it. Use a projectile \u2014 a thrown weapon gets past the guard.', 'Under the spines it\u2019s soft: one good throw should finish it.'] },
    { lines: ['The spines on the dorsal ridge are not for display.', 'They\u2019ve been used. Frequently.'] },
    { lines: ['It has no particular interest in you. This isn\u2019t personal.', 'That doesn\u2019t make it less dangerous.'] },
  ],
  enemy_fen_witch: [
    { lines: ['Devastating attack. Very fragile. Moderate speed.', 'She will poison you if she hits. Avoid letting her land shots.', 'Glass cannon. End it quickly.'] },
    { lines: ['The curse she carries isn\u2019t from a ritual. It\u2019s older than that.', 'The fen gave it to her. She\u2019s been augmenting it since.'] },
    { lines: ['She\u2019s been out here long enough that the boundary between her and the marsh is approximate.', 'She doesn\u2019t seem to notice.'] },
  ],
  enemy_bog_serpent: [
    { lines: ['High HP. Moderate attack. Good speed.', 'It can strike before you can.', 'Durable. Don\u2019t expect a quick win.'] },
    { lines: ['It surfaces specifically to attack. Between combats it stays under.', 'The mud here is warm where it\u2019s been resting.'] },
    { lines: ['Bog serpents in this range can go weeks without eating.', 'It\u2019s not hungry.', 'It\u2019s territorial.'] },
  ],
  // ── Thornmere ──────────────────────────────────────────────────────────────
  enemy_corpse_slug: [
    { lines: ['Massive HP. High defense. Extremely slow.', 'Its slime scrambles your footing when it hits.', 'Kill it before the movement penalty accumulates.'] },
    { lines: ['It\u2019s been here longer than the trail markers.', 'The pale colour isn\u2019t disease \u2014 nothing photosensitive survives this far into the shallows.'] },
    { lines: ['The slime it leaves is technically a byproduct, not a weapon.', 'The distinction matters less when you can\u2019t stand straight.'] },
  ],
  // ── East Sluice ────────────────────────────────────────────────────────────
  enemy_sluice_slime: [
    { lines: ['A slow, gooey blob. Low HP, light attack.', 'Its slime soaks up a hit or two, but it can barely keep pace.', 'Nothing a first fight can’t handle.'] },
    { lines: ['It’s the sluice muck itself, more or less — silt, algae, and canal runoff that started moving.', 'Common on the top level, where the water sits still and warm.'] },
    { lines: ['It leaves a clean streak on the stone where it’s passed.', 'Whatever it takes up, it takes up completely.'] },
  ],
  enemy_reed_grappler: [
    { lines: ['Armored shell. Moderate attack. Average speed.', 'It occasionally braces \u2014 don\u2019t waste a heavy hit during that.'] },
    { lines: ['Freshwater crustacean. Canal-native, not fen-native.', 'It followed the drainage channels in and hasn\u2019t left.'] },
    { lines: ['The shell is thickest on the dorsal and flank plates.', 'The joint gaps are less protected.', 'You already knew that, instinctively.'] },
  ],
  enemy_silt_lurker: [
    { lines: ['Very fast. High attack. Extremely fragile.', 'It erupts from canal mud \u2014 almost always strikes first.', 'Don\u2019t give it a second shot.'] },
    { lines: ['It doesn\u2019t pursue. One ambush, then it resets.', 'If you survive the first strike, the balance shifts.'] },
    { lines: ['The silt it comes from is cold.', 'It\u2019s been waiting in it for something roughly your size.', 'You qualify.'] },
  ],
  // ── The North Basin — Silt Flats ───────────────────────────────────────────
  enemy_silt_crab: [
    { lines: ['Slow. Shelled. Occasionally braces.', 'Not dangerous on its own \u2014 the shell just means it takes longer than it should.'] },
    { lines: ['It was probably living here when there was still enough water to hide in.', 'It didn\u2019t relocate. It just got shallower.'] },
    { lines: ['The stranding doesn\u2019t seem to bother it.', 'It\u2019s had time to get used to worse.'] },
  ],
  enemy_mudflat_strider: [
    { lines: ['Fast. Fragile.', 'Not much of a threat once it\u2019s hit.', 'It\u2019s not built for a fight. It\u2019s built for not needing one.'] },
    { lines: ['Long-legged, built for walking mud without sinking.', 'The exposed flats haven\u2019t hurt it. If anything, there\u2019s more ground to work now.'] },
    { lines: ['It probes for things buried just under the surface.', 'You\u2019re not what it\u2019s looking for.', 'It\u2019s still going to try.'] },
  ],
  // ── Dungeon floors 6–7 ─────────────────────────────────────────────────────
  enemy_hollow: [
    { lines: ['Very high defense. Heavy attack. Moderate speed.', 'It braces occasionally.', 'It will outlast a reactive strategy. You need to push first.'] },
    { lines: ['The shell is not empty. Something minimal is animating it.', 'The original occupant is not in evidence.'] },
    { lines: ['It doesn\u2019t seem to notice damage unless the threshold is significant.', 'Below that threshold, it just keeps moving.'] },
  ],
  enemy_fen_shade: [
    { lines: ['Very high attack. Light armor. Good speed.', 'Spectral remnant \u2014 fast and devastating.', 'First-strike risk is high. Hit hard and early.'] },
    { lines: ['It seeped down from the wetlands above through the drainage cracks.', 'The dungeon environment has not improved its temperament.'] },
    { lines: ['The form it\u2019s holding isn\u2019t its original one.', 'Whatever it looked like before is gone.', 'This is what the fen left behind.'] },
  ],
  // ── Dungeon floor 8 ────────────────────────────────────────────────────────
  enemy_tomb_sentry: [
    { lines: ['Enormous HP. Extreme defense. Very slow.', 'Braces frequently.', 'This is going to take a long time. Prepare for sustained attrition.'] },
    { lines: ['It was petrified and then reanimated. In that order.', 'The original internment was voluntary.', 'The reanimation was not.'] },
    { lines: ['The brace is not a response to threat assessment.', 'It\u2019s a fixed-interval behaviour. You can predict it if you pay attention.'] },
  ],
  enemy_crypt_revenant: [
    { lines: ['Very high attack. Moderate defense. High speed.', 'Fast and savage. It strikes first.', 'Offensive pressure is the only viable strategy.'] },
    { lines: ['Buried twice, based on the markings. The second burial didn\u2019t take either.', 'The stonework on these walls is notably recent compared to the surrounding chambers.'] },
    { lines: ['It isn\u2019t angry. It doesn\u2019t have enough coherence left for anger.', 'It\u2019s just motion and damage, continuously.'] },
  ],
  // ── Horror branches ────────────────────────────────────────────────────────
  enemy_wall_tendril: [
    { lines: ['Extreme attack. Very fragile. Very fast.', 'It will almost always go first and hit catastrophically.', 'You need to kill it in one or two hits, or this will go badly.'] },
    { lines: ['It grows from the wall itself. There is no discrete body to target.', 'You\u2019re damaging a part of something larger and being targeted by a different part.'] },
    { lines: ['It doesn\u2019t bleed. The fluid it exudes when struck is not blood.', 'You don\u2019t want to think too hard about what it is.'] },
  ],
  enemy_dripping_maw: [
    { lines: ['Massive HP. Heavy attack. Slow.', 'It forms in the ceiling and drops acid.', 'You have time between strikes. Use it.'] },
    { lines: ['It\u2019s not a separate creature. It is a feature of this branch.', 'The ceiling is part of whatever this place has become.'] },
    { lines: ['The acid isn\u2019t random. It\u2019s targeted.', 'Something with a mouth has preferences.', 'You are currently one of them.'] },
  ],
  enemy_the_seep: [
    { lines: ['Catastrophic attack. No defense. Extreme speed.', 'No armor whatsoever.', 'It hits first. It hits very hard. Kill it before it kills you.'] },
    { lines: ['It doesn\u2019t have a fixed form. It\u2019s using mass instead of structure.', 'The floor in here is wet from something that is neither water nor blood.'] },
    { lines: ['It doesn\u2019t strategize. It maximizes contact.', 'You are currently something it wants to maximize contact with.', 'Keep moving.'] },
  ],
  // ── Sunken Gallery ─────────────────────────────────────────────────────────
  enemy_pale_drowned_gallery: [
    { lines: ['Fast. Hard-hitting. Light armor.', 'It will usually strike first, and every hit matters.', 'Do not settle into an exchange of blows.'] },
    { lines: ['The fen took someone and left this.', 'It doesn\u2019t remember what happened. It just knows this place.'] },
    { lines: ['The pale colouring is fen-water saturation. The shape is what\u2019s left of what it was.', 'It doesn\u2019t seem to recognise what it\u2019s becoming.'] },
  ],
  enemy_silt_hag_gallery: [
    { lines: ['Severe attack. High defense. Slow.', 'Bog-curse made solid. It can outlast you and hit hard enough to end the argument.', 'Stay ahead of its turn order.'] },
    { lines: ['It condenses from the silt where the vault floor meets the water.', 'This is apparently where it\u2019s supposed to be.'] },
    { lines: ['It doesn\u2019t decompose between encounters.', 'It disperses into the silt and reforms.', 'You\u2019re not sure which state is the real one.'] },
  ],
  // ── Rainfish ───────────────────────────────────────────────────────────────
  enemy_rainfish: [
    { lines: ['Extremely fast. Fragile.', 'You can\u2019t run \u2014 the school is all around you.', 'Hit hard and fast. Every one you leave standing is another problem.'] },
    { lines: ['They\u2019re not attacking out of hunger. You\u2019re in their space.', 'The disturbance at the bank triggered this.'] },
    { lines: ['Rainfish school defensively, not offensively.', 'They\u2019ve decided you\u2019re a threat to the school and the school agrees.', 'No negotiating that.'] },
  ],
  // ── Special encounters ─────────────────────────────────────────────────────
  enemy_kolm: [
    { lines: ['Strong. Well-rested. He fights for fun.', 'Solid defense. Moderate speed.', 'He\u2019s not going to make a mistake. You\u2019ll have to make him.'] },
    { lines: ['He\u2019s done this enough times that he\u2019s stopped counting the fights.', 'That\u2019s either a good sign or a very bad one.'] },
    { lines: ['He adjusts between exchanges. He\u2019s watching you the same way you\u2019re watching him.', 'He nods slightly when he notices you observing.', 'Professional courtesy.'] },
  ],
  enemy_smuggler_guard: [
    { lines: ['Trained. Moderate attack and defense.', 'This is a job to them, not a conviction.', 'They\u2019ll fight hard but they\u2019re not going to die for Polwick.'] },
    { lines: ['They didn\u2019t choose this posting. You can see it in how they stand.', 'That doesn\u2019t change the blade in their hand.'] },
    { lines: ['They\u2019re watching for you to hesitate.', 'Don\u2019t give them the window.'] },
  ],
  enemy_polwick: [
    { lines: ['Fast. Strong. He\u2019s been waiting for this.', 'Better than the guard. He\u2019s fought his way into this position.', 'Firelit \u2014 he\u2019ll set you alight if he gets a hand on you. Watch for the burn.'] },
    { lines: ['He runs the fort through intimidation and performance.', 'This is both.', 'He needs you to lose visibly.'] },
    { lines: ['His form is good. He trained somewhere.', 'The fire is rareborn, not trained \u2014 firelit, like the fen brewers warn about.', 'He\u2019s also been drinking, which complicates reading him.'] },
  ],
  enemy_essa: [
    { lines: ['Fast. Fragile. Desperate.', 'She has nothing left to lose here.', 'Desperate fighters are unpredictable. End it cleanly.'] },
    { lines: ['Whatever she was doing at the fort, she believed in it.', 'That\u2019s enough to make someone dangerous even when they\u2019re losing.'] },
    { lines: ['She\u2019s not fighting to win. She\u2019s fighting because stopping feels worse.', 'You understand that.', 'End it before either of you has to think about it further.'] },
  ],
  enemy_briar_warden: [
    { lines: ['Durable. Strong. Moderate speed.', MUDSLITHER_INFLICTABLE ? 'It will Muddy you if it connects — that penalty stacks badly.' : 'It trades blows better than you do — you will lose an exchange of hits.', 'Avoid taking hits. Easier said.'] },
    { lines: ['It grew out of the fen ecology, not into it.', 'The briars are structural. It doesn\u2019t stop growing.'] },
    { lines: ['It doesn\u2019t consider this a conflict.', 'You are an obstacle in its territory.', 'It is responding to an obstacle.'] },
  ],
  enemy_pale_sentry: [
    { lines: ['Extraordinary HP. Very high defense. Slow.', 'This fight will not end today.', 'Hit it, get out, come back. Chip it down.'] },
    { lines: ['It rose from the fen grass and has not left.', 'The contract from the board doesn\u2019t say what made it.', 'Whatever did, they were not modest about it.'] },
    { lines: ['It takes damage. You\u2019ve confirmed that.', 'It doesn\u2019t react to damage.', 'Those are different things.'] },
  ],
  enemy_den_wraith: [
    { lines: ['Moderate HP. High speed. Curse risk every time it hits you.', 'Do not let it land multiple hits.', 'It waits in corners. It doesn\u2019t patrol.'] },
    { lines: ['The house absorbed something and didn\u2019t let go.', 'Whatever the den wraith was before it settled here has been replaced by what the house made it into.'] },
    { lines: ['The curse it carries is not deliberate.', 'It just carries it.', 'The distinction doesn\u2019t help with the symptoms.'] },
  ],
  enemy_mulholland: [
    { lines: ['Wrong proportions. Heavy attack. High defense. Slow.', 'It registers you as a threat at threshold distance.', 'That threshold is shorter than expected for this size.'] },
    { lines: ['The angles on it are wrong. Not injured \u2014 wrong.', 'Assembled from several separate things. Not carefully.'] },
    { lines: ['It doesn\u2019t move the way a large creature should.', 'The joints are approximate.', 'It\u2019s compensating and you can\u2019t tell what for.'] },
  ],
  enemy_wrongteeth: [
    { lines: ['Boss. High HP. Heavy attack. Moderate defense and speed.', 'There are others like it ahead, according to what it said.', 'It fights seriously. So should you.'] },
    { lines: ['It\u2019s been down here a long time.', 'One eye large, one eye small.', 'Neither is entirely human.'] },
    { lines: ['It doesn\u2019t want to be here either.', 'You\u2019re both stuck in this.', 'That doesn\u2019t make it easier.'] },
  ],
  enemy_takomo: [
    { lines: ['High attack. Moderate defense. Moderate speed.', 'The heat in here is worse when he\u2019s focusing.', 'He\u2019s focused.'] },
    { lines: ['He came here voluntarily. That makes him different from most of what\u2019s in the dungeon.', 'Whatever he was looking for in this chamber, he found it. Then he stayed.'] },
    { lines: ['He fights like someone who has practiced this specific fight for years.', 'Possibly because he has.', 'He doesn\u2019t look like he needs to win. Just to see how far you get.'] },
  ],
  enemy_mimic_potion: [
    { lines: ['It looks exactly like a dropped potion. It is not a dropped potion.',
              'Almost no HP and no armour — two clean hits will burst it.',
              'But that attack is enormous. Do not let it trade with you at low health.'] },
    { lines: ['Something in the drowned gallery learned the shape of the thing adventurers most want to find.',
              'It has been waiting in the far room, being a potion, very patiently.'] },
    { lines: ['The "glass" is a shell it can drop in an instant.',
              'Everything it has, it puts into the first blow.', 'There is not much behind it — if you survive that.'] },
  ],
  // First Observe both READS as the solution and UNLOCKS escape for this fight
  // (combat.js Run/Observe handlers key off the enemy's `runLock` capability).
  enemy_lensweb_spider: [
    { lines: ['It guards the lens fiercely, but it makes no move to leave the web.',
              'It is territorial, not a hunter \u2014 back away and it will not follow.',
              'You could retreat safely now, objective in hand.'] },
    { lines: ['Generations of webbing have grown over the dead lens, thick as felt.',
              'The spider has had the run of the lantern room since the light went out.'] },
    { lines: ['It does not pursue past the frame of its own web.',
              'Everything it needs is here, in the ruin of the mechanism.',
              'Beyond that, it has no interest in you at all.'] },
  ],
};

// Several distinct template ids share one display identity (e.g. the three
// Marsh Wisp variants and the two Silt Hags). Observe lore is per
// identity, so alias the sibling ids onto the base id's entry -- keeping the
// lookup purely id-keyed without duplicating the authored text. Each row is
// [baseId, ...siblingIds]; validateEnemies() confirms every id here is a
// registered template. (Mire Toad ids are intentionally NOT aliased here --
// they use the sex-based Observe branch in getObservationText().)
(function aliasSharedObservations() {
  const groups = [
    ['enemy_marsh_wisp', 'enemy_marsh_wisp_early', 'enemy_marsh_wisp_sluice_top'],
    ['enemy_briar_hound', 'enemy_briar_hound_early'],
    ['enemy_silt_crab', 'enemy_silt_crab_upper'],
    ['enemy_silt_hag_gallery', 'enemy_silt_hag_vault'],
  ];
  for (const [base, ...siblings] of groups) {
    if (!ENEMY_OBSERVATIONS[base]) continue;
    for (const id of siblings) ENEMY_OBSERVATIONS[id] = ENEMY_OBSERVATIONS[base];
  }
})();

// Returns observation text for the current enemy and observe count.
// Falls back to stat-derived traits on first look, then to a generic line.
function getObservationText(enemy, count) {
  // Sexed enemies (the identical-looking Mire Toads) can ONLY be told apart by
  // observing them — nothing in the battle art or name gives it away. The first
  // Observe reveals the sex (and hints at the matching reagent); later Observes
  // add flavour. This runs ahead of the name-keyed table below.
  if (enemy.sex) {
    // The sex is told by a real, subtle physical difference Lélý spots on close
    // study — nuptial pads and a vocal-sac throat on the male; the larger, egg-
    // heavy body and smooth fingers of the female — not by intuition.
    const reveal = enemy.sex === 'male'
      ? ['Lélý reads the animal, not the fight.',
         'Rough nuptial pads, a swelling throat-sac — this one is a male. A jack.',
         'Jackbane is the matching reagent. It should bring this one down.']
      : ['Lélý reads the animal, not the fight.',
         'Egg-heavy and round, throat pale, fingers smooth — this one is a female. A hen.',
         'Henbane is the matching reagent. It should bring this one down.'];
    const later = [
      ['Jack and hen look identical — only the tells give it away.',
       'Now you know which bane to use.'],
      ['It watches you back now, toad-patient. It has all the time the fen has.',
       'Which is all of it.'],
    ];
    if (count === 0) return reveal;
    return later[Math.min(count - 1, later.length - 1)];
  }
  const entries = ENEMY_OBSERVATIONS[enemy.id];
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
    if (enemy.dazzleChance)                           traits.push('Blinding dust.');
    if (enemy.regenPerTurn)                           traits.push('Regenerates.');
    if (enemy.thornsReflect)                          traits.push('Spines reflect damage.');
    if (enemy.acidChance)                             traits.push('Acid — corrodes armor.');
    if (enemy.splits)                                 traits.push('Splits when struck down.');
    if (enemy.stealAndFlee)                           traits.push('Thief — steals gold and flees.');
    if (enemy.meleeArmor)                             traits.push('Melee glances off — throw at it.');
    if (enemy.counterChance)                          traits.push('Counters melee.');
    const line2 = traits.length > 0 ? traits.join(' ') : 'Nothing obvious stands out.';
    return ['L\u00e9l\u00fd watches carefully.', line2];
  }
  return ['L\u00e9l\u00fd watches for another opening, but learns nothing new.'];
}

function recoverCombatDefeat() {
  const completedRecovery = completedSingleExitCandidate(true);
  stats.hp   = stats.maxHp;
  stats.gold = 0;
  day++;
  ['poison', 'muddied', 'slither', 'cursed'].forEach(id => removeStatusEffect(id));
  endCombat();
  dialogue.name  = '';
  if (defeatWakeAtHome) {
    // Someone carried you home: wake beside your own bed in the Calwick
    // player house, wherever the defeat happened. EVERY location flag
    // currentContentLocationKey() consults must be cleared here — a stuck flag (e.g.
    // inBridgePost after dying at the toll bridge) makes currentContentLocationKey()
    // report that location on every map, so its NPCs render everywhere.
    // Toggleable from the debug menu ("Home on Defeat").
    // The canonical transition resets EVERY location flag (the old hand-cleared
    // list here was exactly the fragility this refactor removes), then applies
    // the player-house context. Bridge toll state can't survive being carried
    // off the bridge: restore both guards to their blocking posts (the flags
    // are cleared by the reset). Same map-local invariant for auto-patrols
    // (Tobb Wend). Toggleable from the debug menu ("Home on Defeat").
    resetBridgeGuards();
    if (typeof resetAllPatrols === 'function') resetAllPatrols();
    transitionToLocation({
      mapId: 'HOUSE_INTERIOR_MAP', x: 9.5 * TILE, y: 3.5 * TILE, facing: 'down', // on the floor beside the bed
      state: {
        inTown: true, currentTownId: 'calwick', townBuilding: 'house', currentHouseId: 'player_house',
        houseSourceMap: WEST_TOWN_MAP, houseSourceBuilding: 'west', houseReturnPos: { x: 2.5 * TILE, y: 12.5 * TILE },
      },
    });
    dialogue.pages = [['\u2026a day later, you awaken in your own bed, without your gold.',
                       'Someone must have carried you home.']];
  } else {
    dialogue.pages = [['\u2026a day later, you awaken without your gold.']];
  }
  dialogue.open  = true;
  dialogue.page  = 0;
  if (!defeatWakeAtHome || (activeMap === HOUSE_INTERIOR_MAP && currentHouseId === 'player_house'))
    completedSingleVictoryReceipt = completedRecovery;
}

function handleCombatAction() {
  if (combat.mode === 'formation') throw new Error('Formation state cannot process singleton actions');
  if (combat.phase === 'message') { advanceCombatMessage(); return; }
  if (combat.phase === 'victory') {
    if (combat.isMireToadSpawn) {
      if (combat.mireToadRemaining > 0) {
        const nextRemaining = combat.mireToadRemaining - 1;
        endCombat();
        dialogue.name = '';
        dialogue.pages = [[nextRemaining === 1
          ? 'The first toad sinks into the mud. The spawning bed convulses again.'
          : 'The second toad falls. One last shape churns through the reeds.']];
        dialogue.callbacks = [function() { startMireToadSpawnCombat(nextRemaining); }];
        dialogue.open = true;
        dialogue.page = 0;
      } else {
        const site = (typeof PICKUP_REGISTRY !== 'undefined')
          ? PICKUP_REGISTRY.pickup_map3n1_mire_toad_spawn
          : null;
        endCombat();
        if (site && !site.picked) {
          grantItem('Reed Remedy');
          site.picked = true;
        }
        dialogue.name = '';
        dialogue.pages = [
          ['The last Mire Toad slumps into the shallow water. The spawning bed is still.'],
          ['Among the torn reeds, a tightly bound twist of medicinal stalks has washed free of the mud.'],
          ['Found: Reed Remedy.'],
        ];
        dialogue.callbacks = null;
        dialogue.open = true;
        dialogue.page = 0;
      }
      return;
    }
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
    if (combat.isSeepSplit) {
      if (combat.seepSplitRemaining > 0) {
        // The mass doesn't die — it splits. Chain the smaller half immediately.
        const nextRemaining = combat.seepSplitRemaining - 1;
        endCombat();
        dialogue.name  = '';
        dialogue.pages = [['The Seep bursts apart — but the pieces are still moving.']];
        dialogue.callbacks = [function() { startSeepSplitCombat(nextRemaining); }];
        dialogue.open  = true;
        dialogue.page  = 0;
      } else {
        // The last remnant is destroyed.
        endCombat();
        dialogue.name  = '';
        dialogue.pages = [['The last of the Seep slumps and stops moving.']];
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
         '\u201ccan you\u2026 can you let me hold you.\u201d'],
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
    if (combat.isLenswebSpider) {
      // XP/gold/potion were already awarded once by applyKillRewards when the
      // spider fell. Finalize the event (grant the pending route item + resolve)
      // through the shared idempotent authority; a repeat callback is inert.
      const objective = finalizeLenswebSpiderEvent();
      endCombat();
      dialogue.name  = '';
      dialogue.pages = [
        ['The spider shudders and folds its legs beneath it.',
         'It sinks back into the felted web over the dead lens and goes still.'],
        objective
          ? [`The ${objective} is yours, freed from the web at last.`,
             'The lantern room is quiet again.']
          : ['The lantern room is quiet again.'],
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
      queueDialogueEncounter('fort_polwick');
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
      queueDialogueEncounter('fort_essa');
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
    const completedVictory = completedSingleVictoryCandidate();
    endCombat();
    completedSingleVictoryReceipt = completedVictory;
    return;
  }
  if (combat.phase === 'defeat') {
    recoverCombatDefeat();
    return;
  }
  // Singleton action-entry boundary. Calculations use this exact instance;
  // deferred effects below resolve its stable id without rereading the accessor.
  const enemy = combat.enemy;
  if (combat.phase === 'item') {
    // Grouped view: multiples of the same item share one row (see groupItems()),
    // exactly like the pause menu's item list. The cursor indexes groups; the
    // action operates on the group's representative instance.
    const groups = groupItems();
    if (combat.itemCursor === groups.length) {
      // "Back" entry selected \u2014 return to the action menu; no turn spent, no enemy response.
      combat.phase = 'choose';
      return;
    }
    const group = groups[combat.itemCursor];
    if (!group) return;
    const item = group.item;

    // Using an item spends the turn, so the Bullet Time buff ticks down here.
    // Bullet Time's own activation (below) re-sets evadeTurns afterwards, so the
    // turn it is used on stays covered.
    tickEvadeBuff();

    const msgs = [];
    let enemyActs = true; // whether the enemy still gets its turn after this
    if (item.sexBane) {
      // Sex-specific reagent (Henbane Sprig / Jackbane Vial). Consumed on use.
      // A sex-matched target drops instantly (no counter); the wrong sex, or any
      // enemy without a sex, shrugs it off and the turn is wasted.
      stats.items.splice(stats.items.indexOf(item), 1);
      combat.itemCursor = Math.min(combat.itemCursor, groupItems().length);
      if (enemy.sex === item.sexBane) {
        enemy.hp = 0;
        msgs.push(`Used ${item.name} \u2014 the ${enemy.name} stiffens, shudders once, and goes still. The right sort.`);
        applyKillRewards(enemy, msgs);
        enemyActs = false; // it's dead; it doesn't strike back
      } else if (enemy.sex) {
        msgs.push(`Used ${item.name} \u2014 the ${enemy.name} shakes it off. Wrong sort entirely.`);
      } else {
        msgs.push(`Used ${item.name} \u2014 it does nothing to the ${enemy.name}. Wasted on this one.`);
      }
    } else if (item.type === 'potion') {
      if (isStatusCureItem(item)) {
        // One shared path for every status-cure item: cures an active matching
        // status (with its confirmation), else "\u2026nothing happens." \u2014 but the
        // item is still consumed and the turn still spent (the enemy still acts
        // below, via enemyActs). Never heals HP or touches an unrelated status.
        const res = applyStatusCure(item);
        stats.items.splice(stats.items.indexOf(item), 1);
        combat.itemCursor = Math.min(combat.itemCursor, groupItems().length);
        msgs.push(res.message);
      } else {
        const healed = healingItemAmount(item, stats.hp, stats.maxHp);
        stats.hp += healed;
        const muddies = MUDSLITHER_INFLICTABLE && item.causesMuddied;
        if (muddies) addStatusEffect('muddied');
        stats.items.splice(stats.items.indexOf(item), 1);
        combat.itemCursor = Math.min(combat.itemCursor, groupItems().length);
        msgs.push(muddies
          ? `Used ${item.name} \u2014 restored ${healed} HP. Legs feel heavy.`
          : `Used ${item.name} \u2014 restored ${healed} HP!`);
      }
    } else if (item.type === 'buff') {
      // Consumable combat buff (Bullet Time). Consumed on use; sets the evade
      // buff. The turn is still spent (enemyActs stays true), but that enemy
      // response is now rolled against the fresh evade rate.
      if (item.evadeTurns) combat.evadeTurns = item.evadeTurns;
      stats.items.splice(stats.items.indexOf(item), 1);
      combat.itemCursor = Math.min(combat.itemCursor, groupItems().length);
      const pct = Math.round((item.evadeRate || 0) * 100);
      msgs.push(`Used ${item.name} \u2014 the world slows to a crawl. Evade up to ${pct}% for ${item.evadeTurns} turns.`);
    } else if (item.type === 'throwable' && item.fuse) {
      // Delayed throwable (e.g. Bomb). Using it spends the turn but does nothing
      // yet \u2014 it arms a fuse that detonates a few player-turns later (bombFuseEntry).
      // Consumed on use; the enemy still acts this turn.
      combat.bombTargetInstanceId = enemy.instanceId;
      combat.bombFuse       = item.fuse;
      combat.bombDamage     = item.damage;
      combat.bombIgnoresDef = !!item.ignoresDef;
      combat.bombJustArmed  = true;   // this turn is the "use" turn, not one of the three after
      stats.items.splice(stats.items.indexOf(item), 1);
      combat.itemCursor = Math.min(combat.itemCursor, groupItems().length);
      msgs.push(`You prime the ${item.name} and lob it at the ${enemy.name}. Its fuse begins to hiss\u2026`);
    } else if (item.type === 'throwable') {
      // Immediate damage consumable (e.g. Sapper Charge). Always lands (no evade
      // roll); `ignoresDef` bypasses the target's DEF entirely. Consumed on use, and
      // \u2014 unless it kills \u2014 the turn is still spent, so the enemy still counters.
      const dmg = offensiveItemDamage(item, enemy);
      enemy.hp = Math.max(0, enemy.hp - dmg);
      stats.items.splice(stats.items.indexOf(item), 1);
      combat.itemCursor = Math.min(combat.itemCursor, groupItems().length);
      msgs.push(`Used ${item.name} \u2014 it ${item.impactVerb || 'hits'} the ${enemy.name} for ${dmg} damage!`);
      if (enemy.hp <= 0) {
        applyKillRewards(enemy, msgs);
        enemyActs = false; // nothing left to strike back
      }
    } else if (item.type === 'stun') {
      // Trollbane. On a regenerating enemy (the Rotwood Troll) it seizes it up:
      // the enemy reels this turn (no counter, enemyActs = false) and can't
      // self-heal for the next few turns (combat.enemyStunTurns, gated in
      // enemyRegenEntry). On anything that doesn't regenerate it does nothing and
      // the turn is wasted, matching a mismatched reagent. Consumed either way.
      stats.items.splice(stats.items.indexOf(item), 1);
      combat.itemCursor = Math.min(combat.itemCursor, groupItems().length);
      if (enemy.regenPerTurn) {
        combat.enemyStunTurns = item.stunTurns;
        enemyActs = false;
        msgs.push(`Used ${item.name} — the ${enemy.name} seizes up, its rot going grey and slack. It won't be mending itself for a while.`);
      } else {
        msgs.push(`Used ${item.name} — it does nothing to the ${enemy.name}. Wasted on this one.`);
      }
    } else {
      equipItem(item);
      msgs.push(`Equipped ${item.name}!`);
    }

    // Using an item consumes the turn just like Attack \u2014 the enemy still acts,
    // UNLESS a reagent just killed it (nothing left to counter).
    if (enemyActs) {
      msgs.push(enemyTurnResponse(enemy, d => `${enemy.name} attacks for ${d}!`));
      // Burn ticks at the end of the turn, after the enemy's response.
      const itemBurn = burnTickEntry(enemy);
      if (itemBurn) msgs.push(itemBurn);
      // Enemy regen (Rotwood Troll): using an item is a spent turn, so it heals too.
      const itemRegen = enemyRegenEntry(enemy);
      if (itemRegen) msgs.push(itemRegen);
      // Bomb fuse: a spent turn (including arming another item) burns it down.
      const itemBomb = bombFuseEntry();
      if (itemBomb) msgs.push(itemBomb);
    }

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
  // Every turn-spending action (attack / run / observe) ticks the Bullet Time
  // evade buff down by one. Opening the item subscreen ('item') is not itself a
  // turn — the turn (and its tick) happens when an item is actually used, in the
  // phase==='item' branch above.
  if (action !== 'item') tickEvadeBuff();
  if (action === 'run') {
    // Observe-gated escape (Lensweb Spider): once Observe has revealed the safe
    // retreat, Run is a GUARANTEED success — resolved deterministically with no
    // Math.random() (escapeUnlocked can only ever be set on a runLock enemy).
    // The event finalizer (grant item + resolve) fires when this escape settles;
    // see advanceCombatMessage().
    if (enemy.escapeUnlocked) {
      combat.message      = 'You back away along the web. The spider holds its ground.';
      combat.messageQueue = [];
      combat.pendingEscape = true;
      combat.phase        = 'message';
      return;
    }
    // No-escape fights. Rainfish: the school is all around you in the
    // shallows. Fort arrest sequence (guard → Polwick → Essa): each opponent
    // stands between the player and the fort's only door — and fleeing
    // mid-sequence left the quest in odd half-states (opponents vanishing at
    // off-stages, the chain resumable in the wrong order), so Run is simply
    // not available. An UN-observed observe-gated enemy (the Lensweb Spider before
    // Observe) is likewise a guaranteed 0% — same deterministic free-hit path, no
    // Math.random(). Attempting it costs the turn: the enemy gets a free hit.
    if (combat.isRainfish || combat.isMireToadSpawn || combat.isFortGuard || combat.isFortPolwick || combat.isFortEssa ||
        enemy.runLock === 'observe_gated') {
      const roll   = rollAttackDamage(enemy.atk, effectivePlayerIncomingMitigation(enemy.atk));
      const dodged = playerEvades(enemy);
      const eDmg   = dodged ? 0 : roll.dmg;
      const ec     = (!dodged && roll.crit) ? 'Critical! ' : '';
      const newHp = Math.max(0, stats.hp - eDmg);
      stats.hp = newHp;
      const noRunText = dodged ? evadeText(true, enemy)
        : combat.isRainfish     ? `${ec}Nowhere to go! Rainfish thrashes for ${eDmg}!`
        : combat.isMireToadSpawn ? `${ec}The spawning bed is all around you! Mire Toad strikes for ${eDmg}!`
        : combat.isFortGuard    ? `${ec}The guard holds the door! He strikes for ${eDmg}!`
        : combat.isFortPolwick  ? `${ec}Polwick stays between you and the door! He strikes for ${eDmg}!`
        : combat.isFortEssa     ? `${ec}Essa keeps herself between you and the door! She strikes for ${eDmg}!`
        :                         `${ec}You can't tell where its web ends! The ${enemy.name} bites for ${eDmg}!`;
      const msgs = [noRunText];
      if (newHp <= 0) { msgs.push(`${stats.name} has fallen...`); combat.pendingDefeat = true; }
      // A blocked run still spends the turn — Burn ticks, same as a failed run.
      const blockedRunBurn = burnTickEntry(enemy);
      if (blockedRunBurn) msgs.push(blockedRunBurn);
      const blockedRunBomb = bombFuseEntry();
      if (blockedRunBomb) msgs.push(blockedRunBomb);
      combat.message = msgs.shift();
      combat.messageQueue = msgs;
      combat.phase = 'message';
      return;
    }
    // Run — same probabilistic speed contest as turn order (speedWinChance):
    // faster gets away more often, slower less, but it's never a certainty.
    const escapeChance = speedWinChance(effectiveSpd(), enemy.spd);
    if (Math.random() < escapeChance) {
      combat.message      = 'Got away safely!';
      combat.messageQueue = [];
      combat.pendingEscape = true;
      combat.phase        = 'message';
    } else {
      // Failed to flee — enemy gets a free hit (unless Bullet Time dodges it)
      const roll   = rollAttackDamage(enemy.atk, effectivePlayerIncomingMitigation(enemy.atk));
      const dodged = playerEvades(enemy);
      const eDmg   = dodged ? 0 : roll.dmg;
      const ec     = (!dodged && roll.crit) ? 'Critical! ' : '';
      const newHp = Math.max(0, stats.hp - eDmg);
      stats.hp = newHp;
      const msgs = [dodged ? `Couldn't escape! ${evadeText(true, enemy)}` : `${ec}Couldn't escape! ${enemy.name} attacks for ${eDmg}!`];
      if (newHp <= 0) {
        msgs.push(`${stats.name} has fallen...`);
        combat.pendingDefeat = true;
      }
      // Burn still ticks on a failed escape — it's a turn spent in the fight.
      const runBurn = burnTickEntry(enemy);
      if (runBurn) msgs.push(runBurn);
      const runBomb = bombFuseEntry();
      if (runBomb) msgs.push(runBomb);
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
    // Determine turn order probabilistically from speed: faster is favoured but
    // never guaranteed (see speedWinChance) -- a slower fighter can still land
    // the first blow, and a faster one can still be beaten to it.
    const playerSpd  = effectiveSpd();
    const enemySpd   = enemy.spd;
    const playerFirst = Math.random() < speedWinChance(playerSpd, enemySpd);

    // Enemy defend — armoured enemies occasionally brace, halving incoming damage and not striking back
    const enemyDefending = !!(enemy.defendChance && Math.random() < enemy.defendChance);
    // `meleeArmor` (Thornback) is extra DEF that applies ONLY to the player's melee
    // Attack — a spined guard that makes close-in strikes glance off. Thrown weapons
    // route through the item path and use plain `def`, so they bypass it entirely.
    const pRoll = rollAttackDamage(effectiveAtk(), enemy.def + (enemy.meleeArmor || 0));
    // Cursed fumble — 25% chance of a wild swing dealing only 1 damage
    const cursedFumble = !enemyDefending && hasStatusEffect('cursed') && Math.random() < 0.25;
    const pDmg = enemyDefending ? Math.max(1, Math.floor(pRoll.dmg / 2))
               : cursedFumble   ? 1
               : pRoll.dmg;
    const pCrit = pRoll.crit && !enemyDefending && !cursedFumble; // only a clean hit reads as a crit
    const pc = pCrit ? 'Critical hit! ' : '';
    const eRoll = rollAttackDamage(enemy.atk, effectivePlayerIncomingMitigation(enemy.atk));
    const eDmg  = eRoll.dmg;
    const ec    = eRoll.crit ? 'Critical! ' : '';
    // Actual melee damage the player's Attack lands this turn (0 = missed/evaded),
    // read by the Thornback thorns-reflection block after the trade resolves.
    let playerDamageDealt = 0;


    if (enemyDefending) {
      // ── Enemy bracing: player deals half damage, enemy does not strike back ──
      enemy.hp = Math.max(0, enemy.hp - pDmg);
      playerDamageDealt = pDmg;
      msgs.push(`${enemy.name} braces! ${stats.name} deals only ${pDmg} damage.`);
      if (enemy.hp <= 0) applyKillRewards(enemy, msgs);

    } else if (playerFirst) {
      // ── Player attacks first ──────────────────────────────────────────────
      if (enemyEvades(enemy)) {
        msgs.push(evadeText(false, enemy));
      } else {
        enemy.hp = Math.max(0, enemy.hp - pDmg);
        playerDamageDealt = pDmg;
        msgs.push(cursedFumble
          ? `Cursed! ${stats.name} swings wildly for ${pDmg} damage.`
          : `${pc}${stats.name} attacks for ${pDmg} damage!`);
      }

      if (enemy.hp <= 0) {
        applyKillRewards(enemy, msgs);
      } else {
        // The enemy still takes its own swing the same turn — a full trade, so
        // the player never re-selects Attack. Damage is deferred until the
        // message is shown; a speed-based evade (incl. Bullet Time) may dodge it.
        const dodged  = playerEvades(enemy);
        const eDmgEff = dodged ? 0 : eDmg;
        msgs.push({
          text: dodged ? evadeText(true, enemy) : `${ec}${enemy.name} strikes for ${eDmgEff}!`,
          apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) {
            if (dodged) return;
            stats.hp = Math.max(0, stats.hp - eDmgEff);
            applyEnemyHitEffects(enemy);
            if (stats.hp <= 0) {
              combat.messageQueue.push(`${stats.name} has fallen...`);
              combat.pendingDefeat = true;
            }
          }),
        });
      }
    } else {
      // ── Enemy attacks first (higher speed) ───────────────────────────────
      // Pre-calculate outcomes so the queue can be built deterministically.
      // The player may evade the enemy's strike (incl. Bullet Time); the player
      // still lands their own attack the same turn (a full trade), which the
      // enemy may in turn evade.
      const dodged      = playerEvades(enemy);
      const eDmgEff     = dodged ? 0 : eDmg;
      const newPlayerHp = Math.max(0, stats.hp - eDmgEff);
      const enemyDodged = enemyEvades(enemy);
      const newEnemyHp  = enemyDodged ? enemy.hp : Math.max(0, enemy.hp - pDmg);

      msgs.push({
        text: dodged ? evadeText(true, enemy) : `${ec}${enemy.name} strikes first for ${eDmgEff}!`,
        apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) {
          stats.hp = newPlayerHp;
          if (!dodged) applyEnemyHitEffects(enemy);
          if (newPlayerHp <= 0) {
            combat.messageQueue.push(`${stats.name} has fallen...`);
            combat.pendingDefeat = true;
          }
        }),
      });

      if (newPlayerHp > 0 && enemyDodged) {
        // The player still swings, but the enemy slips it.
        msgs.push(evadeText(false, enemy));
      } else if (newPlayerHp > 0) {
        // The player still lands their own attack the same turn; the enemy HP
        // update is deferred to match the message.
        const answerText = cursedFumble
          ? `Cursed! ${stats.name} swings wildly for ${pDmg}!`
          : `${pc}${stats.name} attacks for ${pDmg} damage!`;
        msgs.push({
          text: answerText,
          apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) { enemy.hp = newEnemyHp; }),
        });
        playerDamageDealt = pDmg;

        if (newEnemyHp <= 0) applyKillRewards(enemy, msgs);
      }
    }

    // Thornback spines (template `thornsReflect`): a surviving enemy rakes back a
    // fraction of the melee damage the player's Attack dealt this turn. Skipped when
    // the swing missed (playerDamageDealt 0), when the hit killed it (pendingVictory),
    // or when the player already fell to its counter this turn.
    if (enemy && enemy.thornsReflect && playerDamageDealt > 0 &&
        !combat.pendingVictory && !combat.pendingDefeat) {
      const back = Math.max(1, Math.round(playerDamageDealt * enemy.thornsReflect));
      msgs.push({
        text: `The ${enemy.name}'s spines rake back for ${back}!`,
        apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) {
          if (stats.hp <= 0) return;   // player already fell this turn — don't pile on
          stats.hp = Math.max(0, stats.hp - back);
          if (stats.hp <= 0 && !combat.pendingDefeat) {
            combat.messageQueue.push(`${stats.name} has fallen...`);
            combat.pendingDefeat = true;
          }
        }),
      });
    }

    // Counter-attack (template `counterChance`, Thornback): closing in to melee it
    // almost always provokes a retaliatory strike, on TOP of the normal trade — the
    // deterrent that pairs with its melee armor. Rolled only for the player's melee
    // Attack; the player may still evade it. Skipped if the fight already ended.
    if (enemy && enemy.counterChance && !combat.pendingVictory && !combat.pendingDefeat &&
        Math.random() < enemy.counterChance) {
      const cRoll   = rollAttackDamage(enemy.atk, effectivePlayerIncomingMitigation(enemy.atk));
      const cDodged = playerEvades(enemy);
      const cDmg    = cDodged ? 0 : cRoll.dmg;
      msgs.push({
        text: cDodged ? `You slip the ${enemy.name}'s counter!` : `The ${enemy.name} counters, striking back for ${cDmg}!`,
        apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) {
          if (cDodged || stats.hp <= 0) return;
          stats.hp = Math.max(0, stats.hp - cDmg);
          if (stats.hp <= 0 && !combat.pendingDefeat) {
            combat.messageQueue.push(`${stats.name} has fallen...`);
            combat.pendingDefeat = true;
          }
        }),
      });
    }
  } else if (action === 'item') {
    // Always open the item subscreen; it shows "[ Back ]" even when empty
    combat.itemCursor = 0;
    combat.phase = 'item';
    return;
  } else if (action === 'observe') {
    // ── Observe ────────────────────────────────────────────────────────────
    enemy.observeCount++;
    const obsLines = getObservationText(enemy, enemy.observeCount - 1);
    obsLines.forEach(l => msgs.push(l));

    // Observe-gated escape unlock (Lensweb Spider): the first look reveals it
    // won't pursue, and every look after is idempotent — a boolean can't stack or
    // exceed 100%, and it creates no persistent state (cleared on endCombat).
    if (enemy.runLock === 'observe_gated') enemy.escapeUnlocked = true;

    // Roll whether the enemy closes in this turn.
    // Bosses/specials are more relentless: 25% skip chance vs 50% for normal.
    // Any observe-gated boss (the spider) counts as special via its data capability,
    // so no new scattered flag is needed and existing enemies are unaffected.
    const isSpecial = combat.isBoss || combat.isWarden || combat.isFortGuard ||
                      combat.isFortPolwick || combat.isFortEssa || combat.isMulholland ||
                      combat.isPaleSentry || combat.isDenWraith || combat.isSailorBrawl ||
                      combat.isTakomo || combat.isRainfish || combat.isMireToadSpawn || combat.is23 ||
                      !!enemy.runLock;
    const skipChance = isSpecial ? 0.25 : 0.50;
    if (Math.random() < skipChance) {
      msgs.push('It does not close the distance.');
    } else {
      const obsRoll  = rollAttackDamage(enemy.atk, effectivePlayerIncomingMitigation(enemy.atk));
      const dodged   = playerEvades(enemy);
      const obsEDmg  = dodged ? 0 : obsRoll.dmg;
      const obsNewHp = Math.max(0, stats.hp - obsEDmg);
      msgs.push({
        text: dodged ? evadeText(true, enemy) : `${obsRoll.crit ? 'Critical! ' : ''}${enemy.name} strikes for ${obsEDmg}!`,
        apply: bindCombatEnemyEffect(enemy.instanceId, function(enemy) {
          stats.hp = obsNewHp;
          if (!dodged) applyEnemyHitEffects(enemy);
          if (obsNewHp <= 0) {
            combat.messageQueue.push(`${stats.name} has fallen...`);
            combat.pendingDefeat = true;
          }
        }),
      });
    }
  }

  // Burn ticks at the end of the turn (Attack / Observe), after the enemy has
  // acted — but not if the enemy just died (fight's won) or the turn produced
  // no messages at all.
  if (msgs.length > 0 && !combat.pendingVictory) {
    const turnBurn = burnTickEntry(enemy);
    if (turnBurn) msgs.push(turnBurn);
    // Enemy regen (Rotwood Troll) ticks at the end of a turn it survived — Attack
    // AND Observe both reach here, so stalling with Observe lets it heal too.
    const turnRegen = enemyRegenEntry(enemy);
    if (turnRegen) msgs.push(turnRegen);
    // Bomb fuse: Attack and Observe are spent turns that burn it down toward detonation.
    const turnBomb = bombFuseEntry();
    if (turnBomb) msgs.push(turnBomb);
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
