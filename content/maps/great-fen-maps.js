'use strict';

// Great Fen: a vast, lightly-populated wetland west/northwest of Mornay,
// reached only through two natural reed-gap seams opening north off the
// existing Eastern Fens North Fen chunks (EASTERN_FENS_ENVELOPE_C7R0_MAP and
// C8R0_MAP). Entirely roadless -- no path/causeway/bridge/town-floor tiles
// anywhere in this file. Walkable throughout, encounters enabled immediately
// using the established eastern_fens_mornay_hard formation pool (no separate
// introductory pool). Dense internal seaming gives a broad branching/looping
// exploration network rather than a single corridor; every branch returns to
// the two entrances. The whole footprint stays on the pre-ambush (west) side
// of Travellers' Rise and does not connect to Mornay, the wider west/north
// continent, or open Valmere.

const GREAT_FEN_REGIONAL_CHUNK_DEFINITIONS = [
  { mapId: 'GREAT_FEN_C1RN5_MAP', regionId: 'overworld', chunkX: 1, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 1
      [  1,  0,  0,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81, 81,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0, 81, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Hummock Ground', region: 'Great Fen', contentKey: 'great_fen_1_n5',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C2RN5_MAP', regionId: 'overworld', chunkX: 2, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0, 81,  0,  0, 88,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0], // 6
      [  0,  0,  0,  0,  0, 81,  0, 88, 81,  0,  0, 81,  0,  0,  0,  0], // 7
      [  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Mud Basin', region: 'Great Fen', contentKey: 'great_fen_2_n5',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C3RN5_MAP', regionId: 'overworld', chunkX: 3, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 2
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 3
      [  1,127,  0,  0,  0,121,128,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 4
      [  1,127,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0, 23,  1], // 5
      [  0,127,  0,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0, 23,  0], // 6
      [  0,127,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0, 23,  0], // 7
      [  0,127,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0, 23,  0], // 8
      [  1,127,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0, 23,  1], // 9
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,121,  0,  0, 23,  1], // 10
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 11
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Gravel Spur', region: 'Great Fen', contentKey: 'great_fen_3_n5',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C4RN5_MAP', regionId: 'overworld', chunkX: 4, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,120,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,120,  0,  0,  1], // 3
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0, 23,  0,  0,  0,127,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,120,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Drowned Woodland', region: 'Great Fen', contentKey: 'great_fen_4_n5',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C5RN5_MAP', regionId: 'overworld', chunkX: 5, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81,127, 23,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 5
      [  0,  0,  0, 88,  0,  0, 23,  0,  0,  0,  0,  0,127, 23,  0,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 9
      [  1,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Blackwater Reeds', region: 'Great Fen', contentKey: 'great_fen_5_n5',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C2RN4_MAP', regionId: 'overworld', chunkX: 2, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  1], // 2
      [  1,  0,  0, 81,  0, 81, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0], // 6
      [  1,  0,  0,  0,  0, 81,  0,  0, 88,  0,  0, 81,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 11
      [  1,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Mud Basin', region: 'Great Fen', contentKey: 'great_fen_2_n4',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C3RN4_MAP', regionId: 'overworld', chunkX: 3, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 2
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 3
      [  1, 23,  0,  0,  0, 88,  0,  0,  0,  0,121,  0,  0,  0,127,  1], // 4
      [  1, 23,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,127,  1], // 5
      [  0, 23,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,  0,127,  0], // 6
      [  0, 23,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,127,  0], // 7
      [  0, 23,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,127,  0], // 8
      [  1, 23,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,127,  1], // 9
      [  1, 23,  0,  0,121,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 10
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 11
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Gravel Spur', region: 'Great Fen', contentKey: 'great_fen_3_n4',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C4RN4_MAP', regionId: 'overworld', chunkX: 4, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,120,  0,  0,  1], // 2
      [  1,  0,  0,120,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 4
      [  1,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  0], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  0], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 10
      [  1,  0,  0,120,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Drowned Woodland', region: 'Great Fen', contentKey: 'great_fen_4_n4',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C5RN4_MAP', regionId: 'overworld', chunkX: 5, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0, 23,127, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0, 23,127,  0,127,  0,  0,  0,  0,  0,  0, 88,  0,  0,  0], // 6
      [  0,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  0,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Blackwater Reeds', region: 'Great Fen', contentKey: 'great_fen_5_n4',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C6RN4_MAP', regionId: 'overworld', chunkX: 6, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81, 81,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0], // 6
      [  0,  0,  0,  0,  0, 23,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0, 81, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Hummock Ground', region: 'Great Fen', contentKey: 'great_fen_6_n4',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C7RN4_MAP', regionId: 'overworld', chunkX: 7, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 6
      [  0,  0,  0,  0,  0, 81,  0, 88, 81,  0,  0, 81,  0,  0,  0,  1], // 7
      [  0,  0,  0,  0, 81, 81,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 8
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Mud Basin', region: 'Great Fen', contentKey: 'great_fen_7_n4',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C3RN3_MAP', regionId: 'overworld', chunkX: 3, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 2
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 3
      [  1,127,  0,  0, 81,121,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 4
      [  1,127,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0, 23,  1], // 5
      [  1,127,  0,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0, 23,  0], // 6
      [  1,127,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0, 23,  0], // 7
      [  1,127,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0, 23,  0], // 8
      [  1,127,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0, 23,  1], // 9
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,121,  0,  0, 23,  1], // 10
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 11
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Gravel Spur', region: 'Great Fen', contentKey: 'great_fen_3_n3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C4RN3_MAP', regionId: 'overworld', chunkX: 4, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,120,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,120,  0,  0,  1], // 3
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0, 23,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,120,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Drowned Woodland', region: 'Great Fen', contentKey: 'great_fen_4_n3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C5RN3_MAP', regionId: 'overworld', chunkX: 5, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81,127, 23,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 5
      [  0,  0,  0, 88,128,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  0], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  0], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 9
      [  1,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Blackwater Reeds', region: 'Great Fen', contentKey: 'great_fen_5_n3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C6RN3_MAP', regionId: 'overworld', chunkX: 6, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0, 81, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  0,  0,  0,  0,127,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81, 81,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Hummock Ground', region: 'Great Fen', contentKey: 'great_fen_6_n3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C7RN3_MAP', regionId: 'overworld', chunkX: 7, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  1], // 2
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0], // 6
      [  0,  0,  0,  0,  0, 81,  0,  0, 88,  0,  0, 81,  0,  0,  0,  0], // 7
      [  0,  0,  0,  0, 23,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 11
      [  1,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Mud Basin', region: 'Great Fen', contentKey: 'great_fen_7_n3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C8RN3_MAP', regionId: 'overworld', chunkX: 8, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 2
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 3
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,121,  0,  0,  0,127,  1], // 4
      [  1, 23,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,127,  1], // 5
      [  0, 23,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,  0,127,  0], // 6
      [  0, 23,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,127,  0], // 7
      [  0, 23,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0,127,  0], // 8
      [  1, 23,  0,  0, 81,  0,  0,128,  0,  0,  0,  0,  0,  0,127,  1], // 9
      [  1, 23,  0,  0,121,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 10
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 11
      [  1, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Gravel Spur', region: 'Great Fen', contentKey: 'great_fen_8_n3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C9RN3_MAP', regionId: 'overworld', chunkX: 9, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,120,  0,  0,  1], // 2
      [  1,  0,  0,120,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 9
      [  1,  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0, 23,  0,  1], // 10
      [  1,  0,  0,120,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Drowned Woodland', region: 'Great Fen', contentKey: 'great_fen_9_n3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C5RN2_MAP', regionId: 'overworld', chunkX: 5, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0, 23,127, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0, 23, 88,  0,  0,  0,  0,  0,  0,  0,  0, 88,  0,  0,  0], // 6
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Blackwater Reeds', region: 'Great Fen', contentKey: 'great_fen_5_n2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C6RN2_MAP', regionId: 'overworld', chunkX: 6, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81, 81,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0], // 6
      [  0,  0,  0,128,  0,  0,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0, 81, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Hummock Ground', region: 'Great Fen', contentKey: 'great_fen_6_n2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C7RN2_MAP', regionId: 'overworld', chunkX: 7, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0], // 6
      [  0,  0,  0,  0,  0, 81,  0, 88, 81,  0,  0, 81,  0,  0,  0,  0], // 7
      [  0,  0,  0,127, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Mud Basin', region: 'Great Fen', contentKey: 'great_fen_7_n2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C8RN2_MAP', regionId: 'overworld', chunkX: 8, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 2
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 3
      [  1,127,  0,  0,  0,121,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 4
      [  1,127,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0, 23,  1], // 5
      [  0,127,  0,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0, 23,  0], // 6
      [  0,127,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  0, 23,  0], // 7
      [  0,127,  0,  0,  0,  0,  0,128,128,  0,  0,  0,  0,  0, 23,  0], // 8
      [  1,127,  0, 23,  0,  0,  0,  0,128,  0,  0,  0,  0,  0, 23,  1], // 9
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,121,  0,  0, 23,  1], // 10
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 11
      [  1,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 23,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Gravel Spur', region: 'Great Fen', contentKey: 'great_fen_8_n2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C9RN2_MAP', regionId: 'overworld', chunkX: 9, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,120,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,  0,120,  0,  0,  1], // 3
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0, 23, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  3,  0,  0,  0,  0,  0,  0,  0,120,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Drowned Woodland', region: 'Great Fen', contentKey: 'great_fen_9_n2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
  { mapId: 'GREAT_FEN_C10RN2_MAP', regionId: 'overworld', chunkX: 10, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 81,127, 23,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 5
      [  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 9
      [  1,  0,  0,  0, 81,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 10
      [  1,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Blackwater Reeds', region: 'Great Fen', contentKey: 'great_fen_10_n2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Great Fen walkable wetland; roadless, hard-pool encounters active immediately.' },
];

// Great Fen envelope: scenery-only perimeter water closing the
// zero-visible-void camera invariant around the walkable core's
// irregular footprint. Never player-accessible, never seamed, never
// saved to -- pure framing, mirroring the Eastern Fens envelope
// convention exactly.
const GREAT_FEN_ENVELOPE_CHUNK_DEFINITIONS = [
  { mapId: 'GREAT_FEN_ENVELOPE_C0RN5_MAP', regionId: 'overworld', chunkX: 0, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 7
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_0_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C6RN5_MAP', regionId: 'overworld', chunkX: 6, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_6_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C7RN5_MAP', regionId: 'overworld', chunkX: 7, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 12
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_7_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C8RN5_MAP', regionId: 'overworld', chunkX: 8, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 3
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,127,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_8_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C0RN4_MAP', regionId: 'overworld', chunkX: 0, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1], // 1
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_0_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C1RN4_MAP', regionId: 'overworld', chunkX: 1, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 1
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1], // 7
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1, 23,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_1_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C8RN4_MAP', regionId: 'overworld', chunkX: 8, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,127,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_8_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C9RN4_MAP', regionId: 'overworld', chunkX: 9, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 10
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 11
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_9_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C10RN4_MAP', regionId: 'overworld', chunkX: 10, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_10_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C1RN3_MAP', regionId: 'overworld', chunkX: 1, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 2
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_1_n3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C2RN3_MAP', regionId: 'overworld', chunkX: 2, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1], // 9
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_2_n3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C10RN3_MAP', regionId: 'overworld', chunkX: 10, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_10_n3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C11RN3_MAP', regionId: 'overworld', chunkX: 11, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 1
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_11_n3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C2RN2_MAP', regionId: 'overworld', chunkX: 2, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,121,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_2_n2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C3RN2_MAP', regionId: 'overworld', chunkX: 3, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 3
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,127,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_3_n2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C4RN2_MAP', regionId: 'overworld', chunkX: 4, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 10
      [  1,121,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_4_n2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C11RN2_MAP', regionId: 'overworld', chunkX: 11, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,127,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_11_n2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C4RN1_MAP', regionId: 'overworld', chunkX: 4, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1, 23,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 7
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_4_n1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C5RN1_MAP', regionId: 'overworld', chunkX: 5, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 3
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_5_n1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C10RN1_MAP', regionId: 'overworld', chunkX: 10, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 7
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1], // 11
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_10_n1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C11RN1_MAP', regionId: 'overworld', chunkX: 11, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_11_n1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C5R0_MAP', regionId: 'overworld', chunkX: 5, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,121,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 8
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_5_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C10R0_MAP', regionId: 'overworld', chunkX: 10, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,121,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_10_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C0RN6_MAP', regionId: 'overworld', chunkX: 0, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,121,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_0_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further north (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C1RN6_MAP', regionId: 'overworld', chunkX: 1, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 7
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 11
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_1_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further north (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C2RN6_MAP', regionId: 'overworld', chunkX: 2, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1], // 9
      [  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_2_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further north (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C3RN6_MAP', regionId: 'overworld', chunkX: 3, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1], // 7
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,127,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_3_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further north (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C4RN6_MAP', regionId: 'overworld', chunkX: 4, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_4_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further north (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C5RN6_MAP', regionId: 'overworld', chunkX: 5, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,127,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,127,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_5_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further north (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'GREAT_FEN_ENVELOPE_C6RN6_MAP', regionId: 'overworld', chunkX: 6, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,121,  1,  1,  1,  1,  1,  1,  1,127,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1, 23,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1, 23,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 6
      [  1,  1,127,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 23,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Great Fen — Open Fen Water', region: 'Great Fen', contentKey: 'great_fen_env_6_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only perimeter water closing the Great Fen\'s zero-visible-void camera envelope, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further north (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
];
