'use strict';

// Closed mechanic vocabulary. Canonical compatibility is the intersection of
// an enemy's complete requirements with the supported mechanic set below; no
// enemy identity is an approval credential.
const ENEMY_CAPABILITY_DEFINITIONS = Object.freeze({
  fen_tactics:Object.freeze({canonical:true}),
  basic_attack:Object.freeze({canonical:true}),
  standard_observe:Object.freeze({canonical:true}),
  standard_rewards:Object.freeze({canonical:true}),
  boss_escape_lock:Object.freeze({canonical:true}),
  brace:Object.freeze({canonical:true}),
  curse_on_hit:Object.freeze({canonical:true}),
  void_shard_burst:Object.freeze({canonical:true}),
  acid_corrosion:Object.freeze({canonical:true}),
  split_followup:Object.freeze({canonical:true}),
  regeneration:Object.freeze({canonical:true}),
  swallow_deadline:Object.freeze({canonical:true}),
  melee_armor:Object.freeze({canonical:true}),
  counterattack:Object.freeze({canonical:true}),
  poison_on_hit:Object.freeze({canonical:true}),
  mire_toad_reagent_observation:Object.freeze({canonical:true}),
  slither_on_hit:Object.freeze({canonical:true}),
  poison_spell:Object.freeze({canonical:true}),
  dazzle_on_hit:Object.freeze({canonical:true}),
  steal_and_flee:Object.freeze({canonical:true}),
  observe_run_lock:Object.freeze({canonical:true}),
  guaranteed_drop:Object.freeze({canonical:true}),
  generated_stats:Object.freeze({canonical:true}),
  warden_lifecycle:Object.freeze({canonical:true}),
  fort_lifecycle:Object.freeze({canonical:false}),
  firelit_attack:Object.freeze({canonical:false}),
  persistent_hp_lifecycle:Object.freeze({canonical:true}),
  rainfish_chain:Object.freeze({canonical:true}),
  takomo_lifecycle:Object.freeze({canonical:true}),
  den_wraith_lifecycle:Object.freeze({canonical:true}),
  sailor_brawl_lifecycle:Object.freeze({canonical:true}),
  wrongteeth_lifecycle:Object.freeze({canonical:true}),
  lensweb_objective_lifecycle:Object.freeze({canonical:true}),
  mimic_trap_lifecycle:Object.freeze({canonical:true}),
  travellers_rise_ambush_lifecycle:Object.freeze({canonical:true}),
  receiver_coordination:Object.freeze({canonical:false}),
});
const CANONICAL_ENEMY_CAPABILITIES = Object.freeze(Object.keys(ENEMY_CAPABILITY_DEFINITIONS)
  .filter(id=>ENEMY_CAPABILITY_DEFINITIONS[id].canonical));

// These capabilities describe encounter-owned persistence and story outcomes.
// Their combat mechanics are representable, but canonical installation still
// requires an authenticated scripted-lifecycle owner. Ordinary entry may never
// approve one merely because the capability itself is implemented.
const CANONICAL_SCRIPTED_LIFECYCLE_CAPABILITIES = Object.freeze([
  'warden_lifecycle','persistent_hp_lifecycle','rainfish_chain','takomo_lifecycle',
  'den_wraith_lifecycle','sailor_brawl_lifecycle','wrongteeth_lifecycle',
  'lensweb_objective_lifecycle','mimic_trap_lifecycle',
  'travellers_rise_ambush_lifecycle',
]);

const ENEMY_TEMPLATE_FIELD_CAPABILITIES = Object.freeze({
  fenTactic:'fen_tactics',
  swallowAfterRounds:'swallow_deadline',
  defendChance:'brace', curseChance:'curse_on_hit', acidChance:'acid_corrosion',
  splits:'split_followup', regenPerTurn:'regeneration', meleeArmor:'melee_armor',
  counterChance:'counterattack', poisonChance:'poison_on_hit',
  sex:'mire_toad_reagent_observation', dazzleChance:'dazzle_on_hit',
  stealAndFlee:'steal_and_flee', runLock:'observe_run_lock',
  guaranteedDrop:'guaranteed_drop', inline:'generated_stats',
});

// These requirements live in combat branches or encounter lifecycle state,
// rather than template fields. This audit map records those mechanics; it does
// not grant compatibility. IDs absent here still undergo closed field auditing.
const ENEMY_HIDDEN_CAPABILITIES = Object.freeze(Object.fromEntries(Object.entries({
  enemy_shade_wraith:['slither_on_hit'],
  enemy_void_walker:['void_shard_burst'],
  enemy_fen_witch:['poison_spell'],
  enemy_corpse_slug:['slither_on_hit'],
  enemy_briar_warden:['warden_lifecycle'],
  enemy_smuggler_guard:['fort_lifecycle'],
  enemy_polwick:['fort_lifecycle','firelit_attack'],
  enemy_essa:['fort_lifecycle'],
  enemy_pale_sentry:['persistent_hp_lifecycle'],
  enemy_rainfish:['rainfish_chain'],
  enemy_takomo:['takomo_lifecycle'],
  enemy_den_wraith:['den_wraith_lifecycle'],
  enemy_kolm:['sailor_brawl_lifecycle'],
  enemy_wrongteeth:['wrongteeth_lifecycle'],
  enemy_lensweb_spider:['lensweb_objective_lifecycle'],
  enemy_mimic_potion:['mimic_trap_lifecycle'],
  enemy_road_impostor:['travellers_rise_ambush_lifecycle'],
  enemy_bridled_hollow:['travellers_rise_ambush_lifecycle'],
  enemy_fen_handler:['travellers_rise_ambush_lifecycle'],
  enemy_gallery_receiver:['receiver_coordination'],
  enemy_gallery_caller:['receiver_coordination'],
  enemy_gallery_keeper:['receiver_coordination'],
}).map(([id,capabilities])=>[id,Object.freeze(capabilities)])));

// Closed authored parameters for mechanics that predate template fields. This
// is capability metadata, not a compatibility list: the canonical resolver
// receives the validated capability profile and never switches on enemy IDs.
const ENEMY_HIDDEN_MECHANIC_DATA = Object.freeze(Object.fromEntries(Object.entries({
  enemy_shade_wraith:{slither_on_hit:{chance:0.25}},
  enemy_corpse_slug:{slither_on_hit:{chance:0.30}},
  enemy_void_walker:{void_shard_burst:{chance:0.35,minDamage:8,maxDamage:14,wardItem:'Void Shard'}},
  enemy_fen_witch:{poison_spell:{chance:0.25}},
}).map(([id,mechanics])=>[id,Object.freeze(Object.fromEntries(Object.entries(mechanics)
  .map(([capability,data])=>[capability,Object.freeze({...data})])))])));

const ENEMY_CAPABILITY_BASE_FIELDS = Object.freeze([
  'id','name','hp','maxHp','atk','def','spd','xp','goldMin','goldMax',
]);

function validateEnemyCapabilityMetadata(value) {
  const fail=message=>{throw Error('Enemy capability metadata: '+message);};
  if(!value||typeof value!=='object'||Array.isArray(value)||
      ![Object.prototype,Object.getPrototypeOf({})].includes(Object.getPrototypeOf(value)))fail('expected plain record');
  const fields=Object.getOwnPropertyDescriptors(value),keys=['templateId','capabilities'];
  if(Reflect.ownKeys(fields).length!==keys.length||keys.some(k=>!Object.hasOwn(fields[k]||{},'value')))fail('unknown field or accessor');
  const id=fields.templateId.value,list=fields.capabilities.value;
  if(typeof id!=='string'||!/^enemy_[a-z0-9_]+$/.test(id))fail('invalid template ID');
  if(!Array.isArray(list)||![Array.prototype,Object.getPrototypeOf([])].includes(Object.getPrototypeOf(list))||!Object.isFrozen(list))
    fail('capabilities must be a frozen dense array');
  const descriptors=Object.getOwnPropertyDescriptors(list),capabilities=[];
  if(Reflect.ownKeys(descriptors).length!==list.length+1)fail('capability array contains an extra field');
  for(let i=0;i<list.length;i++){
    if(!Object.hasOwn(descriptors[i]||{},'value'))fail('capability array contains a hole or accessor');
    const capability=descriptors[i].value;
    if(typeof capability!=='string'||!Object.hasOwn(ENEMY_CAPABILITY_DEFINITIONS,capability))fail('unknown capability '+String(capability));
    capabilities.push(capability);
  }
  if(new Set(capabilities).size!==capabilities.length)fail('duplicate capability');
  return copyFormationData({templateId:id,capabilities});
}

function enemyCapabilityMetadata(template) {
  const fail=message=>{throw Error('Enemy capability metadata: '+message);};
  if(!template||typeof template!=='object'||Array.isArray(template)||
      ![Object.prototype,Object.getPrototypeOf({})].includes(Object.getPrototypeOf(template)))fail('template must be plain data');
  const fields=Object.getOwnPropertyDescriptors(template),id=fields.id?.value;
  if(typeof id!=='string'||Object.getOwnPropertyDescriptor(ENEMY_TEMPLATE_REGISTRY,id)?.value!==template)
    fail('template is not the exact registered identity');
  const allowed=new Set([...ENEMY_CAPABILITY_BASE_FIELDS,'isBoss',...Object.keys(ENEMY_TEMPLATE_FIELD_CAPABILITIES)]);
  for(const key of Reflect.ownKeys(fields)){
    if(typeof key!=='string'||!Object.hasOwn(fields[key],'value'))fail('template contains an accessor');
    if(!allowed.has(key))fail('unaudited template field '+String(key)+' for '+id);
  }
  const inline=fields.inline?.value===true;
  if(!inline&&ENEMY_CAPABILITY_BASE_FIELDS.some(key=>!Object.hasOwn(fields,key)))
    fail('missing ordinary template field for '+id);
  if(fields.isBoss&&typeof fields.isBoss.value!=='boolean')fail('malformed boss metadata for '+id);
  const probabilityFields=['defendChance','curseChance','acidChance','counterChance','poisonChance','dazzleChance'];
  for(const key of probabilityFields)if(fields[key]&&
      (typeof fields[key].value!=='number'||!Number.isFinite(fields[key].value)||fields[key].value<0||fields[key].value>1))
    fail('malformed capability field '+key+' for '+id);
  for(const key of ['regenPerTurn','meleeArmor','swallowAfterRounds'])if(fields[key]&&
      (!Number.isSafeInteger(fields[key].value)||fields[key].value<=0))fail('malformed capability field '+key+' for '+id);
  for(const key of ['splits','stealAndFlee','inline'])if(fields[key]&&fields[key].value!==true)
    fail('malformed capability field '+key+' for '+id);
  if(fields.sex&&!['male','female'].includes(fields.sex.value))fail('malformed capability field sex for '+id);
  if(fields.runLock&&fields.runLock.value!=='observe_gated')fail('malformed capability field runLock for '+id);
  if(fields.guaranteedDrop&&(typeof fields.guaranteedDrop.value!=='string'||!fields.guaranteedDrop.value))
    fail('malformed capability field guaranteedDrop for '+id);
  if(fields.fenTactic&&!FEN_TACTICS.includes(fields.fenTactic.value))fail('malformed fen tactic');
  const capabilities=['basic_attack','standard_observe','standard_rewards'];
  if(fields.isBoss?.value===true)capabilities.push('boss_escape_lock');
  for(const key of Object.keys(ENEMY_TEMPLATE_FIELD_CAPABILITIES))if(Object.hasOwn(fields,key))
    capabilities.push(ENEMY_TEMPLATE_FIELD_CAPABILITIES[key]);
  const hidden=ENEMY_HIDDEN_CAPABILITIES[id]||Object.freeze([]);
  capabilities.push(...hidden);
  return validateEnemyCapabilityMetadata(Object.freeze({templateId:id,capabilities:Object.freeze(capabilities)}));
}

function canonicalEnemyCompatibility(template) {
  const metadata=enemyCapabilityMetadata(template);
  const authored=ENEMY_CAPABILITY_REGISTRY[metadata.templateId];
  const mechanicIds=new Set(['fen_tactics','brace','curse_on_hit','void_shard_burst','acid_corrosion','slither_on_hit','poison_spell','dazzle_on_hit',
    'split_followup','regeneration','swallow_deadline','melee_armor','counterattack','poison_on_hit','mire_toad_reagent_observation','steal_and_flee','generated_stats']);
  if(authored&&JSON.stringify(authored.capabilities.filter(id=>mechanicIds.has(id)))!==
      JSON.stringify(metadata.capabilities.filter(id=>mechanicIds.has(id))))
    throw Error('Enemy mechanic capability metadata is stale for '+metadata.templateId);
  const unsupported=metadata.capabilities.filter(id=>!ENEMY_CAPABILITY_DEFINITIONS[id].canonical);
  return copyFormationData({templateId:metadata.templateId,compatible:unsupported.length===0,
    capabilities:metadata.capabilities,unsupported});
}
function canonicalEnemyIsCompatible(template) {
  try{return canonicalEnemyCompatibility(template).compatible;}catch(_){return false;}
}

function canonicalEnemyMechanicProfile(template) {
  const metadata=enemyCapabilityMetadata(template),mechanics={};
  const add=(capability,data)=>{if(!metadata.capabilities.includes(capability))throw Error('Enemy mechanic profile capability mismatch');mechanics[capability]=Object.freeze({...data});};
  if(metadata.capabilities.includes('brace'))add('brace',{chance:template.defendChance});
  if(metadata.capabilities.includes('curse_on_hit'))add('curse_on_hit',{chance:template.curseChance,status:'cursed',wardAccessory:'Amethyst Bangle'});
  if(metadata.capabilities.includes('acid_corrosion'))add('acid_corrosion',{chance:template.acidChance,cap:6});
  if(metadata.capabilities.includes('dazzle_on_hit'))add('dazzle_on_hit',{chance:template.dazzleChance,status:'dazzled',accuracyPenalty:8});
  for(const [capability,data]of Object.entries(ENEMY_HIDDEN_MECHANIC_DATA[template.id]||{}))add(capability,data);
  const expected=metadata.capabilities.filter(id=>['brace','curse_on_hit','acid_corrosion','dazzle_on_hit','slither_on_hit','poison_spell','void_shard_burst'].includes(id));
  if(expected.length!==Object.keys(mechanics).length||expected.some(id=>!Object.hasOwn(mechanics,id)))
    throw Error('Enemy mechanic profile is incomplete for '+template.id);
  for(const [capability,data]of Object.entries(mechanics)){
    if(!data||typeof data!=='object'||Array.isArray(data)||!Object.isFrozen(data)||
        ![Object.prototype,Object.getPrototypeOf({}),null].includes(Object.getPrototypeOf(data)))throw Error('Enemy mechanic profile must be frozen plain data');
    if(typeof data.chance!=='number'||!Number.isFinite(data.chance)||data.chance<0||data.chance>1)
      throw Error('Enemy mechanic profile has invalid chance for '+capability);
    const schema={brace:['chance'],curse_on_hit:['chance','status','wardAccessory'],acid_corrosion:['chance','cap'],
      dazzle_on_hit:['chance','status','accuracyPenalty'],slither_on_hit:['chance'],poison_spell:['chance'],
      void_shard_burst:['chance','minDamage','maxDamage','wardItem']}[capability];
    if(!schema||Reflect.ownKeys(data).length!==schema.length||schema.some(key=>!Object.hasOwn(data,key)))
      throw Error('Enemy mechanic profile has unknown or missing data for '+capability);
    if(capability==='curse_on_hit'&&(data.status!=='cursed'||data.wardAccessory!=='Amethyst Bangle'))
      throw Error('Enemy mechanic profile has invalid curse data');
    if(capability==='dazzle_on_hit'&&(data.status!=='dazzled'||data.accuracyPenalty!==8))
      throw Error('Enemy mechanic profile has invalid dazzle data');
    if(capability==='void_shard_burst'&&(!Number.isSafeInteger(data.minDamage)||!Number.isSafeInteger(data.maxDamage)||
        data.minDamage<=0||data.maxDamage<data.minDamage||typeof data.wardItem!=='string'))throw Error('Enemy mechanic profile has invalid shard burst');
    if(capability==='acid_corrosion'&&(!Number.isSafeInteger(data.cap)||data.cap<=0))throw Error('Enemy mechanic profile has invalid corrosion cap');
  }
  if(metadata.capabilities.includes('fen_tactics'))add('fen_tactics',{role:template.fenTactic});
  if(metadata.capabilities.includes('swallow_deadline'))add('swallow_deadline',{rounds:template.swallowAfterRounds});
  if(metadata.capabilities.includes('regeneration'))add('regeneration',{amount:template.regenPerTurn});
  if(metadata.capabilities.includes('melee_armor'))add('melee_armor',{defense:template.meleeArmor});
  if(metadata.capabilities.includes('counterattack'))add('counterattack',{chance:template.counterChance});
  if(metadata.capabilities.includes('poison_on_hit'))add('poison_on_hit',{chance:template.poisonChance});
  if(metadata.capabilities.includes('mire_toad_reagent_observation'))add('mire_toad_reagent_observation',{sex:template.sex});
  if(metadata.capabilities.includes('steal_and_flee'))add('steal_and_flee',{minGold:20,goldSpan:31,graceRounds:1});
  if(metadata.capabilities.includes('split_followup'))add('split_followup',{hp:20,xp:20,goldMin:0,goldMax:3});
  if(metadata.capabilities.includes('generated_stats'))add('generated_stats',{factor:23});
  if(metadata.capabilities.includes('observe_run_lock'))add('observe_run_lock',{mode:template.runLock});
  if(metadata.capabilities.includes('guaranteed_drop'))add('guaranteed_drop',{itemId:template.guaranteedDrop});
  if(metadata.capabilities.includes('counterattack')!==metadata.capabilities.includes('melee_armor'))
    throw Error('Incomplete melee armor/counter capability pair');
  if(metadata.capabilities.includes('mire_toad_reagent_observation')&&!metadata.capabilities.includes('poison_on_hit'))
    throw Error('Incomplete reagent/poison capability pair');
  if(mechanics.observe_run_lock&&mechanics.observe_run_lock.mode!=='observe_gated')throw Error('Invalid Observe-gated Run capability');
  if(mechanics.guaranteed_drop&&(!Object.hasOwn(ITEM_REGISTRY,mechanics.guaranteed_drop.itemId)||
      ITEM_REGISTRY[mechanics.guaranteed_drop.itemId].keyItem))throw Error('Invalid guaranteed-drop capability');
  return Object.freeze(Object.fromEntries(Object.entries(mechanics).map(([id,data])=>[id,Object.freeze({...data})])));
}
function requireCanonicalEnemyCapabilities(template) {
  const result=canonicalEnemyCompatibility(template);
  if(!result.compatible)throw Error('Unsupported canonical enemy capabilities for '+result.templateId+': '+result.unsupported.join(', '));
  return result;
}

const ENEMY_CAPABILITY_REGISTRY = Object.freeze(Object.fromEntries(Object.values(ENEMY_TEMPLATE_REGISTRY)
  .map(template=>{const metadata=enemyCapabilityMetadata(template);return [metadata.templateId,metadata];})));

function validateEnemyCapabilityRegistry() {
  const ids=Object.keys(ENEMY_TEMPLATE_REGISTRY),metadataIds=Object.keys(ENEMY_CAPABILITY_REGISTRY);
  if(ids.length!==metadataIds.length||ids.some(id=>!Object.hasOwn(ENEMY_CAPABILITY_REGISTRY,id)))
    throw Error('Enemy capability registry does not cover every registered template');
  for(const id of ids){
    const current=enemyCapabilityMetadata(ENEMY_TEMPLATE_REGISTRY[id]),record=ENEMY_CAPABILITY_REGISTRY[id];
    validateEnemyCapabilityMetadata(record);
    if(JSON.stringify(current)!==JSON.stringify(record))throw Error('Enemy capability metadata is stale for '+id);
  }
  for(const [id,capabilities] of Object.entries(ENEMY_HIDDEN_CAPABILITIES)){
    if(!Object.hasOwn(ENEMY_TEMPLATE_REGISTRY,id)||!Object.isFrozen(capabilities)||new Set(capabilities).size!==capabilities.length||
        capabilities.some(capability=>!Object.hasOwn(ENEMY_CAPABILITY_DEFINITIONS,capability)))
      throw Error('Invalid hidden enemy capability audit for '+id);
  }
  for(const id of ids)canonicalEnemyMechanicProfile(ENEMY_TEMPLATE_REGISTRY[id]);
  return ids.length;
}
validateEnemyCapabilityRegistry();

// Mutable copies are held only by the command-round owner, never on templates.
function canonicalUnusualEnemySeed(template) {
  const profile=canonicalEnemyMechanicProfile(template);
  if(profile.brace&&profile.melee_armor)throw Error('Unsupported Brace and melee armor combination');
  if(profile.regeneration&&profile.steal_and_flee)throw Error('Contradictory unusual enemy mechanics');
  if(profile.fen_tactics)return {fen:fenCombat.seed()};
  if(profile.regeneration)return {healingSuppressed:false,suppressedRound:0};
  if(profile.steal_and_flee)return {stolenGold:0,stolenRound:0,departed:false};
  return null;
}
