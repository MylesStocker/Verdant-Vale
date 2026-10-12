'use strict';

// Eastern Fens terrain skeleton. Twenty-three encounter-free regional chunks
// carry the MQ5 route east from EASTERN_BANK_MAP, then north beside a navigable
// channel to the Valmere's southern shore. The winding raised road, reedbelt
// detour, reserved travellers' rise, managed drainage, open water, and unfinished
// port threshold are terrain/topology only: no content, actors, items, triggers,
// or persistent state are authored here.

const EASTERN_FENS_REGIONAL_CHUNK_DEFINITIONS = [
  // (6,2) Western old embankment beyond the ferry landing.
  { mapId: 'EASTERN_FENS_EMBANKMENT_W_MAP', regionId: 'overworld', chunkX: 6, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,  1,127,127,127,127,  1,127,127,127,127,  1, 81,127,127,  1], //  1
      [  1,127,  1, 23,127,127,127,  1,127,127,127, 88,  1,127, 23, 23], //  2
      [  1,127,127,  1,127,127,127, 81,  1,127,127,127,  2,  2,  2,  2], //  3
      [  1,127,127,127,  1,127, 88,127,  1,  1,  1,  1,  2,127, 23, 23], //  4
      [  1,127, 81,127,127,  1,127,127,  1,  1,  1,  1,  2,127,127,  1], //  5
      [  1, 88,127,127,127,127,  1,127,  1,  1,  1,  1,  2,127, 81,  1], //  6
      [ 23, 23,  1,127,127,127,127,  1,  1,  1,  1,  1,  2,127,127,  1], //  7
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  1,  1,  1,  2,  1,127,  1], //  8
      [ 23, 23,127,127,  1,127,127,127,  2,  1,127,127,  2,127,  1,  1], //  9
      [  1,127,127,127, 81,  1,127,127,  2,  2,  2,  2,  2,127,127,  1], // 10
      [  1,  1,127, 88,127,127,  1,127,127,127,127,  1,127,127,127,  1], // 11
      [  1,127,  1,127,127,127,127, 23,127,127,127,127,  1,127,127,  1], // 12
      [  1,127,127,  1,127,127,127,127,  1,127,127, 81,127,  1,127,  1], // 13
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Old Embankment', region: 'Eastern Fens', contentKey: 'eastern_fens_01',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'Western old embankment beyond the ferry landing. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (7,2) The raised road turns north around deeper water.
  { mapId: 'EASTERN_FENS_EMBANKMENT_E_MAP', regionId: 'overworld', chunkX: 7, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  2, 23,  1,  1], //  0
      [  1, 81,127,  1,127,127,127,127,  1, 23,127, 23,  2, 23,127,  1], //  1
      [ 23, 23,127,127,  1,127,127,127,127,  1,127,127,  2,127,  1,  1], //  2
      [  2,  2,  2,  2,  2,  2,  2,127,127,127,  1,127,  2,127,127,  1], //  3
      [ 23, 23,127,127,127,127,  2,  1,  1,  1,  1,  1,  2,127,127,  1], //  4
      [  1,127,  1,127,127,127,  2,  1,  1,  1,  1,  1,  2,127,127,  1], //  5
      [  1,127,127, 81,127,127,  2,  1,  1,  1,  1,  1,  2,  1,127,  1], //  6
      [  1,127, 88,127,  1,127,  2,  1,  1,  1,  1,  1,  2,127,  1,  1], //  7
      [  1,127,127,127,127,  1,  2,  2,  2,  2,  2,  2,  2,127, 88,  1], //  8
      [  1,  1,127,127,127,127,  1,127,127,127,127,  1,127,127,127,  1], //  9
      [  1, 23,  1,127,127,127,127,  1,127, 88,127,127,  1,127,127,  1], // 10
      [  1,127,127,  1,127, 81,127,127,  1,127,127,127,127, 23,127,  1], // 11
      [  1,127,127,127, 88,127,127,127,127,  1,127,127,127,127,  1,  1], // 12
      [  1,127,127,127,127,  1,127,127, 23,127,  1,127,127,127,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Old Embankment', region: 'Eastern Fens', contentKey: 'eastern_fens_02',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'The raised road turns north around deeper water. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (7,1) A weathered timber walk begins the reedbelt detour.
  { mapId: 'EASTERN_FENS_REEDBELT_N_MAP', regionId: 'overworld', chunkX: 7, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,127,127,127,127,  1, 81,127,127,127,  1,127,127,127,127,  1], //  1
      [  1,  1, 23,127,127,127,  1,127,127,127, 23,  1,127,127,127,  1], //  2
      [  1, 81,  1,127,127,127,127,  1,127,127,127,127,  1,127, 23,  1], //  3
      [127,127,127,  1,127, 23,127,127,  1,127,127,127,127, 81,127,  1], //  4
      [  1,127,127,127,  1,127,127,127,127, 23,127,127,127,127,  1,  1], //  5
      [  1,127,127,127,127,  1,127,127,127,127,  1,127,127,127,127,  1], //  6
      [  1,  1,127,127,127, 58, 58, 58, 58, 58, 58, 58, 58,127,127,  1], //  7
      [  1,127,  1, 81,127, 58,127,  1,127,127,127,127, 58,127,127,  1], //  8
      [  1,127,127,  1,127, 58,127,127,  1,127,127,127, 58,  1, 23, 23], //  9
      [  1,127,127,127,  1, 58, 58, 58, 58, 58, 58, 58, 58, 58, 58, 58], // 10
      [  1,127, 23,127,127,  1,127,127,127,127,  1,127, 58,127, 23, 23], // 11
      [  1,  1,127,127,127,127, 23,127,127,127,127,  1, 58,127, 23,  1], // 12
      [  1,127,  1,127,127, 81,127,  1,127,127,127, 23, 58, 23,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23, 58, 23,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Reedbelt', region: 'Eastern Fens', contentKey: 'eastern_fens_03',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'A weathered timber walk begins the reedbelt detour. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (8,1) The old line has failed; the maintained walk bends south.
  { mapId: 'EASTERN_FENS_REEDBELT_E_MAP', regionId: 'overworld', chunkX: 8, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,127,  1,127,127,127,127,  1, 23,127,127,127,  1,127,127,  1], //  1
      [  1,127,127,  1,127,127,127, 81,  1,127,127,127,127,  1,127,  1], //  2
      [  1,127,127, 23,  1,127,127,127,127,  1,127, 23,127,127,  1,  1], //  3
      [  1,127, 81,127, 58, 58, 58, 58, 58,127,  1,127,127,127,127,  1], //  4
      [  1,  1,127,127, 58,127,  1,127, 58,127,127,  1,127,127, 81,  1], //  5
      [  1,127,  1,127, 58,127,127,  1, 58,127, 23,127,  1,127,127,  1], //  6
      [  1, 23,127,  1, 58,127,127,127, 58,127,127,127,127,  1,127,  1], //  7
      [  1,127,127,127, 58,127,127,127, 58,  1,127,127,127, 23,  1,  1], //  8
      [ 23, 23,127,127, 58,  1,127,127, 58,127,  1,127,127,127,127,  1], //  9
      [ 58, 58, 58, 58, 58, 58, 58, 58, 58,127,127,  1,127,127,127,  1], // 10
      [ 23, 23,  1,127, 58,127,127,  1,127,127,127,127, 23,127,127,  1], // 11
      [  1,127,127,  1, 58,127,127,127,  1,127,127, 81,127,  1,127,  1], // 12
      [  1,127,127, 23, 58, 23,127, 23,127,  1,127,127,127,127,  1,  1], // 13
      [  1,  1,  1, 23, 58, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Reedbelt', region: 'Eastern Fens', contentKey: 'eastern_fens_04',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'The old line has failed; the maintained walk bends south. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (8,2) The detour regains firmer embankment ground.
  { mapId: 'EASTERN_FENS_REEDBELT_S_MAP', regionId: 'overworld', chunkX: 8, chunkY: 2, map: [
      [  1,  1,  1, 23,  2, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,127,127, 23,  2, 23,127,  1,127,  1,127,127,127, 81,  1,  1], //  1
      [  1,127,127,127,  2,  1,127,  1,127, 23,  1,127,127,127,127,  1], //  2
      [  1,  1,127,127,  2,127,  1,  1,  1,127,127,  1,127,127,127,  1], //  3
      [  1,127,  1,127,  2,127,127,  1,  1,127,  2,  2,  2,  2,  2,  2], //  4
      [  1,127,127,  1,  2,127,127,  1,  1,127,  2,127,127,  1, 23,  2], //  5
      [  1,127,127,127,  2,127,127,  1,  1,  1,  2,127,127,127, 23,  2], //  6
      [  1,127,127,127,  2,  1,127,  1,  1,127,  2,127,127,127, 23, 23], //  7
      [  1,  1, 23,127,  2,  2,  2,  2,  2,  2,  2,  1,127,127,127,  1], //  8
      [  1,127,  1,127,127,127,127,  1,127,127,127,127,  1,127, 23,  1], //  9
      [  1,127,127,  1,127, 81,127,127,  1,127,127,127,127,  1,127,  1], // 10
      [  1, 23,127,127,  1,127,127,127,127, 23,127,127,127,127,  1,  1], // 11
      [  1,127,127,127,127,  1,127,127,127,127,  1,127,127, 23,127,  1], // 12
      [  1,  1,127,127, 23,127,  1,127,127,127,127,  1, 81,127,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Reedbelt', region: 'Eastern Fens', contentKey: 'eastern_fens_05',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'The detour regains firmer embankment ground. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (9,2) A quieter approach to the first sustained dry rise.
  { mapId: 'EASTERN_FENS_DRY_RISE_APPROACH_MAP', regionId: 'overworld', chunkX: 9, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,127, 88,127,  1,127,  1,127,  1,127,  1,127,  1,127,  1,  1], //  1
      [  1,127,127,127,127,127,  2,  2,  2,  2,  2,  2,  2,127, 88,  1], //  2
      [  1,127,127,127,127,127,  2,127,127,127,127,127,  2,127,127,  1], //  3
      [  1, 23,127,  1,127,  1,  2,  1,127, 88,127,  1,  2,  1,127,  1], //  4
      [ 23, 23,127,127,127,127,  2,127,127,127,127,127,  2,127,127,  1], //  5
      [  2,  2,  2,  2,  2,  2,  2,127,127,127,127,127,  2,127,127,  1], //  6
      [ 23, 23,  1,127,  1,127,  1,127, 23,127,  1,127,  2,127,  1,  1], //  7
      [  1,  1,127,127,127,127,127,127,127,127,127,127,  2,127,127,  1], //  8
      [  1,  1,127, 23,127,127,127,127,127,127,127,127,  2,127,127,  1], //  9
      [  1,  1,  1,  1,127,  1,127, 81,127,  1,127,  1,  2,  1,127,  1], // 10
      [  1,  1,  1,127,127,127, 88,127,127,127,127,127,  2,127,127,  1], // 11
      [  1,  1,  1,127,127,127,127,127,127,127, 23,127,  2,127,127,  1], // 12
      [  1,  1,  1,127,  1,127,  1,127,  1,127,  1, 23,  2, 23, 81,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  2, 23,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Dry Rise', region: 'Eastern Fens', contentKey: 'eastern_fens_06',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'A quieter approach to the first sustained dry rise. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (9,3) An ordinary dry rise on the old road; the longer journey's camp reservation lies farther east.
  { mapId: 'EASTERN_FENS_DRY_RISE_MAP', regionId: 'overworld', chunkX: 9, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  2, 23,  1,  1], //  0
      [  1,127,127,127,127,127,127,127,127,127,127, 23,  2, 23,127,  1], //  1
      [  1,127,127,127,127,127,127,127,127,127,127,127,  2,127,127,  1], //  2
      [  1,  1,127,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  1,127,  1], //  3
      [  1,127,127,  2,  0,  0,  0,  0,  0,  0,  0,  0,127,127,127,  1], //  4
      [  1,127,127,  2,  0,  0,  0,  0,  0,  0,  0,  0,127,127,127,  1], //  5
      [  1,127,  1,  2,  0,  0,  0,  0,  0,  0,  0,  0,  1,127,  1,  1], //  6
      [  1,127,127,  2,  0,  0,  0, 88, 88,  0,  0,  0,127,127,127,  1], //  7
      [  1,127,127,  2,  0,  0,  0,  0,  0,  0,  0,  0,127,127,127,  1], //  8
      [  1,  1,127,  2,  0,  0,  0,  0,  0,  0,  0,  0,127,  1,127,  1], //  9
      [  1,127,127,  2,  0,  0,  0,  0,  0,  0,  0,  0,127,127, 23, 23], // 10
      [  1,127,127,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2], // 11
      [  1,127,  1,127,  1,127,  1,127,  1,127,  1,127,  1,127, 23, 23], // 12
      [  1,127,127,127,127,127,127,127,127,127,127,127,127,127,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Dry Rise', region: 'Eastern Fens', contentKey: 'eastern_fens_07',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'An ordinary sheltered dry rise on the old embankment. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (10,3) The first regular drainage cuts and maintained banks.
  { mapId: 'EASTERN_FENS_DRAINAGE_SW_MAP', regionId: 'overworld', chunkX: 10, chunkY: 3, map: [
      [  1,  1, 23,  2, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,  1, 23,  2, 23,  1,127,127,127,  0,127,127,  1,127,127,  1], //  1
      [  1,  1,  1,  2,127, 23,127,127,127,127,  1,127,127, 23,127,  1], //  2
      [  1,  1,  1,  2,127,127,127,127,  1,127,127,127, 89,127,127,  1], //  3
      [  1,  1,  1,  2,127,127,  1,127,127,127,127,127,127,  1,127,  1], //  4
      [  1,  1,  1,  2,  2,  2,  2,  2,  2,127,127,  1, 23,127,127,  1], //  5
      [  1,  1,  1,127,127,127,127,127,  2,  1,127,  0,127,127,127,  1], //  6
      [  1,  1,  1,127,127,127,127,  1,  2,127,127,127,127,127,  1,  1], //  7
      [  1,  1,  1,127,127,  1,  0,127,  2,127,127,127,  1,127, 89,  1], //  8
      [  1,  1,  1,  1,127,127,127,127,  2,127, 23,127,127,127,127,  1], //  9
      [ 23, 23,127,127,127,127,127,127,  2,127,127,127,127,127, 23,  1], // 10
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,127,127,127,127,  0,127,  1], // 11
      [ 23, 23,127,127,  1,127,127,127,127, 23,127,  1,127,127,127,  1], // 12
      [  1,127,  1,127,127,127,127,127,  0,  1,127,127,127,127,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Managed Drainage', region: 'Eastern Fens', contentKey: 'eastern_fens_08',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'The first regular drainage cuts and maintained banks. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (10,2) Worked reed plots sit behind narrow drainage cuts.
  { mapId: 'EASTERN_FENS_DRAINAGE_NW_MAP', regionId: 'overworld', chunkX: 10, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], //  0
      [  1,127,  1,127,127,127, 89,127,127,  1,127, 23,127,127,127,  1], //  1
      [  1,127, 23,127,127,127,127,  1,127,127,  0,127,127,127,  1,  1], //  2
      [  1, 89,127,127,127,  1, 23,127,127,127,127,127,  1,127, 23,  1], //  3
      [  1,127,127,  1,127,  0,127,127,127,127,  1,127,127, 89,127,  1], //  4
      [  1, 23,127,127,127,127,127,127,  1,127,127,127,127,127,127,  1], //  5
      [  1,127,127,  2,  2,  2,  2,  2,  2,  2,127,127,127, 23,127,  1], //  6
      [  1,127,127,  2,  1,127,127,127,127,  2,127,  1,  0,127,127,  1], //  7
      [  1,127,  1,  2,127,127,127,127,127,  2,127,127,127,127,127,  1], //  8
      [  1,127,127,  2,127,127,127,  0,127,  2,127,127,127,127,  1,  1], //  9
      [  1,127,127,  2,127,  1,127,127,127,  2,127,127,  1,127, 23, 23], // 10
      [  1,127,127,  2,127,127,127,127,127,  2,  2,  2,  2,  2,  2,  2], // 11
      [  1,  1,127,  2,127,127, 23,127,  1,127,127,127,127,127, 23, 23], // 12
      [  1,127, 23,  2, 23, 89,  1,127,127,127, 23,127,127,  1,127,  1], // 13
      [  1,  1, 23,  2, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Managed Drainage', region: 'Eastern Fens', contentKey: 'eastern_fens_09',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'Worked reed plots sit behind narrow drainage cuts. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (11,2) Long maintained banks divide harvested reed beds.
  { mapId: 'EASTERN_FENS_WORKED_REEDS_MAP', regionId: 'overworld', chunkX: 11, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,127,127,127,127,127,  1,127,127,127,127,127,127,  1, 23, 23], //  1
      [  1,127,127,127,  1,127,127,127,  2,  2,  2,  2,  2,  2,  2,  2], //  2
      [  1,127,  1, 23,127,127,127,127,  2,  1,127,127,127,127, 23, 23], //  3
      [  1,127, 89,127,127,127,127,  1,  2,127,127,127,127,127,  1,  1], //  4
      [  1,127,127,127,127,  1,  0,127,  2,127,127,127,  1,127, 89,  1], //  5
      [  1,127, 23,  1,127,127,127,127,  2,127, 23,127,127,127,127,  1], //  6
      [  1,  0,127,127,127,127,127,127,  2,127,127,127,127,127, 23,  1], //  7
      [  1,127,127,127,127, 23,  1,127,  2,127,127,127,127,  0,127,  1], //  8
      [  1,127,127,127, 89,127,127,127,  2,127,127,  1,127,127,127,  1], //  9
      [ 23, 23,  1,127,127,127,127,127,  2,  1,127,127,127,127,127,  1], // 10
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,127,127,127, 23,127,  1,  1], // 11
      [ 23, 23,127,127,127,  1,127,127,127,127,127, 89,  1,127,127,  1], // 12
      [  1,127,127,  1,127,127,127, 23,127,127,  1,127,127,127,127,  1], // 13
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14  col2 opens the structural seam south into EASTERN_FENS_REED_HOLLOW_MAP (11,3)
    ],
    displayName: 'Eastern Fens — Managed Drainage', region: 'Eastern Fens', contentKey: 'eastern_fens_10',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'Long maintained banks divide harvested reed beds. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (12,2) The road turns south through increasingly regular plots.
  { mapId: 'EASTERN_FENS_MANAGED_REEDS_MAP', regionId: 'overworld', chunkX: 12, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [ 23, 23,127,  1,127,127,127,127,127,127,  1,127,127, 89,127,  1], //  1
      [  2,  2,  2,  2,  2,  2,  2,127,  1, 23,127,127,127,127,127,  1], //  2
      [ 23, 23,127,127,127,127,  2,127, 89,127,127,127,127, 23,127,  1], //  3
      [  1,  1,  1,127, 23,127,  2,127,127,127,127,  1,  0,127,127,  1], //  4
      [  1,  1,  1, 89,127,127,  2,127, 23,  1,127,127,127,127,127,  1], //  5
      [  1,  1,  1,127,127,127,  2,  1,127,127,127,127,127,127,  1,  1], //  6
      [  1,  1,  1, 23,127,  1,  2,127,127,127,127, 23,  1,127,127,  1], //  7
      [  1,  1,  1,  1,127,127,  2,127,127,127,  1,127,127,127,127,  1], //  8
      [  1,  1,  1,127,127,127,  2,  2,  2,  2,  2,127,127,127,  0,  1], //  9
      [  1,127,127,127,127, 89,  1,127,127,127,  2,127,127,  1,127,  1], // 10
      [  1, 23,127,127,  1,127,127,127,127,127,  2,  1,127,127,127,  1], // 11
      [  1,127,  1,127,127, 23,127,127,127,  1,  2,127,127, 23,127,  1], // 12
      [  1,127,127,127,  0,127,127,  1,127, 23,  2, 23, 89,127,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  2, 23,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Managed Drainage', region: 'Eastern Fens', contentKey: 'eastern_fens_11',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'The road turns south through increasingly regular plots. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (12,3) Reserved future camp location: a dry travellers' rise before the widening waterways, with no trigger, dialogue, NPC, state, or event.
  { mapId: 'EASTERN_FENS_TRAVELLERS_RISE_MAP', regionId: 'overworld', chunkX: 12, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1], //  0
      [  1,127,127,127,127,127,127, 23,  0,  0,  2,  0,  0, 23,127,  1], //  1
      [  1,127,127,127,127,127, 23,  0,  0, 88,  2,  0,  0,  0, 23,  1], //  2
      [  1,127,127,127,127, 23,  0,  0, 88, 88,  2,  0,  0,  0,  0,  1], //  3
      [  1,127,127,127, 23,  0,  0,  0,  0,  0,  2,  0,  0,  0,  0,  1], //  4
      [  1,127,127, 23,  0,  0,  0,  0,  0, 89,  2, 89,  0,  0,  0,  1], //  5
      [  1,127, 23,  0,  0,  0,  0, 88, 88,  0,  2,  0,  0,  0,  0,  1], //  6
      [  1,127, 23,  0,  0,  0,  0,  0,  0,  0,  2,  2,  2,  2,  2,  2], //  7
      [  1,127, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  2,  2], //  8
      [  1,127, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  2,  2], //  9
      [  1,127, 23,  0,  0,  0,  0, 88, 88,  0,  0,  0,  0,  0, 23,  1], // 10
      [  1,127,127, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,127,  1], // 11
      [  1,127,127,127, 23,  0,  0,  0,  0,  0,  0,  0, 23,127,127,  1], // 12
      [  1,127,127,127,127, 23, 23, 23, 23, 23, 23, 23,127,127,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Travellers’ Rise', region: 'Eastern Fens', contentKey: 'eastern_fens_12',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'Reserved future camp location on a dry rise used by road workers, reed cutters, couriers, and travellers. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (13,3) A timbered bank crosses the widest water on the route.
  { mapId: 'EASTERN_FENS_WIDE_WATER_MAP', regionId: 'overworld', chunkX: 13, chunkY: 3, map: [
      [  1,  1,  1,  1, 58,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,127,  1, 23, 58, 23,  1,  1,  1,127,  1,  1, 81,127,  1,  1], //  1
      [  1,  1,127,  1, 58,  1,127,  1,  1,  1,127,  1,  1,  1,127,  1], //  2
      [  1,  1,  1,127, 58, 58, 58, 58, 58,  1,  1,127,  1,  1,  1,  1], //  3
      [  1,  1,  1, 23,127,  1,  1,  1, 58,  1,  1, 23,127,  1,  1,  1], //  4
      [  1,127, 81,  1,  1,127,  1,  1, 58,127,  1,  1,  1,127,  1,  1], //  5
      [  1,  1,127,  1,  1,  1, 23,  1, 58,  1,127,  1,  1,  1, 81,  1], //  6
      [ 23, 23,  1,127,  1,  1,  1,127, 58,  1, 23,127,  1,  1,  1,  1], //  7
      [ 58, 58, 58, 58, 58, 58, 58, 58, 58,  1,  1,  1,127,  1,  1,  1], //  8
      [ 23, 23,  1, 58, 58, 58,  1,  1,  1,127,  1,  1,  1, 23,  1,  1], //  9
      [  1,  1,127, 23, 58, 23,127,  1,  1,  1,127,  1,  1,  1,127,  1], // 10
      [  1,  1,  1, 23, 58, 23,  1,127, 23,  1,  1,127,  1,  1,  1,  1], // 11
      [  1,  1,  1, 23, 58, 23,  1,  1,127,  1,  1,  1, 23,  1,  1,  1], // 12
      [  1,127,  1, 23, 58, 23,  1,  1,  1,127,  1, 81,  1,127,  1,  1], // 13
      [  1,  1,  1, 58, 58, 58,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Brackish Reach', region: 'Eastern Fens', contentKey: 'eastern_fens_13',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'A timbered bank crosses the widest water on the route. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (13,4) Maintained road and drainage suggest a more populated district ahead.
  { mapId: 'EASTERN_FENS_CHANNEL_APPROACH_W_MAP', regionId: 'overworld', chunkX: 13, chunkY: 4, map: [
      [  1,  1,  1, 23,  2, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,  0,127, 23,  2, 23,127,127,  1, 89,127,127,127,127, 23,  1], //  1
      [  1,127,127, 23,  2, 23,  1,127,127,127,127,127,127,  0,127,  1], //  2
      [  1,127,127, 23,  2, 23,127,127,127, 23,127,  1,127,127,127,  1], //  3
      [  1,127,  1, 23,  2, 23,127,127,  0,  1,127,127,127,127,127,  1], //  4
      [  1,127,127, 23,  2, 23,127,  1,127,127,127,127, 23,127,  1,  1], //  5
      [  1,127,127,127,  2,  2,  2,  2,  2,  2,  2,  2,  1,127,127,  1], //  6
      [  1,127,127,  1,  2,127,127,127,127,127,  1,  2,127,127,127,  1], //  7
      [  1,  1,127,127,  2,127, 89,127,  1,127,127,  2,127,127,127,  1], //  8
      [  1,127, 23,127,  2,127,  1,127,127,127,127,  2,127,  1,127,  1], //  9
      [  1, 89,127,127,  2,127, 23,127,127,127,127,  2,127,127, 23,  1], // 10
      [  1,127,  1,127,  2,127,127,127,127,  1,127,  2,127,127, 23, 23], // 11
      [  1, 23,127,127,  2,127,127,  1,127, 23,127,  2,  2,  2,  2,  2], // 12
      [  1,127,127, 23,  2, 23,127,127, 89,127,127,127,  1,127, 23, 23], // 13
      [  1,  1,  1,  1,  2,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Channel Approach', region: 'Eastern Fens', contentKey: 'eastern_fens_14',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'Maintained road and drainage converge toward a navigable eastern channel. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (14,4) A broad roadside margin continues toward the managed channel.
  { mapId: 'EASTERN_FENS_CHANNEL_APPROACH_E_MAP', regionId: 'overworld', chunkX: 14, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,127,127, 23,127,  1,127,127,127,127,127, 23,  1,127,127,  1], //  1
      [  1,127,  0,  1,127,127,127,127,127,127, 89,127,127,127,127,  1], //  2
      [  1,  1,127,127,127,127, 23,127,  1,127,127,127,127,127,  0,  1], //  3
      [  1,127,127,127,127, 89,  1,127,127,127,127,127,127,  1, 23, 23], //  4
      [  1, 23,127,127,  1,127,127,  2,  2,  2,  2,  2,  2,  2,  2,  2], //  5
      [  1,127,  1,127,127, 23,127,  2,127,  1,127,127,127,127, 23, 23], //  6
      [  1,127,127,127,  0,127,127,  2,127,127,127,127, 89,127,  1,  1], //  7
      [  1,127,127,127,127,  1,127,  2,127,127,127,127,  1,127,127,  1], //  8
      [  1,127,127,  1,127,127,127,  2,127,127,  1,127, 23,127,127,  1], //  9
      [  1,  1,127, 23,127,127,127,  2,  1,127,127,  0,127,127,127,  1], // 10
      [ 23, 23,127,127,127,127,  1,  2,127,127,127,127,127,  1,127,  1], // 11
      [  2,  2,  2,  2,  2,  2,  2,  2,127,127,127,  1,127,127, 89,  1], // 12
      [ 23, 23,  1,127,127,127,127,127,127,  1, 23,127,127,127,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Channel Approach', region: 'Eastern Fens', contentKey: 'eastern_fens_15',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'A broad roadside margin approaches the channel that carries traffic north to the Valmere. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (15,4) The reliable eastbound embankment reaches a managed channel and turns north toward the Valmere.
  { mapId: 'EASTERN_FENS_VALMERE_ROAD_TURN_MAP', regionId: 'overworld', chunkX: 15, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1], //  0
      [  1,127,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1,  1,  1], //  1
      [  1,127,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1,  1,  1], //  2
      [  1,127,127,127,127, 23,  0,  0,  2,  0, 23,  1,  1,  1,  1,  1], //  3
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  0, 23,  1,  1,  1,  1,  1], //  4
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  0, 23,  1,  1,  1,  1,  1], //  5
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  0, 23,  1,  1,  1,  1,  1], //  6
      [  1,127,127,127, 23,  0,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1], //  7
      [  1,127,127,127,127, 23,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1], //  8
      [  1,127,127,127,127,127, 23, 23, 23,  1,  1,  1,  1,  1,  1,  1], //  9
      [  1,127,127,127,127,127,127,127,127, 23,  1,  1,  1,  1,  1,  1], // 10
      [  1,127,127,127,127,127,127,127,127,127, 23,  1,  1,  1,  1,  1], // 11
      [  1,127,127,127,127,127,127,127,127,127,127, 23,  1,  1,  1,  1], // 12
      [  1,127,127,127,127,127,127,127,127,127,127,127, 23,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Valmere Road Turn', region: 'Eastern Fens', contentKey: 'eastern_fens_16',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'The eastbound embankment meets a managed navigable channel and turns north toward the Valmere. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (15,3) The road follows the channel's raised western bank north.
  { mapId: 'EASTERN_FENS_CHANNEL_ROAD_S_MAP', regionId: 'overworld', chunkX: 15, chunkY: 3, map: [
      [  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  2,  2,  2, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  2,  0,  0, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  2,  0,  0, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  2,  0,  0, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  2,  2,  0, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  0,  2,  0, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  0,  2,  0, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  0,  2,  0, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  0,  2,  2, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  0,  0,  2, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  0,  0,  2, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  0,  0,  2, 23,127, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  0,  0,  2,  2,  2, 23,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Channel Road', region: 'Eastern Fens', contentKey: 'eastern_fens_17',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Raised road beside the managed navigable channel. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (15,2) Drainage cuts converge on the northbound channel road.
  { mapId: 'EASTERN_FENS_CHANNEL_ROAD_MID_MAP', regionId: 'overworld', chunkX: 15, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1],
      [  1,127,127,127,127,127,127,127, 23,  2,  2,  2, 23,  1,  1,  1],
      [  1,127,127,127,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1],
      [  1,127,127,127,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1],
      [  1,127,127,127,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1],
      [  1,127,127,  1,  1, 58,  1,  1,  1, 23,  2, 23,  1,  1,  1,  1],
      [  1,127,127,  1,  1, 58,  1,  1,  1, 23,  2, 23,  1,  1,  1,  1],
      [  1,127,127,  1,  1, 58,  1,  1,  1, 23,  2, 23,  1,  1,  1,  1],
      [  1,127,127, 23, 23, 58, 23, 23, 23, 23,  2, 23,  1,  1,  1,  1],
      [  1,127,127, 23,  0,  2,  2,  2,  2,  2,  2, 23,  1,  1,  1,  1],
      [  1,127,127, 23,  2,  2,  2,  0,  0,  0, 23, 23,  1,  1,  1,  1],
      [  1,127,127, 23,  2,  0,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  2,  0,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1],
      [  1,127,127, 23,  2,  2,  2, 23,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Channel Road', region: 'Eastern Fens', contentKey: 'eastern_fens_18',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Drainage cuts feed the widening channel beside the maintained road. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (15,1) The channel broadens and the road climbs toward firmer northern ground.
  { mapId: 'EASTERN_FENS_CHANNEL_ROAD_N_MAP', regionId: 'overworld', chunkX: 15, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  2,  2,  2, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  2,  0, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  2,  2, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  0,  2, 23,  1,  1,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  0,  2,  2,  2, 23,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  0,  0,  0,  2, 23,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  0,  0,  0,  2, 23,  1,  1,  1,  1],
      [  1,127,127,127,127, 23,  0,  0,  0,  2,  2,  2,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Channel Road', region: 'Eastern Fens', contentKey: 'eastern_fens_19',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'The widening channel and its engineered bank carry the road toward the Valmere. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (15,0) First broad view of the Valmere; the northbound road turns east along its southern shore.
  { mapId: 'EASTERN_FENS_VALMERE_REVEAL_MAP', regionId: 'overworld', chunkX: 15, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],
      [  1, 23, 23, 23, 23,  0,  0,  0,  0,  0,  0, 23, 23, 23, 23,  1],
      [  1,127,127,127, 23,  0,  0,  2,  0,  0,  0, 23,127,127,127,  1],
      [  1,127,127,127, 23,  0,  0,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1,127,127,127, 23,  0,  0,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1,127,127,127, 23,  0,  0,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1,127,127,127, 23,  0,  0,  2,  0,  0,  0, 23,127,127,127,  1],
      [  1,127,127,127, 23,  0,  2,  2,  2,  0,  0, 23,127,127,127,  1],
      [  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Valmere — Southern Shore', region: 'Eastern Fens', contentKey: 'eastern_fens_20',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'First broad Valmere view where the channel reaches the inland sea and the road turns east along firm southern shore. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (16,0) A maintained shore road keeps open Valmere water continuously to the north.
  { mapId: 'EASTERN_FENS_VALMERE_SHORE_W_MAP', regionId: 'overworld', chunkX: 16, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],
      [  1, 23, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23, 23,  1],
      [  1,127, 23,  0,  0, 88,  0,  0,  0,  0, 88,  0,  0, 23,127,  1],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1,127, 23,  0,  0, 89,  0,  0,  0,  0, 89,  0,  0, 23,127,  1],
      [  1,127,127, 23,  0,  0,  0,  0,  0,  0,  0,  0, 23,127,127,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Valmere — Southern Shore', region: 'Eastern Fens', contentKey: 'eastern_fens_21',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Firm engineered southern shore road with open Valmere water to the north. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (17,0) Firmer margins and a broader road anticipate the unbuilt port district.
  { mapId: 'EASTERN_FENS_VALMERE_SHORE_E_MAP', regionId: 'overworld', chunkX: 17, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1],
      [  1, 23,  0,  0, 88, 88,  0,  0,  0,  0, 88, 88,  0,  0, 23,  1],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1, 23,  0,  0, 89,  0,  0,  0,  0,  0,  0, 89,  0,  0, 23,  1],
      [  1,127, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,127,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Valmere — Southern Shore', region: 'Eastern Fens', contentKey: 'eastern_fens_22',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Broader maintained road and firm shore ground before the unbuilt port district. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  // (18,0) Safe unfinished threshold on firm southern-shore ground before the port town.
  { mapId: 'EASTERN_FENS_PORT_THRESHOLD_MAP', regionId: 'overworld', chunkX: 18, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1],
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
      [  1, 23,  0,  0, 88, 88,  0,  0,  0,  0, 88, 88,  0,  0,  0,  1],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1, 23,  0,  0, 89,  0,  0,  0,  0,  0,  0, 89,  0,  0,  0,  1],
      [  1,127, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Valmere — Port Road Threshold', region: 'Eastern Fens', contentKey: 'eastern_fens_23',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Safe unfinished southern-shore threshold before the unnamed port town. The maintained road visibly continues without a false transition or permanent obstruction. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
];

// ─── Eastern Fens regional envelope (Phase 2) ───────────────────────────────
// Surrounding fen so reachable route terrain never renders against void at the
// native 512x480 camera. 4 walkable infill pockets + 33 non-walkable scenery
// perimeter chunks. Terrain/topology only: no content, actors, state, or saves.
// Grids are deterministic (authored offline from a fixed ASCII fen palette:
// 1 water, 127 deep-reeds[walk], 23 reeds, 0 grass, 81 mud, 88 stone, 120 drowned
// tree, 121 rocks-in-water, 89 fence, 2 path, 58 bridge) and inline here as stable literals.
const EASTERN_FENS_ENVELOPE_CHUNK_DEFINITIONS = [
  { mapId: 'EASTERN_FENS_BRIDGE_INLET_W_MAP', regionId: 'overworld', chunkX: 13, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,127,127,127,127,127,127,127,127,127,127,127,127,127], // 6
      [  1,  1,  1,127,127,127,127,127,127,127,127,127,127,127,127,127], // 7
      [  1,  1,  1,127,127,127,127,127,127,127,127,127,127,127,127,127], // 8
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1, 58,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Bridge Inlet', region: 'Eastern Fens', contentKey: 'eastern_fens_env_13_2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable terrain-only infill fen pocket; connects via structural seam(s) only. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  { mapId: 'EASTERN_FENS_BRIDGE_INLET_E_MAP', regionId: 'overworld', chunkX: 14, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [127,127,127,127,127,127,127,127,127,127,  1,  1,  1,  1,  1,  1], // 6
      [127,127,127,127,127,127,127,127,127,127,  1,  1,  1,  1,  1,  1], // 7
      [127,127,127,127,127,127,127,127,127,127,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,127,127,127,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,127,127,127,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,127,127,127,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,127,127,127,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,127,127,127,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,127,127,127,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Bridge Inlet', region: 'Eastern Fens', contentKey: 'eastern_fens_env_14_2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable terrain-only infill fen pocket; connects via structural seam(s) only. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  { mapId: 'EASTERN_FENS_CHANNEL_ELBOW_MAP', regionId: 'overworld', chunkX: 14, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,127,127,127,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,127,127,127,127,127,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,127,127,127,127,127,127,127,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1, 23,127,127,127,127,127,127,127, 23,  1,  1,  1], // 3
      [  1,  1,  1,  1, 23,127,127, 23,127,127,127, 23,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,127,127,127,127,127,127,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1, 23,127,127,127,127, 23,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,127,127,127,127,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1, 23,127,127, 23,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,127,127,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Channel Elbow', region: 'Eastern Fens', contentKey: 'eastern_fens_env_14_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable terrain-only infill fen pocket; connects via structural seam(s) only. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  { mapId: 'EASTERN_FENS_REED_HOLLOW_MAP', regionId: 'overworld', chunkX: 11, chunkY: 3, map: [
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23,127,127, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,127,127,127,127, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1, 23,127,127,127,127, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,127,127,127,127,127,127,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1, 23,127,127,127,127,127,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1, 23,127,127,127, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1, 23,127,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1, 23, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Reed Hollow', region: 'Eastern Fens', contentKey: 'eastern_fens_env_11_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable terrain-only infill fen pocket; connects via structural seam(s) only. No encounters, items, NPCs, interactions, quest triggers, or new save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C6R0_MAP', regionId: 'overworld', chunkX: 6, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,127,120,  1,  1], // 3
      [  1,  1,  1,127, 23, 23,  1,  1,  1,120,  1,121,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,127,  1,  1,  1], // 5
      [  1,  1,127,  1,  1,127,  1,127,  1,  1,127,  1,  1,  1,120,  1], // 6
      [  1,  1,127, 23,  1,127,  1, 23,  1,  1, 81,127,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,120,  1, 23,127, 81, 81,127,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,120,127,  1,121,  1,127,121,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,127, 23,  1,  1, 23,  1,  1,  1,  1,121,  1], // 10
      [  1,120,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,120,  1,  1,  1,  1,127,  1,  1,120,  1,  1,  1,  1,120,  1], // 12
      [  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,121,120,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Open Fen Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_6_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C7R0_MAP', regionId: 'overworld', chunkX: 7, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23,127,127, 23, 23,127,127,127,127, 23, 23,127,127, 23,  1], // 1
      [  1, 23,127,127, 81, 81,127,127,127,127, 81, 81,127,127, 23,  1], // 2
      [  1,127,127, 81, 81,  0,  0,127,127,  0,  0, 81, 81,127,127,  1], // 3
      [  1, 23,127, 81,  0,  0, 88, 88, 88, 88,  0,  0, 81,127, 23,  1], // 4
      [  1, 23,127, 81,  0, 88, 88,  0,  0, 88, 88,  0, 81,127, 23,  1], // 5
      [  1,127,127, 81, 81,  0,  0,127,127,  0,  0, 81, 81,127,127,  1], // 6
      [  1, 23,127,127, 81, 81,127,127,127,127, 81, 81,127,127,127,127], // 7
      [  1, 23,127,127, 81, 81,127,127,127,127, 81, 81,127,127, 23,  1], // 8
      [  1,127,127, 81, 81,  0,  0,127,127,  0,  0, 81, 81,127,127,  1], // 9
      [  1, 23,127, 81,  0,  0,  0,127,127,  0,  0,  0, 81,127, 23,  1], // 10
      [  1, 23,127,127, 81, 81,127,127,127,127, 81, 81,127,127, 23,  1], // 11
      [  1,  1, 23,127,127,127,127,127,127,127,127,127,127, 23,  1,  1], // 12
      [  1,  1,  1, 23,127,127,127,127,127,127, 23,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — North Fen', region: 'Eastern Fens', contentKey: 'eastern_fens_env_7_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable open north fen off the reedbelt; room to wander out to the camera-clamped world edge and the open water that marks the North Basin margin. Reserved for a future enemy-gated expansion; terrain only — no encounters, items, NPCs, interactions, quest triggers, or save bindings.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C8R0_MAP', regionId: 'overworld', chunkX: 8, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23,127,127, 23, 23,127,127,127,127, 23, 23,127,127, 23,  1], // 1
      [  1, 23,127,127, 81, 81,127,127,127,127, 81, 81,127,127, 23,  1], // 2
      [  1,127,127, 81, 81,  0,  0,127,127,  0,  0, 81, 81,127,127,  1], // 3
      [  1, 23,127, 81,  0,  0, 88, 88, 88, 88,  0,  0, 81,127, 23,  1], // 4
      [  1, 23,127, 81,  0, 88, 88,  0,  0, 88, 88,  0, 81,127, 23,  1], // 5
      [  1,127,127, 81, 81,  0,  0,127,127,  0,  0, 81, 81,127,127,  1], // 6
      [127,127,127, 81, 81,127,127,127,127, 81, 81,127,127, 23,  1,  1], // 7
      [  1, 23,127,127, 81, 81,127,127,127,127, 81, 81,127,127, 23,  1], // 8
      [  1,127,127, 81, 81,  0,  0,127,127,  0,  0, 81, 81,127,127,  1], // 9
      [  1, 23,127, 81,  0,  0,  0,127,127,  0,  0,  0, 81,127, 23,  1], // 10
      [  1, 23,127,127, 81, 81,127,127,127,127, 81, 81,127,127, 23,  1], // 11
      [  1,  1, 23,127,127,127,127,127,127,127,127,127,127, 23,  1,  1], // 12
      [  1,  1,  1, 23,127,127,127,127,127,127, 23,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — North Fen', region: 'Eastern Fens', contentKey: 'eastern_fens_env_8_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable open north fen off the reedbelt; room to wander out to the camera-clamped world edge. Reserved for a future enemy-gated expansion; terrain only — no encounters, items, NPCs, interactions, quest triggers, or save bindings.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C9R0_MAP', regionId: 'overworld', chunkX: 9, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,120,  1,  1,  1,127,127, 23, 23,  1,  1,127,  1,  1], // 1
      [  1,127, 23, 23,127,  1,  1, 23,127,  1,  1, 23,  1,127,127,  1], // 2
      [  1,  1,  1,  1, 23, 23,127,  1,127,127, 23,  1, 23,127,127,  1], // 3
      [  1, 23,  1,  1,  1,  1,  1,  1, 23,  1,  1,127,  1,127,127,  1], // 4
      [  1,  1,  1, 23, 23,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 5
      [  1,127,  1,127,  1,127,  1,  1,  1,  1, 23, 23, 23,127,120,  1], // 6
      [  1,  1,  1,  1, 23,120, 23,  1,  1,  1,127,127,  1, 23,127,  1], // 7
      [  1,  1,  1,  1, 23,  1, 23,  1, 23,  1, 23,  1,  1,  1, 23,  1], // 8
      [  1,120,127,120, 23,127,127,  1,  1,  1,  1,120,  1, 23, 23,  1], // 9
      [  1,  1, 23, 23,  1,  1, 23, 23,127, 23,120,127,127,  1,  1,  1], // 10
      [  1,127,127,127,127,  1,  1,127,  1, 23,120,127,120, 23, 23,  1], // 11
      [  1, 23,  1,  1,120,127,  1,  1,  1,120,  1,  1,  1,127,  1,  1], // 12
      [  1,  1, 23,  1,  1,  1,  1,  1,  1, 23,127,  1,127, 23,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Flooded Reeds', region: 'Eastern Fens', contentKey: 'eastern_fens_env_9_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C14R0_MAP', regionId: 'overworld', chunkX: 14, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,127,  1,  1,  1,127,  1,  1,  1,  1,  1,121,121,  1,121,  1], // 1
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,127,  1,127,127,  1,  1,  1,  1,  1,  1,121,  1], // 3
      [  1,  1,127,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,127,  1,  1,121,  1,  1,  1,127,  1,  1,  1,127,  1,  1], // 5
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 6
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1], // 7
      [  1, 81, 81, 81,121, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,121,  1, 23,  1], // 9
      [  1,  1,  1,  1,  1, 23,  1,  1,  1, 23,  1,  1,  1,  1,121,  1], // 10
      [  1,  1, 23, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1, 23,  1, 23, 23,  1,  1,  1, 23,  1,  1,  1, 23,  1], // 12
      [  1,  1,  1,  1,  1,  1, 23,  1, 23,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Brackish Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_14_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C5R1_MAP', regionId: 'overworld', chunkX: 5, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,120,  1,  1,127,127,127,  1,  1,127,  1,  1,127,  1,  1,  1], // 1
      [  1,127,120,127,  1, 23, 23,120,127, 23,  1,  1,  1,120, 23,  1], // 2
      [  1, 23,  1,  1,120,  1,  1,  1,127,127,127,  1, 23,120,127,  1], // 3
      [  1,  1,  1,127,  1,  1,  1,  1,  1,127,  1,127,127,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1, 23,  1, 23,  1, 23,  1,  1,  1,120,  1,  1], // 5
      [  1,  1, 23, 23,  1,  1,  1,120,120,  1, 23,  1,127,  1,  1,  1], // 6
      [  1,127,127,127, 23,127,  1,  1,  1,  1,  1,120,  1, 23,  1,  1], // 7
      [  1,127,  1,  1,  1,127,  1,127,127,  1,  1,  1,  1,  1,127,  1], // 8
      [  1,127, 23,  1,  1,127,  1,  1,  1,  1,  1, 23,  1,  1, 23,  1], // 9
      [  1,  1, 23,  1,127,  1,  1,  1,  1,  1,127,  1,  1,127, 23,  1], // 10
      [  1,  1,  1,  1,  1, 23,  1,127,  1, 23, 23, 23,  1,127, 23,  1], // 11
      [  1,127,  1, 23, 23, 23,127, 23,120,  1,  1,  1,  1,  1,120,  1], // 12
      [  1,  1,127, 23,  1, 23, 23,127,  1, 23,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Flooded Reeds', region: 'Eastern Fens', contentKey: 'eastern_fens_env_5_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C6R1_MAP', regionId: 'overworld', chunkX: 6, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,127,127,127,127, 23, 23,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,127,127, 81,127, 23,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,127,127, 81, 81,127, 23,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,127,127, 81,127,127,127,127], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,127,127, 81, 81,127, 23,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,127,127,127,127, 23,  1,  1], // 6
      [  1, 23,127,127, 81, 81,127,127,127,127, 81, 81,127,127, 23,  1], // 7
      [  1, 23,127, 81, 81,  0,  0,127,127,  0,  0, 81, 81,127, 23,  1], // 8
      [  1,127,127, 81,  0,  0, 88, 88, 88, 88,  0,  0, 81,127, 23,  1], // 9
      [  1, 23,127, 81,  0,  0, 88,  0,  0, 88,  0,  0, 81,127, 23,  1], // 10
      [  1,127,127, 81,  0,  0,  0,127,127,  0,  0,  0, 81,127, 23,  1], // 11
      [  1, 23,127, 81, 81,127,127,127,127,127,127, 81, 81,127, 23,  1], // 12
      [  1,  1, 23,127,127,127,127,127,127,127,127,127,127, 23,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Northwest Fen', region: 'Eastern Fens', contentKey: 'eastern_fens_env_6_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable open fen northwest of the reedbelt, bounded by open water toward the North Basin margin; room to wander. Reserved for a future enemy-gated expansion; terrain only — no encounters, items, NPCs, interactions, quest triggers, or save bindings.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C9R1_MAP', regionId: 'overworld', chunkX: 9, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,127,  1,127,  1,  1, 23,  1, 23,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,127, 81,127,  1,  1, 23, 81, 23,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,127,  1,127,  1,  1, 81,  1, 23,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,127,  1,127,  1,  1, 23,  1, 23,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,127,  1,127,  1,  1, 23,  1, 23,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,127, 81,127,  1,  1, 81, 81, 23,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,127,  1, 81, 89,  1, 23,  1, 23,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,127,  1,127,  1, 81, 23,  1, 23,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,127,  1,127, 81, 81, 23,  1, 23,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,127,  1, 81,  1,  1, 23,  1, 23,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1, 89,  1,127,  1,  1, 81,  1, 23,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,127,  1,127,  1,  1, 23,  1, 23,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,127,  1,127,  1,  1, 23,  1, 23,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Drainage Flats', region: 'Eastern Fens', contentKey: 'eastern_fens_env_9_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C10R1_MAP', regionId: 'overworld', chunkX: 10, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,120,120,  1,  1,120,120,  1,  1,120,120,  1,  1,120,  1,  1], // 1
      [  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1], // 2
      [  1,120,120,  1,  1,120,120,  1,  1,120,120,  1,  1,120,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,120,120,  1,  1,  1,  1,120,120,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1, 23,127,127,127,127,127, 23,127,127,127,127, 23,  1,  1,  1], // 7
      [  1, 23,127,127, 81, 81,127,127,127, 81, 81,127,127, 23,  1,  1], // 8
      [  1, 23,127,127, 81, 81,127,127,127, 81, 81,127,127, 23,  1,  1], // 9
      [  1, 23,127,127,127,127,127, 23,127,127,127,127,127, 23,  1,  1], // 10
      [  1,  1, 23,127,127,127,127,127,127,127,127,127,127, 23,  1,  1], // 11
      [  1,  1,  1, 23,127,127,127,127,127,127,127,127, 23,  1,  1,  1], // 12
      [  1,  1,  1,  1, 23,127,127,127,127,127,127, 23,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Drainage Flats', region: 'Eastern Fens', contentKey: 'eastern_fens_env_10_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable off-road drainage country north of the managed cuts; a dead-end pocket off the road, bounded by open drainage and a dense flooded-woodland wall. Terrain only: no encounters, items, NPCs, interactions, quest triggers, or save bindings.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C11R1_MAP', regionId: 'overworld', chunkX: 11, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1,  1, 23,  1, 23,  1,  1], // 1
      [  1,  1,  1,  1,127,  1,127,  1, 81,  1,  1, 23,  1, 23,  1,  1], // 2
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1,  1, 23,  1, 23,  1,  1], // 3
      [  1,  1,  1,  1,127, 89,127,  1,  1, 81,  1, 23,  1, 23,  1,  1], // 4
      [  1,  1,  1,  1,127,  1,127, 81,  1,  1,  1, 23,  1, 23,  1,  1], // 5
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1,  1, 23,  1, 23,  1,  1], // 6
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1,  1, 23,  1, 23,  1,  1], // 7
      [  1,  1,  1,  1,127,  1, 81,  1, 89,  1,  1, 23,  1, 23,  1,  1], // 8
      [  1,  1,  1,  1,127, 81,127,  1,  1,  1,  1, 23,  1, 23,  1,  1], // 9
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1,  1, 23,  1, 23,  1,  1], // 10
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1,  1, 23,  1, 23,  1,  1], // 11
      [  1,  1,  1,  1,127,  1,127,  1,  1, 81,  1, 23,  1, 23,  1,  1], // 12
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1,  1, 23,  1, 23,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Drainage Flats', region: 'Eastern Fens', contentKey: 'eastern_fens_env_11_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C12R1_MAP', regionId: 'overworld', chunkX: 12, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,127,127, 23, 23,120, 23,127,  1,  1, 23, 23,127,  1,  1], // 1
      [  1, 23,127, 23, 23,127,127,  1,  1,127,  1,  1,  1, 23, 23,  1], // 2
      [  1, 23,  1,127,120, 23,127,120,120,127,  1,  1,127,127,127,  1], // 3
      [  1,127,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,127,  1], // 4
      [  1,127,  1,127,  1,  1,  1,  1,  1,  1,  1, 23,127,  1,  1,  1], // 5
      [  1,  1,  1,127, 23,  1,  1,  1,  1,127,  1,127,  1,127,127,  1], // 6
      [  1, 23,120, 23, 23,  1,  1,127,  1,127,  1,127,  1,  1,127,  1], // 7
      [  1,127, 23,127,127,  1,  1,120,127,  1,  1,  1,  1,  1,120,  1], // 8
      [  1,127,  1, 23, 23,  1,127,127,127,  1,  1,  1,120,127,  1,  1], // 9
      [  1,127,  1,  1,  1,  1, 23,  1,  1,  1,127,  1,  1,  1, 23,  1], // 10
      [  1, 23, 23,120,  1,  1,  1, 23, 23,127,  1,  1,  1, 23,  1,  1], // 11
      [  1,  1,  1,127,127,  1,  1, 23,  1,  1,127,127,  1,  1, 23,  1], // 12
      [  1,  1, 23,  1,127,  1, 23,127,127,  1,127, 23,127, 23,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Flooded Reeds', region: 'Eastern Fens', contentKey: 'eastern_fens_env_12_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C13R1_MAP', regionId: 'overworld', chunkX: 13, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,127,  1,127,  1,  1], // 1
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,127,121,  1,127,  1], // 2
      [  1,  1,121,  1,  1,  1,127,  1,  1,  1,  1,127,  1,127,  1,  1], // 3
      [  1,  1,  1,  1,127,  1,  1,  1,121,  1,  1,121,127,  1,  1,  1], // 4
      [  1,  1,127,127,  1,  1,  1,  1,  1,  1,127,  1,127,127,  1,  1], // 5
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 6
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81,121, 81, 81, 81, 81,  1], // 7
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,121, 81,  1], // 8
      [  1,  1,  1, 23,121,121,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 9
      [  1,  1,  1, 23,  1,  1, 23,  1,  1,  1,  1,  1,  1, 23,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,121,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1, 23,  1,  1, 23,  1,  1,  1, 23,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,121,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Brackish Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_13_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C14R1_MAP', regionId: 'overworld', chunkX: 14, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 1
      [  1,  1,  1,  1,  1,  1,127,127,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,127,127,  1,  1,127,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1], // 6
      [  1,121, 81, 81, 81, 81, 81, 81, 81, 81, 81,121, 81, 81, 81,  1], // 7
      [  1, 23,  1,  1,  1,  1,  1, 23, 23,  1,  1,  1,  1,  1, 23,  1], // 8
      [  1,  1,  1,  1,121,  1, 23,  1,  1,  1,  1,  1, 23,  1,121,  1], // 9
      [  1,  1, 23,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1, 23,121,  1], // 10
      [  1,  1,  1,  1,  1, 23,  1,121,  1,  1,  1, 23,  1,  1,  1,  1], // 11
      [  1,121,  1, 23, 23,  1,  1, 23,  1,  1,  1,  1,  1,  1, 23,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Brackish Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_14_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C16R1_MAP', regionId: 'overworld', chunkX: 16, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,121,  1,  1,  1,  1], // 2
      [  1,  1,127,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,127,  1,  1,  1,  1,127,  1,121,127,121,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,127,  1,127,  1,  1,  1], // 5
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,127,127,  1], // 6
      [  1, 81, 81, 81,121, 81,121, 81, 81, 81, 81, 81, 81, 81, 81,  1], // 7
      [  1, 81, 81, 81, 81, 81, 81, 81,121, 81, 81, 81, 81, 81, 81,  1], // 8
      [  1,  1,  1,  1,121,  1, 23,  1,  1,  1,  1,  1, 23,121,  1,  1], // 9
      [  1,  1, 23,  1,  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1], // 10
      [  1, 23,  1, 23, 23,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,121,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Brackish Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C17R1_MAP', regionId: 'overworld', chunkX: 17, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 2
      [  1,  1,127,  1,  1,  1,127,  1,127,127,127,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,127,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1], // 6
      [  1, 81, 81, 81,121, 81, 81, 81, 81,121, 81, 81, 81, 81, 81,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1, 23,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1, 23,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,121,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Brackish Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_17_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C18R1_MAP', regionId: 'overworld', chunkX: 18, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1, 23,  1, 23,  1,  1,  1], // 1
      [  1,  1, 89,  1,127,  1,127,  1,  1,  1, 23,  1, 23, 89,  1,  1], // 2
      [  1,  1,  1,  1, 89,  1,127,  1,  1,  1, 81,  1, 23, 89,  1,  1], // 3
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1, 23,  1, 23,  1,  1,  1], // 4
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1, 23,  1, 23, 89,  1,  1], // 5
      [  1,  1,  1,  1,127,  1,127, 89, 81,  1, 23,  1, 23,  1,  1,  1], // 6
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1, 23, 89, 23,  1,  1,  1], // 7
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1, 23,  1, 23,  1,  1,  1], // 8
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1, 23,  1, 23,  1,  1,  1], // 9
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1, 23,  1, 23,  1,  1,  1], // 10
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1, 23,  1, 23,  1,  1,  1], // 11
      [  1,  1,  1,  1,127,  1, 81,  1, 89,  1, 23,  1, 23,  1,  1,  1], // 12
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1, 23,  1, 23,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Drainage Flats', region: 'Eastern Fens', contentKey: 'eastern_fens_env_18_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C16R2_MAP', regionId: 'overworld', chunkX: 16, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,127,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,127,  1,127,  1], // 2
      [  1,  1,  1,127,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,127,  1,  1,  1,127,127,127,127,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1, 89,  1,  1,  1,  1,127,  1,  1,127,127,  1], // 5
      [  1,  1, 88,  1,  1,  1,  1, 88, 88,  1, 88, 88,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,127,  1,127,  1,  1,  1,  1,127,127,  1,  1,  1], // 8
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,127,  1], // 10
      [  1,  1,  1,  1,  1,  1,127,  1,127,127,  1,  1,  1,  1,127,  1], // 11
      [  1,  1,  1,127,127,  1,  1,127,127,  1,127,  1,  1,127,  1,  1], // 12
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,127,  1,  1,127,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Broken Embankment', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C16R3_MAP', regionId: 'overworld', chunkX: 16, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,127,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,121,  1,120, 23,  1,127,  1,127,  1,  1], // 3
      [  1,  1,  1,127,  1, 23,  1,  1,  1,120,120,  1, 23,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,121,  1,  1,  1,120,127,127,  1,120,120,  1], // 5
      [  1,  1,  1,  1,  1,  1, 81,127, 23,  1,  1,  1,121,  1,  1,  1], // 6
      [  1,121,  1,  1,  1,127, 81, 81,  1,  1,121,  1,  1,  1,  1,  1], // 7
      [  1,  1, 23,  1,  1,  1,  1, 23,  1,  1,  1,127,  1,120,  1,  1], // 8
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,120,121,  1,  1,  1,  1], // 9
      [  1,  1,  1, 23,  1,  1,120,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 10
      [  1,  1,  1,127,120,  1,  1,120,127, 23,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1, 23, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,121,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Open Fen Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C16R4_MAP', regionId: 'overworld', chunkX: 16, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,127,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,127,127,  1,  1,127,  1,  1,  1], // 2
      [  1,127,  1,  1,  1,  1,  1,127,  1,121,  1,  1,  1,  1,  1,  1], // 3
      [  1,127,  1,  1,  1,121,127,  1,  1,  1,127,127,121,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,127,  1,127,  1,  1,127,  1,  1,  1,  1,  1,  1,127,  1], // 6
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1], // 7
      [  1, 81,121, 81, 81, 81, 81,121, 81, 81, 81, 81, 81, 81, 81,  1], // 8
      [  1,  1,  1, 23, 23,  1,  1,  1,  1, 23,  1,  1,  1,  1, 23,  1], // 9
      [  1,  1,  1,121,  1,  1,  1, 23,  1,  1,  1,121,  1,  1,  1,  1], // 10
      [  1, 23,  1, 23,  1,  1,  1, 23, 23,121,  1,  1, 23,  1,121,  1], // 11
      [  1,  1,  1,121,  1,  1,  1,  1,  1, 23,  1,  1, 23,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1, 23,  1, 23,  1,  1, 23,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Brackish Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C5R3_MAP', regionId: 'overworld', chunkX: 5, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23,127,  1,127, 23,  1,127,127,  1,  1,120,120,  1,120,  1], // 1
      [  1,120,127,127,  1,127,  1,  1,127,  1, 23,  1,  1,127,127,  1], // 2
      [  1,  1,127,  1, 23,127, 23, 23,  1,  1,127,  1,  1,  1,120,  1], // 3
      [  1, 23, 23,127,120,  1,127,  1,127,  1,  1,127,  1,  1,  1,  1], // 4
      [  1,127, 23,  1,127,120,  1,  1,  1, 23, 23,127,  1, 23,127,  1], // 5
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,127, 23,  1,  1,127,  1], // 6
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,127,  1], // 7
      [  1,127,  1,  1,120, 23,127,  1,127,  1,  1,  1,  1,127, 23,  1], // 8
      [  1,127,  1,  1,  1,127,127,120, 23, 23,  1,127,120,127,  1,  1], // 9
      [  1,  1,127,  1,  1,  1,127,127, 23,  1,127,  1,127,  1,120,  1], // 10
      [  1,127,  1,  1, 23,127,127,  1,127,  1,127,  1,127,127,  1,  1], // 11
      [  1,127,  1,  1, 23,  1,  1,  1,127,127,  1,  1, 23,  1,  1,  1], // 12
      [  1,  1,  1,  1, 23,  1,127, 23,127,  1, 23,  1,127,  1, 23,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Flooded Reeds', region: 'Eastern Fens', contentKey: 'eastern_fens_env_5_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C6R3_MAP', regionId: 'overworld', chunkX: 6, chunkY: 3, map: [
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,127,127,127,127,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1, 23,127,127,127,127,127, 23,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1, 23,127,127, 81, 81,127,127,127,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1, 23,127, 81, 81, 81, 81,127,127, 23,  1,  1,  1,  1,  1,  1], // 4
      [  1, 23,127, 81, 81, 81, 81,127,127, 23,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1, 23,127,127,127,127,127,127, 23,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1, 23, 23,127,127, 23, 23,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — South Reedbed', region: 'Eastern Fens', contentKey: 'eastern_fens_env_6_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable off-road reedbed and muddy margin south of the old embankment; a dead-end pocket off the road that ends at broad fen water. Terrain only: no encounters, items, NPCs, interactions, quest triggers, or save bindings.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C7R3_MAP', regionId: 'overworld', chunkX: 7, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,127,  1,  1,  1,  1], // 2
      [  1,  1,127,  1,  1,  1,127,  1,127,127,127,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,127,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,127, 88,  0,  1,  1,  1,  1,  1,127,  1,  1], // 6
      [  1,  1,  1,  1,121,  1,  0, 88,  1,121,127,  1,  1,127,  1,  1], // 7
      [  1,  1,  1,  1,  1, 23, 23, 23, 23,  1,  1,121,  1,  1,120,  1], // 8
      [  1,127,  1,  1,  1,  1,  1,127,127,  1,121,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,127,  1], // 12
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Mire Hummocks', region: 'Eastern Fens', contentKey: 'eastern_fens_env_7_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C8R3_MAP', regionId: 'overworld', chunkX: 8, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23,  1,127,127,  1,  1,  1, 23,127,  1,127,  1,127,127,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1, 23,120,  1,  1,  1,  1], // 2
      [  1,  1,127,  1,127,120,127,  1,127,127,127,  1,127, 23,  1,  1], // 3
      [  1,  1,  1,127, 23,  1,  1, 23,127,  1,127,120,  1, 23,127,  1], // 4
      [  1,  1,  1,  1, 23, 23,  1,  1,127,127, 23,120,  1,127,  1,  1], // 5
      [  1,  1,127,  1,  1,127,  1,  1,120, 23, 23,  1,  1,127,  1,  1], // 6
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,127,  1,  1, 23,  1,  1], // 7
      [  1,  1, 23,120,127,127,127,127,  1,  1,  1,  1,  1,127, 23,  1], // 8
      [  1,127,127,  1,  1,127,  1,127,  1,  1,  1,127,  1,  1,  1,  1], // 9
      [  1,127,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 10
      [  1,127, 23,  1,  1,  1, 23,  1,  1,127,127,  1,127,  1,127,  1], // 11
      [  1,  1,  1,  1,127,127,  1,  1,  1, 23,127,127,  1,  1,127,  1], // 12
      [  1,  1,  1,127,  1,  1,127,  1,  1,  1,127, 23,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Flooded Reeds', region: 'Eastern Fens', contentKey: 'eastern_fens_env_8_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C8R4_MAP', regionId: 'overworld', chunkX: 8, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,127,  1,121,  1,  1,  1,  1,127,  1,  1,  1,  1], // 1
      [  1,  1,  1,127,121,  1,127,120,121,  1,  1,  1,  1,  1,127,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,121,120,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,127,  1,  1,  1,  1,  1,120,127,  1,  1,  1,  1,  1], // 4
      [  1,121,  1,  1,  1,  1,  1,127,  1,  1,127,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1, 88,  0,  1,127,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  0, 88,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,127,120,  1,  1,  1, 23, 23, 23, 23,  1,121,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 9
      [  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 10
      [  1,  1,127,  1,121,  1,  1,  1,  1,120,  1,  1,  1,  1,127,  1], // 11
      [  1,  1,  1,  1,  1,127,  1,127,  1,  1,  1,  1,  1,  1,120,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,120,127,  1,120,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Mire Hummocks', region: 'Eastern Fens', contentKey: 'eastern_fens_env_8_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C9R4_MAP', regionId: 'overworld', chunkX: 9, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1, 23,127,127,127,127, 23,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1, 23,127,127,  0,  0,  0,  0,127,127, 23,  1,  1,  1], // 2
      [  1,  1, 23,127,  0,  0,  0, 88, 88,  0,  0,  0,127, 23,  1,  1], // 3
      [  1,  1, 23,  0,  0, 88, 88, 88, 88, 88,  0,  0, 23,  0,  1,  1], // 4
      [  1,  1, 23,  0,  0,  0,  0,  0, 88,  0,  0,  0,  0,127,  1,  1], // 5
      [  1,  1, 23,127,  0,  0,  0,  0,  0,  0,  0,127, 23,  1,  1,  1], // 6
      [  1,  1,  1, 23, 23,127,127,127,127, 23, 23,  1,  1,  1,  1,  1], // 7
      [  1,  1, 89, 89,  1,  1,  1,  1,  1,  1,  1,  1, 89, 89,  1,  1], // 8
      [  1,119,119,119,  1,  1,  1,  1,  1,  1,  1,  1,119,119,119,  1], // 9
      [  1,  1,119,119,  1,  1,  1,  1,  1,  1,  1,  1,119,119,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Hummock Clearing', region: 'Eastern Fens', contentKey: 'eastern_fens_env_9_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable off-road firm grassy hummock and small clearing south of the dry rise (room reserved for a future quiet location, with no trigger or interaction); bounded by a collapsed embankment, a low moraine, and flooded ground. Terrain only: no encounters, items, NPCs, interactions, quest triggers, or save bindings.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C10R4_MAP', regionId: 'overworld', chunkX: 10, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1, 23,127,127,127,127,  1,120,127,127,  1,  1, 23,  1,  1], // 1
      [  1,127,  1,  1,127,  1,  1,  1,  1, 23,  1,  1,  1,127,127,  1], // 2
      [  1,  1, 23,  1,  1,  1,127,  1,127,127,  1,  1,  1,120, 23,  1], // 3
      [  1,127,  1,  1,120,127,  1,  1,  1,  1,120,  1, 23,  1,127,  1], // 4
      [  1,  1,  1, 23,  1, 23,  1,127,  1,  1,127,  1,127,  1,127,  1], // 5
      [  1,120,  1,127,  1,127, 23,127,127,  1, 23,  1,127,  1, 23,  1], // 6
      [  1,120,  1,  1, 23,  1,127, 23,  1,  1,  1,127, 23,127,  1,  1], // 7
      [  1,127,127,127, 23,127,  1,127,127,  1,  1,  1,  1, 23, 23,  1], // 8
      [  1,  1,  1,  1, 23,127,  1,  1,120,  1, 23,  1,  1, 23,  1,  1], // 9
      [  1,  1, 23,  1,  1,  1,127,127,127,120, 23,  1,  1,  1, 23,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,127,  1,  1,  1,  1,127,  1], // 11
      [  1,127,  1, 23,  1,127,127, 23,127, 23,  1,127,  1, 23,  1,  1], // 12
      [  1,  1,127,  1,  1,127, 23, 23, 23,120,  1,  1,  1, 23,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Flooded Reeds', region: 'Eastern Fens', contentKey: 'eastern_fens_env_10_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C11R4_MAP', regionId: 'overworld', chunkX: 11, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,127,120,  1,  1,127,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,127,120,  1,  1,  1,  1,  1,  1,  1,121,121,  1,  1,  1,  1], // 2
      [  1,  1,127,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,127,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,127,  1,  1,120,  1,  1,  1,  1, 88,  0,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,127,  1,  1,127,  0, 88,  1,  1,  1,  1], // 6
      [  1,  1,121,  1,120,  1,120,  1,  1, 23, 23, 23, 23,  1,127,  1], // 7
      [  1,  1,  1,  1,120,  1,  1,127,  1,  1,121,127,121,120,120,  1], // 8
      [  1,120,  1,  1,  1,  1,  1,127,120,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 10
      [  1,  1,127,121,  1,  1,127,  1,  1,127,120,  1,120,  1,  1,  1], // 11
      [  1,127,  1,  1,  1,  1,  1,  1,121,127,  1,  1,127,  1,  1,  1], // 12
      [  1,  1,  1,121,  1,  1,  1,  1,  1,127,127,  1,  1,120,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Mire Hummocks', region: 'Eastern Fens', contentKey: 'eastern_fens_env_11_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C12R4_MAP', regionId: 'overworld', chunkX: 12, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,127,  1,127,  1, 23,  1, 23,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,127, 81,127,  1, 23, 81, 23,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,127,  1,127,  1, 23,  1, 23,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,127,  1,127,  1, 23,  1, 23,  1, 89,  1,  1,  1], // 4
      [  1,  1,  1,  1,127,  1, 81,  1, 23,  1, 23,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,127,  1,127,  1, 23,  1, 23,  1,  1, 89,  1,  1], // 6
      [  1,  1,  1,  1,127,  1,127,  1, 23,  1, 23,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,127,  1, 81,  1, 23,  1, 23,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,127,  1,127,  1, 23,  1, 23,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,127,  1,127,  1, 23,  1, 23,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,127,  1,127, 81, 23,  1, 23,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,127,  1,127,  1, 23, 81, 23,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,127,  1,127,  1, 23,  1, 23,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Drainage Flats', region: 'Eastern Fens', contentKey: 'eastern_fens_env_12_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C12R5_MAP', regionId: 'overworld', chunkX: 12, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,127,  1,  1,120, 23, 23,  1,  1, 23,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1, 23,127,121,  1,120,  1,120,120,  1], // 3
      [  1,  1,127,120,  1, 23,  1,  1,127, 81,127,  1,121,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,127, 23, 81, 81,120,  1,127,  1,  1], // 5
      [  1,  1,  1,  1,  1,127,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,121,  1,  1,  1,  1,121,127,127,  1,120,  1,120,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,127,  1,127,127,121,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1, 23,  1,127,121,  1,  1,  1, 23,121,  1], // 11
      [  1,  1,  1,121,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Open Fen Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_12_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C13R5_MAP', regionId: 'overworld', chunkX: 13, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,127,  1,  1], // 1
      [  1,  1,127,  1,  1,  1,  1,127,  1,  1,127,  1,  1,  1,127,  1], // 2
      [  1,127,  1,  1,  1,  1,121,  1,  1,127,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 5
      [  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,121, 81, 81,  1], // 6
      [  1,121, 81, 81, 81, 81, 81, 81, 81, 81,121, 81, 81, 81, 81,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1, 23, 23,  1,  1], // 8
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1, 23,121,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1, 23, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1, 23,  1,  1, 23, 23,  1,  1,  1,  1, 23, 23,  1], // 11
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,121,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Brackish Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_13_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C14R5_MAP', regionId: 'overworld', chunkX: 14, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 1
      [  1,  1,  1,127,127,  1,  1,  1,  1,120,  1,  1,  1,120,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,127,  1,  1,  1,120,  1,121,121,  1,  1], // 3
      [  1,  1,127,  1,  1,127,  1,120,  1,  1,  1,  1,120,120,  1,  1], // 4
      [  1,  1,  1,127,  1,127,  1,121,  1,120,121,  1,  1,  1,  1,  1], // 5
      [  1,120,127,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,127,  1,  1,  1,  1,  1, 88,  0,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,121,  1,127,  0, 88,120,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1, 23, 23, 23, 23,127,120,  1,  1,127,  1], // 9
      [  1,  1,121,127,  1,  1,  1,121,127,  1,  1,  1,127,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1], // 11
      [  1,  1,  1,127,  1,  1,  1,120,  1,  1,  1,127,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,120,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Mire Hummocks', region: 'Eastern Fens', contentKey: 'eastern_fens_env_14_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C15R5_MAP', regionId: 'overworld', chunkX: 15, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,120,  1,127,  1,  1,127,  1,  1,  1, 23,  1,  1], // 2
      [  1,  1,127,120,121, 23,  1,  1, 23,  1,127,  1,  1,  1,  1,  1], // 3
      [  1,  1,127,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1, 81,127, 23,  1,121,127,  1,  1,  1,  1,  1], // 5
      [  1,  1, 23,  1,  1, 81, 81,121,121,  1, 23,  1,127,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,127,121,120, 23,  1,  1,  1], // 7
      [  1,120, 23, 23,  1,  1,121,  1,  1,  1,  1,121,  1,  1,121,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,120,  1,127, 23,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,120,  1,  1, 23,  1,  1, 23,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,127,127,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,127,120,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Open Fen Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_15_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C16R5_MAP', regionId: 'overworld', chunkX: 16, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1, 23,  1,  1,  1, 23,  1,  1,121,  1,  1,120,121,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,120,121,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,127,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,121, 81,127,  1,  1,120,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1, 81, 81,  1,  1,  1,127,  1,  1,  1,  1], // 8
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1], // 9
      [  1,  1,  1, 23,  1,  1,  1, 23,  1,  1,  1, 23,  1,  1,  1,  1], // 10
      [  1,120,  1,  1,120,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1], // 11
      [  1,  1,127,  1,  1,  1,  1,120,  1,  1,  1,121,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,121,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Open Fen Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
];
window.EASTERN_FENS_ENVELOPE_CHUNK_DEFINITIONS = EASTERN_FENS_ENVELOPE_CHUNK_DEFINITIONS;
