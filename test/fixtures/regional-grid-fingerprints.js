'use strict';
// Stable, repository-owned fingerprints of the 28 placed regional chunk grids.
//
// Canonical serialization: `sha256hex(JSON.stringify(map))`, where `map` is the
// 15×16 row-major tile-id array read from `REGIONAL_CHUNK_CATALOG[mapId].map`.
//
// These are TEST EVIDENCE — a compact snapshot proving no tile value changed as the
// regional grids were migrated into their chunk-definition records — NOT a second
// gameplay authority. The permanent tests read these constants directly; they never
// consult Git history (no `git show`, parent commits, reflogs, or working-tree diff),
// so they run correctly from any future commit, clone, branch, or archive.
//
// Regenerate ONLY on an intentional, reviewed terrain edit (recompute the affected
// map's sha256 from its current grid). All 28 are currently unique — a collision here
// would mean two grids are genuinely byte-identical, which must be reported, not
// silenced by weakening the check.
module.exports = {
  serialization: 'sha256hex(JSON.stringify(map))',
  fingerprints: {
    MAP:                'fc772998da4db584a1d59d7125c4d52237b99bbda734ba2cb99ea723f8aaea7f',
    MAP2:               '879a6f9ea7fe373b2dc1a026c7374c1b2743288a533edac74bbcce263a571d5b',
    MAP3:               '14cb9111d171454cba60c986e8bd06974ab3023652ce036017bb0c4f13abca17',
    MAP4:               '4e64a4a814b1fb4c4729a651fd6b34e6dc96e03950fd322339054407a2b4dca9',
    MAP5:               '93073d85311e659147f2af889d5aab2d6d3dbe76c632e4b2ab1e77f042349e1f',
    MAP_N1:             '871d5dacd91e1421557554d830e8d64108a5d1d920165ff1bc2094cca090e770',
    MAP_N2:             '39f4bcce6707c439384674c021ef18acf552221ef9e1c57f7435413aeaaeb963',
    RODDON_WAY_MAP:     '835e3050e45a3bcd74454fc411f006ea0556b08c9fea6d7e31795a4908eba2bc',
    MAP3_N1:            '7a7f6def4fbae9ef32f036fb9932e1288171d90c0da68f9e5eaed186b8d5a923',
    MAP3_N2:            '06664d7a4ef0485e2a605a71932fd15364029fa59def6cb75acf206288568039',
    DRENWICK_EAST_CANAL_MAP: '2e74d8cd14fa6e022cba316f1d18d4409a2d5b886ed6c5e2df9392933f5ecad6',
    THORNMERE_NORTH_FEN_MAP: '959c67546ae56ca6a05dc3973f930495d5574c359d0cb64d714c5235f63bcae8',
    THORNMERE_CANAL_HEAD_MAP: '924d982ac990944db3808a749533fd1ce2fd713ca3899ed1d77252ec14151cf0',
    THORNMERE_UPPER_SHALLOWS_MAP: 'fe6eaa3e73a470e8a1cf4a959d285dd26a34214f814373d0518cd4bc156fb7d5',
    DRENWICK_WEST_OUTFALL_MAP: 'ba1ab2ab813db74a65a342d6b89232f17a43ec092b12096d06124d9172ab6334',
    NORTH_BASIN_S_MAP:  '41d3b38d9932ad5ed3fea54ed787aece91375e88e7cc7c4e0a69cb9bed36b240',
    NORTH_BASIN_SE_MAP: '96ac86bdc402728eab845a9cd6250609787d4ed0994affe294fce8f3d578a2b3',
    EAST_CAUSEWAY_MAP: '4ce6d248fbf6fa13b02fccd81785d0a44923ac6c9a0f9c37b4e9d0df851e1f16',
    NORTH_BASIN_C_MAP:  '562b1d6e9b79fcc2a2b1b3092538094ec31ff280733acc326ec8c2f90b257668',
    NORTH_BASIN_SW_MAP: '38e09a579a5e76b8539b02698235e01b2c5d664fa6fc9cfa11dd08804575d4c1',
    NORTH_BASIN_W_MAP:  'df88364722dc6e4cd77a3c95182165c3ecff777d9c37e290b4810c6d2da3a1f3',
    NORTH_BASIN_W2_MAP: 'c2812528c12a2fcf7f45819f4320ee85f9b78446e4b3f9826fbb968448a72c31',
    NORTH_BASIN_NW_MAP: '0105619e109e8dcc3c941724437dd7fd0b6b2208e3507d498046841f6b53d28d',
    NORTH_BASIN_N_MAP:  'e59e5fa33fbc7e6388e707d1ef4a96282c446c6aead0f2cc24e935426e960bc7',
    NORTH_BASIN_NE_MAP: '97af356c23d758f6d396afb57e1fd152c4b0701dd6f66839248cf7350b6d0954',
    NORTH_BASIN_NE2_MAP: '3e6f5754052438f40b9f560db8d6321e9e0ab72aeaf94f2b7874cff149021417',
    NORTH_BASIN_E2_MAP: '74353043788878bfd753cc5e3382a6e758e7e652ce3452e222a196d3279c96ff',
    NORTH_BASIN_E_MAP:  '8241adef3dc0fd37a2b85cc02d50ec8fa0446bded9ca5fc9bdfd4314f6390f9c',
  },
};
