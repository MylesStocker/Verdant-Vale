'use strict';

// Closed mechanic vocabulary. Canonical compatibility is the intersection of
// an enemy's complete requirements with the supported mechanic set below; no
// enemy identity is an approval credential.
const ENEMY_CAPABILITY_DEFINITIONS = Object.freeze({
  basic_attack:Object.freeze({canonical:true}),
  standard_observe:Object.freeze({canonical:true}),
  standard_rewards:Object.freeze({canonical:true}),
  boss_escape_lock:Object.freeze({canonical:true}),
  brace:Object.freeze({canonical:false}),
  curse_on_hit:Object.freeze({canonical:false}),
  void_shard_burst:Object.freeze({canonical:false}),
  acid_corrosion:Object.freeze({canonical:false}),
  split_followup:Object.freeze({canonical:false}),
  regeneration:Object.freeze({canonical:false}),
  melee_armor:Object.freeze({canonical:false}),
  counterattack:Object.freeze({canonical:false}),
  poison_on_hit:Object.freeze({canonical:false}),
  mire_toad_reagent_observation:Object.freeze({canonical:false}),
  slither_on_hit:Object.freeze({canonical:false}),
  poison_spell:Object.freeze({canonical:false}),
  dazzle_on_hit:Object.freeze({canonical:false}),
  steal_and_flee:Object.freeze({canonical:false}),
  observe_run_lock:Object.freeze({canonical:false}),
  guaranteed_drop:Object.freeze({canonical:false}),
  generated_stats:Object.freeze({canonical:false}),
  warden_lifecycle:Object.freeze({canonical:false}),
  fort_lifecycle:Object.freeze({canonical:false}),
  firelit_attack:Object.freeze({canonical:false}),
  persistent_hp_lifecycle:Object.freeze({canonical:false}),
  rainfish_chain:Object.freeze({canonical:false}),
  takomo_lifecycle:Object.freeze({canonical:false}),
  den_wraith_lifecycle:Object.freeze({canonical:false}),
  sailor_brawl_lifecycle:Object.freeze({canonical:false}),
  wrongteeth_lifecycle:Object.freeze({canonical:false}),
  lensweb_objective_lifecycle:Object.freeze({canonical:false}),
  mimic_trap_lifecycle:Object.freeze({canonical:false}),
  receiver_coordination:Object.freeze({canonical:false}),
});
const CANONICAL_ENEMY_CAPABILITIES = Object.freeze(Object.keys(ENEMY_CAPABILITY_DEFINITIONS)
  .filter(id=>ENEMY_CAPABILITY_DEFINITIONS[id].canonical));

const ENEMY_TEMPLATE_FIELD_CAPABILITIES = Object.freeze({
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
  enemy_gallery_receiver:['receiver_coordination'],
  enemy_gallery_caller:['receiver_coordination'],
  enemy_gallery_keeper:['receiver_coordination'],
}).map(([id,capabilities])=>[id,Object.freeze(capabilities)])));

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
  for(const key of ['regenPerTurn','meleeArmor'])if(fields[key]&&
      (!Number.isSafeInteger(fields[key].value)||fields[key].value<=0))fail('malformed capability field '+key+' for '+id);
  for(const key of ['splits','stealAndFlee','inline'])if(fields[key]&&fields[key].value!==true)
    fail('malformed capability field '+key+' for '+id);
  if(fields.sex&&!['male','female'].includes(fields.sex.value))fail('malformed capability field sex for '+id);
  if(fields.runLock&&fields.runLock.value!=='observe_gated')fail('malformed capability field runLock for '+id);
  if(fields.guaranteedDrop&&(typeof fields.guaranteedDrop.value!=='string'||!fields.guaranteedDrop.value))
    fail('malformed capability field guaranteedDrop for '+id);
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
  const unsupported=metadata.capabilities.filter(id=>!ENEMY_CAPABILITY_DEFINITIONS[id].canonical);
  return copyFormationData({templateId:metadata.templateId,compatible:unsupported.length===0,
    capabilities:metadata.capabilities,unsupported});
}
function canonicalEnemyIsCompatible(template) {
  try{return canonicalEnemyCompatibility(template).compatible;}catch(_){return false;}
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
  return ids.length;
}
validateEnemyCapabilityRegistry();
