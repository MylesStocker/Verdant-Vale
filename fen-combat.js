'use strict';

// Battle-local tactical mechanics. This pure reducer is also run by playback
// authentication: recorded effects are evidence, never instructions to execute.
// No world, save, inventory, RNG, DOM or canonical-party writes live here.
const FEN_TACTICS = Object.freeze(['false_lights','marked_lunge','bell_chorus','reed_snare','blood_siphon']);
const fenCombat = (() => {
  const clone = value => value===null||typeof value!=='object'?value:Array.isArray(value)?[...value].map(clone):
    {...Object.fromEntries(Object.entries(value).map(([key,v])=>[key,clone(v)]))};
  const seed = () => ({mode:'idle',targetId:null,partnerId:null,round:0,hits:0,
    observed:false,exposed:false,slowTargetId:null,slowUntil:0,cooldown:0});
  const living = m => m.hp>0&&!m.unusual?.departed;
  const f = e => e.unusual?.fen;
  const enabled = state => state.enemies.some(e=>e.fenTactic);
  const penalty = (enemies,id) => Math.max(0,...enemies.filter(living).map(e=>{
    const u=f(e);return !u?0:u.mode==='bound'&&u.targetId===id?6:u.slowTargetId===id?4:0;
  }));
  const speed = (enemies,id,base) => Math.max(1,base-penalty(enemies,id));
  const refresh = state => {
    for(const m of state.party){
      const gear=state.equipment[m.slot],effect=state.effects[m.slot];
      const raw=m.statuses.includes('slither')?effect.slither.speed:
        Math.max(1,m.spd+(gear.accessory?ITEM_REGISTRY[gear.accessory]?.bonus||0:0)-(m.statuses.includes('muddied')?2:0));
      m.effective.spd=speed(state.enemies,m.instanceId,raw);
    }
  };
  // Pair membership is chosen once from the round-entry snapshot. Both actions
  // are reserved even if an ally interrupts the charge before its initiative.
  const pairs = state => {
    const used=new Set(),result=[];
    for(const e of state.enemies.filter(e=>living(e)&&e.fenTactic==='bell_chorus')){
      const u=f(e);if(!u||!['idle','charge'].includes(u.mode))continue;
      let partner=u.mode==='charge'?state.enemies.find(p=>p.instanceId===u.partnerId):
        state.enemies.find(p=>living(p)&&p.fenTactic==='false_lights'&&!f(p).observed&&!used.has(p.instanceId));
      if(partner&&used.has(partner.instanceId))partner=null;
      if(partner){used.add(partner.instanceId);result.push({actorId:e.instanceId,partnerId:partner.instanceId,spd:Math.min(e.spd,partner.spd)});}
    }
    return result;
  };
  const plan = (actors,state) => {
    const linked=pairs(state);
    return actors.filter(a=>!linked.some(p=>p.partnerId===a.actorId)).map(a=>{
      const p=linked.find(p=>p.actorId===a.actorId);return p?{...a,spd:p.spd}:a;
    });
  };
  const validate = (u,state,maxRound) => {
    const s=seed();if(!u||Object.keys(u).length!==Object.keys(s).length||Object.keys(s).some(k=>!Object.hasOwn(u,k)))throw Error('Invalid fen combat state');
    if(!['idle','charge','rest','marked','bound','watch','swollen'].includes(u.mode)||
      ['round','hits','slowUntil','cooldown'].some(k=>!Number.isSafeInteger(u[k])||u[k]<0)||u.round>maxRound||u.hits>2||
      typeof u.observed!=='boolean'||typeof u.exposed!=='boolean'||
      ['targetId','slowTargetId'].some(k=>u[k]!==null&&!state.party.some(m=>m.instanceId===u[k]))||
      u.partnerId!==null&&!state.enemies.some(e=>e.instanceId===u.partnerId))throw Error('Invalid fen combat state');
  };
  const step = (source,phase,actorId,round,context={}) => {
    if(!enabled(source))return null;
    const state=clone(source),actor=state.enemies.find(e=>e.instanceId===actorId),messages=[],hits=[];
    const say=text=>messages.push(text);
    const hit=(enemy,target,power,label)=>{
      if(!target||!living(target))return;
      const defense=playerIncomingMitigation(power,target.effective.def,target.effective.defenseCapBypass);
      const amount=target.effective.evadeAll?0:attackDamageNumbers(power,defense,1,false).dmg,before=target.hp;
      target.hp=Math.max(0,before-amount);hits.push({targetId:target.instanceId,hpBefore:before,hpAfter:target.hp});
      say(`${label}: ${target.name} takes ${before-target.hp}.`);
    };
    const dazzled=target=>{if(living(target)&&!target.statuses.includes('dazzled'))target.statuses.push('dazzled');};
    let handled=false;
    if(phase==='action'&&actor?.fenTactic){
      handled=true;const u=f(actor),target=state.party.find(m=>m.instanceId===context.targetId),role=actor.fenTactic;
      // Combined actions must still consume their reservation when interrupted.
      const pair=context.pair;
      if(pair&&(!living(actor)||!living(state.enemies.find(e=>e.instanceId===pair.partnerId)))){
        u.mode='rest';u.partnerId=null;say('Witchlight Chorus breaks. The surviving creature wastes its turn.');
      }else if(!living(actor))return null;
      else if(role==='false_lights'){
        if(!u.observed&&round%2===1){if(target){dazzled(target);say(`False Lights dazzle ${target.name}.`);}}
        else handled=false;
      }else if(role==='marked_lunge'){
        if(u.mode==='marked'){
          const marked=state.party.find(m=>m.instanceId===u.targetId);
          hit(actor,marked,Math.floor(actor.atk*1.6),'Hamstring');
          if(marked&&living(marked)){u.slowTargetId=marked.instanceId;u.slowUntil=round+1;}
          u.mode='rest';u.targetId=null;
        }else if(u.mode==='rest'){handled=false;u.mode='idle';say('The hound recovers its stance and bites.');}
        else if(target){u.mode='marked';u.targetId=target.instanceId;u.round=round;say(`The Blackbriar Hound singles out ${target.name}. A lunge is coming next round!`);}
      }else if(role==='bell_chorus'){
        if(u.mode==='rest'){handled=false;u.mode='idle';say('The toad deflates and bites.');}
        else if(u.mode==='charge'){
          const partner=state.enemies.find(e=>e.instanceId===u.partnerId);
          if(u.partnerId&&(!partner||!living(partner)))say('Witchlight Chorus breaks. The toad loses its turn.');
          else{
            const chorus=!!u.partnerId,label=chorus?'Witchlight Chorus':'Deep Toll';
            for(const m of state.party.filter(living)){hit(actor,m,Math.floor(actor.atk*(chorus?1.45:1.1)),label);if(chorus)dazzled(m);}
          }
          u.mode='rest';u.partnerId=null;
        }else{
          u.mode='charge';u.round=round;u.partnerId=pair?.partnerId||null;
          say(pair?'The toad swells; a Drownlight circles it. Witchlight Chorus next round!':'The toad inflates its throat. Deep Toll next round!');
        }
      }else if(role==='reed_snare'){
        if(u.mode==='bound'||u.cooldown>=round){handled=false;}
        else if(target){u.mode='bound';u.targetId=target.instanceId;u.round=round;u.hits=0;say(`Reedbinder snares ${target.name}! Two damaging hits cut the reeds.`);}
      }else if(role==='blood_siphon'){
        if(u.mode==='watch'||u.mode==='swollen'||u.cooldown>=round){
          handled=false;
        }else if(target){u.mode='watch';u.targetId=target.instanceId;u.round=round;say(`Scent Blood: the leech watches ${target.name}'s healing through next round.`);}
      }
    }else if(phase==='after'){
      const previous=context.previous;
      for(const e of state.enemies){
        const u=f(e);if(!u)continue;
        const old=previous.enemies.find(m=>m.instanceId===e.instanceId);
        if(e.fenTactic==='false_lights'&&!u.observed&&e.observeCount>old.observeCount){
          u.observed=true;u.exposed=true;say('True Light found! False Lights cease; next hit doubles. Defeat it for +50% XP.');
        }
        const dealt=old.hp-e.hp;
        if(dealt>0){
          if(u.exposed){const before=e.hp;e.hp=Math.max(0,e.hp-dealt);u.exposed=false;hits.push({targetId:e.instanceId,hpBefore:before,hpAfter:e.hp});say(`True Light: ${before-e.hp} extra damage!`);}
          if(u.mode==='swollen'){
            const before=e.hp;e.hp=Math.max(0,e.hp-50);u.mode='idle';u.targetId=null;u.cooldown=round+2;
            hits.push({targetId:e.instanceId,hpBefore:before,hpAfter:e.hp});say(`The swollen leech ruptures for ${before-e.hp} extra damage!`);
          }
          if(u.mode==='bound'){u.hits++;if(u.hits>=2){u.mode='idle';u.targetId=null;u.cooldown=round+1;say('The binding reeds are cut!');}}
        }
        if(living(e)&&u.mode==='watch'){
          const m=state.party.find(m=>m.instanceId===u.targetId),oldM=previous.party.find(m=>m.instanceId===u.targetId);
          const healed=m&&oldM?m.hp-oldM.hp:0;
          if(healed>0){const amount=Math.min(Math.floor(healed/2),e.maxHp-e.hp);e.hp+=amount;u.mode='swollen';say(`The leech siphons ${amount} HP. Its swollen body is vulnerable!`);}
        }
        if(!living(e)){if(u.mode==='bound')say('The dead Reedbinder releases its grip.');u.mode='idle';u.targetId=null;u.slowTargetId=null;}
      }
    }else if(phase==='boundary'){
      for(const e of state.enemies.filter(living)){
        const u=f(e);if(!u)continue;
        if(u.mode==='bound'){
          const m=state.party.find(m=>m.instanceId===u.targetId);
          if(m&&living(m)){const before=m.hp;m.hp=Math.max(0,m.hp-8);hits.push({targetId:m.instanceId,hpBefore:before,hpAfter:m.hp});say(`Binding reeds squeeze ${m.name} for ${before-m.hp}.`);}
          if(round>=u.round+1||!m||!living(m)){u.mode='idle';u.targetId=null;u.cooldown=round+1;say('The binding reeds loosen.');}
        }
        if(u.slowTargetId&&round>=u.slowUntil)u.slowTargetId=null;
        if(u.mode==='watch'&&round>=u.round+1){u.mode='idle';u.targetId=null;}
      }
    }else if(phase==='cleanup'){
      for(const e of state.enemies){const u=f(e);if(u){const observed=u.observed;e.unusual.fen=seed();e.unusual.fen.observed=observed;}}
    }
    refresh(state);
    if(!handled&&JSON.stringify(state)===JSON.stringify(source))return null;
    return {state,handled,event:{type:'fen_effect',phase,actorId,round,messages,hits,before:clone(source),after:clone(state)}};
  };
  return Object.freeze({clone,seed,enabled,plan,pairs,penalty,speed,refresh,validate,step});
})();


const GREAT_FEN_OBSERVATIONS = Object.freeze({
  enemy_peatback:['A stone-backed brute buried in peat. Slow and durable.','Its companions are usually the more urgent threat.'],
  enemy_drownlight:['Only the dark centre casts a reflection. True Light found!','False Lights cease. Next damaging hit doubles; defeat grants 50% extra XP.'],
  enemy_blackbriar_hound:['It watches one person, then lunges the following round.','Hamstring hits hard and slows its victim. Heal them or finish the hound first.'],
  enemy_bell_throated_toad:['The swelling throat gives one round of warning before Deep Toll.','With a Drownlight it prepares Witchlight Chorus. Kill either to break the Tech.'],
  enemy_reedbinder:['Two damaging hits cut its binding reeds. The trapped person can still act.','The grip slows and squeezes, but loosens after two round ends.'],
  enemy_bladder_leech:['It watches one person for healing, then siphons half the restored HP.','Your healing still works. Hit the swollen leech to rupture it for 50 extra damage.'],
});
