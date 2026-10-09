'use strict';

// Read-only presentation for the isolated Party Combat Lab. The normal render
// loop does not call this file; a later visible Lab may opt into this function.
// Its sole combat-state input is one detached immutable Lab snapshot.
const PARTY_COMBAT_LAB_ENEMY_COLORS = Object.freeze({
  enemy_marsh_wisp:'#48b8c8',
  enemy_briar_hound:'#587a3c',
  enemy_reed_grappler:'#7d7052',
  enemy_silt_lurker:'#695f78',
  enemy_sluice_slime:'#6e9a48',
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
      !Array.isArray(view.party) || !Object.isFrozen(view.party) || view.party.length!==2 ||
      !Array.isArray(view.enemies) || !Object.isFrozen(view.enemies) ||
      view.enemies.length<1 || view.enemies.length>3 ||
      view.party.some((member,slot)=>!validMember(member,'ally',slot)) ||
      view.enemies.some((member,slot)=>!validMember(member,'enemy',slot)))fail();
  const ids=[...view.party,...view.enemies].map(member=>member.instanceId);
  if(new Set(ids).size!==ids.length)fail();
  const playback=['playback','playback_complete','victory','defeat'].includes(view.phase);
  if(playback!==!!view.playbackFrame ||
      (view.phase==='collecting' && !view.party.some(member=>member.hp>0&&member.instanceId===view.nextActorId)) ||
      (view.phase!=='collecting' && view.nextActorId!==null) ||
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
  const enemyWidth=view.enemies.length===1?200:view.enemies.length===2?224:160;
  const enemyGap=view.enemies.length===1?0:view.enemies.length===2?16:8;
  const total=view.enemies.length*enemyWidth+(view.enemies.length-1)*enemyGap;
  const enemyStart=Math.floor((512-total)/2);
  return Object.freeze({
    allies:Object.freeze(view.party.map((member,slot)=>Object.freeze({
      instanceId:member.instanceId,slot,x:slot===0?20:266,y:224,width:226,height:104,
    }))),
    enemies:Object.freeze(view.enemies.map((member,slot)=>Object.freeze({
      instanceId:member.instanceId,slot,x:enemyStart+slot*(enemyWidth+enemyGap),y:36,width:enemyWidth,height:166,
    }))),
  });
}

function formatPartyCombatLabEvent(view) {
  const frame=view.playbackFrame;
  if(!frame) {
    if(view.phase==='collecting')return `${view.party.find(member=>member.instanceId===view.nextActorId).name} is choosing.`;
    return 'Commands prepared. Round not committed.';
  }
  const event=frame.currentEvent;
  if(!event)return `Round ${frame.completedRounds+1}: ready.`;
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

function drawPartyCombatLabHp(member,x,y,width) {
  ctx.fillStyle='#112820';ctx.fillRect(x,y,width,8);
  ctx.fillStyle=member.hp===0?'#603838':'#4a9a62';
  ctx.fillRect(x,y,Math.round(width*member.hp/member.maxHp),8);
  ctx.fillStyle='#9ab8a8';ctx.font='11px "Courier New", monospace';
  ctx.fillText(`${member.hp} / ${member.maxHp}`,x,y+22,width);
}

function drawPartyCombatLabMember(member,position,side,choosing) {
  const defeated=member.hp===0;
  ctx.fillStyle=choosing?'#162f3a':'#101c28';ctx.fillRect(position.x,position.y,position.width,position.height);
  ctx.strokeStyle=choosing?'#e2c76f':'#42697a';ctx.lineWidth=choosing?3:1;
  ctx.strokeRect(position.x+1,position.y+1,position.width-2,position.height-2);
  ctx.fillStyle=defeated?'#8a7474':'#d4e0d6';ctx.font='bold 13px "Courier New", monospace';
  ctx.fillText(member.name,position.x+10,position.y+21,position.width-20);
  if(choosing) {
    ctx.fillStyle='#e2c76f';ctx.font='bold 10px "Courier New", monospace';
    ctx.fillText('CHOOSING',position.x+position.width-72,position.y+21,62);
  }
  if(side==='ally') {
    const gx=position.x+32,gy=position.y+57;
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(gx-16,gy+17,32,5);
    ctx.fillStyle=member.characterId==='lely_lab'?'#5c7090':'#3a6868';ctx.fillRect(gx-11,gy-5,22,24);
    ctx.fillStyle='#b58a6a';ctx.fillRect(gx-7,gy-20,14,15);
    ctx.fillStyle=member.characterId==='lely_lab'?'#302418':'#2a9a28';ctx.fillRect(gx-8,gy-23,16,6);
    if(member.characterId==='esla_lab') {ctx.fillRect(gx-9,gy-18,3,25);ctx.fillRect(gx+6,gy-18,3,25);}
    drawPartyCombatLabHp(member,position.x+68,position.y+49,position.width-80);
  } else {
    const color=PARTY_COMBAT_LAB_ENEMY_COLORS[member.id]||'#687080';
    const cx=position.x+position.width/2;
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(cx-34,position.y+105,68,8);
    ctx.fillStyle=color;ctx.fillRect(cx-28,position.y+50,56,54);
    ctx.fillStyle='#17202a';ctx.fillRect(cx-15,position.y+69,8,8);ctx.fillRect(cx+7,position.y+69,8,8);
    drawPartyCombatLabHp(member,position.x+10,position.y+126,position.width-20);
  }
  if(defeated) {
    ctx.fillStyle='#d08a8a';ctx.font='bold 11px "Courier New", monospace';
    ctx.fillText('DEFEATED',position.x+10,position.y+position.height-10,position.width-20);
  }
}

function drawPartyCombatLabBattle() {
  if(arguments.length)throw new Error('Party Combat Lab renderer takes no arguments');
  const view=partyCombatLab.getView();
  if(!view.active)return false;
  // Complete validation and event formatting before the first canvas call.
  const layout=partyCombatLabBattleLayout(view),eventText=formatPartyCombatLabEvent(view);
  const labels=new Map([...view.party,...view.enemies].map(member=>[member.instanceId,member.name]));
  const actions=view.allyActions.map(action=>`${labels.get(action.actorId)} → ${labels.get(action.targetId)}`);
  if(actions.some(label=>label.includes('undefined')))throw new Error('Invalid Party Combat Lab submitted action');
  ctx.save();
  ctx.fillStyle='#070e18';ctx.fillRect(0,0,512,480);
  ctx.fillStyle='#142438';ctx.fillRect(0,202,512,278);
  ctx.fillStyle='#9ac8d8';ctx.font='bold 14px "Courier New", monospace';
  ctx.fillText(view.label,16,24,480);
  layout.enemies.forEach((position,slot)=>drawPartyCombatLabMember(view.enemies[slot],position,'enemy',false));
  layout.allies.forEach((position,slot)=>drawPartyCombatLabMember(view.party[slot],position,'ally',
    view.phase==='collecting'&&view.nextActorId===view.party[slot].instanceId));
  ctx.fillStyle='#08121e';ctx.fillRect(12,340,488,128);
  ctx.strokeStyle='#42697a';ctx.lineWidth=1;ctx.strokeRect(13,341,486,126);
  ctx.fillStyle='#d4e0d6';ctx.font='12px "Courier New", monospace';ctx.fillText(eventText,24,365,464);
  ctx.fillStyle='#7898a2';ctx.font='10px "Courier New", monospace';
  ctx.fillText(actions.length?'SUBMITTED: '+actions.join('  |  '):'SUBMITTED: none',24,389,464);
  const phase=view.phase==='playback_complete'?'FINAL FRAME — ACKNOWLEDGEMENT PENDING':
    view.phase==='victory'?'VICTORY — FINAL FRAME':view.phase==='defeat'?'DEFEAT — FINAL FRAME':view.phase.toUpperCase();
  ctx.fillStyle=['victory','defeat'].includes(view.phase)?'#e2c76f':'#8ab3c2';
  ctx.font='bold 11px "Courier New", monospace';ctx.fillText(phase,24,416,464);
  if(view.playbackFrame) {
    ctx.fillStyle='#7898a2';ctx.font='10px "Courier New", monospace';
    ctx.fillText(`FRAME ${view.playbackFrame.frameIndex}  EVENT ${view.playbackFrame.eventIndex}  ROUNDS ${view.playbackFrame.completedRounds}`,24,441,464);
  } else {
    ctx.fillStyle='#566f7a';ctx.font='10px "Courier New", monospace';ctx.fillText('READ-ONLY PARTY COMBAT LAB',24,441,464);
  }
  ctx.restore();
  return true;
}
