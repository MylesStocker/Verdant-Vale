'use strict';

// Shared read-only presentation. The caller supplies one immutable battle view;
// this layer does not own an encounter or read a lifecycle authority.
const PARTY_COMBAT_ALLY_SLOTS = Object.freeze([
  Object.freeze({slot:0,x:108,anchorY:254}),
  Object.freeze({slot:1,x:256,anchorY:263}),
  Object.freeze({slot:2,x:404,anchorY:254}),
]);
const PARTY_COMBAT_ALLY_SPRITES = Object.freeze({
  lely:Object.freeze({draw:drawBattlePlayer,anchorY:254}),
  esla:Object.freeze({draw:drawBattleEsla,anchorY:263}),
  lely_lab:Object.freeze({draw:drawBattlePlayer,anchorY:254}),
  esla_lab:Object.freeze({draw:drawBattleEsla,anchorY:263}),
  sera:Object.freeze({draw:drawStoryBattleSera,anchorY:254}),
  liora:Object.freeze({draw:drawStoryBattleLiora,anchorY:263}),
});
// The party renderer supports this explicit boss template without changing
// the Formation renderer's closed set of sprite bounds.
const PARTY_COMBAT_EXTRA_ENEMY_BOUNDS = Object.freeze({
  enemy_mulholland:Object.freeze([-53,-130,53,14]),
});
// New ordinary templates keep their established singleton sprite. A conservative
// capability-based envelope supplies layout bounds where the legacy Formation
// renderer never needed a per-sprite measurement.
const PARTY_COMBAT_DEFAULT_ENEMY_BOUNDS = Object.freeze([-72,-144,72,72]);

// Quickbloom's recorded execution owns a short presentation-only flourish.
// The session event is the trigger and exact target authority; this timer never
// reads or writes combat state. Twenty-four update ticks is brief enough to keep
// playback moving while leaving the final pale sparkle visible for four frames.
const QUICKBLOOM_ANIMATION_FRAMES = 24;
const QUICKBLOOM_ANIMATION_PALETTE = Object.freeze(['#3f8f52','#78c86f','#a8e89c']);
const PARTY_QUICKBLOOM_MOTES = Object.freeze([
  Object.freeze({dx:-18,delay:0,color:0}), Object.freeze({dx:12,delay:2,color:1}),
  Object.freeze({dx:-8,delay:4,color:2}), Object.freeze({dx:21,delay:6,color:0}),
  Object.freeze({dx:-25,delay:8,color:1}), Object.freeze({dx:3,delay:10,color:2}),
]);

const partyBattleQuickbloomAnimation=(()=>{
  let key=null,frame=0,targetId=null;
  const eventFor=view=>{
    const event=view?.playbackFrame?.currentEvent;
    return event?.type==='resonance'&&event.techniqueId==='quickbloom'?event:null;
  };
  const keyFor=(view,event)=>event?
    [view.label,view.playbackFrame.completedRounds,view.frameIndex,event.actorId,event.targetId].join('|'):null;
  const reset=()=>{key=null;frame=0;targetId=null;return true;};
  const update=(view,deltaSeconds)=>{
    const event=eventFor(view),nextKey=keyFor(view,event);
    if(!event){reset();return false;}
    const delta=presentationFrameDelta(deltaSeconds);
    if(key!==nextKey){key=nextKey;frame=0;targetId=event.targetId;}
    frame=Math.min(QUICKBLOOM_ANIMATION_FRAMES,frame+delta);
    if(QUICKBLOOM_ANIMATION_FRAMES-frame<1e-8)frame=QUICKBLOOM_ANIMATION_FRAMES;
    return true;
  };
  const draw=view=>{
    const event=eventFor(view);
    if(!event||key!==keyFor(view,event)||frame>=QUICKBLOOM_ANIMATION_FRAMES)return false;
    const target=view.party.find(member=>member.instanceId===targetId),slot=target?.slot,
      position=Number.isSafeInteger(slot)?PARTY_COMBAT_ALLY_SLOTS[slot]:null;
    if(!target||!position)throw new Error('Invalid Quickbloom presentation target');
    const age=Math.floor(frame),baseY=position.anchorY+8;
    for(const mote of PARTY_QUICKBLOOM_MOTES){
      const local=age-mote.delay;if(local<0||local>=14)continue;
      const sway=((local+mote.delay)%4<2?0:2)*(mote.dx<0?-1:1),x=Math.round(position.x+mote.dx+sway),y=Math.round(baseY-local*3);
      ctx.fillStyle=QUICKBLOOM_ANIMATION_PALETTE[mote.color];
      if((mote.delay/2)%2===0){ctx.fillRect(x,y,5,2);ctx.fillRect(x+1,y-2,3,2);}
      else {ctx.fillRect(x,y,2,5);ctx.fillRect(x+2,y+1,2,3);}
    }
    if(age>=20){
      const sparkleAge=age-20,x=position.x,y=position.anchorY-32;
      ctx.fillStyle=QUICKBLOOM_ANIMATION_PALETTE[2];ctx.fillRect(x-1,y-5+sparkleAge,3,11-sparkleAge*2);
      ctx.fillRect(x-5+sparkleAge,y-1,11-sparkleAge*2,3);
    }
    return true;
  };
  return Object.freeze({
    draw,reset,update,
    blocksAdvance(view){const event=eventFor(view);return !!event&&(key!==keyFor(view,event)||frame<QUICKBLOOM_ANIMATION_FRAMES);},
    getView(){return Object.freeze({active:key!==null&&frame<QUICKBLOOM_ANIMATION_FRAMES,frame,
      duration:QUICKBLOOM_ANIMATION_FRAMES,targetId});},
  });
})();

// Presentation clocks follow authenticated shared-engine events. They never
// resolve damage, spend Strain, use RNG or change the event/target history.
const partyBattleOffensiveResonanceAnimation=(()=>{
  const durations=Object.freeze({null:24,rainbow:30,eclipse:42});
  const colors=Object.freeze(['#f06065','#f5a34b','#f5d46b','#7dcc83','#6cc4e9','#7483dd','#bd7cdb']);
  let key=null,frame=0,duration=0;
  const eventFor=view=>{
    const event=view?.playbackFrame?.currentEvent;
    return event&&Object.hasOwn(durations,event.techniqueId)&&
      ((event.type==='resonance_damage'&&event.techniqueId!=='eclipse')||
       (event.type==='resonance_damage_all'&&event.techniqueId==='eclipse'))?event:null;
  };
  const keyFor=(view,event)=>event?[view.label,view.playbackFrame.completedRounds,view.frameIndex,
    event.techniqueId,event.participantIds.join(','),event.targetId||event.hits.map(hit=>hit.targetId).join(',')].join('|'):null;
  const reset=()=>{key=null;frame=0;duration=0;return true;};
  const update=(view,seconds)=>{
    const event=eventFor(view);if(!event){reset();return false;}
    const next=keyFor(view,event);if(next!==key){key=next;frame=0;}
    duration=durations[event.techniqueId];
    frame=Math.min(duration,frame+presentationFrameDelta(seconds));
    if(duration-frame<1e-8)frame=duration;
    return true;
  };
  const draw=view=>{
    const event=eventFor(view);if(!event||key!==keyFor(view,event)||frame>=durations[event.techniqueId])return false;
    const layout=partyBattleLayout(view),ids=event.hits?event.hits.map(hit=>hit.targetId):[event.targetId];
    const t=frame/durations[event.techniqueId];
    ctx.save();ctx.beginPath();ctx.rect(0,0,512,297);ctx.clip();
    for(const id of ids){
      const target=layout.enemies.find(enemy=>enemy.instanceId===id);
      if(!target)throw Error('Invalid offensive Resonance visual target');
      const x=target.anchorX,y=target.anchorY-36;
      if(event.techniqueId==='null'){
        const radius=8+24*(1-t);ctx.fillStyle='#151124';ctx.beginPath();ctx.ellipse(x,y,radius,radius*.7,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#9e7abb';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,radius+5,radius*.7+5,0,0,Math.PI*2);ctx.stroke();
        for(let i=0;i<6;i++){const angle=i*Math.PI/3+t*2;ctx.fillStyle='#d1c3e0';ctx.fillRect(Math.round(x+Math.cos(angle)*(radius+8)),Math.round(y+Math.sin(angle)*(radius+8)),3,3);}
      }else if(event.techniqueId==='rainbow'){
        for(let i=0;i<colors.length;i++){
          ctx.strokeStyle=colors[i];ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,10+i*4+Math.sin(t*Math.PI)*8,Math.PI+t,Math.PI*2+t);ctx.stroke();
          const angle=i*Math.PI*2/7+t*3;ctx.fillStyle=colors[i];ctx.fillRect(Math.round(x+Math.cos(angle)*40*t),Math.round(y+Math.sin(angle)*40*t),4,4);
        }
      }else{
        // One strong expanding burst with a dark core and bright fractured rays.
        // No repeated full-screen flashes, and no geometry enters the command UI.
        const burst=Math.sin(t*Math.PI),radius=8+58*burst;
        ctx.fillStyle=t<.5?'#f6dd9c':'#b58ed7';ctx.beginPath();
        for(let i=0;i<24;i++){const angle=i*Math.PI/12,r=i%2?radius*.45:radius;const px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
        ctx.closePath();ctx.fill();ctx.fillStyle='#1b142c';ctx.beginPath();ctx.arc(x,y,10+20*burst,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#e9b8ec';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,16+64*t,0,Math.PI*2);ctx.stroke();
        for(let i=0;i<12;i++){const angle=i*Math.PI/6,r=24+68*t;ctx.fillStyle=colors[i%7];ctx.fillRect(Math.round(x+Math.cos(angle)*r),Math.round(y+Math.sin(angle)*r),4,4);}
      }
    }
    ctx.restore();return true;
  };
  return Object.freeze({update,draw,reset,
    blocksAdvance(view){const event=eventFor(view);return !!event&&(key!==keyFor(view,event)||frame<durations[event.techniqueId]);},
    getView(){return Object.freeze({active:key!==null&&frame<duration,frame,duration});},
  });
})();

function partyBattleEnemySprite(id) {
  return ENEMY_SPRITE_DISPATCH[id] ||
    (ENEMY_GENERIC_SPRITE_IDS.has(id)?{draw:drawBattleGenericEnemy}:null);
}

// Battle-only crops of existing plates expose the floor above the command panel.
// Coordinates are planted feet, not sprite centres. No world/collision changes.
const PARTY_BATTLE_SCENE_STAGING = Object.freeze({
  bethany_courtyard:Object.freeze({backgroundAssetId:'cutaway_bethany_breakfast_v1',cropY:100,
    enemyId:'enemy_buzzy_beetle',height:56,scale:.7,
    enemies:Object.freeze([Object.freeze({x:326,y:218}),Object.freeze({x:426,y:263})]),
    allies:Object.freeze([Object.freeze({x:82,y:254}),Object.freeze({x:184,y:277})])}),
  bethany_storeroom:Object.freeze({backgroundAssetId:'cutaway_bethany_storeroom_v1',cropY:70,
    enemyId:'enemy_large_buzzy_beetle',height:96,scale:1,
    enemies:Object.freeze([Object.freeze({x:370,y:250})]),
    allies:Object.freeze([Object.freeze({x:84,y:253}),Object.freeze({x:184,y:277})])}),
});

function partyBattleLayout(view) {
  const fail=()=>{throw new Error('Invalid party battle presentation view');};
  const validMember=(member,side,slot)=>member&&Object.isFrozen(member)&&member.slot===slot&&
    typeof member.instanceId==='string'&&member.instanceId&&typeof member.name==='string'&&member.name.trim()&&
    Number.isSafeInteger(member.hp)&&Number.isSafeInteger(member.maxHp)&&member.maxHp>0&&member.hp>=0&&member.hp<=member.maxHp&&
    (side==='ally'?typeof member.characterId==='string':typeof member.id==='string');
  const phases=['awaiting_action','item','technique','targeting','ready','playback','playback_complete','victory','defeat','escape'];
  if(!view||!Object.isFrozen(view)||view.active!==true||view.commandSet!=='standard'||typeof view.label!=='string'||!view.label||
      !phases.includes(view.phase)||!Array.isArray(view.party)||!Object.isFrozen(view.party)||view.party.length<1||view.party.length>3||
      !Array.isArray(view.enemies)||!Object.isFrozen(view.enemies)||view.enemies.length<1||view.enemies.length>3||
      view.party.some((m,i)=>!validMember(m,'ally',i))||view.enemies.some((m,i)=>!validMember(m,'enemy',i)))fail();
  const staging=view.stagingId===undefined?null:PARTY_BATTLE_SCENE_STAGING[view.stagingId];
  if(view.stagingId!==undefined&&(!staging||view.backgroundAssetId!==staging.backgroundAssetId||
      view.party.length!==2||view.party[0].characterId!=='sera'||view.party[1].characterId!=='liora'||
      view.enemies.length!==staging.enemies.length||view.enemies.some(m=>m.id!==staging.enemyId)||
      !Number.isFinite(view.presentationSeconds)||view.presentationSeconds<0))fail();
  const enemyFloorY=view.enemyFloorY??212;
  if(!Number.isSafeInteger(enemyFloorY)||enemyFloorY<140||enemyFloorY>212)fail();
  const ids=[...view.party,...view.enemies].map(m=>m.instanceId);
  if(new Set(ids).size!==ids.length)fail();
  const playing=['playback','playback_complete','victory','defeat','escape'].includes(view.phase);
  if(playing!==!!view.playbackFrame||
      (['awaiting_action','item','technique','targeting'].includes(view.phase)
        ? !view.party.some(m=>m.hp>0&&m.instanceId===view.nextActorId):view.nextActorId!==null)||
      (view.phase==='targeting'?(view.targetMode==='all'?view.selectedTargetInstanceId!==null||view.targetSide!=='enemy'||!view.validTargetIds.length||view.validTargetIds.some(id=>!view.enemies.some(e=>e.instanceId===id&&e.hp>0&&!e.unusual?.departed)):!view.validTargetIds.includes(view.selectedTargetInstanceId)):view.selectedTargetInstanceId!==null)||
      (['victory','defeat','escape'].includes(view.phase)?view.terminalOutcome!==view.phase:view.terminalOutcome!==null))fail();
  if(!Array.isArray(view.allyActions)||!Object.isFrozen(view.allyActions)||view.allyActions.some(action=>
      !Object.isFrozen(action)||!view.party.some(m=>m.instanceId===action.actorId)||
      (Object.hasOwn(action,'targetId')&&![...view.party,...view.enemies].some(m=>m.instanceId===action.targetId))))fail();
  if(playing) {
    const frame=view.playbackFrame;
    if(!Object.isFrozen(frame)||frame.party.length!==view.party.length||frame.enemies.length!==view.enemies.length||
        frame.party.some((m,i)=>m.instanceId!==view.party[i].instanceId||m.hp!==view.party[i].hp)||
        frame.enemies.some((m,i)=>m.instanceId!==view.enemies[i].instanceId||m.hp!==view.enemies[i].hp))fail();
  }
  const count=view.enemies.length,width=count===2?232:144,step=count===2?248:168,start=16;
  const names=view.enemies.map(m=>m.name);
  const enemies=view.enemies.map((member,index)=>{
    const sprite=partyBattleEnemySprite(member.id),template=ENEMY_TEMPLATE_REGISTRY[member.id],bounds=sprite&&
      (FORMATION_SPRITE_BOUNDS.get(sprite.draw)||PARTY_COMBAT_EXTRA_ENEMY_BOUNDS[member.id]||
        (canonicalEnemyIsCompatible(template)?PARTY_COMBAT_DEFAULT_ENEMY_BOUNDS:null));
    if(!sprite||!bounds)fail();
    if(staging){
      const p=staging.enemies[index],x=count===1?16:start+index*step;
      // Alive beetles cycle independently; defeat and departure hold the neutral
      // pose. All frames retain exactly the same floor contact and height.
      const frame=member.hp>0&&!member.unusual?.departed
        ?SERA_LIORA_SCENE_METRICS.cycle[Math.floor((view.presentationSeconds+index*.2)/.2)%SERA_LIORA_SCENE_METRICS.cycle.length]:1;
      return Object.freeze({instanceId:member.instanceId,slot:index,composition:'scene',
        x,width:count===1?480:width,label:member.name+(count>1?' '+String.fromCharCode(65+index):''),
        spriteX:0,spriteY:64,spriteWidth:512,spriteHeight:233,scale:staging.scale,
        anchorX:p.x,anchorY:p.y,targetCursorX:p.x,targetCursorY:p.y-staging.height-16,
        frame,height:staging.height});
    }
    if(count===1) {
      const p=SINGLETON_ENEMY_BATTLE_LAYOUT;
      return Object.freeze({instanceId:member.instanceId,slot:index,composition:'singleton',x:p.hpX,width:p.hpWidth,
        label:member.name,spriteX:0,spriteY:0,spriteWidth:512,spriteHeight:297,scale:1,
        anchorX:p.anchorX,anchorY:view.enemyFloorY??p.anchorY,targetCursorX:p.targetCursorX,targetCursorY:p.targetCursorY});
    }
    const x=start+index*step,spriteWidth=width-16,scale=Math.min(1,spriteWidth/(bounds[2]-bounds[0]),136/(bounds[3]-bounds[1]));
    return Object.freeze({instanceId:member.instanceId,slot:index,composition:'formation',x,width,
      label:member.name+(names.filter(name=>name===member.name).length>1?' '+String.fromCharCode(65+index):''),
      spriteX:x+8,spriteY:76,spriteWidth,spriteHeight:136,scale,
      anchorX:x+width/2-scale*(bounds[0]+bounds[2])/2,anchorY:enemyFloorY-scale*bounds[3]});
  });
  const allies=view.party.map((member,slot)=>Object.freeze({instanceId:member.instanceId,slot,
    ...(staging?{scene:true,x:staging.allies[slot].x,anchorY:staging.allies[slot].y,feetY:staging.allies[slot].y}:
      {x:PARTY_COMBAT_ALLY_SLOTS[slot].x,anchorY:PARTY_COMBAT_ALLY_SLOTS[slot].anchorY,feetY:277})}));
  let target=null;
  if(view.phase==='targeting'&&view.targetMode!=='all') {
    const source=view.targetSide==='ally'?allies:enemies,position=source.find(p=>p.instanceId===view.selectedTargetInstanceId);
    if(!position)fail();
    target=Object.freeze({side:view.targetSide,instanceId:position.instanceId,slot:position.slot,
      x:view.targetSide==='ally'?position.x:(position.targetCursorX??position.x+position.width/2),
      y:view.targetSide==='ally'?(position.scene?position.anchorY-103:190):(position.targetCursorY??63)});
  }
  return Object.freeze({allies:Object.freeze(allies),enemies:Object.freeze(enemies),target,...(view.phase==='targeting'&&view.targetMode==='all'?{targetIds:Object.freeze([...view.validTargetIds])}:{})});
}

function formatPartyBattleEvent(view) {
  if(!view.playbackFrame) {
    if(view.phase==='awaiting_action') {
      const actor=view.party.find(member=>member.instanceId===view.nextActorId);
      return `Choose ${actor.name}'s action.`;
    }
    if(view.phase==='item')return 'Choose an item.';
    if(view.phase==='technique')return 'Choose a Resonance technique.';
    if(view.phase==='targeting') {
      if(view.targetMode==='all')return 'Confirm all living enemies.';
      const actor=view.party.find(m=>m.instanceId===view.nextActorId);
      if(view.targetSide==='ally')return `Choose ${actor?.name||'an ally'}'s target.`;
      return view.pendingCommandType==='observe'?'Choose an enemy to observe.':'Choose a target.';
    }
    if(view.phase==='ready')return 'Confirm actions?';
    if(view.phase==='victory')return 'Victory.';
    if(view.phase==='defeat')return 'Defeat.';
    if(view.phase==='escape')return 'The party escapes.';
    return '';
  }
  const event=view.playbackFrame.currentEvent;
  if(view.playbackFrame.complete&&view.playbackFrame.outcome!=='ongoing')return view.playbackFrame.outcome==='victory'?'Victory.':
    view.playbackFrame.outcome==='defeat'?'Defeat.':view.playbackFrame.outcome==='escape'?'The party escapes.':'';
  if(!event)return 'Ready.';
  const members=[...view.party,...view.enemies],name=id=>members.find(m=>m.instanceId===id)?.name;
  const actor=name(event.actorId),target=name(event.targetId);
  if(event.type==='outcome')return event.outcome==='victory'?'Victory.':event.outcome==='defeat'?'Defeat.':event.outcome==='escape'?'The party escapes.':'Round complete.';
  if(event.type==='round_end') {
    const expired=event.effectsBefore.find((before,i)=>before.evadeTurns>0&&event.effectsAfter[i].evadeTurns===0);
    return expired?`Bullet Time wears off for ${name(expired.actorId)}.`:'Round complete.';
  }
  if(event.type==='resonance_damage')return `${event.participantIds.map(name).join(' and ')} use${event.participantIds.length===1?'s':''} ${event.techniqueName}. ${target} takes ${event.appliedDamage} ${event.elements.map(id=>id[0].toUpperCase()+id.slice(1)).join('/')} damage.`;
  if(event.type==='resonance')return `${event.participantIds.map(name).join(' and ')} use${event.participantIds.length===1?'s':''} ${event.techniqueName}. ${target} recovers ${event.appliedHealing} HP.`;
  if(event.type==='strain')return event.reason==='application'?`${name(event.actorId)} needs ${event.after} recovery round${event.after===1?'':'s'}.`:
    event.after===0?`${name(event.actorId)}'s Strain clears.`:`${name(event.actorId)} has ${event.after} Strain remaining.`;
  if(event.type==='resonance_damage_all')return `${event.participantIds.map(name).join(' and ')} use ${event.techniqueName}. ${event.elements.map(id=>id[0].toUpperCase()+id.slice(1)).join('/')} damage: ${event.hits.map(hit=>name(hit.targetId)+' '+hit.appliedDamage).join('; ')}.`;
  if(event.type==='resonance_cancel')return `The shared technique is cancelled: ${name(event.unavailableId)} is unavailable.`;
  if(event.type==='slither_sample')return `${name(event.actorId)}'s speed shifts.`;
  if(event.type==='brace_check')return event.selected?`${actor} braces for the exchange!`:`${actor} prepares to attack.`;
  if(event.type==='brace')return `${actor} holds its brace instead of attacking.`;
  if(event.type==='brace_end')return `${actor}'s brace ends.`;
  if(event.type==='curse_check')return event.fumbled?`The curse twists ${name(event.actorId)}'s attack!`:`${name(event.actorId)} fights through the curse.`;
  if(event.type==='enemy_effect_check')return event.triggered?`${actor}'s ${event.capability.replaceAll('_',' ')} takes hold.`:`${actor}'s ${event.capability.replaceAll('_',' ')} fails to take hold.`;
  if(event.type==='enemy_status')return event.blocked?`${target}'s ${event.blocker} wards off ${event.status}.`:
    `${target} is afflicted with ${event.status}${event.status==='slither'?` (SPD ${event.slither.speedAfter})`:''}.`;
  if(event.type==='enemy_shard_burst')return event.warded?`${target}'s ${event.wardItem} turns the void splinter aside.`:
    `A void splinter bursts against ${target} for ${event.appliedDamage} damage.`;
  if(event.type==='enemy_corrosion')return `Acid corrodes ${target}'s defence (${event.after}/${event.cap}).`;
  if(event.type==='regeneration')return event.hpAfter>event.hpBefore?`${actor} regenerates ${event.hpAfter-event.hpBefore} HP.`:event.before.suppressedTurns>0?`${actor}'s regeneration is suppressed.`:`${actor} is at full health.`;
  if(event.type==='counter_check')return event.triggered?`${actor} counters ${target}!`:`${actor} does not counter.`;
  if(event.type==='counterattack')return event.evaded?`${target} evades ${actor}'s counter!`:`${actor}'s counter deals ${event.appliedDamage} damage to ${target}.`;
  if(event.type==='theft')return `${actor} steals ${event.amount} gold!`;
  if(event.type==='gold_recovered')return `Recovered ${event.amount} stolen gold from ${actor}.`;
  if(event.type==='departure')return `${actor} flies away!`;
  if(event.type==='skip'&&event.reason==='trollbane')return `${actor} is stunned by Trollbane.`;
  if(event.type==='skip')return event.reason==='actor_disabled'?`${actor} cannot act.`:`${actor} cannot act: defeated.`;
  if(event.type==='cancel')return `${actor}'s action on ${target} is cancelled.`;
  if(event.type==='attack')return event.evaded?`${target} evades ${actor}'s attack.`:
    event.brace?`${target} braces! ${actor} deals only ${event.appliedDamage} damage.`:
    `${event.critical?'Critical! ':''}${actor} attacks ${target} for ${event.appliedDamage} damage.`;
  if(event.type==='observe')return `${actor} observes ${target}. ${event.lines.join(' ')}`;
  if(event.type==='run')return !event.allowed?'Cannot escape this battle!':event.success?'The party escapes.':`${actor} tries to run, but cannot get away!`;
  if(event.type==='equipment')return `${actor} equips ${event.itemId}.`;
  if(event.type==='status') {
    const removed=event.statusesBefore.filter(s=>!event.statusesAfter.includes(s));
    const added=event.statusesAfter.filter(s=>!event.statusesBefore.includes(s));
    return removed.length?`${name(event.targetId)} is cured of ${removed.join(', ')}.`:
      added.length?`${name(event.targetId)} is afflicted with ${added.join(', ')}.`:'No status changes.';
  }
  if(event.type==='effect')return event.itemId==='Bullet Time'?`Bullet Time surrounds ${name(event.targetId)}.`:
    `${name(event.sourceId)} arms a bomb against ${name(event.targetId)}.`;
  if(event.type==='delayed_effect_tick')return event.effect==='bomb'?
    (event.appliedDamage?`The bomb ticks for ${event.appliedDamage} damage.`:'The bomb fuse burns down.'):
    `${name(event.targetId)} suffers ${event.appliedDamage} burn damage.`;
  if(event.type==='item') {
    const prefix=`${actor} uses ${event.itemId}${target?` on ${target}`:''}.`;
    if(event.effect==='heal') {
      const before=event.before.party.find(m=>m.instanceId===event.targetId),after=event.after.party.find(m=>m.instanceId===event.targetId);
      return `${prefix} ${target} recovers ${after.hp-before.hp} HP.`;
    }
    if(event.effect==='damage') {
      const before=event.before.enemies.find(m=>m.instanceId===event.targetId),after=event.after.enemies.find(m=>m.instanceId===event.targetId);
      return `${prefix} ${target} takes ${before.hp-after.hp} damage.`;
    }
    if(event.effect==='damage_all') {
      const losses=event.before.enemies.map((member,index)=>member.hp-event.after.enemies[index].hp),damage=losses.filter(value=>value>0);
      return `${prefix} ${!damage.length?'No effect.':damage.every(value=>value===damage[0])?`Every enemy takes ${damage[0]} damage.`:
        `The blast deals ${damage.reduce((sum,value)=>sum+value,0)} damage across the enemy group.`}`;
    }
    if(event.effect==='cure')return prefix;
    if(event.effect==='evade')return `${prefix} Time slows around ${target}.`;
    if(event.effect==='bomb')return `${prefix} The bomb is armed.`;
    if(event.effect==='reagent'&&event.before.enemies.some((e,i)=>e.hp>event.after.enemies[i].hp))return `${prefix} ${target} collapses.`;
    if(event.effect==='stun'&&event.after.enemies.some((e,i)=>e.unusual?.suppressedRound!==event.before.enemies[i].unusual?.suppressedRound))return `${prefix} ${target}'s regeneration is suppressed.`;
    return `${prefix} No effect.`;
  }
  throw new Error('Invalid party battle event type');
}

function drawPartyCombatTargetCursor(x,y) {
  ctx.fillStyle='#08121e';ctx.fillRect(x-9,y,18,12);
  ctx.fillStyle='#f0e8b8';ctx.beginPath();ctx.moveTo(x-6,y+2);ctx.lineTo(x+6,y+2);ctx.lineTo(x,y+10);ctx.closePath();ctx.fill();
}
function drawPartyCombatEnemy(member,position,selected) {
  if(position.composition==='singleton') {
    ctx.save();ctx.globalAlpha=member.unusual?.departed?0:member.hp===0?0.25:1;
    drawBattleEnemyTemplate(member.id,member.name,position.anchorX,position.anchorY);ctx.restore();
    drawSingletonEnemyBattleStatus(member,member.hp===0);
    if(member.braced&&member.hp>0){ctx.fillStyle='#c8a868';ctx.font='bold 9px "Courier New", monospace';ctx.fillText('BRACE',252,33,35);}
    if(member.unusual?.departed){ctx.fillStyle='#c8a868';ctx.font='bold 9px "Courier New", monospace';ctx.fillText('FLED',252,33,35);}
    if(selected&&member.hp>0&&!member.unusual?.departed)drawPartyCombatTargetCursor(position.targetCursorX,position.targetCursorY);
    return;
  }
  const sprite=ENEMY_SPRITE_DISPATCH[member.id]||partyBattleEnemySprite(member.id);ctx.save();ctx.beginPath();ctx.rect(position.spriteX,position.spriteY,position.spriteWidth,position.spriteHeight);ctx.clip();
  // Registered sprites own their optional defaults (pose or palette).
  if(position.composition==='scene'&&!member.unusual?.departed){
    ctx.fillStyle=member.hp===0?'rgba(31,28,23,0.10)':'rgba(31,28,23,0.30)';
    ctx.beginPath();ctx.ellipse(position.anchorX,position.anchorY+1,position.height*.65,4,0,0,Math.PI*2);ctx.fill();
  }
  ctx.translate(position.anchorX,position.anchorY);ctx.scale(position.scale,position.scale);ctx.globalAlpha=member.unusual?.departed?0:member.hp===0?0.25:1;
  if(position.composition==='scene')sprite.draw(0,0,{frame:position.frame});else sprite.draw(0,0);ctx.restore();
  ctx.fillStyle='#08121e';ctx.fillRect(position.x,12,position.width,50);ctx.fillStyle=member.hp===0?'#718078':'#c0dcd0';ctx.font='bold 12px "Courier New", monospace';ctx.fillText(position.label,position.x+4,27,position.width-8);
  ctx.fillStyle='#0a1e18';ctx.fillRect(position.x+4,36,position.width-8,7);ctx.fillStyle=member.hp===0?'#31483d':'#3a8a5a';ctx.fillRect(position.x+4,36,Math.round((position.width-8)*member.hp/member.maxHp),7);
  ctx.fillStyle=member.hp===0?'#66756d':'#7ab898';ctx.font='11px "Courier New", monospace';ctx.fillText(`${member.hp} / ${member.maxHp}`,position.x+4,57,position.width-8);
  if(member.braced&&member.hp>0){ctx.fillStyle='#c8a868';ctx.font='bold 9px "Courier New", monospace';ctx.fillText('BRACE',position.x+position.width-39,57,35);}
  if(member.unusual?.departed){ctx.fillStyle='#c8a868';ctx.font='bold 9px "Courier New", monospace';ctx.fillText('FLED',position.x+position.width-39,57,35);}
  if(selected&&member.hp>0&&!member.unusual?.departed)drawPartyCombatTargetCursor(position.targetCursorX??position.x+position.width/2,position.targetCursorY??63);
}
function drawPartyCombatAlly(member,position,targeted) {
  const sprite=PARTY_COMBAT_ALLY_SPRITES[member.characterId];if(!sprite)throw new Error('Invalid party battle ally sprite');
  ctx.save();ctx.globalAlpha=member.hp===0?0.25:1;
  if(position.scene){ctx.fillStyle='rgba(31,28,23,0.22)';ctx.beginPath();ctx.ellipse(position.x,position.feetY+1,15,3,0,0,Math.PI*2);ctx.fill();}
  sprite.draw(position.x,position.scene?position.anchorY:sprite.anchorY);ctx.restore();
  if(targeted&&member.hp>0)drawPartyCombatTargetCursor(position.x,position.scene?position.anchorY-103:190);
}
function drawPartyCombatStatusRow(member,row,effect,choosing=false,resonance=null) {
  const y=357+row*18,barX=102,segments=12,filled=Math.round(segments*member.hp/member.maxHp);
  ctx.fillStyle=member.hp===0?'#718078':choosing?'#e0f0e8':'#d0e0d0';ctx.font='bold 12px "Courier New", monospace';ctx.fillText(member.name,22,y,50);
  ctx.fillStyle=choosing?'#8ac8d8':'#5a8898';ctx.font='bold 11px "Courier New", monospace';ctx.fillText('HP',76,y);
  for(let i=0;i<segments;i++){ctx.fillStyle=i<filled?(filled<=3?(choosing?'#d0a040':'#a06820'):(choosing?'#78c88a':'#4a9a62')):'#112820';ctx.fillRect(barX+i*12,y-9,10,8);}
  ctx.fillStyle=member.hp===0?'#66756d':'#8aaa98';ctx.font='11px "Courier New", monospace';ctx.fillText(`${member.hp} / ${member.maxHp}`,251,y,68);
  const tags={poison:'PSN',muddied:'MUD',slither:'SLI',cursed:'CUR',burn:'BURN',dazzled:'DAZ'};
  const badges=[...(member.statuses||[]).map(s=>tags[s]||s.toUpperCase()),...(effect?.corrosion>0?[`COR ${effect.corrosion}`]:[]),...(effect?.evadeTurns>0?[`EVADE ${effect.evadeTurns}`]:[]),...(resonance?.rareBorn?[`Strain ${resonance.strain}`]:[])];
  ctx.fillStyle=member.hp===0?'#9a6868':'#c8a868';ctx.font='bold 9px "Courier New", monospace';ctx.fillText(member.hp===0?['DOWN',...(resonance?.rareBorn?[`Strain ${resonance.strain}`]:[])].join(' '):badges.join(' '),323,y,164);
}
function drawPartyCombatCommands(view) {
  const hasResonance=view.commands.includes('resonance'),step=117,width=111;
  const labels={attack:'Attack',resonance:'Resonance',item:'Item',observe:'Observe',run:'Run'};
  view.commands.forEach((command,index)=>{
    const label=labels[command],x=22+index*step,selected=view.phase==='awaiting_action'&&index===view.commandCursor,
      enabled=(view.commandAvailability?.find(row=>row.command===command)?.enabled??
        (command==='resonance'?view.enabledCommands?.includes(command):true))&&(command!=='item'||view.inventory.length>0);
    ctx.fillStyle=selected?'#0e2434':'#080f1a';ctx.fillRect(x,414,width,38);ctx.strokeStyle=selected?'#9ac8d8':'#2a4e5e';ctx.strokeRect(x,414,width,38);
    ctx.fillStyle=enabled?(selected?'#e0f0e8':'#6b8890'):'#344f5a';ctx.font=`bold ${hasResonance?12:13}px "Courier New", monospace`;ctx.fillText((selected?'▶ ':'')+label,x+(hasResonance?5:7),439,99);
  });
}
function drawPartyCombatTechniques(view) {
  view.techniques.slice(0,3).forEach((row,i)=>{
    ctx.fillStyle=i===view.techniqueCursor?'#d0e0d0':'#6b8890';ctx.font='bold 12px "Courier New", monospace';
    ctx.fillText((i===view.techniqueCursor?'▶ ':'  ')+row.name+' — '+row.strain.join('/')+' round Strain',22,414+i*18,458);
  });
}
function drawPartyCombatItems(view) {
  const rows=view.items.slice(view.itemScroll,view.itemScroll+3);
  rows.forEach((row,i)=>{const index=view.itemScroll+i,selected=index===view.itemCursor,label=`${row.name} ×${row.available}`;
    ctx.fillStyle=row.usable?(selected?'#d0e0d0':'#6b8890'):'#344f5a';ctx.font='bold 12px "Courier New", monospace';ctx.fillText((selected?'▶ ':'  ')+label,22,414+i*18,438);});
  ctx.fillStyle='#8ac8d8';ctx.font='12px "Courier New", monospace';if(view.itemScroll>0)ctx.fillText('↑',475,414);if(view.itemScroll+3<view.items.length)ctx.fillText('↓',475,450);
}

function drawPartyBattle(view) {
  if(arguments.length!==1)throw new Error('Party battle renderer requires one immutable view');
  if(!view.active)return false;
  const layout=partyBattleLayout(view),message=formatPartyBattleEvent(view);
  ctx.save();
  if(view.backgroundAssetId){
    const asset=IMAGE_ASSET_REGISTRY[view.backgroundAssetId],image=loadedImageAsset(view.backgroundAssetId);
    if(!asset||asset.use!=='cutaway_background'||asset.width!==512||asset.height!==480||!image)throw Error('Invalid party battle background');
    const staging=PARTY_BATTLE_SCENE_STAGING[view.stagingId];
    if(staging){
      // Cover the whole previous scene, including the margins outside the UI.
      ctx.fillStyle='#08121e';ctx.fillRect(0,0,512,480);
      ctx.drawImage(image,0,staging.cropY,512,297,0,0,512,297);
    }
    else ctx.drawImage(image,0,0,512,480);
  }else drawBattleBackground();
  layout.enemies.forEach((position,slot)=>drawPartyCombatEnemy(view.enemies[slot],position,layout.targetIds?.includes(position.instanceId)||layout.target?.side==='enemy'&&layout.target.instanceId===position.instanceId));
  layout.allies.forEach((position,slot)=>drawPartyCombatAlly(view.party[slot],position,
    layout.target?.side==='ally'&&layout.target.instanceId===position.instanceId));
  partyBattleQuickbloomAnimation.draw(view);
  partyBattleOffensiveResonanceAnimation.draw(view);
  ctx.fillStyle='#08121e';ctx.fillRect(8,297,496,175);ctx.strokeStyle='#5a8a9a';ctx.lineWidth=2;ctx.strokeRect(9,298,494,173);ctx.strokeStyle='#2a4e5e';ctx.lineWidth=1;ctx.strokeRect(13,302,486,165);
  ctx.fillStyle='#8ac8d8';[[9,298],[501,298],[9,469],[501,469]].forEach(([x,y])=>ctx.fillRect(x,y,2,2));
  ctx.fillStyle='#ccd8cc';ctx.font='14px "Courier New", monospace';const lines=wrapMonospaceText(ctx,message,468);lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,22,325+i*16,468));
  const choosingActorId=['awaiting_action','item','technique','targeting'].includes(view.phase)?view.nextActorId:null;
  ctx.fillStyle='#1e3040';ctx.fillRect(22,348,468,1);view.party.forEach((member,i)=>drawPartyCombatStatusRow(member,i,view.effects[i],member.instanceId===choosingActorId,view.resonance?.find(c=>c.actorId===member.instanceId)));ctx.fillStyle='#1e3040';ctx.fillRect(22,403,468,1);
  if(view.phase==='technique')drawPartyCombatTechniques(view);else if(view.phase==='item')drawPartyCombatItems(view);else if(['awaiting_action','targeting'].includes(view.phase))drawPartyCombatCommands(view);
  else if(view.playbackFrame)lines.slice(2,5).forEach((line,i)=>ctx.fillText(line,22,418+i*15,468));
  ctx.restore();return true;
}

// Pure adapters reuse the approved measured cutaway assets at one battle scale.
function drawStoryBattleSera(x,y) {
  ctx.save();ctx.translate(x,y);ctx.scale(0.62,0.62);
  drawSeraLioraSceneSera({x:0,y:0,facing:'right',frame:1});ctx.restore();
}
function drawStoryBattleLiora(x,y) {
  ctx.save();ctx.translate(x,y);ctx.scale(0.62,0.62);
  drawSeraLioraCourtyardLiora({x:0,y:0,facing:'right',frame:1});ctx.restore();
}
