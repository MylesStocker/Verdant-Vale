'use strict';

// Read-only presentation for the isolated Party Combat Lab. Its sole
// combat-state input is one detached immutable Lab/controller snapshot.
const PARTY_COMBAT_ALLY_SLOTS = Object.freeze([
  Object.freeze({slot:0,x:108,anchorY:254}),
  Object.freeze({slot:1,x:256,anchorY:263}),
  Object.freeze({slot:2,x:404,anchorY:254}),
]);
const PARTY_COMBAT_ALLY_SPRITES = Object.freeze({
  lely_lab:Object.freeze({draw:drawBattlePlayer,anchorY:254}),
  esla_lab:Object.freeze({draw:drawBattleEsla,anchorY:263}),
});
// Mulholland is a Party Lab-only boss scenario, not a supported Formation
// combatant. Keep his conservative presentation bounds with the Party Lab
// instead of requiring the Formation renderer to register an unrelated boss.
const PARTY_COMBAT_EXTRA_ENEMY_BOUNDS = Object.freeze({
  enemy_mulholland:Object.freeze([-53,-130,53,14]),
});

function partyCombatLabBattleLayout(view) {
  const fail=()=>{throw new Error('Invalid Party Combat Lab presentation view');};
  const validMember=(member,side,slot)=>member&&Object.isFrozen(member)&&member.slot===slot&&
    typeof member.instanceId==='string'&&member.instanceId&&typeof member.name==='string'&&member.name.trim()&&
    Number.isSafeInteger(member.hp)&&Number.isSafeInteger(member.maxHp)&&member.maxHp>0&&member.hp>=0&&member.hp<=member.maxHp&&
    (side==='ally'?typeof member.characterId==='string':typeof member.id==='string');
  const phases=['awaiting_action','item','targeting','ready','playback','playback_complete','victory','defeat','escape'];
  if(!view||!Object.isFrozen(view)||view.active!==true||view.commandSet!=='standard'||typeof view.label!=='string'||!view.label||
      !phases.includes(view.phase)||!Array.isArray(view.party)||!Object.isFrozen(view.party)||view.party.length<1||view.party.length>3||
      !Array.isArray(view.enemies)||!Object.isFrozen(view.enemies)||view.enemies.length<1||view.enemies.length>3||
      view.party.some((m,i)=>!validMember(m,'ally',i))||view.enemies.some((m,i)=>!validMember(m,'enemy',i)))fail();
  const ids=[...view.party,...view.enemies].map(m=>m.instanceId);
  if(new Set(ids).size!==ids.length)fail();
  const playing=['playback','playback_complete','victory','defeat','escape'].includes(view.phase);
  if(playing!==!!view.playbackFrame||
      (['awaiting_action','item','targeting'].includes(view.phase)
        ? !view.party.some(m=>m.hp>0&&m.instanceId===view.nextActorId):view.nextActorId!==null)||
      (view.phase==='targeting'?!view.validTargetIds.includes(view.selectedTargetInstanceId):view.selectedTargetInstanceId!==null)||
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
  const count=view.enemies.length,width=count===2?232:144,step=count===2?248:168,start=count===1?184:16;
  const names=view.enemies.map(m=>m.name);
  const enemies=view.enemies.map((member,index)=>{
    const sprite=ENEMY_SPRITE_DISPATCH[member.id],bounds=sprite&&
      (FORMATION_SPRITE_BOUNDS.get(sprite.draw)||PARTY_COMBAT_EXTRA_ENEMY_BOUNDS[member.id]);
    if(!sprite||!bounds)fail();
    const x=start+index*step,spriteWidth=width-16,scale=Math.min(1,spriteWidth/(bounds[2]-bounds[0]),136/(bounds[3]-bounds[1]));
    return Object.freeze({instanceId:member.instanceId,slot:index,x,width,
      label:member.name+(names.filter(name=>name===member.name).length>1?' '+String.fromCharCode(65+index):''),
      spriteX:x+8,spriteY:76,spriteWidth,spriteHeight:136,scale,
      anchorX:x+width/2-scale*(bounds[0]+bounds[2])/2,anchorY:212-scale*bounds[3]});
  });
  const allies=view.party.map((member,slot)=>Object.freeze({instanceId:member.instanceId,slot,
    x:PARTY_COMBAT_ALLY_SLOTS[slot].x,anchorY:PARTY_COMBAT_ALLY_SLOTS[slot].anchorY,feetY:277}));
  let target=null;
  if(view.phase==='targeting') {
    const source=view.targetSide==='ally'?allies:enemies,position=source.find(p=>p.instanceId===view.selectedTargetInstanceId);
    if(!position)fail();
    target=Object.freeze({side:view.targetSide,instanceId:position.instanceId,slot:position.slot,
      x:view.targetSide==='ally'?position.x:position.x+position.width/2,y:view.targetSide==='ally'?190:63});
  }
  return Object.freeze({allies:Object.freeze(allies),enemies:Object.freeze(enemies),target});
}

function formatPartyCombatLabEvent(view) {
  if(!view.playbackFrame) {
    if(view.phase==='awaiting_action') {
      const actor=view.party.find(member=>member.instanceId===view.nextActorId);
      return `Choose ${actor.name}'s action.`;
    }
    if(view.phase==='item')return 'Choose an item.';
    if(view.phase==='targeting') {
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
  if(event.type==='slither_sample')return `${name(event.actorId)}'s speed shifts.`;
  if(event.type==='curse_check')return event.fumbled?`The curse twists ${name(event.actorId)}'s attack!`:`${name(event.actorId)} fights through the curse.`;
  if(event.type==='skip')return `${actor} cannot act: defeated.`;
  if(event.type==='cancel')return `${actor}'s action on ${target} is cancelled.`;
  if(event.type==='attack')return event.evaded?`${target} evades ${actor}'s attack.`:
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
    return `${prefix} No effect.`;
  }
  throw new Error('Invalid Party Combat Lab event type');
}

function drawPartyCombatTargetCursor(x,y) {
  ctx.fillStyle='#08121e';ctx.fillRect(x-9,y,18,12);
  ctx.fillStyle='#f0e8b8';ctx.beginPath();ctx.moveTo(x-6,y+2);ctx.lineTo(x+6,y+2);ctx.lineTo(x,y+10);ctx.closePath();ctx.fill();
}
function drawPartyCombatEnemy(member,position,selected) {
  const sprite=ENEMY_SPRITE_DISPATCH[member.id];ctx.save();ctx.beginPath();ctx.rect(position.spriteX,position.spriteY,position.spriteWidth,position.spriteHeight);ctx.clip();
  ctx.translate(position.anchorX,position.anchorY);ctx.scale(position.scale,position.scale);ctx.globalAlpha=member.hp===0?0.25:1;sprite.draw(0,0,'idle');ctx.restore();
  ctx.fillStyle='#08121e';ctx.fillRect(position.x,12,position.width,50);ctx.fillStyle=member.hp===0?'#718078':'#c0dcd0';ctx.font='bold 12px "Courier New", monospace';ctx.fillText(position.label,position.x+4,27,position.width-8);
  ctx.fillStyle='#0a1e18';ctx.fillRect(position.x+4,36,position.width-8,7);ctx.fillStyle=member.hp===0?'#31483d':'#3a8a5a';ctx.fillRect(position.x+4,36,Math.round((position.width-8)*member.hp/member.maxHp),7);
  ctx.fillStyle=member.hp===0?'#66756d':'#7ab898';ctx.font='11px "Courier New", monospace';ctx.fillText(`${member.hp} / ${member.maxHp}`,position.x+4,57,position.width-8);
  if(selected&&member.hp>0)drawPartyCombatTargetCursor(position.x+position.width/2,63);
}
function drawPartyCombatAlly(member,position,targeted) {
  const sprite=PARTY_COMBAT_ALLY_SPRITES[member.characterId];if(!sprite)throw new Error('Invalid Party Combat Lab ally sprite');
  ctx.save();ctx.globalAlpha=member.hp===0?0.25:1;sprite.draw(position.x,sprite.anchorY);ctx.restore();
  if(targeted&&member.hp>0)drawPartyCombatTargetCursor(position.x,190);
}
function drawPartyCombatStatusRow(member,row,effect,choosing=false) {
  const y=357+row*18,barX=102,segments=12,filled=Math.round(segments*member.hp/member.maxHp);
  ctx.fillStyle=member.hp===0?'#718078':choosing?'#e0f0e8':'#d0e0d0';ctx.font='bold 12px "Courier New", monospace';ctx.fillText(member.name,22,y,50);
  ctx.fillStyle=choosing?'#8ac8d8':'#5a8898';ctx.font='bold 11px "Courier New", monospace';ctx.fillText('HP',76,y);
  for(let i=0;i<segments;i++){ctx.fillStyle=i<filled?(filled<=3?(choosing?'#d0a040':'#a06820'):(choosing?'#78c88a':'#4a9a62')):'#112820';ctx.fillRect(barX+i*12,y-9,10,8);}
  ctx.fillStyle=member.hp===0?'#66756d':'#8aaa98';ctx.font='11px "Courier New", monospace';ctx.fillText(`${member.hp} / ${member.maxHp}`,251,y,68);
  const tags={poison:'PSN',muddied:'MUD',slither:'SLI',cursed:'CUR',burn:'BURN',dazzled:'DAZ'};
  const badges=[...(member.statuses||[]).map(s=>tags[s]||s.toUpperCase()),...(effect?.evadeTurns>0?[`EVADE ${effect.evadeTurns}`]:[])];
  ctx.fillStyle=member.hp===0?'#9a6868':'#c8a868';ctx.font='bold 9px "Courier New", monospace';ctx.fillText(member.hp===0?'DOWN':badges.join(' '),323,y,164);
}
function drawPartyCombatCommands(view) {
  ['Attack','Item','Observe','Run'].forEach((label,index)=>{
    const x=22+index*117,selected=view.phase==='awaiting_action'&&index===view.commandCursor,enabled=label!=='Item'||view.inventory.length>0;
    ctx.fillStyle=selected?'#0e2434':'#080f1a';ctx.fillRect(x,414,111,38);ctx.strokeStyle=selected?'#9ac8d8':'#2a4e5e';ctx.strokeRect(x,414,111,38);
    ctx.fillStyle=enabled?(selected?'#e0f0e8':'#6b8890'):'#344f5a';ctx.font='bold 13px "Courier New", monospace';ctx.fillText((selected?'▶ ':'')+label,x+7,439,99);
  });
}
function drawPartyCombatItems(view) {
  const rows=view.items.slice(view.itemScroll,view.itemScroll+3);
  rows.forEach((row,i)=>{const index=view.itemScroll+i,selected=index===view.itemCursor,label=`${row.name} ×${row.available}`;
    ctx.fillStyle=row.usable?(selected?'#d0e0d0':'#6b8890'):'#344f5a';ctx.font='bold 12px "Courier New", monospace';ctx.fillText((selected?'▶ ':'  ')+label,22,414+i*18,438);});
  ctx.fillStyle='#8ac8d8';ctx.font='12px "Courier New", monospace';if(view.itemScroll>0)ctx.fillText('↑',475,414);if(view.itemScroll+3<view.items.length)ctx.fillText('↓',475,450);
}

function drawPartyCombatLabBattle() {
  if(arguments.length)throw new Error('Party Combat Lab renderer takes no arguments');
  const view=partyCombatLab.getView();if(!view.active)return false;
  const layout=partyCombatLabBattleLayout(view),message=formatPartyCombatLabEvent(view);
  ctx.save();drawBattleBackground();
  layout.enemies.forEach((position,slot)=>drawPartyCombatEnemy(view.enemies[slot],position,layout.target?.side==='enemy'&&layout.target.instanceId===position.instanceId));
  layout.allies.forEach((position,slot)=>drawPartyCombatAlly(view.party[slot],position,
    layout.target?.side==='ally'&&layout.target.instanceId===position.instanceId));
  ctx.fillStyle='#08121e';ctx.fillRect(8,297,496,175);ctx.strokeStyle='#5a8a9a';ctx.lineWidth=2;ctx.strokeRect(9,298,494,173);ctx.strokeStyle='#2a4e5e';ctx.lineWidth=1;ctx.strokeRect(13,302,486,165);
  ctx.fillStyle='#8ac8d8';[[9,298],[501,298],[9,469],[501,469]].forEach(([x,y])=>ctx.fillRect(x,y,2,2));
  ctx.fillStyle='#ccd8cc';ctx.font='14px "Courier New", monospace';const lines=wrapMonospaceText(ctx,message,468);lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,22,325+i*16,468));
  const choosingActorId=['awaiting_action','item','targeting'].includes(view.phase)?view.nextActorId:null;
  ctx.fillStyle='#1e3040';ctx.fillRect(22,348,468,1);view.party.forEach((member,i)=>drawPartyCombatStatusRow(member,i,view.effects[i],member.instanceId===choosingActorId));ctx.fillStyle='#1e3040';ctx.fillRect(22,403,468,1);
  if(view.phase==='item')drawPartyCombatItems(view);else if(['awaiting_action','targeting'].includes(view.phase))drawPartyCombatCommands(view);
  else if(view.playbackFrame)lines.slice(2,5).forEach((line,i)=>ctx.fillText(line,22,418+i*15,468));
  ctx.restore();return true;
}
