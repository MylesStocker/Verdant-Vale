'use strict';

// Southern Moraine: the better-drained rolling woodland/meadow/gravel-ridge
// belt south of the Mornay peninsula, on the same glacial-moraine ridge the
// peninsula caps. Entered only through a single reed-gap seam opened in the
// south border of the converted EASTERN_FENS_ENVELOPE_C15R5_MAP, then
// branching into a short network of coves and ridges. Entirely roadless;
// walkable throughout; encounters enabled immediately using the established
// hard Eastern Fens/Mornay formation pool. Reserves (does not build) space
// for one future modest road-market town and one future quarry/forestry/
// road-maintenance outpost -- recorded in OVERWORLD_ATLAS.md only.

const SOUTHERN_MORAINE_REGIONAL_CHUNK_DEFINITIONS = [
  { mapId: 'SOUTHERN_MORAINE_C14R6_MAP', regionId: 'overworld', chunkX: 14, chunkY: 6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Mixed Woodland', region: 'Southern Moraine', contentKey: 'southern_moraine_14_6',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Southern Moraine walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'SOUTHERN_MORAINE_C15R6_MAP', regionId: 'overworld', chunkX: 15, chunkY: 6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  0,  1], // 5
      [  0,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0], // 6
      [  0,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0], // 7
      [  0,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Meadow', region: 'Southern Moraine', contentKey: 'southern_moraine_15_6',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Southern Moraine walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'SOUTHERN_MORAINE_C16R6_MAP', regionId: 'overworld', chunkX: 16, chunkY: 6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,  0], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  0], // 7
      [  0,  0,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Gravel Ridge', region: 'Southern Moraine', contentKey: 'southern_moraine_16_6',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Southern Moraine walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'SOUTHERN_MORAINE_C17R6_MAP', regionId: 'overworld', chunkX: 17, chunkY: 6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 7
      [  0,  0,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  0,  1], // 8
      [  1,  0,  0,  0,  0,127,127,127,127,127,127,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,127,127,127,127,127,127,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,127,127,127,127,127,127,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Kettle Pond', region: 'Southern Moraine', contentKey: 'southern_moraine_17_6',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Southern Moraine walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'SOUTHERN_MORAINE_C16R7_MAP', regionId: 'overworld', chunkX: 16, chunkY: 7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  1], // 6
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  1], // 7
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  1], // 8
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0, 23,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0, 23, 23, 23, 23, 23, 23, 23, 23,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Meadow', region: 'Southern Moraine', contentKey: 'southern_moraine_16_7',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Southern Moraine walkable wilderness; hard-pool encounters active immediately.' },
  { mapId: 'SOUTHERN_MORAINE_C17R7_MAP', regionId: 'overworld', chunkX: 17, chunkY: 7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,  1], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  1], // 7
      [  1,  0,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,  0,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Gravel Ridge', region: 'Southern Moraine', contentKey: 'southern_moraine_17_7',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Southern Moraine walkable wilderness; hard-pool encounters active immediately.' },
];

// Southern Moraine envelope: scenery-only framing closing the
// zero-visible-void camera envelope around the irregular walkable spine.
const SOUTHERN_MORAINE_ENVELOPE_CHUNK_DEFINITIONS = [
  { mapId: 'SOUTHERN_MORAINE_ENVELOPE_C13R6_MAP', regionId: 'overworld', chunkX: 13, chunkY: 6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1], // 8
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Framing', region: 'Southern Moraine', contentKey: 'southern_moraine_env_13_6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Southern Moraine\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'SOUTHERN_MORAINE_ENVELOPE_C13R7_MAP', regionId: 'overworld', chunkX: 13, chunkY: 7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,127,  1,  1,120,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Framing', region: 'Southern Moraine', contentKey: 'southern_moraine_env_13_7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Southern Moraine\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'SOUTHERN_MORAINE_ENVELOPE_C14R7_MAP', regionId: 'overworld', chunkX: 14, chunkY: 7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Framing', region: 'Southern Moraine', contentKey: 'southern_moraine_env_14_7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Southern Moraine\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'SOUTHERN_MORAINE_ENVELOPE_C15R7_MAP', regionId: 'overworld', chunkX: 15, chunkY: 7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1], // 9
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Framing', region: 'Southern Moraine', contentKey: 'southern_moraine_env_15_7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Southern Moraine\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'SOUTHERN_MORAINE_ENVELOPE_C18R6_MAP', regionId: 'overworld', chunkX: 18, chunkY: 6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 2
      [  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Framing', region: 'Southern Moraine', contentKey: 'southern_moraine_env_18_6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Southern Moraine\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'SOUTHERN_MORAINE_ENVELOPE_C18R7_MAP', regionId: 'overworld', chunkX: 18, chunkY: 7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Framing', region: 'Southern Moraine', contentKey: 'southern_moraine_env_18_7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Southern Moraine\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'SOUTHERN_MORAINE_ENVELOPE_C17R5_MAP', regionId: 'overworld', chunkX: 17, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1, 81,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Framing', region: 'Southern Moraine', contentKey: 'southern_moraine_env_17_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only framing chunk closing the Southern Moraine\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
];
