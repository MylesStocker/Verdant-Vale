'use strict';

// Closed authored technique data. This is not a registry extension API: tests
// install synthetic authored definitions by replacing source in their VM only.
function validateResonanceTechnique(value) {
  const fail=()=>{throw Error('Invalid Resonance technique definition');};
  const record=(v,keys)=>{
    if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.getPrototypeOf({}))fail();
    const d=Object.getOwnPropertyDescriptors(v);
    if(Reflect.ownKeys(d).length!==keys.length||keys.some(k=>!Object.hasOwn(d[k]||{},'value')))fail();
    return Object.fromEntries(keys.map(k=>[k,d[k].value]));
  };
  const d=record(value,['id','name','kind','initiator','participants','target','effect']);
  const id=v=>typeof v==='string'&&/^[a-z][a-z0-9_]*$/.test(v);
  if(!id(d.id)||typeof d.name!=='string'||!d.name.trim()||d.name.length>40||!id(d.initiator)||
      !['ordinary','combined'].includes(d.kind)||d.target!=='living_wounded_ally'||d.effect!=='heal_fifth'||
      !Array.isArray(d.participants)||Object.getPrototypeOf(d.participants)!==Object.getPrototypeOf([]))fail();
  const props=Object.getOwnPropertyDescriptors(d.participants),n=d.participants.length;
  if(Reflect.ownKeys(props).length!==n+1||!(d.kind==='ordinary'?n===1:n===2||n===3))fail();
  const participants=[];
  for(let i=0;i<n;i++){
    if(!Object.hasOwn(props[i]||{},'value'))fail();
    const p=record(props[i].value,['characterId','affinity','strain']);
    if(!id(p.characterId)||p.affinity!=='bloommarked'||!Number.isSafeInteger(p.strain)||p.strain<1)fail();
    participants.push(Object.freeze(p));
  }
  if(new Set(participants.map(p=>p.characterId)).size!==n||!participants.some(p=>p.characterId===d.initiator))fail();
  return Object.freeze({...d,participants:Object.freeze(participants)});
}
const RESONANCE_TECHNIQUES = Object.freeze({
  quickbloom:validateResonanceTechnique({id:'quickbloom',name:'Quickbloom',kind:'ordinary',initiator:'esla',
    participants:[{characterId:'esla',affinity:'bloommarked',strain:1}],target:'living_wounded_ally',effect:'heal_fifth'}),
});

// Shared, pure action-eligibility boundary. The current engine has no authored
// ally disablement status: HP is its only action lock. Synthetic contract tests
// replace this pure policy in their VM to exercise future disablement safely.
function partyActorCanAct(actor, party) { return actor.hp > 0; }

function resonanceTechnique(id) {
  if(typeof id!=='string'||!Object.hasOwn(RESONANCE_TECHNIQUES,id))throw Error('Unknown Resonance technique');
  return RESONANCE_TECHNIQUES[id];
}
function resonanceParticipants(technique, party, capabilities) {
  return technique.participants.map(p=>{
    const cap=capabilities?.find(c=>c.characterId===p.characterId);
    const actor=party.find(m=>m.instanceId===cap?.actorId);
    return actor&&cap.rareBorn===true&&cap.affinity===p.affinity?actor:null;
  });
}

// Pure authored-capability validation, shared by Lab preflight and command
// preparation so malformed metadata fails before either side allocates IDs.
function resonanceCapabilityBinding(member, binding, slot) {
  const fail=()=>{throw Error('Invalid Resonance capability binding');};
  if(!binding||typeof binding!=='object'||Object.getPrototypeOf(binding)!==Object.getPrototypeOf({}))fail();
  const d=Object.getOwnPropertyDescriptors(binding);
  if(Reflect.ownKeys(d).length!==2||!Object.hasOwn(d.slot||{},'value')||!Object.hasOwn(d.characterId||{},'value'))fail();
  const characterId=d.characterId.value;
  if(typeof characterId!=='string')fail();
  const definition=Object.getOwnPropertyDescriptor(PERSISTENT_CHARACTER_DEFINITIONS,characterId)?.value;
  if(d.slot.value!==slot||!definition||
      ![characterId,characterId+'_lab'].includes(member.characterId)||typeof definition.rareBorn!=='boolean'||
      (definition.rareBorn?definition.affinity!=='bloommarked':definition.affinity!==null))fail();
  return {characterId,rareBorn:definition.rareBorn,affinity:definition.affinity,strain:0,appliedRound:0};
}
