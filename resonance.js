'use strict';

// Closed authored technique data. This is not a registry extension API: tests
// install synthetic authored definitions by replacing source in their VM only.
const RESONANCE_ELEMENTS = Object.freeze(['bloommarked','firelit','void','prism']);
function validateResonanceTechnique(value) {
  const fail=()=>{throw Error('Invalid Resonance technique definition');};
  const record=(v,keys)=>{
    if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.getPrototypeOf({}))fail();
    const d=Object.getOwnPropertyDescriptors(v);
    if(Reflect.ownKeys(d).length!==keys.length||keys.some(k=>!Object.hasOwn(d[k]||{},'value')))fail();
    return Object.fromEntries(keys.map(k=>[k,d[k].value]));
  };
  const damaging=Object.getOwnPropertyDescriptor(value||{},'effect')?.value==='damage';
  const d=record(value,['id','name','kind','initiator','participants','target','effect','elements',...(damaging?['power']:[])]);
  if(!Array.isArray(d.elements)||Object.getPrototypeOf(d.elements)!==Object.getPrototypeOf([])||!Object.isFrozen(d.elements))fail();
  const elementFields=Object.getOwnPropertyDescriptors(d.elements),elements=[];
  if(!d.elements.length||Reflect.ownKeys(elementFields).length!==d.elements.length+1)fail();
  for(let i=0;i<d.elements.length;i++){
    if(!Object.hasOwn(elementFields[i]||{},'value')||!RESONANCE_ELEMENTS.includes(elementFields[i].value))fail();
    elements.push(elementFields[i].value);
  }
  if(new Set(elements).size!==elements.length)fail();
  const id=v=>typeof v==='string'&&/^[a-z][a-z0-9_]*$/.test(v);
  if(!id(d.id)||typeof d.name!=='string'||!d.name.trim()||d.name.length>40||!id(d.initiator)||
      !['ordinary','combined'].includes(d.kind)||
      (damaging?(!(d.kind==='ordinary'?d.target==='living_enemy':d.target==='all_living_enemies')||!Number.isSafeInteger(d.power)||d.power<1):
        d.target!=='living_wounded_ally'||d.effect!=='heal_fifth')||
      !Array.isArray(d.participants)||Object.getPrototypeOf(d.participants)!==Object.getPrototypeOf([]))fail();
  const props=Object.getOwnPropertyDescriptors(d.participants),n=d.participants.length;
  if(Reflect.ownKeys(props).length!==n+1||!(d.kind==='ordinary'?n===1:n===2||n===3))fail();
  const participants=[];
  for(let i=0;i<n;i++){
    if(!Object.hasOwn(props[i]||{},'value'))fail();
    const p=record(props[i].value,['characterId','affinity','strain']);
    if(!id(p.characterId)||!['bloommarked','voidborn','prismborn'].includes(p.affinity)||!Number.isSafeInteger(p.strain)||p.strain<1)fail();
    participants.push(Object.freeze(p));
  }
  if(new Set(participants.map(p=>p.characterId)).size!==n||!participants.some(p=>p.characterId===d.initiator))fail();
  return Object.freeze({...d,elements:Object.freeze(elements),participants:Object.freeze(participants)});
}
const RESONANCE_TECHNIQUES = Object.freeze({
  quickbloom:validateResonanceTechnique({id:'quickbloom',name:'Quickbloom',kind:'ordinary',initiator:'esla',
    elements:Object.freeze(['bloommarked']),
    participants:[{characterId:'esla',affinity:'bloommarked',strain:1}],target:'living_wounded_ally',effect:'heal_fifth'}),
  null:validateResonanceTechnique({id:'null',name:'Null',kind:'ordinary',initiator:'sera',
    elements:Object.freeze(['void']),participants:[{characterId:'sera',affinity:'voidborn',strain:1}],
    target:'living_enemy',effect:'damage',power:120}),
  rainbow:validateResonanceTechnique({id:'rainbow',name:'Rainbow',kind:'ordinary',initiator:'liora',
    elements:Object.freeze(['prism']),participants:[{characterId:'liora',affinity:'prismborn',strain:1}],
    target:'living_enemy',effect:'damage',power:120}),
  eclipse:validateResonanceTechnique({id:'eclipse',name:'Eclipse',kind:'combined',initiator:'sera',
    elements:Object.freeze(['void','prism']),participants:[{characterId:'sera',affinity:'voidborn',strain:1},
      {characterId:'liora',affinity:'prismborn',strain:1}],target:'all_living_enemies',effect:'damage',power:120}),
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
    // Authored knowledge is separate from identity/affinity and never saved.
    const definitions=cap?.source==='story'?STORY_CHARACTER_DEFINITIONS:PERSISTENT_CHARACTER_DEFINITIONS;
    const known=Object.getOwnPropertyDescriptor(definitions,p.characterId)?.value.knownTechniques;
    return actor&&cap.rareBorn===true&&cap.affinity===p.affinity&&
      Array.isArray(known)&&known.includes(technique.id)?actor:null;
  });
}

// Pure authored-capability validation, shared by Lab preflight and command
// preparation so malformed metadata fails before either side allocates IDs.
function resonanceCapabilityBinding(member, binding, slot, allowStory=false) {
  const fail=()=>{throw Error('Invalid Resonance capability binding');};
  if(!binding||typeof binding!=='object'||Object.getPrototypeOf(binding)!==Object.getPrototypeOf({}))fail();
  const d=Object.getOwnPropertyDescriptors(binding);
  const story=Object.hasOwn(d,'source');
  if(Reflect.ownKeys(d).length!==(story?3:2)||!Object.hasOwn(d.slot||{},'value')||!Object.hasOwn(d.characterId||{},'value')||
      story&&(!allowStory||!Object.hasOwn(d.source,'value')||d.source.value!=='story'))fail();
  const characterId=d.characterId.value;
  if(typeof characterId!=='string')fail();
  const definitions=story?STORY_CHARACTER_DEFINITIONS:PERSISTENT_CHARACTER_DEFINITIONS;
  const definition=Object.getOwnPropertyDescriptor(definitions,characterId)?.value;
  if(d.slot.value!==slot||!definition||
      !(story?[characterId]:[characterId,characterId+'_lab']).includes(member.characterId)||typeof definition.rareBorn!=='boolean'||
      (definition.rareBorn?!(story?['bloommarked','voidborn','prismborn']:['bloommarked']).includes(definition.affinity):definition.affinity!==null))fail();
  return {characterId,rareBorn:definition.rareBorn,affinity:definition.affinity,...(story?{source:'story'}:{}),strain:0,appliedRound:0};
}

// Shared pure target/effect policies. No character or technique ID dispatch.
function resonanceTargetSide(technique) {
  return ['living_enemy','all_living_enemies'].includes(technique.target)?'enemy':'ally';
}
function resonanceTargetEligible(technique,target,side) {
  return !!target&&side===resonanceTargetSide(technique)&&target.hp>0&&!target.unusual?.departed&&
    (technique.target!=='living_wounded_ally'||target.hp<target.maxHp);
}
function resonanceDamageAmount(power,defense) {
  if(!Number.isSafeInteger(power)||power<1||!Number.isSafeInteger(defense)||defense<0)
    throw Error('Invalid Resonance damage arithmetic');
  return Math.max(1,power-defense);
}

// Every combined participant submits their own choice. Partial drafts may await
// consent, but never fabricate it or accept a conflicting partner command.
function validateResonanceConsents(actions,partial=false) {
  for(const action of actions){
    if(action.type!=='resonance'||resonanceTechnique(action.techniqueId).kind!=='combined')continue;
    for(const id of action.participantIds){
      const partner=actions.find(a=>a.actorId===id);
      if(!partner&&partial)continue;
      if(!partner||partner.type!=='resonance'||partner.techniqueId!==action.techniqueId||
          JSON.stringify(partner.participantIds)!==JSON.stringify(action.participantIds)||
          partner.targetId!==action.targetId||JSON.stringify(partner.targetIds)!==JSON.stringify(action.targetIds))
        throw Error('Combined Resonance requires explicit compatible participant choices');
    }
  }
}
function resonancePlansActor(action,capabilities) {
  return action.type!=='resonance'||resonanceTechnique(action.techniqueId).kind!=='combined'||
    capabilities.find(c=>c.actorId===action.actorId)?.characterId===resonanceTechnique(action.techniqueId).initiator;
}
function resonancePlanSpeed(action,party) {
  const ids=action.type==='resonance'?action.participantIds:[action.actorId];
  return Math.min(...ids.map(id=>party.find(m=>m.instanceId===id).effective.spd));
}
