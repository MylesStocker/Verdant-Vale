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

  if (inBasinChamber)                      return 'No Recorded Location';
  if (inSunkenGallery)                     return 'Sunken Gallery';
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
  if (inTown && townBuilding === 'infirmary'        && currentTownId === 'drenwick') return 'Drenwick \u2014 Infirmary';
  if (inTown && townBuilding === 'provision_store'  && currentTownId === 'drenwick') return 'Drenwick \u2014 Provision Store';
  if (inTown && townBuilding === 'guild_hall'        && currentTownId === 'drenwick') return 'Drenwick \u2014 Guild Hall';
  if (inTown && townBuilding === 'post_office'       && currentTownId === 'drenwick') return 'Drenwick \u2014 Fenmark Post Co.';
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

// Returns the LOGICAL content-location key for the player's current position —
// used to filter SIMPLE_NPCS, match HOUSE_DOORS, and drive schedules. These are
// deliberately NOT canonical physical map ids (MAP_CATALOG keys): a shared
// physical grid stands in for many houses/apartments, so the keys here include
// 'house:<houseId>', per-apartment keys, and town-building/state distinctions
// ('west', 'drenwick_civic', …). See MAP_CATALOG (data.js) for physical map ids.
function currentContentLocationKey() {
  if (inLorraHouse)                  return 'lorra_house';
  if (inMarenPost)                   return 'maren_post';
  if (inDrenwrickPost)               return 'drenwick_post';
  if (inBridgePost)                  return 'bridge_post';
  if (inSmugglerFort)                return 'smuggler_fort';
  // Region-placed OUTDOOR maps consume the single OUTDOOR_CONTENT_KEYS authority
  // (data.js) — not a second per-map list here. Reached only in neutral outdoor
  // state (the special-interior flags above have already returned for their
  // maps), so this returns the map's logical key; MAP/MAP5/RODDON_WAY_MAP map to
  // the shared 'overworld' key (identical to the former fall-through).
  const _outdoorKey = (typeof outdoorContentKeyForMapId === 'function') ? outdoorContentKeyForMapId(mapIdForRef(activeMap)) : null;
  if (_outdoorKey) return _outdoorKey;
  if (inBasinChamber)                 return 'basin_chamber';
  if (inSunkenGallery)                return 'sunken_gallery';
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
  if (inTown && townBuilding === 'infirmary'       && currentTownId === 'drenwick') return 'drenwick_infirmary';
  if (inTown && townBuilding === 'provision_store' && currentTownId === 'drenwick') return 'drenwick_provision_store';
  if (inTown && townBuilding === 'guild_hall'      && currentTownId === 'drenwick') return 'drenwick_guild_hall';
  if (inTown && townBuilding === 'post_office'     && currentTownId === 'drenwick') return 'drenwick_post_office';
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

// Deprecated alias for the former name. Its return values were never physical
// map ids (see currentContentLocationKey's header); the rename removed that
// confusion. Kept so external/console tooling that still calls currentContentLocationKey()
// keeps working — new code should call currentContentLocationKey().
function currentMapId() { return currentContentLocationKey(); }

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

// The collision footprint: a square hitbox of radius COLLISION_RADIUS px centered
// on a point. footprintCorners() returns its four corner points so the exact
// radius/corner contract is defined in ONE place — canWalk() (below) and the
// continuous-seam world-aware collision (continuous-seams.js) both use it, rather
// than each hardcoding `r = 9` and four corner offsets.
const COLLISION_RADIUS = 9;
function footprintCorners(cx, cy) {
  const r = COLLISION_RADIUS;
  return [[cx - r, cy - r], [cx + r, cy - r], [cx - r, cy + r], [cx + r, cy + r]];
}

// Square hitbox of radius COLLISION_RADIUS px centered on (cx, cy).
// Reads walkability through isTileWalkable() (tiles.js) rather than
// WALKABLE[] directly -- isTileWalkable() still just wraps WALKABLE[]
// (see its comment), so this is purely an indirection, not a behavior
// change: same four-corner check, same array, same result for every tile.
function canWalk(cx, cy) {
  for (const [px, py] of footprintCorners(cx, cy)) {
    if (!isTileWalkable(tileAt(px, py))) return false;
  }
  // Custom-code solid objects (not in SIMPLE_NPCS)
  if (inSluice) {
    if (sluiceFloor === 1 && !SLUICE_CHEST.opened && Math.abs(cx - SLUICE_CHEST.x) < 18 && Math.abs(cy - SLUICE_CHEST.y) < 18) return false;
    if (sluiceFloor === 2 && !SLUICE_LEVEL2_CHEST.opened && Math.abs(cx - SLUICE_LEVEL2_CHEST.x) < 18 && Math.abs(cy - SLUICE_LEVEL2_CHEST.y) < 18) return false;
    if (sluiceFloor === 2 && !SLUICE_SECRET_CHEST.opened && Math.abs(cx - SLUICE_SECRET_CHEST.x) < 18 && Math.abs(cy - SLUICE_SECRET_CHEST.y) < 18) return false;
    if (sluiceFloor === 3 && !SLUICE_LEVEL3_CHEST.opened && Math.abs(cx - SLUICE_LEVEL3_CHEST.x) < 18 && Math.abs(cy - SLUICE_LEVEL3_CHEST.y) < 18) return false;
    if (sluiceFloor === 3 && !SLUICE_DEEP_CHEST.opened && Math.abs(cx - SLUICE_DEEP_CHEST.x) < 18 && Math.abs(cy - SLUICE_DEEP_CHEST.y) < 18) return false;
  } else if (inTakomo) {
    if (!TAKOMO.defeated && Math.abs(cx - TAKOMO.x) < 18 && Math.abs(cy - TAKOMO.y) < 18) return false;
  } else if (inDungeon && dungeonFloor === 1) {
    if (!DUNGEON_CHEST.opened && Math.abs(cx - DUNGEON_CHEST.x) < 18 && Math.abs(cy - DUNGEON_CHEST.y) < 18) return false;
    if (!DUNGEON_ALCOVE_CHEST.opened && Math.abs(cx - DUNGEON_ALCOVE_CHEST.x) < 18 && Math.abs(cy - DUNGEON_ALCOVE_CHEST.y) < 18) return false;
  } else if (!inDungeon && !inTown && activeMap === MEADOW_MAP) {
    // Hidden meadow — the Warden's body (quest active) and the chest are solid
    if (warden_quest_started && !warden_quest_defeated && Math.abs(cx - BRIAR_WARDEN_SPAWN.x) < 18 && Math.abs(cy - BRIAR_WARDEN_SPAWN.y) < 18) return false;
    if (!MEADOW_CHEST.opened && Math.abs(cx - MEADOW_CHEST.x) < 18 && Math.abs(cy - MEADOW_CHEST.y) < 18) return false;
  } else if (inSunkenGallery) {
    // The Bullet Time chest is solid until opened (grid room R2C4 only).
    if (activeMap === SUNKEN_GALLERY_R2C4 && !SUNKEN_GALLERY_CHEST.opened && Math.abs(cx - SUNKEN_GALLERY_CHEST.x) < 18 && Math.abs(cy - SUNKEN_GALLERY_CHEST.y) < 18) return false;
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
      if (Math.abs(cx - CORVIN_CABINET.x) < 18 && Math.abs(cy - CORVIN_CABINET.y) < 18) return false;
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
  const mapId = currentContentLocationKey();
  for (const npc of SIMPLE_NPCS) {
    if (npc.map !== mapId || !npc.solid) continue;
    if (typeof npcExplicitOwnershipMismatchesActive === 'function' && npcExplicitOwnershipMismatchesActive(npc)) continue; // explicit owner != active chunk
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
  if (activeMap === MEADOW_MAP) return false; // hidden meadow — deliberately encounter-free (the Warden is its only danger)
  if (inBridgePost) return false; // Imperial toll checkpoint — manned, encounter-free (its GRASS banks previously fell through to the generic outdoor roll, contradicting the map's allowRandomEncounters: false metadata; dying here also used to strand inBridgePost through the defeat respawn)
  if (inBasinChamber) return false; // the unmarked chamber — deliberately encounter-free (redundant with CHAMBER_FLOOR's encounterEligible: false, kept as a visible guarantee per the entrance-area rule)
  // The Upper Reach's drought-exposed bed now rolls encounters, but only its
  // BASIN_MUD, and only HERE — the same tile stays safe on the other basin maps
  // (Centre, Silt Flats, West Shore). Its pool is UPPER_REACH_ENEMY_TEMPLATES
  // (MAP_METADATA.encounterPool). The stonework apron / residual pools stay quiet.
  if (activeMap === NORTH_BASIN_NW_MAP) return tile === BASIN_MUD;
  // (inSunkenGallery deliberately has NO branch here: it falls through to the
  // TILE_PROPERTIES check below, where GALLERY_FLOOR is encounter-eligible —
  // the pool comes from MAP_METADATA.encounterPool, see combat.js.)
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
  if (inSluice)    return tile === SLUICE_FLOOR || tile === SLUICE_BLOOD_FLOOR || tile === SLUICE_JOURNAL_FLOOR;
  if (inMireVault) return tile === DUNGEON2_FLOOR;
  return false;
}

// True while the player is inside the Deep Works sealed room map
// (SLUICE_SECRET_MAP, reached through the L3 r7 c12-c13 false walls).
// Used by the encounter roll below (rate: SLUICE_SECRET_ENCOUNTER_CHANCE
// instead of ENCOUNTER_CHANCE) and by combat.js's currentEncounterPool()
// (pool: SLUICE_SECRET_ENEMY_TEMPLATES instead of SLUICE_ENEMY_TEMPLATES).
function inSluiceSealedRoom() {
  return inSluice && activeMap === SLUICE_SECRET_MAP;
}
window.inSluiceSealedRoom = inSluiceSealedRoom;

// ─── Update ───────────────────────────────────────────────────────────────────
const SPEED = 2; // pixels per frame

function update() {
  // Cooldown ticks every frame regardless of game state
  if (combat.cooldown > 0) combat.cooldown--;
  if (worldToastTimer > 0) worldToastTimer--;

  // "Visited today" markers for the Upper Reach / Sunken Gallery physical
  // evidence (Rhen's mud observation, Kest's channel-bottom smell -- both
  // in npcs.js). Written every frame the player is physically present,
  // unconditional of dialogue/menu state, so any arrival method (edge
  // crossing, the stairs, a debug warp) is covered. Deliberately a day
  // NUMBER compared with `===`, not a boolean flag: resting always
  // increments `day` (interactions.js's rest() functions, combat.js's
  // defeat handler), so the comparison expires on its own the moment a day
  // passes -- no separate reset needed for that case. Session-only
  // (window-native, not in QUEST_FLAG_SCHEMA) and explicitly cleared in
  // loadGame() (save.js) so a same-day load from an older save can't leak
  // this session's "visited today" state into a timeline where the visit
  // never happened.
  if (activeMap === NORTH_BASIN_NW_MAP) window.upper_reach_visit_day = day;
  if (inSunkenGallery)                  window.sunken_gallery_visit_day = day;

  // Combat is active — only tick the flash / fire-cast timers, freeze everything else
  if (combat.active) {
    if (combat.flashTimer > 0) combat.flashTimer--;
    if (combat.fireCastTimer > 0) combat.fireCastTimer--;
    return;
  }

  if (dialogue.open || menu.open || choice.open || shop.open || debugMenu.open || warpMenu.open) return;

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

    // DEBUG continuous-view CONTINUOUS SEAMS: whenever this frame's collision
    // footprint (current OR candidate) touches an eligible reciprocal ALIGNS seam
    // while Continuous View is on, walk in world space across the seam instead of
    // the legacy inset edge transition. Ordinary walking (NO early return) — it
    // falls through to the normal step/status/point-transition/encounter/NPC
    // housekeeping below. It engages ONLY when the footprint actually reaches an
    // eligible seam (continuousSeamEngaged() is false otherwise — no fixed
    // corridor), so every non-eligible edge/point transition, every other map,
    // and the flag-off case use the legacy path unchanged.
    const seamEngaged = (typeof continuousSeamEngaged === 'function') && continuousSeamEngaged(dx, dy);

    if (seamEngaged) {
      continuousSeamMove(dx, dy);   // world-aware X-then-Y; each axis once; atomic handoff on standing-point crossing
      // fall through to normal walking housekeeping — do NOT return
    } else {
      // Legacy movement. While Continuous View is on, the legacy inset edge
      // transition is SUPPRESSED for an eligible in-range continuous seam
      // (continuousSeamSuppressLegacyEdge) so the player walks up to the seam via
      // canWalk() and the seamless path engages on footprint contact — no inset,
      // no engagement corridor. Every non-eligible edge (and the flag-off case)
      // keeps its exact legacy transition.
      let edgeTransitioned = false;
      const _sup = (dir) => (typeof continuousSeamSuppressLegacyEdge === 'function') && continuousSeamSuppressLegacyEdge(dir);

      if      (dx < 0 && curCol <= 0 && !_sup('west'))       edgeTransitioned = tryEdgeTransition('west');
      else if (dx > 0 && curCol >= COLS - 1 && !_sup('east')) edgeTransitioned = tryEdgeTransition('east');
      else if (canWalk(player.x + dx, player.y))              player.x += dx;

      if (!edgeTransitioned) {
        if      (dy < 0 && curRow <= 0 && !_sup('north'))      edgeTransitioned = tryEdgeTransition('north');
        else if (dy > 0 && curRow >= ROWS - 1 && !_sup('south')) edgeTransitioned = tryEdgeTransition('south');
        else if (canWalk(player.x, player.y + dy))             player.y += dy;
      }

      if (edgeTransitioned) return; // activeMap/player position fully replaced; skip the rest of this frame, same as any other map transition
    }

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
    // MAP3 <-> MAP3_N1 (Northern Fen) is now a structural EDGE_TRANSITIONS seam
    // (the single col-8 PATH, sourceRange [8,8]) — seamless under Continuous View,
    // discrete via tryEdgeTransition() above with View off. The former FEN_N_EXIT/
    // FEN_N_ENTRANCE point tiles + enterMap3N1()/exitMap3N1() were retired.
    // MAP3_N1 <-> MAP3_N2 (Drenwick) is likewise an open EDGE_TRANSITIONS crossing
    // (fen row 3-13, road at col 8), not a single FEN_N2_EXIT/ENTRANCE tile —
    // handled by tryEdgeTransition() above. (enterMap3N2()/exitMap3N2() in
    // world-transitions.js are now unused, like the retired point-tiles.)
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP3_N2 && curTile === NORTH_BASIN_EXIT) { enterNorthBasinS(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === NORTH_BASIN_S_MAP && curTile === NORTH_BASIN_ENTRANCE) { exitNorthBasinS(); return; }
    // South approach <-> Reservoir (north/south) and south approach <->
    // Silt Flats (east/west) used to be point-tile checks here; both are
    // now handled generically by the edge-transition interception in the
    // movement block above (see EDGE_TRANSITIONS in world-transitions.js).
    if (!inDungeon && !inTown && !inSluice && activeMap === NORTH_BASIN_SW_MAP && curTile === NORTH_BASIN_W_EXIT) { enterNorthBasinW(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === NORTH_BASIN_W_MAP && curTile === NORTH_BASIN_W_ENTRANCE) { exitNorthBasinW(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MAP && curTile === MEADOW_HIDDEN_ENTRANCE) { enterMeadow(); return; }
    if (!inDungeon && !inTown && !inSluice && activeMap === MEADOW_MAP && curTile === MEADOW_EXIT) { exitMeadow(); return; }
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
    // Drenwick school inter-floor stairs stay in town (inTown + Drenwick + the
    // 'school' building carried forward); go through the canonical helper.
    const _schoolState = { inTown: true, currentTownId: 'drenwick', townBuilding: townBuilding };
    if (inTown && currentTownId === 'drenwick' && activeMap === DRENWICK_SCHOOL_GROUND_MAP && curTile === DUNGEON_STAIRS_DOWN) {
      // West stairs only (col 2) — descend to basement
      transitionToLocation({ mapId: 'DRENWICK_SCHOOL_BASEMENT_MAP', x: 2.5 * TILE, y: 3.5 * TILE, facing: 'down', state: _schoolState });
      return;
    }
    if (inTown && currentTownId === 'drenwick' && activeMap === DRENWICK_SCHOOL_GROUND_MAP && curTile === DUNGEON2_STAIRS_UP) {
      // East stairs (col 13) — ascend to upper floor
      transitionToLocation({ mapId: 'DRENWICK_SCHOOL_UPPER_MAP', x: 13.5 * TILE, y: 3.5 * TILE, facing: 'up', state: _schoolState });
      return;
    }
    if (inTown && currentTownId === 'drenwick' && activeMap === DRENWICK_SCHOOL_UPPER_MAP && curTile === DUNGEON_STAIRS_DOWN) {
      // Uses the "stairs down" tile (not stairs-up) since these stairs
      // descend to the ground floor from here -- see maps.js.
      transitionToLocation({ mapId: 'DRENWICK_SCHOOL_GROUND_MAP', x: 13.5 * TILE, y: 3.5 * TILE, facing: 'down', state: _schoolState });
      return;
    }
    if (inTown && currentTownId === 'drenwick' && activeMap === DRENWICK_SCHOOL_BASEMENT_MAP && curTile === DUNGEON2_STAIRS_UP) {
      transitionToLocation({ mapId: 'DRENWICK_SCHOOL_GROUND_MAP', x: 2.5 * TILE, y: 3.5 * TILE, facing: 'down', state: _schoolState });
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
        // Infirmary — door-tap service, no interior map. Heals HP for a fee of
        // one gold per point (does not advance the day, unlike resting).
        const missing = stats.maxHp - stats.hp;
        if (missing <= 0) {
          dialogue.name  = 'Infirmary';
          dialogue.pages = [
            ['\u201cWe mend by the coin here, a point a coin.\u201d',
             '\u201cBut you\u2019re sound enough \u2014 nothing here to mend today.\u201d'],
          ];
          dialogue.open = true;
          dialogue.page = 0;
          return;
        }
        dialogue.name  = 'Infirmary';
        dialogue.pages = [
          ['\u201cWe will see to you, for the usual fee.\u201d',
           '\u201cWe charge by the mending \u2014 one coin a point. The serious cases want a proper ward; we do what we can here.\u201d'],
        ];
        dialogue.callbacks = [function() {
          const pay = Math.min(stats.maxHp - stats.hp, stats.gold);
          if (pay <= 0) {
            dialogue.name  = 'Infirmary';
            dialogue.pages = [['\u201cCome back with a coin or two and we\u2019ll set you right.\u201d']];
            dialogue.open  = true;
            dialogue.page  = 0;
            return;
          }
          choice.title    = 'Infirmary';
          choice.options   = ['Be treated  (' + pay + 'g)', 'Leave'];
          choice.cursor    = 0;
          choice.callbacks = [
            function treat() {
              const need    = stats.maxHp - stats.hp;
              const restore = Math.min(need, stats.gold);
              stats.gold -= restore;
              stats.hp   += restore;
              dialogue.name  = 'Infirmary';
              dialogue.pages = restore >= need
                ? [['They clean and bind what needs it.', 'HP restored. Paid ' + restore + ' gold.']]
                : [['They patch you as far as your coin runs.', 'Restored ' + restore + ' HP. Paid ' + restore + ' gold.']];
              dialogue.open  = true;
              dialogue.page  = 0;
            },
            function leave() {},
          ];
          choice.open = true;
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return;
      }
    }
    if (inTown && !townBuilding && curTile === INN_DOOR)        { enterBuilding('inn');    return; }
    // Market: Guild Hall door (col 5 row 2) and Fenmark Post Company office (col 14 row 10)
    if (inTown && !townBuilding && currentTownId === 'drenwick' && activeMap === DRENWICK_MARKET_MAP && curTile === OFFICE_DOOR) {
      if (ttx === 5  && tty === 2)  { enterBuilding('guild_hall'); return; }
      if (ttx === 14 && tty === 10) { enterBuilding('post_office'); return; }
      return; // unknown market door — consume event without crashing
    }
    // Canal/Docks: three OFFICE_DOOR tiles routing to different buildings by position
    if (inTown && !townBuilding && currentTownId === 'drenwick' && activeMap === DRENWICK_CANAL_DOCKS_MAP && curTile === OFFICE_DOOR) {
      if      (ttx === 2  && tty === 6) { enterBuilding('harbormaster');    return; }  // Harbormaster col 2
      else if (ttx === 7  && tty === 6) { enterBuilding('wash_house');      return; }  // Wash House    col 7
      else if (ttx === 11 && tty === 6) {                                              // Provision St. col 11
        if (isClosedToday('provision_store')) {
          dialogue.name  = 'Store Door';
          dialogue.pages = [['Closed for dayoff.', 'Please come back tomorrow.']];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else {
          enterBuilding('provision_store');
        }
        return;
      }
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
      const door = HOUSE_DOORS.find(d => d.map === currentContentLocationKey() && d.col === ttx && d.row === tty);
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
    if (inSluice && sluiceFloor === 3 && curTile === SLUICE_SECRET_ENTRANCE) { enterSluiceSecret(); return; }
    if (inSluice && sluiceFloor === 4 && curTile === SLUICE_SECRET_EXIT)   { exitSluiceSecret();    return; }

    // ── The Upper Reach: the unmarked chamber + the Sunken Gallery ──────────
    // All four tiles are unique to their maps, but the activeMap/flag guards
    // keep the pattern identical to every other point transition above.
    if (activeMap === NORTH_BASIN_NW_MAP && curTile === CHAMBER_DOOR) { enterBasinChamber();    return; }
    if (inBasinChamber  && curTile === CHAMBER_EXIT)                  { exitBasinChamber();     return; }
    if (activeMap === NORTH_BASIN_NW_MAP && curTile === SUNKEN_STAIR) { descendSunkenGallery(); return; }
    if (inSunkenGallery && curTile === GALLERY_STAIR_UP)              { ascendSunkenGallery();  return; }

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

    // Random encounters: overworld grass, dungeon floors, and East Sluice floor.
    // The roll stays at this single update() choke point, at the same step cadence.
    // encounterGeographyOk() is the geographic authority gate: on a placed regional
    // outdoor map the pool is owned by the physical chunk under the player's standing
    // point and must agree with the active-map handoff, else FAIL CLOSED (no
    // encounter); nonregional maps (dungeon/sluice/…) return true and roll as before.
    // It consumes no randomness, so the Math.random() cadence is unchanged.
    if (player.step % 16 === 0 && combat.cooldown === 0) {
      const onEncounterTile = isEncounterEligibleTile(curTile);
      const geoOk = (typeof encounterGeographyOk === 'function') ? encounterGeographyOk() : true;
      const encounterChance = inSluiceSealedRoom() ? SLUICE_SECRET_ENCOUNTER_CHANCE
                            : inSluice              ? SLUICE_ENCOUNTER_CHANCE
                            :                         ENCOUNTER_CHANCE;
      if (!debugMode && onEncounterTile && geoOk && Math.random() < encounterChance) startCombat();
    }
  }

  // World item pickup — collect if within 20 px of center (no items in town).
  // The active map keeps deterministic priority: its own list is swept first,
  // then (Continuous View only) any eligible-seam neighbour's items in reach.
  const currentItems = currentItemList();
  for (const wi of currentItems) collectWorldItemNear(wi, player.x, player.y, { crossSeam: false });
  if (typeof crossSeamStaticPickup === 'function') crossSeamStaticPickup();

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

  // NPC movement runtime (Phase 1 pilots: the two bridge toll guards run
  // one-way scriptedRoutes; Tobb Wend runs an auto-starting looping patrol in
  // the fen brewery; Tomas runs a bounded random wander in Esla's house).
  // Placed at the very tail of update() so every existing freeze is inherited
  // for free: the combat/dialogue/menu/choice/shop early-returns above already
  // bailed out, and any map transition this frame `return`ed before reaching
  // here. The same started-this-frame guard as checkMapFeatureTriggers() keeps
  // NPCs from stepping during a dialogue that opened this frame.
  // ensureAutoMovers() runs first so an auto-mover that just became present
  // (map entry, load) begins the same frame, and one that just left is
  // suspended cleanly.
  if (!dialogue.open && !combat.active && !menu.open && !shop.open && !choice.open && !debugMenu.open && !warpMenu.open) {
    ensureAutoMovers();
    updateNpcRoutes();
  }
}

// Collect a single world item when the given position (in the ITEM's own local
// pixel frame) is within the 20 px pickup radius of its center. `atX,atY` is the
// player's position for the ACTIVE map (player.x/player.y); for a cross-seam
// neighbour it is the player expressed in that neighbour's local frame, so the
// radius test measures the true world distance either way. Extracted verbatim
// from update()'s former inline loop; the only addition is the crossSeam gate,
// which fails contextual quest_item pickups closed (they depend on active-map-
// only state — sickle_quest_stage / rainfish_woken — and are never granted
// across a seam). All mutations are canonical (mark picked / grant / open
// dialogue) on the item's own shared object.
function collectWorldItemNear(wi, atX, atY, opts) {
  if (wi.picked) return;
  const ddx = atX - wi.x;
  const ddy = atY - wi.y;
  if (Math.sqrt(ddx * ddx + ddy * ddy) >= 20) return;
  const crossSeam = !!(opts && opts.crossSeam);
  // Cross-seam pickups are fail-closed by explicit item CAPABILITY: only ordinary
  // registry-backed grant items cross a seam. quest_item (contextual), inscription
  // (active-map-only), and any unknown/special type stay active-map-only. The
  // active-map path is unaffected.
  if (crossSeam && !(typeof crossSeamCollectibleItem === 'function' && crossSeamCollectibleItem(wi))) return;
  if (wi.type === 'quest_item') {
    // Quest items control their own picked state and open narrative dialogue.
    if (wi.name === 'Fen Sickle') {
      // The sickle is not present on the map until the recovery quest is
      // accepted (sickle_quest_stage 1); before that there is nothing to
      // find or examine here. Rendering is gated the same way (drawWorldItems).
      if (sickle_quest_stage < 1) return;
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
          grantItem(wi.name);
        }
      }
}

// ─── Opt-in NPC movement runtime (Phase 1) ───────────────────────────────────
// Minimal runtime for the authored `movement` contract (architecture.md). Two
// route kinds, no wandering and no pathfinding:
//   • scriptedRoute — a one-way authored waypoint walk, played once when
//     explicitly started via startNpcRoute(id). The two Imperial bridge guards
//     use this (started by paying the toll).
//   • patrol — a looping authored waypoint route with a per-waypoint dwell.
//     When `autoStart: true` it initialises by itself whenever the NPC is
//     present on the active map (ensureAutoPatrols()) and suspends cleanly when
//     it leaves. Tobb Wend is the only patrol pilot this phase.
//
// Runtime motion state lives here (NPC_ROUTES, keyed by stable NPC id) and is
// never persisted: saves never contain incidental coordinates. loadGame()
// re-derives guard placement from bridge_toll_paid and resets patrol NPCs to
// their authored home (see save.js); auto-patrols then re-start themselves on
// the next frame if their map is active. The moving NPC's live position is
// written to npc.x/npc.y because collision (canWalk()), rendering
// (drawSimpleNPCs()) and interaction (TALK_RADIUS) all read those fields — the
// explicit reset helpers below restore the authored anchors so mutated
// positions never leak between visits.
const NPC_ROUTES = {};
window.NPC_ROUTES = NPC_ROUTES;

// Authored home anchors for the auto-managed movement types (patrol,
// boundedWander) — DERIVED once at load from each NPC's own authored
// `x`/`y`/`facing`, not a hand-maintained table. npcs.js loads before
// movement.js, so `SIMPLE_NPCS` positions here are the pristine authored
// values (before any runtime motion mutates them). Reset targets on
// suspend/load so an auto-mover always re-enters its map at its authored
// position, never wherever the last frame left it. (The bridge guards use
// scriptedRoute and their own BRIDGE_GUARD_POSTS, so they are excluded here —
// their reset restores blocking-vs-aside posts, which a plain home can't.)
const MOVEMENT_HOMES = {};
for (const _mvNpc of SIMPLE_NPCS) {
  const _mv = _mvNpc.movement;
  if (_mv && (_mv.type === 'patrol' || _mv.type === 'boundedWander' || _mv.type === 'flee')) {
    MOVEMENT_HOMES[_mvNpc.id] = { x: _mvNpc.x, y: _mvNpc.y, facing: _mvNpc.facing };
  }
}

// Suspend one auto-mover cleanly: drop its runtime route and return it to its
// authored home. Safe to call on any map (it only mutates that NPC's own
// fields, which don't render off its map).
function resetMovementNpc(id) {
  delete NPC_ROUTES[id];
  const home = MOVEMENT_HOMES[id];
  const npc = SIMPLE_NPCS.find(n => n.id === id);
  if (npc && home) { npc.x = home.x; npc.y = home.y; npc.facing = home.facing; }
}

// Reset every auto-managed mover (patrol + boundedWander) to its authored home
// (used by loadGame(), the defeat/respawn handler, and map-exit hooks,
// mirroring resetBridgeGuards()).
function resetAllMovers() {
  for (const id in MOVEMENT_HOMES) resetMovementNpc(id);
}
// Back-compat aliases (older call sites / tests referred to the patrol-only
// names; the behaviour is now the generic all-movers reset).
const resetPatrolNpc = resetMovementNpc;
const resetAllPatrols = resetAllMovers;
window.resetMovementNpc = resetMovementNpc;
window.resetAllMovers   = resetAllMovers;
window.resetPatrolNpc   = resetMovementNpc;
window.resetAllPatrols  = resetAllMovers;

// Per-frame lifecycle for the auto-managed movers: start one that is present on
// the active map and has no route yet, and suspend one whose route outlived its
// map (a defence-in-depth mirror of the map-local filters in
// updateNpcRoutes()/drawSimpleNPCs() — the shared invariant, not an
// NPC-specific hide condition). A `patrol` auto-starts only with
// `autoStart: true`; a `boundedWander` is always auto-managed (it has no
// explicit start). Called from update()'s tail under the same freeze guard as
// updateNpcRoutes().
function ensureAutoMovers() {
  for (const npc of SIMPLE_NPCS) {
    const mv = npc.movement;
    if (!mv) continue;
    const auto = mv.type === 'boundedWander' || mv.type === 'flee' || (mv.type === 'patrol' && mv.autoStart === true);
    if (!auto) continue;
    // Chunk-aware for regional NPCs (nearby 3×3 simulation set under Continuous
    // View); exact legacy active-content-key gate for nonregional NPCs and legacy
    // mode. A regional NPC in the set keeps its route across the player's active-
    // map handoff (its chunk stays in the set); once its chunk leaves the set it
    // suspends/resets via the established home contract, and restarts from home
    // when simulated again. See npcShouldSimulate() (regional-npc-runtime.js).
    const simulate = (typeof npcShouldSimulate === 'function')
      ? npcShouldSimulate(npc)
      : (npc.map === currentContentLocationKey());
    if (simulate) {
      if (!NPC_ROUTES[npc.id]) startNpcRoute(npc.id);
    } else if (NPC_ROUTES[npc.id]) {
      resetMovementNpc(npc.id);
    }
  }
}
const ensureAutoPatrols = ensureAutoMovers; // back-compat alias
window.ensureAutoMovers  = ensureAutoMovers;
window.ensureAutoPatrols = ensureAutoMovers;

// Interaction hook for a moving/patrolling NPC: freeze it at its LIVE position,
// turn it to face the player (Lélý), and open its ordinary dialogue. The route
// is preserved, not restarted — updateNpcRoutes()'s frozen branch thaws it a
// beat after the dialogue closes and it resumes toward the same target
// waypoint. Because update() early-returns while dialogue is open, the freeze
// needs no per-frame upkeep; this only sets the resume behaviour and facing.
// Interaction, collision and the SPACE hint all already read npc.x/npc.y, so
// they follow the live position with no ghost at the authored start.
function patrolNpcTalk(npc) {
  const rt = (typeof NPC_ROUTES !== 'undefined') ? NPC_ROUTES[npc.id] : null;
  const dx = player.x - npc.x, dy = player.y - npc.y;
  npc.facing = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left')
                                            : (dy >= 0 ? 'down'  : 'up');
  if (rt) { rt.frozen = true; rt.facing = npc.facing; rt.resumeDelay = 30; }
  dialogue.name  = npc.name;
  dialogue.pages = npc.dialogue;
  dialogue.open  = true;
  dialogue.page  = 0;
}
window.patrolNpcTalk = patrolNpcTalk;

// NPC-aware walkability for a route step. NOT canWalk(): that function embeds
// player-specific custom solids and would detect the moving NPC's own solid
// body as a collision with itself. Same sources of truth, though — tile
// walkability via isTileWalkable()/tileAt() (the exact corner check canWalk
// uses), transition tiles banned via TILE_PROPERTIES.isTransition, the
// player's body and every OTHER solid NPC at canWalk()'s own 18px AABB, plus
// the current map's custom-code fixed solids (house furniture — see
// npcRouteCustomSolidBlocks()). The bridge checkpoint and the brewery have no
// such fixed solids; a house wanderer (Tomas) does, so those are honoured too.
function npcRouteCanOccupy(npc, nx, ny) {
  // Regional NPC in the nearby simulation set: resolve occupancy against its OWN
  // physical map in regional world pixels (terrain, transition tiles, owner-chunk
  // confinement, the player, and other solid regional NPC poses) — never activeMap
  // or the player's local frame. Nonregional NPCs keep the legacy active-map path.
  if (typeof regionalNpcInSimulationScope === 'function' && regionalNpcInSimulationScope(npc)
      && typeof regionalNpcRouteCanOccupy === 'function') {
    return regionalNpcRouteCanOccupy(npc, nx, ny);
  }
  const r = 9; // same hitbox radius as the player's canWalk()
  const corners = [[nx - r, ny - r], [nx + r, ny - r], [nx - r, ny + r], [nx + r, ny + r]];
  for (const [px, py] of corners) {
    const t = tileAt(px, py);
    if (!isTileWalkable(t)) return false;
    const props = (typeof TILE_PROPERTIES !== 'undefined') ? TILE_PROPERTIES[t] : null;
    if (props && props.isTransition) return false; // never enter exits/doorways
  }
  if (Math.abs(nx - player.x) < 18 && Math.abs(ny - player.y) < 18) return false; // never push/trap the player
  const mapId = currentContentLocationKey();
  for (const other of SIMPLE_NPCS) {
    if (other === npc || other.map !== mapId || !other.solid) continue;
    if (typeof npcExplicitOwnershipMismatchesActive === 'function' && npcExplicitOwnershipMismatchesActive(other)) continue; // explicit owner != active chunk
    if (Math.abs(nx - other.x) < 18 && Math.abs(ny - other.y) < 18) return false;
  }
  if (npcRouteCustomSolidBlocks(nx, ny)) return false;
  return true;
}

// Custom-code fixed solids for the current map, mirroring canWalk()'s location
// ladder — the ones a route NPC can actually encounter. House furniture blocks
// via HOUSE_DATA (tables/hearth/bed/stove/cat/chest/dresser), not via tiles, so
// a house wanderer must reject those the exact same way (and at the same AABB
// radii) the player's canWalk() does. Add other maps' fixed solids here if a
// future route NPC lives among them.
function npcRouteCustomSolidBlocks(nx, ny) {
  if (inTown && townBuilding === 'house') {
    const hd = (typeof HOUSE_DATA !== 'undefined') ? HOUSE_DATA[currentHouseId] : null;
    if (hd) {
      if (hd.tables) for (const t of hd.tables) if (Math.abs(nx - t.x) < 18 && Math.abs(ny - t.y) < 18) return true;
      if (hd.hearth  && Math.abs(nx - hd.hearth.x)  < 18 && Math.abs(ny - hd.hearth.y)  < 18) return true;
      if (hd.bed     && Math.abs(nx - hd.bed.x)     < 18 && Math.abs(ny - hd.bed.y)     < 18) return true;
      if (hd.stove   && Math.abs(nx - hd.stove.x)   < 16 && Math.abs(ny - hd.stove.y)   < 16) return true;
      if (hd.cat     && Math.abs(nx - hd.cat.x)     < 12 && Math.abs(ny - hd.cat.y)     < 12) return true;
      if (hd.chest   && Math.abs(nx - hd.chest.x)   < 14 && Math.abs(ny - hd.chest.y)   < 14) return true;
      if (hd.dresser && Math.abs(nx - hd.dresser.x) < 15 && Math.abs(ny - hd.dresser.y) < 16) return true;
    }
  }
  return false;
}

// A random pause length (frames) for a boundedWander decision, rolled ONCE per
// pause — never per frame.
function wanderPauseFrames(rt) {
  const lo = rt.minPauseFrames, hi = rt.maxPauseFrames;
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

// Choose the next one-tile orthogonal step for a boundedWander NPC, rolling
// randomness ONCE (a shuffled direction order). Returns a px target that stays
// inside the authored tile bounds AND passes live occupancy (npcRouteCanOccupy
// — walkable tile, no transition, no furniture, not the player, not another
// solid NPC), or null if no legal move exists (then the NPC waits and re-rolls
// after another pause). Bounds are authored intent; occupancy is authority.
function chooseWanderTarget(rt, npc) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = dirs.length - 1; i > 0; i--) {   // Fisher-Yates, one roll set per decision
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = dirs[i]; dirs[i] = dirs[j]; dirs[j] = tmp;
  }
  const b = rt.bounds;
  for (const [dc, dr] of dirs) {
    const nx = npc.x + dc * TILE, ny = npc.y + dr * TILE;
    const col = Math.floor(nx / TILE), row = Math.floor(ny / TILE);
    if (col < b.minCol || col > b.maxCol || row < b.minRow || row > b.maxRow) continue; // out of authored bounds
    if (!npcRouteCanOccupy(npc, nx, ny)) continue;                                       // live collision authority
    return { x: nx, y: ny };
  }
  return null;
}

// Choose the next one-tile step for a `flee` NPC (the black feral cat): the
// in-bounds, occupiable orthogonal neighbour that puts the MOST distance between
// the NPC and the player. Returns null when no legal neighbour actually
// increases that distance — i.e. the NPC is cornered — so it holds still and the
// player can finally reach it. npcRouteCanOccupy already forbids any tile within
// 18px of the player, so a flee step can never close on or trap the player.
function chooseFleeTarget(rt, npc) {
  const b = rt.bounds;
  const curDist = Math.hypot(npc.x - player.x, npc.y - player.y);
  let best = null, bestDist = curDist;
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = npc.x + dc * TILE, ny = npc.y + dr * TILE;
    const col = Math.floor(nx / TILE), row = Math.floor(ny / TILE);
    if (col < b.minCol || col > b.maxCol || row < b.minRow || row > b.maxRow) continue;
    if (!npcRouteCanOccupy(npc, nx, ny)) continue;
    const d = Math.hypot(nx - player.x, ny - player.y);
    if (d > bestDist) { bestDist = d; best = { x: nx, y: ny }; }
  }
  return best; // null unless some legal neighbour is strictly farther from the player
}

// Starts an authored route (scriptedRoute, patrol, or boundedWander) for the
// given NPC id. Returns true if the route was started. No-ops (returns false)
// when: the NPC has no route movement config, the route is already running, or
// a non-looping route has already completed — a completed one-way route stays
// completed and never restarts automatically; only an explicit reset
// (resetBridgeGuards() / resetMovementNpc()) clears it. A patrol loops and a
// boundedWander never terminates, so neither is ever `done`.
function startNpcRoute(id) {
  const npc = SIMPLE_NPCS.find(n => n.id === id);
  if (!npc || !npc.movement) return false;
  const mv = npc.movement;
  const existing = NPC_ROUTES[id];
  if (existing && (existing.moving || existing.done)) return false;

  if (mv.type === 'boundedWander') {
    // Intermittent domestic wander inside an authored tile region. Home is
    // derived (MOVEMENT_HOMES); no waypoints. Starts on a random pause so he
    // waits before his first short walk.
    const rt = {
      npc,
      type: 'boundedWander',
      bounds: mv.bounds,
      speed: mv.speed,
      minPauseFrames: mv.minPauseFrames, maxPauseFrames: mv.maxPauseFrames,
      target: null, pauseLeft: 0, step: 0,
      moving: true, done: false, frozen: false, resumeDelay: 0,
      facing: npc.facing,
    };
    rt.pauseLeft = wanderPauseFrames(rt);
    NPC_ROUTES[id] = rt;
    return true;
  }

  if (mv.type === 'flee') {
    // Skittish: keeps its distance from the player, stepping one tile away at a
    // time at the given speed while the player is within fleeRange, and holding
    // still (so the player can reach it) once cornered. No pauses — it re-decides
    // every tile. Bounds are authored intent; occupancy is authority.
    NPC_ROUTES[id] = {
      npc,
      type: 'flee',
      bounds: mv.bounds,
      speed: mv.speed || SPEED,       // default: exactly the player's walking speed
      fleeRange: mv.fleeRange || 192,  // px; only flees while the player is this near
      target: null, step: 0,
      moving: true, done: false, frozen: false, resumeDelay: 0,
      facing: npc.facing,
    };
    return true;
  }

  if (mv.type !== 'scriptedRoute' && mv.type !== 'patrol') return false;
  // patrol loops by default (loop !== false); scriptedRoute is always one-way.
  const loop = mv.type === 'patrol' ? (mv.loop !== false) : false;
  NPC_ROUTES[id] = {
    npc,
    type:  mv.type,
    // Waypoints are authored in TILE units (architecture.md); runtime works in
    // px. Each waypoint carries its own dwell: waypoint-level pauseFrames wins
    // (the patrol form), else the movement-level pauseFrames (scriptedRoute).
    waypoints: mv.waypoints.map(wp => ({
      x: wp.x * TILE, y: wp.y * TILE,
      pauseFrames: wp.pauseFrames !== undefined ? wp.pauseFrames : (mv.pauseFrames || 0),
    })),
    speed: mv.speed,
    loop,
    idx: 0, pauseLeft: 0, step: 0,
    moving: true, done: false, frozen: false, resumeDelay: 0,
    facing: npc.facing,
  };
  return true;
}
window.startNpcRoute = startNpcRoute;

// Per-frame route updater — called only from update()'s tail (see above), so
// it inherits every global freeze. Movement is orthogonal (x resolved before
// y), with arrival tolerance and snapping: when the remaining distance along
// the current axis is no greater than one step, the NPC is placed exactly on
// the waypoint — no overshoot, no oscillation, no drift across repeated loops
// (every waypoint is re-snapped to its exact coordinate). A blocked NPC waits
// in place (stays `moving`, retries next frame) rather than pushing or
// re-pathing. Moving NPCs never roll encounters, never trigger interactions,
// and never enter transition tiles (npcRouteCanOccupy) — nothing here touches
// any of those systems.
function updateNpcRoutes() {
  for (const id in NPC_ROUTES) {
    const rt = NPC_ROUTES[id];
    if (rt.done || !rt.moving) continue;
    const npc = rt.npc;
    // Regional NPCs simulate while their owner chunk is in the nearby set (so a
    // neighbour mover keeps advancing across the player's handoff, not just the
    // active chunk); nonregional NPCs and legacy mode keep the active-key gate.
    // Exactly one update per eligible frame (this loop runs once per update()).
    if (typeof npcShouldSimulate === 'function' ? !npcShouldSimulate(npc) : (npc.map !== currentContentLocationKey())) continue;
    // Frozen by an interaction (patrolNpcTalk): the first frame after the
    // dialogue closes (this updater only runs when dialogue is shut), thaw and
    // wait a beat before resuming — never a restart, never a teleport. For a
    // waypoint route this resumes toward the same waypoint; for a wander it
    // drops the in-progress step (target cleared) and re-decides after the wait.
    if (rt.frozen) { rt.frozen = false; rt.target = null; rt.pauseLeft = rt.resumeDelay || 0; rt.resumeDelay = 0; continue; }
    if (rt.pauseLeft > 0) { rt.pauseLeft--; continue; }

    // ── Bounded random wander (Tomas) ───────────────────────────────────────
    // Intermittent domestic motion: wait, take one short orthogonal step toward
    // a randomly-chosen in-bounds neighbour, wait again. Randomness is rolled
    // only at a decision point / pause start, never per frame.
    if (rt.type === 'boundedWander') {
      if (rt.target) {
        const dx = rt.target.x - npc.x, dy = rt.target.y - npc.y;
        let sx = 0, sy = 0;
        if (dx !== 0) sx = Math.sign(dx); else if (dy !== 0) sy = Math.sign(dy);
        if (sx !== 0)      rt.facing = sx > 0 ? 'right' : 'left';
        else if (sy !== 0) rt.facing = sy > 0 ? 'down' : 'up';
        npc.facing = rt.facing;
        const remaining = sx !== 0 ? Math.abs(dx) : Math.abs(dy);
        if (remaining <= rt.speed) {
          // Arrival: snap exactly (no drift), then pause before the next decision.
          if (!npcRouteCanOccupy(npc, rt.target.x, rt.target.y)) { rt.target = null; rt.pauseLeft = wanderPauseFrames(rt); continue; }
          npc.x = rt.target.x; npc.y = rt.target.y;
          rt.target = null;
          rt.pauseLeft = wanderPauseFrames(rt);
          continue;
        }
        const nx = npc.x + sx * rt.speed, ny = npc.y + sy * rt.speed;
        if (npcRouteCanOccupy(npc, nx, ny)) { npc.x = nx; npc.y = ny; rt.step++; }
        else { rt.target = null; rt.pauseLeft = wanderPauseFrames(rt); } // blocked mid-walk (e.g. player stepped in) — abort, pause, re-decide
        continue;
      }
      // Decision point (pause elapsed): take one legal one-tile move, else wait.
      const target = chooseWanderTarget(rt, npc);
      if (target) rt.target = target;
      else rt.pauseLeft = wanderPauseFrames(rt);
      continue;
    }

    // ── Flee (the black feral cat) ──────────────────────────────────────────
    // Same one-tile-at-a-time stepping as the wander, but the target is always
    // the neighbour farthest from the player, chosen fresh every tile (no pause),
    // and only while the player is close. Cornered (chooseFleeTarget → null) or
    // player far → hold still.
    if (rt.type === 'flee') {
      if (rt.target) {
        const dx = rt.target.x - npc.x, dy = rt.target.y - npc.y;
        let sx = 0, sy = 0;
        if (dx !== 0) sx = Math.sign(dx); else if (dy !== 0) sy = Math.sign(dy);
        if (sx !== 0)      rt.facing = sx > 0 ? 'right' : 'left';
        else if (sy !== 0) rt.facing = sy > 0 ? 'down' : 'up';
        npc.facing = rt.facing;
        const remaining = sx !== 0 ? Math.abs(dx) : Math.abs(dy);
        if (remaining <= rt.speed) {
          if (!npcRouteCanOccupy(npc, rt.target.x, rt.target.y)) { rt.target = null; continue; }
          npc.x = rt.target.x; npc.y = rt.target.y;
          rt.target = null;
          continue;
        }
        const nx = npc.x + sx * rt.speed, ny = npc.y + sy * rt.speed;
        if (npcRouteCanOccupy(npc, nx, ny)) { npc.x = nx; npc.y = ny; rt.step++; }
        else rt.target = null; // player stepped into the path — abort, re-decide next frame
        continue;
      }
      // Decision point: bolt one tile away only if the player is close AND a
      // farther-from-player legal tile exists; otherwise stay put.
      if (Math.hypot(npc.x - player.x, npc.y - player.y) <= rt.fleeRange) {
        const target = chooseFleeTarget(rt, npc);
        if (target) rt.target = target;
      }
      continue;
    }

    const wp = rt.waypoints[rt.idx];
    const dx = wp.x - npc.x, dy = wp.y - npc.y;
    let sx = 0, sy = 0;
    if (dx !== 0) sx = Math.sign(dx);
    else if (dy !== 0) sy = Math.sign(dy);
    if (sx !== 0)      rt.facing = sx > 0 ? 'right' : 'left';
    else if (sy !== 0) rt.facing = sy > 0 ? 'down' : 'up';
    npc.facing = rt.facing;

    const remaining = sx !== 0 ? Math.abs(dx) : Math.abs(dy);
    if (remaining <= rt.speed) {
      // Arrival: snap exactly onto the waypoint (if the spot is clear).
      if (!npcRouteCanOccupy(npc, wp.x, wp.y)) continue; // blocked — wait
      npc.x = wp.x; npc.y = wp.y;
      const dwell = rt.waypoints[rt.idx].pauseFrames; // dwell at the waypoint just reached
      rt.idx++;
      if (rt.idx >= rt.waypoints.length) {
        if (rt.loop) {
          // patrol: wrap to the first waypoint and keep going (dwell here too).
          rt.idx = 0; rt.pauseLeft = dwell;
        } else {
          // scriptedRoute is one-way (loop: false): finish and stay finished.
          rt.done = true; rt.moving = false;
          npc.facing = rt.facing; // remain facing the direction walked
        }
      } else {
        rt.pauseLeft = dwell;
      }
      continue;
    }
    const nx = npc.x + sx * rt.speed, ny = npc.y + sy * rt.speed;
    if (npcRouteCanOccupy(npc, nx, ny)) {
      npc.x = nx; npc.y = ny;
      rt.step++; // walk-animation frame counter advances only on real steps
    }
    // else: blocked — wait in place, keep `moving` so we retry next frame
  }
}

// ─── Bridge-guard placement helpers ──────────────────────────────────────────
// The authored anchors and post-payment aside positions for the two pilots.
// Entry (enterBridgePostFromSouth/North) and both exits call
// resetBridgeGuards(); loadGame() calls resetBridgeGuards() or
// placeBridgeGuardsAside() depending on bridge_toll_paid (save.js).
const BRIDGE_GUARD_POSTS = {
  bridge_soldier_north: { x: 7.5 * TILE, y: 4.5 * TILE, facing: 'down', asideX: 8.5 * TILE, asideFacing: 'right' },
  bridge_soldier_south: { x: 7.5 * TILE, y: 7.5 * TILE, facing: 'up',   asideX: 6.5 * TILE, asideFacing: 'left'  },
};

// Blocking positions + original stationary state/facing; clears any runtime
// route so mutated positions and half-finished walks never leak between
// visits (a fresh visit always requires a fresh toll).
function resetBridgeGuards() {
  for (const id in BRIDGE_GUARD_POSTS) {
    delete NPC_ROUTES[id];
    const npc = SIMPLE_NPCS.find(n => n.id === id);
    if (!npc) continue;
    const post = BRIDGE_GUARD_POSTS[id];
    npc.x = post.x; npc.y = post.y; npc.facing = post.facing;
  }
}
window.resetBridgeGuards = resetBridgeGuards;

// Fully-aside positions (route already completed) — used by loadGame() when a
// save was made inside the bridge with the toll already paid: a save made
// midway through the sidestep loads with the guards already fully aside.
function placeBridgeGuardsAside() {
  for (const id in BRIDGE_GUARD_POSTS) {
    delete NPC_ROUTES[id];
    const npc = SIMPLE_NPCS.find(n => n.id === id);
    if (!npc) continue;
    const post = BRIDGE_GUARD_POSTS[id];
    npc.x = post.asideX; npc.y = post.y; npc.facing = post.asideFacing;
  }
}
window.placeBridgeGuardsAside = placeBridgeGuardsAside;

