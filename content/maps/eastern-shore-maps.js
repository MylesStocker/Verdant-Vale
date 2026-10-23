'use strict';

// Eastern Shore: the storm-exposed shingle/clay-bank/wind-shaped-woodland
// transition east of the Mornay peninsula. Entered only through a single
// reed-gap seam opened in the south border of the converted
// EASTERN_FENS_ENVELOPE_C18R1_MAP, then branching east along the shore.
// Entirely roadless; walkable throughout; encounters enabled immediately
// using the established hard Eastern Fens/Mornay formation pool. Ends at
// (19,4) without defining Valmere's future outlet corridor -- its course
// and destination are reserved for a later increment, not built here.
// None of the six protected Mornay peninsula grids are touched.

const EASTERN_SHORE_REGIONAL_CHUNK_DEFINITIONS = [
  { mapId: 'EASTERN_SHORE_C18R2_MAP', regionId: 'overworld', chunkX: 18, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,129,128,  1,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,128,  1,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Storm Shingle', region: 'Eastern Shore', contentKey: 'eastern_shore_18_2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Eastern Shore walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'EASTERN_SHORE_C19R2_MAP', regionId: 'overworld', chunkX: 19, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81, 88,  0,  0,  1], // 4
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0, 81,  0,  0, 81,  0, 88, 81,  0,  0,  0,  0,  0,  0], // 6
      [  0,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0], // 7
      [  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,128,  0,  0,  0], // 8
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Clay Bank', region: 'Eastern Shore', contentKey: 'eastern_shore_19_2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Eastern Shore walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'EASTERN_SHORE_C20R2_MAP', regionId: 'overworld', chunkX: 20, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,120,  0,  3,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,119,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,119,  0,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  0,119,  0,  1], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,119,  0,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,119,  0,  1], // 9
      [  1,  0,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Wind-Shaped Woodland', region: 'Eastern Shore', contentKey: 'eastern_shore_20_2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Eastern Shore walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'EASTERN_SHORE_C18R3_MAP', regionId: 'overworld', chunkX: 18, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,129,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  1], // 9
      [  1,  0,  0, 23, 23, 23, 23,127, 23, 23, 23, 23, 23,  0,  0,  1], // 10
      [  1,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  1], // 11
      [  1,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Sheltered Cove', region: 'Eastern Shore', contentKey: 'eastern_shore_18_3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Eastern Shore walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'EASTERN_SHORE_C19R3_MAP', regionId: 'overworld', chunkX: 19, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,129,128,  1,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,128,  1,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,128,  1,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Storm Shingle', region: 'Eastern Shore', contentKey: 'eastern_shore_19_3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Eastern Shore walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'EASTERN_SHORE_C19R4_MAP', regionId: 'overworld', chunkX: 19, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,129,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 8
      [  1,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  1], // 9
      [  1,  0,  0, 23, 23, 23, 23,127, 23, 23, 23, 23, 23,  0,  0,  1], // 10
      [  1,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  1], // 11
      [  1,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Sheltered Cove', region: 'Eastern Shore', contentKey: 'eastern_shore_19_4',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Eastern Shore walkable wilderness; hard-pool encounters active immediately.' },
];

// Eastern Shore envelope: scenery-only framing closing the zero-visible-
// void camera envelope around the irregular walkable spine.
const EASTERN_SHORE_ENVELOPE_CHUNK_DEFINITIONS = [
  { mapId: 'EASTERN_SHORE_ENVELOPE_C17R2_MAP', regionId: 'overworld', chunkX: 17, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_17_2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_SHORE_ENVELOPE_C20R1_MAP', regionId: 'overworld', chunkX: 20, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1], // 9
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_20_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_SHORE_ENVELOPE_C20R3_MAP', regionId: 'overworld', chunkX: 20, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,127,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_20_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_SHORE_ENVELOPE_C17R3_MAP', regionId: 'overworld', chunkX: 17, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_17_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_SHORE_ENVELOPE_C20R4_MAP', regionId: 'overworld', chunkX: 20, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1], // 10
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_20_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_SHORE_ENVELOPE_C18R4_MAP', regionId: 'overworld', chunkX: 18, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,121,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_18_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_SHORE_ENVELOPE_C17R4_MAP', regionId: 'overworld', chunkX: 17, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1], // 1
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1, 81,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_17_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_SHORE_ENVELOPE_C19R5_MAP', regionId: 'overworld', chunkX: 19, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_19_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_SHORE_ENVELOPE_C20R5_MAP', regionId: 'overworld', chunkX: 20, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,120,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1], // 9
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_20_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_SHORE_ENVELOPE_C18R5_MAP', regionId: 'overworld', chunkX: 18, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1, 81,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1], // 8
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Framing', region: 'Eastern Shore', contentKey: 'eastern_shore_env_18_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Eastern Shore\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
];
