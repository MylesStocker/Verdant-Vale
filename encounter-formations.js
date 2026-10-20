'use strict';

// Authored encounter data, independent of the player roster and combat engine.
// No geographic pool uses an explicit formation yet. Flat template pools keep
// their original order, repetitions, uniform index selection and single draw.
const encounterFormations = (() => {
  const fail = message => { throw Error('Encounter formation: '+message); };
  const plain = value => value && typeof value==='object' && !Array.isArray(value) &&
    [Object.prototype,Object.getPrototypeOf({})].includes(Object.getPrototypeOf(value));
  const record = (value,keys) => {
    if(!plain(value))fail('expected plain data');
    const fields=Object.getOwnPropertyDescriptors(value);
    if(Reflect.ownKeys(fields).length!==keys.length || keys.some(k=>!Object.hasOwn(fields[k]||{},'value')))
      fail('unknown field or accessor');
    return {...Object.fromEntries(keys.map(k=>[k,fields[k].value]))};
  };
  const array = value => {
    if(!Array.isArray(value)||![Array.prototype,Object.getPrototypeOf([])].includes(Object.getPrototypeOf(value)))fail('expected dense array');
    const fields=Object.getOwnPropertyDescriptors(value),n=fields.length.value;
    if(Reflect.ownKeys(fields).length!==n+1)fail('unknown array field');
    return [...Array.from({length:n},(_,i)=>{
      if(!Object.hasOwn(fields[i]||{},'value'))fail('array hole or accessor');
      return fields[i].value;
    })];
  };
  const registered = id => {
    if(typeof id!=='string'||!/^enemy_[a-z0-9_]+$/.test(id))fail('invalid template ID');
    const field=Object.getOwnPropertyDescriptor(ENEMY_TEMPLATE_REGISTRY,id);
    if(!field||!Object.hasOwn(field,'value')||!plain(field.value)||
        Object.getOwnPropertyDescriptor(field.value,'id')?.value!==id)fail('unregistered template '+id);
    return field.value;
  };
  // Shape validation is separate from registration/capability approval so
  // isolated future-content fixtures need no invented production templates.
  const definition = value => {
    const d=record(value,['id','enemies','weight']),ids=array(d.enemies);
    if(!Object.isFrozen(value)||!Object.isFrozen(d.enemies))fail('authored formation must be immutable');
    if(typeof d.id!=='string'||!/^formation_[a-z0-9_]+$/.test(d.id)||
        !Number.isSafeInteger(d.weight)||d.weight<=0||ids.length<1||ids.length>3||
        ids.some(id=>typeof id!=='string'||!/^enemy_[a-z0-9_]+$/.test(id)))fail('invalid formation definition');
    return copyFormationData({...d,enemies:ids});
  };
  const normalize = pool => {
    const entries=array(pool);if(!entries.length)fail('empty encounter table');
    let totalWeight=0,legacy=true;const authoredIds=new Set();
    const formations=entries.map(entry=>{
      let d;
      if(plain(entry)&&Object.hasOwn(entry,'enemies')){
        legacy=false;d=definition(entry);d.enemies.forEach(registered);
        if(authoredIds.has(d.id))fail('duplicate formation ID '+d.id);authoredIds.add(d.id);
      }else{
        const id=entry&&Object.getOwnPropertyDescriptor(entry,'id')?.value;
        if(registered(id)!==entry)fail('legacy shorthand must be the registered template');
        d={id:'formation_single_'+id,enemies:[id],weight:1};
      }
      totalWeight+=d.weight;
      if(!Number.isSafeInteger(totalWeight))fail('unsafe total formation weight');
      return d;
    });
    // Explicit IDs cannot alias shorthand IDs. Repeated shorthand is retained
    // because repetition already represents weighting in legacy flat pools.
    for(const d of formations)if(authoredIds.has(d.id)&&formations.filter(f=>f.id===d.id).length>1)
      fail('ambiguous formation ID '+d.id);
    return copyFormationData({mode:legacy?'legacy_flat':'weighted',formations,totalWeight});
  };
  return Object.freeze({
    validateDefinition:definition,
    normalizePool:normalize,
    select(pool){
      const table=normalize(pool); // validate the whole table before selection RNG
      const roll=Math.random();if(!Number.isFinite(roll)||roll<0||roll>=1)fail('invalid selection RNG');
      if(table.mode==='legacy_flat')return table.formations[Math.floor(roll*table.formations.length)];
      const position=roll*table.totalWeight;let end=0;
      for(const d of table.formations){end+=d.weight;if(position<end)return d;}
      fail('selection outside table');
    },
  });
})();

// Read-only enemy-side runtime approval, shared by canonical entry and the
// private persistent bridge. Data validity never implies capability approval.
function preparePartyEnemyFormation(value) {
  const fail=message=>{throw Error('Canonical party encounter: '+message);};
  const data=(value,keys)=>{
    if(!value||typeof value!=='object'||Array.isArray(value)||
        ![Object.prototype,Object.getPrototypeOf({})].includes(Object.getPrototypeOf(value)))fail('expected plain enemy data');
    const fields=Object.getOwnPropertyDescriptors(value);
    if(Reflect.ownKeys(fields).length!==keys.length||keys.some(k=>!Object.hasOwn(fields[k]||{},'value')))
      fail('unknown field or accessor');
    return {...Object.fromEntries(keys.map(k=>[k,fields[k].value]))};
  };
  if(!Array.isArray(value)||![Array.prototype,Object.getPrototypeOf([])].includes(Object.getPrototypeOf(value)))fail('enemy group must be a dense array');
  const fields=Object.getOwnPropertyDescriptors(value),n=fields.length.value;
  if(n<1||n>3||Reflect.ownKeys(fields).length!==n+1)fail('requires one to three enemies');
  const safe=n=>Number.isSafeInteger(n)&&n>=0;
  const templates=[...Array.from({length:n},(_,slot)=>{
    if(!Object.hasOwn(fields[slot]||{},'value'))fail('enemy group contains an accessor or hole');
    const supplied=fields[slot].value,id=typeof supplied==='string'?supplied:Object.getOwnPropertyDescriptor(supplied||{},'id')?.value;
    if(typeof id!=='string')fail('unregistered enemy <invalid template ID>');
    const template=Object.getOwnPropertyDescriptor(ENEMY_TEMPLATE_REGISTRY,id)?.value;
    if(!template)fail('unregistered enemy '+id);
    try{requireCanonicalEnemyCapabilities(template);canonicalUnusualEnemySeed(template);}catch(error){fail(error.message);}
    const origin=typeof supplied==='object'?canonicalEnemyRecords.origin(supplied):null;
    if(canonicalEnemyMechanicProfile(template).generated_stats&&!origin)fail('generated_stats requires authenticated selection provenance');
    const selected=origin?supplied:template;
    const mechanicFields=Object.keys(ENEMY_TEMPLATE_FIELD_CAPABILITIES).filter(key=>
      Object.hasOwn(selected,key)&&ENEMY_CAPABILITY_DEFINITIONS[ENEMY_TEMPLATE_FIELD_CAPABILITIES[key]].canonical);
    const keys=[...FORMATION_STATE_DATA_FIELDS,...(Object.hasOwn(template||{},'isBoss')?['isBoss']:[]),...mechanicFields];
    const exact=data(selected,keys);
    if(typeof supplied!=='string'){
      const input=data(supplied,keys);
      if(keys.some(k=>input[k]!==exact[k]))fail('enemy instance differs from its approved template: '+id);
    }
    if(exact.id!==id||typeof exact.name!=='string'||!exact.name.trim()||!formationBasicStatsValid(exact)||!exact.hp||
        !['xp','goldMin','goldMax'].every(k=>safe(exact[k]))||exact.goldMax<exact.goldMin||
        !safe(exact.goldMax-exact.goldMin+1)||Object.hasOwn(exact,'isBoss')&&typeof exact.isBoss!=='boolean')
      fail('invalid enemy arithmetic: '+id);
    return origin?supplied:copyFormationData(exact);
  })];
  const ids=templates.map(t=>t.id);
  if(n>1&&!templates.some(t=>canonicalEnemyRecords.origin(t)))validateCanonicalFormationDescriptors(ids.map((enemyId,slot)=>({enemyId,slot})));
  return Object.freeze({ids:Object.freeze(ids),templates:Object.freeze(templates),slots:copyFormationData(ids.map((enemyId,slot)=>({enemyId,slot})))});
}

// Fail malformed authored tables at script startup, before a world selection.
for(const pool of ENEMY_TEMPLATE_POOLS)encounterFormations.normalizePool(pool.templates);
