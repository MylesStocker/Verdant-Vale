'use strict';

// Valmere expanse: the inland sea's open-water/near-shore extension north of
// the Mornay peninsula. Entered only through a single new reed-gap seam
// opened on EASTERN_FENS_VALMERE_REVEAL_MAP's west border, leading into the
// converted EASTERN_FENS_ENVELOPE_C14R0_MAP/C14RN1_MAP entry chunks, then
// north into fresh territory. A branching "comb" of sheltered coves and
// rough points along one shore spine -- never a single corridor, never a
// second combat-entry bridge. No ferries, ships, swimming, or playable
// island access; open water stays non-walkable and encounter-disabled; no
// opposite/northern shore is authored -- the lake visibly continues beyond
// this envelope. None of the six protected Mornay peninsula grids (or the
// Mornay approach chunks) are touched by this file or its seams.

const VALMERE_EXPANSE_REGIONAL_CHUNK_DEFINITIONS = [
  { mapId: 'VALMERE_EXPANSE_C13RN6_MAP', regionId: 'overworld', chunkX: 13, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  1,128,129,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  1,128,121,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  1,128,  0,  0,  0,127,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Shingle Shore', region: 'Valmere', contentKey: 'valmere_expanse_13_n6',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C14RN6_MAP', regionId: 'overworld', chunkX: 14, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,128,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0,  0,  0, 88,121,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 6
      [  0,  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 7
      [  0,  0,  0,121, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 8
      [  1,  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Rocky Point', region: 'Valmere', contentKey: 'valmere_expanse_14_n6',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C14RN5_MAP', regionId: 'overworld', chunkX: 14, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  1], // 10
      [  1,  0, 23, 23, 23, 23, 23,127, 23, 23, 23, 23, 23, 23,  0,  1], // 11
      [  1,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Sheltered Cove', region: 'Valmere', contentKey: 'valmere_expanse_14_n5',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C15RN5_MAP', regionId: 'overworld', chunkX: 15, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 2
      [  1,  0,  0,  0,  0, 23,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,129,128,  1,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,121,128,  1,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Shingle Shore', region: 'Valmere', contentKey: 'valmere_expanse_15_n5',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C13RN4_MAP', regionId: 'overworld', chunkX: 13, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,121, 88,  0,  0,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,121,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Rocky Point', region: 'Valmere', contentKey: 'valmere_expanse_13_n4',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C14RN4_MAP', regionId: 'overworld', chunkX: 14, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,127, 23,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  0,  1], // 5
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127, 23,  0,  0,  1], // 6
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 7
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 8
      [  1,  0,  0,  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Reed Shallows', region: 'Valmere', contentKey: 'valmere_expanse_14_n4',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C13RN3_MAP', regionId: 'overworld', chunkX: 13, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  1], // 10
      [  1,  0, 23, 23, 23, 23, 23, 23,127, 23, 23, 23, 23, 23,  0,  1], // 11
      [  1,  0, 23, 81, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Sheltered Cove', region: 'Valmere', contentKey: 'valmere_expanse_13_n3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C14RN3_MAP', regionId: 'overworld', chunkX: 14, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  1,128, 88,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  1,128,129,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 6
      [  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 7
      [  0,  0,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 8
      [  1,  1,128,121,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 9
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  1,128,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Shingle Shore', region: 'Valmere', contentKey: 'valmere_expanse_14_n3',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C13RN2_MAP', regionId: 'overworld', chunkX: 13, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 3
      [  1,  0,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4
      [  1,  0,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5
      [  1,  0,  0, 23,127,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 88,  0,  0,  1], // 11
      [  1,  0, 23,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Reed Shallows', region: 'Valmere', contentKey: 'valmere_expanse_13_n2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C14RN2_MAP', regionId: 'overworld', chunkX: 14, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0, 81,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  1], // 3
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 4
      [  1,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 5
      [  0,  0,130,  0,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0,  1], // 6
      [  0,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 7
      [  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  1], // 8
      [  1,  0,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0,  0,  0,  0,  1], // 9
      [  1,  0,  0,  0,  0, 81,  0,  0, 81,  0,  0, 81,  0,  0,  0,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Muddy Margin', region: 'Valmere', contentKey: 'valmere_expanse_14_n2',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
  { mapId: 'VALMERE_EXPANSE_C13RN1_MAP', regionId: 'overworld', chunkX: 13, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 1
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 2
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 3
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,129,128,  1,  1], // 4
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 5
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0], // 6
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0], // 7
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  0,  0], // 8
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,121,128,  1,  1], // 9
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 10
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,128,  1,  1], // 11
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,127,128,  1,  1], // 12
      [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Shingle Shore', region: 'Valmere', contentKey: 'valmere_expanse_13_n1',
    presentation: 'continuous', encounterProfileId: 'eastern_fens_mornay_hard', allowRandomEncounters: true, allowSave: true,
    notes: 'Valmere near-shore wetland; hard-pool encounters active immediately.' },
];

// Valmere expanse envelope: pure open-water scenery filling out the
// lake's visible body around the near-shore spine, closing the
// zero-visible-void camera invariant. Never player-accessible, never
// seamed, never saved to.
const VALMERE_EXPANSE_ENVELOPE_CHUNK_DEFINITIONS = [
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C12RN7_MAP', regionId: 'overworld', chunkX: 12, chunkY: -7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_12_n7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C13RN7_MAP', regionId: 'overworld', chunkX: 13, chunkY: -7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_13_n7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C14RN7_MAP', regionId: 'overworld', chunkX: 14, chunkY: -7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_14_n7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C15RN7_MAP', regionId: 'overworld', chunkX: 15, chunkY: -7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 7
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_15_n7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C16RN7_MAP', regionId: 'overworld', chunkX: 16, chunkY: -7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_16_n7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C17RN7_MAP', regionId: 'overworld', chunkX: 17, chunkY: -7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 1
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_17_n7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C18RN7_MAP', regionId: 'overworld', chunkX: 18, chunkY: -7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_18_n7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C19RN7_MAP', regionId: 'overworld', chunkX: 19, chunkY: -7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 12
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_19_n7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C20RN7_MAP', regionId: 'overworld', chunkX: 20, chunkY: -7, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_20_n7',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C12RN6_MAP', regionId: 'overworld', chunkX: 12, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 7
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_12_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C15RN6_MAP', regionId: 'overworld', chunkX: 15, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 9
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_15_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C16RN6_MAP', regionId: 'overworld', chunkX: 16, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_16_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C17RN6_MAP', regionId: 'overworld', chunkX: 17, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_17_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C18RN6_MAP', regionId: 'overworld', chunkX: 18, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 11
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_18_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C19RN6_MAP', regionId: 'overworld', chunkX: 19, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 3
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_19_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C20RN6_MAP', regionId: 'overworld', chunkX: 20, chunkY: -6, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_20_n6',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C12RN5_MAP', regionId: 'overworld', chunkX: 12, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_12_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C13RN5_MAP', regionId: 'overworld', chunkX: 13, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 2
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_13_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C16RN5_MAP', regionId: 'overworld', chunkX: 16, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_16_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C17RN5_MAP', regionId: 'overworld', chunkX: 17, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_17_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C18RN5_MAP', regionId: 'overworld', chunkX: 18, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 8
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_18_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C19RN5_MAP', regionId: 'overworld', chunkX: 19, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 3
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_19_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C20RN5_MAP', regionId: 'overworld', chunkX: 20, chunkY: -5, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 7
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_20_n5',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C12RN4_MAP', regionId: 'overworld', chunkX: 12, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_12_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C12RN3_MAP', regionId: 'overworld', chunkX: 12, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_12_n3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C12RN2_MAP', regionId: 'overworld', chunkX: 12, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_12_n2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C12RN1_MAP', regionId: 'overworld', chunkX: 12, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_12_n1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope; reads as the inland sea continuing beyond the authored shoreline (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C13R0_MAP', regionId: 'overworld', chunkX: 13, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_13_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope south of the near-shore spine (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C12R0_MAP', regionId: 'overworld', chunkX: 12, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_12_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water closing the lake\'s zero-visible-void camera envelope south of the near-shore spine (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C19R1_MAP', regionId: 'overworld', chunkX: 19, chunkY: 1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_19_1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water east of the Mornay peninsula, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further east (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C19R0_MAP', regionId: 'overworld', chunkX: 19, chunkY: 0, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,121,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_19_0',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water east of the Mornay peninsula, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further east (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C19RN1_MAP', regionId: 'overworld', chunkX: 19, chunkY: -1, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_19_n1',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water east of the Mornay peninsula, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further east (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C19RN2_MAP', regionId: 'overworld', chunkX: 19, chunkY: -2, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,121,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_19_n2',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water east of the Mornay peninsula, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further east (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C19RN3_MAP', regionId: 'overworld', chunkX: 19, chunkY: -3, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 2
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1], // 6
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1], // 7
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_19_n3',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water east of the Mornay peninsula, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further east (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
  { mapId: 'VALMERE_EXPANSE_ENVELOPE_C19RN4_MAP', regionId: 'overworld', chunkX: 19, chunkY: -4, map: [
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 1
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1], // 2
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 3
      [  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1], // 4
      [  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 5
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 6
      [  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 7
      [  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 8
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 9
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 10
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 11
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 12
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,121,  1,  1,  1,  1,  1,  1], // 13
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 14
    ],
    displayName: 'Valmere — Open Water', region: 'Valmere', contentKey: 'valmere_expanse_env_19_n4',
    presentation: 'continuous', encounterProfileId: 'far', allowRandomEncounters: false, allowSave: false, playerAccessible: false,
    notes: 'Scenery-only open Valmere water east of the Mornay peninsula, exposed once the Valmere expansion extended the overworld region\'s overall camera bounds further east (playerAccessible: false; no seam/transition; fail-closed at the placement authority). No encounters, items, NPCs, interactions, quest triggers, or save state.' },
];
