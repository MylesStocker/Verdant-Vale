'use strict';

// Authored enemy identities and registration; no encounter installation.
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
  name: 'Smuggler Guard', hp: 72, maxHp: 72, atk: 22, def: 10, spd: 10,
  xp: 40, goldMin: 12, goldMax: 22,
};
const POLWICK_TEMPLATE = {
  id: 'enemy_polwick',
  name: 'Polwick', hp: 96, maxHp: 96, atk: 25, def: 11, spd: 12,
  xp: 52, goldMin: 20, goldMax: 35,
};
const ESSA_TEMPLATE = {
  id: 'enemy_essa',
  name: 'Essa', hp: 60, maxHp: 60, atk: 23, def: 7, spd: 16,
  xp: 36, goldMin: 10, goldMax: 18,
};

// ─── Pale Sentry — fen road contract creature ─────────────────────────────────
// Spawns on MAP_N2 once sentry_quest_started. HP persists between encounters.
const PALE_SENTRY_TEMPLATE = {
  id: 'enemy_pale_sentry',
  name: 'Pale Sentry', hp: 500, maxHp: 500, atk: 32, def: 10, spd: 4,
  xp: 350, goldMin: 40, goldMax: 80,
};

// ─── MQ5 road: Travellers' Rise ambush ───────────────────────────────────────
// Scripted-only fixed formation. The humans are dangerous support; the
// conditioned Hollow owns roughly half the formation's HP and retains the
// ordinary Hollow's established Brace capability.
const ROAD_IMPOSTOR_TEMPLATE = {
  id:'enemy_road_impostor',name:'Highwayman',hp:58,maxHp:58,atk:19,def:7,spd:11,
  xp:45,goldMin:10,goldMax:18,
};
const BRIDLED_HOLLOW_TEMPLATE = {
  id:'enemy_bridled_hollow',name:'Bridled Hollow',hp:120,maxHp:120,atk:25,def:12,spd:7,
  xp:120,goldMin:0,goldMax:0,defendChance:0.20,
};
const FEN_HANDLER_TEMPLATE = {
  id:'enemy_fen_handler',name:'Fen Handler',hp:62,maxHp:62,atk:20,def:8,spd:10,
  xp:50,goldMin:12,goldMax:22,
};

// Gallery formation boss stats. Coordination is owned by formationRounds below.
// No per-member awards: the report remains the reward.
const GALLERY_RECEIVER_TEMPLATES = [
  {id:'enemy_gallery_receiver', name:'The Receiver', hp:300, maxHp:300, atk:36, def:12, spd:6, xp:0, goldMin:0, goldMax:0},
  {id:'enemy_gallery_caller', name:'The Caller', hp:105, maxHp:105, atk:30, def:6, spd:14, xp:0, goldMin:0, goldMax:0},
  {id:'enemy_gallery_keeper', name:'The Keeper', hp:135, maxHp:135, atk:28, def:10, spd:8, xp:0, goldMin:0, goldMax:0},
];
Object.defineProperty(GALLERY_RECEIVER_TEMPLATES[0], 'isBoss', {value:true});

// Bethany breakfast only: ordinary shared-engine mechanics, no field pool.
// Any two minimum landed noncritical opening attacks defeat HP64; no maximum
// single noncritical attack does. Balance data is revisable, not world canon.
const BUZZY_BEETLE_TEMPLATE = {
  id:'enemy_buzzy_beetle',name:'Buzzy Beetle',hp:64,maxHp:64,atk:2,def:4,spd:4,
  xp:0,goldMin:0,goldMax:0,
};

// A visibly larger storeroom pest; still ordinary, harmless opening combat.
const LARGE_BUZZY_BEETLE_TEMPLATE = {
  id:'enemy_large_buzzy_beetle',name:'Large Buzzy Beetle',hp:96,maxHp:96,atk:2,def:4,spd:4,
  xp:0,goldMin:0,goldMax:0,
};

// ─── Enemy-template identity registry (stable IDs, #4) ───────────────────────
// One authoritative, id-keyed registry of every enemy TEMPLATE. Combat clones a
// template into combat.enemy with `{ ...t }`, which carries the `id` through, so
// a generated enemy always knows which template it came from — independent of
// its display `name` (two Mire Toads and several cross-pool duplicates share a
// name but have distinct ids). This pass provides durable identity + complete
// validation. Mechanics remain owned by capability metadata and their resolvers.
//
// Built here (enemy-catalog.js, loaded after data.js) because the scripted templates
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
  { id:'pool_rocky_beach', label:'Valmere — Rocky Beach', templates:ROCKY_BEACH_ENEMY_TEMPLATES },
  { id: 'pool_overworld_core',    label: 'Overworld — post-start (MAP2)',      templates: ENEMY_TEMPLATES },
  { id: 'pool_overworld_early',   label: 'Overworld — starting area (MAP)',    templates: EARLY_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_f1',        label: 'Dungeon — floor 1',                  templates: DUNGEON_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_f2_5',      label: 'Dungeon — floors 2–5',               templates: DUNGEON2_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_f6_7',      label: 'Dungeon — floors 6–7',               templates: DUNGEON6_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_f8',        label: 'Dungeon — floor 8',                  templates: DUNGEON8_ENEMY_TEMPLATES },
  { id: 'pool_dungeon_horror',    label: 'Dungeon — floors 9–10 (horror)',     templates: DUNGEON_HORROR_ENEMY_TEMPLATES },
  { id: 'pool_great_fen', label:'Great Fen — deep wilderness', templates:GREAT_FEN_FORMATIONS },
  { id: 'pool_far_overworld',     label: 'Far overworld (MAP3 / N-tier)',      templates: FAR_ENEMY_TEMPLATES },
  { id: 'pool_north_fen_zolom',   label: 'Eastern Fens — North Fen (Zolom gate)', templates: FEN_ZOLOM_ENEMY_TEMPLATES },
  // The raw template registration -- registers the seven enemies themselves
  // (ENEMY_TEMPLATE_REGISTRY identity/capability auditing) independently of
  // any formation table. Intentionally never routed directly from a map's
  // encounterPool itself (expect its own "unreachable" validation warning,
  // narrowly exempted in test 59) -- the two formation pools below are the
  // actual live routing mechanism; they reference these same enemies by id.
  { id: 'pool_eastern_fens_mornay', label: 'Eastern Fens — Mornay approach',  templates: EASTERN_FENS_MORNAY_ENEMY_TEMPLATES },
  // Weighted { id, enemies, weight } formation tables (encounter-formations.js),
  // not flat template arrays -- poolTemplates()/validateEncounterFormationData()
  // and the geographic dispatcher all already handle this shape. Routed from
  // MAP_METADATA via the eastern_fens_mornay_easy/_hard encounter profiles
  // (data.js, content/maps/eastern-fens-maps.js).
  { id: 'pool_eastern_fens_mornay_easy', label: 'Eastern Fens — Mornay approach (easy)', templates: EASTERN_FENS_MORNAY_EASY_FORMATIONS },
  { id: 'pool_eastern_fens_mornay_hard', label: 'Eastern Fens — Mornay approach (hard)', templates: EASTERN_FENS_MORNAY_HARD_FORMATIONS },
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
const MORNAY_REMOVAL_TEMPLATES = [
  {id:'enemy_peat_bed_maw',name:'Peat-Bed Maw',hp:480,maxHp:480,atk:18,def:12,spd:9,swallowAfterRounds:6,xp:210,goldMin:0,goldMax:0},
  {id:'enemy_ridgeback_snapper',name:'Ridgeback Snapper',hp:330,maxHp:330,atk:40,def:14,spd:12,xp:230,goldMin:0,goldMax:0},
];
const ENEMY_SCRIPTED_TEMPLATES = [
  ...MORNAY_REMOVAL_TEMPLATES,
  BRIAR_WARDEN_TEMPLATE, SMUGGLER_GUARD_TEMPLATE, POLWICK_TEMPLATE, ESSA_TEMPLATE,
  PALE_SENTRY_TEMPLATE, RAINFISH_TEMPLATE, SWAMP_DONKEY_TEMPLATE, TAKOMO_TEMPLATE,
  MULHOLLAND_TEMPLATE, DEN_WRAITH_TEMPLATE, SAILOR_BRAWLER_TEMPLATE, BOSS_TEMPLATE,
  LENSWEB_SPIDER_TEMPLATE, MIMIC_POTION_TEMPLATE,
  ROAD_IMPOSTOR_TEMPLATE, BRIDLED_HOLLOW_TEMPLATE, FEN_HANDLER_TEMPLATE,
  ...GALLERY_RECEIVER_TEMPLATES, BUZZY_BEETLE_TEMPLATE, LARGE_BUZZY_BEETLE_TEMPLATE,
];
// The 1/256 secret "23" enemy is generated fresh each encounter with random
// stats (startCombat in combat.js), so it has no static stat block — only a stable id.
// Registered as an inline descriptor so validation knows the id without
// demanding combat stats it deliberately doesn't have.
const SECRET_23_TEMPLATE = { id: 'enemy_23', name: '23', inline: true };
const ENEMY_TEMPLATE_REGISTRY = {};
(function buildEnemyTemplateRegistry() {
  const add = (t) => { if (t && !Object.hasOwn(t,'enemies') && typeof t.id === 'string') ENEMY_TEMPLATE_REGISTRY[t.id] = t; };
  ENEMY_TEMPLATE_POOLS.forEach((pool) => pool.templates.forEach(add));
  GREAT_FEN_ENEMY_TEMPLATES.forEach(add);
  ENEMY_SCRIPTED_TEMPLATES.forEach(add);
  add(SECRET_23_TEMPLATE);
})();
window.ENEMY_TEMPLATE_REGISTRY  = ENEMY_TEMPLATE_REGISTRY;
window.ENEMY_TEMPLATE_POOLS     = ENEMY_TEMPLATE_POOLS;
window.ENEMY_SCRIPTED_TEMPLATES = ENEMY_SCRIPTED_TEMPLATES;
window.SECRET_23_TEMPLATE       = SECRET_23_TEMPLATE;


