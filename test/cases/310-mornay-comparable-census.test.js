'use strict';
const assert=require('assert/strict');
const {J,fresh}=require('./301-mornay-manifest.test');
module.exports={
 name:'Mornay benchmark: ordinary Drenwick schedule union counts 99 non-party town characters, including wake-scene staff, with Renn/Veran deduplicated',
 run(){
  const g=fresh();
  const census=J(g,`(()=>{
   const exteriorKeys=new Set(['drenwick_civic','drenwick_west_residential','drenwick_canal_docks','drenwick_east_outskirts','drenwick_market','drenwick_waterfront']);
   const exterior=new Set(),interior=new Set(),raw=new Set(),placements=new Set();
   // Ten days include both alternating Dayoffs and every five-day work schedule.
   for(day=1;day<=10;day++)for(const npc of SIMPLE_NPCS){
    const key=npc.map||'';
    if(npc.id==='infirmary_esla'||npc.spriteType==='cat'||key==='drenwick_post')continue;
    if(!key.startsWith('drenwick_')&&!key.startsWith('house:drenwick_'))continue;
    const id=npc.id==='harbormaster_interior'?'harbormaster':npc.id;
    raw.add(npc.id);placements.add(npc.id+'@'+key);
    (exteriorKeys.has(key)?exterior:interior).add(id);
   }
   return {exterior:[...exterior],interior:[...interior],raw:[...raw],placements:[...placements],distinct:[...new Set([...exterior,...interior])]};
  })()`);
  assert.equal(census.exterior.length,9);assert.equal(census.interior.length,92);assert.equal(census.distinct.length,99);
  assert.deepEqual(census.exterior.filter(id=>census.interior.includes(id)).sort(),['harbormaster','veran_retired']);
  for(const id of ['infirmarer','infirmary_orderly','infirmary_patient'])assert.ok(census.interior.includes(id),id+' ordinary MQ4 wake content remains in comparator');
  for(const id of ['infirmary_esla','esla','lely','tarvec','bridge_soldier_south','bridge_soldier_north','traveller','drenwick_traveller','north_a_cat_grey','north_a_cat_ginger','apt_c1_u4_feral_cat'])assert.ok(!census.distinct.includes(id),id+' excluded from town-character benchmark');
  assert.ok(census.raw.includes('harbormaster_interior'));assert.ok(census.placements.includes('veran_retired@drenwick_canal_docks'));assert.ok(census.placements.includes('veran_retired@house:drenwick_west_b'));
  assert.equal(g.run('MORNAY_NPCS.length')/census.distinct.length,311/99);
 }
};
