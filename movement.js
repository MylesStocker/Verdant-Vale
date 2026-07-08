'use strict';

// movement.js — the player object, location/map-id helpers, tile collision,
// and the per-frame update() that drives movement, encounters, and world state.

// ─── Player ───────────────────────────────────────────────────────────────────
// x, y = pixel center of the character's standing point
const player = {
  x: 10.5 * TILE,   // tile 10
  y:  7.5 * TILE,   // tile 7
  facing: 'down',
  step: 0,          // increments while moving; drives animation frame
  moving: false,
};

// Returns the display name shown above the canvas for the current location.
function locationName() {
  // MAP_METADATA-driven lookup, restricted to type === 'outdoor': every
  // plain overworld map (MAP, MAP2, MAP3, the North Basin maps, etc.) has a
  // single, unconditional display name with no further sub-state, so this
  // replaces what used to be one hardcoded "if (activeMap === X) return
  // 'Y';" line per map -- a new outdoor map now needs zero changes here,
  // just a MAP_METADATA entry. Restricting this to 'outdoor' (rather than
  // checking metadata for every map, first, unconditionally) is deliberate:
  // most other map types (town buildings, dungeon floors, sluice floors)
  // have names that depend on additional state (townBuilding, dungeonFloor,
  // sluiceFloor) that a flat per-map displayName can't express, and their
  // existing state-gated checks below still own that logic -- see the
  // comment at the top of MAP_METADATA (data.js) for why that split exists.
  const meta = MAP_METADATA[mapRegistryId(activeMap)];
  if (meta && meta.type === 'outdoor') return meta.displayName;

  if (inTakomo)                            return 'Takomo\u2019s Chamber';
  if (inMireVault)                         return 'Mirethyst\u2019s Vault';
  if (inHamletInterior)                    return 'The Falls';
  if (inFenBrewery)                        return 'Wend Brewery';
  if (inSluice && sluiceFloor === 1)       return 'East Sluice';
  if (inSluice && sluiceFloor === 2)       return 'East Sluice \u2014 Lower Works';
  if (inSluice && sluiceFloor === 3)       return 'East Sluice \u2014 Deep Works';
  if (inDungeonEntrance)                return 'South Ruins \u2014 Entrance';
  if (inDungeon && dungeonFloor === 1)  return 'South Ruins';
  if (inDungeon && dungeonFloor === 2)  return 'South Ruins \u2014 Lower';
  if (inDungeon && dungeonFloor === 3) {
    if (activeMap === DUNGEON3_TL_MAP) return 'South Ruins \u2014 Deep, West Wing';
    if (activeMap === DUNGEON3_TR_MAP) return 'South Ruins \u2014 Deep, East Wing';
    if (activeMap === DUNGEON3_ML_MAP) return 'South Ruins \u2014 Deep, Left Gallery';
    if (activeMap === DUNGEON3_MC_MAP) return 'South Ruins \u2014 Deep, Crossing';
    if (activeMap === DUNGEON3_MR_MAP) return 'South Ruins \u2014 Deep, Right Gallery';
    if (activeMap === DUNGEON3_BL_MAP) return 'South Ruins \u2014 Deep, Lower West';
    if (activeMap === DUNGEON3_BC_MAP) return 'South Ruins \u2014 Deep, Lower Hall';
    if (activeMap === DUNGEON3_BR_MAP) return 'South Ruins \u2014 Deep, Descent Chamber';
    return 'South Ruins \u2014 Deep';
  }
  if (inDungeon && dungeonFloor === 4)  return 'South Ruins \u2014 Deeper';
  if (inDungeon && dungeonFloor === 5)  return 'South Ruins \u2014 Lowest';
  if (inDungeon && dungeonFloor === 6)  return 'South Ruins \u2014 The Deep';
  if (inDungeon && dungeonFloor === 7)  return 'South Ruins \u2014 Catacombs';
  if (inDungeon && dungeonFloor === 8)  return 'South Ruins \u2014 The Drowned Chamber';
  if (inDungeon && dungeonFloor === 9)  return 'South Ruins \u2014 West Passage';
  if (inDungeon && dungeonFloor === 10) return 'South Ruins \u2014 East Passage';
  if (inTown && townBuilding === 'inn'              && currentTownId === 'drenwick') return 'Drenwick \u2014 Inn';
  if (inTown && townBuilding === 'office'           && currentTownId === 'drenwick') return 'Drenwick \u2014 IJC District Office';
  if (inTown && townBuilding === 'harbormaster'     && currentTownId === 'drenwick') return 'Drenwick \u2014 Harbormaster\u2019s Office';
  if (inTown && townBuilding === 'wash_house'       && currentTownId === 'drenwick') return 'Drenwick \u2014 Wash House';
  if (inTown && townBuilding === 'provision_store'  && currentTownId === 'drenwick') return 'Drenwick \u2014 Provision Store';
  if (inTown && townBuilding === 'guild_hall'        && currentTownId === 'drenwick') return 'Drenwick \u2014 Guild Hall';
  if (activeMap === DRENWICK_TAVERN_MAP)  return 'Drenwick \u2014 Dockworkers\u2019 Tavern';
  if (inTown && townBuilding === 'east')   return 'Calwick East Side';
  if (inTown && townBuilding === 'west')   return 'Calwick West Side';
  if (activeMap === DRENWICK_SCHOOL_GROUND_MAP)    return 'Drenwick \u2014 School';
  if (activeMap === DRENWICK_SCHOOL_UPPER_MAP)     return 'Drenwick \u2014 School (Upper Floor)';
  if (activeMap === DRENWICK_SCHOOL_BASEMENT_MAP)  return 'Drenwick \u2014 School (Archive)';
  if (inTown && townBuilding && townBuilding.startsWith('drenwick_apt_')) return 'Drenwick \u2014 East Apartments';
  if (inTown && townBuilding === 'house' && currentHouseId && currentHouseId.startsWith('drenwick_apt_')) return 'Drenwick \u2014 East Apartments';
  if (inTown && townBuilding === 'house' && currentHouseId && currentHouseId.startsWith('drenwick_')) return 'Drenwick \u2014 Residence';
  if (inTown && townBuilding === 'school') return 'West Calwick School';
  if (inTown && townBuilding === 'apt')    return 'East Calwick Apartments';
  if (inTown && townBuilding === 'house' && currentHouseId && currentHouseId.startsWith('apt_'))
    return 'Apt. ' + currentHouseId.slice(-1);
  if (inTown && currentTownId === 'drenwick') {
    if (activeMap === DRENWICK_WEST_RESIDENTIAL_MAP) return 'Drenwick \u2014 West Side';
    if (activeMap === DRENWICK_CANAL_DOCKS_MAP)      return 'Drenwick \u2014 Canal Docks';
    if (activeMap === DRENWICK_EAST_OUTSKIRTS_MAP)   return 'Drenwick \u2014 East Side';
    if (activeMap === DRENWICK_MARKET_MAP)           return 'Drenwick \u2014 Market Quarter';
    if (activeMap === DRENWICK_WATERFRONT_MAP)       return 'Drenwick \u2014 Waterfront';
    return 'Drenwick';
  }
  if (inTown)                                 return 'Calwick';
  if (inLorraHouse)                           return "Lorra's Farmhouse";
  if (inMarenPost)                            return 'Guard Post';
  if (inDrenwrickPost)                        return 'Guard Post';
  if (inBridgePost)                           return 'Imperial Bridge \u2014 Toll Gate';
  if (inSmugglerFort)                         return 'Guard Post';
  return 'Verdant Vale';
}

// Returns a string key for the current map, used to filter SIMPLE_NPCS by location.
function currentMapId() {
  if (inLorraHouse)                  return 'lorra_house';
  if (inMarenPost)                   return 'maren_post';
  if (inDrenwrickPost)               return 'drenwick_post';
  if (inBridgePost)                  return 'bridge_post';
  if (inSmugglerFort)                return 'smuggler_fort';
  if (activeMap === MAP2)            return 'map2';
  if (activeMap === MAP3)            return 'map3';
  if (activeMap === MAP_N1)          return 'map_n1';
  if (activeMap === MAP_N2)          return 'map_n2';
  if (activeMap === MAP4)            return 'map4';
  if (activeMap === MAP3_N1)         return 'map3_n1';
  if (activeMap === MAP3_N2)         return 'map3_n2';
  if (activeMap === NORTH_BASIN_S_MAP) return 'north_basin_s';
  if (activeMap === NORTH_BASIN_C_MAP) return 'north_basin_c';
  if (activeMap === NORTH_BASIN_SW_MAP) return 'north_basin_sw';
  if (activeMap === NORTH_BASIN_W_MAP) return 'north_basin_w';
  if (inTakomo)                       return 'takomo_chamber';
  if (inMireVault)                    return 'mire_vault';
  if (inHamletInterior)               return 'hamlet_interior';
  if (inFenBrewery)                   return 'fen_brewery';
  if (inSluice && sluiceFloor === 1) return 'sluice';
  if (inSluice && sluiceFloor === 2) return 'sluice2';
  if (inSluice && sluiceFloor === 3) return 'sluice3';
  if (inDungeonEntrance)              return 'dungeon_entrance';
  if (inDungeon && dungeonFloor === 1) return 'dungeon1';
  if (inDungeon && dungeonFloor === 2) return 'dungeon2';
  if (inDungeon && dungeonFloor === 3) return 'dungeon3';
  if (inDungeon && dungeonFloor === 4) return 'dungeon4';
  if (inDungeon && dungeonFloor === 5) return 'dungeon5';
  if (inTown && townBuilding === 'inn'             && currentTownId === 'drenwick') return 'drenwick_inn';
  if (inTown && townBuilding === 'office'          && currentTownId === 'drenwick') return 'drenwick_office';
  if (inTown && townBuilding === 'harbormaster'    && currentTownId === 'drenwick') return 'drenwick_harbormaster';
  if (inTown && townBuilding === 'wash_house'      && currentTownId === 'drenwick') return 'drenwick_wash_house';
  if (inTown && townBuilding === 'provision_store' && currentTownId === 'drenwick') return 'drenwick_provision_store';
  if (inTown && townBuilding === 'guild_hall'      && currentTownId === 'drenwick') return 'drenwick_guild_hall';
  if (activeMap === DRENWICK_TAVERN_MAP)        return 'drenwick_tavern';
  if (activeMap === DRENWICK_SCHOOL_GROUND_MAP)   return 'drenwick_school_ground';
  if (activeMap === DRENWICK_SCHOOL_UPPER_MAP)    return 'drenwick_school_upper';
  if (activeMap === DRENWICK_SCHOOL_BASEMENT_MAP) return 'drenwick_school_basement';
  if (inTown && townBuilding && townBuilding.startsWith('drenwick_apt_')) return townBuilding;
  if (inTown && townBuilding === 'inn')    return 'inn';
  if (inTown && townBuilding === 'office') return 'office';
  if (inTown && townBuilding === 'school') return 'school';
  if (inTown && townBuilding === 'apt')    return 'apt';
  if (inTown && townBuilding === 'east')   return 'east';
  if (inTown && townBuilding === 'west')   return 'west';
  if (inTown && townBuilding === 'house')  return 'house:' + currentHouseId;
  if (inTown && !townBuilding) {
    if (currentTownId === 'drenwick') {
      if (activeMap === DRENWICK_WEST_RESIDENTIAL_MAP) return 'drenwick_west_residential';
      if (activeMap === DRENWICK_CANAL_DOCKS_MAP)      return 'drenwick_canal_docks';
      if (activeMap === DRENWICK_EAST_OUTSKIRTS_MAP)   return 'drenwick_east_outskirts';
      if (activeMap === DRENWICK_MARKET_MAP)           return 'drenwick_market';
      if (activeMap === DRENWICK_WATERFRONT_MAP)       return 'drenwick_waterfront';
      return 'drenwick_civic';
    }
    return 'town';
  }
  if (inTown) return 'town';
  return 'overworld';
}

// ─── Collision ────────────────────────────────────────────────────────────────
function tileAt(px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) {
    if (inDungeon) return DUNGEON_WALL;
    if (inSluice)  return SLUICE_WALL;
    if (inTown)    return TOWN_BUILDING;
    return TREE;
  }
  return activeMap[ty][tx];
}

// Square hitbox of radius 9 px centered on (cx, cy)
// Reads walkability through isTileWalkable() (tiles.js) rather than
// WALKABLE[] directly -- isTileWalkable() still just wraps WALKABLE[]
// (see its comment), so this is purely an indirection, not a behavior
// change: same four-corner check, same array, same result for every tile.
function canWalk(cx, cy) {
  const r = 9;
  if (!isTileWalkable(tileAt(cx - r, cy - r))) return false;
  if (!isTileWalkable(tileAt(cx + r, cy - r))) return false;
  if (!isTileWalkable(tileAt(cx - r, cy + r))) return false;
  if (!isTileWalkable(tileAt(cx + r, cy + r))) return false;
  // Custom-code solid objects (not in SIMPLE_NPCS)
  if (inSluice) {
    if (sluiceFloor === 1 && !SLUICE_CHEST.opened && Math.abs(cx - SLUICE_CHEST.x) < 18 && Math.abs(cy - SLUICE_CHEST.y) < 18) return false;
    if (sluiceFloor === 2 && !SLUICE_LEVEL2_CHEST.opened && Math.abs(cx - SLUICE_LEVEL2_CHEST.x) < 18 && Math.abs(cy - SLUICE_LEVEL2_CHEST.y) < 18) return false;
    if (sluiceFloor === 2 && !SLUICE_SECRET_CHEST.opened && Math.abs(cx - SLUICE_SECRET_CHEST.x) < 18 && Math.abs(cy - SLUICE_SECRET_CHEST.y) < 18) return false;
    if (sluiceFloor === 3 && !SLUICE_LEVEL3_CHEST.opened && Math.abs(cx - SLUICE_LEVEL3_CHEST.x) < 18 && Math.abs(cy - SLUICE_LEVEL3_CHEST.y) < 18) return false;
    if (sluiceFloor === 3 && !SLUICE_DEEP_CHEST.opened && Math.abs(cx - SLUICE_DEEP_CHEST.x) < 18 && Math.abs(cy - SLUICE_DEEP_CHEST.y) < 18) return false;
  } else if (inTakomo) {
    if (!TAKOMO.defeated && Math.abs(cx - TAKOMO.x) < 18 && Math.abs(cy - TAKOMO.y) < 18) return false;
  } else if (inMireVault) {
    if (!MIRE_VAULT_CHEST.opened && Math.abs(cx - MIRE_VAULT_CHEST.x) < 18 && Math.abs(cy - MIRE_VAULT_CHEST.y) < 18) return false;
  } else if (inDungeon && dungeonFloor === 1) {
    if (!DUNGEON_CHEST.opened && Math.abs(cx - DUNGEON_CHEST.x) < 18 && Math.abs(cy - DUNGEON_CHEST.y) < 18) return false;
    if (!DUNGEON_ALCOVE_CHEST.opened && Math.abs(cx - DUNGEON_ALCOVE_CHEST.x) < 18 && Math.abs(cy - DUNGEON_ALCOVE_CHEST.y) < 18) return false;
    if (warden_quest_started && !warden_quest_defeated && Math.abs(cx - BRIAR_WARDEN_SPAWN.x) < 18 && Math.abs(cy - BRIAR_WARDEN_SPAWN.y) < 18) return false;
  } else if (inDungeon && (dungeonFloor === 2 || dungeonFloor === 3)) {
    // bland floors — no solid obstacles beyond tile walkability
  } else if (inDungeon && dungeonFloor === 4) {
    if (!MULHOLLAND.defeated && Math.abs(cx - MULHOLLAND.x) < 18 && Math.abs(cy - MULHOLLAND.y) < 18) return false;
  } else if (inDungeon && dungeonFloor === 5) {
    if (!BOSS.defeated && Math.abs(cx - BOSS.x) < 18 && Math.abs(cy - BOSS.y) < 18) return false;
  } else if (inTown && !townBuilding) {
    if (currentTownId === 'drenwick' && activeMap === DRENWICK_MARKET_MAP && Math.abs(cx - DRENWICK_MARKET_NOTICE_BOARD_X) < 18 && Math.abs(cy - DRENWICK_MARKET_NOTICE_BOARD_Y) < 18) return false;
    if (currentTownId !== 'drenwick' && Math.abs(cx - NOTICE_BOARD_X) < 18 && Math.abs(cy - NOTICE_BOARD_Y) < 18) return false;
    if (currentTownId !== 'drenwick' && Math.abs(cx - MERCHANT.x) < 18 && Math.abs(cy - MERCHANT.y) < 18) return false;
    if (travellerPresent && currentTownId !== 'drenwick' && Math.abs(cx - TRAVELLER.x) < 18 && Math.abs(cy - TRAVELLER.y) < 18) return false;
  } else if (inTown && townBuilding === 'inn') {
    if (currentTownId !== 'drenwick' && Math.abs(cx - INNKEEPER.x) < 18 && Math.abs(cy - INNKEEPER.y) < 18) return false;
    if (currentTownId === 'drenwick' && Math.abs(cx - DRENWICK_INNKEEPER.x) < 18 && Math.abs(cy - DRENWICK_INNKEEPER.y) < 18) return false;
    for (const t of INN_TABLES) {
      if (Math.abs(cx - t.x) < 18 && Math.abs(cy - t.y) < 18) return false;
    }
    if (currentTownId === 'calwick' && isDayOff()) {
      if (Math.abs(cx - SUPERVISOR_DAYOFF.x) < 18 && Math.abs(cy - SUPERVISOR_DAYOFF.y) < 18) return false;
      if (Math.abs(cx - ESLA_DAYOFF.x) < 18 && Math.abs(cy - ESLA_DAYOFF.y) < 18) return false;
    }
  } else if (inTown && townBuilding === 'tavern') {
    if (currentTownId === 'drenwick' && activeMap === DRENWICK_TAVERN_MAP) {
      if (Math.abs(cx - DRENWICK_TAVERN_KEEPER.x) < 18 && Math.abs(cy - DRENWICK_TAVERN_KEEPER.y) < 18) return false;
      for (const t of DRENWICK_TAVERN_TABLES) {
        if (Math.abs(cx - t.x) < 18 && Math.abs(cy - t.y) < 18) return false;
      }
    }
  } else if (inTown && townBuilding === 'school' && currentTownId === 'drenwick') {
    if (activeMap === DRENWICK_SCHOOL_UPPER_MAP) {
      if (Math.abs(cx - DRENWICK_SCHOOL_CABINET.x) < 18 && Math.abs(cy - DRENWICK_SCHOOL_CABINET.y) < 18) return false;
      if (Math.abs(cx - DRENWICK_SCHOOL_BOARD.x)   < 18 && Math.abs(cy - DRENWICK_SCHOOL_BOARD.y)   < 18) return false;
    }
    if (activeMap === DRENWICK_SCHOOL_BASEMENT_MAP) {
      // Block the full bookshelf span (cols 6-10 at row 2)
      if (cy < 3 * TILE && cx > 5.5 * TILE && cx < 11.5 * TILE) return false;
    }
  } else if (inTown && townBuilding === 'office') {
    if (currentTownId === 'calwick') {
      if (Math.abs(cx - SUPERVISOR.x) < 18 && Math.abs(cy - SUPERVISOR.y) < 18) return false;
      if (Math.abs(cx - FILING_CABINET.x) < 18 && Math.abs(cy - FILING_CABINET.y) < 18) return false;
      if (Math.abs(cx - ESLA_CABINET.x) < 18 && Math.abs(cy - ESLA_CABINET.y) < 18) return false;
      if (Math.abs(cx - ESLA.x) < 18 && Math.abs(cy - ESLA.y) < 18) return false;
    }
  } else if (inTown && townBuilding === 'house') {
    const hd = HOUSE_DATA[currentHouseId];
    if (hd) {
      if (hd.tables) {
        for (const t of hd.tables) {
          if (Math.abs(cx - t.x) < 18 && Math.abs(cy - t.y) < 18) return false;
        }
      }
      if (hd.hearth && Math.abs(cx - hd.hearth.x) < 18 && Math.abs(cy - hd.hearth.y) < 18) return false;
      if (hd.bed    && Math.abs(cx - hd.bed.x)   < 18 && Math.abs(cy - hd.bed.y)   < 18) return false;
      if (hd.stove  && Math.abs(cx - hd.stove.x) < 16 && Math.abs(cy - hd.stove.y) < 16) return false;
      if (hd.cat    && Math.abs(cx - hd.cat.x)   < 12 && Math.abs(cy - hd.cat.y)   < 12) return false;
      if (hd.chest  && Math.abs(cx - hd.chest.x) < 14 && Math.abs(cy - hd.chest.y) < 14) return false;
      if (hd.dresser && Math.abs(cx - hd.dresser.x) < 15 && Math.abs(cy - hd.dresser.y) < 16) return false;
    }
    if (currentHouseId === 'player_house' && day >= 2 && !CAT_ARMOR_CHEST.opened) {
      if (Math.abs(cx - CAT_ARMOR_CHEST.x) < 14 && Math.abs(cy - CAT_ARMOR_CHEST.y) < 14) return false;
    }
    if (currentHouseId === 'west_i' && den_wraith_quest_started && !den_wraith_defeated) {
      if (Math.abs(cx - DEN_WRAITH.x) < 18 && Math.abs(cy - DEN_WRAITH.y) < 18) return false;
    }
  }
  // Simple NPC solid bodies
  const mapId = currentMapId();
  for (const npc of SIMPLE_NPCS) {
    if (npc.map !== mapId || !npc.solid) continue;
    if (Math.abs(cx - npc.x) < 18 && Math.abs(cy - npc.y) < 18) return false;
  }
  return true;
}

// Returns whether the given tile ID currently rolls for a random encounter,
// given the CURRENT location state flags (inDungeon+dungeonFloor, inSluice,
// inMireVault, etc). Extracted out of update()'s per-frame encounter check
// so the debug map inspector (render-ui.js's drawDebugInspector()) can
// answer "is the tile I'm standing on encounter-eligible right now" using
// the exact same logic the real encounter roll uses, rather than a second,
// driftable copy of it.
// Tile-property migration (see tiles.js's TILE_PROPERTIES / encounterEligible
// comment): only the first branch below -- plain outdoor, no special-area
// flag active -- was migrated to isTileEncounterEligible(). That's the one
// "straightforward" case: GRASS is the only tile with encounterEligible:true
// that can ever appear on a map reached with every inX flag false (dungeon-
// floor and sluice-floor tiles only appear on maps that set inDungeon/
// inSluice), so swapping `tile === GRASS` for the tile-property lookup here
// is behaviorally identical, not just similar.
//
// Every other branch is intentionally left as a literal `tile === CONSTANT`
// check, NOT migrated to a generic per-tile lookup, because eligibility
// there depends on dungeonFloor (mutable global state), not just the tile
// ID -- DUNGEON_FLOOR is the eligible tile on floors 1/3/5/7 but not on any
// other floor, and the same numeric tile ID doesn't carry "which floor am I"
// information on its own. TILE_PROPERTIES still marks DUNGEON_FLOOR/
// DUNGEON2_FLOOR/DUNGEON3_FLOOR/SLUICE_FLOOR as encounterEligible:true (each
// genuinely is, in its own real context) for documentation/validation
// purposes, but this function keeps deciding *which* floor's tile counts by
// hand, exactly as before -- migrating that too would mean re-deriving
// dungeonFloor-to-tile-id mapping information that only this function (and
// combat.js's currentEncounterPool(), same shape of special case) currently
// encodes, which is more risk than this pass calls for.
function isEncounterEligibleTile(tile) {
  if (!inDungeon && !inTown && !inSluice && !inMireVault && !inTakomo && !inFenBrewery && !inHamletInterior && !inDungeonEntrance) return isTileEncounterEligible(tile);
  if (inDungeonEntrance) return false; // South Ruins Entrance Hall — deliberately encounter-free
  if (inDungeon && dungeonFloor === 1)  return tile === DUNGEON_FLOOR;
  if (inDungeon && dungeonFloor === 2)  return tile === DUNGEON2_FLOOR;
  if (inDungeon && dungeonFloor === 3)  return tile === DUNGEON_FLOOR;
  if (inDungeon && dungeonFloor === 4)  return tile === DUNGEON2_FLOOR;
  if (inDungeon && dungeonFloor === 5)  return tile === DUNGEON_FLOOR;
  if (inDungeon && dungeonFloor === 6)  return tile === DUNGEON2_FLOOR;
  if (inDungeon && dungeonFloor === 7)  return tile === DUNGEON_FLOOR;
  if (inDungeon && dungeonFloor === 8)  return tile === DUNGEON2_FLOOR;
  if (inDungeon && dungeonFloor === 9)  return tile === DUNGEON3_FLOOR;
  if (inDungeon && dungeonFloor === 10) return tile === DUNGEON3_FLOOR;
  if (inSluice)    return tile === SLUICE_FLOOR;
  if (inMireVault) return tile === DUNGEON2_FLOOR;
  return false;
}

// ─── Update ───────────────────────────────────────────────────────────────────
const SPEED = 2; // pixels per frame

function update() {
  // Cooldown ticks every frame regardless of game state
  if (combat.cooldown > 0) combat.cooldown--;
  if (worldToastTimer > 0) worldToastTimer--;

  // Combat is active — only tick the flash / fire-cast timers, freeze everything else
  if (combat.active) {
    if (combat.flashTimer > 0) combat.flashTimer--;
    if (combat.fireCastTimer > 0) combat.fireCastTimer--;
    return;
  }

  if (dialogue.open || menu.open || choice.open || shop.open) return;

  let dx = 0, dy = 0;
  if (keys['ArrowLeft']  || keys['a']) { dx = -SPEED; player.facing = 'left';  }
  if (keys['ArrowRight'] || keys['d']) { dx =  SPEED; player.facing = 'right'; }
  if (keys['ArrowUp']    || keys['w']) { dy = -SPEED; player.facing = 'up';    }
  if (keys['ArrowDown']  || keys['s']) { dy =  SPEED; player.facing = 'down';  }

  if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

  player.moving = (dx !== 0 || dy !== 0);

  if (player.moving) {
    // Edge-based transitions (world-transitions.js's EDGE_TRANSITIONS): when
    // the player is standing in the outermost row/col of the map and pushes
    // further in that direction, check for a configured open-edge link
    // before falling through to the normal canWalk()-gated movement below.
    // This is separate from, and doesn't affect, point-tile transitions
    // (town/dungeon entrances, bridge gate, stairs, etc.), which are still
    // handled later in this function by their own curTile checks exactly as
    // before. A map with no EDGE_TRANSITIONS entry (i.e. almost every map)
    // never satisfies these curCol/curRow checks in the first place, since
    // its border tiles remain solid and canWalk() already keeps the player
    // off col 0/col COLS-1/row 0/row ROWS-1 entirely.
    const curCol = Math.floor(player.x / TILE);
    const curRow = Math.floor(player.y / TILE);
    let edgeTransitioned = false;

    if      (dx < 0 && curCol <= 0)          edgeTransitioned = tryEdgeTransition('west');
    else if (dx > 0 && curCol >= COLS - 1)    edgeTransitioned = tryEdgeTransition('east');
    else if (canWalk(player.x + dx, player.y)) player.x += dx;

    if (!edgeTransitioned) {
      if      (dy < 0 && curRow <= 0)         edgeTransitioned = tryEdgeTransition('north');
      else if (dy > 0 && curRow >= ROWS - 1)  edgeTransitioned = tryEdgeTransition('south');
      else if (canWalk(player.x, player.y + dy)) player.y += dy;
    }

    if (edgeTransitioned) return; // activeMap/player position fully replaced; skip the rest of this frame, same as any other map transition

    player.step++;
    if (hasStatusEffect('poison') && player.step % 60 === 0)
      stats.hp = Math.max(1, stats.hp - 1);
    if (inSluice && !hasStatusEffect('muddied') && Math.random() < 0.003)
      addStatusEffect('muddied');
    if (hasStatusEffect('cursed') && player.step % 80 === 0 && Math.random() < 0.20) {
      const tripDmg = Math.floor(Math.random() * 2) + 2;
      stats.hp = Math.max(1, stats.hp - tripDmg);
      const tripMsgs = [
        'You trip over your own feet.',
        'You stub your toe on nothing in particular.',
        'You stumble and bark your shin.',
        'You walk into a wall that wasn\u2019t there.',
        'You trip on entirely flat ground.',
      ];
      showWorldToast(tripMsgs[Math.floor(Math.random() * tripMsgs.length)] + ` (\u22122 HP)`);
    }

    // Map transitions
    const ttx = Math.floor(player.x / TILE);
    const tty = Math.floor(player.y / TILE);
    const curTile = activeMap[tty] ? activeMap[tty][ttx] : -1;
    if (!inDungeon && !inDungeonEntrance && !inTown && !inSluice && curTile === DUNGEON_ENTRANCE) { enterDungeon(); return; }
    if (inDungeonEntrance && curTile === RUIN_STAIRS_DOWN) { descendToDungeon1(); return; }
    if (inDungeonEntrance && curTile === RUIN_EXIT)        { exitDungeon();       return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP && curTile === TOWN_ENTRANCE) { enterTownAt('calwick', entryPointFromFacing(player.facing)); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP  && curTile === MAP2_EXIT)     { enterMap2(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP2 && curTile === MAP2_ENTRANCE) { exitMap2();  return; }
    if (!inDungeon && !inTown && !inSluice && !inLorraHouse && activeMap === MAP2 && curTile === FARM_HOUSE) { enterLorraHouse(); return; }
    if (inLorraHouse && curTile === INTERIOR_EXIT)  { exitLorraHouse(); return; }
    if (!inDungeon && !inTown && !inSluice && !inMarenPost && activeMap === MAP && curTile === GUARD_POST) { enterMarenPost(); return; }
    if (inMarenPost && curTile === INTERIOR_EXIT)   { exitMarenPost();  return; }
    // Drenwick guard post (MAP3_N2, row 12 col 11)
    if (!inDungeon && !inTown && !inSluice && !inDrenwrickPost && activeMap === MAP3_N2 && curTile === GUARD_POST) { enterDrenwrickPost(); return; }
    if (inDrenwrickPost && curTile === INTERIOR_EXIT) { exitDrenwrickPost(); return; }
    // Imperial bridge toll gate (MAP3_N2, row 5 col 12) — bidirectional entry
    if (!inDungeon && !inTown && !inSluice && !inBridgePost && activeMap === MAP3_N2 && curTile === BRIDGE_GATE && player.facing === 'up')   { enterBridgePostFromSouth(); return; }
    if (!inDungeon && !inTown && !inSluice && !inBridgePost && activeMap === MAP3_N2 && curTile === BRIDGE_GATE && player.facing === 'down')  { enterBridgePostFromNorth(); return; }
    // BRIDGE_EXIT tile inside BRIDGE_CROSSING_MAP — north edge exits to world north bank, south edge exits to south bank.
    // The crossing direction requires a paid toll; backing out the way you came is always free.
    if (inBridgePost && curTile === BRIDGE_EXIT) {
      if (player.y < 2 * TILE) {
        // North exit — blocked unless the player came from the north (backing out) or paid
        if (bridge_entry_direction === 'south' && !bridge_toll_paid) {
          dialogue.name  = 'Imperial Soldier';
          dialogue.pages = [['\u201cOne gold to cross.\u201d', 'He steps into the path. There is no way around him.']];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
        exitBridgeNorth(); return;
      } else {
        // South exit — blocked unless the player came from the south (backing out) or paid
        if (bridge_entry_direction === 'north' && !bridge_toll_paid) {
          dialogue.name  = 'Imperial Soldier';
          dialogue.pages = [['\u201cOne gold to cross.\u201d', 'He steps into the path. There is no way around him.']];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
        exitBridgeSouth(); return;
      }
    }
    // Smugglers' fort (MAP3_N1, row 9 col 13) — blocked without quest
    if (!inDungeon && !inTown && !inSluice && !inSmugglerFort && activeMap === MAP3_N1 && curTile === GUARD_POST) {
      if (fort_quest_started) { enterSmugglerFort(); return; }
      dialogue.name  = '';
      dialogue.pages = [[
        'A figure in Imperial grey stands in the doorway.',
        '\u201cMove on. This post isn\u2019t open to travellers.\u201d',
      ]];
      dialogue.open = true; dialogue.page = 0;
      return;
    }
    if (inSmugglerFort && curTile === INTERIOR_EXIT) { exitSmugglerFort(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP2 && curTile === MAP3_EXIT)      { enterMap3();  return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP3 && curTile === MAP3_ENTRANCE) { exitMap3();   return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP3   && curTile === MAP4_EXIT)        { enterMap4();   return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP4   && curTile === MAP4_ENTRANCE)    { exitMap4();    return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP4   && curTile === MAP5_EXIT)        { enterMap5();   return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP5   && curTile === MAP5_ENTRANCE)    { exitMap5();    return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP3   && curTile === FEN_N_EXIT)       { enterMap3N1(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP3_N1 && curTile === FEN_N_ENTRANCE)  { exitMap3N1();  return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP3_N1 && curTile === FEN_N2_EXIT)     { enterMap3N2(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP3_N2 && curTile === FEN_N2_ENTRANCE) { exitMap3N2();  return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP3_N2 && curTile === NORTH_BASIN_EXIT) { enterNorthBasinS(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === NORTH_BASIN_S_MAP && curTile === NORTH_BASIN_ENTRANCE) { exitNorthBasinS(); return; }
    // South approach <-> Reservoir (north/south) and south approach <->
    // Silt Flats (east/west) used to be point-tile checks here; both are
    // now handled generically by the edge-transition interception in the
    // movement block above (see EDGE_TRANSITIONS in world-transitions.js).
    if (!inDungeon && !inTown && !inSluice && activeMap === NORTH_BASIN_SW_MAP && curTile === NORTH_BASIN_W_EXIT) { enterNorthBasinW(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === NORTH_BASIN_W_MAP && curTile === NORTH_BASIN_W_ENTRANCE) { exitNorthBasinW(); return; }
    if (!inDungeon && !inTown && !inSluice && !inMireVault && activeMap === MAP3_N1 && curTile === MIRE_ENTRANCE) { enterMireVault(); return; }
    if (inMireVault && curTile === MIRE_EXIT)                                                        { exitMireVault();  return; }
    // Falls hamlet houses (MAP3_N1 rows 10-12 cols 1-2) — three houses share one interior map
    // player.y discriminates which of the 3 houses was entered (A=row10, B=row11, C=row12)
    if (!inDungeon && !inTown && !inSluice && !inHamletInterior && activeMap === MAP3_N1 && curTile === FARM_HOUSE && player.x <= 10 * TILE) {
      const room = player.y < 11 * TILE ? 'A' : player.y < 12 * TILE ? 'B' : 'C';
      enterHamletInterior(room); return;
    }
    if (inHamletInterior && curTile === INTERIOR_EXIT) { exitHamletInterior(); return; }
    // Fen brewery (MAP3_N1 row 4 col 13) — player.x > 10*TILE discriminates from hamlet houses
    if (!inDungeon && !inTown && !inSluice && !inFenBrewery && activeMap === MAP3_N1 && curTile === FARM_HOUSE && player.x > 10 * TILE) { enterFenBrewery(); return; }
    if (inFenBrewery && curTile === INTERIOR_EXIT) { exitFenBrewery(); return; }
    if (inTown && currentTownId === 'drenwick') {
      if (activeMap === DRENWICK_CIVIC_MAP) {
        if (curTile === NORTH_EXIT) { moveToDrenwichDistrict(DRENWICK_WEST_RESIDENTIAL_MAP,  7.5, 13.5, 'up');    return; }
        if (curTile === MAP2_EXIT)  { moveToDrenwichDistrict(DRENWICK_EAST_OUTSKIRTS_MAP,    1.5,  4.5, 'right'); return; }
      }
      if (activeMap === DRENWICK_WEST_RESIDENTIAL_MAP) {
        if (curTile === NORTH_EXIT)     { moveToDrenwichDistrict(DRENWICK_CANAL_DOCKS_MAP,  7.5, 12.5, 'up');    return; }
        if (curTile === NORTH_ENTRANCE) { moveToDrenwichDistrict(DRENWICK_CIVIC_MAP,         7.5,  4.5, 'down');  return; }
        if (curTile === MAP2_EXIT)      { moveToDrenwichDistrict(DRENWICK_MARKET_MAP,        1.5,  8.5, 'right'); return; }
      }
      if (activeMap === DRENWICK_CANAL_DOCKS_MAP) {
        if (curTile === NORTH_ENTRANCE) { moveToDrenwichDistrict(DRENWICK_WEST_RESIDENTIAL_MAP, 7.5,  1.5, 'down');  return; }
        if (curTile === MAP2_EXIT)      { moveToDrenwichDistrict(DRENWICK_WATERFRONT_MAP,        1.5,  7.5, 'right'); return; }
      }
      if (activeMap === DRENWICK_EAST_OUTSKIRTS_MAP) {
        if (curTile === NORTH_EXIT)    { moveToDrenwichDistrict(DRENWICK_MARKET_MAP, 7.5, 12.5, 'up');    return; }
        if (curTile === MAP2_ENTRANCE) { moveToDrenwichDistrict(DRENWICK_CIVIC_MAP, 14.5,  4.5, 'left');  return; }
      }
      if (activeMap === DRENWICK_MARKET_MAP) {
        if (curTile === NORTH_EXIT)     { moveToDrenwichDistrict(DRENWICK_WATERFRONT_MAP,        7.5, 12.5, 'up');    return; }
        if (curTile === NORTH_ENTRANCE) { moveToDrenwichDistrict(DRENWICK_EAST_OUTSKIRTS_MAP,    7.5,  1.5, 'down');  return; }
        if (curTile === MAP2_ENTRANCE)  { moveToDrenwichDistrict(DRENWICK_WEST_RESIDENTIAL_MAP, 14.5,  8.5, 'left');  return; }
      }
      if (activeMap === DRENWICK_WATERFRONT_MAP) {
        if (curTile === NORTH_ENTRANCE) { moveToDrenwichDistrict(DRENWICK_MARKET_MAP,      7.5,  4.5, 'down');  return; }
        if (curTile === MAP2_ENTRANCE)  { moveToDrenwichDistrict(DRENWICK_CANAL_DOCKS_MAP, 14.5,  7.5, 'left');  return; }
        if (curTile === TAKOMO_GATE)    { enterTakomo(); return; }
      }
    }
    if (inTakomo && curTile === TAKOMO_EXIT) { exitTakomo(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP3_N2 && curTile === TOWN_ENTRANCE)   { enterTownAt('drenwick', entryPointFromFacing(player.facing)); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP  && curTile === NORTH_EXIT)    { enterMapN1(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP_N1 && curTile === NORTH_ENTRANCE)  { exitMapN1();  return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP_N1 && curTile === NORTH2_EXIT)     { enterMapN2(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP_N2 && curTile === NORTH2_ENTRANCE) { exitMapN2();  return; }
    // Drenwick school staircases — guarded with inTown to avoid dungeon/sluice false positives.
    // Ground floor: col 2 = DUNGEON_STAIRS_DOWN (basement), col 13 = DUNGEON2_STAIRS_UP (upper).
    // Tiles are visually distinct — stairs-down vs stairs-up — so the direction is clear.
    if (inTown && currentTownId === 'drenwick' && activeMap === DRENWICK_SCHOOL_GROUND_MAP && curTile === DUNGEON_STAIRS_DOWN) {
      // West stairs only (col 2) — descend to basement
      activeMap     = DRENWICK_SCHOOL_BASEMENT_MAP;
      player.x      =  2.5 * TILE;
      player.y      =  3.5 * TILE;
      player.facing = 'down';
      return;
    }
    if (inTown && currentTownId === 'drenwick' && activeMap === DRENWICK_SCHOOL_GROUND_MAP && curTile === DUNGEON2_STAIRS_UP) {
      // East stairs (col 13) — ascend to upper floor
      activeMap     = DRENWICK_SCHOOL_UPPER_MAP;
      player.x      = 13.5 * TILE;
      player.y      =  3.5 * TILE;
      player.facing = 'up';
      return;
    }
    if (inTown && currentTownId === 'drenwick' && activeMap === DRENWICK_SCHOOL_UPPER_MAP && curTile === DUNGEON_STAIRS_DOWN) {
      // Uses the "stairs down" tile (not stairs-up) since these stairs
      // descend to the ground floor from here -- see maps.js.
      activeMap     = DRENWICK_SCHOOL_GROUND_MAP;
      player.x      = 13.5 * TILE;  // col 13 — bottom of stairs on ground floor
      player.y      =  3.5 * TILE;  // row 3 — one south of staircase tile
      player.facing = 'down';
      return;
    }
    if (inTown && currentTownId === 'drenwick' && activeMap === DRENWICK_SCHOOL_BASEMENT_MAP && curTile === DUNGEON2_STAIRS_UP) {
      activeMap     = DRENWICK_SCHOOL_GROUND_MAP;
      player.x      =  2.5 * TILE;  // col 2 — bottom of basement stairs on ground floor
      player.y      =  3.5 * TILE;  // row 3
      player.facing = 'down';
      return;
    }
    if (inDungeon && dungeonFloor === 1 && curTile === DUNGEON_EXIT) { ascendToDungeonEntrance(); return; }
    if (inDungeon && dungeonFloor === 1 && curTile === DUNGEON_STAIRS_DOWN) { descendToDungeon2(); return; }
    if (inDungeon && dungeonFloor === 2 && curTile === DUNGEON2_STAIRS_UP)  { ascendToDungeon1();  return; }
    if (inDungeon && dungeonFloor === 2 && curTile === DUNGEON_STAIRS_DOWN) { descendToDungeon3(); return; }
    if (inDungeon && dungeonFloor === 3 && curTile === DUNGEON2_STAIRS_UP)  { ascendToDungeon2();  return; }
    if (inDungeon && dungeonFloor === 3 && curTile === DUNGEON_STAIRS_DOWN) { descendToDungeon4(); return; }
    // ── Floor 3 sub-room passage navigation ──────────────────────────────────
    if (inDungeon && dungeonFloor === 3 && activeMap === DUNGEON3_MAP) {
      if (curTile === D3_WEST_PASSAGE)  { d3_TC_to_TL(); return; }
      if (curTile === D3_EAST_PASSAGE)  { d3_TC_to_TR(); return; }
      if (curTile === D3_SOUTH_PASSAGE) { d3_TC_to_MC(); return; }
    }
    if (inDungeon && dungeonFloor === 3 && activeMap === DUNGEON3_TL_MAP) {
      if (curTile === D3_EAST_PASSAGE)  { d3_TL_to_TC(); return; }
      if (curTile === D3_SOUTH_PASSAGE) { d3_TL_to_ML(); return; }
    }
    if (inDungeon && dungeonFloor === 3 && activeMap === DUNGEON3_TR_MAP) {
      if (curTile === D3_WEST_PASSAGE)  { d3_TR_to_TC(); return; }
      if (curTile === D3_SOUTH_PASSAGE) { d3_TR_to_MR(); return; }
    }
    if (inDungeon && dungeonFloor === 3 && activeMap === DUNGEON3_ML_MAP) {
      if (curTile === D3_NORTH_PASSAGE) { d3_ML_to_TL(); return; }
      if (curTile === D3_EAST_PASSAGE)  { d3_ML_to_MC(); return; }
      if (curTile === D3_SOUTH_PASSAGE) { d3_ML_to_BL(); return; }
    }
    if (inDungeon && dungeonFloor === 3 && activeMap === DUNGEON3_MC_MAP) {
      if (curTile === D3_NORTH_PASSAGE) { d3_MC_to_TC(); return; }
      if (curTile === D3_WEST_PASSAGE)  { d3_MC_to_ML(); return; }
      if (curTile === D3_EAST_PASSAGE)  { d3_MC_to_MR(); return; }
      if (curTile === D3_SOUTH_PASSAGE) { d3_MC_to_BC(); return; }
    }
    if (inDungeon && dungeonFloor === 3 && activeMap === DUNGEON3_MR_MAP) {
      if (curTile === D3_NORTH_PASSAGE) { d3_MR_to_TR(); return; }
      if (curTile === D3_WEST_PASSAGE)  { d3_MR_to_MC(); return; }
      if (curTile === D3_SOUTH_PASSAGE) { d3_MR_to_BR(); return; }
    }
    if (inDungeon && dungeonFloor === 3 && activeMap === DUNGEON3_BL_MAP) {
      if (curTile === D3_NORTH_PASSAGE) { d3_BL_to_ML(); return; }
      if (curTile === D3_EAST_PASSAGE)  { d3_BL_to_BC(); return; }
    }
    if (inDungeon && dungeonFloor === 3 && activeMap === DUNGEON3_BC_MAP) {
      if (curTile === D3_NORTH_PASSAGE) { d3_BC_to_MC(); return; }
      if (curTile === D3_WEST_PASSAGE)  { d3_BC_to_BL(); return; }
      if (curTile === D3_EAST_PASSAGE)  { d3_BC_to_BR(); return; }
    }
    if (inDungeon && dungeonFloor === 3 && activeMap === DUNGEON3_BR_MAP) {
      if (curTile === D3_NORTH_PASSAGE) { d3_BR_to_MR(); return; }
      if (curTile === D3_WEST_PASSAGE)  { d3_BR_to_BC(); return; }
    }
    if (inDungeon && dungeonFloor === 4 && curTile === DUNGEON2_STAIRS_UP)  { ascendToDungeon3();  return; }
    if (inDungeon && dungeonFloor === 4 && curTile === DUNGEON_STAIRS_DOWN && MULHOLLAND.defeated) { descendToDungeon5(); return; }
    if (inDungeon && dungeonFloor === 5 && curTile === DUNGEON2_STAIRS_UP)  { ascendToDungeon4();  return; }
    if (inDungeon && dungeonFloor === 5 && curTile === DUNGEON_STAIRS_DOWN && BOSS.defeated) { descendToDungeon6(); return; }
    if (inDungeon && dungeonFloor === 6 && curTile === DUNGEON2_STAIRS_UP)  { ascendToDungeon5();  return; }
    if (inDungeon && dungeonFloor === 6 && curTile === DUNGEON_STAIRS_DOWN) { descendToDungeon7(); return; }
    if (inDungeon && dungeonFloor === 7 && curTile === DUNGEON2_STAIRS_UP)  { ascendToDungeon6();  return; }
    if (inDungeon && dungeonFloor === 7 && curTile === DUNGEON_STAIRS_DOWN) { descendToDungeon8(); return; }
    if (inDungeon && dungeonFloor === 8 && curTile === DUNGEON2_STAIRS_UP)  { ascendToDungeon7();  return; }
    if (inDungeon && dungeonFloor === 8 && curTile === DUNGEON8_WEST_DOOR)  { enterDungeon8West(); return; }
    if (inDungeon && dungeonFloor === 8 && curTile === DUNGEON8_EAST_DOOR)  { enterDungeon8East(); return; }
    if (inDungeon && dungeonFloor === 9 && curTile === DUNGEON8_WEST_RET)   { exitDungeon8West();  return; }
    if (inDungeon && dungeonFloor === 10 && curTile === DUNGEON8_EAST_RET)  { exitDungeon8East();  return; }
    if (inTown && !townBuilding && curTile === TOWN_EXIT)       { exitTown();              return; }
    // Waterfront: Dockworkers' Tavern (INN_DOOR) and Infirmary (OFFICE_DOOR, no interior map)
    if (inTown && !townBuilding && currentTownId === 'drenwick' && activeMap === DRENWICK_WATERFRONT_MAP) {
      if (curTile === INN_DOOR) {
        enterBuilding('tavern'); return;
      }
      if (curTile === OFFICE_DOOR) {
        // Infirmary — door-tap dialogue, no interior map
        dialogue.name  = 'Infirmary';
        dialogue.pages = [
          ['\u201cOpen for anyone who needs it.\u201d',
           '\u201cNo charge for basic treatment.\u201d'],
          ['\u201cIf it\u2019s serious, you\u2019ll need to go northeast.\u201d',
           '\u201cWe do what we can here.\u201d'],
        ];
        dialogue.open = true;
        dialogue.page = 0;
        return;
      }
    }
    if (inTown && !townBuilding && curTile === INN_DOOR)        { enterBuilding('inn');    return; }
    // Market: Guild Hall door (col 5 row 3) and Post Relay counter (col 14 row 10, no interior)
    if (inTown && !townBuilding && currentTownId === 'drenwick' && activeMap === DRENWICK_MARKET_MAP && curTile === OFFICE_DOOR) {
      if (ttx === 5 && tty === 2) { enterBuilding('guild_hall'); return; }
      // Post Relay has no interior — consume event
      return;
    }
    // Canal/Docks: three OFFICE_DOOR tiles routing to different buildings by position
    if (inTown && !townBuilding && currentTownId === 'drenwick' && activeMap === DRENWICK_CANAL_DOCKS_MAP && curTile === OFFICE_DOOR) {
      if      (ttx === 2  && tty === 6) { enterBuilding('harbormaster');    return; }  // Harbormaster col 2
      else if (ttx === 7  && tty === 6) { enterBuilding('wash_house');      return; }  // Wash House    col 7
      else if (ttx === 11 && tty === 6) { enterBuilding('provision_store'); return; }  // Provision St. col 11
      return; // unknown door — consume event without crashing
    }
    if (inTown && !townBuilding && curTile === OFFICE_DOOR) {
      if (isClosedToday('office')) {
        dialogue.name  = 'Office Door';
        dialogue.pages = [['Closed for dayoff.', 'Please come back tomorrow.']];
        dialogue.open  = true;
        dialogue.page  = 0;
      } else {
        enterBuilding('office');
      }
      return;
    }
    if (inTown && townBuilding !== 'inn' && townBuilding !== 'office' && townBuilding !== 'house' && townBuilding !== 'school' && curTile === HOUSE_DOOR) {
      const door = HOUSE_DOORS.find(d => d.map === currentMapId() && d.col === ttx && d.row === tty);
      if (door) {
        if (door.houseId === 'west_i' && den_wraith_quest_started && !den_wraith_defeated && day % 5 !== 0) {
          dialogue.name  = 'Property Door';
          dialogue.pages = [['An inspector\'s seal is fixed to the door.', 'Entry is authorized on Dayoff only.']];
          dialogue.open  = true;
          dialogue.page  = 0;
          return;
        }
        enterHouse(door.houseId);
        return;
      }
    }
    if (inTown && !townBuilding && activeMap === DRENWICK_WEST_RESIDENTIAL_MAP && curTile === SCHOOL_DOOR) {
      if (isClosedToday('school')) {
        dialogue.name  = 'School Door';
        dialogue.pages = [['The school is closed for dayoff.']];
        dialogue.open  = true;
        dialogue.page  = 0;
      } else {
        enterBuilding('school');
      }
      return;
    }
    if (inTown && townBuilding === 'west' && curTile === SCHOOL_DOOR) {
      if (isClosedToday('school')) {
        dialogue.name  = 'School Door';
        dialogue.pages = [['The school is closed for dayoff.']];
        dialogue.open  = true;
        dialogue.page  = 0;
      } else {
        enterBuilding('school');
      }
      return;
    }
    if (inTown && townBuilding  && curTile === INTERIOR_EXIT)   { exitBuilding();          return; }
    if (inTown && !townBuilding && curTile === EAST_ENTRANCE)   { enterEastTown();         return; }
    if (inTown && !townBuilding && curTile === WEST_ENTRANCE)   { enterWestTown();         return; }
    if (inTown && townBuilding === 'west' && curTile === WEST_EXIT) { exitWestTown();      return; }
    if (inTown && townBuilding === 'east' && curTile === EAST_EXIT)       { exitEastTown();        return; }
    if (inTown && townBuilding === 'east' && curTile === TOWN_EXIT)       { exitEastTownToWorld(); return; }
    if (inTown && townBuilding === 'east' && curTile === SLUICE_ENTRANCE) {
      dialogue.name  = 'East Sluice';
      dialogue.pages = [
        ['Maintenance hatch. Access to the East Sluice drainage network.',
         'Status: Scheduled inspection overdue. Last certified entry: twelve days ago.',
         'Flow anomaly on record in the lower access channel.',
         'Feral creature activity reported by maintenance staff.'],
      ];
      dialogue.callbacks = [function () {
        choice.title     = 'East Sluice';
        choice.options   = ['Descend', 'Stay here'];
        choice.cursor    = 0;
        choice.callbacks = [
          function () { enterSluice(); },
          function () { /* stay on surface */ },
        ];
        choice.open = true;
      }];
      dialogue.open = true;
      dialogue.page = 0;
      return;
    }
    if (inTown && townBuilding === 'east' && curTile === APT_DOOR)        { enterBuilding('apt');  return; }
    if (inTown && townBuilding === 'apt'  && curTile === APT_INTERIOR_DOOR) {
      const door = HOUSE_DOORS.find(d => d.map === 'apt' && d.col === ttx && d.row === tty);
      if (door) { enterHouse(door.houseId); return; }
    }
    // Drenwick East — six duplex APT_DOORs route to their respective corridors by position
    if (inTown && !townBuilding && currentTownId === 'drenwick' && activeMap === DRENWICK_EAST_OUTSKIRTS_MAP && curTile === APT_DOOR) {
      if      (ttx === 2 && tty ===  3) { enterBuilding('drenwick_apt_a1'); return; }
      else if (ttx === 4 && tty ===  3) { enterBuilding('drenwick_apt_a2'); return; }
      else if (ttx === 2 && tty ===  7) { enterBuilding('drenwick_apt_b1'); return; }
      else if (ttx === 4 && tty ===  7) { enterBuilding('drenwick_apt_b2'); return; }
      else if (ttx === 2 && tty === 11) { enterBuilding('drenwick_apt_c1'); return; }
      else if (ttx === 4 && tty === 11) { enterBuilding('drenwick_apt_c2'); return; }
      return;
    }
    // Drenwick East — APT_INTERIOR_DOOR inside a corridor enters the individual unit
    if (inTown && townBuilding && townBuilding.startsWith('drenwick_apt_') && curTile === APT_INTERIOR_DOOR) {
      const door = HOUSE_DOORS.find(d => d.map === townBuilding && d.col === ttx && d.row === tty);
      if (door) { enterHouse(door.houseId); return; }
    }
    if (inSluice && curTile === SLUICE_EXIT && sluiceFloor === 1)          { exitSluice();          return; }
    if (inSluice && curTile === SLUICE_EXIT && sluiceFloor === 2)          { ascendToSluice1();     return; }
    if (inSluice && sluiceFloor === 1 && curTile === DUNGEON_STAIRS_DOWN)  { descendToSluice2();    return; }
    if (inSluice && sluiceFloor === 2 && curTile === DUNGEON_STAIRS_DOWN)  { descendToSluice3();    return; }
    if (inSluice && sluiceFloor === 3 && curTile === DUNGEON2_STAIRS_UP)   { ascendToSluice2();     return; }

    // ── Rainfish danger zone (Still Water quest) ─────────────────────────────
    // The bog pond's water-edge (rows 4-6, cols 3-7 on MAP3_N1) is where the
    // rainfish school nests. Entering this zone during the quest wakes them —
    // three unavoidable fights, very fast enemies, cannot flee.
    // Safe approach: stay on the main path (col 8) and cut west at row 3 only.
    if (activeMap === MAP3_N1 && sickle_quest_stage === 1 && !rainfish_woken &&
        tty >= 4 && tty <= 6 && ttx >= 3 && ttx <= 7) {
      rainfish_woken = true;
      syncQuestFlagsToWindow();
      startRainfishCombat(2);  // 2 remaining after this one = 3 total
      return;
    }

    // Random encounters: overworld grass, dungeon floors, and East Sluice floor
    if (player.step % 16 === 0 && combat.cooldown === 0) {
      const onEncounterTile = isEncounterEligibleTile(curTile);
      if (!debugMode && onEncounterTile && Math.random() < ENCOUNTER_CHANCE) startCombat();
    }
  }

  // World item pickup — collect if within 20 px of center (no items in town)
  const currentItems = currentItemList();
  for (const wi of currentItems) {
    if (wi.picked) continue;
    const ddx = player.x - wi.x;
    const ddy = player.y - wi.y;
    if (Math.sqrt(ddx * ddx + ddy * ddy) < 20) {
      if (wi.type === 'quest_item') {
        // Quest items control their own picked state and open narrative dialogue.
        if (wi.name === 'Fen Sickle') {
          if (sickle_quest_stage !== 1) {
            // Quest not active — player examines the sickle but doesn't take it.
            // wi.picked can't gate this (that would block ever picking it up
            // once the quest starts), so a separate one-shot flag stops this
            // from reopening every frame the player stands near it after
            // closing the dialogue.
            if (!wi.sickleExamined) {
              wi.sickleExamined = true;
              dialogue.name  = '';
              dialogue.pages = [
                ['\u2018A fen sickle, half-buried in the reeds at the water\u2019s edge.\u2019',
                 '\u2018The blade is old iron, still intact. The handle is weathered but solid.\u2019',
                 '\u2018Someone left it here. Probably not recently.\u2019'],
              ];
              dialogue.open  = true;
              dialogue.page  = 0;
            }
          } else if (!rainfish_woken) {
            // Player navigated correctly (avoided the bog edge) — rainfish undisturbed.
            wi.picked          = true;
            sickle_quest_stage = 2;
            syncQuestFlagsToWindow();
            dialogue.name  = '';
            dialogue.pages = [
              ['\u2018You drop low and approach the bank from above.\u2019',
               '\u2018Just below the surface, a cluster of silver shapes hovers motionless under the overhang. Rainfish. Still as iron.\u2019'],
              ['\u2018Your fingers close around the sickle handle.\u2019',
               '\u2018You ease backward from the water\u2019s edge without making a sound.\u2019',
               '\u2018The rainfish don\u2019t stir.\u2019'],
            ];
            dialogue.open  = true;
            dialogue.page  = 0;
          } else {
            // Rainfish already woken (player walked through the danger zone and fought them).
            wi.picked          = true;
            sickle_quest_stage = 3;
            syncQuestFlagsToWindow();
            dialogue.name  = '';
            dialogue.pages = [
              ['\u2018The sickle is still where it fell, jutting from the muddied reeds.\u2019',
               '\u2018The water is completely opaque. The rainfish have settled, but the silt won\u2019t clear until morning.\u2019'],
            ];
            dialogue.open  = true;
            dialogue.page  = 0;
          }
        }
      } else {
        wi.picked = true;
        if (wi.type === 'inscription') {
          // Show lore text as dialogue rather than adding to inventory
          dialogue.name  = '';
          dialogue.pages = wi.lore;
          dialogue.open  = true;
          dialogue.page  = 0;
        } else {
          stats.items.push({ name: wi.name, type: wi.type, bonus: wi.bonus, heals: wi.heals, price: wi.price });
        }
      }
    }
  }

  // MAP_FEATURES trigger zones (interactions.js) -- checked once per frame
  // (not gated by player.moving -- same as the item-pickup loop just
  // above, both run unconditionally once update() gets past its early-
  // return guards), and only if nothing above (encounter roll, item
  // pickup, an edge/point transition earlier in this function would
  // already have returned) has put the game into a state a trigger
  // shouldn't interrupt. checkMapFeatureTriggers() itself only fires on
  // the outside -> inside transition for a zone (not every frame spent
  // standing in one), but this guard additionally covers "don't compete
  // with something that just started this same frame" the same way
  // handleInteract()'s trailing tryMapFeatures() call does.
  if (!dialogue.open && !combat.active && !menu.open && !shop.open && !choice.open && !debugMenu.open && !warpMenu.open)
    checkMapFeatureTriggers();
}

