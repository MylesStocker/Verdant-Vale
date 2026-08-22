'use strict';

// debug-warp.js — DEBUG-ONLY logical warp destination catalog + resolver.
//
// The debug warp menu used to treat every physical MAP_CATALOG / MAP_REGISTRY
// map id as a complete destination: it reset location state, changed only the
// map, warned that non-outdoor context (town/dungeon/sluice/house…) was NOT set,
// and still returned success. That produced "successful but incomplete" warps
// where locationName()/currentContentLocationKey()/item list/encounter pool/NPC
// filtering did not match normal play.
//
// This module fixes that. A physical map id is NOT always a complete logical
// destination: a shared grid (HOUSE_INTERIOR_MAP, SMALL_APARTMENT_MAP,
// APARTMENT_CORRIDOR_MAP) backs many logical places, and most non-outdoor maps
// need a specific runtime "mode" (inDungeon+dungeonFloor, inTown+townBuilding,
// inSluice+sluiceFloor, inBridgePost+…, etc). So this catalog pairs each
// destination with the exact location-state overrides its canonical enter*()
// wrapper (world-transitions.js) establishes — the authoritative source, NOT
// MAP_CATALOG.type or the display label.
//
// Contract:
//   • Outdoor destinations are DERIVED from MAP_CATALOG (type === 'outdoor');
//     their neutral location state is already correct.
//   • Every non-outdoor destination is AUTHORED with its canonical state.
//   • Every ENABLED destination resolves to a valid map + a complete, invariant-
//     valid location-state candidate with at least one walkable landing.
//   • debugWarpToDestination() commits ONLY through transitionToLocation(), which
//     validates the whole destination and mutates atomically — no location flag
//     is ever assigned directly here, and a rejected warp changes nothing.
//   • No quest/dialogue/reward/combat/NPC-reroll/day/inventory/story side effects:
//     the enter*() wrappers' side effects (resetBridgeGuards, travellerPresent,
//     resetAllPatrols, quest flags…) are deliberately NOT run.
//
// This is debug tooling: it READS production data (MAP_CATALOG, HOUSE_DOORS via
// authored return coords) but production data never depends on this file.

// Deterministic category order (requirement: outdoor first).
const DEBUG_WARP_CATEGORY_ORDER = ['outdoor', 'town', 'interior', 'dungeon', 'special'];

// ── Authored non-outdoor destinations ────────────────────────────────────────
// Each: { id, label, category, mapId, state, defaultCol, defaultRow, facing }.
// `state` is the exact set of non-neutral LOCATION_STATE_BINDINGS overrides the
// canonical wrapper sets (everything else defaults to neutral). House/apartment
// destinations additionally carry `house: { sourceMapId, returnCol, returnRow }`
// so their normal exitBuilding() lands coherently (houseSourceMap/houseReturnPos
// are resolved at warp time). Landing coords mirror the wrappers' own known-
// walkable landings; out-of-range/blocked picks are clamped+nudged at warp time.
const DEBUG_WARP_DESTINATIONS_AUTHORED = [
  // ── Town exteriors ────────────────────────────────────────────────────────
  { id: 'town:calwick_south',   label: 'Calwick — South Gate', category: 'town', mapId: 'TOWN_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: null }, defaultCol: 7, defaultRow: 13, facing: 'up' },
  { id: 'town:calwick_east',    label: 'Calwick — East Side', category: 'town', mapId: 'EAST_TOWN_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'east' }, defaultCol: 5, defaultRow: 9, facing: 'down' },
  { id: 'town:calwick_west',    label: 'Calwick — West Side', category: 'town', mapId: 'WEST_TOWN_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'west' }, defaultCol: 6, defaultRow: 4, facing: 'down' },
  { id: 'town:drenwick_civic',  label: 'Drenwick — Civic Square', category: 'town', mapId: 'DRENWICK_CIVIC_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: null }, defaultCol: 7, defaultRow: 12, facing: 'up' },
  { id: 'town:drenwick_west',   label: 'Drenwick — West Side', category: 'town', mapId: 'DRENWICK_WEST_RESIDENTIAL_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: null }, defaultCol: 7, defaultRow: 13, facing: 'up' },
  { id: 'town:drenwick_canal',  label: 'Drenwick — Canal Docks', category: 'town', mapId: 'DRENWICK_CANAL_DOCKS_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: null }, defaultCol: 7, defaultRow: 12, facing: 'up' },
  { id: 'town:drenwick_east',   label: 'Drenwick — East Side', category: 'town', mapId: 'DRENWICK_EAST_OUTSKIRTS_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: null }, defaultCol: 1, defaultRow: 4, facing: 'right' },
  { id: 'town:drenwick_market', label: 'Drenwick — Market Quarter', category: 'town', mapId: 'DRENWICK_MARKET_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: null }, defaultCol: 12, defaultRow: 8, facing: 'left' },
  { id: 'town:drenwick_waterfront', label: 'Drenwick — Waterfront', category: 'town', mapId: 'DRENWICK_WATERFRONT_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: null }, defaultCol: 1, defaultRow: 7, facing: 'right' },

  // ── Interiors: Calwick buildings ──────────────────────────────────────────
  { id: 'interior:calwick_inn',    label: 'Calwick — Inn', category: 'interior', mapId: 'INN_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'inn' }, defaultCol: 7, defaultRow: 12, facing: 'up' },
  { id: 'interior:calwick_office', label: 'Calwick — Office', category: 'interior', mapId: 'OFFICE_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'office' }, defaultCol: 7, defaultRow: 9, facing: 'up' },
  { id: 'interior:calwick_school', label: 'Calwick — School', category: 'interior', mapId: 'SCHOOL_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'school' }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:calwick_apt_corridor', label: 'Calwick — Apartments (Corridor)', category: 'interior', mapId: 'APARTMENT_CORRIDOR_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'apt' }, defaultCol: 7, defaultRow: 8, facing: 'up' },

  // ── Interiors: Drenwick buildings ─────────────────────────────────────────
  { id: 'interior:drenwick_inn',    label: 'Drenwick — Inn', category: 'interior', mapId: 'DRENWICK_INN_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'inn' }, defaultCol: 7, defaultRow: 12, facing: 'up' },
  { id: 'interior:drenwick_office', label: 'Drenwick — IJC District Office', category: 'interior', mapId: 'DRENWICK_OFFICE_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'office' }, defaultCol: 7, defaultRow: 10, facing: 'up' },
  { id: 'interior:drenwick_harbormaster', label: 'Drenwick — Harbormaster’s Office', category: 'interior', mapId: 'DRENWICK_HARBORMASTER_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'harbormaster' }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:drenwick_wash_house', label: 'Drenwick — Wash House', category: 'interior', mapId: 'DRENWICK_WASH_HOUSE_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'wash_house' }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:drenwick_provision_store', label: 'Drenwick — Provision Store', category: 'interior', mapId: 'DRENWICK_PROVISION_STORE_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'provision_store' }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:drenwick_guild_hall', label: 'Drenwick — Guild Hall', category: 'interior', mapId: 'DRENWICK_GUILD_HALL_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'guild_hall' }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:drenwick_post_office', label: 'Drenwick — Fenmark Post Co.', category: 'interior', mapId: 'DRENWICK_POST_OFFICE_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'post_office' }, defaultCol: 7, defaultRow: 2, facing: 'down' },
  { id: 'interior:drenwick_tavern', label: 'Drenwick — Dockworkers’ Tavern', category: 'interior', mapId: 'DRENWICK_TAVERN_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'tavern' }, defaultCol: 7, defaultRow: 12, facing: 'up' },
  { id: 'interior:drenwick_school_ground', label: 'Drenwick — School', category: 'interior', mapId: 'DRENWICK_SCHOOL_GROUND_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'school' }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:drenwick_school_upper', label: 'Drenwick — School (Upper Floor)', category: 'interior', mapId: 'DRENWICK_SCHOOL_UPPER_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'school' }, defaultCol: 13, defaultRow: 3, facing: 'up' },
  { id: 'interior:drenwick_school_basement', label: 'Drenwick — School (Archive)', category: 'interior', mapId: 'DRENWICK_SCHOOL_BASEMENT_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'school' }, defaultCol: 2, defaultRow: 3, facing: 'down' },
  { id: 'interior:drenwick_infirmary', label: 'Drenwick — Infirmary', category: 'interior', mapId: 'DRENWICK_INFIRMARY_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'infirmary' }, defaultCol: 7, defaultRow: 8, facing: 'up' },
  { id: 'interior:drenwick_apt_a1_corridor', label: 'Drenwick — Apartments A1 (Corridor)', category: 'interior', mapId: 'APARTMENT_CORRIDOR_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'drenwick_apt_a1' }, defaultCol: 7, defaultRow: 8, facing: 'up' },

  // ── Interiors: other residences (own-flag interiors) ──────────────────────
  { id: 'interior:lorra_house', label: 'Lorra’s Farmhouse', category: 'interior', mapId: 'LORRA_HOUSE_MAP',
    state: { inLorraHouse: true }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:abandoned_farmhouse', label: 'Abandoned Farmhouse', category: 'interior', mapId: 'ABANDONED_FARMHOUSE_MAP',
    state: { inAbandonedFarmhouse: true }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:hollis_farmhouse', label: 'Hollis Farmstead', category: 'interior', mapId: 'HOLLIS_FARMHOUSE_MAP',
    state: { inHollisFarmhouse: true }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:wrenna_cottage', label: "Wrenna's Cottage", category: 'interior', mapId: 'WRENNA_COTTAGE_MAP',
    state: { inWrennaCottage: true }, defaultCol: 7, defaultRow: 11, facing: 'up' },
  { id: 'interior:hamlet',      label: 'The Falls (Hamlet Interior)', category: 'interior', mapId: 'HAMLET_INTERIOR_MAP',
    state: { inHamletInterior: true }, defaultCol: 7, defaultRow: 12, facing: 'up' },

  // ── Interiors: reused house/apartment maps (distinct context + return) ─────
  // HOUSE_INTERIOR_MAP is shared by every non-apartment house; SMALL_APARTMENT_MAP
  // by every apartment unit — the currentHouseId + return context distinguish them.
  { id: 'house:calwick_player', label: 'House — Calwick (Player’s Home)', category: 'interior', mapId: 'HOUSE_INTERIOR_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'house', currentHouseId: 'player_house', houseSourceBuilding: 'west' },
    house: { sourceMapId: 'WEST_TOWN_MAP', returnCol: 2, returnRow: 11 }, defaultCol: 7, defaultRow: 9, facing: 'up' },
  { id: 'house:calwick_esla',   label: 'House — Calwick (Esla’s Home)', category: 'interior', mapId: 'HOUSE_INTERIOR_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'house', currentHouseId: 'esla_house', houseSourceBuilding: 'west' },
    house: { sourceMapId: 'WEST_TOWN_MAP', returnCol: 2, returnRow: 7 }, defaultCol: 7, defaultRow: 9, facing: 'up' },
  { id: 'house:drenwick_north_a', label: 'House — Drenwick (North A)', category: 'interior', mapId: 'HOUSE_INTERIOR_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'house', currentHouseId: 'drenwick_north_a', houseSourceBuilding: null },
    house: { sourceMapId: 'DRENWICK_WEST_RESIDENTIAL_MAP', returnCol: 11, returnRow: 3 }, defaultCol: 7, defaultRow: 9, facing: 'up' },
  { id: 'apt:calwick_1', label: 'Apartment — Calwick #1', category: 'interior', mapId: 'SMALL_APARTMENT_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'house', currentHouseId: 'apt_1', houseSourceBuilding: 'apt' },
    house: { sourceMapId: 'APARTMENT_CORRIDOR_MAP', returnCol: 3, returnRow: 5 }, defaultCol: 7, defaultRow: 8, facing: 'up' },
  { id: 'apt:calwick_2', label: 'Apartment — Calwick #2', category: 'interior', mapId: 'SMALL_APARTMENT_MAP',
    state: { inTown: true, currentTownId: 'calwick', townBuilding: 'house', currentHouseId: 'apt_2', houseSourceBuilding: 'apt' },
    house: { sourceMapId: 'APARTMENT_CORRIDOR_MAP', returnCol: 6, returnRow: 5 }, defaultCol: 7, defaultRow: 8, facing: 'up' },
  { id: 'apt:drenwick_a1_u1', label: 'Apartment — Drenwick A1 Unit 1', category: 'interior', mapId: 'SMALL_APARTMENT_MAP',
    state: { inTown: true, currentTownId: 'drenwick', townBuilding: 'house', currentHouseId: 'drenwick_apt_a1_u1', houseSourceBuilding: 'drenwick_apt_a1' },
    house: { sourceMapId: 'APARTMENT_CORRIDOR_MAP', returnCol: 3, returnRow: 5 }, defaultCol: 7, defaultRow: 8, facing: 'up' },

  // ── Dungeon: South Ruins ──────────────────────────────────────────────────
  { id: 'dungeon:entrance', label: 'South Ruins — Entrance', category: 'dungeon', mapId: 'DUNGEON_ENTRANCE_MAP',
    state: { inDungeonEntrance: true }, defaultCol: 7, defaultRow: 12, facing: 'up' },
  { id: 'dungeon:f1', label: 'South Ruins — Floor 1', category: 'dungeon', mapId: 'DUNGEON_MAP',
    state: { inDungeon: true, dungeonFloor: 1 }, defaultCol: 7, defaultRow: 12, facing: 'up' },
  { id: 'dungeon:f2', label: 'South Ruins — Floor 2 (Lower)', category: 'dungeon', mapId: 'DUNGEON2_MAP',
    state: { inDungeon: true, dungeonFloor: 2 }, defaultCol: 7, defaultRow: 3, facing: 'down' },
  { id: 'dungeon:f3', label: 'South Ruins — Floor 3 (Deep, Crossing)', category: 'dungeon', mapId: 'DUNGEON3_MAP',
    state: { inDungeon: true, dungeonFloor: 3 }, defaultCol: 7, defaultRow: 3, facing: 'down' },
  { id: 'dungeon:f3_tl', label: 'South Ruins — Deep, West Wing', category: 'dungeon', mapId: 'DUNGEON3_TL_MAP',
    state: { inDungeon: true, dungeonFloor: 3 }, defaultCol: 7, defaultRow: 7, facing: 'down' },
  { id: 'dungeon:f3_tr', label: 'South Ruins — Deep, East Wing', category: 'dungeon', mapId: 'DUNGEON3_TR_MAP',
    state: { inDungeon: true, dungeonFloor: 3 }, defaultCol: 7, defaultRow: 7, facing: 'down' },
  { id: 'dungeon:f3_ml', label: 'South Ruins — Deep, Left Gallery', category: 'dungeon', mapId: 'DUNGEON3_ML_MAP',
    state: { inDungeon: true, dungeonFloor: 3 }, defaultCol: 7, defaultRow: 7, facing: 'down' },
  { id: 'dungeon:f3_mr', label: 'South Ruins — Deep, Right Gallery', category: 'dungeon', mapId: 'DUNGEON3_MR_MAP',
    state: { inDungeon: true, dungeonFloor: 3 }, defaultCol: 7, defaultRow: 7, facing: 'down' },
  { id: 'dungeon:f3_bl', label: 'South Ruins — Deep, Lower West', category: 'dungeon', mapId: 'DUNGEON3_BL_MAP',
    state: { inDungeon: true, dungeonFloor: 3 }, defaultCol: 7, defaultRow: 7, facing: 'down' },
  { id: 'dungeon:f3_bc', label: 'South Ruins — Deep, Lower Hall', category: 'dungeon', mapId: 'DUNGEON3_BC_MAP',
    state: { inDungeon: true, dungeonFloor: 3 }, defaultCol: 7, defaultRow: 7, facing: 'down' },
  { id: 'dungeon:f3_br', label: 'South Ruins — Deep, Descent Chamber', category: 'dungeon', mapId: 'DUNGEON3_BR_MAP',
    state: { inDungeon: true, dungeonFloor: 3 }, defaultCol: 7, defaultRow: 7, facing: 'down' },
  { id: 'dungeon:f4', label: 'South Ruins — Floor 4 (Deeper)', category: 'dungeon', mapId: 'DUNGEON4_MAP',
    state: { inDungeon: true, dungeonFloor: 4 }, defaultCol: 7, defaultRow: 3, facing: 'down' },
  { id: 'dungeon:f5', label: 'South Ruins — Floor 5 (Lowest)', category: 'dungeon', mapId: 'DUNGEON5_MAP',
    state: { inDungeon: true, dungeonFloor: 5 }, defaultCol: 7, defaultRow: 3, facing: 'down' },
  { id: 'dungeon:f6', label: 'South Ruins — Floor 6 (The Deep)', category: 'dungeon', mapId: 'DUNGEON6_MAP',
    state: { inDungeon: true, dungeonFloor: 6 }, defaultCol: 7, defaultRow: 3, facing: 'down' },
  { id: 'dungeon:f7', label: 'South Ruins — Floor 7 (Catacombs)', category: 'dungeon', mapId: 'DUNGEON7_MAP',
    state: { inDungeon: true, dungeonFloor: 7 }, defaultCol: 7, defaultRow: 3, facing: 'down' },
  { id: 'dungeon:f8', label: 'South Ruins — Floor 8 (Drowned Chamber)', category: 'dungeon', mapId: 'DUNGEON8_MAP',
    state: { inDungeon: true, dungeonFloor: 8 }, defaultCol: 7, defaultRow: 3, facing: 'down' },
  { id: 'dungeon:f8_west', label: 'South Ruins — West Passage', category: 'dungeon', mapId: 'DUNGEON8_WEST_MAP',
    state: { inDungeon: true, dungeonFloor: 9 }, defaultCol: 13, defaultRow: 7, facing: 'left' },
  { id: 'dungeon:f8_east', label: 'South Ruins — East Passage', category: 'dungeon', mapId: 'DUNGEON8_EAST_MAP',
    state: { inDungeon: true, dungeonFloor: 10 }, defaultCol: 1, defaultRow: 7, facing: 'right' },

  // ── Special locations (own canonical modes) ───────────────────────────────
  { id: 'special:maren_post',     label: 'Thornmere — Guard Post (Maren)', category: 'special', mapId: 'MAREN_POST_MAP',
    state: { inMarenPost: true }, defaultCol: 7, defaultRow: 10, facing: 'up' },
  { id: 'special:drenwick_post',  label: 'Drenwick — Guard Post', category: 'special', mapId: 'DRENWICK_POST_MAP',
    state: { inDrenwrickPost: true }, defaultCol: 7, defaultRow: 10, facing: 'up' },
  { id: 'special:smuggler_fort',  label: 'Smugglers’ Fort', category: 'special', mapId: 'SMUGGLER_FORT_MAP',
    state: { inSmugglerFort: true }, defaultCol: 7, defaultRow: 10, facing: 'up' },
  { id: 'special:mire_vault',     label: 'Mirethyst’s Vault', category: 'special', mapId: 'MIRE_VAULT_MAP',
    state: { inMireVault: true }, defaultCol: 7, defaultRow: 12, facing: 'up' },
  { id: 'special:takomo',         label: 'Takomo’s Chamber', category: 'special', mapId: 'TAKOMO_MAP',
    state: { inTakomo: true }, defaultCol: 2, defaultRow: 7, facing: 'right' },
  { id: 'special:fen_brewery',    label: 'Wend Brewery', category: 'special', mapId: 'FEN_BREWERY_MAP',
    state: { inFenBrewery: true }, defaultCol: 3, defaultRow: 12, facing: 'up' },
  { id: 'special:lighthouse_ground', label: 'Abandoned Lighthouse — Ground Floor', category: 'special', mapId: 'LIGHTHOUSE_GROUND_MAP',
    state: { inLighthouse: true }, defaultCol: 7, defaultRow: 9, facing: 'up' },
  { id: 'special:lighthouse_landing_1', label: 'Abandoned Lighthouse — First Landing', category: 'special', mapId: 'LIGHTHOUSE_LANDING_1_MAP',
    state: { inLighthouse: true }, defaultCol: 7, defaultRow: 7, facing: 'up' },
  { id: 'special:lighthouse_landing_2', label: 'Abandoned Lighthouse — Second Landing', category: 'special', mapId: 'LIGHTHOUSE_LANDING_2_MAP',
    state: { inLighthouse: true }, defaultCol: 7, defaultRow: 7, facing: 'up' },
  { id: 'special:lighthouse_landing_3', label: 'Abandoned Lighthouse — Third Landing', category: 'special', mapId: 'LIGHTHOUSE_LANDING_3_MAP',
    state: { inLighthouse: true }, defaultCol: 7, defaultRow: 7, facing: 'up' },
  { id: 'special:lighthouse_lantern', label: 'Abandoned Lighthouse — Lantern Room', category: 'special', mapId: 'LIGHTHOUSE_LANTERN_MAP',
    state: { inLighthouse: true }, defaultCol: 7, defaultRow: 7, facing: 'up' },
  { id: 'special:basin_chamber',  label: 'The Unmarked Chamber', category: 'special', mapId: 'BASIN_CHAMBER_MAP',
    state: { inBasinChamber: true }, defaultCol: 8, defaultRow: 9, facing: 'up' },
  { id: 'special:sunken_gallery', label: 'Sunken Gallery — Stairhead', category: 'special', mapId: 'SUNKEN_GALLERY_MAP',
    state: { inSunkenGallery: true }, defaultCol: 2, defaultRow: 3, facing: 'down' },
  { id: 'special:sunken_gallery_room', label: 'Sunken Gallery — Room (R2C4)', category: 'special', mapId: 'SUNKEN_GALLERY_R2C4',
    state: { inSunkenGallery: true }, defaultCol: 7, defaultRow: 7, facing: 'down' },
  { id: 'special:bridge', label: 'Imperial Bridge — Toll Gate', category: 'special', mapId: 'BRIDGE_CROSSING_MAP',
    state: { inBridgePost: true, bridge_entry_direction: 'south', bridge_toll_paid: false }, defaultCol: 7, defaultRow: 13, facing: 'up' },
  { id: 'special:sluice_l1', label: 'East Sluice — Floor 1', category: 'special', mapId: 'SLUICE_MAP',
    state: { inSluice: true, sluiceFloor: 1 }, defaultCol: 7, defaultRow: 3, facing: 'down' },
  { id: 'special:sluice_l2', label: 'East Sluice — Lower Works', category: 'special', mapId: 'SLUICE_LEVEL2_MAP',
    state: { inSluice: true, sluiceFloor: 2 }, defaultCol: 8, defaultRow: 6, facing: 'down' },
  { id: 'special:sluice_l3', label: 'East Sluice — Deep Works', category: 'special', mapId: 'SLUICE_LEVEL3_MAP',
    state: { inSluice: true, sluiceFloor: 3 }, defaultCol: 7, defaultRow: 4, facing: 'down' },
  { id: 'special:sluice_secret', label: 'East Sluice — Sealed Room', category: 'special', mapId: 'SLUICE_SECRET_MAP',
    state: { inSluice: true, sluiceFloor: 4 }, defaultCol: 7, defaultRow: 3, facing: 'down' },
  // DREAM_MAP is DISABLED: its location state is neutral (representable), but its
  // canonical lifecycle depends on a transient OUTSIDE LOCATION_STATE_BINDINGS —
  // enterDream() stashes _dreamReturn and the ONLY exit, exitDream() (a dialogue
  // callback), no-ops without that stash. DREAM_MAP has no exit tile and no edge
  // transition, so a direct warp would strand the player. We do NOT fake
  // _dreamReturn, trigger the dream dialogue, or add a new exit just for debug.
  { id: 'special:dream', label: 'The Dream (White Void)', category: 'special', mapId: 'DREAM_MAP',
    state: {}, defaultCol: 7, defaultRow: 7, facing: 'down',
    disabled: true, disabledReason: 'Cutscene-only; requires dream return context' },
];

// Derives an outdoor destination (neutral state) for every MAP_CATALOG map whose
// type === 'outdoor'. Its default landing is the map centre (clamped+nudged at
// warp time). Neutral state is the correct location context for these.
function _deriveOutdoorDebugDestinations() {
  const out = [];
  if (typeof MAP_CATALOG === 'undefined') return out;
  for (const id of Object.keys(MAP_CATALOG)) {
    const e = MAP_CATALOG[id];
    if (!e || e.type !== 'outdoor' || !Array.isArray(e.map) || !Array.isArray(e.map[0])) continue;
    const dest = {
      id: 'outdoor:' + id, label: e.displayName || id, category: 'outdoor', mapId: id,
      state: {}, defaultCol: Math.floor(e.map[0].length / 2), defaultRow: Math.floor(e.map.length / 2), facing: 'down',
    };
    // A scenery-only chunk is LISTED (so it's visible/discoverable) but DISABLED:
    // the player can never be placed there. Uses the shared placement capability, not
    // a hardcoded id. debugWarpToDestination() rejects `disabled` before any commit.
    if (typeof mapPlayerAccessible === 'function' && !mapPlayerAccessible(id)) {
      dest.disabled = true;
      dest.disabledReason = 'Scenery-only; no player access';
    }
    out.push(dest);
  }
  return out;
}

// Builds the full destination list (derived outdoor + authored), sorted
// deterministically: category order (outdoor first), then display label, then
// stable id. Cached after first build (MAP_CATALOG is stable at runtime).
let _debugWarpDestinationsCache = null;
let _debugWarpByIdCache = null;
function getDebugWarpDestinations() {
  if (_debugWarpDestinationsCache) return _debugWarpDestinationsCache;
  const all = _deriveOutdoorDebugDestinations().concat(DEBUG_WARP_DESTINATIONS_AUTHORED);
  const catIndex = (c) => {
    const i = DEBUG_WARP_CATEGORY_ORDER.indexOf(c);
    return i === -1 ? DEBUG_WARP_CATEGORY_ORDER.length : i;
  };
  all.sort((a, b) => {
    const ci = catIndex(a.category) - catIndex(b.category);
    if (ci !== 0) return ci;
    const li = String(a.label).localeCompare(String(b.label));
    if (li !== 0) return li;
    return String(a.id).localeCompare(String(b.id));
  });
  _debugWarpDestinationsCache = all;
  _debugWarpByIdCache = new Map(all.map((d) => [d.id, d]));
  return all;
}

function debugDestinationById(destinationId) {
  if (!_debugWarpByIdCache) getDebugWarpDestinations();
  return _debugWarpByIdCache.has(destinationId) ? _debugWarpByIdCache.get(destinationId) : null;
}

// Local neutral value for a binding (mirrors world-transitions' _neutralValueFor,
// read only from the exported binding metadata — no production coupling).
function _debugNeutralValueFor(b) { return b.isPos ? { x: 0, y: 0 } : b.neutral; }

// Builds the complete override state for a destination, resolving house context
// (source map ref + return position) from its authored plain data. Returns
// { ok, state, errors }.
function _buildDebugStateOverrides(dest) {
  const errors = [];
  const state = Object.assign({}, dest.state || {});
  if (dest.house) {
    const srcRef = (typeof mapRefForId === 'function') ? mapRefForId(dest.house.sourceMapId) : null;
    if (!srcRef) { errors.push('unknown houseSourceMapId "' + dest.house.sourceMapId + '"'); }
    else {
      state.houseSourceMap = srcRef;
      state.houseReturnPos = { x: (dest.house.returnCol + 0.5) * TILE, y: (dest.house.returnRow + 1.5) * TILE };
    }
  }
  return { ok: errors.length === 0, state, errors };
}

// ── The destination-aware warp operation ─────────────────────────────────────
// debugWarpToDestination(destinationId, col, row):
//   • resolves the destination + physical map;
//   • clamps (col,row) to the map's actual dimensions (defaults to the
//     destination's own landing when col/row are omitted);
//   • nudges to the nearest base-walkable tile if the picked tile is blocked;
//   • builds the complete candidate location state through the destination's
//     authored context (+ resolved house refs);
//   • preflights placement + location-state invariants;
//   • commits through transitionToLocation() (which re-validates and mutates
//     atomically) — never assigning any location flag directly.
// On any unknown/disabled/malformed/invalid/unwalkable destination it returns
// { success:false, message } and leaves activeMap, player, cooldown, and every
// location field untouched. On success: { success:true, message, col, row,
// destinationId }.
function debugWarpToDestination(destinationId, col, row) {
  const dest = debugDestinationById(destinationId);
  if (!dest) return { success: false, message: 'Warp failed: unknown destination "' + destinationId + '"' };
  if (dest.disabled) return { success: false, message: 'Warp failed: "' + dest.label + '" is disabled — ' + (dest.disabledReason || 'unsupported') };

  const map = (typeof mapRefForId === 'function') ? mapRefForId(dest.mapId) : null;
  if (!Array.isArray(map) || !Array.isArray(map[0])) {
    return { success: false, message: 'Warp failed: unknown/invalid map id "' + dest.mapId + '"' };
  }
  const rows = map.length, cols = map[0].length;

  const reqCol = Number.isFinite(col) ? col : dest.defaultCol;
  const reqRow = Number.isFinite(row) ? row : dest.defaultRow;
  let tCol = Math.min(Math.max(Math.round(reqCol), 0), cols - 1);
  let tRow = Math.min(Math.max(Math.round(reqRow), 0), rows - 1);
  const clamped = (tCol !== reqCol || tRow !== reqRow);

  let nudged = false;
  if (!(typeof WALKABLE !== 'undefined' && WALKABLE[map[tRow][tCol]])) {
    const found = (typeof debugFindNearestWalkableTile === 'function') ? debugFindNearestWalkableTile(map, tCol, tRow) : null;
    if (!found) return { success: false, message: 'Warp failed: "' + dest.mapId + '" has no walkable tile at all' };
    tCol = found.col; tRow = found.row; nudged = true;
  }

  const built = _buildDebugStateOverrides(dest);
  if (!built.ok) return { success: false, message: 'Warp failed: ' + built.errors.join('; ') };

  const x = (tCol + 0.5) * TILE, y = (tRow + 0.5) * TILE;

  // Preflight #1: placement (map/coords/facing) — precise message, no mutation.
  const place = (typeof validatePlacement === 'function')
    ? validatePlacement({ mapId: dest.mapId, x, y, facing: dest.facing })
    : { ok: true };
  if (!place.ok) return { success: false, message: 'Warp failed: ' + place.errors.join('; ') };

  // Preflight #2: complete location-state invariants — precise message, no mutation.
  if (typeof LOCATION_STATE_BINDINGS !== 'undefined' && typeof validateLocationState === 'function') {
    const proposed = {};
    for (const b of LOCATION_STATE_BINDINGS) proposed[b.key] = (b.key in built.state) ? built.state[b.key] : _debugNeutralValueFor(b);
    const inv = validateLocationState(proposed);
    if (!inv.ok) return { success: false, message: 'Warp failed: invalid destination state — ' + inv.errors.join('; ') };
  }

  // Commit: the ONE canonical boundary re-validates and mutates atomically.
  const ok = transitionToLocation({ mapId: dest.mapId, x, y, facing: dest.facing, state: built.state, cooldown: true });
  if (!ok) return { success: false, message: 'Warp failed: transition rejected for "' + dest.label + '"' };

  let message = 'Warped to ' + dest.label + ' (col ' + tCol + ', row ' + tRow + ')';
  if (clamped) message += ' — target coordinate out of bounds, clamped';
  if (nudged) message += ' — nearest walkable tile used (original spot was blocked)';
  return { success: true, message, col: tCol, row: tRow, destinationId: dest.id };
}

if (typeof window !== 'undefined') {
  window.DEBUG_WARP_CATEGORY_ORDER    = DEBUG_WARP_CATEGORY_ORDER;
  window.DEBUG_WARP_DESTINATIONS_AUTHORED = DEBUG_WARP_DESTINATIONS_AUTHORED;
  window.getDebugWarpDestinations     = getDebugWarpDestinations;
  window.debugDestinationById         = debugDestinationById;
  window.debugWarpToDestination       = debugWarpToDestination;
}
