'use strict';

// North Basin / Eastern Reaches NPCs. Loaded before npcs.js, which merges this
// geographic fragment into SIMPLE_NPCS.

// The cable scow and its operator travel with Lely. Their moored side is derived
// from the canonical active regional chunk, so saving on either bank restores a
// coherent service without introducing mutable ferry-position state.
function causewayFerryMooredMapId() {
  const active = (typeof regionalActiveMapId === 'function') ? regionalActiveMapId() : null;
  return active === 'EASTERN_BANK_MAP' ? 'EASTERN_BANK_MAP' : 'EAST_CAUSEWAY_MAP';
}

const NORTH_BASIN_NPCS = [
  {
    id: 'causeway_ferry_operator',
    name: 'Ferry Operator',
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
    spriteType: 'worker',
    dialogue: [['“Official crossings only.”']],
    flag_required: null,
    flag_sets: null,
    action: 'causewayFerry',
  },
];
