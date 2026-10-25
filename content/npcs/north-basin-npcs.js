'use strict';

// North Basin / Eastern Reaches NPCs. Loaded before npcs.js, which merges this
// geographic fragment into SIMPLE_NPCS.

// The cable scow and its operator travel with Lely. Their moored side is derived
// from canonical regional position relative to the ferry boundary, so continuing
// east, saving there, or using a debug warp cannot strand a redundant boat flag.
function causewayFerryMooredMapId() {
  const position = (typeof regionalWorldPosition === 'function') ? regionalWorldPosition() : null;
  const eastPlacement = (typeof regionPlacementForMapId === 'function')
    ? regionPlacementForMapId('EASTERN_BANK_MAP')
    : null;
  if (position && position.regionId === 'overworld' && eastPlacement &&
      position.worldPxX >= eastPlacement.chunkX * COLS * TILE) return 'EASTERN_BANK_MAP';
  return 'EAST_CAUSEWAY_MAP';
}

const NORTH_BASIN_NPCS = [
  {
    id: 'causeway_ferry_operator',
    name: 'Imperial Guard',
    get map() {
      if (typeof MainQuest === 'undefined' || MainQuest < 5) return null;
      return causewayFerryMooredMapId() === 'EASTERN_BANK_MAP' ? 'eastern_bank' : 'east_causeway';
    },
    get physicalMapId() {
      if (typeof MainQuest === 'undefined' || MainQuest < 5) return null;
      return causewayFerryMooredMapId();
    },
    // The west-bank position stays clear of the established causeway inspect at
    // (10.5, 8.5), so both interactions remain independently reachable.
    get x() { return causewayFerryMooredMapId() === 'EASTERN_BANK_MAP' ? 5.5 * TILE : 8.5 * TILE; },
    y: 7.5 * TILE,
    solid: false,
    facing: 'down',
    spriteType: 'clerk', // established Imperial guard uniform
    dialogue: [['“Official crossings only.”']],
    flag_required: null,
    flag_sets: null,
    action: 'causewayFerry',
  },
];
