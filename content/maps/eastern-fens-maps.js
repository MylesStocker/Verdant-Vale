'use strict';

// Eastern Fens terrain skeleton. Twenty-three regional chunks carry the MQ5
// route east from EASTERN_BANK_MAP, then north beside a navigable channel to
// the Valmere's southern shore. The winding raised road, reedbelt detour,
// reserved travellers' rise, managed drainage, open water, and unfinished
// Mornay threshold are terrain/topology only: no items, actors, triggers, or
// persistent state are authored here. Twenty-two chunks (chunkX <= 12 using
// the eastern_fens_mornay_easy profile, chunkX >= 13 using
// eastern_fens_mornay_hard) now draw random encounters from the Eastern Fens
// Mornay roster (data.js); EASTERN_FENS_TRAVELLERS_RISE_MAP stays
// encounter-free, reserved for its own MQ5 scripted ambush.

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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'Western old embankment beyond the ferry landing. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'The raised road turns north around deeper water. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'A weathered timber walk begins the reedbelt detour. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'The old line has failed; the maintained walk bends south. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'The detour regains firmer embankment ground. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'A quieter approach to the first sustained dry rise. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'An ordinary sheltered dry rise on the old embankment. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
  // (10,3) The first regular drainage cuts and maintained banks.
  { mapId: 'EASTERN_FENS_DRAINAGE_SW_MAP', regionId: 'overworld', chunkX: 10, chunkY: 3, map: [
      [  1,  1, 23,  2, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,  1, 23,  2, 23,  1,127,127,127,  0,127,127,  1,127, 81,  1], //  1
      [  1,  1,  1,  2,127, 23,127,127,127,127,  1, 23,127, 23, 81,  1], //  2
      [  1,  1,  1,  2,127,127,127,127,  1,127, 23, 23, 89,127, 81,  1], //  3
      [  1,  1,  1,  2,127,127,  1,127,127,127,127,127,127,  1, 81,  1], //  4
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'The first regular drainage cuts and maintained banks: a rectilinear worked reed plot and a straight Basin Mud drainage cut tighten the managed-drainage read here. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
  // (10,2) Worked reed plots sit behind narrow drainage cuts.
  { mapId: 'EASTERN_FENS_DRAINAGE_NW_MAP', regionId: 'overworld', chunkX: 10, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], //  0
      [  1,127,  1, 23, 23,127, 89,127,127,  1,127, 23,127,127,127,  1], //  1
      [  1,127, 23,127, 23,127,127,  1,127,127,  0,127,127,127,  1,  1], //  2
      [  1, 89,127,127,127,  1, 23,127,127,127,127,127,  1,127, 23,  1], //  3
      [  1,127,127,  1,127,  0,127,127,127,127,  1,127,127, 89,127,  1], //  4
      [  1, 23,127,127,127,127,127,127,  1,127, 81, 81, 81, 81,127,  1], //  5
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'Worked reed plots sit behind narrow drainage cuts: a rectilinear reed plot and a straight Basin Mud cut tighten the design. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
  // (11,2) Long maintained banks divide harvested reed beds.
  { mapId: 'EASTERN_FENS_WORKED_REEDS_MAP', regionId: 'overworld', chunkX: 11, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1, 81,127,127, 23, 23,  1,127,127,127,127,127,127,  1, 23, 23], //  1
      [  1, 81,127,127,  1,127,127,127,  2,  2,  2,  2,  2,  2,  2,  2], //  2
      [  1, 81,  1, 23, 23,127,127,127,  2,  1,127,127,127,127, 23, 23], //  3
      [  1, 81, 89,127,127,127,127,  1,  2,127,127,127,127,127,  1,  1], //  4
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'Long maintained banks divide harvested reed beds: a rectilinear reed plot and a straight Basin Mud cut tighten the design. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
  // (12,2) The road turns south through increasingly regular plots.
  { mapId: 'EASTERN_FENS_MANAGED_REEDS_MAP', regionId: 'overworld', chunkX: 12, chunkY: 2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [ 23, 23,127,  1,127,127,127,127,127,127,  1,127,127, 89,127,  1], //  1
      [  2,  2,  2,  2,  2,  2,  2,127,  1, 23,127,127,127,127,127,  1], //  2
      [ 23, 23,127,127,127,127,  2,127, 89,127,127,127,127, 23,127,  1], //  3
      [  1,  1,  1,127, 23,127,  2,127,127, 23, 23,  1,  0,127,127,  1], //  4
      [  1,  1,  1, 89,127,127,  2,127, 23,  1, 23, 23,127,127,127,  1], //  5
      [  1,  1,  1,127,127,127,  2,  1,127,127,127,127,127,127,  1,  1], //  6
      [  1,  1,  1, 23,127,  1,  2,127,127,127,127, 23,  1,127,127,  1], //  7
      [  1,  1,  1,  1,127,127,  2,127,127,127,  1,127,127,127,127,  1], //  8
      [  1,  1,  1,127,127,127,  2,  2,  2,  2,  2,127,127,127,  0,  1], //  9
      [  1,127,127, 81,127, 89,  1,127,127,127,  2,127,127,  1,127,  1], // 10
      [  1, 23,127, 81,  1,127, 81,127,127,127,  2,  1,127,127,127,  1], // 11
      [  1,127,  1,127,127, 81,127,127,127,  1,  2,127,127, 23,127,  1], // 12
      [  1,127,127,127,  0,127,127,  1,127, 23,  2, 23, 89,127,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  2, 23,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Managed Drainage', region: 'Eastern Fens', contentKey: 'eastern_fens_11',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_easy',
    allowRandomEncounters: true, allowSave: true,
    notes: 'The road turns south through increasingly regular plots: a rectilinear reed plot and two straight Basin Mud cuts tighten the design. Eastern Fens Mornay easy-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
  // (12,3) A dry travellers' rise before the widening waterways. MQ5 owns a
  // transient scripted ambush here; the physical grid and random-encounter
  // policy remain unchanged. A one-tile overlay leads to the local campsite.
  { mapId: 'EASTERN_FENS_TRAVELLERS_RISE_MAP', regionId: 'overworld', chunkX: 12, chunkY: 3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1], //  0
      [  1,127,127,127,127,127,127, 23,  0,  0,  2,  0,119,  3,119,  1], //  1
      [  1,127,127,127,127,127, 23,  0,  0, 88,  2,  0,  3,119,  3,  1], //  2
      [  1,127,127,127,127, 23,  0,  0, 88, 88,  2,  0,119,  3,119,  1], //  3
      [  1,127,127,127, 23,  0,  0,  0,  0,  0,  2,119,  0,  0,  0,  1], //  4
      [  1,127,127, 23,  0,  0,  0,  0,  0, 89,  2,  3,  0,119,  0,  1], //  5
      [  1,127, 23,  0,  0,  0,  0, 88, 88,  0,  2,119,  0,  3,  0,  1], //  6
      [  1,127, 23,  0,  0,  0,  0,119,  0,  0,  2,  2,  2,  2,  2,  2], //  7
      [  1,127, 23,  0, 81,  0,  0,  0,  0,119,  0,  3,  0,  0,  2,  2], //  8
      [  1,127, 23,  0,  0,  0,  0,  0,  0,  3,  0,  0,119,  3,  2,  2], //  9
      [  1,127, 23,  0,  0,  0,  0, 88, 88,119,  0,  0,  0,  0, 23,  1], // 10
      [  1,127,127, 81,  0,  0,  0,  0,  0,  3,  0,  0,  0, 23,127,  1], // 11
      [  1,127,127,127, 23,  0,  0,  0,  0,119,  0,  0, 23,127,127,  1], // 12
      [  1,127,127,127,127, 23, 23, 23, 23,  3, 23, 23,127,127,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Travellers’ Rise', region: 'Eastern Fens', contentKey: 'eastern_fens_12',
    presentation: 'continuous', encounterProfileId: 'far',
    allowRandomEncounters: false, allowSave: true,
    notes: 'Dry rise used by road workers, reed cutters, couriers, and travellers. A continuous hill/scrub shoulder makes (10,7) the sole crossing from the western pocket to the eastern road. The east-exit story gate remains defensive backup. The MQ5 ambush stages transient actors here. Its victory leads to the separate one-tile campsite entrance at (6,4); no random encounters.' },
  // (13,3) A timbered bank crosses the widest water on the route.
  { mapId: 'EASTERN_FENS_WIDE_WATER_MAP', regionId: 'overworld', chunkX: 13, chunkY: 3, map: [
      [  1,  1,  1,  1, 58,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,127,  1, 23, 58, 23,  1,  1,  1,127,  1,  1,127,127,  1,  1], //  1
      [  1,  1,127,  1, 58,  1,127,  1,  1,  1,127,  1,  1,  1,127,  1], //  2
      [  1,  1,  1,127, 58, 58, 58, 58, 58,  1,  1,127,  1,  1,  1,  1], //  3
      [  1,  1,  1, 23,127,  1,  1,  1, 58,  1,  1, 23,127,  1,  1,  1], //  4
      [  1,127, 81,  1,  1,127,  1,  1, 58,127,  1,  1,  1,127,  1,  1], //  5
      [  1,  1,127,  1,  1,  1, 23,  1, 58,  1,127,  1,  1,  1, 81,  1], //  6
      [ 23, 23,  1,127,  1,  1,  1,127, 58,  1, 23,127,  1,  1,  1,  1], //  7
      [ 58, 58, 58, 58, 58, 58, 58, 58, 58,  1,  1,  1,127,  1,  1,  1], //  8
      [ 23, 23,  1, 58, 58, 58,  1,  1,  1,127,  1,  1,  1,127,  1,  1], //  9
      [  1,  1,127, 23, 58, 23,127,  1,  1,  1,127,  1,  1,  1,127,  1], // 10
      [  1,  1,  1, 23, 58, 23,  1,127, 23,  1,  1,127,  1,  1,  1,  1], // 11
      [  1,  1,  1, 23, 58, 23,  1,  1,127,  1,  1,  1, 23,  1,  1,  1], // 12
      [  1,127,  1, 23, 58, 23,  1,  1,  1,127,  1, 81,  1,127,  1,  1], // 13
      [  1,  1,  1, 58, 58, 58,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Lakeward Reach', region: 'Eastern Fens', contentKey: 'eastern_fens_13',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard',
    allowRandomEncounters: true, allowSave: true,
    notes: 'A timbered bank crosses the widest water on the route; two isolated bank cells now connect into their neighboring Deep Reeds clusters instead of standing alone. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard',
    allowRandomEncounters: true, allowSave: true,
    notes: 'Maintained road and drainage converge toward a navigable eastern channel. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
  // (14,4) A broad roadside margin continues toward the managed channel.
  { mapId: 'EASTERN_FENS_CHANNEL_APPROACH_E_MAP', regionId: 'overworld', chunkX: 14, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], //  0
      [  1,127,127,127,127,  1,127,127,127,127,127, 23,  1,127,127,  1], //  1
      [  1,127,127,  1,127,127,127,127,127,127, 89,127,127,127,127,  1], //  2
      [  1,  1,127,127,127,127, 23,127,  1,127,127,127,127,127,127,  1], //  3
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard',
    allowRandomEncounters: true, allowSave: true,
    notes: 'A broad roadside margin approaches the channel that carries traffic north to the Valmere; a few isolated fill cells folded into the surrounding Deep Reeds field. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Valmere Road Turn', region: 'Eastern Fens', contentKey: 'eastern_fens_16',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard',
    allowRandomEncounters: true, allowSave: true,
    notes: 'The eastbound embankment meets a managed navigable channel and turns north toward the Valmere; a southward spur drops into the Southern Moraine. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Raised road beside the managed navigable channel. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Drainage cuts feed the widening channel beside the maintained road. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'The widening channel and its engineered bank carry the road toward the Valmere. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
  // (15,0) First broad view of the Valmere; the northbound road turns east along its southern shore.
  { mapId: 'EASTERN_FENS_VALMERE_REVEAL_MAP', regionId: 'overworld', chunkX: 15, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,129,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,129,  1],
      [128,128,128, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,128,128,  1],
      [ 23, 23, 23, 23, 23,  0,  0,  0,  0,  0,  0, 23, 23, 23, 23,  1],
      [127,127,127,127, 23,  0,  0,  2,  0,  0,  0, 23,127,127,127,  1],
      [  1,127,127,127, 23,  0,  0,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1,127,127,127, 23,  0,  0,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1,127,127,127, 23,  0,  0,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1,127,127,127, 23,  0,  0,  2,  0,  0,  0, 23,127,127,127,  1],
      [  1,127,127,127, 23,  0,  2,  2,  2,  0,  0, 23,127,127,127,  1],
      [  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Valmere — Southern Shore', region: 'Eastern Fens', contentKey: 'eastern_fens_20',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'First broad Valmere view where the channel reaches the inland sea and the road turns east along firm southern shore. Gravel-bar shingle flanks the mud bank, with driftwood stranded at the open-water edge. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state. A west seam (rows 6-8) now opens onto the Valmere expanse (EASTERN_FENS_ENVELOPE_C14R0_MAP).' },
  // (16,0) A maintained shore road keeps open Valmere water continuously to the north.
  { mapId: 'EASTERN_FENS_VALMERE_SHORE_W_MAP', regionId: 'overworld', chunkX: 16, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,129,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,129,  1],
      [  1,128,128, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,128,128,  1],
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Firm engineered southern shore road with open Valmere water to the north. Gravel-bar shingle flanks the mud bank, with driftwood stranded at the open-water edge. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
  // (17,0) Firmer margins and a broader road anticipate the unbuilt Mornay district.
  { mapId: 'EASTERN_FENS_VALMERE_SHORE_E_MAP', regionId: 'overworld', chunkX: 17, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,129,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,129,  1],
      [  1,128,128, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,128,128,  1],
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
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Broader maintained road and firm shore ground before the unbuilt Mornay district. Gravel-bar shingle flanks the mud bank, with driftwood stranded at the open-water edge. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
  // (18,0) Safe unfinished threshold on firm southern-shore ground before Mornay.
  { mapId: 'EASTERN_FENS_MORNAY_THRESHOLD_MAP', regionId: 'overworld', chunkX: 18, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  1,  1,  1,  1,  1,  1],
      [  1,129,  1,  1,  1,  1,  2,  2,  2,  2,  1,  1,  1,  1,129,  1],
      [  1,128,128, 81, 81, 81,  2,  2,  2,  2, 81, 81, 81,128,128,  1],
      [  1, 23,  0,  0,  0,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  1],
      [  1, 23,  0,  0, 88, 88,  2,  2,  2,  2, 88, 88,  0,  0,  0,  1],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  1, 23,  0,  0, 89,  0,  0,  0,  0,  0,  0, 89,  0,  0,  0,  1],
      [  1,127, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Valmere — Mornay Threshold', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_threshold',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Safe unfinished southern-shore threshold before Mornay. The maintained road visibly continues without a false transition or permanent obstruction. Gravel-bar shingle flanks the mud bank, with driftwood stranded at the open-water edge; a southward spur drops onto the Eastern Shore. Eastern Fens Mornay hard-leaning encounters now enabled; no items, NPCs, interactions, quest triggers, or new save state.' },
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
      [  1,  1,  1,  1,  1,  1,  1, 23, 23, 23,  1,  1,  1,  1,  1,  1], // 0
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
    presentation: 'continuous', encounterProfileId: 'north_fen_zolom', allowRandomEncounters: true, allowSave: true,
    notes: 'Walkable open north fen off the reedbelt; room to wander out to the camera-clamped world edge. A natural reed-gap seam in the north border now opens onto the Great Fen (GREAT_FEN_C7RN2_MAP via EASTERN_FENS_ENVELOPE_C7RN1_MAP). The sole random encounter here is the Fen Zolom — essentially unwinnable, escape blocked — guarding the gate into the Great Fen; no items, NPCs, interactions, or quest triggers, and no new save bindings beyond the encounter itself.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C8R0_MAP', regionId: 'overworld', chunkX: 8, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1, 23, 23, 23,  1,  1,  1,  1,  1,  1], // 0
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
    presentation: 'continuous', encounterProfileId: 'north_fen_zolom', allowRandomEncounters: true, allowSave: true,
    notes: 'Walkable open north fen off the reedbelt; room to wander out to the camera-clamped world edge. A natural reed-gap seam in the north border now opens onto the Great Fen (GREAT_FEN_C8RN2_MAP via EASTERN_FENS_ENVELOPE_C8RN1_MAP). The sole random encounter here is the Fen Zolom — essentially unwinnable, escape blocked — guarding the gate into the Great Fen; no items, NPCs, interactions, or quest triggers, and no new save bindings beyond the encounter itself.' },
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
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  1], // 10
      [  1,  0, 23, 23, 23, 23, 23, 23,127, 23, 23, 23, 23, 23,  0,  1], // 11
      [  1,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Sheltered Cove', region: 'Valmere', contentKey: 'valmere_expanse_14_0',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore entry chunk converted from scenery-only open fen water; walkable, hard-pool encounters active immediately.' },
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
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1,  1], // 2
      [  1,  1, 81, 81,  3,  3, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1], // 3
      [  1,  1, 81, 81,  3, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1], // 4
      [  1,  1, 81, 81, 81, 81, 81, 23, 23, 81, 81, 81, 81, 81,  1,  1], // 5
      [  1,  1, 81, 81, 81, 81,  0,  0,  0,  0, 81, 81, 81, 81,  1,  1], // 6
      [  1,  1, 81, 81, 81, 81,  0,  0,  0,  0, 81, 81, 81, 81,  1,  1], // 7
      [  1,  1, 81, 81, 81, 81,  0,  0,  0,  0, 81, 81, 81, 81,  1,  1], // 8
      [  1,  1, 81, 81, 81, 81, 23, 23, 81, 81,  3,  3, 81, 81,  1,  1], // 9
      [  1,  1, 81, 81, 81, 81, 81, 81, 81, 81,  3, 81, 81, 81,  1,  1], // 10
      [  1,  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1], // 11
      [  1,  1,  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Peat Bog: West Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_9_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: the raised peat bog begins — a hummocky Basin Mud (81) floor with the first willow clumps (3) and a damp grass/reed clearing (0/23) at centre, open water reduced to small corner pools. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C10R1_MAP', regionId: 'overworld', chunkX: 10, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  3,  1,  1,  1,  1,  1,  1,  3,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  3,  1,  1,  1,  1,  1,  1,  3,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1, 81,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1,  1], // 7
      [  1,  1,  1, 81, 81,  3,  0,  0,  0,  0,  3, 81, 81,  1,  1,  1], // 8
      [  1,  1,  1, 81, 81,  3,  0,  0,  0,  0,  3, 81, 81,  1,  1,  1], // 9
      [  1,  1,  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1,  1], // 10
      [  1,  1,  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Peat Bog: Clearing', region: 'Eastern Fens', contentKey: 'eastern_fens_env_10_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable off-road peat-bog clearing north of the managed cuts; a dead-end pocket off the road, bounded by a Basin Mud bog floor and scattered willow clumps. Terrain only: no encounters, items, NPCs, interactions, quest triggers, or save bindings.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C11R1_MAP', regionId: 'overworld', chunkX: 11, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1, 81,  3, 81, 81, 81, 81,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1, 81, 81, 81,  3, 81, 81,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1, 81,  3, 81, 81, 81, 81, 23,  1, 23,  1,  1], // 4
      [  1,  1,  1,  1,  1, 81, 81, 81, 81,  3, 81,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1, 81, 81,  3,  0,  0, 81,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1, 81,  3, 81,  0,  0, 81,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1, 81, 81, 81,  0,  0, 81,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1, 81, 81,  3, 81, 81, 81,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1, 81, 81, 81,  3, 81, 81, 23,  1, 23,  1,  1], // 10
      [  1,  1,  1,  1,  1, 81,  3, 81, 81, 81, 81,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1, 81, 81, 81, 81, 81, 81,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Peat Bog: Willow Stand', region: 'Eastern Fens', contentKey: 'eastern_fens_env_11_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: the bog’s willow identity is strongest here — a dense scatter of willow clumps (3) rooted in the Basin Mud (81) floor, with a small grassy damp patch (0) at centre and reed-fringed (23) pools at the margins. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C12R1_MAP', regionId: 'overworld', chunkX: 12, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1, 81, 81, 81,  1,  1,  1, 81, 81, 81,  1, 81, 81, 81,  1], // 2
      [  1,  1, 81,  3, 81,  1,  1,  1, 81, 81, 81,  1, 81, 81, 81,  1], // 3
      [  1,  1, 81, 81, 81,  1,  1,  1, 81, 81, 81,  1, 81, 81, 81,  1], // 4
      [  1,  1,  1,  1,  1, 23, 23, 23, 23, 23, 23,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1, 23, 23, 23, 23, 23, 23,  1,  1,  1,  1,  1], // 6
      [  1,  1, 81, 81, 81,  1, 81, 81, 81,  1,  1, 81, 81, 81,  1,  1], // 7
      [  1,  1, 81, 81, 81,  1, 81,  3, 81,  1,  1, 81, 81, 81,  1,  1], // 8
      [  1,  1, 81, 81, 81, 23, 23, 23, 23, 23, 23, 81, 81, 81,  1,  1], // 9
      [  1,  1,  1,  1,  1, 23, 23, 23, 23, 23, 23,  1,  1,  1,  1,  1], // 10
      [  1,  1, 81, 81, 81,  1,  1, 81, 81, 81,  1, 81, 81, 81,  1,  1], // 11
      [  1,  1, 81, 81, 81,  1,  1, 81, 81, 81,  1, 81,  3, 81,  1,  1], // 12
      [  1,  1, 81, 81, 81,  1,  1, 81, 81, 81,  1, 81, 81, 81,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Peat Bog: Hummocks', region: 'Eastern Fens', contentKey: 'eastern_fens_env_12_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: the bog floor breaks into distinct raised hummocks (81) separated by narrow wet reed channels (23) — the "hummock" landform other chunks only named, delivered here at tile level. A couple of willow clumps (3) root on the drier hummock tops. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C13R1_MAP', regionId: 'overworld', chunkX: 13, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1, 23, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1,  1], // 3
      [  1,  1,  1, 81, 81,  3, 81, 81, 81, 81, 81, 81, 81,  1,  1,  1], // 4
      [  1,  1,  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1,  1], // 5
      [  1,  1,  1, 81, 81, 81,  0,  0,  0,  0, 81, 81, 81,  1,  1,  1], // 6
      [  1,  1,  1, 81, 81, 81,  0,  0,  0,  0, 81, 81, 81,  1,  1,  1], // 7
      [  1,  1,  1, 81, 81, 81,  0,  0,  0,  0, 81, 81, 81,  1,  1,  1], // 8
      [  1,  1,  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 81,  1,  1,  1], // 9
      [  1,  1,  1, 81, 81, 81, 81, 81, 81, 81,  3, 81, 81,  1,  1,  1], // 10
      [  1,  1,  1, 81, 81, 81, 81, 81, 81, 81, 81, 81, 23,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Peat Bog: East Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_13_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: the bog continues east, thinner than its western margin — a Basin Mud (81) floor with a damp grass clearing (0) at centre and the odd willow clump (3) or reed fringe (23). playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C14R1_MAP', regionId: 'overworld', chunkX: 14, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1, 81, 81, 81, 81, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 2
      [  1,  1, 81, 81, 81, 81, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 3
      [  1,  1, 81,  3, 81, 81, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 4
      [  1,  1, 81, 81,  0,  0, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 5
      [  1,  1, 81, 81,  0,  0, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 6
      [  1,  1, 81, 81,  0,  0, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 7
      [  1,  1, 81, 81, 81, 81, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 8
      [  1,  1, 81, 81,  3, 81, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 9
      [  1,  1, 81, 81, 81, 81, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 10
      [  1,  1, 81, 81, 81, 81, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 11
      [  1,  1, 81, 81, 81, 81, 81,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Peat Bog: Drainage Lip', region: 'Eastern Fens', contentKey: 'eastern_fens_env_14_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: the bog drains east toward the widening channel beyond — the last hummocky Basin Mud (81) ground gives way to a straight managed reed channel (23) along the chunk’s east side. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
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
    displayName: 'Eastern Fens — Silted Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_1',
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
    displayName: 'Eastern Fens — Silted Margin', region: 'Eastern Fens', contentKey: 'eastern_fens_env_17_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter fen completing the visible landscape (playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C18R1_MAP', regionId: 'overworld', chunkX: 18, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81, 88,  0,  0,  1], // 4
      [  1,  0,  0,  0, 81,  0,  0, 81,  0, 88, 81,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0,  1], // 6
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 7
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,128,  0,  0,  1], // 8
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Shore — Clay Bank', region: 'Eastern Shore', contentKey: 'eastern_shore_18_1',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Eastern Shore entry chunk converted from scenery-only open fen water; walkable, hard-pool encounters active immediately. A northward spur rejoins the Valmere Mornay Threshold road.' },
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
      [  1,  1,  1,  1,  1,121,  1,  1,  1,120,128,128,  1,120,120,  1], // 5
      [  1,  1,  1,  1,  1,  1, 81,127, 23,  1,128,  1,121,  1,  1,  1], // 6
      [  1,121,  1,  1,  1,127, 81, 81,  1,  1,121,  1,  1,  1,  1,  1], // 7
      [  1,  1, 23,  1,  1,  1,  1, 23,  1,  1,  1,127,  1,120,  1,  1], // 8
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,120,121,  1,  1,  1,  1], // 9
      [  1,  1,  1, 23,  1,  1,120,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 10
      [  1,  1,  1,127,120,  1,  1,120,127, 23,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1, 23, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,121,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Storm Shoal', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: open, storm-exposed Valmere-approach water with a small emergent gravel shoal (128) and clustered rock/snag hazards. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
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
    displayName: 'Eastern Fens — Storm Shoal: Mudbank', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: a long exposed Basin Mud (81) bank breaks the open water here — the widening channel’s lakeward silt, not just more scattered noise. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
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
      [  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1], // 1
      [  1,  1,  1,119,119,119,119,119,119,119,119,  1, 81,  1,  1,  1], // 2
      [  1,  1,  1,119,128,128,128,128,128,128,119,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,119,128,128,128,128,128,128,119,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,119,128,128,128,128,128,128,119,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,119,128,128,128,  0,  0,128,119,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,119,128,128,128,  0,  0,128,119,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,119,128,128, 23,128,128, 23,119,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,119,119,119,119,119,119,119,119,  1,  1, 81,  1,  1], // 9
      [  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1, 81,  1,  1, 81,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Moraine Ridge: West Shoulder', region: 'Eastern Fens', contentKey: 'eastern_fens_env_8_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: the moraine ridge rises out of the fen here — a gravel-bar crest (128) flanked by scrub hills (119), with a small grassy saddle and peat hollows (81) in the surrounding low ground. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C9R4_MAP', regionId: 'overworld', chunkX: 9, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1, 23,127,127,127,127, 23,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1, 23,127,127,  0,  0,  0,  0,127,127, 23,  1,  1,  1], // 2
      [  1,  1, 23,127,  0,  0,  0,128,128,  0,  0,  0,127, 23,  1,  1], // 3
      [  1,  1, 23,  0,  0,128,128,128,128,128,  0,  0, 23,  0,  1,  1], // 4
      [  1,  1, 23,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,127,  1,  1], // 5
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
    displayName: 'Eastern Fens — Moraine Ridge: Hummock Clearing', region: 'Eastern Fens', contentKey: 'eastern_fens_env_9_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: true,
    notes: 'Walkable off-road firm grassy hummock and small clearing south of the dry rise, centred on a small gravel-bar (128) knoll — the moraine ridge that flanks this chunk to east and west (room reserved for a future quiet location, with no trigger or interaction); bounded by a collapsed embankment, a low moraine, and flooded ground. Terrain only: no encounters, items, NPCs, interactions, quest triggers, or save bindings.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C10R4_MAP', regionId: 'overworld', chunkX: 10, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1, 81, 81,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1, 23,  1,  1, 23, 23, 23, 23,  1,  1, 23,  1,  1,  1], // 2
      [  1,  1,  1, 23,  1, 23, 23, 23, 23, 23, 23,  1, 23,  1,  1,  1], // 3
      [  1,  1,  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,119,119,119,119,119,119,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,119, 81, 81, 81, 81,119,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,119, 81,128,128, 81,119,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,119, 81, 81, 81, 81,119,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,119,119,119,119,119,119,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1], // 10
      [  1,  1,  1,119,  1,  1,  1,  1,  1,  1,  1,  1,119,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  0,  1,  1,  0,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Moraine Ridge: Hollow', region: 'Eastern Fens', contentKey: 'eastern_fens_env_10_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: the ridge dips into a wet hollow here — a reed-choked basin (23) giving way to a hills-ringed peat pocket (81) with a small gravel-bar (128) island at its driest centre. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C11R4_MAP', regionId: 'overworld', chunkX: 11, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1, 81,  1,  1], // 1
      [  1,  1,  1,  1, 81,119,119,119,119,119,119,119,119,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,119,128,128,128,128,128,128,119,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,119,128,128,128,128,128,128,119,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,119,128,128,128,128,128,128,119,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,119,128,128,  0,  0,128,128,119,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,119,128,128,  0,  0,128,128,119,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,119, 23,128,128, 23,128,128,119,  1,  1,  1], // 8
      [  1,  1,  1, 81,  1,119,119,119,119,119,119,119,119,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1], // 10
      [  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1, 81,  1,  1, 81,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Moraine Ridge: East Shoulder', region: 'Eastern Fens', contentKey: 'eastern_fens_env_11_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: the ridge crest continues east — a mirrored gravel-bar (128) rise flanked by scrub hills (119), grassy saddle at centre, peat hollows (81) in the surrounding low ground. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C12R4_MAP', regionId: 'overworld', chunkX: 12, chunkY: 4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,128, 81,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,119,  1,  1,128, 81,  1,  1,128,  1,  1,  1,  1], // 2
      [  1,  1,  1,128,128,128,  1,128, 81,  1,119,119,119,  1,  1,  1], // 3
      [  1,  1,  1,128,128,128,  1,128, 81,  1,119,119,119,  1,  1,  1], // 4
      [  1,  1,  1,128,128,128,  1,128, 81,  1,119,119,119,  1,  1,  1], // 5
      [  1,  1,  1,128,128,128,  1,128, 81,  1,119,119,119, 81,  1,  1], // 6
      [  1,  1,  1,128,128,128,  1,128, 81,  1,119,119,119,  1,  1,  1], // 7
      [  1,  1, 81,128,128,128,  1,128, 81,  1,119,119,119,  1,  1,  1], // 8
      [  1,  1,  1,128,128,128,  1,128, 81,  1,119,119,119,  1,  1,  1], // 9
      [  1,  1,  1,128,128,128,  1,128, 81,  1,119,119,119,  1,  1,  1], // 10
      [  1,  1,  1,128,128,128,  1,128, 81,  1,119,119,119,  1,  1,  1], // 11
      [  1,  1,  1,  1,119,  1,  1,128, 81,  1,  1,128,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,128, 81,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Moraine Ridge: Outwash', region: 'Eastern Fens', contentKey: 'eastern_fens_env_12_4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: a straight, managed drainage cut (81) still runs through the outwash at the ridge’s foot, flanked by a gravel sediment fan (128) on the west side and scrub hills (119) on the east. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C12R5_MAP', regionId: 'overworld', chunkX: 12, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,119,119,119,119,119,119,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,119,128,128,128,128,119,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,119,128,128,128,128,119,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1, 81,  1,  1, 81,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1, 23, 23, 23, 23,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1, 23,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1, 23, 23, 23, 23,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1, 81,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 81,  1,  1,  1,  1], // 9
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Moraine Ridge: Drowned Toe', region: 'Eastern Fens', contentKey: 'eastern_fens_env_12_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: the moraine ridge trails off into open fen water here — a diminishing gravel-bar/hills remnant (continuous with the Outwash chunk directly north) giving way to reed-fringed shallows (23) and peat (81). playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C13R5_MAP', regionId: 'overworld', chunkX: 13, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,127,  1,  1], // 1
      [  1,  1,127,  1,  1,  1,  1,127,  1,  1,127,  1,  1,  1,127,  1], // 2
      [  1,127,  1,  1,  1,  1,121,  1,  1,127,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 5
      [  1, 81, 81, 81, 81, 81,128,128, 81, 81, 81, 81,121, 81, 81,  1], // 6
      [  1,121, 81, 81, 81, 81,128, 81, 81, 81,121, 81, 81, 81, 81,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1, 23, 23,  1,  1], // 8
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1, 23,121,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1, 23, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1, 23,  1,  1, 23, 23,  1,  1,  1,  1, 23, 23,  1], // 11
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,121,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Storm Shoal: West', region: 'Eastern Fens', contentKey: 'eastern_fens_env_13_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: an exposed Basin Mud (81) bank capped by a small gravel (128) shoal — the western edge of the lakeward silt that runs through this part of the widening channel. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C14R5_MAP', regionId: 'overworld', chunkX: 14, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 1
      [  1,  1,  1,127,127,  1,  1,  1,  1,120,  1,  1,  1,120,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,127,  1,  1,  1,120,  1,121,121,  1,  1], // 3
      [  1,  1,127,  1,  1,127,  1,120,  1,  1,  1,  1,120,120,  1,  1], // 4
      [  1,  1,  1,127,  1,127,  1,121,  1,120,121,  1,  1,  1,  1,  1], // 5
      [  1,128,128,  1,  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,127,  1,  1,  1,  1,  1, 88,  0,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,121,  1,127,  0, 88,120,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1, 23, 23, 23, 23,127,120,  1,  1,127,  1], // 9
      [  1,  1,121,127,  1,  1,  1,121,127,  1,  1,  1,127,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1], // 11
      [  1,  1,  1,127,  1,  1,  1,120,  1,  1,  1,127,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,120,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Lakeward Shallows', region: 'Eastern Fens', contentKey: 'eastern_fens_env_14_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: a small Exposed Stone/Grass islet with a new gravel (128) fringe breaks the open water — the storm-influenced shallows beyond the widening channel. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C15R5_MAP', regionId: 'overworld', chunkX: 15, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,  1], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  1], // 7
      [  1,  0,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,  0,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Southern Moraine — Gravel Ridge', region: 'Southern Moraine', contentKey: 'southern_moraine_15_5',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Southern Moraine entry chunk converted from scenery-only open fen water; walkable, hard-pool encounters active immediately. A northward spur rejoins the Eastern Fens Valmere Road Turn.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C16R5_MAP', regionId: 'overworld', chunkX: 16, chunkY: 5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,120,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1, 23,  1,  1,  1, 23,  1,  1,121,  1,  1,120,121,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,120,121,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,127,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,121,128,127,  1,  1,120,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,128,128,  1,  1,  1,127,  1,  1,  1,  1], // 8
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,120,  1,  1], // 9
      [  1,  1,  1, 23,  1,  1,  1, 23,  1,  1,  1, 23,  1,  1,  1,  1], // 10
      [  1,120,  1,  1,120,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1], // 11
      [  1,  1,127,  1,  1,  1,  1,120,  1,  1,  1,121,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,120,  1,  1,  1,  1,121,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Eastern Fens — Lakeward Shallows: East', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only: a small Basin Mud (81) patch capped by a gravel (128) rise breaks the open water — the easternmost storm-influenced shallows before the Valmere shoreline proper. playerAccessible: false; non-walkable borders, no seam/transition; fail-closed at the placement authority. No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C6RN1_MAP', regionId: 'overworld', chunkX: 6, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0, 81, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  1,  0, 88,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81, 81,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Hummock Ground', region: 'Great Fen', contentKey: 'great_fen_6_n1',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen entry chunk converted from scenery-only open fen water; walkable, hard-pool encounters active immediately, no roads.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C7RN1_MAP', regionId: 'overworld', chunkX: 7, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  1], // 2
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0], // 6
      [  0,  0,  0,  0,  0, 81,  0,  0, 88,  0,  0, 81,  0,  0,  0,  0], // 7
      [  0,  0,128,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 11
      [  1,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Mud Basin', region: 'Great Fen', contentKey: 'great_fen_7_n1',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen entry chunk converted from scenery-only open fen water; walkable, hard-pool encounters active immediately, no roads.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C8RN1_MAP', regionId: 'overworld', chunkX: 8, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 2
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 3
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,121,  0,  0,  0,127,  1], // 4
      [  1, 23,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,127,  1], // 5
      [  0, 23,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,  0,127,  0], // 6
      [  0, 23,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,127,  0], // 7
      [  0, 23,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,127,  0], // 8
      [  1, 23,127,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,127,  1], // 9
      [  1, 23,  0,  0,121,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 10
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 11
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Gravel Spur', region: 'Great Fen', contentKey: 'great_fen_8_n1',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen entry chunk converted from scenery-only open fen water; walkable, hard-pool encounters active immediately, no roads.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C9RN1_MAP', regionId: 'overworld', chunkX: 9, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,120,  0,  0,  1], // 2
      [  1,  0,  0,120,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 9
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 10
      [  1,  0,  0,120,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Drowned Woodland', region: 'Great Fen', contentKey: 'great_fen_9_n1',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen entry chunk converted from scenery-only open fen water; walkable, hard-pool encounters active immediately, no roads.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C14RN1_MAP', regionId: 'overworld', chunkX: 14, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,  0,  0,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,121, 88,  0,  0,  0,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,  0,  0,  0,  1], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,121,  0,  0,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Rocky Point', region: 'Valmere', contentKey: 'valmere_expanse_14_n1',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore entry chunk converted from scenery-only open fen water; walkable, hard-pool encounters active immediately.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C15RN1_MAP', regionId: 'overworld', chunkX: 15, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,121,  1],
      [  1,127,  1,  1,  1,  1,121,  1, 23,  1,  1,  1,  1,  1,127,  1],
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1],
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1],
      [  1,  1,  1,  1,  1, 23,  1,127,  1,  1,  1,  1,121,  1,  1,  1],
      [  1,  1,  1,  1,121,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,121,  1,  1,  1,  1],
      [  1,  1, 23,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1],
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1],
      [  1,  1,121,  1,127,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,127,  1,  1,121,  1,  1,  1,  1,  1,  1],
      [  1,121,  1,  1,  1,  1,  1,  1,127,  1,  1,  1, 23,  1,  1,  1],
      [  1,  1,  1,  1, 23,  1,  1,  1,121,  1,127,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Open Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_15_n1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only northern water extending the visible water edge one screen north (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_MORNAY_APPROACH_W_MAP', regionId: 'overworld', chunkX: 16, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  1],
      [  1,  0, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  1],
      [  1, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0,  1],
      [  1,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  1],
      [  1,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0],
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0],
      [  1,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0],
      [  1,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0],
      [  1,  0, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0],
      [  1, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0,  1],
      [  1,  0,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  1],
      [  1,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  0,  1],
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0, 23,  0,  0,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Valmere — Mornay Approach (West)', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_approach_w',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false,
    notes: 'Walkable Valmere port approach spit north of the shore; safe (no random encounters), no save point, no NPCs/items/interactions. East seam only; the Mornay peninsula is reached via the middle approach (EASTERN_FENS_MORNAY_APPROACH_M_MAP), not directly from here.' },
  { mapId: 'EASTERN_FENS_MORNAY_APPROACH_M_MAP', regionId: 'overworld', chunkX: 17, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1],
      [  1,  0, 23,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  0,  1],
      [  1, 23,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  0,  1],
      [  1,  0,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0, 23,  1],
      [  1,  0,  0,  0,  0,  0, 23,  2,  2,  2,  0,  0,  0, 23,  0,  1],
      [  0,  0,  0,  0,  0, 23,  0,  2,  2,  2,  0,  0, 23,  0,  0,  0],
      [  0,  0,  0,  0, 23,  0,  0,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  0,  0,  0, 23,  0,  0,  0,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  0,  0, 23,  0,  0,  0,  0,  2,  2,  2,  2,  2,  2,  2,  2,  2],
      [  0, 23,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  0,  0],
      [  1,  0,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0, 23,  1],
      [  1,  0,  0,  0,  0,  0, 23,  2,  2,  2,  0,  0,  0, 23,  0,  1],
      [  1,  0,  0,  0,  0, 23,  0,  2,  2,  2,  0,  0, 23,  0,  0,  1],
      [  1,  0,  0,  0, 23,  0,  0,  2,  2,  2,  0, 23,  0,  0,  0,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Valmere — Mornay Approach', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_approach_m',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false,
    notes: 'Walkable Valmere port approach spit north of the shore; safe (no random encounters), no save point, no NPCs/items/interactions. The southern neck of the Mornay peninsula: a paved spine (cols 7-9) now runs the full chunk height, with a rows-6-8 spur east to the EASTERN_FENS_MORNAY_APPROACH_E_MAP seam so the road connects all the way from the Valmere threshold up to Mornay rather than breaking into open fen; north seam (cols 7-9) reopens into EASTERN_FENS_MORNAY_NECK_ROAD_MAP, the peninsula spine.' },
  { mapId: 'EASTERN_FENS_MORNAY_APPROACH_E_MAP', regionId: 'overworld', chunkX: 18, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1, 23,  0,  0,  0,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  1],
      [  1,  0,  0,  0,  0,  0,  2,  2,  2,  2,  0,  0,  0,  0, 23,  1],
      [  1,  0,  0,  0,  0,  0,  2,  2,  2,  2,  0,  0,  0, 23,  0,  1],
      [  1,  0,  0,  0,  0, 23,  2,  2,  2,  2,  0,  0, 23,  0,  0,  1],
      [  0,  0,  0,  0, 23,  0,  2,  2,  2,  2,  0, 23,  0,  0,  0,  1],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2, 23,  0,  0,  0,  0,  1],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  0,  0,  0,  0,  0,  1],
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  0,  0,  0,  0,  0,  1],
      [  0,  0,  0,  0,  0,  0,  2,  2,  2,  2,  0,  0,  0,  0, 23,  1],
      [  1,  0,  0,  0,  0,  0,  2,  2,  2,  2,  0,  0,  0, 23,  0,  1],
      [  1,  0,  0,  0,  0, 23,  2,  2,  2,  2,  0,  0, 23,  0,  0,  1],
      [  1,  0,  0,  0, 23,  0,  2,  2,  2,  2,  0, 23,  0,  0,  0,  1],
      [  1,  0,  0, 23,  0,  0,  2,  2,  2,  2, 23,  0,  0,  0,  0,  1],
      [  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Valmere — Mornay Approach (East)', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_approach_e',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false,
    notes: 'Walkable Valmere port approach spit north of the shore; safe (no random encounters), no save point, no NPCs/items/interactions. The vertical spine (cols 6-9) now gains a rows-6-8 paved spur west to the EASTERN_FENS_MORNAY_APPROACH_M_MAP seam, so the road no longer breaks into open fen; the Mornay peninsula is reached via the middle approach (EASTERN_FENS_MORNAY_APPROACH_M_MAP), not directly from here.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C15RN2_MAP', regionId: 'overworld', chunkX: 15, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Open Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_15_n2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only Mornay headland/water north of the Valmere approach (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  // Six walkable peninsula chunks, named for geography rather than future
  // town districts. The town footprint remains solid and has no transition.
  { mapId: 'EASTERN_FENS_MORNAY_WESTERN_COVE_MAP', regionId: 'overworld', chunkX: 16, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1, 81, 81,  1,  0,  0,  0,  0,  0,128],
      [  1,  1,  1,  1,  0, 81, 81, 81,130,  0,  0,  0,  0,  0,  0,128],
      [  1,  1,  1,  1,  1,  1,  1, 81, 81,  1,  0,  0,  0,  0,  0,128],
      [  1,  1,  1,  1,  1,  1,  0, 81,  0,  0,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1, 88, 88,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Mornay Peninsula — Western Cove', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_western_approach',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false,
    notes: 'The peninsula’s western flank: a sheltered, shallow cove where fen craft can transfer cargo, with drought-exposed mud, a stranded boat, and a quiet mooring spur that dead-ends at rock to the south. East seam (rows 6-8) opens onto the peninsula spine (EASTERN_FENS_MORNAY_NECK_ROAD_MAP); north seam (cols 10-12) continues the west shore to EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP. No NPCs, items, interactions, quest triggers, or save state yet.' },
  { mapId: 'EASTERN_FENS_MORNAY_NECK_ROAD_MAP', regionId: 'overworld', chunkX: 17, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  0,  0,  2,  2,  2,  0,  0,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  0,  0,  2,  2,  2,  0,  0,  1,  1,  1,  1],
      [  1,  1,  1,119,  0,  0,  0,  2,  2,  2,  0,  0,119,  1,  1,  1],
      [  1,  1,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  1,  1],
      [  1,  1,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  1,  1],
      [128,  0,  0,  0,  0, 23,  0,  2,  2,  2,  0, 23,  0,  0,  0,128],
      [128,  0,  0,  0, 23,  0,  0,  2,  2,  2,  0,  0, 23,  0,  0,128],
      [128,  0,  0,  0,  0, 23,  0,  2,  2,  2,  0, 23,  0,  0,  0,128],
      [  1,  1,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  1,  1],
      [  1,  1,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  1,  1,  1],
      [  1,  1,  1,119,  1,  0,  0,  2,  2,  2,  0,  0,119,  1,  1,  1],
      [  1,  1,  1,  1,  1,  0,  0,  2,  2,  2,  0,  0,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Mornay Peninsula — Neck Road', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_admin_centre',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false,
    notes: 'The peninsula’s southern spine, where the main road narrows to cross the neck. Water cuts into both the west and east sides so the landmass is not a rectangular slab; a gravel-bar spit either side (rows 6-8) opens onto the Sheltered Cove (west) and the exposed eastern shore (east). South seam (cols 7-9) continues the road down to EASTERN_FENS_MORNAY_APPROACH_M_MAP; north seam (cols 7-9) continues it up to the Mornay crown (EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP). No NPCs, items, interactions, quest triggers, or save state yet.' },
  { mapId: 'EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP', regionId: 'overworld', chunkX: 18, chunkY: -2, map: [
      [  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  0,  0,  0,  0,  1,  1,121,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  0,  0,  0,  0,  1,121,  1,  1,121,  1,  1,  1,  1],
      [  1,  1,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,121,  1,  1,  1],
      [  1,  0,  0,  0,  0,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  0,  0,  0,  0,  1,  1,  1,  1,121,  1,  1,121,  1,  1,  1],
      [128,  0,  0,  0,  0, 88,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [128,  0,  0,  0,  0,  0,  0,  0,  0,  1,121,  1,  1,121,  1,  1],
      [128,  0,  0,  0,  0,  0, 88,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  0,  0,  0,  0,  1,  1,121,  1,  1,  1,121,  1,121,  1,  1],
      [  1,  1,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,129,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Mornay Peninsula — Eastern Shore', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_residential',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false,
    notes: 'The peninsula’s eastern flank, more exposed to Valmere than the western cove: a narrow shingle shore wraps north with open, rockier water beyond it, and a driftwood-littered spur south dead-ends at open water. West seam (rows 6-8) opens onto the peninsula spine (EASTERN_FENS_MORNAY_NECK_ROAD_MAP); north seam (cols 3-5) continues the east shore to EASTERN_FENS_MORNAY_EASTERN_POINT_MAP. No NPCs, items, interactions, quest triggers, or save state yet.' },
  { mapId: 'EASTERN_FENS_MORNAY_HARBOUR_SHORE_MAP', regionId: 'overworld', chunkX: 16, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1, 23, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1, 23,  0,  0, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1, 81, 81,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,128],
      [  1,  1, 81, 81, 81, 81,  1,  1,  0,  0,  0,  0,  0,  0,  0,128],
      [  1,  1,  1,130, 81, 81,  1,  1,  1,  0,  0,  0,  0,  0,  0,128],
      [  1,  1,  1,  1, 81,  1,  1,  1,  1,  0,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1],
    ],
    displayName: 'Mornay Peninsula — Harbour Shore', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_harbour',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false,
    notes: 'A sheltered, shallow harbour-facing shore where fen craft would transfer cargo to larger Valmere vessels: drought-exposed mud and a stranded boat, with a quiet mooring spur north that dead-ends at reeds. South seam (cols 10-12) continues the west shore down to the Sheltered Cove (EASTERN_FENS_MORNAY_WESTERN_COVE_MAP); east seam (rows 6-8) opens onto the Mornay crown (EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP). No NPCs, items, interactions, quest triggers, or save state yet.' },
  { mapId: 'EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP', regionId: 'overworld', chunkX: 17, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1, 13, 13,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  0,  0, 13, 13,  0,  0,  0,  1,  1,  1,  1],
      [  1,  1,  1,  1,  0,  0,  0, 14, 14,  2,  0,  0,  0,  1,  1,  1],
      [  1,  1,  1,  0, 23,  0,  0,  2,  2,  2,  0,  0, 23,  0,  1,  1],
      [  1,  1,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  1,  1],
      [128,  0,  0, 23,  0,  0,  0,  2,  2,  2,  0,  0,  0, 23,  0,  1],
      [128,  0,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  0,  1],
      [128,  0,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  1,  1],
      [  1,  1,  1,  0,  0, 23,  0,  2,  2,  2,  0, 23,  0,  1,  1,  1],
      [  1,  0,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  0,128],
      [  1,  0,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  0,128],
      [  1,  1,  0,  0,  0,  0,  0,  2,  2,  2,  0,  0,  0,  0,  0,128],
      [  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Mornay Peninsula — Town Approach', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_working_waterfront',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false,
    notes: 'The peninsula’s northern crown, on firm ground above the rest of the landform, with substantial open Valmere water visible on every side. The town-scale marker is two tiles wide by three high: solid upper wall/building tiles at rows 1-2 cols 7-8, with paired West/East Gate TOWN_ENTRANCE tiles at row 3 cols 7-8. These lead to the separate seventeen-map Mornay exterior; their paired returns land on the exact corresponding entrance tile. South seam (cols 7-9) continues the road down to EASTERN_FENS_MORNAY_NECK_ROAD_MAP; west seam (rows 6-8) reaches the harbour shore; east seam (rows 10-12) reaches the exposed point. No overworld NPCs, items, interactions or encounter permission were added.' },
  { mapId: 'EASTERN_FENS_MORNAY_EASTERN_POINT_MAP', regionId: 'overworld', chunkX: 18, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,128,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,128,128,128,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,128,128,128,128,128,129,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1, 23, 23, 23, 23, 23, 23, 23,129,  1,  1,  1],
      [  1,  1,  1,  1, 23, 23, 23, 23, 23, 23, 23,  1,  1,  1,  1,  1],
      [  1,  1,  1, 23, 23, 23, 23, 23, 23,  1,  1,  1,  1,  1,  1,  1],
      [128,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [128,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1],
      [128,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Mornay Peninsula — Eastern Point', region: 'Eastern Fens', contentKey: 'eastern_fens_mornay_eastern_edge',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false,
    notes: 'The peninsula’s most exposed corner: a reed-fringed gravel point looking out over open Valmere water, with driftwood caught on its lee side. The point’s tip is a natural dead end (water on three sides). South seam (cols 3-5) continues the east shore down to the exposed eastern shore (EASTERN_FENS_MORNAY_EASTERN_SHORE_MAP); west seam (rows 10-12) reaches the Mornay crown (EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP). No NPCs, items, interactions, quest triggers, or save state yet.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C15RN3_MAP', regionId: 'overworld', chunkX: 15, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,127,121,  1, 23,  1,  1,  1,  1,  1],
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,127,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,127,121,  1],
      [  1,  1,127,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1, 23,121,  1,  1],
      [  1,  1,  1,  1, 23,121,127,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,121,  1,  1,  1],
      [  1,  1,  1,  1,121,  1,  1,  1,  1, 23,127,  1,  1,  1,  1,  1],
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,127,  1,  1,  1],
      [  1,127,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1],
      [  1,  1,  1,127,  1,  1, 23,  1,  1,  1,121,  1,  1,  1,  1,  1],
      [  1,  1,121,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Open Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_15_n3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water, placed to prevent void exposure around the Mornay peninsula (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C15RN4_MAP', regionId: 'overworld', chunkX: 15, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,127,  1,  1,121,  1,  1,  1,  1, 23,  1,  1,  1,  1],
      [  1,  1,  1, 23,  1,127,  1,  1,  1,  1,  1,  1,  1,121,  1,  1],
      [  1,  1,  1,  1,  1,121,  1,127,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,127,  1,  1,121,  1,  1,  1],
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,127,  1,  1],
      [  1,  1,127,121,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1],
      [  1,  1,121,  1,  1,  1,127,  1,  1,  1, 23,  1,  1,  1,  1,  1],
      [  1,  1, 23,  1,  1,  1,  1,  1,127,121,  1,  1,  1,  1,  1,  1],
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1, 23,121,  1,  1,  1,127,  1,  1,  1],
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Open Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_15_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water, placed to prevent void exposure around the Mornay peninsula (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C16RN4_MAP', regionId: 'overworld', chunkX: 16, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1, 23,  1,  1,127,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1],
      [  1,  1,  1,121,  1,  1,127,  1,  1,  1,  1,  1,  1,  1, 23,  1],
      [  1,  1,  1,  1,  1,  1, 23,  1,127,  1,121,  1,  1,  1,  1,  1],
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1, 23,127,  1,  1,  1],
      [  1,121,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1],
      [  1,  1,  1,127,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,127,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1, 23,121,  1],
      [  1,  1,  1,  1,  1, 23,121,  1,  1,  1,  1,127,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1],
      [  1,  1,127,  1,  1,121,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Open Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_16_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water, placed to prevent void exposure around the Mornay peninsula (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C17RN4_MAP', regionId: 'overworld', chunkX: 17, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,121,  1,  1,  1,127,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1],
      [  1,  1,  1,  1, 23,  1,  1,127,121,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,121,  1, 23,  1,127,  1,  1,  1,  1],
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,121,  1],
      [  1,  1,127,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1, 23,  1],
      [  1,  1,  1,  1,127,  1, 23,  1,  1,  1,  1,  1,  1,121,  1,  1],
      [  1,  1,  1,  1,  1,121,127,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1, 23,121,  1,  1,  1],
      [  1,  1,  1, 23,121,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,127,  1,  1,  1],
      [  1,127,  1,121,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,127,  1],
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Open Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_17_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water, placed to prevent void exposure around the Mornay peninsula (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'EASTERN_FENS_ENVELOPE_C18RN4_MAP', regionId: 'overworld', chunkX: 18, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1, 23,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,121,  1,  1],
      [  1,  1,  1,  1,  1,121,  1, 23,  1,  1,127,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1],
      [  1,127,  1,  1,121,  1,  1,  1,  1,  1,  1,  1, 23,  1,127,  1],
      [  1,  1,  1,127, 23,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1],
      [  1,  1,  1,121,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,127,  1, 23,121,  1,  1,  1,  1,  1],
      [  1, 23,121,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,127,  1,  1, 23,  1],
      [  1,121,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,127,  1,  1],
      [  1,  1,127,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1],
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1],
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    ],
    displayName: 'Eastern Fens — Valmere Open Water', region: 'Eastern Fens', contentKey: 'eastern_fens_env_18_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water, placed to prevent void exposure around the Mornay peninsula (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
];
window.EASTERN_FENS_ENVELOPE_CHUNK_DEFINITIONS = EASTERN_FENS_ENVELOPE_CHUNK_DEFINITIONS;
