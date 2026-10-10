'use strict';

// Read-only presentation for the isolated Party Combat Lab. Its sole
// combat-state input is one detached immutable Lab snapshot.
const PARTY_COMBAT_ALLY_SLOTS = Object.freeze([
  Object.freeze({slot:0, x:108, anchorY:254}),
  Object.freeze({slot:1, x:256, anchorY:263}),
  Object.freeze({slot:2, x:404, anchorY:254}),
]);

const PARTY_COMBAT_ALLY_SPRITES = Object.freeze({
  lely_lab:Object.freeze({draw:drawBattlePlayer, anchorY:254}),
  esla_lab:Object.freeze({draw:drawBattleEsla, anchorY:263}),
});

function partyCombatLabBattleLayout(view) {
  const fail=()=>{throw new Error('Invalid Party Combat Lab presentation view');};
  const validMember=(member,side,slot)=>member && Object.isFrozen(member) &&
    member.slot===slot && typeof member.instanceId==='string' && member.instanceId &&
    typeof member.name==='string' && member.name.trim() &&
    Number.isSafeInteger(member.hp) && Number.isSafeInteger(member.maxHp) &&
    member.maxHp>0 && member.hp>=0 && member.hp<=member.maxHp &&
    (side==='ally' ? typeof member.characterId==='string' : typeof member.id==='string');
  if(!view || !Object.isFrozen(view) || view.active!==true || typeof view.label!=='string' || !view.label ||
      !['collecting','ready','playback','playback_complete','victory','defeat'].includes(view.phase) ||
      !Array.isArray(view.party) || !Object.isFrozen(view.party) ||
      view.party.length<1 || view.party.length>3 ||
      !Array.isArray(view.enemies) || !Object.isFrozen(view.enemies) ||
      view.enemies.length<1 || view.enemies.length>3 ||
      view.party.some((member,slot)=>!validMember(member,'ally',slot)) ||
      view.enemies.some((member,slot)=>!validMember(member,'enemy',slot)))fail();
  const ids=[...view.party,...view.enemies].map(member=>member.instanceId);
  if(new Set(ids).size!==ids.length)fail();
  const playback=['playback','playback_complete','victory','defeat'].includes(view.phase);
  const livingTargetIds=view.enemies.filter(member=>member.hp>0).map(member=>member.instanceId);
  if(playback!==!!view.playbackFrame ||
      (view.phase==='collecting' && !view.party.some(member=>member.hp>0&&member.instanceId===view.nextActorId)) ||
      (view.phase!=='collecting' && view.nextActorId!==null) ||
      !Array.isArray(view.livingTargetIds) || !Object.isFrozen(view.livingTargetIds) ||
      view.livingTargetIds.length!==livingTargetIds.length ||
      view.livingTargetIds.some((id,index)=>id!==livingTargetIds[index]) ||
      (view.phase==='collecting'
        ? !livingTargetIds.includes(view.selectedTargetInstanceId)
        : view.selectedTargetInstanceId!==null) ||
      (['victory','defeat'].includes(view.phase) ? view.terminalOutcome!==view.phase : view.terminalOutcome!==null))fail();
  if(!Array.isArray(view.allyActions) || !Object.isFrozen(view.allyActions) ||
      view.allyActions.some(action=>!Object.isFrozen(action) ||
        !view.party.some(member=>member.instanceId===action.actorId) ||
        !view.enemies.some(member=>member.instanceId===action.targetId)))fail();
  if(playback) {
    const frame=view.playbackFrame;
    if(!Object.isFrozen(frame) || !Array.isArray(frame.party) || !Array.isArray(frame.enemies) ||
        frame.party.length!==view.party.length || frame.enemies.length!==view.enemies.length ||
        frame.party.some((member,slot)=>member.instanceId!==view.party[slot].instanceId || member.hp!==view.party[slot].hp) ||
        frame.enemies.some((member,slot)=>member.instanceId!==view.enemies[slot].instanceId || member.hp!==view.enemies[slot].hp))fail();
  }

  const count=view.enemies.length;
  const width=count===2?232:144, step=count===2?248:168;
  const start=count===1?184:16;
  const names=view.enemies.map(member=>member.name);
  const enemies=view.enemies.map((member,index)=>{
    const sprite=ENEMY_SPRITE_DISPATCH[member.id];
    const bounds=sprite&&FORMATION_SPRITE_BOUNDS.get(sprite.draw);
    if(!sprite || !bounds)fail();
    const x=start+index*step, spriteWidth=width-16;
    const scale=Math.min(1,spriteWidth/(bounds[2]-bounds[0]),136/(bounds[3]-bounds[1]));
    const duplicate=names.filter(name=>name===member.name).length>1;
    return Object.freeze({instanceId:member.instanceId,slot:index,x,width,
      label:member.name+(duplicate?' '+String.fromCharCode(65+index):''),
      spriteX:x+8,spriteY:76,spriteWidth,spriteHeight:136,scale,
      anchorX:x+width/2-scale*(bounds[0]+bounds[2])/2,
      anchorY:212-scale*bounds[3]});
  });
  return Object.freeze({
    allies:Object.freeze(view.party.map((member,slot)=>Object.freeze({
      instanceId:member.instanceId,slot,x:PARTY_COMBAT_ALLY_SLOTS[slot].x,
      anchorY:PARTY_COMBAT_ALLY_SLOTS[slot].anchorY,feetY:277,
    }))),
    enemies:Object.freeze(enemies),
    target:view.phase==='collecting' ? Object.freeze((()=>{
      const position=enemies.find(enemy=>enemy.instanceId===view.selectedTargetInstanceId);
      if(!position)fail();
      return {instanceId:position.instanceId,slot:position.slot,x:position.x+position.width/2,y:63};
    })()) : null,
  });
}

function formatPartyCombatLabEvent(view) {
  const frame=view.playbackFrame;
  if(!frame) {
    if(view.phase==='collecting') {
      const member=view.party.find(entry=>entry.instanceId===view.nextActorId);
      return member&&member.slot===0?'Choose a target.':`Choose ${member.name}'s target.`;
    }
    return 'Confirm actions?';
  }
  const event=frame.currentEvent;
  if(!event)return 'Ready.';
  const members=[...view.party,...view.enemies];
  const name=id=>members.find(member=>member.instanceId===id)?.name;
  if(event.type==='round_end')return event.outcome==='victory'?'Victory.':event.outcome==='defeat'?'Defeat.':'Round complete.';
  const actor=name(event.actorId),target=name(event.targetId);
  if(!actor || !target)throw new Error('Invalid Party Combat Lab event identity');
  if(event.type==='skip')return `${actor} cannot act: defeated.`;
  if(event.type==='cancel')return `${actor}'s attack on ${target} is cancelled.`;
  if(event.type!=='attack')throw new Error('Invalid Party Combat Lab event type');
  if(event.evaded)return `${target} evades ${actor}'s attack.`;
  return `${event.critical?'Critical! ':''}${actor} attacks ${target} for ${event.appliedDamage} damage.`;
}

function drawPartyCombatEnemy(member,position,selected) {
  const sprite=ENEMY_SPRITE_DISPATCH[member.id];
  ctx.save();
  ctx.beginPath();ctx.rect(position.spriteX,position.spriteY,position.spriteWidth,position.spriteHeight);ctx.clip();
  ctx.translate(position.anchorX,position.anchorY);ctx.scale(position.scale,position.scale);
  ctx.globalAlpha=member.hp===0?0.25:1;sprite.draw(0,0,'idle');ctx.restore();
  ctx.fillStyle='#08121e';ctx.fillRect(position.x,12,position.width,50);
  ctx.fillStyle=member.hp===0?'#718078':'#c0dcd0';ctx.font='bold 12px "Courier New", monospace';
  ctx.fillText(position.label,position.x+4,27,position.width-8);
  ctx.fillStyle='#0a1e18';ctx.fillRect(position.x+4,36,position.width-8,7);
  ctx.fillStyle=member.hp===0?'#31483d':'#3a8a5a';
  ctx.fillRect(position.x+4,36,Math.round((position.width-8)*member.hp/member.maxHp),7);
  ctx.fillStyle=member.hp===0?'#66756d':'#7ab898';ctx.font='11px "Courier New", monospace';
  ctx.fillText(`${member.hp} / ${member.maxHp}`,position.x+4,57,position.width-8);
  if(selected&&member.hp>0) {
    const cx=position.x+position.width/2;
    ctx.fillStyle='#08121e';ctx.fillRect(cx-9,63,18,12);
    ctx.fillStyle='#f0e8b8';ctx.beginPath();ctx.moveTo(cx-6,65);ctx.lineTo(cx+6,65);ctx.lineTo(cx,73);ctx.closePath();ctx.fill();
  }
}

function drawPartyCombatAlly(member,position,choosing) {
  const sprite=PARTY_COMBAT_ALLY_SPRITES[member.characterId];
  if(!sprite)throw new Error('Invalid Party Combat Lab ally sprite');
  ctx.save();ctx.globalAlpha=member.hp===0?0.25:1;sprite.draw(position.x,sprite.anchorY);ctx.restore();
  if(choosing&&member.hp>0) {
    ctx.fillStyle='#08121e';ctx.fillRect(position.x-9,204,18,13);
    ctx.fillStyle='#f0e8b8';ctx.beginPath();ctx.moveTo(position.x-6,206);ctx.lineTo(position.x+6,206);ctx.lineTo(position.x,214);ctx.closePath();ctx.fill();
  }
}

function drawPartyCombatStatusRow(member,row) {
  const y=357+row*18,barX=102,segments=12,segmentW=10,gap=2;
  ctx.fillStyle=member.hp===0?'#718078':'#d0e0d0';ctx.font='bold 12px "Courier New", monospace';
  ctx.fillText(member.name,22,y,50);
  ctx.fillStyle='#5a8898';ctx.font='bold 11px "Courier New", monospace';ctx.fillText('HP',76,y);
  const filled=Math.round(segments*member.hp/member.maxHp);
  for(let i=0;i<segments;i++) {
    ctx.fillStyle=i<filled?(filled<=3?'#a06820':'#4a9a62'):'#112820';
    ctx.fillRect(barX+i*(segmentW+gap),y-11,segmentW,8);
  }
  ctx.fillStyle=member.hp===0?'#66756d':'#8aaa98';ctx.font='11px "Courier New", monospace';
  ctx.fillText(`${member.hp} / ${member.maxHp}`,251,y,68);
  if(member.hp===0) {ctx.fillStyle='#9a6868';ctx.font='bold 10px "Courier New", monospace';ctx.fillText('DOWN',323,y);}
}

function drawPartyCombatCommands() {
  ['Attack','Item','Observe','Run'].forEach((label,index)=>{
    const x=22+index*117,enabled=index===0;
    ctx.fillStyle=enabled?'#0e2434':'#080f1a';ctx.fillRect(x,414,111,38);
    ctx.strokeStyle=enabled?'#5a9aaa':'#1e3040';ctx.lineWidth=1;ctx.strokeRect(x,414,111,38);
    if(enabled) {ctx.fillStyle='#8ac8d8';ctx.font='bold 13px "Courier New", monospace';ctx.fillText('▶',x+6,439);}
    ctx.fillStyle=enabled?'#e0f0e8':'#344f5a';ctx.font=enabled?'bold 14px "Courier New", monospace':'13px "Courier New", monospace';
    ctx.fillText(label,x+(enabled?22:14),439);
  });
}

function drawPartyCombatLabBattle() {
  if(arguments.length)throw new Error('Party Combat Lab renderer takes no arguments');
  const view=partyCombatLab.getView();
  if(!view.active)return false;
  // Complete validation and event formatting before the first canvas call.
  const layout=partyCombatLabBattleLayout(view),message=formatPartyCombatLabEvent(view);
  ctx.save();drawBattleBackground();
  layout.enemies.forEach((position,slot)=>drawPartyCombatEnemy(view.enemies[slot],position,
    !!layout.target&&layout.target.instanceId===position.instanceId));
  layout.allies.forEach((position,slot)=>drawPartyCombatAlly(view.party[slot],position,
    view.phase==='collecting'&&view.nextActorId===view.party[slot].instanceId));

  ctx.fillStyle='#08121e';ctx.fillRect(8,297,496,175);
  ctx.strokeStyle='#5a8a9a';ctx.lineWidth=2;ctx.strokeRect(9,298,494,173);
  ctx.strokeStyle='#2a4e5e';ctx.lineWidth=1;ctx.strokeRect(13,302,486,165);
  ctx.fillStyle='#8ac8d8';[[9,298],[501,298],[9,469],[501,469]].forEach(([x,y])=>ctx.fillRect(x,y,2,2));
  ctx.fillStyle='#ccd8cc';ctx.font='14px "Courier New", monospace';ctx.fillText(message,22,325,468);
  ctx.fillStyle='#1e3040';ctx.fillRect(22,334,468,1);
  view.party.forEach(drawPartyCombatStatusRow);
  ctx.fillStyle='#1e3040';ctx.fillRect(22,403,468,1);
  drawPartyCombatCommands();
  ctx.restore();return true;
}
