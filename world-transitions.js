'use strict';

// world-transitions.js — all enter*/exit*/ascend*/descend* functions that move
// the player between maps: dungeon floors, floor-3 sub-rooms, guard posts,
// the bridge checkpoint, smugglers' fort, Mirethyst's Vault, the fen brewery,
// Falls hamlet, and town/building/house transitions.

// ─── Dungeon transitions ──────────────────────────────────────────────────────
// Overworld ↔ South Ruins Entrance Hall ↔ dungeon floor 1. The entrance hall
// (no encounters — see DUNGEON_ENTRANCE_MAP's header comment) sits between
// the overworld and the monster-infested floors, so entering the ruins no
// longer drops the player straight into combat territory.
function enterDungeon() {
  inDungeonEntrance = true;
  activeMap    = DUNGEON_ENTRANCE_MAP;
  // Spawn just above the exit tile (row 12, col 7)
  player.x   = 7.5 * TILE;
  player.y   = 12.5 * TILE;
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitDungeon() {
  inDungeonEntrance = false;
  activeMap    = MAP;
  // Place player one tile south of the entrance (row 13, col 11)
  player.x   = 11.5 * TILE;
  player.y   = 13.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// Entrance hall's own stairs down → the real, monster-infested floor 1.
function descendToDungeon1() {
  inDungeonEntrance = false;
  inDungeon    = true;
  dungeonFloor = 1;
  activeMap    = DUNGEON_MAP;
  // Spawn just above the south exit tile (row 12, col 7)
  player.x   = 7.5 * TILE;
  player.y   = 12.5 * TILE;
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// Floor 1's existing exit tile (row 13, col 7 of DUNGEON_MAP) now leads back
// up to the entrance hall rather than straight outside.
function ascendToDungeonEntrance() {
  inDungeon    = false;
  dungeonFloor = 1;
  inDungeonEntrance = true;
  activeMap    = DUNGEON_ENTRANCE_MAP;
  // Spawn just south of the stairs-down tile (row 1, cols 7-8)
  player.x   = 7.5 * TILE;
  player.y   = 2.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function descendToDungeon2() {
  dungeonFloor = 2;
  activeMap    = DUNGEON2_MAP;
  // Spawn just south of the stairs-up tile (row 2, col 7) on floor 2
  player.x   = 7.5 * TILE;
  player.y   = 3.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function ascendToDungeon1() {
  dungeonFloor = 1;
  activeMap    = DUNGEON_MAP;
  // Spawn just south of the stairs-down tile (row 1, col 8) on floor 1
  player.x   = 8.5 * TILE;
  player.y   = 2.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function descendToDungeon3() {
  dungeonFloor = 3;
  activeMap    = DUNGEON3_MAP;
  player.x   = 7.5 * TILE;  // col 7 — one south of stairs-up (row 1, col 8)
  player.y   = 3.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function ascendToDungeon2() {
  dungeonFloor = 2;
  activeMap    = DUNGEON2_MAP;
  player.x   = 7.5 * TILE;  // col 7 — one north of stairs-down (row 13, col 7)
  player.y   = 12.5 * TILE;
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function descendToDungeon4() {
  dungeonFloor = 4;
  activeMap    = DUNGEON4_MAP;
  player.x   = 7.5 * TILE;
  player.y   = 3.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function ascendToDungeon3() {
  dungeonFloor = 3;
  activeMap    = DUNGEON3_BR_MAP;  // stairs down are in BR; arriving from below
  player.x   = 7.5 * TILE;
  player.y   = 12.5 * TILE;  // one tile above stairs at row 13
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function descendToDungeon5() {
  dungeonFloor = 5;
  activeMap    = DUNGEON5_MAP;
  player.x   = 7.5 * TILE;
  player.y   = 3.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function ascendToDungeon4() {
  dungeonFloor = 4;
  activeMap    = DUNGEON4_MAP;
  player.x   = 7.5 * TILE;
  player.y   = 10.5 * TILE;  // one north of stair tile at row 12, Mulholland defeated
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function descendToDungeon6() {
  dungeonFloor = 6;
  activeMap    = DUNGEON6_MAP;
  player.x   = 7.5 * TILE;
  player.y   = 3.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function ascendToDungeon5() {
  dungeonFloor = 5;
  activeMap    = DUNGEON5_MAP;
  player.x   = 7.5 * TILE;
  player.y   = 11.5 * TILE;
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function descendToDungeon7() {
  dungeonFloor = 7;
  activeMap    = DUNGEON7_MAP;
  player.x   = 7.5 * TILE;
  player.y   = 3.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function ascendToDungeon6() {
  dungeonFloor = 6;
  activeMap    = DUNGEON6_MAP;
  player.x   = 7.5 * TILE;
  player.y   = 12.5 * TILE;
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function descendToDungeon8() {
  dungeonFloor = 8;
  activeMap    = DUNGEON8_MAP;
  player.x   = 7.5 * TILE;
  player.y   = 3.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function ascendToDungeon7() {
  dungeonFloor = 7;
  activeMap    = DUNGEON7_MAP;
  player.x   = 7.5 * TILE;
  player.y   = 12.5 * TILE;
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterDungeon8West() {
  dungeonFloor = 9;
  activeMap    = DUNGEON8_WEST_MAP;
  player.x   = 13.5 * TILE;
  player.y   = 7.5 * TILE;
  player.facing = 'left';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitDungeon8West() {
  dungeonFloor = 8;
  activeMap    = DUNGEON8_MAP;
  player.x   = 1.5 * TILE;
  player.y   = 7.5 * TILE;
  player.facing = 'right';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterDungeon8East() {
  dungeonFloor = 10;
  activeMap    = DUNGEON8_EAST_MAP;
  player.x   = 1.5 * TILE;
  player.y   = 7.5 * TILE;
  player.facing = 'right';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitDungeon8East() {
  dungeonFloor = 8;
  activeMap    = DUNGEON8_MAP;
  player.x   = 13.5 * TILE;
  player.y   = 7.5 * TILE;
  player.facing = 'left';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// ─── Floor 3 — 3×3 sub-room navigation ───────────────────────────────────────
// All functions keep dungeonFloor = 3. Spawn positions place the player just
// inside the destination room, one tile away from the passage they came through.
// TC ↔ TL  (east wall of TL / west wall of TC)
function d3_TC_to_TL() { activeMap=DUNGEON3_TL_MAP; player.x=14.5*TILE; player.y=7.5*TILE; player.facing='left';  combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_TL_to_TC() { activeMap=DUNGEON3_MAP;    player.x= 1.5*TILE; player.y=7.5*TILE; player.facing='right'; combat.cooldown=ENCOUNTER_COOLDOWN; }
// TC ↔ TR  (west wall of TR / east wall of TC)
function d3_TC_to_TR() { activeMap=DUNGEON3_TR_MAP; player.x= 1.5*TILE; player.y=7.5*TILE; player.facing='right'; combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_TR_to_TC() { activeMap=DUNGEON3_MAP;    player.x=14.5*TILE; player.y=7.5*TILE; player.facing='left';  combat.cooldown=ENCOUNTER_COOLDOWN; }
// TC ↔ MC  (south wall of TC / north wall of MC)
function d3_TC_to_MC() { activeMap=DUNGEON3_MC_MAP; player.x=7.5*TILE; player.y= 1.5*TILE; player.facing='down';  combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_MC_to_TC() { activeMap=DUNGEON3_MAP;    player.x=7.5*TILE; player.y=13.5*TILE; player.facing='up';    combat.cooldown=ENCOUNTER_COOLDOWN; }
// TL ↔ ML  (south wall of TL / north wall of ML)
function d3_TL_to_ML() { activeMap=DUNGEON3_ML_MAP; player.x=7.5*TILE; player.y= 1.5*TILE; player.facing='down';  combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_ML_to_TL() { activeMap=DUNGEON3_TL_MAP; player.x=7.5*TILE; player.y=13.5*TILE; player.facing='up';    combat.cooldown=ENCOUNTER_COOLDOWN; }
// TR ↔ MR  (south wall of TR / north wall of MR)
function d3_TR_to_MR() { activeMap=DUNGEON3_MR_MAP; player.x=7.5*TILE; player.y= 1.5*TILE; player.facing='down';  combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_MR_to_TR() { activeMap=DUNGEON3_TR_MAP; player.x=7.5*TILE; player.y=13.5*TILE; player.facing='up';    combat.cooldown=ENCOUNTER_COOLDOWN; }
// ML ↔ MC  (east wall of ML / west wall of MC)
function d3_ML_to_MC() { activeMap=DUNGEON3_MC_MAP; player.x= 1.5*TILE; player.y=7.5*TILE; player.facing='right'; combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_MC_to_ML() { activeMap=DUNGEON3_ML_MAP; player.x=14.5*TILE; player.y=7.5*TILE; player.facing='left';  combat.cooldown=ENCOUNTER_COOLDOWN; }
// MC ↔ MR  (east wall of MC / west wall of MR)
function d3_MC_to_MR() { activeMap=DUNGEON3_MR_MAP; player.x= 1.5*TILE; player.y=7.5*TILE; player.facing='right'; combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_MR_to_MC() { activeMap=DUNGEON3_MC_MAP; player.x=14.5*TILE; player.y=7.5*TILE; player.facing='left';  combat.cooldown=ENCOUNTER_COOLDOWN; }
// ML ↔ BL  (south wall of ML / north wall of BL)
function d3_ML_to_BL() { activeMap=DUNGEON3_BL_MAP; player.x=7.5*TILE; player.y= 1.5*TILE; player.facing='down';  combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_BL_to_ML() { activeMap=DUNGEON3_ML_MAP; player.x=7.5*TILE; player.y=13.5*TILE; player.facing='up';    combat.cooldown=ENCOUNTER_COOLDOWN; }
// MC ↔ BC  (south wall of MC / north wall of BC)
function d3_MC_to_BC() { activeMap=DUNGEON3_BC_MAP; player.x=7.5*TILE; player.y= 1.5*TILE; player.facing='down';  combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_BC_to_MC() { activeMap=DUNGEON3_MC_MAP; player.x=7.5*TILE; player.y=13.5*TILE; player.facing='up';    combat.cooldown=ENCOUNTER_COOLDOWN; }
// MR ↔ BR  (south wall of MR / north wall of BR)
function d3_MR_to_BR() { activeMap=DUNGEON3_BR_MAP; player.x=7.5*TILE; player.y= 1.5*TILE; player.facing='down';  combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_BR_to_MR() { activeMap=DUNGEON3_MR_MAP; player.x=7.5*TILE; player.y=13.5*TILE; player.facing='up';    combat.cooldown=ENCOUNTER_COOLDOWN; }
// BL ↔ BC  (east wall of BL / west wall of BC)
function d3_BL_to_BC() { activeMap=DUNGEON3_BC_MAP; player.x= 1.5*TILE; player.y=7.5*TILE; player.facing='right'; combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_BC_to_BL() { activeMap=DUNGEON3_BL_MAP; player.x=14.5*TILE; player.y=7.5*TILE; player.facing='left';  combat.cooldown=ENCOUNTER_COOLDOWN; }
// BC ↔ BR  (east wall of BC / west wall of BR)
function d3_BC_to_BR() { activeMap=DUNGEON3_BR_MAP; player.x= 1.5*TILE; player.y=7.5*TILE; player.facing='right'; combat.cooldown=ENCOUNTER_COOLDOWN; }
function d3_BR_to_BC() { activeMap=DUNGEON3_BC_MAP; player.x=14.5*TILE; player.y=7.5*TILE; player.facing='left';  combat.cooldown=ENCOUNTER_COOLDOWN; }

// ─── Lorra's Farmhouse ────────────────────────────────────────────────────────
function enterLorraHouse() {
  inLorraHouse    = true;
  activeMap       = LORRA_HOUSE_MAP;
  player.x        = 7.5 * TILE;  // col 7 — centre aisle
  player.y        = 11.5 * TILE; // row 11 — just inside the door
  player.facing   = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitLorraHouse() {
  inLorraHouse    = false;
  activeMap       = MAP2;
  player.x        = 2.5 * TILE;  // col 2 — in front of the door
  player.y        = 13.5 * TILE; // row 13 — one step south of HOUSE_DOOR at row 12
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterMarenPost() {
  inMarenPost     = true;
  activeMap       = MAREN_POST_MAP;
  player.x        = 7.5 * TILE;  // col 7 — centre aisle
  player.y        = 10.5 * TILE; // row 10 — just inside the post door
  player.facing   = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitMarenPost() {
  inMarenPost     = false;
  activeMap       = MAP;
  player.x        = 13.5 * TILE; // col 13 — back on the GUARD_POST tile
  player.y        =  6.5 * TILE; // row 6 — one step south of the post
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// ─── Drenwick Guard Post (MAP3_N2 row 12 col 11) ─────────────────────────────
function enterDrenwrickPost() {
  inDrenwrickPost = true;
  activeMap       = DRENWICK_POST_MAP;
  player.x        = 7.5 * TILE;  // col 7 — centre aisle
  player.y        = 10.5 * TILE; // row 10 — just inside the post door
  player.facing   = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitDrenwrickPost() {
  inDrenwrickPost = false;
  activeMap       = MAP3_N2;
  player.x        = 11.5 * TILE; // col 11 — back on the GUARD_POST tile
  player.y        = 13.5 * TILE; // row 13 — one step south of the post
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// ─── Imperial Bridge Checkpoint (MAP3_N2 row 5 col 12) ───────────────────────
function enterBridgePostFromSouth() {
  inBridgePost           = true;
  bridge_entry_direction = 'south';
  bridge_toll_paid       = false;
  activeMap              = BRIDGE_CROSSING_MAP;
  player.x               = 7.5 * TILE;  // col 7 — bridge centre path
  player.y               = 13.5 * TILE; // row 13 — south bank entry point
  player.facing          = 'up';
  combat.cooldown        = ENCOUNTER_COOLDOWN;
}

function enterBridgePostFromNorth() {
  inBridgePost           = true;
  bridge_entry_direction = 'north';
  bridge_toll_paid       = false;
  activeMap              = BRIDGE_CROSSING_MAP;
  player.x               = 7.5 * TILE;  // col 7 — bridge centre path
  player.y               =  1.5 * TILE; // row 1 — north bank entry point
  player.facing          = 'down';
  combat.cooldown        = ENCOUNTER_COOLDOWN;
}

function exitBridgeSouth() {
  inBridgePost           = false;
  bridge_entry_direction = null;
  bridge_toll_paid       = false;
  activeMap              = MAP3_N2;
  player.x               = 12.5 * TILE; // col 12 — back on the approach path
  player.y               =  6.5 * TILE; // row 6 — one step south of the bridge gate
  player.facing          = 'down';
  combat.cooldown        = ENCOUNTER_COOLDOWN;
}

function exitBridgeNorth() {
  inBridgePost           = false;
  bridge_entry_direction = null;
  bridge_toll_paid       = false;
  activeMap              = MAP3_N2;
  player.x               = 12.5 * TILE; // col 12 — north bank
  player.y               =  4.5 * TILE; // row 4 — one step north of the bridge gate
  player.facing          = 'up';
  combat.cooldown        = ENCOUNTER_COOLDOWN;
}

// ─── Smugglers' Fort (MAP3_N1 row 9 col 13) ──────────────────────────────────
function enterSmugglerFort() {
  inSmugglerFort  = true;
  activeMap       = SMUGGLER_FORT_MAP;
  player.x        = 7.5 * TILE;  // col 7 — centre aisle
  player.y        = 10.5 * TILE; // row 10 — just inside the door
  player.facing   = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitSmugglerFort() {
  inSmugglerFort  = false;
  activeMap       = MAP3_N1;
  player.x        = 14.5 * TILE; // col 14 — east of the fort tile
  player.y        =  9.5 * TILE; // row 9
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// ─── Mirethyst's Vault (MAP3_N1 row 3 col 1) ─────────────────────────────────
function enterMireVault() {
  inMireVault     = true;
  activeMap       = MIRE_VAULT_MAP;
  player.x        = 7.5 * TILE;  // col 7 — entry hall
  player.y        = 12.5 * TILE; // row 12 — just above MIRE_EXIT
  player.facing   = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitMireVault() {
  inMireVault     = false;
  activeMap       = MAP3_N1;
  player.x        =  1.5 * TILE; // col 1 — back on/beside the MIRE_ENTRANCE
  player.y        =  4.5 * TILE; // row 4 — one step south of the entrance
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterTakomo() {
  inTakomo        = true;
  activeMap       = TAKOMO_MAP;
  player.x        = 2.5 * TILE; // col 2 — just inside the passage mouth
  player.y        = 7.5 * TILE; // row 7 — aligned with the exit tile
  player.facing   = 'right';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitTakomo() {
  inTakomo        = false;
  activeMap       = DRENWICK_WATERFRONT_MAP;
  player.x        = 1.5 * TILE; // col 1 — one step east of the gate on the quay
  player.y        = 3.5 * TILE; // row 3 — quay level
  player.facing   = 'right';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// ─── Fen Brewery (MAP3_N1 row 4 col 13) ──────────────────────────────────────
function enterFenBrewery() {
  inFenBrewery    = true;
  activeMap       = FEN_BREWERY_MAP;
  player.x        = 3.5 * TILE;  // col 3 — just inside the south door
  player.y        = 12.5 * TILE; // row 12 — one step north of INTERIOR_EXIT
  player.facing   = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitFenBrewery() {
  inFenBrewery    = false;
  activeMap       = MAP3_N1;
  player.x        = 13.5 * TILE; // col 13 — just south of the FARM_HOUSE tile
  player.y        =  5.5 * TILE; // row 5  — one step south of the house
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// ─── Falls Hamlet Interior ────────────────────────────────────────────────────
// One shared 16×15 map with three side-by-side rooms (A/B/C).
// Entry positions: room A → col 2 row 12, room B → col 7 row 12, room C → col 12 row 12.
// Exit: player's x when stepping on INTERIOR_EXIT determines which house to return to.
function enterHamletInterior(room) {
  inHamletInterior = true;
  activeMap        = HAMLET_INTERIOR_MAP;
  player.facing    = 'up';
  combat.cooldown  = ENCOUNTER_COOLDOWN;
  if (room === 'A') {
    player.x = 2.5 * TILE;   // room A — Corvel (cols 1-4)
    player.y = 12.5 * TILE;
  } else if (room === 'B') {
    player.x = 7.5 * TILE;   // room B — Gridd (cols 6-9)
    player.y = 12.5 * TILE;
  } else {
    player.x = 12.5 * TILE;  // room C — Mabel + Imber (cols 11-14)
    player.y = 12.5 * TILE;
  }
}

function exitHamletInterior() {
  inHamletInterior = false;
  activeMap        = MAP3_N1;
  player.facing    = 'down';
  combat.cooldown  = ENCOUNTER_COOLDOWN;
  // Determine return position from which room the exit tile was in
  if (player.x < 5 * TILE) {
    // Room A exit (col 2) → south of house at row 10 col 1
    player.x = 1.5 * TILE;
    player.y = 11.5 * TILE;
  } else if (player.x < 11 * TILE) {
    // Room B exit (col 7) → south of house at row 11 col 2
    player.x = 2.5 * TILE;
    player.y = 12.5 * TILE;
  } else {
    // Room C exit (col 12) → south of house at row 12 col 1
    player.x = 1.5 * TILE;
    player.y = 13.5 * TILE;
  }
}

// ─── Town transitions ─────────────────────────────────────────────────────────
function enterMap2() {
  activeMap   = MAP2;
  player.x    = 1.5 * TILE;  // col 1 — just inside MAP2's left edge
  // player.y preserved — row stays the same (row 4)
  player.facing = 'right';
}

function exitMap2() {
  activeMap   = MAP;
  player.x    = 14.5 * TILE; // col 14 — one step before the MAP2_EXIT tile
  // player.y preserved
  player.facing = 'left';
}

function enterMap3() {
  activeMap   = MAP3;
  player.x    = 1.5 * TILE;  // col 1 — just inside MAP3's left edge
  // player.y preserved — row 11 lines up with MAP3_ENTRANCE
  player.facing = 'right';
}

function exitMap3() {
  activeMap   = MAP2;
  player.x    = 14.5 * TILE; // col 14 — one step before the MAP3_EXIT tile
  // player.y preserved
  player.facing = 'left';
}

function enterMap4() {
  activeMap   = MAP4;
  player.x    = 1.5 * TILE;  // col 1 — just inside MAP4's west edge
  // player.y preserved — row 6 lines up with MAP4_EXIT
  player.facing = 'right';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitMap4() {
  activeMap   = MAP3;
  player.x    = 14.5 * TILE; // col 14 — one step before MAP4_EXIT tile
  // player.y preserved
  player.facing = 'left';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterMap5() {
  activeMap   = MAP5;
  player.x    = 1.5 * TILE;  // col 1 — just inside MAP5's west edge
  // player.y preserved — row 6 lines up with MAP5_EXIT
  player.facing = 'right';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitMap5() {
  activeMap   = MAP4;
  player.x    = 14.5 * TILE; // col 14 — one step before MAP5_EXIT tile
  // player.y preserved
  player.facing = 'left';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterMap3N1() {
  activeMap   = MAP3_N1;
  player.y    = 13.5 * TILE; // row 13 — just inside MAP3_N1's south edge
  // player.x preserved — col 8 lines up with FEN_N_EXIT
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitMap3N1() {
  activeMap   = MAP3;
  player.y    = 1.5 * TILE;  // row 1 — just inside MAP3's north edge
  // player.x preserved
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterMap3N2() {
  activeMap   = MAP3_N2;
  player.y    = 13.5 * TILE; // row 13 — just inside MAP3_N2's south edge
  // player.x preserved — col 8
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitMap3N2() {
  activeMap   = MAP3_N1;
  player.y    = 1.5 * TILE;  // row 1 — just inside MAP3_N1's north edge
  // player.x preserved
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// ─── The North Basin — south approach (skeleton) ─────────────────────────────
// MAP3_N2's NORTH_BASIN_EXIT (row 0 col 12) <-> NORTH_BASIN_S_MAP's
// NORTH_BASIN_ENTRANCE (row 14 col 12). Same preserved-x, fixed-y pattern as
// every other north/south overworld crossing (enterMap3N1/exitMap3N1, etc).
function enterNorthBasinS() {
  activeMap   = NORTH_BASIN_S_MAP;
  player.y    = 13.5 * TILE; // row 13 — just inside the basin map's south edge
  // player.x preserved — col 12
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitNorthBasinS() {
  activeMap   = MAP3_N2;
  player.y    = 1.5 * TILE;  // row 1 — just inside MAP3_N2's north edge (on the causeway)
  // player.x preserved — col 12
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// North Basin south approach <-> centre reservoir, and south approach <->
// Silt Flats, USED TO be point-tile transitions here (enterNorthBasinC/
// exitNorthBasinC/enterNorthBasinSW/exitNorthBasinSW). Both links have been
// converted to the generic, broad-edge EDGE_TRANSITIONS system further down
// this file, so those four functions and their dedicated tile IDs no longer
// exist — see the "Edge-based map transitions" section below.

// Hidden meadow <-> Verdant Vale (MAP). Entered by stepping on the
// MEADOW_HIDDEN_ENTRANCE tile in the vale's top-left tree nook (MAP row 1
// col 1 — drawn as plain grass, deliberately secret); exit is the gap in the
// meadow's south tree border. The exit lands one tile BELOW the hidden tile
// (row 2), not on it, so leaving the meadow doesn't immediately re-enter it.
function enterMeadow() {
  activeMap   = MEADOW_MAP;
  player.x    = 7.5 * TILE;   // just inside the south gap
  player.y    = 13.5 * TILE;
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitMeadow() {
  activeMap   = MAP;
  player.x    = 1.5 * TILE;   // col 1, row 2 — one south of the hidden entrance
  player.y    = 2.5 * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// Silt Flats <-> West Shore (north-south crossing).
// SUPERSEDED: this link is now an OPEN EDGE via the generic EDGE_TRANSITIONS
// system below (NORTH_BASIN_SW_MAP.north / NORTH_BASIN_W_MAP.south), the same
// way the C/SW point-tiles were converted. The NORTH_BASIN_W_EXIT/ENTRANCE
// tiles (90/91) are no longer placed on any map, so these two functions and
// their movement.js dispatch are now unreachable; they're left in place
// (not torn out) to keep this conservative pass off the movement/transition
// machinery. Safe to delete whenever tiles 90/91 are formally retired.
function enterNorthBasinW() {
  activeMap   = NORTH_BASIN_W_MAP;
  player.y    = 13.5 * TILE; // row 13 — just inside the Badlands' south edge
  // player.x preserved — col 4
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitNorthBasinW() {
  activeMap   = NORTH_BASIN_SW_MAP;
  player.y    = 1.5 * TILE;  // row 1 — just inside the Silt Flats' north edge
  // player.x preserved — col 4
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterMapN1() {
  activeMap   = MAP_N1;
  player.y    = 13.5 * TILE; // row 13 — just inside MAP_N1's south edge
  // player.x preserved — col 7 lines up with NORTH_EXIT
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitMapN1() {
  activeMap   = MAP;
  player.y    = 1.5 * TILE;  // row 1 — just inside MAP's north edge
  // player.x preserved
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterMapN2() {
  activeMap   = MAP_N2;
  player.y    = 13.5 * TILE; // row 13 — just inside MAP_N2's south edge
  // player.x preserved — col 7
  player.facing = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitMapN2() {
  activeMap   = MAP_N1;
  player.y    = 1.5 * TILE;  // row 1 — just inside MAP_N1's north edge
  // player.x preserved
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// ─── Town entry registry ──────────────────────────────────────────────────────
// Keyed by town id, then by entry direction ('south', 'east', 'north', 'west').
// Add new towns here; enterTownAt() is generic and does not reference any town by name.
const TOWN_ENTRY_POINTS = {
  calwick: {
    south: { map: TOWN_MAP,      x: 7.5 * TILE, y: 13.5 * TILE, facing: 'up',    townBuilding: null   },
    east:  { map: EAST_TOWN_MAP, x: 1.5 * TILE, y:  9.5 * TILE, facing: 'right', townBuilding: 'east' },
    west:  { map: EAST_TOWN_MAP, x: 11.5 * TILE, y:  9.5 * TILE, facing: 'left', townBuilding: 'east' },
  },
  drenwick: {
    south: { map: DRENWICK_CIVIC_MAP,  x:  7.5 * TILE, y: 12.5 * TILE, facing: 'up',   townBuilding: null },
    west:  { map: DRENWICK_MARKET_MAP, x: 12.5 * TILE, y:  8.5 * TILE, facing: 'left', townBuilding: null },
    // The world-map gate (MAP3_N2 row 6 col 8) has open, walkable ground on
    // both sides (confirmed in TRANSITION_AUDIT.md), so an eastward approach
    // is physically real, not just a hypothetical. Reuses the exact spot/
    // facing the internal Civic->East-Outskirts transition already lands
    // players at (movement.js's DRENWICK_CIVIC_MAP MAP2_EXIT handler), so
    // arriving here feels identical to any other "just arrived at East
    // Outskirts" moment rather than introducing a new, unvalidated spot.
    east:  { map: DRENWICK_EAST_OUTSKIRTS_MAP, x: 1.5 * TILE, y: 4.5 * TILE, facing: 'right', townBuilding: null },
  },
};

function enterTownAt(townId, entryPoint) {
  const town = TOWN_ENTRY_POINTS[townId];
  if (!town) {
    console.warn('Unknown townId:', townId);
    return;
  }
  const entry = town[entryPoint] || town.south || Object.values(town)[0];
  if (!entry) {
    console.warn('No town entry configured for:', townId, entryPoint);
    return;
  }
  inTown           = true;
  currentTownId    = townId;
  townBuilding     = entry.townBuilding || null;
  activeMap        = entry.map;
  player.x         = entry.x;
  player.y         = entry.y;
  player.facing    = entry.facing;
  combat.cooldown  = ENCOUNTER_COOLDOWN;
  travellerPresent = Math.random() < 1 / 3;
}

// Backward-compatible Calwick default entry.
function enterTown() {
  enterTownAt('calwick', 'south');
}

// Returns the town entry direction that corresponds to the player's movement facing.
// Relies on player.facing reflecting the direction they moved onto the entrance tile.
function entryPointFromFacing(facing) {
  const directionMap = { up: 'south', right: 'east', down: 'north', left: 'west' };
  return directionMap[facing] || 'south';
}

function moveToDrenwichDistrict(map, x, y, facing) {
  activeMap       = map;
  player.x        = x * TILE;
  player.y        = y * TILE;
  player.facing   = facing;
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitTown() {
  if (currentTownId === 'drenwick') {
    if (activeMap === DRENWICK_MARKET_MAP) {
      // Exiting east from Market — land just east of the Drenwick gate on MAP3_N2
      activeMap     = MAP3_N2;
      player.x      = 9.5 * TILE;  // col 9, one tile east of TOWN_ENTRANCE at col 8
      player.y      = 6.5 * TILE;  // row 6, same latitude as the gate
      player.facing = 'right';
    } else if (activeMap === DRENWICK_EAST_OUTSKIRTS_MAP) {
      activeMap = MAP3_N2;
      if (player.facing === 'right') {
        // East exit (col 15 row 7) — land one tile east of the town gate
        player.x      = 9.5 * TILE;  // col 9, just east of TOWN_ENTRANCE at col 8
        player.y      = 6.5 * TILE;  // row 6, same latitude as the gate
        player.facing = 'right';
      } else {
        // South exit (row 14 col 7) — land south-east of town
        player.x      = 9.5 * TILE;
        player.y      = 7.5 * TILE;
        player.facing = 'down';
      }
    } else {
      // Default Drenwick exit — Civic south to MAP3_N2
      activeMap     = MAP3_N2;
      player.x      = 8.5 * TILE;  // col 8 — one step south of TOWN_ENTRANCE
      player.y      = 7.5 * TILE;  // row 7
      player.facing = 'down';
    }
    inTown        = false;
    townBuilding  = null;
    currentTownId = null;
    combat.cooldown = ENCOUNTER_COOLDOWN;
    return;
  }

  // Calwick (and any future non-Drenwick towns)
  inTown        = false;
  townBuilding  = null;
  activeMap     = MAP;
  player.x      = 5.5 * TILE;
  player.y      = 2.5 * TILE;
  player.facing = 'down';
  currentTownId   = null;
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterBuilding(building) {
  townBuilding = building;

  // Drenwick uses its own interior maps
  if (currentTownId === 'drenwick') {
    if (building === 'inn') {
      activeMap = DRENWICK_INN_MAP;
      player.x  = 7.5 * TILE;
      player.y  = 12.5 * TILE;
    } else if (building === 'office') {
      activeMap = DRENWICK_OFFICE_MAP;
      player.x  = 7.5 * TILE;
      player.y  = 10.5 * TILE;
    } else if (building === 'harbormaster') {
      activeMap = DRENWICK_HARBORMASTER_MAP;
      player.x  = 7.5 * TILE;
      player.y  = 11.5 * TILE;
    } else if (building === 'wash_house') {
      activeMap = DRENWICK_WASH_HOUSE_MAP;
      player.x  = 7.5 * TILE;
      player.y  = 11.5 * TILE;
    } else if (building === 'provision_store') {
      activeMap = DRENWICK_PROVISION_STORE_MAP;
      player.x  = 7.5 * TILE;
      player.y  = 11.5 * TILE;
    } else if (building === 'guild_hall') {
      activeMap = DRENWICK_GUILD_HALL_MAP;
      player.x  = 7.5 * TILE;
      player.y  = 11.5 * TILE;
    } else if (building === 'tavern') {
      activeMap = DRENWICK_TAVERN_MAP;
      player.x  = 7.5 * TILE;
      player.y  = 12.5 * TILE;
    } else if (building === 'school') {
      activeMap = DRENWICK_SCHOOL_GROUND_MAP;
      player.x  = 7.5 * TILE;
      player.y  = 11.5 * TILE;
    } else if (building.startsWith('drenwick_apt_')) {
      // All 6 east outskirts corridors reuse APARTMENT_CORRIDOR_MAP; townBuilding distinguishes them
      activeMap = APARTMENT_CORRIDOR_MAP;
      player.x  = 7.5 * TILE;
      player.y  = 8.5 * TILE;
    }
    player.facing = 'up';
    return;
  }

  // Calwick interiors — existing logic unchanged below
  if (building === 'inn')         activeMap = INN_MAP;
  else if (building === 'school') activeMap = SCHOOL_MAP;
  else if (building === 'apt')    activeMap = APARTMENT_CORRIDOR_MAP;
  else                            activeMap = OFFICE_MAP;
  player.x     = 7.5 * TILE;
  if (building === 'inn')         player.y = 12.5 * TILE;
  else if (building === 'school') player.y = 11.5 * TILE;
  else if (building === 'apt')    player.y =  8.5 * TILE;
  else                            player.y =  9.5 * TILE;
  player.facing = 'up';
}

function enterHouse(houseId) {
  currentHouseId      = houseId;
  houseSourceMap      = activeMap;
  houseSourceBuilding = townBuilding;
  const _door = HOUSE_DOORS.find(d => d.houseId === houseId);
  houseReturnPos = _door
    ? { x: (_door.col + 0.5) * TILE, y: (_door.row + 1.5) * TILE }
    : { x: player.x, y: player.y + TILE };
  const isApt = houseId.startsWith('apt_') || houseId.startsWith('drenwick_apt_');
  townBuilding        = 'house';
  activeMap           = isApt ? SMALL_APARTMENT_MAP : HOUSE_INTERIOR_MAP;
  player.x            = 7.5 * TILE;
  player.y            = isApt ? 8.5 * TILE : 9.5 * TILE;
  player.facing       = 'up';
}

function exitBuilding() {
  const prev = townBuilding;

  // Drenwick interior exits
  if (currentTownId === 'drenwick') {
    // House exits — restore to the map and position the player entered from
    if (prev === 'house') {
      activeMap           = houseSourceMap;
      townBuilding        = houseSourceBuilding;
      player.x            = houseReturnPos.x;
      player.y            = houseReturnPos.y;
      currentHouseId      = null;
      houseSourceMap      = null;
      houseSourceBuilding = null;
      player.facing       = 'down';
      return;
    }
    // East outskirts apartment corridor exits — return to the exterior door position
    if (prev.startsWith('drenwick_apt_')) {
      const aptExits = {
        'drenwick_apt_a1': { x: 2, y:  4 },
        'drenwick_apt_a2': { x: 4, y:  4 },
        'drenwick_apt_b1': { x: 2, y:  8 },
        'drenwick_apt_b2': { x: 4, y:  8 },
        'drenwick_apt_c1': { x: 2, y: 12 },
        'drenwick_apt_c2': { x: 4, y: 12 },
      };
      const pos     = aptExits[prev] || { x: 2, y: 4 };
      townBuilding  = null;
      activeMap     = DRENWICK_EAST_OUTSKIRTS_MAP;
      player.x      = (pos.x + 0.5) * TILE;
      player.y      = (pos.y + 0.5) * TILE;
      player.facing = 'down';
      return;
    }
    // Canal/Docks buildings exit to dock road (row 7) one tile south of their door (row 6)
    if (prev === 'harbormaster' || prev === 'wash_house' || prev === 'provision_store') {
      townBuilding  = null;
      activeMap     = DRENWICK_CANAL_DOCKS_MAP;
      // x = door column; y = row 7 (dock road, one south of door row 6)
      if (prev === 'harbormaster')       player.x = 2.5  * TILE;  // door col 2
      else if (prev === 'wash_house')    player.x = 7.5  * TILE;  // door col 7
      else                               player.x = 11.5 * TILE;  // door col 11 (provision store)
      player.y      = 7.5 * TILE;
      player.facing = 'down';
      return;
    }
    // Tavern exits to Waterfront map, one south of the INN_DOOR (row 9 col 3 → row 10 col 3)
    if (prev === 'tavern') {
      townBuilding  = null;
      activeMap     = DRENWICK_WATERFRONT_MAP;
      player.x      = 3.5 * TILE;   // INN_DOOR col 3
      player.y      = 10.5 * TILE;  // one tile south of row 9 door
      player.facing = 'down';
      return;
    }
    // School exits to West Residential, one south of SCHOOL_DOOR (row 3 col 3 → row 4 col 3)
    if (prev === 'school') {
      townBuilding  = null;
      activeMap     = DRENWICK_WEST_RESIDENTIAL_MAP;
      player.x      = 3.5 * TILE;   // SCHOOL_DOOR col 3
      player.y      = 4.5 * TILE;   // one tile south of door row 3
      player.facing = 'down';
      return;
    }
    // Guild Hall exits to Market map, one south of the door (row 2 col 5 → row 3 col 5)
    if (prev === 'guild_hall') {
      townBuilding  = null;
      activeMap     = DRENWICK_MARKET_MAP;
      player.x      = 5.5 * TILE;
      player.y      = 3.5 * TILE;
      player.facing = 'down';
      return;
    }
    // Civic buildings (inn, office) return to Civic map at the correct door position
    townBuilding  = null;
    activeMap     = DRENWICK_CIVIC_MAP;
    player.x      = (prev === 'inn' ? 3.5 : 11.5) * TILE;
    player.y      = 4.5 * TILE;  // row 4 — main street, one south of door row
    player.facing = 'down';
    return;
  }

  if (prev === 'house') {
    activeMap           = houseSourceMap;
    townBuilding        = houseSourceBuilding;
    player.x            = houseReturnPos.x;
    player.y            = houseReturnPos.y;
    currentHouseId      = null;
    houseSourceMap      = null;
    houseSourceBuilding = null;
  } else if (prev === 'school') {
    townBuilding = 'west';
    activeMap    = WEST_TOWN_MAP;
    player.x     = 6.5 * TILE;   // col 6 — school door column
    player.y     = 4.5 * TILE;   // row 4 — school courtyard (grass)
  } else if (prev === 'apt') {
    townBuilding = 'east';
    activeMap    = EAST_TOWN_MAP;
    player.x     = 5.5 * TILE;   // col 5 — apt door column
    player.y     = 9.5 * TILE;   // row 9 — south street
  } else {
    townBuilding = null;
    activeMap    = TOWN_MAP;
    // Spawn just south of the building door on main street
    player.x     = (prev === 'inn' ? 3.5 : 12.5) * TILE;
    player.y     = 5.5 * TILE;
  }
  player.facing = 'down';
}

function enterEastTown() {
  townBuilding  = 'east';
  activeMap     = EAST_TOWN_MAP;
  player.x      = 1.5 * TILE;   // col 1 — one step inside the east alley
  player.facing = 'right';
  // player.y is preserved; rows 5 and 9 align with EAST_EXIT tiles
}

function exitEastTown() {
  townBuilding  = null;
  activeMap     = TOWN_MAP;
  player.x      = 14.5 * TILE;  // col 14 — just inside main town, left of east entrance
  player.facing = 'left';
  // player.y preserved
}

function exitEastTownToWorld() {
  inTown        = false;
  townBuilding  = null;
  activeMap     = MAP;
  player.x      =  7.5 * TILE;  // col 7 — two tiles east of the town entrance
  player.y      =  1.5 * TILE;  // row 1
  player.facing = 'right';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function enterWestTown() {
  townBuilding  = 'west';
  activeMap     = WEST_TOWN_MAP;
  player.x      = 13.5 * TILE;  // col 13 — one step inside, left of west exit
  player.facing = 'left';
  // player.y preserved; rows 5 and 9 align with WEST_EXIT tiles
}

function exitWestTown() {
  townBuilding  = null;
  activeMap     = TOWN_MAP;
  player.x      = 1.5 * TILE;   // col 1 — one step inside main town, right of west entrance
  player.facing = 'right';
  // player.y preserved
}

function enterSluice() {
  inSluice        = true;
  inTown          = false;
  townBuilding    = null;
  sluiceFloor     = 1;
  activeMap       = SLUICE_MAP;
  player.x        = 7.5 * TILE;   // col 7 — top of access shaft
  player.y        = 3.5 * TILE;   // row 3 — north corridor, two steps below ladder
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitSluice() {
  inSluice        = false;
  inTown          = true;
  townBuilding    = 'east';
  activeMap       = EAST_TOWN_MAP;
  player.x        = 12.5 * TILE;  // col 12 — just south of the hatch in east Calwick
  player.y        =  5.5 * TILE;  // row 5 — main east street
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function descendToSluice2() {
  sluiceFloor     = 2;
  activeMap       = SLUICE_LEVEL2_MAP;
  player.x        = 8.5 * TILE;   // col 8 — one step south of ladder-up tile (r5 c8)
  player.y        = 6.5 * TILE;   // row 6 — east corridor
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function ascendToSluice1() {
  sluiceFloor     = 1;
  activeMap       = SLUICE_MAP;
  player.x        = 8.5 * TILE;   // col 8 — inspection nook, one step north of stairs-down
  player.y        = 11.5 * TILE;  // row 11 — south corridor
  player.facing   = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function descendToSluice3() {
  sluiceFloor     = 3;
  activeMap       = SLUICE_LEVEL3_MAP;
  player.x        = 7.5 * TILE;   // col 7 — entry shaft, one south of stairs-up (r3 c7)
  player.y        = 4.5 * TILE;   // row 4
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function ascendToSluice2() {
  sluiceFloor     = 2;
  activeMap       = SLUICE_LEVEL2_MAP;
  player.x        = 12.5 * TILE;  // col 12 — secret area, one east of the stairs tile (r10 c12)
  player.y        =  9.5 * TILE;  // row 9 — secret corridor above stairs
  player.facing   = 'up';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// The Deep Works sealed room (SLUICE_SECRET_MAP) — reached by stepping onto
// SLUICE_SECRET_ENTRANCE (L3 r7 c14, past the two false walls). Treated as
// "sluiceFloor 4": inSluice stays true so the sluice's encounter/interaction
// machinery keeps working, and every sluiceFloor branch elsewhere already
// checks floors 1-3 explicitly.
function enterSluiceSecret() {
  sluiceFloor     = 4;
  activeMap       = SLUICE_SECRET_MAP;
  player.x        = 7.5 * TILE;   // col 7 — entry corridor, one south of the exit tile (r2 c7)
  player.y        = 3.5 * TILE;   // row 3
  player.facing   = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

function exitSluiceSecret() {
  sluiceFloor     = 3;
  activeMap       = SLUICE_LEVEL3_MAP;
  player.x        = 11.5 * TILE;  // col 11 — east pocket floor, just west of the false walls
  player.y        =  7.5 * TILE;  // row 7
  player.facing   = 'left';
  combat.cooldown = ENCOUNTER_COOLDOWN;
}

// ─── Edge-based map transitions ───────────────────────────────────────────────
// A general, reusable system for walking off an open EDGE (or a segment of
// one) of a map into an adjacent one, rather than stepping onto a single
// dedicated exit tile. This exists for open outdoor terrain and large
// dungeon/ruin chambers where a whole side of a field, shoreline, or hall
// should be crossable — not just one door. It is a SEPARATE, additive
// system: every point/special-tile transition elsewhere in this file (town
// entrances, dungeon entrances, the bridge gate, building/interior exits,
// stairs, secret passages, and the other North Basin links like
// enterNorthBasinS/exitNorthBasinS and enterNorthBasinW/exitNorthBasinW)
// is untouched and keeps working exactly as before, via its own tile ID and
// movement.js curTile check. Not "world-only" — a dungeon/ruin map can use
// this too, as long as it has a stable MAP_REGISTRY id like everything else.
//
// EDGE_TRANSITIONS[mapId][direction] is an ARRAY of segments (not a single
// object) so one edge can have more than one independent opening — e.g. a
// broad crossing plus a separate narrow gap elsewhere on the same side.
// direction is the edge of the CURRENT map being walked off: 'north',
// 'south', 'east', or 'west'.
//
// Each segment:
//   targetMap    MAP_REGISTRY id (string, preferred) or a direct map array
//                reference — either is accepted (requirement: "target map
//                or target map id").
//   targetEdge   'north' | 'south' | 'east' | 'west' — which edge of the
//                TARGET map the player arrives at. This is a separate field
//                rather than always inferred as "the opposite edge," so a
//                non-mirrored connection (an L-shaped join, say) is possible
//                later without changing the system's shape. Every case in
//                this pass uses the natural opposite edge (north<->south,
//                east<->west), matching requirement 2.
//   sourceRange  [min, max] inclusive tile range along the edge being left —
//                columns for north/south, rows for east/west. Outside this
//                range this segment doesn't apply (falls through to the
//                next segment in the array, or to "blocked" if none match).
//   targetRange  optional [min, max]; the along-edge coordinate is clamped
//                into this range on arrival. Defaults to sourceRange if
//                omitted. This is deliberately allowed to differ in size
//                from sourceRange (see the North Basin routes below), so
//                clamping is a real, exercised code path, not dead code.
//   condition    optional () => boolean. If present and returns false, the
//                transition is blocked (no map change) even within range —
//                e.g. a future `day >= 8` drought-exposure gate.
//   blockedText  optional string, shown via showWorldToast() when condition
//                fails.
//
// Coordinate preservation: the tile position running ALONG the edge (column
// for north/south, row for east/west) carries over from source to target,
// clamped into targetRange if needed. The position ACROSS the edge is
// always "one tile inside" the target map's arrival border — the same
// row 13/1 or col 14/1 convention used by every enter*/exit* function in
// this file — and facing is set to continue the direction of travel.
const EDGE_TRANSITIONS = {
  NORTH_BASIN_S_MAP: {
    // North edge: broad open ground (cols 1-14) into the Reservoir's south
    // shore. Source and target ranges match exactly (both maps' open
    // borders are the same width and the landing row is walkable across
    // all of it), so crossing anywhere along this edge preserves the
    // column exactly -- no clamping in normal play. targetRange is omitted
    // here since it defaults to sourceRange when they're identical.
    north: [
      { targetMap: 'NORTH_BASIN_C_MAP', targetEdge: 'south', sourceRange: [1, 14] },
    ],
    // West edge: rows 9-11 into the Silt Flats, matching where the old
    // point-tile crossing already sat. Source and target ranges match
    // exactly here too.
    west: [
      { targetMap: 'NORTH_BASIN_SW_MAP', targetEdge: 'east', sourceRange: [9, 11] },
    ],
  },
  NORTH_BASIN_C_MAP: {
    south: [
      { targetMap: 'NORTH_BASIN_S_MAP', targetEdge: 'north', sourceRange: [1, 14] },
    ],
  },
  NORTH_BASIN_SW_MAP: {
    east: [
      { targetMap: 'NORTH_BASIN_S_MAP', targetEdge: 'west', sourceRange: [9, 11] },
    ],
    // North edge: cols 1-10 into the West Shore's south edge. The range stops
    // at col 10 (not 14) because the Silt Flats' reservoir finger (rows 1-3,
    // cols 11-13, WATER) backs onto the east end of this edge -- landing a
    // crossing there would strand the player on water. Source and target
    // ranges match exactly, so crossings within 1-10 never clamp. (Replaces
    // the old NORTH_BASIN_W_EXIT/ENTRANCE point-tile, retired like 84-87.)
    north: [
      { targetMap: 'NORTH_BASIN_W_MAP', targetEdge: 'south', sourceRange: [1, 10] },
    ],
  },
  NORTH_BASIN_W_MAP: {
    south: [
      { targetMap: 'NORTH_BASIN_SW_MAP', targetEdge: 'north', sourceRange: [1, 10] },
    ],
  },
};
window.EDGE_TRANSITIONS = EDGE_TRANSITIONS;

// Attempts an edge transition off activeMap in the given direction, from the
// player's current position. Returns true if a transition actually
// executed (activeMap/player position/facing were changed) — false in
// every other case (no configured link for this map+direction, the
// player's position is outside every segment's sourceRange, or a
// segment's condition blocked it). In every false case the caller should
// simply not move the player further in that direction, exactly as if a
// solid border tile had stopped them — this function never moves the
// player out of bounds and never throws.
function tryEdgeTransition(direction) {
  const mapId = mapRegistryId(activeMap);
  if (!mapId) return false;
  const segments = EDGE_TRANSITIONS[mapId] && EDGE_TRANSITIONS[mapId][direction];
  if (!segments) return false;

  // North/south edges: position along the edge is the column. East/west
  // edges: the row.
  const along = (direction === 'north' || direction === 'south')
    ? Math.floor(player.x / TILE)
    : Math.floor(player.y / TILE);

  for (const seg of segments) {
    const [srcMin, srcMax] = seg.sourceRange;
    if (along < srcMin || along > srcMax) continue; // this segment doesn't cover this position

    if (seg.condition && !seg.condition()) {
      if (seg.blockedText) showWorldToast(seg.blockedText);
      return false;
    }

    const targetMap = typeof seg.targetMap === 'string'
      ? (MAP_REGISTRY[seg.targetMap] && MAP_REGISTRY[seg.targetMap].map)
      : seg.targetMap;
    if (!targetMap) return false; // misconfigured segment — fail safe, don't move

    const [tgtMin, tgtMax] = seg.targetRange || seg.sourceRange;
    const clamped = Math.min(Math.max(along, tgtMin), tgtMax);

    activeMap = targetMap;
    switch (seg.targetEdge) {
      case 'south':
        player.x = (clamped + 0.5) * TILE;
        player.y = (ROWS - 2 + 0.5) * TILE; // one tile inside the south border
        player.facing = 'up';
        break;
      case 'north':
        player.x = (clamped + 0.5) * TILE;
        player.y = 1.5 * TILE;              // one tile inside the north border
        player.facing = 'down';
        break;
      case 'west':
        player.y = (clamped + 0.5) * TILE;
        player.x = 1.5 * TILE;              // one tile inside the west border
        player.facing = 'right';
        break;
      case 'east':
        player.y = (clamped + 0.5) * TILE;
        player.x = (COLS - 2 + 0.5) * TILE; // one tile inside the east border
        player.facing = 'left';
        break;
    }
    combat.cooldown = ENCOUNTER_COOLDOWN;
    return true;
  }
  return false; // no segment covered this position
}
window.tryEdgeTransition = tryEdgeTransition;

// ─── Debug-only: map warp tool ────────────────────────────────────────────────
// Backs the debug menu's warp screen (render-ui.js's drawWarpMenu(),
// input.js's warpMenu handling). Never called from normal gameplay code —
// only from debug-gated input, so it doesn't need (and deliberately
// doesn't do) any of the quest/dialogue side effects a real enter*()
// function might trigger.

// Finds the nearest walkable tile to (col, row) on the given map, searching
// outward ring by ring (radius 0, 1, 2, ...) up to the map's full size.
// Returns { col, row } or null if the map has no walkable tile at all
// (pathological, but this must never throw or infinite-loop if it happens).
function debugFindNearestWalkableTile(map, col, row) {
  const rows = map.length, cols = map[0].length;
  const maxRadius = rows + cols; // generous upper bound; terminates well before this in practice
  for (let radius = 0; radius <= maxRadius; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      const r = row + dr;
      if (r < 0 || r >= rows) continue;
      const dc = radius - Math.abs(dr);
      const candidates = dc === 0 ? [col] : [col - dc, col + dc];
      for (const c of candidates) {
        if (c < 0 || c >= cols) continue;
        if (WALKABLE[map[r][c]]) return { col: c, row: r };
      }
    }
  }
  return null;
}

// Warps the player to (col, row) on the map registered under mapId (checked
// against MAP_METADATA first, MAP_REGISTRY as a fallback so this keeps
// working even for a map that hasn't been given a metadata entry yet).
// Returns { success, message, col, row } — never throws, never leaves the
// player out of bounds or on an unwalkable tile.
function debugWarpToMap(mapId, col, row) {
  const meta          = (typeof MAP_METADATA !== 'undefined') ? MAP_METADATA[mapId] : undefined;
  const registryEntry = (typeof MAP_REGISTRY  !== 'undefined') ? MAP_REGISTRY[mapId]  : undefined;
  const targetMap = meta ? meta.map : (registryEntry ? registryEntry.map : undefined);

  if (!Array.isArray(targetMap)) {
    return { success: false, message: 'Warp failed: unknown map id "' + mapId + '"' };
  }

  const rows = targetMap.length, cols = targetMap[0].length;
  let targetCol = Math.min(Math.max(Math.round(col), 0), cols - 1);
  let targetRow = Math.min(Math.max(Math.round(row), 0), rows - 1);
  const clamped = (targetCol !== col || targetRow !== row);

  let landing = { col: targetCol, row: targetRow };
  let nudged = false;
  if (!WALKABLE[targetMap[targetRow][targetCol]]) {
    const found = debugFindNearestWalkableTile(targetMap, targetCol, targetRow);
    if (!found) {
      return { success: false, message: 'Warp failed: "' + mapId + '" has no walkable tile at all' };
    }
    landing = found;
    nudged = true;
  }

  // Clean baseline: warping always resets every special location flag, then
  // sets activeMap/position directly -- no enter*() function is called, so
  // no quest/dialogue/combat side effect can fire as a result of a warp.
  inDungeon = false; inDungeonEntrance = false; inTown = false; inSluice = false;
  inMireVault = false; inTakomo = false; inFenBrewery = false; inHamletInterior = false;
  inLorraHouse = false; inMarenPost = false; inDrenwrickPost = false; inBridgePost = false;
  inSmugglerFort = false;

  activeMap     = targetMap;
  player.x      = (landing.col + 0.5) * TILE;
  player.y      = (landing.row + 0.5) * TILE;
  player.facing = 'down';
  combat.cooldown = ENCOUNTER_COOLDOWN;

  const displayName = meta ? meta.displayName : mapId;
  let message = 'Warped to ' + displayName + ' (col ' + landing.col + ', row ' + landing.row + ')';
  if (clamped) message += ' — target coordinate was out of bounds, clamped';
  if (nudged)  message += ' — nearest walkable tile used (original spot was blocked)';
  if (meta && meta.type !== 'outdoor') {
    message += '. Note: "' + meta.type + '"-type maps need extra state (town building, dungeon floor, etc) that this tool does not set — location name/items/encounters may not fully match normal play here.';
  }
  return { success: true, message, col: landing.col, row: landing.row };
}
window.debugFindNearestWalkableTile = debugFindNearestWalkableTile;
window.debugWarpToMap = debugWarpToMap;

// Returns a per-direction summary of EDGE_TRANSITIONS for the given map id:
// { north: [...], south: [...], east: [...], west: [...] }, each either
// null (no entry configured for that direction) or an array of
// { sourceRange, targetMapId, targetDisplayName, unlocked, blockedText }.
// Used by the debug map inspector (render-ui.js's drawDebugInspector()) to
// answer requirement 5 ("show edge transition data for the current map").
function debugEdgeTransitionSummary(mapId) {
  const dirs = ['north', 'south', 'east', 'west'];
  const out = {};
  const entries = (typeof EDGE_TRANSITIONS !== 'undefined') ? EDGE_TRANSITIONS[mapId] : undefined;
  for (const dir of dirs) {
    const segments = entries ? entries[dir] : undefined;
    if (!segments || segments.length === 0) { out[dir] = null; continue; }
    out[dir] = segments.map(seg => {
      const targetMapId = typeof seg.targetMap === 'string' ? seg.targetMap : mapRegistryId(seg.targetMap);
      const targetMeta = (typeof MAP_METADATA !== 'undefined' && targetMapId) ? MAP_METADATA[targetMapId] : undefined;
      return {
        sourceRange:       seg.sourceRange,
        targetMapId:       targetMapId,
        targetDisplayName: targetMeta ? targetMeta.displayName : (targetMapId || '?'),
        unlocked:          !seg.condition || !!seg.condition(),
        blockedText:       seg.blockedText || null,
      };
    });
  }
  return out;
}
window.debugEdgeTransitionSummary = debugEdgeTransitionSummary;

// Best-effort "what's right here" check for the player's CURRENT position:
// a point-transition tile (matched by name keyword — EXIT/ENTRANCE/DOOR/
// GATE/STAIRS — via tiles.js's debugTileName()), an open or blocked edge
// transition if standing within 1 tile of a configured edge, or 'none
// nearby'. This is a display heuristic only (used by drawDebugInspector()),
// never gameplay logic — the real transitions are still driven entirely by
// movement.js's curTile checks and the edge-transition interception there.
function debugNearbyTransitionInfo() {
  const mapId = mapRegistryId(activeMap);
  const col = Math.floor(player.x / TILE), row = Math.floor(player.y / TILE);
  const tile = activeMap[row] ? activeMap[row][col] : undefined;
  const tileName = (typeof debugTileName === 'function' && tile !== undefined) ? debugTileName(tile) : null;

  const POINT_TRANSITION_KEYWORDS = ['EXIT', 'ENTRANCE', 'DOOR', 'GATE', 'STAIRS'];
  if (tileName && POINT_TRANSITION_KEYWORDS.some(k => tileName.includes(k))) {
    return 'point transition tile (' + tileName + ')';
  }

  const edges = mapId ? debugEdgeTransitionSummary(mapId) : null;
  if (edges) {
    const checks = [
      ['north', row <= 1,          col],
      ['south', row >= ROWS - 2,   col],
      ['west',  col <= 1,          row],
      ['east',  col >= COLS - 2,   row],
    ];
    for (const [dir, nearEdge, along] of checks) {
      if (!nearEdge || !edges[dir]) continue;
      const match = edges[dir].find(seg => along >= seg.sourceRange[0] && along <= seg.sourceRange[1]);
      if (match) return 'edge transition (' + dir + (match.unlocked ? ', open -> ' + match.targetDisplayName : ', BLOCKED') + ')';
    }
  }
  return 'none nearby';
}
window.debugNearbyTransitionInfo = debugNearbyTransitionInfo;

