'use strict';

// Authenticated selection/successor data, not live combat membership. No actor
// identity is allocated here. Originals are accepted by reference only; history
// keeps immutable issuance evidence after the encounter has finished.
const canonicalEnemyRecords=(()=>{
  const issued=new WeakMap(),histories=new Map();let splitClaimed=false,scriptedClaimed=false;
  const fail=()=>{throw Error('Invalid authenticated canonical enemy record');};
  const issue=(template,kind,rolls)=>{
    const record=copyFormationData(template),origin=copyFormationData({kind,template:record,rolls});
    issued.set(record,origin);histories.set(JSON.stringify(origin),record);return record;
  };
  return Object.freeze({
    origin(record){return issued.get(record)||null;},
    history(origin){const source=histories.get(JSON.stringify(origin));if(!source)fail();return source;},
    generated(){
      const template=Object.values(ENEMY_TEMPLATE_REGISTRY).find(t=>enemyCapabilityMetadata(t).capabilities.includes('generated_stats'));
      if(!template)fail();requireCanonicalEnemyCapabilities(template);
      const rolls=[],draw=()=>{const r=Math.random();if(!Number.isFinite(r)||r<0||r>=1)fail();rolls.push(r);return 23*Math.ceil(r*23);};
      const hp=draw(),a=draw(),b=draw();
      return issue({id:template.id,name:template.name,hp,maxHp:hp,atk:draw(),def:draw(),spd:draw(),xp:draw(),goldMin:Math.min(a,b),goldMax:Math.max(a,b)},'generated',rolls);
    },
    claimSplitFactory(){
      if(splitClaimed)fail();splitClaimed=true;
      return template=>{
        const registered=ENEMY_TEMPLATE_REGISTRY[template.id];
        requireCanonicalEnemyCapabilities(registered);
        const split=canonicalEnemyMechanicProfile(registered).split_followup;if(!split)fail();
        return issue({...registered,hp:split.hp,maxHp:split.hp,xp:split.xp,goldMin:split.goldMin,goldMax:split.goldMax},'split',[]);
      };
    },
    claimScriptedFactory(){
      if(scriptedClaimed)fail();scriptedClaimed=true;
      return (template,hp)=>{
        if(!template||ENEMY_TEMPLATE_REGISTRY[template.id]!==template||!Number.isSafeInteger(hp)||hp<=0||hp>template.maxHp)fail();
        requireCanonicalEnemyCapabilities(template);
        return issue({...template,hp},'scripted',[]);
      };
    },
  });
})();
