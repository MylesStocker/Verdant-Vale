'use strict';

// Stable pickup IDs own completion; optional battle rewards use the same IDs.
// Names and flavour are revisable. No quest flags or equipment tiers are added.
const WILDERNESS_DISCOVERIES = [
 {id:'pickup_wild_meadow_satchel',mapId:'MAINLAND_CN2RN6_MAP',col:10,row:9,name:'Potion',
  text:'A split satchel lies in the grass. Its bread is beyond saving, but one stoppered bottle survived. Found: Potion.'},
 {id:'pickup_wild_cutters_wrap',mapId:'MAINLAND_C5RN10_MAP',col:10,row:7,name:'Reed Remedy',
  text:'A peat cutter\'s boot-wrap has snagged on a tussock. Inside is a dry twist of medicinal reeds. Found: Reed Remedy.'},
 {id:'pickup_wild_willow_bottle',mapId:'MAINLAND_C10RN7_MAP',col:8,row:4,name:'Elixir',
  text:'The grass has grown through a discarded wicker bottle-case. One wax seal is intact. Found: Elixir.'},
 {id:'pickup_wild_river_parcel',mapId:'MAINLAND_C22R4_MAP',col:5,row:9,name:'Potion',
  text:'A small parcel lies above the river\'s old waterline. The address has washed away; the medicine inside has not. Found: Potion.'},
 {id:'pickup_wild_axle_bag',mapId:'MAINLAND_C25R6_MAP',col:13,row:8,name:'Reed Remedy',
  text:'Beside a broken wooden axle, grass hides a carter\'s emergency bag. The bandages have rotted. The sealed reed preparation is still dry. Found: Reed Remedy.'},
 {id:'pickup_wild_field_flask',mapId:'MAINLAND_C26R1_MAP',col:12,row:6,name:'Elixir',
  text:'A dented flask glints among the grass. Scratched beneath it: “For the long walk home.” Found: Elixir.'},
 {id:'pickup_wild_cutters_basket',mapId:'MAINLAND_CN4RN9_MAP',col:6,row:10,name:'Elixir',
  title:'The sunken basket',enemies:['enemy_reedbinder'],risk:'Pull the basket free',safe:'Take the loose remedy',safeItem:'Reed Remedy',
  text:'A cutter\'s basket is caught beneath living knots of reed. A Reedbinder tightens around the handle. A loose Reed Remedy lies within reach; an Elixir is wedged deeper inside.',
  safeText:'You take the loose Reed Remedy and let the basket sink. The knotted reeds close over the rest.',
  winText:'The reeds fall slack. You lift the basket and recover its sealed Elixir.'},
 {id:'pickup_wild_toad_bundle',mapId:'MAINLAND_C9RN5_MAP',col:10,row:6,name:'Elixir',
  title:'The trembling bundle',enemies:['enemy_bell_throated_toad','enemy_bell_throated_toad'],risk:'Reach for the bundle',
  text:'Two swollen throats pulse beneath the reeds. Between the toads lies a cloth bundle, its medicine bottle catching the light. Their answering calls are growing louder. You can still leave it alone.',
  winText:'The calling stops. Inside the muddy bundle is an unbroken Elixir.'},
 {id:'pickup_wild_logging_tin',mapId:'MAINLAND_C23R5_MAP',col:11,row:11,name:'Elixir',
  title:'Under the fallen timber',enemies:['enemy_hollowreed_choker','enemy_hollowreed_choker'],risk:'Lift the timber',safe:'Take the outer bottle',safeItem:'Potion',
  text:'An abandoned timber crew\'s medicine tin is pinned under a log. Two Hollowreed Chokers stir in the rotten wood. A Potion has rolled clear; the Elixir inside will take some reaching.',
  safeText:'You pocket the loose Potion and ease away. The rotten timber settles over the tin.',
  winText:'With the creatures gone, you lever the timber aside. Found: Elixir.'},
 {id:'pickup_wild_hidden_woodland_cache',mapId:'MAINLAND_C24R2_MAP',col:4,row:4,name:'Void Shard',
  text:'Beyond the hanging branches, a hollow stump shelters an old oilcloth packet. Whoever hid it is long gone. Found: Void Shard.'},
].map(d=>Object.freeze(d));
const WILDERNESS_DISCOVERY_ITEM_SETS=Object.fromEntries(WILDERNESS_DISCOVERIES.map(d=>[
 d.id,[{id:d.id,name:d.name,x:d.col*32+16,y:d.row*32+16,picked:false,examine:true,
  ...(d.enemies?{scriptedInspect:'wilderness_discovery'}:{examinePages:[[d.text]]})}],
]));
const WILDERNESS_DISCOVERY_FEATURES = {
 MAINLAND_C24R2_MAP:[{id:'wild_hanging_branch_tracks',type:'inspect',x:5.5,y:8.5,sparkle:true,
  pages:[['Faint bootmarks run straight into the hanging branches. Beneath them, the earth is worn smooth.']]}],
};
